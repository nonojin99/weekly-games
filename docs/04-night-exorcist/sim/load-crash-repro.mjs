// 재현: trainV2 없는(=v18 이전) 세이브로 로드하면 TDZ ReferenceError → 흰 화면. NODE_PATH=/home/claude/node_modules node load-crash-repro.mjs
import { chromium } from 'playwright';
const FILE = 'file:///home/claude/weekly-games/games/night-exorcist/index.html?test=1';
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
await ctx.route('**supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' })); await ctx.route('**fonts.g**', r => r.abort());
const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
const cases = {
  'v1 (m2-test shape)': { v: 1, runs: 5, coins: 300, train: { atk: 2 }, chars: [1, 0, 0, 0], weapons: [1, 1, 0, 0, 0, 0], stage: 2, bestStage: 1, codex: ['egg'], best: { time: 200, kills: 50 }, lastSeen: 0 },
  'v2 pre-trainV2 (5-level train)': { v: 2, runs: 12, coins: 500, shards: 40, train: { atk: 3, hp: 1, regen: 0, spd: 0, pick: 2 }, owned: { talisman: 1, sword: 0, bell: 0, spear: 0 }, deck: ['talisman', 'sword', 'bell', 'spear'], stage: 2, bestStage: 2, codex: ['egg', 'fire'], evo: [], best: { time: 300, kills: 120 }, chalBest: 0, lastSeen: 0 },
  'v2 current (trainV2:1)': { v: 2, runs: 12, coins: 500, shards: 40, train: { atk: 3, hp: 1, regen: 0, spd: 0, pick: 2 }, owned: { talisman: 1 }, deck: ['talisman'], stage: 1, bestStage: 2, codex: [], evo: [], best: { time: 300, kills: 120 }, chalBest: 0, trainV2: 1, lastSeen: 0 },
  'v2 minimal legacy {v:2}': { v: 2 },
  'empty / new player': null,
};
for (const [nm, save] of Object.entries(cases)) {
  errs.length = 0; await pg.goto(FILE); await pg.evaluate(s => { if (s) localStorage.setItem('wk_night-exorcist', JSON.stringify(s)); else localStorage.removeItem('wk_night-exorcist'); Storage.prototype.setItem = () => {}; }, save); await pg.goto(FILE);
  const ok = await pg.waitForFunction(() => window.GAME, null, { timeout: 2500 }).then(() => true).catch(() => false);
  const menuVisible = await pg.evaluate(() => { const m = document.getElementById('menu'); return m && getComputedStyle(m).opacity === '1' && document.getElementById('stages').children.length; });
  console.log((ok ? 'BOOT OK ' : 'WHITE SCREEN') + ' | ' + nm + ' | menu stages=' + menuVisible + ' | ' + (ok ? 'train=' + await pg.evaluate(() => JSON.stringify(GAME.META.train)) : errs.join(' ; ')));
}
await pg.screenshot({ path: 'shots/load-crash-white.png' });
await br.close();
