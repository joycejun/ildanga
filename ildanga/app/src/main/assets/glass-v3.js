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
    mic: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6"/>'),
    camera: svg('<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.2"/>'),
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

  /* typed text from the home search box continues in the Gleo chat */
  let progSubmit = false;
  function askChat(q) {
    openChat();
    setTimeout(() => {
      const input = $('#gleoChatInput');
      if (!input) return;
      input.value = /추천|코스|알려|찾아|안녕|하이|hello|hi|고마|뭐|누구|\?/i.test(q) || q.length > 8 ? q : `${q} 여행 코스 추천해줘`;
      progSubmit = true;
      if (input.form && input.form.requestSubmit) input.form.requestSubmit();
      else input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    }, 80);
  }

  /* ---------- voice conversation ----------
     1) native bridge window.IldangaVoice (see android-voice/)  2) browser SpeechRecognition  3) friendly fallback */
  const VOICE_MSG = {
    unavailable: ['이 기기에서는 음성 인식을 쓸 수 없어요.', '글자로 입력해 주세요.'],
    denied: ['마이크 권한이 필요해요.', '설정에서 마이크를 허용한 뒤 다시 눌러 주세요.'],
    nomatch: ['잘 못 알아들었어요.', '다시 한 번 말씀해 주세요.'],
    busy: ['음성 인식이 바쁜 상태예요.', '잠시 뒤 다시 시도해 주세요.'],
    error: ['음성 인식에 문제가 생겼어요.', '다시 시도하거나 글자로 입력해 주세요.']
  };
  let speakBack = false, webRec = null, heard = false;
  const nativeVoice = () => (window.IldangaVoice && typeof window.IldangaVoice.start === 'function') ? window.IldangaVoice : null;
  const SR = () => window.SpeechRecognition || window.webkitSpeechRecognition;
  function voiceDialog(state, extra) {
    if (typeof window.modal !== 'function') return;
    const listening = state === 'listening' || state === 'starting' || state === 'processing';
    const msg = VOICE_MSG[state];
    window.modal(`<div class="g3-voice" data-state="${safe(state)}">
      <div class="g3-voice-orb${listening ? ' live' : ''}">${ICON.mic}</div>
      <h2>${listening ? (state === 'processing' ? '확인하고 있어요…' : '듣고 있어요') : '다시 해볼까요?'}</h2>
      <p id="g3VoiceText">${listening ? (extra || '예: “서울 카페 코스 추천해줘”') : safe(msg ? msg.join(' ') : '')}</p>
      <div class="g3-voice-actions">
        ${listening ? '' : '<button type="button" class="g3-mini g3-mini-main" id="g3VoiceRetry">' + ICON.mic + '다시 말하기</button>'}
        <button type="button" class="g3-mini" id="g3VoiceType">글자로 입력</button>
        <button type="button" class="g3-mini" id="g3VoiceCancel">닫기</button>
      </div></div>`);
    const m = $('#modal');
    m.querySelector('#g3VoiceRetry')?.addEventListener('click', startVoice);
    m.querySelector('#g3VoiceType').addEventListener('click', () => { stopVoice(); openChat(); });
    m.querySelector('#g3VoiceCancel').addEventListener('click', () => { stopVoice(); m.close(); });
  }
  function stopVoice() {
    try { const n = nativeVoice(); if (n && n.stop) n.stop(); } catch (e) {}
    try { if (webRec) { webRec.onend = null; webRec.abort(); } } catch (e) {}
    webRec = null;
  }
  function startVoice() {
    stopVoice();
    heard = false;
    speakBack = true;
    const n = nativeVoice();
    if (n) {
      voiceDialog('starting');
      try { n.start(); } catch (e) { voiceDialog('error'); }
      return;
    }
    const Rec = SR();
    if (!Rec) { voiceDialog('unavailable'); return; }
    voiceDialog('starting');
    try {
      const r = webRec = new Rec();
      r.lang = 'ko-KR'; r.interimResults = true; r.maxAlternatives = 1; r.continuous = false;
      r.onstart = () => window.__g3VoiceState('listening');
      r.onresult = e => {
        let t = '', fin = false;
        for (let i = 0; i < e.results.length; i++) { t += e.results[i][0].transcript; if (e.results[i].isFinal) fin = true; }
        if (fin) window.__g3VoiceResult(t); else window.__g3VoicePartial(t);
      };
      r.onerror = e => window.__g3VoiceError(/not-allowed|service-not-allowed/.test(e.error) ? 'denied' : (e.error === 'no-speech' || e.error === 'aborted') ? 'nomatch' : 'unavailable');
      r.onend = () => { if (!heard) window.__g3VoiceError('nomatch'); };
      r.start();
    } catch (e) { voiceDialog('error'); }
  }
  window.__g3VoiceState = st => { const d = $('#modal .g3-voice'); if (d && st === 'listening') voiceDialog('listening'); else if (d && st === 'processing') voiceDialog('processing'); };
  window.__g3VoicePartial = t => { const el = $('#g3VoiceText'); if (el && t) el.textContent = '“' + t + '”'; };
  window.__g3VoiceResult = t => {
    t = String(t || '').trim();
    if (!t) return window.__g3VoiceError('nomatch');
    heard = true;
    const m = $('#modal'); if (m && m.open) m.close();
    askChat(t);
    setTimeout(speakLastReply, 450);
  };
  window.__g3VoiceError = code => {
    code = String(code || 'error');
    if (heard) return;
    // Android SpeechRecognizer codes: 7 no match, 6 timeout, 3/5 audio/client, 8 busy, 9 permission
    const map = { code7: 'nomatch', code6: 'nomatch', code8: 'busy', code9: 'denied', code2: 'unavailable', code4: 'unavailable' };
    voiceDialog(VOICE_MSG[code] ? code : (map[code] || 'error'));
  };
  function speak(text) {
    text = String(text || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    try {
      const n = window.IldangaVoice;
      if (n && typeof n.speak === 'function') { n.speak(text); return; }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text); u.lang = 'ko-KR'; u.rate = 1;
        window.speechSynthesis.speak(u);
      }
    } catch (e) {}
  }
  function speakLastReply() {
    if (!speakBack) return;
    const msgs = document.querySelectorAll('#gleoChatMessages .gleo-msg:not(.mine)');
    const last = msgs[msgs.length - 1];
    if (!last) { speak('검색 결과를 보여드릴게요.'); return; }
    const txt = (last.querySelector('p') || last).textContent;
    speak(txt);
  }

  /* ---------- tab bar. Edit this array to rename / re-map tabs. ---------- */
  const TABS = [
    { key: 'home',   label: '홈',   icon: 'home',     pages: ['home'],                 open: () => window.go('home') },
    { key: 'course', label: '코스', icon: 'route',    pages: ['community'],            open: () => { filter = '전체'; query = ''; window.go('community'); } },
    { key: 'route',  label: '일단가', icon: 'car',    pages: ['route'],                open: () => window.go('route') },
    { key: 'saved',  label: '저장', icon: 'bookmark', pages: ['saved'],                open: () => window.go('saved') },
    { key: 'my',     label: '마이', icon: 'user',     pages: ['my'],                   open: () => window.go('my') }
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
  function openMyModal() {
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
    m.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => { openCourse(b.dataset.open); }));
    m.querySelectorAll('[data-my]').forEach(b => b.addEventListener('click', () => { const a = b.dataset.my; m.close(); window.go(a === 'saved' ? 'saved' : 'route'); }));
  }

  const isMine = p => !!p && (p.mine || p.private);
  const openMy = () => window.go('my');
  function drawMyPage() {
    const host = $('#app'); if (!host || typeof state === 'undefined') return;
    const mine = (state.posts || []).filter(isMine);
    const card = p => {
      const stops = (p.stops || []).map(k => places[k] ? places[k].name : null).filter(Boolean).slice(0, 4).join(' → ');
      return `<article class="g3-mycard">
        <div class="g3-mycard-top"><span class="g3-pill">${safe(p.region || '여행')}</span><span class="g3-mycard-state">${p.private ? '나만 보기' : '커뮤니티 공유'}</span></div>
        <h3>${safe(p.title)}</h3>
        <p>${safe(stops)}${(p.stops || []).length > 4 ? ' 외' : ''}</p>
        <div class="g3-mycard-foot"><span>${(p.stops || []).length}곳</span>
          <span class="g3-mycard-btns"><button type="button" class="g3-mini" data-open="${safe(p.id)}">열기</button><button type="button" class="g3-mini g3-mini-main" data-edit="${safe(p.id)}">${ICON.edit}수정</button></span></div></article>`;
    };
    document.body.classList.remove('live-home');
    host.innerHTML = `<div class="g3-mypage">
      <div class="g3-my-top"><div><h1>마이 보관함</h1><p>내가 만들고 저장한 코스를 모아 봤어요.</p></div>
        <button type="button" class="g3-mini g3-mini-main g3-big" data-new="1">${ICON.plus}새 코스 만들기</button></div>
      <div class="g3-my-stats g3-my-stats-page">
        <div><b>${mine.length}</b><span>내가 만든 코스</span></div>
        <div><b>${mine.filter(p => !p.private).length}</b><span>공유한 코스</span></div>
        <button type="button" data-go-saved><b>${(state.saved || []).length}</b><span>저장한 코스 ›</span></button>
      </div>
      ${mine.length ? `<div class="g3-mygrid">${mine.map(card).join('')}</div>` : `<div class="g3-empty">아직 만든 코스가 없어요.<br>“새 코스 만들기”로 첫 코스를 입력해 보세요.</div>`}
      <p class="g3-my-note">로그인 기능은 없어요. 코스는 이 기기에만 저장돼요.</p></div>`;
    host.querySelector('[data-new]').addEventListener('click', () => openEditor({}));
    host.querySelector('[data-go-saved]').addEventListener('click', () => window.go('saved'));
    host.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openEditor({ id: b.dataset.edit })));
    host.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => openCourse(b.dataset.open)));
    window.scrollTo(0, 0);
  }

  /* ---------- notes (memo + photo), photo shrinking ---------- */
  function cleanNotes(notes, stops) {
    const out = {};
    (stops || []).forEach(k => {
      const n = notes && notes[k];
      if (n && (String(n.memo || '').trim() || n.photo)) out[k] = { memo: String(n.memo || '').trim().slice(0, 60), photo: n.photo || '' };
    });
    return out;
  }
  function shrinkPhoto(file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) return reject(new Error('not image'));
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const max = 520, r = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.width * r)); c.height = Math.max(1, Math.round(img.height * r));
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          let q = 0.72, out = c.toDataURL('image/jpeg', q);
          while (out.length > 90000 && q > 0.35) { q -= 0.1; out = c.toDataURL('image/jpeg', q); }
          URL.revokeObjectURL(url);
          resolve(out);
        } catch (e) { reject(e); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load')); };
      img.src = url;
    });
  }
  const firstMemo = p => { const n = p.notes || {}; for (const k of p.stops || []) if (n[k] && n[k].memo) return n[k].memo; return ''; };
  /* ---------- theme-matched cover art (offline illustrations). Real photos: put photos/<scene>.jpg to override. ---------- */
  const SCENE_RULES = [
    ['gungol', /고궁|경복궁|창덕궁|궁|성곽|화성|읍성|하회|경기전|오죽헌|서원|고분|대릉원/],
    ['bread', /빵|베이커리|성심당/],
    ['cafe', /카페|커피/],
    ['hanok', /한옥|북촌|벽화|동피랑|감천|문화마을|마을|황리단길/],
    ['market', /시장|맛집|닭갈비|순두부|찜닭|먹거리|포차/],
    ['museum', /전시|미술|박물|과학|디자인플라자|DDP/],
    ['night', /야경|타워|노을|낙조|월영교|밤바다|월지/],
    ['drive', /드라이브|해안도로|달맞이/],
    ['sea', /바다|해변|해수욕|해안|호미곶|대왕암|일출|섬|제주/],
    ['lake', /호수|공원|정원|수목원|습지|산책|한강/],
    ['mountain', /설악|무등산|미륵산|산$|산 |숲|자연|사구|케이블카|스카이워크|절경|삼봉/]
  ];
  const svgWrap = (sky, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/>${body}</svg>`;
  const SCENE_SVG = {
    gungol: () => svgWrap(['#b7d3ff', '#ffe6d2'], '<path d="M0 230 L70 150 L130 200 L210 120 L300 205 L360 160 L400 210 V300 H0Z" fill="#9db5d6" opacity=".8"/><rect x="40" y="225" width="320" height="75" fill="#d5c3ad"/><rect x="95" y="175" width="210" height="52" fill="#b9473d"/><g stroke="#8c2f2a" stroke-width="3"><path d="M125 175V227M160 175V227M200 175V227M240 175V227M275 175V227"/></g><path d="M50 180 Q95 176 112 150 H288 Q305 176 350 180 Q300 190 200 190 Q100 190 50 180Z" fill="#35505e"/><rect x="150" y="128" width="100" height="24" fill="#b9473d"/><path d="M115 128 Q145 124 158 100 H242 Q255 124 285 128 Q240 136 200 136 Q160 136 115 128Z" fill="#2b4350"/><path d="M185 100 L200 84 L215 100Z" fill="#2b4350"/>'),
    hanok: () => svgWrap(['#cfe6ff', '#fff0dc'], '<path d="M0 210 Q100 140 200 190 T400 170 V300 H0Z" fill="#a9c9a0"/><g><rect x="30" y="190" width="100" height="60" fill="#f2e3cc"/><path d="M15 192 Q60 188 75 166 Q90 188 145 192 Q80 204 15 192Z" fill="#3b4a55"/><rect x="150" y="180" width="110" height="70" fill="#f2e3cc"/><path d="M135 182 Q190 178 205 152 Q222 178 275 182 Q205 196 135 182Z" fill="#3b4a55"/><rect x="280" y="195" width="95" height="55" fill="#f2e3cc"/><path d="M268 197 Q320 193 330 172 Q345 193 388 197 Q328 208 268 197Z" fill="#3b4a55"/></g><g fill="#7a5a3a"><rect x="55" y="215" width="20" height="35"/><rect x="190" y="210" width="25" height="40"/><rect x="315" y="220" width="18" height="30"/></g><rect y="250" width="400" height="50" fill="#cbb89b"/>'),
    bread: () => svgWrap(['#ffe3c2', '#f6b98a'], '<ellipse cx="200" cy="250" rx="190" ry="26" fill="#a86a3c" opacity=".35"/><g fill="#d89a52" stroke="#a8692b" stroke-width="4"><ellipse cx="130" cy="190" rx="90" ry="46"/><ellipse cx="270" cy="200" rx="84" ry="42"/><ellipse cx="200" cy="140" rx="70" ry="38"/></g><g stroke="#f4cf93" stroke-width="5" stroke-linecap="round"><path d="M95 175l20 25M130 165l20 28M165 170l18 22M245 185l18 24M285 180l18 24M175 125l16 22M205 118l16 22M235 125l14 20"/></g>'),
    cafe: () => svgWrap(['#f4e1d2', '#e2b99c'], '<ellipse cx="200" cy="235" rx="150" ry="22" fill="#fff" opacity=".7"/><path d="M110 120 H290 V190 Q290 235 200 235 Q110 235 110 190Z" fill="#fff"/><path d="M290 140 Q340 140 340 175 Q340 205 285 205" fill="none" stroke="#fff" stroke-width="16"/><ellipse cx="200" cy="120" rx="90" ry="16" fill="#7a4a2b"/><g fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".85"><path d="M165 90 Q150 70 168 52 Q184 36 168 20"/><path d="M215 92 Q200 72 218 54 Q234 38 218 22"/></g>'),
    market: () => svgWrap(['#ffe9c9', '#ffd1a1'], '<g><path d="M20 90 H380 V120 H20Z" fill="#e5524a"/><g fill="#fff"><rect x="60" y="90" width="30" height="30"/><rect x="120" y="90" width="30" height="30"/><rect x="180" y="90" width="30" height="30"/><rect x="240" y="90" width="30" height="30"/><rect x="300" y="90" width="30" height="30"/></g></g><rect x="20" y="120" width="360" height="130" fill="#f3d9b5"/><rect x="40" y="190" width="320" height="22" fill="#9a6a3c"/><g><circle cx="80" cy="182" r="14" fill="#e5524a"/><circle cx="110" cy="182" r="14" fill="#f5a623"/><circle cx="140" cy="182" r="14" fill="#7cb342"/><circle cx="260" cy="182" r="14" fill="#f5a623"/><circle cx="290" cy="182" r="14" fill="#e5524a"/><circle cx="320" cy="182" r="14" fill="#7cb342"/></g><rect y="250" width="400" height="50" fill="#c9a77a"/>'),
    museum: () => svgWrap(['#d7e6ff', '#f1e7ff'], '<path d="M50 120 L200 60 L350 120Z" fill="#e9e4f5" stroke="#b9afd6" stroke-width="4"/><rect x="60" y="120" width="280" height="14" fill="#d9d1ee"/><g fill="#f7f4ff" stroke="#b9afd6" stroke-width="3"><rect x="80" y="134" width="26" height="100"/><rect x="130" y="134" width="26" height="100"/><rect x="180" y="134" width="26" height="100"/><rect x="230" y="134" width="26" height="100"/><rect x="280" y="134" width="26" height="100"/></g><rect x="45" y="234" width="310" height="22" fill="#d9d1ee"/><rect y="256" width="400" height="44" fill="#c9c2e0"/>'),
    night: () => svgWrap(['#1f1d4d', '#7a5aa8'], '<circle cx="320" cy="70" r="28" fill="#fff4cf"/><g fill="#fff" opacity=".85"><circle cx="50" cy="40" r="2"/><circle cx="120" cy="70" r="2"/><circle cx="200" cy="35" r="2"/><circle cx="260" cy="95" r="2"/><circle cx="360" cy="140" r="2"/></g><g fill="#15143a"><rect x="20" y="190" width="50" height="110"/><rect x="80" y="160" width="40" height="140"/><rect x="250" y="170" width="45" height="130"/><rect x="305" y="200" width="60" height="100"/></g><path d="M196 60 H204 L208 190 H192Z" fill="#15143a"/><ellipse cx="200" cy="110" rx="18" ry="9" fill="#15143a"/><rect x="150" y="190" width="100" height="110" fill="#15143a"/><g fill="#ffd36b"><rect x="90" y="175" width="5" height="6"/><rect x="104" y="195" width="5" height="6"/><rect x="262" y="190" width="5" height="6"/><rect x="320" y="220" width="5" height="6"/><rect x="165" y="215" width="5" height="6"/><rect x="225" y="240" width="5" height="6"/></g>'),
    drive: () => svgWrap(['#bfe3ff', '#fdebd0'], '<path d="M0 190 Q100 120 200 170 T400 150 V300 H0Z" fill="#8fc08a"/><path d="M0 230 Q120 175 250 205 T400 195 V300 H0Z" fill="#6fa86b"/><path d="M120 300 Q200 230 215 190 L240 190 Q250 240 330 300Z" fill="#6c6f7a"/><path d="M185 296 Q212 240 222 200" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="14 12"/><g transform="translate(250 250)"><rect width="60" height="22" rx="8" fill="#e5524a"/><rect x="10" y="-10" width="38" height="14" rx="6" fill="#f0a39e"/><circle cx="14" cy="24" r="7" fill="#2d2742"/><circle cx="46" cy="24" r="7" fill="#2d2742"/></g><circle cx="320" cy="70" r="26" fill="#fff3b0"/>'),
    sea: () => svgWrap(['#9fd8ff', '#e6f6ff'], '<circle cx="290" cy="80" r="32" fill="#fff3b0"/><rect y="150" width="400" height="100" fill="#3aa0d8"/><g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"><path d="M20 180 q20 -12 40 0 t40 0 t40 0"/><path d="M200 200 q20 -12 40 0 t40 0 t40 0"/><path d="M80 225 q20 -12 40 0 t40 0 t40 0"/></g><path d="M0 245 Q120 225 400 250 V300 H0Z" fill="#f2d9a8"/>'),
    lake: () => svgWrap(['#cfe9ff', '#eef8e6'], '<path d="M0 170 Q100 110 220 160 T400 140 V190 H0Z" fill="#9ccc8e"/><rect y="180" width="400" height="120" fill="#6bb6d8"/><g fill="#fff" opacity=".5"><ellipse cx="120" cy="215" rx="50" ry="5"/><ellipse cx="280" cy="245" rx="60" ry="5"/></g><g><rect x="62" y="130" width="10" height="50" fill="#7a5a3a"/><circle cx="67" cy="115" r="32" fill="#5fa85a"/><rect x="318" y="125" width="10" height="55" fill="#7a5a3a"/><circle cx="323" cy="108" r="36" fill="#4f9a50"/></g><rect x="150" y="168" width="70" height="8" fill="#8a6a45"/><rect x="156" y="176" width="6" height="14" fill="#8a6a45"/><rect x="208" y="176" width="6" height="14" fill="#8a6a45"/>'),
    mountain: () => svgWrap(['#c9e4ff', '#f4f7e4'], '<circle cx="320" cy="70" r="26" fill="#fff3b0"/><path d="M0 220 L90 110 L170 200 L250 90 L350 210 L400 170 V300 H0Z" fill="#8aa7c6"/><path d="M0 250 L110 160 L200 240 L300 150 L400 240 V300 H0Z" fill="#5f9a6b"/><g fill="#2f6b43"><path d="M50 260 L70 215 L90 260Z"/><path d="M95 265 L120 205 L145 265Z"/><path d="M280 262 L305 205 L330 262Z"/><path d="M335 262 L355 220 L375 262Z"/></g><rect y="262" width="400" height="38" fill="#3f7d52"/>')
  };
  const sceneFor = p => {
    const names = (p.stops || []).map(k => (places[k] ? places[k].name + ' ' + (places[k].cat || '') : '')).join(' ');
    const head = `${p.title || ''} ${p.tags || ''}`;
    const cnt = (re, t) => (t.match(new RegExp(re.source, 'g')) || []).length;
    let best = 'drive', top = 0;
    SCENE_RULES.forEach(([id, re]) => {
      const sc = cnt(re, head) * 2 + cnt(re, names) + cnt(re, p.desc || '') * .5;   // what the author called the course matters most
      if (sc > top) { top = sc; best = id; }
    });
    return best;
  };
  const sceneUri = id => 'data:image/svg+xml,' + encodeURIComponent((SCENE_SVG[id] || SCENE_SVG.drive)());
  const coverStyle = p => {
    const n = p.notes || {};
    for (const k of p.stops || []) if (n[k] && n[k].photo) return `url('${n[k].photo}')`;
    const id = sceneFor(p);
    return `url('photos/${id}.jpg'), url('${sceneUri(id)}')`; // real photo (if you add one) is painted over the illustration
  };

  /* ---------- review summary (rule based, from the reviews the app already loads) ---------- */
  const ASPECTS = [
    ['맛', /맛|음식|메뉴|빵|커피|디저트|국물|신선/, false],
    ['분위기', /분위기|인테리어|감성|예쁘|아늑|조용/, false],
    ['뷰·경치', /뷰|전망|경치|야경|바다|풍경|노을/, false],
    ['친절', /친절|직원|서비스|사장|응대/, false],
    ['가성비', /가성비|가격|저렴|합리/, false],
    ['청결', /깨끗|청결|위생/, false],
    ['웨이팅', /웨이팅|대기|줄이|줄을|붐비|사람이 (많|너무)|혼잡/, true],
    ['주차', /주차/, true]
  ];
  function summarizeReviews(reviews) {
    const stat = {}; let sum = 0, n = 0;
    (reviews || []).forEach(r => {
      const text = String((r.text && r.text.text) || (r.originalText && r.originalText.text) || '');
      const rating = Number(r.rating);
      if (Number.isFinite(rating)) { sum += rating; n++; }
      ASPECTS.forEach(([name, re, warnOnly]) => {
        if (!re.test(text)) return;
        const st = stat[name] || (stat[name] = { pos: 0, neg: 0, warn: warnOnly });
        if (warnOnly) st.neg++; else if (Number.isFinite(rating) && rating <= 2) st.neg++; else st.pos++;
      });
    });
    const good = Object.entries(stat).filter(([, v]) => !v.warn && v.pos > 0 && v.pos >= v.neg).sort((a, b) => b[1].pos - a[1].pos).map(([k]) => k);
    const warn = Object.entries(stat).filter(([, v]) => v.neg > 0).sort((a, b) => b[1].neg - a[1].neg).map(([k]) => k);
    return { good, warn, avg: n ? sum / n : null, count: (reviews || []).length };
  }
  function summaryLine(sm) {
    if (!sm.count) return '표시할 후기가 없어요.';
    const parts = [];
    if (sm.good.length) parts.push(`👍 ${sm.good.slice(0, 3).join('·')} 칭찬이 많아요`);
    if (sm.warn.length) parts.push(`⚠ ${sm.warn.slice(0, 3).join('·')} 언급이 있어요`);
    if (!parts.length) parts.push('특징적인 키워드는 아직 없어요');
    return parts.join(' / ');
  }
  function googleAiBox(d) {
    const g = d && d.reviewSummary;
    if (!g || !g.text) return '';
    const a = (u, t) => (typeof reviewUrl === 'function' && reviewUrl(u)) ? ` · <a href="${safe(reviewUrl(u))}">${t}</a>` : '';
    return `<div class="g3-rsum g3-gai"><b>Google AI 후기 요약</b><p>${safe(g.text)}</p><small>${safe(g.disclosure || 'Gemini로 요약됨')}${a(g.reviewsUri, 'Google Maps 후기')}${a(g.flagContentUri, '신고')}</small></div>`;
  }
  /* official hours + phone (from Google Maps place data, via /api/google/reviews) */
  function placeInfoBox(d) {
    const link = (typeof reviewUrl === 'function' && d.sourceUrl) ? reviewUrl(d.sourceUrl) : '';
    const more = link ? ` <a href="${safe(link)}">Google 지도에서 확인 ↗</a>` : '';
    const h = d.hours && Array.isArray(d.hours.weekdayDescriptions) ? d.hours.weekdayDescriptions.filter(x => typeof x === 'string').slice(0, 7) : [];
    let hoursHtml;
    if (h.length) {
      const today = h[(new Date().getDay() + 6) % 7] || h[0];
      hoursHtml = `<div class="g3-info-row"><span>🕒 영업시간</span><div><b>${safe(today)}</b><details><summary>요일별 전체 보기</summary><ul>${h.map(x => `<li>${safe(x)}</li>`).join('')}</ul></details></div></div>`;
    } else hoursHtml = `<div class="g3-info-row"><span>🕒 영업시간</span><div class="g3-info-none">Google 지도에 등록된 운영시간이 없어요.${more}</div></div>`;
    const ph = String(d.phone || d.phoneIntl || '').trim();
    let phoneHtml;
    if (/^[\d+\-\s()]{6,24}$/.test(ph)) {
      const tel = String(d.phoneIntl || ph).replace(/[^\d+]/g, '');
      phoneHtml = `<div class="g3-info-row"><span>📞 전화번호</span><div><a class="g3-tel" href="tel:${safe(tel)}">📞 ${safe(ph)}</a></div></div>`;
    } else phoneHtml = `<div class="g3-info-row"><span>📞 전화번호</span><div class="g3-info-none">등록된 전화번호가 없어요.</div></div>`;
    return `<div class="g3-rsum g3-info">${hoursHtml}${phoneHtml}<small>${d.demo ? '⚠ 예시 데이터예요. 실제 영업시간·전화번호가 아니에요. 서버를 연결하면 Google Maps 정보가 표시돼요.' : '출처: Google Maps · 공휴일·임시휴무는 다를 수 있어요. 방문 전 전화로 확인하면 가장 정확해요.'}</small></div>`;
  }
  const TRI = [['good', '👍 좋았던 점'], ['bad', '👎 아쉬운 점'], ['tip', '💡 방문 팁']];
  function triRow(kind, label, items) {
    const list = (items || []).filter(Boolean);
    return `<div class="g3-tri-row g3-tri-${kind}"><span>${label}</span>${list.length ? `<ul>${list.map(x => `<li>${safe(x)}</li>`).join('')}</ul>` : '<p class="g3-tri-none">후기에서 확인된 내용이 없어요.</p>'}</div>`;
  }
  function ruleTri(sm) {
    const tip = [];
    if (sm.warn.includes('웨이팅')) tip.push('사람이 몰리는 시간대를 피해서 가면 좋아요');
    if (sm.warn.includes('주차')) tip.push('주차가 신경 쓰인다는 후기가 있어요. 아래 근처 주차장을 확인하세요');
    return { good: sm.good.slice(0, 3).map(x => x + ' 칭찬이 많아요'), bad: sm.warn.slice(0, 3).map(x => x + ' 언급이 있어요'), tip };
  }
  function triHtml(sm, pid) {
    const r = ruleTri(sm);
    return `<div class="g3-rsum g3-tri${pid ? ' g3-ai' : ''}" ${pid ? `data-pid="${safe(pid)}"` : ''}><b>후기 한눈에 정리</b><p class="g3-tri-sum"></p>${TRI.map(([k, l]) => triRow(k, l, r[k])).join('')}<small class="g3-ai-note">${pid ? 'AI가 후기를 읽고 정리하는 중이에요… (처음엔 조금 걸려요) 그동안은 키워드로 간단히 보여드려요.' : ''} 표시된 Google Maps 후기 ${sm.count}개${sm.avg != null ? ` · 평균 ★${sm.avg.toFixed(1)}` : ''} 기준이에요. 전체 후기 분석은 아니에요.</small></div>`;
  }
  function reviewSummaryBox(data) {
    const sm = summarizeReviews(data.reviews || []);
    return googleAiBox(data) + triHtml(sm, data.placeId);
  }
  if (typeof reviewResultHtml === 'function') {
    const baseReviewHtml = reviewResultHtml;
    reviewResultHtml = function (data) {
      const html = baseReviewHtml(data);
      try {
        if (!data || data.error) return html;
        const hasRev = Array.isArray(data.reviews) && data.reviews.length;
        if (hasRev) setTimeout(() => fillAi(document.getElementById('liveReviews')), 0);
        const u = (typeof reviewUrl === 'function' && data.sourceUrl) ? reviewUrl(data.sourceUrl) : '';
        // 개별 후기 원문은 보여주지 않음: 요약 + Google Maps 매장 보기 링크만
        return placeInfoBox(data) + (hasRev ? reviewSummaryBox(data) : '<p class="g3-park-msg">요약할 후기가 아직 없어요.</p>') +
          `<p class="g3-src">후기 제공: Google Maps${u ? ` · <a href="${safe(u)}">Google Maps 매장 보기 ↗</a>` : ''}</p>`;
      } catch (e) { return html; }
    };
  }

  /* ---------- Korean AI summary of the Google reviews (server: /api/google/summary -> local Ollama) ---------- */
  const aiCache = new Map();
  let aiQueue = Promise.resolve();
  function aiSummary(pid) {
    if (aiCache.has(pid)) return aiCache.get(pid);
    const job = aiQueue.then(async () => {
      try {
        const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 170000);
        const res = await fetch('/api/google/summary?' + new URLSearchParams({ placeId: pid }), { signal: ctl.signal });
        clearTimeout(t);
        const d = await res.json();
        if (!res.ok) return { error: d.error || '요약 서버에 연결하지 못했어요.' };
        return d;
      } catch (e) { return { error: e.name === 'AbortError' ? '요약 시간이 너무 오래 걸려요.' : '요약 서버에 연결하지 못했어요.' }; }
    });
    aiQueue = job.catch(() => {});
    // an error is not cached, so the next view tries again
    job.then(d => { if (d && d.error) aiCache.delete(pid); });
    aiCache.set(pid, job);
    return job;
  }
  function fillAi(root) {
    (root || document).querySelectorAll('.g3-ai[data-pid]:not([data-filled])').forEach(async box => {
      box.dataset.filled = '1';
      const d = await aiSummary(box.dataset.pid);
      if (!box.isConnected) return;
      const note = box.querySelector('.g3-ai-note');
      if (!d || d.error || !d.summary) {
        if (note) note.textContent = ((d && (d.error || d.notice)) || 'AI 요약을 불러오지 못했어요.') + ' 지금은 키워드 요약만 보여드려요.';
        box.classList.add('g3-ai-off');
        return;
      }
      const sum = box.querySelector('.g3-tri-sum');
      if (sum) sum.textContent = d.summary;
      box.querySelectorAll('.g3-tri-row').forEach(row => {
        const kind = [...row.classList].find(c => c.startsWith('g3-tri-') && c !== 'g3-tri-row').slice(7);
        const li = (d[kind] || []).filter(x => typeof x === 'string' && x.trim());
        if (!li.length) return;
        row.querySelector('ul,.g3-tri-none')?.remove();
        row.insertAdjacentHTML('beforeend', `<ul>${li.map(x => `<li>${safe(x)}</li>`).join('')}</ul>`);
      });
      if (note && d.demo) { note.textContent = '⚠ 예시 요약이에요. 서버를 연결하면 실제 Google Maps 후기를 AI가 요약해요.'; return; }
      if (note) note.textContent = `Google Maps 후기 ${Number(d.count) || 0}개를 이 기기의 로컬 AI(${d.model || 'Ollama'})로 요약한 참고용 글이에요. 전체 후기 대표는 아니에요.`;
    });
  }

  /* ---------- recommendation (saved / own / liked courses -> similar public courses) ---------- */
  const tagsOf = p => String(p.tags || '').split(/[·,\s]+/).filter(Boolean);
  function tasteProfile() {
    const tag = {}, reg = {};
    const mineIds = new Set((state.posts || []).filter(isMine).map(x => x.id));
    const ids = new Set([...(state.saved || []), ...(state.liked || []), ...mineIds]);
    (state.posts || []).filter(p => ids.has(p.id)).forEach(p => {
      tagsOf(p).forEach(t => { tag[t] = (tag[t] || 0) + 1; });
      reg[p.region] = (reg[p.region] || 0) + 1;
    });
    return { tag, reg, ids };
  }
  function recommend(limit) {
    const tp = tasteProfile();
    const pool = (state.posts || []).filter(p => !p.private && !p.mine);
    const scored = pool.map(p => {
      let sc = (Number(p.likes) || 0) / 200, why = '';
      let best = 0;
      tagsOf(p).forEach(t => { if (tp.tag[t]) { sc += tp.tag[t] * 2; if (tp.tag[t] > best) { best = tp.tag[t]; why = `'${t}' 코스를 좋아해서`; } } });
      if (tp.reg[p.region]) { sc += tp.reg[p.region] * 1.5; if (!why) why = `${p.region} 코스를 자주 봐서`; }
      if (tp.ids.has(p.id)) sc -= 99;
      return { p, sc, why: why || '지금 인기 있어요' };
    }).sort((a, b) => b.sc - a.sc);
    return scored.slice(0, limit || 99);
  }
  const similarTo = (p, limit) => (state.posts || []).filter(x => x.id !== p.id && !x.private).map(x => ({ x, sc: (x.region === p.region ? 2 : 0) + tagsOf(x).filter(t => tagsOf(p).includes(t)).length * 2 + (Number(x.likes) || 0) / 400 })).sort((a, b) => b.sc - a.sc).slice(0, limit).map(o => o.x);

  /* ---------- nearby public parking (uses the app's existing /api/places/search = Kakao Local) ---------- */
  const parkCache = {};
  const PUBLIC_RE = /공영|공용|시립|구립|도립|시설관리|공단|환승|노상/;
  const hav = (a, b) => { const R = 6371000, r = x => x * Math.PI / 180, dLa = r(b.lat - a.lat), dLo = r(b.lng - a.lng), h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
  /* navigation-only parking override: changes where PLEOS navigates, never the course (state.route / posts / places) */
  const NAVO_KEY = 'g3.navOverride';
  const navOv = () => { try { return JSON.parse(localStorage.getItem(NAVO_KEY) || '{}') || {}; } catch (e) { return {}; } };
  const setNavOv = o => { try { localStorage.setItem(NAVO_KEY, JSON.stringify(o)); } catch (e) {} };
  function installNavWrap() {
    const nav = window.IldangaNavigation;
    if (!nav || typeof nav.startRoute !== 'function' || nav.__g3wrapped) return;
    const orig = nav.startRoute.bind(nav);
    const wrapped = { __g3wrapped: true, startRoute(json) {
      try {
        const ov = navOv(), d = JSON.parse(json);
        if (d && Array.isArray(d.stops)) {
          d.stops = d.stops.map(st => { const o = ov[st.id]; return o ? Object.assign({}, st, { name: o.name, latitude: o.lat, longitude: o.lng, address: o.address || '', poiId: '', poiSubId: '0' }) : st; });
          json = JSON.stringify(d);
        }
      } catch (e) {}
      return orig(json);
    } };
    for (const n of Object.getOwnPropertyNames(Object.getPrototypeOf(nav)).concat(Object.keys(nav))) {
      if (n !== 'startRoute' && n !== 'constructor' && typeof nav[n] === 'function') wrapped[n] = nav[n].bind(nav);
    }
    try { Object.defineProperty(window, 'IldangaNavigation', { value: wrapped, configurable: true, writable: true }); } catch (e) { try { nav.startRoute = wrapped.startRoute; } catch (e2) {} }
  }
  installNavWrap();
  async function fetchParking(k) {
    const pl = places[k];
    if (!pl) return { error: '장소 정보가 없어요.' };
    if (parkCache[k]) return parkCache[k];
    const ask = async term => {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 12000);
      try {
        const res = await fetch('/api/places/search?' + new URLSearchParams({ query: term, lat: pl.lat, lng: pl.lng, radius: '1500' }), { signal: ctl.signal });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || '주차장 검색 서버를 연결해 주세요.');
        return Array.isArray(d.places) ? d.places : [];
      } finally { clearTimeout(t); }
    };
    try {
      let list = await ask('공영주차장');
      if (list.length < 3) list = list.concat(await ask('주차장'));
      const seen = new Set();
      list = list.filter(x => x && /주차/.test(x.name || '') && !seen.has(x.id || x.name) && seen.add(x.id || x.name))
        .map(x => Object.assign({}, x, { d: Number.isFinite(Number(x.distanceMeters)) ? Number(x.distanceMeters) : (Number.isFinite(Number(x.lat)) ? hav(pl, { lat: Number(x.lat), lng: Number(x.lng) }) : 99999) }))
        .sort((a, b) => (PUBLIC_RE.test(b.name) - PUBLIC_RE.test(a.name)) || a.d - b.d)
        .slice(0, 3);
      return (parkCache[k] = { list });
    } catch (e) {
      return { error: e.name === 'AbortError' ? '검색 시간이 초과됐어요.' : (e.message || '주차장을 찾지 못했어요.') };
    }
  }
  function parkHtml(res, k, limit) {
    const fallback = `<button type="button" class="g3-mini" data-park-map="${safe(k)}">지도에서 주변 주차장 검색 ↗</button>`;
    if (res.error) return `<p class="g3-park-msg">${safe(res.error)}</p>${fallback}`;
    if (!res.list.length) return `<p class="g3-park-msg">1.5km 안에서 찾은 주차장이 없어요.</p>${fallback}`;
    return `<ul class="g3-park-list">${res.list.slice(0, limit || 3).map((x, i) => `<li><div><b>${safe(x.name)}</b>${PUBLIC_RE.test(x.name) ? ' <em class="g3-demo">공영</em>' : ''}<small>약 ${x.d >= 1000 ? (x.d / 1000).toFixed(1) + 'km' : Math.round(x.d / 10) * 10 + 'm'} · ${safe(x.address || '')}</small></div><div class="g3-park-btns">${Number.isFinite(Number(x.lat)) && Number.isFinite(Number(x.lng)) ? (navOv()[k] && navOv()[k].name === x.name ? `<button type="button" class="g3-mini on" data-park-nav="${safe(k)}:${i}">✓ 네비 목적지</button>` : `<button type="button" class="g3-mini" data-park-nav="${safe(k)}:${i}">🅿 주차장 추가하기</button>`) : ''}${x.placeUrl ? `<button type="button" class="g3-mini" data-park-open="${safe(k)}:${i}">장소정보 ↗</button>` : ''}</div></li>`).join('')}</ul>
      <small class="g3-park-note">${res.list.some(x => /^demo-park/.test(String(x.id))) ? '⚠ 예시 주차장이에요. 실제 위치가 아니에요. 서버를 연결하면 Kakao 검색 결과가 표시돼요.' : '검색 제공: Kakao · 요금·운영시간·만차 여부는 장소 페이지에서 확인해 주세요.'}</small>`;
  }
  function bindPark(box, k, res) {
    box.querySelectorAll('[data-park-open]').forEach(b => b.addEventListener('click', () => {
      const x = res.list[Number(b.dataset.parkOpen.split(':')[1])];
      if (x && typeof window.openPlaceUrl === 'function') window.openPlaceUrl(x.placeUrl);
    }));
    box.querySelectorAll('[data-park-nav]').forEach(b => b.addEventListener('click', () => {
      const x = res.list[Number(b.dataset.parkNav.split(':')[1])];
      if (!x) return;
      const o = navOv(), on = o[k] && o[k].name === x.name;
      if (on) delete o[k]; else o[k] = { name: x.name, lat: Number(x.lat), lng: Number(x.lng), address: x.address || '' };
      setNavOv(o); installNavWrap();
      toast(on ? '네비 목적지를 원래 장소로 되돌렸어요.' : `네비 목적지: ${x.name} (코스는 그대로예요)`);
      bindParkRefresh(k);
    }));
    box.querySelector('[data-park-map]')?.addEventListener('click', () => { if (typeof window.mapSearch === 'function') window.mapSearch(k, ' 주차장'); });
  }
  function bindParkRefresh(k) {
    document.querySelectorAll(`[data-parkbox="${k}"], #g3Park[data-place="${k}"] .g3-park-body, .g3-navpark[data-k="${k}"] .g3-navpark-body`).forEach(b => {
      const lim = b.classList.contains('g3-navpark-body') ? 1 : undefined;
      fillParkingInto(b, k, lim);
    });
  }
  async function fillParkingInto(box, k, limit) {
    if (!box) return;
    if (!box.innerHTML.trim()) box.innerHTML = '<p class="g3-park-msg" role="status">근처 공영주차장을 찾는 중이에요…</p>';
    const res = await fetchParking(k);
    if (!box.isConnected) return;
    box.innerHTML = parkHtml(res, k, limit) + (navOv()[k] ? `<p class="g3-park-msg g3-ov">🚗 네비는 <b>${safe(navOv()[k].name)}</b>(으)로 안내돼요. 코스는 바뀌지 않아요. <button type="button" class="g3-mini" data-park-reset="${safe(k)}">원래 장소로</button></p>` : '');
    box.querySelector('[data-park-reset]')?.addEventListener('click', () => { const o = navOv(); delete o[k]; setNavOv(o); toast('네비 목적지를 원래 장소로 되돌렸어요.'); bindParkRefresh(k); });
    bindPark(box, k, res);
  }
  if (typeof detailHtml === 'function') {  // route page: stop detail gets an automatic parking block
    const baseDetail = detailHtml;
    detailHtml = function (k) {
      const html = baseDetail(k);
      setTimeout(() => fillParkingInto(document.querySelector(`#g3Park[data-place="${k}"] .g3-park-body`), k), 0);
      const block = `<section class="g3-park" id="g3Park" data-place="${safe(k)}"><h3>🅿 주차장</h3><div class="g3-park-body"></div></section>`;
      const j = html.indexOf('<div class="preview-actions"');
      if (j >= 0) { const c = html.lastIndexOf('</div>', j); return html.slice(0, c) + block + html.slice(c); }   // after the review box (last thing in the scroll area)
      return html + block;
    };
  }
  function stopReviewHtml(d) {
    const u = (typeof reviewUrl === 'function' && d.sourceUrl) ? reviewUrl(d.sourceUrl) : '';
    return u ? `<small class="g3-src">후기 제공: Google Maps · <a href="${safe(u)}">Google Maps 매장 보기 ↗</a></small>` : '';
  }

  /* ---------- real place photos from the server (/api/tour/photo = 한국관광공사 TourAPI). Falls back to the illustration. ---------- */
  const photoCache = new Map();
  const USE_TOUR_PHOTOS = false;   // 관광공사 사진은 주제와 안 맞는 경우가 있어 끔. 직접 올린 사진 > photos/<scene>.jpg > 일러스트 순
  function tourPhoto(k) {
    if (!USE_TOUR_PHOTOS) return Promise.resolve(null);
    const pl = places[k];
    if (!pl || pl.sample) return Promise.resolve(null);
    if (photoCache.has(k)) return photoCache.get(k);
    const job = (async () => {
      try {
        const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 9000);
        const res = await fetch('/api/tour/photo?' + new URLSearchParams({ name: pl.name, lat: pl.lat, lng: pl.lng }), { signal: ctl.signal });
        clearTimeout(t);
        if (!res.ok) return null;
        const d = await res.json();
        return d && typeof d.image === 'string' && /^https:\/\//.test(d.image) ? d : null;
      } catch (e) { return null; }
    })();
    photoCache.set(k, job);
    return job;
  }
  async function coverPhoto(p) {
    const n = p.notes || {};
    if ((p.stops || []).some(k => n[k] && n[k].photo)) return null;      // the author's own photo wins
    for (const k of (p.stops || []).slice(0, 3)) { const d = await tourPhoto(k); if (d) return d; }
    return null;
  }
  function hydrateCovers(root) {
    const cards = [...root.querySelectorAll('.g3-card[data-course]')];
    const run = async el => {
      const p = (state.posts || []).find(x => x.id === el.dataset.course);
      const img = el.querySelector('.g3-card-img');
      if (!p || !img || img.dataset.real) return;
      const d = await coverPhoto(p);
      if (!d || !el.isConnected) return;
      img.dataset.real = '1';
      img.style.backgroundImage = `url('${d.image}'), ${coverStyle(p)}`;
      img.insertAdjacentHTML('beforeend', '<span class="g3-credit">사진 · 한국관광공사</span>');
    };
    if (!('IntersectionObserver' in window)) { cards.slice(0, 8).forEach(run); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); run(e.target); } }), { rootMargin: '200px' });
    cards.forEach(c => io.observe(c));
  }

  /* ---------- course detail ---------- */
  let revTimer = 0;
  function openCourse(id) {
    const p = (state.posts || []).find(x => x.id === id);
    if (!p || typeof window.modal !== 'function') return;
    const n = p.notes || {};
    const liked = (state.saved || []).includes(p.id);
    const stops = (p.stops || []).map((k, i) => {
      const nt = n[k] || {};
      return `<li class="g3-cd-stop">
        <span class="g3-ed-no">${i + 1}</span>
        <div class="g3-cd-stopbody"><b>${safe(placeLabel(k))}</b><small>${safe(places[k]?.cat || '')}${places[k]?.region ? ' · ' + safe(places[k].region) : ''}</small>
          ${nt.memo ? `<p class="g3-cd-memo">“${safe(nt.memo)}”</p>` : ''}</div>
        ${nt.photo ? `<img class="g3-cd-photo" src="${nt.photo}" alt="${safe(placeLabel(k))} 사진">` : ''}
        <div class="g3-cd-extra"><button type="button" class="g3-mini" data-park="${safe(k)}">🅿 근처 공영주차장</button><div data-parkbox="${safe(k)}"></div><div data-grev="${safe(k)}"></div></div></li>`;
    }).join('');
    const sim = similarTo(p, 3);
    window.modal(`<div class="g3-cd">
      <div class="g3-cd-cover" style="background-image:${coverStyle(p)}"><span class="g3-pill">${safe(p.region || '')}</span></div>
      <h2>${safe(p.title)}</h2>
      <p class="g3-cd-by">by ${safe(p.author || '나')} · ♡ ${Number(p.likes) || 0} · ${(p.stops || []).length}곳${p.private ? ' · 나만 보기' : ''}</p>
      <p class="g3-cd-desc">${safe(p.desc || '')}</p>
      <div id="g3Rev" class="g3-rsum g3-rsum-load"><b>후기 한눈에</b><p>장소별 Google 후기를 불러오는 중이에요…</p></div>
      <ol class="g3-cd-stops">${stops}</ol>
      ${reviewSection(p)}
      ${sim.length ? `<div class="g3-cd-sim"><b>비슷한 코스</b><div>${sim.map(x => `<button type="button" class="g3-fchip" data-sim="${safe(x.id)}">${safe(x.title)}</button>`).join('')}</div></div>` : ''}
      <div class="g3-cd-actions">
        <button type="button" class="primary" id="g3CdMap">지도·길안내로 보기</button>
        ${isMine(p) ? '<button type="button" id="g3CdEdit">수정</button>' : '<button type="button" id="g3CdCopy">내 코스로 가져오기</button>'}
        <button type="button" id="g3CdSave">${liked ? '저장됨' : '저장'}</button>
      </div></div>`);
    const m = $('#modal');
    m.querySelector('#g3CdMap').addEventListener('click', () => { m.close(); window.select(p.id); });
    m.querySelector('#g3CdEdit')?.addEventListener('click', () => openEditor({ id: p.id }));
    m.querySelector('#g3CdCopy')?.addEventListener('click', () => openEditor({ copyOf: p }));
    m.querySelector('#g3CdSave').addEventListener('click', () => { if (typeof window.save === 'function') { window.save(p.id); } });
    m.querySelectorAll('[data-sim]').forEach(b => b.addEventListener('click', () => openCourse(b.dataset.sim)));
    m.querySelectorAll('[data-park]').forEach(b => b.addEventListener('click', () => { b.hidden = true; fillParkingInto(m.querySelector(`[data-parkbox="${b.dataset.park}"]`), b.dataset.park); }));
    (async () => {
      const d = await coverPhoto(p);
      const cv = m.querySelector('.g3-cd-cover');
      if (d && cv && m.open) { cv.style.backgroundImage = `url('${d.image}'), ${coverStyle(p)}`; cv.insertAdjacentHTML('beforeend', '<span class="g3-credit">사진 · 한국관광공사</span>'); }
      for (const k of p.stops || []) {
        const nt = (p.notes || {})[k] || {};
        if (nt.photo) continue;
        const sp = await tourPhoto(k);
        const li = m.querySelector(`[data-parkbox="${k}"]`)?.closest('.g3-cd-stop');
        if (sp && li && !li.querySelector('.g3-cd-photo')) li.querySelector('.g3-cd-stopbody').insertAdjacentHTML('afterend', `<img class="g3-cd-photo" src="${safe(sp.image)}" alt="${safe(placeLabel(k))}" loading="lazy">`);
      }
    })();
    bindReviews(p, m);
    loadCourseReviews(p);
  }
  function loadCourseReviews(p) {
    clearInterval(revTimer);
    const keys = (p.stops || []).filter(k => places[k] && !places[k].sample);
    if (typeof autoReview !== 'function' || typeof reviewSessions === 'undefined') {
      const el = $('#g3Rev'); if (el) el.innerHTML = '<b>후기 한눈에</b><p>후기 서버가 연결되면 여기에 요약이 보여요.</p>';
      return;
    }
    keys.forEach(k => { try { autoReview(k); } catch (e) {} });
    let tries = 0;
    const paint = () => {
      const el = $('#g3Rev'); if (!el) { clearInterval(revTimer); return; }
      tries++;
      const got = keys.map(k => [k, reviewSessions.get(k)]);
      const ready = got.filter(([, d]) => d && !d.error && Array.isArray(d.reviews));
      const settled = got.every(([, d]) => d);
      if (!ready.length && !(settled || tries > 16)) return;
      clearInterval(revTimer);
      if (!ready.length) { el.classList.remove('g3-rsum-load'); el.innerHTML = '<b>후기 한눈에</b><p>아직 불러온 후기가 없어요. 장소 상세에서 후기를 볼 수 있어요.</p>'; return; }
      const all = summarizeReviews(ready.flatMap(([, d]) => d.reviews));
      const per = ready.map(([k, d]) => { const sm = summarizeReviews(d.reviews); return `<li><b>${safe(placeLabel(k))}</b> ${safe(summaryLine(sm))}</li>`; }).join('');
      ready.forEach(([k, d]) => { const box = document.querySelector(`[data-grev="${k}"]`); if (box) { box.innerHTML = (d.placeId ? triHtml(summarizeReviews(d.reviews || []), d.placeId) : '') + stopReviewHtml(d); fillAi(box); } });
      el.classList.remove('g3-rsum-load');
      el.innerHTML = `<b>후기 한눈에</b><p>${safe(summaryLine(all))}</p><ul>${per}</ul><small>${ready.length}곳의 Google Maps 후기(장소당 최대 5개) 기준 간단 요약이에요. 전체 후기 분석은 아니에요.</small>`;
    };
    revTimer = setInterval(paint, 1200);
    paint();
  }

  let draft = null;
  const placeLabel = k => { const p = places[k]; return p ? p.name : k; };
  function regionList() {
    return [...new Set(Object.values(places).filter(p => !p.sample).map(p => p.region).filter(Boolean))];
  }
  function openEditor(opts) {
    if (isDriving()) { denyDriving(); return; }
    opts = opts || {};
    let base;
    const existing = opts.id ? (state.posts || []).find(x => x.id === opts.id && isMine(x)) : null;
    if (existing) base = { id: existing.id, title: existing.title, region: existing.region, tags: existing.tags || '', desc: existing.desc || '', stops: [...existing.stops], share: !existing.private, notes: JSON.parse(JSON.stringify(existing.notes || {})) };
    else if (opts.copyOf) base = { title: `${opts.copyOf.title} · 내 버전`, region: opts.copyOf.region, tags: opts.copyOf.tags || '', desc: '', stops: [...opts.copyOf.stops], share: false, notes: JSON.parse(JSON.stringify(opts.copyOf.notes || {})), copiedFrom: opts.copyOf.author };
    else if (opts.fromRoute) base = { title: `${state.title} · 내 버전`, region: state.region, tags: '직접 만든 루트', desc: '', stops: [...state.route], share: true };
    else base = { title: '', region: state.region || '대전', tags: '', desc: '', stops: [], share: false };
    base.notes = base.notes || {};
    draft = base;
    const mode = existing ? '코스 수정' : (opts.copyOf ? '내 코스로 가져오기' : (opts.fromRoute ? '내 코스 공유하기' : '새 코스 만들기'));
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
      q('#g3EdStops').innerHTML = draft.stops.length ? draft.stops.map((k, i) => { const nt = draft.notes[k] || {}; return `<li class="g3-ed-stop">
          <span class="g3-ed-no">${i + 1}</span>
          <span class="g3-ed-name">${safe(placeLabel(k))}<small>${safe(places[k]?.cat || '')}${places[k]?.region ? ' · ' + safe(places[k].region) : ''}</small></span>
          <button type="button" class="g3-round" data-act="up" data-i="${i}" aria-label="위로" ${i === 0 ? 'disabled' : ''}>${ICON.up}</button>
          <button type="button" class="g3-round" data-act="down" data-i="${i}" aria-label="아래로" ${i === draft.stops.length - 1 ? 'disabled' : ''}>${ICON.down}</button>
          <button type="button" class="g3-round" data-act="del" data-i="${i}" aria-label="삭제">${ICON.x}</button>
          <div class="g3-ed-note">
            <input type="text" class="g3-ed-memo" data-k="${safe(k)}" maxlength="60" placeholder="한 줄 메모 (예: 줄이 길어서 오픈 전에 가세요)" value="${safe(nt.memo || '')}">
            <label class="g3-photo-btn">${ICON.camera}<span>${nt.photo ? '사진 변경' : '사진'}</span><input type="file" accept="image/*" data-photo="${safe(k)}" hidden></label>
            ${nt.photo ? `<span class="g3-thumb"><img src="${nt.photo}" alt="" ><button type="button" data-rmphoto="${safe(k)}" aria-label="사진 삭제">×</button></span>` : ''}
          </div></li>`; }).join('')
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
    q('#g3EdStops').addEventListener('input', e => {
      const t = e.target.closest('.g3-ed-memo'); if (!t) return;
      const k = t.dataset.k; draft.notes[k] = Object.assign(draft.notes[k] || {}, { memo: t.value });
    });
    q('#g3EdStops').addEventListener('change', async e => {
      const f = e.target.closest('[data-photo]'); if (!f || !f.files || !f.files[0]) return;
      const k = f.dataset.photo;
      try {
        const url = await shrinkPhoto(f.files[0]);
        draft.notes[k] = Object.assign(draft.notes[k] || {}, { photo: url });
        drawStops();
      } catch (err) { toast('사진을 불러오지 못했어요. 다른 사진을 골라 주세요.'); }
    });
    q('#g3EdStops').addEventListener('click', e => {
      const r = e.target.closest('[data-rmphoto]'); if (!r) return;
      const k = r.dataset.rmphoto; if (draft.notes[k]) delete draft.notes[k].photo; drawStops();
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
      const prev = draft.id ? state.posts.find(x => x.id === draft.id && isMine(x)) : null;
      const post = { id: draft.id || ('u' + Date.now()), title, region: regionSel.value, author: '나', desc: q('#g3EdDesc').value.trim() || '나의 여행 루트', stops: [...draft.stops], likes: prev ? prev.likes : 0, tags: q('#g3EdTags').value.trim() || '직접 만든 루트', mine: true, private: !share, notes: cleanNotes(draft.notes, draft.stops) };
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
  function courseCard(p, i, withReview) {
    const liked = (state.saved || []).includes(p.id);
    const likes = (Number(p.likes) || 0) + Number((state.liked || []).includes(p.id));
    const stops = (p.stops || []).map(k => (typeof places !== 'undefined' && places[k]) ? places[k].name : null).filter(Boolean).slice(0, 3).join(' → ');
    return `<article class="g3-card" style="--g3-i:${Math.min(i || 0, 6)}" data-course="${safe(p.id)}" tabindex="0" role="button" aria-label="${safe(p.title)} 코스 보기">
      <div class="g3-card-img" style="background-image:${coverStyle(p)}">
        <button type="button" class="g3-heart${liked ? ' on' : ''}" data-save="${safe(p.id)}" aria-label="${liked ? '저장 해제' : '저장'}">${liked ? ICON.heartfill : ICON.heart}</button></div>
      <div class="g3-card-body">
        <span class="g3-pill">${ICON.pin}${safe(p.region || '여행')}</span>
        <h3>${safe(p.title)}</h3>
        <p>${safe(stops || p.desc || '여행 코스')}</p>
        ${distMap[p.id] ? `<span class="g3-why g3-near">📍 내 위치에서 약 ${safe(distMap[p.id])}</span>` : whyMap[p.id] ? `<span class="g3-why">✨ ${safe(whyMap[p.id])} 추천해요</span>` : `<span class="g3-by">by ${safe(p.author || '나')}${firstMemo(p) ? ` · “${safe(firstMemo(p))}”` : ''}</span>`}
        ${withReview && latestReview(p) ? `<span class="g3-rv-line">“${safe(latestReview(p).text)}” <em>— ${safe(latestReview(p).author || '익명')}${latestReview(p).demo ? ' (예시)' : ''}</em></span>` : ''}
        <div class="g3-card-foot"><span class="g3-see">코스 보기 ${ICON.chevron}</span><span class="g3-meta">${ratingOf(p) != null ? `★ ${ratingOf(p).toFixed(1)} · 후기 ${reviewsOf(p).length} · ` : ''}♡ ${likes} · ${(p.stops || []).length}곳</span></div>
      </div></article>`;
  }
  /* ---------- home: region / theme filter + endlessly scrolling popular list ---------- */
  const THEMES = [
    ['전체', null], ['내 주변', 'NEAR'], ['추천', 'REC'], ['명소', /명소|궁|성곽|한옥|마을|문화/], ['카페', /카페|커피/], ['빵', /빵/], ['바다', /바다|해변|해수욕/],
    ['드라이브', /드라이브/], ['야경', /야경|노을/], ['산책', /산책|공원|수목원/], ['맛집', /맛집|시장|순두부|찜닭/],
    ['자연', /자연|숲|습지|산|사구|호수|섬/], ['역사', /역사|궁|성곽|읍성|고분|서원|하회/], ['전시', /전시|미술|박물|과학/], ['데이트', /데이트/]
  ];
  let gRegion = '전국', gTheme = '전체';
  const courseText = p => [p.title, p.desc, p.tags, ...(p.stops || []).map(k => (places[k] ? places[k].cat : ''))].join(' ');
  let whyMap = {}, distMap = {};
  /* ---------- 현재 위치 -> 내 주변 코스 (Android: window.IldangaLocation = Pleos FusedLocation -> LocationManager) ---------- */
  const LOC_KEY = 'g3.loc', DEFAULT_LOC = { lat: 36.3504, lng: 127.3845, source: 'default' };   // 위치를 못 받으면 대전 시청 기준(예시)
  let loc = null;
  try { const o = JSON.parse(localStorage.getItem(LOC_KEY) || 'null'); if (o && Number.isFinite(o.lat) && Number.isFinite(o.lng)) loc = o; } catch (e) {}
  const fmtKm = m => m >= 1000 ? (m / 1000).toFixed(m >= 10000 ? 0 : 1) + 'km' : Math.max(50, Math.round(m / 50) * 50) + 'm';
  const SRC_LABEL = { pleos: '차량 위치(Pleos)', android: '기기 위치', browser: '브라우저 위치', default: '기본 위치 · 대전(예시)' };
  const courseDist = (p, at) => {
    let best = Infinity;
    (p.stops || []).forEach(k => { const pl = places[k]; if (pl && Number.isFinite(Number(pl.lat)) && Number.isFinite(Number(pl.lng))) best = Math.min(best, hav(at, { lat: Number(pl.lat), lng: Number(pl.lng) })); });
    return best;
  };
  function nearbyCourses(at) {
    return (state.posts || []).filter(p => !p.private).map(p => ({ p, d: courseDist(p, at) })).filter(o => Number.isFinite(o.d))
      .sort((a, b) => a.d - b.d || (Number(b.p.likes) || 0) - (Number(a.p.likes) || 0));
  }
  let locWait = false;
  function requestLocation() {
    if (locWait) return; locWait = true;
    const done = () => { locWait = false; };
    const fallback = () => {
      if (loc) { done(); drawFilters(); drawList(); return; }
      applyLoc(DEFAULT_LOC.lat, DEFAULT_LOC.lng, 'default'); toast('현재 위치를 받지 못해 기본 위치(대전)로 보여드려요.'); done();
    };
    try {
      if (window.IldangaLocation && typeof window.IldangaLocation.request === 'function') {
        window.IldangaLocation.request();
        setTimeout(() => { if (locWait) fallback(); }, 6000);   // 6초 안에 좌표가 안 오면 기본 위치
        return;
      }
    } catch (e) {}
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => { applyLoc(pos.coords.latitude, pos.coords.longitude, 'browser'); done(); }, () => fallback(), { timeout: 5000, maximumAge: 60000 });
      return;
    }
    fallback();
  }
  function applyLoc(lat, lng, source) {
    lat = Number(lat); lng = Number(lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const moved = !loc || hav(loc, { lat, lng }) > 300 || loc.source !== source;
    loc = { lat, lng, source, ts: Date.now() };
    if (source !== 'default') { try { localStorage.setItem(LOC_KEY, JSON.stringify(loc)); } catch (e) {} }
    locWait = false;
    if (moved && gTheme === '내 주변' && $('#g3List')) { drawFilters(); drawList(); }
  }
  window.g3SetLocation = (lat, lng, source) => applyLoc(lat, lng, source || 'android');
  function filtered() {
    const re = (THEMES.find(t => t[0] === gTheme) || [])[1];
    whyMap = {}; distMap = {};
    if (re === 'NEAR') {
      if (!loc) return [];
      return nearbyCourses(loc).filter(o => gRegion === '전국' || o.p.region === gRegion).slice(0, 30).map(o => { distMap[o.p.id] = fmtKm(o.d); return o.p; });
    }
    if (re === 'REC') {
      return recommend().map(o => { whyMap[o.p.id] = o.why; return o.p; })
        .filter(p => gRegion === '전국' || p.region === gRegion);
    }
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
    if (gTheme === '내 주변' && !loc) { list.innerHTML = '<div class="g3-empty" role="status">현재 위치를 확인하는 중이에요…</div>'; $('#g3PopTitle').textContent = '내 주변 코스'; $('#g3PopCount').textContent = ''; requestLocation(); return; }
    $('#g3PopTitle').textContent = gTheme === '내 주변' ? '내 주변 코스' : gTheme === '추천' ? `${gRegion === '전국' ? '' : gRegion + ' '}나를 위한 추천 코스` : (label ? `${label} 인기 코스` : '지금 인기 있는 코스');
    $('#g3PopCount').textContent = gTheme === '내 주변' && loc ? `${posts.length}개 · ${SRC_LABEL[loc.source] || '현재 위치'}` : `${posts.length}개`;
    list.innerHTML = posts.length ? posts.map((p, i) => courseCard(p, i)).join('')
      : `<div class="g3-empty">조건에 맞는 코스가 아직 없어요.<br><button type="button" class="g3-mini g3-mini-main" id="g3EmptyChat">${ICON.chat}대화로 코스 만들기</button></div>`;
    { const pop = $('#g3Pop'); if (pop) pop.scrollTop = 0; }
    $('#g3EmptyChat')?.addEventListener('click', openChat);
    hydrateCovers(list);
    list.querySelectorAll('[data-save]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); if (typeof window.save === 'function') window.save(b.dataset.save); }));
    list.querySelectorAll('[data-course]').forEach(el => {
      const open = () => openCourse(el.dataset.course);
      el.addEventListener('click', open);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  }
  function drawFilters() {
    const box = $('#g3Filters');
    const regs = regionsNow();
    if (!regs.includes(gRegion)) gRegion = '전국';
    if (box.dataset.built) {  // already drawn: only move the highlight, keep the horizontal scroll position
      box.querySelectorAll('[data-region]').forEach(b => b.classList.toggle('on', b.dataset.region === gRegion));
      box.querySelectorAll('[data-theme]').forEach(b => b.classList.toggle('on', b.dataset.theme === gTheme));
      return;
    }
    const row = (name, items, cur, attr) => `<div class="g3-frow"><b>${name}</b><div class="g3-fchips">${items.map(v => `<button type="button" class="g3-fchip${v === cur ? ' on' : ''}" ${attr}="${safe(v)}">${safe(v)}</button>`).join('')}</div></div>`;
    box.innerHTML = row('지역', regs, gRegion, 'data-region') + row('테마', THEMES.map(t => t[0]), gTheme, 'data-theme');
    box.dataset.built = '1';
  }
  function drawHome() {
    const host = $('#app');
    if (!host || typeof state === 'undefined') return;
    host.innerHTML = `<div class="g3-home"><div class="g3-left">
      <section class="g3-hero" aria-label="일단가 코스 찾기">
        <h1>일단 출발해볼까?</h1>
        <p>말하듯 입력하면 코스를 추천해드릴게요</p>
        <form id="g3Search" class="g3-search" role="search">
          ${ICON.search}
          <input id="g3Query" readonly tabindex="-1" aria-label="일단가와 대화하기" placeholder="예: 서울 근교 드라이브 코스 추천해줘">
        </form>
        <button type="button" id="g3Voice" class="g3-find" aria-label="말로 코스 찾기">${ICON.mic}<span>코스 찾기</span></button>
      </section>
      <section id="g3Filters" class="g3-filters" aria-label="지역·테마 선택"></section></div>
      <section id="g3Pop" class="g3-popular" aria-label="인기 코스">
        <div class="g3-pop-head"><h2 id="g3PopTitle">지금 인기 있는 코스</h2><span id="g3PopCount" class="g3-count"></span></div>
        <div id="g3List" class="g3-cards"></div>
      </section></div>`;
    document.body.classList.add('live-home');
    drawFilters(); drawList();
    const form = $('#g3Search');
    form.addEventListener('submit', e => { e.preventDefault(); openChat(); });
    form.addEventListener('click', openChat);
    $('#g3Voice').addEventListener('click', startVoice);
    $('#g3Filters').addEventListener('click', e => {
      const b = e.target.closest('.g3-fchip'); if (!b) return;
      if (b.dataset.region) gRegion = b.dataset.region; else gTheme = b.dataset.theme;
      drawFilters(); drawList();
      if (b.dataset.theme === '내 주변' && loc) requestLocation();   // 이미 위치가 있어도 다시 눌러 새로고침
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
      if (!form.querySelector('.g3-chat-mic')) {
        const mic = document.createElement('button');
        mic.type = 'button'; mic.className = 'g3-chat-mic'; mic.setAttribute('aria-label', '말로 대화하기'); mic.innerHTML = ICON.mic;
        mic.addEventListener('click', startVoice);
        form.insertBefore(mic, form.querySelector('button[type=submit]'));
      }
      form.addEventListener('submit', () => { if (progSubmit) { progSubmit = false; return; } speakBack = false; try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} }, true);
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
  /* parking for the destination of the current navigation segment (inside the 길안내 dialog) */
  function ensureNavPark(m) {
    const list = m.querySelector('#segmentList');
    const cur = list && list.querySelector('li.g3-current .g3-seg-text');
    if (!cur || typeof state === 'undefined') return;
    const names = cur.textContent.split('→').map(x => x.trim()).filter(Boolean);
    const last = names[names.length - 1];
    const k = (state.route || []).find(key => places[key] && places[key].name === last);
    if (!k) return;
    let box = m.querySelector('#g3NavPark');
    if (box && box.dataset.k === k) return;
    if (!box) {
      box = document.createElement('section');
      box.id = 'g3NavPark';
      box.className = 'g3-park g3-navpark';
      list.insertAdjacentElement('afterend', box);
    }
    box.dataset.k = k;
    box.innerHTML = `<h3>🅿 ${safe(last)} 근처 공영주차장</h3><div class="g3-navpark-body"></div>`;
    fillParkingInto(box.querySelector('.g3-navpark-body'), k, 1);
  }
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
    installNavWrap();
    ensureNavPark(m);
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
    m.classList.toggle('g3-voice-modal', !!m.querySelector('.g3-voice'));
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
    xIncheonCT:{name:'차이나타운',lat:37.4755,lng:126.618,cat:'맛집',region:'인천'},
    xWolmi:{name:'월미도',lat:37.475,lng:126.597,cat:'명소',region:'인천'},
    xSongdo:{name:'송도 센트럴파크',lat:37.3925,lng:126.6395,cat:'산책',region:'인천'},
    xHwaseong:{name:'수원화성',lat:37.287,lng:127.011,cat:'명소',region:'수원'},
    xHaenggung:{name:'행궁동 카페거리',lat:37.282,lng:127.014,cat:'카페',region:'수원'},
    xGwanggyo:{name:'광교호수공원',lat:37.285,lng:127.067,cat:'산책',region:'수원'},
    xSoyang:{name:'소양강 스카이워크',lat:37.899,lng:127.726,cat:'명소',region:'춘천'},
    xNami:{name:'남이섬',lat:37.791,lng:127.525,cat:'명소',region:'춘천'},
    xDakgalbi:{name:'춘천 닭갈비골목',lat:37.876,lng:127.73,cat:'맛집',region:'춘천'},
    xDalseo:{name:'서문시장',lat:35.8695,lng:128.581,cat:'맛집',region:'대구'},
    xGeundae:{name:'근대골목',lat:35.868,lng:128.59,cat:'명소',region:'대구'},
    x83:{name:'이월드 83타워',lat:35.854,lng:128.566,cat:'야경',region:'대구'},
    xYangnim:{name:'양림동 역사문화마을',lat:35.1385,lng:126.914,cat:'명소',region:'광주'},
    xJeungsim:{name:'증심사 · 무등산',lat:35.123,lng:126.987,cat:'자연',region:'광주'},
    xSongjeongMkt:{name:'송정역시장',lat:35.138,lng:126.792,cat:'맛집',region:'광주'},
    xDaewang:{name:'대왕암공원',lat:35.489,lng:129.435,cat:'바다',region:'울산'},
    xTaehwa:{name:'태화강국가정원',lat:35.545,lng:129.3,cat:'산책',region:'울산'},
    xJangsaeng:{name:'장생포 고래문화마을',lat:35.501,lng:129.383,cat:'명소',region:'울산'},
    xSejongLake:{name:'세종호수공원',lat:36.498,lng:127.263,cat:'산책',region:'세종'},
    xSejongArb:{name:'국립세종수목원',lat:36.49,lng:127.248,cat:'자연',region:'세종'},
    xJeonjuHanok:{name:'전주한옥마을',lat:35.815,lng:127.153,cat:'명소',region:'전주'},
    xGyeonggijeon:{name:'경기전',lat:35.815,lng:127.15,cat:'역사',region:'전주'},
    xNambu:{name:'남부시장',lat:35.812,lng:127.145,cat:'맛집',region:'전주'},
    xSuncheonBay:{name:'순천만습지',lat:34.887,lng:127.509,cat:'자연',region:'순천'},
    xSuncheonGarden:{name:'순천만국가정원',lat:34.93,lng:127.496,cat:'산책',region:'순천'},
    xNagan:{name:'낙안읍성',lat:34.906,lng:127.341,cat:'역사',region:'순천'},
    xDongpirang:{name:'동피랑마을',lat:34.845,lng:128.433,cat:'명소',region:'통영'},
    xMireuk:{name:'통영 케이블카',lat:34.823,lng:128.418,cat:'자연',region:'통영'},
    xTongyeongMkt:{name:'통영 중앙시장',lat:34.845,lng:128.426,cat:'맛집',region:'통영'},
    xHahoe:{name:'안동 하회마을',lat:36.539,lng:128.518,cat:'역사',region:'안동'},
    xWolyeong:{name:'월영교',lat:36.581,lng:128.726,cat:'야경',region:'안동'},
    xDodam:{name:'도담삼봉',lat:36.998,lng:128.347,cat:'자연',region:'단양'},
    xManchun:{name:'만천하스카이워크',lat:36.977,lng:128.381,cat:'명소',region:'단양'},
    xKkotji:{name:'꽃지해수욕장',lat:36.499,lng:126.336,cat:'바다',region:'태안'},
    xSinduri:{name:'신두리 해안사구',lat:36.852,lng:126.185,cat:'자연',region:'태안'},
    xHomigot:{name:'호미곶',lat:36.077,lng:129.569,cat:'명소',region:'포항'},
    xYeongil:{name:'영일대 전망대',lat:36.062,lng:129.38,cat:'야경',region:'포항'},
    xJukdo:{name:'죽도시장',lat:36.039,lng:129.367,cat:'맛집',region:'포항'},
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
    {id:'xq1',title:'인천 차이나타운과 월미도 바다 바람',region:'인천',author:'일단가 에디터',desc:'차이나타운에서 맛집을 즐기고 월미도에서 바다 바람을 맞는 코스.',stops:['xIncheonCT','xWolmi'],likes:121,tags:'맛집 · 명소 · 바다'},
    {id:'xq2',title:'송도 센트럴파크 산책 코스',region:'인천',author:'일단가 에디터',desc:'송도 센트럴파크를 걷고 월미도 야경까지 보는 느긋한 하루.',stops:['xSongdo','xWolmi'],likes:64,tags:'산책 · 야경'},
    {id:'xq3',title:'수원화성 성곽길과 행궁동 카페',region:'수원',author:'일단가 에디터',desc:'화성 성곽을 걷고 행궁동 카페에서 쉬었다가 광교호수공원으로.',stops:['xHwaseong','xHaenggung','xGwanggyo'],likes:109,tags:'역사 · 카페 · 산책'},
    {id:'xq4',title:'춘천 호수 따라 남이섬과 닭갈비',region:'춘천',author:'일단가 에디터',desc:'소양강 스카이워크, 남이섬, 닭갈비골목까지 이어지는 강원 당일 코스.',stops:['xSoyang','xNami','xDakgalbi'],likes:115,tags:'자연 · 맛집 · 데이트'},
    {id:'xq5',title:'대구 근대골목과 서문시장 먹거리',region:'대구',author:'일단가 에디터',desc:'근대골목을 걷고 서문시장에서 먹고 83타워 야경으로 마무리.',stops:['xGeundae','xDalseo','x83'],likes:93,tags:'명소 · 맛집 · 야경'},
    {id:'xq6',title:'광주 양림동과 무등산 힐링',region:'광주',author:'일단가 에디터',desc:'양림동 역사마을과 증심사, 송정역시장을 잇는 코스.',stops:['xYangnim','xJeungsim','xSongjeongMkt'],likes:77,tags:'명소 · 자연 · 맛집'},
    {id:'xq7',title:'울산 대왕암과 태화강 바다·산책',region:'울산',author:'일단가 에디터',desc:'대왕암공원 바다 풍경과 태화강국가정원 산책, 장생포 고래마을.',stops:['xDaewang','xTaehwa','xJangsaeng'],likes:82,tags:'바다 · 산책 · 명소'},
    {id:'xq8',title:'세종 호수공원과 수목원 쉼표',region:'세종',author:'일단가 에디터',desc:'세종호수공원과 국립세종수목원을 걷는 여유로운 코스.',stops:['xSejongLake','xSejongArb'],likes:58,tags:'산책 · 자연'},
    {id:'xq9',title:'전주 한옥마을 먹고 걷기',region:'전주',author:'일단가 에디터',desc:'한옥마을과 경기전을 걷고 남부시장에서 먹거리를 즐겨요.',stops:['xJeonjuHanok','xGyeonggijeon','xNambu'],likes:139,tags:'명소 · 역사 · 맛집'},
    {id:'xq10',title:'순천 습지와 정원, 낙안읍성',region:'순천',author:'일단가 에디터',desc:'순천만습지와 국가정원, 낙안읍성을 하루에 도는 자연·역사 코스.',stops:['xSuncheonBay','xSuncheonGarden','xNagan'],likes:112,tags:'자연 · 역사 · 산책'},
    {id:'xq11',title:'통영 동피랑에서 케이블카까지',region:'통영',author:'일단가 에디터',desc:'동피랑 벽화마을, 미륵산 케이블카, 중앙시장.',stops:['xDongpirang','xMireuk','xTongyeongMkt'],likes:101,tags:'명소 · 자연 · 맛집'},
    {id:'xq12',title:'안동 하회마을과 월영교 야경',region:'안동',author:'일단가 에디터',desc:'하회마을을 걷고 월영교 야경으로 하루를 마무리.',stops:['xHahoe','xWolyeong'],likes:69,tags:'역사 · 야경'},
    {id:'xq13',title:'단양 절경과 스카이워크',region:'단양',author:'일단가 에디터',desc:'도담삼봉과 만천하스카이워크를 도는 자연 명소 코스.',stops:['xDodam','xManchun'],likes:86,tags:'자연 · 명소'},
    {id:'xq14',title:'태안 해변과 신두리 사구',region:'태안',author:'일단가 에디터',desc:'꽃지해수욕장 낙조와 신두리 해안사구를 만나는 서해 코스.',stops:['xKkotji','xSinduri'],likes:74,tags:'바다 · 자연 · 노을'},
    {id:'xq15',title:'포항 호미곶 일출과 영일대 야경',region:'포항',author:'일단가 에디터',desc:'호미곶과 영일대, 죽도시장을 잇는 동해안 코스.',stops:['xHomigot','xYeongil','xJukdo'],likes:90,tags:'바다 · 명소 · 야경'},
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

  /* ---------- course reviews (community). Demo reviews are clearly labelled "예시". ---------- */
  const DEMO_REVIEWS = {
    d:  [[5, '성심당에서 빵 고르고 수목원 걸으니 하루가 꽉 찼어요. 오전에 가면 줄이 짧아요.'], [4, '순서가 자연스러워요. 시장에서 간식 먹는 시간이 은근 길어요.']],
    s:  [[5, '해 질 무렵에 반포 → 서울숲 순서가 딱이었어요.'], [4, '주말은 한강 주차가 힘들어서 대중교통 추천해요.']],
    b:  [[5, '달맞이길 드라이브가 제일 좋았어요. 광안리는 저녁에 가세요.'], [4, '이동 시간이 조금 길어요. 점심 먼저 드시고 출발하세요.']],
    xp1: [[5, '경복궁에서 북촌까지 걷기 좋아요. 편한 신발 필수!'], [4, '홍대는 저녁에 사람이 많아서 일찍 도착하면 좋아요.']],
    xp3: [[5, '제주 서쪽 해안도로는 해 질 녘이 최고예요.'], [4, '협재는 주차장이 일찍 차요.']],
    xp9: [[5, '성수 카페 골라 가는 재미가 있어요. 서울숲에서 쉬어가기 좋아요.'], [4, '연남동까지 이어가면 체력 소모가 커요. 두 곳만 가도 충분해요.']],
    xq3: [[5, '성곽길 걷고 행궁동 카페에서 쉬니 딱 좋았어요.'], [4, '여름엔 낮 시간 성곽길이 더워요.']],
    xq9: [[5, '한옥마을은 평일 오전이 한적해요. 남부시장 간식 추천!'], [4, '한옥마을은 주말에 정말 붐벼요.']],
    xq10: [[5, '순천만은 해 질 무렵 풍경이 압권이에요.'], [4, '세 곳을 하루에 도니 빡빡했어요. 낙안읍성은 다음에 가도 좋아요.']],
    xq4: [[5, '소양강 스카이워크와 남이섬 조합 만족스러워요.'], [4, '닭갈비골목은 점심시간 웨이팅이 있어요.']]
  };
  function seedDemoReviews() {
    if (!Array.isArray(state.posts)) return;
    state.posts.forEach(p => {
      if (Array.isArray(p.reviews) || !DEMO_REVIEWS[p.id]) return;
      p.reviews = DEMO_REVIEWS[p.id].map(([rating, text], i) => ({ id: 'demo' + p.id + i, author: '일단가 예시', rating, text, date: '', demo: true }));
    });
  }
  seedDemoReviews();
  const reviewsOf = p => Array.isArray(p.reviews) ? p.reviews : [];
  const ratingOf = p => { const r = reviewsOf(p); return r.length ? r.reduce((a, x) => a + Number(x.rating || 0), 0) / r.length : null; };
  const stars = n => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
  const latestReview = p => { const r = reviewsOf(p); return r.length ? r[r.length - 1] : null; };
  function reviewSection(p) {
    const list = reviewsOf(p).slice().reverse();
    const avg = ratingOf(p);
    return `<div class="g3-cr">
      <div class="g3-cr-head"><b>코스 후기${list.length ? ` ${list.length}개` : ''}</b>${avg != null ? `<span class="g3-cr-avg">${stars(avg)} ${avg.toFixed(1)}</span>` : ''}</div>
      <ul class="g3-cr-list">${list.length ? list.map(r => `<li><div class="g3-cr-top"><span>${safe(r.author || '익명')}${r.demo ? ' <em class="g3-demo">예시</em>' : ''}</span><span class="g3-cr-star">${stars(r.rating)}</span></div><p>${safe(r.text)}</p>${r.mineReview ? `<button type="button" class="g3-cr-del" data-delrev="${safe(r.id)}">삭제</button>` : ''}</li>`).join('') : '<li class="g3-cr-empty">아직 후기가 없어요. 첫 후기를 남겨 보세요!</li>'}</ul>
      <form class="g3-cr-form" id="g3CrForm">
        <div class="g3-cr-pick" role="radiogroup" aria-label="별점">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="g3-cr-s${n <= 5 ? '' : ''}" data-s="${n}" aria-label="${n}점">☆</button>`).join('')}</div>
        <input type="text" id="g3CrText" maxlength="200" placeholder="다녀온 느낌을 한두 줄로 남겨 주세요" autocomplete="off">
        <button type="submit" class="g3-mini g3-mini-main">후기 등록</button>
      </form>
      <small>예시 표시가 있는 후기는 시연용 문구예요. 직접 쓴 후기는 이 기기에만 저장돼요.</small></div>`;
  }
  function bindReviews(p, m) {
    let pick = 0;
    const btns = m.querySelectorAll('.g3-cr-s');
    const paint = () => btns.forEach(b => { const on = Number(b.dataset.s) <= pick; b.textContent = on ? '★' : '☆'; b.classList.toggle('on', on); b.setAttribute('aria-checked', Number(b.dataset.s) === pick); });
    btns.forEach(b => b.addEventListener('click', () => { pick = Number(b.dataset.s); paint(); }));
    m.querySelector('#g3CrForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const text = m.querySelector('#g3CrText').value.trim();
      if (!pick) return toast('별점을 눌러 주세요.');
      if (text.length < 2) return toast('후기를 한 줄 이상 적어 주세요.');
      if (!Array.isArray(p.reviews)) p.reviews = [];
      p.reviews.push({ id: 'r' + Date.now(), author: '나', rating: pick, text, date: new Date().toISOString().slice(0, 10), mineReview: true });
      persist(); toast('후기를 남겼어요.');
      openCourse(p.id);
    });
    m.querySelectorAll('[data-delrev]').forEach(b => b.addEventListener('click', () => {
      p.reviews = reviewsOf(p).filter(r => r.id !== b.dataset.delrev); persist(); openCourse(p.id);
    }));
  }

  /* ---------- 코스 tab = community page ---------- */
  let cSort = 'popular', cRegion = '전국';
  function drawCommunityPage() {
    const host = $('#app'); if (!host || typeof state === 'undefined') return;
    document.body.classList.remove('live-home');
    const regs = regionsNow();
    if (!regs.includes(cRegion)) cRegion = '전국';
    let posts = (state.posts || []).filter(p => !p.private && (cRegion === '전국' || p.region === cRegion));
    const sorters = {
      popular: (a, b) => (Number(b.likes) || 0) - (Number(a.likes) || 0),
      rated: (a, b) => (ratingOf(b) || 0) - (ratingOf(a) || 0) || reviewsOf(b).length - reviewsOf(a).length,
      reviews: (a, b) => reviewsOf(b).length - reviewsOf(a).length
    };
    posts = posts.sort(sorters[cSort]);
    host.innerHTML = `<div class="g3-community">
      <div class="g3-my-top"><div><h1>코스 커뮤니티</h1><p>다녀온 사람들의 코스와 후기를 모아 봤어요.</p></div>
        <button type="button" class="g3-mini g3-mini-main g3-big" data-new="1">${ICON.plus}내 코스 올리기</button></div>
      <div class="g3-comm-filters">
        <div class="g3-fchips" id="g3CommSort">${[['popular', '인기순'], ['rated', '평점순'], ['reviews', '후기 많은 순']].map(([k, l]) => `<button type="button" class="g3-fchip${k === cSort ? ' on' : ''}" data-sort="${k}">${l}</button>`).join('')}</div>
        <div class="g3-fchips" id="g3CommRegion">${regs.map(r => `<button type="button" class="g3-fchip${r === cRegion ? ' on' : ''}" data-cr="${safe(r)}">${safe(r)}</button>`).join('')}</div>
      </div>
      <div class="g3-cards g3-comm-cards">${posts.map((p, i) => courseCard(p, i, true)).join('') || '<div class="g3-empty">조건에 맞는 코스가 없어요.</div>'}</div></div>`;
    hydrateCovers(host);
    host.querySelector('[data-new]').addEventListener('click', () => openEditor({}));
    host.querySelector('#g3CommSort').addEventListener('click', e => { const b = e.target.closest('[data-sort]'); if (b) { cSort = b.dataset.sort; drawCommunityPage(); } });
    host.querySelector('#g3CommRegion').addEventListener('click', e => { const b = e.target.closest('[data-cr]'); if (b) { cRegion = b.dataset.cr; drawCommunityPage(); } });
    host.querySelectorAll('[data-save]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); if (typeof window.save === 'function') window.save(b.dataset.save); }));
    host.querySelectorAll('[data-course]').forEach(el => {
      const open = () => openCourse(el.dataset.course);
      el.addEventListener('click', open);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    window.scrollTo(0, 0);
  }

  /* ---------- 주행 중 모드 (차량의 CarUxRestrictions 신호 + 미리보기) ---------- */
  let drivingReal = false, drivingPreview = false;
  const isDriving = () => drivingReal || drivingPreview;
  const DRIVE_MSG = '주행 중에는 길안내와 음성만 쓸 수 있어요. 정차하면 열려요.';
  const denyDriving = msg => { if (typeof toast === 'function') toast(msg || DRIVE_MSG); };
  const LOCK_RE = /순서.{0,4}편집|장소 추가|^[＋+]$|코스 공유|내 코스로 가져오기|새로고침|이전으로|처음 장소로/;
  function lockUi() {
    const on = isDriving();
    document.querySelectorAll('button').forEach(b => {
      const t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      if (on && LOCK_RE.test(t) && !b.closest('#g3Banner')) b.setAttribute('data-g3-lock', '1'); else b.removeAttribute('data-g3-lock');
    });
  }
  let lockQueued = false;
  new MutationObserver(() => {
    if (!isDriving() || lockQueued) return;
    lockQueued = true;
    requestAnimationFrame(() => { lockQueued = false; lockUi(); });
  }).observe(document.body, { childList: true, subtree: true });
  function applyDriving() {
    const on = isDriving();
    root.classList.toggle('g3-driving', on);
    let bar = $('#g3Banner');
    if (!bar) { bar = document.createElement('div'); bar.id = 'g3Banner'; bar.setAttribute('role', 'status'); document.body.appendChild(bar); }
    bar.hidden = !on;
    bar.innerHTML = `<span>🚗 주행 중 · 길안내와 음성만 쓸 수 있어요</span>${drivingPreview && !drivingReal ? '<button type="button" data-g3-preview-off>미리보기 끄기</button>' : ''}`;
    if (on) {
      const m = $('#modal');
      if (m && m.open && !m.classList.contains('g3-chat-modal') && m.querySelector('input:not([readonly]):not([type=checkbox]):not([type=radio]),textarea')) m.close();
      const a = document.activeElement;
      if (a && a.blur && /^(INPUT|TEXTAREA)$/.test(a.tagName)) a.blur();
      if (typeof page !== 'undefined' && (page === 'community' || page === 'my')) window.go('home');
    }
    lockUi();
    syncTabs();
  }
  document.addEventListener('click', e => {
    if (e.target.closest && e.target.closest('[data-g3-preview-off]')) { drivingPreview = false; applyDriving(); }
  });
  document.addEventListener('focusin', e => {
    if (!isDriving()) return;
    const t = e.target;
    if (t && t.matches && t.matches('input:not([readonly]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=button]):not([type=submit]),textarea,[contenteditable=""],[contenteditable="true"]')) {
      t.blur();
      denyDriving('주행 중에는 키보드를 쓸 수 없어요. 마이크로 말해 주세요.');
    }
  }, true);
  // 시연용: 로고를 1.2초 길게 누르면 주행 모드 미리보기가 켜지고 꺼집니다 (실제 차량 신호가 없어도 화면을 볼 수 있어요)
  (function () {
    let timer = null, fired = false;
    document.addEventListener('pointerdown', e => {
      if (!(e.target.closest && e.target.closest('header .brand'))) return;
      fired = false;
      timer = setTimeout(() => { fired = true; drivingPreview = !drivingPreview; applyDriving(); if (typeof toast === 'function') toast(drivingPreview ? '주행 모드 미리보기: 켬' : '주행 모드 미리보기: 끔'); }, 1200);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => document.addEventListener(ev, () => { clearTimeout(timer); }));
    document.addEventListener('click', e => { if (fired && e.target.closest && e.target.closest('header .brand')) { e.stopPropagation(); e.preventDefault(); fired = false; } }, true);
  })();
  window.g3SetDriving = (restricted) => { drivingReal = !!restricted; applyDriving(); };   // 앱(Java)이 차량 신호를 받아 호출
  window.g3PreviewDriving = v => { drivingPreview = !!v; applyDriving(); };
  // Back 하드키: 팝업 닫기 → 홈으로 → (이미 홈이면) 앱을 종료하지 않고 뒤로 숨기기. Java가 false를 받으면 moveTaskToBack(true)
  window.g3BackHandled = () => {
    const m = $('#modal');
    if (m && m.open) { m.close(); return true; }
    if (typeof page !== 'undefined' && page !== 'home') { window.go('home'); return true; }
    return false;
  };

  /* ---------- Gleo: 근처 장소 추가 (EDIT_TRAVEL_ROUTE operation = add_nearby) ----------
   * "근처에 산책할 곳 넣어 줘" -> {operation:'add_nearby', category:'산책', first:<이 번호 장소 뒤에 넣기(생략하면 마지막)>}
   * 앱에 들어 있는 장소 중 기준 장소에서 가장 가까운 같은 종류를 찾아 끼워 넣어요. (서버 불필요)  */
  const NEAR_CAT = { '산책': ['산책', '자연'], '공원': ['산책', '자연'], '카페': ['카페'], '맛집': ['맛집'], '식당': ['맛집'], '밥집': ['맛집'], '빵집': ['빵집'], '전시': ['전시'], '야경': ['야경'], '바다': ['바다'], '명소': ['명소', '역사'], '드라이브': ['드라이브'] };
  const NEAR_MAX_M = 25000, ROUTE_MAX = 12;
  function gleoAddNearby(p) {
    const J = o => JSON.stringify(o);
    const route = state.route;
    if (!Array.isArray(route) || route.length < 1) return J({ status: 'fail', message: 'There is no editable travel route.' });
    if (route.length >= ROUTE_MAX) return J({ status: 'fail', message: 'The route already has the maximum number of stops.' });
    const cat = String(p.category || '').trim();
    const cats = NEAR_CAT[cat];
    if (!cats) return J({ status: 'asking', message: 'Which kind of place should be added? (walk, cafe, restaurant, bakery, exhibition, night view, sea, sights, drive)' });
    let after = Number(p.first);
    if (!Number.isInteger(after) || after < 1 || after > route.length) after = route.length;
    const ref = places[route[after - 1]];
    if (!ref || !Number.isFinite(Number(ref.lat)) || !Number.isFinite(Number(ref.lng))) return J({ status: 'fail', message: 'The reference stop has no location.' });
    const at = { lat: Number(ref.lat), lng: Number(ref.lng) };
    const best = Object.entries(places)
      .filter(([k, pl]) => !route.includes(k) && pl && cats.includes(pl.cat) && Number.isFinite(Number(pl.lat)) && Number.isFinite(Number(pl.lng)))
      .map(([k, pl]) => ({ k, pl, d: hav(at, { lat: Number(pl.lat), lng: Number(pl.lng) }) }))
      .filter(o => o.d <= NEAR_MAX_M).sort((a, b) => (/예시/.test(a.pl.name) - /예시/.test(b.pl.name)) || a.d - b.d)[0];   // '예시' 이름의 임시 장소는 뒤로
    if (!best) return J({ status: 'fail', message: 'No nearby place of that kind was found.' });
    const next = [...route]; next.splice(after, 0, best.k);
    state.route = next; persist();
    try { const m = $('#modal'); if (m && m.open) m.close(); } catch (e) {}
    go('route');
    try { toast(`근처 ${cat} 장소를 추가했어요: ${best.pl.name} (${fmtKm(best.d)})`); } catch (e) {}
    return J({ status: 'success', message: 'Added ' + best.pl.name + ' after stop ' + after + '.' });
  }
  (function wrapGleo() {
    const orig = window.ildangaGleoDispatch;
    if (typeof orig !== 'function' || orig.__g3near) return;
    const w = function (action, raw) {
      try {
        if (action === 'EDIT_TRAVEL_ROUTE') { const p = JSON.parse(raw || '{}'); if (p && p.operation === 'add_nearby') return gleoAddNearby(p); }
      } catch (e) { return JSON.stringify({ status: 'fail', message: 'The travel request could not be processed.' }); }
      return orig.apply(this, arguments);
    };
    w.__g3near = true; window.ildangaGleoDispatch = w;
  })();

  /* ---------- install ---------- */
  const prevGo = window.go;
  if (typeof prevGo === 'function') {
    window.go = function (name) {
      if (isDriving() && (name === 'my' || name === 'community')) { denyDriving(); return; }
      if (name === 'my') {
        page = 'my';
        drawMyPage();
        buildHeader();
        syncTabs();
        return;
      }
      if (name === 'community') {
        page = 'community';
        drawCommunityPage();
        buildHeader();
        syncTabs();
        return;
      }
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
  // 앞선 레이어들이 차례로 그리는 중간 화면이 보이지 않도록, 첫 화면이 정리된 뒤에 보여줌
  ['editStops', 'openPicker', 'alternatives', 'refreshRoutePlace', 'previousRoutePlace', 'resetRoutePlace', 'openHomeSearch', 'assistant', 'publish', 'openCourseEditor'].forEach(n => {
    const f = window[n];
    if (typeof f !== 'function' || f.__g3drive) return;
    const w = function () { if (isDriving()) { denyDriving(); return; } return f.apply(this, arguments); };
    w.__g3drive = true;
    window[n] = w;
  });
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('ild-g3-ready')));
})();
