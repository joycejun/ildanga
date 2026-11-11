"""Patch only PLEOS navigation to honor a 2-waypoint limit, keeping existing integrations."""
from pathlib import Path
import shutil,sys
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
here=Path(__file__).resolve().parent
main=root/'app/src/main/java/com/example/dateapp/MainActivity.java'
bridge=root/'app/src/main/assets/pleos-route-link.js'
source=here/'pleos-route-link.js'
if not main.exists() or not bridge.exists():
    raise SystemExit('오류: 기존 내비 패치가 적용된 ildanga 폴더에서 실행하세요. (Java 또는 pleos-route-link.js 없음)')
java=main.read_text(encoding='utf-8')
if 'class NavigationBridge' not in java or 'sendNavigationRoute(org.json.JSONObject route)' not in java:
    raise SystemExit('오류: NaviHelper 연결 코드가 예상과 달라 변경하지 않았습니다.')
needle='if(stops.length()<1||stops.length()>6)throw new IllegalArgumentException("1~6개 방문지까지 지원합니다.");'
replacement='if(stops.length()<1||stops.length()>3)throw new IllegalArgumentException("PLEOS 1회 요청은 경유지 2곳과 목적지 1곳까지 지원합니다. 구간별 안내를 이용해 주세요.");'
if needle in java:
    java=java.replace(needle,replacement,1)
elif replacement not in java:
    raise SystemExit('오류: 방문지 개수 검증 코드가 예상과 달라 변경하지 않았습니다.')
# Avoid ever evaluating THIRD, even when enum hotfix has not been applied.
if 'WaypointIndex.valueOf(positions[i])' in java:
    java=java.replace('WaypointIndex.valueOf(positions[i])', 'WaypointIndex.valueOf(i==0?"FIRST":"SECOND")',1)
if '"FIRST","SECOND","THIRD","FOURTH","FIFTH"' in java:
    java=java.replace('"FIRST","SECOND","THIRD","FOURTH","FIFTH"','"FIRST","SECOND"')
# Only write if all preconditions checked.
if java != main.read_text(encoding='utf-8'):
    bak=main.with_name('MainActivity.java.before-segment-nav.bak')
    if not bak.exists():shutil.copy2(main,bak)
    main.write_text(java,encoding='utf-8')
    print('수정: MainActivity.java (최대 2개 경유지)')
js=source.read_text(encoding='utf-8')
if js!=bridge.read_text(encoding='utf-8'):
    bak=bridge.with_name('pleos-route-link.js.before-segment-nav.bak')
    if not bak.exists():shutil.copy2(bridge,bak)
    bridge.write_text(js,encoding='utf-8')
    print('수정: pleos-route-link.js (구간별 내비 UI)')
print('적용 완료. Gradle Sync → Rebuild → Run (검색 서버 변경 없음)')
