# 성장·세이브·공정성 (위클리 전용 · 구현 전 필독) — 2026-09-13 방치형 개정

## 1. 메타 설계 — 무한성장을 어떻게 구조화하나

"상한 없는 성장"은 허용하되 **형태 없는 성장은 금지**한다. 인크리멘탈의 검증된 뼈대를 그대로 쓴다.

| 요소 | 규칙 | 이유 |
|---|---|---|
| 생산 티어 | 6~8개, 티어마다 비용 ×10 · 생산 ×7 안팎 | 상위 티어가 항상 "다음 목표"로 보인다 |
| 구매 비용 | `c = c0 · g^n`, g = 1.10~1.15 | 지수 비용이 정체를 만들고, 정체가 환생을 부른다 |
| 마일스톤 | 티어 10/25/50개마다 생산 ×2 | 구매에 목표점이 생긴다 |
| 활성 조작 | 탭·타이밍 = 초반 가속 + 짧은 버프. 벌칙 없음 | 방치만으로도 진행돼야 한다. 활성은 "더 빨리"지 "해야만"이 아니다 |
| 환생 | 누적 ≥ T 에서 리셋, 영구 배율 `1 + 0.1·gems`, `gems = ⌊(누적/T)^0.5⌋` | 정체를 푸는 유일한 정공법. 첫 환생 15~30분 |
| 누적 화면 | 도감·마을처럼 **보이는** 것 하나 필수 | 배율 숫자는 서사가 아니다 |
| 오프라인 | 50%~100%, 8~12시간 상한 | 복귀 보상이 재방문 이유 |

해금 하나마다 "이게 있으면 무엇이 달라지는가"를 한 줄로 적을 수 없으면 뺀다 (배율 +10%만 있는 항목은 마일스톤으로 흡수).

## 2. 경제 곡선 불변식

탐욕 봇(매초 ROI = 비용/증가생산 이 최소인 항목을 살 수 있으면 산다)이 60분 활성 플레이할 때:

1. **대기 밴드** — 연속 구매 간 대기가 **5s ≤ wait ≤ 300s**. 300s 초과가 2회 이상이면 그 구간의 티어 비용을 낮춘다
2. **벽 없음** — 60분 내 어느 5분 구간에서도 구매 0회가 없다
3. **환생 시점** — 활성 봇 15~30분, 방치(NO_TAP) 봇 20~40분에 첫 환생 가능
4. **활성 가치** — 활성 봇 / NO_TAP 봇의 첫 티어 개방 시각 비율 ≥ 2, 60분 누적 비율 ≥ 1.3 (정타 버프 포함)
5. **환생 가속** — 2회차 환생까지의 시간이 1회차보다 짧다 (영구 배율이 실제로 체감되는가)

시뮬 템플릿: `docs/01-ore/sim/idle-sim.mjs` (1호에서 통과). 티어 표·g·환생 T만 게임 것으로 바꾼다.
**코드를 짜기 전에 통과시킨다.**

## 3. 플레이어 식별과 세이브

**순서가 중요하다.** 시작 화면에서 가입을 요구하면 첫 구매 전에 사람을 잃는다.

1. 익명으로 시작. 진행도는 `localStorage`에만
2. 첫 의미 있는 선택(첫 카드 3택1, 또는 3분 경과) 직후 "기록을 남길까요?" — 닉네임(≤12자) + PIN 4자리
3. 등록 시 로컬 진행도를 서버로 **승격**(upsert). 이후 **30초 간격 + `visibilitychange` + 구매 직후** 저장
4. 다른 기기에서는 같은 닉네임+PIN으로 불러온다. 충돌 시 `totalMined`가 큰 쪽이 이긴다
5. 오프라인 정산은 서버 `updated_at`이 아니라 세이브 안의 `lastSeen`(클라이언트 epoch)으로 계산 — 서버 시계 의존 금지

PIN은 평문으로 보내지 않는다 — `SHA-256(pin + ':' + slug)`. 개인 프로젝트 수준의 보호이며 그 이상은 만들지 않는다.
단 update 정책에 `pin_hash = 기존값` 조건은 넣는다 (비용 0으로 남의 세이브 덮어쓰기 차단).

```sql
create table if not exists public.weekly_saves (
  game_id   text not null,
  player    text not null,
  pin_hash  text not null,
  data      jsonb not null default '{}'::jsonb,
  runs      integer not null default 0,          -- 방치형에서는 환생 횟수로 쓴다
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (game_id, player)
);
alter table public.weekly_saves enable row level security;
create policy weekly_saves_anon_select on public.weekly_saves for select to anon using (true);
create policy weekly_saves_anon_insert on public.weekly_saves for insert to anon with check (true);
create policy weekly_saves_anon_update on public.weekly_saves for update to anon
  using (true) with check (pin_hash = (select w.pin_hash from public.weekly_saves w where w.game_id = weekly_saves.game_id and w.player = weekly_saves.player));
```

`data`는 게임별 자유 스키마, `data.v`로 버전 관리. 큰 수는 1e308을 넘기 전에 `{m, e}` 표기로 바꾸거나 환생으로 리셋되게 설계한다.

## 4. 주간 챌린지 — 제한시간 모드

```js
function isoWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const w = Math.ceil(((t - y0) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}w${String(w).padStart(2, '0')}`;
}
const CHALLENGE_ID = GAME_ID + '#' + isoWeek();
const CHALLENGE_SEED = hashStr(CHALLENGE_ID);
```

- 챌린지는 **새 세이브 상태**(영구 배율 0·카드 풀 기본·티어 초기값)로 시작하고 **N분(3~5분) 제한**. 점수 = 제한 안 채굴 가치
- 무한 트랙 세이브는 건드리지 않는다 — 챌린지 상태는 메모리에만
- 시드는 카드 순서·이벤트 순서에만 쓴다 (경제 상수는 동일)
- `applyMeta()` 한 곳에서 분기. `daily_rankings` 재사용, slug 40자 이하
- 일반 플레이 점수는 절대 제출하지 않는다

## 5. 누적 데이터를 밸런싱에 쓰는 법 (6일차)

```sql
-- 환생 분포: 사람들이 몇 번째 환생에서 멈추는가 (runs = 환생 횟수)
select runs, count(*) from weekly_saves where game_id = '<slug>' group by runs order by runs;

-- 첫 환생 도달률
select count(*) filter (where runs >= 1)::numeric / nullif(count(*),0) from weekly_saves where game_id = '<slug>';

-- 재방문: 서로 다른 날에 저장한 플레이어 비율
select count(*) filter (where updated_at::date > created_at::date)::numeric / nullif(count(*),0)
from weekly_saves where game_id = '<slug>';

-- 첫 화면 이탈
select count(*) filter (where event='start')::numeric / nullif(count(*) filter (where event='load'),0) as start_rate
from play_events where game_id = '<slug>';
```

첫 환생 도달률이 0.3 아래면 환생 T를 낮추거나 초반 티어를 싸게 한다. `start_rate` < 1.0이면 첫 화면이 벽이다.
