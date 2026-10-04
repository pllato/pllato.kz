
/* ===== помощники ===== */
const SC={};
const dirTag=d=>DIRS[d]?`<span class="dtag" style="--c:${DIRS[d].c}">${DIRS[d].n}</span>`:'';
const tenTag=t=>t==='none'?'':`<span class="ttag ${t}">${t==='tender'?'Тендер':'Усл. тендер'}</span>`;
const stTag=k=>{const s=STGOF(k);return `<span class="stg" style="--sc:${s.c}">${esc(s.n)}</span>`};
const pstTag=k=>{const s=PSTOF(k);return `<span class="stg" style="--sc:${s.c}">${esc(s.n)}</span>`};
const av=(k,cls='')=>TEAM[k]?`<span class="av ${cls}" title="${esc(TEAM[k].f+' · '+TEAM[k].r)}">${esc(TEAM[k].av)}</span>`:'';
const clL=id=>CL(id)?`<a class="lk" onclick="card('cl','${id}')">${esc(CL(id).n)}</a>`:'—';
const dealL=id=>DL(id)?`<a class="lk" onclick="openDeal('${id}')">${esc(DL(id).t)}</a>`:'—';
const projL=id=>PR(id)?`<a class="lk" onclick="openProj('${id}')">${esc(PR(id).t)}</a>`:'—';
const refL=r=>r&&r[0]==='P'?projL(r):dealL(r);
const refCl=r=>{const x=r&&r[0]==='P'?PR(r):DL(r);return x?CL(x.cl):null};
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const dleft=d=>{const n=daysBetween(TODAY,d);return n<0?`<span class="neg">${-n} дн. назад</span>`:n===0?'<b class="neg">сегодня</b>':`через ${n} ${plural(n,['день','дня','дней'])}`};
function openDeal(id){curDeal=id;dealTab='over';go('deal')}
function openProj(id){curProj=id;go('project')}
const weighted=d=>d.sum*(PROB[d.st]||0)/100;
const active=()=>DEALS.filter(d=>d.st!=='lost');
const myKey=()=>ROLES[role].p;

/* ===== Пульт ===== */
SC.dash=()=>{
 const newIn=INBOX.filter(i=>i.st==='new').length;
 const sales=DEALS.filter(d=>['new','brief','calc','creative','kp','defense','wait'].includes(d.st));
 const zadel=DEALS.filter(d=>['confirmed','contract'].includes(d.st));
 const real=PROJECTS.filter(p=>['prep','prod','event'].includes(p.st));
 const close=PROJECTS.filter(p=>p.st==='close');
 const life=[
  ['inbox','Входящие',newIn,'не разобрано',''],
  ['pipeline','Продажи',sales.length,mln(sales.reduce((a,d)=>a+d.sum,0)),'взвешенно '+mln(sales.reduce((a,d)=>a+weighted(d),0))],
  ['pipeline','Задел',zadel.length,mln(zadel.reduce((a,d)=>a+d.sum,0)),'подтверждено, не подписано'],
  ['projects','Реализация',real.length,mln(real.reduce((a,p)=>a+p.sum,0)),'в подготовке и монтаже'],
  ['finance','Закрытие',close.length,mln(close.reduce((a,p)=>a+p.sum-p.paid,0)),'ждём остаток по актам'],
  ['projects','Архив',PROJECTS.filter(p=>p.st==='done').length,'ретро','история сохранена']];
 const events=[...PROJECTS.filter(p=>p.st!=='done'&&p.st!=='close').map(p=>({d:p.from,t:p.t,cl:p.cl,who:p.pm,ready:p.ready,kind:'P',id:p.id,risk:p.risk})),
   ...DEALS.filter(d=>['confirmed','contract'].includes(d.st)).map(d=>({d:d.date,t:d.t,cl:d.cl,who:d.mgr,ready:0,kind:'D',id:d.id,risk:'не подписан'}))].sort((a,b)=>a.d<b.d?-1:1);
 const alerts=[
  ['r','Задача просрочена','Подписать договор с конгресс-холлом Шымкента — Ерлан, срок был 30.09','project','P5'],
  ['r','Конфликт брони реквизита','17.10: указателей нужно 10, на складе после ревизии 7 — Руслан и Тимур','propcal',''],
  ['w','Сделка без движения 8 дней','Тимбилдинг Altay Mining в Бурабае — клиент молчит, 12,6 млн','deal','D5'],
  ['w','Тендер: не хватает документов','Молодёжный форум — банковская гарантия и ценовое предложение до 08.10','tenders',''],
  ['w','Ждём остаток','Школа медпредставителей Steppe Pharma — 4 450 000 ₸ по акту от 29.09','docs',''],
  ['i','Защита завтра','Steppe Pharma: запуск препарата, против двух агентств — 02.10, 15:00','deal','D2']];
 return `<div class="hd"><div><h2>Пульт · ${dlong(TODAY)}</h2><p>Весь путь агентства на одном экране: от заявки в WhatsApp до акта и ретро. Каждая цифра открывается.</p></div>
  <div class="btns"><button class="bt" onclick="act('weekly')">Отчёт за неделю</button><button class="bt p" onclick="card('newdeal')">+ Сделка</button></div></div>
 <div class="life">${life.map((l,i)=>`<div class="lf" onclick="go('${l[0]}')"><small>${String(i+1).padStart(2,'0')} · ${l[1]}</small><b>${l[2]}</b><span>${l[3]}</span>${l[4]?`<em>${l[4]}</em>`:''}</div>`).join('')}</div>
 <div class="g21">
  <div class="pan"><h3>Ближайшие мероприятия</h3><p>Проекты в работе и подтверждённые сделки — по дате. Готовность считается по закрытым задачам проекта.</p>
   ${events.map(e=>`<div class="ev" onclick="${e.kind==='P'?`openProj('${e.id}')`:`openDeal('${e.id}')`}"><div class="evd"><b>${e.d.slice(8)}</b><small>${MON[+e.d.slice(5,7)-1].slice(0,3)}</small></div>
    <div class="evn"><b>${esc(e.t)}</b><span>${esc(CL(e.cl).n)} · ${e.kind==='P'?'PM':'менеджер'} ${who(e.who)} · ${dleft(e.d)}</span>${e.risk?`<span class="evr">${esc(e.risk)}</span>`:''}</div>
    <div class="evp">${e.kind==='P'?`<div class="bar"><i style="--w:${e.ready}%"></i></div><small>${e.ready}% готово</small>`:'<small class="warnt">задел</small>'}</div></div>`).join('')}
  </div>
  <div class="pan"><h3>Требует решения</h3><p>Правила, а не ручной обзвон: просрочки, конфликты брони, сделки без движения, тендеры, неоплаты.</p>
   ${alerts.map(a=>`<div class="al ${a[0]}" onclick="${a[4]?(a[3]==='deal'?`openDeal('${a[4]}')`:`openProj('${a[4]}')`):`go('${a[3]}')`}"><b>${a[1]}</b><span>${a[2]}</span></div>`).join('')}
  </div>
 </div>
 <div class="pan"><h3>Направления: в работе, задел и результат квартала</h3>
  <div class="tw"><table class="t"><thead><tr><th>Направление</th><th class="r">Сделок в работе</th><th class="r">Сумма в работе</th><th class="r">Взвешенно</th><th class="r">Задел</th><th class="r">Выиграно за квартал</th><th class="r">Проиграно</th><th class="r">Маржа</th></tr></thead><tbody>
  ${Object.keys(DIRS).map(k=>{const a=DEALS.filter(d=>d.dir===k&&!['lost','confirmed','contract'].includes(d.st)),z=DEALS.filter(d=>d.dir===k&&['confirmed','contract'].includes(d.st)),b=BYDIR.find(x=>x.d===k);
   return `<tr onclick="pipeDir='${k}';go('pipeline')"><td>${dirTag(k)}</td><td class="r">${a.length}</td><td class="r">${mln(a.reduce((s,d)=>s+d.sum,0))}</td><td class="r">${mln(a.reduce((s,d)=>s+weighted(d),0))}</td><td class="r">${mln(z.reduce((s,d)=>s+d.sum,0))}</td><td class="r">${b.won} · ${mln(b.rev)}</td><td class="r">${b.lost}</td><td class="r">${b.mg}%</td></tr>`}).join('')}
  </tbody></table></div>
  ${said('«Сколько проектов на этапе переговоров? Сколько на этапе просчётов? Сколько на этапе защиты? Сколько на этапе ожидания обратной связи?»','Это верхняя полоса и воронка: каждый этап — со счётчиком и суммой, задел — отдельно.')}
 </div>`;
};

/* ===== Входящие ===== */
SC.inbox=()=>{
 const rr=INBOX.filter(i=>i.st==='new').length;
 return `<div class="hd"><div><h2>Входящие · все каналы</h2><p>WhatsApp рабочего номера, почта, форма сайта, звонки, Instagram и 2ГИС — в одной ленте. Из сообщения — сделка с источником в один клик, переписка остаётся в карточке.</p></div>
  <div class="btns"><button class="bt" onclick="act('distrib')">Распределение: по очереди</button></div></div>
 <div class="chips">${Object.entries(CHANNELS).map(([k,c])=>`<span class="chip" style="--c:${c}">${k} · ${INBOX.filter(i=>i.ch===k).length}</span>`).join('')}<span class="chip off">не разобрано: ${rr}</span></div>
 <div class="inb">${INBOX.map(i=>`<div class="im ${i.st}"><div class="imch" style="--c:${CHANNELS[i.ch]}">${esc(i.ch)}</div>
   <div class="imb"><div class="imh"><b>${esc(i.name)}</b><span>${esc(i.from)} · ${i.t}</span></div><p>${esc(i.txt)}</p>
    ${i.file?`<span class="file">${esc(i.file)}</span>`:''}${i.utm?`<span class="file">UTM: ${esc(i.utm)}</span>`:''}
    <div class="imf">${i.st==='deal'?`<span class="tag g">сделка создана</span> ${dealL(i.deal)} · ${av(DL(i.deal).mgr)}`:`<button class="bt p" onclick="mkDeal('${i.id}','AB')">Сделка → Алина</button><button class="bt" onclick="mkDeal('${i.id}','TM')">Сделка → Тимур</button><button class="bt" onclick="act('spam')">Не заявка</button>`}</div></div></div>`).join('')}</div>
 ${said('«Заявки могут прийти на WhatsApp, на почту, могут позвонить» · «Нам важно понимать, откуда приходят заявки: с сайта через Google-рекламу, через Instagram, через 2ГИС или по рекомендации»','Канал и путь клиента записываются в сделку автоматически — из UTM сайта, номера WhatsApp, кнопки 2ГИС.')}`;
};
function mkDeal(iid,m){const i=INBOX.find(x=>x.id===iid);if(!i)return;const id='D'+(DEALS.length+1);const cid='K'+(CLIENTS.length+1);
 const nm=i.name.split(',').pop().trim().replace(' (новый)','');CLIENTS.push({id:cid,n:nm,ind:'—',city:'—',since:'2026',contact:i.name,src:i.ch==='Сайт'?'ads':i.ch==='Почта'?'mail':i.ch==='2ГИС'?'gis':'ig',dirs:['MKT'],ltv:0,projects:0,last:'—'});
 DEALS.unshift({id,cl:cid,t:i.ch==='Почта'?'Новогодний вечер, 450 сотрудников':i.ch==='Сайт'?'Конференция 2 дня, 300 участников':'Новая заявка',dir:i.ch==='Почта'?'HR':'MKT',ten:'none',src:i.ch==='Сайт'?'ads':i.ch==='Почта'?'mail':i.ch==='2ГИС'?'gis':'ig',mgr:m,st:'new',sum:0,mg:0,date:'2026-12-20',guests:0,cr:false,days:0,next:'Первый контакт в течение 15 минут',city:'—'});
 i.st='deal';i.deal=id;i.cl=cid;render();toast(`Сделка создана и отдана ${who(m)}: этап «Новая заявка», источник — ${esc(i.ch)}. Сообщение и файлы — в карточке.`)}

/* ===== Воронка ===== */
let pipeDir='all',pipeMgr='all';
SC.pipeline=()=>{
 const f=d=>!['lost','won'].includes(d.st)&&(pipeDir==='all'||d.dir===pipeDir)&&(pipeMgr==='all'||d.mgr===pipeMgr)&&(role!=='Менеджер продаж'||d.mgr==='AB');
 const L=DEALS.filter(f);const lost=DEALS.filter(d=>d.st==='lost');
 return `<div class="hd"><div><h2>Воронка продаж</h2><p>Этапы — как у вас: бриф, просчёт, креатив, КП и презентация, защита, ожидание ответа, подтверждён, договор и аванс. Карточки перетаскиваются; после аванса сделка сама становится проектом.</p></div>
  <div class="btns"><button class="bt p" onclick="card('newdeal')">+ Сделка</button></div></div>
 <div class="filt"><span>Направление</span>${[['all','Все'],...Object.entries(DIRS).map(([k,v])=>[k,v.n])].map(x=>`<button class="${pipeDir===x[0]?'on':''}" onclick="pipeDir='${x[0]}';render()">${x[1]}</button>`).join('')}
  <span>Менеджер</span>${[['all','Все'],['DS','Дана'],['AB','Алина'],['TM','Тимур']].map(x=>`<button class="${pipeMgr===x[0]?'on':''}" onclick="pipeMgr='${x[0]}';render()">${x[1]}</button>`).join('')}
  <em>В работе ${L.length} · ${mln(L.reduce((a,d)=>a+d.sum,0))} · взвешенно ${mln(L.reduce((a,d)=>a+weighted(d),0))}</em></div>
 <div class="kanban">${STG.map(s=>{const c=L.filter(d=>d.st===s.k);return `<div class="kcol" ondragover="event.preventDefault();this.classList.add('over')" ondragleave="this.classList.remove('over')" ondrop="this.classList.remove('over');moveDeal(event.dataTransfer.getData('t'),'${s.k}')">
  <div class="khead" style="--c:${s.c}"><b>${s.n}</b><span>${c.length} · ${mln(c.reduce((a,d)=>a+d.sum,0))}</span></div>
  ${c.map(d=>`<div class="kcard" draggable="true" ondragstart="event.dataTransfer.setData('t','${d.id}')" onclick="openDeal('${d.id}')"><div class="kt">${dirTag(d.dir)}${tenTag(d.ten)}</div><b>${esc(CL(d.cl).n)}</b><span>${esc(d.t)}</span>
   <div class="km"><strong>${d.sum?mln(d.sum):'сумма —'}</strong>${av(d.mgr)}</div><div class="kf"><span>${d.date?dd(d.date):''}${d.guests?' · '+d.guests+' гостей':''}</span>${d.days>=7?`<span class="neg">${d.days} дн. без движения</span>`:''}</div></div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>
 <div class="pan"><h3>Проигранные — с причиной</h3><p>Причина обязательна при закрытии: так видно, где теряем — цена, сроки, перенос.</p>
  ${lost.map(d=>`<div class="kv"><span>${dirTag(d.dir)} ${clL(d.cl)} · ${esc(d.t)} · ${tg(d.sum)}</span><b>${esc(d.lost)}</b></div>`).join('')}</div>`;
};
function moveDeal(id,k){const d=DL(id);if(!d||d.st===k)return;d.st=k;d.days=0;render();
 toast(k==='contract'?`«${esc(d.t)}» → Договор и аванс. Как только аванс поступит, нажмите в карточке «Аванс получен» — проект создастся с командой и задачами.`:k==='confirmed'?`Сделка в заделе: подтверждена, но не подписана — попадает в отдельную строку аналитики.`:`«${esc(d.t)}» → ${STGOF(k).n}. История этапов записана.`)}

/* ===== Карточка сделки ===== */
let dealTab='over';
const BRIEF={D2:[['Цель','Запуск нового препарата: 300 врачей-кардиологов узнают о механизме действия и записываются на программу пробных назначений'],['Аудитория','Кардиологи и терапевты Алматы и области, 30–60 лет'],['Формат','Научная конференция + интерактивная зона «молекула» + фуршет'],['Дата и время','14 ноября 2026, 10:00–17:00'],['Площадка','Отель уровня 5*, театральная рассадка, синхроперевод'],['Бюджет клиента','до 23 млн ₸ с НДС'],['KPI','Не менее 280 пришедших, 120 записей на программу'],['Креатив','Нужен: сценография и KV — участвуем в сравнении трёх агентств'],['Ограничения','Требования фармкодекса: без развлекательной программы, без подарков дороже 5 МРП'],['ЛПР','Елена Ким — бренд-менеджер, финальное решение — медицинский директор']]};
SC.deal=()=>{
 const d=DL(curDeal)||DEALS[1];const c=CL(d.cl);const si=STG.findIndex(s=>s.k===d.st);
 const tabs=[['over','Обзор'],['brief','Бриф'],['est','Смета'],['cr','Креатив'],['chat','Переписка'],['doc','Документы'],['hist','История']];
 let body='';
 if(dealTab==='over')body=`<div class="g2"><div class="pan"><h3>Сделка</h3>
   ${[['Клиент',clL(d.cl)],['Контакт',esc(c.contact)],['Направление',dirTag(d.dir)],['Формат отбора',TENDER[d.ten]],['Источник',esc(SRC[d.src])],['Менеджер',av(d.mgr)+' '+esc(TEAM[d.mgr].f)],['Дата мероприятия',d.date?dl(d.date)+' · '+dleft(d.date):'—'],['Гостей · город',(d.guests||'—')+' · '+esc(d.city)],['Бюджет',d.sum?tg(d.sum):'—'],['Маржа по смете',d.mg?d.mg+'%':'—'],['Вероятность',(PROB[d.st]||0)+'%']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
  <div class="pan"><h3>Следующий шаг</h3><div class="nx">${esc(d.next||'—')}</div>
   <h3 style="margin-top:14px">Задачи по сделке</h3>${TASKS.filter(t=>t.ref===d.id).map(taskRow).join('')||'<p class="mini">Задач нет.</p>'}
   <button class="bt" onclick="card('task','${d.id}')">+ Задача</button>
   <h3 style="margin-top:14px">Реквизит под сделку</h3>${BOOK.filter(b=>b.ref===d.id).map(b=>`<div class="kv"><span>${esc(RP(b.p).n)} · ${b.q} шт · ${dd(b.from)}</span><b>${b.st==='tentative'?'<span class="tag w">предварительно</span>':'<span class="tag g">подтверждено</span>'}</b></div>`).join('')||'<p class="mini">Нет броней. Предварительная бронь сгорает, если сделка не подписана.</p>'}
  </div></div>`;
 if(dealTab==='brief')body=`<div class="pan"><h3>Бриф</h3><p>14 вопросов первой встречи — из шаблона базы знаний. Заполняет менеджер или клиент по ссылке.</p>
   ${(BRIEF[d.id]||[['Цель','—'],['Аудитория','—'],['Формат','—'],['Дата',d.date?dl(d.date):'—'],['Гостей',String(d.guests||'—')],['Бюджет клиента','—'],['Креатив',d.cr?'Нужен':'Не нужен']]).map(x=>`<div class="kv"><span>${x[0]}</span><b class="wrap">${esc(x[1])}</b></div>`).join('')}
   <button class="bt" onclick="act('brieflink')">Отправить бриф клиенту ссылкой</button></div>`;
 if(dealTab==='est')body=`<div class="pan"><h3>Сметы и версии</h3>${EST[d.id]?EST[d.id].vers.map(v=>`<div class="kv"><span>v${v.v} · ${dd(v.d)} · ${esc(v.note)}</span><b>${tg(v.sum||estTotal(d.id).client)}</b></div>`).join('')+`<button class="bt p" onclick="curEst='${d.id}';go('estimate')">Открыть смету v${EST[d.id].ver}</button>`:`<p class="mini">Сметы пока нет.</p><button class="bt p" onclick="newEst('${d.id}')">Создать смету из шаблона</button>`}</div>`;
 if(dealTab==='cr')body=`<div class="pan"><h3>Креатив по сделке</h3><div class="kv"><span>Подключается креатор</span><b><span class="sw ${d.cr?'on':''}" onclick="DL('${d.id}').cr=!DL('${d.id}').cr;render()"></span></b></div>
   ${CREATIVE.filter(x=>x.deal===d.id).map(x=>`<div class="kv"><span>${esc(x.t)} · ${esc(x.kind)} · ${av(x.who)}</span><b>${esc((CRST.find(s=>s[0]===x.st)||['','Без креатива'])[1])}</b></div>`).join('')||'<p class="mini">Креативных задач нет.</p>'}
   <button class="bt" onclick="go('creative')">Очередь креативной группы</button></div>`;
 if(dealTab==='chat')body=`<div class="pan"><h3>Переписка с клиентом</h3><p>WhatsApp рабочего номера, почта и звонки — в одной ленте сделки. Менеджер пишет отсюда, клиент — из обычного WhatsApp.</p>
   <div class="chat">${(d.id==='D2'?[['in','Елена Ким','18.09 10:14','Добрый день! Нам нужно агентство на запуск препарата, 300 врачей, 14 ноября. Можете прислать КП?'],['sys','','18.09 10:31','Звонок 6 мин 40 с · запись в карточке'],['out','Тимур','19.09 09:05','Елена, бриф по итогам звонка во вложении, проверьте, пожалуйста, ограничения фармкодекса.'],['in','Елена Ким','26.09 16:20','Получили КП v2. Можно ужать бюджет до 22 млн и оставить сценографию?'],['out','Тимур','29.09 12:10','Да — v3: LED 8 м вместо 12, кофе-брейк вместо фуршета во второй части. Итог ниже 22 млн.'],['in','Елена Ким','30.09 11:02','Ждём вас на защите 2 октября в 15:00.']]:[['in',c.contact,'—','Первое сообщение клиента появится здесь.']]).map(m=>`<div class="msg ${m[0]}">${m[1]?`<b>${esc(m[1])}</b> `:''}${esc(m[3])}<small>${m[2]}</small></div>`).join('')}</div>
   <div class="send"><input id="dmsg" placeholder="Сообщение клиенту в WhatsApp"><button class="bt p" onclick="act('wa')">Отправить</button></div></div>`;
 if(dealTab==='doc')body=`<div class="pan"><h3>Документы сделки</h3>${DOCS.filter(x=>x.ref===d.id).map(docRow).join('')||'<p class="mini">Документов нет. На этапе «Договор» договор и счёт формируются из реквизитов клиента.</p>'}<button class="bt" onclick="card('newdoc','${d.id}')">Сформировать договор и счёт</button></div>`;
 if(dealTab==='hist')body=`<div class="pan"><h3>История — от первого сообщения</h3><div class="tl">${(d.id==='D2'?[['18.09','Заявка с сайта','Google Ads → лендинг → форма «Рассчитать мероприятие»'],['18.09','Звонок и квалификация','Тимур · 6 мин 40 с'],['19.09','Бриф','согласован с клиентом'],['22.09','Просчёт v1','19,4 млн'],['24.09','Креатив','сценография «молекула», 3D-визуализация'],['26.09','КП v2 и презентация','22,6 млн'],['29.09','Смета v3','оптимизация под бюджет'],['02.10','Защита','против двух агентств']]:[['—','Создана',SRC[d.src]]]).map((h,i,a)=>`<div class="tli ${i===a.length-1?'on':'ok'}"><span class="who">${h[0]}</span><b>${esc(h[1])}</b><p>${esc(h[2])}</p></div>`).join('')}</div></div>`;
 return `<div class="crumb"><a onclick="go('pipeline')">Воронка</a> › ${esc(c.n)}</div>
 <div class="hd"><div><h2>${esc(d.t)}</h2><p>${clL(d.cl)} · ${dirTag(d.dir)} ${tenTag(d.ten)} · ${esc(SRC[d.src])} · ${av(d.mgr)} ${esc(TEAM[d.mgr].f)}</p></div>
  <div class="btns">${d.st==='contract'?`<button class="bt g" onclick="toProject('${d.id}')">Аванс получен → проект</button>`:si>=0&&si<STG.length-1?`<button class="bt p" onclick="moveDeal('${d.id}','${STG[si+1].k}')">→ ${STG[si+1].n}</button>`:''}<button class="bt" onclick="card('lost','${d.id}')">Проиграна</button></div></div>
 <div class="steps">${STG.map((s,i)=>`<div class="stp ${i<si?'done':i===si?'on':''}" onclick="moveDeal('${d.id}','${s.k}')"><i>${i<si?'✓':i+1}</i>${s.n}</div>`).join('')}</div>
 <div class="tabs">${tabs.map(t=>`<a class="tab ${dealTab===t[0]?'on':''}" onclick="dealTab='${t[0]}';render()">${t[1]}</a>`).join('')}</div>
 ${body}
 ${said('«CRM по сути для нас сейчас является неким архиватором клиентских карточек… Коммуникация переходит в рабочие личные телефоны, и она не ведётся в рамках CRM. Нет всей истории проекта»','Здесь вся история — бриф, сметы, креатив, переписка, документы — живёт в одной карточке и переходит в проект.')}`;
};
function toProject(id){const d=DL(id);if(!d)return;const pid='P'+(PROJECTS.length+2);
 PROJECTS.unshift({id:pid,cl:d.cl,deal:id,t:d.t,dir:d.dir,ten:d.ten,pm:'EK',st:'prep',from:d.date,to:d.date,sum:d.sum,plan:Math.round(d.sum*(1-d.mg/100)),fact:0,paid:Math.round(d.sum*.3),ready:5,risk:'',team:['EK',d.mgr,'MK','SE'],city:d.city});
 TASKS.push({id:'T'+(TASKS.length+1),ref:pid,t:'Стартовая встреча команды проекта',who:'EK',due:addDays(TODAY,1),st:'todo',pr:'high'},{id:'T'+(TASKS.length+2),ref:pid,t:'Создать клиентскую группу в WhatsApp',who:'MK',due:addDays(TODAY,1),st:'todo',pr:'mid'});
 d.st='won';d.proj=pid;curProj=pid;go('project');toast(`Проект создан без повторного ввода: смета стала бюджетом, команда и стартовые задачи назначены, история сделки перенесена.`)}
