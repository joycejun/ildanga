/* Ildanga home-to-chat UI. Text testing is NOT proof of platform Gleo registration. */
(function () {
  'use strict';
  const $one = s => document.querySelector(s);
  const escChat = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const log = [];
  const maxEntries = 30;

  function hideDuplicateSearch() {
    const b = document.getElementById('ildangaUnifiedSearch');
    if (b) b.remove();
  }
  function beautifyHome() {
    hideDuplicateSearch();
    const heading = $one('.create-title');
    if (heading) { heading.textContent = '✦ Gleo와 나만의 루트 만들기'; heading.setAttribute('aria-label', 'Gleo 대화창 열기'); }
    const example = $one('.ai-example');
    if (example) { example.innerHTML = '“서울에서 카페 투어하고 싶어” <span>↗</span>'; example.setAttribute('aria-label', 'Gleo 대화창 열기'); }
    // The main region/course search CTA stays available. Only remove redundant header CTA.
  }
  if (typeof window.home === 'function') {
    const previousHome = window.home;
    window.home = function () { const result = previousHome.apply(this, arguments); beautifyHome(); return result; };
  }
  hideDuplicateSearch();
  if ($one('.createhero')) beautifyHome();

  function add(role, message) {
    log.push({role, text: String(message || '')});
    if (log.length > maxEntries) log.shift();
  }
  function renderMessages() {
    const target = $one('#gleoChatMessages');
    if (!target) return;
    target.innerHTML = log.map(x => `<div class="gleo-msg ${x.role === 'user' ? 'mine' : 'assistant'}"><span>${x.role === 'user' ? '나' : '일단가'}</span><p>${escChat(x.text)}</p></div>`).join('');
    target.scrollTop = target.scrollHeight;
  }
  function drawChat() {
    const body = `<div class="gleo-chat" role="region" aria-label="일단가 채팅 명령 테스트">
      <div class="gleo-chat-head"><div class="gleo-chat-symbol">✦</div><div><h2>Gleo와 여행 코스 만들기</h2><p>채팅으로 코스를 만들고 수정해 보세요.</p></div></div>
      <div class="gleo-chat-status">앱 내부 텍스트 테스트 · 실제 PLEOS Gleo 연동은 별도 확인 필요</div>
      <div id="gleoChatMessages" class="gleo-chat-messages" aria-live="polite"></div>
      <div class="gleo-chat-suggestions">
       <button type="button" data-gleo-prompt="서울 여행 코스 만들어 줘">서울 코스</button>
       <button type="button" data-gleo-prompt="순서 역순으로 바꿔 줘">역순 변경</button>
       <button type="button" data-gleo-prompt="첫 번째와 두 번째 장소 바꿔줘">순서 교환</button>
       <button type="button" data-gleo-prompt="이 코스 저장해 줘">코스 저장</button>
      </div>
      <form id="gleoChatForm" class="gleo-chat-compose">
       <input id="gleoChatInput" maxlength="200" autocomplete="off" aria-label="일단가 채팅 입력" placeholder="예: 두 번째 장소 빼줘" />
       <button class="primary" type="submit">전송 ↗</button>
      </form>
      <p class="gleo-chat-note">주변 카페·빵투어처럼 실제 장소를 찾으려면 채팅에서 검색어를 입력하면 검색 화면으로 이어집니다.</p>
      <style>
       .gleo-chat{display:flex;flex-direction:column;gap:12px;min-width:0;width:min(610px,82vw);max-width:100%}
       .gleo-chat-head{display:flex;gap:12px;align-items:center}.gleo-chat-head h2{margin:0;font-size:21px}.gleo-chat-head p{margin:4px 0 0;color:#5f707a;font-size:13px}.gleo-chat-symbol{font-size:26px;color:#168bb2}
       .gleo-chat-status{font-size:12px;padding:9px 11px;border-radius:10px;background:#eef6f5;color:#426064}
       .gleo-chat-messages{min-height:195px;max-height:min(40vh,340px);overflow-y:auto;display:flex;flex-direction:column;align-items:flex-start;gap:12px;padding:10px 2px}
       .gleo-msg{max-width:88%;border-radius:15px;padding:10px 14px;background:#f3f7f7;color:#233b43;overflow-wrap:anywhere}.gleo-msg.mine{align-self:flex-end;background:#e0f2ff}.gleo-msg span{font-size:11px;opacity:.6}.gleo-msg p{margin:4px 0;line-height:1.5;font-size:14px}
       .gleo-chat-suggestions{display:flex;gap:6px;flex-wrap:wrap}.gleo-chat-suggestions button{font-size:12px;padding:7px 9px;border-radius:24px}
       .gleo-chat-compose{display:flex;gap:8px}.gleo-chat-compose input{min-width:0;flex:1;border-radius:12px;padding:11px}.gleo-chat-compose button{white-space:nowrap;border-radius:12px}
       .gleo-chat-note{font-size:11px;color:#677d81;line-height:1.5;margin:0}
      </style>
     </div>`;
    if (typeof modal !== 'function') return;
    modal(body);
    if (!log.length) add('assistant', '어디로 떠나고 싶어? 지역과 여행 테마를 말해 줘! 코스 순서 변경과 저장도 가능해.');
    renderMessages();
    $one('#gleoChatForm')?.addEventListener('submit', e => {e.preventDefault(); submitChat();});
    $one('#gleoChatMessages')?.addEventListener('click',()=>{});
    document.querySelectorAll('[data-gleo-prompt]').forEach(b => b.addEventListener('click',()=> { const input=$one('#gleoChatInput'); if(input)input.value=b.getAttribute('data-gleo-prompt'); submitChat(); }));
    $one('#gleoChatInput')?.focus();
  }
  window.openGleoChat = function () {drawChat();};
  // Override ONLY the obsolete manual builder entry point, not the route editing UI.
  window.openRouteBuilder = function () {drawChat();};

  function ordinal(x) {
    const names = {'첫':'1','두':'2','세':'3','네':'4','다섯':'5','여섯':'6','일곱':'7','여덟':'8','마지막':'last'};
    if (/^\d+$/.test(x)) return Number(x);
    return names[x] === 'last' ? (Array.isArray(state.route) ? state.route.length : 0) : Number(names[x] || 0);
  }
  function dispatch(action, params) {
    if (typeof window.ildangaGleoDispatch !== 'function') return {status:'fail',message:'명령 처리 연결이 없어요. Gleo 패치가 적용됐는지 확인해 주세요.'};
    try {
      const output = window.ildangaGleoDispatch(action, JSON.stringify(params));
      return JSON.parse(output);
    } catch (e) {return {status:'fail',message:'명령 실행 중 오류가 발생했어요.'};}
  }
  function parseMessage(text) {
    const s = text.replace(/\s+/g,' ').trim();
    const any = terms => terms.some(x => s.includes(x));
    if (any(['저장','보관'])) return {type:'dispatch', action:'SAVE_TRAVEL_ROUTE',params:{}};
    if (any(['역순','거꾸로','뒤집'])) return {type:'dispatch',action:'EDIT_TRAVEL_ROUTE',params:{operation:'reverse'}};
    const ord='(\\d+|첫|두|세|네|다섯|여섯|일곱|여덟|마지막)';
    const swap = new RegExp(ord+'(?:\\s*번째|\\s*번)?(?:\\s*장소)?(?:와|과|이랑|랑|하고|\\s*및\\s*)\\s*'+ord+'(?:\\s*번째|\\s*번)?(?:\\s*장소)?');
    const matchSwap=s.match(swap);
    if (matchSwap && any(['바꿔','교환','순서','스왑'])) return {type:'dispatch',action:'EDIT_TRAVEL_ROUTE',params:{operation:'swap',first:ordinal(matchSwap[1]),second:ordinal(matchSwap[2])}};
    const matchRemove=s.match(new RegExp(ord+'(?:\\s*번째|\\s*번)?(?:\\s*장소)?'));
    if (matchRemove && any(['빼','삭제','제외','지워'])) return {type:'dispatch',action:'EDIT_TRAVEL_ROUTE',params:{operation:'remove',first:ordinal(matchRemove[1])}};
    const locations=['서울','경주','부산','강릉','제주','대전','전주'];
    const city=locations.find(x=>s.includes(x));
    const themes=['카페','빵투어','빵집','베이커리','드라이브','데이트','맛집','힐링','야경','바다'];
    const themed=themes.some(x=>s.includes(x));
    if ((city || themed) && any(['찾','추천','여행','코스','만들','가고','투어'])) {
      if (themed || !city) return {type:'search',query:s.replace(/(만들어\s*줘|추천해\s*줘|찾아\s*줘|알려\s*줘|가고\s*싶어|코스)/g,' ').trim() || s};
      return {type:'dispatch',action:'CREATE_TRAVEL_ROUTE',params:{region:city}};
    }
    return {type:'help'};
  }
  function submitChat() {
    const input=$one('#gleoChatInput');
    const text=input?.value.trim();
    if (!text) return;
    input.value='';
    add('user',text);
    const task=parseMessage(text);
    if (task.type==='search') {
      add('assistant','실제 장소 기반 코스를 찾아볼게. 검색 결과에서 원하는 코스를 선택해 줘.');
      renderMessages();
      if (typeof window.openTourBrowser === 'function') {
        window.openTourBrowser(task.query);
        return;
      }
      add('assistant','여행 코스 통합검색 기능이 연결되지 않았어.');
    } else if(task.type==='dispatch') {
      const answer=dispatch(task.action,task.params);
      const messages={CREATE_TRAVEL_ROUTE:'여행 코스를 불러왔어.',EDIT_TRAVEL_ROUTE:'방문 순서를 수정했어.',SAVE_TRAVEL_ROUTE:'내 루트에 저장했어.'};
      add('assistant',answer.status==='success' ? messages[task.action] : (answer.message||'명령을 실행하지 못했어.'));
    } else {
      add('assistant','지금은 지역 코스 생성, 방문지 순서 교환·삭제·역순, 저장을 지원해. 예: “서울 코스 만들어 줘”, “1번이랑 2번 바꿔줘”. 이 채팅은 실제 Gleo 음성 서비스가 아닌 앱 내부 명령 테스트야.');
    }
    // The shared route dispatcher navigates/close the modal on success; restore conversation UI.
    drawChat();
  }
})();
