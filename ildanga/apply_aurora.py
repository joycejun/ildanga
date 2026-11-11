"""Non-destructive installer for the complete Aurora layout. Re-entrant, preserves all integrations."""
from pathlib import Path
import sys, shutil
project=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
here=Path(__file__).resolve().parent
assets=project/'app/src/main/assets'
index=assets/'index.html'
if not index.is_file():raise SystemExit('오류: app/src/main/assets/index.html 이 있는 프로젝트 루트에서 실행해 주세요.')
for name in ('aurora-app.js','aurora-app.css'):
 if not (here/name).is_file():raise SystemExit('오류: '+name+' 파일을 apply_aurora.py 옆에 두세요.')
html=index.read_text('utf-8')
if '</body>' not in html:raise SystemExit('오류: index.html 에 </body>가 없습니다.')
# remove older aurora tags if any (repeat-safe)
for tag in ('<link rel="stylesheet" href="aurora-app.css">','<script src="aurora-app.js"></script>'):
 html=html.replace(tag,'')
html=html.replace('</body>', '<link rel="stylesheet" href="aurora-app.css"><script src="aurora-app.js"></script></body>',1)
if html != index.read_text('utf-8'):
 backup=assets/'index.html.before-aurora.bak'
 if not backup.exists():shutil.copy2(index,backup)
 index.write_text(html,'utf-8')
 print('연결: index.html')
for name in ('aurora-app.css','aurora-app.js'):
 dst=assets/name
 if dst.is_file() and dst.read_bytes()==(here/name).read_bytes():print('이미 설치:',name);continue
 if dst.is_file() and not (assets/(name+'.before-aurora.bak')).exists():shutil.copy2(dst,assets/(name+'.before-aurora.bak'))
 shutil.copy2(here/name,dst)
 print('적용:',name)
print('완료: 기존 Gleo, TourAPI, Kakao, SocialCrawl 및 PLEOS 내비 로직은 변경하지 않았습니다.')
