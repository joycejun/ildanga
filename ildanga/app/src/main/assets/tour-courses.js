/* Ildanga unified tourist-route search: official KTO + Kakao grounded auto-routes. */
(function(){
'use strict';
const regions=['전체','서울','경주','부산','강릉','제주','전주','대전','인천','대구','광주','울산','세종','수원','성남','광명','용인','파주','양평','가평','춘천','속초','안동','포항','여수','순천','목포','남해','통영','거제','창원','마산','진주','청주','충주','천안','공주','보령','태안','경기','강원','경북','경남','전북','전남','충북','충남'];
const themes=['전체','빵투어','카페','맛집','드라이브','데이트','역사문화','자연힐링','바다여행','야경','가족여행','반려동물','산책','축제','시장투어','쇼핑','캠핑'];
let lastData=null, lastRegion='전체',lastTheme='전체',lastQuery='',selectedOfficial=null;
const safe=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const el=s=>document.querySelector(s);
const combo=(id,arr,current)=>`<select id="${id}" aria-label="${id==='tourRegion'?'지역':'테마'}" style="padding:11px;border-radius:12px;max-width:100%;min-width:115px">${arr.map(s=>`<option value="${safe(s)}" ${s===current?'selected':''}>${safe(s)}</option>`).join('')}</select>`;
function show(html){const m=el('#modal');m.innerHTML='<button class="close" onclick="document.querySelector(\'#modal\').close()">×</button>'+html;if(!m.open)m.showModal()}
function searchPanel(){
 show(`<h2>🔎 전국 여행 코스 검색</h2><p class="muted">지역이나 테마를 자유롭게 입력해 보세요. 공식 여행코스와 실제 장소 기반 코스를 함께 검색해요.</p>
 <form id="tourSearchForm" onsubmit="event.preventDefault();searchAllRoutes()" style="display:flex;flex-wrap:wrap;gap:9px;margin:14px 0">
 <input id="tourKeyword" aria-label="여행 검색어" maxlength="80" value="${safe(lastQuery)}" placeholder="서울 카페 / 강릉 드라이브 / 경주 역사 여행" style="flex:1 1 210px;min-width:0">
 ${combo('tourRegion',regions,lastRegion)}${combo('tourTheme',themes,lastTheme)}
 <button class="primary" type="submit" style="min-width:100px">검색</button></form>
 <div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:13px">${['서울 카페','대전 빵투어','강릉 드라이브','경주 역사문화','부산 데이트','제주 자연힐링'].map(s=>`<button type="button" class="small" data-search="${safe(s)}">${safe(s)}</button>`).join('')}</div>
 <p class="muted">공식 코스 = 한국관광공사 등록 콘텐츠 · 자동 구성 = 카카오 실제 장소를 일단가가 연결한 경로</p>
 <div id="tourResults" role="status" style="max-height:55vh;overflow:auto">검색어를 입력하거나 지역·테마를 선택해 주세요.</div>`);
 el('#tourSearchForm').onsubmit=e=>{e.preventDefault();searchAllRoutes()};
 el('#tourKeyword').focus();
 el('#tourResults').addEventListener('click',e=>{const b=e.target.closest('button[data-index]');if(!b)return;const i=Number(b.dataset.index);if(b.dataset.kind==='auto')importAutoRoute(i);else viewTourCourse(i)});
 for(const b of el('#modal').querySelectorAll('[data-search]'))b.addEventListener('click',()=>{
   el('#tourKeyword').value=b.dataset.search;el('#tourRegion').value='전체';el('#tourTheme').value='전체';searchAllRoutes();
 });
}
window.openTourBrowser=function(query){if(typeof query==='string')lastQuery=query;searchPanel()};
window.searchAllRoutes=async function(){
 const q=el('#tourKeyword')?.value.trim()||'';const region=el('#tourRegion')?.value||'전체';const theme=el('#tourTheme')?.value||'전체';
 lastQuery=q;lastRegion=region;lastTheme=theme;
 const result=el('#tourResults');if(!result)return;
 result.textContent='관광공사 공식 코스와 카카오 실제 장소를 찾는 중이에요…';
 const token=(window.ildangaTourSearchToken||0)+1;window.ildangaTourSearchToken=token;
 try{
   const res=await fetch('/api/tour/discover?'+new URLSearchParams({query:q,region,theme}));
   const data=await res.json();if(!res.ok)throw Error(data.error||'통합 코스 검색 실패');
   if(window.ildangaTourSearchToken!==token||!el('#tourResults'))return;
   lastData=data;
   const official=(data.official||[]),auto=(data.generated||[]);
   const officialHtml=official.length?official.map((p,i)=>`<article class="resultcard"><h3>${safe(p.title)}</h3><p>한국관광공사 공식 여행코스 · ${safe(p.address||'위치 정보 확인 필요')}</p><button type="button" class="primary" data-kind="official" data-index="${i}">방문지 확인 →</button></article>`).join(''):'<p class="muted">조건에 맞는 공식 여행코스가 없어요.</p>';
   const autoHtml=auto.length?auto.map((p,i)=>`<article class="resultcard"><h3>${safe(p.title)}</h3><p><b>${safe(p.district||p.region||"지역")}</b> · 실제 장소 기반 · 테마 맞춤 자동 구성 · ${p.stops.length}곳</p><ol style="margin:8px 0">${p.stops.map(x=>`<li>${safe(x.name)} <small>${safe(x.address||'')}</small></li>`).join('')}</ol><p class="muted">영업시간·이동거리·방문 적합성 확인 필요</p><button type="button" class="primary" data-kind="auto" data-index="${i}">이 코스로 지도 열기 →</button></article>`).join(''):'<p class="muted">현재 조건으로 자동 구성할 실제 장소가 부족해요. 동네명이나 좀 더 구체적인 검색어를 입력해 주세요.</p>';
   result.innerHTML=`<p><b>${safe(data.region)} · ${safe(data.theme)}</b> 검색 결과</p><h3>🏛 한국관광공사 공식 코스 (${official.length})</h3>${officialHtml}<h3 style="margin-top:20px">🚗 실제 장소로 자동 구성 (${auto.length})</h3>${autoHtml}${(data.warnings||[]).length?`<p class="muted">연결 안내: ${safe(data.warnings.join(' / '))}</p>`:''}<p class="muted">${safe(data.notice||'')}</p>`;
 }catch(e){if(window.ildangaTourSearchToken===token&&el('#tourResults'))el('#tourResults').textContent='검색 오류: '+e.message+' · CONNECT_REVIEWS.cmd 서버 및 API 키를 확인해 주세요.'}
};
function importAutoRoute(i){
 const d=lastData?.generated?.[i];if(!d)return;
 const valid=(d.stops||[]).filter(p=>/^kakao[0-9]+$/.test(p.id)&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&p.name);
 if(valid.length<2){el('#tourResults').textContent='검증된 실제 장소가 2곳 미만이에요. 다시 검색해 주세요.';return}
 state.customPlaces=state.customPlaces||{};
 for(const p of valid){const place={name:p.name,lat:p.lat,lng:p.lng,cat:p.cat||'관광지',region:d.region==='전체'?'여행':d.region,address:p.address||'',phone:p.phone||'',placeUrl:p.placeUrl||'',provider:'Kakao'};places[p.id]=place;state.customPlaces[p.id]=place}
 state.route=valid.map(p=>p.id);state.title=d.title;state.region=d.region==='전체'?'여행':d.region;state.source='generated';persist();el('#modal').close();go('route');toast('카카오 실제 장소로 만든 코스예요. 경로와 영업 정보를 확인해 주세요.');
}
window.viewTourCourse=async function(i){
 const p=lastData?.official?.[i];if(!p)return;selectedOfficial=p;
 show(`<h2>${safe(p.title)}</h2><p class="muted">한국관광공사 상세 코스 조회 중…</p>`);
 try{
  const res=await fetch('/api/tour/course?'+new URLSearchParams({id:p.id}));const d=await res.json();if(!res.ok)throw Error(d.error||'상세 조회 실패');
  show(`<h2>${safe(d.title||p.title)}</h2><p class="muted">출처: 한국관광공사 TourAPI</p><p>${safe(d.description||'')}</p><h3>방문 순서</h3>${(d.stops||[]).length?`<ol>${d.stops.map(s=>`<li>${safe(s.name)}</li>`).join('')}</ol>`:'<p>공식 자료에 개별 방문지가 없어요.</p>'}<p class="muted">카카오에서 이름이 정확히 확인된 방문지만 가져옵니다.</p><button class="primary" id="tourImportOfficial" ${d.stops?.length>=2?'':'disabled'}>내 루트로 가져오기</button> <button id="tourBack">검색으로 돌아가기</button><div id="tourImportStatus" role="status"></div>`);
  el('#tourImportOfficial').onclick=()=>importTourCourse(p.id,p.address||'',p.title);el('#tourBack').onclick=()=>searchPanel();
 }catch(e){show(`<h2>상세 조회 실패</h2><p>${safe(e.message)}</p><button id="tourBack">검색으로 돌아가기</button>`);el('#tourBack').onclick=()=>searchPanel()}
};
window.importTourCourse=async function(id,address,title){const s=el('#tourImportStatus');if(s)s.textContent='카카오에서 공식 코스의 개별 방문지를 확인하는 중이에요…';
 try{
  const res=await fetch('/api/tour/import?'+new URLSearchParams({id}));const d=await res.json();if(!res.ok)throw Error(d.error||'방문지 매칭 실패');
  const valid=(d.places||[]).filter(p=>/^kakao\d+$/.test(p.id)&&Number.isFinite(p.lat)&&Number.isFinite(p.lng));
  if(valid.length<2){if(s)s.textContent=`확인된 장소가 ${valid.length}곳뿐이라 코스를 가져오지 않았어요. 미확인 장소: ${(d.unresolved||[]).join(', ')}`;return}
  state.customPlaces=state.customPlaces||{};
  const region=lastData?.region||'여행';
  for(const p of valid){const pp={name:p.name,lat:p.lat,lng:p.lng,cat:'관광지',region:region==='전체'?'여행':region,address:p.address||'',placeUrl:p.placeUrl||'',provider:'Kakao'};places[p.id]=pp;state.customPlaces[p.id]=pp}
  state.route=valid.map(p=>p.id);state.region=region==='전체'?'여행':region;state.title=d.course?.title||title||'한국관광공사 여행코스';state.source='tour'+id;persist();el('#modal').close();go('route');toast(`공식 코스에서 ${valid.length}곳을 가져왔어요. 미확인 ${(d.unresolved||[]).length}곳은 제외했어요.`);
 }catch(e){if(s)s.textContent='가져오기 실패: '+e.message}
};
// Upgrade entry points without modifying existing navigation/reviews/Gleo source.
window.openHomeSearch=function(){window.openTourBrowser()};
const nav=document.querySelector('header nav');
if(nav&&!document.getElementById('ildangaUnifiedSearch')){
 const b=document.createElement('button');b.id='ildangaUnifiedSearch';b.type='button';b.textContent='🔎 여행 코스 통합검색';b.addEventListener('click',()=>window.openTourBrowser());nav.insertAdjacentElement('afterend',b);
}
})();
