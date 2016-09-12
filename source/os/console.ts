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

        public lineSize = _DefaultFontSize
            + _DrawingContext.fontDescent(this.currentFont, this.currentFontSize)
            + _FontHeightMargin;
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

        private isChar(chr: string): boolean {
            return chr.length == 1;
            /*
            return (<any>['a','b','c','d','e','f','g','h',
                'i','j','k','l','m','n','o','p','q',
                'r','s','t','u','v','w','x','y','z',
                '0','1','2','3','4','5','6','7','8','9',
                ])
                .includes(chr.toLowerCase());
            */
        }

        public handleInput(): void {
            while (_KernelInputQueue.getSize() > 0) {
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
            let text: string = this.inputBuffer.charAt(this.inputBuffer.length - 1);
            let xOffset: number = _DrawingContext.measureText(
                this.currentFont,
                this.currentFontSize,
                text);
            this.currentXPosition = this.currentXPosition - xOffset;
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
            _DrawingContext.clearRect(
                this.currentXPosition,
                this.currentYPosition - _DefaultFontSize,
                this.currentXPosition + xOffset,
                this.currentYPosition + _DrawingContext.fontDescent(
                    this.currentFont, this.currentFontSize));

            if (this.consoleBuffer[this.consoleBuffer.length-1] == '\n')
                this.consoleBuffer = this.consoleBuffer
                    .substring(0, this.consoleBuffer.length - 2);
            else
                this.consoleBuffer = this.consoleBuffer
                    .substring(0, this.consoleBuffer.length - 1);
        }

        public putText(text: string): void {
            if (text == "\n") {
                this.advanceLine();
            } else if (text !== "") {
                // Draw the text at the current X and Y coordinates.
                var offset = _DrawingContext.measureText(
                    this.currentFont,
                    this.currentFontSize,
                    text);
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
            while (i < line.length) {
                var offset = _DrawingContext.measureText(
                    this.currentFont,
                    this.currentFontSize,
                    line.slice(0,i));
                if (localX + offset > _DisplayXRes) {
                    lines.push(line.slice(0,i-1));
                    //console.log("i: " + i);
                    //console.log("line0: " + line);
                    line = line.slice(i-1);
                    //console.log("line1: " + line);
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
            return lines;//.join('\n');
        }

        public advanceLine(): void {
            //if (this.cursorState)
                this.toggleCursor(false);
            this.currentXPosition = 0;
            this.currentYPosition += this.lineSize;
            this.consoleBuffer += "\n";

            // TODO: Handle scrolling. (iProject 1)
            //_DrawingContext.rect(0,0,500,500);
            //_DrawingContext.translate(10, 10);

            if (this.currentYPosition > _DisplayYRes) {
            //if (this.currentYPosition > (<any> document.getElementById('display')).height) {
                let tempBuffer: string = this.consoleBuffer.substring(this.consoleBuffer.indexOf("\n") + 1);
                this.clearScreen();
                this.resetXY();
                for (let i = 0; i < tempBuffer.length; i++) {
                    this.putText(tempBuffer.charAt(i));
                }
                this.consoleBuffer = tempBuffer;
            }
        }

        public toggleCursor(state: boolean): void {
            let x = this.currentXPosition;
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
