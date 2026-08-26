/* ТК Газаблок · КОМПЬЮТЕРНАЯ версия — интерфейс. Данные и расчёт — в gazablok-data.js */
const ROLES={
 'ТК Газаблок · диспетчер':{av:'АЙ',n:'Айдана',r:'ТК Газаблок · диспетчер',note:'Все заявки таблицей, подтверждение и рейсы',
  s:['orders','reis','wh','pallets','reports']},
 'Завсклада':{av:'НБ',n:'Нурбек',r:'Склад · завсклада',note:'Отгрузка, ТТН на печать, история изменений',
  s:['wh','ttn','pallets','hist']},
 'Руководитель':{av:'РК',n:'Руководитель',r:'ТК Газаблок · собственник',note:'Сводка по сети, объёмы, отчёты в Excel',
  s:['dash','orders','reports','pallets','admin']},
 'Менеджер · Аливиа':{av:'АС',n:'Асель',r:'Аливиа · менеджер',note:'Свои заявки и создание с компьютера',
  s:['my','newpc','pallets']},
 'Администратор':{av:'АД',n:'Администратор',r:'ТК Газаблок · настройки',note:'Нормы, компании, пользователи, журнал',
  s:['admin','norms','hist','reports']}
};
const NAV=[
 ['ОПЕРАТИВНАЯ РАБОТА',[['dash','📊','Сводка'],['orders','📋','Заявки',2],['my','📋','Мои заявки'],['newpc','➕','Новая заявка'],['reis','🚚','Рейсы']]],
 ['СКЛАД И ДОКУМЕНТЫ',[['wh','✅','К отгрузке',2],['ttn','📄','ТТН'],['pallets','🧱','Поддоны'],['hist','🕘','История изменений']]],
 ['УПРАВЛЕНИЕ',[['reports','📈','Отчёты'],['norms','⚙️','Нормы и размеры'],['admin','🏢','Компании и доступы']]]
];
const TITLES={
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
function setSt(no,k){const o=ORDERS.find(x=>x.no===no);o.st=k;
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
 if(q){for(const [n,r] of Object.entries(ROLES))if(r.s.includes(q)){enter(n);return}}})();
