// M1 기능 테스트: node m1-test.mjs  (Playwright chromium, 390×844)
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
const here = path.dirname(fileURLToPath(import.meta.url));
const html = 'file://' + path.resolve(here, '../../../games/merge-garden/index.html') + '?test=1';
const out = path.resolve(here, 'shots'); import fs from 'fs'; fs.mkdirSync(out, { recursive: true });
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await br.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
const errs = []; pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push(String(e)));
await pg.route('**supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '"saved"' }));
await pg.goto(html); await pg.waitForTimeout(400);
await pg.screenshot({ path: out + '/mobile-menu.png' });
const ok = (name, c) => console.log((c ? 'PASS' : 'FAIL') + ' ' + name);
ok('로드·훅', await pg.evaluate(() => !!window.GAME));
await pg.click('#startBtn'); await pg.waitForTimeout(300);
ok('시작: 씨앗 2개', await pg.evaluate(() => GAME.S.mode === 'play' && GAME.S.cells.filter(Boolean).length === 2));
// 물주기 + 쿨다운
ok('물주기 1회', await pg.evaluate(() => GAME.water()));
ok('쿨다운 중 거부', await pg.evaluate(() => !GAME.water()));
// 합성: 인접 3칸에 티어1 → 드래그
const m = await pg.evaluate(() => { const S = GAME.S; S.cells.fill(0); const [a, b, c] = GAME.UNLOCK; S.cells[a] = 1; S.cells[b] = 1; S.cells[c] = 1; return GAME.tryMerge(c, a) && S.cells[a] === 2 && S.cells.filter(Boolean).length === 1; });
ok('3합성 → 티어2 1개', m);
const m5 = await pg.evaluate(() => { const S = GAME.S; S.cells.fill(0); const u = GAME.UNLOCK; for (let k = 0; k < 5; k++) S.cells[u[k]] = 2; const r = GAME.tryMerge(u[4], u[0]); return r && S.cells.filter(x => x === 3).length === 2 && S.cells.filter(Boolean).length === 2; });
ok('5합성 → 티어3 2개', m5);
ok('2개로는 합성 안 됨', await pg.evaluate(() => { const S = GAME.S; S.cells.fill(0); const u = GAME.UNLOCK; S.cells[u[0]] = 1; S.cells[u[1]] = 1; return !GAME.tryMerge(u[1], u[0]) && S.cells[u[0]] === 1 && S.cells[u[1]] === 1; }));
// 실제 포인터 드래그
const drag = await pg.evaluate(() => { const S = GAME.S; S.cells.fill(0); const u = GAME.UNLOCK; S.cells[u[0]] = 1; S.cells[u[1]] = 1; S.cells[u[5]] = 1; const L = GAME.L(); const a = GAME.cellXY(u[5]), b = GAME.cellXY(u[0]); return { ax: a.x + L.cell/2, ay: a.y + L.cell/2, bx: b.x + L.cell/2, by: b.y + L.cell/2, u0: u[0] }; });
await pg.mouse.move(drag.ax, drag.ay); await pg.mouse.down(); await pg.mouse.move(drag.bx, drag.by, { steps: 8 }); await pg.mouse.up(); await pg.waitForTimeout(100);
ok('포인터 드래그 합성', await pg.evaluate(u0 => GAME.S.cells[u0] === 2, drag.u0));
// 구매
await pg.evaluate(() => { GAME.S.gold = 1000; });
ok('화단 확장 구매', await pg.evaluate(() => { const g = GAME.S.grid; return GAME.buy('grid') && GAME.S.grid === g + 1; }));
ok('물뿌리개 구매', await pg.evaluate(() => { const w = GAME.S.water; return GAME.buy('water') && GAME.S.water === w + 1; }));
ok('돈 없으면 거부', await pg.evaluate(() => { GAME.S.gold = 0; return !GAME.buy('seed'); }));
// 틱: 생산·자동 씨앗
const prod = await pg.evaluate(() => { const S = GAME.S; S.cells.fill(0); S.cells[GAME.UNLOCK[0]] = 5; S.gold = 0; for (let i = 0; i < 100; i++) GAME.tick(.1); return { gold: S.gold, seeds: S.cells.filter(Boolean).length }; });
const base = 0.05 * Math.pow(3.3, 4) * 10; ok('10초 틱: 티어5 금화 ≥ 기준(자동 씨앗 포함)', prod.gold >= base - 1e-6 && prod.gold < base * 1.2 && prod.seeds >= 2);
// 세이브 → 리로드 → 복원 + 오프라인
await pg.evaluate(() => { GAME.S.gold = 123; GAME.save(); });
await pg.reload(); await pg.waitForTimeout(300);   // 리로드 시 visibilitychange 세이브가 먼저 돌므로 lastSeen 은 리로드 뒤에 조작
await pg.evaluate(() => { const j = JSON.parse(localStorage.getItem('wk_merge-garden')); j.lastSeen = Date.now() - 3600 * 1000; localStorage.setItem('wk_merge-garden', JSON.stringify(j)); });
await pg.click('#startBtn'); await pg.waitForTimeout(400);
const off = await pg.evaluate(() => ({ shown: document.getElementById('offline').classList.contains('show'), gold: GAME.S.gold, txt: document.getElementById('offGain').textContent }));
ok('오프라인 정산 1시간 (패널·금화 증가)', off.shown && off.gold > 123);
await pg.evaluate(() => document.getElementById('offBtn').click()); await pg.waitForTimeout(200);
// 플레이 장면 연출용 상태
await pg.evaluate(() => { const S = GAME.S; S.grid = 16; S.cells.fill(0); const u = GAME.UNLOCK; [1,1,2,3,3,4,5,6,7,2,1,9].forEach((L, k) => { S.cells[u[k]] = L; }); S.shopSeen = true; S.logSeen = true; S.gold = 340; S.maxTier = 9; S.codex = [1,2,3,4,5,6,7,8,9]; });
await pg.waitForTimeout(500); await pg.screenshot({ path: out + '/mobile-play.png' });
await pg.evaluate(() => GAME.openLog()); await pg.waitForTimeout(400); await pg.screenshot({ path: out + '/mobile-log.png' });
ok('콘솔 에러 0', errs.length === 0); if (errs.length) console.log(errs);
ok('훅 미노출(?test 없이)', await (async () => { const p2 = await br.newPage(); await p2.goto(html.replace('?test=1', '')); const r = await p2.evaluate(() => window.GAME === undefined); await p2.close(); return r; })());
await br.close();
