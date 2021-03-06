///<reference path="../globals.ts" />
///<reference path="queue.ts" />
/* ------------
     Kernel.ts

     Requires globals.ts
              queue.ts

     Routines for the Operating System, NOT the host.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */
var TSOS;
(function (TSOS) {
    class Kernel {
        //
        // OS Startup and Shutdown Routines
        //
        krnBootstrap() {
            TSOS.Control.hostLog("bootstrap", "host"); // Use hostLog because we ALWAYS want this, even if _Trace is off.
            // Initialize our global queues.
            _KernelInterruptQueue = new TSOS.Queue(); // A (currently) non-priority queue for interrupt requests (IRQs).
            _KernelBuffers = new Array(); // Buffers... for the kernel.
            _KernelInputQueue = new TSOS.Queue(); // Where device input lands before being processed out somewhere.
            // Initialize the console.
            _Console = new TSOS.Console(); // The command line interface / console I/O device.
            _Console.init();
            // Initialize standard input and output to the _Console.
            _StdIn = _Console;
            _StdOut = _Console;
            // Load the Keyboard Device Driver
            this.krnTrace("Loading the keyboard device driver.");
            _krnKeyboardDriver = new TSOS.DeviceDriverKeyboard();
            _krnKeyboardDriver.driverEntry(); // Call the driverEntry() initialization routine.
            this.krnTrace(_krnKeyboardDriver.status);
            _krnDiskDriver = new TSOS.DeviceDriverDisk();
            _krnDiskDriver.driverEntry();
            this.krnTrace(_krnDiskDriver.status);
            // Enable the OS Interrupts.  (Not the CPU clock interrupt, as that is done in the hardware sim.)
            this.krnTrace("Enabling the interrupts.");
            this.krnEnableInterrupts();
            this.krnTrace("Creating and Launching the shell.");
            _OsShell = new TSOS.Shell();
            _OsShell.init();
            if (_GLaDOS) {
                _GLaDOS.afterStartup();
            }
        }
        krnShutdown() {
            _StdOut.putText("The Oppy is shutting down...");
            _StdOut.advanceLine();
            this.krnTrace("begin shutdown OS");
            // TODO: Check for running processes.  If there are some, alert and stop. Else...
            // ... Disable the Interrupts.
            this.krnTrace("Disabling the interrupts.");
            this.krnDisableInterrupts();
            this.krnTrace("end shutdown OS");
            if (_Status == 'idle')
                _Status = 'off';
            _CPU.stopExecution();
            _Scheduler.isActive = false;
        }
        krnOnCPUClockPulse() {
            if (_Scheduler.isActive)
                _Scheduler.cycle();
            if (_KernelInterruptQueue.getSize() > 0) {
                // TODO: Implement a priority queue based on the IRQ
                // number/id to enforce interrupt priority.
                var interrupt = _KernelInterruptQueue.dequeue();
                this.krnInterruptHandler(interrupt.irq, interrupt.params);
            }
            else if (_CPU.isExecuting
                && (!_SSMode || _NextStep)) {
                _NextStep = false;
                _CPU.cycle();
            }
            else {
                this.krnTrace("Idle");
            }
        }
        //
        // Interrupt Handling
        //
        krnEnableInterrupts() {
            // Keyboard
            TSOS.Devices.hostEnableKeyboardInterrupt();
            // Put more here.
        }
        krnDisableInterrupts() {
            // Keyboard
            TSOS.Devices.hostDisableKeyboardInterrupt();
            // Put more here.
        }
        krnSysCallPrintByte() {
            _StdOut.putText(_CPU.ct.Yreg.toString());
        }
        krnSysCallPrintBytes() {
            let addr = _CPU.ct.Yreg;
            let str = "";
            let ct = _PCB.getCurrentProcess();
            let value;
            do {
                value = _MMU.getLogicalByte(addr, ct.segment);
                addr += 1;
                str += String.fromCharCode(value);
            } while (value != 0x0);
            _StdOut.putText(str);
        }
        krnSysCall() {
            switch (_CPU.ct.Xreg) {
                case 1:
                    this.krnSysCallPrintByte();
                    break;
                case 2:
                    this.krnSysCallPrintBytes();
                    break;
                default:
            }
        }
        krnCtSwitch(params) {
        }
        krnInterruptHandler(irq, params) {
            // Trace our entrance here so we can compute Interrupt
            // Latency by analyzing the log file later on. Page 766.
            this.krnTrace("Handling IRQ~" + irq);
            // Invoke the requested Interrupt Service Routine via Switch/Case rather than an Interrupt Vector.
            // TODO: Consider using an Interrupt Vector in the future.
            // Note: There is no need to "dismiss" or acknowledge the interrupts in our design here.
            //       Maybe the hardware simulation will grow to support/require that in the future.
            switch (irq) {
                case TIMER_IRQ:
                    this.krnTimerISR();
                    break;
                case KEYBOARD_IRQ:
                    _krnKeyboardDriver.isr(params); // Kernel mode device driver
                    _StdIn.handleInput();
                    break;
                case TERM_IRQ:
                    _PCB.terminateProcess(params);
                    break;
                case SYSCALL_IRQ:
                    this.krnSysCall();
                    break;
                case CT_SWITCH_IRQ:
                    _PCB.contextSwitch(params);
                    break;
                default:
                    this.krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
            }
        }
        krnTimerISR() {
            // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver). {
            // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
        }
        //
        // System Calls... that generate software interrupts via tha Application Programming Interface library routines.
        //
        // Some ideas:
        // - ReadConsole
        // - WriteConsole
        // - CreateProcess
        // - ExitProcess
        // - WaitForProcessToExit
        // - CreateFile
        // - OpenFile
        // - ReadFile
        // - WriteFile
        // - CloseFile
        //
        // OS Utility Routines
        //
        krnTrace(msg) {
            // Check globals to see if trace is set ON.  If so, then (maybe) log the message.
            if (_Trace) {
                if (msg === "Idle") {
                    // We can't log every idle clock pulse because it would lag the browser very quickly.
                    if (_OSclock % 10 == 0) {
                        // Check the CPU_CLOCK_INTERVAL in globals.ts for an
                        // idea of the tick rate and adjust this line accordingly.
                        TSOS.Control.hostLog(msg, "OS");
                    }
                }
                else {
                    TSOS.Control.hostLog(msg, "OS");
                }
            }
        }
        krnTrapError(msg) {
            TSOS.Control.hostLog("OS ERROR - TRAP: " + msg);
            // TODO: Display error on console, perhaps in some sort of colored screen. (Maybe blue?)
            _Status = 'error';
            _StdOut.putText('\\(;`^`)/');
            _StdOut.advanceLine();
            _StdOut.putText(msg);
            _StdOut.advanceLine();
            this.krnShutdown();
        }
    }
    TSOS.Kernel = Kernel;
})(TSOS || (TSOS = {}));
