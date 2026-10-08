import {WEEK,weeksFrom,weekStart,columnName,planCalculator} from '../crm/worker/financial-model.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(v);
const date=t=>new Date(t+5*3600000).toISOString().slice(0,10);
const label=t=>new Date(t+5*3600000).toLocaleDateString('ru-RU',{timeZone:'UTC',day:'2-digit',month:'2-digit'});
let config,loading=false;
export async function initFinancialPlanning(options){
 config=options;if(loading)return;loading=true;
 const card=document.querySelector('[data-app-id="financial_planning"]');
 try{const a=await options.api('/financial-planning/access');card.dataset.allowed=String(a.allowed);card.querySelector('[data-plan-settings]').hidden=!a.admin;
 card.querySelector('[data-plan-open]').onclick=()=>openFinancialPlanning(options);
 card.querySelector('[data-plan-settings]').onclick=()=>openFinancialPlanning(options,true);
 }catch{card.dataset.allowed='false';}finally{loading=false;options.refresh();}
}
export async function openFinancialPlanning(options=config,settings=false){
 const dialog=document.createElement('dialog');dialog.className='fp-dialog';
 dialog.innerHTML='<header><div><small>7 Отделение — Админ</small><h2>Финансовое планирование</h2></div><button data-close aria-label="Закрыть">Закрыть ×</button></header><div class="fp-body">Загрузка…</div>';
 document.body.append(dialog);dialog.showModal();let data,dirty=false,busy=false;
 const body=dialog.querySelector('.fp-body');
 function close(){if(dirty&&!confirm('Есть несохранённые изменения. Закрыть без сохранения?'))return;dialog.close();dialog.remove();window.removeEventListener('beforeunload',unload);window.removeEventListener('resize',resize);}
 const resize=()=>{const selected=body.querySelector('[data-week]');if(selected)requestAnimationFrame(()=>go(+selected.value));};window.addEventListener('resize',resize);
 const unload=e=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',unload);
 dialog.querySelector('[data-close]').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 function status(text,error=false){const e=body.querySelector('[data-status]');if(e){e.textContent=text;e.classList.toggle('fp-error',error);}}
 async function load(){try{data=await options.api('/financial-planning');if(!dialog.isConnected)return;dirty=false;render();if(settings){settings=false;access();}}catch(e){body.innerHTML=`<p role="alert">${esc(e.message)}</p><button data-retry>Повторить</button>`;body.querySelector('button').onclick=load;}}
 function render(){
 const p=data.plan,weeks=weeksFrom(p.start),current=weekStart();
 body.innerHTML=`<div class="fp-toolbar"><button data-benchmark>Образец B</button><button data-current>Текущая неделя</button><button data-prev aria-label="Предыдущая неделя">←</button><select data-week aria-label="Выбрать неделю">${weeks.map(w=>`<option value="${w.start}"${w.start===current?' selected':''}>${label(w.start)}–${label(w.end)} · ${date(w.start).slice(0,4)}${w.start===current?' · текущая':''}</option>`).join('')}</select><button data-next aria-label="Следующая неделя">→</button><button data-refresh>Обновить</button>${data.editable?'<button data-add>+ Статья</button><button data-save class="fp-primary">Сохранить</button>':''}${data.admin?'<button data-access>Настройки доступа</button>':''}<span data-status role="status">${data.editable?'Все изменения сохранены':'Только просмотр'}</span></div>
 <details class="fp-help"><summary>Как работать с таблицей</summary><p>Неделя: четверг 14:00 → четверг 14:00, Алматы. Нажмите ячейку для ввода. Столбец B — показательный (образец); ставка налога из B применяется ко всем неделям, если не задана своя. Доход и выплаты обновляются из проектов по кнопке «Обновить» и при открытии.</p><p>Формулы: <code>=R1*3%</code> — 3% дохода этой недели; <code>=C1-C2</code>; <code>=SUM(R4:R5)</code>. R — текущий столбец, B — образец, C и далее — конкретные недели. Суммируемые ручные статьи указывайте в ₸. В строке налога вводите ставку, например 3 (это 3%).</p><p>Чистая прибыль = доход + ручные доходы − оплаченные выплаты − ручные расходы − налоги. Остаток дополнительно вычитает плановые выплаты. Справа от суммы — доля от дохода кассы. Выплаты без времени относятся к 00:00 указанной даты: четверг входит в заканчивающуюся неделю.</p></details><div data-editor></div>
 <div class="fp-scroll" tabindex="0" aria-label="Недельная финансовая таблица"><table><thead><tr><th>Статья / единица</th><th class="fp-benchmark">B · Показательный</th>${weeks.map((w,i)=>`<th data-start="${w.start}" class="${w.start===current?'fp-current':''}"><small>${columnName(i+2)} · ${date(w.start).slice(0,4)}${w.start===current?' · сейчас':''}</small>${label(w.start)}–${label(w.end)}</th>`).join('')}</tr></thead><tbody>${p.rows.map((r,i)=>`<tr class="fp-kind-${r.kind}"><th><div class="fp-row-title"><small>${i+1}</small><button data-row="${i}" title="${esc(r.name)}${['income','paid','planned','payoutPaid','payoutPlanned'].includes(r.kind)?' · автоматически':''}"${data.editable?'':' disabled'}>${esc(r.name)}</button><small>${r.kind==='tax'?'% / ₸':esc(r.unit)}</small></div></th>${Array.from({length:53},(_,c)=>`<td class="${c===0?'fp-benchmark':p.start+(c-1)*WEEK===current?'fp-current':''}"><button data-cell="${i}:${c}"></button></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 updateCells();
 body.querySelector('[data-benchmark]').onclick=()=>{body.querySelector('.fp-scroll').scrollLeft=0;};
 body.querySelector('[data-current]').onclick=()=>go(current);
 body.querySelector('[data-week]').onchange=e=>go(+e.target.value);
 body.querySelector('[data-prev]').onclick=()=>go(+body.querySelector('[data-week]').value-WEEK);
 body.querySelector('[data-next]').onclick=()=>go(+body.querySelector('[data-week]').value+WEEK);
 body.querySelector('[data-refresh]').onclick=()=>{if(!dirty||confirm('Обновить и отменить несохранённые изменения?'))load();};
 body.querySelector('[data-save]')?.addEventListener('click',save);
 body.querySelector('[data-add]')?.addEventListener('click',()=>rowEditor());
 body.querySelector('[data-access]')?.addEventListener('click',access);
 body.querySelectorAll('[data-row]').forEach(b=>b.onclick=()=>rowEditor(+b.dataset.row));
 body.querySelectorAll('[data-cell]').forEach(b=>b.onclick=()=>editCell(...b.dataset.cell.split(':').map(Number)));
 requestAnimationFrame(()=>go(current));
 }
 function go(start){const select=body.querySelector('[data-week]');if(![...select.options].some(o=>+o.value===start))return;select.value=String(start);const scroll=body.querySelector('.fp-scroll'),th=scroll.querySelector(`[data-start="${start}"]`);scroll.scrollLeft+=th.getBoundingClientRect().left-scroll.getBoundingClientRect().left-scroll.querySelector('th').offsetWidth-1;}
 function updateCells(){const p=data.plan,calc=planCalculator(p,data.income,data.payouts);
 body.querySelectorAll('[data-cell]').forEach(b=>{const [r,c]=b.dataset.cell.split(':').map(Number),row=p.rows[r];try{const v=calc(r,c),gross=c?data.income[c-1]:calc(0,0);const share=c&&gross?money(v/gross*100)+'%':'';
 b.innerHTML=`<strong>${money(v)}${row.unit==='%'&&row.kind!=='tax'?'%':''}</strong><small>${esc(share||' ')}</small>`;b.classList.remove('fp-error');b.setAttribute('aria-label',columnName(c+1)+(r+1)+' · '+row.name+' · '+money(v));b.title=c&&['paid','planned','payoutPaid','payoutPlanned'].includes(row.kind)?'Посмотреть выплаты':'Изменить ячейку';
 }catch(e){b.textContent='Ошибка формулы';b.classList.add('fp-error');b.title=e.message;}});
 }
 function changed(){dirty=true;status('Есть несохранённые изменения');updateCells();}
 function editCell(r,c){const p=data.plan,row=p.rows[r],slot=body.querySelector('[data-editor]');
 if(c&&['paid','planned','payoutPaid','payoutPlanned'].includes(row.kind)){const start=p.start+(c-1)*WEEK;const entries=data.payoutDetails.filter(e=>e.status===(row.kind==='payoutPaid'?'paid':row.kind==='payoutPlanned'?'planned':row.kind)&&(!row.sourceRole||(e.role||'Прочие выплаты')===row.sourceRole)&&Date.parse(e.date+'T00:00:00+05:00')>=start&&Date.parse(e.date+'T00:00:00+05:00')<start+WEEK);slot.innerHTML=`<div class="fp-editor"><strong>${esc(row.name)} · ${label(start)}</strong><button data-cancel>Закрыть</button><div class="fp-details">${entries.map(e=>`<p>${esc(e.recipient)} · ${esc(e.role)} — <b>${money(e.amount)} ₸</b><small>${esc(e.projectId)} · ${esc(e.date)}</small></p>`).join('')||'<p>Выплат за неделю нет.</p>'}</div></div>`;slot.querySelector('button').onclick=()=>slot.replaceChildren();return;}
 if(!data.editable||c&&['income','profit','forecast'].includes(row.kind))return;
 const savedTop=body.querySelector('.fp-scroll').scrollTop;
 const key=c?String(p.start+(c-1)*WEEK):'benchmark',raw=p.cells[row.id]?.[key]??'';
 slot.innerHTML=`<form class="fp-editor fp-cell-editor"><label>${columnName(c+1)}${r+1} · ${esc(row.name)}${row.kind==='tax'?' · ставка, %':''}<input name="value" autocomplete="off" maxlength="500" value="${esc(raw)}" placeholder="Число или =R1*3%"></label><button class="fp-primary">Применить</button><button type="button" data-cancel>Отмена</button><span data-cell-error role="alert"></span></form>`;
 const f=slot.querySelector('form');f.querySelector('[data-cancel]').onclick=()=>slot.replaceChildren();f.onsubmit=e=>{e.preventDefault();const next=f.elements.value.value.trim();const old=p.cells[row.id];p.cells[row.id]={...old,[key]:next};try{planCalculator(p,data.income,data.payouts)(r,c);changed();slot.replaceChildren();body.querySelector('.fp-scroll').scrollTop=savedTop;}catch(err){if(old)p.cells[row.id]=old;else delete p.cells[row.id];f.querySelector('[data-cell-error]').textContent=err.message;}};f.elements.value.focus();
 }
 function rowEditor(index){if(!data.editable)return;const row=data.plan.rows[index],system=row&&['income','paid','planned','profit','forecast','payoutPaid','payoutPlanned'].includes(row.kind);const slot=body.querySelector('[data-editor]');slot.innerHTML=`<form class="fp-editor"><label>Наименование<input name="name" maxlength="160" required value="${esc(row?.name||'')}"></label><label>Тип статьи<select name="kind"${system?' disabled':''}>${(system?[row.kind]:['expense','extraIncome','tax','formula']).map(k=>`<option value="${k}">${esc({expense:'Расход',extraIncome:'Доход вручную',tax:'Налог · % от дохода',formula:'Расчётная строка (не входит в прибыль)'}[k]||'Автоматический расчёт')}</option>`).join('')}</select></label><label>Единица<select name="unit"><option>₸</option><option>%</option></select></label><button>Применить</button><button type="button" data-cancel>Отмена</button></form>`;
 const f=slot.querySelector('form');f.elements.kind.value=row?.kind||'expense';f.elements.unit.value=row?.unit||'₸';f.querySelector('[data-cancel]').onclick=()=>slot.replaceChildren();f.onsubmit=e=>{e.preventDefault();const kind=f.elements.kind.value;const next={...row,id:row?.id||crypto.randomUUID(),name:f.elements.name.value,kind,unit:kind==='tax'?'%':kind==='formula'?f.elements.unit.value:'₸'};if(row)data.plan.rows[index]=next;else data.plan.rows.push(next);const left=body.querySelector('.fp-scroll').scrollLeft;render();requestAnimationFrame(()=>{body.querySelector('.fp-scroll').scrollLeft=left;});changed();};f.elements.name.focus();
 }
 async function save(){if(busy)return;busy=true;body.inert=true;const b=body.querySelector('[data-save]');b.disabled=true;status('Сохраняю…');try{
 const calc=planCalculator(data.plan,data.income,data.payouts);data.plan.rows.forEach((_,r)=>{for(let c=0;c<53;c++)calc(r,c);});
 const result=await options.api('/financial-planning',{method:'PUT',body:{revision:data.plan.revision,rows:data.plan.rows,cells:data.plan.cells}});data.plan.revision=result.revision;dirty=false;status('Сохранено');
 }catch(e){status(e.message,true);}finally{busy=false;body.inert=false;b.disabled=false;}}
 async function access(){if(!data.admin)return;if(dirty){status('Сначала сохраните таблицу',true);return;}const slot=body.querySelector('[data-editor]');slot.innerHTML='<p>Загружаю сотрудников…</p>';
 try{const payload=await options.api('/users/list');const users=Array.isArray(payload)?payload:Array.isArray(payload.users)?payload.users:Object.values(payload.users||{});const people=new Map(users.filter(u=>u.email).map(u=>[u.email.toLowerCase(),u]));data.plan.viewers.forEach(email=>{if(!people.has(email))people.set(email,{email});});
 slot.innerHTML=`<form class="fp-editor fp-access"><h3>Кто видит и открывает финансовое планирование</h3><p>Владелец имеет постоянный доступ. Все остальные — только из этого списка, в том числе администраторы. Доступ открывает общий доход и выплаты всех проектов.</p><div class="fp-people">${[...people].map(([email,u])=>`<label><span>${esc(u.name||email)}<small>${esc(email)}</small></span><select data-email="${esc(email)}"><option value="none">Нет доступа</option><option value="view"${data.plan.viewers.includes(email)&&!data.plan.editors.includes(email)?' selected':''}>Просмотр</option><option value="edit"${data.plan.editors.includes(email)?' selected':''}>Редактирование</option></select></label>`).join('')}</div><button>Сохранить доступ</button><button type="button" data-cancel>Закрыть</button><span role="alert"></span></form>`;
 const f=slot.querySelector('form');f.querySelector('[data-cancel]').onclick=()=>slot.replaceChildren();f.onsubmit=async e=>{e.preventDefault();const selects=[...f.querySelectorAll('[data-email]')],viewers=selects.filter(s=>s.value!=='none').map(s=>s.dataset.email),editors=selects.filter(s=>s.value==='edit').map(s=>s.dataset.email);f.querySelector('button').disabled=true;try{const res=await options.api('/financial-planning/access',{method:'PUT',body:{revision:data.plan.revision,viewers,editors}});Object.assign(data.plan,{revision:res.revision,viewers,editors});slot.replaceChildren();status('Доступ сохранён');}catch(err){f.querySelector('[role=alert]').textContent=err.message;f.querySelector('button').disabled=false;}};
 }catch(e){slot.innerHTML=`<p role="alert">${esc(e.message)}</p>`;}}
 await load();
}
