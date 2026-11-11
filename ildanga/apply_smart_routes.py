"""Apply a safe upgrade to the existing TourAPI+Kakao unified search. Rerunnable."""
from pathlib import Path
import shutil,sys
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
source=Path(__file__).resolve().parent
server=root/'server/unified_search.py'
helper=root/'server/smart_routes.py'
ui=root/'app/src/main/assets/tour-courses.js'
for f in (server,ui,root/'server/places_server.py'):
    if not f.is_file():raise SystemExit('기존 통합검색 패치가 없습니다: '+str(f))
s=server.read_text(encoding='utf-8')
if 'def discover(params,kakao_key):' not in s:raise SystemExit('unified_search.py 구조를 확인해 주세요; 변경하지 않았습니다.')
marker='from smart_routes import build_routes as _smart_kakao_routes\n_kakao_routes = _smart_kakao_routes\n\n'
if marker not in s:
    s=s.replace('def discover(params,kakao_key):',marker+'def discover(params,kakao_key):',1)
text=ui.read_text(encoding='utf-8')
old='<p>카카오 실제 장소 기반 · 일단가 자동 구성 · ${p.stops.length}곳</p>'
new='<p><b>${safe(p.district||p.region||"지역")}</b> · 실제 장소 기반 · 테마 맞춤 자동 구성 · ${p.stops.length}곳</p>'
if old not in text and new not in text:raise SystemExit('tour-courses.js 화면 구조가 달라요; 변경하지 않았습니다.')
text=text.replace(old,new)
# Keep old versions once; patch can be reapplied safely.
for p in (server,ui):
    backup=p.with_name(p.name+'.before-smart-routes.bak')
    if not backup.exists():shutil.copy2(p,backup)
server.write_text(s,encoding='utf-8')
ui.write_text(text,encoding='utf-8')
shutil.copy2(source/'smart_routes.py',helper)
print('완료: 동네별·테마별 실제 장소 코스 추천 적용')
print('기존 Gleo, 지도, 리뷰, 내비 코드는 변경하지 않았습니다.')
print('CONNECT_REVIEWS.cmd 서버 재시작 → Android Studio Rebuild/Run')
