///<reference path="../globals.ts" />
/* ------------
     Console.ts

     Requires globals.ts

     The OS Console - stdIn and stdOut by default.
     Note: This is not the Shell. The Shell is the "command line interface" (CLI) or interpreter for this console.
     ------------ */
var TSOS;
(function (TSOS) {
    var Console = (function () {
        function Console(currentFont, currentFontSize, currentXPosition, currentYPosition, consoleBuffer, inputBuffer, commandIndex) {
            if (currentFont === void 0) { currentFont = _DefaultFontFamily; }
            if (currentFontSize === void 0) { currentFontSize = _DefaultFontSize; }
            if (currentXPosition === void 0) { currentXPosition = 0; }
            if (currentYPosition === void 0) { currentYPosition = _DefaultFontSize; }
            if (consoleBuffer === void 0) { consoleBuffer = ""; }
            if (inputBuffer === void 0) { inputBuffer = ""; }
            if (commandIndex === void 0) { commandIndex = 0; }
            this.currentFont = currentFont;
            this.currentFontSize = currentFontSize;
            this.currentXPosition = currentXPosition;
            this.currentYPosition = currentYPosition;
            this.consoleBuffer = consoleBuffer;
            this.inputBuffer = inputBuffer;
            this.commandIndex = commandIndex;
        }
        Console.prototype.init = function () {
            this.clearScreen();
            this.resetXY();
        };
        Console.prototype.clearScreen = function () {
            this.consoleBuffer = "";
            _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
        };
        Console.prototype.resetXY = function () {
            this.currentXPosition = 0;
            this.currentYPosition = this.currentFontSize;
        };
        Console.prototype.tabComplete = function (str) {
            console.log("str: " + str);
            var cl = _OsShell.commandList;
            for (var i = 0; i < cl.length; i++) {
                var index = (this.commandIndex + i) % cl.length;
                if (cl[index].command.indexOf(str) === 0) {
                    str = cl[index].command;
                    this.commandIndex = (index + 1) % cl.length;
                    break;
                }
            }
            //console.log("tc: " + str);
            return str;
        };
        Console.prototype.handleInput = function () {
            while (_KernelInputQueue.getSize() > 0) {
                // Get the next character from the kernel input queue.
                var chr = _KernelInputQueue.dequeue();
                // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).
                if (chr === String.fromCharCode(13)) {
                    // The enter key marks the end of a console command, so ...
                    // ... tell the shell ...
                    _OsShell.handleInput(this.inputBuffer);
                    // ... and reset our buffer.
                    this.inputBuffer = "";
                }
                else if (chr === String.fromCharCode(8)) {
                    this.backspaceText();
                    this.inputBuffer = this.inputBuffer.substring(0, this.inputBuffer.length - 1);
                }
                else if (chr === String.fromCharCode(9)) {
                    // Add backspace
                    var tempBuffer = this.inputBuffer;
                    while (this.inputBuffer.length > 0) {
                        this.backspaceText();
                        this.inputBuffer = this.inputBuffer.substring(0, this.inputBuffer.length - 1);
                    }
                    this.inputBuffer = this.tabComplete(tempBuffer);
                    this.putText(this.inputBuffer);
                    this.commandIndex = 0;
                }
                else {
                    // This is a "normal" character, so ...
                    // ... draw it on the screen...
                    this.putText(chr);
                    // ... and add it to our buffer.
                    this.inputBuffer += chr;
                }
            }
        };
        Console.prototype.backspaceText = function () {
            var text = this.inputBuffer.charAt(this.inputBuffer.length - 1);
            var xOffset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
            this.currentXPosition = this.currentXPosition - xOffset;
            // Bounds checking here
            _DrawingContext.clearRect(this.currentXPosition, this.currentYPosition - _DefaultFontSize, this.currentXPosition + xOffset, this.currentYPosition + _DrawingContext.fontDescent(this.currentFont, this.currentFontSize));
            this.consoleBuffer = this.consoleBuffer
                .substring(0, this.consoleBuffer.length - 1);
        };
        Console.prototype.putText = function (text) {
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
            }
            else if (text !== "") {
                // Draw the text at the current X and Y coordinates.
                _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text);
                // Move the current X position.
                var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
                this.currentXPosition = this.currentXPosition + offset;
            }
            this.consoleBuffer += text;
        };
        Console.prototype.advanceLine = function () {
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
            if (this.currentYPosition > document.getElementById('display').height) {
                var tempBuffer = this.consoleBuffer.substring(this.consoleBuffer.indexOf("\n") + 1);
                this.clearScreen();
                this.resetXY();
                for (var i = 0; i < tempBuffer.length; i++) {
                    this.putText(tempBuffer.charAt(i));
                }
                this.consoleBuffer = tempBuffer;
            }
        };
        return Console;
    }());
    TSOS.Console = Console;
})(TSOS || (TSOS = {}));
