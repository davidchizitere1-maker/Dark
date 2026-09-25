import {ZONES} from "../data/levels.js";

export class UI{
  constructor(){
    this.el=id=>document.getElementById(id);
    this.modeSelectOverlay=this.el("modeSelectOverlay");this.levelSelectOverlay=this.el("levelSelectOverlay");
    this.storyOverlay=this.el("storyOverlay");this.pauseOverlay=this.el("pauseOverlay");this.resultOverlay=this.el("resultOverlay");
    this.activeZone=0;

    this.el("storyModeBtn").onclick=()=>this.onSelectStoryMode?.();
    this.el("campaignModeBtn").onclick=()=>this.onSelectCampaignMode?.();
    this.el("endlessModeBtn").onclick=()=>this.onSelectEndlessMode?.();
    document.querySelectorAll(".home-tab").forEach(b=>b.onclick=()=>this.showHomeTab(b.dataset.tab));
    this.el("homeToPlayBtn").onclick=()=>this.showHomeTab("play");
    this.el("levelBackBtn").onclick=()=>this.onLevelBack?.();
    this.el("storySkipBtn").onclick=()=>this.onStorySkip?.();
    this.el("resumeBtn").onclick=()=>this.onResume?.();
    this.el("pauseMenuBtn").onclick=()=>this.onPauseMenu?.();
    this.el("resultPrimaryBtn").onclick=()=>this.onResultPrimary?.();
    this.el("resultSecondaryBtn").onclick=()=>this.onResultSecondary?.();
    this.el("backBtn").onclick=()=>this.onExit?.();
  }
  bind(x){Object.assign(this,x)}
  hideAll(){this.modeSelectOverlay.classList.add("hidden");this.levelSelectOverlay.classList.add("hidden");this.storyOverlay.classList.add("hidden");this.pauseOverlay.classList.add("hidden");this.resultOverlay.classList.add("hidden")}

  showModeSelect(){this.hideAll();this.modeSelectOverlay.classList.remove("hidden");this.showHomeTab("home")}

  showHomeTab(name){
    document.querySelectorAll(".home-tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));
    ["home","play","rules","tutorial"].forEach(t=>this.el(`tab${t[0].toUpperCase()}${t.slice(1)}`).classList.toggle("hidden",t!==name));
  }

  showLevelSelect(campaign,unlockedLevel){
    this.hideAll();this.levelSelectOverlay.classList.remove("hidden");
    const tabs=this.el("zoneTabs");tabs.innerHTML="";
    ZONES.forEach((z,i)=>{
      const b=document.createElement("button");b.className="zone-tab"+(i===this.activeZone?" active":"");
      b.textContent=z.short;b.onclick=()=>{this.activeZone=i;this.showLevelSelect(campaign,unlockedLevel)};
      tabs.appendChild(b);
    });
    const grid=this.el("levelGrid");grid.innerHTML="";
    const zone=ZONES[this.activeZone];
    campaign.filter(l=>l.zone.id===zone.id).forEach(l=>{
      const cell=document.createElement("button");
      const locked=l.level>unlockedLevel;const done=l.level<unlockedLevel;
      cell.className="level-cell"+(l.isBoss?" boss":"")+(locked?" locked":"")+(done?" done":"");
      cell.innerHTML=`${String(l.level).padStart(2,"0")}<small>${l.isBoss?l.zone.boss.name:"MISSION"}</small>`;
      if(!locked)cell.onclick=()=>this.onSelectLevel?.(l.level);
      grid.appendChild(cell);
    });
  }

  showStory(){this.hideAll();this.storyOverlay.classList.remove("hidden")}
  setStoryCaption(text){this.el("storyCaption").textContent=text}

  setPauseVisible(v){this.pauseOverlay.classList.toggle("hidden",!v)}

  setResultVisible(v,r={}){
    this.resultOverlay.classList.toggle("hidden",!v);if(!v)return;
    this.el("resultEyebrow").textContent=r.eyebrow||(r.win?"MISSION COMPLETE":"MISSION FAILED");
    this.el("resultTitle").textContent=r.title||(r.win?"SECTOR SECURED":"OPERATOR DOWN");
    this.el("resultText").textContent=r.text||"";
    this.el("resultScore").textContent=(r.score??0).toLocaleString();
    this.el("resultWaveLabel").textContent=r.waveLabel||"WAVE";
    this.el("resultWave").textContent=String(r.waveValue??1).padStart(2,"0");
    this.el("resultKills").textContent=r.kills??0;
    this.el("resultCombo").textContent=r.combo??0;
    const p=this.el("resultPrimaryBtn");p.querySelector("span").textContent=r.primaryLabel||"REDEPLOY";
    const s=this.el("resultSecondaryBtn");s.classList.toggle("hidden",!r.secondaryLabel);if(r.secondaryLabel)s.textContent=r.secondaryLabel;
  }

  update(s){
    const p=s.player;if(!p)return;const w=p.weapon;
    if(s.mode==="campaign"&&s.currentLevel){
      this.el("levelLabel").textContent=`LEVEL ${String(s.currentLevel.level).padStart(2,"0")}`;
      this.el("waveLabel").textContent=s.currentLevel.zone.short;
      this.el("gameHint").textContent=s.enemies.length?`${s.enemies.length} HOSTILES · ${s.encounterLabel}`:s.message;
    } else if(s.mode==="endless"){
      this.el("levelLabel").textContent="ENDLESS RAVE";
      this.el("waveLabel").textContent=`FLOOR ${s.floor}`;
      this.el("gameHint").textContent=s.enemies.length?`${s.enemies.length} HOSTILES · FLOOR ${s.floor}`:s.message;
    }
    this.el("objectiveLabel").textContent=s.message;
    this.el("hpBar").style.width=`${100*p.hp/p.maxHp}%`;this.el("armorBar").style.setProperty("--w",`${100*(p.armor/p.maxArmor||0)}%`);this.el("staminaBar").style.setProperty("--w",`${100*p.stamina/p.config.player.staminaMax}%`);this.el("healthText").textContent=Math.ceil(p.hp);this.el("timeBar").style.width=`${p.bulletTime}%`;this.el("timeText").textContent=`${Math.ceil(p.bulletTime)}%`;this.el("weaponSlotNumber").textContent=String(Object.keys(p.config.weapons).indexOf(p.weaponId)+1).padStart(2,"0");this.el("weaponName").textContent=w.name;this.el("weaponMeta").textContent=`${w.short} · ${Math.round(1/w.fireRate*60)} RPM`;this.el("ammoLabel").innerHTML=`${p.magazine} <span>/ ${p.reserve}</span>`;this.el("reloadLabel").classList.toggle("hidden",p.reloadTimer<=0);
    const chip=this.el("comboLabel");chip.classList.toggle("hidden",s.combo<2);chip.innerHTML=`COMBO <b>${s.combo}</b>`;
    this.el("grenadeCount").textContent=p.grenades;const bg=this.el("btnGrenadeCount");if(bg)bg.textContent=p.grenades;
  }
}
