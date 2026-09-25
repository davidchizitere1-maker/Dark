import {STORY_SCRIPT} from "../data/levels.js";

// A more cinematic canvas intro: burning-skyline parallax backdrop, slow
// Ken-Burns camera push per scene, hard cut-to-black transitions between
// scenes, screen shake on impacts, and synced Web Audio stingers.
export class StoryCutscene{
  constructor(canvas,audio){
    this.canvas=canvas;this.ctx=canvas.getContext("2d");this.audio=audio;this.running=false;
    this.embers=[];for(let i=0;i<90;i++)this.embers.push({x:Math.random(),y:Math.random(),s:1+Math.random()*2.6,v:10+Math.random()*26,drift:(Math.random()-.5)*14,ph:Math.random()*10});
    this.skyline=this.buildSkyline();
    this.shake=0;
  }
  buildSkyline(){
    const mk=(n,seedStep,hMin,hMax)=>{const arr=[];let seed=seedStep;for(let i=0;i<n;i++){seed=(seed*9301+49297)%233280;const h=hMin+(seed/233280)*(hMax-hMin);arr.push(h)}return arr};
    return {back:mk(22,13,.14,.34),front:mk(15,71,.22,.5)};
  }
  play(onDone,onCaption){
    this.running=true;this.onDone=onDone;this.onCaption=onCaption;this.script=STORY_SCRIPT;this.stepIndex=0;this.stepT=0;this.fadeIn=1;
    this.audio?.unlock();this.audio?.ambienceStart();this.fireCue(this.script[0]);
    if(this.onCaption)this.onCaption(this.script[0].text,0,this.script.length);
    this.last=performance.now();requestAnimationFrame(t=>this.loop(t));
  }
  fireCue(step){
    const a=this.audio;if(!a)return;
    const map={twins:()=>a.riser(),betrayal:()=>{a.stinger();this.shake=1}, fall:()=>{a.noiseBurst(.4,.5,700);this.shake=.6},
      rise:()=>a.riser(), generals:()=>{a.emberCrackle();setTimeout(()=>a.emberCrackle(),180);setTimeout(()=>a.emberCrackle(),360);setTimeout(()=>a.emberCrackle(),540)},
      walk:()=>{this.footstepTimer=0}, title:()=>{a.titleHit();this.shake=1}};
    map[step.cue]?.();
  }
  advance(){
    this.stepIndex++;this.stepT=0;this.fadeIn=1;
    if(this.stepIndex>=this.script.length){this.finish();return}
    const step=this.script[this.stepIndex];this.fireCue(step);
    if(this.onCaption)this.onCaption(step.text,this.stepIndex,this.script.length);
  }
  finish(){if(!this.running)return;this.running=false;this.audio?.ambienceStop();this.onDone?.()}
  skipAll(){this.finish()}
  loop(now){
    if(!this.running)return;const dt=Math.min(.05,(now-this.last)/1000||.016);this.last=now;
    this.stepT+=dt;this.fadeIn=Math.max(0,this.fadeIn-dt*2.2);this.shake=Math.max(0,this.shake-dt*2.4);
    const cur=this.script[this.stepIndex];
    if(cur&&this.stepT>=cur.t)this.advance();
    this.draw(cur?.cue||"twins",this.stepT,dt);
    if(this.running)requestAnimationFrame(t=>this.loop(t));
  }
  stick(c,x,y,scale,color,pose,alpha=1,bob=0){
    c.save();c.translate(x,y+Math.sin(bob)*3);c.scale(scale,scale);c.globalAlpha=alpha;c.strokeStyle=color;c.fillStyle=color;c.lineWidth=6;c.lineCap="round";c.lineJoin="round";
    c.beginPath();c.arc(0,-64,14,0,Math.PI*2);c.fill();
    c.beginPath();c.moveTo(0,-50);c.lineTo(0,10);c.stroke();
    if(pose==="fallen")c.rotate(1.3);
    if(pose==="walk"){const wsw=Math.sin(bob*4);c.beginPath();c.moveTo(0,10);c.lineTo(-14+wsw*14,52);c.stroke();c.beginPath();c.moveTo(0,10);c.lineTo(14-wsw*14,52);c.stroke()}
    else{c.beginPath();c.moveTo(0,10);c.lineTo(-16,52);c.stroke();c.beginPath();c.moveTo(0,10);c.lineTo(16,52);c.stroke()}
    const armA=pose==="fire"?-2.4:pose==="reach"?-1.9:-0.7,armB=pose==="fire"?-0.4:0.6;
    c.beginPath();c.moveTo(0,-38);c.lineTo(Math.cos(armA)*30,-38+Math.sin(armA)*30);c.stroke();
    c.beginPath();c.moveTo(0,-38);c.lineTo(Math.cos(armB)*30,-38+Math.sin(armB)*30);c.stroke();
    if(pose==="fire"){c.fillStyle="#ff7a3d";c.beginPath();c.arc(Math.cos(armA)*34,-38+Math.sin(armA)*34,10,0,Math.PI*2);c.fill();c.globalAlpha=alpha*.5;c.beginPath();c.arc(Math.cos(armA)*34,-38+Math.sin(armA)*34,20,0,Math.PI*2);c.fill()}
    c.restore();
  }
  drawSkyline(c,w,h,groundY,layer,parallax,tint,alpha){
    c.save();c.globalAlpha=alpha;c.fillStyle=tint;
    const n=layer.length,bw=w/(n-2);
    c.beginPath();c.moveTo(-bw,groundY);
    for(let i=0;i<n;i++){const x=-bw+i*bw+Math.sin(performance.now()*.00003+i)*parallax;const bh=layer[i]*h;c.lineTo(x,groundY-bh);c.lineTo(x+bw*.6,groundY-bh)}
    c.lineTo(w+bw,groundY);c.closePath();c.fill();c.restore();
  }
  draw(cue,t,dt){
    const dpr=Math.min(2,window.devicePixelRatio||1);
    const c=this.ctx,w=this.canvas.width/dpr,h=this.canvas.height/dpr;
    c.setTransform(dpr,0,0,dpr,0,0);
    const shakeX=(Math.random()-.5)*this.shake*14,shakeY=(Math.random()-.5)*this.shake*10;
    c.save();c.translate(shakeX,shakeY);
    const zoom=1+Math.min(.06,t*.012);
    c.translate(w/2,h/2);c.scale(zoom,zoom);c.translate(-w/2,-h/2);

    const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,"#04060a");g.addColorStop(.55,"#0b0f17");g.addColorStop(1,cue==="betrayal"||cue==="title"?"#231009":"#1a0e0c");c.fillStyle=g;c.fillRect(0,0,w,h);
    const groundY=h*.74;
    this.drawSkyline(c,w,h,groundY,this.skyline.back,3,"#0d1119",.9);
    this.drawSkyline(c,w,h,groundY,this.skyline.front,6,"#050708",1);
    const glowAlpha=(cue==="betrayal"||cue==="generals"||cue==="title")?.5:.22;
    const hg=c.createLinearGradient(0,groundY-40,0,groundY+10);hg.addColorStop(0,"rgba(255,90,40,0)");hg.addColorStop(1,`rgba(255,90,40,${glowAlpha})`);c.fillStyle=hg;c.fillRect(0,groundY-40,w,50);

    for(const e of this.embers){e.y-=e.v*dt/h;e.x+=Math.sin(e.ph+performance.now()*.0005)*dt*.01;if(e.y<-.05)e.y=1.05;c.globalAlpha=.55;c.fillStyle="#ff8a4d";c.beginPath();c.arc(e.x*w,e.y*h,e.s,0,Math.PI*2);c.fill()}
    c.globalAlpha=1;
    c.strokeStyle="rgba(255,255,255,.05)";c.beginPath();c.moveTo(0,groundY);c.lineTo(w,groundY);c.stroke();

    const cx=w/2,ease=Math.min(1,t/0.6),bob=performance.now()*.003;
    if(cue==="twins"){this.stick(c,cx-70,groundY,2.2,"#d9ff4a","idle",ease,bob);this.stick(c,cx+70,groundY,2.2,"#ff5f66","idle",ease,bob+1)}
    else if(cue==="betrayal"){this.stick(c,cx-70,groundY,2.2,"#d9ff4a","reach",1,bob);this.stick(c,cx+70,groundY,2.2,"#ff5f66","fire",1,bob);c.globalAlpha=Math.min(.55,t*.7);c.fillStyle="#ff3e2e";c.beginPath();c.arc(cx+30,groundY-140,100*ease,0,Math.PI*2);c.fill();c.globalAlpha=1}
    else if(cue==="fall"){this.stick(c,cx-40,groundY,2.2,"#d9ff4a","fallen",1);this.stick(c,cx+90,groundY-6,2.2,"#ff5f66","idle",1,bob)}
    else if(cue==="rise"){const rise=Math.min(1,t/1.6);this.stick(c,cx,groundY+30*(1-rise),2.2+rise*.2,"#d9ff4a","reach",1,bob)}
    else if(cue==="generals"){const names=["CINDER","ASHEN","MOLTEN","WILDFIRE"],cols=["#ff7a3d","#ff5b7a","#ff4d2e","#ffe14a"];names.forEach((n,i)=>{const x=w*(.2+i*.2);this.stick(c,x,groundY,1.5,cols[i],"fire",ease,bob+i);c.globalAlpha=ease;c.fillStyle=cols[i];c.font="700 13px Inter,system-ui";c.textAlign="center";c.fillText(n,x,groundY+70);c.globalAlpha=1})}
    else if(cue==="walk"){if(this.footstepTimer!==undefined){this.footstepTimer-=dt;if(this.footstepTimer<=0){this.audio?.footstep();this.footstepTimer=.32}}const wx=cx-140+Math.min(1,t/2.2)*280;this.stick(c,wx,groundY,2.2,"#d9ff4a","walk",1,bob*3)}
    else if(cue==="title"){c.globalAlpha=Math.min(1,t*.9);c.textAlign="center";c.fillStyle="#f4f6fa";c.font="800 52px Inter,system-ui";c.fillText("ZERO: EXTRACTION",cx,h*.42);c.fillStyle="#ff5f66";c.font="700 16px Inter,system-ui";c.fillText("REVENGE HAS A NAME",cx,h*.42+34);c.globalAlpha=1}

    const vg=c.createRadialGradient(cx,h*.5,h*.2,cx,h*.5,h*.85);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.55)");c.fillStyle=vg;c.fillRect(0,0,w,h);
    const bar=h*.07;c.fillStyle="#000";c.fillRect(0,0,w,bar);c.fillRect(0,h-bar,w,bar);
    c.restore();
    if(this.fadeIn>0){c.fillStyle=`rgba(0,0,0,${this.fadeIn})`;c.fillRect(0,0,w,h)}
  }
}
