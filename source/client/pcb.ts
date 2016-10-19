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

        public getNextSegment(): number {
            let minSeg = _MMU.getSegmentCount();
            if (this.processes.length == 0)
                return 0;
            for (let i = 0; i < this.processes.length; i++) {
                if (this.processes[i].segment < minSeg)
                    minSeg = this.processes[i].segment;
            }
            console.log(this.processes);
            console.log(minSeg);
            console.log(_MMU.getSegmentCount());
            if (minSeg == _MMU.getSegmentCount()) {
                minSeg = -1;
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
            return pid;
        }

        /**
         * Returns the PID
         */
        public loadProcess(bytes: number[]): number {
            let segNum = this.getNextSegment();
            console.log("segNum: " + segNum);
            if (segNum != -1) {
                _MMU.loadBytesToSegment(segNum, bytes); 
                let ct = new Context();
                ct.segment = segNum;
                return this.addProcess(ct);
            } else {
                // TODO throw error
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
            _CPU.startExecution(_MMU.getSegmentAddress(segNum));
        }

        public runAll(): void {
            for (let pid in this.processes.keys()) {
                this.runProcess(parseInt(pid));
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
            } else {
                // TODO raise error
            }
        }

    }

}
