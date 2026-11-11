/* Ildanga premium vehicle landscape UI: presentation only. Existing native and API functions remain untouched. */
(function(){
  'use strict';
  const safe = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const root=document.documentElement;
  root.classList.add('ild-premium');

  function openSearch(q){
    if (typeof window.openTourBrowser==='function') { const result=window.openTourBrowser(q||''); if(q && typeof window.searchAllRoutes==='function') Promise.resolve().then(()=>window.searchAllRoutes()); return result; }
    if (typeof window.openHomeSearch==='function') return window.openHomeSearch();
    if (typeof window.assistant==='function') return window.assistant();
  }
  const currentHome=window.home;
  if(typeof currentHome==='function'){
    window.home=function(){
      // Home is intentionally replaced only visually; published/saved community data stay unchanged.
      const posts=Array.isArray(state?.posts)?state.posts.filter(p=>!p.private):[];
      const popular=[...posts].sort((a,b)=>(Number(b.likes)||0)-(Number(a.likes)||0)).slice(0,5);
      const cards=popular.map((p,i)=>{
        const type=/대전|빵/.test(p.region+' '+p.title)?'bread':/강릉|부산|바다/.test(p.region+' '+p.title)?'coast':'seoul';
        const route=(p.stops||[]).map(k=>places[k]?.name).filter(Boolean).slice(0,3).join(' → ');
        return `<article class="premium-course" aria-label="${safe(p.title)}">
          <div class="premium-photo premium-${type}"><span class="premium-region">${safe(p.region||'여행')}</span></div>
          <div class="premium-course-body"><h3>${safe(p.title)}</h3><p>${safe(route)}</p><div class="premium-course-bottom"><span>♡ ${Number(p.likes)||0}</span><button type="button" data-premium-select="${safe(p.id)}">코스 보기 <b aria-hidden="true">↗</b></button></div></div>
        </article>`;
      }).join('');
      const el=document.querySelector('#app');
      if(!el)return currentHome.apply(this,arguments);
      document.body.classList.add('live-home');
      el.innerHTML=`<section class="premium-hero glass" aria-label="일단가 코스 검색">
        <div class="premium-hero-copy"><div class="premium-overline">JUST GO, TOGETHER</div>
        <h1>오늘은 어디로 갈까?</h1><p>말하듯 입력하고, 취향대로 바꾸는 우리만의 여행.</p>
        <div class="premium-hero-actions"><button class="premium-talk" type="button" id="premiumTalk"><span aria-hidden="true">✦</span> 일단가와 대화하기 <span aria-hidden="true">↗</span></button></div>
        </div><div class="premium-search-panel"><div class="premium-search-label">떠나고 싶은 곳이 있나요?</div>
        <form id="premiumSearchForm" class="premium-search-form"><input id="premiumSearchInput" aria-label="지역과 여행 테마 검색" maxlength="80" placeholder="예: 서울 근교 드라이브 코스 추천해줘" autocomplete="off"/><button class="primary" type="submit">코스 찾기 ↗</button></form>
        <div class="premium-chip-row">${[['☕','서울 카페'],['🥐','대전 빵투어'],['🚗','강릉 드라이브'],['♡','경주 데이트']].map(([ico,q])=>`<button type="button" class="premium-chip" data-premium-query="${safe(q)}">${ico} ${safe(q)}</button>`).join('')}</div></div></section>
        <section class="premium-popular"><div class="premium-section-heading"><div><span class="premium-overline">TRAVEL CURATION</span><h2>지금 인기 있는 코스</h2></div><button type="button" id="premiumAll">전체 보기 ↗</button></div>
        <div class="premium-course-row">${cards||'<p>등록된 코스가 없어요. 새로운 여행 코스를 만들어 보세요.</p>'}</div></section>
        <button class="premium-library glass" id="premiumSaved" type="button"><span>▤ &nbsp;나의 여행 루트 모음함</span><small>저장한 코스 ${Array.isArray(state.saved)?state.saved.length:0}개 &nbsp; ↗</small></button>`;
      document.getElementById('premiumSearchForm')?.addEventListener('submit',e=>{e.preventDefault();openSearch(document.getElementById('premiumSearchInput')?.value.trim()||'');});
      document.querySelectorAll('[data-premium-query]').forEach(b=>b.addEventListener('click',()=>openSearch(b.dataset.premiumQuery)));
      document.querySelectorAll('[data-premium-select]').forEach(b=>b.addEventListener('click',()=>window.select?.(b.dataset.premiumSelect)));
      document.getElementById('premiumTalk')?.addEventListener('click',()=>{if(typeof window.openGleoChat==='function')window.openGleoChat();else if(typeof window.assistant==='function')window.assistant();});
      document.getElementById('premiumAll')?.addEventListener('click',()=>{filter='전체';query='';go('community');});
      document.getElementById('premiumSaved')?.addEventListener('click',()=>go('saved'));
      document.getElementById('ildangaUnifiedSearch')?.remove();
    };
  }
  // Add a class to existing modals without replacing any SDK or API logic.
  const oldModal=window.modal;
  if(typeof oldModal==='function'){
    window.modal=function(html){const out=oldModal.apply(this,arguments);document.querySelector('#modal')?.classList.add('premium-dialog');return out;};
  }
  const oldNavigate=window.navigate;
  if(typeof oldNavigate==='function'){
    window.navigate=function(){
      const r=oldNavigate.apply(this,arguments);
      const m=document.querySelector('#modal');
      if(m && m.querySelector('#segmentList')){
        m.classList.add('premium-dialog','premium-navi');
        const title=m.querySelector('h2');if(title)title.textContent='PLEOS 길안내';
        const progress=m.querySelector('#segmentProgress');if(progress)progress.classList.add('premium-step-progress');
        const oldInfo=m.querySelector('#segmentList')?.previousElementSibling;
        if(oldInfo&&oldInfo.tagName==='P')oldInfo.textContent='방문지가 많아도 구간별로 편하게 출발할 수 있어요.';
        const depart=m.querySelector('#pleosDepart');if(depart)depart.classList.add('premium-depart');
        const next=m.querySelector('#pleosNext');if(next)next.classList.add('premium-next');
        const debug=m.querySelector('#pleosDebug');if(debug){debug.hidden=true;debug.setAttribute('aria-hidden','true');}
        // Show technical route warnings when needed, but leave native status messages visible.
      }
      return r;
    };
  }
  const existingChat=window.openGleoChat;
  if(typeof existingChat==='function'){
    window.openGleoChat=function(){const result=existingChat.apply(this,arguments);const m=document.querySelector('#modal');if(m){m.classList.add('premium-dialog','premium-chat-dialog');const title=m.querySelector('.gleo-chat-head h2');if(title)title.textContent='일단가와 여행 만들기';}return result;};
    window.openRouteBuilder=window.openGleoChat;
  }
  if(typeof page!=='undefined' && page==='home') window.home?.();
})();
