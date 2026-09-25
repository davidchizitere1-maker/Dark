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
// Belt-and-suspenders: block the gesture at every event that could start it
// (Safari's non-standard gesture* events AND a plain 2-finger touchstart),
// and set window.__pinchGuard while any 2nd finger is down so the renderer's
// resize handler (which visualViewport still fires mid-gesture on some
// browsers) skips recalculating the canvas buffer until the gesture is over.
document.addEventListener("gesturestart",e=>e.preventDefault());
document.addEventListener("gesturechange",e=>e.preventDefault());
document.addEventListener("gestureend",e=>e.preventDefault());
let lastTouchEnd=0;
window.__pinchGuard=false;
document.addEventListener("touchstart",e=>{
  if(e.touches&&e.touches.length>1){window.__pinchGuard=true;e.preventDefault()}
},{passive:false});
document.addEventListener("touchmove",e=>{if(e.touches&&e.touches.length>1)e.preventDefault()},{passive:false});
document.addEventListener("touchend",e=>{
  const now=Date.now();if(now-lastTouchEnd<340)e.preventDefault();lastTouchEnd=now;
  if(!e.touches||e.touches.length<2){window.__pinchGuard=false;window.dispatchEvent(new Event("resize"))}
},{passive:false});
document.addEventListener("touchcancel",()=>{window.__pinchGuard=false},{passive:true});

const canvas=document.getElementById("gameCanvas");
const input=new Input(canvas);
const ui=new UI();
const renderer=new Renderer(canvas,CONFIG);
const audio=new AudioSystem();
const game=new Game({config:CONFIG,input,renderer,ui,audio,canvas});
new TouchControls(input);
game.init();
window.zeroExtraction=game;

