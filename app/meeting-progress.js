const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function meetingProgress(files=[]){
 const active=files.filter(f=>!f.deleted_at&&f.status!=='deleted');
 const label=(kind,title)=>{
  const f=active.find(f=>kind==='video'?/^(MP4|WEBM)$/i.test(f.extension):/transcript/.test(f.kind));
  if(!f)return title+': пока нет';
  if(f.status==='stored')return title+': сохранено';
  if(['failed','interrupted'].includes(f.status))return title+': требуется проверка';
  return title+(kind==='video'?': записывается / загружается':': в обработке');
 };
 return label('video','Видео')+' · '+label('transcript','Расшифровка');
}
export function initMeetingProgress({getToken}){
 let meetings=[],loaded=false,busy=false,error='',checked=0,expanded=false;
 const roots=()=>[...document.querySelectorAll('[data-meeting-progress]')];
 function paint(root){
  const scrollTop=root.querySelector('[data-meeting-list]')?.scrollTop||0;
  const shown=expanded?meetings:meetings.slice(0,3);
  root.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px"><h4 style="font-size:13px;line-height:1.4;margin:0">Встречи · записи и расшифровки</h4>${meetings.length>3?`<button type="button" data-meeting-expand aria-expanded="${expanded}" style="flex-shrink:0;font:inherit;font-size:12px;background:none;border:1px solid #ddd6c9;border-radius:6px;padding:4px 8px;cursor:pointer">${expanded?'Свернуть':'Все · '+meetings.length}</button>`:''}</div>`+
   (error?'<p role="status" style="font-size:12px;margin:6px 0">'+esc(error)+'</p>':'')+
   `<div data-meeting-list style="max-height:320px;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain">`+
   (!loaded?'<p>Загружаем статусы встреч…</p>':!meetings.length?'<p>Сохранённых встреч пока нет.</p>':shown.map(m=>{
    const title=m.deal_title||m.topic||'Видеовстреча';
    const date=new Date(m.recording_start);
    const time=isNaN(date)?'Дата не указана':new Intl.DateTimeFormat('ru-RU',{timeZone:'Asia/Almaty',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date);
    return `<article style="padding:9px 0;border-bottom:1px solid #e8e3d9;font-size:12px;line-height:1.4;min-width:0">
      <div style="display:flex;gap:10px;align-items:baseline;min-width:0"><b title="${esc(title)}" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;font-size:12px">${esc(title)}</b><time style="flex-shrink:0;color:#777;font-size:11px">${esc(time)}</time></div>
      <div role="status" style="margin:4px 0;font-size:12px;overflow-wrap:anywhere">${esc(meetingProgress(m.files))}</div>
      ${m.deal_id?`<a href="/team.html#deal/${encodeURIComponent(m.deal_id)}" target="_blank" rel="noopener" style="font-size:12px;color:#86603e">Открыть запись и текст ↗</a>`:''}</article>`;
   }).join(''))+'</div>';
  const list=root.querySelector('[data-meeting-list]');if(list)list.scrollTop=scrollTop;
  const toggle=root.querySelector('[data-meeting-expand]');if(toggle)toggle.onclick=()=>{expanded=!expanded;for(const r of roots())paint(r);};
 }
 async function refresh(){
  const visible=roots().some(r=>r.getClientRects().length);
  if(busy||document.hidden||!visible||Date.now()-checked<30000)return;
  const token=await getToken();if(!token)return;busy=true;checked=Date.now();
  try{const r=await fetch('https://pllato-elc-worker.uurraa.workers.dev/api/zoom/archive',{headers:{Authorization:'Bearer '+token},cache:'no-store'});if(!r.ok)throw Error('Не удалось обновить статусы встреч. Повторим автоматически.');const data=await r.json();meetings=data.meetings;loaded=true;error='';}catch(e){error=e.message;}finally{busy=false;for(const root of roots())paint(root);}
 }
 function mount(){for(const target of document.querySelectorAll('[data-transcript-tasks]')){
  if(target.previousElementSibling?.hasAttribute('data-meeting-progress'))continue;
  const root=document.createElement('section');root.dataset.meetingProgress='';root.style.cssText='margin-top:16px;padding-top:12px;border-top:1px solid #e8e3d9;font-size:13px;min-width:0;max-width:100%';target.before(root);paint(root);
 }refresh();}
 new MutationObserver(()=>{if([...document.querySelectorAll('[data-transcript-tasks]')].some(t=>!t.previousElementSibling?.hasAttribute('data-meeting-progress')))mount();}).observe(document.body,{subtree:true,childList:true});
 document.addEventListener('visibilitychange',refresh);window.addEventListener('focus',refresh);setInterval(refresh,30000);mount();
}
