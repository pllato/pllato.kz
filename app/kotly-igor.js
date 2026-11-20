/* ЖЫЛУ-ТЕХ — продажа и сервис газовых котлов и насосов, Алматы (Игорь). Демо на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(Math.round(n/100000)/10).toString().replace('.',',')+' млн ₸';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const TODAY='20.11.2026',NOW='10:00';
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const bar=(w,c)=>`<div class="bar"><i class="${c||''}" style="--w:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const said=(q,a,who)=>`<div class="said"><b>${who||'Игорь, 19.11'}</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const SEC=[
 {k:'sum',n:'Пульт',d:'руководитель, отчёты, зарплата',sub:[['dash','Пульт руководителя'],['rep','Аналитика'],['pay','Зарплата']]},
 {k:'sale',n:'Продажи',d:'котлы, насосы, бойлеры',sub:[['funnel','Воронка продаж'],['card','Карточка заказа'],['calc','Расчёт и КП'],['contract','Договор и ЭЦП']]},
 {k:'serv',n:'Сервис',d:'ремонт, ТО, гарантия',sub:[['service','Сервисная воронка'],['visit','Выезды мастеров'],['to','Сезонное ТО и гарантия']]},
 {k:'stock',n:'Склад',d:'остатки, закуп, приход',sub:[['stock','Остатки'],['buy','Закуп и приход']]},
 {k:'comm',n:'Связь',d:'WhatsApp, звонки, почта',sub:[['inbox','Единое окно'],['calls','Телефония']]},
 {k:'base',n:'Базы',d:'клиенты и прайсы',sub:[['clients','Клиенты'],['price','Прайсы']]},
 {k:'sys',n:'Система',d:'ИИ, сервер, справочник',sub:[['ai','ИИ-подсказки'],['server','Ваш сервер'],['help','Справочник'],['roles','Роли и права'],['launch','Стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Руководитель':{av:'РК',n:'Руководитель',note:'Всё: продажи, сервис, склад, деньги, зарплата, доступы',s:ALL.slice()},
 'Менеджер продаж':{av:'МП',n:'Айдос · продажи (их двое)',note:'Свои заказы и клиенты, расчёт, КП, договоры, переписка; закуп и маржу не видит',s:['funnel','card','calc','contract','stock','inbox','calls','clients','price','ai','help']},
 'Сервис-диспетчер':{av:'СД',n:'Марина · сервис',note:'Заявки на ремонт и ТО, выезды, гарантия, звонки',s:['service','visit','to','inbox','calls','clients','stock','help']},
 'Мастер':{av:'МС',n:'Руслан · мастер (их двое)',note:'Свои выезды с телефона: адрес, котёл, фото, запчасти, акт',s:['visit','to','stock','help']},
 'Кладовщик':{av:'КЛ',n:'Виктор · склад',note:'Остатки, приход, резервы, выдача мастерам',s:['stock','buy','help']},
 'Бухгалтер':{av:'БХ',n:'Ольга · бухгалтер',note:'Оплаты, договоры, закуп, зарплата',s:['contract','buy','pay','rep','help']}
};
let role='Руководитель',cur='dash';
const MGR=[{id:'M1',n:'Айдос Нурланов'},{id:'M2',n:'Дина Ким'}];
const MST=[{id:'T1',n:'Руслан Абенов'},{id:'T2',n:'Сергей Пак'}];
const MN=id=>([...MGR,...MST].find(m=>m.id===id)||{n:'—'}).n;
const MF=id=>MN(id).split(' ')[0];
const MEID=()=>role==='Менеджер продаж'?'M1':null;
const CL=[
 {id:'C1',n:'Ахметов Ержан',t:'частный дом',city:'Алматы, Каменка',ph:'+7 701 *** 12 40',m:'M1'},
 {id:'C2',n:'ТОО «Береке Строй»',t:'застройщик',city:'Алматы, Наурызбайский р-н',ph:'+7 727 *** 30 11',m:'M1'},
 {id:'C3',n:'Литвинова Ольга',t:'коттедж',city:'Талгар',ph:'+7 705 *** 88 02',m:'M2'},
 {id:'C4',n:'ИП «Тау Монтаж»',t:'монтажник',city:'Алматы',ph:'+7 777 *** 45 19',m:'M2'},
 {id:'C5',n:'Детский сад «Балдырған»',t:'учреждение',city:'Алматы, Медеуский р-н',ph:'+7 727 *** 61 07',m:'M1'},
 {id:'C6',n:'Сейткали Бауыржан',t:'частный дом',city:'Каскелен',ph:'+7 702 *** 19 55',m:'M2'},
 {id:'C7',n:'ТОО «Алатау Отель»',t:'гостиница',city:'Алматы',ph:'+7 727 *** 02 90',m:'M1'}
];
const CN=id=>(CL.find(c=>c.id===id)||{n:'—'}).n;
const ST=[['new','Заявка'],['calc','Расчёт'],['kp','КП отправлено'],['dog','Договор'],['pay','Оплата'],['ship','Отгрузка / монтаж'],['done','Закрыто']];
const STN=k=>(ST.find(s=>s[0]===k)||['',k])[1];
let DL=[
 {id:'З-1042',t:'Котёл настенный 24 кВт + бойлер 100 л',cl:'C1',m:'M1',st:'kp',sum:1180000,src:'WhatsApp',next:'20.11',nextT:'Перезвонить по КП, предложить монтаж'},
 {id:'З-1041',t:'Котельная: 2 напольных котла 60 кВт, насосная группа',cl:'C2',m:'M1',st:'dog',sum:7420000,src:'Повторный клиент',next:'21.11',nextT:'Подписать договор ЭЦП'},
 {id:'З-1039',t:'Циркуляционные насосы — 6 шт.',cl:'C4',m:'M2',st:'pay',sum:486000,src:'Kaspi',next:'20.11',nextT:'Ждём оплату счёта № 318'},
 {id:'З-1038',t:'Котёл конденсационный 35 кВт',cl:'C3',m:'M2',st:'calc',sum:0,src:'Сайт',next:'20.11',nextT:'Посчитать с дымоходом и монтажом'},
 {id:'З-1036',t:'Замена котла в детском саду, 2×45 кВт',cl:'C5',m:'M1',st:'ship',sum:3960000,src:'Звонок',next:'22.11',nextT:'Монтаж, бригада Руслана'},
 {id:'З-1044',t:'Насос повышения давления',cl:'C6',m:'M2',st:'new',sum:0,src:'Телефония',next:'20.11',nextT:'Уточнить напор и расход'},
 {id:'З-1045',t:'Бойлеры косвенного нагрева 200 л — 4 шт.',cl:'C7',m:'M1',st:'new',sum:0,src:'Почта',next:'20.11',nextT:'Ответить на запрос, выслать прайс'},
 {id:'З-1030',t:'Котёл настенный 18 кВт',cl:'C6',m:'M2',st:'done',sum:520000,src:'Kaspi',next:'—',nextT:'Закрыто, оплачено'}
];
let CURD='З-1042';
const seeD=d=>{const m=MEID();return !m||d.m===m};
let ITEMS={
 'З-1042':[{n:'Котёл газовый настенный двухконтурный 24 кВт',sku:'KT-24D',q:1,p:468000},{n:'Бойлер косвенного нагрева 100 л',sku:'BL-100',q:1,p:236000},{n:'Комплект коаксиального дымохода',sku:'DM-60',q:1,p:38000},{n:'Группа безопасности бойлера',sku:'GB-34',q:1,p:18000},{n:'Монтаж и пусконаладка',sku:'УСЛ-01',q:1,p:150000}],
 'З-1041':[{n:'Котёл газовый напольный 60 кВт',sku:'KN-60',q:2,p:2150000},{n:'Насосная группа с трёхходовым клапаном',sku:'NG-32',q:2,p:410000},{n:'Гидрострелка с коллектором',sku:'GS-5',q:1,p:520000},{n:'Монтаж котельной',sku:'УСЛ-05',q:1,p:780000}]
};
let SRV=[
 {id:'S-512',cl:'C1',t:'Котёл 24 кВт не запускается, ошибка E10',kind:'ремонт',st:'new',m:'',w:'гарантия',when:'20.11'},
 {id:'S-511',cl:'C5',t:'Сезонное ТО двух котлов перед зимой',kind:'ТО',st:'plan',m:'T1',w:'договор ТО',when:'20.11, 14:00'},
 {id:'S-509',cl:'C3',t:'Шумит циркуляционный насос',kind:'ремонт',st:'go',m:'T2',w:'платно',when:'20.11, 11:00'},
 {id:'S-507',cl:'C7',t:'Течь бойлера, замена анода',kind:'ремонт',st:'part',m:'T2',w:'платно',when:'ждём анод'},
 {id:'S-505',cl:'C6',t:'Пусконаладка нового котла',kind:'пуск',st:'done',m:'T1',w:'включено в продажу',when:'18.11'},
 {id:'S-503',cl:'C2',t:'Не греет ГВС на 3 этаже',kind:'ремонт',st:'done',m:'T1',w:'гарантия',when:'17.11'}
];
const SST=[['new','Новая заявка'],['plan','Назначен выезд'],['go','Мастер в пути / на месте'],['part','Ждём запчасть'],['done','Выполнено']];
let STK=[
 {sku:'KT-24D',n:'Котёл настенный двухконтурный 24 кВт',g:'Котлы',q:7,res:2,min:4,p:468000,c:352000},
 {sku:'KT-18D',n:'Котёл настенный двухконтурный 18 кВт',g:'Котлы',q:3,res:0,min:4,p:420000,c:318000},
 {sku:'KN-60',n:'Котёл напольный 60 кВт',g:'Котлы',q:2,res:2,min:1,p:2150000,c:1690000},
 {sku:'KK-35',n:'Котёл конденсационный 35 кВт',g:'Котлы',q:1,res:0,min:1,p:890000,c:701000},
 {sku:'CN-25',n:'Насос циркуляционный 25-60',g:'Насосы',q:24,res:6,min:10,p:81000,c:56000},
 {sku:'NP-15',n:'Насос повышения давления 15-90',g:'Насосы',q:5,res:0,min:3,p:97000,c:69000},
 {sku:'BL-100',n:'Бойлер косвенного нагрева 100 л',g:'Бойлеры',q:4,res:1,min:2,p:236000,c:171000},
 {sku:'BL-200',n:'Бойлер косвенного нагрева 200 л',g:'Бойлеры',q:1,res:0,min:2,p:348000,c:259000},
 {sku:'ZP-AN',n:'Анод магниевый для бойлера',g:'Запчасти',q:0,res:0,min:5,p:9000,c:4800},
 {sku:'ZP-PL',n:'Плата управления котла 24 кВт',g:'Запчасти',q:2,res:1,min:2,p:74000,c:51000}
];
let BUY=[
 {id:'ЗК-88',sup:'Поставщик котлов (дистрибьютор, Москва)',t:'Котлы 18 и 24 кВт — 12 шт.',sum:3980000,st:'в пути',eta:'27.11'},
 {id:'ЗК-87',sup:'Поставщик насосов (Алматы)',t:'Насосы, аноды, группы безопасности',sum:640000,st:'заказано',eta:'22.11'},
 {id:'ЗК-85',sup:'Поставщик бойлеров (Китай)',t:'Бойлеры 100/200 л — 20 шт.',sum:3120000,st:'принято',eta:'15.11'}
];
let MSG=[
 {ch:'WhatsApp',who:'Ахметов Ержан',d:'З-1042',t:'09:48',x:'Получил КП. А монтаж когда сможете? И котёл с гарантией сколько?'},
 {ch:'Почта',who:'zakup@alatau-hotel.kz',d:'З-1045',t:'09:20',x:'Просим КП на бойлеры косвенного нагрева 200 л, 4 шт., с доставкой.'},
 {ch:'WhatsApp',who:'Литвинова Ольга',d:'S-509',t:'08:55',x:'Насос гудит сильнее, мастер сегодня будет?'},
 {ch:'Instagram',who:'@tau.montazh',d:'З-1039',t:'вчера',x:'Счёт получили, оплатим сегодня до обеда.'},
 {ch:'WhatsApp',who:'Береке Строй',d:'З-1041',t:'вчера',x:'Договор посмотрели, подпишем ЭЦП завтра.'}
];
let CALLS=[
 {t:'09:52',dir:'вх',who:'Ахметов Ержан',cl:'C1',m:'M1',dur:'4:10',rec:true},
 {t:'09:31',dir:'вх',who:'+7 708 *** 21 64',cl:'',m:'',dur:'—',rec:false},
 {t:'09:05',dir:'исх',who:'ИП «Тау Монтаж»',cl:'C4',m:'M2',dur:'2:47',rec:true},
 {t:'вчера',dir:'вх',who:'Детский сад «Балдырған»',cl:'C5',m:'M1',dur:'7:02',rec:true}
];
let KPC={m:'KT-24D',boil:true,mont:true,disc:0};
const SC={};
const inWork=()=>DL.filter(d=>d.st!=='done'&&seeD(d));
const tbl=(h,rows,cls)=>`<div class="tw"><table class="t ${cls||''}"><thead><tr>${h.map(x=>`<th${x[0]==='>'?' class="r"':''}>${x.replace(/^>/,'')}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
SC.dash=()=>{const W=inWork();const sum=W.reduce((a,d)=>a+d.sum,0);const low=STK.filter(s=>s.q-s.res<s.min);
return `<div class="hd"><div><h2>Пульт руководителя · ${TODAY}, ${NOW}</h2><p>Продажи, сервис, склад и деньги одним экраном. Без лишних модулей, которые в Битриксе оплачивались, но не использовались.</p></div><div class="btns"><button class="bt" onclick="xls()">Excel</button><button class="bt p" onclick="go('funnel')">Воронка</button></div></div>
${said('Там много лишнего, для нас лишнего. И всё время приходится за что-то доплачивать — то за телефонию, то ещё за что-то.','Здесь только ваши разделы: продажи, сервис, склад, связь. Телефония и WhatsApp внутри, без доплат за модули.')}
<div class="strip"><div><small>Заказов в работе</small><b>${W.length}</b><span>${W.filter(d=>d.st==='new').length} новых заявки</span></div><div><small>Сумма в работе</small><b>${mln(sum)}</b><span>котлы, насосы, бойлеры</span></div><div><small>Сервисных заявок</small><b>${SRV.filter(s=>s.st!=='done').length}</b><span>${SRV.filter(s=>s.st==='go'||s.st==='plan').length} выезда сегодня</span></div><div><small>Ниже минимума</small><b class="bad">${low.length}</b><span>позиций на складе</span></div><div><small>Выручка · ноябрь</small><b>18,4 млн ₸</b><span>план 24 млн · 77%</span></div></div>
<div class="g21"><div>
 <div class="pan"><h3>Воронка продаж</h3>${tbl(['Этап','>Заказов','>Сумма',''],ST.filter(s=>s[0]!=='done').map(([k,n])=>{const L=DL.filter(d=>d.st===k&&seeD(d));const s=L.reduce((a,d)=>a+d.sum,0);return `<tr onclick="go('funnel')"><td>${n}</td><td class="r">${L.length}</td><td class="r">${s?tg(s):'—'}</td><td style="width:28%">${bar(pct(s,sum)||4,'g')}</td></tr>`}))}</div>
 <div class="pan"><h3>Сегодня по заказам</h3>${tbl(['Срок','Заказ','Клиент','Что сделать','Менеджер'],W.filter(d=>d.next!=='—').map(d=>`<tr onclick="CURD='${d.id}';go('card')"><td class="mono">${d.next}</td><td><b>${d.id}</b> ${esc(d.t)}</td><td>${esc(CN(d.cl))}</td><td>${esc(d.nextT)}</td><td>${esc(MF(d.m))}</td></tr>`))}</div>
</div><div>
 <div class="pan"><h3>Требует внимания</h3><div class="alist">
  <a onclick="go('service')"><i class="dt r"></i><b>S-512: котёл не запускается, гарантия</b><span>Ахметов Е. · мастер не назначен</span></a>
  <a onclick="go('stock')"><i class="dt r"></i><b>Аноды магниевые: 0 шт.</b><span>ждёт заявка S-507 · заказ ЗК-87 придёт 22.11</span></a>
  <a onclick="go('calls')"><i class="dt w"></i><b>Пропущенный звонок 09:31</b><span>новый номер · никто не перезвонил</span></a>
  <a onclick="go('contract')"><i class="dt i"></i><b>З-1041: договор на 7,4 млн ₸ ждёт подписи ЭЦП</b><span>Береке Строй · 21.11</span></a>
  <a onclick="go('to')"><i class="dt i"></i><b>Сезонное ТО: 38 клиентов не записаны</b><span>рассылка в WhatsApp одним нажатием</span></a>
 </div></div>
 <div class="pan"><h3>Команда · 7 человек</h3>${tbl(['Сотрудник','Роль','>Сегодня'],[['Айдос Нурланов','продажи','5 заказов'],['Дина Ким','продажи','3 заказа'],['Марина','сервис-диспетчер','6 заявок'],['Руслан Абенов','мастер','2 выезда'],['Сергей Пак','мастер','2 выезда'],['Виктор','склад','3 выдачи'],['Ольга','бухгалтер','2 оплаты']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td class="r">${r[2]}</td></tr>`),'sm')}</div>
</div></div>`};
SC.rep=()=>`<div class="hd"><div><h2>Аналитика</h2><p>Отчёты выгружаются в Excel. Какие цифры показывать, а какие нет — решаем вместе на полировке.</p></div><div class="btns"><button class="bt" onclick="xls()">Excel</button></div></div>
<div class="g2"><div class="pan"><h3>Выручка по направлениям · ноябрь</h3>${tbl(['Направление','>Выручка','>Маржа'],[['Котлы настенные','7,9 млн ₸','24%'],['Котлы напольные и котельные','5,2 млн ₸','21%'],['Насосы','2,1 млн ₸','31%'],['Бойлеры','1,6 млн ₸','27%'],['Сервис и ТО','1,6 млн ₸','58%']].map(r=>`<tr><td>${r[0]}</td><td class="r">${r[1]}</td><td class="r">${r[2]}</td></tr>`))}</div>
<div class="pan"><h3>Откуда приходят клиенты</h3>${tbl(['Канал','>Заявок','>Продаж','>Конверсия'],[['WhatsApp','64','19','30%'],['Звонки','41','15','37%'],['Kaspi','38','31','82%'],['Сайт','22','5','23%'],['Повторные и сервис','29','17','59%']].map(r=>`<tr><td>${r[0]}</td><td class="r">${r[1]}</td><td class="r">${r[2]}</td><td class="r">${r[3]}</td></tr>`))}</div></div>
<div class="g2"><div class="pan"><h3>Сервис: заявки и выезды</h3>${tbl(['Показатель','>Ноябрь'],[['Заявок на ремонт','46'],['Сезонных ТО','71'],['Средний срок до выезда','1,4 дня'],['Повторных выездов','4'],['Гарантийных случаев','9']].map(r=>`<tr><td>${r[0]}</td><td class="r">${r[1]}</td></tr>`))}</div>
<div class="pan"><h3>Деньги в складе</h3>${tbl(['Группа','>Позиций','>Себестоимость'],[['Котлы','84','28,4 млн ₸'],['Насосы','131','6,2 млн ₸'],['Бойлеры','46','5,9 млн ₸'],['Запчасти и комплектующие','342','3,1 млн ₸']].map(r=>`<tr><td>${r[0]}</td><td class="r">${r[1]}</td><td class="r">${r[2]}</td></tr>`))}<p class="sm2 mut">Всего 603 позиции — как в каталоге на Kaspi.</p></div></div>`;
SC.pay=()=>`<div class="hd"><div><h2>Зарплата · ноябрь</h2><p>Оклад + процент с продаж для менеджеров, оклад + за выезд для мастеров. Считается сам из закрытых заказов и актов.</p></div><div class="btns"><button class="bt" onclick="toast('Ведомость выгружена в Excel для бухгалтера.')">Ведомость</button></div></div>
<div class="pan">${tbl(['Сотрудник','Схема','>Оклад','>Бонус','>Итого'],[['Айдос Нурланов','оклад + 3% от маржи','180 000','142 300','322 300'],['Дина Ким','оклад + 3% от маржи','180 000','96 800','276 800'],['Руслан Абенов','оклад + 4 000 за выезд','150 000','124 000','274 000'],['Сергей Пак','оклад + 4 000 за выезд','150 000','112 000','262 000'],['Марина','оклад','220 000','—','220 000'],['Виктор','оклад','200 000','—','200 000']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="r">${r[2]}</td><td class="r">${r[3]}</td><td class="r"><b>${r[4]}</b></td></tr>`))}<p class="sm2 mut">Проценты и ставки здесь условные — вставим вашу схему.</p></div>`;
function moveD(id,dx){const d=DL.find(x=>x.id===id);const i=ST.findIndex(s=>s[0]===d.st);const j=Math.max(0,Math.min(ST.length-1,i+dx));d.st=ST[j][0];render();toast(`${id} → <b>${STN(d.st)}</b>`)}
SC.funnel=()=>{const L=DL.filter(seeD);
return `<div class="hd"><div><h2>Воронка продаж</h2><p>Этапы под ваш процесс: заявка → расчёт → КП → договор → оплата → отгрузка или монтаж. ${MEID()?'Вы видите только свои заказы.':'Руководитель видит заказы всех менеджеров.'}</p></div></div>
<div class="kanban" style="grid-template-columns:repeat(7,minmax(160px,1fr))">${ST.map(([k,n])=>`<div class="kcol"><div class="kh"><b>${n}</b><span>${L.filter(d=>d.st===k).length}</span></div>${L.filter(d=>d.st===k).map(d=>`<div class="kc" onclick="CURD='${d.id}';go('card')"><code>${d.id} · ${esc(MF(d.m))} · ${esc(d.src)}</code><b>${esc(d.t)}</b><span>${esc(CN(d.cl))}</span>${d.sum?`<em>${tg(d.sum)}</em>`:''}<span>${esc(d.nextT)}</span><div class="btns l"><button class="bt sm" onclick="event.stopPropagation();moveD('${d.id}',-1)">←</button><button class="bt sm" onclick="event.stopPropagation();moveD('${d.id}',1)">Дальше →</button></div></div>`).join('')}</div>`).join('')}</div>`};
SC.card=()=>{let d=DL.find(x=>x.id===CURD&&seeD(x))||DL.find(seeD);CURD=d.id;const I=ITEMS[d.id]||ITEMS['З-1042'];const tot=I.reduce((a,x)=>a+x.q*x.p,0);const M=MSG.filter(m=>m.d===d.id);
return `<div class="hd"><div><h2>${d.id} · ${esc(d.t)}</h2><p>${esc(CN(d.cl))} · источник: ${esc(d.src)} · менеджер ${esc(MN(d.m))} · этап <b>${STN(d.st)}</b></p></div><div class="btns"><button class="bt" onclick="go('calc')">Расчёт и КП</button><button class="bt p" onclick="go('contract')">Договор</button></div></div>
<div class="g21"><div><div class="pan"><h3>Состав заказа</h3>${tbl(['Позиция','Артикул','>Кол-во','>Цена','>Сумма','Склад'],I.map(x=>{const s=STK.find(k=>k.sku===x.sku);return `<tr><td>${esc(x.n)}</td><td class="mono">${x.sku}</td><td class="r">${x.q}</td><td class="r">${fmt(x.p)}</td><td class="r">${fmt(x.q*x.p)}</td><td>${s?(s.q-s.res>=x.q?tag('есть '+(s.q-s.res),'ok'):tag('нет, закуп','bad')):tag('услуга','')}</td></tr>`}))}<div class="kv tot"><span>Итого</span><b>${tg(tot)}</b></div></div>
<div class="pan"><h3>История</h3>${tbl(['Когда','Что'],[['19.11 15:10','Заявка из WhatsApp, создана автоматически'],['19.11 15:40','Менеджер посчитал заказ, КП отправлено в WhatsApp PDF'],['20.11 09:48','Клиент спросил про монтаж и гарантию'],['20.11 09:52','Входящий звонок 4:10, запись прикреплена']].map(r=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td></tr>`),'sm')}</div></div>
<div><div class="pan"><h3>Переписка по заказу</h3>${M.map(m=>`<div class="msg"><b>${esc(m.who)}</b><code>${m.ch} · ${m.t}</code><p>${esc(m.x)}</p></div>`).join('')||'<p class="mut">Сообщений нет.</p>'}<button class="bt" onclick="go('inbox')">Открыть единое окно</button></div>
<div class="pan"><h3>После продажи</h3><div class="kv"><span>Пусконаладка</span><b>мастер, после монтажа</b></div><div class="kv"><span>Гарантия</span><b>2 года, до 20.11.2028</b></div><div class="kv"><span>Сезонное ТО</span><b>напомним в сентябре</b></div></div></div></div>`};
function kpcalc(){const m=STK.find(s=>s.sku===KPC.m);const rows=[[m.n,m.p]];if(KPC.boil)rows.push(['Бойлер косвенного нагрева 100 л',236000],['Группа безопасности бойлера',18000]);rows.push(['Комплект коаксиального дымохода',38000]);if(KPC.mont)rows.push(['Монтаж и пусконаладка',150000]);const s=rows.reduce((a,r)=>a+r[1],0);return {rows,s,tot:Math.round(s*(1-KPC.disc/100))}}
function setK(k,v){KPC[k]=v;render()}
SC.calc=()=>{const c=kpcalc();
return `<div class="hd"><div><h2>Расчёт заказа и КП</h2><p>Менеджер собирает комплект из прайса: котёл, бойлер, дымоход, монтаж. Цена и наличие — со склада. КП уходит клиенту в WhatsApp или на почту PDF-файлом.</p></div></div>
<div class="g2"><div class="pan"><h3>Комплект</h3>
<div class="fld"><label>Котёл</label><select class="sel" onchange="setK('m',this.value)">${STK.filter(s=>s.g==='Котлы').map(s=>`<option value="${s.sku}" ${s.sku===KPC.m?'selected':''}>${esc(s.n)} — ${tg(s.p)}</option>`).join('')}</select></div>
<div class="fld"><label><input type="checkbox" ${KPC.boil?'checked':''} onchange="setK('boil',this.checked)"> Бойлер 100 л и группа безопасности</label></div>
<div class="fld"><label><input type="checkbox" ${KPC.mont?'checked':''} onchange="setK('mont',this.checked)"> Монтаж и пусконаладка</label></div>
<div class="fld"><label>Скидка, %</label><select class="sel" onchange="setK('disc',+this.value)">${[0,3,5,7].map(v=>`<option ${v===KPC.disc?'selected':''}>${v}</option>`).join('')}</select></div>
<p class="sm2 mut">Скидку больше 5% согласует руководитель — так задаётся в правах.</p></div>
<div class="pan"><h3>КП клиенту</h3>${c.rows.map(r=>`<div class="kv"><span>${esc(r[0])}</span><b>${tg(r[1])}</b></div>`).join('')}${KPC.disc?`<div class="kv"><span>Скидка ${KPC.disc}%</span><b>−${tg(c.s-c.tot)}</b></div>`:''}<div class="kv tot"><span>Итого</span><b>${tg(c.tot)}</b></div>
<div class="btns l"><button class="bt p" onclick="toast('КП в PDF отправлено клиенту в WhatsApp и сохранено в карточке заказа.')">Отправить в WhatsApp</button><button class="bt" onclick="toast('КП отправлено на почту клиента.')">На почту</button></div></div></div>`};
SC.contract=()=>`<div class="hd"><div><h2>Договор и подписание ЭЦП</h2><p>Договор собирается из шаблона по данным заказа и клиента. Подписание ЭЦП — без бумаги и поездок.</p></div></div>
<div class="g21"><div class="pan"><h3>З-1041 · ТОО «Береке Строй» · котельная 2×60 кВт</h3>
<div class="stps"><div class="on">Шаблон заполнен</div><div class="on">Проверил руководитель</div><div class="on">Отправлен клиенту</div><div>Подписан ЭЦП</div></div>
<div class="kv"><span>Сумма</span><b>${tg(7420000)}</b></div><div class="kv"><span>Оплата</span><b>50% предоплата, 50% после монтажа</b></div><div class="kv"><span>Срок монтажа</span><b>10 рабочих дней</b></div><div class="kv"><span>Гарантия</span><b>2 года на оборудование и монтаж</b></div>
<div class="btns l"><button class="bt p" onclick="toast('Документ подписан ЭЦП руководителя. Ссылка на подпись отправлена клиенту.')">Подписать ЭЦП</button><button class="bt" onclick="toast('Счёт на предоплату 3 710 000 ₸ сформирован.')">Счёт на предоплату</button></div></div>
<div class="pan"><h3>Шаблоны</h3>${tbl(['Документ'],['Договор поставки','Договор поставки с монтажом','Договор на сервисное обслуживание (ТО)','Акт выполненных работ','Гарантийный талон'].map(x=>`<tr><td>${x}</td></tr>`),'sm')}</div></div>`;
SC.service=()=>`<div class="hd"><div><h2>Сервисная воронка</h2><p>Заявки на ремонт, ТО и пусконаладку — отдельно от продаж. Видно, кто едет, когда и что с гарантией.</p></div><div class="btns"><button class="bt p" onclick="SRV.unshift({id:'S-5'+(13+SRV.length),cl:'C6',t:'Новая заявка из WhatsApp',kind:'ремонт',st:'new',m:'',w:'уточнить',when:'—'});render();toast('Заявка создана.')">Новая заявка</button></div></div>
${said('Сервис и дистрибуция — у нас и то, и другое.','Сервис ведётся своей воронкой: от звонка до акта и оплаты.')}
<div class="kanban" style="grid-template-columns:repeat(5,minmax(170px,1fr))">${SST.map(([k,n])=>`<div class="kcol"><div class="kh"><b>${n}</b><span>${SRV.filter(s=>s.st===k).length}</span></div>${SRV.filter(s=>s.st===k).map(s=>`<div class="kc" onclick="go('visit')"><code>${s.id} · ${s.kind} · ${s.w}</code><b>${esc(s.t)}</b><span>${esc(CN(s.cl))}</span><span>${s.m?esc(MF(s.m))+' · ':''}${esc(s.when)}</span>${k==='new'?`<div class="btns l"><button class="bt sm" onclick="event.stopPropagation();assign('${s.id}')">Назначить мастера</button></div>`:''}</div>`).join('')}</div>`).join('')}</div>`;
function assign(id){const s=SRV.find(x=>x.id===id);s.m='T1';s.st='plan';s.when='20.11, 16:00';render();toast(`${id}: назначен Руслан на 16:00. Клиенту ушло сообщение в WhatsApp.`)}
SC.visit=()=>`<div class="hd"><div><h2>Выезды мастеров · сегодня</h2><p>Мастер видит свои выезды на телефоне: адрес, модель котла, историю, нужные запчасти. На месте — фото, акт, подпись клиента.</p></div></div>
<div class="g2">${MST.map(t=>`<div class="pan"><h3>${t.n}</h3>${SRV.filter(s=>s.m===t.id&&s.st!=='done').map(s=>`<div class="msg"><b>${s.id} · ${esc(CN(s.cl))}</b><code>${esc(s.when)} · ${s.kind} · ${s.w}</code><p>${esc(s.t)}</p><div class="btns l"><button class="bt sm" onclick="toast('Фото прикреплено к заявке.')">Фото</button><button class="bt sm" onclick="toast('Списана запчасть со склада мастера.')">Запчасть</button><button class="bt sm p" onclick="doneS('${s.id}')">Акт и закрыть</button></div></div>`).join('')||'<p class="mut">Выездов нет.</p>'}</div>`).join('')}</div>`;
function doneS(id){const s=SRV.find(x=>x.id===id);s.st='done';render();toast(`${id} закрыта. Акт подписан клиентом на телефоне мастера.`)}
SC.to=()=>`<div class="hd"><div><h2>Сезонное ТО и гарантия</h2><p>Все проданные котлы с датой пуска и гарантией. Перед сезоном система сама предлагает записать клиентов на ТО.</p></div><div class="btns"><button class="bt p" onclick="toast('38 клиентам ушло сообщение в WhatsApp с предложением записаться на ТО.')">Пригласить на ТО</button></div></div>
<div class="strip"><div><small>Котлов на обслуживании</small><b>412</b><span>проданы и запущены нами</span></div><div><small>На гарантии</small><b>167</b><span>до 2 лет</span></div><div><small>ТО в этом сезоне</small><b>71</b><span>из 109 записанных</span></div><div><small>Не записаны</small><b class="bad">38</b><span>напомнить</span></div></div>
<div class="pan">${tbl(['Клиент','Оборудование','Пуск','Гарантия до','Последнее ТО',''],[['Ахметов Ержан','Котёл 24 кВт','12.10.2025','12.10.2027','—','записать'],['Детский сад «Балдырған»','2 котла 45 кВт','03.09.2024','03.09.2026','20.11.2026','сегодня'],['Литвинова Ольга','Котёл 35 кВт, насос','15.11.2023','истекла','02.10.2025','записать'],['ТОО «Алатау Отель»','Котельная 3×80 кВт','01.10.2022','истекла','14.10.2026','ок']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td class="mono">${r[2]}</td><td class="mono">${r[3]}</td><td class="mono">${r[4]}</td><td>${r[5]==='ок'?tag('ок','ok'):r[5]==='сегодня'?tag('сегодня','w'):tag('записать','bad')}</td></tr>`))}</div>`;
let SQ='';
SC.stock=()=>{const L=STK.filter(s=>(s.n+s.sku).toLowerCase().includes(SQ));const showC=role==='Руководитель'||role==='Кладовщик';
return `<div class="hd"><div><h2>Остатки · 603 позиции</h2><p>Свободно = на складе минус резерв под заказы. Ниже минимума — подсвечено, закуп предлагается сам.</p></div><div class="btns"><button class="bt" onclick="toast('Синхронизация с каталогом Kaspi — опция, считается отдельно.')">Kaspi</button></div></div>
<div class="pan"><div class="fld"><input class="sel" placeholder="Поиск по названию или артикулу" value="${esc(SQ)}" onchange="SQ=this.value.toLowerCase();render()"></div>
${tbl(['Артикул','Позиция','Группа','>На складе','>Резерв','>Свободно','>Цена',...(showC?['>Закуп']:[])],L.map(s=>{const f=s.q-s.res;return `<tr><td class="mono">${s.sku}</td><td>${esc(s.n)}</td><td>${s.g}</td><td class="r">${s.q}</td><td class="r">${s.res}</td><td class="r ${f<s.min?'bad':''}">${f}</td><td class="r">${fmt(s.p)}</td>${showC?`<td class="r">${fmt(s.c)}</td>`:''}</tr>`}))}<p class="sm2 mut">Показаны 10 из 603. Закупочную цену видят только руководитель и склад.</p></div>`};
SC.buy=()=>`<div class="hd"><div><h2>Закуп и приход</h2><p>Вы всё закупаете — система подсказывает, что заказать, и принимает приход по заказу.</p></div><div class="btns"><button class="bt p" onclick="toast('Сформирован заказ поставщику по позициям ниже минимума: 5 позиций.')">Заказать недостающее</button></div></div>
<div class="pan">${tbl(['Заказ','Поставщик','Что','>Сумма','Статус','Ожидаем',''],BUY.map(b=>`<tr><td><b>${b.id}</b></td><td>${esc(b.sup)}</td><td>${esc(b.t)}</td><td class="r">${fmt(b.sum)}</td><td>${tag(b.st,b.st==='принято'?'ok':'w')}</td><td class="mono">${b.eta}</td><td>${b.st!=='принято'?`<button class="bt sm" onclick="recv('${b.id}')">Принять</button>`:''}</td></tr>`))}</div>`;
function recv(id){const b=BUY.find(x=>x.id===id);b.st='принято';render();toast(`${id} принят на склад, остатки обновлены.`)}
let CH='все';
SC.inbox=()=>{const L=MSG.filter(m=>CH==='все'||m.ch===CH);
return `<div class="hd"><div><h2>Единое окно</h2><p>WhatsApp, Instagram и почта в одном списке. Каждое сообщение привязано к заказу или сервисной заявке.</p></div></div>
<div class="seg">${['все','WhatsApp','Instagram','Почта'].map(c=>`<a class="${c===CH?'on':''}" onclick="CH='${c}';render()">${c}</a>`).join('')}</div>
<div class="pan">${L.map(m=>`<div class="msg"><b>${esc(m.who)}</b><code>${m.ch} · ${m.t} · ${m.d}</code><p>${esc(m.x)}</p></div>`).join('')}
<div class="fld" style="margin-top:10px"><label>Ответ</label><input id="mtx" class="sel" placeholder="Напишите ответ…" onkeydown="if(event.key==='Enter')sendMsg()"></div><button class="bt p" onclick="sendMsg()">Отправить</button></div>`};
function sendMsg(){const i=document.getElementById('mtx');const v=i&&i.value.trim();if(!v){toast('Введите текст.');return}MSG.unshift({ch:'WhatsApp',who:'Вы',d:'З-1042',t:NOW,x:v});render();toast('Отправлено в WhatsApp.')}
SC.calls=()=>`<div class="hd"><div><h2>Телефония</h2><p>Звонки с записью — в карточке клиента. Пропущенные не теряются: система ставит задачу перезвонить.</p></div></div>
<div class="strip"><div><small>Звонков сегодня</small><b>23</b><span>17 входящих</span></div><div><small>Пропущено</small><b class="bad">1</b><span>задача поставлена</span></div><div><small>Средний ответ</small><b>12 сек</b><span>по линии продаж</span></div><div><small>Доплата за модуль</small><b>0 ₸</b><span>оплачиваете только связь оператору</span></div></div>
<div class="pan">${tbl(['Время','Тип','Кто','Менеджер','>Длит.','Запись'],CALLS.map(c=>`<tr><td class="mono">${c.t}</td><td>${c.dir==='вх'?'входящий':'исходящий'}${c.rec?'':' '+tag('пропущен','bad')}</td><td>${esc(c.who)}</td><td>${c.m?esc(MF(c.m)):'—'}</td><td class="r">${c.dur}</td><td>${c.rec?`<button class="bt sm" onclick="toast('Воспроизведение записи.')">Слушать</button>`:`<button class="bt sm p" onclick="toast('Задача «перезвонить» поставлена Айдосу.')">Перезвонить</button>`}</td></tr>`))}</div>`;
SC.clients=()=>`<div class="hd"><div><h2>Клиенты</h2><p>Частные дома, застройщики, монтажники, учреждения. В карточке — покупки, оборудование, сервис, переписка.</p></div></div>
<div class="pan">${tbl(['Клиент','Тип','Город','Телефон','Менеджер'],CL.filter(c=>!MEID()||c.m===MEID()).map(c=>`<tr><td><b>${esc(c.n)}</b></td><td>${c.t}</td><td>${esc(c.city)}</td><td class="mono">${c.ph}</td><td>${esc(MF(c.m))}</td></tr>`))}</div>`;
SC.price=()=>`<div class="hd"><div><h2>Прайсы</h2><p>Розница, монтажники и застройщики — разные колонки цен. Обновление прайса поставщика загружается из Excel.</p></div><div class="btns"><button class="bt" onclick="toast('Прайс поставщика загружен: обновлено 214 цен.')">Загрузить Excel</button></div></div>
<div class="pan">${tbl(['Позиция','>Розница','>Монтажники −7%','>Застройщики −10%'],STK.slice(0,8).map(s=>`<tr><td>${esc(s.n)}</td><td class="r">${fmt(s.p)}</td><td class="r">${fmt(s.p*.93)}</td><td class="r">${fmt(s.p*.9)}</td></tr>`))}</div>`;
SC.ai=()=>`<div class="hd"><div><h2>ИИ-подсказки · эксперимент</h2><p>Подключаем ИИ через шлюз к вашей базе. Сначала пробуете, что полезно — потом это становится обычной автоматикой без ИИ.</p></div></div>
${said('Какие-то подсказки менеджеру при продаже. Может быть, анализ наших данных.','Ниже — пример подсказки по заказу и пример вопроса к базе.')}
<div class="g2"><div class="pan"><h3>Подсказка менеджеру · З-1042</h3><p>Клиент спросил про монтаж и гарантию. Предложите монтаж с пусконаладкой (150 000 ₸) — с ним гарантия 2 года. Бойлер 100 л в наличии 3 шт. Похожие клиенты в Каменке в 7 из 10 случаев брали ТО по договору.</p></div>
<div class="pan"><h3>Вопрос к базе</h3><div class="msg"><b>Руководитель</b><p>Какие насосы не продавались 90 дней?</p></div><div class="msg"><b>Ответ</b><p>11 позиций на 1,3 млн ₸ по закупу. Больше всего — насосы повышения давления 15-90 (5 шт.). Предложите их монтажникам со скидкой.</p></div></div></div>`;
SC.server=()=>`<div class="hd"><div><h2>Данные на вашем сервере</h2><p>Система ставится на ваш сервер — физический в офисе или виртуальный в Казахстане/Германии. База принадлежит вам.</p></div></div>
${said('Первое — база принадлежит мне. Чтобы информация не слетела и не была заблокирована, и несколько лет работы с клиентами не остались где-то у кого-то.','Сервер ваш, резервные копии каждую ночь в два места, абонплаты нет.')}
<div class="g2"><div class="pan"><h3>Резервные копии</h3>${tbl(['Когда','Куда','Статус'],[['20.11 03:00','второй сервер','ок'],['20.11 03:05','облачное хранилище','ок'],['19.11 03:00','второй сервер','ок']].map(r=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td>${tag(r[2],'ok')}</td></tr>`))}<button class="bt" onclick="toast('Тестовое восстановление из копии прошло за 4 минуты.')">Проверить восстановление</button></div>
<div class="pan"><h3>Что это значит</h3><div class="kv"><span>Владелец базы</span><b>вы</b></div><div class="kv"><span>Абонплата</span><b>0 ₸</b></div><div class="kv"><span>Отключат, ограничат тариф</span><b>некому</b></div><div class="kv"><span>Выгрузка всей базы</span><b>в любой момент</b></div></div></div>`;
SC.help=()=>`<div class="hd"><div><h2>Справочник для сотрудников</h2><p>Короткие инструкции по каждому экрану — чтобы не смотреть ролики часами, как было при внедрении Битрикса.</p></div></div>
${said('Менеджеры, которые должны были помогать настраивать: раз-раз, всё понятно, и ушёл. А мы сидим — ничего не понятно.','Справочник пишем по вашей системе, плюс обучаем сотрудников на полировке.')}
<div class="pan">${tbl(['Инструкция','Для кого','>Минут'],[['Как принять заявку из WhatsApp и посчитать КП','менеджер','3'],['Как отправить договор на подпись ЭЦП','менеджер','2'],['Как назначить выезд мастера','сервис','2'],['Выезд с телефона: фото, запчасти, акт','мастер','4'],['Приход товара и резерв под заказ','склад','3'],['Ведомость зарплаты','бухгалтер','2']].map(r=>`<tr onclick="toast('Инструкция открыта.')"><td>${r[0]}</td><td>${r[1]}</td><td class="r">${r[2]}</td></tr>`))}</div>`;
SC.roles=()=>`<div class="hd"><div><h2>Роли и права</h2><p>7 сотрудников, 6 ролей. Каждый видит только своё.</p></div></div>
<div class="pan">${tbl(['Роль','Что видит'],Object.entries(ROLES).map(([k,v])=>`<tr><td><b>${esc(k)}</b></td><td>${esc(v.note)}</td></tr>`))}</div>`;
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Своя система вместо подписки: разрабатываем под вас и передаём полностью.</p></div></div>
<div class="strip"><div><small>Стандартный пакет</small><b>2,5 млн ₸</b><span>один раз</span></div><div><small>Срок</small><b>3–6 недель</b><span>3 этапа</span></div><div><small>Оплата</small><b>30/40/30</b><span>по этапам</span></div><div><small>Абонплата</small><b>0 ₸</b><span>сервер оплачиваете провайдеру</span></div></div>
<div class="pan"><div class="stps"><div class="on">1 · Утверждаем ТЗ и этапы — 30%</div><div class="on">2 · Разворачиваем систему — 40%</div><div>3 · Полируем с вами и передаём — 30%</div></div><p class="sm2 mut">Поддержка 3 месяца включена. Дальше доработки — 20 $/час. Опции: интеграция с 1С — 800 000 ₸; синхронизация каталога с сайтом и Kaspi — отдельной оценкой.</p></div>`;
function xls(){toast('Отчёт выгружен в Excel.')}
/* ===== Каркас ===== */
function searchDemo(v){if(!v)return;const q=v.toLowerCase();const d=DL.find(x=>seeD(x)&&(x.id+x.t+CN(x.cl)).toLowerCase().includes(q));if(d&&allowed('card')){CURD=d.id;go('card')}else toast('Не найдено в доступных вам сделках.')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map((s,i)=>`<a class="ri ${s.k===SECOF[cur]?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><code>${String(i+1).padStart(2,'0')}</code><span>${s.n}</span><small>${s.d}</small></a>`).join('');
 const S=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=S.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('');
 const h=document.getElementById('shint');if(h)h.innerHTML=`<b>${esc(role)}</b>${esc(ROLES[role].note)}`}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Жылу-Тех';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
let theme='light';function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme()}
const TOUR=[['dash','1 · Пульт руководителя: продажи, сервис, склад.'],['funnel','2 · Воронка продаж котлов и насосов.'],['card','3 · Карточка заказа: состав, наличие, переписка.'],['calc','4 · Расчёт комплекта и КП в WhatsApp.'],['contract','5 · Договор и подпись ЭЦП.'],['service','6 · Сервисная воронка: ремонт, ТО, гарантия.'],['visit','7 · Выезды мастеров с телефона.'],['stock','8 · Остатки 603 позиций и резервы.'],['inbox','9 · WhatsApp, Instagram, почта в одном окне.'],['server','10 · База на вашем сервере, бэкапы.'],['launch','11 · 2,5 млн ₸, без абонплаты.']];
let ti=-1,tRun=false;function tour(){if(tRun){tRun=false;return}tRun=true;ti=-1;step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){tRun=false;toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Руководитель');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();tRun=false}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
