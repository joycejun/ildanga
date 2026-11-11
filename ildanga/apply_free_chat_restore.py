"""Safely restore unrestricted Ollama chat. Optional route cards appear only via an explicit click.
Run from the Android project root: python apply_free_chat_restore.py .
"""
from pathlib import Path
import sys, re, shutil

root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
assets=root/'app/src/main/assets'
free=assets/'free-chat.js'
index=assets/'index.html'
here=Path(__file__).resolve().parent
newjs=here/'chat-route-safe.js'
service=root/'server/chat_service.py'
oldbridge=assets/'chat-route-bridge.js'
for path in (free,index,newjs):
    if not path.is_file():raise SystemExit(f'Missing required file: {path}')
s=free.read_text(encoding='utf-8')
# Previous bridge called route search automatically after an Ollama response.
auto='if(makeRoute&&routeRequest)await bridge.discover(routeRequest);'
injected="const bridge=window.ildangaChatRouteBridge;const routeRequest=bridge?.remember(message)||'';const makeRoute=bridge?.wantsRoute(message)||false;"
# First, strip the previous automatic route logic. Guard rather than silently leaving it in place.
if auto in s:
    s=s.replace(auto,'window.ildangaChatSafeRoute?.maybeOffer(message);')
    if injected not in s:raise SystemExit('Expected chat-route bridge injection missing; no files changed.')
    s=s.replace(injected,'')
elif 'window.ildangaChatSafeRoute?.maybeOffer(message);' not in s:
    anchor="pending.textContent=data.reply||'답변이 비어 있어요.';"
    if anchor not in s:raise SystemExit('Unknown free-chat.js send() structure; no files changed.')
    s=s.replace(anchor,anchor+'\n  window.ildangaChatSafeRoute?.maybeOffer(message);',1)
# Preserve free chat even when the route module is unavailable.
s=s.replace('window.ildangaChatRouteBridge?.reset();q(\'#free-chat-messages\'', 'window.ildangaChatSafeRoute?.reset();q(\'#free-chat-messages\'')
# Standard reset may not contain old bridge code.
if "window.ildangaChatSafeRoute?.reset();" not in s:
    needle="sid='ildanga'+Math.random().toString(36).slice(2)+Date.now().toString(36);q('#free-chat-messages',layer).textContent='';"
    if needle in s:s=s.replace(needle,needle.replace("q('#free-chat-messages'","window.ildangaChatSafeRoute?.reset();q('#free-chat-messages'"),1)
html=index.read_text(encoding='utf-8')
if 'chat-route-safe.js' not in html:
    needle='<script src="free-chat.js"></script>'
    if needle not in html:raise SystemExit('Cannot locate free-chat.js script tag; no files changed.')
    html=html.replace(needle,'<link rel="stylesheet" href="chat-route-safe.css"><script src="chat-route-safe.js"></script>'+needle,1)
# Let Ollama answer normal everyday topics; trip actions remain separate from responses.
service_change=None
if service.is_file():
    service_text=service.read_text(encoding='utf-8')
    system_start=service_text.find('_SYSTEM=(')
    call_start=service_text.find('\ndef _call_model(',system_start)
    if system_start>=0 and call_start>system_start:
        new_system=(
            "_SYSTEM=(\n"
            " '너는 일단가 앱의 편안한 한국어 AI 대화 도우미야. 여행 이야기뿐 아니라 일반적인 질문, 잡담, 설명 요청에도 자연스럽고 유용하게 답해. '\n"
            " '여행 계획을 요청하면 앞 대화의 조건과 선호를 기억해서 이어가. 여행이 아닌 질문을 여행 추천으로 억지 전환하지 마. '\n"
            " '확인되지 않은 장소 정보, 영업시간, 실제 이동시간은 사실로 단정하지 마. '\n"
            " 'AI 텍스트 응답만으로 지도나 내비가 변경됐다고 주장하지 마. 실제 장소 검색 코스는 앱에 따로 표시되는 버튼으로 사용자가 선택해. '\n"
            " '친근하되 간결하고 명확하게 한국어로 답해.'\n"
            ")\n"
        )
        service_change=service_text[:system_start]+new_system+service_text[call_start:]
    else:
        print('Note: chat_service.py prompt differs; leaving server unchanged.')
# Existing bridge is still loaded before free-chat; it can provide discover(), but never intercept send().
for path,value in ((free,s),(index,html)):
    if path.read_text(encoding='utf-8')!=value:
        backup=path.with_suffix(path.suffix+'.before-free-chat-restore.bak')
        if not backup.exists():shutil.copy2(path,backup)
        path.write_text(value,encoding='utf-8')
        print('Updated:',path.relative_to(root))
if service_change is not None and service.read_text(encoding='utf-8')!=service_change:
    backup=service.with_suffix(service.suffix+'.before-free-chat-restore.bak')
    if not backup.exists():shutil.copy2(service,backup)
    service.write_text(service_change,encoding='utf-8')
    print('Updated:',service.relative_to(root))
for name in ('chat-route-safe.js','chat-route-safe.css'):
    shutil.copy2(here/name,assets/name)
    print('Installed:',(assets/name).relative_to(root))
print('Done. Restart CONNECT_REVIEWS.cmd for updated AI prompt, then Rebuild/Run the Android app.')
