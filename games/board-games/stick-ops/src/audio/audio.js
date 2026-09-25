export class AudioSystem{
  constructor(){this.ctx=null;this.master=.045}
  unlock(){if(!this.ctx){const C=window.AudioContext||window.webkitAudioContext;if(C)this.ctx=new C()}if(this.ctx?.state==="suspended")this.ctx.resume()}
  tone(freq,duration=.05,type="square",gain=.03,slide=0){if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,this.ctx.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),this.ctx.currentTime+duration);g.gain.setValueAtTime(gain*this.master*18,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+duration);o.connect(g).connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+duration)}
  shot(id){const map={pistol:[220,.055],smg:[125,.04],rifle:[155,.05],shotgun:[80,.11],sniper:[95,.16],lmg:[115,.035]};const [f,d]=map[id]||[150,.05];this.tone(f,d,"sawtooth",.8,160)}
  hit(){this.tone(650,.03,"square",.65,-260)}
  melee(){this.tone(210,.09,"triangle",1,420)}
  reload(){this.tone(280,.08,"square",.5,120);setTimeout(()=>this.tone(410,.07,"square",.45,180),90)}
  dodge(){this.tone(390,.09,"triangle",.8,220)}
  death(){this.tone(90,.22,"sawtooth",1,-50)}
  boss(){this.tone(52,.3,"sawtooth",1,-20)}
}
