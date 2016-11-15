///<reference path="../globals.ts" />
var TSOS;
(function (TSOS) {
    class Disk {
        constructor(bytes = Array(TSOS.Memory.defaultMemorySize)) {
            this.bytes = bytes;
            for (let i = 0; i < this.bytes.length; i++) {
                if (this.bytes[i] == undefined)
                    this.bytes[i] = 0x0;
            }
        }
    }
    //public static defaultDiskSize = 0x1000;
    Disk.trackCount = 4;
    Disk.sectorCount = 8;
    Disk.blockCount = 8;
    TSOS.Disk = Disk;
})(TSOS || (TSOS = {}));
