/* Ildanga Glass v3 — presentation layer matching the purple "dusk glass" reference screens.
   Adds: Pretendard UI, floating bottom tab bar, new home, chat-style Gleo dialog, PLEOS segment-navigation dialog.
   Presentation only. It does NOT touch search providers, the PLEOS navigation SDK bridge, Gleo action
   registration, or the localStorage format. Load AFTER aurora-app.js. */
(function () {
  'use strict';
  if (window.__ildangaGlassV3) return;
  window.__ildangaGlassV3 = true;

  const $ = s => document.querySelector(s);
  const safe = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const root = document.documentElement;
  root.classList.add('ild-g3');

  /* ---------- icons (stroke icons, currentColor) ---------- */
  const svg = (body, cls) => `<svg class="g3-ic ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
  const ICON = {
    home: svg('<path d="M3.6 11.2 12 4l8.4 7.2V19a1.4 1.4 0 0 1-1.4 1.4h-3.6v-5.6H8.6v5.6H5A1.4 1.4 0 0 1 3.6 19z"/>', 'fillable'),
    route: svg('<circle cx="6" cy="18.2" r="2.2"/><path d="M8.2 18.2h6.1a3.1 3.1 0 0 0 0-6.2H9.7a3.1 3.1 0 0 1 0-6.2h2.4"/><path d="M17.6 2.8a3 3 0 0 1 3 3c0 2.5-3 5.3-3 5.3s-3-2.8-3-5.3a3 3 0 0 1 3-3z"/><circle cx="17.6" cy="5.8" r=".9" fill="currentColor" stroke="none"/>'),
    bookmark: svg('<path d="M6.6 3.8h10.8a1 1 0 0 1 1 1v15.4L12 16.4l-6.4 3.8V4.8a1 1 0 0 1 1-1z"/>', 'fillable'),
    user: svg('<circle cx="12" cy="8" r="3.7"/><path d="M4.6 20.2c.6-3.9 3.7-6.1 7.4-6.1s6.8 2.2 7.4 6.1z"/>', 'fillable'),
    search: svg('<circle cx="10.5" cy="10.5" r="6.2"/><path d="m15.2 15.2 5 5"/>'),
    car: svg('<path d="m4.6 11.4 2-4.7a2 2 0 0 1 1.8-1.2h7.2a2 2 0 0 1 1.8 1.2l2 4.7"/><rect x="3" y="11.4" width="18" height="6.4" rx="2.2"/><circle cx="7.6" cy="14.6" r=".95" fill="currentColor" stroke="none"/><circle cx="16.4" cy="14.6" r=".95" fill="currentColor" stroke="none"/><path d="M6.2 17.8v1.9M17.8 17.8v1.9"/>'),
    cup: svg('<path d="M4.8 9.2h11.4v4.6a4.2 4.2 0 0 1-4.2 4.2H9a4.2 4.2 0 0 1-4.2-4.2z"/><path d="M16.2 10.4h1.4a2.4 2.4 0 0 1 0 4.8h-1.4M8.6 3.6c0 1 .9 1.3.9 2.4M12.4 3c0 1 .9 1.3.9 2.4"/><path d="M4 20.4h13"/>'),
    bread: svg('<path d="M3 15.2c0-3.9 4-7.4 9-7.4s9 3.5 9 7.4l-3 1.3-2-2.1-2 2.6-2-2.6-2 2.6-2-2.6-2 2.1z"/><path d="M9 8.6 10.3 13M15 8.6 13.7 13"/>'),
    heart: svg('<path d="M12 20s-7.6-4.6-7.6-10.3A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 7.6 2.4C19.6 15.4 12 20 12 20z"/>'),
    send: svg('<path d="M21 3 10.2 13.8M21 3l-6.6 18-4.2-7.2L3 9.6z"/>'),
    pin: svg('<path d="M12 21.2s-6.2-5.5-6.2-10.2a6.2 6.2 0 0 1 12.4 0c0 4.7-6.2 10.2-6.2 10.2z"/><circle cx="12" cy="11" r="2.2"/>'),
    chevron: svg('<path d="m9 6 6 6-6 6"/>'),
    chat: svg('<path d="M4.4 5.2h15.2a1 1 0 0 1 1 1v9.2a1 1 0 0 1-1 1H9.6L5 20.2v-3.8h-.6a1 1 0 0 1-1-1V6.2a1 1 0 0 1 1-1z"/><path d="M8 9.6h8M8 12.6h5"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    edit: svg('<path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17z"/><path d="m13.5 8.5 3 3"/>'),
    up: svg('<path d="m6 14 6-6 6 6"/>'),
    down: svg('<path d="m6 10 6 6 6-6"/>'),
    x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    back: svg('<path d="m15 5-7 7 7 7"/>'),
    heartfill: svg('<path d="M12 20s-7.6-4.6-7.6-10.3A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 7.6 2.4C19.6 15.4 12 20 12 20z"/>', 'solid')
  };

  const BRAND_ART = `<svg class="g3-brand-art" viewBox="0 0 120 34" aria-hidden="true" focusable="false">
    <defs><linearGradient id="g3b" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".55" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>
    <path d="M2 30C34 29 66 24 98 15" fill="none" stroke="url(#g3b)" stroke-width="2.2" stroke-linecap="round"/>
    <g fill="#fff" opacity=".97"><path d="M92 14.5l2.6-5a3 3 0 0 1 2.7-1.7h9a3 3 0 0 1 2.6 1.6l2 4.4a3 3 0 0 1 2 2.8V19a2 2 0 0 1-2 2H93a2 2 0 0 1-2-2v-2.6a2.8 2.8 0 0 1 1-1.9z"/></g>
    <circle cx="97" cy="21.2" r="2.7" fill="#9d86e8" stroke="#fff" stroke-width="1.4"/><circle cx="110" cy="21.2" r="2.7" fill="#9d86e8" stroke="#fff" stroke-width="1.4"/></svg>`;

  const CHAT_ART = `<svg class="g3-chat-art-svg" viewBox="0 0 220 74" aria-hidden="true" focusable="false">
    <defs><linearGradient id="g3h" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <path d="M10 72C46 44 88 36 112 36s66 8 98 36" fill="url(#g3h)" opacity=".5"/>
    <path d="M10 72C46 44 88 36 112 36s66 8 98 36" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.4"/>
    <g fill="#fff"><path d="M54 40.5l3.2-6.2a3.6 3.6 0 0 1 3.2-2h12a3.6 3.6 0 0 1 3.2 2l2.6 5.4a3.6 3.6 0 0 1 2.4 3.4v3.2a2.4 2.4 0 0 1-2.4 2.4H55a2.4 2.4 0 0 1-2.4-2.4v-3.1a3.4 3.4 0 0 1 1.4-2.7z"/></g>
    <circle cx="60.5" cy="49.5" r="3.4" fill="#a48ce6" stroke="#fff" stroke-width="1.6"/><circle cx="77.5" cy="49.5" r="3.4" fill="#a48ce6" stroke="#fff" stroke-width="1.6"/>
    <path d="M140 8a13 13 0 0 1 13 13c0 11-13 24-13 24s-13-13-13-24A13 13 0 0 1 140 8z" fill="#fff" fill-opacity=".92"/><circle cx="140" cy="21" r="5" fill="#a48ce6"/></svg>`;

  const ROBOT_AVATAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><g fill="none" stroke="#7a5ae0" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="11" y="16" width="26" height="20" rx="8" fill="#fff"/><path d="M24 16v-5"/><circle cx="24" cy="9.5" r="1.7" fill="#7a5ae0"/><path d="M8 25v4M40 25v4"/><path d="M19 29.5c1.4 1.6 4.6 1.6 6 0"/></g><circle cx="19.2" cy="24.2" r="2" fill="#7a5ae0"/><circle cx="28.8" cy="24.2" r="2" fill="#7a5ae0"/></svg>`;
  const USER_AVATAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><g fill="#fff"><circle cx="24" cy="18" r="7.2"/><path d="M9.5 40c1.1-7.8 7.2-12 14.5-12s13.4 4.2 14.5 12z"/></g></svg>`;
  const NAV_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M27 6.5a7.6 7.6 0 0 1 7.6 7.6c0 6.6-7.6 13.4-7.6 13.4s-7.6-6.8-7.6-13.4A7.6 7.6 0 0 1 27 6.5z"/><path d="M14 40c-4.4-.8-6-4.7-3.2-7.2 3.2-2.8 10.6-1.2 12.6-5.4"/><path d="M14 40h12" opacity="0"/></g><circle cx="27" cy="14.1" r="2.6" fill="#fff"/><path d="M12.4 38.8c8 1.6 12.6-1.8 14.2-5.2" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`;
  const uri = s => `url("data:image/svg+xml;utf8,${encodeURIComponent(s)}")`;
  root.style.setProperty('--g3-img-bot', uri(ROBOT_AVATAR));
  root.style.setProperty('--g3-img-user', uri(USER_AVATAR));
  root.style.setProperty('--g3-img-nav', uri(NAV_ICON));

  /* ---------- actions (all delegate to existing functions) ---------- */
  const search = q => {
    const val = (q || '').trim();
    if (typeof window.openTourBrowser === 'function') {
      window.openTourBrowser(val);
      if (val && typeof window.searchAllRoutes === 'function') Promise.resolve().then(() => window.searchAllRoutes());
    } else if (typeof window.openHomeSearch === 'function') window.openHomeSearch();
    else if (typeof window.assistant === 'function') window.assistant();
  };
  const openChat = () => {
    if (typeof window.openGleoChat === 'function') window.openGleoChat();
    else if (typeof window.assistant === 'function') window.assistant();
  };

  /* ---------- tab bar. Edit this array to rename / re-map tabs. ---------- */
  const TABS = [
    { key: 'home',   label: '홈',   icon: 'home',     pages: ['home'],                 open: () => window.go('home') },
    { key: 'course', label: '코스', icon: 'route',    pages: ['community', 'route'],   open: () => { filter = '전체'; query = ''; window.go('community'); } },
    { key: 'saved',  label: '저장', icon: 'bookmark', pages: ['saved'],                open: () => window.go('saved') },
    { key: 'my',     label: '마이', icon: 'user',     pages: [],                       open: () => openMy() }
  ];
  function buildTabs() {
    if ($('#g3Tabs')) return;
    const nav = document.createElement('nav');
    nav.id = 'g3Tabs';
    nav.className = 'g3-tabs';
    nav.setAttribute('aria-label', '하단 메뉴');
    nav.innerHTML = TABS.map(t => `<button type="button" class="g3-tab" data-tab="${t.key}" aria-label="${t.label}">${ICON[t.icon]}<span>${t.label}</span></button>`).join('');
    nav.addEventListener('click', e => {
      const b = e.target.closest('[data-tab]');
      if (!b) return;
      const tab = TABS.find(t => t.key === b.dataset.tab);
      if (tab) tab.open();
    });
    document.body.appendChild(nav);
  }
  function syncTabs() {
    const current = (typeof page !== 'undefined') ? page : 'home';
    root.classList.toggle('g3-route-page', current === 'route');
    root.classList.toggle('g3-not-home', current !== 'home');
    document.querySelectorAll('#g3Tabs .g3-tab').forEach(b => {
      const tab = TABS.find(t => t.key === b.dataset.tab);
      const on = !!tab && tab.pages.includes(current);
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  }

  /* ---------- header ---------- */
  function buildHeader() {
    const header = $('header');
    if (!header) return;
    const brand = header.querySelector('.brand');
    if (brand && !brand.querySelector('.g3-brand-art')) {
      brand.innerHTML = `<span class="g3-brand-word">일단가</span>${BRAND_ART}`;
      brand.setAttribute('aria-label', '일단가 홈');
    }
    if (!header.querySelector('.g3-back')) {
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'g3-back';
      back.setAttribute('aria-label', '홈으로');
      back.innerHTML = ICON.back;
      back.addEventListener('click', () => window.go('home'));
      header.insertBefore(back, header.firstChild);
    }
    if (!header.querySelector('.g3-profile')) {
      const p = document.createElement('button');
      p.type = 'button';
      p.className = 'g3-profile';
      p.setAttribute('aria-label', '마이');
      p.innerHTML = ICON.user;
      p.addEventListener('click', openMy);
      header.appendChild(p);
    }
  }

  /* ---------- 마이 + course editor (create / edit / share). Uses only existing local state. ---------- */
  const countOf = fn => (state.posts || []).filter(fn).length;
  function refreshAfterEdit() {
    if (typeof window.go === 'function') window.go(typeof page !== 'undefined' ? page : 'home');
  }
  function openMy() {
    if (typeof window.modal !== 'function' || typeof state === 'undefined') return;
    const mine = (state.posts || []).filter(p => p.mine);
    const rows = mine.map(p => `<li class="g3-my-row">
        <div class="g3-my-info"><b>${safe(p.title)}</b><span>${safe(p.region)} · ${(p.stops || []).length}곳 · ${p.private ? '나만 보기' : '커뮤니티 공유'}</span></div>
        <button type="button" class="g3-mini" data-open="${safe(p.id)}">열기</button>
        <button type="button" class="g3-mini g3-mini-main" data-edit="${safe(p.id)}">${ICON.edit}수정</button></li>`).join('');
    window.modal(`<div class="g3-my">
      <h2>마이</h2>
      <div class="g3-my-stats">
        <div><b>${(state.saved || []).length}</b><span>저장한 코스</span></div>
        <div><b>${mine.length}</b><span>내가 만든 코스</span></div>
        <div><b>${countOf(p => p.mine && !p.private)}</b><span>공유한 코스</span></div>
      </div>
      <div class="g3-my-head"><h3>내 코스</h3><button type="button" class="g3-mini g3-mini-main" data-new="1">${ICON.plus}새 코스 만들기</button></div>
      ${rows ? `<ul class="g3-my-list">${rows}</ul>` : '<p class="g3-my-empty">아직 만든 코스가 없어요.<br>“새 코스 만들기”로 첫 코스를 입력해 보세요.</p>'}
      <p class="g3-my-note">로그인 기능은 없어요. 코스는 이 기기에만 저장돼요.</p>
      <div class="g3-my-actions"><button type="button" data-my="saved">저장한 코스 보기</button><button type="button" data-my="route">현재 코스 지도</button></div></div>`);
    const m = $('#modal');
    m.querySelector('[data-new]')?.addEventListener('click', () => openEditor({}));
    m.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openEditor({ id: b.dataset.edit })));
    m.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => { m.close(); if (typeof window.select === 'function') window.select(b.dataset.open); }));
    m.querySelectorAll('[data-my]').forEach(b => b.addEventListener('click', () => { const a = b.dataset.my; m.close(); window.go(a === 'saved' ? 'saved' : 'route'); }));
  }

  let draft = null;
  const placeLabel = k => { const p = places[k]; return p ? p.name : k; };
  function regionList() {
    return [...new Set(Object.values(places).filter(p => !p.sample).map(p => p.region).filter(Boolean))];
  }
  function openEditor(opts) {
    opts = opts || {};
    let base;
    const existing = opts.id ? (state.posts || []).find(x => x.id === opts.id && x.mine) : null;
    if (existing) base = { id: existing.id, title: existing.title, region: existing.region, tags: existing.tags || '', desc: existing.desc || '', stops: [...existing.stops], share: !existing.private };
    else if (opts.fromRoute) base = { title: `${state.title} · 내 버전`, region: state.region, tags: '직접 만든 루트', desc: '', stops: [...state.route], share: true };
    else base = { title: '', region: state.region || '대전', tags: '', desc: '', stops: [], share: false };
    draft = base;
    const mode = existing ? '코스 수정' : (opts.fromRoute ? '내 코스 공유하기' : '새 코스 만들기');
    window.modal(`<div class="g3-ed">
      <h2>${mode}</h2>
      <label>코스 이름</label><input id="g3EdTitle" maxlength="60" placeholder="예: 비 오는 날 드라이브 코스" autocomplete="off">
      <div class="g3-ed-two">
        <div><label>지역</label><select id="g3EdRegion"></select></div>
        <div><label>분위기 태그</label><input id="g3EdTags" maxlength="40" placeholder="바다 · 카페" autocomplete="off"></div>
      </div>
      <label>한 줄 소개</label><textarea id="g3EdDesc" maxlength="300" rows="2" placeholder="어떤 순서로 다녀오면 좋나요?"></textarea>
      <div class="g3-ed-stops-head"><label>방문 순서</label><span id="g3EdCount"></span></div>
      <ol id="g3EdStops" class="g3-ed-stops"></ol>
      <div class="g3-ed-add"><select id="g3EdAddSel" aria-label="추가할 장소"></select><button type="button" id="g3EdAddBtn" class="g3-mini g3-mini-main">${ICON.plus}추가</button></div>
      <label class="g3-ed-share"><input type="checkbox" id="g3EdShare"><span>커뮤니티에 공유 <small>(이 기기에만 저장돼요)</small></span></label>
      <div class="g3-ed-actions">
        <button type="button" class="primary" id="g3EdSave">저장하기</button>
        <button type="button" id="g3EdCancel">취소</button>
        ${existing ? '<button type="button" id="g3EdDel" class="g3-danger">삭제</button>' : ''}
      </div></div>`);
    const m = $('#modal');
    const q = id => m.querySelector(id);
    q('#g3EdTitle').value = draft.title;
    q('#g3EdTags').value = draft.tags;
    q('#g3EdDesc').value = draft.desc;
    q('#g3EdShare').checked = draft.share;
    const regionSel = q('#g3EdRegion');
    const regions = regionList();
    if (draft.region && !regions.includes(draft.region)) regions.push(draft.region);
    regionSel.innerHTML = regions.map(r => `<option value="${safe(r)}">${safe(r)}</option>`).join('');
    regionSel.value = draft.region || regions[0];

    function drawStops() {
      q('#g3EdCount').textContent = `${draft.stops.length}곳 · 2~12곳`;
      q('#g3EdStops').innerHTML = draft.stops.length ? draft.stops.map((k, i) => `<li class="g3-ed-stop">
          <span class="g3-ed-no">${i + 1}</span>
          <span class="g3-ed-name">${safe(placeLabel(k))}<small>${safe(places[k]?.cat || '')}${places[k]?.region ? ' · ' + safe(places[k].region) : ''}</small></span>
          <button type="button" class="g3-round" data-act="up" data-i="${i}" aria-label="위로" ${i === 0 ? 'disabled' : ''}>${ICON.up}</button>
          <button type="button" class="g3-round" data-act="down" data-i="${i}" aria-label="아래로" ${i === draft.stops.length - 1 ? 'disabled' : ''}>${ICON.down}</button>
          <button type="button" class="g3-round" data-act="del" data-i="${i}" aria-label="삭제">${ICON.x}</button></li>`).join('')
        : '<li class="g3-ed-empty">아래에서 방문할 장소를 골라 추가해 주세요.</li>';
      const region = regionSel.value;
      const opt = (k, p) => `<option value="${safe(k)}">${safe(p.name)} · ${safe(p.cat || '')}</option>`;
      const free = Object.entries(places).filter(([k, p]) => !p.sample && !draft.stops.includes(k));
      const here = free.filter(([, p]) => p.region === region), other = free.filter(([, p]) => p.region !== region);
      q('#g3EdAddSel').innerHTML = `<option value="">장소 선택…</option>` +
        (here.length ? `<optgroup label="${safe(region)}">${here.map(([k, p]) => opt(k, p)).join('')}</optgroup>` : '') +
        (other.length ? `<optgroup label="다른 지역">${other.map(([k, p]) => opt(k, p)).join('')}</optgroup>` : '');
    }
    drawStops();
    regionSel.addEventListener('change', drawStops);
    q('#g3EdStops').addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
      const i = Number(b.dataset.i), a = b.dataset.act;
      if (a === 'del') draft.stops.splice(i, 1);
      else { const j = a === 'up' ? i - 1 : i + 1; [draft.stops[i], draft.stops[j]] = [draft.stops[j], draft.stops[i]]; }
      drawStops();
    });
    q('#g3EdAddBtn').addEventListener('click', () => {
      const k = q('#g3EdAddSel').value;
      if (!k || !places[k]) return toast('추가할 장소를 선택해 주세요.');
      if (draft.stops.length >= 12) return toast('방문지는 최대 12곳까지 담을 수 있어요.');
      draft.stops.push(k); drawStops();
    });
    q('#g3EdCancel').addEventListener('click', () => m.close());
    q('#g3EdSave').addEventListener('click', () => {
      const title = q('#g3EdTitle').value.trim();
      if (!title) return toast('코스 이름을 입력해 주세요.');
      if (draft.stops.length < 2) return toast('방문지를 2곳 이상 담아 주세요.');
      const share = q('#g3EdShare').checked;
      const prev = draft.id ? state.posts.find(x => x.id === draft.id && x.mine) : null;
      const post = { id: draft.id || ('u' + Date.now()), title, region: regionSel.value, author: '나', desc: q('#g3EdDesc').value.trim() || '나의 여행 루트', stops: [...draft.stops], likes: prev ? prev.likes : 0, tags: q('#g3EdTags').value.trim() || '직접 만든 루트', mine: true, private: !share };
      if (prev) Object.assign(prev, post); else state.posts.unshift(post);
      if (!share && !state.saved.includes(post.id)) state.saved.push(post.id);
      persist();
      m.close();
      refreshAfterEdit();
      toast(prev ? '코스를 수정했어요.' : (share ? '커뮤니티에 코스를 올렸어요.' : '내 코스를 저장했어요.'));
    });
    const del = q('#g3EdDel');
    if (del) {
      let armed = false, timer = 0;
      del.addEventListener('click', () => {
        if (!armed) { armed = true; del.textContent = '한 번 더 누르면 삭제'; timer = setTimeout(() => { armed = false; del.textContent = '삭제'; }, 3500); return; }
        clearTimeout(timer);
        state.posts = state.posts.filter(x => x.id !== draft.id);
        state.saved = state.saved.filter(x => x !== draft.id);
        state.liked = (state.liked || []).filter(x => x !== draft.id);
        if (state.source === draft.id) state.source = '';
        persist(); m.close(); refreshAfterEdit(); toast('코스를 삭제했어요.');
      });
    }
    q('#g3EdTitle').focus();
  }

  /* ---------- home ---------- */
  const CHIPS = [['cup', '서울 카페'], ['bread', '대전 빵투어'], ['car', '강릉 드라이브'], ['heart', '경주 데이트']];
  const photoFor = p => {
    const t = `${p.region || ''} ${p.title || ''}`;
    if (/서울|한강|노을/.test(t)) return 'photos/seoul.png';
    if (/대전|빵/.test(t)) return 'photos/bread.png';
    if (/바다|해변|해수욕|제주|강릉|부산|속초|여수|드라이브|카페/.test(t)) return 'photos/coast.png';
    return null; // no matching photo -> gradient art card
  };
  function courseCard(p, i) {
    const photo = photoFor(p);
    const liked = (state.saved || []).includes(p.id);
    const likes = (Number(p.likes) || 0) + Number((state.liked || []).includes(p.id));
    const stops = (p.stops || []).map(k => (typeof places !== 'undefined' && places[k]) ? places[k].name : null).filter(Boolean).slice(0, 3).join(' → ');
    return `<article class="g3-card" style="--g3-i:${i || 0}" data-course="${safe(p.id)}" tabindex="0" role="button" aria-label="${safe(p.title)} 코스 보기">
      <div class="g3-card-img${photo ? '' : ' g3-noimg'}" ${photo ? `style="background-image:url('${photo}')"` : ''}>${photo ? '' : `<span>${safe(p.region || '여행')}</span>`}
        <button type="button" class="g3-heart${liked ? ' on' : ''}" data-save="${safe(p.id)}" aria-label="${liked ? '저장 해제' : '저장'}">${liked ? ICON.heartfill : ICON.heart}</button></div>
      <div class="g3-card-body">
        <span class="g3-pill">${ICON.pin}${safe(p.region || '여행')}</span>
        <h3>${safe(p.title)}</h3>
        <p>${safe(stops || p.desc || '여행 코스')}</p>
        <div class="g3-card-foot"><span class="g3-see">코스 보기 ${ICON.chevron}</span><span class="g3-meta">♡ ${likes} · ${(p.stops || []).length}곳</span></div>
      </div></article>`;
  }
  /* ---------- home: region / theme filter + endlessly scrolling popular list ---------- */
  const THEMES = [
    ['전체', null], ['카페', /카페|커피/], ['빵', /빵/], ['바다', /바다|해변|해수욕/], ['드라이브', /드라이브/],
    ['야경', /야경|노을/], ['산책', /산책|숲|공원/], ['맛집', /맛집|시장|순두부/], ['데이트', /데이트/]
  ];
  let gRegion = '전국', gTheme = '전체';
  const courseText = p => [p.title, p.desc, p.tags, ...(p.stops || []).map(k => (places[k] ? places[k].cat : ''))].join(' ');
  function filtered() {
    const re = (THEMES.find(t => t[0] === gTheme) || [])[1];
    return (state.posts || []).filter(p => !p.private)
      .filter(p => gRegion === '전국' || p.region === gRegion)
      .filter(p => !re || re.test(courseText(p)))
      .sort((a, b) => (Number(b.likes) || 0) - (Number(a.likes) || 0));
  }
  function regionsNow() {
    const c = {};
    (state.posts || []).filter(p => !p.private).forEach(p => { c[p.region] = (c[p.region] || 0) + 1; });
    return ['전국', ...Object.keys(c).sort((a, b) => c[b] - c[a])];
  }
  function drawList() {
    const list = $('#g3List'); if (!list) return;
    const posts = filtered();
    const label = `${gRegion === '전국' ? '' : gRegion + ' '}${gTheme === '전체' ? '' : gTheme + ' '}`.trim();
    $('#g3PopTitle').textContent = label ? `${label} 인기 코스` : '지금 인기 있는 코스';
    $('#g3PopCount').textContent = `${posts.length}개`;
    list.innerHTML = posts.length ? posts.map(courseCard).join('')
      : `<div class="g3-empty">조건에 맞는 코스가 아직 없어요.<br><button type="button" class="g3-mini g3-mini-main" id="g3EmptyChat">${ICON.chat}대화로 코스 만들기</button></div>`;
    list.scrollTop = 0; $('#g3Pop').scrollTop = 0;
    $('#g3EmptyChat')?.addEventListener('click', openChat);
    list.querySelectorAll('[data-save]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); if (typeof window.save === 'function') window.save(b.dataset.save); }));
    list.querySelectorAll('[data-course]').forEach(el => {
      const open = () => { if (typeof window.select === 'function') window.select(el.dataset.course); };
      el.addEventListener('click', open);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  }
  function drawFilters() {
    const regs = regionsNow();
    if (!regs.includes(gRegion)) gRegion = '전국';
    const row = (name, items, cur, attr) => `<div class="g3-frow"><b>${name}</b><div class="g3-fchips">${items.map(v => `<button type="button" class="g3-fchip${v === cur ? ' on' : ''}" ${attr}="${safe(v)}">${safe(v)}</button>`).join('')}</div></div>`;
    $('#g3Filters').innerHTML = row('지역', regs, gRegion, 'data-region') + row('테마', THEMES.map(t => t[0]), gTheme, 'data-theme');
  }
  function drawHome() {
    const host = $('#app');
    if (!host || typeof state === 'undefined') return;
    host.innerHTML = `<div class="g3-home">
      <section class="g3-hero" aria-label="일단가 코스 찾기">
        <h1>오늘은 어디로 갈까?</h1>
        <p>말하듯 입력하면 코스를 추천해드릴게요</p>
        <form id="g3Search" class="g3-search" role="search">
          ${ICON.search}
          <input id="g3Query" maxlength="90" autocomplete="off" aria-label="지역 또는 여행 테마" placeholder="예: 서울 근교 드라이브 코스 추천해줘">
          <button type="button" id="g3ChatBtn" class="g3-chat-btn" aria-label="대화로 코스 만들기" title="대화로 코스 만들기">${ICON.chat}</button>
        </form>
        <button type="submit" form="g3Search" class="g3-find">${ICON.car}<span>코스 찾기</span></button>
      </section>
      <section id="g3Filters" class="g3-filters" aria-label="지역·테마 선택"></section>
      <section id="g3Pop" class="g3-popular" aria-label="인기 코스">
        <div class="g3-pop-head"><h2 id="g3PopTitle">지금 인기 있는 코스</h2><span id="g3PopCount" class="g3-count"></span></div>
        <div id="g3List" class="g3-cards"></div>
      </section></div>`;
    document.body.classList.add('live-home');
    drawFilters(); drawList();
    $('#g3Search').addEventListener('submit', e => {
      e.preventDefault();
      const q = $('#g3Query').value.trim();
      if (q) search(q); else openChat();
    });
    $('#g3ChatBtn').addEventListener('click', openChat);
    $('#g3Filters').addEventListener('click', e => {
      const b = e.target.closest('.g3-fchip'); if (!b) return;
      if (b.dataset.region) gRegion = b.dataset.region; else gTheme = b.dataset.theme;
      drawFilters(); drawList();
    });
  }


  /* ---------- Gleo chat dialog ---------- */
  const THEME_PROMPTS = [['cup', '서울 카페', '서울 카페 투어 코스 추천해줘'], ['car', '강릉 드라이브', '강릉 드라이브 코스 추천해줘'], ['bread', '대전 빵투어', '대전 빵투어 코스 추천해줘'], ['heart', '경주 데이트', '경주 데이트 코스 추천해줘']];
  function decorateChat(chat) {
    chat.dataset.g3 = '1';
    const head = chat.querySelector('.gleo-chat-head');
    if (head) {
      head.querySelector('.gleo-chat-symbol')?.remove();
      if (!head.querySelector('.g3-chat-art')) head.insertAdjacentHTML('afterbegin', `<div class="g3-chat-art">${CHAT_ART}</div>`);
      const copy = head.querySelector('div:not(.g3-chat-art)');
      const h = head.querySelector('h2'); if (h) h.textContent = '일단가와 여행 만들기';
      const p = head.querySelector('p'); if (p) p.textContent = '원하는 지역이나 분위기를 말해보세요';
      if (copy) copy.classList.add('g3-chat-copy');
    }
    const form = chat.querySelector('#gleoChatForm');
    const input = chat.querySelector('#gleoChatInput');
    if (input) input.placeholder = '예: 두 번째 장소를 다른 카페로 바꿔줘';
    if (form) {
      if (!form.querySelector('.g3-ic.g3-lead')) form.insertAdjacentHTML('afterbegin', ICON.search.replace('class="g3-ic ', 'class="g3-ic g3-lead '));
      const send = form.querySelector('button[type=submit]');
      if (send) send.innerHTML = `${ICON.send}<span>전송</span>`;
    }
    const sug = chat.querySelector('.gleo-chat-suggestions');
    if (sug) {
      sug.classList.add('g3-chips-row');
      sug.querySelectorAll('button').forEach(b => b.classList.add('g3-cmd'));
      const frag = document.createDocumentFragment();
      THEME_PROMPTS.forEach(([ic, label, prompt]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'g3-theme';
        b.innerHTML = `${ICON[ic]}<span>${safe(label)}</span>`;
        b.addEventListener('click', () => {
          if (!input || !form) return;
          input.value = prompt;
          if (typeof form.requestSubmit === 'function') form.requestSubmit();
          else form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        });
        frag.appendChild(b);
      });
      sug.insertBefore(frag, sug.firstChild);
    }
  }

  /* ---------- PLEOS segment navigation dialog (idempotent refresh; render() may rewrite text any time) ---------- */
  const SVG_CAR_BTN = ICON.car;
  function refreshNav(m) {
    const prog = m.querySelector('#segmentProgress');
    if (prog) {
      const t = prog.textContent;
      const r = t.match(/^\s*(\d+)\/(\d+)구간.*?전체\s*(\d+)곳/);
      if (r) prog.textContent = `${r[1]}/${r[2]}구간 · 총 ${r[3]}곳`;
    }
    m.querySelectorAll('#segmentList li').forEach(li => {
      if (li.querySelector('.g3-seg-chip')) return;
      const r = li.textContent.match(/^\s*(\d+)구간:\s*(.*?)(\s*·\s*현재 선택)?\s*$/);
      if (!r) return;
      li.textContent = '';
      const chip = document.createElement('span'); chip.className = 'g3-seg-chip'; chip.textContent = `${r[1]}구간`;
      const txt = document.createElement('span'); txt.className = 'g3-seg-text'; txt.textContent = r[2];
      li.append(chip, txt);
      li.classList.toggle('g3-current', !!r[3]);
    });
    const dep = m.querySelector('#pleosDepart');
    if (dep && !dep.querySelector('svg')) {
      const r = dep.textContent.match(/^\s*(\d+)구간/);
      if (r) dep.innerHTML = `${SVG_CAR_BTN}<span>${r[1]}구간 길안내 시작</span>`;
    }
    const nx = m.querySelector('#pleosNext');
    if (nx) {
      const r = nx.textContent.trim().match(/^다음\s*(\d+)구간 선택$/);
      if (r) nx.textContent = `${r[1]}구간 보기`;
    }
    const desc = m.querySelector('.aurora-nav-desc') || m.querySelector(':scope > p');
    if (desc && !desc.dataset.g3) {
      desc.dataset.g3 = '1';
      desc.innerHTML = '한 번에 최대 3곳까지 안내할 수 있어요.<br>구간별로 나누어 안내할게요.';
    }
    const foot = m.querySelector('.aurora-nav-foot');
    if (foot && !foot.dataset.g3) {
      foot.dataset.g3 = '1';
      foot.textContent = '첫 구간 안내 후, 다음 구간은 일단가에서 이어서 시작할 수 있어요.';
    }
  }

  function decorateModal() {
    const m = $('#modal');
    if (!m) return;
    const chat = m.querySelector('.gleo-chat');
    if (chat && !chat.dataset.g3) decorateChat(chat);
    m.classList.toggle('g3-chat-modal', !!chat);
    const nav = !!m.querySelector('#segmentList');
    m.classList.toggle('g3-nav-modal', nav);
    m.classList.toggle('g3-my-modal', !!m.querySelector('.g3-my'));
    m.classList.toggle('g3-ed-modal', !!m.querySelector('.g3-ed'));
    if (nav) refreshNav(m);
  }

  /* ---------- extra demo places / popular courses (added only if absent). Coordinates are approximate -> verify before real navigation. ---------- */
  const X_PLACES = {
    xGyeongbok:{name:'경복궁',lat:37.5796,lng:126.9770,cat:'명소',region:'서울'},
    xBukchon:{name:'북촌한옥마을',lat:37.5826,lng:126.9830,cat:'산책',region:'서울'},
    xDDP:{name:'동대문디자인플라자',lat:37.5670,lng:127.0090,cat:'전시',region:'서울'},
    xHongdae:{name:'홍대 걷고싶은거리',lat:37.5563,lng:126.9236,cat:'맛집',region:'서울'},
    xGamcheon:{name:'감천문화마을',lat:35.0975,lng:129.0105,cat:'명소',region:'부산'},
    xJagalchi:{name:'자갈치시장',lat:35.0966,lng:129.0306,cat:'맛집',region:'부산'},
    xSongjeong:{name:'송정해수욕장',lat:35.1789,lng:129.1994,cat:'바다',region:'부산'},
    xSeongsan:{name:'성산일출봉',lat:33.4580,lng:126.9425,cat:'명소',region:'제주'},
    xAewol:{name:'애월 해안도로',lat:33.4630,lng:126.3100,cat:'드라이브',region:'제주'},
    xHyeopjae:{name:'협재해수욕장',lat:33.3940,lng:126.2397,cat:'바다',region:'제주'},
    xAnmok:{name:'안목해변 커피거리',lat:37.7710,lng:128.9480,cat:'카페',region:'강릉'},
    xChodang:{name:'초당순두부마을',lat:37.7900,lng:128.9170,cat:'맛집',region:'강릉'},
    xOjuk:{name:'오죽헌',lat:37.7790,lng:128.8790,cat:'명소',region:'강릉'},
    xGyeongju:{name:'대릉원',lat:35.8390,lng:129.2130,cat:'산책',region:'경주'},
    xDongnidan:{name:'황리단길',lat:35.8380,lng:129.2100,cat:'카페',region:'경주'},
    xWolji:{name:'동궁과 월지',lat:35.8340,lng:129.2257,cat:'야경',region:'경주'},
    xSokcho:{name:'속초해수욕장',lat:38.1906,lng:128.6040,cat:'바다',region:'속초'},
    xSokchoMkt:{name:'속초중앙시장',lat:38.2050,lng:128.5910,cat:'맛집',region:'속초'},
    xSeorak:{name:'설악산 케이블카',lat:38.1750,lng:128.4880,cat:'명소',region:'속초'},
    xYeosu:{name:'여수 낭만포차거리',lat:34.7370,lng:127.7360,cat:'야경',region:'여수'},
    xSeongsu:{name:'성수동 카페거리',lat:37.5446,lng:127.0557,cat:'카페',region:'서울'},
    xYeonnam:{name:'연남동 카페골목',lat:37.5620,lng:126.9250,cat:'카페',region:'서울'},
    xJeonpo:{name:'전포 카페거리',lat:35.1530,lng:129.0640,cat:'카페',region:'부산'},
    xOeun:{name:'어은동 카페거리',lat:36.3640,lng:127.3560,cat:'카페',region:'대전'},
    xOdongdo:{name:'오동도',lat:34.7437,lng:127.7627,cat:'산책',region:'여수'}
  };
  const X_POSTS = [
    {id:'xp1',title:'고궁 산책부터 한옥 골목까지',region:'서울',author:'골목여행자',desc:'경복궁에서 북촌으로 천천히 걷고 홍대에서 마무리하는 서울 도심 하루.',stops:['xGyeongbok','xBukchon','xHongdae'],likes:142,tags:'산책 · 도심'},
    {id:'xp2',title:'감성 가득 부산 항구 한 바퀴',region:'부산',author:'바다조아',desc:'감천문화마을과 자갈치시장을 지나 송정 바다에서 쉬어가요.',stops:['xGamcheon','xJagalchi','xSongjeong'],likes:118,tags:'바다 · 시장'},
    {id:'xp3',title:'제주 서쪽 해안 드라이브',region:'제주',author:'섬바람',desc:'협재 바다를 보고 애월 해안도로를 달려 일출봉까지 이어지는 코스.',stops:['xHyeopjae','xAewol','xSeongsan'],likes:136,tags:'드라이브 · 바다'},
    {id:'xp4',title:'강릉 커피 향 따라 걷는 하루',region:'강릉',author:'커피수집가',desc:'안목 커피거리에서 시작해 초당순두부와 오죽헌까지.',stops:['xAnmok','xChodang','xOjuk'],likes:104,tags:'카페 · 맛집'},
    {id:'xp5',title:'천년 도시 경주 밤마실',region:'경주',author:'밤산책',desc:'대릉원과 황리단길을 걷고, 동궁과 월지 야경으로 마무리해요.',stops:['xGyeongju','xDongnidan','xWolji'],likes:127,tags:'야경 · 산책'},
    {id:'xp6',title:'설악산과 바다, 속초 당일치기',region:'속초',author:'산바다',desc:'케이블카로 설악산을 올랐다가 시장과 해변에서 하루를 마무리.',stops:['xSeorak','xSokchoMkt','xSokcho'],likes:92,tags:'자연 · 시장'},
    {id:'xp7',title:'여수 밤바다 낭만 코스',region:'여수',author:'밤바다',desc:'오동도를 걷고 낭만포차거리에서 밤바다를 바라보는 코스.',stops:['xOdongdo','xYeosu'],likes:88,tags:'야경 · 데이트'},
    {id:'xp9',title:'서울 카페 투어: 성수에서 연남까지',region:'서울',author:'커피수집가',desc:'성수동 카페거리와 서울숲, 연남동 카페골목을 잇는 하루.',stops:['xSeongsu','seoulforest','xYeonnam'],likes:151,tags:'카페 · 데이트'},
    {id:'xp10',title:'부산 전포 카페와 광안리 밤바다',region:'부산',author:'바다조아',desc:'전포 카페거리에서 쉬다가 광안리 야경으로 마무리.',stops:['xJeonpo','gwang'],likes:97,tags:'카페 · 야경'},
    {id:'xp11',title:'대전 어은동 카페와 수목원 산책',region:'대전',author:'빵순이P',desc:'어은동 카페거리에서 시작해 한밭수목원을 걷는 느긋한 코스.',stops:['xOeun','park'],likes:73,tags:'카페 · 산책'},
    {id:'xp12',title:'서울 한강 뷰 카페 산책',region:'서울',author:'노을수집가',desc:'연남동 카페골목에서 커피를 마시고 반포한강공원에서 노을을 보는 코스.',stops:['xYeonnam','banpo'],likes:110,tags:'카페 · 노을'},
    {id:'xp8',title:'서울 전시와 야경 데이트',region:'서울',author:'노을수집가',desc:'DDP 전시를 보고 남산서울타워에서 야경을 보는 저녁 코스.',stops:['xDDP','namsan'],likes:79,tags:'전시 · 야경'}
  ];
  function seedExtras() {
    if (typeof places === 'undefined' || typeof state === 'undefined') return;
    Object.entries(X_PLACES).forEach(([k, v]) => { if (!places[k]) places[k] = v; });
    if (!Array.isArray(state.posts)) return;
    X_POSTS.forEach(p => {
      if (state.posts.some(x => x.id === p.id)) return;
      if (!p.stops.every(k => places[k])) return;
      state.posts.push(Object.assign({ theme: 'default' }, p));
    });
  }
  seedExtras();

  /* ---------- install ---------- */
  const prevGo = window.go;
  if (typeof prevGo === 'function') {
    window.go = function () {
      const out = prevGo.apply(this, arguments);
      buildHeader();
      syncTabs();
      return out;
    };
  }
  window.home = drawHome;
  window.openMyPage = openMy;
  window.publish = () => openEditor({ fromRoute: true });
  window.openCourseEditor = openEditor;

  buildHeader();
  buildTabs();
  const modal = $('#modal');
  if (modal) new MutationObserver(decorateModal).observe(modal, { childList: true, subtree: true, characterData: true });
  if (typeof page !== 'undefined' && page === 'home') drawHome();
  syncTabs();
})();
