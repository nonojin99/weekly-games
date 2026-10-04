import { chromium } from 'playwright';
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await br.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = []; pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); }); pg.on('pageerror', e => errs.push(String(e)));
await pg.route('**supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '"saved"' }));
const ok = (n, c) => console.log((c ? 'PASS' : 'FAIL') + ' ' + n);
await pg.goto('file:///home/claude/weekly-games/games/night-exorcist/index.html?test=1'); await pg.click('#startBtn'); await pg.waitForTimeout(150);
// 정예: 90초에 등장, 네온, 죽이면 상자 → 패널
await pg.evaluate(() => { GAME.S.t = 89.9; GAME.S.hp = 1e5; GAME.S.maxhp = 1e5; GAME.tick(.2); });
const el = await pg.evaluate(() => GAME.E.find(o => o.elite));
ok('정예 90초 등장 (hp ×12)', el && el.maxhp > 60);
await pg.evaluate(() => { const o = GAME.E.find(o => o.elite); GAME.P.w = { talisman:1, sword:1 }; GAME.kill(o); const c = GAME.CHESTS[0]; c.x = GAME.P.x; c.y = GAME.P.y; GAME.tick(1/30); });
await pg.waitForTimeout(100);
ok('상자 드롭·획득 → 패널 + 무기 레벨업', await pg.evaluate(() => GAME.S.mode === 'chest' && document.getElementById('chest').classList.contains('show') && (GAME.P.w.talisman + GAME.P.w.sword) >= 3));
await pg.evaluate(() => document.getElementById('chBtn').click()); await pg.waitForTimeout(50);
// 보스 패턴: 두억시니 투사체
await pg.evaluate(() => { GAME.E.length = 0; GAME.spawn('boss1', true); GAME.bossPattern(GAME.E[0]); });
ok('두억시니 투사체 5발', await pg.evaluate(() => GAME.EB.length === 5));
await pg.evaluate(() => { GAME.EB.length = 0; GAME.E.length = 0; GAME.spawn('boss2', true); GAME.bossPattern(GAME.E[0]); });
ok('이무기 물웅덩이 3개', await pg.evaluate(() => GAME.ZONE.length === 3));
ok('물웅덩이 안 → 둔화', await pg.evaluate(() => { GAME.ZONE[0].x = GAME.P.x; GAME.ZONE[0].y = GAME.P.y; GAME.tick(1/30); return GAME.S.slowT > 0; }));
ok('보스 접촉 → 속성 디버프 (이무기=둔화)', await pg.evaluate(() => { const b = GAME.E[0]; b.x = GAME.P.x; b.y = GAME.P.y; GAME.S.slowT = 0; GAME.ZONE.length = 0; GAME.tick(1/30); return GAME.S.slowT >= 1.9; }));
// 스테이지 2: 경계·나무 충돌
await pg.evaluate(() => { GAME.META.bestStage = 2; GAME.META.stage = 2; document.getElementById('againBtn').click(); });
await pg.waitForTimeout(100);
ok('스테이지 2 진입 (귀신의 숲)', await pg.evaluate(() => GAME.S.stage === 1));
ok('상하 경계 클램프', await pg.evaluate(() => { GAME.P.y = 999; GAME.tick(1/30); return Math.abs(GAME.P.y) <= 280; }));
ok('나무 장애물 생성·충돌', await pg.evaluate(() => { const trees = GAME.nearObst(GAME.P.x, GAME.P.y).filter(b => b.k === 'tree'); if (!trees.length) return false; const tr = trees[0]; GAME.P.x = tr.x; GAME.P.y = tr.y; GAME.tick(1/30); return Math.hypot(GAME.P.x - tr.x, GAME.P.y - tr.y) >= tr.r + GAME.P.r - 1; }));
// 스테이지 3: 불구덩이 피해
await pg.evaluate(() => { GAME.META.stage = 3; document.getElementById('againBtn').click(); }); await pg.waitForTimeout(100);
ok('스테이지 3 불구덩이 피해·화상', await pg.evaluate(() => { let f = null; for (let k = 0; k < 20 && !f; k++) f = GAME.nearObst(GAME.P.x + k * 200, GAME.P.y).find(b => b.k === 'fire'); if (!f) return false; GAME.P.x = f.x; GAME.P.y = f.y; const h = GAME.S.hp; GAME.tick(1/30); return GAME.S.hp < h && GAME.S.burnT > 0; }));
await pg.evaluate(() => { GAME.S.hp = 1e5; for (let i = 0; i < 12; i++) GAME.spawn(['jiangshi','fire','gumiho'][i % 3]); for (const o of GAME.E) { const a = Math.random() * 6.28, d = 60 + Math.random() * 130; o.x = GAME.P.x + Math.cos(a) * d; o.y = GAME.P.y + Math.sin(a) * d; } GAME.spawn('gumiho', false, true); const e = GAME.E[GAME.E.length - 1]; e.x = GAME.P.x + 90; e.y = GAME.P.y - 40; GAME.CHESTS.push({ x: GAME.P.x - 70, y: GAME.P.y + 50, grade: GAME.META && { g:'에픽', n:5, col:'#d08cff' }, t: 0 }); GAME.S.hitT = 0; });
await pg.waitForTimeout(120); await pg.screenshot({ path: 'shots/v3-stage3.png' });
await pg.evaluate(() => { GAME.META.stage = 2; document.getElementById('againBtn').click(); }); await pg.waitForTimeout(100);
await pg.evaluate(() => { GAME.S.hp = 1e5; for (let i = 0; i < 10; i++) GAME.spawn(['egg','fire','water'][i % 3]); for (const o of GAME.E) { const a = Math.random() * 6.28, d = 60 + Math.random() * 130; o.x = GAME.P.x + Math.cos(a) * d; o.y = Math.max(-250, Math.min(250, GAME.P.y + Math.sin(a) * d)); } GAME.S.hitT = 0; });
await pg.waitForTimeout(120); await pg.screenshot({ path: 'shots/v3-stage2.png' });
ok('콘솔 에러 0', errs.length === 0); if (errs.length) console.log(errs.slice(0, 3));
await br.close();
