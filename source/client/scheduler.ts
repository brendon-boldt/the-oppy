///<reference path="../globals.ts" />


module TSOS {

    export class Scheduler {

        constructor(public CPU) {
        }

        public isActive: boolean = true;

        public burstCounter: number = 0;
        private rrCounter: number = 0xffff;
        public quantum: number = 6;
        public mode: Symbol = MODE_ROUND_ROBIN;

        public cycle(): void {
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
            if (procs.length > 1) {
                if (this.burstCounter >= this.quantum) {
                    this.burstCounter = 0;
                    let ct = this.getNextRRProcess(procs);
                    console.log("Switching: " + ct.pid);
                    _KernelInterruptQueue.enqueue(
                        new Interrupt(CT_SWITCH_IRQ,
                        {pid: ct.pid}));

                    //this.CPU.startExecution(ct);
                }
            } else if (procs.length == 1) {
                if (procs[0].state == STATE_WAITING) {
                    _KernelInterruptQueue.enqueue(
                        new Interrupt(CT_SWITCH_IRQ,
                        {pid: procs[0].pid}));
                }
            } else {
                // Set burstCounter to a big number so the next process
                // automatically context switches in.
                this.burstCounter = 0xffff;
            }
        }
    }
}
