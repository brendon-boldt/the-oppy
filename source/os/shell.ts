///<reference path="../globals.ts" />
///<reference path="../utils.ts" />
///<reference path="shellCommand.ts" />
///<reference path="userCommand.ts" />


/* ------------
   Shell.ts

   The OS Shell - The "command line interface" (CLI) for the console.

    Note: While fun and learning are the primary goals of all enrichment center activities,
          serious injuries may occur when trying to write your own Operating System.
   ------------ */

// TODO: Write a base class / prototype for system services and let Shell inherit from it.

module TSOS {
    export class Shell {
        // Properties
        public promptStr = ">";
        public commandList = [];
        public curses = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
        public apologies = "[sorry]";

        constructor() {
        }

        public init() {
            var sc;



            // Load the command list.
            sc = new ShellCommand(this.shellSMode,
                                  "smode",
                                  "<rr | fcfs>  - Changes the scheduler mode.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellClearmem,
                                  "killall",
                                  " - Alias of clearmem.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellClearmem,
                                  "clearmem",
                                  " - Clears all memory segments.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellQuantum,
                                  "quantum",
                                  "<int> - Changes the round robin quantum.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellPs,
                                  "ps",
                                  " - Lists the current process states.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellKill,
                                  "kill",
                                  "<pid> - Kills specified process.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellRunall,
                                  "runall",
                                  " - Runs all loaded processes.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellRun,
                                  "run",
                                  "<pid> - Runs the process specified by <pid>.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellPanic,
                                  "panic",
                                  " - Initiates kernel panic.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellLoad,
                                  "load",
                                  " - Loads the user program in the text area.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellStatus,
                                  "status",
                                  "<string> - Updates the OS text status.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellWhereami,
                                  "whereami",
                                  "- Prints where I am.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellDate,
                                  "date",
                                  "- Prints the current date.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellEcho,
                                  "echo",
                                  "<string> - Echoes the given <string>.");
            this.commandList[this.commandList.length] = sc;

            // ver
            sc = new ShellCommand(this.shellVer,
                                  "ver",
                                  "- Displays the current version data.");
            this.commandList[this.commandList.length] = sc;

            // help
            sc = new ShellCommand(this.shellHelp,
                                  "help",
                                  "- This is the help command. Seek help.");
            this.commandList[this.commandList.length] = sc;

            // shutdown
            sc = new ShellCommand(this.shellShutdown,
                                  "shutdown",
                                  "- Shuts down the virtual OS but leaves the underlying host / hardware simulation running.");
            this.commandList[this.commandList.length] = sc;

            // clear
            sc = new ShellCommand(this.shellCls,
                                  "clear",
                                  "- Clears the screen and resets the cursor position.");
            this.commandList[this.commandList.length] = sc;

            // man <topic>
            sc = new ShellCommand(this.shellMan,
                                  "man",
                                  "<topic> - Displays the MANual page for <topic>.");
            this.commandList[this.commandList.length] = sc;

            // trace <on | off>
            sc = new ShellCommand(this.shellTrace,
                                  "trace",
                                  "<on | off> - Turns the OS trace on or off.");
            this.commandList[this.commandList.length] = sc;

            // rot13 <string>
            sc = new ShellCommand(this.shellRot13,
                                  "rot13",
                                  "<string> - Does rot13 obfuscation on <string>.");
            this.commandList[this.commandList.length] = sc;

            // prompt <string>
            sc = new ShellCommand(this.shellPrompt,
                                  "prompt",
                                  "<string> - Sets the prompt.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellVanish,
                                  "vanish",
                                  " - Hides the OS");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellAppear,
                                  "appear",
                                  " - Unhides the OS");
            this.commandList[this.commandList.length] = sc;

            // ps  - list the running processes and their IDs
            // kill <id> - kills the specified process id.

            //
            // Display the initial prompt.
            this.putPrompt();
        }

        public putPrompt() {
            _StdOut.putText(this.promptStr);
        }

        public handleInput(buffer) {
            _Kernel.krnTrace("Shell Command~" + buffer);
            //
            // Parse the input...
            //
            var userCommand = this.parseInput(buffer);
            // ... and assign the command and args to local variables.
            var cmd = userCommand.command;
            var args = userCommand.args;
            //
            // Determine the command and execute it.
            //
            // TypeScript/JavaScript may not support associative arrays in all browsers so we have to iterate over the
            // command list in attempt to find a match.  TODO: Is there a better way? Probably. Someone work it out and tell me in class.
            var index: number = 0;
            var found: boolean = false;
            var fn = undefined;
            while (!found && index < this.commandList.length) {
                if (this.commandList[index].command === cmd) {
                    found = true;
                    fn = this.commandList[index].func;
                } else {
                    ++index;
                }
            }
            if (found) {
                this.execute(fn, args);
            } else {
                // It's not found, so check for curses and apologies before declaring the command invalid.
                if (this.curses.indexOf("[" + Utils.rot13(cmd) + "]") >= 0) {     // Check for curses.
                    this.execute(this.shellCurse);
                } else if (this.apologies.indexOf("[" + cmd + "]") >= 0) {        // Check for apologies.
                    this.execute(this.shellApology);
                } else if (cmd.length == 0) {
                    _StdOut.advanceLine();
                    this.putPrompt();
                } else {
                    this.execute(this.shellInvalidCommand);
                }
            }
        }

        public execute(fn, args?) {
            _StdOut.advanceLine();
            fn(args);
            // Check to see if we need to advance the line again
            if (_StdOut.currentXPosition > 0) {
                _StdOut.advanceLine();
            }
            //if ((fn != this.shellRun && fn != this.shellRunall)
            //|| !_CPU.isExecuting)
            if (_Status != 'error' && _Status != 'off' && _Status != 'processing')
              this.putPrompt();
        }

        public parseInput(buffer): UserCommand {
            var retVal = new UserCommand();

            // 1. Remove leading and trailing spaces.
            buffer = Utils.trim(buffer);

            // 2. Lower-case it.
            //buffer = buffer.toLowerCase();

            // 3. Separate on spaces so we can determine the command and command-line args, if any.
            var tempList = buffer.split(" ");

            // 4. Take the first (zeroth) element and use that as the command.
            var cmd = tempList.shift();  // Yes, you can do that to an array in JavaScript.  See the Queue class.
            // 4.1 Remove any left-over spaces.
            cmd = Utils.trim(cmd);
            // 4.2 Record it in the return value.
            retVal.command = cmd;

            // 5. Now create the args array from what's left.
            for (var i in tempList) {
                var arg = Utils.trim(tempList[i]);
                if (arg != "") {
                    retVal.args[retVal.args.length] = tempList[i];
                }
            }
            return retVal;
        }

        public shellQuantum(args): void {
            let q: number = parseInt(args[0]);
            if (q > 0) {
                _Scheduler.quantum = q;
            } else {
                _StdOut.putText("Invalid quantum value.");
                _StdOut.advanceLine();
            }
        }

        public shellKill(args): void {
            let pid: number = parseInt(args[0]);
            if (pid >= 0) {
                let ct = _PCB.getProcessByPid(pid);
                if (ct) {
                    _KernelInterruptQueue.enqueue(
                        new Interrupt(TERM_IRQ, {pid: pid}));
                } else {
                    _StdOut.putText("No process with PID " + pid + " found.");
                    _StdOut.advanceLine();
                }
            } else {
                _StdOut.putText("Invalid PID value.");
                _StdOut.advanceLine();
            }
        }

        public shellClearmem(): void {
            let cts = _PCB.getProcessesByState(
                STATE_READY | STATE_WAITING | STATE_EXECUTING);
            for (let i = 0; i < cts.length; i++) {
                // Clearing memory requires that we remove the processes too.
                // Set newline to false so we do not get new prompt lines
                _KernelInterruptQueue.enqueue(
                    new Interrupt(TERM_IRQ, {pid: cts[i].pid, newline:false}));
            }
        }

        public shellPs(): void {
        }

        public shellSMode(args): void {
            switch (args[0].toLowerCase()) {
                case 'fcfs':
                    _Scheduler.mode = MODE_FCFS;
                    break;
                case 'rr':
                    _Scheduler.mode = MODE_ROUND_ROBIN;
                    break;
                default:
                    _StdOut.putText("Invalid mode code.")
                    _StdOut.advanceLine();
            }
            TSOS.Devices.hostUpdateScheduleDisplay();
        }

        public shellRunall(): void {
            _PCB.runAll();
        }

        public shellRun(args: string[]): void {
            let pid = parseInt(args[0]);
            if (isNaN(pid)) {
                _StdOut.putText("PID must be a number.");
                return;
            }
            let res = _PCB.isReady(pid);
            if (res) {
                _PCB.runProcess(pid);
            } else {
                // TODO make error more specific
                _StdOut.putText("Process " + pid + " cannot be run.");
                this.putPrompt();
            }
        }


        // Check if something is a printable character
        private static isValidChar(ch): boolean {
            let c: number = ch.charCodeAt();
            return (c == 32)              // Space
                || (c == '\n'.charCodeAt(0))  
                || (c >= 48 && c <= 57)   // Digits
                || (c >= 97 && c <= 102)  // Lowercase a-f
                || (c >= 65 && c <= 70);  // Uppercase A-F
        }

        private static isHexDigit(ch): boolean {
            let c: number = ch.charCodeAt();
            return (c >= 48 && c <= 57)   // Digits
                || (c >= 97 && c <= 102)  // Lowercase a-f
                || (c >= 65 && c <= 70);  // Uppercase A-F
        }

        private static maxProgSize = 0x100;

        private static validateProgramInput(input: string): number[] {
            let valid: boolean = input.length != 0;
            let opChars: number[] = [];
            let firstDigit = true;
            let isValidChar: boolean;
            for (let i = 0; i < input.length; i++) {
                isValidChar =  Shell.isValidChar(input.charAt(i));
                valid = valid && isValidChar;
                // Count the number hex digits
                if (isValidChar && Shell.isHexDigit(input[i])) {
                    if (firstDigit) {
                        opChars[opChars.length]
                            = 0x10 * parseInt(input.charAt(i), 16);
                        firstDigit = false;
                    } else {
                        opChars[opChars.length-1] += parseInt(input.charAt(i), 16);
                        firstDigit = true;
                    }
                }
            }
            if (valid) {
                //_StdOut.putText("User program validated.");
            } else {
                _StdOut.putText("User program invalid.");
                _StdOut.advanceLine();
                if (input.length == 0)
                    _StdOut.putText("Input must be non-empty.");
                else if (opChars.length > Shell.maxProgSize)
                    _StdOut.putText("Program must be fewer than 256 bytes.");
                else
                    _StdOut.putText("Allowed characters are: 0-9, a-f, A-F.");
                opChars = [];
            }
            return opChars;
        }

        public shellLoad(): void {
            let text: string = TSOS.Control.hostGetUPI();
            let opChars: number[] = Shell.validateProgramInput(text);
            if (opChars.length != 0) {
                //_Memory.setBytes(0, opChars);
                let pid = _PCB.loadProcess(opChars);
                if (pid != -1) {
                    _StdOut.putText("Program loaded with PID " + pid); 
                } else {
                    //_StdOut.putText("An error occurred while loading the program."); 
                }
                TSOS.Devices.hostUpdateMemDisplay();
            }
        }

        public shellPanic(args: string[]): void {
          _Kernel.krnTrapError('User initiated kernel panic.');
        }

        public shellStatus(args: string[]): void {
            TSOS.Control.hostSetStatus(args.join(' '));
        }

        // Make the OS fade away
        public shellVanish(): void {
            TSOS.Control.hostToggleOSVisibility(false);
        }

        // Make the OS reappear
        public shellAppear(): void {
            TSOS.Control.hostToggleOSVisibility(true);
        }

        public shellWhereami(): void {
            _StdOut.putText("."); 
        }

        public shellDate(): void {
            let d = new Date();
            let month: number = d.getMonth() + 1;
            let day: number = d.getDate();
            let str: string =
                d.getFullYear() + '-' +
                (month < 10 ? '0' :'') + month + '-' +
                (day < 10 ? '0' :'') + day;
            _StdOut.putText(str);
        }

        public shellEcho(args: string[]): void {
            _StdOut.putText(args.join(' '));
        }

        public shellInvalidCommand() {
            _StdOut.putText("Invalid Command. ");
            if (_SarcasticMode) {
                _StdOut.putText("Unbelievable. You, [subject name here],");
                _StdOut.advanceLine();
                _StdOut.putText("must be the pride of [subject hometown here].");
            } else {
                _StdOut.putText("Type 'help' for, well... help.");
            }
        }

        public shellCurse() {
            _StdOut.putText("Oh, so that's how it's going to be, eh? Fine.");
            _StdOut.advanceLine();
            _StdOut.putText("Bitch.");
            _SarcasticMode = true;
        }

        public shellApology() {
           if (_SarcasticMode) {
              _StdOut.putText("I think we can put our differences behind us.");
              _StdOut.advanceLine();
              _StdOut.putText("For science . . . You monster.");
              _SarcasticMode = false;
           } else {
              _StdOut.putText("For what?");
           }
        }

        // Print the version of the OS and the browser information
        public shellVer(args) {
            _StdOut.putText(APP_NAME + " version " + APP_VERSION
               + " on " + navigator.userAgent );
        }

        public shellHelp(args) {
            _StdOut.putText("Commands:");
            for (var i in _OsShell.commandList) {
                _StdOut.advanceLine();
                _StdOut.putText("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description);
            }
        }

        public shellShutdown(args) {
             //_StdOut.putText("Shutting down...");
             _StdOut.advanceLine();

             // Call Kernel shutdown routine.
            _Kernel.krnShutdown();
        }

        public shellCls(args) {
            _StdOut.clearScreen();
            _StdOut.resetXY();
        }

        public shellMan(args) {
            if (args.length > 0) {
                var topic = args[0];
                switch (topic) {
                    case "help":
                        _StdOut.putText("Help displays a list of (hopefully) valid commands.");
                        break;
                    // TODO: Make descriptive MANual page entries for the the rest of the shell commands here.
                    default:
                        _StdOut.putText("No manual entry for " + args[0] + ".");
                }
            } else {
                _StdOut.putText("Usage: man <topic>  Please supply a topic.");
            }
        }

        public shellTrace(args) {
            if (args.length > 0) {
                var setting = args[0];
                switch (setting) {
                    case "on":
                        if (_Trace && _SarcasticMode) {
                            _StdOut.putText("Trace is already on, doofus.");
                        } else {
                            _Trace = true;
                            _StdOut.putText("Trace ON");
                        }
                        break;
                    case "off":
                        _Trace = false;
                        _StdOut.putText("Trace OFF");
                        break;
                    default:
                        _StdOut.putText("Invalid arguement.  Usage: trace <on | off>.");
                }
            } else {
                _StdOut.putText("Usage: trace <on | off>");
            }
        }

        public shellRot13(args) {
            if (args.length > 0) {
                // Requires Utils.ts for rot13() function.
                _StdOut.putText(args.join(' ') + " = '" + Utils.rot13(args.join(' ')) +"'");
            } else {
                _StdOut.putText("Usage: rot13 <string>  Please supply a string.");
            }
        }

        public shellPrompt(args) {
            if (args.length > 0) {
                _OsShell.promptStr = args[0];
            } else {
                _StdOut.putText("Usage: prompt <string>  Please supply a string.");
            }
        }

    }
}
