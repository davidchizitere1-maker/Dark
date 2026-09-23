(function(){
  "use strict";

  let selectedMode="local";
  const $=id=>document.getElementById(id);

  const difficulties=window.CheckersConfig.DIFFICULTIES;

  function toast(message){
    const el=$("toast");if(!el)return;
    el.textContent=message;el.classList.add("show");
    clearTimeout(window.__checkersToast);
    window.__checkersToast=setTimeout(()=>el.classList.remove("show"),2400);
  }

  function refreshAll(){
    const stats=window.CheckersConfig.stats(),profile=window.CheckersConfig.profile();
    $("homeGames").textContent=stats.gamesPlayed;
    $("homeWins").textContent=stats.gamesWon;
    $("homeStreak").textContent=stats.currentStreak;
    $("homeRating").textContent=profile.rating;
    $("miniName").textContent=profile.name;
    $("miniRating").textContent=`Rating ${profile.rating}`;
    $("miniAvatar").textContent=profile.avatar;
  }

  function setup(){
    const s=window.CheckersConfig.settings();
    $("setupTheme").value=s.theme;
    $("setupTimer").value=String(s.timerSeconds);
    $("setupDifficulty").value=String(s.aiDifficulty);
    $("setupColor").value=s.playerColor;
    $("setupCaptureRule").value=s.captureRule||"open";
    selectMode("local");
    updateAiPreview();
  }

  function selectMode(mode){
    selectedMode=mode;
    document.querySelectorAll(".mode-card").forEach(btn=>btn.classList.toggle("selected",btn.dataset.mode===mode));
    $("aiField").classList.toggle("hidden",mode!=="ai");
    $("onlineFields").classList.toggle("hidden",mode!=="online");
    updateAiPreview();
  }

  function updateAiPreview(){
    const level=Number($("setupDifficulty").value||2);
    const info=difficulties[level];
    $("aiLevelTitle").textContent=info.name;
    $("aiLevelBadge").textContent=info.roman;
    $("aiLevelDescription").textContent=info.description;
    $("previewDepth").textContent=`${info.depth}+`;
    $("previewPatience").textContent=info.patience;
    $("previewTraps").textContent=info.traps;
    $("aiPreview").innerHTML=`<div class="preview-orb">${info.roman}</div><div><strong>${info.name}</strong><p>${info.description}</p></div>`;
  }

  function wire(){
    document.querySelectorAll(".mode-card").forEach(btn=>btn.addEventListener("click",()=>selectMode(btn.dataset.mode)));
    $("setupDifficulty").addEventListener("input",updateAiPreview);

    $("homePlayBtn").onclick=()=>window.CheckersNavigation.go("play");
    $("homeTutorialBtn").onclick=()=>window.CheckersNavigation.go("tutorial");
    $("homeLegendaryBtn").onclick=()=>{
      $("setupDifficulty").value="5";selectMode("ai");window.CheckersNavigation.go("play");updateAiPreview();
    };
    $("settingsBtn").onclick=()=>window.CheckersNavigation.go("settings");

    $("launchBtn").onclick=launch;
    $("saveProfileBtn").onclick=()=>window.CheckersProfile.save();
    $("saveSettingsBtn").onclick=()=>window.CheckersSettings.save();

    $("soundBtn").onclick=()=>{
      const s=window.CheckersConfig.settings();
      window.CheckersConfig.saveSettings({soundEnabled:!s.soundEnabled});
      $("soundBtn").textContent=s.soundEnabled?"◒":"◉";
      toast(s.soundEnabled?"Sound muted.":"Sound enabled.");
    };

    $("rotateBtn").onclick=()=>window.CheckersBoard.rotate();
    $("restartBtn").onclick=()=>{
      const s=window.CheckersBoard.state;
      window.CheckersBoard.start({
        mode:s.mode,theme:s.theme,timerSeconds:s.timerSeconds,aiDifficulty:s.aiDifficulty,
        aiColor:s.aiColor,localColor:s.localColor,captureRule:s.captureRule
      });
    };
    $("resignBtn").onclick=()=>window.CheckersBoard.resign();

    $("showCapturesBtn").onclick=()=>{
      window.CheckersBoard.state.choiceMode="captures";window.CheckersBoard.state.selected=null;window.CheckersBoard.render();
    };
    $("showQuietBtn").onclick=()=>{
      window.CheckersBoard.state.choiceMode="quiet";window.CheckersBoard.state.selected=null;window.CheckersBoard.render();
    };

    $("resultReviewBtn").onclick=()=>{$("resultModal").classList.add("hidden");window.CheckersNavigation.go("game");};
    $("resultNewBtn").onclick=()=>{$("resultModal").classList.add("hidden");window.CheckersNavigation.go("play");};
  }

  async function launch(){
    const mode=selectedMode;
    const level=Number($("setupDifficulty").value);
    const theme=$("setupTheme").value;
    const timerSeconds=Number($("setupTimer").value);
    const color=$("setupColor").value;
    const captureRule=$("setupCaptureRule").value;
    const opts={
      mode,theme,timerSeconds,aiDifficulty:level,captureRule,
      localColor:color,aiColor:color==="red"?"black":"red",onlineColor:color
    };

    window.CheckersConfig.saveSettings({theme,timerSeconds,aiDifficulty:level,playerColor:color,captureRule});

    if(mode==="online"){
      const code=$("roomCode").value.trim();
      window.CheckersOnline.setHandlers({onState:window.CheckersBoard.applyRemote,onStatus:toast});
      let room=null;
      const payload={
        color,
        state:{board:window.CheckersLogic.initialBoard(),turn:"red",captureTotal:{red:0,black:0},turnNumber:1,captureRule,lastMove:null},
        onState:window.CheckersBoard.applyRemote,
        onStatus:toast
      };
      if(code)room=await window.CheckersOnline.joinRoom(code,payload);
      else room=await window.CheckersOnline.createRoom(payload);
      if(!room)return;
      opts.onlineColor=window.CheckersOnline.color;
      opts.localColor=window.CheckersOnline.color;
    }

    window.CheckersBoard.start(opts);
    window.CheckersNavigation.go("game");

    $("redPlayerMeta").textContent=mode==="ai"&&opts.aiColor==="red"?"Opponent":"You";
    $("blackPlayerMeta").textContent=mode==="ai"&&opts.aiColor==="black"?"Opponent":"You";
    if(mode==="online"){
      $("redPlayerMeta").textContent=opts.onlineColor==="red"?"You":"Opponent";
      $("blackPlayerMeta").textContent=opts.onlineColor==="black"?"You":"Opponent";
    }
  }

  function init(){
    wire();setup();refreshAll();
    window.CheckersProfile.render();window.CheckersSettings.load();
    const s=window.CheckersConfig.settings();
    document.body.className=`theme-${s.theme}`;
    $("soundBtn").textContent=s.soundEnabled?"◒":"◉";
    window.CheckersUI={toast,refreshAll,updateAiPreview};
    if(window.onSteeneSessionChange)window.onSteeneSessionChange(()=>window.CheckersProfile.render());
  }

  window.addEventListener("DOMContentLoaded",init);
})();
