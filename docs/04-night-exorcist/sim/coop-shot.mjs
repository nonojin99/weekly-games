import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' }); const rooms = {};
async function mk() { const cx = await b.newContext({ viewport:{ width:390, height:844 }, deviceScaleFactor:2 }); const pg = await cx.newPage();
  await pg.route('**supabase.co/**', async r => { const u = new URL(r.request().url()), m = r.request().method(); if (u.pathname.endsWith('/coop_rooms')) { if (m === 'POST') { const body = r.request().postDataJSON(); rooms[body.code] = { offer:body.offer, answer:null }; return r.fulfill({ status:201, body:'[]', contentType:'application/json' }); } const code = (u.searchParams.get('code') || '').replace('eq.', ''); if (m === 'PATCH') { rooms[code].answer = r.request().postDataJSON().answer; return r.fulfill({ status:204, body:'' }); } return r.fulfill({ status:200, body:JSON.stringify(rooms[code] ? [rooms[code]] : []), contentType:'application/json' }); } r.fulfill({ status:200, body:'[]', contentType:'application/json' }); });
  await pg.goto('file:///home/claude/weekly-games/games/night-exorcist/index.html?test=1'); await pg.waitForFunction(() => window.GAME); return pg; }
const H = await mk(), G = await mk();
await H.evaluate(() => { GAME.META.runs = 5; GAME.META.bestStage = 3; GAME.META.stage = 1; document.getElementById('coopBtn').click(); document.getElementById('coopHostBtn').click(); });
await H.waitForFunction(() => /^\d{4}$/.test(document.getElementById('coopCode').textContent), null, { timeout:15000 });
await H.screenshot({ path:'shots/coop-lobby.png' });
const code = await H.evaluate(() => document.getElementById('coopCode').textContent);
await G.evaluate(c => { localStorage.setItem('ne-nick', '호원'); document.getElementById('coopBtn').click(); document.getElementById('coopIn').value = c; document.getElementById('coopJoinBtn').click(); }, code);
await H.waitForFunction(() => GAME.NET.on && GAME.NET.peer, null, { timeout:20000 });
await H.evaluate(() => document.getElementById('coopGo').click()); await G.waitForFunction(() => GAME.S.mode === 'play', null, { timeout:5000 });
await G.keyboard.down('a'); await G.waitForTimeout(1500); await G.keyboard.up('a');
await H.evaluate(() => { for (let k = 0; k < 14; k++) { const o = GAME.spawn('egg'); o.x = GAME.P2.x + 60 + Math.random() * 200; o.y = GAME.P2.y + (Math.random() - .5) * 300; } GAME.P2.w = { talisman:3 }; });
await G.waitForTimeout(2500);
await G.screenshot({ path:'shots/coop-guest.png' }); await H.screenshot({ path:'shots/coop-host.png' });
await b.close();
