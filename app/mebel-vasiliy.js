/* КОРПУС — система мебельного производства на заказ: заявка, замеры, эскиз, договор и ЭЦП, конструкторская воронка с чек-листами, запуск в производство, доски подрядчиков с дедлайнами и расчётами, склад ТМЦ с ячейками и заявками на закупку, цех и бригады, доставка и монтаж, календарь загрузки и отпусков, WhatsApp в карточке, калькулятор из Google-таблицы, деньги, зарплаты и аналитика. Все имена, компании, номера и суммы вымышленные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(n<0?'−':'')+(Math.round(Math.abs(n)/10000)/100).toString().replace('.',',')+' млн';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};
const D=s=>s&&s.length===5?'2026-'+s:s;
const dd=s=>{if(!s)return '—';const [y,m,d]=D(s).split('-');return d+'.'+m};
const TODAY='2026-10-05',NOW='15:20';
const addDays=(s,n)=>new Date(new Date(D(s)+'T00:00:00Z').getTime()+n*864e5).toISOString().slice(0,10);
const daysBetween=(a,b)=>Math.round((new Date(D(b)+'T00:00:00Z')-new Date(D(a)+'T00:00:00Z'))/864e5);
const dayOf=s=>['вс','пн','вт','ср','чт','пт','сб'][new Date(D(s)+'T00:00:00Z').getUTCDay()];

const SEC=[
 {k:'own',n:'Собственник',sub:[['today','Пульт'],['money','Приходы и расходы'],['debts','Долги клиентов и подрядчикам'],['salary','Зарплаты'],['analytics','Аналитика'],['reports8','Отчёты руководителя']]},
 {k:'sales',n:'Продажи',sub:[['funnel','Воронка заказов'],['order','Карточка заказа'],['clients','Клиенты'],['calc','Расчёт заказа'],['kp','КП, договор, ЭЦП'],['wa','WhatsApp'],['lost','Причины отказа'],['payclose','Оплата и закрытие']]},
 {k:'kon',n:'Конструкторы',sub:[['kboard','Конструкторская воронка'],['checklists','Чек-листы этапов'],['cload','Загрузка и отпуска']]},
 {k:'prod',n:'Производство',sub:[['prod','Цех и бригады'],['contractors','Подрядчики'],['contractor','Кабинет подрядчика'],['calendar','Календарь дедлайнов'],['install','Доставка и монтаж'],['brig','Мои заказы · бригада'],['drive','Мои рейсы · водитель']]},
 {k:'wh',n:'Склад',sub:[['stock','Остатки и ячейки'],['requests','Заявки и закупка'],['supply','Снабжение: наличие и заказ'],['prices','Прайсы поставщиков']]},
 {k:'sys',n:'Система',sub:[['tzmap','Соответствие ТЗ'],['questions','Вопросы до разработки'],['autom','Автоматизации'],['roles','Роли и права'],['launch','Запуск и стоимость']]}
];
const SECOF={},SUBN={};
SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));

const ROLES={
 'Собственник':{av:'ВС',p:'VS',n:'Василий',note:'Всё: заказы на всех этапах, подрядчики, склад, деньги, зарплаты, аналитика. Права сотрудникам выдаёт сам',s:ALL.slice()},
 'Менеджер':{av:'АГ',p:'AG',n:'Айгерим',note:'Свои заказы: замер, эскиз, расчёт, КП и договор, WhatsApp с клиентом, чек-лист передачи конструктору',s:['funnel','order','clients','calc','kp','wa','lost','payclose','supply','install']},
 'Конструктор':{av:'ТМ',p:'TM',n:'Тимур',note:'Контрольный замер, документация по чек-листу, выбор подрядчиков, заявка на склад',s:['kboard','order','checklists','cload','calc']},
 'Начальник производства':{av:'ОЛ',p:'OL',n:'Олег',note:'Цех и бригады, подрядчики и дедлайны, склад, доставка и монтаж, загрузка',s:['calendar','prod','contractors','contractor','supply','install','cload','funnel','order','stock','requests']},
 'Склад и закупка':{av:'ЕР',p:'ER',n:'Ерлан',note:'Только склад: остатки по ячейкам, заявки из заказов — отгрузить или дозаказать, прайсы',s:['supply','requests','stock','prices']},
 'Финансы':{av:'ЖА',p:'FN',n:'Жанна',note:'Оплаты и остатки по договорам, закрывающие документы, приходы и расходы',s:['payclose','money','debts','order','salary']},
 'Сборщик':{av:'Б1',p:'B1',n:'Бригада 1 · Сергей',note:'Только свои заказы: чертежи, детали, что готово, когда монтаж — с телефона',s:['brig']},
 'Водитель':{av:'ЖД',p:'DR',n:'Жандос · сторонний',note:'Только свои рейсы: откуда, куда, когда, что везти',s:['drive']},
 'Подрядчик':{av:'СМ',p:'P5',n:'«Стекло-Мастер»',note:'Свой кабинет: заказы от вас, документы для скачивания, дедлайны, сверка оплат',s:['contractor']}
};
let role='Собственник',cur='today',theme='light',curOrd='К-1501';
const STAFF={VS:'Василий',YU:'Юрий',OL:'Олег',AG:'Айгерим',DN:'Дина',MK:'Максат',OG:'Ольга',TM:'Тимур',SA:'Сауле',AR:'Артём',ER:'Ерлан',DR:'Жандос',FN:'Жанна'};
const BRIG={B1:{n:'Бригада 1',p:'Сергей, Алмас'},B2:{n:'Бригада 2',p:'Руслан, Даурен'},B3:{n:'Бригада 3',p:'Виктор, Нурик'}};

const CLIENTS=[
 {id:'C1',n:'Жанар Сейтова',ph:'+7 701 *** 18 40',addr:'ЖК «Esentai City», кв. 112',src:'Сарафан',note:'Второй заказ. Важны сроки — переезд 20 октября.'},
 {id:'C2',n:'Алексей Пак',ph:'+7 777 *** 62 05',addr:'мкр. Самал-2, 58',src:'Повторный',note:'—'},
 {id:'C3',n:'Динара Ахметова',ph:'+7 705 *** 31 77',addr:'ул. Розыбакиева, 247',src:'Instagram',note:'Ждёт шкаф к 10.10 — стекло задерживается.'},
 {id:'C4',n:'ТОО «Кофейня Арома»',ph:'+7 727 *** 44 10',addr:'пр. Достык, 89',src:'Сарафан',note:'Коммерческий объект, работаем по договору с ЭЦП.'},
 {id:'C5',n:'Ербол Нурланов',ph:'+7 701 *** 07 93',addr:'КГ «Ак Булак», дом 14',src:'Сарафан',note:'—'},
 {id:'C6',n:'Мария Ким',ph:'+7 707 *** 88 21',addr:'ЖК «Alma City», кв. 45',src:'2ГИС',note:'Поменяла модель духового шкафа после договора — проверить привязку.'},
 {id:'C7',n:'Асет Байжанов',ph:'+7 777 *** 50 64',addr:'ул. Жандосова, 140',src:'Instagram',note:'—'},
 {id:'C8',n:'Ольга Ли',ph:'+7 701 *** 29 15',addr:'ЖК «Nurly Tau», кв. 9',src:'Сарафан',note:'—'},
 {id:'C9',n:'ТОО «Офис-Плюс»',ph:'+7 727 *** 13 88',addr:'БЦ «Нурлы Тау», 4Б, 7 этаж',src:'Повторный',note:'Оплата безналом, закрывающие документы.'},
 {id:'C10',n:'Камила Есенова',ph:'+7 705 *** 66 32',addr:'ул. Габдуллина, 63',src:'Сарафан',note:'—'},
 {id:'C11',n:'Тимур Абилов',ph:'+7 778 *** 40 19',addr:'мкр. Орбита-3, 21',src:'2ГИС',note:'—'},
 {id:'C12',n:'Светлана Волкова',ph:'+7 701 *** 95 57',addr:'ул. Тимирязева, 42',src:'Сарафан',note:'—'},
 {id:'C13',n:'Нурлан Сарсенов',ph:'+7 777 *** 23 86',addr:'ЖК «Комфорт Сити», кв. 77',src:'Сарафан',note:'Остаток 200 000 ₸ после монтажа — не оплачен.'},
 {id:'C14',n:'Гульнара Тлеуова',ph:'+7 702 *** 14 50',addr:'ул. Шевченко, 118',src:'Повторный',note:'—'},
 {id:'C16',n:'Руслан Ибраев',ph:'+7 701 *** 52 18',addr:'ЖК «Хайвил», кв. 204',src:'Instagram',note:'Попросил уменьшить глубину шкафа — корректировка КП.'},
 {id:'C17',n:'Айнур Омарова',ph:'+7 777 *** 09 41',addr:'мкр. Аксай-4, 91',src:'Сарафан',note:'—'},
 {id:'C15',n:'Роман Ковалёв',ph:'+7 707 *** 71 03',addr:'КГ «Березовая роща»',src:'Instagram',note:'—'}
];
const CL=id=>CLIENTS.find(c=>c.id===id);

/* Этапы основной воронки — как вы их назвали */
const ST=[
 {k:'lead',n:'Новая заявка',c:'#7b7368',r:2,z:'m'},
 {k:'info',n:'Сбор информации',c:'#8a6d4a',r:5,z:'m'},
 {k:'sketch',n:'Первичная отрисовка',c:'#a0703c',r:9,z:'m'},
 {k:'fix',n:'Корректировка',c:'#a3653a',r:12,z:'m'},
 {k:'agree',n:'Согласование',c:'#97582f',r:15,z:'m'},
 {k:'dog',n:'Договор',c:'#8a5a2e',r:18,z:'m'},
 {k:'zam2',n:'Замер и техпроект',c:'#3f6f6a',r:26,z:'k'},
 {k:'kd',n:'Модерация менеджером',c:'#2f5d7a',r:34,z:'k'},
 {k:'start',n:'Запуск в производство',c:'#5a4f86',r:42,z:'p'},
 {k:'podr',n:'Производство и подрядчики',c:'#7a4f86',r:55,z:'p'},
 {k:'ceh',n:'Сборка',c:'#b0532a',r:70,z:'p'},
 {k:'wait',n:'Готово к вывозу',c:'#b57d14',r:80,z:'p'},
 {k:'mont',n:'Доставка и монтаж',c:'#2e7d63',r:88,z:'p'},
 {k:'qa',n:'Качество и АВР',c:'#3d6f8a',r:94,z:'p'},
 {k:'pay',n:'Оплата',c:'#6a7a2e',r:97,z:'p'},
 {k:'done',n:'Закрыт',c:'#3d7a3d',r:100,z:'p'}
];
const STI=k=>ST.findIndex(s=>s.k===k);
const STN=k=>ST[STI(k)];

/* Подрядчики: own — свой участок */
const CONTR=[
 {id:'P1',n:'«Раскрой-Центр»',w:'Распил ЛДСП и кромка',ph:'+7 727 *** 30 12',login:1},
 {id:'P2',n:'Малярка',w:'Покраска фасадов МДФ',ph:'свой участок с сентября',own:1,login:1},
 {id:'P3',n:'«МеталлФорм»',w:'Металлокаркасы, опоры',ph:'+7 701 *** 55 08',login:0},
 {id:'P4',n:'«Stone Line»',w:'Столешницы: кварц, акрил',ph:'+7 777 *** 41 90',login:1},
 {id:'P5',n:'«Стекло-Мастер»',w:'Стекло, зеркала, фацет',ph:'+7 705 *** 12 66',login:1},
 {id:'P6',n:'«AluSystem»',w:'Алюминиевые фасады и профиль купе',ph:'+7 701 *** 86 34',login:0},
 {id:'P7',n:'«Шпон-Арт»',w:'Шпонированные фасады',ph:'+7 707 *** 20 71',login:0},
 {id:'P8',n:'«Фасад-Колор»',w:'Крашеные фасады — когда малярка занята',ph:'+7 778 *** 63 45',login:0},
 {id:'P9',n:'«Комфорт»',w:'Мягкие элементы, изголовья',ph:'+7 702 *** 09 58',login:0}
];
const CO=id=>CONTR.find(c=>c.id===id);

/* Заказы: chM / chK — чек-листы менеджера и конструктора (1 — отмечено); podr — подрядчики, которых отметил конструктор */
const ORDERS=[
 {id:'К-1501',cl:'C1',kind:'kitchen',t:'Кухня угловая 3,4 м · фасады МДФ эмаль · столешница кварц',sum:3480000,paid:1740000,mgr:'AG',kon:'TM',st:'podr',br:'B1',mont:'10-16',podr:['P1','P2','P4'],d:'09-12'},
 {id:'К-1502',cl:'C2',kind:'kitchen',t:'Кухня прямая 2,8 м · ЛДСП Egger · ящики Blum',sum:1650000,paid:825000,mgr:'DN',kon:'SA',st:'ceh',br:'B2',mont:'10-09',podr:['P1'],d:'09-08'},
 {id:'К-1503',cl:'C3',kind:'wardrobe',t:'Шкаф-купе 2,4 м · зеркало · алюминиевый профиль',sum:890000,paid:445000,mgr:'MK',kon:'AR',st:'podr',br:'B3',mont:'10-10',podr:['P1','P5','P6'],d:'09-15'},
 {id:'К-1504',cl:'C4',kind:'other',t:'Барная стойка и витрины · шпон дуба · металлокаркас',sum:4200000,paid:2100000,mgr:'OG',kon:'TM',st:'kd',kst:'moder',br:null,mont:null,podr:['P1','P3','P7','P4'],d:'09-22'},
 {id:'К-1505',cl:'C5',kind:'wardrobe',t:'Гардеробная 6 м² · наполнение Hettich',sum:1280000,paid:1280000,mgr:'AG',kon:'SA',st:'qa',br:'B3',mont:'10-05',podr:['P1','P6'],d:'08-28'},
 {id:'К-1506',cl:'C6',kind:'kitchen',t:'Кухня П-образная · фасады шпон · встроенная техника',sum:4950000,paid:2475000,mgr:'DN',kon:'TM',st:'zam2',kst:'zamer',br:null,mont:null,podr:[],d:'09-29'},
 {id:'К-1507',cl:'C7',kind:'other',t:'Детская: шкаф, стол, кровать-чердак',sum:1120000,paid:0,mgr:'MK',kon:null,st:'dog',br:null,mont:null,podr:[],d:'10-02'},
 {id:'К-1508',cl:'C8',kind:'kitchen',t:'Кухня 3 м · ЛДСП + стекло',sum:1780000,paid:0,mgr:'OG',kon:null,st:'sketch',br:null,mont:null,podr:[],d:'10-01'},
 {id:'К-1509',cl:'C9',kind:'other',t:'Ресепшн и шкафы · металлокаркас',sum:2300000,paid:1150000,mgr:'AG',kon:'AR',st:'start',br:'B1',mont:'10-23',podr:['P1','P3'],d:'09-18'},
 {id:'К-1510',cl:'C10',kind:'wardrobe',t:'Прихожая и ТВ-зона',sum:960000,paid:480000,mgr:'DN',kon:'SA',st:'wait',br:'B2',mont:'10-08',podr:['P1'],d:'09-05'},
 {id:'К-1511',cl:'C11',kind:'kitchen',t:'Кухня 2,6 м',sum:1390000,paid:0,mgr:'MK',kon:null,st:'info',br:null,mont:null,podr:[],d:'10-03'},
 {id:'К-1512',cl:'C12',kind:'wardrobe',t:'Гардероб распашной 2 м',sum:720000,paid:0,mgr:'OG',kon:null,st:'lead',br:null,mont:null,podr:[],d:'10-05'},
 {id:'К-1513',cl:'C14',kind:'wardrobe',t:'Шкаф в прихожую 1,8 м',sum:640000,paid:320000,mgr:'AG',kon:'AR',st:'zam2',kst:'draw',br:null,mont:null,podr:[],d:'09-26'},
 {id:'К-1514',cl:'C15',kind:'kitchen',t:'Кухня с островом · фасады эмаль',sum:3150000,paid:1575000,mgr:'DN',kon:'SA',st:'zam2',kst:'agree',br:null,mont:null,podr:[],d:'09-24'},
 {id:'К-1515',cl:'C16',kind:'wardrobe',t:'Шкаф-купе 3 м · фасады зеркало + ЛДСП',sum:980000,paid:0,mgr:'DN',kon:null,st:'fix',br:null,mont:null,podr:[],d:'09-30'},
 {id:'К-1516',cl:'C17',kind:'kitchen',t:'Кухня угловая 2,9 м · фасады МДФ плёнка',sum:1840000,paid:0,mgr:'AG',kon:null,st:'agree',br:null,mont:null,podr:[],d:'09-27'},
 {id:'К-1493',cl:'C13',kind:'kitchen',t:'Кухня 3,2 м',sum:2100000,paid:1900000,mgr:'MK',kon:'TM',st:'pay',br:'B2',mont:'09-26',podr:['P1','P4'],d:'08-10'},
 {id:'К-1498',cl:'C1',kind:'wardrobe',t:'Гардероб в спальню',sum:1160000,paid:1160000,mgr:'AG',kon:'TM',st:'done',br:'B1',mont:'09-19',podr:['P1','P5'],d:'08-18'}
].map(o=>({...o,mont:o.mont?D(o.mont):null,d:D(o.d),log:[],wa:[]}));
const OR=id=>ORDERS.find(o=>o.id===id);

/* Чек-листы этапов — шаблоны по типу изделия */
const CHK={
 m:{n:'Менеджер → конструктору',items:['Все изделия указаны','Количество изделий указано','Материалы утверждены','Фасады утверждены','Фурнитура утверждена','Встроенная техника указана','Мойка и смеситель указаны','Столешница указана','Освещение указано','Декоративные элементы указаны','Особые требования клиента указаны','Фото объекта загружены','Эскиз загружен','Коммуникации проверены','ТЗ строителям сформировано']},
 kitchen:{n:'Конструктор · кухня',items:['Контрольный замер: стены, углы, коммуникации','Привязка техники по паспортам','Схема мойки, вытяжки, розеток','Карта раскроя ЛДСП','Кромка по деталям','Спецификация фурнитуры: петли, ящики, подъёмники','Фасады: тип, цвет — подрядчик отмечен','Столешница: материал и раскрой — подрядчик отмечен','Чертежи сборки для цеха','Заявка на склад сформирована']},
 wardrobe:{n:'Конструктор · шкаф, гардероб',items:['Замер ниши: перепады пола и потолка','Система дверей: профиль, количество полотен','Стекло или зеркало — подрядчик отмечен','Наполнение: штанги, ящики, полки','Карта раскроя ЛДСП','Кромка по деталям','Спецификация фурнитуры','Чертежи сборки для цеха','Заявка на склад сформирована']},
 other:{n:'Конструктор · прочее изделие',items:['Контрольный замер','Чертёж общего вида согласован','Металл, камень, шпон — подрядчики отмечены','Карта раскроя ЛДСП','Кромка по деталям','Спецификация фурнитуры','Чертежи сборки для цеха','Заявка на склад сформирована']}
};
ORDERS.forEach(o=>{const si=STI(o.st);o.chM=CHK.m.items.map((x,i)=>si>STI('dog')?1:o.st==='dog'?(i<11?1:0):0);if(o.id==='К-1507')o.chM=[1,1,1,1,1,0,0,1,1,1,1,1,1,0,0];
 const n=CHK[o.kind].items.length;o.chK=Array(n).fill(0).map((x,i)=>si>=STI('kd')?1:o.st==='zam2'?(o.kst==='spec'?(i<n-2?1:0):o.kst==='agree'?(i<4?1:0):(i<2?1:0)):0)});
const KST=[['zamer','Замер'],['draw','Техпроект'],['agree','Изменения клиента'],['spec','Спецификация и раскрой'],['moder','На модерации'],['sent','Запущено']];

/* Работы подрядчиков по заказам */
const JOBS=[
 {id:'J1',ord:'К-1501',p:'P1',w:'Распил ЛДСП Egger W1000 · 18 листов, кромка ПВХ 2 мм',sent:'09-29',due:'10-02',st:'done',sum:134000,paid:134000,docs:['Карта раскроя.pdf','Кромка по деталям.xlsx']},
 {id:'J2',ord:'К-1501',p:'P2',w:'Покраска 14 фасадов МДФ · RAL 9010 мат',sent:'10-02',due:'10-09',st:'work',sum:168000,paid:0,docs:['Фасады — размеры.pdf']},
 {id:'J3',ord:'К-1501',p:'P4',w:'Столешница кварц 3,4 м + остров, вырез под мойку',sent:'09-30',due:'10-12',st:'work',sum:520000,paid:260000,docs:['Шаблон столешницы.pdf','Мойка — паспорт.pdf']},
 {id:'J4',ord:'К-1503',p:'P1',w:'Распил ЛДСП Kronospan дуб сонома · 7 листов',sent:'09-26',due:'10-01',st:'done',sum:42000,paid:42000,docs:['Карта раскроя.pdf']},
 {id:'J5',ord:'К-1503',p:'P5',w:'Зеркало серебро 4 мм · 2 полотна 2350×780',sent:'09-26',due:'10-02',st:'work',sum:68000,paid:34000,docs:['Размеры полотен.pdf']},
 {id:'J6',ord:'К-1503',p:'P6',w:'Профиль купе, 2 двери, направляющие',sent:'09-29',due:'10-06',st:'work',sum:145000,paid:0,docs:['Схема дверей.pdf']},
 {id:'J7',ord:'К-1502',p:'P1',w:'Распил ЛДСП Egger · 11 листов, кромка',sent:'09-22',due:'09-26',st:'done',sum:86000,paid:86000,docs:['Карта раскроя.pdf']},
 {id:'J8',ord:'К-1509',p:'P3',w:'Металлокаркас ресепшн 2,8 м · порошковая покраска',sent:'10-03',due:'10-14',st:'work',sum:380000,paid:0,docs:['Каркас — чертёж.pdf']},
 {id:'J9',ord:'К-1509',p:'P1',w:'Распил ЛДСП Egger W980 · 9 листов',sent:'10-05',due:'10-08',st:'sent',sum:68000,paid:0,docs:['Карта раскроя.pdf']},
 {id:'J10',ord:'К-1510',p:'P1',w:'Распил и кромка · 6 листов',sent:'09-19',due:'09-23',st:'done',sum:44000,paid:44000,docs:['Карта раскроя.pdf']},
 {id:'J11',ord:'К-1505',p:'P6',w:'Алюминиевые фасады со стеклом · 4 шт',sent:'09-12',due:'09-24',st:'done',sum:210000,paid:120000,docs:['Фасады.pdf']},
 {id:'J12',ord:'К-1493',p:'P4',w:'Столешница акрил 3,2 м',sent:'09-05',due:'09-18',st:'done',sum:310000,paid:310000,docs:['Шаблон.pdf']}
].map(j=>({...j,sent:D(j.sent),due:D(j.due)}));
const jLate=j=>j.st!=='done'&&j.due<TODAY;

/* Склад: ячейки хранения, остаток, резерв под заказы */
const STOCK=[
 {id:'S1',g:'Листовые',n:'ЛДСП Egger W1000 ST9 белый премиум · 2800×2070×16',art:'EG-W1000-16',cell:'А-01',q:24,u:'лист',res:9,min:10,pr:24800,sup:'«Мебельные материалы KZ»'},
 {id:'S2',g:'Листовые',n:'ЛДСП Egger W980 платиново-белый · 16 мм',art:'EG-W980-16',cell:'А-02',q:6,u:'лист',res:9,min:8,pr:23900,sup:'«Мебельные материалы KZ»'},
 {id:'S3',g:'Листовые',n:'ЛДСП Kronospan дуб сонома · 16 мм',art:'KR-K016-16',cell:'А-03',q:14,u:'лист',res:0,min:6,pr:17600,sup:'«ДСП-Центр»'},
 {id:'S4',g:'Листовые',n:'МДФ 19 мм под покраску · 2800×2070',art:'MDF-19',cell:'А-05',q:11,u:'лист',res:4,min:6,pr:21500,sup:'«ДСП-Центр»'},
 {id:'S5',g:'Листовые',n:'ХДФ белый 3 мм · задняя стенка',art:'HDF-3W',cell:'А-07',q:30,u:'лист',res:6,min:10,pr:4900,sup:'«ДСП-Центр»'},
 {id:'S6',g:'Кромка',n:'Кромка ПВХ 2×19 белая W1000',art:'ED-2-W1000',cell:'Б-01',q:640,u:'м',res:180,min:300,pr:95,sup:'«Мебельные материалы KZ»'},
 {id:'S7',g:'Кромка',n:'Кромка ПВХ 0,4×19 дуб сонома',art:'ED-04-K016',cell:'Б-02',q:220,u:'м',res:0,min:200,pr:38,sup:'«ДСП-Центр»'},
 {id:'S8',g:'Фурнитура',n:'Петля Blum Clip Top Blumotion 110° накладная',art:'71B3550',cell:'Ф-03',q:186,u:'шт',res:42,min:100,pr:2350,sup:'«Blum Казахстан»'},
 {id:'S9',g:'Фурнитура',n:'Петля Hettich Sensys 110° с доводчиком',art:'9091749',cell:'Ф-04',q:64,u:'шт',res:0,min:60,pr:1980,sup:'«Hettich Алматы»'},
 {id:'S10',g:'Фурнитура',n:'Ящик Blum Legrabox M 500 мм антрацит',art:'770M5002S',cell:'Ф-11',q:4,u:'компл',res:6,min:6,pr:31500,sup:'«Blum Казахстан»'},
 {id:'S11',g:'Фурнитура',n:'Ящик Blum Tandembox antaro 450 мм белый',art:'378M4502SA',cell:'Ф-12',q:15,u:'компл',res:4,min:6,pr:19800,sup:'«Blum Казахстан»'},
 {id:'S12',g:'Фурнитура',n:'Подъёмник Blum Aventos HK-S',art:'20K2E01',cell:'Ф-15',q:7,u:'компл',res:3,min:4,pr:18400,sup:'«Blum Казахстан»'},
 {id:'S13',g:'Фурнитура',n:'Ножка регулируемая 100 мм + цоколь',art:'LEG-100',cell:'Ф-20',q:260,u:'шт',res:48,min:120,pr:180,sup:'«Фурнитура-Опт»'},
 {id:'S14',g:'Фурнитура',n:'Навес Camar 807 для навесных шкафов',art:'807.21',cell:'Ф-21',q:58,u:'пара',res:16,min:40,pr:650,sup:'«Фурнитура-Опт»'},
 {id:'S15',g:'Фурнитура',n:'Профиль Gola горизонтальный, чёрный, 4 м',art:'GOLA-H-B',cell:'Ф-24',q:9,u:'шт',res:4,min:6,pr:14200,sup:'«Фурнитура-Опт»'},
 {id:'S16',g:'Фурнитура',n:'Штанга овальная хром + держатели',art:'RAIL-OV',cell:'Ф-27',q:36,u:'компл',res:2,min:10,pr:1450,sup:'«Hettich Алматы»'}
];
const SK=id=>STOCK.find(s=>s.id===id);

/* Заявки на склад из карточек — формирует конструктор, работает закупщик */
const REQS=[
 {ord:'К-1509',by:'AR',d:'10-04',st:'new',lines:[['S2',9],['S6',140],['S8',24],['S10',6],['S13',16],['S5',3]]},
 {ord:'К-1501',by:'TM',d:'09-29',st:'done',lines:[['S1',18],['S6',180],['S8',42],['S11',4],['S12',3],['S15',4],['S13',32],['S14',16]]},
 {ord:'К-1503',by:'AR',d:'09-26',st:'done',lines:[['S3',7],['S7',90],['S16',2]]}
].map(r=>({...r,d:D(r.d)}));

/* Деньги октября */
const CASH=[
 ['10-01','in','Предоплата К-1509 · ТОО «Офис-Плюс»',1150000,'Заказы'],
 ['10-01','out','Аренда цеха',1200000,'Аренда'],['10-01','out','Аренда офиса и шоурума',350000,'Аренда'],
 ['10-02','in','Остаток К-1498 · Сейтова',580000,'Заказы'],
 ['10-02','out','«Раскрой-Центр» · К-1501',134000,'Подрядчики'],['10-02','out','«Blum Казахстан» · фурнитура',486000,'Материалы'],
 ['10-03','out','«Stone Line» · аванс К-1501',260000,'Подрядчики'],['10-03','out','Вода, чай, кофе',24000,'Административные'],
 ['10-03','out','Уборка офиса и цеха · месяц',60000,'Административные'],['10-04','out','Ремонт кондиционера в цеху',45000,'Административные'],
 ['10-04','out','Битрикс24 и МойСклад · подписки',108000,'Подписки'],['10-04','in','Предоплата К-1513 · Тлеуова',320000,'Заказы'],
 ['10-05','out','Принтер для конструкторов',89000,'Административные'],['10-05','out','«Стекло-Мастер» · аванс К-1503',34000,'Подрядчики']
].map(x=>({d:D(x[0]),k:x[1],n:x[2],s:x[3],c:x[4]}));

const SAL=[
 {n:'Айгерим',r:'Менеджер',ok:350000,pc:0},{n:'Дина',r:'Менеджер',ok:350000,pc:0},{n:'Максат',r:'Менеджер',ok:330000,pc:0},{n:'Ольга',r:'Менеджер',ok:330000,pc:0},
 {n:'Тимур',r:'Конструктор',ok:400000,pc:120000},{n:'Сауле',r:'Конструктор',ok:380000,pc:90000},{n:'Артём',r:'Конструктор',ok:380000,pc:60000},
 {n:'Сергей',r:'Бригада 1',ok:150000,pc:310000},{n:'Алмас',r:'Бригада 1',ok:150000,pc:260000},{n:'Руслан',r:'Бригада 2',ok:150000,pc:240000},{n:'Даурен',r:'Бригада 2',ok:150000,pc:220000},{n:'Виктор',r:'Бригада 3',ok:150000,pc:280000},{n:'Нурик',r:'Бригада 3',ok:150000,pc:190000}
];
const MONTHS=[['Июнь',11,19800000],['Июль',9,16400000],['Август',13,23100000],['Сентябрь',12,21600000]];
const LEAVE=[['AR','Артём','10-13','10-17'],['B2','Руслан (бригада 2)','10-20','10-24']].map(x=>({k:x[0],n:x[1],a:D(x[2]),b:D(x[3])}));

/* ===== Общие ===== */
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const stg=k=>{const s=STN(k);return `<span class="stg" style="--sc:${s.c}">${s.n}</span>`};
const KIND={kitchen:'Кухня',wardrobe:'Шкаф / гардероб',other:'Другое изделие'};
const ready=o=>{const s=STN(o.st);if(o.st!=='podr')return s.r;const J=JOBS.filter(j=>j.ord===o.id);return s.r+Math.round((J.filter(j=>j.st==='done').length/Math.max(1,J.length))*15)};
const rbar=o=>`<div class="rd"><span><i style="width:${ready(o)}%"></i></span><b>${ready(o)} %</b></div>`;
const debt=o=>STI(o.st)>STI('dog')?o.sum-o.paid:0;
const jobsOf=id=>JOBS.filter(j=>j.ord===id);
const coDebt=p=>JOBS.filter(j=>j.p===p&&j.st!=='sent').reduce((a,j)=>a+j.sum-j.paid,0);
const inWork=()=>ORDERS.filter(o=>!['lead','done'].includes(o.st));
const SC={};

function hot(){const F=[];
 JOBS.filter(jLate).forEach(j=>F.push({lv:'bad',t:`${CO(j.p).n} просрочил ${daysBetween(j.due,TODAY)} дн. · ${j.ord}`,s:`${j.w} · срок был ${dd(j.due)}, монтаж у клиента ${dd(OR(j.ord).mont)}`,go:`go('contractors')`}));
 STOCK.filter(s=>s.q-s.res<0).forEach(s=>F.push({lv:'bad',t:`Не хватает на складе: ${s.n.split(' · ')[0]}`,s:`есть ${s.q} ${s.u}, в резерве под заказы ${s.res} — дозаказать ${s.res-s.q}`,go:`go('requests')`}));
 ORDERS.filter(o=>o.st==='dog'&&o.chM.some(x=>!x)).forEach(o=>F.push({lv:'warn',t:`${o.id}: чек-лист менеджера не закрыт`,s:`${STAFF[o.mgr]} · ${o.chM.filter(x=>!x).length} пункта — карточка не уйдёт конструктору`,go:`openOrd('${o.id}')`}));
 ORDERS.filter(o=>o.st==='wait').forEach(o=>F.push({lv:'warn',t:`${o.id} готов и ждёт монтажа на складе`,s:`${CL(o.cl).n} · монтаж ${dd(o.mont)} · менеджеру ушло уведомление`,go:`openOrd('${o.id}')`}));
 ORDERS.filter(o=>o.st==='done'&&debt(o)>0).forEach(o=>F.push({lv:'warn',t:`${CL(o.cl).n} должен ${tg(debt(o))}`,s:`${o.id} сдан ${dd(o.mont)}, остаток не оплачен`,go:`go('debts')`}));
 return F}

/* ===== Собственник ===== */
SC.today=()=>{const W=inWork();const F=hot();const debts=ORDERS.reduce((a,o)=>a+debt(o),0);const cd=CONTR.reduce((a,c)=>a+coDebt(c.id),0);
 const inn=CASH.filter(c=>c.k==='in').reduce((a,c)=>a+c.s,0),out=CASH.filter(c=>c.k==='out').reduce((a,c)=>a+c.s,0);
 return `<div class="hd"><div><h2>Пульт · ${dd(TODAY)}, ${dayOf(TODAY)}</h2><p>Все заказы — на каком этапе и насколько готовы, что горит у подрядчиков и на складе, деньги месяца. Вместо восемнадцати Google-таблиц — одна система.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('funnel')"><small>Заказов в работе</small><b>${W.length}</b><span>на ${mln(W.reduce((a,o)=>a+o.sum,0))}</span></div>
  <div class="clk" onclick="go('contractors')"><small>У подрядчиков</small><b class="w">${JOBS.filter(j=>j.st!=='done').length}</b><span>${JOBS.filter(jLate).length} просрочено</span></div>
  <div class="clk" onclick="go('debts')"><small>Клиенты должны</small><b class="a">${mln(debts)}</b><span>остатки по договорам</span></div>
  <div class="clk" onclick="go('debts')"><small>Мы должны подрядчикам</small><b class="r">${mln(cd)}</b><span>за принятые и в работе</span></div>
  <div class="clk" onclick="go('money')"><small>Октябрь: пришло / ушло</small><b>${mln(inn)} / ${mln(out)}</b><span>с 1 октября</span></div>
 </div>
 <div class="g21">
  <div class="pan"><h3>Заказы и готовность</h3><div class="tw"><table class="t"><thead><tr><th>Заказ</th><th>Клиент</th><th>Этап</th><th style="width:170px">Готовность</th><th>Монтаж</th><th class="r">Сумма</th></tr></thead><tbody>
  ${W.sort((a,b)=>STI(b.st)-STI(a.st)).map(o=>`<tr class="clk" onclick="openOrd('${o.id}')"><td><b>${o.id}</b><div class="sub">${KIND[o.kind]}</div></td><td>${esc(CL(o.cl).n)}</td><td>${stg(o.st)}</td><td>${rbar(o)}</td><td class="mono">${o.mont?dd(o.mont):'—'}</td><td class="r mono">${fmt(o.sum)}</td></tr>`).join('')}</tbody></table></div></div>
  <div class="pan hot"><h3>Горит · ${F.length}</h3>${F.map(f=>`<div class="rf ${f.lv}" onclick="${f.go}"><i></i><div><b>${f.t}</b><span>${f.s}</span></div></div>`).join('')}</div>
 </div>
 <div class="pan"><h3>Воронка сейчас</h3><div class="fl">${ST.filter(s=>s.k!=='done').map(s=>{const n=ORDERS.filter(o=>o.st===s.k).length;return `<div onclick="go('funnel')" style="--sc:${s.c}"><b>${n}</b><span>${s.n}</span></div>`}).join('')}</div></div>
 ${said('«У меня около восемнадцати Google-таблиц, которые отвечают за свои определённые действия: долги клиентов, учёт подрядчиков, расчётник, зарплаты, приходы и расходы».')}`};

SC.money=()=>{const cats=[...new Set(CASH.filter(c=>c.k==='out').map(c=>c.c))];const out=CASH.filter(c=>c.k==='out');const tot=out.reduce((a,c)=>a+c.s,0);
 return `<div class="hd"><div><h2>Приходы и расходы · октябрь</h2><p>Оплаты клиентов и подрядчикам попадают сюда из карточек заказов сами. Административные расходы — чай, кофе, вода, уборка, кондиционер, техника, аренда — вносятся одной строкой и тоже видны.</p></div><div class="btns"><button class="bt p" onclick="card('cash')">+ Расход</button></div></div>
 <div class="g2"><div class="pan"><h3>Расходы по статьям</h3>${cats.map(c=>{const s=out.filter(x=>x.c===c).reduce((a,x)=>a+x.s,0);return `<div class="hb"><span>${c}</span><i style="width:${pct(s,tot)}%"></i><b class="mono">${fmt(s)}</b></div>`}).join('')}</div>
 <div class="pan"><h3>Подписки, которые уйдут</h3><div class="kv"><span>Битрикс24 и МойСклад</span><b class="mono neg">108 000 ₸ в месяц</b></div><div class="kv"><span>За год</span><b class="mono neg">1 296 000 ₸</b></div><div class="kv"><span>Своя система: сервер</span><b class="mono">до 10 000 ₸ в месяц</b></div><div class="kv"><span>WhatsApp, казахстанский провайдер</span><b class="mono">≈ 5 000 ₸ за номер</b></div>${said('«Мы на Битриксе и на Моём складе каждый месяц платим абонентскую плату… они каждый год поднимают цены».')}</div></div>
 <div class="tw"><table class="t"><thead><tr><th>Дата</th><th>Статья</th><th>Что</th><th class="r">Приход</th><th class="r">Расход</th></tr></thead><tbody>${CASH.slice().reverse().map(c=>`<tr><td class="mono">${dd(c.d)}</td><td><span class="tag ${c.c==='Административные'?'w':c.c==='Заказы'?'g':''}">${c.c}</span></td><td>${esc(c.n)}</td><td class="r mono pos">${c.k==='in'?fmt(c.s):''}</td><td class="r mono neg">${c.k==='out'?fmt(c.s):''}</td></tr>`).join('')}</tbody></table></div>
 ${said('«Есть ещё административные расходы: чай, кофе, вода, кондиционер, уборка, покупка оборудования какого-то — чтобы это тоже где-то фиксировалось, аренда».')}`};

SC.debts=()=>{const O=ORDERS.filter(o=>debt(o)>0).sort((a,b)=>STI(b.st)-STI(a.st));
 return `<div class="hd"><div><h2>Долги клиентов и подрядчикам</h2><p>Слева — кто из клиентов сколько должен и на каком этапе заказ. Справа — сколько мы должны каждому подрядчику: цена фиксируется, когда конструктор передал работу, оплаты вычитаются.</p></div></div>
 <div class="g2"><div class="pan"><h3>Клиенты · ${tg(O.reduce((a,o)=>a+debt(o),0))}</h3><div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Заказ</th><th>Этап</th><th class="r">Долг</th></tr></thead><tbody>${O.map(o=>`<tr class="clk ${o.st==='done'?'rowbad':''}" onclick="openOrd('${o.id}')"><td>${esc(CL(o.cl).n)}</td><td>${o.id}</td><td>${stg(o.st)}</td><td class="r mono">${fmt(debt(o))}</td></tr>`).join('')}</tbody></table></div><p class="mini">Красная строка — заказ сдан, остаток не оплачен.</p></div>
 <div class="pan"><h3>Подрядчики · ${tg(CONTR.reduce((a,c)=>a+coDebt(c.id),0))}</h3><div class="tw"><table class="t"><thead><tr><th>Подрядчик</th><th class="r">Начислено</th><th class="r">Оплачено</th><th class="r">Должны</th></tr></thead><tbody>${CONTR.filter(c=>JOBS.some(j=>j.p===c.id)).map(c=>{const J=JOBS.filter(j=>j.p===c.id&&j.st!=='sent');const s=J.reduce((a,j)=>a+j.sum,0),p=J.reduce((a,j)=>a+j.paid,0);return `<tr class="clk" onclick="curCo='${c.id}';go('contractor')"><td><b>${esc(c.n)}</b><div class="sub">${esc(c.w)}</div></td><td class="r mono">${fmt(s)}</td><td class="r mono">${fmt(p)}</td><td class="r mono ${s-p?'neg':''}">${fmt(s-p)}</td></tr>`}).join('')}</tbody></table></div></div></div>
 ${said('«Чтобы конструктор зафиксировал цену — и мы сразу увидели, сколько какому подрядчику денег должны, сколько уже оплатили, какое у нас с ним сальдо».')}`};

SC.salary=()=>`<div class="hd"><div><h2>Зарплаты · октябрь</h2><p>Оклад плюс сдельная часть: бригадам — за собранные и смонтированные заказы, конструкторам — за сданные проекты. Сдельная часть считается из карточек, а не в отдельной таблице.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Сотрудник</th><th>Роль</th><th class="r">Оклад</th><th class="r">Сдельно</th><th>Откуда сдельная</th><th class="r">Итого</th></tr></thead><tbody>${SAL.map(s=>`<tr><td><b>${s.n}</b></td><td>${s.r}</td><td class="r mono">${fmt(s.ok)}</td><td class="r mono">${s.pc?fmt(s.pc):'—'}</td><td class="mini">${s.r.startsWith('Бригада')?'сборка и монтаж: К-1505, К-1510, К-1502':s.r==='Конструктор'?'проекты, переданные в производство':'—'}</td><td class="r mono"><b>${fmt(s.ok+s.pc)}</b></td></tr>`).join('')}
 <tr class="total"><td colspan="5">Итого начислено</td><td class="r mono">${fmt(SAL.reduce((a,s)=>a+s.ok+s.pc,0))}</td></tr></tbody></table></div>
 <div class="note"><b>Менеджерам — без бонуса за продажу</b><p>Как сейчас: заказы приходят по сарафану, менеджер их прорабатывает. Если решите ввести процент за сданный в срок заказ — он добавляется правилом.</p></div>
 <div class="note" style="--tone:var(--muted)"><b>Доступ</b><p>Зарплаты видит только собственник. Сборщик видит только свой заказ, кладовщик — только склад.</p></div>`;

SC.analytics=()=>{const mx=Math.max(...MONTHS.map(m=>m[2]));
 return `<div class="hd"><div><h2>Аналитика</h2><p>Сколько заказов и на какую сумму, откуда клиенты, сколько дней от договора до монтажа, кто из подрядчиков срывает сроки.</p></div></div>
 <div class="wid"><div><small>Заказов в сентябре</small><b>12</b><span>на 21,6 млн ₸</span></div><div><small>Средний чек</small><b class="a">1,8 млн</b><span>кухня — 2,6 млн</span></div><div><small>Замер → договор</small><b>64 %</b><span>конверсия</span></div><div><small>Договор → монтаж</small><b>34 дня</b><span>в среднем</span></div><div><small>Подрядчики в срок</small><b class="w">81 %</b><span>«Стекло-Мастер» — 62 %</span></div></div>
 <div class="g2"><div class="pan"><h3>Выручка по месяцам</h3><div class="bars">${MONTHS.map(m=>`<div><b>${mln(m[2])}</b><i style="height:${Math.round(m[2]/mx*130)}px"></i><span>${m[0]}<br><small>${m[1]} заказов</small></span></div>`).join('')}</div></div>
 <div class="pan"><h3>Откуда клиенты</h3>${[['Сарафан',62],['Повторные',21],['Instagram',9],['2ГИС',8]].map(x=>`<div class="hb"><span>${x[0]}</span><i style="width:${x[1]}%"></i><b class="mono">${x[1]} %</b></div>`).join('')}<h3 style="margin-top:14px">Где заказы стоят дольше всего</h3>${[['У подрядчиков',11],['Конструкторская документация',7],['Готово · ждёт монтажа',5],['Сборка в цеху',4]].map(x=>`<div class="hb"><span>${x[0]}</span><i style="width:${x[1]*8}%;background:var(--warn)"></i><b class="mono">${x[1]} дн.</b></div>`).join('')}</div></div>`};

/* ===== Продажи ===== */
const myOrders=()=>role==='Менеджер'?ORDERS.filter(o=>o.mgr==='AG'):ORDERS;
SC.funnel=()=>{const L=myOrders();
 return `<div class="hd"><div><h2>Воронка заказов${role==='Менеджер'?' · мои':''}</h2><p>Этапы по вашему ТЗ: новая заявка → сбор информации → первичная отрисовка → корректировка → согласование → договор → замер и техпроект → модерация менеджером → запуск → производство и подрядчики → сборка → готово к вывозу → доставка и монтаж → качество и АВР → оплата → закрыт. Одна карточка проекта на весь путь, шкала готовности на каждой.</p></div><div class="btns"><button class="bt p" onclick="card('newlead')">+ Заявка</button></div></div>
 <div class="kb">${ST.map(s=>{const X=L.filter(o=>o.st===s.k);return `<div class="kc" style="--sc:${s.c}"><div class="kh"><b>${s.n}</b><span>${X.length}</span></div>${X.map(o=>`<div class="kd ${jobsOf(o.id).some(jLate)?'alarm':''}" onclick="openOrd('${o.id}')"><div class="kt"><b>${o.id}</b><span class="tag">${KIND[o.kind]}</span></div><div class="kr">${esc(CL(o.cl).n)}</div><div class="km">${esc(o.t)}</div>${rbar(o)}<div class="kf"><span>${STAFF[o.mgr]}${o.kon?' · '+STAFF[o.kon]:''}</span><b class="mono">${mln(o.sum)}</b></div></div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>
 ${said('«Нужно, чтобы эта карточка дальше двигалась по этапам и этапы были разграничены: продажа, после договора — дизайнеры и конструкторы, потом снабжение и подрядные работы, сборка и монтаж».')}`};

function openOrd(id){if(!allowed('order')){toast('Карточка заказа этой роли недоступна.');return}curOrd=id;go('order')}
function zoneChk(o){const z=STN(o.st).z;if(z==='m')return {k:'m',key:'chM',L:CHK.m};if(z==='k')return {k:o.kind,key:'chK',L:CHK[o.kind]};return null}
SC.order=()=>{const o=OR(curOrd)||ORDERS[0];const c=CL(o.cl);const si=STI(o.st);const z=zoneChk(o);const J=jobsOf(o.id);const R=REQS.find(r=>r.ord===o.id);const blk=nextBlock(o);
 return `<div class="hd"><div><div class="crumb"><a onclick="go('funnel')">Воронка</a> / ${o.id}</div><h2>${o.id} · ${esc(o.t)}</h2><p>${esc(c.n)} · ${esc(c.addr)} · менеджер ${STAFF[o.mgr]}${o.kon?' · конструктор '+STAFF[o.kon]:''}${o.br?' · '+BRIG[o.br].n:''}</p></div>
  <div class="btns">${si<=STI('agree')?`<button class="bt" onclick="card('lostq','${o.id}')">Отказ</button>`:''}${o.st!=='done'?`<button class="bt ${blk?'':'p'}" onclick="nextSt('${o.id}')">→ ${ST[si+1].n}</button>`:''}</div></div>
 <div class="stp">${ST.map((s,i)=>`<div class="${i<si?'ok':i===si?'on':''}" style="--sc:${s.c}" title="${s.n}"><i>${i<si?'✓':i+1}</i><span>${s.n}</span></div>`).join('')}</div>
 <div class="rdbig">${rbar(o)}<span>готовность заказа</span></div>
 ${blk?`<div class="note" style="--tone:var(--bad)"><b>Дальше не двигается: ${blk}</b><p>Так задумано: пока ответственный не прошёл свой чек-лист или не выполнено условие этапа, карточка стоит.</p></div>`:''}
 <div class="g3">
  <div class="pan"><h3>Клиент</h3><div class="kv"><span>Имя</span><b class="lk" onclick="card('cl','${c.id}')">${esc(c.n)}</b></div><div class="kv"><span>Телефон</span><b class="mono">${c.ph}</b></div><div class="kv"><span>Откуда</span><b>${c.src}</b></div>${c.note!=='—'?`<div class="pin">${esc(c.note)}</div>`:''}</div>
  <div class="pan"><h3>Деньги</h3><div class="kv"><span>Сумма договора</span><b class="mono">${fmt(o.sum)}</b></div><div class="kv"><span>Оплачено</span><b class="mono pos">${fmt(o.paid)}</b></div><div class="kv"><span>Остаток</span><b class="mono ${o.sum-o.paid?'neg':''}">${fmt(o.sum-o.paid)}</b></div><div class="kv"><span>Подрядчикам</span><b class="mono">${fmt(J.reduce((a,j)=>a+j.sum,0))}</b></div>${o.sum>o.paid&&si>=STI('dog')?`<button class="bt sm" onclick="payOrd('${o.id}')">Отметить оплату</button>`:''}</div>
  <div class="pan"><h3>Документы</h3>${[['Эскиз и 3D',si>=STI('sketch')],['КП',si>=STI('sketch')],['Договор',si>=STI('dog')?(o.paid?'подписан':'отправлен на ЭЦП'):0],['Чертежи для цеха',si>STI('kd')],['Акт сдачи',o.st==='done']].map(d=>`<div class="kv"><span>${d[0]}</span><b>${d[1]?`<span class="tag g">${d[1]===true?'есть':d[1]}</span>`:'<span class="tag">—</span>'}</b></div>`).join('')}<button class="bt sm" onclick="go('kp')">КП и договор →</button></div>
 </div>
 ${z?`<div class="pan"><h3>Чек-лист: ${z.L.n} · ${o[z.key].filter(Boolean).length} из ${z.L.items.length}</h3><div class="chk">${z.L.items.map((x,i)=>`<div class="ci"><span class="bx ${o[z.key][i]?'on':''}" onclick="togChk('${o.id}','${z.key}',${i})">${o[z.key][i]?'✓':''}</span><span class="nm">${esc(x)}</span><span class="who">${z.key==='chM'?STAFF[o.mgr]:STAFF[o.kon]||'конструктор'}</span></div>`).join('')}</div></div>`:''}
 ${STN(o.st).z==='k'?`<div class="pan"><h3>Подрядчики по этому заказу — отмечает конструктор</h3><div class="cog">${CONTR.map(p=>`<label class="coc ${o.podr.includes(p.id)?'on':''}"><input type="checkbox" ${o.podr.includes(p.id)?'checked':''} onchange="togPodr('${o.id}','${p.id}')"><b>${esc(p.n)}</b><span>${esc(p.w)}</span></label>`).join('')}</div><p class="mini">Когда конструктор закроет чек-лист и передаст в производство, на доске каждого отмеченного подрядчика появится своя карточка с документами и сроком.</p></div>`:''}
 ${J.length?`<div class="pan"><h3>Подрядчики · ${J.filter(j=>j.st==='done').length} из ${J.length} сдали</h3><div class="tw"><table class="t"><thead><tr><th>Подрядчик</th><th>Работа</th><th>Передано</th><th>Срок</th><th>Статус</th><th class="r">Цена</th><th class="r">Оплачено</th></tr></thead><tbody>${J.map(j=>`<tr class="${jLate(j)?'rowbad':''}"><td><b>${esc(CO(j.p).n)}</b></td><td>${esc(j.w)}</td><td class="mono">${dd(j.sent)}</td><td class="mono">${dd(j.due)}</td><td>${jst(j)}</td><td class="r mono">${j.sum?fmt(j.sum):'свои'}</td><td class="r mono">${fmt(j.paid)}</td></tr>`).join('')}</tbody></table></div></div>`:''}
 ${R?`<div class="pan"><h3>Заявка на склад · ${R.st==='done'?'<span class="tag g">отгружено</span>':'<span class="tag w">ждёт склад</span>'}</h3>${R.lines.map(([s,q])=>`<div class="kv"><span>${esc(SK(s).n)} · ячейка ${SK(s).cell}</span><b class="mono">${q} ${SK(s).u}</b></div>`).join('')}</div>`:''}
 ${ordExtra(o)}
 <div class="g2"><div class="pan"><h3>WhatsApp с клиентом</h3>${waThread(o).slice(-3).map(m=>`<div class="msg ${m[0]}"><small>${m[1]}</small>${esc(m[2])}</div>`).join('')}<button class="bt sm" onclick="curOrd='${o.id}';go('wa')">Вся переписка →</button></div>
 <div class="pan"><h3>Ход заказа</h3><div class="tl">${ordLog(o).map(x=>`<div class="tli ${x[2]||'ok'}"><span class="who">${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div></div></div>`};
const jst=j=>j.st==='done'?'<span class="tag g">сдал</span>':jLate(j)?`<span class="tag r">просрочка ${daysBetween(j.due,TODAY)} дн.</span>`:j.st==='work'?'<span class="tag w">в работе</span>':'<span class="tag i">передано</span>';
function ordLog(o){const si=STI(o.st);const L=[[dd(o.d)+' · '+STAFF[o.mgr],'Заявка: '+o.t]];ST.slice(1,si+1).forEach((s,i)=>L.push([dd(addDays(o.d,(i+1)*3)),s.n]));return L.slice(-7).concat(o.log)}
function nextBlock(o){const si=STI(o.st);const n=ST[si+1];if(!n)return '';
 if(o.st==='dog'&&o.chM.some(x=>!x))return 'чек-лист менеджера не закрыт — '+o.chM.filter(x=>!x).length+' пункта';
 if(o.st==='dog'&&!o.paid)return 'нет предоплаты';
 if(o.st==='zam2'&&o.chK.some(x=>!x))return 'техпроект не готов: чек-лист конструктора — '+o.chK.filter(x=>!x).length+' пункта';
 if(o.st==='kd'&&o.moder!=='final')return 'запуск запрещён: менеджер не подтвердил финальный технический проект';
 if(o.st==='kd'&&!o.podr.length)return 'конструктор не отметил подрядчиков';
 if(o.st==='start'&&o.pkg.some(x=>!x))return 'пакет запуска неполный — нет: '+PKG.filter((x,i)=>!o.pkg[i]).join(', ');
 if(o.st==='start'){const R=REQS.find(r=>r.ord===o.id);if(R&&R.st!=='done')return 'склад ещё не собрал заявку — закупщик отгружает или дозаказывает'}
 if(o.st==='podr'&&jobsOf(o.id).some(j=>j.st!=='done'))return 'не все подрядчики сдали работу: '+jobsOf(o.id).filter(j=>j.st!=='done').map(j=>CO(j.p).n).join(', ');
 if(o.st==='qa'&&!o.avr)return 'АВР не подписан клиентом';
 if(o.st==='pay'&&(o.paid<o.sum||!o.closed))return o.paid<o.sum?'остаток не оплачен: '+tg(o.sum-o.paid):'закрывающие документы не сданы';
 return ''}
function nextSt(id){const o=OR(id);const b=nextBlock(o);if(b){toast('Карточка не двигается: '+b+'.');return}
 const was=o.st;o.st=ST[STI(o.st)+1].k;let msg=`${o.id} → «${STN(o.st).n}».`;
 if(was==='kd'){o.pkg=o.pkg||PKG.map(()=>0);let n=0;o.podr.forEach(p=>{if(!JOBS.some(j=>j.ord===o.id&&j.p===p)){JOBS.push({id:'J'+(JOBS.length+1),ord:o.id,p,w:CO(p).w+' по '+o.id,sent:TODAY,due:addDays(TODAY,7),st:'sent',sum:0,paid:0,docs:['Чертежи '+o.id+'.pdf']});n++}});if(!REQS.some(r=>r.ord===o.id))REQS.unshift({ord:o.id,by:o.kon||'TM',d:TODAY,st:'new',lines:[['S1',8],['S6',90],['S8',18],['S13',12]]});msg+=` Карточка размножилась: ${o.podr.length} ${plural(o.podr.length,['подрядчик','подрядчика','подрядчиков'])} получили свои карточки, на склад ушла заявка.`}
 if(o.st==='wait')msg+=` Менеджеру ${STAFF[o.mgr]} пришло уведомление: «Заказ готов — сообщите клиенту и договоритесь о монтаже».`;
 if(o.st==='mont')msg+=' Создана задача доставки: водитель и ответственный менеджер.';
 if(o.st==='qa')msg+=' Создана задача контроля качества и АВР.';
 if(o.st==='pay')msg+=' АВР подписан — проект переведён в оплату.';
 if(o.st==='done')msg+=' Оплачено, документы закрыты — проект закрыт. Бригаде начислена сдельная часть.';
 if(o.st==='kd')msg+=' Техпроект отправлен менеджеру на модерацию.';
 if(o.st==='zam2')msg+=' Дата передачи зафиксирована, конструктору создана задача и пришёл пакет от менеджера.';
 o.log.push(['сейчас · '+ROLES[role].n,'Этап: '+STN(o.st).n]);render();toast(msg)}
function togChk(id,key,i){const o=OR(id);if(key==='chM'&&!['Собственник','Менеджер'].includes(role)){toast('Этот чек-лист отмечает менеджер.');return}if(key==='chK'&&!['Собственник','Конструктор'].includes(role)){toast('Этот чек-лист отмечает конструктор.');return}o[key][i]=o[key][i]?0:1;render()}
function togPodr(id,p){const o=OR(id);o.podr=o.podr.includes(p)?o.podr.filter(x=>x!==p):o.podr.concat(p);render()}
function payOrd(id){const o=OR(id);const s=Math.min(o.sum-o.paid,Math.round(o.sum/2));o.paid+=s;CASH.push({d:TODAY,k:'in',n:'Оплата '+o.id+' · '+CL(o.cl).n,s,c:'Заказы'});render();toast(`Оплата ${tg(s)} — в карточке, в «Приходах» и в долгах клиента.`)}

SC.clients=()=>`<div class="hd"><div><h2>Клиенты</h2><p>Клиент и все его заказы, оплаты, долг и переписка — в одной карточке.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Адрес</th><th>Откуда</th><th>Заказы</th><th class="r">Сумма</th><th class="r">Долг</th><th>Заметка</th></tr></thead><tbody>${CLIENTS.map(c=>{const O=ORDERS.filter(o=>o.cl===c.id);return `<tr class="clk" onclick="card('cl','${c.id}')"><td><b>${esc(c.n)}</b><div class="sub mono">${c.ph}</div></td><td>${esc(c.addr)}</td><td>${c.src}</td><td>${O.map(o=>o.id).join(', ')}</td><td class="r mono">${fmt(O.reduce((a,o)=>a+o.sum,0))}</td><td class="r mono ${O.reduce((a,o)=>a+debt(o),0)?'neg':''}">${fmt(O.reduce((a,o)=>a+debt(o),0))}</td><td class="mini nt">${c.note==='—'?'':esc(c.note)}</td></tr>`}).join('')}</tbody></table></div>`;

/* Калькулятор — по образцу вашей Google-таблицы */
const CALC={kind:'Кухня',ldsp:'S1',sh:10,edge:'S6',em:300,hdf:3,fac:'mdf',fm2:5.2,top:'quartz',tl:3,hinge:'S8',hq:20,box:'S10',bq:5,lift:2,legs:16,hang:8,gola:3,led:3,mark:35};
const FAC={ldsp:['ЛДСП, как корпус',0],mdf:['МДФ эмаль, своя малярка',38000],veneer:['Шпон «Шпон-Арт»',62000],alu:['Алюминий + стекло «AluSystem»',54000]};
const TOP={none:['Без столешницы',0],ldsp:['ЛДСП 38 мм',18000],acryl:['Акрил «Stone Line»',95000],quartz:['Кварц «Stone Line»',145000]};
function calcLines(){const C=CALC,s=k=>SK(C[k]);return [
 ['Корпус',s('ldsp').n,C.sh,'лист',s('ldsp').pr],['Кромка',s('edge').n,C.em,'м',s('edge').pr],['Задняя стенка',SK('S5').n,C.hdf,'лист',SK('S5').pr],
 ['Фасады',FAC[C.fac][0],C.fm2,'м²',FAC[C.fac][1]],['Столешница',TOP[C.top][0],C.top==='none'?0:C.tl,'м',TOP[C.top][1]],
 ['Петли',s('hinge').n,C.hq,'шт',s('hinge').pr],['Ящики',s('box').n,C.bq,'компл',s('box').pr],['Подъёмники',SK('S12').n,C.lift,'компл',SK('S12').pr],
 ['Ножки',SK('S13').n,C.legs,'шт',SK('S13').pr],['Навесы',SK('S14').n,C.hang,'пара',SK('S14').pr],['Профиль Gola',SK('S15').n,C.gola,'шт',SK('S15').pr],['Подсветка','LED-лента в профиле, 24 В',C.led,'м',9000],
 ['Распил и кромкование','«Раскрой-Центр», за лист',C.sh,'лист',6500],['Сборка и монтаж','бригада, сдельно',1,'',0],['Доставка','по Алматы',1,'',25000]]}
function calcTot(){const L=calcLines();let m=L.reduce((a,l)=>a+l[2]*l[4],0);const mont=Math.round(m*.12);m+=mont;return {mat:m-mont,mont,cost:m,price:Math.round(m*(1+CALC.mark/100)/1000)*1000}}
function setC(k,v){CALC[k]=isNaN(+v)?v:+v;render()}
SC.calc=()=>{const C=CALC,L=calcLines(),T=calcTot();const sel=(k,opts)=>`<select onchange="setC('${k}',this.value)">${opts.map(([v,n])=>`<option value="${v}" ${C[k]==v?'selected':''}>${esc(n)}</option>`).join('')}</select>`;const num=(k,st)=>`<input type="number" step="${st||1}" value="${C[k]}" onchange="setC('${k}',this.value)">`;const pick=g=>STOCK.filter(s=>s.g===g||g.includes(s.id)).map(s=>[s.id,s.n]);
 return `<div class="hd"><div><h2>Расчёт заказа</h2><p>Ваша Google-таблица внутри системы: менеджер проходит пункты, в каждом — свои варианты, цены подтягиваются из прайсов поставщиков по артикулу. Здесь 15 пунктов для примера — в вашей таблице около 50 пунктов и 200 вариантов, переносим все.</p></div><div class="btns"><button class="bt p" onclick="go('kp');toast('КП собрано из расчёта: позиции, материалы, сумма.')">Сформировать КП →</button></div></div>
 <div class="cg"><div class="pan"><div class="cform">
  <label>Изделие${sel('kind',[['Кухня','Кухня'],['Шкаф','Шкаф / гардероб'],['Другое','Другое']])}</label>
  <label>ЛДСП корпуса${sel('ldsp',pick(['S1','S2','S3']))}</label><label>Листов${num('sh')}</label>
  <label>Кромка${sel('edge',pick(['S6','S7']))}</label><label>Метров${num('em')}</label>
  <label>Задняя стенка ХДФ, листов${num('hdf')}</label>
  <label>Фасады${sel('fac',Object.entries(FAC).map(([k,v])=>[k,v[0]]))}</label><label>Площадь фасадов, м²${num('fm2',.1)}</label>
  <label>Столешница${sel('top',Object.entries(TOP).map(([k,v])=>[k,v[0]]))}</label><label>Длина, м${num('tl',.1)}</label>
  <label>Петли${sel('hinge',pick(['S8','S9']))}</label><label>Петель, шт${num('hq')}</label>
  <label>Ящики${sel('box',pick(['S10','S11']))}</label><label>Ящиков${num('bq')}</label>
  <label>Подъёмники Aventos${num('lift')}</label><label>Ножки${num('legs')}</label><label>Навесы, пар${num('hang')}</label><label>Gola, шт${num('gola')}</label><label>Подсветка, м${num('led',.5)}</label><label>Наценка, %${num('mark')}</label>
 </div></div>
 <div class="pan"><h3>Итог</h3><div class="wf"><div><span>Материалы и подрядчики</span><b>${fmt(T.mat)}</b></div><div><span>Сборка и монтаж · 12 %</span><b>${fmt(T.mont)}</b></div><div class="sep"><span>Себестоимость</span><b>${fmt(T.cost)}</b></div><div><span>Наценка ${C.mark} %</span><b>${fmt(T.price-T.cost)}</b></div><div class="tot"><span>Цена клиенту</span><b>${fmt(T.price)}</b></div></div><p class="mini">Прайсы обновлены 03.10: «Blum Казахстан», «Мебельные материалы KZ», «ДСП-Центр». Если у поставщика цена изменилась — расчёт пересчитается.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Пункт</th><th>Выбрано</th><th class="r">Кол-во</th><th class="r">Цена</th><th class="r">Сумма</th></tr></thead><tbody>${L.filter(l=>l[4]&&l[2]).map(l=>`<tr><td>${l[0]}</td><td>${esc(l[1])}</td><td class="r mono">${l[2]} ${l[3]}</td><td class="r mono">${fmt(l[4])}</td><td class="r mono">${fmt(l[2]*l[4])}</td></tr>`).join('')}</tbody></table></div>
 ${said('«Около пятидесяти пунктов надо выбрать, в каждом всплывающие варианты… петли бывают в двадцати вариантах… всё это подтягивается с других таблиц, где исходные данные от поставщиков».','Ирина: калькулятор лучше перенести на начальном этапе, чем потом отдельно.')}`};

SC.kp=()=>{const o=OR('К-1508'),T=calcTot();const d=OR('К-1507');
 return `<div class="hd"><div><h2>КП, договор, ЭЦП</h2><p>КП собирается из расчёта, договор — из карточки: клиент, изделие, сумма, сроки, график оплат. Подписать можно на бумаге (скан в карточку) или по ссылке через ЭЦП.</p></div></div>
 <div class="g2"><div class="pan"><h3>КП · ${o.id} · ${esc(CL(o.cl).n)}</h3><div class="doc"><div class="dh"><div class="dlg">КОРПУС<small>МЕБЕЛЬ НА ЗАКАЗ · АЛМАТЫ</small></div><div style="text-align:right;font-size:10px">КП № ${o.id}<br>${dd(TODAY)}.2026</div></div><h4>Коммерческое предложение</h4><p style="font-size:11px">${esc(o.t)} · ${esc(CL(o.cl).addr)}</p>${calcLines().filter(l=>l[4]&&l[2]).slice(0,8).map(l=>`<div class="drow"><span>${l[0]}</span><span>${esc(l[1].split(' · ')[0])}</span><span class="r">${l[2]} ${l[3]}</span></div>`).join('')}<div class="dsum"><span>Итого</span><span>${tg(T.price)}</span></div><div class="dfoot"><span>Срок изготовления — 30–35 рабочих дней. Предоплата 50 %, остаток — после монтажа.</span></div></div><div class="btns l" style="margin-top:10px"><button class="bt p" onclick="toast('КП отправлено клиенту в WhatsApp из карточки.')">Отправить в WhatsApp</button><button class="bt" onclick="go('calc')">Изменить расчёт</button></div></div>
 <div class="pan"><h3>Договор · ${d.id} · ${esc(CL(d.cl).n)}</h3>${[['Договор сформирован из карточки','ok'],['Отправлен клиенту ссылкой · 03.10','ok'],['Подпись клиента через ЭЦП (eGov / NCALayer)',d.paid?'ok':'wait'],['Подпись со стороны компании',d.paid?'ok':'wait'],['Счёт на предоплату 50 %',d.paid?'ok':'wait']].map(x=>`<div class="li ${x[1]==='ok'?'':'w'}"><i>${x[1]==='ok'?'✓':'…'}</i><span>${x[0]}</span></div>`).join('')}
  <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="signDog()">Клиент подписал ЭЦП</button><button class="bt" onclick="toast('Скан бумажного договора прикреплён к карточке.')">Бумажный — загрузить скан</button></div>
  <div class="note"><b>Сейчас — бумага</b><p>Оставляем оба способа: бумажный договор со сканом в карточке и подписание ЭЦП по ссылке для тех, кому удобно.</p></div></div></div>
 ${said('«КП, договор — чтобы всё в одной системе было» · «Пока что в бумажном виде с клиентом, хотелось бы тоже сделать возможность подписать в электронном виде».')}`};
function signDog(){const d=OR('К-1507');if(d.paid){toast('Уже подписан.');return}d.paid=Math.round(d.sum/2);d.chM[0]=1;d.chM[1]=1;CASH.push({d:TODAY,k:'in',n:'Предоплата К-1507 · Байжанов',s:d.paid,c:'Заказы'});render();toast('Договор К-1507 подписан ЭЦП, предоплата пришла — чек-лист менеджера обновился.')}

const WA={'К-1501':[['in','09:12','Добрый день! Когда будут фасады? Мы переезжаем 20-го'],['out','09:20 · Айгерим','Здравствуйте, Жанар! Фасады в покраске до 9 октября, монтаж стоит на 16-е — успеваем.'],['in','09:21','Отлично, спасибо!']],'К-1503':[['in','вчера 18:40','Почему шкаф ещё не готов? Обещали к 10-му'],['out','вчера 19:05 · Максат','Динара, ждём зеркала от подрядчика, сегодня уточню срок.'],['in','10:02','Есть новости по зеркалам?']],'К-1510':[['sys','авто','Ваш заказ готов. Менеджер свяжется, чтобы согласовать монтаж.'],['out','11:30 · Дина','Камила, монтаж 8 октября с 10:00 — удобно?'],['in','11:48','Да, ждём']]};
const waThread=o=>WA[o.id]||[['sys','авто',`Заказ ${o.id} принят. Ваш менеджер — ${STAFF[o.mgr]}.`]];
const AUTO={dog:1,start:1,wait:1,mont:1};
SC.wa=()=>{const o=OR(curOrd)||ORDERS[0];const T=Object.keys(WA).map(OR);
 return `<div class="hd"><div><h2>WhatsApp в карточке заказа</h2><p>Номер компании подключается к системе: вся переписка менеджеров с клиентами видна в карточке заказа, руководитель видит, кто и когда ответил. Казахстанский провайдер — около 5 000 ₸ за номер в месяц.</p></div></div>
 <div class="g12"><div class="pan"><h3>Чаты</h3>${T.map(x=>{const L=waThread(x),last=L[L.length-1];return `<div class="ch ${x.id===o.id?'on':''}" onclick="curOrd='${x.id}';render()"><b>${esc(CL(x.cl).n)} · ${x.id}</b><span>${esc(last[2]).slice(0,60)}</span>${last[0]==='in'?`<em>ждёт ответа${x.id==='К-1503'?' 5 ч':''}</em>`:''}</div>`}).join('')}</div>
 <div class="pan"><h3>${esc(CL(o.cl).n)} · ${o.id} · менеджер ${STAFF[o.mgr]}</h3><div class="chat">${waThread(o).map(m=>`<div class="msg ${m[0]}"><small>${m[1]}</small>${esc(m[2])}</div>`).join('')}</div><div class="wain"><input id="wa_t" placeholder="Сообщение клиенту" value="Добрый день! Заказ на этапе «${STN(o.st).n}»."><button class="bt p" onclick="waSend('${o.id}')">Отправить</button></div></div></div>
 <div class="pan"><h3>Авто-сообщения клиенту при смене этапа</h3>${[['dog','Договор подписан — «Спасибо! Договор подписан, ваш конструктор — …»'],['start','Запуск — «Заказ передан в производство, ориентировочная дата монтажа …»'],['wait','Готово — «Ваш заказ готов, менеджер согласует время монтажа»'],['mont','Монтаж — «Завтра в 10:00 приедет бригада»']].map(([k,n])=>`<div class="srow"><span class="nm">${n}</span><span class="sw ${AUTO[k]?'on':''}" onclick="AUTO['${k}']=AUTO['${k}']?0:1;render()"></span></div>`).join('')}</div>
 ${said('«Переписываются они в WhatsApp с клиентом… было бы удобно, если бы это можно было проконтролировать, проанализировать — увидеть внутри системы».')}`};
function waSend(id){const el=document.getElementById('wa_t');if(!el)return;const t=el.value.trim();if(!t)return;WA[id]=waThread(OR(id)).concat([['out',NOW+' · '+ROLES[role].n,t]]);render();toast('Сообщение отправлено клиенту в WhatsApp и сохранено в карточке.')}

/* ===== Конструкторы ===== */
SC.kboard=()=>{const L=ORDERS.filter(o=>['zam2','kd'].includes(o.st)||(o.st==='start'&&o.kon)).filter(o=>role!=='Конструктор'||o.kon==='TM');const ks=o=>o.st==='kd'?'moder':o.st==='start'?'sent':o.kst;
 return `<div class="hd"><div><h2>Конструкторская воронка${role==='Конструктор'?' · мои':''}</h2><p>Своя доска со своими этапами. Внутри карточки — чек-лист под тип изделия: кухня, шкаф, другое. Конструктор не вспоминает, что сделать, а идёт по пунктам; пока не отмечено всё — в производство не уйдёт.</p></div></div>
 <div class="kb k6">${KST.map(([k,n])=>{const X=L.filter(o=>ks(o)===k);return `<div class="kc" style="--sc:#2f5d7a"><div class="kh"><b>${n}</b><span>${X.length}</span></div>${X.map(o=>{const c=o.chK,d=c.filter(Boolean).length;return `<div class="kd" onclick="openOrd('${o.id}')"><div class="kt"><b>${o.id}</b><span class="tag">${KIND[o.kind]}</span></div><div class="kr">${esc(CL(o.cl).n)}</div><div class="km">${esc(o.t)}</div><div class="ckp"><i style="width:${pct(d,c.length)}%"></i></div><div class="kf"><span>${STAFF[o.kon]||'—'}</span><span>чек-лист ${d}/${c.length}</span></div></div>`}).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>
 <div class="g2"><div class="note"><b>К-1514 · согласование изменений</b><p>Клиент поменял модель духового шкафа после договора — дополнительное согласование, как у вас: изменения → подпись клиента → дальше.</p></div><div class="note"><b>Пакет от менеджера</b><p>Конструктор получает карточку с договором, эскизом, замерами, материалами и фурнитурой — менеджер не передаст без своего чек-листа.</p></div></div>
 ${said('«Конструкторская — отдельная воронка, свои этапы, с чек-листами, чтобы конструктор не придумывал и не вспоминал… Это кухня — там свои действия, шкаф — свои».')}`};
SC.checklists=()=>`<div class="hd"><div><h2>Чек-листы этапов</h2><p>Шаблоны, по которым идут менеджер и конструктор. Пункты добавляете и меняете сами — новые карточки сразу получают новый список.</p></div></div>
 <div class="g2">${Object.entries(CHK).map(([k,c])=>`<div class="pan"><h3>${c.n}</h3>${c.items.map((x,i)=>`<div class="li n"><i>${i+1}</i><span>${esc(x)}</span></div>`).join('')}${role==='Собственник'||role==='Конструктор'?`<button class="bt sm" onclick="card('chkadd','${k}')">+ Пункт</button>`:''}</div>`).join('')}</div>
 ${said('«Внутри карточки на его зоне ответственности будет чек-лист, и до тех пор, пока он весь чек-лист не прочекал — карточка не может двинуться дальше».')}`;
const LOADS=[['B1','К-1501','10-12','10-17'],['B1','К-1509','10-19','10-23'],['B2','К-1502','10-01','10-09'],['B2','К-1510','10-08','10-08'],['B3','К-1505','10-01','10-05'],['B3','К-1503','10-07','10-10'],['TM','К-1504','10-01','10-08'],['TM','К-1506','10-06','10-16'],['SA','К-1514','10-01','10-09'],['AR','К-1513','10-02','10-10']].map(x=>({r:x[0],o:x[1],a:D(x[2]),b:D(x[3])}));
SC.cload=()=>{const days=[];for(let i=1;i<=31;i++){const d='2026-10-'+String(i).padStart(2,'0');days.push(d)}const rows=[['B1','Бригада 1 · Сергей, Алмас'],['B2','Бригада 2 · Руслан, Даурен'],['B3','Бригада 3 · Виктор, Нурик'],['TM','Тимур · конструктор'],['SA','Сауле · конструктор'],['AR','Артём · конструктор']];
 return `<div class="hd"><div><h2>Загрузка и отпуска · октябрь</h2><p>Кто чем занят по дням: каждая бригада и каждый конструктор. Отпуска — на том же календаре, чтобы не ставить монтаж на неделю, когда бригады нет.</p></div><div class="btns"><button class="bt" onclick="card('leave')">+ Отпуск</button></div></div>
 <div class="tw"><table class="gt"><thead><tr><th></th>${days.map(d=>`<th class="${['сб','вс'].includes(dayOf(d))?'we':''} ${d===TODAY?'now':''}">${+d.slice(8)}<small>${dayOf(d)}</small></th>`).join('')}</tr></thead><tbody>${rows.map(([k,n])=>`<tr><td class="rn">${n}</td>${days.map(d=>{const L=LOADS.find(x=>x.r===k&&d>=x.a&&d<=x.b);const lv=LEAVE.find(x=>(x.k===k)&&d>=x.a&&d<=x.b);const we=['сб','вс'].includes(dayOf(d));return `<td class="${we?'we':''}">${lv?'<span class="lv" title="Отпуск">отп</span>':L&&!we?`<span class="ld" style="--sc:${STN(OR(L.o).st).c}" onclick="openOrd('${L.o}')" title="${L.o}">${L.a===d||d.slice(8)==='01'||dayOf(d)==='пн'?L.o.slice(2):''}</span>`:''}</td>`}).join('')}</tr>`).join('')}</tbody></table></div>
 <div class="g2"><div class="note"><b>Свободные окна</b><p>Бригада 3 свободна с 13 по 31 октября, бригада 2 — с 10 по 17. Новый монтаж система предложит туда.</p></div><div class="note" style="--tone:var(--warn)"><b>Отпуска</b><p>${LEAVE.map(l=>`${l.n}: ${dd(l.a)}–${dd(l.b)}`).join(' · ')}.</p></div></div>
 ${said('«Календарь отпусков, календарь загрузки производства, каждой бригады, каждого конструктора».')}`};

/* ===== Производство ===== */
SC.prod=()=>`<div class="hd"><div><h2>Цех и бригады</h2><p>Детали от подрядчиков и со склада пришли — бригада собирает. Готовое ждёт монтажа на складе готовой продукции. Сейчас кто собирает, тот и едет на монтаж; если появятся отдельные монтажники — это просто ещё одна роль.</p></div></div>
 <div class="g3">${Object.entries(BRIG).map(([k,b])=>{const O=ORDERS.filter(o=>o.br===k&&!['done'].includes(o.st));return `<div class="pan"><h3>${b.n}</h3><p class="mini">${b.p}</p>${O.map(o=>`<div class="pr clk" onclick="openOrd('${o.id}')"><div><b>${o.id} · ${KIND[o.kind]}</b><span>${esc(CL(o.cl).n)} · монтаж ${o.mont?dd(o.mont):'—'}</span>${rbar(o)}</div>${stg(o.st)}</div>`).join('')||'<p class="mini">Свободна.</p>'}</div>`}).join('')}</div>
 <div class="g2"><div class="pan"><h3>Сборка в цеху</h3>${ORDERS.filter(o=>o.st==='ceh').map(o=>`<div class="pr"><div><b>${o.id} · ${esc(o.t)}</b><span>${BRIG[o.br].n} · все детали на месте</span></div><button class="bt sm p" onclick="nextSt('${o.id}')">Собрано → ждёт монтажа</button></div>`).join('')}</div>
 <div class="pan"><h3>Готово · ждёт монтажа на складе</h3>${ORDERS.filter(o=>o.st==='wait').map(o=>`<div class="pr"><div><b>${o.id} · ${esc(CL(o.cl).n)}</b><span>ячейка Г-02 · 14 упаковок · монтаж ${dd(o.mont)}</span></div><button class="bt sm" onclick="nextSt('${o.id}')">Выехали на монтаж</button></div>`).join('')}</div></div>
 <div class="pan"><h3>Монтаж — по шагам</h3><div class="mvs">${[['1','Доставка','из цеха к клиенту'],['2','Монтаж корпуса','бригада'],['3','Монтаж фасадов','после столешницы и техники'],['4','Сдача','акт, фото, остаток оплаты']].map(s=>`<div class="mv"><i>${s[0]}</i><b>${s[1]}</b><span>${s[2]}</span></div>`).join('')}</div></div>`;

let curCo='P5';
SC.contractors=()=>{const A=CONTR.filter(c=>JOBS.some(j=>j.p===c.id&&j.st!=='done')||['P1','P2','P5'].includes(c.id));
 return `<div class="hd"><div><h2>Подрядчики</h2><p>У каждого подрядчика своя доска. Конструктор отметил участников и приложил документы — на доске каждого появилась карточка со сроком. Начальник производства видит, кто затягивает, ещё до того, как сорвётся монтаж.</p></div><div class="btns"><button class="bt" onclick="card('newco')">+ Подрядчик</button></div></div>
 <div class="wid"><div><small>Работ в процессе</small><b>${JOBS.filter(j=>j.st!=='done').length}</b><span>у ${new Set(JOBS.filter(j=>j.st!=='done').map(j=>j.p)).size} подрядчиков</span></div><div><small>Просрочено</small><b class="r">${JOBS.filter(jLate).length}</b><span>${JOBS.filter(jLate).map(j=>CO(j.p).n).join(', ')}</span></div><div><small>Сдают на этой неделе</small><b>${JOBS.filter(j=>j.st!=='done'&&j.due>=TODAY&&j.due<=addDays(TODAY,6)).length}</b><span>до ${dd(addDays(TODAY,6))}</span></div><div><small>Должны подрядчикам</small><b class="w">${mln(CONTR.reduce((a,c)=>a+coDebt(c.id),0))}</b><span>сальдо</span></div><div><small>С доступом в кабинет</small><b>${CONTR.filter(c=>c.login).length} из ${CONTR.length}</b><span>остальным — уведомления</span></div></div>
 <div class="kb co">${A.map(c=>{const X=JOBS.filter(j=>j.p===c.id&&(j.st!=='done'||j.due>=addDays(TODAY,-7)));return `<div class="kc" style="--sc:${c.own?'#b0532a':'#5a4f86'}"><div class="kh"><b>${esc(c.n)}</b><span>${X.length}</span></div><div class="kw">${esc(c.w)}${c.own?' · свой участок':''}</div>${X.map(j=>`<div class="kd ${jLate(j)?'alarm':''}" onclick="openOrd('${j.ord}')"><div class="kt"><b>${j.ord}</b>${jst(j)}</div><div class="km">${esc(j.w)}</div><div class="kf"><span>срок ${dd(j.due)}</span><b class="mono">${j.sum?fmt(j.sum):'свои'}</b></div></div>`).join('')||'<div class="kempty">—</div>'}<button class="bt sm" style="margin-top:4px" onclick="curCo='${c.id}';go('contractor')">Кабинет →</button></div>`}).join('')}</div>
 ${said('«Конструктор указывает, кто из подрядчиков участвует, и на каждом из пяти подрядчиков появляется на его доске карточка… начальник производства видит, когда передано подрядчику, и стоит дедлайн».','Малярка уже своя — она здесь как отдельный участок: сегодня подрядчик, завтра своё производство, контроль одинаковый.')}`};
SC.contractor=()=>{const id=role==='Подрядчик'?'P5':curCo;const c=CO(id);const J=JOBS.filter(j=>j.p===id);const s=J.filter(j=>j.st!=='sent').reduce((a,j)=>a+j.sum,0),p=J.reduce((a,j)=>a+j.paid,0);
 return `<div class="hd"><div><h2>Кабинет подрядчика · ${esc(c.n)}</h2><p>Подрядчик заходит под своим логином и видит только свои заказы: что сделать, документы для скачивания, срок и напоминания. Отмечает «взял в работу» и «готово» — у вас статус меняется сам.</p></div>${role==='Подрядчик'?'':`<div class="btns"><select class="rsel" onchange="curCo=this.value;render()">${CONTR.map(x=>`<option value="${x.id}" ${x.id===id?'selected':''}>${esc(x.n)}</option>`).join('')}</select></div>`}</div>
 <div class="wid"><div><small>Заказов</small><b>${J.filter(j=>j.st!=='done').length}</b><span>в работе</span></div><div><small>Ближайший срок</small><b class="${J.some(jLate)?'r':''}">${J.filter(j=>j.st!=='done').sort((a,b)=>a.due<b.due?-1:1).map(j=>dd(j.due))[0]||'—'}</b><span>${J.some(jLate)?'есть просрочка':'в графике'}</span></div><div><small>Начислено</small><b>${fmt(s)}</b><span>₸</span></div><div><small>Оплачено</small><b class="g">${fmt(p)}</b><span>₸</span></div><div><small>К оплате</small><b class="w">${fmt(s-p)}</b><span>сверка</span></div></div>
 ${J.map(j=>`<div class="pan job ${jLate(j)?'late':''}"><div class="jh"><div><b>${j.ord} · ${esc(j.w)}</b><span>передано ${dd(j.sent)} · срок ${dd(j.due)}${jLate(j)?` · <em>просрочено ${daysBetween(j.due,TODAY)} дн.</em>`:j.st!=='done'?` · осталось ${daysBetween(TODAY,j.due)} дн.`:''}</span></div>${jst(j)}</div>
  <div class="jd">${j.docs.map(d=>`<a class="fdoc" onclick="toast('Файл «${esc(d)}» скачан — документы лежат в карточке, как в облаке.')">${esc(d)}</a>`).join('')}</div>
  ${j.st!=='done'?`<div class="btns l">${j.st==='sent'?`<button class="bt" onclick="jobSt('${j.id}','work')">Взял в работу</button>`:''}<button class="bt p" onclick="jobSt('${j.id}','done')">Готово — можно забирать</button></div>`:''}</div>`).join('')||'<p class="mini">Заказов нет.</p>'}
 ${said('«Чтобы подрядчики могли зайти под своим аккаунтом, посмотреть свой статус, подгрузить документацию, которую уже вложили для них, чтобы они её не потеряли — как в облаке, и напоминала о дедлайне».')}`};
function jobSt(id,st){const j=JOBS.find(x=>x.id===id);j.st=st;if(st==='done'&&!j.sum&&CO(j.p).own)j.sum=0;render();toast(st==='done'?`${CO(j.p).n} сдал работу по ${j.ord}. Начальнику производства — уведомление, водителю — рейс забрать.`:'Статус: в работе.')}

const TRIPS=[
 {d:'10-05',t:'14:00',k:'mont',o:'К-1505',n:'Монтаж фасадов гардеробной',who:'Бригада 3',to:'КГ «Ак Булак», дом 14'},
 {d:'10-06',t:'09:00',k:'drive',o:'К-1509',n:'Забрать детали распила',who:'Жандос',to:'«Раскрой-Центр», ул. Бекмаханова 93 → цех'},
 {d:'10-06',t:'12:00',k:'drive',o:'К-1503',n:'Забрать профиль купе',who:'Жандос',to:'«AluSystem», ул. Суюнбая 2 → цех'},
 {d:'10-08',t:'09:00',k:'drive',o:'К-1510',n:'Доставка прихожей клиенту',who:'Жандос',to:'цех → ул. Габдуллина, 63'},
 {d:'10-08',t:'10:00',k:'mont',o:'К-1510',n:'Монтаж корпуса и фасадов',who:'Бригада 2',to:'ул. Габдуллина, 63'},
 {d:'10-09',t:'09:00',k:'drive',o:'К-1502',n:'Доставка кухни',who:'Жандос',to:'цех → мкр. Самал-2, 58'},
 {d:'10-09',t:'10:00',k:'mont',o:'К-1502',n:'Монтаж кухни',who:'Бригада 2',to:'мкр. Самал-2, 58'},
 {d:'10-12',t:'11:00',k:'drive',o:'К-1501',n:'Забрать столешницу',who:'Жандос',to:'«Stone Line» → цех'},
 {d:'10-16',t:'10:00',k:'mont',o:'К-1501',n:'Монтаж корпуса кухни',who:'Бригада 1',to:'ЖК «Esentai City», кв. 112'},
 {d:'10-17',t:'10:00',k:'mont',o:'К-1501',n:'Монтаж фасадов и столешницы',who:'Бригада 1',to:'ЖК «Esentai City», кв. 112'}
].map(t=>({...t,d:D(t.d)}));
SC.install=()=>`<div class="hd"><div><h2>Доставка и монтаж</h2><p>Две логистики: материалы и детали от подрядчиков — к вам в цех, готовая мебель — к клиенту. Монтаж делится на корпус и фасады. Водитель, даже сторонний, видит только свои рейсы.</p></div><div class="btns"><button class="bt p" onclick="card('trip')">+ Рейс</button></div></div>
 ${[...new Set(TRIPS.map(t=>t.d))].map(d=>`<div class="pan"><h3>${dd(d)} · ${dayOf(d)}${d===TODAY?' · сегодня':''}</h3>${TRIPS.filter(t=>t.d===d).map(t=>`<div class="pr clk" onclick="openOrd('${t.o}')"><span class="tk ${t.k}">${t.k==='mont'?'монтаж':'рейс'}</span><div><b>${t.t} · ${esc(t.n)} · ${t.o}</b><span>${esc(t.to)}</span></div><span class="tag">${t.who}</span></div>`).join('')}</div>`).join('')}
 ${said('«Нам через год будет штатный водитель — ему падала заявка, что у него завтра или послезавтра, чтобы был свой график вывозов… Даже если сейчас сторонний — мы можем его подключить».')}`;
SC.brig=()=>{const O=ORDERS.filter(o=>o.br==='B1'&&o.st!=='done');return `<div class="hd"><div><h2>Мои заказы · Бригада 1</h2><p>С телефона. Сборщик видит только свои заказы — не все заказы компании.</p></div></div>
 <div class="phones">${O.map(o=>`<div class="phone"><div class="pht"><b>${o.id} · ${KIND[o.kind]}</b><small>${esc(CL(o.cl).addr)}</small></div><div class="pb"><div class="pi"><span>Этап</span><b>${STN(o.st).n}</b></div><div class="pi"><span>Монтаж</span><b>${dd(o.mont)}</b></div>${jobsOf(o.id).map(j=>`<div class="pi"><span>${esc(CO(j.p).n)}</span><b>${j.st==='done'?'готово':'срок '+dd(j.due)}</b></div>`).join('')}<div class="pbtn" onclick="toast('Чертежи сборки ${o.id} открыты.')">Чертежи сборки</div><div class="pbtn g" onclick="toast('Фото монтажа прикреплены, менеджеру — уведомление.')">Смонтировано — фото</div></div></div>`).join('')}</div>`};
SC.drive=()=>{const T=TRIPS.filter(t=>t.k==='drive');return `<div class="hd"><div><h2>Мои рейсы · Жандос</h2><p>Водитель видит только свои рейсы: когда, откуда, куда и что везти. Новый рейс — уведомление на телефон.</p></div></div>
 <div class="phones"><div class="phone"><div class="pht"><b>Рейсы</b><small>${T.length} на две недели</small></div><div class="pb">${T.map(t=>`<div class="pi"><span>${dd(t.d)} ${t.t} · ${t.o}<small>${esc(t.to)}</small></span><b>${esc(t.n.split(' ')[0])}</b></div>`).join('')}<div class="pbtn" onclick="toast('Отмечено: забрал, везу в цех.')">Забрал груз</div></div></div></div>`};

/* ===== Склад ===== */
SC.stock=()=>{const G=[...new Set(STOCK.map(s=>s.g))];return `<div class="hd"><div><h2>Остатки и ячейки</h2><p>Склад при производстве, около 60 м², у каждой позиции — номер ячейки. «Свободно» = остаток минус резерв под заказы. Ниже минимума — подсветка и задача закупщику.</p></div><div class="btns"><button class="bt" onclick="card('inv')">Инвентаризация</button></div></div>
 ${G.map(g=>`<div class="pan"><h3>${g}</h3><div class="tw"><table class="t"><thead><tr><th>Ячейка</th><th>Позиция</th><th>Артикул</th><th class="r">Остаток</th><th class="r">Резерв</th><th class="r">Свободно</th><th class="r">Мин.</th><th class="r">Цена</th></tr></thead><tbody>${STOCK.filter(s=>s.g===g).map(s=>{const f=s.q-s.res;return `<tr class="${f<0?'rowbad':''}"><td class="mono"><b>${s.cell}</b></td><td>${esc(s.n)}</td><td class="mono">${s.art}</td><td class="r mono">${s.q} ${s.u}</td><td class="r mono">${s.res||'—'}</td><td class="r mono ${f<0?'neg':f<s.min?'wtx':''}">${f}</td><td class="r mono">${s.min}</td><td class="r mono">${fmt(s.pr)}</td></tr>`}).join('')}</tbody></table></div></div>`).join('')}`};
SC.requests=()=>`<div class="hd"><div><h2>Заявки и закупка</h2><p>Конструктор после своего этапа формирует заявку на склад прямо в карточке. Когда заказ уходит в производство, закупщик видит её: что отгрузить со склада, что дозаказать у поставщика.</p></div></div>
 ${REQS.map((r,ri)=>`<div class="pan"><h3>${r.ord} · от ${STAFF[r.by]} · ${dd(r.d)} ${r.st==='done'?'<span class="tag g">отгружено</span>':'<span class="tag w">новая</span>'}</h3><div class="tw"><table class="t"><thead><tr><th>Позиция</th><th>Ячейка</th><th class="r">Нужно</th><th class="r">Свободно</th><th>Решение</th></tr></thead><tbody>${r.lines.map(([s,q])=>{const k=SK(s),f=k.q-(r.st==='done'?0:k.res-q);const lack=Math.max(0,q-Math.max(0,k.q-(k.res-q)));return `<tr><td>${esc(k.n)}</td><td class="mono">${k.cell}</td><td class="r mono">${q} ${k.u}</td><td class="r mono">${k.q-(k.res-q)}</td><td>${r.st==='done'?'<span class="tag g">выдано</span>':lack?`<span class="tag r">дозаказать ${lack} ${k.u}</span> · ${esc(k.sup)}`:'<span class="tag g">со склада</span>'}</td></tr>`}).join('')}</tbody></table></div>${r.st!=='done'?`<div class="btns l"><button class="bt" onclick="toast('Заказ поставщикам сформирован: «Мебельные материалы KZ», «Blum Казахстан».')">Дозаказать недостающее</button><button class="bt p" onclick="reqDone(${ri})">Отгружено в цех</button></div>`:''}</div>`).join('')}
 ${said('«Конструктор-технолог формирует заявку на склад в карточке… когда перешло в производство, для закупщика формируется заявка — он отгружает со склада либо дозаказывает».')}`;
function reqDone(i){const r=REQS[i];r.st='done';r.lines.forEach(([s,q])=>{const k=SK(s);k.q=Math.max(0,k.q-q);k.res=Math.max(0,k.res-q)});render();toast(`Заявка ${r.ord} отгружена: остатки списаны с ячеек, карточку можно двигать к подрядчикам.`)}
SC.prices=()=>`<div class="hd"><div><h2>Прайсы поставщиков</h2><p>Поставщики присылают прайс — загружаете файл, система сверяет по артикулу и обновляет цены. Расчёт заказа и КП берут уже новые цены.</p></div><div class="btns"><button class="bt p" onclick="toast('Прайс загружен: 412 артикулов, изменилось 37 цен, 3 новых позиции.')">Загрузить прайс</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Поставщик</th><th>Что</th><th>Обновлён</th><th class="r">Артикулов</th><th>Изменения</th></tr></thead><tbody>${[['«Blum Казахстан»','петли, ящики, подъёмники','03.10',612,'+4 % на Legrabox'],['«Мебельные материалы KZ»','ЛДСП Egger, кромка','03.10',1240,'без изменений'],['«ДСП-Центр»','Kronospan, МДФ, ХДФ','28.09',860,'+2 % на МДФ'],['«Hettich Алматы»','петли, направляющие, штанги','25.09',540,'—'],['«Фурнитура-Опт»','ножки, навесы, профили, ручки','01.10',2100,'3 позиции сняты с продажи']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="mono">${r[2]}</td><td class="r mono">${fmt(r[3])}</td><td class="mini">${r[4]}</td></tr>`).join('')}</tbody></table></div>
 ${said('«Мы берём у поставщика прайс со всеми ценами, и наша таблица подтягивается — если артикул совпадает».')}`;

/* ===== v2 по ТЗ Василия: модерация, пакет запуска, изделия и коммуникации, календарь, снабжение, оплата и закрытие, отказы, автоматизации, отчёты, соответствие ТЗ ===== */
const PKG=['Общий вид','Вид для монтажа','Сборочные чертежи','Подрядные таблицы','Подрядные чертежи','Закупочная заявка','Спецификация','Все необходимые файлы'];
const COMMS=[['Электрика','розетки, выводы, мощность, высоты'],['Вода','точки подключения, высоты'],['Канализация','точка, диаметр, уклон'],['Вентиляция','канал, размеры, ограничения'],['Газ','точка подключения, ограничения'],['Техника','посудомойка, духовой шкаф, холодильник, вытяжка']];
const LOSTR=['Цена','Конкурент','Срок','Изменились планы','Нет бюджета','Не можем изготовить','Не выходит на связь','Другое'];
let LOSTS=[{n:'Гульмира С.',t:'Кухня 3,4 м',r:'Цена',m:'OG',d:'02.10',c:'Выбрала предложение дешевле на 380 тыс.'},{n:'ТОО «Арман Девелопмент»',t:'Шкафы в 12 квартир',r:'Срок',m:'AG',d:'29.09',c:'Нужно за 14 дней'},{n:'Олжас К.',t:'Гардеробная',r:'Не выходит на связь',m:'MK',d:'27.09',c:'3 попытки за 5 дней'},{n:'Елена П.',t:'Кухня с островом',r:'Изменились планы',m:'DN',d:'24.09',c:'Отложила ремонт до весны'},{n:'Марат Б.',t:'Кухня 2,4 м',r:'Конкурент',m:'OG',d:'22.09',c:''},{n:'Сабина Т.',t:'Детская',r:'Нет бюджета',m:'MK',d:'20.09',c:''},{n:'Кафе «Тюбетейка»',t:'Барная стойка из камня',r:'Не можем изготовить',m:'AG',d:'18.09',c:'Гнутый камень — не берёт ни один подрядчик'}];
ORDERS.forEach(o=>{const si=STI(o.st);
 o.moder=si>STI('kd')?'final':o.st==='kd'?'remarks':'none';
 o.remarks=o.id==='К-1504'?[['03.10','Ольга','Высота барной стойки 1100 вместо 1050 — по ТЗ клиента'],['04.10','Ольга','Добавить розетку USB в витрину']]:[];
 o.pkg=PKG.map((x,i)=>si>STI('start')?1:o.st==='start'?(i<6?1:0):0);
 o.avr=si>STI('qa');o.closed=o.st==='done';
 o.items=o.kind==='kitchen'?[['Нижние модули','ЛДСП + МДФ эмаль','распил · малярка'],['Верхние модули','ЛДСП + стекло','распил · стекло'],['Столешница','кварц','камень'],['Остров','МДФ эмаль','распил · малярка']]:o.kind==='wardrobe'?[['Корпус','ЛДСП','распил'],['Двери-купе','алюминий + зеркало','профиль · стекло'],['Наполнение','штанги, ящики','склад']]:[['Каркас','металл','металл'],['Облицовка','шпон дуба','шпон'],['Столешница','камень','камень']];
 o.com=COMMS.map((x,i)=>si>STI('dog')?1:o.st==='dog'?(i<4?1:0):0);
 o.hist=[[dd(o.d),STAFF[o.mgr],'Создана заявка','—','Новая заявка'],[dd(addDays(o.d,2)),STAFF[o.mgr],'Ответственный','—',STAFF[o.mgr]],[dd(addDays(o.d,5)),STAFF[o.mgr],'Версия КП','v1','v2 · '+tg(o.sum)]];
});
const PST={wait:'Ожидает',work:'В работе',done:'Готово',got:'Получено',late:'Просрочено'};
function ordExtra(o){const si=STI(o.st);let h='';
 h+=`<div class="g2"><div class="pan"><h3>Изделия проекта · ${o.items.length}</h3><p class="mini">1 проект → много изделий → у каждого свои производственные и подрядные задачи.</p>${o.items.map(it=>`<div class="kv"><span><b>${it[0]}</b> · ${it[1]}</span><b class="mini">${it[2]}</b></div>`).join('')}</div>
 <div class="pan"><h3>ТЗ по коммуникациям · ${o.com.filter(Boolean).length} из ${COMMS.length}</h3><div class="chk">${COMMS.map((c,i)=>`<div class="ci"><span class="bx ${o.com[i]?'on':''}" onclick="OR('${o.id}').com[${i}]=OR('${o.id}').com[${i}]?0:1;render()">${o.com[i]?'✓':''}</span><span class="nm"><b>${c[0]}</b> — ${c[1]}</span></div>`).join('')}</div><button class="bt sm" onclick="toast('ТЗ строителям сформировано PDF и отправлено клиенту в WhatsApp.')">ТЗ строителям · PDF</button></div></div>`;
 if(si>=STI('zam2')&&si<=STI('kd'))h+=`<div class="pan mod ${o.moder}"><h3>Модерация техпроекта менеджером · ${o.moder==='final'?'финальная — запуск разрешён':o.moder==='remarks'?'есть замечания':'ещё не отправлено'}</h3>${o.remarks.map(r=>`<div class="kv"><span>${r[0]} · ${r[1]}</span><b class="mini">${esc(r[2])}</b></div>`).join('')||'<p class="mini">Замечаний нет.</p>'}${o.st==='kd'?`<div class="btns l" style="margin-top:8px"><button class="bt" onclick="card('remark','${o.id}')">Замечания → вернуть конструктору</button><button class="bt p" onclick="modFinal('${o.id}')">Финальная модерация</button></div>`:''}<p class="mini">Пока менеджер не подтвердил финальный технический проект, запуск производства невозможен. Все замечания сохраняются в истории.</p></div>`;
 if(si>=STI('kd'))h+=`<div class="pan"><h3>Пакет запуска в производство · ${o.pkg.filter(Boolean).length} из ${PKG.length}</h3><div class="chk c2">${PKG.map((x,i)=>`<div class="ci"><span class="bx ${o.pkg[i]?'on':''}" onclick="OR('${o.id}').pkg[${i}]=OR('${o.id}').pkg[${i}]?0:1;render()">${o.pkg[i]?'✓':''}</span><span class="nm">${x}</span><span class="who">обязателен</span></div>`).join('')}</div></div>`;
 if(si>=STI('qa'))h+=`<div class="pan"><h3>Качество, АВР, закрытие</h3><div class="kv"><span>Контроль качества — менеджер + начальник производства</span><b>${si>STI('qa')?'принято':'<span class="tag w">в работе</span>'}</b></div><div class="kv"><span>АВР</span><b>${o.avr?'<span class="tag g">подписан</span>':`<button class="bt sm p" onclick="OR('${o.id}').avr=true;render();toast('АВР подписан — проект можно переводить в оплату.')">АВР подписан</button>`}</b></div><div class="kv"><span>Закрывающие документы</span><b>${o.closed?'<span class="tag g">сданы</span>':`<button class="bt sm" onclick="OR('${o.id}').closed=true;render();toast('Закрывающие документы приложены.')">Документы сданы</button>`}</b></div></div>`;
 h+=`<div class="pan"><h3>История изменений</h3><div class="tw"><table class="t"><thead><tr><th>Когда</th><th>Кто</th><th>Что</th><th>Было</th><th>Стало</th></tr></thead><tbody>${o.hist.concat(o.remarks.map(r=>[r[0],r[1],'Замечание модерации','—',r[2]])).map(x=>`<tr><td class="mono">${x[0]}</td><td>${x[1]}</td><td>${x[2]}</td><td class="mini">${esc(x[3])}</td><td>${esc(x[4])}</td></tr>`).join('')}</tbody></table></div></div>`;
 return h}
function modFinal(id){const o=OR(id);o.moder='final';o.hist.push([dd(TODAY),ROLES[role].n,'Модерация','замечания','финальная']);render();toast('Финальная модерация — запуск производства разрешён.')}

/* ---------- календарь начальника производства ---------- */
SC.calendar=()=>{const rows=JOBS.map(j=>({p:j.ord,w:CO(j.p).w,who:CO(j.p).n,a:j.sent,b:j.due,st:j.st==='done'?'got':D(j.due)<TODAY?'late':j.st==='work'?'work':'wait'})).concat([{p:'К-1502',w:'Сборка в цеху',who:'Бригада 2',a:'2026-10-03',b:'2026-10-07',st:'work'},{p:'К-1509',w:'Распил',who:'Цех',a:'2026-10-05',b:'2026-10-08',st:'work'},{p:'К-1501',w:'Сборка корпуса',who:'Бригада 1',a:'2026-10-12',b:'2026-10-15',st:'wait'},{p:'К-1501',w:'Поставка: ящики Legrabox (заказ)',who:'«Blum Казахстан»',a:'2026-10-02',b:'2026-10-09',st:'wait'}]).map(r=>({...r,a:D(r.a),b:D(r.b)})).sort((x,y)=>x.b<y.b?-1:1);
 return `<div class="hd"><div><h2>Календарь начальника производства</h2><p>Все производственные, подрядные и снабженческие дедлайны — в одном календаре. Просроченное выделяется само и не теряется внутри карточек.</p></div></div>
 <div class="wid"><div><small>Работ в календаре</small><b>${rows.length}</b><span>цех, подрядчики, поставки</span></div><div><small>Просрочено</small><b class="r">${rows.filter(r=>r.st==='late').length}</b><span>уведомлены исполнитель и руководитель</span></div><div><small>Дедлайн завтра</small><b class="w">${rows.filter(r=>r.b===addDays(TODAY,1)).length}</b><span>исполнитель + руководитель</span></div><div><small>Через 2 рабочих дня</small><b>${rows.filter(r=>r.b===addDays(TODAY,2)).length}</b><span>напоминание исполнителю</span></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Проект</th><th>Работа</th><th>Исполнитель</th><th>Начало</th><th>Дедлайн</th><th>Статус</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.st==='late'?'rowbad':''}"><td><a class="lk" onclick="openOrd('${r.p}')">${r.p}</a> · ${esc(CL(OR(r.p).cl).n)}</td><td>${esc(r.w)}</td><td>${esc(r.who)}</td><td class="mono">${dd(r.a)}</td><td class="mono"><b>${dd(r.b)}</b></td><td><span class="tag ${r.st==='late'?'r':r.st==='got'?'g':r.st==='work'?'w':''}">${PST[r.st]}</span></td></tr>`).join('')}</tbody></table></div>
 ${tzRef('7.2, 15','Начальник производства видит в одном календаре все производственные и подрядные дедлайны; просроченные выделяются автоматически.')}`};

/* ---------- снабжение: в наличии / на заказ ---------- */
const pd=s=>'2026-'+s.split('.')[1]+'-'+s.split('.')[0];
let SUP=[{o:'К-1509',it:'ЛДСП Egger W980 · 16 мм',art:'EG-W980-16',q:'9 листов',type:'stock',sup:'склад, ячейка А-02',ord:'05.10',plan:'—',fact:'05.10',who:'Ерлан',aff:false},{o:'К-1509',it:'ЛДСП Egger W980 · 16 мм (недостача)',art:'EG-W980-16',q:'3 листа',type:'order',sup:'«Мебельные материалы KZ»',ord:'05.10',plan:'08.10',fact:'',who:'Ерлан',aff:false},{o:'К-1501',it:'Ящик Blum Legrabox M 500 антрацит',art:'770M5002S',q:'2 компл',type:'order',sup:'«Blum Казахстан»',ord:'02.10',plan:'09.10',fact:'',who:'Ерлан',aff:true},{o:'К-1503',it:'Профиль купе, направляющие',art:'ALU-K2',q:'1 компл',type:'order',sup:'«AluSystem»',ord:'29.09',plan:'03.10',fact:'',who:'Ерлан',aff:true},{o:'К-1502',it:'Петля Blum Clip Top Blumotion',art:'71B3550',q:'24 шт',type:'stock',sup:'склад, ячейка Ф-03',ord:'26.09',plan:'—',fact:'26.09',who:'Ерлан',aff:false}];
SC.supply=()=>`<div class="hd"><div><h2>Снабжение: в наличии и на заказ</h2><p>Каждая позиция связана с проектом и изделием. Для заказных позиций плановая дата поставки — обязательное поле, без неё позиция не сохраняется. Если поставка влияет на дату монтажа — она видна начальнику производства и в карточке сборщика.</p></div><div class="btns"><button class="bt p" onclick="card('supnew')">+ Позиция</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Проект</th><th>Позиция</th><th>Артикул</th><th>Кол-во</th><th>Тип</th><th>Поставщик</th><th>Заказ</th><th>План поставки</th><th>Факт</th><th>Ответств.</th></tr></thead><tbody>${SUP.map(r=>{const late=r.type==='order'&&!r.fact&&r.plan.includes('.')&&pd(r.plan)<TODAY;return `<tr class="${late?'rowbad':''}"><td><a class="lk" onclick="openOrd('${r.o}')">${r.o}</a></td><td>${esc(r.it)}${r.aff?'<div class="sub neg">влияет на дату монтажа</div>':''}</td><td class="mono">${r.art}</td><td>${r.q}</td><td>${r.type==='order'?'<span class="tag w">на заказ</span>':'<span class="tag g">в наличии</span>'}</td><td>${esc(r.sup)}</td><td class="mono">${r.ord}</td><td class="mono"><b>${r.plan}</b></td><td class="mono">${r.fact||(late?'<span class="neg">просрочено</span>':'—')}</td><td>${r.who}</td></tr>`}).join('')}</tbody></table></div>
 <div class="note" style="--tone:var(--bad)"><b>Просрочена поставка, влияющая на монтаж</b><p>Профиль купе для К-1503: план 03.10, не пришёл. Уведомление снабжению, начальнику производства и менеджеру Максату — клиенту обещан монтаж 10.10.</p></div>
 ${tzRef('8','Для заказных позиций дата обещанной поставки обязательна; плановая и фактическая; видна начальнику производства и сборщику.')}`;

/* ---------- оплата и закрытие ---------- */
SC.payclose=()=>{const L=ORDERS.filter(o=>STI(o.st)>=STI('dog'));const ps=o=>o.paid>=o.sum?'Оплачено':o.paid>0?'Частично':'Ожидается';
 return `<div class="hd"><div><h2>Оплата и закрытие</h2><p>По каждому проекту: сумма договора, оплачено, остаток (считается сам), даты платежей, статус оплаты и закрывающие документы. АВР подписан → проект в оплате; оплачено и документы закрыты → проект закрыт.</p></div></div>
 <div class="wid"><div><small>Договоров</small><b>${L.length}</b><span>на ${mln(L.reduce((a,o)=>a+o.sum,0))}</span></div><div><small>Оплачено</small><b class="g">${mln(L.reduce((a,o)=>a+o.paid,0))}</b><span>фактически</span></div><div><small>Остаток</small><b class="w">${mln(L.reduce((a,o)=>a+o.sum-o.paid,0))}</b><span>к получению</span></div><div><small>Ждут закрытия</small><b>${ORDERS.filter(o=>o.st==='pay').length}</b><span>в статусе «Оплата»</span></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Проект</th><th>Клиент</th><th>Этап</th><th class="r">Договор</th><th class="r">Оплачено</th><th class="r">Остаток</th><th>Статус оплаты</th><th>АВР</th><th>Документы</th></tr></thead><tbody>${L.map(o=>`<tr class="clk" onclick="openOrd('${o.id}')"><td><b>${o.id}</b></td><td>${esc(CL(o.cl).n)}</td><td>${stg(o.st)}</td><td class="r mono">${fmt(o.sum)}</td><td class="r mono">${fmt(o.paid)}</td><td class="r mono ${o.sum-o.paid?'neg':''}">${fmt(o.sum-o.paid)}</td><td><span class="tag ${ps(o)==='Оплачено'?'g':ps(o)==='Частично'?'w':''}">${ps(o)}</span></td><td>${o.avr?'✓':'—'}</td><td>${o.closed?'✓':'—'}</td></tr>`).join('')}</tbody></table></div>
 ${tzRef('11','Сумма договора, оплачено, остаток — автоматически, дата по каждой операции, статус Ожидается / Частично / Оплачено, закрывающие документы.')}`};

/* ---------- причины отказа ---------- */
SC.lost=()=>{const cnt=LOSTR.map(r=>[r,LOSTS.filter(x=>x.r===r).length+({'Цена':9,'Срок':5,'Конкурент':4,'Изменились планы':3,'Не выходит на связь':6,'Нет бюджета':2,'Не можем изготовить':1,'Другое':1}[r]||0)]);const mx=Math.max(...cnt.map(c=>c[1]));
 return `<div class="hd"><div><h2>Причины отказа</h2><p>Если заявка слетает до договора, система требует выбрать причину из списка. Свободный комментарий — дополнительно, но не вместо причины; для «Другое» он обязателен.</p></div></div>
 <div class="g2"><div class="pan"><h3>Причины · сентябрь – октябрь</h3>${cnt.map(c=>`<div class="hb"><span>${c[0]}</span><i style="width:${Math.round(c[1]/mx*100)}%;background:var(--bad)"></i><b class="mono">${c[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Последние отказы</h3>${LOSTS.map(x=>`<div class="kv"><span><b>${esc(x.n)}</b> · ${esc(x.t)}<br><span class="mini">${x.d} · ${STAFF[x.m]}${x.c?' · '+esc(x.c):''}</span></span><b><span class="tag r">${x.r}</span></b></div>`).join('')}</div></div>
 ${tzRef('4.1','Обязательная классифицированная причина отказа: цена, конкурент, срок, изменились планы, нет бюджета, не можем изготовить, не выходит на связь, другое (с комментарием).')}`};

/* ---------- автоматизации и уведомления ---------- */
const AUTOS=[['Создана новая заявка','Назначить ответственного менеджера'],['Дедлайн установлен','Показать в календаре ответственного'],['Заявка закрыта как отказ','Требовать причину отказа'],['Передача конструктору','Зафиксировать дату, создать задачу конструктору'],['Модерация с замечаниями','Вернуть проект конструктору, сохранить замечания'],['Финальная модерация','Разрешить запуск производства'],['Запуск в производство','Создать связанные производственные и подрядные карточки по направлениям'],['Создана заказная закупка','Требовать плановую дату поставки'],['Поставка просрочена','Предупреждение снабжению и начальнику производства'],['Назначен сборщик','Создать карточку в воронке сборщика'],['Готово к вывозу','Предложить задачу доставки'],['Монтаж завершён','Задача контроля качества и АВР'],['АВР подписан','Перевести проект в оплату'],['Оплачено и документы закрыты','Перевести проект в «Закрыт»']];
const NOTI=[['Дедлайн через 2 рабочих дня','Исполнитель'],['Дедлайн завтра','Исполнитель + руководитель процесса'],['Дедлайн просрочен','Исполнитель + руководитель процесса'],['Просрочена поставка, влияющая на монтаж','Снабжение + начальник производства + менеджер'],['Замечания на модерации','Конструктор + менеджер']];
SC.autom=()=>`<div class="hd"><div><h2>Автоматизации и уведомления</h2><p>Все 14 автоматических действий из вашего ТЗ и правила уведомлений: о приближении и просрочке дедлайна узнаёт не только исполнитель, но и руководитель процесса.</p></div></div>
 <div class="pan"><h3>Событие → действие</h3><div class="tw"><table class="t"><thead><tr><th>№</th><th>Событие</th><th>Автоматическое действие</th><th>Вкл.</th></tr></thead><tbody>${AUTOS.map((a,i)=>`<tr><td class="mono">${i+1}</td><td><b>${a[0]}</b></td><td>${a[1]}</td><td><span class="sw on" onclick="this.classList.toggle('on')"></span></td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Уведомления и просрочки</h3>${NOTI.map(n=>`<div class="kv"><span>${n[0]}</span><b>${n[1]}</b></div>`).join('')}</div>
 ${tzRef('14–15','Автоматизации CRM и логика уведомлений о дедлайнах и просрочках.')}`;

/* ---------- отчёты руководителя ---------- */
SC.reports8=()=>`<div class="hd"><div><h2>Отчёты руководителя</h2><p>Восемь отчётов из вашего ТЗ. Главная идея — видно не только этап заказа, но и почему он на этом этапе, кто отвечает за следующий шаг, какой дедлайн и что блокирует движение.</p></div></div>
 <div class="g2">${[['Продажи','38 заявок · конверсия в договор 34 % · 21,6 млн · главная причина отказа — цена','funnel'],['Проекты','15 активных проектов и их текущие этапы','funnel'],['Просрочки','2 просрочки: «Стекло-Мастер» (Максат), поставка профиля (Ерлан)','calendar'],['Производство','загрузка бригад 72 %, сроки по цеху','cload'],['Подрядчики','6 работ в процессе, 81 % в срок','contractors'],['Снабжение','3 заказные позиции, 1 просрочена','supply'],['Монтаж','4 запланировано на 2 недели, 1 сегодня','install'],['Финансы','договоры, оплаты, остатки, закрывающие документы','payclose']].map(r=>`<div class="pan clk" onclick="go('${r[2]}')"><h3>${r[0]}</h3><p class="mini">${r[1]}</p></div>`).join('')}</div>
 <div class="pan"><h3>Почему заказ стоит</h3><div class="tw"><table class="t"><thead><tr><th>Проект</th><th>Этап</th><th>Что блокирует</th><th>Следующий шаг</th><th>Дедлайн</th></tr></thead><tbody>${ORDERS.filter(o=>!['done','lead'].includes(o.st)).map(o=>{const b=nextBlock(o);return `<tr class="clk" onclick="openOrd('${o.id}')"><td><b>${o.id}</b></td><td>${stg(o.st)}</td><td class="mini ${b?'neg':''}">${b||'ничего — можно двигать'}</td><td>${STAFF[STN(o.st).z==='k'?(o.kon||'TM'):STN(o.st).z==='m'?o.mgr:'OL']}</td><td class="mono">${o.mont?dd(o.mont):'—'}</td></tr>`}).join('')}</tbody></table></div></div>
 ${tzRef('19–20','Ключевые отчёты руководителя и главная идея CRM: почему заказ на этапе, кто отвечает, дедлайн, что блокирует.')}`;

/* ---------- соответствие ТЗ ---------- */
const TZV=[['1','Принцип: одна карточка проекта, дочерние карточки','order','Карточка заказа'],['2','Единая модель карточки','order','Карточка заказа'],['3','Универсальная логика этапа: обязательные поля, причина возврата','order','Блок перехода'],['4','Воронка отдела продаж — 6 этапов','funnel','Воронка'],['4.1','Причины потери заявки','lost','Причины отказа'],['5','Работа менеджера: чек-лист 15 пунктов, ТЗ по коммуникациям','order','Карточка заказа'],['6','Воронка конструктора, модерация, пакет запуска','kboard','Конструкторская воронка'],['7','Дробление на производство и подрядчиков','contractors','Подрядчики'],['7.2','Календарь начальника производства','calendar','Календарь'],['8','Снабжение: в наличии / на заказ, даты поставки','supply','Снабжение'],['9','Сборка: карточка сборщика','brig','Мои заказы · бригада'],['10','Доставка и установка','install','Доставка и монтаж'],['11','Оплата и закрытие','payclose','Оплата и закрытие'],['12','Роли и зоны ответственности','roles','Роли и права'],['13','Матрица видимости','roles','Роли и права'],['14','Автоматизации CRM','autom','Автоматизации'],['15','Уведомления и просрочки','autom','Автоматизации'],['16','Связи сущностей: клиент → проекты → изделия → задачи','order','Изделия в карточке'],['17','История изменений','order','История в карточке'],['18','Приоритет разработки: MVP P0','launch','Запуск и стоимость'],['19','Ключевые отчёты руководителя','reports8','Отчёты руководителя'],['21','Вопросы до разработки','questions','Вопросы до разработки']];
SC.tzmap=()=>`<div class="hd"><div><h2>Соответствие вашему ТЗ</h2><p>Функциональное ТЗ «CRM для мебельного производства» v1.0 по разделам → где это в демо. Клик — открыть экран. Все разделы P0 из раздела 18 — в ядре.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Раздел</th><th>Что в ТЗ</th><th>Где в демо</th><th>Статус</th></tr></thead><tbody>${TZV.map(r=>`<tr><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td><a class="lk" onclick="go('${r[2]}')">${r[3]}</a></td><td><span class="tag g">входит</span></td></tr>`).join('')}</tbody></table></div>`;
const QS=[['Какие роли и права доступа?','Предлагаем 9 ролей демо: собственник, менеджер, конструктор, начальник производства, снабжение, сборщик, водитель, подрядчик, финансы; права «смотреть / менять» по матрице раздела 13.'],['Какие статусы и причины отказа утвердить?','Этапы и 8 причин — как в вашем ТЗ, уже в демо. Правим на шлифовке без доплаты.'],['Какие документы генерируются, какие прикрепляются?','Генерируем: КП, договор, ТЗ строителям, заявку на склад, АВР. Прикрепляем: эскизы, замеры, чертежи, подрядные таблицы.'],['Дедлайны — рабочие или календарные дни?','По умолчанию рабочие (Пн–Пт), монтаж — календарные; настраивается.'],['Какие уведомления и за сколько?','За 2 рабочих дня, за 1 день и при просрочке — по разделу 15 ТЗ.'],['Плановая загрузка производственных участков?','Да — календарь загрузки бригад и цеха уже в демо.'],['Себестоимость и маржа по проекту и изделию?','Да, по проекту — из расчёта и подрядчиков; по изделию — на шлифовке.'],['Что передавать в бухгалтерию?','Оплаты, договоры, АВР — выгрузкой в Excel; интеграция с 1С — по API отдельно.'],['Отдельная карточка для каждого изделия?','Да: изделие внутри проекта, у него свои производственные и подрядные задачи.'],['Что видят подрядчики со своим доступом?','Только свои работы: файлы, дедлайн, статус, сверку оплат — кабинет подрядчика.']];
SC.questions=()=>`<div class="hd"><div><h2>Вопросы до разработки · наши предложения</h2><p>Раздел 21 вашего ТЗ. На каждый вопрос — как мы предлагаем сделать; финально утверждаем вместе на старте.</p></div></div>
 ${QS.map((q,i)=>`<div class="pan qa"><b>${i+1}. ${q[0]}</b><p>${q[1]}</p></div>`).join('')}`;
const tzRef=(n,t)=>`<div class="tzref"><b>ТЗ · раздел ${n}</b><span>${t}</span></div>`;

function mebCards(){
 CARD.lostq=id=>['Отказ по заявке '+id,'Причина обязательна — без неё заявку не закрыть',`<div class="form"><label>Причина<select id="lq_r">${LOSTR.map(r=>`<option>${r}</option>`).join('')}</select></label><label>Комментарий<input id="lq_c" placeholder="обязателен для «Другое»"></label></div><button class="bt p" onclick="lostDo('${id}')">Закрыть как отказ</button>`];
 CARD.remark=id=>['Замечания модерации',id+' вернётся конструктору',`<div class="form"><label>Замечание<input id="rm_t" value="Уточнить вылет столешницы над посудомойкой"></label></div><button class="bt p" onclick="const o=OR('${id}');o.remarks.push(['${dd(TODAY)}',ROLES[role].n,document.getElementById('rm_t').value]);o.st='zam2';o.moder='remarks';closeM();render();toast('Проект возвращён конструктору, замечание сохранено в истории. Уведомлены конструктор и менеджер.')">Вернуть конструктору</button>`];
 CARD.supnew=()=>['Новая позиция снабжения','Для заказной позиции дата поставки обязательна',`<div class="form"><label>Проект<select id="sn_o">${ORDERS.filter(o=>STI(o.st)>=STI('start')&&o.st!=='done').map(o=>`<option>${o.id}</option>`).join('')}</select></label><label>Позиция<input id="sn_i" value="Подъёмник Aventos HK-S"></label><label>Тип<select id="sn_t"><option value="order">на заказ</option><option value="stock">в наличии</option></select></label><label>Плановая дата поставки<input id="sn_p" placeholder="дд.мм"></label></div><button class="bt p" onclick="supAdd()">Добавить</button>`];
}
function lostDo(id){const r=document.getElementById('lq_r').value,c=document.getElementById('lq_c').value.trim();if(r==='Другое'&&!c){toast('Для «Другое» комментарий обязателен.');return}const o=OR(id);LOSTS.unshift({n:CL(o.cl).n,t:o.t,r,m:o.mgr,d:dd(TODAY),c});ORDERS.splice(ORDERS.indexOf(o),1);closeM();go('lost');toast(`${id} закрыт как отказ: «${r}». Причина попала в аналитику.`)}
function supAdd(){const v=i=>document.getElementById(i).value.trim();if(v('sn_t')==='order'&&!v('sn_p')){toast('Для заказной позиции плановая дата поставки обязательна.');return}SUP.unshift({o:v('sn_o'),it:v('sn_i'),art:'—',q:'1',type:v('sn_t'),sup:'поставщик',ord:dd(TODAY),plan:v('sn_p')||'—',fact:v('sn_t')==='stock'?dd(TODAY):'',who:'Ерлан',aff:false});closeM();render();toast('Позиция добавлена, связана с проектом.')}

/* ===== Система ===== */
SC.roles=()=>{const A=[['Воронка и карточки заказов',{VS:2,AG:2,TM:1,OL:1}],['Чек-лист менеджера',{VS:2,AG:2,TM:1}],['Чек-лист конструктора, подрядчики',{VS:2,TM:2,OL:1}],['Расчёт, КП, договор',{VS:2,AG:2,TM:1}],['WhatsApp с клиентами',{VS:1,AG:2}],['Подрядчики и сроки',{VS:2,OL:2,TM:1,P5:1}],['Склад и закупка',{VS:2,OL:1,ER:2}],['Цех, монтаж',{VS:2,OL:2,B1:1}],['Модерация техпроекта',{VS:2,AG:2,TM:1,OL:1}],['Календарь дедлайнов',{VS:1,OL:2,TM:1,AG:1}],['Снабжение: даты поставки',{VS:1,OL:1,ER:2,AG:1,B1:1}],['Рейсы',{VS:2,OL:2,DR:1}],['Оплата и закрытие',{VS:2,AG:1,FN:2}],['Деньги, долги, зарплаты',{VS:2,FN:2}]];const R=Object.entries(ROLES);
 return `<div class="hd"><div><h2>Роли и права</h2><p>Каждый заходит под своим логином и сразу попадает в свою часть — выбирать роль не нужно, это только для показа. Права двух уровней: смотреть или менять. Собственник может всё и сам раздаёт права.</p></div></div>
 <div class="tw"><table class="t mx"><thead><tr><th>Раздел</th>${R.map(([k,v])=>`<th class="c">${esc(v.av)}<span>${esc(k)}</span></th>`).join('')}</tr></thead><tbody>${A.map(a=>`<tr><td>${a[0]}</td>${R.map(([k,v])=>`<td class="c">${a[1][v.p]===2?'<b class="pos" title="меняет">●</b>':a[1][v.p]===1?'<b class="mini" title="смотрит">○</b>':'<span class="mini">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
 <p class="mini">● — меняет · ○ — только смотрит · — — не видит</p>
 <div class="g2">${R.map(([k,v])=>`<div class="pan"><h3>${esc(k)} · ${esc(v.n)}</h3><p class="mini">${esc(v.note)}</p></div>`).join('')}</div>
 ${said('«У каждого на своём этапе… у кладовщика только к складу, у сборщика — к своему заказу, чтобы он все заказы не видел» · «Что-то он может только смотреть, что-то корректировать, а собственник может всё».')}`};
SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Одна фиксированная цена за всю систему по вашему ТЗ — один раз, без абонентской платы. Код и данные ваши, работает на вашем сервере.</p></div></div>
 <div class="pk"><div class="on"><small>Система целиком · по вашему ТЗ</small><b>2 200 000 ₸</b><span>все 21 раздел ТЗ: воронки, модерация, производство и подрядчики, снабжение, монтаж, оплата и закрытие, роли, автоматизации, отчёты</span></div><div class="gift"><small>Подарок от нас</small><b><s>≈ 300 000 ₸</s> 0 ₸</b><span>ваш калькулятор (≈50 пунктов, 200 вариантов) внутри системы с прайсами поставщиков — входит в 2,2 млн</span></div></div>
 <div class="pay3"><div><small>Старт · 10 %</small><b>220 000 ₸</b><span>сверяем ТЗ и вопросы раздела 21, первичка</span></div><div><small>Ядро · 45 %</small><b>990 000 ₸</b><span>после того, как вы приняли ядро</span></div><div><small>Шлифовка · 45 %</small><b>990 000 ₸</b><span>после приёмки всей системы</span></div></div>
 <div class="g2"><div class="pan"><h3>Ядро — 2–3 недели</h3>${['Воронка продаж и проектов по ТЗ, карточка с изделиями, история изменений','Чек-лист менеджера 15 пунктов, ТЗ по коммуникациям, причины отказа','Конструкторская воронка, модерация, пакет запуска','Подрядчики: карточка размножается, доски, сроки, сальдо','Склад с ячейками, заявки и закупка','Роли, логины, матрица видимости'].map(x=>`<div class="li"><i>✓</i><span>${x}</span></div>`).join('')}</div>
 <div class="pan"><h3>Шлифовка — до сдачи, 4–8 недель всего</h3>${['КП и договор из карточки, подписание ЭЦП','WhatsApp в карточке и авто-сообщения','Календарь дедлайнов, снабжение с датами поставки, монтаж, рейсы','Кабинет подрядчика, оплата и закрытие, автоматизации и уведомления, 8 отчётов','Калькулятор — подарок, входит в цену'].map(x=>`<div class="li n"><i>→</i><span>${x}</span></div>`).join('')}</div></div>
 <div class="g2"><div class="pan"><h3>Ваши расходы потом</h3><div class="kv"><span>Сервер</span><b>до 10 000 ₸ в месяц</b></div><div class="kv"><span>WhatsApp, казахстанский провайдер</span><b>≈ 5 000 ₸ за номер</b></div><div class="kv"><span>Битрикс и МойСклад</span><b class="neg">больше не нужны · −108 000 ₸ в месяц</b></div></div>
 <div class="pan"><h3>Следующий шаг</h3><p class="mini" style="font-size:12.4px">Ваше ТЗ v1.0 получено и разложено по экранам демо. Цена зафиксирована — 2 200 000 ₸. Отвечаем на вопросы раздела 21, 10 % — и начинаем ядро.</p></div></div>
 ${said('«Чтобы мы дали полную информацию, вы сказали: это будет стоить столько-то, фиксированная стоимость» · «Два — приемлемо, два с половиной — надо подумать».')}`;

/* ===== Карточки ===== */
const CARD={};
CARD.cl=id=>{const c=CL(id);const O=ORDERS.filter(o=>o.cl===id);return [esc(c.n),`${esc(c.addr)} · ${c.src}`,`${c.note!=='—'?`<div class="pin" style="margin-top:0">${esc(c.note)}</div>`:''}<div class="kv"><span>Телефон</span><b class="mono">${c.ph}</b></div><h4 class="mh4">Заказы</h4>${O.map(o=>`<div class="kv clk" onclick="closeM();openOrd('${o.id}')"><span>${o.id} · ${esc(o.t)}</span><b>${STN(o.st).n} · ${fmt(o.sum)}</b></div>`).join('')}`]};
CARD.newlead=()=>['Новая заявка','Сарафан, повторный клиент, Instagram, 2ГИС',`<div class="form"><label>Клиент<input id="nl_n" value="Арман Жумабеков"></label><label>Телефон<input id="nl_p" value="+7 701 000 00 00"></label><label>Что нужно<input id="nl_t" value="Кухня угловая 3 м"></label><label>Тип<select id="nl_k"><option value="kitchen">Кухня</option><option value="wardrobe">Шкаф / гардероб</option><option value="other">Другое</option></select></label><label>Откуда<select id="nl_s"><option>Сарафан</option><option>Повторный</option><option>Instagram</option><option>2ГИС</option></select></label><label>Менеджер<select id="nl_m"><option value="AG">Айгерим</option><option value="DN">Дина</option><option value="MK">Максат</option><option value="OG">Ольга</option></select></label></div><button class="bt p" onclick="newLead()">Создать</button>`];
function newLead(){const v=i=>document.getElementById(i).value;const cid='C'+(CLIENTS.length+1);CLIENTS.push({id:cid,n:v('nl_n'),ph:v('nl_p'),addr:'—',src:v('nl_s'),note:'—'});const id='К-'+(1515+ORDERS.length-16);const k=v('nl_k');ORDERS.unshift({id,cl:cid,kind:k,t:v('nl_t'),sum:0,paid:0,mgr:v('nl_m'),kon:null,st:'lead',br:null,mont:null,podr:[],d:TODAY,log:[],wa:[],chM:CHK.m.items.map(()=>0),chK:CHK[k].items.map(()=>0)});closeM();curOrd=id;go('order');toast(`Заявка ${id} создана — менеджеру пришло уведомление, следующий шаг — первичный замер.`)}
CARD.chkadd=k=>['Новый пункт чек-листа',CHK[k].n,`<div class="form"><label>Пункт<input id="ck_t" value="Фото стен до монтажа"></label></div><button class="bt p" onclick="CHK['${k}'].items.push(document.getElementById('ck_t').value);ORDERS.forEach(o=>{if(('${k}'==='m')&&o.chM)o.chM.push(STI(o.st)>STI('dog')?1:0);else if(o.kind==='${k}')o.chK.push(STI(o.st)>STI('kd')?1:0)});closeM();render();toast('Пункт добавлен — новые карточки получат его сразу.')">Добавить</button>`];
CARD.leave=()=>['Отпуск','Попадёт в календарь загрузки',`<div class="form"><label>Кто<select id="lv_k"><option value="TM">Тимур</option><option value="SA">Сауле</option><option value="B1">Бригада 1</option><option value="B3">Бригада 3</option></select></label><label>С<input id="lv_a" type="date" value="2026-10-27"></label><label>По<input id="lv_b" type="date" value="2026-10-31"></label></div><button class="bt p" onclick="const v=i=>document.getElementById(i).value;LEAVE.push({k:v('lv_k'),n:document.getElementById('lv_k').selectedOptions[0].text,a:v('lv_a'),b:v('lv_b')});closeM();render();toast('Отпуск добавлен — монтаж на эти дни система не предложит.')">Добавить</button>`];
CARD.newco=()=>['Новый подрядчик','Или свой участок — контроль одинаковый',`<div class="form"><label>Название<input id="co_n" value="«ГнутьеПро»"></label><label>Что делает<input id="co_w" value="Гнутые фасады"></label><label>Доступ в кабинет<select id="co_l"><option value="1">Да, свой логин</option><option value="0">Нет, только уведомления</option></select></label></div><button class="bt p" onclick="const v=i=>document.getElementById(i).value;CONTR.push({id:'P'+(CONTR.length+1),n:v('co_n'),w:v('co_w'),ph:'—',login:+v('co_l')});closeM();render();toast('Подрядчик добавлен — конструкторы могут отмечать его в заказах.')">Добавить</button>`];
CARD.trip=()=>['Новый рейс','Водителю придёт уведомление',`<div class="form"><label>Заказ<select id="tr_o">${ORDERS.filter(o=>!['lead','done'].includes(o.st)).map(o=>`<option>${o.id}</option>`).join('')}</select></label><label>Что<input id="tr_n" value="Забрать фасады из малярки"></label><label>Дата<input id="tr_d" type="date" value="2026-10-07"></label><label>Время<input id="tr_t" value="10:00"></label></div><button class="bt p" onclick="const v=i=>document.getElementById(i).value;TRIPS.push({d:v('tr_d'),t:v('tr_t'),k:'drive',o:v('tr_o'),n:v('tr_n'),who:'Жандос',to:'→ цех'});TRIPS.sort((a,b)=>a.d<b.d?-1:1);closeM();render();toast('Рейс добавлен — Жандосу пришло уведомление.')">Добавить</button>`];
CARD.inv=()=>['Инвентаризация','Факт по ячейкам — разница спишется с причиной',`<div class="form">${STOCK.slice(0,6).map(s=>`<label>${s.cell} · ${esc(s.n.split(' · ')[0])} · по учёту ${s.q}<input id="iv_${s.id}" value="${s.q}"></label>`).join('')}</div><button class="bt p" onclick="STOCK.slice(0,6).forEach(s=>{const n=+document.getElementById('iv_'+s.id).value;if(n>=0)s.q=n});closeM();render();toast('Инвентаризация проведена.')">Провести</button>`];
CARD.cash=()=>['Расход','Административный или любой другой',`<div class="form"><label>Что<input id="cs_n" value="Кофе-машина в шоурум"></label><label>Сумма, ₸<input id="cs_s" value="120000"></label><label>Статья<select id="cs_c"><option>Административные</option><option>Материалы</option><option>Аренда</option><option>Подрядчики</option></select></label></div><button class="bt p" onclick="const v=i=>document.getElementById(i).value;CASH.push({d:TODAY,k:'out',n:v('cs_n'),s:+v('cs_s')||0,c:v('cs_c')});closeM();render();toast('Расход записан.')">Записать</button>`];
mebCards();
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(k){toast('Готово.')}
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();const o=ORDERS.find(x=>(x.id+' '+x.t+' '+CL(x.cl).n).toLowerCase().includes(q));if(o&&allowed('order')){openOrd(o.id);return}const c=CLIENTS.find(x=>x.n.toLowerCase().includes(q));if(c){card('cl',c.id);return}const s=STOCK.find(x=>(x.n+x.art+x.cell).toLowerCase().includes(q));if(s&&allowed('stock')){go('stock');toast(`${s.n} — ячейка ${s.cell}, свободно ${s.q-s.res} ${s.u}.`);return}toast('Не найдено: попробуйте «К-1501», «Сейтова», «Blum», «Ф-03».')}

/* ===== Каркас: одна навигация слева ===== */
const LOGO='<svg width="34" height="34" viewBox="0 0 100 100" aria-hidden="true"><rect x="18" y="10" width="64" height="80" rx="3" fill="none" stroke="#d9a35b" stroke-width="7"/><path d="M50 10v80" stroke="#d9a35b" stroke-width="6"/><path d="M42 44v12M58 44v12" stroke="#f3ece2" stroke-width="6" stroke-linecap="round"/><path d="M24 90v6M76 90v6" stroke="#d9a35b" stroke-width="6" stroke-linecap="round"/></svg>';
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}. В рабочей системе — по своему логину.`)}
function switchRole(k){role=k;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
function buildRail(){const r=document.getElementById('rail');if(r)r.innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="nlogo">${LOGO}<div><b>КОРПУС</b><small>мебель на заказ</small></div></div>`+SEC.map(s=>{const X=s.sub.filter(x=>allowed(x[0]));if(!X.length)return '';return `<h4>${s.n}</h4>`+X.map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='contractors'&&JOBS.some(jLate)?'<em>'+JOBS.filter(jLate).length+'</em>':''}${x[0]==='requests'&&REQS.some(r=>r.st==='new')?'<em>'+REQS.filter(r=>r.st==='new').length+'</em>':''}</a>`).join('')}).join('')+`<div class="nme"><i>${ROLES[role].av}</i><div><b>${esc(ROLES[role].n)}</b><small>${esc(role)}</small></div></div>`}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.today;document.body.dataset.sec=SECOF[cur];document.getElementById('ttl').textContent=SUBN[cur]||'Корпус';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('funnel')&&role!=='Начальник производства'?'':'none';try{history.replaceState(null,'','?s='+cur+(cur==='order'?'&o='+curOrd:''))}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}

const TOUR=[
 ['today','1 · Пульт: все заказы с готовностью, что горит у подрядчиков и на складе, деньги месяца.'],
 ['funnel','2 · Воронка с вашими этапами — от заявки до акта, шкала готовности на каждой карточке.'],
 ['order','3 · Карточка заказа: клиент, деньги, документы, чек-лист текущего этапа, подрядчики, склад, WhatsApp.'],
 ['calc','4 · Расчёт по образцу вашей таблицы: пункты, варианты, цены из прайсов поставщиков.'],
 ['kp','5 · КП из расчёта, договор из карточки, подписание ЭЦП или скан бумаги.'],
 ['kboard','6 · Конструкторская воронка: свои этапы и чек-лист под тип изделия.'],
 ['contractors','7 · Подрядчики: карточка размножилась на доски, сроки, просрочки, сальдо.'],
 ['contractor','8 · Кабинет подрядчика: свои заказы, документы, дедлайн, «готово».'],
 ['requests','9 · Заявка на склад из карточки: отгрузить или дозаказать.'],
 ['stock','10 · Склад: ячейки, резерв под заказы, минимальные остатки.'],
 ['cload','11 · Загрузка бригад и конструкторов, отпуска.'],
 ['install','12 · Доставка и монтаж: рейсы водителя, корпус и фасады.'],
 ['wa','13 · WhatsApp внутри карточки и авто-сообщения клиенту.'],
 ['money','14 · Приходы и расходы, включая административные.'],
 ['roles','15 · Роли: каждый по своему логину, смотреть или менять.'],
 ['tzmap','16 · Ваше ТЗ по разделам — где каждый пункт в демо.'],
 ['calendar','17 · Календарь начальника производства: все дедлайны и просрочки.'],
 ['supply','18 · Снабжение: в наличии или на заказ, дата поставки обязательна.'],
 ['payclose','19 · Оплата и закрытие: остаток, АВР, документы.'],
 ['autom','20 · 14 автоматизаций и правила уведомлений.'],
 ['launch','21 · Стоимость: 2,2 млн один раз, калькулятор — подарок. 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается: этапы, чек-листы, подрядчики, склад, расчёт.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;if(k==='order')curOrd='К-1501';build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='',o='';try{const u=new URLSearchParams(location.search);q=u.get('s')||'';o=u.get('o')||''}catch(e){}if(o&&OR(o))curOrd=o;
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
