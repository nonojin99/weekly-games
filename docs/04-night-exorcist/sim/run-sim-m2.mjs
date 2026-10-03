// 밤의 퇴마사 — 6일차 재검증: M2 메타 모델(수련 5항목·숙련·덱 상성) + 접촉 한 방 모델. node run-sim-m2.mjs
// run-sim.mjs 의 1초 틱 모델을 그대로 쓰되 메타를 power(r) 단일 곡선 대신 실제 구현값으로 바꾼다.
//   수련 r(0~25): 공격 ×(1+.12·atk) 체력 ×(1+.15·hp) 회복 ×(1+.25·regen)  (5항목 균등 분배 가정) — 6일차 보정값
//   숙련 m(0~10, 덱 평균): 피해 ×(1+.05m)      덱 상성 deck: 맞춤 1.3 / 중간 1.05 / 역상성 0.75 (deck-sim 결과)
//   스테이지 배수 mul: 적 체력에만 (1 / 1.45 / 1.8)
//   접촉: 닿을 때 3 (1초 쿨) ≈ 3/s·마리 → CONTACT 3, 보스 8 (×2.7)
const C = { RUN:600, SPAWN0:1.2, SPAWN_K:.006, HP0:10, HP_G:1.0032, BOSS_AT:[300, 540], BOSS_HP:[40, 120], DPS0:12, LVL_XP0:12, LVL_XP_G:1.18, LVL_DPS:.2, CAP:60, BOSS_SHARE:.7, CONTACT:3, BOSS_CONTACT:8, HP_PLAYER:100, REGEN:.35, PICKUP:.9, TR_ATK:.6, TR_HP:.75, TR_RG:1.25, MAST:.05 };
for (const k in C) if (process.env[k] != null) C[k] = +process.env[k];
const BOTS = { SKILLED:{ dodge:.78, pick:1 }, NORMAL:{ dodge:.55, pick:.85 }, NOVICE:{ dodge:.30, pick:.7 } };
function run(bot, { train = 0, mastery = 0, deck = 1, mul = 1 } = {}) {
  const f = Math.min(1, train / 25), atk = 1 + C.TR_ATK * f, hpM = 1 + C.TR_HP * f, rg = 1 + C.TR_RG * f, dmg = atk * (1 + C.MAST * mastery) * deck;
  let t, hp = C.HP_PLAYER * hpM, alive = 0, queue = 0, xp = 0, lvl = 0, need = C.LVL_XP0, dps = C.DPS0 * dmg, kills = 0, bossIdx = 0, bossHp = 0;
  for (t = 1; t <= C.RUN; t++) {
    const h = C.HP0 * Math.pow(C.HP_G, t) * mul, s = C.SPAWN0 + C.SPAWN_K * t;
    queue += s; const sp = Math.min(queue, Math.max(0, C.CAP - alive)); queue -= sp; alive += sp;
    if (bossIdx < C.BOSS_AT.length && t === C.BOSS_AT[bossIdx]) bossHp = h * C.BOSS_HP[bossIdx];
    if (bossHp > 0) { bossHp -= dps * C.BOSS_SHARE; if (bossHp <= 0) { bossHp = 0; bossIdx++; kills++; xp += 10; } }
    const k = Math.min(alive, dps / h); alive -= k; kills += k; xp += k * C.PICKUP;
    while (xp >= need) { xp -= need; lvl++; need = C.LVL_XP0 * Math.pow(C.LVL_XP_G, lvl); dps *= 1 + C.LVL_DPS * bot.pick; }
    const contact = Math.min(alive, 8) * C.CONTACT * (1 - bot.dodge) + (bossHp > 0 ? C.BOSS_CONTACT * (1 - bot.dodge) : 0);
    hp += C.REGEN * rg - contact; if (hp > C.HP_PLAYER * hpM) hp = C.HP_PLAYER * hpM;
    if (hp <= 0) break;
  }
  return { t: Math.min(t, C.RUN), cleared: t > C.RUN, lvl, kills: Math.round(kills) };
}
const fmt = t => `${Math.floor(t / 60)}m${String(t % 60).padStart(2, '0')}s`;
const res = []; const ok = (n, c, d) => { res.push(c); console.log((c ? 'PASS' : 'FAIL') + ' ' + n + ' — ' + d); };
const S0 = run(BOTS.SKILLED), N0 = run(BOTS.NORMAL), V0 = run(BOTS.NOVICE);
ok('챌린지(메타0·고정덱 1.0): SKILLED 초원 클리어', S0.cleared, `${fmt(S0.t)} lvl${S0.lvl}`);
ok('NORMAL 메타0 초원 7~10분', N0.t >= 420, `${fmt(N0.t)} lvl${N0.lvl}`);
ok('신규 NOVICE 런1 3~6분', V0.t >= 180 && V0.t <= 360, `${fmt(V0.t)} lvl${V0.lvl}`);
const Vfull = run(BOTS.NOVICE, { train:25, mastery:6, deck:1.05 });
ok('메타 가치: NOVICE 풀수련+숙련6+중간덱 초원 클리어', Vfull.cleared, fmt(Vfull.t));
const N2 = run(BOTS.NORMAL, { train:12, mastery:4, deck:1.3, mul:1.45 }), N2m = run(BOTS.NORMAL, { train:12, mastery:4, deck:1.05, mul:1.45 }), N2x = run(BOTS.NORMAL, { train:12, mastery:4, deck:.75, mul:1.45 });
ok('귀신의 숲(×1.45) NORMAL r12·숙련4: 맞춤덱 클리어 · 중간덱 미클리어 7분+ · 역상성 5분 미만', N2.cleared && !N2m.cleared && N2m.t >= 420 && N2x.t < 300, `맞춤 ${fmt(N2.t)} · 중간 ${fmt(N2m.t)} · 역상성 ${fmt(N2x.t)}`);
const N3 = run(BOTS.NORMAL, { train:18, mastery:5, deck:1.3, mul:1.8 }), N3m = run(BOTS.NORMAL, { train:18, mastery:5, deck:1.05, mul:1.8 }), S3m = run(BOTS.SKILLED, { train:18, mastery:5, deck:1.05, mul:1.8 });
ok('업화 폐사지(×1.8) r18: NORMAL 맞춤덱 클리어 · NORMAL 중간덱 미클리어 · SKILLED 중간덱 클리어', N3.cleared && !N3m.cleared && S3m.cleared, `N맞춤 ${fmt(N3.t)} · N중간 ${fmt(N3m.t)} · S중간 ${fmt(S3m.t)}`);
const V3 = run(BOTS.NOVICE, { train:25, mastery:10, deck:1.3, mul:1.8 });
ok('긴장 유지: NOVICE 풀메타+맞춤덱도 폐사지 미클리어', !V3.cleared, fmt(V3.t));
console.log(res.every(Boolean) ? '\n6일차 게이트 통과' : '\n6일차 게이트 실패'); process.exit(res.every(Boolean) ? 0 : 1);
