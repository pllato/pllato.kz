/* КВАРТА — B2B-платформа для аутсорсинга: бухгалтерия, юридическое сопровождение, налоговый консалтинг и HR для ~500 клиентов. Заявки вместо WhatsApp и Telegram, переключение между клиентами, мессенджер и звонки, ИИ-шаблоны документов, кабинет клиента и мобильное приложение, перенос из Битрикс24, серверы в Казахстане. Все компании, имена и суммы вымышленные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(n<0?'−':'')+(Math.round(Math.abs(n)/100000)/10).toString().replace('.',',')+' млн';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};
const dd=s=>{const [y,m,d]=s.split('-');return d+'.'+m};
const dl=s=>{const [y,m,d]=s.split('-');return d+'.'+m+'.'+y};
const TODAY='2026-10-01',NOW='15:10';
const addDays=(s,n)=>new Date(new Date(s+'T00:00:00').getTime()+n*864e5).toISOString().slice(0,10);
const daysBetween=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);

const SEC=[
 {k:'in',n:'Заявки',list:true,sub:[['inbox','Входящие'],['req','Заявка'],['board','Доска по направлениям']]},
 {k:'cl',n:'Клиенты',list:true,sub:[['ws','Рабочее место клиента'],['chat','Мессенджер'],['calls','Звонки'],['clients','Все клиенты']]},
 {k:'dir',n:'Направления',list:true,sub:[['buh','Бухгалтерия'],['law','Юридическое'],['tax','Налоги'],['hr','HR и кадры']]},
 {k:'doc',n:'Документы',list:true,sub:[['ai','ИИ-шаблоны'],['docs','Архив и подпись'],['tpl','Библиотека шаблонов']]},
 {k:'co',n:'Компания',list:false,sub:[['tasks','Внутренние задачи'],['team','Команда и загрузка'],['billing','Тарифы и счета'],['analytics','Аналитика']]},
 {k:'side',n:'Клиенту',list:false,sub:[['portal','Кабинет клиента'],['app','Мобильное приложение']]},
 {k:'sys',n:'Система',list:false,sub:[['migrate','Перенос и 1С'],['security','Серверы и данные'],['roles','Роли и права'],['launch','Запуск и стоимость']]}
];
const SECOF={},SUBN={},SECK={};
SEC.forEach(s=>{SECK[s.k]=s;s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]})});
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));

const ROLES={
 'Руководитель':{av:'СЖ',p:'SZ',n:'Санжар',note:'Все клиенты и направления, загрузка команды, счета, аналитика, настройки',s:ALL.slice()},
 'Менеджер клиентов':{av:'АС',p:'AS',n:'Асем',note:'Входящие заявки, распределение, SLA, связь с клиентами, счета',s:['inbox','req','board','ws','chat','calls','clients','billing','portal','app']},
 'Бухгалтер':{av:'АЙ',p:'AY',n:'Айгуль',dir:'buh',note:'Свои клиенты: заявки по бухгалтерии, сроки отчётности, первичка, документы',s:['inbox','req','board','ws','chat','calls','buh','ai','docs','tpl','tasks']},
 'Юрист':{av:'АЛ',p:'AL',n:'Алия',dir:'law',note:'Договоры, претензии, регистрация — шаблоны с ИИ и подпись',s:['inbox','req','board','ws','chat','calls','law','ai','docs','tpl','tasks']},
 'Налоговый консультант':{av:'МР',p:'MR',n:'Марат',dir:'tax',note:'Уведомления КГД, проверки, возврат НДС, консультации',s:['inbox','req','board','ws','chat','calls','tax','ai','docs','tpl','tasks']},
 'HR-специалист':{av:'МЯ',p:'MA',n:'Мария',dir:'hr',note:'Приёмы, отпуска, увольнения, табель, кадровые документы клиентов',s:['inbox','req','board','ws','chat','calls','hr','ai','docs','tpl','tasks']},
 'Клиент':{av:'НР',p:'CL',n:'Нурлан · группа «Нур»',note:'Кабинет клиента: заявки, документы, счета, чат и звонки со своей командой',s:['portal','app']}
};
let role='Руководитель',cur='inbox',theme='light',curCl='C3',clQ='',clF='all';
const STAFF={SZ:'Санжар',AS:'Асем',AY:'Айгуль',DN:'Динара',ER:'Ерлан',AL:'Алия',TM:'Тимур',MR:'Марат',MA:'Мария'};
const DIRS={buh:{n:'Бухгалтерия',s:'Бух',c:'#23935f'},law:{n:'Юридическое',s:'Юр',c:'#1f7aa8'},tax:{n:'Налоги',s:'Налог',c:'#c98a1b'},hr:{n:'HR и кадры',s:'HR',c:'#c4506e'}};

/* ===== Клиенты ===== */
let CLIENTS=[
 {id:'C1',n:'ТОО «Алтын Дала Агро»',sh:'Алтын Дала',bin:'190440012345',boss:'Ержан Кусаинов',ph:'+7 701 555 10 01',tariff:'Полный',fee:280000,dirs:['buh','tax','hr'],resp:{buh:'AY',tax:'MR',hr:'MA'},staff:46,un:2,last:'Скинули выписку за сентябрь',lt:'14:52',debt:0,group:''},
 {id:'C2',n:'ИП Жаксыбеков Е. А.',sh:'ИП Жаксыбеков',bin:'880512300456',boss:'Ерлан Жаксыбеков',ph:'+7 777 555 20 02',tariff:'Упрощёнка',fee:30000,dirs:['buh'],resp:{buh:'DN'},staff:2,un:0,last:'Спасибо, понятно',lt:'12:10',debt:0,group:''},
 {id:'C3',n:'ТОО «QazLogistic»',sh:'QazLogistic',bin:'170840023456',boss:'Айдос Сарсенов',ph:'+7 705 555 30 03',tariff:'Полный',fee:320000,dirs:['buh','law','tax','hr'],resp:{buh:'AY',law:'AL',tax:'MR',hr:'MA'},staff:88,un:4,last:'Пришло уведомление из КГД, что делать?',lt:'15:02',debt:0,group:''},
 {id:'C4',n:'ТОО «Нур-Строй Инвест»',sh:'Нур-Строй',bin:'150240034567',boss:'Нурлан Нуров',ph:'+7 701 555 40 04',tariff:'Стандарт',fee:180000,dirs:['buh','tax','law'],resp:{buh:'ER',tax:'MR',law:'TM'},staff:34,un:1,last:'Акт от субподрядчика приложил',lt:'13:40',debt:180000,group:'Нур'},
 {id:'C5',n:'ТОО «Нур Бетон»',sh:'Нур Бетон',bin:'200140045678',boss:'Нурлан Нуров',ph:'+7 701 555 40 04',tariff:'Стандарт',fee:150000,dirs:['buh','hr'],resp:{buh:'ER',hr:'MA'},staff:21,un:0,last:'Отпуск водителю с 12.10',lt:'вчера',debt:0,group:'Нур'},
 {id:'C6',n:'ТОО «MedLine Clinic»',sh:'MedLine',bin:'180640056789',boss:'Гульнара Ахметова',ph:'+7 747 555 60 06',tariff:'Юрист',fee:90000,dirs:['law'],resp:{law:'AL'},staff:19,un:1,last:'Нужен договор с врачом-совместителем',lt:'11:25',debt:0,group:''},
 {id:'C7',n:'ТОО «Coffee Point KZ»',sh:'Coffee Point',bin:'210940067890',boss:'Тимур Ли',ph:'+7 707 555 70 07',tariff:'Стандарт + HR',fee:210000,dirs:['buh','hr'],resp:{buh:'DN',hr:'MA'},staff:63,un:3,last:'Принимаем 3 бариста с понедельника',lt:'14:31',debt:0,group:''},
 {id:'C8',n:'ИП Сагындыкова А. Т.',sh:'ИП Сагындыкова',bin:'910303400789',boss:'Айгерим Сагындыкова',ph:'+7 702 555 80 08',tariff:'Упрощёнка',fee:30000,dirs:['buh'],resp:{buh:'DN'},staff:1,un:1,last:'Хочу закрыть ИП, как правильно?',lt:'10:05',debt:30000,group:''},
 {id:'C9',n:'ТОО «Tech Solutions Almaty»',sh:'Tech Solutions',bin:'160540078901',boss:'Данияр Омаров',ph:'+7 701 555 90 09',tariff:'Полный',fee:300000,dirs:['buh','law','tax','hr'],resp:{buh:'AY',law:'AL',tax:'MR',hr:'MA'},staff:52,un:0,last:'Договор аренды прислал на проверку',lt:'вчера',debt:0,group:''},
 {id:'C10',n:'ТОО «Береке Трейд»',sh:'Береке Трейд',bin:'140340089012',boss:'Асхат Беков',ph:'+7 705 555 11 10',tariff:'Стандарт',fee:160000,dirs:['buh','tax'],resp:{buh:'ER',tax:'MR'},staff:18,un:0,last:'Когда будет возврат НДС?',lt:'вчера',debt:0,group:''},
 {id:'C11',n:'ТОО «Green Energy KZ»',sh:'Green Energy',bin:'220240090123',boss:'Сергей Ким',ph:'+7 777 555 12 11',tariff:'Юрист + налоги',fee:140000,dirs:['law','tax'],resp:{law:'TM',tax:'MR'},staff:12,un:0,last:'Претензию отправили, ждём ответ',lt:'30.09',debt:0,group:''},
 {id:'C12',n:'ТОО «Арна Девелопмент»',sh:'Арна',bin:'190940001234',boss:'Камила Жумабаева',ph:'+7 701 555 13 12',tariff:'Стандарт',fee:170000,dirs:['buh','law'],resp:{buh:'AY',law:'TM'},staff:27,un:2,last:'ЭСФ от поставщика так и не пришла',lt:'13:12',debt:0,group:''},
 {id:'C13',n:'ИП Нуров Н. К.',sh:'ИП Нуров',bin:'850707300345',boss:'Нурлан Нуров',ph:'+7 701 555 40 04',tariff:'Упрощёнка',fee:30000,dirs:['buh'],resp:{buh:'ER'},staff:1,un:0,last:'Декларация 910 — подписал',lt:'29.09',debt:0,group:'Нур'}
];
const CL=id=>CLIENTS.find(c=>c.id===id);
const TOTAL_CLIENTS=512;

/* ===== Заявки ===== */
const RST=[
 {k:'new',n:'Новая',c:'#2f5bea'},{k:'work',n:'В работе',c:'#c98a1b'},{k:'wait',n:'Ждём клиента',c:'#6b7c93'},{k:'check',n:'На проверке',c:'#1f7aa8'},{k:'done',n:'Готово',c:'#23935f'}
];
const RSTOF=k=>RST.find(s=>s.k===k)||RST[0];
let REQS=[
 {id:'R-1041',cl:'C3',dir:'tax',t:'Ответить на уведомление КГД о расхождениях по ЭСФ',from:'Приложение',d:'2026-10-01',tm:'15:02',sla:'2026-10-01 19:00',st:'new',resp:'MR',pri:true,docs:['Уведомление_КГД_№4471.pdf'],msgs:[['cl','Айдос','Пришло уведомление из КГД о расхождениях по ЭСФ за 2 квартал. Что делать и до какого числа отвечать?','15:02'],['sys','','Заявка создана в приложении · направление «Налоги» · ответственный Марат · срок первого ответа 4 часа','15:02']]},
 {id:'R-1040',cl:'C1',dir:'buh',t:'Сверка с поставщиком «Агрохим» за 9 месяцев',from:'Портал',d:'2026-09-30',tm:'10:20',sla:'2026-10-03 18:00',st:'work',resp:'AY',docs:['Акт_сверки_Агрохим.xlsx'],msgs:[['cl','Ержан','Нужна сверка с «Агрохимом», у них расхождение 1,2 млн','10:20'],['me','Айгуль','Взяла в работу. Запросила акт у поставщика, к пятнице сделаю','10:41']]},
 {id:'R-1039',cl:'C7',dir:'hr',t:'Принять 3 бариста с 05.10 — трудовые договоры и приказы',from:'Приложение',d:'2026-10-01',tm:'14:31',sla:'2026-10-02 18:00',st:'work',resp:'MA',docs:['Удостоверения_3шт.pdf'],msgs:[['cl','Тимур','Принимаем 3 бариста с понедельника, удостоверения прикрепил','14:31'],['me','Мария','Подготовлю договоры и приказы по шаблону, завтра до обеда пришлю на подпись','14:40']]},
 {id:'R-1038',cl:'C9',dir:'law',t:'Проверить договор аренды офиса',from:'Портал',d:'2026-09-30',tm:'17:05',sla:'2026-10-02 18:00',st:'check',resp:'AL',docs:['Договор_аренды_проект.docx','Замечания_юриста.pdf'],msgs:[['cl','Данияр','Арендодатель прислал договор, проверьте риски','17:05'],['me','Алия','Нашла 4 риска: односторонний рост ставки, штраф 1% в день… Замечания приложила','11:30']]},
 {id:'R-1037',cl:'C5',dir:'hr',t:'Отпуск водителю с 12.10',from:'Портал',d:'2026-09-30',tm:'16:00',sla:'2026-10-02 18:00',st:'new',resp:'MA',docs:[],msgs:[['cl','Нурлан','Отпуск водителю Сериков Б. с 12.10 на 14 дней','16:00']]},
 {id:'R-1036',cl:'C4',dir:'buh',t:'Провести акт субподрядчика и счёт на оплату',from:'Портал',d:'2026-09-29',tm:'11:15',sla:'2026-10-01 18:00',st:'wait',resp:'ER',docs:['Акт_выполненных_работ.pdf'],msgs:[['me','Ерлан','Не хватает счёта-фактуры от субподрядчика — без него не проведу','12:00'],['cl','Нурлан','Акт от субподрядчика приложил, счёт-фактуру запросил','13:40']]},
 {id:'R-1035',cl:'C2',dir:'buh',t:'Сколько налогов за 2 полугодие?',from:'Приложение',d:'2026-09-29',tm:'09:30',sla:'2026-09-29 13:30',st:'done',resp:'DN',docs:['Расчёт_910.pdf'],msgs:[['cl','Ерлан','Сколько платить за 2 полугодие?','09:30'],['me','Динара','Расчёт приложила: 3% от дохода, срок оплаты — до 25.02','10:15']]},
 {id:'R-1034',cl:'C11',dir:'law',t:'Претензия контрагенту за просрочку поставки',from:'Портал',d:'2026-09-25',tm:'12:00',sla:'2026-09-27 18:00',st:'done',resp:'TM',docs:['Претензия_№12.pdf'],msgs:[]},
 {id:'R-1033',cl:'C10',dir:'tax',t:'Возврат НДС — подготовить пакет документов',from:'Портал',d:'2026-09-23',tm:'10:00',sla:'2026-10-07 18:00',st:'work',resp:'MR',docs:['Реестр_ЭСФ.xlsx'],msgs:[]},
 {id:'R-1032',cl:'C6',dir:'law',t:'Договор с врачом-совместителем',from:'Приложение',d:'2026-10-01',tm:'11:25',sla:'2026-10-02 11:25',st:'new',resp:'AL',docs:[],msgs:[['cl','Гульнара','Нужен договор с врачом-совместителем, 0,5 ставки','11:25']]},
 {id:'R-1031',cl:'C12',dir:'buh',t:'ЭСФ от поставщика не пришла',from:'Приложение',d:'2026-09-30',tm:'13:12',sla:'2026-10-01 13:12',st:'wait',resp:'AY',docs:[],msgs:[]},
 {id:'R-1030',cl:'C1',dir:'hr',t:'Табель за сентябрь',from:'Портал',d:'2026-09-30',tm:'09:00',sla:'2026-10-02 18:00',st:'check',resp:'MA',docs:['Табель_сентябрь.xlsx'],msgs:[]},
 {id:'R-1029',cl:'C9',dir:'buh',t:'Ведомость зарплаты за сентябрь',from:'Портал',d:'2026-09-28',tm:'10:00',sla:'2026-09-30 18:00',st:'done',resp:'AY',docs:['Ведомость_09.pdf'],msgs:[]},
 {id:'R-1028',cl:'C8',dir:'buh',t:'Хочу закрыть ИП — как правильно?',from:'Приложение',d:'2026-10-01',tm:'10:05',sla:'2026-10-01 14:05',st:'new',resp:'DN',docs:[],msgs:[['cl','Айгерим','Хочу закрыть ИП, как правильно?','10:05']]},
 {id:'R-1027',cl:'C3',dir:'hr',t:'Увольнение водителя по соглашению сторон',from:'Перенос из WhatsApp',d:'2026-09-26',tm:'18:40',sla:'2026-09-29 18:00',st:'done',resp:'MA',docs:['Приказ_увольнение.pdf'],msgs:[]},
 {id:'R-1026',cl:'C3',dir:'buh',t:'Ответить банку по валютному контролю',from:'Портал',d:'2026-09-30',tm:'15:30',sla:'2026-10-02 18:00',st:'work',resp:'AY',docs:['Запрос_банка.pdf'],msgs:[]}
];
const RQ=id=>REQS.find(r=>r.id===id);
let curReq='R-1041';

/* ===== Сроки отчётности ===== */
let DEADLINES=[
 {d:'2026-10-05',t:'Табель и начисление зарплаты за сентябрь',dir:'hr',n:38,done:31},
 {d:'2026-10-25',t:'ИПН, СН, ОПВ, ОСМС за сентябрь — оплата',dir:'buh',n:214,done:96},
 {d:'2026-10-25',t:'КПН — авансовые платежи за октябрь',dir:'tax',n:61,done:12},
 {d:'2026-11-15',t:'ФНО 200.00 за 3 квартал',dir:'buh',n:214,done:18},
 {d:'2026-11-15',t:'ФНО 300.00 (НДС) за 3 квартал',dir:'tax',n:88,done:9},
 {d:'2027-02-15',t:'ФНО 910.00 за 2 полугодие',dir:'buh',n:243,done:0}
];

/* ===== Мессенджер ===== */
let CHATS={
 C3:[['cl','Айдос Сарсенов','Добрый день! Пришло уведомление из КГД о расхождениях по ЭСФ, прикрепил в заявку','15:02'],['me','Марат','Вижу, беру. Сегодня до 19:00 скажу, что отвечаем и какие документы нужны','15:06'],['in','Айгуль · внутренняя заметка','Расхождение по 2 поставщикам, ЭСФ отозваны ими в июле — акты есть у меня','15:08'],['call','','Аудиозвонок · 4:12 · Марат ↔ Айдос','15:09']],
 C1:[['cl','Ержан Кусаинов','Скинули выписку за сентябрь','14:52'],['me','Айгуль','Получила, спасибо! Сверка с «Агрохимом» — в пятницу','14:55']],
 C7:[['cl','Тимур Ли','Принимаем 3 бариста с понедельника','14:31'],['me','Мария','Договоры и приказы завтра до обеда — на подпись в кабинете','14:40']]
};

/* ===== Звонки ===== */
let CALLS=[
 {t:'15:09',cl:'C3',who:'Айдос Сарсенов',me:'MR',kind:'audio',dur:'4:12',via:'Приложение',rec:true},
 {t:'14:20',cl:'C7',who:'Тимур Ли',me:'MA',kind:'video',dur:'11:40',via:'Портал',rec:true},
 {t:'12:45',cl:'C9',who:'Данияр Омаров',me:'AL',kind:'video',dur:'18:05',via:'Портал',rec:true},
 {t:'11:30',cl:'C4',who:'Нурлан Нуров',me:'ER',kind:'audio',dur:'3:02',via:'Приложение',rec:true},
 {t:'10:10',cl:'C8',who:'Айгерим Сагындыкова',me:'DN',kind:'audio',dur:'0:00',via:'Приложение',rec:false,missed:true}
];

/* ===== Шаблоны ===== */
let TPLS=[
 {id:'T1',dir:'hr',n:'Трудовой договор',f:['ФИО работника','Должность','Оклад','Дата начала','Испытательный срок'],used:184},
 {id:'T2',dir:'hr',n:'Приказ о приёме на работу',f:['ФИО','Должность','Дата'],used:176},
 {id:'T3',dir:'hr',n:'Приказ об отпуске',f:['ФИО','Вид отпуска','Даты'],used:92},
 {id:'T4',dir:'law',n:'Договор оказания услуг',f:['Контрагент','Предмет','Сумма','Сроки'],used:61},
 {id:'T5',dir:'law',n:'Претензия за просрочку',f:['Контрагент','Договор','Сумма долга','Неустойка'],used:23},
 {id:'T6',dir:'law',n:'Доверенность',f:['Представитель','Полномочия','Срок'],used:48},
 {id:'T7',dir:'tax',n:'Ответ на уведомление КГД',f:['Номер уведомления','Период','Суть расхождения'],used:37},
 {id:'T8',dir:'buh',n:'Счёт на оплату',f:['Покупатель','Услуги','Сумма'],used:512},
 {id:'T9',dir:'buh',n:'Акт сверки',f:['Контрагент','Период'],used:140}
];

/* ===== Внутренние задачи ===== */
let TASKS=[
 {t:'Перенести клиентов из Битрикс24 — проверка дублей',who:'AS',due:'2026-10-03',st:'work'},
 {t:'Планёрка бухгалтеров: сроки 25 октября',who:'SZ',due:'2026-10-02',st:'new'},
 {t:'Обновить шаблон трудового договора под изменения ТК',who:'MA',due:'2026-10-05',st:'new'},
 {t:'Разобрать просроченные заявки за сентябрь',who:'AS',due:'2026-10-01',st:'work'},
 {t:'Подготовить предложение «Полный пакет» для Береке Трейд',who:'SZ',due:'2026-10-06',st:'new'},
 {t:'Сверить ЭЦП клиентов со сроком до конца года',who:'ER',due:'2026-10-10',st:'done'}
];

/* ===== Общие ===== */
const SC={};
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const dirm=k=>`<span class="dirm" style="--c:${DIRS[k].c}">${esc(DIRS[k].s)}</span>`;
const rst=k=>{const s=RSTOF(k);return `<span class="st" style="--sc:${s.c}">${esc(s.n)}</span>`};
const clL=id=>`<a class="lk" onclick="event.stopPropagation();pickCl('${id}')">${esc(CL(id).sh)}</a>`;
const ava=(t,c)=>`<span class="ava" style="--c:${c||'var(--brand)'}">${esc(t)}</span>`;
const ini=n=>n.replace(/ТОО|ИП|«|»/g,'').trim().split(/[\s-]+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
const myDir=()=>ROLES[role].dir||null;
const vis=r=>!myDir()||r.dir===myDir();
function slaLeft(r){if(r.st==='done')return '<span class="pos">в срок</span>';if(r.st==='wait')return '<span class="mini">срок на паузе</span>';const [d,t]=r.sla.split(' ');const mins=daysBetween(TODAY,d)*1440+(+t.slice(0,2)*60+ +t.slice(3))-(+NOW.slice(0,2)*60+ +NOW.slice(3));if(mins<0)return `<span class="neg">просрочено ${Math.round(-mins/60)} ч</span>`;if(mins<240)return `<span class="warnt">${Math.floor(mins/60)} ч ${mins%60} мин</span>`;return `<span class="mini">${mins<1440?Math.round(mins/60)+' ч':Math.round(mins/1440)+' дн.'}</span>`}
function pickCl(id){if(!CL(id))return;curCl=id;CL(id).un=0;if(!SECK[SECOF[cur]].list||['inbox','board','clients'].includes(cur)){if(allowed('ws'))cur='ws'}build();toast(`Клиент: ${esc(CL(id).n)}. Всё рабочее место переключилось на него.`)}
function openReq(id){if(!RQ(id))return;curReq=id;curCl=RQ(id).cl;if(allowed('req')){cur='req';build()}else card('req',id)}
function reqSt(id,st){const r=RQ(id);r.st=st;if(st==='work'&&!r.msgs.some(m=>m[0]==='me'))r.msgs.push(['me',STAFF[r.resp],'Взял(а) в работу, вернусь с ответом в срок',NOW]);render();toast({work:'Заявка в работе — клиент видит статус в кабинете и приложении.',wait:'Статус «ждём клиента»: срок на паузе, клиенту — уведомление, что нужно от него.',check:'На проверке у руководителя направления.',done:'Готово: клиенту — уведомление и документы в кабинете. Попросим оценку.'}[st]||'')}
function sendMsg(id){const i=document.getElementById('msgin');if(!i||!i.value.trim())return;const r=RQ(id);r.msgs.push(['me',STAFF[ROLES[role].p]||'Сотрудник',i.value.trim(),NOW]);if(r.st==='new')r.st='work';render();toast('Отправлено — клиент получит push в приложении и сообщение в кабинете.')}

/* ===== Входящие ===== */
let inF='all',inDir='all';
SC.inbox=()=>{let L=REQS.filter(vis);if(inDir!=='all')L=L.filter(r=>r.dir===inDir);const F=L.filter(r=>inF==='all'?r.st!=='done':inF==='mine'?r.resp===ROLES[role].p:r.st===inF);
 const late=L.filter(r=>r.st!=='done'&&slaLeft(r).indexOf('просрочено')>=0).length;
 return `<div class="hd"><div><h2>Входящие заявки${myDir()?' · '+DIRS[myDir()].n:''}</h2><p>Каждый запрос клиента — заявка с направлением, ответственным и сроком ответа, а не сообщение в чьём-то WhatsApp. Клиент пишет из кабинета или приложения; ответ, документы и звонок — внутри заявки.</p></div><div class="btns"><button class="bt" onclick="go('board')">Доска</button><button class="bt p" onclick="card('newreq')">+ Заявка</button></div></div>
 <div class="wid"><div><small>Новые</small><b class="a">${L.filter(r=>r.st==='new').length}</b><span>ждут первого ответа</span></div><div><small>В работе</small><b>${L.filter(r=>r.st==='work').length}</b></div><div><small>Ждём клиента</small><b>${L.filter(r=>r.st==='wait').length}</b><span>срок на паузе</span></div><div><small>Просрочено</small><b class="${late?'r':'g'}">${late}</b></div><div><small>Первый ответ</small><b class="g">38 мин</b><span>в среднем за сентябрь</span></div></div>
 <div class="filt">${[['all','Открытые'],['mine','Мои'],['new','Новые'],['wait','Ждём клиента'],['done','Готово']].map(f=>`<button class="${inF===f[0]?'on':''}" onclick="inF='${f[0]}';render()">${f[1]}</button>`).join('')}${myDir()?'':`<span class="fsep"></span><button class="${inDir==='all'?'on':''}" onclick="inDir='all';render()">Все направления</button>${Object.keys(DIRS).map(k=>`<button class="${inDir===k?'on':''}" onclick="inDir='${k}';render()"><i class="sq" style="background:${DIRS[k].c}"></i>${DIRS[k].s}</button>`).join('')}`}</div>
 <div class="rql">${F.map(r=>{const c=CL(r.cl);return `<div class="rq ${r.pri?'pri':''}" style="--c:${DIRS[r.dir].c}" onclick="openReq('${r.id}')">${ava(ini(c.sh),DIRS[r.dir].c)}<div class="rqb"><div class="rqh"><b>${esc(r.t)}</b>${rst(r.st)}</div><span>${esc(c.n)} · <span class="mono">${r.id}</span> · ${esc(r.from)} · ${dd(r.d)} ${r.tm}</span>${r.msgs.length?`<em>${esc(r.msgs[r.msgs.length-1][2].slice(0,110))}</em>`:''}</div><div class="rqr">${dirm(r.dir)}<span>${STAFF[r.resp]}</span><b>${slaLeft(r)}</b></div></div>`}).join('')||'<p class="mini">Нет заявок по фильтру.</p>'}</div>
 ${said('«Каждый месяц бывают запросы. Мы хотим этим сервисом закрыть именно фактор WhatsApp — сейчас всё через WhatsApp, Telegram.»')}`};

/* ===== Заявка ===== */
const FLOWR=['new','work','wait','check','done'];
SC.req=()=>{let r=RQ(curReq);if(!r||!vis(r))r=REQS.find(vis);curReq=r.id;const c=CL(r.cl);
 return `<div class="crumb"><a onclick="go('inbox')">Входящие</a> / ${esc(c.sh)} / ${r.id}</div>
 <div class="hd"><div><h2>${esc(r.t)}</h2><p>${esc(c.n)} · ${dirm(r.dir)} · ответственный ${STAFF[r.resp]} · из «${esc(r.from)}» ${dl(r.d)} ${r.tm} · срок ответа: ${slaLeft(r)}</p></div><div class="btns"><button class="bt" onclick="callNow('audio','${c.id}')">Аудиозвонок</button><button class="bt" onclick="callNow('video','${c.id}')">Видео</button></div></div>
 <div class="steps">${FLOWR.map((k,i)=>`<div class="stp ${FLOWR.indexOf(r.st)>i?'done':r.st===k?'on':''}" onclick="reqSt('${r.id}','${k}')"><i>${i+1}</i>${RSTOF(k).n}</div>`).join('')}</div>
 <div class="g21"><div class="pan chatp"><h3>Переписка по заявке</h3><div class="chat">${r.msgs.map(m=>m[0]==='sys'?`<div class="msg sys">${esc(m[2])}<small>${m[3]}</small></div>`:`<div class="msg ${m[0]==='me'?'out':m[0]==='in'?'note':'in'}"><b>${esc(m[1])}</b>${esc(m[2])}<small>${m[3]}</small></div>`).join('')||'<p class="mini">Сообщений нет — заявка создана из формы.</p>'}</div>
  <div class="chs"><input id="msgin" placeholder="Ответ клиенту…" onkeydown="if(event.key==='Enter')sendMsg('${r.id}')"><button class="bt" onclick="toast('Внутренняя заметка видна только команде.')">Заметка</button><button class="bt p" onclick="sendMsg('${r.id}')">Отправить</button></div></div>
 <div><div class="pan"><h3>Документы</h3>${r.docs.map(f=>`<div class="file"><i>${f.split('.').pop().toUpperCase().slice(0,4)}</i><div><b>${esc(f)}</b><span>${f.indexOf('Замечания')===0||f.indexOf('Расчёт')===0||f.indexOf('Приказ')===0?'от команды':'от клиента'}</span></div></div>`).join('')||'<p class="mini">Пока нет.</p>'}<div class="btns l" style="margin-top:8px"><button class="bt p" onclick="aiFor('${r.id}')">Документ из шаблона с ИИ</button></div></div>
 <div class="pan"><h3>Клиент</h3>${[['Компания',esc(c.n)],['БИН/ИИН',`<span class="mono">${c.bin}</span>`],['Руководитель',esc(c.boss)],['Тариф',esc(c.tariff)],['Сотрудников',c.staff]].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}<button class="bt" style="margin-top:8px" onclick="pickCl('${c.id}')">Рабочее место клиента</button></div></div></div>`};

/* ===== Доска ===== */
SC.board=()=>{const L=REQS.filter(vis);
 return `<div class="hd"><div><h2>Доска заявок</h2><p>Все заявки по статусам; цвет полоски — направление. Перетаскивать не нужно: статус меняется кнопкой в заявке, клиент видит его сразу.</p></div></div>
 <div class="legend">${Object.values(DIRS).map(d=>`<span><i style="background:${d.c}"></i>${d.n}</span>`).join('')}</div>
 <div class="board">${RST.map(s=>{const C=L.filter(r=>r.st===s.k);return `<div class="bcol"><div class="bh" style="--c:${s.c}"><b>${s.n}</b><span>${C.length}</span></div>${C.map(r=>`<div class="oc" style="--c:${DIRS[r.dir].c}" onclick="openReq('${r.id}')"><div class="ocb">${dirm(r.dir)}<span class="mono">${r.id}</span></div><b>${esc(r.t)}</b><span>${esc(CL(r.cl).sh)} · ${STAFF[r.resp]}</span><div class="ocf"><em>${esc(r.from)}</em>${slaLeft(r)}</div></div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>`};

/* ===== Рабочее место клиента ===== */
SC.ws=()=>{const c=CL(curCl)||CLIENTS[0];const R=REQS.filter(r=>r.cl===c.id&&vis(r)),grp=c.group?CLIENTS.filter(x=>x.group===c.group):[];
 return `<div class="wsh"><div class="wsa">${esc(ini(c.sh))}</div><div class="wsn"><h2>${esc(c.n)}</h2><p><span class="mono">БИН ${c.bin}</span> · ${esc(c.boss)} · ${esc(c.ph)} · ${c.staff} ${plural(c.staff,['сотрудник','сотрудника','сотрудников'])}</p><div class="wst">${c.dirs.map(dirm).join(' ')}<span class="flag">тариф «${esc(c.tariff)}» · ${tg(c.fee)}/мес</span>${c.debt?`<span class="flag no">долг ${tg(c.debt)}</span>`:'<span class="flag ok">оплачено</span>'}</div></div>
  <div class="btns"><button class="bt" onclick="callNow('audio','${c.id}')">Аудиозвонок</button><button class="bt" onclick="callNow('video','${c.id}')">Видео</button><button class="bt p" onclick="card('newreq','${c.id}')">+ Заявка</button></div></div>
 <div class="kbd"><span>Переключиться на другого клиента — список слева или</span><kbd>Ctrl</kbd>+<kbd>K</kbd><span>и первые буквы названия · последние:</span>${['C1','C7','C9','C4'].filter(x=>x!==c.id).map(x=>`<a onclick="pickCl('${x}')">${esc(CL(x).sh)}</a>`).join('')}</div>
 ${grp.length>1?`<div class="note" style="--tone:var(--brand)"><b>Группа «${esc(c.group)}» · ${grp.length} ${plural(grp.length,['компания','компании','компаний'])} одного владельца</b><p>${grp.map(x=>x.id===c.id?`<strong>${esc(x.sh)}</strong>`:`<a class="lk" onclick="pickCl('${x.id}')">${esc(x.sh)}</a>`).join(' · ')} — владелец видит все свои компании в одном кабинете и переключается между ними.</p></div>`:''}
 <div class="g21" style="margin-top:12px"><div><div class="pan"><h3>Открытые заявки · ${R.filter(r=>r.st!=='done').length}</h3>${R.filter(r=>r.st!=='done').map(r=>`<div class="kv" style="cursor:pointer" onclick="openReq('${r.id}')"><span>${dirm(r.dir)} ${esc(r.t)}</span><b>${rst(r.st)} · ${slaLeft(r)}</b></div>`).join('')||'<p class="mini">Нет открытых заявок.</p>'}</div>
  <div class="pan"><h3>Сроки клиента</h3>${DEADLINES.filter(d=>c.dirs.includes(d.dir)).slice(0,4).map(d=>`<div class="kv"><span>${dirm(d.dir)} ${esc(d.t)}</span><b class="mono ${daysBetween(TODAY,d.d)<=7?'warnt':''}">${dd(d.d)}</b></div>`).join('')}</div>
  <div class="pan"><h3>Последние документы</h3>${R.flatMap(r=>r.docs.map(f=>[f,r])).slice(0,5).map(([f,r])=>`<div class="file"><i>${f.split('.').pop().toUpperCase().slice(0,4)}</i><div><b>${esc(f)}</b><span>${r.id} · ${dd(r.d)}</span></div></div>`).join('')||'<p class="mini">Нет.</p>'}</div></div>
 <div><div class="pan"><h3>Команда клиента</h3>${Object.entries(c.resp).map(([d,p])=>`<div class="kv"><span>${dirm(d)}</span><b>${STAFF[p]}</b></div>`).join('')}<div class="kv"><span>Менеджер клиента</span><b>Асем</b></div></div>
  <div class="pan"><h3>Переписка</h3><div class="chat mini2">${(CHATS[c.id]||[['cl',c.boss,c.last,c.lt]]).slice(-3).map(m=>m[0]==='call'?`<div class="msg sys">${esc(m[2])}</div>`:`<div class="msg ${m[0]==='me'?'out':m[0]==='in'?'note':'in'}"><b>${esc(m[1])}</b>${esc(m[2])}<small>${m[3]}</small></div>`).join('')}</div><button class="bt" style="margin-top:8px" onclick="go('chat')">Открыть мессенджер</button></div>
  <div class="pan"><h3>Договор и оплата</h3>${[['Договор','№ '+c.id.slice(1)+'/2025 · до 31.12.2026'],['Абонентская плата',tg(c.fee)+' в месяц'],['Счёт за октябрь',c.debt?'не оплачен':'выставлен 01.10']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div></div></div>
 ${said('«В личном кабинете должен быть функционал переключения — с клиента на клиента.»','Слева — список клиентов как в мессенджере; выбрали — всё рабочее место показывает этого клиента.')}`};

/* ===== Мессенджер ===== */
function callNow(kind,id){const c=CL(id);toast(`${kind==='video'?'Видеозвонок':'Аудиозвонок'} ${esc(c.boss)} · ${esc(c.sh)} — идёт вызов в приложении клиента. Запись разговора прикрепится к клиенту.`);CALLS.unshift({t:NOW,cl:id,who:c.boss,me:ROLES[role].p==='CL'?'AS':ROLES[role].p,kind,dur:'0:00',via:'Портал',rec:true,live:true})}
function chatSend(){const i=document.getElementById('chin');if(!i||!i.value.trim())return;(CHATS[curCl]=CHATS[curCl]||[]).push(['me',STAFF[ROLES[role].p]||'Сотрудник',i.value.trim(),NOW]);render();toast('Отправлено — клиенту push в приложении.')}
SC.chat=()=>{const c=CL(curCl)||CLIENTS[0];const M=CHATS[c.id]||[['cl',c.boss,c.last,c.lt]];
 return `<div class="hd"><div><h2>Мессенджер · ${esc(c.sh)}</h2><p>Переписка с клиентом — внутри платформы: история не теряется при смене сотрудника, файлы сразу в архиве клиента, внутренние заметки клиент не видит. Аудио- и видеозвонки — из чата, с записью.</p></div><div class="btns"><button class="bt" onclick="callNow('audio','${c.id}')">Аудиозвонок</button><button class="bt p" onclick="callNow('video','${c.id}')">Видеозвонок</button></div></div>
 <div class="pan chatp big"><div class="chat">${M.map(m=>m[0]==='call'?`<div class="msg sys">${esc(m[2])}<small>${m[3]}</small></div>`:`<div class="msg ${m[0]==='me'?'out':m[0]==='in'?'note':'in'}"><b>${esc(m[1])}</b>${esc(m[2])}<small>${m[3]}</small></div>`).join('')}</div>
 <div class="chs"><button class="bt" onclick="toast('Файл прикреплён — он же появится в архиве документов клиента.')">Файл</button><button class="bt" onclick="toast('Голосовое сообщение записано.')">Голосовое</button><input id="chin" placeholder="Сообщение клиенту…" onkeydown="if(event.key==='Enter')chatSend()"><button class="bt p" onclick="chatSend()">Отправить</button></div></div>
 <div class="g3"><div class="note"><b>Каналы клиента</b><p>Общий чат компании, чат по каждой заявке и внутренний чат команды по клиенту — без групп в WhatsApp на каждого.</p></div><div class="note"><b>Кто видит</b><p>Клиент — свои чаты. Сотрудник — клиентов своего направления. Руководитель — всё.</p></div><div class="note"><b>Уйдёт сотрудник — история останется</b><p>Переписка принадлежит компании, а не личному телефону бухгалтера.</p></div></div>
 ${said('«Там должен быть мессенджер и аудиозвонки.»','Сделали мессенджер с аудио- и видеозвонками — и в портале, и в приложении.')}`};

/* ===== Звонки ===== */
SC.calls=()=>`<div class="hd"><div><h2>Звонки</h2><p>Аудио- и видеозвонки между командой и клиентами — внутри платформы, без личных номеров. Каждый звонок привязан к клиенту и заявке, запись хранится на вашем сервере.</p></div></div>
 <div class="g12"><div class="callui"><div class="cav">${esc(ini(CL('C3').sh))}</div><b>Айдос Сарсенов</b><span>QazLogistic · видеозвонок · 04:12</span><div class="cbtn"><i>микрофон</i><i>камера</i><i>экран</i><i class="end">завершить</i></div><small>Заявка R-1041 · уведомление КГД</small></div>
 <div class="pan"><h3>Сегодня</h3><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Клиент</th><th>Сотрудник</th><th>Тип</th><th>Откуда</th><th class="r">Длительность</th><th>Запись</th></tr></thead><tbody>${CALLS.map(x=>`<tr onclick="pickCl('${x.cl}')"><td class="mono">${x.t}</td><td>${esc(x.who)}<span class="sub">${esc(CL(x.cl).sh)}</span></td><td>${STAFF[x.me]||'—'}</td><td>${x.kind==='video'?'видео':'аудио'}</td><td>${esc(x.via)}</td><td class="r mono">${x.missed?'<span class="neg">пропущен</span>':x.live?'<span class="pos">идёт</span>':x.dur}</td><td>${x.rec&&!x.live?'<a class="lk" onclick="event.stopPropagation();toast(\'Воспроизведение записи.\')">слушать</a>':'—'}</td></tr>`).join('')}</tbody></table></div></div></div>`;

/* ===== Все клиенты ===== */
let clsF='all';
SC.clients=()=>{let L=CLIENTS.filter(c=>clsF==='all'||c.dirs.includes(clsF));if(myDir())L=L.filter(c=>c.dirs.includes(myDir()));
 return `<div class="hd"><div><h2>Клиенты · ${TOTAL_CLIENTS}</h2><p>Карточка компании: БИН, руководитель, направления, ответственные, тариф, долг, заявки. Владелец с несколькими компаниями — одна группа, один вход в кабинет. В демо показаны 13 из ${TOTAL_CLIENTS}.</p></div><div class="btns"><button class="bt" onclick="go('migrate')">Импорт из Битрикс24</button><button class="bt p" onclick="toast('Новый клиент: БИН — реквизиты подтянутся из открытых источников, затем направления и ответственные.')">+ Клиент</button></div></div>
 <div class="filt"><button class="${clsF==='all'?'on':''}" onclick="clsF='all';render()">Все</button>${Object.keys(DIRS).map(k=>`<button class="${clsF===k?'on':''}" onclick="clsF='${k}';render()"><i class="sq" style="background:${DIRS[k].c}"></i>${DIRS[k].n}</button>`).join('')}</div>
 <div class="tw"><table class="t"><thead><tr><th>Компания</th><th>БИН/ИИН</th><th>Направления</th><th>Ответственные</th><th>Тариф</th><th class="r">В месяц</th><th class="r">Открытых заявок</th><th class="r">Долг</th></tr></thead><tbody>${L.map(c=>`<tr onclick="pickCl('${c.id}')"><td><b>${esc(c.n)}</b>${c.group?`<span class="sub">группа «${esc(c.group)}»</span>`:''}</td><td class="mono">${c.bin}</td><td>${c.dirs.map(dirm).join(' ')}</td><td class="mini">${Object.values(c.resp).map(p=>STAFF[p]).join(', ')}</td><td>${esc(c.tariff)}</td><td class="r mono">${fmt(c.fee)}</td><td class="r mono">${REQS.filter(r=>r.cl===c.id&&r.st!=='done').length}</td><td class="r mono ${c.debt?'neg':''}">${c.debt?fmt(c.debt):'—'}</td></tr>`).join('')}</tbody></table></div>`};

/* ===== Направления ===== */
const dirHead=(k,txt)=>{const R=REQS.filter(r=>r.dir===k);return `<div class="hd"><div><h2>${DIRS[k].n}</h2><p>${txt}</p></div><div class="btns"><button class="bt" onclick="inDir='${k}';inF='all';go('inbox')">Заявки направления</button></div></div>
 <div class="wid"><div><small>Клиентов направления</small><b>${{buh:243,law:118,tax:96,hr:131}[k]}</b><span>в демо ${CLIENTS.filter(c=>c.dirs.includes(k)).length}</span></div><div><small>Открытых заявок</small><b class="a">${R.filter(r=>r.st!=='done').length}</b></div><div><small>Ждём клиента</small><b>${R.filter(r=>r.st==='wait').length}</b></div><div><small>Закрыто за сентябрь</small><b class="g">${{buh:412,law:96,tax:71,hr:268}[k]}</b></div><div><small>Специалистов</small><b>${{buh:3,law:2,tax:1,hr:1}[k]}</b><span>${{buh:'Айгуль, Динара, Ерлан',law:'Алия, Тимур',tax:'Марат',hr:'Мария'}[k]}</span></div></div>`};
/* бухгалтерия */
const PRIM=[['C1',1,1,1,0],['C3',1,1,0,1],['C4',1,0,0,1],['C7',1,1,1,1],['C9',1,1,1,1],['C12',1,0,1,1],['C2',1,1,1,1],['C8',0,1,1,1]];
function askDocs(id){toast(`${esc(CL(id).sh)}: в кабинет и приложение ушёл запрос «загрузите недостающие документы за сентябрь» — со списком.`)}
SC.buh=()=>`${dirHead('buh','Сроки отчётности и платежей по всем клиентам сразу, готовность первички за месяц, запрос недостающего — одной кнопкой в кабинет клиента. Без напоминаний вручную в WhatsApp.')}
 <div class="g2"><div class="pan"><h3>Ближайшие сроки</h3>${DEADLINES.filter(d=>d.dir!=='law').map(d=>`<div class="dlr"><div class="dld"><b>${dd(d.d)}</b><small>${daysBetween(TODAY,d.d)} дн.</small></div><div><b>${esc(d.t)}</b><span>${dirm(d.dir)} · ${d.n} ${plural(d.n,['клиент','клиента','клиентов'])}</span></div><div class="dlp"><span class="pbar"><i style="width:${pct(d.done,d.n)}%;background:${DIRS[d.dir].c}"></i></span><em>${d.done}/${d.n}</em></div></div>`).join('')}</div>
 <div class="pan"><h3>Первичка за сентябрь</h3><div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Выписка</th><th>ЭСФ</th><th>Акты</th><th>Зарплата</th><th></th></tr></thead><tbody>${PRIM.map(p=>`<tr onclick="pickCl('${p[0]}')"><td>${esc(CL(p[0]).sh)}</td>${p.slice(1).map(v=>`<td>${v?'<b class="pos">✓</b>':'<b class="neg">нет</b>'}</td>`).join('')}<td>${p.slice(1).includes(0)?`<button class="bt sm" onclick="event.stopPropagation();askDocs('${p[0]}')">Запросить</button>`:''}</td></tr>`).join('')}</tbody></table></div></div></div>`;
/* юридическое */
const LAW=[['C9','Договор аренды офиса','проверка','AL','2026-10-02','4 риска найдено'],['C6','Договор с врачом-совместителем','подготовка','AL','2026-10-02','по шаблону'],['C11','Претензия за просрочку поставки','отправлена','TM','2026-10-15','ждём ответ 15 дней'],['C4','Договор субподряда','согласование','TM','2026-10-05','правки контрагента'],['C3','Соглашение о расторжении','подписано','AL','2026-09-28','ЭЦП обеих сторон'],['C12','Регистрация филиала','в госорганах','TM','2026-10-09','подано через eGov']];
SC.law=()=>`${dirHead('law','Договоры, претензии, регистрационные действия по всем клиентам. Шаблоны с ИИ дают черновик за минуты, юрист проверяет и отправляет на подпись — клиент подписывает ЭЦП прямо в кабинете.')}
 <div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Документ</th><th>Этап</th><th>Юрист</th><th>Срок</th><th>Комментарий</th></tr></thead><tbody>${LAW.map(l=>`<tr onclick="pickCl('${l[0]}')"><td>${esc(CL(l[0]).sh)}</td><td><b>${esc(l[1])}</b></td><td>${esc(l[2])}</td><td>${STAFF[l[3]]}</td><td class="mono">${dd(l[4])}</td><td class="mini">${esc(l[5])}</td></tr>`).join('')}</tbody></table></div>
 <div class="g3" style="margin-top:12px">${TPLS.filter(t=>t.dir==='law').map(t=>`<div class="pan tplc" onclick="aiTpl='${t.id}';go('ai')"><h3>${esc(t.n)}</h3><p>${t.f.join(' · ')}</p><span class="mini">использован ${t.used} раз</span></div>`).join('')}</div>`;
/* налоги */
const TAXQ=[['C3','Уведомление КГД о расхождениях по ЭСФ','2026-11-12','ответ готовится','MR'],['C10','Возврат превышения НДС','2026-10-07','пакет документов','MR'],['C1','Камеральный контроль: КПН','2026-10-20','пояснения отправлены','MR'],['C11','Консультация: льготы для ВИЭ','2026-10-03','назначен созвон','MR']];
SC.tax=()=>`${dirHead('tax','Уведомления КГД, камеральный контроль, возврат НДС, консультации. У каждого запроса — срок по уведомлению, документы и история ответа; клиент видит, на каком этапе его вопрос.')}
 <div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Вопрос</th><th>Срок</th><th class="r">Осталось</th><th>Этап</th><th>Консультант</th></tr></thead><tbody>${TAXQ.map(q=>`<tr onclick="pickCl('${q[0]}')"><td>${esc(CL(q[0]).sh)}</td><td><b>${esc(q[1])}</b></td><td class="mono">${dl(q[2])}</td><td class="r mono ${daysBetween(TODAY,q[2])<=7?'warnt':''}">${daysBetween(TODAY,q[2])} дн.</td><td>${esc(q[3])}</td><td>${STAFF[q[4]]}</td></tr>`).join('')}</tbody></table></div>
 <div class="note" style="margin-top:12px"><b>Срок — из документа</b><p>Срок ответа берётся из уведомления: консультант вносит его один раз, дальше система напоминает и ставит задачу за 5 дней.</p></div>`;
/* HR */
const HRQ=[['C7','Приём','3 бариста с 05.10','договоры и приказы','MA','wait'],['C5','Отпуск','водитель с 12.10, 14 дней','приказ','MA','new'],['C1','Табель','сентябрь, 46 человек','на проверке','MA','check'],['C3','Увольнение','водитель, соглашение сторон','подписано','MA','done'],['C9','Приём','разработчик с 15.10','договор','MA','new'],['C7','Больничный','бариста, 5 дней','оплата в зарплате','MA','work']];
SC.hr=()=>`${dirHead('hr','Кадровые события клиентов: приёмы, отпуска, увольнения, больничные, табели. Клиент создаёт заявку в приложении — HR готовит документы по шаблону, руководитель клиента подписывает ЭЦП.')}
 <div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Событие</th><th>Кто / когда</th><th>Документы</th><th>Статус</th></tr></thead><tbody>${HRQ.map(h=>`<tr onclick="pickCl('${h[0]}')"><td>${esc(CL(h[0]).sh)}<span class="sub">${CL(h[0]).staff} сотр.</span></td><td><b>${esc(h[1])}</b></td><td>${esc(h[2])}</td><td>${esc(h[3])}</td><td>${rst(h[5])}</td></tr>`).join('')}</tbody></table></div>
 <div class="g2" style="margin-top:12px"><div class="pan"><h3>Сотрудников у клиентов</h3><div class="kv"><span>Всего на кадровом учёте</span><b class="mono">4 870</b></div><div class="kv"><span>Кадровых событий за сентябрь</span><b class="mono">268</b></div><div class="kv"><span>Документов по шаблону</span><b class="mono">91%</b></div></div><div class="pan"><h3>Шаблоны HR</h3>${TPLS.filter(t=>t.dir==='hr').map(t=>`<div class="kv" style="cursor:pointer" onclick="aiTpl='${t.id}';go('ai')"><span>${esc(t.n)}</span><b class="mono">${t.used}</b></div>`).join('')}</div></div>`;

/* ===== ИИ-шаблоны ===== */
let aiTpl='T1',aiGen=false,aiChecked=false;
function aiFor(rid){const r=RQ(rid);curCl=r.cl;aiTpl={hr:'T1',law:'T4',tax:'T7',buh:'T8'}[r.dir];if(r.id==='R-1032')aiTpl='T1';aiGen=false;aiChecked=false;if(allowed('ai')){cur='ai';build()}else toast('Шаблоны доступны специалистам.')}
const AIVAL={T1:{'ФИО работника':'Ахметова Дана Ериковна','Должность':'Бариста','Оклад':'250 000 ₸','Дата начала':'05.10.2026','Испытательный срок':'3 месяца'},T4:{'Контрагент':'ТОО «Алем Сервис»','Предмет':'уборка помещений','Сумма':'180 000 ₸ в месяц','Сроки':'01.11.2026 – 31.10.2027'},T7:{'Номер уведомления':'№ 4471 от 28.09.2026','Период':'2 квартал 2026','Суть расхождения':'ЭСФ отозваны поставщиками после оплаты'},T8:{'Покупатель':'по клиенту','Услуги':'по заявке','Сумма':'по тарифу'}};
function aiRun(){aiGen=true;aiChecked=false;render();toast('Черновик готов за 6 секунд. Жёлтым — что подставлено из карточки клиента, синим — что предложил ИИ. Проверьте и отметьте «проверено».')}
SC.ai=()=>{const t=TPLS.find(x=>x.id===aiTpl)||TPLS[0],c=CL(curCl)||CLIENTS[0],V=AIVAL[t.id]||{};
 return `<div class="hd"><div><h2>ИИ-шаблоны документов</h2><p>Специалист выбирает шаблон и клиента, пишет в двух словах, что нужно. Реквизиты подставляются из карточки клиента, ИИ дописывает условия под ситуацию. Документ уходит клиенту только после отметки «проверено специалистом».</p></div></div>
 <div class="g12"><div><div class="pan"><h3>1 · Шаблон</h3>${TPLS.map(x=>`<div class="tpr ${x.id===t.id?'on':''}" onclick="aiTpl='${x.id}';aiGen=false;render()">${dirm(x.dir)}<b>${esc(x.n)}</b><em>${x.used}</em></div>`).join('')}</div></div>
 <div><div class="pan"><h3>2 · Клиент и задача</h3><div class="form"><label>Клиент<select onchange="curCl=this.value;aiGen=false;render()">${CLIENTS.map(x=>`<option value="${x.id}" ${x.id===c.id?'selected':''}>${esc(x.n)}</option>`).join('')}</select></label><label>Из карточки клиента<input value="${esc(c.n)} · БИН ${c.bin} · ${esc(c.boss)}" readonly></label></div>
  <div class="form one"><label>Что нужно — своими словами<textarea id="aiq" rows="2">${t.id==='T1'?'Бариста в кофейню на Абая, сменный график 2/2, испытательный срок 3 месяца, материальная ответственность за кассу':t.id==='T7'?'Объяснить, что ЭСФ отозвали поставщики уже после оплаты, приложить платёжки и акты сверки':'Стандартные условия, оплата ежемесячно до 10 числа'}</textarea></label></div>
  <div class="form">${t.f.map(f=>`<label>${esc(f)}<input value="${esc(V[f]||'')}"></label>`).join('')}</div>
  <button class="bt p" onclick="aiRun()">Сгенерировать черновик</button></div>
 ${aiGen?`<div class="pan"><h3>3 · Черновик · ${esc(t.n)}</h3><div class="doc aidoc"><div class="dh"><div class="dlg">${esc(c.sh).toUpperCase()}<small>${esc(t.n).toUpperCase()}</small></div><div style="text-align:right;font-size:10px">№ 47<br>${dl(TODAY)}</div></div>
  ${t.id==='T7'?`<p><mark>${esc(c.n)}</mark>, БИН <mark>${c.bin}</mark>, в ответ на уведомление <mark>${esc(V['Номер уведомления'])}</mark> о расхождениях за <mark>${esc(V['Период'])}</mark> сообщает следующее.</p><p><span class="ai">Расхождения возникли в связи с тем, что ЭСФ были отозваны поставщиками после поступления оплаты. Факт поставки подтверждается актами сверки и платёжными поручениями (приложения 1–4).</span></p><p><span class="ai">Просим принять пояснения и считать расхождения устранёнными.</span></p>`
  :`<p><mark>${esc(c.n)}</mark>, БИН <mark>${c.bin}</mark>, в лице директора <mark>${esc(c.boss)}</mark>, и <mark>${esc(V['ФИО работника']||V['Контрагент']||'—')}</mark> заключили настоящий договор.</p><p>1. Работник принимается на должность <mark>${esc(V['Должность']||V['Предмет']||'—')}</mark> с <mark>${esc(V['Дата начала']||V['Сроки']||'—')}</mark>, оклад <mark>${esc(V['Оклад']||V['Сумма']||'—')}</mark>.</p><p>2. <span class="ai">Режим работы — сменный, по графику 2/2, с суммированным учётом рабочего времени.</span></p><p>3. <span class="ai">Работник несёт полную материальную ответственность за денежные средства кассы на основании отдельного договора.</span></p><p>4. Испытательный срок — <mark>${esc(V['Испытательный срок']||'не устанавливается')}</mark>.</p>`}
  <div class="legend"><span><i style="background:#fbe7a4"></i>из карточки клиента</span><span><i style="background:#d9e4ff"></i>предложено ИИ — проверить</span></div></div>
  <label class="chkl"><input type="checkbox" ${aiChecked?'checked':''} onchange="aiChecked=this.checked;render()"> Проверено специалистом: ${STAFF[ROLES[role].p]||'Мария'}</label>
  <div class="btns l" style="margin-top:10px"><button class="bt" onclick="toast('Скачан .docx — можно править вручную.')">Скачать .docx</button><button class="bt p ${aiChecked?'':'dis'}" onclick="${aiChecked?`toast('Отправлено клиенту на подпись ЭЦП — в кабинет и приложение.')`:`toast('Сначала отметьте «проверено специалистом».')`}">Отправить на подпись</button></div></div>`:''}</div></div>
 <div class="note"><b>Персональные данные не уходят в ИИ</b><p>ИИ получает обезличенную задачу («бариста, график 2/2, испытательный срок»). ФИО, ИИН, БИН и суммы подставляются уже на вашем сервере в Казахстане.</p></div>
 ${said('«Добавить фактор ИИ… шаблонные какие-то документы, чтобы была помощь для наших специалистов.»','По словам Платона, это входит в стандартный пакет — в портале.')}`};

/* ===== Архив и подпись ===== */
let DOCS=[
 {n:'Трудовой договор № 46 · Ахметов Б.',cl:'C7',dir:'hr',d:'2026-09-30',src:'ИИ-шаблон',sig:'both'},
 {n:'Приказ о приёме № 112-к',cl:'C7',dir:'hr',d:'2026-09-30',src:'ИИ-шаблон',sig:'client'},
 {n:'Замечания к договору аренды',cl:'C9',dir:'law',d:'2026-10-01',src:'Юрист',sig:'none'},
 {n:'Уведомление КГД № 4471',cl:'C3',dir:'tax',d:'2026-10-01',src:'Загружен клиентом',sig:'none'},
 {n:'Претензия № 12 · ТОО «Сункар Снаб»',cl:'C11',dir:'law',d:'2026-09-26',src:'ИИ-шаблон',sig:'both'},
 {n:'ФНО 910.00 · 1 полугодие',cl:'C13',dir:'buh',d:'2026-08-14',src:'Бухгалтер',sig:'both'},
 {n:'Счёт на оплату № 1024 · октябрь',cl:'C4',dir:'buh',d:'2026-10-01',src:'Автоматически',sig:'ours'},
 {n:'Соглашение о расторжении ТД',cl:'C3',dir:'hr',d:'2026-09-28',src:'ИИ-шаблон',sig:'both'}
];
const SIG={both:['Подписан обеими сторонами','#23935f'],client:['Ждёт подписи клиента','#c98a1b'],ours:['Подписан нами','#1f7aa8'],none:['Без подписи','#8a919c']};
function signDoc(i){DOCS[i].sig='both';render();toast('Подписано ЭЦП через NCALayer — документ с подписью сохранён в архиве клиента.')}
SC.docs=()=>{const L=DOCS.filter(d=>!myDir()||d.dir===myDir());
 return `<div class="hd"><div><h2>Архив документов и подпись</h2><p>Все документы клиентов — в одном архиве с поиском: что пришло от клиента, что сделали мы, что подписано ЭЦП и кем. Клиент подписывает в кабинете, без пересылки файлов в мессенджерах.</p></div><div class="btns"><button class="bt" onclick="toast('Поиск по названию, клиенту, типу и тексту документа.')">Поиск по архиву</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Документ</th><th>Клиент</th><th>Направление</th><th>Дата</th><th>Откуда</th><th>Подпись</th><th></th></tr></thead><tbody>${L.map(d=>{const i=DOCS.indexOf(d);return `<tr onclick="pickCl('${d.cl}')"><td><b>${esc(d.n)}</b></td><td>${esc(CL(d.cl).sh)}</td><td>${dirm(d.dir)}</td><td class="mono">${dd(d.d)}</td><td>${esc(d.src)}</td><td><span class="st" style="--sc:${SIG[d.sig][1]}">${SIG[d.sig][0]}</span></td><td>${d.sig==='client'?`<button class="bt sm p" onclick="event.stopPropagation();signDoc(${i})">Подписан</button>`:''}</td></tr>`}).join('')}</tbody></table></div>`};

/* ===== Библиотека ===== */
SC.tpl=()=>`<div class="hd"><div><h2>Библиотека шаблонов</h2><p>Шаблоны компании по направлениям. Загрузите свой .docx — поля для подстановки система найдёт сама; при изменении закона шаблон обновляется один раз для всех клиентов.</p></div><div class="btns"><button class="bt p" onclick="toast('Загрузите .docx: поля в фигурных скобках станут полями шаблона.')">+ Свой шаблон</button></div></div>
 <div class="tplg">${TPLS.map(t=>`<div class="tplc2" style="--c:${DIRS[t.dir].c}" onclick="aiTpl='${t.id}';aiGen=false;go('ai')">${dirm(t.dir)}<b>${esc(t.n)}</b><span>${t.f.length} ${plural(t.f.length,['поле','поля','полей'])}: ${t.f.join(', ')}</span><em>использован ${t.used} раз</em></div>`).join('')}</div>`;

/* ===== Внутренние задачи ===== */
const TST={new:['Новая','#2f5bea'],work:['В работе','#c98a1b'],done:['Готово','#23935f']};
function taskDone(i){TASKS[i].st='done';render();toast('Задача закрыта.')}
function newTask(){TASKS.unshift({t:'Новая задача',who:ROLES[role].p==='CL'?'AS':ROLES[role].p,due:addDays(TODAY,2),st:'new'});render();toast('Задача создана.')}
SC.tasks=()=>`<div class="hd"><div><h2>Внутренние задачи</h2><p>Внутренние процессы команды — тоже здесь: задачи, сроки, ответственные, планёрки. Битрикс24 для этого больше не нужен — всё в одной системе с заявками и клиентами.</p></div><div class="btns"><button class="bt p" onclick="newTask()">+ Задача</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Задача</th><th>Кто</th><th>Срок</th><th>Статус</th><th></th></tr></thead><tbody>${TASKS.map((x,i)=>`<tr><td><b>${esc(x.t)}</b></td><td>${STAFF[x.who]||'—'}</td><td class="mono ${x.st!=='done'&&x.due<=TODAY?'neg':''}">${dd(x.due)}</td><td><span class="st" style="--sc:${TST[x.st][1]}">${TST[x.st][0]}</span></td><td>${x.st!=='done'?`<button class="bt sm" onclick="taskDone(${i})">Готово</button>`:''}</td></tr>`).join('')}</tbody></table></div>
 ${said('«Это приложение, которое с клиентами, — она же ещё и наши внутренние процессы.»','Платон: «Зачем вам две системы? Задачи, воронки — всё будет внутри одной». Битрикс24 уберёте за ненадобностью.')}`;

/* ===== Команда ===== */
const TEAM=[['AY','buh','Бухгалтер',64,9],['DN','buh','Бухгалтер',71,6],['ER','buh','Бухгалтер',58,7],['AL','law','Юрист',38,5],['TM','law','Юрист',41,4],['MR','tax','Налоговый консультант',96,6],['MA','hr','HR-специалист',131,8],['AS','','Менеджер клиентов',512,14]];
SC.team=()=>`<div class="hd"><div><h2>Команда и загрузка</h2><p>Сколько клиентов и открытых заявок у каждого сотрудника, как быстро отвечает, есть ли просрочки. Новый клиент назначается тому, у кого есть запас.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Сотрудник</th><th>Направление</th><th class="r">Клиентов</th><th class="r">Открытых заявок</th><th>Загрузка</th><th class="r">Первый ответ</th></tr></thead><tbody>${TEAM.map(t=>`<tr><td><b>${STAFF[t[0]]}</b><span class="sub">${t[2]}</span></td><td>${t[1]?dirm(t[1]):'все'}</td><td class="r mono">${t[3]}</td><td class="r mono">${t[4]}</td><td><span class="adh"><span class="pbar"><i style="width:${Math.min(100,t[4]*10)}%;background:${t[4]>=8?'var(--bad)':'var(--ok)'}"></i></span><em>${Math.min(100,t[4]*10)}%</em></span></td><td class="r mono">${[22,35,41,48,52,63,30,12][TEAM.indexOf(t)]} мин</td></tr>`).join('')}</tbody></table></div>`;

/* ===== Тарифы и счета ===== */
let INV=CLIENTS.map((c,i)=>({no:1020+i,cl:c.id,sum:c.fee,st:c.debt?'debt':i%3===0?'paid':'sent'}));
function invPaid(no){const v=INV.find(x=>x.no===no);v.st='paid';const c=CL(v.cl);c.debt=0;render();toast('Оплата отмечена — клиент видит «оплачено» в кабинете.')}
SC.billing=()=>{const tot=INV.reduce((s,v)=>s+v.sum,0);
 return `<div class="hd"><div><h2>Тарифы и счета</h2><p>Абонентская плата и разовые услуги: 1-го числа счета всем клиентам формируются автоматически и уходят в кабинет и приложение. Рутину — счёт на оплату, акт, напоминание о долге — делает система.</p></div><div class="btns"><button class="bt p" onclick="toast('Счета за октябрь сформированы и отправлены: '+INV.length+' клиентам в демо, 512 — в реальной базе.')">Выставить за октябрь</button></div></div>
 <div class="wid"><div><small>Счетов за октябрь</small><b>${INV.length}</b><span>в реальной базе — 512</span></div><div><small>На сумму</small><b class="a">${tg(tot)}</b></div><div><small>Оплачено</small><b class="g">${INV.filter(v=>v.st==='paid').length}</b></div><div><small>Долги</small><b class="r">${tg(INV.filter(v=>v.st==='debt').reduce((s,v)=>s+v.sum,0))}</b></div><div><small>Средний чек</small><b>${tg(tot/INV.length)}</b></div></div>
 <div class="g12"><div class="pan"><h3>Тарифы</h3>${[['Упрощёнка ИП','30 000 ₸','910, платежи, консультации'],['Стандарт','150–180 000 ₸','бухгалтерия ТОО до 40 сотрудников'],['Стандарт + HR','210 000 ₸','плюс кадровый учёт'],['Полный','280–320 000 ₸','бух, юр, налоги, HR'],['Юрист','90 000 ₸','договоры и претензии']].map(x=>`<div class="kv"><span>${x[0]}<span class="sub">${x[2]}</span></span><b class="mono">${x[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Счета · октябрь</h3><div class="tw"><table class="t"><thead><tr><th>№</th><th>Клиент</th><th class="r">Сумма</th><th>Статус</th><th></th></tr></thead><tbody>${INV.map(v=>`<tr onclick="pickCl('${v.cl}')"><td class="mono">${v.no}</td><td>${esc(CL(v.cl).sh)}</td><td class="r mono">${fmt(v.sum)}</td><td>${v.st==='paid'?'<span class="pos">оплачен</span>':v.st==='debt'?'<span class="neg">долг с сентября</span>':'<span class="mini">отправлен</span>'}</td><td>${v.st!=='paid'?`<button class="bt sm" onclick="event.stopPropagation();invPaid(${v.no})">Оплачен</button>`:''}</td></tr>`).join('')}</tbody></table></div></div></div>
 ${said('«Хотелось бы какую-то автоматизацию через портал, чтобы счёт на оплату… базовые рутинные моменты автоматизировать.»')}`};

/* ===== Аналитика ===== */
const MON=[['май',612,71],['июн',640,69],['июл',588,74],['авг',655,78],['сен',702,86]];
SC.analytics=()=>`<div class="hd"><div><h2>Аналитика</h2><p>Сколько заявок по направлениям, как быстро отвечаем, сколько в срок, кто перегружен, какие клиенты приносят больше и где риск оттока. Раньше это было не посчитать — всё лежало в переписках.</p></div></div>
 <div class="wid"><div><small>Клиентов</small><b>512</b><span>+14 за квартал</span></div><div><small>Заявок за сентябрь</small><b class="a">702</b></div><div><small>Решено в срок</small><b class="g">86%</b></div><div><small>Первый ответ</small><b>38 мин</b></div><div><small>Выручка в месяц</small><b>48,6 млн</b><span>абонентская плата</span></div></div>
 <div class="g2"><div class="pan"><h3>Заявки и доля в срок</h3><div class="mcols">${MON.map(m=>`<div class="mc"><div class="mcb"><i style="height:${m[1]/7.2}%"></i></div><b>${m[1]}</b><small>${m[0]} · ${m[2]}%</small></div>`).join('')}</div></div>
 <div class="pan"><h3>Заявки по направлениям · сентябрь</h3>${[['buh',356],['hr',198],['law',84],['tax',64]].map(x=>`<div class="fr"><span>${dirm(x[0])} ${DIRS[x[0]].n}</span><span class="pbar w"><i style="width:${x[1]/3.56}%;background:${DIRS[x[0]].c}"></i></span><b>${x[1]}</b></div>`).join('')}<div class="note" style="--tone:var(--warn)"><b>Риск оттока</b><p>7 клиентов: 3 месяца без заявок и с долгом — менеджеру задача позвонить.</p></div></div></div>`;

/* ===== Кабинет клиента ===== */
let portCo='C4';
function portNew(dir){const c=CL(portCo);const id='R-'+(1042+REQS.length-16);REQS.unshift({id,cl:c.id,dir,t:{buh:'Вопрос бухгалтеру',law:'Нужен юрист',tax:'Вопрос по налогам',hr:'Кадровый вопрос'}[dir],from:'Портал',d:TODAY,tm:NOW,sla:TODAY+' 19:00',st:'new',resp:c.resp[dir]||'AS',docs:[],msgs:[['cl',c.boss,'Новая заявка из кабинета',NOW]]});render();toast(`Заявка ${id} создана — ${STAFF[c.resp[dir]||'AS']} получил уведомление. Статус видно здесь и в приложении.`)}
SC.portal=()=>{const c=CL(portCo),grp=CLIENTS.filter(x=>x.group==='Нур'),R=REQS.filter(r=>r.cl===c.id);
 return `<div class="hd"><div><h2>Кабинет клиента</h2><p>Так платформу видит клиент — в браузере и в приложении. Заявка в два нажатия, статус и срок, документы на подпись, счета, чат и звонок своей команде. Владелец нескольких компаний переключается между ними сверху.</p></div></div>
 <div class="bro"><div class="brb"><i></i><i></i><i></i><span>kabinet.kvarta.kz</span></div><div class="brc">
  <div class="pch"><b>КВАРТА</b><div class="cosw">${grp.map(x=>`<button class="${x.id===c.id?'on':''}" onclick="portCo='${x.id}';render()">${esc(x.sh)}</button>`).join('')}</div><span>${esc(c.boss)}</span></div>
  <div class="pcn">Новая заявка</div><div class="pnew">${Object.keys(DIRS).filter(k=>c.dirs.includes(k)).map(k=>`<button style="--c:${DIRS[k].c}" onclick="portNew('${k}')"><b>${DIRS[k].n}</b><span>${{buh:'вопрос, документ, отчёт',law:'договор, претензия',tax:'уведомление, проверка',hr:'приём, отпуск, увольнение'}[k]}</span></button>`).join('')}</div>
  <div class="g2" style="margin:0"><div><div class="pcn">Мои заявки</div>${R.slice(0,4).map(r=>`<div class="kv"><span>${dirm(r.dir)} ${esc(r.t)}</span><b>${rst(r.st)}</b></div>`).join('')||'<p class="mini">Заявок нет.</p>'}<div class="pcn">Нужно от вас</div><div class="kv"><span>Счёт-фактура от субподрядчика</span><b class="warnt">до 03.10</b></div><div class="kv"><span>Подписать приказ об отпуске</span><b class="warnt">ЭЦП</b></div></div>
  <div><div class="pcn">Счета</div><div class="kv"><span>Октябрь · абонентская плата</span><b class="${c.debt?'neg':'pos'}">${tg(c.fee)} · ${c.debt?'не оплачен':'оплачен'}</b></div><div class="pcn">Команда</div>${Object.entries(c.resp).map(([d,p])=>`<div class="kv"><span>${DIRS[d].n}</span><b>${STAFF[p]} · <a class="lk" onclick="callNow('audio','${c.id}')">звонок</a></b></div>`).join('')}</div></div>
 </div></div>
 ${said('«Обратная сторона с клиентом — заявки от наших клиентов, около пятисот.»')}`};

/* ===== Приложение ===== */
SC.app=()=>`<div class="hd"><div><h2>Мобильное приложение · iOS и Android</h2><p>Одно приложение на кросс-платформенном языке — публикуется сразу в App Store и Google Play. Внутри: мессенджер с командой, аудио- и видеозвонки, заявки с фото документа, push-уведомления, подпись. Подключается к порталу — данные одни и те же.</p></div></div>
 <div class="phones">
  <div class="phone"><div class="pht"><b>Чаты</b><small>Нур-Строй Инвест</small></div><div class="pb">${[['Ерлан · бухгалтер','Не хватает счёта-фактуры',1],['Тимур · юрист','Правки по субподряду внёс',0],['Марат · налоги','Авансы КПН до 25.10',0],['Общий чат компании','Счёт за октябрь выставлен',1]].map(x=>`<div class="pi"><span>${esc(x[0])}<small>${esc(x[1])}</small></span><b>${x[2]?'<em class="unr">'+x[2]+'</em>':''}</b></div>`).join('')}<div class="pbtn" onclick="toast('Новая заявка: направление → коротко что нужно → фото документа.')">+ Заявка</div></div></div>
  <div class="phone"><div class="pht"><b>Ерлан · бухгалтер</b><small>в сети · аудио · видео</small></div><div class="pb"><div class="chat sm"><div class="msg in"><b>Ерлан</b>Не хватает счёта-фактуры от субподрядчика<small>12:00</small></div><div class="msg out">Запросил, сфотографирую и пришлю<small>13:40</small></div><div class="msg out">[фото] Акт_выполненных_работ.jpg<small>13:41</small></div></div><div class="pbtn" onclick="callNow('audio','C4')">Позвонить</div></div></div>
  <div class="phone dark"><div class="pb vcall"><div class="cav">ЕР</div><b>Ерлан</b><span>видеозвонок · 02:18</span><div class="cbtn"><i>микрофон</i><i>камера</i><i class="end">завершить</i></div></div></div>
 </div>
 <div class="g3"><div class="note"><b>Срок</b><p>Около 4 недель после портала, плюс проверка Apple и Google — её сроки зависят от них, мы проходим этот процесс за вас.</p></div><div class="note"><b>Регулярно</b><p>Аккаунты разработчика Apple и Google — порядка 300–500 $ в год, как обсуждали на встрече.</p></div><div class="note"><b>Сначала портал</b><p>Приложение подключается к порталу через защищённый шлюз — поэтому сначала портал, потом приложение.</p></div></div>
 ${said('«Нам нужно будет мобильное приложение… там должен быть мессенджер и аудиозвонки.»')}`;

/* ===== Перенос и 1С ===== */
const MIG=[['Компании и реквизиты',512,512],['Контакты клиентов',1340,1340],['Сделки и история',2104,1890],['Задачи сотрудников',3810,2400],['Файлы',18,11],['Пользователи и роли',9,9]];
SC.migrate=()=>`<div class="hd"><div><h2>Перенос из Битрикс24 и 1С</h2><p>Пока вы переходите на новую платформу, данные из Битрикс24 переносятся целиком — клиенты, контакты, история, задачи, файлы. Перенос входит в пакет. Интеграция с 1С:Фреш — отдельно, если окажется нужна.</p></div></div>
 <div class="g2"><div class="pan"><h3>Перенос из Битрикс24 · входит в пакет</h3>${MIG.map(m=>`<div class="fr"><span>${m[0]}</span><span class="pbar w"><i style="width:${pct(m[2],m[1])}%;background:${m[2]>=m[1]?'var(--ok)':'var(--brand)'}"></i></span><b>${fmt(m[2])} / ${fmt(m[1])}${m[0]==='Файлы'?' ГБ':''}</b></div>`).join('')}<p class="mini" style="margin-top:8px">Пока идёт перенос, команда работает в обеих системах; переключение — в один день, без потери истории.</p></div>
 <div class="pan"><h3>1С:Фреш · по желанию · 800 000 ₸</h3>${[['Контрагенты','портал ↔ 1С'],['Счета на оплату и акты','портал → 1С'],['Оплаты','1С → портал'],['Сверки','по запросу']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}<div class="note" style="--tone:var(--warn)"><b>Сначала проверим, нужно ли</b><p>Если вся первичка и счета будут в портале, 1С может не понадобиться — так система стабильнее. Решим после разбора ваших процессов.</p></div></div></div>
 ${said('«Пока что будем переходить на новый портал — на начальном этапе можно будет интеграцию хотя бы сделать?»','Платон: перенос данных входит в пакет; интеграция с 1С — 800 000 ₸ отдельно.')}`;

/* ===== Серверы и данные ===== */
SC.security=()=>`<div class="hd"><div><h2>Серверы и персональные данные</h2><p>Платформа работает на виртуальном сервере в Казахстане — у казахстанского хостинга PS.kz в Алматы. Данные клиентов не выходят за пределы страны, как требует закон о персональных данных.</p></div></div>
 <div class="g2"><div class="pan"><h3>Где и как хранятся данные</h3>${[['Сервер','PS.kz, дата-центр в Алматы'],['Стоимость сервера','10 000–15 000 ₸ в месяц'],['Резервные копии','каждую ночь, хранение 30 дней'],['Доступ','по ролям, вход с кодом из SMS'],['Журнал','кто, когда и что открывал'],['Подпись документов','ЭЦП через NCALayer']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Права на систему</h3>${['Исключительные имущественные права на ПО — ваши, по договору','Исходный код передаём полностью','Разовая оплата разработки — никакой аренды и подписки','Сервер оформлен на вашу компанию'].map(x=>`<div class="li"><i>✓</i><span>${x}</span></div>`).join('')}<div class="note"><b>Astana Hub</b><p>Вы планируете войти в Astana Hub с этим проектом. Мы сами участники — подскажем, как подать заявку и подготовить проект.</p></div></div></div>
 ${said('«Заранее предусмотреть закон о персональных данных клиентов — чтобы сервер соответствовал требованиям.» · «Имущественные права на ПО будут изначально у нас?»')}`;

/* ===== Роли ===== */
SC.roles=()=>{const areas=[['Все клиенты и заявки',['SZ','AS']],['Клиенты своего направления',['SZ','AS','AY','AL','MR','MA']],['Мессенджер и звонки',['SZ','AS','AY','AL','MR','MA','CL']],['ИИ-шаблоны и подпись',['SZ','AY','AL','MR','MA']],['Тарифы и счета',['SZ','AS']],['Аналитика и загрузка команды',['SZ']],['Кабинет клиента',['CL']]];const R=Object.entries(ROLES);
 return `<div class="hd"><div><h2>Роли и права</h2><p>Бухгалтер видит клиентов и заявки своего направления, юрист — своего; менеджер клиентов — всех, но без глубины документов; клиент — только свои компании. Руководитель видит всё.</p></div></div>
 <div class="tw"><table class="t mx"><thead><tr><th>Что можно</th>${R.map(([k,v])=>`<th class="c">${esc(v.av)}<span>${esc(k)}</span></th>`).join('')}</tr></thead><tbody>${areas.map(a=>`<tr><td>${a[0]}</td>${R.map(([k,v])=>`<td class="c">${a[1].includes(v.p)?'<b class="pos">●</b>':'<span class="mini">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`};

/* ===== Запуск и стоимость ===== */
let with1c=false;
SC.launch=()=>{const tot=6000000+(with1c?800000:0);
 return `<div class="hd"><div><h2>Запуск и стоимость</h2><p>Сначала портал — 4–6 недель, затем приложение — около 4 недель плюс проверка Apple и Google. Всё вместе — 2–3 месяца. Оплата: 20% предоплата, 40% при выкатке ядра, 40% при полной передаче проекта.</p></div><div class="btns"><label class="chkl"><input type="checkbox" ${with1c?'checked':''} onchange="with1c=this.checked;render()"> с интеграцией 1С:Фреш</label></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Что</th><th>Срок</th><th class="r">Стоимость</th></tr></thead><tbody><tr><td><b>Портал</b><span class="sub">кабинет сотрудника и клиента, 4 направления, заявки, мессенджер, звонки, ИИ-шаблоны, задачи, счета, аналитика, перенос из Битрикс24</span></td><td>4–6 недель</td><td class="r mono">2 500 000</td></tr><tr><td><b>Мобильное приложение iOS и Android</b><span class="sub">мессенджер, аудио- и видеозвонки, заявки, push, подпись</span></td><td>≈ 4 недели + проверка сторов</td><td class="r mono">3 500 000</td></tr><tr class="${with1c?'':'off'}"><td><b>Интеграция с 1С:Фреш</b><span class="sub">по желанию — сначала проверим, нужна ли</span></td><td>в рамках проекта</td><td class="r mono">${with1c?'800 000':'— (800 000)'}</td></tr><tr class="total"><td>Итого</td><td>2–3 месяца</td><td class="r mono">${fmt(tot)}</td></tr></tbody></table></div>
 <div class="pay3"><div><small>Предоплата · 20%</small><b>${tg(tot*.2)}</b><span>начинаем работу</span></div><div><small>Выкатка ядра · 40%</small><b>${tg(tot*.4)}</b><span>портал на сервере, функционал устаканен</span></div><div><small>Передача проекта · 40%</small><b>${tg(tot*.4)}</b><span>портал и приложение полностью</span></div></div>
 <div class="g2"><div class="pan"><h3>Регулярные расходы</h3>${[['Сервер PS.kz','10–15 тыс. ₸ в месяц'],['Аккаунты Apple и Google','≈ 300–500 $ в год'],['Поддержка и доработки','20 $ в час, по факту'],['Ошибки по нашей вине','исправляем бесплатно']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Команда</h3><p class="mini">Ведущий разработчик Ернар и 6–7 постоянных fullstack-разработчиков — интерфейс, серверная часть, мобильная разработка. В пакете — запас 15–20% на ваши доработки по ходу.</p><div class="note" style="--tone:var(--ok)"><b>Скидка за скорость</b><p>10% на весь проект, если договор заключён в течение 3 дней после согласования с учредителем.</p></div></div></div>
 ${said('«Какие ещё могут быть расходы?» · «Шесть миллионов в общем… от семи, грубо говоря, если с 1С.»','Разработка — 6 000 000 ₸, с 1С — 6 800 000 ₸. Дальше только сервер, аккаунты сторов и доработки по часам.')}`};

/* ===== Карточки ===== */
const CARD={};
CARD.req=id=>{const r=RQ(id),c=CL(r.cl);return [esc(r.t),`${esc(c.n)} · ${RSTOF(r.st).n}`,`<div class="pan"><div class="chat">${r.msgs.map(m=>`<div class="msg ${m[0]==='me'?'out':m[0]==='sys'?'sys':'in'}">${m[1]?'<b>'+esc(m[1])+'</b>':''}${esc(m[2])}<small>${m[3]}</small></div>`).join('')}</div></div>`]};
CARD.newreq=cid=>{const c=CL(cid)||CL(curCl)||CLIENTS[0];return ['Новая заявка','Клиент, направление, суть, срок',`<div class="form"><label>Клиент<select id="nr_c">${CLIENTS.map(x=>`<option value="${x.id}" ${x.id===c.id?'selected':''}>${esc(x.n)}</option>`).join('')}</select></label><label>Направление<select id="nr_d">${Object.keys(DIRS).map(k=>`<option value="${k}">${DIRS[k].n}</option>`).join('')}</select></label><label>Что нужно<input id="nr_t" value="Подготовить доверенность на получение ЭЦП"></label><label>Срок ответа<select id="nr_s"><option value="4">4 часа</option><option value="24">1 день</option><option value="72">3 дня</option></select></label></div><button class="bt p" onclick="newReq()">Создать</button>`]};
function newReq(){const v=i=>document.getElementById(i).value;const c=CL(v('nr_c')),d=v('nr_d');const id='R-'+(1042+REQS.length-16);REQS.unshift({id,cl:c.id,dir:d,t:v('nr_t'),from:'Создана сотрудником',d:TODAY,tm:NOW,sla:(+v('nr_s')>=24?addDays(TODAY,+v('nr_s')/24):TODAY)+' 19:00',st:'new',resp:c.resp[d]||'AS',docs:[],msgs:[]});closeM();curReq=id;curCl=c.id;cur=allowed('req')?'req':'inbox';build();toast(`Заявка ${id} создана, ответственный — ${STAFF[c.resp[d]||'AS']}. Клиент видит её в кабинете.`)}
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(k){toast('Готово.')}
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();const c=CLIENTS.find(x=>(x.n+' '+x.bin+' '+x.boss).toLowerCase().includes(q));if(c){pickCl(c.id);return}const r=REQS.find(x=>(x.id+' '+x.t).toLowerCase().includes(q));if(r){openReq(r.id);return}toast('Не нашлось. Ищите по названию, БИН, руководителю или номеру заявки.')}

/* ===== Каркас: тёмная рейка, список клиентов как в мессенджере, вкладки экранов ===== */
const ICON={in:'<path d="M4 13l2.5-7h11L20 13v5H4z"/><path d="M4 13h4.5l1.2 2h4.6l1.2-2H20"/>',cl:'<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3.3 2.7-5 5.5-5s4.9 1.7 5.5 5M15.5 5.5a3 3 0 0 1 0 6M17.5 14.3c1.7.6 2.7 2.1 3 4.7"/>',dir:'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',doc:'<path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5V8h4M9.5 12.5h6M9.5 16h4"/>',co:'<path d="M4 20V8l8-4 8 4v12"/><path d="M9 20v-6h6v6"/>',side:'<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',sys:'<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>'};
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}.`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
function buildRail(){const on=SECOF[cur];const cnt={in:REQS.filter(r=>r.st==='new'&&vis(r)).length};document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="ri ${s.k===on?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')" title="${s.n}"><svg viewBox="0 0 24 24">${ICON[s.k]}</svg><span>${s.n}</span>${cnt[s.k]?`<em>${cnt[s.k]}</em>`:''}</a>`).join('')}
function buildList(){const el=document.getElementById('clist');const show=SECK[SECOF[cur]].list&&role!=='Клиент';document.getElementById('app').classList.toggle('nolist',!show);if(!show){el.innerHTML='';return}
 let L=CLIENTS.filter(c=>(!clQ||(c.n+' '+c.bin+' '+c.boss).toLowerCase().includes(clQ.toLowerCase()))&&(clF==='all'||c.dirs.includes(clF)));if(myDir())L=L.filter(c=>c.dirs.includes(myDir()));
 el.innerHTML=`<div class="clh"><b>Клиенты</b><span>${TOTAL_CLIENTS}</span></div><div class="cls"><input id="clq" placeholder="Поиск · Ctrl+K" value="${esc(clQ)}" oninput="clQ=this.value;buildList();const i=document.getElementById('clq');i.focus();i.setSelectionRange(i.value.length,i.value.length)"></div><div class="clf">${[['all','Все']].concat(Object.keys(DIRS).map(k=>[k,DIRS[k].s])).map(f=>`<button class="${clF===f[0]?'on':''}" onclick="clF='${f[0]}';buildList()">${f[1]}</button>`).join('')}</div>
 <div class="cll">${L.map(c=>`<div class="cli ${c.id===curCl?'on':''}" onclick="pickCl('${c.id}')"><span class="ava" style="--c:${DIRS[c.dirs[0]].c}">${esc(ini(c.sh))}</span><div class="clb"><div class="clt"><b>${esc(c.sh)}</b><small>${esc(c.lt)}</small></div><div class="clm"><span>${esc(c.last)}</span>${c.un?`<em>${c.un}</em>`:''}</div><div class="cld">${c.dirs.map(d=>`<i style="background:${DIRS[d].c}" title="${DIRS[d].n}"></i>`).join('')}</div></div></div>`).join('')}<div class="clmore">ещё ${TOTAL_CLIENTS-L.length} клиентов · прокрутка</div></div>`}
function buildSub(){const s=SECK[SECOF[cur]];document.getElementById('sub').innerHTML=s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('');const c=CL(curCl),ctx=document.getElementById('ctx');if(ctx)ctx.innerHTML=s.list&&role!=='Клиент'&&c?`<span class="ava" style="--c:${DIRS[c.dirs[0]].c}">${esc(ini(c.sh))}</span><div><b>${esc(c.n)}</b><small>${c.dirs.map(d=>DIRS[d].s).join(' · ')} · ${esc(c.tariff)}</small></div>`:`<div><b>${esc(s.n)}</b><small>${role==='Клиент'?'группа «Нур» · 3 компании':'вся компания · '+TOTAL_CLIENTS+' клиентов'}</small></div>`}
function build(){buildRail();buildList();buildSub();render()}
function render(){const f=SC[cur]||SC.inbox;document.getElementById('ttl').textContent=SUBN[cur]||'Кварта';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();buildRail();
 const a=document.getElementById('addBtn');if(a)a.style.display=role==='Клиент'?'none':'';try{history.replaceState(null,'','?s='+cur+(cur==='req'?'&r='+curReq:''))}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}

const TOUR=[
 ['inbox','1 · Входящие: каждый запрос клиента — заявка с направлением, ответственным и сроком ответа. Вместо WhatsApp и Telegram.'],
 ['req','2 · Заявка: переписка, документы, звонок, статус. Клиент видит всё у себя.'],
 ['board','3 · Доска по статусам — цвет полоски показывает направление.'],
 ['ws','4 · Рабочее место клиента. Слева — список клиентов как в мессенджере: выбрали — всё переключилось.'],
 ['chat','5 · Мессенджер с клиентом: внутренние заметки, файлы, аудио- и видеозвонки.'],
 ['calls','6 · Звонки внутри платформы с записью — без личных номеров.'],
 ['buh','7 · Бухгалтерия: сроки отчётности по всем клиентам и первичка — запрос недостающего одной кнопкой.'],
 ['law','8 · Юридическое: договоры, претензии, регистрация.'],
 ['hr','9 · HR: приёмы, отпуска, увольнения, табели клиентов.'],
 ['ai','10 · ИИ-шаблоны: реквизиты из карточки, условия от ИИ, отправка только после проверки специалистом.'],
 ['docs','11 · Архив и подпись ЭЦП.'],
 ['tasks','12 · Внутренние задачи — Битрикс24 больше не нужен.'],
 ['billing','13 · Счета всем клиентам — автоматически 1-го числа.'],
 ['analytics','14 · Аналитика: заявки, сроки, загрузка, отток.'],
 ['portal','15 · Кабинет клиента: заявка в два нажатия, документы, счета, команда; переключение между своими компаниями.'],
 ['app','16 · Приложение iOS и Android: мессенджер, аудио- и видеозвонки.'],
 ['migrate','17 · Перенос из Битрикс24 входит в пакет; 1С:Фреш — по желанию.'],
 ['security','18 · Серверы в Казахстане, права на ПО — ваши.'],
 ['launch','19 · Портал 2,5 млн + приложение 3,5 млн; 20 / 40 / 40.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается: заявки, клиенты, чат, шаблоны, счета.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;if(k==='req')curReq='R-1041';if(k==='ws'||k==='chat')curCl='C3';if(k==='ai'){aiTpl='T1';curCl='C7';aiGen=true}build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){const i=document.getElementById('clq');if(i){e.preventDefault();i.focus()}}});
 let q='',o='';try{const u=new URLSearchParams(location.search);q=u.get('s')||'';o=u.get('r')||''}catch(e){}if(o&&RQ(o)){curReq=o;curCl=RQ(o).cl}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
