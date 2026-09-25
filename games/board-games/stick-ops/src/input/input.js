export class Input{
  constructor(canvas){
    this.canvas=canvas;this.keys=new Set();this.pressed=new Set();this.mouse={x:0,y:0,down:false};
    window.addEventListener("keydown",e=>{
      if(!this.keys.has(e.code))this.pressed.add(e.code);this.keys.add(e.code);
      if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();
    });
    window.addEventListener("keyup",e=>this.keys.delete(e.code));
    const move=e=>{const r=canvas.getBoundingClientRect();this.mouse.x=(e.clientX-r.left)*(canvas.width/r.width);this.mouse.y=(e.clientY-r.top)*(canvas.height/r.height)};
    canvas.addEventListener("mousemove",move);canvas.addEventListener("mousedown",()=>this.mouse.down=true);window.addEventListener("mouseup",()=>this.mouse.down=false);
  }
  down(code){return this.keys.has(code)}
  consume(code){const v=this.pressed.has(code);this.pressed.delete(code);return v}
  axisX(){return (this.down("KeyD")?1:0)-(this.down("KeyA")?1:0)}
  endFrame(){this.pressed.clear()}
}
