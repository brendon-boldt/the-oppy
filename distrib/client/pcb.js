///<reference path="../globals.ts" />
var TSOS;
(function (TSOS) {
    class Context {
        constructor(PC = 0, Acc = 0, Xreg = 0, Yreg = 0, Zflag = 0, segment = 0x0) {
            this.PC = PC;
            this.Acc = Acc;
            this.Xreg = Xreg;
            this.Yreg = Yreg;
            this.Zflag = Zflag;
            this.segment = segment;
            this.state = STATE_READY;
        }
    }
    TSOS.Context = Context;
    class Pcb {
        constructor(processes = Array()) {
            this.processes = processes;
            this.pidCounter = 0;
        }
        getProcessByPid(pid) {
            for (let i = 0; i < this.processes.length; i++) {
                if (this.processes[i].pid == pid)
                    return this.processes[i];
            }
            return null;
        }
        getNextSegment() {
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
        addProcess(ct) {
            let pid = this.pidCounter++;
            ct.pid = pid;
            this.processes.push(ct);
            return pid;
        }
        /**
         * Returns the PID
         */
        loadProcess(bytes) {
            let segNum = this.getNextSegment();
            console.log("segNum: " + segNum);
            if (segNum != -1) {
                _MMU.loadBytesToSegment(segNum, bytes);
                let ct = new Context();
                ct.segment = segNum;
                return this.addProcess(ct);
            }
            else {
                // TODO throw error
                return -1;
            }
        }
        isReady(pid) {
            let res = this.getProcessByPid(pid);
            if (res) {
                return res.state == STATE_READY;
            }
            else {
                return false;
            }
        }
        runProcess(pid) {
            let ct = this.getProcessByPid(pid);
            let segNum = ct.segment;
            ct.state = STATE_EXECUTING;
            _CPU.startExecution(_MMU.getSegmentAddress(segNum));
        }
        runAll() {
            for (let pid in this.processes.keys()) {
                this.runProcess(parseInt(pid));
            }
        }
        /**
         * If pid == -1, terminate the currently running process
         */
        terminateProcess(pid = -1) {
            if (pid == -1) {
                for (let i = 0; i < this.processes.length; i++) {
                    if (this.processes[i].state == STATE_EXECUTING)
                        pid = this.processes[i].pid;
                }
            }
            console.log("Terminating: " + pid);
            let ct = this.getProcessByPid(pid);
            if (ct) {
                _MMU.clearSegment(ct.segment);
                let index;
                for (let i = 0; i < this.processes.length; i++) {
                    if (this.processes[i].pid == pid)
                        index = i;
                }
                this.processes.splice(index, 1);
            }
            else {
            }
        }
    }
    TSOS.Pcb = Pcb;
})(TSOS || (TSOS = {}));
