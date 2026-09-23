(function(){
  "use strict";

  const prefix="steene-checkers-";
  const DIFFICULTIES={
    1:{name:"Learner",roman:"I",depth:2,time:120,noise:.34,description:"A patient introduction. It sees basic captures but leaves practical chances.",patience:"Low",traps:"Light"},
    2:{name:"Club",roman:"II",depth:4,time:320,noise:.13,description:"Balanced pressure with useful tactical ideas and fewer loose pieces.",patience:"Medium",traps:"On"},
    3:{name:"Expert",roman:"III",depth:5,time:650,noise:.045,description:"Sharper move ordering, deeper tactical vision and positional punishment.",patience:"High",traps:"On"},
    4:{name:"Master",roman:"IV",depth:7,time:1100,noise:.015,description:"Deeper searches, capture extensions and strong endgame preferences.",patience:"Very high",traps:"Strong"},
    5:{name:"Legendary",roman:"V",depth:9,time:1800,noise:0,description:"Iterative deepening, tactical extensions, transposition memory and trap-aware evaluation.",patience:"Maximum",traps:"Extreme"}
  };

  const defaults={
    theme:"obsidian",
    soundEnabled:true,
    coordinates:true,
    showLegalMoves:true,
    timerSeconds:0,
    aiDifficulty:2,
    playerColor:"red",
    captureRule:"open"
  };

  const profileDefaults={
    name:"Steene Player",
    avatar:"S",
    rating:1200
  };

  const statsDefaults={
    gamesPlayed:0,
    gamesWon:0,
    gamesLost:0,
    gamesDrawn:0,
    currentStreak:0,
    bestStreak:0,
    legendaryWins:0,
    totalCaptures:0,
    totalTurns:0,
    lastGameAt:null
  };

  function read(key,fallback){
    try{
      const raw=localStorage.getItem(prefix+key);
      return raw===null?fallback:JSON.parse(raw);
    }catch(_){return fallback}
  }

  function write(key,value){
    try{localStorage.setItem(prefix+key,JSON.stringify(value));return true}
    catch(_){return false}
  }

  function settings(){return {...defaults,...(read("settings",{})||{})}}

  function saveSettings(changes){
    const next={...settings(),...changes};
    write("settings",next);
    return next;
  }

  function profile(){return {...profileDefaults,...(read("profile",{})||{})}}

  function saveProfile(changes){
    const next={...profile(),...changes};
    next.name=(next.name||profileDefaults.name).trim().slice(0,24)||profileDefaults.name;
    next.avatar=(next.avatar||next.name[0]||"S").slice(0,2);
    write("profile",next);
    return next;
  }

  function stats(){return {...statsDefaults,...(read("stats",{})||{})}}

  function saveStats(changes){
    const next={...stats(),...changes};
    write("stats",next);
    return next;
  }

  function difficulty(level){
    const n=Math.max(1,Math.min(5,Number(level)||1));
    return DIFFICULTIES[n];
  }

  function formatDifficulty(level){return difficulty(level).name}

  window.CheckersConfig={
    prefix,defaults,profileDefaults,statsDefaults,DIFFICULTIES,
    read,write,settings,saveSettings,profile,saveProfile,stats,saveStats,
    difficulty,formatDifficulty
  };
})();
