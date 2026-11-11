"""Reuse existing setup, with a memory-only provider key."""
import os,getpass
from setup_connection import run
if __name__=='__main__':
    try:
        print('일단가 실제 후기 연결 · 기존 서버 창은 먼저 종료해 주세요.')
        print('SocialCrawl 무료 체험 키가 필요합니다. 유료 자동 충전은 켜지 마세요.')
        tour_key=getpass.getpass('한국관광공사 TourAPI 일반 인증키 (입력 내용 숨김): ').strip()
        if not tour_key:raise RuntimeError('TourAPI 인증키가 입력되지 않았어요.')
        os.environ['TOURAPI_SERVICE_KEY']=tour_key
        key=getpass.getpass('SocialCrawl API 키 (표시되지 않음): ').strip()
        if not key:raise RuntimeError('후기 API 키가 입력되지 않았어요.')
        os.environ['SOCIALCRAWL_API_KEY']=key
        print('이어서 기존 카카오 키로 장소 서버를 연결합니다. 후기 키 검증은 앱의 실제 조회 시 수행됩니다.')
        google_key = os.environ.get('GOOGLE_PLACES_API_KEY', '').strip()
        if not google_key:
            print('\nGoogle Places API (New) 키를 입력하세요. Google 후기를 사용하지 않으면 Enter로 건너뛰세요.')
            google_key = getpass.getpass('Google Places API 키 (입력 내용 숨김): ').strip()
        if google_key:
            os.environ['GOOGLE_PLACES_API_KEY'] = google_key
            print('Google 후기 키가 이번 서버 실행에만 설정되었습니다.')
        else:
            print('Google 후기 조회는 비활성화됩니다. 다른 기능은 계속 이용할 수 있습니다.')
        run()
    except KeyboardInterrupt:print('종료했습니다.')
    except Exception as e:print(str(e))
    finally:os.environ.pop('SOCIALCRAWL_API_KEY',None)
