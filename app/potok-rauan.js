/* ПОТОК — CRM и учёт дистрибьютора промышленного оборудования (нефть, газ, энергетика): проекты заводов с долгим циклом продаж, входящие из почты, WhatsApp, сайта и телефонии с ИИ-черновиком ответа, номенклатура и прайсы с импортом Excel, подбор по опциям, разбор PDF-предложения поставщика ИИ, КП в валютах по курсу Нацбанка, договоры с ЭЦП и сроком поставки от предоплаты, поставки и логистика, оплаты и 1С, тендеры, команда. Все проекты, клиенты, цены и курсы вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const TODAY='19.10.2026',NOW='10:20';
const LOGO_I='<svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true"><rect x="12" y="12" width="76" height="76" rx="6" fill="none" stroke="currentColor" stroke-width="7"/><path d="M24 58c10 0 12-16 26-16s16 16 26 16" fill="none" stroke="var(--brand2,#f2b01e)" stroke-width="8" stroke-linecap="round"/><path d="M24 72h52" stroke="var(--brand2,#f2b01e)" stroke-width="6" stroke-linecap="round"/></svg>';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>«${q}»</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const tip=(h,t)=>`<div class="said bz-tip"><b>${h}</b><div class="said-a" style="margin-top:2px">${t}</div></div>`;

const SEC=[
 {k:'top',n:'Главное',sub:[['dash','Пульт собственника']]},
 {k:'sl',n:'Продажи',sub:[['inbox','Входящие: почта, WhatsApp, сайт'],['projects','Проекты заводов'],['project','Карточка проекта'],['funnel','Воронка по стадиям'],['tenders','Тендеры']]},
 {k:'kp',n:'Номенклатура и КП',sub:[['catalog','Номенклатура и прайсы'],['config','Подбор по опциям'],['aipdf','PDF поставщика → позиции (ИИ)'],['quote','Коммерческое предложение']]},
 {k:'ct',n:'Договоры и поставка',sub:[['contracts','Договоры и ЭЦП'],['supply','Поставки и логистика'],['pay','Оплаты, курсы, 1С']]},
 {k:'tm',n:'Команда',sub:[['team','Команда, звонки, задачи']]},
 {k:'sys',n:'Решение',sub:[['compare','Своя система или Odoo, Битрикс'],['launch','Стоимость и запуск']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Руководитель':{av:'РА',n:'Рауан',note:'Всё: проекты, КП, договоры, поставки, деньги, команда',s:ALL.slice()},
 'Менеджер по продажам':{av:'МП',n:'Данияр',note:'Входящие, свои проекты, КП, договоры, тендеры',s:['inbox','projects','project','funnel','tenders','catalog','config','aipdf','quote','contracts']},
 'Инженер по подбору':{av:'ИН',n:'Сергей · удалённо',note:'Опросные листы, подбор по опциям, разбор предложений поставщиков',s:['projects','project','catalog','config','aipdf','quote']},
 'Логист':{av:'ЛГ',n:'Алия',note:'Заказы производителям, отгрузки, таможня, сроки по договорам',s:['contracts','supply','pay']},
 'Бухгалтер':{av:'БХ',n:'аутсорс',note:'Оплаты, курсы, сверка с 1С, документы',s:['contracts','pay']}
};
let role='Руководитель',cur='dash',theme='light';

/* Курсы Нацбанка РК на сегодня (для примера) */
const RATE={USD:512.40,EUR:556.10,RUB:6.42,CNY:71.80,KZT:1};
const CUR={USD:'$',EUR:'€',RUB:'₽',CNY:'¥',KZT:'₸'};
const money=(v,c)=>c==='USD'||c==='EUR'?CUR[c]+' '+fmt(v):fmt(v)+' '+CUR[c];
const STG=[['lead','Заявка','#7a8792'],['design','Проектирование','#5d6fb0'],['budget','Заложено в бюджет','#2f7fb8'],['tender','Тендер','#b0731a'],['contract','Контракт','#1f8a5b'],['supply','Поставка','#0a8aa0'],['done','Закрыт','#3d4a55']];
const SN=k=>(STG.find(s=>s[0]===k)||['',k,'#888']);
const MGR=['Рауан','Данияр','Сергей'];
let PROJ=[
 {id:'П-021',n:'ГПЗ 2,5 млрд м³ газа · Атырауская обл.',cl:'«КазГазСтрой» (EPC-подрядчик)',inst:'проектный институт «НефтеГазПроект»',st:'budget',sum:412000,cur:'USD',prob:40,m:'Рауан',since:'03.2026',buy:'2027',next:'Позвонить ГИПу: ревизия опросных листов по расходомерам',nd:'22.10',pos:46,kp:3,last:'18.09',late:false},
 {id:'П-018',n:'Узел учёта газа · компрессорная станция',cl:'АО «ТрансГазСервис»',inst:'—',st:'tender',sum:186000,cur:'USD',prob:55,m:'Данияр',since:'06.2026',buy:'2026',next:'Подать тендерную заявку — срок 05.11',nd:'30.10',pos:12,kp:2,last:'14.10',late:false},
 {id:'П-024',n:'НПЗ: анализаторы влажности, гидроочистка',cl:'ТОО «Нефтепереработка-Запад»',inst:'—',st:'design',sum:96000,cur:'USD',prob:30,m:'Сергей',since:'08.2026',buy:'2027',next:'Получить опросные листы от технолога',nd:'21.10',pos:6,kp:1,last:'02.10',late:false},
 {id:'П-015',n:'Расходомеры на ГРС · магистральный газопровод · 8 шт.',cl:'ТОО «ГазТранзит»',inst:'—',st:'contract',sum:238000,cur:'USD',prob:100,m:'Рауан',since:'11.2025',buy:'2026',next:'Подтвердить производителю дату отгрузки',nd:'20.10',pos:8,kp:4,last:'16.10',late:false},
 {id:'П-011',n:'Нефтепромысел: переносные расходомеры',cl:'ТОО «Каспий Ойл Сервис»',inst:'—',st:'supply',sum:54000,cur:'USD',prob:100,m:'Данияр',since:'02.2026',buy:'2026',next:'Груз на таможне — передать документы брокеру',nd:'19.10',pos:3,kp:2,last:'17.10',late:false},
 {id:'П-014',n:'ТЭЦ: расходомеры пара, реконструкция котлов',cl:'АО «Энергоцентр»',inst:'проектный институт «ТеплоЭнергоПроект»',st:'budget',sum:142000,cur:'USD',prob:35,m:'Рауан',since:'04.2025',buy:'2026–2027',next:'Пора напомнить: полгода назад заложили в бюджет',nd:'15.10',pos:14,kp:2,last:'15.04',late:true},
 {id:'П-026',n:'Заявка с сайта: переносной расходомер жидкости',cl:'ТОО «Водоканал-Сервис»',inst:'—',st:'lead',sum:16000,cur:'USD',prob:20,m:'Данияр',since:'10.2026',buy:'2026',next:'Ответить: уточнить диаметр трубы и среду',nd:'19.10',pos:1,kp:0,last:'19.10',late:false},
 {id:'П-007',n:'Химзавод: датчики давления, 40 шт.',cl:'ТОО «ХимПром»',inst:'—',st:'done',sum:38000,cur:'USD',prob:100,m:'Данияр',since:'01.2026',buy:'2026',next:'Закрыт · поставлено 12.08',nd:'—',pos:2,kp:1,last:'12.08',late:false}
];
const PJ=id=>PROJ.find(p=>p.id===id);
let curProj='П-021';
const usd=p=>p.cur==='USD'?p.sum:p.sum*RATE[p.cur]/RATE.USD;
let AUDIT=[];
const SC={};
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const stTag=k=>{const s=SN(k);return `<span class="srct" style="--sc:${s[2]}">${s[1]}</span>`};
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
function openProj(id){curProj=id;go('project')}

/* Пульт */
SC.dash=()=>{const A=PROJ.filter(p=>p.st!=='done'),pipe=A.reduce((a,p)=>a+usd(p),0),w=A.reduce((a,p)=>a+usd(p)*p.prob/100,0);
 return `<div class="hd"><div><h2>Пульт собственника · ${TODAY}</h2><p>Всё, что сейчас разбросано по Trello, Google-таблицам и почте, — на одном экране: какие проекты в работе, где пора напомнить о себе, какие договоры идут по срокам поставки, где деньги.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('projects')"><small>Проектов в работе</small><b>${A.length}</b><span>${A.filter(p=>p.late).length} пора напомнить о себе</span></div>
  <div class="clk" onclick="go('funnel')"><small>Портфель проектов</small><b>$ ${fmt(pipe)}</b><span>с учётом вероятности $ ${fmt(w)}</span></div>
  <div class="clk" onclick="go('inbox')"><small>Новые входящие</small><b class="a">4</b><span>ИИ подготовил 3 черновика ответа</span></div>
  <div class="clk" onclick="go('contracts')"><small>До срока поставки</small><b class="w">52 дня</b><span>Д-2026-014 · ГазТранзит · до 10.12</span></div>
  <div class="clk" onclick="go('pay')"><small>Ждём оплату</small><b>$ ${fmt(166600+21600)}</b><span>2 договора · курс USD ${RATE.USD}</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Проекты по стадиям, $</h3>${bars(STG.filter(s=>s[0]!=='done').map(s=>[s[1],PROJ.filter(p=>p.st===s[0]).reduce((a,p)=>a+usd(p),0),'$ '+fmt(PROJ.filter(p=>p.st===s[0]).reduce((a,p)=>a+usd(p),0))]))}
  <h3 style="margin-top:14px">По производителям в КП за год</h3>${bars([['Panametrics',612000,'$ 612 000'],['Производитель из Китая · КИП',148000,'$ 148 000'],['«Квалитет» · пробоотбор',96000,'$ 96 000'],['Разовые поставщики',58000,'$ 58 000']])}</div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="openProj('П-014')"><i></i><div><b>ТЭЦ: полгода без контакта</b><span>заложили в бюджет в апреле — напомнить о себе, пока не зашёл другой</span></div></div>
  <div class="rf bad" onclick="go('supply')"><i></i><div><b>П-011: груз на таможне</b><span>передать брокеру инвойс и сертификат — сегодня</span></div></div>
  <div class="rf" onclick="go('inbox')"><i></i><div><b>Заявка с сайта без ответа 40 минут</b><span>ИИ подготовил черновик — проверить и отправить</span></div></div>
  <div class="rf" onclick="go('tenders')"><i></i><div><b>Тендер узла учёта газа — 05.11</b><span>не хватает сертификата происхождения</span></div></div>
  <div class="rf" onclick="go('contracts')"><i></i><div><b>Д-2026-014: срок поставки 10.12</b><span>производитель подтвердит отгрузку до 20.10</span></div></div></div></div>
 ${said('Хотелось бы это всё видеть в одном месте. Чем дальше, тем сложней станет')}`};

/* Входящие */
let INB=[
 {id:1,ch:'Сайт',from:'ТОО «Водоканал-Сервис»',t:'09:40',sub:'Нужен переносной расходомер жидкости для поверки узлов учёта',ai:'Здравствуйте! Спасибо за запрос. Чтобы подобрать переносной ультразвуковой расходомер, пришлите, пожалуйста: диаметр и материал трубы, среду и температуру, нужен ли журнал данных и взрывозащита. Можно заполнить опросный лист по ссылке. Ответим с коммерческим предложением в течение дня.',st:'draft',pj:'П-026'},
 {id:2,ch:'Почта',from:'ГИП · «НефтеГазПроект»',t:'09:12',sub:'Ревизия B опросных листов по расходомерам · ГПЗ',ai:'Добрый день! Получили ревизию B, спасибо. Инженер сверит изменения с нашим предложением КП-2026-028 и до 22.10 пришлёт обновлённое предложение по позициям FT-101…FT-118.',st:'draft',pj:'П-021'},
 {id:3,ch:'WhatsApp',from:'+7 701 *** 22 18',t:'08:55',sub:'Добрый день, вы поставляете анализаторы влажности газа?',ai:'Здравствуйте! Да, мы официальный дистрибьютор. Напишите, пожалуйста, вашу почту — пришлём каталог и опросный лист, дальше удобнее вести переписку по почте.',st:'draft',pj:''},
 {id:4,ch:'Звонок',from:'АО «ТрансГазСервис» · 4:18',t:'вчера 17:30',sub:'Вопрос по сроку поставки в тендерной заявке',ai:'',st:'done',pj:'П-018'}
];
SC.inbox=()=>`<div class="hd"><div><h2>Входящие: почта, WhatsApp, сайт, звонки</h2><p>Все обращения в одном окне. Почта — ваш Google Workspace, WhatsApp — любой номер, заявки с сайта и звонки IP-телефонии. На рутинное первое касание ИИ-агент готовит черновик: поблагодарить, запросить опросный лист, попросить почту. Менеджер проверяет и отправляет — ИИ не отвечает сам без человека.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Канал</th><th>От кого</th><th>Время</th><th>Тема</th><th>Проект</th><th>Черновик ИИ</th></tr></thead><tbody>${INB.map(m=>`<tr class="${m.st==='draft'?'':'rowok'}"><td>${tag(m.ch,m.ch==='Почта'?'i':m.ch==='WhatsApp'?'g':m.ch==='Сайт'?'w':'')}</td><td><b>${esc(m.from)}</b></td><td class="mono">${m.t}</td><td>${esc(m.sub)}</td><td>${m.pj?`<a class="clk" onclick="openProj('${m.pj}')">${m.pj}</a>`:`<button class="bt sm" onclick="act('Создан новый проект из обращения — канал, контакт и переписка перенесены.')">+ проект</button>`}</td><td>${m.st==='draft'?`<button class="bt sm p" onclick="inbOpen(${m.id})">Проверить</button>`:tag('отвечено','g')}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan" id="inbd">${inbView(1)}</div>
 <div class="pan"><h3>Правила ИИ-агента</h3><div class="kv"><span>Первый ответ на заявку с сайта и WhatsApp</span><b>черновик</b></div><div class="kv"><span>Запросить опросный лист и почту</span><b>черновик</b></div><div class="kv"><span>Перевести ответ на английский для производителя</span><b>по кнопке</b></div><div class="kv"><span>Отправить без проверки человеком</span><b class="neg">выкл.</b></div><p class="hint">Модель подключаем по API (Claude или другая) — платите за токены по факту, это в разы дешевле часов сотрудника.</p></div></div>
 ${said('Чтобы рутинные задачи — ответ по WhatsApp, первый фидбэк по заявке — делал ИИ: попросил данные, попросил написать на почту')}`;
function inbView(id){const m=INB.find(x=>x.id===id);return `<h3>${esc(m.from)} · ${m.ch}</h3><div class="mg">${esc(m.sub)}</div>${m.ai?`<div class="mg mout ai" style="max-width:100%"><small>Черновик ИИ · проверьте перед отправкой</small>${esc(m.ai)}</div><div class="btns l"><button class="bt p" onclick="inbSend(${m.id})">Отправить ${m.ch==='WhatsApp'?'в WhatsApp':'письмом'}</button><button class="bt" onclick="act('Черновик открыт для правки.')">Править</button><button class="bt" onclick="act('Перевод на английский готов — в черновике письма.')">EN</button></div>`:'<p class="hint">Запись разговора и итог — в карточке проекта.</p>'}`}
function inbOpen(id){if(cur!=='inbox')go('inbox');const d=document.getElementById('inbd');if(d)d.innerHTML=inbView(id)}
function inbSend(id){const m=INB.find(x=>x.id===id);m.st='done';render();toast('Отправлено. Переписка сохранена в карточке проекта.')}

/* Проекты */
let pf='all';
SC.projects=()=>{let L=PROJ.slice();if(pf==='late')L=L.filter(p=>p.late);if(pf==='mine')L=L.filter(p=>p.m==='Данияр');if(pf==='active')L=L.filter(p=>p.st!=='done');
 return `<div class="hd"><div><h2>Проекты заводов</h2><p>Продажа начинается задолго до закупки: завод проектируют — вы закладываете оборудование — через год-два его покупают. Каждый проект с номером, заказчиком, проектным институтом, списком оборудования, КП и следующим шагом. Если о проекте давно не вспоминали — он подсвечивается.</p></div><div class="btns"><button class="bt p" onclick="act('Новый проект: название, заказчик, EPC-подрядчик или институт, год закупки, ответственный.')">+ Проект</button></div></div>
 <div class="seg">${[['all','Все'],['active','В работе'],['late','Пора напомнить'],['mine','Мои']].map(f=>`<a class="${pf===f[0]?'on':''}" onclick="pf='${f[0]}';render()">${f[1]}</a>`).join('')}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Проект</th><th>Заказчик</th><th>Стадия</th><th>Сумма</th><th>Закупка</th><th>Последний контакт</th><th>Следующий шаг</th></tr></thead><tbody>${L.map(p=>`<tr class="clk ${p.late?'rowbad':''}" onclick="openProj('${p.id}')"><td><span class="mono">${p.id}</span><br><b>${esc(p.n)}</b></td><td>${esc(p.cl)}</td><td>${stTag(p.st)}</td><td class="mono">${money(p.sum,p.cur)}</td><td class="mono">${p.buy}</td><td class="mono ${p.late?'neg':''}">${p.last}</td><td>${esc(p.next)}<br><small class="mono">${p.nd} · ${p.m}</small></td></tr>`).join('')}</tbody></table></div></div>`};

/* Карточка проекта */
SC.project=()=>{const p=PJ(curProj),i=STG.findIndex(s=>s[0]===p.st);
 return `<div class="hd"><div><h2>${p.id} · ${esc(p.n)}</h2><p>${esc(p.cl)}${p.inst!=='—'?' · '+esc(p.inst):''} · в работе с ${p.since} · закупка ${p.buy} · ответственный ${p.m}</p></div><div class="btns"><button class="bt" onclick="go('projects')">← Проекты</button><button class="bt" onclick="act('Письмо из Gmail — уйдёт с вашей корпоративной почты и сохранится здесь.')">✉ Письмо</button><button class="bt p" onclick="go('quote')">КП по проекту</button></div></div>
 <div class="stp" style="grid-template-columns:repeat(7,1fr)">${STG.map((s,k)=>`<div class="${k===i?'on':k<i?'ok':''}" style="--sc:${s[2]}"><i>${k+1}</i>${s[1]}</div>`).join('')}</div>
 <div class="g2 g21"><div class="pan"><h3>Задачи по проекту</h3>${[['✓','05.03.2026','Получить перечень оборудования от института','Рауан'],['✓','20.03.2026','КП-2026-011 по расходомерам — заложено в проект','Сергей'],['✓','18.09.2026','Встреча с EPC: бюджет на 2027 утверждён','Рауан'],['○','22.10.2026','Ревизия B опросных листов — обновить КП','Сергей'],['○','15.01.2027','Напомнить о себе перед закупкой','Рауан'],['○','03.2027','Ожидаемый тендер на закупку','Данияр']].map(t=>`<div class="bz-task ${t[0]==='✓'?'ok':''}"><i>${t[0]}</i><span class="mono">${t[1]}</span><b>${t[2]}</b><em>${t[3]}</em></div>`).join('')}
  <div class="btns l"><button class="bt sm" onclick="act('Задача с напоминанием: можно поставить на любую дату — через месяц, полгода или год.')">+ Задача и напоминание</button></div>
  <h3 style="margin-top:14px">Оборудование · ${p.pos} позиций</h3><div class="tw"><table class="t"><thead><tr><th>Тег</th><th>Позиция</th><th>Кол-во</th><th>Статус</th></tr></thead><tbody>${[['FT-101…108','Расходомер газа PanaFlow, DN200','8','в КП-2026-028'],['FT-115','Расходомер факельного газа DigitalFlow XGF868i','2','в КП-2026-028'],['AT-201','Анализатор влажности природного газа Aurora','3','ждём ревизию'],['PT-301…330','Датчики давления','30','КП от производителя из Китая']].map(r=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td class="mono">${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Деньги проекта</h3><div class="kv"><span>Сумма</span><b>${money(p.sum,p.cur)}</b></div><div class="kv"><span>В тенге по курсу НБ РК</span><b>${tg(p.sum*RATE[p.cur])}</b></div><div class="kv"><span>Вероятность</span><b>${p.prob}%</b></div><div class="kv"><span>КП по проекту</span><b>${p.kp}</b></div>
  <h3 style="margin-top:12px">Документы</h3>${['Перечень оборудования, ред. A.xlsx','Опросные листы, ред. B.pdf','КП-2026-028.pdf','Письмо EPC о бюджете 2027.eml'].map(d=>`<div class="kv"><span>📎 ${d}</span><b class="mono">${d.endsWith('pdf')?'PDF':d.endsWith('xlsx')?'XLSX':'EML'}</b></div>`).join('')}
  <h3 style="margin-top:12px">Переписка</h3><div class="cm"><small>18.09 · почта · Рауан</small>Бюджет 2027 утверждён, закупка расходомеров — I квартал.</div><div class="cm"><small>19.10 · почта · ГИП</small>Направляем ревизию B опросных листов.</div>
  <div class="pin">Следующий шаг: ${esc(p.next)} · ${p.nd}</div></div></div>
 ${said('Проект должен отображаться: название, номер, и под ним много задач. Мы должны чётко отслеживать: поставили в бюджет — через полгода связаться')}`};

/* Воронка */
SC.funnel=()=>`<div class="hd"><div><h2>Воронка по стадиям</h2><p>Не «больше клиентов», а ничего не потерять: от заявки и проектирования до закладки в бюджет, тендера, контракта и поставки. Средний цикл — год, бывает два-три. Карточку можно двигать дальше.</p></div></div>
 <div class="kb k7">${STG.map(s=>`<div class="kc" style="--sc:${s[2]}"><div class="kh"><b>${s[1]}</b><span>${PROJ.filter(p=>p.st===s[0]).length}</span></div>${PROJ.filter(p=>p.st===s[0]).map(p=>`<div class="kd ${p.late?'alarm':''}" onclick="openProj('${p.id}')"><div class="kt"><b>${p.id}</b><span class="src">${p.prob}%</span></div><div class="kr">${esc(p.n)}</div><div class="km">${esc(p.cl)}</div><div class="km mono">${money(p.sum,p.cur)} · закупка ${p.buy}</div>${s[0]!=='done'?`<div class="kf"><span>${p.m}</span><a class="mvb" onclick="event.stopPropagation();pNext('${p.id}')">дальше →</a></div>`:''}</div>`).join('')||'<div class="kempty">пусто</div>'}</div>`).join('')}</div>`;
function pNext(id){const p=PJ(id),i=STG.findIndex(s=>s[0]===p.st);if(i<STG.length-1){p.st=STG[i+1][0];p.late=false;render();toast(`${p.id} → «${STG[i+1][1]}».${p.st==='contract'?' Договор создаётся из последнего КП.':''}`)}}

/* Тендеры */
SC.tenders=()=>`<div class="hd"><div><h2>Тендеры</h2><p>Тендерный специалист работает удалённо — видит свои закупки, сроки подачи и чего не хватает в пакете документов. Руководитель видит все.</p></div><div class="btns"><button class="bt p" onclick="act('Новый тендер: площадка, номер, срок подачи, проект.')">+ Тендер</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Закупка</th><th>Площадка</th><th>Проект</th><th>Подача до</th><th>Документы</th><th>Ответственный</th><th>Статус</th></tr></thead><tbody>${[['Узел учёта газа, расходомеры 4 шт.','электронные закупки нацкомпании','П-018','05.11 18:00','9 из 10 · нет сертификата происхождения','Айгуль · удалённо','готовим'],['Анализаторы влажности, 2 шт.','площадка недропользователя','П-024','20.11','4 из 8','Айгуль · удалённо','готовим'],['Датчики давления, 120 шт.','портал госзакупок','—','28.10','—','—','решаем: участвовать?'],['Расходомеры на ГРС, 8 шт.','электронные закупки нацкомпании','П-015','—','—','Данияр','выиграли']].map(r=>`<tr class="${r[6]==='выиграли'?'':r[3].startsWith('28')?'rowwarn':''}"><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]!=='—'?`<a class="clk" onclick="openProj('${r[2]}')">${r[2]}</a>`:'—'}</td><td class="mono">${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td>${tag(r[6],r[6]==='выиграли'?'g':r[6]==='готовим'?'w':'')}</td></tr>`).join('')}</tbody></table></div></div>`;
/* Номенклатура */
let CAT=[
 ['PNM-PT900','Переносной ультразвуковой расходомер жидкости TransPort PT900','Panametrics',14800,'USD','03.2026'],
 ['PNM-XGF868','Расходомер факельного газа DigitalFlow XGF868i','Panametrics',27500,'USD','03.2026'],
 ['PNM-PFZ3','Ультразвуковой расходомер газа PanaFlow Z3','Panametrics',21900,'USD','03.2026'],
 ['PNM-AUR','Анализатор влажности природного газа Aurora H2O','Panametrics',38400,'USD','03.2026'],
 ['PNM-MIS2','Анализатор влажности MIS-2','Panametrics',9600,'USD','03.2026'],
 ['CN-DP310','Датчик давления DP-310, 4–20 мА + HART','Производитель из Китая',4600,'CNY','07.2026'],
 ['KV-BPP','Блок подготовки пробы газа','«Квалитет»',1240000,'RUB','по запросу'],
 ['KV-SMP','Пробоотборник газа высокого давления','«Квалитет»',386000,'RUB','по запросу']
];
SC.catalog=()=>`<div class="hd"><div><h2>Номенклатура и прайсы</h2><p>Вся номенклатура трёх производителей и разовых поставщиков: артикул, цена, валюта, дата прайса. Производитель обновил цены (раз в полгода-год) — сотрудник перетаскивает Excel и нажимает «Импорт»: цены обновятся, новые позиции добавятся, изменения покажутся списком.</p></div><div class="btns"><button class="bt" onclick="act('Выгрузка номенклатуры в Excel.')">Excel</button><button class="bt p" onclick="catImport()">⇪ Импорт прайса из Excel</button></div></div>
 <div class="seg"><a class="on">Все · ${CAT.length}</a><a onclick="act('Фильтр по производителю.')">Panametrics</a><a onclick="act('Фильтр по производителю.')">Китай · КИП</a><a onclick="act('Фильтр по производителю.')">«Квалитет»</a></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Артикул</th><th>Наименование</th><th>Производитель</th><th style="text-align:right">Цена</th><th style="text-align:right">В тенге сегодня</th><th>Прайс от</th><th></th></tr></thead><tbody>${CAT.map(r=>`<tr><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td><td class="mono" style="text-align:right">${money(r[3],r[4])}</td><td class="mono" style="text-align:right">${tg(r[3]*RATE[r[4]])}</td><td class="mono">${r[5]}</td><td>${r[0]==='PNM-XGF868'?`<button class="bt sm" onclick="go('config')">Подбор опций</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Последний импорт · Panametrics, прайс 03.2026</h3><div class="kv"><span>Обновлено цен</span><b>1 214</b></div><div class="kv"><span>Новых позиций</span><b>38</b></div><div class="kv"><span>Снято с производства</span><b>12 — помечены</b></div><div class="kv"><span>В открытых КП затронуто</span><b class="neg">3 КП — пересчитать?</b></div></div>
 <div class="pan"><h3>Как попадают цены</h3><div class="kv"><span>Прайс производителя</span><b>импорт Excel</b></div><div class="kv"><span>Предложение без прайса (разовый поставщик)</span><b>PDF → ИИ → позиции</b></div><div class="kv"><span>Ручной ввод</span><b>всегда можно</b></div></div></div>
 ${said('Цены меняются раз в полгода, раз в год. Мы получаем Excel-файлы')}`;
function catImport(){toast('Импорт: 1 214 цен обновлено, 38 новых позиций. 3 открытых КП помечены — «цены изменились».')}

/* Подбор по опциям */
const OPT=[
 ['Исполнение',[['1','Общепромышленное',0],['E','Взрывозащищённое Ex d',3800]]],
 ['Каналы измерения',[['1','Один канал',0],['2','Два канала',4200]]],
 ['Датчики',[['T5','T5 · до DN300',0],['T17','T17 · DN300–DN900',2600],['T21','T21 · высокая температура',5400]]],
 ['Питание',[['A','100–240 В AC',0],['D','24 В DC',300]]],
 ['Выходы',[['H','4–20 мА + HART',0],['M','Modbus RS-485',450],['F','Foundation Fieldbus',1900]]]
];
let OS=[1,0,1,0,0];
SC.config=()=>{const base=27500,add=OPT.reduce((a,o,i)=>a+o[1][OS[i]][2],0),code='XGF868i-'+OPT.map((o,i)=>o[1][OS[i]][0]).join('-');
 return `<div class="hd"><div><h2>Подбор по опциям · DigitalFlow XGF868i</h2><p>Как в системе производителя, только у вас: инженер отмечает опции под опросный лист — меняются код модели, характеристики и цена. Подобранная позиция одним нажатием уходит в КП проекта, в валюте производителя и в тенге по курсу.</p></div></div>
 <div class="g2 g21"><div class="pan">${OPT.map((o,i)=>`<div class="bz-opt"><small>${o[0]}</small><div>${o[1].map((v,j)=>`<a class="${OS[i]===j?'on':''}" onclick="OS[${i}]=${j};render()"><b>${v[0]}</b>${v[1]}${v[2]?`<em>+ $ ${fmt(v[2])}</em>`:''}</a>`).join('')}</div></div>`).join('')}</div>
 <div class="pan"><h3>Модель</h3><div class="bz-code">${code}</div><div class="kv"><span>Базовая цена</span><b>$ ${fmt(base)}</b></div><div class="kv"><span>Опции</span><b>$ ${fmt(add)}</b></div><div class="kv on"><span><strong>Цена производителя</strong></span><b>$ ${fmt(base+add)}</b></div><div class="kv"><span>В тенге по курсу ${RATE.USD}</span><b>${tg((base+add)*RATE.USD)}</b></div><div class="kv"><span>Срок изготовления</span><b>8–10 недель</b></div>
  <div class="btns l"><button class="bt p" onclick="act('Позиция ${code} добавлена в КП-2026-031 · П-021, тег FT-115.')">В КП проекта</button><button class="bt" onclick="act('Спецификация с опциями — PDF для заказчика.')">Спецификация PDF</button></div></div></div>
 ${said('Галочками опции подбираем — меняется буквенная индексация, меняется цена и характеристики')}`};

/* PDF поставщика → позиции */
let AIP=[['Блок подготовки пробы газа БПП-2, исп. для взрывоопасной зоны',1,1240000,'KV-BPP','есть',99],['Пробоотборник ПГО-25 высокого давления',2,386000,'KV-SMP','есть',99],['Обогреваемая импульсная линия 10 м',2,148500,'—','новая',96],['Шкаф обогреваемый для анализатора',1,512000,'—','новая',97],['Комплект ЗИП на 2 года',1,96400,'—','новая',94],['Пусконаладочные работы',1,280000,'—','услуга',92]];
let aiDone=true;
SC.aipdf=()=>`<div class="hd"><div><h2>PDF поставщика → позиции (ИИ)</h2><p>Разовый поставщик прислал предложение в PDF — 50 позиций, переносить руками около 4 часов. Перетаскиваете файл — ИИ вытаскивает наименования, количество, цены и валюту, сопоставляет с номенклатурой. Человек проверяет таблицу и одним нажатием добавляет в КП или в номенклатуру.</p></div><div class="btns"><button class="bt p" onclick="aiRun()">⇪ Загрузить PDF</button></div></div>
 <div class="g2 g21"><div class="pan"><h3>КП_Квалитет_418.pdf · 6 позиций · рубли · распознано за 40 секунд</h3><div class="tw"><table class="t"><thead><tr><th>Позиция из PDF</th><th>Кол-во</th><th style="text-align:right">Цена, ₽</th><th>В номенклатуре</th><th>Точность</th></tr></thead><tbody>${AIP.map(r=>`<tr class="${r[5]<95?'rowwarn':''}"><td><b>${r[0]}</b></td><td class="mono">${r[1]}</td><td class="mono" style="text-align:right">${fmt(r[2])}</td><td>${r[4]==='есть'?tag(r[3],'g'):r[4]==='услуга'?tag('услуга','i'):tag('новая позиция','w')}</td><td class="mono">${r[5]}%</td></tr>`).join('')}</tbody></table></div>
  <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="act('6 позиций добавлены в КП-2026-031 по курсу RUB ${RATE.RUB}.')">Добавить в КП</button><button class="bt" onclick="act('3 новые позиции заведены в номенклатуру «Квалитет».')">Создать новые позиции</button></div></div>
 <div class="pan"><h3>Что экономит</h3><div class="kv"><span>50 позиций вручную</span><b class="neg">≈ 4 часа</b></div><div class="kv"><span>С ИИ + проверка человеком</span><b class="pos">≈ 10 минут</b></div><div class="kv"><span>Строки с точностью ниже 95%</span><b>подсвечены — проверить</b></div>${tip('Уже работает у вас вручную','Сейчас ребята отдают PDF Claude и копируют результат в Excel. В системе то же самое — но сразу в номенклатуру и КП, без копирования. Подключаем по API, платите за токены по факту.')}</div></div>
 ${said('Мы просто скармливаем приложению ценовое предложение: сделай на основании этого. Бывает 50 позиций — это может съесть четыре часа рабочего времени')}`;
function aiRun(){toast('Файл загружен. ИИ распознаёт позиции…');setTimeout(()=>toast('Готово: 6 позиций, 2 найдены в номенклатуре, 1 строка требует проверки.'),1600)}

/* Коммерческое предложение */
let qCur='KZT',qMk=28;
const QL=[['FT-101…108','PanaFlow Z3, DN200','PNM-PFZ3',8,21900,'USD'],['FT-115','DigitalFlow XGF868i-E-1-T17-A-H','PNM-XGF868',2,33900,'USD'],['AT-201','Анализатор влажности Aurora H2O','PNM-AUR',3,38400,'USD'],['—','Блок подготовки пробы газа','KV-BPP',3,1240000,'RUB']];
SC.quote=()=>{const rows=QL.map(r=>{const kzt=r[4]*RATE[r[5]]*(1+qMk/100);return [...r,kzt]});const tot=rows.reduce((a,r)=>a+r[6]*r[3],0);
 return `<div class="hd"><div><h2>КП-2026-031 · П-021 · ГПЗ 2,5 млрд м³</h2><p>КП собирается из номенклатуры, подбора по опциям и распознанного PDF. Цены поставщиков — в их валютах, пересчёт по курсу Нацбанка на сегодня, наценка — общая или по строке. Валюта КП — любая. Готовое КП — PDF или Word по вашему шаблону, отправка письмом из системы.</p></div><div class="btns"><div class="seg">${['KZT','USD','EUR','RUB'].map(c=>`<a class="${qCur===c?'on':''}" onclick="qCur='${c}';render()">${c}</a>`).join('')}</div></div></div>
 <div class="g2 g21"><div class="pan"><div class="tw"><table class="t"><thead><tr><th>Тег</th><th>Позиция</th><th>Кол-во</th><th style="text-align:right">Цена поставщика</th><th style="text-align:right">Цена, ${qCur}</th><th style="text-align:right">Сумма, ${qCur}</th></tr></thead><tbody>${rows.map(r=>`<tr><td class="mono">${r[0]}</td><td><b>${r[1]}</b><br><small class="mono">${r[2]}</small></td><td class="mono">${r[3]}</td><td class="mono" style="text-align:right">${money(r[4],r[5])}</td><td class="mono" style="text-align:right">${fmt(r[6]/RATE[qCur])}</td><td class="mono" style="text-align:right">${fmt(r[6]*r[3]/RATE[qCur])}</td></tr>`).join('')}<tr><td colspan="5"><b>Итого, ${qCur} · без НДС</b></td><td class="mono" style="text-align:right"><b>${money(Math.round(tot/RATE[qCur]),qCur)}</b></td></tr></tbody></table></div>
  <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="act('КП-2026-031 — PDF по вашему шаблону, отправлено письмом с вашей почты; копия в проекте.')">PDF и отправить</button><button class="bt" onclick="act('КП в Word — можно поправить перед отправкой.')">Word</button><button class="bt" onclick="act('Договор создан из КП: позиции, суммы и валюта перенесены.')">Создать договор</button></div></div>
 <div class="pan"><h3>Курсы НБ РК · ${TODAY}</h3>${['USD','EUR','RUB','CNY'].map(c=>`<div class="kv"><span>${c}</span><b class="mono">${RATE[c]}</b></div>`).join('')}<p class="hint">Курсы подтягиваются с сайта Нацбанка каждое утро сами.</p>
  <h3 style="margin-top:12px">Наценка</h3><div class="seg">${[20,28,35].map(m=>`<a class="${qMk===m?'on':''}" onclick="qMk=${m};render()">${m}%</a>`).join('')}</div><div class="kv"><span>Себестоимость</span><b>${tg(tot/(1+qMk/100))}</b></div><div class="kv"><span>Маржа</span><b class="pos">${tg(tot-tot/(1+qMk/100))}</b></div><div class="kv"><span>Версии КП</span><b>028 → 031</b></div></div></div>
 ${said('Курс всегда актуальный — брали с Нацбанка, цены и договоры пересчитывали в разных валютах. Это было очень удобно')}`};
/* Договоры */
let CT=[
 {id:'Д-2026-014',pj:'П-015',cl:'ТОО «ГазТранзит»',sum:238000,cur:'USD',pre:30,paid:71400,pd:'01.10.2026',days:70,due:'10.12.2026',left:52,sign:'ЭЦП · обе стороны',st:'поставка'},
 {id:'Д-2026-011',pj:'П-011',cl:'ТОО «Каспий Ойл Сервис»',sum:54000,cur:'USD',pre:60,paid:32400,pd:'14.08.2026',days:60,due:'13.10.2026',left:-6,sign:'ЭЦП · обе стороны',st:'на таможне'},
 {id:'Д-2026-016',pj:'П-018',cl:'АО «ТрансГазСервис»',sum:186000,cur:'USD',pre:30,paid:0,pd:'—',days:90,due:'после предоплаты',left:null,sign:'проект · после тендера',st:'черновик'},
 {id:'Д-2026-009',pj:'П-007',cl:'ТОО «ХимПром»',sum:38000,cur:'USD',pre:100,paid:38000,pd:'02.06.2026',days:70,due:'11.08.2026',left:0,sign:'ЭЦП · обе стороны',st:'исполнен'}
];
SC.contracts=()=>`<div class="hd"><div><h2>Договоры и ЭЦП</h2><p>Договор создаётся из утверждённого КП по вашему шаблону: позиции, суммы, валюта, условия оплаты и срок поставки. Подписание — ЭЦП через NCALayer прямо в системе, у вас и у клиента по ссылке. Как только приходит предоплата, срок поставки начинает отсчитываться сам: 70 дней от даты оплаты — и все видят, сколько осталось.</p></div><div class="btns"><button class="bt p" onclick="act('Новый договор из КП: выберите КП — всё подставится.')">+ Договор из КП</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Договор</th><th>Клиент</th><th style="text-align:right">Сумма</th><th>Предоплата</th><th>Срок поставки</th><th>Осталось</th><th>Подписание</th></tr></thead><tbody>${CT.map(c=>`<tr class="${c.left!==null&&c.left<0?'rowbad':c.left!==null&&c.left<60&&c.left>0?'rowwarn':''}"><td><b>${c.id}</b><br><a class="clk mono" onclick="openProj('${c.pj}')">${c.pj}</a></td><td>${c.cl}</td><td class="mono" style="text-align:right">${money(c.sum,c.cur)}<br><small>${tg(c.sum*RATE[c.cur])}</small></td><td>${c.pre}% · ${c.paid?money(c.paid,c.cur)+' · '+c.pd:'не получена'}</td><td class="mono">${c.days} дн. → ${c.due}</td><td>${c.left===null?tag('ждём оплату',''):c.left<0?tag('просрочка '+(-c.left)+' дн.','r'):c.left===0?tag('исполнен','g'):`<div class="bz-cd"><b>${c.left}</b> дн.<i style="width:${100-c.left/c.days*100}%"></i></div>`}</td><td>${c.sign.startsWith('ЭЦП')?tag(c.sign,'g'):tag(c.sign,'w')}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Д-2026-014 · график поставки</h3>${[['01.10','Предоплата 30% · $ 71 400 — пришла (1С)','ok'],['03.10','Заказ производителю PO-0412','ok'],['20.10','Производитель подтверждает дату отгрузки',''],['15.11','Отгрузка с завода',''],['01.12','Таможенное оформление',''],['10.12','Поставка клиенту · срок по договору','']].map(e=>`<div class="bz-task ${e[2]}"><i>${e[2]?'✓':'○'}</i><span class="mono">${e[0]}</span><b>${e[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Подписание</h3><div class="kv"><span>ЭЦП через NCALayer — в системе</span><b>входит</b></div><div class="kv"><span>Клиент подписывает по ссылке</span><b>входит</b></div><div class="kv"><span>Интеграция с внешним ЭДО (если клиент требует)</span><b>по API сервиса</b></div><div class="kv"><span>Валюта договора и пересчёт по курсу на дату оплаты</span><b>входит</b></div></div></div>
 ${said('Деньги поступили — и срок поставки уже начинает тикать с этой даты. Мы чётко видим: оплатили 1 ноября, через 60 дней поставить')}`;

/* Поставки */
const SUPS=['Заказ производителю','Производство','Отгружено','Таможня','Склад','Доставлено'];
let SUP=[['PO-0412','Panametrics','Д-2026-014 · ГазТранзит','8 × PanaFlow Z3',1,'отгрузка 15.11','—'],['PO-0398','Panametrics','Д-2026-011 · Каспий Ойл','3 × TransPort PT900',3,'на таможне с 12.10','TRK 7781 0042 19'],['PO-0405','Производитель из Китая','склад · под проекты','40 × DP-310',2,'в пути, прибытие 28.10','TRK CN-55120'],['PO-0389','«Квалитет»','Д-2026-009 · ХимПром','2 × пробоотборник',5,'доставлено 12.08','—']];
SC.supply=()=>`<div class="hd"><div><h2>Поставки и логистика</h2><p>Заказы производителям, производство, отгрузка, таможня, склад, доставка клиенту — каждый заказ привязан к договору. Логист отмечает шаги и трек-номера, срок по договору всегда рядом. Вместо карточек в Trello.</p></div><div class="btns"><button class="bt p" onclick="act('Заказ производителю из договора: позиции и количество подставятся.')">+ Заказ производителю</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Заказ</th><th>Производитель</th><th>Договор</th><th>Что</th><th>Этап</th><th>Статус</th><th>Трек</th></tr></thead><tbody>${SUP.map((r,i)=>`<tr class="${r[4]===3?'rowwarn':''}"><td class="mono"><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td style="min-width:200px"><div class="bz-sp">${SUPS.map((s,j)=>`<i class="${j<=r[4]?'on':''}" title="${s}"></i>`).join('')}</div><small>${SUPS[r[4]]}</small></td><td>${r[5]}</td><td class="mono">${r[6]}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>На таможне · PO-0398</h3><div class="kv"><span>Инвойс</span><b class="pos">✓</b></div><div class="kv"><span>Упаковочный лист</span><b class="pos">✓</b></div><div class="kv"><span>Сертификат происхождения</span><b class="pos">✓</b></div><div class="kv"><span>Сертификат соответствия / утверждение типа СИ</span><b class="neg">передать брокеру</b></div><div class="btns l"><button class="bt sm" onclick="act('Документы отправлены брокеру письмом, копия в заказе.')">Отправить брокеру</button></div></div>
 <div class="pan"><h3>Склад</h3><div class="kv"><span>DP-310 · датчики давления</span><b>12 шт. свободно</b></div><div class="kv"><span>PT900 · демо-комплект</span><b>1 шт. · у инженера</b></div><p class="hint">Склад простой: что пришло, что зарезервировано под договор, что свободно.</p></div></div>`;

/* Оплаты */
SC.pay=()=>`<div class="hd"><div><h2>Оплаты, курсы, 1С</h2><p>Входящие оплаты от клиентов и платежи производителям — по договорам и в валютах. Оплат немного (3–5 в месяц), поэтому сейчас достаточно, чтобы бухгалтер отмечал поступление — и срок поставки сразу пошёл. Обмен с 1С можно подключить позже, когда поток вырастет.</p></div><div class="btns"><button class="bt p" onclick="act('Отметить оплату: договор, сумма, дата — срок поставки пересчитается сам.')">+ Оплата</button></div></div>
 <div class="wid"><div><small>Получено в октябре</small><b>$ 71 400</b><span>${tg(71400*RATE.USD)}</span></div><div><small>Ждём от клиентов</small><b class="a">$ ${fmt(166600+21600)}</b><span>остатки по 2 договорам</span></div><div><small>Должны производителям</small><b>$ 112 800</b><span>Panametrics · до 15.11</span></div><div><small>USD сегодня</small><b>${RATE.USD}</b><span>НБ РК · обновлено в 09:00</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Дата</th><th>Договор</th><th>Направление</th><th style="text-align:right">Сумма</th><th style="text-align:right">По курсу дня</th><th>Источник</th></tr></thead><tbody>${[['01.10.2026','Д-2026-014 · ГазТранзит','от клиента · предоплата 30%',71400,'USD','1С / бухгалтер'],['03.10.2026','PO-0412 · Panametrics','производителю · 50%',112800,'USD','банк'],['14.08.2026','Д-2026-011 · Каспий Ойл','от клиента · предоплата 60%',32400,'USD','1С / бухгалтер'],['02.06.2026','Д-2026-009 · ХимПром','от клиента · 100%',38000,'USD','1С / бухгалтер']].map(r=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="mono" style="text-align:right">${money(r[3],r[4])}</td><td class="mono" style="text-align:right">${tg(r[3]*RATE[r[4]])}</td><td>${r[5]}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Это можно вручную делать — каждое утро бухгалтер отправляет. Три-четыре оплаты, бывает пять — это не так много',"Поэтому интеграция с 1С не входит в стартовый пакет; подключим отдельно, если понадобится.")}`;

/* Команда */
SC.team=()=>`<div class="hd"><div><h2>Команда, звонки, задачи</h2><p>Половина команды работает удалённо — в другом городе и в России. Все в одной системе, каждый со своими правами. IP-телефония с одним номером: звонок принимает любой, где бы он ни был, разговор записывается в проект.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Сотрудник</th><th>Роль</th><th>Где</th><th>Проектов</th><th>Задач на неделю</th><th>Просрочено</th><th>Звонков сегодня</th></tr></thead><tbody>${[['Рауан','Руководитель','Алматы · офис',4,6,1,5],['Данияр','Менеджер по продажам','Алматы · офис',4,9,0,7],['Алия','Логист','Алматы · офис','—',5,0,3],['Сергей','Инженер по подбору','Россия · удалённо',2,7,0,1],['Айгуль','Тендеры','Россия · удалённо','—',4,0,0],['Марат','Сервисный инженер','Атырау · удалённо',1,3,1,2]].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td class="mono">${r[3]}</td><td class="mono">${r[4]}</td><td class="mono ${r[5]?'neg':''}">${r[5]}</td><td class="mono">${r[6]}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Звонки сегодня · один номер</h3>${[['10:05','входящий','АО «ТрансГазСервис»','Данияр','4:18','▶'],['09:40','исходящий','«КазГазСтрой» · снабжение','Рауан','6:02','▶'],['09:12','пропущенный','+7 702 *** 18 40','—','—','перезвонить']].map(r=>`<div class="evt"><span class="mono">${r[0]}</span><b>${r[2]}</b><span>${r[1]} · ${r[3]} · ${r[4]} ${r[5]==='▶'?'<a class="play">▶</a>':tag(r[5],'r')}</span></div>`).join('')}<p class="hint">Телефония: Binotel или Sipuni — подключаем по API. Сотрудники в России — через VPN офиса.</p></div>
 <div class="pan"><h3>Вместо Trello</h3><div class="kv"><span>Канбан задач по проектам</span><b>есть</b></div><div class="kv"><span>Напоминания на месяцы и годы вперёд</span><b>есть</b></div><div class="kv"><span>Связь задачи с проектом, КП, договором</span><b>есть</b></div><div class="kv"><span>Ссылки «Google-таблица → карточка Trello»</span><b>не нужны</b></div></div></div>
 ${said('Чтобы звонки шли через один номер, всё фиксировалось. Человек сидит в России, в другом городе — подключился и может ответить на входящий')}`;

/* Сравнение */
SC.compare=()=>`<div class="hd"><div><h2>Своя система или Odoo, Битрикс24</h2><p>Вы сейчас выбираете между подписочными системами и своей. Подписочные выглядят недорого на старте, но под ваш процесс их всё равно придётся настраивать — за деньги и в рамках их ограничений.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th></th><th>Своя система (ПОТОК)</th><th>Odoo</th><th>Битрикс24</th></tr></thead><tbody>${[['Оплата','один раз — 2,5 млн ₸','подписка за каждого сотрудника, каждый год','подписка, каждый год'],['Настройка под ваш процесс','входит: проекты на годы, КП в валютах, подбор опций, PDF → позиции','внедренец, отдельно за каждую доработку','внедренец, отдельно за каждую доработку'],['Чьё это','код и данные ваши, ваш сервер','аренда; сервер — отдельная лицензия','аренда'],['Новые сотрудники','бесплатно','+ подписка','+ тариф'],['Если сервис недоступен в регионе','система работает на вашем сервере','зависите от поставщика','зависите от поставщика'],['Скорость доработок','правка — за дни, без согласований с вендором','через партнёра','через партнёра']].map(r=>`<tr><td><b>${r[0]}</b></td><td class="pos">${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Из нашего опыта','Многие наши клиенты переходят к нам с Битрикса: бизнес уже настроен, но под каждую мелочь нужна платная доработка, и со временем систему просто перестают развивать. Своя система остаётся вашим активом и развивается вместе с компанией.')}
 ${said('Компания маленькая — сейчас надо внедрить. Когда разрастётся, куче народа сказать «переходите в другую систему» намного сложнее')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Стандартный пакет разработки: всё, что в этом демо, — пишем с нуля под вашу компанию. Веб-система с мобильной версией, без программы на компьютер. Около 20% объёма оставляем в запасе на полировку — то, что вы захотите добавить, когда начнёте работать.</p></div></div>
 <div class="pk1"><div><small>Стандартный пакет</small><b>2 500 000 ₸</b><span>один раз · без подписки за сотрудников</span></div><div><small>Срок</small><b>4–6 недель</b><span>демо → ядро → полировка</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>250 000 ₸</b><span>при подписании</span></div><div><small>Ядро · 45%</small><b>1 125 000 ₸</b><span>после утверждения основного</span></div><div><small>Сдача · 45%</small><b>1 125 000 ₸</b><span>после полировки и запуска</span></div></div>
 <div class="g2"><div class="pan"><h3>В месяц</h3><div class="kv"><span>Система</span><b>0 ₸ — подписки нет</b></div><div class="kv"><span>Сервер</span><b>на старте бесплатно · потом 5–15 $</b></div><div class="kv"><span>ИИ (разбор PDF, черновики)</span><b>токены по факту</b></div><div class="kv"><span>WhatsApp через Green API</span><b>≈ 5 000 ₸ за номер</b></div><div class="kv"><span>IP-телефония</span><b>тариф Binotel / Sipuni</b></div></div>
 <div class="pan"><h3>Отдельно, если понадобится</h3><div class="kv"><span>Обмен с 1С</span><b>оценим отдельно</b></div><div class="kv"><span>Интеграция с внешним ЭДО</span><b>по API сервиса</b></div><div class="kv"><span>Связь с сайтом, который вы делаете</span><b>входит — заявки в «Входящие»</b></div><p class="hint">3 месяца после сдачи — бесплатно исправляем ошибки. Код, база и доступы — ваши.</p></div></div>`;

/* Каркас */
const CARD={};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const p=PROJ.find(x=>(x.id+x.n+x.cl).toLowerCase().includes(v));if(p&&v){openProj(p.id);return}const c=CAT.find(x=>(x[0]+x[1]).toLowerCase().includes(v));if(c&&v){go('catalog');return}toast('Ищите по проекту, клиенту, артикулу: «ГПЗ», «ГазТранзит», «XGF868».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">ПОТОК</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='projects'&&PROJ.some(p=>p.late)?'<em>'+PROJ.filter(p=>p.late).length+'</em>':x[0]==='inbox'?'<em>'+INB.filter(m=>m.st==='draft').length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['inbox','Входящие'],['projects','Проекты'],['quote','КП'],['contracts','Договоры']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'ПОТОК';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: проекты, портфель, входящие, сроки поставки, деньги — вместо Trello и таблиц.'],
 ['inbox','2 · Почта, WhatsApp, сайт и звонки в одном окне. ИИ готовит черновик первого ответа.'],
 ['projects','3 · Проекты заводов: цикл в год-два, ни один не забыт.'],
 ['project','4 · Карточка проекта: задачи с напоминаниями на годы, оборудование, КП, переписка.'],
 ['catalog','5 · Номенклатура и прайсы — импорт из Excel.'],
 ['config','6 · Подбор по опциям: код модели и цена меняются сами.'],
 ['aipdf','7 · PDF поставщика → позиции за минуты вместо 4 часов.'],
 ['quote','8 · КП в любой валюте по курсу Нацбанка.'],
 ['contracts','9 · Договор из КП, ЭЦП, срок поставки от дня предоплаты.'],
 ['supply','10 · Поставки: от заказа производителю до клиента.'],
 ['compare','11 · Своя система против подписки Odoo и Битрикс.'],
 ['launch','12 · Стоимость: 2,5 млн один раз, 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
