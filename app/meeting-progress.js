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
 let meetings=[],loaded=false,busy=false,error='',checked=0;
 const roots=()=>[...document.querySelectorAll('[data-meeting-progress]')];
 function paint(root){
  root.innerHTML='<h4>Встречи — запись и расшифровка</h4>'+ (error?'<p role="status">'+esc(error)+'</p>':'')+
   (!loaded?'<p>Загружаем статусы встреч…</p>':!meetings.length?'<p>Сохранённых встреч пока нет.</p>':meetings.map(m=>`<article style="padding:12px 0;border-bottom:1px solid #e8e3d9"><b>${esc(m.deal_title||m.topic||'Видеовстреча')}</b><div style="font-size:12px;margin:4px 0">${esc(new Date(m.recording_start).toLocaleString('ru-RU',{timeZone:'Asia/Almaty'}))}</div><p role="status">${esc(meetingProgress(m.files))}</p>${m.deal_id?`<a href="/team.html#deal/${encodeURIComponent(m.deal_id)}" target="_blank" rel="noopener">Открыть материалы в сделке ↗</a>`:''}</article>`).join(''));
 }
 async function refresh(){
  const visible=roots().some(r=>r.getClientRects().length);
  if(busy||document.hidden||!visible||Date.now()-checked<30000)return;
  const token=await getToken();if(!token)return;busy=true;checked=Date.now();
  try{const r=await fetch('https://pllato-elc-worker.uurraa.workers.dev/api/zoom/archive',{headers:{Authorization:'Bearer '+token},cache:'no-store'});if(!r.ok)throw Error('Не удалось обновить статусы встреч. Повторим автоматически.');const data=await r.json();meetings=data.meetings;loaded=true;error='';}catch(e){error=e.message;}finally{busy=false;for(const root of roots())paint(root);}
 }
 function mount(){for(const target of document.querySelectorAll('[data-transcript-tasks]')){
  if(target.previousElementSibling?.hasAttribute('data-meeting-progress'))continue;
  const root=document.createElement('section');root.dataset.meetingProgress='';root.style.cssText='margin-top:16px;border-top:1px solid #e8e3d9;font-size:13px';target.before(root);paint(root);
 }refresh();}
 new MutationObserver(()=>{if([...document.querySelectorAll('[data-transcript-tasks]')].some(t=>!t.previousElementSibling?.hasAttribute('data-meeting-progress')))mount();}).observe(document.body,{subtree:true,childList:true});
 document.addEventListener('visibilitychange',refresh);window.addEventListener('focus',refresh);setInterval(refresh,30000);mount();
}
