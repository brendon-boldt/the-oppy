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
    class Cpu {
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
        constructor(ct = new TSOS.Context(), isExecuting = false) {
            this.ct = ct;
            this.isExecuting = isExecuting;
            this.coloredCells = [];
        }
        init() {
            /*
              this.PC = 0;
              this.Acc = 0;
              this.Xreg = 0;
              this.Yreg = 0;
              this.Zflag = 0;
              */
            this.ct = new TSOS.Context();
            this.isExecuting = false;
        }
        /** Translate the little endian address.
         */
        translateAddress(addr) {
            //TSOS.Devices.hostSetMemCellColor(this.PC+1, 'blue');
            //TSOS.Devices.hostSetMemCellColor(this.PC+2, 'blue');
            return _MMU.getLogicalByte(addr + 1, this.ct.segment) * 0x100
                + _MMU.getLogicalByte(addr, this.ct.segment);
        }
        /**
         * Below are the opcode methods.
         */
        loadAccConstant() {
            this.ct.Acc = _MMU.getLogicalByte(this.ct.PC + 1, this.ct.segment);
            this.ct.PC += 2;
        }
        loadAccMemory() {
            this.ct.Acc = _MMU.getLogicalByte(this.translateAddress(this.ct.PC + 1), this.ct.segment);
            this.ct.PC += 3;
        }
        noop() {
            this.ct.PC += 1;
        }
        halt() {
            _Status = 'idle';
            //console.log("Halting: " + this.ct.pid);
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(TERM_IRQ, { pid: this.ct.pid }));
        }
        storeAccMemory() {
            _MMU.setLogicalByte(this.translateAddress(this.ct.PC + 1), this.ct.segment, this.ct.Acc);
            this.ct.PC += 3;
        }
        addWithCarry() {
            // Modulo max byte value in case of overflow
            // Not sure if this is correct behavior, but it is easiest.
            this.ct.Acc = (this.ct.Acc + _MMU.getLogicalByte(this.translateAddress(this.ct.PC + 1), this.ct.segment)) % 0x100;
            this.ct.PC += 3;
        }
        loadXConstant() {
            this.ct.Xreg = _MMU.getLogicalByte(this.ct.PC + 1, this.ct.segment);
            this.ct.PC += 2;
        }
        loadXMem() {
            this.ct.Xreg = _MMU.getLogicalByte(this.translateAddress(this.ct.PC + 1), this.ct.segment);
            this.ct.PC += 3;
        }
        loadYConstant() {
            this.ct.Yreg = _MMU.getLogicalByte(this.ct.PC + 1, this.ct.segment);
            this.ct.PC += 2;
        }
        loadYMem() {
            this.ct.Yreg = _MMU.getLogicalByte(this.translateAddress(this.ct.PC + 1), this.ct.segment);
            this.ct.PC += 3;
        }
        compareX() {
            let res = (this.ct.Xreg
                == _MMU.getLogicalByte(this.translateAddress(this.ct.PC + 1), this.ct.segment));
            this.ct.Zflag = (res) ? 1 : 0;
            this.ct.PC += 3;
        }
        branchNotEqual() {
            TSOS.Devices.hostSetMemCellColor(this.ct.PC + 1, 'blue');
            if (this.ct.Zflag == 0) {
                this.ct.PC = (this.ct.PC + 2 + _MMU.getLogicalByte(this.ct.PC + 1, this.ct.segment)) % _MMU.segmentSize;
            }
            else {
                this.ct.PC += 2;
            }
        }
        incrementByte() {
            let addr = this.translateAddress(this.ct.PC + 1);
            // Modulo byte in case of overflow
            _MMU.setLogicalByte(addr, this.ct.segment, (_MMU.getLogicalByte(addr, this.ct.segment) + 1) % 0x100);
            this.ct.PC += 3;
        }
        systemCall() {
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(SYSCALL_IRQ, null));
            this.ct.PC += 1;
        }
        handleOpCode(oc) {
            switch (oc) {
                case 0xA9:
                    this.loadAccConstant();
                    break;
                case 0xAD:
                    this.loadAccMemory();
                    break;
                case 0x8D:
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
                case 0xEA:
                    this.noop();
                    break;
                case 0x00:
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
                    _KernelInterruptQueue.enqueue(new TSOS.Interrupt(TERM_IRQ, this.ct.pid));
                    break;
            }
        }
        // TODO add set context
        /** All the necessary prep for getting a process started.
         */
        startExecution(ct) {
            // TODO check the address
            //console.log("Executing");
            //console.log(ct);
            if (ct == undefined) {
                _Kernel.krnTrapError("Undefined context passed to CPU.");
            }
            this.ct = ct;
            TSOS.Devices.hostSetMemCellColor(this.ct.getAbsPC(), 'green');
            this.isExecuting = true;
            _Status = 'processing';
            this.ct.state = STATE_EXECUTING;
            this.ct.IR = _MMU.getLogicalByte(this.ct.PC, this.ct.segment);
            TSOS.Devices.hostUpdateCpuDisplay();
        }
        stopExecution() {
            this.isExecuting = false;
            //console.log(new Error().stack);
        }
        /** Remove the coloring from cells.
         */
        clearColors() {
            for (let i = 0; i < this.coloredCells.length; i++) {
                TSOS.Devices.hostSetMemCellColor(this.coloredCells[i]);
            }
            this.coloredCells = [];
        }
        cycle() {
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
            TSOS.Devices.hostSetMemCellColor(this.ct.getAbsPC(), 'green');
            if (!this.isExecuting) {
                this.clearColors();
            }
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.
        }
    }
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
