// ZERO: EXTRACTION — campaign data
// 50 levels across 5 zones. Each zone climbs in difficulty and ends in a
// fire-powered general of ONE. Level 50 is the final confrontation.
export const ZONES = [
  {id:"docks",name:"THE DROWNED DOCKS",short:"DOCKS",bg:"docks",tint:"#7bd1ff",
    boss:{level:10,id:"cinder",name:"CINDER",title:"HARBORMASTER OF EMBERS",fire:"pool",color:"#ff7a3d",hp:900}},
  {id:"undercity",name:"THE UNDERCITY",short:"UNDERCITY",bg:"undercity",tint:"#c98cff",
    boss:{level:20,id:"ashen",name:"ASHEN",title:"THE HOLLOW SNIPER",fire:"beam",color:"#ff5b7a",hp:1150}},
  {id:"foundry",name:"THE IRON FOUNDRY",short:"FOUNDRY",bg:"foundry",tint:"#ffb14a",
    boss:{level:30,id:"molten",name:"MOLTEN",title:"THE SLAG COLOSSUS",fire:"slam",color:"#ff4d2e",hp:1500}},
  {id:"spire",name:"THE ASHSPIRE",short:"SPIRE",bg:"spire",tint:"#8cffcf",
    boss:{level:40,id:"wildfire",name:"WILDFIRE",title:"TWIN BLADES OF ONE",fire:"dash",color:"#ffe14a",hp:1750}},
  {id:"sanctum",name:"THE SANCTUM OF ONE",short:"SANCTUM",bg:"sanctum",tint:"#ff5f66",
    boss:{level:50,id:"one",name:"ONE",title:"THE BROTHER, THE BETRAYER",fire:"all",color:"#ff2e3d",hp:2600}},
];

// enemy archetypes unlock gradually across the 50-level climb
const TIERS = [
  {from:1,  types:["grunt"]},
  {from:3,  types:["grunt","runner"]},
  {from:6,  types:["grunt","runner","assault"]},
  {from:11, types:["grunt","runner","assault","sniper"]},
  {from:16, types:["runner","assault","sniper","heavy"]},
  {from:22, types:["assault","sniper","heavy","elite"]},
  {from:31, types:["sniper","heavy","elite","runner"]},
  {from:41, types:["heavy","elite","sniper","assault"]},
];

function typesForLevel(level){
  let pool=TIERS[0].types;
  for(const t of TIERS)if(level>=t.from)pool=t.types;
  return pool;
}

function zoneFor(level){return ZONES[Math.min(ZONES.length-1,Math.floor((level-1)/10))]}

// deterministic pseudo-random so the same level always builds the same way
function rng(seed){let s=seed%2147483647;if(s<=0)s+=2147483646;return()=>{s=s*16807%2147483647;return(s-1)/2147483646}}

function buildEncounter(level,nodeIndex,nodeCount,zone){
  const rand=rng(level*97+nodeIndex*13+1);
  const pool=typesForLevel(level);
  const base=3+Math.floor(level/4)+nodeIndex;
  const count=Math.min(11,base+Math.floor(rand()*2));
  const enemies=[];
  for(let i=0;i<count;i++){
    const t=pool[Math.floor(rand()*pool.length)];
    // all hostiles enter from the right; hold points are spread across a wide
    // band of the arena so a group doesn't clump into a single stack
    const hold=0.34+((i*0.17+rand()*0.12)%0.5);
    enemies.push({type:t,from:"right",hold,delay:i*0.35+rand()*0.4});
  }
  return {
    id:`L${level}-N${nodeIndex+1}`,
    label:nodeCount>1?`ENCOUNTER ${nodeIndex+1}/${nodeCount}`:"ENCOUNTER",
    enemies,
    // path corridor the player walks while clearing this node (Killer-Bean style
    // approach lanes enemies run down before engaging, not a static spawn point)
    lanes:[
      {from:"right",hold:0.4+rand()*0.08},
      {from:"right",hold:0.62+rand()*0.08},
    ],
  };
}

function buildBossEncounter(level,zone){
  const b=zone.boss;
  return {
    id:`L${level}-BOSS`,
    label:`${b.name} · ${b.title}`,
    boss:b,
    enemies:[{type:"boss",bossId:b.id,from:"right",delay:0.6}],
    lanes:[{from:"right",hold:0.7}],
  };
}

export function buildLevel(level){
  const zone=zoneFor(level);
  const isBoss=zone.boss.level===level;
  const indexInZone=((level-1)%10)+1;
  const nodeCount=isBoss?1:(level<=5?2:3);
  const nodes=[];
  if(isBoss){
    nodes.push(buildEncounter(level,0,2,zone));
    nodes.push(buildBossEncounter(level,zone));
  } else {
    for(let i=0;i<nodeCount;i++)nodes.push(buildEncounter(level,i,nodeCount,zone));
  }
  return {
    level,
    zone,
    isBoss,
    name:isBoss?`${zone.name} — ${zone.boss.name}`:`${zone.name} ${String(indexInZone).padStart(2,"0")}`,
    nodes,
    pathLength:1400+level*40+(isBoss?900:0),
  };
}

export const CAMPAIGN_LENGTH=50;
export function buildCampaign(){const out=[];for(let l=1;l<=CAMPAIGN_LENGTH;l++)out.push(buildLevel(l));return out}

// --- Story mode opening cinematic script -----------------------------------
export const STORY_SCRIPT=[
  {t:2.6,text:"Two brothers built the Extraction together.",cue:"twins"},
  {t:2.6,text:"ONE burned it down to rule what was left.",cue:"betrayal"},
  {t:2.4,text:"ZERO was left for dead in the ash.",cue:"fall"},
  {t:2.4,text:"He did not die.",cue:"rise"},
  {t:2.8,text:"Now ONE's generals hold the Extraction — Cinder, Ashen, Molten, Wildfire — each wielding a piece of the fire ONE stole.",cue:"generals"},
  {t:2.6,text:"ZERO is coming for all of it back.",cue:"walk"},
  {t:2.2,text:"For the Extraction. For his name. For revenge.",cue:"title"},
];
