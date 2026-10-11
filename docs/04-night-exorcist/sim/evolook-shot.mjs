import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const pg = await b.newPage({ viewport:{ width:390, height:844 }, deviceScaleFactor:3 }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.route('**supabase.co/**', r => r.fulfill({ status:200, body:'[]', contentType:'application/json' }));
await pg.goto('file:///home/claude/weekly-games/games/night-exorcist/index.html?test=1'); await pg.waitForFunction(() => window.GAME);
await pg.evaluate(() => { GAME.META.bestStage = 6; GAME.META.stage = 1; GAME.startGame(); const t3 = GAME.EVOS.filter(e => e.tier === 3), t2 = GAME.EVOS.filter(e => e.tier === 2); GAME.P.w = { [t3[0].id]:3, [t3[3].id]:3, [t2[0].id]:3, [t2[5].id]:3, [t2[9].id]:3 }; GAME.E.length = 0; GAME.KEY.d = true; });
await pg.waitForTimeout(1500); await pg.evaluate(() => { GAME.KEY.d = false; }); await pg.waitForTimeout(600);
await pg.screenshot({ path:'shots/evolook.png', clip:{ x:95, y:322, width:200, height:200 } });
const look = await pg.evaluate(() => { const l = GAME.evoLook(GAME.P); return { orbs:l.orbs.length, fams:l.fams.map(f => f.el), top:l.top, fam:GAME.P.fam?.length }; });
console.log(JSON.stringify(look), 'errs=' + errs);
// 영물 8종 한 장
await pg.evaluate(() => { GAME.E.length = 0; const els = ['fire','water','wood','metal','light','dark','earth','thunder']; const ids = els.map(el => GAME.EVOS.find(e => e.tier === 3 && e.els[0] === el)?.id).filter(Boolean); GAME.P.w = Object.fromEntries(ids.map(id => [id, 3])); GAME.P.fam = null; });
await pg.waitForTimeout(1200); await pg.screenshot({ path:'shots/evolook-fams.png', clip:{ x:40, y:300, width:310, height:220 } });
console.log(await pg.evaluate(() => GAME.evoLook(GAME.P).fams.map(f => f.el).join()));
await b.close();
