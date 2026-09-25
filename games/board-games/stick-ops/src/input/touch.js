// Killer Bean / COD-mobile style touch controls: a left movement joystick,
// a right drag-to-aim-and-fire zone, and a small action button cluster.
// Only activates on coarse-pointer (touch) devices; on desktop this is a no-op.
export class TouchControls{
  constructor(input){
    this.input=input;
    this.active=("ontouchstart" in window)||matchMedia("(pointer:coarse)").matches;
    if(!this.active)return;
    document.body.classList.add("touch-device");
    this.el=id=>document.getElementById(id);
    this.moveZone=this.el("touchMoveZone");this.stickBase=this.el("joystickBase");this.stickKnob=this.el("joystickKnob");
    this.aimZone=this.el("touchAimZone");this.aimMark=this.el("aimTouchMark");
    this.moveTouchId=null;this.aimTouchId=null;this.stickRadius=48;
    this.bindMove();this.bindAim();this.bindButtons();
  }
  bindMove(){
    const start=e=>{
      const t=e.changedTouches[0];if(this.moveTouchId!==null)return;this.moveTouchId=t.identifier;
      const r=this.stickBase.getBoundingClientRect();this.stickCenter={x:r.left+r.width/2,y:r.top+r.height/2};
      this.updateStick(t.clientX,t.clientY);e.preventDefault();
    };
    const move=e=>{for(const t of e.changedTouches)if(t.identifier===this.moveTouchId){this.updateStick(t.clientX,t.clientY);e.preventDefault()}};
    const end=e=>{for(const t of e.changedTouches)if(t.identifier===this.moveTouchId){this.moveTouchId=null;this.input.touchAxis=0;this.stickKnob.style.transform="translate(0,0)"}};
    this.moveZone.addEventListener("touchstart",start,{passive:false});
    this.moveZone.addEventListener("touchmove",move,{passive:false});
    this.moveZone.addEventListener("touchend",end);this.moveZone.addEventListener("touchcancel",end);
  }
  updateStick(clientX,clientY){
    const dx=clientX-this.stickCenter.x,dy=clientY-this.stickCenter.y,d=Math.hypot(dx,dy)||1;
    const clamped=Math.min(this.stickRadius,d);const nx=(dx/d)*clamped,ny=(dy/d)*clamped;
    this.stickKnob.style.transform=`translate(${nx}px,${ny}px)`;
    const dead=0.18;let axis=dx/this.stickRadius;axis=Math.max(-1,Math.min(1,axis));
    this.input.touchAxis=Math.abs(axis)<dead?0:axis;
    if(Math.abs(dy)>this.stickRadius*.7&&dy<0)this.input.tap("KeyW"); // flick up to jump
  }
  bindAim(){
    const start=e=>{
      const t=e.changedTouches[0];if(this.aimTouchId!==null)return;this.aimTouchId=t.identifier;
      this.input.setPointerFromClient(t.clientX,t.clientY);this.input.mouse.down=true;
      this.aimMark.classList.remove("hidden");this.positionAimMark(t.clientX,t.clientY);e.preventDefault();
    };
    const move=e=>{for(const t of e.changedTouches)if(t.identifier===this.aimTouchId){this.input.setPointerFromClient(t.clientX,t.clientY);this.positionAimMark(t.clientX,t.clientY);e.preventDefault()}};
    const end=e=>{for(const t of e.changedTouches)if(t.identifier===this.aimTouchId){this.aimTouchId=null;this.input.mouse.down=false;this.aimMark.classList.add("hidden")}};
    this.aimZone.addEventListener("touchstart",start,{passive:false});
    this.aimZone.addEventListener("touchmove",move,{passive:false});
    this.aimZone.addEventListener("touchend",end);this.aimZone.addEventListener("touchcancel",end);
  }
  positionAimMark(clientX,clientY){const r=this.aimZone.getBoundingClientRect();this.aimMark.style.left=(clientX-r.left)+"px";this.aimMark.style.top=(clientY-r.top)+"px"}
  bindButtons(){
    this.weaponIndex=0;const weapons=["Digit1","Digit2","Digit3","Digit4","Digit5","Digit6"];
    const wire=(id,fn)=>{const b=this.el(id);if(!b)return;b.addEventListener("touchstart",e=>{e.preventDefault();fn()},{passive:false})};
    wire("btnJump",()=>this.input.tap("KeyW"));
    wire("btnDodge",()=>this.input.tap("Space"));
    wire("btnReload",()=>this.input.tap("KeyR"));
    wire("btnMelee",()=>this.input.tap("KeyF"));
    wire("btnExecute",()=>this.input.tap("KeyE"));
    wire("btnWeapon",()=>{this.weaponIndex=(this.weaponIndex+1)%weapons.length;this.input.tap(weapons[this.weaponIndex])});
    const bt=this.el("btnBulletTime");
    if(bt){
      bt.addEventListener("touchstart",e=>{e.preventDefault();this.input.holdStart("KeyQ");bt.classList.add("active")},{passive:false});
      const release=()=>{this.input.holdEnd("KeyQ");bt.classList.remove("active")};
      bt.addEventListener("touchend",release);bt.addEventListener("touchcancel",release);
    }
  }
}
