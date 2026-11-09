import getpass,os,runpy
from pathlib import Path
print('일단가 장소 검색 연결 서버')
print('카카오 REST API 키는 이 컴퓨터에서만 사용하며 앱에 포함하지 않습니다.')
if not os.environ.get('KAKAO_REST_API_KEY'):
 os.environ['KAKAO_REST_API_KEY']=getpass.getpass('카카오 REST API 키 입력 (화면에 표시되지 않음): ').strip()
if not os.environ.get('KAKAO_REST_API_KEY'):raise SystemExit('키가 입력되지 않아 종료합니다.')
runpy.run_path(str(Path(__file__).with_name('places_server.py')),run_name='__main__')
