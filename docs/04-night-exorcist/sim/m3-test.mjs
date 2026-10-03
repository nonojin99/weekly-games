// M3 ①: 요괴 21종·스테이지 속성 랜덤·보스 고정·스테이지 선택 표시·도감 그룹. NODE_PATH=/home/claude/node_modules node m3-test.mjs
import { chromium } from 'playwright'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)); const results = []; const check = (n, ok, info = '') => { results.push(ok); console.log((ok ? 'PASS' : 'FAIL') + ' ' + n + (info ? ' — ' + info : '')); };
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await br.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.route('**supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }));
await pg.goto('file://' + path.resolve(here, '../../../games/night-exorcist/index.html') + '?test=1'); await pg.waitForFunction(() => window.GAME);
const data = await pg.evaluate(() => { const E = GAME.ENEMY, S = GAME.STAGES.filter(s => !s.soon); const ids = new Set(); for (const st of S) for (const id of [...st.roster, ...st.bosses]) ids.add(id); const bad = [...ids].filter(id => !E[id] || !GAME.GRIDS[E[id].spr]); return { n: ids.size, bad, stages: S.map(s => s.roster.length + '+' + s.bosses.length), soon: GAME.STAGES.filter(s => s.soon).length, bossEl: S.map(s => s.bosses.map(b => E[b].el).join('/')) }; });
check('요괴 21종 (스테이지별 5+2) · 스프라이트 전부 존재 · 예정 3칸', data.n === 21 && data.bad.length === 0 && data.stages.join() === '5+2,5+2,5+2' && data.soon === 3, JSON.stringify(data));
const menu = await pg.evaluate(() => [...document.querySelectorAll('#stages button')].map(b => b.textContent.replace(/\s+/g, ' ')));
check('스테이지 선택: 속성 3 + 배율 + 보스 이름 표시, 예정 칸 비활성', menu.length === 6 && /화 금 수.*×1.*두억시니·이무기/.test(menu[0]) && /목 수 금.*백호·대지네/.test(menu[1]) && /예정/.test(menu[3]), menu.join(' | '));
await pg.screenshot({ path: path.join(here, 'shots/m3-menu.png') });
for (const [stage, els] of [[1, ['fire','metal','water']], [2, ['wood','water','metal']], [3, ['fire','wood','metal']]]) {
  await pg.evaluate(s => { GAME.META.stage = s; GAME.META.bestStage = 2; }, stage); await pg.click('#startBtn'); await pg.waitForTimeout(200);
  const r = await pg.evaluate(() => { const st = GAME.STAGES[GAME.S.stage]; const seen = {}; for (let i = 0; i < 120; i++) { const o = GAME.spawn(st.roster[i % 5]); seen[o.el] = (seen[o.el] || 0) + 1; } const b1 = GAME.spawn(st.bosses[0], true), b2 = GAME.spawn(st.bosses[1], true); return { seen, b1: b1.el, b2: b2.el, b1n: b1.d.name, roster: st.roster }; });
  const ok = Object.keys(r.seen).sort().join() === els.slice().sort().join() && Object.values(r.seen).every(v => v > 20) && r.b1 === (await pg.evaluate(() => GAME.ENEMY[GAME.STAGES[GAME.S.stage].bosses[0]].el));
  check(`스테이지 ${stage}: 잡몹 속성 = ${els.join('/')} 중 랜덤(각 20+/120) · 보스 속성 고정`, ok, JSON.stringify(r));
  await pg.waitForTimeout(1500); await pg.screenshot({ path: path.join(here, `shots/m3-stage${stage}.png`) });
  await pg.evaluate(() => { GAME.S.t = 20; GAME.endRun(false); }); await pg.waitForTimeout(100); await pg.click('#homeBtn'); await pg.waitForTimeout(100);
}
const aff = await pg.evaluate(() => { const o = { el: 'water', armor: 'heavy' }; return [GAME.affinity(GAME.WBY.sickle, o), GAME.affinity(GAME.WBY.sword, o), GAME.affinity(GAME.WBY.spear, { el: 'water', armor: 'light' })]; });
check('상성 o.el 기준: 낫(금·근접) vs 수·heavy 1.5 · 목검(목·근접) 2.25 · 죽창 vs 수·light 2.25', aff.join() === '1.5,2.25,2.25', aff.join());
await pg.evaluate(() => { GAME.META.codex = ['egg','whitetiger','stonestatue']; GAME.META.runs = 3; GAME.openShrine('codex'); }); await pg.waitForTimeout(200);
const codex = await pg.evaluate(() => ({ groups: [...document.querySelectorAll('#shBody p.msg')].length, cards: document.querySelectorAll('#shBody .grid .w').length, seen: document.querySelectorAll('#shBody .grid .w:not(.off)').length }));
check('도감: 스테이지 3그룹 · 21칸 · 발견 3', codex.groups === 3 && codex.cards === 21 && codex.seen === 3, JSON.stringify(codex));
await pg.screenshot({ path: path.join(here, 'shots/m3-codex.png') });
check('콘솔 에러 0', errs.length === 0, errs.join(';'));
await br.close(); const f = results.filter(x => !x).length; console.log(`\n${results.length - f}/${results.length} PASS`); process.exit(f ? 1 : 0);
