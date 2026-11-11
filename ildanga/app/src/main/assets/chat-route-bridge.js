/* Ildanga free chat -> validated Kakao itinerary; not a Gleo service bridge. */
(function () {
  'use strict';
  const affirmative=/^(?:응|웅|어|네|예|좋아|좋아요|그래|그렇게\s*해|그걸로\s*해|만들어\s*줘|코스\s*만들어\s*줘|추천해\s*줘|보여\s*줘|ㅇㅇ|ㅇㅋ|ok|okay)[!~.\sㅋㅎ]*$/i;
  const tripWords=/여행|드라이브|카페|빵집|베이커리|데이트|맛집|힐링|산책|바다|야경|코스|관광|근교|캠핑|갈\s*만한|어디\s*갈/;
  const regions='서울 경기 인천 수원 성남 광명 용인 양평 파주 가평 대전 부산 강릉 속초 춘천 경주 전주 제주 대구 광주 울산 세종 여수 순천 남해 통영 거제 창원 마산 청주 천안 공주 안동 포항'.split(' ');
  let lastRequest='';
  let suggestionId=0;
  const get=s=>document.querySelector(s);
  function note(msg) {
    const list=get('#free-chat-messages');if(!list)return null;
    const bubble=document.createElement('div');bubble.className='free-chat-bubble theirs';bubble.textContent=msg;
    list.appendChild(bubble);list.scrollTop=list.scrollHeight;return bubble;
  }
  function queryFrom(text) {
    text=text.trim().replace(/[.!?\n]/g,' ').replace(/\s+/g,' ');
    return text.slice(0,80);
  }
  function remember(message) {
    const m=message.trim();
    if(affirmative.test(m))return lastRequest||'';
    // Keep the latest travel request. A follow-up with explicit travel constraints extends it.
    if(tripWords.test(m)) {
      if(lastRequest && /더|말한|아까|근데|그리고|대신|빼고|너무|조용|한적|거리|시간|가깝/.test(m))
        lastRequest=queryFrom(lastRequest+' '+m);
      else lastRequest=queryFrom(m);
    }
    return lastRequest;
  }
  function wantsRoute(m) {
    return affirmative.test(m)&&!!lastRequest ||
      /코스\s*(?:만들|짜|생성|보여)|코스\s*추천|경로\s*만들|여행\s*루트\s*만들/.test(m);
  }
  function formatStop(p){return `${p.name||''}`;}
  function applyRoute(route) {
    if(typeof state==='undefined'||typeof places==='undefined'||typeof persist!=='function'||typeof go!=='function')
      return note('앱의 루트 화면을 찾지 못했어요. 앱을 다시 실행해 주세요.');
    const unique=new Set();const points=[];
    for(const p of (route.stops||[])){
      if(!p||!/^kakao\d+$/.test(String(p.id))||typeof p.name!=='string'||!p.name.trim()||
          !Number.isFinite(Number(p.lat))||!Number.isFinite(Number(p.lng))||
          Math.abs(Number(p.lat))>90||Math.abs(Number(p.lng))>180||unique.has(p.id))continue;
      unique.add(p.id);points.push(p);
    }
    if(points.length<2)return note('확인된 실제 방문지가 2곳 미만이라 코스를 적용하지 않았어요. 다른 지역이나 테마로 검색해 주세요.');
    // New route replaces only active journey, not saved posts or previous data.
    const region=route.region&&route.region!=='전체'?route.region:'여행';
    state.customPlaces=state.customPlaces||{};
    for(const p of points){const place={name:p.name,lat:Number(p.lat),lng:Number(p.lng),cat:p.cat||'관광지',region,
      address:p.address||'',phone:p.phone||'',placeUrl:p.placeUrl||'',provider:'Kakao'};
      places[p.id]=place;state.customPlaces[p.id]=place;}
    state.route=points.map(p=>p.id);state.title=route.title||'나만의 여행 코스';state.region=region;state.source='generated';
    if(typeof selectedStop!=='undefined')selectedStop=0;
    persist();const layer=get('#free-chat-layer');if(layer)layer.hidden=true;
    go('route');if(typeof toast==='function')toast('실제 카카오 장소로 코스를 만들었어요. 방문지를 확인하고 수정한 뒤 출발하세요.');
  }
  async function discover(request) {
    const container=get('#free-chat-messages');if(!container)return;
    if(!regions.some(r=>request.includes(r))) {
      note('코스를 만들 지역을 알려주세요. 예: 서울 카페, 대전 빵투어');return;
    }
    const serial=++suggestionId;
    const loading=note('실제 장소를 검색해서 코스를 구성하고 있어요…');
    const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),45000);
    try{
      const url='/api/tour/discover?'+new URLSearchParams({query:request,region:'전체',theme:'전체'});
      const res=await fetch(url,{signal:abort.signal,cache:'no-store'});
      const data=await res.json();if(!res.ok)throw Error(data.error||'코스 검색에 실패했어요.');
      if(serial!==suggestionId||!loading||!loading.isConnected)return;
      loading.textContent='';
      const options=Array.isArray(data.generated)?data.generated.filter(r=>Array.isArray(r.stops)&&r.stops.length>=2).slice(0,4):[];
      if(!options.length){loading.textContent='이 조건에서 코스를 구성할 실제 장소가 부족해요. 동네명이나 다른 테마로 다시 말해 주세요.';return;}
      loading.textContent=`실제 장소로 만든 코스 ${options.length}개를 찾았어요. 마음에 드는 코스를 지도에 적용해 보세요.`;
      for(const route of options){
        const card=document.createElement('div');card.className='free-chat-route-card';
        const title=document.createElement('strong');title.textContent=route.title||'추천 여행 코스';card.appendChild(title);
        const detail=document.createElement('p');detail.textContent=route.stops.map(formatStop).join(' → ');card.appendChild(detail);
        const source=document.createElement('small');source.textContent='카카오 실제 장소 · 일단가 자동 구성 · 영업시간/교통 미확인';card.appendChild(source);
        const button=document.createElement('button');button.type='button';button.textContent='이 코스로 지도 열기 →';button.addEventListener('click',()=>applyRoute(route));card.appendChild(button);
        container.appendChild(card);
      }
      container.scrollTop=container.scrollHeight;
    }catch(e){if(loading)loading.textContent=e.name==='AbortError'?'장소 검색이 오래 걸리고 있어요. 다시 시도해 주세요.':`코스 검색 오류: ${e.message}`;}
    finally{clearTimeout(timer);}
  }
  window.ildangaChatRouteBridge={remember,wantsRoute,discover,reset:()=>{lastRequest='';suggestionId++}};
})();
