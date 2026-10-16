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
 function svg(lines){
  const n=lines[0]?.points.length||1,w=n*100,h=650,top=60,bottom=600;
  const max=Math.max(1,...lines.flatMap(l=>l.points.map(p=>p.value||0)));
  const y=v=>bottom-v/max*(bottom-top);
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" aria-label="Активность Производства"><line x1="0" x2="${w}" y1="600" y2="600" stroke="var(--line-2)"/><text x="${w-8}" y="28" text-anchor="end" fill="var(--text-3)" font-size="18">Обращения · максимум ${max}</text>${[...lines].sort((a,b)=>(a.key==='total')-(b.key==='total')).map(l=>{
   const segments=[];let segment=[];l.points.forEach((p,i)=>{if(p.value===null){if(segment.length)segments.push(segment);segment=[];}else segment.push(`${i*100+50},${y(p.value)}`);});if(segment.length)segments.push(segment);
   return segments.map(s=>`<polyline points="${s.join(' ')}" fill="none" stroke="${colors[l.key]}" stroke-width="${l.key==='total'?4:1.5}" ${l.key==='total'?'':'stroke-dasharray="6 5" stroke-opacity=".55"'} vector-effect="non-scaling-stroke"/>`).join('')+l.points.map((p,i)=>p.value===null?'':`<g role="button" tabindex="0" onclick="productionActivity.details(${i})" onkeydown="if(event.key==='Enter')productionActivity.details(${i})"><title>${esc(l.name)}: ${p.value}${p.incomplete?' · неполные данные':''}</title><circle cx="${i*100+50}" cy="${y(p.value)}" r="${l.key==='total'?5:3}" opacity="${l.key==='total'?1:.6}" fill="${p.partial?'var(--surface)':colors[l.key]}" stroke="${colors[l.key]}" stroke-width="2"/>${l.key==='total'?`<text x="${i*100+50}" y="${y(p.value)-15}" text-anchor="middle" font-size="20" fill="var(--text)">${p.value}${p.incomplete?'*':''}</text>`:''}</g>`).join('');
  }).join('')}</svg>`;
 }
 function statuses(data){return (data?.sources||[]).map(r=>{
  const name=(r.name?esc(r.name)+' · ':'')+(r.source==='codex'?'Codex':'Claude');
  if(!r.connected)return `<p><b>${name}</b> · ещё не подключён</p>`;
  return `<p><b>${name}</b> · ${!r.available?'журнал недоступен':Date.now()-r.observedAt>30*60000?'ожидает синхронизации':'подключён'}<br><small>Последняя синхронизация: ${date(r.observedAt)}${r.coverageStart?' · история с '+date(r.coverageStart):''}</small></p>`;
 }).join('');}
 function deviceCharts(data,periods){return computers(data).map(g=>`<section class="pa-device"><h4>${esc(g.name)}</h4><div class="pa-device-plot">${svg(series(g,periods))}</div><div style="display:flex;justify-content:space-around;font-size:11px;color:var(--text-3)">${periods.map(p=>`<span>${esc(p.label)}</span>`).join('')}</div>${statuses(g)}</section>`).join('');}
 function card(data,periods){
  const lines=series(data,periods);last={data,periods,lines};
  return `<article class="fc-card" id="productionActivityCard"><div class="fc-card-head"><div><h3 class="fc-card-title">Активность Производства</h3><p class="fc-card-sub">Обращения к Codex и Claude · нагрузка, не выполненные задачи</p></div><div class="fc-card-actions"><button class="fc-access" onclick="productionActivity.details()">По компьютерам</button></div></div><div class="fc-manager-legend">${lines.map(l=>`<span style="display:inline-flex;align-items:center;gap:5px;margin-right:14px"><i style="width:24px;border-top:${l.key==='total'?'3px solid':'1.5px dashed'} ${colors[l.key]};opacity:${l.key==='total'?1:.65}"></i>${l.name}</span>`).join('')}</div><div class="fc-plot">${data?.error?'<p class="fc-empty">Не удалось загрузить активность</p>':svg(lines)}</div><div class="fc-labels" style="display:flex;justify-content:space-around">${periods.map(p=>`<span>${esc(p.label)}</span>`).join('')}</div><div class="fc-notes"><small>* Общая — сумма доступных источников. Нет истории — нет точки. Время: Алматы.</small></div><div class="fc-week-tasks">${statuses(data)}</div></article>`;
 }
 function details(index){
  if(!last)return;document.getElementById('productionDetail')?.remove();const d=document.createElement('div');d.id='productionDetail';d.className='money-ovl show';
  const p=last.periods[index];
  d.innerHTML=`<div class="money-modal"><div class="mm-h"><h3>Активность Производства${p?' · '+esc(p.label):''}</h3><button onclick="document.getElementById('productionDetail').remove()">×</button></div><div class="mm-b">${p?last.lines.map(l=>`<p>${l.name}: <b>${l.points[index].value??'Нет данных'}</b>${l.points[index].incomplete?' · неполные данные':''}</p>`).join(''):''}<style>.pa-devices{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:20px}.pa-device{min-width:0;border-bottom:1px solid var(--line-2);padding-bottom:12px}.pa-device h4{margin:8px 0}.pa-device-plot svg{display:block;width:100%;height:220px}.pa-device small{color:var(--text-3)}</style><div class="pa-devices">${deviceCharts(last.data,last.periods)}</div><p>Линии: общая — зелёная, Codex — синяя, Claude — оранжевая. Каждый компьютер учитывается отдельно; общая сумма объединяет их активность. Если одна история скопирована на разные компьютеры, она может учитываться повторно.</p><p>Считаются обращения пользователя к агентам в доступных журналах. Ответы инструментов, служебные события и вложенные агенты исключаются. Повторная синхронизация не увеличивает счётчики.</p><p>Обновление каждые 10 минут, пока компьютер включён. Облачные сессии учитываются только если их история доступна на компьютере. Текст сообщений не передаётся.</p></div></div>`;document.body.appendChild(d);
 }
 window.productionActivity={card,details,series,computers};
})();
