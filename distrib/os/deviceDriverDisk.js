///<reference path="../globals.ts" />
///<reference path="deviceDriver.ts" />
var TSOS;
(function (TSOS) {
    // Extends DeviceDriver
    class DeviceDriverDisk extends TSOS.DeviceDriver {
        constructor() {
            super();
            this.filenames = [];
            this.driverEntry = this.krnDskDriverEntry;
        }
        krnDskDriverEntry() {
            this.status = "loaded";
        }
        static trimFilename(str) {
            let lastIndex;
            for (let i = 0; i < str.length; ++i) {
                if (str[i] == String.fromCharCode(0)) {
                    lastIndex = i;
                    break;
                }
            }
            return str.slice(0, lastIndex);
        }
        static stringToTSB(str) {
            if (str.length < 3) {
                return undefined;
            }
            else {
                return [str[0].charCodeAt(0),
                    str[1].charCodeAt(0),
                    str[2].charCodeAt(0)];
            }
        }
        // TODO Cache open block detail
        nextOpenDirEntry() {
            for (let s = 0; s < TSOS.Disk.sectorCount; ++s) {
                for (let b = 1; b < TSOS.Disk.sectorCount; ++b) {
                    let bytes = _Disk.readDisk([0, s, b]);
                    if (bytes[0] == String.fromCharCode(0) &&
                        bytes[1] == String.fromCharCode(0) &&
                        bytes[2] == String.fromCharCode(0))
                        return [0, s, b];
                }
            }
            return undefined;
        }
        // TODO See above
        nextOpenBlock() {
            for (let t = 1; t < TSOS.Disk.sectorCount; ++t) {
                for (let s = 0; s < TSOS.Disk.sectorCount; ++s) {
                    for (let b = 0; b < TSOS.Disk.sectorCount; ++b) {
                        let bytes = _Disk.readDisk([t, s, b]);
                        if (bytes[0] == DeviceDriverDisk.emptyFlag)
                            return [t, s, b];
                    }
                }
            }
            return undefined;
        }
        createDirectoryEntry(filename) {
            let dirTSB = this.nextOpenDirEntry();
            let blockTSB = this.nextOpenBlock();
            let data = String.fromCharCode(blockTSB[0]) +
                String.fromCharCode(blockTSB[1]) +
                String.fromCharCode(blockTSB[2]) +
                filename;
            let ret = _Disk.writeDisk(dirTSB, data);
            if (ret != 0)
                return 1;
            console.log("Writing to: " + blockTSB);
            ret = _Disk.writeDisk(blockTSB, DeviceDriverDisk.finalFlag);
            if (ret != 0)
                return 1;
            return 0;
        }
        /*
        private nextOpenDirEntry(): number[] {
            for (let s = 0; s < Disk.sectorCount; ++s) {
                for (let b = 1; b < Disk.sectorCount; ++b) {
                    let bytes = _Disk.readDisk([0,s,b]);
                    if (bytes[0] == String.fromCharCode(0) &&
                            bytes[1] == String.fromCharCode(0) &&
                            bytes[2] == String.fromCharCode(0))
                        return [0,s,b];
                }
            }
            return undefined;
        }
        */
        deleteDirectoryEntry(filename) {
            let DDD = DeviceDriverDisk;
            let dirTSB;
            let blockTSB;
            for (let s = 0; s < TSOS.Disk.sectorCount; ++s) {
                for (let b = 1; b < TSOS.Disk.sectorCount; ++b) {
                    let bytes = _Disk.readDisk([0, s, b]);
                    console.log("cmp: " +
                        DDD.trimFilename(bytes.slice(3)).length +
                        " == " +
                        filename);
                    if (DDD.trimFilename(bytes.slice(3)) == filename) {
                        blockTSB = DDD.stringToTSB(bytes.slice(0, 3));
                        dirTSB = [0, s, b];
                        // Break out of the loop
                        s = 0xff;
                        b = 0xff;
                    }
                }
            }
            if (!dirTSB)
                return 1;
            console.log(dirTSB);
            let bytes = _Disk.readDisk(dirTSB);
            //let blockTSB = DDD.stringToTSB(bytes.slice(0,3));
            _Disk.writeDisk(dirTSB, "");
            _Disk.writeDisk(blockTSB, "");
            // TODO Add multi-block support
            return 0;
        }
        createFile(filename) {
            // Check if the filename exists already
            let ret = 1;
            if (this.filenames.indexOf(filename) == -1) {
                ret = this.createDirectoryEntry(filename);
                this.filenames.push(filename);
            }
            return ret;
        }
        deleteFile(filename) {
            let ret = 1;
            let index = this.filenames.indexOf(filename);
            if (index != -1) {
                ret = this.deleteDirectoryEntry(filename);
                this.filenames.slice(0, index).concat(this.filenames.slice(index + 1, filename.length));
            }
            return ret;
        }
        writeFile(filename) {
            return 1;
        }
        readFile(filename) {
            return "";
        }
    }
    DeviceDriverDisk.emptyFlag = String.fromCharCode(0);
    DeviceDriverDisk.nextFlag = String.fromCharCode(1);
    DeviceDriverDisk.finalFlag = String.fromCharCode(2);
    TSOS.DeviceDriverDisk = DeviceDriverDisk;
})(TSOS || (TSOS = {}));
