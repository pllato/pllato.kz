
/* ===== Задачи и лента ===== st: new — новая, work — в работе, check — на проверке, done — готово */
let TASKS=[
 {id:'T-301',t:'Перезвонить Ерболу (Mega) по КП на SC-55',who:'DN',by:'RS',due:'05.11',st:'new',pr:'high',deal:'D-118',chk:[['Сравнение с текущими машинами',true],['Расчёт лизинга на 24 мес',false],['Отправить в WhatsApp',false]],com:[['RS','09:50','Ербол спрашивал про лизинг — подготовь 2 варианта.']],watch:['RS']},
 {id:'T-302',t:'Демо-показ RX-75 в «Нурлы Тау»',who:'MR',by:'RS',due:'06.11',st:'work',pr:'high',deal:'D-127',chk:[['Забронировать демо-машину RX75-23-0017',true],['Водитель и газель на 08:30',true],['Химия и пады с собой',false],['Акт демо-показа подписать',false]],com:[['ER','вчера','Демо-машина заряжена, стоит у ворот 2.']],watch:['RS','ER']},
 {id:'T-303',t:'Отгрузить заказ Magnum: АКБ × 2, щётки × 6',who:'ER',by:'DN',due:'05.11',st:'work',pr:'mid',deal:'D-126',chk:[['Собрать по ячейкам C-01, B-11',true],['Накладная и счёт-фактура',false],['Передать водителю Данияру',false]],com:[],watch:['DN','SV']},
 {id:'T-304',t:'Подготовить заявку на тендер аэропорта',who:'KM',by:'AL',due:'11.11',st:'work',pr:'high',deal:'D-124',chk:[['Техническая спецификация',true],['Сертификаты соответствия',true],['Банковская гарантия',false],['Подписать ЭЦП',false]],com:[['AL','03.11','Цену согласовать со мной до подачи.']],watch:['AL','RS']},
 {id:'T-305',t:'ТО машины SW90-23-0144 — замена щётки',who:'TM',by:'OL',due:'04.11',st:'check',pr:'mid',deal:null,chk:[['Диагностика',true],['Заменить щётку BR-55',true],['Тест-драйв',true]],com:[['TM','10:05','Готово, проверьте.']],watch:['OL']},
 {id:'T-306',t:'Перезвонить на пропущенный +7 701 909 11 55',who:'AI',by:'Система',due:'сегодня',st:'new',pr:'high',deal:null,chk:[],com:[['Система','09:05','Пропущенный звонок на общий номер. Задача создана автоматически.']],watch:[]},
 {id:'T-307',t:'Пусконаладка SC-43 у CleanPro после оплаты',who:'NS',by:'MR',due:'08.11',st:'new',pr:'mid',deal:'D-121',chk:[['Доставка',false],['Сборка и запуск',false],['Обучение операторов',false],['Акт ввода в эксплуатацию',false]],com:[],watch:['MR']},
 {id:'T-308',t:'Инвентаризация ячеек B (запчасти)',who:'ER',by:'AL',due:'07.11',st:'new',pr:'low',deal:null,chk:[],com:[],watch:['AL']},
 {id:'T-309',t:'Выложить кейс Dostyk Plaza в Instagram',who:'AS',by:'RS',due:'10.11',st:'done',pr:'low',deal:null,chk:[['Фото',true],['Текст',true]],com:[],watch:[]}
];
const TST=[['new','Новые'],['work','В работе'],['check','На проверке'],['done','Готово']];
const PRN={high:['срочно','r'],mid:['обычная','w'],low:['низкая','']};
let curT='T-302',tView='board',tWho='all';
let FEED=[
 ['10:12','MR','написал в сделке D-121','«Счёт получили, оплатим сегодня-завтра» — клиент в WhatsApp','wa'],
 ['10:05','TM','отправил задачу на проверку','T-305 · ТО SW90-23-0144','task'],
 ['09:52','ER','принял приход','ПР-0087 · 3 × MINI-30, 120 падов · ячейки A-05, B-12','wh'],
 ['09:48','DN','поговорила 6:41 с Mega','Запись разговора прикреплена к сделке D-118','call'],
 ['09:20','RS','перевёл сделку на «Согласование»','D-115 · Dostyk Plaza · 29,2 млн','deal'],
 ['09:05','Система','создала задачу «перезвонить»','Пропущенный звонок, назначено Айгерим','task'],
 ['вчера','AL','утвердил скидку 4%','D-115 · согласование цены','deal'],
 ['вчера','BS','закончил перемещение','ПМ-0031 · SC55-24-0419 Алматы → Астана','wh']
];

/* ===== Пульт ===== */
const SC={};
const bizDeals=()=>DEALS.filter(d=>d.biz===biz);
SC.dash=()=>{const B=BIZ.find(b=>b.id===biz);const D=bizDeals(),open=D.filter(d=>d.stg!=='paid'),won=D.filter(d=>d.stg==='paid');
 const pipe=open.reduce((a,d)=>a+d.sum,0),wpipe=open.reduce((a,d)=>a+d.sum*d.prob/100,0);
 const low=PRODUCTS.filter(p=>freeQ(p.id)<p.min);const stockV=PRODUCTS.reduce((a,p)=>a+qty(p.id)*p.cost,0);
 const myT=TASKS.filter(t=>t.st!=='done');const over=myT.filter(t=>t.due==='сегодня'||t.due==='04.11');
 return `<div class="hd"><div><h2>Доброе утро, ${esc(ROLES[role].n.split(' ')[0])}</h2><p>${esc(B.n)} · ${TODAY}, ${NOW}. Что произошло за ночь и что требует решения сегодня.</p></div><div class="btns"><button class="bt" onclick="xlsDash()">Выгрузить в Excel</button><button class="bt p" onclick="newDeal()">+ Сделка</button></div></div>
 <div class="ledger">
  <div><small>Воронка, открыто</small><b>${mln(pipe)} ₸</b><span>${open.length} ${plural(open.length,['сделка','сделки','сделок'])} · с учётом вероятности ${mln(wpipe)}</span></div>
  <div><small>Продажи ноября</small><b class="ok">${mln(B.rev)} ₸</b><span>план 60 млн · ${pct(B.rev,60000000)}%</span>${bar(pct(B.rev,60000000),'g')}</div>
  <div><small>Склад в закупочных</small><b>${mln(stockV)} ₸</b><span>${SERIALS.filter(s=>s.st==='free').length} машин свободно · ${SERIALS.filter(s=>s.st==='res').length} в резерве</span></div>
  <div><small>Ниже минимума</small><b class="${low.length?'bad':''}">${low.length} SKU</b><span>${low.map(p=>p.id).join(', ')||'всё в норме'}</span></div>
  <div><small>Задачи на сегодня</small><b>${over.length}</b><span>${myT.length} открыто · ${TASKS.filter(t=>t.st==='check').length} ждут проверки</span></div>
 </div>
 <div class="g21"><div>
  <div class="pan"><h3>Воронка по этапам</h3><p>Нажмите на этап — откроется доска с фильтром.</p>
   <div class="stbar">${STG.map(([k,n])=>{const x=D.filter(d=>d.stg===k);const s=x.reduce((a,d)=>a+d.sum,0);return `<a onclick="go('funnel')"><em>${n}</em><b>${x.length}</b><i style="--w:${Math.min(100,pct(s,pipe||1)*1.6+4)}%"></i><span>${s?mln(s):'—'}</span></a>`}).join('')}</div></div>
  <div class="pan"><h3>Требует решения</h3><p>Система сама собирает то, что нельзя пропустить.</p>
   <div class="alist">
    <a onclick="openDeal('D-121')"><i class="dt w"></i><b>CleanPro не оплатил счёт № 412</b><span>2 дня · резерв SC-43 × 4 сгорит 07.11</span></a>
    <a onclick="go('stock')"><i class="dt r"></i><b>RX-75: свободных нет, резерв на 2 машины</b><span>в тендере ещё 2 · закажите у поставщика сейчас — поставка 45 дней</span></a>
    <a onclick="openTask('T-306')"><i class="dt r"></i><b>Пропущенный звонок 09:05 — ещё не перезвонили</b><span>задача у Айгерим</span></a>
    <a onclick="go('service')"><i class="dt i"></i><b>3 машины клиентов подходят к ТО в ноябре</b><span>Mega, Magnum, CleanPro — это повторные продажи расходников</span></a>
    <a onclick="openTask('T-305')"><i class="dt g"></i><b>Тимур закрыл ТО SW-90 — проверьте</b><span>задача на проверке</span></a>
   </div></div>
 </div><div>
  <div class="pan"><h3>Менеджеры за ноябрь</h3><p>Продажи, звонки, ответ в WhatsApp.</p>
   <table class="t sm"><thead><tr><th>Менеджер</th><th class="r">Продажи</th><th class="r">Звонки</th><th class="r">Ответ</th></tr></thead><tbody>
   ${[['RS',18.2,41,'4 мин'],['DN',12.9,96,'3 мин'],['MR',9.8,77,'6 мин'],['AI',4.4,58,'11 мин'],['KM',3.3,22,'—']].map(r=>`<tr onclick="go('team')"><td>${esc(SF(r[0]).n)}</td><td class="r">${r[1].toString().replace('.',',')} млн</td><td class="r">${r[2]}</td><td class="r ${r[3]==='11 мин'?'bad':''}">${r[3]}</td></tr>`).join('')}</tbody></table></div>
  <div class="pan"><h3>Лента</h3><p>Последнее по компании.</p>${FEED.slice(0,5).map(feedRow).join('')}<a class="more" onclick="go('feed')">Вся лента →</a></div>
 </div></div>
 ${said('«Нам нужна CRM: воронка, задачи, склады, инвентаризация, WhatsApp и IP-телефония — в одном месте.»','Пульт собирает всё это на одном экране: деньги в воронке, склад в тенге, задачи и что горит.')}`};
const FIC={wa:'WA',task:'ЗД',wh:'СК',call:'ТЛ',deal:'СД'};
const feedRow=f=>`<div class="frow"><span class="fic ${f[4]}">${FIC[f[4]]||'•'}</span><div><b>${esc(f[1]==='Система'?'Система':fn(f[1]))}</b> ${esc(f[2])}<small>${esc(f[3])}</small></div><time>${f[0]}</time></div>`;

/* ===== Воронка ===== */
let fMgr='all';
SC.funnel=()=>{const D=bizDeals().filter(d=>fMgr==='all'||d.mgr===fMgr);
 return `<div class="hd"><div><h2>Воронка продаж</h2><p>Перетащите карточку на другой этап или нажмите, чтобы открыть сделку. Каждый этап — свои обязательные действия: без КП не перейти в «Согласование», без оплаты — в «Отгрузку».</p></div><div class="btns"><select class="sel" onchange="fMgr=this.value;render()"><option value="all">Все менеджеры</option>${['RS','DN','MR','AI','KM'].map(m=>`<option value="${m}" ${fMgr===m?'selected':''}>${esc(SF(m).n)}</option>`).join('')}</select><button class="bt" onclick="xlsDeals()">Excel</button><button class="bt p" onclick="newDeal()">+ Сделка</button></div></div>
 <div class="kanban">${STG.map(([k,n])=>{const x=D.filter(d=>d.stg===k);return `<div class="kcol" ondragover="event.preventDefault()" ondrop="dropDeal(event,'${k}')"><div class="kh"><b>${n}</b><span>${x.length} · ${x.length?mln(x.reduce((a,d)=>a+d.sum,0)):'0'}</span></div>
 ${x.map(d=>`<div class="kc" draggable="true" ondragstart="event.dataTransfer.setData('t','${d.id}')" onclick="openDeal('${d.id}')"><code>${d.id}</code><b>${esc(CL(d.cl).n)}</b><span>${esc(d.t)}</span><div class="kf"><em>${tg(d.sum)}</em><i class="av">${ini(d.mgr)}</i></div><div class="kn ${d.days>3?'late':''}">${esc(d.next)}</div></div>`).join('')||'<div class="kempty">пусто</div>'}</div>`}).join('')}</div>`};
function dropDeal(e,k){const id=e.dataTransfer.getData('t');const d=DL(id);if(!d)return;const iFrom=STG.findIndex(s=>s[0]===d.stg),iTo=STG.findIndex(s=>s[0]===k);
 if(iTo>=STG.findIndex(s=>s[0]==='ship')&&d.stg!=='paid'){toast('Нельзя отгрузить без оплаты — сначала этап «Оплата». Так система бережёт склад от отгрузок в долг.');return}
 d.stg=k;FEED.unshift([NOW,'RS','перевёл сделку на «'+STN(k)+'»',d.id+' · '+CL(d.cl).n,'deal']);render();toast(`${d.id} → <b>${STN(k)}</b>. Клиенту ушло сообщение в WhatsApp, ответственному — задача по этапу.`)}
function newDeal(){openM('Новая сделка','Из звонка, WhatsApp или вручную',`<div class="form">
 <label>Клиент<select id="ndc">${CLIENTS.map(c=>`<option value="${c.id}">${esc(c.n)}</option>`).join('')}</select></label>
 <label>Что хочет<input id="ndt" value="Поломоечная машина для паркинга"></label>
 <label>Сумма, ₸<input id="nds" value="5400000"></label>
 <label>Ответственный<select id="ndm">${['DN','MR','AI','KM','RS'].map(m=>`<option value="${m}">${esc(SF(m).n)}</option>`).join('')}</select></label>
 <label>Источник<select><option>Звонок</option><option>WhatsApp</option><option>Сайт</option><option>Instagram</option><option>Госзакупки</option></select></label></div>
 <div class="btns l"><button class="bt p" onclick="saveDeal()">Создать</button></div>`)}
function saveDeal(){const id='D-'+(133+DEALS.length-10);DEALS.unshift({id,cl:document.getElementById('ndc').value,biz,t:document.getElementById('ndt').value,sum:+document.getElementById('nds').value||0,stg:'lead',mgr:document.getElementById('ndm').value,src:'Вручную',items:[],next:'Квалифицировать',days:0,prob:10});closeM();curD=id;go('deal');toast(`Сделка ${id} создана. Ответственному ушла задача «связаться в течение 15 минут».`)}
function openDeal(id){curD=id;go('deal')}

/* ===== Карточка сделки ===== */
SC.deal=()=>{const d=DL(curD),c=CL(d.cl);const si=STG.findIndex(s=>s[0]===d.stg);
 const msgs=INBOX.filter(m=>m.deal===d.id);const tk=TASKS.filter(t=>t.deal===d.id);const res=SERIALS.filter(s=>s.deal===d.id);
 return crumbs(['Воронка',"go('funnel')"],[d.id])+`<div class="hd"><div><h2>${esc(d.t)}</h2><p><a class="lnk" onclick="openClient('${c.id}')">${esc(c.n)}</a> · ${esc(c.type)} · ответственный ${esc(SF(d.mgr).n)} · источник ${esc(d.src)}</p></div><div class="btns"><button class="bt" onclick="go('kp')">Сформировать КП</button><button class="bt" onclick="mkBill()">Выставить счёт</button><button class="bt p" onclick="shipDeal()">Отгрузить</button></div></div>
 <div class="chainS">${STG.map(([k,n],i)=>`<a class="${i<si?'ok':i===si?'cur':''}" onclick="setStage('${k}')">${n}</a>`).join('')}</div>
 <div class="g21"><div>
  <div class="pan"><h3>Товары в сделке</h3><p>Наличие — живое со склада. Техника резервируется по серийному номеру, чтобы другой менеджер не продал ту же машину.</p>
   <div class="tw"><table class="t"><thead><tr><th>Товар</th><th class="r">Кол-во</th><th class="r">Свободно</th><th class="r">Цена</th><th class="r">Сумма</th><th></th></tr></thead><tbody>
   ${d.items.map(([p,q])=>{const P=PR(p),f=freeQ(p);const r=res.filter(s=>s.p===p).length;return `<tr onclick="openProd('${p}')"><td><b>${esc(P.n)}</b><span class="sub">${P.id} · ${esc(P.spec)}</span></td><td class="r">${q}</td><td class="r ${f<q-r?'bad':'ok'}">${f}${r?` <span class="tag w">+${r} ваш резерв</span>`:''}</td><td class="r">${tg(P.price)}</td><td class="r">${tg(P.price*q)}</td><td>${P.kind==='m'&&r<q?`<button class="bt sm" onclick="event.stopPropagation();reserve('${d.id}','${p}')">Резерв</button>`:''}</td></tr>`}).join('')||'<tr><td colspan="6" class="mini">Услуга без товаров со склада</td></tr>'}
   <tr class="total"><td colspan="4">Итого по сделке</td><td class="r">${tg(d.sum)}</td><td></td></tr></tbody></table></div>
   ${res.length?`<div class="sns">${res.map(s=>`<a onclick="openSN('${s.sn}')"><code>${s.sn}</code> ${WN(s.wh)} · резерв до 07.11</a>`).join('')}</div>`:''}</div>
  <div class="pan"><h3>История общения</h3><p>WhatsApp и звонки с записью — всё в одной ленте сделки.</p>
   <div class="tl2">${msgs.map(m=>m.ch==='Звонок'?`<div class="ti call"><span>${m.t}</span><div><b>Звонок · ${m.dir} · ${m.dur}</b>${m.rec?`<button class="play" onclick="playRec('${m.id}')">▶ запись</button>`:''}<p>${esc(m.sum)}</p></div></div>`:m.msgs.map(x=>`<div class="ti wa"><span>${x[2]}</span><div><b>WhatsApp · ${esc(m.who.split(' · ')[0])}</b><p>${esc(x[1])}</p></div></div>`).join('')).join('')}
   <div class="ti sys"><span>03.11</span><div><b>Система</b><p>Сделка создана, источник — ${esc(d.src.toLowerCase())}. Задача менеджеру — связаться за 15 минут.</p></div></div></div>
   <div class="wsend"><input id="wtx" placeholder="Сообщение клиенту в WhatsApp…" value="${esc(c.lpr.split(',')[0])}, добрый день! Отправляю КП и спецификацию."><button class="bt g" onclick="sendWA('${d.id}')">Отправить в WhatsApp</button><button class="bt" onclick="callC('${c.ph}')">Позвонить</button></div></div>
 </div><div>
  <div class="pan"><h3>Сделка</h3>
   <div class="kv"><span>Сумма</span><b>${tg(d.sum)}</b></div><div class="kv"><span>Вероятность</span><b>${d.prob}%</b></div><div class="kv"><span>Маржа</span><b>${tg(d.items.reduce((a,[p,q])=>a+(PR(p).price-PR(p).cost)*q,0))}</b></div><div class="kv"><span>Следующий шаг</span><b class="wrap">${esc(d.next)}</b></div><div class="kv"><span>Контакт</span><b class="wrap">${esc(c.lpr)}<br>${c.ph}</b></div></div>
  <div class="pan"><h3>Задачи по сделке</h3>${tk.map(t=>`<a class="trow" onclick="openTask('${t.id}')"><i class="dt ${t.st==='done'?'g':PRN[t.pr][1]}"></i><b>${esc(t.t)}</b><span>${fn(t.who)} · до ${t.due}</span></a>`).join('')||'<p class="mini">Задач нет.</p>'}<button class="bt sm" onclick="newTask('${d.id}')">+ Задача</button></div>
  <div class="pan"><h3>Документы</h3>${['КП № 118-2 · PDF','Спецификация · PDF',d.stg==='bill'||d.stg==='paid'?'Счёт № 412 · PDF':null].filter(Boolean).map(x=>`<div class="doc2"><code>PDF</code>${x}</div>`).join('')}</div>
 </div></div>`};
function setStage(k){const d=DL(curD);if(k==='ship'&&d.stg!=='paid'){toast('Отгрузка открывается только после оплаты.');return}d.stg=k;render();toast(`Этап: <b>${STN(k)}</b>. Клиенту — сообщение в WhatsApp, ответственному — задача.`)}
function reserve(id,p){const s=SERIALS.find(x=>x.p===p&&x.st==='free');if(!s){toast('Свободных машин нет — система предложит заказ поставщику.');return}s.st='res';s.deal=id;render();toast(`Зарезервирована <b>${s.sn}</b> (${WN(s.wh)}) до 07.11. Другие менеджеры видят её как занятую.`)}
function mkBill(){const d=DL(curD);d.stg='bill';render();toast(`Счёт № 413 на ${tg(d.sum)} сформирован по шаблону и ушёл клиенту в WhatsApp. Бухгалтер видит его в списке «ждём оплату».`)}
function shipDeal(){const d=DL(curD);if(d.stg!=='paid'&&d.stg!=='ship'){toast('Сначала оплата. Кнопка станет активной, когда бухгалтер отметит поступление или придёт выписка банка.');return}go('ship')}
function sendWA(id){const v=document.getElementById('wtx').value;const m=INBOX.find(x=>x.deal===id&&x.ch==='WhatsApp');if(m)m.msgs.push(['out',v,NOW]);else INBOX.unshift({id:'m'+Date.now(),ch:'WhatsApp',who:CL(DL(id).cl).lpr,deal:id,t:NOW,un:0,msgs:[['out',v,NOW]]});render();toast('Сообщение ушло с общего WhatsApp-номера компании и сохранилось в сделке.')}
function callC(ph){toast(`Звоним ${ph} через IP-телефонию… Разговор запишется и прикрепится к сделке.`)}
function playRec(id){const m=INBOX.find(x=>x.id===id);openM('Запись разговора',esc(m.who)+' · '+m.dur,`<div class="player"><button class="bt p">▶</button><div class="wave">${Array.from({length:60},(_,i)=>`<i style="height:${6+Math.abs(Math.sin(i*1.7))*26}px"></i>`).join('')}</div><span>0:00 / ${m.dur}</span></div><div class="pan"><h3>Кратко о разговоре</h3><p>${esc(m.sum)}</p></div><p class="mini">Записи хранятся в облаке АТС, в CRM — ссылка и плеер. Руководитель слушает любой звонок из карточки сделки.</p>`)}

/* ===== Клиенты ===== */
let curC='C1';
SC.clients=()=>`<div class="hd"><div><h2>Клиенты и объекты</h2><p>ТРЦ, аэропорты, клининговые компании. По каждому — какие машины у него стоят, когда ТО и что докупить.</p></div><div class="btns"><button class="bt" onclick="xlsClients()">Excel</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Тип</th><th>Город</th><th>Площадь</th><th class="r">Машин у клиента</th><th class="r">Сделки</th><th>ЛПР</th></tr></thead><tbody>
 ${CLIENTS.map(c=>`<tr onclick="openClient('${c.id}')"><td><b>${esc(c.n)}</b></td><td>${esc(c.type)}</td><td>${c.city}</td><td>${c.area}</td><td class="r">${c.owned.length}</td><td class="r">${DEALS.filter(d=>d.cl===c.id).length}</td><td class="mini">${esc(c.lpr)}</td></tr>`).join('')}</tbody></table></div>`;
function openClient(id){const c=CL(id);openM(esc(c.n),esc(c.type)+' · '+c.city+' · '+c.area,`<div class="kv"><span>ЛПР</span><b>${esc(c.lpr)}</b></div><div class="kv"><span>Телефон</span><b>${c.ph}</b></div>
 <div class="pan" style="margin-top:12px"><h3>Техника у клиента</h3>${c.owned.map(s=>`<div class="kv"><span><code>${s}</code></span><b>ТО через ${(s.length%5)+1} нед.</b></div>`).join('')||'<p class="mini">Пока не покупал технику.</p>'}</div>
 <div class="pan"><h3>Сделки</h3>${DEALS.filter(d=>d.cl===id).map(d=>`<a class="trow" onclick="closeM();openDeal('${d.id}')"><i class="dt i"></i><b>${esc(d.t)}</b><span>${STN(d.stg)} · ${tg(d.sum)}</span></a>`).join('')}</div>`)}

/* ===== WhatsApp и звонки ===== */
SC.inbox=()=>{const m=INBOX.find(x=>x.id===curM)||INBOX[0];
 return `<div class="hd"><div><h2>WhatsApp и звонки</h2><p>Один общий номер WhatsApp на всю команду и IP-телефония. Входящий с нового номера — сразу лид в воронке; пропущенный — задача «перезвонить».</p></div><div class="btns"><span class="live"><i></i>WhatsApp подключён</span><span class="live"><i></i>АТС · 4 линии</span></div></div>
 <div class="inbox"><div class="ilist">${INBOX.map(x=>`<a class="${x.id===m.id?'on':''}" onclick="curM='${x.id}';render()"><span class="ch ${x.ch==='WhatsApp'?'wa':'tel'}">${x.ch==='WhatsApp'?'WA':'ТЛ'}</span><div><b>${esc(x.who)}</b><small>${x.ch==='WhatsApp'?esc(x.msgs[x.msgs.length-1][1]):esc(x.dir+' · '+x.dur)}</small></div><time>${x.t}${x.un?`<em>${x.un}</em>`:''}</time></a>`).join('')}</div>
 <div class="ichat"><div class="ich"><div><b>${esc(m.who)}</b><small>${m.deal?`сделка <a class="lnk" onclick="openDeal('${m.deal}')">${m.deal}</a>`:'без сделки'}</small></div>${m.deal?'':`<button class="bt sm p" onclick="leadFrom('${m.id}')">Создать сделку</button>`}</div>
  ${m.ch==='WhatsApp'?`<div class="bubbles">${m.msgs.map(x=>`<div class="bb ${x[0]}"><p>${esc(x[1])}</p><time>${x[2]}</time></div>`).join('')}</div>
  <div class="tpls">${['Счёт во вложении','Пришлите реквизиты','Когда удобно демо-показ?','Машина в наличии, резерв на 3 дня'].map(t=>`<a onclick="document.getElementById('itx').value='${t}'">${t}</a>`).join('')}</div>
  <div class="wsend"><input id="itx" placeholder="Ответ…"><button class="bt g" onclick="replyWA('${m.id}')">Отправить</button></div>`
  :`<div class="callc"><b>${m.dir==='пропущенный'?'Пропущенный звонок':'Звонок · '+m.dir+' · '+m.dur}</b><p>${esc(m.sum)}</p>${m.rec?`<button class="bt" onclick="playRec('${m.id}')">▶ Прослушать запись</button>`:`<button class="bt p" onclick="callC('+7 701 909 11 55')">Перезвонить</button>`}</div>`}
 </div></div>`};
function replyWA(id){const m=INBOX.find(x=>x.id===id);const v=document.getElementById('itx').value;if(!v)return;m.msgs.push(['out',v,NOW]);m.un=0;render()}
function leadFrom(id){const m=INBOX.find(x=>x.id===id);const nid='D-140';DEALS.unshift({id:nid,cl:'C6',biz,t:'Новый лид со звонка',sum:0,stg:'lead',mgr:'AI',src:'Звонок',items:[],next:'Квалифицировать',days:0,prob:10});m.deal=nid;render();toast(`Создана сделка ${nid}, звонок и запись привязаны к ней.`)}

/* ===== КП ===== */
SC.kp=()=>{const d=DL(curD),c=CL(d.cl);
 return crumbs(['Воронка',"go('funnel')"],[d.id,"openDeal('"+d.id+"')"],['КП'])+`<div class="hd"><div><h2>Коммерческое предложение</h2><p>Собирается из карточки сделки: фото и характеристики машин, цена со склада, условия. Отправка в WhatsApp одной кнопкой, клиент открывает PDF — вы видите, что открыл.</p></div><div class="btns"><button class="bt" onclick="toast('PDF скачан.')">PDF</button><button class="bt g" onclick="toast('КП ушло в WhatsApp ${esc(c.lpr.split(',')[0])}. Когда клиент откроет — придёт уведомление.')">Отправить в WhatsApp</button></div></div>
 <div class="kpdoc"><div class="kph"><b>ГЛЯНЕЦ</b><span>Профессиональная уборочная техника · Алматы · Астана</span></div>
  <h3>Коммерческое предложение № 118-2 для ${esc(c.n)}</h3><p class="mini">от ${TODAY} · действительно 14 дней · площадь объекта ${c.area}</p>
  ${d.items.map(([p,q])=>{const P=PR(p);return `<div class="kpi"><div class="kpimg">${machineSVG(P.kind)}</div><div><b>${esc(P.n)}</b><p>${esc(P.spec)}</p><span>${q} шт × ${tg(P.price)} = <b>${tg(P.price*q)}</b></span></div></div>`}).join('')}
  <div class="kv"><span>Итого с НДС</span><b>${tg(d.sum)}</b></div><div class="kv"><span>Доставка и пусконаладка</span><b>бесплатно</b></div><div class="kv"><span>Гарантия</span><b>24 месяца</b></div><div class="kv"><span>Обучение операторов</span><b>на объекте</b></div></div>`};
const machineSVG=k=>k==='m'?`<svg viewBox="0 0 80 60"><rect x="10" y="14" width="46" height="28" rx="6" fill="var(--brand)"/><rect x="40" y="6" width="14" height="10" rx="2" fill="var(--rail)"/><circle cx="20" cy="46" r="7" fill="var(--rail)"/><circle cx="50" cy="46" r="7" fill="var(--rail)"/><rect x="56" y="38" width="16" height="6" rx="2" fill="var(--acc)"/></svg>`:`<svg viewBox="0 0 80 60"><circle cx="40" cy="30" r="20" fill="none" stroke="var(--brand)" stroke-width="6"/><circle cx="40" cy="30" r="6" fill="var(--acc)"/></svg>`;
