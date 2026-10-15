/* SAPAR — единая система турагентства вместо U-ON.Travel и amoCRM: воронка продаж с подсказками РОПу, звонки и WhatsApp, подборки туров (Турвизор / Кви-Кво), заявки на туры с договорами и оплатами, автоматический договор и подпись по коду, анкета туриста по ссылке, оплаты туристов и туроператорам, отчёты, интеграции, расходы. Все имена, туры и суммы вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const TODAY='17.10.2026',NOW='11:00';
const LOGO_I='<svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="7"/><path d="M18 62c18-6 30-26 64-30" fill="none" stroke="var(--brand2,#f2a33a)" stroke-width="7" stroke-linecap="round"/><path d="M70 26l12 6-8 10" fill="none" stroke="var(--brand2,#f2a33a)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>«${q}»</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;

const SEC=[
 {k:'top',n:'Главное',sub:[['dash','Пульт руководителя']]},
 {k:'sl',n:'Продажи (вместо amoCRM)',sub:[['leads','Воронка продаж'],['lead','Карточка клиента'],['pick','Подборка туров'],['comm','Звонки, WhatsApp, Instagram'],['rop','Контроль РОПа']]},
 {k:'tr',n:'Туры (вместо U-ON)',sub:[['orders','Заявки на туры'],['order','Карточка тура'],['contract','Договор и подпись'],['form','Анкета туриста по ссылке'],['pay','Оплаты и долги']]},
 {k:'rp',n:'Отчёты',sub:[['reports','Отчёты и прибыль']]},
 {k:'sys',n:'Переход',sub:[['integr','Что заменяем, что подключаем'],['costs','Расходы в месяц'],['launch','Стоимость и запуск']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Руководитель':{av:'АР',n:'Аршагуль',note:'Всё: продажи, туры, договоры, оплаты, долги, отчёты',s:ALL.slice()},
 'РОП':{av:'РП',n:'Динара',note:'Воронка, менеджеры, звонки, подсказки, контроль',s:['dash','leads','lead','pick','comm','rop','orders','order']},
 'Менеджер по туризму':{av:'МТ',n:'Алия',note:'Свои клиенты, подборки, заявки, договоры, WhatsApp',s:['leads','lead','pick','comm','orders','order','contract','form']},
 'Бухгалтер':{av:'БХ',n:'Сауле',note:'Оплаты туристов и туроператорам, долги, отчёты',s:['pay','orders','order','reports']}
};
let role='Руководитель',cur='dash',theme='light';

const MGR=['Алия','Мадина','Ерасыл'];
const TOP=['Anex Tour','Pegas Touristik','Fun&Sun','Coral Travel','Selfie Travel','Kompas'];
const SRC=[['site','Сайт','#2a7de1'],['ig','Instagram','#c13584'],['wa','WhatsApp','#1f9a56'],['call','Звонок','#6b5bd3'],['ref','Рекомендация','#a66b2a']];
const SRN=k=>(SRC.find(s=>s[0]===k)||['',k])[1];
const LST=[['new','Новая заявка'],['contact','Связались'],['pick','Подборка отправлена'],['think','Думает'],['book','Бронь'],['won','Договор']];
let LEADS=[
 {id:'Л-3218',n:'Ержан и Айгерим',ph:'+7 701 *** 45 12',src:'site',dir:'Турция',when:'01–08.11',pax:'2 взр.',bud:1200000,st:'pick',m:'Алия',next:'Перезвонить сегодня до 15:00 — обещали ответ по отелю',late:false},
 {id:'Л-3221',n:'Семья Касымовых',ph:'+7 777 *** 08 33',src:'ig',dir:'Египет',when:'ноябрь',pax:'2 взр. + 2 реб.',bud:1600000,st:'contact',m:'Мадина',next:'Отправить подборку — 3 отеля AI с аквапарком',late:true},
 {id:'Л-3224',n:'Динара С.',ph:'+7 705 *** 77 01',src:'wa',dir:'Таиланд',when:'10–24.12',pax:'2 взр.',bud:1900000,st:'think',m:'Алия',next:'Напомнить: цена держится до завтра',late:false},
 {id:'Л-3225',n:'Тимур А.',ph:'+7 702 *** 64 18',src:'call',dir:'Вьетнам',when:'январь',pax:'1 взр.',bud:700000,st:'new',m:'Ерасыл',next:'Перезвонить — заявка висит 25 минут',late:true},
 {id:'Л-3226',n:'Гульнара О.',ph:'+7 707 *** 50 44',src:'site',dir:'Турция',when:'05–12.11',pax:'2 взр. + 1 реб.',bud:1100000,st:'book',m:'Мадина',next:'Отправить договор на подпись',late:false},
 {id:'Л-3214',n:'Асель и Нурлан',ph:'+7 747 *** 26 61',src:'ref',dir:'Египет',when:'25.10–01.11',pax:'2 взр.',bud:980000,st:'won',m:'Алия',next:'Договор подписан — передать в тур',late:false},
 {id:'Л-3227',n:'Камила Б.',ph:'+7 701 *** 18 77',src:'ig',dir:'Таиланд',when:'февраль',pax:'2 взр.',bud:1500000,st:'new',m:'Алия',next:'Связаться — новая заявка из Instagram',late:false}
];
const LD=id=>LEADS.find(l=>l.id===id);
let curLead='Л-3218';
/* Заявки на туры (как в U-ON) */
let TOURS=[
 {id:'Т-1407',cl:'Асель и Нурлан',ph:'+7 747 *** 26 61',dir:'Египет · Шарм-эль-Шейх',ho:'Rixos Sharm 5★ AI',to:'Anex Tour',fly:'25.10',back:'01.11',pax:2,sum:980000,paid:980000,net:842000,netPaid:842000,dl:'—',sign:'yes',m:'Алия'},
 {id:'Т-1409',cl:'Гульнара О.',ph:'+7 707 *** 50 44',dir:'Турция · Анталья',ho:'Lara Barut 5★ UAI',to:'Coral Travel',fly:'05.11',back:'12.11',pax:3,sum:1100000,paid:330000,net:948000,netPaid:0,dl:'20.10',sign:'sent',m:'Мадина'},
 {id:'Т-1402',cl:'Серик Ахметов',ph:'+7 701 *** 11 90',dir:'Таиланд · Пхукет',ho:'Kata Beach 4★ BB',to:'Pegas Touristik',fly:'19.10',back:'30.10',pax:2,sum:1640000,paid:1640000,net:1420000,netPaid:1420000,dl:'—',sign:'yes',m:'Ерасыл'},
 {id:'Т-1399',cl:'Жанна Ким',ph:'+7 777 *** 44 08',dir:'Вьетнам · Нячанг',ho:'Sea Pearl 4★ BB',to:'Fun&Sun',fly:'22.10',back:'01.11',pax:2,sum:1260000,paid:900000,net:1084000,netPaid:1084000,dl:'—',sign:'yes',m:'Алия'},
 {id:'Т-1411',cl:'Бауыржан С.',ph:'+7 702 *** 90 15',dir:'Турция · Кемер',ho:'Rixos Sungate 5★ UAI',to:'Selfie Travel',fly:'08.11',back:'15.11',pax:4,sum:2240000,paid:0,net:1930000,netPaid:0,dl:'19.10',sign:'no',m:'Мадина'},
 {id:'Т-1404',cl:'Мадина Т.',ph:'+7 705 *** 32 66',dir:'Египет · Хургада',ho:'Steigenberger 5★ AI',to:'Anex Tour',fly:'28.10',back:'04.11',pax:2,sum:870000,paid:870000,net:748000,netPaid:500000,dl:'18.10',sign:'yes',m:'Ерасыл'}
];
const TR=id=>TOURS.find(t=>t.id===id);
let curTour='Т-1409';
const SIGN={yes:['подписан','g'],sent:['отправлен','w'],no:['не отправлен','r']};
let AUDIT=[];
