"""Local development proxy. Kakao REST key stays on the computer, never in the APK.
Run: python places_server.py ; connect emulator via adb reverse tcp:8765 tcp:8765.
For production deploy behind HTTPS, with authentication and rate limiting.
"""
import json, math, os, urllib.parse, urllib.request, urllib.error
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

def normalize_place(p):
    pid=str(p.get('id',''))
    if not pid.isdigit(): raise ValueError('Invalid provider place id')
    lat,lng=float(p['y']),float(p['x'])
    if not math.isfinite(lat) or not math.isfinite(lng) or not (-90<=lat<=90 and -180<=lng<=180): raise ValueError('Invalid coordinates')
    return {'id':'kakao'+pid,'name':str(p['place_name'])[:200], 'lat':lat,'lng':lng,
      'address':str(p.get('road_address_name') or p.get('address_name',''))[:300],
      'phone':str(p.get('phone',''))[:40], 'category':str(p.get('category_name',''))[:200],
      'distanceMeters':float(p.get('distance') or 0),
      'placeUrl':'https://place.map.kakao.com/'+pid,'provider':'Kakao',
      'hours':None,'reviews':None}

def search_places(params, key, opener=urllib.request.urlopen):
    query=params.get('query',[''])[0].strip()
    lat=float(params.get('lat',['0'])[0]);lng=float(params.get('lng',['0'])[0])
    radius=int(params.get('radius',['5000'])[0])
    if not query or len(query)>80 or not all(map(math.isfinite,[lat,lng])) or not (-90<=lat<=90 and -180<=lng<=180) or not 100<=radius<=5000:
        raise ValueError('Invalid search parameters')
    qs=urllib.parse.urlencode({'query':query,'y':lat,'x':lng,'radius':radius,'sort':'distance','size':15})
    req=urllib.request.Request('https://dapi.kakao.com/v2/local/search/keyword.json?'+qs,headers={'Authorization':'KakaoAK '+key,'Accept':'application/json'})
    with opener(req,timeout=10) as response: payload=json.load(response)
    results=[]
    for p in payload.get('documents',[]):
        try: results.append(normalize_place(p))
        except (ValueError,KeyError,TypeError): continue
    return {'provider':'Kakao','places':results,'more':not payload.get('meta',{}).get('is_end',True),
      'note':'거리순 검색입니다. 인기 순위를 의미하지 않습니다. 영업시간·후기는 카카오 장소 검색 API에 포함되지 않습니다.'}

class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args): pass # Do not log coordinates or API keys.
    def send_json(self,code,data):
        body=json.dumps(data,ensure_ascii=False).encode('utf-8')
        self.send_response(code);self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(body)))
        self.end_headers();self.wfile.write(body)
    def do_GET(self):
        u=urllib.parse.urlsplit(self.path);key=os.environ.get('KAKAO_REST_API_KEY','').strip()
        if u.path=='/api/health': return self.send_json(200,{'connected':True,'searchConfigured':bool(key),'provider':'Kakao'})
        if u.path in ('/api/reviews/places','/api/reviews/summary'):
            from reviews_service import find_places,summary_job,ReviewError
            try:return self.send_json(200,(find_places if u.path.endswith('/places') else summary_job)(urllib.parse.parse_qs(u.query)))
            except ReviewError as e:return self.send_json(503,{'error':str(e)})
            except Exception:return self.send_json(502,{'error':'후기 처리 중 오류가 발생했어요.'})
        if u.path!='/api/places/search': return self.send_json(404,{'error':'지원하지 않는 요청입니다.'})
        if not key:return self.send_json(503,{'error':'학교 컴퓨터의 서버에 KAKAO_REST_API_KEY를 설정해 주세요.'})
        try: self.send_json(200,search_places(urllib.parse.parse_qs(u.query),key))
        except (ValueError,TypeError): self.send_json(400,{'error':'검색어·좌표·반경을 확인해 주세요.'})
        except urllib.error.HTTPError as e:
            msg='카카오 API 키와 사용 권한을 확인해 주세요.' if e.code in (401,403) else '장소 제공사 오류 또는 사용량 제한입니다. 잠시 후 다시 시도해 주세요.'
            self.send_json(502,{'error':msg})
        except Exception:self.send_json(502,{'error':'장소 검색 연결이 지연되거나 실패했어요. 인터넷을 확인해 주세요.'})

if __name__=='__main__':
    print('Ildanga place proxy: 127.0.0.1:8765 (Ctrl+C to stop)')
    ThreadingHTTPServer(('127.0.0.1',8765),Handler).serve_forever()
