"""Non-destructive UI-only patch for the current Ildanga Android WebView project."""
from pathlib import Path
import shutil,sys
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
here=Path(__file__).resolve().parent
assets=root/'app/src/main/assets'
index=assets/'index.html'
app=assets/'app.js'
nav=assets/'pleos-route-link.js'
source=here/'gleo-chat-home.js'
target=assets/'gleo-chat-home.js'
if not all(p.is_file() for p in [index,app,nav,source]):
    raise SystemExit('오류: app/src/main/assets 폴더와 기존 내비 패치 파일을 확인해 주세요.')
if 'ildangaGleoDispatch' not in app.read_text(encoding='utf-8'):
    raise SystemExit('오류: 현재 app.js에서 Gleo 명령 처리 함수가 보이지 않습니다. 기존 Gleo 패치가 포함된 프로젝트인지 확인해 주세요.')

# Write changes only after all files have been checked.
def write_file(p,content):
    before=p.read_text(encoding='utf-8') if p.exists() else None
    if before==content:
        print('유지:',p.name);return
    if before is not None:
        bak=p.with_name(p.name+'.before-home-chat.bak')
        if not bak.exists():shutil.copy2(p,bak)
    p.write_text(content,encoding='utf-8')
    print('수정:',p.name)

html=index.read_text(encoding='utf-8')
tag='<script src="gleo-chat-home.js"></script>'
if tag not in html:
    if '</body>' not in html:
        raise SystemExit('오류: index.html의 </body>를 찾을 수 없습니다.')
    html=html.replace('</body>',tag+'</body>',1)

js=nav.read_text(encoding='utf-8')
replacements={
    '<h2>🚗 구간별 PLEOS 길안내</h2>':'<h2>🚗 코스 길안내</h2>',
    '<p>PLEOS는 한 번에 경유지 2곳 + 목적지 1곳을 안내할 수 있어요. 코스 전체를 보존하고 구간별로 전송합니다.</p>':'<p class="muted">방문지가 많아도 구간별로 나눠 출발할 수 있어요.</p>',
    '<p class="muted">다음 구간은 도착 후 직접 선택해 주세요. 현재 위치에서 남은 장소로 다시 길찾기합니다. 자동으로 다음 구간을 시작하지 않습니다.</p>':'<p class="muted">다음 구간은 도착 후 직접 선택해 주세요.</p>',
    '<p class="muted">카카오 ID와 PLEOS POI ID는 달라서 좌표만으로 길안내가 거절될 수 있어요. 내비 화면에서 실제 경로를 확인하세요.</p>':'<details class="muted" style="margin:10px 0"><summary>길안내 안내 사항</summary><p>내비에서 실제 경로 생성 여부를 확인해 주세요. 카카오 장소와 PLEOS 장소 ID는 다를 수 있어요.</p></details>',
    '<button id="pleosDebug">SDK 예제 테스트</button>':'<details style="width:100%;font-size:12px;color:#667"><summary>개발자 테스트</summary><button id="pleosDebug" type="button">SDK 예제 테스트</button></details>',
}
for old,new in replacements.items():
    if old in js:js=js.replace(old,new,1)
    elif new not in js:print('알림: 기존 안내 문구 형식이 달라서 건너뜀:',old[:50])

write_file(index,html)
write_file(nav,js)
write_file(target,source.read_text(encoding='utf-8'))
print('완료. Android Studio Rebuild → Run. API 서버 재시작 불필요.')
print('주의: 이 채팅은 앱 내부 Gleo 명령 처리 테스트이며, PLEOS 음성 대화 UI 자체를 실행하는 SDK 연동은 아닙니다.')
