/* ЖҮК СЕРВИС — CRM грузчиков по ТЗ Заказчика (10.11.2026). Демо на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const TODAY='16.11.2026',TMR='17.11.2026',NOW='14:20';
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const said=(q,a)=>`<div class="said"><b>Из ТЗ</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const SEC=[
 {k:'main',n:'Главный экран',sub:[['home','Экран руководителя'],['mhome','Экран менеджера'],['phone','Телефон менеджера']]},
 {k:'ord',n:'Заказы',sub:[['orders','Текущие заказы'],['order','Заказ и расчёт часов'],['hist','История заказов']]},
 {k:'pay',n:'Оплаты',sub:[['payin','Оплата от заказчиков'],['payout','Оплата исполнителям']]},
 {k:'cl',n:'Клиенты',sub:[['clients','Клиенты'],['client','Карточка клиента']]},
 {k:'wk',n:'Исполнители',sub:[['workers','Грузчики и водители'],['worker','Карточка исполнителя']]},
 {k:'cold',n:'Холодные звонки',sub:[['cold','База и обзвон'],['coldrep','Отчёт по обзвону']]},
 {k:'com',n:'Звонки и переписки',sub:[['chats','Диалоги WhatsApp'],['calls','Журнал звонков']]},
 {k:'task',n:'Задачи',sub:[['tasks','Задачи']]},
 {k:'fin',n:'Финансы',sub:[['fin','Выручка и расходы'],['month','Итоги месяца']]},
 {k:'src',n:'Источники заявок',sub:[['src','Номера и источники']]},
 {k:'mgr',n:'Менеджеры',sub:[['mgrs','Менеджеры'],['mgr','Карточка менеджера']]},
 {k:'set',n:'Настройки',sub:[['settings','Города, номера, выгрузка']]},
 {k:'go',n:'Запуск',sub:[['answers','Ответы на раздел 8 ТЗ'],['launch','Стоимость и этапы']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Руководитель':{av:'РК',n:'Ерлан · владелец',note:'Видит и может всё: все заказы, оплаты, выплаты исполнителям, финансы, менеджеры, настройки',s:ALL.slice()},
 'Менеджер':{av:'АН',n:'Айгерим · менеджер, Астана',note:'Только свои заказы, клиенты и диалоги. Без финансов, выплат исполнителям и настроек',s:['mhome','phone','orders','order','hist','payin','clients','client','workers','worker','cold','chats','calls','tasks']}
};
let role='Руководитель',cur='home';
const HEAD=()=>role==='Руководитель';
let CITIES=[{id:'AST',n:'Астана'},{id:'KST',n:'Костанай'}];
let CITY='all';
const CN=id=>(CITIES.find(c=>c.id===id)||{n:id}).n;
const cityOk=x=>CITY==='all'||x.city===CITY;
const MGRS=[
 {id:'M1',n:'Айгерим Нурланова',city:'AST',on:true,start:'01.03.2026',ph:'+7 701 402 11 30',calls:38,inc:22,out:13,miss:3,dlg:17,frt:3,newc:4,ord:7,done:5,tdone:6,tlate:1,cold:24},
 {id:'M2',n:'Данияр Сейткали',city:'KST',on:true,start:'15.06.2026',ph:'+7 705 118 64 07',calls:27,inc:15,out:10,miss:2,dlg:11,frt:6,newc:2,ord:5,done:4,tdone:4,tlate:2,cold:18},
 {id:'M3',n:'Мадина Ахметова',city:'AST',on:false,start:'01.11.2026',ph:'+7 777 340 52 19',calls:0,inc:0,out:0,miss:0,dlg:0,frt:0,newc:0,ord:0,done:0,tdone:0,tlate:0,cold:0}
];
const MG=id=>MGRS.find(m=>m.id===id)||MGRS[0];
const ME='M1';
const fnm=id=>MG(id).n.split(' ')[0];
const NUMS=[
 {id:'W1',n:'OLX Астана',ph:'+7 708 555 10 01',city:'AST',mgr:'M1',src:'OLX',wrote:52,called:34,missed:5,cl:19,ord:24,rev:1384000,ad:140000},
 {id:'W2',n:'Сайт',ph:'+7 708 555 10 02',city:'AST',mgr:'M1',src:'Сайт',wrote:31,called:22,missed:2,cl:14,ord:18,rev:1126000,ad:90000},
 {id:'W3',n:'2ГИС Астана',ph:'+7 708 555 10 03',city:'AST',mgr:'M1',src:'2ГИС',wrote:12,called:29,missed:3,cl:11,ord:13,rev:742000,ad:35000},
 {id:'W4',n:'OLX Костанай',ph:'+7 708 555 20 01',city:'KST',mgr:'M2',src:'OLX',wrote:38,called:19,missed:4,cl:13,ord:16,rev:812000,ad:110000},
 {id:'W5',n:'Instagram Костанай',ph:'+7 708 555 20 02',city:'KST',mgr:'M2',src:'Instagram',wrote:21,called:6,missed:1,cl:6,ord:7,rev:368000,ad:60000}
];
const NU=id=>NUMS.find(n=>n.id===id)||NUMS[0];
let CLIENTS=[
 {id:'C1',n:'ТОО «Сарыарка Мебель»',t:'b2b',perm:true,ph:['+7 717 255 40 12','+7 701 330 18 44'],addr:['Астана, ул. Кенесары, 40 (склад)'],city:'AST',src:'W2',mgr:'M1',bin:'190340012875',contact:'Асхат, завхоз',iik:'KZ12722S000012345678 · Kaspi Bank'},
 {id:'C2',n:'Сауле Жумабекова',t:'b2c',perm:false,ph:['+7 702 418 90 33'],addr:['Астана, пр. Туран, 55, кв. 112'],city:'AST',src:'W1',mgr:'M1',bin:'',contact:'',iik:''},
 {id:'C3',n:'ТОО «Строй Ресурс Костанай»',t:'b2b',perm:true,ph:['+7 714 254 77 10'],addr:['Костанай, ул. Карбышева, 2 (база)'],city:'KST',src:'W4',mgr:'M2',bin:'170940005513',contact:'Виталий, прораб',iik:'KZ55601A000011122233 · Halyk'},
 {id:'C4',n:'Ерболат Касымов',t:'b2c',perm:false,ph:['+7 747 201 63 58'],addr:['Астана, ул. Сыганак, 18, кв. 7'],city:'AST',src:'W3',mgr:'M1',bin:'',contact:'',iik:''},
 {id:'C5',n:'ИП «Офис Переезд»',t:'b2b',perm:false,ph:['+7 705 600 21 09'],addr:['Астана, ул. Достык, 5, БЦ «Нурсаулет»'],city:'AST',src:'W2',mgr:'M3',bin:'880512300441',contact:'Галия, офис-менеджер',iik:'KZ80722S000099988877 · Kaspi Bank'},
 {id:'C6',n:'Ирина Ким',t:'b2c',perm:true,ph:['+7 776 515 44 20'],addr:['Костанай, ул. Баймагамбетова, 170, кв. 41'],city:'KST',src:'W5',mgr:'M2',bin:'',contact:'',iik:''},
 {id:'C7',n:'ТОО «Агро Опт»',t:'b2b',perm:false,ph:['+7 714 290 11 05'],addr:['Костанай, промзона, 14'],city:'KST',src:'W4',mgr:'M2',bin:'200140018872',contact:'Нурлан, логист',iik:'KZ61998CTB0000123456 · Bank CenterCredit'}
];
const CL=id=>CLIENTS.find(c=>c.id===id)||CLIENTS[0];
let WORKERS=[
 {id:'R1',n:'Бауыржан Тлеуов',type:'грузчик',ph:'+7 701 510 22 31',wa:'+7 701 510 22 31',bank:'Kaspi',card:'+7 701 510 22 31',city:'AST',cm:'Аккуратный, берёт пианино и сейфы'},
 {id:'R2',n:'Ринат Мусин',type:'грузчик',ph:'+7 702 640 18 05',wa:'+7 702 640 18 05',bank:'Kaspi',card:'4400 4302 1188 5520',city:'AST',cm:''},
 {id:'R3',n:'Ерасыл Омаров',type:'грузчик',ph:'+7 707 311 90 64',wa:'+7 707 311 90 64',bank:'Halyk',card:'4405 6200 7781 1094',city:'AST',cm:'Опоздал 02.11 на 20 минут'},
 {id:'R4',n:'Сергей Ли',type:'водитель «Газели»',ph:'+7 705 222 48 70',wa:'+7 705 222 48 70',bank:'Kaspi',card:'+7 705 222 48 70',city:'AST',cm:'Газель с тентом 4,2 м'},
 {id:'R5',n:'Азамат Беков',type:'грузчик',ph:'+7 776 403 15 22',wa:'+7 776 403 15 22',bank:'Kaspi',card:'+7 776 403 15 22',city:'KST',cm:''},
 {id:'R6',n:'Дмитрий Пак',type:'водитель «Газели»',ph:'+7 714 288 06 71',wa:'+7 714 288 06 71',bank:'Freedom',card:'4111 2200 5566 0912',city:'KST',cm:'Газель-фургон, ремни есть'},
 {id:'R7',n:'Нуржан Сапаров',type:'грузчик',ph:'+7 747 590 33 84',wa:'+7 747 590 33 84',bank:'Kaspi',card:'+7 747 590 33 84',city:'KST',cm:''}
];
const WK=id=>WORKERS.find(w=>w.id===id)||WORKERS[0];
const PAYT=['Юрлицо, закрывающие документы','Счёт на Kaspi для физлица','Наличные','Другое'];
const cw=(w,s,e,o)=>Object.assign({w,s,e,ov:0,bonus:0,rate:null,wa:'',card:'',paid:false,rt:0},o||{});
let ORDERS=[
 {id:'З-1042',cl:'C1',city:'AST',date:TODAY,mgr:'M1',src:'W2',st:'в работе',work:'Переезд склада: стеллажи, коробки',start:'09:00',end:'13:10',addr:'Астана, ул. Кенесары, 40 → ул. Жансугурова, 8',rC:4000,rW:2500,car:{need:true,rC:7000,rW:5000,w:'R4'},pay:0,disc:0,profit:null,ps:'nobill',due:'',paidAt:'',paidBy:'',crew:[cw('R1','09:00','13:10'),cw('R2','09:00','13:10'),cw('R3','09:00','12:00')]},
 {id:'З-1043',cl:'C2',city:'AST',date:TODAY,mgr:'M1',src:'W1',st:'выполнен',work:'Квартирный переезд, 2 комнаты',start:'10:00',end:'12:10',addr:'Астана, пр. Туран, 55 → ул. Мангилик Ел, 20',rC:3500,rW:2200,car:{need:true,rC:6500,rW:4500,w:'R4'},pay:1,disc:2000,profit:null,ps:'billed',due:'16.11.2026',paidAt:'',paidBy:'',crew:[cw('R2','10:00','12:10',{wa:'+7 702 640 18 05',card:'4400 4302 1188 5520'}),cw('R3','10:00','12:10')]},
 {id:'З-1044',cl:'C4',city:'AST',date:TMR,mgr:'M1',src:'W3',st:'новый',work:'Подъём мебели на 7 этаж без лифта',start:'11:00',end:'',addr:'Астана, ул. Сыганак, 18',rC:4500,rW:3000,car:{need:false,rC:0,rW:0,w:''},pay:2,disc:0,profit:null,ps:'nobill',due:'',paidAt:'',paidBy:'',crew:[]},
 {id:'З-1045',cl:'C3',city:'KST',date:TODAY,mgr:'M2',src:'W4',st:'закрыт',work:'Разгрузка фуры: цемент 20 т',start:'08:00',end:'11:40',addr:'Костанай, ул. Карбышева, 2',rC:3800,rW:2400,car:{need:false,rC:0,rW:0,w:''},pay:0,disc:0,profit:31000,ps:'billed',due:'12.11.2026',paidAt:'',paidBy:'',crew:[cw('R5','08:00','11:40',{wa:'+7 776 403 15 22',card:'+7 776 403 15 22',rt:9}),cw('R7','08:00','11:40',{wa:'+7 747 590 33 84',card:'+7 747 590 33 84',rt:8}),cw('R5','08:00','11:40',{w:'R7',wa:'+7 747 590 33 84',card:'+7 747 590 33 84',rt:8})]},
 {id:'З-1046',cl:'C6',city:'KST',date:TMR,mgr:'M2',src:'W5',st:'новый',work:'Перевозка холодильника и стиральной машины',start:'15:00',end:'',addr:'Костанай, ул. Баймагамбетова, 170',rC:3500,rW:2200,car:{need:true,rC:6000,rW:4000,w:'R6'},pay:1,disc:0,profit:null,ps:'nobill',due:'',paidAt:'',paidBy:'',crew:[]},
 {id:'З-1039',cl:'C1',city:'AST',date:'14.11.2026',mgr:'M1',src:'W2',st:'закрыт',work:'Вывоз старой мебели из офиса',start:'14:00',end:'17:20',addr:'Астана, ул. Кенесары, 40',rC:4000,rW:2500,car:{need:true,rC:7000,rW:5000,w:'R4'},pay:0,disc:0,profit:46000,ps:'paid',due:'15.11.2026',paidAt:'15.11.2026',paidBy:'Ерлан (руководитель)',crew:[cw('R1','14:00','17:20',{wa:'+7 701 510 22 31',card:'+7 701 510 22 31',paid:true,rt:10}),cw('R3','14:00','17:20',{wa:'+7 707 311 90 64',card:'4405 6200 7781 1094',paid:true,rt:7})]},
 {id:'З-1037',cl:'C5',city:'AST',date:'13.11.2026',mgr:'M3',src:'W2',st:'закрыт',work:'Офисный переезд, 14 рабочих мест',start:'18:00',end:'23:30',addr:'Астана, ул. Достык, 5',rC:4500,rW:2800,car:{need:true,rC:7000,rW:5000,w:'R4'},pay:0,disc:10000,profit:72000,ps:'billed',due:'10.11.2026',paidAt:'',paidBy:'',crew:[cw('R1','18:00','23:30',{wa:'+7 701 510 22 31',card:'+7 701 510 22 31',paid:true,rt:9}),cw('R2','18:00','23:30',{wa:'+7 702 640 18 05',card:'4400 4302 1188 5520',paid:true,rt:9})]},
 {id:'З-1041',cl:'C7',city:'KST',date:'15.11.2026',mgr:'M2',src:'W4',st:'выполнен',work:'Погрузка мешков с зерном',start:'09:00',end:'11:05',addr:'Костанай, промзона, 14',rC:3800,rW:2400,car:{need:false,rC:0,rW:0,w:''},pay:0,disc:0,profit:null,ps:'nobill',due:'',paidAt:'',paidBy:'',crew:[cw('R5','09:00','11:05',{wa:'+7 776 403 15 22',card:'+7 776 403 15 22'}),cw('R7','09:00','11:05',{wa:'+7 747 590 33 84',card:'+7 747 590 33 84'})]}
];
ORDERS[3].crew=ORDERS[3].crew.slice(0,2);
const OR=id=>ORDERS.find(o=>o.id===id)||ORDERS[0];
/* правила расчёта часов из ТЗ (п. 4) */
const toMin=t=>{if(!t||t.indexOf(':')<0)return 0;const [h,m]=t.split(':').map(Number);return h*60+m};
const span=(s,e)=>{let d=toMin(e)-toMin(s);if(d<0)d+=1440;return d};
function billH(min){if(min<=0)return 0;if(min<=120)return 2;const x=min-120;let st=Math.floor(x/30);if(x-st*30>=10)st++;return 2+st*0.5}
const hstr=h=>{const H=Math.floor(h),M=Math.round((h-H)*60);return H+' ч'+(M?' '+M+' мин':'')};
const mstr=m=>Math.floor(m/60)+' ч '+String(m%60).padStart(2,'0')+' мин';
function crewH(c,o){if(c.ov)return c.ov;const e=c.e||o.end;if(!e)return 0;return billH(span(c.s||o.start,e))}
function carH(o){if(!o.car.need||!o.end)return 0;return billH(span(o.start,o.end))}
function calc(o){const ln=o.crew.map(c=>{const h=crewH(c,o);const pay=h*(c.rate||o.rW)+(c.bonus||0);return {c,h,cli:h*o.rC,pay}});
 const ch=carH(o);const carCli=ch*o.car.rC,carPay=ch*o.car.rW;
 const cli=ln.reduce((a,x)=>a+x.cli,0)+carCli-(o.disc||0);const pay=ln.reduce((a,x)=>a+x.pay,0)+carPay;
 return {ln,ch,carCli,carPay,cli,pay,diff:cli-pay}}
const mine=x=>HEAD()||x.mgr===ME;
const late=o=>o.ps==='billed'&&o.due&&toD(o.due)<toD(TODAY);
function toD(d){const [a,b,c]=d.split('.');return +(c+b+a)}
let COLD=[
 {id:'H1',ph:'+7 701 900 12 45',n:'ТОО «Мебель Плюс»',t:'b2b',city:'AST',src:'База 2ГИС, мебельные',st:'новый',note:'',next:'',mgr:'M1',hist:[]},
 {id:'H2',ph:'+7 702 331 08 17',n:'ТОО «Дом Ремонт»',t:'b2b',city:'AST',src:'База 2ГИС, ремонт',st:'перезвонить',note:'Директор в отпуске до 18.11',next:'18.11.2026',mgr:'M1',hist:['12.11 · не дозвонился','14.11 · перезвонить']},
 {id:'H3',ph:'+7 747 118 52 30',n:'Офис «Алем Консалт»',t:'b2b',city:'AST',src:'База бизнес-центров',st:'заинтересован',note:'Переезд офиса в январе, пришлём КП',next:'',mgr:'M1',hist:['13.11 · заинтересован']},
 {id:'H4',ph:'+7 705 640 77 21',n:'ИП Сейтжанов',t:'b2c',city:'AST',src:'База OLX, продавцы мебели',st:'не дозвонился',note:'Не берёт',next:'',mgr:'M1',hist:['15.11 · не дозвонился']},
 {id:'H5',ph:'+7 714 233 90 18',n:'ТОО «Кост Строй»',t:'b2b',city:'KST',src:'База 2ГИС, стройка',st:'отказ',note:'Свои грузчики',next:'',mgr:'M2',hist:['11.11 · отказ: свои грузчики']},
 {id:'H6',ph:'+7 776 510 63 02',n:'Магазин «Техно Дом»',t:'b2b',city:'KST',src:'База 2ГИС, техника',st:'новый',note:'',next:'',mgr:'M2',hist:[]},
 {id:'H7',ph:'+7 701 222 74 90',n:'ТОО «Евро Окна»',t:'b2b',city:'AST',src:'База 2ГИС, окна',st:'новый',note:'',next:'',mgr:'M1',hist:[]}
];
const CST=['новый','не дозвонился','перезвонить','заинтересован','отказ','не актуально / не тот номер','стал клиентом'];
let TASKS=[
 {id:'T1',t:'Перезвонить ТОО «Дом Ремонт»',d:'Перезвонить с датой из холодной базы. +7 702 331 08 17',m:'M1',due:'18.11.2026',auto:true,done:false,rep:false,cm:'',city:'AST'},
 {id:'T2',t:'Перезвонить: пропущенный звонок',d:'+7 777 812 40 55 · OLX Астана · 13:05',m:'M1',due:TODAY,auto:true,done:false,rep:false,cm:'',city:'AST'},
 {id:'T3',t:'Подтвердить грузчиков на завтра',d:'З-1044, 7 этаж без лифта — нужны 3 человека',m:'M1',due:TODAY,auto:false,done:false,rep:true,cm:'',city:'AST'},
 {id:'T4',t:'Выставить счёт ТОО «Строй Ресурс Костанай»',d:'З-1045, реквизиты в карточке клиента',m:'M2',due:'14.11.2026',auto:false,done:false,rep:false,cm:'',city:'KST'},
 {id:'T5',t:'Обзвонить 20 контактов холодной базы',d:'Каждый день до 17:00',m:'M2',due:TODAY,auto:false,done:true,rep:true,cm:'Сделано 18, двое заинтересованы',city:'KST'},
 {id:'T6',t:'Собрать отзывы постоянных клиентов',d:'5 клиентов, текст для сайта',m:'M1',due:'20.11.2026',auto:false,done:false,rep:false,cm:'',city:'AST'}
];
let CHATS=[
 {id:'D1',ph:'+7 707 455 10 32',cl:'',num:'W1',mgr:'M1',city:'AST',newc:true,wait:22,msgs:[['in','Здравствуйте, нужны 2 грузчика завтра утром, диван и шкаф','13:58']]},
 {id:'D2',ph:'+7 702 418 90 33',cl:'C2',num:'W1',mgr:'M1',city:'AST',newc:false,wait:0,msgs:[['in','Ребята уже приехали, спасибо!','10:04'],['out','Отлично! После работы пришлём счёт на Kaspi','10:05'],['in','Хорошо, жду','10:06']]},
 {id:'D3',ph:'+7 717 255 40 12',cl:'C1',num:'W2',mgr:'M1',city:'AST',newc:false,wait:0,msgs:[['in','На складе нужно ещё 2 часа, продлеваем','12:40'],['out','Принято, ребята остаются, время продлила','12:42']]},
 {id:'D4',ph:'+7 776 515 44 20',cl:'C6',num:'W5',mgr:'M2',city:'KST',newc:false,wait:18,msgs:[['in','Завтра в 15:00 в силе? Холодильник большой, двухкамерный','13:59']]},
 {id:'D5',ph:'+7 778 300 61 14',cl:'',num:'W4',mgr:'M2',city:'KST',newc:true,wait:5,msgs:[['in','Сколько стоит газель с грузчиками по городу?','14:12']]}
];
let CALLS=[
 {t:'16.11 14:05',ph:'+7 777 812 40 55',dir:'пропущенный',mgr:'M1',dur:'—',num:'W1',rec:false,cb:false,city:'AST'},
 {t:'16.11 13:40',ph:'+7 717 255 40 12',dir:'входящий',mgr:'M1',dur:'03:12',num:'W2',rec:true,cb:true,city:'AST'},
 {t:'16.11 12:15',ph:'+7 702 331 08 17',dir:'исходящий',mgr:'M1',dur:'01:05',num:'W3',rec:true,cb:true,city:'AST'},
 {t:'16.11 11:50',ph:'+7 714 290 11 05',dir:'входящий',mgr:'M2',dur:'04:40',num:'W4',rec:true,cb:true,city:'KST'},
 {t:'16.11 11:02',ph:'+7 778 412 09 66',dir:'пропущенный',mgr:'M2',dur:'—',num:'W4',rec:false,cb:false,city:'KST'},
 {t:'16.11 10:31',ph:'+7 747 201 63 58',dir:'исходящий',mgr:'M1',dur:'02:18',num:'W3',rec:true,cb:true,city:'AST'}
];
let EXP=[
 {a:'Аренда офиса',s:250000,city:'AST',m:'Ноябрь',num:''},{a:'Реклама OLX',s:140000,city:'AST',m:'Ноябрь',num:'W1'},{a:'Реклама сайта (Google)',s:90000,city:'AST',m:'Ноябрь',num:'W2'},
 {a:'Реклама OLX',s:110000,city:'KST',m:'Ноябрь',num:'W4'},{a:'Таргет Instagram',s:60000,city:'KST',m:'Ноябрь',num:'W5'},{a:'Закуп: ремни и плёнка',s:38000,city:'AST',m:'Ноябрь',num:''},
 {a:'Зарплата менеджеров',s:520000,city:'AST',m:'Октябрь',num:''},{a:'Зарплата менеджеров',s:260000,city:'KST',m:'Октябрь',num:''}
];
const REV={AST:{'Август':3180000,'Сентябрь':3420000,'Октябрь':3610000,'Ноябрь':2010000},KST:{'Август':1240000,'Сентябрь':1380000,'Октябрь':1490000,'Ноябрь':790000}};
const MONTHS=['Август','Сентябрь','Октябрь','Ноябрь'];
let SET={wait:15,push:true,payt:PAYT.slice()};
let SEL={o:'З-1042',c:'C1',w:'R1',m:'M1',d:'D1'};
