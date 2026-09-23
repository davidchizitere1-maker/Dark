(function(){
  "use strict";

  const avatars=["♟","♞","♜","♛","♚","◆","◇","⚡","✦","🔥","🛡","🏆","🐺","🦁","🐉","🎮","👑","💎","🚀","🌙","☄","◈","◎","◉"];

  function $(id){return document.getElementById(id)}

  function renderSuggestions(){
    const wrap=$("avatarSuggestions");if(!wrap)return;
    wrap.innerHTML="";
    const current=window.CheckersConfig.profile().avatar;
    avatars.forEach(symbol=>{
      const b=document.createElement("button");
      b.type="button";b.className="avatar-option";b.textContent=symbol;
      if(symbol===current)b.style.borderColor="rgba(240,181,107,.5)";
      b.onclick=()=>{$("profileAvatarInput").value=symbol;renderSuggestions()};
      wrap.appendChild(b);
    });
  }

  function render(){
    const p=window.CheckersConfig.profile();
    const s=window.CheckersConfig.stats();
    const user=window.steeneUser;

    if($("profileName"))$("profileName").textContent=p.name;
    if($("profileEmail"))$("profileEmail").textContent=user?.email||"Anonymous player";
    if($("profileAvatar"))$("profileAvatar").textContent=p.avatar;
    if($("profileNameInput"))$("profileNameInput").value=p.name;
    if($("profileAvatarInput"))$("profileAvatarInput").value=p.avatar;
    if($("profileRating"))$("profileRating").textContent=p.rating;
    if($("profileGames"))$("profileGames").textContent=s.gamesPlayed;
    if($("profileWins"))$("profileWins").textContent=s.gamesWon;
    if($("profileLosses"))$("profileLosses").textContent=s.gamesLost;
    if($("profileWinRate"))$("profileWinRate").textContent=s.gamesPlayed?`${Math.round((s.gamesWon/s.gamesPlayed)*100)}%`:"0%";
    if($("profileBest"))$("profileBest").textContent=s.bestStreak;
    if($("profileLegendary"))$("profileLegendary").textContent=s.legendaryWins;
    if($("miniName"))$("miniName").textContent=p.name;
    if($("miniRating"))$("miniRating").textContent=`Rating ${p.rating}`;
    if($("miniAvatar"))$("miniAvatar").textContent=p.avatar;
    if($("profileStatus"))$("profileStatus").textContent=user?"Connected to STEENE":"Local arena profile";
    renderSuggestions();
  }

  function save(){
    const p=window.CheckersConfig.saveProfile({
      name:$("profileNameInput").value,
      avatar:$("profileAvatarInput").value
    });
    render();
    window.CheckersUI?.toast?.(`Profile saved as ${p.name}.`);
  }

  window.CheckersProfile={render,save};
})();
