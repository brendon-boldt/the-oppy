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
        function Console(currentFont, currentFontSize, currentXPosition, currentYPosition, commandHistory, consoleBuffer, inputBuffer, commandIndex) {
            if (currentFont === void 0) { currentFont = _DefaultFontFamily; }
            if (currentFontSize === void 0) { currentFontSize = _DefaultFontSize; }
            if (currentXPosition === void 0) { currentXPosition = 0; }
            if (currentYPosition === void 0) { currentYPosition = _DefaultFontSize; }
            if (commandHistory === void 0) { commandHistory = []; }
            if (consoleBuffer === void 0) { consoleBuffer = ""; }
            if (inputBuffer === void 0) { inputBuffer = ""; }
            if (commandIndex === void 0) { commandIndex = -1; }
            this.currentFont = currentFont;
            this.currentFontSize = currentFontSize;
            this.currentXPosition = currentXPosition;
            this.currentYPosition = currentYPosition;
            this.commandHistory = commandHistory;
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
        // Only clears the canvas; not the actual buffer
        Console.prototype.clearUserInput = function () {
            var tempBuffer = this.inputBuffer;
            while (this.inputBuffer.length > 0) {
                this.backspaceText();
                this.inputBuffer = this.inputBuffer
                    .substring(0, this.inputBuffer.length - 1);
            }
            this.inputBuffer = tempBuffer;
        };
        Console.prototype.tabComplete = function (str) {
            console.log("str: " + str);
            var cl = _OsShell.commandList;
            for (var i = 0; i < cl.length; i++) {
                //let index: number = (this.commandIndex + i) % cl.length;
                var index = i % cl.length;
                if (cl[index].command.indexOf(str) === 0) {
                    str = cl[index].command;
                    //this.commandIndex = (index + 1) % cl.length;
                    break;
                }
            }
            return str;
        };
        Console.prototype.getHistoricCommand = function () {
            if (this.commandHistory.length == 0)
                return "";
            if (this.commandIndex == -2) {
                this.commandIndex = this.commandHistory.length - 1;
            }
            else if (this.commandIndex == -1) {
                this.commandIndex = 0;
            }
            else if (this.commandIndex >= this.commandHistory.length) {
                this.commandIndex = this.commandHistory.length;
                return "";
            }
            return this.commandHistory[this.commandIndex];
        };
        Console.prototype.handleInput = function () {
            while (_KernelInputQueue.getSize() > 0) {
                var chr = _KernelInputQueue.dequeue();
                if (chr === String.fromCharCode(13)) {
                    _OsShell.handleInput(this.inputBuffer);
                    this.commandHistory.push(this.inputBuffer);
                    this.commandIndex = -1;
                    this.inputBuffer = "";
                }
                else if (chr === String.fromCharCode(8)) {
                    this.backspaceText();
                    this.inputBuffer = this.inputBuffer.substring(0, this.inputBuffer.length - 1);
                }
                else if (chr === String.fromCharCode(9)) {
                    var tempBuffer = this.inputBuffer;
                    // Erase the text of the user input and redraw it
                    // with the tab completed command.
                    this.clearUserInput();
                    this.inputBuffer = this.tabComplete(tempBuffer);
                    this.putText(this.inputBuffer);
                }
                else if (chr === String.fromCharCode(38)) {
                    this.commandIndex -= 1;
                    this.clearUserInput();
                    this.inputBuffer = this.getHistoricCommand();
                    this.putText(this.inputBuffer);
                }
                else if (chr === String.fromCharCode(40)) {
                    this.commandIndex += 1;
                    this.clearUserInput();
                    this.inputBuffer = this.getHistoricCommand();
                    this.putText(this.inputBuffer);
                }
                else {
                    this.putText(chr);
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
            if (text == "\n") {
                this.advanceLine();
            }
            else if (text !== "") {
                // Draw the text at the current X and Y coordinates.
                var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
                if (offset + this.currentXPosition > _DisplayXRes) {
                    if (text.length == 1) {
                        this.advanceLine();
                        this.putText(text);
                    }
                    else {
                        var lines = this.lineWrapText(text);
                        for (var i = 0; i < lines.length; i++) {
                            this.putText(lines[i]);
                            this.advanceLine();
                        }
                    }
                }
                else {
                    _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text);
                    this.currentXPosition = this.currentXPosition + offset;
                    this.consoleBuffer += text;
                }
            }
        };
        // To handle line breaking
        Console.prototype.lineWrapText = function (text) {
            if (this.currentXPosition > _DisplayXRes) {
            }
            var localX = this.currentXPosition;
            var lines = [];
            var i = 0;
            var line = text;
            //console.log("line: " + line);
            while (i < line.length) {
                var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, line.slice(0, i));
                //console.log(line.slice(0,i));
                //console.log(offset);
                if (localX + offset > _DisplayXRes) {
                    lines.push(line.slice(0, i - 1));
                    //console.log("i: " + i);
                    //console.log("line0: " + line);
                    line = line.slice(i - 1);
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
            //console.log(lines);
            return lines; //.join('\n');
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
            if (this.currentYPosition > _DisplayYRes) {
                //if (this.currentYPosition > (<any> document.getElementById('display')).height) {
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
