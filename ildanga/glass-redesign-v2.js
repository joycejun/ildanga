/* Ildanga premium redesign v2. Presentation only: app data, APIs, navigation remain in place. */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const htmlEscape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const themes=[['☕','서울 카페'],['🥐','대전 빵투어'],['🚗','강릉 드라이브'],['♡','경주 데이트']];
function tripSearch(q){const query=(q||'').trim();if(typeof window.openTourBrowser==='function'){window.openTourBrowser(query);return;}if(typeof window.openHomeSearch==='function'){window.openHomeSearch();return;}if(typeof window.assistant==='function')window.assistant();}
function startChat(){if(typeof window.openGleoChat==='function')window.openGleoChat();else if(typeof window.assistant==='function')window.assistant();}
function clearDuplicate(){document.getElementById('ildangaUnifiedSearch')?.remove();}
function renderHome(){
 const app=$('#app');if(!app)return;
 const posts=Array.isArray(state?.posts)?state.posts.filter(p=>!p.private):[];
 const popular=[...posts].sort((a,b)=>(Number(b.likes)||0)-(Number(a.likes)||0)).slice(0,5);
 const cards=popular.map(p=>{
  const kind=/대전|빵/.test((p.region||'')+' '+p.title)?'bread':/강릉|부산|바다/.test((p.region||'')+' '+p.title)?'coast':'seoul';
  const stops=(p.stops||[]).map(k=>places[k]?.name).filter(Boolean).slice(0,3).join(' → ');
  return `<article class="v2-course"><div class="v2-photo v2-${kind}"><span>${htmlEscape(p.region||'여행')}</span></div><div class="v2-course-text"><h3>${htmlEscape(p.title||'여행 코스')}</h3><p>${htmlEscape(stops)}</p><div class="v2-course-foot"><small>♡ ${Number(p.likes)||0}</small><button type="button" data-v2-post="${htmlEscape(p.id)}">코스 보기 <b>↗</b></button></div></div></article>`;
 }).join('');
 document.body.classList.add('live-home','ild-v2-home');
 app.innerHTML=`<section class="v2-hero" aria-label="일단가 여행 탐색">
 <div class="v2-hero-lead"><span class="v2-eyebrow">JUST GO, TOGETHER</span><h1>오늘은 어디로 갈까?</h1><p>하고 싶은 여행을 말해줘.<br>일단가가 어울리는 코스를 찾아줄게.</p><button id="v2Talk" class="v2-talk" type="button"><span class="v2-spark">✦</span> Gleo랑 대화하기 <span aria-hidden="true">↗</span></button></div>
 <div class="v2-hero-discover"><div class="v2-search-head"><span>어디로 떠나고 싶어?</span><span class="v2-star">✧</span></div><form id="v2SearchForm" class="v2-search"><input id="v2Query" maxlength="90" autocomplete="off" aria-label="지역 또는 테마 검색" placeholder="서울 근교 드라이브 코스 추천해줘"><button type="submit">코스 찾기 ↗</button></form><div class="v2-chips">${themes.map(([icon,name])=>`<button type="button" data-v2-search="${name}">${icon} ${name}</button>`).join('')}</div></div></section>
 <div class="v2-section-title"><div><span>CURATED FOR YOU</span><h2>지금 인기 있는 코스</h2></div><button type="button" id="v2All">전체 보기 ↗</button></div>
 <section class="v2-course-row">${cards||'<p class="v2-empty">아직 코스가 없어요.</p>'}</section>
 <button type="button" class="v2-saved" id="v2Saved"><span>▤ &nbsp;나의 여행 루트 모음함</span><span>저장한 코스 ${Array.isArray(state.saved)?state.saved.length:0}개 &nbsp; ↗</span></button>`;
 $('#v2SearchForm')?.addEventListener('submit',e=>{e.preventDefault();tripSearch($('#v2Query')?.value)});
 $('#v2Talk')?.addEventListener('click',startChat);
 document.querySelectorAll('[data-v2-search]').forEach(el=>el.addEventListener('click',()=>tripSearch(el.dataset.v2Search)));
 document.querySelectorAll('[data-v2-post]').forEach(el=>el.addEventListener('click',()=>window.select?.(el.dataset.v2Post)));
 $('#v2All')?.addEventListener('click',()=>{filter='전체';query='';go('community')});
 $('#v2Saved')?.addEventListener('click',()=>go('saved'));
 clearDuplicate();
}
if(typeof window.home==='function')window.home=renderHome;
// Preserve the original working text-command dispatcher. Only change its container presentation.
function polishChat(){
 const modal=$('#modal');const chat=modal?.querySelector('.gleo-chat');if(!modal||!chat)return;
 modal.classList.add('v2-chat-modal');
 const title=chat.querySelector('.gleo-chat-head h2');if(title)title.textContent='Gleo랑 대화하기';
 const subtitle=chat.querySelector('.gleo-chat-head p');if(subtitle)subtitle.textContent='떠나고 싶은 지역과 분위기를 이야기해 줘.';
 const help=chat.querySelector('.gleo-chat-status');if(help)help.textContent='앱 내부 텍스트 명령 · 실제 Gleo 음성 연동은 별도 확인';
 const messages=chat.querySelector('#gleoChatMessages');if(messages){messages.querySelectorAll('.gleo-msg.assistant > span').forEach(el=>el.textContent='Gleo 테스트');}
 const note=chat.querySelector('.gleo-chat-note');if(note)note.textContent='장소 추천은 실제 카카오·관광공사 검색으로 연결돼요.';
 const input=chat.querySelector('#gleoChatInput');if(input)input.placeholder='예: 서울 근교 카페 드라이브 추천해줘';
 const avatar=chat.querySelector('.gleo-chat-symbol');if(avatar)avatar.textContent='✦';
}
if(typeof window.openGleoChat==='function'){
 const previous=window.openGleoChat;
 window.openGleoChat=function(){const out=previous.apply(this,arguments);polishChat();return out;};
 window.openRouteBuilder=window.openGleoChat;
}
// Chat renders/reopens after each command; keep the service title stable.
const watch=new MutationObserver(()=>{const m=$('#modal');if(m?.open && m.querySelector('.gleo-chat') && !m.classList.contains('v2-chat-modal'))polishChat();if(!m?.open)m?.classList.remove('v2-chat-modal')});
const m=$('#modal');if(m)watch.observe(m,{childList:true,subtree:false});
const prevNav=window.navigate;
if(typeof prevNav==='function')window.navigate=function(){const out=prevNav.apply(this,arguments);const modal=$('#modal');if(modal?.querySelector('#segmentList')){modal.classList.add('v2-nav-modal');const h=modal.querySelector('h2');if(h)h.textContent='PLEOS 길안내';const p=modal.querySelector('#segmentList')?.previousElementSibling;if(p&&p.tagName==='P')p.textContent='방문지는 구간별로 이어서 안내할게요.';}return out;};
if(typeof page!=='undefined'&&page==='home')renderHome();else clearDuplicate();
})();
