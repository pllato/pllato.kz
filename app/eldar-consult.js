/* РЕЕСТР — CRM консалтинговой компании: лицензирование и продажа готовых фирм. Воронка продаж с этапами из amoCRM, равномерное распределение заявок, воронка «Продают компанию», маркетплейс готовых фирм с синхронизацией сайта, прайс и калькулятор, КП и договор из сделки, мессенджер и телефония в карточке, хранилище тяжёлых документов без лимитов, аналитика звонков и касаний, переезд с amoCRM. Все имена, компании и суммы вымышленные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(n<0?'−':'')+(Math.round(Math.abs(n)/10000)/100).toString().replace('.',',')+' млн';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};
const TODAY='2026-10-05',NOW='16:10';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;

const SEC=[
 {k:'sales',n:'Продажи',sub:[['today','Пульт'],['funnel','Отдел продаж'],['deal','Карточка сделки'],['distrib','Распределение заявок'],['sellers','Продают компанию'],['repeat','Постоянные клиенты']]},
 {k:'cat',n:'Каталог и цены',sub:[['market','Маркетплейс фирм'],['firm','Карточка фирмы'],['prices','Прайс и калькулятор'],['kp','КП и договор']]},
 {k:'com',n:'Связь',sub:[['chat','Мессенджер'],['calls','Звонки']]},
 {k:'docs',n:'Документы',sub:[['files','Хранилище документов']]},
 {k:'an',n:'Аналитика',sub:[['analytics','Аналитика отдела']]},
 {k:'sys',n:'Система',sub:[['roles','Роли и права'],['mobile','С телефона'],['move','Переезд с amoCRM'],['launch','Запуск и стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Руководитель':{av:'ЭЛ',p:'EL',n:'Эльдар',note:'Всё: продажи, распределение, маркетплейс, звонки, документы, аналитика, настройки',s:ALL.slice()},
 'Руководитель отдела продаж':{av:'АЙ',p:'AI',n:'Айдана',note:'Воронки, распределение заявок, звонки и касания менеджеров, аналитика отдела',s:['today','funnel','deal','distrib','sellers','repeat','market','firm','prices','kp','chat','calls','files','analytics','mobile']},
 'Менеджер':{av:'НС',p:'NS',n:'Нурсултан',note:'Свои сделки: заявки, звонки, мессенджер, прайс и калькулятор, КП и договор',s:['funnel','deal','repeat','market','firm','prices','kp','chat','calls','files','mobile']},
 'Юрист':{av:'АС',p:'AS',n:'Асем',note:'Документы и проверка фирм на продажу: учредительные, лицензии, налоговая история',s:['sellers','firm','files','deal','market']}
};
let role='Руководитель',cur='today',theme='light',curDeal='Д-2318',curFirm='F-07';
const MGR={NS:'Нурсултан',DM:'Дамир',AL:'Алия'};
const CITIES=['Астана','Алматы','Шымкент','Караганда','Атырау','Актобе','Павлодар','Усть-Каменогорск'];

/* Услуги и прайс */
const SERV=[
 {id:'S1',n:'Лицензия на СМР · III категория',g:'Лицензирование',pr:450000,duty:23000,days:'15–20 раб. дней'},
 {id:'S2',n:'Лицензия на СМР · II категория',g:'Лицензирование',pr:900000,duty:23000,days:'20–30 раб. дней'},
 {id:'S3',n:'Лицензия на СМР · I категория',g:'Лицензирование',pr:1900000,duty:23000,days:'30–45 раб. дней'},
 {id:'S4',n:'Проектная лицензия · III категория',g:'Лицензирование',pr:380000,duty:23000,days:'15–20 раб. дней'},
 {id:'S5',n:'Медицинская лицензия',g:'Лицензирование',pr:600000,duty:23000,days:'15 раб. дней'},
 {id:'S6',n:'Образовательная лицензия',g:'Лицензирование',pr:520000,duty:23000,days:'15 раб. дней'},
 {id:'S7',n:'Туристическая лицензия',g:'Лицензирование',pr:260000,duty:23000,days:'10 раб. дней'},
 {id:'S8',n:'Расширение подвидов СМР',g:'Лицензирование',pr:300000,duty:0,days:'10–15 раб. дней'},
 {id:'S9',n:'Покупка готовой фирмы — сопровождение сделки',g:'Готовые фирмы',pr:0,duty:0,days:'5–7 раб. дней'}
];
const SV=id=>SERV.find(s=>s.id===id);

/* Готовые фирмы на продажу (маркетплейс) */
const FIRMS=[
 {id:'F-01',n:'ТОО «Строй-Альянс Н»',city:'Астана',year:2016,lic:'СМР II категория · 14 подвидов',nds:1,turn:'1,2 млрд за 3 года',debt:'нет',price:6800000,st:'pub',seller:'Серик М.',views:214},
 {id:'F-02',n:'ТОО «Каз Проект Групп»',city:'Алматы',year:2019,lic:'Проектная II категория',nds:1,turn:'180 млн',debt:'нет',price:3200000,st:'pub',seller:'Галина П.',views:132},
 {id:'F-03',n:'ТОО «Нур Инжиниринг»',city:'Шымкент',year:2014,lic:'СМР I категория · 22 подвида',nds:1,turn:'3,8 млрд, госзакупки',debt:'нет',price:21500000,st:'pub',seller:'Ержан Т.',views:388},
 {id:'F-04',n:'ТОО «Медлайн Сервис»',city:'Караганда',year:2018,lic:'Медицинская',nds:0,turn:'—',debt:'нет',price:2400000,st:'pub',seller:'Айгуль С.',views:76},
 {id:'F-05',n:'ТОО «Атырау Монтаж»',city:'Атырау',year:2017,lic:'СМР II категория · 9 подвидов',nds:1,turn:'640 млн',debt:'проверка',price:5900000,st:'check',seller:'Марат Ж.',views:0},
 {id:'F-06',n:'ТОО «Евразия Тур»',city:'Алматы',year:2020,lic:'Туристическая',nds:0,turn:'—',debt:'нет',price:1100000,st:'pub',seller:'Динара К.',views:58},
 {id:'F-07',n:'ТОО «Сарыарка Строй Комплект»',city:'Астана',year:2015,lic:'СМР II категория · 18 подвидов',nds:1,turn:'2,1 млрд, 6 госконтрактов',debt:'нет',price:8900000,st:'pub',seller:'Бауыржан А.',views:296},
 {id:'F-08',n:'ТОО «Актобе Энерго Сервис»',city:'Актобе',year:2013,lic:'СМР I категория · электромонтаж',nds:1,turn:'4,4 млрд',debt:'нет',price:24000000,st:'deal',seller:'Виктор Л.',views:410},
 {id:'F-09',n:'ТОО «Павлодар Билд»',city:'Павлодар',year:2021,lic:'без лицензии · с НДС',nds:1,turn:'95 млн',debt:'нет',price:1350000,st:'pub',seller:'Олжас Б.',views:44},
 {id:'F-10',n:'ТОО «Алтай Проект»',city:'Усть-Каменогорск',year:2016,lic:'Проектная III категория',nds:0,turn:'40 млн',debt:'нет',price:1800000,st:'sold',seller:'Ирина В.',views:167}
];
const FI=id=>FIRMS.find(f=>f.id===id);

/* Воронка «Отдел продаж» — этапы как в amoCRM */
const ST=[
 {k:'new',n:'Новая заявка',c:'#7a7f86'},{k:'work',n:'Взято в работу',c:'#5d6f86'},{k:'qual',n:'Квалификация',c:'#3f6f8f'},
 {k:'dec',n:'Принятие решения',c:'#46708a'},{k:'agree',n:'Согласование',c:'#7d5a8c'},{k:'touch',n:'Точки касания',c:'#8c5a6c'},
 {k:'inv',n:'Счёт',c:'#a65a3c'},{k:'dog',n:'Договор',c:'#8c3b2f'},{k:'real',n:'Реализация',c:'#3d7a52'}
];
const STI=k=>ST.findIndex(s=>s.k===k),STN=k=>ST[STI(k)];
const SRC=['Сайт','Маркетплейс','Звонок','Мессенджер','Instagram','Рекомендация'];
const DEALS=[
 ['Д-2318','ТОО «КазСтройМонтаж»','Ерлан Жунусов','Астана','S2',null,'NS','touch',8,'Сайт','Хочет II категорию до тендера 1 ноября. Возражение: «дорого, у конкурентов 700».'],
 ['Д-2321','ИП Ахметова Г.','Гульмира Ахметова','Алматы','S6',null,'DM','qual',3,'Мессенджер','Учебный центр, нужна образовательная лицензия.'],
 ['Д-2322','ТОО «Алем Билд»','Тимур Касымов','Шымкент','S9','F-03','AL','dec',5,'Маркетплейс','Смотрит «Нур Инжиниринг» под госзакупки.'],
 ['Д-2324','ТОО «Гранд Проект»','Олег Ким','Караганда','S4',null,'NS','inv',6,'Звонок','Счёт выставлен 02.10.'],
 ['Д-2325','ТОО «Сапа Мед»','Айжан Нурлыбаева','Астана','S5',null,'DM','dog',9,'Рекомендация','Договор на подписи.'],
 ['Д-2327','ТОО «Береке Курылыс»','Бахыт Оспанов','Атырау','S1',null,'AL','agree',4,'Сайт','Согласует подвиды СМР с главным инженером.'],
 ['Д-2328','—','Данияр','Астана','S9','F-07','NS','work',1,'Маркетплейс','Заявка с маркетплейса: «Сарыарка Строй Комплект».'],
 ['Д-2329','ТОО «Нура Тур»','Сабина Ли','Алматы','S7',null,'DM','new',0,'Instagram',''],
 ['Д-2330','—','Аскар','Караганда','S2',null,'AL','new',0,'Сайт',''],
 ['Д-2331','ТОО «Достык Инжиниринг»','Руслан Беков','Павлодар','S8',null,'NS','qual',2,'Звонок','Расширение подвидов: электромонтаж.'],
 ['Д-2315','ТОО «Шанырак Строй»','Арман Абенов','Астана','S2',null,'NS','real',12,'Рекомендация','Документы поданы, ждём ответа 12.10.'],
 ['Д-2310','ТОО «Актау Сервис Групп»','Нурлан Еркин','Актобе','S9','F-08','AL','real',14,'Маркетплейс','Покупка «Актобе Энерго Сервис», переоформление.']
].map(a=>({id:a[0],co:a[1],ct:a[2],city:a[3],sv:a[4],firm:a[5],m:a[6],st:a[7],touch:a[8],src:a[9],note:a[10]}));
const DL=id=>DEALS.find(d=>d.id===id);
const dealSum=d=>d.firm?FI(d.firm).price+Math.round(FI(d.firm).price*.06):SV(d.sv).pr;

/* Предложения продать компанию */
const SELL=[
 {id:'P-41',n:'ТОО «Строй Лидер Астана»',who:'Канат Р.',city:'Астана',lic:'СМР II категория',ask:7500000,st:'in',d:'05.10'},
 {id:'P-40',n:'ТОО «Жетысу Проект»',who:'Алмаз Т.',city:'Алматы',lic:'Проектная II категория',ask:2900000,st:'docs',d:'03.10'},
 {id:'P-39',n:'ТОО «Атырау Монтаж»',who:'Марат Ж.',city:'Атырау',lic:'СМР II категория',ask:5900000,st:'check',d:'29.09'},
 {id:'P-38',n:'ТОО «Ертіс Курылыс»',who:'Сергей Н.',city:'Павлодар',lic:'СМР III категория',ask:2600000,st:'price',d:'25.09'},
 {id:'P-37',n:'ТОО «Сарыарка Строй Комплект»',who:'Бауыржан А.',city:'Астана',lic:'СМР II категория',ask:8900000,st:'pub',d:'18.09'},
 {id:'P-35',n:'ТОО «Алтай Проект»',who:'Ирина В.',city:'Усть-Каменогорск',lic:'Проектная III',ask:1800000,st:'sold',d:'02.09'}
];
const SST=[['in','Поступило'],['docs','Документы'],['check','Проверка юристом'],['price','Согласование цены'],['pub','На маркетплейсе'],['sold','Продана']];

/* Звонки за сегодня и неделю */
const CALLS=[
 {m:'NS',calls:46,out:38,miss:2,min:182,touch:21},{m:'DM',calls:31,out:22,miss:5,min:104,touch:12},{m:'AL',calls:39,out:30,miss:1,min:151,touch:17}
];
const DIST={mode:'even',spec:1,limit:12,sla:15,away:{AL:0,DM:0,NS:0}};
const LEADS_TODAY={NS:6,DM:6,AL:5};

const SC={};
const stg=k=>{const s=STN(k);return `<span class="stg" style="--sc:${s.c}">${s.n}</span>`};
const myDeals=()=>role==='Менеджер'?DEALS.filter(d=>d.m==='NS'):DEALS;
SC.today=()=>{const D=DEALS.filter(d=>d.st!=='real');const sum=D.reduce((a,d)=>a+dealSum(d),0);
 return `<div class="hd"><div><h2>Пульт · 5 октября</h2><p>Заявки, сделки, звонки и маркетплейс — одним экраном. Всё, что сейчас в amoCRM, плюс то, чего там не хватает: равномерное распределение, документы без лимита памяти, каталог фирм.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('distrib')"><small>Заявок сегодня</small><b>17</b><span>6 · 6 · 5 — поровну</span></div>
  <div class="clk" onclick="go('funnel')"><small>Сделок в работе</small><b>${D.length}</b><span>на ${mln(sum)}</span></div>
  <div class="clk" onclick="go('calls')"><small>Звонков сегодня</small><b>${CALLS.reduce((a,c)=>a+c.calls,0)}</b><span>${CALLS.reduce((a,c)=>a+c.min,0)} минут на линии</span></div>
  <div class="clk" onclick="go('market')"><small>На маркетплейсе</small><b class="a">${FIRMS.filter(f=>f.st==='pub').length}</b><span>фирм · ${FIRMS.reduce((a,f)=>a+f.views,0)} просмотров</span></div>
  <div class="clk" onclick="go('files')"><small>Документов</small><b>41 ГБ</b><span>без лимита памяти</span></div>
 </div>
 <div class="g21"><div class="pan"><h3>Воронка «Отдел продаж»</h3><div class="fl">${ST.map(s=>{const n=DEALS.filter(d=>d.st===s.k).length;return `<div onclick="go('funnel')" style="--sc:${s.c}"><b>${n}</b><span>${s.n}</span></div>`}).join('')}</div>
  <h3 style="margin-top:16px">Требует внимания</h3>
  <div class="rf bad" onclick="openDeal('Д-2329')"><i></i><div><b>Д-2329 · новая заявка без ответа 22 минуты</b><span>Дамир · срок взять в работу — 15 минут, заявка уйдёт следующему менеджеру через 3 минуты</span></div></div>
  <div class="rf" onclick="openDeal('Д-2318')"><i></i><div><b>Д-2318 · тендер 1 ноября — лицензия II категории</b><span>Нурсултан · возражение «дорого» · 8 касаний</span></div></div>
  <div class="rf" onclick="go('sellers')"><i></i><div><b>Новое предложение продать фирму · ТОО «Строй Лидер Астана»</b><span>СМР II категория · просят 7,5 млн · нужна проверка документов</span></div></div>
  <div class="rf" onclick="go('calls')"><i></i><div><b>Дамир: 5 пропущенных звонков</b><span>перезвонить до 17:00 — задачи созданы</span></div></div></div>
  <div class="pan"><h3>Менеджеры сегодня</h3>${CALLS.map(c=>`<div class="mg"><b>${MGR[c.m]}</b><span>${LEADS_TODAY[c.m]} заявок · ${c.calls} звонков · ${c.min} мин · ${c.touch} касаний</span><div class="bar"><i style="width:${pct(c.min,200)}%"></i></div></div>`).join('')}</div></div>
 ${said('«Есть недовольство: бывают технические сбои, память заканчивается — просят купить пакет, он ещё дороже стоит».','Платон: своя система на вашем сервере — память и количество сотрудников не ограничены искусственно.')}`};

SC.funnel=()=>{const L=myDeals();return `<div class="hd"><div><h2>Воронка «Отдел продаж»${role==='Менеджер'?' · мои':''}</h2><p>Этапы как у вас в amoCRM: новая заявка → взято в работу → квалификация → принятие решения → согласование → точки касания → счёт → договор → реализация. На карточке — услуга, город, сумма и число касаний.</p></div><div class="btns"><button class="bt p" onclick="card('newlead')">+ Заявка</button></div></div>
 <div class="kb">${ST.map(s=>{const X=L.filter(d=>d.st===s.k);return `<div class="kc" style="--sc:${s.c}"><div class="kh"><b>${s.n}</b><span>${X.length}</span></div>${X.map(d=>`<div class="kd ${d.st==='new'&&d.id==='Д-2329'?'alarm':''}" onclick="openDeal('${d.id}')"><div class="kt"><b>${d.id}</b><span class="src">${d.src}</span></div><div class="kr">${esc(d.co!=='—'?d.co:d.ct)}</div><div class="km">${esc(SV(d.sv).n)}${d.firm?' · '+esc(FI(d.firm).n):''}</div><div class="kf"><span>${MGR[d.m]} · ${d.city}</span><b class="mono">${mln(dealSum(d))}</b></div></div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>
 <div class="note"><b>Постоянные клиенты</b><p>Повторный клиент больше не заходит как «новая заявка»: система узнаёт его по телефону или БИН и создаёт сделку сразу у его менеджера, с историей прошлых услуг. Отдельный экран — «Постоянные клиенты».</p></div>`};

function openDeal(id){if(!allowed('deal')){toast('Карточка сделки этой роли недоступна.');return}curDeal=id;go('deal')}
SC.deal=()=>{const d=DL(curDeal)||DEALS[0];const s=SV(d.sv);const f=d.firm?FI(d.firm):null;const si=STI(d.st);
 return `<div class="hd"><div><div class="crumb"><a onclick="go('funnel')">Воронка</a> / ${d.id}</div><h2>${d.id} · ${esc(d.co!=='—'?d.co:d.ct)}</h2><p>${esc(s.n)} · ${d.city} · источник: ${d.src} · менеджер ${MGR[d.m]}</p></div><div class="btns">${d.st!=='real'?`<button class="bt p" onclick="nextSt('${d.id}')">→ ${ST[si+1].n}</button>`:''}<button class="bt" onclick="go('kp')">КП и договор</button></div></div>
 <div class="stp">${ST.map((x,i)=>`<div class="${i<si?'ok':i===si?'on':''}" style="--sc:${x.c}"><i>${i<si?'✓':i+1}</i><span>${x.n}</span></div>`).join('')}</div>
 <div class="g3">
  <div class="pan"><h3>Клиент</h3><div class="kv"><span>Компания</span><b>${esc(d.co)}</b></div><div class="kv"><span>Контакт</span><b>${esc(d.ct)}</b></div><div class="kv"><span>Телефон</span><b class="mono">+7 7** *** ${d.id.slice(-2)} 14</b></div><div class="kv"><span>Город</span><b>${d.city}</b></div><div class="kv"><span>Касаний</span><b>${d.touch}</b></div>${d.note?`<div class="pin">${esc(d.note)}</div>`:''}</div>
  <div class="pan"><h3>Услуга и цена</h3><div class="kv"><span>Услуга</span><b>${esc(s.n)}</b></div>${f?`<div class="kv"><span>Фирма</span><b class="lk" onclick="curFirm='${f.id}';go('firm')">${esc(f.n)}</b></div><div class="kv"><span>Цена фирмы</span><b class="mono">${fmt(f.price)}</b></div><div class="kv"><span>Сопровождение 6 %</span><b class="mono">${fmt(f.price*.06)}</b></div>`:`<div class="kv"><span>Сопровождение</span><b class="mono">${fmt(s.pr)}</b></div><div class="kv"><span>Госпошлина</span><b class="mono">${fmt(s.duty)}</b></div><div class="kv"><span>Срок</span><b>${s.days}</b></div>`}<div class="kv"><span>Итого</span><b class="mono pos">${fmt(dealSum(d))}</b></div><button class="bt sm" onclick="go('prices')">Пересчитать в калькуляторе</button></div>
  <div class="pan"><h3>Документы клиента</h3>${['Устав и свидетельство.pdf · 4,2 МБ','Справка о госрегистрации.pdf · 0,8 МБ','Дипломы ИТР — 6 файлов · 38 МБ','Трудовые договоры ИТР.zip · 112 МБ','Сканы техники и базы.zip · 640 МБ'].map(x=>`<div class="fd"><i></i><span>${x}</span></div>`).join('')}<button class="bt sm" onclick="toast('Файлы загружены — лимита памяти нет.')">+ Файлы</button></div>
 </div>
 <div class="g2"><div class="pan"><h3>Мессенджер</h3><div class="chat">${(CHATS[d.id]||CHATS.def).map(m=>`<div class="msg ${m[0]}"><small>${m[1]}</small>${esc(m[2])}</div>`).join('')}</div><button class="bt sm" onclick="curDeal='${d.id}';go('chat')">Открыть переписку →</button></div>
 <div class="pan"><h3>Звонки и касания</h3>${[['исх.','05.10 11:42','4:18','обсудили подвиды СМР, отправили КП'],['вход.','03.10 15:06','2:51','уточнил сроки'],['исх.','01.10 10:20','6:02','квалификация: тендер, бюджет'],['исх.','30.09 17:10','—','не дозвонились']].map(c=>`<div class="cl"><span class="tag">${c[0]}</span><b>${c[1]}</b><span>${c[2]}</span><em>${c[3]}</em>${c[2]!=='—'?`<a class="lk" onclick="toast('Запись разговора воспроизводится.')">запись</a>`:''}</div>`).join('')}
  <h3 style="margin-top:12px">Возражение</h3><div class="pin">«Дорого, у конкурентов 700» → ответ из базы возражений: что входит (ИТР, техника, база), гарантия получения, срок до тендера.</div></div></div>`};
function nextSt(id){const d=DL(id);d.st=ST[STI(d.st)+1].k;d.touch++;render();toast(`${d.id} → «${STN(d.st).n}».`+(d.st==='inv'?' Счёт сформирован из прайса.':d.st==='dog'?' Договор собран из сделки — отправьте на подпись.':d.st==='real'?' Юристу ушла задача на подачу документов.':''))}

SC.distrib=()=>{const A=Object.keys(MGR);return `<div class="hd"><div><h2>Распределение заявок</h2><p>Заявки с сайта, маркетплейса, мессенджера и звонков раздаются по правилам — без перекоса. Не взял в работу за 15 минут — заявка уходит следующему. Кто в отпуске или на больничном — пропускается.</p></div></div>
 <div class="g2"><div class="pan"><h3>Правила</h3>
  <div class="srow"><span class="nm"><b>Режим</b><br><span class="mini">${DIST.mode==='even'?'поровну — у кого меньше заявок за день':'по очереди'}</span></span><span class="seg"><a class="${DIST.mode==='even'?'on':''}" onclick="DIST.mode='even';render()">поровну</a><a class="${DIST.mode==='rr'?'on':''}" onclick="DIST.mode='rr';render()">по очереди</a></span></div>
  <div class="srow"><span class="nm"><b>Учитывать специализацию</b><br><span class="mini">СМР — Нурсултан и Алия, медицина и образование — Дамир; если специалист загружен — любому</span></span><span class="sw ${DIST.spec?'on':''}" onclick="DIST.spec=DIST.spec?0:1;render()"></span></div>
  <div class="srow"><span class="nm"><b>Взять в работу за</b> ${DIST.sla} мин<br><span class="mini">иначе заявка переходит следующему, РОП получает уведомление</span></span></div>
  <div class="srow"><span class="nm"><b>Не больше</b> ${DIST.limit} новых заявок в день на менеджера</span></div>
  <h3 style="margin-top:14px">Кто сегодня принимает</h3>${A.map(k=>`<div class="srow"><span class="nm">${MGR[k]}</span><span class="sw ${DIST.away[k]?'':'on'}" onclick="DIST.away['${k}']=DIST.away['${k}']?0:1;render();toast(DIST.away['${k}']?'${MGR[k]} не получает новые заявки.':'${MGR[k]} снова в распределении.')"></span></div>`).join('')}</div>
 <div class="pan"><h3>Сегодня</h3>${A.map(k=>`<div class="hb"><span>${MGR[k]}${DIST.away[k]?' · не принимает':''}</span><i style="width:${LEADS_TODAY[k]*14}%"></i><b class="mono">${LEADS_TODAY[k]}</b></div>`).join('')}
  <h3 style="margin-top:14px">Журнал</h3>${[['16:02','Д-2330 · сайт · Караганда','Алия','у неё меньше всех за день'],['15:48','Д-2329 · Instagram','Дамир','турлицензия — специализация'],['15:31','Д-2328 · маркетплейс','Нурсултан','Нурсултан ведёт продавца этой фирмы'],['15:10','Д-2326 · звонок','Дамир → Нурсултан','не взял за 15 минут']].map(r=>`<div class="lg"><span class="mono">${r[0]}</span><b>${r[1]}</b><span>→ ${r[2]}</span><em>${r[3]}</em></div>`).join('')}
  <button class="bt p" style="margin-top:10px" onclick="testLead()">Пришла новая заявка</button></div></div>
 ${said('«Распределение неравномерно идёт: одному менеджеру больше заявок падает — на это жалуются».','Платон: этот функционал пропишем полностью — как распределять.')}`};
function testLead(){const A=Object.keys(MGR).filter(k=>!DIST.away[k]);if(!A.length){toast('Никто не принимает заявки.');return}const k=A.sort((a,b)=>LEADS_TODAY[a]-LEADS_TODAY[b])[0];LEADS_TODAY[k]++;const id='Д-'+(2332+DEALS.length-12);DEALS.unshift({id,co:'—',ct:'Новый клиент',city:'Астана',sv:'S1',firm:null,m:k,st:'new',touch:0,src:'Сайт',note:''});render();toast(`${id} с сайта → ${MGR[k]}: у него меньше всех заявок за день. Пуш на телефон отправлен.`)}

SC.sellers=()=>`<div class="hd"><div><h2>Продают компанию</h2><p>Отдельная воронка для тех, кто сам предлагает продать свою фирму: документы, проверка юристом, согласование цены — и одной кнопкой на маркетплейс и сайт.</p></div><div class="btns"><button class="bt p" onclick="card('sell')">+ Предложение</button></div></div>
 <div class="kb s6">${SST.map(([k,n])=>{const X=SELL.filter(p=>p.st===k);return `<div class="kc" style="--sc:#7a2e3b"><div class="kh"><b>${n}</b><span>${X.length}</span></div>${X.map(p=>`<div class="kd" onclick="sellNext('${p.id}')"><div class="kt"><b>${p.id}</b><span class="src">${p.d}</span></div><div class="kr">${esc(p.n)}</div><div class="km">${esc(p.lic)} · ${p.city}</div><div class="kf"><span>${esc(p.who)}</span><b class="mono">${mln(p.ask)}</b></div></div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>
 <div class="g2"><div class="note"><b>Проверка юристом</b><p>Чек-лист: учредительные документы, налоговая задолженность, судебные дела, действующие лицензии и подвиды, ИТР и техника, госконтракты. Пока юрист не закрыл — на маркетплейс не попадёт.</p></div><div class="note"><b>Клик по карточке</b><p>двигает её на следующий этап — так в демо видно, как фирма доходит до маркетплейса.</p></div></div>
 ${said('«Нам часто поступают предложения от клиентов: они хотят свои компании продать — с ними тоже работаем».')}`;
function sellNext(id){const p=SELL.find(x=>x.id===id);const i=SST.findIndex(x=>x[0]===p.st);if(i>=SST.length-2){toast('Фирма уже на маркетплейсе или продана.');return}p.st=SST[i+1][0];if(p.st==='pub'&&!FIRMS.some(f=>f.n===p.n))FIRMS.unshift({id:'F-'+(FIRMS.length+1),n:p.n,city:p.city,year:2018,lic:p.lic,nds:1,turn:'по документам',debt:'нет',price:p.ask,st:'pub',seller:p.who,views:0});render();toast(p.st==='pub'?`${p.n} опубликована на маркетплейсе и на сайте.`:`${p.id} → «${SST[i+1][1]}».`)}

SC.repeat=()=>`<div class="hd"><div><h2>Постоянные клиенты</h2><p>Клиент, который уже получал у вас лицензию, не теряется среди новых заявок. Система узнаёт его по телефону или БИН, показывает историю и подсказывает, что ему предложить: расширение подвидов, продление, повышение категории.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Город</th><th>Что получал</th><th>Последняя услуга</th><th>Что предложить</th><th>Менеджер</th></tr></thead><tbody>${[['ТОО «Шанырак Строй»','Астана','СМР III → II категория','12.10.2026 · в работе','СМР I категория через год','Нурсултан'],['ТОО «Сапа Мед»','Астана','Медицинская лицензия','2025','Расширение видов помощи','Дамир'],['ТОО «Алматы Монтаж Сервис»','Алматы','СМР II, 2 расширения','03.2026','Подвиды «электромонтаж»','Алия'],['ТОО «Орда Проект»','Астана','Проектная III','11.2025','Повышение до II категории','Нурсултан'],['ТОО «Кокше Курылыс»','Кокшетау','Покупка готовой фирмы','06.2026','Расширение подвидов СМР','Алия']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td class="mono">${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td></tr>`).join('')}</tbody></table></div>
 ${said('«Постоянные клиенты тоже у нас есть — пока не делали, чтобы они заново поступали: они к нам поступают как новая заявка снова».')}`;

/* ===== Каталог и цены ===== */
let mkCity='Все',mkLic='Все';
SC.market=()=>{const L=FIRMS.filter(f=>f.st!=='sold'&&(mkCity==='Все'||f.city===mkCity)&&(mkLic==='Все'||f.lic.includes(mkLic)));
 return `<div class="hd"><div><h2>Маркетплейс готовых фирм</h2><p>Тот же каталог, что у вас на сайте: город, лицензия, год, НДС, оборот, цена. Фирма из воронки «Продают компанию» публикуется одной кнопкой; заявка с сайта по фирме падает сразу в сделку с этой фирмой.</p></div><div class="btns"><select class="rsel" onchange="mkCity=this.value;render()">${['Все'].concat(CITIES).map(c=>`<option ${c===mkCity?'selected':''}>${c}</option>`).join('')}</select><select class="rsel" onchange="mkLic=this.value;render()">${['Все','СМР I','СМР II','Проектная','Медицинская','Туристическая'].map(c=>`<option ${c===mkLic?'selected':''}>${c}</option>`).join('')}</select></div></div>
 <div class="mk">${L.map(f=>`<div class="fc ${f.st}" onclick="curFirm='${f.id}';go('firm')"><div class="fh"><span class="mono">${f.id}</span>${f.st==='check'?'<span class="tag w">проверка</span>':f.st==='deal'?'<span class="tag a">в сделке</span>':'<span class="tag g">на сайте</span>'}</div><b>${esc(f.n)}</b><span>${f.city} · с ${f.year} г. · ${f.nds?'с НДС':'без НДС'}</span><em>${esc(f.lic)}</em><div class="fp"><strong>${tg(f.price)}</strong><small>${f.views} просмотров</small></div></div>`).join('')||'<p class="mini">Ничего не найдено.</p>'}</div>
 ${said('«Создали маркетплейс для компании… кто хочет купить, зайдёт в каталог, выберет город, какую компанию хочет с лицензией — и сразу может написать либо позвонить».')}`};
SC.firm=()=>{const f=FI(curFirm)||FIRMS[0];const D=DEALS.filter(d=>d.firm===f.id);
 return `<div class="hd"><div><div class="crumb"><a onclick="go('market')">Маркетплейс</a> / ${f.id}</div><h2>${esc(f.n)}</h2><p>${f.city} · зарегистрирована в ${f.year} г. · продавец ${esc(f.seller)}</p></div><div class="btns"><button class="bt p" onclick="toast('Ссылка на фирму отправлена клиенту в мессенджер.')">Отправить клиенту</button></div></div>
 <div class="g3"><div class="pan"><h3>Фирма</h3>${[['Лицензия',esc(f.lic)],['НДС',f.nds?'плательщик':'нет'],['Оборот',esc(f.turn)],['Налоговая задолженность',esc(f.debt)],['Судебные дела','нет'],['ИТР в штате','4 человека, дипломы приложены'],['Цена продавца',tg(f.price)],['Ваше сопровождение · 6 %',tg(f.price*.06)]].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Проверка юристом</h3><div class="chk">${['Учредительные документы','Налоговая задолженность — справка','Судебные дела — проверка по ИИН/БИН','Лицензия и подвиды в реестре','ИТР и техника','Госконтракты и отзывы заказчиков'].map((x,i)=>`<div class="ci"><span class="bx ${f.st==='check'&&i>2?'':'on'}">${f.st==='check'&&i>2?'':'✓'}</span><span class="nm">${x}</span><span class="who">Асем</span></div>`).join('')}</div></div>
 <div class="pan"><h3>Интерес покупателей</h3><div class="kv"><span>Просмотров на сайте</span><b>${f.views}</b></div><div class="kv"><span>Заявок</span><b>${D.length+(f.views>200?3:1)}</b></div>${D.map(d=>`<div class="kv clk" onclick="openDeal('${d.id}')"><span>${d.id} · ${esc(d.co!=='—'?d.co:d.ct)}</span><b>${STN(d.st).n}</b></div>`).join('')}<h3 style="margin-top:12px">Документы</h3>${['Устав.pdf','Выписка из реестра лицензий.pdf','Финотчётность 2023–2025.zip · 84 МБ','Госконтракты.zip · 210 МБ'].map(x=>`<div class="fd"><i></i><span>${x}</span></div>`).join('')}</div></div>`};

const CALC={sv:'S2',city:'Астана',extra:0,urgent:0,itr:0,disc:0};
function setC(k,v){CALC[k]=isNaN(+v)?v:+v;render()}
function calcTot(){const s=SV(CALC.sv);let base=s.pr||0;const ex=CALC.extra*60000,ur=CALC.urgent?Math.round(base*.25):0,itr=CALC.itr*120000;const sub=base+ex+ur+itr;const disc=Math.round(sub*CALC.disc/100);return {s,base,ex,ur,itr,disc,duty:s.duty,tot:sub-disc+s.duty}}
SC.prices=()=>{const T=calcTot();return `<div class="hd"><div><h2>Прайс и калькулятор</h2><p>Ваши прайсы и таблицы — внутри CRM. Менеджер выбирает услугу, город и опции — цена, госпошлина и срок считаются сами и сразу идут в КП, счёт и договор.</p></div><div class="btns"><button class="bt p" onclick="go('kp');toast('КП собрано из расчёта.')">Сформировать КП →</button></div></div>
 <div class="cg"><div class="pan"><div class="cform">
  <label>Услуга<select onchange="setC('sv',this.value)">${SERV.filter(s=>s.pr).map(s=>`<option value="${s.id}" ${s.id===CALC.sv?'selected':''}>${esc(s.n)}</option>`).join('')}</select></label>
  <label>Город<select onchange="setC('city',this.value)">${CITIES.map(c=>`<option ${c===CALC.city?'selected':''}>${c}</option>`).join('')}</select></label>
  <label>Доп. подвиды СМР, шт<input type="number" value="${CALC.extra}" onchange="setC('extra',this.value)"></label>
  <label>Подбор ИТР, человек<input type="number" value="${CALC.itr}" onchange="setC('itr',this.value)"></label>
  <label>Срочно, +25 %<select onchange="setC('urgent',this.value)"><option value="0" ${!CALC.urgent?'selected':''}>нет</option><option value="1" ${CALC.urgent?'selected':''}>да</option></select></label>
  <label>Скидка, %<input type="number" value="${CALC.disc}" onchange="setC('disc',this.value)"></label>
 </div></div>
 <div class="pan"><h3>Итог</h3><div class="wf"><div><span>${esc(T.s.n)}</span><b>${fmt(T.base)}</b></div>${T.ex?`<div><span>Подвиды × ${CALC.extra}</span><b>${fmt(T.ex)}</b></div>`:''}${T.itr?`<div><span>Подбор ИТР × ${CALC.itr}</span><b>${fmt(T.itr)}</b></div>`:''}${T.ur?`<div><span>Срочность</span><b>${fmt(T.ur)}</b></div>`:''}${T.disc?`<div><span>Скидка ${CALC.disc} %</span><b class="neg">− ${fmt(T.disc)}</b></div>`:''}<div><span>Госпошлина</span><b>${fmt(T.duty)}</b></div><div class="tot"><span>Клиенту</span><b>${fmt(T.tot)}</b></div></div><p class="mini">Срок: ${T.s.days}${CALC.urgent?' — сокращаем на треть':''}.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Прайс</th><th>Направление</th><th class="r">Сопровождение</th><th class="r">Госпошлина</th><th>Срок</th></tr></thead><tbody>${SERV.map(s=>`<tr><td><b>${esc(s.n)}</b></td><td>${s.g}</td><td class="r mono">${s.pr?fmt(s.pr):'6 % от цены фирмы'}</td><td class="r mono">${s.duty?fmt(s.duty):'—'}</td><td>${s.days}</td></tr>`).join('')}</tbody></table></div>
 ${said('«Хотелось бы в эту CRM добавить наши прайсы… таблицы тоже добавлять, чтобы удобно было».','Платон: прайсы и калькуляторы внутри сделки входят в стандартный пакет.')}`};
SC.kp=()=>{const T=calcTot();const d=DL(curDeal)||DEALS[0];return `<div class="hd"><div><h2>КП и договор</h2><p>КП собирается из калькулятора, счёт и договор — из сделки: реквизиты клиента, услуга, сумма, сроки. Отправка в мессенджер одной кнопкой; подпись ЭЦП по ссылке.</p></div></div>
 <div class="g2"><div class="pan"><h3>КП · ${d.id}</h3><div class="doc"><div class="dh"><div class="dlg">РЕЕСТР<small>ЛИЦЕНЗИРОВАНИЕ · ГОТОВЫЕ ФИРМЫ</small></div><div style="text-align:right;font-size:10px">КП № ${d.id}<br>05.10.2026</div></div><h4>Коммерческое предложение</h4><p style="font-size:11px">${esc(d.co!=='—'?d.co:d.ct)} · ${CALC.city}</p><div class="drow"><span>Услуга</span><span>${esc(T.s.n)}</span><span class="r">${fmt(T.base)}</span></div>${T.ex?`<div class="drow"><span>Подвиды</span><span>${CALC.extra} шт</span><span class="r">${fmt(T.ex)}</span></div>`:''}<div class="drow"><span>Госпошлина</span><span>по закону</span><span class="r">${fmt(T.duty)}</span></div><div class="dsum"><span>Итого</span><span>${tg(T.tot)}</span></div><div class="dfoot"><span>Срок — ${T.s.days}. Оплата: 50 % при подписании, 50 % при получении лицензии.</span></div></div><div class="btns l" style="margin-top:10px"><button class="bt p" onclick="toast('КП отправлено клиенту в мессенджер из карточки.')">Отправить в мессенджер</button></div></div>
 <div class="pan"><h3>Договор и счёт</h3>${[['Договор оказания услуг — из шаблона','ok'],['Реквизиты клиента подставлены по БИН','ok'],['Счёт на 50 % предоплаты','ok'],['Подпись клиента ЭЦП по ссылке','wait'],['Акт после получения лицензии','wait']].map(x=>`<div class="li ${x[1]==='ok'?'':'w'}"><i>${x[1]==='ok'?'✓':'…'}</i><span>${x[0]}</span></div>`).join('')}<div class="btns l" style="margin-top:10px"><button class="bt p" onclick="toast('Договор отправлен на подпись ЭЦП, сделка → «Договор».')">Отправить на подпись</button></div></div></div>`};

/* ===== Связь ===== */
const CHATS={
 'Д-2318':[['in','Ерлан · 10:12','Добрый день, по II категории — сколько по срокам? Тендер 1 ноября.'],['out','Нурсултан · 10:20','Ерлан, 20–30 рабочих дней. Чтобы успеть, подаём до 9 октября — нужны дипломы ИТР.'],['in','Ерлан · 10:31','У конкурентов 700 тысяч, у вас 900. Почему?'],['out','Нурсултан · 10:44','В нашу цену входят подбор ИТР и проверка базы — без этого откажут. Отправил КП с расчётом.']],
 'Д-2329':[['in','Сабина · 15:48','Здравствуйте! Нужна туристическая лицензия, сколько стоит?']],
 def:[['sys','авто','Заявка принята. Менеджер свяжется в течение 15 минут.'],['in','клиент','Добрый день, нужна консультация']]};
SC.chat=()=>{const d=DL(curDeal)||DEALS[0];const T=Object.keys(CHATS).filter(k=>k!=='def');
 return `<div class="hd"><div><h2>Мессенджер</h2><p>Номер подключается через провайдера, который сейчас у вас вместо заблокированного WhatsApp — или любого другого с API. Вся переписка в карточке сделки, руководитель видит, кто и когда ответил.</p></div></div>
 <div class="g12"><div class="pan"><h3>Чаты</h3>${T.map(k=>{const L=CHATS[k],x=DL(k),last=L[L.length-1];return `<div class="ch ${k===d.id?'on':''}" onclick="curDeal='${k}';render()"><b>${esc(x.ct)} · ${k}</b><span>${esc(last[2]).slice(0,58)}</span>${last[0]==='in'?'<em>ждёт ответа</em>':''}</div>`}).join('')}</div>
 <div class="pan"><h3>${esc(d.ct)} · ${d.id} · ${MGR[d.m]}</h3><div class="chat">${(CHATS[d.id]||CHATS.def).map(m=>`<div class="msg ${m[0]}"><small>${m[1]}</small>${esc(m[2])}</div>`).join('')}</div><div class="wain"><input id="ch_t" value="Добрый день! Отправляю КП по вашей заявке."><button class="bt p" onclick="chSend('${d.id}')">Отправить</button></div></div></div>
 ${said('«WhatsApp нас заблокировал — они же неофициально с Метой работают… нужно узнать, сможем ли проинтегрироваться».','Платон: перенесём и проинтегрируемся.')}`};
function chSend(id){const el=document.getElementById('ch_t');if(!el)return;CHATS[id]=(CHATS[id]||CHATS.def.slice()).concat([['out',ROLES[role].n+' · '+NOW,el.value]]);render();toast('Сообщение отправлено и сохранено в сделке.')}
SC.calls=()=>`<div class="hd"><div><h2>Звонки</h2><p>Телефония в карточке: звонок из CRM в один клик, входящий открывает карточку клиента, записи разговоров в сделке. Сколько звонков, сколько минут на линии, сколько касаний — по каждому менеджеру. Sipuni или новый оператор — любой с API.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Менеджер</th><th class="r">Звонков</th><th class="r">Исходящих</th><th class="r">Пропущено</th><th class="r">Минут на линии</th><th class="r">Средний</th><th class="r">Касаний</th></tr></thead><tbody>${CALLS.map(c=>`<tr><td><b>${MGR[c.m]}</b></td><td class="r mono">${c.calls}</td><td class="r mono">${c.out}</td><td class="r mono ${c.miss>3?'neg':''}">${c.miss}</td><td class="r mono">${c.min}</td><td class="r mono">${(c.min/c.calls).toFixed(1).replace('.',',')} мин</td><td class="r mono">${c.touch}</td></tr>`).join('')}</tbody></table></div>
 <div class="g2"><div class="pan"><h3>Пропущенные</h3>${[['15:52','+7 701 *** 44 21','Дамир','новый номер → заявка создана'],['15:20','+7 777 *** 08 93','Дамир','ТОО «Сапа Мед» → задача перезвонить'],['14:05','+7 705 *** 61 30','Нурсултан','перезвонил 14:09']].map(r=>`<div class="lg"><span class="mono">${r[0]}</span><b>${r[1]}</b><span>${r[2]}</span><em>${r[3]}</em></div>`).join('')}</div>
 <div class="pan"><h3>Сейчас</h3><div class="live"><i></i><div><b>Нурсултан на линии · 3:12</b><span>ТОО «Гранд Проект» · Д-2324 · карточка открыта автоматически</span></div></div><p class="mini">Связь — через вашего оператора; если сейчас меняете Sipuni на другого, подключим нового.</p></div></div>
 ${said('«Аналитику часто смотрим: звонки, сколько на линии проводят менеджеры, сколько касаний делают».')}`;

/* ===== Документы ===== */
SC.files=()=>`<div class="hd"><div><h2>Хранилище документов</h2><p>Тяжёлые документы — дипломы ИТР, архивы техники, госконтракты — лежат в сделке и в карточке фирмы. Никаких пакетов памяти: место на вашем сервере, расширяется за час.</p></div></div>
 <div class="wid"><div><small>Занято</small><b>41 ГБ</b><span>из 200 ГБ на сервере</span></div><div><small>Файлов</small><b>18 640</b><span>в 2 310 сделках</span></div><div><small>Самый большой</small><b>640 МБ</b><span>сканы техники.zip</span></div><div><small>Стоимость места</small><b class="g">≈ 5 $</b><span>в месяц за +100 ГБ</span></div><div><small>Удалять старое</small><b>не нужно</b><span>всё хранится</span></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Папка</th><th class="r">Файлов</th><th class="r">Размер</th><th>Кто видит</th></tr></thead><tbody>${[['Сделки · лицензирование','12 480','26,4 ГБ','менеджер сделки, РОП, юрист'],['Фирмы на продажу','3 210','11,2 ГБ','юрист, руководитель; менеджеру — после публикации'],['Шаблоны договоров и КП','64','0,1 ГБ','все'],['Архив из amoCRM','2 886','3,3 ГБ','руководитель']].map(r=>`<tr><td><b>${r[0]}</b></td><td class="r mono">${r[1]}</td><td class="r mono">${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div>
 ${said('«Файлы отправляют — у нас же документы в основном, тяжёлые документы — они сохраняются, приходится удалять их».','Платон: до 10 ГБ сервер бесплатный, дальше — около 5 долларов; ограничения у них искусственные.')}`;

SC.analytics=()=>`<div class="hd"><div><h2>Аналитика отдела</h2><p>Конверсия по этапам, источники, города и услуги, звонки и касания по менеджерам — те же отчёты, что вы смотрите в amoCRM, плюс маркетплейс.</p></div></div>
 <div class="wid"><div><small>Заявок в сентябре</small><b>412</b><span>+14 % к августу</span></div><div><small>Сделок закрыто</small><b class="a">38</b><span>на 41,6 млн ₸</span></div><div><small>Конверсия</small><b>9,2 %</b><span>заявка → реализация</span></div><div><small>Средний чек</small><b>1,09 млн</b><span>лицензирование</span></div><div><small>С маркетплейса</small><b class="g">61</b><span>заявка за месяц</span></div></div>
 <div class="g2"><div class="pan"><h3>Воронка · сентябрь</h3>${[['Новая заявка',412],['Взято в работу',398],['Квалификация',214],['Принятие решения',122],['Согласование',88],['Точки касания',71],['Счёт',52],['Договор',44],['Реализация',38]].map(x=>`<div class="hb"><span>${x[0]}</span><i style="width:${pct(x[1],412)}%"></i><b class="mono">${x[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Источники</h3>${[['Сайт',168],['Маркетплейс',61],['Звонок',74],['Мессенджер',58],['Instagram',31],['Рекомендация',20]].map(x=>`<div class="hb"><span>${x[0]}</span><i style="width:${pct(x[1],168)}%"></i><b class="mono">${x[1]}</b></div>`).join('')}<h3 style="margin-top:14px">Услуги</h3>${[['СМР II категория',14],['СМР III категория',9],['Готовые фирмы',6],['Проектная',4],['Медицинская',3],['Прочее',2]].map(x=>`<div class="hb"><span>${x[0]}</span><i style="width:${pct(x[1],14)}%;background:var(--acc)"></i><b class="mono">${x[1]}</b></div>`).join('')}</div></div>`;

/* ===== Система ===== */
SC.roles=()=>{const A=[['Все воронки и сделки',['EL','AI']],['Свои сделки',['EL','AI','NS']],['Распределение заявок',['EL','AI']],['Маркетплейс и фирмы',['EL','AI','NS','AS']],['Проверка фирм юристом',['EL','AS']],['Прайс и калькулятор',['EL','AI','NS']],['Звонки и записи',['EL','AI','NS']],['Аналитика отдела',['EL','AI']],['Настройки и права',['EL']]];const R=Object.entries(ROLES);
 return `<div class="hd"><div><h2>Роли и права</h2><p>Каждый входит под своим логином. Менеджер видит свои сделки, РОП — весь отдел, юрист — документы и проверку фирм. Сотрудников сколько угодно — без доплаты за пользователя.</p></div></div>
 <div class="tw"><table class="t mx"><thead><tr><th>Раздел</th>${R.map(([k,v])=>`<th class="c">${v.av}<span>${esc(k)}</span></th>`).join('')}</tr></thead><tbody>${A.map(a=>`<tr><td>${a[0]}</td>${R.map(([k,v])=>`<td class="c">${a[1].includes(v.p)?'<b class="pos">●</b>':'<span class="mini">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
 <div class="g2">${R.map(([k,v])=>`<div class="pan"><h3>${esc(k)} · ${esc(v.n)}</h3><p class="mini">${esc(v.note)}</p></div>`).join('')}</div>`};
SC.mobile=()=>`<div class="hd"><div><h2>С телефона</h2><p>Мобильная версия в браузере: ссылка сохраняется на экран как приложение, пуш-уведомления приходят, даже когда она закрыта. Отдельное приложение из магазина не нужно — оно в 2 раза дороже.</p></div></div>
 <div class="phones"><div class="phone"><div class="pht"><b>Нурсултан</b><small>мои сделки</small></div><div class="pb">${DEALS.filter(d=>d.m==='NS'&&d.st!=='real').map(d=>`<div class="pi"><span>${d.id} ${esc((d.co!=='—'?d.co:d.ct).slice(0,22))}<small>${STN(d.st).n}</small></span><b>${mln(dealSum(d))}</b></div>`).join('')}<div class="pbtn" onclick="go('funnel')">Открыть воронку</div></div></div>
 <div class="phone"><div class="pht"><b>Пуш-уведомления</b><small>экран блокировки</small></div><div class="pb"><div class="push"><b>РЕЕСТР · сейчас</b><span>Новая заявка Д-2330 с сайта — Караганда, СМР II. Взять в работу за 15 минут.</span></div><div class="push"><b>РЕЕСТР · 15:48</b><span>Клиент написал в мессенджер: «У конкурентов 700 тысяч…»</span></div><div class="push"><b>РЕЕСТР · 14:20</b><span>Пропущенный звонок +7 777 *** 08 93 — ТОО «Сапа Мед».</span></div></div></div></div>
 ${said('«Есть какое-то приложение, чтобы через мобильное устройство могли пользоваться?»','Платон: мобильная версия в браузере и пуш-уведомления — главное; приложение — по необходимости, оно в два раза дороже.')}`;
SC.move=()=>`<div class="hd"><div><h2>Переезд с amoCRM</h2><p>Переносим воронки с этапами, сделки, контакты и компании, задачи, примечания и файлы. Пока amoCRM оплачена — работаете параллельно, отключаете, когда удобно.</p></div></div>
 <div class="mvs">${[['1','Выгрузка из amoCRM','сделки, контакты, компании, файлы','ok'],['2','Воронки и этапы','«Отдел продаж», предложения, постоянные','ok'],['3','Поля и теги','услуга, город, источник, категория','on'],['4','Загрузка и сверка','вы проверяете, что всё на месте',''],['5','Переключение','сайт, маркетплейс, мессенджер, телефония — на новую систему','']].map(s=>`<div class="mv ${s[3]}"><i>${s[3]==='ok'?'✓':s[0]}</i><b>${s[1]}</b><span>${s[2]}</span></div>`).join('')}</div>
 <div class="wid"><div><small>Сделок</small><b>2 310</b><span>за всё время</span></div><div><small>Контактов</small><b>3 870</b><span>и 1 940 компаний</span></div><div><small>Файлов</small><b>3,3 ГБ</b><span>из сделок</span></div><div><small>amoCRM сейчас</small><b class="r">≈ 400 $</b><span>в год, 4 пользователя + пакеты памяти</span></div><div><small>Потом</small><b class="g">сервер</b><span>до 10 ГБ бесплатно</span></div></div>
 ${said('«amoCRM полностью будет в этой новой платформе, которую будем разрабатывать?» · «Мы можем какое-то время попользоваться — у нас оплачено».')}`;
SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Стандартный пакет разработки — 1 500 000 ₸ один раз, без абонентской платы. 4–6 недель до полной сдачи. Код и документацию передаём вам.</p></div></div>
 <div class="pk"><div><small>Стандартный пакет</small><b>1 500 000 ₸</b><span>150 000 · 675 000 · 675 000</span></div><div class="on"><small>Со скидкой за скорость −10 %</small><b>1 350 000 ₸</b><span>если договор подписан в течение суток: 150 000 · 600 000 · 600 000</span></div></div>
 <div class="pay3"><div><small>Старт · 10 %</small><b>150 000 ₸</b><span>собираем доступ к amoCRM, прайсы, шаблоны</span></div><div><small>Ядро · ~3 недели</small><b>600–675 тыс.</b><span>после того, как вы приняли ядро</span></div><div><small>Сдача · 4–6 недель</small><b>600–675 тыс.</b><span>после шлифовки и передачи кода</span></div></div>
 <div class="g2"><div class="pan"><h3>Ядро</h3>${['Воронки из amoCRM: отдел продаж, продают компанию, постоянные','Карточка сделки, распределение заявок','Маркетплейс фирм и интеграция сайта','Прайс и калькулятор, КП, счёт, договор','Переезд данных и файлов'].map(x=>`<div class="li"><i>✓</i><span>${x}</span></div>`).join('')}</div>
 <div class="pan"><h3>Шлифовка</h3>${['Мессенджер в карточке','Телефония: звонки, записи, минуты на линии','Аналитика отдела','Мобильная версия и пуш-уведомления','Ваши доработки — около 20 % времени заложено'].map(x=>`<div class="li n"><i>→</i><span>${x}</span></div>`).join('')}</div></div>
 ${said('«Мы годовую оплачиваем — где-то до четырёхсот».','Платон: своя система чуть дороже, но за два-три года полностью отрабатывает деньги — и всё ваше.')}`;

/* ===== Карточки ===== */
const CARD={};
CARD.newlead=()=>['Новая заявка','Уйдёт менеджеру по правилам распределения',`<div class="form"><label>Контакт<input id="nl_c" value="Асхат Бекенов"></label><label>Компания<input id="nl_co" value="ТОО «Жас Курылыс»"></label><label>Услуга<select id="nl_s">${SERV.map(s=>`<option value="${s.id}">${esc(s.n)}</option>`).join('')}</select></label><label>Город<select id="nl_city">${CITIES.map(c=>`<option>${c}</option>`).join('')}</select></label><label>Источник<select id="nl_src">${SRC.map(s=>`<option>${s}</option>`).join('')}</select></label></div><button class="bt p" onclick="newLead()">Создать</button>`];
function newLead(){const v=i=>document.getElementById(i).value;const A=Object.keys(MGR).filter(k=>!DIST.away[k]).sort((a,b)=>LEADS_TODAY[a]-LEADS_TODAY[b]);const m=A[0]||'NS';LEADS_TODAY[m]++;const id='Д-'+(2332+DEALS.length-12);DEALS.unshift({id,co:v('nl_co'),ct:v('nl_c'),city:v('nl_city'),sv:v('nl_s'),firm:null,m,st:'new',touch:0,src:v('nl_src'),note:''});closeM();curDeal=id;go('deal');toast(`${id} создана и ушла ${MGR[m]} — у него меньше всех заявок за день.`)}
CARD.sell=()=>['Предложение продать фирму','Попадёт в воронку «Продают компанию»',`<div class="form"><label>Фирма<input id="sl_n" value="ТОО «Каспий Строй»"></label><label>Кто продаёт<input id="sl_w" value="Ринат К."></label><label>Город<select id="sl_c">${CITIES.map(c=>`<option>${c}</option>`).join('')}</select></label><label>Лицензия<input id="sl_l" value="СМР III категория"></label><label>Цена продавца, ₸<input id="sl_p" value="2800000"></label></div><button class="bt p" onclick="const v=i=>document.getElementById(i).value;SELL.unshift({id:'P-'+(42+SELL.length-6),n:v('sl_n'),who:v('sl_w'),city:v('sl_c'),lic:v('sl_l'),ask:+v('sl_p')||0,st:'in',d:'05.10'});closeM();render();toast('Предложение добавлено — юристу ушла задача на проверку.')">Добавить</button>`];
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(k){toast('Готово.')}
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();const d=DEALS.find(x=>(x.id+x.co+x.ct+x.city).toLowerCase().includes(q));if(d&&allowed('deal')){openDeal(d.id);return}const f=FIRMS.find(x=>(x.id+x.n+x.city+x.lic).toLowerCase().includes(q));if(f&&allowed('firm')){curFirm=f.id;go('firm');return}toast('Не найдено: попробуйте «Д-2318», «Шымкент», «Сарыарка».')}

/* ===== Каркас: разделы сверху ===== */
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}.`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
function buildRail(){const on=SECOF[cur];document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="dir ${s.k===on?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')">${s.n}</a>`).join('')}
function buildSub(){const s=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.today;document.getElementById('ttl').textContent=SUBN[cur]||'Реестр';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();buildSub();
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('funnel')?'':'none';try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['today','1 · Пульт: заявки, сделки, звонки, маркетплейс и документы — одним экраном.'],
 ['funnel','2 · Воронка «Отдел продаж» с вашими этапами из amoCRM.'],
 ['deal','3 · Карточка сделки: услуга и цена из прайса, документы без лимита, мессенджер, звонки с записями.'],
 ['distrib','4 · Распределение заявок: поровну, по специализации, 15 минут на ответ.'],
 ['sellers','5 · Продают компанию: документы, проверка юристом, цена — и на маркетплейс.'],
 ['market','6 · Маркетплейс готовых фирм — тот же каталог, что на сайте.'],
 ['prices','7 · Прайс и калькулятор: цена, госпошлина и срок — сразу в КП.'],
 ['chat','8 · Мессенджер в карточке сделки.'],
 ['calls','9 · Звонки: минуты на линии, пропущенные, касания по менеджерам.'],
 ['files','10 · Хранилище документов — без пакетов памяти.'],
 ['analytics','11 · Аналитика отдела: воронка, источники, услуги.'],
 ['move','12 · Переезд с amoCRM — пока оплачено, работаете параллельно.'],
 ['launch','13 · Стоимость: 1,5 млн один раз, 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
