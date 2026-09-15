# 검증된 코드 패턴

Day 1~2에서 실전 검증된 템플릿. 그대로 복사해 SB_URL/SB_KEY/GAME_ID만 바꾸면 된다.
(키 값은 infra.md — 발행일 홀수일이면 프로젝트 A, 짝수일이면 B)

## 랭킹 REST 연동

```js
const SB_URL = "https://<프로젝트>.supabase.co";
const SB_KEY = "<publishable key>";
const GAME_ID = "<slug>";
const sbHeaders = { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Content-Type": "application/json" };

async function fetchTop10() {
  const r = await fetch(`${SB_URL}/rest/v1/daily_rankings?game_id=eq.${GAME_ID}&select=nickname,score&order=score.desc,created_at.asc&limit=10`, { headers: sbHeaders });
  if (!r.ok) throw new Error("fetch fail");
  return r.json();
}
async function submitScore(nickname, score) {
  const r = await fetch(`${SB_URL}/rest/v1/daily_rankings`, {
    method: "POST", headers: sbHeaders,
    body: JSON.stringify({ game_id: GAME_ID, nickname, score })
  });
  if (!r.ok) throw new Error("submit fail");
}
// 서버 트리거가 최고점만 유지하므로, 등록 후 본인 행을 다시 읽으면 그게 곧 최고 기록
async function fetchMyBest(nickname) {
  const r = await fetch(`${SB_URL}/rest/v1/daily_rankings?game_id=eq.${GAME_ID}&nickname=eq.${encodeURIComponent(nickname)}&select=score&limit=1`, { headers: sbHeaders });
  if (!r.ok) return null;
  const rows = await r.json();
  return rows.length ? Number(rows[0].score) : null;
}
async function fetchRank(score) {
  const r = await fetch(`${SB_URL}/rest/v1/daily_rankings?game_id=eq.${GAME_ID}&score=gt.${score}&select=id`, {
    method: "HEAD", headers: { ...sbHeaders, "Prefer": "count=exact" }
  });
  const cr = r.headers.get("content-range");
  return cr ? parseInt(cr.split("/")[1], 10) + 1 : null;
}
```

게임오버 처리: `submitScore` → `fetchMyBest` → `fetchRank(myBest)` →
`"${nick}님 최고 ${myBest}점 — 현재 ${rank}위!"`. 모든 랭킹 호출은 try/catch로 감싸고
실패 시 "랭킹 서버에 연결할 수 없어요" 폴백을 보여준다 (게임 자체는 오프라인에서도 완전 동작).

## 플레이 로그 (모든 게임 필수)

주간 리포트의 데이터원. 프로젝트 A의 play_events에 기록한다 (랭킹 DB가 B인 날에도 로그는 A로).

```js
const LOG_URL = "https://fpjgjwazqpfiffnsgume.supabase.co/rest/v1/play_events";
const LOG_KEY = "sb_publishable_I1YgcnYNBOaGy0WwozO2wQ_PGwsLtU5";
function logEvent(event, score = null) {  // 'load' | 'start' | 'over'
  try {
    fetch(LOG_URL, {
      method: "POST",
      headers: { apikey: LOG_KEY, Authorization: "Bearer " + LOG_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ game_id: GAME_ID, event, score })
    }).catch(() => {});
  } catch (e) {}
}
// 페이지 로드 시 logEvent('load'), 게임 시작 시 logEvent('start'), 게임오버 시 logEvent('over', S.score)
```

## 위클리 세이브 · 플레이어 식별 (위클리 전용)

**순서를 지킨다** — 런 1은 익명, 런 1 종료 화면에서 처음 등록을 권한다 (`design-principles.md` 4장).

```js
const META0 = { v: 1, unlocked: [], runs: 0, best: 0 };          // 게임별 자유 스키마, v는 필수
function hashStr(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); }
const pinHash = pin => hashStr(GAME_ID + ':' + pin);             // 4자리 PIN 1만 개 충돌 0 (실측)
function migrate(m) { if (!m) return { ...META0 }; if (m.v === 1) return m; return { ...META0, ...m, v: 1 }; }

const local = {
  get() { try { return migrate(JSON.parse(localStorage.getItem('wk_' + GAME_ID))); } catch (e) { return { ...META0 }; } },
  set(m) { try { localStorage.setItem('wk_' + GAME_ID, JSON.stringify(m)); } catch (e) {} },
};
let META = local.get(), PLAYER = store.get('wk_player'), PIN = store.get('wk_pin');

// 런 종료 시: 항상 로컬, 등록돼 있으면 서버까지
async function saveRun(meta) {
  meta.runs++; META = meta; local.set(meta);
  if (!PLAYER) return;                                            // 미등록이면 여기서 끝
  try {
    await fetch(SB_URL + '/rest/v1/weekly_saves?on_conflict=game_id,player', {
      method: 'POST',
      headers: { ...sbHeaders, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ game_id: GAME_ID, player: PLAYER, pin_hash: pinHash(PIN), data: meta, runs: meta.runs, updated_at: new Date().toISOString() }),
    });
  } catch (e) {}                                                  // 저장 실패로 게임이 멈추면 안 된다
}

// 등록/불러오기: 같은 닉네임이 있으면 PIN이 맞아야 이어받는다
async function linkPlayer(nick, pin) {
  const r = await fetch(`${SB_URL}/rest/v1/weekly_saves?game_id=eq.${GAME_ID}&player=eq.${encodeURIComponent(nick)}&select=data,runs,pin_hash`, { headers: sbHeaders });
  const rows = r.ok ? await r.json() : [];
  if (rows.length) {
    if (rows[0].pin_hash !== pinHash(pin)) return { ok: false, msg: 'PIN이 달라요' };
    META = migrate(rows[0].data);                                 // 기기 간 이어받기
  }
  PLAYER = nick; PIN = pin; store.set('wk_player', nick); store.set('wk_pin', pin);
  local.set(META); await saveRun(META);                           // 로컬 진행도를 서버로 승격
  return { ok: true };
}
```

**PIN은 보안이 아니다.** 4자리 10,000가지는 즉시 전수 가능하므로, 이건 *남의 기록을 실수로
덮어쓰는 것*을 막는 장치다. 그 이상(세션 토큰·이메일 인증)은 이 프로젝트 규모에 과잉이니 만들지 않는다.
정말 필요해지면 그때 서버 함수로 옮긴다.

**주간 챌린지 제출**은 `progression.md` 4장의 `CHALLENGE_ID`를 `game_id`로 써서 기존 랭킹 코드를
그대로 호출한다. 제출 호출부가 챌린지 모드 분기 안에만 있는지 배포 전 `grep`으로 확인할 것.

## 기타 필수 패턴

- **localStorage 래핑**: `const store = { get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }, set(k,v){ try { localStorage.setItem(k,v); } catch(e){} } };`
- **테스트 훅 (반드시 `?test=1` 게이트)**: 프로덕션에 노출되면 콘솔로 점수를 조작할 수 있다.
  ```js
  if (/[?&]test=1/.test(location.search)) window.GAME = { S, tap, startGame, gameOver, ... };
  ```
  테스트·캡처 스크립트는 URL에 `?test=1`을 붙여서 돌린다. 배포 전 `?test=1` 없이 열어
  `window.GAME === undefined`를 확인할 것.
- **WebAudio 신스 (전 게임 필수, 최소 4종)**: AudioContext는 첫 사용자 입력에서 생성/resume,
  전부 try/catch, 볼륨 0.05~0.2. 시작 / 성공(콤보·점수에 따라 반음 상승, 상한 있음) / 실패 / 게임오버.
  소재에 맞는 음색으로 — 물속 저역 허밍, 눈보라 밴드패스 노이즈, 절구질 낮은 "쿵".
- **ZzFX (선택, 2026-09-08 도구 정찰)**: 손으로 오실레이터를 엮기 어려운 효과음(폭발·코인·파워업·히트)은
  ZzFXMicro(1.2KB, MIT, Frank Force)를 인라인해 쓴다. 저작권 주석 한 줄은 남길 것. 규칙 E(≥4종)는 그대로 적용된다.
  `zzfxX`는 로드 시 `new AudioContext`라 모바일에선 첫 터치에서 `zzfxX.resume()`을 불러야 소리가 난다.
  파라미터 20개 프리셋은 https://killedbyapixel.github.io/ZzFX/ 에서 만들어 붙여넣는다 (예: 코인 `zzfx(...,0,.05,1e3,,.01,,,1.7,,,,,,,,.04,.01)`).
  기존 17개 게임에는 소급 적용하지 않았다 — 각 게임 소재에 맞춰 손으로 만든 음색이 이미 E를 통과했고, 교체는 회귀 위험만 있다.
  라이브러리 원본: `scripts/zzfx.min.js` (스킬 동봉).
- **접근성 최소 세트 (전 게임 필수, 2026-09-08 19개 게임에 일괄 적용)**: accessibility-review 스킬(WCAG 2.1 AA)에서
  캔버스 게임에 의미 있는 것만 가져왔다.
  - 닉네임 input에 `aria-label="닉네임"` (placeholder만으로는 스크린리더 라벨이 아니다).
  - 키보드 포커스 링: `button:focus-visible, input:focus-visible { outline: 3px solid #4da3ff !important; outline-offset: 2px; }`
    (`#nick { outline:none }`처럼 id 선택자가 이기므로 `!important`). 터치에서는 보이지 않으니 디자인을 해치지 않는다.
  - 색만으로 상태를 알리지 않는다 (색 + 모양/텍스트). 아이콘 전용 버튼은 `aria-label`.
  - 시간제한(WCAG 2.2.1)·스크린리더용 캔버스 설명은 게임 특성상 면제. 본문 대비는 G 규칙(≥3.0, 본문 4.5).
- **한글 줄바꿈**: `body { word-break: keep-all; }` 없으면 "됩니 / 다"로 잘린다. 한글에 `letter-spacing` 금지.
- **HUD는 흔들림 밖에서**: 화면 shake로 캔버스 전체를 translate하면 상단 라벨이 잘린다.
  `ctx.restore()` → HUD 그리기 → 필요하면 다시 변환.
- **DPR 대응 Canvas**: `devicePixelRatio` (최대 2 캡) 반영, resize 리스너에서 레이아웃 재계산.
- **viewport meta**: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`
- **키보드 조작 (전 게임 필수, 2026-09-06 17개 게임에 일괄 적용)**: 데스크톱 방문자도 있다. 축1에 대응하는 키
  (Space/↑ 점프, ←→ 이동, 리듬은 F/J 등)를 넣고, 힌트는 터치 기기에선 숨긴다.
  ```js
  const kbIsTyping = () => /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName);
  let kbLock = false;                                       // 시작 키가 곧바로 게임 입력으로 새지 않게
  addEventListener('keydown', e => {
    if (kbIsTyping() || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); if (S.mode === 'menu') { kbLock = true; startGame(); } else if (!kbLock) jump(); }
  });
  addEventListener('keyup', e => { if (e.code === 'Space' || e.code === 'ArrowUp') kbLock = false; release?.(); });
  addEventListener('blur', () => { /* 창 전환 시 누르고 있던 키 전부 해제 */ release?.(); });
  if (!matchMedia('(pointer: coarse)').matches) document.getElementById('kbHint').hidden = false;
  ```
- **Space 재시작 버그 방지 (전 게임 필수)**: 마우스로 누른 `<button>`은 포커스를 유지해서, 이후 Space가 버튼을
  다시 눌러 게임이 재시작된다 (Color Pulse "스페이스 누르면 점수가 0"의 원인). 캡처 단계에서 포커스를 푼다.
  ```js
  document.addEventListener('click', e => { if (e.detail === 0) return;      // 키보드로 누른 버튼은 유지
    const b = e.target.closest && e.target.closest('button'); if (b) b.blur(); }, true);
  ```
- **화면 전환 CSS (H 규칙)**: 패널은 `.panel { opacity:0; transform:translateY(12px); transition: opacity .25s ease-out, transform .25s ease-out }
  .panel.show { opacity:1; transform:none }`. 숨김은 `display:none`이 아니라 `.hidden { opacity:0; pointer-events:none }`이면
  전환이 살지만, **테스트에서 보임 판정은 class로 해야 한다** (Playwright isHidden은 opacity 0을 보이는 것으로 친다).

## 배포용 SQL (달러 쿼팅)

HTML에 따옴표·백틱이 섞여 있으므로 반드시 달러 쿼팅을 쓴다. `$g$`가 HTML 안에 없는지 먼저 확인.

```sql
insert into public.games (slug, title, day, published_on, description, emoji, html)
values ('<slug>', '<제목>', <day>, '<YYYY-MM-DD>', '<한 줄 설명>', '<이모지>', $g$<!DOCTYPE html>
...전체 HTML...
$g$)
on conflict (slug) do update set title=excluded.title, day=excluded.day,
  published_on=excluded.published_on, description=excluded.description,
  emoji=excluded.emoji, html=excluded.html;
```

배포 후 무결성 확인: `select md5(html) from public.games where slug='<slug>';` ↔ 로컬 `md5sum`.
이미 배포된 게임의 소규모 패치는 `update ... set html = replace(html, $old$...$old$, $new$...$new$)`가
전체 재업로드보다 안전하고 싸다 (old 문자열이 원본에 정확히 1번만 나오는지 `grep -c`로 확인,
반드시 md5로 로컬 파일과 일치 재확인).

**분할 업로드 주의 (2026-09-05 사고)**: HTML이 커서 `set` + 여러 번 `append`로 나눠 올리는 동안
**라이브 행이 잘린 HTML 상태로 노출된다.** 실제로 에이전트가 4/6 청크에서 레이트리밋으로 끊겨
장구 잔치가 깨진 채로 서빙됐다. 규칙:
- 가능하면 **한 문장으로 전체 업로드**한다
- 나눠야 하면 각 단계마다 `md5(html)`을 로컬 prefix md5(`head -c`가 아니라 **문자 기준**:
  `python3 -c "print(md5(text[:N].encode()))"` — Postgres `length()`는 문자 수, `md5()`는 UTF-8 바이트 기준)와
  대조하고, **끊기면 즉시 이어서 append해 복구**한다. 중단 지점은 `right(html, 40)`으로 확인
- 더 안전한 방법: 임시 slug 행에 조립한 뒤 `update ... set html = (select html from games where slug='<tmp>')`
  한 문장으로 스왑하고 임시 행 삭제
