///<reference path="../globals.ts" />

module TSOS {

    /**
     * The Context class represents the context of a given thread
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
        public state: symbol = STATE_READY;
    }

    export class Pcb {

        constructor(public processes: Context[] = Array()) {

        }
        
        private pidCounter = 0;

        // I am sorry I do not have a good data structure for retrieval.
        // I will find something ... eventually.
        public getProcessByPid(pid: number): Context {
            for (let i = 0; i < this.processes.length; i++) {
                if (this.processes[i].pid == pid)
                    return this.processes[i];
            }
            return null;
        }

        /** Get the process currently executing on the CPU.
         */
        public getCurrentProcess(): Context {
            let ct = null;
            for (let i = 0; i < this.processes.length; i++) {
                if (this.processes[i].state == STATE_EXECUTING)
                    ct = this.processes[i];
            }
            return ct;
        }

        /** Update the PCB entry corresponding to the current process.
         */
        public updatePCB() {
            let ct = this.getCurrentProcess();
            ct.PC = _CPU.PC;
            ct.IR = _CPU.IR;
            ct.Acc = _CPU.Acc;
            ct.Xreg = _CPU.Xreg;
            ct.Yreg = _CPU.Yreg;
            ct.Zflag = _CPU.Zflag;
        }

        /** Get list of processes currently ready to be executed.
         */
        public getReadyProcesses(): Context[] {
            let cts: Context[] = [];
            for (let i = 0; i < this.processes.length; i++) {
                if (this.processes[i].state == STATE_READY)
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

        /** 
         * Set the segment and begin executing.
         * TODO Will add actually passing the context to the CPU for switching
         */
        public runProcess(pid: number): void {
            let ct = this.getProcessByPid(pid);
            let segNum = ct.segment;
            ct.state = STATE_EXECUTING;
            _CPU.startExecution(_MMU.getSegmentAddress(segNum), segNum);
        }

        public runAll(): void {
            for (let i = 0; i < this.processes.length; i++) {
                this.runProcess(this.processes[i].pid);
            }
        }

        /**
         * If pid == -1, terminate the currently running process
         * This should ONLY be called using the TErM_IRQ interrupt -- ONLY
         */
        public terminateProcess(pid: number = -1): void {
            let ct: Context;
            if (pid == -1) {
                // No args: find the currently executing process
                for (let i = 0; i < this.processes.length; i++) {
                    if (this.processes[i].state == STATE_EXECUTING)
                        ct = this.processes[i];
                }
            }  else {
                ct = this.getProcessByPid(pid);
            }

            if (ct) { // If the proper context was found
                // Clear the segment
                _MMU.clearSegment(ct.segment); 
                let index: number;
                for (let i = 0; i < this.processes.length; i++) {
                    if (this.processes[i].pid == pid)
                        index = i;
                }
                // Remove the context from the PCB
                this.processes.splice(index, 1)
                // Stop executing and update various displays
                _CPU.isExecuting = false;
                _CPU.clearColors();
                Devices.hostUpdatePcbDisplay();
                _Status = 'idle';
            } else {
                // TODO raise error
            }
            if (_PCB.getReadyProcesses().length == 0) {
                _StdOut.advanceLine();
                _OsShell.putPrompt();
            }
        }

    }

}