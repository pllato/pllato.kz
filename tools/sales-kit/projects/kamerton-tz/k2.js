
/* ===== Общие ===== */
const SC={};
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const depm=k=>`<span class="depm" style="--c:${DEPS[k].c}">${esc(DEPS[k].n)}</span>`;
const stm=(o,k)=>{const s=o[k]||{n:k,c:'#888'};return `<span class="st" style="--sc:${s.c}">${esc(s.n)}</span>`};
const cst=k=>{const s=CSTOF(k);return `<span class="st" style="--sc:${s.c}">${esc(s.n)}</span>`};
const ptL=id=>PT(id)?`<a class="lk" onclick="event.stopPropagation();openPat('${id}')">${esc(PT(id).n.split(' ').slice(0,2).join(' '))}</a>`:'—';
const bar=(v,c)=>`<span class="pbar"><i style="width:${Math.max(0,Math.min(100,v))}%;background:${c||'var(--brand)'}"></i></span>`;
const meDoc=()=>ROLES[role].doc||null;
function openPat(id){if(!PT(id))return;curPat=id;if(allowed('card')){if(cur!=='card')go('card');else render()}else card('pat',id)}
function setAppt(id,st){const a=APPTS.find(x=>x.id===id);if(!a)return;a.st=st;render();if(document.getElementById('mbg').classList.contains('show'))card('appt',id);
 toast({wait:`${esc(apN(a))} в холле — врач видит отметку у себя.`,in:`${esc(apN(a))} на приёме у ${esc(DOC(a.doc).s)}.`,done:`Приём завершён. ${a.p&&planOf(a.p)?'План лечения уже в отделе заботы — напоминания пойдут сами.':'Если врач назначит курс, он сразу уйдёт в отдел заботы.'}`,noshow:'Отмечено «не пришёл» — администратору задача перезаписать, пациенту сообщение в кабинет.'}[st])}

/* ===== Пульт клиники ===== */
SC.today=()=>{const A=APPTS,done=A.filter(a=>a.st==='done').length,inn=A.filter(a=>a.st==='in'||a.st==='wait').length,ns=A.filter(a=>a.st==='noshow').length;
 const rev=PAYS.reduce((s,p)=>s+p[4],0),rd=REMS.filter(r=>r.st==='done').length,rsent=REMS.filter(r=>r.st!=='plan').length;
 const AL=[];
 PATIENTS.filter(p=>p.stage==='risk').forEach(p=>AL.push(['r',`${esc(p.n.split(' ').slice(0,2).join(' '))} пропускает план`,`${esc(p.dx)} · 3 дня без отметки «сделал» — позвонить`,`openPat('${p.id}')`]));
 REMS.filter(r=>r.st==='nores').forEach(r=>AL.push(['w',`Нет ответа: ${esc(PT(r.p).n.split(' ').slice(0,2).join(' '))}`,`${esc(r.txt)} · отдел заботы перезвонит`,`go('remind')`]));
 A.filter(a=>a.st==='noshow').forEach(a=>AL.push(['w',`Не пришёл: ${esc(apN(a))}`,`${a.t} · ${esc(DOC(a.doc).s)} — перезаписать`,`card('appt','${a.id}')`]));
 PATIENTS.filter(p=>p.stage==='chronic'&&(!p.next||daysBetween(TODAY,p.next)<0)&&daysBetween(p.last,TODAY)>365).forEach(p=>AL.push(['i',`Пора на контроль: ${esc(p.n.split(' ').slice(0,2).join(' '))}`,`Последняя проверка ${dl(p.last)} — пригласить, предложить трансфер`,`go('chronic')`]));
 FEED.filter(f=>f.st==='work').forEach(f=>AL.push(['w',`Отзыв ${f.nps}/10 · ${esc(f.pn||PT(f.p).n)}`,esc(f.txt),`go('feedback')`]));
 ORDERS.filter(o=>o.st==='sign').forEach(o=>AL.push(['b',`Приказ ${esc(o.no)} ждёт подписи`,esc(o.t),`card('ord','${o.no}')`]));
 LEADS.filter(l=>l.st==='think').forEach(l=>AL.push(['i',`Думает: ${esc(l.n)}`,`${esc(l.want)} · ${esc(l.why||'')}`,`go('funnel')`]));
 return `<div class="hd"><div><h2>Пульт клиники · четверг, 1 октября, ${NOW}</h2><p>Все отделения на одном экране: кто сейчас на приёме, кто ждёт, кто не пришёл, как пациенты выполняют лечение дома, что требует решения руководителя.</p></div><div class="btns"><button class="bt" onclick="go('dash')">Дашборд</button><button class="bt p" onclick="card('newappt')">+ Запись</button></div></div>
 <div class="wid"><div><small>Записей сегодня</small><b>${A.length}</b><span>принято ${done} · в клинике ${inn}</span></div><div><small>Не пришли</small><b class="r">${ns}</b><span>доходимость ${pct(A.length-ns-A.filter(a=>a.st==='plan').length,A.length-A.filter(a=>a.st==='plan').length)}%</span></div><div><small>Касса сегодня</small><b class="a">${tg(rev)}</b><span>${PAYS.length} оплат</span></div><div><small>Напоминания</small><b class="g">${rd} / ${rsent}</b><span>отметили «сделал»</span></div><div><small>Трансфер</small><b>${TRIPS.length}</b><span>поездок · машина в пути</span></div></div>
 <div class="docsnow">${DOCS.map(d=>{const L=A.filter(a=>a.doc===d.id),now=L.find(a=>a.st==='in'),wt=L.filter(a=>a.st==='wait'),nx=L.find(a=>a.st==='plan');return `<div class="dn" style="--c:${DEPS[d.dep].c}" onclick="schDoc='${d.id}';go('schedule')"><small>${esc(DEPS[d.dep].n)} · ${esc(d.room)}</small><b>${esc(d.s)}</b><div class="dnr ${now?'on':''}"><span>Сейчас</span><em>${now?esc(apN(now))+' · '+now.t:'свободен'}</em></div><div class="dnr"><span>В холле</span><em>${wt.length?wt.map(a=>esc(apN(a))).join(', '):'—'}</em></div><div class="dnr"><span>Далее</span><em>${nx?nx.t+' · '+esc(apN(nx)):'—'}</em></div><i>${L.filter(a=>a.st==='done').length} / ${L.length}</i></div>`}).join('')}</div>
 <div class="g21"><div class="pan"><h3>Требует внимания · ${AL.length}</h3><p>Система сама собирает то, что сейчас теряется между WhatsApp, Excel и памятью администратора.</p>${AL.slice(0,9).map(a=>`<div class="al ${a[0]}" onclick="${a[3]}"><b>${a[1]}</b><span>${a[2]}</span></div>`).join('')}</div>
 <div><div class="pan"><h3>Пациенты сегодня</h3>${[['Новые (первый визит)',A.filter(a=>a.svc.indexOf('Первичная')===0||a.svc.indexOf('Аудиометрия')===0).length],['Действующие (курс, контроль)',A.filter(a=>a.p&&PT(a.p)).length],['Операции',A.filter(a=>DOC(a.doc).dep==='hir'&&a.dur>=60).length],['С трансфером',TRIPS.filter(t=>t.to.indexOf('обратно')<0).length]].map(x=>`<div class="kv"><span>${x[0]}</span><b class="mono">${x[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Забота за неделю</h3>${[['Курсов идёт',PLANS.length],['Средняя дисциплина',Math.round(PLANS.reduce((s,l)=>s+adh(l),0)/PLANS.length)+'%'],['Повторных визитов записано',14],['Вернули на контроль',6]].map(x=>`<div class="kv"><span>${x[0]}</span><b class="mono">${x[1]}</b></div>`).join('')}<button class="bt" style="margin-top:10px" onclick="go('carefunnel')">Отдел заботы →</button></div></div></div>
 ${said('«Соединить все отделы в одной системе не можем — это, наверное, боль всех организаций.»','Здесь администратор, врачи, забота, продажи и руководитель работают в одной системе — каждый видит своё.')}`};

/* ===== Расписание ===== */
let schDoc='all',schDep='all';
const SLOTS=[];for(let h=9;h<18;h++){SLOTS.push(String(h).padStart(2,'0')+':00');SLOTS.push(String(h).padStart(2,'0')+':30')}
const slotIx=t=>SLOTS.indexOf(t);
SC.schedule=()=>{let D=DOCS.filter(d=>schDep==='all'||d.dep===schDep);if(meDoc())D=D.filter(d=>d.id===meDoc());else if(schDoc!=='all')D=D.filter(d=>d.id===schDoc);
 return `<div class="hd"><div><h2>Расписание врачей · ${dow(TODAY)}, ${dl(TODAY)}</h2><p>Сетка по кабинетам и врачам. Цвет — статус: записан, ждёт в холле, на приёме, принят, не пришёл. Отметка «пришёл» видна врачу сразу; после приёма назначения уходят в отдел заботы.</p></div><div class="btns"><button class="bt p" onclick="card('newappt')">+ Запись</button></div></div>
 ${meDoc()?'':`<div class="filt"><button class="${schDep==='all'&&schDoc==='all'?'on':''}" onclick="schDep='all';schDoc='all';render()">Все врачи</button>${Object.keys(DEPS).filter(k=>k!=='care').map(k=>`<button class="${schDep===k?'on':''}" onclick="schDep='${k}';schDoc='all';render()"><i class="sq" style="background:${DEPS[k].c}"></i>${DEPS[k].n}</button>`).join('')}</div>`}
 <div class="legend">${Object.entries(AST).map(([k,s])=>`<span><i style="background:${s.c}"></i>${s.n}</span>`).join('')}</div>
 <div class="schw"><div class="sch" style="grid-template-columns:58px repeat(${D.length},minmax(150px,1fr));grid-template-rows:auto repeat(${SLOTS.length},34px)">
  <div class="sh"></div>${D.map((d,i)=>`<div class="sh" style="grid-column:${i+2};--c:${DEPS[d.dep].c}"><b>${esc(d.s)}</b><span>${esc(DEPS[d.dep].n)} · ${esc(d.room)}</span></div>`).join('')}
  ${SLOTS.map((t,j)=>`<div class="stt" style="grid-row:${j+2}">${t.slice(3)==='00'?t:''}</div>${D.map((d,i)=>`<div class="scell ${t>NOW?'':'past'}" style="grid-row:${j+2};grid-column:${i+2}" onclick="card('newappt','${d.id}|${t}')"></div>`).join('')}`).join('')}
  ${D.map((d,i)=>APPTS.filter(a=>a.doc===d.id&&slotIx(a.t)>=0).map(a=>`<div class="ap" style="grid-column:${i+2};grid-row:${slotIx(a.t)+2} / span ${Math.max(1,Math.round(a.dur/30))};--c:${AST[a.st].c}" onclick="card('appt','${a.id}')"><b>${a.t} · ${esc(apN(a))}</b><span>${esc(a.svc)}</span>${a.tr?'<em>трансфер</em>':''}</div>`).join('')).join('')}
  <div class="nowl" style="grid-row:${slotIx('11:30')+2};grid-column:1 / -1"></div>
 </div></div>`};

/* ===== Трансфер ===== */
function tripAdv(id){const t=TRIPS.find(x=>x.id===id);const o=['plan','way','pick','done'];const i=o.indexOf(t.st);if(i<3)t.st=o[i+1];render();toast({way:'Водитель выехал — пациенту сообщение в кабинет: «Машина едет, будет через 15 минут».',pick:'Пациент в машине — администратор видит, что он будет вовремя.',done:'Пациент доставлен. Время в пути записано.'}[t.st]||'')}
SC.transfer=()=>{const drv=role==='Водитель';
 return `<div class="hd"><div><h2>Трансфер пациентов</h2><p>Машина клиники забирает пациентов старшего возраста и отвозит домой — входит в стоимость. Поездки строятся от расписания: забрать за 40 минут до приёма. Пациент видит в кабинете, что машина едет.</p></div></div>
 ${drv?'':`<div class="wid"><div><small>Поездок сегодня</small><b>${TRIPS.length}</b></div><div><small>Вовремя за неделю</small><b class="g">27 из 29</b><span>опоздание больше 10 минут — 2</span></div><div><small>Пациентов с трансфером</small><b>${PATIENTS.filter(p=>p.transfer).length}</b><span>старше 60 — 9 из 10</span></div><div><small>Пришли с трансфером</small><b class="g">100%</b><span>без трансфера — 86%</span></div><div><small>Водитель</small><b style="font-size:18px">Серик</b><span>+7 701 555 44 01</span></div></div>`}
 <div class="g21"><div class="pan"><h3>Маршрут на сегодня</h3><div class="trl">${TRIPS.map(t=>`<div class="tr ${t.st}"><div class="trt">${t.t}</div><div class="trb"><b>${t.p?esc(PT(t.p).n.split(' ').slice(0,2).join(' ')):esc(t.pn)}</b><span>${esc(t.addr)} → ${esc(t.to)}</span></div>${stm(TST,t.st)}${t.st!=='done'?`<button class="bt sm p" onclick="tripAdv('${t.id}')">${{plan:'Выехал',way:'Забрал',pick:'Доставил'}[t.st]}</button>`:`<span class="mini">${t.late?'опоздание '+t.late+' мин':'вовремя'}</span>`}</div>`).join('')}</div></div>
 <div class="phone"><div class="pht"><b>Серик · трансфер</b><small>Hyundai Staria · 6 мест</small></div><div class="pb">${TRIPS.filter(t=>t.st!=='done').slice(0,3).map(t=>`<div class="pi"><span>${t.t} · ${t.p?esc(PT(t.p).n.split(' ')[0]):esc(t.pn.split(' ')[0])}<small>${esc(t.addr)}</small></span><b>${esc(TST[t.st].n.split(' ')[0])}</b></div>`).join('')}<div class="pbtn" onclick="act('nav')">Открыть маршрут в 2ГИС</div></div></div></div>
 ${said('«Мы запустили машину, сами забираем — это входит в стоимость… Важно время: чтобы пришёл вовремя.»')}`};
