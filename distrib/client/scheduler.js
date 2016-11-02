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
        cycle() {
            switch (this.mode) {
                case MODE_ROUND_ROBIN:
                    this.roundRobin();
                    break;
                case MODE_FCFS:
                    this.firstComeFristServe();
                    break;
                default:
                    this.roundRobin();
            }
        }
        firstComeFristServe() {
            let procs = _PCB.getProcessesByState(STATE_WAITING);
            if (procs.length > 0) {
                if (!this.CPU.isExecuting) {
                    //_PCB.runProcess(procs[1].pid);
                    this.CPU.startExecution(procs[0]);
                }
            }
            else if (procs.length == 0) {
            }
        }
        getNextRRProcess(procs) {
            for (let i = 0; i < procs.length; i++) {
                if (procs[i].state == STATE_EXECUTING)
                    this.rrCounter += 1;
            }
            this.rrCounter = this.rrCounter % procs.length;
            //_PCB.pauseExecution();
            return procs[this.rrCounter];
        }
        roundRobin() {
            let procs = _PCB.getProcessesByState(STATE_WAITING | STATE_EXECUTING);
            if (procs.length > 0) {
                if (this.burstCounter >= this.quantum) {
                    this.burstCounter = 0;
                    let ct = this.getNextRRProcess(procs);
                    console.log("Switching: " + ct.pid);
                    _KernelInterruptQueue.enqueue(new TSOS.Interrupt(CT_SWITCH_IRQ, { pid: ct.pid }));
                }
            }
            else {
                // Set burstCounter to a big number so the next process
                // automatically context switches in.
                this.burstCounter = 0xffff;
            }
        }
    }
    TSOS.Scheduler = Scheduler;
})(TSOS || (TSOS = {}));
