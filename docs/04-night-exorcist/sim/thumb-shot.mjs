import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const pg = await b.newPage({ viewport:{ width:390, height:844 }, deviceScaleFactor:2 });
await pg.route('**supabase.co/**', r => r.fulfill({ status:200, body:'[]', contentType:'application/json' }));
await pg.goto('file:///home/claude/weekly-games/games/night-exorcist/index.html?test=1'); await pg.waitForFunction(() => window.GAME);
const stage = +(process.argv[2] || 3);
await pg.evaluate(st => { GAME.META.bestStage = 6; GAME.META.stage = st; GAME.startGame(); const S = GAME.S, P = GAME.P;
  const t3 = GAME.EVOS.filter(e => e.tier === 3), t2 = GAME.EVOS.filter(e => e.tier === 2); P.w = { [t3.find(e => e.els[0] === 'fire').id]:4, [t3.find(e => e.els[0] === 'metal').id]:3, [t2.find(e => e.els[0] === 'thunder').id]:4, [t2.find(e => e.els[0] === 'water').id]:3 };
  S.t = 280; for (let i = 0; i < 12 * 30; i++) { S.hp = 999; S.maxhp = 999; if (S.mode !== 'play') { document.querySelector('#lvCards .card')?.click(); document.getElementById('chBtn').click(); } P.x += 1.5; P.dx = 1; P.moving = true; GAME.tick(1/30); }
  const roster = GAME.STAGES[S.stage].roster; for (let k = 0; k < 30; k++) { const o = GAME.spawn(roster[k % roster.length]); const a = k / 30 * 6.283, d = 120 + (k % 3) * 45; o.x = P.x + Math.cos(a) * d; o.y = P.y + Math.sin(a) * d * .9; }
  S.xp = 0; S.need = 1e9; GAME.CHESTS.length = 0; const bs = GAME.spawn(GAME.STAGES[S.stage].bosses[0], true); bs.x = P.x + 110; bs.y = P.y - 120;
  for (let i = 0; i < 20; i++) { S.hp = 999; GAME.tick(1/30); } S.maxhp = 100; S.hp = 82; P.dx = 1; }, stage);
await pg.waitForTimeout(500);
await pg.evaluate(() => { const fl = []; for (const k in GAME) {} document.getElementById('toast').classList.remove('show'); });
await pg.evaluate(() => { window.__noFl = true; }); 
await pg.addStyleTag({ content:'#toast{display:none!important}' });
await pg.evaluate(() => { GAME.S.mode = 'still'; for (const p of GAME.PL) { p.hitT = 0; p.grace = 0; } GAME.S.flash = 0; GAME.S.shake = 0; for (const o of GAME.E) o.hit = 0; }); await pg.evaluate(() => new Promise(r => setTimeout(r, 1400)));
await pg.screenshot({ path:`shots/release/thumb-src-s${stage}.png` });
await b.close();
