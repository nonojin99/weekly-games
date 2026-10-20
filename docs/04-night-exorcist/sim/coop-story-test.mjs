// 코옵 1단계: 브라우저 컨텍스트 2개 — 시그널링(coop_rooms REST)은 메모리 목, WebRTC 는 실제 연결.
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--allow-insecure-localhost'] });
const rooms = {};
async function mkPage(name) {
  const cx = await b.newContext({ viewport:{ width:390, height:844 } }); const pg = await cx.newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(name + ': ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text())) errs.push(name + ' console: ' + m.text()); });
  await pg.route('**supabase.co/**', async r => { const u = new URL(r.request().url()), m = r.request().method();
    if (u.pathname.endsWith('/coop_rooms')) { if (m === 'POST') { const body = r.request().postDataJSON(); rooms[body.code] = { offer:body.offer, answer:null }; return r.fulfill({ status:201, body:'[]', contentType:'application/json' }); }
      const code = (u.searchParams.get('code') || '').replace('eq.', ''); if (m === 'PATCH') { const body = r.request().postDataJSON(); if (rooms[code]) rooms[code].answer = body.answer; return r.fulfill({ status:204, body:'' }); }
      return r.fulfill({ status:200, body:JSON.stringify(rooms[code] ? [rooms[code]] : []), contentType:'application/json' }); }
    r.fulfill({ status:200, body:'[]', contentType:'application/json' }); });
  await pg.goto('file:///home/claude/weekly-games/games/night-exorcist/index.html?test=1&story=1'); await pg.waitForFunction(() => window.GAME); return { pg, errs, name };
}
const H = await mkPage('host'), G = await mkPage('guest');
const res = []; const ok = (n, c, d = '') => { res.push(c); console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
// 호스트: 방 만들기
await H.pg.evaluate(() => { GAME.META.runs = 5; GAME.META.bestStage = 3; GAME.META.stage = 2; GAME.META.train.atk = 10; document.getElementById('coopBtn').click(); document.getElementById('coopHostBtn').click(); });
await H.pg.waitForFunction(() => /^\d{4}$/.test(document.getElementById('coopCode').textContent), null, { timeout:15000 });
const code = await H.pg.evaluate(() => document.getElementById('coopCode').textContent);
ok('호스트 방 코드 4자리 + offer 업로드', /^\d{4}$/.test(code) && !!rooms[code]?.offer, code);
// 게스트: 입장
await G.pg.evaluate(c => { GAME.META.runs = 2; GAME.META.deck = ['talisman', 'sword']; GAME.META.owned.sword = 3; GAME.META.train.spd = 7; localStorage.setItem('ne-nick', '친구'); document.getElementById('coopBtn').click(); document.getElementById('coopIn').value = c; document.getElementById('coopJoinBtn').click(); }, code);
await H.pg.waitForFunction(() => GAME.NET.on && GAME.NET.peer, null, { timeout:20000 }).catch(() => {});
const hs = await H.pg.evaluate(() => ({ on:GAME.NET.on, peer:!!GAME.NET.peer, nick:GAME.P2.nick, deck:GAME.P2.deck, spd:GAME.P2.meta?.train?.spd, pl:GAME.PL.length, go:!document.getElementById('coopGo').classList.contains('hide') }));
ok('WebRTC 연결 + hello (닉·덱·수련 수신) + 출발 버튼', hs.on && hs.peer && hs.nick === '친구' && hs.deck.join() === 'talisman,sword' && hs.spd === 7 && hs.pl === 2 && hs.go, JSON.stringify(hs));
// 출발
await H.pg.evaluate(() => document.getElementById('coopGo').click());
await G.pg.waitForFunction(() => GAME.S.mode === 'story', null, { timeout:5000 }).catch(() => {});

const st = await Promise.all([H.pg.evaluate(() => ({ mode:GAME.S.mode, n:GAME.STP.pages.length, t:document.getElementById('stTitle').textContent })), G.pg.evaluate(() => ({ mode:GAME.S.mode, n:GAME.STP.pages.length, t:document.getElementById('stTitle').textContent }))]);
ok('코옵 출발: 둘 다 같은 이야기 2장 (프롤로그·2밤), 정지', st[0].mode === 'story' && st[1].mode === 'story' && st[0].n === 2 && st[1].n === 2 && st[0].t === '봉인 등불' && st[1].t === '봉인 등불', JSON.stringify(st));
await G.pg.evaluate(() => document.getElementById('stNext2').click()); await H.pg.waitForTimeout(400);
const p2 = await Promise.all([H.pg.evaluate(() => document.getElementById('stTitle').textContent), G.pg.evaluate(() => document.getElementById('stTitle').textContent)]);
ok('게스트가 넘기면 호스트도 다음 장', p2[0] === '2. 귀신의 숲' && p2[1] === '2. 귀신의 숲', JSON.stringify(p2));
await H.pg.evaluate(() => document.getElementById('stNext2').click());
await G.pg.waitForFunction(() => GAME.S.mode === 'play', null, { timeout:3000 }).catch(() => {});
const p3 = await Promise.all([H.pg.evaluate(() => ({ mode:GAME.S.mode, show:document.getElementById('story').classList.contains('show'), s:GAME.META.story })), G.pg.evaluate(() => ({ mode:GAME.S.mode, show:document.getElementById('story').classList.contains('show'), s:GAME.META.story }))]);
ok('호스트가 마지막 장 닫으면 둘 다 재개 · 양쪽 다 본 것으로 기록', p3[0].mode === 'play' && p3[1].mode === 'play' && !p3[0].show && !p3[1].show && p3[0].s.includes('i1') && p3[1].s.includes('i1') && p3[1].s.includes('pro'), JSON.stringify(p3));
ok('에러 0', H.errs.length + G.errs.length === 0, [...H.errs, ...G.errs].join(' | '));
console.log(`\n${res.filter(Boolean).length}/${res.length} PASS`); await b.close(); process.exit(res.every(Boolean) ? 0 : 1);
