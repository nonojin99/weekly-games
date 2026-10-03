// 밤의 퇴마사 M1 기능 테스트: NODE_PATH=/home/claude/node_modules node m1-test.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'url'; import path from 'path'; import fs from 'fs';
const here = path.dirname(fileURLToPath(import.meta.url));
const html = 'file://' + path.resolve(here, '../../../games/night-exorcist/index.html') + '?test=1';
const out = path.resolve(here, 'shots'); fs.mkdirSync(out, { recursive: true });
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await br.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
const errs = []; pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push(String(e)));
await pg.route('**supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '"saved"' }));
await pg.goto(html); await pg.waitForTimeout(400); await pg.screenshot({ path: out + '/mobile-menu.png' });
const ok = (n, c) => console.log((c ? 'PASS' : 'FAIL') + ' ' + n);
ok('로드·훅', await pg.evaluate(() => !!window.GAME));
await pg.click('#startBtn'); await pg.waitForTimeout(200);
ok('시작: play 모드·부적 1', await pg.evaluate(() => GAME.S.mode === 'play' && GAME.P.w.talisman === 1));
// 키보드 이동
const p0 = await pg.evaluate(() => ({ x: GAME.P.x, y: GAME.P.y })); await pg.keyboard.down('KeyD'); await pg.waitForTimeout(400); await pg.keyboard.up('KeyD');
ok('키보드 이동 (D → x 증가)', await pg.evaluate(x0 => GAME.P.x > x0 + 20, p0.x));
// 터치 조이스틱
const j0 = await pg.evaluate(() => GAME.P.y);
await pg.mouse.move(100, 600); await pg.mouse.down(); await pg.mouse.move(100, 660, { steps: 5 }); await pg.waitForTimeout(400); await pg.mouse.up();
ok('조이스틱 이동 (아래로 → y 증가)', await pg.evaluate(y0 => GAME.P.y > y0 + 20, j0));
// 스폰·전투 (빠른 시뮬: tick 호출)
await pg.evaluate(() => { for (let i = 0; i < 300; i++) GAME.tick(1/30); });
const st = await pg.evaluate(() => ({ e: GAME.E.length, k: GAME.S.kills, t: GAME.S.t, hp: GAME.S.hp }));
ok('10초 후 적 스폰·처치 발생', st.e > 0 && st.k > 0);
// 레벨업 패널
await pg.evaluate(() => { GAME.S.xp = GAME.S.need; GAME.G.length = 0; GAME.tick(1/30); });
await pg.waitForTimeout(200);
const lv = await pg.evaluate(() => ({ mode: GAME.S.mode, cards: document.querySelectorAll('#lvCards .card').length, shown: document.getElementById('lv').classList.contains('show') }));
ok('레벨업: 3택1 패널', lv.mode === 'lv' && lv.cards === 3 && lv.shown);
await pg.screenshot({ path: out + '/mobile-levelup.png' });
await pg.evaluate(() => document.querySelector('#lvCards .card').click()); await pg.waitForTimeout(100);
ok('선택 후 재개 + 무기/패시브 증가', await pg.evaluate(() => GAME.S.mode === 'play' && (Object.values(GAME.P.w).reduce((a,b)=>a+b,0) + Object.values(GAME.P.p).reduce((a,b)=>a+b,0)) === 2));
// 3무기 모두 장착 → 각 무기가 피해를 주는지
await pg.evaluate(() => { GAME.P.w = { talisman:2, sword:1, bell:1 }; GAME.E.length = 0; GAME.spawn('egg'); const o = GAME.E[0]; o.x = GAME.P.x + 30; o.y = GAME.P.y; o.hp = 1e9; o.maxhp = 1e9; GAME.P.dx = 1; GAME.P.dy = 0; for (let i = 0; i < 120; i++) GAME.tick(1/30); });
ok('3무기 피해 (적 체력 감소)', await pg.evaluate(() => GAME.E.length && GAME.E[0].hp < 1e9 - 30));
// 5분 보스
await pg.evaluate(() => { GAME.S.t = 299.5; GAME.S.hp = 1e6; GAME.S.maxhp = 1e6; for (let i = 0; i < 30; i++) GAME.tick(1/30); });
ok('5분 두억시니 등장', await pg.evaluate(() => GAME.E.some(o => o.type === 'boss1')));
// 플레이 장면 스크린샷 (실시간 1.5초)
await pg.evaluate(() => { GAME.S.hp = GAME.S.maxhp = 100; }); await pg.waitForTimeout(1500); await pg.screenshot({ path: out + '/mobile-play.png' });
// 성능: 적 60 + 투사체, 프레임 시간
await pg.evaluate(() => { while (GAME.E.length < 60) GAME.spawn('egg'); GAME.frameMs().length = 0; }); await pg.waitForTimeout(2000);
const fm = await pg.evaluate(() => { const a = GAME.frameMs(); a.sort((x, y) => x - y); return { p50: a[a.length >> 1], p95: a[(a.length * .95) | 0], n: a.length }; });
ok(`성능: 적 60 p95 프레임 ${fm.p95?.toFixed(1)}ms < 12ms (p50 ${fm.p50?.toFixed(1)})`, fm.p95 < 12);
// 사망 → 결과
await pg.evaluate(() => { GAME.S.hp = 0; GAME.tick(1/30); }); await pg.waitForFunction(() => document.getElementById('over').classList.contains('show'), null, { timeout: 3000 }).catch(() => {});
ok('사망: 결과 패널 + 런 기록', await pg.evaluate(() => GAME.S.mode === 'over' && document.getElementById('over').classList.contains('show') && GAME.META.runs >= 1 && GAME.META.coins > 0));
// 클리어 경로
await pg.evaluate(() => document.getElementById('againBtn').click()); await pg.waitForTimeout(100);
await pg.evaluate(() => { GAME.S.t = 599.9; GAME.S.hp = 1e6; GAME.S.maxhp = 1e6; GAME.tick(.2); });
ok('10분 생존 → 동이 텄다', await pg.evaluate(() => GAME.S.cleared && document.getElementById('ovTitle').textContent === '동이 텄다' && GAME.META.bestStage === 1));
ok('콘솔 에러 0', errs.length === 0); if (errs.length) console.log(errs);
ok('훅 미노출', await (async () => { const p2 = await br.newPage(); await p2.goto(html.replace('?test=1', '')); const r = await p2.evaluate(() => window.GAME === undefined); await p2.close(); return r; })());
await br.close();
