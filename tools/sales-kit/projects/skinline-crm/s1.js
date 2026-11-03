/* SKINLINE — CRM дистрибьютора препаратов эстетической медицины по ТЗ клиента. Данные вымышленные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const M=n=>(Math.round(n/10000)/100).toFixed(2).replace('.',',')+'M ₸';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const TODAY='04.11.2026',NOW='10:15';
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const bar=(w,c)=>`<div class="bar"><i class="${c||''}" style="--w:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const tz=(n,q,a)=>`<div class="said"><b>ТЗ · раздел ${n}</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const crumbs=(...a)=>`<div class="crumbl">${a.map((x,i)=>i<a.length-1?`<a onclick="${x[1]}">${esc(x[0])}</a>`:`<b>${esc(x[0])}</b>`).join(' <i>›</i> ')}</div>`;
const SEC=[
 {k:'an',n:'Аналитика',sub:[['dash','План-факт'],['pnl','P&L'],['liq','Ликвидность и дивиденды'],['mkt','Маркетинг: CAC и ROI']]},
 {k:'sale',n:'Продажи',sub:[['funnel','Воронка'],['deal','Сделка и калькулятор'],['clients','Контрагенты и лимиты'],['inbox','Звонки и WhatsApp']]},
 {k:'fin',n:'Финансы',sub:[['debts','Дебиторка'],['bank','Банк-клиент'],['opex','Расходы (OPEX)'],['mexp','Расход с телефона']]},
 {k:'ops',n:'Склад и доставка',sub:[['stock','Остатки и резервы 1С'],['cdek','Доставка СДЭК'],['docs','Документы']]},
 {k:'hr',n:'Команда',sub:[['kpi','KPI и зарплата'],['ai','ИИ-ассистент и вебхуки'],['launch','Состав и стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Учредитель':{av:'УЧ',n:'Учредитель',note:'P&L, ликвидность, дивиденды, план-факт, всё',s:ALL.slice()},
 'Коммерческий директор':{av:'КД',n:'Коммерческий директор',note:'Воронка, каналы, дебиторка, KPI команды, маркетинг',s:['dash','mkt','funnel','deal','clients','inbox','debts','stock','cdek','docs','kpi']},
 'Ведущий менеджер':{av:'АЖ',n:'Айгерим Жумабаева · Алматы',note:'Свои сделки, калькулятор, звонки, WhatsApp, документы, свой KPI',s:['funnel','deal','clients','inbox','stock','cdek','docs','kpi','mexp']},
 'Менеджер регионов':{av:'ДК',n:'Даурен Кенжебаев · Караганда',note:'Свои сделки и расходы в поездках',s:['funnel','deal','clients','inbox','mexp','kpi']},
 'Бухгалтер':{av:'НС',n:'Наталья Сон',note:'Банк-клиент, дебиторка, расходы к выплате, P&L, документы',s:['bank','debts','opex','pnl','liq','docs']}
};
let role='Учредитель',cur='dash';
/* Номенклатура */
const SKU=[
 {id:'JF-FN',b:'Jufora',n:'Jufora Fine 1,0 мл',price:38000,cost:21500,q:412,res:60},
 {id:'JF-DP',b:'Jufora',n:'Jufora Deep 1,0 мл',price:42000,cost:23800,q:268,res:40},
 {id:'BG-RV',b:'Biogel',n:'Biogel Revital 2,0 мл',price:29000,cost:15200,q:530,res:120},
 {id:'BG-SB',b:'Biogel',n:'Biogel Skin Booster 2,0 мл',price:33000,cost:17900,q:18,res:10},
 {id:'VL-LF',b:'Volto',n:'Volto Lift 1,0 мл',price:46000,cost:27400,q:146,res:30},
 {id:'VL-CN',b:'Volto',n:'Volto Contour 1,0 мл',price:49000,cost:29100,q:0,res:0}
];
const SK=id=>SKU.find(s=>s.id===id)||SKU[0];
const CH=['Алматы','Караганда','Регионы'];
const SEG={clinic:'Клиника',priv:'Частник',dealer:'Дилер'};
let CLIENTS=[
 {id:'K1',n:'Клиника «Эстетика Плюс»',seg:'clinic',ch:'Алматы',bin:'180940012345',lim:3000000,debt:1840000,over:0,mgr:'AZ',ph:'+7 727 355 10 10',pay:'отсрочка 14 дн.'},
 {id:'K2',n:'ТОО «Дерма Центр»',seg:'clinic',ch:'Алматы',bin:'150540023456',lim:2500000,debt:2960000,over:12,mgr:'AZ',ph:'+7 727 244 20 20',pay:'отсрочка 21 дн.'},
 {id:'K3',n:'ИП Мухамеджанова (косметолог)',seg:'priv',ch:'Алматы',bin:'900312400111',lim:300000,debt:0,over:0,mgr:'MS',ph:'+7 701 233 45 67',pay:'предоплата'},
 {id:'K4',n:'ТОО «БьютиМед Дистрибуция»',seg:'dealer',ch:'Регионы',bin:'170240034567',lim:6000000,debt:5120000,over:41,mgr:'DK',ph:'+7 7172 50 30 30',pay:'100% предоплата (просрочка)'},
 {id:'K5',n:'Клиника «Лазер Арт»',seg:'clinic',ch:'Караганда',bin:'160840045678',lim:2000000,debt:1210000,over:0,mgr:'DK',ph:'+7 7212 41 00 00',pay:'отсрочка 14 дн.'},
 {id:'K6',n:'ИП Ли (частный специалист)',seg:'priv',ch:'Караганда',bin:'880515300222',lim:250000,debt:180000,over:35,mgr:'DK',ph:'+7 705 777 88 99',pay:'отсрочка 7 дн.'},
 {id:'K7',n:'ТОО «Медэстет Шымкент» (дилер)',seg:'dealer',ch:'Регионы',bin:'190340056789',lim:4000000,debt:2780000,over:0,mgr:'MS',ph:'+7 7252 33 22 11',pay:'отсрочка 30 дн.'}
];
const CL=id=>CLIENTS.find(c=>c.id===id)||CLIENTS[0];
const STAFF={AZ:{n:'Айгерим Жумабаева',r:'Ведущий менеджер по продажам',loc:'Алматы',base:450000,tax:0.115,plan:9000000,fact:10350000},MS:{n:'Мадина Сапарова',r:'Менеджер по продажам',loc:'Алматы',base:350000,tax:0.115,plan:7000000,fact:5880000},DK:{n:'Даурен Кенжебаев',r:'Менеджер регионов',loc:'Караганда',base:380000,tax:0.115,plan:8000000,fact:8240000}};
const STG=[['lead','Новый лид'],['qual','Квалификация'],['kp','КП отправлено'],['bill','Счёт выставлен'],['pre','Предоплата получена'],['paid','Оплачено'],['ship','Отгружено'],['won','Успешно реализовано']];
const STN=k=>(STG.find(s=>s[0]===k)||['lost','Закрыто и не реализовано'])[1];
let DEALS=[
 {id:'SD-1041',cl:'K1',stg:'bill',items:[['JF-FN',20],['BG-RV',30]],tax:0.03,deliv:6500,mgr:'AZ',src:'instagram / cpc / jufora_nov',date:'02.11',paid:0},
 {id:'SD-1042',cl:'K2',stg:'kp',items:[['VL-LF',15],['JF-DP',10]],tax:0.03,deliv:6500,mgr:'AZ',src:'сайт / organic',date:'03.11',paid:0},
 {id:'SD-1043',cl:'K4',stg:'pre',items:[['BG-RV',80],['JF-FN',40]],tax:0.03,deliv:24000,mgr:'DK',src:'дилерская сеть',date:'30.10',paid:2000000},
 {id:'SD-1044',cl:'K5',stg:'paid',items:[['VL-LF',10],['BG-SB',8]],tax:0.03,deliv:9800,mgr:'DK',src:'whatsapp / referral',date:'28.10',paid:724000},
 {id:'SD-1045',cl:'K3',stg:'lead',items:[['BG-RV',5]],tax:0.03,deliv:2900,mgr:'MS',src:'instagram / cpc / biogel_promo',date:'04.11',paid:0},
 {id:'SD-1046',cl:'K7',stg:'qual',items:[['JF-FN',50],['VL-LF',20]],tax:0.03,deliv:18000,mgr:'MS',src:'выставка KIBS',date:'01.11',paid:0},
 {id:'SD-1039',cl:'K1',stg:'won',items:[['JF-DP',12],['BG-RV',20]],tax:0.03,deliv:6500,mgr:'AZ',src:'повторный',date:'21.10',paid:1084000},
 {id:'SD-1040',cl:'K6',stg:'ship',items:[['BG-RV',6]],tax:0.03,deliv:2900,mgr:'DK',src:'instagram / cpc / biogel_promo',date:'24.10',paid:0}
];
const DL=id=>DEALS.find(d=>d.id===id)||DEALS[0];
let curD='SD-1041';
const VAT=0.12;
const econ=d=>{const rev=d.items.reduce((a,[s,q])=>a+SK(s).price*q,0),cogs=d.items.reduce((a,[s,q])=>a+SK(s).cost*q,0);const noVat=rev/(1+VAT);const taxes=noVat*d.tax;const gp=noVat-cogs-taxes-d.deliv;return {rev,noVat,cogs,taxes,deliv:d.deliv,gp,mg:noVat?gp/noVat*100:0}};
/* Банк */
let BANK=[
 {id:'b1',bank:'Freedom Bank',t:'09:41',sum:724000,bin:'160840045678',note:'Оплата по счёту № 1044 за препараты',deal:'SD-1044',st:'auto'},
 {id:'b2',bank:'Bank CenterCredit',t:'09:12',sum:2000000,bin:'170240034567',note:'Предоплата по сч. 1043',deal:'SD-1043',st:'auto'},
 {id:'b3',bank:'Freedom Bank',t:'08:55',sum:500000,bin:'150540023456',note:'Частичная оплата задолженности',deal:null,st:'client'},
 {id:'b4',bank:'Bank CenterCredit',t:'08:30',sum:-186000,bin:'—',note:'СДЭК Казахстан, пополнение депозита',deal:null,st:'opex'},
 {id:'b5',bank:'Freedom Bank',t:'вчера',sum:180000,bin:'770101300999',note:'Перевод без назначения',deal:null,st:'manual'}
];
/* Расходы */
let OPEX=[
 {id:'R-311',who:'DK',cat:'Командировки',sum:84000,pay:'Личные средства',chk:'Air Astana · e-ticket',st:'pay',d:'01.11'},
 {id:'R-312',who:'DK',cat:'Такси',sum:6400,pay:'Личные средства',chk:'Яндекс Go',st:'pay',d:'02.11'},
 {id:'R-313',who:'AZ',cat:'Логистика',sum:12800,pay:'Корп. карта',chk:'СДЭК',st:'ok',d:'02.11'},
 {id:'R-314',who:'MS',cat:'Бензин',sum:18000,pay:'Личные средства',chk:'Helios АЗС',st:'new',d:'03.11'},
 {id:'R-315',who:'AZ',cat:'Реклама',sum:350000,pay:'Корп. карта',chk:'Meta Ads · Jufora_nov',st:'ok',d:'01.11'},
 {id:'R-316',who:'MS',cat:'Обучение',sum:120000,pay:'Корп. карта',chk:'Семинар инъекционистов',st:'ok',d:'31.10'}
];
const OST={new:['на проверке','w'],pay:['к выплате','i'],ok:['учтено','g'],paid:['выплачено','']};
let INBOX=[
 {id:'i1',ch:'WA',who:'Клиника «Эстетика Плюс» · Асем',cl:'K1',t:'10:02',msgs:[['in','Добрый день! Счёт получили, оплатим в пятницу. Можно доставку в четверг?','10:02']]},
 {id:'i2',ch:'TEL',who:'ТОО «Дерма Центр» · гл. врач',cl:'K2',t:'09:30',dir:'входящий → Айгерим (закреплённый менеджер)',dur:'8:12',ai:'Клиника просит отсрочку 30 дней вместо 21 и скидку 5% на Volto Lift при заказе от 15 шт. Есть просрочка 12 дней — менеджер пообещал согласовать после оплаты долга 960 000 ₸. Результат: ждём оплату долга до 07.11, затем КП.'},
 {id:'i3',ch:'WA',who:'ИП Ли · частный специалист',cl:'K6',t:'09:00',auto:true,msgs:[['out','Напоминание: по счёту № 1040 срок оплаты 180 000 ₸ прошёл 35 дней назад. Отгрузки приостановлены до оплаты. Реквизиты во вложении.','09:00']]},
 {id:'i4',ch:'TEL',who:'+7 708 555 12 34 · новый номер',cl:null,t:'08:47',dir:'входящий → очередь «Новые клиенты»',dur:'3:05',ai:'Косметолог из Талдыкоргана интересуется Biogel Revital, хочет прайс для частников и обучение. Создан лид, канал «Регионы».'}
];
let curI='i2';
