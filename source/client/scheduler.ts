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

        /** Modular switch design for easy addition of scheduling methods
         */
        public cycle(): void {
            switch (this.mode) {
                case MODE_ROUND_ROBIN:
                    this.roundRobin();
                    break;
                case MODE_FCFS:
                    this.firstComeFristServe();
                    break;
                default:
                    // Maybe I should default to last come first serve.
                    this.roundRobin();
            }
        }

        /** Self explanatory.
         */
        private firstComeFristServe(): void {
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
        private getNextRRProcess(procs): Context {
            for (let i = 0; i < procs.length; i++) {
                if (procs[i].state == STATE_EXECUTING)
                    this.rrCounter += 1;
            }
            this.rrCounter = this.rrCounter % procs.length;
            return procs[this.rrCounter];
        }

        private getNextRRSwap(procs): Context {
            let ct: Context = undefined;
            let len = procs.length;
            for (let i = 0; i < len; ++ i) {
                let tempCt = procs[(this.rrCounter + len-1 - i) % len];
                if (tempCt.inMemory) {
                    ct = tempCt;
                    break;
                }
            }
            return ct;
        }
        
        private roundRobin(): void {
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
                    _KernelInterruptQueue.enqueue(
                        new Interrupt(CT_SWITCH_IRQ,
                        {pid: ct.pid}));
                } else {
                    let executing: boolean = false;
                    for (let i = 0; i < procs.length; i++) {
                        if (procs[i].state == STATE_EXECUTING)
                            executing = true;
                    }
                    if (!executing) {
                        this.burstCounter = 0;
                        let ct = this.getNextRRProcess(procs);
                        //console.log("Switching: " + ct.pid);
                        _Kernel.krnTrace("Round Robin: switching to PID " + ct.pid);
                        _KernelInterruptQueue.enqueue(
                            new Interrupt(CT_SWITCH_IRQ,
                            {pid: ct.pid}));
                    }
                }
            } else if (procs.length == 1) { // Edge case
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

        public getNextSwapContext(): Context {
            let ct: Context = undefined;
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
        public updateTimes() {
            let procs = _PCB.getProcessesByState(STATE_WAITING | STATE_EXECUTING);
            for (let i = 0; i < procs.length; i++) {
                if (procs[i].state == STATE_EXECUTING) {
                    procs[i].runTime++;
                } else if (procs[i].state == STATE_WAITING) {
                    procs[i].waitTime++;
                }
            }
        }
    }
}
