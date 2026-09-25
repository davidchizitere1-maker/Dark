import {Game} from "./core/game.js";
import {CONFIG} from "./config.js";
import {Input} from "./input/input.js";
import {Renderer} from "./render/renderer.js";
import {UI} from "./ui/interface.js";
import {AudioSystem} from "./audio/audio.js";
import {TouchControls} from "./input/touch.js";

// Prevent browser/page pinch-zoom and double-tap-zoom. Without this, a user
// pinch during play desyncs the visual viewport from the canvas buffer and
// everything appears to drift/"float" off the ground plane.
document.addEventListener("gesturestart",e=>e.preventDefault());
document.addEventListener("gesturechange",e=>e.preventDefault());
let lastTouchEnd=0;
document.addEventListener("touchend",e=>{const now=Date.now();if(now-lastTouchEnd<340)e.preventDefault();lastTouchEnd=now},{passive:false});
document.addEventListener("touchmove",e=>{if(e.touches&&e.touches.length>1)e.preventDefault()},{passive:false});

const canvas=document.getElementById("gameCanvas");
const input=new Input(canvas);
const ui=new UI();
const renderer=new Renderer(canvas,CONFIG);
const audio=new AudioSystem();
const game=new Game({config:CONFIG,input,renderer,ui,audio,canvas});
new TouchControls(input);
game.init();
window.zeroExtraction=game;

