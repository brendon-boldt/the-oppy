///<reference path="../globals.ts" />

module TSOS {

    export class Mmu {

        public static defaultSegmentSize = 0x100;
            
        private segmentCount: number;
        private segmentUse: boolean[] = [];
        constructor(public segmentSize: number = Mmu.defaultSegmentSize) {
            this.segmentCount = Math.floor(_Memory.getMemSize()/this.segmentSize);
        }

        public getSegmentCount(): number {
            return this.segmentCount;
        }

        public loadBytesToSegment(segNum: number, bytes: number[]) {
            if (segNum < this.segmentCount && bytes.length <= this.segmentSize) {
                _Memory.setBytes(segNum * this.segmentSize, bytes);
            } else {
                // TODO throw error if wrong
                _StdOut.putText("An error occurred while loading bytes into segment " + segNum);
                _StdOut.advanceLine();
            }
        }

        public getSegmentAddress(segNum: number): number {
            return segNum * this.segmentSize;
        }

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

        public getLogicalByte(addr: number, segment: number): number {
            if (addr < this.segmentSize) {
                let absAddr = segment * this.segmentSize + addr;
                return _Memory.getByte(absAddr);
            } else {
                // TODO raise error
                alert("Invalid memory access.");
            }
        }

        public setLogicalByte(addr: number, segment: number, value: number): void {
            if (addr < this.segmentSize) {
                let absAddr = segment * this.segmentSize + addr;
                _Memory.setByte(absAddr, value);
            } else {
                // TODO raise error
                alert("Invalid memory access.");
            }
        }
    }
}

