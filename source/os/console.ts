///<reference path="../globals.ts" />

/* ------------
     Console.ts

     Requires globals.ts

     The OS Console - stdIn and stdOut by default.
     Note: This is not the Shell. The Shell is the "command line interface" (CLI) or interpreter for this console.
     ------------ */

module TSOS {

    export class Console {

        constructor(public currentFont = _DefaultFontFamily,
                    public currentFontSize = _DefaultFontSize,
                    public currentXPosition = 0,
                    public currentYPosition = _DefaultFontSize,
                    public cursorState = false,
                    public commandHistory: string[] = [],
                    public consoleBuffer = "",
                    public inputBuffer = "",
                    private commandIndex = -1) {
        }

        // The measure of a line of text plus the line spacing
        public lineSize = _DefaultFontSize
            + _DrawingContext.fontDescent(this.currentFont, this.currentFontSize)
            + _FontHeightMargin;

        // The height of just the font characters (I think)
        public fontHeight = _DrawingContext
            .fontDescent(this.currentFont, this.currentFontSize)
            + _DefaultFontSize;

        public init(): void {
            this.clearScreen();
            this.resetXY();
        }

        private clearScreen(): void {
            this.consoleBuffer = "";
            _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
        }

        private resetXY(): void {
            this.currentXPosition = 0;
            this.currentYPosition = this.currentFontSize;
        }

        // Only clears the canvas; not the actual buffer
        public clearUserInput(): void {
            let tempBuffer: string = this.inputBuffer;
            while (this.inputBuffer.length > 0) {
                this.backspaceText();
                this.inputBuffer = this.inputBuffer
                    .substring(0, this.inputBuffer.length-1);
            }
            this.inputBuffer = tempBuffer;
        }

        // Get array of possible commands based on the current
        // input buffer; this array will be printed on the console
        private getTabArray(str: string): string[] {
            let results: string[] = [];
            let cl = _OsShell.commandList;
            for (let i = 0; i < cl.length; i++) {
                if (cl[i].command.indexOf(str) === 0) {
                    results.push(cl[i].command);
               }
            }
            return results;
        }

        // Get previous command; "historic" sounds better
        private getHistoricCommand(): string {
            if (this.commandHistory.length == 0)
                return "";
            if (this.commandIndex == -2) {
                this.commandIndex = this.commandHistory.length -1;
            } else if (this.commandIndex == -1) {
                this.commandIndex = 0;
            } else if (this.commandIndex >= this.commandHistory.length) {
                this.commandIndex = this.commandHistory.length;
                return "";
            }
            return this.commandHistory[this.commandIndex];
        }

        // This had more code in it at one point, but I figured the
        // legacy approach was better, so I just left it alone.
        private isChar(chr: string): boolean {
            return chr.length == 1;
        }

        public handleInput(): void {
            while (_KernelInputQueue.getSize() > 0) {
                // The input queue returns strings -- now to parse them
                let chr: any = _KernelInputQueue.dequeue();
                if (chr === 'enter') { // Enter
                    _OsShell.handleInput(this.inputBuffer);
                    this.commandHistory.push(this.inputBuffer);
                    this.commandIndex = -1;
                    this.inputBuffer = "";
                } else if (chr === 'backspace') { // Backspace
                    this.backspaceText();
                    this.inputBuffer = this.inputBuffer.substring(0, this.inputBuffer.length-1);
                } else if (chr === 'tab') { // Tab
                    let tempBuffer: string = this.inputBuffer;
                    // Erase the text of the user input and redraw it
                    // with the tab completed command.
                    let results = this.getTabArray(this.inputBuffer);
                    if (results.length == 1) {
                        this.clearUserInput();
                        this.inputBuffer = results[0];
                        this.putText(this.inputBuffer);
                    } else if (results.length > 1) {
                        this.advanceLine();
                        this.putText(results.join(' '));
                        this.advanceLine();
                        _OsShell.putPrompt();
                        this.putText(this.inputBuffer);
                    }
                } else if (chr === 'up') { // Up arrow
                    this.commandIndex -= 1;
                    this.clearUserInput();
                    this.inputBuffer = this.getHistoricCommand();
                    this.putText(this.inputBuffer);
                } else if (chr === 'down') { // Down arrow
                    this.commandIndex += 1;
                    this.clearUserInput();
                    this.inputBuffer = this.getHistoricCommand();
                    this.putText(this.inputBuffer);
                } else if (this.isChar(chr)) {
                    this.putText(chr);
                    this.inputBuffer += chr;
                } else if (chr === 'space') {
                    this.putText(' ');
                    this.inputBuffer += ' ';
                }
                // TODO: Write a case for Ctrl-C.
            }
        }

        public backspaceText(): void {
            // Remove one character from the input buffer
            let text: string = this.inputBuffer.charAt(this.inputBuffer.length - 1);
            // Width of the character to be removed
            let xOffset: number = _DrawingContext.measureText(
                this.currentFont,
                this.currentFontSize,
                text);
            this.currentXPosition = this.currentXPosition - xOffset;
            // If the backspace spans a linebreak
            if (this.currentXPosition < 0) {
                this.currentYPosition -= this.lineSize;
                let lines: string[] = this.consoleBuffer.split("\n");
                let length: number = _DrawingContext.measureText(
                    this.currentFont,
                    this.currentFontSize,
                    lines[lines.length-2]) - xOffset;
                this.currentXPosition = length;
            }
            // Bounds checking here
            // ^^ I think I do that
            _DrawingContext.clearRect(
                this.currentXPosition,
                this.currentYPosition - _DefaultFontSize,
                this.currentXPosition + xOffset,
                this.currentYPosition + _DrawingContext.fontDescent(
                    this.currentFont, this.currentFontSize));

            // Adjust the console buffer as needed
            if (this.consoleBuffer[this.consoleBuffer.length-1] == '\n')
                this.consoleBuffer = this.consoleBuffer
                    .substring(0, this.consoleBuffer.length - 2);
            else
                this.consoleBuffer = this.consoleBuffer
                    .substring(0, this.consoleBuffer.length - 1);
        }

        public putText(text: string): void {
            // Interpret newlines properly
            if (text == "\n") {
                this.advanceLine();
            } else if (text !== "") {
                // Draw the text at the current X and Y coordinates.
                var offset = _DrawingContext.measureText(
                    this.currentFont,
                    this.currentFontSize,
                    text);
                // If the text to be put runs too wide
                if (offset + this.currentXPosition > _DisplayXRes) {
                    if (text.length == 1) {
                        this.advanceLine();
                        this.putText(text);
                    } else {
                        let lines = this.lineWrapText(text);
                        for (let i = 0; i < lines.length; i++) {
                            if (lines[i] == "")
                                continue;
                            this.putText(lines[i]);
                            if (i < lines.length-1)
                                this.advanceLine();
                        }
                    }
                } else {
                    // Make sure the cursor doesn't get drawn in the wrong place
                    if (this.cursorState)
                        this.toggleCursor(false);

                    _DrawingContext.drawText(
                        this.currentFont,
                        this.currentFontSize,
                        this.currentXPosition,
                        this.currentYPosition,
                        text);
                    this.currentXPosition = this.currentXPosition + offset;
                    this.consoleBuffer += text;
                }
                // Move the current X position.
            }
        }

        // To handle line breaking
        private lineWrapText(text: string): string[] {
            if (this.currentXPosition > _DisplayXRes) {
                //this.advanceLine();
                //return [text];
            }

            let localX: number = this.currentXPosition;

            let lines: string[] = [];
            let i: number = 0;
            let line: string = text;
            // Iterate through the string to be printed and insert newlines
            // where needed.
            while (i < line.length) {
                var offset = _DrawingContext.measureText(
                    this.currentFont,
                    this.currentFontSize,
                    line.slice(0,i));
                if (localX + offset > _DisplayXRes) {
                    lines.push(line.slice(0,i-1));
                    line = line.slice(i-1);
                    localX = 0;
                    i = 0;
                }
                i++;
            }
            lines.push(line);
            if (lines[0] === text) {
                lines.push(lines[0]);
                lines[0] = "";
            }
            return lines;
        }

        public advanceLine(): void {
            this.toggleCursor(false);
            this.currentXPosition = 0;
            this.currentYPosition += this.lineSize;
            this.consoleBuffer += "\n";

            // TODO: Handle scrolling. (iProject 1)
            //_DrawingContext.rect(0,0,500,500);
            //_DrawingContext.translate(10, 10);

            // If the new line goes past the bottom of the screen
            if (this.currentYPosition > _DisplayYRes) {
                // Redraw the screen accept for the top line
                let tempBuffer: string = this.consoleBuffer.substring(this.consoleBuffer.indexOf("\n") + 1);
                this.clearScreen();
                this.resetXY();
                for (let i = 0; i < tempBuffer.length; i++) {
                    this.putText(tempBuffer.charAt(i));
                }
                this.consoleBuffer = tempBuffer;
            }
        }

        // Toggle the state of the blinking cursor
        public toggleCursor(state: boolean): void {
            let x = Math.floor(this.currentXPosition);
            let y = this.currentYPosition - _DefaultFontSize;
            let xSize = 10;
            let ySize = this.fontHeight;
            if (state) {
                _DrawingContext.strokeStyle = 'rgba(0,0,0,0)';
                // Make the fill slightly smaller so it is cleared completely
                _DrawingContext.fillRect(x+1, y+1, xSize-2, ySize-2);
                this.cursorState = true;
            } else {
                _DrawingContext.clearRect(x, y, xSize, ySize);
                this.cursorState = false;
            }
        }

    }

 }
