///<reference path="../globals.ts" />
var TSOS;
(function (TSOS) {
    class Disk {
        constructor() {
            this.diskName = "disk";
            let sessionDisk = sessionStorage.getItem(this.diskName);
            if (sessionDisk != undefined) {
                this.bytes = sessionDisk;
            }
            else {
                this.bytes = new Array(this.getDiskSize() + 1).join(Disk.nullChar);
            }
        }
        /*
         * MBR:  0 0 0
         * DIR:  0 0 1 to
         * DIR:  0 7 7
         * FILE: 1 0 0 to
         * FILE: 3 7 7
         *
         *
         * 0 1 2 3 4 ... 63
         * In use
         *   Track
         *     Sector
         *       Block
         *         Data ...
         *           ... Data
         */
        static getBlockAddr(tsb) {
            if (tsb.length < 3)
                return undefined;
            return tsb[2] * Disk.blockSize
                + tsb[1] * Disk.blockCount * Disk.blockSize
                + tsb[0] * Disk.sectorCount * Disk.blockCount * Disk.blockSize;
        }
        static getTSB(addr) {
            return [Math.floor(addr / this.trackSize),
                Math.floor((addr % this.trackSize) / this.sectorSize),
                Math.floor((addr % this.sectorSize) / Disk.blockSize)];
        }
        getDiskSize() {
            return Disk.trackCount
                * Disk.sectorCount
                * Disk.blockCount
                * Disk.blockSize;
        }
        // TODO Move this to disk driver
        getNextBlockAddr(blockAddr) {
            let addr;
            if (this.bytes[blockAddr] == '2') {
                addr = undefined;
            }
            else if (this.bytes[blockAddr] == '1') {
                addr = Disk.getBlockAddr([
                    parseInt(this.bytes[blockAddr + 1]),
                    parseInt(this.bytes[blockAddr + 2]),
                    parseInt(this.bytes[blockAddr + 3])]);
            }
            return addr;
        }
        getImage() {
            return this.bytes;
        }
        writeDisk(tsb, data) {
            if (tsb[0] < Disk.trackCount &&
                tsb[1] < Disk.sectorCount &&
                tsb[2] < Disk.blockCount) {
                let addr = Disk.getBlockAddr(tsb);
                if (data.length < Disk.blockSize) {
                    data += Array(Disk.blockSize - data.length + 1)
                        .join(Disk.nullChar);
                }
                this.bytes = this.bytes.slice(0, addr)
                    + data
                    + this.bytes.slice(addr + data.length);
                TSOS.Devices.hostUpdateDiskDisplay();
                return 0;
            }
            else {
                // TODO Add error on incorrect TSB
                return 1;
            }
        }
        readDisk(tsb) {
            if (tsb[0] < Disk.trackCount &&
                tsb[1] < Disk.sectorCount &&
                tsb[2] < Disk.blockCount) {
                let addr = Disk.getBlockAddr(tsb);
                return this.bytes.slice(addr, addr + Disk.blockSize);
            }
            else {
                // TODO Add error on incorrect TSB
                return undefined;
            }
        }
    }
    //public static defaultDiskSize = 0x1000;
    Disk.trackCount = 0x4;
    Disk.sectorCount = 0x8;
    Disk.blockCount = 0x8;
    Disk.blockSize = 0x40;
    Disk.trackSize = Disk.sectorCount * Disk.blockCount * Disk.blockSize;
    Disk.sectorSize = Disk.blockCount * Disk.blockSize;
    Disk.nullChar = String.fromCharCode(0);
    TSOS.Disk = Disk;
})(TSOS || (TSOS = {}));
