import {Game} from "./core/game.js";
import {CONFIG} from "./config.js";
import {Input} from "./input/input.js";
import {Renderer} from "./render/renderer.js";
import {UI} from "./ui/interface.js";
import {AudioSystem} from "./audio/audio.js";

const canvas=document.getElementById("gameCanvas");
const input=new Input(canvas);
const ui=new UI();
const renderer=new Renderer(canvas,CONFIG);
const audio=new AudioSystem();
const game=new Game({config:CONFIG,input,renderer,ui,audio,canvas});
game.init();
window.zeroExtraction=game;
