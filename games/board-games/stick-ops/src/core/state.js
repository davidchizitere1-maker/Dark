export class GameState{
  constructor(config){this.config=config;this.reset()}
  reset(){
    this.status="ready";this.time=0;this.score=0;this.wave=1;this.kills=0;this.combo=0;this.bestCombo=0;this.comboTimer=0;
    this.enemies=[];this.projectiles=[];this.particles=[];this.tracers=[];this.casings=[];this.decals=[];this.waveTimer=0;this.hitStop=0;this.shake=0;
    this.player=null;this.damageIndicators=[];this.totalWaves=this.config.waves.maxWaves;this.level=1;this.message="CLEAR THE WAVE";this.waveSpawned=false;
  }
  start(player){this.reset();this.status="playing";this.player=player;this.waveSpawned=true}
  pause(){if(this.status==="playing")this.status="paused"}
  resume(){if(this.status==="paused")this.status="playing"}
  end(result){this.status=result}
}
