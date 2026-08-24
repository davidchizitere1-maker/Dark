/* ==========================================================
   STEENE — src/ui/tutorial.js
   Step-through tutorial content shown on the Tutorial screen.
   Ported from the feature/online-multiplayer branch and
   generalized since board size / piece count are configurable
   (main branch supports 8x8–12x12 boards and 1–4 pieces).
   ========================================================== */

const TUTS = [
  {title: 'Welcome to STEENE',
   desc: 'STEENE is a 2-player strategy game on a square board (8×8, 10×10, or 12×12). Each player controls a set of pieces and a stock of barricades (split evenly horizontal/vertical). Before play, each secretly picks target squares on the opponent\'s side. First to land all pieces on their targets simultaneously wins.',
   demo: `<div style="display:flex;gap:13px;align-items:center">
     <div style="width:50px;height:50px;border-radius:9px;overflow:hidden;display:flex;box-shadow:0 0 0 2px var(--gold)">
       <div style="width:50%;background:#0a0a12"></div><div style="width:50%;background:#fff"></div>
     </div>
     <div style="text-align:left;font-size:.82rem;color:var(--muted);line-height:1.85">Configurable board size<br>1–4 pieces per player<br>Barricades scale with board<br>Secret targets</div>
   </div>`},
  {title: 'Movement — ↑↓←→ Only',
   desc: 'On your turn, choose to either MOVE a piece or PLACE A BARRICADE — never both. A move is exactly 1 square Up, Down, Left or Right. No diagonals.',
   demo: `<div style="display:grid;grid-template-columns:repeat(3,46px);grid-template-rows:repeat(3,46px);gap:3px">
     <div></div>
     <div style="background:rgba(26,86,219,.22);border:2px solid var(--blue2);border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--blue2);font-size:1.1rem">↑</div>
     <div></div>
     <div style="background:rgba(26,86,219,.22);border:2px solid var(--blue2);border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--blue2);font-size:1.1rem">←</div>
     <div style="border-radius:50%;background:radial-gradient(circle at 35% 32%,#fff,#c0c8e0);box-shadow:0 0 0 2.5px var(--gold);width:40px;height:40px;margin:3px"></div>
     <div style="background:rgba(26,86,219,.22);border:2px solid var(--blue2);border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--blue2);font-size:1.1rem">→</div>
     <div></div>
     <div style="background:rgba(26,86,219,.22);border:2px solid var(--blue2);border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--blue2);font-size:1.1rem">↓</div>
     <div></div>
   </div>`},
  {title: 'Jumping Over an Opponent',
   desc: 'If an opponent\'s piece is directly ahead of you, you jump straight over it and land on the next square beyond — as long as that square is empty and not walled off. You never land on or push the opponent.',
   demo: `<div style="display:flex;flex-direction:column;gap:10px;align-items:center">
     <div style="font-size:.74rem;color:var(--muted)">White jumps straight over Blue</div>
     <div style="display:flex;align-items:center;gap:3px">
       <div style="width:42px;height:42px;background:#e0e4f5;border-radius:3px;display:flex;align-items:center;justify-content:center"><div style="width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 32%,#fff,#c0c8e0);box-shadow:0 0 0 2.5px var(--gold)"></div></div>
       <div style="width:42px;height:42px;background:rgba(232,140,30,.16);border:2px solid var(--gold);border-radius:3px;display:flex;align-items:center;justify-content:center"><div style="width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 32%,#4a6ee0,#0a1560)"></div></div>
       <div style="width:42px;height:42px;background:rgba(232,140,30,.1);border:2px dashed var(--gold);border-radius:3px;display:flex;align-items:center;justify-content:center;color:var(--gold);font-size:1.2rem">●</div>
     </div>
     <div style="font-size:.7rem;color:var(--gold)">Orange path = jump trajectory, lands 2 squares ahead</div>
   </div>`},
  {title: 'Barricades',
   desc: 'Instead of moving, place ONE barricade on a line between cells: horizontal or vertical, from your remaining stock. Barricades block movement and jumps straight through that line.\n\nA barricade can never seal off any piece completely — if doing so would leave a piece with NO route to its targets, the placement is blocked automatically.',
   demo: `<div style="text-align:center">
     <div style="display:inline-flex;gap:8px;align-items:center;margin-bottom:10px">
       <div style="width:40px;height:40px;background:#0d0d1a;border-radius:3px;position:relative;display:flex;align-items:center;justify-content:center">
         <div style="width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 35% 32%,#fff,#c0c8e0)"></div>
         <div style="position:absolute;bottom:-5px;left:-2px;width:calc(100%+4px);height:6px;background:linear-gradient(135deg,#4a6ee0,#1a2a8a);border-radius:2px"></div>
       </div>
       <div style="width:40px;height:40px;background:#e0e4f5;border-radius:3px"></div>
     </div>
     <div style="font-size:.78rem;color:var(--muted)">Barricade stock is split evenly horizontal / vertical, scaled to board size</div>
   </div>`},
  {title: 'Secret Targets & Winning 🎯',
   desc: 'Win by landing ALL your pieces on your secret target squares at the same time. Targets sit on the opponent\'s starting row. Your opponent watches your moves and walls to guess your targets — disguise your route!',
   demo: `<div style="text-align:center"><div style="font-size:2rem;margin-bottom:10px">🎯🎯</div>
     <div style="font-size:.82rem;color:var(--muted);line-height:1.8">Pick squares on opponent's row<br>Land ALL pieces simultaneously<br>Misdirect with your moves and walls</div></div>`},
  {title: 'Ready to Play!',
   desc: 'Move ↑↓←→ or place a barricade — one action per turn. Jump over opponents blocking your path. Use your barricades wisely to carve a maze in your favor. Race your pieces to your secret targets. Good luck!',
   demo: `<div style="text-align:center">
     <div style="width:54px;height:54px;border-radius:10px;overflow:hidden;display:flex;box-shadow:0 0 0 2px var(--gold);margin:0 auto 13px">
       <div style="width:50%;background:#0a0a12"></div><div style="width:50%;background:#fff"></div>
     </div>
     <div style="font-family:var(--fd);font-size:1.2rem;font-weight:800;letter-spacing:.12em">STEENE</div>
     <div style="font-size:.73rem;color:var(--gold);margin-top:5px;letter-spacing:.08em">Control the Motion. Predict the Destination.</div>
   </div>`}
];

let tutStep = 0;

function renderTut() {
  id('tutContent').innerHTML = TUTS.map((s, i) => `
    <div class="tut-step ${i === tutStep ? 'on' : ''}" id="ts${i}">
      <div class="tut-n">Step ${i + 1} of ${TUTS.length}</div>
      <div class="tut-title">${s.title}</div>
      <div class="tut-demo">${s.demo}</div>
      <div class="tut-desc">${s.desc.replace(/\n/g, '<br>')}</div>
    </div>`).join('');
  id('tutDots').innerHTML = TUTS.map((_, i) => `
    <div class="tut-dot ${i === tutStep ? 'on' : ''}" onclick="tutStep=${i};renderTut()"></div>`).join('');
  id('tutPrev').disabled = tutStep === 0;
  id('tutNext').textContent = tutStep === TUTS.length - 1 ? '▶ Play Now' : 'Next →';
}

function tutGo(d) {
  if (d === 1 && tutStep === TUTS.length - 1) { goTo('play'); return; }
  tutStep = Math.max(0, Math.min(TUTS.length - 1, tutStep + d));
  renderTut();
}
