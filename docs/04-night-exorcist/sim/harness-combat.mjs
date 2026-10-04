// 전투·콘텐츠 조합 퍼즈 하네스. NODE_PATH=/home/claude/node_modules node harness-combat.mjs
// 1 피해 매트릭스 · 2 진화 그래프 · 3 실사격(100무기×6스테이지) · 4 패시브 · 5 스테이지 위험요소 · 6 상자 · 7 보스 · 8 레벨업 카드
import { chromium } from 'playwright'; import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const URL = 'file://' + path.resolve(here, '../../../games/night-exorcist/index.html') + '?test=1';
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const OUT = { sections: {}, pageErrors: {} }; const want = k => !process.env.ONLY || process.env.ONLY.split(',').includes(k);
const fresh = async (name) => { const pg = await br.newPage({ viewport: { width: 390, height: 844 } }); const errs = OUT.pageErrors[name] = []; pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
  await pg.route('**supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' })); await pg.goto(URL); await pg.waitForFunction(() => window.GAME); return pg; };
// 런 시작: 모든 스테이지·난이도 해금, 수련 0, 숙련 0 (수치가 깨끗하게 나오도록)
const START = ([stage, diff]) => { const M = GAME.META; M.runs = 5; M.coins = 0; M.bestStage = 6; M.bestN = 6; M.bestH = 6; M.stage = stage + 1; M.diff = diff; M.deck = Object.keys(GAME.WBY); M.owned = Object.fromEntries(M.deck.map(d => [d, 0])); M.train = { atk: 0, hp: 0, regen: 0, spd: 0, pick: 0 }; GAME.startGame(); return [GAME.S.stage, GAME.S.diff]; };
const sec = (n, r) => { OUT.sections[n] = r; console.log(`\n===== ${n} =====`); console.log(JSON.stringify(r, null, 1).slice(0, 6000)); fs.writeFileSync(path.join(here, 'harness-combat-result.json'), JSON.stringify(OUT, null, 1)); };

// ───────── 1. 피해 매트릭스 ─────────
if (want('1')) { const pg = await fresh('1-matrix'); await pg.evaluate(START, [0, 0]);
  const r = await pg.evaluate(() => {
    const { WBY, EVOS, EBY, ENEMY, STAGES, P, S, C } = GAME; const bad = v => typeof v !== 'number' || !Number.isFinite(v);
    const ALLOW_BASE = new Set(['0.36', '0.6', '0.9', '1', '1.5', '2.25']), ALLOW_EVO = new Set(['1', '1.5', '2.25']); const TIER = { 1: 1, 2: 1.5, 3: 2.2 };
    const elsOf = id => { const d = ENEMY[id]; if (d.el) return [d.el]; const s = new Set(); for (const st of STAGES) if (st.roster.includes(id)) for (const e of st.els) s.add(e); return [...s]; };
    const issues = [], affSeen = {}; let cells = 0; const dps = [];
    const owners = [...Object.values(WBY), ...EVOS];
    for (const ow of owners) { const parts = ow.parts ? ow.parts.map(p => WBY[p]) : [ow]; const isEvo = !!ow.parts;
      // 피해 공식 (lv 1..5)
      for (let lv = 1; lv <= 5; lv++) { P.w = { [ow.id]: lv }; for (const w of parts) { const d = GAME.dmgOf(w, ow); const exp = w.dmg * Math.pow(1.25, lv - 1) * TIER[ow.tier || 1]; if (bad(d) || d <= 0) issues.push({ k: 'dmg-bad', ow: ow.id, w: w.id, lv, d }); else if (Math.abs(d - exp) > 1e-6) issues.push({ k: 'dmg-formula', ow: ow.id, w: w.id, lv, d, exp }); } }
      P.w = { [ow.id]: 5 }; const cdm = 1 / .8; // cdMul at cd passive 0
      let dpsSum = 0; for (const w of parts) { const d = GAME.dmgOf(w, ow); const hits = w.type === 'throw' ? (1 + (w.pierce + 4)) * 2 : 1; dpsSum += d / (w.cd * cdm); } dps.push({ id: ow.id, tier: ow.tier || 1, dps1 : +dpsSum.toFixed(1), parts: parts.map(p => p.id) });
      // 상성
      for (const [eid, d] of Object.entries(ENEMY)) for (const el of elsOf(eid)) { cells++; const o = { el, armor: d.armor }; const a = GAME.affinity(ow, o); const key = String(+a.toFixed(4)); (affSeen[isEvo ? 'evo' : ow.neutral ? 'neutral' : 'base'] ||= {})[key] = ((affSeen[isEvo ? 'evo' : ow.neutral ? 'neutral' : 'base'] || {})[key] || 0) + 1;
        if (bad(a) || a <= 0) issues.push({ k: 'aff-bad', ow: ow.id, eid, el, a });
        else if (ow.neutral ? a !== 1 : isEvo ? !ALLOW_EVO.has(key) : !ALLOW_BASE.has(key)) issues.push({ k: 'aff-range', ow: ow.id, eid, el, a });
        // 진화 = 부모 중 최대 (불리 없음) 검증
        if (isEvo) { const best = Math.max(...parts.map(p => GAME.affinity(p, o)), 1); const em = Math.max(1, ...ow.els.map(we => we === el ? 1 : GAME.BEATS[we] === el ? 1.5 : 1)); const tm = Math.max(1, ...ow.types.map(t => ({ throw: { light: 1.5 }, melee: { heavy: 1.5 }, aura: { none: 1.5 } })[t][d.armor] || 1)); if (Math.abs(a - em * tm) > 1e-9) issues.push({ k: 'evo-aff-formula', ow: ow.id, eid, el, a, exp: em * tm }); if (a < best - 1e-9) issues.push({ k: 'evo-aff<parent', ow: ow.id, eid, el, a, best }); }
        // 요괴별 유효 피해 (lv5)
        for (const w of parts) { const d = GAME.dmgOf(w, ow) * a; if (bad(d) || d <= 0) issues.push({ k: 'eff-dmg-bad', ow: ow.id, w: w.id, eid, el, d }); } }
    }
    // 진화 시점 DPS 절벽: 부모 lv5 → 진화 lv1
    const cliff = EVOS.map(e => { const parts = e.parts.map(p => WBY[p]); let before = 0, after = 0; for (const p of parts) { P.w = { [p.id]: 5 }; before += GAME.dmgOf(p, p) / p.cd; P.w = { [e.id]: 1 }; after += GAME.dmgOf(p, e) / p.cd; } return { id: e.id, tier: e.tier, ratio: +(after / before).toFixed(3) }; });
    const byTier = {}; for (const c of cliff) (byTier[c.tier] ||= new Set()).add(c.ratio); const cliffSummary = Object.fromEntries(Object.entries(byTier).map(([t, s]) => [t, [...s]]));
    // 3단: 재료 2단 lv5 → 3단 lv1 (재료 2단 기준)
    P.w = {}; const t2lv5 = 1.5 * Math.pow(1.25, 4), t3lv1 = 2.2;
    dps.sort((a, b) => a.dps1 - b.dps1); const med = dps[Math.floor(dps.length / 2)].dps1;
    const n1 = dps.filter(d => d.tier === 1), med1 = n1[Math.floor(n1.length / 2)].dps1;
    return { cells, issues: issues.slice(0, 40), nIssues: issues.length, affSeen, dpsLow: n1.slice(0, 5), dpsHigh: n1.slice(-5), medianBaseDps: med1, evoCliffRatio: cliffSummary, t3vsT2lv5: +(t3lv1 / t2lv5).toFixed(3), weaponCount: Object.keys(WBY).length, evoCount: EVOS.length, enemyCount: Object.keys(ENEMY).length, dpsAll: dps };
  });
  sec('1 damage matrix', { ...r, dpsAll: undefined }); OUT.sections['1 damage matrix'].dpsAll = r.dpsAll; await pg.close(); }

// ───────── 2. 진화 그래프 ─────────
if (want('2')) { const pg = await fresh('2-evo'); await pg.evaluate(START, [0, 0]);
  const r = await pg.evaluate(() => {
    const { WBY, EVOS, EBY, P, S } = GAME; const issues = []; const ids = new Set();
    for (const e of EVOS) { if (ids.has(e.id)) issues.push({ k: 'id-collision', id: e.id }); ids.add(e.id); if (WBY[e.id]) issues.push({ k: 'id-clash-base', id: e.id });
      for (const p of e.parts) if (!WBY[p]) issues.push({ k: 'part-missing', id: e.id, p }); if (e.parents) for (const p of e.parents) if (!WBY[p]) issues.push({ k: 'parent-missing', id: e.id, p });
      if (e.tier === 2 && e.parts.length !== 2) issues.push({ k: 'tier2-parts', id: e.id, n: e.parts.length }); if (e.tier === 3 && !(e.parts.length === 3 || e.parts.length === 4)) issues.push({ k: 'tier3-parts', id: e.id, n: e.parts.length });
      if (!e.name || /\+|·/.test(e.name) && !e.name.includes(' ')) { /* 이름은 EVO_NAME 없으면 부품명 join — 누락 감지 */ } if (!Object.keys(GAME.EBY).length) issues.push({ k: 'eby-empty' });
      if (e.parts.some(p => WBY[p].neutral)) issues.push({ k: 'neutral-in-evo', id: e.id }); }
    // 이름 누락(EVO_NAME 미등록 → 부품명 join '·')
    const unnamed = EVOS.filter(e => e.name.includes('·') && e.parts.map(p => WBY[p].name).join('·') === e.name).map(e => e.id);
    // 동일 부품 집합 중복
    const sets = {}; for (const e of EVOS) { const k = e.parts.slice().sort().join(','); (sets[k] ||= []).push(e.id); } const dupSets = Object.values(sets).filter(a => a.length > 1);
    // 고아 기본 무기
    const orphans = Object.keys(WBY).filter(id => !WBY[id].neutral && !EVOS.some(e => e.parts.includes(id)));
    const neutralsInEvo = Object.keys(WBY).filter(id => WBY[id].neutral && EVOS.some(e => e.parts.includes(id)));
    // evoOptions 동작: 정확한 재료
    const recipes = []; // {evo, consume}
    for (const e of EVOS) { if (e.tier === 2) recipes.push({ e, consume: e.parents });
      else if (e.types.length === 3) for (const t2 of EVOS.filter(x => x.tier === 2 && x.els.length === 1 && x.els[0] === e.els[0])) recipes.push({ e, consume: [t2.id, e.parts.find(p => !t2.parts.includes(p))] });
      else { const t2s = EVOS.filter(x => x.tier === 2 && x.types.length === 1 && x.types[0] === e.types[0] && x.els.every(el => e.els.includes(el))); for (let i = 0; i < t2s.length; i++) for (let j = i + 1; j < t2s.length; j++) if (!t2s[i].els.some(el => t2s[j].els.includes(el))) recipes.push({ e, consume: [t2s[i].id, t2s[j].id] }); } }
    let okExact = 0, okPartial = 0, okPick = 0;
    for (const rc of recipes) {
      P.w = {}; P.used = new Set(); for (const id of rc.consume) P.w[id] = GAME.weaponOf(id).max;
      const opts = GAME.evoOptions(); const mine = opts.filter(o => o.e.id === rc.e.id);
      if (mine.length !== 1) issues.push({ k: 'exact-not-offered', evo: rc.e.id, consume: rc.consume, got: opts.map(o => o.e.id) }); else { okExact++; const c = mine[0].consume.slice().sort().join(), want = rc.consume.slice().sort().join(); if (c !== want) issues.push({ k: 'consume-mismatch', evo: rc.e.id, want, c }); }
      const others = opts.filter(o => o.e.id !== rc.e.id); if (others.length) { /* 같은 재료로 다른 진화도 가능하면 기록 (중복 레시피) */ issues.push({ k: 'extra-evo-same-mats', evo: rc.e.id, others: others.map(o => o.e.id) }); }
      // 한 재료 lv-1
      for (const id of rc.consume) { P.w = {}; for (const j of rc.consume) P.w[j] = GAME.weaponOf(j).max; P.w[id] = GAME.weaponOf(id).max - 1; if (GAME.evoOptions().some(o => o.e.id === rc.e.id)) issues.push({ k: 'offered-with-lv4', evo: rc.e.id, low: id }); else okPartial++; }
      // pick → 부품 제거·evo lv1·used
      P.w = {}; P.used = new Set(); for (const id of rc.consume) P.w[id] = GAME.weaponOf(id).max; const opt = GAME.evoOptions().find(o => o.e.id === rc.e.id); if (!opt) continue;
      const evoBefore = GAME.META.evo.slice(); GAME.pick({ kind: 'e', d: opt.e, consume: opt.consume, lv: 0 }); S.mode = 'play';
      if (P.w[rc.e.id] !== 1) issues.push({ k: 'pick-evo-lv', evo: rc.e.id, lv: P.w[rc.e.id] }); for (const id of rc.consume) { if (P.w[id]) issues.push({ k: 'pick-part-remains', evo: rc.e.id, id }); if (!P.used.has(id)) issues.push({ k: 'pick-used-missing', evo: rc.e.id, id }); }
      if (GAME.evoOptions().some(o => o.e.id === rc.e.id)) issues.push({ k: 'reoffer-after-pick', evo: rc.e.id });
      // choices()에 소비 부품이 '새로 익힘'으로 재등장하는지 (deck 전체)
      for (let t = 0; t < 5; t++) { const ch = GAME.choices(); for (const c of ch) if (c.kind === 'w' && rc.consume.includes(c.d.id)) issues.push({ k: 'consumed-reoffered', evo: rc.e.id, id: c.d.id }); }
      okPick++; GAME.META.evo = evoBefore; }
    // tier3 재료 조합 수 요약
    const t3recipes = recipes.filter(r => r.e.tier === 3).length;
    // 진화 unlock 일관성: evo.unlock = max(parts.unlock)
    for (const e of EVOS) { const u = Math.max(...e.parts.map(p => WBY[p].unlock || 0)); if ((e.unlock || 0) !== u) issues.push({ k: 'unlock-mismatch', id: e.id, u: e.unlock, want: u }); }
    P.w = {}; P.used = new Set();
    const byK = {}; for (const i of issues) byK[i.k] = (byK[i.k] || 0) + 1;
    return { evos: EVOS.length, tier2: EVOS.filter(e => e.tier === 2).length, tier3: EVOS.filter(e => e.tier === 3).length, recipes: recipes.length, t3recipes, okExact, okPartial, okPick, unnamed, dupSets, orphans, neutralsInEvo, byK, issues: issues.filter(i => i.k !== 'extra-evo-same-mats').slice(0, 30), extraSame: issues.filter(i => i.k === 'extra-evo-same-mats').slice(0, 5) };
  });
  sec('2 evolution graph', r); await pg.close(); }

// ───────── 3. 실사격: 100무기 × 6스테이지 ─────────
if (want('3')) { const pg = await fresh('3-fire'); const all = {};
  for (let stage = 0; stage < 6; stage++) {
    await pg.evaluate(START, [stage, 0]);
    const r = await pg.evaluate((stage) => {
      const { S, P, E, B, G, ZONE, PFX, ARC, STRIKES, EB, CHESTS, WBY, EVOS, STAGES, C } = GAME; const st = STAGES[stage]; const ids = [...Object.keys(WBY), ...EVOS.map(e => e.id)]; const out = [];
      for (const id of ids) { const w = GAME.weaponOf(id);
        E.length = 0; B.length = 0; G.length = 0; ZONE.length = 0; PFX.length = 0; ARC.length = 0; STRIKES.length = 0; EB.length = 0; CHESTS.length = 0; for (const k in GAME.WCD) GAME.WCD[k] = 0;
        P.w = { [id]: 5 }; P.p = {}; P.used = new Set(); P.x = P.y = 0; P.dx = 1; P.dy = 0; S.t = 120; S.xp = -1e9; S.spawnAcc = -1e9; S.bossDone = [true, true]; S.eliteIdx = 5; S.mode = 'play'; S.shrinkT = 0; S.burnT = 0; S.slowT = 0; S.freeze = 0;
        const spawned = []; for (let k = 0; k < 20; k++) { const o = GAME.spawn(st.roster[k % 5]); const a = k / 20 * 6.283, d = 30 + (k % 4) * 25; o.x = Math.cos(a) * d; o.y = Math.sin(a) * d; o.kx = o.ky = 0; spawned.push(o); }
        const totalHp = spawned.reduce((a, o) => a + o.maxhp, 0);
        const eff = { burn: 0, slow: 0, kb: 0, stun: 0, arc: 0 }; let maxB = 0, maxPFX = 0, maxZ = 0, nan = 0, err = null, heal = 0, ticks = 0, enemyNaNpos = 0;
        const kills0 = S.kills, dt = 1 / 30;
        for (let i = 0; i < 180; i++) { S.hp = S.maxhp - 50; const hp0 = S.hp; try { GAME.tick(dt); } catch (e) { err = (e.stack || String(e)).slice(0, 200); break; } ticks++;
          if (S.mode !== 'play') { S.mode = 'play'; } const gain = S.hp - hp0 - C.REGEN * dt; if (gain > 1e-6) heal += gain; STRIKES.length = 0;
          maxB = Math.max(maxB, B.length); maxPFX = Math.max(maxPFX, PFX.length); maxZ = Math.max(maxZ, ZONE.length); if (ARC.length) { eff.arc += ARC.length; ARC.length = 0; }
          for (const o of E) { if (!Number.isFinite(o.hp)) nan++; if (!Number.isFinite(o.x) || !Number.isFinite(o.y)) enemyNaNpos++; if (o.burn > 0) eff.burn++; if (o.slow > 0) eff.slow++; if (o.stun > 0) eff.stun++; if (Math.hypot(o.kx, o.ky) > 5) eff.kb++; } }
        const dmg = spawned.reduce((a, o) => a + (o.alive ? o.maxhp - Math.max(0, o.hp) : o.maxhp), 0);
        out.push({ id, tier: w.tier || 1, els: w.els || [w.neutral ? 'none' : w.el], types: w.types || [w.type || w.kind], dmg: +dmg.toFixed(1), totalHp: +totalHp.toFixed(1), kills: S.kills - kills0, maxB, maxPFX, maxZ, nan, enemyNaNpos, err, eff, heal: +heal.toFixed(2), ticks, left: E.length }); }
      return out; }, stage);
    all[stage] = r; const zero = r.filter(x => x.dmg <= 0).map(x => x.id), errs = r.filter(x => x.err).map(x => x.id + ': ' + x.err.split('\n')[0]); console.log(`stage ${stage + 1}: weapons=${r.length} zeroDmg=${JSON.stringify(zero)} errs=${errs.length} ${errs.slice(0, 3).join(' | ')} maxB=${Math.max(...r.map(x => x.maxB))} maxPFX=${Math.max(...r.map(x => x.maxPFX))} nan=${r.reduce((a, x) => a + x.nan + x.enemyNaNpos, 0)}`);
  }
  // 속성 효과 집계 (스테이지 전체 합)
  const byEl = {}; const ELS = ['fire', 'water', 'wood', 'metal', 'light', 'dark', 'earth', 'thunder', 'none'];
  for (const el of ELS) byEl[el] = { weapons: 0, burn: 0, slow: 0, kb: 0, stun: 0, arc: 0, heal: 0 };
  for (const s in all) for (const x of all[s]) for (const el of x.els) { const b = byEl[el]; b.weapons++; b.burn += x.eff.burn; b.slow += x.eff.slow; b.kb += x.eff.kb; b.stun += x.eff.stun; b.arc += x.eff.arc; b.heal += x.heal; }
  // 무기별 속성 효과 미발동 (해당 속성 무기인데 전 스테이지에서 0)
  const miss = []; for (const id of Object.keys(all[0]).map(k => all[0][k].id)) { const rows = Object.values(all).map(s => s.find(x => x.id === id)); const els = rows[0].els, types = rows[0].types; const sum = k => rows.reduce((a, x) => a + (k === 'heal' ? x.heal : x.eff[k]), 0);
    if (els.includes('fire') && !sum('burn')) miss.push(id + ':burn'); if (els.includes('water') && !sum('slow')) miss.push(id + ':slow'); if (els.includes('earth') && !sum('stun')) miss.push(id + ':stun'); if (els.includes('thunder') && !sum('arc')) miss.push(id + ':arc'); if ((els.includes('light') || els.includes('dark')) && !sum('heal')) miss.push(id + ':heal');
    if (els.includes('metal') && !sum('kb')) miss.push(id + ':kb(' + types.join('/') + ')'); }
  const zeroAny = []; for (const s in all) for (const x of all[s]) if (x.dmg <= 0) zeroAny.push(`s${+s + 1}:${x.id}`);
  const errAny = []; for (const s in all) for (const x of all[s]) if (x.err) errAny.push(`s${+s + 1}:${x.id}: ${x.err.split('\n')[0]}`);
  // 균형: 스테이지1 피해량 순위
  const s1 = all[0].slice().sort((a, b) => a.dmg - b.dmg); const base = s1.filter(x => x.tier === 1); const medB = base[Math.floor(base.length / 2)].dmg;
  const pct = x => +(x.dmg / x.totalHp * 100).toFixed(0);
  sec('3 live firing', { zeroAny, errAny: errAny.slice(0, 20), nErr: errAny.length, byEl, effectMissing: miss, bounds: { maxB: Math.max(...Object.values(all).flat().map(x => x.maxB)), maxPFX: Math.max(...Object.values(all).flat().map(x => x.maxPFX)), maxZ: Math.max(...Object.values(all).flat().map(x => x.maxZ)) }, nan: Object.values(all).flat().reduce((a, x) => a + x.nan + x.enemyNaNpos, 0),
    s1BaseLow: base.slice(0, 6).map(x => `${x.id} ${pct(x)}% k${x.kills}`), s1BaseHigh: base.slice(-6).map(x => `${x.id} ${pct(x)}% k${x.kills}`), s1BaseMedianDmg: medB, s1Tier2: s1.filter(x => x.tier === 2).map(x => `${x.id} ${pct(x)}%`).slice(0, 4).concat(['…'], s1.filter(x => x.tier === 2).map(x => `${x.id} ${pct(x)}%`).slice(-4)), s1Tier3: s1.filter(x => x.tier === 3).map(x => `${x.id} ${pct(x)}%`), perStageKillPct: Object.fromEntries(Object.entries(all).map(([s, r]) => [`s${+s + 1}`, +(r.reduce((a, x) => a + x.kills, 0) / (r.length * 20) * 100).toFixed(0)])) });
  OUT.sections['3 live firing'].raw = all; await pg.close(); }

// ───────── 3b. 땅 속성 보스 경직 락 · 소금 보스 넉백 ─────────
if (want('3b')) { const pg = await fresh('3b-stun'); await pg.evaluate(START, [0, 0]);
  const r = await pg.evaluate(() => { const { S, P, E, B, STRIKES } = GAME; const run = (wset, pset, bossType, secs = 20) => { E.length = 0; B.length = 0; for (const k in GAME.WCD) GAME.WCD[k] = 0; P.w = wset; P.p = pset; P.used = new Set(); P.x = P.y = 0; P.dx = 1; P.dy = 0; S.t = 310; S.xp = -1e9; S.spawnAcc = -1e9; S.bossDone = [true, true]; S.eliteIdx = 5; S.mode = 'play';
      const b = GAME.spawn(bossType, true); b.x = 60; b.y = 0; b.hp = b.maxhp = 1e9; let stunT = 0, moved = 0, lx = b.x, ly = b.y, minD = 1e9, contact = 0, kbMax = 0; const dt = 1 / 30;
      for (let i = 0; i < secs * 30; i++) { const hp0 = S.hp = S.maxhp; GAME.tick(dt); S.mode = 'play'; if (b.stun > 0) stunT += dt; moved += Math.hypot(b.x - lx, b.y - ly); lx = b.x; ly = b.y; minD = Math.min(minD, Math.hypot(b.x, b.y)); if (S.hp < hp0) contact++; kbMax = Math.max(kbMax, Math.hypot(b.kx, b.ky)); }
      return { stunFrac: +(stunT / secs).toFixed(2), moved: +moved.toFixed(0), minDist: +minD.toFixed(0), contactTicks: contact, bossKbMax: +kbMax.toFixed(0) }; };
    return { earthAllLv5_vs_boss1: run({ 'e:earth:all': 5 }, {}, 'boss1'), sandstormLv5_cd5: run({ sandstorm: 5 }, { cd: 5 }, 'boss1'), sandstormLv1: run({ sandstorm: 1 }, {}, 'boss1'), rockhammerLv5: run({ rockhammer: 5 }, {}, 'boss1'), slingLv5_bag3: run({ sling: 5 }, { bag: 3 }, 'boss1'), earthAll_vs_boss2: run({ 'e:earth:all': 5 }, {}, 'boss2'), noWeapon_salt3_vs_boss1: run({}, { salt: 3 }, 'boss1', 10), noWeapon_vs_boss1: run({}, {}, 'boss1', 10), sickleLv5_vs_boss1_kb: run({ sickle: 5 }, {}, 'boss1', 5) }; });
  sec('3b earth stun lock / salt vs boss', r); await pg.close(); }

// ───────── 4. 패시브 ─────────
if (want('4')) { const pg = await fresh('4-passives'); await pg.evaluate(START, [0, 0]);
  const r = await pg.evaluate(() => { const { S, P, E, B, G, PASSIVES, C } = GAME; const PBY = Object.fromEntries(PASSIVES.map(p => [p.id, p])); const out = {}, issues = [];
    const reset = () => { E.length = 0; B.length = 0; G.length = 0; for (const k in GAME.WCD) GAME.WCD[k] = 0; P.x = P.y = 0; P.dx = 1; P.dy = 0; S.t = 100; S.xp = 0; S.need = 1e9; S.spawnAcc = -1e9; S.bossDone = [true, true]; S.eliteIdx = 5; S.mode = 'play'; S.slowT = 0; S.burnT = 0; };
    const setP = (id, lv) => { P.p = {}; if (lv > 0) { P.p[id] = lv - 1; GAME.pick({ kind: 'p', d: PBY[id], lv: lv - 1 }); S.mode = 'play'; } else { P.p = {}; GAME.pick({ kind: 'p', d: PBY.xp, lv: 0 }); delete P.p.xp; S.mode = 'play'; } };
    const measure = {
      spd: () => P.spd, hp: () => S.maxhp,
      cd: () => { reset(); P.w = { talisman: 1 }; const o = GAME.spawn('egg'); o.x = 50; o.y = 0; GAME.WCD.talisman = 0; GAME.tick(1 / 60); return GAME.WCD.talisman + 1 / 60; },
      pick: () => { reset(); P.w = {}; let lo = 0, hi = 600; for (let it = 0; it < 14; it++) { const mid = (lo + hi) / 2; G.length = 0; GAME.dropGem(mid, 0, 1); G[0].x = mid; G[0].y = 0; GAME.tick(1 / 1000); if (G.length && G[0].mag || !G.length) lo = mid; else hi = mid; } return lo; },
      armor: () => { reset(); P.w = {}; const o = GAME.spawn('egg'); o.x = 5; o.y = 0; o.touchCd = 0; o.d.spd; S.hp = 60; GAME.tick(1 / 1000); return 60 - S.hp + C.REGEN / 1000; },
      salt: () => { reset(); P.w = {}; const o = GAME.spawn('egg'); o.x = 5; o.y = 0; o.touchCd = 0; GAME.tick(1 / 1000); return { kb: +Math.hypot(o.kx, o.ky).toFixed(0), stun: +o.stun.toFixed(2) }; },
      xp: () => { reset(); P.w = {}; S.xp = 0; GAME.dropGem(0, 0, 10); G[0].x = 0; G[0].y = 0; GAME.tick(1 / 1000); return S.xp; },
      bag: () => { reset(); P.w = { talisman: 1 }; const o = GAME.spawn('egg'); o.x = 50; o.y = 0; GAME.WCD.talisman = 0; GAME.tick(1 / 1000); return B.length; } };
    for (const p of PASSIVES) { const vals = []; for (let lv = 0; lv <= p.max; lv++) { setP(p.id, lv); vals.push(measure[p.id]()); }
      out[p.id] = { max: p.max, vals: vals.map(v => typeof v === 'number' ? +v.toFixed(3) : v) };
      const nums = vals.map(v => typeof v === 'number' ? v : v.kb + v.stun); if (nums.some(v => !Number.isFinite(v))) issues.push({ k: 'nan', id: p.id, vals });
      const dir = ['cd', 'armor'].includes(p.id) ? -1 : 1; for (let i = 1; i < nums.length; i++) if ((nums[i] - nums[i - 1]) * dir <= 1e-9) issues.push({ k: 'not-monotonic', id: p.id, i, vals: nums });
      // 레벨 초과 테스트: max+1 로 pick 가능? (choices 가 막는지는 8절)
    }
    // hp 패시브: 즉시 회복 30%
    reset(); P.p = {}; GAME.pick({ kind: 'p', d: PBY.xp, lv: 0 }); S.mode = 'play'; S.hp = 10; const mh0 = S.maxhp; GAME.pick({ kind: 'p', d: PBY.hp, lv: 0 }); S.mode = 'play'; out.hpPickHeal = { before: 10, after: +S.hp.toFixed(1), maxBefore: mh0, maxAfter: S.maxhp, expect: +(10 * S.maxhp / mh0 + S.maxhp * .3).toFixed(1) };
    P.p = {}; return { out, issues }; });
  sec('4 passives', r); await pg.close(); }

// ───────── 5. 스테이지 위험요소 ─────────
if (want('5')) { const pg = await fresh('5-hazards'); const r = {};
  // 5a 안개 늪 (stage index 3)
  await pg.evaluate(START, [3, 0]);
  r.shrink = await pg.evaluate(() => { const { S, P, E, STAGES, C } = GAME; const st = STAGES[3]; E.length = 0; S.spawnAcc = -1e9; S.bossDone = [true, true]; S.eliteIdx = 5; S.xp = -1e9; P.w = {}; const Rs = []; const dt = 1 / 30;
    for (let i = 0; i < 30 * 60; i++) { GAME.tick(dt); if (i % 600 === 0) Rs.push(+GAME.arenaR().toFixed(1)); } const r60 = GAME.arenaR(); const dec = Rs.every((v, i) => i === 0 || v < Rs[i - 1]);
    // 보스 생존 중 정지
    const sh0 = S.shrinkT; const b = GAME.spawn('lanternking', true); b.x = 400; b.y = 0; b.hp = 1e9; for (let i = 0; i < 90; i++) { S.hp = S.maxhp; GAME.tick(dt); } const paused = S.shrinkT === sh0; GAME.kill(b); for (let i = 0; i < 30; i++) GAME.tick(dt); const resumed = S.shrinkT > sh0;
    // 바깥 피해
    S.hp = S.maxhp; P.x = GAME.arenaR() + 50; P.y = 0; const hp0 = S.hp; for (let i = 0; i < 30; i++) GAME.tick(dt); const outside = +(hp0 - S.hp).toFixed(2); const fog = S.fogT; P.x = 0; S.hp = S.maxhp; const hp1 = S.hp; for (let i = 0; i < 30; i++) GAME.tick(dt); const inside = +(hp1 - S.hp).toFixed(2);
    // 끝까지 (shrinkT >= by) 반경 하한 고정
    S.shrinkT = st.shrink.by + 100; const rEnd = GAME.arenaR();
    return { Rs, r60: +r60.toFixed(1), decreasing: dec, pausedWhileBoss: paused, resumedAfterKill: resumed, outsideDmg1s: outside, expectOutside: +(5 - C.REGEN).toFixed(2), fogT: +fog.toFixed(2), insideDmg1s: inside, rEnd, r1: st.shrink.r1, r0: st.shrink.r0 }; });
  // 5b 낙석(4) · 낙뢰(5)
  for (const [stage, key] of [[4, 'rock'], [5, 'bolt']]) { await pg.evaluate(START, [stage, 0]);
    r[key] = await pg.evaluate((stage) => { const { S, P, E, STRIKES, STAGES, C } = GAME; const sk = STAGES[stage].strike; E.length = 0; S.spawnAcc = -1e9; S.bossDone = [true, true]; S.eliteIdx = 5; S.xp = -1e9; P.w = {}; P.x = P.y = 0; const dt = 1 / 30; let pushes = 0, maxLive = 0; const kinds = new Set(); let firstT = -1;
      for (let i = 0; i < 30 * 20; i++) { const n0 = STRIKES.length; S.hp = S.maxhp; GAME.tick(dt); if (STRIKES.length > n0) { pushes += STRIKES.length - n0; if (firstT < 0) firstT = +S.t.toFixed(2); } maxLive = Math.max(maxLive, STRIKES.length); for (const z of STRIKES) kinds.add(z.kind); }
      const rate = pushes / 20, expectRate = sk.n / sk.every;
      // 예고 후 피해: 플레이어 위
      STRIKES.length = 0; STRIKES.push({ x: 0, y: 0, t: 0, tele: sk.tele, r: sk.r, dmg: sk.dmg, kind: sk.kind }); S.hp = S.maxhp; let hitAt = -1; const hpA = S.hp; for (let i = 0; i < 60; i++) { GAME.tick(dt); if (hitAt < 0 && S.hp < hpA - 1) hitAt = +(i * dt).toFixed(2); } const dmgP = +(hpA - S.hp).toFixed(1);
      // 반경 밖 (r + P.r*.5 + 1)
      STRIKES.length = 0; STRIKES.push({ x: sk.r + P.r * .5 + 2, y: 0, t: 0, tele: sk.tele, r: sk.r, dmg: sk.dmg, kind: sk.kind }); S.hp = S.maxhp; const hpB = S.hp; for (let i = 0; i < 60; i++) GAME.tick(dt); const dmgOut = +(hpB - S.hp).toFixed(2);
      // 요괴 피해 (비보스 ×1 / 낙뢰 ×1.5), 보스 면역
      E.length = 0; const o = GAME.spawn('egg'); o.x = 300; o.y = 0; o.hp = o.maxhp = 1000; const b = GAME.spawn('boss1', true); b.x = 300; b.y = 0; b.hp = b.maxhp = 1e6; STRIKES.length = 0; STRIKES.push({ x: 300, y: 0, t: sk.tele - .001, tele: sk.tele, r: sk.r, dmg: sk.dmg, kind: sk.kind }); GAME.tick(dt); const eDmg = +(1000 - o.hp).toFixed(1), bDmg = 1e6 - b.hp;
      // 범위: 플레이어 기준 거리 분포
      STRIKES.length = 0; S.strikeT = sk.every - .001; GAME.tick(dt); const dists = STRIKES.map(z => +Math.hypot(z.x - P.x, z.y - P.y).toFixed(0));
      return { rate: +rate.toFixed(2), expectRate: +expectRate.toFixed(2), firstT, maxLive, kinds: [...kinds], playerHitAt: hitAt, tele: sk.tele, dmgPlayer: dmgP, expectDmg: sk.dmg, dmgOutside: dmgOut, enemyDmg: eDmg, expectEnemy: sk.dmg * (sk.kind === 'bolt' ? 1.5 : 1), bossDmg: bDmg, spawnDists: dists }; }, stage); }
  // 5c 경계(1, 5): 플레이어 클램프 · 스폰 위치
  for (const stage of [1, 5]) { await pg.evaluate(START, [stage, 0]);
    r['bound' + stage] = await pg.evaluate((stage) => { const { S, P, E, KEY, STAGES, STRIKES } = GAME; const st = STAGES[stage]; E.length = 0; S.spawnAcc = -1e9; S.bossDone = [true, true]; S.eliteIdx = 5; S.xp = -1e9; P.w = {}; const dt = 1 / 30; let maxY = 0; KEY.KeyW = true; for (let i = 0; i < 300; i++) { S.hp = S.maxhp; GAME.tick(dt); STRIKES.length = 0; maxY = Math.max(maxY, Math.abs(P.y)); } KEY.KeyW = false; KEY.KeyS = true; let maxY2 = 0; for (let i = 0; i < 300; i++) { S.hp = S.maxhp; GAME.tick(dt); STRIKES.length = 0; maxY2 = Math.max(maxY2, Math.abs(P.y)); } KEY.KeyS = false; P.x = P.y = 0;
      let outSpawn = 0, outAfterTick = 0, maxAbsY = 0, farX = 0; for (let k = 0; k < 500; k++) { E.length = 0; const o = GAME.spawn(st.roster[k % 5]); maxAbsY = Math.max(maxAbsY, Math.abs(o.y)); if (Math.abs(o.y) > st.bound - o.r + 1e-6) outSpawn++; if (Math.abs(o.x) > 2000) farX++; GAME.tick(dt); STRIKES.length = 0; if (E[0] && Math.abs(E[0].y) > st.bound - E[0].r + 1e-6) outAfterTick++; }
      // 보스 스폰도 경계 안?
      let bossOut = 0; for (let k = 0; k < 100; k++) { E.length = 0; const b = GAME.spawn(st.bosses[k % 2], true); if (Math.abs(b.y) > st.bound - b.r) bossOut++; }
      E.length = 0; return { bound: st.bound, playerMaxAbsY_up: +maxY.toFixed(1), playerMaxAbsY_down: +maxY2.toFixed(1), limit: st.bound - P.r, spawnOutOfBound: outSpawn, outAfterTick, maxSpawnAbsY: +maxAbsY.toFixed(0), bossSpawnOut: bossOut }; }, stage); }
  // 5d 장애물 (1 tree, 2 wall+fire, 4 wall): 플레이어 관통 · 요괴 정체
  for (const stage of [1, 2, 4]) { await pg.evaluate(START, [stage, 0]);
    r['obst' + stage] = await pg.evaluate((stage) => { const { S, P, E, KEY, STAGES, STRIKES } = GAME; const st = STAGES[stage]; E.length = 0; S.spawnAcc = -1e9; S.bossDone = [true, true]; S.eliteIdx = 5; S.xp = -1e9; P.w = {}; const dt = 1 / 30;
      // 플레이어: 주변 장애물로 돌진 — 들어가는지 (solid 안쪽 침투 깊이)
      const solids = GAME.nearObst(0, 0).filter(b => b.solid).concat(GAME.nearObst(300, 0).filter(b => b.solid), GAME.nearObst(0, -300).filter(b => b.solid)).slice(0, 8); let pen = 0, tested = 0;
      for (const b of solids) { tested++; P.x = b.x - 120; P.y = b.y; S.hp = S.maxhp; for (let i = 0; i < 150; i++) { const dx = b.x - P.x, dy = b.y - P.y, d = Math.hypot(dx, dy) || 1; KEY.KeyD = dx > 0; KEY.KeyA = dx < 0; KEY.KeyS = dy > 5; KEY.KeyW = dy < -5; GAME.tick(dt); STRIKES.length = 0; S.hp = S.maxhp;
          if (b.k === 'tree') { pen = Math.max(pen, b.r + P.r - Math.hypot(P.x - b.x, P.y - b.y)); } else { const nx = Math.max(b.x - b.w / 2, Math.min(b.x + b.w / 2, P.x)), ny = Math.max(b.y - b.h / 2, Math.min(b.y + b.h / 2, P.y)); pen = Math.max(pen, P.r - Math.hypot(P.x - nx, P.y - ny)); } } }
      KEY.KeyD = KEY.KeyA = KEY.KeyS = KEY.KeyW = false; P.x = P.y = 0;
      // 화염 구덩이 피해 (stage 2)
      let fireDmg = null; const fz = GAME.nearObst(0, 0).concat(GAME.nearObst(300, 300), GAME.nearObst(-300, 300)).find(b => b.hazard); if (fz) { P.x = fz.x; P.y = fz.y; S.hp = S.maxhp; for (let i = 0; i < 30; i++) GAME.tick(dt); fireDmg = +(S.maxhp - S.hp).toFixed(2); P.x = P.y = 0; }
      // 요괴 정체: 60마리 원형 스폰 → 15초 후 멀리서 5초간 2px 미만 이동
      E.length = 0; const Es = []; for (let k = 0; k < 60; k++) { const o = GAME.spawn(st.roster[k % 5]); const a = k / 60 * 6.283; o.x = Math.cos(a) * 450; o.y = Math.max(-(st.bound || 1e9) + 30, Math.min((st.bound || 1e9) - 30, Math.sin(a) * 450)); o.hp = o.maxhp = 1e9; Es.push(o); }
      for (let i = 0; i < 300; i++) { S.hp = S.maxhp; GAME.tick(dt); STRIKES.length = 0; } const pos = Es.map(o => [o.x, o.y]); for (let i = 0; i < 150; i++) { S.hp = S.maxhp; GAME.tick(dt); STRIKES.length = 0; }
      let stuck = 0, far = 0; const stuckEx = []; for (let k = 0; k < Es.length; k++) { const o = Es[k]; if (!o.alive) continue; const d = Math.hypot(o.x, o.y); if (d > 80) { far++; const mv = Math.hypot(o.x - pos[k][0], o.y - pos[k][1]); if (mv < 2) { stuck++; if (stuckEx.length < 3) stuckEx.push({ type: o.type, x: +o.x.toFixed(0), y: +o.y.toFixed(0), d: +d.toFixed(0), near: GAME.nearObst(o.x, o.y).filter(b => b.solid && Math.hypot(b.x - o.x, b.y - o.y) < 80).map(b => b.k + '@' + b.x.toFixed(0) + ',' + b.y.toFixed(0)) }); } } }
      E.length = 0; return { solidsTested: tested, maxPenetration: +pen.toFixed(2), fireDmg1s: fireDmg, enemiesFarAfter20s: far, stuck5s: stuck, stuckEx, alive: Es.filter(o => o.alive).length }; }, stage); }
  sec('5 hazards', r); await pg.close(); }

// ───────── 6. 상자 ─────────
if (want('6')) { const pg = await fresh('6-chest'); await pg.evaluate(START, [0, 0]);
  const r = await pg.evaluate(() => { const { S, P, E, CHESTS, WBY, EBY, EVOS } = GAME; const issues = []; E.length = 0; S.spawnAcc = -1e9; S.bossDone = [true, true]; S.eliteIdx = 5; S.xp = -1e9; P.w = {};
    // 등급 분포
    const grades = {}; let coins0 = S.coins, sh0 = S.shardsRun; for (let i = 0; i < 3000; i++) { const o = GAME.spawn('egg', false, true); GAME.kill(o); const c = CHESTS.pop(); grades[c.grade.g] = (grades[c.grade.g] || 0) + 1; if (c.from !== '달걀귀신') issues.push({ k: 'chest-from', from: c.from }); }
    const eliteCoins = (S.coins - coins0) / 3000, eliteShards = (S.shardsRun - sh0) / 3000;
    // openChest 조합
    const cases = [
      { n: 'partial', w: { talisman: 1, sword: 3 } }, { n: 'allMaxed', w: { talisman: 5, sword: 5, bell: 5 } }, { n: 'evoLv4', w: { 'e:fire:throw+melee': 4, orb: 2 } }, { n: 'oneSlot1', w: { tiger: 1 } }, { n: 'fiveMixed', w: { tiger: 5, moxa: 4, talisman: 5, sunblade: 2, sandstorm: 5 } }, { n: 'evoT3lv5+base', w: { 'e:fire:all': 5, coin: 1 } }, { n: 'empty', w: {} } ];
    const results = {};
    for (const cs of cases) for (const g of [0, 1, 2]) for (let rep = 0; rep < 60; rep++) { P.w = { ...cs.w }; const before = { ...P.w }; const c0 = S.coins; const grade = [{ g: '일반', n: 1 }, { g: '레어', n: 3 }, { g: '에픽', n: 5 }][g]; const CH = [{ g: '일반', n: 1, p: .6, col: '#c9c3b4' }, { g: '레어', n: 3, p: .3, col: '#7fd1ff' }, { g: '에픽', n: 5, p: .1, col: '#d08cff' }][g];
      try { GAME.openChest({ x: 0, y: 0, grade: CH, t: 0, from: 'x' }); } catch (e) { issues.push({ k: 'openChest-throw', cs: cs.n, g, e: e.message }); continue; }
      if (S.mode !== 'chest') issues.push({ k: 'mode', cs: cs.n, m: S.mode });
      let ups = 0; for (const id in P.w) { const w = GAME.weaponOf(id); if (!(id in before)) issues.push({ k: 'new-weapon-from-chest', cs: cs.n, id }); if (P.w[id] > w.max) issues.push({ k: 'over-max', cs: cs.n, id, lv: P.w[id] }); ups += P.w[id] - (before[id] || 0); }
      for (const id in before) if (!(id in P.w)) issues.push({ k: 'weapon-lost', cs: cs.n, id });
      const coinGain = S.coins - c0; if (ups + coinGain / 10 !== CH.n) issues.push({ k: 'reward-count', cs: cs.n, g, ups, coinGain, n: CH.n });
      const rows = document.querySelectorAll('#chList .card').length; (results[cs.n + ':' + grade.g] ||= { ups: 0, coins: 0, rows: new Set() }); results[cs.n + ':' + grade.g].ups += ups; results[cs.n + ':' + grade.g].coins += coinGain; results[cs.n + ':' + grade.g].rows.add(rows);
      document.getElementById('chBtn').click(); if (S.mode !== 'play') issues.push({ k: 'mode-after-close', m: S.mode }); if (document.getElementById('chest').classList.contains('show')) issues.push({ k: 'panel-still-shown' }); }
    for (const k in results) results[k].rows = [...results[k].rows];
    const byK = {}; for (const i of issues) byK[i.k] = (byK[i.k] || 0) + 1; P.w = {};
    return { grades, eliteCoins, eliteShards, results, byK, issues: issues.slice(0, 10) }; });
  sec('6 chests', r); await pg.close(); }

// ───────── 7. 보스 ─────────
if (want('7')) { const pg = await fresh('7-boss'); const rows = [], issues = [];
  for (let stage = 0; stage < 6; stage++) for (let diff = 0; diff < 3; diff++) { await pg.evaluate(START, [stage, diff]);
    const r = await pg.evaluate(([stage, diff]) => { const { S, P, E, G, C, STAGES, ENEMY, DIFFS } = GAME; const st = STAGES[stage]; const out = { stage, diff, issues: [] }; E.length = 0; G.length = 0; S.spawnAcc = -1e9; S.eliteIdx = 5; S.xp = -1e9; P.w = {}; const dt = 1 / 60;
      for (const [bi, at] of [[0, C.BOSS1_AT], [1, C.BOSS2_AT]]) { S.t = at - dt / 2; S.hp = S.maxhp; S.freeze = 0; GAME.tick(dt); const bosses = E.filter(o => o.boss); if (bosses.length !== 1) { out.issues.push({ k: 'boss-count', bi, n: bosses.length }); continue; } const b = bosses[0]; const d = ENEMY[st.bosses[bi]];
        if (b.type !== st.bosses[bi]) out.issues.push({ k: 'boss-type', bi, got: b.type }); if (b.el !== d.el) out.issues.push({ k: 'boss-el', bi, got: b.el, want: d.el }); const wantHp = GAME.enemyHp(S.t) * d.hp; if (Math.abs(b.hp - wantHp) > 1e-6) out.issues.push({ k: 'boss-hp', bi, got: b.hp, want: wantHp }); if (!S.bossDone[bi]) out.issues.push({ k: 'bossDone', bi });
        out['boss' + bi] = { type: b.type, el: b.el, hp: +b.hp.toFixed(1), hpMulVsEasyS1: +(b.hp / (C.HP0 * Math.pow(C.HP_G, S.t) * (bi ? C.BOSS2_HP : C.BOSS1_HP))).toFixed(3), spd: d.spd, armor: d.armor, patterns: d.patterns };
        // 처치 보상
        const c0 = S.coins, s0 = S.shardsRun, k0 = S.kills, g0 = G.length; GAME.kill(b); out['boss' + bi].reward = { coins: S.coins - c0, shards: S.shardsRun - s0, kills: S.kills - k0, gems: G.length - g0, gemV: G.length ? G[G.length - 1].v : null, codex: GAME.META.codex.includes(b.type) }; if (S.coins - c0 !== 30 || S.shardsRun - s0 !== 3 || G.length - g0 !== 1 || G[G.length - 1].v !== d.xp) out.issues.push({ k: 'boss-reward', bi, r: out['boss' + bi].reward }); E.length = 0; G.length = 0; }
      // 보스 패턴 실행 (shoot/pool)
      for (const bi of [0, 1]) { E.length = 0; GAME.EB.length = 0; GAME.ZONE.length = 0; const b = GAME.spawn(st.bosses[bi], true); b.x = 200; b.y = 0; try { GAME.bossPattern(b); } catch (e) { out.issues.push({ k: 'pattern-throw', bi, e: e.message }); } (out['boss' + bi] ||= {}).pattern = { EB: GAME.EB.length, ZONE: GAME.ZONE.length }; if (!(GAME.EB.length || GAME.ZONE.length)) out.issues.push({ k: 'pattern-noop', bi }); }
      // 보스2 생존 상태로 t=600 → 클리어?
      E.length = 0; GAME.EB.length = 0; GAME.ZONE.length = 0; const b2 = GAME.spawn(st.bosses[1], true); b2.x = 300; b2.y = 0; b2.hp = 1e9; S.bossDone = [true, true]; S.t = C.RUN - dt / 2; S.hp = S.maxhp; S.freeze = 0; GAME.tick(dt); out.atRunEnd = { mode: S.mode, cleared: S.cleared, bossAlive: E.some(o => o.boss), bestAfter: GAME.bestOf(diff) };
      return out; }, [stage, diff]);
    rows.push(r); issues.push(...r.issues.map(i => ({ stage, diff, ...i }))); if (r.issues.length) console.log('s' + (stage + 1) + 'd' + diff, JSON.stringify(r.issues).slice(0, 300)); await pg.waitForTimeout(50);
  }
  // 사망 메시지(ovSub) 하드코딩 보스명 확인 — 스테이지 2 (귀신의 숲)
  await pg.waitForTimeout(1100); await pg.evaluate(START, [1, 0]);
  const ovSub = await pg.evaluate(() => { const { S, E } = GAME; E.length = 0; S.spawnAcc = -1e9; S.bossDone = [true, true]; S.eliteIdx = 5; const out = {}; S.t = 545; S.hp = -50; S.freeze = 0; GAME.tick(1 / 60); out.afterBoss2 = document.getElementById('ovSub').textContent; return { ...out, stageBosses: GAME.STAGES[1].bosses.map(b => GAME.ENEMY[b].name) }; });
  await pg.waitForTimeout(1100); await pg.evaluate(START, [1, 0]);
  const ovSub2 = await pg.evaluate(() => { const { S, E } = GAME; E.length = 0; S.spawnAcc = -1e9; S.bossDone = [true, true]; S.eliteIdx = 5; S.t = 305; S.hp = -50; S.freeze = 0; GAME.tick(1 / 60); return document.getElementById('ovSub').textContent; });
  sec('7 bosses', { issues, hpMuls: rows.map(r => `s${r.stage + 1}d${r.diff}: b1 ${r.boss0 && r.boss0.hpMulVsEasyS1} b2 ${r.boss1 && r.boss1.hpMulVsEasyS1}`), els: rows.filter(r => r.diff === 0).map(r => `s${r.stage + 1}: ${r.boss0.type}/${r.boss0.el} ${r.boss1.type}/${r.boss1.el}`), atRunEnd: rows.map(r => r.atRunEnd.cleared + ':' + r.atRunEnd.mode + ':' + r.atRunEnd.bossAlive), patterns: rows.filter(r => r.diff === 0).map(r => `s${r.stage + 1}: ${JSON.stringify(r.boss0.pattern)} ${JSON.stringify(r.boss1.pattern)}`), deathMsgStage2: { afterBoss2: ovSub.afterBoss2, afterBoss1: ovSub2, actualBosses: ovSub.stageBosses } });
  OUT.sections['7 bosses'].rows = rows; await pg.close(); }

// ───────── 8. 레벨업 카드 ─────────
if (want('8')) { const pg = await fresh('8-levelup'); await pg.evaluate(START, [0, 0]);
  const r = await pg.evaluate(() => { const { S, P, E, G, WBY, EBY, EVOS, PASSIVES } = GAME; const issues = [], stats = { n: 0, cards: {}, evo: 0, newW: 0, upW: 0, newP: 0, upP: 0, evoUp: 0, empty: 0, lessThan3: 0 }; const R = n => Math.floor(Math.random() * n); const ids = Object.keys(WBY);
    E.length = 0; G.length = 0; S.spawnAcc = -1e9; S.bossDone = [true, true]; S.eliteIdx = 5;
    const check = (ch, tag) => { stats.n++; stats.cards[ch.length] = (stats.cards[ch.length] || 0) + 1; if (ch.length > 3) issues.push({ k: 'cards>3', tag, n: ch.length }); if (ch.length < 3) stats.lessThan3++; if (!ch.length) stats.empty++;
      const evo = ch.filter(c => c.kind === 'e'); stats.evo += evo.length; if (evo.length > 1) issues.push({ k: 'evo>1', tag }); if (evo.length && ch[0].kind !== 'e') issues.push({ k: 'evo-not-first', tag });
      const nW = Object.keys(P.w).length, nP = Object.keys(P.p).length; const seen = new Set();
      for (const c of ch) { const key = c.kind + ':' + c.d.id; if (seen.has(key)) issues.push({ k: 'dup-card', tag, key }); seen.add(key);
        if (c.kind === 'w') { if (WBY[c.d.id]) { if (!S.deck.includes(c.d.id)) issues.push({ k: 'w-not-in-deck', tag, id: c.d.id }); const lv = P.w[c.d.id] || 0; if (lv !== c.lv) issues.push({ k: 'w-lv-mismatch', tag, id: c.d.id }); if (lv >= c.d.max) issues.push({ k: 'w-maxed-offered', tag, id: c.d.id }); if (!lv) { stats.newW++; if (nW >= 5) issues.push({ k: 'new-w-slots-full', tag, id: c.d.id }); if (P.used.has(c.d.id)) issues.push({ k: 'used-reoffered', tag, id: c.d.id }); } else stats.upW++; }
          else if (EBY[c.d.id]) { stats.evoUp++; if (!P.w[c.d.id]) issues.push({ k: 'evo-up-not-owned', tag, id: c.d.id }); if (P.w[c.d.id] >= 5) issues.push({ k: 'evo-maxed-offered', tag, id: c.d.id }); } else issues.push({ k: 'unknown-w', tag, id: c.d.id }); }
        else if (c.kind === 'p') { const p = PASSIVES.find(x => x.id === c.d.id); const lv = P.p[c.d.id] || 0; if (!p) issues.push({ k: 'unknown-p', tag }); else { if (lv >= p.max) issues.push({ k: 'p-maxed-offered', tag, id: c.d.id, lv }); if (!lv) { stats.newP++; if (nP >= 5) issues.push({ k: 'new-p-slots-full', tag }); } else stats.upP++; } }
        else if (c.kind === 'e') { if (P.w[c.d.id]) issues.push({ k: 'evo-owned', tag }); for (const id of c.consume) if ((P.w[id] || 0) < GAME.weaponOf(id).max) issues.push({ k: 'evo-mats-not-maxed', tag, id }); if (c.d.unlock && GAME.META.bestStage < c.d.unlock) { /* 진화는 보유 기반, unlock 은 뽑기용 */ } } else issues.push({ k: 'unknown-kind', tag }); } };
    for (let it = 0; it < 400; it++) {
      // 랜덤 구성
      const deck = ids.slice().sort(() => Math.random() - .5).slice(0, 3 + R(9)); S.deck = deck; P.w = {}; P.p = {}; P.used = new Set();
      const nw = R(6); const pool = deck.slice().sort(() => Math.random() - .5); for (let i = 0; i < nw && i < pool.length; i++) P.w[pool[i]] = 1 + R(5);
      if (Math.random() < .4 && Object.keys(P.w).length < 5) { const e = EVOS[R(EVOS.length)]; P.w[e.id] = 1 + R(5); for (const p of e.parts) { delete P.w[p]; P.used.add(p); } }
      if (Math.random() < .3) for (const id of deck) if (!P.w[id] && Math.random() < .3) P.used.add(id);
      const np = R(6); const pp = PASSIVES.slice().sort(() => Math.random() - .5); for (let i = 0; i < np; i++) P.p[pp[i].id] = 1 + R(pp[i].max);
      if (Math.random() < .3) for (const id in P.w) P.w[id] = GAME.weaponOf(id).max;
      if (Math.random() < .2) for (const id in P.p) P.p[id] = PASSIVES.find(p => p.id === id).max;
      const tag = it; let ch; try { ch = GAME.choices(); } catch (e) { issues.push({ k: 'choices-throw', tag, e: e.message, w: { ...P.w }, deck }); continue; } check(ch, tag);
      // 실제 levelUp + DOM 클릭
      if (it % 4 === 0) { S.mode = 'play'; const wBefore = JSON.stringify(P.w), pBefore = JSON.stringify(P.p), c0 = S.coins; try { GAME.levelUp(); } catch (e) { issues.push({ k: 'levelUp-throw', tag, e: e.message }); continue; }
        const cards = [...document.querySelectorAll('#lvCards .card')]; if (cards.length > 3) issues.push({ k: 'dom-cards>3', tag }); if (cards.filter(c => c.classList.contains('evo')).length > 1) issues.push({ k: 'dom-evo>1', tag });
        if (!cards.length) { if (S.mode !== 'play') issues.push({ k: 'empty-mode', tag, m: S.mode }); if (S.coins - c0 !== 5) issues.push({ k: 'empty-fallback-coins', tag, d: S.coins - c0 }); if (document.getElementById('lv').classList.contains('show')) issues.push({ k: 'empty-panel-shown', tag }); }
        else { if (S.mode !== 'lv') issues.push({ k: 'lv-mode', tag, m: S.mode }); cards[R(cards.length)].click(); if (S.mode !== 'play') issues.push({ k: 'after-pick-mode', tag, m: S.mode }); if (document.getElementById('lv').classList.contains('show')) issues.push({ k: 'after-pick-panel', tag }); if (wBefore === JSON.stringify(P.w) && pBefore === JSON.stringify(P.p)) issues.push({ k: 'pick-no-change', tag }); for (const id in P.w) if (P.w[id] > GAME.weaponOf(id).max) issues.push({ k: 'pick-over-max', tag, id }); for (const id in P.p) if (P.p[id] > PASSIVES.find(p => p.id === id).max) issues.push({ k: 'pick-p-over-max', tag, id }); } }
    }
    // 결정적 케이스
    const det = {};
    S.deck = ids.slice(); P.w = { tiger: 5, moxa: 5, talisman: 5, sunblade: 5, sandstorm: 5 }; P.p = { spd: 5, hp: 5, cd: 5, pick: 5, armor: 5 }; P.used = new Set(); det.allMaxedNoEvo = GAME.choices().map(c => c.kind + ':' + c.d.id); S.mode = 'play'; const c0 = S.coins; GAME.levelUp(); det.allMaxedFallback = { mode: S.mode, coins: S.coins - c0, shown: document.getElementById('lv').classList.contains('show') };
    P.w = { talisman: 5, torch: 5, brazier: 5, orb: 5, whip: 5 }; P.p = {}; det.fiveMaxedWithEvos = []; for (let i = 0; i < 30; i++) det.fiveMaxedWithEvos.push(GAME.choices().map(c => c.kind + ':' + c.d.id).join(' ')); det.fiveMaxedWithEvos = [...new Set(det.fiveMaxedWithEvos)].slice(0, 6);
    P.w = { talisman: 1, torch: 1, brazier: 1, orb: 1, whip: 1 }; P.p = { spd: 1, hp: 1, cd: 1, pick: 1, armor: 1 }; const s = new Set(); for (let i = 0; i < 50; i++) for (const c of GAME.choices()) s.add(c.kind + ':' + c.d.id + ':' + (c.lv ? 'up' : 'new')); det.slotsFullOnlyUpgrades = [...s].every(x => x.endsWith('up')); det.slotsFullSet = [...s].sort();
    // 덱 1장만 (초기 상태)
    S.deck = ['talisman']; P.w = { talisman: 1 }; P.p = {}; det.deck1 = GAME.choices().map(c => c.kind + ':' + c.d.id);
    S.deck = ['talisman']; P.w = { talisman: 5 }; P.p = { spd: 5, hp: 5, cd: 5, pick: 5, armor: 5, salt: 3, xp: 5, bag: 3 }; det.deck1AllMax = GAME.choices().length;
    P.w = {}; P.p = {}; S.deck = ids.slice(); const byK = {}; for (const i of issues) byK[i.k] = (byK[i.k] || 0) + 1;
    return { stats, byK, issues: issues.slice(0, 15), det }; });
  sec('8 level-up cards', r); await pg.close(); }

await br.close();
console.log('\n===== PAGE ERRORS =====\n' + JSON.stringify(OUT.pageErrors, null, 1));
fs.writeFileSync(path.join(here, 'harness-combat-result.json'), JSON.stringify(OUT, null, 1));
