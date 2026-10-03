-- 자동 생성 패치 30개 hunk · 기대 md5 f8859155cc24a141675d52a2006822d1 · 길이 66160
update public.games set html = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(html, $o$if (TEST) window.GAME = { S, P, E, B, G, META, C, STAGES, WEAPONS, PASSIVES, tick, startGame, endRun, spawn, kill, levelUp, pick, choices, inputVec, KEY, JOY, frameMs: () => frameMs, enemyHp, hurtEnemy };
$o$, $n$if (TEST) window.GAME = { S, P, E, B, G, EB, ZONE, CHESTS, META, openChest, bossPattern, nearObst, ELITE_AT, C, STAGES, WEAPONS, PASSIVES, tick, startGame, endRun, spawn, kill, levelUp, pick, choices, inputVec, KEY, JOY, frameMs: () => frameMs, enemyHp, hurtEnemy };
$n$), $o$document.addEventListener('visibilitychange', () => { if (document.hidden) { if (S.mode === 'play') { JOY.on = false; } saveMeta(); if (S.mode === 'play') logEvent('over', Math.floor(S.t)); } });
$o$, $n$document.addEventListener('visibilitychange', () => { if (document.hidden) { if (S.mode === 'play') { JOY.on = false; } saveMeta(); if (S.mode === 'play') logEvent('over', Math.floor(S.t)); } });
function renderStages() { const box = document.getElementById('stages'); box.innerHTML = ''; STAGES.forEach((st, i) => { const b = document.createElement('button'); b.className = 'ghost'; b.style.flex = '1'; b.style.padding = '0 6px'; b.style.fontSize = '13px'; const locked = i > META.bestStage; b.textContent = locked ? `🔒 ${st.name}` : st.name; b.disabled = locked; b.style.opacity = locked ? .45 : 1; if (META.stage - 1 === i) { b.style.background = 'rgba(232,193,90,.2)'; } b.addEventListener('click', () => { META.stage = i + 1; saveMeta(); renderStages(); }); box.appendChild(b); }); }
renderStages();
$n$), $o$  if (cleared && META.bestStage < S.stage + 1) { META.bestStage = S.stage + 1; }
$o$, $n$  if (cleared && META.bestStage < S.stage + 1) { META.bestStage = S.stage + 1; toast(S.stage + 1 < STAGES.length ? `${STAGES[S.stage + 1].name} 해금!` : '모든 밤을 이겨냈다'); } renderStages();
$n$), $o$  S.mode = 'play'; S.t = 0; S.lvl = 1; S.xp = 0; S.need = C.LVL_XP0; S.kills = 0; S.coins = 0; S.spawnAcc = 0; S.bossDone = [false, false]; S.cleared = S.dead = false; S.hitT = S.freeze = S.shake = S.flash = 0;
  S.stage = Math.min(STAGES.length - 1, (META.stage || 1) - 1); S.pw = S.chal ? 1 : metaPower();
$o$, $n$  S.mode = 'play'; S.t = 0; S.lvl = 1; S.xp = 0; S.need = C.LVL_XP0; S.kills = 0; S.coins = 0; S.spawnAcc = 0; S.bossDone = [false, false]; S.cleared = S.dead = false; S.hitT = S.freeze = S.shake = S.flash = S.burnT = S.slowT = 0; S.eliteIdx = 0; EB.length = 0; ZONE.length = 0; CHESTS.length = 0; OB.clear();
  S.stage = Math.min(STAGES.length - 1, Math.max(0, (META.stage || 1) - 1), META.bestStage); S.pw = S.chal ? 1 : metaPower();
$n$), $o$  const hx = sx(P.x) - 18, hy = sy(P.y) + 20; ctx.fillStyle = 'rgba(0,0,0,.6)'; rr(hx, hy, 36, 5, 2.5); ctx.fill(); ctx.fillStyle = S.hp / S.maxhp < .3 ? '#ff5a4a' : '#6fe07a'; rr(hx, hy, 36 * Math.max(0, S.hp / S.maxhp), 5, 2.5); ctx.fill();
$o$, $n$  const hx = sx(P.x) - 18, hy = sy(P.y) + 20; ctx.fillStyle = 'rgba(0,0,0,.6)'; rr(hx, hy, 36, 5, 2.5); ctx.fill(); ctx.fillStyle = S.hp / S.maxhp < .3 ? '#ff5a4a' : '#6fe07a'; rr(hx, hy, 36 * Math.max(0, S.hp / S.maxhp), 5, 2.5); ctx.fill();
  if (S.burnT > 0 || S.slowT > 0) { ctx.textAlign = 'center'; ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = S.burnT > 0 ? '#ff9a4a' : '#5fc8ff'; ctx.fillText(S.burnT > 0 ? '화상' : '둔화', sx(P.x), sy(P.y) + 36); }
$n$), $o$  for (const s of SLASH) { const a = s.t / .22; ctx.strokeStyle = `rgba(255,240,200,${a * .9})`; ctx.lineWidth = 6 * a + 2; ctx.beginPath(); ctx.arc(sx(s.x), sy(s.y), s.R * (1.1 - a * .2), s.a - s.arc / 2, s.a + s.arc / 2); ctx.stroke(); ctx.strokeStyle = `rgba(200,140,80,${a * .6})`; ctx.lineWidth = 2; ctx.stroke(); }
$o$, $n$  for (const s of SLASH) { const a = s.t / .22, k = 1 - a, cx = sx(s.x), cy = sy(s.y), R = s.R * (.85 + k * .3), a0 = s.a - s.arc / 2, a1 = s.a + s.arc / 2, sweep = a0 + (a1 - a0) * Math.min(1, k * 2.2);
    ctx.save(); ctx.globalAlpha = a; const g = ctx.createRadialGradient(cx, cy, R * .45, cx, cy, R); g.addColorStop(0, 'rgba(255,245,210,0)'); g.addColorStop(.75, 'rgba(255,235,170,.55)'); g.addColorStop(1, 'rgba(255,255,255,.95)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, a0, sweep); ctx.arc(cx, cy, R * .45, sweep, a0, true); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, R, a0, sweep); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,150,.5)'; ctx.lineWidth = 1; for (let n = 1; n <= 3; n++) { ctx.beginPath(); ctx.arc(cx, cy, R * (.5 + n * .12), a0, sweep); ctx.stroke(); }
    ctx.restore(); }
$n$), $o$  for (const o of es) { const x = sx(o.x), y = sy(o.y); if (x < -60 || x > W + 60 || y < -60 || y > H + 60) continue; drawEnemy(o, x, y, t); }
$o$, $n$  for (const o of es) { const x = sx(o.x), y = sy(o.y); if (x < -60 || x > W + 60 || y < -60 || y > H + 60) continue;
    if (o.elite) { ctx.save(); ctx.shadowColor = EL_COL[o.d.el] || '#fff'; ctx.shadowBlur = 18 + Math.sin(t * 8) * 6; drawEnemy(o, x, y, t); ctx.restore(); ctx.strokeStyle = EL_COL[o.d.el] || '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + o.r * .95, o.r * 1.1, o.r * .4, 0, 0, 6.283); ctx.stroke(); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x - o.r, y - o.r * 1.4 - 10, o.r * 2, 4); ctx.fillStyle = EL_COL[o.d.el]; ctx.fillRect(x - o.r, y - o.r * 1.4 - 10, o.r * 2 * Math.max(0, o.hp / o.maxhp), 4); }
    else drawEnemy(o, x, y, t); }
  // 적 투사체
  for (const b of EB) { const x = sx(b.x), y = sy(b.y); const g = ctx.createRadialGradient(x, y, 1, x, y, 9); g.addColorStop(0, '#fff'); g.addColorStop(.4, '#ff9a4a'); g.addColorStop(1, 'rgba(255,80,30,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.283); ctx.fill(); }
$n$), $o$  drawGround(st);
$o$, $n$  drawGround(st);
  // 경계 (귀신의 숲: 위아래 나무 벽)
  if (st.bound) { for (const sgn of [-1, 1]) { const yb = sy(sgn * st.bound); const y0 = sgn < 0 ? yb - 140 : yb, y1 = sgn < 0 ? yb : yb + 140; if (y1 < 0 || y0 > H) continue; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, y0, W, y1 - y0); for (let x = -((cam.x) % 34) - 34; x < W + 34; x += 34) drawTree(x, sgn < 0 ? yb - 6 : yb + 30, 1.3); } }
  // 장애물
  for (const b of nearObst(cam.x, cam.y)) { const x = sx(b.x), y = sy(b.y); if (x < -80 || x > W + 80 || y < -80 || y > H + 80) continue;
    if (b.k === 'tree') drawTree(x, y, 1);
    else if (b.k === 'wall') { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x - b.w/2 + 3, y - b.h/2 + 6, b.w, b.h); const g = ctx.createLinearGradient(0, y - b.h/2, 0, y + b.h/2); g.addColorStop(0, '#6a5a4a'); g.addColorStop(1, '#3a2f26'); ctx.fillStyle = g; ctx.fillRect(x - b.w/2, y - b.h/2 - 10, b.w, b.h + 10); ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1; ctx.strokeRect(x - b.w/2, y - b.h/2 - 10, b.w, b.h + 10); ctx.strokeStyle = 'rgba(0,0,0,.25)'; for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - b.w/2, y - b.h/2 - 10 + k * 10); ctx.lineTo(x + b.w/2, y - b.h/2 - 10 + k * 10); ctx.stroke(); } }
    else if (b.k === 'fire') { const f = 1 + Math.sin(t * 9 + b.x) * .08; const g = ctx.createRadialGradient(x, y, 2, x, y, b.r * 1.2); g.addColorStop(0, 'rgba(255,230,120,.9)'); g.addColorStop(.45, 'rgba(255,120,40,.6)'); g.addColorStop(1, 'rgba(120,30,10,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, b.r * f, b.r * .7 * f, 0, 0, 6.283); ctx.fill(); for (let k = 0; k < 4; k++) { const a = t * 3 + k * 1.6 + b.y; ctx.fillStyle = 'rgba(255,200,90,.8)'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * b.r * .5, y - 8 - ((t * 40 + k * 23) % 30), 2, 0, 6.283); ctx.fill(); } } }
  // 장판
  for (const z of ZONE) { const x = sx(z.x), y = sy(z.y), a = Math.min(1, z.life / 1.5); ctx.fillStyle = `rgba(95,200,255,${.22 * a})`; ctx.beginPath(); ctx.ellipse(x, y, z.r, z.r * .7, 0, 0, 6.283); ctx.fill(); ctx.strokeStyle = `rgba(160,230,255,${.6 * a})`; ctx.lineWidth = 1.5; ctx.stroke(); }
  // 상자
  for (const c of CHESTS) { const x = sx(c.x), y = sy(c.y) - Math.abs(Math.sin(c.t * 4)) * 4; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x, sy(c.y) + 8, 12, 4, 0, 0, 6.283); ctx.fill(); ctx.shadowColor = c.grade.col; ctx.shadowBlur = 12; ctx.fillStyle = '#6a4a2a'; rr(x - 11, y - 8, 22, 16, 3); ctx.fill(); ctx.fillStyle = c.grade.col; ctx.fillRect(x - 11, y - 8, 22, 5); ctx.fillRect(x - 2, y - 8, 4, 16); ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1; rr(x - 11, y - 8, 22, 16, 3); ctx.stroke(); }
$n$), $o$  }
  ctx.restore();
}
$o$, $n$  }
  ctx.restore();
}
function drawTree(x, y, sc) { ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, 4, 14, 5, 0, 0, 6.283); ctx.fill(); ctx.fillStyle = '#3a2a1c'; ctx.fillRect(-3, -16, 6, 20); ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1; ctx.strokeRect(-3, -16, 6, 20);
  for (const [dx, dy, r, c] of [[-8,-20,11,'#1c3a22'],[8,-22,11,'#1c3a22'],[0,-30,12,'#254a2a'],[0,-20,10,'#2f5a33']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(dx, dy, r, 0, 6.283); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.stroke(); } ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.arc(-3, -32, 5, 0, 6.283); ctx.fill(); ctx.restore(); }
$n$), $o$  else if (o.type === 'water') { const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 1.2); g.addColorStop(0, '#d4fff2'); g.addColorStop(1, '#2a7a6a'); ctx.fillStyle = hit ? '#fff' : g; ctx.beginPath(); ctx.arc(0, -r*.2, r * .9, 0, 6.283); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.stroke(); ctx.strokeStyle = '#1f4f45'; ctx.lineWidth = 2; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(k * r * .4, -r * 1.1); ctx.quadraticCurveTo(k * r * .6, -r * .2, k * r * .35, r * .9); ctx.stroke(); } }
  else if (o.type === 'gumiho') { const g = ctx.createRadialGradient(0, -r*.3, 1, 0, 0, r * 1.2); g.addColorStop(0, '#ffe3c0'); g.addColorStop(1, '#c86a2a'); ctx.fillStyle = hit ? '#fff' : g; ctx.beginPath(); ctx.ellipse(0, 0, r * .9, r * .75, 0, 0, 6.283); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.stroke(); for (let k = 0; k < 5; k++) { const a = -2.6 - k * .35 + Math.sin(t * 3 + k) * .1; ctx.strokeStyle = '#f2a65a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-r*.5, 0); ctx.quadraticCurveTo(Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.5, Math.cos(a) * r * 2.1, Math.sin(a) * r * 2.1); ctx.stroke(); } ctx.fillStyle = '#c86a2a'; ctx.beginPath(); ctx.moveTo(-r*.6, -r*.5); ctx.lineTo(-r*.4, -r*1.2); ctx.lineTo(-r*.1, -r*.6); ctx.moveTo(r*.6, -r*.5); ctx.lineTo(r*.4, -r*1.2); ctx.lineTo(r*.1, -r*.6); ctx.fill(); }
  else if (o.boss) { // 두억시니·이무기
$o$, $n$  else if (o.type === 'water') { blit('water', Math.floor(t * 5 + o.ph) % 2, 0, r * 1.0 + Math.sin(t * 4 + o.ph) * 1.5, o.x > P.x, hit); }
  else if (o.type === 'gumiho') { blit('gumiho', Math.floor(t * 7 + o.ph) % 2, 0, r * 1.0, o.x > P.x, hit); }
  else if (o.type === '_water') { const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 1.2); g.addColorStop(0, '#d4fff2'); g.addColorStop(1, '#2a7a6a'); ctx.fillStyle = hit ? '#fff' : g; ctx.beginPath(); ctx.arc(0, -r*.2, r * .9, 0, 6.283); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.stroke(); ctx.strokeStyle = '#1f4f45'; ctx.lineWidth = 2; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(k * r * .4, -r * 1.1); ctx.quadraticCurveTo(k * r * .6, -r * .2, k * r * .35, r * .9); ctx.stroke(); } }
  else if (o.type === '_gumiho') { const g = ctx.createRadialGradient(0, -r*.3, 1, 0, 0, r * 1.2); g.addColorStop(0, '#ffe3c0'); g.addColorStop(1, '#c86a2a'); ctx.fillStyle = hit ? '#fff' : g; ctx.beginPath(); ctx.ellipse(0, 0, r * .9, r * .75, 0, 0, 6.283); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.stroke(); for (let k = 0; k < 5; k++) { const a = -2.6 - k * .35 + Math.sin(t * 3 + k) * .1; ctx.strokeStyle = '#f2a65a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-r*.5, 0); ctx.quadraticCurveTo(Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.5, Math.cos(a) * r * 2.1, Math.sin(a) * r * 2.1); ctx.stroke(); } ctx.fillStyle = '#c86a2a'; ctx.beginPath(); ctx.moveTo(-r*.6, -r*.5); ctx.lineTo(-r*.4, -r*1.2); ctx.lineTo(-r*.1, -r*.6); ctx.moveTo(r*.6, -r*.5); ctx.lineTo(r*.4, -r*1.2); ctx.lineTo(r*.1, -r*.6); ctx.fill(); }
  else if (o.boss) { blit(o.type, Math.floor(t * 3) % 2, 0, r * .95, o.x > P.x, hit, o.type === 'boss1' ? 1.6 : 2.0); if (o.charging > 0) { ctx.strokeStyle = 'rgba(255,120,80,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r * 1.25, 0, 6.283); ctx.stroke(); }
    ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(-r, -r - 14, r * 2, 6); ctx.fillStyle = o.type === 'boss1' ? '#ff6a4a' : '#5fe08a'; ctx.fillRect(-r, -r - 14, r * 2 * Math.max(0, o.hp / o.maxhp), 6); }
  else if (o.type === '_boss') { // (벡터 보스 — 미사용)
$n$), $o$  if (o.type === 'egg') { const g = ctx.createRadialGradient(-r*.3, -r*.5, 1, 0, 0, r * 1.3); g.addColorStop(0, '#fff'); g.addColorStop(1, '#b9b0a4'); ctx.fillStyle = hit ? '#fff' : g; ctx.beginPath(); ctx.ellipse(0, -r * .2, r * .8, r * 1.05, 0, 0, 6.283); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1; ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.moveTo(-r*.4, -r*.9); ctx.quadraticCurveTo(-r*.6, -r*.2, -r*.3, r*.6); ctx.stroke(); }
  else if (o.type === 'fire') { const f = 1 + Math.sin(t * 14 + o.ph) * .12; const g = ctx.createRadialGradient(0, -r*.2, 1, 0, -r*.2, r * 1.4); g.addColorStop(0, '#fff'); g.addColorStop(.35, '#9fe8ff'); g.addColorStop(1, 'rgba(60,140,220,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -r * 1.8 * f); ctx.quadraticCurveTo(r * 1.1, -r * .4, 0, r * .8); ctx.quadraticCurveTo(-r * 1.1, -r * .4, 0, -r * 1.8 * f); ctx.fill(); ctx.fillStyle = '#1a2a44'; ctx.fillRect(-3, -r*.5, 2, 2); ctx.fillRect(1, -r*.5, 2, 2); }
  else if (o.type === 'jiangshi') { const hop = Math.max(0, Math.sin(o.hop)) * 6; ctx.translate(0, -hop); const g = ctx.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#7f9ff0'); g.addColorStop(1, '#3a4f9a'); ctx.fillStyle = hit ? '#fff' : g; ctx.beginPath(); ctx.moveTo(-r*.7, -r*.5); ctx.lineTo(r*.7, -r*.5); ctx.lineTo(r*.85, r); ctx.lineTo(-r*.85, r); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1; ctx.stroke();
$o$, $n$  if (o.type === 'egg') { blit('egg', Math.floor(t * 4 + o.ph) % 2, 0, r * .95, o.x > P.x, hit); }
  else if (o.type === 'fire') { blit('fire', Math.floor(t * 9 + o.ph) % 2, 0, r * .9 + Math.sin(t * 7 + o.ph) * 1.5, false, hit); }
  else if (o.type === 'jiangshi') { const hop = Math.max(0, Math.sin(o.hop)) * 8; blit('jiangshi', hop > 2 ? 1 : 0, 0, r * 1.1 - hop, o.x > P.x, hit); }
  else if (o.type === '_egg') { const g = ctx.createRadialGradient(-r*.3, -r*.5, 1, 0, 0, r * 1.3); g.addColorStop(0, '#fff'); g.addColorStop(1, '#b9b0a4'); ctx.fillStyle = hit ? '#fff' : g; ctx.beginPath(); ctx.ellipse(0, -r * .2, r * .8, r * 1.05, 0, 0, 6.283); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1; ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.moveTo(-r*.4, -r*.9); ctx.quadraticCurveTo(-r*.6, -r*.2, -r*.3, r*.6); ctx.stroke(); }
  else if (o.type === '_fire') { const f = 1 + Math.sin(t * 14 + o.ph) * .12; const g = ctx.createRadialGradient(0, -r*.2, 1, 0, -r*.2, r * 1.4); g.addColorStop(0, '#fff'); g.addColorStop(.35, '#9fe8ff'); g.addColorStop(1, 'rgba(60,140,220,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -r * 1.8 * f); ctx.quadraticCurveTo(r * 1.1, -r * .4, 0, r * .8); ctx.quadraticCurveTo(-r * 1.1, -r * .4, 0, -r * 1.8 * f); ctx.fill(); ctx.fillStyle = '#1a2a44'; ctx.fillRect(-3, -r*.5, 2, 2); ctx.fillRect(1, -r*.5, 2, 2); }
  else if (o.type === '_jiangshi') { const hop = Math.max(0, Math.sin(o.hop)) * 6; ctx.translate(0, -hop); const g = ctx.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#7f9ff0'); g.addColorStop(1, '#3a4f9a'); ctx.fillStyle = hit ? '#fff' : g; ctx.beginPath(); ctx.moveTo(-r*.7, -r*.5); ctx.lineTo(r*.7, -r*.5); ctx.lineTo(r*.85, r); ctx.lineTo(-r*.85, r); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1; ctx.stroke();
$n$), $o$  const bob = P.moving ? Math.sin(P.walk) * 2 : Math.sin(t * 2) * .8, lean = P.moving ? P.dx * .12 : 0, flip = P.dx < 0 ? -1 : 1;
  ctx.save(); ctx.translate(x, y + bob); ctx.rotate(lean); ctx.scale(flip, 1);
  if (S.hitT > 0) { ctx.shadowColor = '#ff6a4a'; ctx.shadowBlur = 16; }
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, 14 - bob, 11, 4, 0, 0, 6.283); ctx.fill();
  const leg = P.moving ? Math.sin(P.walk) * 4 : 0; ctx.strokeStyle = '#2b2a3a'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(-3, 6); ctx.lineTo(-3 - leg, 14); ctx.moveTo(3, 6); ctx.lineTo(3 + leg, 14); ctx.stroke();
  const rg = ctx.createLinearGradient(-10, -10, 10, 12); rg.addColorStop(0, '#f4efe2'); rg.addColorStop(1, '#b8b09a'); ctx.fillStyle = rg; // 도포
  ctx.beginPath(); ctx.moveTo(-8, -8); ctx.quadraticCurveTo(-12, 4, -10, 9); ctx.lineTo(10, 9); ctx.quadraticCurveTo(12, 4, 8, -8); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = '#8a2a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-9, 1); ctx.lineTo(9, 1); ctx.stroke();  // 띠
  ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(2, 8); ctx.stroke();
  ctx.fillStyle = '#f0c9a0'; ctx.beginPath(); ctx.arc(0, -12, 5.5, 0, 6.283); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.stroke();   // 얼굴
  ctx.fillStyle = '#1a1612'; ctx.beginPath(); ctx.ellipse(0, -17, 12, 2.4, 0, 0, 6.283); ctx.fill();   // 갓
  ctx.fillStyle = '#221c17'; ctx.beginPath(); ctx.moveTo(-5, -17); ctx.lineTo(-3.5, -25); ctx.lineTo(3.5, -25); ctx.lineTo(5, -17); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.stroke();
  ctx.fillStyle = '#1a1612'; ctx.fillRect(2, -13, 1.5, 1.5); ctx.fillRect(-1, -13, 1.5, 1.5);
  ctx.restore();
$o$, $n$  const bob = P.moving ? Math.abs(Math.sin(P.walk)) * 1.5 : Math.sin(t * 2) * .6, frame = P.moving ? (Math.floor(P.walk / 1.6) % 2 ? 1 : 2) : 0, flip = P.dx < 0;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x, y + 13, 11, 4, 0, 0, 6.283); ctx.fill();
  if (S.hitT > 0) { ctx.save(); ctx.shadowColor = '#ff6a4a'; ctx.shadowBlur = 16; blit('hero', frame, x, y + 14 - bob, flip, Math.floor(S.hitT * 30) % 2 === 0); ctx.restore(); }
  else blit('hero', frame, x, y + 14 - bob, flip);
$n$), $o$function float(x, y, txt, col, sz = 14) { FL.push({ x, y, txt, col, sz, life:1.1 }); }
$o$, $n$function float(x, y, txt, col, sz = 14) { FL.push({ x, y, txt, col, sz, life:1.1 }); }


// ───────── 도트 스프라이트 (문자 격자 → 오프스크린 캔버스, 2x) ─────────
const PAL = { u:'#5fc8ff', F:'#f2a65a', D:'#6a1a12', d:'#a8352a', O:'#ff8a6a', T:'#fff', g:'#114a2a', M:'#3fa06a', m:'#8ff0b0', K:'#1a1612', H:'#221c17', S:'#f0c9a0', W:'#f4efe2', w:'#c9c0a8', R:'#8a2a2a', B:'#2b2a3a', E:'#fbf8f2', e:'#c8c0b4', L:'#bfeeff', l:'#4fa8e8', N:'#1a1f44', G:'#b8dcc0', Y:'#f2d26a', C:'#5a6fc0', c:'#3a4f9a', r:'#c0362a' };
const GRIDS = {
  hero: [[
'............','....HHHH....','....HHHH....','....HHHH....','.HHHHHHHHHH.','..KSSSSSSK..','..KSKSSKSK..','..KSSSSSSK..','...KWWWWK...','..KWWWWWWK..','.KWWWWWWWWK.','.KWRRRRRRWK.','.KWWWWWWWWK.','.KWWWwWWWWK.','.KWWWwWWWWK.','.KWWWwWWWWK.','..KWWwWWWK..','..KBB..BBK..','..KBB..BBK..','..KKK..KKK..'],[
'............','....HHHH....','....HHHH....','....HHHH....','.HHHHHHHHHH.','..KSSSSSSK..','..KSKSSKSK..','..KSSSSSSK..','...KWWWWK...','..KWWWWWWK..','.KWWWWWWWWK.','.KWRRRRRRWK.','.KWWWWWWWWK.','.KWWWwWWWWK.','.KWWWwWWWWK.','.KWWWwWWWWK.','..KWWwWWWK..','.KBB....BBK.','KBB......BBK','KKK......KKK'],[
'............','....HHHH....','....HHHH....','....HHHH....','.HHHHHHHHHH.','..KSSSSSSK..','..KSKSSKSK..','..KSSSSSSK..','...KWWWWK...','..KWWWWWWK..','.KWWWWWWWWK.','.KWRRRRRRWK.','.KWWWWWWWWK.','.KWWWwWWWWK.','.KWWWwWWWWK.','.KWWWwWWWWK.','..KWWwWWWK..','...KBBBBK...','...KBBBBK...','...KKKKKK...']],
  egg: [[
'...KKKK...','..KEEEEK..','.KEEEEEEK.','.KEeEEEEK.','KEEEEEEEEK','KEEKEEKEEK','KEEEEEEEEK','KEeEEEEEEK','.KEeEEEEK.','.KEEeeEEK.','..KEEEEK..','...KKKK...'],[
'...KKKK...','..KEEEEK..','.KEEEEEEK.','.KEeEEEEK.','KEEEEEEEEK','KEEEEEEEEK','KEEKEEKEEK','KEeEEEEEEK','.KEeEEEEK.','.KEEeeEEK.','..KEEEEK..','...KKKK...']],
  fire: [[
'....L...','...LL...','..LLlL..','..LlLL..','.LLEELL.','.LEEEEL.','LLEEEELL','LLEKEKLL','.LEEEEL.','.LLEELL.','..LLLL..','...LL...'],[
'...L....','...LL...','..LlLL..','..LLlL..','.LLEELL.','.LEEEEL.','LLEEEELL','LLEKEKLL','.LEEEEL.','.LLEELL.','..LLLL..','...ll...']],
  jiangshi: [[
'...NNNNNN...','..NNNNNNNN..','..KGGGGGGK..','..KGKGGKGK..','..KGGYYGGK..','...KGYrGK...','...KCCCCK...','KKKCCCCCCKKK','KCCCCCCCCCCK','KKKCcCCcCKKK','..KCcCCcCK..','..KCCCCCCK..','..KCcCCcCK..','..KCCCCCCK..','..KCCCCCCK..','..KKCCCCKK..','..KBB..BBK..','..KKK..KKK..'],[
'...NNNNNN...','..NNNNNNNN..','..KGGGGGGK..','..KGKGGKGK..','..KGGYYGGK..','...KGYrGK...','...KCCCCK...','KKKCCCCCCKKK','KCCCCCCCCCCK','KKKCcCCcCKKK','..KCcCCcCK..','..KCCCCCCK..','..KCcCCcCK..','..KCCCCCCK..','..KCCCCCCK..','..KKCCCCKK..','...KBBBBK...','...KKKKKK...']],
  water: [[
'....KKKK....','...KEEEEK...','..KEEEEEEK..','..KEKEEKEK..','..KEEEEEEK..','.KEEEEEEEEK.','.KEEEEEEEEK.','KEEEEEEEEEEK','KEuEEEEEEuEK','KEEuEEEEuEEK','.KEEuEEuEEK.','.KuEEEEEEuK.','..KuEEEEuK..','...KKuuKK...'],[
'....KKKK....','...KEEEEK...','..KEEEEEEK..','..KEKEEKEK..','..KEEEEEEK..','.KEEEEEEEEK.','.KEEEEEEEEK.','KEEEEEEEEEEK','KEEuEEEEuEEK','KEuEEEEEEuEK','.KEEuEEuEEK.','.KuEEEEEEuK.','..KEuEEuEK..','...KKuuKK...']],
  gumiho: [[
'..K........K..','.KFK......KFK.','.KFFK....KFFK.','..KFFKKKKFFK..','..KFFFFFFFFK..','..KFKFFFFKFK..','..KFFFFFFFFK..','...KFFKKFFK...','....KFFFFK....','.KK.KFFFFK.KK.','KFFKKFFFFKKFFK','KFFFFFFFFFFFFK','.KFFFKFFKFFFK.','..KKK.KK.KKK..'],[
'..K........K..','.KFK......KFK.','.KFFK....KFFK.','..KFFKKKKFFK..','..KFFFFFFFFK..','..KFKFFFFKFK..','..KFFFFFFFFK..','...KFFKKFFK...','....KFFFFK....','KK..KFFFFK..KK','KFFKKFFFFKKFFK','.KFFFFFFFFFFK.','..KFFKFFKFFK..','...KK.KK.KK...']],
  boss1: [[
'..KK............KK..','.KDDK..........KDDK.','.KDDDK........KDDDK.','.KDDDDKKKKKKKKDDDDK.','.KDDDddddddddddDDDK.','.KDdddddddddddddddK.','KDddddddddddddddddDK','KDddYYddddddddYYdddK','KDddYKYddddddYKYdddK','KDddYYddddddddYYdddK','KDdddddddddddddddddK','KDdddddddddddddddddK','KDddKTTTTTTTTTTKdddK','KDddKTKTKTKTKTKKdddK','KDdddKKKKKKKKKKddddK','.KDdddddddddddddddK.','.KDDddddddddddddDDK.','..KDDDDDDDDDDDDDDK..','...KKKKKKKKKKKKKK...','....................'],[
'..KK............KK..','.KDDK..........KDDK.','.KDDDK........KDDDK.','.KDDDDKKKKKKKKDDDDK.','.KDDDddddddddddDDDK.','.KDdddddddddddddddK.','KDddddddddddddddddDK','KDddYYddddddddYYdddK','KDddKYYddddddYYKdddK','KDddYYddddddddYYdddK','KDdddddddddddddddddK','KDdddddddddddddddddK','KDddKTTTTTTTTTTKdddK','KDddKKTKTKTKTKTKdddK','KDdddKKKKKKKKKKddddK','.KDdddddddddddddddK.','.KDDddddddddddddDDK.','..KDDDDDDDDDDDDDDK..','...KKKKKKKKKKKKKK...','....................']],
  boss2: [[
'......KKKKKKKK......','....KKMMMMMMMMKK....','...KMMmmmmmmmmMMK...','..KMmmmmmmmmmmmmMK..','.KMmmYYmmmmmmYYmmMK.','.KMmmYKmmmmmmKYmmMK.','KMmmmmmmmmmmmmmmmmMK','KMmmmmmmmmmmmmmmmmMK','KMmmmKKKKKKKKKKmmmMK','KMmmmKTTKTTKTTKmmmMK','.KMmmmKKKKKKKKmmmMK.','.KMMmmmmmmmmmmmmMMK.','..KgMMMMMMMMMMMMgK..','..KggMMMMMMMMMMggK..','...KgggMMMMMMgggK...','...KKggggggggggKK...','....KgggggggggK.....','....KKgggggggKK.....','.....KKKKKKKKK......','....................'],[
'......KKKKKKKK......','....KKMMMMMMMMKK....','...KMMmmmmmmmmMMK...','..KMmmmmmmmmmmmmMK..','.KMmmYYmmmmmmYYmmMK.','.KMmmKYmmmmmmYKmmMK.','KMmmmmmmmmmmmmmmmmMK','KMmmmmmmmmmmmmmmmmMK','KMmmmKKKKKKKKKKmmmMK','KMmmmKTTKTTKTTKmmmMK','.KMmmmKKKKKKKKmmmMK.','.KMMmmmmmmmmmmmmMMK.','..KgMMMMMMMMMMMMgK..','..KggMMMMMMMMMMggK..','...KgggMMMMMMgggK...','....KKggggggggKK....','.....KgggggggggK....','.....KKgggggggKK....','......KKKKKKKKK.....','....................']],
};
const SPRITES = {}; const PX = 2;
function sprite(name, frame, flash) {
  const key = name + frame + (flash ? 'f' : ''); if (SPRITES[key]) return SPRITES[key];
  const g = GRIDS[name][frame % GRIDS[name].length], w = g[0].length, h = g.length, c = document.createElement('canvas'); c.width = w * PX; c.height = h * PX; const x = c.getContext('2d');
  for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) { const ch = g[r][q]; if (ch === '.') continue; x.fillStyle = flash ? '#ffffff' : PAL[ch]; x.fillRect(q * PX, r * PX, PX, PX); }
  return SPRITES[key] = c;
}
function blit(name, frame, x, y, flip, flash, scale = 1) { const c = sprite(name, frame, flash); ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1); ctx.imageSmoothingEnabled = false; ctx.drawImage(c, -c.width * scale / 2, -c.height * scale, c.width * scale, c.height * scale); ctx.restore(); }
$n$), $o$  const v = inputVec(); P.moving = v.x || v.y; if (P.moving) { P.x += v.x * P.spd * dt; P.y += v.y * P.spd * dt; P.dx = v.x; P.dy = v.y; P.walk += dt * 9; }
$o$, $n$  const v = inputVec(); P.moving = v.x || v.y; const spd = P.spd * (S.slowT > 0 ? .65 : 1); if (P.moving) { P.x += v.x * spd * dt; P.y += v.y * spd * dt; P.dx = v.x; P.dy = v.y; P.walk += dt * 9; }
  collideObst(P); const st = STAGES[S.stage]; if (st.bound) P.y = Math.max(-st.bound + P.r, Math.min(st.bound - P.r, P.y));
  for (const b of nearObst(P.x, P.y)) if (b.hazard && Math.hypot(P.x - b.x, P.y - b.y) < b.r) { S.hp -= 6 * dt; S.hitT = .15; S.burnT = Math.max(S.burnT, .5); }
  if (S.burnT > 0) { S.burnT -= dt; S.hp -= 1.2 * dt; if (Math.random() < dt * 8) burst(P.x + (Math.random()-.5)*10, P.y - 10, 1, '#ff9a4a', 40); } if (S.slowT > 0) S.slowT -= dt;
$n$), $o$      SLASH.push({ x:P.x, y:P.y, a, R, arc, t:.22 }); SND.sword();
      for (let i = E.length - 1; i >= 0; i--) { const o = E[i], dx = o.x - P.x, dy = o.y - P.y, d = Math.hypot(dx, dy); if (d > R + o.r) continue; let da = Math.atan2(dy, dx) - a; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) <= arc / 2) hurtEnemy(o, dmg, dx / d * 120, dy / d * 120); }
$o$, $n$      SLASH.push({ x:P.x, y:P.y, a, R, arc, t:.22 }); SND.sword(); S.shake = Math.max(S.shake, 1.5);
      for (let i = E.length - 1; i >= 0; i--) { const o = E[i], dx = o.x - P.x, dy = o.y - P.y, d = Math.hypot(dx, dy); if (d > R + o.r) continue; let da = Math.atan2(dy, dx) - a; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) <= arc / 2) { hurtEnemy(o, dmg, dx / d * 120, dy / d * 120); burst(o.x, o.y, 3, '#fff2c0', 90); } }
$n$), $o$  dropGem(o.x, o.y, o.d.xp); if (o.boss) { S.coins += 30; float(o.x, o.y - 30, o.d.name + ' 퇴치!', '#e8c15a', 18); S.shake = 8; S.freeze = .12; } else if (Math.random() < .05) { S.coins++; }
$o$, $n$  dropGem(o.x, o.y, o.d.xp); if (o.boss) { S.coins += 30; float(o.x, o.y - 30, o.d.name + ' 퇴치!', '#e8c15a', 18); S.shake = 8; S.freeze = .12; } else if (o.elite) { let r = Math.random(), grade = CHEST[0]; for (const g of CHEST) { if (r < g.p) { grade = g; break; } r -= g.p; } CHESTS.push({ x:o.x, y:o.y, grade, t:0 }); S.coins += 8; float(o.x, o.y - 30, `${grade.g} 상자!`, grade.col, 16); S.shake = 5; } else if (Math.random() < .05) { S.coins++; }
$n$), $o$  o.hp -= dmg; o.hit = .12; o.kx += kx; o.ky += ky;
$o$, $n$  o.hp -= dmg; o.hit = .12; if (!o.boss) { const kb = o.elite ? .3 : 1; o.kx += kx * kb; o.ky += ky * kb; }   // 보스는 넉백 면역, 정예는 30%
$n$), $o$  if (contacts && S.hitT > 0 && Math.random() < dt * 6) SND.hurt();
$o$, $n$  if (contacts && S.hitT > 0 && Math.random() < dt * 6) SND.hurt();
  // 적 투사체
  for (let i = EB.length - 1; i >= 0; i--) { const b = EB[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; if (b.life <= 0) { EB.splice(i, 1); continue; } if (Math.hypot(b.x - P.x, b.y - P.y) < P.r + 6) { S.hp -= 9; S.hitT = .2; S.burnT = Math.max(S.burnT, 2); SND.hurt(); burst(b.x, b.y, 6, '#ff7a4a', 90); EB.splice(i, 1); } }
  // 장판 (물웅덩이: 안에 있으면 둔화)
  for (let i = ZONE.length - 1; i >= 0; i--) { const z = ZONE[i]; z.life -= dt; if (z.life <= 0) { ZONE.splice(i, 1); continue; } if (Math.hypot(z.x - P.x, z.y - P.y) < z.r) S.slowT = Math.max(S.slowT, .3); }
  // 상자
  for (let i = CHESTS.length - 1; i >= 0; i--) { const c = CHESTS[i]; c.t += dt; if (Math.hypot(c.x - P.x, c.y - P.y) < P.r + 14) { CHESTS.splice(i, 1); openChest(c); } }
}
function bossPattern(o) {
  const pat = o.d.patterns[1];
  if (pat === 'shoot') { const a0 = Math.atan2(P.y - o.y, P.x - o.x); for (let k = -2; k <= 2; k++) { const a = a0 + k * .28; EB.push({ x:o.x, y:o.y, vx:Math.cos(a) * 190, vy:Math.sin(a) * 190, life:2.2 }); } SND.talisman(); float(o.x, o.y - o.r - 20, '불꽃 뿜기', '#ff7a4a', 13); }
  else if (pat === 'pool') { for (let k = 0; k < 3; k++) { const a = Math.random() * 6.283, d = 40 + Math.random() * 110; ZONE.push({ x:P.x + Math.cos(a) * d, y:P.y + Math.sin(a) * d, r:46, life:8, max:8 }); } SND.bell(); float(o.x, o.y - o.r - 20, '물웅덩이', '#5fc8ff', 13); }
}
function openChest(c) {
  const g = c.grade; let got = []; S.mode = 'chest';
  for (let k = 0; k < g.n; k++) { const cands = WEAPONS.filter(w => P.w[w.id] && P.w[w.id] < w.max); if (!cands.length) { S.coins += 10; got.push('엽전 +10'); continue; } const w = cands[Math.floor(Math.random() * cands.length)]; P.w[w.id]++; got.push(`${w.name} Lv ${P.w[w.id]}`); }
  SND.levelup(); S.flash = 1;
  document.getElementById('chTitle').textContent = `${g.g} 상자`; document.getElementById('chTitle').style.color = g.col; document.getElementById('chList').innerHTML = got.map(x => `<div class="stat"><span>${x}</span><b>↑</b></div>`).join('');
  show('chest', true);
}
document.getElementById('chBtn').addEventListener('click', () => { show('chest', false); S.mode = 'play'; });
// ───────── 장애물 (청크 해시 생성) ─────────
function obstAt(cx, cy) { // 청크 (256px) 안의 장애물 목록
  const key = cx * 100003 + cy; let a = OB.get(key); if (a) return a; a = []; const st = STAGES[S.stage]; if (!st.obst) { OB.set(key, a); return a; }
  let h = ((cx * 73856093) ^ (cy * 19349663) ^ (S.stage * 83492791)) >>> 0; const rnd = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
  const n = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) { const x = cx * 256 + rnd() * 256, y = cy * 256 + rnd() * 256; if (Math.hypot(x, y) < 90) continue; if (st.bound && Math.abs(y) > st.bound - 24) continue;
    const r = rnd();
    if (st.obst.tree && r < st.obst.tree) a.push({ k:'tree', x, y, r:15, solid:true });
    else if (st.obst.wall && r < st.obst.wall) a.push({ k:'wall', x, y, w:60 + rnd() * 70, h:22, solid:true });
    else if (st.obst.fire && r < st.obst.wall + st.obst.fire) a.push({ k:'fire', x, y, r:26, hazard:true });
  }
  OB.set(key, a); return a;
}
function nearObst(x, y) { const cx = Math.floor(x / 256), cy = Math.floor(y / 256), out = []; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const o of obstAt(cx + i, cy + j)) out.push(o); return out; }
function collideObst(o) { // o: {x,y,r}
  for (const b of nearObst(o.x, o.y)) { if (!b.solid) continue;
    if (b.k === 'tree') { let dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy); const md = o.r + b.r; if (d < .01) { dx = 1; dy = 0; d = 1; } if (d < md) { o.x += dx / d * (md - d); o.y += dy / d * (md - d); } }
    else { const nx = Math.max(b.x - b.w / 2, Math.min(b.x + b.w / 2, o.x)), ny = Math.max(b.y - b.h / 2, Math.min(b.y + b.h / 2, o.y)), dx = o.x - nx, dy = o.y - ny, d = Math.hypot(dx, dy); if (d < o.r) { if (d < .01) { o.y = b.y - b.h / 2 - o.r; } else { o.x += dx / d * (o.r - d); o.y += dy / d * (o.r - d); } } } }
$n$), $o$    // 접촉
    if (dist < o.r + P.r && contacts < 8) { contacts++; const dmg = C.CONTACT * (o.boss ? 5.5 : 1) * dt; S.hp -= dmg; S.hitT = .15; }
$o$, $n$    collideObst(o); if (STAGES[S.stage].bound) o.y = Math.max(-STAGES[S.stage].bound + o.r, Math.min(STAGES[S.stage].bound - o.r, o.y));
    // 접촉 (+ 보스 속성 디버프: 화 → 화상, 수 → 둔화)
    if (dist < o.r + P.r && contacts < 8) { contacts++; const dmg = C.CONTACT * (o.boss ? 5.5 : o.elite ? 2 : 1) * dt; S.hp -= dmg; S.hitT = .15; if (o.boss) { if (o.d.el === 'fire') S.burnT = 3; if (o.d.el === 'water') S.slowT = 2; } }
$n$), $o$    let sp = o.d.spd * (o.slow > 0 ? 1 - .2 : 1); if (o.d.hop) { o.hop += dt * 5; sp *= Math.max(0, Math.sin(o.hop)) * 2.2; }
$o$, $n$    let sp = o.d.spd * (o.slow > 0 ? 1 - .2 : 1); if (o.d.hop) { o.hop += dt * 5; sp *= Math.max(0, Math.sin(o.hop)) * 2.2; }
    sp *= ARMOR_SPD[o.d.armor] || 1; if (o.elite) sp *= .9;
    if (o.boss) { // 패턴 1: 돌진 (공통) · 패턴 2: 투사체(두억시니) / 물웅덩이(이무기)
      o.chargeT -= dt; if (o.chargeT <= 0) { o.charging = .7; o.chargeT = 3.2 + Math.random(); SND.boss(); } if (o.charging > 0) { o.charging -= dt; sp *= 3.2; }
      o.patT -= dt; if (o.patT <= 0) { o.patT = 4 + Math.random() * 1.5; bossPattern(o); } }
$n$), $o$  if (!S.bossDone[1] && S.t >= C.BOSS2_AT) { S.bossDone[1] = true; spawn('boss2', true); SND.boss(); S.shake = 12; toast('이무기가 깨어났다 — 동이 틀 때까지 버텨라'); }
$o$, $n$  if (!S.bossDone[1] && S.t >= C.BOSS2_AT) { S.bossDone[1] = true; spawn('boss2', true); SND.boss(); S.shake = 12; toast('이무기가 깨어났다 — 동이 틀 때까지 버텨라'); }
  while (S.eliteIdx < ELITE_AT.length && S.t >= ELITE_AT[S.eliteIdx]) { S.eliteIdx++; const roster = STAGES[S.stage].roster; const o = spawn(roster[Math.floor(Math.random() * roster.length)], false, true); SND.boss(); toast(`정예 ${o.d.name}이(가) 나타났다`); }
$n$), $o$function spawn(type, boss) {
  const d = ENEMY[type], a = Math.random() * 6.283, R = Math.hypot(W, H) * .55 + 30;
  acquire(E, E_FREE, o => { o.type = type; o.d = d; o.x = P.x + Math.cos(a) * R; o.y = P.y + Math.sin(a) * R; o.hp = enemyHp(S.t) * d.hp; o.maxhp = o.hp; o.r = d.r; o.hit = 0; o.hop = Math.random() * 6.28; o.slow = 0; o.kx = 0; o.ky = 0; o.boss = !!boss; o.ph = Math.random() * 6.28; });
$o$, $n$function spawn(type, boss, elite) {
  const d = ENEMY[type], st = STAGES[S.stage]; let a = Math.random() * 6.283, R = Math.hypot(W, H) * .55 + 30, x = P.x + Math.cos(a) * R, y = P.y + Math.sin(a) * R;
  if (st.bound) { if (Math.abs(y) > st.bound - 20) { x = P.x + (Math.random() < .5 ? -1 : 1) * (W * .6 + 40); y = (Math.random() * 2 - 1) * (st.bound - 30); } }
  return acquire(E, E_FREE, o => { o.type = type; o.d = d; o.x = x; o.y = y; o.hp = enemyHp(S.t) * d.hp * (elite ? 12 : 1); o.maxhp = o.hp; o.r = d.r * (elite ? 1.4 : 1); o.hit = 0; o.hop = Math.random() * 6.28; o.slow = 0; o.kx = 0; o.ky = 0; o.boss = !!boss; o.elite = !!elite; o.ph = Math.random() * 6.28; o.chargeT = 3; o.charging = 0; o.patT = 2.5; o.burn = 0; });
$n$), $o$const SLASH = [];               // 검격 잔상
$o$, $n$const SLASH = [];               // 검격 잔상
const EB = [];                  // 적 투사체
const ZONE = [];                // 장판(물웅덩이)
const CHESTS = [];              // 상자
const OB = new Map();           // 장애물 청크 캐시
$n$), $o$const S = { mode:'menu', t:0, stage:0, lvl:1, xp:0, need:C.LVL_XP0, kills:0, coins:0, hp:100, maxhp:100, pw:1, spawnAcc:0, bossDone:[false,false], cleared:false, dead:false, hitT:0, slowT:0, freeze:0, shake:0, flash:0, chal:null };
$o$, $n$const S = { mode:'menu', t:0, stage:0, lvl:1, xp:0, need:C.LVL_XP0, kills:0, coins:0, hp:100, maxhp:100, pw:1, spawnAcc:0, bossDone:[false,false], cleared:false, dead:false, hitT:0, slowT:0, burnT:0, eliteIdx:0, freeze:0, shake:0, flash:0, chal:null };
$n$), $o$  egg:      { name:'달걀귀신', hp:1.0, spd:52, r:11, xp:1, col:'#f0e9dc', from:0 },
  fire:     { name:'도깨비불', hp:0.5, spd:95, r:9, xp:1, col:'#6fd3ff', from:60 },
  jiangshi: { name:'강시',     hp:2.6, spd:62, r:13, xp:3, col:'#6a8bd8', from:150, hop:true },
  water:    { name:'물귀신',   hp:1.6, spd:70, r:12, xp:2, col:'#8fd8c8', from:90 },
  gumiho:   { name:'구미호',   hp:3.5, spd:80, r:14, xp:4, col:'#ffb36b', from:200 },
  boss1:    { name:'두억시니', hp:C.BOSS1_HP, spd:58, r:30, xp:40, col:'#c0463a', boss:true },
  boss2:    { name:'이무기',   hp:C.BOSS2_HP, spd:66, r:38, xp:120, col:'#3fa06a', boss:true },
$o$, $n$  // el: 속성(화·수·목·금·무) · armor: 방어구(none 보통 / light 가벼움·빠름 / heavy 무거움·느림) — 상성 계수는 덱 시스템과 함께 (M2)
  egg:      { name:'달걀귀신', hp:1.0, spd:74,  r:11, xp:1, col:'#f0e9dc', from:0,   el:'none',  armor:'none' },
  fire:     { name:'도깨비불', hp:0.5, spd:125, r:9,  xp:1, col:'#6fd3ff', from:60,  el:'fire',  armor:'light' },
  jiangshi: { name:'강시',     hp:2.6, spd:84,  r:13, xp:3, col:'#6a8bd8', from:150, el:'metal', armor:'heavy', hop:true },
  water:    { name:'물귀신',   hp:1.6, spd:92,  r:12, xp:2, col:'#8fd8c8', from:90,  el:'water', armor:'none' },
  gumiho:   { name:'구미호',   hp:3.5, spd:108, r:14, xp:4, col:'#ffb36b', from:200, el:'wood',  armor:'light' },
  boss1:    { name:'두억시니', hp:C.BOSS1_HP, spd:70, r:30, xp:40,  col:'#c0463a', boss:true, el:'fire',  armor:'heavy', patterns:['dash','shoot'] },
  boss2:    { name:'이무기',   hp:C.BOSS2_HP, spd:80, r:38, xp:120, col:'#3fa06a', boss:true, el:'water', armor:'none',  patterns:['dash','pool'] },
$n$), $o$  bell() { tone(1760, .25, 'sine', .025); tone(2640, .18, 'sine', .012); },
$o$, $n$  bell() { const now = performance.now(); if (now - (SND._bellT || 0) < 2000) return; SND._bellT = now; tone(392, .5, 'sine', .03); tone(588, .4, 'sine', .012); },
$n$), $o$  { id:'temple', name:'폐사지', mul:1.8, ground:['#1f1a16','#161210'], fog:'rgba(170,140,110,.08)', roster:['jiangshi','fire','gumiho'] },
];
$o$, $n$  { id:'temple', name:'폐사지', mul:1.8, ground:['#1f1a16','#161210'], fog:'rgba(170,140,110,.08)', roster:['jiangshi','fire','gumiho'] },
];
const ELITE_AT = [90, 180, 270, 390, 480];   // 정예 등장 시각
const CHEST = [{ g:'일반', n:1, p:.6, col:'#c9c3b4' }, { g:'레어', n:3, p:.3, col:'#7fd1ff' }, { g:'에픽', n:5, p:.1, col:'#d08cff' }];
const ARMOR_SPD = { none:1, light:1.12, heavy:.88 };   // 방어구 타입별 이속 편차
const EL_COL = { fire:'#ff7a4a', water:'#5fc8ff', wood:'#7fe06a', metal:'#d8d8e8', none:'#f1ead8' };
$n$), $o$  { id:'field', name:'달빛 들판', mul:1.0, ground:['#17231a','#121b15'], fog:'rgba(120,150,110,.06)', roster:['egg','jiangshi','fire'] },
  { id:'marsh', name:'안개 늪', mul:1.45, ground:['#141f22','#0f1719'], fog:'rgba(140,170,170,.10)', roster:['egg','fire','water'] },
  { id:'temple', name:'폐사지', mul:1.8, ground:['#1f1a16','#161210'], fog:'rgba(170,140,110,.08)', roster:['jiangshi','fire','gumiho'] },
$o$, $n$  { id:'field',  name:'달빛 초원',   mul:1.0,  ground:['#17231a','#121b15'], fog:'rgba(120,150,110,.06)', roster:['egg','jiangshi','fire'],   bound:0,   obst:null },
  { id:'forest', name:'귀신의 숲',   mul:1.45, ground:['#121a16','#0c120f'], fog:'rgba(120,160,140,.12)', roster:['egg','fire','water'],      bound:280, obst:{ tree:.55 } },
  { id:'temple', name:'업화 폐사지', mul:1.8,  ground:['#1f1612','#140e0b'], fog:'rgba(200,120,60,.08)',  roster:['jiangshi','fire','gumiho'], bound:0,   obst:{ wall:.35, fire:.3 } },
$n$), $o$  <div id="lvCards"></div>
$o$, $n$  <div id="lvCards"></div>
</div>

<div id="chest" class="panel">
  <h2 id="chTitle" style="font-size:22px; text-align:center; margin-bottom:12px">상자</h2>
  <div id="chList"></div>
  <button id="chBtn" class="big">계속</button>
$n$), $o$  <p class="sub">움직이기만 하세요. 공격은 알아서 합니다. 동이 틀 때까지 10분.</p>
$o$, $n$  <p class="sub">움직이기만 하세요. 공격은 알아서 합니다. 동이 틀 때까지 10분.</p>
  <div id="stages" class="row" style="margin:0 0 4px"></div>
$n$) where slug = 'night-exorcist' and md5(html) = '49bb9dbf4f85c60b0b2556d2b16db9b0' returning slug, md5(html), length(html);
