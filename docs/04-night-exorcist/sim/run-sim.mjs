// 밤의 퇴마사 — 런 시뮬 + 성장 곡선 검증 (1일차 게이트 A)
// node run-sim.mjs
// 모델: 1초 틱. 적은 s(t)/초로 스폰, 체력 h(t). 플레이어 DPS D 로 처치 → XP → 레벨업(3택1 평균 효과) → D 증가.
// 살아있는 적 E 가 접촉 피해를 주고, 봇의 회피율로 깎인다. 10분 생존 = 클리어.

const CONST = {
  RUN: 600,                       // 10분
  SPAWN0: 1.2, SPAWN_K: 0.006,   // s(t) = SPAWN0 + SPAWN_K·t   (0:1.2/s → 10분 3.9/s)
  HP0: 10, HP_G: 1.0032,          // h(t) = HP0 · HP_G^t          (10분 ×6.8)
  BOSS_AT: [300, 600], BOSS_HP: [40, 120], // 보스 = h(t)×배수
  DPS0: 12, LVL_XP0: 12, LVL_XP_G: 1.18,  // 레벨 n→n+1 필요 XP = XP0·G^n
  LVL_DPS: 0.2,                  // 레벨업 1회 = DPS ×(1+0.16) (3택1 평균치)
  CAP: 60, BOSS_SHARE: 0.7,                        // 화면 최대 동시 적 (초과 스폰은 대기열)
  CONTACT: 1.1,                   // 적 1마리 접촉 초당 피해 (풀접촉 가정)
  HP_PLAYER: 100, REGEN: 0.35,
  XP_PER_KILL: 1, PICKUP: 0.9,
  META_G: 1.0, META_D: 0.90,      // power(r) = 1 + G(1 − d^r)  — 영구 스탯 상한 1.8
  NIGHT_C: 0.975, NIGHT_D: 0.86,   // challenge(r) = 1 + C(1 − D^r) — 밤 단계로 적 체력·스폰 상향
};
for (const k in CONST) if (process.env[k] != null) CONST[k] = +process.env[k];

const BOTS = {
  SKILLED: { dodge: 0.78, pick: 1.0 },   // 접촉 중 78% 회피, 선택 품질 100%
  NORMAL:  { dodge: 0.55, pick: 0.85 },
  NOVICE:  { dodge: 0.30, pick: 0.7 },
};
const power = r => 1 + CONST.META_G * (1 - Math.pow(CONST.META_D, r));
const challenge = r => 1 + CONST.NIGHT_C * (1 - Math.pow(CONST.NIGHT_D, r));

function run(bot, r, { meta = true, night = null } = {}) {   // night: 선택 난이도 (null = r 과 같은 사다리 위치)
  const pw = meta ? power(r) : 1, ch = challenge(night == null ? r : night);
  let t = 0, hp = CONST.HP_PLAYER * pw, alive = 0, queue = 0, xp = 0, lvl = 0, need = CONST.LVL_XP0, dps = CONST.DPS0 * pw, kills = 0, bossIdx = 0, bossHp = 0;
  const log = [];
  for (t = 1; t <= CONST.RUN; t++) {
    const h = CONST.HP0 * Math.pow(CONST.HP_G, t) * ch, s = (CONST.SPAWN0 + CONST.SPAWN_K * t);   // 밤 단계는 체력에만
    queue += s; const room = Math.max(0, CONST.CAP - alive); const sp = Math.min(queue, room); queue -= sp; alive += sp;
    if (bossIdx < CONST.BOSS_AT.length && t === CONST.BOSS_AT[bossIdx]) { bossHp = h * CONST.BOSS_HP[bossIdx]; }
    let d = dps;   // 광역 무기 가정: 보스와 잡몹이 각각 DPS 의 BOSS_SHARE / 1 을 받는다
    if (bossHp > 0) { bossHp -= d * CONST.BOSS_SHARE; if (bossHp <= 0) { bossHp = 0; bossIdx++; kills++; xp += 10 * CONST.XP_PER_KILL; } }
    const k = Math.min(alive, d / h); alive -= k; kills += k; xp += k * CONST.XP_PER_KILL * CONST.PICKUP;
    while (xp >= need) { xp -= need; lvl++; need = CONST.LVL_XP0 * Math.pow(CONST.LVL_XP_G, lvl); dps *= 1 + CONST.LVL_DPS * bot.pick; }
    const contact = Math.min(alive, 8) * CONST.CONTACT * (1 - bot.dodge) + (bossHp > 0 ? 6 * (1 - bot.dodge) : 0);
    hp += CONST.REGEN * pw - contact; if (hp > CONST.HP_PLAYER * pw) hp = CONST.HP_PLAYER * pw;   // 영구 스탯 = 공격·체력·회복 모두
    if (t % 60 === 0) log.push(`${t/60}m alive=${alive.toFixed(0)} q=${queue.toFixed(0)} lvl=${lvl} dps=${dps.toFixed(0)} h=${h.toFixed(0)} hp=${hp.toFixed(0)}`);
    if (hp <= 0) break;
  }
  return { t: Math.min(t, CONST.RUN), cleared: t > CONST.RUN, lvl, kills: Math.round(kills), log };
}
const fmt = t => `${Math.floor(t/60)}m${String(t%60).padStart(2,'0')}s`;
const res = [];
const ok = (n, c, d) => { res.push(c); console.log((c ? 'PASS' : 'FAIL') + ' ' + n + ' — ' + d); };

// 1. 밴드: ratio(r)/ratio(0) ∈ 0.90~1.15, r=0..200
const ratio = r => challenge(r) / power(r); let bandBad = 0, worst = [1, 0];
for (let r = 0; r <= 200; r++) { const q = ratio(r) / ratio(0); if (q < .9 || q > 1.15) bandBad++; if (Math.abs(q - 1) > Math.abs(worst[0] - 1)) worst = [q, r]; }
ok('밴드 유지 (0~200런)', bandBad === 0, `이탈 ${bandBad}구간, 최대 편차 ${worst[0].toFixed(3)} @r=${worst[1]}`);
ok('포화 power(200)/power(∞) ≥ 0.98', power(200) / (1 + CONST.META_G) >= .98, (power(200) / (1 + CONST.META_G)).toFixed(4));
// 2. 런 결과 (밤1 = 챌린지 조건, 메타 0)
const S0 = run(BOTS.SKILLED, 0), N0 = run(BOTS.NORMAL, 0), V0 = run(BOTS.NOVICE, 0);
ok('챌린지 공정성: SKILLED 메타0 밤1 클리어', S0.cleared, `${fmt(S0.t)} lvl${S0.lvl}`);
ok('NORMAL 메타0 밤1 7~10분', N0.t >= 420, `${fmt(N0.t)} lvl${N0.lvl}`);
ok('신규 진입: NOVICE 런1 3~6분 생존', V0.t >= 180 && V0.t <= 360, `${fmt(V0.t)} lvl${V0.lvl}`);
// 3. 메타 가치 (밤1 고정): 풀메타 NOVICE 는 밤1을 깬다 — 성장이 실제다
const V200n1 = run(BOTS.NOVICE, 200, { night: 0 }), V20n1 = run(BOTS.NOVICE, 20, { night: 0 });
ok('메타 가치: NOVICE 풀메타 밤1 클리어', V200n1.cleared, `r200 ${fmt(V200n1.t)} · r20 ${fmt(V20n1.t)}`);
// 4. 긴장 유지: 자기 사다리 밤(= r) 에서는 NOVICE 가 못 깨고, SKILLED 는 깬다 (밴드가 실제로 작동)
const V20 = run(BOTS.NOVICE, 20), S20 = run(BOTS.SKILLED, 20), N20 = run(BOTS.NORMAL, 20);
ok('긴장 유지: NOVICE r20 밤20 클리어 못 함', !V20.cleared, fmt(V20.t));
ok('사다리 공정: SKILLED r20 밤20 클리어', S20.cleared, `${fmt(S20.t)} · NORMAL ${fmt(N20.t)}`);
console.log('\nSKILLED r0 로그:'); S0.log.forEach(l => console.log('  ' + l));
console.log('NOVICE r0 로그:'); V0.log.forEach(l => console.log('  ' + l));
console.log(res.every(Boolean) ? '\n게이트 A 통과' : '\n게이트 A 실패');
process.exit(res.every(Boolean) ? 0 : 1);
