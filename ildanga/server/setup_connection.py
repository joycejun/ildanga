"""Interactive Windows setup. Does not persist or print API secrets."""
import getpass,json,os,subprocess,sys,urllib.request,urllib.error
from pathlib import Path
from http.server import ThreadingHTTPServer
from places_server import Handler,search_places

def find_adb():
    roots=[]
    for name in ('ANDROID_SDK_ROOT','ANDROID_HOME'):
        if os.environ.get(name):roots.append(Path(os.environ[name]))
    if os.environ.get('LOCALAPPDATA'):roots.append(Path(os.environ['LOCALAPPDATA'])/'Android'/'Sdk')
    prop=Path(__file__).resolve().parents[1]/'local.properties'
    if prop.exists():
        for line in prop.read_text(encoding='utf-8').splitlines():
            if line.startswith('sdk.dir='):roots.insert(0,Path(line.split('=',1)[1].replace('\\:',':').replace('\\\\','\\')))
    for root in roots:
        candidate=root/'platform-tools'/('adb.exe' if os.name=='nt' else 'adb')
        if candidate.is_file():return str(candidate)
    import shutil
    return shutil.which('adb')

def devices(adb):
    output=subprocess.check_output([adb,'devices'],text=True,encoding='utf-8',errors='replace',timeout=20)
    return [line.split()[0] for line in output.splitlines()[1:] if len(line.split())>=2 and line.split()[1]=='device']

def run():
    print('일단가 · 카카오 장소 검색 연결 설정\nPLEOS 에뮬레이터를 켜 둔 상태에서 진행하세요.\n')
    adb=find_adb()
    if not adb:
        entered=input('Android SDK platform-tools의 adb.exe 전체 경로를 입력하세요: ').strip().strip('"')
        if not Path(entered).is_file():raise RuntimeError('adb.exe를 찾지 못했어요. Android Studio SDK Manager에서 SDK 경로를 확인해 주세요.')
        adb=entered
    found=devices(adb)
    if not found:raise RuntimeError('연결된 기기가 없어요. PLEOS가 완전히 켜진 다음 다시 실행하세요.')
    print('연결된 기기:')
    for i,serial in enumerate(found,1):
        try:name=subprocess.check_output([adb,'-s',serial,'emu','avd','name'],text=True,encoding='utf-8',errors='replace',timeout=5).splitlines()[0]
        except Exception:name='기기'
        print(f'  {i}. {serial} ({name})')
    if len(found)==1:serial=found[0]
    else:
        index=int(input('PLEOS 기기의 번호: '))-1
        if not 0<=index<len(found):raise RuntimeError('올바른 기기 번호를 선택해 주세요.')
        serial=found[index]
    print('\n카카오 개발자 앱의 REST API 키를 입력하세요. 입력 내용은 화면에 표시하지 않습니다.')
    print('키가 없다면 https://developers.kakao.com 에서 먼저 발급해 주세요.')
    key=os.environ.get('KAKAO_REST_API_KEY') or getpass.getpass('REST API 키: ').strip()
    if not key:raise RuntimeError('키가 입력되지 않았어요. 발급 후 다시 실행해 주세요.')
    print('키와 장소 검색 권한 확인 중…')
    try:
        result=search_places({'query':['성심당'],'lat':['36.3277'],'lng':['127.4273'],'radius':['5000']},key)
    except urllib.error.HTTPError as e:
        if e.code in (401,403):raise RuntimeError('키 또는 장소 검색 사용 권한이 맞지 않아요. REST API 키와 사용 설정을 확인해 주세요.') from None
        raise RuntimeError('장소 제공사 응답 오류: '+str(e.code)) from None
    except Exception:raise RuntimeError('카카오 연결에 실패했어요. 학교 네트워크 연결을 확인해 주세요.') from None
    os.environ['KAKAO_REST_API_KEY']=key
    print(f'실제 API 연결 성공 · 검색 결과 {len(result["places"])}곳')
    try:server=ThreadingHTTPServer(('127.0.0.1',8765),Handler)
    except OSError:raise RuntimeError('8765 포트가 사용 중이에요. 이전에 열어둔 일단가 서버 창을 닫고 다시 실행하세요.') from None
    try:
        subprocess.run([adb,'-s',serial,'reverse','tcp:8765','tcp:8765'],check=True,timeout=15,capture_output=True)
        print('\n설정 완료! 일단가에서 [다른 빵집 찾기 → 주변 검색]을 눌러 보세요.')
        print('이 창을 열어 두세요. 닫으면 장소 검색 연결이 종료됩니다. 키는 파일에 저장되지 않습니다.')
        server.serve_forever()
    finally:
        server.server_close()
        try:subprocess.run([adb,'-s',serial,'reverse','--remove','tcp:8765'],capture_output=True,timeout=5)
        except Exception:pass
        os.environ.pop('KAKAO_REST_API_KEY',None)
if __name__=='__main__':
    try:run()
    except KeyboardInterrupt:print('\n서버를 종료했습니다.')
    except Exception as e:print('\n설정하지 못했어요:',str(e));sys.exit(1)
