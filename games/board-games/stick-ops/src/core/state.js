const SAVE_KEY="zero-extraction-save-v1";

export function loadSave(){
  try{const raw=localStorage.getItem(SAVE_KEY);if(raw)return JSON.parse(raw)}catch(e){}
  return {unlockedLevel:1,bestFloor:0,storySeen:false};
}
export function writeSave(save){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save))}catch(e){}}

export class GameState{
  constructor(config){this.config=config;this.save=loadSave();this.reset()}
  reset(){
    this.status="menu";this.time=0;this.score=0;this.kills=0;this.combo=0;this.bestCombo=0;this.comboTimer=0;
    this.enemies=[];this.projectiles=[];this.particles=[];this.tracers=[];this.casings=[];this.decals=[];this.hitStop=0;this.shake=0;
    this.player=null;this.damageIndicators=[];this.message="";
    // mode: "campaign" | "endless" | "story"
    this.mode=null;
    // campaign progress
    this.currentLevel=null;this.nodeIndex=0;this.pendingSpawns=[];this.spawnClock=0;this.encounterEnemyCount=0;this.encounterLabel="";this.currentZoneFire=null;
    // endless progress
    this.floor=1;this.floorTimer=0;
  }
  startCampaign(level){this.reset();this.status="playing";this.mode="campaign";this.currentLevel=level;this.nodeIndex=0;this.currentZoneFire=null}
  startEndless(){this.reset();this.status="playing";this.mode="endless";this.floor=1}
  pause(){if(this.status==="playing")this.status="paused"}
  resume(){if(this.status==="paused")this.status="playing"}
  end(result){this.status=result}
  unlockNext(level){if(level>=this.save.unlockedLevel){this.save.unlockedLevel=Math.min(50,level+1);writeSave(this.save)}}
  recordFloor(floor){if(floor>this.save.bestFloor){this.save.bestFloor=floor;writeSave(this.save)}}
  markStorySeen(){this.save.storySeen=true;writeSave(this.save)}
}
