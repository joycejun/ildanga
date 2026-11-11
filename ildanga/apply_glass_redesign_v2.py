"""Install a real landscape UI layout redesign without touching native, routing or API code."""
from pathlib import Path
import sys, shutil
project=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
here=Path(__file__).resolve().parent
assets=project/'app/src/main/assets'
index=assets/'index.html'
if not index.is_file():raise SystemExit('프로젝트 app/src/main/assets/index.html 파일을 찾지 못했어요.')
for filename in ('glass-redesign-v2.css','glass-redesign-v2.js'):
 if not (here/filename).is_file():raise SystemExit('같은 폴더에 '+filename+' 파일이 필요해요.')
html=index.read_text('utf-8')
if '</body>' not in html:raise SystemExit('index.html에 </body>가 없어요.')
for element in ('<link rel="stylesheet" href="glass-redesign-v2.css">','<script src="glass-redesign-v2.js"></script>'):
 if element not in html:html=html.replace('</body>',element+'</body>',1)
if html!=index.read_text('utf-8'):
 bak=assets/'index.html.before-redesign-v2.bak'
 if not bak.exists():shutil.copy2(index,bak)
 index.write_text(html,'utf-8')
 print('수정: index.html')
else:print('유지: index.html (이미 연결됨)')
for filename in ('glass-redesign-v2.css','glass-redesign-v2.js'):
 src=here/filename;dest=assets/filename
 if dest.exists() and dest.read_bytes()==src.read_bytes():print('유지:',filename);continue
 if dest.exists():
  bak=assets/(filename+'.before-redesign-v2.bak')
  if not bak.exists():shutil.copy2(dest,bak)
 shutil.copy2(src,dest);print('설치:',filename)
print('완료. 앱을 Rebuild/Run 해 주세요. 기존 API, PLEOS NaviHelper, Gleo Intent 코드는 그대로 둡니다.')
