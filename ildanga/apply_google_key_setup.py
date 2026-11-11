from pathlib import Path
import sys, shutil

root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
path=root/'server'/'setup_reviews.py'
if not path.is_file():
    raise SystemExit(f'ERROR: Cannot find {path}. Run from the main Android project folder.')
s=path.read_text(encoding='utf-8-sig')
marker='        run()'
if 'GOOGLE_PLACES_API_KEY' in s and 'getpass.getpass' in s and 'Google Places' in s:
    print('Google key prompt already appears to be configured. No changes made.')
    sys.exit(0)
if s.count(marker)!=1:
    raise SystemExit('ERROR: setup_reviews.py has unexpected structure; left untouched. Send this file for a tailored fix.')
insert='''        google_key = os.environ.get('GOOGLE_PLACES_API_KEY', '').strip()
        if not google_key:
            print('\\nGoogle Places API (New) 키를 입력하세요. Google 후기를 사용하지 않으면 Enter로 건너뛰세요.')
            google_key = getpass.getpass('Google Places API 키 (입력 내용 숨김): ').strip()
        if google_key:
            os.environ['GOOGLE_PLACES_API_KEY'] = google_key
            print('Google 후기 키가 이번 서버 실행에만 설정되었습니다.')
        else:
            print('Google 후기 조회는 비활성화됩니다. 다른 기능은 계속 이용할 수 있습니다.')
'''
s=s.replace(marker,insert+marker)
# remove from environment at shutdown; avoid accidentally removing pre-existing user environment settings
# only the process exits at the end of setup script, so secrets are never persisted
shutil.copy2(path,path.with_suffix('.py.before_google_key.bak'))
path.write_text(s,encoding='utf-8')
print('SUCCESS: added Google Places API key prompt to CONNECT_REVIEWS.cmd startup flow.')
