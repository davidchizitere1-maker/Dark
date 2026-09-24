export class UI{
  constructor(){
    this.el=id=>document.getElementById(id);this.startOverlay=this.el("startOverlay");this.pauseOverlay=this.el("pauseOverlay");this.resultOverlay=this.el("resultOverlay");
    this.el("startBtn").onclick=()=>this.onStart?.();this.el("resumeBtn").onclick=()=>this.onResume?.();this.el("restartBtn").onclick=()=>this.onRestart?.();this.el("backBtn").onclick=()=>history.back();
  }
  bind(x){Object.assign(this,x)}
  setStartVisible(v){this.startOverlay.classList.toggle("hidden",!v)}
  setPauseVisible(v){this.pauseOverlay.classList.toggle("hidden",!v)}
  setResultVisible(v,r={}){this.resultOverlay.classList.toggle("hidden",!v);if(!v)return;this.el("resultEyebrow").textContent=r.win?"MISSION COMPLETE":"MISSION FAILED";this.el("resultTitle").textContent=r.win?"SECTOR SECURED":"OPERATOR DOWN";this.el("resultText").textContent=r.win?"The Warden and hostile network have been neutralized.":"The operation ended before the sector was secured.";this.el("resultScore").textContent=(r.score??0).toLocaleString();this.el("resultWave").textContent=String(r.wave??1).padStart(2,"0");this.el("resultKills").textContent=r.kills??0;this.el("resultCombo").textContent=r.combo??0}
  update(s){
    const p=s.player;if(!p)return;const w=p.weapon;this.el("levelLabel").textContent=`LEVEL ${String(s.level).padStart(2,"0")}`;this.el("waveLabel").textContent=`WAVE ${String(s.wave).padStart(2,"0")}`;this.el("objectiveLabel").textContent=s.message;this.el("hpBar").style.width=`${100*p.hp/p.maxHp}%`;this.el("armorBar").style.setProperty("--w",`${100*(p.armor/p.maxArmor||0)}%`);this.el("staminaBar").style.setProperty("--w",`${100*p.stamina/p.config.player.staminaMax}%`);this.el("healthText").textContent=Math.ceil(p.hp);this.el("timeBar").style.width=`${p.bulletTime}%`;this.el("timeText").textContent=`${Math.ceil(p.bulletTime)}%`;this.el("weaponSlotNumber").textContent=String(Object.keys(p.config.weapons).indexOf(p.weaponId)+1).padStart(2,"0");this.el("weaponName").textContent=w.name;this.el("weaponMeta").textContent=`${w.short} · ${Math.round(1/w.fireRate*60)} RPM`;this.el("ammoLabel").innerHTML=`${p.magazine} <span>/ ${p.reserve}</span>`;this.el("reloadLabel").classList.toggle("hidden",p.reloadTimer<=0);this.el("gameHint").textContent=s.enemies.length?`${s.enemies.length} HOSTILES · ${s.wave>=s.totalWaves?"WARDEN ENGAGED":"SECTOR ACTIVE"}`:s.message;const chip=this.el("comboLabel");chip.classList.toggle("hidden",s.combo<2);chip.innerHTML=`COMBO <b>${s.combo}</b>`;
  }
}
