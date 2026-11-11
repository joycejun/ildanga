"""Install the conversation launcher fix without replacing existing project source."""
from pathlib import Path
import sys, shutil, re
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
assets=root/'app/src/main/assets'; index=assets/'index.html'
src=Path(__file__).resolve().parent/'chat-priority-fix.js'
if not index.is_file():raise SystemExit('index.html이 없습니다. Android 프로젝트 최상위 폴더에서 실행해 주세요.')
for f in ('free-chat.js','chat-route-safe.js'):
    if not (assets/f).is_file():raise SystemExit(f'{f} 파일이 없습니다. 기존 자유 대화 패치를 먼저 적용해 주세요.')
html=index.read_text(encoding='utf-8')
if 'free-chat.js' not in html:raise SystemExit('index.html에 free-chat.js 연결이 없습니다.')
if '</body>' not in html:raise SystemExit('index.html의 </body>를 찾지 못했습니다.')
# Always keep the override LAST, even after glass-v3 or later theme scripts.
html=re.sub(r'\s*<script\s+src=["\']chat-priority-fix\.js["\']\s*></script>','',html)
html=html.replace('</body>','<script src="chat-priority-fix.js"></script></body>',1)
if html!=index.read_text(encoding='utf-8'):
    backup=index.with_suffix(index.suffix+'.before-chat-priority.bak')
    if not backup.exists():shutil.copy2(index,backup)
    index.write_text(html,encoding='utf-8')
    print('Updated:',index.relative_to(root))
shutil.copy2(src,assets/'chat-priority-fix.js')
print('Installed:',(assets/'chat-priority-fix.js').relative_to(root))
print('Chat launcher now opens Ollama free chat. No server files or native Gleo handlers changed.')
