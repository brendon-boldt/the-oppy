///<reference path="../globals.ts" />

module TSOS {

    /**
     * The Context class represents the context of a given thread.
     *
     * The Context class is used both in PCB entries as well as in the CPU
     * itself which makes for cleaner and easier context switching.
     */
    export class Context {
        constructor(public PC: number = 0,
                    public Acc: number = 0,
                    public Xreg: number = 0,
                    public Yreg: number = 0,
                    public Zflag: number = 0,
                    public segment: number = 0x0) {
        }

        public pid: number;
        public IR: number;
        public state: number = STATE_READY;
        public cpuNum: number;

        public runTime: number = 0;
        public waitTime: number = 0;

        /** Get the segment-adjusted program counter.
         */
        public getAbsPC(): number {
            return this.PC + this.segment * _MMU.segmentSize;
        }
    }

    export class Pcb {

        constructor(public processes: Context[] = Array()) {

        }
        
        private pidCounter = 0;

        public getProcessByPid(pid: number): Context {
            for (let i = 0; i < this.processes.length; i++) {
                if (this.processes[i].pid == pid)
                    return this.processes[i];
            }
            return null;
        }

        /** Get list of processes currently ready to be executed.
         */
        public getProcessesByState(state: number): Context[] {
            let cts: Context[] = [];
            for (let i = 0; i < this.processes.length; i++) {
                if ((this.processes[i].state & state) != 0)
                    cts.push(this.processes[i]);
            }
            return cts;
        }

        /** Get the first available segment not being used by a process.
         */
        public getNextSegment(): number {
            // Make an array of segment indices where 'true' means used
            // and 'undefined' means unused.
            let segs = Array(_MMU.getSegmentCount());
            for (let i = 0; i < this.processes.length; i++) {
                segs[this.processes[i].segment] = true;
            }
            let minSeg: number;
            for (let i = 0; i < segs.length; i++) {
                if (segs[i] == undefined) {
                   minSeg = i; 
                   break;
                }
            }
            return minSeg;
        }

        /**
         * Returns the PID
         * Simply adds a context to the PCB
         */
        private addProcess(ct: Context): number {
            let pid = this.pidCounter++;
            ct.pid = pid;
            this.processes.push(ct);
            Devices.hostUpdatePcbDisplay();
            return pid;
        }

        /**
         * Returns the PID
         * Loads bytes to the first open segment before calling addProcess()
         */
        public loadProcess(bytes: number[]): number {
            let segNum = this.getNextSegment();
            if (segNum != undefined) {
                _MMU.loadBytesToSegment(segNum, bytes); 
                let ct = new Context();
                ct.segment = segNum;
                return this.addProcess(ct);
            } else {
                _StdOut.putText("Loading failed: no available segments.");
                _StdOut.advanceLine();
                return -1;
            }
        }

        public isReady(pid: number): boolean {
            let res: Context = this.getProcessByPid(pid);
            if (res) {
                return res.state == STATE_READY;
            } else {
                return false;
            }
        }

        /** Change the state of the process to waiting.
         *  The scheduler will handle everything from here.
         */
        public runProcess(pid): void {
            console.log("Running: " + pid);
            let ct = this.getProcessByPid(pid);
            ct.state = STATE_WAITING;
        }

        public runAll(): void {
            for (let i = 0; i < this.processes.length; i++) {
                this.runProcess(this.processes[i].pid);
            }
        }

        /** Return the state of the process to waiting.
         */
        public pauseExecution(cpuNum: number): void {
            _MCPU.cpus[cpuNum].ct.state = STATE_WAITING;
        }

        /** Switching contexts is not hard since both the PCB and the CPU make
         *  use of the Context class.
         */
        public contextSwitch(params): void {
            if (params.cpuNum == undefined)
                alert('define cpuNum');
            let pid = params.pid;
            let ct = this.getProcessByPid(params.pid);
            if (!ct) {
                //_Kernel.krnTrapError("Attempted to context switch to non-existent process.");
                _Kernel.krnTrace("Could not context switch to PID " + pid);
            } else {
                this.pauseExecution(params.cpuNum);
                _MCPU.cpus[params.cpuNum].startExecution(ct);
            }
        }

        /**
         * If pid == -1, terminate the currently running process
         * This should ONLY be called using the TErM_IRQ interrupt -- ONLY
         */
        public terminateProcess(params): void {
            if (params.cpuNum == undefined)
                alert('define cpuNum');
            let pid = params.pid;
            let newline = params.newline;
            let ct: Context = this.getProcessByPid(pid);

            console.log("Terminating: " + pid);            
            if (ct) { // If the proper context was found
                // Clear the segment
                _MMU.clearSegment(ct.segment); 
                ct.state = STATE_TERMINATED;

                if (_DebugMode) {
                    _StdOut.advanceLine();
                    _StdOut.putText("PID " + ct.pid);
                    _StdOut.advanceLine();
                    _StdOut.putText("Wait time: " + ct.waitTime + " cycles");
                    _StdOut.advanceLine();
                    _StdOut.putText("Turnaround time: "
                            + (ct.runTime + ct.waitTime) + " cycles");
                }

                let index: number;
                for (let i = 0; i < this.processes.length; i++) {
                    if (this.processes[i].pid == pid)
                        index = i;
                }
                // Remove the context from the PCB
                this.processes.splice(index, 1)
                _MCPU.cpus[params.cpuNum].stopExecution();
                // Stop executing and update various displays
                Devices.hostUpdatePcbDisplay();
                _Status = 'idle';
            } else {
                console.log(new Error().stack);
                _StdOut.putText("PID: " + pid + " does not exist.");
                _StdOut.advanceLine();
            }
            
            let waitList = _PCB.getProcessesByState(STATE_WAITING | STATE_EXECUTING);
            if (params.newline !== false && waitList.length == 0) {
                _StdOut.advanceLine();
                _OsShell.putPrompt();
            } else {
                //this.runProcess(waitList[0].pid);
            }
        }

    }

}
