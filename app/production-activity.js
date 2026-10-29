/* Production load is human requests, not completed work. No prompt content is stored. */
(function(){
 const colors={total:'#0f766e',codex:'#2563eb',claude:'#c07838'};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const date=t=>new Date(t).toLocaleString('ru-RU',{timeZone:'Asia/Almaty',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
 let last=null;
 function series(data,periods){
  const lines=['codex','claude'].map(source=>{
   const devices=(data?.sources||[]).filter(r=>r.source===source);
   return {key:source,name:source==='codex'?'Codex':'Claude',points:periods.map(p=>{
    const values=devices.map(r=>{
     const until=r.dataObservedAt||r.observedAt;
     const known=!!r.coverageStart&&r.coverageStart<p.end&&until>=p.start;
     return {value:known?(r.buckets||[]).filter(b=>b.at>=p.start&&b.at<p.end).reduce((n,b)=>n+b.count,0):null,incomplete:known&&(r.coverageStart>p.start||until<Math.min(p.end,Date.now()-20*60000))};
    });
    const known=values.filter(v=>v.value!==null);
    return {...p,value:known.length?known.reduce((n,v)=>n+v.value,0):null,incomplete:known.length<devices.length||known.some(v=>v.incomplete)};
   })};
  });
  const total={key:'total',name:'Общая',points:periods.map((p,i)=>{
   const points=lines.map(l=>l.points[i]),known=points.filter(p=>p.value!==null);
   return {...p,value:known.length?known.reduce((n,p)=>n+p.value,0):null,incomplete:known.length<2||known.some(p=>p.incomplete)};
  })};return [total,...lines];
 }
 function computers(data){
  const groups=new Map();
  for(const r of data?.sources||[]){
   if(!r.connected&&!r.id?.startsWith('device_'))continue;
   const id=r.machineId||r.id||r.source;
   if(!groups.has(id))groups.set(id,{id,name:r.name||id,sources:[]});
   groups.get(id).sources.push(r);
  }
  return [...groups.values()];
 }
 function people(data){
  const groups=new Map();
  for(const r of data?.sources||[]){
   const assigned=data?.settings?.people?.[r.machineId||r.id];
   const name=assigned||r.personName||r.name||'Без имени';
   const id=(assigned||r.personName)?'person:'+name.trim().replace(/\s+/g,' ').toLocaleLowerCase('ru'):'device:'+(r.machineId||r.id);
   if(!groups.has(id))groups.set(id,{id,name,sources:[]});
   groups.get(id).sources.push(r);
  }
  return [...groups.values()].sort((a,b)=>a.name.localeCompare(b.name,'ru'));
 }
 function personColor(id){let hash=0;for(const c of id)hash=(hash*31+c.charCodeAt(0))>>>0;return `hsl(${hash%360} 56% 42%)`;}
 function peopleSeries(data,periods){
  const lines=people(data).map(g=>({...series(g,periods)[0],key:g.id,name:g.name,color:personColor(g.id)}));
  const total=series(data,periods)[0];return [total,...lines];
 }
 function peopleList(data,period){
  if(!period)return '<p>Нет периода для расчёта.</p>';
  return `<div data-pa-people style="font-size:11px;line-height:1.4"><p style="font-weight:600;color:var(--text)">Активность · ${esc(period.label)}</p>${people(data).map(g=>{
   const lines=series(g,[period]),total=lines[0].points[0],lastSync=Math.max(0,...g.sources.map(r=>r.observedAt||0));
   const value=p=>p.value===null?'—':p.value.toLocaleString('ru-RU')+(p.incomplete?'*':'');
   return `<div style="display:flex;align-items:start;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--line-2)"><div><strong style="color:var(--text);font-size:12px;font-weight:600"><i style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${personColor(g.id)};margin-right:7px"></i>${esc(g.name)}</strong><div style="margin-top:2px">Codex ${value(lines[1].points[0])} · Claude ${value(lines[2].points[0])}</div><small style="font-size:10px">${lastSync?'Обновлено '+esc(date(lastSync)):'Ожидает первых данных'}</small></div><strong style="font-size:14px;font-weight:600;white-space:nowrap;color:var(--text)">${value(total)}</strong></div>`;
  }).join('')}</div>`;
 }
 function svg(lines,maximum){
  const n=lines[0]?.points.length||1,w=n*100,h=650,top=66,bottom=618;
  const autoMax=Math.max(1,...lines.flatMap(l=>l.points.map(p=>p.value||0)));
  const guide=Math.max(1,Number(maximum)||autoMax),max=Math.max(guide,autoMax);
  const y=v=>bottom-Math.min(1,v/max)*(bottom-top);
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" aria-label="Активность Производства"><line x1="0" x2="${w}" y1="618" y2="618" stroke="var(--line-2)" vector-effect="non-scaling-stroke"/><line x1="0" x2="${w}" y1="${y(guide)}" y2="${y(guide)}" stroke="var(--line-2)" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/><text x="${w-8}" y="${y(guide)-38}" text-anchor="end" fill="var(--text-3)" font-size="18" font-weight="700">Максимум шкалы: ${guide}</text>${[...lines].sort((a,b)=>(a.key==='total')-(b.key==='total')).map(l=>{
   const segments=[];let segment=[];l.points.forEach((p,i)=>{if(p.value===null||p.partial||p.end>Date.now()){if(segment.length)segments.push(segment);segment=[];}else segment.push(`${i*100+50},${y(p.value)}`);});if(segment.length)segments.push(segment);
   return segments.map(s=>`<polyline points="${s.join(' ')}" fill="none" stroke="${l.color||colors[l.key]}" stroke-width="${l.key==='total'?3.5:1.5}" ${l.key==='total'?'':'stroke-dasharray="6 5" stroke-opacity=".55"'} vector-effect="non-scaling-stroke"/>`).join('')+l.points.map((p,i)=>p.value===null?'':`<g role="button" tabindex="0" onclick="productionActivity.details(${i})" onkeydown="if(event.key==='Enter')productionActivity.details(${i})"><title>${esc(l.name)}: ${p.value}${p.incomplete?' · неполные данные':''}</title><circle cx="${i*100+50}" cy="${y(p.value)}" r="${l.key==='total'?5:3}" opacity="${l.key==='total'?1:.6}" fill="${p.partial||p.end>Date.now()?'var(--surface)':(l.color||colors[l.key])}" stroke="${l.color||colors[l.key]}" stroke-width="2"/>${l.key==='total'?`<text x="${i*100+50}" y="${y(p.value)-15}" text-anchor="middle" font-size="20" fill="var(--text)">${p.value}${p.incomplete?'*':''}</text>`:''}</g>`).join('');
  }).join('')}</svg>`;
 }
 function connection(r,now=Date.now()){
  if(!r.connected||!r.observedAt)return {late:false,text:'Ожидает первой связи'};
  const age=Math.max(0,now-r.observedAt),days=Math.floor(age/86400000),hours=Math.floor(age/3600000)%24;
  if(age>86400000)return {late:true,text:`Нет связи ${days} сут.${hours?' '+hours+' ч.':''}`};
  if(age>30*60000)return {late:false,text:'Нет связи '+(age>=3600000?Math.floor(age/3600000)+' ч.':Math.floor(age/60000)+' мин.')};
  return {late:false,text:r.available?'На связи':'На связи · журнал недоступен'};
 }
 function deviceList(data){return `<div data-pa-connections style="margin-top:10px">${(data?.sources||[]).map(r=>{
  const state=connection(r),name=r.name||r.machineId||r.id||'Компьютер',agent=r.source==='codex'?'Codex':'Claude';
  return `<div style="padding:7px 8px;margin-top:4px;border-left:3px solid ${state.late?'#c2410c':'transparent'};background:${state.late?'#fff3e8':'transparent'};color:${state.late?'#9a3412':'var(--text-2)'};font-size:12px;line-height:1.4;overflow-wrap:anywhere" title="${r.observedAt?'Последняя связь: '+esc(date(r.observedAt)):'Данные ещё не поступали'}"><span style="font-weight:600">${esc(name)} · ${agent}</span><br><span>${state.late?'⚠ ':''}${state.text}</span></div>`;
 }).join('')||'<small>Компьютеры ещё не подключены</small>'}</div>`;}
 function statuses(data){return deviceList(data);}
 function deviceCharts(data,periods){return computers(data).map(g=>`<section class="pa-device"><h4>${esc(g.name)}</h4><div class="pa-device-plot">${svg(series(g,periods))}</div><div style="display:flex;justify-content:space-around;font-size:11px;color:var(--text-3)">${periods.map(p=>`<span>${esc(p.label)}</span>`).join('')}</div>${statuses(g)}</section>`).join('');}
 function compactStatus(data){
  const sources=data?.sources||[],active=sources.filter(r=>r.connected&&r.available&&Date.now()-r.observedAt<=30*60000).length;
  const updated=Math.max(0,...sources.map(r=>r.observedAt||0));
  return `Источники: ${active}/${sources.length} на связи${updated?' · '+date(updated):''}`;
 }
 function card(data,periods,options={}){
  const lines=peopleSeries(data,periods);last={data,periods,lines,options};
  return `<article class="fc-card" id="productionActivityCard"><div class="fc-card-head"><div><div class="fc-card-title">Активность Производства</div><div class="fc-card-sub">Обращения к Codex и Claude · ${esc(options.suffix||'нагрузка')}</div></div><div class="fc-card-actions"><button class="fc-access" onclick="openChartFullscreen(this)">⛶ На весь экран</button>${data?.canManage?'<button class="fc-access" onclick="productionActivity.settings()">Настройки</button>':''}</div></div><div class="fc-manager-legend" style="display:flex;flex-wrap:wrap;gap:8px 16px;font-size:12px;margin:8px 0">${lines.map(l=>`<span style="display:inline-flex;align-items:center;gap:5px"><i style="width:24px;border-top:${l.key==='total'?'3px solid':'1.5px dashed'} ${l.color||colors[l.key]};opacity:${l.key==='total'?1:.65}"></i>${esc(l.name)}</span>`).join('')}</div><div class="fc-plot">${data?.error?'<p class="fc-empty">Не удалось загрузить активность</p>':svg(lines,data?.settings?.scales?.[options.period||'week'])}</div><div class="fc-labels">${periods.map(p=>`<span>${esc(p.label)}</span>`).join('')}</div><div class="fc-notes"><small style="font-size:12px;color:var(--text-3)">${lines[0].points.some(p=>p.value!==null&&p.incomplete)?'* Неполные данные':''}</small></div><div class="fc-week-tasks" style="font-size:12px;color:var(--text-3)"><button class="fc-access" onclick="productionActivity.details()">По компьютерам</button><small style="display:block;margin-top:8px">${compactStatus(data)}</small>${peopleList(data,periods.at(-1))}<details style="margin-top:12px"><summary>Подключения</summary>${deviceList(data)}</details></div></article>`;
 }
 function details(index){
  if(!last)return;document.getElementById('productionDetail')?.remove();const d=document.createElement('div');d.id='productionDetail';d.className='money-ovl show';
  const p=last.periods[index];
  d.innerHTML=`<div class="money-modal"><div class="mm-h"><h3>Активность Производства${p?' · '+esc(p.label):''}</h3><button onclick="document.getElementById('productionDetail').remove()">×</button></div><div class="mm-b">${p?last.lines.map(l=>`<p>${esc(l.name)}: <b>${l.points[index].value??'Нет данных'}</b>${l.points[index].incomplete?' · неполные данные':''}</p>`).join(''):''}${p?peopleList(last.data,p):''}<style>.pa-devices{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:20px}.pa-device{min-width:0;border-bottom:1px solid var(--line-2);padding-bottom:12px}.pa-device h4{margin:8px 0}.pa-device-plot svg{display:block;width:100%;height:220px}.pa-device small{color:var(--text-3)}</style><div class="pa-devices">${deviceCharts(last.data,last.periods)}</div><p>Линии: общая — зелёная, Codex — синяя, Claude — оранжевая. Каждый компьютер учитывается отдельно; общая сумма объединяет их активность. Если одна история скопирована на разные компьютеры, она может учитываться повторно.</p><p>Считаются обращения пользователя к агентам в доступных журналах. Ответы инструментов, служебные события и вложенные агенты исключаются. Повторная синхронизация не увеличивает счётчики.</p><p>Обновление каждые 10 минут, пока компьютер включён. Браузерное расширение учитывает новые отправки после подключения. Имена при установке указываются сотрудниками; одинаковое имя объединяет их браузеры. В настройках можно назначить имя существующему компьютеру. При одновременном учёте одной сессии локальным сборщиком и расширением возможен двойной учёт. Текст сообщений не передаётся.</p></div></div>`;document.body.appendChild(d);
 }
  async function settings(){
  if(!last?.data?.canManage)return;
  let users;try{users=(await last.options.api('/users/list')).users||[];}catch(e){alert('Не удалось загрузить сотрудников: '+e.message);return;}
  document.getElementById('productionSettings')?.remove();
  const ovl=document.createElement('div');ovl.id='productionSettings';ovl.className='money-ovl show';
  const config=last.data.settings||{};
  ovl.innerHTML=`<div class="money-modal"><div class="mm-h"><h3>Настройки: Активность Производства</h3><button onclick="document.getElementById('productionSettings').remove()">×</button></div><form class="mm-b"><label>Максимум вертикальной шкалы</label><div class="fc-scale-grid">${[['day','День'],['week','Неделя'],['month','Месяц']].map(([key,title])=>`<label><span>${title}</span><input data-scale="${key}" type="number" min="1" max="100000000" step="1" placeholder="Автоматически" value="${Number(config.scales?.[key])||''}"></label>`).join('')}</div><small>Пустое поле — автоматический масштаб.</small><h4>Имена на графике</h4><p>Назначьте имя источникам без сотрудника. Одинаковое имя объединяет несколько компьютеров.</p>${computers(last.data).map(g=>`<label style="display:block;margin:10px 0">${esc(g.name)}<input data-person="${esc(g.id)}" maxlength="70" placeholder="Имя и фамилия" value="${esc(config.people?.[g.id]||g.sources.find(r=>r.personName)?.personName||'')}"></label>`).join('')}<p>Кто видит график и компьютеры. Super Admin видит всё.</p><div class="fc-modal-list">${users.filter(u=>u.email).map(u=>`<label style="display:block;margin:10px 0"><input type="checkbox" data-viewer value="${esc(u.email.toLowerCase())}" ${(config.viewers||[]).includes(u.email.toLowerCase())?'checked':''}> ${esc(u.name||u.email)}</label>`).join('')}</div><p role="status"></p><button class="fc-access" type="submit">Сохранить</button></form></div>`;
  ovl.querySelector('form').onsubmit=async e=>{
   e.preventDefault();const form=e.currentTarget,button=form.querySelector('button[type=submit]');button.disabled=true;
   const scales=Object.fromEntries([...form.querySelectorAll('[data-scale]')].map(input=>[input.dataset.scale,input.value===''?null:Number(input.value)]));
   const people=Object.fromEntries([...form.querySelectorAll('[data-person]')].map(input=>[input.dataset.person,input.value.trim()]).filter(([,v])=>v));
   const viewers=[...form.querySelectorAll('[data-viewer]:checked')].map(input=>input.value);
   try{await last.options.api('/production-activity/settings',{method:'PUT',body:{scales,viewers,people}});document.querySelector('.fc-fullscreen')?.close();ovl.remove();await last.options.refresh();}catch(error){form.querySelector('[role=status]').textContent='Не удалось сохранить: '+error.message;}finally{button.disabled=false;}
  };document.body.appendChild(ovl);
 }
 window.productionActivity={card,details,series,computers,settings,connection,deviceList,people,peopleSeries,peopleList};
})();
