# 광맥 탐사대 — Godot 이식 준비서

원본: `games/vein-expedition/index.html` (v29, 1,514줄 단일 파일 · HTML5 Canvas 2D)
대상: Godot 4 (권장 4.6) · 모바일 세로 고정

이 문서는 **이식 작업 자체가 아니라 전환 준비**다. 실제 이식은 Godot 이 설치된
로컬 머신에서 Godot MCP 를 붙인 뒤 시작한다.

---

## 0. 먼저 — 소스 버전 차이 (이식 전 반드시 해결)

| 위치 | 버전 | 구조 |
|---|---|---|
| 이 리포지토리 `index.html` | **v19** | 루트 flat (`index.html`, `design.md`, ... 23개 파일) |
| 업로드된 작업 트리 zip | **v29** | `games/vein-expedition/`, `docs/01-ore/`, `skill/` |

리포지토리가 10 버전 뒤처져 있고 디렉터리 구조도 다르다.
**리포지토리를 fresh clone 해서 이식을 시작하면 v19 를 이식하게 된다.**
로컬 전환 시 둘 중 하나를 먼저 할 것:

- (권장) 로컬 작업 트리(v29)를 그대로 쓰고, 리포지토리 동기화는 이식과 분리해서 처리
- 또는 v29 작업 트리를 리포지토리에 먼저 커밋해 구조를 맞춘 뒤 이식 시작

아래 줄 번호는 전부 **v29** (`games/vein-expedition/index.html`) 기준이다.

---

## 1. Godot MCP 설치 (로컬에서)

리포지토리 루트에 `.mcp.json` 을 이미 넣어 뒀다 — Claude Code 가 프로젝트를 열 때 자동으로 읽는다.

```json
{ "mcpServers": { "godot": { "command": "npx", "args": ["-y", "@coding-solo/godot-mcp"] } } }
```

사전 조건:
1. **Godot 4** 설치 (godotengine.org) — 4.6 권장
2. **Node.js 18+**
3. 자동 탐지가 실패하면 `.mcp.json` 의 서버에 `"env": { "GODOT_PATH": "/절대/경로/godot" }` 추가

`claude` 를 리포지토리 루트에서 새로 실행하면 프로젝트 스코프 MCP 서버 승인 프롬프트가 뜬다.
승인 후 `/mcp` 로 `godot` 이 connected 인지 확인.

### 서버 선택지

| 서버 | 설치 | 강점 | 약점 |
|---|---|---|---|
| **Coding-Solo/godot-mcp** (기본값) | `npx`, 클론 불필요 | 에디터 실행·프로젝트 실행·디버그 출력 캡처·씬/노드 생성 | 실행 중 게임 화면 조작 불가 |
| slangwald/godot-mcp | 클론 + `uv`, Godot **4.6 필수** | 씬 트리 조회/수정, `screenshot`, `click`, 런타임 트리 — 이식 검증에 강함 | 설치 무겁고 4.6 고정 |

방치형 게임은 **눈으로 확인할 게 많다**(쿼터뷰 정렬, 페이퍼돌 레이어, 상점 레이아웃).
`screenshot`/`click` 이 반복 검증을 크게 줄이므로, Godot 4.6 을 쓸 수 있다면 slangwald 쪽을
추가로 붙이는 편이 이식 속도에 유리하다. 둘은 공존 가능하다.

---

## 2. 스캐폴드 현황

```
godot/
  project.godot     # 390x844 세로 고정, canvas_items/expand, nearest 필터, mobile 렌더러
  main.tscn         # 빈 Node2D + 라벨
  scripts/main.gd   # print 한 줄 — 실행되는지만 확인하는 용도
  .gitignore        # .godot/ 캐시 제외
```

Godot 에디터로 한 번도 열지 않은 손수 작성 파일이다. 처음 열면 에디터가 `.godot/` 과
`uid://` 를 생성한다 — 정상이다.

**전환 직후 첫 확인**: `godot --path godot --headless --quit` → `scaffold ok — godot 4.x` 출력.

`project.godot` 의 값은 원본에서 그대로 가져왔다:
- `390x844` ← `index.html:517` (`let W = 390, H = 844`)
- 세로 고정 ← 원본은 `user-scalable=no` 세로 전용 모바일 게임
- `expand` ← 원본 `resize()`(`index.html:519`)가 화면이 넓어지면 더 보여주는 방식이라 letterbox 가 아니다
- nearest 필터 ← 16x24 픽셀 페이퍼돌(`index.html:1222`)

---

## 3. 원본 시스템 인벤토리 (v29 기준)

| 영역 | 줄 | 규모 | 성격 |
|---|---|---|---|
| CSS | 1–164 | 164 | **전량 폐기** → Godot Control 테마로 재작성 |
| HTML body (패널 12종) | 165–303 | 139 | **전량 폐기** → `.tscn` 으로 재작성 |
| 광석·경제 데이터 | 306–377 | 72 | 순수 데이터/수식 → GDScript 이관 쉬움 |
| 강화소·용병·방어구 세트·무기/장화 | 378–503 | 126 | 순수 데이터 테이블 |
| 상태 `S` | 504–514 | 11 | 단일 전역 딕셔너리 → autoload 후보 |
| 쿼터뷰 레이아웃 (`iso`, `fitIso`) | 515–535 | 21 | 수식 이관 or Godot 좌표계로 대체 |
| 오디오 (WebAudio 절차 생성) | 536–552 | 17 | **재설계 필요** (§5) |
| 동굴 바닥·노드·엔티티 | 553–671 | 119 | 로직 이관 + 렌더링 재작성 |
| 대장간·용병소·장비점·제작 | 672–800 | 129 | 로직 이관 |
| 세이브 / 환생 / 주간 챌린지 | 801–925 | 125 | 로직 이관 + HTTP 재배선 |
| 투기장 (서버 시드 리플레이) | 926–1030 | 105 | 로직 이관 + HTTP 재배선 |
| 대장간·인벤토리·경매장 화면 | 1031–1127 | 97 | UI 재작성 |
| 상점 DOM 렌더링 | 1128–1212 | 85 | **전량 재작성** → `ItemList`/`VBoxContainer` |
| 픽셀 페이퍼돌 (16x24, 슬롯 레이어 + 절차적 무기) | 1222–1370 | 149 | **이식 난이도 최상** (§5) |
| 쿼터뷰 광석·동굴 렌더링 | 1371–1451 | 81 | 재작성 |
| 메인 루프 | 1452–1494 | 43 | `_process` 로 직역 가능 |
| 입력·부팅 | 1495–1514 | 20 | 재작성 |

거칠게: **데이터/수식 ~40%는 거의 직역**, **UI/렌더링 ~60%는 재작성**이다.

---

## 4. 매핑

| 원본 | Godot |
|---|---|
| `<canvas id="cv">` + `ctx.*` 직접 그리기 | `Node2D` + `_draw()` (또는 스프라이트 노드) |
| DOM 패널 12종 (`#menu` `#shop` `#forge` `#inven` `#arena` `#auction` `#pick` `#offline` `#over` `#village` `#codex` `#replay`) | `CanvasLayer` 하위 `Control` 씬 12개, `visible` 토글 |
| CSS `env(safe-area-inset-*)` | `DisplayServer.get_display_safe_area()` |
| `#shop` 의 `@media (min-width:760px)` 사이드바 전환 | `Container` 분기 + `get_viewport_rect()` 폭 판정 (원본 `WIDE()` = `index.html:518`) |
| `requestAnimationFrame(frame)` | `_process(delta)` |
| 히트스톱 `S.stop` (`index.html:1457`) | 동일 로직 유지 — `_process` 안에서 `dt` 를 0 으로 |
| `performance.now()` 기반 오프라인 정산 | `Time.get_unix_time_from_system()` |
| `fetch()` → Supabase PostgREST | `HTTPRequest` 노드 + `JSON.parse_string()` |
| WebAudio `OscillatorNode` | §5 참조 |
| `matchMedia('(prefers-reduced-motion)')` | 게임 내 설정 토글로 대체 (Godot 에 대응 API 없음) |

### 서버 레이어 — 좋은 소식

`index.html:495` 의 Supabase 는 **publishable key 로 PostgREST 를 직접 호출**한다.
WebSocket·Realtime·SDK 의존이 전혀 없다:

- `rpc/weekly_save`, `rpc/weekly_load` (`:809`, `:824`) — 세이브
- `daily_rankings` GET/POST/HEAD (`:903`, `:911`, `:913`) — 주간 챌린지 랭킹
- `play_events` POST (`:500`) — 이벤트 로깅
- 범용 `rpc(name, body)` (`:949`) — 투기장 `arena_enter`, 경매장 `auction_*`

전부 `HTTPRequest` + JSON 으로 1:1 대응된다. **서버·SQL 은 손댈 필요가 없다.**
단, 클라이언트 키가 소스에 하드코딩돼 있는 점은 Godot 빌드에서도 동일하게 노출된다 —
현재 publishable key 이므로 설계상 의도된 것이지만, 이식 시 RLS 가 그대로 유효한지는 확인할 것.

---

## 5. 미리 정해야 할 것 (이식 시작 전 결정)

### (a) 페이퍼돌 — 가장 큰 결정
`index.html:1222–1370`, 149줄. 16x24 픽셀 캐릭터를 **런타임에 절차적으로 그린다** —
몸통 + 슬롯별 파츠 레이어 + 무기는 티어/종류에 따라 코드로 생성.

- **A안: 직역** — `Image` + `set_pixel()` → `ImageTexture`. 원본과 픽셀 단위로 동일. 느리므로 캐싱 필수
- **B안: 스프라이트 시트 사전 생성** — 조합을 미리 구워 `AtlasTexture`. 빠르지만 조합 폭발
- **C안: 노드 레이어** — 파츠를 `Sprite2D` 로 쌓기. Godot 답지만 절차적 무기 생성과 안 맞음

원본이 "장비 조합 = 무한"에 가깝기 때문에 **A안 + LRU 캐시**가 현실적으로 보인다.
다만 이건 실측이 필요한 판단이라 이식 초반에 프로토타입으로 재보는 것을 권한다.

### (b) 오디오
`index.html:536–552`. 오실레이터 9종을 코드로 합성 (`tone`, `noise`).
Godot 에 대응물이 없다. 둘 중 하나:
- `AudioStreamGenerator` 로 동일하게 실시간 합성 (원본 재현도 ↑, 코드량 ↑)
- 9개 사운드를 **미리 `.wav` 로 렌더링**해서 `AudioStreamPlayer` 로 재생 (단순·권장)

### (c) 쿼터뷰
`index.html:515–535`, `:1371–1451`. 아이소메트릭 좌표를 직접 계산한다 (`tw:48, th:24`, 비율 0.62).
Godot 의 `TileMapLayer` 아이소메트릭 모드로 갈지, `_draw()` 로 원본 수식을 직역할지 결정.
원본이 타일맵이 아니라 **매 프레임 절차적으로 바닥·뒷벽·광석을 그리는** 구조라
`_draw()` 직역이 초기에는 더 안전하다.

### (d) 이식 범위
v29 는 Week 1–6 증축분이 전부 들어 있다. 한 번에 다 옮기는 것은 권하지 않는다. §6 참조.

---

## 6. 권장 이식 순서

각 단계는 **실행되고 눈으로 확인 가능한 상태**로 끝난다.

1. **스캐폴드 검증** — 프로젝트가 열리고 빈 씬이 뜬다 → `screenshot` 으로 확인
2. **쿼터뷰 동굴 + 광석 1개** (`:553–596`, `:1371–1451`) — 탭하면 깨진다. 렌더링 방식 확정
3. **경제 코어** (`:306–377`, `:504–514`, `:1452–1494`) — 상태·티어·루프. UI 는 임시 라벨
4. **상점 UI** (`:1128–1212`) — DOM → Control 재작성. 가장 지루하고 가장 큰 덩어리
5. **페이퍼돌** (`:1222–1370`) — §5(a) 결정대로
6. **세이브 + 오프라인 정산** (`:801–864`) — `HTTPRequest` 배선
7. **환생·도감·마을** (`:865–884`)
8. **장비 계열** (`:378–503`, `:672–800`, `:1031–1065`)
9. **서버 의존 화면** — 투기장 (`:926–1030`), 경매장 (`:1066–1127`)
10. **주간 챌린지** (`:885–925`)

1–3 이 끝나면 "이식이 되는 물건인가"에 대한 답이 나온다. 그 전에 4 이후를 건드리지 말 것.

---

## 7. 이식하지 않는 것

- `docs/01-ore/sim/*.mjs` — 밸런스 시뮬레이터. Node 로 계속 돌리면 된다
- `docs/01-ore/*.sql` — 서버 스키마. 변경 불필요 (§4)
- `docs/01-ore/server/server.js` — HTML 서빙 전용. Godot 빌드는 이 경로를 타지 않는다
- `skill/weekly-game-dev/` — 워크플로 문서. 다만 배포 절차는 Godot export 로 바뀌므로
  이식이 실제로 끝난 뒤에 갱신 대상이 된다 (지금은 손대지 않음)

배포 형태(웹 export 로 기존 Supabase games 테이블에 계속 올릴지, 모바일 네이티브로 갈지)는
이식 완료 후의 별개 결정이다.
