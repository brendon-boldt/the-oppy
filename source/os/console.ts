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
                    public consoleBuffer = "",
                    public inputBuffer = "",
                    private commandIndex = 0) {
        }

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

        private tabComplete(str: string): string {
            console.log("str: " + str);
            let cl = _OsShell.commandList;
            for (let i = 0; i < cl.length; i++) {
                let index: number = (this.commandIndex + i) % cl.length;
                if (cl[index].command.indexOf(str) === 0) {
                    str = cl[index].command;
                    this.commandIndex = (index + 1) % cl.length;
                    break;
               }
            }
            //console.log("tc: " + str);
            return str;
        }

        public handleInput(): void {
            while (_KernelInputQueue.getSize() > 0) {
                // Get the next character from the kernel input queue.
                var chr = _KernelInputQueue.dequeue();
                // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).
                if (chr === String.fromCharCode(13)) { //     Enter key
                    // The enter key marks the end of a console command, so ...
                    // ... tell the shell ...
                    _OsShell.handleInput(this.inputBuffer);
                    // ... and reset our buffer.
                    this.inputBuffer = "";
                } else if (chr === String.fromCharCode(8)) {
                    this.backspaceText();
                    this.inputBuffer = this.inputBuffer.substring(0, this.inputBuffer.length-1);
                } else if (chr === String.fromCharCode(9)) {
                    // Add backspace

                    let tempBuffer: string = this.inputBuffer;
                    while (this.inputBuffer.length > 0) {
                        this.backspaceText();
                        this.inputBuffer = this.inputBuffer.substring(0, this.inputBuffer.length-1);
                    }
                    this.inputBuffer = this.tabComplete(tempBuffer);
                    this.putText(this.inputBuffer);
                    this.commandIndex = 0;
                    //for (let i = 0; i < this.inputBuffer.length; i++)
                    //    this.put();
                } else {
                    // This is a "normal" character, so ...
                    // ... draw it on the screen...
                    this.putText(chr);
                    // ... and add it to our buffer.
                    this.inputBuffer += chr;
                }
                // TODO: Write a case for Ctrl-C.
            }
        }

        public backspaceText(): void {
            let text: string = this.inputBuffer.charAt(this.inputBuffer.length - 1);
            let xOffset: number = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
            this.currentXPosition = this.currentXPosition - xOffset;
            // Bounds checking here
            _DrawingContext.clearRect(this.currentXPosition, this.currentYPosition - _DefaultFontSize,
                this.currentXPosition + xOffset, this.currentYPosition + _DrawingContext.fontDescent(this.currentFont, this.currentFontSize));

            this.consoleBuffer = this.consoleBuffer
                .substring(0, this.consoleBuffer.length - 1);
        }

        public putText(text): void {
            // My first inclination here was to write two functions: putChar() and putString().
            // Then I remembered that JavaScript is (sadly) untyped and it won't differentiate
            // between the two.  So rather than be like PHP and write two (or more) functions that
            // do the same thing, thereby encouraging confusion and decreasing readability, I
            // decided to write one function and use the term "text" to connote string or char.
            //
            // UPDATE: Even though we are now working in TypeScript, char and string remain undistinguished.
            //         Consider fixing that.
            if (text == "\n") {
                this.advanceLine();
            } else if (text !== "") {
                // Draw the text at the current X and Y coordinates.
                _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text);
                // Move the current X position.
                var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
                this.currentXPosition = this.currentXPosition + offset;
            }
            this.consoleBuffer += text;
         }

        public advanceLine(): void {
            this.currentXPosition = 0;
            /*
             * Font size measures from the baseline to the highest point in the font.
             * Font descent measures from the baseline to the lowest point in the font.
             * Font height margin is extra spacing between the lines.
             */
            this.currentYPosition += _DefaultFontSize + 
                                     _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                                     _FontHeightMargin;
            this.consoleBuffer += "\n";

            // TODO: Handle scrolling. (iProject 1)
            //_DrawingContext.rect(0,0,500,500);
            //_DrawingContext.translate(10, 10);

            if (this.currentYPosition > (<any> document.getElementById('display')).height) {
                let tempBuffer: string = this.consoleBuffer.substring(this.consoleBuffer.indexOf("\n") + 1);
                this.clearScreen();
                this.resetXY();
                for (let i = 0; i < tempBuffer.length; i++) {
                    this.putText(tempBuffer.charAt(i));
                }
                this.consoleBuffer = tempBuffer;
            }
        }
    }
 }
