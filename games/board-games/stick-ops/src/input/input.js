export class Input{
  constructor(canvas){
    this.canvas=canvas;this.keys=new Set();this.pressed=new Set();this.mouse={x:0,y:0,down:false};this.touchAxis=0;
    window.addEventListener("keydown",e=>{
      if(!this.keys.has(e.code))this.pressed.add(e.code);this.keys.add(e.code);
      if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();
    });
    window.addEventListener("keyup",e=>this.keys.delete(e.code));
    const move=e=>this.setPointerFromClient(e.clientX,e.clientY);
    canvas.addEventListener("mousemove",move);
    canvas.addEventListener("mousedown",e=>{this.mouse.down=true;if(e.button===2)this.tap("ThrowGrenade")});
    window.addEventListener("mouseup",()=>this.mouse.down=false);
    canvas.addEventListener("contextmenu",e=>e.preventDefault());
    canvas.addEventListener("wheel",e=>{this.tap("CycleWeapon");e.preventDefault()},{passive:false});
  }
  // shared by mouse and the touch aim-pad — converts a client-space point to
  // canvas pixel space using the canvas's own backing resolution
  setPointerFromClient(clientX,clientY){
    const r=this.canvas.getBoundingClientRect();
    this.mouse.x=(clientX-r.left)*(this.canvas.width/r.width);
    this.mouse.y=(clientY-r.top)*(this.canvas.height/r.height);
  }
  down(code){return this.keys.has(code)}
  consume(code){const v=this.pressed.has(code);this.pressed.delete(code);return v}
  // one-shot press, for touch buttons that map to single key-press actions
  tap(code){this.pressed.add(code)}
  // held press, for touch buttons that map to hold-to-use actions (bullet time)
  holdStart(code){this.keys.add(code)}
  holdEnd(code){this.keys.delete(code)}
  axisX(){const k=(this.down("KeyD")?1:0)-(this.down("KeyA")?1:0);return this.touchAxis||k}
  endFrame(){this.pressed.clear()}
}
