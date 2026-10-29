(() => {
  const source=()=>location.hostname==='claude.ai'?'claude':location.hostname==='chatgpt.com'&&/^\/codex(?:\/|$)/.test(location.pathname)?'codex':null;
  let last=0;
  function intent(){
    if(!source()||Date.now()-last<600)return;
    last=Date.now();
    // Only service and a nonce cross the boundary; no editor or conversation text.
    chrome.runtime.sendMessage({type:'intent',id:crypto.randomUUID(),at:Date.now()}).catch(()=>{});
  }
  const editor=target=>target instanceof Element&&target.closest('textarea,[contenteditable="true"],[role="textbox"]');
  document.addEventListener('keydown',e=>{
    if(e.isTrusted&&e.key==='Enter'&&!e.shiftKey&&!e.altKey&&!e.isComposing&&editor(e.target))intent();
  },true);
  document.addEventListener('submit',e=>{if(e.isTrusted)intent();},true);
  document.addEventListener('click',e=>{
    if(!e.isTrusted||!(e.target instanceof Element))return;
    const b=e.target.closest('button');if(!b||b.disabled)return;
    const label=(b.getAttribute('aria-label')||b.getAttribute('data-testid')||b.getAttribute('title')||b.textContent||'').trim();
    if(b.type==='submit'||/^(send(?: message| prompt)?|send-button|start(?: task)?|отправить(?: сообщение)?|code|ask|код|спросить)$/i.test(label))intent();
  },true);
})();
