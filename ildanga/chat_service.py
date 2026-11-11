"""Local Ollama conversational assistant for Ildanga. No secrets, no disk transcripts."""
import json, os, re, time, threading, urllib.request, urllib.error

_LOCK=threading.RLock()
_SESSIONS={}
_MAX_SESSIONS=80
_TTL=3600
_SYSTEM=(
 '너는 한국 차량용 여행 앱 일단가의 친절한 AI 여행 대화 도우미야. '
 '한국어로 자연스럽고 짧게 대화하고 앞 대화의 취향과 조건을 기억해. '
 '사용자가 여행 계획을 물어보면 지역, 테마, 동선, 예산, 이동거리 등 조건을 이어서 대화해. '
 '장소, 영업시간, 경로와 소요시간은 실시간 조회하지 않았으면 확인된 사실처럼 말하지 마. '
 '이 대화는 코스 엔진이나 내비게이션을 직접 수정하지 않아. 실제로 코스를 변경하거나 저장했다고 주장하면 안 돼. '
 '실제 코스를 선택하려면 사용자가 앱의 코스 검색 화면을 열어야 한다고 적절히 안내해. '
 '자연스럽고 간결하게 답해.'
)

def _call_model(messages):
    model=os.environ.get('ILDANGA_CHAT_MODEL','qwen2.5:1.5b').strip() or 'qwen2.5:1.5b'
    payload={'model':model,'stream':False,'messages':[{'role':'system','content':_SYSTEM}]+messages,
             'options':{'temperature':0.6,'num_predict':350,'num_ctx':4096}}
    req=urllib.request.Request('http://127.0.0.1:11434/api/chat',data=json.dumps(payload,ensure_ascii=False).encode('utf-8'),headers={'Content-Type':'application/json'},method='POST')
    try:
        with urllib.request.urlopen(req,timeout=95) as res:
            obj=json.loads(res.read(300000).decode('utf-8'))
    except urllib.error.HTTPError as e:
        if e.code==404: raise RuntimeError('Ollama 모델이 없습니다. 터미널에서 ollama pull '+model+' 을 실행해 주세요.') from None
        raise RuntimeError('Ollama 응답 오류 HTTP '+str(e.code)) from None
    except (urllib.error.URLError,ConnectionError):
        raise RuntimeError('Ollama가 실행 중인지 확인해 주세요. (ollama serve)') from None
    except TimeoutError:
        raise RuntimeError('AI 응답 대기 시간이 초과됐어요. 더 작은 모델로 시도해 주세요.') from None
    answer=obj.get('message',{}).get('content','')
    if not isinstance(answer,str) or not answer.strip():raise RuntimeError('AI가 답변을 생성하지 못했어요.')
    return answer.strip()[:3500],model

def handle_chat(params):
    sid=params.get('sid',[''])[0]
    if not re.fullmatch(r'[a-zA-Z0-9_-]{12,64}',sid):raise ValueError('Invalid chat session')
    now=time.monotonic()
    with _LOCK:
        expired=[key for key,v in _SESSIONS.items() if now-v['time']>_TTL]
        for key in expired:_SESSIONS.pop(key,None)
        if params.get('reset',[''])[0]=='1':
            _SESSIONS.pop(sid,None)
            return {'reply':'새 대화를 시작했어요. 어디로 떠나고 싶으세요?','historyLength':0,'engine':'ollama'}
        message=params.get('message',[''])[0].strip()
        if not 1<=len(message)<=500:raise ValueError('Message must be 1-500 characters')
        prior=list(_SESSIONS.get(sid,{'messages':[]})['messages'][-12:])
    answer,model=_call_model(prior+[{'role':'user','content':message}])
    with _LOCK:
        if len(_SESSIONS)>=_MAX_SESSIONS and sid not in _SESSIONS:
            oldest=min(_SESSIONS,key=lambda k:_SESSIONS[k]['time'])
            _SESSIONS.pop(oldest,None)
        history=(prior+[{'role':'user','content':message},{'role':'assistant','content':answer}])[-14:]
        _SESSIONS[sid]={'messages':history,'time':now}
    return {'reply':answer,'historyLength':len(history),'engine':'ollama','model':model}
