///<reference path="../globals.ts" />

module TSOS {

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

        public getProcessByPid(pid: number): Context {
            for (let i = 0; i < this.processes.length; i++) {
                if (this.processes[i].pid == pid)
                    return this.processes[i];
            }
            return null;
        }

        public getCurrentProcess(): Context {
            let ct = null;
            for (let i = 0; i < this.processes.length; i++) {
                if (this.processes[i].state == STATE_EXECUTING)
                    ct = this.processes[i];
            }
            return ct;
        }

        public updatePCB() {
            let ct = this.getCurrentProcess();
            ct.PC = _CPU.PC;
            ct.IR = _CPU.IR;
            ct.Acc = _CPU.Acc;
            ct.Xreg = _CPU.Xreg;
            ct.Yreg = _CPU.Yreg;
            ct.Zflag = _CPU.Zflag;
        }

        public getReadyProcesses(): Context[] {
            let cts: Context[] = [];
            for (let i = 0; i < this.processes.length; i++) {
                if (this.processes[i].state == STATE_READY)
                    cts.push(this.processes[i]);
            }
            return cts;
        }

        public getNextSegment(): number {
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
         */
        public loadProcess(bytes: number[]): number {
            let segNum = this.getNextSegment();
            console.log("segNum: " + segNum);
            if (segNum != undefined) {
                _MMU.loadBytesToSegment(segNum, bytes); 
                let ct = new Context();
                ct.segment = segNum;
                return this.addProcess(ct);
            } else {
                // TODO throw error
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
         */
        public terminateProcess(pid: number = -1): void {
            if (pid == -1) {
                for (let i = 0; i < this.processes.length; i++) {
                    if (this.processes[i].state == STATE_EXECUTING)
                        pid = this.processes[i].pid;
                }
            } 
            console.log("Terminating: " + pid);
            let ct: Context = this.getProcessByPid(pid);
            if (ct) {
                _MMU.clearSegment(ct.segment); 
                let index: number;
                for (let i = 0; i < this.processes.length; i++) {
                    if (this.processes[i].pid == pid)
                        index = i;
                }
                this.processes.splice(index, 1)
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
