-- 자동 생성 패치 11개 hunk · 기대 md5 b8ffed6bab61831889eaae38942fb32c · 길이 52554
update public.games set html = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(html, $o$  for (const s of SLASH) { const a = s.t / .22; ctx.strokeStyle = `rgba(255,240,200,${a * .9})`; ctx.lineWidth = 6 * a + 2; ctx.beginPath(); ctx.arc(sx(s.x), sy(s.y), s.R * (1.1 - a * .2), s.a - s.arc / 2, s.a + s.arc / 2); ctx.stroke(); ctx.strokeStyle = `rgba(200,140,80,${a * .6})`; ctx.lineWidth = 2; ctx.stroke(); }
$o$, $n$  for (const s of SLASH) { const a = s.t / .22, k = 1 - a, cx = sx(s.x), cy = sy(s.y), R = s.R * (.85 + k * .3), a0 = s.a - s.arc / 2, a1 = s.a + s.arc / 2, sweep = a0 + (a1 - a0) * Math.min(1, k * 2.2);
    ctx.save(); ctx.globalAlpha = a; const g = ctx.createRadialGradient(cx, cy, R * .45, cx, cy, R); g.addColorStop(0, 'rgba(255,245,210,0)'); g.addColorStop(.75, 'rgba(255,235,170,.55)'); g.addColorStop(1, 'rgba(255,255,255,.95)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, a0, sweep); ctx.arc(cx, cy, R * .45, sweep, a0, true); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, R, a0, sweep); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,150,.5)'; ctx.lineWidth = 1; for (let n = 1; n <= 3; n++) { ctx.beginPath(); ctx.arc(cx, cy, R * (.5 + n * .12), a0, sweep); ctx.stroke(); }
    ctx.restore(); }
$n$), $o$  else if (o.boss) { // 두억시니·이무기
$o$, $n$  else if (o.boss) { blit(o.type, Math.floor(t * 3) % 2, 0, r * .95, o.x > P.x, hit, o.type === 'boss1' ? 1.6 : 2.0); if (o.charging > 0) { ctx.strokeStyle = 'rgba(255,120,80,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r * 1.25, 0, 6.283); ctx.stroke(); }
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
const PAL = { D:'#6a1a12', d:'#a8352a', O:'#ff8a6a', T:'#fff', g:'#114a2a', M:'#3fa06a', m:'#8ff0b0', K:'#1a1612', H:'#221c17', S:'#f0c9a0', W:'#f4efe2', w:'#c9c0a8', R:'#8a2a2a', B:'#2b2a3a', E:'#fbf8f2', e:'#c8c0b4', L:'#bfeeff', l:'#4fa8e8', N:'#1a1f44', G:'#b8dcc0', Y:'#f2d26a', C:'#5a6fc0', c:'#3a4f9a', r:'#c0362a' };
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

$n$), $o$      SLASH.push({ x:P.x, y:P.y, a, R, arc, t:.22 }); SND.sword();
      for (let i = E.length - 1; i >= 0; i--) { const o = E[i], dx = o.x - P.x, dy = o.y - P.y, d = Math.hypot(dx, dy); if (d > R + o.r) continue; let da = Math.atan2(dy, dx) - a; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) <= arc / 2) hurtEnemy(o, dmg, dx / d * 120, dy / d * 120); }
$o$, $n$      SLASH.push({ x:P.x, y:P.y, a, R, arc, t:.22 }); SND.sword(); S.shake = Math.max(S.shake, 1.5);
      for (let i = E.length - 1; i >= 0; i--) { const o = E[i], dx = o.x - P.x, dy = o.y - P.y, d = Math.hypot(dx, dy); if (d > R + o.r) continue; let da = Math.atan2(dy, dx) - a; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) <= arc / 2) { hurtEnemy(o, dmg, dx / d * 120, dy / d * 120); burst(o.x, o.y, 3, '#fff2c0', 90); } }
$n$), $o$  o.hp -= dmg; o.hit = .12; o.kx += kx; o.ky += ky;
$o$, $n$  o.hp -= dmg; o.hit = .12; if (!o.boss) { o.kx += kx; o.ky += ky; }   // 보스는 넉백 면역
$n$), $o$    let sp = o.d.spd * (o.slow > 0 ? 1 - .2 : 1); if (o.d.hop) { o.hop += dt * 5; sp *= Math.max(0, Math.sin(o.hop)) * 2.2; }
$o$, $n$    let sp = o.d.spd * (o.slow > 0 ? 1 - .2 : 1); if (o.d.hop) { o.hop += dt * 5; sp *= Math.max(0, Math.sin(o.hop)) * 2.2; }
    if (o.boss) { o.chargeT -= dt; if (o.chargeT <= 0) { o.charging = .7; o.chargeT = 3.2 + Math.random(); SND.boss(); } if (o.charging > 0) { o.charging -= dt; sp *= 3.2; } }   // 보스: 3초마다 돌진
$n$), $o$  acquire(E, E_FREE, o => { o.type = type; o.d = d; o.x = P.x + Math.cos(a) * R; o.y = P.y + Math.sin(a) * R; o.hp = enemyHp(S.t) * d.hp; o.maxhp = o.hp; o.r = d.r; o.hit = 0; o.hop = Math.random() * 6.28; o.slow = 0; o.kx = 0; o.ky = 0; o.boss = !!boss; o.ph = Math.random() * 6.28; });
$o$, $n$  acquire(E, E_FREE, o => { o.type = type; o.d = d; o.x = P.x + Math.cos(a) * R; o.y = P.y + Math.sin(a) * R; o.hp = enemyHp(S.t) * d.hp; o.maxhp = o.hp; o.r = d.r; o.hit = 0; o.hop = Math.random() * 6.28; o.slow = 0; o.kx = 0; o.ky = 0; o.boss = !!boss; o.ph = Math.random() * 6.28; o.chargeT = 3; o.charging = 0; });
$n$), $o$  egg:      { name:'달걀귀신', hp:1.0, spd:52, r:11, xp:1, col:'#f0e9dc', from:0 },
  fire:     { name:'도깨비불', hp:0.5, spd:95, r:9, xp:1, col:'#6fd3ff', from:60 },
  jiangshi: { name:'강시',     hp:2.6, spd:62, r:13, xp:3, col:'#6a8bd8', from:150, hop:true },
  water:    { name:'물귀신',   hp:1.6, spd:70, r:12, xp:2, col:'#8fd8c8', from:90 },
  gumiho:   { name:'구미호',   hp:3.5, spd:80, r:14, xp:4, col:'#ffb36b', from:200 },
  boss1:    { name:'두억시니', hp:C.BOSS1_HP, spd:58, r:30, xp:40, col:'#c0463a', boss:true },
  boss2:    { name:'이무기',   hp:C.BOSS2_HP, spd:66, r:38, xp:120, col:'#3fa06a', boss:true },
$o$, $n$  egg:      { name:'달걀귀신', hp:1.0, spd:74, r:11, xp:1, col:'#f0e9dc', from:0 },
  fire:     { name:'도깨비불', hp:0.5, spd:125, r:9, xp:1, col:'#6fd3ff', from:60 },
  jiangshi: { name:'강시',     hp:2.6, spd:84, r:13, xp:3, col:'#6a8bd8', from:150, hop:true },
  water:    { name:'물귀신',   hp:1.6, spd:92, r:12, xp:2, col:'#8fd8c8', from:90 },
  gumiho:   { name:'구미호',   hp:3.5, spd:108, r:14, xp:4, col:'#ffb36b', from:200 },
  boss1:    { name:'두억시니', hp:C.BOSS1_HP, spd:70, r:30, xp:40, col:'#c0463a', boss:true },
  boss2:    { name:'이무기',   hp:C.BOSS2_HP, spd:80, r:38, xp:120, col:'#3fa06a', boss:true },
$n$), $o$  bell() { tone(1760, .25, 'sine', .025); tone(2640, .18, 'sine', .012); },
$o$, $n$  bell() { const now = performance.now(); if (now - (SND._bellT || 0) < 2000) return; SND._bellT = now; tone(392, .5, 'sine', .03); tone(588, .4, 'sine', .012); },
$n$) where slug = 'night-exorcist' and md5(html) = '49bb9dbf4f85c60b0b2556d2b16db9b0' returning slug, md5(html), length(html);
