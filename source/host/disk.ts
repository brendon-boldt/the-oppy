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

    public static getBlockAddr(tsb: number[]): number {
        if (tsb.length < 3)
            return undefined;
        return tsb[2] * Disk.blockSize
            + tsb[1] * Disk.blockCount * Disk.blockSize
            + tsb[0] * Disk.sectorCount * Disk.blockCount * Disk.blockSize;
    }

    public static getTSB(addr: number): number[] {
        return [Math.floor(addr/this.trackSize),
            Math.floor((addr % this.trackSize)/this.sectorSize),
            Math.floor((addr % this.sectorSize)/Disk.blockSize)];
    }

    // Should bytes be a string or array?
    private bytes: string;    
    public static nullChar: string = String.fromCharCode(0);

    private diskName: string = "disk";

    constructor() {
        let sessionDisk = sessionStorage.getItem(this.diskName);
        if (sessionDisk != undefined) {
            this.bytes = sessionDisk;
        } else {
            this.bytes = new Array(this.getDiskSize()+1).join(Disk.nullChar);
        }
    }

    public getDiskSize(): number {
        return Disk.trackCount
            * Disk.sectorCount
            * Disk.blockCount
            * Disk.blockSize;
    }

    // TODO Move this to disk driver
    public getNextBlockAddr(blockAddr: number) {
        let addr: number;
        if (this.bytes[blockAddr] == '2') {
            addr = undefined;
        } else if (this.bytes[blockAddr] == '1') {
            addr = Disk.getBlockAddr([
                parseInt(this.bytes[blockAddr+1]),
                parseInt(this.bytes[blockAddr+2]),
                parseInt(this.bytes[blockAddr+3])]);
        }
        return addr;
    }

    public getImage(): string {
        return this.bytes;
    }

    public writeDisk(tsb: number[], data: string): number {
        if (tsb[0] < Disk.trackCount &&
                tsb[1] < Disk.sectorCount &&
                tsb[2] < Disk.blockCount) {
            let addr = Disk.getBlockAddr(tsb);
            if (data.length < Disk.blockSize) {
                data += Array(Disk.blockSize - data.length + 1)
                        .join(Disk.nullChar);
            }
            this.bytes = this.bytes.slice(0, addr)
                    + data
                    + this.bytes.slice(addr + data.length);
            Devices.hostUpdateDiskDisplay();
            return 0;
        } else {
            // TODO Add error on incorrect TSB
            return 1;
        }

    }

    public readDisk(tsb: number[]): string {
        if (tsb[0] < Disk.trackCount &&
                tsb[1] < Disk.sectorCount &&
                tsb[2] < Disk.blockCount) {
            let addr = Disk.getBlockAddr(tsb);
            return this.bytes.slice(addr, addr+Disk.blockSize);
        } else {
            // TODO Add error on incorrect TSB
            return undefined;
        }
    }

} }

