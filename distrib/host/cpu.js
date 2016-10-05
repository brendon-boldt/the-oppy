///<reference path="../globals.ts" />
/* ------------
     CPU.ts

     Requires global.ts.

     Routines for the host CPU simulation, NOT for the OS itself.
     In this manner, it's A LITTLE BIT like a hypervisor,
     in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
     that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
     TypeScript/JavaScript in both the host and client environments.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */
var TSOS;
(function (TSOS) {
    var Cpu = (function () {
        function Cpu(PC, Acc, Xreg, Yreg, Zflag, isExecuting) {
            if (PC === void 0) { PC = 0; }
            if (Acc === void 0) { Acc = 0; }
            if (Xreg === void 0) { Xreg = 0; }
            if (Yreg === void 0) { Yreg = 0; }
            if (Zflag === void 0) { Zflag = 0; }
            if (isExecuting === void 0) { isExecuting = false; }
            this.PC = PC;
            this.Acc = Acc;
            this.Xreg = Xreg;
            this.Yreg = Yreg;
            this.Zflag = Zflag;
            this.isExecuting = isExecuting;
            this.coloredCells = [];
        }
        Cpu.prototype.init = function () {
            this.PC = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.isExecuting = false;
        };
        Cpu.prototype.handleOpCode = function (oc) {
            switch (oc) {
                case 0xA9:
                    this.Acc = _Memory.getByte(this.PC + 1);
                    this.PC += 2;
                    break;
                case 0xAD:
                    this.Acc = _Memory.getByte(_Memory.getByte(this.PC + 2) * 0x100
                        + _Memory.getByte(this.PC + 1));
                    this.PC += 3;
                    break;
                case 0x8D:
                    break;
                case 0x6D:
                    break;
                case 0xA2:
                    break;
                case 0xAE:
                    break;
                case 0xA0:
                    break;
                case 0xAC:
                    break;
                case 0xEA:
                    this.PC++;
                    break;
                case 0x00:
                    _Status = 'idle';
                    this.isExecuting = false;
                    break;
                case 0xEC:
                    break;
                case 0xD0:
                    break;
                case 0xEE:
                    break;
                case 0xFF:
                    break;
            }
        };
        Cpu.prototype.startExecution = function (addr) {
            // TODO check the address
            this.PC = addr;
            this.isExecuting = true;
            _Status = 'processing';
        };
        Cpu.prototype.clearColors = function () {
            for (var i = 0; i < this.coloredCells.length; i++) {
                TSOS.Devices.hostSetMemCellColor(this.coloredCells[i]);
            }
            this.coloredCells = [];
        };
        Cpu.prototype.cycle = function () {
            _Kernel.krnTrace('CPU cycle');
            this.clearColors();
            TSOS.Devices.hostUpdateCpuDisplay();
            TSOS.Devices.hostSetMemCellColor(this.PC, 'green');
            this.coloredCells.push(this.PC);
            this.handleOpCode(_Memory.getByte(this.PC));
            if (!this.isExecuting) {
                this.clearColors();
            }
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.
        };
        return Cpu;
    }());
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
