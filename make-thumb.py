"""make-thumb.py — 허브 카드 배너(720×405 webp) 생성 + upsert SQL 출력

사용:  python3 scripts/make-thumb.py <slug> <플레이 스크린샷.png> [--y 픽셀] [--out dir]
  입력은 세로 모바일 스크린샷(390×844 또는 DPR2 780×1688). render-smoke의 mobile-play.png 그대로 써도 되고,
  주인공이 잘 보이는 순간을 따로 찍어도 된다 (DPR2 권장: deviceScaleFactor 2).
  띠 선택: 세로 엣지 에너지 + 채도 0.12 가중의 슬라이딩 합이 최대인 16:9 구간 (상단 8%는 HUD라 0.45 가중).
  자동 선택이 주인공을 놓치면 --y 로 시작 y(입력 픽셀)를 직접 준다. 결과 png를 Read로 열어 확인할 것.
출력: <out>/<slug>.webp, <slug>.png(확인용), <slug>.b64, <slug>.sql (execute_sql에 그대로) + 길이·md5
"""
import sys, base64, hashlib, pathlib
from PIL import Image, ImageFilter
import numpy as np

args = sys.argv[1:]
if len(args) < 2: print(__doc__); sys.exit(2)
slug, src = args[0], pathlib.Path(args[1])
opt = lambda k, d: args[args.index(k) + 1] if k in args else d
OUT = pathlib.Path(opt('--out', src.parent)); OUT.mkdir(parents=True, exist_ok=True)
Y = opt('--y', None)
BW, BH = 720, 405

im = Image.open(src).convert('RGB'); W, H = im.size; bh = round(W * 9 / 16)
if Y is None:
    ge = np.asarray(im.convert('L').filter(ImageFilter.FIND_EDGES), dtype=float).sum(axis=1)
    se = np.asarray(im.convert('HSV').getchannel('S'), dtype=float).sum(axis=1)
    rows = ge + 0.12 * se
    rows[: int(H * 0.08)] *= 0.45
    pre = np.concatenate([[0], np.cumsum(rows)])
    ys = range(0, H - bh + 1, 4)
    Y = max(ys, key=lambda y: pre[y + bh] - pre[y])
Y = int(Y)
band = im.crop((0, Y, W, Y + bh)).resize((BW, BH), Image.LANCZOS)
webp = OUT / f'{slug}.webp'; band.save(webp, 'WEBP', quality=76, method=6); band.save(OUT / f'{slug}.png')
b64 = base64.b64encode(webp.read_bytes()).decode()
(OUT / f'{slug}.b64').write_text(b64)
sql = (f"insert into public.game_thumbs(slug, webp, w, h) values ('{slug}', '{b64}', {BW}, {BH})\n"
       f"on conflict (slug) do update set webp = excluded.webp, w = excluded.w, h = excluded.h, updated_at = now()\n"
       f"returning slug, length(webp), md5(webp);")
(OUT / f'{slug}.sql').write_text(sql)
print(f'{slug}: y={Y}/{H}  {webp.stat().st_size/1024:.1f}KB  base64 length={len(b64)}  md5={hashlib.md5(b64.encode()).hexdigest()}')
print(f'→ {OUT}/{slug}.sql 을 execute_sql 로 실행하고 returning 의 length·md5 가 위와 같은지 확인')
