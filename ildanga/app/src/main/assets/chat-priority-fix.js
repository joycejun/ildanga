/* Ildanga: free conversation is the default in-app chat, regardless of earlier home skins.
   Native PLEOS Gleo action dispatch functions are not modified. */
(function(){
  'use strict';
  function openFree(){
    if(typeof window.openIldangaFreeChat === 'function'){
      const legacy=document.querySelector('#modal');
      if(legacy && legacy.open && legacy.querySelector('.gleo-chat')){
        try{legacy.close();}catch(e){}
      }
      window.openIldangaFreeChat();
      return true;
    }
    return false;
  }
  // The old "Gleo chat" popup is a fixed-command simulator. Redirect the
  // on-screen chat launcher to the actual Ollama conversation instead.
  window.openGleoChat=function(){
    if(!openFree()) console.warn('[ildanga] free-chat.js is not loaded');
  };
  // Home UIs from different versions use different button IDs and titles.
  // Capture only explicit chat-launcher clicks; do not hijack route controls.
  document.addEventListener('click',function(event){
    const target=event.target;
    if(!(target instanceof Element))return;
    const button=target.closest('button,[role="button"]');
    if(!button||button.closest('#free-chat-layer')||button.closest('#modal'))return;
    const id=button.id||'';
    const label=(button.getAttribute('aria-label')||'')+' '+(button.textContent||'');
    const isChat=id==='auroraChat'||id==='premiumTalk'||
      /(?:gleo|글레오).{0,12}(?:대화|채팅)|(?:대화|채팅).{0,12}(?:gleo|글레오)|(?:ai|AI).{0,6}(?:랑|와|와의)?\s*(?:대화|채팅)/i.test(label);
    if(!isChat)return;
    if(openFree()){
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },true);
  window.ildangaChatDiagnostics=function(){
    return {
      freeChatLoaded:typeof window.openIldangaFreeChat==='function',
      routeButtonLoaded:typeof window.ildangaChatSafeRoute?.maybeOffer==='function',
      routeSearchLoaded:typeof window.ildangaChatRouteBridge?.discover==='function',
      chatElementVisible:!!document.querySelector('#free-chat-layer:not([hidden])'),
      overlay:document.querySelector('#gleoChatForm')?'legacy-command-popup':document.querySelector('#free-chat-layer:not([hidden])')?'ollama-free-chat':'none'
    };
  };
})();
