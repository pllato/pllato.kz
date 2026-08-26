/* ТК Газаблок · КОМПЬЮТЕРНАЯ версия — интерфейс. Данные и расчёт — в gazablok-data.js */
const ROLES={
 'ТК Газаблок · диспетчер':{av:'АЙ',n:'Айдана',r:'ТК Газаблок · диспетчер',note:'Заявки, рейсы, склад, задачи',
  s:['orders','calc','reis','stock','wh','pallets','tasks','reports']},
 'Завсклада':{av:'НБ',n:'Нурбек',r:'Склад · завсклада',note:'Остатки, приход, отгрузка, ТТН, инвентаризация',
  s:['stock','wh','ttn','pallets','tasks','hist']},
 'Руководитель':{av:'РК',n:'Руководитель',r:'ТК Газаблок · собственник',note:'Сводка, деньги, склад, задачи, отчёты',
  s:['dash','orders','stock','bill','debt','tasks','reports','pallets','admin']},
 'Менеджер · Аливиа':{av:'АС',n:'Асель',r:'Аливиа · менеджер',note:'Заявки, калькулятор для клиента, задачи',
  s:['my','newpc','calc','pallets','tasks']},
 'Бухгалтер':{av:'БХ',n:'Бухгалтерия',r:'ТК Газаблок · бухгалтер',note:'Счета, оплаты, дебиторка, акты сверки, прайс',
  s:['bill','pay','debt','prices','acct','tasks','hist']},
 'Администратор':{av:'АД',n:'Администратор',r:'ТК Газаблок · настройки',note:'Нормы, компании, пользователи, журнал',
  s:['admin','norms','stock','tasks','hist','reports']}
};
const NAV=[
 ['ОПЕРАТИВНАЯ РАБОТА',[['dash','📊','Сводка'],['orders','📋','Заявки',2],['my','📋','Мои заявки'],['newpc','➕','Новая заявка'],['calc','🧮','Калькулятор'],['reis','🚚','Рейсы'],['tasks','📌','Задачи',3]]],
 ['СКЛАД И ДОКУМЕНТЫ',[['stock','📦','Склад',1],['wh','✅','К отгрузке',2],['ttn','📄','ТТН'],['pallets','🧱','Поддоны'],['hist','🕘','История изменений']]],
 ['БУХГАЛТЕРИЯ',[['bill','🧾','Счета и реализация',2],['pay','💳','Поступления'],['debt','⚖️','Взаиморасчёты',1],['prices','🏷','Прайс и тарифы'],['acct','📑','Отчёты бухгалтерии']]],
 ['УПРАВЛЕНИЕ',[['reports','📈','Отчёты'],['norms','⚙️','Нормы и размеры'],['admin','🏢','Компании и доступы']]]
];
const TITLES={
 stock:['Склад газоблока','Остатки по размерам, резерв под заказы, приход с завода, отгрузка и инвентаризация'],
 calc:['Калькулятор','Считает от объёма или прямо от стен объекта: блоки, поддоны, машины и стоимость'],
 tasks:['Задачи','Доска в стиле Trello: перетаскивайте карточки между колонками, внутри — чек-лист и обсуждение'],
 bill:['Счета и реализация','Счёт формируется из заказа: объём × цена компании + доставка + залог за поддоны'],
 pay:['Поступления оплат','Банк и касса: разнесение платежей по счетам и компаниям'],
 debt:['Взаиморасчёты','Отгружено, оплачено, долг по каждой компании. Акт сверки за период'],
 prices:['Прайс и тарифы','Цена за м³ по компаниям, стоимость доставки, залог за поддон, НДС'],
 acct:['Отчёты бухгалтерии','Реализация, дебиторка, НДС, залоги — выгрузка в Excel и 1С'],
 dash:['Сводка по сети','Заявки, объёмы, рейсы и поддоны — одним экраном для руководителя'],
 orders:['Заявки компаний','Все заявки списком: фильтры, поиск, массовая обработка'],
 my:['Мои заявки','Заявки компании «Аливиа» — те же данные, что и в телефоне менеджера'],
 newpc:['Новая заявка','Та же форма, что в телефоне, но в две колонки — удобно вводить с клавиатуры'],
 reis:['Рейсы','Планирование рейсов на дату: точки, груз, загрузка машины'],
 wh:['К отгрузке','Подтверждённые заявки: формирование ТТН из заказа'],
 ttn:['ТТН','Печатная форма товарно-транспортной накладной'],
 pallets:['Поддоны','Выдано, возвращено, осталось — по компаниям и клиентам'],
 hist:['История изменений','Кто, когда и что изменил. Записи не удаляются'],
 reports:['Отчёты','Срезы за период и выгрузка в Excel'],
 norms:['Нормы и размеры','Блоков на поддон по каждому размеру — задаёт администратор'],
 admin:['Компании и доступы','Партнёры, менеджеры, водители, роли и права']
};
let role='ТК Газаблок · диспетчер',cur='orders';
const chipL=k=>{const s=ST(k);return `<span class="badge ${s.c}">${s.n}</span>`};

/* ===== ЭКРАНЫ ===== */
const SC={};

SC.dash=()=>{const inWork=ORDERS.filter(o=>!['done','rej'].includes(o.st));
 return `<div class="head"><div><h2>Сводка по сети</h2><p>Что происходит прямо сейчас: сколько заявок в работе, какой объём отгружаем, где просрочка и сколько поддонов у клиентов.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Сводка за день уходит в WhatsApp собственнику каждый вечер.')">Сводка в WhatsApp</button><button class="btn acc" onclick="go('reports')">Отчёты</button></div></div>
 <div class="strip">
  <div><small>ЗАЯВОК В РАБОТЕ</small><b>${inWork.length}</b><span>из них новых ${ORDERS.filter(o=>o.st==='new').length}</span></div>
  <div><small>ОБЪЁМ В РАБОТЕ, М³</small><b>${num(inWork.reduce((a,o)=>a+o.m3,0))}</b><span>${inWork.reduce((a,o)=>a+calcOrder(o.m3,o.size).pal,0)} поддонов</span></div>
  <div><small>ОТГРУЖЕНО ЗА МЕСЯЦ</small><b>1 284 м³</b><span class="g">▲ 18% к июлю</span></div>
  <div><small>РЕЙСОВ ЗАПЛАНИРОВАНО</small><b>3</b><span>на 26 августа</span></div>
  <div><small>ПОДДОНОВ У КЛИЕНТОВ</small><b class="r">77</b><span>залог 192 500 ₸</span></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph"><div><div class="ph-title">Объём по компаниям · август</div><div class="ph-sub">кто из партнёров сколько забирает</div></div><span class="badge o">1 284 м³</span></div>
   ${[['Аливиа',612,100],['СтройБаза KZ',428,70],['Мега Строй',244,40]].map(r=>`<div class="fr"><span>${r[0]}</span><div class="bar"><i style="--w:${r[2]}%"></i></div><b>${r[1]} м³</b></div>`).join('')}
   <div class="hint"><b>«Аливиа» — почти половина объёма.</b> Именно на ней и тестируем систему первой: если процесс ляжет на крупнейшего партнёра, остальные подключатся без сюрпризов.</div>
  </div>
  <div class="panel"><div class="ph-title">Требует внимания</div>
   ${[['2 заявки ждут подтверждения','ТК Газаблок · сегодня','var(--blue)'],
      ['1 заявка на исправлении у менеджера','СтройБаза KZ · вчера','var(--amber)'],
      ['Поддоны у «Мега Строй» — 26 шт.','дольше 14 дней','var(--red)'],
      ['Рейс 2 в пути','ГБ-2026-0144 · ЖК «Достык»','var(--acc)']]
    .map(x=>`<div class="note" style="--tone:${x[2]}"><b>${x[0]}</b><p>${x[1]}</p></div>`).join('')}
  </div>
 </div>
 <div class="g3">
  <div class="panel"><div class="ph-title">Отгрузки по дням, м³</div>
   <div style="display:flex;align-items:flex-end;gap:8px;height:120px;padding-top:12px">
    ${[['ПН',42],['ВТ',56],['СР',38],['ЧТ',64],['ПТ',72],['СБ',28]].map(d=>`<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px;height:100%">
     <b style="font-size:9.6px" class="mono">${d[1]}</b><div style="width:70%;height:${d[1]/72*100}%;background:var(--acc);border-radius:4px 4px 0 0"></div>
     <span style="font-size:8.4px;color:var(--muted)">${d[0]}</span></div>`).join('')}
   </div>
  </div>
  <div class="panel"><div class="ph-title">Размеры газоблока</div>
   ${SIZES.slice(0,4).map((s,i)=>`<div class="fr" style="grid-template-columns:120px 1fr 52px"><span style="font-size:9.4px">${s.n}</span><div class="bar"><i style="--w:${[100,64,42,22][i]}%"></i></div><b>${[38,24,16,8][i]}%</b></div>`).join('')}
   <div class="mini" style="margin-top:7px">Самый ходовой — 600×300×200, по нему и держим основной запас.</div>
  </div>
  <div class="panel"><div class="ph-title">Дисциплина заявок</div>
   <div class="kv"><span>Приняты без правок</span><b>78%</b></div>
   <div class="kv"><span>Возвращены на исправление</span><b class="mono">14%</b></div>
   <div class="kv"><span>Изменены на складе</span><b class="mono">8%</b></div>
   <div class="hint"><b>Что это даёт:</b> видно, какой менеджер регулярно ошибается в объёме, и разговор с ним строится на фактах, а не на ощущениях.</div>
  </div>
 </div>`};

/* ---- ЗАЯВКИ ---- */
let fSt='all',fQ='';
SC.orders=()=>{const list=ORDERS.filter(o=>(fSt==='all'||o.st===fSt)&&(!fQ||(o.no+o.cl+o.obj+COMPANIES[o.co]).toLowerCase().includes(fQ.toLowerCase())));
 return `<div class="head"><div><h2>Заявки компаний</h2><p>Все заявки всех партнёров в одной таблице. Фильтры по статусу, поиск по номеру, клиенту и объекту. Клик по строке — карточка заказа с историей и действиями.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Список выгружен в Excel с текущими фильтрами: номер, компания, клиент, объект, м³, поддоны, статус, даты.')">⬇ Excel</button><button class="btn acc" onclick="go('newpc')">+ Новая заявка</button></div></div>
 <div class="strip">
  <div><small>ВСЕГО ЗАЯВОК</small><b>${ORDERS.length}</b><span>показано ${list.length}</span></div>
  <div><small>ЖДУТ РЕШЕНИЯ</small><b class="a">${ORDERS.filter(o=>o.st==='new').length}</b><span>подтвердить или вернуть</span></div>
  <div><small>ОБЪЁМ ПО СПИСКУ</small><b>${num(list.reduce((a,o)=>a+o.m3,0))} м³</b><span>${list.reduce((a,o)=>a+calcOrder(o.m3,o.size).pal,0)} поддонов</span></div>
  <div><small>В ПУТИ</small><b>${ORDERS.filter(o=>o.st==='road').length}</b><span>водители на объектах</span></div>
  <div><small>ДОСТАВЛЕНО</small><b class="g">${ORDERS.filter(o=>o.st==='done').length}</b><span>за период</span></div>
 </div>
 <div class="filters">
  <input class="search" placeholder="Поиск: номер заказа, клиент, объект, компания…" value="${esc(fQ)}" oninput="fQ=this.value;render();this.focus();this.setSelectionRange(this.value.length,this.value.length)">
  <button class="filter ${fSt==='all'?'on':''}" onclick="fSt='all';render()">Все</button>
  ${STATUS.map(s=>`<button class="filter ${fSt===s.k?'on':''}" onclick="fSt='${s.k}';render()">${s.n}</button>`).join('')}
 </div>
 <div class="panel" style="padding:0"><div class="tw" style="max-height:560px">
 <table class="data" style="min-width:1020px"><thead><tr>
  <th>Заказ</th><th>Компания · менеджер</th><th>Клиент</th><th>Объект</th><th class="right">м³</th><th>Размер</th><th class="right">Подд.</th><th>Дата · рейс</th><th>Статус</th></tr></thead><tbody>
 ${list.map(o=>{const c=calcOrder(o.m3,o.size);return `<tr onclick="openOrder('${o.no}')">
  <td class="mono"><b>${o.no}</b></td>
  <td><b style="font-size:10.6px">${COMPANIES[o.co]}</b><div class="sub">${MANAGERS[o.mgr]}</div></td>
  <td>${esc(o.cl)}<div class="sub">${esc(o.ph)}</div></td>
  <td class="mini">${esc(o.obj)}<div class="sub">${esc(o.addr)}</div></td>
  <td class="right mono"><b>${num(o.m3)}</b></td>
  <td class="mono" style="font-size:10px">${sz(o.size).n}</td>
  <td class="right mono">${c.pal}</td>
  <td class="mono" style="font-size:10px">${o.date}<div class="sub">рейс ${o.reis}</div></td>
  <td>${chipL(o.st)}</td></tr>`}).join('')||'<tr><td colspan="9"><p class="mini" style="padding:16px">Ничего не найдено.</p></td></tr>'}
 </tbody></table></div></div>
 <div class="hint"><b>Зачем диспетчеру компьютер:</b> в телефоне удобно создавать заявку, а обрабатывать десятки — нет. Здесь видно все поля сразу, можно отсортировать по дате, отфильтровать по статусу и пройти пачкой.</div>`};

SC.my=()=>{const list=ORDERS.filter(o=>o.co===0);
 return `<div class="head"><div><h2>Мои заявки · «Аливиа»</h2><p>Менеджер может работать и с компьютера — те же данные, что и в телефоне, просто шире экран.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Выгрузка своих заявок в Excel за период.')">⬇ Excel</button><button class="btn acc" onclick="go('newpc')">+ Новая заявка</button></div></div>
 <div class="strip">
  <div><small>ЗАЯВОК ЗА АВГУСТ</small><b>34</b><span>612 м³</span></div>
  <div><small>В РАБОТЕ</small><b class="a">${list.filter(o=>!['done','rej'].includes(o.st)).length}</b><span>по текущему списку</span></div>
  <div><small>ДОСТАВЛЕНО</small><b class="g">${list.filter(o=>o.st==='done').length}</b><span>закрыты полностью</span></div>
  <div><small>НА ИСПРАВЛЕНИИ</small><b class="r">${list.filter(o=>o.st==='fix').length}</b><span>вернула ТК</span></div>
  <div><small>ПОДДОНОВ У КЛИЕНТОВ</small><b>27</b><span>по компании</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:880px"><thead><tr><th>Заказ</th><th>Клиент</th><th>Объект</th><th class="right">м³</th><th class="right">Подд.</th><th>Дата · рейс</th><th>Статус</th></tr></thead><tbody>
 ${list.map(o=>`<tr onclick="openOrder('${o.no}')"><td class="mono"><b>${o.no}</b></td><td>${esc(o.cl)}</td>
  <td class="mini">${esc(o.obj)}<div class="sub">${esc(o.addr)}</div></td>
  <td class="right mono"><b>${num(o.m3)}</b></td><td class="right mono">${calcOrder(o.m3,o.size).pal}</td>
  <td class="mono" style="font-size:10px">${o.date} · ${o.reis}</td><td>${chipL(o.st)}</td></tr>`).join('')}
 </tbody></table></div></div>`};

let NF={cl:'',ph:'+7 ',obj:'',addr:'',date:'26.08.2026',reis:1,size:'s1',m3:'',drv:0,cmt:''};
SC.newpc=()=>{const m3=parseFloat(String(NF.m3).replace(',','.'))||0;const c=calcOrder(m3,NF.size);const s=sz(NF.size);
 return `<div class="head"><div><h2>Новая заявка</h2><p>Та же форма, что в телефоне: вводите объём в м³ — блоки и поддоны считаются автоматически по нормам администратора.</p></div></div>
 <div class="g21">
  <div class="panel">
   <div class="f2">
    <div class="fld"><label>Клиент</label><input value="${esc(NF.cl)}" placeholder="ТОО «Алатау Курылыс»" oninput="NF.cl=this.value"></div>
    <div class="fld"><label>Телефон клиента</label><input value="${esc(NF.ph)}" oninput="NF.ph=this.value"></div>
   </div>
   <div class="f2">
    <div class="fld"><label>Объект</label><input value="${esc(NF.obj)}" placeholder="ЖК «Алатау», блок 3" oninput="NF.obj=this.value"></div>
    <div class="fld"><label>Адрес доставки</label><input value="${esc(NF.addr)}" placeholder="ул. Жандосова, 58" oninput="NF.addr=this.value"></div>
   </div>
   <div class="f3">
    <div class="fld"><label>Дата отгрузки</label><input value="${NF.date}" oninput="NF.date=this.value"></div>
    <div class="fld"><label>Рейс</label><select onchange="NF.reis=+this.value">${[1,2,3].map(r=>`<option value="${r}" ${NF.reis===r?'selected':''}>Рейс ${r}</option>`).join('')}</select></div>
    <div class="fld"><label>Манипулятор / водитель</label><select onchange="NF.drv=+this.value">${DRIVERS.map((d,i)=>`<option value="${i}" ${NF.drv===i?'selected':''}>${d.n.split(' ')[0]} · ${d.car.split('· ')[1]}</option>`).join('')}</select></div>
   </div>
   <div class="f2">
    <div class="fld"><label>Размер газоблока</label><select onchange="NF.size=this.value;render()">${SIZES.map(x=>`<option value="${x.id}" ${NF.size===x.id?'selected':''}>${x.n} · ${x.d}</option>`).join('')}</select></div>
    <div class="fld"><label>Количество, м³</label><input inputmode="decimal" value="${esc(String(NF.m3))}" placeholder="24" oninput="NF.m3=this.value;render()"></div>
   </div>
   <div class="fld"><label>Комментарий</label><input value="${esc(NF.cmt)}" placeholder="условия разгрузки, пожелания клиента" oninput="NF.cmt=this.value"></div>
   <div class="btns" style="margin-top:6px"><button class="btn acc" onclick="sendOrder()">Отправить заявку</button>
   <button class="btn" onclick="fillDemo()">Заполнить примером</button></div>
  </div>
  <div>
   <div class="calc"><div class="cl">СИСТЕМА ПОСЧИТАЛА АВТОМАТИЧЕСКИ</div>
    <div class="cg"><div><b>${m3?fmt(c.blocks):'—'}</b><small>блоков</small></div><div><b>${m3?c.pal:'—'}</b><small>поддонов</small></div><div><b>${m3?num(c.vol):'—'}</b><small>к отгрузке, м³</small></div></div>
    <div class="cn">Норма: <b style="color:#fff">${s.per} блоков на поддон</b> · поддон ${num(palVol(s))} м³ · блок ${num(s.v*1000)/1000} м³.<br>${m3?`Заявлено <b style="color:#fff">${num(m3)} м³</b> → округляем вверх до целого поддона: <b style="color:#fff">${c.pal} подд. = ${num(c.vol)} м³</b>.`:'Введите объём — расчёт появится сразу.'}</div>
   </div>
   <div class="panel"><div class="ph-title">Что произойдёт после отправки</div>
    ${[['Присвоится номер заказа','формат ГБ-2026-0000, по порядку'],['Заявка уйдёт в ТК Газаблок','диспетчер увидит её в своём списке'],['Менеджер получит уведомление','когда заявку подтвердят или вернут'],['Данные попадут в ТТН','переписывать вручную не придётся']]
     .map(x=>`<div class="kv"><span>${x[0]}</span><b style="font-weight:500;font-size:9.6px;color:var(--muted)">${x[1]}</b></div>`).join('')}
   </div>
  </div>
 </div>`};
function fillDemo(){NF={cl:'ТОО «Алатау Курылыс»',ph:'+7 701 220 44 18',obj:'ЖК «Алатау», блок 3',addr:'ул. Жандосова, 58',date:'26.08.2026',reis:1,size:'s1',m3:'24',drv:0,cmt:'Разгрузка до 17:00'};render();
 toast('Пример заполнен: 24 м³ размера 600×300×200 → <b>14 поддонов = 700 блоков = 25,2 м³</b>.')}
function sendOrder(){const m3=parseFloat(String(NF.m3).replace(',','.'))||0;
 if(!NF.cl||!m3)return toast('Заполните клиента и количество в м³ — остальное система посчитает сама.');
 const c=calcOrder(m3,NF.size);const no='ГБ-2026-0'+(seq++);
 ORDERS.unshift({no,co:0,mgr:0,cl:NF.cl,ph:NF.ph,obj:NF.obj||'—',addr:NF.addr||'—',date:NF.date,reis:NF.reis,size:NF.size,m3,drv:NF.drv,cmt:NF.cmt,st:'new',
  pallets:{out:0,back:0},hist:[['Заявка создана','Асель · Аливиа','сейчас',`Объём ${num(m3)} м³ · ${sz(NF.size).n} · ${c.pal} поддонов`]]});
 NF={cl:'',ph:'+7 ',obj:'',addr:'',date:'26.08.2026',reis:1,size:'s1',m3:'',drv:0,cmt:''};
 go(ROLES[role].s.includes('my')?'my':'orders');sparks();
 toast(`Заявка <b>${no}</b> отправлена: ${c.pal} поддонов = ${fmt(c.blocks)} блоков = ${num(c.vol)} м³. ТК Газаблок видит её у себя.`)}

/* ---- РЕЙСЫ ---- */
SC.reis=()=>`
 <div class="head"><div><h2>Рейсы на 26 августа</h2><p>Заявки собираются в рейсы, водитель получает свой рейс в телефон. Видно загрузку машины: манипулятор берёт до 14 поддонов за ходку.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Печать маршрутных листов на всех водителей рейса.')">Печать маршрутных листов</button><button class="btn acc" onclick="toast('Новый рейс создан — перетащите в него заявки из списка.')">+ Рейс</button></div></div>
 <div class="g3">
 ${[[1,'Ерлан Сатыбалдиев','512 KZA 02',[['ГБ-2026-0147','ЖК «Алатау», блок 3','24 м³',14],['ГБ-2026-0146','мкр. Нурлы Тау','12 м³',7]],21],
    [2,'Марат Ошақбаев','774 ABC 02',[['ГБ-2026-0144','ЖК «Достык», паркинг','18 м³',10]],10],
    [3,'Свободный рейс','—',[],0]]
  .map(r=>`<div class="panel"><div class="ph"><div><div class="ph-title">Рейс ${r[0]}</div><div class="ph-sub">${r[1]} · ${r[2]}</div></div>
   <span class="badge ${r[4]>14?'r':r[4]?'o':''}">${r[4]} / 14 подд.</span></div>
   <div class="bar" style="margin-bottom:10px"><i style="--w:${Math.min(100,r[4]/14*100)}%;background:${r[4]>14?'var(--red)':'var(--acc)'}"></i></div>
   ${r[3].map(x=>`<div class="kv" style="cursor:pointer" onclick="openOrder('${x[0]}')"><span>${x[0]}<div class="sub">${x[1]}</div></span><b>${x[2]}<div class="sub">${x[3]} подд.</div></b></div>`).join('')||'<p class="mini" style="padding:10px 0">Заявок пока нет — перетащите сюда из списка.</p>'}
   ${r[4]>14?'<div class="note" style="--tone:var(--red)"><b>Перегруз</b><p>21 поддон при вместимости 14 — нужен второй заезд или другая машина. Система предупреждает до отправки.</p></div>':''}
  </div>`).join('')}
 </div>
 <div class="hint"><b>Планирование в одном экране:</b> видно, что рейс 1 перегружен, а рейс 3 пустой — заявку можно перекинуть, не перезванивая водителям.</div>`;

/* ---- СКЛАД ---- */
SC.wh=()=>{const list=ORDERS.filter(o=>['ok','ttn'].includes(o.st));
 return `<div class="head"><div><h2>К отгрузке</h2><p>Только подтверждённые заявки. ТТН формируется из заказа — переписывать данные не нужно. Изменение количества фиксируется в истории.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Печать реестра отгрузок на смену.')">Реестр на смену</button></div></div>
 <div class="strip">
  <div><small>К ОТГРУЗКЕ</small><b>${list.length}</b><span>подтверждённых заявок</span></div>
  <div><small>ОБЪЁМ</small><b>${num(list.reduce((a,o)=>a+o.m3,0))} м³</b><span>${list.reduce((a,o)=>a+calcOrder(o.m3,o.size).pal,0)} поддонов</span></div>
  <div><small>ТТН ГОТОВО</small><b class="g">${list.filter(o=>o.ttn).length}</b><span>можно печатать</span></div>
  <div><small>ЖДУТ ТТН</small><b class="a">${list.filter(o=>!o.ttn).length}</b><span>сформировать из заказа</span></div>
  <div><small>ПОДДОНОВ ВЫДАНО СЕГОДНЯ</small><b>31</b><span>под рейсы 1 и 2</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:960px"><thead><tr><th>Заказ</th><th>Клиент · объект</th><th>Размер</th><th class="right">м³</th><th class="right">Блоков</th><th class="right">Поддонов</th><th>Водитель</th><th>ТТН</th><th></th></tr></thead><tbody>
 ${list.map(o=>{const c=calcOrder(o.m3,o.size);return `<tr onclick="openOrder('${o.no}')">
  <td class="mono"><b>${o.no}</b><div class="sub">${o.date} · рейс ${o.reis}</div></td>
  <td>${esc(o.cl)}<div class="sub">${esc(o.obj)}</div></td>
  <td class="mono" style="font-size:10px">${sz(o.size).n}</td>
  <td class="right mono"><b>${num(o.m3)}</b></td><td class="right mono">${fmt(c.blocks)}</td><td class="right mono">${c.pal}</td>
  <td class="mini">${DRIVERS[o.drv].n.split(' ')[0]}</td>
  <td>${o.ttn?`<span class="badge g">${o.ttn}</span>`:'<span class="badge a">не создана</span>'}</td>
  <td>${o.ttn?`<button class="btn" onclick="event.stopPropagation();openTTN('${o.no}')">Открыть ТТН</button>`:`<button class="btn acc" onclick="event.stopPropagation();makeTTN('${o.no}')">Сформировать ТТН</button>`}</td></tr>`}).join('')||'<tr><td colspan="9"><p class="mini" style="padding:16px">Подтверждённых заявок нет.</p></td></tr>'}
 </tbody></table></div></div>
 <div class="hint"><b>Главное для склада:</b> количество блоков и поддонов уже посчитано менеджером и проверено ТК. Завскладу остаётся отгрузить и распечатать документ.</div>`};

let ttnNo=null;
SC.ttn=()=>{const o=ORDERS.find(x=>x.no===ttnNo)||ORDERS.find(x=>x.ttn);
 if(!o)return `<div class="head"><div><h2>ТТН</h2><p>Сформируйте ТТН из заказа в разделе «К отгрузке».</p></div></div>`;
 const c=calcOrder(o.m3,o.size);const s=sz(o.size);
 return `<div class="head"><div><h2>Товарно-транспортная накладная</h2><p>Сформирована из заказа ${o.no} автоматически. Печатается на обычный принтер или сохраняется в PDF.</p></div>
 <div class="btns"><button class="btn" onclick="window.print()">🖨 Печать</button><button class="btn" onclick="toast('PDF сохранён и прикреплён к заказу ${o.no}.')">PDF</button>
 <button class="btn bl" onclick="whChange('${o.no}')">✏️ Изменить количество</button></div></div>
 <div class="ttn">
  <div class="ttn-top"><div><div class="t">ТК «Газаблок»</div><div class="mini">Товарно-транспортная накладная</div></div>
   <div class="n"><b style="font-size:15px;color:var(--txt)">${o.ttn}</b><div>от ${o.date}</div><div>заказ ${o.no}</div></div></div>
  <div class="g2" style="margin:0">
   <div><h4>Грузоотправитель</h4><div style="font-size:11px"><b>ТК «Газаблок»</b><br>склад, г. Астана<br>тел. +7 700 000 00 00</div></div>
   <div><h4>Грузополучатель</h4><div style="font-size:11px"><b>${esc(o.cl)}</b><br>${esc(o.addr)}<br>тел. ${esc(o.ph)}</div></div>
  </div>
  <div class="g2" style="margin:0">
   <div><h4>Заказчик (компания)</h4><div style="font-size:11px">${COMPANIES[o.co]} · менеджер ${MANAGERS[o.mgr]}</div></div>
   <div><h4>Перевозчик</h4><div style="font-size:11px">${DRIVERS[o.drv].n}<br>${DRIVERS[o.drv].car} · тел. ${DRIVERS[o.drv].ph}</div></div>
  </div>
  <h4>Груз</h4>
  <table class="tt"><tr><th>№</th><th>Наименование</th><th>Размер</th><th class="r">Блоков, шт</th><th class="r">Поддонов</th><th class="r">Объём, м³</th></tr>
   <tr><td>1</td><td>Газоблок автоклавный ${s.d}</td><td>${s.n}</td><td class="r">${fmt(c.blocks)}</td><td class="r">${c.pal}</td><td class="r">${num(c.vol)}</td></tr>
   <tr><td colspan="3"><b>Итого</b></td><td class="r"><b>${fmt(c.blocks)}</b></td><td class="r"><b>${c.pal}</b></td><td class="r"><b>${num(c.vol)}</b></td></tr></table>
  ${o.cmt?`<h4>Особые отметки</h4><div style="font-size:10.6px">${esc(o.cmt)}</div>`:''}
  <div class="sig"><div><u></u>Отпустил (склад)</div><div><u></u>Принял (водитель)</div><div><u></u>Получил (клиент)</div></div>
 </div>
 <div class="hint"><b>Ни одно поле не набрано руками:</b> клиент, адрес, груз, количество блоков и поддонов, объём и водитель подставлены из заявки менеджера. Это и убирает ошибки при переписывании.</div>`};
function openTTN(no){ttnNo=no;go('ttn')}
function makeTTN(no){const o=ORDERS.find(x=>x.no===no);const c=calcOrder(o.m3,o.size);
 const x=stockOf(o.size);if(x){x.pal=Math.max(0,x.pal-c.pal);
  STOCK_MOVES.unshift({t:'Отгрузка',d:'сейчас',size:o.size,pal:c.pal,who:'Нурбек',doc:`ТТН по заказу ${o.no} · ${esc(o.cl)}`,sum:0})}
 o.st='ttn';o.ttn='ТТН-2026-0'+(389+ORDERS.filter(x=>x.ttn).length);
 o.hist.push(['ТТН сформирована','Завсклада Нурбек','сейчас',`${o.ttn} · ${c.pal} поддонов, ${fmt(c.blocks)} блоков`]);
 ttnNo=no;closeD();go('ttn');sparks();
 toast(`<b>${o.ttn}</b> сформирована из заказа: ${fmt(c.blocks)} блоков, ${c.pal} поддонов, ${num(c.vol)} м³. Можно печатать.`)}
function whChange(no){const o=ORDERS.find(x=>x.no===no);const c=calcOrder(o.m3,o.size);
 openD('Изменение количества · '+o.no,'Заявка уже подтверждена — изменение попадёт в историю',
 `<div class="note" style="--tone:var(--amber)"><b>⚠ Внимание</b><p>Вы меняете данные подтверждённой заявки. Изменение увидят менеджер компании и ТК Газаблок, а система сохранит, кто, когда и что изменил. Отменить правку задним числом нельзя — только внести новую.</p></div>
 <div class="f2"><div class="fld"><label>Было, м³</label><input value="${num(o.m3)}" disabled style="background:var(--card2)"></div>
 <div class="fld"><label>Стало, м³</label><input id="chM3" value="${num(o.m3-1.8)}" inputmode="decimal" oninput="chPrev('${no}')"></div></div>
 <div class="fld"><label>Причина изменения</label><select id="chWhy"><option>Фактическая загрузка меньше — не поместилось на машину</option><option>Клиент уменьшил объём на месте</option><option>Ошибка в заявке</option><option>Замена размера блока</option></select></div>
 <div class="calc"><div class="cl">ПЕРЕСЧЁТ ПОСЛЕ ИЗМЕНЕНИЯ</div><div class="cg" id="chCalc">
  <div><b>—</b><small>блоков</small></div><div><b>—</b><small>поддонов</small></div><div><b>—</b><small>объём, м³</small></div></div>
  <div class="cn">Было: ${fmt(c.blocks)} блоков · ${c.pal} поддонов · ${num(c.vol)} м³</div></div>
 <div class="btns"><button class="btn acc" onclick="chSave('${no}')">Сохранить изменение</button><button class="btn" onclick="closeD()">Отмена</button></div>`);
 chPrev(no)}
function chPrev(no){const o=ORDERS.find(x=>x.no===no);const v=parseFloat(String(document.getElementById('chM3').value).replace(',','.'))||0;
 const c=calcOrder(v,o.size);const el=document.getElementById('chCalc');
 el.innerHTML=`<div><b>${v?fmt(c.blocks):'—'}</b><small>блоков</small></div><div><b>${v?c.pal:'—'}</b><small>поддонов</small></div><div><b>${v?num(c.vol):'—'}</b><small>объём, м³</small></div>`}
function chSave(no){const o=ORDERS.find(x=>x.no===no);const was=o.m3;
 const v=parseFloat(String(document.getElementById('chM3').value).replace(',','.'))||was;
 const why=document.getElementById('chWhy').value;const c1=calcOrder(was,o.size),c2=calcOrder(v,o.size);
 o.m3=v;o.hist.push(['Изменено количество','Завсклада Нурбек','сейчас',`Было ${num(was)} м³ / ${c1.pal} подд. → стало ${num(v)} м³ / ${c2.pal} подд. Причина: ${why.toLowerCase()}`]);
 closeD();render();
 toast(`Изменение сохранено: <b>${num(was)} → ${num(v)} м³</b>. Запись в истории: Нурбек, сейчас. Менеджеру и ТК ушло уведомление.`)}

SC.pallets=()=>`
 <div class="head"><div><h2>Поддоны</h2><p>Отдельный учёт: сколько выдано, сколько вернули, сколько осталось у клиента и у компании. Водитель отмечает выдачу и возврат прямо на объекте.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Выгрузка в Excel: по компаниям, клиентам и заказам, с суммой залога.')">⬇ Excel</button><button class="btn acc" onclick="toast('Приём возврата: указываем количество, поддоны возвращаются на склад, долг клиента уменьшается.')">Принять возврат</button></div></div>
 <div class="strip">
  <div><small>ВЫДАНО ЗА МЕСЯЦ</small><b>418</b><span>по всем компаниям</span></div>
  <div><small>ВОЗВРАЩЕНО</small><b class="g">341</b><span>82%</span></div>
  <div><small>У КЛИЕНТОВ</small><b class="r">77</b><span>из них 26 дольше 14 дней</span></div>
  <div><small>СУММА ЗАЛОГА</small><b>192 500 ₸</b><span>2 500 ₸ за поддон</span></div>
  <div><small>НА СКЛАДЕ</small><b>642</b><span>свободных</span></div>
 </div>
 <div class="g2">
  <div class="panel"><div class="ph-title">По компаниям</div>
   <div class="tw"><table class="data" style="min-width:420px"><thead><tr><th>Компания</th><th class="right">Выдано</th><th class="right">Возврат</th><th class="right">Долг</th><th>Залог</th></tr></thead><tbody>
   ${[['Аливиа',186,159],['СтройБаза KZ',142,118],['Мега Строй',90,64]].map(r=>`<tr onclick="toast('${r[0]}: разбивка по клиентам и заказам, даты выдачи и возврата.')">
    <td><b>${r[0]}</b></td><td class="right mono">${r[1]}</td><td class="right mono">${r[2]}</td>
    <td class="right mono"><b style="color:var(--red)">${r[1]-r[2]}</b></td><td class="mono">${fmt((r[1]-r[2])*2500)} ₸</td></tr>`).join('')}
   </tbody></table></div>
  </div>
  <div class="panel"><div class="ph-title">По клиентам · долг</div>
   <div class="tw"><table class="data" style="min-width:420px"><thead><tr><th>Клиент</th><th>Компания</th><th class="right">Выдано</th><th class="right">Возврат</th><th class="right">Дней</th></tr></thead><tbody>
   ${[['ТОО «Курылыс Плюс»','Аливиа',10,0,1],['ТОО «Аском Строй»','СтройБаза KZ',20,14,6],['ИП Абдуллин','Мега Строй',5,3,2],['ТОО «Алатау Курылыс»','Аливиа',14,8,17]]
    .map(r=>`<tr onclick="toast('${r[0]}: история выдач и возвратов по каждому заказу.')"><td>${r[0]}</td><td class="mini">${r[1]}</td>
     <td class="right mono">${r[2]}</td><td class="right mono">${r[3]}</td>
     <td class="right mono ${r[4]>14?'':''}" style="${r[4]>14?'color:var(--red);font-weight:800':''}">${r[4]}</td></tr>`).join('')}
   </tbody></table></div>
   <div class="hint"><b>Долг старше 14 дней подсвечивается</b> — по нему система предлагает выставить залог к оплате или напомнить клиенту.</div>
  </div>
 </div>`;

SC.hist=()=>`
 <div class="head"><div><h2>История изменений</h2><p>Все действия по заказам: кто, когда и что изменил. Записи не редактируются и не удаляются.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Журнал выгружен в Excel за период.')">⬇ Excel</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:820px"><thead><tr><th>Время</th><th>Заказ</th><th>Действие</th><th>Подробности</th><th>Пользователь</th></tr></thead><tbody>
 ${ORDERS.flatMap(o=>o.hist.map(h=>({o,h}))).reverse().slice(0,20).map(({o,h})=>`<tr onclick="openOrder('${o.no}')">
  <td class="mono" style="font-size:10px">${h[2]}</td><td class="mono"><b>${o.no}</b></td>
  <td><b style="font-size:10.6px">${h[0]}</b></td><td class="mini">${esc(h[3]||'—')}</td><td class="mini">${h[1]}</td></tr>`).join('')}
 </tbody></table></div>
 <div class="hint"><b>Зачем это ТК Газаблок:</b> если клиент спорит про объём или сроки, вся цепочка поднимается за секунду — кто создал заявку, кто подтвердил, кто менял количество и когда водитель доставил.</div></div>`;

SC.reports=()=>`
 <div class="head"><div><h2>Отчёты</h2><p>Любой срез за период с выгрузкой в Excel: объёмы, блоки, рейсы, клиенты, компании, поддоны и отгрузки.</p></div>
 <div class="btns"><select class="rsel"><option>Август 2026</option><option>Июль 2026</option><option>Квартал</option><option>Произвольный период</option></select><button class="btn acc" onclick="toast('Полный отчёт за август выгружен в Excel — 7 листов: отгрузки, компании, клиенты, водители, поддоны, размеры, история.')">⬇ Выгрузить всё в Excel</button></div></div>
 <div class="strip">
  <div><small>ОТГРУЖЕНО, М³</small><b>1 284</b><span>за август</span></div>
  <div><small>БЛОКОВ</small><b>38 640</b><span>по всем размерам</span></div>
  <div><small>ПОДДОНОВ</small><b>714</b><span>выдано клиентам</span></div>
  <div><small>РЕЙСОВ</small><b>96</b><span>2 водителя</span></div>
  <div><small>ЗАКАЗОВ</small><b>112</b><span>3 компании</span></div>
 </div>
 <div class="g2">
  <div class="panel"><div class="ph-title">Готовые отчёты</div>
   ${[['Отгрузки за период','дата, заказ, компания, клиент, объём, блоки, поддоны, рейс'],
      ['По компаниям','заявки, объём, средний заказ, поддоны, долг'],
      ['По клиентам','объекты, объём, поддоны, последняя отгрузка'],
      ['По водителям и рейсам','точки, груз, время доставки, фото'],
      ['Поддоны','выдано, возвращено, остаток, залог'],
      ['По размерам газоблока','что и сколько отгружаем — для планирования запаса']]
    .map(r=>`<div class="kv" style="cursor:pointer" onclick="toast('Отчёт «${r[0]}» выгружен в Excel: ${r[1]}.')"><span><b style="color:var(--txt);font-size:10.8px">${r[0]}</b><div class="sub">${r[1]}</div></span><b style="color:var(--green)">⬇ XLSX</b></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Объём по месяцам, м³</div>
   <div style="display:flex;align-items:flex-end;gap:9px;height:150px;padding-top:12px">
    ${[['мар',780],['апр',890],['май',1020],['июн',1140],['июл',1090],['авг',1284]].map(m=>`<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px;height:100%">
     <b class="mono" style="font-size:9.4px">${m[1]}</b><div style="width:72%;height:${m[1]/1284*100}%;background:var(--acc);border-radius:4px 4px 0 0"></div>
     <span style="font-size:8.4px;color:var(--muted)">${m[0]}</span></div>`).join('')}
   </div>
   <div class="hint"><b>Отчёты строятся на живых данных,</b> а не собираются вручную в конце месяца: как только водитель отметил доставку, цифра уже в отчёте.</div>
  </div>
 </div>`;

SC.norms=()=>`
 <div class="head"><div><h2>Нормы и размеры</h2><p>Сколько блоков помещается на поддон по каждому размеру. От этих значений считаются все заявки. Меняет администратор ТК Газаблок.</p></div>
 <div class="btns"><button class="btn acc" onclick="toast('Новый размер добавлен — задайте объём блока и норму на поддон.')">+ Размер</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:760px"><thead><tr><th>Размер, мм</th><th>Тип</th><th class="right">Объём блока, м³</th><th class="right">Блоков на поддон</th><th class="right">Объём поддона, м³</th><th>Изменить</th></tr></thead><tbody>
 ${SIZES.map((s,i)=>`<tr style="cursor:default"><td class="mono"><b>${s.n}</b></td><td class="mini">${s.d}</td>
  <td class="right mono">${num(s.v*1000)/1000}</td>
  <td class="right mono"><b style="font-size:14px">${s.per}</b></td>
  <td class="right mono">${num(palVol(s))}</td>
  <td><button class="btn" onclick="normSet(${i},-5)">−5</button> <button class="btn" onclick="normSet(${i},5)">+5</button></td></tr>`).join('')}
 </tbody></table></div>
 <div class="hint"><b>Пример пересчёта:</b> при норме ${SIZES[0].per} блоков на поддон заявка на 24 м³ размера ${SIZES[0].n} даёт ${calcOrder(24,'s1').pal} поддонов и ${fmt(calcOrder(24,'s1').blocks)} блоков. Поменяйте норму кнопками — цифра пересчитается сразу.</div></div>
 <div class="note" style="--tone:var(--amber)"><b>Изменение норм</b><p>Новые нормы применяются только к новым заявкам. Уже созданные заказы и выписанные ТТН не пересчитываются — иначе разъедутся документы и фактические отгрузки.</p></div>`;
function normSet(i,d){SIZES[i].per=Math.max(5,SIZES[i].per+d);render();
 toast(`Норма для ${SIZES[i].n}: <b>${SIZES[i].per} блоков на поддон</b> (${num(palVol(SIZES[i]))} м³ на поддон). Новые заявки считаются по ней.`)}

SC.admin=()=>`
 <div class="head"><div><h2>Компании и доступы</h2><p>Партнёры подключаются по одному: сначала «Аливиа», после теста — остальные. Каждый видит только свои заявки.</p></div>
 <div class="btns"><button class="btn acc" onclick="toast('Новая компания: название, менеджеры, лимиты. Подключение занимает несколько минут.')">+ Компания</button></div></div>
 <div class="g2">
  <div class="panel"><div class="ph-title">Компании-партнёры</div>
   <div class="tw"><table class="data" style="min-width:400px"><thead><tr><th>Компания</th><th class="right">Менеджеров</th><th class="right">Заявок</th><th>Статус</th></tr></thead><tbody>
   ${[['Аливиа',3,34,'активна','g'],['СтройБаза KZ',2,26,'активна','g'],['Мега Строй',1,12,'тест','a']]
    .map(c=>`<tr onclick="toast('${c[0]}: менеджеры, заявки, поддоны и лимиты — в карточке компании.')"><td><b>${c[0]}</b></td>
     <td class="right mono">${c[1]}</td><td class="right mono">${c[2]}</td><td><span class="badge ${c[4]}">${c[3]}</span></td></tr>`).join('')}
   </tbody></table></div>
  </div>
  <div class="panel"><div class="ph-title">Пользователи и роли</div>
   <div class="tw"><table class="data" style="min-width:420px"><thead><tr><th>Роль</th><th>Что видит</th><th class="right">Чел.</th></tr></thead><tbody>
   ${[['Менеджер компании','только заявки своей компании',6],['Диспетчер ТК','все заявки, рейсы, подтверждение',2],['Завсклада','подтверждённые заявки и ТТН',1],['Водитель','только свой рейс',4],['Руководитель','всё + отчёты и настройки',1]]
    .map(r=>`<tr style="cursor:default"><td><b>${r[0]}</b></td><td class="mini">${r[1]}</td><td class="right mono">${r[2]}</td></tr>`).join('')}
   </tbody></table></div>
   <div class="hint"><b>Вход по номеру телефона:</b> сотрудник вводит номер и получает код в SMS или WhatsApp. Пароли помнить не нужно, доступ отключается одной кнопкой.</div>
  </div>
 </div>
 <div class="panel"><div class="ph-title">Компьютерная и мобильная версия — одна система</div>
  <div class="tw"><table class="data" style="min-width:700px"><thead><tr><th>Роль</th><th>Где удобнее работать</th><th>Почему</th></tr></thead><tbody>
  ${[['Менеджер компании-перекупа','📱 телефон','создаёт заявки в поле, у клиента на объекте'],
     ['Водитель','📱 телефон','рейс, статусы и фото прямо в кабине'],
     ['Диспетчер ТК','💻 компьютер','обрабатывает десятки заявок таблицей с фильтрами'],
     ['Завсклада','💻 компьютер','печать ТТН на принтер, реестры на смену'],
     ['Руководитель','💻 компьютер','сводка, отчёты, выгрузка в Excel']]
   .map(r=>`<tr style="cursor:default"><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="mini">${r[2]}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="hint"><b>Важно:</b> это не две разные программы. База данных, заявки, ТТН и права — общие. Один и тот же сотрудник может утром работать с телефона, а днём сесть за компьютер и увидеть ровно то же самое.</div>
 </div>`;



/* ================= СКЛАД ================= */
SC.stock=()=>{recalcReserve();
 const totPal=STOCK.reduce((a,x)=>a+x.pal,0),totVol=STOCK.reduce((a,x)=>a+stockVol(x),0);
 const low=STOCK.filter(x=>stockFree(x)<x.min);
 return `<div class="head"><div><h2>Склад газоблока</h2><p>Остатки ведутся в поддонах — так считает кладовщик, а м³ и блоки система пересчитывает сама по нормам. Под подтверждённые заявки товар резервируется, поэтому свободный остаток всегда честный.</p></div>
 <div class="btns"><button class="btn" onclick="stockForm('Приход')">+ Приход с завода</button>
 <button class="btn" onclick="stockForm('Списание')">− Списание / бой</button>
 <button class="btn acc" onclick="stockInv()">Инвентаризация</button></div></div>
 <div class="strip">
  <div><small>НА СКЛАДЕ</small><b>${totPal} подд.</b><span>${num(totVol)} м³ · ${fmt(STOCK.reduce((a,x)=>a+x.pal*sz(x.size).per,0))} блоков</span></div>
  <div><small>ЗАРЕЗЕРВИРОВАНО</small><b class="a">${STOCK.reduce((a,x)=>a+x.res,0)} подд.</b><span>под подтверждённые заявки</span></div>
  <div><small>СВОБОДНО</small><b class="g">${STOCK.reduce((a,x)=>a+stockFree(x),0)} подд.</b><span>можно продавать</span></div>
  <div><small>НИЖЕ МИНИМУМА</small><b class="${low.length?'r':'g'}">${low.length}</b><span>${low.length?low.map(x=>sz(x.size).n).join(', '):'все позиции в норме'}</span></div>
  <div><small>СТОИМОСТЬ ОСТАТКОВ</small><b>${fmt(STOCK.reduce((a,x)=>a+stockVol(x)*coPrice(0),0))} ₸</b><span>по цене «Аливиа»</span></div>
 </div>
 <div class="panel" style="padding:0;margin-bottom:11px"><div class="tw"><table class="data" style="min-width:960px"><thead><tr>
  <th>Размер</th><th>Площадка</th><th class="right">Поддонов</th><th class="right">Блоков</th><th class="right">Объём, м³</th><th class="right">Резерв</th><th class="right">Свободно</th><th class="right">Минимум</th><th>Состояние</th></tr></thead><tbody>
 ${STOCK.map(x=>{const s0=sz(x.size);const free=stockFree(x);const bad=free<x.min;
  return `<tr onclick="stockCard('${x.size}')">
  <td class="mono"><b>${s0.n}</b><div class="sub">${s0.d}</div></td>
  <td class="mini">${x.loc}</td>
  <td class="right mono"><b>${x.pal}</b></td>
  <td class="right mono">${fmt(x.pal*s0.per)}</td>
  <td class="right mono">${num(stockVol(x))}</td>
  <td class="right mono ${x.res?'':''}" style="${x.res?'color:var(--amber)':''}">${x.res||'—'}</td>
  <td class="right mono"><b style="color:${bad?'var(--red)':'var(--green)'}">${free}</b></td>
  <td class="right mono">${x.min}</td>
  <td>${bad?'<span class="badge r">заказать с завода</span>':free<x.min*1.5?'<span class="badge a">заканчивается</span>':'<span class="badge g">в норме</span>'}</td></tr>`}).join('')}
 </tbody></table></div></div>
 <div class="g21">
  <div class="panel"><div class="ph"><div><div class="ph-title">Движение по складу</div><div class="ph-sub">приход с завода, отгрузка по ТТН, списание и инвентаризация</div></div></div>
   <div class="tw"><table class="data" style="min-width:640px"><thead><tr><th>Дата</th><th>Операция</th><th>Размер</th><th class="right">Поддонов</th><th>Документ</th><th>Кто</th></tr></thead><tbody>
   ${STOCK_MOVES.map(m=>`<tr style="cursor:default"><td class="mono" style="font-size:10px">${m.d}</td>
    <td><span class="badge ${m.t==='Приход'?'g':m.t==='Отгрузка'?'o':m.t==='Списание'?'r':'b'}">${m.t}</span></td>
    <td class="mono" style="font-size:10px">${m.size==='—'?'—':sz(m.size).n}</td>
    <td class="right mono">${m.pal||'—'}</td><td class="mini">${m.doc}</td><td class="mini">${m.who}</td></tr>`).join('')}
   </tbody></table></div>
   <div class="hint"><b>Отгрузка списывается сама:</b> когда завсклада формирует ТТН, поддоны уходят со склада автоматически — отдельно «списать» ничего не нужно, поэтому остаток на экране всегда совпадает с фактом на площадке.</div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Хватает ли на заявки</div>
    <p class="mini" style="margin-bottom:9px">Система сверяет подтверждённые заявки с остатком и предупреждает до отгрузки.</p>
    ${STOCK.map(x=>{const free=stockFree(x);const pct=Math.min(100,free/(x.min*2)*100);
     return `<div class="fr" style="grid-template-columns:118px 1fr 62px"><span class="mono" style="font-size:9.4px">${sz(x.size).n}</span>
     <div class="bar"><i style="--w:${pct}%;background:${free<x.min?'var(--red)':free<x.min*1.5?'var(--amber)':'var(--green)'}"></i></div>
     <b>${free} подд.</b></div>`}).join('')}
    ${STOCK.filter(x=>stockFree(x)<x.min).length?`<div class="note" style="--tone:var(--red)"><b>Нужен заказ с завода</b><p>${STOCK.filter(x=>stockFree(x)<x.min).map(x=>sz(x.size).n+' — свободно '+stockFree(x)+' при минимуме '+x.min).join('; ')}. Система уже подготовила заявку на производство.</p></div>`:''}
    <button class="btn acc" style="width:100%;margin-top:9px" onclick="toast('Заявка на завод сформирована по позициям ниже минимума — с расчётом, сколько поддонов нужно до нормы.')">Заявка на завод</button>
   </div>
   <div class="panel" style="margin-top:11px"><div class="ph-title">Оборот склада за месяц</div>
    <div class="kv"><span>Поступило с завода</span><b class="mono">418 подд.</b></div>
    <div class="kv"><span>Отгружено клиентам</span><b class="mono">386 подд.</b></div>
    <div class="kv"><span>Бой и списание</span><b class="mono">6 подд. · 1,5%</b></div>
    <div class="kv"><span>Оборачиваемость</span><b class="mono">18 дней</b></div>
   </div>
  </div>
 </div>`};
function stockCard(id){recalcReserve();const x=stockOf(id);const s0=sz(id);
 const orders=ORDERS.filter(o=>o.size===id&&['ok','ttn'].includes(o.st));
 openD('Склад · '+s0.n,`${s0.d} · ${x.loc}`,
 `<div class="panel" style="margin-bottom:11px">
   <div class="kv"><span>На складе</span><b>${x.pal} поддонов · ${num(stockVol(x))} м³ · ${fmt(x.pal*s0.per)} блоков</b></div>
   <div class="kv"><span>Зарезервировано под заявки</span><b>${x.res} поддонов</b></div>
   <div class="kv"><span>Свободно к продаже</span><b style="color:${stockFree(x)<x.min?'var(--red)':'var(--green)'}">${stockFree(x)} поддонов</b></div>
   <div class="kv"><span>Минимальный остаток</span><b>${x.min} поддонов</b></div>
   <div class="kv"><span>Норма на поддон</span><b>${s0.per} блоков · ${num(palVol(s0))} м³</b></div>
  </div>
  ${orders.length?`<div class="panel" style="margin-bottom:11px"><div class="ph-title" style="font-size:11.6px;margin-bottom:7px">Резерв под заявки</div>
   ${orders.map(o=>`<div class="kv" style="cursor:pointer" onclick="closeD();openOrder('${o.no}')"><span>${o.no} · ${esc(o.cl)}</span><b>${calcOrder(o.m3,o.size).pal} подд.</b></div>`).join('')}</div>`:''}
  <div class="btns"><button class="btn acc" onclick="closeD();stockForm('Приход','${id}')">+ Приход</button>
  <button class="btn" onclick="closeD();stockForm('Списание','${id}')">− Списание</button>
  <button class="btn" onclick="toast('История движения по этой позиции за период.')">История позиции</button></div>`)}
function stockForm(t,id){const cur=id||STOCK[0].size;
 openD(t==='Приход'?'Приход с завода':'Списание со склада',t==='Приход'?'Поступление партии на площадку':'Бой, брак или пересорт — с указанием причины',
 `<div class="f2"><div class="fld"><label>Размер газоблока</label><select id="sfSize">${STOCK.map(x=>`<option value="${x.size}" ${x.size===cur?'selected':''}>${sz(x.size).n} · ${sz(x.size).d}</option>`).join('')}</select></div>
  <div class="fld"><label>Количество, поддонов</label><input id="sfPal" inputmode="numeric" value="${t==='Приход'?'40':'2'}" oninput="sfPrev()"></div></div>
  <div class="fld"><label>${t==='Приход'?'Документ / партия':'Причина и акт'}</label><input id="sfDoc" value="${t==='Приход'?'Партия №П-419 с завода':'Бой при погрузке, акт №15'}"></div>
  <div class="calc"><div class="cl">ЧТО ИЗМЕНИТСЯ НА СКЛАДЕ</div><div class="cg" id="sfCalc"></div>
   <div class="cn">Поддоны пересчитываются в блоки и м³ по норме этого размера — вводить объём вручную не нужно.</div></div>
  <div class="btns"><button class="btn acc" onclick="stockSave('${t}')">${t==='Приход'?'Оприходовать':'Списать'}</button><button class="btn" onclick="closeD()">Отмена</button></div>`);
 sfPrev()}
function sfPrev(){const id=document.getElementById('sfSize').value;const n=parseInt(document.getElementById('sfPal').value)||0;
 const x=stockOf(id),s0=sz(id);
 document.getElementById('sfCalc').innerHTML=`<div><b>${n}</b><small>поддонов</small></div><div><b>${fmt(n*s0.per)}</b><small>блоков</small></div><div><b>${num(n*palVol(s0))}</b><small>м³</small></div>`}
function stockSave(t){const id=document.getElementById('sfSize').value;const n=parseInt(document.getElementById('sfPal').value)||0;
 const doc=document.getElementById('sfDoc').value;const x=stockOf(id);
 if(!n)return toast('Укажите количество поддонов.');
 x.pal=t==='Приход'?x.pal+n:Math.max(0,x.pal-n);
 STOCK_MOVES.unshift({t,d:'сейчас',size:id,pal:n,who:'Нурбек',doc,sum:0});
 closeD();render();if(t==='Приход')sparks();
 toast(`${t}: <b>${n} поддонов</b> ${sz(id).n} (${fmt(n*sz(id).per)} блоков, ${num(n*palVol(sz(id)))} м³). Остаток стал ${x.pal} поддонов.`)}
function stockInv(){openD('Инвентаризация склада','Пересчёт по площадкам: вводим факт, система показывает расхождение',
 `<div class="tw"><table class="data" style="min-width:520px"><thead><tr><th>Размер</th><th class="right">По учёту</th><th style="width:110px">Факт</th><th class="right">Расхождение</th></tr></thead><tbody>
 ${STOCK.map(x=>`<tr style="cursor:default"><td class="mono">${sz(x.size).n}</td><td class="right mono">${x.pal}</td>
  <td><input class="search" style="min-width:0;padding:6px 8px;text-align:center" id="iv_${x.size}" value="${x.pal}" oninput="ivDiff('${x.size}',${x.pal})"></td>
  <td class="right mono" id="ivd_${x.size}">—</td></tr>`).join('')}
 </tbody></table></div>
 <div class="note" style="--tone:var(--amber)"><b>Как это работает</b><p>Кладовщик обходит площадки и вводит фактическое число поддонов. Система сама покажет недостачу или излишек, а после проведения запишет расхождения в историю с автором и датой.</p></div>
 <div class="btns"><button class="btn acc" onclick="ivSave()">Провести инвентаризацию</button><button class="btn" onclick="closeD()">Отмена</button></div>`)}
function ivDiff(id,was){const v=parseInt(document.getElementById('iv_'+id).value);const d=(isNaN(v)?was:v)-was;
 const el=document.getElementById('ivd_'+id);
 el.innerHTML=d?`<b style="color:${d<0?'var(--red)':'var(--green)'}">${d>0?'+':''}${d}</b>`:'—'}
function ivSave(){let diff=0;
 STOCK.forEach(x=>{const v=parseInt(document.getElementById('iv_'+x.size).value);if(!isNaN(v)&&v!==x.pal){diff++;x.pal=v}});
 STOCK_MOVES.unshift({t:'Инвентаризация',d:'сейчас',size:'—',pal:0,who:'Нурбек',doc:diff?`Пересчёт · расхождений: ${diff} позиц.`:'Пересчёт · расхождений нет',sum:0});
 closeD();render();
 toast(diff?`Инвентаризация проведена: расхождения по <b>${diff}</b> позициям записаны в историю с автором и датой.`:'Инвентаризация проведена: <b>расхождений нет</b>, остатки подтверждены.')}

/* ================= КАЛЬКУЛЯТОР ================= */
let CALC={mode:'wall',size:'s1',m3:'24',L:'40',H:'3',T:'300',open:'18',co:0};
const PRESETS=[
 {n:'Дом 100 м²',L:'42',H:'3',T:'300',open:'22',size:'s1'},
 {n:'Коттедж 180 м²',L:'64',H:'3.2',T:'375',open:'34',size:'s1'},
 {n:'Гараж 6×8',L:'28',H:'2.7',T:'200',open:'12',size:'s3'},
 {n:'Перегородки в квартире',L:'34',H:'2.7',T:'100',open:'8',size:'s5'},
 {n:'Забор 60 м',L:'60',H:'2',T:'200',open:'0',size:'s3'}];
function preset(i){const x=PRESETS[i];CALC.mode='wall';CALC.L=x.L;CALC.H=x.H;CALC.T=x.T;CALC.open=x.open;CALC.size=x.size;render();
 toast(`Подставлен типовой объект «${x.n}»: стены ${x.L} м × ${x.H} м, толщина ${x.T} мм, проёмы ${x.open} м².`)}
SC.calc=()=>{const s0=sz(CALC.size);recalcReserve();const seeStock=ROLES[role].s.includes('stock');
 let vol=0,note='';
 if(CALC.mode==='vol'){vol=parseFloat(String(CALC.m3).replace(',','.'))||0;note='Объём задан вручную'}
 else{const L=parseFloat(CALC.L)||0,H=parseFloat(CALC.H)||0,T=(parseFloat(CALC.T)||0)/1000,op=parseFloat(CALC.open)||0;
  vol=Math.max(0,(L*H-op)*T);note=`(${num(L)} м × ${num(H)} м − ${num(op)} м² проёмов) × ${num(T)} м`}
 const c=calcOrder(vol,CALC.size);
 const goods=Math.round(c.vol*coPrice(CALC.co));
 const trips=Math.ceil(c.pal/14);
 const deliv=trips*PRICE.delivery;
 const vat=Math.round((goods+deliv)*PRICE.vat);
 return `<div class="head"><div><h2>Калькулятор</h2><p>Клиент звонит и спрашивает «сколько нужно и сколько стоит» — менеджер отвечает за минуту, не считая на бумаге. Можно считать от объёма или прямо от стен объекта.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Расчёт отправлен клиенту в WhatsApp: объём, поддоны, машины и сумма.')">📤 Отправить клиенту</button>
 <button class="btn acc" onclick="calcToOrder()">→ Создать заявку из расчёта</button></div></div>
 <div class="g21">
  <div class="panel">
   <div class="filters" style="margin-bottom:14px">
    <button class="filter ${CALC.mode==='wall'?'on':''}" onclick="CALC.mode='wall';render()">По стенам объекта</button>
    <button class="filter ${CALC.mode==='vol'?'on':''}" onclick="CALC.mode='vol';render()">По объёму в м³</button>
   </div>
   ${CALC.mode==='wall'?`
   <div class="f3">
    <div class="fld"><label>Длина всех стен, м</label><input inputmode="decimal" value="${esc(CALC.L)}" oninput="CALC.L=this.value;render()"></div>
    <div class="fld"><label>Высота стен, м</label><input inputmode="decimal" value="${esc(CALC.H)}" oninput="CALC.H=this.value;render()"></div>
    <div class="fld"><label>Толщина кладки, мм</label><select onchange="CALC.T=this.value;render()">${[100,150,200,250,300,375].map(t=>`<option value="${t}" ${String(CALC.T)===String(t)?'selected':''}>${t} мм</option>`).join('')}</select></div>
   </div>
   <div class="fld"><label>Проёмы (окна и двери), м²</label><input inputmode="decimal" value="${esc(CALC.open)}" oninput="CALC.open=this.value;render()"></div>
   <div class="note" style="--tone:var(--blue)"><b>Как считаем</b><p>${note} = <b>${num(vol)} м³</b> кладки. Дальше объём переводится в поддоны по нормам склада с округлением вверх до целого поддона.</p></div>
   `:`
   <div class="fld"><label>Объём, м³</label><input inputmode="decimal" value="${esc(CALC.m3)}" oninput="CALC.m3=this.value;render()"></div>
   `}
   <div class="f2" style="margin-top:6px">
    <div class="fld"><label>Размер газоблока</label><select onchange="CALC.size=this.value;render()">${SIZES.map(x=>`<option value="${x.id}" ${CALC.size===x.id?'selected':''}>${x.n} · ${x.d}</option>`).join('')}</select></div>
    <div class="fld"><label>Цена по компании</label><select onchange="CALC.co=+this.value;render()">${COMPANIES.map((x,i)=>`<option value="${i}" ${CALC.co===i?'selected':''}>${x} · ${fmt(PRICE.co[i])} ₸/м³</option>`).join('')}</select></div>
   </div>
   ${CALC.mode==='wall'&&(parseFloat(CALC.T)||0)&&sz(CALC.size).n.split('×')[1]!==String(CALC.T)?`<div class="note" style="--tone:var(--amber)"><b>Проверьте размер</b><p>Толщина кладки ${CALC.T} мм, а выбран блок шириной ${sz(CALC.size).n.split('×')[1]} мм. Для такой стены обычно берут блок ${CALC.T} мм — иначе кладка не сойдётся.</p></div>`:''}
   <div class="ph-title" style="margin:16px 0 8px">Типовые объекты</div>
   <p class="mini" style="margin-bottom:9px">Заготовки для частых запросов — нажали и сразу видите объём и сумму.</p>
   <div class="btns">${PRESETS.map((x,i)=>`<button class="btn" onclick="preset(${i})">${x.n}</button>`).join('')}</div>
   <div class="ph-title" style="margin:16px 0 8px">Подбор размера под стену</div>
   <p class="mini" style="margin-bottom:9px">Толщина кладки задана ${CALC.mode==='wall'?CALC.T+' мм':'—'} — система подсказывает, какой блок подходит и сколько его нужно.</p>
   <div class="tw"><table class="data" style="min-width:560px"><thead><tr><th>Размер</th><th>Назначение</th><th class="right">Блоков</th><th class="right">Поддонов</th><th>Под эту стену</th></tr></thead><tbody>
   ${SIZES.map(x=>{const cc=calcOrder(vol,x.id);const w=x.n.split('×')[1];
    const fit=CALC.mode==='wall'&&String(w)===String(CALC.T);
    return `<tr onclick="CALC.size='${x.id}';render()" style="${CALC.size===x.id?'background:var(--accs)':''}">
     <td class="mono"><b>${x.n}</b></td><td class="mini">${x.d}</td>
     <td class="right mono">${fmt(cc.blocks)}</td><td class="right mono">${cc.pal}</td>
     <td>${fit?'<span class="badge g">подходит</span>':CALC.mode==='wall'?`<span class="badge">стена ${w} мм</span>`:'—'}</td></tr>`}).join('')}
   </tbody></table></div>
   <div class="hint">Поддон у всех размеров одинаковый по объёму — <b>1,8 м³</b>, поэтому меняется только количество блоков, а число поддонов и сумма остаются теми же. Клиенту это объясняет, почему «мельче блок» не значит «дороже доставка».</div>
  </div>
  <div>
   <div class="calc"><div class="cl">РАСЧЁТ ДЛЯ КЛИЕНТА</div>
    <div class="cg"><div><b>${fmt(c.blocks)}</b><small>блоков</small></div><div><b>${c.pal}</b><small>поддонов</small></div><div><b>${num(c.vol)}</b><small>к отгрузке, м³</small></div></div>
    <div class="cn">Нужно по расчёту ${num(vol)} м³ → округляем вверх до целого поддона: <b style="color:#fff">${c.pal} подд. = ${num(c.vol)} м³</b><br>Норма: ${s0.per} блоков на поддон · поддон ${num(palVol(s0))} м³</div>
   </div>
   <div class="panel"><div class="ph-title">Стоимость</div>
    <div class="kv"><span>Газоблок · ${num(c.vol)} м³ × ${fmt(coPrice(CALC.co))} ₸</span><b>${fmt(goods)} ₸</b></div>
    <div class="kv"><span>Доставка · ${trips} ${trips===1?'рейс':'рейса'} манипулятора</span><b>${fmt(deliv)} ₸</b></div>
    <div class="kv"><span>НДС 12%</span><b>${fmt(vat)} ₸</b></div>
    <div class="kv"><span><b style="color:var(--txt);font-size:11.6px">Итого</b></span><b style="font-size:14px">${fmt(goods+deliv+vat)} ₸</b></div>
    <div class="kv"><span>Залог за поддоны (возвратный)</span><b>${fmt(c.pal*PRICE.deposit)} ₸</b></div>
    <div class="note" style="--tone:var(--acc)"><b>Сколько машин</b><p>Манипулятор берёт до 14 поддонов за рейс → нужно <b>${trips} ${trips===1?'заезд':'заезда'}</b>. Клиенту сразу называем и срок, и стоимость доставки.</p></div>
   </div>
   <div class="panel" style="margin-top:11px"><div class="ph-title">Раскладка по машинам</div>
    ${Array.from({length:trips},(_,i)=>{const on=Math.min(14,c.pal-i*14);
     return `<div class="fr" style="grid-template-columns:92px 1fr 72px"><span class="mono" style="font-size:9.4px">Заезд ${i+1}</span>
     <div class="bar"><i style="--w:${on/14*100}%"></i></div><b>${on} подд.</b></div>`}).join('')}
    ${seeStock?`<div class="kv" style="margin-top:6px"><span>Свободно на складе</span><b class="mono">${stockFree(stockOf(CALC.size))} подд.</b></div>
    <div class="kv"><span>Хватает на этот заказ</span><b class="mono" style="color:${stockFree(stockOf(CALC.size))>=c.pal?'var(--green)':'var(--red)'}">${stockFree(stockOf(CALC.size))>=c.pal?'да':'нет, нужен завоз'}</b></div>`
    :`<div class="kv" style="margin-top:6px"><span>Срок поставки</span><b class="mono">1–2 дня</b></div>`}
   </div>
  </div>
 </div>`};
function calcToOrder(){const s0=sz(CALC.size);
 let vol=CALC.mode==='vol'?(parseFloat(String(CALC.m3).replace(',','.'))||0)
  :Math.max(0,((parseFloat(CALC.L)||0)*(parseFloat(CALC.H)||0)-(parseFloat(CALC.open)||0))*((parseFloat(CALC.T)||0)/1000));
 if(!vol)return toast('Заполните размеры стен или объём — тогда расчёт можно превратить в заявку.');
 NF={cl:'',ph:'+7 ',obj:'',addr:'',date:'26.08.2026',reis:1,size:CALC.size,m3:String(Math.round(vol*10)/10),drv:0,cmt:`Расчёт по калькулятору: ${num(vol)} м³`};
 go(ROLES[role].s.includes('newpc')?'newpc':'orders');
 toast(`Расчёт перенесён в заявку: <b>${num(vol)} м³</b> размера ${s0.n}. Осталось указать клиента и адрес.`)}

/* ================= ЗАДАЧИ · ДОСКА ================= */
let dragId=null;
SC.tasks=()=>`
 <div class="head"><div><h2>Задачи</h2><p>Доска в стиле Trello: карточку можно перетащить мышью в другую колонку. Внутри — чек-лист, срок, ответственный и обсуждение. Задача привязывается к заказу, компании или складу.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Фильтр: только мои задачи, просроченные, по компании или по заказу.')">Фильтры</button>
 <button class="btn acc" onclick="taskNew()">+ Задача</button></div></div>
 <div class="strip">
  <div><small>ВСЕГО ЗАДАЧ</small><b>${TASKS.length}</b><span>на доске</span></div>
  <div><small>В РАБОТЕ</small><b class="a">${TASKS.filter(t=>t.col==='work').length}</b><span>взяты в работу</span></div>
  <div><small>ЖДЁМ ОТВЕТА</small><b>${TASKS.filter(t=>t.col==='wait').length}</b><span>от клиента или партнёра</span></div>
  <div><small>ВЫСОКИЙ ПРИОРИТЕТ</small><b class="r">${TASKS.filter(t=>t.pri==='высокий'&&t.col!=='done').length}</b><span>горит</span></div>
  <div><small>ГОТОВО ЗА НЕДЕЛЮ</small><b class="g">${TASKS.filter(t=>t.col==='done').length+11}</b><span>закрыто</span></div>
 </div>
 <div class="board">
 ${TCOLS.map(([k,name,color])=>{const list=TASKS.filter(t=>t.col===k);
  return `<div class="tcol" id="col_${k}" ondragover="colOver(event,'${k}')" ondragleave="colOut('${k}')" ondrop="taskDrop('${k}')">
   <div class="tcol-h"><b style="color:${color}">${name}</b><span class="badge">${list.length}</span></div>
   ${list.map(t=>{const done=t.sub.filter(s=>s[1]).length;
    return `<div class="tcard" style="border-left:3px solid ${color}" draggable="true" ondragstart="taskDrag(event,${t.id})" ondragend="this.classList.remove('drag')" onclick="taskCard(${t.id})">
     <div style="display:flex;justify-content:space-between;gap:6px;align-items:flex-start">
      <b>${esc(t.t)}</b>${t.pri==='высокий'?'<span class="badge r" style="flex:none">!</span>':''}</div>
     <div class="sub" style="margin-top:5px">${t.link?`<span class="badge" style="font-size:7.4px">${esc(t.link)}</span> `:''}до ${t.due}</div>
     ${t.sub.length?`<div style="display:flex;align-items:center;gap:6px;margin-top:7px">
      <div class="bar" style="flex:1;height:5px"><i style="--w:${done/t.sub.length*100}%;background:${done===t.sub.length?'var(--green)':color}"></i></div>
      <span class="mono" style="font-size:8px;color:var(--muted)">${done}/${t.sub.length}</span></div>`:''}
     <div class="trow"><span class="mini">${t.who}</span>${t.chat.length?`<span class="mini">💬 ${t.chat.length}</span>`:''}</div>
    </div>`}).join('')||'<p class="mini" style="padding:8px 2px">Перетащите карточку сюда</p>'}
  </div>`}).join('')}
 </div>
 <div class="hint"><b>Зачем это в системе заявок:</b> «перезвонить по долгу», «разбить перегруженный рейс», «заказать поддоны» — всё это сейчас живёт в голове и в переписке. Здесь задача привязана к конкретному заказу или компании, видно срок и кто отвечает.</div>`;
function taskDrag(e,id){dragId=id;e.currentTarget.classList.add('drag');try{e.dataTransfer.setData('text/plain',String(id));e.dataTransfer.effectAllowed='move'}catch(_){}}
function colOver(e,k){e.preventDefault();const el=document.getElementById('col_'+k);if(el)el.classList.add('over')}
function colOut(k){const el=document.getElementById('col_'+k);if(el)el.classList.remove('over')}
function taskDrop(col){colOut(col);if(!dragId)return;const t=TASKS.find(x=>x.id===dragId);const was=TCOLS.find(c=>c[0]===t.col)[1];
 if(t.col!==col){t.col=col;const now=TCOLS.find(c=>c[0]===col)[1];render();
  toast(`Задача «${esc(t.t.slice(0,40))}…» переехала: <b>${was} → ${now}</b>.`)}
 dragId=null}
function taskCard(id){const t=TASKS.find(x=>x.id===id);const done=t.sub.filter(s=>s[1]).length;
 openD(t.t,`${t.who} · до ${t.due} · приоритет ${t.pri}${t.link?' · '+t.link:''}`,
 `<div class="panel" style="margin-bottom:11px">
   <div class="ph-title" style="font-size:11.6px;margin-bottom:8px">Чек-лист ${done}/${t.sub.length}</div>
   <div class="bar" style="margin-bottom:10px"><i style="--w:${t.sub.length?done/t.sub.length*100:0}%;background:${done===t.sub.length&&t.sub.length?'var(--green)':'var(--acc)'}"></i></div>
   ${t.sub.map((s,i)=>`<div class="chk ${s[1]?'on':''}" onclick="subToggle(${id},${i})"><i>${s[1]?'✓':''}</i><span>${esc(s[0])}</span></div>`).join('')||'<p class="mini">Чек-лист пуст.</p>'}
   <button class="btn" style="margin-top:9px" onclick="toast('Пункт добавлен в чек-лист.')">+ Пункт</button>
  </div>
  <div class="panel" style="margin-bottom:11px"><div class="ph-title" style="font-size:11.6px;margin-bottom:8px">Обсуждение</div>
   ${t.chat.map(c=>`<div class="msg"><div class="mh"><b>${c[0]}</b><time>${c[2]}</time></div><p>${esc(c[1])}</p></div>`).join('')||'<p class="mini">Сообщений пока нет.</p>'}
   <div style="display:flex;gap:7px;margin-top:9px"><input class="search" id="tmsg" placeholder="Написать в задачу…" onkeydown="if(event.key==='Enter')taskMsg(${id})">
   <button class="btn acc" onclick="taskMsg(${id})">Отправить</button></div>
  </div>
  <div class="btns">
   ${TCOLS.filter(c=>c[0]!==t.col).map(c=>`<button class="btn" onclick="taskMove(${id},'${c[0]}')">→ ${c[1]}</button>`).join('')}
  </div>`)}
function subToggle(id,i){const t=TASKS.find(x=>x.id===id);t.sub[i][1]=t.sub[i][1]?0:1;taskCard(id);
 const done=t.sub.filter(s=>s[1]).length;
 if(done===t.sub.length&&t.sub.length)toast('Все пункты выполнены — можно двигать задачу в «Готово».')}
function taskMsg(id){const el=document.getElementById('tmsg');const v=el.value.trim();if(!v)return;
 const t=TASKS.find(x=>x.id===id);t.chat.push([ROLES[role].n,v,'сейчас']);taskCard(id);
 toast('Сообщение добавлено в задачу — ответственный получит уведомление.')}
function taskMove(id,col){const t=TASKS.find(x=>x.id===id);t.col=col;closeD();render();
 toast(`Задача перенесена в «${TCOLS.find(c=>c[0]===col)[1]}».`)}
function taskNew(){openD('Новая задача','Кому, до какого срока и по какому заказу',
 `<div class="fld"><label>Что нужно сделать</label><input id="tnT" placeholder="Перезвонить по долгу за поддоны"></div>
  <div class="f3">
   <div class="fld"><label>Ответственный</label><select id="tnW"><option>Айдана</option><option>Нурбек</option><option>Бухгалтерия</option><option>Асель</option><option>Администратор</option></select></div>
   <div class="fld"><label>Срок</label><input id="tnD" value="28.08"></div>
   <div class="fld"><label>Приоритет</label><select id="tnP"><option>обычный</option><option>высокий</option></select></div>
  </div>
  <div class="fld"><label>Связать с заказом или компанией</label><select id="tnL"><option value="">— без связи —</option>${ORDERS.slice(0,5).map(o=>`<option>${o.no}</option>`).join('')}${COMPANIES.map(c=>`<option>${c}</option>`).join('')}<option>Склад</option></select></div>
  <div class="btns"><button class="btn acc" onclick="taskSave()">Создать задачу</button><button class="btn" onclick="closeD()">Отмена</button></div>`)}
function taskSave(){const t=document.getElementById('tnT').value.trim();
 if(!t)return toast('Опишите задачу.');
 TASKS.unshift({id:taskSeq++,col:'new',t,who:document.getElementById('tnW').value,due:document.getElementById('tnD').value,
  pri:document.getElementById('tnP').value,link:document.getElementById('tnL').value,sub:[],chat:[]});
 closeD();go('tasks');sparks();
 toast(`Задача создана и назначена. Ответственный увидит её у себя на доске и получит уведомление.`)}

/* ================= БУХГАЛТЕРИЯ ================= */
const invSt=k=>({paid:['оплачен','g'],part:['частично','a'],over:['просрочен','r'],new:['выставлен','b']}[k]||['—','']);

SC.bill=()=>{const ship=ORDERS.filter(o=>['ttn','road','done'].includes(o.st));
 const noInv=ship.filter(o=>!INVOICES.some(i=>i.order===o.no));
 return `<div class="head"><div><h2>Счета и реализация</h2><p>Счёт собирается из заказа автоматически: объём к отгрузке × цена этой компании + доставка + возвратный залог за поддоны. Бухгалтеру не нужно пересчитывать вручную и сверяться с ТТН.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Пакет закрывающих документов за август по компании сформирован: счета, накладные, акты, счета-фактуры — одним архивом.')">Пакет документов за месяц</button>
 <button class="btn" onclick="toast('Реестр счетов выгружен в Excel.')">⬇ Excel</button></div></div>
 <div class="strip">
  <div><small>ВЫСТАВЛЕНО ЗА МЕСЯЦ</small><b>${fmt(INVOICES.reduce((a,i)=>a+i.sum,0))} ₸</b><span>${INVOICES.length} счетов</span></div>
  <div><small>ОПЛАЧЕНО</small><b class="g">${fmt(INVOICES.reduce((a,i)=>a+i.paid,0))} ₸</b><span>${Math.round(INVOICES.reduce((a,i)=>a+i.paid,0)/INVOICES.reduce((a,i)=>a+i.sum,0)*100)}% от выставленного</span></div>
  <div><small>ДОЛГ ПО СЧЕТАМ</small><b class="r">${fmt(INVOICES.reduce((a,i)=>a+(i.sum-i.paid),0))} ₸</b><span>из них просрочено ${fmt(INVOICES.filter(i=>i.st==='over').reduce((a,i)=>a+(i.sum-i.paid),0))} ₸</span></div>
  <div><small>ОТГРУЖЕНО БЕЗ СЧЁТА</small><b class="a">${noInv.length}</b><span>нужно выставить</span></div>
  <div><small>ЗАЛОГ ЗА ПОДДОНЫ</small><b>192 500 ₸</b><span>возвратный, у клиентов</span></div>
 </div>
 ${noInv.length?`<div class="panel" style="margin-bottom:11px"><div class="ph"><div><div class="ph-title">Отгружено, но счёт не выставлен</div><div class="ph-sub">система сама находит такие заказы — деньги не теряются</div></div><span class="badge a">${noInv.length}</span></div>
  <div class="tw"><table class="data" style="min-width:820px"><thead><tr><th>Заказ</th><th>Компания</th><th>Клиент · объект</th><th class="right">Объём</th><th class="right">Цена за м³</th><th class="right">Сумма с НДС</th><th></th></tr></thead><tbody>
  ${noInv.map(o=>{const m=orderSum(o);return `<tr onclick="openOrder('${o.no}')">
   <td class="mono"><b>${o.no}</b><div class="sub">${o.date}</div></td><td><b>${COMPANIES[o.co]}</b></td>
   <td class="mini">${esc(o.cl)}<div class="sub">${esc(o.obj)}</div></td>
   <td class="right mono">${num(m.vol)} м³<div class="sub">${m.pal} подд.</div></td>
   <td class="right mono">${fmt(coPrice(o.co))} ₸</td>
   <td class="right mono"><b>${fmt(m.total)} ₸</b><div class="sub">+ залог ${fmt(m.dep)}</div></td>
   <td><button class="btn acc" onclick="event.stopPropagation();makeInvoice('${o.no}')">Выставить счёт</button></td></tr>`}).join('')}
  </tbody></table></div></div>`:''}
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:900px"><thead><tr>
  <th>Счёт</th><th>Заказ</th><th>Компания</th><th>Выставлен</th><th>Оплатить до</th><th class="right">Сумма</th><th class="right">Оплачено</th><th class="right">Остаток</th><th>Статус</th></tr></thead><tbody>
 ${INVOICES.map(i=>{const t=invSt(i.st);return `<tr onclick="openInvoice('${i.no}')">
  <td class="mono"><b>${i.no}</b></td><td class="mono" style="font-size:10px">${i.order}</td>
  <td>${COMPANIES[i.co]}</td><td class="mono" style="font-size:10px">${i.date}</td>
  <td class="mono" style="font-size:10px;${i.st==='over'?'color:var(--red);font-weight:700':''}">${i.due}</td>
  <td class="right mono"><b>${fmt(i.sum)} ₸</b></td>
  <td class="right mono">${fmt(i.paid)} ₸</td>
  <td class="right mono ${i.sum-i.paid?'':''}" style="${i.sum-i.paid?'color:var(--red);font-weight:700':'color:var(--green)'}">${i.sum-i.paid?fmt(i.sum-i.paid)+' ₸':'—'}</td>
  <td><span class="badge ${t[1]}">${t[0]}</span></td></tr>`}).join('')}
 </tbody></table></div></div>
 <div class="hint"><b>Откуда берутся цифры:</b> объём — из ТТН по факту отгрузки, цена — из прайса конкретной компании, доставка — по тарифу за рейс, залог — по числу поддонов. Если завсклада изменил количество, счёт пересчитается, а в истории останется, кто и когда правил.</div>`};

function makeInvoice(no){const o=ORDERS.find(x=>x.no===no);const m=orderSum(o);
 const inv={no:'СЧ-2026-0'+(invSeq++),order:o.no,co:o.co,date:'25.08.2026',due:'01.09.2026',sum:m.total,paid:0,st:'new'};
 INVOICES.unshift(inv);
 o.hist.push(['Выставлен счёт','Бухгалтерия','сейчас',`${inv.no} на ${fmt(m.total)} ₸ (товар ${fmt(m.goods)} + доставка ${fmt(m.deliv)} + НДС ${fmt(m.vat)})`]);
 render();sparks();
 toast(`Счёт <b>${inv.no}</b> на ${fmt(m.total)} ₸ выставлен компании «${COMPANIES[o.co]}» и отправлен ей в кабинет и на почту. Залог за поддоны ${fmt(m.dep)} ₸ учтён отдельной строкой.`)}

function openInvoice(no){const i=INVOICES.find(x=>x.no===no);const o=ORDERS.find(x=>x.no===i.order);
 const m=o?orderSum(o):{goods:i.sum,deliv:0,vat:0,total:i.sum,dep:0,vol:0,pal:0};
 openD('Счёт '+i.no,`${COMPANIES[i.co]} · заказ ${i.order} · ${invSt(i.st)[0]}`,
 `<div class="ttn" style="max-width:none">
   <div class="ttn-top"><div><div class="t">Счёт на оплату № ${i.no}</div><div class="mini">от ${i.date} · ТК «Газаблок»</div></div>
    <div class="n"><b style="font-size:15px;color:var(--txt)">${fmt(i.sum)} ₸</b><div>оплатить до ${i.due}</div></div></div>
   <div class="g2" style="margin:0">
    <div><h4>Поставщик</h4><div style="font-size:11px"><b>ТК «Газаблок»</b><br>г. Астана · БИН 000000000000<br>счёт KZ00 000 0000 0000 0000</div></div>
    <div><h4>Покупатель</h4><div style="font-size:11px"><b>${COMPANIES[i.co]}</b><br>договор поставки № ${20+i.co}/2026<br>основание: заказ ${i.order}</div></div>
   </div>
   <h4>Расчёт</h4>
   <table class="tt"><tr><th>Наименование</th><th class="r">Кол-во</th><th class="r">Цена</th><th class="r">Сумма</th></tr>
    <tr><td>Газоблок автоклавный${o?' '+sz(o.size).n:''}</td><td class="r">${num(m.vol)} м³</td><td class="r">${fmt(coPrice(i.co))} ₸</td><td class="r">${fmt(m.goods)} ₸</td></tr>
    <tr><td>Доставка манипулятором</td><td class="r">1 рейс</td><td class="r">${fmt(m.deliv)} ₸</td><td class="r">${fmt(m.deliv)} ₸</td></tr>
    <tr><td colspan="3"><b>Итого без НДС</b></td><td class="r"><b>${fmt(m.net)} ₸</b></td></tr>
    <tr><td colspan="3">НДС 12%</td><td class="r">${fmt(m.vat)} ₸</td></tr>
    <tr><td colspan="3"><b>Всего к оплате</b></td><td class="r"><b style="font-size:12px">${fmt(m.total)} ₸</b></td></tr>
    <tr><td colspan="3">Залог за поддоны (${m.pal} шт × ${fmt(PRICE.deposit)} ₸) — возвратный</td><td class="r">${fmt(m.dep)} ₸</td></tr></table>
   <div class="sig"><div><u></u>Руководитель</div><div><u></u>Главный бухгалтер</div></div>
  </div>
  <div class="btns" style="margin-top:12px">
   <button class="btn" onclick="window.print()">🖨 Печать</button>
   <button class="btn" onclick="toast('Счёт отправлен компании в кабинет и на почту, дублируется в WhatsApp менеджеру.')">📤 Отправить компании</button>
   ${i.sum-i.paid>0?`<button class="btn gr" onclick="payInv('${i.no}')">💳 Отметить оплату ${fmt(i.sum-i.paid)} ₸</button>`:''}
   <button class="btn" onclick="toast('Сформированы накладная и электронная счёт-фактура по этой реализации.')">Накладная и ЭСФ</button>
  </div>
  ${i.st==='over'?'<div class="note" style="--tone:var(--red)"><b>Просрочен</b><p>Срок оплаты прошёл. Система напоминает менеджеру компании и показывает долг в разделе «Взаиморасчёты».</p></div>':''}`)}
function payInv(no){const i=INVOICES.find(x=>x.no===no);const был=i.sum-i.paid;
 i.paid=i.sum;i.st='paid';
 PAYMENTS.unshift({d:'25.08.2026',co:i.co,sum:был,src:'Банк · Kaspi',inv:i.no,note:'оплата по счёту'});
 closeD();render();sparks();
 toast(`Оплата ${fmt(был)} ₸ по счёту <b>${no}</b> проведена: счёт закрыт, долг компании «${COMPANIES[i.co]}» уменьшился, платёж попал в поступления.`)}

SC.pay=()=>`
 <div class="head"><div><h2>Поступления оплат</h2><p>Банк и касса в одном списке. Платёж привязывается к счёту и компании — сальдо пересчитывается сразу, без ручной сверки в конце месяца.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Загрузка банковской выписки: файл из клиент-банка разносится по счетам автоматически, спорные платежи подсвечиваются.')">⬆ Загрузить выписку</button>
 <button class="btn acc" onclick="toast('Ручное поступление: сумма, дата, компания, счёт, источник — банк или касса.')">+ Поступление</button></div></div>
 <div class="strip">
  <div><small>ПОСТУПИЛО ЗА МЕСЯЦ</small><b>${fmt(PAYMENTS.reduce((a,p)=>a+p.sum,0))} ₸</b><span>${PAYMENTS.length} платежей</span></div>
  <div><small>ЧЕРЕЗ БАНК</small><b>${fmt(PAYMENTS.filter(p=>p.src.includes('Банк')).reduce((a,p)=>a+p.sum,0))} ₸</b><span>Kaspi и Halyk</span></div>
  <div><small>НАЛИЧНЫМИ</small><b>${fmt(PAYMENTS.filter(p=>p.src==='Касса').reduce((a,p)=>a+p.sum,0))} ₸</b><span>приходный ордер</span></div>
  <div><small>НЕ РАЗНЕСЕНО</small><b class="a">0</b><span>все платежи привязаны</span></div>
  <div><small>СРЕДНИЙ СРОК ОПЛАТЫ</small><b>4,2 дня</b><span>от счёта до денег</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:760px"><thead><tr><th>Дата</th><th>Компания</th><th>Счёт</th><th>Источник</th><th>Назначение</th><th class="right">Сумма</th></tr></thead><tbody>
 ${PAYMENTS.map(p=>`<tr onclick="toast('Платёж ${fmt(p.sum)} ₸ от ${COMPANIES[p.co]}: привязан к счёту ${p.inv}, виден в сальдо и в акте сверки.')">
  <td class="mono" style="font-size:10px">${p.d}</td><td><b>${COMPANIES[p.co]}</b></td>
  <td class="mono" style="font-size:10px">${p.inv}</td>
  <td><span class="badge ${p.src==='Касса'?'a':'b'}">${p.src}</span></td>
  <td class="mini">${p.note}</td><td class="right mono"><b>${fmt(p.sum)} ₸</b></td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint"><b>Разнесение по счетам:</b> при загрузке выписки система сама сопоставляет платёж со счётом по номеру в назначении. Если совпадения нет — платёж подсвечивается, и бухгалтер привязывает его вручную в один клик.</div>`;

SC.debt=()=>`
 <div class="head"><div><h2>Взаиморасчёты с компаниями</h2><p>Сколько отгружено, сколько оплачено и сколько должны — по каждому партнёру. Акт сверки формируется за любой период одной кнопкой.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Напоминания о задолженности отправлены менеджерам компаний в WhatsApp с приложением акта сверки.')">Напомнить должникам</button>
 <button class="btn" onclick="toast('Выгрузка взаиморасчётов в Excel и 1С.')">⬇ Excel / 1С</button></div></div>
 <div class="strip">
  <div><small>ОТГРУЖЕНО ЗА МЕСЯЦ</small><b>${fmt(CO_BALANCE.reduce((a,b)=>a+b.ship,0))} ₸</b><span>по трём компаниям</span></div>
  <div><small>ОПЛАЧЕНО</small><b class="g">${fmt(CO_BALANCE.reduce((a,b)=>a+b.pay,0))} ₸</b><span>${Math.round(CO_BALANCE.reduce((a,b)=>a+b.pay,0)/CO_BALANCE.reduce((a,b)=>a+b.ship,0)*100)}%</span></div>
  <div><small>ДЕБИТОРКА</small><b class="r">${fmt(CO_BALANCE.reduce((a,b)=>a+(b.ship-b.pay),0))} ₸</b><span>текущая задолженность</span></div>
  <div><small>ПРОСРОЧЕНО</small><b class="r">864 000 ₸</b><span>1 счёт, 7 дней</span></div>
  <div><small>ЗАЛОГ ЗА ПОДДОНЫ</small><b>${fmt(CO_BALANCE.reduce((a,b)=>a+b.dep,0))} ₸</b><span>к возврату при сдаче</span></div>
 </div>
 <div class="panel" style="margin-bottom:11px"><div class="ph"><div><div class="ph-title">Сальдо по компаниям · август</div><div class="ph-sub">клик по строке — акт сверки за период</div></div></div>
  <div class="tw"><table class="data" style="min-width:860px"><thead><tr><th>Компания</th><th>Договор</th><th class="right">Отгружено</th><th class="right">Оплачено</th><th class="right">Долг</th><th class="right">Залог поддонов</th><th>Платёжная дисциплина</th></tr></thead><tbody>
  ${COMPANIES.map((c,i)=>{const b=CO_BALANCE[i];const debt=b.ship-b.pay;const pct=Math.round(b.pay/b.ship*100);
   return `<tr onclick="sverka(${i})"><td><b>${c}</b></td><td class="mono" style="font-size:10px">№ ${20+i}/2026</td>
   <td class="right mono">${fmt(b.ship)} ₸</td><td class="right mono">${fmt(b.pay)} ₸</td>
   <td class="right mono"><b style="color:${debt>1000000?'var(--red)':'var(--amber)'}">${fmt(debt)} ₸</b></td>
   <td class="right mono">${fmt(b.dep)} ₸</td>
   <td><div style="display:flex;align-items:center;gap:8px"><div class="bar" style="width:90px"><i style="--w:${pct}%;background:${pct>90?'var(--green)':pct>80?'var(--amber)':'var(--red)'}"></i></div><b class="mono" style="font-size:10px">${pct}%</b></div></td></tr>`}).join('')}
  </tbody></table></div>
 </div>
 <div class="g2">
  <div class="panel"><div class="ph-title">Дебиторка по срокам</div>
   ${[['Текущая (срок не наступил)',1652000,'var(--green)'],['До 7 дней просрочки',864000,'var(--amber)'],['8–30 дней',0,'var(--red)'],['Больше 30 дней',0,'#7f1d1d']]
     .map(r=>`<div class="fr"><span>${r[0]}</span><div class="bar"><i style="--w:${r[1]/1652000*100}%;background:${r[2]}"></i></div><b>${r[1]?fmt(r[1])+' ₸':'—'}</b></div>`).join('')}
   <div class="hint"><b>Просроченных долгов старше месяца нет.</b> Как только счёт перешагивает срок оплаты, менеджеру компании автоматически уходит напоминание, а долг подсвечивается здесь.</div>
  </div>
  <div class="panel"><div class="ph-title">Акт сверки</div>
   <p class="mini" style="margin-bottom:9px">Формируется за любой период: остаток на начало, отгрузки по датам и накладным, оплаты, остаток на конец. Готовый документ на подпись обеим сторонам.</p>
   ${COMPANIES.map((c,i)=>`<div class="kv" style="cursor:pointer" onclick="sverka(${i})"><span><b style="color:var(--txt);font-size:10.8px">${c}</b><div class="sub">договор № ${20+i}/2026</div></span><b style="color:var(--blue)">Сформировать →</b></div>`).join('')}
  </div>
 </div>`;
function sverka(i){const b=CO_BALANCE[i];
 openD('Акт сверки · '+COMPANIES[i],'ТК «Газаблок» и '+COMPANIES[i]+' · август 2026',
 `<div class="ttn" style="max-width:none">
   <div class="ttn-top"><div><div class="t">Акт сверки взаимных расчётов</div><div class="mini">за период 01.08.2026 — 31.08.2026</div></div>
    <div class="n"><b style="font-size:15px;color:var(--txt)">${fmt(b.ship-b.pay)} ₸</b><div>задолженность на конец</div></div></div>
   <div class="g2" style="margin:0">
    <div><h4>Сторона 1</h4><div style="font-size:11px"><b>ТК «Газаблок»</b><br>договор поставки № ${20+i}/2026</div></div>
    <div><h4>Сторона 2</h4><div style="font-size:11px"><b>${COMPANIES[i]}</b><br>менеджеры: ${MANAGERS.slice(0,2).join(', ')}</div></div>
   </div>
   <h4>Движение за период</h4>
   <table class="tt"><tr><th>Показатель</th><th class="r">Сумма, ₸</th></tr>
    <tr><td>Остаток на начало периода</td><td class="r">0</td></tr>
    <tr><td>Отгружено (реализация с НДС)</td><td class="r">${fmt(b.ship)}</td></tr>
    <tr><td>Оплачено</td><td class="r">${fmt(b.pay)}</td></tr>
    <tr><td><b>Остаток на конец периода (долг покупателя)</b></td><td class="r"><b>${fmt(b.ship-b.pay)}</b></td></tr>
    <tr><td>Справочно: залог за поддоны у покупателя</td><td class="r">${fmt(b.dep)}</td></tr></table>
   <div class="sig"><div><u></u>ТК «Газаблок»</div><div><u></u>${COMPANIES[i]}</div></div>
  </div>
  <div class="btns" style="margin-top:12px"><button class="btn" onclick="window.print()">🖨 Печать</button>
  <button class="btn" onclick="toast('Акт сверки отправлен компании на подпись — в кабинет и на почту.')">📤 Отправить на подпись</button>
  <button class="btn" onclick="toast('Расшифровка: все отгрузки и платежи периода построчно с номерами ТТН и счетов.')">Расшифровка построчно</button></div>`)}

SC.prices=()=>`
 <div class="head"><div><h2>Прайс и тарифы</h2><p>У каждой компании-перекупа своя договорная цена за м³. Здесь же тариф доставки, залог за поддон и ставка НДС — от них считаются все счета.</p></div>
 <div class="btns"><button class="btn" onclick="toast('История цен: когда и кем менялась цена по каждой компании. Старые счета не пересчитываются.')">История изменений цен</button></div></div>
 <div class="g2">
  <div class="panel"><div class="ph-title">Цена за м³ по компаниям</div>
   ${COMPANIES.map((c,i)=>`<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--line)">
    <div style="flex:1"><b style="font-size:11.4px">${c}</b><div class="sub">договор № ${20+i}/2026 · объём за месяц ${[612,428,244][i]} м³</div></div>
    <button class="btn" onclick="priceSet(${i},-500)">−500</button>
    <div style="width:110px;text-align:center"><b class="mono" style="font-size:17px">${fmt(PRICE.co[i])}</b><div class="sub">₸ за м³</div></div>
    <button class="btn" onclick="priceSet(${i},500)">+500</button></div>`).join('')}
   <div class="hint"><b>Пример:</b> заказ на 24 м³ размера 600×300×200 для «${COMPANIES[0]}» → 14 поддонов = 25,2 м³ × ${fmt(PRICE.co[0])} ₸ = <b>${fmt(Math.round(25.2*PRICE.co[0]))} ₸</b> + доставка ${fmt(PRICE.delivery)} ₸ + НДС.</div>
  </div>
  <div class="panel"><div class="ph-title">Общие тарифы</div>
   <div class="kv"><span>Доставка манипулятором (за рейс)</span><b class="mono">${fmt(PRICE.delivery)} ₸</b></div>
   <div class="kv"><span>Залог за поддон (возвратный)</span><b class="mono">${fmt(PRICE.deposit)} ₸</b></div>
   <div class="kv"><span>Ставка НДС</span><b class="mono">${PRICE.vat*100}%</b></div>
   <div class="kv"><span>Отсрочка платежа по умолчанию</span><b class="mono">7 дней</b></div>
   <div class="kv"><span>Штраф за невозврат поддона</span><b class="mono">залог удерживается</b></div>
   <div class="note" style="--tone:var(--amber)"><b>Как работают изменения</b><p>Новая цена применяется к заказам, созданным после изменения. Уже выставленные счета и подписанные документы не пересчитываются — иначе разъедется бухгалтерия.</p></div>
   <div class="note" style="--tone:var(--blue)"><b>Индивидуальные условия</b><p>Для отдельной компании можно задать свою отсрочку, скидку от объёма или бесплатную доставку от N м³ — это настраивается без разработчика.</p></div>
  </div>
 </div>`;
function priceSet(i,d){PRICE.co[i]=Math.max(1000,PRICE.co[i]+d);render();
 toast(`Цена для «${COMPANIES[i]}»: <b>${fmt(PRICE.co[i])} ₸ за м³</b>. Применяется к новым заказам, выставленные счета не меняются.`)}

SC.acct=()=>`
 <div class="head"><div><h2>Отчёты бухгалтерии</h2><p>Всё, что обычно собирается вручную в конце месяца, считается на живых данных: реализация, дебиторка, НДС, залоги и закрывающие документы.</p></div>
 <div class="btns"><select class="rsel"><option>Август 2026</option><option>Июль 2026</option><option>Квартал</option><option>Произвольный период</option></select>
 <button class="btn acc" onclick="toast('Выгрузка для 1С: реализация, оплаты, контрагенты и номенклатура — файлом для загрузки в бухгалтерскую программу.')">⬇ Выгрузка в 1С</button></div></div>
 <div class="strip">
  <div><small>РЕАЛИЗАЦИЯ ЗА МЕСЯЦ</small><b>21,03 млн ₸</b><span>с НДС</span></div>
  <div><small>НДС К УПЛАТЕ</small><b>2,25 млн ₸</b><span>12% от базы</span></div>
  <div><small>ПОСТУПИЛО ДЕНЕГ</small><b class="g">18,53 млн ₸</b><span>банк + касса</span></div>
  <div><small>ДЕБИТОРКА НА КОНЕЦ</small><b class="r">2,50 млн ₸</b><span>по трём компаниям</span></div>
  <div><small>ЗАЛОГИ У КЛИЕНТОВ</small><b>192 500 ₸</b><span>обязательство к возврату</span></div>
 </div>
 <div class="g2">
  <div class="panel"><div class="ph-title">Готовые отчёты</div>
   ${[['Реализация за период','дата, счёт, компания, объём, сумма, НДС'],
      ['Дебиторская задолженность','по компаниям и срокам просрочки'],
      ['Поступления оплат','банк и касса с разнесением по счетам'],
      ['Книга продаж / НДС','база, ставка, сумма налога по документам'],
      ['Залоги за поддоны','начислено, возвращено, остаток обязательств'],
      ['Акты сверки пакетом','по всем компаниям за период — одним архивом'],
      ['Закрывающие документы','счета, накладные, ЭСФ и акты за месяц']]
    .map(r=>`<div class="kv" style="cursor:pointer" onclick="toast('Отчёт «${r[0]}» выгружен в Excel: ${r[1]}.')"><span><b style="color:var(--txt);font-size:10.8px">${r[0]}</b><div class="sub">${r[1]}</div></span><b style="color:var(--green)">⬇ XLSX</b></div>`).join('')}
  </div>
  <div>
   <div class="panel"><div class="ph-title">Реализация по месяцам, млн ₸</div>
    <div style="display:flex;align-items:flex-end;gap:9px;height:130px;padding-top:12px">
     ${[['мар',12.6],['апр',14.4],['май',16.5],['июн',18.4],['июл',17.6],['авг',21.0]].map(m=>`<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px;height:100%">
      <b class="mono" style="font-size:9.2px">${String(m[1]).replace('.',',')}</b><div style="width:70%;height:${m[1]/21*100}%;background:var(--acc);border-radius:4px 4px 0 0"></div>
      <span style="font-size:8.4px;color:var(--muted)">${m[0]}</span></div>`).join('')}
    </div>
   </div>
   <div class="panel" style="margin-top:11px"><div class="ph-title">Что даёт бухгалтеру эта система</div>
    ${[['Счёт из отгрузки','не нужно переносить объёмы из ТТН в счёт руками'],
       ['Цена подтягивается сама','по договору конкретной компании, без поиска в переписке'],
       ['Дебиторка в реальном времени','видно долг сразу, а не в конце месяца'],
       ['Акт сверки за минуту','вместо ручного сведения таблиц']]
     .map(x=>`<div class="note" style="--tone:var(--acc)"><b>${x[0]}</b><p>${x[1]}</p></div>`).join('')}
   </div>
  </div>
 </div>`;

/* ===== КАРТОЧКА ЗАКАЗА ===== */
function openOrder(no){const o=ORDERS.find(x=>x.no===no);if(!o)return;const c=calcOrder(o.m3,o.size);
 const isTK=role.startsWith('ТК'),isWH=role==='Завсклада';
 openD('Заказ '+o.no,`${COMPANIES[o.co]} · менеджер ${MANAGERS[o.mgr]} · ${chipL(o.st)}`,
 `<div class="panel" style="margin-bottom:11px">
   <div class="kv"><span>Клиент</span><b>${esc(o.cl)} · ${esc(o.ph)}</b></div>
   <div class="kv"><span>Объект</span><b>${esc(o.obj)}</b></div>
   <div class="kv"><span>Адрес доставки</span><b>${esc(o.addr)}</b></div>
   <div class="kv"><span>Дата отгрузки · рейс</span><b>${o.date} · рейс ${o.reis}</b></div>
   <div class="kv"><span>Размер газоблока</span><b>${sz(o.size).n} · ${sz(o.size).d}</b></div>
   <div class="kv"><span>Водитель</span><b>${DRIVERS[o.drv].n} · ${DRIVERS[o.drv].car.split('· ')[1]}</b></div>
   ${o.ttn?`<div class="kv"><span>ТТН</span><b>${o.ttn}</b></div>`:''}
   ${o.cmt?`<div class="kv"><span>Комментарий</span><b style="font-weight:500">${esc(o.cmt)}</b></div>`:''}
  </div>
  <div class="calc"><div class="cl">РАСЧЁТ ПО ЗАЯВКЕ</div>
   <div class="cg"><div><b>${fmt(c.blocks)}</b><small>блоков</small></div><div><b>${c.pal}</b><small>поддонов</small></div><div><b>${num(c.vol)}</b><small>к отгрузке, м³</small></div></div>
   <div class="cn">Заявлено ${num(o.m3)} м³ → округление вверх до целого поддона · норма ${c.perPal} блоков на поддон · поддон ${num(c.palVol)} м³</div></div>
  <div class="panel" style="margin-bottom:11px"><div class="ph-title" style="font-size:11.6px;margin-bottom:7px">Деньги по заказу</div>
   ${(()=>{const m=orderSum(o);const inv=INVOICES.find(x=>x.order===o.no);return `
   <div class="kv"><span>Товар · ${num(m.vol)} м³ × ${fmt(coPrice(o.co))} ₸</span><b>${fmt(m.goods)} ₸</b></div>
   <div class="kv"><span>Доставка манипулятором</span><b>${fmt(m.deliv)} ₸</b></div>
   <div class="kv"><span>НДС 12%</span><b>${fmt(m.vat)} ₸</b></div>
   <div class="kv"><span><b style="color:var(--txt)">Итого к оплате</b></span><b style="font-size:12.6px">${fmt(m.total)} ₸</b></div>
   <div class="kv"><span>Залог за поддоны (${m.pal} × ${fmt(PRICE.deposit)} ₸)</span><b>${fmt(m.dep)} ₸ · возвратный</b></div>
   <div class="kv"><span>Счёт</span><b>${inv?`${inv.no} · ${invSt(inv.st)[0]}`:'не выставлен'}</b></div>`})()}
  </div>
  ${o.pallets.out?`<div class="panel" style="margin-bottom:11px"><div class="ph-title" style="font-size:11.6px;margin-bottom:7px">Поддоны</div>
   <div class="kv"><span>Выдано</span><b>${o.pallets.out}</b></div><div class="kv"><span>Возвращено</span><b>${o.pallets.back}</b></div>
   <div class="kv"><span>У клиента</span><b style="color:${o.pallets.out-o.pallets.back?'var(--red)':'var(--green)'}">${o.pallets.out-o.pallets.back}</b></div></div>`:''}
  <div class="btns" style="margin-bottom:13px">
   ${isTK&&o.st==='new'?`<button class="btn gr" onclick="setSt('${o.no}','ok')">✅ Подтвердить</button>
    <button class="btn" onclick="setSt('${o.no}','fix')">↩ Вернуть на исправление</button>
    <button class="btn rd" onclick="setSt('${o.no}','rej')">✕ Отклонить</button>`:''}
   ${isWH&&o.st==='ok'?`<button class="btn acc" onclick="makeTTN('${o.no}')">📄 Сформировать ТТН</button>`:''}
   ${o.ttn?`<button class="btn" onclick="closeD();openTTN('${o.no}')">Открыть ТТН</button>`:''}
   <button class="btn" onclick="toast('Печать карточки заказа.')">🖨 Печать</button>
  </div>
  <div class="ph-title" style="font-size:12px;margin-bottom:8px">История заказа</div>
  <div class="tl">${o.hist.map(h=>`<div class="tli"><b>${h[0]}</b><p>${h[1]}${h[3]?' · '+esc(h[3]):''}</p><time>${h[2]}</time></div>`).join('')}</div>
  <div class="hint"><b>Полная цепочка:</b> компания → менеджер → клиент → объект → заказ → ТТН → склад → водитель → отгрузка → доставка → поддоны.</div>`)}
function setSt(no,k){const o=ORDERS.find(x=>x.no===no);
 if(k==='ok'){recalcReserve();const x=stockOf(o.size);const need=calcOrder(o.m3,o.size).pal;
  if(x&&stockFree(x)<need){toast(`⚠ На складе свободно только <b>${stockFree(x)} поддонов</b> ${sz(o.size).n}, а по заявке нужно ${need}. Заявку можно подтвердить, но система уже поставила задачу на заказ с завода.`);
   TASKS.unshift({id:taskSeq++,col:'new',t:`Заказать с завода ${sz(o.size).n} — не хватает под заявку ${o.no}`,who:'Нурбек',due:'27.08',pri:'высокий',link:o.no,
    sub:[[`Нужно ${need} подд., свободно ${stockFree(x)}`,0]],chat:[]})}}
 o.st=k;
 const t={ok:['Подтверждена','подтверждена. Завсклада увидит её в разделе «К отгрузке».'],
  fix:['Возвращена на исправление','возвращена менеджеру на исправление — он получит уведомление.'],
  rej:['Отклонена','отклонена, менеджер уведомлён.']}[k];
 o.hist.push([t[0],'ТК Газаблок · Айдана','сейчас','']);
 closeD();render();toast(`Заявка <b>${no}</b> ${t[1]}`)}

/* ===== КАРКАС ===== */
function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([n,r],i)=>
 `<button class="role" onclick="enter('${n}')"><code>0${i+1}</code><b>${n}</b><span>${r.note}</span></button>`).join('')}
function enter(n){role=n;const r=ROLES[n];
 document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');
 document.getElementById('rav').textContent=r.av;document.getElementById('rname').textContent=r.n;document.getElementById('rrole').textContent=r.r;
 buildNav();const q=new URLSearchParams(location.search).get('s');go(q&&r.s.includes(q)?q:r.s[0]);
 toast(`Роль <b>${n}</b> — компьютерное рабочее место.`)}
function buildNav(){const al=ROLES[role].s;
 document.getElementById('nav').innerHTML=NAV.map(([g,items])=>{const x=items.filter(i=>al.includes(i[0]));
  return x.length?`<div class="nav-group">${g}</div>`+x.map(i=>`<button class="nav-item" data-go="${i[0]}" onclick="go('${i[0]}')"><i>${i[1]}</i><span>${i[2]}</span>${i[3]?`<span class="nav-badge">${i[3]}</span>`:'<span></span>'}</button>`).join(''):''}).join('');
 const s=document.getElementById('rsel');s.innerHTML=Object.keys(ROLES).map(n=>`<option ${n===role?'selected':''}>${n}</option>`).join('');s.onchange=()=>enter(s.value)}
function go(s){if(!ROLES[role].s.includes(s))s=ROLES[role].s[0];cur=s;
 document.getElementById('ttl').textContent=TITLES[s][0];document.getElementById('sub').textContent=TITLES[s][1];
 document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('on',x.dataset.go===s));
 render();document.getElementById('content').scrollTop=0;
 try{const u=new URL(location.href);u.searchParams.set('s',s);history.replaceState(null,'',u.pathname+'?'+u.searchParams.toString())}catch(e){}}
function render(){document.getElementById('content').innerHTML=`<div class="screen">${SC[cur]?SC[cur]():'<p class="mini">Раздел в разработке.</p>'}</div>`}
function openD(t,s,body){document.getElementById('dt').textContent=t;document.getElementById('ds').innerHTML=s;
 document.getElementById('db').innerHTML=body;document.getElementById('dbg').classList.add('show')}
function closeD(){document.getElementById('dbg').classList.remove('show')}
let tt;function toast(h){const t=document.getElementById('toast');t.innerHTML=h;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),5000)}
function sparks(){const c=['#ea580c','#f97316','#2563eb','#16a34a','#0f172a','#d97706'];
 for(let i=0;i<60;i++){const s=document.createElement('i');s.className='spark';
  s.style.cssText=`left:${Math.random()*100}vw;top:-14px;background:${c[i%6]};animation-delay:${Math.random()*.45}s;transform:rotate(${Math.random()*360}deg)`;
  document.body.appendChild(s);setTimeout(()=>s.remove(),2400)}}
const TOUR=[
 ['ТК Газаблок · диспетчер','orders','<b>Шаг 1.</b> Диспетчер видит все заявки партнёров таблицей: компания, менеджер, клиент, объём, поддоны, рейс и статус. Фильтры и поиск — обработка идёт пачкой, а не по одной карточке.',6000],
 ['ТК Газаблок · диспетчер','reis','<b>Шаг 2.</b> Заявки собираются в рейсы. Видно загрузку машины: рейс 1 перегружен (21 поддон при вместимости 14) — заявку можно перекинуть в свободный рейс.',5800],
 ['Завсклада','wh','<b>Шаг 3.</b> Завсклада работает только с подтверждёнными заявками: блоки и поддоны уже посчитаны, остаётся сформировать ТТН одной кнопкой.',5600],
 ['Завсклада','ttn','<b>Шаг 4.</b> ТТН на печать: грузоотправитель, получатель, перевозчик, груз с количеством и подписи. Ни одно поле не набрано руками — всё из заявки.',6000],
 ['Руководитель','dash','<b>Шаг 5.</b> Руководитель видит сводку: объёмы по компаниям, отгрузки по дням, что требует внимания и сколько поддонов зависло у клиентов.',5800],
 ['ТК Газаблок · диспетчер','calc','<b>Шаг 3.</b> Калькулятор: клиент спрашивает «сколько нужно на дом» — считаем прямо от стен, получаем поддоны, число рейсов и сумму, и одной кнопкой превращаем в заявку.',6000],
 ['Завсклада','stock','<b>Шаг 4.</b> Склад: остатки по размерам в поддонах, резерв под подтверждённые заявки и свободный остаток. Отгрузка списывается сама при формировании ТТН.',6000],
 ['ТК Газаблок · диспетчер','tasks','<b>Шаг 5.</b> Задачи в стиле Trello: карточки перетаскиваются между колонками, внутри чек-лист и обсуждение. Задача привязана к заказу или компании.',5800],
 ['Бухгалтер','bill','<b>Шаг 6.</b> Бухгалтерия: счёт собирается из отгрузки — объём × цена этой компании + доставка + залог за поддоны. Система сама находит отгрузки без счёта.',6000],
 ['Бухгалтер','debt','<b>Шаг 7.</b> Взаиморасчёты: отгружено, оплачено, долг и платёжная дисциплина по каждой компании. Акт сверки формируется за минуту.',5800],
 ['Администратор','norms','<b>Итог.</b> Нормы блоков на поддон задаёт администратор — от них считается вся система. Мобильная и компьютерная версии работают на одной базе.',5800]
];
let tourT=null,tourI=0;
function tour(){if(tourT){stopTour();return}tourI=0;const b=document.getElementById('tourBtn');if(b)b.textContent='■ Стоп';step()}
function step(){if(tourI>=TOUR.length){stopTour();sparks();toast('<b>Одна система — два интерфейса:</b> телефон для тех, кто в поле, компьютер для тех, кто за столом.');return}
 const [r,t,txt,ms]=TOUR[tourI++];
 if(role!==r)enter(r);
 setTimeout(()=>{go(t);toast(txt)},role!==r?350:0);
 tourT=setTimeout(step,ms)}
function stopTour(){clearTimeout(tourT);tourT=null;const b=document.getElementById('tourBtn');if(b)b.textContent='▶ Сценарий'}
renderRoles();
(function(){const q=new URLSearchParams(location.search).get('s');
 if(q){for(const [n,r] of Object.entries(ROLES))if(r.s.includes(q)){enter(n);go(q);return}}})();
