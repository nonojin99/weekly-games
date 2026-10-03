-- 밤의 퇴마사 실측 분포 (7일차 이후). variant = v<BAL>|s<stage>|<end>|lv<n>|k<n>|tr<n>|m<n>|runs<n>[|chal]|d:<deck>
with e as (
  select created_at, score::int as sec, variant,
    split_part(variant, '|', 1) as bal, split_part(variant, '|', 2) as stage, split_part(variant, '|', 3) as end_,
    nullif(regexp_replace(split_part(variant, '|', 4), '\D', '', 'g'), '')::int as lv,
    nullif(regexp_replace(split_part(variant, '|', 6), '\D', '', 'g'), '')::int as tr,
    variant like '%|chal%' as chal
  from play_events where game_id = 'night-exorcist' and event = 'over' and variant like 'v%')
select bal, stage, chal, end_, count(*) n,
  percentile_cont(0.25) within group (order by sec) q1, percentile_cont(0.5) within group (order by sec) med, percentile_cont(0.75) within group (order by sec) q3,
  round(avg(lv), 1) lv, round(avg(tr), 1) tr
from e group by 1, 2, 3, 4 order by 1, 2, 3, 4;
