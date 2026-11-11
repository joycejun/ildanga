"""Non-destructive installer for Ildanga Glass v3 (re-entrant).

Usage (run from anywhere):  python apply_glass_v3.py <project-root>
<project-root> is the folder that contains settings.gradle and app/. Defaults to the current folder.

What it does
 - copies glass-v3.css / glass-v3.js into app/src/main/assets
 - copies the Pretendard variable font (+ OFL license) into app/src/main/assets/fonts
 - links the css/js at the END of index.html (after aurora-app.*), backing up index.html once
Nothing else is modified: Kakao/TourAPI search, PLEOS navigation SDK bridge, Gleo actions,
local storage format and Java sources stay as they are.
"""
from pathlib import Path
import shutil
import sys

project = Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
here = Path(__file__).resolve().parent
assets = project / 'app/src/main/assets'
index = assets / 'index.html'
if not index.is_file():
    raise SystemExit('오류: app/src/main/assets/index.html 이 있는 프로젝트 루트를 지정해 주세요.')

needed = ['glass-v3.css', 'glass-v3.js', 'fonts/PretendardVariable.woff2', 'fonts/PRETENDARD-OFL.txt']
for name in needed:
    if not (here / name).is_file():
        raise SystemExit('오류: ' + name + ' 파일을 apply_glass_v3.py 옆에 두세요.')

html = index.read_text('utf-8')
if '</body>' not in html:
    raise SystemExit('오류: index.html 에 </body>가 없습니다.')
if 'aurora-app.js' not in html:
    print('경고: index.html 에 aurora-app 레이어가 없습니다. Glass v3는 Aurora 위에 얹는 레이어이므로 내부 화면 스타일이 달라질 수 있어요.')

link = '<link rel="stylesheet" href="glass-v3.css"><script src="glass-v3.js"></script>'
new_html = html.replace('<link rel="stylesheet" href="glass-v3.css">', '').replace('<script src="glass-v3.js"></script>', '')
new_html = new_html.replace('</body>', link + '</body>', 1)  # always last, so it wins over earlier layers
if new_html != html:
    backup = assets / 'index.html.before-glass-v3.bak'
    if not backup.exists():
        shutil.copy2(index, backup)
    index.write_text(new_html, 'utf-8')
    print('연결: index.html (백업: index.html.before-glass-v3.bak)')
else:
    print('이미 연결됨: index.html')

(assets / 'fonts').mkdir(exist_ok=True)
for name in needed:
    src, dst = here / name, assets / name
    if dst.is_file() and dst.read_bytes() == src.read_bytes():
        print('이미 설치:', name)
        continue
    if dst.is_file():
        bak = dst.with_name(dst.name + '.before-glass-v3.bak')
        if not bak.exists():
            shutil.copy2(dst, bak)
    shutil.copy2(src, dst)
    print('적용:', name)
print('완료: 앱을 다시 Run 하세요. 되돌리려면 index.html.before-glass-v3.bak 로 복원하면 됩니다.')
