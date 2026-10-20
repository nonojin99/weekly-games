// 7일차 공개 전 무인 렌더 3장 + 썸네일 컷
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const pg = await b.newPage({ viewport:{ width:390, height:844 }, deviceScaleFactor:2 }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.route('**supabase.co/**', r => r.fulfill({ status:200, body:'[]', contentType:'application/json' }));
await pg.goto('file:///home/claude/weekly-games/games/night-exorcist/index.html?test=1'); await pg.waitForFunction(() => window.GAME); await pg.waitForTimeout(500);
await pg.screenshot({ path:'shots/release/1-start.png' });
// 플레이: 2분 진행 상태
await pg.evaluate(() => { GAME.startGame(); GAME.S.hp = 1e9; GAME.S.maxhp = 1e9; for (let i = 0; i < 120 * 30; i++) { if (GAME.S.mode === 'lv') document.querySelector('#lvCards .card')?.click(); if (GAME.S.mode === 'chest') document.getElementById('chBtn').click(); GAME.tick(1/30); } GAME.S.maxhp = 100; GAME.S.hp = 74; });
await pg.waitForTimeout(400); await pg.screenshot({ path:'shots/release/2-play.png' });
// 게임오버
await pg.evaluate(() => { GAME.S.hp = 0; GAME.tick(1/30); }); await pg.waitForTimeout(1200); await pg.screenshot({ path:'shots/release/3-over.png' });
// 썸네일 컷: 3스테이지(업화 폐사지), 3단 진화 + 2단, 요괴 떼 + 보스
await pg.evaluate(() => { document.getElementById('homeBtn').click(); GAME.META.bestStage = 6; GAME.META.stage = 3; GAME.startGame(); const S = GAME.S, P = GAME.P; S.hp = 1e9; S.maxhp = 1e9;
  const t3 = GAME.EVOS.filter(e => e.tier === 3), t2 = GAME.EVOS.filter(e => e.tier === 2); P.w = { [t3.find(e => e.els[0] === 'fire').id]:4, [t3.find(e => e.els[0] === 'light').id]:3, [t2.find(e => e.els[0] === 'thunder').id]:4 };
  S.t = 300; for (let i = 0; i < 20 * 30; i++) { if (S.mode !== 'play') { document.querySelector('#lvCards .card')?.click(); document.getElementById('chBtn').click(); } P.x += 1.2; GAME.tick(1/30); }
  for (let k = 0; k < 26; k++) { const o = GAME.spawn(['skullmonk','ember','jiangshi','egg'][k % 4] in GAME.ENEMY ? ['skullmonk','ember','jiangshi','egg'][k % 4] : 'egg'); const a = k / 26 * 6.283, d = 110 + (k % 3) * 40; o.x = P.x + Math.cos(a) * d; o.y = P.y + Math.sin(a) * d * .8; }
  const bs = GAME.spawn(GAME.STAGES[S.stage].bosses ? GAME.STAGES[S.stage].bosses[0] : 'boss1', true); bs.x = P.x + 95; bs.y = P.y - 60; S.maxhp = 100; S.hp = 88; });
await pg.waitForTimeout(900); await pg.screenshot({ path:'shots/release/thumb-src.png' });
console.log('errs=' + JSON.stringify(errs), await pg.evaluate(() => ({ stage:GAME.S.stage, w:Object.keys(GAME.P.w), E:GAME.E.length })));
await b.close();
