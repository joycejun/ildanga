/* Move existing review block ahead of existing parking information without redesigning either. */
(function(){
'use strict';
function parkingLabel(el){
 if(!(el instanceof Element)||el.closest('.reviewbox,.ildanga-compact-summary,.ildanga-original-google-reviews')) return false;
 if(!/^(?:주차(?:장|\s*정보|\s*가능\s*여부)?|parking)(?:\s*[:：].*)?$/i.test((el.textContent||'').trim()))return false;
 // A heading / single field label, not a parent carrying its entire section.
 return /^(H[1-6]|STRONG|B|LABEL|DT|SPAN|P|SMALL|DIV)$/i.test(el.tagName) && el.children.length<=1;
}
function relocate(){
 const detail=document.querySelector('#placedetail .detail-scroll, #placedetail, .detail-scroll');
 if(!detail)return;
 const review=detail.querySelector('section.reviewbox');if(!review)return;
 const labels=Array.from(detail.querySelectorAll('h2,h3,h4,h5,b,strong,label,dt,span,p,small,div')).filter(parkingLabel);
 if(!labels.length)return;
 const parking=labels[0];
 // Locate the lowest common parent and its distinct children.
 let ancestor=review;
 while(ancestor&&!ancestor.contains(parking))ancestor=ancestor.parentElement;
 if(!ancestor||ancestor===review)return;
 let reviewChild=review,parkingChild=parking;
 while(reviewChild.parentElement!==ancestor)reviewChild=reviewChild.parentElement;
 while(parkingChild.parentElement!==ancestor)parkingChild=parkingChild.parentElement;
 if(reviewChild===parkingChild)return;
 if(reviewChild.compareDocumentPosition(parkingChild)&Node.DOCUMENT_POSITION_PRECEDING){
   ancestor.insertBefore(reviewChild,parkingChild);
 }
}
let scheduled=false;
const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;relocate();});});
function start(){if(!document.body)return;observer.observe(document.body,{childList:true,subtree:true});relocate();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
