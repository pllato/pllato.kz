/* СТЕПЬ ИНДАСТРИАЛ — поставки оборудования для тяжёлой промышленности в СНГ (Айгуль, директор). Демо на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(Math.round(n/100000)/10).toString().replace('.',',')+' млн ₸';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const TODAY='18.11.2026',NOW='10:20',TD=18;
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const bar=(w,c)=>`<div class="bar"><i class="${c||''}" style="--w:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const said=(q,a,who)=>`<div class="said"><b>${who||'Айгуль, 17.11'}</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const SEC=[
 {k:'sum',n:'Пульт',d:'директор, отчёты, менеджеры',sub:[['dash','Пульт директора'],['rep','Отчёты'],['mgr','Менеджеры и KPI']]},
 {k:'tend',n:'Тендеры',d:'площадки по профилю',sub:[['tenders','Лента тендеров']]},
 {k:'deal',n:'Сделки',d:'от тендера до договора',sub:[['funnel','Воронка сделок'],['card','Карточка сделки'],['rfq','Запросы на заводы'],['draw','Чертежи и ГОСТ'],['kp','КП-конструктор'],['contract','Договоры и спецификации']]},
 {k:'exec',n:'Исполнение',d:'производство, отгрузки, деньги',sub:[['ship','Производство и отгрузки'],['debt','Дебиторка']]},
 {k:'comm',n:'Связь',d:'все каналы в одном окне',sub:[['inbox','Единое окно сообщений'],['calls','Телефония']]},
 {k:'base',n:'Базы',d:'заказчики и заводы',sub:[['clients','Заказчики'],['plants','Заводы-изготовители']]},
 {k:'sys',n:'Система',d:'права, сравнение, цена',sub:[['roles','Роли и права'],['amo','Сравнение с amoCRM'],['onec','Обмен с 1С'],['launch','Стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Директор':{av:'ДР',n:'Директор · работает из другой страны',note:'Всё: воронка, тендеры, заводы, деньги, менеджеры, доступы',s:ALL.slice()},
 'Менеджер · Россия':{av:'МР',n:'Ольга · Екатеринбург',note:'Свои сделки и заказчики РФ, запросы на заводы, КП, отгрузки; чужие сделки и маржу не видит',s:['funnel','card','rfq','draw','kp','contract','ship','inbox','calls','clients','tenders']},
 'Менеджер · Казахстан':{av:'МК',n:'Жанар · Караганда',note:'Свои сделки и заказчики КЗ, тендеры Самрук-Казына, КП, отгрузки',s:['funnel','card','rfq','draw','kp','contract','ship','inbox','calls','clients','tenders']},
 'Тендерный специалист':{av:'ТС',n:'Алия · тендеры',note:'Лента площадок, отбор по профилю, заявки, документы и сроки подачи',s:['tenders','funnel','card','draw','rfq','clients']},
 'Бухгалтер':{av:'БХ',n:'Ирина · бухгалтер',note:'Договоры, оплаты, отгрузки, дебиторка, обмен с 1С',s:['contract','ship','debt','onec','rep']}
};
let role='Директор',cur='dash';
const MGR=[
 {id:'M1',n:'Ольга Кравцова',c:'РФ',city:'Екатеринбург'},
 {id:'M2',n:'Дмитрий Сафонов',c:'РФ',city:'Челябинск'},
 {id:'M3',n:'Жанар Сагинтаева',c:'КЗ',city:'Караганда'},
 {id:'M4',n:'Ерлан Бекмуханов',c:'КЗ',city:'Павлодар'},
 {id:'M5',n:'Тимур Абдрахманов',c:'КЗ',city:'Усть-Каменогорск'},
 {id:'M6',n:'Сергей Лукин',c:'РФ',city:'Новокузнецк'}
];
const MN=id=>(MGR.find(m=>m.id===id)||{n:'—'}).n;
const MF=id=>MN(id).split(' ')[0];
const MEID=()=>role==='Менеджер · Россия'?'M1':role==='Менеджер · Казахстан'?'M3':null;
const CL=[
 {id:'C1',n:'АО «СарыАрка Металл»',c:'КЗ',city:'Караганда',ct:'Бекетов А. С., главный механик',ph:'+7 7212 40 11 08',m:'M3'},
 {id:'C2',n:'ТОО «Ертіс Ферросплав»',c:'КЗ',city:'Павлодар',ct:'Шарипов Н. К., отдел закупа',ph:'+7 7182 55 20 41',m:'M4'},
 {id:'C3',n:'АО «Алтай Цинк»',c:'КЗ',city:'Усть-Каменогорск',ct:'Ким В. Л., начальник ОМТС',ph:'+7 7232 26 70 19',m:'M5'},
 {id:'C4',n:'ПАО «Урал Прокат»',c:'РФ',city:'Магнитогорск',ct:'Соколов И. П., служба главного механика',ph:'+7 3519 24 55 10',m:'M1'},
 {id:'C5',n:'АО «Кузбасс Коксохим»',c:'РФ',city:'Кемерово',ct:'Гринёв Д. А., снабжение',ph:'+7 3842 77 31 02',m:'M6'},
 {id:'C6',n:'ООО «Челябинский трубный узел»',c:'РФ',city:'Челябинск',ct:'Мельникова О. В., закупки',ph:'+7 351 725 40 66',m:'M2'},
 {id:'C7',n:'АО «Навои Металл»',c:'УЗ',city:'Навои',ct:'Рахимов Ш. Б., закупки',ph:'+998 79 223 14 50',m:'M3'}
];
const CN=id=>(CL.find(c=>c.id===id)||{n:'—'}).n;
const PL=[
 {id:'F1',n:'Tangshan Heavy Forge Co.',c:'Китай',city:'Таншань',sk:'Литьё, шлаковые чаши, бандажи',days:75,ch:'WeChat, почта',rate:4.6},
 {id:'F2',n:'Luoyang Gear Works',c:'Китай',city:'Лоян',sk:'Венцовые шестерни, валы-шестерни, редукторы',days:90,ch:'WeChat, почта',rate:4.4},
 {id:'F3',n:'Shanxi Bulk Handling Machinery',c:'Китай',city:'Тайюань',sk:'Вагоноопрокидыватели, роторы, приводы',days:120,ch:'почта',rate:4.2},
 {id:'F4',n:'«УралТяжМаш»',c:'Россия',city:'Екатеринбург',sk:'Вагоноопрокидыватели, шлаковозы, ремонтные узлы',days:100,ch:'почта, телефон',rate:4.5},
 {id:'F5',n:'«СибЛитМаш»',c:'Россия',city:'Новокузнецк',sk:'Литьё до 40 т, шлаковые чаши, ролики',days:80,ch:'почта, MAX',rate:4.1}
];
const PN=id=>(PL.find(p=>p.id===id)||{n:'—'}).n;
const ST=[['tender','Тендер'],['work','Проработка'],['rfq','Запрос на завод'],['price','Цена завода'],['kp','КП отправлено'],['dog','Договор'],['prod','Производство'],['ship','Отгрузка частями'],['done','Закрыто']];
const STN=k=>(ST.find(s=>s[0]===k)||['',k])[1];
let DL=[
 {id:'С-214',t:'Шлаковые чаши 16,5 м³ — 6 шт.',cl:'C1',m:'M3',st:'kp',sum:186400000,cur:'KZT',src:'Тендер zakup.sk.kz',next:'20.11',nextT:'Ответ по КП, защита цены',pl:'F1'},
 {id:'С-209',t:'Венцовая шестерня m=20, z=180 — 2 шт.',cl:'C2',m:'M4',st:'price',sum:94200000,cur:'KZT',src:'Прямой запрос',next:'19.11',nextT:'Сравнить цены Лоян и УралТяжМаш',pl:'F2'},
 {id:'С-205',t:'Вагоноопрокидыватель роторный — ремонт ротора и привода',cl:'C4',m:'M1',st:'rfq',sum:0,cur:'RUB',src:'Повторный заказчик',next:'21.11',nextT:'Получить цену от 3 заводов',pl:'F3'},
 {id:'С-198',t:'Бандажи вращающейся печи Ø 5,2 м — 3 шт.',cl:'C3',m:'M5',st:'dog',sum:212000000,cur:'KZT',src:'Тендер Казахстанская индустрия',next:'22.11',nextT:'Подписание договора и спецификации',pl:'F1'},
 {id:'С-191',t:'Комплект запчастей шлаковоза ПШ-16 — 10 позиций',cl:'C5',m:'M6',st:'ship',sum:58900000,cur:'RUB',src:'Повторный заказчик',next:'25.11',nextT:'Отгрузка партии 2 из 3',pl:'F5'},
 {id:'С-187',t:'Валы-шестерни редуктора привода — 4 шт.',cl:'C6',m:'M2',st:'prod',sum:41300000,cur:'RUB',src:'Сайт',next:'02.12',nextT:'Контроль ОТК на заводе',pl:'F2'},
 {id:'С-216',t:'Опорные ролики печи — 8 шт.',cl:'C7',m:'M3',st:'work',sum:0,cur:'USD',src:'WhatsApp',next:'19.11',nextT:'Получить чертежи от заказчика',pl:''},
 {id:'С-176',t:'Шлаковые чаши 11 м³ — 4 шт.',cl:'C2',m:'M4',st:'done',sum:96500000,cur:'KZT',src:'Тендер zakup.sk.kz',next:'—',nextT:'Закрыто, оплачено',pl:'F1'}
];
let CURD='С-214';
const seeD=d=>{const m=MEID();return !m||d.m===m};
let TND=[
 {id:'T-5521',pl:'zakup.sk.kz',org:'АО «СарыАрка Металл»',t:'Поставка шлаковых чаш 16,5 м³',sum:190000000,dl:'24.11',fit:true,st:'new'},
 {id:'T-5530',pl:'Казахстанская индустрия',org:'ТОО «Ертіс Ферросплав»',t:'Шестерня венцовая привода печи',sum:98000000,dl:'27.11',fit:true,st:'new'},
 {id:'T-5534',pl:'zakup.sk.kz',org:'АО «Алтай Цинк»',t:'Ролики опорные и упорные печи обжига',sum:64000000,dl:'29.11',fit:true,st:'new'},
 {id:'T-5537',pl:'goszakup.gov.kz',org:'КГП «Водоканал»',t:'Насосы и запорная арматура',sum:12000000,dl:'21.11',fit:false,st:'new'},
 {id:'T-5512',pl:'Казахстанская индустрия',org:'АО «Алтай Цинк»',t:'Бандажи вращающейся печи Ø 5,2 м',sum:215000000,dl:'05.11',fit:true,st:'taken'},
 {id:'T-5540',pl:'Сбер А (РФ)',org:'ПАО «Урал Прокат»',t:'Узлы вагоноопрокидывателя, ремонтный комплект',sum:0,dl:'01.12',fit:true,st:'new'}
];
let ITEMS={
 'С-214':[
  {n:'Чаша шлаковая 16,5 м³',gost:'ГОСТ 26215-84',dr:'ЧШ-16.5-00.000 СБ, рев. 3 (модернизация: усилен борт)',q:6,fp:2480000,fc:'CNY',sh:0},
  {n:'Цапфа чаши (запасная)',gost:'ГОСТ 1050-2013',dr:'ЧШ-16.5-02.000, рев. 2',q:12,fp:96000,fc:'CNY',sh:0}
 ],
 'С-191':[
  {n:'Колесо ходовое',gost:'ГОСТ 10791-2011',dr:'ПШ16-04.100',q:8,sh:8},{n:'Ось колёсной пары',gost:'ГОСТ 33200',dr:'ПШ16-04.200',q:4,sh:4},{n:'Букса',gost:'—',dr:'ПШ16-04.300',q:8,sh:8},
  {n:'Механизм кантования, вал',gost:'ГОСТ 8479',dr:'ПШ16-07.010',q:2,sh:0},{n:'Шестерня кантования',gost:'ГОСТ 1643',dr:'ПШ16-07.020',q:2,sh:0},{n:'Венец зубчатый',gost:'ГОСТ 1643',dr:'ПШ16-07.030',q:1,sh:0},
  {n:'Опора чаши',gost:'—',dr:'ПШ16-02.000',q:4,sh:0},{n:'Тормоз колодочный',gost:'—',dr:'ТКГ-300',q:2,sh:0},{n:'Редуктор Ц2-500',gost:'ГОСТ 20373',dr:'паспорт завода',q:1,sh:0},{n:'Муфта зубчатая',gost:'ГОСТ Р 50895',dr:'МЗ-6',q:2,sh:0}
 ]
};
let RFQ=[
 {id:'R-77',d:'С-209',pl:'F2',sent:'12.11',ans:'16.11',price:1620000,cur:'CNY',days:90,st:'ans',note:'с термообработкой ТВЧ, ОТК завода'},
 {id:'R-78',d:'С-209',pl:'F4',sent:'12.11',ans:'17.11',price:19800000,cur:'RUB',days:110,st:'ans',note:'с доставкой до Екатеринбурга'},
 {id:'R-79',d:'С-209',pl:'F5',sent:'12.11',ans:'—',price:0,cur:'RUB',days:0,st:'wait',note:'запросили чертёж в DWG'},
 {id:'R-81',d:'С-205',pl:'F3',sent:'17.11',ans:'—',price:0,cur:'CNY',days:0,st:'wait',note:'отправлены чертежи ротора, рев. 1965 г. и модернизация'},
 {id:'R-82',d:'С-205',pl:'F4',sent:'17.11',ans:'—',price:0,cur:'RUB',days:0,st:'wait',note:''},
 {id:'R-74',d:'С-214',pl:'F1',sent:'05.11',ans:'08.11',price:2150000,cur:'CNY',days:75,st:'won',note:'6 чаш, FCA Таншань'},
 {id:'R-75',d:'С-214',pl:'F5',sent:'05.11',ans:'10.11',price:27400000,cur:'RUB',days:80,st:'ans',note:'6 чаш, самовывоз'}
];
const RATE={CNY:66.4,RUB:5.9,USD:483,KZT:1};
let PAY=[
 {d:'С-191',cl:'C5',inv:'№ 412 от 01.10',sum:17670000,paid:17670000,due:'10.10',st:'ok'},
 {d:'С-191',cl:'C5',inv:'№ 455 от 05.11 (партия 1)',sum:20600000,paid:0,due:'15.11',st:'late'},
 {d:'С-187',cl:'C6',inv:'№ 431 от 14.10 (аванс 50%)',sum:20650000,paid:20650000,due:'20.10',st:'ok'},
 {d:'С-176',cl:'C2',inv:'№ 388 от 02.09',sum:96500000,paid:96500000,due:'30.09',st:'ok'},
 {d:'С-198',cl:'C3',inv:'аванс 30% по договору',sum:63600000,paid:0,due:'28.11',st:'plan'}
];
let MSG=[
 {ch:'WhatsApp',who:'Бекетов А. С.',d:'С-214',cl:'C1',t:'10:02',x:'Получили КП по чашам. Можно ли сократить срок до 60 дней? И нужен паспорт качества на каждую чашу.'},
 {ch:'WeChat',who:'Tangshan Heavy Forge · Mr. Liu',d:'С-214',cl:'',t:'09:41',x:'We can do 65 days if advance 30% before 25 Nov. Mill certificate 3.1 included.'},
 {ch:'Почта',who:'zakup@ertis-fs.kz',d:'С-209',cl:'C2',t:'09:15',x:'Просим уточнить модуль и материал шестерни: 40ХН или 35ХМЛ? Приложили старый чертёж 1978 г.'},
 {ch:'Telegram',who:'Соколов И. П.',d:'С-205',cl:'C4',t:'08:50',x:'Отправил фото износа ротора и схему привода. Ждём предложение до конца недели.'},
 {ch:'MAX',who:'Гринёв Д. А.',d:'С-191',cl:'C5',t:'вчера',x:'Партию 2 ждём к 25.11, машину на приёмку выделим.'},
 {ch:'Почта',who:'sales@uraltyazhmash.ru',d:'С-209',cl:'',t:'вчера',x:'Коммерческое предложение по шестерне m=20 z=180 во вложении, срок 110 дней.'}
];
let CALLS=[
 {t:'10:05',dir:'вх',who:'Бекетов А. С.',cl:'C1',m:'M3',dur:'6:12',rec:true},
 {t:'09:30',dir:'исх',who:'Шарипов Н. К.',cl:'C2',m:'M4',dur:'3:48',rec:true},
 {t:'09:12',dir:'проп',who:'+7 701 *** 44 18',cl:'',m:'M3',dur:'—',rec:false},
 {t:'вчера',dir:'исх',who:'Соколов И. П.',cl:'C4',m:'M1',dur:'11:20',rec:true}
];
let KPC={fp:2150000,cur:'CNY',log:9800000,cust:2.5,mk:18,out:'KZT'};
let ONEC=true;
const SC={};
const inWork=()=>DL.filter(d=>!['done'].includes(d.st)&&seeD(d));
SC.dash=()=>{const W=inWork();const sum=W.reduce((a,d)=>a+d.sum,0);const debt=PAY.filter(p=>p.st==='late').reduce((a,p)=>a+p.sum-p.paid,0);const tn=TND.filter(t=>t.fit&&t.st==='new');
return `<div class="hd"><div><h2>Пульт директора · ${TODAY}, ${NOW} по Алматы</h2><p>Директор работает из другой страны — всё, что сейчас приходится спрашивать у менеджеров и собирать из Excel, видно одним экраном: воронка, тендеры с дедлайнами, ответы заводов, отгрузки и долги.</p></div><div class="btns"><button class="bt" onclick="xls()">Excel</button><button class="bt p" onclick="go('funnel')">Воронка</button></div></div>
${said('Сейчас всё в Excel. Нужно, чтобы на одном экране были блоки: тендерные заявки, проработка с заводом, договор — и директор видел, что происходит.','Пульт собирается сам из воронки, тендеров, запросов на заводы и оплат. Менеджеры в России и Казахстане работают в одной системе.')}
<div class="strip"><div><small>Сделок в работе</small><b>${W.length}</b><span>${W.filter(d=>['tender','work','rfq','price'].includes(d.st)).length} на проработке · ${W.filter(d=>['dog','prod','ship'].includes(d.st)).length} на исполнении</span></div><div><small>Сумма в работе</small><b>${mln(sum)}</b><span>по курсу на ${TODAY}</span></div><div><small>Тендеры по профилю</small><b>${tn.length}</b><span>ближайший дедлайн ${tn.map(t=>t.dl).sort()[0]||'—'}</span></div><div><small>Ждём ответа завода</small><b>${RFQ.filter(r=>r.st==='wait').length}</b><span>Китай и Россия</span></div><div><small>Просроченная дебиторка</small><b class="bad">${mln(debt)}</b><span>${PAY.filter(p=>p.st==='late').length} счёт</span></div></div>
<div class="g21"><div>
 <div class="pan"><h3>Воронка по этапам</h3><div class="tw"><table class="t"><thead><tr><th>Этап</th><th class="r">Сделок</th><th class="r">Сумма</th><th style="width:30%"></th></tr></thead><tbody>${ST.filter(s=>s[0]!=='done').map(([k,n])=>{const L=DL.filter(d=>d.st===k&&seeD(d));const s=L.reduce((a,d)=>a+d.sum,0);return `<tr onclick="go('funnel')"><td>${n}</td><td class="r">${L.length}</td><td class="r">${s?mln(s):'—'}</td><td>${bar(pct(s,sum)||4,'g')}</td></tr>`}).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Ближайшие шаги по сделкам</h3><div class="tw"><table class="t"><thead><tr><th>Срок</th><th>Сделка</th><th>Заказчик</th><th>Что сделать</th><th>Менеджер</th></tr></thead><tbody>${W.filter(d=>d.next!=='—').sort((a,b)=>a.next.localeCompare(b.next)).map(d=>`<tr onclick="CURD='${d.id}';go('card')"><td class="mono">${d.next}</td><td><b>${d.id}</b> ${esc(d.t)}</td><td>${esc(CN(d.cl))}</td><td>${esc(d.nextT)}</td><td>${esc(MF(d.m))}</td></tr>`).join('')}</tbody></table></div></div>
</div><div>
 <div class="pan"><h3>Требует внимания</h3><div class="alist">
  <a onclick="go('tenders')"><i class="dt r"></i><b>Тендер T-5521: подача до 24.11</b><span>шлаковые чаши 16,5 м³ · zakup.sk.kz · документы не собраны</span></a>
  <a onclick="go('debt')"><i class="dt r"></i><b>АО «Кузбасс Коксохим»: счёт № 455 просрочен 3 дня</b><span>20,6 млн ₸ · партия 1 отгружена 05.11</span></a>
  <a onclick="go('rfq')"><i class="dt w"></i><b>С-209: две цены заводов — выбрать</b><span>Лоян 1,62 млн ¥ · УралТяжМаш 19,8 млн ₽</span></a>
  <a onclick="go('inbox')"><i class="dt w"></i><b>Заказчик просит срок 60 дней по С-214</b><span>завод готов на 65 дней при авансе до 25.11</span></a>
  <a onclick="go('ship')"><i class="dt i"></i><b>С-191: отгружено 3 позиции из 10</b><span>партия 2 — 25.11</span></a>
 </div></div>
 <div class="pan"><h3>Менеджеры · ноябрь</h3><div class="tw"><table class="t sm"><thead><tr><th>Менеджер</th><th>Страна</th><th class="r">Сделок</th></tr></thead><tbody>${MGR.map(m=>`<tr onclick="go('mgr')"><td>${esc(m.n)}</td><td>${m.c}</td><td class="r">${DL.filter(d=>d.m===m.id&&d.st!=='done').length}</td></tr>`).join('')}</tbody></table></div></div>
</div></div>`};
SC.rep=()=>`<div class="hd"><div><h2>Отчёты</h2><p>Любой отчёт выгружается в Excel. Формулы и разрезы согласуем на полировке.</p></div><div class="btns"><button class="bt" onclick="xls()">Excel</button></div></div>
<div class="g2"><div class="pan"><h3>Выигранные и проигранные · 2026</h3><div class="tw"><table class="t"><thead><tr><th>Источник</th><th class="r">Сделок</th><th class="r">Выиграно</th><th class="r">Конверсия</th></tr></thead><tbody>
<tr><td>Тендеры Самрук-Казына</td><td class="r">31</td><td class="r">9</td><td class="r">29%</td></tr><tr><td>Казахстанская индустрия</td><td class="r">12</td><td class="r">4</td><td class="r">33%</td></tr><tr><td>Прямые запросы и повторные</td><td class="r">26</td><td class="r">14</td><td class="r">54%</td></tr><tr><td>Площадки РФ</td><td class="r">9</td><td class="r">2</td><td class="r">22%</td></tr></tbody></table></div></div>
<div class="pan"><h3>Причины проигрыша</h3><div class="tw"><table class="t"><tbody><tr><td>Цена выше конкурента</td><td class="r">17</td></tr><tr><td>Срок изготовления</td><td class="r">9</td></tr><tr><td>Не прошли по документам</td><td class="r">5</td></tr><tr><td>Заказчик отменил закупку</td><td class="r">4</td></tr></tbody></table></div></div></div>
<div class="g2"><div class="pan"><h3>Заводы: средний срок и отклонение</h3><div class="tw"><table class="t"><thead><tr><th>Завод</th><th class="r">Обещано, дн.</th><th class="r">Факт, дн.</th></tr></thead><tbody>${PL.map((p,i)=>`<tr><td>${esc(p.n)}</td><td class="r">${p.days}</td><td class="r ${i===2?'bad':''}">${p.days+[3,8,21,5,2][i]}</td></tr>`).join('')}</tbody></table></div></div>
<div class="pan"><h3>Маржа по направлениям · 2026</h3><div class="tw"><table class="t"><tbody><tr><td>Шлаковые чаши и шлаковозы</td><td class="r">22%</td></tr><tr><td>Шестерни, валы-шестерни</td><td class="r">27%</td></tr><tr><td>Бандажи и ролики печей</td><td class="r">19%</td></tr><tr><td>Вагоноопрокидыватели, узлы</td><td class="r">24%</td></tr></tbody></table></div><p class="sm2 mut">Маржу видят директор и бухгалтер. Менеджеры — только свои сделки без себестоимости, если так решите.</p></div></div>`;
SC.mgr=()=>`<div class="hd"><div><h2>Менеджеры и KPI</h2><p>6 менеджеров в России и Казахстане. План, сделки, отклик клиентам и сроки — по каждому.</p></div></div>
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Менеджер</th><th>Страна, город</th><th class="r">В работе</th><th class="r">Сумма</th><th class="r">КП за месяц</th><th class="r">Договоров</th><th class="r">Первый ответ</th><th style="width:16%">План</th></tr></thead><tbody>${MGR.map((m,i)=>{const L=DL.filter(d=>d.m===m.id&&d.st!=='done');const s=L.reduce((a,d)=>a+d.sum,0);const p=[62,48,81,55,40,58][i];return `<tr><td><b>${esc(m.n)}</b></td><td>${m.c} · ${m.city}</td><td class="r">${L.length}</td><td class="r">${s?mln(s):'—'}</td><td class="r">${[6,4,9,5,3,4][i]}</td><td class="r">${[1,1,2,1,0,1][i]}</td><td class="r">${['14 мин','41 мин','9 мин','22 мин','1 ч 10 мин','18 мин'][i]}</td><td>${bar(p,p<50?'r':'g')}</td></tr>`}).join('')}</tbody></table></div></div>`;
function takeT(id){const t=TND.find(x=>x.id===id);t.st='taken';const n='С-'+(217+DL.length%9);const cl=CL.find(c=>c.n===t.org);DL.unshift({id:n,t:t.t,cl:cl?cl.id:'C1',m:MEID()||'M3',st:'tender',sum:t.sum,cur:'KZT',src:'Тендер '+t.pl,next:t.dl,nextT:'Подать заявку на площадке',pl:''});CURD=n;render();toast(`Тендер взят в работу — создана сделка <b>${n}</b> на этапе «Тендер», дедлайн подачи ${t.dl}.`)}
let TF='fit';
SC.tenders=()=>{const L=TND.filter(t=>TF==='all'||t.fit);
return `<div class="hd"><div><h2>Лента тендеров</h2><p>Новые закупки с площадок по вашему профилю — чаши, шлаковозы, шестерни, бандажи, вагоноопрокидыватели. Где площадка даёт рассылку или API — приходят сами; где нужен вход по ЭЦП — специалист подтверждает вручную.</p></div><div class="btns"><div class="seg"><a class="${TF==='fit'?'on':''}" onclick="TF='fit';render()">По профилю</a><a class="${TF==='all'?'on':''}" onclick="TF='all';render()">Все</a></div></div></div>
${said('Мы участвуем на тендерных площадках. Можно ли, чтобы с них нам приходили сообщения о запущенных тендерах — у них есть такая функция за отдельную плату?','Подключаем рассылку или API площадки там, где она это даёт. Новый тендер сразу видно в ленте с дедлайном, в один клик — сделка в воронке.')}
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>№</th><th>Площадка</th><th>Заказчик</th><th>Предмет</th><th class="r">Сумма</th><th>Подача до</th><th>Статус</th><th></th></tr></thead><tbody>${L.map(t=>`<tr><td class="mono">${t.id}</td><td>${t.pl}</td><td>${esc(t.org)}</td><td><b>${esc(t.t)}</b>${t.fit?'':' '+tag('не профиль','w')}</td><td class="r">${t.sum?mln(t.sum):'—'}</td><td class="mono ${+t.dl.slice(0,2)-TD<=6&&t.dl.slice(3)==='11'?'bad':''}">${t.dl}</td><td>${t.st==='taken'?tag('в работе','g'):tag('новый','b')}</td><td>${t.st==='new'&&t.fit?`<button class="bt sm p" onclick="takeT('${t.id}')">Взять в работу</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
<div class="g2"><div class="pan"><h3>Площадки и условия подключения</h3><div class="tw"><table class="t sm"><tbody><tr><td>zakup.sk.kz (Самрук-Казына)</td><td>платная подписка на уведомления площадки или разбор публичной ленты; действия — по ЭЦП</td></tr><tr><td>Казахстанская индустрия</td><td>по запросу доступа у оператора; уведомления по профилю</td></tr><tr><td>goszakup.gov.kz</td><td>открытый API госзакупок по токену</td></tr><tr><td>Площадки РФ</td><td>рассылки площадки на почту → разбор в ленту</td></tr></tbody></table></div><p class="sm2 mut">Каждую площадку проверим отдельно до начала работ. Подписки площадок оплачивает Заказчик.</p></div>
<div class="pan"><h3>Профиль отбора</h3><p>Ключевые слова: шлаковая чаша, шлаковоз, бандаж, венцовая шестерня, вал-шестерня, вагоноопрокидыватель, ролик опорный, редуктор. Страны: Казахстан, Россия, Узбекистан. Сумма от 10 млн ₸.</p><button class="bt" onclick="toast('Профиль сохранён: ленту фильтрует система, лишние закупки не показываются.')">Изменить профиль</button></div></div>`};
function moveD(id,dir){const d=DL.find(x=>x.id===id);const i=ST.findIndex(s=>s[0]===d.st);const j=Math.max(0,Math.min(ST.length-1,i+dir));d.st=ST[j][0];render();toast(`${d.id}: этап «${STN(d.st)}».`)}
SC.funnel=()=>{const L=DL.filter(seeD);
return `<div class="hd"><div><h2>Воронка сделок</h2><p>Этапы под ваш процесс: тендер → проработка → запрос на завод → цена завода → КП → договор → производство → отгрузка частями. ${MEID()?'Вы видите только свои сделки.':'Директор видит сделки всех менеджеров.'}</p></div></div>
${said('Это должны быть блоки: тендерные заявки, потом в проработку — отправили на завод для получения цены, потом получили договор. И чтобы на одном экране.','')}
<div class="kanban dk" style="grid-template-columns:repeat(9,minmax(165px,1fr))">${ST.map(([k,n])=>`<div class="kcol"><div class="kh"><b>${n}</b><span>${L.filter(d=>d.st===k).length}</span></div>${L.filter(d=>d.st===k).map(d=>`<div class="kc" onclick="CURD='${d.id}';go('card')"><code>${d.id} · ${esc(MF(d.m))}</code><b>${esc(d.t)}</b><span>${esc(CN(d.cl))}</span>${d.sum?`<em>${mln(d.sum)}</em>`:''}<span>${d.next!=='—'?d.next+' · ':''}${esc(d.nextT)}</span><div class="btns l"><button class="bt sm" onclick="event.stopPropagation();moveD('${d.id}',-1)">←</button><button class="bt sm" onclick="event.stopPropagation();moveD('${d.id}',1)">Дальше →</button></div></div>`).join('')}</div>`).join('')}</div>`};
SC.card=()=>{let d=DL.find(x=>x.id===CURD&&seeD(x))||DL.find(seeD);CURD=d.id;const I=ITEMS[d.id]||ITEMS['С-214'];const M=MSG.filter(m=>m.d===d.id);
return `<div class="hd"><div><h2>${d.id} · ${esc(d.t)}</h2><p>${esc(CN(d.cl))} · менеджер ${esc(MN(d.m))} · источник: ${esc(d.src)} · этап ${tag(STN(d.st),'b')}</p></div><div class="btns"><select class="sel" onchange="CURD=this.value;render()">${DL.filter(seeD).map(x=>`<option ${x.id===d.id?'selected':''} value="${x.id}">${x.id} · ${esc(x.t.slice(0,34))}</option>`).join('')}</select><button class="bt p" onclick="go('kp')">Собрать КП</button></div></div>
<div class="stps st9">${ST.map(([k,n])=>`<div class="${ST.findIndex(s=>s[0]===k)<=ST.findIndex(s=>s[0]===d.st)?'on':''}">${n}</div>`).join('')}</div>
<div class="g21"><div>
 <div class="pan"><h3>Спецификация · позиции с чертежами и ГОСТ</h3><div class="tw"><table class="t"><thead><tr><th>Позиция</th><th>ГОСТ</th><th>Чертёж, ревизия</th><th class="r">Кол-во</th><th class="r">Отгружено</th></tr></thead><tbody>${I.map(i=>`<tr><td><b>${esc(i.n)}</b></td><td>${i.gost}</td><td><a onclick="go('draw')">${esc(i.dr)}</a></td><td class="r">${i.q}</td><td class="r">${i.sh}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>История цен по сделке</h3><div class="tw"><table class="t sm"><tbody>${RFQ.filter(r=>r.d===d.id&&r.price).map(r=>`<tr><td>${r.ans}</td><td>${esc(PN(r.pl))}</td><td class="r">${fmt(r.price)} ${r.cur}</td><td class="r">${tg(r.price*RATE[r.cur])}</td></tr>`).join('')||'<tr><td>Цен от заводов пока нет — запросы отправлены.</td></tr>'}</tbody></table></div></div>
</div><div>
 <div class="pan"><h3>Переписка по сделке · все каналы</h3>${M.length?M.map(m=>`<div class="msg"><b>${esc(m.who)}</b><code>${m.ch} · ${m.t}</code><p>${esc(m.x)}</p></div>`).join(''):'<p class="mut">Сообщений пока нет.</p>'}<button class="bt sm" onclick="go('inbox')">Открыть окно сообщений</button></div>
 <div class="pan"><h3>Файлы</h3><div class="kv"><span>Чертежи заказчика</span><b>3 файла · PDF, DWG</b></div><div class="kv"><span>Техническое задание тендера</span><b>ТЗ_${d.id}.pdf</b></div><div class="kv"><span>Ответы заводов</span><b>${RFQ.filter(r=>r.d===d.id).length} письма</b></div><div class="kv"><span>КП и договор</span><b>${['kp','dog','prod','ship','done'].includes(d.st)?'КП отправлено':'—'}</b></div></div>
</div></div>`};
function pickF(id){const r=RFQ.find(x=>x.id===id);RFQ.filter(x=>x.d===r.d).forEach(x=>{if(x.st==='won')x.st='ans'});r.st='won';const d=DL.find(x=>x.id===r.d);if(d){d.pl=r.pl;if(['rfq','price','work'].includes(d.st))d.st='price';d.sum=d.sum||Math.round(r.price*RATE[r.cur]*1.25)}render();toast(`Завод выбран: <b>${esc(PN(r.pl))}</b>. Цена ушла в КП-конструктор сделки ${r.d}.`)}
SC.rfq=()=>{const L=RFQ.filter(r=>{const d=DL.find(x=>x.id===r.d);return d&&seeD(d)});const ds=[...new Set(L.map(r=>r.d))];
return `<div class="hd"><div><h2>Запросы на заводы</h2><p>Чертежи уходят на заводы Китая и России из карточки сделки. Ответы — цена, валюта, срок изготовления — собираются в таблицу сравнения. Директор видит переписку, даже если сам ведёт почту с заводами.</p></div><div class="btns"><button class="bt p" onclick="toast('Запрос отправлен на 3 завода по профилю позиции: письмо с чертежами и сроком ответа. Ответы попадут сюда.')">Новый запрос</button></div></div>
${said('Мы берём чертежи заводов-изготовителей, предоставляем заказчику с согласованием, потом отдаём чертежи на завод в Китай, по которым они нам изготавливают.','')}
${ds.map(dd=>{const d=DL.find(x=>x.id===dd);return `<div class="pan"><h3>${dd} · ${esc(d.t)}</h3><div class="tw"><table class="t"><thead><tr><th>Завод</th><th>Отправлено</th><th>Ответ</th><th class="r">Цена</th><th class="r">В тенге</th><th class="r">Срок, дн.</th><th>Примечание</th><th></th></tr></thead><tbody>${L.filter(r=>r.d===dd).map(r=>`<tr><td><b>${esc(PN(r.pl))}</b><br><small class="mut">${(PL.find(p=>p.id===r.pl)||{}).c}</small></td><td>${r.sent}</td><td>${r.ans}</td><td class="r">${r.price?fmt(r.price)+' '+r.cur:'—'}</td><td class="r">${r.price?tg(r.price*RATE[r.cur]):'—'}</td><td class="r">${r.days||'—'}</td><td>${esc(r.note)}</td><td>${r.st==='won'?tag('выбран','g'):r.st==='ans'?`<button class="bt sm p" onclick="pickF('${r.id}')">Выбрать</button>`:tag('ждём ответ','w')}</td></tr>`).join('')}</tbody></table></div></div>`}).join('')}`};
SC.draw=()=>`<div class="hd"><div><h2>Чертежи и ГОСТ</h2><p>Каждый чертёж — с версиями: исходный от заказчика, чертёж завода-изготовителя и модернизированный вариант, который согласовали. Привязан к позиции спецификации и уходит на завод из сделки.</p></div><div class="btns"><button class="bt p" onclick="toast('Новая ревизия загружена: старая сохраняется в истории, на завод уходит только утверждённая.')">Загрузить ревизию</button></div></div>
${said('Завод даёт древние чертежи, которым полвека. Мы берём чертежи другого завода и предлагаем по ним уже модернизированный вариант.','')}
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Обозначение</th><th>Наименование</th><th>Ревизии</th><th>Источник</th><th>ГОСТ</th><th>Сделка</th><th>Статус</th></tr></thead><tbody>
<tr><td class="mono">ЧШ-16.5-00.000 СБ</td><td>Чаша шлаковая 16,5 м³</td><td>1 — заказчик, 1981 · 2 — завод · <b>3 — модернизация: усилен борт</b></td><td>чертёж завода-изготовителя</td><td>ГОСТ 26215-84</td><td>С-214</td><td>${tag('согласован заказчиком','g')}</td></tr>
<tr><td class="mono">ШВ-20-180</td><td>Шестерня венцовая m=20, z=180</td><td>1 — заказчик, 1978 · 2 — пересчёт под 40ХН</td><td>старый чертёж заказчика</td><td>ГОСТ 1643-81</td><td>С-209</td><td>${tag('на согласовании','w')}</td></tr>
<tr><td class="mono">ВРС-125.02.000</td><td>Ротор вагоноопрокидывателя</td><td>1 — 1965 г. · 2 — модернизация привода</td><td>чертёж другого завода</td><td>—</td><td>С-205</td><td>${tag('отправлен на заводы','b')}</td></tr>
<tr><td class="mono">БП-5200</td><td>Бандаж печи Ø 5,2 м</td><td>1 — завод · 2 — по замерам заказчика</td><td>чертёж завода-изготовителя</td><td>ГОСТ 977-88</td><td>С-198</td><td>${tag('утверждён','g')}</td></tr>
</tbody></table></div><p class="sm2 mut">Права: менеджер видит чертежи своих сделок; директор и тендерный специалист — все.</p></div>`;
function kpSet(k,v){KPC[k]=k==='cur'||k==='out'?v:(+String(v).replace(/\s/g,'')||0);render()}
function kpCalc(){const base=KPC.fp*RATE[KPC.cur];const cost=base+KPC.log;const cust=cost*KPC.cust/100;const net=cost+cust;const price=net*(1+KPC.mk/100);return {base,cost,cust,net,price,margin:price-net}}
SC.kp=()=>{const c=kpCalc();const out=c.price/RATE[KPC.out];
return `<div class="hd"><div><h2>КП-конструктор · С-214</h2><p>Цена завода в валюте + логистика + таможня + наценка → цена для заказчика в нужной валюте. КП уходит PDF на почту или в мессенджер, расчёт сохраняется в сделке.</p></div><div class="btns"><button class="bt p" onclick="toast('КП № 214/1 сформировано: PDF с логотипом, спецификацией, сроком 65–75 дней и условиями оплаты. Сохранено в сделке С-214.')">Сформировать КП</button></div></div>
${said('Цену завода получаем в юанях или рублях, считаем логистику, таможню, свою наценку — и выставляем в тенге, рублях или долларах.','')}<div class="g21"><div class="pan"><h3>Расчёт</h3><div class="roi">
<div><label>Цена завода</label><input value="${fmt(KPC.fp)}" onchange="kpSet('fp',this.value)"></div>
<div><label>Валюта завода</label><select class="sel" onchange="kpSet('cur',this.value)">${['CNY','RUB','USD'].map(x=>`<option ${x===KPC.cur?'selected':''}>${x}</option>`).join('')}</select></div>
<div><label>Логистика до заказчика, ₸</label><input value="${fmt(KPC.log)}" onchange="kpSet('log',this.value)"></div>
<div><label>Таможня и сертификация, %</label><input value="${KPC.cust}" onchange="kpSet('cust',this.value)"></div>
<div><label>Наценка, %</label><input value="${KPC.mk}" onchange="kpSet('mk',this.value)"></div>
<div><label>Валюта КП</label><select class="sel" onchange="kpSet('out',this.value)">${['KZT','RUB','USD'].map(x=>`<option ${x===KPC.out?'selected':''}>${x}</option>`).join('')}</select></div>
</div><p class="sm2 mut">Курс ${KPC.cur} = ${RATE[KPC.cur]} ₸ на ${TODAY}. Курсы берём из Нацбанка РК; при необходимости — ручная фиксация на дату КП.</p></div>
<div class="pan"><h3>Итог</h3><div class="kv"><span>Завод в тенге</span><b>${tg(c.base)}</b></div><div class="kv"><span>+ логистика</span><b>${tg(KPC.log)}</b></div><div class="kv"><span>+ таможня и сертификация</span><b>${tg(c.cust)}</b></div><div class="kv"><span>Себестоимость</span><b>${tg(c.net)}</b></div><div class="kv tot"><span>Цена заказчику</span><b>${fmt(out)} ${KPC.out}</b></div><div class="kv"><span>Маржа</span><b class="${KPC.mk<12?'bad':'ok'}">${tg(c.margin)} · ${KPC.mk}%</b></div>${KPC.mk<12?'<p class="bad sm2">Наценка ниже 12% — КП уйдёт на согласование директору.</p>':''}</div></div>`};
SC.contract=()=>`<div class="hd"><div><h2>Договоры и спецификации</h2><p>Договор собирается из шаблона: реквизиты заказчика, спецификация из сделки, сроки, условия оплаты и поставки (Incoterms). Согласование — внутри системы, подписанная версия хранится в сделке.</p></div><div class="btns"><button class="bt p" onclick="toast('Договор № 198/26 и спецификация № 1 собраны из шаблона «Поставка оборудования, КЗ» и отправлены на согласование директору.')">Собрать договор</button></div></div>
<div class="g2"><div class="pan"><h3>Шаблоны</h3><div class="tw"><table class="t sm"><tbody><tr><td>Поставка оборудования · Казахстан · KZT</td><td>${tag('основной','g')}</td></tr><tr><td>Поставка · Россия · RUB</td><td></td></tr><tr><td>Поставка · Узбекистан · USD</td><td></td></tr><tr><td>Спецификация к договору</td><td></td></tr><tr><td>Дополнительное соглашение о сроках</td><td></td></tr></tbody></table></div></div>
<div class="pan"><h3>С-198 · Бандажи печи · согласование</h3><div class="stps"><div class="on">Менеджер</div><div class="on">Юрист заказчика</div><div class="on">Директор</div><div>Подписание ЭЦП</div></div><div class="kv"><span>Сумма</span><b>${tg(212000000)}</b></div><div class="kv"><span>Оплата</span><b>30% аванс · 70% по факту отгрузки</b></div><div class="kv"><span>Срок</span><b>75 дней от аванса · DAP Усть-Каменогорск</b></div><div class="btns l"><button class="bt p" onclick="toast('Договор подписан. Сделка С-198 переходит в «Производство», бухгалтеру создан счёт на аванс.')">Подписано</button><button class="bt" onclick="toast('Договор возвращён менеджеру с комментарием.')">Вернуть</button></div></div></div>`;
function shipNext(){const I=ITEMS['С-191'];const r=I.filter(i=>i.sh<i.q).slice(0,3);r.forEach(i=>i.sh=i.q);render();toast(`Отгружено ещё ${r.length} позиции. Накладная создана, заказчику ушло уведомление, бухгалтеру — счёт на партию.`)}
SC.ship=()=>{const I=ITEMS['С-191'];const done=I.filter(i=>i.sh>=i.q).length;
return `<div class="hd"><div><h2>Производство и отгрузки</h2><p>Заказали 10 позиций — отгрузили 3: видно по каждой позиции, что изготовлено, что в пути, что осталось. Счёт и дебиторка — по партиям.</p></div><div class="btns"><button class="bt p" onclick="shipNext()">Отгрузить следующую партию</button></div></div>
<div class="strip"><div><small>С-191 · позиций</small><b>${done} / ${I.length}</b>${bar(pct(done,I.length),'g')}<span>отгружено</span></div><div><small>Партий</small><b>${done>=I.length?'3 / 3':done>3?'2 / 3':'1 / 3'}</b><span>следующая 25.11</span></div><div><small>С-187 · производство</small><b>62%</b><span>ОТК на заводе 02.12</span></div><div><small>С-198 · ждём аванс</small><b>до 28.11</b><span>старт производства после аванса</span></div></div>
<div class="pan"><h3>С-191 · Комплект запчастей шлаковоза ПШ-16 · АО «Кузбасс Коксохим»</h3><div class="tw"><table class="t"><thead><tr><th>Позиция</th><th>Чертёж</th><th class="r">Заказано</th><th class="r">Отгружено</th><th>Статус</th></tr></thead><tbody>${I.map(i=>`<tr><td><b>${esc(i.n)}</b></td><td class="mono">${esc(i.dr)}</td><td class="r">${i.q}</td><td class="r">${i.sh}</td><td>${i.sh>=i.q?tag('отгружено','g'):tag('изготовление','w')}</td></tr>`).join('')}</tbody></table></div></div>`};
SC.debt=()=>{const L=PAY;
return `<div class="hd"><div><h2>Дебиторка</h2><p>Оплаты по каждому счёту договора: аванс, партии, финал. Просрочка подсвечивается, напоминание уходит заказчику, менеджеру — задача.</p></div></div>
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Сделка</th><th>Заказчик</th><th>Счёт</th><th class="r">Сумма</th><th class="r">Оплачено</th><th>Срок</th><th>Статус</th><th></th></tr></thead><tbody>${L.map((p,i)=>`<tr><td>${p.d}</td><td>${esc(CN(p.cl))}</td><td>${p.inv}</td><td class="r">${tg(p.sum)}</td><td class="r">${tg(p.paid)}</td><td class="mono">${p.due}</td><td>${p.st==='ok'?tag('оплачено','g'):p.st==='late'?tag('просрочка','r'):tag('ожидается','b')}</td><td>${p.st==='late'?`<button class="bt sm" onclick="toast('Напоминание отправлено заказчику на почту и в MAX, менеджеру — задача позвонить сегодня.')">Напомнить</button>`:p.st==='plan'?`<button class="bt sm" onclick="PAY[${i}].paid=PAY[${i}].sum;PAY[${i}].st='ok';render();toast('Оплата отмечена. Сделка С-198 переходит в производство.')">Отметить оплату</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>`};
let CHF='Все';
function sendMsg(){const t=document.getElementById('mtx');if(!t||!t.value.trim())return;MSG.unshift({ch:CHF==='Все'?'WhatsApp':CHF,who:'Вы',d:'С-214',cl:'C1',t:NOW,x:t.value.trim()});render();toast('Отправлено из системы — переписка сохранена в карточке сделки.')}
SC.inbox=()=>{const L=MSG.filter(m=>CHF==='Все'||m.ch===CHF).filter(m=>{const d=DL.find(x=>x.id===m.d);return !d||seeD(d)});
return `<div class="hd"><div><h2>Единое окно сообщений</h2><p>WhatsApp, Telegram, MAX, WeChat и корпоративная почта Outlook — в одной ленте. Каждое сообщение привязано к заказчику или заводу и сделке.</p></div><div class="btns"><div class="seg">${['Все','WhatsApp','Telegram','MAX','WeChat','Почта'].map(c=>`<a class="${CHF===c?'on':''}" onclick="CHF='${c}';render()">${c}</a>`).join('')}</div></div></div>
${said('В России мы в трёх платформах: WhatsApp, Telegram и MAX. И корпоративная почта Outlook. А ещё WeChat — переписка и конференц-звонки с Китаем.','')}
<div class="pan">${L.map(m=>`<div class="msg"><b>${esc(m.who)}</b><code>${m.ch} · ${m.t} · ${m.d}</code><p>${esc(m.x)}</p></div>`).join('')||'<p class="mut">Сообщений нет.</p>'}
<div class="fld" style="margin-top:10px"><label>Ответ</label><input id="mtx" class="sel" placeholder="Напишите ответ…" onkeydown="if(event.key==='Enter')sendMsg()"></div><button class="bt p" onclick="sendMsg()">Отправить</button></div>`};
SC.calls=()=>`<div class="hd"><div><h2>Телефония</h2><p>Звонки из карточки в один клик, запись разговора, пропущенный — задача перезвонить. Номера в России и Казахстане — через одного оператора виртуальной АТС.</p></div></div>
<div class="strip"><div><small>Звонков сегодня</small><b>14</b><span>9 входящих, 5 исходящих</span></div><div><small>Пропущено</small><b>1</b><span>задача перезвонить создана</span></div><div><small>Средняя длительность</small><b>5:40</b><span>записи хранятся 12 месяцев</span></div></div>
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Тип</th><th>Собеседник</th><th>Заказчик</th><th>Менеджер</th><th class="r">Длительность</th><th>Запись</th></tr></thead><tbody>${CALLS.filter(c=>!MEID()||c.m===MEID()).map(c=>`<tr><td>${c.t}</td><td>${c.dir==='проп'?tag('пропущен','r'):c.dir==='вх'?'входящий':'исходящий'}</td><td>${esc(c.who)}</td><td>${esc(CN(c.cl))}</td><td>${esc(MF(c.m))}</td><td class="r">${c.dur}</td><td>${c.rec?`<button class="bt sm" onclick="toast('Воспроизведение записи разговора.')">Слушать</button>`:`<button class="bt sm p" onclick="toast('Перезвон из системы, задача закрыта.')">Перезвонить</button>`}</td></tr>`).join('')}</tbody></table></div></div>`;
SC.clients=()=>`<div class="hd"><div><h2>Заказчики</h2><p>Промышленные предприятия Казахстана, России и Узбекистана: контакты, сделки, оборудование, история поставок.</p></div></div>
<div class="strip"><div><small>Заказчиков в базе</small><b>${CL.length}</b><span>Казахстан, Россия, Узбекистан</span></div><div><small>Повторные заказы</small><b>4</b><span>за 2026 год</span></div><div><small>Без касания &gt; 60 дней</small><b>1</b><span>напоминание менеджеру</span></div></div>
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Заказчик</th><th>Страна, город</th><th>Контакт</th><th>Менеджер</th><th class="r">Сделок</th><th class="r">Поставлено, 2026</th></tr></thead><tbody>${CL.filter(c=>!MEID()||c.m===MEID()).map((c,i)=>`<tr><td><b>${esc(c.n)}</b></td><td>${c.c} · ${c.city}</td><td>${esc(c.ct)}<br><small class="mut">${c.ph}</small></td><td>${esc(MF(c.m))}</td><td class="r">${DL.filter(d=>d.cl===c.id).length}</td><td class="r">${mln([96500000,96500000,0,124000000,58900000,41300000,0][i])}</td></tr>`).join('')}</tbody></table></div></div>`;
SC.plants=()=>`<div class="hd"><div><h2>Заводы-изготовители</h2><p>База заводов Китая и России: что умеют, средние сроки, как с ними связываться, история цен и сроков по прошлым заказам.</p></div></div>
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Завод</th><th>Страна</th><th>Компетенции</th><th class="r">Срок, дн.</th><th>Связь</th><th class="r">Оценка</th></tr></thead><tbody>${PL.map(p=>`<tr><td><b>${esc(p.n)}</b><br><small class="mut">${p.city}</small></td><td>${p.c}</td><td>${esc(p.sk)}</td><td class="r">${p.days}</td><td>${p.ch}</td><td class="r">${p.rate}</td></tr>`).join('')}</tbody></table></div></div>`;
const PERM=['Пульт и все сделки','Свои сделки','Тендеры','Запросы на заводы и цены завода','Маржа и себестоимость','Договоры: подписание','Оплаты и дебиторка','Обмен с 1С'];
const PM={'Директор':'yyyyyyyy','Менеджер · Россия':'nyyypnnn','Менеджер · Казахстан':'nyyypnnn','Тендерный специалист':'nyyynnnn','Бухгалтер':'nnnnyyyy'};
SC.roles=()=>`<div class="hd"><div><h2>Роли и права</h2><p>Каждый входит под своей учётной записью. Менеджер видит свои сделки и заказчиков; маржу — по решению директора.</p></div></div>
<div class="pan"><div class="tw"><table class="t matrix"><thead><tr><th>Право</th>${Object.keys(PM).map(r=>`<th class="c">${r}</th>`).join('')}</tr></thead><tbody>${PERM.map((p,i)=>`<tr><td>${p}</td>${Object.values(PM).map(v=>`<td class="c ${v[i]}">${v[i]==='y'?'да':v[i]==='p'?'по решению':'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
SC.amo=()=>`<div class="hd"><div><h2>Сравнение с amoCRM</h2><p>Честно: amoCRM — хорошая коробка для воронки продаж. Ваш процесс — тендеры, заводы, чертежи, спецификации и частичные отгрузки — в коробку придётся встраивать доработками и виджетами.</p></div></div>
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Что нужно вам</th><th>amoCRM</th><th>Свой портал Pllato</th></tr></thead><tbody>
<tr><td>Воронка с вашими этапами</td><td>да</td><td>да</td></tr>
<tr><td>Спецификация с чертежами, ревизиями и ГОСТ</td><td>поля и вложения, без ревизий</td><td>да, позиции с версиями чертежей</td></tr>
<tr><td>Запросы на заводы и сравнение цен</td><td>нет, через задачи и Excel</td><td>да</td></tr>
<tr><td>Частичные отгрузки по позициям</td><td>нет</td><td>да</td></tr>
<tr><td>Лента тендеров по профилю</td><td>сторонние виджеты</td><td>да, по условиям каждой площадки</td></tr>
<tr><td>WhatsApp, Telegram, MAX, WeChat, почта</td><td>частично, платные интеграции</td><td>да, в одном окне</td></tr>
<tr><td>Оплата</td><td>за каждого пользователя каждый год</td><td>один раз, без абонплаты</td></tr>
<tr><td>Код и данные</td><td>у вендора</td><td>у вас, на вашем сервере</td></tr>
</tbody></table></div><p class="sm2 mut">Цифры за 3 года посчитаем по тарифу из КП amoCRM, которое у вас на руках.</p></div>`;
SC.onec=()=>`<div class="hd"><div><h2>Обмен с 1С · опция</h2><p>Договоры, счета и оплаты формируются в портале и уходят в 1С бухгалтера; оплаты возвращаются обратно. Отдельный пакет — 800 000 ₸, подключается, когда решите.</p></div></div>
<div class="g2"><div class="pan"><h3>Портал → 1С</h3><p>Контрагенты, договоры, счета на оплату, реализации по партиям.</p></div><div class="pan"><h3>1С → портал</h3><p>Поступления оплат, акты сверки, статус документов.</p></div></div>
<div class="pan"><h3>Журнал обмена</h3><div class="tw"><table class="t sm"><tbody><tr><td>10:12</td><td>Счёт № 455 → 1С</td><td>${tag('ок','g')}</td></tr><tr><td>09:58</td><td>Оплата по счёту № 431 ← 1С</td><td>${tag('ок','g')}</td></tr><tr><td>09:40</td><td>Контрагент АО «Алтай Цинк» → 1С</td><td>${tag('ок','g')}</td></tr><tr><td>вчера</td><td>Реализация по партии 1, С-191 → 1С</td><td>${tag('ок','g')}</td></tr><tr><td>вчера</td><td>Акт сверки с ТОО «Ертіс Ферросплав» ← 1С</td><td>${tag('ок','g')}</td></tr></tbody></table></div></div>`;
SC.launch=()=>{const t=2800000+(ONEC?800000:0);
return `<div class="hd"><div><h2>Стоимость</h2><p>Стандартный пакет разработки: портал под ваш процесс за 4–6 недель, 3–5 версий на полировке. Без абонплаты, код и сервер ваши, пользователей без ограничений.</p></div></div>
<div class="g21"><div class="pan"><div class="kv"><span>Стандартный пакет: воронка, тендеры, заводы, чертежи, КП, договоры, отгрузки, дебиторка, все каналы связи, телефония, отчёты</span><b>${tg(2800000)}</b></div>
<label class="chk2"><input type="checkbox" ${ONEC?'checked':''} onchange="ONEC=this.checked;render()"> Интеграция с 1С — ${tg(800000)}</label>
<div class="kv tot"><span>Итого</span><b>${tg(t)}</b></div></div>
<div class="pan"><h3>Оплата 30 / 40 / 30</h3><div class="kv"><span>Старт</span><b>${tg(t*.3)}</b></div><div class="kv"><span>База на сервере</span><b>${tg(t*.4)}</b></div><div class="kv"><span>Сдача</span><b>${tg(t*.3)}</b></div><p class="sm2 mut">3 месяца поддержки включены, далее $20 в час или ваши разработчики по документации.</p></div></div>`};
/* ===== Каркас ===== */
function searchDemo(v){if(!v)return;const q=v.toLowerCase();const d=DL.find(x=>seeD(x)&&(x.id+x.t+CN(x.cl)).toLowerCase().includes(q));if(d&&allowed('card')){CURD=d.id;go('card')}else toast('Не найдено в доступных вам сделках.')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Директор';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map((s,i)=>`<a class="ri ${s.k===SECOF[cur]?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><code>${String(i+1).padStart(2,'0')}</code><span>${s.n}</span><small>${s.d}</small></a>`).join('');
 const S=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=S.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('');
 const h=document.getElementById('shint');if(h)h.innerHTML=`<b>${esc(role)}</b>${esc(ROLES[role].note)}`}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Степь Индастриал';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function xls(){const h=`<html><head><meta charset="utf-8"></head><body><table border="1"><tr><th>Сделка</th><th>Заказчик</th><th>Этап</th><th>Сумма</th></tr>${DL.filter(seeD).map(d=>`<tr><td>${d.id} ${esc(d.t)}</td><td>${esc(CN(d.cl))}</td><td>${d.st}</td><td>${d.sum}</td></tr>`).join('')}</table></body></html>`;try{const b=new Blob(['\ufeff'+h],{type:'application/vnd.ms-excel'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='Сделки_'+TODAY+'.xls';document.body.appendChild(a);a.click();a.remove()}catch(e){}toast('Файл <b>Сделки.xls</b> скачан.')}
let theme='light';function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme()}
const TOUR=[['dash','1 · Пульт директора: воронка, тендеры, заводы, долги.'],['tenders','2 · Лента тендеров по профилю — в один клик сделка.'],['funnel','3 · Воронка: от тендера до отгрузки частями.'],['card','4 · Карточка: спецификация с чертежами и переписка.'],['rfq','5 · Запросы на заводы Китая и России.'],['kp','6 · КП-конструктор: завод + логистика + наценка + валюта.'],['ship','7 · Частичные отгрузки по позициям.'],['debt','8 · Дебиторка по счетам.'],['inbox','9 · Все мессенджеры и почта в одном окне.'],['amo','10 · Отличие от amoCRM.'],['launch','11 · 2,8 млн ₸, 4–6 недель, без абонплаты.']];
let ti=-1,tRun=false;function tour(){if(tRun){tRun=false;return}tRun=true;ti=-1;step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){tRun=false;toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Директор');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();tRun=false}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
