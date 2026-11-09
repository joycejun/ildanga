"""Reuse existing setup, with a memory-only provider key."""
import os,getpass
from setup_connection import run
if __name__=='__main__':
    try:
        print('일단가 실제 후기 연결 · 기존 서버 창은 먼저 종료해 주세요.')
        print('SocialCrawl 무료 체험 키가 필요합니다. 유료 자동 충전은 켜지 마세요.')
        key=getpass.getpass('SocialCrawl API 키 (표시되지 않음): ').strip()
        if not key:raise RuntimeError('후기 API 키가 입력되지 않았어요.')
        os.environ['SOCIALCRAWL_API_KEY']=key
        print('이어서 기존 카카오 키로 장소 서버를 연결합니다. 후기 키 검증은 앱의 실제 조회 시 수행됩니다.')
        run()
    except KeyboardInterrupt:print('종료했습니다.')
    except Exception as e:print(str(e))
    finally:os.environ.pop('SOCIALCRAWL_API_KEY',None)
