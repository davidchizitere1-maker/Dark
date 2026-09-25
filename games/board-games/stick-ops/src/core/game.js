import {GameState} from "./state.js";
import {Fighter} from "../entities/fighter.js";
import {Physics} from "../systems/physics.js";
import {WeaponSystem} from "../systems/weapons.js";
import {CombatSystem} from "../systems/combat.js";
import {AISystem} from "../systems/ai.js";
import {SpawnSystem} from "../systems/spawn.js";
import {EffectsSystem} from "../systems/effects.js";
import {buildCampaign} from "../data/levels.js";
import {StoryCutscene} from "../render/cutscene.js";

const NODE_REST=1.1;

export class Game{
  constructor({config,input,renderer,ui,audio,canvas}){
    this.config=config;this.input=input;this.renderer=renderer;this.ui=ui;this.audio=audio;this.canvas=canvas;
    this.state=new GameState(config);this.effects=new EffectsSystem(this.state,config);this.physics=new Physics(config);
    this.weapons=new WeaponSystem(config,audio);this.combat=new CombatSystem(config,audio,this.effects);
    this.ai=new AISystem(config,this.weapons,this.effects);this.spawn=new SpawnSystem(config);
    this.campaign=buildCampaign();this.last=0;this.nodeTimer=0;
  }
  init(){
    this.ui.bind({
      onSelectStoryMode:()=>this.playStory(),
      onSelectCampaignMode:()=>{this.state.status="levelselect";this.ui.activeZone=Math.min(4,Math.floor((this.state.save.unlockedLevel-1)/10));this.ui.showLevelSelect(this.campaign,this.state.save.unlockedLevel)},
      onSelectEndlessMode:()=>this.startEndless(),
      onSelectLevel:lvl=>this.startCampaignLevel(lvl),
      onLevelBack:()=>this.toMenu(),
      onStorySkip:()=>this.cutscene?.skipAll(),
      onResume:()=>this.resume(),
      onPauseMenu:()=>this.toMenu(),
      onResultPrimary:()=>this.resultPrimary?.(),
      onResultSecondary:()=>this.resultSecondary?.(),
      onExit:()=>this.state.status==="playing"||this.state.status==="paused"?this.toMenu():history.back(),
    });
    window.addEventListener("keydown",e=>{
      if(e.code==="KeyP"||e.code==="Escape"){if(this.state.status==="playing")this.pause();else if(this.state.status==="paused")this.resume()}
    });
    this.toMenu();
    requestAnimationFrame(t=>this.loop(t));
  }
  toMenu(){this.state.status="menu";this.state.mode=null;this.ui.showModeSelect()}

  playStory(){
    this.state.status="story";this.ui.showStory();
    this.cutscene=new StoryCutscene(this.canvas);
    this.cutscene.play(()=>{this.state.markStorySeen();this.startCampaignLevel(1)},text=>this.ui.setStoryCaption(text));
  }

  spawnPlayer(x){return new Fighter({x,y:this.config.arena.groundY-40,color:this.config.colors.accent,config:this.config})}

  startCampaignLevel(levelNum){
    const level=this.campaign[levelNum-1];if(!level)return;
    this.audio?.unlock();const p=this.spawnPlayer(this.config.arena.width*.22);
    this.state.startCampaign(level);this.state.player=p;this.ui.hideAll();this.last=performance.now();
    this.beginNode();
  }
  beginNode(){
    const level=this.state.currentLevel,node=level.nodes[this.state.nodeIndex];
    // every minion in a zone carries a sliver of that zone general's stolen fire
    this.state.currentZoneFire=level.zone.boss.fire;
    this.spawn.spawnEncounter(this.state,node);this.nodeTimer=0;
  }
  startEndless(){
    this.audio?.unlock();const p=this.spawnPlayer(this.config.arena.width*.5);
    this.state.startEndless();this.state.player=p;this.ui.hideAll();this.last=performance.now();
    this.spawn.spawnFloor(this.state);
  }

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
  update(dt){
    const s=this.state,p=s.player;if(!p)return;s.time+=dt;p.updateTimers(dt);
    if(s.hitStop>0){s.hitStop=Math.max(0,s.hitStop-dt);this.effects.update(dt*.35);return}
    const bulletTime=this.input.down("KeyQ")&&p.bulletTime>0;const scale=bulletTime?.34:1;p.bulletTime=bulletTime?Math.max(0,p.bulletTime-this.config.player.bulletTimeDrain*dt):Math.min(this.config.player.bulletTimeMax,p.bulletTime+this.config.player.bulletTimeRecharge*dt);
    this.handlePlayer(dt,scale);
    this.spawn.tickSpawns(s,dt*scale);
    for(const e of s.enemies){
      e.updateTimers(dt);
      if(e.dead){e.deathTimer=Math.max(0,e.deathTimer-dt*scale);e.vx*=.92;this.physics.update(e,dt*scale);continue}
      this.ai.update(e,p,s,dt*scale);
      if(e.engaged)this.physics.update(e,dt*scale);else{e.y=this.config.arena.groundY-40;e.grounded=true}
    }
    for(const b of s.projectiles){b.update(dt,scale);const targets=b.owner==="player"?s.enemies:[p];for(const t of targets){if(t.dead||b.dead)continue;const hit=Math.hypot(b.x-t.x,b.y-t.y)<t.radius+b.radius;if(hit)this.combat.handleProjectileHit(s,b,t)}if(b.x<-40||b.x>this.config.arena.width+40||b.y<-100||b.y>this.config.arena.height+100)b.dead=true}
    s.projectiles=s.projectiles.filter(x=>!x.dead);s.enemies=s.enemies.filter(e=>!e.dead||e.deathTimer>0);
    if(p.dead&&p.deathTimer>0)p.deathTimer=Math.max(0,p.deathTimer-dt);
    if(s.comboTimer>0){s.comboTimer-=dt;if(s.comboTimer<=0)s.combo=0}

    const clear=!s.enemies.length&&!(s.pendingSpawns&&s.pendingSpawns.length)&&!p.dead;
    if(s.mode==="campaign"&&clear){
      this.nodeTimer+=dt;
      if(this.nodeTimer>=NODE_REST)this.advanceCampaign();
    } else if(s.mode==="endless"&&clear){
      s.floorTimer=(s.floorTimer||0)+dt;
      if(s.floorTimer>=this.config.endless.restTime){s.floor++;s.floorTimer=0;s.recordFloor(s.floor);this.spawn.spawnFloor(s)}
    }
    if(p.dead&&p.deathTimer<=0)this.onDefeat();

    this.effects.update(dt);for(const d of s.damageIndicators)d.life-=dt;s.damageIndicators=s.damageIndicators.filter(d=>d.life>0);s.shake=Math.max(0,s.shake-dt*this.config.camera.shakeDecay);
  }
  advanceCampaign(){
    const s=this.state,level=s.currentLevel;
    if(s.nodeIndex+1<level.nodes.length){s.nodeIndex++;this.beginNode();return}
    // level cleared
    s.unlockNext(level.level);
    const isFinal=level.level>=50;
    this.resultPrimary=()=>isFinal?this.toMenu():this.startCampaignLevel(level.level+1);
    this.resultSecondary=()=>{this.state.status="levelselect";this.ui.showLevelSelect(this.campaign,this.state.save.unlockedLevel)};
    s.end("won");
    this.ui.setResultVisible(true,{
      win:true,
      eyebrow:isFinal?"THE EXTRACTION IS RECLAIMED":(level.isBoss?"GENERAL DOWN":"MISSION COMPLETE"),
      title:isFinal?"ONE HAS FALLEN":level.name,
      text:isFinal?"Zero stands where his brother once stood. The Extraction is his again.":`${level.zone.short} secured. ${level.level<50?"Next deployment ready.":""}`,
      score:s.score,waveLabel:"LEVEL",waveValue:level.level,kills:s.kills,combo:s.bestCombo,
      primaryLabel:isFinal?"RETURN TO MENU":"NEXT LEVEL",
      secondaryLabel:isFinal?null:"LEVEL SELECT",
    });
  }
  onDefeat(){
    const s=this.state;s.end("lost");
    if(s.mode==="campaign"){
      const level=s.currentLevel;
      this.resultPrimary=()=>this.startCampaignLevel(level.level);
      this.resultSecondary=()=>{this.state.status="levelselect";this.ui.showLevelSelect(this.campaign,this.state.save.unlockedLevel)};
      this.ui.setResultVisible(true,{win:false,eyebrow:"MISSION FAILED",title:"OPERATOR DOWN",text:`${level.name} was not secured.`,score:s.score,waveLabel:"LEVEL",waveValue:level.level,kills:s.kills,combo:s.bestCombo,primaryLabel:"RETRY LEVEL",secondaryLabel:"LEVEL SELECT"});
    } else {
      this.resultPrimary=()=>this.startEndless();
      this.resultSecondary=()=>this.toMenu();
      this.ui.setResultVisible(true,{win:false,eyebrow:"THE RAVE ENDS",title:"OPERATOR DOWN",text:"Zero falls, but the Extraction remembers how far he got.",score:s.score,waveLabel:"FLOOR",waveValue:s.floor,kills:s.kills,combo:s.bestCombo,primaryLabel:"REDEPLOY",secondaryLabel:"MODE SELECT"});
    }
  }
  loop(now){
    const dt=Math.min(.035,Math.max(.001,(now-this.last)/1000||.016));this.last=now;
    if(this.state.status==="playing")this.update(dt);
    if(this.state.status==="playing"||this.state.status==="paused"||this.state.status==="won"||this.state.status==="lost"){
      this.renderer.draw(this.state,this.input);this.ui.update(this.state);this.input.endFrame();
    }
    requestAnimationFrame(t=>this.loop(t));
  }
}
