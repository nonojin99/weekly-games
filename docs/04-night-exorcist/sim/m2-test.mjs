// M2 테스트: 상성·덱·사당·뽑기·수련·첫 3런 해금·주간 챌린지. 실행: NODE_PATH=/home/claude/node_modules node m2-test.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
const here = path.dirname(fileURLToPath(import.meta.url));
const file = 'file://' + path.resolve(here, '../../../games/night-exorcist/index.html') + '?test=1';
const results = []; const check = (n, ok, info = '') => { results.push([n, ok]); console.log((ok ? 'PASS' : 'FAIL') + ' ' + n + (info ? ' — ' + info : '')); };
const posted = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.route('**supabase.co/**', r => {
  const u = r.request().url();
  if (u.includes('daily_rankings') && r.request().method() === 'POST') { posted.push(JSON.parse(r.request().postData())); return r.fulfill({ status: 201, body: '[]' }); }
  if (u.includes('daily_rankings')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ nickname: '테스터', score: 123456 }]) });
  return r.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
});
const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto(file); await page.waitForFunction(() => window.GAME);

// 1. 상성표
const aff = await page.evaluate(() => { const { WBY, affinity } = GAME; const f = (w, el, armor) => +affinity(WBY[w], { el, armor }).toFixed(2); return { wf: f('orb', 'fire', 'none'), fw: f('talisman', 'water', 'none'), tl: f('spear', 'none', 'light'), th: f('spear', 'none', 'heavy'), mh: f('sickle', 'none', 'heavy'), an: f('bell', 'none', 'none'), both: f('orb', 'fire', 'light'), worst: f('torch', 'water', 'none') }; });
check('상성: 수→화 1.5 / 화→수 0.6 / 투척↔light 1.5 heavy 0.6 / 근접↔heavy 1.5 / 오라↔none 1.5 / 겹치면 2.25 / 최악(횃불 vs 수·none) 0.36', aff.wf === 1.5 && aff.fw === .6 && aff.tl === 1.5 && aff.th === .6 && aff.mh === 1.5 && aff.an === 1.5 && aff.both === 2.25 && aff.worst === .36, JSON.stringify(aff));

// 2. v1 → v2 마이그레이션
const mig = await page.evaluate(() => GAME.migrate({ v: 1, runs: 5, coins: 300, train: { atk: 2 }, chars: [1, 0, 0, 0], weapons: [1, 1, 0, 0, 0, 0], stage: 2, bestStage: 1, codex: ['egg'], best: { time: 200, kills: 50 }, lastSeen: 0 }));
check('v1→v2: owned{talisman,sword} deck 2 · shards 0 · train 보존', mig.v === 2 && mig.owned.talisman === 0 && mig.owned.sword === 0 && mig.owned.bell == null && mig.deck.join() === 'talisman,sword' && mig.shards === 0 && mig.train.atk === 2 && mig.train.hp === 0 && mig.bestStage === 1, JSON.stringify(mig.deck));

// 3. 새 플레이어: 덱 = 부적만, 메뉴에 사당/챌린지 숨김
const fresh = await page.evaluate(() => ({ deck: GAME.META.deck.join(), sh: document.getElementById('shrineBtn').classList.contains('hide'), ch: document.getElementById('chalBtn').classList.contains('hide') }));
check('새 플레이어: 덱 [부적] · 사당/챌린지 숨김', fresh.deck === 'talisman' && fresh.sh && fresh.ch);

// 4. 런 1: 3택1은 덱(부적)만 → 무기 후보 0 (부적 lv<5 이면 부적 업만) + 패시브
await page.click('#startBtn'); await page.waitForTimeout(300);
const ch1 = await page.evaluate(() => { const S = GAME.S; GAME.S.xp = 9999; GAME.levelUp(); const names = [...document.querySelectorAll('#lvCards .card b')].map(b => b.textContent.trim()); const ws = names.filter(n => /부적|목검|방울|죽창|물구슬|낫|횃불|화로|물채찍|물안개|염주|엽전표창/.test(n)); return { names, ws }; });
check('런1 3택1: 덱 밖 무기 없음 (부적 외 무기 0)', ch1.ws.every(n => n.startsWith('부적')), ch1.names.join(' | '));
await page.evaluate(() => { const c = document.querySelector('#lvCards .card'); if (c) c.click(); GAME.S.xp = 0; if (GAME.S.mode !== 'play') { document.getElementById('lv').classList.remove('show'); GAME.S.mode = 'play'; } });
// 런 1 종료 → 목검 해금
await page.evaluate(() => { GAME.S.xp = 0; GAME.S.mode = 'play'; document.getElementById('lv').classList.remove('show'); GAME.S.t = 45; GAME.endRun(false); });
await page.waitForTimeout(100);
const after1 = await page.evaluate(() => ({ runs: GAME.META.runs, deck: GAME.META.deck.join(), sword: GAME.META.owned.sword, sh: document.getElementById('shrineBtn').classList.contains('hide'), ch: document.getElementById('chalBtn').classList.contains('hide') }));
check('런1 종료: 목검 해금 · 덱 [부적,목검] · 챌린지 열림 · 사당 아직', after1.runs === 1 && after1.sword === 0 && after1.deck === 'talisman,sword' && after1.sh && !after1.ch, JSON.stringify(after1));

// 5. 런 2 → 방울 + 사당 열림; 런 3 → 조각 +10
await page.evaluate(() => { GAME.S.mode = 'menu'; }); await page.click('#againBtn'); await page.waitForTimeout(200);
await page.evaluate(() => { GAME.S.t = 50; GAME.endRun(false); }); await page.waitForTimeout(100);
await page.click('#againBtn'); await page.waitForTimeout(200);
const shardsBefore = await page.evaluate(() => GAME.META.shards);
await page.evaluate(() => { GAME.S.t = 50; GAME.S.shardsRun = 2; GAME.endRun(false); }); await page.waitForTimeout(100);
const after3 = await page.evaluate(() => ({ runs: GAME.META.runs, deck: GAME.META.deck.join(), shards: GAME.META.shards, sh: document.getElementById('shrineBtn').classList.contains('hide') }));
check('런2·3: 방울 해금 · 사당 열림 · 런3 조각 +10(+런 내 2)', after3.runs === 3 && after3.deck === 'talisman,sword,bell' && !after3.sh && after3.shards === shardsBefore + 12, JSON.stringify(after3));

// 6. 사당: 수련 구매 · 뽑기(신규/중복 숙련) · 덱 편집 10 상한
await page.click('#homeBtn'); await page.waitForTimeout(100); await page.click('#shrineBtn'); await page.waitForTimeout(100);
const train = await page.evaluate(() => { GAME.META.coins = 1000; GAME.renderShrine(); const btn = document.querySelector('#shBody .stat button'); btn.click(); return { atk: GAME.META.train.atk, coins: GAME.META.coins, cost: GAME.trainCost(0) }; });
check('수련: 공격 1단 구매 → coins -40', train.atk === 1 && train.coins === 1000 - train.cost && train.cost === 40, JSON.stringify(train));
const g = await page.evaluate(() => { GAME.META.shards = 200; const before = Object.keys(GAME.META.owned).length; const outs = []; for (let i = 0; i < 20; i++) outs.push(GAME.gacha().id); const own = GAME.META.owned; const mast = Object.values(own).reduce((a, b) => a + b, 0); return { before, after: Object.keys(own).length, shards: GAME.META.shards, mast, deck: GAME.META.deck.length, uniq: new Set(outs).size }; });
check('뽑기 20회: 조각 -200 · 보유 증가 · 중복=숙련 합 = 20 - 신규수 · 덱 ≤10', g.shards === 0 && g.after > g.before && g.mast === 20 - (g.after - g.before) && g.deck <= 10, JSON.stringify(g));
const deckEdit = await page.evaluate(() => { GAME.META.deck = ['talisman']; GAME.META.owned = Object.fromEntries(GAME.WBY && Object.keys(GAME.WBY).map(k => [k, 0])); GAME.openShrine('deck'); const btns = [...document.querySelectorAll('#shBody .grid button')]; btns.forEach(b => { if (!b.classList.contains('in')) b.click(); }); const n1 = GAME.META.deck.length; const b2 = [...document.querySelectorAll('#shBody .grid button')]; b2.filter(b => !b.classList.contains('in')).forEach(b => b.click()); return { n1, n2: GAME.META.deck.length, total: b2.length }; });
check('덱 편집: 20종 보유 시 10개 상한', deckEdit.total === 20 && deckEdit.n2 === 10, JSON.stringify(deckEdit));
await page.screenshot({ path: path.join(here, 'shots/m2-shrine-deck.png') });
await page.evaluate(() => GAME.openShrine('gacha')); await page.screenshot({ path: path.join(here, 'shots/m2-shrine-gacha.png') });

// 7. 런 내 3택1: 덱 10개 중에서만, 최대 4무기
await page.click('#shClose'); await page.waitForTimeout(100);
const deckRun = await page.evaluate(() => { GAME.META.deck = ['sickle', 'orb', 'mist']; return GAME.META.deck.join(); });
await page.click('#startBtn'); await page.waitForTimeout(300);
const run4 = await page.evaluate(() => { const start = Object.keys(GAME.P.w).join(); GAME.S.xp = 9999; GAME.levelUp(); const names = [...document.querySelectorAll('#lvCards .card b')].map(b => b.textContent.trim().split(' ')[0]); GAME.S.xp = 0; document.getElementById('lv').classList.remove('show'); GAME.S.mode = 'play'; return { start, names, deck: GAME.S.deck.join() }; });
check('덱 [낫,물구슬,물안개]: 시작 무기 = 낫, 3택1 무기는 덱 안에서만', run4.start === 'sickle' && run4.names.filter(n => /부적|목검|방울|죽창|횃불|화로|물채찍|염주|엽전표창/.test(n)).length === 0 && run4.deck === 'sickle,orb,mist', JSON.stringify(run4));

// 8. 상성 실피해 + 속성 효과
const hit = await page.evaluate(() => { const o = GAME.spawn('jiangshi'); const hp0 = o.hp; GAME.hitWith(GAME.WBY.sickle, GAME.WBY.sickle, 10, 0, 0); return 0; }).catch(() => 0);
const dmgT = await page.evaluate(() => { const o = GAME.spawn('jiangshi'); o.el = 'metal'; const h0 = o.hp; const o2 = GAME.spawn('jiangshi'); o2.el = 'metal'; const h2 = o2.hp; GAME.hitWith(o, GAME.WBY.sickle, 10, 0, 0); GAME.hitWith(o2, GAME.WBY.spear, 10, 0, 0); const o3 = GAME.spawn('egg'); const h3 = o3.hp; GAME.hitWith(o3, GAME.WBY.talisman, 10, 0, 0); return { armor: o.d.armor, el: o.el, dS: +(h0 - o.hp).toFixed(2), dSp: +(h2 - o2.hp).toFixed(2), burn: o3.burn, dT: +(h3 - o3.hp).toFixed(2), eggEl: o3.el, eggArmor: o3.d.armor }; });
check('실피해: 강시(heavy) 낫 10→' + dmgT.dS + ' / 죽창 10→' + dmgT.dSp + ' · 부적 화상 부여', dmgT.dS > dmgT.dSp && dmgT.burn > 0, JSON.stringify(dmgT));

// 9. 주간 챌린지: 고정 덱 · 수련 미적용 · 시드 결정성 · 랭킹 표시 · 제출
await page.evaluate(() => { GAME.S.t = 20; GAME.endRun(false); }); await page.waitForTimeout(100);
await page.click('#homeBtn'); await page.waitForTimeout(100); await page.click('#chalBtn'); await page.waitForTimeout(300);
const chalUI = await page.evaluate(() => ({ top: document.getElementById('chalTop').textContent, desc: document.getElementById('chalDesc').textContent }));
check('챌린지 패널: 랭킹 로드 · 설명에 고정 덱', chalUI.top.includes('테스터') && chalUI.top.includes('123,456') && chalUI.desc.includes('고정 덱'), chalUI.top);
await page.fill('#chalNick', '호원'); await page.click('#chalGo'); await page.waitForTimeout(300);
const c1 = await page.evaluate(() => { const S = GAME.S; const seq = []; for (let i = 0; i < 6; i++) seq.push(GAME.spawn(['egg', 'jiangshi', 'fire'][i % 3]).x.toFixed(1)); return { chal: !!S.chal, deck: S.deck.join(), stage: S.stage, maxhp: S.maxhp, atk: GAME.META.train.atk, seq: seq.join() }; });
await page.evaluate(() => { GAME.S.t = 30; GAME.S.kills = 7; GAME.endRun(false); }); await page.waitForTimeout(200);
await page.click('#homeBtn'); await page.waitForTimeout(100); await page.click('#chalBtn'); await page.waitForTimeout(200); await page.click('#chalGo'); await page.waitForTimeout(300);
const c2 = await page.evaluate(() => { const seq = []; for (let i = 0; i < 6; i++) seq.push(GAME.spawn(['egg', 'jiangshi', 'fire'][i % 3]).x.toFixed(1)); return seq.join(); });
check('챌린지: 고정 덱 · 스테이지1 · 수련 atk≥1 인데 maxhp = 기본(미적용) · 스폰 시퀀스 재현', c1.chal && c1.deck === GAME_CHAL_DECK_STR(c1) && c1.stage === 0 && c1.atk >= 1 && c1.maxhp === 100 && c1.seq === c2, JSON.stringify({ c1, c2 }));
function GAME_CHAL_DECK_STR(c) { return 'talisman,sword,bell,spear,orb,sickle'; }
check('챌린지 제출: daily_rankings POST game_id=slug#ISOweek · score = 30*1000+7', posted.length === 1 && /^night-exorcist#\d{4}w\d{2}$/.test(posted[0].game_id) && posted[0].score === 30007 && posted[0].nickname === '호원', JSON.stringify(posted));
const chalMeta = await page.evaluate(() => ({ chalBest: GAME.META.chalBest, runs: GAME.META.runs }));
check('챌린지는 런 수·보상에 안 섞임 · chalBest 기록', chalMeta.chalBest === 30007 && chalMeta.runs === 4, JSON.stringify(chalMeta));

// 10. 실플레이 20초(덱 4개) 에러 없음 + 스크린샷
await page.evaluate(() => { GAME.S.t = 5; GAME.endRun(false); }); await page.waitForTimeout(100); await page.click('#homeBtn'); await page.waitForTimeout(100);
await page.evaluate(() => { GAME.META.deck = ['torch', 'orb', 'beads', 'coin']; GAME.META.stage = 2; GAME.META.bestStage = 2; });
await page.click('#startBtn'); await page.waitForTimeout(300);
await page.evaluate(() => { GAME.P.w = { torch:3, orb:2, beads:2, coin:2 }; GAME.S.xp = 0; });
await page.waitForTimeout(6000);
const live = await page.evaluate(() => ({ t: GAME.S.t, w: Object.keys(GAME.P.w).join(), kills: GAME.S.kills, mode: GAME.S.mode, bullets: GAME.B.length }));
await page.screenshot({ path: path.join(here, 'shots/m2-play.png') });
check('실플레이(횃불·물구슬·염주·엽전표창, 귀신의 숲) 6초 처치>0 · 에러 0', live.kills > 0 && errs.length === 0, JSON.stringify(live) + ' errs=' + errs.join(';'));

await browser.close();
const fails = results.filter(r => !r[1]).length; console.log(`\n${results.length - fails}/${results.length} PASS`); process.exit(fails ? 1 : 0);
