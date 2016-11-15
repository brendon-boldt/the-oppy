///<reference path="../globals.ts" />


module TSOS {
export class Disk { 

    //public static defaultDiskSize = 0x1000;

    public static trackCount: number = 4;
    public static sectorCount: number = 8;
    public static blockCount: number = 8;

    constructor(
        private bytes: number[] = Array(Memory.defaultMemorySize)
    ) {
        for (let i = 0; i < this.bytes.length; i++) {
            if (this.bytes[i] == undefined)
                this.bytes[i] = 0x0;
        }
    }

} }

