// 덱별 회피봇 실측 (가속 5배 tick): 달빛 초원 meta0, 덱 3종. 실행: NODE_PATH=/home/claude/node_modules node bot-deck.mjs
import { chromium } from 'playwright';
const DECKS = { '시작덱(부적·목검·방울)': ['talisman', 'sword', 'bell'], '맞춤(귀신의 숲)': ['orb', 'mist', 'spear', 'beads'], '역상성': ['brazier', 'torch', 'whip', 'coin'] };
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const [name, deck] of Object.entries(DECKS)) for (const stage of [1, 2]) {
  const pg = await br.newPage({ viewport: { width: 390, height: 844 } });
  await pg.route('**supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }));
  await pg.goto('file:///home/claude/weekly-games/games/night-exorcist/index.html?test=1'); await pg.waitForFunction(() => window.GAME);
  await pg.evaluate(({ deck, stage }) => { GAME.META.deck = deck; GAME.META.owned = Object.fromEntries(deck.map(d => [d, 0])); GAME.META.stage = stage; GAME.META.bestStage = stage; }, { deck, stage });
  await pg.click('#startBtn'); await pg.waitForTimeout(200);
  const res = await pg.evaluate(async () => {
    const bot = () => { if (GAME.S.mode === 'lv') { const cards = [...document.querySelectorAll('#lvCards .card')]; (cards.find(c => /새로 익힘/.test(c.textContent)) || cards[0])?.click(); return; } if (GAME.S.mode !== 'play') return;
      let fx = 0, fy = 0; for (const o of GAME.E) { const dx = o.x - GAME.P.x, dy = o.y - GAME.P.y, d = Math.hypot(dx, dy) || 1; if (d < 140) { fx -= dx / d * (140 - d); fy -= dy / d * (140 - d); } }
      let g = null, gd = 1e9; for (const q of GAME.G) { const d = Math.hypot(q.x - GAME.P.x, q.y - GAME.P.y); if (d < gd) { gd = d; g = q; } } if (g && gd < 260 && Math.hypot(fx, fy) < 40) { fx += (g.x - GAME.P.x) / gd * 60; fy += (g.y - GAME.P.y) / gd * 60; }
      const K = GAME.KEY; K.KeyW = K.KeyS = K.KeyA = K.KeyD = false; if (Math.hypot(fx, fy) > 5) { if (fx > 5) K.KeyD = true; if (fx < -5) K.KeyA = true; if (fy > 5) K.KeyS = true; if (fy < -5) K.KeyW = true; } };
    const t0 = performance.now(); let steps = 0;
    while (GAME.S.mode === 'play' || GAME.S.mode === 'lv') { bot(); for (let k = 0; k < 4; k++) GAME.tick(1 / 60); steps++; if (steps % 300 === 0) await new Promise(r => setTimeout(r, 0)); if (performance.now() - t0 > 90000) break; }
    return { t: +GAME.S.t.toFixed(0), lvl: GAME.S.lvl, kills: GAME.S.kills, mode: GAME.S.mode, cleared: GAME.S.cleared, w: GAME.P.w };
  });
  console.log(`${name} · 스테이지 ${stage}: ${res.cleared ? '클리어' : '사망 ' + res.t + 's'} · Lv${res.lvl} · 처치 ${res.kills} · ${JSON.stringify(res.w)}`);
  await pg.close();
}
await br.close();
