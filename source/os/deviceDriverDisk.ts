///<reference path="../globals.ts" />
///<reference path="deviceDriver.ts" />

module TSOS {

    // Extends DeviceDriver
    export class DeviceDriverDisk extends DeviceDriver {

        constructor() {
            super();
            this.driverEntry = this.krnDskDriverEntry;
        }

        public krnDskDriverEntry() {
            this.status = "loaded";
        }


        private static emptyFlag = String.fromCharCode(0);
        private static nextFlag = String.fromCharCode(1);
        private static finalFlag = String.fromCharCode(2);

        private filenames: string[] = [];

        // TODO Cache open block detail
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


        // TODO See above
        private nextOpenBlock(): number[] {
            for (let t = 1; t < Disk.sectorCount; ++t) {
                for (let s = 0; s < Disk.sectorCount; ++s) {
                    for (let b = 0; b < Disk.sectorCount; ++b) {
                        let bytes = _Disk.readDisk([t,s,b]);
                        if (bytes[0] == DeviceDriverDisk.emptyFlag)
                            return [t,s,b];
                    }
                }
            }
            return undefined;
        }

        private createDirectoryEntry(filename: string): number {
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

        private deleteDirectoryEntry(filename: string): number {
            let dirTSB: number[];
            for (let s = 0; s < Disk.sectorCount; ++s) {
                for (let b = 1; b < Disk.sectorCount; ++b) {
                    let bytes = _Disk.readDisk([0,s,b]);
                    if (bytes[0] == String.fromCharCode(0) &&
                            bytes[1] == String.fromCharCode(0) &&
                            bytes[2] == String.fromCharCode(0))
                        dirTSB = bytes.slice(0,3);
                }
            }
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
                ret = this.deleteDirectoryEntry(filename);
                this.filenames.slice(0, index) +
                        this.filenames.slice(index + 1, this.filename.length) ;
            } 
            return 1;
        }

        public writeFile(filename: string): number {

            return 1;
        }

        public readFile(filename: string): string {

            return "";
        }


    }
}
