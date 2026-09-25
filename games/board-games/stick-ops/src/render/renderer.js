export class Renderer{
  constructor(canvas,config){this.canvas=canvas;this.ctx=canvas.getContext("2d");this.config=config;this.camera={x:0,y:0,zoom:1};this.dpr=1;this.resize();window.addEventListener("resize",()=>this.resize())}
  resize(){const dpr=Math.min(2,window.devicePixelRatio||1),r=this.canvas.getBoundingClientRect();this.canvas.width=Math.max(1,Math.floor(r.width*dpr));this.canvas.height=Math.max(1,Math.floor(r.height*dpr));this.dpr=dpr}
  viewport(){return{w:this.canvas.width/this.dpr,h:this.canvas.height/this.dpr}}
  screenToWorld(x,y){const {w,h}=this.viewport(),z=this.camera.zoom;return{x:(x/this.dpr-w/2)/z+this.camera.x+w/2,y:(y/this.dpr-h/2)/z+this.camera.y+h/2}}
  clampCamera(player){const {w,h}=this.viewport(),z=this.camera.zoom,a=this.config.arena,vw=w/z,vh=h/z,targetX=Math.max(vw*.5,Math.min(a.width-vw*.5,player?player.x+this.config.camera.lookAhead*(player?.facing||1):a.width*.5));const desiredY=Math.max(vh*.5,Math.min(a.height-vh*.5,player?player.y-vh*.03:a.height*.5));this.camera.x+=(targetX-this.camera.x)*Math.min(1,.13);this.camera.y+=(desiredY-this.camera.y)*Math.min(1,.13)}
  gradient(c,x0,y0,x1,y1,stops){const g=c.createLinearGradient(x0,y0,x1,y1);stops.forEach(([p,col])=>g.addColorStop(p,col));return g}
  drawBackground(c,w,h,cam,tint){
    const sky=this.gradient(c,0,0,0,h,[[0,"#06090e"],[.42,"#0d141f"],[1,"#151c26"]]);c.fillStyle=sky;c.fillRect(0,0,w,h);
    if(tint){c.save();c.globalAlpha=.09;c.fillStyle=tint;c.fillRect(0,0,w,h);c.restore()}
    c.save();c.translate(-cam.x*.13,-cam.y*.04);
    for(let i=-2;i<26;i++){const x=i*170,hh=160+((i*47)%120+120)%120;c.fillStyle=i%3===0?"#111925":"#0d141e";c.fillRect(x,210-hh,120,hh);c.fillStyle="rgba(150,185,215,.08)";for(let wy=235-hh;wy<210;wy+=32)for(let wx=x+18;wx<x+105;wx+=28)if((wx+wy)%3!==0)c.fillRect(wx,wy,8,12)}
    c.restore();
    c.save();c.translate(-cam.x*.28,-cam.y*.08);c.strokeStyle="rgba(128,163,197,.12)";c.lineWidth=4;for(let i=0;i<8;i++){const x=180+i*510;c.beginPath();c.moveTo(x,560);c.lineTo(x,250);c.lineTo(x+250,250);c.moveTo(x+30,320);c.lineTo(x+220,500);c.stroke()}c.restore();
    c.save();c.translate(-cam.x*.48,-cam.y*.15);c.fillStyle="#121923";for(let i=0;i<16;i++){const x=i*240;c.fillRect(x,500-(i%4)*35,140,610)}c.fillStyle="rgba(214,226,239,.08)";for(let i=0;i<52;i++){const x=(i*233)%3900,y=540-((i*67)%180);c.fillRect(x,y,10,26)}c.restore();
    c.save();c.translate(-cam.x*.72,-cam.y*.22);c.strokeStyle="rgba(187,206,226,.13)";c.lineWidth=3;for(let x=50;x<this.config.arena.width;x+=600){c.beginPath();c.moveTo(x,980);c.lineTo(x,450);c.lineTo(x+300,450);c.moveTo(x+30,550);c.lineTo(x+265,840);c.stroke()}c.restore();
  }
  drawWorld(c,h,cam,s,zoom=1){
    const a=this.config.arena;c.save();c.translate(this.viewport().w/2,this.viewport().h/2);c.scale(zoom,zoom);c.translate(-cam.x,-cam.y);
    const groundY=a.groundY;c.fillStyle="#10161f";c.fillRect(0,groundY-210,a.width,210);c.fillStyle="#1a212b";c.fillRect(0,groundY,a.width,a.height-groundY);
    // lane strips and wall seams
    c.strokeStyle="rgba(208,218,230,.07)";c.lineWidth=2;for(let x=0;x<a.width;x+=150){c.beginPath();c.moveTo(x,groundY);c.lineTo(x,groundY+390);c.stroke()}c.fillStyle="rgba(217,255,74,.18)";for(let x=80;x<a.width;x+=520)c.fillRect(x,groundY+58,260,4);
    // building slabs
    for(let x=0;x<a.width;x+=340){c.fillStyle=x%680===0?"#242d38":"#202832";c.fillRect(x,groundY-150,22,150);c.fillStyle="#2e3844";c.fillRect(x+20,groundY-8,300,8)}
    // lamps
    for(let x=220;x<a.width;x+=720){c.strokeStyle="#3a444f";c.lineWidth=8;c.beginPath();c.moveTo(x,groundY);c.lineTo(x,groundY-270);c.lineTo(x+65,groundY-270);c.stroke();c.fillStyle="rgba(217,255,74,.2)";c.beginPath();c.arc(x+65,groundY-264,18,0,Math.PI*2);c.fill();c.fillStyle="#d8d5a4";c.fillRect(x+52,groundY-273,26,8)}
    this.drawCars(c,groundY);
    this.drawCrates(c,groundY);
    // foreground barriers
    for(let x=360;x<a.width;x+=940){c.fillStyle="#11161d";c.fillRect(x,groundY-80,95,80);c.fillStyle="#c8a847";c.globalAlpha=.35;c.fillRect(x+8,groundY-70,78,10);c.fillRect(x+8,groundY-28,78,10);c.globalAlpha=1}
    // decals (blood pools + fire-power scorch patches left by generals)
    for(const d of s.decals){
      if(d.fire){c.globalAlpha=Math.min(.75,d.life/5);const gg=c.createRadialGradient(d.x,d.y,0,d.x,d.y,d.size);gg.addColorStop(0,d.color||"#ff7a3d");gg.addColorStop(1,"rgba(255,90,40,0)");c.fillStyle=gg;c.beginPath();c.arc(d.x,d.y,d.size,0,Math.PI*2);c.fill();continue}
      c.globalAlpha=Math.min(1,d.life/2);c.fillStyle=this.config.colors.blood;c.beginPath();c.arc(d.x,d.y,d.size*(1.2-d.life/15),0,Math.PI*2);c.fill();
    }
    c.globalAlpha=1;
    c.restore();
  }
  drawCars(c,groundY){for(let i=0;i<6;i++){const x=460+i*570,w=190,h=54;c.fillStyle="#121820";c.beginPath();c.roundRect(x,groundY-h,w,h,10);c.fill();c.fillStyle="#0a0d12";c.beginPath();c.moveTo(x+42,groundY-h);c.lineTo(x+77,groundY-h-32);c.lineTo(x+142,groundY-h-32);c.lineTo(x+160,groundY-h);c.closePath();c.fill();c.fillStyle="#05070b";for(const wx of [x+38,x+w-38]){c.beginPath();c.arc(wx,groundY,18,0,Math.PI*2);c.fill()}c.fillStyle="#6c7a8c";c.globalAlpha=.16;c.fillRect(x+83,groundY-h+10,65,18);c.globalAlpha=1}}
  drawCrates(c,groundY){for(let i=0;i<15;i++){const x=110+(i*263)%3000,y=groundY-32-(i%3)*34;c.fillStyle=i%2?"#5d4b3c":"#4d4d50";c.fillRect(x,y,58,32);c.strokeStyle="rgba(240,214,166,.23)";c.lineWidth=2;c.strokeRect(x+3,y+3,52,26);c.beginPath();c.moveTo(x+4,y+4);c.lineTo(x+54,y+26);c.moveTo(x+54,y+4);c.lineTo(x+4,y+26);c.stroke()}}
  drawFighter(c,f,isPlayer=false){
    const cfg=this.config,scale=f.enemy?(cfg.enemyClasses[f.type]?.scale||1):1;const walk=Math.sin(f.walkCycle*1.25);const speed=Math.min(1,Math.abs(f.vx)/320);const dead=f.dead;const flip=f.facing<0?-1:1;
    const fireColor=f.bossMeta?.color||(f.firePower?cfg.firePowers[f.firePower]?.color:null);
    c.save();c.translate(f.x,f.y);
    // fire-power aura for generals / flame-touched enemies — reads as graphic
    // flourish, not just a plain stick silhouette
    if(fireColor&&!dead){c.save();c.globalAlpha=.28+Math.sin(performance.now()*.008+f.x)*.08;const rg=c.createRadialGradient(0,-20,4,0,-20,f.type==="boss"?70:34);rg.addColorStop(0,fireColor);rg.addColorStop(1,"rgba(255,90,40,0)");c.fillStyle=rg;c.beginPath();c.arc(0,-20,f.type==="boss"?70:34,0,Math.PI*2);c.fill();c.restore()}
    c.scale(flip*scale,scale);c.lineCap="round";c.lineJoin="round";const hurt=f.flash>0;const body=f.color;
    if(dead){c.rotate(f.deathAngle*(1-f.deathTimer));c.globalAlpha=Math.max(.1,f.deathTimer/1.0)}
    c.globalAlpha*=1;
    // shadow
    c.save();c.scale(1/scale,1/scale);c.globalAlpha=.22;c.fillStyle="#000";c.beginPath();c.ellipse(0,6,30+speed*8,7,0,0,Math.PI*2);c.fill();c.restore();
    // legs (two joints each: hip -> knee -> boot, drawn with visible knee joint)
    const stride=walk*9*speed,cBoot="#0b0e12",kneeA={x:-7,y:29},kneeB={x:7,y:29};
    c.strokeStyle=body;c.lineWidth=8;
    c.beginPath();c.moveTo(kneeA.x,kneeA.y);c.lineTo(-15+stride,61);c.lineTo(-23+stride,84);c.stroke();
    c.beginPath();c.moveTo(kneeB.x,kneeB.y);c.lineTo(15-stride,61);c.lineTo(25-stride,84);c.stroke();
    c.fillStyle=body;c.beginPath();c.arc(-15+stride,61,3.4,0,Math.PI*2);c.fill();c.beginPath();c.arc(15-stride,61,3.4,0,Math.PI*2);c.fill();
    c.fillStyle=cBoot;c.beginPath();c.roundRect(-31+stride,80,17,7,3);c.fill();c.beginPath();c.roundRect(17-stride,80,17,7,3);c.fill();
    // torso — Zero wears a long open jacket, enemies a tactical vest
    if(isPlayer){
      c.fillStyle="#11151b";c.beginPath();c.moveTo(-19,-17);c.lineTo(19,-17);c.lineTo(24,34+walk*3);c.lineTo(15,30);c.lineTo(-15,30);c.lineTo(-24,34-walk*3);c.closePath();c.fill();
      c.fillStyle=hurt?"#fff":body;c.beginPath();c.moveTo(-14,-15);c.lineTo(14,-15);c.lineTo(15,29);c.lineTo(-15,29);c.closePath();c.fill();
      c.strokeStyle="rgba(255,255,255,.14)";c.lineWidth=1.5;c.beginPath();c.moveTo(0,-15);c.lineTo(0,29);c.stroke();
    } else {
      c.fillStyle=hurt?"#fff":body;c.beginPath();c.moveTo(-17,-17);c.lineTo(17,-17);c.lineTo(19,30);c.lineTo(-19,30);c.closePath();c.fill();
    }
    c.fillStyle="#0c1118";c.fillRect(-12,-8,24,27);c.strokeStyle="rgba(255,255,255,.18)";c.lineWidth=2;c.strokeRect(-12,-8,24,27);c.fillStyle="rgba(255,255,255,.12)";c.fillRect(-8,-2,6,10);c.fillRect(2,-2,6,10);
    // head + helmet
    c.fillStyle="#141a22";c.beginPath();c.arc(0,-38,17,0,Math.PI*2);c.fill();c.strokeStyle=hurt?"#fff":body;c.lineWidth=4;c.stroke();c.fillStyle=body;c.beginPath();c.arc(1,-42,11,Math.PI,Math.PI*2);c.fill();c.fillStyle="#070a0e";c.beginPath();c.roundRect(-12,-39,25,7,3);c.fill();
    // shoulder + elbow joints then arms aim toward aimAngle
    const aa=f.aimAngle??(f.facing>0?0:Math.PI);const gunLen=f.enemy?(f.type==="heavy"?48:38):46;const gunBaseX=19,gunBaseY=-1;const elbowY=10+walk*2;const armColor=hurt?"#fff":body;
    c.strokeStyle=armColor;c.lineWidth=f.type==="heavy"?10:7;
    c.beginPath();c.moveTo(10,-5);c.lineTo(23,elbowY);c.lineTo(gunBaseX+Math.cos(aa)*16,gunBaseY+Math.sin(aa)*16);c.stroke();
    c.beginPath();c.moveTo(-9,-2);c.lineTo(-20,12+walk*2);c.lineTo(gunBaseX+Math.cos(aa)*8,gunBaseY+Math.sin(aa)*8);c.stroke();
    c.fillStyle=armColor;c.beginPath();c.arc(23,elbowY,3,0,Math.PI*2);c.fill();c.beginPath();c.arc(-20,12+walk*2,3,0,Math.PI*2);c.fill();
    // hands
    c.fillStyle="#d3d8dd";c.beginPath();c.arc(gunBaseX+Math.cos(aa)*14,gunBaseY+Math.sin(aa)*14,4,0,Math.PI*2);c.fill();
    // weapon
    const recoil=(f.recoil||0)*(f.action==="shoot"?1:0),gx=gunBaseX-recoil*3; c.save();c.translate(gx,gunBaseY);c.rotate(aa);c.fillStyle="#090c11";c.fillRect(0,-4,gunLen,8);c.fillStyle="#303b47";c.fillRect(8,-7,Math.max(10,gunLen-22),4);c.fillStyle="#141a21";c.fillRect(4,4,12,12);c.fillRect(gunLen-5,-6,12,4);c.restore();
    if(f.type==="boss"){c.strokeStyle=fireColor?fireColor:"rgba(255,62,86,.45)";c.globalAlpha=.5;c.lineWidth=3;c.beginPath();c.arc(0,-18,36,0,Math.PI*2);c.stroke();c.globalAlpha=1;}
    c.restore();
    // health / armor above head
    if(f.enemy&&!dead){const cls=cfg.enemyClasses[f.type];const bw=f.type==="boss"?150:50;const label=f.bossMeta?.name||cls.name;const barColor=f.bossMeta?.color||cls.color;
      c.fillStyle="rgba(0,0,0,.62)";c.fillRect(f.x-bw/2,f.y-102-(scale-1)*20,bw,7);c.fillStyle=barColor;c.fillRect(f.x-bw/2,f.y-102-(scale-1)*20,bw*Math.max(0,f.hp/f.maxHp),7);
      if(f.armor>0){c.fillStyle="#6b809b";c.fillRect(f.x-bw/2,f.y-111-(scale-1)*20,bw*Math.max(0,f.armor/f.maxArmor),4)}
      if(f.type==="boss"){c.fillStyle="#f3f5f8";c.font="700 11px Inter,system-ui";c.textAlign="center";c.fillText(label,f.x,f.y-116)}
    }
  }
  drawEffects(c,s,cam,zoom){c.save();c.translate(this.viewport().w/2,this.viewport().h/2);c.scale(zoom,zoom);c.translate(-cam.x,-cam.y);for(const t of s.tracers){c.globalAlpha=t.life/t.maxLife;c.strokeStyle=t.color;c.lineWidth=2+c.globalAlpha*2;c.beginPath();c.moveTo(t.x1,t.y1);c.lineTo(t.x2,t.y2);c.stroke()}c.globalAlpha=1;
    for(const p of s.particles){const a=Math.max(0,p.life/p.maxLife);c.globalAlpha=a;if(p.kind==="smoke"){c.fillStyle=p.color;c.beginPath();c.arc(p.x,p.y,p.size*(1+(1-a)*.9),0,Math.PI*2);c.fill()}else if(p.kind==="casing"){c.fillStyle=p.color;c.save();c.translate(p.x,p.y);c.rotate((1-a)*4);c.fillRect(-p.size*.5,-p.size*.15,p.size,p.size*.3);c.restore()}else if(p.kind==="arc"){c.strokeStyle=p.color;c.lineWidth=4*a;c.beginPath();c.arc(p.x,p.y,p.size,Math.PI*-.55+p.angle,Math.PI*.55+p.angle);c.stroke()}else{c.fillStyle=p.color;c.fillRect(p.x-p.size*.5,p.y-p.size*.5,p.size,p.size)}}c.globalAlpha=1;c.restore()}
  drawReticle(c,input,world,cam,zoom){const w=this.viewport().w,h=this.viewport().h,x=(world.x-cam.x)*zoom+w/2,y=(world.y-cam.y)*zoom+h/2;if(x<-40||y<-40||x>w+40||y>h+40)return;c.save();c.translate(x,y);c.strokeStyle="#d9ff4a";c.globalAlpha=.88;c.lineWidth=1.5;c.beginPath();c.arc(0,0,8,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(-15,0);c.lineTo(-6,0);c.moveTo(15,0);c.lineTo(6,0);c.moveTo(0,-15);c.lineTo(0,-6);c.moveTo(0,15);c.lineTo(0,6);c.stroke();c.fillStyle="#d9ff4a";c.fillRect(-1,-1,2,2);c.restore()}
  drawDamageIndicators(c,s){const {w,h}=this.viewport();if(!s.damageIndicators?.length)return;c.save();c.translate(w/2,h/2);for(const d of s.damageIndicators){const a=d.angle;const alpha=d.life/d.maxLife;c.globalAlpha=.35*alpha;c.strokeStyle=this.config.colors.danger;c.lineWidth=20;c.beginPath();c.arc(0,0,Math.min(w,h)*.43,a-.18,a+.18);c.stroke()}c.restore()}
  draw(s,input){
    const c=this.ctx,{w,h}=this.viewport();c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,w,h);const close=s.player?s.enemies.some(e=>!e.dead&&Math.hypot(e.x-s.player.x,e.y-s.player.y)<190):false;const targetZoom=s.hitStop>.02?1.1:(close?1.04:1);this.camera.zoom+=(targetZoom-this.camera.zoom)*.12;if(s.player)this.clampCamera(s.player);const shakeX=(Math.random()-.5)*s.shake*46,shakeY=(Math.random()-.5)*s.shake*30;const cam={x:this.camera.x-shakeX,y:this.camera.y-shakeY};
    this.drawBackground(c,w,h,cam,s.currentLevel?.zone?.tint);this.drawWorld(c,h,cam,s,this.camera.zoom);
    c.save();c.translate(w/2,h/2);c.scale(this.camera.zoom,this.camera.zoom);c.translate(-cam.x,-cam.y);for(const b of s.projectiles){c.fillStyle=b.color;c.shadowBlur=12;c.shadowColor=b.color;c.beginPath();c.arc(b.x,b.y,b.radius,0,Math.PI*2);c.fill();c.shadowBlur=0;const l=15+(Math.hypot(b.vx,b.vy)*.006);c.globalAlpha=.25;c.strokeStyle=b.color;c.lineWidth=2;c.beginPath();c.moveTo(b.x,b.y);c.lineTo(b.x-b.vx*0.008*l,b.y-b.vy*0.008*l);c.stroke();c.globalAlpha=1}
      const all=[...s.enemies].sort((a,b)=>a.y-b.y);for(const e of all)this.drawFighter(c,e,false);if(s.player)this.drawFighter(c,s.player,true);c.restore();
    this.drawEffects(c,s,cam,this.camera.zoom);this.drawDamageIndicators(c,s);
    if(s.player){const aim=input?this.screenToWorld(input.mouse.x,input.mouse.y):{x:s.player.x+200,y:s.player.y};this.drawReticle(c,input,aim,cam,this.camera.zoom)}
    if(s.hitStop>0){c.fillStyle="rgba(255,255,255,.035)";c.fillRect(0,0,w,h)}
  }
}
