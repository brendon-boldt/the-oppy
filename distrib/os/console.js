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
        function Console(currentFont, currentFontSize, currentXPosition, currentYPosition, cursorState, commandHistory, consoleBuffer, inputBuffer, commandIndex) {
            if (currentFont === void 0) { currentFont = _DefaultFontFamily; }
            if (currentFontSize === void 0) { currentFontSize = _DefaultFontSize; }
            if (currentXPosition === void 0) { currentXPosition = 0; }
            if (currentYPosition === void 0) { currentYPosition = _DefaultFontSize; }
            if (cursorState === void 0) { cursorState = false; }
            if (commandHistory === void 0) { commandHistory = []; }
            if (consoleBuffer === void 0) { consoleBuffer = ""; }
            if (inputBuffer === void 0) { inputBuffer = ""; }
            if (commandIndex === void 0) { commandIndex = -1; }
            this.currentFont = currentFont;
            this.currentFontSize = currentFontSize;
            this.currentXPosition = currentXPosition;
            this.currentYPosition = currentYPosition;
            this.cursorState = cursorState;
            this.commandHistory = commandHistory;
            this.consoleBuffer = consoleBuffer;
            this.inputBuffer = inputBuffer;
            this.commandIndex = commandIndex;
            this.lineSize = _DefaultFontSize
                + _DrawingContext.fontDescent(this.currentFont, this.currentFontSize)
                + _FontHeightMargin;
            this.fontHeight = _DrawingContext
                .fontDescent(this.currentFont, this.currentFontSize)
                + _DefaultFontSize;
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
        Console.prototype.getTabArray = function (str) {
            var results = [];
            var cl = _OsShell.commandList;
            for (var i = 0; i < cl.length; i++) {
                if (cl[i].command.indexOf(str) === 0) {
                    results.push(cl[i].command);
                }
            }
            return results;
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
        Console.prototype.isChar = function (chr) {
            return chr.length == 1;
            /*
            return (<any>['a','b','c','d','e','f','g','h',
                'i','j','k','l','m','n','o','p','q',
                'r','s','t','u','v','w','x','y','z',
                '0','1','2','3','4','5','6','7','8','9',
                ])
                .includes(chr.toLowerCase());
            */
        };
        Console.prototype.handleInput = function () {
            while (_KernelInputQueue.getSize() > 0) {
                var chr = _KernelInputQueue.dequeue();
                if (chr === 'enter') {
                    _OsShell.handleInput(this.inputBuffer);
                    this.commandHistory.push(this.inputBuffer);
                    this.commandIndex = -1;
                    this.inputBuffer = "";
                }
                else if (chr === 'backspace') {
                    this.backspaceText();
                    this.inputBuffer = this.inputBuffer.substring(0, this.inputBuffer.length - 1);
                }
                else if (chr === 'tab') {
                    var tempBuffer = this.inputBuffer;
                    // Erase the text of the user input and redraw it
                    // with the tab completed command.
                    var results = this.getTabArray(this.inputBuffer);
                    if (results.length == 1) {
                        this.clearUserInput();
                        this.inputBuffer = results[0];
                        this.putText(this.inputBuffer);
                    }
                    else if (results.length > 1) {
                        this.advanceLine();
                        this.putText(results.join(' '));
                        this.advanceLine();
                        _OsShell.putPrompt();
                        this.putText(this.inputBuffer);
                    }
                }
                else if (chr === 'up') {
                    this.commandIndex -= 1;
                    this.clearUserInput();
                    this.inputBuffer = this.getHistoricCommand();
                    this.putText(this.inputBuffer);
                }
                else if (chr === 'down') {
                    this.commandIndex += 1;
                    this.clearUserInput();
                    this.inputBuffer = this.getHistoricCommand();
                    this.putText(this.inputBuffer);
                }
                else if (this.isChar(chr)) {
                    this.putText(chr);
                    this.inputBuffer += chr;
                }
                else if (chr === 'space') {
                    this.putText(' ');
                    this.inputBuffer += ' ';
                }
            }
        };
        Console.prototype.backspaceText = function () {
            var text = this.inputBuffer.charAt(this.inputBuffer.length - 1);
            var xOffset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
            this.currentXPosition = this.currentXPosition - xOffset;
            if (this.currentXPosition < 0) {
                this.currentYPosition -= this.lineSize;
                var lines = this.consoleBuffer.split("\n");
                var length_1 = _DrawingContext.measureText(this.currentFont, this.currentFontSize, lines[lines.length - 2]) - xOffset;
                this.currentXPosition = length_1;
            }
            // Bounds checking here
            _DrawingContext.clearRect(this.currentXPosition, this.currentYPosition - _DefaultFontSize, this.currentXPosition + xOffset, this.currentYPosition + _DrawingContext.fontDescent(this.currentFont, this.currentFontSize));
            if (this.consoleBuffer[this.consoleBuffer.length - 1] == '\n')
                this.consoleBuffer = this.consoleBuffer
                    .substring(0, this.consoleBuffer.length - 2);
            else
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
                            if (lines[i] == "")
                                continue;
                            this.putText(lines[i]);
                            if (i < lines.length - 1)
                                this.advanceLine();
                        }
                    }
                }
                else {
                    if (this.cursorState)
                        this.toggleCursor(false);
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
            while (i < line.length) {
                var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, line.slice(0, i));
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
            return lines; //.join('\n');
        };
        Console.prototype.advanceLine = function () {
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
                var tempBuffer = this.consoleBuffer.substring(this.consoleBuffer.indexOf("\n") + 1);
                this.clearScreen();
                this.resetXY();
                for (var i = 0; i < tempBuffer.length; i++) {
                    this.putText(tempBuffer.charAt(i));
                }
                this.consoleBuffer = tempBuffer;
            }
        };
        Console.prototype.toggleCursor = function (state) {
            var x = this.currentXPosition;
            var y = this.currentYPosition - _DefaultFontSize;
            var xSize = 10;
            var ySize = this.fontHeight;
            if (state) {
                _DrawingContext.strokeStyle = 'rgba(0,0,0,0)';
                // Make the fill slightly smaller so it is cleared completely
                _DrawingContext.fillRect(x + 1, y + 1, xSize - 2, ySize - 2);
                this.cursorState = true;
            }
            else {
                _DrawingContext.clearRect(x, y, xSize, ySize);
                this.cursorState = false;
            }
        };
        return Console;
    }());
    TSOS.Console = Console;
})(TSOS || (TSOS = {}));
