// 성능: 덱 4(오라2+근접+투척) Lv5 + 적 60 + 정예 + 보스, 390×844 DPR2. p95 < 12ms
import { chromium } from 'playwright'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const [name, deck] of [['오라2+근접+투척', ['beads','mist','sickle','spear']], ['투척4', ['talisman','orb','spear','coin']]]) {
  const pg = await br.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.route('**supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }));
  await pg.goto('file://' + path.resolve(here, '../../../games/night-exorcist/index.html') + '?test=1'); await pg.waitForFunction(() => window.GAME);
  await pg.evaluate(d => { GAME.META.deck = d; GAME.META.owned = Object.fromEntries(d.map(x => [x, 5])); GAME.META.stage = 3; GAME.META.bestStage = 2; GAME.META.train = { atk:5, hp:5, regen:5, spd:5, pick:5 }; }, deck);
  await pg.click('#startBtn'); await pg.waitForTimeout(300);
  await pg.evaluate(d => { GAME.P.w = Object.fromEntries(d.map(x => [x, 5])); GAME.S.t = 470; GAME.S.hp = 1e9; GAME.S.maxhp = 1e9; GAME.S.xp = -1e9; for (let i = 0; i < 58; i++) GAME.spawn(['jiangshi','fire','gumiho'][i % 3]); GAME.spawn('boss1', true); GAME.spawn('gumiho', false, true); }, deck);
  await pg.waitForTimeout(6000);
  const r = await pg.evaluate(() => { const a = GAME.frameMs().slice(-300).sort((x, y) => x - y); return { p50: a[a.length >> 1].toFixed(2), p95: a[(a.length * .95) | 0].toFixed(2), E: GAME.E.length, B: GAME.B.length, kills: GAME.S.kills }; });
  console.log(name, JSON.stringify(r), r.p95 < 12 ? 'PASS' : 'FAIL', errs.length ? errs : '');
  await pg.close();
}
await br.close();
