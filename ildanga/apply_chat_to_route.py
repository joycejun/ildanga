"""Idempotent integration between existing free-chat.js and grounded TourAPI/Kakao search."""
from pathlib import Path
import sys, shutil, re
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
assets=root/'app/src/main/assets'; idx=assets/'index.html'; js=assets/'free-chat.js'; tour=assets/'tour-courses.js'; service=root/'server/chat_service.py'
here=Path(__file__).resolve().parent
for p in (idx,js,tour,service,here/'chat-route-bridge.js',here/'chat-route-bridge.css'):
    if not p.is_file():raise SystemExit(f'필요한 파일이 없습니다: {p}')
text=js.read_text(encoding='utf-8')
if 'const bridge=window.ildangaChatRouteBridge;' not in text:
    anchor="message=String(message||'').trim();if(!message||busy)return;"
    if anchor not in text:raise SystemExit('free-chat.js의 send() 구조가 예상과 다릅니다. 파일을 수정하지 않았어요.')
    text=text.replace(anchor,anchor+"\n const bridge=window.ildangaChatRouteBridge;const routeRequest=bridge?.remember(message)||'';const makeRoute=bridge?.wantsRoute(message)||false;",1)
    anchor2="pending.textContent=data.reply||'답변이 비어 있어요.';"
    if anchor2 not in text:raise SystemExit('free-chat.js의 AI 응답 처리 부분을 찾지 못했습니다. 파일을 수정하지 않았어요.')
    text=text.replace(anchor2,anchor2+"\n  if(makeRoute&&routeRequest)await bridge.discover(routeRequest);",1)
    anchor3="q('#free-chat-messages',layer).textContent='';bubble('assistant'"
    if anchor3 in text:text=text.replace(anchor3,"window.ildangaChatRouteBridge?.reset();"+anchor3,1)
ht=idx.read_text(encoding='utf-8')
if 'chat-route-bridge.js' not in ht:
    if '<script src="free-chat.js"></script>' not in ht:raise SystemExit('index.html에 free-chat.js를 찾지 못했습니다. 파일을 수정하지 않았어요.')
    # bridge must load BEFORE free chat script to be available during send.
    ht=ht.replace('<script src="free-chat.js"></script>','<link rel="stylesheet" href="chat-route-bridge.css"><script src="chat-route-bridge.js"></script><script src="free-chat.js"></script>',1)
# Keep Ollama's claims aligned with the new route-preview flow.
chat=service.read_text(encoding='utf-8')
old=('이 대화는 코스 엔진이나 내비게이션을 직접 수정하지 않아. 실제로 코스를 변경하거나 저장했다고 주장하면 안 돼. '
     '실제 코스를 선택하려면 사용자가 앱의 코스 검색 화면을 열어야 한다고 적절히 안내해. ')
new=('대화 속 여행 조건을 기억하고 코스 생성을 원하면 동의 여부를 물어봐. '
     '사용자가 동의하면 앱이 실제 장소 검색을 수행해 코스 카드로 보여줄 거야. '
     '실제 장소나 코스가 만들어지기 전에는 경로를 생성하거나 저장했다고 주장하면 안 돼. ')
if old in chat:chat=chat.replace(old,new,1)
for p,data in ((js,text),(idx,ht)):
    if data!=p.read_text(encoding='utf-8'):
        bak=p.with_suffix(p.suffix+'.before-chat-route.bak')
        if not bak.exists():shutil.copy2(p,bak)
        p.write_text(data,encoding='utf-8');print('Patched:',p.relative_to(root))
if chat!=service.read_text(encoding='utf-8'):
    bak=service.with_suffix(service.suffix+'.before-chat-route.bak')
    if not bak.exists():shutil.copy2(service,bak)
    service.write_text(chat,encoding='utf-8');print('Patched:',service.relative_to(root))
for name in ('chat-route-bridge.js','chat-route-bridge.css'):
    target=assets/name
    shutil.copy2(here/name,target)
    print('Installed:',target.relative_to(root))
print('Done. Rebuild and Run Android; restart CONNECT_REVIEWS.cmd to refresh Ollama instructions.')
