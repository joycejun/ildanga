"""Prepare 15 existing course places serially; resume from successful local cache."""
import json,os,getpass,math
from pathlib import Path
import review_cache
from reviews_service import find_places,summary,ReviewError

def matches(p,c):
    norm=lambda s:''.join(str(s).split())
    try:return norm(p['name'])==norm(c['name']) and math.hypot((float(c['lat'])-p['lat'])*111,(float(c['lng'])-p['lng'])*88)<.3
    except (ValueError,TypeError,KeyError):return False

def run():
    places=json.loads(Path(__file__).with_name('prewarm_places.json').read_text(encoding='utf8'))
    print('5개 지역 × 3곳 = 15곳 후기 사전 준비')
    print('외부 API 크레딧이 사용됩니다. 성공한 요약은 7일간 재사용합니다.')
    print('Ollama를 켜 두세요. 원문과 API 키는 저장하지 않습니다.')
    if not os.environ.get('SOCIALCRAWL_API_KEY'):os.environ['SOCIALCRAWL_API_KEY']=getpass.getpass('SocialCrawl API 키 (표시 안 됨): ').strip()
    ok=0;report=[]
    for i,p in enumerate(places,1):
        print(f"[{i}/15] {p['region']} · {p['name']}",flush=True)
        try:
            candidates=find_places({'query':[p['region']+' '+p['name']]})['places']
            selected=[c for c in candidates if matches(p,c)]
            if len(selected)!=1:raise ReviewError('이름·위치가 유일하게 일치하지 않아 건너뜀 (다른 장소 후기 사용 안 함)')
            pid=selected[0]['id'];result=review_cache.get('summary',pid)
            if result is None:
                result=summary({'id':[pid]})
                if not result.get('sentences'):raise ReviewError(result.get('notice','반복된 의견 부족'))
                review_cache.save_summary(pid,result)
            ok+=1;message='준비 완료 · '+str(len(result['sentences']))+'문단'
        except Exception as e:message='미완료 · '+str(e)
        report.append({'region':p['region'],'name':p['name'],'result':message})
        print(message,flush=True)
    Path(__file__).with_name('prewarm_report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
    print(f'완료 {ok}/15곳. 결과: server/prewarm_report.json')
    print('이 폴더의 CONNECT_REVIEWS.cmd로 연결 서버를 실행하세요.')
if __name__=='__main__':
    try:run()
    except KeyboardInterrupt:print('중단됨. 다음 실행 시 성공한 요약은 재사용합니다.')
    finally:os.environ.pop('SOCIALCRAWL_API_KEY',None)
