/* ПОДИУМ — система бутиков обуви и аксессуаров (Гаухар, Алматы): каждая модель приходит один раз за сезон.
   Демо-макет на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(Math.round(n/100000)/10).toString().replace('.',',')+' млн';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};
const dd=s=>{const [y,m,d]=s.split('-');return d+'.'+m};
const TODAY='2026-11-02',NOW='12:30';
const addDays=(s,n)=>new Date(new Date(s+'T00:00:00').getTime()+n*864e5).toISOString().slice(0,10);
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const bar=(w,c)=>`<div class="bar"><i class="${c||''}" style="--w:${Math.max(2,Math.min(100,w))}%"></i></div>`;

const SEC=[
 {k:'day',n:'Сегодня',sub:[['today','Пульт собственника'],['shops','Бутики сегодня']]},
 {k:'sale',n:'Продажи',sub:[['pos','Касса'],['returns','Возвраты и обмены'],['promo','Скидки и акции'],['orders','Kaspi и Instagram']]},
 {k:'goods',n:'Товар',sub:[['income','Приход коллекции'],['catalog','Модели и размеры'],['labels','Штрихкоды и этикетки'],['stock','Остатки по бутикам'],['moves','Перемещения'],['inv','Инвентаризация']]},
 {k:'cli',n:'Покупатели',sub:[['clients','База покупателей'],['bonus','Бонусы и рассылки']]},
 {k:'team',n:'Команда',sub:[['staff','Продавцы и план'],['tasks','Задачи вместо WhatsApp']]},
 {k:'money',n:'Деньги',sub:[['season','Сезон: что продалось'],['reports','Отчёты'],['buh','Выгрузка бухгалтеру']]},
 {k:'sys',n:'Система',sub:[['move1c','Переезд с 1С'],['roles','Роли и права'],['launch','Запуск и стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Собственник':{av:'ГА',n:'Гаухар',note:'Все бутики, продажи, сезон, деньги, команда',s:ALL.slice()},
 'Управляющая':{av:'АЙ',n:'Айгерим',note:'Бутики, товар, перемещения, продавцы, задачи',s:['today','shops','returns','promo','income','catalog','stock','moves','inv','clients','staff','tasks','season','reports']},
 'Продавец':{av:'ДН',n:'Дана · бутик Достык',note:'Касса, возвраты, остатки, покупатели, свои задачи',s:['pos','returns','stock','clients','tasks']},
 'Кладовщик':{av:'ЕР',n:'Ерлан · склад',note:'Приход, этикетки, перемещения, инвентаризация',s:['income','catalog','labels','stock','moves','inv','tasks']},
 'Онлайн-менеджер':{av:'КМ',n:'Камила',note:'Kaspi и Instagram, покупатели, рассылки',s:['orders','clients','bonus','stock','tasks']},
 'Бухгалтер':{av:'СВ',n:'Светлана',note:'Продажи, возвраты, выгрузка для 1С и налоговой',s:['reports','buh','returns']}
};
let role='Собственник',cur='today';

/* ===== Бутики ===== */
const SHOPS=[
 {id:'B1',n:'Достык',addr:'Mega Alma-Ata, 1 этаж',plan:5200000,c:'#8c2f39'},
 {id:'B2',n:'Есентай',addr:'Esentai Mall, 2 этаж',plan:6800000,c:'#b08d57'},
 {id:'B3',n:'Абай',addr:'пр. Абая, 44',plan:3600000,c:'#3d5a6c'},
 {id:'SK',n:'Склад',addr:'ул. Толе би, 286',plan:0,c:'#6b6560'}
];
const SH=id=>SHOPS.find(s=>s.id===id)||SHOPS[0];
const SALES={B1:[1240000,23,34],B2:[1980000,19,41],B3:[610000,11,18]}; // сегодня: выручка, чеков, посетителей по счётчику

/* ===== Модели ===== каждая модель приходит один раз: код модели + цвет + размеры */
const SIZES=['36','37','38','39','40','41'];
let MODELS=[
 {id:'AW26-0412',n:'Ботфорты замшевые',brand:'Casadei',cat:'Обувь',col:'чёрный',price:189000,cost:82000,in:'2026-09-05',sz:{B1:[0,1,2,1,0,0],B2:[1,2,1,1,0,0],B3:[0,0,1,0,0,0]},sold:14,got:24},
 {id:'AW26-0418',n:'Челси кожаные',brand:'Santoni',cat:'Обувь',col:'коньяк',price:142000,cost:61000,in:'2026-09-05',sz:{B1:[0,0,1,1,1,0],B2:[0,1,2,2,1,1],B3:[0,1,1,0,0,0]},sold:9,got:22},
 {id:'AW26-0533',n:'Лоферы на платформе',brand:'Pollini',cat:'Обувь',col:'бордо',price:118000,cost:48000,in:'2026-09-20',sz:{B1:[1,1,1,0,0,0],B2:[0,0,1,1,0,0],B3:[0,0,0,0,0,0]},sold:17,got:22},
 {id:'AW26-0541',n:'Сапоги казаки',brand:'Le Silla',cat:'Обувь',col:'бежевый',price:226000,cost:98000,in:'2026-09-20',sz:{B1:[0,1,1,1,0,0],B2:[1,1,1,1,1,0],B3:[0,1,1,1,0,0]},sold:3,got:18},
 {id:'AW26-0602',n:'Ботильоны на каблуке',brand:'Casadei',cat:'Обувь',col:'графит',price:164000,cost:71000,in:'2026-10-02',sz:{B1:[1,1,2,1,1,0],B2:[1,2,2,2,1,0],B3:[0,1,1,1,0,0]},sold:4,got:22},
 {id:'AW26-0717',n:'Берет шерстяной',brand:'Maison Michel',cat:'Головные уборы',col:'молочный',price:48000,cost:17000,in:'2026-10-14',sz:{B1:[3,0,0,0,0,0],B2:[4,0,0,0,0,0],B3:[2,0,0,0,0,0]},sold:11,got:20},
 {id:'AW26-0721',n:'Шапка кашемир',brand:'Loro Piana',cat:'Головные уборы',col:'серый',price:96000,cost:41000,in:'2026-10-14',sz:{B1:[2,0,0,0,0,0],B2:[3,0,0,0,0,0],B3:[1,0,0,0,0,0]},sold:6,got:12},
 {id:'AW26-0805',n:'Сумка-тоут кожаная',brand:'Furla',cat:'Аксессуары',col:'чёрный',price:212000,cost:93000,in:'2026-10-20',sz:{B1:[1,0,0,0,0,0],B2:[2,0,0,0,0,0],B3:[1,0,0,0,0,0]},sold:2,got:6},
 {id:'SS26-0214',n:'Сандалии плетёные',brand:'Pollini',cat:'Обувь',col:'песочный',price:98000,cost:44000,in:'2026-04-10',sz:{B1:[0,1,1,0,0,0],B2:[0,0,1,1,0,0],B3:[1,1,0,0,0,0]},sold:16,got:24,old:true},
 {id:'SS26-0230',n:'Мюли текстиль',brand:'Le Silla',cat:'Обувь',col:'пудра',price:86000,cost:37000,in:'2026-04-10',sz:{B1:[1,1,0,0,0,0],B2:[0,1,1,0,0,0],B3:[0,0,1,1,0,0]},sold:12,got:20,old:true}
];
const MO=id=>MODELS.find(m=>m.id===id)||MODELS[0];
const left=(m,s)=>s?m.sz[s].reduce((a,x)=>a+x,0):Object.values(m.sz).reduce((a,r)=>a+r.reduce((x,y)=>x+y,0),0);
let curM='AW26-0412';

/* ===== Приход ===== */
let INCOME=[
 {id:'ПР-0094',sup:'Casadei S.p.A.',d:'2026-11-02',models:46,pairs:212,sum:14820000,st:'new',file:'Casadei_AW26_drop3.xlsx'},
 {id:'ПР-0093',sup:'Maison Michel',d:'2026-10-14',models:18,pairs:64,sum:2240000,st:'done'},
 {id:'ПР-0092',sup:'Furla',d:'2026-10-20',models:9,pairs:22,sum:1980000,st:'done'}
];

/* ===== Покупатели ===== */
let CLIENTS=[
 {n:'Алия Сейткали',ph:'+7 701 555 12 40',seg:'VIP',sum:3420000,cnt:21,last:'2026-10-28',size:'38',bon:68400,shop:'B2'},
 {n:'Мадина Ахметова',ph:'+7 777 230 44 19',seg:'VIP',sum:2180000,cnt:14,last:'2026-10-30',size:'37',bon:43600,shop:'B1'},
 {n:'Жанна Ким',ph:'+7 705 118 72 04',seg:'Постоянная',sum:860000,cnt:7,last:'2026-09-12',size:'39',bon:17200,shop:'B1',risk:true},
 {n:'Сауле Нурланова',ph:'+7 702 455 61 20',seg:'Постоянная',sum:640000,cnt:5,last:'2026-10-21',size:'38',bon:12800,shop:'B3'},
 {n:'Динара Оспанова',ph:'+7 708 320 15 77',seg:'Новая',sum:189000,cnt:1,last:'2026-11-01',size:'37',bon:3780,shop:'B2'},
 {n:'Айгуль Тлеубаева',ph:'+7 747 901 33 81',seg:'Постоянная',sum:1120000,cnt:9,last:'2026-08-30',size:'40',bon:22400,shop:'B2',risk:true},
 {n:'Камила Абилова',ph:'+7 776 515 90 03',seg:'Новая',sum:118000,cnt:1,last:'2026-10-25',size:'36',bon:2360,shop:'B1'}
];

/* ===== Заказы онлайн ===== */
const OST=[['new','Новый'],['ok','Подтверждён'],['pack','Упакован'],['sent','Отправлен'],['done','Доставлен']];
let ORDERS=[
 {id:'K-614502',ch:'Kaspi',who:'Асель М.',m:'AW26-0533',size:'37',sum:118000,st:'new',shop:'B1'},
 {id:'K-614498',ch:'Kaspi',who:'Гульнара Т.',m:'AW26-0717',size:'—',sum:48000,st:'ok',shop:'B2'},
 {id:'IG-0331',ch:'Instagram',who:'@aidana.style',m:'AW26-0602',size:'38',sum:164000,st:'new',shop:'B2'},
 {id:'IG-0329',ch:'Instagram',who:'@zhanel_k',m:'AW26-0412',size:'37',sum:189000,st:'pack',shop:'B1'},
 {id:'K-614471',ch:'Kaspi',who:'Ерке Б.',m:'AW26-0721',size:'—',sum:96000,st:'sent',shop:'B3'},
 {id:'IG-0322',ch:'Instagram',who:'@madina.a',m:'AW26-0418',size:'39',sum:142000,st:'done',shop:'B2'}
];

/* ===== Команда ===== */
let STAFF=[
 {n:'Дана',shop:'B1',plan:5200000,fact:4380000,chk:96,avg:45600},{n:'Асель',shop:'B1',plan:5200000,fact:3910000,chk:88,avg:44400},
 {n:'Мария',shop:'B2',plan:6800000,fact:6120000,chk:104,avg:58800},{n:'Жанель',shop:'B2',plan:6800000,fact:5240000,chk:97,avg:54000},
 {n:'Аружан',shop:'B3',plan:3600000,fact:2310000,chk:61,avg:37900}
];
let TASKS=[
 {t:'Переоценка SS26 — повесить ценники −40%',who:'Дана',shop:'B1',due:'02.11',st:'go'},
 {t:'Принять приход Casadei, 212 пар',who:'Ерлан',shop:'SK',due:'03.11',st:'go'},
 {t:'Переместить казаки 38–39 в Есентай',who:'Ерлан',shop:'SK',due:'02.11',st:'done'},
 {t:'Обзвонить VIP: новая коллекция Casadei',who:'Камила',shop:'—',due:'04.11',st:'go'},
 {t:'Витрина: ботильоны графит вперёд',who:'Аружан',shop:'B3',due:'02.11',st:'check'}
];
