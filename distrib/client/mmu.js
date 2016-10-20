///<reference path="../globals.ts" />
var TSOS;
(function (TSOS) {
    class Mmu {
        constructor(segmentSize = Mmu.defaultSegmentSize) {
            this.segmentSize = segmentSize;
            this.segmentUse = [];
            this.segmentCount = Math.floor(_Memory.getMemSize() / this.segmentSize);
        }
        getSegmentCount() {
            return this.segmentCount;
        }
        loadBytesToSegment(segNum, bytes) {
            if (segNum < this.segmentCount && bytes.length <= this.segmentSize) {
                _Memory.setBytes(segNum * this.segmentSize, bytes);
            }
            else {
                // TODO throw error if wrong
                _StdOut.putText("An error occurred while loading bytes into segment " + segNum);
                _StdOut.advanceLine();
            }
        }
        getSegmentAddress(segNum) {
            return segNum * this.segmentSize;
        }
        clearSegment(segNum) {
            if (segNum < this.segmentCount) {
                for (let i = 0; i < this.segmentSize; i++) {
                    _Memory.setByte(i + segNum * this.segmentSize, 0x0);
                }
                TSOS.Devices.hostUpdateMemDisplay();
            }
            else {
                // TODO raise error
                alert("Error: tried to clear segment " + segNum);
            }
        }
        getLogicalByte(addr, segment) {
            if (addr < this.segmentSize && segment < this.segmentCount) {
                let absAddr = segment * this.segmentSize + addr;
                return _Memory.getByte(absAddr);
            }
            else {
                // TODO raise error
                //_StdOut.putText("Illegal memory access.");
                _PCB.terminateProcess();
                // Kill the process
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(TERM_IRQ, null));
            }
        }
        setLogicalByte(addr, segment, value) {
            if (addr < this.segmentSize && segment < this.segmentCount) {
                let absAddr = segment * this.segmentSize + addr;
                _Memory.setByte(absAddr, value);
            }
            else {
                // TODO raise error
                _StdOut.putText("Illegal memory access.");
                // Kill the process
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(TERM_IRQ, null));
            }
        }
    }
    Mmu.defaultSegmentSize = 0x100;
    TSOS.Mmu = Mmu;
})(TSOS || (TSOS = {}));
