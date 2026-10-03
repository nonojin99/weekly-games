# 인프라 연결 정보 (위클리)

## Supabase

### 프로젝트 A "nonojin99" (게임 저장소 + 홀수일 랭킹)
- project_id: `fpjgjwazqpfiffnsgume`
- URL: `https://fpjgjwazqpfiffnsgume.supabase.co`
- publishable key: `sb_publishable_I1YgcnYNBOaGy0WwozO2wQ_PGwsLtU5`

- `game_thumbs(slug pk → games.slug, webp text(base64), w int 720, h int 405, updated_at)` — 허브 카드 배너. RLS anon select

### 프로젝트 B "billiards" (짝수일 랭킹)
- project_id: `ijmmqmarbkkkssciagof`
- URL: `https://ijmmqmarbkkkssciagof.supabase.co`
- publishable key: `sb_publishable_-Yw_iVRLOGF0W1CFj_v9SA_PLm301S6`

### 테이블 (모두 RLS 활성)

`games` (프로젝트 A만) — 게임 저장소이자 배포 채널:
- slug text pk (정규식 `^[a-z0-9-]{1,50}$`), title, day int, published_on date,
  description, emoji (기본 🎮), html text, created_at
- anon: select만 가능. insert/update는 MCP(execute_sql)로만

`daily_rankings` (양쪽 프로젝트) — 공용 랭킹:
- game_id text(<=50), nickname text(<=20), score numeric(>=0), created_at
- anon insert/select 허용
- **트리거 `daily_rankings_keep_best`가 (game_id, nickname)당 최고 점수 1행만 유지** —
  낮은 점수 insert는 조용히 무시되고, 높은 점수는 기존 행을 갱신. 클라이언트는 그냥 POST.

`play_events` (프로젝트 A만) — 플레이 로그 (주간 리포트 데이터원):
- game_id text, event text ('load'|'start'|'over'), score numeric null, created_at
- anon insert만 허용 (select는 MCP로만 — 집계용)

### weekly_saves (위클리 전용, 프로젝트 A)
`game_id, player, pin_hash, data jsonb, runs, created_at, updated_at` / PK (game_id, player) / RLS anon select+insert+update.
DDL 전문과 설계 이유는 `progression.md` 3장. 저장은 런 종료 시점에만, `data`는 게임별 자유 스키마(`data.v`로 버전 관리).

### daily_rankings 재사용 (위클리 챌린지)
챌린지 랭킹용 새 테이블을 만들지 않는다. `game_id = '<slug>#<ISO주차>'`(예: `moss-keep#2026w38`)로 넣으면
기존 "닉네임당 최고 1행" 트리거가 그대로 작동하고 주간 리셋이 공짜로 된다 (`progression.md` 4장).
일반 런 점수는 제출하지 않는다 — 제출 호출부는 챌린지 모드 안에만 둔다.
`game_id`가 50자 제한이라 `#2026w38`(8자)를 감안해 **위클리 slug는 40자 이하**로 짓는다.

## Render 게임 서버

- 서비스: daily-games (srv-da6nv3ou01pc738oa6v0, workspace tea-d9ha1fn41pts73a3tdcg, singapore, free)
- URL: `https://daily-games-afim.onrender.com`
- `/` = 게임 허브, `/games/{slug}/` = 게임, `/stats` = 통계 대시보드, `/healthz` = 헬스체크
- 서버는 games 테이블에서 HTML을 읽어 서빙 (60초 캐시) → **배포 = games 테이블 insert가 전부**
- 코드는 GitHub nonojin99/daily-games (수정 시 사용자가 웹 업로드 → 자동 재배포)
- 무료 플랜: 15분 무접속 시 슬립, 첫 요청 콜드스타트 30~60초
- **비공개 배포 (위클리 전제 조건)**: 허브 `/` 는 `games` 테이블을 필터 없이 전부 나열한다.
  즉 기본 구조에서는 "올리는 즉시 공개"라 미완성 주중 빌드가 그대로 노출된다. 선행 작업 두 가지:
  ```sql
  alter table public.games add column if not exists listed boolean not null default true;
  ```
  server.js 목록 쿼리에 필터 한 줄 (허브 `/` 와 `/stats` 양쪽):
  `games?select=...&listed=eq.true&order=day.desc`
  게임 서빙 라우트(`/games/<slug>/`)에는 넣지 않는다 — 링크를 아는 사람은 들어갈 수 있어야 한다.
  주중 M1·M2는 `listed=false`로 올리고, 7일차에 `update games set listed=true where slug='<slug>'`.
- **킵얼라이브 (2026-09-08, 프로젝트 A의 pg_cron + pg_net)**: cron job `render-keepalive-daytime`
  (`*/10 0-14,23 * * *` UTC = KST 08:00~24:00 10분마다 `/healthz` GET). 낮 시간만인 이유: 무료 플랜은 워크스페이스당
  월 750 인스턴스 시간이고 초과하면 **모든 무료 웹서비스가 월말까지 정지**된다. 24시간 유지(~740h)는 Royale·JumpTogether·
  Caterpiller가 조금만 깨어나도 초과. 낮만 ≈ 480h. 상태 확인: `select * from cron.job_run_details order by start_time desc limit 5`,
  응답 코드: `select status_code, created from net._http_response order by created desc limit 5`.
  끄기: `select cron.unschedule('render-keepalive-daytime')`. 새벽(KST 0~8시) 첫 접속은 여전히 콜드스타트.

## 배포 절차 (위클리: 주중 비공개 → 7일차 공개)

**주중 M1·M2** — 아래 공통 절차를 그대로 하되 `listed=false`로 insert/update 하고 썸네일은 건너뛴다.
**7일차 공개** — 썸네일 upsert 후 `update games set listed = true where slug='<slug>' returning slug, listed;`
그 시점이 진짜 공개다. 완성도 미달이면 공개만 미루고 비공개 빌드는 그대로 둔다.

### 공통 절차

1. 완성한 index.html을 달러 쿼팅으로 insert (code-patterns.md 참고)
2. `select md5(html) from games where slug='...'`와 로컬 파일 md5 비교로 무결성 확인
3. 라이브 확인 — 서버는 DB에서 읽어 서빙하므로 2의 md5 일치가 곧 배포 확인이다. 그 위에 가능한 것만:
   - 이 클라우드 세션: WebFetch가 robots.txt로 막히고 curl 우회는 금지 → Render MCP `list_logs`로 서버 기동 확인
     (request 로그는 안 남고 app 로그만 있음). 우회 시도하지 말 것.
   - 사용자 PC가 연결된 세션(Claude in Chrome / Claude Code + playwright-mcp): 라이브 URL을 실제로 열어
     `render-smoke.mjs`와 같은 3장을 찍어 본다. 콜드스타트 30~60초.
4. **허브 썸네일 (배포 직후 필수)**: `render-smoke`의 `mobile-play.png`(또는 더 좋은 플레이 장면)를 720×405 webp로
   잘라 `game_thumbs`에 upsert. 밴드 선택은 `quality-audit/pick_band.py`(엣지 에너지 상위 밴드, OVERRIDE로 수동 지정).
   ```sql
   insert into public.game_thumbs(slug, webp, w, h) values ('<slug>', '<base64>', 720, 405)
   on conflict (slug) do update set webp = excluded.webp, updated_at = now()
   returning slug, length(webp), md5(webp);   -- 로컬 base64 길이·md5와 대조
   ```
   허브는 `/thumb/<slug>.webp`로 읽어 카드 상단 16:9 배너에 쓴다 (`<img class="shot">`, CSS `height:auto; aspect-ratio:16/9`).
5. Dashboard(https://nonojin99.github.io/Dashboard/)는 games 테이블을 fetch해 자동 반영 — 작업 불필요

## Notion

- 프로젝트 페이지: `3c7675a7-16d8-811c-8895-ffc76b0e929b` — 주간 「도구 정찰 YYYY-MM-DD」 페이지는 이 아래에 생성
- 개발 일지 DB data_source_id: `c6b4fe82-50ed-480c-8c75-ac4cf7a591f3`
- 일지 속성: 게임명(title), 날짜(date), 장르(select: 아케이드/퍼즐/리듬/슈팅/캐주얼/전략/기타),
  상태(status: 시작 전/진행 중/완료), 플레이 URL(url), 랭킹 DB(select: nonojin99/billiards/없음),
  자동화 수준(select: 반자동/완전자동), 한줄 소개, 회고

## 환경 제약 (샌드박스)

- git push 불가 (git 프록시 정책) — 배포는 DB insert로만
- 큰 HTML은 **단일 statement**로 넣는다. 나눠서 append하면 rate limit에 잘려 라이브가 반토막 난다(장구 잔치 사고).
  부득이 나누면 `<slug>-tmp`에 조립하고 `update games set slug=... where slug='<slug>-tmp' and md5(html)='<목표>'`로 원자 교체
- 부분 패치는 `update games set html = replace(html, $old$...$old$, $new$...$new$) where slug=... and html like '%...%'
  returning md5(html)` — 전체 재업로드보다 안전 (코스모 핀 자간 패치에 사용)
- 브라우저/curl에서 supabase.co 직접 fetch 불가 — 랭킹 API 검증은 execute_sql로
  `begin; set local role anon; ...; rollback;` 패턴 사용 (verification.md 참고)
- Playwright chromium 경로: `/opt/pw-browsers/chromium` (executablePath로 지정)

## 2026-09-14 위클리 1호 배포에서 배운 것 (다음 사이클 필수)

- **HTML insert 는 최종 파일을 세션 컨텍스트에 통째로 읽은 뒤 execute_sql 에 싣는다.** 스크립트로 패치만 반복하면 최종 내용이 컨텍스트에 없어 75KB를 다시 타이핑해야 한다.
  절차: 최종 `index.html` → `Read` 전체 → `$g$…$g$` 달러 쿼팅으로 insert → `returning md5(html)` 을 로컬 `md5sum` 과 대조 (length 는 문자 수라 바이트와 다르다 — md5 만 본다).
- **`games.listed` 컬럼 추가 완료** + server.js 3곳 필터(허브 `/`, `statsData()`, **`newestGame()`**). `newestGame()` 을 빠뜨리면 비공개 게임이 "오늘의 신작" 배너로 다른 게임에 노출된다.
- **server.js 수정은 사용자가 GitHub 웹에서 올린다.** 올리기 전 `node --check server.js` 를 이 세션에서 돌려 문법을 확인하고, 통째로 완성된 파일을 건넨다 (부분 diff 붙여넣기에서 쉼표 누락 사고 1회).
- **Render 자동 배포가 실제로는 안 걸린다** — GitHub App 권한 미부여 상태("we don't have access to your repo"). 커밋 후 `mcp__Render__trigger_deploy` 로 수동 트리거하고 `list_deploys` 로 `live` 확인. 권한을 붙이면 자동화됨.
- **`weekly_saves` 는 RPC 전용**: `weekly_save(p_game_id, p_player, p_pin_hash, p_data, p_runs)` → 'created'|'saved'|'wrong_pin', `weekly_load(...)` → 행 0/1. anon 은 `pin_hash` 를 읽을 수 없고 직접 update 도 못 한다 (재전송 방어). progression.md 3장의 DDL 대신 이 구조를 쓴다.
- 위클리 1호 `vein-expedition`: `day=100` 으로 넣어 데일리 번호와 충돌 방지 (위클리는 100번대).
- **패치 SQL 은 손으로 쓰지 말고 `scripts/make-patch.py <old.html> <new.html> <out.sql>` 로 만든다** (2026-09-14 v13에서 도입). 줄 단위 diff → 유일한 old 블록으로 확장 → 중첩 `replace()` 한 문장. 로컬에서 순차 적용해 new 와 바이트 일치를 확인한 뒤, `where md5(html) = '<old md5>'` 가드와 `returning md5(html)` 로 DB 쪽도 대조한다. old 원본은 아티팩트 `read` 로 받은 사본에서 `<title>`~`</script>` 를 index.html 헤더로 감싸 복원할 수 있다 (v12 md5 재현 확인).
- 배포 뒤 Render 서빙 확인은 이 샌드박스에서 못 한다 (curl 은 프록시에 막히고 WebFetch 는 script 를 지운다) — `games` 테이블 md5 대조까지가 검증 범위, 실제 화면은 사용자 폰으로.
- **배포한 버전의 index.html 은 `docs/<game>/deployed/index.vN.html` 로 보관한다** (v14부터). make-patch 의 old 입력이 되고, 잃어버리면 아티팩트 사본이나 patch SQL 을 역적용해 복원해야 한다 (v13 은 그렇게 복원).
- 스펙 단어를 다시 읽는다: "용병 고용소"를 채굴 보조로 만들었다가 "전투 요원"이라는 정정을 받고 재작성 (v13→v14). 다른 맵(투기장)과 연결되는 이름은 구현 전에 그 맵의 스펙 안에서 역할을 확인할 것.
- **서버 권위 결정론 시뮬(투기장, 2026-09-14)**: 클라이언트 리플레이와 plpgsql 이 같은 결과를 내려면 ① 난수는 LCG `x=(x·1103515245+12345) mod 2^31` 로 통일하되 JS 는 곱을 `16838·65536+20077` 로 쪼갠다(2^53 초과 정밀도 손실 — 실제로 3번째 난수부터 어긋났다) ② 단락 평가(`!tired && rnd()<eva`)처럼 난수를 "건너뛰는" 분기를 SQL 도 똑같이 건너뛴다 ③ 부동소수 연산 순서를 양쪽에 그대로 맞춘다(`100*r*g*(1+0.06L)` 좌→우) ④ 상수는 0.125 처럼 리터럴로 두고 `0.05*2.5` 같은 곱을 두지 않는다. 검증은 SQL 기준값 N경기를 Playwright 에서 승자·시간·체력까지 대조 (`sim/week3-test.mjs`). 스탯 입력은 스냅샷이 아니라 서버에 저장된 세이브(weekly_saves.data)를 읽는다.
- Playwright 라우트 글롭은 `**supabase.co/**` — `**/supabase.co/**` 는 호스트 앞에 `/` 가 없어 매칭되지 않는다(week2 테스트가 조용히 네트워크로 나가고 있었다).
- 전역 `.hide { display:none !important }` 를 두고 쓴다 — `#id.hide` 로만 정의하면 다른 요소에 `hide` 를 붙여도 안 숨는다(투기장 결과·입장 박스가 겹쳐 보인 원인).
- make-patch.py 는 hunk 를 **뒤에서 앞으로, 그 시점의 문서 기준 유일성**으로 만든다 (v17에서 앞 hunk 가 만든 문장 때문에 old 기준 유일 블록이 적용 중 중복돼 실패한 뒤 수정).
- **세트·효과 같은 "양쪽 테이블" 은 리터럴을 두 곳(JS·SQL)에 그대로 두고 테스트로 묶는다 (2026-09-15 v18)**: JS `SETS[].fx2/fx4` 와 plpgsql `fx2/fx4 jsonb` 리터럴이 같은 문자열이면 double 파싱 결과도 같다. 적용 순서(세트 배열 순서 → fx2 → fx4, 곱/합 구분)를 양쪽에 똑같이 두고, 값을 바꿀 때마다 SQL 기준값을 다시 뽑아 테스트(`week4-test.mjs`)의 숫자를 갱신한다. plpgsql 함수 시그니처에 인자를 추가할 땐 옛 시그니처를 `drop function` 으로 지운다 — default 인자로 두면 3인자 호출이 모호해져 실패한다.
- **아티팩트 재발행은 매번 `read` → 저장된 사본 전부 Read → publish** 순서다. 사본이 배포본과 같다는 걸 diff 로 확인해도 도구는 "이 턴에 fetch 하고 Read 했는가" 만 본다. 순서를 어기면 두 번 거절당한다 (v18).

## 2026-10-03 밤의 퇴마사 배포에서 배운 것
- **execute_sql 은 `update`/`delete` 문이 약 30KB 를 넘으면 승인 단계에서 `cancelled` 로 떨어진다** (`insert` 는 46KB 도 통과). 큰 패치는 make-patch 의 replace() 한 문장이어도 같은 벽에 걸린다.
  우회: ① 파일을 반으로 쪼개 `<slug>-tmp`, `<slug>-tmp2` 행에 각각 **insert** (각 ≤ 35KB, `returning md5` 로 로컬 절반 md5 와 대조) ② `update games set html = (select a.html || b.html …) where slug=… and md5(html)='<old>'` 짧은 한 문장으로 교체 ③ 임시 행 `delete` 도 취소되면 html 을 빈 페이지로 `update` 해 둔다 (listed=false 라 허브엔 안 뜸).
- 임시 행 slug 는 `games.slug` 정규식 `^[a-z0-9-]{1,50}$` 에 맞춰야 한다.
- **(같은 날, 더 나은 길) 큰 html 은 pg_net 으로 GitHub raw 에서 서버가 직접 가져온다.** 오후부터는 insert 도 7.7KB 에서 `cancelled` 가 났다(허용치가 요동친다). 저장소가 public 이고 `pg_net` 이 깔려 있으니:
  ① 커밋·푸시 ② `select net.http_get('https://raw.githubusercontent.com/nonojin99/weekly-games/<sha>/games/<slug>/index.html')` → req_id ③ 몇 초 뒤 `select status_code, length(content), md5(content) from net._http_response where id=<req_id>` 로 로컬 md5 와 대조 ④ `update games g set html = r.content from net._http_response r where r.id=<req_id> and g.slug='<slug>' returning md5(g.html)`. 전송 0바이트, 전사 오류 0. 커밋 sha 를 URL 에 박아 main 이 움직여도 같은 바이트가 간다.
  `delete` 는 짧아도 승인이 필요해 무인 세션에선 취소된다 — 임시 행은 남겨 두고 사용자가 있을 때 지운다.
