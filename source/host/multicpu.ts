///<reference path="../globals.ts" />


module TSOS {

    export class MultiCpu {
        constructor(public cpus: Cpu[],
                    public isExecuting: boolean = false) {
        }

        public stopExecution(): void {
            for (let i = 0; i < this.cpus.length; i++) {
                this.cpus[i].stopExecution();
            }
        }

        public cycle(): void {
            for (let i = 0; i < this.cpus.length; i++) {
                this.cpus[i].cycle();
            }
        }
    }
}
