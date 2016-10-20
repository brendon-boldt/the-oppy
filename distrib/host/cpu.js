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
        constructor(PC = 0, Acc = 0, Xreg = 0, Yreg = 0, Zflag = 0, isExecuting = false) {
            this.PC = PC;
            this.Acc = Acc;
            this.Xreg = Xreg;
            this.Yreg = Yreg;
            this.Zflag = Zflag;
            this.isExecuting = isExecuting;
            this.coloredCells = [];
        }
        init() {
            this.PC = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.isExecuting = false;
        }
        translateAddress(addr) {
            //TSOS.Devices.hostSetMemCellColor(this.PC+1, 'blue');
            //TSOS.Devices.hostSetMemCellColor(this.PC+2, 'blue');
            return _MMU.getLogicalByte(addr + 1, this.segment) * 0x100
                + _MMU.getLogicalByte(addr, this.segment);
        }
        loadAccConstant() {
            this.Acc = _Memory.getByte(this.PC + 1);
            this.PC += 2;
        }
        loadAccMemory() {
            this.Acc = _MMU.getLogicalByte(this.translateAddress(this.PC + 1), this.segment);
            this.PC += 3;
        }
        noop() {
            this.PC += 1;
        }
        halt() {
            _Status = 'idle';
            //this.isExecuting = false;
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(TERM_IRQ, null));
        }
        storeAccMemory() {
            _MMU.setLogicalByte(this.translateAddress(this.PC + 1), this.segment, this.Acc);
            this.PC += 3;
        }
        addWithCarry() {
            // Modulo max byte value in case of overflow
            this.Acc = (this.Acc + _MMU.getLogicalByte(this.translateAddress(this.PC + 1), this.segment)) % 0x100;
            this.PC += 3;
        }
        loadXConstant() {
            this.Xreg = _Memory.getByte(this.PC + 1);
            this.PC += 2;
        }
        loadXMem() {
            this.Xreg = _MMU.getLogicalByte(this.translateAddress(this.PC + 1), this.segment);
            this.PC += 3;
        }
        loadYConstant() {
            this.Yreg = _Memory.getByte(this.PC + 1);
            this.PC += 2;
        }
        loadYMem() {
            this.Yreg = _MMU.getLogicalByte(this.translateAddress(this.PC + 1), this.segment);
            this.PC += 3;
        }
        compareX() {
            let res = (this.Xreg
                == _MMU.getLogicalByte(this.translateAddress(this.PC + 1), this.segment));
            this.Zflag = (res) ? 1 : 0;
            this.PC += 3;
        }
        branchNotEqual() {
            TSOS.Devices.hostSetMemCellColor(this.PC + 1, 'blue');
            if (this.Zflag == 0) {
                this.PC = (this.PC + 2 + _MMU.getLogicalByte(this.PC + 1, this.segment)) % _MMU.segmentSize;
            }
            else {
                this.PC += 2;
            }
        }
        incrementByte() {
            let addr = this.translateAddress(this.PC + 1);
            _MMU.setLogicalByte(addr, this.segment, (_MMU.getLogicalByte(addr, this.segment) + 1) % 0x100);
            this.PC += 3;
        }
        systemCall() {
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(SYSCALL_IRQ, null));
            this.PC += 1;
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
                    // TODO raise proper error
                    alert('Invalid opcode: '
                        + oc.toString(16).toUpperCase()
                        + '@'
                        + this.PC.toString(16).toUpperCase());
                    break;
            }
        }
        // TODO add set context
        startExecution(addr, segment) {
            // TODO check the address
            this.PC = addr;
            TSOS.Devices.hostSetMemCellColor(this.PC, 'green');
            this.isExecuting = true;
            this.segment = segment;
            _Status = 'processing';
            this.IR = _MMU.getLogicalByte(this.PC, this.segment);
            TSOS.Devices.hostUpdateCpuDisplay();
        }
        clearColors() {
            for (let i = 0; i < this.coloredCells.length; i++) {
                TSOS.Devices.hostSetMemCellColor(this.coloredCells[i]);
            }
            this.coloredCells = [];
        }
        cycle() {
            _Kernel.krnTrace('CPU cycle');
            this.clearColors();
            this.coloredCells.push(this.PC);
            this.handleOpCode(_MMU.getLogicalByte(this.PC, this.segment));
            this.IR = _MMU.getLogicalByte(this.PC, this.segment);
            TSOS.Devices.hostUpdateCpuDisplay();
            _PCB.updatePCB();
            TSOS.Devices.hostUpdatePcbDisplay();
            TSOS.Devices.hostUpdateMemDisplay();
            TSOS.Devices.hostSetMemCellColor(this.PC, 'green');
            if (!this.isExecuting) {
                this.clearColors();
            }
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.
        }
    }
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
