export class AudioSystem{
  constructor(){this.ctx=null;this.master=.045;this._amb=null}
  unlock(){if(!this.ctx){const C=window.AudioContext||window.webkitAudioContext;if(C)this.ctx=new C()}if(this.ctx?.state==="suspended")this.ctx.resume()}
  tone(freq,duration=.05,type="square",gain=.03,slide=0){if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,this.ctx.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),this.ctx.currentTime+duration);g.gain.setValueAtTime(gain*this.master*18,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+duration);o.connect(g).connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+duration)}
  shot(id){const map={pistol:[220,.055],smg:[125,.04],rifle:[155,.05],shotgun:[80,.11],sniper:[95,.16],lmg:[115,.035]};const [f,d]=map[id]||[150,.05];this.tone(f,d,"sawtooth",.8,160)}
  hit(){this.tone(650,.03,"square",.65,-260)}
  melee(){this.tone(210,.09,"triangle",1,420)}
  reload(){this.tone(280,.08,"square",.5,120);setTimeout(()=>this.tone(410,.07,"square",.45,180),90)}
  dodge(){this.tone(390,.09,"triangle",.8,220)}
  death(){this.tone(90,.22,"sawtooth",1,-50)}
  boss(){this.tone(52,.3,"sawtooth",1,-20)}

  // ---- cinematic helpers used by the story cutscene ----
  noiseBuffer(duration){const ctx=this.ctx,n=Math.floor(ctx.sampleRate*duration),buf=ctx.createBuffer(1,n,ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);return buf}
  noiseBurst(duration,gain,filterFreq){if(!this.ctx)return;const src=this.ctx.createBufferSource();src.buffer=this.noiseBuffer(duration);const f=this.ctx.createBiquadFilter();f.type="lowpass";f.frequency.value=filterFreq;const g=this.ctx.createGain();g.gain.setValueAtTime(gain*this.master*18,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+duration);src.connect(f).connect(g).connect(this.ctx.destination);src.start();src.stop(this.ctx.currentTime+duration)}
  ambienceStart(){if(!this.ctx||this._amb)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain(),f=this.ctx.createBiquadFilter();o.type="sawtooth";o.frequency.value=42;f.type="lowpass";f.frequency.value=180;g.gain.setValueAtTime(0,this.ctx.currentTime);g.gain.linearRampToValueAtTime(this.master*10,this.ctx.currentTime+1.4);o.connect(f).connect(g).connect(this.ctx.destination);o.start();this._amb={o,g}}
  ambienceStop(){if(!this._amb||!this.ctx)return;const {o,g}=this._amb;g.gain.linearRampToValueAtTime(.0001,this.ctx.currentTime+.6);o.stop(this.ctx.currentTime+.65);this._amb=null}
  whoosh(){this.noiseBurst(.5,.55,1400)}
  emberCrackle(){this.noiseBurst(.12,.22,3200)}
  stinger(){this.tone(70,.5,"sawtooth",1.1,-15);setTimeout(()=>this.noiseBurst(.3,.5,900),40)}
  riser(){if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type="sawtooth";o.frequency.setValueAtTime(80,this.ctx.currentTime);o.frequency.exponentialRampToValueAtTime(340,this.ctx.currentTime+1.6);g.gain.setValueAtTime(.0001,this.ctx.currentTime);g.gain.linearRampToValueAtTime(this.master*10,this.ctx.currentTime+1.2);g.gain.linearRampToValueAtTime(.0001,this.ctx.currentTime+1.7);o.connect(g).connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+1.75)}
  footstep(){this.noiseBurst(.06,.35,500)}
  titleHit(){this.tone(48,.8,"sawtooth",1.2,-10);setTimeout(()=>this.noiseBurst(.5,.4,1800),30)}
}
