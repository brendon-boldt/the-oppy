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

      /*
        constructor(public PC: number = 0,
                    public Acc: number = 0,
                    public Xreg: number = 0,
                    public Yreg: number = 0,
                    public Zflag: number = 0,
                    public isExecuting: boolean = false) {

        }

        public segment: number;
        public IR: number;
        public currentContext: Context;
       */
        constructor(public ct: Context = new Context(),
                    public isExecuting: boolean = false) {
        }

        public init(): void {
          /*
            this.PC = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            */
            this.ct = new Context();
            this.isExecuting = false;
        }

        /** Translate the little endian address.
         */
        private translateAddress(addr: number): number {
            return _MMU.getLogicalByte(addr+1, this.ct.segment)*0x100
                + _MMU.getLogicalByte(addr, this.ct.segment);
        }

        /**
         * Below are the opcode methods.
         */

        private loadAccConstant() {
            this.ct.Acc = _MMU.getLogicalByte(this.ct.PC+1, this.ct.segment);
            this.ct.PC += 2;
        }

        private loadAccMemory() {
            this.ct.Acc = _MMU.getLogicalByte(
                this.translateAddress(this.ct.PC+1), this.ct.segment);
            this.ct.PC += 3;
        }

        private noop() {
            this.ct.PC += 1;
        }

        private halt() {
            _Status = 'idle';
            //console.log("Halting: " + this.ct.pid);
            _KernelInterruptQueue.enqueue(new Interrupt(TERM_IRQ, {pid: this.ct.pid}));
        }

        private storeAccMemory() {
            _MMU.setLogicalByte(
                this.translateAddress(this.ct.PC+1),
                this.ct.segment,
                this.ct.Acc);
            this.ct.PC += 3;
        }

        private addWithCarry() {
            // Modulo max byte value in case of overflow
            // Not sure if this is correct behavior, but it is easiest.
            this.ct.Acc = (this.ct.Acc + _MMU.getLogicalByte(
                this.translateAddress(this.ct.PC+1), this.ct.segment)) % 0x100;
            this.ct.PC += 3;
        }

        private loadXConstant() {
            this.ct.Xreg = _MMU.getLogicalByte(this.ct.PC+1, this.ct.segment);
            this.ct.PC += 2;

        }

        private loadXMem() {
            this.ct.Xreg = _MMU.getLogicalByte(
                this.translateAddress(this.ct.PC+1), this.ct.segment);
            this.ct.PC += 3;

        }

        private loadYConstant() {
            this.ct.Yreg = _MMU.getLogicalByte(this.ct.PC+1, this.ct.segment);
            this.ct.PC += 2;
        }

        private loadYMem() {
            this.ct.Yreg = _MMU.getLogicalByte(
                this.translateAddress(this.ct.PC+1), this.ct.segment);
            this.ct.PC += 3;

        }

        private compareX() {
            let res = (this.ct.Xreg
                == _MMU.getLogicalByte(
                this.translateAddress(this.ct.PC+1), this.ct.segment));
            this.ct.Zflag = (res) ? 1 : 0;
            this.ct.PC += 3;
        }

        private branchNotEqual() {
            TSOS.Devices.hostSetMemCellColor(this.ct.PC+1, 'blue');
            if (this.ct.Zflag == 0) {
                this.ct.PC = (this.ct.PC + 2 + _MMU.getLogicalByte(
                    this.ct.PC+1,
                    this.ct.segment)) % _MMU.segmentSize;
            } else {
                this.ct.PC += 2;
            }
        }

        private incrementByte() {
            let addr = this.translateAddress(this.ct.PC+1);
            // Modulo byte in case of overflow
            _MMU.setLogicalByte(
                addr,
                this.ct.segment,
                (_MMU.getLogicalByte(addr, this.ct.segment)+1) % 0x100);
            this.ct.PC += 3;
        }

        private systemCall() {
            _KernelInterruptQueue.enqueue(new Interrupt(SYSCALL_IRQ, null));
            this.ct.PC += 1;
        }

        private handleOpCode(oc: number) {
            switch (oc) {
                case 0xA9: // Load acc with constant
                    this.loadAccConstant();
                    break;
                case 0xAD: // Load acc from memory
                    this.loadAccMemory();
                    break;
                case 0x8D: // Store acc in memory
                    this.storeAccMemory();
                    break;
                case 0x6D:
                    this.addWithCarry();
                    break;
                case 0xA2:
                    this.loadXConstant();
                    break;
                case 0xAE:
                    this.loadXMem();
                    break;
                case 0xA0:
                    this.loadYConstant();
                    break;
                case 0xAC:
                    this.loadYMem();
                    break;
                case 0xEA: // No-op
                    this.noop();
                    break;
                case 0x00: // Halt
                    this.halt();
                    break;
                case 0xEC:
                    this.compareX();
                    break;
                case 0xD0:
                    this.branchNotEqual();
                    break;
                case 0xEE:
                    this.incrementByte();
                    break;
                case 0xFF:
                    this.systemCall();
                    break;
                default:
                    _StdOut.putText('Invalid opcode: '
                          + oc.toString(16).toUpperCase()
                          + '@'
                          + this.ct.getAbsPC().toString(16).toUpperCase());
                    // Terminate the program if an invalid opcode is found
                    _KernelInterruptQueue.enqueue(new Interrupt(TERM_IRQ, this.ct.pid));
                    break;
            }
        }

        /** All the necessary prep for getting a process started.
         */
        public startExecution(ct: Context) {
            // TODO check the address
            //console.log("Executing");
            //console.log(ct);
            if (ct == undefined) {
              _Kernel.krnTrapError("Undefined context passed to CPU.");
            }
            this.ct = ct;
            this.isExecuting = true;
            _Status = 'processing';
            this.ct.state = STATE_EXECUTING;
            this.ct.IR = _MMU.getLogicalByte(this.ct.PC, this.ct.segment);
            this.colorCells();
            TSOS.Devices.hostUpdateCpuDisplay();
        }

        public stopExecution(): void {
            this.isExecuting = false;
            //console.log(new Error().stack);
        }

        private coloredCells: number[] = [];

        private static highlight = {
            0xA9: 1,
            0xAD: 2,
            0x8D: 2,
            0x6D: 2,
            0xA2: 1,
            0xAE: 2,
            0xA0: 1,
            0xAC: 2,
            0xEA: 1,
            0x00: 1,
            0xEC: 2,
            0xD0: 1,
            0xEE: 3,
            0xFF: 0
        };

        private colorCells(): void {
            let num = Cpu.highlight[this.ct.IR];
            if (num >= 2)
                TSOS.Devices.hostSetMemCellColor(this.ct.PC+2, '#1e90ff');
            if (num >= 1)
                TSOS.Devices.hostSetMemCellColor(this.ct.PC+1, '#1e90ff');
            TSOS.Devices.hostSetMemCellColor(this.ct.PC, 'blue');
            TSOS.Devices.hostSetMemScroll(this.ct.PC);
        }

        /** Remove the coloring from cells.
         */
        public clearColors() {
            for (let i = 0; i < this.coloredCells.length; i++) {
                TSOS.Devices.hostSetMemCellColor(this.coloredCells[i]);
            }
            this.coloredCells = [];
        }

        public cycle(): void {
            _Kernel.krnTrace('CPU cycle');
            _Scheduler.burstCounter++;

            this.clearColors();

            this.coloredCells.push(this.ct.getAbsPC());
            this.handleOpCode(_MMU.getLogicalByte(this.ct.PC, this.ct.segment));
            this.ct.IR = _MMU.getLogicalByte(this.ct.PC, this.ct.segment);
            //console.log("Executing @ " + this.ct.getAbsPC().toString(0x10));
            TSOS.Devices.hostUpdateCpuDisplay();
            _PCB.updatePCB();
            TSOS.Devices.hostUpdatePcbDisplay();
            TSOS.Devices.hostUpdateMemDisplay();
            this.colorCells();

            if (!this.isExecuting) {
                this.clearColors();
            }

            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.
        }
    }
}
