// 랜덤 설정 다수 런 QA 하네스. NODE_PATH=/home/claude/node_modules node harness-runs.mjs [runs] [parallel]
// 페이지 하나에서 3런 연속(상태 누수 검사) · 5게임초마다 불변식 검사 · 종료 시 META 검사
import { chromium } from 'playwright'; import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const TOTAL = +(process.argv[2] || 60), PAR = +(process.argv[3] || 2), PER_PAGE = 3;
const URL = 'file://' + path.resolve(here, '../../../games/night-exorcist/index.html') + '?test=1';
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const all = []; let seq = 0;

// 페이지 안에서 돌아가는 런 함수 (cfg → 결과)
const RUN_IN_PAGE = async (cfg) => {
  const V = [], seen = new Set(); const viol = (k, info) => { const key = k + '|' + (info || '').slice(0, 60); if (seen.has(key)) { const v = V.find(x => x.k === k && x.info === info); if (v) v.n++; return; } seen.add(key); V.push({ k, t: +GAME.S.t.toFixed(1), info, n: 1 }); };
  const bad = v => typeof v !== 'number' || !Number.isFinite(v);
  const { S, P, E, B, G, META, C, STAGES, WBY, EBY, PASSIVES, STRIKES, PFX, EB, ZONE, CHESTS, ARC, KEY } = GAME;
  const weaponOf = GAME.weaponOf;
  // ── 설정 주입
  META.runs = 5; META.coins = 1000; META.shards = 100;
  META.bestStage = cfg.diff > 0 ? 6 : cfg.stage; META.bestN = cfg.diff > 1 ? 6 : cfg.diff === 1 ? cfg.stage : 0; META.bestH = cfg.diff === 2 ? cfg.stage : 0;
  META.stage = cfg.stage + 1; META.diff = cfg.diff; META.deck = cfg.deck.slice(); META.owned = {}; for (const id of cfg.deck) META.owned[id] = cfg.owned[id];
  META.train = { ...cfg.train };
  const metaBefore = JSON.parse(JSON.stringify(META));
  // 이전 런 잔여 상태 검사 (startGame 후)
  GAME.startGame();
  if (S.stage !== cfg.stage) viol('cfg-stage', `want ${cfg.stage} got ${S.stage}`); if (S.diff !== cfg.diff) viol('cfg-diff', `want ${cfg.diff} got ${S.diff}`);
  const resid = { E: E.length, B: B.length, G: G.length, STRIKES: STRIKES.length, ARC: ARC.length, EB: EB.length, ZONE: ZONE.length, CHESTS: CHESTS.length, PFX: PFX.length, shrinkT: S.shrinkT, fogT: S.fogT, strikeT: S.strikeT || 0, boss: S.bossDone.some(Boolean), used: P.used.size, pw: Object.keys(P.w).length, pp: Object.keys(P.p).length, wcd: Object.values(GAME.WCD).some(v => v !== 0), xp: S.xp, lvl: S.lvl, kills: S.kills, coins: S.coins, elite: S.eliteIdx, burn: S.burnT, slow: S.slowT, freeze: S.freeze };
  for (const [k, v] of Object.entries(resid)) { const ok = k === 'pw' ? v === 1 : k === 'lvl' ? v === 1 : (v === 0 || v === false); if (!ok) viol('reset-leak', `${k}=${v}`); }
  if (S.hp !== S.maxhp) viol('reset-hp', `${S.hp}/${S.maxhp}`);
  // 극단 설정: 5슬롯 진화
  if (cfg.extreme === 'evo5') { P.w = {}; P.used = new Set(); for (const id of cfg.evoIds) P.w[id] = 5; }
  // ── 봇
  const bot = () => { if (cfg.extreme === 'still') return; let fx = 0, fy = 0; for (const o of E) { const dx = o.x - P.x, dy = o.y - P.y, d = Math.hypot(dx, dy) || 1; if (d < 150) { const w = (150 - d) * (o.boss ? 2 : 1); fx -= dx / d * w; fy -= dy / d * w; } }
    const st = STAGES[S.stage]; if (st.shrink) { const R = GAME.arenaR(), d = Math.hypot(P.x, P.y); if (d > R - 60) { fx -= P.x / (d || 1) * 80; fy -= P.y / (d || 1) * 80; } }
    for (const z of STRIKES) { const dx = z.x - P.x, dy = z.y - P.y, d = Math.hypot(dx, dy) || 1; if (d < z.r + 30) { fx -= dx / d * 120; fy -= dy / d * 120; } }
    let g = null, gd = 1e9; for (const q of G) { const d = Math.hypot(q.x - P.x, q.y - P.y); if (d < gd) { gd = d; g = q; } } if (g && gd < 260 && Math.hypot(fx, fy) < 40) { fx += (g.x - P.x) / gd * 60; fy += (g.y - P.y) / gd * 60; }
    if (Math.hypot(fx, fy) < 5 && cfg.wander) { fx += Math.cos(S.t * .7) * 20; fy += Math.sin(S.t * .5) * 20; }
    KEY.KeyW = KEY.KeyS = KEY.KeyA = KEY.KeyD = false; if (Math.hypot(fx, fy) > 5) { if (fx > 5) KEY.KeyD = true; if (fx < -5) KEY.KeyA = true; if (fy > 5) KEY.KeyS = true; if (fy < -5) KEY.KeyW = true; } };
  // ── 불변식
  const maxEnemies = C.CAP + 2 + GAME.ELITE_AT.length; const hyp = Math.hypot(innerWidth, innerHeight);
  let lvPicks = 0, evoPicks = 0, chests = 0, maxE = 0, maxPFX = 0, maxB = 0, maxG = 0;
  const check = () => {
    for (const k of ['hp', 'maxhp', 't', 'xp', 'need', 'coins', 'shardsRun', 'shrinkT', 'fogT']) if (bad(S[k])) viol('nan-S', k + '=' + S[k]);
    if (bad(P.x) || bad(P.y)) viol('nan-P', `${P.x},${P.y}`);
    if (S.hp > S.maxhp + 1e-6) viol('hp>max', `${S.hp}>${S.maxhp}`);
    if (S.hp < 0 && S.mode === 'play') viol('hp<0-alive', '' + S.hp);
    if (E.length > maxEnemies) viol('E-cap', `${E.length}>${maxEnemies}`); maxE = Math.max(maxE, E.length); maxPFX = Math.max(maxPFX, PFX.length); maxB = Math.max(maxB, B.length); maxG = Math.max(maxG, G.length);
    if (PFX.length > 300) viol('pfx-cap', '' + PFX.length);
    const st = STAGES[S.stage]; const ids = new Set();
    for (const o of E) { if (bad(o.x) || bad(o.y) || bad(o.hp)) viol('nan-E', `${o.type} ${o.x},${o.y},${o.hp}`); if (o.hp <= 0) viol('E-dead-alive', `${o.type} hp=${o.hp}`); if (!o.alive) viol('E-notalive', o.type);
      if (st.bound && Math.abs(o.y) > st.bound - o.r + 1) viol('E-outbound', `${o.type} y=${o.y.toFixed(0)} bound=${st.bound}`);
      const d = Math.hypot(o.x - P.x, o.y - P.y); if (d > hyp * .9 + 60) viol('E-far', `${o.type} d=${d.toFixed(0)}`);
      if (o._chain) viol('E-chainflag', o.type); if (ids.has(o)) viol('E-dup', o.type); ids.add(o); }
    const bosses = E.filter(o => o.boss).length; if (bosses > 2) viol('boss>2', '' + bosses);
    for (const b of B) if (bad(b.x) || bad(b.y)) viol('nan-B', `${b.w && b.w.id}`);
    for (const g of G) if (bad(g.x) || bad(g.y) || bad(g.v)) viol('nan-G', `${g.x},${g.y},${g.v}`);
    for (const z of STRIKES) if (bad(z.x) || bad(z.y)) viol('nan-strike', '');
    // 무기·패시브 일관성
    const wk = Object.keys(P.w); if (wk.length > 5) viol('w-slots', wk.join(','));
    for (const id of wk) { const w = weaponOf(id); if (!w) { viol('w-unknown', id); continue; } const lv = P.w[id]; if (!(lv >= 1 && lv <= w.max)) viol('w-level', `${id}=${lv}/${w.max}`); if (P.used.has(id)) viol('w-used-still', id); if (WBY[id] && !S.deck.includes(id)) viol('w-not-in-deck', id);
      if (EBY[id]) for (const pid of EBY[id].parts) { if (P.w[pid] && !P.used.has(pid)) { /* 부품이 아직 별도로 있음: 3단 진화는 rest 부품만 소비, 가능 */ } } }
    const pk = Object.keys(P.p); if (pk.length > 5) viol('p-slots', pk.join(','));
    for (const id of pk) { const p = PASSIVES.find(x => x.id === id); if (!p) viol('p-unknown', id); else if (P.p[id] > p.max) viol('p-level', `${id}=${P.p[id]}/${p.max}`); }
    // 진화 후보 재료 검사
    for (const ev of GAME.evoOptions()) { if (P.w[ev.e.id]) viol('evo-already', ev.e.id); for (const id of ev.consume) { const w = weaponOf(id); if (!w || (P.w[id] || 0) < w.max) viol('evo-missing', `${ev.e.id} needs ${id} lv=${P.w[id]}`); } }
    if (st.shrink) { const R = GAME.arenaR(); if (bad(R) || R < st.shrink.r1 - 1e-6 || R > st.shrink.r0 + 1e-6) viol('arena-range', '' + R); }
    if (S.t > C.BOSS1_AT + 1 && !S.bossDone[0]) viol('boss1-missing', '');
    if (S.t > C.BOSS2_AT + 1 && !S.bossDone[1]) viol('boss2-missing', '');
    // 오버레이 중복
    const shown = ['lv', 'chest', 'over', 'menu'].filter(id => document.getElementById(id).classList.contains('show'));
    if (S.mode === 'play' && shown.length) viol('overlay-in-play', shown.join(','));
  };
  const pickCard = () => { const cards = [...document.querySelectorAll('#lvCards .card')]; if (!cards.length) { viol('lv-nocards', ''); S.mode = 'play'; return; }
    const evo = cards.filter(c => c.classList.contains('evo')); let c; if (cfg.extreme === 'evo5' || cfg.preferEvo) c = evo[0] || cards[Math.floor(Math.random() * cards.length)]; else c = cards[Math.floor(Math.random() * cards.length)];
    if (cards.length > 3) viol('lv-cards>3', '' + cards.length); if (evo.length > 1) viol('lv-evo>1', '' + evo.length);
    const before = JSON.stringify(P.w); c.click(); lvPicks++; if (c.classList.contains('evo')) evoPicks++; if (S.mode !== 'play') viol('lv-mode', S.mode); };
  // ── 메인 루프
  const dt = 1 / 30; let nextCheck = 0, steps = 0, err = null, lastKills = 0, stuckT = 0; const t0 = performance.now(); const budget = cfg.budgetMs || 150000;
  let chestWhileLv = 0;
  while (true) {
    if (S.mode === 'lv') { if (document.getElementById('chest').classList.contains('show')) chestWhileLv++; pickCard(); continue; }
    if (S.mode === 'chest') { chests++; document.getElementById('chBtn').click(); if (S.mode !== 'play') viol('chest-mode', S.mode); continue; }
    if (S.mode !== 'play') break;
    bot(); if (cfg.god) S.hp = S.maxhp; try { GAME.tick(dt); } catch (e) { err = (e && e.stack || String(e)).slice(0, 400); viol('tick-throw', err); break; }
    steps++; if (S.t >= nextCheck) { nextCheck += 5; check(); }
    if (steps % 600 === 0) await new Promise(r => setTimeout(r, 0));
    if (performance.now() - t0 > budget) { viol('wall-budget', `t=${S.t.toFixed(0)}`); break; }
  }
  check();
  // ── 종료 검사
  const over = S.mode === 'over'; const res = { cleared: S.cleared, t: S.t, lvl: S.lvl, kills: S.kills, mode: S.mode, hp: S.hp };
  if (over) {
    if (S.cleared !== (S.t >= C.RUN)) viol('clear-vs-time', `cleared=${S.cleared} t=${S.t}`);
    if (!S.cleared && S.hp > 0 && !cfg.god) viol('dead-hp>0', '' + S.hp);
    for (const k of ['coins', 'shards', 'runs', 'bestStage', 'bestN', 'bestH']) if (bad(META[k])) viol('nan-META', k + '=' + META[k]);
    if (META.coins < metaBefore.coins) viol('coins-decrease', `${metaBefore.coins}->${META.coins}`); if (META.shards < metaBefore.shards) viol('shards-decrease', '');
    if (META.coins === metaBefore.coins) viol('coins-nogain', `t=${S.t.toFixed(0)}`);
    if (S.cleared && META.shards === metaBefore.shards) viol('shards-nogain-clear', '');
    const bestKey = ['bestStage', 'bestN', 'bestH'][S.diff]; const expectBest = S.cleared ? Math.max(metaBefore[bestKey], S.stage + 1) : metaBefore[bestKey];
    if (META[bestKey] !== expectBest) viol('best-update', `${bestKey} ${metaBefore[bestKey]}->${META[bestKey]} expect ${expectBest} cleared=${S.cleared}`);
    for (const k of ['bestStage', 'bestN', 'bestH']) if (k !== bestKey && META[k] !== metaBefore[k]) viol('best-other-changed', k);
    try { const rt = JSON.parse(JSON.stringify(META)); if (JSON.stringify(rt) !== JSON.stringify(META)) viol('meta-roundtrip', ''); if (/NaN|Infinity|null/.test(JSON.stringify(META.train)) ) viol('meta-train-null', JSON.stringify(META.train)); } catch (e) { viol('meta-json', String(e)); }
    if (JSON.stringify(META).includes('NaN')) viol('meta-nan-str', '');
    const expectedCoins = Math.round((S.coins + Math.floor(S.t / 10) + (S.cleared ? 60 : 0)) * GAME.DIFFS[S.diff].coin); if (META.coins - metaBefore.coins !== expectedCoins) viol('coins-formula', `${META.coins - metaBefore.coins} vs ${expectedCoins}`);
  } else if (!err) viol('no-over', S.mode);
  return { V, res, stats: { lvPicks, evoPicks, chests, maxE, maxPFX, maxB, maxG, steps, wall: Math.round(performance.now() - t0), chestWhileLv, w: { ...P.w }, p: { ...P.p } }, err };
};

function randCfg(i) {
  const R = n => Math.floor(Math.random() * n);
  const ids = Object.keys(WBY_KEYS); const n = 3 + R(8); const deck = [...ids].sort(() => Math.random() - .5).slice(0, n);
  const owned = Object.fromEntries(deck.map(id => [id, R(11)]));
  const train = Object.fromEntries(['atk', 'hp', 'regen', 'spd', 'pick'].map(k => [k, R(51)]));
  return { id: i, stage: R(6), diff: R(3), deck, owned, train, wander: Math.random() < .5, preferEvo: Math.random() < .5, god: i % 2 === 1 };
}
let WBY_KEYS = null;

async function pageRuns(cfgs) {
  const pg = await br.newPage({ viewport: { width: 390, height: 844 } }); const errs = [];
  pg.on('pageerror', e => errs.push('pageerror: ' + e.message)); pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 200)); });
  await pg.route('**supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pg.goto(URL); await pg.waitForFunction(() => window.GAME);
  const out = [];
  for (const cfg of cfgs) {
    const e0 = errs.length;
    let r; try { r = await pg.evaluate(RUN_IN_PAGE, cfg); } catch (e) { r = { V: [{ k: 'evaluate-throw', info: String(e).slice(0, 300), n: 1 }], res: {}, stats: {}, err: String(e) }; }
    r.consoleErrs = errs.slice(e0); r.cfg = cfg; out.push(r);
    const sum = `#${cfg.id} s${cfg.stage + 1}${'ENH'[cfg.diff]} deck${cfg.deck.length}${cfg.god ? ' god' : ''}${cfg.extreme ? ' ' + cfg.extreme : ''} → ${r.res.cleared ? 'CLEAR' : 'dead'} t=${(r.res.t || 0).toFixed(0)} lv${r.res.lvl} k${r.res.kills} wall=${r.stats.wall}ms viol=${r.V.length}${r.consoleErrs.length ? ' consoleErr=' + r.consoleErrs.length : ''}`;
    console.log(sum); for (const v of r.V) console.log('   ' + v.k + ' @' + v.t + 's ×' + v.n + ' ' + (v.info || '')); for (const c of r.consoleErrs) console.log('   ' + c);
    await pg.waitForTimeout(1000); // over 패널 타이머 소화
    const paused = await pg.evaluate(() => { document.getElementById('homeBtn').click(); return GAME.S.mode; });
    if (paused !== 'menu') console.log('   mode after home:', paused);
  }
  await pg.close(); return out;
}

// 초기 1회: 무기 키 수집
{ const pg = await br.newPage(); await pg.route('**supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' })); await pg.goto(URL); await pg.waitForFunction(() => window.GAME);
  WBY_KEYS = await pg.evaluate(() => Object.fromEntries(Object.keys(GAME.WBY).map(k => [k, 1])));
  const evoIds = await pg.evaluate(() => { const t3 = GAME.EVOS.filter(e => e.tier === 3).map(e => e.id); return t3; });
  globalThis.EVO_IDS = evoIds; await pg.close(); }

const cfgs = []; for (let i = 0; i < TOTAL; i++) cfgs.push(randCfg(i));
// 극단 케이스
cfgs.push({ ...randCfg(TOTAL), stage: 0, diff: 0, extreme: 'still', wander: false });
cfgs.push({ ...randCfg(TOTAL + 1), stage: 3, diff: 1, extreme: 'still', wander: false });
cfgs.push({ ...randCfg(TOTAL + 2), stage: 5, diff: 2, extreme: 'evo5', evoIds: globalThis.EVO_IDS.slice(0, 5), deck: ['talisman', 'torch', 'brazier', 'orb', 'whip', 'mist', 'spear', 'sword', 'beads', 'coin'], owned: Object.fromEntries(['talisman', 'torch', 'brazier', 'orb', 'whip', 'mist', 'spear', 'sword', 'beads', 'coin'].map(k => [k, 10])) });
cfgs.push({ ...randCfg(TOTAL + 3), stage: 5, diff: 2, deck: ['boltcharm', 'boltspear', 'thunderdrum', 'sling', 'rockhammer', 'sandstorm'], owned: { boltcharm: 10, boltspear: 10, thunderdrum: 10, sling: 10, rockhammer: 10, sandstorm: 10 }, train: { atk: 50, hp: 50, regen: 50, spd: 50, pick: 50 }, preferEvo: true });
cfgs.push({ ...randCfg(TOTAL + 4), stage: 5, diff: 2, deck: ['moonarrow', 'sunblade', 'lantern', 'shadowknife', 'inkbrush', 'veil'], owned: { moonarrow: 10, sunblade: 10, lantern: 10, shadowknife: 10, inkbrush: 10, veil: 10 }, train: { atk: 50, hp: 50, regen: 50, spd: 50, pick: 50 }, preferEvo: true });
cfgs.push({ ...randCfg(TOTAL + 5), stage: 3, diff: 0, deck: ['talisman', 'torch', 'brazier'], owned: { talisman: 10, torch: 10, brazier: 10 }, train: { atk: 50, hp: 50, regen: 50, spd: 50, pick: 50 }, preferEvo: true });

const groups = []; for (let i = 0; i < cfgs.length; i += PER_PAGE) groups.push(cfgs.slice(i, i + PER_PAGE));
let gi = 0; const workers = Array.from({ length: PAR }, async () => { while (gi < groups.length) { const g = groups[gi++]; all.push(...await pageRuns(g)); } });
await Promise.all(workers); await br.close();

// ── 집계
const byK = {}; for (const r of all) for (const v of r.V) { (byK[v.k] ||= { runs: 0, n: 0, ex: [] }).runs++; byK[v.k].n += v.n; if (byK[v.k].ex.length < 4) byK[v.k].ex.push(`#${r.cfg.id} s${r.cfg.stage + 1}${'ENH'[r.cfg.diff]} @${v.t}s ${v.info || ''}`); }
const cerr = {}; for (const r of all) for (const c of r.consoleErrs) { cerr[c] = (cerr[c] || 0) + 1; }
const stat = [0, 1, 2].map(d => { const rs = all.filter(r => r.cfg.diff === d && !r.cfg.extreme && !r.cfg.god); return { diff: 'ENH'[d], runs: rs.length, clear: rs.filter(r => r.res.cleared).length, avgT: rs.length ? Math.round(rs.reduce((a, r) => a + (r.res.t || 0), 0) / rs.length) : 0, avgLv: rs.length ? +(rs.reduce((a, r) => a + (r.res.lvl || 0), 0) / rs.length).toFixed(1) : 0 }; });
const perStage = [0, 1, 2, 3, 4, 5].map(s => { const rs = all.filter(r => r.cfg.stage === s && !r.cfg.extreme && !r.cfg.god); return `s${s + 1}:${rs.filter(r => r.res.cleared).length}/${rs.length}`; }).join(' ');
const summary = { runs: all.length, stat, perStage, violations: byK, consoleErrors: cerr, evoPicks: all.reduce((a, r) => a + (r.stats.evoPicks || 0), 0), chests: all.reduce((a, r) => a + (r.stats.chests || 0), 0), maxE: Math.max(...all.map(r => r.stats.maxE || 0)), maxPFX: Math.max(...all.map(r => r.stats.maxPFX || 0)), maxB: Math.max(...all.map(r => r.stats.maxB || 0)), maxG: Math.max(...all.map(r => r.stats.maxG || 0)), chestWhileLv: all.reduce((a, r) => a + (r.stats.chestWhileLv || 0), 0) };
console.log('\n===== SUMMARY =====\n' + JSON.stringify(summary, null, 1));
fs.writeFileSync(path.join(here, 'harness-runs-result.json'), JSON.stringify({ summary, runs: all.map(r => ({ cfg: r.cfg, res: r.res, V: r.V, stats: r.stats, consoleErrs: r.consoleErrs })) }, null, 1));
