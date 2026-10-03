import { chromium } from 'playwright';
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await br.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await pg.route('**supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '"saved"' }));
await pg.goto('file:///home/claude/weekly-games/games/night-exorcist/index.html?test=1'); await pg.click('#startBtn');
await pg.evaluate(() => { // 봇: 60ms 마다 근접 적 무게중심 반대 + 보석 쪽으로
  window.__bot = setInterval(() => { if (GAME.S.mode === 'lv') { document.querySelector('#lvCards .card')?.click(); return; } if (GAME.S.mode !== 'play') return;
    let fx = 0, fy = 0; for (const o of GAME.E) { const dx = o.x - GAME.P.x, dy = o.y - GAME.P.y, d = Math.hypot(dx, dy) || 1; if (d < 140) { fx -= dx / d * (140 - d); fy -= dy / d * (140 - d); } }
    let g = null, gd = 1e9; for (const q of GAME.G) { const d = Math.hypot(q.x - GAME.P.x, q.y - GAME.P.y); if (d < gd) { gd = d; g = q; } } if (g && gd < 260) { const near = GAME.E.some(o => Math.hypot(o.x - g.x, o.y - g.y) < 50); const wgt = near ? 30 : 120; fx += (g.x - GAME.P.x) / gd * wgt; fy += (g.y - GAME.P.y) / gd * wgt; }
    const d = Math.hypot(fx, fy); GAME.KEY.KeyW = GAME.KEY.KeyS = GAME.KEY.KeyA = GAME.KEY.KeyD = false; if (d > 5) { if (fx > 5) GAME.KEY.KeyD = true; if (fx < -5) GAME.KEY.KeyA = true; if (fy > 5) GAME.KEY.KeyS = true; if (fy < -5) GAME.KEY.KeyW = true; } }, 60); });
for (const sec of [30, 60, 90]) { await pg.waitForTimeout(30000); await pg.screenshot({ path: `shots/bot-${sec}s.png` }); console.log(sec + 's', await pg.evaluate(() => ({ t: GAME.S.t.toFixed(0), lvl: GAME.S.lvl, kills: GAME.S.kills, hp: GAME.S.hp.toFixed(0), e: GAME.E.length, w: GAME.P.w, p: GAME.P.p }))); }
const fm = await pg.evaluate(() => { const a = GAME.frameMs().slice().sort((x, y) => x - y); return { p50: a[a.length >> 1].toFixed(2), p95: a[(a.length * .95) | 0].toFixed(2) }; }); console.log('frame ms', fm);
await br.close();
