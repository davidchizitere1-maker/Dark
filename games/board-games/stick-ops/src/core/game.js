import {GameState} from "./state.js";
import {Fighter} from "../entities/fighter.js";
import {Physics} from "../systems/physics.js";
import {WeaponSystem} from "../systems/weapons.js";
import {CombatSystem} from "../systems/combat.js";
import {AISystem} from "../systems/ai.js";
import {SpawnSystem} from "../systems/spawn.js";
import {EffectsSystem} from "../systems/effects.js";

export class Game{
  constructor({config,input,renderer,ui,audio}){this.config=config;this.input=input;this.renderer=renderer;this.ui=ui;this.audio=audio;this.state=new GameState(config);this.effects=new EffectsSystem(this.state,config);this.physics=new Physics(config);this.weapons=new WeaponSystem(config,audio);this.combat=new CombatSystem(config,audio,this.effects);this.ai=new AISystem(config,this.weapons,this.effects);this.spawn=new SpawnSystem(config);this.last=0}
  init(){this.ui.bind({onStart:()=>this.start(),onResume:()=>this.resume(),onRestart:()=>this.start()});window.addEventListener("keydown",e=>{if(e.code==="KeyP"||e.code==="Escape"){if(this.state.status==="playing")this.pause();else if(this.state.status==="paused")this.resume()}});requestAnimationFrame(t=>this.loop(t))}
  start(){this.audio?.unlock();const p=new Fighter({x:this.config.arena.width*.5,y:this.config.arena.groundY-40,color:this.config.colors.accent,config:this.config});this.state.start(p);this.state.message="CLEAR THE WAVE";this.ui.setStartVisible(false);this.ui.setResultVisible(false);this.ui.setPauseVisible(false);this.spawn.spawnWave(this.state);this.last=performance.now()}
  pause(){this.state.pause();this.ui.setPauseVisible(true)}
  resume(){this.state.resume();this.ui.setPauseVisible(false);this.last=performance.now()}
  setAim(p){const aim=this.renderer.screenToWorld(this.input.mouse.x,this.input.mouse.y);p.aimAngle=Math.atan2(aim.y-(p.y-22),aim.x-p.x);p.targetX=aim.x;p.targetY=aim.y;p.facing=aim.x>=p.x?1:-1;return aim}
  handlePlayer(dt,scale){const s=this.state,p=s.player;if(!p)return;const move=this.input.axisX();this.setAim(p);p.walkCycle+=Math.abs(p.vx)*dt*.02;
    if(p.reloadTimer>0){p.reloadTimer=Math.max(0,p.reloadTimer-dt);if(p.reloadTimer===0)this.weapons.finishReload(p)}
    if(p.hitStagger<=0){p.vx+=move*p.config.player.speed*dt*7;if(move)p.facing=move;if(this.input.consume("Space")&&p.stamina>=p.config.player.dodgeCost&&p.dashCooldown<=0){p.stamina-=p.config.player.dodgeCost;p.vx=p.facing*p.config.player.dodgeSpeed;p.invulnerable=.28;p.dodgeTimer=.28;p.action="dodge";this.audio?.dodge();this.effects.burst(p.x,p.y,"#aab6c4",7,120)}if(this.input.consume("KeyW")&&p.grounded)p.vy=-p.config.player.jump}
    if(this.input.consume("Digit1"))this.weapons.switch(p,"pistol");if(this.input.consume("Digit2"))this.weapons.switch(p,"smg");if(this.input.consume("Digit3"))this.weapons.switch(p,"rifle");if(this.input.consume("Digit4"))this.weapons.switch(p,"shotgun");if(this.input.consume("Digit5"))this.weapons.switch(p,"sniper");if(this.input.consume("Digit6"))this.weapons.switch(p,"lmg");
    if(this.input.consume("KeyR"))this.weapons.reload(p);if(this.input.consume("KeyF"))this.combat.melee(p,s.enemies,s);if(this.input.consume("KeyE"))this.combat.execute(p,s.enemies,s);
    if(this.input.mouse.down)this.weapons.shoot(p,p.targetX,p.targetY,s.projectiles,this.effects);if(p.magazine===0&&p.reserve>0&&p.reloadTimer===0)this.weapons.reload(p);
    this.physics.update(p,dt*scale);
  }
  update(dt){const s=this.state,p=s.player;s.time+=dt;p.updateTimers(dt);
    if(s.hitStop>0){s.hitStop=Math.max(0,s.hitStop-dt);this.effects.update(dt*.35);return}
    const bulletTime=this.input.down("KeyQ")&&p.bulletTime>0;const scale=bulletTime?.34:1;p.bulletTime=bulletTime?Math.max(0,p.bulletTime-this.config.player.bulletTimeDrain*dt):Math.min(this.config.player.bulletTimeMax,p.bulletTime+this.config.player.bulletTimeRecharge*dt);
    this.handlePlayer(dt,scale);
    for(const e of s.enemies){e.updateTimers(dt);if(e.dead){e.deathTimer=Math.max(0,e.deathTimer-dt*scale);e.vx*=.92;this.physics.update(e,dt*scale);continue}this.ai.update(e,p,s,dt*scale);this.physics.update(e,dt*scale)}
    for(const b of s.projectiles){b.update(dt,scale);const targets=b.owner==="player"?s.enemies:[p];for(const t of targets){if(t.dead||b.dead)continue;const hit=Math.hypot(b.x-t.x,b.y-t.y)<t.radius+b.radius;if(hit)this.combat.handleProjectileHit(s,b,t)}if(b.x<-40||b.x>this.config.arena.width+40||b.y<-100||b.y>this.config.arena.height+100)b.dead=true}
    s.projectiles=s.projectiles.filter(x=>!x.dead);s.enemies=s.enemies.filter(e=>!e.dead||e.deathTimer>0);
    if(p.dead&&p.deathTimer>0)p.deathTimer=Math.max(0,p.deathTimer-dt);
    if(s.comboTimer>0){s.comboTimer-=dt;if(s.comboTimer<=0)s.combo=0}
    if(!s.enemies.length&&!p.dead){s.waveTimer+=dt;if(s.waveTimer>=this.config.waves.restTime){if(s.wave>=this.config.waves.maxWaves){s.end("won");this.ui.setResultVisible(true,{win:true,score:s.score,wave:s.wave,kills:s.kills,combo:s.bestCombo});return}s.wave++;s.waveTimer=0;s.message=`WAVE ${String(s.wave).padStart(2,"0")} INBOUND`;this.spawn.spawnWave(s)}}
    if(p.dead&&p.deathTimer<=0){s.end("lost");this.ui.setResultVisible(true,{win:false,score:s.score,wave:s.wave,kills:s.kills,combo:s.bestCombo})}
    this.effects.update(dt);for(const d of s.damageIndicators)d.life-=dt;s.damageIndicators=s.damageIndicators.filter(d=>d.life>0);s.shake=Math.max(0,s.shake-dt*this.config.camera.shakeDecay);
  }
  loop(now){const dt=Math.min(.035,Math.max(.001,(now-this.last)/1000||.016));this.last=now;if(this.state.status==="playing")this.update(dt);this.renderer.draw(this.state,this.input);this.ui.update(this.state);this.input.endFrame();requestAnimationFrame(t=>this.loop(t))}
}
