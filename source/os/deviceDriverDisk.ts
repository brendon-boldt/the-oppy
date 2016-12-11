///<reference path="../globals.ts" />
///<reference path="deviceDriver.ts" />

module TSOS {

    // Extends DeviceDriver
    export class DeviceDriverDisk extends DeviceDriver {

        constructor() {
            super();
            this.driverEntry = this.krnDskDriverEntry;
            this.populateFilenames();
        }

        public krnDskDriverEntry() {
            this.status = "loaded";
        }

        private static emptyFlag = String.fromCharCode(0);
        private static nextFlag = String.fromCharCode(1);
        private static finalFlag = String.fromCharCode(2);

        private static trimFilename(str: string): string {
            let lastIndex: number;
            for (let i = 0; i < str.length; ++i) {
                if (str[i] == String.fromCharCode(0)) {
                    lastIndex = i;
                    break;
                }
            }
            return str.slice(0, lastIndex);
        }

        public static stringToTSB(str: string): number[] {
            if (str.length < 3) {
                return undefined;
            } else {
                return [str[0].charCodeAt(0),
                       str[1].charCodeAt(0), 
                       str[2].charCodeAt(0)];
            }
        }

        private filenames: string[] = [];

        private populateFilenames(): void {
            let DDD = DeviceDriverDisk;
            let filename: string;
            for (let s = 0; s < Disk.sectorCount; ++s) {
                for (let b = 1; b < Disk.sectorCount; ++b) {
                    let bytes = _Disk.readDisk([0,s,b]);
                    filename = DDD.trimFilename(bytes.slice(3));
                    if (filename.length > 0) {
                        this.filenames.push(filename);
                    }
                }
            }
        }

        // TODO Cache open block detail
        private nextOpenDirEntry(): number[] {
            for (let s = 0; s < Disk.sectorCount; ++s) {
                for (let b = 1; b < Disk.blockCount; ++b) {
                    let bytes = _Disk.readDisk([0,s,b]);
                    if (bytes[0] == String.fromCharCode(0) &&
                            bytes[1] == String.fromCharCode(0) &&
                            bytes[2] == String.fromCharCode(0))
                        return [0,s,b];
                }
            }
            return undefined;
        }


        // TODO See above
        private nextOpenBlock(exclude: number[] = [-1,-1,-1]): number[] {
            for (let t = 1; t < Disk.trackCount; ++t) {
                for (let s = 0; s < Disk.sectorCount; ++s) {
                    for (let b = 0; b < Disk.blockCount; ++b) {
                        let bytes = _Disk.readDisk([t,s,b]);
                        if (bytes[0] == DeviceDriverDisk.emptyFlag &&
                                (exclude[0] != t || 
                                 exclude[1] != s || 
                                 exclude[2] != b))
                            return [t,s,b];
                    }
                }
            }
            return undefined;
        }

        // TODO Detect directory overflow
        private createDirectoryEntry(filename: string): number {
            let dirTSB = this.nextOpenDirEntry();
            let blockTSB = this.nextOpenBlock();
            if (blockTSB == undefined)
                return 3;
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

        private deleteDirectoryEntry(filename: string): number {
            let DDD = DeviceDriverDisk;
            let dirTSB: number[];
            let blockTSB: number[];
            for (let s = 0; s < Disk.sectorCount; ++s) {
                for (let b = 1; b < Disk.sectorCount; ++b) {
                    let bytes = _Disk.readDisk([0,s,b]);
                    if (DDD.trimFilename(bytes.slice(3)) == filename) {
                        blockTSB = DDD.stringToTSB(bytes.slice(0,3));
                        dirTSB = [0,s,b];
                        // Break out of the loop
                        s = 0xff;
                        b = 0xff;
                    }
                }
            }
            if (!dirTSB || !blockTSB)
                return 1
            let bytes = _Disk.readDisk(dirTSB);
            //let blockTSB = DDD.stringToTSB(bytes.slice(0,3));
            _Disk.writeDisk(dirTSB, "");
            _Disk.writeDisk(blockTSB, "");

            return 0;
        }

        public createFile(filename: string): number {
            // Check if the filename exists already
            let ret = 1;
            if (this.filenames.indexOf(filename) == -1) {
                ret = this.createDirectoryEntry(filename);
                this.filenames.push(filename);
            } 
            return ret;
        }

        public deleteFile(filename: string): number {
            let ret = 1;
            let index = this.filenames.indexOf(filename)
            if (index != -1) {
                this.writeFile(filename, "");
                ret = this.deleteDirectoryEntry(filename);
                this.filenames = this.filenames.slice(0, index).concat( 
                        this.filenames.slice(index + 1, filename.length));
            } 
            return ret;
        }

        public writeFile(filename: string, data: string): number {
            // Return 2 if the file is not found
            if (this.filenames.indexOf(filename) == -1) {
                return 2;
            }
            let DDD = DeviceDriverDisk;
            let blockTSB: number[];
            for (let s = 0; s < Disk.sectorCount; ++s) {
                for (let b = 1; b < Disk.sectorCount; ++b) {
                    let bytes = _Disk.readDisk([0,s,b]);
                    if (DDD.trimFilename(bytes.slice(3)) == filename) {
                        blockTSB = DDD.stringToTSB(bytes.slice(0,3));
                        // Break out of the loop
                        s = 0xff;
                        b = 0xff;
                    }
                }
            }
            // This should not need to execute
            if (!blockTSB) 
                return 2

            let returnStatus = 0;
            let blockStatus: number;
            let newStatus: number;
            let bytes: string;
            let nextTSB: number[] = blockTSB;
            //let nextTSB: number[];
            let index = 0;
            do {
                blockTSB = nextTSB;
                nextTSB = undefined;
                bytes = _Disk.readDisk(blockTSB);
                blockStatus = bytes.charCodeAt(0);
                if (blockStatus == 1) {
                    nextTSB = DDD.stringToTSB(bytes.slice(1,4));
                }

                if ((data.length - index) < 0) {
                    newStatus = 0;
                } else if ((data.length - index) <= Disk.blockSize - 4) {
                    newStatus = 2;
                }  else {
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
                            nextTSB = [0xfe,0xfe,0xfe];
                        }
                    } else {
                        nextTSB = [0xff,0xff,0xff];
                    }
                }

                let buffer = String.fromCharCode(newStatus) + 
                        String.fromCharCode(nextTSB[0]) +
                        String.fromCharCode(nextTSB[1]) +
                        String.fromCharCode(nextTSB[2]) +
                        data.slice(index, index + Disk.blockSize - 4);
                _Disk.writeDisk(blockTSB, buffer);
                index += Disk.blockSize - 4;
            } while (blockStatus == 1);

            return returnStatus;
        }

        public readFile(filename: string): string {
            // Return 2 if the file is not found
            if (this.filenames.indexOf(filename) == -1) {
                return undefined;
            }
            let DDD = DeviceDriverDisk;
            let blockTSB: number[];
            for (let s = 0; s < Disk.sectorCount; ++s) {
                for (let b = 1; b < Disk.sectorCount; ++b) {
                    let bytes = _Disk.readDisk([0,s,b]);
                    if (DDD.trimFilename(bytes.slice(3)) == filename) {
                        blockTSB = DDD.stringToTSB(bytes.slice(0,3));
                        // Break out of the loop
                        s = 0xff;
                        b = 0xff;
                    }
                }
            }
            // This should not need to execute
            if (!blockTSB) 
                return undefined;

            let data: string[] = [];
            let blockStatus: number;
            let bytes: string;
            let nextTSB: number[] = blockTSB;
            //let nextTSB: number[];
            let index = 0;
            do {
                bytes = _Disk.readDisk(nextTSB);
                blockStatus = bytes.charCodeAt(0);
                if (blockStatus == 1) {
                    nextTSB = DDD.stringToTSB(bytes.slice(1,4));
                }
                data.push(bytes.slice(4))
            } while (blockStatus == 1);


            return data.join("");
        }

        public formatDisk(): void {
            _Disk.formatDisk();
        }

    }
}
