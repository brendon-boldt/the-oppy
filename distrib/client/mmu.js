///<reference path="../globals.ts" />
var TSOS;
(function (TSOS) {
    class Mmu {
        constructor(segmentSize = Mmu.defaultSegmentSize) {
            this.segmentSize = segmentSize;
            this.segmentUse = [];
            this.segmentCount = Math.floor(_Memory.getMemSize() / this.segmentSize);
            /*
            for (let i = 0; i < this.segmentCount; i++) {
                this.segmentUse.push(false);
            }
            */
        }
        getSegmentCount() {
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
    }
    Mmu.defaultSegmentSize = 0x100;
    TSOS.Mmu = Mmu;
})(TSOS || (TSOS = {}));
