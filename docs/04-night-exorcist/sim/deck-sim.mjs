// M2 덱·상성 시뮬 — run-sim 모델 + 상성 배율. node deck-sim.mjs
// 속성 상극(4원소 순환): 수→화→금→목→수 (유리 ×1.5, 불리 ×0.6). 타입↔방어구: 투척 strong light / weak heavy, 근접 strong heavy / weak none, 오라 strong none / weak light
const BEATS = { water:'fire', fire:'metal', metal:'wood', wood:'water' };
const TYPE_VS = { throw:{ light:1.5, heavy:.6, none:1 }, melee:{ heavy:1.5, none:.6, light:1 }, aura:{ none:1.5, light:.6, heavy:1 } };
const elMul = (w, e) => e === 'none' || w === e ? 1 : BEATS[w] === e ? 1.5 : BEATS[e] === w ? .6 : 1;
const WEAPONS = {
  talisman:{ el:'fire', type:'throw' }, torch:{ el:'fire', type:'melee' }, brazier:{ el:'fire', type:'aura' },
  orb:{ el:'water', type:'throw' }, whip:{ el:'water', type:'melee' }, mist:{ el:'water', type:'aura' },
  spear:{ el:'wood', type:'throw' }, sword:{ el:'wood', type:'melee' }, beads:{ el:'wood', type:'aura' },
  coin:{ el:'metal', type:'throw' }, sickle:{ el:'metal', type:'melee' }, bell:{ el:'metal', type:'aura' },
};
const ENEMY = { egg:{ el:'none', armor:'none' }, fire:{ el:'fire', armor:'light' }, jiangshi:{ el:'metal', armor:'heavy' }, water:{ el:'water', armor:'none' }, gumiho:{ el:'wood', armor:'light' } };
const STAGES = [ { name:'달빛 초원', mul:1.0, roster:['egg','jiangshi','fire'] }, { name:'귀신의 숲', mul:1.45, roster:['egg','fire','water'] }, { name:'업화 폐사지', mul:1.8, roster:['jiangshi','fire','gumiho'] } ];
// 장착 4무기 세트의 로스터 평균 배율
function setMul(set, stage) { const ro = STAGES[stage].roster; let s = 0; for (const e of ro) { let m = 0; for (const w of set) { const W = WEAPONS[w], E = ENEMY[e]; m += elMul(W.el, E.el) * TYPE_VS[W.type][E.armor]; } s += m / set.length; } return s / ro.length; }

const C = { RUN:600, SPAWN0:1.2, SPAWN_K:.006, HP0:10, HP_G:1.0032, BOSS_AT:[300,540], BOSS_HP:[40,120], BOSS_SHARE:.7, DPS0:12, LVL_XP0:12, LVL_XP_G:1.18, LVL_DPS:.2, CAP:60, CONTACT:1.1, HP_PLAYER:100, REGEN:.35, XP_PER_KILL:1, PICKUP:.9, META_G:1.0, META_D:.9 };
const BOTS = { SKILLED:{ dodge:.78, pick:1 }, NORMAL:{ dodge:.55, pick:.85 }, NOVICE:{ dodge:.3, pick:.7 } };
const power = r => 1 + C.META_G * (1 - Math.pow(C.META_D, r));
function run(bot, r, stage, set) {
  const pw = power(r), ch = STAGES[stage].mul, M = setMul(set, stage);
  let t, hp = C.HP_PLAYER * pw, alive = 0, queue = 0, xp = 0, lvl = 0, need = C.LVL_XP0, dps = C.DPS0 * pw * M, kills = 0, bi = 0, bossHp = 0;
  for (t = 1; t <= C.RUN; t++) {
    const h = C.HP0 * Math.pow(C.HP_G, t) * ch, s = C.SPAWN0 + C.SPAWN_K * t; queue += s; const sp = Math.min(queue, Math.max(0, C.CAP - alive)); queue -= sp; alive += sp;
    if (bi < 2 && t === C.BOSS_AT[bi]) bossHp = h * C.BOSS_HP[bi];
    if (bossHp > 0) { bossHp -= dps * C.BOSS_SHARE; if (bossHp <= 0) { bossHp = 0; bi++; kills++; xp += 10; } }
    const k = Math.min(alive, dps / h); alive -= k; kills += k; xp += k * C.PICKUP;
    while (xp >= need) { xp -= need; lvl++; need = C.LVL_XP0 * Math.pow(C.LVL_XP_G, lvl); dps *= 1 + C.LVL_DPS * bot.pick; }
    hp += C.REGEN * pw - (Math.min(alive, 8) * C.CONTACT * (1 - bot.dodge) + (bossHp > 0 ? 6 * (1 - bot.dodge) : 0)); if (hp > C.HP_PLAYER * pw) hp = C.HP_PLAYER * pw;
    if (hp <= 0) break;
  }
  return { t: Math.min(t, C.RUN), cleared: t > C.RUN, lvl, M };
}
export { WEAPONS, ENEMY, STAGES, setMul, run, BOTS, power };
const fmt = t => `${Math.floor(t/60)}m${String(t%60).padStart(2,'0')}s`;
if (!process.env.LIB) {
const ids = Object.keys(WEAPONS);
function sets(st) { const out = []; for (let a=0;a<12;a++) for (let b=a+1;b<12;b++) for (let c=b+1;c<12;c++) for (let d=c+1;d<12;d++) { const set=[ids[a],ids[b],ids[c],ids[d]]; out.push([setMul(set,st), set]); } out.sort((x,y)=>x[0]-y[0]); return { best:out[out.length-1], median:out[out.length>>1], worst:out[0] }; }
const res = []; const ok = (n, c, d) => { res.push(c); console.log((c ? 'PASS' : 'FAIL') + ' ' + n + ' — ' + d); };
let a = run(BOTS.SKILLED, 0, 0, ['talisman']); ok('챌린지(스테이지1·부적만·메타0) SKILLED 클리어', a.cleared, fmt(a.t));
a = run(BOTS.NOVICE, 0, 0, ['talisman']); ok('NOVICE 런1 3~6분', a.t >= 180 && a.t <= 360, fmt(a.t));
for (const [st, r] of [[1, 8], [2, 18]]) { const S = sets(st); const nm = STAGES[st].name;
  console.log(`  ${nm}: 최적 ×${S.best[0].toFixed(2)} [${S.best[1].join(' ')}] · 중간 ×${S.median[0].toFixed(2)} · 최악 ×${S.worst[0].toFixed(2)} [${S.worst[1].join(' ')}]`);
  const b = run(BOTS.NORMAL, r, st, S.best[1]), m = run(BOTS.NORMAL, r, st, S.median[1]), w = run(BOTS.NORMAL, r, st, S.worst[1]), sk = run(BOTS.SKILLED, r, st, S.median[1]);
  ok(`${nm}: 맞춤 덱 NORMAL r${r} 클리어`, b.cleared, fmt(b.t));
  ok(`${nm}: 중간 덱 NORMAL r${r} 7분 이상·미클리어 (덱이 빌드다)`, !m.cleared && m.t >= 420, fmt(m.t));
  ok(`${nm}: 역상성 덱 NORMAL r${r} 3분 미만`, w.t < 180, fmt(w.t));
  ok(`${nm}: 중간 덱도 SKILLED 는 클리어 (실력 보상)`, sk.cleared, fmt(sk.t)); }
console.log(res.every(Boolean) ? '\n덱 게이트 통과' : '\n덱 게이트 실패'); process.exit(res.every(Boolean) ? 0 : 1);
}
