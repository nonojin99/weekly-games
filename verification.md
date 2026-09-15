# 배포 전 4중 검증

"돌아간다"와 "잘 만들어졌다"는 다르다. 네 검증(기능·수학·봇 시뮬·시각) 모두 통과 전에는 배포하지 않는다.

## 1. 기능 테스트 (Playwright)

로컬 서버를 띄우고 (`python3 -m http.server 8777 --directory <게임 폴더 상위>`)
Playwright 헤드리스로 검증한다. chromium은 반드시 `executablePath: '/opt/pw-browsers/chromium'`.

체크리스트:
- 페이지 로드, pageerror 0건 (콘솔 에러 중 favicon 404와 supabase 네트워크 차단은 환경 탓이라 무시 가능)
- 시작 조작 → 게임 상태 진입 (window.GAME 훅으로 상태 확인)
- 핵심 조작이 점수/상태를 바꾸는지 (훅으로 정타이밍을 계산해 자동 조작)
- 게임오버 → 오버레이 표시, 점수·최고기록 표시
- 재시작 → 다시 플레이 상태
- 랭킹 API는 브라우저에서 검증 불가(샌드박스 차단) → 아래 SQL 시뮬레이션으로 대체:

```sql
begin;
set local role anon;
insert into public.daily_rankings (game_id, nickname, score) values ('<slug>', 'QA', 100);
insert into public.daily_rankings (game_id, nickname, score) values ('<slug>', 'QA', 50);
insert into public.daily_rankings (game_id, nickname, score) values ('<slug>', 'QA', 200);
select nickname, score from public.daily_rankings where game_id='<slug>';  -- QA 200 한 행이어야 함
rollback;
```

## 2. 수학적 공정성 검증 (필수 룰)

배포 전 난이도 파라미터(속도·제한시간·간격·크기·스폰 규칙)를 수식으로 정리하고,
node 시뮬레이션으로 **전 진행 구간(최소 성공/진행 0~100단계)의 최악 시나리오**에서
클리어 불가능 상태가 없음을 증명한다. 사람의 반응시간 여유(최소 0.25초)를 포함할 것.

사고 방식: "운이 가장 나쁜 플레이어에게도 물리적으로 가능한가?"를 수식으로 묻는다.
- 반응형 게임: 최악 배치에서 목표가 도달하는 데 걸리는 시간 ≤ 제한시간 − 반응시간?
- 러너: 연속 장애물 사이 간격 ≥ 조작 후 상태 전환에 필요한 거리? 통과 갭 ≥ 플레이어 크기 × 여유율?
- 낙하물: 안전 지대가 항상 1개 이상 존재하고, 거기까지 이동 시간이 낙하 시간보다 짧은가?

시뮬레이션 예 (Day 1 사례 — 이 버그는 실제로 있었다):

```js
// Color Pulse: timeMax가 점수 기준이라 고득점에서 "한 바퀴 대기"가 불가능해졌다.
// 수정: timeMax = min(4.5, 2π/speed × 1.1 + 0.25) → 회전 주기에 비례시켜 전 구간 보장.
for (let n = 0; n <= 100; n++) {
  const speed = Math.min(4.2, 1.4 + 0.06 * n);
  const timeLimit = Math.min(4.5, (Math.PI * 2 / speed) * 1.1 + 0.25);
  const worstWait = (1.5 * Math.PI) / speed + 0.25;   // 최악 배치 + 반응시간
  if (timeLimit < worstWait) throw new Error(`불가능 구간 n=${n}`);
}
```

불가능 구간이 나오면: 파라미터를 상수로 고치지 말고 **원인 변수에 비례하는 수식**으로 바꾼다
(예: 제한시간을 점수가 아니라 회전 주기에 비례). 재검증 통과까지 배포 금지.
사용한 수식과 검증 결과는 Notion 일지에 기록한다.

## 3-0. 무인 렌더링·정돈 감사 (`scripts/render-smoke.mjs`, 필수·선행)

사람이 스크린샷을 보기 **전에** 기계가 먼저 거른다. 60초 안에 끝나고, ❌가 있으면 시각 검증으로 내려가지 않는다.

```bash
node scripts/render-smoke.mjs game/index.html --out shots/            # 모바일 390×844
node scripts/render-smoke.mjs game/index.html --out shots/ --desktop  # 키보드 게임은 1100×900도
node scripts/render-smoke.mjs game/index.html --over "window.GAME.S.hp=0"   # gameOver 훅이 없을 때 강제식
```

재는 것 (❌ = 배포 금지 / ⚠ = 눈으로 판단):
- ❌ 로드·pageerror·콘솔 오류 / ?test=1 없이 훅 노출(F) / 첫 화면 버튼 0개(C) / 플레이 캔버스 비지배색 <5%(B, 빈 화면) /
  시작 클릭 뒤 화면 무변화 / 입력 폭주(키·탭·드래그) 중 오류 / 결과 화면 미도달(훅 있을 때) /
  한글 제목 자간 >15%·음수 <−6%(D) / 텍스트 뷰포트 이탈(D)
- ⚠ 버튼 2개 이상 / 유휴 애니메이션 정지 / 결과 화면에 닉네임 input 없음 / 버튼 높이 <44 / 글자 <11px / 대비 <3.0 /
  fillText에 이모지 / WebAudio 없음
- 산출: `shots/mobile-{start,play,over}.png` + `smoke-report.json` — 이 3장을 그대로 3.에서 본다.

훅 규약이 전제다: `window.GAME = { S, startGame, gameOver }` (`?test=1`에서만). `gameOver`가 없으면 결과 화면 검사는
방치 22초로 대체되고 ⚠로 내려간다 — 새 게임은 반드시 `gameOver`를 훅에 넣는다.

보정 근거: 배포된 17개 게임에 돌려 오탐 0으로 맞췄다(2026-09-06). 그 과정에서 코스모 핀 결과 제목의 자간 6px/30px
("궤 도 이 탈")를 실제로 잡아 패치했다 — 사람 눈은 14개 게임 감사에서 이걸 놓쳤다.

## 3. 시각 검증 (필수 룰)

기능이 멀쩡해도 못생기면 실패다 (과거 수박게임 교훈). 3-0의 스크린샷 3장(필요하면 추가 촬영)을
**Read 도구로 이미지를 직접 열어 눈으로 판단**한다.

**결과 화면은 반드시 포함한다.** 2026-09-05 감사에서 나온 렌더링 버그 2건이 전부 결과 화면에 있었다
(눈보라 썰매 제목 자간 깨짐, Color Pulse `BEST 0` 고정). 기능 테스트는 "동작"을 보지만 "표시"는 못 본다.
플레이 화면까지만 찍고 넘어가면 이 부류를 100% 놓친다.

캡처는 `?test=1`을 붙여서 돌린다 (테스트 훅이 그때만 설치되므로).

```js
// 시작 화면
await page.screenshot({ path: 'shot-start.png' });
// 플레이 중 (훅으로 시작시키고 잠시 진행)
await page.evaluate(() => window.GAME.startGame()); await page.waitForTimeout(1500);
await page.screenshot({ path: 'shot-play.png' });
// 게임오버 (훅으로 강제 종료)
await page.evaluate(() => window.GAME.gameOver?.() ?? window.GAME.S.mode = 'over');
await page.waitForTimeout(800);
await page.screenshot({ path: 'shot-over.png' });
```

viewport는 모바일 기준 390×844. 각 이미지를 Read로 열어 확인할 것:
- 레이아웃: 잘림·겹침·오버플로 없음, 세이프에어리어 침범 없음
- 타이포: 제목-본문 위계 분명, 작은 회색 글씨가 배경에 묻히지 않음 (대비 확보)
- 색: 팔레트가 3~5색으로 일관, 게임 요소끼리 역할 구분이 색으로 명확
- 첫인상: "스토어에 올라온 게임 같은가?" — 아니라고 느껴지면 구체적으로 무엇이 촌스러운지
  적고 수정 → 재촬영. 애매하면 design:design-critique 스킬로 한 번 더 검토.

**그다음 `art-and-ux.md`의 A~H 체크리스트를 항목별로 ○/× 판정한다** (smoke가 잰 항목은 결과를 옮겨 적고, 나머지만 눈으로):

```
A-1 게임 오브젝트에 이모지 0개 (🏆 등 UI 크롬 제외)
A-2 주요 오브젝트마다 명암·디테일선·가장자리 3요소 — 평면 클립아트면 ×
B   빈 공간 절반 미만 / 저채도 배경 레이어 / 진행에 따른 변화
C   첫 화면 = 버튼 하나, 1클릭 진입, 닉네임은 결과 화면
D   HUD 플레이트·대비 / 한글 letter-spacing 없음 / keep-all / 흔들림 밖 HUD /
    판정문구 최상단 / BEST 실시간(max(최고,현재))
E   WebAudio 4종 이상, AudioContext는 첫 입력에서, try/catch
F   ?test=1 없이 열었을 때 window.GAME === undefined
G   터치 타깃 ≥44px / 글자 ≥11px / 대비 ≥3.0 / 간격 4·8 스케일 / 중앙 정렬
H   전환 200~350ms ease-out / 점수 카운트업 / 유휴 모션 / reduced-motion
```

×가 하나라도 있으면 고치고 재촬영한다. 이 목록은 14개 게임 사후 감사에서 32건이 나온 뒤
만들어졌다 — 만들 때 지켰으면 30건은 발생하지 않았다.

## 검증 기록

네 검증의 결과(테스트 건수, 수식, 봇 분포, 스크린샷 A~F 판정)를 Notion 일지의 "테스트" 섹션에 남긴다.
다음 날 세션이 이 기록에서 배우므로, 발견한 버그와 수정 원리는 반드시 적는다.

## (추가) 봇 플레이어 시뮬레이션 — 체감 난이도 검증

수학적 공정성(최악 배치 하한)과 별개로, 배포 전 반드시 실행한다.
세부는 `harness.md`. **순서를 지킬 것 — 봇 모델이 틀리면 진단도 틀린다.**

1. **장르에 맞는 봇을 고른다**
   - 타이밍형(정해진 순간에 정확히 누른다): 반응속도 0.30/0.50/0.80초 봇을 시뮬 안에 구현.
     "자신의 반응속도보다 좁은 반응창을 만나면 확률적으로 실패"(성공률 = clamp(window/reaction,0,1)^k)
   - 이동형(캐릭터를 끌고 다니며 피하고 모은다): `movement-bots.mjs`의 `makeMovementBots()`.
     실력 축은 반응 지연이 아니라 **위협 예측 지평**. 회피 반경은 전 봇 동일하게 둘 것
2. `node scripts/harness.mjs <시뮬.mjs> --seeds 200` — 봇당 200판
3. 판정: 초보 도입부 / 고수 유한 생존 / 실력 변별력(총점) / 효율 역전 없음 /
   축2 가치 ≥1.5배 / 판 길이 30~120초
4. 실패하면 **진단 코드를 읽는다** — `REWARD_STRUCTURE`(실력은 있는데 총점이 보상 안 함) /
   `TIME_FARMING`(그냥 오래 버틴 것) / `NO_DEPTH`(진짜로 깊이 없음). 처방은 harness.md

⚠ 총점만 보고 반려하지 말 것. day 12 「윙윙 꿀배달」은 총점으로는 고수<초보라 폐기 직전까지
갔지만 효율로는 고수가 1.55배 앞서 있었다 — 실력 깊이는 있는데 잘할수록 판이 짧아져
총점이 상쇄된 경우였다.

수식·분포 요약(각 봇 중앙값/판 길이/효율)은 Notion 일지에 기록한다.

## 6. 경제 밸런스 검증 (위클리 전용 · 필수 · 코드 전에)

> **2026-09-13 개정**: 아래 `power/challenge` 밴드 검사는 런제 전제라 폐기. 대신 `progression.md` 2장의 불변식 5개(대기 밴드·벽 없음·환생 시점·활성 가치·환생 가속)를
> 탐욕 봇 시뮬(`docs/01-ore/sim/idle-sim.mjs` 템플릿)로 검증한다. NO_META 봇은 **NO_TAP 봇**(활성 조작 없이 구매만)으로 대체한다. 아래 본문은 참고용으로만 남긴다.


`progression.md` 2장의 불변식을 수식 단계에서 증명한다. 스크립트 한 장이면 된다.

`scripts/balance-check.mjs`를 복사해 두 곡선만 게임 것으로 바꿔 실행한다.

```js
const R = 200;
// ① 성장: 해금으로 얻는 실질 역량 (상한 있음)
const G = 0.8, d = 0.92;
const power = r => 1 + G * (1 - Math.pow(d, r));
// ② 도전: 런 난이도 파라미터에서 유도한 요구 역량 (게임마다 다르게 적는다)
const challenge = r => 1 + 0.85 * (1 - Math.pow(0.90, r));
const ratio = r => challenge(r) / power(r);
```

**두 곡선은 반드시 독립적으로 적는다.** `challenge`를 `power`로 정의하면 검사가 항등식이 되어
아무것도 못 잡는다. challenge는 실제 난이도 파라미터(적 수·속도·요구 정밀도)에서 유도해야 한다.

위 값으로 돌리면 전 구간 밴드 유지(r=5에서 1.059, r=200에서 1.028), 포화도 1.00이다.
성장을 조금만 세게 해도(도전 계수 0.85→0.25) r=4부터 197개 구간이 밴드를 이탈한다 — 검사에 실제로 이가 있다.


합격 기준 네 가지:
1. **밴드 유지** — `ratio(r)/ratio(0)` 가 0~200런에서 0.90~1.15
2. **포화** — `power(200) / power(∞) ≥ 0.98` (성장이 어딘가에서 끝난다. 무한 성장 금지)
3. **신규 진입 가능** — 메타 0(해금 없음) 상태로 런 1을 완주할 수 있다
4. **메타 가치 실측** — 아래 NO_META 봇이 메타를 쓰는 봇보다 확실히 낮은 성과에서 멈춘다

### NO_META 봇 (데일리의 AXIS1_ONLY에 대응)

하네스에 봇을 하나 더 넣는다. 해금을 하나도 쓰지 않고 층1·층2만으로 플레이하는 봇이다.
메타를 쓰는 봇과 누적 런 성과가 **의미 있게 벌어지지 않으면 층3이 장식**이라는 증거다 —
그 상태로 코드를 짜면 "성장해도 달라지는 게 없는" 게임이 된다.

반대로 NO_META 봇이 런 1조차 못 깨면 메타가 필수 관문이 된 것이고, 신규 진입이 막힌다.
두 실패 모두 1일차 게이트에서 잡는다.

### 첫 3런 검사 (6일차)

NOVICE 봇(반응 0.8s)이 **런 1을 완주**하는지, 그리고 실측 `start_rate`(= starts/loads)가 1.0 이상인지 본다.
`start_rate`가 1.0 아래면 로드하고 시작 안 누른 사람이 있다는 뜻 — 도트 공방이 0.72였다.
원인은 대개 시작 화면에 메타 UI·설명이 너무 많아서다 (`design-principles.md` 4장).

### 챌린지 공정성

챌린지 모드는 메타 보너스 0이 **강제**되는지 코드로 확인한다 (`applyMeta()` 분기 한 곳).
그리고 그 조건에서 SKILLED 봇이 클리어 가능한지, NOVICE 봇이 최소 성과라도 내는지 시뮬한다.

## 외부 도구 판정 기록 (2026-09-06, 다시 검토하지 말 것)

- **playwright-mcp**: 채택 안 함. 이 세션은 Playwright를 스크립트로 직접 돌리며(더 빠르고 재현 가능), MCP는 클릭마다 툴콜이라 느리다.
  "사람이 안 봐도 되는 렌더링 체크"라는 목적만 `render-smoke.mjs`로 흡수. 사용자 PC 세션(Claude Code)에서 라이브 URL을
  열어볼 때만 쓸 가치가 있다.
- **impeccable(/impeccable audit)**: 이 계정 스킬 목록에 없음. 핵심(간격·정렬·타깃·대비 정돈)은 G 규칙 + smoke의 G-* 항목으로 흡수.
- **animate / design-motion-principles**: Framer Motion은 React 전용이라 해당 없음. CSS 전환·카운트업·유휴 모션 규칙만 H로 흡수.
- **frontend-design / theme-factory**: 웹 UI·문서용. 캔버스 게임 팔레트는 컨셉이 정하므로 미사용.
- **Supabase pg_cron + pg_net 킵얼라이브 (2026-09-08)**: 채택 — 낮 시간만. infra.md "킵얼라이브" 참고. 24시간은 무료 한도 초과 위험.
- **ZzFX (2026-09-08)**: 선택 패턴으로 채택 (code-patterns.md). 기존 게임 소급 교체는 안 함.
- **design:accessibility-review (2026-09-08)**: 부분 채택 — 캔버스 게임에 의미 있는 4개(aria-label·focus-visible·색 단독 금지·아이콘 라벨)만
  G 규칙에 흡수, 19개 게임에 일괄 패치. 스크린리더 캔버스 설명·시간제한 면제. 전체 WCAG 감사 표는 만들지 않는다.
- **banana-claude(이미지 생성)**: 단일 HTML에 래스터 스프라이트를 넣으면 용량·회전·일관성 손해, A-2(캔버스 프로시저럴 아트)와 충돌. 미사용.
- **game-feel-and-juice 스킬 (2026-09-14 도구 정찰)**: 채택 — 설치 없이 규칙만 흡수. 5패턴 + 수치 가이드를 `art-and-ux.md` H "피드백 티어" 표로 옮기고
  광맥 탐사대에 즉시 적용(치명타 120ms·파괴 60ms·확장 150ms 히트스톱, 스쿼시, 카메라 펀치). 라이선스는 출처 페이지 기준 MIT로 표시됨(정찰 메모의 Apache-2.0과 불일치 — 규칙 흡수라 무관).
  플랫포머용 입력 관용 수치는 방치형엔 해당 없어 미적용.
- **Game UI Database (gameuidatabase.com, 2026-09-14)**: **부분 채택 — PC 세션 전용**. 무료·로그인 없음·55k+ 스크린샷·모바일/캐주얼 필터·이미지 URL 노출까지 확인했다.
  단 검색은 JS라 WebFetch로는 안 되고(카테고리 `index.php?set=1&scrn=<ID>`·게임 `gameData.php?id=<ID>`만 정적), 클라우드 세션은 이미지를 볼 수 없어 **게임 이름·화면 분류 목록**만 얻는다.
  실제 화면 참고는 사용자 PC 세션(Claude in Chrome)에서 카테고리 페이지를 열어 볼 때만 가치가 있다. 디자인 조사 규칙: "상점·업그레이드·결과 화면을 잡을 때 PC 세션이면 해당 카테고리 1페이지를 보고 A~H 체크 전에 참고 2~3개를 적는다". 클라우드 세션 필수 단계로는 넣지 않는다.
