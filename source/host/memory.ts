///<reference path="../globals.ts" />


module TSOS {
export class Memory { 

    public static defaultMemorySize = 0x300;

    constructor(
        private bytes: number[] = Array(Memory.defaultMemorySize)
    ) {
        // I guess we should initialize the memory to zeros
        for (let i = 0; i < this.bytes.length; i++) {
            if (this.bytes[i] == undefined)
                this.bytes[i] = 0x0;
        }
    }

    public getMemSize(): number {
        return this.bytes.length;  
    } 

    /**
     * Bounds check!
     * This should not be needed, though, if the MMU is doing its job.
     */
    private checkAddr(addr: number): boolean {
        return addr < this.bytes.length && addr >= 0;
    }

    /** Check the validity of a byte
     */
    private checkValue(value: number): boolean {
        return value >= 0x0 && value <= 0xff;
    }

    // TODO Raise error upon incorrect address passed
    // For now, this done only by the MMU
    public getByte(addr: number): number {
        if (this.checkAddr(addr))
            return this.bytes[addr];
        else {
            alert('Memory address outside of physical memory');
            return 0x0;
        }
    }

    /** Get array of bytes.
     */
    public getBytes(addr: number, size: number): number[] {
       if (this.checkAddr(addr) && this.checkAddr(addr+size-1)) {
            return this.bytes.slice(addr, size);
       } else {
            alert('Memory address outside of physical memory');
            return [];
       }
    }

    // TODO Raise error upon incorrect address passed
    // Again, MMU handles this for now.
    public setByte(addr: number, value: number): boolean {
        if (!this.checkValue(value))
            alert('This will be an error');
        if (this.checkAddr(addr)) {
            this.bytes[addr] = value;
            return true;
        } else {
            return false;
        }
    }

    /** Set array of bytes.
     */
    public setBytes(addr: number, values: number[]) {
        if (!this.checkAddr(addr + values.length - 1)) {
            alert('error');
            return;
        }
        for (let i = 0; i < values.length; i++) {
            if (!this.checkValue(values[i])) {
                alert('error');
                return;
            }
            this.bytes[addr + i] = values[i];
        }
    }

} }
