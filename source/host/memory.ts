///<reference path="../globals.ts" />


module TSOS {
export class Memory { 

    public static defaultMemorySize = 0x200;

    constructor(
        private bytes: number[] = Array(Memory.defaultMemorySize)
    ) {
        for (let i = 0; i < this.bytes.length; i++) {
            if (this.bytes[i] == undefined)
                this.bytes[i] = 0x0;
        }
    }

    public getMemSize(): number {
        return this.bytes.length;  
    } 

    private checkAddr(addr: number): boolean {
        return addr < this.bytes.length && addr >= 0;
    }

    private checkValue(value: number): boolean {
        return value >= 0x0 && value <= 0xff;
    }

    // TODO Raise error upon incorrect address passed
    public getByte(addr: number): number {
        if (this.checkAddr(addr))
            return this.bytes[addr];
        else {
            alert('This will be an error');
            return 0x0;
        }
    }

    public getBytes(addr: number, size: number): number[] {
       if (this.checkAddr(addr) && this.checkAddr(addr+size-1)) {
            return this.bytes.slice(addr, size);
       } else {
            alert('This will be an error');
            return [0x0];
       }
    }

    // TODO Raise error upon incorrect address passed
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

    // TODO Raise error upon incorrect address passed
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
