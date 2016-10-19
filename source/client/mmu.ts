///<reference path="../globals.ts" />

module TSOS {

    export class Mmu {

        public static defaultSegmentSize = 0x100;
            
        private segmentCount: number;
        private segmentUse: boolean[] = [];
        constructor(public segmentSize: number = Mmu.defaultSegmentSize) {
            this.segmentCount = Math.floor(_Memory.getMemSize()/this.segmentSize);
            /*
            for (let i = 0; i < this.segmentCount; i++) {
                this.segmentUse.push(false);
            }
            */
        }

        public getSegmentCount(): number {
            return this.segmentCount;
        }

        /*
        public getOpenSegNum(): number {
            for (let i = 0; i < this.segmentCount; i++) {
                if (this.segmentUse[i] == false)
                    return i;
            }
            return -1;
        }
        */

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
    }
}

