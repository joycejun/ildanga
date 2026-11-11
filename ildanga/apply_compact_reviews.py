from pathlib import Path
import shutil, sys
root=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path.cwd()
assets=root/'app'/'src'/'main'/'assets'
index=assets/'index.html'
server=root/'server'/'places_server.py'
if not (index.is_file() and server.is_file() and (root/'gradlew.bat').is_file()):
    raise SystemExit('gradlew.bat이 있는 일단가 Android 프로젝트 폴더에서 실행하세요.')
if not (assets/'reviews-live.js').is_file():
    raise SystemExit('현재 프로젝트에서 reviews-live.js를 찾지 못했습니다.')
# The user has the existing summary patch; fail visibly rather than claim missing server was installed.
server_code=server.read_text(encoding='utf-8')
if 'path == "/api/google/summary"' not in server_code:
    raise SystemExit('Google 요약 서버 연결이 없습니다. 이전 ildanga_google_reviews_ai_summary_fix.zip 패치를 먼저 적용하세요.')
old_summary=assets/'google-summary-ui.js'
if old_summary.is_file() and not (assets/'google-summary-ui.js.before-compact.bak').exists():
    shutil.copy2(old_summary,assets/'google-summary-ui.js.before-compact.bak')
shutil.copy2(Path(__file__).with_name('google-summary-ui.js'),old_summary)
shutil.copy2(Path(__file__).with_name('review-parking-order.js'),assets/'review-parking-order.js')
html=index.read_text(encoding='utf-8')
if '<script src="google-summary-ui.js"></script>' not in html:
    raise SystemExit('index.html에 후기 요약 스크립트가 없습니다. 이전 요약 패치를 먼저 적용하세요.')
needle='<script src="review-parking-order.js"></script>'
if needle not in html:
    if '</body>' not in html: raise SystemExit('index.html 닫는 태그가 없습니다.')
    shutil.copy2(index,index.with_name('index.html.before-review-order.bak'))
    html=html.replace('</body>',needle+'</body>',1)
    index.write_text(html,encoding='utf-8')
print('완료: Google 후기 최대 3줄 요약 + 원문 접기 + 주차장 정보 아래 배치 (기존 UI 유지)')
