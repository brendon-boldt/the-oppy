///<reference path="../globals.ts" />
var TSOS;
(function (TSOS) {
    /**
     * The Context class represents the context of a given thread
     */
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
        // I am sorry I do not have a good data structure for retrieval.
        // I will find something ... eventually.
        getProcessByPid(pid) {
            for (let i = 0; i < this.processes.length; i++) {
                if (this.processes[i].pid == pid)
                    return this.processes[i];
            }
            return null;
        }
        /** Get the process currently executing on the CPU.
         */
        getCurrentProcess() {
            let ct = null;
            for (let i = 0; i < this.processes.length; i++) {
                if (this.processes[i].state == STATE_EXECUTING)
                    ct = this.processes[i];
            }
            return ct;
        }
        /** Update the PCB entry corresponding to the current process.
         */
        updatePCB() {
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
        getReadyProcesses() {
            let cts = [];
            for (let i = 0; i < this.processes.length; i++) {
                if (this.processes[i].state == STATE_READY)
                    cts.push(this.processes[i]);
            }
            return cts;
        }
        /** Get the first available segment not being used by a process.
         */
        getNextSegment() {
            // Make an array of segment indices where 'true' means used
            // and 'undefined' means unused.
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
         * Loads bytes to the first open segment before calling addProcess()
         */
        loadProcess(bytes) {
            let segNum = this.getNextSegment();
            if (segNum != undefined) {
                _MMU.loadBytesToSegment(segNum, bytes);
                let ct = new Context();
                ct.segment = segNum;
                return this.addProcess(ct);
            }
            else {
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
        /**
         * Set the segment and begin executing.
         * TODO Will add actually passing the context to the CPU for switching
         */
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
         * This should ONLY be called using the TErM_IRQ interrupt -- ONLY
         */
        terminateProcess(pid = -1) {
            let ct;
            if (pid == -1) {
                // No args: find the currently executing process
                for (let i = 0; i < this.processes.length; i++) {
                    if (this.processes[i].state == STATE_EXECUTING)
                        ct = this.processes[i];
                }
            }
            else {
                ct = this.getProcessByPid(pid);
            }
            console.log("Terminating: " + ct.pid);
            if (ct) {
                // Clear the segment
                _MMU.clearSegment(ct.segment);
                let index;
                for (let i = 0; i < this.processes.length; i++) {
                    if (this.processes[i].pid == pid)
                        index = i;
                }
                // Remove the context from the PCB
                this.processes.splice(index, 1);
                // Stop executing and update various displays
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
