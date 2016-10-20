///<reference path="../globals.ts" />
var TSOS;
(function (TSOS) {
    class Memory {
        constructor(bytes = Array(Memory.defaultMemorySize)) {
            this.bytes = bytes;
            for (let i = 0; i < this.bytes.length; i++) {
                if (this.bytes[i] == undefined)
                    this.bytes[i] = 0x0;
            }
        }
        getMemSize() {
            return this.bytes.length;
        }
        checkAddr(addr) {
            return addr < this.bytes.length && addr >= 0;
        }
        checkValue(value) {
            return value >= 0x0 && value <= 0xff;
        }
        // TODO Raise error upon incorrect address passed
        getByte(addr) {
            if (this.checkAddr(addr))
                return this.bytes[addr];
            else {
                alert('Memory address outside of physical memory');
                return 0x0;
            }
        }
        getBytes(addr, size) {
            if (this.checkAddr(addr) && this.checkAddr(addr + size - 1)) {
                return this.bytes.slice(addr, size);
            }
            else {
                alert('Memory address outside of physical memory');
                return [0x0];
            }
        }
        // TODO Raise error upon incorrect address passed
        setByte(addr, value) {
            if (!this.checkValue(value))
                alert('This will be an error');
            if (this.checkAddr(addr)) {
                this.bytes[addr] = value;
                return true;
            }
            else {
                return false;
            }
        }
        // TODO Raise error upon incorrect address passed
        setBytes(addr, values) {
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
    }
    Memory.defaultMemorySize = 0x100;
    TSOS.Memory = Memory;
})(TSOS || (TSOS = {}));
