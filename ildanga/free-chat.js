/* 일단가 자유대화: 기존 Gleo Intent와 별도의 로컬 Ollama 채팅. */
(function(){
'use strict';
let sid='ildanga'+Math.random().toString(36).slice(2)+Date.now().toString(36);
let busy=false;
const q=(sel,root=document)=>root.querySelector(sel);
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function bubble(role,content){let root=q('#free-chat-messages');if(!root)return;let el=document.createElement('div');el.className='free-chat-bubble '+(role==='user'?'mine':'theirs');el.textContent=content;root.appendChild(el);root.scrollTop=root.scrollHeight;return el;}
function open(){
 const old=q('#free-chat-layer');if(old){old.hidden=false;setTimeout(()=>q('#free-chat-input')?.focus(),100);return;}
 const layer=document.createElement('div');layer.id='free-chat-layer';layer.innerHTML=`<div class="free-chat-backdrop"></div><section class="free-chat-panel" role="dialog" aria-modal="true" aria-label="AI 여행 대화"><header class="free-chat-header"><div class="free-chat-mark">✦</div><div class="free-chat-title"><h2>여행 AI랑 대화하기</h2><p>원하는 여행을 편하게 이야기해 보세요</p></div><button type="button" class="free-chat-x" aria-label="닫기">×</button></header><div id="free-chat-messages" class="free-chat-messages" aria-live="polite"></div><div class="free-chat-chips"><button data-msg="서울 근교로 한적한 드라이브 코스 추천해줘">서울 근교 드라이브</button><button data-msg="대전 빵투어 추천해줘">대전 빵투어</button><button data-msg="경주 데이트 코스 추천해줘">경주 데이트</button></div><form id="free-chat-form" class="free-chat-form"><input id="free-chat-input" aria-label="여행 이야기 입력" maxlength="500" placeholder="어떤 여행을 떠나고 싶어?" autocomplete="off"><button type="submit" id="free-chat-send">전송 ↗</button></form><div class="free-chat-tools"><button type="button" id="free-chat-reset">새 대화</button><span>Ollama AI 대화 · 코스 반영은 검색 화면에서</span></div></section>`;
 document.body.appendChild(layer);
 q('.free-chat-x',layer).onclick=()=>{layer.hidden=true};q('.free-chat-backdrop',layer).onclick=()=>{layer.hidden=true};
 q('#free-chat-form',layer).onsubmit=e=>{e.preventDefault();send(q('#free-chat-input',layer).value)};
 for(const b of layer.querySelectorAll('.free-chat-chips button'))b.onclick=()=>send(b.dataset.msg);
 q('#free-chat-reset',layer).onclick=async()=>{if(busy)return;sid='ildanga'+Math.random().toString(36).slice(2)+Date.now().toString(36);q('#free-chat-messages',layer).textContent='';bubble('assistant','어디로 떠나고 싶으세요? 원하는 분위기나 지역을 알려주세요.');};
 bubble('assistant','어디로 떠나고 싶으세요? 원하는 지역이나 분위기를 편하게 말해 주세요.');
 q('#free-chat-input',layer).focus();
}
async function send(message){
 message=String(message||'').trim();if(!message||busy)return;
 if(message.length>500){bubble('assistant','한 번에 500자까지만 입력할 수 있어요.');return;}
 const input=q('#free-chat-input');if(input)input.value='';bubble('user',message);busy=true;
 const button=q('#free-chat-send');if(button)button.disabled=true;
 let pending=bubble('assistant','답변을 생각하고 있어요…');
 const timeout=new AbortController();const timer=setTimeout(()=>timeout.abort(),105000);
 try{
  const qs=new URLSearchParams({sid,message});const response=await fetch('/api/ai/chat?'+qs.toString(),{signal:timeout.signal,cache:'no-store'});
  const data=await response.json();if(!response.ok)throw Error(data.error||'AI 서버 연결이 실패했어요.');
  pending.textContent=data.reply||'답변이 비어 있어요.';
 }catch(e){pending.textContent=e.name==='AbortError'?'AI 응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요.':e.message||'연결에 실패했어요.'}
 finally{clearTimeout(timer);busy=false;if(button)button.disabled=false;input?.focus();q('#free-chat-messages')?.scrollTo(0,99999)}
}
window.openIldangaFreeChat=open;
// Capture only the homepage's button to avoid altering existing search/navigation routines.
document.addEventListener('click',e=>{
 const btn=e.target.closest('button');if(!btn)return;
 const text=(btn.textContent||'').trim();
 if(/Gleo랑 대화하기|Gleo와 대화하기/.test(text)&&!btn.closest('#free-chat-layer')){
  e.preventDefault();e.stopImmediatePropagation();open();
 }
},true);
})();
