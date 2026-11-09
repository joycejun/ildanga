
'use strict';

// Google Maps 실제 방문자 후기
const reviewSessions = new Map();
const reviewPending = new Set();
const reviewDetailBase = detailHtml;

// HTML 특수문자 처리
function reviewEscape(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[c]);
}

// 안전한 Google Maps 링크
function reviewUrl(value) {
    try {
        const u = new URL(String(value || ''));
        if (u.protocol !== 'https:') return '';
        if (u.hostname !== 'google.com' &&
            !u.hostname.endsWith('.google.com')) return '';
        return u.href;
    } catch (_) {
        return '';
    }
}

function reviewAttributionUrl(value, photo = false) {
    try {
        const u = new URL(String(value || ''));
        if (u.protocol !== 'https:' || u.username || u.password) return '';
        if (photo && u.hostname !== 'googleusercontent.com' &&
            !u.hostname.endsWith('.googleusercontent.com')) return '';
        return u.href;
    } catch (_) {
        return '';
    }
}

// 기존 매장 상세 화면 유지
detailHtml = function(k) {
    const html = reviewDetailBase(k);
    const data = reviewSessions.get(k);

    if ((!data || data.error) && !reviewPending.has(k)) {
        setTimeout(() => autoReview(k), 0);
    }

    const content = data
        ? reviewResultHtml(data)
        : '<p role="status">Google 방문자 후기를 불러오고 있어요…</p>';

    return html.replace(
        /<section class="reviewbox">[\s\S]*?<\/section>/,
        `<section class="reviewbox" id="liveReviews"
          data-place="${reviewEscape(k)}">
          <h3>✦ Google 방문자 후기</h3>
          ${content}
        </section>`
    );
};

// 리뷰 화면 생성
function reviewResultHtml(data) {

    if (data.error) {
        return `<p role="status">${reviewEscape(data.error)}</p>`;
    }

    const reviews = Array.isArray(data.reviews)
        ? data.reviews.slice(0, 5)
        : [];

    const rating = Number(data.rating);
    const count = Number(data.ratingCount);

    const ratingText = data.rating != null && Number.isFinite(rating)
        ? rating.toFixed(1) : '정보 없음';

    const countText = data.ratingCount != null && Number.isFinite(count)
        ? count.toLocaleString('ko-KR') : '정보 없음';

    let html = `
      <div class="google-reviews">
        <h3>⭐ ${reviewEscape(ratingText)} / 5.0</h3>
        <p>Google 전체 평점 수: ${reviewEscape(countText)}개</p>
        <p>표시된 방문자 후기: ${reviews.length}개</p>
        <p style="font-size:12px">
          Google Maps 관련성 순으로 제공된 최대 5개 후기입니다.
          전체 리뷰 분석 결과가 아닙니다.
        </p>
      </div>
    `;

    for (const r of reviews) {
        const author = r.authorAttribution || {};
        const name = reviewEscape(
            author.displayName || 'Google 사용자'
        );

        const authorUrl = reviewUrl(author.uri);
        const photoUrl = reviewAttributionUrl(author.photoUri, true);
        const sourceUrl = reviewUrl(r.googleMapsUri);

        const authorHtml = authorUrl
            ? `<a href="${reviewEscape(authorUrl)}">${name}</a>`
            : name;
        const avatarHtml = photoUrl
            ? `<img src="${reviewEscape(photoUrl)}" alt="${name} 프로필"
                 width="24" height="24" loading="lazy" referrerpolicy="no-referrer"> `
            : '';

        const stars = Number(r.rating);
        const starText = r.rating != null && Number.isFinite(stars)
            ? '★ ' + stars : '';

        const date = reviewEscape(
            r.relativePublishTimeDescription ||
            (r.publishTime || '').slice(0, 10)
        );

        const content = reviewEscape(
            r.text?.text || r.originalText?.text || ''
        );

        html += `
          <article class="reviewline"
            style="display:block;padding:14px 0;border-bottom:1px solid #ddd">

            <strong>${avatarHtml}${authorHtml}</strong>

            <p>${reviewEscape(starText)} · ${date}</p>

            <p style="white-space:pre-wrap;line-height:1.6">
              ${content}
            </p>

            ${r.text?.languageCode && r.originalText?.languageCode &&
              r.text.languageCode !== r.originalText.languageCode
              ? '<p class="muted">Google 번역 · 원문은 아래 링크에서 확인할 수 있어요.</p>' : ''}

            ${sourceUrl
              ? `<a href="${reviewEscape(sourceUrl)}">
                   Google Maps 원문 보기 ↗
                 </a>`
              : ''}
          </article>
        `;
    }

    if (!reviews.length) {
        html += '<p>표시할 후기가 없습니다.</p>';
    }

    const storeUrl = reviewUrl(data.sourceUrl);

    html += `
      <div class="officialsource">
        <p>후기 제공: <span translate="no" style="font-size:14px;font-style:normal;font-weight:400;color:#5e5e5e;white-space:nowrap">Google Maps</span></p>
        ${storeUrl
          ? `<a href="${reviewEscape(storeUrl)}">
               Google Maps 매장 보기 ↗
             </a>`
          : ''}
      </div>
    `;

    for (const attribution of data.attributions || []) {
        const label = reviewEscape(attribution.provider || '');
        const url = reviewAttributionUrl(attribution.providerUri);
        if (label) html += `<p class="officialsource">${url
            ? `<a href="${reviewEscape(url)}">${label}</a>` : label}</p>`;
    }

    return html;
}

// 화면 갱신
function paintReview(k) {
    const el = document.getElementById('liveReviews');

    if (el && el.dataset.place === String(k)) {
        el.innerHTML =
            '<h3>✦ Google 방문자 후기</h3>' +
            reviewResultHtml(reviewSessions.get(k) || {});
    }
}

// 서버 통신
async function reviewFetch(url) {
    const controller = new AbortController();
    const timer = setTimeout(
        () => controller.abort(), 45000
    );

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            cache: 'no-store'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || '후기 서버 연결 실패'
            );
        }

        return data;

    } finally {
        clearTimeout(timer);
    }
}

// 매장 선택 시 자동으로 Google 리뷰 조회
async function autoReview(k) {

    if (reviewPending.has(k) ||
        (reviewSessions.has(k) && !reviewSessions.get(k).error)) return;

    const p = places[k];

    if (!p) return;

    reviewPending.add(k);

    try {
        if (p.sample) {
            throw new Error(
                '실제 매장을 선택하면 후기가 표시됩니다.'
            );
        }

        const info = {
            ...p,
            ...(officialPlaces[k] || {})
        };

        const lat = Number(info.lat);
        const lng = Number(info.lng);

        if (!info.name ||
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)) {
            throw new Error(
                '매장 위치 정보가 부족합니다.'
            );
        }

        const params = new URLSearchParams({
            name: info.name,
            lat: String(lat),
            lng: String(lng)
        });

        const data = await reviewFetch(
            '/api/google/reviews?' + params.toString()
        );

        if (data.provider !== 'Google Maps' ||
            !Array.isArray(data.reviews)) {
            throw new Error(
                'Google 리뷰 응답이 올바르지 않습니다.'
            );
        }

        reviewSessions.set(k, data);

    } catch (e) {

        reviewSessions.set(k, {
            error: e.name === 'AbortError'
                ? '후기 요청 시간이 초과됐어요.'
                : e.message || '후기 조회에 실패했습니다.'
        });

    } finally {
        reviewPending.delete(k);
        paintReview(k);
    }
}

// 기존 라우트 화면 유지
if (page === 'route') go('route');
