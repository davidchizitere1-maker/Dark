export const CONFIG = Object.freeze({
  arena:{width:3400,height:1500,groundY:1110,leftMargin:40,rightMargin:40},
  player:{maxHp:100,maxArmor:70,speed:360,jump:690,radius:24,staminaMax:100,staminaRegen:28,dodgeCost:26,dodgeSpeed:920,bulletTimeMax:100,bulletTimeDrain:30,bulletTimeRecharge:15},
  melee:{damage:46,range:78,cooldown:.42},
  weapons:{
    pistol:{id:"pistol",name:"SIDEARM",short:"PTL",damage:27,fireRate:.24,magazine:12,reserve:72,reload:1.0,bulletSpeed:1450,spread:.018,pellets:1,recoil:150,color:"#d9ff4a",sound:"pistol",pierce:0},
    smg:{id:"smg",name:"VECTOR SMG",short:"SMG",damage:14,fireRate:.085,magazine:30,reserve:150,reload:1.35,bulletSpeed:1650,spread:.075,pellets:1,recoil:95,color:"#83d6ff",sound:"smg",pierce:0},
    rifle:{id:"rifle",name:"AR-47",short:"AR",damage:23,fireRate:.13,magazine:30,reserve:150,reload:1.55,bulletSpeed:1850,spread:.045,pellets:1,recoil:130,color:"#ffda7a",sound:"rifle",pierce:0},
    shotgun:{id:"shotgun",name:"BREACHER",short:"SG",damage:15,fireRate:.72,magazine:6,reserve:42,reload:1.8,bulletSpeed:1200,spread:.25,pellets:8,recoil:420,color:"#ff9c62",sound:"shotgun",pierce:0},
    sniper:{id:"sniper",name:"LONGSHOT",short:"SR",damage:105,fireRate:1.05,magazine:5,reserve:30,reload:1.9,bulletSpeed:2550,spread:.004,pellets:1,recoil:640,color:"#f2e8ff",sound:"sniper",pierce:3},
    lmg:{id:"lmg",name:"WIDOW LMG",short:"LMG",damage:19,fireRate:.07,magazine:75,reserve:225,reload:2.4,bulletSpeed:1900,spread:.09,pellets:1,recoil:105,color:"#ff6673",sound:"lmg",pierce:1}
  },
  enemyClasses:{
    grunt:{name:"GRUNT",hp:60,speed:165,shootRange:570,shootCooldown:1.25,damage:9,color:"#ff6870",weaponDamage:9,scale:1},
    runner:{name:"RUNNER",hp:45,speed:300,shootRange:0,shootCooldown:0,damage:16,color:"#ff9b55",weaponDamage:16,scale:.96},
    heavy:{name:"HEAVY",hp:230,speed:88,shootRange:620,shootCooldown:1.45,damage:15,color:"#a1a9b5",weaponDamage:15,scale:1.18,armor:50},
    assault:{name:"ASSAULT",hp:82,speed:210,shootRange:690,shootCooldown:.78,damage:12,color:"#e96dff",weaponDamage:12,scale:1.02},
    sniper:{name:"SNIPER",hp:70,speed:120,shootRange:1050,shootCooldown:2.1,damage:28,color:"#8cc8ff",weaponDamage:28,scale:1.02},
    elite:{name:"ELITE",hp:145,speed:245,shootRange:760,shootCooldown:.62,damage:17,color:"#d8ff63",weaponDamage:17,scale:1.08},
    boss:{name:"WARDEN",hp:720,speed:120,shootRange:780,shootCooldown:.44,damage:24,color:"#ff3e56",weaponDamage:24,scale:1.48,armor:120,boss:true}
  },
  endless:{baseCount:4,growth:1.6,maxSimultaneous:16,restTime:1.6,floorEvery:3},
  pathSpeed:{grunt:150,runner:280,assault:220,sniper:130,heavy:100,elite:230,boss:110},
  firePowers:{
    pool:{color:"#ff7a3d",name:"Fire Pool",desc:"Leaves burning ground that scorches over time"},
    beam:{color:"#ff5b7a",name:"Ash Beam",desc:"Charges a piercing incendiary sniper beam"},
    slam:{color:"#ff4d2e",name:"Magma Slam",desc:"Slams the ground for a fire shockwave"},
    dash:{color:"#ffe14a",name:"Wild Dash",desc:"Twin blazing dash strikes"},
    all:{color:"#ff2e3d",name:"Ember Sovereignty",desc:"Commands every stolen fire power at once"}
  },
  physics:{gravity:1900,friction:.78,maxFall:1200},
  camera:{lookAhead:150,smoothing:7,shakeDecay:3.5},
  colors:{ink:"#05070a",sky:"#0a0e14",haze:"#121925",ground:"#161d27",concrete:"#242d38",accent:"#d9ff4a",cyan:"#7bd1ff",danger:"#ff5f66",blood:"#cf5964",spark:"#ffe7a8",smoke:"#a5aebb"}
});
