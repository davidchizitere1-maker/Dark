export class EffectsSystem{
  constructor(state,config){this.state=state;this.config=config}
  particle(x,y,vx,vy,life,color,size=3,gravity=0,kind="square"){this.state.particles.push({x,y,vx,vy,life,maxLife:life,color,size,gravity,kind})}
  burst(x,y,color,count=10,force=180){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=force*(.45+Math.random()*.9);this.particle(x,y,Math.cos(a)*s,Math.sin(a)*s,.35+Math.random()*.25,color,2+Math.random()*3,320)} }
  muzzle(x,y,a,id,color){const strength=id==="shotgun"?20:id==="sniper"?15:10;for(let i=0;i<6;i++){const spread=(Math.random()-.5)*.5;this.particle(x,y,Math.cos(a+spread)*(180+Math.random()*120),Math.sin(a+spread)*(180+Math.random()*120),.1+Math.random()*.08,color,3+Math.random()*4,0,"spark")}this.state.shake+=.045+strength*.001}
  casing(x,y,dir){this.particle(x,y,dir*(70+Math.random()*100),-40-Math.random()*80,.45,"#e0b86a",3,900,"casing")}
  tracer(x1,y1,x2,y2,color){this.state.tracers.push({x1,y1,x2,y2,color,life:.07,maxLife:.07})}
  impact(x,y,color,heavy=false){this.burst(x,y,color,heavy?16:9,heavy?260:180);for(let i=0;i<(heavy?3:1);i++)this.state.particles.push({x:x+(Math.random()-.5)*8,y:y+(Math.random()-.5)*8,vx:(Math.random()-.5)*30,vy:-30-Math.random()*30,life:.5,maxLife:.5,color:"#6f7884",size:8+Math.random()*12,gravity:-10,kind:"smoke"})}
  blood(x,y){this.burst(x,y,this.config.colors.blood,7,140);this.state.decals.push({x,y,life:12,size:3+Math.random()*4});if(this.state.decals.length>80)this.state.decals.shift()}
  meleeArc(x,y,a,color){this.state.particles.push({x,y,vx:Math.cos(a)*20,vy:Math.sin(a)*20,life:.18,maxLife:.18,color,size:28,gravity:0,kind:"arc",angle:a})}
  update(dt){
    for(const p of this.state.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.gravity*dt;p.vx*=Math.pow(.12,dt);p.life-=dt}
    this.state.particles=this.state.particles.filter(p=>p.life>0);
    for(const t of this.state.tracers)t.life-=dt;this.state.tracers=this.state.tracers.filter(t=>t.life>0);
    for(const c of this.state.casings){c.life-=dt}this.state.casings=this.state.casings.filter(c=>c.life>0);
    for(const d of this.state.decals)d.life-=dt;this.state.decals=this.state.decals.filter(d=>d.life>0);
  }
}
