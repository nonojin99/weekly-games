// 하네스가 찾은/의심한 버그의 결정적 재현. NODE_PATH=/home/claude/node_modules node harness-repro.mjs
import { chromium } from 'playwright'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const URL = 'file://' + path.resolve(here, '../../../games/night-exorcist/index.html') + '?test=1';
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const fresh = async () => { const pg = await br.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.route('**supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' })); await pg.goto(URL); await pg.waitForFunction(() => window.GAME); return { pg, errs }; };
const start = (pg, stage, diff, deck) => pg.evaluate(([stage, diff, deck]) => { const M = GAME.META; M.runs = 5; M.bestStage = 6; M.bestN = 6; M.bestH = 6; M.stage = stage + 1; M.diff = diff; M.deck = deck; M.owned = Object.fromEntries(deck.map(d => [d, 0])); GAME.startGame(); return GAME.S.mode; }, [stage, diff, deck]);
const log = (n, r) => console.log(n + '\n   ' + JSON.stringify(r));

// A1. 번개 연쇄 + 투사체: 맞은 요괴(E 마지막)와 연쇄 대상이 같은 틱에 죽으면 updateWeapons 644행 TypeError
{ const { pg, errs } = await fresh(); await start(pg, 0, 0, ['boltcharm']);
  const r = await pg.evaluate(() => { const { E, B, P, S, WBY } = GAME; E.length = 0; B.length = 0; P.w = { boltcharm: 1 };
    const a = GAME.spawn('egg'), b = GAME.spawn('egg'); a.hp = 1; b.hp = 1; b.x = P.x + 50; b.y = P.y; a.x = P.x + 90; a.y = P.y; // b = E[1](마지막), a = E[0] 연쇄 대상(90px 안)
    B.push({ w: WBY.boltcharm, owner: WBY.boltcharm, x: b.x, y: b.y, vx: 0, vy: 0, a: 0, life: 1, pierce: 1, dmg: 50, hitSet: new Set(), bounce: 0, alive: true });
    try { GAME.tick(1 / 60); return { threw: null, E: E.length, kills: S.kills }; } catch (e) { return { threw: e.message, E: E.length, kills: S.kills }; } });
  log('A1 projectile+chain double kill (boltcharm)', r); await pg.close(); }

// A2. 같은 상황, 근접(boltspear)
{ const { pg } = await fresh(); await start(pg, 0, 0, ['boltspear']);
  const r = await pg.evaluate(() => { const { E, P, S, WBY } = GAME; E.length = 0; P.w = { boltspear: 1 }; P.dx = 1; P.dy = 0; GAME.WCD.boltspear = 0;
    const a = GAME.spawn('egg'), b = GAME.spawn('egg'); a.hp = 1; b.hp = 1; b.x = P.x + 40; b.y = P.y; a.x = P.x + 70; a.y = P.y + 70; // a 는 창 범위 밖(각도)·b 에서 90px 안
    try { GAME.tick(1 / 60); return { threw: null, E: E.length, kills: S.kills }; } catch (e) { return { threw: e.message, E: E.length, kills: S.kills }; } });
  log('A2 melee+chain double kill (boltspear)', r); await pg.close(); }

// A3. 오라(thunderdrum): 오라 안 2마리 모두 죽음
{ const { pg } = await fresh(); await start(pg, 0, 0, ['thunderdrum']);
  const r = await pg.evaluate(() => { const { E, P, S } = GAME; E.length = 0; P.w = { thunderdrum: 1 }; GAME.WCD.thunderdrum = 0;
    const a = GAME.spawn('egg'), b = GAME.spawn('egg'); a.hp = 1; b.hp = 1; b.x = P.x + 30; b.y = P.y; a.x = P.x - 30; a.y = P.y;
    try { GAME.tick(1 / 60); return { threw: null, E: E.length, kills: S.kills }; } catch (e) { return { threw: e.message, E: E.length, kills: S.kills }; } });
  log('A3 aura+chain double kill (thunderdrum)', r); await pg.close(); }

// A4. 실제 rAF 루프에서 터지면 루프가 죽는지 (frameMs 증가 멈춤)
{ const { pg, errs } = await fresh(); await start(pg, 0, 0, ['boltcharm']);
  await pg.evaluate(() => { const { E, B, P, WBY } = GAME; E.length = 0; B.length = 0; P.w = { boltcharm: 1 }; const a = GAME.spawn('egg'), b = GAME.spawn('egg'); a.hp = 1; b.hp = 1; b.x = P.x + 50; b.y = P.y; a.x = P.x + 90; a.y = P.y;
    B.push({ w: WBY.boltcharm, owner: WBY.boltcharm, x: b.x, y: b.y, vx: 0, vy: 0, a: 0, life: 1, pierce: 1, dmg: 50, hitSet: new Set(), bounce: 0, alive: true }); });
  await pg.waitForTimeout(300); const n1 = await pg.evaluate(() => GAME.frameMs().length + ':' + GAME.S.t.toFixed(2)); await pg.waitForTimeout(500); const n2 = await pg.evaluate(() => GAME.frameMs().length + ':' + GAME.S.t.toFixed(2));
  log('A4 rAF loop after throw (frames:t before/after 0.5s, pageerrors)', { n1, n2, errs }); await pg.close(); }

// B. 보스 도망 소멸: 플레이어가 보스 반대로 달리면 dist > hyp*.9 에서 release → 보스 영구 소멸(bossDone 그대로)
{ const { pg } = await fresh(); await start(pg, 0, 0, ['talisman']);
  const r = await pg.evaluate(() => { const { E, P, S, KEY } = GAME; E.length = 0; P.w = {}; S.t = 300.5; S.bossDone = [true, false]; const o = GAME.spawn('boss1', true); o.x = P.x + 500; o.y = P.y; const hp0 = o.hp; KEY.KeyA = true; let t = 0, gone = -1;
    while (t < 40) { GAME.tick(1 / 30); t += 1 / 30; if (!E.some(e => e.boss)) { gone = +t.toFixed(1); break; } } KEY.KeyA = false; const spdP = P.spd, spdB = o.d.spd * .88 * 1.15; return { bossGoneAfterSec: gone, bossHpUnchanged: o.hp === hp0, kills: S.kills, bossDone: S.bossDone, playerSpd: spdP, bossBaseSpd: +spdB.toFixed(1), coinsFromBoss: S.coins }; });
  log('B boss despawns when player runs away (stage1 easy, no passives)', r); await pg.close(); }

// B2. 늪(안개): 보스 소멸 후 shrink 재개
{ const { pg } = await fresh(); await start(pg, 3, 0, ['talisman']);
  const r = await pg.evaluate(() => { const { E, P, S, KEY } = GAME; E.length = 0; P.w = {}; S.t = 300.5; S.shrinkT = 300; S.bossDone = [true, false]; const o = GAME.spawn('lanternking', true); o.x = P.x + 500; o.y = P.y; KEY.KeyA = true; let t = 0, gone = -1; const sh0 = S.shrinkT;
    while (t < 40) { GAME.tick(1 / 30); t += 1 / 30; if (gone < 0 && !E.some(e => e.boss)) gone = +t.toFixed(1); } KEY.KeyA = false; return { bossGoneAfterSec: gone, shrinkAdvanced: +(S.shrinkT - sh0).toFixed(1), elitesLeft: E.filter(e => e.elite).length }; });
  log('B2 marsh: boss despawn resumes shrink', r); await pg.close(); }

// C. 상자 + 레벨업 같은 틱: 두 오버레이 동시 표시, 카드 선택 후 상자 패널 떠 있는 채로 play 재개
{ const { pg } = await fresh(); await start(pg, 0, 0, ['talisman']);
  const r = await pg.evaluate(() => { const { E, G, P, S, CHESTS } = GAME; E.length = 0; G.length = 0; CHESTS.push({ x: P.x, y: P.y, grade: { g: '일반', n: 1, p: .6, col: '#fff' }, t: 0, from: 'x' }); S.xp = S.need - 0.5; GAME.dropGem(P.x, P.y, 5);
    GAME.tick(1 / 60); const shown = () => ['lv', 'chest'].filter(id => document.getElementById(id).classList.contains('show')); const s1 = shown(), m1 = S.mode;
    document.querySelector('#lvCards .card').click(); const s2 = shown(), m2 = S.mode; GAME.tick(1 / 60); const m3 = S.mode; return { afterTick: { mode: m1, shown: s1 }, afterCardPick: { mode: m2, shown: s2 }, modeNextTick: m3 }; });
  log('C chest + levelUp same tick', r); await pg.close(); }

// D. endRun 직후 바로 startGame(1초 안): over 패널 setTimeout 이 새 런 위에 뜨는지 (againBtn 은 패널 안이라 실제로는 어려움)
{ const { pg } = await fresh(); await start(pg, 0, 0, ['talisman']);
  const r = await pg.evaluate(async () => { GAME.S.t = 5; GAME.endRun(false); GAME.startGame(); await new Promise(r => setTimeout(r, 1000)); return { mode: GAME.S.mode, overShown: document.getElementById('over').classList.contains('show') }; });
  log('D startGame within 700ms of endRun', r); await pg.close(); }

// E. 중복 보스/정예 체크 - 긴 freeze 중에도 t 안 흐름, 문제 없음. 대신 S.t 가 정확히 RUN 넘길 때 hp<=0 이면 사망 처리인지
{ const { pg } = await fresh(); await start(pg, 0, 0, ['talisman']);
  const r = await pg.evaluate(() => { const { E, S } = GAME; E.length = 0; S.t = 599.99; S.hp = 0.01; S.burnT = 5; GAME.tick(1 / 30); return { mode: S.mode, cleared: S.cleared, t: +S.t.toFixed(2), hp: +S.hp.toFixed(2) }; });
  log('E hp hits 0 on the same tick t crosses 600', r); await pg.close(); }

// F. 진화로 소비된 무기의 WCD 키 잔존·evo 후 choices 에 부모 무기 재등장 여부
{ const { pg } = await fresh(); await start(pg, 0, 0, ['talisman', 'torch', 'brazier', 'orb']);
  const r = await pg.evaluate(() => { const { P } = GAME; P.w = { talisman: 5, torch: 5 }; const ev = GAME.evoOptions(); const pickE = ev[0]; GAME.pick({ kind: 'e', d: pickE.e, consume: pickE.consume, lv: 0 }); const reoffer = []; for (let i = 0; i < 40; i++) for (const c of GAME.choices()) if (c.kind === 'w' && pickE.consume.includes(c.d.id)) reoffer.push(c.d.id); return { evo: pickE.e.id, w: { ...P.w }, used: [...P.used], reofferedParents: [...new Set(reoffer)] }; });
  log('F evo consumes parents, parents never re-offered', r); await pg.close(); }

// G. 상자: 진화 무기 포함 강화 / 모든 무기 최대면 엽전
{ const { pg } = await fresh(); await start(pg, 0, 0, ['talisman']);
  const r = await pg.evaluate(() => { const { P, S } = GAME; const e = GAME.EVOS[0].id; P.w = { [e]: 5, talisman: 5 }; const c0 = S.coins; GAME.openChest({ grade: { g: '에픽', n: 5, p: .1, col: '#fff' }, from: 'x' }); const r1 = { coins: S.coins - c0, mode: S.mode }; document.getElementById('chBtn').click(); P.w = { [e]: 1 }; GAME.openChest({ grade: { g: '에픽', n: 5, p: .1, col: '#fff' }, from: 'x' }); return { allMaxed: r1, evoLeveled: P.w[e], mode: S.mode }; });
  log('G chest on maxed / evo weapons', r); await pg.close(); }

// H. 안개 늪 반경이 보스 생존 중 멈추는지 + 보스 둘 다 생존 시
{ const { pg } = await fresh(); await start(pg, 3, 0, ['talisman']);
  const r = await pg.evaluate(() => { const { E, S, P } = GAME; E.length = 0; P.w = {}; S.t = 540.5; S.bossDone = [true, true]; S.shrinkT = 100; const o = GAME.spawn('mistserpent', true); o.x = P.x + 300; o.stun = 99; for (let i = 0; i < 60; i++) GAME.tick(1 / 30); return { shrinkT: S.shrinkT, R: GAME.arenaR() }; });
  log('H shrink paused while boss alive', r); await pg.close(); }

await br.close();
