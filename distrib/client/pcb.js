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
        getCurrentProcess() {
            let ct = null;
            for (let i = 0; i < this.processes.length; i++) {
                if (this.processes[i].state == STATE_EXECUTING)
                    ct = this.processes[i];
            }
            return ct;
        }
        updatePCB() {
            let ct = this.getCurrentProcess();
            ct.PC = _CPU.PC;
            ct.IR = _CPU.IR;
            ct.Acc = _CPU.Acc;
            ct.Xreg = _CPU.Xreg;
            ct.Yreg = _CPU.Yreg;
            ct.Zflag = _CPU.Zflag;
        }
        getReadyProcesses() {
            let cts = [];
            for (let i = 0; i < this.processes.length; i++) {
                if (this.processes[i].state == STATE_READY)
                    cts.push(this.processes[i]);
            }
            return cts;
        }
        getNextSegment() {
            let segs = Array(_MMU.getSegmentCount());
            for (let i = 0; i < this.processes.length; i++) {
                segs[this.processes[i].segment] = true;
            }
            let minSeg;
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
        addProcess(ct) {
            let pid = this.pidCounter++;
            ct.pid = pid;
            this.processes.push(ct);
            TSOS.Devices.hostUpdatePcbDisplay();
            return pid;
        }
        /**
         * Returns the PID
         */
        loadProcess(bytes) {
            let segNum = this.getNextSegment();
            console.log("segNum: " + segNum);
            if (segNum != undefined) {
                _MMU.loadBytesToSegment(segNum, bytes);
                let ct = new Context();
                ct.segment = segNum;
                return this.addProcess(ct);
            }
            else {
                // TODO throw error
                _StdOut.putText("Loading failed: no available segments.");
                _StdOut.advanceLine();
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
            _CPU.startExecution(_MMU.getSegmentAddress(segNum), segNum);
        }
        runAll() {
            for (let i = 0; i < this.processes.length; i++) {
                this.runProcess(this.processes[i].pid);
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
                _CPU.isExecuting = false;
                _CPU.clearColors();
                TSOS.Devices.hostUpdatePcbDisplay();
                _Status = 'idle';
            }
            else {
            }
            if (_PCB.getReadyProcesses().length == 0) {
                _StdOut.advanceLine();
                _OsShell.putPrompt();
            }
        }
    }
    TSOS.Pcb = Pcb;
})(TSOS || (TSOS = {}));
