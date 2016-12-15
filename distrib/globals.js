/* ------------
   Globals.ts

   Global CONSTANTS and _Variables.
   (Global over both the OS and Hardware Simulation / Host.)

   This code references page numbers in the text book:
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */
//
// Global CONSTANTS (TypeScript 1.5 introduced const. Very cool.)
//
const APP_NAME = "The Oppy";
const APP_VERSION = "0.04";
const CPU_CLOCK_INTERVAL = 10; //100;   // This is in ms (milliseconds) so 1000 = 1 second.
const TIMER_IRQ = 0; // Pages 23 (timer), 9 (interrupts), and 561 (interrupt priority).
// NOTE: The timer is different from hardware/host clock pulses. Don't confuse these.
const KEYBOARD_IRQ = 1;
const TERM_IRQ = 2;
const SYSCALL_IRQ = 3;
const CT_SWITCH_IRQ = 4;
//
// Global Variables
// TODO: Make a global object and use that instead of the "_" naming convention in the global namespace.
//
var _CPU;
// Single-step mode
var _SSMode = false;
var _NextStep = false;
var _Memory;
var _PCB;
var _MMU;
var _Disk;
var _DefaultMemorySize = 0x200;
// Process states
const STATE_EXECUTING = 0x1;
const STATE_READY = 0x2;
const STATE_WAITING = 0x4;
const STATE_TERMINATED = 0x8;
var _Scheduler;
const MODE_FCFS = Symbol();
const MODE_ROUND_ROBIN = Symbol();
var _DebugMode = true;
// Overall OS status
var _Status = 'off';
var _OSclock = 0; // Page 23.
var _Mode = 0; // (currently unused)  0 = Kernel Mode, 1 = User Mode.  See page 21.
var _Canvas; // Initialized in Control.hostInit().
var _DrawingContext; // = _Canvas.getContext("2d");  // Assigned here for type safety, but re-initialized in Control.hostInit() for OCD and logic.
var _DefaultFontFamily = "sans"; // Ignored, I think. The was just a place-holder in 2008, but the HTML canvas may have use for it.
var _DefaultFontSize = 13;
var _FontHeightMargin = 4; // Additional space added to font size when advancing a line.
var _DisplayXRes;
var _DisplayYRes;
var _Trace = true; // Default the OS trace to be on.
// The OS Kernel and its queues.
var _Kernel;
var _KernelInterruptQueue; // Initializing this to null (which I would normally do) would then require us to specify the 'any' type, as below.
var _KernelInputQueue = null; // Is this better? I don't like uninitialized variables. But I also don't like using the type specifier 'any'
var _KernelBuffers = null; // when clearly 'any' is not what we want. There is likely a better way, but what is it?
// Standard input and output
var _StdIn; // Same "to null or not to null" issue as above.
var _StdOut;
// UI
var _Console;
var _OsShell;
// At least this OS is not trying to kill you. (Yet.)
var _SarcasticMode = false;
// Global Device Driver Objects - page 12
var _krnKeyboardDriver;
var _krnDiskDriver;
var _hardwareClockID = null;
// For testing (and enrichment)...
var Glados = null; // This is the function Glados() in glados.js on Labouseur.com.
var _GLaDOS = null; // If the above is linked in, this is the instantiated instance of Glados.
var displayRatio = 5 / 12;
var displayPadding = 50;
var onDocumentLoad = function () {
    TSOS.Control.hostInit();
    _DisplayXRes = document.body.clientWidth * displayRatio - displayPadding;
    _DisplayXRes = Math.floor(_DisplayXRes);
    document.getElementById('display').width = _DisplayXRes;
    _DisplayYRes = document.getElementById('display').height;
};
