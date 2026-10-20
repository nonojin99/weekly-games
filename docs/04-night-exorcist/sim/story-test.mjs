// v25 스토리: 프롤로그·밤 인트로(처음만)·클리어 한 줄·엔딩·심지 표시·코옵 동기
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const res = []; const ok = (n, c, d = '') => { res.push(c); console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const pg = await b.newPage({ viewport:{ width:390, height:844 }, deviceScaleFactor:2 }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.route('**supabase.co/**', r => r.fulfill({ status:200, body:'[]', contentType:'application/json' }));
await pg.goto('file:///home/claude/weekly-games/games/night-exorcist/index.html?test=1&story=1'); await pg.waitForFunction(() => window.GAME);
const m0 = await pg.evaluate(() => ({ wk:document.getElementById('menuWicks').classList.contains('hide'), story:GAME.META.story }));
ok('새 플레이어: 메뉴 심지 줄 숨김 · story []', m0.wk && Array.isArray(m0.story) && !m0.story.length, JSON.stringify(m0));
await pg.evaluate(() => document.getElementById('startBtn').click()); await pg.waitForTimeout(300);
const s1 = await pg.evaluate(() => ({ mode:GAME.S.mode, show:document.getElementById('story').classList.contains('show'), title:document.getElementById('stTitle').textContent, n:GAME.STP.pages.length, btn:document.getElementById('stNext2').textContent }));
ok('첫 시작: 프롤로그 + 1밤 인트로 2장, 그동안 정지', s1.mode === 'story' && s1.show && s1.title === '봉인 등불' && s1.n === 2 && s1.btn === '다음', JSON.stringify(s1));
await pg.screenshot({ path:'shots/story-pro.png' });
const t0 = await pg.evaluate(() => GAME.S.t); await pg.waitForTimeout(400); const t1 = await pg.evaluate(() => GAME.S.t);
ok('이야기 중 시간 정지', t0 === t1);
await pg.evaluate(() => document.getElementById('stNext2').click()); await pg.waitForTimeout(150);
const s2 = await pg.evaluate(() => ({ title:document.getElementById('stTitle').textContent, btn:document.getElementById('stNext2').textContent, story:GAME.META.story }));
ok('둘째 장: 1. 달빛 초원 인트로 · 버튼 "밤으로" · pro 기록', s2.title === '1. 달빛 초원' && s2.btn === '밤으로' && s2.story.includes('pro'), JSON.stringify(s2));
await pg.screenshot({ path:'shots/story-intro.png' });
await pg.evaluate(() => document.getElementById('stNext2').click()); await pg.waitForTimeout(400);
const s3 = await pg.evaluate(() => ({ mode:GAME.S.mode, show:document.getElementById('story').classList.contains('show'), story:GAME.META.story, t:GAME.S.t }));
ok('닫으면 플레이 재개 · i0 기록', s3.mode === 'play' && !s3.show && s3.story.includes('i0') && s3.t > 0, JSON.stringify(s3));
// 클리어(쉬움 첫) → 클리어 한 줄 + 심지 1/6
await pg.evaluate(() => { GAME.S.t = 600; GAME.tick(1/30); }); await pg.waitForTimeout(1200);
const c1 = await pg.evaluate(() => ({ sub:document.getElementById('ovSub').textContent, w:GAME.wicks() }));
ok('쉬움 1밤 첫 클리어: 클리어 문장 + 심지 1/6', /달빛 심지를 되찾았다/.test(c1.sub) && /1\/6/.test(c1.sub) && c1.w === 1, JSON.stringify(c1));
// 다시 시작: 같은 밤은 이야기 안 뜸
await pg.evaluate(() => document.getElementById('againBtn').click()); await pg.waitForTimeout(300);
ok('같은 밤 재시작: 이야기 없음', await pg.evaluate(() => GAME.S.mode === 'play' && !document.getElementById('story').classList.contains('show')));
// 메뉴: 심지 줄 · 카드 lore
await pg.evaluate(() => { GAME.S.hp = 0; GAME.tick(1/30); }); await pg.waitForTimeout(900); await pg.evaluate(() => document.getElementById('homeBtn').click()); await pg.waitForTimeout(300);
const mn = await pg.evaluate(() => ({ wk:!document.getElementById('menuWicks').classList.contains('hide'), on:document.querySelectorAll('#menuWicks i.on').length, lore:document.querySelector('#stages .stcard .lore')?.textContent, lore2:document.querySelectorAll('#stages .stcard')[1]?.querySelector('.lore') }));
ok('메뉴: 심지 1/6 표시 · 1밤 카드 "달빛 심지 회수" · 안 본 2밤 lore 없음', mn.wk && mn.on === 1 && /달빛 심지 회수/.test(mn.lore) && !mn.lore2, JSON.stringify(mn));
await pg.screenshot({ path:'shots/story-menu.png' });
// 2밤 진입 → 인트로 1장만
await pg.evaluate(() => { GAME.META.stage = 2; GAME.renderStages(); document.getElementById('startBtn').click(); }); await pg.waitForTimeout(300);
const s4 = await pg.evaluate(() => ({ n:GAME.STP.pages.length, title:document.getElementById('stTitle').textContent }));
ok('2밤 첫 진입: 인트로 1장 (프롤로그는 이미 봄)', s4.n === 1 && s4.title === '2. 귀신의 숲', JSON.stringify(s4));
await pg.evaluate(() => document.getElementById('stNext2').click());
// 6밤 쉬움 첫 클리어 → 엔딩
await pg.evaluate(() => { GAME.META.bestStage = 5; GAME.META.story.push('i5'); GAME.S.hp = 0; GAME.tick(1/30); }); await pg.waitForTimeout(900);
await pg.evaluate(() => { document.getElementById('homeBtn').click(); GAME.META.stage = 6; GAME.renderStages(); document.getElementById('startBtn').click(); GAME.S.t = 600; GAME.tick(1/30); }); await pg.waitForTimeout(2200);
const e1 = await pg.evaluate(() => ({ show:document.getElementById('story').classList.contains('show'), title:document.getElementById('stTitle').textContent, body:document.getElementById('stBody').textContent, btn:document.getElementById('stNext2').textContent, sub:document.getElementById('ovSub').textContent }));
ok('6밤 쉬움 첫 클리어: 벼락 심지 문장 + 엔딩 패널(그림자·보통 해금)', e1.show && e1.title === '동이 텄다' && /그림자/.test(e1.body) && /보통/.test(e1.body) && e1.btn === '닫기' && /벼락의 심지/.test(e1.sub), JSON.stringify(e1));
await pg.screenshot({ path:'shots/story-end.png' });
await pg.evaluate(() => document.getElementById('stNext2').click()); await pg.waitForTimeout(200);
const e2 = await pg.evaluate(() => ({ show:document.getElementById('story').classList.contains('show'), over:document.getElementById('over').classList.contains('show'), e0:GAME.META.story.includes('e0'), mode:GAME.S.mode }));
ok('엔딩 닫으면 결과창 그대로 · e0 기록', !e2.show && e2.over && e2.e0 && e2.mode === 'over', JSON.stringify(e2));
// 세이브 왕복
const rt = await pg.evaluate(() => { const m = GAME.migrate(JSON.parse(JSON.stringify(GAME.META))); return m.story.join(); });
ok('migrate 왕복: story 보존', rt.includes('pro') && rt.includes('e0'), rt);
ok('에러 0', errs.length === 0, errs.join(' | '));
console.log(`\n${res.filter(Boolean).length}/${res.length} PASS`); await b.close(); process.exit(res.every(Boolean) ? 0 : 1);
