///<reference path="../globals.ts" />
var TSOS;
(function (TSOS) {
    var Memory = (function () {
        function Memory(bytes) {
            if (bytes === void 0) { bytes = Array(0x500); }
            this.bytes = bytes;
            this.memSize = bytes.length;
            for (var i = 0; i < this.memSize; i++) {
                if (this.bytes[i] == undefined)
                    this.bytes[i] = 0x0;
            }
        }
        Memory.prototype.checkAddr = function (addr) {
            return addr < this.bytes.length && addr >= 0;
        };
        Memory.prototype.checkValue = function (value) {
            return value >= 0x0 && value <= 0xff;
        };
        // TODO Raise error upon incorrect address passed
        Memory.prototype.getByte = function (addr) {
            if (this.checkAddr(addr))
                return this.bytes[addr];
            else {
                alert('This will be an error');
                return 0x0;
            }
        };
        Memory.prototype.getBytes = function (addr, size) {
            if (this.checkAddr(addr) && this.checkAddr(addr + size - 1)) {
                return this.bytes.slice(addr, size);
            }
            else {
                alert('This will be an error');
                return [0x0];
            }
        };
        // TODO Raise error upon incorrect address passed
        Memory.prototype.setByte = function (addr, value) {
            if (!this.checkValue(value))
                alert('This will be an error');
            if (this.checkAddr(addr)) {
                this.bytes[addr] = value;
                return true;
            }
            else {
                return false;
            }
        };
        // TODO Raise error upon incorrect address passed
        Memory.prototype.setBytes = function (addr, values) {
            if (!this.checkAddr(addr + values.length - 1)) {
                alert('error');
                return;
            }
            for (var i = 0; i < values.length; i++) {
                if (!this.checkValue(values[i])) {
                    alert('error');
                    return;
                }
                this.bytes[addr + i] = values[i];
            }
        };
        return Memory;
    }());
    TSOS.Memory = Memory;
})(TSOS || (TSOS = {}));
