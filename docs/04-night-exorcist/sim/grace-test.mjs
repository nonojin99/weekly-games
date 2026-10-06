// v22: 레벨업·상자 닫은 뒤 1초 무적
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const pg = await b.newPage({ viewport:{ width:390, height:844 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.route('**supabase.co/**', r => r.fulfill({ status:200, body:'[]', contentType:'application/json' }));
await pg.goto('file:///home/claude/weekly-games/games/night-exorcist/index.html?test=1'); await pg.waitForFunction(() => window.GAME);
const r = await pg.evaluate(() => { GAME.startGame(); const S = GAME.S, P = GAME.P; for (let k = 0; k < 6; k++) { const o = GAME.spawn('egg'); o.x = P.x + 8; o.y = P.y; o.touchCd = 0; }
  S.xp = S.need; GAME.tick(1/30); const lvMode = S.mode; const hp0 = S.hp; document.querySelector('#lvCards .card').click(); const g0 = S.grace;
  for (let i = 0; i < 27; i++) { for (const o of GAME.E) { o.x = P.x + 8; o.y = P.y; } GAME.tick(1/30); } const hpGrace = S.hp;
  for (let i = 0; i < 20; i++) { for (const o of GAME.E) { o.x = P.x + 8; o.y = P.y; o.touchCd = 0; } GAME.tick(1/30); } const hpAfter = S.hp;
  return { lvMode, g0, hp0, hpGrace, hpAfter }; });
const ok = r.lvMode === 'lv' && r.g0 === 1 && r.hpGrace >= r.hp0 - .01 && r.hpAfter < r.hpGrace && errs.length === 0;
console.log((ok ? 'PASS' : 'FAIL') + ' 레벨업 뒤 0.9초 무피해 · 1초 지나면 피격 — ' + JSON.stringify(r) + ' errs=' + errs); await b.close(); process.exit(ok ? 0 : 1);
