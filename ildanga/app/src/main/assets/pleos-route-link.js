/* Ildanga: PLEOS 2-waypoint segmented navigation. No automatic arrival detection. */
(function () {
  'use strict';
  const MAX_STOPS_PER_REQUEST = 3; // up to TWO waypoints plus final destination
  const KEY = 'ildanga.pleos.segment.v1';
  const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let current = null;

  function snapshot() {
    if (!Array.isArray(state.route)) return [];
    return state.route.map(id => {
      const p = places[id];
      if (!p) return null;
      return { id, name: String(p.name || ''), latitude: Number(p.lat), longitude: Number(p.lng),
        address: String(p.address || ''), poiId: String(p.pleosPoiId || ''), poiSubId: String(p.pleosPoiSubId || '0') };
    }).filter(Boolean);
  }
  function signature(stops) {
    return JSON.stringify(stops.map(p => [p.id, p.latitude, p.longitude]));
  }
  function restore(sig) {
    try {
      const data = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (data && data.sig === sig && Number.isInteger(data.index) && data.index >= 0) return data.index;
    } catch (e) {}
    return 0;
  }
  function persist() {
    if (!current) return;
    try { sessionStorage.setItem(KEY, JSON.stringify({sig: current.sig, index:current.index})); } catch (e) {}
  }
  function segments(stops) {
    const chunks = [];
    for (let i = 0; i < stops.length; i += MAX_STOPS_PER_REQUEST) chunks.push(stops.slice(i,i+MAX_STOPS_PER_REQUEST));
    return chunks;
  }
  function render() {
    if (!current) return;
    const chunks = segments(current.stops);
    if (current.index >= chunks.length) current.index = 0;
    const active = chunks[current.index];
    const list = document.querySelector('#segmentList');
    if (list) list.innerHTML = chunks.map((part, i) =>
      `<li style="margin:8px 0;${i === current.index ? 'font-weight:700;' : ''}">`+
      `${i+1}구간: ${part.map(p=>escapeHtml(p.name)).join(' → ')}`+
      `${i === current.index ? ' · 현재 선택' : ''}</li>`).join('');
    const info = document.querySelector('#segmentProgress');
    if (info) info.textContent = `${current.index+1}/${chunks.length}구간 · 이번 안내 ${active.length}곳 / 전체 ${current.stops.length}곳`;
    const start = document.querySelector('#pleosDepart');
    if (start) start.textContent = `${current.index+1}구간 PLEOS 내비 열기`;
    const next = document.querySelector('#pleosNext');
    if (next) {
      const hasNext = current.index + 1 < chunks.length;
      next.disabled = !hasNext;
      next.textContent = hasNext ? `다음 ${current.index+2}구간 선택` : '마지막 구간입니다';
    }
  }
  function startCurrentSegment() {
    if (!current) return;
    const native = window.IldangaNavigation;
    if (!native || typeof native.startRoute !== 'function') return toast('PLEOS 내비 SDK가 설치된 Android 앱에서 실행해 주세요.');
    const group = segments(current.stops)[current.index];
    const status = document.querySelector('#navStatus');
    if (status) status.textContent = 'PLEOS에 경로 요청 중… 실제 길안내 성공 여부는 내비 화면에서 확인하세요.';
    try {
      native.startRoute(JSON.stringify({stops:group}));
    } catch (e) {
      if (status) status.textContent = '경로 전달 실패: ' + String(e.message || e);
    }
  }
  const oldRoute = window.route;
  if (typeof oldRoute === 'function') {
    window.route = function() {
      const result = oldRoute.apply(this, arguments);
      document.querySelectorAll('button').forEach(b=>{
        if(b.getAttribute('onclick') === 'navigate()') b.textContent = '🚗 이 코스로 출발하기';
      });
      return result;
    };
  }
  window.navigate = function() {
    const stops = snapshot();
    if (stops.length < 2) return toast('방문지가 2곳 이상 필요해요.');
    if (stops.some(p=> !Number.isFinite(p.latitude) || !Number.isFinite(p.longitude) || Math.abs(p.latitude)>90 || Math.abs(p.longitude)>180)) return toast('방문지 좌표를 확인해 주세요.');
    const sig = signature(stops);
    const index = restore(sig);
    current = {stops, sig, index};
    const chunks = segments(stops);
    modal(`<h2>🚗 코스 길안내</h2>`+
      `<p class="muted">방문지가 많아도 구간별로 나눠 출발할 수 있어요.</p>`+
      `<div id="segmentProgress" role="status"></div>`+
      `<ol id="segmentList"></ol>`+
      `<p class="muted">다음 구간은 도착 후 직접 선택해 주세요.</p>`+
      `<details class="muted" style="margin:10px 0"><summary>길안내 안내 사항</summary><p>내비에서 실제 경로 생성 여부를 확인해 주세요. 카카오 장소와 PLEOS 장소 ID는 다를 수 있어요.</p></details>`+
      `<div id="navStatus" role="status"></div>`+
      `<div class="row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">`+
      `<button class="primary" id="pleosDepart"></button><button id="pleosNext"></button><details style="width:100%;font-size:12px;color:#667"><summary>개발자 테스트</summary><button id="pleosDebug" type="button">SDK 예제 테스트</button></details></div>`);
    document.querySelector('#pleosDepart').onclick = startCurrentSegment;
    document.querySelector('#pleosNext').onclick = () => {
      if (!current || current.index >= chunks.length-1) return;
      current.index++;
      persist();
      render();
      const status = document.querySelector('#navStatus');
      if (status) status.textContent='다음 구간을 선택했어요. PLEOS 내비 열기를 눌러 출발하세요.';
    };
    document.querySelector('#pleosDebug').onclick=()=>{
      if (!window.IldangaNavigation?.testSdkRoute) return toast('PLEOS SDK 연결이 필요해요.');
      window.IldangaNavigation.testSdkRoute();
    };
    render();
  };
  window.onIldangaNavigationResult = function(status, message) {
    const box = document.querySelector('#navStatus');
    const text = String(message || status || '');
    if (box) box.textContent=text;
    else toast(text);
  };
})();
