/* МЕГАТЕКС — система подрядчика слаботочных систем (АПС, СОУЭ, охрана, СКУД, видео, СКС, оптика).
   Демо-макет для Чингиза (Өскемен) по встрече 18 сентября 2026. Данные вымышленные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const num=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const tg=n=>fmt(n)+' ₸';
const mln=n=>(Math.round(n/100000)/10).toString().replace('.',',')+' млн';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};

const SEC=[
 {k:'dash', ic:'▦', n:'Пульт',    sub:[['dash','Объекты · сводка'],['today','Что требует решения']]},
 {k:'obj',  ic:'◫', n:'Объекты',  sub:[['objects','Объекты'],['object','Паспорт объекта'],['plan','План работ и нормы'],['daily','Отчёты с площадки']]},
 {k:'est',  ic:'▤', n:'Сметы',    sub:[['estimates','Сметы'],['estimate','Смета объекта'],['calc','Расчёт из спецификации'],['factvs','Смета против факта']]},
 {k:'pto',  ic:'✎', n:'ПТО',      sub:[['pto','Пульт ПТО'],['tasks','Задания на монтаж'],['volumes','Объёмы · выполнено'],['docs','Исполнительная документация'],['acts','Акты выполненных работ']]},
 {k:'ppl',  ic:'☺', n:'Люди',     sub:[['attendance','Присутствие · геолокация'],['timesheet','Табель'],['pay','Зарплата'],['crews','Бригады и нормы']]},
 {k:'wh',   ic:'▥', n:'Склад',    sub:[['requests','Заявки с объектов'],['stock','Склад и остатки'],['purchase','Закуп и статусы'],['writeoff','Списание по актам']]},
 {k:'fin',  ic:'₸', n:'Деньги',   sub:[['finance','Финансы объекта'],['bot','Расходы через бот'],['cash','Деньги компании']]},
 {k:'set',  ic:'⚙', n:'Настройки',sub:[['roles','Права доступа'],['integr','Интеграции'],['stack','Состав ядра']]}
];
const SECOF={},SUBN={};
SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));

const ROLES={
 'Директор':{av:'ДР',n:'директор',r:'собственник',note:'Все объекты одним экраном: план-факт, деньги, люди, что горит. Без таблиц и без переносов',s:ALL},
 'Руководитель техотдела':{av:'ЧС',n:'Чингиз',r:'технический отдел',note:'Объекты, сметы, ПТО, план и нормы, заявки, склад, люди, финансы объектов. Тот, кто сейчас «переводит таблицы в отчёты» — здесь этого нет',
  s:ALL.filter(k=>k!=='cash')},
 'ПТО-инженер':{av:'АС',n:'Асель',r:'производственно-технический отдел',note:'Сметы из спецификации по прайсу, задания на монтаж, объёмы, исполнительная документация, акты, сверка заявок со сметой',
  s:['dash','objects','object','plan','daily','estimates','estimate','calc','factvs','pto','tasks','volumes','docs','acts','requests','stock','writeoff']},
 'Прораб':{av:'ЕБ',n:'Ерлан',r:'ЖК «Алтын Орда», Школа № 44',note:'Свои объекты: план недели, задания бригадам, отчёт с площадки, заявки, присутствие людей, табель своих. Расходы через бот',
  s:['dash','today','objects','object','plan','daily','tasks','volumes','requests','attendance','timesheet','bot','docs']},
 'Бригадир':{av:'СМ',n:'Самат',r:'бригада АПС · ЖК «Алтын Орда»',note:'Телефон: отметиться на объекте, отчёт за день, заявка на материалы, расход через бота. Четыре кнопки, без таблиц',
  s:['daily','attendance','requests','bot','tasks']},
 'Снабжение':{av:'МР',n:'Марат',r:'закуп и склад',note:'Заявки с объектов, сверенные со сметой; склад, остатки на объектах, заказы поставщикам со статусами, списание',
  s:['dash','requests','stock','purchase','writeoff','objects','estimate']},
 'Бухгалтер':{av:'ГЖ',n:'Гульнара',r:'бухгалтерия',note:'Табель, посчитанный системой, зарплата по правилам, акты и оплаты, расходы объектов, деньги компании. Ничего не собирает руками',
  s:['dash','timesheet','pay','acts','finance','cash','writeoff','attendance']}
};
let role='Директор',cur='dash',theme='light';

/* ====== СТАДИИ ОБЪЕКТА ====== */
const STG=[['tender','Тендер','#6b7f8c'],['contract','Договор','#2f6f9e'],['design','Рабочка · ПТО','#6b4ea8'],['purchase','Закуп','#cf8a22'],['mount','Монтаж','#0f5f7a'],['pnr','ПНР','#1f7a5a'],['docs','Исполнительная','#37c2c0'],['handover','Сдача','#14213d'],['warranty','Гарантия','#8b9dab']];
const STGN=k=>(STG.find(s=>s[0]===k)||STG[0])[1];
const STGC=k=>(STG.find(s=>s[0]===k)||STG[0])[2];

/* ====== ОБЪЕКТЫ ====== */
const OBJ=[
 {id:'O-1',n:'ЖК «Алтын Орда»',sys:['АПС','СОУЭ','Домофония'],sum:0,stage:'mount',pct:62,plan:64,start:'12.05',end:'30.11',pm:'Ерлан Б.',crew:14,acts:39100000,paid:31000000,mat:24300000,fot:9800000,sub:2100000,small:460000,risk:'ok',cust:'ТОО «Алтын Орда Девелопмент»'},
 {id:'O-2',n:'ТРЦ «Ертіс»',sys:['АПС','СОУЭ','Видеонаблюдение','СКУД'],sum:142000000,stage:'mount',pct:35,plan:41,start:'01.07',end:'28.02',pm:'Азамат К.',crew:19,acts:38000000,paid:38000000,mat:31000000,fot:8200000,sub:0,small:310000,risk:'warn',cust:'ТОО «Ертіс Молл»'},
 {id:'O-3',n:'Школа № 44',sys:['АПС','СОУЭ','СКС','Интернет'],sum:41000000,stage:'pnr',pct:91,plan:95,start:'10.04',end:'30.09',pm:'Ерлан Б.',crew:6,acts:33500000,paid:27000000,mat:15400000,fot:6900000,sub:1200000,small:180000,risk:'warn',cust:'Отдел образования · госзакуп'},
 {id:'O-4',n:'Завод ТМК · периметр',sys:['Охранная сигнализация','Периметр','Оптика'],sum:96000000,stage:'purchase',pct:18,plan:15,start:'18.08',end:'20.03',pm:'Азамат К.',crew:9,acts:0,paid:19200000,mat:18700000,fot:2400000,sub:0,small:90000,risk:'ok',cust:'АО «ТМК»'},
 {id:'O-5',n:'БЦ «Ертыс Плаза»',sys:['СКС','Оптика','Видеонаблюдение'],sum:54000000,stage:'docs',pct:100,plan:100,start:'03.02',end:'15.09',pm:'Даурен С.',crew:4,acts:48600000,paid:41000000,mat:21800000,fot:8100000,sub:3400000,small:240000,risk:'warn',cust:'ТОО «Плаза Инвест»'},
 {id:'O-6',n:'Областная больница · тендер',sys:['АПС','СОУЭ','СКУД','Видео','СКС'],sum:2500000000,stage:'contract',pct:0,plan:0,start:'—',end:'—',pm:'—',crew:0,acts:0,paid:0,mat:0,fot:0,sub:0,small:0,risk:'ok',cust:'Управление здравоохранения · госзакуп'}
];
const OB=id=>OBJ.find(o=>o.id===id)||OBJ[0];
let curObj='O-1';

/* ====== СМЕТА ОБЪЕКТА O-1 · из спецификации по прайсу ====== */
/* [наименование, ед., кол-во по смете, цена, факт смонтировано, выдано со склада] */
const EST=[
 {sec:'АПС · материалы',items:[
  ['Извещатель дымовой адресный ИП 212-64','шт',820,18500,508,560],
  ['Извещатель ручной ИПР 513-11','шт',64,9800,40,48],
  ['ППКП адресный, 2 кольцевых линии','шт',3,486000,3,3],
  ['Модуль изолятора короткого замыкания','шт',82,6400,52,60],
  ['Кабель КПСнг(А)-FRLS 1×2×0,5','м',26000,165,17900,20400],
  ['Кабель-канал 16×16','м',6400,210,3900,4100],
  ['Лоток перфорированный 100×50','м',1600,2900,1380,1420]]},
 {sec:'СОУЭ · материалы',items:[
  ['Оповещатель речевой','шт',120,14200,44,60],
  ['Оповещатель световой «Выход»','шт',140,4100,52,60],
  ['Прибор управления оповещением','шт',2,312000,0,0],
  ['Кабель КПСЭнг(А)-FRLS 1×2×0,75','м',9800,240,4100,5000]]},
 {sec:'Домофония · материалы',items:[
  ['Вызывная панель подъезда','шт',8,148000,0,0],
  ['Абонентское устройство','шт',280,21500,0,0],
  ['Кабель UTP cat5e','м',5600,190,0,0]]},
 {sec:'Работы',items:[
  ['Монтаж извещателей и оповещателей','шт',1144,2800,644,0],
  ['Прокладка кабеля','м',41400,210,22000,0],
  ['Монтаж лотка','м',1600,3600,1380,0],
  ['Монтаж кабель-канала','м',6400,650,3900,0],
  ['Монтаж домофонии, подъезд','компл',8,380000,0,0],
  ['Подключение и адресация','шт',1144,1400,410,0]]},
 {sec:'ПНР и сдача',items:[
  ['Пусконаладка АПС и СОУЭ','компл',1,2400000,0,0],
  ['Исполнительная документация','компл',1,700000,0,0]]}
];
const secSum=s=>s.items.reduce((a,i)=>a+i[2]*i[3],0);
const EST_TOTAL=EST.reduce((a,s)=>a+secSum(s),0);
OBJ[0].sum=EST_TOTAL;
const isMat=s=>s.sec.indexOf('материалы')>=0;

/* ====== ЛЮДИ ====== */
const STAFF=[
 {n:'Самат Т.',pos:'бригадир · АПС',obj:'O-1',type:'сдельно',mark:'07:52',days:18,hours:152,ot:6,geo:true},
 {n:'Нурбол А.',pos:'монтажник',obj:'O-1',type:'сдельно',mark:'07:55',days:18,hours:150,ot:4,geo:true},
 {n:'Аскар Ж.',pos:'монтажник',obj:'O-1',type:'сдельно',mark:'08:03',days:17,hours:140,ot:0,geo:true},
 {n:'Бауыржан К.',pos:'монтажник',obj:'O-1',type:'сдельно',mark:'—',days:16,hours:132,ot:0,geo:false},
 {n:'Ерлан Б.',pos:'прораб',obj:'O-1',type:'оклад',mark:'07:40',days:19,hours:160,ot:0,geo:true},
 {n:'Дамир С.',pos:'мастер · видео',obj:'O-2',type:'оклад',mark:'08:10',days:18,hours:148,ot:8,geo:true},
 {n:'Руслан О.',pos:'монтажник',obj:'O-2',type:'сдельно',mark:'08:14',days:18,hours:146,ot:0,geo:true},
 {n:'Тимур Е.',pos:'разнорабочий',obj:'O-2',type:'почасовая',mark:'08:20',days:15,hours:118,ot:0,geo:true},
 {n:'Айдос М.',pos:'наладчик · ПНР',obj:'O-3',type:'оклад',mark:'09:05',days:19,hours:156,ot:12,geo:true},
 {n:'Азамат К.',pos:'прораб',obj:'O-2',type:'оклад',mark:'07:35',days:19,hours:162,ot:0,geo:true}
];
const CREWS=[
 {n:'Бригада Самата · АПС',obj:'O-1',ppl:8,norm:'40 точек или 300 м кабеля на человека в смену',week:'план 1 600 точек-экв. · факт 1 490',eff:93},
 {n:'Бригада Каната · лотки и кабель',obj:'O-1',ppl:6,norm:'120 м лотка или 400 м кабеля в смену',week:'план 3 600 м · факт 3 410',eff:95},
 {n:'Бригада Дамира · видео и СКУД',obj:'O-2',ppl:11,norm:'12 камер или 4 точки СКУД в смену',week:'план 660 камер-экв. · факт 540',eff:82},
 {n:'Бригада Жаната · кабель',obj:'O-2',ppl:8,norm:'350 м в смену',week:'план 14 000 м · факт 11 900',eff:85},
 {n:'Звено Айдоса · ПНР',obj:'O-3',ppl:3,norm:'1 шлейф в смену',week:'план 12 · факт 12',eff:100},
 {n:'Бригада Серика · периметр',obj:'O-4',ppl:9,norm:'80 м периметра в смену',week:'ждёт материалы',eff:0}
];

/* ====== ЗАЯВКИ С ОБЪЕКТОВ ====== */
const REQ=[
 {id:'З-231',obj:'O-1',who:'Самат Т.',what:'Кабель КПСнг(А)-FRLS 1×2×0,5 — 2 000 м; извещатели ИП 212-64 — 40 шт',need:'к четвергу 25.09',st:'supply',note:'сверено со сметой: остаток по кабелю 5 600 м, по извещателям 260 шт · извещатели выданы со склада 19.09, кабель заказан, в пути до 23.09'},
 {id:'З-232',obj:'O-2',who:'Дамир С.',what:'Камеры купольные 4 Мп — 24 шт; коммутатор PoE 24 порта — 2 шт',need:'к 29.09',st:'pto',note:'ПТО: коммутаторов по смете 6, выдано 4 — ок; камеры в лимите'},
 {id:'З-233',obj:'O-4',who:'Серик Н.',what:'Извещатели периметровые — 36 шт; кабель ВВГнг 3×1,5 — 1 200 м',need:'к 24.09',st:'order',note:'заказ поставщику «Электрокомплект» от 17.09, оплата прошла, отгрузка 22.09'},
 {id:'З-234',obj:'O-1',who:'Канат Р.',what:'Лоток 100×50 — 200 м; крепёж',need:'к 23.09',st:'over',note:'ПТО: по смете лотка 1 600 м, выдано 1 420, смонтировано 1 380 — заявка превышает остаток на 20 м. Нужно решение прораба'},
 {id:'З-235',obj:'O-3',who:'Айдос М.',what:'Аккумуляторы 12В 7Ач — 12 шт',need:'к 22.09',st:'done',note:'выданы со склада 19.09, подпись Айдоса в телефоне'},
 {id:'З-236',obj:'O-2',who:'Жанат У.',what:'Кабель КПСЭнг(А)-FRLS 1×2×0,75 — 4 000 м',need:'к 26.09',st:'new',note:'ещё не сверена'}
];
const RST={new:['новая','var(--muted)'],pto:['сверка ПТО','var(--violet)'],supply:['в снабжении','var(--acc)'],order:['заказано · в пути','var(--warn)'],done:['выдано','var(--ok)'],over:['сверх сметы','var(--bad)']};

/* ====== СКЛАД ====== */
const STOCK=[
 {n:'Кабель КПСнг(А)-FRLS 1×2×0,5',u:'м',wh:4200,o1:2500,o2:6100,o4:0,min:5000},
 {n:'Кабель КПСЭнг(А)-FRLS 1×2×0,75',u:'м',wh:1800,o1:900,o2:3200,o4:0,min:3000},
 {n:'Извещатель ИП 212-64',u:'шт',wh:96,o1:52,o2:140,o4:0,min:100},
 {n:'Оповещатель речевой',u:'шт',wh:34,o1:16,o2:48,o4:0,min:30},
 {n:'Лоток перфорированный 100×50',u:'м',wh:260,o1:40,o2:380,o4:120,min:200},
 {n:'Камера купольная 4 Мп',u:'шт',wh:8,o1:0,o2:31,o4:0,min:12},
 {n:'Извещатель периметровый',u:'шт',wh:0,o1:0,o2:0,o4:18,min:20},
 {n:'Аккумулятор 12В 7Ач',u:'шт',wh:22,o1:6,o2:10,o4:0,min:20}
];
const ORDERS=[
 {id:'ЗП-118',sup:'«Электрокомплект»',what:'Кабель КПС 2 000 м · для З-231',sum:330000,st:'transit',eta:'23.09'},
 {id:'ЗП-119',sup:'«Электрокомплект»',what:'Извещатели периметровые 36 шт, ВВГнг 1 200 м · для З-233',sum:2140000,st:'paid',eta:'отгрузка 22.09'},
 {id:'ЗП-120',sup:'«Рубеж-Казахстан»',what:'Приборы СОУЭ 2 шт · O-1',sum:624000,st:'wait',eta:'счёт на оплате'},
 {id:'ЗП-121',sup:'«Видеотех»',what:'Камеры 4 Мп 24 шт, коммутаторы 2 шт · для З-232',sum:3960000,st:'new',eta:'после сверки ПТО'},
 {id:'ЗП-117',sup:'«Кабель-Сервис»',what:'Лоток 100×50 600 м · O-2',sum:1740000,st:'done',eta:'принят 16.09'}
];
const OST={new:['ждёт заказа','var(--muted)'],wait:['ждёт оплаты','var(--warn)'],paid:['оплачен','var(--acc)'],transit:['в пути','var(--violet)'],done:['на складе','var(--ok)']};

/* ====== ИСПОЛНИТЕЛЬНАЯ ДОКУМЕНТАЦИЯ · O-1 ====== */
const DOCS=[
 ['Акт скрытых работ · прокладка кабеля, 5 этаж','подписан 12.09','ok'],
 ['Акт скрытых работ · прокладка кабеля, 6 этаж','НЕ ПОДПИСАН · потолки закрывают 22.09','bad'],
 ['Акт скрытых работ · лотки в подвале','подписан 04.09','ok'],
 ['Ведомость смонтированного оборудования','собирается из объёмов · 644 из 1 144','work'],
 ['Журнал производства работ','ведётся из отчётов с площадки','work'],
 ['Паспорта и сертификаты на оборудование','32 из 41 · нет на кабель-канал','warn'],
 ['Исполнительные схемы АПС · 1–4 этажи','переданы в ПТО 15.09','ok'],
 ['Акт ПНР','после монтажа','wait'],
 ['Акт приёмки заказчиком','после ПНР','wait']
];

/* ====== АКТЫ ВЫПОЛНЕННЫХ РАБОТ ====== */
const ACTS=[
 {id:'АВР-14',obj:'O-1',per:'август',sum:14200000,st:'paid'},
 {id:'АВР-17',obj:'O-1',per:'сентябрь · 1–15',sum:8100000,st:'signed'},
 {id:'АВР-15',obj:'O-2',per:'август',sum:22000000,st:'paid'},
 {id:'АВР-18',obj:'O-3',per:'сентябрь',sum:6500000,st:'sign'},
 {id:'АВР-16',obj:'O-5',per:'август · финальный',sum:7600000,st:'signed'},
 {id:'АВР-19',obj:'O-2',per:'сентябрь · 1–15',sum:9400000,st:'draft'}
];
const AST={draft:['черновик из объёмов','var(--muted)'],sign:['на подписи','var(--warn)'],signed:['подписан · ждёт оплаты','var(--acc)'],paid:['оплачен','var(--ok)']};

/* ====== ЗАДАНИЯ И ОТЧЁТЫ ====== */
const TASKS=[
 {obj:'O-1',t:'Извещатели 7 этаж, секции А–Б · 96 шт',crew:'Самат Т.',due:'22.09',plan:96,done:64,st:'work'},
 {obj:'O-1',t:'Кабель КПС 7 этаж · 2 400 м',crew:'Канат Р.',due:'23.09',plan:2400,done:1650,st:'work'},
 {obj:'O-1',t:'Акт скрытых работ 6 этаж — подписать до закрытия потолков',crew:'Ерлан Б. · ПТО Асель',due:'21.09',plan:1,done:0,st:'late'},
 {obj:'O-2',t:'Камеры паркинг −1 · 38 шт',crew:'Дамир С.',due:'26.09',plan:38,done:12,st:'work'},
 {obj:'O-2',t:'Кабель КПСЭ атриум · 3 000 м',crew:'Жанат У.',due:'25.09',plan:3000,done:900,st:'work'},
 {obj:'O-3',t:'ПНР шлейфы 9–12, корпус Б',crew:'Айдос М.',due:'24.09',plan:4,done:2,st:'work'},
 {obj:'O-5',t:'Передать исполнительную заказчику',crew:'Даурен С. · ПТО',due:'19.09',plan:1,done:0,st:'late'}
];
const DAILY=[
 {t:'вчера 18:40',obj:'O-1',who:'Самат Т.',txt:'7 этаж секция А: смонтировано 32 извещателя, 4 ручных. Кабель 620 м. Людей 8, все до 18:00. Фото 3.',vol:'32 шт · 620 м',src:'бот · голосовое'},
 {t:'вчера 18:20',obj:'O-1',who:'Канат Р.',txt:'Лоток 7 этаж 140 м, кабель-канал 210 м. Крепежа осталось на день — заявка З-234.',vol:'140 м · 210 м',src:'телефон'},
 {t:'вчера 18:05',obj:'O-2',who:'Дамир С.',txt:'Паркинг −1: 6 камер, коммутатор в шкафу 2. Заказчик не дал доступ в шкаф 3 — простой 2 часа.',vol:'6 шт',src:'телефон'},
 {t:'вчера 17:50',obj:'O-3',who:'Айдос М.',txt:'ПНР шлейфы 9 и 10 — сдали. 11-й: короткое замыкание, ищем, вероятно в коробке 3 этажа.',vol:'2 шлейфа',src:'бот · голосовое'},
 {t:'вчера 17:30',obj:'O-4',who:'Серик Н.',txt:'Копка траншеи 120 м. Извещателей нет — ждём поставку 22.09.',vol:'120 м',src:'телефон'}
];

/* ====== БОТ · расходы и отчёты ====== */
const BOT=[
 {t:'вчера 14:12',who:'Самат Т.',kind:'voice',txt:'«Купил в Электромире двенадцать автоматов на шестнадцать ампер, тридцать восемь четыреста тенге, объект Алтын Орда, седьмой этаж»',parsed:'Расход · O-1 · автоматы 16А × 12 · 38 400 ₸ · магазин «Электромир» · чек: фото',st:'wait'},
 {t:'вчера 12:40',who:'Канат Р.',kind:'photo',txt:'фото чека · «Крепёж-Центр» · 14 900 ₸',parsed:'Расход · O-1 · крепёж · 14 900 ₸ · подтверждён прорабом Ерланом',st:'ok'},
 {t:'вчера 18:40',who:'Самат Т.',kind:'voice',txt:'«Седьмой этаж секция А, тридцать два извещателя, четыре ручных, кабеля шестьсот двадцать метров, людей восемь»',parsed:'Отчёт с площадки · O-1 · объёмы записаны · попали в план-факт и в ведомость',st:'ok'},
 {t:'позавчера',who:'Дамир С.',kind:'voice',txt:'«Такси до Ертиса и обратно за коммутатором, четыре тысячи»',parsed:'Расход · O-2 · транспорт · 4 000 ₸ · без чека — отклонён Азаматом: «оформи авансовый»',st:'no'}
];
const SC={};
const seeMoney=()=>['Директор','Руководитель техотдела','Бухгалтер'].indexOf(role)>=0;
const tag=(t,c)=>`<span class="tag" style="background:${c}22;color:${c}">${esc(t)}</span>`;
const stTag=k=>`<span class="tag" style="background:${STGC(k)}1f;color:${STGC(k)};border-left:3px solid ${STGC(k)}">${esc(STGN(k))}</span>`;
const barHtml=(p,c)=>`<div class="bar"><i style="display:block;height:100%;width:${Math.min(100,Math.max(0,p))}%;background:${c||'var(--brand)'}"></i></div>`;
const myObjs=()=>role==='Прораб'?OBJ.filter(o=>o.pm==='Ерлан Б.'):role==='Бригадир'?OBJ.filter(o=>o.id==='O-1'):OBJ;
const margin=o=>o.acts-(o.mat+o.fot+o.sub+o.small);
const objSel=()=>`<select class="rsel" onchange="curObj=this.value;build()">${OBJ.filter(o=>o.id!=='O-6').map(o=>`<option value="${o.id}"${o.id===curObj?' selected':''}>${esc(o.n)}</option>`).join('')}</select>`;

/* ====== СВОДКА ====== */
SC.dash=()=>{
 const live=OBJ.filter(o=>o.id!=='O-6');
 const contracts=live.reduce((a,o)=>a+o.sum,0),acts=live.reduce((a,o)=>a+o.acts,0),paid=live.reduce((a,o)=>a+o.paid,0);
 return `<div class="hd"><div><h2>Объекты · суббота, 20 сентября 2026</h2>
 <p>Ваши слова: «пять объектов, всё в отдельных таблицах — зашиваемся». Здесь все объекты одним экраном: стадия, план-факт, люди на площадке, деньги, что горит. Никто ничего не переносит — данные приходят с площадки, из ПТО, со склада и из табеля.</p></div>
 <div class="btns"><button class="bt" onclick="go('today')">Что требует решения</button><button class="bt p" onclick="go('objects')">Все объекты</button></div></div>
<div class="wid">
 <div><small>Объектов в работе</small><b class="a">5</b><span>+ тендер 2,5 млрд на договоре</span></div>
 <div><small>Портфель договоров</small><b>${seeMoney()?mln(contracts):'5 объектов'}</b><span>${seeMoney()?'акты '+mln(acts)+' · оплачено '+mln(paid):'по стадиям'}</span></div>
 <div><small>Людей на объектах сейчас</small><b class="g">51 из 58</b><span>по геолокации · 7 не отметились</span></div>
 <div><small>Отстают от плана</small><b class="w">2</b><span>ТРЦ «Ертіс» −6 · Школа № 44 −4</span></div>
 <div><small>Горит</small><b class="r">3</b><span>акт скрытых работ · заявка сверх сметы · сдача</span></div>
</div>
<div class="pan"><h3 style="margin:0 0 4px">Объекты · план и факт</h3><p class="mini" style="margin:0 0 10px">Зелёное — идёт по плану, жёлтое — отстаёт, стадия цветом. Клик открывает паспорт объекта.</p>
 ${live.map(o=>`<div class="dl" style="--c:${o.pct>=o.plan?'var(--ok)':'var(--warn)'};cursor:pointer" onclick="curObj='${o.id}';go('object')">
  <div style="flex:1;min-width:0"><b>${esc(o.n)}</b> <span class="mini">· ${o.sys.join(', ')}</span><div class="mini">${esc(o.pm)} · ${o.crew} чел · срок ${o.end}</div></div>
  ${stTag(o.stage)}
  <div style="width:150px">${barHtml(o.pct,o.pct>=o.plan?'var(--ok)':'var(--warn)')}<div class="mini" style="text-align:right;margin-top:3px">факт ${o.pct}% · план ${o.plan}%</div></div>
  <b class="mono" style="width:90px;text-align:right">${seeMoney()?mln(o.sum):''}</b></div>`).join('')}
 <div class="dl" style="--c:var(--line2)"><div style="flex:1"><b>${esc(OBJ[5].n)}</b><div class="mini">выигран · подготовка договора · 5 систем</div></div>${stTag('contract')}<div style="width:150px" class="mini">старт после подписания</div><b class="mono" style="width:90px;text-align:right">${seeMoney()?'2,5 млрд':''}</b></div>
</div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 8px">Сегодня с площадок</h3>
  <div class="kv"><span>Отчётов за вчера</span><b>5 из 5 объектов</b></div>
  <div class="kv"><span>Извещателей смонтировано</span><b>44</b></div>
  <div class="kv"><span>Кабеля проложено</span><b>1 730 м</b></div>
  <div class="kv" style="border:0"><span>Простои</span><b style="color:var(--warn)">ТРЦ · 2 ч · нет доступа в шкаф</b></div>
 </div>
 <div class="pan"><h3 style="margin:0 0 8px">Склад и заявки</h3>
  <div class="kv"><span>Заявок открыто</span><b>${REQ.filter(r=>r.st!=='done').length}</b></div>
  <div class="kv"><span>Сверх сметы</span><b style="color:var(--bad)">1 · лоток, З-234</b></div>
  <div class="kv"><span>В пути</span><b>2 заказа</b></div>
  <div class="kv" style="border:0"><span>Ниже минимума на складе</span><b style="color:var(--warn)">4 позиции</b></div>
 </div>
 <div class="pan"><h3 style="margin:0 0 8px">Деньги · сентябрь</h3>
  <div class="kv"><span>Актов выставлено</span><b>${seeMoney()?tg(24000000):'—'}</b></div>
  <div class="kv"><span>Ждут подписи и оплаты</span><b>${seeMoney()?tg(31600000):'—'}</b></div>
  <div class="kv"><span>Расходы через бот</span><b>${seeMoney()?tg(1280000):'—'}</b></div>
  <div class="kv" style="border:0"><span>Табель за месяц</span><b>считается сам · 58 чел</b></div>
 </div>
</div>
<div class="said"><b>Что здесь главное.</b> Директор старой закалки увидит на этом экране то, что сейчас ему приносят в пяти таблицах раз в неделю, — но за вчера и без переноса. Вы говорили, что придётся убеждать его; этот экран — аргумент, который не требует объяснений.</div>`;
};

SC.today=()=>`<div class="hd"><div><h2>Что требует решения · 20 сентября</h2>
 <p>Список собирает система из отклонений: акт скрытых работ не подписан, а потолки закрывают; заявка сверх сметы; сдача просрочена; люди не отметились; отчёт с площадки не пришёл. Если всё в порядке — пусто.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Нерешённое к 19:00 уходит директору и руководителю техотдела одним сообщением в WhatsApp.')">Разобрал</button></div></div>
<div class="g2">
 <div>
  <div class="tsk" style="--c:var(--bad)"><b>ЖК «Алтын Орда» · акт скрытых работ 6 этаж не подписан, потолки закрывают 22.09</b>
   <p class="mini" style="margin:5px 0 8px">Кабель проложен 14.09, акт не оформлен. Закроют потолок без акта — заказчик вправе не принять объём, а вскрывать потолок будете за свой счёт. Система подняла это за два дня, а не после.</p>
   <button class="bt p" onclick="go('docs')">Открыть исполнительную</button></div>
  <div class="tsk" style="--c:var(--bad)"><b>Заявка З-234 · лоток 200 м — сверх остатка по смете</b>
   <p class="mini" style="margin:5px 0 8px">По смете 1 600 м, выдано 1 420, смонтировано 1 380. Заявка на 200 м превышает остаток на 20 м, и ещё 40 м «выдано, но не смонтировано» где-то на объекте. Прораб должен объяснить, снабжение не закупает без решения.</p>
   <button class="bt" onclick="go('requests')">Открыть заявку</button></div>
  <div class="tsk" style="--c:var(--warn)"><b>БЦ «Ертыс Плаза» · исполнительная не передана заказчику, срок 19.09</b>
   <p class="mini" style="margin:5px 0 8px">Монтаж 100%, финальный акт подписан, 7,6 млн ждут оплаты — заказчик не платит до передачи исполнительной. Не хватает паспортов на 3 позиции.</p>
   <button class="bt" onclick="toast('Задача Даурену и Асель: собрать паспорта у поставщика «Видеотех», передать пакет до 23.09.')">Поставить задачу</button></div>
 </div>
 <div>
  <div class="tsk" style="--c:var(--warn)"><b>ТРЦ «Ертіс» · отставание 6% и простой 2 часа</b>
   <p class="mini" style="margin:5px 0 8px">Заказчик не дал доступ в шкаф 3. Простой записан в журнал с причиной «заказчик» — это аргумент при сдвиге сроков. Бригада Дамира на 82% от нормы вторую неделю.</p>
   <button class="bt" onclick="go('crews')">Бригады и нормы</button></div>
  <div class="tsk" style="--c:var(--warn)"><b>7 человек не отметились на объектах к 09:00</b>
   <p class="mini" style="margin:5px 0 8px">Бауыржан К. и ещё шестеро. Либо не пришли, либо не нажали. В табель день не попадёт, пока прораб не подтвердит.</p>
   <button class="bt" onclick="go('attendance')">Присутствие</button></div>
  <div class="tsk" style="--c:var(--acc)"><b>Расход через бот ждёт подтверждения · 38 400 ₸</b>
   <p class="mini" style="margin:5px 0 8px">Самат купил автоматы в «Электромире», голосовое и фото чека. Прораб подтверждает — расход ложится на объект.</p>
   <button class="bt" onclick="go('bot')">Открыть бот</button></div>
 </div>
</div>`;

/* ====== ОБЪЕКТЫ ====== */
SC.objects=()=>{const list=myObjs();return `<div class="hd"><div><h2>Объекты</h2>
 <p>Каждый объект — паспорт: договор, системы, стадии, смета, план, люди, склад на объекте, документы, деньги. Стадии: тендер → договор → рабочка → закуп → монтаж → ПНР → исполнительная → сдача → гарантия.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Новый объект: заказчик, договор, системы, сроки, прораб. Смета — из спецификации на следующем шаге.')">+ Объект</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.4px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['ОБЪЕКТ','СИСТЕМЫ','СТАДИЯ','ПРОРАБ · ЛЮДИ','СРОК','ФАКТ · ПЛАН','ДОГОВОР','АКТЫ','ОПЛАЧЕНО'].map((h,i)=>`<th style="text-align:${i>=6?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${list.map(o=>`<tr style="cursor:pointer" onclick="curObj='${o.id}';go('object')"><td style="padding:8px"><b>${esc(o.n)}</b><div class="mini">${esc(o.cust)}</div></td><td style="padding:8px;color:var(--muted)">${o.sys.join(', ')}</td><td style="padding:8px">${stTag(o.stage)}</td><td style="padding:8px">${esc(o.pm)}${o.crew?' · '+o.crew:''}</td><td class="mono" style="padding:8px">${o.start} – ${o.end}</td><td class="mono" style="padding:8px;color:${o.pct>=o.plan?'var(--ok)':'var(--warn)'}">${o.pct}% · ${o.plan}%</td><td class="mono" style="text-align:right;padding:8px">${seeMoney()?mln(o.sum):'—'}</td><td class="mono" style="text-align:right;padding:8px">${seeMoney()?mln(o.acts):'—'}</td><td class="mono" style="text-align:right;padding:8px">${seeMoney()?mln(o.paid):'—'}</td></tr>`).join('')}</tbody>
</table></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Стадии — с правилами</h3><p class="mini" style="margin:0">На «Закуп» нельзя без утверждённой сметы, на «ПНР» — без 100% монтажа по ведомости, на «Сдачу» — без актов скрытых работ и полного пакета исполнительной. Стадия не даст пропустить документ.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Больница · 2,5 млрд</h3><p class="mini" style="margin:0">Объект уже заведён на стадии «Договор». Когда придёт спецификация — смета считается из прайса, и с первого дня всё идёт в системе, а не в новых таблицах.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Кто видит</h3><p class="mini" style="margin:0">Прораб — свои объекты, бригадир — свой, ПТО и снабжение — все без денег, бухгалтер — деньги. Директор и руководитель техотдела — всё.</p></div>
</div>`};

SC.object=()=>{const o=OB(curObj);const m=margin(o);return `<div class="hd"><div><h2>${esc(o.n)} · ${o.sys.join(', ')}</h2>
 <p>${esc(o.cust)} · договор ${o.start} – ${o.end} · прораб ${esc(o.pm)}. Всё по объекту на одном экране; каждая плитка открывает свой раздел.</p></div>
 <div class="btns">${objSel()}<button class="bt" onclick="go('estimate')">Смета</button><button class="bt p" onclick="go('finance')">Финансы</button></div></div>
<div class="wid" style="grid-template-columns:repeat(5,1fr)">
 <div><small>Стадия</small><b class="a" style="font-size:16px">${esc(STGN(o.stage))}</b><span>${o.pct}% монтажа · план ${o.plan}%</span></div>
 <div><small>Договор</small><b>${seeMoney()?mln(o.sum):'—'}</b><span>${seeMoney()?'акты '+mln(o.acts):'смета утверждена'}</span></div>
 <div><small>Оплачено</small><b class="g">${seeMoney()?mln(o.paid):'—'}</b><span>${seeMoney()?'дебиторка '+mln(o.acts-o.paid):''}</span></div>
 <div><small>Расходы</small><b>${seeMoney()?mln(o.mat+o.fot+o.sub+o.small):'—'}</b><span>${seeMoney()?'материалы '+mln(o.mat)+' · ФОТ '+mln(o.fot):'по табелю и складу'}</span></div>
 <div><small>Маржа по актам</small><b class="${m>=0?'g':'r'}">${seeMoney()?mln(m):'—'}</b><span>${seeMoney()?pct(m,o.acts)+'% · прогноз по смете ниже':''}</span></div>
</div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Стадии объекта</h3>
  <div class="pipe" style="grid-auto-columns:minmax(96px,1fr);gap:4px">${STG.map((s,i)=>{const cur=STG.findIndex(x=>x[0]===o.stage);const done=i<cur,now=i===cur;return `<div><div class="phead" style="background:${done?s[2]:now?s[2]:'var(--line2)'};opacity:${done||now?1:.6};font-size:10px">${done?'✓ ':now?'● ':''}${esc(s[1])}</div></div>`}).join('')}</div>
  <h3 style="margin:12px 0 8px">План по системам</h3>
  ${o.id==='O-1'?[['АПС · извещатели и кабель',62,64],['СОУЭ',37,45],['Домофония',0,0],['Лотки и кабель-канал',86,80]].map(([n,f,p])=>`<div class="fr" style="grid-template-columns:200px 1fr 110px"><span style="font-size:11.3px">${n}</span>${barHtml(f,f>=p?'var(--ok)':'var(--warn)')}<b class="mono" style="text-align:right">${f}% · план ${p}%</b></div>`).join(''):`<div class="fr" style="grid-template-columns:200px 1fr 110px"><span style="font-size:11.3px">Все системы</span>${barHtml(o.pct,o.pct>=o.plan?'var(--ok)':'var(--warn)')}<b class="mono" style="text-align:right">${o.pct}% · план ${o.plan}%</b></div><p class="mini" style="margin:8px 0 0">Разбивка по системам — как у ЖК «Алтын Орда»: из сметы и объёмов.</p>`}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Люди и склад на объекте</h3>
   <div class="kv"><span>На площадке сейчас</span><b>${o.crew?Math.max(0,o.crew-1)+' из '+o.crew:'—'}</b></div>
   <div class="kv"><span>Бригад</span><b>${CREWS.filter(c=>c.obj===o.id).length||'—'}</b></div>
   <div class="kv"><span>Открытых заявок</span><b>${REQ.filter(r=>r.obj===o.id&&r.st!=='done').length}</b></div>
   <div class="kv" style="border:0"><span>Материалов на объекте</span><b>${o.id==='O-1'?'кабель 2 500 м · извещатели 52':'по складу объекта'}</b></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Документы</h3>
   <div class="kv"><span>Договор и смета</span><b style="color:var(--ok)">есть</b></div>
   <div class="kv"><span>Акты скрытых работ</span><b style="color:${o.id==='O-1'?'var(--bad)':'var(--ok)'}">${o.id==='O-1'?'2 из 3 · 6 этаж!':'в порядке'}</b></div>
   <div class="kv"><span>Исполнительная</span><b>${o.id==='O-5'?'не передана · срок 19.09':o.id==='O-1'?'собирается из объёмов':'после монтажа'}</b></div>
   <div class="kv" style="border:0"><span>Акты выполненных работ</span><b>${ACTS.filter(a=>a.obj===o.id).length||'—'}</b></div>
  </div>
 </div>
</div>
<div class="said"><b>Ваши слова:</b> «хотелось бы видеть объект, и внутри объекта — информация о финансах, все расходы и доходы». Здесь так: договор, акты, оплаты и все расходы — материалы со склада, ФОТ из табеля, субподряд, мелкие покупки через бот — сходятся в объект сами.</div>`};
/* ====== ПЛАН И ОТЧЁТЫ ====== */
SC.plan=()=>{const o=OB(curObj);return `<div class="hd"><div><h2>План работ и нормы · ${esc(o.n)}</h2>
 <p>Ваши слова: «планы проекта — когда должны закончить, сколько должен сделать прораб, сколько мастер, сколько монтажник». План считается от объёмов сметы и норм выработки: столько-то точек и метров в смену на человека — столько-то недель при такой бригаде.</p></div>
 <div class="btns">${objSel()}<button class="bt" onclick="toast('Нормы выработки: точек и метров в смену по видам работ. Меняете — план пересчитывается. Начальные нормы — из вашей практики, уточняются по факту первых недель.')">Нормы</button><button class="bt p" onclick="toast('План недели разослан бригадирам: задания по этажам и объёмам, в телефон каждому.')">Утвердить неделю</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Осталось по смете</small><b class="a">500 точек · 19 400 м</b><span>извещатели и оповещатели · кабель</span></div>
 <div><small>Бригада</small><b>14 чел</b><span>2 бригады · норма 40 точек / 300 м</span></div>
 <div><small>Расчётный срок монтажа</small><b>5,5 недель</b><span>при 14 людях и 5 сменах</span></div>
 <div><small>Срок по договору</small><b class="${o.id==='O-1'?'g':'w'}">30.11</b><span>запас 3 недели на ПНР и сдачу</span></div>
</div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Недели · план и факт</h3>
  ${[['15–19.09',1600,1490,'извещатели 6–7 этаж, кабель'],['22–26.09',1600,0,'извещатели 7–8 этаж, лоток подвал'],['29.09–03.10',1600,0,'оповещатели 1–4, кабель СОУЭ'],['06–10.10',1400,0,'оповещатели 5–8'],['13–17.10',1200,0,'домофония, подъезды 1–4'],['20–24.10',1200,0,'домофония 5–8, подключение'],['27–31.10',900,0,'адресация, дочистка']].map(([w,p,f,what],i)=>`<div class="fr" style="grid-template-columns:100px 1fr 150px"><b style="font-size:11.3px">${w}</b><div><div class="mini" style="margin-bottom:3px">${esc(what)}</div>${barHtml(f?f/p*100:0,f>=p?'var(--ok)':i===0?'var(--warn)':'var(--line2)')}</div><b class="mono" style="text-align:right;font-size:11px">${f?f+' / '+p:'план '+p}</b></div>`).join('')}
  <p class="mini" style="margin:8px 0 0">Единица — «точка-эквивалент»: 1 извещатель = 1, 10 м кабеля = 1, 3 м лотка = 1. Так план читается одной цифрой, а нормы — по видам работ.</p>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Сколько должен сделать</h3>
   <div class="kv"><span>Монтажник · смена</span><b>40 точек или 300 м</b></div>
   <div class="kv"><span>Звено на лотке · смена</span><b>120 м лотка</b></div>
   <div class="kv"><span>Мастер</span><b>8–10 монтажников, объёмы по этажу</b></div>
   <div class="kv" style="border:0"><span>Прораб</span><b>объект в срок, план недели, отчёт вечером</b></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Если отстаём</h3><p class="mini" style="margin:0">План пересчитывается от факта: на прошлой неделе 93% нормы — расчётный срок сдвинулся на 2 дня, запас ещё есть. Система покажет, когда запас кончится, и предложит: добавить людей, вторую смену или согласовать сдвиг с заказчиком.</p></div>
  <div class="pan"><h3 style="margin:0 0 6px">Простои с причиной</h3><p class="mini" style="margin:0">«Заказчик не дал доступ», «нет материала», «нет фронта» — прораб отмечает в отчёте. За месяц видно, кто съедает срок: вы или заказчик. Это документ для разговора о сроках.</p></div>
 </div>
</div>`};

SC.daily=()=>{const list=role==='Бригадир'?DAILY.filter(d=>d.who==='Самат Т.'):role==='Прораб'?DAILY.filter(d=>d.obj==='O-1'||d.obj==='O-3'):DAILY;return `<div class="hd"><div><h2>Отчёты с площадки · вчера</h2>
 <p>Ваши слова: «хочется видеть отчёты с поля, с площадки». Бригадир вечером отправляет три цифры и фото — с телефона или голосовым в бот. Из этого: объёмы в план-факт, ведомость смонтированного оборудования, журнал работ, простои с причиной.</p></div>
 <div class="btns"><button class="bt p" onclick="dailyAdd()">Отчёт за сегодня</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Отчётов за вчера</small><b class="a">${DAILY.length} из 5</b><span>все объекты</span></div>
 <div><small>Извещателей · кабеля</small><b>44 · 1 730 м</b><span>за день</span></div>
 <div><small>Голосом через бот</small><b>2</b><span>распознаны, объёмы записаны</span></div>
 <div><small>Простои</small><b class="w">1 · 2 часа</b><span>причина: заказчик</span></div>
</div>
<div class="pan">${list.map(d=>`<div class="dl" style="--c:${d.src.indexOf('бот')>=0?'var(--violet)':'var(--acc)'}"><b class="mono" style="width:90px;font-size:10.6px">${esc(d.t)}</b><div style="flex:1;min-width:0"><b>${esc(OB(d.obj).n)}</b> <span class="mini">· ${esc(d.who)}</span><div class="mini">${esc(d.txt)}</div></div><b class="mono" style="width:100px;text-align:right;font-size:11px">${esc(d.vol)}</b>${tag(d.src,d.src.indexOf('бот')>=0?'var(--violet)':'var(--acc)')}</div>`).join('')}</div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Что спрашивает у бригадира</h3><p class="mini" style="margin:0">Сколько смонтировали (по видам из задания), сколько людей, были ли простои и почему, фото. Четыре вопроса, две минуты. Если отчёта нет к 19:30 — напоминание бригадиру, к 20:00 — прорабу.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Куда попадает</h3><p class="mini" style="margin:0">Объёмы — в план-факт и в смету против факта; люди — в табель как подтверждение; простои — в журнал; фото — к этажу. ПТО ничего не переписывает: ведомость собирается из этих же цифр.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Расхождения</h3><p class="mini" style="margin:0">Бригадир сказал «620 м», выдано со склада на неделе 2 000 м, а по смете на этаж 1 900 — система сравнит и подсветит, если отчёт не сходится со складом. Не для наказания, для порядка.</p></div>
</div>`};

/* ====== СМЕТЫ ====== */
SC.estimates=()=>`<div class="hd"><div><h2>Сметы</h2>
 <p>Ваши слова: «нужна информация на объект с момента сметы, чтобы автоматически посчитать исходя из имеющегося прайса». Смета — не файл, а объект системы: из неё берутся заявки, лимиты склада, план, ведомость и акты.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Прайс: ваши цены на материалы и расценки на работы, с историей изменений. Обновили прайс — новые сметы считаются по нему, старые не трогаются.')">Прайс</button><button class="bt p" onclick="go('calc')">+ Смета из спецификации</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.4px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['ОБЪЕКТ','ВЕРСИЯ','МАТЕРИАЛЫ','РАБОТЫ','ПНР И ПРОЧЕЕ','ИТОГО','ВЫПОЛНЕНО','СТАТУС'].map((h,i)=>`<th style="text-align:${i>=2&&i<=6?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${[['O-1','v3 · 08.05',EST.filter(isMat).reduce((a,s)=>a+secSum(s),0),secSum(EST[3]),secSum(EST[4]),EST_TOTAL,62,'утверждена'],['O-2','v2 · 20.06',84000000,49000000,9000000,142000000,35,'утверждена'],['O-3','v1 · 02.04',22000000,15500000,3500000,41000000,91,'утверждена'],['O-4','v2 · 11.08',58000000,32000000,6000000,96000000,18,'утверждена'],['O-5','v1 · 25.01',30000000,20000000,4000000,54000000,100,'закрыта'],['O-6','черновик',0,0,0,2500000000,0,'ждёт спецификацию']]
  .map(r=>`<tr style="cursor:pointer" onclick="curObj='${r[0]}';go('estimate')"><td style="padding:8px"><b>${esc(OB(r[0]).n)}</b></td><td class="mono" style="padding:8px">${r[1]}</td>${[r[2],r[3],r[4]].map(v=>`<td class="mono" style="text-align:right;padding:8px">${seeMoney()?(v?mln(v):'—'):'·'}</td>`).join('')}<td class="mono" style="text-align:right;padding:8px;font-weight:800">${seeMoney()?(r[5]>=1e9?'2,5 млрд':mln(r[5])):'·'}</td><td style="text-align:right;padding:8px;width:120px">${barHtml(r[6],'var(--brand)')}<div class="mini" style="text-align:right">${r[6]}%</div></td><td style="padding:8px">${tag(r[7],r[7]==='утверждена'?'var(--ok)':r[7]==='закрыта'?'var(--muted)':'var(--warn)')}</td></tr>`).join('')}</tbody>
</table></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Версии</h3><p class="mini" style="margin:0">Смета меняется — заказчик добавил этаж, поменяли извещатели. Каждая версия хранится, разница видна, план и лимиты пересчитываются. Утверждённая версия — одна, по ней работают все.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Три вида чтения одной сметы</h3><p class="mini" style="margin:0">ПТО читает её как ведомость материалов и задания; снабжение — как лимиты по позициям; бухгалтер — как основу актов. Одна смета, три экрана.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Больница</h3><p class="mini" style="margin:0">Придёт спецификация на пять систем — смета посчитается по прайсу за час, а не за неделю. И дальше по ней пойдут все заявки на 2,5 млрд, а не таблицы с нуля.</p></div>
</div>`;

SC.estimate=()=>{const o=OB(curObj);const est=o.id==='O-1';return `<div class="hd"><div><h2>Смета · ${esc(o.n)}${est?' · v3':''}</h2>
 <p>${est?'По системам и разделам: материалы, работы, ПНР. У каждой позиции — единица, количество, цена из прайса, а справа то, чего в таблице не бывает: сколько выдано со склада и сколько смонтировано по отчётам.':'Смета этого объекта устроена так же, как у ЖК «Алтын Орда»; ниже показан пример на нём.'}</p></div>
 <div class="btns">${objSel()}<button class="bt" onclick="toast('Выгрузка в Excel в вашем привычном виде — для заказчика или тендера.')">В Excel</button><button class="bt p" onclick="go('factvs')">Смета против факта</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Материалы</small><b class="a">${seeMoney()?mln(EST.filter(isMat).reduce((a,s)=>a+secSum(s),0)):'3 системы'}</b><span>АПС, СОУЭ, домофония</span></div>
 <div><small>Работы</small><b>${seeMoney()?mln(secSum(EST[3])):'6 видов'}</b><span>монтаж, прокладка, адресация</span></div>
 <div><small>ПНР и сдача</small><b>${seeMoney()?mln(secSum(EST[4])):'2 позиции'}</b><span>пусконаладка, исполнительная</span></div>
 <div><small>Итого по смете</small><b class="g">${seeMoney()?mln(EST_TOTAL):'—'}</b><span>= сумма договора</span></div>
</div>
${EST.map(s=>`<div class="pan mx"><h3 style="margin:0 0 6px">${esc(s.sec)} <span class="mini">· ${seeMoney()?mln(secSum(s)):s.items.length+' позиций'}</span></h3>
 <table class="t" style="font-size:11.2px"><thead><tr style="border-bottom:1.5px solid var(--line2)">${['ПОЗИЦИЯ','ЕД.','ПО СМЕТЕ','ЦЕНА','СУММА','ВЫДАНО','СМОНТИРОВАНО','%'].map((h,i)=>`<th style="text-align:${i?'right':'left'};padding:6px 8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${s.items.map(([n,u,q,p,f,g])=>`<tr><td style="padding:6px 8px">${esc(n)}</td><td class="mono" style="text-align:right;padding:6px 8px;color:var(--muted)">${u}</td><td class="mono" style="text-align:right;padding:6px 8px">${fmt(q)}</td><td class="mono" style="text-align:right;padding:6px 8px">${seeMoney()?fmt(p):'·'}</td><td class="mono" style="text-align:right;padding:6px 8px;font-weight:700">${seeMoney()?fmt(q*p):'·'}</td><td class="mono" style="text-align:right;padding:6px 8px;color:${isMat(s)&&g>f?'var(--warn)':'inherit'}">${isMat(s)?fmt(g):'—'}</td><td class="mono" style="text-align:right;padding:6px 8px">${fmt(f)}</td><td class="mono" style="text-align:right;padding:6px 8px;color:${pct(f,q)>=100?'var(--ok)':'inherit'}">${pct(f,q)}%</td></tr>`).join('')}</tbody></table></div>`).join('')}
<div class="said"><b>Что видно уже здесь.</b> Кабель КПС: по смете 26 000 м, выдано 20 400, смонтировано 17 900 — 2 500 м лежат на объекте или ушли в отход. Лоток: выдано 1 420, смонтировано 1 380. Заявка на ещё 200 м лотка при таких цифрах — вопрос, а не автоматическая покупка. Это и есть чтение сметы в проекте.</div>`};

SC.calc=()=>`<div class="hd"><div><h2>Расчёт сметы из спецификации · по прайсу</h2>
 <p>Загружаете спецификацию проекта (Excel или таблица из рабочки) — позиции сопоставляются с прайсом, количества умножаются на цены, работы добавляются по нормам на единицу материала. Через час у ПТО есть смета, а не через два дня.</p></div>
 <div class="btns"><button class="bt p" onclick="calcRun()">Загрузить спецификацию</button></div></div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Пример · Областная больница · АПС, корпус А</h3>
  <table class="t" style="font-size:11.2px"><thead><tr style="border-bottom:1.5px solid var(--line2)">${['СТРОКА СПЕЦИФИКАЦИИ','КОЛ-ВО','ПОЗИЦИЯ ПРАЙСА','ЦЕНА','РАБОТЫ НА ЕД.','СТАТУС'].map((h,i)=>`<th style="text-align:${i===1||i===3||i===4?'right':'left'};padding:6px 8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
  <tbody>${[['Извещатель пожарный дымовой адресно-аналоговый',2840,'ИП 212-64',18500,'2 800 + 1 400','auto'],['Извещатель пожарный ручной адресный',212,'ИПР 513-11',9800,'2 800 + 1 400','auto'],['Прибор приёмно-контрольный, 4 линии',6,'ППКП 4 АЛС',712000,'по расценке ПНР','auto'],['Кабель огнестойкий 1×2×0,5',96000,'КПСнг(А)-FRLS 1×2×0,5',165,'210','auto'],['Оповещатель речевой настенный, 3 Вт',410,'Оповещатель речевой',14200,'3 200','auto'],['Изолятор линии',284,'Модуль изолятора КЗ',6400,'—','auto'],['Извещатель тепловой взрывозащищённый',24,'нет в прайсе','—','—','ask'],['Табло «Выход» 24 В',380,'Оповещатель световой «Выход»',4100,'3 200','check']]
   .map(([n,q,p,pr,w,st])=>`<tr><td style="padding:6px 8px">${esc(n)}</td><td class="mono" style="text-align:right;padding:6px 8px">${fmt(q)}</td><td style="padding:6px 8px;color:${st==='ask'?'var(--bad)':'inherit'}">${esc(p)}</td><td class="mono" style="text-align:right;padding:6px 8px">${seeMoney()?(pr==='—'?'—':fmt(pr)):'·'}</td><td class="mono" style="text-align:right;padding:6px 8px">${seeMoney()?w:'·'}</td><td style="padding:6px 8px">${st==='auto'?tag('сопоставлено','var(--ok)'):st==='check'?tag('проверить','var(--warn)'):tag('нет в прайсе','var(--bad)')}</td></tr>`).join('')}</tbody></table>
  <div class="mini" style="margin-top:8px">Сопоставлено 46 из 52 строк автоматически, 4 — «проверить» (похожие позиции), 2 — «нет в прайсе»: ПТО добавляет цену один раз, и она остаётся в прайсе.</div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Как считает</h3>
   <div class="num"><i>1</i><div><b>Спецификация → позиции прайса</b><p>По наименованию и характеристикам. Что не нашлось — список для ПТО.</p></div></div>
   <div class="num"><i>2</i><div><b>Материал → работы</b><p>К извещателю — монтаж и адресация, к кабелю — прокладка, к лотку — монтаж. Нормы на единицу задаёте один раз.</p></div></div>
   <div class="num"><i>3</i><div><b>Итог по системам и разделам</b><p>Материалы, работы, ПНР, исполнительная. Наценка и коэффициенты — ваши.</p></div></div>
   <div class="num"><i>4</i><div><b>Утверждение</b><p>ПТО проверяет, руководитель утверждает — смета становится лимитом для склада и планом для площадки.</p></div></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Что было бы вручную</h3><p class="mini" style="margin:0">Больница: 5 систем, ~600 строк спецификации. В таблице — два-три дня работы инженера ПТО с риском ошибок в цене. Здесь — час на сопоставление и проверку.</p></div>
 </div>
</div>`;

SC.factvs=()=>{const rows=[];EST.forEach(s=>s.items.forEach(([n,u,q,p,f,g])=>{if(isMat(s)&&q>0)rows.push({n,u,q,p,f,g,sec:s.sec})}));return `<div class="hd"><div><h2>Смета против факта · ${esc(OB(curObj).n)}</h2>
 <p>Три числа по каждой позиции: по смете, выдано со склада, смонтировано по отчётам. Разница между «выдано» и «смонтировано» — материал на объекте, отход или потеря. Разница между сметой и фактом — перерасход или экономия.</p></div>
 <div class="btns">${objSel()}<button class="bt" onclick="toast('Инвентаризация на объекте: бригадир пересчитывает остатки с телефона, система сравнивает с «выдано − смонтировано».')">Инвентаризация объекта</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Материалов по смете</small><b class="a">${seeMoney()?mln(EST.filter(isMat).reduce((a,s)=>a+secSum(s),0)):'14 позиций'}</b><span>3 системы</span></div>
 <div><small>Выдано со склада</small><b>${seeMoney()?mln(rows.reduce((a,r)=>a+r.g*r.p,0)):'по накладным'}</b><span>по накладным на объект</span></div>
 <div><small>Смонтировано</small><b class="g">${seeMoney()?mln(rows.reduce((a,r)=>a+r.f*r.p,0)):'по отчётам'}</b><span>по отчётам с площадки</span></div>
 <div><small>«Выдано − смонтировано»</small><b class="w">${seeMoney()?mln(rows.reduce((a,r)=>a+(r.g-r.f)*r.p,0)):'разница'}</b><span>на объекте или в отходе</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11.2px"><thead><tr style="border-bottom:1.5px solid var(--line2)">${['ПОЗИЦИЯ','ЕД.','СМЕТА','ВЫДАНО','СМОНТИРОВАНО','НА ОБЪЕКТЕ','ОСТАТОК ПО СМЕТЕ','СИГНАЛ'].map((h,i)=>`<th style="text-align:${i?'right':'left'};padding:6px 8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${rows.map(r=>{const onsite=r.g-r.f,left=r.q-r.g;const sig=onsite>r.q*0.08?['проверить остаток','var(--warn)']:left<0?['сверх сметы','var(--bad)']:['ок','var(--ok)'];return `<tr><td style="padding:6px 8px">${esc(r.n)}<div class="mini">${esc(r.sec)}</div></td><td class="mono" style="text-align:right;padding:6px 8px;color:var(--muted)">${r.u}</td><td class="mono" style="text-align:right;padding:6px 8px">${fmt(r.q)}</td><td class="mono" style="text-align:right;padding:6px 8px">${fmt(r.g)}</td><td class="mono" style="text-align:right;padding:6px 8px">${fmt(r.f)}</td><td class="mono" style="text-align:right;padding:6px 8px;color:${onsite>r.q*0.08?'var(--warn)':'inherit'}">${fmt(onsite)}</td><td class="mono" style="text-align:right;padding:6px 8px;color:${left<0?'var(--bad)':'inherit'}">${fmt(left)}</td><td style="text-align:right;padding:6px 8px">${tag(sig[0],sig[1])}</td></tr>`}).join('')}</tbody></table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Кабель КПС · 2 500 м на объекте</h3><p class="mini" style="margin:0">Это 9,6% сметного количества, при обычном отходе 3–5%. Либо лежит в бухтах на 7 этаже, либо ушло. Инвентаризация объекта с телефона за полчаса ответит. Без системы это всплыло бы при закрытии объекта — когда уже не найти.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Зачем это ПТО и снабжению</h3><p class="mini" style="margin:0">ПТО видит, где факт уходит от сметы, и правит нормы или ставит вопрос прорабу. Снабжение не закупает сверх сметы без решения. Бухгалтер списывает материалы по актам на объём, а не «всё, что выдали».</p></div>
</div>`};
/* ====== ПТО ====== */
SC.pto=()=>`<div class="hd"><div><h2>Пульт ПТО · Асель</h2>
 <p>Ваши слова: «отдел ПТО — где мне хотелось бы видеть информацию». Здесь то, чем ПТО живёт каждый день: сметы к утверждению, заявки на сверку, объёмы с площадок, исполнительная по объектам, акты к выставлению. И что горит.</p></div>
 <div class="btns"><button class="bt" onclick="go('calc')">Смета из спецификации</button><button class="bt p" onclick="go('docs')">Исполнительная</button></div></div>
<div class="wid" style="grid-template-columns:repeat(5,1fr)">
 <div><small>Заявок на сверку</small><b class="a">${REQ.filter(r=>r.st==='pto'||r.st==='new').length}</b><span>сверка со сметой — минута</span></div>
 <div><small>Сверх сметы</small><b class="r">1</b><span>З-234 · лоток</span></div>
 <div><small>Объёмов за вчера</small><b>5 отчётов</b><span>легли в ведомости</span></div>
 <div><small>Актов скрытых работ без подписи</small><b class="r">1</b><span>потолки закрывают 22.09</span></div>
 <div><small>Актов выполненных работ к выставлению</small><b>2</b><span>из объёмов за 1–15.09</span></div>
</div>
<div class="g2">
 <div>
  <div class="tsk" style="--c:var(--bad)"><b>ЖК «Алтын Орда» · акт скрытых работ 6 этаж</b><p class="mini" style="margin:5px 0 8px">Кабель проложен 14.09 по отчёту Каната. Акт не оформлен, потолки закрывают 22.09. Сформировать из отчёта и подписать с представителем заказчика.</p><button class="bt p" onclick="hiddenAct()">Сформировать акт</button></div>
  <div class="tsk" style="--c:var(--warn)"><b>Заявка З-234 · лоток 200 м · сверх остатка</b><p class="mini" style="margin:5px 0 8px">Остаток по смете 180 м, на объекте не смонтировано 40 м. Вернуть прорабу с вопросом или согласовать допработы с заказчиком.</p><button class="bt" onclick="go('requests')">Открыть заявку</button></div>
  <div class="tsk" style="--c:var(--acc)"><b>Акт выполненных работ · ТРЦ «Ертіс» · 1–15.09</b><p class="mini" style="margin:5px 0 8px">Черновик собран из объёмов: 9,4 млн. Проверить и отправить заказчику на подпись.</p><button class="bt" onclick="go('acts')">Открыть акты</button></div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Исполнительная по объектам</h3>
   ${[['ЖК «Алтын Орда»',5,9,'bad'],['ТРЦ «Ертіс»',3,9,'work'],['Школа № 44',7,9,'work'],['Завод ТМК',1,9,'work'],['БЦ «Ертыс Плаза»',8,9,'warn']].map(([n,d,t,s])=>`<div class="fr" style="grid-template-columns:150px 1fr 60px"><span style="font-size:11.3px">${n}</span>${barHtml(d/t*100,s==='bad'?'var(--bad)':s==='warn'?'var(--warn)':'var(--brand)')}<b class="mono" style="text-align:right">${d} / ${t}</b></div>`).join('')}
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Что ПТО больше не делает руками</h3><p class="mini" style="margin:0">Не сводит объёмы из сообщений в WhatsApp, не переписывает ведомость из сметы, не считает смету в таблице по два дня, не ищет, какой акт скрытых работ забыли. Остаётся инженерная работа: проверить, подписать, решить.</p></div>
 </div>
</div>`;

SC.tasks=()=>{const list=role==='Бригадир'?TASKS.filter(t=>t.crew.indexOf('Самат')>=0):role==='Прораб'?TASKS.filter(t=>t.obj==='O-1'||t.obj==='O-3'):TASKS;return `<div class="hd"><div><h2>Задания на монтаж</h2>
 <p>Из плана недели ПТО или прораб выдаёт бригаде задание: этаж, вид работ, объём, срок. Бригадир видит его в телефоне и вечером отчитывается по нему же — факт ложится в задание, в план и в ведомость.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Новое задание: объект, этаж или зона, вид работ из сметы, объём, бригада, срок. Уходит бригадиру в телефон.')">+ Задание</button></div></div>
<div class="pan">${list.map(t=>`<div class="dl" style="--c:${t.st==='late'?'var(--bad)':pct(t.done,t.plan)>=100?'var(--ok)':'var(--acc)'}"><div style="flex:1;min-width:0"><b>${esc(t.t)}</b><div class="mini">${esc(OB(t.obj).n)} · ${esc(t.crew)} · срок ${t.due}</div></div><div style="width:140px">${barHtml(pct(t.done,t.plan),t.st==='late'?'var(--bad)':'var(--brand)')}<div class="mini" style="text-align:right;margin-top:3px">${fmt(t.done)} / ${fmt(t.plan)}</div></div>${t.st==='late'?tag('просрочено','var(--bad)'):tag('в работе','var(--acc)')}</div>`).join('')}</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Задание — это строка сметы</h3><p class="mini" style="margin:0">Вид работ берётся из сметы объекта, объём — из остатка. Нельзя выдать задание на 3 000 м кабеля, если по смете осталось 1 900: система спросит, это допработы или ошибка.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Не только монтаж</h3><p class="mini" style="margin:0">Подписать акт, передать документы, забрать материал — тоже задания, тому же прорабу или ПТО, с тем же контролем срока. Просроченное поднимается на пульт.</p></div>
</div>`};

SC.volumes=()=>`<div class="hd"><div><h2>Объёмы · выполнено · ${esc(OB(curObj).n)}</h2>
 <p>Накопительная ведомость: сколько смонтировано по каждому виду работ — из ежедневных отчётов. Из неё — акты выполненных работ заказчику и ведомость смонтированного оборудования для исполнительной.</p></div>
 <div class="btns">${objSel()}<button class="bt" onclick="toast('Выгрузка накопительной ведомости в Excel — в форме, которую принимает заказчик.')">В Excel</button><button class="bt p" onclick="go('acts')">Сформировать акт</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.3px"><thead><tr style="border-bottom:1.5px solid var(--line2)">${['ВИД РАБОТ','ЕД.','ПО СМЕТЕ','ВЫПОЛНЕНО ВСЕГО','ЗА 1–15.09','В АКТАХ','К АКТУ','%'].map((h,i)=>`<th style="text-align:${i?'right':'left'};padding:6px 8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${EST[3].items.map(([n,u,q,p,f])=>{const acted=Math.round(f*0.72),period=Math.round(f*0.21);return `<tr><td style="padding:6px 8px">${esc(n)}</td><td class="mono" style="text-align:right;padding:6px 8px;color:var(--muted)">${u}</td><td class="mono" style="text-align:right;padding:6px 8px">${fmt(q)}</td><td class="mono" style="text-align:right;padding:6px 8px;font-weight:700">${fmt(f)}</td><td class="mono" style="text-align:right;padding:6px 8px">${fmt(period)}</td><td class="mono" style="text-align:right;padding:6px 8px">${fmt(acted)}</td><td class="mono" style="text-align:right;padding:6px 8px;color:var(--ok)">${fmt(f-acted)}</td><td class="mono" style="text-align:right;padding:6px 8px">${pct(f,q)}%</td></tr>`}).join('')}</tbody></table></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Откуда цифры</h3><p class="mini" style="margin:0">Из отчётов бригадиров, по заданиям. ПТО не переписывает — проверяет: отчёт против выдачи со склада и против фото.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">К акту</h3><p class="mini" style="margin:0">Выполнено, но ещё не включено в акт заказчику — то, что можно выставить сегодня. По ЖК это 1,9 млн работ за неделю, которые иначе ждали бы конца месяца.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">В исполнительную</h3><p class="mini" style="margin:0">Ведомость смонтированного оборудования собирается из этих же строк по материалам: извещатели, приборы, оповещатели — с количеством и этажами.</p></div>
</div>`;

SC.docs=()=>`<div class="hd"><div><h2>Исполнительная документация · ${esc(OB(curObj).n)}</h2>
 <p>Пакет по объекту: акты скрытых работ, ведомость смонтированного оборудования, журнал работ, паспорта и сертификаты, исполнительные схемы, акт ПНР, акт приёмки. Что собирается само, что подписывать, чего не хватает — и когда станет поздно.</p></div>
 <div class="btns">${objSel()}<button class="bt" onclick="toast('Шаблоны актов и ведомостей — ваши формы. Данные подставляются из объекта, объёмов и сметы.')">Шаблоны</button><button class="bt p" onclick="hiddenAct()">Акт скрытых работ</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Документов в пакете</small><b class="a">${DOCS.length}</b><span>по чек-листу объекта</span></div>
 <div><small>Готово</small><b class="g">${DOCS.filter(d=>d[2]==='ok').length}</b><span>подписано и в папке</span></div>
 <div><small>Собирается из данных</small><b>${DOCS.filter(d=>d[2]==='work').length}</b><span>ведомость, журнал</span></div>
 <div><small>Срочно</small><b class="r">${DOCS.filter(d=>d[2]==='bad').length}</b><span>до закрытия потолков</span></div>
</div>
<div class="pan">${DOCS.map(([n,s,k])=>`<div class="dl" style="--c:${k==='ok'?'var(--ok)':k==='bad'?'var(--bad)':k==='warn'?'var(--warn)':k==='work'?'var(--acc)':'var(--line2)'}"><div style="flex:1"><b>${esc(n)}</b><div class="mini" style="color:${k==='bad'?'var(--bad)':'inherit'}">${esc(s)}</div></div>${k==='bad'?`<button class="bt p" onclick="hiddenAct()">Сформировать</button>`:k==='warn'?`<button class="bt" onclick="toast('Запрос паспортов поставщику отправлен из карточки заказа ЗП-117.')">Запросить</button>`:tag(k==='ok'?'готово':k==='work'?'собирается':'позже',k==='ok'?'var(--ok)':k==='work'?'var(--acc)':'var(--muted)')}</div>`).join('')}</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Акт скрытых работ — с датой «поздно»</h3><p class="mini" style="margin:0">Кабель в потолке, труба в стяжке, лоток за фальшстеной — работа, которую нельзя предъявить после закрытия. Прораб в отчёте отмечает «закрывают 22.09» — система ставит ПТО срок на акт за два дня. Не подписал вовремя — переделка за свой счёт.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Что собирается само</h3><p class="mini" style="margin:0">Ведомость смонтированного оборудования — из объёмов; журнал работ — из отчётов; паспорта — из карточек заказов поставщикам. ПТО дописывает схемы и подписывает. Пакет на сдачу собирается за день, а не за две недели.</p></div>
</div>`;

SC.acts=()=>`<div class="hd"><div><h2>Акты выполненных работ</h2>
 <p>Акт формируется из накопительной ведомости за период: выполнено минус уже актировано. ПТО проверяет, руководитель утверждает, заказчик подписывает, бухгалтер видит оплату. Дебиторка — по актам, а не по памяти.</p></div>
 <div class="btns"><button class="bt p" onclick="actRun()">+ Акт из объёмов</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Выставлено в сентябре</small><b class="a">${seeMoney()?tg(24000000):'3 акта'}</b><span>3 акта</span></div>
 <div><small>На подписи у заказчика</small><b class="w">${seeMoney()?tg(6500000):'1'}</b><span>Школа № 44 · 6 дней</span></div>
 <div><small>Подписано, ждёт оплаты</small><b>${seeMoney()?tg(15700000):'2'}</b><span>ЖК, БЦ</span></div>
 <div><small>Можно выставить сегодня</small><b class="g">${seeMoney()?tg(11300000):'2 черновика'}</b><span>из объёмов 1–15.09</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11.4px"><thead><tr style="border-bottom:1.5px solid var(--line2)">${['АКТ','ОБЪЕКТ','ПЕРИОД','СУММА','СТАТУС',''].map((h,i)=>`<th style="text-align:${i===3?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${ACTS.map(a=>`<tr><td class="mono" style="padding:8px"><b>${a.id}</b></td><td style="padding:8px">${esc(OB(a.obj).n)}</td><td style="padding:8px">${esc(a.per)}</td><td class="mono" style="text-align:right;padding:8px;font-weight:700">${seeMoney()?tg(a.sum):'·'}</td><td style="padding:8px">${tag(AST[a.st][0],AST[a.st][1])}</td><td style="padding:8px;text-align:right">${a.st==='draft'?`<button class="bt p" onclick="toast('Акт ${a.id} проверен и отправлен заказчику на подпись. Дебиторка появится после подписания.')">Отправить</button>`:a.st==='signed'?`<button class="bt" onclick="toast('Напоминание заказчику об оплате акта ${a.id} отправлено — с объектом, суммой и датой подписания.')">Напомнить</button>`:''}</td></tr>`).join('')}</tbody></table></div>
<div class="said"><b>Ваши слова про госзакуп.</b> Школа и больница — бюджетные заказчики: акт на подписи 6 дней, оплата по регламенту. Система показывает, где акт застрял, и напоминает — без звонков «а вы подписали?».</div>`;

/* ====== ЛЮДИ ====== */
SC.attendance=()=>{const list=role==='Бригадир'?STAFF.filter(s=>s.obj==='O-1'&&s.pos!=='прораб'):role==='Прораб'?STAFF.filter(s=>s.obj==='O-1'||s.obj==='O-3'):STAFF;return `<div class="hd"><div><h2>Присутствие · геолокация · 20 сентября</h2>
 <p>Ваши слова: «чтобы рабочий персонал отмечался — Face ID, с телефона, с ноутбука, и всё сваливалось в таблицу, а бухгалтер считал автоматически». Здесь монтажник отмечается на объекте с телефона по геолокации, в офисе — терминал, а табель считается сам.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Античит: отметка принимается только в радиусе объекта, привязана к устройству, фото при первой отметке дня по желанию. Журнал: время, координаты, устройство.')">Античит</button><button class="bt p" onclick="markRun()">Я на объекте</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>На объектах сейчас</small><b class="a">51 из 58</b><span>по геолокации</span></div>
 <div><small>Не отметились</small><b class="w">7</b><span>прорабы подтверждают или нет</span></div>
 <div><small>Опоздания за месяц</small><b>23</b><span>у 9 человек</span></div>
 <div><small>Отметок вне радиуса</small><b class="g">0</b><span>отклонено системой: 5</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11.4px"><thead><tr style="border-bottom:1.5px solid var(--line2)">${['СОТРУДНИК','ДОЛЖНОСТЬ','ОБЪЕКТ','СЕГОДНЯ','ДНЕЙ · МЕСЯЦ','ЧАСОВ','ПЕРЕРАБОТКА','ОПЛАТА'].map((h,i)=>`<th style="text-align:${i>=3?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${list.map(s=>`<tr><td style="padding:8px"><b>${esc(s.n)}</b></td><td style="padding:8px;color:var(--muted)">${esc(s.pos)}</td><td style="padding:8px">${esc(OB(s.obj).n)}</td><td class="mono" style="text-align:right;padding:8px;color:${s.geo?'var(--ok)':'var(--warn)'}">${s.geo?s.mark:'нет отметки'}</td><td class="mono" style="text-align:right;padding:8px">${s.days} из 20</td><td class="mono" style="text-align:right;padding:8px">${s.hours}</td><td class="mono" style="text-align:right;padding:8px;color:${s.ot?'var(--warn)':'inherit'}">${s.ot||'—'}</td><td style="text-align:right;padding:8px">${tag(s.type,s.type==='оклад'?'var(--muted)':'var(--acc)')}</td></tr>`).join('')}
 ${role==='Бригадир'?'':'<tr><td colspan="8" style="padding:8px;color:var(--muted)">+ ещё 48 человек</td></tr>'}</tbody></table></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">На объекте — телефон</h3><p class="mini" style="margin:0">Открыл значок, нажал «я на объекте» — телефон отдал геолокацию. Дальше радиуса объекта или геолокация выключена — кнопка не сработает и объяснит почему. Вечером — «ушёл». Прораб видит, кто на месте, без переклички.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">В офисе — терминал</h3><p class="mini" style="margin:0">Face ID или отпечаток на входе, как вы описали. Терминал подключаем к системе, отметка ложится в тот же табель. Для ПТО, бухгалтерии, склада.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Нет отметки</h3><p class="mini" style="margin:0">День не попадёт в табель, пока прораб не подтвердит: «был, телефон сел». Подтверждение с именем — в журнале. Спор о днях в конце месяца исчезает.</p></div>
</div>`};

SC.timesheet=()=>`<div class="hd"><div><h2>Табель · сентябрь · считается сам</h2>
 <p>Ваши слова: «хотел бы автоматический расчёт табеля». Дни и часы — из отметок и подтверждений прораба, переработка — от 8 часов, объект — по геолокации. Бухгалтер получает готовый табель по объектам и людям, без сбора.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Табель за сентябрь по 58 сотрудникам выгружен в Excel — по объектам, для бухгалтерии и для распределения ФОТ по объектам.')">В Excel</button><button class="bt p" onclick="toast('Табель за 1–20 сентября закрыт: 58 человек, 1 016 человеко-дней, 8 274 часа, переработка 214 часов. Спорных дней 3 — у прорабов на подтверждении.')">Закрыть период</button></div></div>
<div class="wid" style="grid-template-columns:repeat(5,1fr)">
 <div><small>Человеко-дней</small><b class="a">1 016</b><span>1–20 сентября</span></div>
 <div><small>Часов</small><b>8 274</b><span>из них переработка 214</span></div>
 <div><small>По объектам</small><b>5</b><span>ФОТ ложится в объект</span></div>
 <div><small>Спорных дней</small><b class="w">3</b><span>ждут подтверждения прораба</span></div>
 <div><small>Собрано вручную</small><b class="g">0 часов</b><span>раньше — 2 дня бухгалтера</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11px"><thead><tr style="border-bottom:1.5px solid var(--line2)"><th style="text-align:left;padding:7px 8px;font-size:10px;color:var(--muted)">СОТРУДНИК · ОБЪЕКТ</th>${['15','16','17','18','19','20'].map(d=>`<th style="text-align:center;padding:7px 4px;font-size:10px;color:var(--muted)">${d}.09</th>`).join('')}<th style="text-align:right;padding:7px 8px;font-size:10px;color:var(--muted)">ДНЕЙ</th><th style="text-align:right;padding:7px 8px;font-size:10px;color:var(--muted)">ЧАСОВ</th><th style="text-align:right;padding:7px 8px;font-size:10px;color:var(--muted)">ПЕРЕРАБ.</th></tr></thead>
 <tbody>${STAFF.map((s,i)=>`<tr><td style="padding:6px 8px"><b>${esc(s.n)}</b><div class="mini">${esc(s.pos)} · ${esc(OB(s.obj).n)}</div></td>${[8,8,9,8,8,s.geo?8:0].map((h,j)=>`<td class="mono" style="text-align:center;padding:6px 4px;color:${h===0?'var(--warn)':h>8?'var(--acc)':'inherit'}">${h===0?(s.geo?'—':'?'):h}</td>`).join('')}<td class="mono" style="text-align:right;padding:6px 8px">${s.days}</td><td class="mono" style="text-align:right;padding:6px 8px;font-weight:700">${s.hours}</td><td class="mono" style="text-align:right;padding:6px 8px;color:${s.ot?'var(--warn)':'var(--muted2)'}">${s.ot||'—'}</td></tr>`).join('')}
 <tr><td colspan="10" style="padding:8px;color:var(--muted)">+ ещё 48 человек · «?» — нет отметки, ждёт подтверждения прораба</td></tr></tbody></table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">ФОТ по объектам</h3><p class="mini" style="margin:0">Часы по геолокации привязаны к объекту, поэтому зарплата ложится в расходы того объекта, где человек работал. Перекинули бригаду на два дня на школу — эти два дня в школе. Маржа объекта считается честно.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Переработка</h3><p class="mini" style="margin:0">Свыше 8 часов на объекте — переработка, считается по вашему правилу (×1,5 или фикс). Айдос на ПНР школы — 12 часов за неделю: видно, кто тянет сдачу.</p></div>
</div>`;

SC.pay=()=>`<div class="hd"><div><h2>Зарплата · сентябрь</h2>
 <p>Ваши слова: «зарплата у всех плюс-минус одинаковая, указывалась заранее, считалось автоматически». Здесь три правила: оклад по дням, сдельно по объёмам из отчётов, почасовая по табелю. Формулу даёте вы, система считает одинаково для всех.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Правила: оклад / 20 × дни; сдельно — ставка за точку и за метр из отчётов; почасовая — часы × ставка; переработка ×1,5; премия прорабу за срок. Настраивает бухгалтер.')">Правила</button><button class="bt p" onclick="toast('Ведомость за сентябрь по 58 сотрудникам сформирована по объектам. Каждый видит свою строку в телефоне.')">Рассчитать</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.3px"><thead><tr style="border-bottom:1.5px solid var(--line2)">${['СОТРУДНИК','ПРАВИЛО','ДНИ · ЧАСЫ','ОБЪЁМ','БАЗА','ПЕРЕРАБОТКА','ИТОГО'].map((h,i)=>`<th style="text-align:${i>=2?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${[['Самат Т.','сдельно · бригадир','18 · 152','1 490 точек-экв.',372500,22500,395000],['Нурбол А.','сдельно','18 · 150','1 380 точек-экв.',276000,15000,291000],['Аскар Ж.','сдельно','17 · 140','1 210 точек-экв.',242000,0,242000],['Ерлан Б.','оклад · прораб','19 · 160','2 объекта в графике',450000,0,450000],['Дамир С.','оклад · мастер','18 · 148','бригада 82% нормы',340000,20400,360400],['Тимур Е.','почасовая','15 · 118','—',177000,0,177000],['Айдос М.','оклад · ПНР','19 · 156','12 шлейфов',380000,42750,422750],['Азамат К.','оклад · прораб','19 · 162','—',450000,0,450000]]
  .map(r=>`<tr><td style="padding:8px"><b>${r[0]}</b></td><td style="padding:8px;color:var(--muted)">${r[1]}</td><td class="mono" style="text-align:right;padding:8px">${r[2]}</td><td class="mono" style="text-align:right;padding:8px">${r[3]}</td><td class="mono" style="text-align:right;padding:8px">${seeMoney()?fmt(r[4]):'·'}</td><td class="mono" style="text-align:right;padding:8px;color:${r[5]?'var(--warn)':'var(--muted2)'}">${seeMoney()?(r[5]?'+'+fmt(r[5]):'—'):'·'}</td><td class="mono" style="text-align:right;padding:8px;font-weight:800">${seeMoney()?fmt(r[6]):'·'}</td></tr>`).join('')}
 <tr><td colspan="7" style="padding:8px;color:var(--muted)">+ ещё 50 сотрудников</td></tr></tbody></table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Сдельно — из тех же отчётов</h3><p class="mini" style="margin:0">Объём, который бригадир сдал вечером, — это и план-факт, и ведомость, и его зарплата. Одна цифра, три назначения. Приписать объём ради зарплаты не выйдет — он сверяется со складом и с актом заказчику.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Каждый видит свою строку</h3><p class="mini" style="margin:0">Монтажник в телефоне видит свои дни, объёмы и сумму весь месяц. Вопрос «почему столько» отпадает: цифры видели оба.</p></div>
</div>`;

SC.crews=()=>`<div class="hd"><div><h2>Бригады и нормы выработки</h2>
 <p>Кто на каком объекте, сколько людей, какая норма, как отработали неделю. Нормы — ваши, из практики; по факту первых недель уточняются. От норм считается план объекта и срок.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Перевод бригады на другой объект — кнопкой: с этого дня отметки и ФОТ идут на новый объект.')">Перевести бригаду</button></div></div>
<div class="pan">${CREWS.map(c=>`<div class="dl" style="--c:${c.eff>=90?'var(--ok)':c.eff>0?'var(--warn)':'var(--line2)'}"><div style="flex:1;min-width:0"><b>${esc(c.n)}</b> <span class="mini">· ${esc(OB(c.obj).n)} · ${c.ppl} чел</span><div class="mini">норма: ${esc(c.norm)}</div><div class="mini" style="color:var(--muted2)">${esc(c.week)}</div></div><div style="width:130px">${c.eff?barHtml(c.eff,c.eff>=90?'var(--ok)':'var(--warn)'):''}<div class="mini" style="text-align:right;margin-top:3px">${c.eff?c.eff+'% нормы':'простой'}</div></div></div>`).join('')}</div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Бригада Дамира · 82%</h3><p class="mini" style="margin:0">Вторую неделю ниже нормы. Причины в отчётах: простой из-за заказчика 2 часа, ждали коммутаторы 1 день. То есть проблема не в людях — в доступе и снабжении. Это видно, а не обсуждается.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Бригада Серика · простой</h3><p class="mini" style="margin:0">Периметр на заводе: 9 человек копают траншею и ждут извещатели с 22.09. Система предлагает перевести 5 человек на ТРЦ на два дня — там отставание.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Больница · сколько людей</h3><p class="mini" style="margin:0">Придёт смета — по нормам посчитается, сколько бригад и на сколько месяцев. До тендера на следующий объект, а не после.</p></div>
</div>`;
/* ====== СКЛАД ====== */
SC.requests=()=>{const list=role==='Бригадир'?REQ.filter(r=>r.who==='Самат Т.'||r.who==='Канат Р.'):role==='Прораб'?REQ.filter(r=>r.obj==='O-1'||r.obj==='O-3'):REQ;return `<div class="hd"><div><h2>Заявки с объектов</h2>
 <p>Бригадир пишет заявку с телефона: что, сколько, к какому дню. Система сверяет со сметой — остаток по позиции — и передаёт снабжению. Статусы «сверка — заказано — в пути — на складе — выдано» видны всем. Ваши слова: «где находятся, статусы».</p></div>
 <div class="btns"><button class="bt p" onclick="reqRun()">+ Заявка</button></div></div>
<div class="wid" style="grid-template-columns:repeat(5,1fr)">
 <div><small>Открытых</small><b class="a">${REQ.filter(r=>r.st!=='done').length}</b><span>${REQ.filter(r=>r.st==='new').length} новых</span></div>
 <div><small>На сверке ПТО</small><b>${REQ.filter(r=>r.st==='pto').length}</b><span>минута на заявку</span></div>
 <div><small>Сверх сметы</small><b class="r">${REQ.filter(r=>r.st==='over').length}</b><span>решение прораба</span></div>
 <div><small>В пути</small><b class="w">${REQ.filter(r=>r.st==='order').length+1}</b><span>2 заказа</span></div>
 <div><small>Средний срок заявки</small><b class="g">2,4 дня</b><span>от бригадира до выдачи</span></div>
</div>
<div class="pan">${list.map(r=>`<div class="dl" style="--c:${RST[r.st][1]}"><b class="mono" style="width:44px">${r.id}</b><div style="flex:1;min-width:0"><b>${esc(OB(r.obj).n)}</b> <span class="mini">· ${esc(r.who)} · ${esc(r.need)}</span><div class="mini">${esc(r.what)}</div><div class="mini" style="color:${r.st==='over'?'var(--bad)':'var(--muted2)'}">${esc(r.note)}</div></div>${tag(RST[r.st][0],RST[r.st][1])}${r.st==='over'?`<button class="bt" onclick="toast('Заявка возвращена прорабу Ерлану с вопросом: 40 м лотка выдано и не смонтировано — где? Если допработы заказчика — оформить дополнение к смете.')">Вернуть прорабу</button>`:r.st==='new'||r.st==='pto'?`<button class="bt p" onclick="toast('Сверено со сметой: в лимите. Передано снабжению, бригадиру — статус в телефон.')">Сверить</button>`:''}</div>`).join('')}</div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Сверка со сметой</h3><p class="mini" style="margin:0">По каждой позиции заявки — остаток по смете минус выдано. В лимите — снабжению автоматически. Сверх — стоп и вопрос прорабу. Ни одна покупка сверх сметы не проходит без решения.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Со склада или у поставщика</h3><p class="mini" style="margin:0">Есть на складе — выдача и накладная на объект. Нет — заказ поставщику с датой; бригадир видит «в пути до 23.09» и планирует работу под материал.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Ничего не теряется</h3><p class="mini" style="margin:0">Ваши слова: «отправил в WhatsApp — потерялось». Заявка живёт в системе до выдачи, с историей и ответственным на каждом шаге.</p></div>
</div>`};

SC.stock=()=>`<div class="hd"><div><h2>Склад и остатки на объектах</h2>
 <p>Ваши слова: «склад есть, 1С не нужна». Склад ведётся здесь: центральный склад, остатки на каждом объекте, минимумы, приход от поставщиков, выдача на объекты по накладным, возвраты, инвентаризация. Одна таблица вместо нескольких.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Инвентаризация: кладовщик или бригадир пересчитывает с телефона, система сравнивает с учётом и показывает расхождения.')">Инвентаризация</button><button class="bt p" onclick="toast('Приход: накладная поставщика, позиции сопоставляются с заказом ЗП-118, остаток пересчитан, паспорта прикреплены.')">+ Приход</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.3px"><thead><tr style="border-bottom:1.5px solid var(--line2)">${['ПОЗИЦИЯ','ЕД.','СКЛАД','МИНИМУМ','ЖК АЛТЫН ОРДА','ТРЦ ЕРТІС','ЗАВОД ТМК','ВСЕГО','СИГНАЛ'].map((h,i)=>`<th style="text-align:${i?'right':'left'};padding:7px 8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${STOCK.map(s=>`<tr><td style="padding:7px 8px"><b>${esc(s.n)}</b></td><td class="mono" style="text-align:right;padding:7px 8px;color:var(--muted)">${s.u}</td><td class="mono" style="text-align:right;padding:7px 8px;font-weight:700;color:${s.wh<s.min?'var(--warn)':'inherit'}">${fmt(s.wh)}</td><td class="mono" style="text-align:right;padding:7px 8px;color:var(--muted)">${fmt(s.min)}</td><td class="mono" style="text-align:right;padding:7px 8px">${fmt(s.o1)}</td><td class="mono" style="text-align:right;padding:7px 8px">${fmt(s.o2)}</td><td class="mono" style="text-align:right;padding:7px 8px">${fmt(s.o4)}</td><td class="mono" style="text-align:right;padding:7px 8px">${fmt(s.wh+s.o1+s.o2+s.o4)}</td><td style="text-align:right;padding:7px 8px">${s.wh<s.min?tag('ниже минимума','var(--warn)'):tag('ок','var(--ok)')}</td></tr>`).join('')}</tbody></table></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Остаток на объекте</h3><p class="mini" style="margin:0">Выдано на объект минус смонтировано по отчётам. Кабель КПС на ЖК — 2 500 м: столько должно лежать на 7 этаже. Инвентаризация подтверждает или показывает недостачу.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Минимум</h3><p class="mini" style="margin:0">Ниже минимума — снабжению задача «заказать» до того, как бригада встанет. Минимумы считаются от плана ближайших недель по всем объектам.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Без 1С</h3><p class="mini" style="margin:0">Как договорились: склад стабильнее вести здесь, чем синхронизировать в обе стороны. Бухгалтеру — выгрузка приходов и списаний за период.</p></div>
</div>`;

SC.purchase=()=>`<div class="hd"><div><h2>Закуп и статусы</h2>
 <p>Заказы поставщикам собираются из заявок и минимумов: что, у кого, за сколько, когда приедет. Статус меняется по событию: счёт, оплата, отгрузка, приход. Бригадир на объекте видит тот же статус в телефоне.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Поставщики: история цен по позициям, сроки поставки по факту, паспорта и сертификаты. Кто подорожал — видно.')">Поставщики</button><button class="bt p" onclick="toast('Заказ ЗП-121 сформирован из заявки З-232 после сверки ПТО: камеры 24 шт, коммутаторы 2 шт, «Видеотех», 3 960 000 ₸. Счёт запрошен.')">+ Заказ</button></div></div>
<div class="pan">${ORDERS.map(o=>`<div class="dl" style="--c:${OST[o.st][1]}"><b class="mono" style="width:56px">${o.id}</b><div style="flex:1;min-width:0"><b>${esc(o.sup)}</b><div class="mini">${esc(o.what)}</div></div><b class="mono" style="width:110px;text-align:right">${seeMoney()||role==='Снабжение'?tg(o.sum):''}</b><span class="mini" style="width:120px;text-align:right">${esc(o.eta)}</span>${tag(OST[o.st][0],OST[o.st][1])}</div>`).join('')}</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Кто что видит</h3><p class="mini" style="margin:0">Снабжение — цены и поставщиков. Прораб и бригадир — статус и дату, без цен. Бухгалтер — счета к оплате. Директор — всё, включая историю цен и кто у кого покупает.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Ваши слова про отдел закупа</h3><p class="mini" style="margin:0">«Если это всё прозрачно делаете — будет забастовка». Здесь прозрачно: цена в заказе, история цен поставщика, паспорта на оборудование. Не для подозрений, а чтобы больница на 2,5 млрд закупалась по правилам, а не по памяти.</p></div>
</div>`;

SC.writeoff=()=>`<div class="hd"><div><h2>Списание по актам</h2>
 <p>Материал списывается на объект не «сколько выдали», а сколько смонтировано по акту выполненных работ. Разница остаётся на объекте до следующего акта или возвращается на склад. Бухгалтер получает списание с привязкой к акту и объёму.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Списание по АВР-17 сформировано: 8 позиций на 5 240 000 ₸, привязано к объёмам 1–15.09. Остаток на объекте пересчитан.')">Списать по акту</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.3px"><thead><tr style="border-bottom:1.5px solid var(--line2)">${['АКТ','ОБЪЕКТ','ПЕРИОД','ПОЗИЦИЙ','СПИСАНО МАТЕРИАЛОВ','ОСТАЛОСЬ НА ОБЪЕКТЕ','СТАТУС'].map((h,i)=>`<th style="text-align:${i>=3?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${[['АВР-14','O-1','август',11,9860000,1420000,'проведено'],['АВР-17','O-1','сентябрь · 1–15',8,5240000,2100000,'к проведению'],['АВР-15','O-2','август',14,16400000,3300000,'проведено'],['АВР-16','O-5','август · финальный',9,3100000,0,'проведено · объект закрыт']]
  .map(r=>`<tr><td class="mono" style="padding:8px"><b>${r[0]}</b></td><td style="padding:8px">${esc(OB(r[1]).n)}</td><td style="padding:8px">${r[2]}</td><td class="mono" style="text-align:right;padding:8px">${r[3]}</td><td class="mono" style="text-align:right;padding:8px">${seeMoney()||role==='Снабжение'?tg(r[4]):'·'}</td><td class="mono" style="text-align:right;padding:8px">${seeMoney()||role==='Снабжение'?tg(r[5]):'·'}</td><td style="padding:8px">${tag(r[6],r[6].indexOf('проведено')>=0?'var(--ok)':'var(--warn)')}</td></tr>`).join('')}</tbody></table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Почему по акту, а не по выдаче</h3><p class="mini" style="margin:0">Выдали 20 400 м, смонтировали 17 900, актировали 15 200. Списать нужно 15 200 — остальное лежит на объекте и учитывается как остаток. Так себестоимость объекта совпадает с тем, что предъявили заказчику.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Закрытие объекта</h3><p class="mini" style="margin:0">БЦ «Ертыс Плаза»: остаток на объекте 0 — всё либо списано по актам, либо возвращено на склад. Объект закрыт без «повисших» материалов.</p></div>
</div>`;

/* ====== ДЕНЬГИ ====== */
SC.finance=()=>{const o=OB(curObj);const cost=o.mat+o.fot+o.sub+o.small,m=margin(o);return `<div class="hd"><div><h2>Финансы объекта · ${esc(o.n)}</h2>
 <p>Ваши слова: «внутри объекта должна быть информация о финансах — все расходы, доходы; расходы не всегда через бухгалтера». Здесь доходы по актам и оплатам, расходы по четырём источникам, маржа сегодня и прогноз по смете.</p></div>
 <div class="btns">${objSel()}<button class="bt" onclick="toast('Отчёт по объекту в PDF: договор, акты, оплаты, расходы по статьям, маржа, прогноз — для директора.')">PDF</button></div></div>
<div class="wid" style="grid-template-columns:repeat(5,1fr)">
 <div><small>Договор</small><b class="a">${seeMoney()?mln(o.sum):'—'}</b><span>смета утверждена</span></div>
 <div><small>Актов подписано</small><b>${seeMoney()?mln(o.acts):'—'}</b><span>${pct(o.acts,o.sum)}% договора</span></div>
 <div><small>Оплачено</small><b class="g">${seeMoney()?mln(o.paid):'—'}</b><span>дебиторка ${seeMoney()?mln(o.acts-o.paid):'—'}</span></div>
 <div><small>Расходы</small><b>${seeMoney()?mln(cost):'—'}</b><span>${pct(cost,o.acts)}% от актов</span></div>
 <div><small>Маржа по актам</small><b class="${m>=0?'g':'r'}">${seeMoney()?mln(m):'—'}</b><span>${pct(m,o.acts)}%</span></div>
</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Расходы по источникам</h3>
  ${[['Материалы · списано по актам',o.mat,'со склада, по накладным и актам'],['ФОТ · из табеля',o.fot,'часы по геолокации × правила'],['Субподряд',o.sub,'договоры и акты субподрядчиков'],['Мелкие расходы · бот',o.small,'покупки бригадиров с чеками']].map(([n,v,d])=>`<div class="fr" style="grid-template-columns:200px 1fr 100px"><span style="font-size:11.3px">${n}<div class="mini">${d}</div></span>${barHtml(pct(v,cost),'var(--brand)')}<b class="mono" style="text-align:right">${seeMoney()?mln(v):'·'}</b></div>`).join('')}
  <div class="kv" style="border:0;margin-top:6px"><span><b>Итого расходов</b></span><b class="mono">${seeMoney()?mln(cost):'·'}</b></div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Прогноз до закрытия</h3>
   <div class="kv"><span>Выполнено по смете</span><b>${o.pct}%</b></div>
   <div class="kv"><span>Расходы на 100%, при текущем темпе</span><b class="mono">${seeMoney()?mln(cost/Math.max(1,o.pct)*100):'—'}</b></div>
   <div class="kv"><span>Маржа на закрытии</span><b class="mono" style="color:${(o.sum-cost/Math.max(1,o.pct)*100)>0?'var(--ok)':'var(--bad)'}">${seeMoney()?mln(o.sum-cost/Math.max(1,o.pct)*100)+' · '+pct(o.sum-cost/Math.max(1,o.pct)*100,o.sum)+'%':'—'}</b></div>
   <div class="kv" style="border:0"><span>Риск</span><b>${o.id==='O-1'?'кабель на объекте 2 500 м — если ушёл, маржа −0,4 млн':o.id==='O-2'?'отставание 6% — штраф по договору при срыве срока':'—'}</b></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Доходы</h3>
   ${ACTS.filter(a=>a.obj===o.id).map(a=>`<div class="kv"><span>${a.id} · ${esc(a.per)}</span><b class="mono">${seeMoney()?tg(a.sum):'·'} · <span style="color:${AST[a.st][1]}">${AST[a.st][0]}</span></b></div>`).join('')||'<p class="mini" style="margin:0">Актов ещё нет: аванс по договору получен, работы на стадии закупа.</p>'}
  </div>
 </div>
</div>
<div class="said"><b>Маржа сегодня, а не после закрытия.</b> ЖК «Алтын Орда» при 62% монтажа: расходы 36,7 млн против актов 39,1 — 6% по актам, но по смете на закрытии выходит около 17%, потому что ФОТ и материалы идут впереди актов. Директор видит обе цифры и понимает разницу — вместо «посчитаем в конце».</div>`};

SC.bot=()=>`<div class="hd"><div><h2>Расходы и отчёты через бот</h2>
 <p>Ваши слова: «бригадир купил в ближайшем магазине, отправил в WhatsApp — потерялось; хотелось бы бот, голосовое записал — автоматом переходит в приложение». Бот в Telegram и WhatsApp: голосовое или фото чека → распознано → расход на объект → подтверждение прораба.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Правила: без чека — только с подтверждением прораба и до 10 000 ₸; свыше 50 000 — подтверждает руководитель техотдела; всё ложится в объект и в отчёт бухгалтеру.')">Правила</button><button class="bt p" onclick="botRun()">Отправить в бот</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Расходов через бот · сентябрь</small><b class="a">${seeMoney()?tg(1280000):'47'}</b><span>47 покупок · 5 объектов</span></div>
 <div><small>С чеком</small><b class="g">41</b><span>6 без чека — по правилу</span></div>
 <div><small>Ждут подтверждения</small><b class="w">1</b><span>38 400 ₸ · Самат</span></div>
 <div><small>Отчётов голосом</small><b>2 в день</b><span>распознаны, объёмы записаны</span></div>
</div>
<div class="g21">
 <div class="pan" style="border-top:3px solid var(--violet)"><h3 style="margin:0 0 9px">Лента бота</h3>
  ${BOT.map(b=>`<div class="dl" style="--c:${b.st==='ok'?'var(--ok)':b.st==='no'?'var(--bad)':'var(--warn)'}"><b class="mono" style="width:80px;font-size:10.6px">${esc(b.t)}</b><div style="flex:1;min-width:0"><b>${esc(b.who)}</b> ${tag(b.kind==='voice'?'голосовое':'фото',b.kind==='voice'?'var(--violet)':'var(--acc)')}<div class="mini" style="font-style:italic">${esc(b.txt)}</div><div class="mini" style="color:var(--text)">→ ${esc(b.parsed)}</div></div>${b.st==='wait'?`<button class="bt p" onclick="toast('Подтверждено прорабом. Расход 38 400 ₸ лёг на ЖК «Алтын Орда», статья «мелкие материалы», чек прикреплён. Бухгалтер увидит в отчёте за день.')">Подтвердить</button>`:tag(b.st==='ok'?'принято':'отклонено',b.st==='ok'?'var(--ok)':'var(--bad)')}</div>`).join('')}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Что понимает бот</h3>
   <div class="li"><b style="color:var(--violet)">→</b><div><b style="font-size:11.6px">Расход</b><div class="mini">голосом или фото чека: сумма, что, где, объект. Ложится на объект после подтверждения прораба</div></div></div>
   <div class="li"><b style="color:var(--violet)">→</b><div><b style="font-size:11.6px">Отчёт за день</b><div class="mini">«тридцать два извещателя, шестьсот метров, людей восемь» — объёмы в план-факт и ведомость</div></div></div>
   <div class="li"><b style="color:var(--violet)">→</b><div><b style="font-size:11.6px">Заявка</b><div class="mini">«нужно две тысячи метров КПС к четвергу» — заявка З-… на сверку ПТО</div></div></div>
   <div class="li" style="border:0"><b style="color:var(--violet)">→</b><div><b style="font-size:11.6px">Простой</b><div class="mini">«стоим, заказчик не пускает в шкаф» — простой с причиной в журнал</div></div></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Почему бот, а не форма</h3><p class="mini" style="margin:0">Бригадир на объекте в перчатках и с телефоном в кармане. Голосовое в 20 секунд он отправит, форму из шести полей — нет. Распознавание переспросит, если чего-то не хватает: «какой объект?». Проверяет человек — прораб, одной кнопкой.</p></div>
 </div>
</div>`;

SC.cash=()=>{const live=OBJ.filter(o=>o.id!=='O-6');const contracts=live.reduce((a,o)=>a+o.sum,0),acts=live.reduce((a,o)=>a+o.acts,0),paid=live.reduce((a,o)=>a+o.paid,0),cost=live.reduce((a,o)=>a+o.mat+o.fot+o.sub+o.small,0);return `<div class="hd"><div><h2>Деньги компании · сентябрь</h2>
 <p>Все объекты: договоры, акты, оплаты, дебиторка, расходы, маржа. Плюс деньги на месяц вперёд: что придёт по актам, что уйдёт на зарплату и поставщиков. Не бухгалтерский учёт, а управленческий — то, что директор спрашивает у бухгалтера в конце месяца.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Выгрузка для бухгалтерии за период: акты, оплаты, списания, ФОТ по объектам — в Excel.')">Выгрузка бухгалтеру</button></div></div>
<div class="wid" style="grid-template-columns:repeat(5,1fr)">
 <div><small>Портфель</small><b class="a">${mln(contracts)}</b><span>5 объектов · + 2,5 млрд тендер</span></div>
 <div><small>Актов подписано</small><b>${mln(acts)}</b><span>${pct(acts,contracts)}% портфеля</span></div>
 <div><small>Оплачено</small><b class="g">${mln(paid)}</b><span>дебиторка ${mln(acts-paid)}</span></div>
 <div><small>Расходы</small><b>${mln(cost)}</b><span>по объектам</span></div>
 <div><small>Маржа по актам</small><b class="g">${mln(acts-cost+19200000)}</b><span>с учётом аванса ТМК</span></div>
</div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">По объектам</h3>
  <table class="t" style="font-size:11.2px"><thead><tr style="border-bottom:1.5px solid var(--line2)">${['ОБЪЕКТ','ДОГОВОР','АКТЫ','ОПЛАЧЕНО','ДЕБИТОРКА','РАСХОДЫ','МАРЖА'].map((h,i)=>`<th style="text-align:${i?'right':'left'};padding:6px 8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
  <tbody>${live.map(o=>{const c=o.mat+o.fot+o.sub+o.small,m=o.acts-c;return `<tr style="cursor:pointer" onclick="curObj='${o.id}';go('finance')"><td style="padding:6px 8px"><b>${esc(o.n)}</b></td><td class="mono" style="text-align:right;padding:6px 8px">${mln(o.sum)}</td><td class="mono" style="text-align:right;padding:6px 8px">${mln(o.acts)}</td><td class="mono" style="text-align:right;padding:6px 8px">${mln(o.paid)}</td><td class="mono" style="text-align:right;padding:6px 8px;color:${o.acts-o.paid>0?'var(--warn)':'inherit'}">${mln(o.acts-o.paid)}</td><td class="mono" style="text-align:right;padding:6px 8px">${mln(c)}</td><td class="mono" style="text-align:right;padding:6px 8px;font-weight:700;color:${m>=0?'var(--ok)':'var(--bad)'}">${o.acts?mln(m):'аванс'}</td></tr>`}).join('')}</tbody></table>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Деньги на месяц</h3>
   <div class="kv"><span>Придёт по подписанным актам</span><b class="mono" style="color:var(--ok)">+15,7 млн</b></div>
   <div class="kv"><span>Акты на подписи и к выставлению</span><b class="mono">+17,8 млн</b></div>
   <div class="kv"><span>Зарплата 5 октября</span><b class="mono" style="color:var(--bad)">−18,4 млн</b></div>
   <div class="kv"><span>Поставщики к оплате</span><b class="mono" style="color:var(--bad)">−6,7 млн</b></div>
   <div class="kv" style="border:0"><span><b>Итог при оплате актов в срок</b></span><b class="mono">+8,4 млн</b></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Где деньги застряли</h3><p class="mini" style="margin:0">БЦ «Ертыс Плаза»: 7,6 млн ждут исполнительную. Школа: 6,5 млн на подписи у отдела образования 6 дней. Это 14,1 млн, которые зависят от двух документов, а не от рынка.</p></div>
 </div>
</div>`};
/* ====== НАСТРОЙКИ ====== */
SC.roles=()=>`<div class="hd"><div><h2>Права доступа</h2>
 <p>Семь ролей. Бригадир — четыре кнопки на телефоне, прораб — свои объекты, ПТО и снабжение — без денег, бухгалтер — без смет. Цены закупа, маржа и зарплаты — директору, руководителю техотдела и бухгалтеру.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Новая роль — кнопкой: например «Начальник участка» с несколькими объектами, или «Кладовщик» только со складом.')">+ Роль</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)"><th style="text-align:left;padding:8px;font-size:10px;color:var(--muted)">ЧТО ВИДНО · ДЕЛАЕТ</th>${Object.keys(ROLES).map(r=>`<th style="text-align:center;padding:8px;font-size:9px;color:var(--muted)">${esc(r.toUpperCase())}</th>`).join('')}</tr></thead>
 <tbody>${[['Все объекты · сводка',[1,1,1,0,0,1,1]],['Свои объекты · план · задания',[1,1,1,1,0,0,0]],['Отметиться · отчёт · заявка · бот',[1,1,0,1,1,0,0]],['Сметы · расчёт · факт',[1,1,1,0,0,0,0]],['Смета — количества без цен',[1,1,1,0,0,1,0]],['ПТО: объёмы, исполнительная, акты',[1,1,1,0,0,0,0]],['Заявки · склад · закуп',[1,1,1,1,1,1,0]],['Цены закупа и поставщики',[1,1,0,0,0,1,0]],['Присутствие · табель',[1,1,0,1,0,0,1]],['Зарплата всех',[1,1,0,0,0,0,1]],['Своя зарплата',[1,1,1,1,1,1,1]],['Финансы объекта · маржа',[1,1,0,0,0,0,1]],['Деньги компании',[1,0,0,0,0,0,1]],['Права · интеграции · правила',[1,1,0,0,0,0,0]]]
  .map(([n,a])=>`<tr><td style="padding:7px 8px">${esc(n)}</td>${a.map(v=>`<td style="text-align:center;padding:7px 8px;color:${v?'var(--ok)':'var(--line2)'};font-weight:800">${v?'✓':'—'}</td>`).join('')}</tr>`).join('')}</tbody>
</table></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Вход</h3><p class="mini" style="margin:0">Рабочие — по номеру телефона с кодом в WhatsApp, без паролей. Офис — логин и двухфакторный вход для директора и бухгалтера.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Люди меняются</h3><p class="mini" style="margin:0">Уволенному доступ закрывается кнопкой, его отчёты и отметки остаются в объекте. Новый бригадир получает те же четыре кнопки.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Инерция — ваши слова</h3><p class="mini" style="margin:0">Линейным сотрудникам не нужно учить систему: отметка, отчёт, заявка, бот. Всё сложное — у ПТО и руководителей, которые и так это делают, только в таблицах.</p></div>
</div>`;

SC.integr=()=>`<div class="hd"><div><h2>Интеграции</h2>
 <p>Что подключается в ядре и что отдельно. Как обсуждали: WhatsApp и телефония — да, 1С — нет, склад ведём здесь.</p></div></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 7px">WhatsApp</h3><span class="tag" style="background:var(--ok-l);color:var(--ok)">ядро</span><p class="mini" style="margin:7px 0 0">Вход по коду, уведомления прорабам и бригадирам, переписка с заказчиками и поставщиками из карточки объекта. Через казахстанского провайдера ≈ 5 000 ₸ за номер в месяц.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Бот · Telegram и WhatsApp</h3><span class="tag" style="background:var(--ok-l);color:var(--ok)">ядро</span><p class="mini" style="margin:7px 0 0">Голосовые и фото чеков → расходы, отчёты, заявки, простои. Распознавание речи и чеков — через ИИ, оплата по факту ≈ 10–20 000 ₸ в месяц.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">IP-телефония</h3><span class="tag" style="background:var(--ok-l);color:var(--ok)">ядро</span><p class="mini" style="margin:7px 0 0">Звонки из карточки заказчика и поставщика с записью. ≈ 30 000 ₸ в месяц провайдеру.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Геолокация · терминал</h3><span class="tag" style="background:var(--ok-l);color:var(--ok)">ядро</span><p class="mini" style="margin:7px 0 0">Отметка с телефона на объекте — в ядре. Терминал Face ID или отпечатка в офисе — подключаем к тому же табелю; сам терминал покупаете вы, ≈ 150–300 000 ₸.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">1С</h3><span class="tag">не нужна</span><p class="mini" style="margin:7px 0 0">Как договорились: склад стабильнее вести в системе, чем синхронизировать. Бухгалтеру — выгрузки за период. Если понадобится позже — интеграция 800 000 ₸ отдельно.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Прикладные программы</h3><span class="tag" style="background:var(--violet-l);color:var(--violet)">отдельно</span><p class="mini" style="margin:7px 0 0">Расчёты по чертежам и другая автоматизация сверх ядра — оцениваются отдельно после изучения исходников. В стандартный заказ не входят.</p></div>
</div>
<div class="said"><b>Сервер и данные.</b> Виртуальный сервер ≈ 10–15 000 ₸ в месяц, ежедневные копии с хранением 30 дней. Код и база ваши, ключи передаём при сдаче. После этого у нас нет доступа без вашего разрешения.</div>`;

SC.stack=()=>`<div class="hd"><div><h2>Состав ядра и этапы</h2>
 <p>Что входит в стандартный заказ, в какие сроки, за какие деньги. После вашего прохода по демо этот список становится приложением № 1 к договору; ваши текущие таблицы — первичкой, от которой мы отталкиваемся.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Состав выгружен в PDF вместе с КП.')">Выгрузить</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Стандартный заказ</small><b class="a">3 000 000 ₸</b><span>без 1С и прикладных программ</span></div>
 <div><small>Срок</small><b>4–6 недель</b><span>при правках в течение суток</span></div>
 <div><small>Оплата</small><b>10 / 45 / 45</b><span>300 000 ₸ при старте</span></div>
 <div><small>Абонплата</small><b class="g">нет</b><span>код и сервер ваши</span></div>
</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Входит</h3>
  ${['Объекты: паспорт, стадии с правилами, план по системам, сроки','Сметы: расчёт из спецификации по прайсу, версии, чтение в заявках, складе, объёмах, актах','Смета против факта: выдано — смонтировано — остаток, сигналы','План работ и нормы выработки: сколько должен сделать прораб, мастер, монтажник','Задания на монтаж и отчёты с площадки с телефона и голосом','ПТО: объёмы, ведомости, исполнительная документация с датами «поздно», акты выполненных работ','Присутствие по геолокации, терминал в офисе, табель автоматически, зарплата по правилам','Заявки со сверкой по смете, склад и остатки на объектах, закуп со статусами, списание по актам','Финансы объекта: доходы, четыре источника расходов, маржа и прогноз; деньги компании','Бот: расходы, отчёты, заявки, простои голосом и фото','WhatsApp, IP-телефония, 7 ролей, права, вход по коду','Перенос ваших таблиц, сервер, копии, обучение, месяц сопровождения']
   .map(t=>`<div style="display:flex;gap:8px;align-items:flex-start;padding:4px 0"><b style="color:var(--ok)">✓</b><span style="font-size:11.4px">${esc(t)}</span></div>`).join('')}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 9px">Как идёт работа</h3>
   <div class="tl">
    <div class="tli"><b style="font-size:11.6px">Демо · с вами, затем с директором</b><p class="mini" style="margin:2px 0 0">Проход по экранам, правки, утверждение состава ядра.</p></div>
    <div class="tli"><b style="font-size:11.6px">10 дней · первичка</b><p class="mini" style="margin:2px 0 0">Предоплата 10 %. Ваши таблицы: сметы, прайс, объекты, люди, склад. Мы оцифровываем привычное.</p></div>
    <div class="tli"><b style="font-size:11.6px">Недели 2–3 · ядро</b><p class="mini" style="margin:2px 0 0">Объекты, сметы, заявки, склад, присутствие, табель, отчёты с площадки. На вашем сервере, можно вносить данные. Платёж 45 %.</p></div>
    <div class="tli"><b style="font-size:11.6px">Недели 3–5 · 3–5 выпусков</b><p class="mini" style="margin:2px 0 0">Ваши правки: «это сюда, это не так». ПТО, исполнительная, акты, финансы, бот, нормы.</p></div>
    <div class="tli"><b style="font-size:11.6px">Неделя 6 · полировка и передача</b><p class="mini" style="margin:2px 0 0">Линейные сотрудники в системе, их замечания. Код, сервер, обучение, платёж 45 %.</p></div>
   </div>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Отдельно</h3>
   <div class="kv"><span>Интеграция с 1С</span><b class="mono">800 000 ₸ · не нужна</b></div>
   <div class="kv"><span>Прикладные программы</span><b class="mono">по исходникам</b></div>
   <div class="kv" style="border:0"><span>Доработки после сдачи</span><b class="mono">20 $ / час</b></div>
  </div>
 </div>
</div>
<div class="said"><b>Ваши слова:</b> «У нас куча процессов, до конца сами не понимаем, чего хотим». Поэтому здесь наше видение того, как устроена такая компания, — а не пустая CRM. Вы говорите, что из этого ваше, что нет; ваши таблицы добавляют то, чего мы не знаем. Так получается система под Мегатекс, а не под «подрядчика вообще».</div>`;

/* ====== ДЕЙСТВИЯ ====== */
function dailyAdd(){openM('Отчёт за день · Самат Т. · ЖК «Алтын Орда»','Четыре вопроса · две минуты · или голосовым в бот',
 `<div class="srow"><div style="flex:1"><b>Извещатели · 7 этаж, секции А–Б</b><div class="mini">задание 96 · вчера 64</div></div><input value="32" style="width:70px;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card);text-align:right;font-weight:700"><span class="mini">шт</span></div>
  <div class="srow"><div style="flex:1"><b>Кабель КПС</b><div class="mini">задание 2 400 · вчера 1 650</div></div><input value="620" style="width:70px;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card);text-align:right;font-weight:700"><span class="mini">м</span></div>
  <div class="srow"><div style="flex:1"><b>Людей на объекте</b><div class="mini">по геолокации 8</div></div><input value="8" style="width:70px;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card);text-align:right;font-weight:700"><span class="mini">чел</span></div>
  <div class="srow"><div style="flex:1"><b>Простой</b></div><select class="rsel"><option>не было</option><option>нет материала</option><option>нет фронта работ</option><option>заказчик</option><option>погода</option></select></div>
  <div class="srow"><div style="flex:1"><b>Скрытые работы закрывают?</b><div class="mini">потолки, стяжка, фальшстены</div></div><select class="rsel"><option>нет</option><option>да — дата</option></select></div>
  <div style="border:1px dashed var(--line2);border-radius:6px;padding:10px;text-align:center;color:var(--muted);font-size:11px;margin-top:8px">+ фото этажа</div>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Отчёт принят: 32 извещателя, 620 м — в план-факт задания и в ведомость. Задание 7 этаж: 96 из 96, закрыто. Прорабу и ПТО — в сводку.')">Отправить</button>`)}
function calcRun(){openM('Смета из спецификации','Областная больница · корпус А · АПС и СОУЭ',
 `<div style="border:2px dashed var(--line2);border-radius:8px;padding:20px;text-align:center;color:var(--muted);font-size:11.6px">Перетащите спецификацию · Excel или таблица из рабочего проекта<br><span class="mini">колонки: наименование, ед., количество — остальное подставится</span></div>
  <div class="num" style="margin-top:12px"><i>1</i><div><b>Сопоставление с прайсом</b><p>по наименованиям и характеристикам · что не нашлось — список ПТО</p></div></div>
  <div class="num"><i>2</i><div><b>Работы по нормам</b><p>к каждому материалу — свои виды работ и расценки</p></div></div>
  <div class="num"><i>3</i><div><b>Итог по системам · на утверждение</b><p>материалы, работы, ПНР, исполнительная · наценка ваша</p></div></div>
  <button class="bt p" style="width:100%;margin-top:6px" onclick="closeM();toast('Спецификация загружена: 52 строки, 46 сопоставлены, 4 проверить, 2 нет в прайсе. Черновик сметы корпуса А: 184 млн ₸. К утверждению после проверки ПТО.')">Посчитать</button>`)}
function hiddenAct(){openM('Акт скрытых работ · ЖК «Алтын Орда» · 6 этаж','Из отчёта Каната Р. от 14.09 · потолки закрывают 22.09',
 `<div class="kv"><span>Работы</span><b>прокладка кабеля КПСнг(А)-FRLS в потолочном пространстве</b></div>
  <div class="kv"><span>Объём</span><b class="mono">1 900 м · по отчётам 14–16.09</b></div>
  <div class="kv"><span>Материал · сертификат</span><b>из карточки заказа ЗП-114 · прикреплён</b></div>
  <div class="kv"><span>Фото</span><b>4 · из отчётов</b></div>
  <div class="kv" style="border:0"><span>Подписывают</span><b>прораб Ерлан Б. · представитель заказчика · ПТО Асель</b></div>
  <div class="note" style="--tone:var(--bad)"><p class="mini" style="margin:0">Срок — до 21.09. Закроют потолок без акта — объём могут не принять, вскрытие за ваш счёт. Система подняла за два дня.</p></div>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Акт сформирован по вашему шаблону, отправлен прорабу и заказчику на подпись. Пока не подписан — висит в «горит» у ПТО и руководителя.')">Сформировать и отправить</button>`)}
function actRun(){openM('Акт выполненных работ из объёмов','ЖК «Алтын Орда» · 16–20.09',
 `<p style="font-size:11.6px;line-height:1.7">Выполнено по ведомости минус уже актировано — за период. Цены — из утверждённой сметы.</p>
  ${[['Монтаж извещателей и оповещателей','шт',132,2800],['Прокладка кабеля','м',3100,210],['Монтаж лотка','м',140,3600],['Монтаж кабель-канала','м',410,650],['Подключение и адресация','шт',96,1400]].map(([n,u,q,p])=>`<div class="kv"><span>${n} · ${fmt(q)} ${u}</span><b class="mono">${fmt(q*p)}</b></div>`).join('')}
  <div class="kv" style="border:0"><span><b>Итого</b></span><b class="mono" style="font-size:13px">${fmt(132*2800+3100*210+140*3600+410*650+96*1400)} ₸</b></div>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Акт АВР-20 сформирован по вашей форме, отправлен на проверку ПТО и утверждение. После подписи заказчиком — в дебиторку и списание материалов.')">Сформировать</button>`)}
function markRun(){toast('Отметка принята: 07:58, ЖК «Алтын Орда», радиус 80 м, устройство подтверждено. Прораб видит вас на объекте; день попал в табель.')}
function reqRun(){openM('Заявка на материалы · с телефона','Самат Т. · ЖК «Алтын Орда»',
 `<div class="srow"><div style="flex:1"><b>Позиция</b></div><select class="rsel"><option>Кабель КПСнг(А)-FRLS 1×2×0,5</option><option>Извещатель ИП 212-64</option><option>Лоток 100×50</option></select></div>
  <div class="srow"><div style="flex:1"><b>Количество</b></div><input value="2 000" style="width:90px;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card);text-align:right;font-weight:700"><span class="mini">м</span></div>
  <div class="srow"><div style="flex:1"><b>К какому дню</b></div><input value="25.09" style="width:90px;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card);text-align:right"></div>
  <div class="note" style="--tone:var(--ok)"><p class="mini" style="margin:0">Сверка со сметой сразу: по кабелю остаток 5 600 м — в лимите. На складе 4 200 м: 2 000 выдадут завтра, снабжение получит остаток к минимуму.</p></div>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Заявка З-237 создана, сверена со сметой, передана снабжению. Статус увидите в телефоне: сверка → выдано.')">Отправить</button>`)}
function botRun(){openM('Бот · Самат Т.','Telegram · голосовое 14 секунд',
 `<div class="msg" style="background:var(--card2);margin-bottom:6px">🎤 «Купил в Электромире двенадцать автоматов на шестнадцать ампер, тридцать восемь четыреста, Алтын Орда, седьмой этаж» · 📎 фото чека</div>
  <div class="msg" style="background:var(--brandl);margin:0 0 6px auto">Понял: расход <b>38 400 ₸</b>, автоматы 16А × 12, магазин «Электромир», объект ЖК «Алтын Орда», 7 этаж. Чек прикреплён. Отправляю прорабу Ерлану на подтверждение.</div>
  <div class="msg" style="background:var(--brandl);margin:0 0 6px auto">Ерлан подтвердил · 14:20. Расход лёг на объект, статья «мелкие материалы».</div>
  <p class="mini" style="margin:8px 0 0">Если чего-то не хватает — бот переспросит: «какой объект?», «есть чек?». Отчёт за день и заявка — тем же голосовым.</p>
  <button class="bt" style="width:100%;margin-top:11px" onclick="closeM()">Закрыть</button>`)}
function searchDemo(v){if(!v)return;toast(`Поиск «${esc(v)}»: по объектам, сметам, заявкам, сотрудникам, актам, поставщикам — в пределах прав роли.`)}

/* ====== ИНФРАСТРУКТУРА ====== */
function renderRoles(){const r=document.getElementById('roles');if(!r)return;
 r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Директор';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');
 const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();
 toast(`Вы вошли как «${role}» · ${ROLES[role].n}. Показаны только разделы этой роли — так же будет у ваших сотрудников.`);}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${role}. Разделов доступно: ${ROLES[role].s.length}. ${ROLES[role].note}.`)}
const ownerOf=k=>SECOF[k];
function buildRail(){const on=ownerOf(cur);document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>{const n=s.sub.filter(x=>allowed(x[0])).length;return `<div class="ri ${s.k===on?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')" title="${esc(s.n)}"><i>${s.ic}</i><span>${esc(s.n)}</span>${n>1?`<b class="cnt">${n}</b>`:''}</div>`}).join('');}
function buildSub(){const on=ownerOf(cur),s=SEC.find(x=>x.k===on);if(!s)return;document.getElementById('sub').innerHTML=`<h4>${esc(s.n)}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')+`<div class="shint"><b>${esc(role)}</b><br>${esc(ROLES[role].note)}</div>`;}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Сводка';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;const a=document.getElementById('addBtn');if(a)a.style.display=allowed('requests')?'':'none';try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль в правом верхнем углу.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}

/* ====== СЦЕНАРИЙ ПОКАЗА ====== */
const TOUR=[
 ['dash','Все объекты одним экраном: стадия, план-факт, люди на площадке, деньги, что горит. Вместо пяти таблиц.'],
 ['today','Что требует решения: акт скрытых работ до закрытия потолков, заявка сверх сметы, сдача. Система собирает это сама.'],
 ['object','Паспорт объекта: договор, стадии с правилами, план по системам, люди, склад, документы, деньги — внутри объекта.'],
 ['calc','Смета из спецификации по вашему прайсу: час вместо двух дней. Больница на 2,5 млрд начнётся с этого экрана.'],
 ['estimate','Смета читается в проекте: по каждой позиции — по смете, выдано со склада, смонтировано. Три числа, которых в таблице нет.'],
 ['factvs','Смета против факта: кабель 2 500 м «выдано, но не смонтировано». Видно сейчас, а не при закрытии объекта.'],
 ['plan','План и нормы: сколько должен сделать монтажник, мастер, прораб — и когда закончим при такой бригаде.'],
 ['daily','Отчёты с площадки: бригадир вечером — три цифры и фото, с телефона или голосом. Из них план-факт, ведомость, журнал.'],
 ['pto','Пульт ПТО: заявки на сверку, объёмы, исполнительная, акты. Что ПТО больше не делает руками.'],
 ['docs','Исполнительная с датой «поздно»: акт скрытых работ 6 этажа — до 21.09, иначе вскрывать потолок за свой счёт.'],
 ['acts','Акты выполненных работ из объёмов: что можно выставить сегодня, что застряло на подписи.'],
 ['attendance','Присутствие по геолокации с телефона, в офисе терминал. Ваши слова: «чтобы рабочий персонал отмечался».'],
 ['timesheet','Табель считается сам: дни, часы, переработка, объект. Бухгалтер ничего не собирает.'],
 ['pay','Зарплата по правилам: оклад, сдельно из отчётов, почасовая. Каждый видит свою строку.'],
 ['requests','Заявки с телефона со сверкой по смете: «сверх сметы» — стоп и вопрос прорабу. Статусы до выдачи.'],
 ['stock','Склад здесь, без 1С: центральный склад, остатки на объектах, минимумы.'],
 ['finance','Финансы объекта: доходы, четыре источника расходов, маржа сегодня и прогноз на закрытии.'],
 ['bot','Бот: бригадир купил в магазине — голосовое и фото чека → расход на объект. Ничего не теряется в WhatsApp.'],
 ['stack','Состав ядра: 3 000 000 ₸, 4–6 недель, 10 / 45 / 45, код и сервер ваши.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий показа закончен. Всё кликается: смета, заявки, отчёты, акты, бот.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?5800:6900);}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
