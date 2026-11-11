/* Compact, grounded Google review summary; keeps provider attributions available. */
(function () {
'use strict';
if (typeof reviewResultHtml !== 'function' || typeof paintReview !== 'function' || typeof reviewSessions === 'undefined') return;
const originalRender = reviewResultHtml;
const originalPaint = paintReview;
const cache = new Map();
const pending = new Set();
let lastPlaceKey = null;
const escapeText = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const labels = {good:'👍 좋았던 점',bad:'👎 아쉬운 점',tip:'💡 방문 팁'};
function safeLink(value){try{const url=new URL(String(value||''));return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';}catch(_){return '';}}
function reviewIdentity(data) {return String(data.placeId || data.place_id || data.sourceUrl || '');}
function summaryHtml(data) {
  const reviews = Array.isArray(data.reviews) ? data.reviews : [];
  if (data.error) return '<p class="muted">'+escapeText(data.error)+'</p>';
  if (!reviews.length) return '<p class="muted">Google 후기 본문이 없어 요약할 수 없어요.</p>';
  const key=reviewIdentity(data), result=cache.get(key);
  if (!result) return '<p class="muted" role="status">후기 한눈에 정리하는 중…</p>';
  if (result.error) return '<p class="muted">'+escapeText(result.error)+'</p><button class="small" onclick="ildangaSummaryRetry()">다시 시도</button>';
  const used = Number(result.usedCount || 0);
  const items = Array.isArray(result.items)?result.items:[];
  const byKind = new Map();
  for (const item of items) if (labels[item.kind] && !byKind.has(item.kind) && String(item.text||'').trim()) byKind.set(item.kind, item.text);
  const lines = ['good','bad','tip'].filter(kind=>byKind.has(kind)).map(kind=>'<p class="reviewline" style="margin:6px 0;line-height:1.5"><b>'+labels[kind]+'</b> · '+escapeText(byKind.get(kind))+'</p>').join('');
  return (lines||'<p class="muted">'+escapeText(result.notice || '확인된 후기만으로는 공통 의견을 찾기 어려워요.')+'</p>')
    +'<p class="muted" style="font-size:11px;margin:8px 0 0">Google 후기 '+used+'개 기준 · 전체 후기 대표 아님</p>';
}
reviewResultHtml = function (data) {
  if (data.error) return originalRender(data);
  const raw = Array.isArray(data.reviews)?data.reviews:[];
  if (!raw.length) return '<p class="muted">표시할 실제 Google 후기가 없어요.</p>'+originalRender(data);
  const sourceUrl=safeLink(data.sourceUrl);
  const source='<p class="officialsource" style="margin:8px 0">후기 제공: Google Maps'+(sourceUrl?' · <a href="'+escapeText(sourceUrl)+'">매장 보기 ↗</a>':'')+'</p>';
  return '<div class="ildanga-compact-summary" style="margin:8px 0 12px">'+summaryHtml(data)+'</div>'+source
   +'<details class="ildanga-original-google-reviews" style="margin-top:10px"><summary style="cursor:pointer">원문 후기 '+raw.length+'개 보기</summary><div style="padding-top:8px">'+originalRender(data)+'</div></details>';
};
function requestSummary(key){
 const data=reviewSessions.get(key);
 if (!data||data.error||!Array.isArray(data.reviews)||!data.reviews.length)return;
 const id=reviewIdentity(data);if(!id||pending.has(id)||cache.has(id))return;
 pending.add(id);
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),75000);
 fetch('/api/google/summary',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reviews:data.reviews.slice(0,5)}),signal:controller.signal})
 .then(async r=>{const v=await r.json();if(!r.ok)throw Error(v.error||'요약 서버 응답 오류');return v;})
 .then(v=>cache.set(id,v))
 .catch(error=>cache.set(id,{error:error.name==='AbortError'?'요약 시간이 초과됐어요.':error.message||'요약에 실패했어요.'}))
 .finally(()=>{clearTimeout(timer);pending.delete(id);if(lastPlaceKey===key)originalPaint(key);});
}
paintReview=function(key){lastPlaceKey=key;originalPaint(key);requestSummary(key);};
window.ildangaSummaryRetry=function(){if(lastPlaceKey===null)return;const data=reviewSessions.get(lastPlaceKey);if(!data)return;cache.delete(reviewIdentity(data));originalPaint(lastPlaceKey);requestSummary(lastPlaceKey);};
})();
