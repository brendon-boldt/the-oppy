///<reference path="../globals.ts" />
var TSOS;
(function (TSOS) {
    class Scheduler {
        constructor(CPU) {
            this.CPU = CPU;
            this.isActive = true;
            this.burstCounter = 0;
            this.rrCounter = 0xffff;
            this.quantum = 6;
            this.mode = MODE_ROUND_ROBIN;
        }
        /** Modular switch design for easy addition of scheduling methods
         */
        cycle() {
            switch (this.mode) {
                case MODE_ROUND_ROBIN:
                    this.roundRobin();
                    break;
                case MODE_PRIORITY:
                    this.priority();
                    break;
                case MODE_FCFS:
                    this.firstComeFristServe();
                    break;
                default:
                    // Maybe I should default to last come first serve.
                    this.roundRobin();
            }
        }
        /** Priority scheduling
         */
        priority() {
            let procs = _PCB.getProcessesByState(STATE_WAITING);
            if (procs.length > 0) {
                let ct = procs[0];
                for (let i = 1; i < procs.length; ++i) {
                    if (procs[i].priority < ct.priority) {
                        ct = procs[i];
                    }
                }
                if (!this.CPU.isExecuting) {
                    _Kernel.krnTrace("Priority: switching to PID " + ct.pid);
                    this.CPU.startExecution(ct);
                }
            }
        }
        /** Self explanatory.
         */
        firstComeFristServe() {
            let procs = _PCB.getProcessesByState(STATE_WAITING);
            if (procs.length > 0) {
                if (!this.CPU.isExecuting) {
                    _Kernel.krnTrace("FCFS: switching to PID " + procs[0].pid);
                    this.CPU.startExecution(procs[0]);
                }
            }
        }
        /** Get the next process to run in round robin.
         */
        getNextRRProcess(procs) {
            for (let i = 0; i < procs.length; i++) {
                if (procs[i].state == STATE_EXECUTING)
                    this.rrCounter += 1;
            }
            this.rrCounter = this.rrCounter % procs.length;
            return procs[this.rrCounter];
        }
        getNextRRSwap(procs) {
            let ct = undefined;
            let len = procs.length;
            for (let i = 0; i < len; ++i) {
                let tempCt = procs[(this.rrCounter + len - 1 - i) % len];
                if (tempCt.inMemory) {
                    ct = tempCt;
                    break;
                }
            }
            return ct;
        }
        roundRobin() {
            // Since process states are represented with separate bits,
            // you can query multiple process states using  bitwise operators.
            let procs = _PCB.getProcessesByState(STATE_WAITING | STATE_EXECUTING);
            if (procs.length > 1) {
                // Context switch if the counter is above the quantum
                if (this.burstCounter >= this.quantum) {
                    this.burstCounter = 0;
                    let ct = this.getNextRRProcess(procs);
                    //console.log("Switching: " + ct.pid);
                    _Kernel.krnTrace("Round Robin: switching to PID " + ct.pid);
                    _KernelInterruptQueue.enqueue(new TSOS.Interrupt(CT_SWITCH_IRQ, { pid: ct.pid }));
                }
                else {
                    let executing = false;
                    for (let i = 0; i < procs.length; i++) {
                        if (procs[i].state == STATE_EXECUTING)
                            executing = true;
                    }
                    if (!executing) {
                        this.burstCounter = 0;
                        let ct = this.getNextRRProcess(procs);
                        //console.log("Switching: " + ct.pid);
                        _Kernel.krnTrace("Round Robin: switching to PID " + ct.pid);
                        _KernelInterruptQueue.enqueue(new TSOS.Interrupt(CT_SWITCH_IRQ, { pid: ct.pid }));
                    }
                }
            }
            else if (procs.length == 1) {
                if (procs[0].state == STATE_WAITING) {
                    _KernelInterruptQueue.enqueue(new TSOS.Interrupt(CT_SWITCH_IRQ, { pid: procs[0].pid }));
                }
            }
            else {
                // Set burstCounter to a big number so the next process
                // automatically context switches in.
                this.burstCounter = 0xffff;
            }
        }
        getNextSwapContext() {
            let ct = undefined;
            switch (this.mode) {
                case MODE_ROUND_ROBIN:
                    ct = this.getNextRRSwap(_PCB.processes);
                    break;
                case MODE_FCFS:
                default:
                    for (let i = 0; i < _PCB.processes.length; ++i) {
                        if (_PCB.processes[i].inMemory) {
                            ct = _PCB.processes[i];
                            break;
                        }
                    }
            }
            if (ct == undefined) {
                console.log("Undefined segment");
            }
            return ct;
        }
        /** Update the run time and wait time of all of the processes
         *  in the ready queue.
         */
        updateTimes() {
            let procs = _PCB.getProcessesByState(STATE_WAITING | STATE_EXECUTING);
            for (let i = 0; i < procs.length; i++) {
                if (procs[i].state == STATE_EXECUTING) {
                    procs[i].runTime++;
                }
                else if (procs[i].state == STATE_WAITING) {
                    procs[i].waitTime++;
                }
            }
        }
    }
    TSOS.Scheduler = Scheduler;
})(TSOS || (TSOS = {}));
