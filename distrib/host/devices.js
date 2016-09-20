///<reference path="../globals.ts" />
///<reference path="../jquery.d.ts" />
/* ------------
     Devices.ts

     Requires global.ts.

     Routines for the hardware simulation, NOT for our client OS itself.
     These are static because we are never going to instantiate them, because they represent the hardware.
     In this manner, it's A LITTLE BIT like a hypervisor, in that the Document environment inside a browser
     is the "bare metal" (so to speak) for which we write code that hosts our client OS.
     But that analogy only goes so far, and the lines are blurred, because we are using TypeScript/JavaScript
     in both the host and client environments.

     This (and simulation scripts) is the only place that we should see "web" code, like
     DOM manipulation and TypeScript/JavaScript event handling, and so on.  (Index.html is the only place for markup.)

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */
var TSOS;
(function (TSOS) {
    var Devices = (function () {
        function Devices() {
            _hardwareClockID = -1;
        }
        // Get the date and time in a nice ISO-style format
        Devices.getISODate = function () {
            var d = new Date();
            var month = d.getMonth() + 1;
            var day = d.getDate();
            var hours = d.getHours();
            var minutes = d.getMinutes();
            var seconds = d.getSeconds();
            return d.getFullYear() + "-" +
                (month < 10 ? '0' : '') + month + "-" +
                (day < 10 ? '0' : '') + day + "T" +
                (hours < 10 ? '0' : '') + hours + ":" +
                (minutes < 10 ? '0' : '') + minutes + ":" +
                (seconds < 10 ? '0' : '') + seconds;
        };
        //
        // Hardware/Host Clock Pulse
        //
        Devices.hostClockPulse = function () {
            // Call the kernel clock pulse event handler.
            _Kernel.krnOnCPUClockPulse();
            // Update the clock once per second
            if (_OSclock % 10 == 0) {
                $('#statusDate').text(Devices.getISODate());
            }
            if (_OSclock % 5 == 0) {
                // Toggle the blinking cursor state every 0.5 seconds
                if (_Status == 'idle' || _Status == 'processing')
                    _Console.toggleCursor(!_Console.cursorState);
                else
                    _Console.toggleCursor(false);
                // TODO Make a list of stati
                // Remove the background color classes and readd correct
                // one according to the status of the OS.
                $('body').removeClass('bg-idle');
                $('body').removeClass('bg-off');
                $('body').removeClass('bg-processing');
                $('body').removeClass('bg-error');
                switch (_Status) {
                    case 'idle':
                        $('body').addClass('bg-idle');
                        break;
                    case 'off':
                        $('body').addClass('bg-off');
                        break;
                    case 'error':
                        $('body').addClass('bg-error');
                        break;
                    case 'proessing':
                        $('body').addClass('bg-processing');
                        break;
                    default:
                        break;
                }
            }
            // Increment the hardware (host) clock.
            _OSclock++;
        };
        //
        // Keyboard Interrupt, a HARDWARE Interrupt Request. (See pages 560-561 in our text book.)
        //
        Devices.hostEnableKeyboardInterrupt = function () {
            // Listen for key press (keydown, actually) events in the Document
            // and call the simulation processor, which will in turn call the
            // OS interrupt handler.
            document.addEventListener("keydown", Devices.hostOnKeypress, false);
        };
        Devices.hostDisableKeyboardInterrupt = function () {
            document.removeEventListener("keydown", Devices.hostOnKeypress, false);
        };
        Devices.hostOnKeypress = function (event) {
            // The canvas element CAN receive focus if you give it a tab index, which we have.
            // Check that we are processing keystrokes only from the canvas's id (as set in index.html).
            if (event.target.id === "display") {
                event.preventDefault();
                // Note the pressed key code in the params (Mozilla-specific).
                var params = new Array(event.which, event.shiftKey);
                // Enqueue this interrupt on the kernel interrupt queue so that it gets to the Interrupt handler.
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(KEYBOARD_IRQ, params));
            }
        };
        return Devices;
    }());
    TSOS.Devices = Devices;
})(TSOS || (TSOS = {}));
