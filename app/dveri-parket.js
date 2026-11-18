/* ДУБ И ДВЕРЬ — двери и паркет, Алматы · Астана · Шымкент (Алексей, Айкера). Демо на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const TODAY='18.11.2026',NOW='13:05';
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const bar=(w,c)=>`<div class="bar"><i class="${c||''}" style="--w:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const said=(q,a,who)=>`<div class="said"><b>${who||'Из встречи 17.11'}</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const SEC=[
 {k:'sum',n:'Пульт',d:'цифры и отчёты',sub:[['dash','Пульт руководителя'],['reports','Отчёты и показатели']]},
 {k:'sale',n:'Продажи',d:'КЦ, салоны, сделки',sub:[['kc','Воронка колл-центра'],['funnel','Воронка продаж'],['deal','Карточка сделки'],['clients','Клиенты и компании'],['field','Замер и монтаж']]},
 {k:'calc',n:'Расчёт',d:'двери и паркет',sub:[['cdoor','Калькулятор дверей'],['cparq','Калькулятор паркета']]},
 {k:'appr',n:'Согласования',d:'бизнес-процессы',sub:[['appr','Процесс согласования'],['areg','Реестр согласований'],['abuild','Конструктор маршрутов']]},
 {k:'com',n:'Связь',d:'каналы, звонки, задачи',sub:[['inbox','Входящие каналы'],['calls','Телефония и записи'],['ichat','Внутренние чаты'],['tasks','Задачи и автозадачи']]},
 {k:'wh',n:'Склад',d:'образцы и остатки',sub:[['stock','Образцы и склад']]},
 {k:'sys',n:'Система',d:'сервер, переезд, права',sub:[['sec','Безопасность и сервер'],['move','Переезд с Битрикс24'],['roles','Роли и права'],['launch','Стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Руководитель':{av:'АЛ',n:'Алексей',note:'Всё: три города, воронки, деньги, согласования, отчёты',s:ALL.slice()},
 'Специалист CRM':{av:'АЙ',n:'Айкера · куратор системы',note:'Настройка воронок, маршрутов согласований, прав, каналов и переезда',s:ALL.filter(k=>k!=='launch')},
 'Оператор КЦ':{av:'ОП',n:'Дана · колл-центр',note:'Входящие из WhatsApp, Instagram, сайта, звонков → квалификация → передача в салон',s:['kc','inbox','calls','clients','tasks','ichat']},
 'Менеджер салона':{av:'МС',n:'Руслан · салон «Абая», Алматы',note:'Свои сделки, расчёт, КП, договор, запуск согласований',s:['funnel','deal','cdoor','cparq','clients','appr','inbox','calls','tasks','ichat','stock']},
 'Финансист':{av:'ФН',n:'Мадина · финансы',note:'Согласование скидок, оплат и договоров, отчёты по деньгам',s:['appr','areg','reports','deal','tasks','ichat']},
 'Замерщик / монтажник':{av:'ЗМ',n:'Ерлан · замеры и монтаж',note:'С телефона: замеры, фото проёмов, монтаж и акт',s:['field','tasks','cdoor','cparq','ichat']}
};
let role='Руководитель',cur='dash';
const CITY=[{id:'ALA',n:'Алматы',c:'#7a4a2a'},{id:'AST',n:'Астана',c:'#2f3a40'},{id:'SHY',n:'Шымкент',c:'#b08a5a'}];
const cityN=id=>(CITY.find(c=>c.id===id)||CITY[0]).n;
const SAL=[{id:'S1',n:'Абая',city:'ALA'},{id:'S2',n:'Есентай',city:'ALA'},{id:'S3',n:'Мангилик Ел',city:'AST'},{id:'S4',n:'Тауке хана',city:'SHY'}];
const salN=id=>{const s=SAL.find(x=>x.id===id)||SAL[0];return s.n+' · '+cityN(s.city)};
const MGR=[{id:'M1',n:'Руслан',sal:'S1'},{id:'M2',n:'Асель',sal:'S2'},{id:'M3',n:'Тимур',sal:'S3'},{id:'M4',n:'Жанна',sal:'S3'},{id:'M5',n:'Бекзат',sal:'S4'}];
const MN=id=>(MGR.find(m=>m.id===id)||{n:'—'}).n;
let CITYF='all';
/* лиды колл-центра */
const CH={wa:'WhatsApp',ig:'Instagram',web:'Сайт',call:'Звонок',tgm:'Telegram'};
const KST=[['new','Новые'],['qual','Квалификация'],['pass','Передан в салон'],['lost','Не целевой']];
let LEADS=[
 {id:'L-2041',n:'Айгерим Нурланова',ph:'+7 701 512 44 18',ch:'wa',want:'Межкомнатные двери, 6 шт',city:'ALA',st:'new',t:'12:58'},
 {id:'L-2040',n:'ТОО «Нур Девелопмент»',ph:'+7 717 255 10 90',ch:'web',want:'Паркет дуб, 420 м², ЖК',city:'AST',st:'new',t:'12:41'},
 {id:'L-2039',n:'Дмитрий К.',ph:'+7 705 300 61 22',ch:'ig',want:'Входная дверь + 3 межкомнатные',city:'ALA',st:'qual',t:'12:10'},
 {id:'L-2038',n:'Сауле Б.',ph:'+7 777 610 08 31',ch:'call',want:'Паркет ёлочкой, 64 м²',city:'SHY',st:'qual',t:'11:47'},
 {id:'L-2037',n:'Дизайн-студия «Лофт»',ph:'+7 708 444 19 70',ch:'tgm',want:'Скрытые двери под покраску, 9 шт',city:'ALA',st:'pass',t:'11:02',sal:'S2'},
 {id:'L-2036',n:'Ермек Т.',ph:'+7 702 118 52 03',ch:'wa',want:'Ламинат',city:'AST',st:'lost',t:'10:31',why:'Нужен ламинат эконом — не наш ассортимент'},
 {id:'L-2035',n:'Гульнара Ж.',ph:'+7 747 205 77 64',ch:'web',want:'Двери в дом, 11 шт + паркет 90 м²',city:'AST',st:'pass',t:'10:05',sal:'S3'}
];
/* сделки */
const DST=[['zam','Замер'],['calc','Расчёт'],['kp','КП'],['dog','Договор'],['pre','Предоплата'],['fab','Заказ у фабрики'],['dlv','Поставка'],['mont','Монтаж'],['done','Закрыто']];
let DEALS=[
 {id:'D-1187',cl:'C1',sal:'S1',m:'M1',prod:'Двери',what:'Межкомнатные «Милано» 7 шт + входная',sum:1806900,st:'kp',disc:12},
 {id:'D-1186',cl:'C2',sal:'S3',m:'M3',prod:'Паркет',what:'Дуб натур, ёлочка, 128 м²',sum:6140000,st:'dog',disc:5},
 {id:'D-1185',cl:'C3',sal:'S2',m:'M2',prod:'Двери',what:'Скрытые двери под покраску, 9 шт',sum:3410000,st:'calc',disc:0},
 {id:'D-1184',cl:'C4',sal:'S4',m:'M5',prod:'Паркет',what:'Ясень, палуба, 64 м²',sum:2050000,st:'zam',disc:0},
 {id:'D-1183',cl:'C5',sal:'S3',m:'M4',prod:'Двери + паркет',what:'11 дверей + паркет 90 м²',sum:7920000,st:'pre',disc:8},
 {id:'D-1182',cl:'C6',sal:'S1',m:'M1',prod:'Двери',what:'Входная «Термо», 1 шт',sum:640000,st:'fab',disc:0},
 {id:'D-1181',cl:'C7',sal:'S2',m:'M2',prod:'Паркет',what:'Орех, прямая укладка, 46 м²',sum:2310000,st:'dlv',disc:3},
 {id:'D-1180',cl:'C8',sal:'S3',m:'M3',prod:'Двери',what:'ЖК «Нур», 48 дверей',sum:14400000,st:'mont',disc:10},
 {id:'D-1179',cl:'C9',sal:'S4',m:'M5',prod:'Двери',what:'Межкомнатные, 5 шт',sum:1240000,st:'done',disc:0}
];
const DL=id=>DEALS.find(d=>d.id===id)||DEALS[0];
let DEAL='D-1187';
/* клиенты и компании */
let CL=[
 {id:'C1',n:'Дмитрий Ковалёв',t:'Физлицо',ph:'+7 705 300 61 22',city:'ALA',src:'Instagram'},
 {id:'C2',n:'Сауле Бекова',t:'Физлицо',ph:'+7 777 610 08 31',city:'AST',src:'Звонок'},
 {id:'C3',n:'Дизайн-студия «Лофт»',t:'Компания',ph:'+7 708 444 19 70',city:'ALA',src:'Telegram',bin:'190340021455'},
 {id:'C4',n:'Арман Сейтказы',t:'Физлицо',ph:'+7 701 640 22 11',city:'SHY',src:'Сайт'},
 {id:'C5',n:'Гульнара Жумабаева',t:'Физлицо',ph:'+7 747 205 77 64',city:'AST',src:'Сайт'},
 {id:'C6',n:'Олжас Мусин',t:'Физлицо',ph:'+7 702 905 13 48',city:'ALA',src:'WhatsApp'},
 {id:'C7',n:'Елена Ли',t:'Физлицо',ph:'+7 777 218 90 05',city:'ALA',src:'Instagram'},
 {id:'C8',n:'ТОО «Нур Девелопмент»',t:'Компания',ph:'+7 717 255 10 90',city:'AST',src:'Сайт',bin:'150840012377'},
 {id:'C9',n:'Бахыт Оспанов',t:'Физлицо',ph:'+7 705 771 30 62',city:'SHY',src:'WhatsApp'}
];
const CLN=id=>(CL.find(c=>c.id===id)||{n:'—'}).n;
/* сохранённые расчёты по клиентам */
let CALCS=[
 {cl:'C1',d:'14.11',k:'Двери',txt:'«Милано» 800×2000, коробка, наличник с 2 стор., фурнитура «Стандарт», монтаж · 7 шт',sum:1166900},
 {cl:'C1',d:'14.11',k:'Двери',txt:'Входная «Термо» 960×2050, монтаж · 1 шт',sum:640000},
 {cl:'C2',d:'12.11',k:'Паркет',txt:'Дуб натур, ёлочка, 128 м² + 10% запас, подложка, плинтус 96 м',sum:6140000}
];
/* согласования: маршрут — шаги, у каждого роль, исполнитель, статус */
const RT={zav:'Руководитель салона',fin:'Финансист',dir:'Директор',jur:'Юрист',buh:'Бухгалтер'};
let APPR=[
 {id:'СГ-318',type:'disc',title:'Скидка 12% по сделке D-1187',deal:'D-1187',sum:216800,init:'Руслан · менеджер',st:'run',d:'18.11 11:40',
  steps:[{r:'zav',who:'Нурлан Ж.',st:'ok',d:'18.11 11:52',c:'Клиент берёт 8 дверей, согласен'},{r:'fin',who:'Мадина',st:'now'},{r:'dir',who:'Алексей',st:'wait'}],
  msgs:[{who:'Руслан',t:'11:40',txt:'Клиент сравнивает с конкурентом, просит 12%. Маржа после скидки 31%.'},{who:'Нурлан Ж.',t:'11:52',txt:'Поддерживаю, объём хороший.'}],files:['КП_D-1187_v2.pdf','Расчёт_двери_14.11.xlsx']},
 {id:'СГ-317',type:'pay',title:'Оплата фабрике «Волховец»: партия дверей',deal:'D-1182',sum:4860000,init:'Мадина · финансы',st:'run',d:'18.11 10:15',
  steps:[{r:'buh',who:'Бухгалтер',st:'ok',d:'18.11 10:40',c:'Счёт сверен с заказом'},{r:'dir',who:'Алексей',st:'now'}],
  msgs:[{who:'Мадина',t:'10:15',txt:'Счёт фабрики на 4 860 000 ₸, срок оплаты 20.11, иначе сдвиг отгрузки на неделю.'}],files:['Счёт_Волховец_№8812.pdf']},
 {id:'СГ-316',type:'dog',title:'Договор с ТОО «Нур Девелопмент» · 48 дверей',deal:'D-1180',sum:14400000,init:'Тимур · менеджер',st:'run',d:'17.11 17:05',
  steps:[{r:'zav',who:'Жанна',st:'ok',d:'17.11 17:30',c:''},{r:'jur',who:'Юрист',st:'now'},{r:'fin',who:'Мадина',st:'wait'},{r:'dir',who:'Алексей',st:'wait'}],
  msgs:[{who:'Тимур',t:'17:05',txt:'Застройщик прислал свою редакцию: отсрочка 30 дней после монтажа.'}],files:['Договор_Нур_ред.застройщика.docx']},
 {id:'СГ-315',type:'disc',title:'Скидка 15% по сделке D-1180',deal:'D-1180',sum:2160000,init:'Тимур · менеджер',st:'done',d:'16.11 12:00',
  steps:[{r:'zav',who:'Жанна',st:'ok',d:'16.11 12:20',c:''},{r:'fin',who:'Мадина',st:'ok',d:'16.11 14:05',c:'Объект крупный'},{r:'dir',who:'Алексей',st:'ok',d:'16.11 16:40',c:'Ок, но 10%'}],msgs:[],files:[]},
 {id:'СГ-314',type:'pay',title:'Оплата поставщику паркета «Барлинек»',deal:'D-1186',sum:3120000,init:'Мадина · финансы',st:'ret',d:'15.11 09:30',
  steps:[{r:'buh',who:'Бухгалтер',st:'ret',d:'15.11 11:00',c:'Нет акта сверки за октябрь'},{r:'dir',who:'Алексей',st:'wait'}],msgs:[],files:[]},
 {id:'СГ-313',type:'disc',title:'Скидка 20% по сделке D-1177',deal:'D-1179',sum:248000,init:'Бекзат · менеджер',st:'rej',d:'14.11 15:10',
  steps:[{r:'zav',who:'Бекзат',st:'ok',d:'14.11 15:20',c:''},{r:'fin',who:'Мадина',st:'rej',d:'14.11 16:00',c:'Маржа уходит ниже 20%'}],msgs:[],files:[]}
];
const ATYPE={disc:'Скидка',pay:'Оплата поставщику',dog:'Договор'};
let APS='СГ-318';
/* шаблоны маршрутов (конструктор) */
let TPL=[
 {id:'disc',n:'Скидка клиенту',cond:'скидка больше 10%',steps:['zav','fin','dir']},
 {id:'pay',n:'Оплата поставщику',cond:'любая сумма; директор — от 1 000 000 ₸',steps:['buh','dir']},
 {id:'dog',n:'Договор с компанией',cond:'юрлицо или сумма от 5 000 000 ₸',steps:['zav','jur','fin','dir']},
 {id:'ret',n:'Возврат денег клиенту',cond:'любой возврат',steps:['zav','fin','dir']}
];
let TPS='disc';
/* задачи */
let TASKS=[
 {id:1,t:'Перезвонить Айгерим: 6 межкомнатных дверей',who:'Дана',due:'сегодня 14:00',auto:true,src:'Новый лид из WhatsApp',done:false},
 {id:2,t:'Замер у Сауле Б., Шымкент',who:'Ерлан',due:'19.11 11:00',auto:true,src:'Сделка D-1184 перешла на «Замер»',done:false},
 {id:3,t:'Согласовать скидку по D-1187',who:'Мадина',due:'сегодня',auto:true,src:'Запущено согласование СГ-318',done:false},
 {id:4,t:'Отправить КП «Лофт» после расчёта',who:'Асель',due:'19.11',auto:false,src:'Поставил Алексей',done:false},
 {id:5,t:'Проверить предоплату D-1183',who:'Мадина',due:'вчера',auto:true,src:'Нет оплаты 3 дня после договора',done:false,late:true},
 {id:6,t:'Собрать образцы паркета для шоурума Есентай',who:'Асель',due:'20.11',auto:false,src:'Поставил Алексей',done:true}
];
let CALC_D={w:800,h:2000,model:1,box:true,nal:2,fit:1,mont:true,q:7};
let CALC_P={area:64,wood:0,lay:1,under:true,plinth:true,res:10};
let CALC_CL='C1';
const SC={};
const dCity=d=>(SAL.find(s=>s.id===d.sal)||SAL[0]).city;
const cityOk=c=>CITYF==='all'||CITYF===c;
const cityBar=()=>`<div class="cfil">${[['all','Все города']].concat(CITY.map(c=>[c.id,c.n])).map(([k,n])=>`<button class="${CITYF===k?'on':''}" onclick="CITYF='${k}';render()">${n}</button>`).join('')}</div>`;
const stN=k=>(DST.find(s=>s[0]===k)||['',''])[1];
const apSt=a=>a.st==='done'?tag('согласовано','g'):a.st==='rej'?tag('отклонено','r'):a.st==='ret'?tag('возвращено','w'):tag('на согласовании','i');
/* ===== Пульт ===== */
SC.dash=()=>{const D=DEALS.filter(d=>cityOk(dCity(d)));const pipe=D.filter(d=>d.st!=='done').reduce((a,d)=>a+d.sum,0);const run=APPR.filter(a=>a.st==='run');const nl=LEADS.filter(l=>l.st==='new'&&cityOk(l.city)).length;
const byCity=CITY.map(c=>{const ds=DEALS.filter(d=>dCity(d)===c.id);return {c,n:ds.length,sum:ds.reduce((a,d)=>a+d.sum,0),mon:[48.2,31.6,17.9][CITY.indexOf(c)]}});
return `<div class="hd"><div><h2>Пульт руководителя · ${TODAY}, ${NOW}</h2><p>Три города и четыре салона на одном экране: лиды колл-центра, сделки по этапам, выручка и согласования, которые ждут вашего решения.</p></div><div class="btns"><button class="bt" onclick="go('reports')">Отчёты</button><button class="bt p" onclick="go('appr')">Согласования · ${run.length}</button></div></div>
${said('В Битриксе мы используем процентов пять. Платить за всё остальное не хочу. И данные клиентов должны лежать у нас на сервере.','Только нужное вам — на вашем сервере в Казахстане, без абонплаты.','Алексей, 17.11')}
${cityBar()}
<div class="strip"><div><small>Выручка ноября</small><b>${tg(97700000)}</b><span>план ${tg(110000000)}</span>${bar(89,'g')}</div><div><small>В работе по сделкам</small><b>${tg(pipe)}</b><span>${D.filter(d=>d.st!=='done').length} сделок</span></div><div><small>Новые лиды сегодня</small><b>${nl+14}</b><span>${nl} ждут оператора</span></div><div><small>Ждут согласования</small><b class="${run.length?'bad':''}">${run.length}</b><span>на ${tg(run.reduce((a,x)=>a+x.sum,0))}</span></div><div><small>Конверсия лид → договор</small><b>23%</b><span>за 30 дней</span></div></div>
<div class="g21"><div>
 <div class="pan"><h3>Города</h3><div class="tw"><table class="t"><thead><tr><th>Город</th><th class="r">Сделок в работе</th><th class="r">Сумма в работе</th><th class="r">Выручка месяца, млн</th><th style="width:22%">К плану</th></tr></thead><tbody>${byCity.map(x=>`<tr onclick="CITYF='${x.c.id}';go('funnel')"><td><i class="tm" style="background:${x.c.c}"></i><b>${x.c.n}</b></td><td class="r">${x.n}</td><td class="r">${tg(x.sum)}</td><td class="r">${x.mon}</td><td>${bar([92,84,88][CITY.indexOf(x.c)],'g')}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Сделки по этапам</h3><div class="funw">${DST.map(([k,n])=>{const L=D.filter(d=>d.st===k);return `<div onclick="go('funnel')"><b>${L.length}</b><span>${n}</span><em>${L.length?(L.reduce((a,d)=>a+d.sum,0)/1e6).toFixed(1).replace('.',',')+' млн':'—'}</em></div>`}).join('')}</div></div>
</div><div>
 <div class="pan"><h3>Ждут вашего решения</h3><div class="alist">${run.map(a=>`<a onclick="APS='${a.id}';go('appr')"><i class="dt ${a.type==='pay'?'r':'w'}"></i><b>${esc(a.title)}</b><span>${a.id} · ${tg(a.sum)} · шаг: ${RT[(a.steps.find(s=>s.st==='now')||{r:'dir'}).r]}</span></a>`).join('')}
  <a onclick="go('tasks')"><i class="dt r"></i><b>Просрочена задача: предоплата D-1183</b><span>договор подписан 3 дня назад, оплаты нет</span></a>
  <a onclick="go('kc')"><i class="dt i"></i><b>${nl} новых лида без ответа</b><span>WhatsApp и сайт · Алматы, Астана</span></a></div></div>
 <div class="pan"><h3>Салоны за месяц</h3><div class="tw"><table class="t sm"><thead><tr><th>Салон</th><th class="r">Договоров</th><th class="r">Выручка</th></tr></thead><tbody>${SAL.map((s,i)=>`<tr><td>${esc(salN(s.id))}</td><td class="r">${[14,11,17,9][i]}</td><td class="r">${tg([26400000,21800000,31600000,17900000][i])}</td></tr>`).join('')}</tbody></table></div></div>
</div></div>`};
SC.reports=()=>`<div class="hd"><div><h2>Отчёты и показатели</h2><p>Готовые отчёты на любой период и по любому городу. Любая цифра раскрывается до списка сделок. Выгрузка в Excel.</p></div><div class="btns"><button class="bt" onclick="xls()">Excel</button></div></div>
${cityBar()}
<div class="g2">
 <div class="pan"><h3>Источники лидов → договоры · 30 дней</h3><div class="tw"><table class="t"><thead><tr><th>Канал</th><th class="r">Лиды</th><th class="r">Договоры</th><th class="r">Конверсия</th><th class="r">Выручка</th></tr></thead><tbody>${[['WhatsApp',412,96,41200000],['Instagram',268,51,22600000],['Сайт',190,47,19800000],['Звонок',121,31,10900000],['Telegram',38,6,3200000]].map(r=>`<tr><td><b>${r[0]}</b></td><td class="r">${r[1]}</td><td class="r">${r[2]}</td><td class="r">${pct(r[2],r[1])}%</td><td class="r">${tg(r[3])}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Менеджеры · ноябрь</h3><div class="tw"><table class="t"><thead><tr><th>Менеджер</th><th>Салон</th><th class="r">Договоры</th><th class="r">Выручка</th><th class="r">Ср. скидка</th></tr></thead><tbody>${MGR.map((m,i)=>`<tr><td><b>${m.n}</b></td><td>${esc(salN(m.sal))}</td><td class="r">${[14,11,9,8,9][i]}</td><td class="r">${tg([26400000,21800000,16900000,14700000,17900000][i])}</td><td class="r ${i===0?'bad':''}">${[9.4,4.1,6.2,5.0,3.8][i]}%</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Двери и паркет</h3><div class="kv"><span>Двери, договоров</span><b>39 · ${tg(52300000)}</b></div><div class="kv"><span>Паркет, договоров</span><b>14 · ${tg(36400000)}</b></div><div class="kv"><span>Двери + паркет в одной сделке</span><b>7 · ${tg(9000000)}</b></div><div class="kv"><span>Средний чек</span><b>${tg(1840000)}</b></div></div>
 <div class="pan"><h3>Согласования</h3><div class="kv"><span>Запущено за месяц</span><b>46</b></div><div class="kv"><span>Среднее время решения</span><b>2 ч 40 мин</b></div><div class="kv"><span>Отклонено</span><b>5</b></div><div class="kv"><span>Дольше суток</span><b class="bad">3</b></div></div>
</div>`;
/* ===== Колл-центр ===== */
function kcMove(id,st){const l=LEADS.find(x=>x.id===id);l.st=st;if(st==='pass'){l.sal=l.city==='ALA'?'S1':l.city==='AST'?'S3':'S4';TASKS.unshift({id:Date.now(),t:'Связаться с лидом '+l.n,who:MN(MGR.find(m=>m.sal===l.sal).id),due:'сегодня',auto:true,src:'Лид передан из колл-центра',done:false});toast('Лид передан в салон <b>'+esc(salN(l.sal))+'</b>, менеджеру поставлена задача.')}else if(st==='lost'){l.why='Не целевой запрос';toast('Лид закрыт как не целевой, причина сохранена.')}else toast('Лид в квалификации.');render()}
SC.kc=()=>`<div class="hd"><div><h2>Воронка колл-центра</h2><p>Все обращения из WhatsApp, Instagram, сайта, Telegram и звонков падают сюда. Оператор квалифицирует и передаёт в нужный салон — менеджер получает задачу.</p></div><div class="btns"><button class="bt" onclick="go('inbox')">Входящие</button></div></div>
${cityBar()}
<div class="kanban k4">${KST.map(([k,n])=>{const L=LEADS.filter(l=>l.st===k&&cityOk(l.city));return `<div class="kcol"><div class="kh"><b>${n}</b><span>${L.length}</span></div>${L.map(l=>`<div class="kc"><code>${l.id} · ${CH[l.ch]} · ${l.t}</code><b>${esc(l.n)}</b><span>${esc(l.want)} · ${cityN(l.city)}</span>${l.sal?`<span>→ ${esc(salN(l.sal))}</span>`:''}${l.why?`<span class="bad">${esc(l.why)}</span>`:''}${k==='new'?`<button class="bt sm full" onclick="kcMove('${l.id}','qual')">В квалификацию</button>`:''}${k==='qual'?`<button class="bt sm p full" onclick="kcMove('${l.id}','pass')">Передать в салон</button><button class="bt sm full" onclick="kcMove('${l.id}','lost')">Не целевой</button>`:''}</div>`).join('')||'<div class="kempty">пусто</div>'}</div>`}).join('')}</div>
${said('Нужна воронка по колл-центру и воронка продаж по салонам.','Две воронки: КЦ квалифицирует, салон продаёт. Передача — одной кнопкой, с задачей менеджеру.','Алексей, 17.11')}`;
/* ===== Воронка продаж ===== */
function dMove(id,dir){const d=DL(id);const i=DST.findIndex(s=>s[0]===d.st);const j=Math.max(0,Math.min(DST.length-1,i+dir));d.st=DST[j][0];if(d.st==='dog'&&d.disc>10&&!APPR.some(a=>a.deal===d.id&&a.type==='disc'&&a.st!=='rej'))toast('Скидка '+d.disc+'% — сначала согласование. Запустите его в карточке сделки.');else toast('Сделка '+d.id+' → «'+stN(d.st)+'».'+(d.st==='zam'?' Замерщику поставлена задача.':''));render()}
SC.funnel=()=>{const D=DEALS.filter(d=>cityOk(dCity(d))&&(role!=='Менеджер салона'||d.m==='M1'));return `<div class="hd"><div><h2>Воронка продаж</h2><p>Замер → расчёт → КП → договор → предоплата → заказ у фабрики → поставка → монтаж. Заказные позиции ведутся до монтажа, не теряются между отделами.</p></div><div class="btns"><button class="bt p" onclick="DEAL='D-1187';go('deal')">Открыть сделку</button></div></div>
${cityBar()}
<div class="kanban dk">${DST.map(([k,n])=>{const L=D.filter(d=>d.st===k);return `<div class="kcol"><div class="kh"><b>${n}</b><span>${L.length}</span></div>${L.map(d=>`<div class="kc" onclick="DEAL='${d.id}';go('deal')"><code>${d.id} · ${esc(salN(d.sal))}</code><b>${esc(CLN(d.cl))}</b><span>${esc(d.what)}</span><em>${tg(d.sum)}</em><span>${MN(d.m)}${d.disc?' · скидка '+d.disc+'%':''}</span></div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>`};
/* ===== Карточка сделки ===== */
function startAppr(id){const d=DL(id);if(APPR.some(a=>a.deal===id&&a.st==='run')){APS=APPR.find(a=>a.deal===id&&a.st==='run').id;go('appr');return}const n='СГ-'+(319+APPR.length-6);APPR.unshift({id:n,type:'disc',title:'Скидка '+d.disc+'% по сделке '+id,deal:id,sum:Math.round(d.sum*d.disc/100),init:MN(d.m)+' · менеджер',st:'run',d:TODAY.slice(0,5)+' '+NOW,steps:TPL[0].steps.map((r,i)=>({r,who:{zav:'Руководитель салона',fin:'Мадина',dir:'Алексей',jur:'Юрист',buh:'Бухгалтер'}[r],st:i?'wait':'now'})),msgs:[{who:MN(d.m),t:NOW,txt:'Прошу согласовать скидку '+d.disc+'%.'}],files:[]});APS=n;toast('Запущено согласование <b>'+n+'</b> по шаблону «Скидка клиенту».');go('appr')}
SC.deal=()=>{const d=DL(DEAL);const c=CL.find(x=>x.id===d.cl)||CL[0];const cs=CALCS.filter(x=>x.cl===d.cl);const ap=APPR.filter(a=>a.deal===d.id);const i=DST.findIndex(s=>s[0]===d.st);
return `<div class="hd"><div><h2>${d.id} · ${esc(c.n)}</h2><p>${esc(d.what)} · ${esc(salN(d.sal))} · менеджер ${MN(d.m)}. Всё по сделке внутри: переписка, звонки, расчёты, документы, согласования и задачи.</p></div><div class="btns"><button class="bt" onclick="dMove('${d.id}',-1)">← Этап</button><button class="bt p" onclick="dMove('${d.id}',1)">Следующий этап →</button></div></div>
<div class="stps st9">${DST.map((s,j)=>`<div class="${j<i?'done':j===i?'now':''}"><code>${String(j+1).padStart(2,'0')}</code>${s[1]}</div>`).join('')}</div>
<div class="g21"><div>
 <div class="pan"><h3>Переписка и звонки</h3><div class="feed">
  <div class="fi in"><code>WhatsApp · 14.11 10:12</code>Здравствуйте, нужны двери в квартиру, 7 межкомнатных и входная.</div>
  <div class="fi out"><code>${MN(d.m)} · 14.11 10:20</code>Добрый день! Запишу вас на бесплатный замер. Удобно завтра в 11:00?</div>
  <div class="fi call"><code>Звонок · 15.11 16:02 · 4:18</code>Исходящий: обсудили модели и цвет. <a onclick="toast('Воспроизведение записи звонка 4:18')">Запись ▸</a></div>
  <div class="fi in"><code>WhatsApp · 17.11 19:44</code>Конкурент даёт дешевле на 12%. Сможете так же?</div>
 </div><div class="btns l"><button class="bt sm" onclick="go('inbox')">Ответить в WhatsApp</button><button class="bt sm" onclick="toast('Звонок через IP-телефонию: '+'${esc(c.ph)}')">Позвонить</button></div></div>
 <div class="pan"><h3>Расчёты клиента</h3>${cs.length?cs.map(x=>`<div class="dv"><div><em>${x.k} · ${esc(x.txt)}</em><span>сохранён ${x.d}</span></div><b>${tg(x.sum)}</b></div>`).join(''):'<p class="mut">Расчётов пока нет.</p>'}<div class="btns l"><button class="bt sm" onclick="CALC_CL='${d.cl}';go('cdoor')">Рассчитать двери</button><button class="bt sm" onclick="CALC_CL='${d.cl}';go('cparq')">Рассчитать паркет</button></div></div>
 <div class="pan"><h3>Документы</h3>${['КП_'+d.id+'_v2.pdf · сформировано из расчёта','Договор_'+d.id+'.docx · по шаблону салона','Фото_замера_проёмы.zip · 12 фото'].map(f=>`<div class="dv"><div><em>${f}</em></div><button class="bt sm" onclick="toast('Файл открыт')">Открыть</button></div>`).join('')}</div>
</div><div>
 <div class="pan"><h3>Сделка</h3><div class="kv"><span>Сумма</span><b>${tg(d.sum)}</b></div><div class="kv"><span>Скидка</span><b class="${d.disc>10?'bad':''}">${d.disc}%</b></div><div class="kv"><span>Этап</span><b>${stN(d.st)}</b></div><div class="kv"><span>Клиент</span><b>${esc(c.n)}</b></div><div class="kv"><span>Телефон</span><b>${esc(c.ph)}</b></div><div class="kv"><span>Источник</span><b>${esc(c.src)}</b></div></div>
 <div class="pan"><h3>Согласования по сделке</h3>${ap.length?ap.map(a=>`<div class="dv" onclick="APS='${a.id}';go('appr')" style="cursor:pointer"><div><em>${a.id} · ${esc(a.title)}</em><span>${a.d}</span></div>${apSt(a)}</div>`).join(''):'<p class="mut">Нет согласований.</p>'}${d.disc>10?`<button class="bt p full" onclick="startAppr('${d.id}')">Согласовать скидку ${d.disc}%</button>`:''}</div>
 <div class="pan"><h3>Задачи</h3>${TASKS.slice(0,3).map(t=>`<div class="trow"><i class="dt ${t.late?'r':t.done?'g':'w'}"></i><b>${esc(t.t)}</b><span>${esc(t.who)} · ${esc(t.due)}</span></div>`).join('')}</div>
</div></div>`};
/* ===== Клиенты ===== */
let CLQ='';
SC.clients=()=>{const L=CL.filter(c=>cityOk(c.city)&&(!CLQ||(c.n+c.ph+(c.bin||'')).toLowerCase().includes(CLQ)));return `<div class="hd"><div><h2>Клиенты и компании</h2><p>Физлица, дизайнеры и застройщики. Перенесены из Битрикс24 со всей историей сделок. Поиск по имени, телефону и БИН, проверка дублей.</p></div><div class="btns"><input class="sel" placeholder="имя, телефон, БИН" value="${esc(CLQ)}" onchange="CLQ=this.value.toLowerCase();render()"></div></div>
${cityBar()}
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Тип</th><th>Телефон</th><th>Город</th><th>Источник</th><th class="r">Сделок</th><th class="r">Расчётов</th></tr></thead><tbody>${L.map(c=>`<tr onclick="openCl('${c.id}')"><td><b>${esc(c.n)}</b>${c.bin?`<br><small class="mut">БИН ${c.bin}</small>`:''}</td><td>${c.t==='Компания'?tag('Компания','i'):tag('Физлицо')}</td><td class="mono">${esc(c.ph)}</td><td>${cityN(c.city)}</td><td>${esc(c.src)}</td><td class="r">${DEALS.filter(d=>d.cl===c.id).length}</td><td class="r">${CALCS.filter(x=>x.cl===c.id).length}</td></tr>`).join('')}</tbody></table></div></div>
${said('Перенос контактов, компаний и текущих сделок из Битрикса — это услуга?','Да, входит в пакет: контакты, компании и сделки переносим за неделю.','Айкера, 17.11')}`};
function openCl(id){const c=CL.find(x=>x.id===id);const ds=DEALS.filter(d=>d.cl===id);const cs=CALCS.filter(x=>x.cl===id);openM(esc(c.n),c.t+' · '+cityN(c.city)+' · '+esc(c.ph),`<h4>Сделки</h4>${ds.map(d=>`<div class="kv"><span>${d.id} · ${esc(d.what)} · ${stN(d.st)}</span><b>${tg(d.sum)}</b></div>`).join('')||'<p>—</p>'}<h4 style="margin-top:10px">Сохранённые расчёты</h4>${cs.map(x=>`<div class="kv"><span>${x.d} · ${x.k}: ${esc(x.txt)}</span><b>${tg(x.sum)}</b></div>`).join('')||'<p>—</p>'}<div class="btns l"><button class="bt p" onclick="closeM();CALC_CL='${id}';go('cdoor')">Новый расчёт</button></div>`)}
/* ===== Замер и монтаж ===== */
let FPH=0;
SC.field=()=>`<div class="hd"><div><h2>Замер и монтаж с телефона</h2><p>Замерщик видит задачи на день, адрес и контакты, вносит размеры проёмов и фото прямо на объекте. Размеры сразу попадают в калькулятор менеджера.</p></div></div>
<div class="phw"><div class="phone3"><div class="phs"><div class="phtop"><b>Ерлан · замеры</b><span>${TODAY}</span></div>
 <div class="dv"><div><em>11:00 · Сауле Б.</em><span>Шымкент, мкр Нурсат 12-48 · паркет 64 м²</span></div>${tag('сейчас','w')}</div>
 <div class="dv"><div><em>15:30 · Арман С.</em><span>Шымкент, ул. Байтурсынова 9 · двери</span></div>${tag('план')}</div>
 <div class="fld"><label>Комната · площадь, м²</label><input class="sel" value="Гостиная · 28,4"></div>
 <div class="fld"><label>Перепад пола, мм</label><input class="sel" value="4"></div>
 <div class="photo ${FPH?'ok':''}" onclick="FPH=1;render();toast('Фото добавлено к сделке D-1184')"><b>${FPH?'3 фото добавлены':'Сфотографировать комнату'}</b><small>фото уходят в карточку сделки</small></div>
 <button class="bt p full" onclick="toast('Замер сохранён. Менеджер Бекзат получил задачу «Сделать расчёт».')">Сохранить замер</button>
</div></div><div>
 <div class="pan"><h3>Как это работает</h3><div class="flow4"><div><b>1</b>Сделка перешла на «Замер» — замерщик получает задачу с адресом</div><div><b>2</b>На объекте вносит размеры и фото с телефона</div><div><b>3</b>Менеджер открывает калькулятор — размеры уже там</div><div><b>4</b>После монтажа — фото и подпись клиента в акте</div></div></div>
 <div class="pan"><h3>Монтажи на неделю</h3><div class="tw"><table class="t sm"><thead><tr><th>Дата</th><th>Объект</th><th>Бригада</th><th>Статус</th></tr></thead><tbody><tr><td>19.11</td><td>ЖК «Нур» · 12 дверей · Астана</td><td>Бригада 2</td><td>${tag('план')}</td></tr><tr><td>20.11</td><td>Елена Ли · паркет 46 м² · Алматы</td><td>Бригада 1</td><td>${tag('ждём поставку','w')}</td></tr><tr><td>21.11</td><td>ЖК «Нур» · 12 дверей · Астана</td><td>Бригада 2</td><td>${tag('план')}</td></tr></tbody></table></div></div>
</div></div>`;
/* ===== Калькуляторы ===== */
const DMOD=[['«Классика» МДФ, эмаль',58000],['«Милано» шпон дуба',86000],['«Лофт» скрытая под покраску',112000],['«Термо» входная',420000]];
const DFIT=[['Без фурнитуры',0],['«Стандарт»: ручка, замок, 2 петли',18500],['«Премиум»: магнитный замок, скрытые петли',46000]];
const PWOOD=[['Дуб натур',38500],['Ясень',34200],['Американский орех',52800]];
const PLAY=[['Прямая укладка',4200],['Ёлочка',7800],['Палуба',5100]];
function calcD(){const c=CALC_D;const m=DMOD[c.model][1]*(c.w>900?1.15:1);const box=c.box?24000:0;const nal=c.nal*9600;const fit=DFIT[c.fit][1];const mont=c.mont?(c.model===3?45000:19000):0;const one=m+box+nal+fit+mont;return {m,box,nal,fit,mont,one,tot:one*c.q}}
function calcP(){const c=CALC_P;const ar=c.area*(1+c.res/100);const wood=ar*PWOOD[c.wood][1];const lay=c.area*PLAY[c.lay][1];const und=c.under?ar*1900:0;const per=Math.round(Math.sqrt(c.area)*4*0.92);const pl=c.plinth?per*4800:0;return {ar,wood,lay,und,per,pl,tot:wood+lay+und+pl}}
function saveCalc(k){const r=k==='d'?calcD():calcP();const txt=k==='d'?`${DMOD[CALC_D.model][0]} ${CALC_D.w}×${CALC_D.h}${CALC_D.box?', коробка':''}${CALC_D.nal?', наличник с '+CALC_D.nal+' стор.':''}, ${DFIT[CALC_D.fit][0].split(':')[0]}${CALC_D.mont?', монтаж':''} · ${CALC_D.q} шт`:`${PWOOD[CALC_P.wood][0]}, ${PLAY[CALC_P.lay][0].toLowerCase()}, ${CALC_P.area} м² + ${CALC_P.res}% запас${CALC_P.under?', подложка':''}${CALC_P.plinth?', плинтус':''}`;CALCS.unshift({cl:CALC_CL,d:TODAY.slice(0,5),k:k==='d'?'Двери':'Паркет',txt,sum:Math.round(r.tot)});toast('Расчёт сохранён в карточке клиента <b>'+esc(CLN(CALC_CL))+'</b>. Из него можно сформировать КП.');render()}
const clSel=()=>`<select class="sel" onchange="CALC_CL=this.value;render()">${CL.map(c=>`<option value="${c.id}" ${c.id===CALC_CL?'selected':''}>${esc(c.n)}</option>`).join('')}</select>`;
const savedFor=k=>{const L=CALCS.filter(x=>x.cl===CALC_CL&&x.k===k);return `<div class="pan"><h3>Сохранённые расчёты · ${esc(CLN(CALC_CL))}</h3>${L.length?L.map(x=>`<div class="dv"><div><em>${esc(x.txt)}</em><span>${x.d}</span></div><b>${tg(x.sum)}</b></div>`).join(''):'<p class="mut">Пока нет. Нажмите «Сохранить в клиента».</p>'}</div>`};
SC.cdoor=()=>{const c=CALC_D,r=calcD();return `<div class="hd"><div><h2>Калькулятор дверей</h2><p>Размер проёма, модель полотна, коробка, наличник, фурнитура, монтаж. Цены — из вашего прайса. Расчёт сохраняется в карточке клиента, из него собирается КП.</p></div><div class="btns">${clSel()}</div></div>
<div class="g21"><div><div class="pan"><h3>Параметры</h3>
 <div class="g2c"><div class="fld"><label>Ширина полотна, мм</label><select class="sel" onchange="CALC_D.w=+this.value;render()">${[600,700,800,900,960,1200].map(v=>`<option ${v===c.w?'selected':''}>${v}</option>`).join('')}</select></div>
 <div class="fld"><label>Высота, мм</label><select class="sel" onchange="CALC_D.h=+this.value;render()">${[2000,2050,2100,2400].map(v=>`<option ${v===c.h?'selected':''}>${v}</option>`).join('')}</select></div></div>
 <div class="fld"><label>Модель полотна</label><div class="zseg">${DMOD.map((m,i)=>`<button class="${i===c.model?'on':''}" onclick="CALC_D.model=${i};render()">${m[0]}</button>`).join('')}</div></div>
 <div class="fld"><label>Коробка и наличник</label><div class="zseg"><button class="${c.box?'on':''}" onclick="CALC_D.box=!CALC_D.box;render()">Коробка</button>${[0,1,2].map(n=>`<button class="${c.nal===n?'on':''}" onclick="CALC_D.nal=${n};render()">Наличник: ${n?'с '+n+' стор.':'нет'}</button>`).join('')}</div></div>
 <div class="fld"><label>Фурнитура</label><div class="zseg">${DFIT.map((f,i)=>`<button class="${i===c.fit?'on':''}" onclick="CALC_D.fit=${i};render()">${f[0].split(':')[0]}</button>`).join('')}</div></div>
 <div class="g2c"><div class="fld"><label>Монтаж</label><div class="zseg"><button class="${c.mont?'on':''}" onclick="CALC_D.mont=true;render()">С монтажом</button><button class="${!c.mont?'on':''}" onclick="CALC_D.mont=false;render()">Без</button></div></div>
 <div class="fld"><label>Количество</label><div class="stepr"><button onclick="CALC_D.q=Math.max(1,CALC_D.q-1);render()">−</button><span>${c.q}</span><button onclick="CALC_D.q++;render()">+</button></div></div></div>
</div>${said('У нас заказные позиции в большей части. Расчёты должны сохраняться для этого клиента.','Каждый расчёт — в карточке клиента и сделки.','Алексей, 17.11')}</div><div>
 <div class="pan"><h3>Расчёт за 1 дверь</h3><div class="kv"><span>Полотно${c.w>900?' (широкое, +15%)':''}</span><b>${tg(r.m)}</b></div><div class="kv"><span>Коробка</span><b>${tg(r.box)}</b></div><div class="kv"><span>Наличник</span><b>${tg(r.nal)}</b></div><div class="kv"><span>Фурнитура</span><b>${tg(r.fit)}</b></div><div class="kv"><span>Монтаж</span><b>${tg(r.mont)}</b></div><div class="kv tot"><span>Итого × ${c.q} шт</span><b>${tg(r.tot)}</b></div><button class="bt p full" onclick="saveCalc('d')">Сохранить в клиента</button><button class="bt full" onclick="toast('КП сформировано по шаблону салона и приложено к сделке.')">Сформировать КП</button></div>
 ${savedFor('Двери')}
</div></div>`};
SC.cparq=()=>{const c=CALC_P,r=calcP();return `<div class="hd"><div><h2>Калькулятор паркета</h2><p>Площадь, порода, способ укладки, подложка, плинтус и запас на подрезку. Периметр под плинтус считается сам.</p></div><div class="btns">${clSel()}</div></div>
<div class="g21"><div><div class="pan"><h3>Параметры</h3>
 <div class="fld"><label>Площадь, м²</label><div class="stepr"><button onclick="CALC_P.area=Math.max(5,CALC_P.area-4);render()">−</button><span>${c.area}</span><button onclick="CALC_P.area+=4;render()">+</button></div></div>
 <div class="fld"><label>Порода</label><div class="zseg">${PWOOD.map((w,i)=>`<button class="${i===c.wood?'on':''}" onclick="CALC_P.wood=${i};render()">${w[0]} · ${fmt(w[1])} ₸/м²</button>`).join('')}</div></div>
 <div class="fld"><label>Укладка</label><div class="zseg">${PLAY.map((w,i)=>`<button class="${i===c.lay?'on':''}" onclick="CALC_P.lay=${i};render()">${w[0]}</button>`).join('')}</div></div>
 <div class="fld"><label>Подложка и плинтус</label><div class="zseg"><button class="${c.under?'on':''}" onclick="CALC_P.under=!CALC_P.under;render()">Подложка</button><button class="${c.plinth?'on':''}" onclick="CALC_P.plinth=!CALC_P.plinth;render()">Плинтус</button></div></div>
 <div class="fld"><label>Запас на подрезку</label><div class="zseg">${[5,10,15].map(v=>`<button class="${v===c.res?'on':''}" onclick="CALC_P.res=${v};render()">${v}%${v===15?' (ёлочка)':''}</button>`).join('')}</div></div>
</div></div><div>
 <div class="pan"><h3>Расчёт</h3><div class="kv"><span>Паркет ${fmt(r.ar)} м² с запасом</span><b>${tg(r.wood)}</b></div><div class="kv"><span>Укладка ${c.area} м²</span><b>${tg(r.lay)}</b></div><div class="kv"><span>Подложка</span><b>${tg(r.und)}</b></div><div class="kv"><span>Плинтус ${r.per} м</span><b>${tg(r.pl)}</b></div><div class="kv tot"><span>Итого</span><b>${tg(r.tot)}</b></div><button class="bt p full" onclick="saveCalc('p')">Сохранить в клиента</button><button class="bt full" onclick="toast('КП по паркету сформировано и приложено к сделке.')">Сформировать КП</button></div>
 ${savedFor('Паркет')}
</div></div>`};
/* ===== Согласования ===== */
const AP=()=>APPR.find(a=>a.id===APS)||APPR[0];
function apAct(k){const a=AP();if(a.st!=='run'){toast('Процесс уже завершён.');return}const i=a.steps.findIndex(s=>s.st==='now');const s=a.steps[i];const tx=(document.getElementById('apc')||{}).value||'';s.d=TODAY.slice(0,5)+' '+NOW;s.c=tx;
 if(k==='ok'){s.st='ok';const nx=a.steps[i+1];if(nx){nx.st='now';toast('Согласовано. Процесс ушёл дальше: <b>'+RT[nx.r]+'</b> — '+esc(nx.who)+' получил задачу и уведомление.')}else{a.st='done';toast('Все участники согласовали. <b>'+a.id+'</b> закрыт, инициатор получил уведомление.')}}
 else if(k==='ret'){s.st='ret';a.st='ret';toast('Возвращено инициатору на доработку с комментарием.')}
 else{s.st='rej';a.st='rej';toast('Отклонено. Инициатор и сделка получили отметку.')}
 if(tx)a.msgs.push({who:s.who,t:NOW,txt:tx});render()}
function apRestart(){const a=AP();a.st='run';a.steps.forEach((s,i)=>{s.st=i?'wait':'now';s.c='';s.d=''});a.msgs.push({who:a.init.split(' ·')[0],t:NOW,txt:'Доработал и отправил повторно.'});toast('Отправлено на согласование повторно — с первого шага.');render()}
function apMsg(){const v=(document.getElementById('apm')||{}).value;if(!v)return;AP().msgs.push({who:ROLES[role].n.split(' ·')[0],t:NOW,txt:v});render()}
function apFile(){AP().files.push('Акт_сверки_'+(AP().files.length+1)+'.pdf');toast('Файл прикреплён к процессу.');render()}
SC.appr=()=>{const a=AP();const now=a.steps.find(s=>s.st==='now');return `<div class="hd"><div><h2>${a.id} · ${esc(a.title)}</h2><p>${ATYPE[a.type]} · инициатор ${esc(a.init)} · запущено ${a.d} · сделка <a onclick="DEAL='${a.deal}';go('deal')">${a.deal}</a>. Каждый участник видит процесс у себя, решает в один клик, пишет комментарий и прикладывает файлы.</p></div><div class="btns"><select class="sel" onchange="APS=this.value;render()">${APPR.map(x=>`<option value="${x.id}" ${x.id===a.id?'selected':''}>${x.id} · ${esc(x.title)}</option>`).join('')}</select></div></div>
<div class="route">${[{r:'init',who:a.init,st:'ok',d:a.d}].concat(a.steps).map((s,i)=>`<div class="rs ${s.st}"><code>${i?'Шаг '+i:'Старт'}</code><b>${s.r==='init'?'Инициатор':RT[s.r]}</b><span>${esc(s.who)}</span><em>${s.st==='ok'?'✓ '+(i?'согласовал':'запустил')+' '+(s.d||''):s.st==='now'?'ждёт решения':s.st==='ret'?'вернул '+(s.d||''):s.st==='rej'?'отклонил '+(s.d||''):'в очереди'}</em>${s.c?`<small>${esc(s.c)}</small>`:''}</div>`).join('<i class="ra">→</i>')}</div>
<div class="g21"><div>
 <div class="pan"><h3>Обсуждение</h3>${a.msgs.map(m=>`<div class="msg"><b>${esc(m.who)}</b><code>${m.t}</code><p>${esc(m.txt)}</p></div>`).join('')||'<p class="mut">Пока без комментариев.</p>'}<div class="mrow"><input class="sel" id="apm" placeholder="Написать участникам процесса"><button class="bt" onclick="apMsg()">Отправить</button></div></div>
 <div class="pan"><h3>Файлы процесса</h3>${a.files.map(f=>`<div class="dv"><div><em>${esc(f)}</em></div><button class="bt sm" onclick="toast('Файл открыт')">Открыть</button></div>`).join('')||'<p class="mut">Файлов нет.</p>'}<button class="bt sm" onclick="apFile()">Прикрепить файл</button></div>
</div><div>
 <div class="pan decide">${a.st==='run'&&now?`<h3>Решение: ${RT[now.r]} · ${esc(now.who)}</h3><div class="kv"><span>Сумма</span><b>${tg(a.sum)}</b></div><div class="kv"><span>Сделка</span><b>${a.deal} · ${tg(DL(a.deal).sum)}</b></div><textarea class="ta" id="apc" placeholder="Комментарий к решению (обязателен при возврате)"></textarea><button class="bt p full" onclick="apAct('ok')">Согласовать</button><button class="bt full" onclick="apAct('ret')">Вернуть на доработку</button><button class="bt full red" onclick="apAct('rej')">Отклонить</button><p class="mut sm2">В рабочей системе кнопки видит только тот, чей сейчас шаг. В демо можно пройти весь маршрут.</p>`:`<h3>Итог</h3><p>${apSt(a)}</p>${a.st==='ret'?`<button class="bt p full" onclick="apRestart()">Доработал — отправить снова</button>`:''}<button class="bt full" onclick="go('areg')">К реестру</button>`}</div>
 ${said('Важно согласование документов и оплат, поэтапно, где участвуют сразу несколько человек. И чтобы обсуждения и файлы оставались внутри процесса.','Маршрут, решения, комментарии и файлы — в одном процессе и в истории сделки.','Айкера, 17.11')}
</div></div>`};
let ARF='all';
SC.areg=()=>{const L=APPR.filter(a=>ARF==='all'||a.st===ARF);return `<div class="hd"><div><h2>Реестр согласований</h2><p>Все процессы компании: что ждёт решения, у кого застряло, сколько длится. Фильтр по статусу, переход в процесс в один клик.</p></div><div class="btns"><div class="seg">${[['all','Все'],['run','В работе'],['ret','Возвращены'],['done','Согласованы'],['rej','Отклонены']].map(([k,n])=>`<a class="${ARF===k?'on':''}" onclick="ARF='${k}';render()">${n}</a>`).join('')}</div></div></div>
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>№</th><th>Процесс</th><th>Тип</th><th>Инициатор</th><th>Сейчас у кого</th><th class="r">Сумма</th><th>Статус</th></tr></thead><tbody>${L.map(a=>{const n=a.steps.find(s=>s.st==='now');return `<tr onclick="APS='${a.id}';go('appr')"><td class="mono">${a.id}</td><td><b>${esc(a.title)}</b><br><small class="mut">${a.d}</small></td><td>${ATYPE[a.type]}</td><td>${esc(a.init)}</td><td>${n?RT[n.r]+' · '+esc(n.who):'—'}</td><td class="r">${tg(a.sum)}</td><td>${apSt(a)}</td></tr>`}).join('')}</tbody></table></div></div>
<div class="g2"><div class="pan"><h3>Сколько ждут решения</h3><div class="kv"><span>Финансист</span><b>1 ч 20 мин</b></div><div class="kv"><span>Директор</span><b class="bad">5 ч 10 мин</b></div><div class="kv"><span>Юрист</span><b>3 ч 05 мин</b></div><div class="kv"><span>Руководитель салона</span><b>25 мин</b></div></div><div class="pan"><h3>Напоминания</h3><p>Если шаг висит дольше 4 часов — участник получает напоминание, через 24 часа — руководитель. Пороги меняются в конструкторе.</p></div></div>`};
const TP=()=>TPL.find(t=>t.id===TPS)||TPL[0];
function tpAdd(r){TP().steps.push(r);toast('Шаг «'+RT[r]+'» добавлен в маршрут.');render()}
function tpDel(i){TP().steps.splice(i,1);render()}
function tpUp(i){if(!i)return;const s=TP().steps;[s[i-1],s[i]]=[s[i],s[i-1]];render()}
SC.abuild=()=>{const t=TP();return `<div class="hd"><div><h2>Конструктор маршрутов</h2><p>Ваши ~10 процессов из Битрикса не переносим как есть — собираем заново по их логике. Маршрут: кто и в каком порядке согласует, при каком условии. Меняет специалист CRM без программиста.</p></div><div class="btns"><button class="bt p" onclick="toast('Шаблон «'+'${esc(t.n)}'+'» сохранён. Новые процессы пойдут по нему.')">Сохранить шаблон</button></div></div>
<div class="g21"><div><div class="pan"><h3>Шаблоны</h3>${TPL.map(x=>`<div class="dv ${x.id===t.id?'sel1':''}" onclick="TPS='${x.id}';render()" style="cursor:pointer"><div><em>${esc(x.n)}</em><span>условие: ${esc(x.cond)}</span></div><b>${x.steps.length} шага</b></div>`).join('')}</div>
 <div class="pan"><h3>Маршрут «${esc(t.n)}»</h3><div class="route">${['init'].concat(t.steps).map((r,i)=>`<div class="rs ${i?'wait':'ok'}"><code>${i?'Шаг '+i:'Старт'}</code><b>${r==='init'?'Инициатор':RT[r]}</b>${i?`<span><a onclick="tpUp(${i-1})">↑ выше</a> · <a onclick="tpDel(${i-1})">убрать</a></span>`:'<span>кто запускает</span>'}</div>`).join('<i class="ra">→</i>')}</div>
 <div class="fld"><label>Добавить шаг</label><div class="zseg">${Object.entries(RT).map(([k,n])=>`<button onclick="tpAdd('${k}')">+ ${n}</button>`).join('')}</div></div></div></div><div>
 <div class="pan"><h3>Правила</h3><div class="kv"><span>Запуск</span><b>${esc(t.cond)}</b></div><div class="kv"><span>Напоминание участнику</span><b>через 4 ч</b></div><div class="kv"><span>Эскалация руководителю</span><b>через 24 ч</b></div><div class="kv"><span>Возврат</span><b>только с комментарием</b></div><div class="kv"><span>После согласования</span><b>сделка идёт на следующий этап</b></div></div>
 <div class="pan"><h3>Что перенесём из Битрикса</h3><p>Пришлите скриншоты или схемы ваших процессов — соберём такие же маршруты здесь. Историю старых согласований переносим через API Битрикса, где он её отдаёт.</p></div>
</div></div>`};
/* ===== Связь ===== */
let IBX=0;
const IB=[{n:'Айгерим Нурланова',ch:'wa',last:'Сколько стоит «Милано» с установкой?',t:'12:58',msgs:[['in','Здравствуйте! Нужны межкомнатные двери, 6 штук.'],['in','Сколько стоит «Милано» с установкой?']]},{n:'Дмитрий К.',ch:'ig',last:'Конкурент даёт дешевле на 12%',t:'12:10',msgs:[['in','Видел у вас в профиле двери со скрытым коробом.'],['out','Добрый день! Это «Лофт», под покраску. Пригласить на замер?'],['in','Конкурент даёт дешевле на 12%']]},{n:'ТОО «Нур Девелопмент»',ch:'web',last:'Заявка с сайта: паркет 420 м²',t:'12:41',msgs:[['in','Заявка с сайта: паркет дуб, 420 м², ЖК «Нур», Астана. Нужен расчёт до пятницы.']]},{n:'Студия «Лофт»',ch:'tgm',last:'Пришлите каталог скрытых дверей',t:'11:02',msgs:[['in','Пришлите каталог скрытых дверей, пожалуйста']]}];
function ibSend(){const v=(document.getElementById('ibm')||{}).value;if(!v)return;IB[IBX].msgs.push(['out',v]);render()}
SC.inbox=()=>{const c=IB[IBX];return `<div class="hd"><div><h2>Входящие каналы</h2><p>WhatsApp, Instagram Direct, Telegram-бот и заявки с сайта — в одном окне. Каждый диалог привязан к клиенту и сделке, история не теряется при смене менеджера.</p></div></div>
<div class="chatw"><div class="pan clist">${IB.map((x,i)=>`<div class="ci ${i===IBX?'on':''}" onclick="IBX=${i};render()"><b>${esc(x.n)}</b><code>${CH[x.ch]} · ${x.t}</code><span>${esc(x.last)}</span></div>`).join('')}</div>
<div class="pan"><h3>${esc(c.n)} · ${CH[c.ch]}</h3><div class="feed">${c.msgs.map(m=>`<div class="fi ${m[0]}">${esc(m[1])}</div>`).join('')}</div><div class="mrow"><input class="sel" id="ibm" placeholder="Ответить в ${CH[c.ch]}"><button class="bt p" onclick="ibSend()">Отправить</button></div><div class="btns l"><button class="bt sm" onclick="toast('Создан лид в воронке колл-центра.');go('kc')">Создать лид</button><button class="bt sm" onclick="go('deal')">Открыть сделку</button></div></div></div>
<div class="pan"><h3>Как подключаем WhatsApp — три варианта</h3><div class="tw"><table class="t"><thead><tr><th>Вариант</th><th>Переписка в системе</th><th>Звонки WhatsApp</th><th>Запись звонков</th><th>Что учесть</th></tr></thead><tbody>
<tr><td><b>Coexistence</b> — приложение WhatsApp Business остаётся на телефоне</td><td>да</td><td>да, с телефона</td><td>нет</td><td>рекомендуем: номер не меняется, менеджеры звонят как раньше</td></tr>
<tr><td><b>WhatsApp Business API (WABA)</b></td><td>да</td><td>нет</td><td>нет</td><td>шаблоны и модерация Meta, оплата за диалоги</td></tr>
<tr><td><b>Звонки через Meta Calling API</b></td><td>да</td><td>да</td><td>да</td><td>долго: приложение на одобрение Meta, работает не всегда</td></tr></tbody></table></div><p class="mut">Звонки с записью надёжно делаем через IP-телефонию — см. «Телефония и записи».</p></div>`};
SC.calls=()=>`<div class="hd"><div><h2>Телефония и записи</h2><p>IP-телефония: звонок из карточки в один клик, всплывающая карточка клиента при входящем, запись каждого разговора, пропущенные — задача на перезвон.</p></div></div>
<div class="g21"><div class="pan"><h3>Журнал звонков · сегодня</h3><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Клиент</th><th>Тип</th><th>Сотрудник</th><th class="r">Длит.</th><th>Запись</th></tr></thead><tbody>${[['12:51','Айгерим Нурланова','входящий','Дана','3:12'],['12:30','ТОО «Нур Девелопмент»','исходящий','Тимур','7:45'],['12:02','+7 707 118 40 22','пропущенный','—','—'],['11:44','Сауле Бекова','исходящий','Бекзат','2:05'],['11:10','Дмитрий Ковалёв','входящий','Руслан','5:31']].map(r=>`<tr><td class="mono">${r[0]}</td><td>${esc(r[1])}</td><td>${r[2]==='пропущенный'?tag(r[2],'r'):tag(r[2])}</td><td>${r[3]}</td><td class="r">${r[4]}</td><td>${r[4]==='—'?`<button class="bt sm" onclick="toast('Задача «Перезвонить» поставлена оператору.')">Перезвонить</button>`:`<button class="bt sm" onclick="toast('Воспроизведение записи ${r[4]}')">▸ ${r[4]}</button>`}</td></tr>`).join('')}</tbody></table></div></div>
<div><div class="pan"><h3>Показатели</h3><div class="kv"><span>Звонков сегодня</span><b>148</b></div><div class="kv"><span>Пропущенных</span><b class="bad">6</b></div><div class="kv"><span>Перезвонили за 15 минут</span><b>5 из 6</b></div><div class="kv"><span>Средняя длительность</span><b>3:40</b></div></div>
${said('Это базовые коммуникаторы с клиентом: IP-телефония, WhatsApp. Ничего сверхъестественного.','Подключаем вашу АТС (любой оператор с API), записи хранятся на вашем сервере.','Алексей, 17.11')}</div></div>`;
let ICX=0;const ICH=[{n:'Салон «Абая»',msgs:[['Руслан','Образцы «Милано» закончились, нужны к пятнице'],['Асель','Передам со Есентая два полотна']]},{n:'Финансы и закупки',msgs:[['Мадина','Фабрика просит предоплату до 20.11'],['Алексей','Смотрю согласование СГ-317']]},{n:'Монтаж Астана',msgs:[['Ерлан','ЖК «Нур»: на 7 этаже проёмы не по проекту, фото в сделке']]}];
function icTask(){const c=ICH[ICX];const m=c.msgs[c.msgs.length-1];TASKS.unshift({id:Date.now(),t:m[1],who:m[0],due:'завтра',auto:false,src:'Из чата «'+c.n+'»',done:false});toast('Задача создана из сообщения.')}
function icSend(){const v=(document.getElementById('icm')||{}).value;if(!v)return;ICH[ICX].msgs.push([ROLES[role].n.split(' ·')[0],v]);render()}
SC.ichat=()=>{const c=ICH[ICX];return `<div class="hd"><div><h2>Внутренние чаты</h2><p>Чаты салонов, отделов и проектов вместо личных мессенджеров. Сообщение можно превратить в задачу, файлы и история остаются в компании.</p></div></div>
<div class="chatw"><div class="pan clist">${ICH.map((x,i)=>`<div class="ci ${i===ICX?'on':''}" onclick="ICX=${i};render()"><b>${esc(x.n)}</b><span>${esc(x.msgs[x.msgs.length-1][1])}</span></div>`).join('')}</div>
<div class="pan"><h3>${esc(c.n)}</h3>${c.msgs.map(m=>`<div class="msg"><b>${esc(m[0])}</b><p>${esc(m[1])}</p></div>`).join('')}<div class="mrow"><input class="sel" id="icm" placeholder="Сообщение в чат"><button class="bt p" onclick="icSend()">Отправить</button></div><div class="btns l"><button class="bt sm" onclick="icTask()">Сделать задачей</button></div></div></div>
<div class="pan"><h3>Почему внутри системы</h3><p>Переписка сотрудников о клиенте остаётся у компании, даже если сотрудник уходит. Доступ к чатам — по ролям.</p></div>`};
function addTask(){TASKS.unshift({id:Date.now(),t:'Новая задача',who:'Руслан',due:'завтра',auto:false,src:'Поставил '+ROLES[role].n.split(' ·')[0],done:false});render()}
SC.tasks=()=>`<div class="hd"><div><h2>Задачи и автозадачи</h2><p>Задачи ставит руководитель или система сама: новый лид, переход сделки на этап, запуск согласования, нет оплаты после договора. Просрочка подсвечивается.</p></div><div class="btns"><button class="bt p" onclick="addTask()">+ Задача</button></div></div>
<div class="g2"><div class="pan"><h3>Открытые</h3>${TASKS.filter(t=>!t.done).map(t=>`<div class="dv"><div><em class="${t.late?'bad':''}">${esc(t.t)}</em><span>${esc(t.who)} · ${esc(t.due)} · ${t.auto?'автозадача: ':''}${esc(t.src)}</span></div><button class="bt sm" onclick="TASKS.find(x=>x.id===${t.id}).done=true;render()">Готово</button></div>`).join('')}</div>
<div class="pan"><h3>Правила автозадач</h3>${[['Новый лид без ответа 10 мин','оператору КЦ'],['Сделка перешла на «Замер»','замерщику, с адресом'],['Запущено согласование','участнику текущего шага'],['Договор без предоплаты 3 дня','финансисту'],['Монтаж завтра','бригаде и клиенту — напоминание']].map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}<h3 style="margin-top:12px">Выполнено</h3>${TASKS.filter(t=>t.done).map(t=>`<div class="dv done"><div><em>${esc(t.t)}</em><span>${esc(t.who)}</span></div>${tag('готово','g')}</div>`).join('')}</div></div>`;
/* ===== Склад ===== */
SC.stock=()=>`<div class="hd"><div><h2>Образцы и склад</h2><p>Образцы в шоурумах и остатки складских позиций по городам. Заказные двери и паркет ведутся по сделкам: заказ у фабрики, поставка, отгрузка на объект.</p></div><div class="btns"><button class="bt" onclick="xls()">Excel</button></div></div>
${cityBar()}
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Позиция</th><th>Тип</th><th class="r">Алматы</th><th class="r">Астана</th><th class="r">Шымкент</th><th>Статус</th></tr></thead><tbody>${[['Полотно «Милано» 800 (образец)','образец',2,1,1],['Полотно «Лофт» под покраску','складская',14,6,3],['Входная «Термо» 960','складская',3,2,0],['Паркет дуб натур, м²','складская',186,92,40],['Подложка пробковая, рулон','складская',22,9,4],['Плинтус шпон дуба, шт','складская',140,60,0],['Фурнитура «Стандарт», компл.','складская',48,30,12]].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="r">${r[2]}</td><td class="r">${r[3]}</td><td class="r ${r[4]?'':'bad'}">${r[4]}</td><td>${r[4]?tag('есть','g'):tag('перемещение','w')}</td></tr>`).join('')}</tbody></table></div></div>
<div class="g2"><div class="pan"><h3>Заказы у фабрик</h3><div class="kv"><span>«Волховец» · двери · D-1182</span><b>отгрузка 25.11</b></div><div class="kv"><span>«Барлинек» · паркет · D-1186</span><b>ждём оплату</b></div><div class="kv"><span>«Софья» · ЖК «Нур» · 48 дверей</span><b>в пути</b></div></div><div class="pan"><h3>По желанию</h3><p>Полноценный склад с ячейками, приходами и инвентаризацией подключаем, когда понадобится. Обмен с 1С — позже, отдельным пакетом.</p></div></div>`;
/* ===== Система ===== */
SC.sec=()=>`<div class="hd"><div><h2>Безопасность и ваш сервер</h2><p>Система и база клиентов — на сервере, оформленном на вашу компанию, в Казахстане. Никаких российских облаков и сервисов в цепочке. Код и доступы — у вас.</p></div></div>
${said('Персональные данные наших клиентов должны быть в сохранности, на нашем сервере, чтобы никакие атаки не остановили работу.','Свой сервер в Казахстане, шифрование, роли, журнал доступа и ежедневные копии.','Айкера, 17.11')}
<div class="g2"><div class="pan"><h3>Где хранятся данные</h3><div class="kv"><span>Сервер</span><b>PS.kz, Казахстан · на ваше ТОО</b></div><div class="kv"><span>Резервная копия</span><b>каждый день · второе облако (не РФ)</b></div><div class="kv"><span>Хранение копий</span><b>30 дней</b></div><div class="kv"><span>Восстановление</span><b>до 2 часов</b></div><div class="kv"><span>Стоимость сервера</span><b>≈ 15–20 тыс. ₸ / мес</b></div><div class="kv"><span>Российские сервисы</span><b class="ok">не используются</b></div></div>
<div class="pan"><h3>Защита</h3>${[['Шифрование соединения (HTTPS) и паролей','включено'],['Вход с подтверждением кода для руководителя и финансов','включено'],['Права по ролям: менеджер видит только свои сделки','включено'],['Журнал: кто, когда открыл и изменил карточку','включено'],['Выгрузка базы — только руководитель','включено'],['Блокировка доступа уволенного сотрудника в один клик','включено']].map(r=>`<div class="kv"><span>${r[0]}</span><b class="ok">${r[1]}</b></div>`).join('')}</div></div>
<div class="pan"><h3>Журнал доступа · сегодня</h3><div class="tw"><table class="t sm"><thead><tr><th>Время</th><th>Кто</th><th>Действие</th><th>Где</th></tr></thead><tbody>${[['12:58','Дана','открыла лид L-2041','Колл-центр'],['12:40','Мадина','согласовала шаг СГ-317','Согласования'],['12:31','Руслан','изменил скидку D-1187: 10% → 12%','Сделка'],['11:05','Алексей','выгрузил отчёт по городам','Отчёты'],['09:12','Система','резервная копия 2,4 ГБ · успешно','Сервер']].map(r=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div><div class="btns l"><button class="bt" onclick="toast('Тест восстановления: копия от 18.11 09:12 развёрнута на тестовом сервере за 38 минут.')">Проверить восстановление</button></div></div>`;
SC.move=()=>`<div class="hd"><div><h2>Переезд с Битрикс24</h2><p>Работа не останавливается: пока мы собираем систему, вы работаете в Битриксе. Переносим данные, проверяем, переключаем сотрудников за один день.</p></div></div>
<div class="flow4"><div><b>1</b>Доступ к API Битрикс24 — выгружаем контакты, компании, сделки, файлы</div><div><b>2</b>Сопоставляем поля и этапы, переносим на тестовый сервер, сверяем количество</div><div><b>3</b>Процессы согласований собираем заново по вашим схемам</div><div><b>4</b>Обучаем, переключаем всех в один день, Битрикс — только для чтения</div></div>
<div class="g2"><div class="pan"><h3>Что переносим</h3>${[['Контакты','тысячи · с телефонами и историей','входит'],['Компании','с реквизитами и БИН','входит'],['Текущие сделки','с этапами и суммами','входит'],['Файлы сделок','договоры, КП, фото замеров','входит'],['Задачи','открытые','входит'],['История бизнес-процессов','через API, где Битрикс её отдаёт','по возможности'],['Логика процессов (~10)','собираем заново в конструкторе','входит']].map(r=>`<div class="kv"><span>${r[0]} <small class="mut">· ${r[1]}</small></span><b class="${r[2]==='входит'?'ok':''}">${r[2]}</b></div>`).join('')}</div>
<div class="pan"><h3>Сверка после переноса</h3><div class="tw"><table class="t sm"><thead><tr><th>Данные</th><th class="r">Битрикс24</th><th class="r">Новая система</th><th></th></tr></thead><tbody>${[['Контакты',8412,8412],['Компании',1196,1196],['Сделки в работе',214,214],['Файлы',3870,3870]].map(r=>`<tr><td>${r[0]}</td><td class="r">${fmt(r[1])}</td><td class="r">${fmt(r[2])}</td><td>${tag('совпало','g')}</td></tr>`).join('')}</tbody></table></div><p class="mut">Цифры условные — точные получим после выгрузки.</p></div></div>
${said('Вы перенесёте контакты, компании, текущие сделки? А процессы по согласованию документов и оплат?','Данные — переносим за неделю. Процессы — собираем заново по вашим схемам, историю — через API по возможности.','Айкера, 17.11')}`;
const PERM=['Пульт и деньги','Все города','Свой салон','Сделки: свои','Скидка до 10%','Согласования: решение','Конструктор процессов','Выгрузка базы','Журнал доступа'];
const PM={'Руководитель':'111011111','Специалист CRM':'110011011','Оператор КЦ':'001100000','Менеджер салона':'001110000','Финансист':'110011000','Замерщик / монтажник':'000100000'};
SC.roles=()=>`<div class="hd"><div><h2>Роли и права</h2><p>25 пользователей, у каждого свой вход. Права настраивает специалист CRM галочками: кто видит деньги, другие города, кто решает в согласованиях и кто может выгрузить базу.</p></div></div>
<div class="pan"><div class="tw"><table class="t perm"><thead><tr><th>Роль</th>${PERM.map(p=>`<th class="c">${p}</th>`).join('')}</tr></thead><tbody>${Object.keys(PM).map(r=>`<tr><td><b>${r}</b><br><small class="mut">${esc(ROLES[r].n)}</small></td>${PM[r].split('').map((v,i)=>`<td class="c"><span class="pm ${v==='1'?'on':''}" onclick="this.classList.toggle('on');toast('Право «${PERM[i]}» изменено для роли «${r}».')">${v==='1'?'✓':''}</span></td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
<div class="g2"><div class="pan"><h3>Пользователи</h3><div class="kv"><span>Всего</span><b>25</b></div><div class="kv"><span>Ограничение по числу</span><b>нет</b></div><div class="kv"><span>Плата за пользователя</span><b>0 ₸</b></div></div><div class="pan"><h3>Увольнение сотрудника</h3><p>Одна кнопка — доступ закрыт, его сделки, клиенты и чаты переходят другому менеджеру. Ничего не уходит вместе с человеком.</p></div></div>`;
let ONEC=false;
SC.launch=()=>{const t=2500000+(ONEC?800000:0);return `<div class="hd"><div><h2>Стоимость</h2><p>Своя система вместо Битрикс24: только нужное вам, на вашем сервере, без абонплаты. Цена фиксированная, без НДС.</p></div></div>
<div class="g21"><div>
 <div class="pan"><h3>Что входит в 2 500 000 ₸</h3>${['Воронки колл-центра и продаж по салонам и городам','Карточка сделки: чаты, звонки, расчёты, документы, задачи','Калькуляторы дверей и паркета с сохранением в клиента, КП по шаблону','Бизнес-процессы согласований: конструктор, до 10 маршрутов, обсуждения и файлы','Задачи и автозадачи, внутренние чаты','WhatsApp, Instagram Direct, Telegram-бот, заявки с сайта, IP-телефония с записями','Отчёты и показатели, выгрузка в Excel','Сервер в Казахстане, ежедневные копии, роли и журнал доступа','Перенос из Битрикс24: контакты, компании, сделки, файлы','Обучение, передача кода и доступов, 3 месяца поддержки'].map(x=>`<div class="ck">✓ ${x}</div>`).join('')}</div>
 <div class="pan opt ${ONEC?'on':''}" onclick="ONEC=!ONEC;render()" style="cursor:pointer"><code>${ONEC?'✓ ВКЛЮЧЕНО':'ПО ЖЕЛАНИЮ · ПОЗЖЕ'}</code><h3>Интеграция с 1С · +800 000 ₸</h3><p>Когда понадобится: обмен контрагентами, счетами и оплатами с 1С.</p></div>
</div><div>
 <div class="pan price"><h3>Итого</h3><div class="kv tot"><span>Стоимость</span><b>${tg(t)}</b></div><div class="kv"><span>Срок</span><b>4–6 недель</b></div><div class="kv"><span>Старт · 30%</span><b>${tg(t*.3)}</b></div><div class="kv"><span>База на сервере · 40%</span><b>${tg(t*.4)}</b></div><div class="kv"><span>Сдача · 30%</span><b>${tg(t*.3)}</b></div><div class="kv"><span>Абонплата</span><b>0 ₸</b></div><div class="kv"><span>Сервер</span><b>≈ 15–20 тыс. ₸ / мес</b></div><div class="kv"><span>Доработки после поддержки</span><b>$20 / час</b></div></div>
 ${said('Если есть экономическая выгода и плюс безопасность — всё на нашем сервере — я готов.','Платите один раз. Пользователи без ограничений, доработки — своими силами или у нас.','Алексей, 17.11')}
</div></div>`};
/* ===== Каркас ===== */
function searchDemo(v){if(!v)return;CLQ=v.toLowerCase();go('clients')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map((s,i)=>`<a class="ri ${s.k===SECOF[cur]?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><code>${String(i+1).padStart(2,'0')}</code><span>${s.n}</span><small>${s.d}</small></a>`).join('');
 const S=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=S.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('');
 const h=document.getElementById('shint');if(h)h.innerHTML=`<b>${esc(role)}</b>${esc(ROLES[role].note)}`}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Дуб и Дверь';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function xls(){const h=`<html><head><meta charset="utf-8"></head><body><table border="1"><tr><th>Сделка</th><th>Клиент</th><th>Салон</th><th>Этап</th><th>Сумма</th></tr>${DEALS.map(d=>`<tr><td>${d.id}</td><td>${esc(CLN(d.cl))}</td><td>${esc(salN(d.sal))}</td><td>${stN(d.st)}</td><td>${d.sum}</td></tr>`).join('')}</table></body></html>`;try{const b=new Blob(['\ufeff'+h],{type:'application/vnd.ms-excel'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='Сделки_'+TODAY+'.xls';document.body.appendChild(a);a.click();a.remove()}catch(e){}toast('Файл <b>Сделки.xls</b> скачан.')}
let theme='light';function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme()}
const TOUR=[['dash','1 · Пульт: три города, сделки по этапам, что ждёт вашего решения.'],['kc','2 · Колл-центр: все каналы → квалификация → передача в салон.'],['funnel','3 · Воронка продаж: от замера до монтажа.'],['deal','4 · Карточка сделки: чат, звонки, расчёты, документы — всё внутри.'],['cdoor','5 · Калькулятор дверей: расчёт сохраняется в клиента.'],['appr','6 · Согласование скидки: шаг за шагом, с обсуждением и файлами.'],['abuild','7 · Конструктор маршрутов: ваши процессы без программиста.'],['inbox','8 · WhatsApp, Instagram, Telegram, сайт — одно окно.'],['sec','9 · Ваш сервер в Казахстане, копии, журнал доступа.'],['move','10 · Переезд с Битрикс24 без остановки.'],['launch','11 · 2,5 млн ₸ без НДС, 4–6 недель, без абонплаты.']];
let ti=-1,tRun=false;function tour(){if(tRun){tRun=false;return}tRun=true;ti=-1;step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){tRun=false;toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Руководитель');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false}
/* ===== По присланным скриншотам Битрикс24: лиды, мультиворонки с правами, документация и таймлайн, выплаты, автоматизации ===== */
(function(){
 const sale=SEC.find(s=>s.k==='sale');sale.sub.splice(0,0,['leads','Лиды']);
 const ap=SEC.find(s=>s.k==='appr');ap.sub.push(['auto','Автоматизации']);
 SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
 ['leads','auto'].forEach(k=>{if(ALL.indexOf(k)<0)ALL.push(k)});
 const add=(r,ks)=>ks.forEach(k=>{if(ROLES[r].s.indexOf(k)<0)ROLES[r].s.push(k)});
 add('Руководитель',['leads','auto']);add('Специалист CRM',['leads','auto']);add('Оператор КЦ',['leads']);add('Финансист',['appr']);
})();
const BXQ='Канбан как канбан — внутри настроены бизнес-процессы: от распределения сделок до присвоения источников.';
/* --- Лиды --- */
const LST=[['onl','Новый онлайн-лид'],['touch','Касание (совершён звонок)'],['noans','Нет ответа (3 звонка и 1 SMS)'],['work','В работе'],['fin','В работе — итог'],['deal','Сделка создана'],['junk','Брак']];
const LSRC=['Facebook','Сайт','Внесён вручную','Telegram','Instagram','WhatsApp'];
const LPOINT=['Студия дверей','ТГ салон 1','ТГ салон 2','Дизайнер','Сайт','Входные двери'];
let BL=[
 {id:'Л-5120',n:'Новый лид с Facebook',ph:'+7 701 220 41 18',src:'Facebook',pt:'Студия дверей',op:'Оператор КЦ',st:'onl',t:'1 мин назад',calls:0,sms:0},
 {id:'Л-5119',n:'Бауыржан',ph:'+7 705 118 30 44',src:'Внесён вручную',pt:'ТГ салон 1',op:'Оператор КЦ',st:'touch',t:'сегодня 18:46',calls:1,sms:0},
 {id:'Л-5118',n:'Ерасыл, Астана',ph:'+7 777 403 15 62',src:'Сайт',pt:'Студия дверей',op:'Оператор КЦ',st:'touch',t:'сегодня 18:20',calls:2,sms:0},
 {id:'Л-5117',n:'1 звонок',ph:'+7 708 551 72 90',src:'Внесён вручную',pt:'Студия дверей',op:'Оператор КЦ',st:'noans',t:'сегодня 18:51',calls:3,sms:1},
 {id:'Л-5116',n:'Аружан',ph:'+7 747 210 63 05',src:'Instagram',pt:'Дизайнер',op:'Оператор КЦ',st:'noans',t:'вчера',calls:3,sms:1},
 {id:'Л-5115',n:'Нурлан, Усть-Каменогорск',ph:'+7 702 330 18 77',src:'Внесён вручную',pt:'ТГ салон 2',op:'Менеджер Асель',st:'work',t:'сегодня 16:28',calls:2,sms:0},
 {id:'Л-5114',n:'Ильяс, Астана',ph:'+7 701 744 09 31',src:'WhatsApp',pt:'Входные двери',op:'Менеджер Асель',st:'work',t:'сегодня 14:47',calls:1,sms:0},
 {id:'Л-5113',n:'Ардак, Алматы',ph:'+7 705 662 48 13',src:'Telegram',pt:'ТГ салон 1',op:'Менеджер Асель',st:'fin',t:'15 ноября',calls:4,sms:1}
];
let LDRAG=null;
function blMove(id,st){const l=BL.find(x=>x.id===id);if(!l)return;l.st=st;
 if(st==='deal'){PD.unshift({id:'Сд-'+(4200+PD.length),p:'r1',n:l.n,sum:0,rep:false,ct:'Клиенты',src:l.pt,resp:'Руслан',obs:['Руководитель салона'],st:'inv',dref:'D-1187'});toast('Лид <b>'+esc(l.n)+'</b> сконвертирован в сделку воронки «Розница · салон 1». Ответственный назначен автоматически.')}
 else if(st==='junk')toast('Лид закрыт как брак, причина сохраняется.');else toast('Лид → «'+LST.find(x=>x[0]===st)[1]+'».');render()}
function blCall(id){const l=BL.find(x=>x.id===id);l.calls++;if(l.st==='onl')l.st='touch';blRule(l,'Звонок '+l.calls+' из 3: не дозвонились.')}
function blSms(id){const l=BL.find(x=>x.id===id);l.sms++;blRule(l,'SMS отправлено клиенту.')}
function blRule(l,msg){if(l.calls>=3&&l.sms>=1&&['onl','touch'].includes(l.st)){l.st='noans';toast('Правило сработало: 3 звонка и 1 SMS — лид <b>'+esc(l.n)+'</b> автоматически в «Нет ответа».')}else toast(msg);render()}
function blAdd(){BL.unshift({id:'Л-'+(5121+BL.length),n:'Новый лид с сайта',ph:'+7 7__ ___ __ __',src:'Сайт',pt:'Студия дверей',op:'Оператор КЦ',st:'onl',t:'только что',calls:0,sms:0});toast('Быстрый лид создан. Источник «Сайт» присвоен автоматически по каналу.');render()}
SC.leads=()=>`<div class="hd"><div><h2>Лиды</h2><p>Как у вас сейчас в Битрикс24: стадии от «Нового онлайн-лида» до итога. Карточки перетаскиваются; на телефоне — кнопки. Правило: после 3 звонков и 1 SMS лид сам уходит в «Нет ответа».</p></div><div class="btns"><button class="bt p" onclick="blAdd()">+ Быстрый лид</button><button class="bt" onclick="go('auto')">Автоматизации</button></div></div>
<div class="kanban lk">${LST.map(([k,n])=>{const L=BL.filter(l=>l.st===k);return `<div class="kcol" ondragover="event.preventDefault()" ondrop="if(LDRAG)blMove(LDRAG,'${k}')"><div class="kh"><b>${n}</b><span>${L.length}</span></div><div class="ksum">0 ₸</div>${L.map(l=>`<div class="kc" draggable="true" ondragstart="LDRAG='${l.id}'"><code>${l.id} · ${esc(l.t)}</code><b>${esc(l.n)}</b><span>Источник: ${esc(l.src)}</span><span>Ответственный: ${esc(l.op)}</span><span>Источник звонка: <strong>${esc(l.pt)}</strong></span><span class="mut">Звонков ${l.calls}/3 · SMS ${l.sms}/1</span><div class="kact"><button class="bt sm" onclick="blCall('${l.id}')">Звонок</button><button class="bt sm" onclick="blSms('${l.id}')">SMS</button>${k!=='deal'&&k!=='junk'?`<button class="bt sm" onclick="blMove('${l.id}','deal')">В сделку</button>`:''}</div></div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>
${said(BXQ,'Стадии, поле «Источник звонка (обращения)» и правило «3 звонка + 1 SMS» — перенесены как у вас. Ничего лишнего.','Айкера, по скриншотам системы')}`;
/* --- Мультиворонки --- */
const PIPES=[['r1','Розница · салон 1','ret'],['r2','Розница · салон 2','ret'],['r3','Розница · Шымкент','ret'],['r4','Розница · салон 4','ret'],['std','Студия дверей','ret'],['prod','Производство','prod'],['part','Перегородки','ret'],['okk','ОКК','okk'],['ent','Входные двери','ret'],['corp','Корпоратив','ret'],['diz','Дизайнеры','ret'],['arch','Архив','arch'],['all','Общая','ret']];
const PST={ret:[['inv','Клиент приглашён в салон'],['vis','Клиент посетил салон'],['hold','Отложка'],['zam','Заявка на замер'],['calc','Расчёт и КП'],['dog','Договор и предоплата'],['fab','Заказ на производстве'],['out','Заказ вышел с производства'],['wh','Заказ на складе'],['mont','Доставка и монтаж'],['done','Закрыто']],
 prod:[['acc','Заказ принят'],['work','В производстве'],['out','Заказ вышел с производства'],['wh','Заказ на складе'],['ship','Отгружено']],
 okk:[['call','Звонок качества'],['claim','Рекламация'],['fix','Устранение'],['ok','Клиент доволен']],arch:[['arch','В архиве']]};
const PIPE_ROLE={'Руководитель':PIPES.map(p=>p[0]),'Специалист CRM':PIPES.map(p=>p[0]),'Менеджер салона':['r1','all'],'Финансист':['prod','okk','corp','all'],'Оператор КЦ':['all']};
let PIPE='r1';
const PEOPLE=['Руслан','Асель','Тимур','Жанна','Бекзат','Руководитель салона','Алексей'];
let PD=[
 {id:'Сд-4188',p:'r1',n:'Карина, дизайнер',sum:0,rep:true,ct:'Дизайнер',src:'Дизайнер',resp:'Руслан',obs:['Алексей'],st:'inv',dref:'D-1185'},
 {id:'Сд-4187',p:'r1',n:'Анна, дизайнер-комплектатор',sum:1,rep:true,ct:'Дизайнер',src:'Дизайнер',resp:'Руслан',obs:['Асель','Руководитель салона'],st:'vis',dref:'D-1185'},
 {id:'Сд-4186',p:'r1',n:'Даулет',sum:500000,rep:false,ct:'Клиенты',src:'ТГ салон 1',resp:'Тимур',obs:['Руководитель салона','Алексей','Тимур'],st:'hold',dref:'D-1182'},
 {id:'Сд-4185',p:'r1',n:'Семья Сейткали · дизайнер Дана',sum:2960500,rep:false,ct:'Клиенты',src:'Дизайнер',resp:'Руслан',obs:['Руководитель салона','Асель','Жанна','Бекзат'],st:'zam',dref:'D-1187'},
 {id:'Сд-4184',p:'r1',n:'Мадияр, ЖК на Сатпаева',sum:1806900,rep:false,ct:'Клиенты',src:'Студия дверей',resp:'Руслан',obs:['Руководитель салона'],st:'calc',dref:'D-1187'},
 {id:'Сд-4183',p:'r1',n:'Гаухар',sum:2310000,rep:true,ct:'Клиенты',src:'Сайт',resp:'Руслан',obs:['Финансист'],st:'out',dref:'D-1181'},
 {id:'Сд-4182',p:'r1',n:'Олжас',sum:640000,rep:false,ct:'Клиенты',src:'Входные двери',resp:'Руслан',obs:[],st:'wh',dref:'D-1182'},
 {id:'Сд-4181',p:'r2',n:'Студия «Лофт»',sum:3410000,rep:true,ct:'Дизайнер',src:'Дизайнер',resp:'Асель',obs:['Руководитель салона'],st:'calc',dref:'D-1185'},
 {id:'Сд-4180',p:'r3',n:'Сауле Б.',sum:2050000,rep:false,ct:'Клиенты',src:'Сайт',resp:'Бекзат',obs:[],st:'zam',dref:'D-1184'},
 {id:'Сд-4179',p:'prod',n:'Заказ 11 дверей · Гульнара Ж.',sum:7920000,rep:false,ct:'Клиенты',src:'Сайт',resp:'Производство',obs:['Тимур'],st:'work',dref:'D-1183'},
 {id:'Сд-4178',p:'corp',n:'ТОО «Нур Девелопмент» · 48 дверей',sum:14400000,rep:true,ct:'Клиенты',src:'Корпоратив',resp:'Тимур',obs:['Алексей','Финансист'],st:'mont',dref:'D-1180'},
 {id:'Сд-4177',p:'okk',n:'Рекламация: перекос коробки',sum:0,rep:false,ct:'Клиенты',src:'ОКК',resp:'Жанна',obs:['Руководитель салона'],st:'claim',dref:'D-1179'},
 {id:'Сд-4176',p:'diz',n:'Дизайнер Айым · комиссия',sum:420000,rep:true,ct:'Дизайнер',src:'Дизайнер',resp:'Асель',obs:['Финансист'],st:'calc',dref:'D-1181'},
 {id:'Сд-4175',p:'all',n:'Общий запрос: паркет 200 м²',sum:6140000,rep:false,ct:'Клиенты',src:'Сайт',resp:'Тимур',obs:[],st:'calc',dref:'D-1186'}
];
let PDRAG=null;
const pipeOK=()=>PIPE_ROLE[role]||['all'];
function pdMove(id,st){const d=PD.find(x=>x.id===id);d.st=st;const n=(PST[PIPES.find(p=>p[0]===d.p)[2]].find(s=>s[0]===st)||['',''])[1];toast('Сделка '+d.id+' → «'+n+'». Наблюдатели ('+(d.obs.length||0)+') получили уведомление.');render()}
function pdQuick(st){PD.unshift({id:'Сд-'+(4189+PD.length),p:PIPE,n:'Быстрая сделка',sum:0,rep:false,ct:'Клиенты',src:'Внесён вручную',resp:ROLES[role].n.split(' ·')[0],obs:[],st,dref:'D-1187'});toast('Быстрая сделка создана. Ответственный — вы, источник можно поправить.');render()}
SC.funnel=()=>{const ok=pipeOK();if(ok.indexOf(PIPE)<0)PIPE=ok[0];const P=PIPES.find(p=>p[0]===PIPE);const ST=PST[P[2]];const D=PD.filter(d=>d.p===PIPE);
return `<div class="hd"><div><h2>Сделки · ${esc(P[1])}</h2><p>${PIPES.length} воронок, как у вас: салоны, студия, производство, перегородки, ОКК, входные двери, корпоратив, дизайнеры, архив, общая. Каждый видит только разрешённые ему воронки — сейчас роли «${esc(role)}» доступно ${ok.length}.</p></div><div class="btns"><select class="sel" onchange="PIPE=this.value;render()">${PIPES.filter(p=>ok.indexOf(p[0])>=0).map(p=>`<option value="${p[0]}" ${p[0]===PIPE?'selected':''}>${esc(p[1])}</option>`).join('')}</select><button class="bt" onclick="go('auto')">Роботы</button></div></div>
<div class="kanban pk" style="grid-template-columns:repeat(${ST.length},minmax(190px,1fr))">${ST.map(([k,n])=>{const L=D.filter(d=>d.st===k);return `<div class="kcol" ondragover="event.preventDefault()" ondrop="if(PDRAG)pdMove(PDRAG,'${k}')"><div class="kh"><b>${n}</b><span>${L.length}</span></div><div class="ksum">${tg(L.reduce((a,d)=>a+d.sum,0))}</div><button class="bt sm full" onclick="pdQuick('${k}')">+ Быстрая сделка</button>${L.map(d=>`<div class="kc" draggable="true" ondragstart="PDRAG='${d.id}'" onclick="DEAL='${d.dref}';go('deal')"><code>${d.id}</code><b>${esc(d.n)}</b>${d.rep?'<span class="mut">повторное обращение</span>':''}<em>${tg(d.sum)}</em><span>Ответственный: <strong>${esc(d.resp)}</strong></span>${d.obs.length?`<span>Наблюдатели: ${d.obs.map(esc).join(', ')}</span>`:''}<span>Источник: ${esc(d.src)} · ${esc(d.ct)}</span></div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>
<div class="g2"><div class="pan"><h3>Права на воронки</h3><div class="tw"><table class="t sm"><thead><tr><th>Роль</th><th>Видит воронки</th></tr></thead><tbody>${Object.entries(PIPE_ROLE).map(([r,ps])=>`<tr><td>${esc(r)}</td><td>${ps.length===PIPES.length?'все '+PIPES.length:ps.map(x=>esc(PIPES.find(p=>p[0]===x)[1])).join(', ')}</td></tr>`).join('')}</tbody></table></div><p class="mut">Переключите роль справа вверху — список воронок сократится.</p></div>
${said(BXQ,'Воронки, стадии, суммы по колонкам, наблюдатели и разделение прав — один в один с вашей схемой. Роботы — на экране «Автоматизации».','Айкера, по скриншотам системы')}</div>`};
/* --- Карточка сделки: основная документация + таймлайн --- */
const DOCF=[['zam','Бланк замера PDF скан',[['бланк.pdf','PDF']]],['kp','КП клиенту скан PDF',[['Просчёт для клиента.xlsx','XLSX'],['Перегородка расчёт.xlsx','XLSX'],['счёт подписанный.pdf','PDF']]],['dog','Договор',[['Договор_подписан.pdf','PDF']]],['act','Акт выполненных работ',[]],['foto','Фото объекта',[['проём_1.jpg','JPG'],['проём_2.jpg','JPG']]]];
let DOCV='tile';
let TL=[{k:'st',t:'16:14',d:'сегодня',a:'Заказ вышел с производства',b:'Заказ на складе'},{k:'wa',t:'14:53',d:'12 ноября',who:'Клиент',txt:'Хорошо',pin:false},{k:'wa',t:'14:53',d:'12 ноября',who:'Дизайнер Дана',txt:'Только нашли, отправляю размеры проёмов',pin:false},{k:'task',t:'11:20',d:'12 ноября',txt:'Дело: замер 13.11 в 11:00 — замерщик Ерлан'}];
function docUp(k){const f=DOCF.find(x=>x[0]===k);f[2].push([k==='foto'?'фото_'+(f[2].length+1)+'.jpg':'файл_'+(f[2].length+1)+'.pdf',k==='foto'?'JPG':'PDF']);toast('Файл загружен в поле «'+f[1]+'». Он виден всем участникам сделки.');render()}
function tlPin(i){TL[i].pin=!TL[i].pin;toast(TL[i].pin?'Комментарий закреплён вверху таймлайна.':'Откреплено.');render()}
function tlAdd(){const v=(document.getElementById('tlc')||{}).value;if(!v)return;TL.unshift({k:'cm',t:NOW,d:'сегодня',who:ROLES[role].n.split(' ·')[0],txt:v,pin:false});render()}
const docBlock=()=>`<div class="pan"><h3>Основная документация</h3><div class="seg sm">${[['tile','Плитка'],['list','Список'],['wide','По ширине']].map(([k,n])=>`<button class="${DOCV===k?'on':''}" onclick="DOCV='${k}';render()">${n}</button>`).join('')}</div>
${DOCF.map(([k,n,fs])=>`<div class="docf"><small>${esc(n)}</small><div class="docs ${DOCV}">${fs.map(f=>`<a class="dfile" onclick="toast('Файл открыт: ${esc(f[0])}')"><i class="ft ${f[1]}">${f[1]}</i><span>${esc(f[0])}</span></a>`).join('')}<a class="dfile up" onclick="docUp('${k}')"><i class="ft">+</i><span>Загрузить</span></a></div></div>`).join('')}</div>`;
const tlBlock=()=>{const L=TL.map((x,i)=>[x,i]).sort((a,b)=>(b[0].pin?1:0)-(a[0].pin?1:0));return `<div class="pan"><h3>Таймлайн</h3><div class="mrow"><input class="sel" id="tlc" placeholder="Комментарий, @упоминание"><button class="bt" onclick="tlAdd()">Добавить</button></div><div class="tl2">${L.map(([x,i])=>x.k==='st'?`<div class="tli2"><code>${x.d} · ${x.t} · Стадия изменена</code><span class="tag">${esc(x.a)}</span> → <span class="tag g">${esc(x.b)}</span></div>`:x.k==='task'?`<div class="tli2"><code>${x.d} · ${x.t} · Дело</code>${esc(x.txt)}</div>`:`<div class="tli2 ${x.pin?'pin':''}"><code>${x.d} · ${x.t} · ${x.k==='wa'?'Комментарий из WhatsApp':'Комментарий'}</code><b>${esc(x.who)}:</b> ${esc(x.txt)}<div><button class="bt sm" onclick="tlPin(${i})">${x.pin?'Открепить':'Закрепить'}</button></div></div>`).join('')}</div></div>`};
const _deal=SC.deal;
SC.deal=()=>{let h=_deal();h=h.replace(/<div class="pan"><h3>Документы<\/h3>[\s\S]*?(\n<\/div><div>\n <div class="pan"><h3>Сделка<\/h3>)/,(m,g)=>docBlock()+tlBlock()+g);if(h.indexOf('Основная документация')<0)h=h.replace('<div class="g21"><div>','<div class="g21"><div>'+docBlock()+tlBlock());
 return h.replace('<h3>Согласования по сделке</h3>','<h3>Согласования по сделке</h3><button class="bt sm" onclick="startPayout(\''+DEAL+'\')">Заявка на выплату</button> ')};
/* --- Согласование выплат: 5 участников --- */
ATYPE.payout='Выплата';RT.init='Инициатор';
TPL.push({id:'payout',n:'Выплата (поставщику, дизайнеру, монтажнику)',cond:'любая выплата; срок на шаг — 1 рабочий день',steps:['zav','fin','dir','buh']});
APPR.unshift({id:'СГ-319',type:'payout',title:'Выплата комиссии дизайнеру · сделка D-1185',deal:'D-1185',sum:341000,init:'Асель · менеджер салона',st:'run',d:'18.11 09:20',
 steps:[{r:'zav',who:'Руководитель салона',st:'ok',d:'18.11 09:45',c:'Сделка оплачена, комиссия 10% по договору с дизайнером'},{r:'fin',who:'Мадина',st:'now',c:''},{r:'dir',who:'Алексей',st:'wait'},{r:'buh',who:'Бухгалтер',st:'wait'}],
 msgs:[{who:'Асель',t:'09:20',txt:'Дизайнер привела клиента, сделка закрыта и оплачена. Прошу выплатить комиссию 10%. Срок — до 20.11.'},{who:'Руководитель салона',t:'09:45',txt:'Подтверждаю.'}],files:['Договор_агентский_дизайнер.pdf','Оплата_клиента_D-1185.pdf']});
APS='СГ-319';
function startPayout(id){const d=DL(id);const n='СГ-'+(320+APPR.length);APPR.unshift({id:n,type:'payout',title:'Выплата по сделке '+id,deal:id,sum:Math.round(d.sum*0.1),init:MN(d.m)+' · менеджер',st:'run',d:TODAY.slice(0,5)+' '+NOW,steps:['zav','fin','dir','buh'].map((r,i)=>({r,who:{zav:'Руководитель салона',fin:'Мадина',dir:'Алексей',buh:'Бухгалтер'}[r],st:i?'wait':'now'})),msgs:[{who:MN(d.m),t:NOW,txt:'Заявка на выплату: комиссия / поставщик / монтажник.'}],files:[]});APS=n;toast('Заявка на выплату <b>'+n+'</b> запущена: руководитель салона → финансист → директор → бухгалтер. Срок на каждый шаг — 1 рабочий день.');go('appr')}
const _apAct=apAct;
apAct=function(k){const a=AP();const i=a.steps.findIndex(s=>s.st==='now');const last=a.type==='payout'&&k==='ok'&&i===a.steps.length-1;_apAct(k);if(last){a.files.push('Платёжное_поручение_'+a.id+'.pdf');toast('Бухгалтер отметил «Оплачено» и приложил платёжку. Инициатор и наблюдатели получили уведомление.');render()}};
const _appr=SC.appr;
SC.appr=()=>{const a=AP();let h=_appr();if(a.type==='payout')h=h.replace('<div class="g21">',`<div class="pan"><h3>Выплата по шагам</h3><div class="tw"><table class="t sm"><thead><tr><th>Шаг</th><th>Исполнитель</th><th>Срок</th><th>Уведомление</th></tr></thead><tbody>${[['Инициатор','менеджер салона','—','—']].concat(a.steps.map(s=>[RT[s.r],s.who,'1 рабочий день',s.st==='now'?'отправлено сейчас':s.st==='ok'?'решение принято':'придёт по очереди'])).map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}<tr><td>Итог</td><td>Бухгалтер</td><td>после директора</td><td>«Оплачено» + платёжка в процессе и в сделке</td></tr></tbody></table></div></div><div class="g21">`);return h};
/* --- Автоматизации --- */
let AUTO=[
 {on:true,w:'Создан лид',c:'канал: номер WhatsApp или форма',a:'присвоить «Источник звонка (обращения)» по номеру/каналу (Студия дверей, ТГ салон, Дизайнер…)'},
 {on:true,w:'Создан лид',c:'любой',a:'распределить на оператора КЦ по очереди; задача «перезвонить за 15 минут»'},
 {on:true,w:'Звонок без ответа',c:'3 звонка и 1 SMS',a:'перевести лид в «Нет ответа (3 звонка и 1 SMS)»'},
 {on:true,w:'Лид → сделка',c:'город и тип запроса',a:'распределить в воронку салона и на менеджера по графику'},
 {on:true,w:'Смена стадии сделки',c:'любая',a:'уведомить ответственного и наблюдателей'},
 {on:true,w:'Сделка → «Заявка на замер»',c:'—',a:'задача замерщику с адресом и временем'},
 {on:true,w:'Скидка в сделке',c:'больше 10%',a:'запустить согласование «Скидка клиенту»'},
 {on:true,w:'Сделка закрыта и оплачена',c:'тип контакта — Дизайнер',a:'запустить «Выплата» комиссии дизайнеру'},
 {on:false,w:'Сделка в «Отложке»',c:'больше 30 дней без действий',a:'перевести в воронку «Архив»'},
 {on:true,w:'Заказ вышел с производства',c:'—',a:'стадия «Заказ на складе» после приёмки, SMS клиенту'}
];
function autoT(i){AUTO[i].on=!AUTO[i].on;toast('Правило '+(AUTO[i].on?'включено':'выключено')+': «'+AUTO[i].w+'».');render()}
SC.auto=()=>`<div class="hd"><div><h2>Автоматизации</h2><p>Ваши роботы и бизнес-процессы Битрикс24 — в одном списке: когда → условие → действие. Включаются одним кликом, без программиста.</p></div><div class="btns"><button class="bt p" onclick="AUTO.push({on:true,w:'Новое событие',c:'условие',a:'действие'});render()">+ Правило</button></div></div>
<div class="pan"><div class="tw"><table class="t"><thead><tr><th style="width:70px">Вкл.</th><th>Когда</th><th>Условие</th><th>Действие</th></tr></thead><tbody>${AUTO.map((r,i)=>`<tr><td><button class="bt sm ${r.on?'p':''}" onclick="autoT(${i})">${r.on?'вкл':'выкл'}</button></td><td><b>${esc(r.w)}</b></td><td>${esc(r.c)}</td><td>${esc(r.a)}</td></tr>`).join('')}</tbody></table></div></div>
${said(BXQ,'Распределение лидов и сделок, присвоение источников, «нет ответа», уведомления наблюдателям, архив, выплаты — всё на этом экране.','Айкера, по скриншотам системы')}`;
/* --- Переезд: карта соответствия --- */
const _move=SC.move;
SC.move=()=>_move()+`<div class="pan"><h3>Карта соответствия: ваш Битрикс24 → новая система</h3><div class="tw"><table class="t sm"><thead><tr><th>В Битрикс24</th><th>Здесь</th><th>Как переносим</th></tr></thead><tbody>${[
['Лиды, стадии «Новый онлайн-лид … итог»','Продажи → Лиды','стадии 1 в 1, лиды — через API'],
['13 воронок сделок (розница, студия, производство, ОКК…)','Продажи → Сделки, переключатель воронок','воронки, стадии, суммы; права на воронки — по ролям'],
['Поля «Источник звонка», «Тип контакта», наблюдатели','поля карточки','значения справочников переносим'],
['Файловые поля «Бланк замера», «КП клиенту скан»','Основная документация в сделке','файлы — через API'],
['Таймлайн: стадии, комментарии WhatsApp','Таймлайн сделки','история — по возможности API'],
['Бизнес-процесс согласования выплат','Согласования → маршрут «Выплата»','собираем заново по вашей схеме'],
['Роботы: распределение, источники, уведомления','Согласования → Автоматизации','собираем заново, включаем по одному']
].map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
/* --- Сценарий --- */
TOUR.splice(1,0,['leads','2 · Лиды: ваши стадии, источник звонка, правило «3 звонка + 1 SMS».']);
TOUR.splice(3,0,['funnel','3 · Сделки: 13 воронок с правами, суммы по колонкам, наблюдатели.']);
TOUR.push(['appr','Выплата: руководитель салона → финансист → директор → бухгалтер с платёжкой.'],['auto','Автоматизации: ваши роботы — когда → условие → действие.']);
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();tRun=false}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
