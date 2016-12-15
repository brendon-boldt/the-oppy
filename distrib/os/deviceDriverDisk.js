///<reference path="../globals.ts" />
///<reference path="deviceDriver.ts" />
var TSOS;
(function (TSOS) {
    // Extends DeviceDriver
    class DeviceDriverDisk extends TSOS.DeviceDriver {
        constructor() {
            super();
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
                for (let b = 1; b < TSOS.Disk.blockCount; ++b) {
                    let bytes = _Disk.readDisk([0, s, b]);
                    if (bytes[0] == String.fromCharCode(0) &&
                        bytes[1] == String.fromCharCode(0) &&
                        bytes[2] == String.fromCharCode(0))
                        return [0, s, b];
                }
            }
            return undefined;
        }
        nextOpenDirEntryOrFileExists(filename) {
            let DDD = DeviceDriverDisk;
            let tsb;
            for (let s = 0; s < TSOS.Disk.sectorCount; ++s) {
                for (let b = 1; b < TSOS.Disk.blockCount; ++b) {
                    let bytes = _Disk.readDisk([0, s, b]);
                    if (DDD.trimFilename(bytes.slice(3)) == filename) {
                        return [];
                    }
                    if (bytes[0] == String.fromCharCode(0) &&
                        bytes[1] == String.fromCharCode(0) &&
                        bytes[2] == String.fromCharCode(0))
                        tsb = [0, s, b];
                }
            }
            return tsb;
        }
        // TODO See above
        nextOpenBlock(exclude = [-1, -1, -1]) {
            for (let t = 1; t < TSOS.Disk.trackCount; ++t) {
                for (let s = 0; s < TSOS.Disk.sectorCount; ++s) {
                    for (let b = 0; b < TSOS.Disk.blockCount; ++b) {
                        let bytes = _Disk.readDisk([t, s, b]);
                        if (bytes[0] == DeviceDriverDisk.emptyFlag &&
                            (exclude[0] != t ||
                                exclude[1] != s ||
                                exclude[2] != b))
                            return [t, s, b];
                    }
                }
            }
            return undefined;
        }
        // TODO Detect illegal filename (do this in Shell, more likely)
        // TODO Detect directory overflow
        createDirectoryEntry(filename) {
            let dirTSB = this.nextOpenDirEntryOrFileExists(filename);
            let blockTSB = this.nextOpenBlock();
            if (blockTSB == undefined)
                return 3;
            if (dirTSB.length == 0)
                return 4;
            let data = String.fromCharCode(blockTSB[0]) +
                String.fromCharCode(blockTSB[1]) +
                String.fromCharCode(blockTSB[2]) +
                filename;
            let ret = _Disk.writeDisk(dirTSB, data);
            if (ret != 0)
                return 1;
            ret = _Disk.writeDisk(blockTSB, DeviceDriverDisk.finalFlag);
            if (ret != 0)
                return 1;
            return 0;
        }
        deleteDirectoryEntry(filename) {
            let DDD = DeviceDriverDisk;
            let dirTSB;
            let blockTSB;
            for (let s = 0; s < TSOS.Disk.sectorCount; ++s) {
                for (let b = 1; b < TSOS.Disk.sectorCount; ++b) {
                    let bytes = _Disk.readDisk([0, s, b]);
                    if (DDD.trimFilename(bytes.slice(3)) == filename) {
                        blockTSB = DDD.stringToTSB(bytes.slice(0, 3));
                        dirTSB = [0, s, b];
                        // Break out of the loop
                        s = 0xff;
                        b = 0xff;
                    }
                }
            }
            if (!dirTSB || !blockTSB)
                return 1;
            let bytes = _Disk.readDisk(dirTSB);
            //let blockTSB = DDD.stringToTSB(bytes.slice(0,3));
            _Disk.writeDisk(dirTSB, "");
            _Disk.writeDisk(blockTSB, "");
            return 0;
        }
        createFile(filename) {
            // Check if the filename exists already
            let ret = 1;
            ret = this.createDirectoryEntry(filename);
            if (ret == 4) {
                // File already exists.
                ret = 0;
            }
            return ret;
        }
        deleteFile(filename) {
            let ret = 1;
            ret = this.writeFile(filename, "");
            ret = this.deleteDirectoryEntry(filename);
            return ret;
        }
        writeFile(filename, data) {
            let DDD = DeviceDriverDisk;
            let blockTSB;
            for (let s = 0; s < TSOS.Disk.sectorCount; ++s) {
                for (let b = 1; b < TSOS.Disk.sectorCount; ++b) {
                    let bytes = _Disk.readDisk([0, s, b]);
                    //console.log(bytes + " == " + filename)
                    if (DDD.trimFilename(bytes.slice(3)) == filename) {
                        blockTSB = DDD.stringToTSB(bytes.slice(0, 3));
                        // Break out of the loop
                        s = 0xff;
                        b = 0xff;
                    }
                }
            }
            // This should not need to execute
            if (!blockTSB) {
                return 2;
            }
            let returnStatus = 0;
            let blockStatus;
            let newStatus;
            let bytes;
            let nextTSB = blockTSB;
            //let nextTSB: number[];
            let index = 0;
            do {
                blockTSB = nextTSB;
                nextTSB = undefined;
                bytes = _Disk.readDisk(blockTSB);
                blockStatus = bytes.charCodeAt(0);
                if (blockStatus == 1) {
                    nextTSB = DDD.stringToTSB(bytes.slice(1, 4));
                }
                if ((data.length - index) < 0) {
                    newStatus = 0;
                }
                else if ((data.length - index) <= TSOS.Disk.blockSize - 4) {
                    newStatus = 2;
                }
                else {
                    newStatus = 1;
                    blockStatus = 1;
                }
                if (nextTSB == undefined) {
                    if (newStatus == 1) {
                        nextTSB = this.nextOpenBlock(blockTSB);
                        if (nextTSB == undefined) {
                            blockStatus = -1;
                            newStatus = 2;
                            returnStatus = 3;
                            nextTSB = [0xfe, 0xfe, 0xfe];
                        }
                    }
                    else {
                        nextTSB = [0xff, 0xff, 0xff];
                    }
                }
                let buffer = String.fromCharCode(newStatus) +
                    String.fromCharCode(nextTSB[0]) +
                    String.fromCharCode(nextTSB[1]) +
                    String.fromCharCode(nextTSB[2]) +
                    data.slice(index, index + TSOS.Disk.blockSize - 4);
                _Disk.writeDisk(blockTSB, buffer);
                index += TSOS.Disk.blockSize - 4;
            } while (blockStatus == 1);
            return returnStatus;
        }
        readFile(filename) {
            // Return 2 if the file is not found
            /*
            if (this.filenames.indexOf(filename) == -1) {
                return undefined;
            }
             */
            let DDD = DeviceDriverDisk;
            let blockTSB;
            for (let s = 0; s < TSOS.Disk.sectorCount; ++s) {
                for (let b = 1; b < TSOS.Disk.sectorCount; ++b) {
                    let bytes = _Disk.readDisk([0, s, b]);
                    if (DDD.trimFilename(bytes.slice(3)) == filename) {
                        blockTSB = DDD.stringToTSB(bytes.slice(0, 3));
                        // Break out of the loop
                        s = 0xff;
                        b = 0xff;
                    }
                }
            }
            // This should not need to execute
            if (!blockTSB)
                return undefined;
            let data = [];
            let blockStatus;
            let bytes;
            let nextTSB = blockTSB;
            //let nextTSB: number[];
            let index = 0;
            do {
                bytes = _Disk.readDisk(nextTSB);
                blockStatus = bytes.charCodeAt(0);
                if (blockStatus == 1) {
                    nextTSB = DDD.stringToTSB(bytes.slice(1, 4));
                }
                data.push(bytes.slice(4));
            } while (blockStatus == 1);
            return data.join("");
        }
        formatDisk() {
            _Disk.formatDisk();
        }
        rollOutProcess(ct, bytes) {
            //console.log("Roll out: " + ct.pid);
            // TODO 
            let byteString = ""; // = Array(bytes.length);
            // = bytes.map(String.fromCharCode).join("");
            for (let i = 0; i < bytes.length; ++i) {
                byteString += String.fromCharCode(bytes[i]);
            }
            let swapFilename = DeviceDriverDisk.swapPrefix + ct.pid;
            let ret = _krnDiskDriver.createFile(swapFilename);
            if (ret != 0) {
            }
            ret = _krnDiskDriver.writeFile(swapFilename, byteString);
            if (ret == 0) {
            }
            else {
                // Should I do this?
                console.log("Error code: " + ret);
                console.log(new Error().stack);
                ct.inMemory = undefined;
            }
            return ret;
        }
        rollInProcess(ct, segNum) {
            let filename = DeviceDriverDisk.swapPrefix + ct.pid;
            let byteString = _krnDiskDriver.readFile(filename);
            let bytes = byteString.split("").map(function (x) {
                return x.charCodeAt(0);
            });
            //console.log(filename);
            //console.log(bytes);
            bytes = bytes.slice(0, _MMU.segmentSize);
            _MMU.clearSegment(segNum);
            _MMU.loadBytesToSegment(segNum, bytes);
            ct.segment = segNum;
            ct.inMemory = true;
            return 0;
        }
        swapIfNeeded(ct) {
            if (!ct.inMemory) {
                let swapCt = _Scheduler.getNextSwapContext();
                let segment;
                if (swapCt == undefined) {
                    segment = 0;
                }
                else {
                    segment = swapCt.segment;
                    swapCt.segment = undefined;
                    swapCt.inMemory = false;
                    let bytes = _Memory.getBytes(segment * _MMU.segmentSize, _MMU.segmentSize);
                    _krnDiskDriver.rollOutProcess(swapCt, bytes);
                }
                ct.segment = segment;
                //console.log(segment);
                _krnDiskDriver.rollInProcess(ct, segment);
            }
            else {
            }
            return 0;
        }
    }
    DeviceDriverDisk.emptyFlag = String.fromCharCode(0);
    DeviceDriverDisk.nextFlag = String.fromCharCode(1);
    DeviceDriverDisk.finalFlag = String.fromCharCode(2);
    DeviceDriverDisk.swapPrefix = "~";
    TSOS.DeviceDriverDisk = DeviceDriverDisk;
})(TSOS || (TSOS = {}));
