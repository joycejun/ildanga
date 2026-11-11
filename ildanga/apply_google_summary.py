from pathlib import Path
import shutil,sys
root=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path.cwd()
server=root/'server'/'places_server.py'
assets=root/'app'/'src'/'main'/'assets'
index=assets/'index.html'
if not server.is_file() or not index.is_file():
    raise SystemExit('잘못된 프로젝트 폴더입니다. gradlew.bat이 있는 일단가 프로젝트에서 실행하세요.')
source=server.read_text(encoding='utf-8')
needle='    def do_GET(self):'
if 'path == "/api/google/summary"' not in source:
    if source.count(needle)!=1:raise SystemExit('places_server.py 형식이 달라 안전하게 적용할 수 없습니다.')
    insertion="""    def do_POST(self):
        path = self.path.split("?", 1)[0]
        if path == "/api/google/summary":
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if not (0 < size <= 15000):
                    return self.send_json(413, {"error": "후기 요청 크기를 확인해 주세요."})
                body = json.loads(self.rfile.read(size))
                from google_review_summary import summarize
                return self.send_json(200, summarize(body))
            except (ValueError, TypeError, json.JSONDecodeError) as e:
                return self.send_json(400, {"error": str(e)})
            except RuntimeError as e:
                return self.send_json(503, {"error": str(e)})
            except Exception:
                return self.send_json(503, {"error": "후기 요약 처리에 실패했어요."})
        return self.send_json(404, {"error": "지원하지 않는 요청입니다."})

"""
    shutil.copy2(server,server.with_suffix('.py.before-google-summary.bak'))
    server.write_text(source.replace(needle,insertion+needle,1),encoding='utf-8')
shutil.copy2(Path(__file__).with_name('google_review_summary.py'), root/'server'/'google_review_summary.py')
shutil.copy2(Path(__file__).with_name('google-summary-ui.js'), assets/'google-summary-ui.js')
html=index.read_text(encoding='utf-8')
script='<script src="google-summary-ui.js"></script>'
if script not in html:
    if '</body>' not in html:raise SystemExit('index.html에 body 태그가 없습니다.')
    shutil.copy2(index,index.with_name('index.html.before-google-summary.bak'))
    html=html.replace('</body>',script+'</body>',1)
    index.write_text(html,encoding='utf-8')
print('Google 후기 AI 요약 연결 완료. CONNECT_REVIEWS.cmd 재시작 및 앱 재빌드가 필요합니다.')
