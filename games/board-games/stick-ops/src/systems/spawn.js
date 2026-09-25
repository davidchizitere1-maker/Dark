import {Fighter} from "../entities/fighter.js";
import {buildLane,assignPath} from "./paths.js";

export class SpawnSystem{
  constructor(config){this.config=config}

  // ---- CAMPAIGN / STORY: encounter nodes with approach lanes, no waves ----
  spawnEncounter(state,node){
    state.pendingSpawns=node.enemies.map(e=>({...e}));state.spawnClock=0;
    state.encounterEnemyCount=node.enemies.length;state.encounterLabel=node.label||"ENCOUNTER";
    state.message=node.boss?`${node.boss.name} — ${node.boss.title}`:state.encounterLabel;
  }
  tickSpawns(state,dt){
    if(!state.pendingSpawns||!state.pendingSpawns.length)return;
    state.spawnClock+=dt;
    const groundY=this.config.arena.groundY;
    state.pendingSpawns=state.pendingSpawns.filter(def=>{
      if(state.spawnClock<def.delay)return true;
      // every hostile approaches from the right side of the arena
      const lane={from:"right",hold:def.hold??(.5+Math.random()*.3)};
      const waypoints=buildLane(this.config,lane,groundY);
      const boss=def.bossId?state.currentLevel?.zone?.boss:null;
      const cls=this.config.enemyClasses[def.type];
      const f=new Fighter({x:waypoints[0].x,y:waypoints[0].y,color:boss?boss.color:cls.color,enemy:true,type:def.type,config:this.config,elite:def.type==="elite",firePower:state.currentZoneFire||null,bossId:def.bossId||null,bossMeta:boss||null});
      assignPath(f,waypoints);
      state.enemies.push(f);
      return false;
    });
  }

  // ---- ENDLESS RAVE: Zero clears floor after floor of a building, no cap ----
  endlessFloorCount(floor){return Math.min(20,this.config.endless.baseCount+Math.floor((floor-1)*this.config.endless.growth))}
  chooseEndlessType(floor,i){
    if(floor%this.config.endless.floorEvery===0&&i===0)return "elite";
    if(floor>=10&&i%6===0)return "sniper";if(floor>=7&&i%5===0)return "heavy";if(floor>=5&&i%4===0)return "assault";if(floor>=3&&i%3===0)return "runner";return "grunt";
  }
  spawnFloor(state){
    const n=this.endlessFloorCount(state.floor);const groundY=this.config.arena.groundY;
    state.message=`FLOOR ${state.floor} · CLEAR THE ROOM`;
    for(let i=0;i<n&&state.enemies.length<this.config.endless.maxSimultaneous;i++){
      const type=this.chooseEndlessType(state.floor,i);
      // every hostile approaches from the right, spread across a wide hold band
      const lane={from:"right",hold:.32+((i*0.15+Math.random()*.12)%0.55)};
      const waypoints=buildLane(this.config,lane,groundY);
      const f=new Fighter({x:waypoints[0].x,y:waypoints[0].y,color:this.config.enemyClasses[type].color,enemy:true,type,config:this.config,elite:type==="elite"});
      assignPath(f,waypoints);
      state.enemies.push(f);
    }
  }
}
