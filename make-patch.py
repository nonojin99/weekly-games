"""index.html 두 버전의 diff → Postgres 중첩 replace() 패치 SQL 생성 (파일 전체를 다시 타이핑하지 않기 위해).
사용: python3 make-patch.py <old.html> <new.html> <out.sql> [slug]
각 replace 의 old 블록은 old 파일에서 정확히 1회 등장해야 한다(앞뒤 줄을 붙여 유일하게 만든다). 로컬에서 순차 적용해 new 와 일치하는지 검증한 뒤 SQL 을 쓴다."""
import sys, difflib, hashlib
old_p, new_p, out_p = sys.argv[1:4]; slug = sys.argv[4] if len(sys.argv) > 4 else 'vein-expedition'
old, new = open(old_p).read(), open(new_p).read()
ol, nl = old.splitlines(True), new.splitlines(True)
sm = difflib.SequenceMatcher(None, ol, nl, autojunk=False)
pairs = []; cur = old
# 순차 적용을 전제로, 각 블록은 "그 시점의 문서(cur)" 에서 유일해야 한다 (앞 hunk 가 같은 문장을 만들어낼 수 있으므로 old 기준 유일성으론 부족)
for tag, i1, i2, j1, j2 in reversed(sm.get_opcodes()):   # 뒤에서 앞으로 적용하면 앞쪽 원본 오프셋이 안 흔들린다
    if tag == 'equal': continue
    a, b = i1, i2
    while True:
        blk = ''.join(ol[a:b]); rep = ''.join(ol[a:i1]) + ''.join(nl[j1:j2]) + ''.join(ol[i2:b])
        if blk and cur.count(blk) == 1: break
        if a > 0: a -= 1
        elif b < len(ol): b += 1
        else: raise SystemExit('unique 블록 생성 실패')
    assert cur.count(blk) == 1; cur = cur.replace(blk, rep); pairs.append((blk, rep))
assert cur == new, '순차 적용 결과가 new 와 다름'
for o, n in pairs: assert '$o$' not in o and '$n$' not in n
expr = 'html'
for o, n in pairs: expr = f"replace({expr}, $o${o}$o$, $n${n}$n$)"
sql = f"-- 자동 생성 패치 {len(pairs)}개 hunk · 기대 md5 {hashlib.md5(new.encode()).hexdigest()} · 길이 {len(new)}\nupdate public.games set html = {expr} where slug = '{slug}' and md5(html) = '{hashlib.md5(old.encode()).hexdigest()}' returning slug, md5(html), length(html);\n"
open(out_p, 'w').write(sql); print(f'hunk {len(pairs)}개, SQL {len(sql)} bytes, 기대 md5 {hashlib.md5(new.encode()).hexdigest()}')
