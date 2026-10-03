// 머지 정원 — 탐욕 봇 경제 시뮬 (progression.md 2장 불변식 5개)
// node idle-sim.mjs            → ACTIVE / NO_TAP 두 봇 60분 + 환생 2회차까지
// 수정할 것: 아래 CONST 블록만. 로직은 게임 index.html 과 같은 규칙을 따른다.

const CONST = {
  GRID0: 12,            // 시작 칸
  GRID_MAX: 30,
  GRID_C0: 60, GRID_G: 1.8,     // 칸 확장 비용 c = c0·g^k
  DROP_P0: 6,           // 자동 씨앗 주기(초)
  WATER_C0: 12, WATER_G: 1.3, WATER_MUL: 0.92, WATER_MAX: 20,  // 물뿌리개: 주기 ×0.92, 최대 20단
  SEED_TIER_C: [0, 600, 6000, 60000, 6e5],      // 씨앗 등급 n→n+1 비용 (×10)
  TAP_CD: 2,            // 탭 쿨다운(초) — 활성 조작 = 즉시 씨앗 1개
  GOLD0: 0.05, GOLD_MUL: 3.3,    // 티어 L 식물 초당 금화 = GOLD0·MUL^(L-1)
  MERGE_N: 3,
  PRESTIGE_T: 400000,     // 누적 금화 ≥ T 에서 환생 가능, 이슬 = ⌊√(누적/T)⌋
  PRESTIGE_BONUS: 0.2,  // 영구 배율 1 + 0.1·이슬
  SELL_RATIO: 0.0,      // 판매는 1일차 시뮬에서 제외
};

for (const k in CONST) if (process.env[k] != null) CONST[k] = +process.env[k];
const gold = L => CONST.GOLD0 * Math.pow(CONST.GOLD_MUL, L - 1);

function newState(dew = 0) {
  return {
    t: 0, grid: CONST.GRID0, water: 0, seedTier: 1,
    cells: Object.create(null), // tier → count
    used: 0, g: 0, cum: 0, dew, dropAcc: 0, tapAcc: 0,
    buys: [], tierAt: {}, maxTier: 0,
  };
}
const clone = s => ({ ...s, cells: { ...s.cells }, buys: s.buys.slice(), tierAt: { ...s.tierAt } });

function period(s) { return CONST.DROP_P0 * Math.pow(CONST.WATER_MUL, s.water); }
function mult(s) { return 1 + CONST.PRESTIGE_BONUS * s.dew; }
function prod(s) { let p = 0; for (const L in s.cells) p += s.cells[L] * gold(+L); return p * mult(s); }

function addSeed(s, L) {
  if (s.used >= s.grid) return false;
  s.cells[L] = (s.cells[L] || 0) + 1; s.used++;
  if (!s.tierAt[L]) s.tierAt[L] = s.t;
  s.maxTier = Math.max(s.maxTier, L);
  return true;
}
function mergeAll(s) {
  let did = true;
  while (did) {
    did = false;
    for (const k in s.cells) {
      const L = +k;
      if (s.cells[L] >= CONST.MERGE_N) {
        s.cells[L] -= CONST.MERGE_N; s.used -= CONST.MERGE_N;
        if (!s.cells[L]) delete s.cells[L];
        addSeed(s, L + 1); did = true;
      }
    }
  }
}
function tick(s, tap) {
  s.t++;
  s.dropAcc += mult(s) / period(s);   // 이슬: 씨앗 속도에도 적용
  while (s.dropAcc >= 1) { s.dropAcc -= 1; addSeed(s, s.seedTier); }
  if (tap) { s.tapAcc += 1 / CONST.TAP_CD; while (s.tapAcc >= 1) { s.tapAcc -= 1; addSeed(s, s.seedTier); } }
  mergeAll(s);
  const p = prod(s); s.g += p; s.cum += p;
}

// 구매 옵션: [이름, 비용, 적용]
function options(s) {
  const o = [];
  if (s.grid < CONST.GRID_MAX) o.push(['grid', CONST.GRID_C0 * Math.pow(CONST.GRID_G, s.grid - CONST.GRID0), x => { x.grid++; }]);
  if (s.water < CONST.WATER_MAX) o.push(['water', CONST.WATER_C0 * Math.pow(CONST.WATER_G, s.water), x => { x.water++; }]);
  const stc = CONST.SEED_TIER_C[s.seedTier];
  if (stc) o.push(['seed', stc, x => { x.seedTier++; }]);
  return o;
}
// 탐욕: 120초 룩어헤드로 (추가 이득 / 비용) 최대 옵션. 살 수 있으면 산다
function greedyBuy(s, tap) {
  for (;;) {
    const opts = options(s).filter(o => o[1] <= s.g);
    if (!opts.length) return;
    const base = look(s, tap, null);
    let best = null, bestR = 0;
    for (const o of opts) {
      const r = (look(s, tap, o[2]) - base) / o[1];
      if (r > bestR) { bestR = r; best = o; }
    }
    if (!best) return;
    s.g -= best[1]; best[2](s); s.buys.push([s.t, best[0], Math.round(best[1])]);
  }
}
function look(s, tap, apply) {
  const x = clone(s); if (apply) apply(x);
  const g0 = x.cum; for (let i = 0; i < 120; i++) tick(x, tap);
  return x.cum - g0;
}

function run(tap, minutes = 60, label) {
  let s = newState(0);
  const prestigeAt = [];
  const log = [];
  while (s.t < minutes * 60) {
    tick(s, tap);
    greedyBuy(s, tap);
    // 환생: 가능해지면 즉시 (이슬 ≥ 1). 2회차는 이슬이 1 이상 늘어날 때
    const dewNow = Math.floor(Math.sqrt(s.cum / CONST.PRESTIGE_T));
    if (dewNow >= 1) {
      {
        prestigeAt.push(s.t);
        const ns = newState(s.dew + dewNow); ns.t = s.t; ns.buys = s.buys; ns.cum = 0; ns.tierAt = s.tierAt; // tierAt: 첫 도달 시각 유지
        ns.cumAll = (s.cumAll || 0) + s.cum; ns.firstTierAt = s.firstTierAt;
        s = ns;
        if (prestigeAt.length >= 2) {}
      }
    }
  }
  const cumAll = (s.cumAll || 0) + s.cum;
  return { s, prestigeAt, cumAll, buys: s.buys, tierAt: s.tierAt };
}

function check(active, notap) {
  const res = [];
  // 1. 대기 밴드 (활성 봇, 첫 환생 전까지 + 전체)
  const waits = []; let over300 = 0, under5 = 0;
  for (let i = 1; i < active.buys.length; i++) {
    const w = active.buys[i][0] - active.buys[i - 1][0];
    if (w === 0) continue; // 같은 초 묶음 구매는 1회로
    waits.push(w); if (w > 300) over300++; if (w < 5) under5++;
  }
  res.push(['대기 밴드 5~300s', over300 < 2, `>300s ${over300}회, <5s ${under5}회, 중앙값 ${median(waits)}s, 최대 ${Math.max(...waits)}s`]);
  // 2. 벽 없음: 60분 내 5분 구간 구매 0회
  const bins = new Array(12).fill(0); for (const b of active.buys) bins[Math.min(11, Math.floor(b[0] / 300))]++;
  res.push(['벽 없음 (5분 구간 구매 0회 없음)', bins.every(b => b > 0), bins.join(' ')]);
  // 3. 환생 시점
  const pA = active.prestigeAt[0], pN = notap.prestigeAt[0];
  res.push(['첫 환생 활성 15~30분', pA && pA >= 900 && pA <= 1800, `${fmt(pA)}`]);
  res.push(['첫 환생 방치 20~40분', pN && pN >= 1200 && pN <= 2400, `${fmt(pN)}`]);
  // 4. 활성 가치: 티어4 첫 도달 시각 비율 ≥ 2, 60분 누적 ≥ 1.3
  const tA = active.tierAt[4], tN = notap.tierAt[4];
  res.push(['활성 가치: 티어4 도달 비율 ≥ 2', tN / tA >= 2, `${fmt(tA)} vs ${fmt(tN)} = ×${(tN / tA).toFixed(2)}`]);
  res.push(['활성 가치: 60분 누적 ≥ 1.3', active.cumAll / notap.cumAll >= 1.3, `${Math.round(active.cumAll)} vs ${Math.round(notap.cumAll)} = ×${(active.cumAll / notap.cumAll).toFixed(2)}`]);
  // 5. 환생 가속
  const p2 = active.prestigeAt[1];
  res.push(['환생 가속 (2회차 < 1회차)', p2 && (p2 - pA) < pA, `1회차 ${fmt(pA)}, 2회차 +${fmt(p2 ? p2 - pA : NaN)}`]);
  return res;
}
const fmt = t => isFinite(t) && t != null ? `${Math.floor(t / 60)}m${String(t % 60).padStart(2, '0')}s` : '없음';
const median = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : NaN; };

const A = run(true, 60, 'ACTIVE'), N = run(false, 60, 'NO_TAP');
console.log('ACTIVE 구매', A.buys.length, '회 | 최고 티어', A.s.maxTier, '| 환생', A.prestigeAt.map(fmt).join(', '));
console.log('NO_TAP 구매', N.buys.length, '회 | 최고 티어', N.s.maxTier, '| 환생', N.prestigeAt.map(fmt).join(', '));
console.log('ACTIVE 티어 첫 도달:', Object.entries(A.tierAt).map(([L, t]) => `T${L}@${fmt(t)}`).join(' '));
console.log('ACTIVE 구매 로그(처음 25):', A.buys.slice(0, 25).map(b => `${fmt(b[0])}:${b[1]}(${b[2]})`).join(' '));
let pass = true;
for (const [name, ok, detail] of check(A, N)) { pass = pass && !!ok; console.log(ok ? 'PASS' : 'FAIL', name, '—', detail); }
console.log(pass ? '\n게이트 A 통과' : '\n게이트 A 실패');
process.exit(pass ? 0 : 1);
