///<reference path="../globals.ts" />
var TSOS;
(function (TSOS) {
    class Mmu {
        constructor(segmentSize = Mmu.defaultSegmentSize) {
            this.segmentSize = segmentSize;
            // Segment count is calculated based on available physical memory
            // and the specified segment size.
            this.segmentCount = Math.floor(_Memory.getMemSize() / this.segmentSize);
        }
        getSegmentCount() {
            return this.segmentCount;
        }
        loadBytesToSegment(segNum, bytes) {
            // Check if a valid segment and logical address is given
            if (segNum < this.segmentCount && bytes.length <= this.segmentSize) {
                _Memory.setBytes(segNum * this.segmentSize, bytes);
            }
            else {
                _StdOut.putText("An error occurred while loading bytes into segment " + segNum);
                _StdOut.advanceLine();
            }
        }
        /** Get start address of a specific segment.
         */
        getSegmentAddress(segNum) {
            return segNum * this.segmentSize;
        }
        /** Reset a given segment to all 0x0's
         */
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
        /** Get the absolute byte address via the LBA and segment number
         */
        getLogicalByte(addr, segment) {
            // Check memory access bounds
            if (addr < this.segmentSize && segment < this.segmentCount) {
                let absAddr = segment * this.segmentSize + addr;
                return _Memory.getByte(absAddr);
            }
            else {
                // Segfault!
                _StdOut.putText("Illegal memory access.");
                _StdOut.advanceLine();
                _StdOut.putText("Seg: " + segment +
                    " Addr: 0x" + addr.toString(16));
                console.log(new Error().stack);
                // Kill the process
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(TERM_IRQ, { pid: _CPU.ct.pid }));
            }
        }
        /** Set the absolute byte address via the LBA and segment number
         */
        setLogicalByte(addr, segment, value) {
            if (addr < this.segmentSize && segment < this.segmentCount) {
                let absAddr = segment * this.segmentSize + addr;
                _Memory.setByte(absAddr, value);
            }
            else {
                _StdOut.putText("Illegal memory access.");
                console.log(new Error().stack);
                // Kill the process
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(TERM_IRQ, { pid: _CPU.ct.pid }));
            }
        }
    }
    Mmu.defaultSegmentSize = 0x100;
    TSOS.Mmu = Mmu;
})(TSOS || (TSOS = {}));
