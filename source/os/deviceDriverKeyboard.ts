///<reference path="../globals.ts" />
///<reference path="deviceDriver.ts" />

/* ----------------------------------
   DeviceDriverKeyboard.ts

   Requires deviceDriver.ts

   The Kernel Keyboard Device Driver.
   ---------------------------------- */

module TSOS {

    // Extends DeviceDriver
    export class DeviceDriverKeyboard extends DeviceDriver {

        constructor() {
            // Override the base method pointers.

            // The code below cannot run because "this" can only be
            // accessed after calling super.
            //super(this.krnKbdDriverEntry, this.krnKbdDispatchKeyPress);
            super();
            this.driverEntry = this.krnKbdDriverEntry;
            this.isr = this.krnKbdDispatchKeyPress;
        }

        public krnKbdDriverEntry() {
            // Initialization routine for this, the kernel-mode Keyboard Device Driver.
            this.status = "loaded";
            // More?
        }

        // Is non-letter printing char
        private isNLPChar(c: number): boolean {
            return ((c >= 48) && (c <= 57)) // digits
                || ((c >= 186) && (c <= 192))
                || ((c >= 219) && (c <= 222));
        }

        // Get the correct character corresponding to the pressed key
        private getMiscChar(c: number, isShifted: boolean): string {
            if (isShifted) {
                switch (c) {
                    case 48:
                        return ')';
                    case 49:
                        return '!';
                    case 50:
                        return '@';
                    case 51:
                        return '#';
                    case 52:
                        return '$';
                    case 53:
                        return '%';
                    case 54:
                        return '^';
                    case 55:
                        return '&';
                    case 56:
                        return '*';
                    case 57:
                        return '(';
                    case 186:
                        return ':';
                    case 187:
                        return '+';
                    case 188:
                        return '<';
                    case 189:
                        return '_';
                    case 190:
                        return '>';
                    case 191:
                        return '?';
                    case 192:
                        return '~';
                    case 219:
                        return '{';
                    case 220:
                        return '|';
                    case 222:
                        return '"';
                    case 221:
                        return '}';
                    default:
                        break;
                }
            } else {
                if ((c >= 48) && (c <= 57))
                    return (c - 48) + '';
                switch (c) {
                    case 186:
                        return ';';
                    case 187:
                        return '=';
                    case 188:
                        return ',';
                    case 189:
                        return '-';
                    case 190:
                        return '.';
                    case 191:
                        return '/';
                    case 192:
                        return '`';
                    case 219:
                        return '[';
                    case 220:
                        return '\\';
                    case 222:
                        return "'";
                    case 221:
                        return ']';
                    default:
                        break;
                }
            }

            return '';
        }

        private getSpecialKey(c: number): string {
            switch (c) {
                case 8:
                    return 'backspace';
                case 9:
                    return 'tab';
                case 13:
                    return 'enter';
                case 32:
                    return 'space';
                case 38:
                    return 'up';
                case 40:
                    return 'down';
            }
        }

        public krnKbdDispatchKeyPress(params) {
            // Parse the params.    TODO: Check that the params are valid and osTrapError if not.
            var keyCode = params[0];
            var isShifted = params[1];
            _Kernel.krnTrace("Key code:" + keyCode + " shifted:" + isShifted);
            var chr = "";
            // Check to see if we even want to deal with the key that was pressed.
            if (((keyCode >= 65) && (keyCode <= 90)) ||   // A..Z
                ((keyCode >= 97) && (keyCode <= 123))) {  // a..z {
                // Determine the character we want to display.
                // Assume it's lowercase...
                // ... then check the shift key and re-adjust if necessary.
                chr = String.fromCharCode(keyCode + 32);
                if (isShifted)
                    chr = String.fromCharCode(keyCode);
                // TODO: Check for caps-lock and handle as shifted if so.
                _KernelInputQueue.enqueue(chr);
            } else if ((keyCode == 32)                     ||   // space
                       (keyCode == 38)                     ||   // up arrow
                       (keyCode == 40)                     ||   // down arrow
                       (keyCode == 9)                      ||   // tab
                       (keyCode == 8)                      ||   // backspace
                       (keyCode == 13)) {                       // enter
                _KernelInputQueue.enqueue(this.getSpecialKey(keyCode));
            } else {
                chr = this.getMiscChar(keyCode, isShifted);
                if (chr)
                    _KernelInputQueue.enqueue(chr);
            }
        }
    }
}
