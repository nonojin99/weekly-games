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
  await pg.goto('file:///home/claude/weekly-games/games/night-exorcist/index.html?test=1'); await pg.waitForFunction(() => window.GAME); return { pg, errs, name };
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
await G.pg.waitForFunction(() => GAME.S.mode === 'play' && GAME.NET.startMsg, null, { timeout:5000 }).catch(() => {});
const gs = await G.pg.evaluate(() => ({ mode:GAME.S.mode, stage:GAME.S.stage, LP:GAME.LP.id, pl:GAME.PL.length, w:Object.keys(GAME.P.w), remote:[GAME.P1.remote, GAME.P2.remote], need:GAME.S.need }));
const hs2 = await H.pg.evaluate(() => ({ mode:GAME.S.mode, stage:GAME.S.stage, LP:GAME.LP.id, w2:Object.keys(GAME.P2.w), need:GAME.S.need, hp2:GAME.P2.hp }));
ok('호스트 스테이지로 둘 다 시작 · 게스트 LP=P2 · 덱 첫 무기 · 레벨 목표 ×2', gs.mode === 'play' && gs.stage === 1 && hs2.stage === 1 && gs.LP === 1 && hs2.LP === 0 && gs.pl === 2 && gs.w[0] === 'talisman' && hs2.w2[0] === 'talisman' && gs.remote[0] && !gs.remote[1] && gs.need === 24 && hs2.need === 24, JSON.stringify({ gs, hs2 }));
// 게스트 이동 → 호스트 P2 좌표 반영
await G.pg.keyboard.down('d'); await G.pg.waitForTimeout(1200); await G.pg.keyboard.up('d'); await G.pg.waitForTimeout(300);
const mv = await Promise.all([G.pg.evaluate(() => [GAME.P2.x, GAME.P2.y]), H.pg.evaluate(() => [GAME.P2.x, GAME.P2.y, GAME.P2.dx, GAME.NET.stat.rx > 0])]);
ok('게스트 이동이 호스트에 반영 (오차 < 30px)', mv[0][0] > 60 && Math.abs(mv[0][0] - mv[1][0]) < 30 && mv[1][3], JSON.stringify(mv));
// 스냅샷: 게스트 화면에 적·보석·HUD 시간
await G.pg.waitForTimeout(2500);
const sn = await G.pg.evaluate(() => ({ snaps:GAME.NET.stat.snaps, E:GAME.E.length, t:GAME.S.t, uids:GAME.E.every(o => o.uid && o.d), rxKB:Math.round(GAME.NET.stat.rx / 1024) }));
const hn = await H.pg.evaluate(() => ({ E:GAME.E.length, t:GAME.S.t, kills:GAME.S.kills }));
ok('스냅샷 수신 20Hz 근처 · 게스트에 적 표시 · 시간 동기', sn.snaps > 40 && sn.E > 0 && Math.abs(sn.t - hn.t) < .5 && sn.uids, JSON.stringify({ sn, hn }));
// 무기: 호스트가 두 플레이어 무기 모두 발사 (P2 부적 투사체 b.pl===P2)
const fire = await H.pg.evaluate(() => { const S = GAME.S, P2 = GAME.P2; for (let k = 0; k < 4; k++) { const o = GAME.spawn('egg'); o.x = P2.x + 120; o.y = P2.y; } for (let i = 0; i < 40; i++) GAME.tick(1/30); return { b2:GAME.B.filter(b => b.pl === P2).length + (GAME.WCD['1|talisman'] != null ? 1 : 0), kills:S.kills, keys:Object.keys(GAME.WCD) }; });
ok('호스트가 게스트 무기도 발사 (쿨다운 키 1|talisman)', fire.keys.includes('1|talisman') && fire.keys.includes('0|talisman'), JSON.stringify(fire));
// 레벨업: 양쪽 카드, 전원 선택까지 정지, 게스트 pick → 호스트 적용
await H.pg.evaluate(() => { GAME.S.xp = GAME.S.need; GAME.tick(1/30); });
await G.pg.waitForFunction(() => GAME.S.mode === 'lv' && document.querySelectorAll('#lvCards .card').length > 0, null, { timeout:4000 }).catch(() => {});
const lv1 = await Promise.all([H.pg.evaluate(() => ({ mode:GAME.S.mode, cards:document.querySelectorAll('#lvCards .card').length, chs:Object.keys(GAME.LV.chs).length })), G.pg.evaluate(() => ({ mode:GAME.S.mode, cards:document.querySelectorAll('#lvCards .card').length, first:document.querySelector('#lvCards .card b')?.childNodes[0]?.textContent }))]);
ok('레벨업: 호스트·게스트 각자 카드 3장', lv1[0].mode === 'lv' && lv1[0].cards === 3 && lv1[0].chs === 2 && lv1[1].mode === 'lv' && lv1[1].cards === 3, JSON.stringify(lv1));
await H.pg.evaluate(() => document.querySelector('#lvCards .card').click()); await H.pg.waitForTimeout(200);
const wait = await H.pg.evaluate(() => ({ mode:GAME.S.mode, picked:GAME.LV.picked }));
ok('호스트가 골라도 게스트 선택 전엔 정지 유지', wait.mode === 'lv' && wait.picked[0] === 1 && !wait.picked[1], JSON.stringify(wait));
const gpick = await G.pg.evaluate(() => { const b = document.querySelector('#lvCards .card'); const name = b.querySelector('b').childNodes[0].textContent.trim(); b.click(); return name; });
await H.pg.waitForFunction(() => GAME.S.mode === 'play', null, { timeout:3000 }).catch(() => {});
await G.pg.waitForFunction(() => GAME.S.mode === 'play', null, { timeout:3000 }).catch(() => {});
const after = await Promise.all([H.pg.evaluate(() => ({ mode:GAME.S.mode, w2:GAME.P2.w, p2:GAME.P2.p, g:[GAME.P1.grace > 0, GAME.P2.grace > 0] })), G.pg.evaluate(() => ({ mode:GAME.S.mode, w:GAME.LP.w, p:GAME.LP.p }))]);
ok('게스트 선택 → 호스트 P2 적용 · 둘 다 재개 · 무적 유예', after[0].mode === 'play' && after[1].mode === 'play' && after[0].g[0] && after[0].g[1] && JSON.stringify(after[0].w2) === JSON.stringify(after[1].w) && JSON.stringify(after[0].p2) === JSON.stringify(after[1].p), JSON.stringify({ gpick, after }));
// 타임아웃 15초 랜덤픽
await H.pg.evaluate(() => { GAME.S.xp = GAME.S.need; GAME.tick(1/30); }); await H.pg.waitForTimeout(300);
await H.pg.evaluate(() => { GAME.LV.t = 14.95; }); await H.pg.waitForTimeout(600);
const to = await H.pg.evaluate(() => ({ mode:GAME.S.mode, picked:GAME.LV.picked, lvl:GAME.S.lvl }));
ok('15초 타임아웃 → 양쪽 자동 선택 · 재개', to.mode === 'play' && to.picked[0] === 1 && to.picked[1] === 1, JSON.stringify(to));
// 쓰러짐·부활
const rev = await H.pg.evaluate(() => { const P1 = GAME.P1, P2 = GAME.P2; P2.hp = 0; GAME.tick(1/30); const down = P2.down; P1.x = P2.x + 10; P1.y = P2.y; P1.hp = 100; for (let i = 0; i < 100; i++) { P1.x = P2.x + 10; P1.y = P2.y; P1.hp = 100; GAME.tick(1/30); } return { down, up:!P2.down, hp2:P2.hp, mode:GAME.S.mode, grace:P2.grace }; });
ok('게스트 쓰러짐 → 호스트가 3초 옆에 서면 부활 (30% hp, 무적 2초)', rev.down === 1 && rev.up && rev.hp2 > 0 && rev.mode === 'play' && rev.grace > 0, JSON.stringify(rev));
// 둘 다 쓰러지면 끝 → 게스트도 결과 + 자기 보상
await H.pg.evaluate(() => { GAME.P1.hp = 0; GAME.P2.hp = 0; GAME.P1.x = 9999; GAME.tick(1/30); GAME.tick(1/30); });
await G.pg.waitForFunction(() => GAME.S.mode === 'over', null, { timeout:3000 }).catch(() => {});
const end = await Promise.all([H.pg.evaluate(() => ({ mode:GAME.S.mode, runs:GAME.META.runs, coins:GAME.META.coins })), G.pg.evaluate(() => ({ mode:GAME.S.mode, runs:GAME.META.runs, coins:GAME.META.coins, title:document.getElementById('ovTitle').textContent }))]);
ok('둘 다 쓰러짐 → 양쪽 종료 · 양쪽 런 수 증가', end[0].mode === 'over' && end[1].mode === 'over' && end[1].runs === 3 && end[0].runs === 6 && end[1].title === '쓰러졌다', JSON.stringify(end));
// 다시: 호스트 again → 게스트 따라감
await G.pg.evaluate(() => document.getElementById('againBtn').click()); await G.pg.waitForTimeout(100);
await H.pg.evaluate(() => document.getElementById('againBtn').click());
await G.pg.waitForFunction(() => GAME.S.mode === 'play', null, { timeout:4000 }).catch(() => {});
const again = await G.pg.evaluate(() => ({ mode:GAME.S.mode, t:GAME.S.t, coopHidden:!document.getElementById('coop').classList.contains('show') }));
ok('호스트 "다시" → 게스트 자동 재시작', again.mode === 'play' && again.t < 5 && again.coopHidden, JSON.stringify(again));
// 나가기
await G.pg.evaluate(() => { document.getElementById('homeBtn').click(); });
await H.pg.waitForFunction(() => !GAME.NET.on, null, { timeout:4000 }).catch(() => {});
const left = await H.pg.evaluate(() => ({ on:GAME.NET.on, mode:GAME.S.mode, pl:GAME.PL.length }));
ok('게스트 나가면 호스트 연결 해제 · 메뉴 · 1인 복귀', !left.on && left.mode === 'menu' && left.pl === 1, JSON.stringify(left));
ok('에러 0', H.errs.length + G.errs.length === 0, [...H.errs, ...G.errs].slice(0, 5).join(' | '));
console.log(`\n${res.filter(Boolean).length}/${res.length} PASS`); await b.close(); process.exit(res.every(Boolean) ? 0 : 1);
