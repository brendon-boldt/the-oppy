///<reference path="../globals.ts" />
///<reference path="deviceDriver.ts" />
var TSOS;
(function (TSOS) {
    class DeviceDriverDisk extends TSOS.DeviceDriver {
        constructor() {
            super();
            this.driverEntry = this.krnDskDriverEntry;
        }
        krnDskDriverEntry() {
            this.status = "loaded";
        }
        /** Trim the filename of trailing zeros
         */
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
        /** Convert string TSB to numeric TSB
         */
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
        /** Find the next open directory entry.
         * TODO Cache open block detail
         */
        nextOpenDirEntry() {
            for (let s = 0; s < TSOS.Disk.sectorCount; ++s) {
                for (let b = 0; b < TSOS.Disk.blockCount; ++b) {
                    if (s == 0)
                        ++b;
                    let bytes = _Disk.readDisk([0, s, b]);
                    if (bytes[0] == String.fromCharCode(0) &&
                        bytes[1] == String.fromCharCode(0) &&
                        bytes[2] == String.fromCharCode(0))
                        return [0, s, b];
                }
            }
            return undefined;
        }
        /** Get the next open directory entry unless the file exists.
         */
        nextOpenDirEntryOrFileExists(filename) {
            let DDD = DeviceDriverDisk;
            let tsb;
            for (let s = 0; s < TSOS.Disk.sectorCount; ++s) {
                for (let b = 0; b < TSOS.Disk.blockCount; ++b) {
                    if (s == 0)
                        ++b;
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
        /** Get the next open block for writing data.
         * Exclude a block from the search if necessary.
         * TODO See above
         */
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
        createDirectoryEntry(filename) {
            let dirTSB = this.nextOpenDirEntryOrFileExists(filename);
            let blockTSB = this.nextOpenBlock();
            if (blockTSB == undefined)
                return 3;
            else if (dirTSB == undefined)
                return 5;
            else if (dirTSB.length == 0)
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
            // Search for directory entry
            for (let s = 0; s < TSOS.Disk.sectorCount; ++s) {
                for (let b = 0; b < TSOS.Disk.sectorCount; ++b) {
                    if (s == 0)
                        ++b;
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
            // Write zeros to the directory and data blocks
            _Disk.writeDisk(dirTSB, "");
            _Disk.writeDisk(blockTSB, "");
            return 0;
        }
        /** Return an array of the file names including swap files.
         */
        getFilenames() {
            let DDD = DeviceDriverDisk;
            let filenames = [];
            for (let s = 0; s < TSOS.Disk.sectorCount; ++s) {
                for (let b = 0; b < TSOS.Disk.sectorCount; ++b) {
                    if (s == 0)
                        ++b;
                    let bytes = _Disk.readDisk([0, s, b]);
                    let name = DDD.trimFilename(bytes.slice(3));
                    if (name.length != 0)
                        filenames.push(name);
                }
            }
            return filenames;
        }
        createFile(filename) {
            // Check if the filename exists already
            let ret = 1;
            ret = this.createDirectoryEntry(filename);
            if (ret == 4) {
                // File already exists (but that's okay)
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
                for (let b = 0; b < TSOS.Disk.sectorCount; ++b) {
                    if (s == 0)
                        ++b;
                    let bytes = _Disk.readDisk([0, s, b]);
                    if (DDD.trimFilename(bytes.slice(3)) == filename) {
                        blockTSB = DDD.stringToTSB(bytes.slice(0, 3));
                        // Break out of the loop
                        s = 0xff;
                        b = 0xff;
                    }
                }
            }
            if (!blockTSB) {
                return 2;
            }
            let returnStatus = 0;
            // Status of the current block
            let blockStatus;
            // Status of the block to be written
            let newStatus;
            let bytes;
            let nextTSB = blockTSB;
            let index = 0;
            do {
                blockTSB = nextTSB;
                nextTSB = undefined;
                bytes = _Disk.readDisk(blockTSB);
                blockStatus = bytes.charCodeAt(0);
                if (blockStatus == 1) {
                    // If the current block already has allocated another
                    // block, go to that one next.
                    nextTSB = DDD.stringToTSB(bytes.slice(1, 4));
                }
                if ((data.length - index) < 0) {
                    // If we are writing past the data, any other blocks
                    // will be marked as unallocated.
                    newStatus = 0;
                }
                else if ((data.length - index) <= TSOS.Disk.blockSize - 4) {
                    // If the rest of the data can fit in a block,
                    // mark the disk block as the final block.
                    newStatus = 2;
                }
                else {
                    // Otherwise, continue writing the data.
                    newStatus = 1;
                    blockStatus = 1;
                }
                if (nextTSB == undefined) {
                    if (newStatus == 1) {
                        // Get the next open block
                        nextTSB = this.nextOpenBlock(blockTSB);
                        if (nextTSB == undefined) {
                            // If there are no available bocks
                            blockStatus = -1;
                            newStatus = 2;
                            returnStatus = 3;
                            nextTSB = [0xfe, 0xfe, 0xfe];
                        }
                    }
                    else {
                        // Placeholder value for the next block
                        nextTSB = [0xff, 0xff, 0xff];
                    }
                }
                // Prepare the data to be written
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
            let DDD = DeviceDriverDisk;
            // Get the initial location of the file
            let blockTSB;
            for (let s = 0; s < TSOS.Disk.sectorCount; ++s) {
                for (let b = 0; b < TSOS.Disk.sectorCount; ++b) {
                    if (s == 0)
                        ++b;
                    let bytes = _Disk.readDisk([0, s, b]);
                    if (DDD.trimFilename(bytes.slice(3)) == filename) {
                        blockTSB = DDD.stringToTSB(bytes.slice(0, 3));
                        // Break out of the loop
                        s = 0xff;
                        b = 0xff;
                    }
                }
            }
            if (!blockTSB)
                return undefined;
            let data = [];
            let blockStatus;
            let bytes;
            let nextTSB = blockTSB;
            let index = 0;
            // Follow the file pointers
            do {
                bytes = _Disk.readDisk(nextTSB);
                blockStatus = bytes.charCodeAt(0);
                if (blockStatus == 1) {
                    nextTSB = DDD.stringToTSB(bytes.slice(1, 4));
                }
                data.push(bytes.slice(4));
            } while (blockStatus == 1);
            // Join all of the data blocks
            return data.join("");
        }
        formatDisk() {
            _Disk.formatDisk();
        }
        /** Copy process from raw bytes to a file.
         */
        rollOutProcess(ct, bytes) {
            let byteString = "";
            // Turn numeric array into string
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
            else if (ret == 3 || ret == 5) {
                // If there is no more space to swap
                return 3;
            }
            else {
                console.log("Error code: " + ret);
                console.log(new Error().stack);
                ct.inMemory = undefined;
            }
            return ret;
        }
        /** Copy swap file from disk into memory.
         */
        rollInProcess(ct, segNum) {
            let filename = DeviceDriverDisk.swapPrefix + ct.pid;
            let byteString = _krnDiskDriver.readFile(filename);
            if (byteString == undefined) {
                console.log("Could not roll in PID " + ct.pid);
                console.log(new Error().stack);
            }
            // Convert string to bytes
            let bytes = byteString.split("").map(function (x) {
                return x.charCodeAt(0);
            });
            bytes = bytes.slice(0, _MMU.segmentSize);
            _MMU.clearSegment(segNum);
            _MMU.loadBytesToSegment(segNum, bytes);
            // Let the process context know that it is in memory
            ct.segment = segNum;
            ct.inMemory = true;
            return 0;
        }
        /** Swap the context into memory if needed.
         */
        swapIfNeeded(ct) {
            if (!ct.inMemory) {
                // Find out what process should be swapped out
                let swapCt = _Scheduler.getNextSwapContext();
                let segment;
                // If there are no processes to swap, swap into segment 0
                if (swapCt == undefined) {
                    segment = 0;
                }
                else {
                    segment = swapCt.segment;
                    swapCt.segment = undefined;
                    swapCt.inMemory = false;
                    let bytes = _Memory.getBytes(segment * _MMU.segmentSize, _MMU.segmentSize);
                    // Roll out the process being swapped
                    let ret = _krnDiskDriver.rollOutProcess(swapCt, bytes);
                    // If no storage space is left
                    if (ret == 3) {
                        swapCt.segment = segment;
                        swapCt.inMemory = true;
                        return 3;
                    }
                }
                ct.segment = segment;
                // Roll in the new process finally
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
    // Prefix for the swap files
    DeviceDriverDisk.swapPrefix = "~";
    TSOS.DeviceDriverDisk = DeviceDriverDisk;
})(TSOS || (TSOS = {}));
