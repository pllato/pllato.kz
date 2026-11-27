const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderViewerKanban(host,{items,stages,selectedStage='',date,openCard}){
 const columns=stages.filter(s=>!selectedStage||String(s.id)===String(selectedStage)).slice().sort((a,b)=>(Number(a.sort)||0)-(Number(b.sort)||0));
 const ids=new Set(columns.map(s=>String(s.id)));
 for(const item of items)if(!ids.has(String(item.stageId))){columns.push({id:item.stageId,name:'Другой этап · '+(item.stageId||'Не указан')});ids.add(String(item.stageId));}
 const color=s=>/^#[\da-f]{3,8}$/i.test(s.color||'')?s.color:'#9099ab';
 host.innerHTML=columns.map(s=>{const rows=items.map((item,index)=>({item,index})).filter(({item})=>String(item.stageId)===String(s.id));return `<section class="av-column" style="--av-stage:${color(s)}" aria-label="${esc(s.name)}"><div class="av-column-head"><h2>${esc(s.name)}</h2><span aria-label="Сделок на странице">${rows.length}</span></div><div class="av-cards">${rows.length?rows.map(({item:d,index})=>`<button type="button" class="av-card" data-viewer-card="${index}" aria-label="Открыть карточку ${esc(d.name)}"><strong>${esc(d.name)}</strong><span class="av-phone">${esc(d.phone||'Телефон не указан')}</span>${d.trialLessonAt?`<time>Пробный · ${esc(date(d.trialLessonAt))}</time>`:''}<span class="av-owner">${esc(d.responsible||'Ответственный не назначен')}</span>${d.source?`<small title="Источник">${esc(d.source)}</small>`:''}</button>`).join(''):'<p class="av-empty">Нет заявок</p>'}</div></section>`;}).join('');
 host.onclick=e=>{const card=e.target.closest('[data-viewer-card]');if(card)openCard(Number(card.dataset.viewerCard));};
}
export function fitViewerKanban(host){
 if(host.hidden)return;
 host.style.setProperty('--av-height',Math.max(260,innerHeight-host.getBoundingClientRect().top-24)+'px');
}
