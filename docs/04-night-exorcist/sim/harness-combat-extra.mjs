// harness-combat 후속 확인. NODE_PATH=/home/claude/node_modules node harness-combat-extra.mjs
import { chromium } from 'playwright'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)); const URL = 'file://' + path.resolve(here, '../../../games/night-exorcist/index.html') + '?test=1';
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const fresh = async () => { const pg = await br.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message)); await pg.route('**supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' })); await pg.goto(URL); await pg.waitForFunction(() => window.GAME); return { pg, errs }; };
const START = ([stage, diff]) => { const M = GAME.META; M.runs = 5; M.bestStage = 6; M.bestN = 6; M.bestH = 6; M.stage = stage + 1; M.diff = diff; M.deck = Object.keys(GAME.WBY); M.owned = Object.fromEntries(M.deck.map(d => [d, 0])); M.train = { atk: 0, hp: 0, regen: 0, spd: 0, pick: 0 }; GAME.startGame(); const { S, E, P } = GAME; E.length = 0; S.spawnAcc = -1e9; S.bossDone = [true, true]; S.eliteIdx = 5; S.xp = -1e9; P.w = {}; P.p = {}; return S.stage; };
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null; const log = (n, r) => console.log('\n' + n + '\n   ' + JSON.stringify(r));

// 1. 비-화염 보스의 투사체가 화상을 입히는가 (line 533)
{ const { pg } = await fresh(); await pg.evaluate(START, [1, 0]);
  log('1 boss shoot → burn regardless of element', await pg.evaluate(() => { const { S, P, E, EB } = GAME; const out = {}; for (const t of ['whitetiger', 'lanternking', 'fortgeneral', 'thundergod', 'boss1']) { E.length = 0; EB.length = 0; const b = GAME.spawn(t, true); b.x = 150; b.y = 0; S.burnT = 0; S.hp = S.maxhp; GAME.bossPattern(b); E.length = 0; /* 보스 제거: 접촉 화상 배제 */ let hit = false; for (let i = 0; i < 60; i++) { GAME.tick(1 / 60); if (S.burnT > 0) { hit = true; break; } } out[t] = { el: GAME.ENEMY[t].el, burnAfterProjectile: hit, burnT: +S.burnT.toFixed(2) }; } return out; }));
  await pg.close(); }

// 2. 장애물 요괴 영구 정체: 60초 후 멀리서 10초간 2px 미만
{ const { pg } = await fresh(); const out = {};
  for (const stage of [1, 2, 4]) { await pg.evaluate(START, [stage, 0]);
    out['s' + (stage + 1)] = await pg.evaluate((stage) => { const { S, P, E, STRIKES, STAGES } = GAME; const st = STAGES[stage]; const dt = 1 / 30; const Es = []; for (let k = 0; k < 60; k++) { const o = GAME.spawn(st.roster[k % 5]); const a = k / 60 * 6.283; o.x = Math.cos(a) * 450; o.y = Math.max(-(st.bound || 1e9) + 30, Math.min((st.bound || 1e9) - 30, Math.sin(a) * 450)); o.hp = o.maxhp = 1e9; Es.push(o); }
      for (let i = 0; i < 1500; i++) { S.hp = S.maxhp; GAME.tick(dt); STRIKES.length = 0; } const pos = Es.map(o => [o.x, o.y]); for (let i = 0; i < 300; i++) { S.hp = S.maxhp; GAME.tick(dt); STRIKES.length = 0; }
      let stuck = 0, far = 0; const ex = []; for (let k = 0; k < Es.length; k++) { const o = Es[k]; if (!o.alive) continue; const d = Math.hypot(o.x, o.y); if (d > 80) { far++; if (Math.hypot(o.x - pos[k][0], o.y - pos[k][1]) < 2) { stuck++; if (ex.length < 4) ex.push({ type: o.type, x: +o.x.toFixed(0), y: +o.y.toFixed(0), d: +d.toFixed(0), near: GAME.nearObst(o.x, o.y).filter(b => b.solid && Math.hypot(b.x - o.x, b.y - o.y) < 70).map(b => `${b.k}@${b.x.toFixed(0)},${b.y.toFixed(0)}${b.w ? ' w' + b.w.toFixed(0) : ''}`) }); } } }
      E.length = 0; return { farAfter70s: far, stuck10s: stuck, ex }; }, stage); }
  log('2 enemies permanently stuck behind obstacles (60 spawned, 70s)', out); await pg.close(); }

// 3. 과살 아티팩트 확인: hp 1e9 요괴 상대로 e:melee:all2 경직 · bell 넉백
{ const { pg } = await fresh(); await pg.evaluate(START, [0, 0]);
  log('3 effects vs unkillable enemies', await pg.evaluate(() => { const { S, P, E, B } = GAME; const run = id => { E.length = 0; B.length = 0; for (const k in GAME.WCD) GAME.WCD[k] = 0; P.w = { [id]: 5 }; P.dx = 1; P.dy = 0; P.x = P.y = 0; for (let k = 0; k < 20; k++) { const o = GAME.spawn('egg'); const a = k / 20 * 6.283; o.x = Math.cos(a) * 40; o.y = Math.sin(a) * 40; o.hp = o.maxhp = 1e9; } let stun = 0, kb = 0; for (let i = 0; i < 90; i++) { S.hp = S.maxhp; GAME.tick(1 / 30); for (const o of E) { if (o.stun > 0) stun++; if (Math.hypot(o.kx, o.ky) > 5) kb++; } } return { stunTicks: stun, kbTicks: kb }; }; return { 'e:melee:all2': run('e:melee:all2'), bell: run('bell'), sickle: run('sickle'), coin: run('coin'), 'e:aura:all': run('e:aura:all') }; }));
  await pg.close(); }

// 4. 화상 DoT(maxhp 2%/s) vs 보스 — 약한 화염 무기 1개가 최대 강화 비화염 무기를 능가하는가
{ const { pg } = await fresh(); await pg.evaluate(START, [0, 0]);
  log('4 burn DoT vs boss2 (s1 easy, t=540) · 20s damage', await pg.evaluate(() => { const { S, P, E, B } = GAME; const run = (w, lv, bossType, t) => { E.length = 0; B.length = 0; for (const k in GAME.WCD) GAME.WCD[k] = 0; S.t = t; P.w = { [w]: lv }; P.dx = 1; P.dy = 0; P.x = P.y = 0; const b = GAME.spawn(bossType, true); b.x = 40; b.y = 0; const hp0 = b.hp; let burnT = 0; for (let i = 0; i < 600; i++) { S.hp = S.maxhp; S.freeze = 0; b.chargeT = 99; b.patT = 99; b.x = 40; b.y = 0; P.x = P.y = 0; P.dx = 1; P.dy = 0; GAME.tick(1 / 30); if (b.burn > 0) burnT += 1 / 30; if (!b.alive) break; } return { bossHp: +hp0.toFixed(0), dmg: +(hp0 - Math.max(0, b.hp)).toFixed(0), pct: +((hp0 - Math.max(0, b.hp)) / hp0 * 100).toFixed(0), burnSec: +burnT.toFixed(1), killed: !b.alive }; };
    return { brazierLv1_vs_boss2: run('brazier', 1, 'boss2', 540), torchLv1_vs_boss2: run('torch', 1, 'boss2', 540), rockhammerLv5_vs_boss2: run('rockhammer', 5, 'boss2', 540), sickleLv5_vs_boss2: run('sickle', 5, 'boss2', 540), spearLv5_vs_boss2_favorable: run('spear', 5, 'boss2', 540), brazierLv1_vs_boss1: run('brazier', 1, 'boss1', 300), sickleLv5_vs_boss1: run('sickle', 5, 'boss1', 300), brazierLv1_vs_firedragon_s6: (() => { GAME.S.stage = 5; const r = run('brazier', 1, 'firedragon', 540); GAME.S.stage = 0; return r; })() }; }));
  await pg.close(); }

// 5. 진화 직후 실전 DPS 절벽 (hp 1e9 요괴 20마리, 6초)
{ const { pg } = await fresh(); await pg.evaluate(START, [0, 0]);
  log('5 evolution DPS cliff (6s dmg vs 20 unkillable eggs, non-fire)', await pg.evaluate(() => { const { S, P, E, B } = GAME; const run = wset => { E.length = 0; B.length = 0; for (const k in GAME.WCD) GAME.WCD[k] = 0; P.w = wset; P.dx = 1; P.dy = 0; P.x = P.y = 0; const Es = []; for (let k = 0; k < 20; k++) { const o = GAME.spawn('egg'); const a = k / 20 * 6.283, d = 30 + (k % 4) * 25; o.x = Math.cos(a) * d; o.y = Math.sin(a) * d; o.hp = o.maxhp = 1e9; o.el = 'wood'; Es.push(o); } for (let i = 0; i < 180; i++) { S.hp = S.maxhp; GAME.tick(1 / 30); } return +Es.reduce((a, o) => a + o.maxhp - o.hp, 0).toFixed(0); };
    const parentsT2 = run({ spear: 5, sword: 5 }), t2lv1 = run({ 'e:wood:throw+melee': 1 }), t2lv3 = run({ 'e:wood:throw+melee': 3 }), t2lv4 = run({ 'e:wood:throw+melee': 4 }), t2lv5 = run({ 'e:wood:throw+melee': 5 });
    const preT3 = run({ 'e:wood:throw+melee': 5, beads: 5 }), t3lv1 = run({ 'e:wood:all': 1 }), t3lv3 = run({ 'e:wood:all': 3 }), t3lv5 = run({ 'e:wood:all': 5 });
    const parentsThrow = run({ spear: 5, orb: 5 }), t2throw1 = run({ 'e:throw:water+wood': 1 }), t2throw5 = run({ 'e:throw:water+wood': 5 });
    return { woodThrowMelee: { parentsLv5: parentsT2, evoLv1: t2lv1, ratioLv1: +(t2lv1 / parentsT2).toFixed(2), evoLv3: t2lv3, evoLv4: t2lv4, evoLv5: t2lv5 }, woodAll: { preT3: preT3, t3Lv1: t3lv1, ratioLv1: +(t3lv1 / preT3).toFixed(2), t3Lv3: t3lv3, t3Lv5: t3lv5 }, throwWaterWood: { parentsLv5: parentsThrow, evoLv1: t2throw1, ratioLv1: +(t2throw1 / parentsThrow).toFixed(2), evoLv5: t2throw5 } }; }));
  await pg.close(); }

// 6. 소금 주머니·땅 속성이 보스에 적용되는지 (넉백 면역 주석과 불일치)
{ const { pg } = await fresh(); await pg.evaluate(START, [0, 0]);
  log('6 salt/earth vs boss', await pg.evaluate(() => { const { S, P, E } = GAME; E.length = 0; P.p = { salt: 1 }; const b = GAME.spawn('boss2', true); b.x = 5; b.y = 0; b.touchCd = 0; b.hp = 1e9; GAME.tick(1 / 1000); const r = { saltKbOnBoss: +Math.hypot(b.kx, b.ky).toFixed(0), saltStunOnBoss: b.stun }; E.length = 0; P.p = {}; const c = GAME.spawn('boss2', true); c.hp = 1e9; GAME.hitWith(c, GAME.WBY.sling, 10, 100, 0); r.earthStunOnBoss = c.stun; r.weaponKbOnBoss = Math.hypot(c.kx, c.ky); const d = GAME.spawn('boss2', true); d.hp = 1e9; GAME.hitWith(d, GAME.WBY.sickle, 10, 100, 0); r.sickleKbOnBoss = Math.hypot(d.kx, d.ky); E.length = 0; return r; }));
  await pg.close(); }

// 7. 낙석 피해 표시 vs 실제(도롱이 5)
{ const { pg } = await fresh(); await pg.evaluate(START, [4, 0]);
  log('7 strike dmg float vs actual with armor', await pg.evaluate(() => { const { S, P, E, STRIKES, STAGES } = GAME; P.p = { armor: 5 }; const sk = STAGES[4].strike; STRIKES.length = 0; STRIKES.push({ x: 0, y: 0, t: sk.tele - .001, tele: sk.tele, r: sk.r, dmg: sk.dmg, kind: sk.kind }); S.hp = S.maxhp; GAME.tick(1 / 60); P.p = {}; return { actual: +(S.maxhp - S.hp).toFixed(2), floatShows: sk.dmg, expectedActual: +(sk.dmg * Math.pow(.92, 5)).toFixed(2) }; }));
  await pg.close(); }

// 8. 경계 스테이지 보스 스폰 위치 (반경 > 20 여유) · 첫 틱 클램프
{ const { pg } = await fresh(); await pg.evaluate(START, [5, 0]);
  log('8 boss spawn vs bound (peak)', await pg.evaluate(() => { const { S, E, STRIKES } = GAME; let out = 0, maxOver = 0; for (let k = 0; k < 400; k++) { E.length = 0; const b = GAME.spawn('firedragon', true); const over = Math.abs(b.y) + b.r - 260; if (over > 0) { out++; maxOver = Math.max(maxOver, over); } } E.length = 0; return { of400: out, maxOverlapPx: +maxOver.toFixed(1) }; }));
  await pg.close(); }

await br.close();
