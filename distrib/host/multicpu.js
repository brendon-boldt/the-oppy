///<reference path="../globals.ts" />
var TSOS;
(function (TSOS) {
    class MultiCpu {
        constructor(cpus, isExecuting = false) {
            this.cpus = cpus;
            this.isExecuting = isExecuting;
        }
        stopExecution() {
            for (let i = 0; i < this.cpus.length; i++) {
                this.cpus[i].stopExecution();
            }
        }
        cycle() {
            for (let i = 0; i < this.cpus.length; i++) {
                this.cpus[i].cycle();
            }
        }
    }
    TSOS.MultiCpu = MultiCpu;
})(TSOS || (TSOS = {}));
