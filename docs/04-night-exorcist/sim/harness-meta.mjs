// META / 메뉴 / 사당 UI 스트레스 하네스. 실행: NODE_PATH=/home/claude/node_modules node harness-meta.mjs
// 게임 파일은 수정하지 않음. 결과는 콘솔 + harness-meta-result.json
import { chromium } from 'playwright'; import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'file://' + path.resolve(here, '../../../games/night-exorcist/index.html') + '?test=1';
const findings = []; const log = (sev, id, msg, extra) => { findings.push({ sev, id, msg, extra }); console.log(`[${sev}] ${id}: ${msg}${extra !== undefined ? ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 400) : ''}`); };
const ok = (id, msg) => console.log(`[ok] ${id}: ${msg}`);
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.route('**supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await ctx.addInitScript(() => { window.QA = {
  setMeta(o) { const M = GAME.META; for (const k of Object.keys(M)) delete M[k]; Object.assign(M, GAME.migrate(o)); return M; },
  scan() { const bad = []; for (const id of ['menu', 'shrine', 'over', 'chal', 'lv']) { const el = document.getElementById(id); const t = el.innerHTML; if (/undefined|NaN|\[object/.test(t)) bad.push(id + ':' + t.match(/.{0,40}(undefined|NaN|\[object).{0,20}/)[0]); } return bad; },
  vis() { return ['menu', 'shrine', 'over', 'chal', 'lv', 'chest'].filter(id => document.getElementById(id).classList.contains('show')); },
}; });
let pg = await ctx.newPage();
const errs = []; const hook = p => { p.on('pageerror', e => errs.push({ where: CUR, msg: e.message })); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push({ where: CUR, msg: 'console: ' + m.text() }); }); };
hook(pg); let CUR = 'boot';
const fresh = async (raw) => { await pg.evaluate(r => { if (r != null) localStorage.setItem('wk_night-exorcist', r); else localStorage.clear(); Storage.prototype.setItem = () => {}; }, raw === undefined ? null : raw).catch(() => {}); await pg.goto(FILE); return pg.waitForFunction(() => window.GAME, null, { timeout: 3000 }).then(() => true).catch(() => false); };
const open = async () => { await pg.goto(FILE); try { await pg.waitForFunction(() => window.GAME, null, { timeout: 4000 }); return true; } catch (e) { return false; } };
await open();
// ───────── 1. 마이그레이션 퍼즈 ─────────
CUR = 'migrate';
const WIDS = await pg.evaluate(() => Object.keys(GAME.WBY));
const rnd = n => Math.floor(Math.random() * n); const pick = a => a[rnd(a.length)];
const junk = () => pick([null, undefined, 'abc', '7', -3, 99, 1e9, NaN, {}, [], true, 3.5]);
function randSave(i) {
  const kind = i % 5;
  if (kind === 0) return junk();                                                   // 완전 쓰레기
  const s = {};
  if (kind === 1) { s.v = 1; s.runs = rnd(10); s.coins = pick([0, 300, -5, '12', null]); s.train = pick([{ atk: rnd(8), hp: rnd(8) }, null, { atk: '3' }, {}]); s.weapons = pick([[1, 1, 0], [0, 0, 0], [1, 0, 1, 1, 1, 1], null, 'x']); s.chars = [1]; s.stage = pick([1, 2, 9, 0, -1, null]); s.bestStage = pick([0, 1, 7, null, '2']); s.codex = pick([['egg'], null, 'egg']); s.best = pick([{ time: 10, kills: 2 }, null, 5]); return s; }
  s.v = 2; const fields = ['runs', 'coins', 'shards', 'train', 'owned', 'deck', 'stage', 'diff', 'bestStage', 'bestN', 'bestH', 'codex', 'evo', 'best', 'chalBest', 'trainV2', 'lastSeen'];
  for (const f of fields) { if (Math.random() < .25) continue; // 누락
    if (Math.random() < .15) { s[f] = junk(); continue; }
    switch (f) {
      case 'runs': case 'coins': case 'shards': case 'chalBest': case 'lastSeen': s[f] = pick([0, rnd(5000), -rnd(100), '55', NaN, Infinity, 1e15]); break;
      case 'train': { const t = {}; for (const k of ['atk', 'hp', 'regen', 'spd', 'pick', 'bogus']) if (Math.random() < .8) t[k] = pick([rnd(100), -rnd(5), '4', null, NaN]); s.train = t; break; }
      case 'owned': { const o = {}; for (let k = 0; k < rnd(30); k++) o[pick([...WIDS, 'zzz', 'e:fire:all'])] = pick([rnd(12), -1, 15, '3', null]); s.owned = o; break; }
      case 'deck': { const d = []; for (let k = 0; k < rnd(15); k++) d.push(pick([...WIDS, 'zzz', WIDS[0], 7, null])); s.deck = d; break; }
      case 'stage': s.stage = pick([0, 1, 3, 6, 7, 99, -2, '3']); break;
      case 'diff': s.diff = pick([0, 1, 2, 3, 5, -1, '1']); break;
      case 'bestStage': case 'bestN': case 'bestH': s[f] = pick([0, 2, 6, 7, 99, -1, '6']); break;
      case 'codex': case 'evo': s[f] = pick([[], ['egg', 'zzz'], ['e:fire:all'], 'x', 5]); break;
      case 'best': s.best = pick([{ time: 0, kills: 0 }, { time: 'a' }, {}, 7]); break;
      case 'trainV2': s.trainV2 = pick([0, 1, undefined, '1']); break;
    } }
  return s;
}
const saves = Array.from({ length: 200 }, (_, i) => randSave(i));
const migRes = await pg.evaluate(({ saves }) => saves.map(s => { try { const m = GAME.migrate(s); return { ok: true, m: JSON.parse(JSON.stringify(m, (k, v) => typeof v === 'number' && !isFinite(v) ? '__' + String(v) : v)) }; } catch (e) { return { ok: false, err: e.message }; } }), { saves });
const TMH = 50; let migFail = { throw: [], invalid: [] };
const validMeta = (m, wids) => { const p = [];
  const num = (v, lo, hi, nm) => { if (typeof v !== 'number' || !isFinite(v) || v < lo || v > hi) p.push(`${nm}=${JSON.stringify(v)}`); };
  if (!m.train || typeof m.train !== 'object') p.push('train:' + JSON.stringify(m.train)); else for (const k of ['atk', 'hp', 'regen', 'spd', 'pick']) num(m.train[k], 0, TMH, 'train.' + k);
  if (!m.owned || typeof m.owned !== 'object') p.push('owned:' + JSON.stringify(m.owned)); else for (const [k, v] of Object.entries(m.owned)) { if (!wids.includes(k)) p.push('owned.unknown:' + k); num(v, 0, 10, 'owned.' + k); }
  if (!Array.isArray(m.deck)) p.push('deck:' + JSON.stringify(m.deck)); else { if (m.deck.length > 10 || m.deck.length < 1) p.push('deck.len=' + m.deck.length); for (const d of m.deck) if (!wids.includes(d) || !(m.owned && typeof m.owned === 'object' && d in m.owned)) p.push('deck.bad:' + JSON.stringify(d)); if (new Set(m.deck).size !== m.deck.length) p.push('deck.dup'); }
  num(m.diff, 0, 2, 'diff'); num(m.stage, 1, 6, 'stage'); num(m.bestStage, 0, 6, 'bestStage'); num(m.bestN, 0, 6, 'bestN'); num(m.bestH, 0, 6, 'bestH'); num(m.coins, 0, Infinity, 'coins'); num(m.shards, 0, Infinity, 'shards'); num(m.runs, 0, Infinity, 'runs');
  if (!Array.isArray(m.codex)) p.push('codex'); if (!Array.isArray(m.evo)) p.push('evo'); if (!m.best || typeof m.best !== 'object') p.push('best'); return p; };
migRes.forEach((r, i) => { if (!r.ok) migFail.throw.push({ i, err: r.err, save: saves[i] }); else { const m = JSON.parse(JSON.stringify(r.m), (k, v) => typeof v === 'string' && v.startsWith('__') ? Number(v.slice(2)) : v); const p = validMeta(m, WIDS); if (p.length) migFail.invalid.push({ i, p, save: saves[i] }); } });
if (migFail.throw.length) log('BUG', 'MIG-THROW', `migrate() throws on ${migFail.throw.length}/200 saves (load would white-screen)`, migFail.throw.slice(0, 4).map(x => x.err + ' <= ' + JSON.stringify(x.save).slice(0, 120)));
if (migFail.invalid.length) { const tally = {}; for (const f of migFail.invalid) for (const p of f.p) { const k = p.split(/[=:]/)[0]; tally[k] = (tally[k] || 0) + 1; } log('BUG', 'MIG-NOSANITIZE', `migrate() returns invalid META for ${migFail.invalid.length}/200 saves (no sanitising)`, tally); }
else ok('MIG', 'all 200 migrated saves valid');

// 1b. 마이그레이션 결과를 실제 META 로 꽂고 메뉴/사당/런을 돌려 런타임 크래시 수집
CUR = 'migrate-runtime';
const rtBad = [];
for (let i = 0; i < saves.length; i++) {
  const r = migRes[i]; if (!r.ok) continue; await fresh();
  const res = await pg.evaluate(async ({ s }) => { const out = { errs: [] }; const t = (nm, f) => { try { f(); } catch (e) { out.errs.push(nm + ': ' + e.message.slice(0, 90)); } };
    t('setMeta', () => QA.setMeta(s));
    t('renderStages', () => GAME.renderStages());
    for (const tab of ['train', 'gacha', 'deck', 'codex']) t('shrine.' + tab, () => GAME.openShrine(tab));
    t('gacha', () => { GAME.META.shards = 100; GAME.gachaN(1); });
    t('trainClick', () => { GAME.META.coins = 1e6; GAME.openShrine('train'); const b = document.querySelector('#shBody .trow button'); b && b.click(); });
    t('deckClick', () => { GAME.openShrine('deck'); const b = document.querySelector('#shBody .grid button'); b && b.click(); });
    t('start', () => { document.getElementById('shClose').click(); GAME.startGame(); });
    t('tick', () => { for (let k = 0; k < 30; k++) GAME.tick(1 / 30); });
    t('levelUp', () => { GAME.S.xp = 1e9; GAME.levelUp(); const c = document.querySelector('#lvCards .card'); if (c) c.click(); else { GAME.S.mode = 'play'; } document.getElementById('lv').classList.remove('show'); GAME.S.mode = 'play'; GAME.S.xp = 0; });
    t('endRun', () => { GAME.S.t = 601; GAME.endRun(true); });
    t('home', () => document.getElementById('homeBtn').click());
    out.scan = QA.scan(); out.meta = { stage: GAME.META.stage, diff: GAME.META.diff, deck: GAME.META.deck, start: GAME.S.deck && GAME.S.deck[0] }; return out; }, { s: saves[i] });
  if (res.errs.length || res.scan.length) rtBad.push({ i, save: String(JSON.stringify(saves[i])).slice(0, 160), errs: res.errs, scan: res.scan });
  await pg.evaluate(() => { document.getElementById('over').classList.remove('show'); document.getElementById('lv').classList.remove('show'); });
}
if (rtBad.length) { const kinds = {}; for (const b of rtBad) for (const e of [...b.errs, ...b.scan]) { const k = e.replace(/\d+/g, '#').slice(0, 80); if (!kinds[k]) kinds[k] = { n: 0, ex: b.save }; kinds[k].n++; } log('BUG', 'MIG-RUNTIME', `${rtBad.length}/200 migrated saves cause runtime exceptions or undefined/NaN in UI`, ''); for (const [k, v] of Object.entries(kinds)) console.log('     ' + v.n + '× ' + k + '\n        e.g. ' + v.ex); }
else ok('MIG-RUNTIME', 'no runtime errors from migrated saves');
const pageErrsMig = errs.filter(e => e.where.startsWith('migrate')); errs.length = 0;

// 1c. 특정 악성 저장값으로 페이지 로드 (white screen 체크)
CUR = 'load';
const loadCases = [['garbage', 'not json{'], ['owned-null', JSON.stringify({ v: 2, owned: null })], ['deck-null', JSON.stringify({ v: 2, deck: null })], ['best-null', JSON.stringify({ v: 2, best: null })], ['train-str', JSON.stringify({ v: 2, train: { atk: '3' }, trainV2: 1 })], ['deck-unknown', JSON.stringify({ v: 2, deck: ['zzz'], owned: { zzz: 0 } })], ['evo-null', JSON.stringify({ v: 2, evo: null, codex: null })], ['diff5', JSON.stringify({ v: 2, diff: 5, bestH: 6, bestN: 6, bestStage: 6, stage: 3, runs: 9 })], ['stage99', JSON.stringify({ v: 2, stage: 99, bestStage: 6, runs: 3 })], ['train99', JSON.stringify({ v: 2, train: { atk: 99 }, trainV2: 1, runs: 3, coins: 1e6 })], ['owned15', JSON.stringify({ v: 2, owned: { talisman: 15, sword: -4 }, deck: ['talisman', 'sword'], runs: 3, shards: 500 })], ['deck12', JSON.stringify({ v: 2, owned: Object.fromEntries(WIDS.map(w => [w, 0])), deck: WIDS.slice(0, 12), runs: 3 })], ['deck-dup', JSON.stringify({ v: 2, owned: { talisman: 0, sword: 0 }, deck: ['talisman', 'talisman', 'sword'], runs: 3 })]];
for (const [nm, raw] of loadCases) {
  CUR = 'load:' + nm; const loaded = await fresh(raw);
  const e = errs.filter(x => x.where === CUR).map(x => x.msg.slice(0, 120));
  if (!loaded) log('BUG', 'LOAD-CRASH', `save "${nm}" → page fails to boot (white screen, GAME undefined)`, e);
  else {
    const r = await pg.evaluate(() => { const out = { errs: [] }; const t = (n, f) => { try { f(); } catch (er) { out.errs.push(n + ': ' + er.message.slice(0, 80)); } };
      out.menuScan = QA.scan(); out.diffBtns = [...document.querySelectorAll('#diffs button')].map(b => b.textContent + (b.classList.contains('sel') ? '*' : '') + (b.disabled ? '(x)' : '')); out.start = document.getElementById('startBtn').textContent + (document.getElementById('startBtn').disabled ? '(x)' : ''); out.dots = document.querySelectorAll('#stDots i').length;
      for (const tab of ['train', 'gacha', 'deck', 'codex']) t(tab, () => GAME.openShrine(tab)); out.shrineScan = QA.scan();
      t('trainBtn', () => { GAME.openShrine('train'); const rows = [...document.querySelectorAll('#shBody .trow')]; out.trainRows = rows.map(r => ({ txt: r.querySelectorAll('small')[1].textContent, bar: r.querySelector('.bar i').style.width, btn: r.querySelector('button').textContent })); const b = rows[0].querySelector('button'); b.click(); out.trainAfter = JSON.stringify(GAME.META.train); out.total = document.querySelector('#shBody .msg').textContent; });
      t('gacha', () => { GAME.openShrine('gacha'); const r = GAME.gachaN(1); out.gacha = r && r.items.map(i => i.kind + ':' + i.w.id + (i.lv != null ? ':' + i.lv : '')); out.gachaOut = document.getElementById('gachaOut').textContent; out.owned = JSON.stringify(GAME.META.owned); });
      t('deckTab', () => { GAME.openShrine('deck'); out.deckSub = document.querySelector('#shBody .sub').textContent.slice(0, 20); out.deckBtns = [...document.querySelectorAll('#shBody .grid button')].map(b => b.textContent.replace(/\s+/g, ' ')); });
      document.getElementById('shClose').click();
      t('startGame', () => { GAME.startGame(); out.run = { diff: GAME.S.diff, stage: GAME.S.stage, deck: GAME.S.deck, w: Object.keys(GAME.P.w), name: GAME.curDiff() && GAME.curDiff().name, maxhp: GAME.S.maxhp }; });
      t('levelUp', () => { GAME.S.xp = 1e9; GAME.levelUp(); out.cards = [...document.querySelectorAll('#lvCards .card b')].map(b => b.childNodes[0].textContent.trim()); document.getElementById('lv').classList.remove('show'); GAME.S.mode = 'play'; GAME.S.xp = 0; });
      t('tick', () => { for (let k = 0; k < 60; k++) GAME.tick(1 / 30); });
      t('endRun', () => { GAME.S.t = 601; GAME.endRun(true); out.ov = document.getElementById('ovCoins').textContent; out.metaAfter = { coins: GAME.META.coins, shards: GAME.META.shards, stage: GAME.META.stage, diff: GAME.META.diff, best: GAME.META.bestStage, bestN: GAME.META.bestN, bestH: GAME.META.bestH }; });
      out.scan = QA.scan(); return out; });
    const allErrs = [...r.errs, ...e];
    const sus = []; if (allErrs.length) sus.push('errors=' + JSON.stringify(allErrs)); if (r.menuScan.length || r.shrineScan.length || r.scan.length) sus.push('undefined/NaN in UI: ' + JSON.stringify([...r.menuScan, ...r.shrineScan, ...r.scan]));
    if (r.trainRows) for (const tr of r.trainRows) { const w = parseFloat(tr.bar); if (w > 100) sus.push('train bar >100%: ' + tr.bar + ' ' + tr.txt); }
    if (r.run && (typeof r.run.maxhp !== 'number' || isNaN(r.run.maxhp))) sus.push('maxhp NaN ' + r.run.maxhp);
    if (r.metaAfter && (!isFinite(r.metaAfter.coins) || !isFinite(r.metaAfter.shards) || isNaN(r.metaAfter.coins))) sus.push('coins/shards not finite ' + JSON.stringify(r.metaAfter));
    if (sus.length) log('BUG', 'LOAD:' + nm, 'tampered save survives load but misbehaves', { sus, detail: { diffBtns: r.diffBtns, start: r.start, trainRows: r.trainRows && r.trainRows.slice(0, 2), total: r.total, gacha: r.gacha, deckSub: r.deckSub, run: r.run, cards: r.cards, metaAfter: r.metaAfter } });
    else ok('LOAD:' + nm, JSON.stringify({ diffBtns: r.diffBtns, start: r.start, run: r.run && { diff: r.run.diff, stage: r.run.stage, deck: r.run.deck.join(), w: r.run.w.join() }, cards: r.cards, total: r.total, deckSub: r.deckSub, metaAfter: r.metaAfter }).slice(0, 380));
  }
}
errs.length = 0;

// 1d. 라운드트립: 저장(실제 saveMeta 경로: stNext 클릭) → 리로드 → META 동일
CUR = 'roundtrip';
await fresh();
const before = await pg.evaluate(() => { QA.setMeta({ v: 2, runs: 7, coins: 1234, shards: 55, train: { atk: 3, hp: 1, regen: 0, spd: 2, pick: 30 }, owned: { talisman: 2, sword: 0, orb: 10 }, deck: ['orb', 'talisman', 'sword'], stage: 3, diff: 0, bestStage: 4, bestN: 0, bestH: 0, codex: ['egg', 'fire'], evo: ['e:fire:all'], best: { time: 123.4, kills: 44 }, chalBest: 1234, trainV2: 1 }); GAME.META.stage = 2; document.getElementById('stNext').click(); const m = JSON.parse(JSON.stringify(GAME.META)); delete m.lastSeen; const st = JSON.parse(localStorage.getItem('wk_night-exorcist')); delete st.lastSeen; if (JSON.stringify(st) !== JSON.stringify(m)) m.__storedMismatch = st; return m; });
if (before.__storedMismatch) log('BUG', 'SAVE-PATH', 'stNext click did not persist META to localStorage', before.__storedMismatch);
await pg.evaluate(() => { Storage.prototype.setItem = () => {}; });
await pg.goto(FILE); await pg.waitForFunction(() => window.GAME);
const after = await pg.evaluate(() => { const m = JSON.parse(JSON.stringify(GAME.META)); delete m.lastSeen; return m; });
if (JSON.stringify(before) !== JSON.stringify(after)) log('BUG', 'ROUNDTRIP', 'META differs after save/reload', { before, after }); else ok('ROUNDTRIP', 'save → reload identical (stage=' + after.stage + ')');

// ───────── 2. 수련 UI 루프 ─────────
CUR = 'train';
await fresh();
const tr = await pg.evaluate(() => { const out = { issues: [], clicks: 0 }; QA.setMeta({ v: 2, runs: 3, coins: 10, trainV2: 1 }); GAME.openShrine('train');
  // 2a. 잔액 부족 시 비활성
  const rows0 = [...document.querySelectorAll('#shBody .trow')]; out.disabledWhenPoor = rows0.every(r => r.querySelector('button').disabled); out.btnTxt0 = rows0[0].querySelector('button').textContent;
  rows0[0].querySelector('button').click(); if (GAME.META.train.atk !== 0 || GAME.META.coins !== 10) out.issues.push('poor click changed state ' + JSON.stringify(GAME.META.train));
  // 2b. 모든 행을 최대까지 클릭
  GAME.META.coins = 1e7; GAME.renderShrine(); const TRAIN = GAME.TRAIN; const maxBefore = GAME.trainMax();
  for (let ri = 0; ri < TRAIN.length; ri++) { let guard = 0; while (guard++ < 80) { const rows = [...document.querySelectorAll('#shBody .trow')]; const b = rows[ri].querySelector('button'); if (b.textContent === '최대') { if (!b.disabled) out.issues.push('최대 button enabled'); break; } const id = TRAIN[ri].id, lv = GAME.META.train[id], c0 = GAME.META.coins, cost = GAME.trainCost(lv); const barW = parseFloat(rows[ri].querySelector('.bar i').style.width); if (barW > 100.01) out.issues.push(`bar ${id} ${barW}%`); if (!rows[ri].querySelectorAll('small')[1].textContent.includes(`${lv}/${maxBefore}`)) out.issues.push('row text ' + rows[ri].querySelectorAll('small')[1].textContent); b.click(); out.clicks++; if (GAME.META.train[id] !== lv + 1) out.issues.push(`${id} lv ${lv}→${GAME.META.train[id]}`); if (GAME.META.coins !== c0 - cost) out.issues.push(`${id} coins ${c0}→${GAME.META.coins} cost ${cost}`); } if (GAME.META.train[TRAIN[ri].id] !== maxBefore) out.issues.push(`${TRAIN[ri].id} ended at ${GAME.META.train[TRAIN[ri].id]} not ${maxBefore}`); }
  out.total = document.querySelector('#shBody .msg').textContent; out.maxBefore = maxBefore; if (!out.total.includes(`${maxBefore * 5}/${maxBefore * 5}`)) out.issues.push('total text ' + out.total);
  // 2c. 정확히 cost 만큼의 엽전: 활성, cost-1: 비활성
  GAME.META.train.atk = 0; GAME.META.coins = GAME.trainCost(0); GAME.renderShrine(); if (document.querySelector('#shBody .trow button').disabled) out.issues.push('exact-cost disabled'); GAME.META.coins = GAME.trainCost(0) - 1; GAME.renderShrine(); if (!document.querySelector('#shBody .trow button').disabled) out.issues.push('cost-1 enabled');
  // 2d. 어려움 해금 → 50단, 행 재렌더
  GAME.META.train.atk = 30; GAME.META.bestN = 6; GAME.META.bestStage = 6; GAME.META.coins = 1e7; GAME.renderShrine(); out.maxAfter = GAME.trainMax(); const r0 = document.querySelector('#shBody .trow'); out.rowAfter = r0.querySelectorAll('small')[1].textContent + ' | ' + r0.querySelector('button').textContent + ' | bar=' + r0.querySelector('.bar i').style.width; out.hdr = document.querySelector('#shBody .sub').textContent; if (out.maxAfter !== 50 || !out.rowAfter.includes('30/50') || r0.querySelector('button').textContent === '최대') out.issues.push('hard unlock did not flip rows: ' + out.rowAfter);
  let g = 0; while (g++ < 30 && document.querySelector('#shBody .trow button').textContent !== '최대') document.querySelector('#shBody .trow button').click(); out.atkFinal = GAME.META.train.atk; if (out.atkFinal !== 50) out.issues.push('atk final ' + out.atkFinal);
  // 2e. 스태일 클로저: 렌더 전 버튼 참조를 잡고 두 번 클릭 (더블탭)
  GAME.META.train.hp = 0; GAME.META.coins = 1e7; GAME.renderShrine(); const rows = [...document.querySelectorAll('#shBody .trow')]; const hpBtn = rows[1].querySelector('button'); const c1 = GAME.META.coins; hpBtn.click(); hpBtn.click(); hpBtn.click(); out.staleClicks = { hp: GAME.META.train.hp, spent: c1 - GAME.META.coins, expectIf1: GAME.trainCost(0) }; if (GAME.META.train.hp !== 1 && GAME.META.train.hp !== 3) out.issues.push('stale closure weird ' + JSON.stringify(out.staleClicks)); if (GAME.META.train.hp === 3 && c1 - GAME.META.coins !== GAME.trainCost(0) + GAME.trainCost(1) + GAME.trainCost(2)) out.issues.push('stale closure overcharged/undercharged ' + JSON.stringify(out.staleClicks));
  // 2f. 수련 50 인데 어려움 미해금 상태(세이브 조작·향후 밸런스 패치)에서 바
  GAME.META.bestN = 0; GAME.META.train.atk = 50; GAME.renderShrine(); const rA = document.querySelector('#shBody .trow'); out.overBar = rA.querySelector('.bar i').style.width + ' ' + rA.querySelectorAll('small')[1].textContent + ' ' + rA.querySelector('button').textContent + ' total=' + document.querySelector('#shBody .msg').textContent;
  out.scan = QA.scan(); return out; });
if (tr.issues.length) log('BUG', 'TRAIN', 'training loop invariant failures', tr.issues.slice(0, 10)); else ok('TRAIN', `${tr.clicks} clicks ok; total="${tr.total}"; hard→${tr.maxAfter}; stale=${JSON.stringify(tr.staleClicks)}`);
if (parseFloat(tr.overBar) > 100) log('SUS', 'TRAIN-OVERBAR', 'train level above current trainMax renders bar >100% (overflow hidden, but text says 50/30)', tr.overBar);
if (tr.scan.length) log('BUG', 'TRAIN-SCAN', 'undefined/NaN', tr.scan);

// ───────── 3. 뽑기 루프 ─────────
CUR = 'gacha';
const ga = await pg.evaluate(() => { const out = { issues: [], pulls: 0 }; const WIDS = Object.keys(GAME.WBY);
  // 3a. 풀 vs 해금
  const poolAt = bs => { GAME.META.bestStage = bs; return GAME.gachaPool().map(w => w.id); }; const els = ids => new Set(ids.map(i => GAME.WBY[i].el || 'none'));
  const p3 = poolAt(3), p4 = poolAt(4), p5 = poolAt(5); out.pool = { n3: p3.length, n4: p4.length, n5: p5.length, els3: [...els(p3)], els4: [...els(p4)], els5: [...els(p5)] };
  if (els(p3).has('light') || els(p3).has('dark') || els(p3).has('earth') || els(p3).has('thunder')) out.issues.push('pool@3 has locked els'); if (!els(p4).has('light') || !els(p4).has('dark') || els(p4).has('earth')) out.issues.push('pool@4 wrong'); if (!els(p5).has('earth') || !els(p5).has('thunder')) out.issues.push('pool@5 wrong'); if (p5.length !== WIDS.length) out.issues.push('pool@5 != all weapons ' + p5.length + '/' + WIDS.length);
  // 3b. ×100 잠김
  GAME.META.bestStage = 5; GAME.META.bestN = 0; GAME.META.shards = 5000; GAME.openShrine('gacha'); const b100 = document.getElementById('gacha100'); out.lock100 = b100.textContent + (b100.disabled ? '(x)' : ''); if (!b100.disabled) out.issues.push('×100 enabled w/o normal');
  const before = JSON.stringify(GAME.META.owned); const r100 = GAME.gachaN(100); if (r100 !== null) out.issues.push('gachaN(100) ran despite lock (direct call)'); out.lock100Direct = r100 === null ? 'blocked' : 'RAN';
  // 3c. 버튼 활성 조건
  GAME.META.shards = 99; GAME.renderShrine(); out.btns99 = ['gachaBtn', 'gacha10', 'gacha100'].map(id => document.getElementById(id).disabled); if (document.getElementById('gachaBtn').disabled || !document.getElementById('gacha10').disabled) out.issues.push('btn state @99 wrong ' + JSON.stringify(out.btns99));
  GAME.META.shards = 9; GAME.renderShrine(); if (!document.getElementById('gachaBtn').disabled) out.issues.push('×1 enabled @9');
  // 3d. 루프
  GAME.META.bestStage = 6; GAME.META.bestN = 6; GAME.META.shards = 100000; GAME.META.coins = 0; GAME.META.owned = { talisman: 0 }; GAME.META.deck = ['talisman']; GAME.renderShrine();
  let refundExpected = 0; const sizes = [1, 10, 100];
  for (let k = 0; k < 60; k++) { const n = sizes[k % 3]; const sh0 = GAME.META.shards, c0 = GAME.META.coins, own0 = { ...GAME.META.owned }; document.getElementById(n === 1 ? 'gachaBtn' : n === 10 ? 'gacha10' : 'gacha100').click(); out.pulls += n;
    if (GAME.META.shards !== sh0 - n * 10) out.issues.push(`shards ${sh0}→${GAME.META.shards} for ×${n}`); if (GAME.META.shards < 0) out.issues.push('shards negative');
    for (const [id, v] of Object.entries(GAME.META.owned)) { if (v > 10 || v < 0 || !Number.isInteger(v)) out.issues.push(`owned ${id}=${v}`); if (!GAME.WBY[id]) out.issues.push('owned unknown ' + id); }
    // 환급: 숙련 10 인 것이 뽑힌 횟수 × 5
    const gained = Object.values(GAME.META.owned).reduce((a, b) => a + b, 0) - Object.values(own0).reduce((a, b) => a + b, 0), newW = Object.keys(GAME.META.owned).length - Object.keys(own0).length, refunds = n - gained - newW; if ((GAME.META.coins - c0) !== refunds * 5) out.issues.push(`refund mismatch n=${n} gained=${gained} new=${newW} coins+${GAME.META.coins - c0}`);
    if (GAME.META.deck.length > 10) out.issues.push('deck ' + GAME.META.deck.length); if (new Set(GAME.META.deck).size !== GAME.META.deck.length) out.issues.push('deck dup');
    const txt = document.getElementById('gachaOut').innerHTML; if (/undefined|NaN/.test(txt)) out.issues.push('gachaOut: ' + txt.slice(0, 80)); }
  out.ownedFinal = GAME.META.owned; out.deckFinal = GAME.META.deck; out.coins = GAME.META.coins; out.out = document.getElementById('gachaOut').textContent.slice(0, 120);
  // 3e. 조각 정확히 10 → ×1 가능, 0 되면 버튼 비활성
  GAME.META.shards = 10; GAME.renderShrine(); document.getElementById('gachaBtn').click(); if (GAME.META.shards !== 0) out.issues.push('exact 10 pull failed'); if (!document.getElementById('gachaBtn').disabled) out.issues.push('×1 enabled @0 after pull');
  // 3f. 숙련 >10 (조작 세이브) 시 환급 경로
  GAME.META.owned = { talisman: 15 }; GAME.META.bestStage = 0; GAME.META.shards = 10; GAME.renderShrine(); const rr = GAME.gachaN(1); out.over10 = rr && rr.items[0].kind + ' owned=' + GAME.META.owned.talisman + ' shards=' + GAME.META.shards + ' gridText=' + document.querySelector('#shBody .grid .w small').textContent;
  // 3g. 덱 10 꽉 찬 상태에서 신규 뽑기 → 덱 미추가인데 문구는 "덱에 추가됨"?
  GAME.META.bestStage = 6; GAME.META.owned = Object.fromEntries(WIDS.slice(0, 10).map(w => [w, 0])); GAME.META.deck = WIDS.slice(0, 10); GAME.META.shards = 10000; GAME.renderShrine(); let r1; for (let k = 0; k < 400; k++) { r1 = GAME.gachaN(1); if (r1.items[0].kind === 'new') break; } out.fullDeckNew = r1.items[0].kind === 'new' ? { inDeck: GAME.META.deck.includes(r1.items[0].w.id), text: document.getElementById('gachaOut').textContent } : 'no new drawn';
  if (out.fullDeckNew.inDeck === false && /덱에 추가됨/.test(out.fullDeckNew.text)) out.issues.push('full deck: new weapon NOT added but text says 덱에 추가됨');
  out.scan = QA.scan(); return out; });
if (ga.issues.length) log('BUG', 'GACHA', 'gacha invariant failures', ga.issues.slice(0, 10)); else ok('GACHA', `${ga.pulls} pulls ok; pool ${JSON.stringify(ga.pool)}; lock100=${ga.lock100}/${ga.lock100Direct}; over10=${ga.over10}`);
if (ga.over10) log('SUS', 'GACHA-OVER10', 'mastery >10 from tampered save displays raw value', ga.over10);
console.log('   fullDeckNew=', JSON.stringify(ga.fullDeckNew));
if (ga.scan.length) log('BUG', 'GACHA-SCAN', 'undefined/NaN', ga.scan);

// ───────── 4. 덱 편집 ─────────
CUR = 'deck';
const dk = await pg.evaluate(() => { const out = { issues: [] }; const WIDS = Object.keys(GAME.WBY); GAME.META.owned = Object.fromEntries(WIDS.map(w => [w, 0])); GAME.META.deck = ['talisman']; GAME.openShrine('deck');
  const btns = () => [...document.querySelectorAll('#shBody .grid button')]; const sub = () => document.querySelector('#shBody .sub').textContent;
  out.nBtns = btns().length; if (out.nBtns !== WIDS.length) out.issues.push('deck grid count ' + out.nBtns);
  // 4a. 채우기 >10
  for (let k = 0; k < 30; k++) { const b = btns().find(x => !x.classList.contains('in')); if (!b) break; b.click(); if (GAME.META.deck.length > 10) out.issues.push('deck >10'); }
  out.after30 = GAME.META.deck.length; out.subFull = sub().slice(0, 12); if (!/10\/10/.test(sub())) out.issues.push('sub text ' + sub());
  // 4b. 번호 라벨 일치
  const labels = btns().filter(b => b.classList.contains('in')).map(b => b.textContent.match(/(\d+)번/)?.[1]); const expect = GAME.META.deck.map((_, i) => String(i + 1)); if (labels.sort().join() !== expect.sort().join()) out.issues.push('deck order labels ' + labels.join());
  // 4c. 전부 제거
  for (let k = 0; k < 30; k++) { const b = btns().find(x => x.classList.contains('in')); if (!b) break; b.click(); } out.minDeck = GAME.META.deck.slice(); out.toast = document.getElementById('toast').textContent; if (GAME.META.deck.length !== 1) out.issues.push('deck emptied to ' + GAME.META.deck.length);
  // 4d. 중복/빈 덱을 직접 넣고 런 시작
  GAME.META.deck = []; document.getElementById('shClose').click(); let e1 = null; try { GAME.startGame(); } catch (e) { e1 = e.message; } out.emptyStart = { err: e1, deck: GAME.S.deck, w: Object.keys(GAME.P.w) }; GAME.S.t = 5; GAME.endRun(false); document.getElementById('homeBtn').click(); out.deckAfterEmptyRun = GAME.META.deck.slice();
  GAME.META.deck = ['sword', 'sword', 'talisman', 'sword']; GAME.META.owned = { sword: 0, talisman: 0 }; GAME.startGame(); GAME.S.xp = 1e9; GAME.levelUp(); const cards = [...document.querySelectorAll('#lvCards .card b')].map(b => b.childNodes[0].textContent.trim()); out.dupCards = cards; const dupe = cards.filter((c, i) => cards.indexOf(c) !== i); if (dupe.length) out.issues.push('duplicate deck → duplicate level-up cards: ' + cards.join('|')); document.getElementById('lv').classList.remove('show'); GAME.S.mode = 'play'; GAME.S.xp = 0; GAME.S.t = 5; GAME.endRun(false); document.getElementById('homeBtn').click();
  // 4e. 덱 편집 탭에서 중복 덱 표시
  GAME.META.deck = ['sword', 'sword', 'talisman']; GAME.openShrine('deck'); out.dupSub = sub().slice(0, 14); out.dupLabels = btns().map(b => b.textContent.replace(/\s+/g, ' ')); btns().find(b => /목검/.test(b.textContent)).click(); out.dupAfterRemove = GAME.META.deck.slice();
  // 4f. deck에 unknown id
  GAME.META.deck = ['zzz', 'talisman']; GAME.renderShrine(); out.unknownSub = sub().slice(0, 14); document.getElementById('shClose').click(); GAME.startGame(); out.unknownStart = Object.keys(GAME.P.w); GAME.S.t = 5; GAME.endRun(false); document.getElementById('homeBtn').click();
  out.scan = QA.scan(); return out; });
if (dk.issues.length) log('BUG', 'DECK', 'deck editor issues', dk.issues); else ok('DECK', JSON.stringify({ after30: dk.after30, minDeck: dk.minDeck, toast: dk.toast, emptyStart: dk.emptyStart }));
console.log('   deck detail:', JSON.stringify({ emptyStart: dk.emptyStart, deckAfterEmptyRun: dk.deckAfterEmptyRun, dupCards: dk.dupCards, dupSub: dk.dupSub, dupAfterRemove: dk.dupAfterRemove, unknownSub: dk.unknownSub, unknownStart: dk.unknownStart }));
if (dk.unknownSub && /2\/10/.test(dk.unknownSub)) log('SUS', 'DECK-UNKNOWN', 'deck tab counts unknown ids toward N/10 (unknown ids never cleaned from META.deck)', dk.unknownSub);
if (dk.scan.length) log('BUG', 'DECK-SCAN', 'undefined/NaN', dk.scan);
errs.length = 0;

// ───────── 5. 스테이지 캐러셀 · 난이도 ─────────
CUR = 'stages';
await fresh();
const st = await pg.evaluate(() => { const out = { issues: [] }; const n = GAME.STAGES.length; QA.setMeta({ v: 2, runs: 5, bestStage: 2, stage: 1, trainV2: 1, owned: { talisman: 0 }, deck: ['talisman'] }); GAME.renderStages();
  const dots = () => document.querySelectorAll('#stDots i').length, onDot = () => [...document.querySelectorAll('#stDots i')].findIndex(i => i.classList.contains('on')), cards = () => [...document.querySelectorAll('#stages .stcard')], startBtn = document.getElementById('startBtn');
  if (dots() !== n) out.issues.push('dots ' + dots()); if (cards().length !== n) out.issues.push('cards ' + cards().length);
  // 5a. next 를 20번: stage 는 n 에서 멈춤, 잠긴 카드 선택 시 start 비활성
  for (let k = 0; k < 20; k++) document.getElementById('stNext').click(); out.afterNext = { stage: GAME.META.stage, dot: onDot(), start: startBtn.textContent, dis: startBtn.disabled }; if (GAME.META.stage !== n) out.issues.push('next overflow ' + GAME.META.stage); if (!startBtn.disabled) out.issues.push('locked stage start enabled');
  for (let k = 0; k < 20; k++) document.getElementById('stPrev').click(); out.afterPrev = { stage: GAME.META.stage, dot: onDot(), dis: startBtn.disabled }; if (GAME.META.stage !== 1 || startBtn.disabled) out.issues.push('prev underflow ' + JSON.stringify(out.afterPrev));
  // 5b. 교차 난타
  for (let k = 0; k < 50; k++) document.getElementById(Math.random() < .5 ? 'stNext' : 'stPrev').click(); if (GAME.META.stage < 1 || GAME.META.stage > n || onDot() !== GAME.META.stage - 1) out.issues.push('rapid nav desync ' + GAME.META.stage + ' dot ' + onDot());
  // 5c. 잠김/클리어 표시 일관성
  GAME.META.bestStage = 3; GAME.renderStages(); const state = cards().map(c => (c.classList.contains('locked') ? 'L' : c.querySelector('.chop') ? 'C' : 'O')); out.state3 = state.join(''); if (state.join('') !== 'CCCOLL') out.issues.push('lock/clear state ' + state.join(''));
  // 5d. 난이도 전환 시 stage 클램프
  GAME.META.bestStage = 6; GAME.META.bestN = 1; GAME.META.stage = 5; GAME.renderStages(); const db = [...document.querySelectorAll('#diffs button')]; out.diffBtns = db.map(b => b.textContent + (b.disabled ? '(x)' : '')); if (document.getElementById('diffs').classList.contains('hide')) out.issues.push('diffs hidden though normal unlocked');
  db[1].click(); out.afterNormal = { diff: GAME.META.diff, stage: GAME.META.stage, state: cards().map(c => (c.classList.contains('locked') ? 'L' : c.querySelector('.chop') ? 'C' : 'O')).join(''), dot: onDot(), start: startBtn.disabled }; if (GAME.META.stage !== 2) out.issues.push('stage not clamped to bestN+1: ' + GAME.META.stage);
  // 보통에서 next 로 잠긴 3 선택 → 쉬움으로 돌아가면 stage 3 유지(열려있음)
  document.getElementById('stNext').click(); out.normalLocked = { stage: GAME.META.stage, dis: startBtn.disabled }; db[0] && [...document.querySelectorAll('#diffs button')][0].click(); out.backEasy = { diff: GAME.META.diff, stage: GAME.META.stage, dis: startBtn.disabled };
  // 5e. 잠긴 어려움 클릭 무시
  [...document.querySelectorAll('#diffs button')][2].click(); if (GAME.META.diff === 2) out.issues.push('locked hard selected');
  // 5f. 어려움 해금 후 diff=2, 다시 bestN 미달이면 renderStages 가 0 으로
  GAME.META.bestN = 6; GAME.renderStages(); [...document.querySelectorAll('#diffs button')][2].click(); out.hard = { diff: GAME.META.diff, stage: GAME.META.stage }; GAME.META.bestN = 5; GAME.renderStages(); out.hardRevoked = { diff: GAME.META.diff, sel: [...document.querySelectorAll('#diffs button')].findIndex(b => b.classList.contains('sel')) };
  // 5g. endRun 해금 후 renderStages: 다음 카드 열림, 선택 stage 는 그대로
  QA.setMeta({ v: 2, runs: 5, bestStage: 0, stage: 1, trainV2: 1, owned: { talisman: 0 }, deck: ['talisman'] }); GAME.renderStages(); GAME.startGame(); GAME.S.t = 601; GAME.endRun(true); const st2 = cards().map(c => (c.classList.contains('locked') ? 'L' : c.querySelector('.chop') ? 'C' : 'O')).join(''); out.afterClear = { st: st2, stage: GAME.META.stage, toast: document.getElementById('toast').textContent, over: QA.vis() }; if (st2 !== 'COLLLL') out.issues.push('after clear state ' + st2);
  document.getElementById('homeBtn').click(); out.vis = QA.vis(); out.scan = QA.scan(); return out; });
if (st.issues.length) log('BUG', 'STAGES', 'stage carousel / difficulty issues', st.issues); else ok('STAGES', JSON.stringify({ afterNext: st.afterNext, state3: st.state3, afterNormal: st.afterNormal, normalLocked: st.normalLocked, backEasy: st.backEasy, hardRevoked: st.hardRevoked, afterClear: st.afterClear }).slice(0, 500));
console.log('   stages detail:', JSON.stringify(st).slice(0, 700));
if (st.scan.length) log('BUG', 'STAGES-SCAN', 'undefined/NaN', st.scan);
// 5h. 실제 스크롤 → META.stage 동기화 (스크롤 핸들러 120ms 디바운스, 700ms 가드)
await pg.evaluate(() => { GAME.META.bestStage = 6; GAME.META.stage = 1; GAME.renderStages(); }); await pg.waitForTimeout(900);
await pg.evaluate(() => { const box = document.getElementById('stages'); box.scrollLeft = (box.firstChild.offsetWidth + 10) * 3; box.dispatchEvent(new Event('scroll')); }); await pg.waitForTimeout(400);
const scrolled = await pg.evaluate(() => ({ stage: GAME.META.stage, dot: [...document.querySelectorAll('#stDots i')].findIndex(i => i.classList.contains('on')) }));
if (scrolled.stage !== 4) log('SUS', 'STAGES-SCROLL', 'manual scroll to card 4 did not update META.stage (jsdom-ish scroll; verify on device)', scrolled); else ok('STAGES-SCROLL', 'scroll syncs META.stage=' + scrolled.stage);

// ───────── 6. 도감 ─────────
CUR = 'codex';
const cx = await pg.evaluate(() => { const out = { issues: [] }; const nW = GAME.WEAPONS.length, nE = GAME.EVOS.length, nEn = Object.keys(GAME.ENEMY).length; out.counts = { nW, nE, nEn };
  GAME.META.owned = { talisman: 0 }; GAME.META.evo = []; GAME.META.codex = []; GAME.META.bestStage = 0; GAME.openShrine('codex'); const grids = [...document.querySelectorAll('#shBody .grid')]; out.wCards = grids[0].querySelectorAll('.w').length; out.enemyCards = grids.slice(1).reduce((a, g) => a + g.querySelectorAll('.w').length, 0); out.enemyGrids = grids.length - 1;
  if (out.wCards !== nW + nE) out.issues.push('weapon cards ' + out.wCards); if (out.enemyCards !== 42 || out.enemyCards !== nEn) out.issues.push('enemy cards ' + out.enemyCards + ' vs ENEMY ' + nEn);
  out.header = document.querySelector('#shBody .msg').textContent; if (!out.header.includes('기본 ' + nW)) out.issues.push('codex header count stale: "' + out.header + '" (WEAPONS=' + nW + ')');
  out.offW = grids[0].querySelectorAll('.w.off').length; if (out.offW !== nW + nE - 1) out.issues.push('off weapons ' + out.offW);
  const titles = [...grids[0].querySelectorAll('.w')].filter(w => w.title && /클리어 후/.test(w.title)).length; out.unlockTooltips = titles;
  // 해금 후
  GAME.META.owned = Object.fromEntries(GAME.WEAPONS.map(w => [w.id, 0])); GAME.META.evo = GAME.EVOS.map(e => e.id); GAME.META.codex = Object.keys(GAME.ENEMY); GAME.renderShrine(); const g2 = [...document.querySelectorAll('#shBody .grid')]; out.allSeen = { wOff: g2[0].querySelectorAll('.w.off').length, eOff: g2.slice(1).reduce((a, g) => a + g.querySelectorAll('.w.off').length, 0), q: document.getElementById('shBody').textContent.split('???').length - 1 }; if (out.allSeen.wOff || out.allSeen.eOff || out.allSeen.q) out.issues.push('all-seen still has locked ' + JSON.stringify(out.allSeen));
  // 잘못된 id 들
  GAME.META.evo = ['bogus', 'e:fire:all']; GAME.META.codex = ['zzz']; GAME.renderShrine(); out.bogusHeader = document.querySelector('#shBody .msg').textContent; if (/2\/74/.test(out.bogusHeader)) out.issues.push('evo count includes unknown id: ' + out.bogusHeader);
  out.scan = QA.scan(); const html = document.getElementById('shBody').innerHTML; out.undef = (html.match(/undefined|NaN/g) || []).length; return out; });
if (cx.issues.length) log('BUG', 'CODEX', 'codex issues', { issues: cx.issues, counts: cx.counts, header: cx.header }); else ok('CODEX', JSON.stringify(cx));
if (cx.unlockTooltips === 0) log('SUS', 'CODEX-TOOLTIP', 'locked-weapon "<stage> 클리어 후" tooltip never shows: el.title is overwritten on the same line (index.html:1235)', 'tooltips=' + cx.unlockTooltips);
console.log('   codex detail:', JSON.stringify(cx));

// ───────── 7. 풀 플로우 (리로드 없음) ─────────
CUR = 'flow';
await fresh();
const flow = { steps: [], issues: [] };
const snap = async (label) => { const s = await pg.evaluate(() => ({ vis: QA.vis(), mode: GAME.S.mode, runs: GAME.META.runs, deck: GAME.META.deck.join(), sh: !document.getElementById('shrineBtn').classList.contains('hide'), ch: !document.getElementById('chalBtn').classList.contains('hide'), reg: !document.getElementById('regBox').classList.contains('hide'), scan: QA.scan(), toast: document.getElementById('toast').textContent, ovCoins: document.getElementById('ovCoins').textContent, start: document.getElementById('startBtn').textContent })); flow.steps.push([label, s]); if (s.scan.length) flow.issues.push(label + ' scan ' + s.scan.join('|')); return s; };
let s0 = await snap('fresh'); if (s0.vis.join() !== 'menu' || s0.deck !== 'talisman' || s0.sh || s0.ch) flow.issues.push('fresh state ' + JSON.stringify(s0));
for (let run = 1; run <= 3; run++) {
  await pg.click(run === 1 ? '#startBtn' : '#againBtn'); await pg.waitForTimeout(150);
  const inRun = await pg.evaluate(() => ({ vis: QA.vis(), mode: GAME.S.mode, w: Object.keys(GAME.P.w).join(), deck: GAME.S.deck.join() })); if (inRun.vis.length || inRun.mode !== 'play') flow.issues.push(`run${run} overlays visible during play: ` + JSON.stringify(inRun));
  if (inRun.w !== inRun.deck.split(',')[0]) flow.issues.push(`run${run} start weapon ${inRun.w} != deck[0]`);
  // 레벨업 카드가 덱 안에서만
  const lv = await pg.evaluate(() => { GAME.S.xp = 1e9; GAME.levelUp(); const names = [...document.querySelectorAll('#lvCards .card')].map(c => c.querySelector('b').childNodes[0].textContent.trim()); const wNames = GAME.WEAPONS.map(w => w.name); const deckNames = GAME.S.deck.map(id => GAME.WBY[id].name); const outside = names.filter(n => wNames.includes(n) && !deckNames.includes(n)); const c = document.querySelector('#lvCards .card'); c && c.click(); GAME.S.xp = 0; if (GAME.S.mode !== 'play') { document.getElementById('lv').classList.remove('show'); GAME.S.mode = 'play'; } return { names, outside, vis: QA.vis() }; });
  if (lv.outside.length) flow.issues.push(`run${run} offered outside deck: ` + lv.outside.join()); if (lv.vis.length) flow.issues.push(`run${run} lv panel left visible after pick: ` + lv.vis.join());
  await pg.evaluate(() => { for (let k = 0; k < 120; k++) GAME.tick(1 / 30); GAME.S.t = 40 + Math.random() * 20; GAME.endRun(false); });
  const immediate = await pg.evaluate(() => QA.vis()); await pg.waitForTimeout(1000); const s = await snap('after-run' + run);
  if (s.vis.join() !== 'over') flow.issues.push(`run${run} after endRun vis=${s.vis.join()} (immediately ${immediate.join()})`); if (s.runs !== run) flow.issues.push(`run${run} runs=${s.runs}`);
  if (run === 1 && (s.deck !== 'talisman,sword')) flow.issues.push('run1 deck ' + s.deck); if (run === 2 && s.deck !== 'talisman,sword,bell') flow.issues.push('run2 deck ' + s.deck);
  if (!s.reg) flow.issues.push(`run${run} regBox hidden though no pinhash`);
}
await pg.click('#homeBtn'); await pg.waitForTimeout(100); let sm = await snap('menu-after-3'); if (sm.vis.join() !== 'menu' || !sm.sh || !sm.ch) flow.issues.push('menu after 3 runs ' + JSON.stringify(sm));
await pg.click('#shrineBtn'); await pg.waitForTimeout(100); const shr = await pg.evaluate(() => ({ vis: QA.vis(), mode: GAME.S.mode, tab: [...document.querySelectorAll('.tabs button')].find(b => b.classList.contains('on')).id, coins: GAME.META.coins, shards: GAME.META.shards })); if (shr.vis.join() !== 'shrine' || shr.tab !== 'tabTrain') flow.issues.push('shrine open ' + JSON.stringify(shr));
// 구매 (엽전 보유량 내에서 실제 플로우) → 뽑기(조각 10 보유, 런3 보너스) → 덱 편집
const buy = await pg.evaluate(() => { const c0 = GAME.META.coins; const b = document.querySelector('#shBody .trow button'); const dis = b.disabled; b.click(); return { c0, dis, c1: GAME.META.coins, atk: GAME.META.train.atk, wallet: document.getElementById('shWallet').textContent }; }); if (!buy.dis && (buy.atk !== 1 || buy.c1 !== buy.c0 - 30)) flow.issues.push('buy ' + JSON.stringify(buy)); if (!buy.wallet.includes(String(buy.c1))) flow.issues.push('wallet not refreshed after buy: ' + buy.wallet);
await pg.click('#tabGacha'); await pg.waitForTimeout(50); const g1 = await pg.evaluate(() => { const sh0 = GAME.META.shards; const b = document.getElementById('gachaBtn'); const dis = b.disabled; b.click(); return { sh0, dis, sh1: GAME.META.shards, out: document.getElementById('gachaOut').textContent, deck: GAME.META.deck.join(), wallet: document.getElementById('shWallet').textContent, menuBtn: document.getElementById('shrineBtn').textContent }; }); if (g1.sh0 >= 10 && (g1.dis || g1.sh1 !== g1.sh0 - 10)) flow.issues.push('gacha flow ' + JSON.stringify(g1)); if (!g1.wallet.includes(String(g1.sh1))) flow.issues.push('wallet stale after gacha ' + g1.wallet);
flow.steps.push(['gacha1', g1]);
await pg.click('#tabDeck'); await pg.waitForTimeout(50); const de = await pg.evaluate(() => { const btns = [...document.querySelectorAll('#shBody .grid button')]; const first = btns.find(b => b.classList.contains('in')); first.click(); const btns2 = [...document.querySelectorAll('#shBody .grid button')]; const outB = btns2.find(b => !b.classList.contains('in')); outB && outB.click(); return { deck: GAME.META.deck.join(), labels: [...document.querySelectorAll('#shBody .grid button.in')].map(b => b.textContent.replace(/\s+/g, ' ')) }; }); flow.steps.push(['deckEdit', de]);
await pg.click('#shClose'); await pg.waitForTimeout(100); const sm2 = await snap('menu-after-shrine'); if (sm2.vis.join() !== 'menu') flow.issues.push('after shClose vis ' + sm2.vis.join()); if (!(await pg.evaluate(() => document.getElementById('shrineBtn').textContent.includes(String(GAME.META.coins))))) flow.issues.push('menu shrine button coin label stale');
await pg.click('#startBtn'); await pg.waitForTimeout(150); const r4 = await pg.evaluate(() => { const w = Object.keys(GAME.P.w); GAME.S.xp = 1e9; GAME.levelUp(); const names = [...document.querySelectorAll('#lvCards .card')].map(c => c.querySelector('b').childNodes[0].textContent.trim()); const wNames = GAME.WEAPONS.map(w => w.name); const deckNames = GAME.S.deck.map(id => GAME.WBY[id].name); return { w: w.join(), deck0: GAME.S.deck[0], metaDeck0: GAME.META.deck[0], names, outside: names.filter(n => wNames.includes(n) && !deckNames.includes(n)), vis: QA.vis() }; }); if (r4.w !== r4.metaDeck0) flow.issues.push('run4 start weapon ' + JSON.stringify(r4)); if (r4.outside.length) flow.issues.push('run4 outside deck ' + r4.outside.join()); flow.steps.push(['run4', r4]);
// 레벨업 중 endRun 호출(사망) 무시되는지 + 패널 중첩
const lvDeath = await pg.evaluate(() => { GAME.S.hp = 0; GAME.endRun(false); return { mode: GAME.S.mode, vis: QA.vis() }; }); if (lvDeath.mode !== 'lv') flow.issues.push('endRun during lv changed mode ' + JSON.stringify(lvDeath));
await pg.evaluate(() => { document.querySelector('#lvCards .card').click(); GAME.S.xp = 0; GAME.S.t = 30; GAME.endRun(false); }); await pg.waitForTimeout(900);
// over 패널 중 again 연타
await pg.click('#againBtn'); await pg.click('#againBtn').catch(() => {}); await pg.waitForTimeout(150); const dbl = await pg.evaluate(() => ({ vis: QA.vis(), mode: GAME.S.mode, runs: GAME.META.runs })); if (dbl.vis.length) flow.issues.push('double again left overlays ' + JSON.stringify(dbl));
// endRun 직후(700ms 안에) 다시 시작 — over 패널이 런 위에 뜨는가 (챌린지 /again 경로는 UI 상 불가하지만 시간 안에 홈→시작은 가능?)
await pg.evaluate(() => { GAME.S.t = 20; GAME.endRun(false); }); await pg.waitForTimeout(100); const early = await pg.evaluate(() => ({ vis: QA.vis(), againVisible: getComputedStyle(document.getElementById('over')).pointerEvents })); flow.steps.push(['over-early', early]);
await pg.waitForTimeout(900); const late = await snap('over-late'); if (late.vis.join() !== 'over') flow.issues.push('over not shown after death ' + late.vis.join());
// 사당 패널에서 홈 안 거치고 again? (불가) / 사당 열린 채 over 가 뜨는 경로: over 패널 → homeBtn → shrine; 그 사이 setTimeout 잔존?
await pg.click('#homeBtn'); await pg.click('#shrineBtn'); await pg.waitForTimeout(100); const shv = await pg.evaluate(() => QA.vis()); if (shv.join() !== 'shrine') flow.issues.push('shrine from over left panels ' + shv.join());
// 챌린지 → 런 → over: 보상 없음 문구 / again 은 일반 런으로
await pg.click('#shClose'); await pg.click('#chalBtn'); await pg.waitForTimeout(300); const chv = await pg.evaluate(() => ({ vis: QA.vis(), top: document.getElementById('chalTop').textContent, desc: document.getElementById('chalDesc').textContent.slice(0, 40) })); flow.steps.push(['chal', chv]); if (chv.vis.join() !== 'chal') flow.issues.push('chal vis ' + chv.vis.join());
await pg.fill('#chalNick', '하네스'); await pg.click('#chalGo'); await pg.waitForTimeout(150); const chRun = await pg.evaluate(() => ({ chal: !!GAME.S.chal, deck: GAME.S.deck.join(), diff: GAME.S.diff, vis: QA.vis() })); if (!chRun.chal || chRun.vis.length) flow.issues.push('chal run ' + JSON.stringify(chRun));
await pg.evaluate(() => { GAME.META.diff = 1; GAME.META.bestStage = 6; GAME.META.stage = 1; GAME.S.t = 601; GAME.endRun(true); }); await pg.waitForTimeout(1000); const chOver = await snap('chal-over'); if (!/보상 없음/.test(chOver.ovCoins)) flow.issues.push('chal over coins text ' + chOver.ovCoins);
const chBest = await pg.evaluate(() => ({ bestStage: GAME.META.bestStage, bestN: GAME.META.bestN, runs: GAME.META.runs, chalBest: GAME.META.chalBest, title: document.getElementById('ovTitle').textContent, toast: document.getElementById('toast').textContent, stagesState: [...document.querySelectorAll('#stages .stcard')].map(c => c.classList.contains('locked') ? 'L' : 'O').join('') })); flow.steps.push(['chal-meta', chBest]); if (chBest.bestN !== 0) flow.issues.push('challenge clear changed bestN ' + JSON.stringify(chBest));
await pg.click('#againBtn'); await pg.waitForTimeout(150); const ag = await pg.evaluate(() => ({ chal: !!GAME.S.chal, deck: GAME.S.deck.join(), diff: GAME.S.diff, stage: GAME.S.stage })); if (ag.chal) flow.issues.push('again after chal kept chal'); flow.steps.push(['again-after-chal', ag]);
await pg.evaluate(() => { GAME.S.t = 10; GAME.endRun(false); }); await pg.waitForTimeout(900); await pg.click('#homeBtn'); await pg.waitForTimeout(100);
const fin = await snap('final-menu'); if (fin.vis.join() !== 'menu') flow.issues.push('final vis ' + fin.vis.join());
if (flow.issues.length) log('BUG', 'FLOW', 'full-flow issues', flow.issues); else ok('FLOW', 'new player → 3 runs → shrine → gacha → deck → run → chal OK');
console.log('   flow steps:', JSON.stringify(flow.steps).slice(0, 1500));

// ───────── 8. 콘솔/페이지 에러 모음 ─────────
const errSummary = {}; for (const e of errs) { const k = e.where + ' | ' + e.msg.slice(0, 100); errSummary[k] = (errSummary[k] || 0) + 1; }
const migSummary = {}; for (const e of pageErrsMig) { const k = e.msg.slice(0, 100); migSummary[k] = (migSummary[k] || 0) + 1; }
if (Object.keys(errSummary).length) log('BUG', 'PAGEERR', 'page/console errors outside migration fuzz', errSummary); else ok('PAGEERR', 'no page errors in sections 2–7');
if (Object.keys(migSummary).length) log('INFO', 'PAGEERR-MIG', 'page errors during migration fuzz (expected from malformed saves)', migSummary);
await pg.screenshot({ path: path.join(here, 'shots/harness-meta-final.png') });
fs.writeFileSync(path.join(here, 'harness-meta-result.json'), JSON.stringify({ findings, migFail: { throw: migFail.throw.slice(0, 20), invalid: migFail.invalid.slice(0, 40) }, rtBad: rtBad.slice(0, 40), flowSteps: flow.steps, train: tr, gacha: ga, deck: dk, stages: st, codex: cx }, null, 1));
await br.close(); console.log(`\n${findings.filter(f => f.sev === 'BUG').length} BUG · ${findings.filter(f => f.sev === 'SUS').length} SUS`);
