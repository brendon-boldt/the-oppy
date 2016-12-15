///<reference path="../globals.ts" />
var TSOS;
(function (TSOS) {
    class Disk {
        //private diskName: string = "disk";
        constructor() {
            let mbr = sessionStorage.getItem("0:0:0");
            if (!mbr) {
                this.formatDisk(false);
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
        formatDisk(update = true) {
            for (let t = 0; t < Disk.trackCount; ++t) {
                for (let s = 0; s < Disk.sectorCount; ++s) {
                    for (let b = 0; b < Disk.blockCount; ++b) {
                        //sessionStorage.setItem(t+':'+s+':'+b,
                        //new Array(this.getDiskSize+1).join(Disk.nullChar));
                        //console.log("writing: " + [t,s,b]);
                        this.writeDisk([t, s, b], "", update);
                    }
                }
            }
        }
        // TODO Move this to disk driver
        //public getNextBlockAddr(blockAddr: number): number {
        getNextBlockAddr(tsb) {
            let addr;
            let bytes = this.readDisk(tsb);
            if (bytes[0] == '2') {
                addr = undefined;
            }
            else if (bytes[0] == '1') {
                addr = [
                    parseInt(bytes[1]),
                    parseInt(bytes[2]),
                    parseInt(bytes[3])];
            }
            return addr;
        }
        /*
        public getImage(): string {
            return this.bytes;
        }
        */
        writeDisk(tsb, data, update) {
            if (tsb[0] < Disk.trackCount &&
                tsb[1] < Disk.sectorCount &&
                tsb[2] < Disk.blockCount) {
                if (data.length < Disk.blockSize) {
                    data += Array(Disk.blockSize - data.length + 1)
                        .join(Disk.nullChar);
                }
                let str = tsb[0] + ':' + tsb[1] + ':' + tsb[2];
                //alert("d : " + data.split(""));
                sessionStorage.setItem(str, data);
                //this.bytes = this.bytes.slice(0, addr)
                //+ data
                //+ this.bytes.slice(addr + data.length);
                if (update !== false)
                    TSOS.Devices.hostUpdateDiskDisplay([str]);
                return 0;
            }
            else {
                // TODO Add error on incorrect TSB
                return 1;
            }
        }
        string_readDisk(str) {
            let arr = str.split(':');
            return this.readDisk([
                parseInt(arr[0]),
                parseInt(arr[1]),
                parseInt(arr[2])]);
        }
        readDisk(tsb) {
            if (tsb[0] < Disk.trackCount &&
                tsb[1] < Disk.sectorCount &&
                tsb[2] < Disk.blockCount) {
                let addr = Disk.getBlockAddr(tsb);
                //return this.bytes.slice(addr, addr+Disk.blockSize);
                let str = sessionStorage.getItem(tsb[0] + ':' + tsb[1] + ':' + tsb[2]);
                //console.log(str.length);
                return str;
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
    // Should bytes be a string or array?
    //private bytes: string;    
    Disk.nullChar = String.fromCharCode(0);
    TSOS.Disk = Disk;
})(TSOS || (TSOS = {}));
