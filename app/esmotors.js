/* ES Motors · CRM отдела продаж автосалона — демо. Данные демонстрационные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const num=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const mln=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n/1e6);

/* ===== РОЛИ ===== */
const ROLES={
 'Руководитель':{av:'ЕЛ',n:'Ельжан',r:'собственник',note:'Вся воронка, звонки, визиты, деньги и работа менеджеров',
  s:['dash','funnel','calls','visits','cars','managers','ads','credits','reports','tasks']},
 'Менеджер продаж':{av:'АР',n:'Арман',r:'отдел продаж',note:'Свои сделки, звонки, WhatsApp, встречи и заявки в банки',
  s:['my','funnel','leads','wa','visits','cars','credits','tasks']},
 'Оператор колл-центра':{av:'АЖ',n:'Аружан',r:'приём звонков',note:'Приём обращений с рекламы, квалификация и запись на визит',
  s:['leads','calls','visits','cars']},
 'Кредитный специалист':{av:'КС',n:'Динара',r:'банки и одобрения',note:'Заявки в банки, статусы одобрений, суммы и первый взнос',
  s:['credits','funnel','clients','tasks']},
 'Администратор':{av:'АД',n:'Администратор',r:'настройки',note:'Пользователи, номера, воронка, интеграции и журнал',
  s:['users','integr','stages','audit','reports']}
};
let role='Руководитель',cur='dash',theme='dark';

const NAV=[
 ['ПРОДАЖИ',[['dash','◧','Сводка'],['leads','✉','Обращения',5],['my','▤','Мои сделки'],['funnel','▦','Воронка'],['visits','⌖','Визиты в салон',3],['clients','◉','Клиенты']]],
 ['СВЯЗЬ',[['calls','☎','Звонки и записи',2],['wa','✆','WhatsApp',4],['tasks','✓','Задачи',3]]],
 ['АВТО И ДЕНЬГИ',[['cars','⛭','Авто в наличии'],['credits','₸','Заявки в банки',2],['ads','◎','Реклама и источники']]],
 ['АНАЛИТИКА И НАСТРОЙКИ',[['managers','★','Работа менеджеров'],['reports','◲','Отчёты'],['stages','⚙','Этапы воронки'],['users','◍','Пользователи'],['integr','⚟','Интеграции'],['audit','◷','Журнал']]]
];
const TITLES={
 dash:['Сводка','Лиды, звонки, визиты в салон, продажи и маржа — на одном экране'],
 leads:['Обращения','Заявки с рекламы, звонки и WhatsApp одной лентой — с таймером ответа'],
 my:['Мои сделки','Всё, что в работе у менеджера: клиент, авто, банк, следующий шаг'],
 funnel:['Воронка продаж','От первого звонка до выдачи авто — карточка тянется мышью между этапами'],
 visits:['Визиты в салон','Главная метрика: кого записали, кто дошёл, кто купил'],
 clients:['Клиенты','База с историей обращений, визитов, звонков и покупок'],
 calls:['Звонки и записи','Каждый разговор записан: можно послушать, оценить и разобрать с менеджером'],
 wa:['WhatsApp','Переписка ведётся из системы, у каждого менеджера свой номер'],
 tasks:['Задачи','Перезвонить, подготовить документы, напомнить о визите — со сроком и ответственным'],
 cars:['Авто в наличии','Что стоит в салоне: закуп, расходы, цена и маржа по каждой машине'],
 credits:['Заявки в банки','Одна анкета — во все банки сразу, ответы и суммы одобрения в одном месте'],
 ads:['Реклама и источники','Сколько потратили, сколько лидов, во сколько обходится визит и продажа'],
 managers:['Работа менеджеров','Звонки, скорость ответа, встречи, доходимость и продажи по каждому'],
 reports:['Отчёты','Любой срез выгружается в Excel'],
 stages:['Этапы воронки','Настройка этапов под ваш процесс — без программиста'],
 users:['Пользователи','Кто в системе, какие номера и что видит'],
 integr:['Интеграции','WhatsApp, IP-телефония, Instagram, сайт и 2GIS'],
 audit:['Журнал','Кто, что и когда изменил — записи не удаляются']
};

/* ===== ДАННЫЕ ===== */
const MGR=['Арман','Дана','Ерлан'];
const SRC={ig:['Instagram · таргет','var(--violet)'],kolesa:['Kolesa.kz','var(--blue)'],call:['Звонок по рекламе','var(--green)'],wa:['WhatsApp','var(--wa)'],gis:['2GIS','var(--cyan)'],ref:['Рекомендация','var(--amber)']};
const STAGES=[
 ['new','НОВОЕ ОБРАЩЕНИЕ','var(--blue)'],
 ['call','ДОЗВОН И КВАЛИФИКАЦИЯ','var(--cyan)'],
 ['meet','ВСТРЕЧА НАЗНАЧЕНА','var(--violet)'],
 ['visit','ПРИШЁЛ В САЛОН','var(--acc)'],
 ['bank','ЗАЯВКА В БАНК','var(--amber)'],
 ['deposit','АВАНС','#f97316'],
 ['done','ВЫДАЧА','var(--green)']
];
const CARS=[
 {id:'c1',n:'Toyota Camry 70',y:2019,km:96000,color:'белый',from:'Корея',buy:11400000,cost:680000,price:14200000,st:'В наличии',days:14,vin:'JTNB11HK***4821'},
 {id:'c2',n:'Hyundai Sonata DN8',y:2020,km:74000,color:'серый',from:'Корея',buy:9200000,cost:520000,price:11600000,st:'Резерв',days:9,vin:'KMHL341***9930'},
 {id:'c3',n:'Kia K5',y:2021,km:58000,color:'чёрный',from:'Корея',buy:10100000,cost:410000,price:12700000,st:'В наличии',days:6,vin:'KNAG3411***112'},
 {id:'c4',n:'Lexus RX 300',y:2018,km:118000,color:'серебро',from:'США',buy:16800000,cost:1250000,price:21400000,st:'В наличии',days:27,vin:'2T2BZM***A0221'},
 {id:'c5',n:'Chevrolet Malibu',y:2019,km:88000,color:'синий',from:'США',buy:7300000,cost:640000,price:9500000,st:'В наличии',days:41,vin:'1G1ZD5S***5540'},
 {id:'c6',n:'Hyundai Elantra',y:2021,km:46000,color:'белый',from:'Грузия',buy:8100000,cost:390000,price:10200000,st:'В наличии',days:11,vin:'KMHLM4A***7781'},
 {id:'c7',n:'Toyota RAV4',y:2020,km:81000,color:'графит',from:'Грузия',buy:13900000,cost:820000,price:17300000,st:'Продан',days:0,vin:'JTMW1RF***2094'},
 {id:'c8',n:'Kia Sportage',y:2019,km:103000,color:'красный',from:'Местная',buy:9800000,cost:310000,price:12100000,st:'В наличии',days:19,vin:'XWEPH81***5563'}
];
const car=id=>CARS.find(c=>c.id===id);
const marg=c=>c.price-c.buy-c.cost;
const BANKS=['БЦК','Шинхан','Freedom','Bereke','Home Credit','Микрофинанс'];
let DEALS=[
 {id:1842,st:'visit',cl:'Ерасыл Т.',ph:'+7 707 445 90 12',src:'ig',mgr:'Арман',car:'c1',budget:14000000,first:4000000,due:'сегодня 16:00',
  note:'Сравнивает с Sonata, важна рассрочка и небольшой первый взнос',
  chat:[['Клиент','Здравствуйте! Camry 2019 ещё в наличии? Какой первый взнос?','сегодня 09:12','in'],['Арман','Здравствуйте! Да, в наличии, белая, 96 000 км. Первый взнос от 4 млн, ежемесячно около 210 тыс. Приезжайте посмотреть — сегодня до 20:00.','сегодня 09:14',''],['Клиент','Хорошо, буду к 16:00','сегодня 09:26','in']],
  calls:[['вх','сегодня 09:13','4:18','Арман',8]],
  bank:{sent:1,ans:[['БЦК','Одобрено',10500000],['Шинхан','Одобрено',9800000],['Freedom','На рассмотрении',0]]}},
 {id:1841,st:'bank',cl:'Айгерим К.',ph:'+7 701 220 44 18',src:'kolesa',mgr:'Дана',car:'c3',budget:12500000,first:3000000,due:'завтра 12:00',
  note:'Нужна справка о доходах, работает ИП',
  chat:[['Клиент','Отправила документы в WhatsApp','вчера 18:20','in']],
  calls:[['вх','вчера 14:02','6:41','Дана',9],['исх','сегодня 10:15','2:04','Дана',7]],
  bank:{sent:1,ans:[['БЦК','Отказ',0],['Шинхан','Одобрено',9200000],['Bereke','На рассмотрении',0]]}},
 {id:1840,st:'meet',cl:'Нурлан Б.',ph:'+7 747 302 88 15',src:'call',mgr:'Ерлан',car:'c4',budget:21000000,first:8000000,due:'завтра 18:00',
  note:'Смотрел RX в другом салоне, торгуется',
  chat:[],calls:[['вх','сегодня 11:40','3:12','Ерлан',6]],bank:{sent:0,ans:[]}},
 {id:1839,st:'call',cl:'Мадина С.',ph:'+7 705 918 77 40',src:'ig',mgr:'Арман',car:'c6',budget:10000000,first:2500000,due:'сегодня 18:00',
  note:'Первая машина, интересует Elantra или Malibu',
  chat:[['Клиент','Можно фото салона?','сегодня 12:30','in']],calls:[['вх','сегодня 12:22','1:47','Арман',5]],bank:{sent:0,ans:[]}},
 {id:1838,st:'new',cl:'Данияр А.',ph:'+7 700 615 22 09',src:'gis',mgr:'Дана',car:'',budget:9000000,first:2000000,due:'сегодня 15:00',
  note:'Заявка с 2GIS, пока не дозвонились',chat:[],calls:[],bank:{sent:0,ans:[]}},
 {id:1837,st:'deposit',cl:'Асхат М.',ph:'+7 708 114 55 63',src:'ref',mgr:'Ерлан',car:'c2',budget:11600000,first:3500000,due:'02.09 11:00',
  note:'Внёс аванс 300 000 ₸, ждём выдачу после подготовки авто',
  chat:[['Клиент','Когда можно забрать?','сегодня 08:40','in'],['Ерлан','Готовим документы, во вторник в 11:00 выдача','сегодня 08:52','']],
  calls:[['вх','29.08 16:20','5:33','Ерлан',9]],bank:{sent:1,ans:[['Шинхан','Одобрено',8100000]]}},
 {id:1836,st:'done',cl:'Гульмира Н.',ph:'+7 702 448 19 03',src:'ig',mgr:'Дана',car:'c7',budget:17300000,first:6000000,due:'29.08',
  note:'Сделка закрыта, авто выдано 29 августа',
  chat:[],calls:[['вх','24.08 10:05','7:12','Дана',10]],bank:{sent:1,ans:[['БЦК','Одобрено',11300000]]}}
];
let dealSeq=1843;
let LEADS=[
 {id:1,src:'ig',who:'+7 700 615 22 09 · Данияр',txt:'Здравствуйте, интересует Elantra 2021, какая цена и есть ли рассрочка?',t:'2 мин назад',sla:'ok',fresh:1},
 {id:2,src:'call',who:'+7 747 991 03 55 · новый номер',txt:'Пропущенный звонок с рекламного номера · перезвонить',t:'8 мин назад',sla:'warn',fresh:1},
 {id:3,src:'kolesa',who:'+7 771 220 66 41 · Асель',txt:'Заявка с Kolesa.kz по Kia K5: «в наличии? можно в кредит?»',t:'21 мин назад',sla:'warn',fresh:1},
 {id:4,src:'wa',who:'+7 702 883 17 29 · Бекзат',txt:'Отправил фото своей машины на обмен, ждёт оценку trade-in',t:'40 мин назад',sla:'ok',fresh:1},
 {id:5,src:'gis',who:'+7 776 402 51 88 · Жанна',txt:'Заявка с 2GIS: «работаете сегодня до скольки?»',t:'1 ч назад',sla:'ok',fresh:0}
];
let leadSeq=6;
let VISITS=[
 {id:'В-2094',cl:'Ерасыл Т.',deal:1842,mgr:'Арман',when:'сегодня 16:00',st:'Ожидается',car:'c1',res:''},
 {id:'В-2093',cl:'Нурлан Б.',deal:1840,mgr:'Ерлан',when:'завтра 18:00',st:'Ожидается',car:'c4',res:''},
 {id:'В-2092',cl:'Айгерим К.',deal:1841,mgr:'Дана',when:'вчера 15:00',st:'Пришёл',car:'c3',res:'Тест-драйв, ушла думать, подали в банки'},
 {id:'В-2091',cl:'Асхат М.',deal:1837,mgr:'Ерлан',when:'29.08 12:00',st:'Пришёл',car:'c2',res:'Внёс аванс 300 000 ₸'},
 {id:'В-2090',cl:'Тимур Ж.',deal:0,mgr:'Дана',when:'28.08 17:00',st:'Не пришёл',car:'c5',res:'Не берёт трубку, перенесли на следующую неделю'},
 {id:'В-2089',cl:'Гульмира Н.',deal:1836,mgr:'Дана',when:'24.08 13:00',st:'Пришёл',car:'c7',res:'Купила RAV4, выдача 29.08'}
];
const CALLS=[
 {id:1,t:'вх',ph:'+7 707 445 90 12',cl:'Ерасыл Т.',mgr:'Арман',when:'сегодня 09:13',dur:'4:18',ans:42,score:8,deal:1842,
  tags:['назначил встречу','предложил рассрочку'],
  note:'Хорошо отработал возражение по первому взносу, назначил визит на сегодня'},
 {id:2,t:'вх',ph:'+7 705 918 77 40',cl:'Мадина С.',mgr:'Арман',when:'сегодня 12:22',dur:'1:47',ans:18,score:5,deal:1839,
  tags:['не назначил встречу'],
  note:'Не выяснил бюджет и не пригласил в салон — разобрать на планёрке'},
 {id:3,t:'исх',ph:'+7 701 220 44 18',cl:'Айгерим К.',mgr:'Дана',when:'сегодня 10:15',dur:'2:04',ans:0,score:7,deal:1841,
  tags:['статус по банку'],note:'Сообщила об одобрении Шинхан на 9,2 млн'},
 {id:4,t:'вх',ph:'+7 747 991 03 55',cl:'—',mgr:'—',when:'сегодня 13:40',dur:'0:00',ans:0,score:0,deal:0,
  tags:['пропущенный'],note:'Никто не взял трубку — обращение в ленте, нужно перезвонить'},
 {id:5,t:'вх',ph:'+7 747 302 88 15',cl:'Нурлан Б.',mgr:'Ерлан',when:'сегодня 11:40',dur:'3:12',ans:65,score:6,deal:1840,
  tags:['назначил встречу','торг'],note:'Клиент торгуется, менеджер согласовал скидку без руководителя'}
];
const cl2=id=>CALLS.find(c=>c.id===id);
let TASKS=[
 {id:1,col:'today',t:'Перезвонить по пропущенному +7 747 991 03 55',who:'Аружан',due:'сегодня 14:30',pri:'высокий',deal:0},
 {id:2,col:'today',t:'Встретить Ерасыла в 16:00, подготовить Camry к осмотру',who:'Арман',due:'сегодня 16:00',pri:'высокий',deal:1842},
 {id:3,col:'week',t:'Собрать документы Айгерим для БЦК повторно',who:'Динара',due:'02.09',pri:'обычный',deal:1841},
 {id:4,col:'week',t:'Malibu стоит 41 день — снизить цену или дать в рекламу',who:'Ельжан',due:'03.09',pri:'обычный',deal:0},
 {id:5,col:'done',t:'Выдать RAV4 Гульмире, подписать акт',who:'Дана',due:'29.08',pri:'обычный',deal:1836}
];
let taskSeq=6;
const TCOLS=[['today','СЕГОДНЯ','var(--red)'],['week','НА НЕДЕЛЕ','var(--acc)'],['done','ВЫПОЛНЕНО','var(--green)']];
const ADS=[
 {n:'Instagram · таргет «Camry в рассрочку»',spend:420000,leads:124,visits:38,deals:9,src:'ig'},
 {n:'Instagram · таргет «Авто из Кореи»',spend:310000,leads:86,visits:24,deals:5,src:'ig'},
 {n:'Kolesa.kz · размещение',spend:180000,leads:64,visits:21,deals:6,src:'kolesa'},
 {n:'2GIS · карточка и реклама',spend:60000,leads:28,visits:11,deals:3,src:'gis'},
 {n:'Рекомендации и повторные',spend:0,leads:19,visits:14,deals:6,src:'ref'}
];
const AUDIT=[
 ['31.08 13:41','Арман','Сделка 1842','Этап изменён: «Встреча назначена» → «Пришёл в салон»'],
 ['31.08 13:12','Система','Звонок','Пропущенный с рекламного номера — создано обращение и задача'],
 ['31.08 11:48','Дана','Сделка 1841','Заявка отправлена в 3 банка, получено 1 одобрение'],
 ['31.08 10:20','Ельжан','Авто c5','Цена снижена: 9 800 000 → 9 500 000 ₸ (стоит 41 день)'],
 ['30.08 18:05','Ерлан','Сделка 1837','Принят аванс 300 000 ₸, выдача назначена на 02.09'],
 ['29.08 16:30','Дана','Сделка 1836','Сделка закрыта, авто выдано, маржа 2 580 000 ₸']
];

/* ===== ЭКРАНЫ ===== */
const SC={};
const stName=k=>STAGES.find(s=>s[0]===k)[1];
const stColor=k=>STAGES.find(s=>s[0]===k)[2];
const dealsOf=m=>DEALS.filter(d=>d.mgr===m);

/* --- СВОДКА --- */
SC.dash=()=>{
 const active=DEALS.filter(d=>d.st!=='done');
 const stock=CARS.filter(c=>c.st!=='Продан');
 const vis=VISITS.filter(v=>v.st!=='Ожидается');
 const came=vis.filter(v=>v.st==='Пришёл').length;
 return `<div class="head"><div><h2>Сводка</h2><p>Всё, что происходит в отделе продаж прямо сейчас. Цифры собираются из звонков, переписок и работы менеджеров — никто не заполняет отчёт руками.</p></div>
 <div class="btns"><button class="btn" onclick="go('managers')">По менеджерам</button><button class="btn acc" onclick="go('ads')">Реклама</button></div></div>
 <div class="strip">
  <div><small>ОБРАЩЕНИЙ СЕГОДНЯ</small><b>${LEADS.length + 12}</b><span class="a">${LEADS.filter(l=>l.sla==='warn').length} без ответа больше 10 минут</span></div>
  <div><small>ВИЗИТОВ НА НЕДЕЛЕ</small><b class="c">${VISITS.length}</b><span>дошли ${came} из ${vis.length} · ${Math.round(came/vis.length*100)}%</span></div>
  <div><small>СДЕЛОК В РАБОТЕ</small><b>${active.length}</b><span>на ${mln(active.reduce((a,d)=>a+d.budget,0))} млн ₸</span></div>
  <div><small>ПРОДАНО ЗА АВГУСТ</small><b class="g">11 авто</b><span>средний чек 12,4 млн ₸</span></div>
  <div><small>МАРЖА ЗА АВГУСТ</small><b class="c">21,8 млн ₸</b><span>в среднем 1,98 млн с авто</span></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph"><div><div class="ph-title">Путь клиента до покупки</div>
   <div class="ph-sub">где теряются клиенты — видно по числам, а не по ощущениям</div></div>
   <button class="btn" onclick="go('funnel')">Открыть воронку →</button></div>
   ${[['Обращений с рекламы',321,100],['Дозвонились и квалифицировали',248,77],['Назначили встречу в салоне',143,45],['Дошли до салона',89,28],['Подали в банк',61,19],['Внесли аванс',34,11],['Купили',29,9]].map((r,i)=>
    `<div class="fr" style="grid-template-columns:210px 1fr 96px"><span>${r[0]}</span>
    <div class="bar"><i style="--w:${r[2]}%;background:${i===3?'var(--acc)':i===6?'var(--green)':'var(--line2)'}"></i></div>
    <b>${r[1]} · ${r[2]}%</b></div>`).join('')}
   <div class="hint"><b>Главная точка потери — доход до салона.</b> Из 143 назначенных встреч дошли 89. Каждый недошедший — это уже оплаченная реклама и потраченное время менеджера. Система показывает поимённо, кто не дошёл и что с ним сделали дальше.</div>
   <div class="ph-title" style="margin:15px 0 8px">Что можно поправить прямо сейчас</div>
   <div class="tw"><table class="data" style="min-width:640px"><thead><tr><th>Место потери</th><th class="right">Сейчас</th><th class="right">Если поправить</th><th>Что делать</th></tr></thead><tbody>
   ${[['Скорость ответа на обращение','3 мин · у Ерлана 6','до 1 минуты','уведомление на телефон и таймер в ленте'],
      ['Доходимость до салона','62%','75%','напоминание в WhatsApp за 2 часа'],
      ['Качество первого звонка','7,0 из 10','8,5 из 10','разбор записей на планёрке раз в неделю'],
      ['Возврат недошедших','не считается','+3–4 визита в месяц','автозадача перезвонить на следующий день']]
    .map(r=>`<tr onclick="go('managers')"><td><b>${r[0]}</b></td><td class="right mono">${r[1]}</td>
    <td class="right mono" style="color:var(--green)">${r[2]}</td><td class="mini">${r[3]}</td></tr>`).join('')}
   </tbody></table></div>
   <p class="mini" style="margin-top:9px">При 29 продажах в месяц рост доходимости с 62% до 75% — это примерно <b style="color:var(--acc)">+6 машин в месяц</b> без единого дополнительного тенге на рекламу.</p>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Требует внимания</div>
    <div class="note" style="--tone:var(--red)"><b>Пропущенный звонок с рекламного номера</b><p>13:40, никто не взял трубку. Обращение уже в ленте, задача поставлена Аружан.</p></div>
    <div class="note" style="--tone:var(--amber)"><b>Звонок Армана: оценка 5 из 10</b><p>Не выяснил бюджет и не пригласил в салон. Запись можно послушать за 1 минуту.</p></div>
    <div class="note" style="--tone:var(--acc)"><b>Malibu стоит в салоне 41 день</b><p>Деньги заморожены, маржа тает. Система подсказывает снизить цену или добавить в рекламу.</p></div>
   </div>
   <div class="panel"><div class="ph-title">Склад авто</div>
    <div class="kv"><span>Машин в наличии</span><b>${stock.length}</b></div>
    <div class="kv"><span>Вложено в склад</span><b class="mono">${mln(stock.reduce((a,c)=>a+c.buy+c.cost,0))} млн ₸</b></div>
    <div class="kv"><span>Ожидаемая маржа</span><b class="mono" style="color:var(--green)">${mln(stock.reduce((a,c)=>a+marg(c),0))} млн ₸</b></div>
    <div class="kv"><span>Средний срок на площадке</span><b>${Math.round(stock.reduce((a,c)=>a+c.days,0)/stock.length)} дней</b></div>
    <button class="btn" style="width:100%;margin-top:9px" onclick="go('cars')">Открыть склад</button>
   </div>
  </div>
 </div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Ближайшие визиты в салон</div>
   ${VISITS.filter(v=>v.st==='Ожидается').map(v=>`<div class="kv" style="cursor:pointer" onclick="go('visits')">
    <span>${v.when} · ${esc(v.cl)}</span><b>${v.mgr} · ${v.car?esc(car(v.car).n):'без авто'}</b></div>`).join('')}
   <div class="note" style="--tone:var(--acc)"><b>Клиенту уходит напоминание</b><p>За 2 часа до визита в WhatsApp автоматически уходит адрес салона и время. Доходимость от этого растёт заметно.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Продажи по менеджерам за август</div>
   ${[['Дана',5,62800000],['Арман',4,49200000],['Ерлан',2,25400000]].map(m=>
    `<div class="fr" style="grid-template-columns:100px 1fr 118px"><span>${m[0]}</span>
    <div class="bar"><i style="--w:${m[1]/5*100}%"></i></div><b>${m[1]} авто · ${mln(m[2])} млн</b></div>`).join('')}
   <button class="btn" style="width:100%;margin-top:9px" onclick="go('managers')">Разбор по менеджерам</button>
  </div>
 </div>`};

/* --- ОБРАЩЕНИЯ --- */
SC.leads=()=>`
 <div class="head"><div><h2>Обращения</h2><p>Заявки с Instagram и Kolesa, звонки с рекламного номера, сообщения в WhatsApp и 2GIS — в одной ленте. Ни одно обращение не теряется в личном телефоне менеджера.</p></div>
 <div class="btns"><button class="btn" onclick="simLead()">⚡ Показать новое обращение</button><button class="btn acc" onclick="go('funnel')">К воронке</button></div></div>
 <div class="strip">
  <div><small>ОБРАЩЕНИЙ СЕГОДНЯ</small><b>${LEADS.length+12}</b><span>по всем каналам</span></div>
  <div><small>БЕЗ ОТВЕТА</small><b class="a">${LEADS.filter(l=>l.sla==='warn').length}</b><span>дольше 10 минут</span></div>
  <div><small>СРЕДНИЙ ОТВЕТ</small><b class="g">3 мин</b><span>норматив 10 минут</span></div>
  <div><small>ПРОПУЩЕННЫХ ЗВОНКОВ</small><b class="r">1</b><span>задача уже поставлена</span></div>
  <div><small>ИСТОЧНИК №1</small><b>Instagram</b><span>52% обращений</span></div>
 </div>
 <div class="g21">
  <div class="panel" style="padding:0">
   <div style="padding:13px 15px;border-bottom:1px solid var(--line)"><div class="ph-title">Лента обращений</div>
    <div class="ph-sub">из обращения одним нажатием создаётся сделка с клиентом и источником</div></div>
   ${LEADS.map(l=>`<div style="padding:12px 15px;border-bottom:1px solid var(--line);cursor:pointer;${l.fresh?'background:var(--card2)':''}" onclick="openLead(${l.id})">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
     <div style="flex:1">
      <b style="font-size:11.2px">${esc(l.who)}</b>
      <p style="margin:5px 0 0;font-size:10.6px;color:var(--muted);line-height:1.5">${esc(l.txt)}</p>
      <div style="margin-top:6px"><span class="badge" style="background:${SRC[l.src][1]}22;color:${SRC[l.src][1]}">${SRC[l.src][0]}</span></div>
     </div>
     <span class="badge ${l.sla==='warn'?'a':'g'}">${l.t}</span></div>
   </div>`).join('')}
  </div>
  <div>
   <div class="panel"><div class="ph-title">Откуда приходят клиенты</div>
    ${[['Instagram · таргет',52,'var(--violet)'],['Kolesa.kz',21,'var(--blue)'],['Звонки по рекламе',14,'var(--green)'],['2GIS',9,'var(--cyan)'],['Рекомендации',4,'var(--amber)']].map(x=>
     `<div class="fr" style="grid-template-columns:130px 1fr 40px"><span>${x[0]}</span><div class="bar"><i style="--w:${x[1]}%;background:${x[2]}"></i></div><b>${x[1]}%</b></div>`).join('')}
    <div class="note" style="--tone:var(--acc)"><b>Источник фиксируется сам</b><p>Заявка с рекламы приходит с меткой кампании, звонок — с рекламного номера. Потом видно, какая реклама привела не просто лида, а реальную продажу.</p></div>
   </div>
   <div class="panel"><div class="ph-title">Что происходит с обращением</div>
    <div class="chain" style="flex-direction:column;gap:0">
     <div class="st done" style="border-radius:10px 10px 0 0"><code>СРАЗУ</code><b>Автоответ в WhatsApp</b><small>клиент получает ответ за секунды, даже ночью</small></div>
     <div class="st done"><code>ДО 10 МИНУТ</code><b>Менеджер звонит</b><small>таймер тикает, руководитель видит просрочку</small></div>
     <div class="st now" style="border-radius:0 0 10px 10px"><code>ЦЕЛЬ ЗВОНКА</code><b>Записать в салон</b><small>встреча ставится в календарь с напоминанием</small></div>
    </div>
   </div>
  </div>
 </div>`;
function openLead(id){const l=LEADS.find(x=>x.id===id);if(!l)return;
 openD(esc(l.who),`${SRC[l.src][0]} · ${l.t}`,[],
 `<div class="panel"><div class="ph-title" style="margin-bottom:8px">Обращение</div>
  <div class="msg in"><div class="mh"><b>Клиент</b><time>${l.t}</time></div><p>${esc(l.txt)}</p></div>
  <div class="msg"><div class="mh"><b>Автоответ ES Motors</b><time>сразу</time></div><p>Здравствуйте! Спасибо за обращение. Менеджер свяжется с вами в течение 10 минут. Мы на Райымбека 169/4, работаем с 10:00 до 20:00.</p></div>
  <div style="display:flex;gap:7px;margin-top:9px"><input class="search" style="flex:1" placeholder="Ответить в ${SRC[l.src][0]}…">
  <button class="btn acc" onclick="toast('Ответ отправлен клиенту. Переписка сохраняется в карточке сделки и видна руководителю.')">Отправить</button></div>
 </div>
 <div class="panel"><div class="ph-title">Быстрые действия</div>
  <div class="btns"><button class="btn acc" onclick="leadToDeal(${id})">Создать сделку</button>
  <button class="btn" onclick="toast('Звонок инициирован через IP-телефонию: разговор записывается и прикрепится к карточке.')">☎ Позвонить</button>
  <button class="btn" onclick="toast('Клиент записан на визит в салон. За два часа ему уйдёт напоминание в WhatsApp.')">Записать в салон</button></div>
  <div class="note" style="--tone:var(--acc)"><b>Одно нажатие вместо пяти</b><p>При создании сделки клиент, номер, источник и переписка переносятся автоматически — менеджер не набирает ничего руками.</p></div>
 </div>`)}
function leadToDeal(id){const l=LEADS.find(x=>x.id===id);
 DEALS.unshift({id:dealSeq++,st:'new',cl:l.who.split('·')[1]?.trim()||'Новый клиент',ph:l.who.split('·')[0].trim(),src:l.src,mgr:ROLES[role].n==='Ельжан'?'Арман':ROLES[role].n,
  car:'',budget:10000000,first:2500000,due:'сегодня 18:00',note:l.txt,chat:[['Клиент',l.txt,l.t,'in']],calls:[],bank:{sent:0,ans:[]}});
 LEADS=LEADS.filter(x=>x.id!==id);closeD();go('funnel');sparks();
 toast('Сделка создана из обращения: клиент, номер, источник рекламы и переписка перенесены автоматически.')}
function simLead(){LEADS.unshift({id:leadSeq++,src:'ig',who:'+7 708 551 22 47 · Санжар',txt:'Здравствуйте! Видел RAV4 в рекламе, есть в наличии? Какой пробег?',t:'только что',sla:'ok',fresh:1});
 render();sparks();toast('Новое обращение с Instagram — <b>автоответ ушёл за 4 секунды</b>, таймер ответа менеджера пошёл.')}

/* --- ВОРОНКА --- */
let dragDeal=null,funFilter='all';
SC.funnel=()=>{const list=funFilter==='all'?DEALS:DEALS.filter(d=>d.mgr===funFilter);
 return `<div class="head"><div><h2>Воронка продаж</h2><p>Этапы под ваш процесс: от обращения до выдачи авто. Карточку можно тянуть мышью, внутри — переписка, записи звонков, авто, банк и документы.</p></div>
 <div class="btns"><button class="btn acc" onclick="newDeal()">+ Сделка</button></div></div>
 <div class="filters">
  <button class="filter ${funFilter==='all'?'on':''}" onclick="funFilter='all';render()">Все · ${DEALS.length}</button>
  ${MGR.map(m=>`<button class="filter ${funFilter===m?'on':''}" onclick="funFilter='${m}';render()">${m} · ${dealsOf(m).length}</button>`).join('')}
 </div>
 <div class="board" style="grid-template-columns:repeat(7,1fr)">
 ${STAGES.map(([k,name,color])=>{const l=list.filter(d=>d.st===k);
  return `<div class="col" id="col_${k}" ondragover="colOver(event,'col_${k}')" ondragleave="colOut('col_${k}')" ondrop="dealDrop('${k}')">
   <div class="col-h"><b style="color:${color}">${name}</b><span class="badge">${l.length}</span></div>
   ${l.map(d=>`<div class="kc" style="border-left:3px solid ${color}" draggable="true" ondragstart="dragDeal=${d.id};this.classList.add('drag')" ondragend="this.classList.remove('drag')" onclick="openDeal(${d.id})">
     <b>${esc(d.cl)}</b>
     <div class="sub" style="margin-top:4px">${d.car?esc(car(d.car).n):'авто не выбрано'}</div>
     <div style="font:800 11.4px 'IBM Plex Mono',monospace;color:var(--acc);margin-top:6px">${mln(d.budget)} млн ₸</div>
     <div class="krow"><span>${d.mgr}</span><span class="badge" style="background:${SRC[d.src][1]}22;color:${SRC[d.src][1]};font-size:6.8px">${SRC[d.src][0].split(' ')[0]}</span></div>
    </div>`).join('')||'<p class="mini" style="padding:7px 2px">—</p>'}
  </div>`}).join('')}
 </div>
 <div class="hint"><b>Этап «Пришёл в салон» стоит отдельно не случайно.</b> По вашим словам, если клиент доехал до салона — сделка почти состоялась. Поэтому система считает доходимость как отдельную метрику: сколько встреч назначено, сколько человек реально пришло и сколько из них купило — в разрезе менеджера и источника рекламы.</div>`};
function colOver(e,id){e.preventDefault();const el=document.getElementById(id);if(el)el.classList.add('over')}
function colOut(id){const el=document.getElementById(id);if(el)el.classList.remove('over')}
function dealDrop(st){colOut('col_'+st);if(!dragDeal)return;const d=DEALS.find(x=>x.id===dragDeal);
 if(d.st!==st){const was=stName(d.st);d.st=st;
  if(st==='visit'){VISITS.unshift({id:'В-'+(2095+VISITS.length),cl:d.cl,deal:d.id,mgr:d.mgr,when:'сейчас',st:'Пришёл',car:d.car,res:'Отметка менеджера при встрече'});
   render();sparks();toast(`<b>${esc(d.cl)} дошёл до салона</b> — визит зафиксирован, доходимость пересчитана. Это ключевая метрика воронки.`)}
  else if(st==='done'){const c=d.car?car(d.car):null;if(c)c.st='Продан';
   render();sparks();toast(`Сделка закрыта: <b>${esc(d.cl)}</b>${c?` купил ${esc(c.n)} за ${tg(c.price)}, маржа ${tg(marg(c))}`:''}. Авто снято с площадки.`)}
  else{render();toast(`Сделка «${esc(d.cl)}»: <b>${was} → ${stName(st)}</b>.`)}}
 dragDeal=null}
let dTab=0;
function openDeal(id,tab){const d=DEALS.find(x=>x.id===id);if(!d)return;if(tab!==undefined)dTab=tab;
 const c=d.car?car(d.car):null;
 const tabs=['Клиент и авто','Переписка','Звонки','Банк','Документы'];
 let body='';
 if(dTab===0){body=`
  <div class="chain">${STAGES.map(s=>{const i=STAGES.findIndex(x=>x[0]===s[0]),cu=STAGES.findIndex(x=>x[0]===d.st);
   return `<div class="st ${i===cu?'now':i<cu?'done':''}" style="min-width:74px"><code>${i<cu?'ПРОЙДЕН':i===cu?'СЕЙЧАС':''}</code><b style="font-size:8.8px">${s[1]}</b></div>`}).join('')}</div>
  <div class="panel">
   <div class="kv"><span>Клиент</span><b>${esc(d.cl)} · ${d.ph}</b></div>
   <div class="kv"><span>Источник</span><b>${SRC[d.src][0]}</b></div>
   <div class="kv"><span>Менеджер</span><b>${d.mgr}</b></div>
   <div class="kv"><span>Бюджет клиента</span><b class="mono">${tg(d.budget)}</b></div>
   <div class="kv"><span>Первый взнос</span><b class="mono">${tg(d.first)}</b></div>
   <div class="kv"><span>Следующий шаг</span><b>${d.due}</b></div>
   <div class="kv"><span>Заметка менеджера</span><b style="max-width:60%;font-weight:600">${esc(d.note)}</b></div>
  </div>
  ${c?`<div class="panel"><div class="ph"><div><div class="ph-title">${esc(c.n)} · ${c.y}</div>
   <div class="ph-sub">${fmt(c.km)} км · ${c.color} · из ${c.from} · VIN ${c.vin}</div></div>
   <span class="badge ${c.st==='В наличии'?'g':c.st==='Резерв'?'a':''}">${c.st}</span></div>
   <div class="kv"><span>Цена продажи</span><b class="mono">${tg(c.price)}</b></div>
   <div class="kv"><span>Закуп и расходы</span><b class="mono">${tg(c.buy+c.cost)}</b></div>
   <div class="kv"><span>Маржа по этой машине</span><b class="mono" style="color:var(--green)">${tg(marg(c))}</b></div>
   <div class="note" style="--tone:var(--acc)"><b>Маржу видит только руководитель</b><p>У менеджера в карточке эта строка скрыта — он видит цену и минимальный порог для торга.</p></div>
  </div>`:`<div class="note" style="--tone:var(--amber)"><b>Авто ещё не подобрано</b><p>Менеджер выбирает машину из наличия — тогда в сделке появятся цена, фото и VIN.</p></div>`}
  <div class="btns"><button class="btn acc" onclick="toast('Звонок через IP-телефонию пошёл. Разговор записывается и прикрепится к сделке.')">☎ Позвонить</button>
  <button class="btn" onclick="toast('Сообщение отправлено с номера менеджера в WhatsApp.')">Написать в WhatsApp</button>
  <button class="btn" onclick="dealVisit(${id})">Записать на визит</button></div>`}
 if(dTab===1){body=`<div class="panel">
  ${d.chat.length?d.chat.map(m=>`<div class="msg ${m[3]==='in'?'in':''}"><div class="mh"><b>${esc(m[0])}</b><time>${m[2]}</time></div><p>${esc(m[1])}</p></div>`).join(''):'<p class="mini">Переписки пока нет.</p>'}
  <div style="display:flex;gap:7px;margin-top:9px"><input class="search" style="flex:1" id="dmsg" placeholder="Написать клиенту…" onkeydown="if(event.key==='Enter')dealMsg(${id})">
  <button class="btn acc" onclick="dealMsg(${id})">Отправить</button></div>
  <div class="note" style="--tone:var(--wa)"><b>С номера менеджера, но в системе</b><p>У каждого менеджера свой номер WhatsApp — клиент видит живого человека, а компания видит всю переписку. Менеджер ушёл — история осталась.</p></div></div>`}
 if(dTab===2){body=`
  ${d.calls.length?d.calls.map((c2,i)=>`<div class="player">
   <div class="pl-h"><b>${c2[0]==='вх'?'Входящий':'Исходящий'} · ${c2[1]}</b><span class="badge ${c2[4]>=8?'g':c2[4]>=6?'a':'r'}">оценка ${c2[4]} из 10</span></div>
   <div class="wave">${Array.from({length:44},(_,j)=>`<i class="${j<14?'on':''}" style="height:${18+Math.abs(Math.sin(j*0.7))*70}%"></i>`).join('')}</div>
   <div class="pl-c"><button class="pl-btn" onclick="playCall()">▶</button>
    <span class="pl-t">0:41 / ${c2[2]}</span>
    <span class="mini" style="margin-left:auto">менеджер ${c2[3]}</span></div>
  </div>`).join(''):'<p class="mini">Звонков по этой сделке ещё не было.</p>'}
  <div class="panel"><div class="ph-title">Зачем записи руководителю</div>
   <div class="note" style="--tone:var(--acc)"><b>Слышно, как на самом деле говорят с клиентом</b><p>Не «менеджер сказал, что клиент дорогой», а конкретный разговор: выяснил ли бюджет, предложил ли рассрочку, пригласил ли в салон. Разбор занимает минуту вместо часовой планёрки.</p></div>
   <div class="note" style="--tone:var(--blue)"><b>Отдельно колл-центр, отдельно менеджеры</b><p>Оператор принимает первичные звонки с рекламного номера, менеджеры работают со своими линиями. В отчёте это разные группы.</p></div>
  </div>`}
 if(dTab===3){body=`<div class="panel"><div class="ph"><div><div class="ph-title">Заявка в банки</div>
   <div class="ph-sub">одна анкета уходит сразу в несколько банков</div></div>
   <span class="badge ${d.bank.sent?'g':''}">${d.bank.sent?'отправлена':'не отправлена'}</span></div>
   ${d.bank.ans.length?`<div class="tw"><table class="data"><thead><tr><th>Банк</th><th>Ответ</th><th class="right">Одобренная сумма</th></tr></thead><tbody>
   ${d.bank.ans.map(a=>`<tr style="cursor:default"><td><b>${a[0]}</b></td>
    <td><span class="badge ${a[1]==='Одобрено'?'g':a[1]==='Отказ'?'r':'a'}">${a[1]}</span></td>
    <td class="right mono">${a[2]?tg(a[2]):'—'}</td></tr>`).join('')}
   </tbody></table></div>
   <div class="kv" style="margin-top:9px"><span>Лучшее предложение</span><b class="mono">${(()=>{const b=d.bank.ans.filter(a=>a[2]).sort((x,y)=>y[2]-x[2])[0];return b?b[0]+' · '+tg(b[2]):'ждём ответы'})()}</b></div>
   <div class="kv"><span>Хватает на выбранное авто</span><b>${(()=>{const b=d.bank.ans.filter(a=>a[2]).sort((x,y)=>y[2]-x[2])[0];if(!b||!c)return '—';
    return b[2]+d.first>=c.price?'<span style="color:var(--green)">да, с первым взносом '+tg(d.first)+'</span>':'<span style="color:var(--red)">нет, не хватает '+tg(c.price-b[2]-d.first)+'</span>'})()}</b></div>`
   :`<p class="mini">Заявка ещё не отправлена.</p>`}
   <div class="btns" style="margin-top:9px"><button class="btn acc" onclick="sendBank(${id})">Отправить в банки</button>
   <button class="btn" onclick="toast('Клиенту отправлен расчёт: сумма, первый взнос и ежемесячный платёж по каждому банку.')">Отправить расчёт клиенту</button></div>
  </div>
  <div class="note" style="--tone:var(--acc)"><b>Почему это в системе</b><p>Клиент выбирает машину не по цене, а по одобренной сумме. Когда одобрения лежат в карточке, менеджер сразу предлагает то авто, которое клиент реально может взять, — и не тратит неделю на переписку по машине, которую банк не одобрит.</p></div>`}
 if(dTab===4){body=`<div class="panel" style="padding:0"><div class="tw"><table class="data"><thead><tr><th>Документ</th><th>Статус</th><th>Когда</th></tr></thead><tbody>
  ${[['Договор купли-продажи',d.st==='done'?'подписан':d.st==='deposit'?'готов к подписанию':'—'],
     ['Квитанция на аванс',d.st==='deposit'||d.st==='done'?'оплачено 300 000 ₸':'—'],
     ['Заявка в банк',d.bank.sent?'отправлена':'—'],
     ['Акт приёма-передачи',d.st==='done'?'подписан':'—'],
     ['Договор комиссии / trade-in','по необходимости']]
   .map(r=>`<tr onclick="toast('Документ формируется из карточки: данные клиента, авто, VIN и сумма подставляются автоматически.')">
   <td><b>${r[0]}</b></td><td><span class="badge ${r[1].includes('подписан')||r[1].includes('оплачено')?'g':r[1]==='—'?'':'a'}">${r[1]}</span></td>
   <td class="mono">${r[1]==='—'?'—':'31.08.2026'}</td></tr>`).join('')}
  </tbody></table></div></div>
  <div class="note" style="--tone:var(--acc)"><b>Документы печатаются из сделки</b><p>Данные клиента, авто и VIN подставляются автоматически — не нужно набирать договор в Word и проверять, не перепутали ли номер кузова.</p></div>`}
 openD(`Сделка №${d.id} · ${esc(d.cl)}`,`${stName(d.st)} · ${SRC[d.src][0]} · менеджер ${d.mgr}`,tabs.map((t,i)=>[t,`openDeal(${id},${i})`,i===dTab]),body)}
function dealMsg(id){const el=document.getElementById('dmsg');const v=el.value.trim();if(!v)return;
 DEALS.find(x=>x.id===id).chat.push([ROLES[role].n,v,'сейчас','']);openDeal(id,1);
 toast('Сообщение отправлено клиенту в WhatsApp с номера менеджера.')}
function playCall(){toast('▶ Запись разговора воспроизводится. Можно слушать с любого места, ускорять и оставлять комментарии для разбора с менеджером.')}
function sendBank(id){const d=DEALS.find(x=>x.id===id);d.bank.sent=1;
 d.bank.ans=[['БЦК','Одобрено',9800000],['Шинхан','На рассмотрении',0],['Freedom','Одобрено',8600000],['Bereke','Отказ',0]];
 openDeal(id,3);sparks();
 toast('Анкета отправлена в <b>4 банка одновременно</b>. Ответы приходят в карточку — менеджеру не нужно обзванивать банки и вести таблицу.')}
function dealVisit(id){const d=DEALS.find(x=>x.id===id);
 VISITS.unshift({id:'В-'+(2095+VISITS.length),cl:d.cl,deal:d.id,mgr:d.mgr,when:'завтра 15:00',st:'Ожидается',car:d.car,res:''});
 if(d.st==='new'||d.st==='call')d.st='meet';
 closeD();go('visits');sparks();
 toast('Клиент записан на визит. За два часа до встречи ему автоматически уйдёт напоминание с адресом салона.')}
function newDeal(){openD('Новая сделка','Клиент, источник и авто',[],
 `<div class="f2"><div class="fld"><label>Имя клиента</label><input id="ndC" placeholder="Ерасыл Т."></div>
  <div class="fld"><label>Телефон</label><input id="ndP" value="+7 7"></div></div>
  <div class="f2"><div class="fld"><label>Источник</label><select id="ndS">${Object.entries(SRC).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join('')}</select></div>
  <div class="fld"><label>Менеджер</label><select id="ndM">${MGR.map(m=>`<option>${m}</option>`).join('')}</select></div></div>
  <div class="f2"><div class="fld"><label>Интересует авто</label><select id="ndA"><option value="">— пока не выбрано —</option>${CARS.filter(c=>c.st!=='Продан').map(c=>`<option value="${c.id}">${c.n} · ${c.y}</option>`).join('')}</select></div>
  <div class="fld"><label>Бюджет, ₸</label><input id="ndB" value="12000000" inputmode="numeric"></div></div>
  <div class="btns"><button class="btn acc" onclick="saveDeal()">Создать сделку</button><button class="btn" onclick="closeD()">Отмена</button></div>`)}
function saveDeal(){const cl=document.getElementById('ndC').value.trim()||'Новый клиент';
 DEALS.unshift({id:dealSeq++,st:'new',cl,ph:document.getElementById('ndP').value,src:document.getElementById('ndS').value,
  mgr:document.getElementById('ndM').value,car:document.getElementById('ndA').value,
  budget:parseInt(document.getElementById('ndB').value)||10000000,first:2500000,due:'сегодня 18:00',note:'',chat:[],calls:[],bank:{sent:0,ans:[]}});
 closeD();render();sparks();toast('Сделка создана и встала в воронку на этап «Новое обращение».')}

/* --- МОИ СДЕЛКИ --- */
SC.my=()=>{const list=DEALS.filter(d=>d.mgr===(ROLES[role].n==='Ельжан'?'Арман':ROLES[role].n));
 return `<div class="head"><div><h2>Мои сделки</h2><p>Рабочий экран менеджера: что горит сегодня, кто ждёт звонка и у кого назначен визит.</p></div>
 <div class="btns"><button class="btn acc" onclick="newDeal()">+ Сделка</button></div></div>
 <div class="strip">
  <div><small>В РАБОТЕ</small><b>${list.filter(d=>d.st!=='done').length}</b><span>сделок</span></div>
  <div><small>ВИЗИТОВ СЕГОДНЯ</small><b class="c">1</b><span>в 16:00</span></div>
  <div><small>ЖДУТ ОТВЕТА БАНКА</small><b class="a">${list.filter(d=>d.st==='bank').length}</b><span>напомнить клиенту</span></div>
  <div><small>ПРОДАЖ ЗА АВГУСТ</small><b class="g">4</b><span>49,2 млн ₸</span></div>
  <div><small>СРЕДНИЙ ОТВЕТ</small><b>2 мин</b><span>лучший в отделе</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:900px"><thead><tr>
  <th>Клиент</th><th>Этап</th><th>Авто</th><th class="right">Бюджет</th><th>Источник</th><th>Следующий шаг</th><th>Связь</th></tr></thead><tbody>
 ${list.map(d=>`<tr onclick="openDeal(${d.id})"><td><b>${esc(d.cl)}</b><div class="sub">${d.ph}</div></td>
  <td><span class="badge" style="background:${stColor(d.st)}22;color:${stColor(d.st)}">${stName(d.st)}</span></td>
  <td class="mini">${d.car?esc(car(d.car).n):'—'}</td>
  <td class="right mono">${mln(d.budget)} млн</td>
  <td class="mini">${SRC[d.src][0]}</td>
  <td class="mono">${d.due}</td>
  <td><span class="badge">${d.calls.length} звонк.</span> <span class="badge">${d.chat.length} сообщ.</span></td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint"><b>Менеджеру не нужно вести свою таблицу.</b> Всё, что он делал — звонки, переписка, визиты — уже записано системой. Освобождается время, которое обычно уходит на «занесение в отчёт».</div>`};

/* --- ЗВОНКИ --- */
let callFilter='all';
SC.calls=()=>{const list=callFilter==='all'?CALLS:callFilter==='miss'?CALLS.filter(c=>c.dur==='0:00'):CALLS.filter(c=>c.score&&c.score<7);
 return `<div class="head"><div><h2>Звонки и записи</h2><p>Каждый разговор записывается и попадает в карточку клиента. Можно послушать, поставить оценку по скрипту и разобрать с менеджером — не по памяти, а по факту.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Выгрузка журнала звонков за период в Excel: кто, кому, сколько говорил, чем закончилось.')">Выгрузить</button></div></div>
 <div class="strip">
  <div><small>ЗВОНКОВ СЕГОДНЯ</small><b>47</b><span>вх. 31 · исх. 16</span></div>
  <div><small>ПРОПУЩЕННЫХ</small><b class="r">1</b><span>задача поставлена автоматически</span></div>
  <div><small>СРЕДНИЙ ОТВЕТ</small><b class="g">14 сек</b><span>до поднятия трубки</span></div>
  <div><small>СРЕДНИЙ РАЗГОВОР</small><b>3:24</b><span>по отделу продаж</span></div>
  <div><small>СРЕДНЯЯ ОЦЕНКА</small><b class="a">7,0</b><span>по чек-листу скрипта</span></div>
 </div>
 <div class="filters">
  <button class="filter ${callFilter==='all'?'on':''}" onclick="callFilter='all';render()">Все звонки</button>
  <button class="filter ${callFilter==='miss'?'on':''}" onclick="callFilter='miss';render()">Пропущенные</button>
  <button class="filter ${callFilter==='bad'?'on':''}" onclick="callFilter='bad';render()">Слабые разговоры</button>
 </div>
 <div class="g21">
  <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:820px"><thead><tr>
   <th>Когда</th><th>Тип</th><th>Клиент и номер</th><th>Менеджер</th><th class="right">Длительность</th><th class="right">Ответ</th><th>Оценка</th></tr></thead><tbody>
  ${list.map(c=>`<tr onclick="openCall(${c.id})"><td class="mono">${c.when}</td>
   <td><span class="badge ${c.dur==='0:00'?'r':c.t==='вх'?'b':'v'}">${c.dur==='0:00'?'пропущен':c.t==='вх'?'входящий':'исходящий'}</span></td>
   <td><b>${esc(c.cl)}</b><div class="sub mono">${c.ph}</div></td>
   <td class="mini">${c.mgr}</td>
   <td class="right mono">${c.dur}</td>
   <td class="right mono">${c.ans?c.ans+' сек':'—'}</td>
   <td>${c.score?`<span class="badge ${c.score>=8?'g':c.score>=6?'a':'r'}">${c.score} из 10</span>`:'—'}</td></tr>`).join('')}
  </tbody></table></div></div>
  <div>
   <div class="panel"><div class="ph-title">Что даёт прослушивание</div>
    <div class="note" style="--tone:var(--acc)"><b>Видно реальную работу</b><p>Менеджер говорит «клиенты дорогие и не берут» — вы открываете три записи и слышите, что он не выяснял бюджет и не звал в салон. Разговор с сотрудником становится предметным.</p></div>
    <div class="note" style="--tone:var(--blue)"><b>Обучение новых</b><p>Лучшие разговоры собираются в подборку и дают новичкам вместо теории. Обучение сокращается с недель до дней.</p></div>
    <div class="note" style="--tone:var(--green)"><b>Спорные ситуации</b><p>«Мне обещали другую цену» — открываем запись и слушаем, что именно было сказано. Вопрос закрывается за минуту.</p></div>
   </div>
   <div class="panel"><div class="ph-title">Чек-лист разговора</div>
    <p class="mini" style="margin-bottom:8px">По нему система и руководитель оценивают звонок:</p>
    ${['Поздоровался и представился','Выяснил, какую машину ищет','Спросил бюджет и первый взнос','Рассказал про рассрочку и банки','Пригласил в салон и назвал время','Записал контакт и договорился о шаге']
      .map(t=>`<div class="chk ev on"><i>✓</i><span>${t}</span></div>`).join('')}
   </div>
  </div>
 </div>`};
function openCall(id){const c=cl2(id);
 openD(`Звонок · ${esc(c.cl)}`,`${c.when} · ${c.mgr} · ${c.dur}`,[],
 `<div class="player">
   <div class="pl-h"><b>${c.t==='вх'?'Входящий':'Исходящий'} · ${c.ph}</b>
    ${c.score?`<span class="badge ${c.score>=8?'g':c.score>=6?'a':'r'}">оценка ${c.score} из 10</span>`:'<span class="badge r">пропущен</span>'}</div>
   <div class="wave">${Array.from({length:52},(_,j)=>`<i class="${j<18?'on':''}" style="height:${16+Math.abs(Math.sin(j*0.8))*74}%"></i>`).join('')}</div>
   <div class="pl-c"><button class="pl-btn" onclick="playCall()">▶</button><span class="pl-t">0:38 / ${c.dur}</span>
    <button class="btn" style="margin-left:auto" onclick="toast('Скорость воспроизведения 1,5× — разбор десяти звонков занимает пятнадцать минут.')">1,5×</button></div>
  </div>
  <div class="panel">
   <div class="kv"><span>Клиент</span><b>${esc(c.cl)} · ${c.ph}</b></div>
   <div class="kv"><span>Менеджер</span><b>${c.mgr}</b></div>
   <div class="kv"><span>Ответили через</span><b class="mono">${c.ans?c.ans+' секунд':'не ответили'}</b></div>
   <div class="kv"><span>Отметки</span><b>${c.tags.map(t=>`<span class="badge ${t.includes('не ')||t==='пропущенный'?'r':'c'}">${t}</span>`).join(' ')}</b></div>
   <div class="kv"><span>Комментарий руководителя</span><b style="max-width:62%;font-weight:600">${esc(c.note)}</b></div>
  </div>
  <div class="panel"><div class="ph-title">Оценка по чек-листу</div>
   ${[['Поздоровался и представился',1],['Выяснил, какую машину ищет',c.score>=6?1:0],['Спросил бюджет и первый взнос',c.score>=7?1:0],
      ['Рассказал про рассрочку и банки',c.score>=7?1:0],['Пригласил в салон и назвал время',c.score>=8?1:0],['Договорился о следующем шаге',c.score>=8?1:0]]
    .map(r=>`<div class="chk ev ${r[1]?'on':''}"><i>${r[1]?'✓':''}</i><span>${r[0]}</span></div>`).join('')}
  </div>
  <div class="btns">${c.deal?`<button class="btn acc" onclick="closeD();openDeal(${c.deal})">Открыть сделку</button>`:''}
  <button class="btn" onclick="toast('Звонок добавлен в подборку для планёрки — послушаете вместе с менеджером.')">В подборку для разбора</button>
  <button class="btn" onclick="toast('Задача поставлена менеджеру: перезвонить клиенту и пригласить в салон.')">Поставить задачу</button></div>`)}

/* --- ВИЗИТЫ --- */
SC.visits=()=>{const done=VISITS.filter(v=>v.st!=='Ожидается');const came=done.filter(v=>v.st==='Пришёл');
 return `<div class="head"><div><h2>Визиты в салон</h2><p>Вы сказали главное: если клиент доехал до салона — сделка почти состоялась. Поэтому визит — отдельный объект в системе: назначили, напомнили, отметили приход и записали результат.</p></div>
 <div class="btns"><button class="btn acc" onclick="newVisit()">+ Записать на визит</button></div></div>
 <div class="strip">
  <div><small>ЗАПИСАНО НА НЕДЕЛЮ</small><b>${VISITS.length}</b><span>встреч в салоне</span></div>
  <div><small>ДОШЛИ</small><b class="g">${came.length} из ${done.length}</b><span>доходимость ${Math.round(came.length/done.length*100)}%</span></div>
  <div><small>НЕ ДОШЛИ</small><b class="r">${done.filter(v=>v.st==='Не пришёл').length}</b><span>каждый — потраченная реклама</span></div>
  <div><small>ИЗ ВИЗИТА В ПОКУПКУ</small><b class="c">48%</b><span>по данным августа</span></div>
  <div><small>НАПОМИНАНИЕ</small><b>за 2 часа</b><span>уходит в WhatsApp автоматически</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:920px"><thead><tr>
  <th>Визит</th><th>Клиент</th><th>Когда</th><th>Менеджер</th><th>Авто</th><th>Статус</th><th>Результат встречи</th></tr></thead><tbody>
 ${VISITS.map(v=>`<tr onclick="openVisit('${v.id}')"><td class="mono"><b>${v.id}</b></td>
  <td><b>${esc(v.cl)}</b></td><td class="mono">${v.when}</td><td class="mini">${v.mgr}</td>
  <td class="mini">${v.car?esc(car(v.car).n):'—'}</td>
  <td><span class="badge ${v.st==='Пришёл'?'g':v.st==='Не пришёл'?'r':'a'}">${v.st}</span></td>
  <td class="mini">${esc(v.res)||'—'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Доходимость по менеджерам</div>
   <p class="mini" style="margin-bottom:9px">Назначить встречу может каждый. Довести клиента до салона — умеют по-разному.</p>
   ${[['Дана',86,'6 из 7'],['Арман',71,'5 из 7'],['Ерлан',50,'3 из 6']].map(m=>
    `<div class="fr" style="grid-template-columns:100px 1fr 96px"><span>${m[0]}</span>
    <div class="bar"><i style="--w:${m[1]}%;background:${m[1]>75?'var(--green)':m[1]>60?'var(--acc)':'var(--red)'}"></i></div>
    <b>${m[1]}% · ${m[2]}</b></div>`).join('')}
   <div class="note" style="--tone:var(--acc)"><b>Что с этим делать</b><p>У Ерлана доходимость вдвое ниже. Открываете его звонки, слушаете, как он назначает встречу, — и проблема решается обучением, а не увольнением.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Почему клиенты не доезжают</div>
   ${[['Не напомнили о встрече',34],['Нашёл машину в другом салоне',28],['Не одобрил банк',21],['Передумал / отложил покупку',17]].map(r=>
    `<div class="fr" style="grid-template-columns:210px 1fr 42px"><span>${r[0]}</span><div class="bar"><i style="--w:${r[1]}%"></i></div><b>${r[1]}%</b></div>`).join('')}
   <div class="note" style="--tone:var(--green)"><b>Первую причину система закрывает сама</b><p>Автоматическое напоминание в WhatsApp за 2 часа до встречи с адресом и картой. Это самый дешёвый способ поднять продажи — вы уже заплатили за этих клиентов.</p></div>
  </div>
 </div>`};
function openVisit(id){const v=VISITS.find(x=>x.id===id);const c=v.car?car(v.car):null;
 openD(`Визит ${v.id}`,`${esc(v.cl)} · ${v.when} · ${v.mgr}`,[],
 `<div class="chain">
   <div class="st done"><code>1</code><b>Назначен</b><small>записан менеджером</small></div>
   <div class="st ${v.st!=='Ожидается'?'done':'now'}"><code>2</code><b>Напоминание</b><small>WhatsApp за 2 часа</small></div>
   <div class="st ${v.st==='Пришёл'?'done':v.st==='Не пришёл'?'':'now'}"><code>3</code><b>Пришёл в салон</b><small>отметка при встрече</small></div>
   <div class="st ${v.res.includes('аванс')||v.res.includes('Купила')?'done':''}"><code>4</code><b>Результат</b><small>тест-драйв, аванс, покупка</small></div>
  </div>
  <div class="panel">
   <div class="kv"><span>Клиент</span><b>${esc(v.cl)}</b></div>
   <div class="kv"><span>Время визита</span><b>${v.when}</b></div>
   <div class="kv"><span>Менеджер</span><b>${v.mgr}</b></div>
   <div class="kv"><span>Авто к показу</span><b>${c?esc(c.n)+' · '+c.y:'подбирается на месте'}</b></div>
   <div class="kv"><span>Статус</span><b><span class="badge ${v.st==='Пришёл'?'g':v.st==='Не пришёл'?'r':'a'}">${v.st}</span></b></div>
   ${v.res?`<div class="kv"><span>Результат</span><b style="max-width:60%;font-weight:600">${esc(v.res)}</b></div>`:''}
  </div>
  ${v.st==='Ожидается'?`<div class="btns"><button class="btn g" onclick="visitCame('${id}')">Клиент пришёл</button>
  <button class="btn r" onclick="visitMiss('${id}')">Не пришёл</button>
  <button class="btn" onclick="toast('Напоминание отправлено клиенту в WhatsApp: время, адрес салона и телефон менеджера.')">Напомнить сейчас</button></div>`
  :`<div class="note" style="--tone:${v.st==='Пришёл'?'var(--green)':'var(--red)'}"><b>${v.st==='Пришёл'?'Визит состоялся':'Клиент не доехал'}</b>
   <p>${v.st==='Пришёл'?'Результат записан в карточку и учтён в доходимости менеджера.':'Система поставила задачу перезвонить и предложить новое время — такие клиенты часто возвращаются, если про них не забыть.'}</p></div>`}
  ${v.deal?`<button class="btn acc" style="margin-top:9px" onclick="closeD();openDeal(${v.deal})">Открыть сделку</button>`:''}`)}
function visitCame(id){const v=VISITS.find(x=>x.id===id);v.st='Пришёл';v.res='Осмотр и тест-драйв';
 const d=DEALS.find(x=>x.id===v.deal);if(d&&['new','call','meet'].includes(d.st))d.st='visit';
 closeD();render();sparks();
 toast(`<b>${esc(v.cl)} пришёл в салон.</b> Доходимость менеджера ${v.mgr} пересчитана, сделка перешла на этап «Пришёл в салон».`)}
function visitMiss(id){const v=VISITS.find(x=>x.id===id);v.st='Не пришёл';v.res='Не приехал, поставлена задача перезвонить';
 TASKS.unshift({id:taskSeq++,col:'today',t:`Перезвонить ${v.cl} — не пришёл на встречу, предложить новое время`,who:v.mgr,due:'сегодня',pri:'высокий',deal:v.deal});
 closeD();render();
 toast('Отмечено «не пришёл». Система <b>сама поставила задачу</b> перезвонить и предложить другое время — клиент не потеряется.')}
function newVisit(){openD('Записать клиента на визит','Дата, время, менеджер и авто к показу',[],
 `<div class="f2"><div class="fld"><label>Клиент</label><input id="nvC" placeholder="Имя клиента"></div>
  <div class="fld"><label>Когда</label><input id="nvW" value="завтра 15:00"></div></div>
  <div class="f2"><div class="fld"><label>Менеджер</label><select id="nvM">${MGR.map(m=>`<option>${m}</option>`).join('')}</select></div>
  <div class="fld"><label>Авто к показу</label><select id="nvA"><option value="">— подберём на месте —</option>${CARS.filter(c=>c.st!=='Продан').map(c=>`<option value="${c.id}">${c.n} · ${c.y}</option>`).join('')}</select></div></div>
  <div class="note" style="--tone:var(--acc)"><b>Что произойдёт после записи</b><p>Клиенту сразу уйдёт подтверждение с адресом, а за 2 часа до встречи — напоминание. Менеджер получит задачу подготовить машину к показу.</p></div>
  <div class="btns"><button class="btn acc" onclick="saveVisit()">Записать</button><button class="btn" onclick="closeD()">Отмена</button></div>`)}
function saveVisit(){const cl=document.getElementById('nvC').value.trim()||'Новый клиент';
 VISITS.unshift({id:'В-'+(2095+VISITS.length),cl,deal:0,mgr:document.getElementById('nvM').value,when:document.getElementById('nvW').value,st:'Ожидается',car:document.getElementById('nvA').value,res:''});
 closeD();render();sparks();
 toast('Визит записан. Клиенту отправлено подтверждение с адресом салона, напоминание уйдёт за 2 часа до встречи.')}

/* --- WHATSAPP --- */
SC.wa=()=>`
 <div class="head"><div><h2>WhatsApp</h2><p>Переписка ведётся из системы. У каждого менеджера свой номер — клиент общается с живым человеком, а компания видит всю историю и не теряет её при увольнении.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Шаблоны сообщений: приглашение в салон, адрес, расчёт рассрочки, напоминание о визите, поздравление с покупкой.')">Шаблоны</button>
 <button class="btn acc" onclick="toast('Рассылка по базе: «поступили новые авто из Кореи» — только тем, кто интересовался этим классом и дал согласие.')">Рассылка по базе</button></div></div>
 <div class="strip">
  <div><small>ДИАЛОГОВ СЕГОДНЯ</small><b>38</b><span>по 5 номерам</span></div>
  <div><small>БЕЗ ОТВЕТА</small><b class="a">4</b><span>дольше 15 минут</span></div>
  <div><small>СРЕДНИЙ ОТВЕТ</small><b class="g">6 мин</b><span>по отделу</span></div>
  <div><small>СТОИМОСТЬ КАНАЛА</small><b>5 000 ₸</b><span>вместо 36 000 ₸ у Битрикса</span></div>
  <div><small>АВТООТВЕТ</small><b>4 сек</b><span>работает круглосуточно</span></div>
 </div>
 <div class="g21">
  <div class="panel" style="padding:0">
   <div style="padding:13px 15px;border-bottom:1px solid var(--line)"><div class="ph-title">Активные диалоги</div>
    <div class="ph-sub">руководитель видит переписку всех менеджеров</div></div>
   ${DEALS.filter(d=>d.chat.length).map(d=>{const last=d.chat[d.chat.length-1];
    return `<div style="padding:12px 15px;border-bottom:1px solid var(--line);cursor:pointer" onclick="openDeal(${d.id},1)">
     <div style="display:flex;justify-content:space-between;gap:10px"><b style="font-size:11.2px">${esc(d.cl)}</b>
      <span class="mini">${last[2]}</span></div>
     <p style="margin:4px 0 0;font-size:10.4px;color:var(--muted);line-height:1.5">${last[3]==='in'?'':'Вы: '}${esc(last[1].slice(0,86))}${last[1].length>86?'…':''}</p>
     <div style="margin-top:6px"><span class="badge">${d.mgr} · +7 707 44${d.id%10} ** **</span></div>
    </div>`}).join('')}
  </div>
  <div>
   <div class="panel"><div class="ph-title">Номера менеджеров</div>
    <p class="mini" style="margin-bottom:9px">Мы обсуждали это на встрече: реклама — на один номер, переписка — с личных номеров менеджеров.</p>
    <div class="kv"><span>Рекламный номер (входящие)</span><b class="mono">+7 727 *** ** 00</b></div>
    ${MGR.map((m,i)=>`<div class="kv"><span>${m}</span><b class="mono">+7 707 44${i+1} ** **</b></div>`).join('')}
    <div class="kv"><span>Колл-центр</span><b class="mono">+7 707 440 ** **</b></div>
    <div class="note" style="--tone:var(--amber)"><b>Почему номера лучше разделить</b><p>Если весь исходящий поток идёт с одного номера, клиенты жмут «спам» и номер блокируют. Разные номера у менеджеров снимают этот риск, а реклама остаётся на одном.</p></div>
   </div>
   <div class="panel"><div class="ph-title">Что уходит автоматически</div>
    ${[['Автоответ на первое сообщение','сразу'],['Подтверждение записи на визит','при записи'],['Напоминание о встрече','за 2 часа'],['Расчёт по банкам','после одобрения'],['Поздравление с покупкой','в день выдачи']]
     .map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}
   </div>
  </div>
 </div>`;

/* --- АВТО --- */
let carFilter='all';
SC.cars=()=>{const list=carFilter==='all'?CARS:carFilter==='stale'?CARS.filter(c=>c.days>25&&c.st!=='Продан'):CARS.filter(c=>c.st===carFilter);
 const stock=CARS.filter(c=>c.st!=='Продан');
 const boss=role==='Руководитель'||role==='Администратор';
 return `<div class="head"><div><h2>Авто в наличии</h2><p>Простой учёт машин на площадке — без сложного каталога, который пришлось бы вести каждый день. Здесь то, что реально нужно: что стоит, сколько вложено, сколько дней стоит и какая маржа.</p></div>
 <div class="btns"><button class="btn acc" onclick="toast('Карточка авто создаётся за минуту: марка, год, пробег, VIN, закуп и расходы. Фото подгружаются с телефона.')">+ Добавить авто</button></div></div>
 <div class="strip">
  <div><small>В НАЛИЧИИ</small><b>${CARS.filter(c=>c.st==='В наличии').length}</b><span>+ ${CARS.filter(c=>c.st==='Резерв').length} в резерве</span></div>
  <div><small>ВЛОЖЕНО В СКЛАД</small><b>${mln(stock.reduce((a,c)=>a+c.buy+c.cost,0))} млн ₸</b><span>закуп и подготовка</span></div>
  <div><small>ОЖИДАЕМАЯ МАРЖА</small><b class="g">${mln(stock.reduce((a,c)=>a+marg(c),0))} млн ₸</b><span>если продать по текущим ценам</span></div>
  <div><small>СРЕДНИЙ СРОК</small><b>${Math.round(stock.reduce((a,c)=>a+c.days,0)/stock.length)} дней</b><span>на площадке</span></div>
  <div><small>СТОЯТ ДОЛЬШЕ МЕСЯЦА</small><b class="r">${stock.filter(c=>c.days>25).length}</b><span>деньги заморожены</span></div>
 </div>
 <div class="filters">
  <button class="filter ${carFilter==='all'?'on':''}" onclick="carFilter='all';render()">Все · ${CARS.length}</button>
  <button class="filter ${carFilter==='В наличии'?'on':''}" onclick="carFilter='В наличии';render()">В наличии</button>
  <button class="filter ${carFilter==='Резерв'?'on':''}" onclick="carFilter='Резерв';render()">Резерв</button>
  <button class="filter ${carFilter==='stale'?'on':''}" onclick="carFilter='stale';render()">Стоят долго</button>
  <button class="filter ${carFilter==='Продан'?'on':''}" onclick="carFilter='Продан';render()">Проданы</button>
 </div>
 <div class="cargrid">
 ${list.map(c=>`<div class="carc" onclick="openCar('${c.id}')">
  <div class="carimg">🚗<span class="st badge ${c.st==='В наличии'?'g':c.st==='Резерв'?'a':''}">${c.st}</span></div>
  <div class="cb"><b>${esc(c.n)} · ${c.y}</b>
   <div class="sub">${fmt(c.km)} км · ${c.color} · из ${c.from}</div>
   <div class="pr">${fmt(c.price)} ₸</div>
   ${boss?`<div class="sub" style="margin-top:5px">маржа <b style="color:var(--green)">${fmt(marg(c))} ₸</b> · ${c.days} дн. на площадке</div>`
    :`<div class="sub" style="margin-top:5px">${c.days} дней на площадке</div>`}
  </div></div>`).join('')}
 </div>
 ${boss?`<div class="hint"><b>Маржу по машине видите только вы и партнёр.</b> У менеджера в карточке отображается цена и минимальная планка для торга — сколько вы заработали на конкретной машине, ему знать не нужно.</div>`:''}`};
function openCar(id){const c=car(id);const boss=role==='Руководитель'||role==='Администратор';
 const deals=DEALS.filter(d=>d.car===id);
 openD(`${esc(c.n)} · ${c.y}`,`${fmt(c.km)} км · ${c.color} · из ${c.from} · VIN ${c.vin}`,[],
 `<div class="strip" style="grid-template-columns:repeat(3,1fr)">
   <div><small>ЦЕНА ПРОДАЖИ</small><b>${fmt(c.price)} ₸</b><span>${c.st}</span></div>
   ${boss?`<div><small>ВЛОЖЕНО</small><b>${fmt(c.buy+c.cost)} ₸</b><span>закуп + подготовка</span></div>
   <div><small>МАРЖА</small><b class="g">${fmt(marg(c))} ₸</b><span>${Math.round(marg(c)/c.price*100)}% от цены</span></div>`
   :`<div><small>НА ПЛОЩАДКЕ</small><b>${c.days} дней</b><span>с момента поступления</span></div>
   <div><small>МИНИМАЛЬНАЯ ЦЕНА</small><b>${fmt(c.price-300000)} ₸</b><span>ниже — только с руководителем</span></div>`}
  </div>
  ${boss?`<div class="panel"><div class="ph-title">Экономика машины</div>
   <div class="kv"><span>Закуп</span><b class="mono">${tg(c.buy)}</b></div>
   <div class="kv"><span>Подготовка: ремонт, детейлинг, документы</span><b class="mono">${tg(c.cost)}</b></div>
   <div class="kv"><span>Цена продажи</span><b class="mono">${tg(c.price)}</b></div>
   <div class="kv"><span>Маржа</span><b class="mono" style="color:var(--green)">${tg(marg(c))}</b></div>
   <div class="kv"><span>Дней на площадке</span><b>${c.days}${c.days>25?' · деньги стоят слишком долго':''}</b></div>
  </div>`:''}
  <div class="panel"><div class="ph-title">Кто интересовался</div>
   ${deals.length?deals.map(d=>`<div class="kv" style="cursor:pointer" onclick="closeD();openDeal(${d.id})">
    <span>${esc(d.cl)} · ${d.mgr}</span><b>${stName(d.st)}</b></div>`).join(''):'<p class="mini">Пока никто не интересовался этой машиной.</p>'}
   ${c.days>25?`<div class="note" style="--tone:var(--red)"><b>Машина стоит ${c.days} дней</b><p>За это время интересовались ${deals.length} человека. Система предлагает: снизить цену, поднять в рекламе или предложить тем, у кого одобрен банк на эту сумму.</p></div>`:''}
  </div>
  <div class="btns"><button class="btn acc" onclick="toast('Карточка авто с фото и характеристиками отправлена клиенту в WhatsApp одним сообщением.')">Отправить клиенту</button>
  <button class="btn" onclick="toast('Авто зарезервировано за клиентом на 3 дня — другие менеджеры видят резерв и не предлагают её.')">Зарезервировать</button>
  ${boss?`<button class="btn" onclick="toast('Цена изменена. Изменение записано в журнал: кто, когда и на сколько.')">Изменить цену</button>`:''}</div>`)}

/* --- БАНКИ --- */
SC.credits=()=>{const list=DEALS.filter(d=>d.bank.sent);
 return `<div class="head"><div><h2>Заявки в банки</h2><p>Одна анкета уходит сразу во все банки, с которыми вы работаете. Ответы и суммы одобрения складываются в карточку — не нужно вести таблицу и обзванивать менеджеров банков.</p></div>
 <div class="btns"><button class="btn acc" onclick="toast('Анкета заполняется один раз из карточки клиента и отправляется во все подключённые банки.')">+ Новая заявка</button></div></div>
 <div class="strip">
  <div><small>ЗАЯВОК В РАБОТЕ</small><b>${list.length}</b><span>по клиентам в воронке</span></div>
  <div><small>ОДОБРЕНО</small><b class="g">${list.reduce((a,d)=>a+d.bank.ans.filter(x=>x[1]==='Одобрено').length,0)}</b><span>ответов от банков</span></div>
  <div><small>НА РАССМОТРЕНИИ</small><b class="a">${list.reduce((a,d)=>a+d.bank.ans.filter(x=>x[1]==='На рассмотрении').length,0)}</b><span>ждём ответ</span></div>
  <div><small>СРЕДНЕЕ ОДОБРЕНИЕ</small><b>9,5 млн ₸</b><span>по августу</span></div>
  <div><small>БАНКОВ ПОДКЛЮЧЕНО</small><b>${BANKS.length}</b><span>${BANKS.slice(0,3).join(', ')} и другие</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:940px"><thead><tr>
  <th>Клиент</th><th>Авто</th><th class="right">Нужно</th><th class="right">Первый взнос</th><th>Ответы банков</th><th class="right">Лучшее одобрение</th><th>Хватает</th></tr></thead><tbody>
 ${list.map(d=>{const best=d.bank.ans.filter(a=>a[2]).sort((x,y)=>y[2]-x[2])[0];const c=d.car?car(d.car):null;
  const ok=best&&c&&(best[2]+d.first>=c.price);
  return `<tr onclick="openDeal(${d.id},3)"><td><b>${esc(d.cl)}</b><div class="sub">${d.mgr}</div></td>
  <td class="mini">${c?esc(c.n):'—'}</td>
  <td class="right mono">${c?fmt(c.price):'—'}</td>
  <td class="right mono">${fmt(d.first)}</td>
  <td>${d.bank.ans.map(a=>`<span class="badge ${a[1]==='Одобрено'?'g':a[1]==='Отказ'?'r':'a'}">${a[0]}</span>`).join(' ')}</td>
  <td class="right mono">${best?fmt(best[2]):'—'}</td>
  <td>${c?(ok?'<span class="badge g">да</span>':'<span class="badge r">не хватает</span>'):'—'}</td></tr>`}).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Одобрения по банкам за август</div>
   ${[['Шинхан',72,'var(--green)'],['БЦК',64,'var(--acc)'],['Freedom',58,'var(--blue)'],['Bereke',41,'var(--violet)'],['Home Credit',38,'var(--cyan)'],['Микрофинанс',86,'var(--amber)']].map(b=>
    `<div class="fr" style="grid-template-columns:120px 1fr 46px"><span>${b[0]}</span><div class="bar"><i style="--w:${b[1]}%;background:${b[2]}"></i></div><b>${b[1]}%</b></div>`).join('')}
   <div class="note" style="--tone:var(--acc)"><b>Куда подавать в первую очередь</b><p>Видно, какой банк чаще одобряет ваших клиентов и на какие суммы. Менеджер перестаёт подавать «во все подряд» и экономит время клиента.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Подбор авто под одобренную сумму</div>
   <p class="mini" style="margin-bottom:9px">Клиенту одобрили 9,8 млн ₸ и у него 3 млн первого взноса. Система сразу показывает, что он может забрать сегодня:</p>
   ${CARS.filter(c=>c.st==='В наличии'&&c.price<=12800000).slice(0,4).map(c=>
    `<div class="kv" style="cursor:pointer" onclick="openCar('${c.id}')"><span>${esc(c.n)} · ${c.y}</span><b class="mono">${fmt(c.price)} ₸</b></div>`).join('')}
   <div class="note" style="--tone:var(--green)"><b>Так продажа не срывается</b><p>Клиент выбирает не по мечте, а по одобренной сумме. Менеджер сразу предлагает подходящие машины — вместо недели переписки по авто, которое банк всё равно не пропустит.</p></div>
  </div>
 </div>`};

/* --- РЕКЛАМА --- */
SC.ads=()=>{const tot=ADS.reduce((a,x)=>({spend:a.spend+x.spend,leads:a.leads+x.leads,visits:a.visits+x.visits,deals:a.deals+x.deals}),{spend:0,leads:0,visits:0,deals:0});
 return `<div class="head"><div><h2>Реклама и источники</h2><p>Сколько потратили на каждый канал и что он реально принёс — не «лиды», а визиты в салон и проданные машины. Считается автоматически: источник фиксируется в момент обращения.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Выгрузка по кампаниям за период с расходом, лидами, визитами и продажами.')">Выгрузить</button></div></div>
 <div class="strip">
  <div><small>РАСХОД НА РЕКЛАМУ</small><b>${fmt(tot.spend)} ₸</b><span>за август</span></div>
  <div><small>ОБРАЩЕНИЙ</small><b>${tot.leads}</b><span>цена лида ${fmt(tot.spend/tot.leads)} ₸</span></div>
  <div><small>ДОШЛИ ДО САЛОНА</small><b class="c">${tot.visits}</b><span>цена визита ${fmt(tot.spend/tot.visits)} ₸</span></div>
  <div><small>ПРОДАЖ</small><b class="g">${tot.deals}</b><span>цена продажи ${fmt(tot.spend/tot.deals)} ₸</span></div>
  <div><small>МАРЖА С ПРОДАЖ</small><b class="g">21,8 млн ₸</b><span>реклама окупилась в 22 раза</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:940px"><thead><tr>
  <th>Кампания или канал</th><th class="right">Расход</th><th class="right">Обращений</th><th class="right">Цена лида</th><th class="right">Визитов</th><th class="right">Цена визита</th><th class="right">Продаж</th><th class="right">Цена продажи</th></tr></thead><tbody>
 ${ADS.map(a=>`<tr onclick="toast('Разрез по кампании: обращения по дням, менеджеры, какие машины интересовали и чем закончилось.')">
  <td><b>${esc(a.n)}</b></td>
  <td class="right mono">${a.spend?fmt(a.spend):'—'}</td>
  <td class="right mono">${a.leads}</td>
  <td class="right mono">${a.spend?fmt(a.spend/a.leads):'—'}</td>
  <td class="right mono">${a.visits}</td>
  <td class="right mono">${a.spend?fmt(a.spend/a.visits):'—'}</td>
  <td class="right mono"><b>${a.deals}</b></td>
  <td class="right mono" style="color:${a.spend&&a.spend/a.deals>80000?'var(--red)':'var(--green)'}">${a.spend?fmt(a.spend/a.deals):'—'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Что с этим делать</div>
   <div class="note" style="--tone:var(--green)"><b>«Авто из Кореи» работает лучше</b><p>Цена продажи 62 000 ₸ против 46 667 ₸ у кампании «Camry в рассрочку» — при этом средний чек выше. Бюджет стоит перераспределить.</p></div>
   <div class="note" style="--tone:var(--acc)"><b>Kolesa даёт мало лидов, но они горячие</b><p>Из 64 обращений 21 доехал до салона — доходимость 33% против 31% у Instagram, при этом лид дешевле.</p></div>
   <div class="note" style="--tone:var(--blue)"><b>Рекомендации ничего не стоят</b><p>19 обращений и 6 продаж без единого тенге расхода. Это повод системно просить отзывы и рекомендации у купивших.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Куда уходит рекламный бюджет</div>
   ${ADS.filter(a=>a.spend).map(a=>`<div class="fr" style="grid-template-columns:230px 1fr 84px"><span>${esc(a.n.split('·')[0])}</span>
    <div class="bar"><i style="--w:${a.spend/tot.spend*100}%"></i></div><b>${fmt(a.spend/1000)} тыс.</b></div>`).join('')}
   <div class="kv" style="margin-top:9px"><span>Расход на одну проданную машину</span><b class="mono">${fmt(tot.spend/tot.deals)} ₸</b></div>
   <div class="kv"><span>Средняя маржа с машины</span><b class="mono" style="color:var(--green)">1 980 000 ₸</b></div>
  </div>
 </div>`};

/* --- МЕНЕДЖЕРЫ --- */
SC.managers=()=>`
 <div class="head"><div><h2>Работа менеджеров</h2><p>Не «кто сколько продал», а вся цепочка: сколько взял обращений, как быстро отвечал, сколько встреч назначил, сколько клиентов довёл до салона и сколько машин продал.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Отчёт по менеджерам за период выгружен в Excel.')">Выгрузить</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:980px"><thead><tr>
  <th>Менеджер</th><th class="right">Обращений</th><th class="right">Звонков</th><th class="right">Ответ</th><th class="right">Оценка</th><th class="right">Встреч</th><th class="right">Дошли</th><th class="right">Продаж</th><th class="right">Выручка</th></tr></thead><tbody>
 ${[['Дана',54,182,'1 мин',8.6,7,6,5,62800000],['Арман',61,204,'2 мин',7.4,7,5,4,49200000],['Ерлан',38,121,'6 мин',6.1,6,3,2,25400000]].map(m=>
  `<tr onclick="toast('Карточка менеджера: его звонки с записями, сделки, встречи и динамика по неделям.')">
  <td><b>${m[0]}</b></td><td class="right mono">${m[1]}</td><td class="right mono">${m[2]}</td>
  <td class="right mono" style="color:${m[3]==='6 мин'?'var(--red)':'var(--green)'}">${m[3]}</td>
  <td class="right"><span class="badge ${m[4]>=8?'g':m[4]>=7?'a':'r'}">${num(m[4])}</span></td>
  <td class="right mono">${m[5]}</td>
  <td class="right mono">${m[6]} · ${Math.round(m[6]/m[5]*100)}%</td>
  <td class="right mono"><b>${m[7]}</b></td>
  <td class="right mono">${mln(m[8])} млн</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="g3">
  <div class="panel"><div class="ph-title">Скорость ответа</div>
   <p class="mini" style="margin-bottom:9px">Клиент, которому ответили за минуту, доезжает до салона вдвое чаще.</p>
   ${[['Дана','1 мин',96],['Арман','2 мин',88],['Ерлан','6 мин',42]].map(m=>
    `<div class="fr" style="grid-template-columns:84px 1fr 56px"><span>${m[0]}</span><div class="bar"><i style="--w:${m[2]}%;background:${m[2]>80?'var(--green)':'var(--red)'}"></i></div><b>${m[1]}</b></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Качество разговоров</div>
   <p class="mini" style="margin-bottom:9px">Средняя оценка по чек-листу за последние 20 звонков.</p>
   ${[['Дана',8.6],['Арман',7.4],['Ерлан',6.1]].map(m=>
    `<div class="fr" style="grid-template-columns:84px 1fr 56px"><span>${m[0]}</span><div class="bar"><i style="--w:${m[1]*10}%;background:${m[1]>=8?'var(--green)':m[1]>=7?'var(--acc)':'var(--red)'}"></i></div><b>${num(m[1])}</b></div>`).join('')}
   <button class="btn" style="width:100%;margin-top:9px" onclick="go('calls')">Послушать записи</button>
  </div>
  <div class="panel"><div class="ph-title">Вывод по отделу</div>
   <div class="note" style="--tone:var(--red)"><b>У Ерлана ответ 6 минут</b><p>И доходимость 50%. Клиенты успевают дозвониться в другой салон. Это не про лень — это про то, что он не видит обращения вовремя.</p></div>
   <div class="note" style="--tone:var(--green)"><b>У Даны стоит поучиться</b><p>Отвечает за минуту, оценка 8,6, доводит до салона 86% записанных. Её звонки — готовый материал для обучения новых менеджеров.</p></div>
  </div>
 </div>`;

/* --- КЛИЕНТЫ --- */
SC.clients=()=>`
 <div class="head"><div><h2>Клиенты</h2><p>Вся база с историей: когда обращался, что смотрел, приходил ли в салон, что одобрил банк и чем закончилось. По этой базе делаются повторные продажи и рекомендации.</p></div>
 <div class="btns"><input class="search" placeholder="Поиск по имени, номеру, авто…"><button class="btn acc" onclick="toast('Клиент добавлен вручную — например, тот, кто пришёл в салон без звонка.')">+ Клиент</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:900px"><thead><tr>
  <th>Клиент</th><th>Телефон</th><th>Источник</th><th>Менеджер</th><th>Интересовал</th><th>Статус</th><th>Последний контакт</th></tr></thead><tbody>
 ${DEALS.map(d=>`<tr onclick="openDeal(${d.id})"><td><b>${esc(d.cl)}</b></td><td class="mono">${d.ph}</td>
  <td class="mini">${SRC[d.src][0]}</td><td class="mini">${d.mgr}</td>
  <td class="mini">${d.car?esc(car(d.car).n):'—'}</td>
  <td><span class="badge" style="background:${stColor(d.st)}22;color:${stColor(d.st)}">${stName(d.st)}</span></td>
  <td class="mono">${d.chat.length?d.chat[d.chat.length-1][2]:d.calls.length?d.calls[d.calls.length-1][1]:'—'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint"><b>База — это ваш актив.</b> Через год у вас будет несколько тысяч человек, которые интересовались авто. Тем, кто не купил из-за банка, можно позвонить с новым предложением; тем, кто купил три года назад, — предложить обмен. Сейчас эти контакты живут в телефонах менеджеров и уходят вместе с ними.</div>`;

/* --- ЗАДАЧИ --- */
let dragTask=null;
SC.tasks=()=>`
 <div class="head"><div><h2>Задачи</h2><p>Перезвонить, подготовить машину к показу, собрать документы для банка. Часть задач система ставит сама — например, когда клиент не пришёл на встречу.</p></div>
 <div class="btns"><button class="btn acc" onclick="newTask()">+ Задача</button></div></div>
 <div class="board" style="grid-template-columns:repeat(3,1fr)">
 ${TCOLS.map(([k,name,color])=>{const l=TASKS.filter(t=>t.col===k);
  return `<div class="col" id="tc_${k}" ondragover="colOver(event,'tc_${k}')" ondragleave="colOut('tc_${k}')" ondrop="taskDrop('${k}')">
   <div class="col-h"><b style="color:${color}">${name}</b><span class="badge">${l.length}</span></div>
   ${l.map(t=>`<div class="kc" style="border-left:3px solid ${color}" draggable="true" ondragstart="dragTask=${t.id};this.classList.add('drag')" ondragend="this.classList.remove('drag')" onclick="${t.deal?`openDeal(${t.deal})`:`toast('Задача без привязки к сделке — обычное поручение по салону.')`}">
     <b>${esc(t.t)}</b>
     <div class="krow"><span>${t.who} · ${t.due}</span>${t.pri==='высокий'?'<span class="badge r">срочно</span>':''}</div>
    </div>`).join('')||'<p class="mini" style="padding:7px 2px">Пусто</p>'}
  </div>`}).join('')}
 </div>
 <div class="hint"><b>Задачи ставятся автоматически там, где обычно всё теряется:</b> пропущенный звонок, клиент не пришёл на встречу, банк одобрил и надо перезвонить, машина стоит больше месяца. Руководителю не нужно помнить об этом и напоминать вручную.</div>`;
function taskDrop(col){colOut('tc_'+col);if(!dragTask)return;const t=TASKS.find(x=>x.id===dragTask);
 if(t.col!==col){t.col=col;render();toast(col==='done'?'Задача выполнена.':`Задача перенесена в «${TCOLS.find(c=>c[0]===col)[1]}».`)}
 dragTask=null}
function newTask(){openD('Новая задача','Что сделать, кто и когда',[],
 `<div class="fld"><label>Что нужно сделать</label><input id="ntT" placeholder="Перезвонить клиенту и пригласить в салон"></div>
  <div class="f3"><div class="fld"><label>Кому</label><select id="ntW">${MGR.concat(['Аружан','Динара','Ельжан']).map(m=>`<option>${m}</option>`).join('')}</select></div>
  <div class="fld"><label>Срок</label><input id="ntD" value="сегодня 18:00"></div>
  <div class="fld"><label>Приоритет</label><select id="ntP"><option>обычный</option><option>высокий</option></select></div></div>
  <div class="btns"><button class="btn acc" onclick="saveTask()">Создать</button><button class="btn" onclick="closeD()">Отмена</button></div>`)}
function saveTask(){const t=document.getElementById('ntT').value.trim();if(!t)return toast('Опишите задачу.');
 TASKS.unshift({id:taskSeq++,col:'today',t,who:document.getElementById('ntW').value,due:document.getElementById('ntD').value,pri:document.getElementById('ntP').value,deal:0});
 closeD();render();sparks();toast('Задача создана и назначена — исполнитель получит уведомление.')}

/* --- НАСТРОЙКИ --- */
SC.stages=()=>`
 <div class="head"><div><h2>Этапы воронки</h2><p>Воронка настраивается под ваш процесс: этапы можно переименовать, добавить или убрать. Мы обсуждали на встрече — после аванса у вас сразу выдача, промежуточные этапы не нужны.</p></div>
 <div class="btns"><button class="btn acc" onclick="toast('Новый этап добавлен в воронку. Все сделки сохранятся, история этапов не потеряется.')">+ Этап</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:760px"><thead><tr>
  <th>№</th><th>Этап</th><th>Что означает</th><th>Автоматика</th><th>Норматив</th></tr></thead><tbody>
 ${[['НОВОЕ ОБРАЩЕНИЕ','Заявка пришла, менеджер её принял','Автоответ клиенту','ответ за 10 минут'],
    ['ДОЗВОН И КВАЛИФИКАЦИЯ','Поговорили, выяснили бюджет и что ищет','Запись разговора','дозвон в тот же день'],
    ['ВСТРЕЧА НАЗНАЧЕНА','Договорились о визите в салон','Напоминание за 2 часа','не дольше 2 дней'],
    ['ПРИШЁЛ В САЛОН','Клиент доехал, осмотр и тест-драйв','Отметка визита и доходимость','—'],
    ['ЗАЯВКА В БАНК','Анкета ушла в банки, ждём одобрение','Уведомление об ответе банка','ответ за 1 день'],
    ['АВАНС','Клиент внёс аванс, авто резервируется','Резерв авто и договор','—'],
    ['ВЫДАЧА','Подписан акт, ключи переданы','Авто снимается с площадки','—']]
  .map((r,i)=>`<tr onclick="toast('Этап открыт для настройки: название, цвет, автоматические действия и норматив по времени.')">
  <td class="mono">${i+1}</td><td><b>${r[0]}</b></td><td class="mini">${r[1]}</td>
  <td><span class="badge c">${r[2]}</span></td><td class="mini">${r[3]}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint"><b>Меняется без программиста.</b> Если завтра вы решите добавить этап «Трейд-ин» или «Оценка старой машины» — это делается в настройках за минуту, а не заявкой на доработку.</div>`;

SC.users=()=>`
 <div class="head"><div><h2>Пользователи</h2><p>Кто работает в системе, с каких номеров звонит и пишет, и что видит. Менеджер не видит маржу и чужих клиентов.</p></div>
 <div class="btns"><button class="btn acc" onclick="toast('Пользователь добавлен. Вход по номеру телефона с кодом — пароли не нужны.')">+ Сотрудник</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:900px"><thead><tr>
  <th>Сотрудник</th><th>Роль</th><th>Номер телефонии</th><th>WhatsApp</th><th>Видит маржу</th><th>Видит чужие сделки</th></tr></thead><tbody>
 ${[['Ельжан','Руководитель','+7 727 *** ** 00','—','да','да'],
    ['Партнёр','Руководитель','+7 727 *** ** 01','—','да','да'],
    ['Арман','Менеджер продаж','+7 707 441 ** **','+7 707 441 ** **','нет','нет'],
    ['Дана','Менеджер продаж','+7 707 442 ** **','+7 707 442 ** **','нет','нет'],
    ['Ерлан','Менеджер продаж','+7 707 443 ** **','+7 707 443 ** **','нет','нет'],
    ['Аружан','Колл-центр','+7 727 *** ** 00','+7 707 440 ** **','нет','да'],
    ['Динара','Кредитный специалист','—','—','нет','да']]
  .map(u=>`<tr onclick="toast('Права сотрудника открыты для настройки по каждому разделу отдельно.')">
  <td><b>${u[0]}</b></td><td class="mini">${u[1]}</td><td class="mono">${u[2]}</td><td class="mono">${u[3]}</td>
  <td>${u[4]==='да'?'<span class="badge g">да</span>':'<span class="badge r">нет</span>'}</td>
  <td>${u[5]==='да'?'<span class="badge g">да</span>':'<span class="badge r">нет</span>'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint"><b>Менеджер уходит — база остаётся.</b> Его номер переключается на другого сотрудника, вся переписка и записи звонков сохраняются в системе. Клиенты не уходят вместе с человеком.</div>`;

SC.integr=()=>`
 <div class="head"><div><h2>Интеграции</h2><p>Что подключается к системе и во сколько это обходится. Мы не берём процент — платите напрямую операторам.</p></div></div>
 <div class="g3">
 ${[['IP-телефония','Алтел или Kcell · пакет из 10 номеров','подключаем','входящие с рекламного номера, исходящие с номеров менеджеров, запись всех разговоров','var(--blue)'],
    ['WhatsApp','Казахстанский провайдер','5 000 ₸ за номер в месяц','переписка из системы, автоответы, напоминания о визите, шаблоны','var(--wa)'],
    ['Instagram и заявки с рекламы','Прямое подключение форм','входит','заявка падает в ленту с меткой кампании','var(--violet)'],
    ['Kolesa.kz','Заявки и звонки с площадки','входит','видно, какие объявления приносят обращения','var(--cyan)'],
    ['2GIS','Карточка организации','входит','звонки и заявки с карт с отдельной меткой','var(--amber)'],
    ['Банки','БЦК, Шинхан, Freedom, Bereke и другие','входит','анкета уходит сразу во все банки, ответы приходят в карточку','var(--green)']]
  .map(i=>`<div class="panel"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
   <div><div class="ph-title">${i[0]}</div><p class="mini" style="margin-top:3px">${i[1]}</p></div>
   <span class="badge ${i[2]==='входит'?'g':'c'}">${i[2]}</span></div>
   <div class="note" style="--tone:${i[4]};margin-top:9px"><p>${i[3]}</p></div></div>`).join('')}
 </div>
 <div class="panel"><div class="ph-title">Что вы платите после запуска</div>
  <div class="tw"><table class="data" style="min-width:640px"><thead><tr><th>Статья</th><th>Кому платите</th><th class="right">Сколько</th></tr></thead><tbody>
  ${[['Система','—','0 ₸ — она ваша'],['Сервер','хостингу','15 000–25 000 ₸ / мес'],['WhatsApp-номера','провайдеру','5 000 ₸ за номер'],['Телефония и номера','Алтел / Kcell','по их тарифу']]
   .map(r=>`<tr style="cursor:default"><td><b>${r[0]}</b></td><td class="mini">${r[1]}</td><td class="right mono">${r[2]}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="hint">Для сравнения: коробочная CRM с теми же интеграциями обойдётся примерно в <b>1 000 000 ₸ в год</b> — и через год вы не получите ни кода, ни системы, только следующий счёт.</div>
 </div>`;

SC.reports=()=>`
 <div class="head"><div><h2>Отчёты</h2><p>Любой срез выгружается в Excel за выбранный период. Данные берутся из работы менеджеров, а не собираются к планёрке вручную.</p></div></div>
 <div class="g3">
 ${[['Воронка за период','сколько обращений, встреч, визитов и продаж на каждом этапе','▦'],
    ['Работа менеджеров','звонки, скорость ответа, оценки, встречи, доходимость, продажи','★'],
    ['Реклама и источники','расход, лиды, цена визита и цена продажи по каждой кампании','◎'],
    ['Визиты в салон','кто записан, кто дошёл, кто купил, причины недоходов','⌖'],
    ['Авто и склад','что продано, что стоит долго, маржа по каждой машине','⛭'],
    ['Банки и одобрения','какой банк чаще одобряет и на какие суммы','₸'],
    ['Журнал звонков','все разговоры с длительностью, оценками и записями','☎'],
    ['Клиентская база','кто интересовался, что смотрел, чем закончилось','◉'],
    ['Прибыль за период','выручка, себестоимость авто, расход на рекламу, маржа','◪']]
  .map(r=>`<div class="panel" style="cursor:pointer" onclick="toast('Отчёт «${r[0]}» сформирован и выгружен в Excel.')">
   <div style="font-size:19px;color:var(--acc)">${r[2]}</div>
   <div class="ph-title" style="margin-top:7px">${r[0]}</div><p class="mini" style="margin-top:4px">${r[1]}</p></div>`).join('')}
 </div>`;

SC.audit=()=>`
 <div class="head"><div><h2>Журнал действий</h2><p>Кто что сделал в системе. Записи не удаляются — спорные ситуации решаются за минуту.</p></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:780px"><thead><tr>
  <th>Время</th><th>Кто</th><th>Объект</th><th>Что сделал</th></tr></thead><tbody>
 ${AUDIT.map(a=>`<tr style="cursor:default"><td class="mono">${a[0]}</td><td><b>${a[1]}</b></td>
  <td class="mono">${a[2]}</td><td class="mini">${a[3]}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint"><b>Частая история в автосалонах:</b> «клиенту пообещали цену на 300 тысяч ниже» или «кто снял машину с продажи». В журнале видно, кто и когда это сделал, а в записях звонков — что именно было сказано клиенту.</div>`;

/* ===== МЕХАНИКА ===== */
function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([n,r],i)=>
 `<button class="role" onclick="enter('${n}')"><code>0${i+1}</code><b>${n}</b><span>${r.note}</span></button>`).join('')}
function enter(n){role=n;const r=ROLES[n];
 document.getElementById('gate').classList.add('hidden');
 document.getElementById('app').classList.remove('hidden');
 document.getElementById('rav').textContent=r.av;
 document.getElementById('rname').textContent=r.n;
 document.getElementById('rrole').textContent=r.r;
 const sel=document.getElementById('rsel');
 sel.innerHTML=Object.keys(ROLES).map(x=>`<option ${x===n?'selected':''}>${x}</option>`).join('');
 sel.onchange=()=>enter(sel.value);
 if(!r.s.includes(cur))cur=r.s[0];
 buildNav();render();
 toast(`Роль <b>${n}</b> — так система выглядит у этого сотрудника. Разделы и данные ограничены его правами.`)}
function buildNav(){const al=ROLES[role].s;
 document.getElementById('nav').innerHTML=NAV.map(([g,items])=>{
  const av=items.filter(i=>al.includes(i[0]));if(!av.length)return '';
  return `<div class="nav-g">${g}</div>`+av.map(i=>
   `<a class="${cur===i[0]?'on':''}" onclick="go('${i[0]}')"><i>${i[1]}</i>${i[2]}${i[3]?`<span class="b">${i[3]}</span>`:''}</a>`).join('')}).join('')}
function go(s){if(!ROLES[role].s.includes(s)){const owner=Object.entries(ROLES).find(([n,r])=>r.s.includes(s));if(owner)enter(owner[0])}
 cur=s;buildNav();render();document.getElementById('content').scrollTop=0;
 try{const u=new URL(location.href);u.searchParams.set('s',s);history.replaceState(null,'',u.pathname+'?'+u.searchParams.toString())}catch(e){}}
function render(){document.getElementById('content').innerHTML=`<div class="screen">${SC[cur]?SC[cur]():'<p class="mini">Раздел в разработке.</p>'}</div>`;
 const t=TITLES[cur]||['',''];document.getElementById('ttl').textContent=t[0];document.getElementById('sub').textContent=t[1]}
function openD(t,s,tabs,body){document.getElementById('dt').textContent=t;document.getElementById('ds').textContent=s;
 document.getElementById('dtabs').innerHTML=(tabs||[]).map(x=>`<button class="dtab ${x[2]?'on':''}" onclick="${x[1]}">${x[0]}</button>`).join('');
 document.getElementById('db').innerHTML=body;document.getElementById('dbg').classList.add('show')}
function closeD(){document.getElementById('dbg').classList.remove('show')}
let tt;function toast(h){const el=document.getElementById('toast');el.innerHTML=h;el.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>el.classList.remove('show'),5200)}
function sparks(){const c=['#e0a63c','#f0bd5c','#3b82f6','#22c55e','#ffffff','#a78bfa'];
 for(let i=0;i<56;i++){const s=document.createElement('i');s.className='spark';
  s.style.cssText=`left:${Math.random()*100}vw;background:${c[i%6]};animation-delay:${Math.random()*.45}s;transform:rotate(${Math.random()*360}deg)`;
  document.body.appendChild(s);setTimeout(()=>s.remove(),2300)}}
function waPing(){toast('WhatsApp работает внутри системы: у каждого менеджера свой номер, вся переписка сохраняется в компании. <b>5 000 ₸ за номер</b> вместо 36 000 ₸ через Битрикс.')}
function telPing(){toast('IP-телефония: входящие с рекламного номера, исходящие с номеров менеджеров, <b>запись всех разговоров</b> и таймер скорости ответа.')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';try{localStorage.setItem('es-theme',theme)}catch(e){}applyTheme()}
function applyTheme(){document.body.classList.toggle('light',theme==='light');
 const b=document.getElementById('themeBtn');if(b)b.textContent=theme==='light'?'◑ Тёмная':'◐ Светлая'}
(function(){try{const t=localStorage.getItem('es-theme');if(t)theme=t}catch(e){}
 const q=new URLSearchParams(location.search).get('theme');if(q)theme=q;applyTheme()})();

/* ===== СЦЕНАРИЙ ===== */
const TOUR=[
 ['Оператор колл-центра','leads','<b>Шаг 1.</b> Все обращения — с Instagram, Kolesa, 2GIS и звонки с рекламного номера — падают в одну ленту с таймером ответа. Ничего не теряется в личных телефонах.',6200],
 ['Менеджер продаж','funnel','<b>Шаг 2.</b> Воронка под ваш процесс: от обращения до выдачи. Обратите внимание на отдельный этап «Пришёл в салон» — это ваша ключевая точка.',6400],
 ['Руководитель','calls','<b>Шаг 3.</b> Каждый разговор записан. Видно, кто как говорит с клиентом: выяснил ли бюджет, пригласил ли в салон. Оценка по чек-листу — 5 из 10 у одного из менеджеров.',6600],
 ['Руководитель','visits','<b>Шаг 4.</b> Визиты в салон отдельным разделом: кого записали, кто дошёл, кто купил. Доходимость считается по каждому менеджеру.',6400],
 ['Менеджер продаж','wa','<b>Шаг 5.</b> WhatsApp внутри системы, у каждого менеджера свой номер. Реклама — на один номер, переписка — с разных, чтобы не блокировали.',6000],
 ['Руководитель','cars','<b>Шаг 6.</b> Машины в наличии: закуп, расходы, цена и маржа по каждой. Видно, какая стоит слишком долго и замораживает деньги.',6200],
 ['Кредитный специалист','credits','<b>Шаг 7.</b> Одна анкета уходит во все банки сразу. Система подбирает авто под одобренную сумму — клиент не тратит неделю на машину, которую банк не пропустит.',6400],
 ['Руководитель','ads','<b>Шаг 8.</b> Реклама считается не в лидах, а в визитах и продажах: сколько стоит привести человека в салон и сколько — продать машину.',6200],
 ['Руководитель','dash','<b>Итог.</b> Одна система вместо блокнотов и личных телефонов: обращения, звонки с записями, визиты, банки, авто и деньги — в руках у собственника.',6600]
];
let tourT=null,tourI=0;
function tour(){if(tourT){stopTour();return}tourI=0;document.getElementById('tourBtn').textContent='■ Остановить';step()}
function step(){if(tourI>=TOUR.length){stopTour();sparks();
  toast('<b>Это демо, собранное под ES Motors.</b> Всё, что вы видели, дорабатывается под ваш процесс — этапы, поля и отчёты настраиваются под то, как работает именно ваш салон.');return}
 const [r,s,txt,ms]=TOUR[tourI++];
 if(role!==r)enter(r);
 setTimeout(()=>{go(s);toast(txt)},role!==r?380:0);
 tourT=setTimeout(step,ms)}
function stopTour(){clearTimeout(tourT);tourT=null;const b=document.getElementById('tourBtn');if(b)b.textContent='▶ Сценарий'}
renderRoles();
(function(){const q=new URLSearchParams(location.search).get('s');
 if(q){for(const [n,r] of Object.entries(ROLES))if(r.s.includes(q)){enter(n);go(q);return}}})();
