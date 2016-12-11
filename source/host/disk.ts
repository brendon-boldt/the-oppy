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
    //private bytes: string;    
    public static nullChar: string = String.fromCharCode(0);

    //private diskName: string = "disk";

    constructor() {
        let mbr = sessionStorage.getItem("0:0:0");
        if (!mbr) {
            this.formatDisk();
        }
    }

    public getDiskSize(): number {
        return Disk.trackCount
            * Disk.sectorCount
            * Disk.blockCount
            * Disk.blockSize;
    }


    public formatDisk(): void {
        for (let t = 0; t < Disk.trackCount; ++t) {
            for (let s = 0; s < Disk.sectorCount; ++s) {
                for (let b = 0; b < Disk.blockCount; ++b) {
                    //sessionStorage.setItem(t+':'+s+':'+b,
                            //new Array(this.getDiskSize+1).join(Disk.nullChar));
                    //console.log("writing: " + [t,s,b]);
                    this.writeDisk([t,s,b], "", true);
                }
            }
        }
    }

    // TODO Move this to disk driver
    //public getNextBlockAddr(blockAddr: number): number {
    public getNextBlockAddr(tsb: number[]): number[] {
        let addr: number[];
        let bytes = this.readDisk(tsb);
        if (bytes[0] == '2') {
            addr = undefined;
        } else if (bytes[0] == '1') {
            addr = [
                parseInt(bytes[1]),
                parseInt(bytes[2]),
                parseInt(bytes[3])];
        }
        return addr;
    }

    /*
    public getImage(): string {
        return this.bytes;
    }
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
            //this.bytes = this.bytes.slice(0, addr)
                    //+ data
                    //+ this.bytes.slice(addr + data.length);
            if (update !== false)
                Devices.hostUpdateDiskDisplay([str]);
            return 0;
        } else {
            // TODO Add error on incorrect TSB
            return 1;
        }

    }

    public string_readDisk(str: string): string {
        let arr = str.split(':'); 
        return this.readDisk([
                parseInt(arr[0]),
                parseInt(arr[1]),
                parseInt(arr[2])]);
    }

    public readDisk(tsb: number[]): string {
        if (tsb[0] < Disk.trackCount &&
                tsb[1] < Disk.sectorCount &&
                tsb[2] < Disk.blockCount) {
            let addr = Disk.getBlockAddr(tsb);
            //return this.bytes.slice(addr, addr+Disk.blockSize);
            return sessionStorage.getItem(tsb[0]+':'+tsb[1]+':'+tsb[2]);
        } else {
            // TODO Add error on incorrect TSB
            return undefined;
        }
    }

} }

