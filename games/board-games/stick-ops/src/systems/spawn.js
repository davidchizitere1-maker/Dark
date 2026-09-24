import {Fighter} from "../entities/fighter.js";
export class SpawnSystem{
  constructor(config){this.config=config}
  waveCount(w){return Math.min(18,this.config.waves.baseCount+(w-1)*this.config.waves.growth)}
  chooseType(w,i){
    if(w===this.config.waves.maxWaves)return i===0?"boss":(i%3===0?"elite":"assault");
    if(w>=9&&i%7===0)return "elite";if(w>=7&&i%6===0)return "sniper";if(w>=5&&i%5===0)return "heavy";if(w>=4&&i%4===0)return "assault";if(w>=3&&i%3===0)return "runner";return "grunt";
  }
  spawnWave(state){
    const n=this.waveCount(state.wave);state.message=state.wave===this.config.waves.maxWaves?"WARDEN INBOUND":"CLEAR THE WAVE";
    for(let i=0;i<n&&state.enemies.length<this.config.waves.maxSimultaneous;i++){
      const side=i%2===0?-1:1;const x=side<0?120+Math.random()*260:this.config.arena.width-380+Math.random()*260;const type=this.chooseType(state.wave,i);const f=new Fighter({x,y:this.config.arena.groundY-40,color:this.config.enemyClasses[type].color,enemy:true,type,config:this.config,elite:type==="elite"});state.enemies.push(f);
    }
  }
}
