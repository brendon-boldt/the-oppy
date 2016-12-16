///<reference path="../globals.ts" />


module TSOS {
export class Disk { 

    //public static defaultDiskSize = 0x1000;

    public static trackCount: number  = 0x4;
    public static sectorCount: number = 0x8;
    public static blockCount: number  = 0x8;
    public static blockSize: number   = 0x40;
    public static trackSize = Disk.sectorCount*Disk.blockCount*Disk.blockSize;
    public static sectorSize = Disk.blockCount*Disk.blockSize;

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


    public static nullChar: string = String.fromCharCode(0);

    constructor() {
        let mbr = sessionStorage.getItem("0:0:0");
        if (!mbr) {
            this.formatDisk(false);
        }
    }

    public getDiskSize(): number {
        return Disk.trackCount
            * Disk.sectorCount
            * Disk.blockCount
            * Disk.blockSize;
    }


    /** Write 0's to the disk.
     */
    public formatDisk(update: boolean = true): void {
        for (let t = 0; t < Disk.trackCount; ++t) {
            for (let s = 0; s < Disk.sectorCount; ++s) {
                for (let b = 0; b < Disk.blockCount; ++b) {
                    this.writeDisk([t,s,b], "", update);
                }
            }
        }
    }

    /** Write to the disk the specified string.
     * Update the display if specified.
     */
    public writeDisk(tsb: number[], data: string, update?: boolean): number {
        if (tsb[0] < Disk.trackCount &&
                tsb[1] < Disk.sectorCount &&
                tsb[2] < Disk.blockCount) {
            if (data.length < Disk.blockSize) {
                data += Array(Disk.blockSize - data.length + 1)
                        .join(Disk.nullChar);
            }
            let str = tsb[0]+':'+tsb[1]+':'+tsb[2];
            sessionStorage.setItem(str, data);
            if (update !== false)
                Devices.hostUpdateDiskDisplay([str]);
            return 0;
        } else {
            // TODO Add error on incorrect TSB
            return 1;
        }

    }

    /** Read the disk using a string address.
     */
    public string_readDisk(str: string): string {
        let arr = str.split(':'); 
        return this.readDisk([
                parseInt(arr[0]),
                parseInt(arr[1]),
                parseInt(arr[2])]);
    }

    /** Read the disk at the specified track, sector, and block.
     */
    public readDisk(tsb: number[]): string {
        if (tsb[0] < Disk.trackCount &&
                tsb[1] < Disk.sectorCount &&
                tsb[2] < Disk.blockCount) {
            let str = sessionStorage.getItem(tsb[0]+':'+tsb[1]+':'+tsb[2]);
            return str;
        } else {
            // TODO Add error on incorrect TSB
            return undefined;
        }
    }

} }

