import {STORY_SCRIPT} from "../data/levels.js";

// Lightweight canvas cinematic: silhouettes + embers + captions.
// Runs its own rAF loop independent of the game loop, then hands control back.
export class StoryCutscene{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext("2d");this.running=false;this.embers=[];for(let i=0;i<70;i++)this.embers.push({x:Math.random(),y:Math.random(),s:1+Math.random()*2.4,v:8+Math.random()*22,drift:(Math.random()-.5)*10,ph:Math.random()*10})}
  play(onDone,onCaption){
    this.running=true;this.onDone=onDone;this.onCaption=onCaption;this.script=STORY_SCRIPT;this.stepIndex=0;this.stepT=0;this.skip=false;this.t0=performance.now();
    if(this.onCaption)this.onCaption(this.script[0].text,0,this.script.length);
    this.last=performance.now();requestAnimationFrame(t=>this.loop(t));
  }
  advance(){this.stepIndex++;this.stepT=0;if(this.stepIndex>=this.script.length){this.finish();return}if(this.onCaption)this.onCaption(this.script[this.stepIndex].text,this.stepIndex,this.script.length)}
  finish(){if(!this.running)return;this.running=false;this.onDone?.()}
  skipAll(){this.finish()}
  loop(now){
    if(!this.running)return;const dt=Math.min(.05,(now-this.last)/1000||.016);this.last=now;
    this.stepT+=dt;const cur=this.script[this.stepIndex];
    if(cur&&this.stepT>=cur.t)this.advance();
    this.draw(cur?.cue||"twins",this.stepT,dt);
    if(this.running)requestAnimationFrame(t=>this.loop(t));
  }
  stick(c,x,y,scale,color,pose,alpha=1){
    c.save();c.translate(x,y);c.scale(scale,scale);c.globalAlpha=alpha;c.strokeStyle=color;c.fillStyle=color;c.lineWidth=6;c.lineCap="round";c.lineJoin="round";
    c.beginPath();c.arc(0,-64,14,0,Math.PI*2);c.fill();
    c.beginPath();c.moveTo(0,-50);c.lineTo(0,10);c.stroke();
    if(pose==="fallen"){c.rotate(1.3)}
    const armA=pose==="fire"?-2.4:pose==="reach"?-1.9:-0.7,armB=pose==="fire"?-0.4:0.6;
    c.beginPath();c.moveTo(0,-38);c.lineTo(Math.cos(armA)*30,-38+Math.sin(armA)*30);c.stroke();
    c.beginPath();c.moveTo(0,-38);c.lineTo(Math.cos(armB)*30,-38+Math.sin(armB)*30);c.stroke();
    c.beginPath();c.moveTo(0,10);c.lineTo(-16,52);c.stroke();
    c.beginPath();c.moveTo(0,10);c.lineTo(16,52);c.stroke();
    if(pose==="fire"){c.fillStyle="#ff7a3d";c.beginPath();c.arc(Math.cos(armA)*34,-38+Math.sin(armA)*34,10,0,Math.PI*2);c.fill()}
    c.restore();
  }
  draw(cue,t,dt){
    const dpr=Math.min(2,window.devicePixelRatio||1);
    const c=this.ctx,w=this.canvas.width/dpr,h=this.canvas.height/dpr;
    c.setTransform(dpr,0,0,dpr,0,0);
    const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,"#05070a");g.addColorStop(.6,"#0c0f16");g.addColorStop(1,"#1a0e0c");c.fillStyle=g;c.fillRect(0,0,w,h);
    // embers
    for(const e of this.embers){e.y-=e.v*dt/h;e.x+=Math.sin(e.ph+performance.now()*.0005)*dt*.01;if(e.y<-.05)e.y=1.05;c.globalAlpha=.5;c.fillStyle="#ff8a4d";c.beginPath();c.arc(e.x*w,e.y*h,e.s,0,Math.PI*2);c.fill()}
    c.globalAlpha=1;
    const cx=w/2,groundY=h*.72;c.strokeStyle="rgba(255,255,255,.05)";c.beginPath();c.moveTo(0,groundY);c.lineTo(w,groundY);c.stroke();
    const ease=Math.min(1,t/0.6);
    if(cue==="twins"){this.stick(c,cx-70,groundY,2.2,"#d9ff4a","idle",ease);this.stick(c,cx+70,groundY,2.2,"#ff5f66","idle",ease)}
    else if(cue==="betrayal"){this.stick(c,cx-70,groundY,2.2,"#d9ff4a","reach",1);this.stick(c,cx+70,groundY,2.2,"#ff5f66","fire",1);c.globalAlpha=Math.min(.5,t*.6);c.fillStyle="#ff3e2e";c.beginPath();c.arc(cx+30,groundY-140,90*ease,0,Math.PI*2);c.fill();c.globalAlpha=1}
    else if(cue==="fall"){this.stick(c,cx-40,groundY,2.2,"#d9ff4a","fallen",1);this.stick(c,cx+90,groundY-6,2.2,"#ff5f66","idle",1)}
    else if(cue==="rise"){const rise=Math.min(1,t/1.6);this.stick(c,cx,groundY+30*(1-rise),2.2+rise*.2,"#d9ff4a","reach",1)}
    else if(cue==="generals"){const names=["CINDER","ASHEN","MOLTEN","WILDFIRE"],cols=["#ff7a3d","#ff5b7a","#ff4d2e","#ffe14a"];names.forEach((n,i)=>{const x=w*(.2+i*.2);this.stick(c,x,groundY,1.5,cols[i],"fire",ease);c.globalAlpha=ease;c.fillStyle=cols[i];c.font="700 13px Inter,system-ui";c.textAlign="center";c.fillText(n,x,groundY+70);c.globalAlpha=1})}
    else if(cue==="walk"){const wx=cx-120+Math.min(1,t/2.2)*240;this.stick(c,wx,groundY,2.2,"#d9ff4a","idle",1)}
    else if(cue==="title"){c.globalAlpha=Math.min(1,t*.9);c.textAlign="center";c.fillStyle="#f4f6fa";c.font="800 clamp(30px,7vw,64px) Inter,system-ui";c.font="800 52px Inter,system-ui";c.fillText("ZERO: EXTRACTION",cx,h*.42);c.fillStyle="#ff5f66";c.font="700 16px Inter,system-ui";c.fillText("REVENGE HAS A NAME",cx,h*.42+34);c.globalAlpha=1}
    // vignette
    const vg=c.createRadialGradient(cx,h*.5,h*.2,cx,h*.5,h*.85);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.55)");c.fillStyle=vg;c.fillRect(0,0,w,h);
  }
}
