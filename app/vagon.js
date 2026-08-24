/* Система учёта ремонта вагонов — демо по ТЗ вер. 1.4. Данные вымышленные, суммы в тенге. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';

const ROLES={
 'Администратор':{n:'Администратор',av:'АД',note:'Заявки, вагоны, статусы, согласования, документы',s:['table','inbox','appr','docs','stock','depo','buh','settings']},
 'Руководитель':{n:'Руководитель',av:'РК',note:'Статистика, деньги, нормативы, цены, архив',s:['boss','table','fin','depo','stock','norms','archive']},
 'Бухгалтерия':{n:'Бухгалтерия',av:'БХ',note:'Только вагоны, переданные на АВР',s:['buh']},
 'Клиент':{n:'Клиент · собственник',av:'КЛ',note:'Свои вагоны, статусы, документы, согласования',s:['client']},
 'Мастер в депо':{n:'Мастер в депо',av:'МС',note:'Телефон: статус вагона и дефектная ведомость',s:['mobile']}
};
const NAV=[
 ['ОПЕРАТИВНАЯ РАБОТА',[['table','TBL','Вагоны · таблица'],['inbox','BOT','Заявки от бота',3],['appr','SOG','Согласования',2],['docs','DOC','Документы']]],
 ['РЕСУРСЫ',[['stock','SKL','Склад запчастей',1],['depo','DEP','Депо и загрузка'],['mobile','MOB','Мастер в депо']]],
 ['ДЕНЬГИ И КОНТРОЛЬ',[['boss','STA','Статистика'],['fin','FIN','Финансы'],['buh','AVR','Бухгалтерия · АВР',2],['client','LKK','Кабинет клиента']]],
 ['СИСТЕМА',[['norms','NRM','Нормативы и цены'],['archive','ARH','Архив'],['settings','SET','Настройки']]]
];
const TITLES={
 table:['Вагоны','Основная таблица: настраиваемые столбцы, цвет строки по статусу, подсветка просрочки'],
 inbox:['Заявки от бота','Письма с выделенного адреса: бот разобрал — администратор проверяет и принимает'],
 appr:['Согласования запчастей','Дорогие запчасти согласуются с клиентом; пока нет ответа — ремонт стоит'],
 docs:['Документы','Комплект по вагону: акт осмотра, ВУ-36, ВУ-23, ВУ-22, калькуляция депо, АВР, РДВ'],
 stock:['Склад запчастей','Номерной учёт: приход, расход на вагон, инвентаризация, остатки по депо'],
 depo:['Депо и загрузка','Десять ремонтных депо: сколько вагонов, сроки, цены и расчёты'],
 boss:['Статистика','Экран руководителя: в работе, отработано, просрочено, оплачено — за период'],
 fin:['Финансы','Оплата клиентом и оплата работы депо по каждому вагону; клиент этого не видит'],
 buh:['Бухгалтерия · АВР','Только вагоны, переданные администратором на составление АВР'],
 client:['Кабинет клиента','Что видит собственник: свои вагоны, статусы, документы, согласования'],
 mobile:['Мастер в депо','Телефон: смена статуса и дефектная ведомость с фото — без компьютера'],
 norms:['Нормативы и цены','Сроки ТОР / деповской / капитальный и цены — меняет руководитель'],
 archive:['Архив','Ошибочные вагоны не удаляются, а переносятся в архив с полной историей'],
 settings:['Настройки','Почта бота, срок доработки, цвета статусов, классификаторы, права ролей']
};
let role='Администратор',cur='table';

/* ===== СПРАВОЧНИКИ (ТЗ п.18) ===== */
const RODS=[['2','Крытый'],['4','Платформа'],['6','Полувагон'],['7','Цистерна'],['8','Изотермический']];
const rodByNo=no=>(RODS.find(r=>String(no)[0]===r[0])||['','Прочий'])[1];
const FAULTS={102:'Тонкий гребень',107:'Выщербина обода колеса',116:'Ползун на поверхности катания',157:'Грение буксового узла',205:'Излом пружины рессорного комплекта',214:'Трещина/излом боковой рамы',225:'Износ фрикционных планок',301:'Неисправность автосцепного устройства',305:'Неисправность поглощающего аппарата',912:'Повреждение кузова вагона'};
const STATIONS=['Астана-1','Караганда-Сортировочная','Экибастуз-1','Актобе','Кандыагаш','Шу','Арыс','Достык','Атырау','Жезказган'];
const OWNERS=['ТОО «Казтемiр-Логистик»','АО «Каспий Ойл Транс»','ТОО «Степной Экспресс»','ТОО «Alem Rail»','ТОО «KZ Wagon»'];
const DEPOS=[
 {n:'ВЧДР Астана',v:11,avg:6.2,pay:'по графику',debt:0},
 {n:'ВЧДР Караганда',v:9,avg:7.8,pay:'по графику',debt:1240000},
 {n:'ВЧДР Экибастуз',v:7,avg:6.9,pay:'просрочка 4 дн.',debt:860000},
 {n:'ВЧДР Актобе',v:5,avg:9.1,pay:'по графику',debt:0},
 {n:'ВЧДР Павлодар',v:4,avg:5.6,pay:'по графику',debt:410000},
 {n:'ВЧДР Атырау',v:4,avg:8.4,pay:'по графику',debt:0},
 {n:'ВЧДР Шу',v:3,avg:7.2,pay:'по графику',debt:0},
 {n:'ВЧДР Арыс',v:2,avg:6.0,pay:'по графику',debt:0},
 {n:'ВЧДР Кызылорда',v:2,avg:10.3,pay:'просрочка 9 дн.',debt:520000},
 {n:'ЧТО «Темир Сервис»',v:1,avg:5.0,pay:'по графику',debt:0}
];
/* Статусы (ТЗ п.5) — цвета настраиваемые (ТЗ п.3.2) */
let STATUS=[
 {k:'new',n:'Принят в работу',c:'#3b82f6'},
 {k:'rep',n:'В ремонте',c:'#f5a524'},
 {k:'appr',n:'Ожидает согласования',c:'#a855f7'},
 {k:'part',n:'Ожидаем запчасти от клиента',c:'#22d3ee'},
 {k:'out',n:'Выпущен из ремонта',c:'#22c55e'},
 {k:'rdy',n:'Готов',c:'#10b981'},
 {k:'fix',n:'Ожидает корректировки',c:'#ef4444'}
];
const ST=k=>STATUS.find(s=>s.k===k)||STATUS[0];
const REP=[['tor','ТОР',7],['dep','Деповской',10],['kap','Капитальный',15]];
let NORMS={tor:7,dep:10,kap:15};
let PRICES={tor:180000,dep:640000,kap:1450000};
let FIXDAYS=7; // срок подачи заявки на доработку (ТЗ п.11.1)
const repName=k=>(REP.find(r=>r[0]===k)||['','—'])[1];

/* ===== ВАГОНЫ ===== */
let CARS=[
 {no:'61294857',own:0,rep:'tor',st:'rep',got:'18.08.2026',days:6,fault:107,stn:1,depo:0,gl:'ГП-2026/418',gld:'18.08.2026',out:'',pc:0,pd:1,avr:0,sent:0,
  hist:[['new','Принят в работу','19.08.2026 09:14','Сергей А.'],['rep','В ремонте','19.08.2026 15:02','Сергей А.']],
  docs:{act:1},appr:[],parts:[]},
 {no:'74183920',own:1,rep:'dep',st:'appr',got:'14.08.2026',days:10,fault:205,stn:2,depo:2,gl:'ГП-2026/402',gld:'14.08.2026',out:'',pc:0,pd:0,avr:0,sent:0,
  hist:[['new','Принят в работу','14.08.2026 11:20','Сергей А.'],['rep','В ремонте','15.08.2026 08:40','Сергей А.'],['appr','Ожидает согласования','21.08.2026 16:10','Сергей А.']],
  docs:{act:1},appr:[{id:1,part:'Комплект пружин рессорного подвешивания',qty:4,price:96000,st:'wait',cr:'21.08.2026 16:10',act:'Акт браковки № 88 от 21.08',cmt:'Излом двух пружин, требуется замена комплекта'}],parts:[]},
 {no:'24765103',own:2,rep:'tor',st:'part',got:'12.08.2026',days:12,fault:301,stn:0,depo:0,gl:'ГП-2026/395',gld:'12.08.2026',out:'',pc:0,pd:0,avr:0,sent:0,
  hist:[['new','Принят в работу','12.08.2026 10:05','Сергей А.'],['rep','В ремонте','12.08.2026 14:30','Сергей А.'],['appr','Ожидает согласования','16.08.2026 09:12','Сергей А.'],['part','Ожидаем запчасти от клиента','18.08.2026 11:45','Сергей А.']],
  docs:{act:1},appr:[{id:2,part:'Автосцепка СА-3 в сборе',qty:1,price:310000,st:'own',cr:'16.08.2026 09:12',act:'Акт браковки № 79 от 16.08',cmt:'Клиент предоставляет свою автосцепку'}],parts:[],wait:'Автосцепка СА-3 — 1 шт., отгрузка из Караганды'},
 {no:'61330288',own:0,rep:'dep',st:'rep',got:'09.08.2026',days:15,fault:214,stn:3,depo:1,gl:'ГП-2026/388',gld:'09.08.2026',out:'',pc:0,pd:0,avr:0,sent:0,
  hist:[['new','Принят в работу','09.08.2026 08:50','Сергей А.'],['rep','В ремонте','09.08.2026 16:20','Сергей А.']],
  docs:{act:1},appr:[],parts:[]},
 {no:'42019876',own:3,rep:'tor',st:'out',got:'16.08.2026',days:8,fault:116,stn:5,depo:4,gl:'ГП-2026/409',gld:'16.08.2026',out:'22.08.2026',pc:0,pd:1,avr:0,sent:0,
  hist:[['new','Принят в работу','16.08.2026 09:30','Сергей А.'],['rep','В ремонте','16.08.2026 13:15','Сергей А.'],['out','Выпущен из ремонта','23.08.2026 10:02','Сергей А.']],
  docs:{act:1,vu36:1,vu23:1},appr:[],parts:[]},
 {no:'74556201',own:1,rep:'kap',st:'rdy',got:'02.08.2026',days:22,fault:912,stn:8,depo:5,gl:'ГП-2026/371',gld:'02.08.2026',out:'21.08.2026',pc:0,pd:1,avr:1,sent:1,rdyAt:'22.08.2026',
  hist:[['new','Принят в работу','02.08.2026 10:11','Сергей А.'],['rep','В ремонте','03.08.2026 09:00','Сергей А.'],['out','Выпущен из ремонта','21.08.2026 17:40','Сергей А.'],['rdy','Готов','22.08.2026 12:05','Сергей А.']],
  docs:{act:1,vu36:1,vu23:1,vu22:1,calc:1,avr:1,rdv:1},appr:[],parts:[]},
 {no:'61402993',own:4,rep:'tor',st:'rdy',got:'10.08.2026',days:14,fault:102,stn:6,depo:6,gl:'ГП-2026/390',gld:'10.08.2026',out:'19.08.2026',pc:1,pd:1,avr:1,sent:1,rdyAt:'20.08.2026',
  hist:[['new','Принят в работу','10.08.2026 09:05','Сергей А.'],['rep','В ремонте','10.08.2026 15:30','Сергей А.'],['out','Выпущен из ремонта','19.08.2026 16:00','Сергей А.'],['rdy','Готов','20.08.2026 10:20','Сергей А.']],
  docs:{act:1,vu36:1,vu23:1,vu22:1,calc:1,avr:1,rdv:1},appr:[],parts:[]},
 {no:'24880154',own:2,rep:'dep',st:'fix',got:'05.08.2026',days:19,fault:157,stn:4,depo:3,gl:'ГП-2026/378',gld:'05.08.2026',out:'20.08.2026',pc:0,pd:1,avr:1,sent:1,
  hist:[['new','Принят в работу','05.08.2026 08:30','Сергей А.'],['rep','В ремонте','05.08.2026 14:00','Сергей А.'],['out','Выпущен из ремонта','20.08.2026 15:10','Сергей А.'],['rdy','Готов','21.08.2026 09:40','Сергей А.'],['fix','Ожидает корректировки','23.08.2026 14:22','Сергей А.']],
  docs:{act:1,vu36:1,vu23:1,vu22:1,calc:1,avr:1},appr:[],parts:[],fixWhy:'В ВУ-23 указан неверный номер гарантийного письма — просим исправить и приложить заново.'},
 {no:'61775430',own:0,rep:'tor',st:'new',got:'23.08.2026',days:1,fault:107,stn:1,depo:0,gl:'ГП-2026/424',gld:'23.08.2026',out:'',pc:0,pd:0,avr:0,sent:0,
  hist:[['new','Принят в работу','23.08.2026 16:40','Сергей А.']],docs:{},appr:[],parts:[]},
 {no:'74902117',own:1,rep:'dep',st:'rep',got:'20.08.2026',days:4,fault:305,stn:7,depo:1,gl:'ГП-2026/419',gld:'20.08.2026',out:'',pc:0,pd:0,avr:0,sent:0,
  hist:[['new','Принят в работу','20.08.2026 09:55','Сергей А.'],['rep','В ремонте','20.08.2026 14:10','Сергей А.']],docs:{act:1},appr:[],parts:[]}
];
const isOver=c=>['out','rdy'].includes(c.st)?false:(c.st==='part'?false:c.days>NORMS[c.rep]);

/* ===== ЗАЯВКИ ОТ БОТА (ТЗ п.2) ===== */
let MAILS=[
 {id:1,from:'zayavki@kaspiy-oil.kz',subj:'Отцепка вагона 74338205 — ст. Кандыагаш',t:'сегодня 08:42',state:'ok',
  body:'Добрый день!\nПросим принять в ремонт вагон № 74338205.\nОтцеплен 23.08.2026 на ст. Кандыагаш.\nНеисправность: код 157 (грение буксового узла).\nСобственник: АО «Каспий Ойл Транс».\nГарантийное письмо прилагаем.',
  parsed:{no:'74338205',rod:'Цистерна',fault:157,stn:'Кандыагаш',own:'АО «Каспий Ойл Транс»',date:'23.08.2026'}},
 {id:2,from:'logistics@alemrail.kz',subj:'Заявка на ТОР — вагон 42887301',t:'сегодня 10:15',state:'ok',
  body:'Здравствуйте.\nВагон 42887301, ст. Арыс, дефект — ползун на поверхности катания (116).\nПросим выполнить текущий отцепочный ремонт.\nТОО «Alem Rail»',
  parsed:{no:'42887301',rod:'Платформа',fault:116,stn:'Арыс',own:'ТОО «Alem Rail»',date:'24.08.2026'}},
 {id:3,from:'d.serikov@kztl.kz',subj:'Re: вагоны на август',t:'сегодня 11:03',state:'bad',
  body:'Добрый день, коллеги!\nПо нашей переписке — вагон нужно посмотреть, номер уточню позже.\nСтанция как в прошлый раз.\nС уважением, Дамир',
  parsed:null},
 {id:4,from:'zayavki@kaspiy-oil.kz',subj:'Отцепка вагона 74183920',t:'сегодня 11:40',state:'dup',
  body:'Просим принять в ремонт вагон № 74183920, ст. Караганда-Сортировочная, код 205.',
  parsed:{no:'74183920',rod:'Цистерна',fault:205,stn:'Караганда-Сортировочная',own:'АО «Каспий Ойл Транс»',date:'24.08.2026'}}
];
let mailSeq=5;

/* ===== СКЛАД (добавлено по итогам встречи) ===== */
let PARTS=[
 {n:'Колёсная пара РУ1Ш-957-Г',num:'КП-0084512',yr:2021,q:1,st:'ok',loc:'ВЧДР Астана',price:820000,note:'толщина гребня 30 мм, обточена'},
 {n:'Колёсная пара РУ1Ш-957-Г',num:'КП-0084518',yr:2019,q:1,st:'ok',loc:'ВЧДР Астана',price:790000,note:'толщина гребня 28 мм'},
 {n:'Боковая рама 9758-01',num:'БР-118472',yr:2018,q:1,st:'ok',loc:'ВЧДР Караганда',price:640000,note:'клеймо завода, дефектоскопия пройдена'},
 {n:'Надрессорная балка 9758-02',num:'НБ-227105',yr:2020,q:1,st:'ok',loc:'ВЧДР Караганда',price:580000,note:''},
 {n:'Автосцепка СА-3 в сборе',num:'АС-40921',yr:2022,q:1,st:'res',loc:'ВЧДР Астана',price:310000,note:'зарезервирована под вагон 24765103'},
 {n:'Поглощающий аппарат ПМК-110А',num:'ПА-77310',yr:2021,q:1,st:'ok',loc:'ВЧДР Экибастуз',price:265000,note:''},
 {n:'Воздухораспределитель 483М',num:'ВР-51188',yr:2023,q:1,st:'ok',loc:'ВЧДР Астана',price:148000,note:''},
 {n:'Комплект пружин рессорного подвешивания',num:'—',yr:0,q:6,st:'low',loc:'ВЧДР Астана',price:96000,note:'⚠ ниже минимума (8 компл.) — заявка поставщику'},
 {n:'Тормозной цилиндр 188Б',num:'ТЦ-30442',yr:2022,q:1,st:'ok',loc:'ВЧДР Павлодар',price:112000,note:''},
 {n:'Фрикционные планки (комплект)',num:'—',yr:0,q:24,st:'ok',loc:'ВЧДР Астана',price:38000,note:''}
];
let MOVES=[
 {t:'Расход',what:'Колёсная пара КП-0084507',to:'вагон 61294857 · ТОР',d:'23.08.2026 14:20',who:'Сергей А.',sum:815000},
 {t:'Приход',what:'Колёсная пара КП-0084518 · 1 шт.',to:'от ТОО «КолесоСервис», накл. 2211',d:'22.08.2026 10:05',who:'Сергей А.',sum:790000},
 {t:'Расход',what:'Комплект пружин · 2 компл.',to:'вагон 61330288 · деповской',d:'21.08.2026 16:40',who:'Сергей А.',sum:192000},
 {t:'Инвентаризация',what:'ВЧДР Астана · 34 позиции',to:'расхождений нет',d:'20.08.2026 09:00',who:'Сергей А.',sum:0},
 {t:'Приход',what:'Автосцепка СА-3 · 1 шт.',to:'от АО «Каспий Ойл Транс» (запчасть клиента)',d:'19.08.2026 12:30',who:'Сергей А.',sum:0}
];

/* ===== СТОЛБЦЫ ТАБЛИЦЫ (ТЗ п.3.1) ===== */
let COLS=[
 {k:'no',n:'№ вагона',on:1,pin:1},{k:'rod',n:'Род',on:1,pin:0},{k:'own',n:'Собственник',on:1,pin:0},
 {k:'st',n:'Статус',on:1,pin:0},{k:'got',n:'Дата заявки',on:1,pin:0},{k:'days',n:'Дней в работе',on:1,pin:0},
 {k:'rep',n:'Вид ремонта',on:1,pin:0},{k:'fault',n:'Код / неисправность',on:1,pin:0},{k:'stn',n:'Станция отцепки',on:0,pin:0},
 {k:'depo',n:'Депо',on:1,pin:0},{k:'gl',n:'Гарант. письмо',on:0,pin:0},{k:'out',n:'Выпуск из ремонта',on:1,pin:0},
 {k:'appr',n:'Согласование',on:1,pin:0},{k:'avr',n:'АВР',on:1,pin:0},{k:'pc',n:'Оплата клиента',on:1,pin:0},{k:'pd',n:'Оплата депо',on:0,pin:0}
];
let filt={q:'',st:'all',over:0};

/* ===== ЭКРАНЫ ===== */
const SC={};
const stChip=k=>{const s=ST(k);return `<span class="st" style="--c:${s.c};background:${s.c}22;color:${s.c}"><i></i>${s.n}</span>`};

SC.table=()=>{
 let list=CARS.filter(c=>{
  const q=filt.q.toLowerCase();
  const hay=(c.no+' '+OWNERS[c.own]+' '+c.gl+' '+FAULTS[c.fault]+' '+STATIONS[c.stn]+' '+DEPOS[c.depo].n).toLowerCase();
  return (!q||hay.includes(q))&&(filt.st==='all'||c.st===filt.st)&&(!filt.over||isOver(c))});
 const on=COLS.filter(c=>c.on);
 const cell=(c,k)=>({
  no:`<b class="mono" style="font-size:11px">${c.no}</b>`,
  rod:rodByNo(c.no),
  own:`<span class="mini">${esc(OWNERS[c.own])}</span>`,
  st:stChip(c.st),
  got:`<span class="mono">${c.got}</span>`,
  days:`<b class="mono ${isOver(c)?'bad':''}">${c.days}</b><span class="mini"> / ${NORMS[c.rep]}</span>${c.st==='part'?'<div class="sub" style="color:#67e8f9">таймер остановлен</div>':''}`,
  rep:repName(c.rep),
  fault:`<b class="mono">${c.fault}</b><div class="sub">${FAULTS[c.fault]}</div>`,
  stn:STATIONS[c.stn],
  depo:`<span class="mini">${DEPOS[c.depo].n}</span>`,
  gl:`<span class="mono">${c.gl}</span><div class="sub">${c.gld}</div>`,
  out:c.out?`<span class="mono">${c.out}</span>`:'<span class="mini">—</span>',
  appr:c.appr.length?(c.appr.some(a=>a.st==='wait')?'<span class="tag violet">ждём ответ</span>':'<span class="tag green">решено</span>'):'<span class="mini">—</span>',
  avr:c.avr?'<span class="tag green">приложена</span>':(c.st==='rdy'||c.st==='out'?'<span class="tag amber">нужна</span>':'<span class="mini">—</span>'),
  pc:c.pc?'<span class="tag green">оплачено</span>':'<span class="tag red">не оплачено</span>',
  pd:c.pd?'<span class="tag green">оплачено</span>':'<span class="tag red">не оплачено</span>'
 }[k]);
 return `<div class="head"><div><h2>Вагоны · основная таблица</h2><p>Оперативный контроль: строка окрашена по статусу, просроченные подсвечены отдельно. Столбцы можно скрывать, закреплять и менять местами — настройка сохраняется за пользователем. Статус меняется только в карточке вагона.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Экспорт таблицы в Excel с текущими столбцами и фильтрами.')">Экспорт</button><button class="btn acc" onclick="go('inbox')">✉ Заявки от бота · 3</button></div></div>
 <div class="strip">
  <div><small>ВАГОНОВ В РАБОТЕ</small><b>${CARS.filter(c=>!['rdy'].includes(c.st)).length} из ${CARS.length}</b><span>показано ${list.length} по фильтру</span></div>
  <div><small>ПРОСРОЧЕНО</small><b class="bad">${CARS.filter(isOver).length}</b><span>сверх норматива вида ремонта</span></div>
  <div><small>ЖДУТ СОГЛАСОВАНИЯ</small><b class="warn">${CARS.filter(c=>c.st==='appr').length}</b><span>ремонт остановлен</span></div>
  <div><small>ГОТОВЫ</small><b class="good">${CARS.filter(c=>c.st==='rdy').length}</b><span>документы у клиента</span></div>
  <div><small>НЕ ОПЛАЧЕНО КЛИЕНТОМ</small><b>${CARS.filter(c=>!c.pc).length}</b><span>видно только вам</span></div>
 </div>
 <div class="filters">
  <input class="search" placeholder="Номер вагона, собственник, гарантийное письмо, станция, депо…" value="${esc(filt.q)}" oninput="filt.q=this.value;render();this.focus();this.setSelectionRange(this.value.length,this.value.length)">
  <button class="filter ${filt.st==='all'&&!filt.over?'on':''}" onclick="filt.st='all';filt.over=0;render()">Все</button>
  ${STATUS.map(s=>`<button class="filter ${filt.st===s.k?'on':''}" onclick="filt.st='${s.k}';filt.over=0;render()" style="${filt.st===s.k?`background:${s.c};border-color:${s.c};color:#0b0f14`:''}">${s.n}</button>`).join('')}
  <button class="filter ${filt.over?'on':''}" onclick="filt.over=filt.over?0:1;filt.st='all';render()" style="${filt.over?'background:var(--red);border-color:var(--red);color:#fff':''}">⚠ Просроченные</button>
 </div>
 <div class="panel">
  <div class="ph"><div><div class="ph-title">Настройка таблицы</div><div class="ph-sub">нажмите на столбец, чтобы скрыть или показать · 📌 — закрепить слева · настройка сохранится за вами</div></div><button class="btn" onclick="colsReset()">Сбросить</button></div>
  <div class="cols">${COLS.map(c=>`<button class="colchip ${c.on?'on':''} ${c.pin?'pin':''}" onclick="colToggle('${c.k}')">${c.on?'👁':'—'} ${c.n}${c.pin?' 📌':''}</button>`).join('')}</div>
  <div class="tw" style="max-height:520px">
  <table class="data" style="min-width:${on.length*130}px"><thead><tr>${on.map(c=>`<th>${c.n}</th>`).join('')}</tr></thead><tbody>
  ${list.map(c=>`<tr class="row-st ${isOver(c)?'over':''}" style="--c:${ST(c.st).c}" onclick="openCar('${c.no}')">${on.map(col=>`<td>${cell(c,col.k)}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${on.length}"><p class="mini" style="padding:14px">Ничего не найдено по фильтру.</p></td></tr>`}
  </tbody></table></div>
  <div class="hint"><b>Как в вашем ТЗ:</b> таблица — для оперативного контроля, а не копия карточки. Цвет строки зависит от статуса (цвета настраиваются), просрочка — не отдельный статус, а подсветка. Клик по строке открывает полную карточку вагона.</div>
 </div>`};
function colToggle(k){const c=COLS.find(x=>x.k===k);if(c.k==='no'){c.pin=c.pin?0:1;toast('Столбец «№ вагона» '+(c.pin?'закреплён слева':'откреплён')+'. Настройка сохранена за вашим пользователем.');return keepScroll()}
 c.on=c.on?0:1;keepScroll();toast(`Столбец «${c.n}» ${c.on?'показан':'скрыт'}. Данные не удаляются — только отображение.`)}
function colsReset(){COLS.forEach(c=>c.on=['no','rod','own','st','got','days','rep','fault','depo','out','appr','avr','pc'].includes(c.k)?1:0);keepScroll();toast('Настройка столбцов сброшена к стандартной.')}

/* ---- КАРТОЧКА ВАГОНА (ТЗ п.4) ---- */
let dCar=null,dTab=0;
function openCar(no,tab=0){const c=CARS.find(x=>x.no===no);if(!c)return;dCar=no;dTab=tab;
 const tabs=['Основное','Статус и история','Согласования','Документы','Финансы'];
 document.getElementById('dt').textContent='Вагон № '+c.no;
 document.getElementById('ds').innerHTML=`${rodByNo(c.no)} · ${esc(OWNERS[c.own])} · ${repName(c.rep)} · ${isOver(c)?'<b style="color:#f87171">просрочен</b>':'в норме'}`;
 document.getElementById('dtabs').innerHTML=tabs.map((t,i)=>`<button class="dtab ${i===tab?'on':''}" onclick="openCar('${no}',${i})">${t}</button>`).join('');
 document.getElementById('db').innerHTML=carBody(c,tab);
 document.getElementById('dbg').classList.add('show')}
function carBody(c,tab){
 if(tab===0)return `<div class="dg">
  <div class="det"><small>НОМЕР / РОД</small><b>${c.no} · ${rodByNo(c.no)}</b></div>
  <div class="det"><small>СОБСТВЕННИК</small><b>${esc(OWNERS[c.own])}</b></div>
  <div class="det"><small>ТЕКУЩИЙ СТАТУС</small><b>${stChip(c.st)}</b></div>
  <div class="det"><small>ДАТА ЗАЯВКИ</small><b>${c.got}</b></div>
  <div class="det"><small>ДНЕЙ В РАБОТЕ</small><b class="${isOver(c)?'bad':''}">${c.days} из ${NORMS[c.rep]} по нормативу</b></div>
  <div class="det"><small>ВИД РЕМОНТА</small><b>${repName(c.rep)}</b></div>
  <div class="det"><small>НЕИСПРАВНОСТЬ</small><b>${c.fault} · ${FAULTS[c.fault]}</b></div>
  <div class="det"><small>СТАНЦИЯ ОТЦЕПКИ</small><b>${STATIONS[c.stn]}</b></div>
  <div class="det"><small>ДЕПО РЕМОНТА</small><b>${DEPOS[c.depo].n}</b></div>
  <div class="det"><small>ГАРАНТИЙНОЕ ПИСЬМО</small><b>${c.gl} от ${c.gld}</b></div>
  <div class="det"><small>ВЫПУСК ИЗ РЕМОНТА</small><b>${c.out||'—'}</b></div>
  <div class="det"><small>ПЕРЕДАН В БУХГАЛТЕРИЮ</small><b>${c.sent?'да · АВР '+(c.avr?'приложена':'готовится'):'нет'}</b></div>
 </div>
 ${c.st==='part'?`<div class="note" style="--tone:#22d3ee"><b>Ожидаем запчасти от клиента</b><p>${esc(c.wait||'')} — на время этого статуса таймер нормативной просрочки остановлен, календарное время сохраняется в истории.</p></div>`:''}
 ${c.st==='fix'?`<div class="note" style="--tone:var(--red)"><b>Клиент вернул на доработку</b><p>${esc(c.fixWhy||'')}</p></div>`:''}
 ${isOver(c)?`<div class="note" style="--tone:var(--red)"><b>Просрочен на ${c.days-NORMS[c.rep]} дн.</b><p>Норматив для «${repName(c.rep)}» — ${NORMS[c.rep]} дней с даты заявки. Просрочка не является отдельным статусом: строка просто подсвечивается в таблице.</p></div>`:''}
 <div class="btns" style="margin-top:12px">
  <button class="btn acc" onclick="openCar('${c.no}',1)">Изменить статус</button>
  <button class="btn violet" onclick="openCar('${c.no}',2)">Согласование запчасти</button>
  <button class="btn" onclick="openCar('${c.no}',3)">Документы</button>
  ${c.st==='rdy'&&!c.sent?`<button class="btn green" onclick="toBuh('${c.no}')">→ Передать в бухгалтерию на АВР</button>`:''}
 </div>`;
 if(tab===1)return `<div class="ph-title" style="margin-bottom:8px">Изменить статус</div>
  <p class="mini" style="margin-bottom:9px">Статус меняет только администратор и только здесь — из таблицы изменить нельзя. Каждое изменение пишется в историю с датой, временем и пользователем.</p>
  ${STATUS.map(s=>`<button class="stbtn ${c.st===s.k?'cur':''}" style="--c:${s.c}" onclick="setSt('${c.no}','${s.k}')"><i></i>${s.n}${c.st===s.k?' · текущий':''}</button>`).join('')}
  <div class="ph-title" style="margin:14px 0 9px">История изменения статусов</div>
  <div class="tl">${[...c.hist].reverse().map(h=>`<div class="tli" style="--c:${ST(h[0]).c}"><b>${esc(h[1])}</b><p>Пользователь: ${esc(h[3])}</p><time>${h[2]}</time></div>`).join('')}</div>
  <div class="note" style="--tone:var(--acc)"><b>Историю нельзя редактировать или удалять</b><p>Для статуса «Выпущен из ремонта» отдельно хранится фактическая дата выпуска (по ВУ-36), которую указал администратор, и отдельно — дата и время внесения записи в систему.</p></div>`;
 if(tab===2)return `<div class="btns" style="margin-bottom:11px"><button class="btn acc" onclick="newAppr('${c.no}')">+ Создать согласование</button></div>
  ${c.appr.length?c.appr.map(a=>`<div class="panel" style="margin-bottom:8px">
   <div class="ph"><div><div class="ph-title">${esc(a.part)}</div><div class="ph-sub">${a.qty} шт. × ${tg(a.price)} = <b>${tg(a.qty*a.price)}</b> · создано ${a.cr}</div></div>
   ${a.st==='wait'?'<span class="tag violet">ждём ответ клиента</span>':a.st==='ok'?'<span class="tag green">согласовано</span>':a.st==='own'?'<span class="tag cyan">запчасть клиента</span>':'<span class="tag red">отказ</span>'}</div>
   <div class="mini">Основание: ${esc(a.act)}<br>Комментарий: ${esc(a.cmt)}</div>
   ${a.st==='wait'?`<div class="note" style="--tone:var(--amber)"><b>Напоминания клиенту</b><p>Ответа нет более 2 суток — система напоминает клиенту ежедневно, вы получаете уведомление о просроченном согласовании.</p></div>
   <div class="btns" style="margin-top:9px"><button class="btn green" onclick="apprAns('${c.no}',${a.id},'ok')">Клиент согласовал</button><button class="btn" onclick="apprAns('${c.no}',${a.id},'own')">Даёт свою запчасть</button><button class="btn red" onclick="apprAns('${c.no}',${a.id},'no')">Отказ</button></div>`:''}
  </div>`).join(''):'<p class="mini">По этому вагону согласований не было.</p>'}
  <div class="hint"><b>По ТЗ:</b> одно согласование может содержать несколько позиций, а по одному вагону может быть несколько согласований. Вся история сохраняется: запчасть, количество, цена, акт, предложение, ответ клиента с датой и временем, комментарии и документы.</div>`;
 if(tab===3){const D=[['act','Первичный акт осмотра'],['vu36','ВУ-36'],['vu23','ВУ-23'],['calc','Калькуляция от депо'],['vu22','ВУ-22'],['avr','АВР от бухгалтерии'],['rdv','РДВ']];
  const has=D.filter(d=>c.docs[d[0]]).length;
  return `<div class="ph"><div><div class="ph-title">Обязательный комплект · ${has} из ${D.length}</div><div class="ph-sub">контрольный список — он не блокирует перевод вагона в «Готов»</div></div></div>
  <div class="bar" style="margin-bottom:10px"><i style="--w:${has/D.length*100}%;--tone:var(--green)"></i></div>
  ${D.map(d=>`<div class="doc ${c.docs[d[0]]?'done':''}"><i onclick="docToggle('${c.no}','${d[0]}')">${c.docs[d[0]]?'✓':''}</i><span>${d[1]}</span><time>${c.docs[d[0]]?'загружен':'не загружен'}</time></div>`).join('')}
  <div class="btns" style="margin-top:11px"><button class="btn" onclick="toast('Дополнительный документ добавлен: название, комментарий и файл — список не ограничен.')">+ Ситуационный документ</button><button class="btn" onclick="toast('Фото и видео прикреплены к карточке вагона.')">+ Фото / видео</button></div>
  <div class="note" style="--tone:var(--acc)"><b>Файл гарантийного письма не загружаем</b><p>Как в ТЗ: в системе хранятся только номер и дата гарантийного письма.</p></div>`}
 return `<div class="dg" style="grid-template-columns:1fr 1fr">
  <div class="det"><small>ОПЛАТА КЛИЕНТОМ</small><b>${c.pc?'<span class="tag green">оплачено</span>':'<span class="tag red">не оплачено</span>'}</b></div>
  <div class="det"><small>ОПЛАТА РАБОТЫ ДЕПО</small><b>${c.pd?'<span class="tag green">оплачено</span>':'<span class="tag red">не оплачено</span>'}</b></div>
  <div class="det"><small>ЦЕНА ПО ВИДУ РЕМОНТА</small><b>${tg(PRICES[c.rep])}</b></div>
  <div class="det"><small>СОГЛАСОВАННЫЕ ЗАПЧАСТИ</small><b>${tg(c.appr.filter(a=>a.st==='ok').reduce((s,a)=>s+a.qty*a.price,0))}</b></div>
 </div>
 <div class="btns"><button class="btn ${c.pc?'':'green'}" onclick="payToggle('${c.no}','pc')">${c.pc?'Снять отметку оплаты клиента':'Отметить оплату клиента'}</button>
 <button class="btn ${c.pd?'':'green'}" onclick="payToggle('${c.no}','pd')">${c.pd?'Снять отметку оплаты депо':'Отметить оплату депо'}</button></div>
 <div class="note" style="--tone:var(--red)"><b>Клиент этого не видит</b><p>Внутренняя финансовая информация доступна только администратору и руководителю: оплата клиентом, оплата работы депо, цены и внутренние комментарии.</p></div>`}
function setSt(no,k){const c=CARS.find(x=>x.no===no);const old=ST(c.st).n;
 if(k==='out'){const d=prompt('Фактическая дата выпуска из ремонта (по ВУ-36), можно задним числом:','23.08.2026');if(!d)return;c.out=d}
 if(k==='part'&&!c.wait)c.wait='Запчасть клиента — ожидаем поставку';
 c.st=k;c.hist.push([k,ST(k).n,'сейчас · '+new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}),'Сергей А.']);
 if(k==='rdy')c.rdyAt='сегодня';
 openCar(no,1);render();
 toast(`Вагон <b>${no}</b>: «${old}» → «<b>${ST(k).n}</b>». Запись добавлена в историю, цвет строки в таблице обновлён${k==='part'?', таймер просрочки остановлен':''}${k==='rdy'?`, клиенту открылись документы и пошёл срок ${FIXDAYS} дн. на доработку`:''}.`)}
function docToggle(no,k){const c=CARS.find(x=>x.no===no);c.docs[k]=c.docs[k]?0:1;openCar(no,3);
 toast(c.docs[k]?'Документ загружен — сохранены дата, время и пользователь.':'Отметка снята.')}
function payToggle(no,k){const c=CARS.find(x=>x.no===no);c[k]=c[k]?0:1;openCar(no,4);render();
 toast(k==='pc'?(c.pc?'Отмечена оплата клиентом.':'Отметка оплаты клиента снята.'):(c.pd?'Отмечена оплата работы депо.':'Отметка оплаты депо снята.'))}
function toBuh(no){const c=CARS.find(x=>x.no===no);c.sent=1;closeD();render();sparks();
 toast(`Вагон <b>${no}</b> передан в бухгалтерию на составление АВР. Основной статус ремонта не изменился, бухгалтер получил уведомление.`)}
function newAppr(no){const c=CARS.find(x=>x.no===no);
 openD('Новое согласование · вагон '+no,'Дорогая запчасть — ремонт встанет до ответа клиента',['Согласование'],
 `<div class="fld"><small>НАИМЕНОВАНИЕ ЗАПЧАСТИ</small><input id="apName" value="Колёсная пара РУ1Ш-957-Г"></div>
  <div class="f3"><div class="fld"><small>КОЛИЧЕСТВО</small><input id="apQty" value="1"></div>
  <div class="fld"><small>ЦЕНА ЗА ЕД., ₸</small><input id="apPrice" value="820000"></div>
  <div class="fld"><small>ПОСТАВКА</small><select id="apSup"><option>Наша поставка со склада</option><option>Закуп у поставщика</option><option>Запчасть клиента</option></select></div></div>
  <div class="fld"><small>АКТ, ПОДТВЕРЖДАЮЩИЙ НЕОБХОДИМОСТЬ ЗАМЕНЫ / БРАК</small><input id="apAct" value="Акт браковки № 91 от 24.08.2026"></div>
  <div class="fld"><small>КОММЕНТАРИЙ КЛИЕНТУ</small><textarea id="apCmt" rows="2">Толщина гребня ниже нормы, требуется замена колёсной пары.</textarea></div>
  <div class="note" style="--tone:var(--violet)"><b>Что произойдёт после создания</b><p>Вагон получит статус «Ожидает согласования», клиент получит уведомление в кабинете, ремонт до ответа не продолжается. Через 2 суток без ответа — ежедневные напоминания клиенту и уведомление вам.</p></div>
  <div class="btns" style="margin-top:11px"><button class="btn acc" onclick="saveAppr('${no}')">Создать и отправить клиенту</button><button class="btn" onclick="closeD()">Отмена</button></div>`)}
function saveAppr(no){const c=CARS.find(x=>x.no===no);
 c.appr.push({id:Date.now(),part:document.getElementById('apName').value,qty:+document.getElementById('apQty').value||1,
  price:+document.getElementById('apPrice').value||0,st:'wait',cr:'сейчас',act:document.getElementById('apAct').value,cmt:document.getElementById('apCmt').value});
 c.st='appr';c.hist.push(['appr','Ожидает согласования','сейчас','Сергей А.']);
 openCar(no,2);render();
 toast(`Согласование создано и отправлено клиенту. Вагон <b>${no}</b> переведён в «Ожидает согласования» — ремонт остановлен до ответа.`)}
function apprAns(no,id,ans){const c=CARS.find(x=>x.no===no);const a=c.appr.find(x=>x.id===id);a.st=ans;
 if(ans==='ok'){c.st='rep';c.hist.push(['rep','В ремонте','сейчас','Сергей А.'])}
 if(ans==='own'){c.st='part';c.wait=a.part+' — '+a.qty+' шт., ожидаем от клиента';c.hist.push(['part','Ожидаем запчасти от клиента','сейчас','Сергей А.'])}
 if(ans==='no'){c.st='rep';c.hist.push(['rep','В ремонте','сейчас','Сергей А.'])}
 openCar(no,2);render();
 toast(ans==='ok'?'Клиент согласовал — вагон вернулся «В ремонте», запчасть зарезервирована на складе.':ans==='own'?'Клиент предоставляет свою запчасть — статус «Ожидаем запчасти от клиента», <b>таймер просрочки остановлен</b>.':'Клиент отказался — ремонт продолжается без этой позиции, решение сохранено в истории.')}

/* ---- ЗАЯВКИ ОТ БОТА ---- */
SC.inbox=()=>`
 <div class="head"><div><h2>Заявки от бота</h2><p>Один выделенный адрес <b class="mono">remont@vagon-service.kz</b> — бот следит за ящиком, разбирает письма по классификаторам и складывает сюда. Обработанные письма помнит, дубли не создаёт, после простоя догоняет пропущенное.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Журнал бота: обработано 486 писем за месяц, 12 не распознано, 9 дублей.')">Журнал бота</button><button class="btn acc" onclick="simMail()">✉ Симулировать письмо</button></div></div>
 <div class="strip">
  <div><small>ЗА СУТКИ</small><b>12 писем</b><span>распознано 9 · дублей 2 · ошибок 1</span></div>
  <div><small>ЖДУТ ПРИЁМКИ</small><b>${MAILS.filter(m=>m.state==='ok').length}</b><span>проверить и принять</span></div>
  <div><small>НЕ РАСПОЗНАНО</small><b class="bad">${MAILS.filter(m=>m.state==='bad').length}</b><span>завести вручную</span></div>
  <div><small>ПОВТОРНЫЕ</small><b class="warn">${MAILS.filter(m=>m.state==='dup').length}</b><span>вагон уже в работе</span></div>
  <div><small>СРЕДНЕЕ ВРЕМЯ РАЗБОРА</small><b>4 сек</b><span>от письма до заявки</span></div>
 </div>
 <div id="mailList">${MAILS.map(mailRow).join('')||'<div class="panel"><p class="mini">Новых писем нет — все заявки приняты.</p></div>'}</div>
 <div class="hint"><b>Три случая из вашего ТЗ отработаны:</b> заявка распознана → администратор принимает одним нажатием; письмо не распознано → уведомление и ручное заведение карточки; вагон уже в системе → дубликат не создаётся, приходит уведомление о повторной заявке.</div>`;
function mailRow(m){return `<div class="mail ${m.fresh?'fresh':''}">
 <div class="mail-h"><div><b>${esc(m.subj)}</b><div class="sub mono">${esc(m.from)} · ${m.t}</div></div>
 ${m.state==='ok'?'<span class="tag green">бот разобрал</span>':m.state==='bad'?'<span class="tag red">не распознано</span>':'<span class="tag amber">повторная заявка</span>'}</div>
 <div class="mailbody">${esc(m.body)}</div>
 ${m.parsed?`<div class="parsed">
  <div class="pf ok"><small>№ ВАГОНА</small><b class="mono">${m.parsed.no}</b></div>
  <div class="pf ok"><small>РОД ВАГОНА</small><b>${m.parsed.rod}</b></div>
  <div class="pf ok"><small>КОД / НЕИСПРАВНОСТЬ</small><b>${m.parsed.fault} · ${FAULTS[m.parsed.fault]}</b></div>
  <div class="pf ok"><small>СТАНЦИЯ ОТЦЕПКИ</small><b>${m.parsed.stn}</b></div>
  <div class="pf ok"><small>СОБСТВЕННИК</small><b style="font-size:9px">${esc(m.parsed.own)}</b></div>
  <div class="pf ok"><small>ДАТА ЗАЯВКИ</small><b>${m.parsed.date}</b></div>
 </div>`:'<div class="note" style="--tone:var(--red)"><b>Бот не смог разобрать письмо</b><p>Нет номера вагона и станции. Администратор получил уведомление — карточку можно завести вручную.</p></div>'}
 <div class="btns" style="margin-top:10px">
  ${m.state==='ok'?`<button class="btn acc" onclick="accept(${m.id})">✓ Принять заявку</button><button class="btn" onclick="toast('Поля заявки можно поправить до принятия — бот подставил их по классификаторам.')">Исправить данные</button>`:''}
  ${m.state==='bad'?`<button class="btn acc" onclick="toast('Открыта форма ручного создания карточки вагона на основании письма.')">Завести вручную</button>`:''}
  ${m.state==='dup'?`<button class="btn" onclick="openCar('74183920')">Открыть карточку вагона 74183920</button><button class="btn" onclick="dropMail(${m.id})">Отметить обработанным</button>`:''}
 </div></div>`}
function accept(id){const m=MAILS.find(x=>x.id===id);if(!m)return;
 const own=OWNERS.findIndex(o=>o===m.parsed.own);
 CARS.unshift({no:m.parsed.no,own:own<0?0:own,rep:'tor',st:'new',got:m.parsed.date,days:1,fault:m.parsed.fault,
  stn:Math.max(0,STATIONS.indexOf(m.parsed.stn)),depo:0,gl:'ГП-2026/'+(425+Math.floor(CARS.length)),gld:m.parsed.date,out:'',pc:0,pd:0,avr:0,sent:0,
  hist:[['new','Принят в работу','сейчас','Сергей А.']],docs:{},appr:[],parts:[]});
 MAILS=MAILS.filter(x=>x.id!==id);
 const nb=NAV[0][1].find(x=>x[0]==='inbox');if(nb)nb[3]=MAILS.filter(m=>m.state!=='done').length||'';
 buildNav();document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('on',x.dataset.go===cur));
 render();sparks();
 toast(`Заявка принята: создана карточка вагона <b>${m.parsed.no}</b>, вагон появился в основной таблице и стал доступен клиенту. Дата заявки ${m.parsed.date} сохранена как точка отсчёта дней в работе.`)}
function dropMail(id){MAILS=MAILS.filter(x=>x.id!==id);render();toast('Письмо отмечено обработанным — повторная карточка не создавалась.')}
function simMail(){const m={id:mailSeq++,from:'zayavki@stepnoy-exp.kz',subj:'Отцепка вагона 61558402 — ст. Экибастуз-1',t:'только что',state:'ok',fresh:1,
 body:'Добрый день!\nПросим принять в ремонт полувагон № 61558402.\nОтцеплен 24.08.2026 на ст. Экибастуз-1.\nКод неисправности 214 — трещина боковой рамы.\nТОО «Степной Экспресс»',
 parsed:{no:'61558402',rod:'Полувагон',fault:214,stn:'Экибастуз-1',own:'ТОО «Степной Экспресс»',date:'24.08.2026'}};
 MAILS.unshift(m);
 const nb=NAV[0][1].find(x=>x[0]==='inbox');if(nb)nb[3]=MAILS.length;
 if(cur!=='inbox'&&ROLES[role].s.includes('inbox'))go('inbox');else render();
 buildNav();document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('on',x.dataset.go===cur));
 sparks();
 toast('✉ <b>Письмо пришло на выделенный адрес.</b> Бот за 4 секунды разобрал его: номер вагона → род по классификатору, код 214 → «трещина боковой рамы», станция и собственник. Осталось нажать «Принять заявку».');
 setTimeout(()=>{delete m.fresh},2600)}

/* ---- СОГЛАСОВАНИЯ (общий экран) ---- */
SC.appr=()=>{const all=[];CARS.forEach(c=>c.appr.forEach(a=>all.push({c,a})));
 return `<div class="head"><div><h2>Согласования запчастей</h2><p>Пока клиент не ответил — ремонт вагона не продолжается. Нет ответа более 2 суток: система ежедневно напоминает клиенту, вы получаете уведомление о просрочке.</p></div></div>
 <div class="strip">
  <div><small>ОТКРЫТЫХ СОГЛАСОВАНИЙ</small><b>${all.filter(x=>x.a.st==='wait').length}</b><span>ремонт по ним остановлен</span></div>
  <div><small>ПРОСРОЧЕНО СВЫШЕ 2 СУТОК</small><b class="bad">1</b><span>напоминания идут ежедневно</span></div>
  <div><small>СУММА НА СОГЛАСОВАНИИ</small><b>${tg(all.filter(x=>x.a.st==='wait').reduce((s,x)=>s+x.a.qty*x.a.price,0))}</b><span>по открытым позициям</span></div>
  <div><small>СОГЛАСОВАНО ЗА МЕСЯЦ</small><b>18</b><span>средний ответ 1,6 суток</span></div>
  <div><small>СВОИ ЗАПЧАСТИ КЛИЕНТА</small><b>4</b><span>таймер остановлен</span></div>
 </div>
 <div class="panel"><div class="tw"><table class="data" style="min-width:820px"><thead><tr><th>Вагон</th><th>Собственник</th><th>Запчасть</th><th class="right">Кол-во</th><th class="right">Сумма</th><th>Основание</th><th>Создано</th><th>Ответ клиента</th></tr></thead><tbody>
 ${all.map(({c,a})=>`<tr onclick="openCar('${c.no}',2)"><td class="mono"><b>${c.no}</b></td><td class="mini">${esc(OWNERS[c.own])}</td>
  <td><b>${esc(a.part)}</b></td><td class="right mono">${a.qty}</td><td class="right mono"><b>${tg(a.qty*a.price)}</b></td>
  <td class="mini">${esc(a.act)}</td><td class="mono">${a.cr}</td>
  <td>${a.st==='wait'?'<span class="tag violet">ждём · напоминаем</span>':a.st==='ok'?'<span class="tag green">согласовано</span>':a.st==='own'?'<span class="tag cyan">своя запчасть</span>':'<span class="tag red">отказ</span>'}</td></tr>`).join('')}
 </tbody></table></div>
 <div class="hint"><b>История не теряется:</b> по каждому согласованию сохраняются дата и время создания, запчасть, количество, цена, акт браковки, предложение администратора, ответ клиента с датой и временем, его комментарий, приложенные документы и итоговое решение.</div></div>`};

/* ---- ДОКУМЕНТЫ ---- */
SC.docs=()=>{const D=[['act','Первичный акт осмотра'],['vu36','ВУ-36'],['vu23','ВУ-23'],['calc','Калькуляция от депо'],['vu22','ВУ-22'],['avr','АВР от бухгалтерии'],['rdv','РДВ']];
 const rel=CARS.filter(c=>['out','rdy','fix'].includes(c.st));
 return `<div class="head"><div><h2>Документы</h2><p>Комплект собирается после выпуска из ремонта. Перечень — контрольный список: он показывает, чего не хватает, но не блокирует перевод вагона в «Готов».</p></div></div>
 <div class="strip">
  <div><small>ВАГОНОВ С ДОКУМЕНТАМИ</small><b>${rel.length}</b><span>выпущены / готовы / на корректировке</span></div>
  <div><small>КОМПЛЕКТ СОБРАН</small><b class="good">${rel.filter(c=>D.every(d=>c.docs[d[0]])).length}</b><span>все 7 документов</span></div>
  <div><small>НЕ ХВАТАЕТ ДОКУМЕНТОВ</small><b class="warn">${rel.filter(c=>!D.every(d=>c.docs[d[0]])).length}</b><span>видно построчно</span></div>
  <div><small>ФОТО И ВИДЕО</small><b>146</b><span>привязаны к вагонам</span></div>
  <div><small>ХРАНЕНИЕ</small><b>с историей</b><span>дата, время, пользователь</span></div>
 </div>
 <div class="panel"><div class="tw"><table class="data" style="min-width:${240+D.length*90}px"><thead><tr><th>Вагон · собственник</th><th>Статус</th>${D.map(d=>`<th>${d[1]}</th>`).join('')}<th>Готовность</th></tr></thead><tbody>
 ${rel.map(c=>{const has=D.filter(d=>c.docs[d[0]]).length;
  return `<tr onclick="openCar('${c.no}',3)"><td><b class="mono">${c.no}</b><div class="sub">${esc(OWNERS[c.own])}</div></td><td>${stChip(c.st)}</td>
  ${D.map(d=>`<td style="text-align:center">${c.docs[d[0]]?'<span style="color:#4ade80">✓</span>':'<span style="color:#5d7186">—</span>'}</td>`).join('')}
  <td><b class="mono ${has===D.length?'good':'warn'}">${has}/${D.length}</b></td></tr>`}).join('')}
 </tbody></table></div>
 <div class="hint"><b>Дополнительно:</b> к любому вагону можно приложить ситуационные документы (название, комментарий, файл) без ограничений списка, а также фотографии и видеозаписи с осмотра.</div></div>`};

/* ---- СКЛАД (по итогам встречи) ---- */
SC.stock=()=>`
 <div class="head"><div><h2>Склад запчастей</h2><p>Добавлено по итогам встречи: номерной учёт узлов — у каждой колёсной пары, боковой рамы и автосцепки свой номер, год и история. Расход всегда привязан к конкретному вагону, поэтому себестоимость ремонта считается точно.</p></div>
 <div class="btns"><button class="btn" onclick="stForm('Приход')">+ Приход</button><button class="btn" onclick="stForm('Расход')">− Расход на вагон</button><button class="btn acc" onclick="stInv()">Инвентаризация</button></div></div>
 <div class="strip">
  <div><small>НОМЕРНЫХ УЗЛОВ</small><b>${PARTS.filter(p=>p.num!=='—').length} шт.</b><span>колёсные пары, рамы, автосцепки</span></div>
  <div><small>СТОИМОСТЬ ОСТАТКОВ</small><b>${tg(PARTS.reduce((s,p)=>s+p.price*p.q,0))}</b><span>по 4 депо</span></div>
  <div><small>НИЖЕ МИНИМУМА</small><b class="bad">${PARTS.filter(p=>p.st==='low').length}</b><span>заявка поставщику сформирована</span></div>
  <div><small>ЗАРЕЗЕРВИРОВАНО</small><b class="warn">${PARTS.filter(p=>p.st==='res').length}</b><span>под согласованные вагоны</span></div>
  <div><small>ИНВЕНТАРИЗАЦИЯ</small><b>20.08.2026</b><span>расхождений нет</span></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph"><div><div class="ph-title">Остатки · номерной учёт</div><div class="ph-sub">каждый узел — отдельная строка со своим номером и историей</div></div></div>
   <div class="tw"><table class="data" style="min-width:700px"><thead><tr><th>Наименование</th><th>Номер узла</th><th class="right">Год</th><th class="right">Кол-во</th><th>Депо хранения</th><th class="right">Цена</th><th>Состояние</th></tr></thead><tbody>
   ${PARTS.map((p,i)=>`<tr onclick="partCard(${i})"><td><b>${esc(p.n)}</b>${p.note?`<div class="sub">${esc(p.note)}</div>`:''}</td>
    <td class="pnum">${p.num}</td><td class="right mono">${p.yr||'—'}</td><td class="right mono"><b>${p.q}</b></td>
    <td class="mini">${p.loc}</td><td class="right mono">${tg(p.price)}</td>
    <td>${p.st==='low'?'<span class="tag red">заказать</span>':p.st==='res'?'<span class="tag amber">резерв</span>':'<span class="tag green">на складе</span>'}</td></tr>`).join('')}
   </tbody></table></div>
   <div class="hint"><b>Зачем номерной учёт:</b> при постановке колёсной пары на вагон в системе остаётся, какой именно узел куда ушёл — с номером, годом и актом. Это закрывает вопросы по гарантии и претензиям депо.</div>
  </div>
  <div class="panel"><div class="ph-title">Движение по складу</div>
   ${MOVES.map(m=>`<div style="display:flex;gap:9px;padding:9px 0;border-bottom:1px solid var(--line)">
    <span class="mono" style="width:44px;height:26px;background:var(--panel2);display:grid;place-items:center;font-size:6.6px;font-weight:700;flex:none;border-radius:7px;color:${m.t==='Приход'?'#4ade80':m.t==='Расход'?'#fbbf24':'#93b8f8'}">${m.t.toUpperCase().slice(0,6)}</span>
    <div style="flex:1"><b style="font-size:9.8px">${esc(m.what)}</b><p class="mini" style="margin:2px 0 0">${esc(m.to)}</p><p class="mini" style="margin:2px 0 0;color:var(--muted2)">${m.d} · ${m.who}</p></div>
    ${m.sum?`<b class="mono" style="font-size:9.4px;white-space:nowrap">${tg(m.sum)}</b>`:''}</div>`).join('')}
  </div>
 </div>`;
function partCard(i){const p=PARTS[i];
 openD(p.n,`${p.num!=='—'?'Номер узла '+p.num+' · ':''}${p.yr||'—'} г. · ${p.loc}`,['Узел'],
 `<div class="dg" style="grid-template-columns:1fr 1fr">
  <div class="det"><small>НОМЕР</small><b class="mono">${p.num}</b></div>
  <div class="det"><small>ГОД</small><b>${p.yr||'—'}</b></div>
  <div class="det"><small>КОЛИЧЕСТВО</small><b>${p.q}</b></div>
  <div class="det"><small>ЦЕНА</small><b>${tg(p.price)}</b></div>
 </div>
 ${p.note?`<div class="note" style="--tone:var(--acc)"><b>Отметка</b><p>${esc(p.note)}</p></div>`:''}
 <div class="ph-title" style="margin:12px 0 8px">История узла</div>
 <div class="tl">
  <div class="tli"><b>Поступил на склад</b><p>Накладная от поставщика, дефектоскопия пройдена</p><time>22.08.2026</time></div>
  ${p.st==='res'?'<div class="tli" style="--c:#f59e0b"><b>Зарезервирован</b><p>Под согласованное с клиентом решение по вагону 24765103</p><time>23.08.2026</time></div>':''}
 </div>
 <div class="btns" style="margin-top:11px"><button class="btn acc" onclick="closeD();stForm('Расход')">Списать на вагон</button><button class="btn" onclick="closeD()">Закрыть</button></div>`)}
function stForm(t){openD(t==='Приход'?'Приход на склад':'Расход на вагон',t==='Приход'?'Поступление узлов и материалов':'Списание узла на конкретный вагон',[t],
 t==='Приход'?`<div class="f2"><div class="fld"><small>НАИМЕНОВАНИЕ</small><input value="Колёсная пара РУ1Ш-957-Г"></div><div class="fld"><small>НОМЕР УЗЛА</small><input value="КП-0084525"></div></div>
  <div class="f3"><div class="fld"><small>ГОД</small><input value="2022"></div><div class="fld"><small>КОЛИЧЕСТВО</small><input value="1"></div><div class="fld"><small>ЦЕНА, ₸</small><input value="835000"></div></div>
  <div class="f2"><div class="fld"><small>ДЕПО ХРАНЕНИЯ</small><select>${DEPOS.map(d=>`<option>${d.n}</option>`).join('')}</select></div><div class="fld"><small>ДОКУМЕНТ</small><input value="Накладная № 2214 от 24.08.2026"></div></div>
  <div class="btns" style="margin-top:11px"><button class="btn acc" onclick="stSave('Приход')">Оприходовать</button><button class="btn" onclick="closeD()">Отмена</button></div>`
 :`<div class="f2"><div class="fld"><small>УЗЕЛ СО СКЛАДА</small><select id="stPart">${PARTS.map((p,i)=>`<option value="${i}">${p.n}${p.num!=='—'?' · '+p.num:''}</option>`).join('')}</select></div>
   <div class="fld"><small>НА ВАГОН</small><select id="stCar">${CARS.map(c=>`<option value="${c.no}">${c.no} · ${repName(c.rep)} · ${OWNERS[c.own]}</option>`).join('')}</select></div></div>
  <div class="f2"><div class="fld"><small>КОЛИЧЕСТВО</small><input id="stQty" value="1"></div><div class="fld"><small>ОСНОВАНИЕ</small><input value="Дефектная ведомость от мастера"></div></div>
  <div class="note" style="--tone:var(--acc)"><b>Что произойдёт</b><p>Узел спишется со склада с привязкой к вагону: в карточке вагона появится запись «установлена колёсная пара № …», а себестоимость ремонта пересчитается.</p></div>
  <div class="btns" style="margin-top:11px"><button class="btn acc" onclick="stSave('Расход')">Списать на вагон</button><button class="btn" onclick="closeD()">Отмена</button></div>`)}
function stSave(t){
 if(t==='Приход'){PARTS.unshift({n:'Колёсная пара РУ1Ш-957-Г',num:'КП-0084525',yr:2022,q:1,st:'ok',loc:'ВЧДР Астана',price:835000,note:'приход 24.08.2026, накл. 2214'});
  MOVES.unshift({t:'Приход',what:'Колёсная пара КП-0084525 · 1 шт.',to:'накладная № 2214',d:'сейчас',who:'Сергей А.',sum:835000});
  closeD();render();toast('Узел оприходован на склад с номером <b>КП-0084525</b> — теперь его можно списать на конкретный вагон.');return}
 const i=+document.getElementById('stPart').value,no=document.getElementById('stCar').value,q=+document.getElementById('stQty').value||1;
 const p=PARTS[i];p.q=Math.max(0,p.q-q);
 MOVES.unshift({t:'Расход',what:p.n+(p.num!=='—'?' · '+p.num:'')+' · '+q+' шт.',to:'вагон '+no,d:'сейчас',who:'Сергей А.',sum:p.price*q});
 if(!p.q)PARTS.splice(i,1);
 closeD();render();sparks();
 toast(`Списано на вагон <b>${no}</b>: ${esc(p.n)}${p.num!=='—'?' № '+p.num:''}. Запись ушла в карточку вагона и в себестоимость ремонта.`)}
function stInv(){openD('Инвентаризация склада','Сверка фактических остатков с учётными',['Инвентаризация'],
 `<div class="fld"><small>ДЕПО</small><select>${DEPOS.slice(0,4).map(d=>`<option>${d.n}</option>`).join('')}</select></div>
  <div class="panel" style="margin:8px 0">
  ${PARTS.slice(0,5).map(p=>`<div class="part"><div><b style="font-size:10px">${esc(p.n)}</b><div class="sub pnum">${p.num}</div></div>
   <div style="text-align:right"><small class="mono" style="color:var(--muted2);font-size:7px">УЧЁТ</small><div class="mono">${p.q}</div></div>
   <div style="width:70px"><input class="search" style="min-width:0;padding:6px 8px;text-align:center" value="${p.q}"></div></div>`).join('')}
  </div>
  <div class="btns"><button class="btn acc" onclick="closeD();sparks();toast('Инвентаризация проведена: расхождений не найдено, акт сформирован и сохранён в системе.')">Провести и сформировать акт</button><button class="btn" onclick="closeD()">Отмена</button></div>`)}

/* ---- ДЕПО ---- */
SC.depo=()=>`
 <div class="head"><div><h2>Депо и загрузка</h2><p>Вы работаете с десятком ремонтных депо по Казахстану. Здесь видно, сколько вагонов в каждом, как оно держит сроки и есть ли расчёты с ним.</p></div></div>
 <div class="strip">
  <div><small>ДЕПО-ПОДРЯДЧИКОВ</small><b>${DEPOS.length}</b><span>по всей стране</span></div>
  <div><small>ВАГОНОВ РАЗМЕЩЕНО</small><b>${DEPOS.reduce((s,d)=>s+d.v,0)}</b><span>в работе прямо сейчас</span></div>
  <div><small>СРЕДНИЙ СРОК РЕМОНТА</small><b>7,2 дн.</b><span>по всем депо</span></div>
  <div><small>ДОЛГ ПЕРЕД ДЕПО</small><b class="warn">${tg(DEPOS.reduce((s,d)=>s+d.debt,0))}</b><span>по актам выполненных работ</span></div>
  <div><small>ПРОБЛЕМНЫХ</small><b class="bad">${DEPOS.filter(d=>d.pay.includes('просрочка')).length}</b><span>просрочки по расчётам</span></div>
 </div>
 <div class="panel"><div class="tw"><table class="data" style="min-width:640px"><thead><tr><th>Депо</th><th class="right">Вагонов сейчас</th><th class="right">Средний срок</th><th>Соблюдение сроков</th><th>Расчёты</th><th class="right">Задолженность</th></tr></thead><tbody>
 ${DEPOS.map(d=>`<tr onclick="toast('${d.n}: список вагонов, сроки, калькуляции и акты — открываются по клику.')">
  <td><b>${d.n}</b></td><td class="right mono">${d.v}</td><td class="right mono ${d.avg>9?'bad':d.avg>7.5?'warn':''}">${String(d.avg).replace('.',',')} дн.</td>
  <td><div class="bar" style="width:110px"><i style="--w:${Math.max(10,100-(d.avg-5)*18)}%;--tone:${d.avg>9?'var(--red)':d.avg>7.5?'var(--amber)':'var(--green)'}"></i></div></td>
  <td class="mini">${d.pay}</td><td class="right mono">${d.debt?tg(d.debt):'<span class="mini">—</span>'}</td></tr>`).join('')}
 </tbody></table></div>
 <div class="hint"><b>Полезный вывод из данных:</b> ВЧДР Кызылорда держит вагоны в среднем 10,3 дня — дольше норматива деповского ремонта. Система показывает это сама, без ручного сведения таблиц.</div></div>`;

/* ---- СТАТИСТИКА РУКОВОДИТЕЛЯ (ТЗ п.14) ---- */
let period='Август 2026';
SC.boss=()=>`
 <div class="head"><div><h2>Статистика</h2><p>Экран руководителя по ТЗ: вагоны в работе, отработанные, просроченные и оплаченные — с выбором периода. Из любой цифры можно провалиться в список и открыть карточку вагона.</p></div>
 <div class="btns"><select class="rsel" onchange="period=this.value;render()"><option>Август 2026</option><option>Июль 2026</option><option>II квартал 2026</option><option>Год 2026</option></select><button class="btn" onclick="toast('Отчёт за период выгружен в Excel.')">Экспорт</button></div></div>
 <div class="strip">
  <div><small>ПЕРИОД</small><b style="font-size:15px">${period}</b><span>данные пересчитываются на лету</span></div>
  <div><small>ВАГОНОВ В РАБОТЕ</small><b>${CARS.filter(c=>!['rdy'].includes(c.st)).length}</b><span>из них ждут согласования ${CARS.filter(c=>c.st==='appr').length}</span></div>
  <div><small>ОТРАБОТАНО</small><b class="good">64</b><span>выпущено и сдано клиенту</span></div>
  <div><small>ПРОСРОЧЕНО</small><b class="bad">${CARS.filter(isOver).length}</b><span>сверх норматива</span></div>
  <div><small>ОПЛАЧЕНО КЛИЕНТАМИ</small><b>51</b><span>из 64 сданных</span></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph-title">Вагоны по месяцам · принято и сдано</div>
   <div class="chart">${[['мар',58,46],['апр',66,55],['май',72,60],['июн',80,68],['июл',92,76],['авг',100,64]].map(m=>`<div class="chart-col"><i style="--h:${m[1]}%;--p:${m[2]}%"></i><span>${m[0]}</span></div>`).join('')}</div>
   <div class="kpi-mini"><div style="--tone:var(--acc)"><small>ПРИНЯТО В АВГУСТЕ</small><b>78</b></div><div style="--tone:var(--green)"><small>СДАНО</small><b>64</b></div><div style="--tone:var(--red)"><small>ПРОСРОЧЕНО</small><b>6</b></div><div style="--tone:var(--blue)"><small>СРЕДНИЙ СРОК</small><b>7,4 дн.</b></div></div>
  </div>
  <div class="panel"><div class="ph-title">Распределение по статусам</div>
   ${STATUS.map(s=>{const n=CARS.filter(c=>c.st===s.k).length;return `<div class="fr" style="grid-template-columns:150px 1fr 30px"><span>${s.n}</span><div class="ftrack" style="height:15px"><i style="--w:${n/Math.max(1,CARS.length)*100*2.2}%;background:${s.c}"></i></div><b>${n}</b></div>`}).join('')}
   <div class="hint" style="margin-top:9px"><b>Клик по статусу</b> в таблице вагонов фильтрует список — руководитель видит, где именно затык.</div>
  </div>
 </div>
 <div class="g3">
  <div class="panel"><div class="ph-title">Виды ремонта</div>
   ${REP.map(r=>{const n=CARS.filter(c=>c.rep===r[0]).length;return `<div class="fr" style="grid-template-columns:96px 1fr 60px"><span>${r[1]}</span><div class="ftrack" style="height:15px"><i style="--w:${n/Math.max(1,CARS.length)*100*2.4}%"></i></div><b>${n} шт.</b></div>`}).join('')}
   <div class="mini" style="margin-top:7px">Нормативы: ТОР ${NORMS.tor} дн. · деповской ${NORMS.dep} дн. · капитальный ${NORMS.kap} дн.</div>
  </div>
  <div class="panel"><div class="ph-title">Собственники</div>
   ${OWNERS.map((o,i)=>{const n=CARS.filter(c=>c.own===i).length;return `<div class="fr" style="grid-template-columns:150px 1fr 30px"><span style="font-size:9px">${o}</span><div class="ftrack" style="height:14px"><i style="--w:${n/Math.max(1,CARS.length)*100*2.6}%"></i></div><b>${n}</b></div>`}).join('')}
  </div>
  <div class="panel"><div class="ph-title">Причины просрочки</div>
   ${[['Ожидание ответа по согласованию',42,'var(--violet)'],['Запчасти клиента',24,'var(--cyan)'],['Загрузка депо',21,'var(--amber)'],['Прочее',13,'#5d7186']]
     .map(r=>`<div class="fr" style="grid-template-columns:150px 1fr 36px"><span>${r[0]}</span><div class="ftrack" style="height:15px"><i style="--w:${r[1]/42*100}%;background:${r[2]}"></i></div><b>${r[1]}%</b></div>`).join('')}
   <div class="hint" style="margin-top:9px"><b>Главный резерв:</b> 42% просрочек — ожидание ответа клиента. Автонапоминания по согласованиям бьют ровно в эту точку.</div>
  </div>
 </div>`;

/* ---- ФИНАНСЫ ---- */
SC.fin=()=>`
 <div class="head"><div><h2>Финансы</h2><p>Внутренняя информация: оплата клиентом и оплата работы депо по каждому вагону. Клиенту это не показывается.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Выгрузка для бухгалтерии в Excel.')">Экспорт</button></div></div>
 <div class="strip">
  <div><small>ВЫСТАВЛЕНО КЛИЕНТАМ</small><b>${tg(CARS.reduce((s,c)=>s+PRICES[c.rep],0))}</b><span>по текущим вагонам</span></div>
  <div><small>ОПЛАЧЕНО КЛИЕНТАМИ</small><b class="good">${CARS.filter(c=>c.pc).length} ваг.</b><span>${tg(CARS.filter(c=>c.pc).reduce((s,c)=>s+PRICES[c.rep],0))}</span></div>
  <div><small>НЕ ОПЛАЧЕНО</small><b class="bad">${CARS.filter(c=>!c.pc).length} ваг.</b><span>${tg(CARS.filter(c=>!c.pc).reduce((s,c)=>s+PRICES[c.rep],0))}</span></div>
  <div><small>ОПЛАЧЕНО ДЕПО</small><b>${CARS.filter(c=>c.pd).length} ваг.</b><span>долг ${tg(DEPOS.reduce((s,d)=>s+d.debt,0))}</span></div>
  <div><small>ЗАПЧАСТИ ПО СОГЛАСОВАНИЯМ</small><b>${tg(CARS.reduce((s,c)=>s+c.appr.filter(a=>a.st==='ok').reduce((x,a)=>x+a.qty*a.price,0),0))}</b><span>перевыставляется клиенту</span></div>
 </div>
 <div class="panel"><div class="tw"><table class="data" style="min-width:760px"><thead><tr><th>Вагон</th><th>Собственник</th><th>Вид ремонта</th><th class="right">Стоимость</th><th>Оплата клиента</th><th>Оплата депо</th><th>АВР</th><th>Статус</th></tr></thead><tbody>
 ${CARS.map(c=>`<tr onclick="openCar('${c.no}',4)"><td class="mono"><b>${c.no}</b></td><td class="mini">${esc(OWNERS[c.own])}</td><td>${repName(c.rep)}</td>
  <td class="right mono"><b>${tg(PRICES[c.rep])}</b></td>
  <td>${c.pc?'<span class="tag green">оплачено</span>':'<span class="tag red">не оплачено</span>'}</td>
  <td>${c.pd?'<span class="tag green">оплачено</span>':'<span class="tag red">не оплачено</span>'}</td>
  <td>${c.avr?'<span class="tag green">есть</span>':'<span class="mini">—</span>'}</td><td>${stChip(c.st)}</td></tr>`).join('')}
 </tbody></table></div></div>`;

/* ---- БУХГАЛТЕРИЯ (ТЗ п.12) ---- */
SC.buh=()=>{const list=CARS.filter(c=>c.sent);
 return `<div class="head"><div><h2>Бухгалтерия · составление АВР</h2><p>Бухгалтер видит только те вагоны, которые администратор подтвердил и передал на АВР. Менять статусы, данные, цены и согласования бухгалтер не может — только приложить готовый АВР и поставить отметку.</p></div></div>
 <div class="strip">
  <div><small>ПЕРЕДАНО НА АВР</small><b>${list.length}</b><span>только эти вагоны видны бухгалтеру</span></div>
  <div><small>АВР ПРИЛОЖЕНА</small><b class="good">${list.filter(c=>c.avr).length}</b><span>ждёт подтверждения администратора</span></div>
  <div><small>В РАБОТЕ У БУХГАЛТЕРА</small><b class="warn">${list.filter(c=>!c.avr).length}</b><span>уведомление отправлено</span></div>
  <div><small>ОТПРАВЛЕНО КЛИЕНТУ</small><b>${list.filter(c=>c.avr&&c.pc).length}</b><span>после подтверждения</span></div>
  <div><small>СРЕДНИЙ СРОК АВР</small><b>1,2 дн.</b><span>от передачи до готовности</span></div>
 </div>
 <div class="panel">${list.length?`<div class="tw"><table class="data" style="min-width:760px"><thead><tr><th>Вагон</th><th>Собственник</th><th>Вид ремонта</th><th>Документы</th><th class="right">Сумма</th><th>АВР</th><th>Действие</th></tr></thead><tbody>
 ${list.map(c=>`<tr><td class="mono"><b>${c.no}</b></td><td class="mini">${esc(OWNERS[c.own])}</td><td>${repName(c.rep)}</td>
  <td class="mini">${Object.values(c.docs).filter(Boolean).length} документов доступно</td>
  <td class="right mono"><b>${tg(PRICES[c.rep])}</b></td>
  <td>${c.avr?'<span class="tag green">приложена</span>':'<span class="tag amber">нужна</span>'}</td>
  <td>${c.avr?`<button class="btn" onclick="toast('Администратор подтверждает корректность АВР, после чего может нажать «Отправить АВР клиенту».')">Ждёт подтверждения</button>`:`<button class="btn acc" onclick="avrUp('${c.no}')">Приложить АВР</button>`}</td></tr>`).join('')}
 </tbody></table></div>`:'<p class="mini">Пока администратор ничего не передал на составление АВР. В карточке вагона со статусом «Готов» есть кнопка «Передать в бухгалтерию».</p>'}
 <div class="hint"><b>По ТЗ бухгалтер не может:</b> менять статусы, редактировать данные вагона и цены, трогать согласования и финансовую информацию, отправлять вагон на доработку, удалять или архивировать вагоны, изменять чужие документы. Передача вагона в бухгалтерию не меняет основной статус ремонта.</div></div>`};
function avrUp(no){const c=CARS.find(x=>x.no===no);c.avr=1;c.docs.avr=1;render();sparks();
 toast(`АВР приложена к вагону <b>${no}</b> и отмечена. Администратор получил уведомление: после подтверждения он сможет отправить АВР клиенту.`)}

/* ---- КАБИНЕТ КЛИЕНТА (ТЗ п.10, 11) ---- */
SC.client=()=>{const my=CARS.filter(c=>c.own===0);
 return `<div class="head"><div><h2>Кабинет клиента · ${esc(OWNERS[0])}</h2><p>Собственник видит только свои вагоны: статус, полную историю, документы и согласования. Внутренние финансы, оплату депо и данные других клиентов — не видит.</p></div></div>
 <div class="strip">
  <div><small>МОИХ ВАГОНОВ В РАБОТЕ</small><b>${my.filter(c=>c.st!=='rdy').length}</b><span>из ${my.length} всего</span></div>
  <div><small>ТРЕБУЕТ МОЕГО РЕШЕНИЯ</small><b class="warn">${CARS.filter(c=>c.own===0&&c.st==='appr').length}</b><span>согласование запчастей</span></div>
  <div><small>ГОТОВЫ</small><b class="good">${my.filter(c=>c.st==='rdy').length}</b><span>документы доступны</span></div>
  <div><small>СРОК НА ДОРАБОТКУ</small><b>${FIXDAYS} дн.</b><span>с момента «Готов»</span></div>
  <div><small>УВЕДОМЛЕНИЯ</small><b>вкл.</b><span>согласования, документы, статусы</span></div>
 </div>
 <div class="panel"><div class="tw"><table class="data" style="min-width:700px"><thead><tr><th>Вагон</th><th>Род</th><th>Статус</th><th>Дней в ремонте</th><th>Неисправность</th><th>Документы</th><th>Действие</th></tr></thead><tbody>
 ${my.map(c=>`<tr><td class="mono"><b>${c.no}</b></td><td>${rodByNo(c.no)}</td><td>${stChip(c.st)}</td>
  <td class="mono">${c.days}</td><td class="mini">${c.fault} · ${FAULTS[c.fault]}</td>
  <td class="mini">${Object.values(c.docs).filter(Boolean).length} доступно</td>
  <td>${c.st==='appr'?`<button class="btn violet" onclick="toast('Клиент открывает согласование: видит запчасть, количество, цену, акт браковки — и отвечает согласием, отказом или предлагает свою запчасть.')">Ответить по согласованию</button>`
   :c.st==='rdy'?`<button class="btn red" onclick="clientFix('${c.no}')">Вернуть на доработку</button>`
   :`<button class="btn" onclick="openCar('${c.no}',1)">История статусов</button>`}</td></tr>`).join('')}
 </tbody></table></div>
 <div class="hint"><b>Кнопка «Вернуть на доработку»</b> доступна ${FIXDAYS} календарных дней после перехода вагона в «Готов», потом гаснет. Клиент обязательно указывает причину, статус меняет администратор — сам клиент статусы не трогает.</div></div>
 <div class="g2">
  <div class="panel"><div class="ph-title">Уведомления клиента</div>
   ${[['Требуется согласование по вагону 61294857','запчасть на 820 000 ₸ · ответьте в течение 2 суток','var(--violet)'],
      ['Документы по вагону 61402993 доступны','ВУ-36, ВУ-23, ВУ-22, калькуляция, АВР','var(--green)'],
      ['Ваш запрос на доработку принят','вагон 24880154 переведён в «Ожидает корректировки»','var(--red)'],
      ['Напоминание: ждём ваше решение','согласование по вагону 74183920 просрочено на 1 сутки','var(--amber)']]
    .map(n=>`<div class="note" style="--tone:${n[2]}"><b>${n[0]}</b><p>${n[1]}</p></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Что клиент не видит</div>
   ${['Внутренняя финансовая информация','Оплата работы депо','Цены закупа запчастей и маржа','Внутренние комментарии администратора','Вагоны других собственников','Возможность менять статусы']
     .map(x=>`<div style="display:flex;gap:8px;padding:8px 0;border-bottom:1px solid var(--line);font-size:10px"><span style="color:#f87171">✕</span><span>${x}</span></div>`).join('')}
   <div class="hint"><b>Разграничение доступа — на уровне системы,</b> а не «договорённостей»: клиент физически не получает эти данные, даже зная ссылку.</div>
  </div>
 </div>`};
function clientFix(no){const c=CARS.find(x=>x.no===no);
 openD('Вернуть вагон '+no+' на доработку','Причина обязательна · статус меняет администратор',['Запрос'],
 `<div class="fld"><small>ПРИЧИНА ВОЗВРАТА</small><textarea rows="3">В ВУ-23 указан неверный номер гарантийного письма — просим исправить и приложить документ заново.</textarea></div>
  <div class="note" style="--tone:var(--amber)"><b>Срок подачи</b><p>Заявка подаётся в течение ${FIXDAYS} календарных дней после перехода вагона в «Готов». Если вы успели в срок — запрос считается поданным вовремя, даже если администратор обработает его позже.</p></div>
  <div class="btns" style="margin-top:11px"><button class="btn acc" onclick="doFix('${no}')">Отправить запрос</button><button class="btn" onclick="closeD()">Отмена</button></div>`)}
function doFix(no){const c=CARS.find(x=>x.no===no);c.st='fix';c.fixWhy='В ВУ-23 указан неверный номер гарантийного письма — просим исправить и приложить заново.';
 c.hist.push(['fix','Ожидает корректировки','сейчас','Администратор по запросу клиента']);closeD();render();
 toast(`Запрос на доработку отправлен. Администратор получил уведомление и перевёл вагон <b>${no}</b> в «Ожидает корректировки».`)}

/* ---- МОБИЛЬНОЕ МЕСТО МАСТЕРА ---- */
SC.mobile=()=>`
 <div class="head"><div><h2>Мастер в депо · телефон</h2><p>По вашей просьбе на встрече: люди в депо не садятся за компьютер. С телефона мастер меняет статус вагона, составляет дефектную ведомость и снимает фото — данные сразу попадают в карточку.</p></div></div>
 <div class="g12">
  <div class="panel">
   <div class="phone">
    <div class="phone-h">ВЧДР АСТАНА · МАСТЕР ЖАНАТ</div>
    <div class="mrow"><b class="mono" style="font-size:12px">61294857</b><div class="sub">Полувагон · ТОР · код 107</div><div style="margin-top:6px">${stChip('rep')}</div></div>
    <button class="mbtn acc" onclick="mobSt()">▸ Изменить статус вагона</button>
    <button class="mbtn" onclick="mobDef()">📋 Дефектная ведомость</button>
    <button class="mbtn" onclick="toast('Камера открыта: фото узла привяжется к вагону и дефектной ведомости.')">📷 Фото узла</button>
    <button class="mbtn" onclick="toast('Список вагонов этого депо: 11 в работе, 2 готовы к выпуску.')">🚃 Вагоны моего депо · 11</button>
    <div class="mrow" style="margin-top:9px;background:var(--bg2)"><div class="sub">Последнее действие</div><b style="font-size:9.6px">Статус «В ремонте» · сегодня 09:12</b></div>
   </div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Что мастер может с телефона</div>
    ${[['Сменить статус вагона','из ограниченного набора — например «В ремонте» или «Выпущен из ремонта»; запись уходит в общую историю с его именем'],
       ['Составить дефектную ведомость','список выявленных неисправностей с фото — администратор на её основании делает согласование с клиентом'],
       ['Приложить фото и видео','узлы, клейма, повреждения — всё сразу в карточке вагона'],
       ['Видеть только своё депо','мастер не видит финансы, чужие депо и данные клиентов']]
     .map(x=>`<div class="note" style="--tone:var(--acc)"><b>${x[0]}</b><p>${x[1]}</p></div>`).join('')}
   </div>
   <div class="panel" style="margin-top:10px"><div class="ph-title">Почему это важно для сроков</div>
    <p class="mini" style="margin-top:6px">Сейчас информация из депо доходит звонками и сообщениями, а в таблицу попадает вечером или на следующий день. Когда мастер отмечает статус на месте, администратор видит реальную картину в ту же минуту — а таймер норматива считается по факту, а не «по памяти».</p>
    <div class="kpi-mini"><div style="--tone:var(--green)"><small>ЗАДЕРЖКА ДАННЫХ</small><b>минуты</b></div><div style="--tone:var(--blue)"><small>БЕЗ КОМПЬЮТЕРА</small><b>да</b></div><div style="--tone:var(--acc)"><small>ФОТО К ВАГОНУ</small><b>сразу</b></div></div>
   </div>
  </div>
 </div>`;
function mobSt(){openD('Смена статуса с телефона','Мастер Жанат · ВЧДР Астана · вагон 61294857',['Статус'],
 `${STATUS.filter(s=>['rep','out'].includes(s.k)).map(s=>`<button class="stbtn" style="--c:${s.c}" onclick="closeD();sparks();toast('Мастер отметил статус «${s.n}» с телефона. Запись ушла в историю вагона с его именем и точным временем, администратор видит изменение сразу.')"><i></i>${s.n}</button>`).join('')}
 <div class="note" style="--tone:var(--acc)"><b>Ограниченный набор</b><p>Мастеру доступны только рабочие статусы. Согласования, финансы и передачу в бухгалтерию делает администратор.</p></div>`)}
function mobDef(){openD('Дефектная ведомость','Вагон 61294857 · ВЧДР Астана',['Ведомость'],
 `<div class="fld"><small>ВЫЯВЛЕННЫЕ НЕИСПРАВНОСТИ</small>
  ${[['107','Выщербина обода колеса — 2 шт.'],['225','Износ фрикционных планок'],['205','Просадка пружин рессорного комплекта']].map(d=>`<div class="doc done"><i>✓</i><span><b class="mono">${d[0]}</b> · ${d[1]}</span></div>`).join('')}</div>
 <div class="fld"><small>ТРЕБУЕТСЯ ЗАМЕНА</small><textarea rows="2">Колёсная пара — 1 шт. (по браковке), комплект фрикционных планок.</textarea></div>
 <div class="btns" style="margin-top:10px"><button class="btn" onclick="toast('Фото прикреплены к ведомости.')">📷 Фото (4)</button>
 <button class="btn acc" onclick="closeD();sparks();toast('Дефектная ведомость отправлена администратору. На её основании создаётся согласование с клиентом по колёсной паре — вагон встанет в «Ожидает согласования».')">Отправить администратору</button></div>`)}

/* ---- НОРМАТИВЫ И ЦЕНЫ (ТЗ п.15, 16.2) ---- */
SC.norms=()=>`
 <div class="head"><div><h2>Нормативы и цены</h2><p>Права руководителя: нормативные сроки по видам ремонта и цены. Новые значения применяются к новым вагонам — уже начатые сроки не пересчитываются.</p></div></div>
 <div class="g2">
  <div class="panel"><div class="ph-title">Нормативные сроки ремонта</div>
   ${REP.map(r=>`<div style="display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid var(--line)">
    <div style="flex:1"><b style="font-size:11px">${r[1]}</b><div class="sub">просрочка считается с даты получения заявки</div></div>
    <button class="btn" onclick="normSet('${r[0]}',-1)">−</button>
    <b class="mono" style="width:64px;text-align:center;font-size:14px">${NORMS[r[0]]} дн.</b>
    <button class="btn" onclick="normSet('${r[0]}',1)">+</button></div>`).join('')}
   <div class="hint"><b>Сейчас под нормативом:</b> ${CARS.filter(c=>!isOver(c)).length} вагонов, просрочено ${CARS.filter(isOver).length}. Поменяйте норматив — пересчёт видно сразу в таблице.</div>
  </div>
  <div class="panel"><div class="ph-title">Цены по видам ремонта</div>
   ${REP.map(r=>`<div style="display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid var(--line)">
    <div style="flex:1"><b style="font-size:11px">${r[1]}</b><div class="sub">базовая стоимость для расчётов с клиентом</div></div>
    <b class="mono" style="font-size:13px">${tg(PRICES[r[0]])}</b>
    <button class="btn" onclick="toast('Цена «${r[1]}» изменена — новые вагоны считаются по новой цене, ранее выставленное не пересчитывается.')">Изменить</button></div>`).join('')}
   <div class="note" style="--tone:var(--acc)"><b>Только руководитель</b><p>Изменение цен, нормативов, корректировка данных и финансовой информации, перенос ошибочного вагона в архив — права руководителя. Администратор этого не может.</p></div>
  </div>
 </div>`;
function normSet(k,d){NORMS[k]=Math.max(1,NORMS[k]+d);keepScroll();
 toast(`Норматив «${repName(k)}» — ${NORMS[k]} дн. Новые значения применяются к новым вагонам; уже начатые сроки не пересчитываются.`)}

/* ---- АРХИВ (ТЗ п.23) ---- */
SC.archive=()=>`
 <div class="head"><div><h2>Архив</h2><p>Вагоны не удаляются из базы физически. Руководитель может перенести в архив ошибочно созданную карточку — с полной историей, документами и согласованиями.</p></div></div>
 <div class="strip">
  <div><small>В АРХИВЕ</small><b>7 вагонов</b><span>ошибочные и закрытые карточки</span></div>
  <div><small>УДАЛЕНО ФИЗИЧЕСКИ</small><b class="good">0</b><span>физическое удаление не производится</span></div>
  <div><small>ДОСТУП</small><b>руководитель</b><span>с подтверждением действия</span></div>
  <div><small>ВИДНО КЛИЕНТУ</small><b>нет</b><span>архивные вагоны скрыты</span></div>
  <div><small>ХРАНИТСЯ</small><b>всё</b><span>карточка, история, документы, финансы</span></div>
 </div>
 <div class="panel"><div class="tw"><table class="data" style="min-width:640px"><thead><tr><th>Вагон</th><th>Собственник</th><th>Причина архивации</th><th>Кто перенёс</th><th>Дата</th><th></th></tr></thead><tbody>
 ${[['61118240','ТОО «Alem Rail»','Дубль заявки — карточка создана повторно вручную','Владимир Р.','18.08.2026'],
    ['74009315','АО «Каспий Ойл Транс»','Ошибочный номер вагона в письме клиента','Владимир Р.','12.08.2026'],
    ['24551007','ТОО «KZ Wagon»','Заявка отозвана собственником до начала ремонта','Владимир Р.','05.08.2026']]
  .map(a=>`<tr onclick="toast('Архивная карточка ${a[0]}: доступна вся история, документы и согласования. Восстановление — по подтверждению руководителя.')">
  <td class="mono"><b>${a[0]}</b></td><td class="mini">${a[1]}</td><td class="mini">${a[2]}</td><td>${a[3]}</td><td class="mono">${a[4]}</td>
  <td><span class="tag">в архиве</span></td></tr>`).join('')}
 </tbody></table></div></div>`;

/* ---- НАСТРОЙКИ ---- */
SC.settings=()=>`
 <div class="head"><div><h2>Настройки</h2><p>Всё, что в ТЗ помечено как настраиваемое: адрес почты бота, срок подачи заявки на доработку, цвета статусов, классификаторы и права ролей.</p></div></div>
 <div class="g2">
  <div class="panel"><div class="ph-title">Цвета статусов</div>
   <p class="mini" style="margin-bottom:8px">Нажмите на статус — цвет строки в основной таблице поменяется сразу. Цвет ни на что не влияет, кроме визуального контроля.</p>
   ${STATUS.map((s,i)=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)">
    <span style="width:20px;height:20px;border-radius:6px;background:${s.c};flex:none"></span>
    <b style="flex:1;font-size:10.4px">${s.n}</b>
    <button class="btn" onclick="colorNext(${i})">Сменить цвет</button></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Правила системы</div>
   <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)">
    <div style="flex:1"><b style="font-size:10.4px">Срок подачи заявки на доработку</b><div class="sub">после перехода вагона в «Готов»</div></div>
    <button class="btn" onclick="fixSet(-1)">−</button><b class="mono" style="width:56px;text-align:center">${FIXDAYS} дн.</b><button class="btn" onclick="fixSet(1)">+</button></div>
   ${[['Почта для заявок','remont@vagon-service.kz · задаётся при настройке'],['Добавление ящиков через интерфейс','не предусмотрено — один выделенный адрес'],['Классификатор рода вагонов','загружен · 5 групп'],['Классификатор неисправностей','загружен · ' + Object.keys(FAULTS).length + ' кодов'],['Классификатор станций','загружен · ' + STATIONS.length + ' станций'],['Напоминание по согласованию','ежедневно после 2 суток без ответа'],['Уведомления','администратор, бухгалтерия, клиент — по своим событиям']]
    .map(x=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);font-size:10px"><span class="muted">${x[0]}</span><b style="text-align:right;max-width:60%">${x[1]}</b></div>`).join('')}
   <div class="hint"><b>Классификаторы</b> вы передаёте Excel-файлами — мы загружаем их в систему, дальше бот и карточка заполняются по ним автоматически.</div>
  </div>
 </div>
 <div class="panel"><div class="ph-title">Роли и доступ</div>
  <div class="tw"><table class="data" style="min-width:700px"><thead><tr><th>Возможность</th><th>Администратор</th><th>Руководитель</th><th>Бухгалтерия</th><th>Клиент</th><th>Мастер</th></tr></thead><tbody>
  ${[['Заявки от бота и приём в работу',1,1,0,0,0],['Изменение статусов',1,1,0,0,'частично'],['Согласования с клиентом',1,1,0,'ответ',0],
     ['Документы вагона',1,1,'только АВР','просмотр','фото'],['Внутренние финансы',1,1,0,0,0],['Цены и нормативы',0,1,0,0,0],
     ['Передача в бухгалтерию',1,1,0,0,0],['Архив',0,1,0,0,0],['Вагоны других клиентов',1,1,'переданные',0,'своё депо']]
   .map(r=>`<tr style="cursor:default"><td><b>${r[0]}</b></td>${r.slice(1).map(v=>`<td style="text-align:center">${v===1?'<span style="color:#4ade80">✓</span>':v===0?'<span style="color:#5d7186">—</span>':`<span class="tag amber">${v}</span>`}</td>`).join('')}</tr>`).join('')}
  </tbody></table></div>
 </div>`;
function colorNext(i){const P=['#3b82f6','#f5a524','#a855f7','#22d3ee','#22c55e','#10b981','#ef4444','#ec4899','#eab308','#64748b'];
 const s=STATUS[i];s.c=P[(P.indexOf(s.c)+1)%P.length];keepScroll();
 toast(`Цвет статуса «${s.n}» изменён — строки в основной таблице перекрасились сразу.`)}
function fixSet(d){FIXDAYS=Math.max(1,FIXDAYS+d);keepScroll();
 toast(`Срок подачи заявки на доработку — ${FIXDAYS} дн. Новое значение применяется только к вагонам, которые перейдут в «Готов» после изменения.`)}

/* ===== КАРКАС ===== */
function keepScroll(){const el=document.getElementById('content');const s=el.scrollTop;render();el.scrollTop=s}
function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([n,r],i)=>`<button class="role" onclick="enter('${n}')"><code>0${i+1}</code><b>${n}</b><span>${r.note}</span></button>`).join('')}
function enter(n){role=n;const r=ROLES[n];
 document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');
 document.getElementById('rav').textContent=r.av;document.getElementById('rname').textContent=n;document.getElementById('rrole').textContent=r.note;
 buildNav();const q=new URLSearchParams(location.search).get('s');go(q&&r.s.includes(q)?q:r.s[0]);
 toast(`Роль <b>${n}</b>: показаны только разделы, доступные этой роли по ТЗ.`)}
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
function openD(t,s,tabs,body){document.getElementById('dt').textContent=t;document.getElementById('ds').textContent=s;
 document.getElementById('dtabs').innerHTML=tabs.map((x,i)=>`<button class="dtab ${i===0?'on':''}">${x}</button>`).join('');
 document.getElementById('db').innerHTML=body;document.getElementById('dbg').classList.add('show')}
function closeD(){document.getElementById('dbg').classList.remove('show')}
let tt;function toast(h){const t=document.getElementById('toast');t.innerHTML=h;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),5200)}
function sparks(){const c=['#f5a524','#fbbf24','#22d3ee','#a855f7','#e8eef5','#22c55e'];
 for(let i=0;i<70;i++){const s=document.createElement('i');s.className='spark';
  s.style.cssText=`left:${Math.random()*100}vw;top:-14px;background:${c[i%6]};animation-delay:${Math.random()*.45}s;transform:rotate(${Math.random()*360}deg)`;
  document.body.appendChild(s);setTimeout(()=>s.remove(),2400)}}
const TOUR=[
 ['inbox','<b>Шаг 1.</b> Письмо приходит на выделенный адрес — бот за секунды разбирает его: номер вагона → род по классификатору, код → название неисправности, станция и собственник. Дубли и нераспознанное подсвечены отдельно.',6000],
 ['table','<b>Шаг 2.</b> Принятая заявка становится строкой в основной таблице. Цвет — по статусу, просроченные подсвечены, столбцы настраиваются под себя. Именно список, а не доска — как вы и просили.',6000],
 ['appr','<b>Шаг 3.</b> Нужна дорогая запчасть — создаётся согласование, вагон встаёт в «Ожидает согласования». Нет ответа 2 суток — система напоминает клиенту сама.',5600],
 ['stock','<b>Шаг 4.</b> Склад с номерным учётом: у каждой колёсной пары свой номер и история. Списание — всегда на конкретный вагон, поэтому себестоимость точная.',5600],
 ['mobile','<b>Шаг 5.</b> Мастер в депо работает с телефона: меняет статус и отправляет дефектную ведомость с фото. Данные в системе в ту же минуту, а не вечером.',5600],
 ['buh','<b>Шаг 6.</b> Готовый вагон передаётся в бухгалтерию: бухгалтер видит только его, прикладывает АВР и ставит отметку. Ни статусы, ни цены он трогать не может.',5600],
 ['boss','<b>Итог.</b> Руководитель видит за период: в работе, отработано, просрочено, оплачено — и причины просрочек. Каждый вагон — одна карточка от письма до оплаты.',6000]
];
let tourT=null,tourI=0;
function tour(){if(tourT){stopTour();return}tourI=0;document.getElementById('tourBtn').textContent='■ Остановить';step()}
function step(){if(tourI>=TOUR.length){stopTour();sparks();toast('<b>Весь жизненный цикл вагона</b> из вашего ТЗ — от письма на почту до АВР и оплаты — работает в одной системе.');return}
 const [scr,txt,ms]=TOUR[tourI++];if(ROLES[role].s.includes(scr))go(scr);toast(txt);tourT=setTimeout(step,ms)}
function stopTour(){clearTimeout(tourT);tourT=null;const b=document.getElementById('tourBtn');if(b)b.textContent='▶ Сценарий'}
document.getElementById('menuBtn').onclick=()=>document.getElementById('rail').classList.toggle('open');
renderRoles();
(function(){const q=new URLSearchParams(location.search).get('s');if(q&&TITLES[q]){const r=q==='client'?'Клиент':q==='mobile'?'Мастер в депо':q==='buh'?'Бухгалтерия':(q==='boss'||q==='norms'||q==='archive'||q==='fin')?'Руководитель':'Администратор';enter(r)}})();
