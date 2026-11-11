"""Safe, idempotent upgrade from the previously installed Ildanga TourAPI theme patch."""
from pathlib import Path
import shutil
import sys
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
source=Path(__file__).resolve().parent
server=root/'server/places_server.py'
oldtour=root/'server/tourapi_service.py'
setup=root/'server/setup_reviews.py'
assets=root/'app/src/main/assets'
html=assets/'index.html'
js=assets/'tour-courses.js'
for path in (server,oldtour,setup,html):
    if not path.is_file():raise SystemExit('필요한 기존 파일이 없어요: '+str(path))
contents=server.read_text(encoding='utf-8')
if '/api/tour/discover' not in contents:
    anchor='                if path == "/api/tour/courses": data = courses(params)'
    anchor2='                from tourapi_service import courses, course_details, match_stops, TourError'
    if anchor not in contents or anchor2 not in contents:
        raise SystemExit('places_server.py 구조가 이전 TourAPI 패치와 달라요. 기존 파일은 변경하지 않았습니다.')
    patched=contents.replace(anchor2,anchor2+'\n                from unified_search import discover',1)
    patched=patched.replace(anchor,'                if path == "/api/tour/discover": data = discover(params, kakao_key)\n                elif path == "/api/tour/courses": data = courses(params)',1)
else:patched=contents
if 'src="tour-courses.js"' not in html.read_text(encoding='utf-8'):
    raise SystemExit('index.html에 TourAPI 스크립트가 없어요. 이전 패치 적용 상태를 확인해 주세요.')
# Validate all inputs BEFORE writing; old copies remain available.
for p in (source/'unified_search.py',source/'tour-courses.js'):
    if not p.is_file():raise SystemExit('패치 파일이 빠졌어요: '+str(p))
for original in (server,js):
    if original.exists():
        backup=original.with_name(original.name+'.before-unified-search.bak')
        if not backup.exists():shutil.copy2(original,backup)
if patched!=contents:
    server.write_text(patched,encoding='utf-8');print('수정:',server.name)
else:print('이미 적용:',server.name)
shutil.copy2(source/'unified_search.py',root/'server/unified_search.py')
shutil.copy2(source/'tour-courses.js',js)
print('설치:', 'unified_search.py, tour-courses.js')
print('완료! CONNECT_REVIEWS.cmd 종료 후 다시 실행 → Android Studio Rebuild/Run')
print('API 키를 파일에 저장하거나 GitHub에 업로드하지 않았습니다.')
