"""Local derived-summary cache. No raw reviews or credentials are persisted."""
import os,json,time,hashlib,tempfile,threading
from pathlib import Path
ROOT=Path(os.environ.get('ILDANGA_REVIEW_CACHE',str(Path(__file__).parent/'review_cache')))
_LOCK=threading.Lock()
TTL=7*86400
def path_for(kind,key):return ROOT/(kind+'_'+hashlib.sha256(key.encode()).hexdigest()+'.json')
def get(kind,key):
    try:
        d=json.loads(path_for(kind,key).read_text(encoding='utf8'))
        if d.get('version')!=1 or time.time()-d['saved']>TTL:return None
        return d['value']
    except (OSError,ValueError,KeyError,TypeError):return None
def put(kind,key,value):
    with _LOCK:
        ROOT.mkdir(parents=True,exist_ok=True)
        fd,tmp=tempfile.mkstemp(dir=ROOT,suffix='.tmp')
        try:
            with os.fdopen(fd,'w',encoding='utf8') as f:json.dump({'version':1,'saved':time.time(),'value':value},f,ensure_ascii=False)
            os.replace(tmp,path_for(kind,key))
        finally:
            if os.path.exists(tmp):os.unlink(tmp)
def save_summary(pid,result):
    if not result.get('sentences'):return
    clean={k:v for k,v in result.items() if k not in ('reviews','sentences')}
    clean['sentences']=[{'text':s['text'],'kind':s.get('kind','feature')} for s in result['sentences']]
    put('summary',pid,clean)
