///<reference path="../globals.ts" />
var TSOS;
(function (TSOS) {
    class Memory {
        constructor(bytes = Array(Memory.defaultMemorySize)) {
            this.bytes = bytes;
            // I guess we should initialize the memory to zeros
            for (let i = 0; i < this.bytes.length; i++) {
                if (this.bytes[i] == undefined)
                    this.bytes[i] = 0x0;
            }
        }
        getMemSize() {
            return this.bytes.length;
        }
        /**
         * Bounds check!
         * This should not be needed, though, if the MMU is doing its job.
         */
        checkAddr(addr) {
            return addr < this.bytes.length && addr >= 0;
        }
        /** Check the validity of a byte
         */
        checkValue(value) {
            return value >= 0x0 && value <= 0xff;
        }
        // TODO Raise error upon incorrect address passed
        // For now, this done only by the MMU
        getByte(addr) {
            if (this.checkAddr(addr))
                return this.bytes[addr];
            else {
                alert('Memory address outside of physical memory');
                return 0x0;
            }
        }
        /** Get array of bytes.
         */
        getBytes(addr, size) {
            if (this.checkAddr(addr) && this.checkAddr(addr + size - 1)) {
                return this.bytes.slice(addr, size);
            }
            else {
                alert('Memory address outside of physical memory');
                return [];
            }
        }
        // TODO Raise error upon incorrect address passed
        // Again, MMU handles this for now.
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
        /** Set array of bytes.
         */
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
    Memory.defaultMemorySize = 0x300;
    TSOS.Memory = Memory;
})(TSOS || (TSOS = {}));
