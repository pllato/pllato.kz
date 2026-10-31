
const SC={};
const SO=k=>SST[k]||SST.booked;
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const dot=c=>`<i class="hd-dot" style="background:${c}"></i>`;
const span=s=>[tm(s.t),tm(s.t)+SVC[s.k].d];
const busyAt=(hid,t,d,skip)=>SLOTS.some(s=>s.id!==skip&&s.st!=='cancel'&&s.h.includes(hid)&&tm(s.t)<tm(t)+d&&tm(t)<span(s)[1]);
function freeHorses(t,d,lv){return HORSES.filter(h=>h.st==='work'&&h.own==='club'&&lv.includes(h.lvl)&&!busyAt(h.id,t,d)&&hLoad(h.id)<h.max)}
const lvlFor=k=>k==='kid'?['pony']:k==='walk'||k==='walk2'?['beg','mid']:k==='grp'?['beg','mid']:['mid','pro','beg'];
function horseChip(id){const h=HO(id);return `<span class="hchip" onclick="event.stopPropagation();openHorse('${h.id}')"><i style="background:${h.c}"></i>${esc(h.n)}</span>`}

/* ===== Пульт дня ===== */
SC.today=()=>{
 const act=SLOTS.filter(s=>s.st!=='cancel');const rid=act.reduce((a,s)=>a+riders(s),0);
 const inW=HORSES.filter(h=>h.st==='work').length;const used=new Set();act.forEach(s=>s.h.forEach(x=>used.add(x)));
 const sum=act.reduce((a,s)=>a+(s.w?slotSum(s):0),0)+PAYS.reduce((a,p)=>a+p.sum,0);
 const low=CLIENTS.filter(c=>c.left<=1&&c.sub);const now=act.filter(s=>s.st==='in');const next=act.filter(s=>s.st==='booked').slice(0,6);
 const al=[
  ['r',`Ветер — хромота слева`,'Только шаг до осмотра 02.11. Система уже не даёт поставить его на занятия.','horse','H10'],
  ['w',`${WAIT.length} ${plural(WAIT.length,['всадник','всадника','всадников'])} в листе ожидания`,'Освободится место — первому в очереди уйдёт предложение в приложение.','wait',''],
  ['w',`${low.length} ${plural(low.length,['абонемент','абонемента','абонементов'])} на последнем занятии или закончились`,low.map(c=>c.n.split(' ')[0]).join(', ')+' — пора предложить продление.','subs',''],
  ['i',`${CONTRACTS.filter(c=>c.st!=='signed').length} договора ждут подписи`,'Ссылка на подпись ушла в WhatsApp — без подписи первое занятие не начнётся.','contracts',''],
  ['i',`${LEADS.filter(l=>l.st==='new').length} новые заявки из таргета и Instagram`,'Ответить в течение 15 минут — дальше конверсия падает вдвое.','leads',''],
  ['r',`Долги: ${tg(DEBTS.reduce((a,d)=>a+d.sum,0))}`,DEBTS.map(d=>d.who.split(' ')[0]).join(', '),'cash','']
 ];
 return `<div class="hd"><div><h2>Суббота, 31 октября</h2><p>Всё, что происходит в клубе сегодня: кто в седле прямо сейчас, кто следующий, какие лошади отработали и что требует решения. Администратору не нужно держать это в голове и в WhatsApp.</p></div><div class="btns"><button class="bt" onclick="go('sched')">Расписание</button><button class="bt p" onclick="card('newslot','A1|16:00')">+ Запись</button></div></div>
 <div class="wid">
  <div><small>Занятий сегодня</small><b class="a">${act.length}</b><span>${act.filter(s=>s.src==='app').length} записались сами в приложении</span></div>
  <div><small>Всадников</small><b>${rid}</b><span>с прогулками и детьми</span></div>
  <div><small>Лошадей задействовано</small><b class="g">${used.size} из ${inW}</b><span>${HORSES.length-inW} отдыхают или у ветеринара</span></div>
  <div><small>Свободных мест</small><b class="i">${freeSeats()}</b><span>на сегодня, с учётом нагрузки лошадей</span></div>
  <div><small>Оплачено сегодня</small><b>${tg(PAYS.reduce((a,p)=>a+p.sum,0))}</b><span>${PAYS.length} ${plural(PAYS.length,['оплата','оплаты','оплат'])}, из них по ссылке Kaspi — ${PAYS.filter(p=>p.m==='Kaspi').length}</span></div>
 </div>
 <div class="g21"><div>
  <div class="pan"><h3>Сейчас в седле · ${now.length}</h3><p>Отметка «пришёл» ставится в телефоне тренера — занятие списывается с абонемента само.</p>
   ${now.map(s=>slotRow(s)).join('')||'<p class="mini">Сейчас занятий нет.</p>'}</div>
  <div class="pan"><h3>Дальше по расписанию</h3>${next.map(s=>slotRow(s)).join('')}<button class="bt sm" style="margin-top:8px" onclick="go('sched')">Всё расписание →</button></div>
 </div><div>
  <div class="pan"><h3>Требует решения</h3>${al.map(a=>`<div class="al ${a[0]}" onclick="${a[3]==='horse'?`openHorse('${a[4]}')`:`go('${a[3]}')`}"><b>${esc(a[1])}</b><span>${esc(a[2])}</span></div>`).join('')}</div>
  <div class="pan"><h3>Лошади сегодня</h3><p>Сколько занятий отработала каждая из допустимого. Красная полоса — дошла до предела.</p>${HORSES.filter(h=>h.own==='club').slice(0,10).map(h=>hLoadRow(h)).join('')}<button class="bt sm" style="margin-top:6px" onclick="go('horses')">Вся конюшня →</button></div>
 </div></div>`};
function freeSeats(){let n=0;['11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'].forEach(t=>{n+=Math.min(3,freeHorses(t,60,['beg','mid','pro']).length)});return n}
function slotRow(s){const tr=TR(s.tr);return `<div class="srow2" onclick="card('slot','${s.id}')"><span class="st-t">${s.t}</span><div class="st-b"><b>${esc(SVC[s.k].n)}</b><span>${esc(slotWho(s))}</span><div class="st-h">${s.h.map(horseChip).join('')}</div></div><div class="st-r">${tag(SO(s.st).n,SO(s.st).c)}<small>${esc(tr.s)} · ${esc(AR(s.ar).n)}</small></div></div>`}
function hLoadRow(h){const n=hLoad(h.id);const w=Math.min(100,pct(n,h.max));return `<div class="hl" onclick="openHorse('${h.id}')"><span><i style="background:${h.c}"></i>${esc(h.n)}<small>${LVL[h.lvl].n}</small></span><div class="bar"><i class="${n>=h.max?'r':n?'g':''}" style="--w:${w||3}%"></i></div><b>${n} / ${h.max}</b></div>`}

/* ===== Расписание ===== */
let schedView='arena',schedDay=TODAY;
const HOURS=['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];
SC.sched=()=>{
 const days=[0,1,2,3,4,5,6,7].map(i=>addDays(TODAY,i));
 const isT=schedDay===TODAY;
 const rows=schedView==='arena'?ARENAS.map(a=>({id:a.id,n:a.n,sub:a.st==='soon'?'с 7 ноября':`до ${a.cap} всадников`,soon:a.st==='soon'})):HORSES.map(h=>({id:h.id,n:h.n,sub:LVL[h.lvl].n+' · '+hLoad(h.id)+'/'+h.max,c:h.c,off:h.st!=='work'}));
 const list=isT?SLOTS.filter(s=>s.st!=='cancel'):fakeDay(schedDay);
 const cell=(r,t)=>{const here=list.filter(s=>s.t===t&&(schedView==='arena'?s.ar===r.id:s.h.includes(r.id)));
  if(here.length)return `<td>${here.map(s=>`<div class="blk k-${s.k} ${s.st}" ${isT?`onclick="card('slot','${s.id}')"`:''}><b>${esc(SVC[s.k].n.split(' · ')[0])}</b><span>${esc(slotWho(s))}</span><em>${schedView==='arena'?s.h.map(x=>HO(x).n).join(', '):AR(s.ar).n}</em></div>`).join('')}</td>`;
  if(r.soon||r.off)return `<td class="off"></td>`;
  return `<td class="free" ${isT&&schedView==='arena'?`onclick="card('newslot','${r.id}|${t}')"`:''}></td>`};
 return `<div class="hd"><div><h2>Расписание манежей</h2><p>Одна сетка для приложения, администратора и тренеров. Запись видна сразу везде — двойной записи на одну лошадь или в переполненный манеж система не допустит. ${schedView==='horse'?'Вид «по лошадям» — для конюха: какую лошадь к какому часу седлать.':''}</p></div><div class="btns"><div class="seg"><button class="${schedView==='arena'?'on':''}" onclick="schedView='arena';render()">По площадкам</button><button class="${schedView==='horse'?'on':''}" onclick="schedView='horse';render()">По лошадям</button></div><button class="bt p" onclick="card('newslot','A1|16:00')">+ Запись</button></div></div>
 <div class="dsel">${days.map((d,i)=>`<button class="${d===schedDay?'on':''} ${i===7?'lock':''}" onclick="${i===7?`toast('Запись на ${dd(d)} откроется в ${DOWF(addDays(d,-7))} в 00:00 — одинаково для приложения и администратора. Правило — в разделе «Правила записи».')`:`schedDay='${d}';render()`}"><small>${dow(d)}</small><b>${dd(d)}</b><span>${i===7?'откроется завтра':i===0?'сегодня':fakeDay(d).length+' занятий'}</span></button>`).join('')}</div>
 <div class="tw sched"><table class="gridt"><thead><tr><th class="rh">${schedView==='arena'?'Площадка':'Лошадь'}</th>${HOURS.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr class="${r.soon||r.off?'dim':''}"><th class="rh">${r.c?`<i class="hd-dot" style="background:${r.c}"></i>`:''}<b>${esc(r.n)}</b><small>${esc(r.sub)}</small></th>${HOURS.map(t=>cell(r,t)).join('')}</tr>`).join('')}</tbody></table></div>
 <div class="legend">${Object.entries({ind:'индивидуальное',grp:'группа',kid:'дети · пони',walk:'прогулка',photo:'фотосессия'}).map(([k,n])=>`<span><i class="k-${k}"></i>${n}</span>`).join('')}<span><i class="free"></i>свободно — нажмите, чтобы записать</span></div>
 ${said('«Открывается запись за неделю вперёд… люди писали напрямую менеджеру — запишите нас на субботу, и их записывали. Я ругал: тогда приложение не будет работать.»','Правило «запись открывается за 7 дней» действует одинаково в приложении и у администратора. Обойти его может только руководитель — и это видно в журнале.')}`};
function fakeDay(d){const n=daysBetween(TODAY,d);if(n<=0)return [];const base=SLOTS.filter(s=>s.k!=='photo');return base.filter((s,i)=>(i+n)%4!==0).map((s,i)=>Object.assign({},s,{id:'F'+n+i,st:'booked',t:HOURS[(HOURS.indexOf(s.t)+n)%HOURS.length]}))}

/* ===== Прогулки и компании ===== */
let walkN=4,walkKids=1,walkLong=false,walkT='14:00';
SC.walks=()=>{
 const W=SLOTS.filter(s=>s.w);const k=walkLong?'walk2':'walk';const d=SVC[k].d;
 const hs=freeHorses(walkT,d,['beg','mid']);const pony=freeHorses(walkT,d,['pony']);
 const need=walkN-walkKids;const pick=hs.slice(0,need).concat(pony.slice(0,walkKids));const ok=pick.length>=walkN;
 const instr=Math.ceil(walkN/5);const sum=SVC[k].p*walkN;
 return `<div class="hd"><div><h2>Прогулки и компании</h2><p>Заказчик — один человек с телефоном. Остальные — просто количество: взрослые и дети. Не нужно заводить «виртуальных клиентов» на каждого гостя. Лошадей и инструкторов система подбирает сама — по уровню, по свободному времени и по нагрузке за день.</p></div></div>
 <div class="g21"><div class="pan"><h3>Новая прогулка</h3><p>Попробуйте поменять количество людей или время — подбор пересчитается.</p>
  <div class="wform"><label>Заказчик<input id="wk_n" value="Тимур Ахмедов"></label><label>Телефон<input id="wk_p" value="+7 777 410 63 92"></label>
  <label>Сколько человек<div class="stp"><button onclick="walkN=Math.max(1,walkN-1);walkKids=Math.min(walkKids,walkN);render()">−</button><b>${walkN}</b><button onclick="walkN=Math.min(12,walkN+1);render()">+</button></div></label>
  <label>Из них детей до 10 лет<div class="stp"><button onclick="walkKids=Math.max(0,walkKids-1);render()">−</button><b>${walkKids}</b><button onclick="walkKids=Math.min(walkN,walkKids+1);render()">+</button></div></label>
  <label>Длительность<div class="seg"><button class="${!walkLong?'on':''}" onclick="walkLong=false;render()">1 час</button><button class="${walkLong?'on':''}" onclick="walkLong=true;render()">2 часа</button></div></label>
  <label>Время<select onchange="walkT=this.value;render()">${['11:00','13:00','14:00','15:00','16:00'].map(t=>`<option ${t===walkT?'selected':''}>${t}</option>`).join('')}</select></label></div>
  <div class="pick ${ok?'':'bad'}"><div><small>Лошади</small>${pick.map(h=>horseChip(h.id)).join('')||'—'}${ok?'':`<p>Свободно только ${pick.length} из ${walkN} — предложите ${walkT==='16:00'?'15:00':'16:00'} или поставьте в лист ожидания.</p>`}</div>
   <div><small>Инструкторы</small><b>${instr} · ${instr>1?'Руслан К. и Ерболат Ж.':'Ерболат Ж.'}</b><span>один на пятерых всадников</span></div>
   <div><small>Сумма</small><b>${tg(sum)}</b><span>${walkN} × ${tg(SVC[k].p)} · предоплата 50% по ссылке Kaspi</span></div></div>
  <div class="btns" style="justify-content:flex-start;margin-top:10px"><button class="bt p" onclick="${ok?'newWalk()':`toast('Не хватает лошадей на это время — система не даст записать больше, чем есть.')`}">Записать и отправить ссылку на оплату</button></div></div>
 <div class="pan"><h3>Как было в Fitbase</h3>${[['Компания из 4 человек','заводили заказчика и трёх «тестовых клиентов»'],['Виртуальные клиенты','засоряют базу и отчёты о новых всадниках'],['Подбор лошадей','вручную, по памяти администратора']].map(x=>`<div class="kv"><span>${x[0]}</span><b class="wrapb">${x[1]}</b></div>`).join('')}
  <h3 style="margin-top:14px">Как здесь</h3>${[['Заказчик','одна карточка с телефоном'],['Гости','количество взрослых и детей'],['Лошади','подбираются по уровню и нагрузке'],['Оплата','ссылка Kaspi — в WhatsApp заказчику']].map(x=>`<div class="kv"><span>${x[0]}</span><b class="wrapb">${x[1]}</b></div>`).join('')}</div></div>
 <div class="pan"><h3>Прогулки и фотосессии сегодня</h3><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Заказчик</th><th class="r">Людей</th><th>Лошади</th><th>Инструктор</th><th>Оплата</th><th>Откуда</th></tr></thead><tbody>${W.map(s=>`<tr onclick="card('slot','${s.id}')"><td class="mono">${s.t}</td><td><b>${esc(s.w.who)}</b><div class="mini">${esc(SVC[s.k].n)}</div></td><td class="r">${s.w.n}${s.w.kids?` <span class="mini">· ${s.w.kids} реб.</span>`:''}</td><td>${s.h.map(horseChip).join('')}</td><td>${esc(TR(s.tr).s)}</td><td class="mini">${esc(s.w.paid)}</td><td>${tag(SRCN[s.src])}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('«Если вы записываете четверых — компания хочет на прогулку — мы должны были записать заказчика, а остальных прописывать… Мы начали делать тестовых клиентов.»')}`};
function newWalk(){const k=walkLong?'walk2':'walk';const d=SVC[k].d;const hs=freeHorses(walkT,d,['beg','mid']).slice(0,walkN-walkKids).concat(freeHorses(walkT,d,['pony']).slice(0,walkKids));
 SKN++;SLOTS.push({id:'S'+SKN,t:walkT,k,w:{who:document.getElementById('wk_n').value,ph:document.getElementById('wk_p').value,n:walkN,kids:walkKids,paid:'ссылка на предоплату отправлена'},h:hs.map(h=>h.id),tr:'T5',ar:'A5',st:'booked',src:'admin'});
 SLOTS.sort((a,b)=>tm(a.t)-tm(b.t));render();toast(`Прогулка в ${walkT} записана: ${walkN} ${plural(walkN,['человек','человека','человек'])}, лошади закреплены. Заказчику ушли в WhatsApp время, адрес и ссылка на предоплату.`)}
