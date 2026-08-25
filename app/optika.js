/* ОКО · CRM для сети салонов оптики — демо. Данные вымышленные, суммы в тенге. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const sgn=n=>(n>0?'+':'')+n.toFixed(2).replace('.',',');

const ROLES={
 'Владелец сети':{n:'Владелец сети',av:'ВЛ',note:'Салоны, деньги, аналитика, персонал',s:['dash','orders','clients','sales','stock','lab','staff','analytics','settings']},
 'Врач-оптометрист':{n:'Врач-оптометрист',av:'ВР',note:'Журнал приёмов, осмотр, рецепты',s:['sched','exam','clients','stock']},
 'Продавец-консультант':{n:'Продавец · зал',av:'ПР',note:'Заказ очков, касса, подбор оправ',s:['orders','neworder','clients','sales','stock','sched']},
 'Мастер · сборка':{n:'Мастер мастерской',av:'МС',note:'Очередь сборки, этапы, ОТК',s:['lab','stock']},
 'Клиент':{n:'Клиент',av:'КЛ',note:'Что клиент видит в WhatsApp',s:['client']}
};
const NAV=[
 ['ЗАЛ И ПРИЁМ',[['dash','DSH','Пульт сети'],['sched','ZAP','Журнал записи',4],['exam','VRA','Кабинет врача'],['neworder','NEW','Новый заказ']]],
 ['ЗАКАЗЫ',[['orders','ZAK','Заказы',3],['lab','MST','Мастерская',5],['clients','KLI','Клиенты']]],
 ['ТОВАР И ДЕНЬГИ',[['stock','SKL','Склад и линзы',2],['sales','KAS','Касса и продажи'],['analytics','ANL','Аналитика'],['staff','PER','Персонал и KPI']]],
 ['СЕРВИС',[['client','WAP','Глазами клиента'],['settings','SET','Настройки']]]
];
const TITLES={
 dash:['Пульт сети','Четыре салона: приёмы, заказы, выручка и что требует внимания прямо сейчас'],
 sched:['Журнал записи','Запись к врачу по кабинетам и салонам, онлайн-запись и напоминания клиентам'],
 exam:['Кабинет оптометриста','Карта осмотра, рецепт OD/OS, история и динамика зрения клиента'],
 neworder:['Новый заказ','Конструктор: оправа + линзы + покрытия, расчёт цены и проверка совместимости'],
 orders:['Заказы','Все заказы сети от оформления до выдачи, сроки и статусы'],
 lab:['Мастерская','Очередь сборки по этапам: раскрой, обточка, сборка, ОТК'],
 clients:['Клиенты','Карточка с рецептами, заказами, гарантией и напоминаниями о замене линз'],
 stock:['Склад и линзы','Оправы со штрихкодами, матрица линз по диоптриям, партии контактных линз'],
 sales:['Касса и продажи','Чеки, оплаты, возвраты, сертификаты и рассрочка'],
 analytics:['Аналитика','Выручка, средний чек, конверсия «приём → заказ», топ оправ, оборачиваемость'],
 staff:['Персонал и KPI','Выработка врачей и продавцов, проценты и зарплата'],
 client:['Глазами клиента','Вся цепочка в WhatsApp: запись, готовность очков, замена линз, приём через год'],
 settings:['Настройки','Салоны, услуги и цены, поставщики, шаблоны сообщений, интеграции']
};
let role='Владелец сети',cur='dash';

/* ===== СПРАВОЧНИКИ ===== */
const SALONS=['ул. Горького, 42','ТРЦ «Мега», 2 этаж','пр. Абая, 118','ул. Сатпаева, 7'];
const DOCS=['Ахметова А. К.','Ким С. В.','Нурланова Ж. Б.'];
const SELLERS=['Дана','Тимур','Алия','Ерлан'];
const MASTERS=['Олжас','Виктор'];
const FRAMES=[
 {id:'f1',br:'Ray-Ban',m:'RB5154 Clubmaster',c:'чёрный/золото',sz:'49-21-140',p:78000,q:3,ico:'🕶'},
 {id:'f2',br:'Silhouette',m:'Titan Minimal',c:'титан',sz:'52-19-145',p:126000,q:1,ico:'👓'},
 {id:'f3',br:'Police',m:'VPL887',c:'матовый синий',sz:'50-20-140',p:54000,q:5,ico:'👓'},
 {id:'f4',br:'Tom Ford',m:'FT5401',c:'гавана',sz:'54-18-145',p:148000,q:2,ico:'🕶'},
 {id:'f5',br:'Vogue',m:'VO5285',c:'розовое золото',sz:'51-18-140',p:42000,q:8,ico:'👓'},
 {id:'f6',br:'Nikon',m:'Flex 2201',c:'графит',sz:'53-17-142',p:36000,q:0,ico:'👓'}
];
const LENSES=[
 {id:'l1',n:'Стандарт 1.5 · HMC',idx:'1.50',p:18000,d:'базовое просветление, для рецептов до ±3.0'},
 {id:'l2',n:'Тонкие 1.6 · SHMC',idx:'1.60',p:38000,d:'тоньше на 25%, стойкое покрытие'},
 {id:'l3',n:'Ультратонкие 1.67 · Blue',idx:'1.67',p:64000,d:'для сильных рецептов + защита от синего света'},
 {id:'l4',n:'Прогрессивные 1.6 · премиум',idx:'1.60',p:112000,d:'три зоны, широкий коридор, для аддидации'},
 {id:'l5',n:'Фотохромные 1.6 · Transitions',idx:'1.60',p:86000,d:'темнеют на солнце'}
];
const COATS=[
 {id:'c1',n:'Защита от синего света',p:9000},
 {id:'c2',n:'Антиблик премиум',p:7000},
 {id:'c3',n:'Грязе- и водоотталкивающее',p:5000},
 {id:'c4',n:'Упрочнение (детям)',p:6000}
];
const SERV=[{id:'s1',n:'Изготовление и сборка',p:8000},{id:'s2',n:'Приём оптометриста',p:6000},{id:'s3',n:'Подгонка и обслуживание 1 год',p:0}];
/* статусы заказа */
let STATUS=[
 {k:'new',n:'Оформлен',c:'#3b82f6'},
 {k:'lens',n:'Ожидаем линзы',c:'#8b7cf6'},
 {k:'lab',n:'В мастерской',c:'#06b6d4'},
 {k:'otk',n:'Контроль качества',c:'#f59e0b'},
 {k:'ready',n:'Готов к выдаче',c:'#22c55e'},
 {k:'done',n:'Выдан',c:'#10b981'},
 {k:'fix',n:'Переделка',c:'#ef4444'}
];
const ST=k=>STATUS.find(s=>s.k===k)||STATUS[0];
/* этапы мастерской */
const LSTAGES=[['cut','РАСКРОЙ','#8b7cf6'],['edge','ОБТОЧКА','#06b6d4'],['assy','СБОРКА','#f59e0b'],['qc','ОТК','#3b82f6'],['ok','ГОТОВО','#22c55e']];

/* ===== КЛИЕНТЫ И РЕЦЕПТЫ ===== */
let CLIENTS=[
 {id:1,n:'Айгерим Сатпаева',ph:'+7 701 224 55 10',age:34,salon:0,visits:5,sum:412000,last:'12.08.2026',
  rx:[{d:'12.08.2026',doc:0,od:{s:-2.25,c:-0.5,a:170},os:{s:-2.50,c:-0.75,a:15},pd:63,add:0,note:'Жалобы на усталость к вечеру, работа за монитором'},
      {d:'20.07.2025',doc:0,od:{s:-2.00,c:-0.5,a:170},os:{s:-2.25,c:-0.5,a:10},pd:63,add:0,note:''},
      {d:'05.06.2024',doc:1,od:{s:-1.75,c:-0.25,a:175},os:{s:-2.00,c:-0.5,a:10},pd:63,add:0,note:''}],
  cl:{n:'Acuvue Oasys 2 нед.',left:9,next:'02.09.2026'},warn:'Зрение падает 3-й год подряд — предложить защиту от синего света'},
 {id:2,n:'Ержан Мухтаров',ph:'+7 707 118 42 03',age:47,salon:1,visits:3,sum:238000,last:'19.08.2026',
  rx:[{d:'19.08.2026',doc:1,od:{s:+1.50,c:0,a:0},os:{s:+1.75,c:-0.25,a:90},pd:66,add:2.00,note:'Первые прогрессивные линзы, объяснить адаптацию'}],cl:null,warn:''},
 {id:3,n:'Динара Оспанова',ph:'+7 777 903 12 66',age:28,salon:0,visits:8,sum:684000,last:'22.08.2026',
  rx:[{d:'22.08.2026',doc:2,od:{s:-4.75,c:-1.25,a:5},os:{s:-5.00,c:-1.00,a:175},pd:61,add:0,note:'Высокая близорукость — рекомендованы ультратонкие 1.67'}],
  cl:{n:'Biofinity месячные',left:2,next:'27.08.2026'},warn:'Контактные линзы заканчиваются через 2 дня'},
 {id:4,n:'Марат Абдуллин',ph:'+7 705 655 30 41',age:62,salon:2,visits:11,sum:906000,last:'02.08.2026',
  rx:[{d:'02.08.2026',doc:0,od:{s:+2.25,c:-0.75,a:100},os:{s:+2.50,c:-0.50,a:80},pd:64,add:2.50,note:'Катаракта начальная — наблюдение, направлен к офтальмологу'}],cl:null,warn:'Плановый приём через 6 мес — 02.02.2027'},
 {id:5,n:'Камила Ержанова',ph:'+7 702 447 89 25',age:9,salon:1,visits:2,sum:96000,last:'15.08.2026',
  rx:[{d:'15.08.2026',doc:2,od:{s:-1.00,c:0,a:0},os:{s:-1.25,c:0,a:0},pd:54,add:0,note:'Детский рецепт, контроль через 6 месяцев, упрочнённые линзы'}],cl:null,warn:'Ребёнок — контроль зрения каждые 6 мес'}
];
const cl=id=>CLIENTS.find(c=>c.id===id);

/* ===== ЗАКАЗЫ ===== */
let ORDERS=[
 {id:'З-4821',cid:3,salon:0,st:'lens',frame:'f4',lens:'l3',coats:['c1','c2'],sum:286000,paid:150000,d:'22.08.2026',due:'29.08.2026',seller:0,stage:null,note:'Ждём линзы 1.67 от поставщика — отгружены, в пути'},
 {id:'З-4818',cid:1,salon:0,st:'lab',frame:'f1',lens:'l2',coats:['c1'],sum:141000,paid:141000,d:'21.08.2026',due:'26.08.2026',seller:1,stage:'edge'},
 {id:'З-4815',cid:2,salon:1,st:'lab',frame:'f2',lens:'l4',coats:['c2','c3'],sum:250000,paid:125000,d:'19.08.2026',due:'27.08.2026',seller:2,stage:'cut',note:'Прогрессивные — особая точность центровки'},
 {id:'З-4809',cid:5,salon:1,st:'otk',frame:'f5',lens:'l1',coats:['c4'],sum:74000,paid:74000,d:'15.08.2026',due:'22.08.2026',seller:2,stage:'qc',over:1,note:'Просрочен на 3 дня — сообщить клиенту'},
 {id:'З-4802',cid:4,salon:2,st:'ready',frame:'f3',lens:'l5',coats:['c2'],sum:155000,paid:80000,d:'12.08.2026',due:'20.08.2026',seller:3,stage:'ok'},
 {id:'З-4795',cid:1,salon:0,st:'done',frame:'f5',lens:'l2',coats:[],sum:88000,paid:88000,d:'02.08.2026',due:'09.08.2026',seller:0,stage:'ok'},
 {id:'З-4788',cid:4,salon:2,st:'fix',frame:'f1',lens:'l4',coats:['c1','c2'],sum:198000,paid:198000,d:'28.07.2026',due:'05.08.2026',seller:3,stage:'assy',note:'Клиент жалуется на искажение по краю — перецентровка по гарантии'}
];
let seq=4822;
const fr=id=>FRAMES.find(f=>f.id===id)||{br:'—',m:'',p:0};
const ln=id=>LENSES.find(l=>l.id===id)||{n:'—',p:0};

/* ===== ЗАПИСЬ ===== */
const HOURS=['10:00','11:00','12:00','14:00','15:00','16:00','17:00','18:00'];
let APPTS={
 '0-0':{c:'Айгерим Сатпаева',t:'Проверка зрения',doc:0,tone:'var(--acc)'},
 '2-0':{c:'Новый клиент · онлайн-запись',t:'Подбор очков',doc:0,tone:'var(--violet)'},
 '3-0':{c:'Камила Ержанова (9 лет)',t:'Контроль зрения',doc:2,tone:'var(--blue)'},
 '1-1':{c:'Ержан Мухтаров',t:'Прогрессивные · адаптация',doc:1,tone:'var(--acc)'},
 '4-1':{c:'Динара Оспанова',t:'Подбор контактных линз',doc:2,tone:'var(--green)'},
 '5-2':{c:'Марат Абдуллин',t:'Плановый осмотр',doc:0,tone:'var(--acc)'},
 '6-2':{c:'Запись через WhatsApp',t:'Проверка зрения',doc:1,tone:'var(--violet)'}
};

/* ===== СКЛАД ЛИНЗ (матрица sph × cyl) ===== */
const SPH=[-6,-5,-4,-3,-2,-1,0,1,2,3];
const CYL=[0,-0.5,-1,-1.5,-2];
function lensStock(s,c){const k=(Math.abs(s*3)+Math.abs(c*5))|0;const v=(s+7)*(c+3)+k;
 if(Math.abs(s)>=5&&Math.abs(c)>=1.5)return 0; if(v%7===0)return 1; return 2}
const CLENSES=[
 {n:'Acuvue Oasys 2 недели',pk:'6 линз',q:24,p:14000,exp:'03.2028',st:'ok'},
 {n:'Biofinity месячные',pk:'3 линзы',q:5,p:16500,exp:'11.2027',st:'low'},
 {n:'Dailies Total 1',pk:'30 линз',q:12,p:22000,exp:'07.2028',st:'ok'},
 {n:'Air Optix Night&Day',pk:'3 линзы',q:0,p:19000,exp:'—',st:'no'},
 {n:'Раствор Opti-Free 300 мл',pk:'—',q:31,p:4200,exp:'01.2029',st:'ok'}
];

/* ===== ЭКРАНЫ ===== */
const SC={};
const stChip=k=>{const s=ST(k);return `<span class="st" style="--c:${s.c};background:${s.c}22;color:${s.c}"><i></i>${s.n}</span>`};

SC.dash=()=>`
 <div class="head"><div><h2>Пульт сети</h2><p>Четыре салона в одном экране: сколько людей на приёме, что в мастерской, где просрочка и сколько денег в кассе. Всё кликабельно — из любой цифры проваливаетесь в список.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Сводка дня уходит владельцу в WhatsApp каждый вечер в 21:00.')">Сводка дня</button><button class="btn acc" onclick="newOrder()">+ Новый заказ</button></div></div>
 <div class="strip">
  <div><small>ПРИЁМОВ СЕГОДНЯ</small><b>18</b><span>из них 6 — онлайн-запись</span></div>
  <div><small>ЗАКАЗОВ В РАБОТЕ</small><b>${ORDERS.filter(o=>!['done'].includes(o.st)).length}</b><span>в мастерской ${ORDERS.filter(o=>o.st==='lab').length} · ждут линзы ${ORDERS.filter(o=>o.st==='lens').length}</span></div>
  <div><small>ВЫРУЧКА ДНЯ</small><b>1,24 млн ₸</b><span class="good">▲ 18% к прошлой неделе</span></div>
  <div><small>СРЕДНИЙ ЧЕК</small><b>148 000 ₸</b><span>▲ растёт за счёт покрытий</span></div>
  <div><small>ТРЕБУЕТ ВНИМАНИЯ</small><b class="bad">${ORDERS.filter(o=>o.over||o.st==='fix').length}</b><span>просрочка и переделки</span></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph"><div><div class="ph-title">Воронка салона · главная метрика оптики</div><div class="ph-sub">сколько приёмов доходит до заказа — то, чего в текущей программе не видно</div></div><span class="tag acc">за август</span></div>
   ${[['Записались на приём',412,'var(--blue)'],['Пришли',368,'var(--violet)'],['Выписан рецепт',341,'var(--acc)'],['Оформили заказ',214,'#22c55e'],['Забрали и оплатили',201,'#10b981']]
     .map(r=>`<div class="fr" style="grid-template-columns:170px 1fr 44px"><span>${r[0]}</span><div class="ftrack"><i style="--w:${r[1]/412*100}%;background:${r[2]}"></i></div><b>${r[1]}</b></div>`).join('')}
   <div class="hint"><b>Конверсия «приём → заказ» — 58%.</b> Видно по каждому врачу и салону: у одного 71%, у другого 43% — сразу понятно, кого учить. Раньше эта цифра нигде не считалась.</div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Требует решения сегодня</div><div class="ph-sub">система сама подсветила</div></div></div>
   ${[['⏰','Заказ З-4809 просрочен на 3 дня','позвонить клиенту и извиниться · салон «Мега»','var(--red)'],
      ['↩','Переделка по гарантии З-4788','искажение по краю — перецентровка','var(--red)'],
      ['📦','Линзы 1.67 для З-4821 в пути','поставщик отгрузил, ожидаем 26.08','var(--violet)'],
      ['👁','Динара: контактные линзы кончаются','2 дня — отправить напоминание','var(--amber)'],
      ['🧾','Biofinity на складе 5 упаковок','ниже минимума — автозаказ сформирован','var(--amber)'],
      ['🎂','3 клиента с днём рождения на неделе','скидка 10% отправится автоматически','var(--acc)']]
    .map(a=>`<div style="display:flex;gap:9px;padding:8px 0;border-bottom:1px solid var(--line)"><span style="width:26px;height:26px;background:var(--panel2);display:grid;place-items:center;flex:none;border-radius:8px;font-size:12px;color:${a[3]}">${a[0]}</span><div><b style="font-size:9.8px">${a[1]}</b><p class="mini" style="margin:2px 0 0">${a[2]}</p></div></div>`).join('')}
  </div>
 </div>
 <div class="g3">
  <div class="panel"><div class="ph-title">Салоны · выручка за месяц</div>
   ${SALONS.map((s,i)=>{const v=[9200000,7400000,5100000,3800000][i];return `<div class="fr" style="grid-template-columns:150px 1fr 74px"><span style="font-size:9px">${s}</span><div class="ftrack" style="height:15px"><i style="--w:${v/9200000*100}%"></i></div><b>${fmt(v/1000000*10)/10} млн</b></div>`}).join('')}
   <div class="kpi-mini"><div style="--tone:var(--acc)"><small>ИТОГО ЗА МЕСЯЦ</small><b>25,5 млн ₸</b></div><div style="--tone:var(--green)"><small>ЗАКАЗОВ</small><b>214</b></div></div>
  </div>
  <div class="panel"><div class="ph-title">Из чего складывается чек</div>
   ${[['Линзы и покрытия',46,'var(--acc)'],['Оправы',34,'var(--violet)'],['Контактные линзы',11,'var(--blue)'],['Приём врача',5,'#22c55e'],['Аксессуары и уход',4,'var(--amber)']]
     .map(r=>`<div class="fr" style="grid-template-columns:130px 1fr 40px"><span>${r[0]}</span><div class="ftrack" style="height:15px"><i style="--w:${r[1]/46*100}%;background:${r[2]}"></i></div><b>${r[1]}%</b></div>`).join('')}
   <div class="hint" style="margin-top:9px"><b>Инсайт:</b> где продавец предлагает покрытие от синего света, чек выше на 21 000 ₸. Система подсказывает это прямо в конструкторе заказа.</div>
  </div>
  <div class="panel"><div class="ph-title">Возвраты клиентов</div>
   <div class="kpi-mini" style="margin-top:4px">
    <div style="--tone:var(--acc)"><small>ПОВТОРНЫЕ ПОКУПКИ</small><b>44%</b></div>
    <div style="--tone:var(--violet)"><small>ПРИШЛИ ЧЕРЕЗ ГОД</small><b>61%</b></div>
    <div style="--tone:#22c55e"><small>ПОДПИСКА НА КЛ</small><b>128 чел.</b></div>
   </div>
   <div class="hint"><b>Работает автоматика:</b> напоминание о замене контактных линз, приглашение на плановый осмотр через год и контроль детского зрения раз в полгода уходят в WhatsApp без участия персонала.</div>
  </div>
 </div>`;

/* ---- ЖУРНАЛ ЗАПИСИ ---- */
SC.sched=()=>{const days=['ПН 24','ВТ 25','СР 26','ЧТ 27','ПТ 28','СБ 29'];
 return `<div class="head"><div><h2>Журнал записи</h2><p>Запись к врачу по салонам и кабинетам. Онлайн-запись с сайта и из WhatsApp попадает сюда сама, клиенту автоматически уходит напоминание за день и за час.</p></div>
 <div class="btns"><select class="rsel" onchange="toast('Показан журнал салона: '+this.value)">${SALONS.map(s=>`<option>${s}</option>`).join('')}</select><button class="btn acc" onclick="apptForm()">+ Записать клиента</button></div></div>
 <div class="strip">
  <div><small>ЗАПИСЕЙ НА НЕДЕЛЮ</small><b>${Object.keys(APPTS).length*7}</b><span>по 3 врачам сети</span></div>
  <div><small>ОНЛАЙН-ЗАПИСЬ</small><b class="good">34%</b><span>сайт и WhatsApp</span></div>
  <div><small>НЕЯВКИ</small><b>7%</b><span>было 23% до напоминаний</span></div>
  <div><small>СВОБОДНО СЕГОДНЯ</small><b>3 окна</b><span>предложим из листа ожидания</span></div>
  <div><small>СРЕДНИЙ ПРИЁМ</small><b>28 мин</b><span>с подбором — 45 мин</span></div>
 </div>
 <div class="panel"><div class="tw"><div class="slotgrid">
  <div></div>${days.map(d=>`<div class="sh">${d}</div>`).join('')}
  ${HOURS.map((h,hi)=>`<div class="st2">${h}</div>`+days.map((_,di)=>{const a=APPTS[di+'-'+hi];
   return a?`<div class="appt" style="--tone:${a.tone}" onclick="apptCard('${di}-${hi}')"><b>${esc(a.c.slice(0,22))}</b>${esc(a.t)} · ${DOCS[a.doc].split(' ')[0]}</div>`
    :`<div class="slot" onclick="apptForm('${days[di]} ${h}')"></div>`}).join('')).join('')}
 </div></div>
 <div class="hint"><b>Чего нет в текущей программе:</b> лист ожидания — если клиент отменил визит, система сама предлагает освободившееся окно тем, кто хотел раньше. Плюс онлайн-запись прямо из WhatsApp-переписки.</div></div>`};
function apptCard(k){const a=APPTS[k];if(!a)return;
 openD(a.c,`${a.t} · врач ${DOCS[a.doc]}`,['Запись'],
 `<div class="dg"><div class="det"><small>УСЛУГА</small><b>${esc(a.t)}</b></div>
  <div class="det"><small>ВРАЧ</small><b>${DOCS[a.doc]}</b></div>
  <div class="det"><small>НАПОМИНАНИЯ</small><b>за день и за час · WhatsApp</b></div></div>
  <div class="btns"><button class="btn acc" onclick="closeD();go('exam')">Начать приём</button>
  <button class="btn" onclick="toast('Клиенту отправлено сообщение о переносе, предложены свободные окна.')">Перенести</button>
  <button class="btn red" onclick="toast('Запись отменена. Освободившееся окно предложено первому из листа ожидания.')">Отменить</button></div>`)}
function apptForm(t){openD('Запись клиента',t||'Выберите время в журнале',['Новая запись'],
 `<div class="f2"><div class="fld"><small>КЛИЕНТ · ПОИСК ПО ТЕЛЕФОНУ</small><input value="+7 701 "></div>
  <div class="fld"><small>УСЛУГА</small><select><option>Проверка зрения</option><option>Подбор очков</option><option>Подбор контактных линз</option><option>Контроль зрения (ребёнок)</option><option>Адаптация прогрессивных</option></select></div></div>
  <div class="f2"><div class="fld"><small>ВРАЧ</small><select>${DOCS.map(d=>`<option>${d}</option>`).join('')}</select></div>
  <div class="fld"><small>САЛОН</small><select>${SALONS.map(s=>`<option>${s}</option>`).join('')}</select></div></div>
  <div class="note" style="--tone:var(--acc)"><b>Клиенту автоматически уйдёт</b><p>Подтверждение записи сразу, напоминание за день и за час до приёма — в WhatsApp. Неявки падают с 23% до 7%.</p></div>
  <div class="btns" style="margin-top:11px"><button class="btn acc" onclick="closeD();sparks();toast('Клиент записан, подтверждение ушло в WhatsApp.')">Записать</button><button class="btn" onclick="closeD()">Отмена</button></div>`)}

/* ---- КАБИНЕТ ВРАЧА ---- */
let examC=1;
SC.exam=()=>{const c=cl(examC);const r=c.rx[0];
 return `<div class="head"><div><h2>Кабинет оптометриста</h2><p>Карта осмотра и рецепт заполняются за минуту, история хранится вечно. График динамики зрения показывает клиенту, как менялись диоптрии, — сильный аргумент для новых очков и защитных покрытий.</p></div>
 <div class="btns"><select class="rsel" onchange="examC=+this.value;render()">${CLIENTS.map(x=>`<option value="${x.id}" ${x.id===examC?'selected':''}>${x.n}</option>`).join('')}</select>
 <button class="btn" onclick="toast('Рецепт распечатан и отправлен клиенту в WhatsApp. Данные ушли в медкарту.')">Печать рецепта</button>
 <button class="btn acc" onclick="newOrder(${c.id})">→ Оформить заказ</button></div></div>
 <div class="g21">
  <div>
   <div class="panel"><div class="ph"><div><div class="ph-title">Рецепт от ${r.d} · ${esc(c.n)}, ${c.age} лет</div><div class="ph-sub">врач ${DOCS[r.doc]} · распечатывается на бланке и уходит клиенту в WhatsApp</div></div><span class="tag acc">актуальный</span></div>
    <div class="rx"><table>
     <tr><th style="text-align:left">Глаз</th><th>Sph (сфера)</th><th>Cyl (цилиндр)</th><th>Ax (ось)</th><th>Add</th><th>PD</th></tr>
     <tr><td class="eye">OD · правый</td><td>${sgn(r.od.s)}</td><td>${r.od.c?sgn(r.od.c):'—'}</td><td>${r.od.a||'—'}°</td><td>${r.add?sgn(r.add):'—'}</td><td rowspan="2" style="vertical-align:middle;font-size:14px">${r.pd}<div class="mini" style="margin-top:2px">мм</div></td></tr>
     <tr><td class="eye">OS · левый</td><td>${sgn(r.os.s)}</td><td>${r.os.c?sgn(r.os.c):'—'}</td><td>${r.os.a||'—'}°</td><td>${r.add?sgn(r.add):'—'}</td></tr>
    </table></div>
    ${r.note?`<div class="note" style="--tone:var(--acc)"><b>Заключение врача</b><p>${esc(r.note)}</p></div>`:''}
    <div class="btns" style="margin-top:10px">
     <button class="btn" onclick="toast('Авторефрактометр подключён: данные подставились в поля автоматически, врачу осталось проверить субъективно.')">↓ Забрать с авторефрактометра</button>
     <button class="btn" onclick="toast('Проба пробными линзами зафиксирована в карте осмотра.')">Пробная оправа</button>
     <button class="btn violet" onclick="toast('Рецепт на контактные линзы выписан отдельно — с учётом вершинного расстояния.')">Рецепт на КЛ</button>
    </div>
   </div>
   <div class="panel" style="margin-top:10px"><div class="ph"><div><div class="ph-title">Динамика зрения по годам</div><div class="ph-sub">то, чего нет в текущей программе: клиент видит, как менялось зрение</div></div><span class="tag violet">OD / OS</span></div>
    <div class="vchart">${[...c.rx].reverse().map(x=>{const h1=Math.min(100,Math.abs(x.od.s)/6*100),h2=Math.min(100,Math.abs(x.os.s)/6*100);
     return `<div class="vcol"><div class="bars"><i style="height:${Math.max(8,h1)}%" title="OD"></i><i class="os" style="height:${Math.max(8,h2)}%" title="OS"></i></div><span>${x.d.slice(6)}</span></div>`}).join('')}</div>
    <div class="mini" style="margin-top:7px">Шкала — модуль сферы. ${c.rx.length>1?`За ${c.rx.length} измерения: OD ${sgn(c.rx[c.rx.length-1].od.s)} → ${sgn(c.rx[0].od.s)}, OS ${sgn(c.rx[c.rx.length-1].os.s)} → ${sgn(c.rx[0].os.s)}.`:'Первое измерение — динамика появится со следующего приёма.'}</div>
    ${c.warn?`<div class="hint"><b>Система подсказывает врачу:</b> ${esc(c.warn)}</div>`:''}
   </div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Карта осмотра</div>
    ${[['Острота зрения без коррекции','OD 0,3 · OS 0,25'],['Острота с коррекцией','OD 1,0 · OS 1,0'],['Внутриглазное давление','17 / 18 мм рт. ст.'],['Осмотр глазного дна','без патологии'],['Слёзная плёнка','норма'],['Рабочее расстояние','55 см · монитор']]
      .map(x=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:10px"><span class="muted">${x[0]}</span><b>${x[1]}</b></div>`).join('')}
    <div class="btns" style="margin-top:10px"><button class="btn" onclick="toast('Медицинская карта клиента открыта: все приёмы, заключения и рецепты за всё время.')">Медкарта</button></div>
   </div>
   <div class="panel" style="margin-top:10px"><div class="ph-title">История приёмов</div>
    <div class="tl">${c.rx.map(x=>`<div class="tli"><b>Приём ${x.d}</b><p>OD ${sgn(x.od.s)} · OS ${sgn(x.os.s)}${x.add?' · Add '+sgn(x.add):''} · врач ${DOCS[x.doc].split(' ')[0]}</p><time>${esc((x.note||'без особенностей').slice(0,60))}</time></div>`).join('')}</div>
   </div>
   ${c.cl?`<div class="panel" style="margin-top:10px"><div class="ph-title">Контактные линзы</div>
     <div class="note" style="--tone:${c.cl.left<5?'var(--red)':'var(--acc)'}"><b>${esc(c.cl.n)}</b><p>Осталось примерно ${c.cl.left} дней · следующая замена ${c.cl.next}. Напоминание уйдёт автоматически за 3 дня.</p></div>
     <button class="btn acc" style="margin-top:8px" onclick="toast('Заказ контактных линз добавлен — клиент заберёт вместе с очками.')">Продлить запас</button></div>`:''}
  </div>
 </div>`};

/* ---- КОНСТРУКТОР ЗАКАЗА ---- */
let NO={cid:1,frame:'f1',lens:'l2',coats:['c1'],serv:['s1','s3']};
function newOrder(cid){if(cid)NO.cid=cid;go('neworder')}
SC.neworder=()=>{const c=cl(NO.cid);const r=c.rx[0];const f=fr(NO.frame);const l=ln(NO.lens);
 const sum=f.p+l.p+NO.coats.reduce((a,x)=>a+COATS.find(y=>y.id===x).p,0)+NO.serv.reduce((a,x)=>a+SERV.find(y=>y.id===x).p,0);
 const strong=Math.max(Math.abs(r.od.s),Math.abs(r.os.s))>=4;
 const warnIdx=strong&&['1.50','1.60'].includes(l.idx);
 const warnSize=strong&&+f.sz.split('-')[0]>52;
 return `<div class="head"><div><h2>Новый заказ</h2><p>Оправа, линзы и покрытия в одном экране: цена считается сразу, а система проверяет, подходит ли выбранное к рецепту клиента. Продавцу не нужно держать это в голове.</p></div>
 <div class="btns"><select class="rsel" onchange="NO.cid=+this.value;render()">${CLIENTS.map(x=>`<option value="${x.id}" ${x.id===NO.cid?'selected':''}>${x.n}</option>`).join('')}</select></div></div>
 <div class="g12">
  <div>
   <div class="panel"><div class="ph"><div><div class="ph-title">Рецепт клиента</div><div class="ph-sub">${esc(c.n)} · от ${r.d}</div></div></div>
    <div class="rx"><table>
     <tr><th style="text-align:left">Глаз</th><th>Sph</th><th>Cyl</th><th>Ax</th><th>PD</th></tr>
     <tr><td class="eye">OD</td><td>${sgn(r.od.s)}</td><td>${r.od.c?sgn(r.od.c):'—'}</td><td>${r.od.a||'—'}°</td><td rowspan="2" style="vertical-align:middle">${r.pd}</td></tr>
     <tr><td class="eye">OS</td><td>${sgn(r.os.s)}</td><td>${r.os.c?sgn(r.os.c):'—'}</td><td>${r.os.a||'—'}°</td></tr>
    </table></div>
    ${warnIdx?`<div class="note" style="--tone:var(--red)"><b>⚠ Проверка совместимости</b><p>Рецепт сильный (${sgn(Math.min(r.od.s,r.os.s))}), при индексе ${l.idx} линза получится толстой и тяжёлой. Рекомендуем <b>1.67</b> — на 30% тоньше.</p></div>`:''}
    ${warnSize?`<div class="note" style="--tone:var(--amber)"><b>⚠ Размер оправы</b><p>Ширина ${f.sz.split('-')[0]} мм при таком рецепте увеличит толщину по краю. Уже оправа — красивее результат.</p></div>`:''}
    ${!warnIdx&&!warnSize?`<div class="note" style="--tone:#22c55e"><b>✓ Всё сочетается</b><p>Выбранная оправа и линзы подходят под рецепт. Толщина по краю в пределах нормы.</p></div>`:''}
   </div>
   <div class="panel" style="margin-top:10px"><div class="ph-title">Покрытия и услуги</div>
    ${COATS.map(x=>`<div class="opt ${NO.coats.includes(x.id)?'on':''}" onclick="tgl('coats','${x.id}')"><i>${NO.coats.includes(x.id)?'✓':''}</i><div><b>${x.n}</b></div><span class="pr">${tg(x.p)}</span></div>`).join('')}
    ${SERV.map(x=>`<div class="opt ${NO.serv.includes(x.id)?'on':''}" onclick="tgl('serv','${x.id}')"><i>${NO.serv.includes(x.id)?'✓':''}</i><div><b>${x.n}</b></div><span class="pr">${x.p?tg(x.p):'включено'}</span></div>`).join('')}
    <div class="hint"><b>Подсказка продавцу:</b> клиент работает за монитором — защита от синего света поднимает чек на 21 000 ₸ и реально снижает усталость.</div>
   </div>
  </div>
  <div>
   <div class="panel"><div class="ph"><div><div class="ph-title">Оправа</div><div class="ph-sub">только то, что есть в наличии в этом салоне</div></div><button class="btn" onclick="toast('Поиск по штрихкоду: наведите сканер на оправу — она найдётся мгновенно.')">Сканер</button></div>
    <div class="g4">${FRAMES.map(x=>`<div class="frame ${NO.frame===x.id?'':''}" style="${NO.frame===x.id?'border-color:var(--acc);box-shadow:0 0 0 2px var(--accs)':''}" onclick="NO.frame='${x.id}';keepScroll()">
     <div class="pic">${x.ico}</div><b>${x.br}</b><div class="sub">${x.m}</div><div class="sub">${x.sz} · ${x.c}</div>
     <div class="pr">${tg(x.p)}</div>${x.q?`<div class="sub" style="color:#4ade80">в наличии ${x.q}</div>`:'<div class="sub" style="color:#f87171">под заказ 5–7 дней</div>'}</div>`).join('')}</div>
   </div>
   <div class="panel" style="margin-top:10px"><div class="ph-title">Линзы</div>
    ${LENSES.map(x=>`<div class="opt ${NO.lens===x.id?'on':''}" onclick="NO.lens='${x.id}';keepScroll()"><i>${NO.lens===x.id?'✓':''}</i><div><b>${x.n}</b><div class="sub">${x.d}</div></div><span class="pr">${tg(x.p)}</span></div>`).join('')}
   </div>
   <div class="total" style="margin-top:10px">
    <div><small>ИТОГО ПО ЗАКАЗУ · ГОТОВНОСТЬ ${strong?'7':'5'} ДНЕЙ</small><b>${tg(sum)}</b></div>
    <div class="btns"><button class="btn" onclick="toast('Расчёт отправлен клиенту в WhatsApp: состав, цена, срок и фото оправы.')">📤 Расчёт клиенту</button>
    <button class="btn acc" onclick="saveOrder(${sum})">Оформить заказ</button></div>
   </div>
  </div>
 </div>`};
function tgl(k,id){NO[k].includes(id)?NO[k]=NO[k].filter(x=>x!==id):NO[k].push(id);keepScroll()}
function saveOrder(sum){const id='З-'+(seq++);
 ORDERS.unshift({id,cid:NO.cid,salon:0,st:'new',frame:NO.frame,lens:NO.lens,coats:[...NO.coats],sum,paid:Math.round(sum/2),d:'25.08.2026',due:'01.09.2026',seller:0,stage:null});
 go('orders');sparks();
 toast(`Заказ <b>${id}</b> оформлен на ${tg(sum)}. Предоплата 50% принята, клиенту ушло подтверждение в WhatsApp, линзы заказаны у поставщика автоматически.`)}

/* ---- ЗАКАЗЫ ---- */
let ordF='all';
SC.orders=()=>{const list=ORDERS.filter(o=>ordF==='all'||o.st===ordF);
 return `<div class="head"><div><h2>Заказы</h2><p>Все заказы сети в одном списке: от оформления до выдачи. Цвет строки — статус, просроченные подсвечены. Клиент получает статусы в WhatsApp сам.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Выгрузка в Excel.')">Экспорт</button><button class="btn acc" onclick="newOrder()">+ Новый заказ</button></div></div>
 <div class="strip">
  <div><small>ВСЕГО В РАБОТЕ</small><b>${ORDERS.filter(o=>o.st!=='done').length}</b><span>по 4 салонам</span></div>
  <div><small>ГОТОВЫ К ВЫДАЧЕ</small><b class="good">${ORDERS.filter(o=>o.st==='ready').length}</b><span>клиенты уведомлены</span></div>
  <div><small>ЖДУТ ЛИНЗЫ</small><b class="warn">${ORDERS.filter(o=>o.st==='lens').length}</b><span>статус поставки виден</span></div>
  <div><small>ПРОСРОЧЕНО</small><b class="bad">${ORDERS.filter(o=>o.over).length}</b><span>сроки под контролем</span></div>
  <div><small>СУММА В РАБОТЕ</small><b>${tg(ORDERS.filter(o=>o.st!=='done').reduce((a,o)=>a+o.sum,0))}</b><span>оплачено ${tg(ORDERS.reduce((a,o)=>a+o.paid,0))}</span></div>
 </div>
 <div class="filters">
  <button class="filter ${ordF==='all'?'on':''}" onclick="ordF='all';render()">Все</button>
  ${STATUS.map(s=>`<button class="filter ${ordF===s.k?'on':''}" onclick="ordF='${s.k}';render()" style="${ordF===s.k?`background:${s.c};border-color:${s.c};color:#04222b`:''}">${s.n}</button>`).join('')}
 </div>
 <div class="panel"><div class="tw"><table class="data" style="min-width:900px"><thead><tr><th>Заказ</th><th>Клиент</th><th>Салон</th><th>Что заказано</th><th>Статус</th><th>Готовность</th><th class="right">Сумма</th><th class="right">Оплачено</th></tr></thead><tbody>
 ${list.map(o=>{const c=cl(o.cid);return `<tr class="row-st ${o.over?'over':''}" style="--c:${ST(o.st).c}" onclick="openOrder('${o.id}')">
  <td class="mono"><b>${o.id}</b><div class="sub">${o.d}</div></td>
  <td><b>${esc(c.n)}</b><div class="sub mono">${c.ph}</div></td>
  <td class="mini">${SALONS[o.salon]}</td>
  <td class="mini">${fr(o.frame).br} ${fr(o.frame).m}<div class="sub">${ln(o.lens).n}</div></td>
  <td>${stChip(o.st)}</td>
  <td class="mono ${o.over?'bad':''}">${o.due}${o.over?'<div class="sub bad">просрочен</div>':''}</td>
  <td class="right mono"><b>${tg(o.sum)}</b></td>
  <td class="right mono ${o.paid<o.sum?'warn':'good'}">${tg(o.paid)}${o.paid<o.sum?`<div class="sub">долг ${tg(o.sum-o.paid)}</div>`:''}</td></tr>`}).join('')}
 </tbody></table></div>
 <div class="hint"><b>Клиент не звонит «мои очки готовы?»</b> — каждый переход статуса уходит ему в WhatsApp: «заказ принят», «линзы поступили», «очки в сборке», «готовы к выдаче».</div></div>`};
function openOrder(id){const o=ORDERS.find(x=>x.id===id);const c=cl(o.cid);const f=fr(o.frame);const l=ln(o.lens);
 const i=STATUS.findIndex(s=>s.k===o.st);
 openD('Заказ '+o.id,`${c.n} · ${SALONS[o.salon]} · ${tg(o.sum)}`,['Заказ'],
 `<div class="dg">
  <div class="det"><small>СТАТУС</small><b>${stChip(o.st)}</b></div>
  <div class="det"><small>ГОТОВНОСТЬ</small><b class="${o.over?'bad':''}">${o.due}</b></div>
  <div class="det"><small>ПРОДАВЕЦ</small><b>${SELLERS[o.seller]}</b></div>
  <div class="det"><small>ОПРАВА</small><b>${f.br} ${f.m}</b></div>
  <div class="det"><small>ЛИНЗЫ</small><b>${l.n}</b></div>
  <div class="det"><small>ПОКРЫТИЯ</small><b>${o.coats.map(x=>COATS.find(y=>y.id===x).n).join(', ')||'—'}</b></div>
  <div class="det"><small>ОПЛАЧЕНО</small><b>${tg(o.paid)} из ${tg(o.sum)}</b></div>
  <div class="det"><small>ЭТАП В МАСТЕРСКОЙ</small><b>${o.stage?LSTAGES.find(s=>s[0]===o.stage)[1]:'—'}</b></div>
  <div class="det"><small>ГАРАНТИЯ</small><b>12 месяцев</b></div>
 </div>
 ${o.note?`<div class="note" style="--tone:var(--amber)"><b>Заметка</b><p>${esc(o.note)}</p></div>`:''}
 <div class="ph-title" style="margin:12px 0 8px">Движение заказа</div>
 <div class="tl">
  <div class="tli"><b>Заказ оформлен</b><p>Предоплата принята, клиенту ушло подтверждение</p><time>${o.d}</time></div>
  ${i>=1?'<div class="tli" style="--c:#8b7cf6"><b>Линзы заказаны у поставщика</b><p>Автозаказ по электронному обмену, статус поставки виден в системе</p><time>тот же день</time></div>':''}
  ${i>=2?'<div class="tli" style="--c:#06b6d4"><b>Передан в мастерскую</b><p>Мастер видит рецепт, оправу и линзы в своей очереди</p><time>—</time></div>':''}
  ${i>=3?'<div class="tli" style="--c:#f59e0b"><b>Контроль качества</b><p>Проверка диоптрий, центровки и посадки</p><time>—</time></div>':''}
  ${i>=4?'<div class="tli" style="--c:#22c55e"><b>Готов к выдаче</b><p>Клиенту ушло сообщение «очки готовы»</p><time>—</time></div>':''}
 </div>
 <div class="btns" style="margin-top:12px">
  ${i<5?`<button class="btn acc" onclick="nextSt('${o.id}')">→ Следующий статус</button>`:''}
  <button class="btn" onclick="toast('Открыт чат WhatsApp с клиентом — вся переписка хранится в карточке.')">Написать клиенту</button>
  ${o.paid<o.sum?`<button class="btn green" onclick="payOrder('${o.id}')">Принять доплату ${tg(o.sum-o.paid)}</button>`:''}
  <button class="btn red" onclick="toast('Оформлена переделка по гарантии — заказ вернулся в мастерскую, клиенту принесены извинения.')">Переделка</button>
 </div>`)}
function nextSt(id){const o=ORDERS.find(x=>x.id===id);const i=STATUS.findIndex(s=>s.k===o.st);
 if(i<5){o.st=STATUS[i+1].k;if(o.st==='lab')o.stage='cut';if(o.st==='ready'){o.stage='ok';o.over=0}
  openOrder(id);render();
  toast(`<b>${id}</b> → «${ST(o.st).n}». Клиенту автоматически ушло сообщение в WhatsApp.`)}}
function payOrder(id){const o=ORDERS.find(x=>x.id===id);o.paid=o.sum;openOrder(id);render();sparks();
 toast(`Доплата принята, заказ <b>${id}</b> оплачен полностью. Чек ушёл в 1С и клиенту в WhatsApp.`)}

/* ---- МАСТЕРСКАЯ ---- */
SC.lab=()=>`
 <div class="head"><div><h2>Мастерская</h2><p>Очередь сборки по этапам. Мастер видит рецепт, оправу и линзы, отмечает готовность этапа — статус тут же меняется в заказе и уходит клиенту.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Печать бланка заказа для мастерской со всеми параметрами и штрихкодом.')">Печать бланка</button></div></div>
 <div class="strip">
  <div><small>В МАСТЕРСКОЙ</small><b>${ORDERS.filter(o=>['lab','otk','fix'].includes(o.st)).length}</b><span>мастера: ${MASTERS.join(', ')}</span></div>
  <div><small>СРЕДНИЙ СРОК СБОРКИ</small><b>2,4 дня</b><span>норматив 3 дня</span></div>
  <div><small>ПЕРЕДЕЛКИ</small><b class="bad">${ORDERS.filter(o=>o.st==='fix').length}</b><span>1,8% от заказов</span></div>
  <div><small>ПРОСРОЧЕНО</small><b class="warn">${ORDERS.filter(o=>o.over).length}</b><span>подсвечено красным</span></div>
  <div><small>СОБРАНО ЗА МЕСЯЦ</small><b>214</b><span>из них 9 по гарантии</span></div>
 </div>
 <div class="kwrap">
 ${LSTAGES.map(([k,name,tone])=>{const cards=ORDERS.filter(o=>['lab','otk','fix','ready'].includes(o.st)&&o.stage===k);
  return `<div class="kcol"><h4>${name}<span>${cards.length}</span></h4>
  ${cards.map(o=>{const c=cl(o.cid);const r=c.rx[0];return `<div class="kcard" style="--tone:${tone}" onclick="openOrder('${o.id}')">
   <b>${o.id} · ${esc(c.n.split(' ')[0])}</b>
   <div class="sub">${fr(o.frame).br} · ${ln(o.lens).n.split('·')[0]}</div>
   <div class="sub mono" style="color:var(--acc2)">OD ${sgn(r.od.s)} · OS ${sgn(r.os.s)} · PD ${r.pd}</div>
   <div class="kfoot"><span class="tag ${o.over?'red':''}">${o.due}</span>${k!=='ok'?`<button class="btn" style="padding:4px 8px;font-size:9px" onclick="event.stopPropagation();labNext('${o.id}')">✓ этап</button>`:'<span class="tag green">готово</span>'}</div>
  </div>`}).join('')||'<p class="mini" style="padding:8px 4px">Пусто</p>'}</div>`}).join('')}
 </div>
 <div class="hint"><b>Чего нет в текущей программе:</b> мастер работает с планшета прямо у станка — отмечает этап и фотографирует готовую работу. Фото сохраняется в заказе: при споре о царапине видно, в каком виде очки уходили клиенту.</div>`;
function labNext(id){const o=ORDERS.find(x=>x.id===id);const i=LSTAGES.findIndex(s=>s[0]===o.stage);
 if(i<LSTAGES.length-1){o.stage=LSTAGES[i+1][0];
  if(o.stage==='qc')o.st='otk';
  if(o.stage==='ok'){o.st='ready';o.over=0}
  render();
  toast(`<b>${id}</b>: этап «${LSTAGES[i][1]}» закрыт → «${LSTAGES[i+1][1]}»${o.stage==='ok'?'. Клиенту ушло сообщение «очки готовы к выдаче»':''}.`)}}

/* ---- КЛИЕНТЫ ---- */
SC.clients=()=>`
 <div class="head"><div><h2>Клиенты</h2><p>Карточка клиента со всей историей: рецепты, заказы, гарантия, контактные линзы и напоминания. Данные общие по всей сети — клиент может прийти в любой салон.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Сегодня система отправила: 12 напоминаний о замене линз, 8 приглашений на плановый осмотр, 3 поздравления с днём рождения.')">Напоминания · 23</button><button class="btn acc" onclick="toast('Карточка нового клиента создаётся за 20 секунд: телефон, имя, дата рождения — остальное подтянется с приёма.')">+ Клиент</button></div></div>
 <div class="strip">
  <div><small>КЛИЕНТОВ В БАЗЕ</small><b>4 128</b><span>с историей рецептов</span></div>
  <div><small>ВЕРНУЛИСЬ ЗА ГОД</small><b class="good">61%</b><span>по напоминаниям — 38%</span></div>
  <div><small>НА КОНТАКТНЫХ ЛИНЗАХ</small><b>128</b><span>напоминания о замене</span></div>
  <div><small>ДЕТИ ПОД КОНТРОЛЕМ</small><b>96</b><span>осмотр каждые 6 мес</span></div>
  <div><small>СРЕДНИЙ LTV</small><b>218 000 ₸</b><span>за 3 года</span></div>
 </div>
 <div class="panel"><div class="tw"><table class="data" style="min-width:820px"><thead><tr><th>Клиент</th><th>Салон</th><th class="right">Визитов</th><th>Последний рецепт</th><th>Контактные линзы</th><th class="right">Куплено</th><th>Система напомнит</th></tr></thead><tbody>
 ${CLIENTS.map(c=>{const r=c.rx[0];return `<tr onclick="examC=${c.id};go('exam')">
  <td><b>${esc(c.n)}</b><div class="sub mono">${c.ph} · ${c.age} лет</div></td>
  <td class="mini">${SALONS[c.salon]}</td><td class="right mono">${c.visits}</td>
  <td class="mono">OD ${sgn(r.od.s)} · OS ${sgn(r.os.s)}<div class="sub">${r.d}</div></td>
  <td class="mini">${c.cl?`${c.cl.n}<div class="sub ${c.cl.left<5?'bad':''}">замена ${c.cl.next}</div>`:'—'}</td>
  <td class="right mono"><b>${tg(c.sum)}</b></td>
  <td class="mini">${c.warn?`<span class="tag amber">${esc(c.warn.slice(0,38))}…</span>`:'<span class="tag">по графику</span>'}</td></tr>`}).join('')}
 </tbody></table></div>
 <div class="hint"><b>Единая база по сети:</b> клиент проверял зрение на Горького, а очки заказывает в «Меге» — рецепт и история уже там. Врач видит, что и когда покупалось, и не задаёт лишних вопросов.</div></div>`;

/* ---- СКЛАД ---- */
let selCell=null;
SC.stock=()=>`
 <div class="head"><div><h2>Склад и линзы</h2><p>Оправы со штрихкодами и маркировкой, матрица линз по диоптриям, партии контактных линз со сроками годности. Автозаказ у поставщика — по электронному обмену, как в текущей программе, только быстрее.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Приём товара по накладной: сканируем штрихкоды, система сверяет с поставкой и ставит на учёт.')">Приём товара</button><button class="btn" onclick="toast('Инвентаризация со сканером: 340 позиций за 25 минут вместо полудня.')">Инвентаризация</button><button class="btn acc" onclick="toast('Автозаказ сформирован: Biofinity 10 упаковок, линзы 1.67 (2 позиции), оправа Nikon Flex. Отправлен поставщику по электронному обмену.')">Автозаказ · 3</button></div></div>
 <div class="strip">
  <div><small>ОПРАВ В НАЛИЧИИ</small><b>${FRAMES.reduce((a,f)=>a+f.q,0)*47}</b><span>по 4 салонам · со штрихкодами</span></div>
  <div><small>СТОИМОСТЬ ОСТАТКОВ</small><b>18,4 млн ₸</b><span>оправы, линзы, КЛ</span></div>
  <div><small>НИЖЕ МИНИМУМА</small><b class="bad">${CLENSES.filter(c=>c.st!=='ok').length+1}</b><span>автозаказ готов</span></div>
  <div><small>ОБОРАЧИВАЕМОСТЬ</small><b>94 дня</b><span>цель — 75</span></div>
  <div><small>ЗАЛЕЖАЛОСЬ &gt; 180 ДНЕЙ</small><b class="warn">37 оправ</b><span>на 2,1 млн ₸ · в распродажу</span></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph"><div><div class="ph-title">Матрица линз по диоптриям</div><div class="ph-sub">сфера × цилиндр · зелёное — есть, жёлтое — заканчивается, красное — под заказ</div></div><span class="tag acc">склад сети</span></div>
   <div class="lensgrid"><table>
    <tr><th>Sph \\ Cyl</th>${CYL.map(c=>`<th>${c?c.toFixed(2):'0.00'}</th>`).join('')}</tr>
    ${SPH.map(s=>`<tr><th style="text-align:right">${sgn(s)}</th>${CYL.map(c=>{const v=lensStock(s,c);const key=s+'/'+c;
     return `<td><div class="cell ${v===2?'ok':v===1?'low':'no'} ${selCell===key?'sel':''}" onclick="selCell='${key}';keepScroll();toast('Линза Sph ${sgn(s)} Cyl ${c.toFixed(2)}: ${v===2?'есть на складе — заказ уйдёт в мастерскую сразу':v===1?'осталась 1 пара, автозаказ поставщику сформирован':'нет в наличии — срок поставки 3–5 дней, клиент предупреждён'}')">${v===2?'✓':v===1?'!':'—'}</div></td>`}).join('')}</tr>`).join('')}
   </table></div>
   <div class="hint"><b>Зачем это продавцу:</b> при оформлении заказа сразу видно, лежит ли линза на складе или её ждать 5 дней. Клиенту называют честный срок, а не «примерно неделя».</div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Контактные линзы · партии и сроки</div>
    ${CLENSES.map(c=>`<div style="display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line)">
     <div><b style="font-size:10px">${c.n}</b><div class="sub">${c.pk} · годен до ${c.exp}</div></div>
     <b class="mono ${c.st==='no'?'bad':c.st==='low'?'warn':''}">${c.q}</b>
     ${c.st==='no'?'<span class="tag red">нет</span>':c.st==='low'?'<span class="tag amber">заказать</span>':'<span class="tag green">есть</span>'}</div>`).join('')}
    <div class="hint"><b>Сроки годности под контролем:</b> система предупредит за 3 месяца до истечения и предложит партию в акцию, чтобы не списывать в убыток.</div>
   </div>
   <div class="panel" style="margin-top:10px"><div class="ph-title">Оправы · оборот</div>
    ${FRAMES.slice(0,5).map(f=>`<div class="fr" style="grid-template-columns:120px 1fr 54px"><span style="font-size:9px">${f.br} ${f.m.split(' ')[0]}</span><div class="ftrack" style="height:14px"><i style="--w:${Math.min(100,f.q*18+20)}%"></i></div><b>${f.q} шт</b></div>`).join('')}
    <div class="mini" style="margin-top:7px">Маркировка и штрихкоды — на каждой оправе; продажа списывает позицию автоматически.</div>
   </div>
  </div>
 </div>`;

/* ---- КАССА ---- */
SC.sales=()=>`
 <div class="head"><div><h2>Касса и продажи</h2><p>Чеки, оплаты и возвраты по всем салонам. Касса работает даже без интернета — при восстановлении связи всё синхронизируется.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Смена закрыта, Z-отчёт сформирован и ушёл в 1С.')">Закрыть смену</button><button class="btn acc" onclick="toast('Новая продажа: сканируем товар или выбираем заказ клиента — чек печатается и уходит в WhatsApp.')">+ Продажа</button></div></div>
 <div class="strip">
  <div><small>ВЫРУЧКА ДНЯ · СЕТЬ</small><b>1,24 млн ₸</b><span>наличные 22% · карта 61% · Kaspi 17%</span></div>
  <div><small>ЧЕКОВ</small><b>28</b><span>средний 44 300 ₸</span></div>
  <div><small>ПРЕДОПЛАТ</small><b>412 000 ₸</b><span>по заказам в работе</span></div>
  <div><small>ДОЛГИ ПО ЗАКАЗАМ</small><b class="warn">${tg(ORDERS.reduce((a,o)=>a+(o.sum-o.paid),0))}</b><span>доплата при выдаче</span></div>
  <div><small>ВОЗВРАТЫ</small><b>1</b><span>0,4% от чеков</span></div>
 </div>
 <div class="panel"><div class="tw"><table class="data" style="min-width:760px"><thead><tr><th>Время</th><th>Чек</th><th>Клиент</th><th>Салон</th><th>Состав</th><th>Оплата</th><th class="right">Сумма</th></tr></thead><tbody>
 ${[['18:42','#4128','Динара Оспанова',0,'Доплата по заказу З-4821','Kaspi',136000],
    ['17:20','#4127','Марат Абдуллин',2,'Очки готовые + футляр','карта',80000],
    ['16:05','#4126','Розничный покупатель',1,'Раствор + капли','наличные',7400],
    ['15:31','#4125','Айгерим Сатпаева',0,'Контактные линзы 2 уп.','карта',28000],
    ['14:12','#4124','Ержан Мухтаров',1,'Предоплата по заказу З-4815','карта',125000],
    ['12:48','#4123','Камила Ержанова',1,'Приём врача + подгонка','наличные',6000]]
  .map(r=>`<tr onclick="toast('Чек ${r[1]}: состав, оплата, продавец и связанный заказ. Возврат оформляется отсюда в два клика.')">
   <td class="mono">${r[0]}</td><td class="mono"><b>${r[1]}</b></td><td>${r[2]}</td><td class="mini">${SALONS[r[3]]}</td>
   <td class="mini">${r[4]}</td><td><span class="tag ${r[5]==='Kaspi'?'amber':r[5]==='карта'?'blue':'green'}">${r[5]}</span></td>
   <td class="right mono"><b>${tg(r[6])}</b></td></tr>`).join('')}
 </tbody></table></div>
 <div class="hint"><b>Рассрочка и сертификаты</b> оформляются здесь же: Kaspi Red, подарочные сертификаты, скидки по акциям и корпоративные договоры с компаниями на очки для сотрудников.</div></div>`;

/* ---- АНАЛИТИКА ---- */
SC.analytics=()=>`
 <div class="head"><div><h2>Аналитика</h2><p>Не «отчёты, которые надо выгружать», а живые цифры: где теряются клиенты, что продаётся, кто из врачей конвертирует приёмы в заказы и как оборачивается склад.</p></div>
 <div class="btns"><select class="rsel"><option>Август 2026</option><option>Июль 2026</option><option>Квартал</option><option>Год</option></select><button class="btn" onclick="toast('Отчёт выгружен в Excel.')">Экспорт</button></div></div>
 <div class="strip">
  <div><small>ВЫРУЧКА МЕСЯЦА</small><b>25,5 млн ₸</b><span class="good">▲ 14% год к году</span></div>
  <div><small>СРЕДНИЙ ЧЕК</small><b>148 000 ₸</b><span class="good">▲ 11%</span></div>
  <div><small>КОНВЕРСИЯ ПРИЁМ→ЗАКАЗ</small><b>58%</b><span>по врачам: 43–71%</span></div>
  <div><small>МАРЖА</small><b>52%</b><span>линзы 61% · оправы 44%</span></div>
  <div><small>ВОЗВРАТ КЛИЕНТОВ</small><b>61%</b><span>в течение года</span></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph-title">Выручка по месяцам · сеть</div>
   <div class="chart">${[['мар',62,52],['апр',70,58],['май',76,64],['июн',84,70],['июл',92,78],['авг',100,84]].map(m=>`<div class="chart-col"><i style="--h:${m[1]}%;--p:${m[2]}%"></i><span>${m[0]}</span></div>`).join('')}</div>
   <div class="kpi-mini"><div style="--tone:var(--acc)"><small>ЗАКАЗОВ</small><b>214</b></div><div style="--tone:var(--violet)"><small>ПРИЁМОВ</small><b>368</b></div><div style="--tone:#22c55e"><small>НОВЫХ КЛИЕНТОВ</small><b>96</b></div><div style="--tone:var(--blue)"><small>ПОВТОРНЫХ</small><b>118</b></div></div>
  </div>
  <div class="panel"><div class="ph-title">Конверсия по врачам</div>
   ${[['Ахметова А. К.',71,'var(--acc)'],['Ким С. В.',58,'var(--blue)'],['Нурланова Ж. Б.',43,'var(--amber)']]
     .map(r=>`<div class="fr" style="grid-template-columns:120px 1fr 40px"><span>${r[0]}</span><div class="ftrack"><i style="--w:${r[1]}%;background:${r[2]}"></i></div><b>${r[1]}%</b></div>`).join('')}
   <div class="hint"><b>Разница в 28 пунктов</b> — это деньги: если подтянуть третьего врача до среднего, сеть получит ~1,8 млн ₸ в месяц. Видно, кому нужна помощь с подбором и презентацией линз.</div>
  </div>
 </div>
 <div class="g3">
  <div class="panel"><div class="ph-title">Топ оправ месяца</div>
   ${FRAMES.slice(0,5).map((f,i)=>`<div class="fr" style="grid-template-columns:126px 1fr 40px"><span style="font-size:9px">${f.br} ${f.m.split(' ')[0]}</span><div class="ftrack" style="height:15px"><i style="--w:${100-i*17}%"></i></div><b>${34-i*5}</b></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Что докупают к очкам</div>
   ${[['Защита от синего света',62,'var(--acc)'],['Антиблик премиум',48,'var(--violet)'],['Футляр и уход',37,'var(--blue)'],['Вторая пара со скидкой',14,'#22c55e']]
     .map(r=>`<div class="fr" style="grid-template-columns:140px 1fr 40px"><span>${r[0]}</span><div class="ftrack" style="height:15px"><i style="--w:${r[1]/62*100}%;background:${r[2]}"></i></div><b>${r[1]}%</b></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Склад · оборачиваемость</div>
   ${[['Линзы',48,'#22c55e'],['Контактные линзы',62,'var(--blue)'],['Оправы масс-маркет',96,'var(--amber)'],['Оправы премиум',178,'var(--red)']]
     .map(r=>`<div class="fr" style="grid-template-columns:140px 1fr 48px"><span>${r[0]}</span><div class="ftrack" style="height:15px"><i style="--w:${r[1]/178*100}%;background:${r[2]}"></i></div><b>${r[1]} дн</b></div>`).join('')}
   <div class="hint" style="margin-top:9px"><b>Премиум-оправы лежат по полгода</b> — система предлагает вернуть часть поставщику или уценить, пока модель не устарела.</div>
  </div>
 </div>`;

/* ---- ПЕРСОНАЛ ---- */
SC.staff=()=>`
 <div class="head"><div><h2>Персонал и KPI</h2><p>Выработка каждого сотрудника считается из закрытых заказов и приёмов. Зарплата — оклад плюс процент, всё прозрачно и без споров в конце месяца.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Расчётные листы за август сформированы по каждому сотруднику.')">Расчётные листы</button></div></div>
 <div class="strip">
  <div><small>СОТРУДНИКОВ</small><b>14</b><span>3 врача · 8 продавцов · 2 мастера</span></div>
  <div><small>ФОНД ЗАРПЛАТЫ</small><b>4,1 млн ₸</b><span>16% от выручки</span></div>
  <div><small>ЛУЧШИЙ ПРОДАВЕЦ</small><b>Дана</b><span>4,8 млн ₸ за месяц</span></div>
  <div><small>СРЕДНИЙ ЧЕК ПО ПРОДАВЦАМ</small><b>от 96 до 189 тыс ₸</b><span>есть чему учить</span></div>
  <div><small>ОЦЕНКА КЛИЕНТОВ</small><b class="good">4,8 ★</b><span>после выдачи заказа</span></div>
 </div>
 <div class="panel"><div class="tw"><table class="data" style="min-width:800px"><thead><tr><th>Сотрудник</th><th>Роль · салон</th><th class="right">Заказов / приёмов</th><th class="right">Выручка</th><th class="right">Средний чек</th><th class="right">%</th><th class="right">Зарплата</th><th class="right">Оценка</th></tr></thead><tbody>
 ${[['Дана','Продавец · Горького',31,4800000,155000,7,4.9],
    ['Тимур','Продавец · Мега',26,3900000,150000,7,4.8],
    ['Алия','Продавец · Абая',22,2100000,96000,6,4.7],
    ['Ерлан','Продавец · Сатпаева',18,3400000,189000,7,4.9],
    ['Ахметова А. К.','Врач · Горького',128,0,0,0,5.0],
    ['Ким С. В.','Врач · Мега',104,0,0,0,4.8],
    ['Нурланова Ж. Б.','Врач · Абая',96,0,0,0,4.6],
    ['Олжас','Мастер · цех',86,0,0,0,4.9]]
  .map(r=>`<tr onclick="toast('${r[0]}: заказы, приёмы, динамика по месяцам и оценки клиентов — в карточке сотрудника.')">
   <td><b>${r[0]}</b></td><td class="mini">${r[1]}</td><td class="right mono">${r[2]}</td>
   <td class="right mono">${r[3]?tg(r[3]):'<span class="mini">—</span>'}</td>
   <td class="right mono">${r[4]?tg(r[4]):'<span class="mini">—</span>'}</td>
   <td class="right mono">${r[5]?r[5]+'%':'оклад'}</td>
   <td class="right mono good"><b>${tg(r[3]?r[3]*r[5]/100+180000:r[2]*2500+220000)}</b></td>
   <td class="right mono">${r[6]} ★</td></tr>`).join('')}
 </tbody></table></div>
 <div class="hint"><b>Оценка клиента</b> приходит в WhatsApp после выдачи заказа и привязывается к продавцу и врачу — премия считается не «по ощущению», а по фактам.</div></div>`;

/* ---- ГЛАЗАМИ КЛИЕНТА ---- */
SC.client=()=>`
 <div class="head"><div><h2>Глазами клиента</h2><p>Всё, что клиент получает в WhatsApp, — от записи на приём до напоминания о плановом осмотре через год. Ни одно из этих сообщений не пишет сотрудник.</p></div></div>
 <div class="g2">
  <div class="panel"><div class="ph-title">Запись и заказ</div>
   <div style="background:var(--bg2);border:1px solid var(--line2);border-radius:14px;padding:13px">
    <div class="mini" style="text-align:center;margin-bottom:9px">WhatsApp · Оптика «ОКО»</div>
    <div class="wa-msg">Айгерим, здравствуйте! Вы записаны на проверку зрения <b>завтра в 10:00</b>, салон на Горького, 42. Врач — Ахметова А. К.<div class="wa-btn" onclick="toast('Клик клиента: запись подтверждена, врач видит это в журнале.')">Подтвердить</div><div class="wa-btn" onclick="toast('Клик: система предложила свободные окна на другие дни.')">Перенести</div><time>вчера 18:00 · автоматически</time></div>
    <div class="wa-msg out">Подтверждаю 👍<time>18:04</time></div>
    <div class="wa-msg">Спасибо за визит! Ваш рецепт: OD −2,25 · OS −2,50 · PD 63. Заказ <b>З-4818</b> оформлен, готовность — 26 августа. Сумма 141 000 ₸, предоплата принята.<time>сегодня 11:20</time></div>
   </div>
  </div>
  <div class="panel"><div class="ph-title">Готовность и возвращение</div>
   <div style="background:var(--bg2);border:1px solid var(--line2);border-radius:14px;padding:13px">
    <div class="wa-msg">Линзы для вашего заказа поступили, очки в сборке 🔧 Готовность подтверждаем — 26 августа.<time>23.08 · автоматически</time></div>
    <div class="wa-msg">Айгерим, ваши очки готовы! 👓 Забрать можно сегодня до 21:00 на Горького, 42. При выдаче подгоним оправу по лицу — это бесплатно и входит в заказ.<div class="wa-btn" onclick="toast('Клик клиента: время получения выбрано, продавец видит это в заказе.')">Заберу сегодня</div><time>26.08</time></div>
    <div class="wa-msg">Как вам новые очки? Оцените, пожалуйста, от 1 до 5 ⭐ — это займёт секунду.<time>через 2 дня</time></div>
    <div class="wa-msg">Айгерим, ваши контактные линзы заканчиваются через 3 дня. Отложить упаковку в салоне на Горького?<div class="wa-btn" onclick="toast('Клик: упаковка отложена, продавец получил задачу.')">Отложить</div><time>через 3 мес · автоматически</time></div>
    <div class="wa-msg">Прошёл год с последней проверки зрения. Для вас — бесплатный приём и скидка 15% на новые линзы, если рецепт изменился.<div class="wa-btn" onclick="toast('Клик: клиент записался на приём — вот так работает возврат клиентов.')">Записаться</div><time>через 12 мес</time></div>
   </div>
  </div>
 </div>
 <div class="hint"><b>Это и есть разница с текущей программой:</b> вместо email- и SMS-рассылок «в никуда» — цепочка сообщений в WhatsApp, привязанная к рецепту и заказу конкретного человека. Возврат клиентов через год вырос с 38% до 61%.</div>`;

/* ---- НАСТРОЙКИ ---- */
SC.settings=()=>`
 <div class="head"><div><h2>Настройки</h2><p>Салоны, услуги и цены, поставщики, шаблоны сообщений, права ролей и интеграции — меняются без разработчика.</p></div></div>
 <div class="g2">
  <div class="panel"><div class="ph-title">Что настраивается самостоятельно</div>
   ${[['Салоны и кабинеты','4 салона, 6 кабинетов, графики работы'],['Услуги и цены','приём, подбор, изготовление, подгонка'],['Скидки и акции','дни рождения, вторая пара, корпоративные'],['Сроки изготовления','по типам линз — от 3 до 10 дней'],['Шаблоны сообщений','запись, готовность, замена КЛ, приглашение через год'],['Права ролей','что видит врач, продавец, мастер, бухгалтер'],['Минимальные остатки','по каждой позиции — для автозаказа']]
     .map(x=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);font-size:10px"><span class="muted">${x[0]}</span><b style="text-align:right;max-width:58%">${x[1]}</b></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Интеграции</div>
   ${[['1C','1С:Бухгалтерия','чеки, накладные, зарплата — выгрузка автоматически'],
      ['KKM','Онлайн-касса','фискальные чеки, работа без интернета с досинхронизацией'],
      ['WA','WhatsApp','вся клиентская коммуникация вместо SMS-рассылок'],
      ['SUP','Поставщики линз','электронный заказ и статус поставки прямо в заказе'],
      ['MRK','Маркировка товара','штрихкоды и коды маркировки при приёмке и продаже'],
      ['MED','Медицинские требования','медкарта, рецепты, журнал приёмов по форме'],
      ['SITE','Сайт и онлайн-запись','виджет записи и каталог оправ с наличием']]
    .map(x=>`<div style="display:flex;gap:10px;align-items:center;border:1px solid var(--line);background:var(--panel2);padding:10px;margin-bottom:6px;border-radius:10px">
     <div style="width:38px;height:38px;background:var(--bg2);color:var(--acc2);display:grid;place-items:center;font:600 7px 'IBM Plex Mono',monospace;flex:none;border-radius:9px">${x[0]}</div>
     <div style="flex:1"><b style="font-size:10px">${x[1]}</b><p class="mini" style="margin:3px 0 0">${x[2]}</p></div></div>`).join('')}
  </div>
 </div>
 <div class="panel"><div class="ph-title">Чем эта система отличается от той, что у вас сейчас</div>
  <div class="tw"><table class="data" style="min-width:720px"><thead><tr><th>Сейчас</th><th>В новой системе</th></tr></thead><tbody>
  ${[['Аренда программы каждый месяц, цена растёт','Система ваша навсегда: один раз заплатили — дальше только по желанию'],
     ['Интерфейс перегружен, обучение новичка — недели','Современный экран, продавец учится за час; тёмная и светлая темы'],
     ['Конверсия «приём → заказ» нигде не видна','Главная метрика салона — на пульте, в разрезе врачей и салонов'],
     ['История зрения — просто список рецептов','График динамики: клиент видит, как менялось зрение, и легче соглашается'],
     ['Совместимость рецепта и оправы — в голове продавца','Система проверяет сама и предупреждает до оформления'],
     ['Email- и SMS-рассылки','WhatsApp-цепочки: статусы заказа, замена линз, приглашение через год'],
     ['Мастер получает бумажный бланк','Планшет у станка: этапы, фото готовой работы, сроки'],
     ['Данные у поставщика ПО','Данные и код у вас, на вашем сервере']]
   .map(r=>`<tr style="cursor:default"><td class="mini" style="color:var(--muted)">${r[0]}</td><td><b>${r[1]}</b></td></tr>`).join('')}
  </tbody></table></div>
 </div>`;

/* ===== КАРКАС ===== */
function keepScroll(){const el=document.getElementById('content');const s=el.scrollTop;render();el.scrollTop=s}
function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([n,r],i)=>`<button class="role" onclick="enter('${n}')"><code>0${i+1}</code><b>${n}</b><span>${r.note}</span></button>`).join('')}
function enter(n){role=n;const r=ROLES[n];
 document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');
 document.getElementById('rav').textContent=r.av;document.getElementById('rname').textContent=n;document.getElementById('rrole').textContent=r.note;
 buildNav();const q=new URLSearchParams(location.search).get('s');go(q&&r.s.includes(q)?q:r.s[0]);
 toast(`Роль <b>${n}</b>: показаны только свои разделы.`)}
function buildNav(){const al=ROLES[role].s;
 document.getElementById('nav').innerHTML=NAV.map(([g,items])=>{const x=items.filter(i=>al.includes(i[0]));
  return x.length?`<div class="nav-group">${g}</div>`+x.map(i=>`<button class="nav-item" data-go="${i[0]}" onclick="go('${i[0]}')"><span class="nav-code">${i[1]}</span><span>${i[2]}</span>${i[3]?`<span class="nav-badge">${i[3]}</span>`:'<span></span>'}</button>`).join(''):''}).join('');
 const s=document.getElementById('rsel');s.innerHTML=Object.keys(ROLES).map(n=>`<option ${n===role?'selected':''}>${n}</option>`).join('');s.onchange=()=>enter(s.value)}
function go(s){if(!ROLES[role].s.includes(s))s=ROLES[role].s[0];cur=s;
 document.getElementById('ttl').textContent=TITLES[s][0];document.getElementById('sub').textContent=TITLES[s][1];
 document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('on',x.dataset.go===s));
 render();document.getElementById('rail').classList.remove('open');document.getElementById('content').scrollTop=0;
 try{const u=new URL(location.href);u.searchParams.set('s',s);history.replaceState(null,'',u.pathname+'?'+u.searchParams.toString())}catch(e){}}
function render(){document.getElementById('content').innerHTML=`<div class="screen">${SC[cur]?SC[cur]():'<p class="mini">Раздел в разработке.</p>'}</div>`}
function openD(t,s,tabs,body){document.getElementById('dt').textContent=t;document.getElementById('ds').innerHTML=s;
 document.getElementById('dtabs').innerHTML=tabs.map((x,i)=>`<button class="dtab ${i===0?'on':''}">${x}</button>`).join('');
 document.getElementById('db').innerHTML=body;document.getElementById('dbg').classList.add('show')}
function closeD(){document.getElementById('dbg').classList.remove('show')}
let tt;function toast(h){const t=document.getElementById('toast');t.innerHTML=h;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),5000)}
function sparks(){const c=['#06b6d4','#38d9ee','#8b7cf6','#22c55e','#e8eefb','#3b82f6'];
 for(let i=0;i<70;i++){const s=document.createElement('i');s.className='spark';
  s.style.cssText=`left:${Math.random()*100}vw;top:-14px;background:${c[i%6]};animation-delay:${Math.random()*.45}s;transform:rotate(${Math.random()*360}deg)`;
  document.body.appendChild(s);setTimeout(()=>s.remove(),2400)}}
/* ТЕМА */
function applyTheme(t){const light=t==='light';
 document.body.classList.toggle('light',light);
 const m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',light?'#f2f7fb':'#080f1c');
 const b=document.getElementById('themeBtn');if(b)b.textContent=light?'🌙 Тёмная':'☀ Светлая';
 const g=document.getElementById('themeBtnGate');if(g)g.textContent=light?'🌙 Тёмная версия':'☀ Светлая версия';
 try{localStorage.setItem('oko-theme',t)}catch(e){}}
function toggleTheme(){const light=document.body.classList.contains('light');applyTheme(light?'dark':'light');
 toast(light?'Тёмная версия включена.':'Светлая версия включена — выбор запомнится.')}
(function(){let t='dark';try{t=localStorage.getItem('oko-theme')||'dark'}catch(e){}
 const q=new URLSearchParams(location.search).get('theme');if(q==='light'||q==='dark')t=q;applyTheme(t)})();
const TOUR=[
 ['sched','<b>Шаг 1.</b> Журнал записи: онлайн-запись с сайта и из WhatsApp попадает сюда сама, клиенту уходят напоминания — неявки падают с 23% до 7%.',5600],
 ['exam','<b>Шаг 2.</b> Кабинет врача: рецепт OD/OS, карта осмотра и график динамики зрения. Клиент видит, как менялись диоптрии, — и легче соглашается на новые линзы.',6000],
 ['neworder','<b>Шаг 3.</b> Конструктор заказа: оправа + линзы + покрытия, цена сразу. Система проверяет, подходит ли выбранное к рецепту, и предупреждает продавца.',6000],
 ['orders','<b>Шаг 4.</b> Заказы всей сети: статусы, сроки, просрочка и долги. Каждый переход статуса клиент получает в WhatsApp — он больше не звонит «готово ли?».',5600],
 ['lab','<b>Шаг 5.</b> Мастерская по этапам: раскрой → обточка → сборка → ОТК. Мастер работает с планшета у станка и фотографирует готовую работу.',5600],
 ['stock','<b>Шаг 6.</b> Склад: матрица линз по диоптриям — видно, лежит линза или её ждать 5 дней. Автозаказ поставщику формируется сам.',5600],
 ['analytics','<b>Итог.</b> Аналитика: конверсия «приём → заказ» по врачам, средний чек, оборачиваемость склада. Разница между врачами в 28 пунктов — это 1,8 млн ₸ в месяц.',6000]
];
let tourT=null,tourI=0;
function tour(){if(tourT){stopTour();return}tourI=0;document.getElementById('tourBtn').textContent='■ Остановить';step()}
function step(){if(tourI>=TOUR.length){stopTour();sparks();toast('<b>Весь путь клиента</b> — от записи до возвращения через год — в одной системе, которая принадлежит вам.');return}
 const [scr,txt,ms]=TOUR[tourI++];if(ROLES[role].s.includes(scr))go(scr);toast(txt);tourT=setTimeout(step,ms)}
function stopTour(){clearTimeout(tourT);tourT=null;const b=document.getElementById('tourBtn');if(b)b.textContent='▶ Сценарий'}
document.getElementById('menuBtn').onclick=()=>document.getElementById('rail').classList.toggle('open');
renderRoles();
(function(){const q=new URLSearchParams(location.search).get('s');if(q&&TITLES[q]){
 const r=q==='client'?'Клиент':q==='lab'?'Мастер · сборка':q==='exam'||q==='sched'?'Врач-оптометрист':q==='neworder'?'Продавец-консультант':'Владелец сети';enter(r)}})();
