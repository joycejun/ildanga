"""Idempotent smart-route alternatives + Pleos SDK bridge patch for the existing project."""
from pathlib import Path
import re,sys,shutil,py_compile
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
here=Path(__file__).resolve().parent
paths={
 'main':root/'app/src/main/java/com/example/dateapp/MainActivity.java',
 'gradle':root/'app/build.gradle',
 'settings':root/'settings.gradle',
 'manifest':root/'app/src/main/AndroidManifest.xml',
 'index':root/'app/src/main/assets/index.html',
 'routes':root/'server/smart_routes.py',
 'bridge':root/'app/src/main/assets/pleos-route-link.js',
}
for k in ['main','gradle','settings','manifest','index','routes']:
 if not paths[k].is_file():raise SystemExit('필요한 파일 없음: '+str(paths[k]))
main=paths['main'].read_text(encoding='utf-8')
gradle=paths['gradle'].read_text(encoding='utf-8')
settings=paths['settings'].read_text(encoding='utf-8')
manifest=paths['manifest'].read_text(encoding='utf-8')
index=paths['index'].read_text(encoding='utf-8')
if 'private WebView web;' not in main or 'web = new WebView(this);' not in main:raise SystemExit('Java WebView 구조가 달라 중단. 파일은 변경하지 않았습니다.')
if '<script src="tour-courses.js"></script>' not in index:raise SystemExit('Tour 코스 화면을 찾지 못해 중단했습니다.')
if 'mavenCentral()' not in settings:raise SystemExit('settings.gradle 저장소 구성이 다릅니다.')
nav_code=(here/'pleos_nav_section.txt').read_text(encoding='utf-8')
if 'class NavigationBridge' not in main:
 imports='''import ai.pleos.playground.navi.helper.NaviHelper;
import ai.pleos.playground.navi.data.RouteInfo;
import ai.pleos.playground.navi.data.RouteWithWaypointsRequest;
import ai.pleos.playground.navi.data.RequestWaypointInfo;
import ai.pleos.playground.navi.constants.WaypointIndex;
import kotlin.Unit;
import java.util.ArrayList;
import java.util.List;
'''
 main=main.replace('public class MainActivity extends Activity {',imports+'\npublic class MainActivity extends Activity {',1)
 main=main.replace(' private WebView web;', ' private WebView web;\n'+nav_code,1)
 main=main.replace('web = new WebView(this);','web = new WebView(this);\n  web.addJavascriptInterface(new NavigationBridge(),"IldangaNavigation");\n  initNavigation();',1)
 # Inject cleanup directly before the lifecycle superclass call (works with multiline or compact Java).
 if 'onDestroy()' not in main or 'super.onDestroy();' not in main:
  raise SystemExit('onDestroy()를 찾지 못했습니다.')
 cleanup='if (naviHelper != null) { naviHelper.release(); naviHelper=null; }\n  navHandler.removeCallbacksAndMessages(null);\n  '
 pos=main.rfind('super.onDestroy();')
 main=main[:pos]+cleanup+main[pos:]
if "NaviHelper:3.0.5" not in gradle:
 gradle+='\n\ndependencies { implementation \'ai.pleos.playground:NaviHelper:3.0.5\' }\n'
if 'nexus-playground.pleos.ai' not in settings:
 needle='dependencyResolutionManagement'
 pos=settings.find(needle)
 if pos<0:raise SystemExit('dependencyResolutionManagement 설정을 찾지 못했습니다.')
 start=settings.find('repositories {',pos)
 if start<0:raise SystemExit('의존성 저장소 선언을 찾지 못했습니다.')
 at=start+len('repositories {')
 settings=settings[:at]+' maven { url "https://nexus-playground.pleos.ai/repository/maven-releases/" };'+settings[at:]
for perm in ['pleos.car.permission.NAVI_ROUTE_SEARCH','pleos.car.permission.NAVI_CUSTOM_MAP']:
 if perm not in manifest:
  manifest=manifest.replace('<application ',f'<uses-permission android:name="{perm}"/>\n<application ',1)
if 'pleos-route-link.js' not in index:
 index=index.replace('</body>','<script src="pleos-route-link.js"></script></body>',1)
# copy dedicated file after backups; repeated runs remain safe
updated={'main':main,'gradle':gradle,'settings':settings,'manifest':manifest,'index':index}
for k,s in updated.items():
 old=paths[k].read_text(encoding='utf-8')
 if s!=old:
  bak=paths[k].with_name(paths[k].name+'.before-smart-nav.bak')
  if not bak.exists():shutil.copy2(paths[k],bak)
  paths[k].write_text(s,encoding='utf-8')
  print('수정:',paths[k].name)
shutil.copy2(here/'smart_routes.py',paths['routes'])
shutil.copy2(here/'pleos-route-link.js',paths['bridge'])
print('완료. CONNECT_REVIEWS.cmd 재시작 → Gradle Sync → Rebuild/Run')
print('새로운 자동 코스는 실제 카카오 결과가 충분할 때만 여러 개 표시합니다.')
print('PLEOS 좌표 경로의 실제 수락 여부는 차량 내비에서 확인해야 합니다.')
