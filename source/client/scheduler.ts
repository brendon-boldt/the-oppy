///<reference path="../globals.ts" />


module TSOS {

    export class Scheduler {

        constructor(public CPU) {
        }

        public isActive: boolean = true;

        private quantumCounter: number = 0;
        private rrCounter: number = 0xffff;
        public quantum: number = 6;

        public cycle(): void {
            this.roundRobin();
            //this.firstComeFristServe();
        }

        private firstComeFristServe(): void {
            let procs = _PCB.getProcessesByState(STATE_WAITING);
            if (procs.length > 0) {
                if (!this.CPU.isExecuting) {
                    //_PCB.runProcess(procs[1].pid);
                    this.CPU.startExecution(procs[0]);
                }
            } else if (procs.length == 0) {
                //this.CPU.stopExecution();
            }
        }

        private getNextRRProcess(procs): Context {
            for (let i = 0; i < procs.length; i++) {
                if (procs[i].state == STATE_EXECUTING)
                    this.rrCounter += 1;
            }
            this.rrCounter = this.rrCounter % procs.length;
            //_PCB.pauseExecution();
            return procs[this.rrCounter];
        }
        
        private roundRobin(): void {
            let procs = _PCB.getProcessesByState(STATE_WAITING | STATE_EXECUTING);
            if (procs.length > 0) {
                if (this.quantumCounter > this.quantum) {
                    this.quantumCounter = 0;
                    let ct = this.getNextRRProcess(procs);
                    _KernelInterruptQueue.enqueue(
                        new Interrupt(CT_SWITCH_IRQ,
                        {pid: ct.pid}));

                    //this.CPU.startExecution(ct);
                }
            }
            this.quantumCounter++;
        }
    }
}
