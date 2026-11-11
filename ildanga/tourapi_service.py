"""KTO TourAPI KorService2 adapter for Ildanga. Keys only via environment."""
import os, json, re, time, urllib.parse, urllib.request, urllib.error

BASE='https://apis.data.go.kr/B551011/KorService2/'
AREAS={'전체':'','서울':'1','인천':'2','대전':'3','대구':'4','광주':'5','부산':'6','울산':'7','세종':'8','경기':'31','강원':'32','강릉':'32','충북':'33','충남':'34','경북':'35','경주':'35','경남':'36','전북':'37','전주':'37','전남':'38','제주':'39'}
THEMES={'전체':None,'빵투어':'빵','드라이브':'드라이브','카페':'카페','맛집':'맛집','역사문화':'역사','자연힐링':'자연','바다여행':'바다','데이트':'데이트'}
_CACHE={}
class TourError(Exception): pass

def call(endpoint, params):
    key=os.environ.get('TOURAPI_SERVICE_KEY','').strip()
    if not key: raise TourError('TourAPI 인증키가 설정되지 않았어요. 관광공사 연결 서버를 다시 실행해 주세요.')
    args={'serviceKey':key,'MobileOS':'ETC','MobileApp':'ildanga','_type':'json',**params}
    url=BASE+endpoint+'?'+urllib.parse.urlencode(args)
    try:
        with urllib.request.urlopen(urllib.request.Request(url,headers={'Accept':'application/json'}),timeout=15) as r: data=json.load(r)
    except urllib.error.HTTPError as e: raise TourError('TourAPI HTTP 오류 '+str(e.code)) from None
    except Exception: raise TourError('관광공사 API 연결에 실패했어요.') from None
    response=data.get('response',{})
    if response.get('header',{}).get('resultCode') not in ('0000','00',None):
        raise TourError('TourAPI 오류: '+str(response['header'].get('resultMsg','확인 필요'))[:100])
    body=response.get('body',{})
    return body if isinstance(body,dict) else {}

def items(body):
    rows=body.get('items') or {}
    rows=rows.get('item',[]) if isinstance(rows,dict) else []
    if isinstance(rows,dict):rows=[rows]
    return rows if isinstance(rows,list) else []

def cache(key, loader, ttl=900):
    now=time.monotonic(); hit=_CACHE.get(key)
    if hit and now-hit[0]<ttl:return hit[1]
    val=loader()
    if len(_CACHE)>100:_CACHE.clear()
    _CACHE[key]=(now,val)
    return val

def courses(params):
    region=(params.get('region') or ['전체'])[0]
    theme=(params.get('theme') or ['전체'])[0]
    if region not in AREAS or theme not in THEMES:raise TourError('지역이나 테마가 올바르지 않아요.')
    def load():
        base={'contentTypeId':'25','numOfRows':'30','pageNo':'1','arrange':'A'}
        if AREAS[region]:base['areaCode']=AREAS[region]
        keyword=THEMES[theme]
        if keyword:
            body=call('searchKeyword2',{**base,'keyword':keyword})
        else:body=call('areaBasedList2',base)
        out=[]
        for p in items(body):
            cid=str(p.get('contentid',''))
            if not cid.isdigit():continue
            # Keyword search can include unrelated types if an upstream version ignores the filter.
            if str(p.get('contenttypeid','25'))!='25':continue
            out.append({'id':cid,'title':str(p.get('title',''))[:150],
                'address':str(p.get('addr1',''))[:200],
                'region':region,'theme':theme,'provider':'한국관광공사 TourAPI',
                'image':str(p.get('firstimage','')) if str(p.get('firstimage','')).startswith('https://') else ''})
        return {'courses':out,'region':region,'theme':theme,'source':'한국관광공사 TourAPI 4.0',
            'notice':'검색 결과는 실제 관광공사 여행코스 콘텐츠입니다. 코스 내 개별 장소는 별도 조회해야 합니다.'}
    return cache(('courses',region,theme),load)

def course_details(params):
    cid=(params.get('id') or [''])[0]
    if not re.fullmatch(r'\d{1,18}',cid):raise TourError('코스 ID가 올바르지 않아요.')
    def load():
        common=items(call('detailCommon2',{'contentId':cid,'defaultYN':'Y','overviewYN':'Y'}))
        info=items(call('detailInfo2',{'contentId':cid,'contentTypeId':'25','numOfRows':'100','pageNo':'1'}))
        first=common[0] if common else {}
        stops=[]
        for x in info:
            name=str(x.get('subname','')).strip()
            if not name:continue
            stops.append({'name':name[:140],'description':re.sub('<[^>]*>',' ',str(x.get('subdetailoverview','')))[:350]})
        return {'id':cid,'title':str(first.get('title',''))[:160],
            'description':re.sub('<[^>]*>',' ',str(first.get('overview','')))[:600],
            'address':str(first.get('addr1',''))[:200],
            'stops':stops[:12],'source':'한국관광공사 TourAPI 4.0',
            'notice':'개별 방문지 좌표는 TourAPI 반복정보에서 제공되지 않을 수 있어 카카오 장소 확인이 필요합니다.'}
    return cache(('detail',cid),load,1800)

def match_stops(params, kakao_key):
    cid=(params.get('id') or [''])[0]
    details=course_details({'id':[cid]})
    if not kakao_key:raise TourError('카카오 API 키가 설정되지 않았어요.')
    from places_server import normalize_place
    import unicodedata
    def norm(x):return re.sub(r'[^\w]','',unicodedata.normalize('NFKC',x)).lower()
    resolved=[];unresolved=[]
    for item in details['stops'][:8]:
        name=item['name']; qs=urllib.parse.urlencode({'query':name,'size':15})
        req=urllib.request.Request('https://dapi.kakao.com/v2/local/search/keyword.json?'+qs,
             headers={'Authorization':'KakaoAK '+kakao_key,'Accept':'application/json'})
        try:
            with urllib.request.urlopen(req,timeout=10) as resp: payload=json.load(resp)
            exact=[p for p in payload.get('documents',[]) if norm(p.get('place_name',''))==norm(name)]
            if len(exact)!=1:
                unresolved.append(name);continue
            p=normalize_place(exact[0]);p['cat']='관광지';p['region']='';p['provider']='Kakao';resolved.append(p)
        except Exception:unresolved.append(name)
    return {'course':details,'places':resolved,'unresolved':unresolved,
            'notice':'카카오에서 장소명이 정확히 하나만 일치한 방문지만 가져왔어요. 미확인 장소는 임의로 매칭하지 않았습니다.'}


def photo(params):
    """Real photo for one place: nearest TourAPI item whose title matches the name. Empty image if none."""
    import unicodedata
    name = (params.get('name') or [''])[0].strip()
    try:
        lat = float((params.get('lat') or [''])[0]); lng = float((params.get('lng') or [''])[0])
    except ValueError:
        raise TourError('장소 이름과 좌표를 확인해 주세요.') from None
    if not 1 <= len(name) <= 100 or not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise TourError('장소 이름과 좌표를 확인해 주세요.')
    def norm(x): return re.sub(r'[^\w]', '', unicodedata.normalize('NFKC', str(x))).lower()
    def load():
        body = call('locationBasedList2', {'mapX': str(lng), 'mapY': str(lat), 'radius': '1500',
                                           'arrange': 'E', 'numOfRows': '40', 'pageNo': '1'})
        n = norm(name)
        for r in items(body):
            t = norm(r.get('title', ''))
            img = str(r.get('firstimage', '') or '')
            if img.startswith('http://') and '.visitkorea.or.kr' in img:
                img = 'https://' + img[len('http://'):]
            if n and t and (n in t or t in n) and img.startswith('https://'):
                return {'image': img, 'title': str(r.get('title', ''))[:100], 'source': '한국관광공사 TourAPI',
                        'license': str(r.get('cpyrhtDivCd', '') or '')}
        return {'image': ''}
    return cache('photo:' + norm(name) + ':' + str(round(lat, 3)) + ':' + str(round(lng, 3)), load, ttl=21600)
