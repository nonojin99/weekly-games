import { chromium } from 'playwright'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await br.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.route('**supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }));
await pg.goto('file://' + path.resolve(here, '../../../games/night-exorcist/index.html') + '?test=1'); await pg.waitForFunction(() => window.GAME);
await pg.click('#startBtn'); await pg.waitForTimeout(300);
// 접촉 피해: 적을 플레이어 위에 놓고 2초
const hp = await pg.evaluate(async () => { const o = GAME.spawn('egg'); o.x = GAME.P.x + 5; o.y = GAME.P.y; const h0 = GAME.S.hp; for (let i = 0; i < 6; i++) GAME.tick(1/60); const h1 = GAME.S.hp; o.x = GAME.P.x + 5; o.y = GAME.P.y; for (let i = 0; i < 70; i++) { o.x = GAME.P.x + 5; o.y = GAME.P.y; GAME.tick(1/60); } return { h0, h1, h2: GAME.S.hp }; });
console.log('contact', JSON.stringify(hp), '첫 타 -3?', +(hp.h0 - hp.h1).toFixed(1), '1.2초 후 두 번째', +(hp.h1 - hp.h2).toFixed(1));
await pg.evaluate(() => { GAME.S.hp = 23; }); await pg.waitForTimeout(100); await pg.screenshot({ path: path.join(here, 'shots/v5-hp.png') });
await pg.evaluate(() => { GAME.P.w = { talisman: 2, sword: 1, bell: 4 }; GAME.S.deck = ['talisman','sword','bell']; GAME.openChest({ grade: { g:'에픽', n:5, p:.1, col:'#d08cff' }, from:'강시' }); }); await pg.waitForTimeout(300);
await pg.screenshot({ path: path.join(here, 'shots/v5-chest.png') });
console.log('errs', errs); await br.close();
