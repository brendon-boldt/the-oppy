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

module TSOS {

    export class Cpu {

        constructor(public PC: number = 0,
                    public Acc: number = 0,
                    public Xreg: number = 0,
                    public Yreg: number = 0,
                    public Zflag: number = 0,
                    public isExecuting: boolean = false) {

        }

        public init(): void {
            this.PC = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.isExecuting = false;
        }

        private handleOpCode(oc: number) {
            switch (oc) {
                case 0xA9: // Load acc with constant
                    this.Acc = _Memory.getByte(this.PC+1);
                    this.PC += 2;
                    break;
                case 0xAD: // Load acc from memory
                    this.Acc = _Memory.getByte(
                        _Memory.getByte(this.PC+2)*0x100
                        + _Memory.getByte(this.PC+1));
                    this.PC += 3;
                    break;
                case 0x8D: // Store acc in memory
                    break;
                case 0x6D: // 
                    break;
                case 0xA2:
                    break;
                case 0xAE:
                    break;
                case 0xA0:
                    break;
                case 0xAC:
                    break;
                case 0xEA: // No-op
                    this.PC++;
                    break;
                case 0x00: // Halt
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
            
        }


        public startExecution(addr: number) {
            // TODO check the address
            this.PC = addr;
            this.isExecuting = true;
            _Status = 'processing';
        }

        private coloredCells: number[] = [];

        private clearColors() {
            for (let i = 0; i < this.coloredCells.length; i++) {
                TSOS.Devices.hostSetMemCellColor(this.coloredCells[i]);
            }
            this.coloredCells = [];
        }

        public cycle(): void {
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
        }
    }
}
