"""Install an additive Pleos landscape glass UI, preserving existing Java/Python/APIs and navigation logic."""
from pathlib import Path
import shutil,sys
project=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
here=Path(__file__).resolve().parent
assets=project/'app/src/main/assets'
index=assets/'index.html'
if not index.is_file(): raise SystemExit('index.html이 없어요. Android Studio의 ildanga 프로젝트 루트에서 실행해 주세요.')
for f in ('premium-ui.js','premium-ui.css'):
    if not (here/f).is_file():raise SystemExit('패치 파일 누락: '+f)
html=index.read_text('utf-8')
if '</body>' not in html:raise SystemExit('index.html에 </body>가 없어요.')
# Avoid loading before previously installed UI/nav scripts.
css='<link rel="stylesheet" href="premium-ui.css">'
js='<script src="premium-ui.js"></script>'
if css not in html:html=html.replace('</body>',css+'</body>',1)
if js not in html:html=html.replace('</body>',js+'</body>',1)
# Back up once, and preserve later user changes if they rerun.
if index.read_text('utf-8')!=html:
    bak=assets/'index.html.before-premium-ui.bak'
    if not bak.exists():shutil.copy2(index,bak)
    index.write_text(html,encoding='utf-8');print('수정: index.html')
else:print('이미 적용: index.html')
for f in ('premium-ui.js','premium-ui.css'):
    src=here/f;dst=assets/f
    if dst.exists() and dst.read_bytes()==src.read_bytes():print('유지:',f);continue
    if dst.exists():
        bak=assets/(f+'.before-premium-ui.bak')
        if not bak.exists():shutil.copy2(dst,bak)
    shutil.copy2(src,dst);print('설치:',f)
print('완료: 기존 API·Gleo·PLEOS native 코드는 변경하지 않았습니다.')
print('Android Studio Rebuild → Run. 새 UI가 안 보이면 앱을 완전히 종료 후 재실행하세요.')
