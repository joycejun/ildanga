"""Idempotent, backed-up patch for existing Ildanga Android WebView + Python server."""
from pathlib import Path
import sys,shutil,re
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
assets=root/'app/src/main/assets'
java=root/'app/src/main/java/com/example/dateapp/MainActivity.java'
server=root/'server/places_server.py'
idx=assets/'index.html'
for p in (java,server,idx):
    if not p.exists():raise SystemExit('필수 파일을 찾지 못했습니다: '+str(p))
here=Path(__file__).resolve().parent
# Stage changes and validate all anchors before touching files.
updates={}
j=java.read_text(encoding='utf-8')
if '"/api/ai/chat".equals(path)' not in j:
    match=re.search(r'(?m)^(\s*)if\s*\(!allowed\)\s*\{',j)
    if not match:raise SystemExit('MainActivity.java API 허용 목록 위치를 찾지 못했어요. 덮어쓰지 않았습니다.')
    insert='\n'+match.group(1)+'allowed = allowed || "/api/ai/chat".equals(path);'
    j=j[:match.start()]+insert+'\n'+j[match.start():]
    updates[java]=j
s=server.read_text(encoding='utf-8')
if '"/api/ai/chat"' not in s:
    m=re.search(r'(?m)^(\s*)if path == "/api/health":',s)
    if not m:raise SystemExit('places_server.py API 분기 위치를 찾지 못했어요. 덮어쓰지 않았습니다.')
    block='''        if path == "/api/ai/chat":
            try:
                from chat_service import handle_chat
                result = handle_chat(params)
                return self.send_json(200, result)
            except ValueError as e:
                return self.send_json(400, {"error": str(e)})
            except RuntimeError as e:
                return self.send_json(503, {"error": str(e)})
            except Exception:
                return self.send_json(503, {"error": "AI 서버 처리 중 오류가 발생했어요."})

'''
    s=s[:m.start()]+block+s[m.start():]
    updates[server]=s
html=idx.read_text(encoding='utf-8')
if 'free-chat.js' not in html:
    if '</body>' not in html:raise SystemExit('index.html 종료 위치를 찾지 못했어요.')
    html=html.replace('</body>','<link rel="stylesheet" href="free-chat.css"><script src="free-chat.js"></script></body>')
    updates[idx]=html
for p,content in updates.items():
    if p==server:
        import ast;ast.parse(content)
for p,content in updates.items():
    b=p.with_suffix(p.suffix+'.before-freechat.bak')
    if not b.exists():shutil.copy2(p,b)
    p.write_text(content,encoding='utf-8')
    print('Patched:',p.relative_to(root))
for source,dest in [('free-chat.js',assets/'free-chat.js'),('free-chat.css',assets/'free-chat.css'),('chat_service.py',root/'server/chat_service.py')]:
    shutil.copy2(here/source,dest)
    print('Installed:',dest.relative_to(root))
print('Done. Restart CONNECT_REVIEWS.cmd and Android Studio app; keep Ollama running.')
