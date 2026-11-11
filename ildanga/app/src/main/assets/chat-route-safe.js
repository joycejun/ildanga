/* Free chat always goes to Ollama. Route discovery requires user clicking a separate button. */
(function(){
 'use strict';
 const routeIntent=/(?:여행|드라이브|카페|빵투어|빵집|데이트|맛집|산책|명소|관광|캠핑|나들이|야경|바다|힐링|코스|루트)/;
 const requestIntent=/(?:추천|만들|짜\s*줘|찾아\s*줘|가고\s*싶|갈\s*만|보여\s*줘|구성|떠나고\s*싶)/;
 const approval=/^(?:응|웅|네|예|좋아|좋아요|그래|그렇게\s*해|그걸로\s*해|ㅇㅇ|ㅇㅋ|ok|okay)[!~.\sㅋㅎ]*$/i;
 const regionRe=/(서울|경기|인천|수원|성남|광명|용인|양평|파주|가평|대전|부산|강릉|속초|춘천|경주|전주|제주|대구|광주|울산|세종|여수|순천|남해|통영|거제|창원|마산|청주|천안|공주|안동|포항)/;
 let lastTravel='', lastOfferedKey='', generation=0;
 const chat=()=>document.querySelector('#free-chat-messages');
 function remember(message){
   const m=String(message||'').trim();
   // The free chat is NEVER intercepted. This remembers only possible search preferences.
   if(routeIntent.test(m)&&requestIntent.test(m)){
     lastTravel=m.slice(0,240);
   }else if(lastTravel && routeIntent.test(m) && /(?:근데|그리고|대신|빼고|더|한적|가까|멀|시간|사람|분위기)/.test(m)){
     lastTravel=(lastTravel+' '+m).slice(0,240);
   }
   return lastTravel;
 }
 function eligible(message){
   const m=String(message||'').trim();
   return (routeIntent.test(m)&&requestIntent.test(m)) || (approval.test(m)&&!!lastTravel);
 }
 function removeOldOffers(){document.querySelectorAll('.free-chat-route-offer').forEach(x=>x.remove());}
 function maybeOffer(message){
   const query=remember(message);
   if(!eligible(message)||!query||!chat())return;
   const key=message+'|'+query;
   if(lastOfferedKey===key)return;
   lastOfferedKey=key;
   removeOldOffers();
   const holder=document.createElement('div');holder.className='free-chat-route-offer';
   const info=document.createElement('span');info.textContent='원하면 실제 장소를 찾아 지도에 코스를 만들 수 있어요.';
   const button=document.createElement('button');button.type='button';button.textContent='실제 장소로 코스 만들기 →';
   button.addEventListener('click',()=>{
     holder.remove();
     const bridge=window.ildangaChatRouteBridge;
     if(bridge&&typeof bridge.discover==='function')bridge.discover(query);
     else messageBubble('코스 검색 연결이 없어요. 여행 코스 통합검색을 이용해 주세요.');
   });
   holder.append(info,button);chat().appendChild(holder);chat().scrollTop=chat().scrollHeight;
 }
 function messageBubble(text){const list=chat();if(!list)return;const node=document.createElement('div');node.className='free-chat-bubble theirs';node.textContent=text;list.append(node);}
 function reset(){generation++;lastTravel='';lastOfferedKey='';removeOldOffers();window.ildangaChatRouteBridge?.reset?.();}
 window.ildangaChatSafeRoute={maybeOffer,reset};
})();
