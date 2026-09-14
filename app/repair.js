/* REPAIR AUTO · портал автосервиса и продажи запчастей · демо */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const num=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const pct=(a,b)=>num(a/b*100)+'%';
const mln=n=>num(n/1000000)+' млн';
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};

/* ===== РАЗДЕЛЫ ===== */
const SEC=[
 {k:'dash', ic:'▦', n:'Пульт',    sub:[['dash','Сводка'],['analytics','Аналитика']]},
 {k:'lead', ic:'⇄', n:'Заявки',   sub:[['inbox','Входящие'],['funnel','Воронка'],['path','Путь клиента']]},
 {k:'work', ic:'⚒', n:'Цех',      sub:[['orders','Заказ-наряды'],['posts','Посты и загрузка'],['photo','Фотоотчёт']]},
 {k:'cl',   ic:'☺', n:'Клиенты',  sub:[['clients','Клиенты'],['cars','Автомобили'],['book','Сервисная книжка'],['cab','Кабинет клиента']]},
 {k:'part', ic:'⬢', n:'Запчасти', sub:[['stock','Склад'],['parts','Подбор и заказ'],['sales','Продажи']]},
 {k:'mkt',  ic:'✆', n:'Маркетинг',sub:[['wa','WhatsApp и рассылки'],['remind','Напоминания о ТО'],['ref','Реферальная программа']]},
 {k:'br',   ic:'⌂', n:'Филиалы',  sub:[['branches','Сеть сервисов'],['bcab','Кабинет управляющего']]},
 {k:'mgmt', ic:'★', n:'Управление',sub:[['tasks','Задачи'],['mech','Механики и зарплата'],['reports','Отчёты']]},
 {k:'setup',ic:'⚙', n:'Настройки',sub:[['settings','Услуги и этапы'],['users','Пользователи'],['integr','Интеграции'],['economy','Стоимость'],['stack','Что получаете']]}
];
const SECOF={},SUBN={};
SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));

/* ===== РОЛИ ===== */
const ROLES={
 'Менеджер-консультант':{av:'АС',n:'Асхат',r:'заявки и клиенты',note:'Заявки, запись, клиенты, продажа запчастей',
  s:['inbox','funnel','clients','cars','book','sales','parts','wa','ref','tasks']},
 'Мастер-приёмщик':{av:'НР',n:'Нурлан',r:'приёмка и цех',note:'Заказ-наряды, посты, фотоотчёт, выдача',
  s:['orders','posts','photo','cars','book','parts','stock','tasks','clients']},
 'Механик':{av:'АЗ',n:'Азамат',r:'ремонт',note:'Свои работы, фотоотчёт, запрос запчастей',
  s:['posts','photo','orders','stock','tasks']},
 'Кладовщик':{av:'ЕР',n:'Ержан',r:'склад запчастей',note:'Остатки, поступление, подбор, выдача в цех',
  s:['stock','parts','sales','orders','tasks']},
 'Бухгалтер-кассир':{av:'ГЛ',n:'Гульмира',r:'касса и деньги',note:'Оплаты, выручка, зарплата механиков, отчёты',
  s:['reports','sales','orders','mech','clients','analytics']},
 'Управляющий сервисом':{av:'БК',n:'Бекзат',r:'филиал',note:'Свой сервис целиком: загрузка, выручка, люди',
  s:['bcab','posts','orders','inbox','funnel','mech','tasks','reports','stock','analytics']},
 'Владелец':{av:'СР',n:'Серик',r:'сеть сервисов',note:'Все филиалы, деньги, возвратность и стоимость владения',
  s:['dash','analytics','path','branches','bcab','orders','clients','book','remind','ref','wa','mech','reports','integr','users','settings','economy','stack','stock']}
};
let role='Владелец',cur='dash',theme='light';

/* ===== ДАННЫЕ ===== */
const F={
 leads:238, booked:196, orders:168, revenue:18400000, partsShare:46,
 clients:1340, cars:1580, mechs:4, posts:4, staff:5,
 ret:34, lost:62, avgDays:2.1,
 get avg(){return this.revenue/this.orders},
 get conv(){return this.orders/this.leads*100}
};
const CH=[['WhatsApp',96,'g'],['Звонок',71,'a'],['Сайт repair-auto',38,'i'],['Приехал сам',22,''],['Рекомендация',11,'v']];
const SRV=[
 {n:'ТО и замена масла',cnt:54,sum:3240000,h:1.2},
 {n:'Подвеска и ходовая',cnt:31,sum:4030000,h:4.5},
 {n:'Тормозная система',cnt:24,sum:1920000,h:2.4},
 {n:'Двигатель и ГРМ',cnt:17,sum:4590000,h:9.0},
 {n:'Диагностика и электрика',cnt:22,sum:1100000,h:1.6},
 {n:'АКПП и трансмиссия',cnt:12,sum:2760000,h:7.5},
 {n:'Кондиционер и салон',cnt:8,sum:760000,h:2.0}
];
/* этапы воронки — как описал клиент */
const ST=[
 ['new','Новая заявка','#69757f'],['talk','Связались','#2f6f9e'],
 ['rec','Записан на визит','#1c5f86'],['diag','Приёмка и диагностика','#6b4ea8'],
 ['appr','Согласование сметы','#d98324'],['job','В работе','#e31e24'],
 ['ready','Готово к выдаче','#2f8f5b'],['done','Выдано и оплачено','#1c6b44']
];
const STN=Object.fromEntries(ST.map(s=>[s[0],s[1]]));
const STC=Object.fromEntries(ST.map(s=>[s[0],s[2]]));

let LEADS=[
 {id:4412,c:'Ахметов Руслан',ph:'+7 701 ••• 22 41',car:'Toyota Camry 2018',gn:'812 ABC 01',s:'new',ch:'WhatsApp',mg:'Асхат',sum:0,t:'4 мин',what:'Стук в подвеске спереди',hot:1},
 {id:4413,c:'Сейтова Алия',ph:'+7 707 ••• 08 19',car:'Hyundai Tucson 2021',gn:'440 KLM 01',s:'new',ch:'Звонок',mg:'Диана',sum:0,t:'12 мин',what:'Плановое ТО, пробег 60 000',hot:1},
 {id:4414,c:'ТОО «Астана Логистик»',ph:'+7 717 ••• 55 03',car:'Hyundai Porter · 3 ед.',gn:'парк',s:'new',ch:'Сайт repair-auto',mg:'Нурлан',sum:0,t:'26 мин',what:'Обслуживание парка, нужен договор',hot:0},
 {id:4401,c:'Жумабеков Данияр',ph:'+7 747 ••• 31 76',car:'Kia Sportage 2020',gn:'077 DAR 01',s:'talk',ch:'WhatsApp',mg:'Асхат',sum:145000,what:'Замена колодок и дисков'},
 {id:4402,c:'Нурланова Гульнар',ph:'+7 700 ••• 12 88',car:'Lexus RX 2017',gn:'555 GLN 01',s:'talk',ch:'Рекомендация',mg:'Диана',sum:320000,what:'Течь масла, диагностика'},
 {id:4388,c:'Оспанов Бекзат',ph:'+7 708 ••• 74 20',car:'Toyota Land Cruiser 2019',gn:'100 BEK 01',s:'rec',ch:'Звонок',mg:'Асхат',sum:210000,what:'ТО 90 000 км, запись на среду'},
 {id:4389,c:'Каримова Сауле',ph:'+7 705 ••• 66 12',car:'Nissan Qashqai 2019',gn:'321 SAU 01',s:'rec',ch:'WhatsApp',mg:'Диана',sum:96000,what:'Замена масла и фильтров'},
 {id:4376,c:'Мукашев Асет',ph:'+7 701 ••• 90 45',car:'Mitsubishi Outlander 2016',gn:'909 AST 01',s:'diag',ch:'Приехал сам',mg:'Нурлан',sum:0,what:'Не заводится, на диагностике'},
 {id:4377,c:'Досжанова Мадина',ph:'+7 777 ••• 41 30',car:'Chevrolet Cobalt 2021',gn:'212 MDN 01',s:'diag',ch:'WhatsApp',mg:'Нурлан',sum:0,what:'Скрип при торможении'},
 {id:4361,c:'Абдрахманов Кайрат',ph:'+7 702 ••• 19 57',car:'Toyota Prado 2015',gn:'404 KAI 01',s:'appr',ch:'Звонок',mg:'Асхат',sum:486000,what:'Ремонт подвески, смета на согласовании'},
 {id:4362,c:'ИП Сатыбалды',ph:'+7 775 ••• 83 64',car:'Hyundai Staria 2022',gn:'808 SAT 01',s:'appr',ch:'Сайт repair-auto',mg:'Диана',sum:174000,what:'ТО + замена ремня'},
 {id:4350,c:'Ибраева Жанна',ph:'+7 707 ••• 27 05',car:'Kia K5 2021',gn:'606 ZHN 01',s:'job',ch:'WhatsApp',mg:'Нурлан',sum:238000,what:'Замена стоек, пост №2'},
 {id:4351,c:'Серикбаев Нурбол',ph:'+7 701 ••• 58 33',car:'Toyota Camry 2016',gn:'717 NUR 01',s:'job',ch:'Рекомендация',mg:'Асхат',sum:412000,what:'Ремонт двигателя, пост №4'},
 {id:4342,c:'Кенжебаев Марат',ph:'+7 747 ••• 02 91',car:'Hyundai Elantra 2020',gn:'232 MRT 01',s:'ready',ch:'WhatsApp',mg:'Нурлан',sum:118000,what:'ТО готово, клиент уведомлён'},
 {id:4333,c:'Турсынова Асель',ph:'+7 705 ••• 47 18',car:'Toyota RAV4 2019',gn:'151 ASL 01',s:'done',ch:'Звонок',mg:'Асхат',sum:164000,what:'Выдано, оплачено Kaspi'},
 {id:4334,c:'Алиев Дамир',ph:'+7 708 ••• 35 72',car:'Mazda CX-5 2018',gn:'343 DAM 01',s:'done',ch:'WhatsApp',mg:'Диана',sum:287000,what:'Выдано, оплачено картой'}
];
/* заказ-наряды */
const ORD=[
 {id:'ЗН-1842',c:'Ибраева Жанна',car:'Kia K5 2021',gn:'606 ZHN 01',km:74300,st:'В работе',c2:'w',post:2,mech:'Азамат',work:148000,parts:90000,open:'сегодня 09:40',ph:3},
 {id:'ЗН-1841',c:'Серикбаев Нурбол',car:'Toyota Camry 2016',gn:'717 NUR 01',km:186400,st:'В работе',c2:'w',post:4,mech:'Дархан',work:265000,parts:147000,open:'вчера 14:10',ph:5},
 {id:'ЗН-1840',c:'Кенжебаев Марат',car:'Hyundai Elantra 2020',gn:'232 MRT 01',km:58200,st:'Готово к выдаче',c2:'g',post:1,mech:'Руслан',work:46000,parts:72000,open:'сегодня 08:15',ph:4},
 {id:'ЗН-1839',c:'Абдрахманов Кайрат',car:'Toyota Prado 2015',gn:'404 KAI 01',km:214700,st:'Согласование сметы',c2:'',post:0,mech:'Азамат',work:286000,parts:200000,open:'сегодня 10:25',ph:6},
 {id:'ЗН-1838',c:'Турсынова Асель',car:'Toyota RAV4 2019',gn:'151 ASL 01',km:92100,st:'Закрыт',c2:'i',post:0,mech:'Ерке',work:64000,parts:100000,open:'12.09',ph:5},
 {id:'ЗН-1837',c:'Алиев Дамир',car:'Mazda CX-5 2018',gn:'343 DAM 01',km:121600,st:'Закрыт',c2:'i',post:0,mech:'Руслан',work:117000,parts:170000,open:'11.09',ph:4},
 {id:'ЗН-1836',c:'Оспанов Бекзат',car:'Toyota Land Cruiser 2019',gn:'100 BEK 01',km:89400,st:'Закрыт',c2:'i',post:0,mech:'Дархан',work:88000,parts:122000,open:'10.09',ph:5}
];
/* посты-подъёмники */
const BAYS=[
 {n:1,t:'Подъёмник №1',st:'Готово к выдаче',c:'var(--ok)',car:'Hyundai Elantra · 232 MRT 01',mech:'Руслан',ord:'ЗН-1840',p:100,from:'08:15',to:'11:30',eta:'выдача'},
 {n:2,t:'Подъёмник №2',st:'В работе',c:'var(--brand)',car:'Kia K5 · 606 ZHN 01',mech:'Азамат',ord:'ЗН-1842',p:62,from:'09:40',to:'14:00',eta:'осталось 1 ч 40 мин'},
 {n:3,t:'Пост диагностики',c:'var(--info)',st:'Диагностика',car:'Mitsubishi Outlander · 909 AST 01',mech:'Ерке',ord:'ЗН-1843',p:35,from:'11:10',to:'12:30',eta:'осталось 50 мин'},
 {n:4,t:'Подъёмник №4',st:'В работе · длинный ремонт',c:'var(--warn)',car:'Toyota Camry · 717 NUR 01',mech:'Дархан',ord:'ЗН-1841',p:48,from:'вчера',to:'завтра 16:00',eta:'двигатель, 2-й день'}
];
/* клиенты */
const CLI=[
 {n:'Турсынова Асель',ph:'+7 705 ••• 47 18',cars:1,visits:6,sum:940000,last:'12.09.2026',seg:'Постоянный',ref:'AS-4417'},
 {n:'Алиев Дамир',ph:'+7 708 ••• 35 72',cars:2,visits:4,sum:1180000,last:'11.09.2026',seg:'Постоянный',ref:'DA-2210'},
 {n:'ТОО «Астана Логистик»',ph:'+7 717 ••• 55 03',cars:3,visits:11,sum:3640000,last:'09.09.2026',seg:'Корпоративный',ref:'AL-0031'},
 {n:'Оспанов Бекзат',ph:'+7 708 ••• 74 20',cars:1,visits:3,sum:620000,last:'10.09.2026',seg:'Повторный',ref:'BO-7740'},
 {n:'Жумабеков Данияр',ph:'+7 747 ••• 31 76',cars:1,visits:1,sum:98000,last:'02.04.2026',seg:'Спящий',ref:'DZ-3176'},
 {n:'Нурланова Гульнар',ph:'+7 700 ••• 12 88',cars:1,visits:2,sum:410000,last:'18.02.2026',seg:'Спящий',ref:'GN-1288'}
];
/* автомобили */
const CARS=[
 {gn:'151 ASL 01',m:'Toyota RAV4 2019',vin:'JTMB••••••42317',own:'Турсынова Асель',km:92100,next:'ТО через 2 900 км',d:'12.03.2027',w:0},
 {gn:'343 DAM 01',m:'Mazda CX-5 2018',vin:'JM3K••••••88104',own:'Алиев Дамир',km:121600,next:'ТО через 1 800 км',d:'28.09.2026',w:1},
 {gn:'100 BEK 01',m:'Toyota Land Cruiser 2019',vin:'JTEB••••••55902',own:'Оспанов Бекзат',km:89400,next:'ТО через 5 600 км',d:'04.02.2027',w:0},
 {gn:'232 MRT 01',m:'Hyundai Elantra 2020',vin:'KMHD••••••11475',own:'Кенжебаев Марат',km:58200,next:'ТО через 9 800 км',d:'20.05.2027',w:0},
 {gn:'077 DAR 01',m:'Kia Sportage 2020',vin:'KNAP••••••63820',own:'Жумабеков Данияр',km:74800,next:'просрочено 1 200 км',d:'14.08.2026',w:2},
 {gn:'555 GLN 01',m:'Lexus RX 2017',vin:'JTJB••••••29610',own:'Нурланова Гульнар',km:143900,next:'просрочено 4 400 км',d:'02.06.2026',w:2}
];
/* склад запчастей */
const PARTS=[
 {a:'04152-YZZA1',n:'Фильтр масляный Toyota',br:'Toyota',q:24,min:10,pr:2800,sell:4900,loc:'A-12'},
 {a:'90915-YZZD2',n:'Фильтр масляный (усиленный)',br:'Toyota',q:6,min:8,pr:3400,sell:5900,loc:'A-13'},
 {a:'8-97136-104',n:'Колодки тормозные передние',br:'Nibk',q:11,min:6,pr:14500,sell:24900,loc:'B-04'},
 {a:'MZ690115',n:'Масло моторное 5W-30, 4 л',br:'Idemitsu',q:38,min:15,pr:12400,sell:19900,loc:'C-01'},
 {a:'48510-0K03',n:'Амортизатор передний',br:'KYB',q:2,min:4,pr:38000,sell:62000,loc:'D-08'},
 {a:'17801-0H08',n:'Фильтр воздушный',br:'Denso',q:19,min:10,pr:3900,sell:7200,loc:'A-21'},
 {a:'BR-9041',n:'Диск тормозной передний',br:'Brembo',q:0,min:4,pr:41000,sell:68000,loc:'B-11'},
 {a:'SP-2210',n:'Свеча зажигания иридиевая',br:'NGK',q:44,min:20,pr:4200,sell:7400,loc:'E-03'}
];
/* задачи */
const TASKS=[
 {id:901,t:'Перезвонить — заявка висит 26 минут',who:'Нурлан',due:'просрочено',grp:'late',ty:'Продажи',lead:4414},
 {id:902,t:'Согласовать смету по ЗН-1839 (486 000 ₸)',who:'Асхат',due:'сегодня 15:00',grp:'today',ty:'Продажи',lead:4361},
 {id:903,t:'Заказать диски Brembo — остаток 0',who:'Ержан',due:'сегодня',grp:'today',ty:'Склад',lead:0},
 {id:904,t:'Позвонить спящим клиентам: 62 авто без визита 8+ мес',who:'Диана',due:'сегодня',grp:'today',ty:'Возвраты',lead:0},
 {id:905,t:'Подготовить документы на аренду второго сервиса',who:'Серик',due:'завтра',grp:'week',ty:'Административная',lead:0},
 {id:906,t:'Провести аттестацию механиков по новому оборудованию',who:'Бекзат',due:'25.09',grp:'week',ty:'Административная',lead:0},
 {id:907,t:'Сверить кассу за неделю и закрыть смену',who:'Гульмира',due:'пятница',grp:'week',ty:'Финансы',lead:0}
];
/* механики */
const MECH=[
 {n:'Азамат',h:172,rate:2600,ord:41,sum:4260000,q:98},
 {n:'Дархан',h:166,rate:2800,ord:28,sum:5120000,q:96},
 {n:'Руслан',h:158,rate:2300,ord:52,sum:3180000,q:99},
 {n:'Ерке',h:149,rate:2100,ord:47,sum:2470000,q:97}
];
/* филиалы */
const BR=[
 {n:'REPAIR AUTO · Сарыарка',loc:'Астана, ул. Бейбитшилик 23 · 4 поста',rev:18400000,ord:168,load:82,ret:34,st:'Работает'},
 {n:'REPAIR AUTO · Есиль',loc:'Астана, пр. Кабанбай батыра 58 · 3 поста',rev:6100000,ord:57,load:54,ret:21,st:'Запуск'},
 {n:'Третий сервис',loc:'помещение подбирается',rev:0,ord:0,load:0,ret:0,st:'В планах'}
];

/* ===== СОСТОЯНИЕ ===== */
let fMine=false,pathStep=0,seq=4420;
let ODO={km:121600,last:113400,step:10000};
let ECON={core:2500000,hours:10,marg:55,wa:5000,host:12000};
const SC={};

/* ===== ХЕЛПЕРЫ ===== */
const ini=n=>n.replace(/[«»"]/g,'').split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const AVC=['','a','i','v','g'];
const avc=n=>AVC[(n.charCodeAt(0)+n.length)%5];
const avatar=n=>`<span class="av ${avc(n)}" title="${esc(n)}">${esc(ini(n))}</span>`;
const head=(h,p,btns)=>`<div class="hd"><div><h2>${h}</h2><p>${p}</p></div>${btns?`<div class="btns">${btns}</div>`:''}</div>`;

/* ====== ПУЛЬТ ====== */
SC.dash=()=>`${head('Пульт владельца','Выручка, загрузка постов, возвратность и то, что требует вашего решения сегодня. Всё считается из заявок, заказ-нарядов и кассы — сводить руками не нужно.',
 '<button class="bt p" onclick="go(\'path\')">Путь клиента →</button><button class="bt" onclick="go(\'branches\')">Филиалы</button>')}
 <div class="wid">
  <div><small>Выручка за сентябрь</small><b class="a">${mln(F.revenue)} ₸</b><span>работы и запчасти</span></div>
  <div><small>Заказ-нарядов закрыто</small><b>${F.orders}</b><span>средний чек ${fmt(F.avg)} ₸</span></div>
  <div><small>Заявок</small><b class="i">${F.leads}</b><span>дошли до наряда ${num(F.conv)}%</span></div>
  <div><small>Загрузка постов</small><b class="w">82%</b><span>${F.posts} поста · ${F.mechs} механика</span></div>
  <div><small>Вернулись повторно</small><b class="r">${F.ret}%</b><span>это главный резерв</span></div>
 </div>
 <div class="g21">
  <div class="pan"><h3>Воронка заявок за месяц</h3><p>Где теряются клиенты по пути от сообщения до оплаченного наряда.</p>
   ${[['Заявок принято',F.leads,'b'],['Дошли до разговора',214,'i'],['Записались на визит',F.booked,'a'],['Доехали и открыли наряд',178,'w'],['Закрыто и оплачено',F.orders,'g']].map(r=>
    `<div class="fr"><span>${esc(r[0])}</span><div class="bar" style="--w:${r[1]/F.leads*100}%"><i class="${r[2]}"></i></div>
     <b>${fmt(r[1])} · ${pct(r[1],F.leads)}</b></div>`).join('')}
   <div class="note" style="--tone:var(--bad)"><b>Теряется не на входе, а после сметы</b>
    <p>18 клиентов записались, но не доехали, ещё 10 не согласовали смету. Это 28 нарядов и примерно ${mln(28*F.avg)} ₸ за месяц. Система их не теряет: напоминание о записи, смета в WhatsApp с фото и задача менеджеру на следующий день.</p></div>
   <h3 style="margin-top:16px">Откуда приходят заявки</h3>
   ${CH.map(c=>`<div class="fr"><span>${esc(c[0])}</span><div class="bar" style="--w:${c[1]/CH[0][1]*100}%"><i class="${c[2]}"></i></div>
    <b>${c[1]} · ${pct(c[1],F.leads)}</b></div>`).join('')}
  </div>
  <div>
   <div class="pan"><h3>Требует вашего решения</h3>
    <div class="li b"><i>!</i><span><b>62 автомобиля</b> не приезжали больше восьми месяцев<span class="sub">потенциал ${mln(62*F.avg*0.6)} ₸ — нужна рассылка</span></span></div>
    <div class="li w"><i>!</i><span><b>Смета 486 000 ₸</b> висит на согласовании с утра<span class="sub">ЗН-1839, Toyota Prado</span></span></div>
    <div class="li w"><i>!</i><span><b>Диски Brembo</b> — остаток ноль, два наряда ждут<span class="sub">заказ не оформлен</span></span></div>
    <div class="li"><i>✓</i><span>Пост №4 занят вторые сутки — длинный ремонт двигателя<span class="sub">загрузка учтена в расписании</span></span></div>
    <div class="li"><i>✓</i><span>Есиль вышел на 54% загрузки — плюс 12% за неделю</span></div>
   </div>
   <div class="pan"><h3>Деньги за сентябрь</h3>
    <div class="kv"><span>Работы</span><b>${mln(F.revenue*(100-F.partsShare)/100)} ₸ · ${100-F.partsShare}%</b></div>
    <div class="kv"><span>Запчасти</span><b>${mln(F.revenue*F.partsShare/100)} ₸ · ${F.partsShare}%</b></div>
    <div class="kv"><span>Средний чек</span><b>${fmt(F.avg)} ₸</b></div>
    <div class="kv"><span>Зарплата механиков</span><b>${mln(MECH.reduce((a,m)=>a+m.h*m.rate,0))} ₸</b></div>
    <div class="kv"><span>Закуп запчастей</span><b>${mln(4980000)} ₸</b></div>
    <div class="kv"><span>Оплачено Kaspi</span><b>58%</b></div>
   </div>
  </div>
 </div>
 <div class="pan"><h3>Услуги: что приносит деньги</h3><p>Разрез по видам работ — количество, выручка и средняя длительность.</p>
  <div class="tw" style="border:0"><table class="t"><thead><tr><th>Вид работ</th><th class="r">Нарядов</th><th class="r">Выручка</th><th class="r">Средний чек</th><th class="r">Часов на наряд</th><th>Доля</th></tr></thead>
  <tbody>${SRV.map(s=>`<tr onclick="toast('Прайс по работам — ваш: нормо-часы, стоимость, привязка к механику и к запчастям. Меняется в разделе «Настройки» без разработчика.')">
   <td><b>${esc(s.n)}</b></td><td class="r">${s.cnt}</td><td class="r"><b>${fmt(s.sum)} ₸</b></td>
   <td class="r">${fmt(s.sum/s.cnt)} ₸</td><td class="r">${num(s.h)}</td>
   <td><div class="bar" style="--w:${s.sum/SRV[3].sum*100}%"><i class="${s.h>5?'w':''}"></i></div></td></tr>`).join('')}</tbody></table></div>
 </div>`;

/* ====== АНАЛИТИКА ====== */
SC.analytics=()=>`${head('Аналитика','Возвратность, источники, средний чек и загрузка. Это те самые «десять выжимок», по которым владелец понимает, что происходит, не приезжая в сервис.',
 '<button class="bt" onclick="toast(\'Любой отчёт выгружается в Excel и ставится на расписание — приходит вам в WhatsApp утром в понедельник.\')">Выгрузить</button>')}
 <div class="wid">
  <div><small>Средний чек</small><b class="a">${fmt(F.avg)} ₸</b><span>+14% к июню</span></div>
  <div><small>Работ на наряд</small><b>2,4</b><span>допродажи по диагностике</span></div>
  <div><small>Возвратность</small><b class="r">${F.ret}%</b><span>вернулись в течение года</span></div>
  <div><small>Срок ремонта</small><b>${num(F.avgDays)} дня</b><span>от приёмки до выдачи</span></div>
  <div><small>Спящих авто</small><b class="w">${F.lost}</b><span>8+ месяцев без визита</span></div>
 </div>
 <div class="g2">
  <div class="pan"><h3>Возвратность — главный резерв</h3>
   <p>Сервис живёт повторными визитами. Сейчас возвращается каждый третий.</p>
   <div class="fr"><span>Пришли один раз и пропали</span><div class="bar" style="--w:66%"><i class="r"></i></div><b>66%</b></div>
   <div class="fr"><span>Вернулись хотя бы раз</span><div class="bar" style="--w:34%"><i class="g"></i></div><b>34%</b></div>
   <div class="fr"><span>Обслуживаются постоянно</span><div class="bar" style="--w:17%"><i class="g"></i></div><b>17%</b></div>
   <div class="kv" style="margin-top:10px"><span>Средний интервал между визитами</span><b>7,4 мес</b></div>
   <div class="kv"><span>Клиентов с 3+ визитами</span><b>228</b></div>
   <div class="kv"><span>Их доля в выручке</span><b style="color:var(--ok)">51%</b></div>
   <div class="note" style="--tone:var(--brand)"><b>Куда уходит клиент</b>
    <p>Он не уходит к конкуренту — он просто забывает. Замена масла нужна раз в 8–10 тысяч километров, и если о ней никто не напомнил, человек вспоминает уже в другом сервисе, мимо которого проезжал. Напоминание по пробегу и дате возвращает часть этих визитов.</p></div>
  </div>
  <div class="pan"><h3>Источники: сколько доходит до денег</h3>
   <div class="tw" style="border:0"><table class="t"><thead><tr><th>Канал</th><th class="r">Заявок</th><th class="r">Нарядов</th><th class="r">Выручка</th><th class="r">Конверсия</th></tr></thead>
    <tbody>${[['WhatsApp',96,74,7840000],['Звонок',71,52,5620000],['Сайт repair-auto',38,24,2410000],['Приехал сам',22,14,1590000],['Рекомендация',11,4,940000]].map(r=>
    `<tr><td><b>${esc(r[0])}</b></td><td class="r">${r[1]}</td><td class="r">${r[2]}</td><td class="r">${fmt(r[3])} ₸</td>
     <td class="r"><span class="tag ${r[2]/r[1]>.7?'g':r[2]/r[1]>.6?'':'w'}">${num(r[2]/r[1]*100)}%</span></td></tr>`).join('')}</tbody></table></div>
   <div class="hint">Сайт на Tilde сейчас перекидывает людей в WhatsApp и на звонок. Мы не трогаем сайт — просто подставляем на него ссылку и номер так, чтобы источник заявки определялся автоматически, а не со слов клиента.</div>
   <div class="kv" style="margin-top:12px"><span>Заявок без ответа дольше 15 минут</span><b style="color:var(--bad)">14 из ${F.leads}</b></div>
   <div class="kv"><span>Среднее время первого ответа</span><b>11 мин</b></div>
   <div class="kv"><span>Записались, но не доехали</span><b style="color:var(--warn)">18</b></div>
  </div>
 </div>
 <div class="pan"><h3>Загрузка постов по дням недели</h3><p>Видно, где свободные часы, которые можно продать акцией или записью.</p>
  ${[['Понедельник',71],['Вторник',88],['Среда',94],['Четверг',86],['Пятница',97],['Суббота',63],['Воскресенье',22]].map(d=>
   `<div class="fr"><span>${esc(d[0])}</span><div class="bar" style="--w:${d[1]}%"><i class="${d[1]>90?'r':d[1]>70?'w':'g'}"></i></div><b>${d[1]}%</b></div>`).join('')}
  <div class="hint">Пятница и среда забиты, воскресенье пустое. Система умеет предлагать клиенту ближайшее свободное окно при записи — и подтягивать загрузку туда, где она провисает.</div>
 </div>`;

/* ====== ВХОДЯЩИЕ ====== */
SC.inbox=()=>{
 const L=LEADS.filter(l=>!fMine||l.mg===ROLES[role].n);
 return `${head('Входящие заявки','Каждое сообщение в WhatsApp, звонок и форма с сайта становятся заявкой с номером, источником и ответственным. Не теряется ни одна.',
  `<button class="bt ${fMine?'':'p'}" onclick="setMine(false)">Все заявки</button><button class="bt ${fMine?'p':''}" onclick="setMine(true)">Мои</button>`)}
 <div class="wid">
  <div><small>Новых сейчас</small><b class="a">${LEADS.filter(l=>l.s==='new').length}</b><span>ждут первого ответа</span></div>
  <div><small>В работе</small><b>${LEADS.filter(l=>['talk','rec','diag','appr'].includes(l.s)).length}</b><span>от разговора до сметы</span></div>
  <div><small>В цеху</small><b class="w">${LEADS.filter(l=>l.s==='job').length}</b><span>машины на постах</span></div>
  <div><small>Ответ дольше 15 мин</small><b class="r">${LEADS.filter(l=>l.hot).length}</b><span>подсвечены красным</span></div>
  <div><small>Сумма в работе</small><b>${fmt(LEADS.filter(l=>l.s!=='done').reduce((a,l)=>a+l.sum,0))} ₸</b><span>по выставленным сметам</span></div>
 </div>
 <div class="tw"><table class="t" style="min-width:1040px">
  <thead><tr><th>№</th><th>Клиент</th><th>Автомобиль</th><th>Что нужно</th><th>Канал</th><th>Ответственный</th><th class="r">Сумма</th><th>Этап</th></tr></thead>
  <tbody>${L.map(l=>`<tr onclick="openLead(${l.id})">
   <td class="mono"><b>${l.id}</b>${l.hot?`<div class="sub2" style="color:var(--bad)">ждёт ${esc(l.t)}</div>`:''}</td>
   <td><b>${esc(l.c)}</b><div class="sub2">${esc(l.ph)}</div></td>
   <td>${esc(l.car)}<div class="sub2 mono">${esc(l.gn)}</div></td>
   <td class="sub2">${esc(l.what)}</td>
   <td><span class="tag ${l.ch==='WhatsApp'?'g':l.ch==='Звонок'?'a':l.ch==='Сайт repair-auto'?'i':''}">${esc(l.ch)}</span></td>
   <td>${avatar(l.mg)} ${esc(l.mg)}</td>
   <td class="r">${l.sum?fmt(l.sum)+' ₸':'—'}</td>
   <td><span class="tag" style="background:${STC[l.s]}22;color:${STC[l.s]}">${esc(STN[l.s])}</span></td></tr>`).join('')}</tbody>
 </table></div>
 <div class="g2" style="margin-top:12px">
  <div class="pan"><h3>Что система делает с заявкой сама</h3>
   <div class="li"><i>✓</i><span>Создаёт заявку из сообщения WhatsApp, звонка или формы сайта<span class="sub">канал проставляется сам, со слов клиента спрашивать не надо</span></span></div>
   <div class="li"><i>✓</i><span>Находит клиента и его машину по номеру телефона или госномеру<span class="sub">повторному клиенту не задают те же вопросы заново</span></span></div>
   <div class="li"><i>✓</i><span>Назначает менеджера и ставит задачу с таймером<span class="sub">не ответили за 15 минут — заявка краснеет и уходит руководителю</span></span></div>
   <div class="li"><i>✓</i><span>Отправляет клиенту подтверждение и адрес сервиса</span></div>
   <div class="li"><i>✓</i><span>Напоминает о записи за день и за два часа до визита<span class="sub">это те самые 18 записавшихся, которые не доехали</span></span></div>
  </div>
  <div class="pan"><h3>Ваша сегодняшняя боль</h3>
   <div class="note" style="--tone:var(--brand)"><b>«Диспетчер задач есть, но она сама первая не пишет»</b>
    <p>Это точная формулировка проблемы. Задача в текущей системе напоминает сотруднику, но клиенту не пишет никто. В портале наоборот: клиент получает сообщение автоматически по событию — записался, машина готова, пора на ТО, — а сотрудник подключается там, где нужен человек.</p></div>
   <div class="kv" style="margin-top:12px"><span>Сообщений клиентам в месяц</span><b>≈ 1 900</b></div>
   <div class="kv"><span>Из них отправит система</span><b style="color:var(--ok)">87%</b></div>
   <div class="kv"><span>Останется менеджеру</span><b>живое общение и продажа</b></div>
  </div>
 </div>`};
function setMine(v){fMine=v;render()}
function searchDemo(q){if(!q)return;
 const l=LEADS.find(x=>[x.gn,x.ph,String(x.id),x.c].join(' ').toLowerCase().includes(q.toLowerCase()));
 if(l){openLead(l.id);return}
 toast(`Поиск идёт по госномеру, VIN, телефону, фамилии и номеру наряда сразу. В демо заведено ${LEADS.length} заявок и ${CARS.length} автомобилей — попробуйте «606 ZHN 01» или «Турсынова».`)}

/* ====== ВОРОНКА ====== */
SC.funnel=()=>{
 const L=LEADS.filter(l=>!fMine||l.mg===ROLES[role].n);
 return `${head('Воронка заявок','Восемь этапов от сообщения до оплаты. Карточка перетаскивается мышью — этап меняется вместе с задачами и уведомлением клиенту.',
  `<button class="bt ${fMine?'':'p'}" onclick="setMine(false)">Все</button><button class="bt ${fMine?'p':''}" onclick="setMine(true)">Мои</button>`)}
 <div style="display:flex;justify-content:flex-end;font-size:11px;color:var(--muted);margin-bottom:7px">
  ${L.length} ${plural(L.length,['заявка','заявки','заявок'])} на ${fmt(L.reduce((a,l)=>a+l.sum,0))} ₸</div>
 <div class="pipe">${ST.map(s=>{const c=L.filter(l=>l.s===s[0]);
  return `<div>
   <div class="phead" style="background:${s[2]}">${esc(s[1])}</div>
   <div class="pmeta"><span>${c.length} ${plural(c.length,['заявка','заявки','заявок'])}</span><b>${c.reduce((a,l)=>a+l.sum,0)?fmt(c.reduce((a,l)=>a+l.sum,0))+' ₸':''}</b></div>
   <div class="pbody" id="col-${s[0]}" ondragover="colOver(event,'${s[0]}')" ondragleave="colOut('${s[0]}')" ondrop="drop(event,'${s[0]}')">
    ${c.map(l=>`<div class="pc" draggable="true" ondragstart="dragS(event,${l.id})" ondragend="dragE(event)" onclick="openLead(${l.id})">
     <b>${esc(l.c)}</b><span class="pn">${esc(l.car)} · ${esc(l.gn)}</span>
     ${l.sum?`<span class="pp">${fmt(l.sum)} ₸</span>`:''}
     <div class="prow"><span class="tag ${l.ch==='WhatsApp'?'g':''}">${esc(l.ch)}</span>${avatar(l.mg)}</div>
    </div>`).join('')}
   </div></div>`}).join('')}
 </div>
 <div class="g2">
  <div class="pan"><h3>Где теряются клиенты</h3><p>Разрез по причинам за месяц — это поля, а не текст в примечании.</p>
   ${[['Записался, но не доехал',18,'w'],['Не согласовал смету — дорого',10,'r'],['Ушёл думать и пропал',9,'w'],['Нужной запчасти не было в наличии',7,'r'],['Далеко ехать / неудобно по времени',5,'']].map(r=>
    `<div class="fr"><span class="mini">${esc(r[0])}</span><div class="bar" style="--w:${r[1]/18*100}%"><i class="${r[2]}"></i></div><b>${r[1]}</b></div>`).join('')}
   <div class="note" style="--tone:var(--warn)"><b>Семь нарядов ушли из-за склада</b>
    <p>Клиент был готов платить, но детали не оказалось, а ждать он не стал. Система показывает такие случаи отдельно — по ним видно, что именно держать в наличии.</p></div>
  </div>
  <div class="pan"><h3>Карточка заявки под автосервис</h3>
   <div class="li"><i>✓</i><span>Автомобиль с госномером, VIN и текущим пробегом</span></div>
   <div class="li"><i>✓</i><span>История ремонтов этой машины — прямо в заявке</span></div>
   <div class="li"><i>✓</i><span>Смета: работы, нормо-часы, запчасти с наличием на складе</span></div>
   <div class="li"><i>✓</i><span>Переписка WhatsApp и записи звонков в одной ленте</span></div>
   <div class="li"><i>✓</i><span>Кнопка «создать заказ-наряд» — данные не вводятся заново</span></div>
   <div class="li"><i>✓</i><span>Реферальный код: кто привёл этого клиента</span></div>
   <div class="hint">Вы сказали: менеджер при общении должен уметь зайти и посмотреть историю ремонта. В карточке это одна ссылка — не нужно искать по журналу и вспоминать, когда машина была в последний раз.</div>
  </div>
 </div>`};
let dragId=null;
function dragS(e,id){dragId=id;e.target.classList.add('drag');try{e.dataTransfer.setData('text/plain',String(id))}catch(x){}}
function dragE(e){e.target.classList.remove('drag')}
function colOver(e,k){e.preventDefault();const c=document.getElementById('col-'+k);if(c)c.classList.add('over')}
function colOut(k){const c=document.getElementById('col-'+k);if(c)c.classList.remove('over')}
function drop(e,k){e.preventDefault();colOut(k);const l=LEADS.find(x=>x.id===dragId);if(!l)return;
 const was=l.s;l.s=k;render();
 const M={talk:'Клиенту ушло сообщение в WhatsApp: «Здравствуйте! Мы получили вашу заявку».',
  rec:'Клиент записан. Автоматически уйдёт напоминание за день до визита и за два часа.',
  diag:'Открыт заказ-наряд, машина назначена на пост. Клиенту ушло «приняли в работу».',
  appr:'Смета с фотографиями ушла клиенту в WhatsApp — подтверждение в один клик.',
  job:'Механик получил задание. Фотоотчёт по ходу работ обязателен для закрытия.',
  ready:'Клиенту ушло «машина готова» с итоговой суммой и способами оплаты.',
  done:'Наряд закрыт, данные ушли в сервисную книжку. Напоминание о следующем ТО поставлено.'};
 toast(`<b>${esc(l.c)}</b> · ${esc(STN[was])} → ${esc(STN[k])}. ${M[k]||'Этап изменён, задачи пересозданы.'}`);
 if(k==='done')sparks(16)}
function addLead(){const l={id:seq++,c:'Новая заявка',ph:'—',car:'не указан',gn:'—',s:'new',ch:'WhatsApp',mg:ROLES[role].n,sum:0,what:'Уточняется у клиента',t:'0 мин',hot:0};
 LEADS.unshift(l);if(!['inbox','funnel'].includes(cur))go('inbox');else render();
 toast('Заявка создана. В жизни она появляется сама — из сообщения в WhatsApp, звонка или формы на сайте, вместе с клиентом и его машиной.')}

/* ====== ПУТЬ КЛИЕНТА ====== */
const PATH=[
 {t:'Клиент написал в WhatsApp',w:'КЛИЕНТ',d:'«Здравствуйте, стучит спереди, можно сегодня посмотреть?»',r:'Сообщение пришло на рабочий номер сервиса, а не в личный телефон менеджера.',tm:'0 сек'},
 {t:'Заявка создана в портале',w:'СИСТЕМА',d:'Канал «WhatsApp», клиент найден по номеру, подтянулась её Kia K5 и история двух прошлых визитов.',r:'Менеджер видит карточку через 5 секунд. Таймер первого ответа пошёл.',tm:'5 сек'},
 {t:'Менеджер ответил и записал',w:'ЧЕЛОВЕК',d:'Асхат уточнил симптомы, предложил свободное окно завтра в 10:00 и записал машину на пост №2.',r:'Запись видна в расписании постов, пост забронирован.',tm:'4 мин'},
 {t:'Напоминание о визите',w:'СИСТЕМА',d:'За день и за два часа клиенту ушло «завтра в 10:00 ждём вас, ул. Бейбитшилик 23».',r:'Именно здесь сейчас теряются 18 записей в месяц.',tm:'−1 день'},
 {t:'Приёмка: осмотр и пробег',w:'ЧЕЛОВЕК',d:'Приёмщик зафиксировал пробег 74 300 км, сфотографировал одометр и кузов, открыл заказ-наряд ЗН-1842.',r:'Фото приёмки защищают и клиента, и сервис от споров о царапинах.',tm:'0 мин'},
 {t:'Диагностика и смета',w:'ЧЕЛОВЕК',d:'Механик нашёл износ стоек. В наряд добавлены работы по нормо-часам и запчасти со склада — наличие проверено сразу.',r:'Если детали нет — система предложит аналог или закажет у поставщика.',tm:'40 мин'},
 {t:'Смета ушла клиенту',w:'СИСТЕМА',d:'В WhatsApp ушло: перечень работ, сумма 238 000 ₸, фото изношенной детали и кнопка «согласовать».',r:'Клиент подтверждает с телефона — не нужно ловить его звонком.',tm:'45 мин'},
 {t:'Работа в цеху',w:'ЧЕЛОВЕК',d:'Азамат выполняет работы на посту №2. Время фиксируется, запчасти списываются со склада автоматически.',r:'Владелец в любой момент видит, что стоит на каждом посту и сколько осталось.',tm:'2 ч'},
 {t:'Фотоотчёт по работам',w:'ЧЕЛОВЕК',d:'5 фотографий: машина на подъёмнике, снятые старые детали, новые установленные, показания приборов, одометр.',r:'Без фотоотчёта наряд не закрывается — это правило, а не дисциплина.',tm:'3 ч'},
 {t:'Выдача и оплата',w:'СИСТЕМА',d:'Клиенту ушло «машина готова», итоговая сумма и Kaspi-ссылка. Оплата отразилась в кассе.',r:'Заказ-наряд закрыт, чек и акт сформированы по шаблону.',tm:'3 ч 20 мин'},
 {t:'Сервисная книжка заполнилась',w:'СИСТЕМА',d:'В книжку машины ушли: дата, пробег, работы, запчасти, сумма и следующее ТО — через 10 000 км или 6 месяцев.',r:'Клиент видит это в своём кабинете с телефона.',tm:'+1 мин'},
 {t:'Возврат через полгода',w:'СИСТЕМА',d:'При 84 000 км клиенту ушло: «Асхат из REPAIR AUTO. По вашей Camry подходит замена масла — записать на эту неделю?»',r:'Это и есть та самая автоматическая рассылка, которой сейчас нет. Один такой возврат = ${fmt(F.avg)} ₸.',tm:'+6 мес'}
];
SC.path=()=>{const p=PATH[pathStep],sys=PATH.filter(x=>x.w==='СИСТЕМА').length;
 return `${head('Путь клиента','Двенадцать шагов от сообщения в WhatsApp до повторного визита через полгода. Нажимайте «Следующий шаг» — видно, что делает человек, а что система.',
  '<button class="bt p" onclick="pathNext()">Следующий шаг →</button><button class="bt" onclick="pathReset()">Сбросить</button>')}
 <div class="wid">
  <div><small>Шаг</small><b class="a">${pathStep+1} из ${PATH.length}</b><span>${esc(p.w==='СИСТЕМА'?'делает система':p.w==='КЛИЕНТ'?'действие клиента':'участие человека')}</span></div>
  <div><small>Сделала система</small><b class="g">${sys}</b><span>шагов без сотрудника</span></div>
  <div><small>Участие человека</small><b>${PATH.filter(x=>x.w==='ЧЕЛОВЕК').length}</b><span>приёмка, ремонт, продажа</span></div>
  <div><small>Прошло времени</small><b class="i">${esc(p.tm)}</b><span>с первого сообщения</span></div>
  <div><small>Итог наряда</small><b>238 000 ₸</b><span>Kia K5 · ЗН-1842</span></div>
 </div>
 <div class="g21">
  <div class="pan"><h3>Заявка № 4350 · Ибраева Жанна · Kia K5 2021</h3><p>606 ZHN 01 · WhatsApp · менеджер Асхат</p>
   <div class="tl">${PATH.map((x,i)=>`<div class="tli ${i<pathStep?'ok':i===pathStep?'on':''}" ${i<=pathStep?'':'style="opacity:.42"'}>
    <span class="who">${esc(x.w)}</span><b>${i+1}. ${esc(x.t)}</b>
    ${i<=pathStep?`<p>${esc(x.d)}</p><div class="note" style="--tone:${x.w==='СИСТЕМА'?'var(--ok)':'var(--acc)'};margin-top:6px"><p>${x.r.replace('${fmt(F.avg)}',fmt(F.avg))}</p></div>`:''}
   </div>`).join('')}</div>
  </div>
  <div>
   <div class="pan"><h3>Что уже знает портал</h3><p>Поля заполняются по ходу, вручную никто не набирает.</p>
    ${[['Клиент','Ибраева Жанна',1],['Телефон','+7 707 ••• 27 05',1],['Автомобиль','Kia K5 2021',1],['Госномер','606 ZHN 01',1],['Пробег','74 300 км',5],['Заказ-наряд','ЗН-1842',5],['Работы и смета','238 000 ₸',6],['Согласование','получено в WhatsApp',7],['Механик и пост','Азамат · пост №2',8],['Фотоотчёт','5 фотографий',9],['Оплата','Kaspi, 238 000 ₸',10],['Сервисная книжка','запись создана',11],['Следующее ТО','84 300 км или март',11]].map(r=>
     `<div class="kv"><span>${esc(r[0])}</span><b style="${pathStep>=r[2]?'color:var(--ok)':'color:var(--muted2);font-weight:400'}">${pathStep>=r[2]?esc(r[1]):'—'}</b></div>`).join('')}
   </div>
   <div class="pan"><h3>Почему это важно именно вам</h3>
    <div class="note" style="--tone:var(--brand)"><b>Последний шаг — тот, которого сегодня нет</b>
     <p>Первые одиннадцать шагов вы так или иначе делаете руками. Двенадцатый — возврат через полгода — не делает никто, потому что напоминание невозможно отправить: бизнес-WhatsApp его не пропускает, а вручную писать 62 клиентам некому.</p></div>
    <div class="kv" style="margin-top:10px"><span>Спящих автомобилей</span><b>${F.lost}</b></div>
    <div class="kv"><span>Если вернётся каждый третий</span><b style="color:var(--ok)">${fmt(Math.round(F.lost/3))} нарядов</b></div>
    <div class="kv"><span>Это выручки</span><b style="color:var(--ok)">${mln(Math.round(F.lost/3)*F.avg)} ₸</b></div>
   </div>
  </div>
 </div>`};
function pathNext(){pathStep=pathStep>=PATH.length-1?0:pathStep+1;render();
 if(pathStep===0)toast('Путь пройден до конца — и снова с начала: вернувшийся клиент заходит на первый шаг уже как повторный.');
 else if(pathStep===PATH.length-1)sparks(18)}
function pathReset(){pathStep=0;render();toast('Путь клиента сброшен на первый шаг.')}

/* ====== ЗАКАЗ-НАРЯДЫ ====== */
SC.orders=()=>`${head('Журнал заказ-нарядов','То, что вы назвали внутренней операционной системой: работы, запчасти, механики и деньги по каждой машине. Наряд создаётся из заявки одной кнопкой.',
 '<button class="bt p" onclick="openOrd(\'ЗН-1842\')">Открыть заказ-наряд</button><button class="bt" onclick="toast(\'Наряд создаётся из заявки: клиент, автомобиль, пробег и история уже заполнены. Приёмщик добавляет работы и запчасти.\')">+ НАРЯД</button>')}
 <div class="wid">
  <div><small>Открыто нарядов</small><b class="a">${ORD.filter(o=>o.st!=='Закрыт').length}</b><span>из них ${ORD.filter(o=>o.st==='В работе').length} в цеху</span></div>
  <div><small>Закрыто за месяц</small><b>${F.orders}</b><span>${num(F.orders/26)} в день</span></div>
  <div><small>Сумма в работе</small><b class="w">${fmt(ORD.filter(o=>o.st!=='Закрыт').reduce((a,o)=>a+o.work+o.parts,0))} ₸</b><span>работы и запчасти</span></div>
  <div><small>Средний срок</small><b>${num(F.avgDays)} дня</b><span>от приёмки до выдачи</span></div>
  <div><small>Без фотоотчёта</small><b class="r">0</b><span>закрыть наряд нельзя</span></div>
 </div>
 <div class="tw"><table class="t" style="min-width:1060px">
  <thead><tr><th>Наряд</th><th>Клиент и автомобиль</th><th class="r">Пробег</th><th>Пост / механик</th><th class="r">Работы</th><th class="r">Запчасти</th><th class="r">Итого</th><th class="r">Фото</th><th>Статус</th></tr></thead>
  <tbody>${ORD.map(o=>`<tr onclick="openOrd('${o.id}')">
   <td class="mono"><b>${o.id}</b><div class="sub2">${esc(o.open)}</div></td>
   <td><b>${esc(o.c)}</b><div class="sub2">${esc(o.car)} · ${esc(o.gn)}</div></td>
   <td class="r">${fmt(o.km)} км</td>
   <td>${o.post?`пост №${o.post} · `:''}${avatar(o.mech)} ${esc(o.mech)}</td>
   <td class="r">${fmt(o.work)} ₸</td><td class="r">${fmt(o.parts)} ₸</td>
   <td class="r"><b>${fmt(o.work+o.parts)} ₸</b></td>
   <td class="r"><span class="tag ${o.ph>=4?'g':'w'}">${o.ph}</span></td>
   <td><span class="tag ${o.c2}">${esc(o.st)}</span></td></tr>`).join('')}</tbody>
 </table></div>
 <div class="g2" style="margin-top:12px">
  <div class="pan"><h3>Что внутри заказ-наряда</h3>
   <div class="li"><i>✓</i><span>Работы по нормо-часам с привязкой к механику<span class="sub">отдельно по каждому, как вы и просили</span></span></div>
   <div class="li"><i>✓</i><span>Запчасти со склада или под заказ, со списанием остатка</span></div>
   <div class="li"><i>✓</i><span>Пробег на приёмке и на выдаче</span></div>
   <div class="li"><i>✓</i><span>Фотоотчёт: приборы, старые и новые детали, машина на подъёмнике</span></div>
   <div class="li"><i>✓</i><span>Согласование сметы клиентом в WhatsApp</span></div>
   <div class="li"><i>✓</i><span>Оплата: касса, Kaspi, карта, безнал по счёту</span></div>
   <div class="li"><i>✓</i><span>Документы: акт выполненных работ, чек, гарантийный талон</span></div>
  </div>
  <div class="pan"><h3>Связь с остальной системой</h3>
   <div class="li n"><i>←</i><span><b>Из заявки</b> — клиент, машина, история и симптомы уже заполнены</span></div>
   <div class="li n"><i>←</i><span><b>Со склада</b> — наличие детали видно при добавлении в смету</span></div>
   <div class="li n"><i>→</i><span><b>В сервисную книжку</b> — работы, пробег, сумма и дата следующего ТО</span></div>
   <div class="li n"><i>→</i><span><b>В кассу</b> — оплата, выручка по работам и по запчастям раздельно</span></div>
   <div class="li n"><i>→</i><span><b>В зарплату механика</b> — закрытые нормо-часы</span></div>
   <div class="li n"><i>→</i><span><b>В карточку клиента</b> — менеджер видит историю при следующем разговоре</span></div>
   <div class="hint">Вы сказали: «так-то она обычно нам не нужна для своей деятельности, но когда общение происходит, он может туда перейти посмотреть, что было и когда». Переход из наряда в карточку и обратно — в один клик.</div>
  </div>
 </div>`;
function openOrd(id){
 const o=ORD.find(x=>x.id===id)||ORD[0];
 const W=[['Диагностика ходовой части',1,12000],['Замена стоек передних, пара',2.5,46000],['Замена опорных подшипников',1.5,28000],['Развал-схождение',1.5,32000],['Замена масла и фильтра',0.8,14000],['Мойка после ремонта',0.5,16000]];
 const P=[['48510-0K03','Амортизатор передний KYB',2,62000],['48609-0K01','Опора амортизатора',2,18400],['04152-YZZA1','Фильтр масляный',1,4900],['MZ690115','Масло 5W-30, 4 л',1,19900]];
 const ws=W.reduce((a,w)=>a+w[2],0);
 const pTot=P.reduce((a,p)=>a+p[2]*p[3],0);
 openM(`Заказ-наряд ${esc(o.id)}`,`${esc(o.c)} · ${esc(o.car)} · ${esc(o.gn)} · пробег ${fmt(o.km)} км`,`
  <div class="wid" style="grid-template-columns:repeat(4,1fr);margin-bottom:12px">
   <div><small>Статус</small><b class="${o.c2==='g'?'g':'w'}" style="font-size:15px">${esc(o.st)}</b><span>${o.post?'пост №'+o.post:'ожидает поста'}</span></div>
   <div><small>Механик</small><b style="font-size:15px">${esc(o.mech)}</b><span>нормо-часы ${num(W.reduce((a,w)=>a+w[1],0))}</span></div>
   <div><small>Итого</small><b class="a">${fmt(ws+pTot)} ₸</b><span>работы ${fmt(ws)} + запчасти ${fmt(pTot)}</span></div>
   <div><small>Фотоотчёт</small><b class="g">${o.ph}</b><span>обязателен для закрытия</span></div>
  </div>
  <div class="ord" style="margin-bottom:12px">
   <div class="oh"><b>Смета по наряду</b><span class="tag g">согласована клиентом в WhatsApp</span></div>
   <div class="osec">Работы</div>
   <div class="orow h"><span>Наименование</span><span>Н/ч</span><span>Цена</span><span>Сумма</span></div>
   ${W.map(w=>`<div class="orow"><span>${esc(w[0])}</span><span>${num(w[1])}</span><span>${fmt(w[2]/w[1])}</span><span><b>${fmt(w[2])}</b></span></div>`).join('')}
   <div class="osec">Запчасти</div>
   <div class="orow h"><span>Артикул и наименование</span><span>Кол</span><span>Цена</span><span>Сумма</span></div>
   ${P.map(p=>`<div class="orow"><span><span class="mono" style="color:var(--muted)">${esc(p[0])}</span> ${esc(p[1])}</span><span>${p[2]}</span><span>${fmt(p[3])}</span><span><b>${fmt(p[2]*p[3])}</b></span></div>`).join('')}
   <div class="orow tot"><span>Итого к оплате</span><span></span><span></span><span>${fmt(ws+pTot)} ₸</span></div>
  </div>
  <div class="g2" style="margin-bottom:0">
   <div class="pan"><h3>Ход работ</h3>
    <div class="tl">
     <div class="tli ok"><b>Приёмка · 09:40</b><p>Пробег 74 300 км, фото кузова и одометра, симптомы со слов клиента.</p></div>
     <div class="tli ok"><b>Диагностика · 10:20</b><p>Износ передних стоек, люфт опорных подшипников. Фото дефекта приложены.</p></div>
     <div class="tli ok"><b>Смета согласована · 10:45</b><p>Клиент подтвердил в WhatsApp. Запчасти зарезервированы на складе.</p></div>
     <div class="tli on"><b>Работы на посту №2 · с 11:00</b><p>Азамат. Выполнено 3 из 6 позиций, осталось около 1 ч 40 мин.</p></div>
     <div class="tli"><b>Фотоотчёт и закрытие</b><p>5 обязательных снимков, затем акт, чек и запись в сервисную книжку.</p></div>
    </div>
    <div class="btns" style="margin-top:12px">
     <button class="bt p" onclick="closeM();go('photo')">Фотоотчёт</button>
     <button class="bt" onclick="closeM();go('posts')">Посты</button>
     <button class="bt" onclick="toast('Акт выполненных работ, чек и гарантийный талон формируются по вашим шаблонам с подставленными данными наряда.')">Документы</button>
    </div>
   </div>
   <div class="pan"><h3>Что уйдёт после закрытия</h3>
    <div class="kv"><span>В сервисную книжку машины</span><b style="color:var(--ok)">автоматически</b></div>
    <div class="kv"><span>Следующее ТО</span><b>84 300 км или март</b></div>
    <div class="kv"><span>Напоминание клиенту</span><b>за 500 км до срока</b></div>
    <div class="kv"><span>В кассу</span><b>${fmt(ws+pTot)} ₸</b></div>
    <div class="kv"><span>Нормо-часы механику</span><b>${num(W.reduce((a,w)=>a+w[1],0))} ч · ${fmt(W.reduce((a,w)=>a+w[1],0)*2600)} ₸</b></div>
    <div class="kv"><span>Списание со склада</span><b>4 позиции</b></div>
    <div class="note" style="--tone:var(--ok)"><b>Ничего не переносится руками</b>
     <p>Сегодня эти данные живут в разных местах: наряд на бумаге, деньги в кассе, история в голове приёмщика. После закрытия наряда всё расходится по своим местам само.</p></div>
   </div>
  </div>`)}

/* ====== ПОСТЫ ====== */
SC.posts=()=>`${head('Посты и загрузка цеха','Что стоит на каждом подъёмнике прямо сейчас, кто работает и сколько осталось. Владелец видит это с телефона, не приезжая в сервис.',
 '<button class="bt p" onclick="toast(\'Запись на пост идёт из заявки: система предлагает ближайшее свободное окно с учётом длительности работ и графика механиков.\')">Записать на пост</button>')}
 <div class="bays">${BAYS.map(b=>`<div class="bay" style="--c:${b.c}" onclick="openOrd('${b.ord}')">
  <small>${esc(b.t)}</small><b>${esc(b.car)}</b>
  <div class="who">${esc(b.ord)} · ${esc(b.mech)}</div>
  <div class="prg"><i style="--w:${b.p}%"></i></div>
  <div class="tm"><span>${esc(b.from)} → ${esc(b.to)}</span><span>${esc(b.eta)}</span></div>
 </div>`).join('')}</div>
 <div class="g21">
  <div class="pan"><h3>Расписание на сегодня</h3><p>Запись видна всем: менеджер не пообещает время, которого нет.</p>
   <div class="tw" style="border:0"><table class="t" style="min-width:640px">
    <thead><tr><th>Время</th><th>Пост</th><th>Автомобиль</th><th>Работы</th><th>Механик</th><th class="r">Часов</th></tr></thead>
    <tbody>${[['08:15','№1','Hyundai Elantra · 232 MRT','ТО 60 000','Руслан',3.2],
     ['09:40','№2','Kia K5 · 606 ZHN','Замена стоек','Азамат',4.3],
     ['11:10','Диагностика','Mitsubishi Outlander · 909 AST','Не заводится','Ерке',1.3],
     ['12:00','№1','Toyota RAV4 · 151 ASL','Замена колодок','Руслан',2.0],
     ['14:30','№2','Nissan Qashqai · 321 SAU','ТО + фильтры','Азамат',1.5],
     ['15:00','№3','Chevrolet Cobalt · 212 MDN','Тормоза, скрип','Ерке',2.5],
     ['—','№4','Toyota Camry · 717 NUR','Двигатель, 2-й день','Дархан',9.0]].map(r=>
    `<tr><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td>${esc(r[2])}</td><td class="sub2">${esc(r[3])}</td>
     <td>${avatar(r[4])} ${esc(r[4])}</td><td class="r">${num(r[5])}</td></tr>`).join('')}</tbody>
   </table></div>
  </div>
  <div class="pan"><h3>Загрузка</h3>
   <div class="kv"><span>Занято постов сейчас</span><b>4 из ${F.posts}</b></div>
   <div class="kv"><span>Загрузка на сегодня</span><b style="color:var(--warn)">82%</b></div>
   <div class="kv"><span>Свободные окна</span><b>16:30 и 17:45</b></div>
   <div class="kv"><span>Записано на завтра</span><b>6 машин · 14,7 ч</b></div>
   <div class="kv"><span>Длинных ремонтов</span><b>1 · пост №4</b></div>
   <div class="note" style="--tone:var(--warn)"><b>Пост №4 стоит вторые сутки</b>
    <p>Ремонт двигателя занимает пост надолго и режет пропускную способность. Система учитывает это в расписании: на длинные работы отводится отдельный пост, а быстрые ТО идут параллельно на других.</p></div>
   <div class="hint">Второму сервису этот экран нужен больше всего: когда вас нет на месте, загрузка постов — единственный честный показатель того, работает точка или простаивает.</div>
  </div>
 </div>`;

/* ====== ФОТООТЧЁТ ====== */
SC.photo=()=>{
 const PH=[
  ['01','Одометр','74 300 км на приёмке — зафиксировано в наряде и в книжке','ok'],
  ['02','Машина на подъёмнике','Факт того, что автомобиль в работе, с датой и временем съёмки','ok'],
  ['03','Дефект до ремонта','Изношенные стойки — это же фото ушло клиенту вместе со сметой','ok'],
  ['04','Снятые старые детали','Обязательный кадр: клиент видит, что деталь действительно меняли','ok'],
  ['05','Новые установленные детали','Артикул и упаковка в кадре — видно, что поставили именно то','ok'],
  ['06','Показания приборов','Сканер, давление, развал-схождение — параметры после работ','w']
 ];
 return `${head('Фотоотчёт по работам','Ровно то, что вы описали: приборы с показаниями, старые и новые детали, машина на подъёмнике. Без полного комплекта наряд не закрывается.',
  '<button class="bt p" onclick="toast(\'Механик снимает на телефон прямо из наряда — фото сразу попадает в нужную позицию и в карточку машины. Отдельного приложения не нужно, работает в браузере телефона.\')">Как снимает механик</button>')}
 <div class="wid">
  <div><small>Наряд</small><b class="a" style="font-size:16px">ЗН-1842</b><span>Kia K5 · 606 ZHN 01</span></div>
  <div><small>Обязательных кадров</small><b>5</b><span>настраивается вами</span></div>
  <div><small>Загружено</small><b class="g">5 из 6</b><span>шестой — по желанию</span></div>
  <div><small>Закрытие наряда</small><b class="g" style="font-size:15px">разрешено</b><span>комплект собран</span></div>
  <div><small>Споров с клиентами</small><b class="g">0</b><span>с начала работы по фото</span></div>
 </div>
 <div class="ph">${PH.map(p=>`<div class="phi" onclick="toast('Фото открывается в полном размере с датой, временем, автором и привязкой к позиции наряда. Хранится в карточке машины навсегда.')">
  <div class="im"><u>${p[0]}</u><i>▣</i></div>
  <div class="cp"><b>${esc(p[1])}</b>${esc(p[2])}</div></div>`).join('')}</div>
 <div class="g2">
  <div class="pan"><h3>Зачем это нужно вам</h3>
   <div class="li"><i>✓</i><span><b>Клиент видит, за что заплатил</b><span class="sub">фотографии уходят вместе с актом в WhatsApp и лежат в его кабинете</span></span></div>
   <div class="li"><i>✓</i><span><b>Споры закрываются фотографией</b><span class="sub">«вы мне царапину сделали» — есть снимок кузова на приёмке</span></span></div>
   <div class="li"><i>✓</i><span><b>Контроль механиков без вашего присутствия</b><span class="sub">видно, что работа действительно сделана, а деталь заменена</span></span></div>
   <div class="li"><i>✓</i><span><b>Второй сервис под контролем</b><span class="sub">вы смотрите фотоотчёты по обеим точкам из одного места</span></span></div>
   <div class="li w"><i>!</i><span><b>Наряд не закроется без комплекта</b><span class="sub">это правило системы, а не напоминание приёмщику</span></span></div>
  </div>
  <div class="pan"><h3>Что уходит клиенту после закрытия</h3>
   <div class="chat">
    <div class="msg out">Жанна, добрый день! Ваша Kia K5 готова, можно забирать.<br>Итого 238 000 ₸ — работы 148 000, запчасти 90 000.<small>REPAIR AUTO · 14:38</small></div>
    <div class="msg out">Фотоотчёт по работам: 5 снимков, включая снятые и новые детали.<br>Акт и гарантийный талон — по ссылке.<small>REPAIR AUTO · 14:38</small></div>
    <div class="msg in">Спасибо! Оплачу Kaspi<small>Клиент · 14:41</small></div>
    <div class="msg sys">Оплата 238 000 ₸ получена · наряд закрыт · запись в сервисной книжке создана</div>
    <div class="msg out">Следующее ТО — при 84 300 км или в марте. Напомним заранее, приезжать раньше не нужно.<small>REPAIR AUTO · 14:52</small></div>
   </div>
   <div class="hint">Это сообщение уходит само, по событию «наряд закрыт». Менеджер его не пишет и не забывает написать.</div>
  </div>
 </div>`};

/* ====== КЛИЕНТЫ ====== */
SC.clients=()=>`${head('Клиенты','Один клиент — одна карточка: его машины, все визиты, все наряды, переписка и реферальный код. Повторному клиенту не задают те же вопросы заново.',
 '<button class="bt p" onclick="toast(\'Клиент заводится один раз по номеру телефона. При следующем обращении система находит его сама вместе с машинами и историей ремонтов.\')">+ КЛИЕНТ</button>')}
 <div class="wid">
  <div><small>Клиентов в базе</small><b class="a">${fmt(F.clients)}</b><span>физлица и компании</span></div>
  <div><small>Автомобилей</small><b>${fmt(F.cars)}</b><span>${num(F.cars/F.clients)} на клиента</span></div>
  <div><small>Постоянных</small><b class="g">228</b><span>три и более визита</span></div>
  <div><small>Спящих</small><b class="r">${F.lost}</b><span>8+ месяцев без визита</span></div>
  <div><small>Корпоративных</small><b>17</b><span>парки от 3 машин</span></div>
 </div>
 <div class="tw"><table class="t" style="min-width:940px">
  <thead><tr><th>Клиент</th><th>Телефон</th><th class="r">Машин</th><th class="r">Визитов</th><th class="r">Оставил денег</th><th>Последний визит</th><th>Реф. код</th><th>Сегмент</th></tr></thead>
  <tbody>${CLI.map(c=>`<tr onclick="openCli('${esc(c.ref)}')">
   <td><b>${avatar(c.n)} ${esc(c.n)}</b></td><td class="mono">${esc(c.ph)}</td>
   <td class="r">${c.cars}</td><td class="r">${c.visits}</td>
   <td class="r"><b>${fmt(c.sum)} ₸</b></td><td class="mono">${esc(c.last)}</td>
   <td class="mono">${esc(c.ref)}</td>
   <td><span class="tag ${c.seg==='Спящий'?'r':c.seg==='Корпоративный'?'i':c.seg==='Постоянный'?'g':'a'}">${esc(c.seg)}</span></td></tr>`).join('')}</tbody>
 </table></div>
 <div class="g2" style="margin-top:12px">
  <div class="pan"><h3>Сегменты работают сами</h3><p>Клиент переходит между сегментами автоматически, по дате последнего визита и количеству нарядов.</p>
   <div class="fr"><span>Постоянные · 3+ визита</span><div class="bar" style="--w:17%"><i class="g"></i></div><b>228 · 51% выручки</b></div>
   <div class="fr"><span>Повторные · 2 визита</span><div class="bar" style="--w:23%"><i></i></div><b>308</b></div>
   <div class="fr"><span>Разовые · 1 визит</span><div class="bar" style="--w:55%"><i class="w"></i></div><b>742</b></div>
   <div class="fr"><span>Спящие · 8+ мес</span><div class="bar" style="--w:5%"><i class="r"></i></div><b>${F.lost}</b></div>
   <div class="note" style="--tone:var(--brand)"><b>742 разовых клиента — это не потеря, это очередь</b>
    <p>Каждый из них уже был у вас, машина в базе, пробег известен. Им нужно просто вовремя написать. Рассылка по сегменту «разовые, ТО подходит» — три клика, а не выгрузка в Excel и ручная переписка.</p></div>
  </div>
  <div class="pan"><h3>Что в карточке клиента</h3>
   <div class="li"><i>✓</i><span>Все его автомобили с VIN, госномером и текущим пробегом</span></div>
   <div class="li"><i>✓</i><span>Все заказ-наряды с работами, запчастями и фотоотчётами</span></div>
   <div class="li"><i>✓</i><span>Сервисная книжка по каждой машине</span></div>
   <div class="li"><i>✓</i><span>Переписка WhatsApp и записи звонков</span></div>
   <div class="li"><i>✓</i><span>Реферальный код и кто по нему пришёл</span></div>
   <div class="li"><i>✓</i><span>Скидка, бонусы и статус по количеству визитов</span></div>
   <div class="li"><i>✓</i><span>Задачи: когда позвонить, что предложить</span></div>
  </div>
 </div>`;
function openCli(ref){
 const c=CLI.find(x=>x.ref===ref)||CLI[0];
 openM(esc(c.n),`${esc(c.ph)} · ${esc(c.seg)} · реферальный код ${esc(c.ref)}`,`
  <div class="wid" style="grid-template-columns:repeat(4,1fr);margin-bottom:12px">
   <div><small>Визитов</small><b class="a">${c.visits}</b><span>последний ${esc(c.last)}</span></div>
   <div><small>Оставил денег</small><b>${fmt(c.sum)} ₸</b><span>средний чек ${fmt(c.sum/c.visits)} ₸</span></div>
   <div><small>Автомобилей</small><b>${c.cars}</b><span>в обслуживании</span></div>
   <div><small>Привёл друзей</small><b class="g">${c.seg==='Постоянный'?3:c.seg==='Корпоративный'?1:0}</b><span>по реферальному коду</span></div>
  </div>
  <div class="g2" style="margin-bottom:0">
   <div class="pan"><h3>История обслуживания</h3>
    <div class="tl">
     <div class="tli ok"><b>${esc(c.last)} · ТО и замена колодок</b><p>164 000 ₸ · пробег 92 100 км · механик Руслан · фотоотчёт 5 кадров</p></div>
     <div class="tli ok"><b>14.03.2026 · Замена масла и фильтров</b><p>68 000 ₸ · пробег 82 400 км · механик Ерке</p></div>
     <div class="tli ok"><b>02.11.2025 · Диагностика подвески</b><p>212 000 ₸ · пробег 74 900 км · механик Азамат</p></div>
     <div class="tli on"><b>Сейчас · следующее ТО</b><p>Подходит при 101 000 км или в марте. Напоминание поставлено автоматически.</p></div>
    </div>
    <div class="btns" style="margin-top:12px">
     <button class="bt p" onclick="closeM();go('book')">Сервисная книжка</button>
     <button class="bt" onclick="closeM();go('cab')">Его кабинет</button>
     <button class="bt" onclick="toast('Сообщение уходит с рабочего номера сервиса. Вся переписка остаётся в карточке, даже если менеджер уволится.')">Написать в WhatsApp</button>
    </div>
   </div>
   <div class="pan"><h3>Реферальная программа</h3>
    <div class="kv"><span>Личный код</span><b class="mono">${esc(c.ref)}</b></div>
    <div class="kv"><span>Пришло по коду</span><b>${c.seg==='Постоянный'?3:c.seg==='Корпоративный'?1:0} ${plural(c.seg==='Постоянный'?3:1,['человек','человека','человек'])}</b></div>
    <div class="kv"><span>Начислено бонусов</span><b style="color:var(--ok)">${fmt(c.seg==='Постоянный'?47000:c.seg==='Корпоративный'?18000:0)} ₸</b></div>
    <div class="kv"><span>Использовано</span><b>${fmt(c.seg==='Постоянный'?25000:0)} ₸</b></div>
    <div class="kv"><span>Доступно к списанию</span><b>${fmt(c.seg==='Постоянный'?22000:c.seg==='Корпоративный'?18000:0)} ₸</b></div>
    <div class="note" style="--tone:var(--ok)"><b>Клиент видит это сам</b>
     <p>В своём кабинете он видит код, кого привёл и сколько накопил. Ему не нужно звонить менеджеру и спрашивать про бонусы.</p></div>
   </div>
  </div>`)}

/* ====== АВТОМОБИЛИ ====== */
SC.cars=()=>`${head('Автомобили','Машина — отдельная сущность, а не строка в карточке клиента. У неё VIN, госномер, пробег, история ремонтов и срок следующего ТО.',
 '<button class="bt p" onclick="go(\'remind\')">Кому пора на ТО</button>')}
 <div class="wid">
  <div><small>Автомобилей</small><b class="a">${fmt(F.cars)}</b><span>в базе сервиса</span></div>
  <div><small>ТО подходит</small><b class="w">31</b><span>в ближайший месяц</span></div>
  <div><small>ТО просрочено</small><b class="r">48</b><span>уже пора, клиент не в курсе</span></div>
  <div><small>Средний пробег</small><b>104 200 км</b><span>по базе</span></div>
  <div><small>Марка №1</small><b style="font-size:16px">Toyota</b><span>34% автопарка</span></div>
 </div>
 <div class="tw"><table class="t" style="min-width:980px">
  <thead><tr><th>Госномер</th><th>Автомобиль</th><th>VIN</th><th>Владелец</th><th class="r">Пробег</th><th>Следующее ТО</th><th>Дата</th></tr></thead>
  <tbody>${CARS.map(c=>`<tr onclick="go('book')">
   <td class="mono"><b>${esc(c.gn)}</b></td><td><b>${esc(c.m)}</b></td>
   <td class="mono sub2">${esc(c.vin)}</td><td>${esc(c.own)}</td>
   <td class="r">${fmt(c.km)} км</td>
   <td><span class="tag ${c.w===2?'r':c.w===1?'w':'g'}">${esc(c.next)}</span></td>
   <td class="mono">${esc(c.d)}</td></tr>`).join('')}</tbody>
 </table></div>
 <div class="g2" style="margin-top:12px">
  <div class="pan"><h3>Почему машина важнее клиента</h3>
   <div class="li"><i>✓</i><span>Пробег и регламент привязаны к машине, а не к человеку<span class="sub">у одного клиента может быть три автомобиля с разными сроками</span></span></div>
   <div class="li"><i>✓</i><span>Машина меняет владельца — история остаётся<span class="sub">новый хозяин приезжает и видит, что с ней делали</span></span></div>
   <div class="li"><i>✓</i><span>Корпоративный парк ведётся как список машин<span class="sub">ТОО «Астана Логистик» — три Porter с разными пробегами</span></span></div>
   <div class="li"><i>✓</i><span>Поиск по госномеру и VIN находит всё за секунду<span class="sub">клиент подъехал — приёмщик уже видит историю</span></span></div>
   <div class="li"><i>✓</i><span>Подбор запчастей идёт по VIN, а не «на глаз»</span></div>
  </div>
  <div class="pan"><h3>Регламент обслуживания</h3><p>Задаётся один раз и дальше считается системой по каждой машине.</p>
   ${[['Замена масла и фильтра','10 000 км или 6 мес'],['Воздушный и салонный фильтр','20 000 км'],['Тормозные колодки','30 000 км или по износу'],['Тормозная жидкость','40 000 км или 2 года'],['Ремень ГРМ','90 000 км'],['Антифриз','60 000 км']].map(r=>
    `<div class="kv"><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')}
   <div class="hint">Регламент можно задать отдельно по маркам — у Toyota и Hyundai интервалы разные. Меняется в настройках, без разработчика.</div>
  </div>
 </div>`;

/* ====== СЕРВИСНАЯ КНИЖКА ====== */
SC.book=()=>{
 const left=ODO.last+ODO.step-ODO.km;
 const p=Math.max(0,Math.min(100,(ODO.km-ODO.last)/ODO.step*100));
 const col=left<=0?'var(--bad)':left<1500?'var(--warn)':'var(--ok)';
 return `${head('Электронная сервисная книжка','Ровно то, что вы описали: после закрытия наряда в книжку уходит дата, пробег, работы и сумма — и сразу ставится напоминание на следующее ТО по пробегу и по дате.',
  '<button class="bt p" onclick="go(\'cab\')">Как видит клиент</button><button class="bt" onclick="toast(\'Книжка формируется автоматически из закрытых заказ-нарядов. Вручную в неё ничего не вносят.\')">Откуда данные</button>')}
 <div class="g21">
  <div class="pan"><h3>Mazda CX-5 2018 · 343 DAM 01</h3><p>Владелец Алиев Дамир · VIN JM3K••••••88104 · в сервисе с 2023 года</p>
   <div class="tl">
    <div class="tli ok"><b>11.09.2026 · 121 600 км · ЗН-1837</b>
     <p>Замена масла и фильтров, диагностика ходовой, замена колодок передних. Работы 117 000 ₸, запчасти 170 000 ₸. Механик Руслан. Фотоотчёт: 4 снимка.</p></div>
    <div class="tli ok"><b>18.03.2026 · 113 400 км · ЗН-1602</b>
     <p>Плановое ТО: масло, масляный и воздушный фильтр, проверка тормозной системы. 84 000 ₸. Механик Ерке.</p></div>
    <div class="tli ok"><b>02.09.2025 · 101 200 км · ЗН-1311</b>
     <p>Замена ремня ГРМ и помпы, антифриз. 265 000 ₸. Механик Дархан. Гарантия на работы — 12 месяцев.</p></div>
    <div class="tli ok"><b>14.02.2025 · 92 800 км · ЗН-1087</b>
     <p>ТО, замена тормозной жидкости. 96 000 ₸.</p></div>
    <div class="tli on"><b>Следующее ТО · при ${fmt(ODO.last+ODO.step)} км или 28.09.2026</b>
     <p>Замена масла и масляного фильтра. Ориентировочно 74 000 ₸. Напоминание уйдёт клиенту за 500 км или за неделю до срока.</p></div>
   </div>
  </div>
  <div>
   <div class="pan"><h3>До следующего ТО</h3><p>Клиент вводит текущий пробег — расчёт идёт сам.</p>
    <div class="odo">
     <div class="gauge" style="--p:${p};--gc:${col}"><div><b>${left>0?fmt(left):'0'}</b><small>км осталось</small></div></div>
     <div>
      <div class="crow"><label>Текущий пробег <b>${fmt(ODO.km)} км</b></label>
       <input type="range" min="113400" max="128000" step="100" value="${ODO.km}" oninput="odoSet(this.value)"></div>
      <div class="kv"><span>Последнее ТО</span><b>${fmt(ODO.last)} км</b></div>
      <div class="kv"><span>Интервал</span><b>${fmt(ODO.step)} км</b></div>
      <div class="kv"><span>Статус</span><b style="color:${col}">${left<=0?'просрочено':left<1500?'пора записываться':'в норме'}</b></div>
     </div>
    </div>
    <div class="hint">Подвигайте ползунок — так это работает у клиента в кабинете: он вводит пробег, система считает остаток и, когда остаётся меньше 500 км, сама пишет ему в WhatsApp.</div>
   </div>
   <div class="pan"><h3>Что попадает в книжку</h3>
    <div class="li"><i>✓</i><span>Дата и пробег на момент работ</span></div>
    <div class="li"><i>✓</i><span>Перечень работ и заменённых запчастей с артикулами</span></div>
    <div class="li"><i>✓</i><span>Сумма и номер заказ-наряда</span></div>
    <div class="li"><i>✓</i><span>Механик и гарантия на работы</span></div>
    <div class="li"><i>✓</i><span>Дата и пробег следующего обслуживания</span></div>
    <div class="li no"><i>·</i><span>Внутренняя себестоимость, закуп и маржа — клиенту не видны<span class="sub">вы сказали: выгрузка ограниченных данных</span></span></div>
   </div>
  </div>
 </div>`};
function odoSet(v){ODO.km=+v;render()}

/* ====== КАБИНЕТ КЛИЕНТА ====== */
SC.cab=()=>`${head('Кабинет клиента','Веб-версия, которая открывается по ссылке из WhatsApp — без установки приложения. Здесь он видит книжку, вводит пробег и следит за бонусами.',
 '<button class="bt" onclick="toast(\'Вход по номеру телефона и коду из сообщения. Пароль не нужен — это снимает обращения в поддержку. Полноценное мобильное приложение имеет смысл на десяти сервисах, до этого достаточно веба.\')">Как заходит клиент</button>')}
 <div class="g21">
  <div class="pan"><h3>Что клиент делает сам</h3>
   <div class="li"><i>✓</i><span>Смотрит историю обслуживания своей машины<span class="sub">та самая электронная сервисная книжка</span></span></div>
   <div class="li"><i>✓</i><span>Вводит текущий пробег и видит, сколько осталось до ТО<span class="sub">напоминание «введи пробег» приходит раз в месяц</span></span></div>
   <div class="li"><i>✓</i><span>Записывается на визит в свободное окно</span></div>
   <div class="li"><i>✓</i><span>Согласовывает смету и смотрит фотоотчёт</span></div>
   <div class="li"><i>✓</i><span>Скачивает акт, чек и гарантийный талон</span></div>
   <div class="li"><i>✓</i><span>Видит свой реферальный код, кого привёл и сколько накопил<span class="sub">и делится кодом в один клик</span></span></div>
   <div class="li w"><i>!</i><span>Несколько машин в одном кабинете<span class="sub">у корпоративных клиентов — весь парк</span></span></div>
   <div class="note" style="--tone:var(--acc)"><b>Кабинет — это не «красиво», это возвраты</b>
    <p>Человек, который раз в месяц заходит ввести пробег, помнит, где обслуживает машину. Тот, кто не заходит никуда, через полгода поедет в сервис, мимо которого проезжал.</p></div>
  </div>
  <div class="pan" style="display:grid;place-items:center">
   <div class="phone">
    <div class="pht"><b>Mazda CX-5 · 343 DAM 01</b><small>Алиев Дамир · REPAIR AUTO</small></div>
    <div class="pb">
     <div class="pi"><span>Текущий пробег</span><b>121 600 км</b></div>
     <div class="pi"><span>До замены масла</span><b style="color:var(--warn)">1 800 км</b></div>
     <div class="pi"><span>Последний визит</span><b>11.09.2026</b></div>
     <div class="pi"><span>Всего визитов</span><b>4</b></div>
     <div class="pi"><span>Мой код</span><b>DA-2210</b></div>
     <div class="pi"><span>Бонусов доступно</span><b style="color:var(--ok)">18 000 ₸</b></div>
     <div class="pbtn" onclick="toast('Клиент выбирает свободное окно сам — расписание постов подтягивается из системы, менеджер подтверждать не обязан.')">ЗАПИСАТЬСЯ НА ТО</div>
     <div class="pbtn" style="background:var(--card3);color:var(--text)" onclick="go('book')">Сервисная книжка</div>
     <div class="pbtn" style="background:var(--card3);color:var(--text)" onclick="toast('Ввод пробега занимает пять секунд и обновляет расчёт до следующего ТО. Раз в месяц система сама просит его обновить.')">Обновить пробег</div>
    </div>
   </div>
  </div>
 </div>`;

/* ====== СКЛАД ЗАПЧАСТЕЙ ====== */
SC.stock=()=>`${head('Склад запчастей','Остатки, ячейки хранения, минимальные запасы и списание в заказ-наряд. Продажа запчастей — вторая половина вашей выручки, и она должна считаться так же строго, как работы.',
 '<button class="bt p" onclick="toast(\'Поступление оформляется по накладной: артикул, количество, закупочная цена и ячейка. Дальше остаток ведётся автоматически — списывается в наряд или в розничную продажу.\')">+ ПОСТУПЛЕНИЕ</button>')}
 <div class="wid">
  <div><small>Позиций на складе</small><b class="a">1 284</b><span>активная номенклатура</span></div>
  <div><small>Складской остаток</small><b>${mln(9640000)} ₸</b><span>в закупочных ценах</span></div>
  <div><small>Ниже минимума</small><b class="w">${PARTS.filter(p=>p.q<p.min).length}</b><span>нужно заказать</span></div>
  <div><small>Нет в наличии</small><b class="r">${PARTS.filter(p=>p.q===0).length}</b><span>наряды ждут</span></div>
  <div><small>Средняя наценка</small><b class="g">72%</b><span>по проданным за месяц</span></div>
 </div>
 <div class="tw"><table class="t" style="min-width:1000px">
  <thead><tr><th>Артикул</th><th>Наименование</th><th>Бренд</th><th class="r">Остаток</th><th class="r">Минимум</th><th>Ячейка</th><th class="r">Закуп</th><th class="r">Продажа</th><th>Статус</th></tr></thead>
  <tbody>${PARTS.map(p=>`<tr onclick="toast('Карточка запчасти: движение по складу, в каких нарядах использовалась, поставщики и цены, аналоги и применимость по маркам.')">
   <td class="mono"><b>${esc(p.a)}</b></td><td>${esc(p.n)}</td><td class="sub2">${esc(p.br)}</td>
   <td class="r"><b>${p.q}</b></td><td class="r">${p.min}</td>
   <td class="mono">${esc(p.loc)}</td>
   <td class="r">${fmt(p.pr)} ₸</td><td class="r">${fmt(p.sell)} ₸</td>
   <td><span class="tag ${p.q===0?'r':p.q<p.min?'w':'g'}">${p.q===0?'заказать срочно':p.q<p.min?'ниже минимума':'в наличии'}</span></td></tr>`).join('')}</tbody>
 </table></div>
 <div class="g2" style="margin-top:12px">
  <div class="pan"><h3>Ячейки и поиск</h3>
   <div class="li"><i>✓</i><span>У каждой позиции своя ячейка: A-12, B-04, C-01<span class="sub">новый кладовщик находит деталь без «спроси у Ержана»</span></span></div>
   <div class="li"><i>✓</i><span>Поиск по артикулу, названию, бренду и применимости к машине</span></div>
   <div class="li"><i>✓</i><span>Аналоги и замены — если оригинала нет, видно, чем заменить</span></div>
   <div class="li"><i>✓</i><span>Резерв под наряд: деталь отложена и не уйдёт в розницу</span></div>
   <div class="li"><i>✓</i><span>Инвентаризация со сканированием: сверка факта с остатком</span></div>
   <div class="hint">Такой склад мы уже собирали для авторазбора в Алматы: каталог, остатки, ячейки и сканирование внутри одного портала. Здесь он проще, потому что номенклатура новая и типовая.</div>
  </div>
  <div class="pan"><h3>Где склад теряет деньги</h3>
   <div class="kv"><span>Наряды, сорвавшиеся из-за отсутствия детали</span><b style="color:var(--bad)">7 за месяц</b></div>
   <div class="kv"><span>Упущенная выручка по ним</span><b style="color:var(--bad)">${fmt(7*F.avg)} ₸</b></div>
   <div class="kv"><span>Позиции, лежащие больше года</span><b style="color:var(--warn)">64 · ${fmt(1180000)} ₸</b></div>
   <div class="kv"><span>Расхождения при последней инвентаризации</span><b>19 позиций</b></div>
   <div class="note" style="--tone:var(--warn)"><b>Минимальный остаток снимает половину проблем</b>
    <p>Система смотрит, какие детали уходят чаще всего, и предупреждает до того, как остаток дойдёт до нуля. Диски Brembo сегодня в нуле, и два наряда из-за этого стоят.</p></div>
  </div>
 </div>`;

/* ====== ПОДБОР И ЗАКАЗ ====== */
SC.parts=()=>`${head('Подбор и заказ запчастей','Подбор по VIN и марке, проверка наличия у поставщиков, заказ и приход. Клиент видит срок и цену сразу, а не «перезвоним, уточним».',
 '<button class="bt p" onclick="toast(\'Заказ поставщику формируется из потребности: что ушло в ноль, что зарезервировано под наряды, что заканчивается по статистике продаж.\')">Сформировать заказ</button>')}
 <div class="g21">
  <div class="pan"><h3>Подбор под Kia K5 2021 · VIN KNAG••••••44120</h3>
   <p>Позиции подбираются по VIN, а не «на глаз» — это снимает возврат не подошедших деталей.</p>
   <div class="tw" style="border:0"><table class="t" style="min-width:700px">
    <thead><tr><th>Позиция</th><th>Артикул</th><th class="r">У нас</th><th class="r">Цена</th><th>Поставщик</th><th>Срок</th></tr></thead>
    <tbody>${[['Амортизатор передний','48510-0K03',2,62000,'Свой склад','сейчас','g'],
     ['Опора амортизатора','48609-0K01',4,18400,'Свой склад','сейчас','g'],
     ['Фильтр масляный','04152-YZZA1',24,4900,'Свой склад','сейчас','g'],
     ['Диск тормозной передний','BR-9041',0,68000,'Emex Astana','2 дня','w'],
     ['Колодки задние','58302-C1A',0,31000,'Autopiter','4 дня','w'],
     ['Пыльник ШРУСа','49541-D4','—',12600,'Аналог в наличии','сейчас','']].map(r=>
    `<tr><td><b>${esc(r[0])}</b></td><td class="mono sub2">${esc(r[1])}</td>
     <td class="r">${r[2]}</td><td class="r">${fmt(r[3])} ₸</td>
     <td class="sub2">${esc(r[4])}</td><td><span class="tag ${r[6]}">${esc(r[5])}</span></td></tr>`).join('')}</tbody>
   </table></div>
   <div class="note" style="--tone:var(--brand)"><b>Клиент получает честный срок сразу</b>
    <p>Две позиции под заказ — значит, машину имеет смысл принимать через два дня, а не держать пост занятым. Система сама предложит дату визита с учётом прихода деталей.</p></div>
  </div>
  <div class="pan"><h3>Заказы поставщикам</h3>
   <div class="li w"><i>!</i><span><b>Emex Astana</b> · 6 позиций на 214 000 ₸<span class="sub">черновик, ждёт подтверждения</span></span></div>
   <div class="li"><i>✓</i><span><b>Autopiter</b> · 11 позиций на 386 000 ₸<span class="sub">в пути, приход 17.09</span></span></div>
   <div class="li"><i>✓</i><span><b>Локальный поставщик</b> · 4 позиции на 92 000 ₸<span class="sub">получено, оприходовано</span></span></div>
   <div class="kv" style="margin-top:12px"><span>Заказов в работе</span><b>3</b></div>
   <div class="kv"><span>Сумма в пути</span><b>${fmt(692000)} ₸</b></div>
   <div class="kv"><span>Средний срок поставки</span><b>3,2 дня</b></div>
   <div class="kv"><span>Зарезервировано под наряды</span><b>9 позиций</b></div>
   <div class="hint">Подбор запчастей по каталогам и 1С для автосервиса — тот блок, который вы хотели добавить позже. Ядро к этому готово: артикулы, применимость и поставщики уже есть, интеграция подключается отдельным этапом.</div>
  </div>
 </div>`;

/* ====== ПРОДАЖИ ЗАПЧАСТЕЙ ====== */
SC.sales=()=>`${head('Продажи запчастей','Розница и продажа в наряд считаются раздельно: видно, сколько зарабатывает сервис на работах, а сколько — на запчастях.',
 '<button class="bt p" onclick="toast(\'Розничная продажа оформляется за 20 секунд: артикул, количество, оплата. Остаток списывается, чек уходит клиенту.\')">+ ПРОДАЖА</button>')}
 <div class="wid">
  <div><small>Выручка по запчастям</small><b class="a">${mln(F.revenue*F.partsShare/100)} ₸</b><span>${F.partsShare}% общей выручки</span></div>
  <div><small>В нарядах</small><b>${mln(F.revenue*F.partsShare/100*0.78)} ₸</b><span>78% продаж</span></div>
  <div><small>Розница через прилавок</small><b class="i">${mln(F.revenue*F.partsShare/100*0.22)} ₸</b><span>22%</span></div>
  <div><small>Валовая прибыль</small><b class="g">${mln(F.revenue*F.partsShare/100*0.42)} ₸</b><span>наценка 72%</span></div>
  <div><small>Средний чек розницы</small><b>34 700 ₸</b><span>1,8 позиции</span></div>
 </div>
 <div class="g2">
  <div class="pan"><h3>Топ позиций за месяц</h3>
   ${[['Масло моторное 5W-30, 4 л',61,1213900],['Фильтр масляный Toyota',54,264600],['Колодки тормозные передние',31,771900],['Фильтр воздушный',38,273600],['Свеча зажигания иридиевая',96,710400],['Амортизатор передний KYB',12,744000]].map(r=>
    `<div class="fr"><span>${esc(r[0])}</span><div class="bar" style="--w:${r[2]/1213900*100}%"><i class="${r[2]>700000?'g':''}"></i></div><b>${r[1]} шт · ${fmt(r[2])} ₸</b></div>`).join('')}
   <div class="kv" style="margin-top:10px"><span>Позиций продано</span><b>612</b></div>
   <div class="kv"><span>Возвраты</span><b>4 · ${fmt(78000)} ₸</b></div>
  </div>
  <div class="pan"><h3>Интернет-магазин</h3>
   <p>У вас есть shop-сайт, который пока не раскачан. Портал к нему готов.</p>
   <div class="li n"><i>1</i><span>Остатки и цены отдаются на сайт автоматически<span class="sub">не нужно вести прайс в двух местах</span></span></div>
   <div class="li n"><i>2</i><span>Заказ с сайта приходит как заявка с товарами<span class="sub">менеджер видит её в общей воронке</span></span></div>
   <div class="li n"><i>3</i><span>Резерв на складе ставится сразу</span></div>
   <div class="li n"><i>4</i><span>Оплата Kaspi или картой, чек уходит клиенту</span></div>
   <div class="li n"><i>5</i><span>Покупатель запчастей попадает в базу клиентов<span class="sub">и дальше получает напоминания о ТО — это новые наряды</span></span></div>
   <div class="note" style="--tone:var(--acc)"><b>Магазин и сервис — одна база</b>
    <p>Человек, который купил у вас фильтр, — это будущий клиент сервиса. Пока магазин живёт отдельно, он остаётся просто покупателем.</p></div>
  </div>
 </div>`;

/* ====== WHATSAPP И РАССЫЛКИ ====== */
SC.wa=()=>`${head('WhatsApp: два номера и рассылки','Главная боль со встречи. Разбираем честно: что можно отправлять с официального номера, что — со второго, и сколько это стоит.',
 '<button class="bt p" onclick="toast(\'Мы подключаем оба канала: официальный номер для диалогов и отчётности, второй — для массовых напоминаний. Переключение прозрачное, менеджер не думает, откуда писать.\')">Как это устроено</button>')}
 <div class="g2">
  <div class="pan"><h3>Номер 1 · официальный WhatsApp Business API</h3>
   <p>Для диалогов с клиентами, отчётности и всего, что должно быть «по-белому».</p>
   <div class="kv"><span>Диалоги с клиентами</span><b style="color:var(--ok)">без ограничений</b></div>
   <div class="kv"><span>Массовые рассылки</span><b style="color:var(--warn)">только по шаблонам Meta</b></div>
   <div class="kv"><span>Согласование шаблона</span><b>1–3 дня</b></div>
   <div class="kv"><span>Стоимость сообщения</span><b>15–60 ₸</b></div>
   <div class="kv"><span>Аудиозвонки на номер</span><b style="color:var(--bad)">теряются</b></div>
   <div class="kv"><span>Риск блокировки</span><b style="color:var(--ok)">нет</b></div>
   <div class="note" style="--tone:var(--ok)"><b>Что уходит отсюда</b>
    <p>Ответ на входящую заявку, подтверждение записи, смета на согласование, «машина готова», акт и фотоотчёт, чек. Всё это — диалоги, они не ограничены.</p></div>
  </div>
  <div class="pan"><h3>Номер 2 · WhatsApp Web через GreenAPI</h3>
   <p>Для того, чего сегодня нет вообще: напоминаний о ТО, поздравлений и акций.</p>
   <div class="kv"><span>Массовые рассылки</span><b style="color:var(--ok)">любой текст</b></div>
   <div class="kv"><span>Согласование шаблонов</span><b style="color:var(--ok)">не нужно</b></div>
   <div class="kv"><span>Стоимость сообщения</span><b style="color:var(--ok)">0 ₸</b></div>
   <div class="kv"><span>Абонплата канала</span><b>5 000 ₸ / мес</b></div>
   <div class="kv"><span>Риск блокировки</span><b style="color:var(--warn)">есть, если жать «спам»</b></div>
   <div class="kv"><span>Если номер заблокируют</span><b>подставляем новый за 10 минут</b></div>
   <div class="note" style="--tone:var(--warn)"><b>Риск управляемый</b>
    <p>Блокировка прилетает, когда пишут незнакомым людям. Вы пишете своим клиентам, которые у вас обслуживались, с понятным поводом и возможностью отписаться. Это принципиально другой сценарий.</p></div>
  </div>
 </div>
 <div class="pan"><h3>Сколько это стоит у нас и на рынке</h3>
  <div class="tw" style="border:0"><table class="t" style="min-width:640px">
   <thead><tr><th>Вариант</th><th class="r">В месяц</th><th class="r">В год</th><th>Что даёт</th></tr></thead>
   <tbody>
   <tr><td><b>Wazzup и подобные сервисы</b></td><td class="r">36 000 ₸</td><td class="r">432 000 ₸</td><td class="sub2">Тот же протокол WhatsApp Web, половина цены уходит продавцам-интеграторам</td></tr>
   <tr><td><b>Через нас, на GreenAPI</b></td><td class="r"><b style="color:var(--ok)">5 000 ₸</b></td><td class="r"><b style="color:var(--ok)">60 000 ₸</b></td><td class="sub2">Тот же продукт, прямое подключение. Мы на этом ничего не зарабатываем</td></tr>
   <tr class="total"><td><b>Экономия на одном канале</b></td><td class="r"><b>31 000 ₸</b></td><td class="r"><b style="color:var(--ok)">372 000 ₸</b></td><td class="sub2">При двух сервисах — вдвое больше</td></tr>
   </tbody></table></div>
 </div>
 <div class="g2">
  <div class="pan"><h3>Сценарии, которые пишут сами</h3>
   ${[['Ответ на входящую заявку','сразу','Номер 1','g'],
      ['Напоминание о записи','за день и за 2 часа','Номер 1','g'],
      ['Смета с фото на согласование','при готовности','Номер 1','g'],
      ['«Машина готова»','при закрытии наряда','Номер 1','g'],
      ['Акт, чек и фотоотчёт','после оплаты','Номер 1','g'],
      ['Напоминание о ТО по пробегу','за 500 км','Номер 2','b'],
      ['Напоминание о ТО по дате','за неделю','Номер 2','b'],
      ['«Введите текущий пробег»','раз в месяц','Номер 2','b'],
      ['Поздравление с праздником','по календарю','Номер 2','b'],
      ['Акция на свободные окна','по загрузке','Номер 2','b'],
      ['Реактивация спящих клиентов','8+ мес без визита','Номер 2','b']].map(r=>
    `<div class="srow"><span class="nm">${esc(r[0])}<div class="sub">${esc(r[1])}</div></span>
     <span class="tag ${r[3]}">${esc(r[2])}</span><span class="sw on" onclick="this.classList.toggle('on');toast('Любой сценарий включается и выключается вами, текст редактируется без разработчика.')"></span></div>`).join('')}
  </div>
  <div class="pan"><h3>Как выглядит напоминание</h3>
   <div class="chat">
    <div class="msg sys">Событие: пробег Mazda CX-5 дошёл до 122 900 км · до планового ТО осталось 500 км</div>
    <div class="msg out">Дамир, здравствуйте! Это REPAIR AUTO.<br>По вашей Mazda CX-5 подходит замена масла — по пробегу осталось около 500 км.<br>Есть окна в четверг и субботу. Записать?<small>Номер 2 · 10:02</small></div>
    <div class="msg in">Давайте в субботу утром<small>Клиент · 10:19</small></div>
    <div class="msg sys">Создана заявка № 4421 · клиент и машина подставлены · менеджер Асхат</div>
    <div class="msg out">Записали на субботу, 10:00. Работы займут около часа, стоимость 74 000 ₸.<br>Напомним накануне.<small>Номер 1 · 10:21</small></div>
   </div>
   <div class="hint">Клиент не заметил, что первое сообщение отправила система, а второе — менеджер. Для него это один диалог с сервисом.</div>
  </div>
 </div>`;

/* ====== НАПОМИНАНИЯ О ТО ====== */
SC.remind=()=>`${head('Напоминания о ТО','Список того, кому пора в сервис — сформирован системой по пробегу и дате. Это и есть тот доход, который сейчас просто не забирается.',
 '<button class="bt p" onclick="runBlast()">Запустить рассылку по списку</button><button class="bt" onclick="go(\'wa\')">Через какой номер</button>')}
 <div class="wid">
  <div><small>ТО просрочено</small><b class="r">48</b><span>уже пора, клиент не в курсе</span></div>
  <div><small>Подходит в этом месяце</small><b class="w">31</b><span>напомнить заранее</span></div>
  <div><small>Спящие 8+ мес</small><b>${F.lost}</b><span>отдельный сценарий</span></div>
  <div><small>Потенциал списка</small><b class="a">${mln(141*F.avg*0.33)} ₸</b><span>если вернётся треть</span></div>
  <div><small>Стоимость рассылки</small><b class="g">0 ₸</b><span>второй номер, без лимитов</span></div>
 </div>
 <div class="tw"><table class="t" style="min-width:980px">
  <thead><tr><th>Автомобиль</th><th>Владелец</th><th class="r">Пробег</th><th>Что подошло</th><th>Последний визит</th><th class="r">Средний чек</th><th>Статус напоминания</th></tr></thead>
  <tbody>${[['343 DAM 01','Mazda CX-5 2018','Алиев Дамир',121600,'Замена масла — через 1 800 км','11.09.2026',287000,'готово к отправке','w'],
   ['077 DAR 01','Kia Sportage 2020','Жумабеков Данияр',74800,'ТО просрочено на 1 200 км','02.04.2026',98000,'просрочено 5 мес','r'],
   ['555 GLN 01','Lexus RX 2017','Нурланова Гульнар',143900,'ТО просрочено на 4 400 км','18.02.2026',410000,'спящий клиент','r'],
   ['151 ASL 01','Toyota RAV4 2019','Турсынова Асель',92100,'Через 2 900 км','12.09.2026',164000,'рано, ждём','g'],
   ['232 MRT 01','Hyundai Elantra 2020','Кенжебаев Марат',58200,'Через 9 800 км','сегодня',118000,'рано, ждём','g'],
   ['100 BEK 01','Toyota Land Cruiser 2019','Оспанов Бекзат',89400,'Тормозная жидкость — 2 года','10.09.2026',620000,'готово к отправке','w']].map(r=>
  `<tr onclick="toast('По каждой машине видно, что именно подошло по регламенту, когда был последний визит и какой у клиента средний чек. Текст сообщения подставляется под конкретную машину.')">
   <td class="mono"><b>${esc(r[0])}</b><div class="sub2">${esc(r[1])}</div></td><td>${esc(r[2])}</td>
   <td class="r">${fmt(r[3])} км</td><td class="sub2">${esc(r[4])}</td>
   <td class="mono">${esc(r[5])}</td><td class="r">${fmt(r[6])} ₸</td>
   <td><span class="tag ${r[8]}">${esc(r[7])}</span></td></tr>`).join('')}</tbody>
 </table></div>
 <div class="g2" style="margin-top:12px">
  <div class="pan"><h3>Три сценария возврата</h3>
   <div class="li n"><i>1</i><span><b>По пробегу</b> — клиент сам вводит его в кабинете<span class="sub">за 500 км до регламента уходит сообщение с предложением записаться</span></span></div>
   <div class="li n"><i>2</i><span><b>По дате</b> — если пробег не обновлялся<span class="sub">через 6 месяцев после ТО, независимо от километров</span></span></div>
   <div class="li n"><i>3</i><span><b>Реактивация</b> — 8+ месяцев тишины<span class="sub">другой текст: «давно не виделись», диагностика со скидкой</span></span></div>
   <div class="note" style="--tone:var(--ok)"><b>Считаем на ваших цифрах</b>
    <p>141 машина в списке. Если вернётся треть — это 47 нарядов и около ${mln(47*F.avg)} ₸ дополнительной выручки. Рассылка при этом стоит ноль: она идёт со второго номера.</p></div>
  </div>
  <div class="pan"><h3>Календарь поводов</h3>
   ${[['Наурыз · 21–23 марта','поздравление + скидка на ТО'],['8 марта','поздравление клиенткам'],['День независимости · 16 декабря','поздравление'],['Подготовка к зиме · октябрь','проверка аккумулятора и антифриза'],['Подготовка к лету · апрель','кондиционер и тормоза'],['День рождения клиента','скидка 10% на работы, действует месяц']].map(r=>
    `<div class="kv"><span>${esc(r[0])}<div class="sub">${esc(r[1])}</div></span><span class="sw on" onclick="this.classList.toggle('on')"></span></div>`).join('')}
   <div class="hint">Сезонные поводы — самый простой способ загрузить провисающие недели. Система заранее предлагает список тех, кому это сообщение уместно.</div>
  </div>
 </div>`;
function runBlast(){sparks(22);
 toast('<b>Рассылка ушла на 79 номеров.</b> Отправка со второго номера, стоимость 0 ₸. По опыту похожих сервисов записывается 25–35%: это около 25 нарядов и ' + mln(25*F.avg) + ' ₸ за одну рассылку. Все ответы придут в общие «Входящие», а не в личный телефон менеджера.')}

/* ====== РЕФЕРАЛЬНАЯ ПРОГРАММА ====== */
SC.ref=()=>`${head('Реферальная программа','Ровно та схема, которую вы описали: клиент приводит друга по своему коду, друг получает скидку, а тот, кто привёл, — процент от его обслуживания. Считается и начисляется само.',
 '<button class="bt p" onclick="toast(\'Проценты, срок действия и количество обслуживаний настраиваются вами в интерфейсе. Мы закладываем схему в стандартный пакет.\')">Настроить условия</button>')}
 <div class="wid">
  <div><small>Клиентов с кодом</small><b class="a">${fmt(F.clients)}</b><span>код есть у каждого</span></div>
  <div><small>Пришло по рекомендации</small><b>11</b><span>за сентябрь</span></div>
  <div><small>Начислено бонусов</small><b class="g">${fmt(318000)} ₸</b><span>с начала программы</span></div>
  <div><small>Списано</small><b>${fmt(174000)} ₸</b><span>оплата работ бонусами</span></div>
  <div><small>Доля рекомендаций</small><b class="i">5%</b><span>заявок — резерв роста</span></div>
 </div>
 <div class="pan"><h3>Как это работает</h3><p>Схема с вашей встречи: пять процентов другу, пять процентов тому, кто привёл, в течение трёх обслуживаний.</p>
  <div class="reft">
   <div class="rnode lv1"><small>КТО ПРИВЁЛ</small><b>Турсынова Асель</b>
    <span>Постоянный клиент, 6 визитов. Личный код <b class="mono">AS-4417</b>, поделилась в WhatsApp одним нажатием.</span>
    <div class="amt">+47 000 ₸ бонусов</div></div>
   <div class="rnode"><small>ПРИШЁЛ ПО КОДУ</small><b>Оспанов Бекзат</b>
    <span>Первый визит — скидка 5% на работы. Дальше 5% скидки ещё на два обслуживания.</span>
    <div class="amt" style="color:var(--acc)">−31 000 ₸ скидки</div></div>
   <div class="rnode"><small>ВТОРОЙ УРОВЕНЬ</small><b>Друг Бекзата</b>
    <span>Бекзат тоже делится своим кодом и начинает получать бонусы. Цепочка продолжается сама.</span>
    <div class="amt" style="color:var(--muted)">схема повторяется</div></div>
  </div>
  <div class="g2" style="margin-top:12px;margin-bottom:0">
   <div>
    <div class="kv"><span>Скидка приглашённому</span><b>5% на работы</b></div>
    <div class="kv"><span>Бонус пригласившему</span><b>5% от суммы обслуживания друга</b></div>
    <div class="kv"><span>Сколько обслуживаний действует</span><b>3 визита</b></div>
    <div class="kv"><span>Срок жизни бонусов</span><b>12 месяцев</b></div>
   </div>
   <div>
    <div class="kv"><span>Чем можно оплатить бонусами</span><b>работы, не запчасти</b></div>
    <div class="kv"><span>Максимум бонусами за визит</span><b>30% чека</b></div>
    <div class="kv"><span>Где клиент видит баланс</span><b>в своём кабинете</b></div>
    <div class="kv"><span>Кто начисляет</span><b style="color:var(--ok)">система, автоматически</b></div>
   </div>
  </div>
 </div>
 <div class="g2">
  <div class="pan"><h3>Почему свою программу, а не готовый сервис</h3>
   <div class="li"><i>✓</i><span>Вы сказали: «их громадный инструмент, мне 90% не нужно»<span class="sub">здесь только ваша схема, без лишнего и без абонплаты</span></span></div>
   <div class="li"><i>✓</i><span>Бонусы живут в той же базе, что наряды и клиенты<span class="sub">не нужно сверять две системы</span></span></div>
   <div class="li"><i>✓</i><span>Менеджер видит бонусы прямо в карточке при разговоре</span></div>
   <div class="li"><i>✓</i><span>Код привязан к номеру телефона — назвать его достаточно устно</span></div>
   <div class="li"><i>✓</i><span>Условия меняются вами: проценты, срок, количество визитов</span></div>
   <div class="note" style="--tone:var(--brand)"><b>Мы включаем это в стандартный пакет</b>
    <p>Отдельной строкой платить не нужно — реферальная программа входит в те же 2 500 000 ₸.</p></div>
  </div>
  <div class="pan"><h3>Что даёт рекомендация</h3>
   <div class="kv"><span>Заявок по рекомендации сейчас</span><b>11 из ${F.leads} · 5%</b></div>
   <div class="kv"><span>Конверсия рекомендаций в наряд</span><b style="color:var(--ok)">36% против 71% в среднем</b></div>
   <div class="kv"><span>Средний чек по рекомендации</span><b>${fmt(235000)} ₸ · выше на 40%</b></div>
   <div class="kv"><span>Стоимость привлечения</span><b style="color:var(--ok)">5% от чека</b></div>
   <div class="hint">Реклама стоит дороже, а доверия даёт меньше. У вас уже есть клиенты, которые советуют вас друг другу бесплатно — программа просто делает это выгодным и считаемым.</div>
  </div>
 </div>`;

/* ====== ФИЛИАЛЫ ====== */
SC.branches=()=>`${head('Сеть сервисов','Второй сервис уже куплен, третий в планах. Вопрос со встречи: как управлять ими из одного места. Вот так — общий пульт, разделённые базы, одинаковые процессы.',
 '<button class="bt p" onclick="toast(\'Новый филиал заводится за минуту: название, адрес, посты, сотрудники. Процессы, этапы, услуги и прайс копируются из первого — новая точка сразу работает по тому же алгоритму.\')">+ ФИЛИАЛ</button>')}
 <div class="wid">
  <div><small>Сервисов в сети</small><b class="a">2</b><span>третий в планах</span></div>
  <div><small>Выручка сети</small><b>${mln(BR.reduce((a,b)=>a+b.rev,0))} ₸</b><span>за сентябрь</span></div>
  <div><small>Нарядов</small><b>${BR.reduce((a,b)=>a+b.ord,0)}</b><span>по обеим точкам</span></div>
  <div><small>Средняя загрузка</small><b class="w">68%</b><span>Есиль тянет вниз</span></div>
  <div><small>Сотрудников</small><b>${F.staff} + 4</b><span>механики и приёмщики</span></div>
 </div>
 <div class="brs">${BR.map((b,i)=>`<div class="br ${b.rev?'':'new'}" onclick="${b.rev?"go('bcab')":"toast('Третья точка заводится в системе до открытия: можно заранее настроить посты, услуги и сотрудников, а на старте просто включить.')"}">
  <h4>${esc(b.n)}</h4><div class="loc">${esc(b.loc)}</div>
  <div class="mt">
   <div><small>ВЫРУЧКА</small><b>${b.rev?mln(b.rev)+' ₸':'—'}</b></div>
   <div><small>НАРЯДОВ</small><b>${b.ord||'—'}</b></div>
   <div><small>ЗАГРУЗКА</small><b style="color:${b.load>75?'var(--ok)':b.load>40?'var(--warn)':'var(--muted2)'}">${b.load?b.load+'%':'—'}</b></div>
   <div><small>ВОЗВРАТНОСТЬ</small><b>${b.ret?b.ret+'%':'—'}</b></div>
  </div>
  <div style="margin-top:10px"><span class="tag ${b.st==='Работает'?'g':b.st==='Запуск'?'w':''}">${esc(b.st)}</span></div>
 </div>`).join('')}</div>
 <div class="pan"><h3>Сравнение точек</h3><p>Одни и те же показатели по обеим — видно, где процесс просел, а не «кажется, там хуже».</p>
  <div class="tw" style="border:0"><table class="t" style="min-width:820px">
   <thead><tr><th>Показатель</th><th class="r">Сарыарка</th><th class="r">Есиль</th><th>Разница</th></tr></thead>
   <tbody>${[['Выручка за месяц','18,4 млн ₸','6,1 млн ₸','втрое меньше, но точка работает 2 месяца','w'],
    ['Заказ-нарядов',168,57,'на одного механика меньше нарядов','w'],
    ['Средний чек','109 500 ₸','107 000 ₸','одинаково — процесс перенесён верно','g'],
    ['Загрузка постов','82%','54%','мало заявок, а не мало рук','r'],
    ['Возвратность','34%','21%','база молодая, повторных пока нет',''],
    ['Время ответа на заявку','11 мин','24 мин','здесь нужен контроль','r'],
    ['Фотоотчётов на наряд','4,6','3,1','приёмщик недоснимает','w']].map(r=>
   `<tr><td><b>${esc(r[0])}</b></td><td class="r">${esc(String(r[1]))}</td><td class="r">${esc(String(r[2]))}</td>
    <td><span class="tag ${r[4]}">${esc(r[3])}</span></td></tr>`).join('')}</tbody>
  </table></div>
 </div>
 <div class="g2">
  <div class="pan"><h3>Почему вторая точка «проваливается»</h3>
   <p>Ваши слова: «второй сервис у меня всегда проваливается из-за офлайн-управления — я должен постоянно там находиться».</p>
   <div class="li w"><i>!</i><span><b>Нет цифр — нет управления</b><span class="sub">пока показатели живут в голове управляющего, владелец узнаёт о проблеме через месяц</span></span></div>
   <div class="li w"><i>!</i><span><b>Процессы не описаны</b><span class="sub">на второй точке делают «как получится», а не как на первой</span></span></div>
   <div class="li w"><i>!</i><span><b>Нельзя проверить, не приехав</b><span class="sub">фотоотчёты и загрузка постов решают это без вашего присутствия</span></span></div>
   <div class="note" style="--tone:var(--brand)"><b>Оцифрованный процесс — условие третьей точки</b>
    <p>Пока вторая точка держится на вашем личном присутствии, третью открывать нельзя: вас не хватит на три адреса. Одинаковый процесс в системе — это то, что делает точку тиражируемой.</p></div>
  </div>
  <div class="pan"><h3>Как устроена филиальность</h3>
   <div class="li"><i>✓</i><span>У каждого филиала свои клиенты, наряды, склад и касса<span class="sub">базы разделены, сотрудник видит только свою точку</span></span></div>
   <div class="li"><i>✓</i><span>Свои номера WhatsApp и телефония<span class="sub">клиент пишет на номер своего сервиса</span></span></div>
   <div class="li"><i>✓</i><span>Свои посты, механики и график</span></div>
   <div class="li"><i>✓</i><span>Услуги, прайс и регламенты — общие или свои, на выбор</span></div>
   <div class="li"><i>✓</i><span>У управляющего — отдельный кабинет с урезанными правами</span></div>
   <div class="li b"><i>★</i><span><b>У вас — общий пульт по всей сети</b><span class="sub">сводно и по каждой точке отдельно, с телефона</span></span></div>
   <div class="hint">Филиальную сеть мы закладываем в проект сразу, хотя в стандартный пакет она обычно не входит — иначе через полгода придётся переделывать основание.</div>
  </div>
 </div>`;

/* ====== КАБИНЕТ УПРАВЛЯЮЩЕГО ====== */
SC.bcab=()=>`${head('Кабинет управляющего · REPAIR AUTO Есиль','Управляющий — самостоятельная боевая единица: свой дашборд, свои люди, свои деньги. Но только по своей точке и без доступа к сети целиком.',
 '<button class="bt" onclick="toast(\'Права управляющего настраиваются вами: что он видит, что меняет, какие суммы согласовывает сам, а какие — только с вами.\')">Права роли</button>')}
 <div class="wid">
  <div><small>Выручка точки</small><b class="a">${mln(BR[1].rev)} ₸</b><span>план ${mln(8000000)} ₸ · ${pct(BR[1].rev,8000000)}</span></div>
  <div><small>Нарядов</small><b>${BR[1].ord}</b><span>средний чек ${fmt(BR[1].rev/BR[1].ord)} ₸</span></div>
  <div><small>Загрузка постов</small><b class="w">${BR[1].load}%</b><span>3 поста · 2 механика</span></div>
  <div><small>Заявок без ответа</small><b class="r">5</b><span>дольше 15 минут</span></div>
  <div><small>Возвратность</small><b>${BR[1].ret}%</b><span>база формируется</span></div>
 </div>
 <div class="g21">
  <div class="pan"><h3>Что видит управляющий</h3>
   <div class="li"><i>✓</i><span>Загрузку своих постов и расписание на неделю</span></div>
   <div class="li"><i>✓</i><span>Все заявки и наряды своей точки</span></div>
   <div class="li"><i>✓</i><span>Выручку, кассу и план-факт по своему сервису</span></div>
   <div class="li"><i>✓</i><span>Своих механиков: часы, наряды, качество</span></div>
   <div class="li"><i>✓</i><span>Свой склад и заявки на закуп</span></div>
   <div class="li no"><i>·</i><span>Не видит другие филиалы и сводную по сети</span></div>
   <div class="li no"><i>·</i><span>Не видит закупочные цены и маржу<span class="sub">настраивается — при желании открывается</span></span></div>
   <div class="li w"><i>!</i><span>Скидки выше 10% согласует с вами<span class="sub">запрос приходит в ваш пульт, ответ — в одно нажатие</span></span></div>
  </div>
  <div class="pan"><h3>Контроль без присутствия</h3>
   <div class="kv"><span>Фотоотчётов за неделю</span><b>41</b></div>
   <div class="kv"><span>Нарядов без полного комплекта фото</span><b style="color:var(--warn)">6</b></div>
   <div class="kv"><span>Среднее время ответа на заявку</span><b style="color:var(--bad)">24 мин</b></div>
   <div class="kv"><span>Записались и не доехали</span><b style="color:var(--warn)">7 из 24</b></div>
   <div class="kv"><span>Свободных часов на постах</span><b>38 за неделю</b></div>
   <div class="note" style="--tone:var(--warn)"><b>Вот что видно за минуту, не приезжая</b>
    <p>Ответ 24 минуты против 11 на первой точке и семь несостоявшихся визитов из двадцати четырёх. Это не «плохой управляющий» — это конкретные два процесса, которые надо поправить. Разговор получается предметным.</p></div>
  </div>
 </div>`;

/* ====== ЗАДАЧИ ====== */
SC.tasks=()=>{
 const G=[['late','Просрочено','r'],['today','Сегодня','w'],['week','На неделе','']];
 return `${head('Задачи','Два типа, как вы и говорили: задачи по клиентам и продажам — и административные, между сотрудниками. Большинство ставит система по событию.',
  '<button class="bt p" onclick="toast(\'Задачу можно поставить руками любому сотруднику — с сроком, описанием и вложениями. Но 8 из 10 задач система создаёт сама по событию.\')">+ ЗАДАЧА</button>')}
 <div class="g3">
  ${G.map(g=>`<div class="pan"><h3>${esc(g[1])} <span class="tag ${g[2]}">${TASKS.filter(t=>t.grp===g[0]).length}</span></h3>
   ${TASKS.filter(t=>t.grp===g[0]).map(t=>`<div class="li ${g[0]==='late'?'w':g[0]==='today'?'n':'no'}" style="cursor:pointer"
     onclick="${t.lead?`openLead(${t.lead})`:`toast('Задача открывается вместе с объектом: клиентом, нарядом, позицией склада или просто как поручение сотруднику.')`}">
    <i>${g[0]==='late'?'!':'·'}</i><span>${esc(t.t)}<span class="sub">${esc(t.ty)} · ${esc(t.who)} · ${esc(t.due)}</span></span></div>`).join('')}
  </div>`).join('')}
 </div>
 <div class="g2">
  <div class="pan"><h3>Задачи по клиентам — ставит система</h3>
   <div class="kv"><span>Новая заявка — ответить за 15 минут</span><b>при создании</b></div>
   <div class="kv"><span>Смета не согласована сутки</span><b>менеджеру</b></div>
   <div class="kv"><span>Клиент записан, но не доехал</span><b>на следующий день</b></div>
   <div class="kv"><span>Наряд закрыт — позвонить через 3 дня</span><b>контроль качества</b></div>
   <div class="kv"><span>Подошло ТО по пробегу или дате</span><b>менеджеру + рассылка</b></div>
   <div class="kv"><span>Клиент молчит 8 месяцев</span><b>в список реактивации</b></div>
   <div class="kv"><span>Остаток детали упал ниже минимума</span><b>кладовщику</b></div>
  </div>
  <div class="pan"><h3>Административные — между сотрудниками</h3>
   <p>Ваш пример со встречи: «открываем новый офис — такие административные задачи, чтобы других сотрудников тоже подтягивать».</p>
   <div class="li n"><i>✓</i><span>Подготовить документы на аренду второго сервиса<span class="sub">Серик · завтра · подзадачи на бухгалтера и юриста</span></span></div>
   <div class="li n"><i>✓</i><span>Аттестация механиков по новому оборудованию<span class="sub">Бекзат · 25.09 · чек-лист на 6 пунктов</span></span></div>
   <div class="li n"><i>✓</i><span>Сверить кассу за неделю и закрыть смену<span class="sub">Гульмира · пятница · повторяется еженедельно</span></span></div>
   <div class="li n"><i>✓</i><span>Заказать инструмент на вторую точку<span class="sub">Ержан · с бюджетом и согласованием</span></span></div>
   <div class="hint">Административные задачи живут в том же портале, что и клиентские: сотруднику не нужно держать открытыми два приложения, а вам — помнить, кому что поручали.</div>
  </div>
 </div>`};

/* ====== МЕХАНИКИ ====== */
SC.mech=()=>`${head('Механики и зарплата','Часы, наряды и выработка по каждому. Зарплата считается из закрытых нормо-часов, а не из блокнота — спорить не о чем.',
 '<button class="bt" onclick="toast(\'Схема оплаты настраивается: ставка за нормо-час, процент от наряда, оклад плюс процент или смешанная. Считается автоматически при закрытии наряда.\')">Схема оплаты</button>')}
 <div class="wid">
  <div><small>Механиков</small><b class="a">${F.mechs}</b><span>на ${F.posts} постах</span></div>
  <div><small>Нормо-часов за месяц</small><b>${MECH.reduce((a,m)=>a+m.h,0)}</b><span>закрыто нарядами</span></div>
  <div><small>Фонд оплаты</small><b>${mln(MECH.reduce((a,m)=>a+m.h*m.rate,0))} ₸</b><span>${pct(MECH.reduce((a,m)=>a+m.h*m.rate,0),F.revenue)} выручки</span></div>
  <div><small>Выработка на механика</small><b class="g">${mln(MECH.reduce((a,m)=>a+m.sum,0)/F.mechs)} ₸</b><span>в среднем</span></div>
  <div><small>Повторных обращений</small><b class="g">1,2%</b><span>переделки по гарантии</span></div>
 </div>
 <div class="tw"><table class="t" style="min-width:900px">
  <thead><tr><th>Механик</th><th class="r">Нормо-часов</th><th class="r">Ставка</th><th class="r">Нарядов</th><th class="r">Выработка</th><th>Загрузка</th><th class="r">Качество</th><th class="r">К выплате</th></tr></thead>
  <tbody>${MECH.map(m=>`<tr onclick="toast('Карточка механика: его наряды, часы по дням, переделки по гарантии, фотоотчёты и начисления за период.')">
   <td><b>${avatar(m.n)} ${esc(m.n)}</b></td>
   <td class="r">${m.h}</td><td class="r">${fmt(m.rate)} ₸/ч</td>
   <td class="r">${m.ord}</td><td class="r"><b>${fmt(m.sum)} ₸</b></td>
   <td><div class="bar" style="--w:${m.h/180*100}%"><i class="${m.h>168?'r':m.h>155?'g':'w'}"></i></div><div class="sub2">${num(m.h/176*100)}% нормы</div></td>
   <td class="r"><span class="tag ${m.q>=98?'g':'w'}">${m.q}%</span></td>
   <td class="r"><b>${fmt(m.h*m.rate)} ₸</b></td></tr>`).join('')}</tbody>
 </table></div>
 <div class="g2" style="margin-top:12px">
  <div class="pan"><h3>Что это даёт</h3>
   <div class="li"><i>✓</i><span>Зарплата считается сама из закрытых нарядов<span class="sub">бухгалтер не сводит часы вручную в конце месяца</span></span></div>
   <div class="li"><i>✓</i><span>Видно, кто берёт сложные работы, а кто только быстрые<span class="sub">Дархан: 28 нарядов, но выработка выше всех</span></span></div>
   <div class="li"><i>✓</i><span>Переделки по гарантии считаются отдельно<span class="sub">и влияют на показатель качества</span></span></div>
   <div class="li"><i>✓</i><span>Механик видит свои часы и начисления в своём доступе</span></div>
   <div class="li w"><i>!</i><span>Азамат перегружен — 172 часа при норме 176<span class="sub">при росте потока нужен пятый механик</span></span></div>
  </div>
  <div class="pan"><h3>Структура выручки</h3>
   <div class="kv"><span>Выручка сервиса</span><b>${mln(F.revenue)} ₸</b></div>
   <div class="kv"><span>Запчасти по закупу</span><b>−${mln(4980000)} ₸</b></div>
   <div class="kv"><span>Зарплата механиков</span><b>−${mln(MECH.reduce((a,m)=>a+m.h*m.rate,0))} ₸</b></div>
   <div class="kv"><span>Зарплата остальных</span><b>−${mln(1850000)} ₸</b></div>
   <div class="kv"><span>Аренда и коммунальные</span><b>−${mln(1400000)} ₸</b></div>
   <div class="kv"><span>Прочие расходы</span><b>−${mln(760000)} ₸</b></div>
   <div class="kv"><span><b>Остаётся</b></span><b style="color:var(--ok);font-size:14px">${mln(F.revenue-4980000-MECH.reduce((a,m)=>a+m.h*m.rate,0)-1850000-1400000-760000)} ₸</b></div>
   <div class="hint">Эти строки вы настраиваете под свой учёт. Портал не заменяет бухгалтерию, но показывает владельцу, что осталось от месяца, не дожидаясь отчёта.</div>
  </div>
 </div>`;

/* ====== ОТЧЁТЫ ====== */
SC.reports=()=>`${head('Отчёты','Управленческие отчёты собираются из тех же данных, что и работа. Не из таблицы, которую кто-то ведёт параллельно и забывает обновить.',
 '<button class="bt p" onclick="toast(\'Любой отчёт ставится на расписание: приходит вам в WhatsApp или на почту утром в нужный день, в Excel или PDF.\')">Расписание отчётов</button>')}
 <div class="g2">
  <div class="pan"><h3>Деньги</h3>
   ${[['Выручка за период','работы и запчасти раздельно, по филиалам'],
      ['Касса и способы оплаты','Kaspi, карта, наличные, безнал'],
      ['Прибыль по нарядам','с учётом закупа запчастей и часов механика'],
      ['Зарплата механиков','нормо-часы и начисления за период'],
      ['Дебиторка по корпоративным','кто не оплатил по счёту']].map(r=>
    `<div class="kv"><span>${esc(r[0])}<div class="sub">${esc(r[1])}</div></span>
     <button class="bt" onclick="toast('Отчёт «${esc(r[0])}» формируется за любой период и выгружается в Excel.')">Excel</button></div>`).join('')}
  </div>
  <div class="pan"><h3>Клиенты и загрузка</h3>
   ${[['Возвратность','сколько вернулось и через сколько месяцев'],
      ['Воронка и причины отказов','где теряются заявки'],
      ['Загрузка постов','по дням, часам и механикам'],
      ['Кому пора на ТО','список на рассылку'],
      ['Реферальная программа','кто привёл, сколько начислено']].map(r=>
    `<div class="kv"><span>${esc(r[0])}<div class="sub">${esc(r[1])}</div></span>
     <button class="bt" onclick="toast('Отчёт «${esc(r[0])}» можно поставить на расписание и получать автоматически.')">Excel</button></div>`).join('')}
  </div>
 </div>
 <div class="pan"><h3>Десять цифр, по которым владелец понимает, что происходит</h3>
  <p>Вы сказали: «десять выжимок — это ваш целый рабочий день». Вот они, на одном экране.</p>
  <div class="g3" style="margin:0">
   <div>
    <div class="kv"><span>Выручка сети за месяц</span><b>${mln(BR.reduce((a,b)=>a+b.rev,0))} ₸</b></div>
    <div class="kv"><span>Нарядов закрыто</span><b>${BR.reduce((a,b)=>a+b.ord,0)}</b></div>
    <div class="kv"><span>Средний чек</span><b>${fmt(F.avg)} ₸</b></div>
    <div class="kv"><span>Загрузка постов</span><b>68%</b></div>
   </div>
   <div>
    <div class="kv"><span>Заявок без ответа</span><b style="color:var(--bad)">14</b></div>
    <div class="kv"><span>Записались, не доехали</span><b style="color:var(--warn)">18</b></div>
    <div class="kv"><span>Возвратность</span><b>${F.ret}%</b></div>
    <div class="kv"><span>Спящих машин</span><b style="color:var(--warn)">${F.lost}</b></div>
   </div>
   <div>
    <div class="kv"><span>Наряды без фотоотчёта</span><b style="color:var(--warn)">6</b></div>
    <div class="kv"><span>Позиции в нуле на складе</span><b style="color:var(--bad)">1</b></div>
    <div class="kv"><span>Остаток после расходов</span><b style="color:var(--ok)">${mln(4030000)} ₸</b></div>
    <div class="kv"><span>Задач просрочено</span><b style="color:var(--bad)">1</b></div>
   </div>
  </div>
  <div class="note" style="--tone:var(--brand)"><b>Если что-то идёт не так — приказ по линии</b>
   <p>Управляющему на точке, менеджеру, кладовщику. Задача ставится прямо с этого экрана и попадает человеку в его портал — и вы видите, выполнил он её или нет.</p></div>
 </div>`;

/* ====== УСЛУГИ И ЭТАПЫ ====== */
SC.settings=()=>`${head('Услуги, прайс и этапы','Всё, что меняется в бизнесе чаще, чем раз в год, вы меняете сами: этапы воронки, услуги, нормо-часы, регламенты и правила. Без разработчика и без оплаты часов.',
 '<button class="bt p" onclick="toast(\'Новый этап или услуга добавляется мышкой: название, цвет, обязательные поля, нормо-часы и правило автоматического перехода.\')">+ ДОБАВИТЬ</button>')}
 <div class="g2">
  <div class="pan"><h3>Этапы работы с заявкой</h3><p>Порядок меняется перетаскиванием. Сейчас — ровно та цепочка, которую вы описали на встрече.</p>
   ${ST.map((s,i)=>`<div class="srow"><span class="gr">⣿</span><span class="cbox" style="background:${s[2]}"></span>
    <span class="nm">${esc(s[1])}<div class="sub">${['заявка зафиксирована, назначен менеджер','первый контакт, уточнение симптомов','пост и время забронированы','осмотр, пробег, фото кузова','смета ушла клиенту в WhatsApp','механик на посту, фотоотчёт обязателен','клиенту ушло «машина готова»','оплата, документы, запись в книжку'][i]}</div></span>
    <span class="sw on" onclick="this.classList.toggle('on');toast('Этап можно выключить — он исчезнет из воронки, а заявки перейдут на следующий.')"></span></div>`).join('')}
  </div>
  <div class="pan"><h3>Услуги и нормо-часы</h3><p>Прайс ведёте вы. Из него собирается смета в наряде.</p>
   <div class="tw" style="border:0"><table class="t" style="min-width:520px">
    <thead><tr><th>Услуга</th><th class="r">Н/ч</th><th class="r">Цена за час</th><th class="r">Стоимость</th></tr></thead>
    <tbody>${[['Замена масла и фильтра',0.8],['Замена колодок, ось',1.2],['Замена стоек, пара',2.5],['Развал-схождение',1.5],['Диагностика двигателя',1.0],['Замена ремня ГРМ',5.0],['Ремонт АКПП',12.0]].map(r=>
    `<tr><td>${esc(r[0])}</td><td class="r">${num(r[1])}</td><td class="r">18 000 ₸</td><td class="r"><b>${fmt(r[1]*18000)} ₸</b></td></tr>`).join('')}</tbody>
   </table></div>
   <div class="hint">Ставка нормо-часа задаётся общая или отдельная по видам работ и по филиалам. Изменение прайса не затрагивает уже открытые наряды.</div>
  </div>
 </div>
 <div class="g2">
  <div class="pan"><h3>Правила автоматики</h3>
   ${[['Ответить на заявку за 15 минут','иначе краснеет и уходит руководителю',1],
      ['Напоминать о записи за день и за 2 часа','это те 18 несостоявшихся визитов',1],
      ['Не закрывать наряд без фотоотчёта','5 обязательных снимков',1],
      ['Списывать запчасти со склада при закрытии','остаток всегда актуален',1],
      ['Создавать запись в сервисной книжке','дата, пробег, работы, следующее ТО',1],
      ['Напоминать о ТО за 500 км или за неделю','второй номер WhatsApp',1],
      ['Начислять реферальные бонусы','5% тому, кто привёл',1],
      ['Просить клиента обновить пробег','раз в месяц, если не заходил',1],
      ['Звонить через 3 дня после выдачи','контроль качества',0]].map(r=>
    `<div class="srow"><span class="nm">${esc(r[0])}<div class="sub">${esc(r[1])}</div></span>
     <span class="sw ${r[2]?'on':''}" onclick="this.classList.toggle('on')"></span></div>`).join('')}
  </div>
  <div class="pan"><h3>Поля, которые заводите вы</h3>
   ${[['Причина обращения','список'],['Причина отказа','список'],['Источник заявки','определяется сам'],['Тип клиента','физлицо / компания'],['Скидочная группа','список'],['Комментарий приёмщика','текст'],['Гарантия на работы','число месяцев'],['Способ оплаты','список']].map(f=>
    `<div class="srow"><span class="gr">⣿</span><span class="nm">${esc(f[0])}<div class="sub">${esc(f[1])}</div></span>
     <span class="tag ${f[1]==='определяется сам'?'g':'a'}">${f[1]==='определяется сам'?'авто':'ваше поле'}</span></div>`).join('')}
   <div class="note" style="--tone:var(--acc)"><b>Это и есть «тысяча мелочей»</b>
    <p>Мы выкатываем ядро, вы говорите: это поле лишнее, здесь нужен список, тут другой порядок. Часть правок вы потом делаете сами в настройках, за часть мы беремся — но основа уже работает.</p></div>
  </div>
 </div>`;

/* ====== ПОЛЬЗОВАТЕЛИ ====== */
SC.users=()=>`${head('Пользователи и права','Сейчас пять человек, но портал рассчитан до пятидесяти без переделки. За количество пользователей вы не платите — ни сейчас, ни при росте.',
 '<button class="bt p" onclick="toast(\'Сотрудник заводится за минуту: имя, роль, филиал. При увольнении доступ закрывается, а его заявки, переписка и наряды остаются в компании.\')">+ СОТРУДНИК</button>')}
 <div class="wid">
  <div><small>Сейчас в портале</small><b class="a">${F.staff}</b><span>+4 механика</span></div>
  <div><small>Ролей</small><b>${Object.keys(ROLES).length}</b><span>настраиваемых</span></div>
  <div><small>Без рефакторинга</small><b class="g">до 50</b><span>пользователей</span></div>
  <div><small>Плата за пользователей</small><b class="g">0 ₸</b><span>всегда</span></div>
  <div><small>Журнал действий</small><b style="font-size:15px">ведётся</b><span>кто, что и когда менял</span></div>
 </div>
 <div class="tw"><table class="t" style="min-width:920px">
  <thead><tr><th>Роль</th><th>Кто это</th><th>Что видит и делает</th><th class="r">Разделов</th><th>Ограничения</th></tr></thead>
  <tbody>${Object.entries(ROLES).map(([k,v])=>`<tr onclick="enter('${esc(k)}')" title="Открыть портал глазами этой роли">
   <td><b>${avatar(v.n)} ${esc(k)}</b></td><td>${esc(v.n)} · ${esc(v.r)}</td>
   <td class="sub2">${esc(v.note)}</td><td class="r">${v.s.length}</td>
   <td class="sub2">${k==='Механик'?'только свои наряды, не видит деньги и клиентов':k==='Кладовщик'?'склад и закуп, не видит выручку':k==='Менеджер-консультант'?'не видит закуп и себестоимость':k==='Мастер-приёмщик'?'не меняет прайс и скидки':k==='Бухгалтер-кассир'?'не меняет наряды задним числом':k==='Управляющий сервисом'?'только своя точка, скидки выше 10% — с вами':'полный доступ по всей сети'}</td></tr>`).join('')}</tbody>
 </table></div>
 <div class="g2" style="margin-top:12px">
  <div class="pan"><h3>Почему права важны в сервисе</h3>
   <div class="li"><i>✓</i><span>Механик не видит, сколько заработал сервис на его наряде</span></div>
   <div class="li"><i>✓</i><span>Менеджер не видит закупочную цену запчасти<span class="sub">и не может назвать её клиенту в разговоре</span></span></div>
   <div class="li"><i>✓</i><span>Наряд нельзя изменить задним числом незаметно<span class="sub">все правки в журнале, с автором и временем</span></span></div>
   <div class="li"><i>✓</i><span>Выгрузка базы клиентов ограничена ролью<span class="sub">уволившийся менеджер не уносит её с собой</span></span></div>
   <div class="li"><i>✓</i><span>Управляющий второй точки не видит первую</span></div>
  </div>
  <div class="pan"><h3>Рост без доплат</h3>
   <div class="kv"><span>Сейчас сотрудников</span><b>${F.staff} + 4 механика</b></div>
   <div class="kv"><span>Вторая точка</span><b>+6 человек</b></div>
   <div class="kv"><span>Третья точка</span><b>+6 человек</b></div>
   <div class="kv"><span>Доплата за пользователей</span><b style="color:var(--ok)">0 ₸</b></div>
   <div class="kv"><span>Порог рефакторинга</span><b>50 пользователей</b></div>
   <div class="note" style="--tone:var(--ok)"><b>Что будет после пятидесяти</b>
    <p>Когда сеть дорастёт, мы делаем небольшую пересборку под нагрузку — она обсуждается отдельно и стоит недорого. До этого порога ничего делать не нужно.</p></div>
  </div>
 </div>`;

/* ====== ИНТЕГРАЦИИ ====== */
SC.integr=()=>`${head('Интеграции','Шесть подключений. Мы не тянем всё сразу: в ядро входит то, без чего процесс не работает, остальное добавляется, когда понадобится.',
 '<button class="bt" onclick="toast(\'Если внешний сервис недоступен, заявка не теряется: она встаёт в очередь и обрабатывается при восстановлении связи. Все обращения пишутся в журнал.\')">Что при сбое</button>')}
 <div class="tw"><table class="t" style="min-width:940px">
  <thead><tr><th>Сервис</th><th>Что даёт</th><th>Когда</th><th class="r">Стоимость</th><th>Этап</th></tr></thead>
  <tbody>${[
   ['WhatsApp · номер 1','Диалоги с клиентами, смета, «машина готова», документы','Весь цикл','по тарифу Meta','в ядре','g'],
   ['WhatsApp · номер 2 (GreenAPI)','Массовые напоминания о ТО, поздравления, акции','Рассылки','5 000 ₸ / мес','в ядре','g'],
   ['Телефония','Звонок из карточки, запись разговора, пропущенные как заявки','Весь цикл','ваша АТС','в ядре','g'],
   ['Kaspi и эквайринг','Оплата наряда и розничной продажи, чек клиенту','Выдача','по договору банка','в ядре','g'],
   ['Сайт repair-auto и интернет-магазин','Заявка с формы, остатки и цены на витрину','По готовности','входит','второй этап','w'],
   ['1С для автосервиса и подбор запчастей','Бухгалтерия и каталоги запчастей по VIN','Позже','отдельно','когда решите','']
  ].map(r=>`<tr onclick="toast('${esc(r[0])}: ${esc(r[1])}.')">
   <td><b>${esc(r[0])}</b></td><td class="sub2">${esc(r[1])}</td><td class="sub2">${esc(r[2])}</td>
   <td class="r">${esc(r[3])}</td><td><span class="tag ${r[5]}">${esc(r[4])}</span></td></tr>`).join('')}</tbody>
 </table></div>
 <div class="g2" style="margin-top:12px">
  <div class="pan"><h3>1С — честно</h3>
   <p>Вы сказали: «если мы сделаем нормальную программу, может, без 1С, но в будущем — 1С для автосервиса отдельно, плюс подбор запчастей».</p>
   <div class="li"><i>✓</i><span>Ядро работает без 1С<span class="sub">наряды, склад, касса и отчёты живут в портале</span></span></div>
   <div class="li"><i>✓</i><span>Интеграция делается, когда 1С появится<span class="sub">облачная, восьмая версия — стандартный обмен</span></span></div>
   <div class="li"><i>✓</i><span>Подбор запчастей по каталогам — отдельный блок<span class="sub">артикулы, применимость и поставщики в портале уже есть</span></span></div>
   <div class="li no"><i>·</i><span>Не тянем это в ядро<span class="sub">иначе срок вырастет вдвое, а пользы на старте не будет</span></span></div>
   <div class="hint">Так же мы поступаем с сайтом: интеграция формы — второй этап, потому что сначала должно заработать то, куда эта форма будет приземляться.</div>
  </div>
  <div class="pan"><h3>Где всё это живёт</h3>
   <div class="kv"><span>Сервер</span><b>Cloudflare</b></div>
   <div class="kv"><span>Стоимость на старте</span><b style="color:var(--ok)">бесплатно</b></div>
   <div class="kv"><span>При росте трафика</span><b>10–15 000 ₸ / мес</b></div>
   <div class="kv"><span>Резервные копии</span><b>ежедневно</b></div>
   <div class="kv"><span>Домен</span><b>ваш, например portal.repair-auto.kz</b></div>
   <div class="kv"><span>Доступ</span><b>браузер, с телефона тоже</b></div>
   <div class="note" style="--tone:var(--acc)"><b>Мобильное приложение — позже и не обязательно</b>
    <p>До десяти сервисов веб-версии достаточно: она открывается с телефона и работает так же. Отдельное приложение имеет смысл, когда сеть большая, — и делается уже поверх готового портала.</p></div>
  </div>
 </div>`;

/* ====== ЭКОНОМИКА ====== */
function econCalc(){
 const back=ECON.hours;
 const rev=back*F.avg;
 const income=rev*ECON.marg/100;
 const save=31000;
 const monthly=ECON.wa+ECON.host;
 const net=income+save-monthly;
 const pay=net>0?ECON.core/net:0;
 return {rev,income,save,monthly,net,pay,year:net*12};
}
function econSet(k,v){ECON[k]=+v;render()}
SC.economy=()=>{const E=econCalc();return `${head('Стоимость и окупаемость','Стандартный пакет — 2 500 000 ₸, оплата 10 / 45 / 45, срок 4–6 недель. Ниже — на чём он возвращается на ваших же цифрах.',
 '<button class="bt p" onclick="go(\'stack\')">Что получаете →</button>')}
 <div class="wid">
  <div><small>Стандартный пакет</small><b class="a">${fmt(ECON.core)} ₸</b><span>разово, оплата по этапам</span></div>
  <div><small>Срок</small><b>4–6 недель</b><span>ядро — через 2–3 недели</span></div>
  <div><small>Доработки после сдачи</small><b>20 $ / час</b><span>на рынке от 50</span></div>
  <div><small>Ежемесячно</small><b class="g">${fmt(ECON.wa+ECON.host)} ₸</b><span>канал и сервер</span></div>
  <div><small>Лицензии за людей</small><b class="g">0 ₸</b><span>до 50 пользователей</span></div>
 </div>
 <div class="calc">
  <div>
   <div class="crow"><label>Дополнительных нарядов в месяц от напоминаний <b>${ECON.hours}</b></label>
    <input type="range" min="3" max="40" step="1" value="${ECON.hours}" oninput="econSet('hours',this.value)"></div>
   <div class="crow"><label>Валовая маржа с наряда <b>${ECON.marg}%</b></label>
    <input type="range" min="30" max="70" step="5" value="${ECON.marg}" oninput="econSet('marg',this.value)"></div>
   <div class="crow"><label>Канал рассылок через нас, ₸ в месяц <b>${fmt(ECON.wa)} ₸</b></label>
    <input type="range" min="0" max="36000" step="1000" value="${ECON.wa}" oninput="econSet('wa',this.value)"></div>
   <div class="crow"><label>Сервер и хостинг, ₸ в месяц <b>${fmt(ECON.host)} ₸</b></label>
    <input type="range" min="0" max="30000" step="1000" value="${ECON.host}" oninput="econSet('host',this.value)"></div>
   <div class="note" style="--tone:var(--brand)"><b>Откуда берутся наряды</b>
    <p>141 машина в списке «пора на ТО», из них 48 уже просрочены. Даже отклик 15–20% на рассылку — это ${Math.round(141*0.17)} нарядов в первый месяц. Дальше поток стабилизируется на уровне возвратов по регламенту. Ползунок стоит на осторожных десяти — поставьте своё число.</p></div>
  </div>
  <div class="res">
   <div class="rr"><span>Дополнительная выручка в месяц</span><b>${fmt(E.rev)} ₸</b></div>
   <div class="rr"><span>Из неё валовая маржа</span><b>${fmt(E.income)} ₸</b></div>
   <div class="rr"><span>Экономия на канале рассылок</span><b>${fmt(E.save)} ₸</b></div>
   <div class="rr"><span>Ежемесячные расходы на портал</span><b>−${fmt(E.monthly)} ₸</b></div>
   <div class="rr hi"><span>Чистый эффект в месяц</span><b>${fmt(E.net)} ₸</b></div>
   <div class="rr"><span>За год</span><b>${fmt(E.year)} ₸</b></div>
   <div class="rr"><span>Окупаемость разработки</span><b>${E.pay>0&&E.pay<60?num(E.pay)+' '+plural(Math.round(E.pay),['месяц','месяца','месяцев']):'—'}</b></div>
   <div class="rr"><span>Средний чек в расчёте</span><b>${fmt(F.avg)} ₸</b></div>
   <div class="rr"><span style="color:var(--muted);font-size:10.4px">Считаем по валовой марже: выручка минус закуп запчастей и зарплата механика. Постоянные расходы не учитываем — они у вас уже есть и от портала не меняются.</span><b></b></div>
  </div>
 </div>
 <div class="g2">
  <div class="pan"><h3>Оплата по этапам</h3>
   <div class="kv"><span><b>Этап 1 · старт</b><div class="sub">фиксируем процессы, услуги, прайс и роли; переносим клиентов и машины</div></span><b>${fmt(ECON.core*0.1)} ₸ · 10%</b></div>
   <div class="kv"><span><b>Этап 2 · ядро выкачено</b><div class="sub">заявки, наряды, склад, клиенты, книжка — через 2–3 недели, с ним уже можно работать</div></span><b>${fmt(ECON.core*0.45)} ₸ · 45%</b></div>
   <div class="kv"><span><b>Этап 3 · полная сдача</b><div class="sub">правки по вашим замечаниям, рассылки, рефералка, филиалы, обучение — ещё 2–3 недели</div></span><b>${fmt(ECON.core*0.45)} ₸ · 45%</b></div>
   <div class="note" style="--tone:var(--ok)"><b>Почему так, а не полное ТЗ вперёд</b>
    <p>Полное техническое задание вы будете писать месяц, а после сдачи всё равно захотите переделать треть. Быстрее и дешевле выкатить ядро, посмотреть на него живьём и править по факту. Встречаемся раз-два в неделю и выкатываем версии.</p></div>
  </div>
  <div class="pan"><h3>Что входит в пакет без доплат</h3>
   <div class="li"><i>✓</i><span>Заявки, воронка, задачи, клиенты и автомобили</span></div>
   <div class="li"><i>✓</i><span>Заказ-наряды, посты, фотоотчёт, документы</span></div>
   <div class="li"><i>✓</i><span>Склад запчастей, поступление, продажи</span></div>
   <div class="li"><i>✓</i><span>Электронная сервисная книжка и кабинет клиента</span></div>
   <div class="li"><i>✓</i><span>WhatsApp на два номера, телефония, напоминания</span></div>
   <div class="li b"><i>★</i><span><b>Реферальная программа</b><span class="sub">включаем в стандартный пакет</span></span></div>
   <div class="li b"><i>★</i><span><b>Филиальная сеть и кабинеты управляющих</b><span class="sub">берём с натяжкой, но берём — иначе третью точку придётся переделывать</span></span></div>
   <div class="li"><i>✓</i><span>Роли, права, журнал действий, отчёты</span></div>
   <div class="hint">Что не входит: интеграция с 1С, подбор запчастей по каталогам, мобильное приложение и витрина интернет-магазина. Это отдельные блоки, они делаются по 20 $ в час, когда до них дойдёт очередь.</div>
  </div>
 </div>`};

/* ====== ЧТО ПОЛУЧАЕТЕ ====== */
SC.stack=()=>`${head('Что вы получаете на выходе','Не доступ к чужому сервису по подписке, а свой портал: код, база, сервер и документация принадлежат вам.',
 '<button class="bt p" onclick="toast(\'Исходный код передаётся в ваш репозиторий, база — на ваш сервер. Развивать можно с нами или своей командой.\')">Условия передачи</button>')}
 <div class="g3">
  <div class="pan"><h3>Код и права</h3>
   <div class="li"><i>✓</i><span>Исходный код в вашем репозитории</span></div>
   <div class="li"><i>✓</i><span>Исключительные права по договору</span></div>
   <div class="li"><i>✓</i><span>Без скрытых модулей и ключей</span></div>
   <div class="li"><i>✓</i><span>Документация и схема базы</span></div>
  </div>
  <div class="pan"><h3>Данные</h3>
   <div class="li"><i>✓</i><span>База на вашем сервере</span></div>
   <div class="li"><i>✓</i><span>Ежедневные резервные копии</span></div>
   <div class="li"><i>✓</i><span>Полная выгрузка в любой момент</span></div>
   <div class="li"><i>✓</i><span>Клиентская база не уходит с сотрудником</span></div>
  </div>
  <div class="pan"><h3>Дальше</h3>
   <div class="li"><i>✓</i><span>Доработки — 20 $ / час по факту</span></div>
   <div class="li"><i>✓</i><span>Или своей командой — код у вас</span></div>
   <div class="li"><i>✓</i><span>Новые блоки оцениваем до начала работ</span></div>
   <div class="li"><i>✓</i><span>Гарантия на разработанное по договору</span></div>
  </div>
 </div>
 <div class="g21">
  <div class="pan"><h3>План работ · 4–6 недель</h3>
   <div class="tl">
    <div class="tli ok"><b>Неделя 1 · Процессы и данные</b><p>Фиксируем этапы, услуги, прайс, нормо-часы, роли и регламенты ТО. Переносим клиентов, машины и остатки склада.</p></div>
    <div class="tli ok"><b>Недели 2–3 · Ядро</b><p>Заявки, воронка, заказ-наряды, посты, склад, клиенты и автомобили, сервисная книжка. Выкатываем — с этого момента портал уже можно использовать.</p></div>
    <div class="tli on"><b>Неделя 3 · Ваши правки</b><p>Смотрите живьём и говорите: это лишнее, здесь по-другому, сюда добавить. Встречаемся один-два раза в неделю.</p></div>
    <div class="tli"><b>Неделя 4 · Каналы и автоматика</b><p>WhatsApp на два номера, телефония, напоминания о ТО, кабинет клиента, реферальная программа.</p></div>
    <div class="tli"><b>Неделя 5 · Филиалы и деньги</b><p>Вторая точка, кабинет управляющего, общий пульт, касса, зарплата механиков, отчёты.</p></div>
    <div class="tli"><b>Неделя 6 · Обучение и запуск</b><p>Обучаем пятерых сотрудников, неделю работаем параллельно со старым порядком, потом переходим полностью.</p></div>
   </div>
  </div>
  <div class="pan"><h3>Чем вы рискуете</h3>
   <div class="kv"><span>Старт</span><b>${fmt(ECON.core*0.1)} ₸</b></div>
   <div class="kv"><span>Следующий платёж</span><b>только после ядра</b></div>
   <div class="kv"><span>Демо до начала работ</span><b style="color:var(--ok)">перед вами</b></div>
   <div class="kv"><span>Показываем работу</span><b>1–2 раза в неделю</b></div>
   <div class="kv"><span>Старый порядок выключаем</span><b>через неделю параллельной работы</b></div>
   <div class="note" style="--tone:var(--brand)"><b>Мы не любим «в долгую»</b>
    <p>Чем быстрее стартуем, тем быстрее вы увидите ядро и начнёте править его под себя. Растянутый на полгода проект вреден обеим сторонам.</p></div>
   <div class="hint">Если 2,5 млн сразу неудобно — график платежей обсуждаем. Главное — начать и выкатить ядро; это уже даёт заявки, наряды и напоминания.</div>
  </div>
 </div>`;

/* ====== МОДАЛКА ЗАЯВКИ ====== */
function openLead(id){
 const l=LEADS.find(x=>x.id===id);if(!l)return;
 const idx=ST.findIndex(s=>s[0]===l.s);
 openM(`Заявка № ${l.id} · ${esc(l.c)}`,`${esc(l.car)} · ${esc(l.gn)} · ${esc(l.ch)} · ${esc(l.mg)}`,`
  <div class="wid" style="grid-template-columns:repeat(4,1fr);margin-bottom:12px">
   <div><small>Что нужно</small><b style="font-size:14px">${esc(l.what)}</b><span>со слов клиента</span></div>
   <div><small>Смета</small><b class="a">${l.sum?fmt(l.sum)+' ₸':'ещё нет'}</b><span>работы и запчасти</span></div>
   <div><small>Этап</small><b style="font-size:14px">${esc(STN[l.s])}</b><span>${idx+1} из ${ST.length}</span></div>
   <div><small>Телефон</small><b class="mono" style="font-size:14px">${esc(l.ph)}</b><span>WhatsApp и звонки здесь же</span></div>
  </div>
  <div class="g2" style="margin-bottom:0">
   <div class="pan"><h3>Движение по этапам</h3>
    <div class="tl">${ST.map((s,i)=>`<div class="tli ${i<idx?'ok':i===idx?'on':''}">
     <b>${esc(s[1])}</b><p>${i<idx?'пройден':i===idx?'текущий этап':'впереди'}</p></div>`).join('')}</div>
   </div>
   <div class="pan"><h3>Автомобиль и история</h3>
    <div class="kv"><span>Автомобиль</span><b>${esc(l.car)}</b></div>
    <div class="kv"><span>Госномер</span><b class="mono">${esc(l.gn)}</b></div>
    <div class="kv"><span>Визитов в сервисе</span><b>${(l.id%4)+1}</b></div>
    <div class="kv"><span>Последний визит</span><b>${['12.09.2026','18.03.2026','02.09.2025','14.02.2025'][l.id%4]}</b></div>
    <div class="kv"><span>Следующее ТО</span><b>по регламенту, напоминание стоит</b></div>
    <h3 style="margin-top:14px">Что дальше делает менеджер</h3>
    <div class="li ${idx>=1?'':'n'}"><i>${idx>=1?'✓':'1'}</i><span>Ответить клиенту и уточнить симптомы</span></div>
    <div class="li ${idx>=2?'':'n'}"><i>${idx>=2?'✓':'2'}</i><span>Записать на свободный пост</span></div>
    <div class="li ${idx>=3?'':'n'}"><i>${idx>=3?'✓':'3'}</i><span>Принять машину, зафиксировать пробег и фото</span></div>
    <div class="li ${idx>=4?'':'n'}"><i>${idx>=4?'✓':'4'}</i><span>Согласовать смету в WhatsApp</span></div>
    <div class="li ${idx>=6?'':'n'}"><i>${idx>=6?'✓':'5'}</i><span>Собрать фотоотчёт и закрыть наряд</span></div>
    <div class="btns" style="margin-top:12px">
     <button class="bt p" onclick="closeM();openOrd('ЗН-1842')">Заказ-наряд</button>
     <button class="bt" onclick="closeM();go('book')">Сервисная книжка</button>
     <button class="bt" onclick="toast('Звонок идёт из карточки через вашу АТС, запись прикрепляется к заявке автоматически.')">Позвонить</button>
    </div>
   </div>
  </div>`)}

/* ====== ИНФРАСТРУКТУРА ====== */
function renderRoles(){
 const r=document.getElementById('roles');if(!r)return;
 r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')">
  <div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');
 if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');
}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){
 role=ROLES[k]?k:'Владелец';
 document.getElementById('gate').classList.add('hidden');
 document.getElementById('app').classList.remove('hidden');
 const s=document.getElementById('rsel');if(s)s.value=role;
 document.getElementById('me').textContent=ROLES[role].av;
 if(!allowed(cur))cur=ROLES[role].s[0];
 build();
 toast(`Вы вошли как «${role}» · ${ROLES[role].n}. Показаны только те разделы, которые нужны этой роли.`);
}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;
 if(!allowed(cur))cur=ROLES[role].s[0];build();
 toast(`Роль: ${role}. Разделов доступно: ${ROLES[role].s.length}. ${ROLES[role].note}.`)}
const ownerOf=k=>SECOF[k];
function buildRail(){
 const on=ownerOf(cur);
 document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>{
  const n=s.sub.filter(x=>allowed(x[0])).length;
  return `<div class="ri ${s.k===on?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')" title="${esc(s.n)}">
   <i>${s.ic}</i><span>${esc(s.n)}</span>${n>1?`<b class="cnt">${n}</b>`:''}</div>`}).join('');
}
function buildSub(){
 const on=ownerOf(cur),s=SEC.find(x=>x.k===on);if(!s)return;
 document.getElementById('sub').innerHTML=`<h4>${esc(s.n)}</h4>`+
  s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')+
  `<div class="shint"><b>${esc(role)}</b><br>${esc(ROLES[role].note)}</div>`;
}
function build(){buildRail();buildSub();render()}
function render(){
 const f=SC[cur]||SC.dash;
 document.getElementById('ttl').textContent=SUBN[cur]||'Пульт';
 document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('inbox')||allowed('funnel')?'':'none';
 try{history.replaceState(null,'','?s='+cur)}catch(e){}
}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права доступа.');return}
 cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){
 document.getElementById('mt').innerHTML=t;
 document.getElementById('ms').innerHTML=s;
 document.getElementById('mbody').innerHTML=b;
 document.getElementById('mbg').classList.add('show');
}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;
function toast(m){const t=document.getElementById('toast');
 t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),5600)}
function sparks(n){for(let i=0;i<n;i++){const s=document.createElement('i');s.className='spark';
 s.style.left=(14+Math.random()*72)+'vw';
 s.style.background=['#e31e24','#14202b','#9b9b9b','#2f8f5b'][i%4];
 s.style.borderRadius=i%2?'50%':'2px';
 s.style.animationDelay=(Math.random()*.4)+'s';document.body.appendChild(s);setTimeout(()=>s.remove(),1400)}}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();
 toast(theme==='dark'?'Тёмная тема — для вечерней смены и для проектора.':'Светлая тема.')}

/* ====== СЦЕНАРИЙ ПОКАЗА ====== */
const TOUR=[
 ['dash','Пульт владельца: выручка, загрузка постов и возвратность по всей сети. Это те самые «десять выжимок», ради которых не нужно приезжать в сервис.'],
 ['path','Путь клиента — двенадцать шагов от сообщения в WhatsApp до повторного визита через полгода. Нажимайте «Следующий шаг».'],
 ['funnel','Воронка из восьми этапов, которые вы описали. Карточки перетаскиваются мышью — этап меняется вместе с сообщением клиенту.'],
 ['orders','Заказ-наряд: работы по нормо-часам, запчасти со склада, механик и пост. Открывается из заявки, данные не вводятся заново.'],
 ['photo','Фотоотчёт: приборы, старые и новые детали, машина на подъёмнике. Без полного комплекта наряд не закрывается.'],
 ['book','Электронная сервисная книжка — заполняется сама из закрытого наряда. Подвигайте ползунок пробега.'],
 ['remind','Кому пора на ТО: 141 машина, из них 48 просрочены. Вот тот доход, который сегодня просто не забирается.'],
 ['wa','Два номера WhatsApp: официальный для диалогов, второй для рассылок. 5 000 ₸ в месяц вместо 36 000.'],
 ['ref','Реферальная программа по вашей схеме: 5% другу, 5% тому, кто привёл, три обслуживания. Включаем в стандартный пакет.'],
 ['branches','Филиальная сеть: общий пульт, разделённые базы, кабинет управляющего. Без этого третью точку не открыть.'],
 ['economy','И стоимость: 2 500 000 ₸, оплата 10 / 45 / 45, окупаемость считается на ваших цифрах.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;
 document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;
 if(ti>=TOUR.length){stopTour();toast('Сценарий показа закончен. Дальше можно листать разделы вручную — всё кликается.');return}
 const [k,m]=TOUR[ti];
 if(!allowed(k)){step();return}
 cur=k;build();toast(m);
 setTimeout(step,ti===0?5400:6600);
}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}

/* ====== СТАРТ ====== */
(function(){
 renderRoles();applyTheme();
 const s=document.getElementById('rsel');
 if(s)s.addEventListener('change',e=>switchRole(e.target.value));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){
  const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);
  if(r){cur=q;enter(r)}
 }
})();
