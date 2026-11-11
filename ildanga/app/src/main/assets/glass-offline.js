/* 일단가 v3.18 — 서버 없이도 시연되는 "예시 데이터 모드"
 * 서버(/api/*)가 없거나 응답이 실패하면 앱 안에 들어 있는 예시 데이터로 대신 답해요.
 * - 서버가 정상이면 아무 것도 바꾸지 않아요(진짜 데이터가 우선).
 * - 예시 데이터는 화면에 "예시"라고 표시돼요. 실제 영업시간·전화번호·주차장이 아니에요.
 * - 강제로 켜기: 주소에 ?demo=1  또는  localStorage['g3.demo']='1'   /  끄기: ?demo=0
 */
(function () {
  'use strict';
  if (window.__g3Offline || typeof window.fetch !== 'function') return;
  window.__g3Offline = true;
  const realFetch = window.fetch.bind(window);
  let forced = false;
  try {
    const q = new URLSearchParams(location.search).get('demo');
    if (q === '1') localStorage.setItem('g3.demo', '1');
    if (q === '0') localStorage.removeItem('g3.demo');
    forced = localStorage.getItem('g3.demo') === '1';
  } catch (e) {}
  let announced = false, serverDown = false;   // 서버가 진짜 안 될 때만 true (요약만 실패한 경우는 예시로 바꾸지 않음)
  function announce() {
    if (announced) return; announced = true;
    const show = () => {
      if (document.getElementById('g3DemoChip')) return;
      const c = document.createElement('div');
      c.id = 'g3DemoChip'; c.setAttribute('role', 'status');
      c.textContent = '예시 데이터 모드 · 서버 미연결';
      (document.body || document.documentElement).appendChild(c);
    };
    document.body ? show() : document.addEventListener('DOMContentLoaded', show);
  }
  function hideChip() { announced = false; const c = document.getElementById('g3DemoChip'); if (c) c.remove(); }
  const json = (obj, status) => new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-G3-Demo': '1' } });
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
  const num = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };
  const hav = (a, b) => { const R = 6371000, r = x => x * Math.PI / 180, dLa = r(b.lat - a.lat), dLo = r(b.lng - a.lng), h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };

  const REVIEW_POOL = [
    ['분위기가 좋고 직원분들이 친절했어요. 사진 찍기 좋아요.', 5], ['음식 맛이 좋고 가격도 괜찮았어요.', 5], ['주말에는 웨이팅이 있어서 평일에 가는 걸 추천해요.', 4],
    ['주차가 조금 불편했어요. 근처 공영주차장을 이용했어요.', 3], ['깔끔하고 조용해서 데이트하기 좋았어요.', 5], ['대표 메뉴가 특히 맛있었어요. 다음에 또 올게요.', 5]
  ];
  function demoReviews(u) {
    const name = u.searchParams.get('name') || '이 장소', h = hash(name);
    const pick = [0, 1, 2, 3, 4, 5].map(i => REVIEW_POOL[(h + i) % REVIEW_POOL.length]).filter((x, i, a) => a.indexOf(x) === i).slice(0, 5);
    return {
      demo: true, provider: 'Google Maps', placeId: 'demo-' + h, name, rating: 4.4, ratingCount: 120 + (h % 900),
      sourceUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(name),
      hours: { weekdayDescriptions: ['월요일: 10:00~21:00', '화요일: 10:00~21:00', '수요일: 10:00~21:00', '목요일: 10:00~21:00', '금요일: 10:00~22:00', '토요일: 10:00~22:00', '일요일: 10:00~20:00'] },
      reviews: pick.map(([t, r], i) => ({ rating: r, text: { text: t }, originalText: { text: t }, authorAttribution: { displayName: '예시 ' + (i + 1) }, relativePublishTimeDescription: '예시' }))
    };
  }
  function demoSummary(u) {
    const pid = u.searchParams.get('placeId') || '';
    return {
      demo: true, placeId: pid, model: '예시 데이터', count: 5,
      summary: '분위기와 친절한 응대를 칭찬하는 후기가 많고, 주말 대기와 주차는 아쉽다는 의견이 있어요.',
      good: ['분위기가 좋고 사진 찍기 좋아요', '직원분들이 친절해요', '대표 메뉴가 맛있어요'],
      bad: ['주말에는 웨이팅이 있어요', '주차 공간이 넉넉하지 않아요'],
      tip: ['평일 낮 시간대가 한적해요', '근처 공영주차장을 미리 확인하세요']
    };
  }
  function demoSearch(u) {
    const q = (u.searchParams.get('query') || '').trim(), lat = num(u.searchParams.get('lat')), lng = num(u.searchParams.get('lng'));
    const radius = num(u.searchParams.get('radius')) || 5000;
    if (lat == null || lng == null) return { demo: true, places: [] };
    if (/주차/.test(q)) {
      const spots = [[0.0011, 0.0008, '예시 공영주차장 A'], [-0.0016, 0.0013, '예시 공영주차장 B'], [0.0021, -0.0019, '예시 노상 주차장']];
      return { demo: true, places: spots.map(([dy, dx, n], i) => { const p = { lat: lat + dy, lng: lng + dx }; return { id: 'demo-park-' + i + '-' + hash(q + lat), name: n, address: '(예시) 서버 연결 시 실제 주차장이 표시돼요', lat: p.lat, lng: p.lng, distanceMeters: Math.round(hav({ lat, lng }, p)), placeUrl: '' }; }) };
    }
    const src = (typeof places === 'object' && places) ? Object.entries(places) : [];
    const list = src.map(([k, p]) => ({ k, p })).filter(({ p }) => p && num(p.lat) != null && num(p.lng) != null)
      .map(({ k, p }) => ({ id: 'demo-' + k, name: p.name, address: p.region ? p.region + ' (예시)' : '(예시)', lat: Number(p.lat), lng: Number(p.lng), cat: p.cat || '', distanceMeters: Math.round(hav({ lat, lng }, { lat: Number(p.lat), lng: Number(p.lng) })), placeUrl: '' }))
      .filter(x => x.distanceMeters > 30 && x.distanceMeters <= radius && (!q || x.name.includes(q) || (x.cat && (x.cat.includes(q) || q.includes(x.cat)))))
      .sort((a, b) => a.distanceMeters - b.distanceMeters).slice(0, 10);
    return { demo: true, places: list };
  }
  function demoFor(path, u) {
    if (path === '/api/google/reviews') return json(demoReviews(u));
    if (path === '/api/google/summary') return json(demoSummary(u));
    if (path === '/api/places/search') return json(demoSearch(u));
    if (path === '/api/health') return json({ ok: true, demo: true });
    if (path.startsWith('/api/tour/')) return json({ demo: true, error: '예시 모드에서는 관광공사 사진을 불러오지 않아요.' }, 404);
    return null;
  }
  window.fetch = function (input, init) {
    let u;
    try {
      const raw = typeof input === 'string' ? input : (input && input.url) || '';
      u = new URL(raw, location.href);
      if (u.origin !== location.origin || !u.pathname.startsWith('/api/')) return realFetch(input, init);
    } catch (e) { return realFetch(input, init); }
    const path = u.pathname;
    const isSum = path === '/api/google/summary';
    if (forced) { const r = demoFor(path, u); if (r) { announce(); return Promise.resolve(r); } return realFetch(input, init); }
    return realFetch(input, init).then(res => {
      if (res.status === 404 || res.status === 405 || res.status === 501 || res.status >= 502) {
        if (isSum && !serverDown) return res;                 // 서버는 살아있고 요약만 실패 → 기존처럼 키워드 요약
        const r = demoFor(path, u);
        if (r && path !== '/api/tour/photo') { if (!isSum) serverDown = true; announce(); return r; }
      } else if (res.ok && !isSum && path !== '/api/tour/photo') { serverDown = false; hideChip(); }
      return res;
    }, err => {
      if (isSum && !serverDown) throw err;
      const r = demoFor(path, u);
      if (r) { if (!isSum) serverDown = true; announce(); return r; }
      throw err;
    });
  };
  window.g3DemoMode = on => { try { on ? localStorage.setItem('g3.demo', '1') : localStorage.removeItem('g3.demo'); } catch (e) {} location.reload(); };
})();
