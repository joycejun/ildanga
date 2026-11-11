"""Apply KTO TourAPI theme browsing to Ildanga clone (idempotent, backs up originals)."""
from pathlib import Path
import sys, shutil
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
assets=root/'app/src/main/assets'
java=root/'app/src/main/java/com/example/dateapp/MainActivity.java'
server=root/'server/places_server.py'
setup=root/'server/setup_reviews.py'
html=assets/'index.html'
for p in [java,server,setup,html]:
    if not p.exists():raise SystemExit(f'Missing expected file: {p}')
here=Path(__file__).resolve().parent

def patch(path,needle,replacement,marker):
    original=path.read_text(encoding='utf-8')
    if marker in original:
        print('Already applied:',path.name);return
    if needle not in original:raise SystemExit(f'Expected anchor missing in {path.name}: {needle[:60]}')
    new=original.replace(needle,replacement,1)
    bak=path.with_name(path.name+'.before-tourapi.bak')
    if not bak.exists():shutil.copy2(path,bak)
    path.write_text(new,encoding='utf-8')
    print('Patched:',path.name)

patch(java,'"/api/google/reviews".equals(path)', '"/api/google/reviews".equals(path)\n                  || path.startsWith("/api/tour/")', 'path.startsWith("/api/tour/")')
needle='        # -----------------------------\n        # 기존 네이버 리뷰 기능'
replacement='''        # -----------------------------
        # 한국관광공사 TourAPI 여행코스 및 테마
        # -----------------------------
        if path.startswith("/api/tour/"):
            try:
                from tourapi_service import courses, course_details, match_stops, TourError
                if path == "/api/tour/courses": data = courses(params)
                elif path == "/api/tour/course": data = course_details(params)
                elif path == "/api/tour/import": data = match_stops(params, kakao_key)
                else: return self.send_json(404, {"error":"지원하지 않는 관광코스 요청입니다."})
                return self.send_json(200, data)
            except TourError as e:
                return self.send_json(503, {"error":str(e)})
            except Exception:
                return self.send_json(502, {"error":"관광공사 코스 조회에 실패했어요. 서비스 상태를 확인해 주세요."})

'''+needle
patch(server,needle,replacement,'from tourapi_service import courses')
patch(setup,"        key=getpass.getpass('SocialCrawl API 키 (표시되지 않음): ').strip()", "        tour_key=getpass.getpass('한국관광공사 TourAPI 일반 인증키 (입력 내용 숨김): ').strip()\n        if not tour_key:raise RuntimeError('TourAPI 인증키가 입력되지 않았어요.')\n        os.environ['TOURAPI_SERVICE_KEY']=tour_key\n        key=getpass.getpass('SocialCrawl API 키 (표시되지 않음): ').strip()", "os.environ['TOURAPI_SERVICE_KEY']=tour_key")
# Some existing branches have customized cleanup and no longer include the
# SocialCrawl cleanup anchor. Do not abort a partially applied installation.
setup_text=setup.read_text(encoding='utf-8')
if "os.environ.pop('TOURAPI_SERVICE_KEY',None)" in setup_text:
    print('Already applied: TourAPI environment cleanup')
elif "        os.environ.pop('SOCIALCRAWL_API_KEY',None)" in setup_text:
    patch(setup,"        os.environ.pop('SOCIALCRAWL_API_KEY',None)","        os.environ.pop('SOCIALCRAWL_API_KEY',None)\n        os.environ.pop('TOURAPI_SERVICE_KEY',None)","os.environ.pop('TOURAPI_SERVICE_KEY',None)")
else:
    print('Note: customized setup_reviews.py has no expected SocialCrawl cleanup line. Continuing. TOURAPI_SERVICE_KEY is process-local and disappears when server exits.')
patch(html,'</body></html>','<script src="tour-courses.js"></script></body></html>','src="tour-courses.js"')
shutil.copy2(here/'tourapi_service.py',root/'server/tourapi_service.py')
shutil.copy2(here/'tour-courses.js',assets/'tour-courses.js')
print('Done. Restart CONNECT_REVIEWS.cmd and Android Studio app. No API keys saved.')
