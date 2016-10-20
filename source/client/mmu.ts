///<reference path="../globals.ts" />

module TSOS {

    export class Mmu {

        public static defaultSegmentSize = 0x100;
            
        private segmentCount: number;

        constructor(public segmentSize: number = Mmu.defaultSegmentSize) {
            // Segment count is calculated based on available physical memory
            // and the specified segment size.
            this.segmentCount = Math.floor(_Memory.getMemSize()/this.segmentSize);
        }

        public getSegmentCount(): number {
            return this.segmentCount;
        }

        public loadBytesToSegment(segNum: number, bytes: number[]) {
            // Check if a valid segment and logical address is given
            if (segNum < this.segmentCount && bytes.length <= this.segmentSize) {
                _Memory.setBytes(segNum * this.segmentSize, bytes);
            } else {
                _StdOut.putText("An error occurred while loading bytes into segment " + segNum);
                _StdOut.advanceLine();
            }
        }

        /** Get start address of a specific segment.
         */
        public getSegmentAddress(segNum: number): number {
            return segNum * this.segmentSize;
        }

        /** Reset a given segment to all 0x0's
         */
        public clearSegment(segNum: number): void {
            if (segNum < this.segmentCount) {
                for (let i = 0; i < this.segmentSize; i++) {
                    _Memory.setByte(i+segNum*this.segmentSize, 0x0);
                }
                Devices.hostUpdateMemDisplay();
            } else {
                // TODO raise error
                alert("Error: tried to clear segment " + segNum);
            }
        }

        /** Get the absolute byte address via the LBA and segment number
         */
        public getLogicalByte(addr: number, segment: number): number {
            // Check memory access bounds
            if (addr < this.segmentSize && segment < this.segmentCount) {
                let absAddr = segment * this.segmentSize + addr;
                return _Memory.getByte(absAddr);
            } else {
                // Segfault!
                _StdOut.putText("Illegal memory access.");
                // Kill the process
                _KernelInterruptQueue.enqueue(new Interrupt(TERM_IRQ, null));
            }
        }

        /** Set the absolute byte address via the LBA and segment number
         */
        public setLogicalByte(addr: number, segment: number, value: number): void {
            if (addr < this.segmentSize && segment < this.segmentCount) {
                let absAddr = segment * this.segmentSize + addr;
                _Memory.setByte(absAddr, value);
            } else {
                _StdOut.putText("Illegal memory access.");
                // Kill the process
                _KernelInterruptQueue.enqueue(new Interrupt(TERM_IRQ, null));
            }
        }
    }
}

