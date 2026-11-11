"""Ildanga unified route search: KTO official courses + Kakao grounded route suggestions.

Only server-side process environment keys; no private keys are included in JSON output.
All route suggestions are explicitly app-generated, not KTO-curated.
"""
import math
import re
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import json
from collections import OrderedDict

from tourapi_service import call, items, cache, TourError, AREAS
from places_server import normalize_place

# For selecting geographically plausible results; these are city centers, not final stops.
REGIONS = {
    '서울': (37.5665,126.9780,'서울'), '부산': (35.1796,129.0756,'부산'),
    '인천': (37.4563,126.7052,'인천'), '대구': (35.8714,128.6014,'대구'),
    '대전': (36.3504,127.3845,'대전'), '광주': (35.1595,126.8526,'광주'),
    '울산': (35.5384,129.3114,'울산'), '세종': (36.4800,127.2890,'세종'),
    '수원': (37.2636,127.0286,'경기'), '성남': (37.4200,127.1265,'경기'),
    '광명': (37.4786,126.8645,'경기'), '용인': (37.2411,127.1776,'경기'),
    '파주': (37.7599,126.7800,'경기'), '양평': (37.4918,127.4876,'경기'),
    '가평': (37.8315,127.5096,'경기'), '춘천': (37.8813,127.7298,'강원'),
    '강릉': (37.7519,128.8761,'강원'), '속초': (38.2070,128.5918,'강원'),
    '동해': (37.5248,129.1143,'강원'), '삼척': (37.4500,129.1650,'강원'),
    '경주': (35.8562,129.2247,'경북'), '안동': (36.5684,128.7294,'경북'),
    '포항': (36.0190,129.3435,'경북'), '전주': (35.8242,127.1480,'전북'),
    '군산': (35.9677,126.7366,'전북'), '여수': (34.7604,127.6622,'전남'),
    '순천': (34.9506,127.4872,'전남'), '목포': (34.8118,126.3922,'전남'),
    '남해': (34.8377,127.8925,'경남'), '통영': (34.8544,128.4332,'경남'),
    '거제': (34.8806,128.6212,'경남'), '창원': (35.2279,128.6811,'경남'),
    '마산': (35.1984,128.5678,'경남'), '진주': (35.1803,128.1076,'경남'),
    '제주': (33.4996,126.5312,'제주'), '서귀포': (33.2541,126.5601,'제주'),
    '청주': (36.6424,127.4890,'충북'), '충주': (36.9910,127.9259,'충북'),
    '천안': (36.8151,127.1139,'충남'), '공주': (36.4466,127.1190,'충남'),
    '보령': (36.3335,126.6128,'충남'), '태안': (36.7456,126.2980,'충남'),
    '경기':(37.4138,127.5183,'경기'), '강원':(37.8228,128.1555,'강원'),
    '경북':(36.4919,128.8889,'경북'), '경남':(35.4606,128.2132,'경남'),
    '전북':(35.7175,127.1530,'전북'), '전남':(34.8161,126.4629,'전남'),
    '충북':(36.6357,127.4914,'충북'), '충남':(36.6588,126.6728,'충남'),
}
# Surface a broad set of filters while keeping categories explainable.
THEMES = {
 '전체': ('관광지', '명소'),
 '빵투어': ('빵집', '베이커리'), '카페': ('카페', '커피'),
 '맛집': ('맛집', '음식점'), '드라이브': ('전망대', '관광지'),
 '데이트': ('공원', '카페'), '역사문화': ('문화재', '박물관'),
 '자연힐링': ('수목원', '자연휴양림'), '바다여행': ('해수욕장', '바다'),
 '야경': ('전망대', '야경'), '가족여행': ('박물관', '공원'),
 '반려동물': ('반려견 동반', '애견동반'), '산책': ('공원', '산책'),
 '축제': ('축제', '관광지'), '시장투어': ('전통시장', '시장'),
 '쇼핑': ('쇼핑몰', '전통시장'), '캠핑': ('캠핑장', '야영장'),
}
THEME_WORDS = {
 '빵투어':['빵투어','빵집','베이커리','빵지순례'], '카페':['카페','커피','디저트'],
 '맛집':['맛집','먹거리','음식','식당'], '드라이브':['드라이브','드라이빙','드라이브코스'],
 '데이트':['데이트','연인','커플'], '역사문화':['역사','문화','유적','박물관'],
 '자연힐링':['힐링','자연','숲','수목원','휴양'], '바다여행':['바다','해변','해수욕장'],
 '야경':['야경','노을'], '가족여행':['가족','아이와','어린이'],
 '반려동물':['반려동물','반려견','강아지'], '산책':['산책','걷기','공원'],
 '축제':['축제','페스티벌'], '시장투어':['시장','전통시장'],
 '쇼핑':['쇼핑','아울렛'], '캠핑':['캠핑','차박'],
}
STOPWORDS = ('여행', '코스', '추천', '해줘', '해주세요', '가고싶어', '어디', '갈만한', '찾아줘', '좋은', '분위기', '근처', '주변', '여행지')


def _q(params,name,default=''):
    v=params.get(name,[default]);return (v[0] if isinstance(v,list) else v or default).strip()

def _distance(a,b):
    d=math.pi/180;dy=(b['lat']-a['lat'])*d;dx=(b['lng']-a['lng'])*d
    return 6371*2*math.asin(math.sqrt(math.sin(dy/2)**2+math.cos(a['lat']*d)*math.cos(b['lat']*d)*math.sin(dx/2)**2))

def _pick_region(text, explicit):
    if explicit and explicit!='전체':return explicit
    # Longest first so e.g. 서귀포 wins over 제주 if both appear.
    for r in sorted(REGIONS,key=len,reverse=True):
        if r in text:return r
    return '전체'

def _pick_theme(text, explicit):
    if explicit and explicit!='전체':return explicit
    for theme, terms in THEME_WORDS.items():
        if any(t in text for t in terms):return theme
    return '전체'

def _search_term(text,region,theme):
    s=text.replace(region,'') if region!='전체' else text
    for t in THEME_WORDS.get(theme,[]):s=s.replace(t,' ')
    for t in STOPWORDS:s=s.replace(t,' ')
    return re.sub(r'\s+',' ',s).strip()[:35]

def _tour_region(region):
    if region in AREAS and AREAS[region]:return AREAS[region]
    if region in REGIONS:return AREAS.get(REGIONS[region][2],'')
    return ''

def _official_candidates(region,theme,search_term):
    """Only KTO content type 25. Do not use a single keyword as the only filter."""
    area=_tour_region(region)
    base={'contentTypeId':'25','numOfRows':'60','pageNo':'1','arrange':'A'}
    if area:base['areaCode']=area
    found=OrderedDict()
    # Prefer region-based listing. Query all official courses rather than only title keywords.
    for page in range(1,3):
        b=call('areaBasedList2',{**base,'pageNo':str(page)})
        rows=items(b)
        for p in rows:
            if str(p.get('contenttypeid','25'))!='25':continue
            title=str(p.get('title') or '')[:150]
            cid=str(p.get('contentid') or '')
            if not title or not cid.isdigit():continue
            address=str(p.get('addr1') or '')[:220]
            if region in REGIONS and region not in AREAS and region not in ('전체',):
                # city (e.g. 강릉) must occur in address unless already in title
                if region not in title and region not in address:continue
            found[cid]={'id':cid,'title':title,'address':address,'image':str(p.get('firstimage') or '')[:500],
                        'source':'한국관광공사 TourAPI','kind':'official'}
        total=int(b.get('totalCount') or 0)
        if total<=page*60 or not rows:break
    # Theme filtering for official route titles remains deliberately conservative.
    keywords=THEME_WORDS.get(theme,[]) + ([search_term] if search_term else [])
    if theme!='전체' or search_term:
        for entry in found.values():
            score=sum(1 for t in keywords if t in (entry['title']+' '+entry['address']))
            entry['_score']=score
        found=OrderedDict((k,v) for k,v in found.items() if v['_score']>0)
    if not found and (search_term or theme!='전체'):
        words=([search_term] if search_term else []) + THEME_WORDS.get(theme,[])[:1]
        for word in words[:2]:
            if not word:continue
            b=call('searchKeyword2',{**base,'keyword':word})
            for p in items(b):
                if str(p.get('contenttypeid','25'))!='25':continue
                title=str(p.get('title') or '')[:150];cid=str(p.get('contentid') or '')
                addr=str(p.get('addr1') or '')[:220]
                if not title or not cid.isdigit():continue
                if region!='전체' and region not in title+' '+addr and region not in AREAS:continue
                found[cid]={'id':cid,'title':title,'address':addr,'image':str(p.get('firstimage') or '')[:500],
                            'source':'한국관광공사 TourAPI','kind':'official'}
    return list(found.values())[:24]


def _kakao_query(term,key,center=None):
    args={'query':term,'size':15,'page':1}
    if center and center[2] not in ('경기','강원','경북','경남','전북','전남','충남','충북'):
        # avoid a 5km cutoff for a metropolitan region
        args.update({'y':center[0],'x':center[1],'radius':20000,'sort':'accuracy'})
    req=urllib.request.Request('https://dapi.kakao.com/v2/local/search/keyword.json?'+urllib.parse.urlencode(args),
          headers={'Authorization':'KakaoAK '+key,'Accept':'application/json'})
    with urllib.request.urlopen(req,timeout=12) as res:payload=json.load(res)
    return payload.get('documents',[])


def _kakao_routes(region,theme,term,raw,key):
    if not key:return [],'카카오 장소 API 키가 없어 자동 코스를 만들 수 없어요.'
    center=REGIONS.get(region)
    base=region+' ' if region!='전체' else ''
    # Specific free text (e.g. 성수 브런치) takes precedence over generic theme label.
    words=[]
    if raw and raw not in words:words.append(raw)
    if term:words.append(base+term)
    for t in THEMES.get(theme,THEMES['전체']):words.append(base+t)
    words=list(dict.fromkeys(w.strip() for w in words if w.strip()))[:3]
    matches=OrderedDict();errors=[]
    for word in words:
        try:
            docs=_kakao_query(word,key,center)
            for p in docs:
                try:
                    item=normalize_place(p)
                    if item['id'] in matches:continue
                    addr=item['address']
                    if region!='전체' and center:
                        # Prefer address match, particularly in city/town-level searches.
                        if region not in addr and region not in item['name']:
                            continue
                    item['cat']=theme if theme!='전체' else '관광지';item['region']=region if region!='전체' else '여행'
                    matches[item['id']]=item
                except (KeyError, ValueError, TypeError):continue
        except urllib.error.HTTPError as e:errors.append('카카오 API 오류 '+str(e.code));break
        except Exception:errors.append('카카오 장소 검색에 실패했어요.');break
        if len(matches)>=20:break
    pts=list(matches.values())
    if len(pts)<2:return [],(errors[0] if errors else '조건에 맞는 실제 장소가 2곳 이상 검색되지 않았어요.')
    # Pick a compact cluster using real place coordinates. No fabricated POIs.
    # First result from relevance-ranked provider; then nearest available within 12 km.
    head=pts[0];selected=[head];unused=pts[1:]
    while unused and len(selected)<5:
        near=min(unused,key=lambda p:_distance(selected[-1],p))
        if _distance(selected[-1],near)>12:break
        selected.append(near);unused.remove(near)
    if len(selected)<2:return [],'검색 장소가 서로 너무 멀어서 하나의 여행 코스로 묶지 않았어요.'
    route={'id':'auto:'+theme+':'+region,'kind':'generated','title':(region+' ' if region!='전체' else '')+(theme if theme!='전체' else term or '추천')+' 코스',
           'region':region,'theme':theme,'stops':selected,'source':'Kakao Places',
           'notice':'카카오의 실제 장소를 일단가가 거리 기준으로 조합한 코스입니다. 공식 관광공사 코스나 추천 인기순위가 아니며 영업시간·도로 이동시간은 미확인입니다.'}
    return [route],(errors[0] if errors else '')


from smart_routes import build_routes as _smart_kakao_routes
_kakao_routes = _smart_kakao_routes

def discover(params,kakao_key):
    raw=unicodedata.normalize('NFKC',_q(params,'query'))
    explicit_region=_q(params,'region','전체') or '전체'
    explicit_theme=_q(params,'theme','전체') or '전체'
    if len(raw)>80:raise TourError('검색어는 80자 이내로 입력해 주세요.')
    if explicit_theme not in THEMES:raise TourError('지원하지 않는 테마입니다.')
    if len(explicit_region)>30:raise TourError('지역명이 너무 깁니다.')
    region=_pick_region(raw,explicit_region)
    theme=_pick_theme(raw,explicit_theme)
    term=_search_term(raw,region,theme)
    warning=[];official=[];generated=[]
    # Never fail entire result just because one source is unavailable.
    if __import__('os').environ.get('TOURAPI_SERVICE_KEY'):
        try:official=cache(('discover-official',region,theme,term),lambda:_official_candidates(region,theme,term),900)
        except Exception as e:warning.append('관광공사 코스 조회 불가: '+str(e)[:120] if isinstance(e,TourError) else '관광공사 API 응답을 확인하지 못했어요.')
    else:warning.append('관광공사 인증키가 없어 공식 코스는 검색하지 않았어요.')
    try:
        generated,note=cache(('discover-kakao',region,theme,term,raw),lambda:_kakao_routes(region,theme,term,raw,kakao_key),300)
        if note:warning.append(note)
    except Exception:warning.append('카카오 코스 구성 중 오류가 발생했어요.')
    return {'query':raw,'region':region,'theme':theme,'official':official,'generated':generated,
            'warnings':warning,'sourceInfo':'공식 코스: 한국관광공사 TourAPI · 자동 구성: 카카오 장소 검색 기반',
            'notice':'빈 검색 결과는 무관한 코스를 만들어 채우지 않습니다. 추천 결과는 실제 장소의 위치 기반 구성으로 영업/도로/혼잡 정보가 반영되지 않습니다.'}
