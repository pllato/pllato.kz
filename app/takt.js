/* ТАКТ — система сети танцевальных центров: 12 филиалов, абонементы, посещения, оплаты Kaspi, тренеры, воронка. Демо-макет по встрече 23.09.2026. Все названия, филиалы, фамилии и суммы вымышленные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const num=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const tg=n=>fmt(n)+' ₸';
const mln=n=>(n<0?'−':'')+(Math.round(Math.abs(n)/100000)/10).toString().replace('.',',')+' млн';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};
const sgn=n=>(n<0?'−':'')+fmt(Math.abs(n));
const dd=s=>{const [y,m,d]=s.split('-');return d+'.'+m};
const dl=s=>{const [y,m,d]=s.split('-');return d+'.'+m+'.'+y};
const TODAY='2026-09-24';
const dayOf=s=>['вс','пн','вт','ср','чт','пт','сб'][new Date(s+'T00:00:00').getDay()];
const addDays=(s,n)=>new Date(new Date(s+'T00:00:00').getTime()+n*864e5).toISOString().slice(0,10);

const SEC=[
 {k:'dash', ic:'▦', n:'Сеть',      sub:[['dash','12 филиалов на одном экране'],['today','Сегодня · что требует действия']]},
 {k:'st',   ic:'☺', n:'Ученики',   sub:[['students','Ученики и абонементы'],['student','Карточка ученика'],['subs','Абонементы · правила'],['attendance','Посещения · журнал занятий'],['transfer','Перевод между филиалами']]},
 {k:'fin',  ic:'₸', n:'Деньги',    sub:[['payments','Оплаты · Kaspi, банк, карта'],['recon','Сверка: ходят ↔ оплачено'],['debts','Должники и рассрочки'],['branchfin','Деньги по филиалам']]},
 {k:'tr',   ic:'★', n:'Тренеры',   sub:[['trainers','Тренеры сети'],['trainer','Карточка тренера'],['payroll','Оплата тренеров по факту'],['control','Контроль: не вышел, замена, расхождения']]},
 {k:'sch',  ic:'▤', n:'Расписание',sub:[['schedule','Расписание залов и групп'],['groups','Группы и направления']]},
 {k:'sale', ic:'◎', n:'Продажи',   sub:[['funnel','Воронка: заявка → пробное → абонемент'],['inbox','Входящие: WhatsApp, Instagram, 2ГИС'],['bots','Боты по этапам и оплатам'],['trial','Пробные занятия']]},
 {k:'br',   ic:'⌂', n:'Филиалы',   sub:[['branches','Филиалы и бренды'],['roles','Роли и права'],['parent','Кабинет родителя']]},
 {k:'rep',  ic:'▥', n:'Отчёты',    sub:[['analytics','Аналитика сети'],['churn','Продления и отток']]},
 {k:'pl',   ic:'⚙', n:'Система',   sub:[['integr','Kaspi, WhatsApp, Instagram, 2ГИС'],['migrate','Переход с Умай и MyClass'],['phone','Телефон тренера и администратора']]}
];
const SECOF={},SUBN={};
SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));

const ROLES={
 'Руководитель федерации':{av:'РФ',n:'руководитель',r:'все 12 филиалов',note:'Вся сеть одним экраном: сверка «ходят ↔ оплачено», деньги по филиалам, тренеры, воронка. Всё кликается вглубь до ученика и занятия',s:ALL},
 'Управляющий филиалом':{av:'УФ',n:'Асель · Алматы, Розыбакиева',r:'свой филиал',note:'Ученики, абонементы, посещения, оплаты и должники своего филиала, тренеры и их часы, переводы, расписание, воронка филиала',
  s:['today','students','student','subs','attendance','transfer','payments','recon','debts','trainers','trainer','payroll','control','schedule','groups','funnel','inbox','trial','phone']},
 'Администратор':{av:'АД',n:'Дана · ресепшен',r:'филиал · смена',note:'Отметка посещений, продления, приём оплат и разнесение, звонки и WhatsApp, пробные, задачи на сегодня. Зарплату тренеров не видит',
  s:['today','students','student','subs','attendance','payments','debts','schedule','inbox','trial','phone']},
 'Тренер · телефон':{av:'ТР',n:'Руслан · латина',r:'свои группы',note:'Свои группы и расписание, отметка посещений с телефона, свои проведённые занятия и начисления. Чужого не видит',
  s:['phone','attendance','schedule','trainer']},
 'Финансист':{av:'ФН',n:'Гульмира',r:'вся сеть · деньги',note:'Оплаты по всем филиалам, выписки Kaspi и банка, сверка, должники, деньги по филиалам, расчёт оплаты тренеров, аналитика',
  s:['dash','payments','recon','debts','branchfin','payroll','analytics','churn']},
 'Маркетолог':{av:'МК',n:'Айгерим',r:'заявки и источники',note:'Воронка по филиалам, входящие из WhatsApp, Instagram и 2ГИС, боты, пробные, конверсия по источникам и объявлениям',
  s:['funnel','inbox','bots','trial','analytics']},
 'Родитель':{av:'РД',n:'мама Амины',r:'кабинет',note:'Абонемент ребёнка, остаток занятий, посещения, оплаты и остаток к оплате, оплата через Kaspi, сообщения',s:['parent']}
};
let role='Руководитель федерации',cur='dash',theme='light',curSt='S-01',curTr='T-01',curBr='all';

/* ====== ФИЛИАЛЫ ====== */
const BR=[
 {id:'B01',city:'Алматы',n:'Розыбакиева 247',brand:'Grand Dance',mgr:'Асель',st:148,pay:117,rev:4020000,plan:4300000,tr:5,c:'#8c1d3f'},
 {id:'B02',city:'Алматы',n:'Аль-Фараби 77',brand:'Grand Dance',mgr:'Мадина',st:132,pay:108,rev:3680000,plan:3800000,tr:4,c:'#8c1d3f'},
 {id:'B03',city:'Алматы',n:'Момышулы 25',brand:'Ритм',mgr:'Жанар',st:96,pay:75,rev:2460000,plan:2800000,tr:3,c:'#b2452b'},
 {id:'B04',city:'Астана',n:'Мангилик Ел 52',brand:'Grand Dance',mgr:'Сауле',st:124,pay:98,rev:3480000,plan:3500000,tr:4,c:'#8c1d3f'},
 {id:'B05',city:'Астана',n:'Кабанбай батыра 11',brand:'Pas de Deux',mgr:'Динара',st:88,pay:72,rev:2500000,plan:2500000,tr:3,c:'#5b2a86'},
 {id:'B06',city:'Шымкент',n:'Тауке хана 8',brand:'Ритм',mgr:'Айжан',st:104,pay:74,rev:2280000,plan:2900000,tr:4,c:'#b2452b'},
 {id:'B07',city:'Караганда',n:'Бухар Жырау 40',brand:'Танцуй',mgr:'Олеся',st:76,pay:64,rev:1790000,plan:1900000,tr:3,c:'#1f6f8b'},
 {id:'B08',city:'Актобе',n:'Абилкайыр хана 60',brand:'Ритм',mgr:'Гульназ',st:62,pay:46,rev:1390000,plan:1650000,tr:2,c:'#b2452b'},
 {id:'B09',city:'Атырау',n:'Сатпаева 12',brand:'Танцуй',mgr:'Аида',st:54,pay:46,rev:1300000,plan:1400000,tr:2,c:'#1f6f8b'},
 {id:'B10',city:'Павлодар',n:'Кутузова 19',brand:'Танцуй',mgr:'Ирина',st:48,pay:40,rev:1120000,plan:1200000,tr:2,c:'#1f6f8b'},
 {id:'B11',city:'Усть-Каменогорск',n:'Казахстан 68',brand:'Pas de Deux',mgr:'Наталья',st:44,pay:37,rev:1030000,plan:1150000,tr:2,c:'#5b2a86'},
 {id:'B12',city:'Костанай',n:'Аль-Фараби 115',brand:'Ритм',mgr:'Алина',st:36,pay:29,rev:810000,plan:950000,tr:2,c:'#b2452b'}
];
const B=id=>BR.find(b=>b.id===id);
const NET=()=>BR.reduce((a,b)=>({st:a.st+b.st,pay:a.pay+b.pay,rev:a.rev+b.rev,plan:a.plan+b.plan,tr:a.tr+b.tr}),{st:0,pay:0,rev:0,plan:0,tr:0});

/* ====== АБОНЕМЕНТЫ · ТИПЫ ====== */
const SUBT=[
 {id:'A8',n:'8 занятий · месяц',les:8,days:30,price:32000,freeze:'по справке до 14 дней',miss:'1 пропуск переносится, остальные сгорают'},
 {id:'A12',n:'12 занятий · месяц',les:12,days:30,price:42000,freeze:'по справке до 14 дней',miss:'2 пропуска переносятся'},
 {id:'AU',n:'Безлимит · месяц',les:0,days:30,price:55000,freeze:'по справке до 7 дней',miss:'—'},
 {id:'A24',n:'24 занятия · 3 месяца',les:24,days:90,price:78000,freeze:'до 21 дня',miss:'3 пропуска переносятся'},
 {id:'AY',n:'Годовой · 96 занятий',les:96,days:365,price:280000,freeze:'до 45 дней',miss:'переносятся в пределах года'},
 {id:'AM',n:'Мамы · фитнес 8',les:8,days:30,price:24000,freeze:'до 7 дней',miss:'1 пропуск переносится'},
 {id:'AT',n:'Пробное занятие',les:1,days:7,price:0,freeze:'—',miss:'—'}
];
const ST_=id=>SUBT.find(s=>s.id===id);

/* ====== УЧЕНИКИ (выборка из 1 012) ====== */
/* sub: тип; start/end; used — посещений использовано; miss — пропуски; sick — болезнь; paid — оплачено по абонементу; due — остаток к оплате; st: ok · exp (истекает) · debt · frozen · trial · nopay (ходит без оплаты) */
const STU=[
 {id:'S-01',n:'Амина Сейткали',age:7,par:'Айгуль (мама)',ph:'+7 701 ··· 22 41',br:'B01',grp:'G-01',tr:'T-01',sub:'A8',start:'2026-09-01',end:'2026-09-30',used:6,miss:1,sick:0,paid:32000,due:0,st:'ok',src:'Instagram',since:'2025-09'},
 {id:'S-02',n:'Даниял Омаров',age:9,par:'Ерлан (папа)',ph:'+7 777 ··· 18 05',br:'B01',grp:'G-02',tr:'T-02',sub:'A12',start:'2026-08-28',end:'2026-09-27',used:11,miss:0,sick:1,paid:42000,due:0,st:'exp',src:'2ГИС',since:'2024-10'},
 {id:'S-03',n:'Алина Бекова',age:12,par:'Сауле (мама)',ph:'+7 705 ··· 71 20',br:'B01',grp:'G-03',tr:'T-03',sub:'A12',start:'2026-09-03',end:'2026-10-02',used:7,miss:2,sick:0,paid:20000,due:22000,st:'debt',src:'рекомендация',since:'2023-09'},
 {id:'S-04',n:'Мирас Ахметов',age:6,par:'Жанна (мама)',ph:'+7 702 ··· 44 90',br:'B01',grp:'G-01',tr:'T-01',sub:'A8',start:'2026-08-20',end:'2026-09-19',used:8,miss:0,sick:0,paid:32000,due:32000,st:'nopay',src:'Instagram',since:'2026-03'},
 {id:'S-05',n:'Карина Ли',age:34,par:'—',ph:'+7 707 ··· 33 12',br:'B01',grp:'G-04',tr:'T-04',sub:'AM',start:'2026-09-08',end:'2026-10-07',used:4,miss:0,sick:0,paid:24000,due:0,st:'ok',src:'WhatsApp',since:'2026-09'},
 {id:'S-06',n:'Тимур Жаксыбек',age:10,par:'Асем (мама)',ph:'+7 771 ··· 09 87',br:'B01',grp:'G-02',tr:'T-02',sub:'A24',start:'2026-08-01',end:'2026-10-29',used:15,miss:1,sick:3,paid:78000,due:0,st:'frozen',src:'сайт',since:'2025-01'},
 {id:'S-07',n:'Айлин Нурланова',age:5,par:'Динара (мама)',ph:'+7 700 ··· 56 78',br:'B01',grp:'G-01',tr:'T-01',sub:'AT',start:'2026-09-24',end:'2026-09-30',used:0,miss:0,sick:0,paid:0,due:0,st:'trial',src:'Instagram',since:'2026-09'},
 {id:'S-08',n:'Ерасыл Касымов',age:14,par:'Бахыт (папа)',ph:'+7 747 ··· 21 33',br:'B02',grp:'G-05',tr:'T-05',sub:'AY',start:'2026-01-15',end:'2027-01-14',used:61,miss:4,sick:2,paid:280000,due:0,st:'ok',src:'рекомендация',since:'2022-09'},
 {id:'S-09',n:'Диана Ермекова',age:8,par:'Гульнара (мама)',ph:'+7 778 ··· 65 43',br:'B02',grp:'G-06',tr:'T-06',sub:'A8',start:'2026-09-02',end:'2026-10-01',used:5,miss:1,sick:0,paid:32000,due:0,st:'ok',src:'2ГИС',since:'2026-02'},
 {id:'S-10',n:'Санжар Абдуллин',age:11,par:'Мадина (мама)',ph:'+7 701 ··· 80 19',br:'B02',grp:'G-05',tr:'T-05',sub:'A12',start:'2026-08-25',end:'2026-09-24',used:10,miss:2,sick:0,paid:42000,due:0,st:'exp',src:'Facebook',since:'2025-05'},
 {id:'S-11',n:'Аружан Сапарова',age:9,par:'Жанат (папа)',ph:'+7 702 ··· 14 27',br:'B02',grp:'G-06',tr:'T-06',sub:'A8',start:'2026-09-01',end:'2026-09-30',used:7,miss:0,sick:0,paid:0,due:32000,st:'nopay',src:'Instagram',since:'2026-08'},
 {id:'S-12',n:'Ислам Токтаров',age:13,par:'Айнур (мама)',ph:'+7 705 ··· 92 61',br:'B04',grp:'G-07',tr:'T-07',sub:'A12',start:'2026-09-05',end:'2026-10-04',used:6,miss:1,sick:0,paid:42000,due:0,st:'ok',src:'2ГИС',since:'2024-09'},
 {id:'S-13',n:'Мадина Кожахметова',age:7,par:'Алия (мама)',ph:'+7 707 ··· 38 84',br:'B04',grp:'G-08',tr:'T-08',sub:'AY',start:'2026-03-01',end:'2027-02-28',used:48,miss:3,sick:1,paid:280000,due:0,st:'transfer',src:'рекомендация',since:'2024-03'},
 {id:'S-14',n:'Артур Ким',age:15,par:'Виктория (мама)',ph:'+7 777 ··· 47 55',br:'B06',grp:'G-09',tr:'T-09',sub:'A12',start:'2026-08-30',end:'2026-09-29',used:9,miss:3,sick:0,paid:42000,due:0,st:'ok',src:'сайт',since:'2025-09'},
 {id:'S-15',n:'Айгерим Досжан',age:6,par:'Сабина (мама)',ph:'+7 701 ··· 60 08',br:'B06',grp:'G-10',tr:'T-10',sub:'A8',start:'2026-08-18',end:'2026-09-17',used:8,miss:0,sick:0,paid:0,due:32000,st:'nopay',src:'Instagram',since:'2026-06'},
 {id:'S-16',n:'Нурсултан Бейсен',age:10,par:'Ерболат (папа)',ph:'+7 771 ··· 25 76',br:'B06',grp:'G-09',tr:'T-09',sub:'A8',start:'2026-09-10',end:'2026-10-09',used:3,miss:0,sick:0,paid:16000,due:16000,st:'debt',src:'2ГИС',since:'2026-09'},
 {id:'S-17',n:'Камила Жумабек',age:31,par:'—',ph:'+7 702 ··· 73 19',br:'B04',grp:'G-11',tr:'T-11',sub:'AM',start:'2026-09-15',end:'2026-10-14',used:3,miss:0,sick:0,paid:24000,due:0,st:'ok',src:'WhatsApp',since:'2026-09'},
 {id:'S-18',n:'Асель Мусина',age:8,par:'Гаухар (мама)',ph:'+7 778 ··· 11 02',br:'B08',grp:'G-12',tr:'T-12',sub:'A8',start:'2026-08-22',end:'2026-09-21',used:8,miss:0,sick:0,paid:32000,due:32000,st:'nopay',src:'2ГИС',since:'2025-11'}
];
const S_=id=>STU.find(s=>s.id===id);
const SST={ok:['активен','g'],exp:['истекает','w'],debt:['долг','r'],frozen:['заморозка','i'],trial:['пробное',''],nopay:['ходит без оплаты','r'],transfer:['перевод','v']};
const subLeft=s=>{const t=ST_(s.sub);return t.les?Math.max(0,t.les-s.used):null};
const daysLeft=s=>Math.round((new Date(s.end)-new Date(TODAY))/864e5);

/* ====== ГРУППЫ ====== */
const GRP=[
 {id:'G-01',n:'Дети 5–7 · латина',br:'B01',tr:'T-01',days:'пн · ср · пт 17:00',hall:'Зал 1',size:12},
 {id:'G-02',n:'Дети 8–10 · стандарт',br:'B01',tr:'T-02',days:'вт · чт 18:00, сб 11:00',hall:'Зал 2',size:14},
 {id:'G-03',n:'Юниоры 11–13 · спорт',br:'B01',tr:'T-03',days:'пн · ср · пт 19:00',hall:'Зал 1',size:10},
 {id:'G-04',n:'Мамы · фитнес',br:'B01',tr:'T-04',days:'вт · чт 10:00',hall:'Зал 2',size:16},
 {id:'G-05',n:'Юниоры 11–15 · спорт',br:'B02',tr:'T-05',days:'пн · ср · пт 18:30',hall:'Зал 1',size:12},
 {id:'G-06',n:'Дети 7–9 · латина',br:'B02',tr:'T-06',days:'вт · чт 17:00, сб 10:00',hall:'Зал 2',size:14},
 {id:'G-07',n:'Дети 11–13 · стандарт',br:'B04',tr:'T-07',days:'пн · ср 18:00',hall:'Зал 1',size:12},
 {id:'G-08',n:'Дети 6–8 · латина',br:'B04',tr:'T-08',days:'вт · чт · сб 16:00',hall:'Зал 2',size:14},
 {id:'G-09',n:'Юниоры 12–15 · спорт',br:'B06',tr:'T-09',days:'пн · ср · пт 19:00',hall:'Зал 1',size:10},
 {id:'G-10',n:'Дети 5–7 · латина',br:'B06',tr:'T-10',days:'вт · чт 17:00',hall:'Зал 2',size:12},
 {id:'G-11',n:'Мамы · фитнес',br:'B04',tr:'T-11',days:'пн · ср 10:00',hall:'Зал 2',size:14},
 {id:'G-12',n:'Дети 7–9 · латина',br:'B08',tr:'T-12',days:'пн · ср · пт 17:00',hall:'Зал 1',size:12}
];
const G_=id=>GRP.find(g=>g.id===id);

/* ====== ТРЕНЕРЫ (выборка из 36) ====== */
/* rate — за занятие; plan — занятий по расписанию в сентябре; done — проведено и подтверждено; nosh — не вышел; rep — замены; sick — по болезни; conf — подтверждено отметками учеников */
const TR=[
 {id:'T-01',n:'Руслан Даулетов',br:'B01',spec:'латина · дети',rate:6000,plan:20,done:19,nosh:0,rep:1,sick:0,conf:19,rating:4.9,groups:['G-01']},
 {id:'T-02',n:'Айгерим Токаева',br:'B01',spec:'стандарт · дети',rate:6000,plan:22,done:22,nosh:0,rep:0,sick:0,conf:22,rating:4.8,groups:['G-02']},
 {id:'T-03',n:'Дмитрий Волков',br:'B01',spec:'спорт · юниоры',rate:8000,plan:20,done:12,nosh:8,rep:0,sick:0,conf:12,rating:3.6,groups:['G-03']},
 {id:'T-04',n:'Наргиз Алиева',br:'B01',spec:'фитнес · мамы',rate:5000,plan:16,done:16,nosh:0,rep:0,sick:0,conf:16,rating:4.7,groups:['G-04']},
 {id:'T-05',n:'Азамат Сериков',br:'B02',spec:'спорт · юниоры',rate:8000,plan:20,done:18,nosh:0,rep:0,sick:2,conf:18,rating:4.6,groups:['G-05']},
 {id:'T-06',n:'Елена Ким',br:'B02',spec:'латина · дети',rate:6000,plan:22,done:22,nosh:0,rep:0,sick:0,conf:21,rating:4.9,groups:['G-06']},
 {id:'T-07',n:'Бауыржан Есимов',br:'B04',spec:'стандарт · дети',rate:6000,plan:16,done:16,nosh:0,rep:0,sick:0,conf:16,rating:4.5,groups:['G-07']},
 {id:'T-08',n:'Малика Юсупова',br:'B04',spec:'латина · дети',rate:6000,plan:24,done:20,nosh:0,rep:4,sick:0,conf:20,rating:4.4,groups:['G-08']},
 {id:'T-09',n:'Арман Кенжебаев',br:'B06',spec:'спорт · юниоры',rate:7000,plan:20,done:20,nosh:0,rep:0,sick:0,conf:14,rating:4.2,groups:['G-09']},
 {id:'T-10',n:'Жулдыз Абенова',br:'B06',spec:'латина · дети',rate:5500,plan:16,done:16,nosh:0,rep:0,sick:0,conf:16,rating:4.8,groups:['G-10']},
 {id:'T-11',n:'Дана Сулейменова',br:'B04',spec:'фитнес · мамы',rate:5000,plan:16,done:15,nosh:1,rep:0,sick:0,conf:15,rating:4.6,groups:['G-11']},
 {id:'T-12',n:'Олег Титов',br:'B08',spec:'латина · дети',rate:5500,plan:20,done:20,nosh:0,rep:0,sick:0,conf:20,rating:4.7,groups:['G-12']}
];
const T_=id=>TR.find(t=>t.id===id);
const trPay=t=>t.done*t.rate;
/* ====== ЗАНЯТИЯ И ПОСЕЩЕНИЯ (журнал) ====== */
/* st: done · nosh (тренер не вышел) · rep (замена) · planned; marks — отметки тренера: p/a/s (присутствовал/отсутствовал/болел); adm — подтверждено администратором */
const LES=[
 {id:'L-901',d:'2026-09-24',t:'17:00',grp:'G-01',tr:'T-01',br:'B01',st:'planned',marks:null,adm:false},
 {id:'L-902',d:'2026-09-24',t:'19:00',grp:'G-03',tr:'T-03',br:'B01',st:'planned',marks:null,adm:false},
 {id:'L-903',d:'2026-09-23',t:'17:00',grp:'G-01',tr:'T-01',br:'B01',st:'done',marks:{p:11,a:1,s:0},adm:true},
 {id:'L-904',d:'2026-09-23',t:'19:00',grp:'G-03',tr:'T-03',br:'B01',st:'nosh',marks:null,adm:true,note:'тренер не вышел, группа распущена, родители в WhatsApp'},
 {id:'L-905',d:'2026-09-23',t:'18:00',grp:'G-02',tr:'T-02',br:'B01',st:'done',marks:{p:13,a:1,s:0},adm:true},
 {id:'L-906',d:'2026-09-22',t:'18:30',grp:'G-05',tr:'T-05',br:'B02',st:'done',marks:{p:10,a:2,s:0},adm:true},
 {id:'L-907',d:'2026-09-22',t:'16:00',grp:'G-08',tr:'T-08',br:'B04',st:'rep',marks:{p:12,a:2,s:0},adm:true,note:'замена: вела Дана Сулейменова'},
 {id:'L-908',d:'2026-09-22',t:'19:00',grp:'G-09',tr:'T-09',br:'B06',st:'done',marks:{p:9,a:1,s:0},adm:false,note:'отметки тренера есть, у 6 учеников нет отметки в приложении'},
 {id:'L-909',d:'2026-09-22',t:'10:00',grp:'G-04',tr:'T-04',br:'B01',st:'done',marks:{p:14,a:2,s:0},adm:true},
 {id:'L-910',d:'2026-09-21',t:'19:00',grp:'G-03',tr:'T-03',br:'B01',st:'nosh',marks:null,adm:true,note:'тренер не вышел, 4-й раз за две недели'},
 {id:'L-911',d:'2026-09-21',t:'17:00',grp:'G-12',tr:'T-12',br:'B08',st:'done',marks:{p:11,a:1,s:0},adm:true},
 {id:'L-912',d:'2026-09-20',t:'11:00',grp:'G-02',tr:'T-02',br:'B01',st:'done',marks:{p:12,a:1,s:1},adm:true}
];
const LST={done:['проведено','g'],nosh:['тренер не вышел','r'],rep:['замена','w'],planned:['сегодня','i']};

/* ====== ОПЛАТЫ И ВЫПИСКИ ====== */
/* way: kaspi · bank · card; st: matched (сопоставлено) · new (в выписке, не разнесено) · manual (разнесено вручную) · partial */
const PAY=[
 {id:'P-2211',d:'2026-09-24',v:32000,way:'kaspi',from:'Айгуль С.',stu:'S-01',br:'B01',st:'matched',sub:'A8',note:'продление с 01.10'},
 {id:'P-2210',d:'2026-09-24',v:42000,way:'kaspi',from:'ЕРЛАН О.',stu:'S-02',br:'B01',st:'matched',sub:'A12',note:'продление'},
 {id:'P-2209',d:'2026-09-24',v:24000,way:'card',from:'Карина Л.',stu:'S-05',br:'B01',st:'matched',sub:'AM'},
 {id:'P-2208',d:'2026-09-23',v:20000,way:'kaspi',from:'САУЛЕ Б.',stu:'S-03',br:'B01',st:'partial',sub:'A12',note:'частично: 20 000 из 42 000, остаток до 30.09'},
 {id:'P-2207',d:'2026-09-23',v:32000,way:'kaspi',from:'Гульнара Е.',stu:'S-09',br:'B02',st:'matched',sub:'A8'},
 {id:'P-2206',d:'2026-09-23',v:42000,way:'bank',from:'ТОО «Аркада» за Ислама Т.',stu:'S-12',br:'B04',st:'manual',sub:'A12',note:'платёж от юрлица, разнёс администратор'},
 {id:'P-2205',d:'2026-09-23',v:32000,way:'kaspi',from:'МАРАТ К.',stu:null,br:null,st:'new',sub:null,note:'нет совпадения по имени — кто это?'},
 {id:'P-2204',d:'2026-09-23',v:16000,way:'kaspi',from:'Ерболат Б.',stu:'S-16',br:'B06',st:'partial',sub:'A8',note:'частично: 16 000 из 32 000'},
 {id:'P-2203',d:'2026-09-22',v:55000,way:'card',from:'Виктория К.',stu:'S-14',br:'B06',st:'matched',sub:'AU',note:'смена типа на безлимит'},
 {id:'P-2202',d:'2026-09-22',v:42000,way:'kaspi',from:'Мадина А.',stu:'S-10',br:'B02',st:'matched',sub:'A12'},
 {id:'P-2201',d:'2026-09-22',v:24000,way:'kaspi',from:'Камила Ж.',stu:'S-17',br:'B04',st:'matched',sub:'AM'},
 {id:'P-2200',d:'2026-09-22',v:32000,way:'kaspi',from:'ДИНАРА Н.',stu:null,br:null,st:'new',sub:null,note:'сумма абонемента 8, имя совпадает с двумя родителями в Астане'}
];
const PW={kaspi:'Kaspi Pay',bank:'банк',card:'карта'};
const PST={matched:['разнесено','g'],new:['не разнесено','r'],manual:['вручную','i'],partial:['частично','w']};

/* сверка «ходят ↔ оплачено» по филиалам: att — ходят (посещали за 30 дней), paid — с действующим оплаченным абонементом; причины разницы */
const RECON=BR.map(b=>{const gap=b.st-b.pay;const trial=Math.round(gap*0.22),inst=Math.round(gap*0.18),late=Math.round(gap*0.3),unk=Math.round(gap*0.15);return {br:b.id,att:b.st,paid:b.pay,gap,trial,inst,late,unk,susp:gap-trial-inst-late-unk}});
const RECON_T=RECON.reduce((a,r)=>({att:a.att+r.att,paid:a.paid+r.paid,gap:a.gap+r.gap,trial:a.trial+r.trial,inst:a.inst+r.inst,late:a.late+r.late,unk:a.unk+r.unk,susp:a.susp+r.susp}),{att:0,paid:0,gap:0,trial:0,inst:0,late:0,unk:0,susp:0});

/* должники и рассрочки */
const DEBT=[
 {stu:'S-03',v:22000,until:'2026-09-30',kind:'рассрочка · договорённость с мамой',bot:'напоминание 28.09 и 30.09'},
 {stu:'S-16',v:16000,until:'2026-09-28',kind:'рассрочка · 50 % при старте',bot:'напоминание 26.09'},
 {stu:'S-04',v:32000,until:'2026-09-19',kind:'абонемент закончился 19.09, ходит',bot:'3 напоминания без ответа → задача администратору'},
 {stu:'S-11',v:32000,until:'2026-09-01',kind:'оплата не найдена в выписке',bot:'родитель: «платили Kaspi 1 сентября» → проверить P-2205?'},
 {stu:'S-15',v:32000,until:'2026-09-17',kind:'абонемент закончился 17.09, ходит',bot:'напоминание отправлено, ответа нет'},
 {stu:'S-18',v:32000,until:'2026-09-21',kind:'абонемент закончился 21.09, ходит',bot:'администратор Актобе не отметил продление'}
];

/* переводы между филиалами */
const TRANS=[
 {id:'ПР-14',stu:'S-13',from:'B04',to:'B01',d:'2026-09-22',st:'wait',reason:'переезд семьи в Алматы',sub:'AY',paid:280000,used:48,les:96,start:'2026-03-01'},
 {id:'ПР-13',stu:null,n:'Алишер Мухтаров',from:'B06',to:'B04',d:'2026-09-12',st:'done',reason:'переезд',sub:'A24',paid:78000,used:9,les:24,start:'2026-08-15'},
 {id:'ПР-12',stu:null,n:'Инкар Бекжан',from:'B02',to:'B01',d:'2026-09-05',st:'done',reason:'ближе к дому',sub:'A12',paid:42000,used:4,les:12,start:'2026-09-01'}
];
const transCalc=t=>{const perLes=t.paid/t.les;const rest=t.les-t.used;return {perLes,rest,restSum:Math.round(perLes*rest)}};

/* ====== ПРОДАЖИ ====== */
const FUN=[{k:'new',n:'Заявка',c:'#5e7280'},{k:'call',n:'Связались',c:'#2f6f9e'},{k:'trial',n:'Пробное назначено',c:'#8c1d3f'},{k:'came',n:'Пришёл на пробное',c:'#b2452b'},{k:'sub',n:'Абонемент',c:'#1f7a5a'}];
const LEADS=[
 {id:'L-501',n:'Айлин, 5 лет',par:'Динара',ph:'+7 700 ··· 56 78',src:'Instagram',ad:'reels «латина 5+» · сентябрь',br:'B01',k:'trial',d:'2026-09-22',next:'пробное сегодня 17:00'},
 {id:'L-502',n:'Ева, 8 лет',par:'Ольга',ph:'+7 777 ··· 90 12',src:'2ГИС → WhatsApp',ad:'карточка «Розыбакиева 247»',br:'B01',k:'call',d:'2026-09-23',next:'перезвонить 18:00, выбирает дни'},
 {id:'L-503',n:'Адиль, 11 лет',par:'Марат',ph:'+7 701 ··· 33 20',src:'Facebook',ad:'лид-форма «спортивные бальные»',br:'B04',k:'new',d:'2026-09-24',next:'бот ответил, ждёт менеджера'},
 {id:'L-504',n:'Сабина, мама',par:'Сабина',ph:'+7 702 ··· 08 77',src:'WhatsApp',ad:'—',br:'B01',k:'came',d:'2026-09-20',next:'была на фитнесе 22.09, предложить AM'},
 {id:'L-505',n:'Дамир, 7 лет',par:'Асель',ph:'+7 705 ··· 65 09',src:'Instagram',ad:'сторис «набор в Шымкенте»',br:'B06',k:'sub',d:'2026-09-15',next:'абонемент A8 оплачен 21.09'},
 {id:'L-506',n:'Зере, 6 лет',par:'Айгерим',ph:'+7 771 ··· 42 19',src:'2ГИС → WhatsApp',ad:'карточка «Мангилик Ел 52»',br:'B04',k:'trial',d:'2026-09-23',next:'пробное 25.09 16:00'},
 {id:'L-507',n:'Милана, 9 лет',par:'Наталья',ph:'+7 778 ··· 55 31',src:'Instagram',ad:'reels «стандарт 8–10»',br:'B11',k:'new',d:'2026-09-24',next:'новая · 09:40'},
 {id:'L-508',n:'Алия, мама',par:'Алия',ph:'+7 707 ··· 12 88',src:'рекомендация',ad:'—',br:'B02',k:'came',d:'2026-09-19',next:'думает между 8 и безлимитом'}
];
const INBOX=[
 {ch:'Instagram',who:'Динара · мама Айлин',t:'09:12',m:'Добрый день! Мы сегодня на пробное в 17:00, что взять с собой?',lead:'L-501',bot:false},
 {ch:'2ГИС → WhatsApp',who:'Ольга · мама Евы',t:'09:30',m:'Здравствуйте, сколько стоит абонемент на 8 занятий для 8 лет?',lead:'L-502',bot:true,ans:'Бот: «8 занятий — 32 000 ₸, 12 — 42 000 ₸. Первое занятие бесплатно. Записать на пробное во вторник или четверг?»'},
 {ch:'Facebook',who:'Марат · папа Адиля',t:'09:41',m:'Лид-форма: спортивные бальные, 11 лет, Астана',lead:'L-503',bot:true,ans:'Бот: «Марат, спасибо! Ближайший филиал — Мангилик Ел 52. Менеджер напишет в течение 15 минут»'},
 {ch:'WhatsApp',who:'Сауле · мама Алины',t:'10:05',m:'Остаток 22 000 внесу 30-го, можно?',lead:null,stu:'S-03',bot:true,ans:'Бот: «Да, зафиксировали: 22 000 ₸ до 30.09. Напомним 28-го»'},
 {ch:'WhatsApp',who:'Жанат · папа Аружан',t:'10:20',m:'Мы платили 1 сентября через Kaspi, почему долг?',lead:null,stu:'S-11',bot:false},
 {ch:'Instagram',who:'Наталья · мама Миланы',t:'09:40',m:'Здравствуйте! Есть группа 9 лет в Усть-Каменогорске?',lead:'L-507',bot:true,ans:'Бот: «Да, Казахстан 68: вт·чт 17:00. Записать на бесплатное пробное?»'}
];
const BOTS=[
 {ev:'Новая заявка · Instagram, 2ГИС, Facebook, WhatsApp',to:'родитель',txt:'{имя}, спасибо за обращение! Ближайший филиал — {филиал}, группа {группа}. Первое занятие бесплатно. Записать на {дата1} или {дата2}?',on:true},
 {ev:'За день до пробного',to:'родитель',txt:'Напоминаем: завтра в {время} пробное занятие в {филиал}, {адрес}. Взять с собой: удобную одежду и воду. Подтвердите «+».',on:true},
 {ev:'После пробного',to:'родитель',txt:'{имя}, как вам занятие? Тренер {тренер} оставил отзыв: {отзыв}. Абонемент 8 занятий — {цена} ₸, оплата Kaspi по ссылке: {ссылка}.',on:true},
 {ev:'Оплата разнесена',to:'родитель',txt:'Оплата {сумма} ₸ получена {дата}. Абонемент «{тип}» действует до {конец}, осталось {n} занятий. Спасибо!',on:true},
 {ev:'Частичная оплата · за 2 дня до дедлайна',to:'родитель',txt:'{имя}, напоминаем: остаток {остаток} ₸ за абонемент {ребёнок} до {дата}. Оплатить Kaspi: {ссылка}.',on:true},
 {ev:'Абонемент заканчивается · за 3 занятия',to:'родитель',txt:'У {ребёнок} осталось {n} занятия по абонементу. Продлить на тех же условиях: {ссылка}. Дни группы сохраняются.',on:true},
 {ev:'Абонемент закончился, ребёнок ходит',to:'администратор',txt:'{ребёнок} был на занятии {дата} без действующего абонемента. Родитель: {имя}, {телефон}. Напоминания: {n}. Нужно решение.',on:true},
 {ev:'Тренер не отметил занятие через 2 часа',to:'тренер · управляющий',txt:'{тренер}, занятие {группа} {дата} {время} не отмечено. Отметьте в приложении, иначе оно не попадёт в расчёт.',on:true},
 {ev:'Утро 08:30',to:'руководитель',txt:'Сеть: ходят {att}, оплачено {paid}, без оплаты {gap}. Вчера оплат {sum}. Не разнесено {n}. Тренеров не вышло {nosh}. Заявок {leads}.',on:true}
];
const TRIALS=[
 {stu:'Айлин, 5',br:'B01',d:'2026-09-24',t:'17:00',tr:'T-01',src:'Instagram',st:'today',res:'—'},
 {stu:'Зере, 6',br:'B04',d:'2026-09-25',t:'16:00',tr:'T-08',src:'2ГИС',st:'planned',res:'—'},
 {stu:'Сабина (мама)',br:'B01',d:'2026-09-22',t:'10:00',tr:'T-04',src:'WhatsApp',st:'came',res:'понравилось, думает'},
 {stu:'Дамир, 7',br:'B06',d:'2026-09-18',t:'17:00',tr:'T-10',src:'Instagram',st:'sub',res:'купил A8 · 32 000'},
 {stu:'Алия (мама)',br:'B02',d:'2026-09-19',t:'10:00',tr:'T-04',src:'рекомендация',st:'came',res:'выбирает тип'},
 {stu:'Арсен, 10',br:'B04',d:'2026-09-17',t:'18:00',tr:'T-07',src:'Facebook',st:'noshow',res:'не пришёл, бот перенёс на 24.09'}
];
const TRST={today:['сегодня','i'],planned:['назначено',''],came:['пришёл','w'],sub:['купил абонемент','g'],noshow:['не пришёл','r']};
/* конверсия по источникам за 30 дней */
const SRC=[['Instagram',146,71,38,'reels и сторис по филиалам'],['2ГИС → WhatsApp',88,52,31,'карточки 12 филиалов'],['Facebook',41,19,8,'лид-формы'],['WhatsApp · прямые',63,40,26,'номер филиала'],['Рекомендации',37,29,22,'—'],['Сайт',22,11,6,'форма записи']];

/* ====== АНАЛИТИКА ====== */
const MONTHS=[['апр',780,612,19.2],['май',812,640,20.1],['июн',760,598,18.4],['июл',640,520,15.9],['авг',830,660,21.0],['сен',1012,806,25.9]]; // ходят, оплачено, выручка млн
const CHURN=[['Продлили вовремя',612,60],['Продлили с опозданием до 7 дней',118,12],['Продлили после напоминания бота',94,9],['Ушли после 1 абонемента',88,9],['Ушли после пробного',102,10]];

/* сегодняшняя лента для руководителя */
const TODAYL=[
 ['r','Тренер Дмитрий Волков (Розыбакиева) не вышел 4-й раз за две недели: 8 занятий группы G-03 не проведены, 10 учеников. Оплата за них не начислена. Решение: замена или увольнение','card(\'trainer\',\'T-03\')','Тренер'],
 ['r',`${RECON_T.gap} учеников ходят без действующего оплаченного абонемента: пробные ${RECON_T.trial}, рассрочки ${RECON_T.inst}, забыли продлить ${RECON_T.late}, оплата не найдена в выписке ${RECON_T.unk}, требуют проверки ${RECON_T.susp}`,'go(\'recon\')','Сверка'],
 ['w','2 платежа Kaspi не разнесены: «МАРАТ К.» 32 000 и «ДИНАРА Н.» 32 000 — нет однозначного совпадения. Возможно, это оплата Аружан (S-11), у которой «долг»','go(\'payments\')','Оплаты'],
 ['w','Перевод ПР-14: Мадина Кожахметова из Астаны в Алматы, годовой абонемент: использовано 48 из 96, остаток 140 000 ₸ переходит на Розыбакиева','card(\'transfer\',\'ПР-14\')','Перевод'],
 ['i','Занятие G-09 в Шымкенте 22.09: тренер отметил 9 присутствующих, в приложении отметились 3. Подтверждение администратора отсутствует','card(\'lesson\',\'L-908\')','Занятие'],
 ['b','Истекают до 30.09: 84 абонемента по сети. Бот отправил напоминания 79, ответили 41, оплатили 23','go(\'churn\')','Продления']
];
/* ====== ХЕЛПЕРЫ ЭКРАНОВ ====== */
const SC={};
const brTag=id=>{const b=B(id);return b?`<span class="tag" style="background:${b.c}18;color:${b.c}">${esc(b.city)} · ${esc(b.n)}</span>`:'<span class="tag">—</span>'};
const brL=(id,txt)=>{const b=B(id);return b?`<a class="lk" onclick="card('branch','${id}')">${esc(txt||(b.city+' · '+b.n))}</a>`:'—'};
const stL=(id,txt)=>{const s=S_(id);return s?`<a class="lk" onclick="openSt('${id}')">${esc(txt||s.n)}</a>`:'—'};
const trL=(id,txt)=>{const t=T_(id);return t?`<a class="lk" onclick="openTr('${id}')">${esc(txt||t.n)}</a>`:'—'};
const grL=(id,txt)=>{const g=G_(id);return g?`<a class="lk" onclick="card('group','${id}')">${esc(txt||g.n)}</a>`:'—'};
const lesL=id=>`<a class="lk mono" onclick="card('lesson','${id}')">${esc(id)}</a>`;
const payL=id=>`<a class="lk mono" onclick="card('pay','${id}')">${esc(id)}</a>`;
const stTag=s=>`<span class="tag ${SST[s.st][1]}">${SST[s.st][0]}</span>`;
const subLabel=s=>{const t=ST_(s.sub);const left=subLeft(s);return `${esc(t.n)}${left!=null?' · осталось '+left:''} · до ${dd(s.end)}`};
const barRow=(n,v,max,cls,lbl)=>`<div class="fr"><span>${n}</span><div class="bar"><i class="${cls||''}" style="--w:${Math.min(100,pct(v,max))}%"></i></div><b>${lbl||fmt(v)}</b></div>`;
const brFilter=()=>`<div class="ptabs"><button class="ptab ${curBr==='all'?'on':''}" onclick="curBr='all';render()">Вся сеть</button>${BR.map(b=>`<button class="ptab ${curBr===b.id?'on':''}" onclick="curBr='${b.id}';render()" title="${esc(b.brand)}">${esc(b.city)}${['Алматы','Астана'].includes(b.city)?' · '+esc(b.n.split(' ')[0]):''}</button>`).join('')}</div>`;
const inBr=x=>curBr==='all'||x.br===curBr;

/* ====== СЕТЬ ====== */
SC.dash=()=>{const n=NET();const nosh=LES.filter(l=>l.st==='nosh').length;const unpaid=PAY.filter(p=>p.st==='new').length;
 return `<div class="hd"><div><h2>12 филиалов на одном экране</h2><p>«Я не могу контролировать все 12 филиалов — я должна видеть это в системе». Одна строка на филиал: сколько ходят, сколько оплачено, разрыв, выручка к плану, тренеры. Красное — там, где деньги расходятся с посещениями. Строка кликается до ученика и занятия.</p></div>
 <div class="btns"><button class="bt" onclick="go('recon')">Сверка</button><button class="bt p" onclick="go('today')">Что требует действия</button></div></div>
 <div class="wid"><div><small>Ходят · 30 дней</small><b class="a">${fmt(n.st)}</b><span>учеников с посещениями по 12 филиалам</span></div>
 <div><small>Оплачено</small><b class="g">${fmt(n.pay)}</b><span>действующий оплаченный абонемент</span></div>
 <div><small>Без оплаты</small><b class="r">${fmt(n.st-n.pay)}</b><span>${pct(n.st-n.pay,n.st)} % · пробные, рассрочки, забыли, не найдено, проверить</span></div>
 <div><small>Выручка сентября</small><b>${mln(n.rev)}</b><span>план ${mln(n.plan)} · ${pct(n.rev,n.plan)} %</span></div>
 <div><small>Сигналы</small><b class="w">${nosh} · ${unpaid}</b><span>тренер не вышел · оплат не разнесено</span></div></div>
 <div class="tw"><table class="t"><tr><th>Филиал</th><th>Бренд</th><th>Управляющий</th><th class="r">Ходят</th><th class="r">Оплачено</th><th class="r">Без оплаты</th><th class="r">Выручка</th><th class="r">План</th><th></th><th class="r">Тренеры</th><th>Сигнал</th></tr><tbody>
 ${BR.map(b=>{const gap=b.st-b.pay;const gp=pct(gap,b.st);const sig=b.id==='B01'?'<span class="tag r">тренер не вышел ×4</span>':b.id==='B06'?'<span class="tag r">разрыв 25 %</span>':b.id==='B08'?'<span class="tag w">продления не отмечены</span>':b.id==='B04'?'<span class="tag i">перевод ожидает</span>':'<span class="tag g">норма</span>';
  return `<tr onclick="card('branch','${b.id}')"><td><b>${esc(b.city)}</b><span class="sub">${esc(b.n)}</span></td><td><span class="tag" style="background:${b.c}18;color:${b.c}">${esc(b.brand)}</span></td><td>${esc(b.mgr)}</td><td class="r">${b.st}</td><td class="r">${b.pay}</td><td class="r ${gp>20?'neg':gp>12?'warnt':''}"><b>${gap}</b> · ${gp} %</td><td class="r">${fmt(b.rev)}</td><td class="r">${fmt(b.plan)}</td><td><div class="bar" style="width:90px"><i class="${b.rev>=b.plan*0.95?'g':b.rev>=b.plan*0.85?'w':'r'}" style="--w:${Math.min(100,pct(b.rev,b.plan))}%"></i></div></td><td class="r">${b.tr}</td><td>${sig}</td></tr>`}).join('')}
 <tr class="total"><td>Сеть · 12 филиалов</td><td></td><td></td><td class="r">${fmt(n.st)}</td><td class="r">${fmt(n.pay)}</td><td class="r neg">${fmt(n.st-n.pay)} · ${pct(n.st-n.pay,n.st)} %</td><td class="r">${fmt(n.rev)}</td><td class="r">${fmt(n.plan)}</td><td></td><td class="r">${n.tr}</td><td></td></tr></tbody></table></div>
 <div class="g2" style="margin-top:12px"><div class="said"><b>Ваши слова на встрече</b><i>«У нас ходит тысяча человек, а оплаты — на восемьсот. И вот эти двести — непонятно, кто своровал». Здесь двести раскладываются на причины по каждому филиалу, и у каждой причины есть ответственный и действие.</i></div>
 <div class="hint"><b>Одна система вместо двух.</b> «Сейчас отдельно работает одна система — учёт абонемента, другая система. Две разные платформы, а мне нужно, чтобы они работали в одной». Заявка, пробное, абонемент, посещение, оплата и зарплата тренера — одна запись про одного ученика. Оплата пришла из выписки Kaspi — сразу видно, за кого и за какой филиал.</div></div>`};

SC.today=()=>{const exp=STU.filter(s=>s.st==='exp').length;const tr=TRIALS.filter(t=>t.st==='today').length;
 return `<div class="hd"><div><h2>Сегодня · четверг, 24 сентября</h2><p>Утренний экран руководителя: что требует решения по сети, что происходит в филиалах сегодня. Те же цифры приходят в WhatsApp в 08:30.</p></div>
 <div class="btns"><button class="bt" onclick="go('payments')">Оплаты</button><button class="bt p" onclick="go('dash')">Сеть</button></div></div>
 <div class="wid"><div><small>Занятий сегодня</small><b class="a">126</b><span>по 12 филиалам · 38 тренеров</span></div><div><small>Пробных сегодня</small><b class="i">${tr + 6}</b><span>напоминания отправлены вчера</span></div><div><small>Истекают на этой неделе</small><b class="w">84</b><span>абонементов · бот напомнил 79</span></div><div><small>Оплат вчера</small><b class="g">${tg(PAY.filter(p=>p.d==='2026-09-23').reduce((s,p)=>s+p.v,0))}</b><span>${PAY.filter(p=>p.d==='2026-09-23').length} платежей · 2 не разнесены</span></div><div><small>Тренеры не вышли</small><b class="r">${LES.filter(l=>l.st==='nosh').length}</b><span>занятия не проведены, оплата не начислена</span></div></div>
 <div class="g21"><div class="pan"><h3>Требует решения</h3><p>Система не решает за вас — приносит цифры и документ, чтобы решение занимало минуту.</p>
 ${TODAYL.map(d=>`<div class="li ${d[0]}"><i>!</i><span>${d[1]}</span><button class="bt" onclick="${d[2]}">${d[3]}</button></div>`).join('')}</div>
 <div><div class="pan"><h3>Пробные сегодня и завтра</h3>${TRIALS.filter(t=>t.st==='today'||t.st==='planned').map(t=>`<div class="kv"><span>${esc(t.stu)} · ${brL(t.br,B(t.br).city)}</span><b>${dd(t.d)} ${t.t} · ${trL(t.tr,T_(t.tr).n.split(' ')[0])}</b></div>`).join('')}</div>
 <div class="pan"><h3>Абонементы истекают</h3>${STU.filter(s=>s.st==='exp').map(s=>`<div class="kv"><span>${stL(s.id)} · ${esc(B(s.br).city)}</span><b>до ${dd(s.end)} · осталось ${subLeft(s)}</b></div>`).join('')}<p class="mini" style="margin-top:6px">Бот предложил продление, ссылка Kaspi отправлена родителям.</p></div></div></div>`};

/* ====== УЧЕНИКИ ====== */
let stF='all';
SC.students=()=>{const list=STU.filter(s=>inBr(s)&&(stF==='all'||s.st===stF));const cnt=k=>STU.filter(s=>inBr(s)&&s.st===k).length;
 return `<div class="hd"><div><h2>Ученики и абонементы</h2><p>Один список на всю сеть или по филиалу: тип абонемента, сколько занятий осталось, до какой даты, посещения и пропуски, что оплачено и что должны. Ходит без оплаты — красным. Выборка из 1 012 учеников сети.</p></div>
 <div class="btns"><button class="bt" onclick="act('xls')">⇩ Excel</button><button class="bt p" onclick="act('new-stu')">+ Ученик</button></div></div>
 ${brFilter()}
 <div class="ptabs">${[['all','Все'],['ok','Активные'],['exp','Истекают'],['debt','Долг'],['nopay','Ходят без оплаты'],['frozen','Заморозка'],['trial','Пробные'],['transfer','Перевод']].map(x=>`<button class="ptab ${stF===x[0]?'on':''}" onclick="stF='${x[0]}';render()">${x[1]}${x[0]!=='all'?' · '+cnt(x[0]):''}</button>`).join('')}</div>
 <div class="tw"><table class="t"><tr><th>Ученик</th><th>Филиал</th><th>Группа · тренер</th><th>Абонемент</th><th class="r">Посещений</th><th class="r">Пропуски</th><th class="r">Оплачено</th><th class="r">К оплате</th><th>Статус</th></tr><tbody>
 ${list.map(s=>{const t=ST_(s.sub);return `<tr onclick="openSt('${s.id}')"><td><b>${esc(s.n)}</b><span class="sub">${s.age<18?s.age+' лет · '+esc(s.par):'взрослая · '+esc(s.par==='—'?'фитнес для мам':s.par)}</span></td><td>${brTag(s.br)}</td><td>${grL(s.grp)}<span class="sub">${esc(T_(s.tr).n)}</span></td><td>${esc(t.n)}<span class="sub">${dd(s.start)} — ${dd(s.end)}${subLeft(s)!=null?' · осталось '+subLeft(s):''}</span></td><td class="r">${s.used}${t.les?' / '+t.les:''}</td><td class="r">${s.miss}${s.sick?' + '+s.sick+' болел':''}</td><td class="r">${fmt(s.paid)}</td><td class="r ${s.due?'neg':''}">${s.due?fmt(s.due):'—'}</td><td>${stTag(s)}</td></tr>`}).join('')}</tbody></table></div>`};

function openSt(id){curSt=id;if(!allowed('student')){card('stuinfo',id);return}go('student')}
function openTr(id){curTr=id;if(!allowed('trainer')){card('trainer',id);return}go('trainer')}
SC.student=()=>{const s=S_(curSt);const t=ST_(s.sub);const b=B(s.br);const g=G_(s.grp);const tr=T_(s.tr);const left=subLeft(s);const pays=PAY.filter(p=>p.stu===s.id);
 const hist=[['2026-09-23','занятие · присутствовал','отметил тренер, подтвердил администратор','ok'],['2026-09-21','занятие · присутствовал','',' ok'],['2026-09-19','пропуск','мама предупредила в WhatsApp — перенос','w'],['2026-09-17','занятие · присутствовал','','ok'],['2026-09-15','занятие · присутствовал','','ok'],['2026-09-12','занятие · присутствовал','','ok'],['2026-09-10','занятие · присутствовал','','ok'],[s.start,'старт абонемента «'+t.n+'»','оплата '+fmt(s.paid)+' ₸ · '+(pays[0]?PW[pays[0].way]:'Kaspi'),'i']];
 return `<div class="hd"><div><div class="crumb"><a onclick="go('students')">Ученики</a> › <b>${esc(s.n)}</b></div><h2>${esc(s.n)} ${stTag(s)}</h2><p>${s.age<18?s.age+' лет · родитель: '+esc(s.par):'взрослая группа'} · ${esc(s.ph)} · ${brL(s.br)} · ${grL(s.grp)} · тренер ${trL(s.tr)} · с нами с ${esc(s.since)} · источник: ${esc(s.src)}</p></div>
 <div class="btns"><button class="bt" onclick="act('wa-parent','${s.id}')">WhatsApp родителю</button><button class="bt" onclick="act('freeze','${s.id}')">Заморозка</button><button class="bt" onclick="act('transfer-new','${s.id}')">Перевод</button><button class="bt p" onclick="act('renew','${s.id}')">Продлить · счёт Kaspi</button></div></div>
 <div class="wid"><div><small>Абонемент</small><b style="font-size:15px">${esc(t.n)}</b><span>${dl(s.start)} — ${dl(s.end)} · ${daysLeft(s)>=0?'осталось '+daysLeft(s)+' дн.':'закончился '+Math.abs(daysLeft(s))+' дн. назад'}</span></div><div><small>Занятий</small><b class="${left===0?'r':'a'}">${t.les?s.used+' / '+t.les:s.used}</b><span>${left!=null?'осталось '+left:'безлимит'} · пропусков ${s.miss}${s.sick?' · болел '+s.sick:''}</span></div><div><small>Оплачено</small><b class="g">${tg(s.paid)}</b><span>${pays.length?pays.map(p=>PW[p.way]+' '+dd(p.d)).join(', '):s.paid?'по абонементу от '+dd(s.start):'оплата не найдена'}</span></div><div><small>К оплате</small><b class="${s.due?'r':'g'}">${s.due?tg(s.due):'0 ₸'}</b><span>${s.st==='debt'?'рассрочка · '+(DEBT.find(d=>d.stu===s.id)||{}).until:s.st==='nopay'?'ходит без действующего абонемента':'долга нет'}</span></div><div><small>Стоимость занятия</small><b>${t.les?tg(Math.round(t.price/t.les)):'—'}</b><span>для пересчёта при переводе и возврате</span></div></div>
 ${s.st==='nopay'?`<div class="note" style="--tone:var(--bad)"><b>Ходит без оплаты с ${dl(s.end)}</b><p>Абонемент закончился, посещения продолжаются: ${s.used} занятий отмечено тренером. Бот отправил напоминания, задача администратору ${esc(b.mgr)} стоит. Решение: продлить, договориться о рассрочке или закрыть доступ в группу.</p><div class="btns" style="justify-content:flex-start;margin-top:8px"><button class="bt p" onclick="act('renew','${s.id}')">Счёт на продление</button><button class="bt" onclick="act('inst','${s.id}')">Рассрочка</button><button class="bt" onclick="act('stop','${s.id}')">Снять с группы</button></div></div>`:''}
 ${s.st==='transfer'?`<div class="note" style="--tone:var(--violet)"><b>Перевод в другой филиал ожидает подтверждения</b><p>Годовой абонемент, использовано ${s.used} из ${t.les}. Остаток занятий и денег переходит в новый филиал автоматически — см. ${'<a class="lk" onclick="card(\'transfer\',\'ПР-14\')">ПР-14</a>'}.</p></div>`:''}
 <div class="g21"><div class="pan"><h3>История · посещения, оплаты, сообщения</h3><div class="tl">${hist.map(h=>`<div class="tli ${h[3].trim()==='ok'?'ok':h[3]==='w'?'':'on'}"><span class="who">${dl(h[0])}</span><b>${esc(h[1])}</b>${h[2]?`<p>${esc(h[2])}</p>`:''}</div>`).join('')}</div></div>
 <div><div class="pan"><h3>Правила абонемента</h3><div class="kv"><span>Срок</span><b>${t.days} дней</b></div><div class="kv"><span>Заморозка</span><b>${esc(t.freeze)}</b></div><div class="kv"><span>Пропуски</span><b>${esc(t.miss)}</b></div><div class="kv"><span>Цена</span><b>${tg(t.price)}</b></div></div>
 <div class="pan"><h3>Родитель видит в кабинете</h3><div class="li"><i>✓</i><span>Осталось ${left!=null?left:'∞'} занятий до ${dl(s.end)}</span></div><div class="li"><i>✓</i><span>Посещения и пропуски по датам</span></div><div class="li"><i>✓</i><span>Оплаты и остаток к оплате, кнопка «Оплатить Kaspi»</span></div><div class="li"><i>✓</i><span>Сообщения бота: напоминания, продление</span></div></div></div></div>`};

SC.subs=()=>{const cnt=id=>({A8:412,A12:238,AU:64,A24:96,AY:58,AM:86,AT:58}[id]);
 return `<div class="hd"><div><h2>Абонементы · типы и правила</h2><p>«Проблема с принятием оплаты, с началом абонемента, с концом абонемента, с учётом того, был клиент, не был, заболел». Каждый тип — свои правила: срок, заморозка по справке, что делать с пропусками. Правила применяются сами: посещение списывает занятие, справка ставит заморозку, конец срока запускает бота.</p></div>
 <div class="btns"><button class="bt p" onclick="act('sub-new')">+ Тип абонемента</button></div></div>
 <div class="tw"><table class="t"><tr><th>Тип</th><th class="r">Занятий</th><th class="r">Срок</th><th class="r">Цена</th><th class="r">За занятие</th><th>Заморозка</th><th>Пропуски</th><th class="r">Действует в сети</th></tr><tbody>${SUBT.map(t=>`<tr onclick="card('subt','${t.id}')"><td><b>${esc(t.n)}</b></td><td class="r">${t.les||'∞'}</td><td class="r">${t.days} дн.</td><td class="r">${t.price?fmt(t.price):'бесплатно'}</td><td class="r">${t.les&&t.price?fmt(Math.round(t.price/t.les)):'—'}</td><td class="mini">${esc(t.freeze)}</td><td class="mini">${esc(t.miss)}</td><td class="r">${cnt(t.id)}</td></tr>`).join('')}</tbody></table></div>
 <div class="g3" style="margin-top:12px"><div class="pan"><h3>Начало</h3><p>Абонемент стартует с первого посещения или с даты оплаты — правило выбирается в типе. Если оплата частичная, абонемент активен, а остаток стоит в должниках с датой.</p></div><div class="pan"><h3>Пропуск, болезнь, заморозка</h3><p>Тренер отмечает «отсутствовал» или «болел». Болезнь со справкой ставит заморозку и сдвигает конец срока. Пропуск без причины сгорает или переносится по правилу типа.</p></div><div class="pan"><h3>Конец</h3><p>За три занятия до конца бот предлагает продление со ссылкой Kaspi. В день окончания абонемент закрывается; если ребёнок пришёл — это «ходит без оплаты», задача администратору.</p></div></div>
 <div class="said"><b>Ваши слова</b><i>«Фитнес покупает годовой абонемент, у них голова не болит: пришёл, не пришёл — по барабану. А у меня чёткое понимание по каждому занятию». Поэтому единица учёта здесь — занятие, а не месяц.</i></div>`};

let attD='2026-09-23';
SC.attendance=()=>{const list=LES.filter(l=>inBr(l));
 return `<div class="hd"><div><h2>Посещения · журнал занятий</h2><p>Каждое занятие по расписанию — строка: тренер отмечает присутствующих с телефона, администратор подтверждает, ученики могут отметиться в приложении. Три отметки сходятся — занятие идёт в зарплату тренера и списывает занятия у учеников. Не сходятся — сигнал.</p></div>
 <div class="btns"><button class="bt" onclick="go('control')">Расхождения</button><button class="bt p" onclick="act('mark')">Отметить занятие</button></div></div>
 ${brFilter()}
 <div class="tw"><table class="t"><tr><th>Занятие</th><th>Дата</th><th>Филиал</th><th>Группа</th><th>Тренер</th><th class="r">Был</th><th class="r">Нет</th><th class="r">Болел</th><th>Администратор</th><th>Статус</th></tr><tbody>${list.map(l=>`<tr onclick="card('lesson','${l.id}')"><td>${lesL(l.id)}</td><td class="mono">${dayOf(l.d)} ${dd(l.d)} ${l.t}</td><td>${brTag(l.br)}</td><td>${grL(l.grp)}</td><td>${trL(l.tr)}</td><td class="r">${l.marks?l.marks.p:'—'}</td><td class="r">${l.marks?l.marks.a:'—'}</td><td class="r">${l.marks?l.marks.s:'—'}</td><td>${l.st==='planned'?'<span class="mini">после занятия</span>':l.adm?'<span class="tag g">подтверждено</span>':'<span class="tag w">не подтверждено</span>'}</td><td><span class="tag ${LST[l.st][1]}">${LST[l.st][0]}</span>${l.note?`<span class="sub">${esc(l.note)}</span>`:''}</td></tr>`).join('')}</tbody></table></div>
 <div class="g2" style="margin-top:12px"><div class="hint"><b>Почему три отметки.</b> Тренер может отметить занятие, которого не было. Администратор подтверждает факт. Ученики отмечаются в приложении по QR в зале или кнопкой. Если тренер отметил девять, а отметились трое — это расхождение, оно видно управляющему и руководителю.</div><div class="said"><b>Ваши слова</b><i>«Если тренер не вышел на работу, ушёл, заболел — где это отражается? Здесь его не было 8 занятий, за что я плачу зарплату этому человеку?»</i></div></div>`};

SC.transfer=()=>`<div class="hd"><div><h2>Перевод между филиалами</h2><p>«Он в этом филиале заплатил за год, а теперь нужны эти деньги, и сколько он отходил — пересчитать». Система считает сама: цена занятия × неиспользованные занятия = остаток, который переходит в новый филиал. Деньги между филиалами двигаются проводкой, у обоих управляющих — свой отчёт.</p></div>
 <div class="btns"><button class="bt p" onclick="act('transfer-new')">+ Перевод</button></div></div>
 <div class="tw"><table class="t"><tr><th>Перевод</th><th>Ученик</th><th>Откуда → куда</th><th>Абонемент</th><th class="r">Оплачено</th><th class="r">Использовано</th><th class="r">За занятие</th><th class="r">Остаток занятий</th><th class="r">Остаток денег</th><th>Статус</th></tr><tbody>${TRANS.map(t=>{const c=transCalc(t);return `<tr onclick="card('transfer','${t.id}')"><td class="mono"><b>${t.id}</b><span class="sub">${dd(t.d)} · ${esc(t.reason)}</span></td><td>${t.stu?stL(t.stu):esc(t.n)}</td><td>${esc(B(t.from).city)} → <b>${esc(B(t.to).city)}</b></td><td>${esc(ST_(t.sub).n)}</td><td class="r">${fmt(t.paid)}</td><td class="r">${t.used} / ${t.les}</td><td class="r">${fmt(c.perLes)}</td><td class="r">${c.rest}</td><td class="r"><b>${fmt(c.restSum)}</b></td><td>${t.st==='wait'?'<span class="tag w">ожидает подтверждения</span>':'<span class="tag g">выполнен</span>'}</td></tr>`}).join('')}</tbody></table></div>
 <div class="g3" style="margin-top:12px"><div class="pan"><h3>Что происходит при переводе</h3><div class="li"><i>1</i><span>Ученик со всей историей переходит в новый филиал и группу</span></div><div class="li"><i>2</i><span>Остаток занятий и срок сохраняются, заморозки учитываются</span></div><div class="li"><i>3</i><span>Остаток денег списывается с выручки старого филиала и зачисляется новому</span></div><div class="li"><i>4</i><span>Родителю — сообщение с новым адресом и расписанием</span></div></div><div class="pan"><h3>Если абонемент дороже в новом филиале</h3><p>Остаток пересчитывается по цене занятия нового типа: система показывает разницу, администратор выставляет доплату или оставляет как есть — правило задаёт руководитель.</p></div><div class="pan"><h3>Возврат</h3><p>Тем же расчётом: неиспользованные занятия × цена занятия минус удержание по правилу. Возврат проводится через кассу филиала с подтверждением управляющего.</p></div></div>`;
/* ====== ДЕНЬГИ ====== */
let payF='all';
SC.payments=()=>{const list=PAY.filter(p=>payF==='all'||p.st===payF);const sum=PAY.reduce((s,p)=>s+p.v,0);
 return `<div class="hd"><div><h2>Оплаты · Kaspi Pay, банк, карта</h2><p>Kaspi не отдаёт интеграцию — поэтому выписка загружается раз в день файлом, а дальше система делает то, что вы делали руками: сопоставляет платёж с родителем по имени, сумме и номеру абонемента, разносит на ученика и филиал, запускает абонемент и отправляет родителю подтверждение. Не сошлось — строка красная, администратор решает одним кликом.</p></div>
 <div class="btns"><button class="bt" onclick="act('stmt')">⇧ Загрузить выписку Kaspi</button><button class="bt" onclick="act('stmt-bank')">⇧ Выписка банка</button><button class="bt p" onclick="act('pay-new')">+ Оплата на кассе</button></div></div>
 <div class="wid"><div><small>За 3 дня · выписки</small><b class="a">${tg(sum)}</b><span>${PAY.length} платежей · Kaspi ${PAY.filter(p=>p.way==='kaspi').length}, банк ${PAY.filter(p=>p.way==='bank').length}, карта ${PAY.filter(p=>p.way==='card').length}</span></div><div><small>Разнесено автоматически</small><b class="g">${PAY.filter(p=>p.st==='matched').length}</b><span>совпали имя, сумма и абонемент</span></div><div><small>Вручную</small><b class="i">${PAY.filter(p=>p.st==='manual').length}</b><span>платёж от юрлица, разнёс администратор</span></div><div><small>Частичные</small><b class="w">${PAY.filter(p=>p.st==='partial').length}</b><span>остаток ушёл в должники с датой</span></div><div><small>Не разнесено</small><b class="r">${PAY.filter(p=>p.st==='new').length}</b><span>нет однозначного совпадения</span></div></div>
 <div class="ptabs">${[['all','Все'],['matched','Разнесено'],['partial','Частично'],['manual','Вручную'],['new','Не разнесено']].map(x=>`<button class="ptab ${payF===x[0]?'on':''}" onclick="payF='${x[0]}';render()">${x[1]}</button>`).join('')}</div>
 <div class="tw"><table class="t"><tr><th>Платёж</th><th>Дата</th><th>Способ</th><th>От кого · в выписке</th><th class="r">Сумма</th><th>Ученик</th><th>Филиал</th><th>Абонемент</th><th>Статус</th></tr><tbody>${list.map(p=>`<tr onclick="card('pay','${p.id}')"><td>${payL(p.id)}</td><td class="mono">${dd(p.d)}</td><td><span class="tag">${PW[p.way]}</span></td><td>${esc(p.from)}</td><td class="r"><b>${fmt(p.v)}</b></td><td>${p.stu?stL(p.stu):'<span class="neg">?</span>'}</td><td>${p.br?brTag(p.br):'—'}</td><td class="mini">${p.sub?esc(ST_(p.sub).n):'—'}</td><td><span class="tag ${PST[p.st][1]}">${PST[p.st][0]}</span>${p.note?`<span class="sub">${esc(p.note)}</span>`:''}</td></tr>`).join('')}</tbody></table></div>
 <div class="g2" style="margin-top:12px"><div class="pan"><h3>Как сопоставляется платёж</h3><div class="li"><i>1</i><span>Сумма равна цене типа абонемента или остатку долга ученика</span></div><div class="li"><i>2</i><span>Имя плательщика совпадает с родителем в карточке или с прошлым платежом</span></div><div class="li"><i>3</i><span>Родитель платит по ссылке Kaspi из бота — тогда в назначении есть номер абонемента, совпадение стопроцентное</span></div><div class="li w"><i>?</i><span>Ничего не совпало — строка «не разнесено», администратор выбирает ученика из подсказок, система запоминает плательщика</span></div></div>
 <div class="said"><b>Ваши слова</b><i>«Оплата пришла — она попала в систему, и сразу мы структурированно видим, куда она ушла и за какой филиал». Ежедневная выписка вместо ручного разнесения по двум системам.</i></div></div>`};

SC.recon=()=>{const r=curBr==='all'?RECON_T:RECON.find(x=>x.br===curBr);const nop=STU.filter(s=>inBr(s)&&(s.st==='nopay'||s.st==='debt'));
 return `<div class="hd"><div><h2>Сверка: ходят ↔ оплачено</h2><p>Главный экран разрыва. Слева — сколько учеников посещали за 30 дней, справа — у скольких есть действующий оплаченный абонемент. Разница раскладывается на пять причин, у каждой свой ответственный. «Требуют проверки» — это те, где посещение есть, оплаты нет и объяснения нет.</p></div>
 <div class="btns"><button class="bt" onclick="act('recon-wa')">Напомнить всем должникам</button><button class="bt p" onclick="act('recon-task')">Задачи администраторам</button></div></div>
 ${brFilter()}
 <div class="wid"><div><small>Ходят</small><b class="a">${fmt(r.att)}</b><span>посещали за 30 дней</span></div><div><small>Оплачено</small><b class="g">${fmt(r.paid)}</b><span>действующий абонемент</span></div><div><small>Разрыв</small><b class="r">${fmt(r.gap)}</b><span>${pct(r.gap,r.att)} % · ${tg(r.gap*32000)} по цене A8</span></div><div><small>Объяснимо</small><b class="w">${fmt(r.trial+r.inst+r.late)}</b><span>пробные, рассрочки, забыли продлить</span></div><div><small>Требуют проверки</small><b class="r">${fmt(r.unk+r.susp)}</b><span>оплата не найдена · без объяснения</span></div></div>
 <div class="g21"><div class="pan"><h3>Из чего состоит разрыв ${curBr==='all'?'по сети':'· '+esc(B(curBr).city)}</h3>
 ${barRow('Пробные занятия · нормально',r.trial,r.gap,'g',r.trial+' · бесплатно по правилу')}${barRow('Рассрочки · с датой остатка',r.inst,r.gap,'i',r.inst+' · бот напоминает')}${barRow('Абонемент закончился, ходят',r.late,r.gap,'w',r.late+' · задачи администраторам')}${barRow('Оплата не найдена в выписке',r.unk,r.gap,'r',r.unk+' · проверить платежи')}${barRow('Без объяснения · проверить',r.susp,r.gap,'r',r.susp+' · управляющему')}
 <div class="tw" style="margin-top:12px"><table class="t"><tr><th>Филиал</th><th class="r">Ходят</th><th class="r">Оплачено</th><th class="r">Разрыв</th><th class="r">Пробные</th><th class="r">Рассрочки</th><th class="r">Забыли</th><th class="r">Не найдено</th><th class="r">Проверить</th></tr><tbody>${RECON.filter(x=>curBr==='all'||x.br===curBr).map(x=>`<tr onclick="curBr='${x.br}';render()"><td><b>${esc(B(x.br).city)}</b><span class="sub">${esc(B(x.br).n)}</span></td><td class="r">${x.att}</td><td class="r">${x.paid}</td><td class="r ${pct(x.gap,x.att)>20?'neg':''}"><b>${x.gap}</b> · ${pct(x.gap,x.att)} %</td><td class="r">${x.trial}</td><td class="r">${x.inst}</td><td class="r">${x.late}</td><td class="r ${x.unk?'neg':''}">${x.unk}</td><td class="r ${x.susp?'neg':''}">${x.susp}</td></tr>`).join('')}</tbody></table></div></div>
 <div><div class="pan"><h3>Кто именно ходит без оплаты</h3>${nop.map(s=>`<div class="kv"><span>${stL(s.id)}<span class="sub">${esc(B(s.br).city)} · ${esc(T_(s.tr).n.split(' ')[0])} · ${(DEBT.find(d=>d.stu===s.id)||{}).kind||''}</span></span><b class="neg">${fmt(s.due)}</b></div>`).join('')}<div class="btns" style="justify-content:flex-start;margin-top:8px"><button class="bt" onclick="stF='nopay';go('students')">Весь список</button></div></div>
 <div class="hint"><b>Кто отвечает.</b> Пробные — норма. Рассрочки — бот. «Забыли продлить» — администратор филиала, задача в день окончания. «Не найдено в выписке» — финансист, проверяет платежи. «Без объяснения» — управляющий: разговор с тренером и администратором, потому что ученик ходит, а денег нет.</div></div></div>`};

SC.debts=()=>`<div class="hd"><div><h2>Должники и рассрочки</h2><p>«Родители отвечают: могу сегодня заплатить 50 тысяч, а остаток в конце месяца». Частичная оплата — нормальный сценарий: остаток фиксируется с датой, бот напоминает за два дня и в день, администратор видит, кто просрочил. Как тот бот из Эмиратов: «вы оплатили такую-то сумму, остаток такой-то, до такого-то».</p></div>
 <div class="btns"><button class="bt" onclick="act('debt-wa')">Напомнить всем</button><button class="bt p" onclick="act('inst')">+ Рассрочка</button></div></div>
 <div class="wid"><div><small>Долг по сети</small><b class="r">${tg(DEBT.reduce((s,d)=>s+d.v,0)*14)}</b><span>${DEBT.length*14} записей · выборка ниже</span></div><div><small>Рассрочки по договорённости</small><b class="i">37</b><span>с датой остатка · бот напоминает</span></div><div><small>Просрочено</small><b class="w">62</b><span>абонемент закончился, ходят</span></div><div><small>Оплата не найдена</small><b class="r">31</b><span>родитель говорит «платили» — проверить выписку</span></div><div><small>Собрано за неделю после напоминаний</small><b class="g">${tg(1840000)}</b><span>58 платежей по ссылкам бота</span></div></div>
 <div class="tw"><table class="t"><tr><th>Ученик</th><th>Филиал</th><th class="r">Остаток</th><th>До</th><th>Что это</th><th>Бот</th><th></th></tr><tbody>${DEBT.map(d=>{const s=S_(d.stu);const late=d.until<TODAY;return `<tr onclick="openSt('${s.id}')"><td>${stL(s.id)}<span class="sub">${esc(s.par)} · ${esc(s.ph)}</span></td><td>${brTag(s.br)}</td><td class="r neg"><b>${fmt(d.v)}</b></td><td class="mono ${late?'neg':''}">${dd(d.until)}${late?' · просрочен':''}</td><td class="mini">${esc(d.kind)}</td><td class="mini">${esc(d.bot)}</td><td><button class="bt" onclick="event.stopPropagation();act('debt-link','${s.id}')">Ссылка Kaspi</button></td></tr>`}).join('')}</tbody></table></div>
 <div class="g2" style="margin-top:12px"><div class="pan"><h3>Что пишет бот</h3><div class="msg out">Сауле, напоминаем: остаток 22 000 ₸ за абонемент Алины до 30.09. Оплатить Kaspi: kaspi.kz/pay/… · после оплаты пришлём подтверждение.<small>бот · 28.09 · 10:00</small></div><div class="msg in">Спасибо, внесу 29-го<small>Сауле · 28.09 · 10:14</small></div><div class="msg sys">Ответ родителя сохранён в карточке Алины · срок сдвинут на 29.09 по решению администратора</div></div>
 <div class="hint"><b>Без ИИ.</b> Бот не «продаёт» и не «звонит сам» — он отвечает на события: оплата пришла, абонемент кончается, остаток не внесён. Это проверенные сценарии, которые работают, а не хайп. Если у родителя вопрос сложнее — бот передаёт администратору с историей.</div></div>`;

SC.branchfin=()=>{const n=NET();
 return `<div class="hd"><div><h2>Деньги по филиалам</h2><p>Выручка по выписке и кассе, начисления тренерам по факту проведённых занятий, аренда и зарплата администратора — по каждому филиалу отдельно, итог по сети. Перевод ученика между филиалами двигает деньги между строками.</p></div><div class="btns"><button class="bt" onclick="act('xls')">⇩ Excel для бухгалтера</button></div></div>
 <div class="wid"><div><small>Выручка сентября · сеть</small><b class="a">${mln(n.rev)}</b><span>план ${mln(n.plan)}</span></div><div><small>Оплата тренеров · факт</small><b>${mln(n.rev*0.31)}</b><span>${pct(31,100)} % от выручки · по проведённым занятиям</span></div><div><small>Аренда и администраторы</small><b>${mln(n.rev*0.27)}</b><span>фиксированные по филиалам</span></div><div><small>Результат сети</small><b class="g">${mln(n.rev*0.42)}</b><span>до налогов и маркетинга</span></div><div><small>Переводы между филиалами</small><b class="v">${tg(140000+48750+28000)}</b><span>3 перевода за месяц</span></div></div>
 <div class="tw"><table class="t"><tr><th>Филиал</th><th class="r">Выручка</th><th class="r">Kaspi</th><th class="r">Банк</th><th class="r">Карта</th><th class="r">Тренеры · факт</th><th class="r">Аренда + админ</th><th class="r">Результат</th><th class="r">Маржа</th></tr><tbody>${BR.map(b=>{const tr=Math.round(b.rev*(b.id==='B01'?0.27:b.id==='B06'?0.36:0.31));const fix=Math.round(b.rev*(['B01','B02','B04'].includes(b.id)?0.24:0.3));const res=b.rev-tr-fix;return `<tr onclick="card('branch','${b.id}')"><td><b>${esc(b.city)}</b><span class="sub">${esc(b.n)} · ${esc(b.brand)}</span></td><td class="r"><b>${fmt(b.rev)}</b></td><td class="r">${fmt(b.rev*0.71)}</td><td class="r">${fmt(b.rev*0.11)}</td><td class="r">${fmt(b.rev*0.18)}</td><td class="r">${fmt(tr)}</td><td class="r">${fmt(fix)}</td><td class="r ${res<b.rev*0.35?'warnt':''}"><b>${fmt(res)}</b></td><td class="r">${pct(res,b.rev)} %</td></tr>`}).join('')}</tbody></table></div>
 <div class="said"><b>Ваши слова</b><i>«Пришло столько-то людей, оплатило столько-то, и вот где это упущение — а 12 филиалов работает». Здесь упущение видно по филиалу: у Шымкента тренеры стоят 36 % выручки при разрыве 25 % — туда и смотреть первым.</i></div>`};

/* ====== ТРЕНЕРЫ ====== */
SC.trainers=()=>{const list=TR.filter(t=>inBr(t));
 return `<div class="hd"><div><h2>Тренеры сети</h2><p>Выборка из 36 тренеров. По каждому: занятий по расписанию, проведено и подтверждено, не вышел, замены, болезнь, сколько учеников отметились, начисление за месяц. Красным — тот, кому платить не за что.</p></div>
 <div class="btns"><button class="bt" onclick="go('payroll')">Расчёт оплаты</button><button class="bt p" onclick="act('tr-new')">+ Тренер</button></div></div>
 ${brFilter()}
 <div class="tw"><table class="t"><tr><th>Тренер</th><th>Филиал</th><th>Направление</th><th class="r">По расписанию</th><th class="r">Проведено</th><th class="r">Не вышел</th><th class="r">Замены</th><th class="r">Болезнь</th><th class="r">Отметки учеников</th><th class="r">Ставка</th><th class="r">Начислено</th><th>Оценка</th></tr><tbody>${list.map(t=>`<tr onclick="openTr('${t.id}')"><td><b>${esc(t.n)}</b><span class="sub">${t.groups.map(g=>G_(g).n).join(', ')}</span></td><td>${brTag(t.br)}</td><td class="mini">${esc(t.spec)}</td><td class="r">${t.plan}</td><td class="r">${t.done}</td><td class="r ${t.nosh?'neg':''}">${t.nosh||'—'}</td><td class="r">${t.rep||'—'}</td><td class="r">${t.sick||'—'}</td><td class="r ${t.conf<t.done?'warnt':''}">${t.conf} / ${t.done}</td><td class="r">${fmt(t.rate)}</td><td class="r"><b>${fmt(trPay(t))}</b></td><td>${t.rating<4?'<span class="tag r">'+t.rating+'</span>':'<span class="tag g">'+t.rating+'</span>'}</td></tr>`).join('')}</tbody></table></div>`};

SC.trainer=()=>{const t=T_(curTr);const b=B(t.br);const les=LES.filter(l=>l.tr===t.id);const stus=STU.filter(s=>s.tr===t.id);
 return `<div class="hd"><div><div class="crumb"><a onclick="go('trainers')">Тренеры</a> › <b>${esc(t.n)}</b></div><h2>${esc(t.n)} ${t.nosh>=4?'<span class="tag r">не выходит</span>':'<span class="tag g">в норме</span>'}</h2><p>${esc(t.spec)} · ${brL(t.br)} · группы: ${t.groups.map(g=>grL(g)).join(', ')} · ставка ${tg(t.rate)} за занятие · оценка родителей ${t.rating}</p></div>
 <div class="btns"><button class="bt" onclick="act('wa-tr','${t.id}')">WhatsApp тренеру</button><button class="bt" onclick="act('replace','${t.id}')">Назначить замену</button><button class="bt p" onclick="act('payslip','${t.id}')">Расчётный лист</button></div></div>
 <div class="wid"><div><small>Сентябрь · по расписанию</small><b>${t.plan}</b><span>занятий</span></div><div><small>Проведено и подтверждено</small><b class="g">${t.done}</b><span>тренер + администратор</span></div><div><small>Не вышел</small><b class="${t.nosh?'r':''}">${t.nosh}</b><span>${t.nosh?'занятия не оплачиваются, родителям — извинение и перенос':'—'}</span></div><div><small>Отметки учеников</small><b class="${t.conf<t.done?'w':'g'}">${t.conf} / ${t.done}</b><span>${t.conf<t.done?'расхождение на '+(t.done-t.conf)+' занятиях':'сходится'}</span></div><div><small>Начислено</small><b class="a">${tg(trPay(t))}</b><span>${t.done} × ${fmt(t.rate)} · к выплате 5.10</span></div></div>
 ${t.nosh>=4?`<div class="note" style="--tone:var(--bad)"><b>Не вышел на ${t.nosh} занятий за две недели</b><p>Группа ${G_(t.groups[0]).n}: ${stus.length} учеников в выборке, по сети 10. Родителям ушли извинения и переносы, ученикам занятия не списаны. За эти занятия начисления нет. Решение управляющего: замена на постоянной основе или расторжение.</p></div>`:''}
 ${t.conf<t.done-3?`<div class="note" style="--tone:var(--warn)"><b>Тренер отмечает больше, чем подтверждают ученики</b><p>На ${t.done-t.conf} занятиях отметки учеников в приложении нет, администратор не подтвердил. Пока не подтверждено — занятия в расчёт не идут. Управляющему — проверить.</p></div>`:''}
 <div class="g21"><div class="pan"><h3>Занятия</h3><div class="tw"><table class="t"><tr><th>Занятие</th><th>Дата</th><th>Группа</th><th class="r">Был</th><th class="r">Нет</th><th>Администратор</th><th>Статус</th><th class="r">Начислено</th></tr><tbody>${les.length?les.map(l=>`<tr onclick="card('lesson','${l.id}')"><td>${lesL(l.id)}</td><td class="mono">${dd(l.d)} ${l.t}</td><td>${grL(l.grp)}</td><td class="r">${l.marks?l.marks.p:'—'}</td><td class="r">${l.marks?l.marks.a:'—'}</td><td>${l.st==='planned'?'—':l.adm?'✓':'<span class="neg">нет</span>'}</td><td><span class="tag ${LST[l.st][1]}">${LST[l.st][0]}</span></td><td class="r">${l.st==='done'&&l.adm?fmt(t.rate):l.st==='rep'?'<span class="mini">замене</span>':'0'}</td></tr>`).join(''):'<tr><td colspan="8" class="mini">Занятий в выборке нет.</td></tr>'}</tbody></table></div></div>
 <div><div class="pan"><h3>Как считается оплата</h3><div class="kv"><span>Ставка за занятие</span><b>${tg(t.rate)}</b></div><div class="kv"><span>Проведено и подтверждено</span><b>${t.done}</b></div><div class="kv"><span>Замены (ведёт другой)</span><b>${t.rep} → заменяющему</b></div><div class="kv"><span>Не вышел</span><b class="neg">${t.nosh} → 0 ₸</b></div><div class="kv"><span><b>К выплате</b></span><b>${tg(trPay(t))}</b></div></div>
 <div class="pan"><h3>Ученики тренера</h3>${stus.map(s=>`<div class="kv"><span>${stL(s.id)}</span><b>${stTag(s)}</b></div>`).join('')||'<p class="mini">В выборке нет.</p>'}</div></div></div>`};

SC.payroll=()=>{const list=TR.filter(t=>inBr(t));const tot=list.reduce((s,t)=>s+trPay(t),0);const lost=list.reduce((s,t)=>s+t.nosh*t.rate,0);
 return `<div class="hd"><div><h2>Оплата тренеров по факту</h2><p>«Учёт оплаты тренера: сколько я должна, за сколько часов он отработал с учеником». Начисление = ставка × занятия, которые проведены и подтверждены. Не вышел — ноль. Замена — заменяющему. Расчётный лист собирается сам к 5-му числу, тренер видит его в телефоне.</p></div>
 <div class="btns"><button class="bt" onclick="act('xls')">⇩ Ведомость</button><button class="bt p" onclick="act('payroll-close')">Закрыть сентябрь</button></div></div>
 ${brFilter()}
 <div class="wid"><div><small>К выплате · сентябрь</small><b class="a">${tg(tot)}</b><span>${list.length} тренеров в выборке${curBr==='all'?' · по сети '+mln(NET().rev*0.31):''}</span></div><div><small>Не начислено за «не вышел»</small><b class="r">${tg(lost)}</b><span>${list.reduce((s,t)=>s+t.nosh,0)} занятий</span></div><div><small>Ждут подтверждения</small><b class="w">${list.reduce((s,t)=>s+(t.done-t.conf),0)}</b><span>занятий без отметок учеников</span></div><div><small>Замены</small><b class="i">${list.reduce((s,t)=>s+t.rep,0)}</b><span>начислены заменяющим</span></div><div><small>Средняя ставка</small><b>${tg(Math.round(list.reduce((s,t)=>s+t.rate,0)/list.length))}</b><span>за занятие · по типу группы</span></div></div>
 <div class="tw"><table class="t"><tr><th>Тренер</th><th>Филиал</th><th class="r">Ставка</th><th class="r">План</th><th class="r">Проведено</th><th class="r">Не вышел</th><th class="r">Замены</th><th class="r">Подтверждено учениками</th><th class="r">Начислено</th><th class="r">Не начислено</th></tr><tbody>${list.map(t=>`<tr onclick="openTr('${t.id}')"><td><b>${esc(t.n)}</b></td><td>${brTag(t.br)}</td><td class="r">${fmt(t.rate)}</td><td class="r">${t.plan}</td><td class="r">${t.done}</td><td class="r ${t.nosh?'neg':''}">${t.nosh||'—'}</td><td class="r">${t.rep||'—'}</td><td class="r ${t.conf<t.done?'warnt':''}">${t.conf}</td><td class="r"><b>${fmt(trPay(t))}</b></td><td class="r ${t.nosh?'neg':''}">${t.nosh?fmt(t.nosh*t.rate):'—'}</td></tr>`).join('')}<tr class="total"><td>Итого</td><td></td><td></td><td class="r">${list.reduce((s,t)=>s+t.plan,0)}</td><td class="r">${list.reduce((s,t)=>s+t.done,0)}</td><td class="r">${list.reduce((s,t)=>s+t.nosh,0)}</td><td class="r">${list.reduce((s,t)=>s+t.rep,0)}</td><td class="r">${list.reduce((s,t)=>s+t.conf,0)}</td><td class="r">${fmt(tot)}</td><td class="r">${fmt(lost)}</td></tr></tbody></table></div>
 <div class="said"><b>Ваши слова</b><i>«Он уехал в отпуск, жена бросила, а я не видела — за что я плачу зарплату этому человеку, если его не было?» Здесь не выйти незаметно нельзя: занятие без отметки через два часа — сигнал тренеру и управляющему, без подтверждения — ноль в расчёте.</i></div>`};

SC.control=()=>{const bad=LES.filter(l=>l.st==='nosh'||l.st==='rep'||(l.st==='done'&&!l.adm));
 return `<div class="hd"><div><h2>Контроль: не вышел, замена, расхождения</h2><p>«А если тренер мошенник — как я могу контролировать?» Три независимых отметки на каждое занятие и три типа сигналов. Сигнал уходит управляющему филиала и руководителю сети в день события, а не в конце месяца.</p></div><div class="btns"><button class="bt p" onclick="go('attendance')">Журнал</button></div></div>
 <div class="g3"><div class="pan"><h3>Тренер не вышел</h3><p>Занятие по расписанию, отметок нет, администратор поставил «не проведено». Родителям — извинение и перенос, ученикам занятие не списано, тренеру — ноль. Четыре раза за две недели — красная карточка тренера.</p></div><div class="pan"><h3>Замена</h3><p>Заменяющий отмечает занятие под своим именем. Начисление идёт ему, у основного тренера — «замена», не «не вышел». Родители видят, кто вёл.</p></div><div class="pan"><h3>Отметки не сходятся</h3><p>Тренер отметил девять, ученики в приложении — трое, администратор не подтвердил. Занятие «на проверке», в расчёт не идёт, управляющий разбирается.</p></div></div>
 <div class="tw"><table class="t"><tr><th>Занятие</th><th>Дата</th><th>Филиал</th><th>Тренер</th><th>Группа</th><th>Что не так</th><th>Действие</th></tr><tbody>${bad.map(l=>`<tr onclick="card('lesson','${l.id}')"><td>${lesL(l.id)}</td><td class="mono">${dd(l.d)} ${l.t}</td><td>${brTag(l.br)}</td><td>${trL(l.tr)}</td><td>${grL(l.grp)}</td><td><span class="tag ${LST[l.st][1]}">${LST[l.st][0]}</span>${l.note?`<span class="sub">${esc(l.note)}</span>`:l.st==='done'&&!l.adm?'<span class="sub">не подтверждено администратором</span>':''}</td><td>${l.st==='nosh'?'<span class="mini">перенос, замена, 0 ₸</span>':l.st==='rep'?'<span class="mini">начислено заменяющему</span>':'<span class="mini">на проверке управляющего</span>'}</td></tr>`).join('')}</tbody></table></div>
 <div class="g2" style="margin-top:12px"><div class="hint"><b>Сигналы по сети за сентябрь.</b> Не вышли: 11 занятий у 3 тренеров. Замены: 9. Расхождения отметок: 14 занятий, из них 9 подтверждены после проверки, 5 сняты с расчёта.</div><div class="said"><b>Ваши слова</b><i>«У Умай хорошо: каждый тренер вносит сам. А если тренер мошенник? Как я могу контролировать?» Поэтому отметка тренера здесь — только одна из трёх.</i></div></div>`};
/* ====== РАСПИСАНИЕ ====== */
SC.schedule=()=>{const b=curBr==='all'?'B01':curBr;const gs=GRP.filter(g=>g.br===b);const days=['пн','вт','ср','чт','пт','сб'];const hours=[...new Set(gs.flatMap(g=>[...g.days.matchAll(/\d\d:\d\d/g)].map(m=>m[0])))].sort();
 const cell=(d,h)=>{const hits=gs.filter(g=>{const dz=g.days.replace(/\s/g,'');const ds=dz.split(',').map(x=>x.replace(/\d\d:\d\d$/,'').split('·'));const times=[...g.days.matchAll(/\d\d:\d\d/g)].map(m=>m[0]);const parts=g.days.split(',');return parts.some(p=>{const t=(p.match(/\d\d:\d\d/)||[])[0];const dd_=p.replace(/\d\d:\d\d/,'').split('·').map(x=>x.trim());return t===h&&dd_.includes(d)})});
  return hits.map(g=>{const t=T_(g.tr);const bad=t.nosh>=4;return `<div class="scell ${bad?'bad':''}" onclick="card('group','${g.id}')"><b>${esc(g.n)}</b><span>${esc(t.n.split(' ')[0])} · ${esc(g.hall)}</span>${bad?'<i>тренер не выходит</i>':''}</div>`}).join('')};
 return `<div class="hd"><div><h2>Расписание · ${esc(B(b).city)}, ${esc(B(b).n)}</h2><p>Сетка залов и групп филиала на неделю. Из расписания рождаются занятия: каждое занятие — строка в журнале, отметка тренера, списание у учеников, начисление. Пустая клетка — свободный зал, красная — тренер, который не выходит.</p></div>
 <div class="btns"><button class="bt" onclick="act('sched-add')">+ Группа в сетку</button><button class="bt p" onclick="go('attendance')">Журнал занятий</button></div></div>
 ${brFilter()}
 <div class="tw"><table class="t sched"><tr><th>Время</th>${days.map(d=>`<th>${d} ${dd(addDays('2026-09-21',days.indexOf(d)))}</th>`).join('')}</tr><tbody>${hours.map(h=>`<tr><td class="mono"><b>${h}</b></td>${days.map(d=>`<td>${cell(d,h)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
 <div class="g3" style="margin-top:12px"><div class="pan"><h3>Залы филиала</h3><div class="kv"><span>Зал 1 · 120 м²</span><b>занят 68 %</b></div><div class="kv"><span>Зал 2 · 80 м²</span><b>занят 54 %</b></div><p class="mini" style="margin-top:6px">Утро свободно — окно для групп «мамы» и индивидуальных.</p></div><div class="pan"><h3>Индивидуальные и подготовка к турнирам</h3><p>Отдельная запись в сетке с другой ставкой тренера. Ученик покупает пакет индивидуальных занятий — списание и начисление считаются так же, по факту.</p></div><div class="pan"><h3>Перенос занятия</h3><p>Тренер не вышел — занятие переносится на свободный слот, родителям уходит сообщение, у учеников занятие не списывается.</p></div></div>`};

SC.groups=()=>{const list=GRP.filter(g=>inBr(g));
 return `<div class="hd"><div><h2>Группы и направления</h2><p>Группа — это тренер, дни, зал и список учеников. Заполненность и оплаты видны по каждой группе: где мест нет — открывать вторую, где полгруппы без оплаты — разбираться.</p></div><div class="btns"><button class="bt p" onclick="act('group-new')">+ Группа</button></div></div>
 ${brFilter()}
 <div class="tw"><table class="t"><tr><th>Группа</th><th>Филиал</th><th>Тренер</th><th>Дни</th><th>Зал</th><th class="r">Мест</th><th class="r">Учеников</th><th class="r">С оплатой</th><th class="r">Без оплаты</th><th>Заполненность</th></tr><tbody>${list.map(g=>{const stu=STU.filter(s=>s.grp===g.id);const n=g.size-Math.round(g.size*0.12)-(g.id==='G-03'?3:0);const paid=n-Math.round(n*(g.br==='B06'?0.25:0.15));return `<tr onclick="card('group','${g.id}')"><td><b>${esc(g.n)}</b><span class="sub">${stu.length?'в выборке: '+stu.map(s=>s.n.split(' ')[0]).join(', '):''}</span></td><td>${brTag(g.br)}</td><td>${trL(g.tr)}</td><td class="mini">${esc(g.days)}</td><td>${esc(g.hall)}</td><td class="r">${g.size}</td><td class="r">${n}</td><td class="r">${paid}</td><td class="r ${n-paid>2?'neg':''}">${n-paid}</td><td><div class="bar" style="width:100px"><i class="${n>=g.size*0.9?'g':n>=g.size*0.7?'':'w'}" style="--w:${pct(n,g.size)}%"></i></div></td></tr>`}).join('')}</tbody></table></div>
 <div class="g2" style="margin-top:12px"><div class="pan"><h3>Направления сети</h3>${[['Латина · дети',312],['Стандарт · дети',218],['Спорт · юниоры',186],['Мамы · фитнес',124],['Взрослые · социальные',96],['Индивидуальные',76]].map(x=>barRow(x[0],x[1],312,'',x[1]+' уч.')).join('')}</div><div class="hint"><b>Бренды в одной системе.</b> Grand Dance, Ритм, Pas de Deux, Танцуй — разные вывески, разные цены, один список направлений и одни правила абонементов. Родитель видит бренд своего филиала, руководитель — всю сеть.</div></div>`};

/* ====== ПРОДАЖИ ====== */
let funBr='all';
SC.funnel=()=>{const leads=LEADS.filter(l=>funBr==='all'||l.br===funBr);const cnt=k=>leads.filter(l=>l.k===k).length;const NETF={new:64,call:48,trial:37,came:26,sub:19};
 return `<div class="hd"><div><h2>Воронка: заявка → пробное → абонемент</h2><p>Каждая заявка из Instagram, 2ГИС, Facebook и WhatsApp попадает сюда с указанием филиала и объявления. Карточка двигается по этапам, на каждом этапе — бот и задача администратору. Итог — абонемент и оплата, а не «позвонили и забыли».</p></div>
 <div class="btns"><button class="bt" onclick="go('inbox')">Входящие</button><button class="bt p" onclick="act('lead-new')">+ Заявка</button></div></div>
 <div class="ptabs"><button class="ptab ${funBr==='all'?'on':''}" onclick="funBr='all';render()">Вся сеть</button>${BR.slice(0,6).map(b=>`<button class="ptab ${funBr===b.id?'on':''}" onclick="funBr='${b.id}';render()">${esc(b.city)}${b.city==='Алматы'||b.city==='Астана'?' · '+esc(b.n.split(' ')[0]):''}</button>`).join('')}<button class="ptab" onclick="funBr='B11';render()">Усть-Каменогорск</button></div>
 <div class="wid"><div><small>Заявок за неделю</small><b class="a">64</b><span>по сети · 8 в выборке</span></div><div><small>Связались до 15 минут</small><b class="g">48</b><span>бот + администратор · 75 %</span></div><div><small>Пробное назначено</small><b>37</b><span>58 % от заявок</span></div><div><small>Пришли</small><b class="w">26</b><span>70 % от назначенных</span></div><div><small>Абонемент</small><b class="g">19</b><span>73 % от пришедших · ${tg(19*34000)}</span></div></div>
 <div class="pipe">${FUN.map(f=>`<div class="pcol"><div class="phead" style="background:${f.c}"><b>${esc(f.n)}</b><span>${cnt(f.k)} · сеть ${NETF[f.k]}</span></div><div class="pbody">${leads.filter(l=>l.k===f.k).map(l=>`<div class="lead" onclick="card('lead','${l.id}')"><b>${esc(l.n)}</b><span>${esc(l.par)} · ${esc(B(l.br).city)}</span><small>${esc(l.src)} · ${dd(l.d)}</small><em>${esc(l.next)}</em></div>`).join('')||'<div class="mini" style="padding:8px">—</div>'}</div></div>`).join('')}</div>
 <div class="g2" style="margin-top:12px"><div class="said"><b>Ваши слова</b><i>«Написал человек с 2ГИС и параллельно написал человек с Instagram — куда она ушла, это объявление, какая привязка?» Здесь у каждой заявки виден канал, объявление и филиал, а пробник превращается в ученика одной кнопкой — с историей переписки.</i></div><div class="hint"><b>Кто двигает карточку.</b> Бот — с «заявки» на «связались» (ответил в течение минуты). Администратор — на «пробное назначено». Тренер отметкой — на «пришёл». Оплата из выписки — на «абонемент». Руководитель видит, где заявки застревают.</div></div>`};

SC.inbox=()=>`<div class="hd"><div><h2>Входящие: WhatsApp, Instagram, 2ГИС, Facebook</h2><p>Один экран для всех каналов всех филиалов. Бот отвечает на типовые вопросы сразу — цена, расписание, адрес, запись на пробное. Сложные вопросы — администратору с историей. Каждый диалог привязан к заявке или ученику.</p></div>
 <div class="btns"><button class="bt" onclick="go('bots')">Сценарии бота</button><button class="bt p" onclick="act('reply')">Ответить</button></div></div>
 <div class="wid"><div><small>Сегодня</small><b class="a">118</b><span>сообщений по сети</span></div><div><small>Ответил бот</small><b class="g">71</b><span>60 % · цена, расписание, запись</span></div><div><small>Ждут администратора</small><b class="w">9</b><span>дольше 15 минут — 2</span></div><div><small>Каналы</small><b style="font-size:14px">WA 58 · IG 34 · 2ГИС 19 · FB 7</b><span>на 12 номеров филиалов</span></div></div>
 <div class="g21"><div class="pan"><h3>Диалоги · утро 24.09</h3>${INBOX.map(x=>`<div class="srow" onclick="${x.lead?`card('lead','${x.lead}')`:`openSt('${x.stu}')`}"><div><b>${esc(x.who)}</b> <span class="tag">${esc(x.ch)}</span><span class="mini"> · ${x.t}</span><p style="margin:4px 0 0">${esc(x.m)}</p>${x.ans?`<p class="mini" style="margin:4px 0 0;color:var(--ok)">${esc(x.ans)}</p>`:'<p class="mini" style="margin:4px 0 0;color:var(--bad)">ждёт администратора</p>'}</div><span class="tag ${x.bot?'g':'w'}">${x.bot?'бот ответил':'администратор'}</span></div>`).join('')}</div>
 <div><div class="pan"><h3>Что бот отвечает сам</h3><div class="li"><i>✓</i><span>Цены по типам абонементов филиала</span></div><div class="li"><i>✓</i><span>Расписание группы по возрасту</span></div><div class="li"><i>✓</i><span>Адрес, как добраться, что взять</span></div><div class="li"><i>✓</i><span>Запись на пробное с выбором даты</span></div><div class="li"><i>✓</i><span>Остаток занятий и оплат по ребёнку — родителю</span></div><div class="li w"><i>→</i><span>Жалоба, спор по оплате, перевод — администратору</span></div></div>
 <div class="pan"><h3>Почему не «звонящий ИИ»</h3><p>Вы правильно сказали: сначала техническая база. Бот отвечает на события по правилам, которые вы утвердили. Когда база собрана, можно добавлять голос и умные сценарии — на готовые данные, а не вместо них.</p></div></div></div>`;

SC.bots=()=>`<div class="hd"><div><h2>Боты по этапам и оплатам</h2><p>Девять сценариев, которые закрывают ручную работу администраторов: ответ на заявку, напоминание о пробном, продажа после пробного, подтверждение оплаты, напоминание об остатке, продление, сигналы тренеру и управляющему, утренняя сводка руководителю. Тексты ваши — меняются без программиста.</p></div>
 <div class="btns"><button class="bt p" onclick="act('bot-new')">+ Сценарий</button></div></div>
 <div class="tw"><table class="t"><tr><th>Событие</th><th>Кому</th><th>Текст сообщения</th><th class="r">За месяц</th><th>Вкл.</th></tr><tbody>${BOTS.map((b,i)=>`<tr onclick="card('bot','${i}')"><td><b>${esc(b.ev)}</b></td><td><span class="tag">${esc(b.to)}</span></td><td class="mini">${esc(b.txt)}</td><td class="r">${[248,164,142,690,118,306,84,37,30][i]}</td><td><button class="bt ${b.on?'p':''}" onclick="event.stopPropagation();act('bot-toggle','${i}')">${b.on?'вкл':'выкл'}</button></td></tr>`).join('')}</tbody></table></div>
 <div class="g2" style="margin-top:12px"><div class="pan"><h3>Пример: остаток по рассрочке</h3><div class="msg out">Сауле, напоминаем: остаток 22 000 ₸ за абонемент Алины до 30.09. Оплатить Kaspi: kaspi.kz/pay/… · после оплаты пришлём подтверждение.<small>бот · 28.09 · 10:00</small></div><div class="msg out">Оплата 22 000 ₸ получена 29.09. Абонемент «12 занятий» действует до 02.10, осталось 5 занятий. Спасибо!<small>бот · 29.09 · 18:40 · после загрузки выписки</small></div></div>
 <div class="said"><b>Ваши слова</b><i>«В Эмиратах: вы оплатили такую-то сумму, остаток такой-то, до такого-то — они всё в боте подтверждают, это очень удобно». Ровно этот сценарий: подтверждение оплаты, остаток, срок, ссылка.</i></div></div>`;

SC.trial=()=>`<div class="hd"><div><h2>Пробные занятия</h2><p>Пробное — бесплатное занятие с типом «AT», поэтому в сверке оно объяснимая часть разрыва. Напоминание за день, отметка тренера «пришёл», после занятия — сообщение с ценой и ссылкой. Не пришёл — бот предлагает другую дату.</p></div>
 <div class="btns"><button class="bt" onclick="act('trial-remind')">Напомнить завтрашним</button><button class="bt p" onclick="act('trial-new')">+ Пробное</button></div></div>
 <div class="wid"><div><small>За 30 дней</small><b class="a">148</b><span>пробных назначено по сети</span></div><div><small>Пришли</small><b>104</b><span>70 %</span></div><div><small>Купили абонемент</small><b class="g">74</b><span>71 % от пришедших · 50 % от назначенных</span></div><div><small>Не пришли</small><b class="r">44</b><span>бот перенёс 27, 17 потеряны</span></div><div><small>Лучший тренер по конверсии</small><b style="font-size:14px">Елена Ким · 86 %</b><span>Аль-Фараби 77</span></div></div>
 <div class="tw"><table class="t"><tr><th>Кто</th><th>Филиал</th><th>Дата</th><th>Тренер</th><th>Источник</th><th>Статус</th><th>Результат</th><th></th></tr><tbody>${TRIALS.map((t,i)=>`<tr><td><b>${esc(t.stu)}</b></td><td>${brTag(t.br)}</td><td class="mono">${dd(t.d)} ${t.t}</td><td>${trL(t.tr)}</td><td class="mini">${esc(t.src)}</td><td><span class="tag ${TRST[t.st][1]}">${TRST[t.st][0]}</span></td><td class="mini">${esc(t.res)}</td><td>${t.st==='came'?`<button class="bt p" onclick="act('trial-offer','${i}')">Предложить абонемент</button>`:t.st==='today'?`<button class="bt" onclick="act('trial-mark','${i}')">Отметить</button>`:''}</td></tr>`).join('')}</tbody></table></div>
 <div class="g2" style="margin-top:12px"><div class="pan"><h3>Конверсия пробных по филиалам</h3>${BR.slice(0,6).map(b=>barRow(b.city+' · '+b.n.split(' ')[0],[74,78,61,70,68,52][BR.indexOf(b)],100,[74,78,61,70,68,52][BR.indexOf(b)]<60?'r':'g',[74,78,61,70,68,52][BR.indexOf(b)]+' %')).join('')}</div><div class="hint"><b>Шымкент 52 %.</b> Половина пришедших на пробное не покупает — при разрыве 25 % в сверке. Смотреть тренера и администратора филиала, а не рекламу.</div></div>`;

/* ====== ФИЛИАЛЫ ====== */
SC.branches=()=>`<div class="hd"><div><h2>Филиалы и бренды</h2><p>12 филиалов в 9 городах под четырьмя вывесками. У каждого — управляющий, залы, тренеры, свой номер WhatsApp и карточка 2ГИС, свои цены, если нужно. Всё остальное общее: правила абонементов, сценарии бота, отчёты.</p></div>
 <div class="btns"><button class="bt p" onclick="act('br-new')">+ Филиал</button></div></div>
 <div class="bgrid">${BR.map(b=>`<div class="bcard" onclick="card('branch','${b.id}')" style="--c:${b.c}"><div class="bhead"><b>${esc(b.city)}</b><span class="tag" style="background:${b.c}18;color:${b.c}">${esc(b.brand)}</span></div><p>${esc(b.n)} · управляющий ${esc(b.mgr)}</p><div class="kv"><span>Ходят / оплачено</span><b>${b.st} / ${b.pay}</b></div><div class="kv"><span>Выручка</span><b>${fmt(b.rev)} · ${pct(b.rev,b.plan)} %</b></div><div class="kv"><span>Тренеры · группы</span><b>${b.tr} · ${Math.round(b.tr*1.6)}</b></div><div class="bar" style="margin-top:6px"><i class="${b.rev>=b.plan*0.95?'g':b.rev>=b.plan*0.85?'w':'r'}" style="--w:${Math.min(100,pct(b.rev,b.plan))}%"></i></div></div>`).join('')}</div>
 <div class="g3" style="margin-top:12px"><div class="pan"><h3>Общее для сети</h3><div class="li"><i>✓</i><span>Типы абонементов и правила</span></div><div class="li"><i>✓</i><span>Сценарии бота и тексты</span></div><div class="li"><i>✓</i><span>Отчёты, сверка, аналитика</span></div><div class="li"><i>✓</i><span>База учеников — перевод без потери истории</span></div></div><div class="pan"><h3>Своё у филиала</h3><div class="li"><i>✓</i><span>Номер WhatsApp и Instagram, карточка 2ГИС</span></div><div class="li"><i>✓</i><span>Цены, если отличаются</span></div><div class="li"><i>✓</i><span>Залы, расписание, тренеры</span></div><div class="li"><i>✓</i><span>Управляющий и администраторы со своими правами</span></div></div><div class="pan"><h3>Новый филиал</h3><p>Открывается за час: адрес, бренд, залы, управляющий. Правила и боты подхватываются автоматически. Тринадцатый филиал — та же система, без доплаты за «ещё один аккаунт».</p></div></div>`;

SC.roles=()=>{const secs=SEC;return `<div class="hd"><div><h2>Роли и права</h2><p>Кто что видит. Тренер видит только свои группы и свои начисления. Администратор — свой филиал без зарплат тренеров. Управляющий — свой филиал целиком. Финансист — деньги по сети. Руководитель — всё. Переключите роль в правом верхнем углу — экран перестроится.</p></div></div>
 <div class="tw"><table class="t roles"><tr><th>Раздел</th>${Object.keys(ROLES).map(k=>`<th>${esc(k)}</th>`).join('')}</tr><tbody>${secs.map(s=>s.sub.map((x,i)=>`<tr><td>${i===0?`<b>${esc(s.n)}</b> · `:''}${esc(x[1])}</td>${Object.values(ROLES).map(r=>`<td class="c">${r.s.includes(x[0])?'<span class="dot on"></span>':'<span class="dot"></span>'}</td>`).join('')}</tr>`).join('')).join('')}</tbody></table></div>
 <div class="g2" style="margin-top:12px"><div class="pan"><h3>Что ещё ограничивается</h3><div class="li"><i>✓</i><span>Управляющий видит только свой филиал — фильтр по филиалу зашит в роль</span></div><div class="li"><i>✓</i><span>Администратор не может удалить оплату — только пометить «ошибка» с комментарием, руководитель видит</span></div><div class="li"><i>✓</i><span>Тренер не может отметить чужое занятие и не видит телефоны родителей</span></div><div class="li"><i>✓</i><span>Каждое действие пишется в журнал: кто, когда, что изменил</span></div></div><div class="said"><b>Ваши слова</b><i>«Умай — у каждого тренера свой вход, и каждый вносит сам. А если тренер мошенник?» Здесь тренер вносит только отметки, а деньги и абонементы — не его зона.</i></div></div>`};

SC.parent=()=>{const s=S_('S-01');const t=ST_(s.sub);
 return `<div class="hd"><div><h2>Кабинет родителя · телефон</h2><p>Родитель открывает ссылку из WhatsApp — без установки приложения. Видит абонемент ребёнка, остаток занятий, посещения, оплаты и остаток к оплате. Оплачивает Kaspi по кнопке, отмечает болезнь, пишет администратору. Ответы «сколько осталось занятий» перестают занимать администратора.</p></div><div class="btns"><button class="bt p" onclick="act('parent-link')">Отправить ссылку родителю</button></div></div>
 <div class="g2"><div class="phone"><div class="pbar"><b>ТАКТ · Grand Dance</b><span>Розыбакиева 247</span></div><div class="pin"><div class="pcard"><small>Амина Сейткали · 7 лет</small><b>${esc(t.n)}</b><span>до ${dl(s.end)} · осталось ${subLeft(s)} занятия</span><div class="bar" style="margin-top:8px"><i class="g" style="--w:${pct(s.used,t.les)}%"></i></div></div>
 <div class="pcard"><small>Оплаты</small><div class="kv"><span>01.09 · Kaspi</span><b>32 000 ₸</b></div><div class="kv"><span>К оплате</span><b class="pos">0 ₸</b></div><button class="bt p" style="width:100%;margin-top:6px" onclick="act('parent-pay')">Продлить · 32 000 ₸ Kaspi</button></div>
 <div class="pcard"><small>Посещения · сентябрь</small>${[['23.09','был'],['21.09','был'],['19.09','пропуск · перенос'],['17.09','был'],['15.09','был'],['12.09','был'],['10.09','был']].map(x=>`<div class="kv"><span>${x[0]} · пн ср пт 17:00</span><b class="${x[1]==='был'?'pos':'warnt'}">${x[1]}</b></div>`).join('')}</div>
 <div class="pcard"><small>Действия</small><div class="btns" style="justify-content:flex-start;flex-wrap:wrap"><button class="bt" onclick="act('parent-sick')">Болеем · справка</button><button class="bt" onclick="act('parent-freeze')">Заморозка</button><button class="bt" onclick="act('parent-msg')">Написать администратору</button></div></div>
 <div class="pcard"><small>Сообщения</small><div class="msg out">У Амины осталось 2 занятия по абонементу. Продлить на тех же условиях: kaspi.kz/pay/… Дни группы сохраняются.<small>бот · 24.09 · 09:00</small></div></div></div></div>
 <div><div class="pan"><h3>Что это даёт сети</h3><div class="li"><i>1</i><span>Продление в один клик по ссылке Kaspi — платёж приходит с номером абонемента, разносится автоматически</span></div><div class="li"><i>2</i><span>Справка о болезни загружается родителем — заморозка ставится по правилу, спора «а мы болели» нет</span></div><div class="li"><i>3</i><span>Родитель сам видит посещения — исчезает «а мы ходили, почему списали»</span></div><div class="li"><i>4</i><span>Отзыв после занятия — оценка тренера, которую видит руководитель</span></div></div>
 <div class="pan"><h3>Отметка ученика на занятии</h3><p>В зале QR-код: ученик или родитель сканирует — отметка «пришёл» с точным временем. Это третья, независимая отметка. Для малышей отмечает администратор на ресепшене одним касанием.</p></div>
 <div class="said"><b>Ваши слова</b><i>«Нет привязки к Kaspi, нет каких-то моментов отметить вовремя учеников, допустим, в приложении». Здесь отметка в приложении — третья, независимая от тренера и администратора.</i></div></div></div>`};
/* ====== ОТЧЁТЫ ====== */
SC.analytics=()=>{const mx=Math.max(...MONTHS.map(m=>m[1]));
 return `<div class="hd"><div><h2>Аналитика сети</h2><p>Полгода по сети: сколько ходят, сколько оплачено, выручка. Источники заявок с конверсией до абонемента — чтобы маркетолог платил за то, что приводит учеников, а не за клики.</p></div><div class="btns"><button class="bt" onclick="act('xls')">⇩ Excel</button></div></div>
 <div class="wid"><div><small>Учеников · сентябрь</small><b class="a">${fmt(NET().st)}</b><span>+22 % к августу · сезон</span></div><div><small>Оплачено</small><b class="g">${fmt(NET().pay)}</b><span>${pct(NET().pay,NET().st)} % · цель 90 %</span></div><div><small>Выручка</small><b>${mln(NET().rev)}</b><span>план ${mln(NET().plan)} · ${pct(NET().rev,NET().plan)} %</span></div><div><small>Средний чек</small><b>${tg(32100)}</b><span>по всем типам</span></div><div><small>Стоимость заявки</small><b>${tg(2140)}</b><span>ученика — ${tg(11300)}</span></div></div>
 <div class="g2"><div class="pan"><h3>Ходят · оплачено · по месяцам</h3><div class="tw"><table class="t"><tr><th>Месяц</th><th class="r">Ходят</th><th class="r">Оплачено</th><th class="r">Разрыв</th><th></th><th class="r">Выручка</th></tr><tbody>${MONTHS.map(m=>`<tr><td><b>${m[0]}</b></td><td class="r">${m[1]}</td><td class="r">${m[2]}</td><td class="r ${pct(m[1]-m[2],m[1])>20?'neg':''}">${m[1]-m[2]} · ${pct(m[1]-m[2],m[1])} %</td><td><div class="bar" style="width:120px"><i class="g" style="--w:${pct(m[2],mx)}%"></i></div></td><td class="r">${m[3].toString().replace('.',',')} млн</td></tr>`).join('')}</tbody></table></div><p class="mini" style="margin-top:6px">Июль — провал сезона: 15,9 млн. Летние интенсивы и годовые абонементы со скидкой закрывают яму — это видно заранее.</p></div>
 <div class="pan"><h3>Источники · 30 дней</h3><div class="tw"><table class="t"><tr><th>Источник</th><th class="r">Заявок</th><th class="r">Пробных</th><th class="r">Абонементов</th><th class="r">Конверсия</th><th>Что работает</th></tr><tbody>${SRC.map(s=>`<tr><td><b>${esc(s[0])}</b></td><td class="r">${s[1]}</td><td class="r">${s[2]}</td><td class="r">${s[3]}</td><td class="r ${pct(s[3],s[1])<25?'warnt':'pos'}">${pct(s[3],s[1])} %</td><td class="mini">${esc(s[4])}</td></tr>`).join('')}<tr class="total"><td>Итого</td><td class="r">${SRC.reduce((a,s)=>a+s[1],0)}</td><td class="r">${SRC.reduce((a,s)=>a+s[2],0)}</td><td class="r">${SRC.reduce((a,s)=>a+s[3],0)}</td><td class="r">${pct(SRC.reduce((a,s)=>a+s[3],0),SRC.reduce((a,s)=>a+s[1],0))} %</td><td></td></tr></tbody></table></div></div></div>
 <div class="g3" style="margin-top:12px"><div class="pan"><h3>По филиалам</h3>${BR.slice(0,6).map(b=>barRow(b.city+' · '+b.n.split(' ')[0],b.rev,4300000,b.rev>=b.plan*0.95?'g':'w',mln(b.rev))).join('')}</div><div class="pan"><h3>По типам абонементов</h3>${[['8 занятий',412,13.2],['12 занятий',238,10.0],['Безлимит',64,3.5],['24 · 3 месяца',96,2.5],['Годовой',58,1.4],['Мамы',86,2.1]].map(x=>barRow(x[0],x[1],412,'',x[1]+' · '+x[2].toString().replace('.',',')+' млн')).join('')}</div><div class="pan"><h3>Возраст</h3>${[['5–7',286],['8–10',312],['11–13',198],['14–17',96],['взрослые',120]].map(x=>barRow(x[0],x[1],312,'',x[1])).join('')}</div></div>`};

SC.churn=()=>{const tot=CHURN.reduce((a,c)=>a+c[1],0);
 return `<div class="hd"><div><h2>Продления и отток</h2><p>Абонемент кончается — что происходит дальше. Продлили вовремя, продлили после напоминания, ушли. Ушедшие раскладываются по причинам и тренерам: отток — это не «сезон», а конкретный филиал и конкретная группа.</p></div><div class="btns"><button class="bt" onclick="act('churn-wa')">Вернуть ушедших · рассылка</button></div></div>
 <div class="wid"><div><small>Абонементов закончилось · 30 дней</small><b class="a">${fmt(tot)}</b><span>по сети</span></div><div><small>Продлили</small><b class="g">${pct(CHURN[0][1]+CHURN[1][1]+CHURN[2][1],tot)} %</b><span>${CHURN[0][1]+CHURN[1][1]+CHURN[2][1]} · из них после бота ${CHURN[2][1]}</span></div><div><small>Ушли</small><b class="r">${pct(CHURN[3][1]+CHURN[4][1],tot)} %</b><span>${CHURN[3][1]+CHURN[4][1]} · ${tg((CHURN[3][1]+CHURN[4][1])*32000)} в месяц</span></div><div><small>Истекают до 30.09</small><b class="w">84</b><span>напомнили 79 · оплатили 23</span></div><div><small>Средняя жизнь ученика</small><b>7,4 мес.</b><span>годовой — 14+</span></div></div>
 <div class="g2"><div class="pan"><h3>Что случилось с ${fmt(tot)} абонементами</h3>${CHURN.map(c=>barRow(c[0],c[1],tot,c[0].startsWith('Ушли')?'r':c[0].includes('бота')?'i':'g',c[1]+' · '+c[2]+' %')).join('')}</div>
 <div class="pan"><h3>Ушли после первого абонемента · причины</h3>${[['Тренер не понравился / менялся',31,'Розыбакиева G-03, Шымкент G-09'],['Не подошло время',22,'нет вечерних групп 5–7 в Астане'],['Дорого · нет рассрочки',14,'предложить 8 вместо 12'],['Переезд',9,'—'],['Не ответили на напоминание',12,'бот + звонок администратора']].map(x=>`<div class="kv"><span>${esc(x[0])}<span class="sub">${esc(x[2])}</span></span><b>${x[1]}</b></div>`).join('')}</div></div>
 <div class="g2" style="margin-top:12px"><div class="pan"><h3>Истекают на этой неделе · выборка</h3><div class="tw"><table class="t"><tr><th>Ученик</th><th>Филиал</th><th>Абонемент</th><th>До</th><th class="r">Осталось</th><th>Бот</th><th></th></tr><tbody>${STU.filter(s=>s.st==='exp'||(s.st==='ok'&&daysLeft(s)<=8)).map(s=>`<tr onclick="openSt('${s.id}')"><td>${stL(s.id)}</td><td>${brTag(s.br)}</td><td class="mini">${esc(ST_(s.sub).n)}</td><td class="mono">${dd(s.end)}</td><td class="r">${subLeft(s)}</td><td class="mini">${PAY.find(p=>p.stu===s.id&&p.note&&p.note.startsWith('продление'))?'<span class="pos">продлил ✓</span>':'напоминание отправлено'}</td><td><button class="bt" onclick="event.stopPropagation();act('renew','${s.id}')">Ссылка Kaspi</button></td></tr>`).join('')}</tbody></table></div></div>
 <div class="said"><b>Ваши слова</b><i>«Пришло столько-то людей, оплатило столько-то, и вот где это упущение». Здесь по каждому ушедшему — филиал, тренер, причина и последнее сообщение. И список тех, кто истекает завтра, чтобы уход не случился.</i></div></div>`};

/* ====== СИСТЕМА ====== */
SC.integr=()=>`<div class="hd"><div><h2>Kaspi, WhatsApp, Instagram, 2ГИС</h2><p>Честно про интеграции: что подключается напрямую, что через выписку, что руками. Kaspi для ИП интеграцию не даёт — поэтому строим вокруг ежедневной выписки и ссылок на оплату, а не ждём API.</p></div></div>
 <div class="ogrid">${[
 ['Kaspi Pay · выписка','через файл · раз в день','Администратор или финансист выгружает выписку из Kaspi Pay и загружает в систему. Платежи сопоставляются с родителями по имени, сумме и номеру абонемента; ссылки из бота дают стопроцентное совпадение. Прямого API у Kaspi для ИП нет — это ограничение Kaspi, а не системы.','g'],
 ['Kaspi · ссылки на оплату','да','Бот отправляет родителю ссылку с суммой и назначением «абонемент A8 · Амина · Розыбакиева». Родитель платит в приложении Kaspi — в выписке платёж приходит с назначением, разносится сам.','g'],
 ['Банк · выписка','через файл','Выписка расчётного счёта (юрлица, безнал) загружается так же. Платежи от ТОО за сотрудников — разносятся вручную с подсказкой.','g'],
 ['WhatsApp','да · WhatsApp Business API','12 номеров филиалов подключаются к одному входящему. Бот отвечает, администратор пишет из системы, история хранится в карточке ученика. Рассылки — только по согласию родителя.','g'],
 ['Instagram · Facebook','да','Директ Instagram и лид-формы Facebook приходят в «Входящие» с меткой объявления. Заявка создаётся сама, бот отвечает в течение минуты.','g'],
 ['2ГИС','да · через WhatsApp и звонки','Кнопка «написать» в карточке 2ГИС ведёт на WhatsApp филиала — заявка помечается источником «2ГИС». Звонки с карточки — через подмену номера.','g'],
 ['Телефония','по желанию','Запись звонков администраторов, привязка к заявке. Подключается на втором этапе, если решите.','i'],
 ['Умай · MyClass','переход','Экспорт учеников, абонементов, остатков и истории посещений — импорт в систему за один день. Подробнее в «Переход».','i'],
 ['1С · бухгалтерия','выгрузка Excel','Реестр оплат, начисления тренерам и выручка по филиалам выгружаются бухгалтеру ежемесячно. Прямая интеграция — если бухгалтерия попросит.','']
 ].map(x=>`<div class="ocard"><div class="ohead"><b>${esc(x[0])}</b><span class="tag ${x[3]}">${esc(x[1])}</span></div><p>${esc(x[2])}</p></div>`).join('')}</div>
 <div class="said"><b>Ваши слова</b><i>«Kaspi не заинтересован — заинтересован, чтобы клиент оставался внутри приложения через платежи». Поэтому выписка раз в день — и дальше система делает разнесение сама, а не администратор руками.</i></div>`;

SC.migrate=()=>`<div class="hd"><div><h2>Переход с Умай и MyClass</h2><p>«MyClass нам рекламировали, мы купили — и в итоге это две разные системы, которые не коллаборируются друг с другом». Переход без остановки работы. Данные переносятся за выходные, неделю системы работают параллельно, потом старые отключаются. Тренеры и администраторы учатся за одну смену — экраны проще, чем то, что есть сейчас.</p></div></div>
 <div class="wid"><div><small>Срок проекта</small><b class="a">4–6 недель</b><span>от старта до работы всех 12 филиалов</span></div><div><small>Данные</small><b>1 день</b><span>ученики, абонементы, остатки, посещения</span></div><div><small>Обучение</small><b>1 смена</b><span>администраторы и тренеры · по филиалам онлайн</span></div><div><small>Параллельная работа</small><b>1 неделя</b><span>сверяем цифры со старыми системами</span></div><div><small>Поддержка</small><b class="g">3 месяца</b><span>правки и настройка после запуска</span></div></div>
 <div class="tl">${[
 ['Неделя 1','Настройка','Филиалы, бренды, залы, типы абонементов и правила, ставки тренеров, роли. Тексты бота — ваши. Согласовываем экраны руководителя и сверку.','on'],
 ['Неделя 2','Перенос данных','Выгрузка из Умай и MyClass: ученики, родители, телефоны, действующие абонементы с остатками, история посещений за год. Импорт, проверка по трём филиалам вместе с управляющими.',''],
 ['Неделя 3','Каналы и Kaspi','Подключение 12 номеров WhatsApp, Instagram, лид-форм Facebook, 2ГИС. Первая загрузка выписки Kaspi, настройка сопоставления, ссылки на оплату.',''],
 ['Неделя 4','Запуск в 3 филиалах','Алматы Розыбакиева, Астана Мангилик Ел, Шымкент. Тренеры отмечают с телефона, администраторы принимают оплаты, родители получают ссылки. Параллельно старые системы.',''],
 ['Неделя 5–6','Вся сеть','Остальные 9 филиалов, отключение Умай и MyClass, первая месячная сверка и расчёт тренеров в системе. Передача руководителю.','']
 ].map(x=>`<div class="tli ${x[3]}"><span class="who">${esc(x[0])}</span><b>${esc(x[1])}</b><p>${esc(x[2])}</p></div>`).join('')}</div>
 <div class="g3" style="margin-top:12px"><div class="pan"><h3>Что переносится</h3><div class="li"><i>✓</i><span>Ученики и родители с телефонами</span></div><div class="li"><i>✓</i><span>Действующие абонементы с остатком занятий и датами</span></div><div class="li"><i>✓</i><span>Долги и рассрочки</span></div><div class="li"><i>✓</i><span>Посещения за 12 месяцев</span></div><div class="li"><i>✓</i><span>Тренеры, группы, расписание</span></div></div><div class="pan"><h3>Что не нужно переносить</h3><p>Настройки Умай, MyClass и российской программы учёта, их отчёты, заявки старше трёх месяцев. Историю переписки в WhatsApp — переносить нельзя технически, она начинается заново с момента подключения.</p></div><div class="pan"><h3>Риск и как закрываем</h3><p>Остатки абонементов в Умай могут не сходиться с реальностью. Поэтому неделя параллельной работы: администраторы сверяют по своим ученикам, расхождения правим до отключения старых систем.</p></div></div>`;

SC.phone=()=>{const l=LES.find(x=>x.id==='L-901');const g=G_(l.grp);const stu=STU.filter(s=>s.grp==='G-01');
 return `<div class="hd"><div><h2>Телефон тренера и администратора</h2><p>Тренер открывает ссылку на телефоне: сегодняшние занятия, список группы, отметка «был / нет / болел» касанием. Через два часа после занятия без отметки — напоминание. Администратор подтверждает занятие и видит, кто без оплаты, прямо на ресепшене.</p></div><div class="btns"><button class="bt p" onclick="act('phone-link')">Отправить ссылку тренеру</button></div></div>
 <div class="g3"><div class="phone"><div class="pbar"><b>ТАКТ · тренер</b><span>Руслан Даулетов</span></div><div class="pin"><div class="pcard"><small>Сегодня · чт 24.09</small><b>17:00 · ${esc(g.n)}</b><span>${esc(g.hall)} · Розыбакиева 247 · 12 учеников</span></div>
 <div class="pcard"><small>Отметить занятие</small>${[...stu,{n:'Алишер Мухтаров'},{n:'Дана Ерланова'},{n:'Медина Сагат'},{n:'Ансар Бек'},{n:'Инкар Бекжан'}].slice(0,8).map((s,i)=>`<div class="chk"><span>${esc(s.n)}${s.st==='nopay'?' <em class="neg">без оплаты</em>':s.st==='trial'?' <em>пробное</em>':''}</span><div class="seg"><button class="${i===2?'':'on'}" onclick="act('phone-mark')">был</button><button class="${i===2?'on w':''}" onclick="act('phone-mark')">нет</button><button onclick="act('phone-mark')">болел</button></div></div>`).join('')}<button class="bt p" style="width:100%;margin-top:8px" onclick="act('phone-save')">Сохранить · 7 был, 1 нет</button></div>
 <div class="pcard"><small>Мои начисления · сентябрь</small><div class="kv"><span>Проведено</span><b>19 занятий</b></div><div class="kv"><span>Замена 22.09</span><b>+1</b></div><div class="kv"><span>К выплате 5.10</span><b class="pos">${tg(trPay(T_('T-01')))}</b></div></div></div></div>
 <div class="phone"><div class="pbar"><b>ТАКТ · администратор</b><span>Дана · Розыбакиева 247</span></div><div class="pin"><div class="pcard"><small>Сейчас в зале · 17:00 латина 5–7</small>${stu.map(s=>`<div class="kv"><span>${esc(s.n)}</span><b class="${s.st==='nopay'?'neg':s.st==='trial'?'':'pos'}">${s.st==='nopay'?'без оплаты · '+fmt(s.due):s.st==='trial'?'пробное':'ок · '+subLeft(s)+' ост.'}</b></div>`).join('')}<button class="bt p" style="width:100%;margin-top:8px" onclick="act('phone-confirm')">Подтвердить занятие</button></div>
 <div class="pcard"><small>Задачи на смену</small><div class="li r"><i>!</i><span>Мирас Ахметов — абонемент закончился 19.09, ходит. Поговорить с мамой</span></div><div class="li w"><i>!</i><span>Айлин на пробном в 17:00 — встретить, после занятия отправить предложение</span></div><div class="li"><i>✓</i><span>Даниял — продление оплачено, абонемент запущен</span></div></div>
 <div class="pcard"><small>Принять оплату на кассе</small><div class="btns" style="justify-content:flex-start;flex-wrap:wrap"><button class="bt" onclick="act('pay-new')">Наличные</button><button class="bt" onclick="act('pay-new')">Карта · POS</button><button class="bt p" onclick="act('kaspi-link')">Ссылка Kaspi</button></div></div></div></div>
 <div><div class="pan"><h3>QR в зале</h3><p>Ученик или родитель сканирует QR у входа в зал — отметка «пришёл» с точным временем. Третья отметка, независимая от тренера и администратора. Для малышей отмечает администратор одним касанием.</p></div><div class="pan"><h3>Если тренер не отметил</h3><div class="li"><i>1</i><span>Через 2 часа — напоминание тренеру</span></div><div class="li"><i>2</i><span>Через 4 часа — управляющему филиала</span></div><div class="li"><i>3</i><span>На следующий день — занятие «не подтверждено», в расчёт не идёт</span></div></div><div class="said"><b>Ваши слова</b><i>«С учётом того, что там был клиент, не был клиент, заболел, не заболел». Три кнопки у тренера — и правило переноса или заморозки срабатывает само.</i></div></div></div>`};
/* ====== КАРТОЧКИ (модальные) ====== */
const CARD={};
CARD.stuinfo=id=>{const s=S_(id);const t=ST_(s.sub);return [esc(s.n)+' '+stTag(s),`${esc(B(s.br).city)} · ${esc(G_(s.grp).n)} · ${esc(T_(s.tr).n)}`,
 `<div class="kv"><span>Абонемент</span><b>${esc(t.n)} · до ${dl(s.end)}</b></div><div class="kv"><span>Занятий</span><b>${t.les?s.used+' / '+t.les:s.used} · осталось ${subLeft(s)??'∞'}</b></div><div class="kv"><span>Пропуски · болезнь</span><b>${s.miss} · ${s.sick}</b></div><div class="kv"><span>Оплачено · к оплате</span><b>${fmt(s.paid)} · <span class="${s.due?'neg':''}">${fmt(s.due)}</span></b></div>${s.age<18?`<div class="kv"><span>Родитель</span><b>${esc(s.par)} · ${esc(s.ph)}</b></div>`:''}<p class="mini" style="margin-top:8px">Полная карточка с историей — в разделе «Ученики» у ролей, которым он доступен.</p>`]};
CARD.trainer=id=>{const t=T_(id);return [esc(t.n),`${esc(t.spec)} · ${esc(B(t.br).city)}, ${esc(B(t.br).n)} · ставка ${tg(t.rate)}`,
 `<div class="wid" style="grid-template-columns:repeat(3,1fr)"><div><small>По расписанию</small><b>${t.plan}</b></div><div><small>Проведено</small><b class="g">${t.done}</b></div><div><small>Не вышел</small><b class="${t.nosh?'r':''}">${t.nosh}</b></div></div>
 <div class="kv"><span>Замены · болезнь</span><b>${t.rep} · ${t.sick}</b></div><div class="kv"><span>Подтверждено учениками</span><b class="${t.conf<t.done?'warnt':''}">${t.conf} / ${t.done}</b></div><div class="kv"><span>Начислено · сентябрь</span><b>${tg(trPay(t))}</b></div><div class="kv"><span>Оценка родителей</span><b>${t.rating}</b></div>
 ${t.nosh>=4?`<div class="note" style="--tone:var(--bad);margin-top:10px"><b>Не вышел ${t.nosh} раз за две недели</b><p>Занятия не проведены, родителям — переносы, начисления нет. Нужно решение управляющего: замена или расторжение.</p></div>`:''}
 <div class="btns" style="margin-top:10px"><button class="bt" onclick="closeM();act('replace','${t.id}')">Назначить замену</button><button class="bt p" onclick="closeM();openTr('${t.id}')">Открыть карточку</button></div>`]};
CARD.lesson=id=>{const l=LES.find(x=>x.id===id);const g=G_(l.grp);const t=T_(l.tr);const stu=STU.filter(s=>s.grp===l.grp);return [`Занятие ${esc(l.id)} <span class="tag ${LST[l.st][1]}">${LST[l.st][0]}</span>`,`${dayOf(l.d)} ${dl(l.d)} ${l.t} · ${esc(g.n)} · ${esc(B(l.br).city)}, ${esc(B(l.br).n)} · ${esc(g.hall)}`,
 `<div class="kv"><span>Тренер</span><b>${esc(t.n)}</b></div>${l.marks?`<div class="wid" style="grid-template-columns:repeat(3,1fr)"><div><small>Был</small><b class="g">${l.marks.p}</b></div><div><small>Нет</small><b>${l.marks.a}</b></div><div><small>Болел</small><b class="i">${l.marks.s}</b></div></div>`:''}
 <div class="kv"><span>Отметка тренера</span><b>${l.marks?'есть':l.st==='planned'?'после занятия':'нет'}</b></div><div class="kv"><span>Подтверждение администратора</span><b class="${l.adm?'pos':'neg'}">${l.st==='planned'?'—':l.adm?'есть':'нет'}</b></div><div class="kv"><span>Отметки учеников · QR</span><b>${l.id==='L-908'?'<span class="neg">3 из 9</span>':l.marks?l.marks.p+' из '+l.marks.p:'—'}</b></div><div class="kv"><span>Начисление тренеру</span><b>${l.st==='done'&&l.adm?tg(t.rate):l.st==='rep'?tg(t.rate)+' → заменяющему':'0 ₸'}</b></div>
 ${l.note?`<div class="note" style="margin-top:10px;--tone:var(--warn)"><b>Примечание</b><p>${esc(l.note)}</p></div>`:''}
 ${stu.length?`<h4 style="margin:12px 0 6px">Ученики группы в выборке</h4>${stu.map(s=>`<div class="kv"><span>${esc(s.n)}</span><b>${stTag(s)}</b></div>`).join('')}`:''}
 <div class="btns" style="margin-top:10px">${l.st==='nosh'?`<button class="bt" onclick="closeM();act('reschedule','${l.id}')">Перенести занятие</button>`:''}${!l.adm&&l.st!=='planned'?`<button class="bt p" onclick="closeM();act('confirm-les','${l.id}')">Подтвердить</button>`:''}</div>`]};
CARD.pay=id=>{const p=PAY.find(x=>x.id===id);const s=p.stu?S_(p.stu):null;const cands=p.id==='P-2205'?[['S-11','Аружан Сапарова · Жанат · долг 32 000'],['—','Марат К. · заявка L-503 · Астана']]:p.id==='P-2200'?[['S-07','Айлин Нурланова · Динара · пробное сегодня'],['—','Динара Н. · Астана, Мангилик Ел']]:[];
 return [`Платёж ${esc(p.id)} <span class="tag ${PST[p.st][1]}">${PST[p.st][0]}</span>`,`${dl(p.d)} · ${PW[p.way]} · от «${esc(p.from)}»`,
 `<div class="wid" style="grid-template-columns:repeat(2,1fr)"><div><small>Сумма</small><b class="a">${tg(p.v)}</b></div><div><small>Ученик</small><b style="font-size:15px">${s?esc(s.n):'<span class="neg">не определён</span>'}</b></div></div>
 ${s?`<div class="kv"><span>Филиал</span><b>${esc(B(p.br).city)} · ${esc(B(p.br).n)}</b></div><div class="kv"><span>Абонемент</span><b>${esc(ST_(p.sub).n)}</b></div><div class="kv"><span>Как сопоставлен</span><b>${p.st==='manual'?'администратором вручную':p.st==='partial'?'сумма = остаток по рассрочке':'имя + сумма + ссылка бота'}</b></div>`:''}
 ${p.note?`<div class="note" style="margin-top:10px;--tone:${p.st==='new'?'var(--bad)':'var(--warn)'}"><b>${p.st==='new'?'Нет однозначного совпадения':'Примечание'}</b><p>${esc(p.note)}</p></div>`:''}
 ${cands.length?`<h4 style="margin:12px 0 6px">Подсказки системы</h4>${cands.map(c=>`<div class="srow"><span>${esc(c[1])}</span><button class="bt p" onclick="closeM();act('pay-assign','${p.id}')">Это он</button></div>`).join('')}`:''}
 <div class="btns" style="margin-top:10px">${s?`<button class="bt" onclick="closeM();openSt('${s.id}')">Карточка ученика</button>`:''}<button class="bt" onclick="closeM();act('pay-err','${p.id}')">Пометить ошибкой</button></div>`]};
CARD.transfer=id=>{const t=TRANS.find(x=>x.id===id);const c=transCalc(t);const s=t.stu?S_(t.stu):null;return [`Перевод ${esc(t.id)} ${t.st==='wait'?'<span class="tag w">ожидает</span>':'<span class="tag g">выполнен</span>'}`,`${s?esc(s.n):esc(t.n)} · ${esc(B(t.from).city)}, ${esc(B(t.from).n)} → ${esc(B(t.to).city)}, ${esc(B(t.to).n)} · ${dl(t.d)} · ${esc(t.reason)}`,
 `<div class="kv"><span>Абонемент</span><b>${esc(ST_(t.sub).n)} · с ${dl(t.start)}</b></div><div class="kv"><span>Оплачено</span><b>${tg(t.paid)}</b></div><div class="kv"><span>Использовано</span><b>${t.used} из ${t.les}</b></div><div class="kv"><span>Цена занятия</span><b>${fmt(t.paid)} ÷ ${t.les} = ${tg(Math.round(c.perLes))}</b></div><div class="kv"><span>Остаток занятий</span><b>${c.rest}</b></div><div class="kv"><span><b>Остаток денег → новому филиалу</b></span><b class="a">${tg(c.restSum)}</b></div>
 <div class="note" style="margin-top:10px"><b>Что произойдёт при подтверждении</b><p>Ученик со всей историей переходит в ${esc(B(t.to).city)}, остаток ${c.rest} занятий сохраняется до ${dl(addDays(t.start,ST_(t.sub).days))}. Выручка ${esc(B(t.from).city)} уменьшается на ${tg(c.restSum)}, ${esc(B(t.to).city)} — увеличивается. Родителю уходит сообщение с новым адресом и расписанием.</p></div>
 <div class="btns" style="margin-top:10px">${t.st==='wait'?`<button class="bt" onclick="closeM();act('transfer-cancel')">Отклонить</button><button class="bt p" onclick="closeM();act('transfer-ok','${t.id}')">Подтвердить перевод</button>`:`<button class="bt" onclick="closeM();go('branchfin')">Деньги по филиалам</button>`}</div>`]};
CARD.lead=id=>{const l=LEADS.find(x=>x.id===id);const f=FUN.find(x=>x.k===l.k);const ni=FUN.indexOf(f)+1;const nx=FUN[ni];return [esc(l.n)+` <span class="tag" style="background:${f.c}18;color:${f.c}">${esc(f.n)}</span>`,`${esc(l.par)} · ${esc(l.ph)} · ${esc(B(l.br).city)}, ${esc(B(l.br).n)} · ${dl(l.d)}`,
 `<div class="kv"><span>Источник</span><b>${esc(l.src)}</b></div><div class="kv"><span>Объявление</span><b>${esc(l.ad)}</b></div><div class="kv"><span>Следующий шаг</span><b>${esc(l.next)}</b></div>
 <h4 style="margin:12px 0 6px">Переписка</h4>${(INBOX.find(x=>x.lead===l.id)?[INBOX.find(x=>x.lead===l.id)]:[]).map(x=>`<div class="msg in">${esc(x.m)}<small>${esc(x.who)} · ${x.t}</small></div>${x.ans?`<div class="msg out">${esc(x.ans.replace('Бот: ','').replace(/^«|»$/g,''))}<small>бот · ${x.t}</small></div>`:''}`).join('')||'<p class="mini">Заявка из лид-формы, переписки пока нет.</p>'}
 <div class="btns" style="margin-top:10px"><button class="bt" onclick="closeM();act('reply')">Написать</button>${nx?`<button class="bt p" onclick="closeM();act('lead-move','${l.id}')">→ ${esc(nx.n)}</button>`:`<button class="bt p" onclick="closeM();go('students')">Ученик создан</button>`}</div>`]};
CARD.branch=id=>{const b=B(id);const r=RECON.find(x=>x.br===id);const trs=TR.filter(t=>t.br===id);const stu=STU.filter(s=>s.br===id);return [`${esc(b.city)} · ${esc(b.n)} <span class="tag" style="background:${b.c}18;color:${b.c}">${esc(b.brand)}</span>`,`управляющий ${esc(b.mgr)} · ${b.tr} тренеров · ${Math.round(b.tr*1.6)} групп · 2 зала`,
 `<div class="wid" style="grid-template-columns:repeat(4,1fr)"><div><small>Ходят</small><b>${b.st}</b></div><div><small>Оплачено</small><b class="g">${b.pay}</b></div><div><small>Разрыв</small><b class="${pct(r.gap,r.att)>20?'r':'w'}">${r.gap} · ${pct(r.gap,r.att)} %</b></div><div><small>Выручка</small><b>${mln(b.rev)}</b><span>план ${mln(b.plan)}</span></div></div>
 <div class="kv"><span>Разрыв: пробные · рассрочки · забыли · не найдено · проверить</span><b>${r.trial} · ${r.inst} · ${r.late} · <span class="neg">${r.unk} · ${r.susp}</span></b></div>
 ${trs.length?`<h4 style="margin:12px 0 6px">Тренеры в выборке</h4>${trs.map(t=>`<div class="kv"><span>${esc(t.n)} · ${esc(t.spec)}</span><b>${t.done} / ${t.plan}${t.nosh?' · <span class="neg">не вышел '+t.nosh+'</span>':''}</b></div>`).join('')}`:''}
 ${stu.length?`<h4 style="margin:12px 0 6px">Ученики в выборке</h4>${stu.map(s=>`<div class="kv"><span>${esc(s.n)}</span><b>${stTag(s)}</b></div>`).join('')}`:''}
 <div class="btns" style="margin-top:10px"><button class="bt" onclick="closeM();curBr='${id}';go('recon')">Сверка филиала</button><button class="bt" onclick="closeM();curBr='${id}';go('students')">Ученики</button><button class="bt p" onclick="closeM();curBr='${id}';go('schedule')">Расписание</button></div>`]};
CARD.group=id=>{const g=G_(id);const t=T_(g.tr);const stu=STU.filter(s=>s.grp===id);return [esc(g.n),`${esc(B(g.br).city)}, ${esc(B(g.br).n)} · ${esc(t.n)} · ${esc(g.days)} · ${esc(g.hall)} · до ${g.size} мест`,
 `${stu.length?stu.map(s=>`<div class="kv"><span>${esc(s.n)} · ${s.age<18?s.age+' лет':'взр.'}</span><b>${stTag(s)} ${subLeft(s)!=null?'<span class="mini">ост. '+subLeft(s)+'</span>':''}</b></div>`).join(''):'<p class="mini">Учеников группы в выборке нет.</p>'}
 <div class="note" style="margin-top:10px"><b>Занятия в сентябре</b><p>${LES.filter(l=>l.grp===id).map(l=>dd(l.d)+' '+LST[l.st][0]).join(' · ')||'по расписанию'}</p></div>
 <div class="btns" style="margin-top:10px"><button class="bt" onclick="closeM();act('wa-group','${id}')">WhatsApp родителям группы</button><button class="bt p" onclick="closeM();openTr('${g.tr}')">Тренер</button></div>`]};
CARD.subt=id=>{const t=ST_(id);return [esc(t.n),`${t.les||'безлимит'} ${t.les?plural(t.les,['занятие','занятия','занятий']):''} · ${t.days} дней · ${t.price?tg(t.price):'бесплатно'}`,
 `<div class="kv"><span>Цена занятия</span><b>${t.les&&t.price?tg(Math.round(t.price/t.les)):'—'}</b></div><div class="kv"><span>Старт</span><b>с первого посещения или с даты оплаты</b></div><div class="kv"><span>Заморозка</span><b>${esc(t.freeze)}</b></div><div class="kv"><span>Пропуски</span><b>${esc(t.miss)}</b></div><div class="kv"><span>Напоминание о продлении</span><b>${t.les?'за 3 занятия до конца':'за 5 дней до конца'}</b></div><div class="kv"><span>Частичная оплата</span><b>разрешена, остаток с датой</b></div>
 <div class="btns" style="margin-top:10px"><button class="bt p" onclick="closeM();act('sub-edit','${id}')">Изменить правила</button></div>`]};
CARD.bot=i=>{const b=BOTS[+i];return [esc(b.ev),`кому: ${esc(b.to)} · ${b.on?'включён':'выключен'}`,`<div class="msg out">${esc(b.txt)}<small>шаблон · переменные в фигурных скобках подставляются автоматически</small></div><p class="mini">Текст редактируется руководителем или маркетологом. Отправка — с номера филиала ученика.</p><div class="btns" style="margin-top:10px"><button class="bt" onclick="closeM();act('bot-toggle','${i}')">${b.on?'Выключить':'Включить'}</button><button class="bt p" onclick="closeM();act('bot-edit')">Изменить текст</button></div>`]};

function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена: '+esc(k)+' · '+esc(id));return}const [t,s,b]=r;openM(t,s,b)}

/* ====== ДЕЙСТВИЯ (демо) ====== */
function act(k,a){const M={
 'xls':'Выгрузка в Excel: текущая таблица с фильтрами. В рабочей версии — файл сразу в загрузки.',
 'new-stu':'Новый ученик: имя, возраст, родитель, телефон, филиал, группа, тип абонемента. Если пришёл из заявки — всё уже заполнено.',
 'wa-parent':()=>`WhatsApp родителю ${esc(S_(a).par)} открыт в системе — история переписки в карточке ученика.`,
 'freeze':()=>`Заморозка для ${esc(S_(a).n)}: укажите даты и причину (справка). Конец абонемента сдвинется автоматически.`,
 'transfer-new':()=>a?`Перевод ${esc(S_(a).n)}: выберите филиал и группу. Остаток занятий и денег посчитается сам.`:'Новый перевод: ученик, филиал назначения, группа. Остаток занятий и денег — автоматически.',
 'renew':()=>`Родителю ${esc(S_(a).par)} отправлена ссылка Kaspi на продление «${esc(ST_(S_(a).sub).n)}» · ${tg(ST_(S_(a).sub).price)}. Платёж придёт с номером абонемента и разнесётся сам.`,
 'inst':()=>a?`Рассрочка для ${esc(S_(a).n)}: сумма и дата остатка. Бот напомнит за 2 дня и в день.`:'Новая рассрочка: ученик, внесено сейчас, остаток, дата. Бот напомнит.',
 'stop':()=>`${esc(S_(a).n)} снят с группы до оплаты. Тренер увидит это в списке, родителю — сообщение.`,
 'sub-new':'Новый тип абонемента: занятий, срок, цена, правила заморозки и пропусков. Применяется ко всей сети или к филиалу.',
 'sub-edit':'Правила типа абонемента редактируются руководителем. Действующие абонементы правила не меняют — только новые.',
 'mark':'Отметка занятия — на телефоне тренера: «был / нет / болел» по каждому ученику. См. раздел «Телефон».',
 'stmt':'Загрузка выписки Kaspi Pay (файл из приложения). Платежи сопоставятся с родителями автоматически, несовпавшие — в «не разнесено».',
 'stmt-bank':'Загрузка банковской выписки по расчётному счёту. Безналичные платежи от юрлиц — с подсказками по назначению.',
 'pay-new':'Оплата на кассе: ученик, сумма, способ (наличные, POS). Абонемент запускается сразу, родителю — подтверждение.',
 'pay-assign':()=>`Платёж ${esc(a)} разнесён на ученика. Система запомнила плательщика — в следующий раз сопоставит сама. Абонемент запущен, родителю — подтверждение.`,
 'pay-err':()=>`Платёж ${esc(a)} помечен «ошибка» с комментарием. Удалить нельзя — руководитель увидит в журнале.`,
 'recon-wa':'Напоминания отправлены 130 родителям с просроченными абонементами и рассрочками — со ссылками Kaspi. Ответы придут в «Входящие».',
 'recon-task':'Созданы задачи 12 администраторам: список учеников «ходят без оплаты» по своему филиалу, срок — сегодня.',
 'debt-wa':'Напоминания всем должникам отправлены со ссылками Kaspi. Оплаты придут в выписке и закроют остатки сами.',
 'debt-link':()=>`Ссылка Kaspi на остаток ${tg(S_(a).due)} отправлена родителю ${esc(S_(a).par)}.`,
 'tr-new':'Новый тренер: имя, филиал, направление, ставка за занятие, группы. Ссылка на телефон уходит в WhatsApp.',
 'wa-tr':()=>`WhatsApp тренеру ${esc(T_(a).n)} открыт.`,
 'replace':()=>`Замена для групп ${esc(T_(a).n)}: выберите тренера филиала. Начисления пойдут заменяющему, родителям — сообщение.`,
 'payslip':()=>`Расчётный лист ${esc(T_(a).n)} за сентябрь: ${T_(a).done} × ${fmt(T_(a).rate)} = ${tg(trPay(T_(a)))}. Отправлен тренеру в телефон.`,
 'payroll-close':'Сентябрь закрыт: ведомость по 36 тренерам сформирована, расчётные листы отправлены, Excel — бухгалтеру. Занятия без подтверждения в расчёт не вошли.',
 'confirm-les':()=>`Занятие ${esc(a)} подтверждено администратором. Начисление тренеру проведено, занятия списаны у присутствовавших.`,
 'reschedule':()=>`Занятие ${esc(a)} перенесено на ближайший свободный слот. Родителям — сообщение, у учеников занятие не списано.`,
 'transfer-ok':()=>`Перевод ${esc(a)} подтверждён: ученик в новом филиале, остаток денег переведён, родителю — сообщение.`,
 'transfer-cancel':'Перевод отклонён, ученик остаётся в своём филиале. Инициатору — уведомление.',
 'sched-add':'Группа в сетку: направление, возраст, тренер, дни и время, зал. Проверка пересечений по залу и тренеру.',
 'group-new':'Новая группа: филиал, направление, тренер, расписание, зал, мест. Из группы рождаются занятия в журнале.',
 'lead-new':'Новая заявка вручную: имя, телефон, филиал, источник. Бот отправит первое сообщение.',
 'lead-move':()=>{const l=LEADS.find(x=>x.id===a);const i=FUN.findIndex(f=>f.k===l.k);if(i<FUN.length-1){l.k=FUN[i+1].k;render();return `«${esc(l.n)}» → ${esc(FUN[i+1].n)}. ${FUN[i+1].k==='trial'?'Родителю — напоминание за день до пробного.':FUN[i+1].k==='sub'?'Ученик создан, абонемент ждёт оплаты по ссылке Kaspi.':'Задача администратору обновлена.'}`}return 'Это последний этап.'},
 'reply':'Ответ пишется здесь, уходит в тот канал, откуда пришло сообщение — WhatsApp, Instagram или Facebook. История — в карточке.',
 'bot-new':'Новый сценарий: событие, кому, текст с переменными. Без программиста.',
 'bot-toggle':()=>{const b=BOTS[+a];b.on=!b.on;render();return `Сценарий «${esc(b.ev)}» ${b.on?'включён':'выключен'}.`},
 'bot-edit':'Текст сценария редактируется прямо здесь. Переменные в фигурных скобках подставляются автоматически.',
 'trial-remind':'Напоминания о завтрашних пробных отправлены 14 родителям по сети. Ответ «+» отметится в заявке.',
 'trial-new':'Новое пробное: заявка или новый ребёнок, филиал, группа, дата. Бот напомнит за день.',
 'trial-offer':()=>`Предложение отправлено: отзыв тренера, цена абонемента и ссылка Kaspi. Оплата переведёт заявку в «Абонемент» сама.`,
 'trial-mark':'Отметка пробного — на телефоне тренера. После отметки «пришёл» бот отправит предложение через час.',
 'br-new':'Новый филиал: город, адрес, бренд, залы, управляющий, номер WhatsApp. Правила и боты подхватываются автоматически.',
 'parent-link':'Ссылка на кабинет отправлена родителю в WhatsApp. Вход — по номеру телефона, без установки приложения.',
 'parent-pay':'Родитель перешёл в Kaspi: сумма и назначение уже заполнены. После оплаты — подтверждение и продление абонемента автоматически.',
 'parent-sick':'Родитель загрузил справку. Заморозка поставлена по правилу типа, конец абонемента сдвинут, администратору — уведомление.',
 'parent-freeze':'Запрос на заморозку отправлен администратору с датами. По правилу типа — подтверждается автоматически.',
 'parent-msg':'Сообщение администратору филиала — в «Входящие» с привязкой к ученику.',
 'churn-wa':'Рассылка 88 ушедшим после первого абонемента: персональное предложение вернуться с бесплатным занятием. Ответы — в «Входящие».',
 'phone-link':'Ссылка на телефон тренера отправлена в WhatsApp. Вход по номеру, свои группы и занятия, ничего лишнего.',
 'phone-mark':'Отметка сохранена в черновик. Нажмите «Сохранить» — занятие уйдёт администратору на подтверждение.',
 'phone-save':'Занятие отмечено: 7 был, 1 нет. Занятия списаны у присутствовавших, администратор получил на подтверждение.',
 'phone-confirm':'Занятие подтверждено администратором. Начисление тренеру проведено. Мирас без оплаты — задача осталась.',
 'kaspi-link':'Ссылка Kaspi сформирована с суммой и назначением, отправлена родителю. Платёж разнесётся сам.',
 'wa-group':'Сообщение родителям группы отправлено с номера филиала — перенос, объявление или напоминание.'
 };const m=M[k];if(!m){toast('Действие в демо: '+esc(k));return}toast(typeof m==='function'?m():m)}

function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();
 const s=STU.find(x=>x.n.toLowerCase().indexOf(q)>=0||x.par.toLowerCase().indexOf(q)>=0||x.id.toLowerCase()===q||x.ph.replace(/\D/g,'').indexOf(q.replace(/\D/g,''))>=0&&q.replace(/\D/g,'').length>=4);if(s){openSt(s.id);toast('Найден ученик: '+esc(s.n));return}
 const t=TR.find(x=>x.n.toLowerCase().indexOf(q)>=0||x.id.toLowerCase()===q);if(t){openTr(t.id);return}
 const b=BR.find(x=>x.city.toLowerCase().indexOf(q)>=0||x.n.toLowerCase().indexOf(q)>=0||x.brand.toLowerCase().indexOf(q)>=0);if(b){card('branch',b.id);return}
 const l=LES.find(x=>x.id.toLowerCase()===q);if(l){card('lesson',l.id);return}
 const p=PAY.find(x=>x.id.toLowerCase()===q||x.from.toLowerCase().indexOf(q)>=0);if(p){card('pay',p.id);return}
 const tr=TRANS.find(x=>x.id.toLowerCase()===q);if(tr){card('transfer',tr.id);return}
 const ld=LEADS.find(x=>x.n.toLowerCase().indexOf(q)>=0||x.par.toLowerCase().indexOf(q)>=0);if(ld){card('lead',ld.id);return}
 toast(`Поиск «${esc(v)}»: по ученикам, родителям, телефонам, тренерам, филиалам, занятиям, платежам и заявкам — в пределах прав роли. Попробуйте «Амина», «Волков», «Шымкент», «P-2205», «ПР-14».`)}

/* ====== ИНФРАСТРУКТУРА ====== */
function renderRoles(){const r=document.getElementById('roles');if(!r)return;
 r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель федерации';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');
 const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();
 toast(`Вы вошли как «${role}» · ${ROLES[role].n}. Показаны только разделы этой роли — так же будет у ваших сотрудников.`);}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${role}. Разделов доступно: ${ROLES[role].s.length}. ${ROLES[role].note}.`)}
const ownerOf=k=>SECOF[k];
function buildRail(){const on=ownerOf(cur);document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>{const n=s.sub.filter(x=>allowed(x[0])).length;return `<div class="ri ${s.k===on?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')" title="${esc(s.n)}"><i>${s.ic}</i><span>${esc(s.n)}</span>${n>1?`<b class="cnt">${n}</b>`:''}</div>`}).join('');}
function buildSub(){const on=ownerOf(cur),s=SEC.find(x=>x.k===on);if(!s)return;document.getElementById('sub').innerHTML=`<h4>${esc(s.n)}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')+`<div class="shint"><b>${esc(role)}</b><br>${esc(ROLES[role].note)}</div>`;}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'ТАКТ';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;const a=document.getElementById('addBtn');if(a)a.style.display=allowed('students')?'':'none';try{history.replaceState(null,'','?s='+cur+(cur==='student'?'&st='+curSt:cur==='trainer'?'&tr='+curTr:''))}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль в правом верхнем углу.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}

/* ====== СЦЕНАРИЙ ПОКАЗА ====== */
const TOUR=[
 ['dash','1 · 12 филиалов на одном экране. Ходят 1 012, оплачено 806, без оплаты 206. Красное — Шымкент: разрыв 25 %. Строка кликается до ученика.'],
 ['recon','2 · Сверка «ходят ↔ оплачено». Двести шесть раскладываются на пять причин: пробные, рассрочки, забыли продлить, оплата не найдена, проверить. У каждой — ответственный.'],
 ['students','3 · Ученики и абонементы. Тип, сколько осталось, до какой даты, посещения, оплачено, к оплате. «Ходит без оплаты» — красным.'],
 ['student','4 · Карточка ученика: Мирас, абонемент закончился 19.09, ходит. Три напоминания, задача администратору. Решение — продлить, рассрочка или снять с группы.'],
 ['subs','5 · Абонементы и правила: 8, 12, безлимит, 24, годовой, мамы, пробное. Заморозка по справке, пропуски, конец срока — правила работают сами.'],
 ['attendance','6 · Журнал занятий. Три отметки: тренер, администратор, ученик. Сошлись — занятие в зарплату и списание. Не сошлись — сигнал.'],
 ['payments','7 · Оплаты. Kaspi без API — выписка раз в день, система сопоставляет платежи с родителями сама. Два не разнесены — администратор решает одним кликом.'],
 ['debts','8 · Должники и рассрочки. «Могу 50 сейчас, остаток в конце месяца» — остаток с датой, бот напоминает, как в Эмиратах.'],
 ['transfer','9 · Перевод между филиалами. Годовой абонемент, использовано 48 из 96 — остаток 140 000 ₸ переходит в новый филиал автоматически.'],
 ['branchfin','10 · Деньги по филиалам: выручка, тренеры по факту, аренда, результат. Шымкент: тренеры 36 % выручки при разрыве 25 %.'],
 ['trainers','11 · Тренеры сети. По расписанию, проведено, не вышел, замены, отметки учеников, начислено. Волков — не вышел 8 раз.'],
 ['trainer','12 · Карточка тренера: 8 занятий не проведены, 10 учеников, начисления нет. Решение управляющего: замена или расторжение.'],
 ['payroll','13 · Оплата тренеров по факту: ставка × проведённые и подтверждённые. Не вышел — ноль. Расчётный лист к 5-му числу сам.'],
 ['control','14 · Контроль: не вышел, замена, расхождение отметок. Сигнал управляющему в день события, а не в конце месяца.'],
 ['schedule','15 · Расписание залов и групп. Из сетки рождаются занятия, красная клетка — тренер, который не выходит.'],
 ['funnel','16 · Воронка: заявка → связались → пробное → пришёл → абонемент. Все каналы, все филиалы, с объявлением. Заявки и абонементы — в одной системе.'],
 ['inbox','17 · Входящие: WhatsApp, Instagram, 2ГИС, Facebook на 12 номеров. Бот отвечает на цену, расписание и запись — 60 % сам.'],
 ['bots','18 · Девять сценариев бота: заявка, пробное, оплата, остаток, продление, сигналы тренеру и управляющему, утро руководителя.'],
 ['trial','19 · Пробные: назначено, пришли, купили. Шымкент 52 % — смотреть тренера и администратора, не рекламу.'],
 ['branches','20 · 12 филиалов, 4 бренда, 9 городов. Общие правила и боты, своё — номера, цены, залы. Тринадцатый — за час.'],
 ['roles','21 · Роли: тренер видит свои группы, администратор — филиал без зарплат, управляющий — филиал, финансист — деньги, вы — всё.'],
 ['parent','22 · Кабинет родителя в телефоне: остаток занятий, посещения, оплата Kaspi по кнопке, справка о болезни. Вопросы администратору — минус половина.'],
 ['phone','23 · Телефон тренера: список группы, «был / нет / болел» касанием. Администратор: кто в зале без оплаты, подтверждение занятия.'],
 ['analytics','24 · Аналитика: полгода по сети, источники с конверсией до абонемента, типы, возраст. Июль — провал сезона, виден заранее.'],
 ['churn','25 · Продления и отток: 81 % продлили, 19 % ушли — по филиалу, тренеру и причине. Истекающие завтра — списком с ссылкой Kaspi.'],
 ['integr','26 · Интеграции честно: Kaspi через выписку, WhatsApp Business API, Instagram, Facebook, 2ГИС. Умай и MyClass — переход за неделю.'],
 ['migrate','27 · Переход: 4–6 недель, данные за день, неделя параллельно, 3 филиала первыми, потом вся сеть. Поддержка 3 месяца.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий показа закончен. Всё кликается: филиалы, ученики, занятия, платежи, тренеры, заявки.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;if(k==='student')curSt='S-04';if(k==='trainer')curTr='T-03';if(k==='recon'||k==='branchfin')curBr='all';build();toast(m);setTimeout(step,ti===0?6200:7200);}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});let q='',st='',tr='';try{const u=new URLSearchParams(location.search);q=u.get('s')||'';st=u.get('st')||'';tr=u.get('tr')||''}catch(e){}if(st&&S_(st))curSt=st;if(tr&&T_(tr))curTr=tr;if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
