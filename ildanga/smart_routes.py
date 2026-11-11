"""Ildanga theme-aware multi-route builder using only real Kakao place results.
No API secrets on disk; no fabricated ratings/hours/route metrics.
"""
import json
import math
import re
import urllib.parse
import urllib.request
import urllib.error

from places_server import normalize_place

# Neighborhood centers are SEARCH ANCHORS, never automatically proposed stops.
NEIGHBORHOODS = {
 '서울': [('성수·서울숲',37.5445,127.0557),('연남·홍대',37.5662,126.9241),('익선·종로',37.5742,126.9891)],
 '부산': [('광안리',35.1532,129.1186),('해운대',35.1631,129.1634),('송정',35.1785,129.1994)],
 '대전': [('은행·중앙로',36.3281,127.4285),('둔산',36.3536,127.3773),('유성',36.3615,127.3449)],
 '강릉': [('안목',37.7715,128.9480),('경포',37.7972,128.9023),('주문진',37.8930,128.8231)],
 '경주': [('황리단길',35.8376,129.2100),('보문',35.8472,129.2893)],
 '제주': [('제주시',33.5001,126.5314),('애월',33.4608,126.3104),('함덕',33.5430,126.669)],
 '전주': [('한옥마을',35.8150,127.1535),('객사',35.8218,127.1463)],
 '인천': [('송도',37.3902,126.6433),('개항장',37.4735,126.6208)],
}
# Each itinerary is intentionally mixed rather than 5 repetitive cafes.
PATTERNS = {
 '카페': [('카페','카페'),('명소','공원'),('카페','디저트 카페')],
 '빵투어': [('빵집','베이커리'),('빵집','빵집'),('카페','카페')],
 '맛집': [('맛집','음식점'),('카페','카페'),('명소','공원')],
 '데이트': [('맛집','음식점'),('카페','카페'),('명소','공원')],
 '드라이브': [('명소','전망대'),('명소','관광명소'),('카페','카페')],
 '자연힐링': [('명소','자연공원'),('명소','산책로'),('카페','카페')],
 '바다여행': [('명소','해수욕장'),('카페','바다 카페'),('명소','전망대')],
 '역사문화': [('명소','문화재'),('명소','박물관'),('카페','카페')],
 '야경': [('명소','전망대'),('맛집','음식점'),('명소','야경')],
 '가족여행': [('명소','박물관'),('맛집','음식점'),('명소','공원')],
 '산책': [('명소','공원'),('카페','카페'),('명소','산책로')],
 '쇼핑': [('명소','쇼핑몰'),('카페','카페'),('맛집','음식점')],
 '시장투어': [('명소','전통시장'),('맛집','음식점'),('카페','카페')],
 '반려동물': [('명소','반려견 동반 공원'),('카페','애견동반 카페'),('명소','산책로')],
 '캠핑': [('명소','캠핑장'),('명소','관광지'),('카페','카페')],
 '축제': [('명소','축제'),('맛집','음식점'),('카페','카페')],
 '전체': [('명소','관광지'),('맛집','음식점'),('카페','카페')],
}
SEARCH_TERMS = {'카페':['카페','디저트 카페'],'빵집':['베이커리','빵집'],'맛집':['맛집','음식점'],'명소':['공원','관광지']}
KEYWORD_ACCEPT = {
 '카페':('카페','커피','디저트','찻집','티룸','카페거리'),
 '빵집':('베이커리','제과','빵집','제빵','빵','도넛','크루아상','파이'),
 '맛집':('음식점','한식','중식','일식','양식','분식','식당','레스토랑','국수','고기','횟집'),
 '명소':('관광','명소','공원','박물관','미술관','유적','문화재','전망','산책','해변','해수욕장','시장','쇼핑','휴양림','숲','캠핑','야영','축제','길'),
}
# For more specific requested stop types, require a keyword match; do not silently substitute unrelated places.
SPECIAL = {
 '전망대':('전망','전망대','스카이워크','타워'),
 '해수욕장':('해수욕장','해변','해수'),
 '문화재':('문화재','유적','궁','릉','사찰','한옥'),
 '박물관':('박물관','과학관','미술관'),
 '자연공원':('공원','숲','휴양림','수목원','자연'),
 '산책로':('공원','산책로','길','숲'),
 '전통시장':('시장','전통시장'),
 '쇼핑몰':('백화점','쇼핑몰','아울렛'),
 '캠핑장':('캠핑','야영','글램핑'),
 '축제':('축제','페스티벌'),
 '야경':('전망','야경','타워','공원'),
 '관광명소':('관광','전망','해변','공원','명소'),
 '반려견 동반 공원':('공원','애견','반려견'),
 '애견동반 카페':('애견','반려','펫'),
 '바다 카페':('카페','커피'),
 '베이커리':('빵','베이커리','제과','도넛','파이'),
 '빵집':('빵','베이커리','제과','도넛','파이'),
 '디저트 카페':('카페','디저트','커피'),
}

def km(a,b):
    d=math.pi/180;dy=(a['lat']-b['lat'])*d;dx=(a['lng']-b['lng'])*d
    v=math.sin(dy/2)**2+math.cos(a['lat']*d)*math.cos(b['lat']*d)*math.sin(dx/2)**2
    return 12742*math.asin(min(1,math.sqrt(v)))

def query_kakao(text,lat,lng,key,radius=3500):
    qs=urllib.parse.urlencode({'query':text,'x':lng,'y':lat,'radius':radius,'size':15,'sort':'distance'})
    req=urllib.request.Request('https://dapi.kakao.com/v2/local/search/keyword.json?'+qs, headers={'Authorization':'KakaoAK '+key,'Accept':'application/json'})
    with urllib.request.urlopen(req,timeout=12) as resp:return json.load(resp).get('documents',[])

def acceptable(raw,kind,specific):
    words=(' '.join((str(raw.get('category_name') or ''),str(raw.get('place_name') or '')))).lower()
    if not any(x in words for x in KEYWORD_ACCEPT[kind]):return False
    # Specific name matching makes the overall itinerary correspond to the intended theme.
    if specific in SPECIAL and kind=='명소' and not any(x in words for x in SPECIAL[specific]):return False
    if specific in ('애견동반 카페','반려견 동반 공원') and not any(x in words for x in SPECIAL[specific]):return False
    return True

def build_routes(region,theme,term,raw,key):
    if not key:return [],'카카오 장소 API 키가 없어 자동 코스를 만들 수 없어요.'
    from unified_search import REGIONS, THEME_WORDS
    center=REGIONS.get(region)
    if not center:return [],'지역을 포함해서 검색해 주세요. 예: 서울 카페, 강릉 드라이브'
    # Explicit neighborhood terms constrain the search instead of ignoring the user's location.
    requested=(raw+' '+term).replace(' ','')
    areas=NEIGHBORHOODS.get(region) or [(region,center[0],center[1])]
    exact=[a for a in areas if any(w in requested for w in a[0].replace('·',' ').split() if len(w)>=2)]
    if exact:areas=exact
    elif term:
        # A specific user's district (e.g. '성수 카페') should not scatter to other districts.
        found=[a for a in areas if term in a[0] or any(w in a[0] for w in term.split())]
        if found:areas=found
    pattern=PATTERNS.get(theme,PATTERNS['전체'])
    routes=[];warnings=[]
    for label,lat,lng in areas[:3]:
        anchor={'lat':lat,'lng':lng}
        buckets={}
        for kind,specific in pattern:
            if (kind,specific) in buckets:continue
            keyterms=[specific]
            for w in SEARCH_TERMS[kind]:
                if w not in keyterms:keyterms.append(w)
            results=[];seen=set()
            for word in keyterms[:2]:
                try:docs=query_kakao(label+' '+word,lat,lng,key,3500)
                except urllib.error.HTTPError as exc:
                    warnings.append('카카오 API 오류 '+str(exc.code));docs=[]
                except Exception:
                    warnings.append('카카오 장소 검색 오류');docs=[]
                for item in docs:
                    if not acceptable(item,kind,specific):continue
                    try:p=normalize_place(item)
                    except (TypeError,ValueError,KeyError):continue
                    if p['id'] in seen or km(p,anchor)>3.5:continue
                    seen.add(p['id']);p['cat']=kind if kind!='명소' else specific;p['region']=region
                    p['_dist']=km(p,anchor);results.append(p)
                if len(results)>=3:break
            buckets[(kind,specific)]=sorted(results,key=lambda p:p['_dist'])[:10]
        # Create up to three genuinely distinct alternatives, not just one list per district.
        # The first alternative favors the nearest provider results; later alternatives
        # prefer unused candidates. Never invent or duplicate places.
        for variant in range(3):
            selected=[];ids=set()
            used_on_prior_routes={p['id'] for route in routes if route.get('district')==label for p in route['stops']}
            for kind,specific in pattern:
                opts=[p for p in buckets[(kind,specific)] if p['id'] not in ids and (not selected or km(selected[-1],p)<=5)]
                if not opts:continue
                opts.sort(key=lambda x:(x['id'] in used_on_prior_routes, km(selected[-1],x) if selected else x['_dist']))
                p=opts[0]
                selected.append(p);ids.add(p['id'])
            if len(selected)<2:break
            keyset=frozenset(ids)
            # Keep distinct alternatives only. Do not fill the screen with identical routes.
            if any(frozenset(s['id'] for s in route['stops'])==keyset for route in routes):break
            cleaned=[{k:v for k,v in p.items() if k!='_dist'} for p in selected]
            routes.append({'id':f'auto:{region}:{theme}:{len(routes)+1}', 'kind':'generated',
             'title':label+' '+(theme if theme!='전체' else '여행')+' 코스'+(' '+str(variant+1) if variant else ''),
             'region':region,'district':label,'theme':theme,'stops':cleaned,'source':'Kakao Places',
             'notice':'카카오 장소 검색으로 일단가가 자동 구성한 코스입니다. 공식 관광공사 추천·인기 순위가 아니며 실제 도로 경로, 영업시간, 주차·방문 가능 여부는 확인하지 않았습니다.'})
            if len(routes)>=8:break
        if len(routes)>=8:break
    if not routes:return [],warnings[0] if warnings else '해당 지역에서 테마에 맞는 가까운 실제 장소를 충분히 찾지 못했어요.'
    return routes,warnings[0] if warnings else ''
