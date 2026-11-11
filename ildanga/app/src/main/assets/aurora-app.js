/* Ildanga Aurora — full presentation redesign for Pleos landscape WebView.
   No changes to search providers, navigation SDK, Gleo action registration or local storage format. */
(function(){
 'use strict';
 const $=s=>document.querySelector(s);
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const examples=[['☕','서울 카페'],['🥐','대전 빵투어'],['🚗','강릉 드라이브'],['♡','경주 데이트']];
 const photos={bread:'photos/bread.png',sea:'photos/coast.png',city:'photos/seoul.png'};
 const search=q=>{
   const val=(q||'').trim();
   if(typeof window.openTourBrowser==='function')window.openTourBrowser(val);
   else if(typeof window.openHomeSearch==='function')window.openHomeSearch();
   else if(typeof window.assistant==='function')window.assistant();
 };
 const chat=()=>{if(typeof window.openGleoChat==='function')window.openGleoChat();else if(typeof window.assistant==='function')window.assistant()};
 function header(){
   document.documentElement.classList.add('ild-aurora');
   document.querySelector('#ildangaUnifiedSearch')?.remove();
   const brand=$('header .brand');if(brand){brand.innerHTML='일단가<span class="aurora-brandmark" aria-hidden="true">⌁</span>';brand.setAttribute('aria-label','일단가 홈')}
   const nav=$('header nav');if(nav){nav.classList.add('aurora-tabs');nav.querySelectorAll('button').forEach(b=>{
     const x=b.textContent.trim();if(x==='여행 지도')b.textContent='코스';if(x==='커뮤니티')b.textContent='커뮤니티';if(x==='내 루트')b.textContent='저장';
   });}
 }
 function card(p,index){
   const label=String(p.region||'여행');
   const text=(p.stops||[]).map(k=>typeof places!=='undefined'?places[k]?.name:null).filter(Boolean).slice(0,3).join(' → ');
   const kind=/대전|빵/.test(label+' '+p.title)?'bread':/강릉|부산|바다|제주/.test(label+' '+p.title)?'sea':'city';
   return `<article class="aurora-course" data-course="${safe(p.id)}" tabindex="0" role="button" aria-label="${safe(p.title)} 코스 보기"><div class="aurora-course-img" style="background-image:url('${photos[kind]}')"><span class="aurora-place">⌖ ${safe(label)}</span></div><div class="aurora-course-info"><div class="aurora-kicker">${index===0?'EDITOR’S PICK':'POPULAR ROUTE'}</div><h3>${safe(p.title)}</h3><p>${safe(text||p.desc||'여행 코스')}</p><div class="aurora-course-bottom"><span>♡ ${Number(p.likes)||0}</span><span class="aurora-see">코스 보기 <b>↗</b></span></div></div></article>`;
 }
 function drawHome(){
   const host=$('#app');if(!host||typeof state==='undefined')return;
   const ps=(state.posts||[]).filter(p=>!p.private).sort((a,b)=>(Number(b.likes)||0)-(Number(a.likes)||0));
   host.innerHTML=`<section class="aurora-hero" aria-label="일단가 여행 추천">
     <div class="aurora-hero-text"><div class="aurora-intro">JUST GO, TOGETHER <span>✦</span></div>
     <h1>오늘은 <strong>어디로 갈까?</strong></h1><p>말하듯 입력하면<br>우리만의 여행 코스를 찾을 수 있어요.</p>
     <button class="aurora-gleo" id="auroraChat" type="button"><span class="aurora-gleo-orb">✦</span><span>Gleo랑 대화하기</span><span aria-hidden="true">↗</span></button></div>
     <div class="aurora-search-card"><span class="aurora-sparkline">✧</span><p class="aurora-search-title">가고 싶은 곳이 있나요?</p><p class="aurora-search-sub">지역이나 분위기를 편하게 적어 주세요</p>
     <form id="auroraSearch" class="aurora-search-form"><span aria-hidden="true">⌕</span><input id="auroraQuery" maxlength="90" autocomplete="off" aria-label="지역 또는 여행 테마" placeholder="예: 서울 근교 드라이브 코스 추천해줘"><button type="submit">코스 찾기 ↗</button></form>
     <div class="aurora-tags">${examples.map(([emoji,q])=>`<button type="button" data-aurora-query="${safe(q)}">${emoji} ${safe(q)}</button>`).join('')}</div></div>
   </section>
   <div class="aurora-headline"><div><div class="aurora-eyebrow">CURATED FOR YOU</div><h2>지금 인기 있는 코스</h2></div><button id="auroraAll" class="aurora-all">전체 보기 ↗</button></div>
   <section class="aurora-routes" aria-label="인기 여행 코스">${ps.slice(0,6).map(card).join('')||'<p>아직 표시할 코스가 없어요.</p>'}</section>
   <button id="auroraSaved" class="aurora-saved"><span>▤ &nbsp;나의 여행 루트 모음함</span><span>저장한 코스 ${(state.saved||[]).length}개 &nbsp; ↗</span></button>`;
   document.body.classList.add('live-home');header();
   $('#auroraSearch').addEventListener('submit',e=>{e.preventDefault();search($('#auroraQuery').value)});
   $('#auroraChat').addEventListener('click',chat);
   host.querySelectorAll('[data-aurora-query]').forEach(el=>el.addEventListener('click',()=>search(el.dataset.auroraQuery)));
   host.querySelectorAll('[data-course]').forEach(el=>{
     const open=()=>{if(typeof window.select==='function')window.select(el.dataset.course)};
     el.addEventListener('click',open);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
   });
   $('#auroraAll').onclick=()=>{filter='전체';query='';go('community')};
   $('#auroraSaved').onclick=()=>go('saved');
 }
 function polishChat(){
   const modal=$('#modal'), panel=modal?.querySelector('.gleo-chat');if(!modal||!panel)return;
   modal.classList.add('aurora-chat-modal');modal.classList.remove('v2-chat-modal');
   const heading=panel.querySelector('.gleo-chat-head h2');if(heading)heading.textContent='Gleo랑 대화하기';
   const subtitle=panel.querySelector('.gleo-chat-head p');if(subtitle)subtitle.textContent='원하는 지역과 여행 분위기를 편하게 말해 주세요';
   const symbol=panel.querySelector('.gleo-chat-symbol');if(symbol)symbol.textContent='✦';
   const input=panel.querySelector('#gleoChatInput');if(input)input.placeholder='예: 두 번째 장소를 다른 카페로 바꿔줘';
   const status=panel.querySelector('.gleo-chat-status');if(status){status.textContent='일단가 명령 테스트 · 실제 Gleo 대화 서비스는 별도 연동';status.setAttribute('title','앱의 명령 처리 기능을 시험하는 입력창입니다. Gleo의 자유대화 기능으로 오해하지 마세요.')}
   const note=panel.querySelector('.gleo-chat-note');if(note)note.textContent='지역·테마 검색은 실제 관광공사·카카오 데이터를 이용해요.';
   panel.querySelectorAll('.gleo-msg.assistant span').forEach(el=>el.textContent='일단가');
 }
 function polishNav(){
   const m=$('#modal');if(!m?.querySelector('#segmentList'))return;
   m.classList.add('aurora-nav-modal');m.classList.remove('v2-nav-modal');
   let h=m.querySelector('h2');if(h){h.textContent='PLEOS 길안내';h.classList.add('aurora-nav-title')}
   const progress=m.querySelector('#segmentProgress');if(progress)progress.classList.add('aurora-nav-progress');
   const list=m.querySelector('#segmentList');if(list)list.classList.add('aurora-nav-list');
   const paragraphs=[...m.querySelectorAll(':scope > p')];
   paragraphs.forEach((p,i)=>{if(i===0){p.textContent='코스를 나누어, 편리하게 이어서 안내할게요.';p.classList.add('aurora-nav-desc')}
     else {p.classList.add('aurora-technical');p.setAttribute('aria-hidden','true')}});
   const status=m.querySelector('#navStatus');if(status)status.classList.add('aurora-nav-status');
   const depart=m.querySelector('#pleosDepart');if(depart)depart.classList.add('aurora-nav-start');
   const next=m.querySelector('#pleosNext');if(next)next.classList.add('aurora-nav-next');
   const debug=m.querySelector('#pleosDebug');if(debug){
     const details=document.createElement('details');details.className='aurora-debug';
     const summary=document.createElement('summary');summary.textContent='개발자 테스트';
     debug.parentNode.insertBefore(details,debug);details.append(summary,debug);
   }
   if(!m.querySelector('.aurora-nav-foot')){const footer=document.createElement('div');footer.className='aurora-nav-foot';footer.textContent='다음 구간은 일단가로 돌아와 직접 시작할 수 있어요.';m.appendChild(footer)}
   const refresh=()=>{const rows=[...m.querySelectorAll('#segmentList li')];rows.forEach((li,i)=>{li.classList.toggle('aurora-nav-current',li.textContent.includes('현재 선택'));li.setAttribute('data-segment',String(i+1))})};
   refresh();
   if(list&&!list.dataset.auroraObserved){list.dataset.auroraObserved='1';new MutationObserver(refresh).observe(list,{childList:true,subtree:false})}
 }
 // Install after all existing handlers. Existing functions and API services remain the source of truth.
 window.home=drawHome;
 const existingChat=window.openGleoChat;
 if(typeof existingChat==='function')window.openGleoChat=function(){const out=existingChat.apply(this,arguments);polishChat();return out};
 const existingNavigate=window.navigate;
 if(typeof existingNavigate==='function')window.navigate=function(){const out=existingNavigate.apply(this,arguments);polishNav();return out};
 const modal=$('#modal');if(modal){
   const observer=new MutationObserver(()=>{
     if(!modal.open){modal.classList.remove('aurora-chat-modal','aurora-nav-modal');return}
     if(modal.querySelector('.gleo-chat')){modal.classList.add('aurora-chat-modal');modal.classList.remove('v2-chat-modal')}
     if(modal.querySelector('#segmentList')){modal.classList.add('aurora-nav-modal');modal.classList.remove('v2-nav-modal')}
   });
   observer.observe(modal,{childList:true});
 }
 header();
 if(typeof page!=='undefined'&&page==='home')drawHome();
})();
