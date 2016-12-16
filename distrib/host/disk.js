///<reference path="../globals.ts" />
var TSOS;
(function (TSOS) {
    class Disk {
        constructor() {
            let mbr = sessionStorage.getItem("0:0:0");
            if (!mbr) {
                this.formatDisk(false);
            }
        }
        getDiskSize() {
            return Disk.trackCount
                * Disk.sectorCount
                * Disk.blockCount
                * Disk.blockSize;
        }
        /** Write 0's to the disk.
         */
        formatDisk(update = true) {
            for (let t = 0; t < Disk.trackCount; ++t) {
                for (let s = 0; s < Disk.sectorCount; ++s) {
                    for (let b = 0; b < Disk.blockCount; ++b) {
                        this.writeDisk([t, s, b], "", update);
                    }
                }
            }
        }
        /** Write to the disk the specified string.
         * Update the display if specified.
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
                sessionStorage.setItem(str, data);
                if (update !== false)
                    TSOS.Devices.hostUpdateDiskDisplay([str]);
                return 0;
            }
            else {
                // TODO Add error on incorrect TSB
                return 1;
            }
        }
        /** Read the disk using a string address.
         */
        string_readDisk(str) {
            let arr = str.split(':');
            return this.readDisk([
                parseInt(arr[0]),
                parseInt(arr[1]),
                parseInt(arr[2])]);
        }
        /** Read the disk at the specified track, sector, and block.
         */
        readDisk(tsb) {
            if (tsb[0] < Disk.trackCount &&
                tsb[1] < Disk.sectorCount &&
                tsb[2] < Disk.blockCount) {
                let str = sessionStorage.getItem(tsb[0] + ':' + tsb[1] + ':' + tsb[2]);
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
    Disk.nullChar = String.fromCharCode(0);
    TSOS.Disk = Disk;
})(TSOS || (TSOS = {}));
