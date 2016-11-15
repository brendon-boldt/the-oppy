///<reference path="../globals.ts" />
///<reference path="deviceDriver.ts" />

module TSOS {

    // Extends DeviceDriver
    export class DeviceDriverDisk extends DeviceDriver {

        constructor() {
            // Override the base method pointers.

            // The code below cannot run because "this" can only be
            // accessed after calling super.
            //super(this.krnKbdDriverEntry, this.krnKbdDispatchKeyPress);
            super();
            this.driverEntry = this.krnDskDriverEntry;
            //this.isr = this.krnKbdDispatchKeyPress;
        }

        public krnDskDriverEntry() {
            // Initialization routine for this
            this.status = "loaded";
        }


    }
}
