///<reference path="../globals.ts" />
var TSOS;
(function (TSOS) {
    class Scheduler {
        constructor(CPU) {
            this.CPU = CPU;
            this.isActive = true;
            this.quantumCounter = 0;
            this.rrCounter = 0xffff;
            this.quantum = 6;
        }
        cycle() {
            this.roundRobin();
            //this.firstComeFristServe();
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
            _PCB.pauseExecution();
            return procs[this.rrCounter];
        }
        roundRobin() {
            let procs = _PCB.getProcessesByState(STATE_WAITING | STATE_EXECUTING);
            if (procs.length > 0) {
                if (this.quantumCounter > this.quantum) {
                    this.quantumCounter = 0;
                    let ct = this.getNextRRProcess(procs);
                    this.CPU.startExecution(ct);
                }
            }
            this.quantumCounter++;
        }
    }
    TSOS.Scheduler = Scheduler;
})(TSOS || (TSOS = {}));
