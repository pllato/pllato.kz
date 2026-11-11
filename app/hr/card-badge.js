(function(){
 async function refresh(){
  const cards=document.querySelectorAll('[data-app-id="hr_hiring"],[data-app-id="hr_personality"]');if(!cards.length)return;
  const pw=localStorage.getItem('hr_team_pw');if(!pw){cards.forEach(c=>c.querySelector('[data-hr-new]')?.remove());return;}
  try{const r=await fetch('https://pllato-hr-worker.uurraa.workers.dev/api/hr/summary',{headers:{'X-HR-Team':pw},signal:AbortSignal.timeout(10000)});if(!r.ok)return;const d=await r.json();
   cards.forEach(card=>{let a=card.querySelector('[data-hr-new]');if(!a){a=document.createElement('a');a.dataset.hrNew='';a.style.cssText='display:block;padding:10px 12px;border-radius:8px;background:#fff4df;color:#74491d;font-weight:700;text-decoration:none;margin:8px 0';card.querySelector('h3')?.after(a)}const personal=card.dataset.appId==='hr_personality';const count=Number(personal?d.personality:d.pending)||0;a.href='/app/hr/admin.html'+(personal?'?filter=new&stage=personality':'?filter=new');a.textContent=count?'Новых на проверку: '+count:'Новых результатов нет';a.style.background=count?'#fff4df':'#f5f5f0';});
  }catch{}
 }
 refresh();setInterval(()=>{if(!document.hidden)refresh()},30000);window.addEventListener('focus',refresh);window.addEventListener('storage',e=>{if(e.key==='hr_reviewed_refresh'||e.key==='hr_team_pw')refresh()});
})();
