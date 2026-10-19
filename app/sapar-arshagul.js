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

const SC={};
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const srcTag=k=>{const s=SRC.find(x=>x[0]===k)||['',k,'#999'];return `<span class="srct" style="--sc:${s[2]}">${s[1]}</span>`};
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
const debtCl=()=>TOURS.reduce((a,t)=>a+t.sum-t.paid,0),debtTo=()=>TOURS.reduce((a,t)=>a+t.net-t.netPaid,0);

SC.dash=()=>`<div class="hd"><div><h2>Пульт руководителя · ${TODAY}</h2><p>То, что вы любите в U-ON, и воронка из amoCRM — на одном экране: кто подписал договор, кто нет, у какого менеджера, какой туроператор, кто сколько заплатил, какой остаток и дедлайн, когда вылет.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('leads')"><small>Заявок в воронке</small><b>${LEADS.filter(l=>l.st!=='won').length}</b><span>${LEADS.filter(l=>l.late).length} ждут ответа слишком долго</span></div>
  <div class="clk" onclick="go('orders')"><small>Туров в работе</small><b>${TOURS.length}</b><span>вылетов на неделе: ${TOURS.filter(t=>['19.10','22.10'].includes(t.fly)).length}</span></div>
  <div class="clk" onclick="go('contract')"><small>Договор не подписан</small><b class="w">${TOURS.filter(t=>t.sign!=='yes').length}</b><span>${TOURS.filter(t=>t.sign==='no').length} даже не отправлен</span></div>
  <div class="clk" onclick="go('pay')"><small>Туристы должны</small><b class="a">${tg(debtCl())}</b><span>агентство должно туроператорам ${tg(debtTo())}</span></div>
  <div class="clk" onclick="go('reports')"><small>Прибыль октября</small><b class="g">${tg(2486000)}</b><span>продажи ${tg(17840000)} · 21 тур</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Туры: договоры, оплаты, дедлайны</h3><div class="tw"><table class="t"><thead><tr><th>Турист</th><th>Туроператор</th><th>Вылет</th><th>Договор</th><th>Оплачено</th><th>Остаток</th><th>Дедлайн туроператору</th><th>Менеджер</th></tr></thead><tbody>${TOURS.map(t=>`<tr class="clk ${t.sign==='no'||(t.dl!=='—'&&t.net>t.netPaid)?'rowwarn':''}" onclick="openTour('${t.id}')"><td><b>${esc(t.cl)}</b><br><small>${t.dir}</small></td><td>${t.to}</td><td class="mono">${t.fly}</td><td>${tag(SIGN[t.sign][0],SIGN[t.sign][1])}</td><td class="mono">${tg(t.paid)}</td><td class="mono ${t.sum>t.paid?'neg':''}">${t.sum>t.paid?tg(t.sum-t.paid):'—'}</td><td class="mono">${t.net>t.netPaid?t.dl:'оплачено'}</td><td>${t.m}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="openTour('Т-1411')"><i></i><div><b>Т-1411: дедлайн туроператору 19.10, турист не оплатил</b><span>2 240 000 ₸ · договор не отправлен</span></div></div>
  <div class="rf bad" onclick="go('leads')"><i></i><div><b>2 заявки без ответа больше 20 минут</b><span>РОП получил уведомление</span></div></div>
  <div class="rf" onclick="openTour('Т-1404')"><i></i><div><b>Т-1404: доплатить Anex 248 000 ₸ до 18.10</b><span>турист оплатил полностью</span></div></div>
  <div class="rf" onclick="go('contract')"><i></i><div><b>Т-1409: договор отправлен 2 дня назад, не подписан</b><span>напоминание ушло в WhatsApp</span></div></div></div></div>
 ${said('Здесь я вижу договора: подписан, не подписан, у кого вообще договор не подписан, на каком менеджере, какой туроператор, кто сколько заплатил, какой остаток, дедлайн, если улёта — я это всё вижу')}`;

/* Воронка продаж */
SC.leads=()=>`<div class="hd"><div><h2>Воронка продаж</h2><p>Как в amoCRM, только внутри той же системы, где туры и договоры. Заявки с сайта, Instagram, WhatsApp и звонков попадают сюда сами. У каждой заявки — следующее действие: РОП видит, кто что должен сделать и кто опаздывает.</p></div><div class="btns"><button class="bt p" onclick="act('Новая заявка: имя, телефон, направление, даты, бюджет — за полминуты.')">+ Заявка</button></div></div>
 <div class="kb k6">${LST.map((s,i)=>`<div class="kc"><div class="kh"><b>${s[1]}</b><span>${LEADS.filter(l=>l.st===s[0]).length}</span></div>${LEADS.filter(l=>l.st===s[0]).map(l=>`<div class="kd ${l.late?'alarm':''}" onclick="openLead('${l.id}')"><div class="kt"><b>${esc(l.n)}</b>${srcTag(l.src)}</div><div class="kr">${l.dir} · ${l.when}</div><div class="km">${l.pax} · до ${tg(l.bud)}</div><div class="nx">→ ${esc(l.next)}</div><div class="kf"><span>${l.m}</span>${i<LST.length-1?`<a class="mvb" onclick="event.stopPropagation();leadNext('${l.id}')">дальше →</a>`:''}</div></div>`).join('')||'<div class="kempty">пусто</div>'}</div>`).join('')}</div>
 ${said('amoCRM мне нужен для РОПа, для воронки продаж — чтобы РОП помогал, ориентировал менеджера')}`;
function openLead(id){curLead=id;go('lead')}
function leadNext(id){const l=LD(id),i=LST.findIndex(s=>s[0]===l.st);if(i<LST.length-1){l.st=LST[i+1][0];l.late=false;render();toast(`${esc(l.n)} → «${LST[i+1][1]}».${l.st==='won'?' Создаётся заявка на тур — данные переносятся сами.':''}`)}}

/* Карточка клиента */
SC.lead=()=>{const l=LD(curLead);
 return `<div class="hd"><div><h2>${esc(l.n)} · ${l.id}</h2><p>${l.ph} · ${SRN(l.src)} · ${l.dir} · ${l.when} · ${l.pax} · бюджет до ${tg(l.bud)} · менеджер ${l.m}</p></div><div class="btns"><button class="bt" onclick="go('leads')">← Воронка</button><button class="bt" onclick="act('Звонок через вашу телефонию — запись попадёт сюда.')">☎ Позвонить</button><button class="bt p" onclick="go('pick')">Подборка туров</button></div></div>
 <div class="stp">${LST.map((s,i)=>`<div class="${s[0]===l.st?'on':LST.findIndex(x=>x[0]===l.st)>i?'ok':''}"><i>${i+1}</i>${s[1]}</div>`).join('')}</div>
 <div class="g2 g21"><div class="pan"><h3>История</h3>${[['17.10 10:42','Алия','Звонок 4:12 · запись','Хотят 5★ на первой линии, ребёнка нет, вылет из Алматы.'],['17.10 10:50','Алия','Подборка отправлена в WhatsApp','3 отеля · Турция · 01–08.11 · открыли 2 раза'],['16.10 19:05','Сайт','Заявка с сайта','Турция, ноябрь, 2 взрослых, до 1,2 млн']].map(e=>`<div class="cm"><small>${e[0]} · ${e[1]} · ${e[2]}</small>${esc(e[3])}</div>`).join('')}<div class="pin">Следующее действие: ${esc(l.next)}</div></div>
 <div class="pan"><h3>WhatsApp</h3><div class="msgs"><div class="mg"><small>17.10 10:51 · Алия</small>Добрый день! Отправила 3 варианта на 01–08.11, все на первой линии. Цены держатся до завтра.</div><div class="mg mout"><small>17.10 10:58 · клиент</small>Второй вариант нравится, а можно с завтраком и ужином?</div></div><div class="qin"><input placeholder="Сообщение"><button class="bt p" onclick="act('Сообщение ушло в WhatsApp и сохранено в карточке.')">Отправить</button></div></div></div>`};

/* Подборка туров */
let PICKS=[['Rixos Premium Belek 5★','Анталья, Белек · UAI · 1-я линия','Anex Tour','01–08.11 · 7 ночей',1186000],['Lara Barut 5★','Анталья, Лара · UAI · 1-я линия','Coral Travel','01–08.11 · 7 ночей',1094000],['Titanic Deluxe 5★','Анталья, Лара · UAI · 1-я линия','Fun&Sun','01–08.11 · 7 ночей',1148000]];
SC.pick=()=>`<div class="hd"><div><h2>Подборка туров</h2><p>Менеджер находит туры в Турвизоре или на сайтах туроператоров и одним нажатием через Кви-Кво добавляет их в подборку клиента. Клиенту уходит красивая страница в WhatsApp, а выбранный тур со всеми данными — отелем, номером, временем вылета — сам переходит в заявку и договор. Вручную ничего не переписывать.</p></div><div class="btns"><button class="bt" onclick="act('Тур добавлен из Турвизора: отель, номер, питание, перелёт и цена подставлены сами.')">+ Из Турвизора</button><button class="bt" onclick="act('Тур добавлен через Кви-Кво с сайта туроператора.')">+ Через Кви-Кво</button></div></div>
 <div class="g2 g21"><div class="pan"><h3>Для: ${esc(LD(curLead).n)} · Турция · 01–08.11 · 2 взр.</h3>${PICKS.map((p,i)=>`<div class="pk"><div class="pkph" style="--h:${200+i*40}"></div><div><b>${p[0]}</b><span>${p[1]}</span><span>${p[2]} · ${p[3]}</span></div><div class="pkr"><b>${tg(p[4])}</b><button class="bt sm ${i===1?'p':''}" onclick="pickBook(${i})">${i===1?'✓ Выбрал клиент':'Выбрать'}</button></div></div>`).join('')}<div class="btns l" style="margin-top:10px"><button class="bt p" onclick="act('Подборка ушла клиенту в WhatsApp: страница с фото, ценами и кнопкой «Хочу этот».')">Отправить клиенту в WhatsApp</button></div></div>
 <div class="pan"><h3>Как это видит клиент</h3><div class="phmini"><b>SAPAR · ваши туры</b><span>Турция · 01–08.11 · 2 взрослых</span>${PICKS.map(p=>`<div class="pm"><i></i><div><b>${p[0]}</b><small>${tg(p[4])}</small></div></div>`).join('')}<a>Хочу этот тур</a></div></div></div>
 ${said('В U-ON мне нравится, что с Турвизора всё подтягивается. Мы ищем в Турвизоре и всё отправляем')}`;
function pickBook(i){const p=PICKS[i];toast(`Выбран ${p[0]}: создана заявка на тур, договор заполнится данными отеля, номера и перелёта сам.`);go('orders')}

/* Звонки и сообщения */
SC.comm=()=>`<div class="hd"><div><h2>Звонки, WhatsApp, Instagram</h2><p>Ваша телефония подключается к системе: звонок из карточки, запись разговора там же. WhatsApp и Instagram Direct — в одном окне; переписка сохраняется у клиента.</p></div></div>
 <div class="wid"><div><small>Звонков сегодня</small><b>64</b><span>пропущенных 3 — перезвонить</span></div><div><small>WhatsApp</small><b>48 диалогов</b><span>средний ответ 6 мин</span></div><div><small>Instagram Direct</small><b>17</b><span>2 без ответа</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Канал</th><th>Клиент</th><th>Менеджер</th><th>Итог</th><th>Запись</th></tr></thead><tbody>${[['10:58','WhatsApp','Ержан и Айгерим','Алия','Выбрали 2-й вариант','—'],['10:42','Звонок · 4:12','Ержан и Айгерим','Алия','Обсудили отели','▶'],['10:20','Instagram','Камила Б.','Алия','Спросила про Таиланд в феврале','—'],['10:05','Звонок · 0:00','Тимур А.','Ерасыл','Пропущен — перезвонить','—'],['09:47','Звонок · 6:30','Гульнара О.','Мадина','Подтвердили бронь','▶']].map(r=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]==='▶'?'<a class="play">▶ слушать</a>':'—'}</td></tr>`).join('')}</tbody></table></div></div>`;

/* Контроль РОПа */
SC.rop=()=>`<div class="hd"><div><h2>Контроль РОПа</h2><p>По каждому менеджеру: скорость ответа, сколько заявок дошло до подборки, брони и договора, просроченные действия. Система подсказывает РОПу, где помочь менеджеру.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Менеджер</th><th>Заявок</th><th>Ответ</th><th>Подборок</th><th>Броней</th><th>Договоров</th><th>Конверсия</th><th>Просрочено</th></tr></thead><tbody>${[['Алия',42,'4 мин',31,14,12,'29%',0],['Мадина',38,'9 мин',24,10,8,'21%',2],['Ерасыл',35,'18 мин',19,7,6,'17%',3]].map(r=>`<tr class="${r[7]>2?'rowwarn':''}"><td><b>${r[0]}</b></td><td class="mono">${r[1]}</td><td class="mono">${r[2]}</td><td class="mono">${r[3]}</td><td class="mono">${r[4]}</td><td class="mono">${r[5]}</td><td class="mono"><b>${r[6]}</b></td><td class="mono ${r[7]?'neg':''}">${r[7]}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Подсказки РОПу</h3>${['Ерасыл отвечает в среднем за 18 минут — половина его заявок остывает. Передать новые заявки Алие до обеда?','У Мадины 6 подборок без ответа клиента больше суток — напомнить с новым вариантом.','Египет на ноябрь: 9 заявок, договоров 2 — проверить цены против конкурентов.'].map(x=>`<div class="rf"><i></i><div><b>${x}</b></div></div>`).join('')}</div>`;

/* Заявки на туры */
let TF='';
SC.orders=()=>`<div class="hd"><div><h2>Заявки на туры</h2><p>Список, который вы смотрите в U-ON: турист, направление, отель, туроператор, вылет, договор, оплаты и дедлайн туроператору. Фильтры одним нажатием.</p></div><div class="btns"><button class="bt" onclick="act('Excel со списком туров скачан.')">⇩ Excel</button></div></div>
 <div class="seg">${[['','Все'],['nosign','Договор не подписан'],['debt','Турист должен'],['dl','Дедлайн туроператору'],['fly','Вылет на неделе']].map(x=>`<a class="${TF===x[0]?'on':''}" onclick="TF='${x[0]}';render()">${x[1]}</a>`).join('')}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Тур</th><th>Турист</th><th>Отель</th><th>Туроператор</th><th>Вылет · обратно</th><th>Договор</th><th>Цена</th><th>Оплачено</th><th>Туроператору</th><th>Менеджер</th></tr></thead><tbody>${TOURS.filter(t=>!TF||(TF==='nosign'&&t.sign!=='yes')||(TF==='debt'&&t.sum>t.paid)||(TF==='dl'&&t.net>t.netPaid)||(TF==='fly'&&['19.10','22.10'].includes(t.fly))).map(t=>`<tr class="clk" onclick="openTour('${t.id}')"><td class="mono"><b>${t.id}</b></td><td>${esc(t.cl)}<br><small>${t.pax} чел.</small></td><td>${t.ho}<br><small>${t.dir}</small></td><td>${t.to}</td><td class="mono">${t.fly} · ${t.back}</td><td>${tag(SIGN[t.sign][0],SIGN[t.sign][1])}</td><td class="mono">${tg(t.sum)}</td><td class="mono ${t.sum>t.paid?'neg':'pos'}">${tg(t.paid)}</td><td class="mono">${t.net>t.netPaid?'долг '+tg(t.net-t.netPaid)+' до '+t.dl:'оплачено'}</td><td>${t.m}</td></tr>`).join('')}</tbody></table></div></div>`;
function openTour(id){curTour=id;go('order')}

/* Карточка тура */
SC.order=()=>{const t=TR(curTour);
 return `<div class="hd"><div><h2>${t.id} · ${esc(t.cl)}</h2><p>${t.dir} · ${t.ho} · ${t.to} · вылет ${t.fly}, обратно ${t.back} · менеджер ${t.m}</p></div><div class="btns"><button class="bt" onclick="go('orders')">← Туры</button><button class="bt p" onclick="go('contract')">Договор</button></div></div>
 <div class="g2 g21"><div>
  <div class="pan"><h3>Тур</h3>${[['Направление',t.dir],['Отель и питание',t.ho],['Номер','Deluxe Room, вид на сад'],['Перелёт туда',t.fly+' · Алматы → 06:40, прилёт 10:15'],['Перелёт обратно',t.back+' · вылет 11:50, прилёт 19:30'],['Туроператор · номер брони',t.to+' · '+(4810000+parseInt(t.id.slice(2)))],['Трансфер и страховка','групповой трансфер · страховка 50 000 $']].map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}<p class="hint">Все данные пришли из подборки (Турвизор / Кви-Кво) — менеджер не переписывал их руками.</p></div>
  <div class="pan"><h3>Туристы</h3>${Array.from({length:t.pax},(_,i)=>`<div class="kv"><span>${i?'Турист '+(i+1):esc(t.cl.split(' ')[0])+' · заказчик'}</span><b>${i<2||t.sign==='yes'?'паспорт заполнен по ссылке ✓':'ждём данные'}</b></div>`).join('')}</div>
 </div><div>
  <div class="pan"><h3>Деньги</h3><div class="kv"><span>Цена для туриста</span><b>${tg(t.sum)}</b></div><div class="kv"><span>Оплачено туристом</span><b class="pos">${tg(t.paid)}</b></div><div class="kv"><span>Остаток туриста</span><b class="${t.sum>t.paid?'neg':''}">${tg(t.sum-t.paid)}</b></div><div class="kv"><span>Стоимость у туроператора</span><b>${tg(t.net)}</b></div><div class="kv"><span>Оплачено туроператору</span><b>${tg(t.netPaid)}</b></div><div class="kv on"><span><strong>Доход агентства</strong></span><b>${tg(t.sum-t.net)}</b></div>${t.net>t.netPaid?`<div class="pin">Оплатить ${t.to} ${tg(t.net-t.netPaid)} до ${t.dl}</div>`:''}</div>
  <div class="pan"><h3>Документы</h3>${[['PDF','Договор · '+SIGN[t.sign][0]],['PDF','Ваучер'],['PDF','Авиабилеты'],['PDF','Страховка'],['PDF','Памятка туристу']].map(d=>`<div class="cdoc"><i>${d[0]}</i><span>${d[1]}</span></div>`).join('')}</div>
 </div></div>`};

/* Договор и подпись */
let SGN=0;
SC.contract=()=>{const t=TR(curTour);
 return `<div class="hd"><div><h2>Договор и подпись · ${t.id}</h2><p>Договор собирается сам по вашему шаблону из U-ON: туристы, отель, категория номера, время вылета и прилёта, цена. Клиенту уходит ссылка в WhatsApp или SMS — он заполняет паспортные данные и подписывает кодом. Без ЭЦП и без оплаты за каждую подпись, как в TrustMe. Если туроператор не подтвердил заявку — договор перевыпускается бесплатно.</p></div></div>
 <div class="mvs">${['Договор собран','Ссылка клиенту','Клиент заполнил данные','Подписал кодом','Договор у обеих сторон'].map((s,i)=>`<div class="mv ${i<SGN?'ok':i===SGN?'on':''}"><i>${i<SGN?'✓':i+1}</i><b>${s}</b><span>${['по шаблону, данные тура подставлены','WhatsApp или SMS','паспорт, ИИН, телефон','код из SMS / WhatsApp','PDF у туриста и в карточке'][i]}</span></div>`).join('')}</div>
 <div class="g2 g21"><div class="pan doc2"><b class="dh">ДОГОВОР № ${t.id.replace('Т-','ТД-')} о реализации туристского продукта</b><p>г. Алматы · ${TODAY}</p><p>Турагент <b>ТОО «SAPAR Travel»</b> и турист <b>${esc(t.cl)}</b> заключили договор о нижеследующем.</p><p>1. Турагент реализует туристский продукт туроператора <b>${t.to}</b>: <b>${t.dir}</b>, отель <b>${t.ho}</b>, номер Deluxe Room, ${t.pax} чел.</p><p>2. Перелёт: ${t.fly} Алматы → вылет 06:40; обратно ${t.back}, вылет 11:50.</p><p>3. Стоимость — <b>${tg(t.sum)}</b>. Оплачено — ${tg(t.paid)}, остаток — ${tg(t.sum-t.paid)}.</p><p class="hint">Жирным — данные, которые подставились сами.</p></div>
 <div class="pan"><h3>Подпись</h3><div class="kv"><span>Статус</span><b>${tag(SGN>=4?'подписан':SIGN[t.sign][0],SGN>=4?'g':SIGN[t.sign][1])}</b></div><div class="kv"><span>Канал</span><b>WhatsApp · SMS</b></div><div class="kv"><span>Стоимость подписи</span><b>0 ₸ через WhatsApp · по тарифу SMS</b></div><button class="bt p" style="width:100%;margin-top:10px" onclick="SGN=Math.min(4,SGN+1);if(SGN>=4)TR('${t.id}').sign='yes';render();toast(['','Ссылка ушла клиенту в WhatsApp.','Клиент заполнил паспортные данные.','Клиент подписал кодом 4821.','Договор подписан — PDF у клиента и в карточке.'][SGN])">${SGN>=4?'✓ Подписан':'Следующий шаг →'}</button><button class="bt" style="width:100%;margin-top:6px" onclick="go('form')">Как видит клиент →</button></div></div>
 ${said('Подписание договоров нас устраивает, но через TrustMe за каждую подпись нужно платить, плюс цену подняли. Заявку могут не подтвердить — надо заново расторгнуть, и это дорого','Своё подписание по коду: перевыпуск договора ничего не стоит.')}`};

/* Анкета туриста по ссылке */
SC.form=()=>`<div class="hd"><div><h2>Анкета туриста по ссылке</h2><p>Клиент открывает ссылку с телефона, заполняет данные туристов — они сразу попадают в договор и в карточку тура — и подписывает кодом. Менеджер ничего не перепечатывает.</p></div></div>
 <div class="phones3"><div class="mphone"><div class="mp-h">${LOGO_I}<b>SAPAR · ваш тур</b></div><div class="mp-b"><div class="m-c"><b>Турция · Lara Barut 5★</b><small>05–12.11 · 3 туриста · 1 100 000 ₸</small></div>${['Фамилия и имя (как в паспорте)','Номер загранпаспорта','Срок действия','ИИН','Телефон'].map(x=>`<label class="mf">${x}<input placeholder="${x}"></label>`).join('')}<div class="m-btn">Далее: туристы 2 и 3 →</div></div></div>
 <div class="mphone"><div class="mp-h">${LOGO_I}<b>Подпись договора</b></div><div class="mp-b"><div class="m-c"><b>Договор № ТД-1409</b><small>Прочитайте договор и подтвердите кодом</small></div><div class="m-c doc3">Турагент ТОО «SAPAR Travel» и турист Гульнара О. … отель Lara Barut 5★ UAI … вылет 05.11 … стоимость 1 100 000 ₸ …</div><label class="mf">Код из WhatsApp<input value="4821"></label><div class="m-btn" onclick="toast('Договор подписан — PDF отправлен клиенту в WhatsApp.')">Подписать</div></div></div></div>
 ${said('Мы не хотим через ЭЦП, люди очень долго подписывают через ЭЦП. Просто SMS-код')}`;

/* Оплаты */
SC.pay=()=>`<div class="hd"><div><h2>Оплаты и долги</h2><p>Две стороны денег по каждому туру: сколько турист заплатил и должен, сколько вы оплатили туроператору и до какой даты. Дедлайны — на первом месте.</p></div><div class="btns"><button class="bt" onclick="act('Excel оплат скачан.')">⇩ Excel</button></div></div>
 <div class="wid"><div><small>Туристы должны</small><b class="w">${tg(debtCl())}</b><span>${TOURS.filter(t=>t.sum>t.paid).length} тура</span></div><div><small>Мы должны туроператорам</small><b class="neg">${tg(debtTo())}</b><span>ближайший дедлайн ${TOURS.filter(t=>t.net>t.netPaid).map(t=>t.dl).sort()[0]}</span></div><div><small>Получено за октябрь</small><b class="g">${tg(15260000)}</b><span>Kaspi 68% · перевод 24% · наличные 8%</span></div></div>
 <div class="pan"><h3>Дедлайны туроператорам</h3><div class="tw"><table class="t"><thead><tr><th>Дедлайн</th><th>Тур</th><th>Туроператор</th><th>Оплатить</th><th>Турист оплатил</th><th></th></tr></thead><tbody>${TOURS.filter(t=>t.net>t.netPaid).sort((a,b)=>a.dl.localeCompare(b.dl)).map(t=>`<tr class="${t.paid<t.net-t.netPaid?'rowwarn':''}"><td class="mono"><b>${t.dl}</b></td><td>${t.id} · ${esc(t.cl)}</td><td>${t.to}</td><td class="mono">${tg(t.net-t.netPaid)}</td><td class="mono">${tg(t.paid)} из ${tg(t.sum)}</td><td><button class="bt sm" onclick="TR('${t.id}').netPaid=TR('${t.id}').net;render();toast('Оплата туроператору отмечена.')">Оплатил</button></td></tr>`).join('')}</tbody></table></div></div>`;

/* Отчёты */
SC.reports=()=>`<div class="hd"><div><h2>Отчёты и прибыль</h2><p>Продажи и доход агентства по направлениям, туроператорам и менеджерам. Любой отчёт — в Excel.</p></div><div class="btns"><button class="bt" onclick="act('Excel скачан.')">⇩ Excel</button></div></div>
 <div class="g2"><div class="pan"><h3>Доход по направлениям · октябрь</h3>${bars([['Турция',1080000,'1,08 млн'],['Египет',612000,'612 тыс.'],['Таиланд',486000,'486 тыс.'],['Вьетнам',308000,'308 тыс.']])}</div>
 <div class="pan"><h3>По туроператорам</h3>${bars([['Anex Tour',7,'7 туров'],['Coral Travel',5,'5'],['Pegas',4,'4'],['Fun&Sun',3,'3'],['Selfie Travel',2,'2']])}</div></div>
 <div class="pan"><h3>Менеджеры · октябрь</h3><div class="tw"><table class="t"><thead><tr><th>Менеджер</th><th>Туров</th><th>Продажи</th><th>Доход агентства</th></tr></thead><tbody>${[['Алия',9,7840000,1094000],['Мадина',7,6120000,856000],['Ерасыл',5,3880000,536000]].map(r=>`<tr><td><b>${r[0]}</b></td><td class="mono">${r[1]}</td><td class="mono">${tg(r[2])}</td><td class="mono">${tg(r[3])}</td></tr>`).join('')}</tbody></table></div></div>`;

/* Что заменяем, что подключаем */
SC.integr=()=>`<div class="hd"><div><h2>Что заменяем, что подключаем</h2><p>Можно ли сделать всё единым? Да, с одной оговоркой: базы цен туроператоров (Турвизор) и подборщики с их сайтов (Кви-Кво) — это отдельные сервисы с данными, их выгоднее подключить, чем писать заново. Всё остальное — в вашей системе.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Сейчас</th><th>Для чего</th><th>Что будет</th><th></th></tr></thead><tbody>${[
 ['amoCRM','Воронка, телефония, помощь РОПу','Воронка, подсказки РОПу, звонки с записью — внутри системы','заменяем','g'],
 ['U-ON.Travel','Туры, договоры, оплаты, документы','Заявки на туры, договор по шаблону, оплаты туристов и туроператорам, дедлайны','заменяем','g'],
 ['TrustMe','Подпись договоров по SMS','Своя подпись по коду из WhatsApp или SMS — без оплаты за каждую подпись','заменяем','g'],
 ['Заявки с сайта → U-ON и amoCRM','Не терять заявки','Заявки с сайта сразу в воронку','заменяем','g'],
 ['WhatsApp, 36 000 ₸','Переписка с туристами','Через Green API — около 5 000 ₸ за номер','дешевле','g'],
 ['Instagram Direct','Заявки из Instagram','Подключаем в то же окно — около 5–10 $','подключаем','i'],
 ['Телефония Altel','Звонки','Подключаем, если у оператора есть API; тариф ваш','подключаем','i'],
 ['Турвизор','Поиск туров и цен туроператоров','Подключаем: выбранный тур переходит в заявку и договор','подключаем','i'],
 ['Кви-Кво','Подборка туров с сайтов туроператоров','Подключаем через их интеграцию; своё расширение — отдельный проект','подключаем','i']
 ].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${tag(r[3],r[4])}</td></tr>`).join('')}</tbody></table></div><p class="hint">Перед стартом проверяем доступ к API Турвизора, Кви-Кво и вашей телефонии — подключаем официальными способами.</p></div>
 ${said('Мне нужен единый CRM для туризма — я не хочу платить за два CRM')}`;

/* Расходы */
SC.costs=()=>`<div class="hd"><div><h2>Расходы в месяц: сейчас и после</h2><p>Система ваша — без абонплаты и без доплат за менеджеров. Остаются только сервисы, которые нужны в любом случае.</p></div></div>
 <div class="g2"><div class="pan cmp bad"><h3>Сейчас · ≈ 256 000 ₸ в месяц на 3 менеджеров</h3><div class="kv"><span>amoCRM</span><b>по счёту</b></div><div class="kv"><span>U-ON.Travel</span><b>≈ 27 000 ₸</b></div><div class="kv"><span>WhatsApp</span><b>36 000 ₸</b></div><div class="kv"><span>Телефония Altel</span><b>11 400 ₸</b></div><div class="kv"><span>Прочие сервисы</span><b>≈ 18 000 ₸</b></div><div class="kv"><span>TrustMe — за каждую подпись</span><b>по факту</b></div><div class="kv on"><span><strong>Всего, по вашим словам</strong></span><b>≈ 256 000 ₸</b></div></div>
 <div class="pan cmp good"><h3>После</h3><div class="kv"><span>Своя система — без абонплаты</span><b>0 ₸</b></div><div class="kv"><span>Сервер</span><b>бесплатно до 10 ГБ · потом 5–10 $</b></div><div class="kv"><span>WhatsApp через Green API</span><b>≈ 5 000 ₸ за номер</b></div><div class="kv"><span>Instagram Direct</span><b>≈ 5 000 ₸</b></div><div class="kv"><span>Телефония Altel</span><b>11 400 ₸ — ваш тариф</b></div><div class="kv"><span>Подпись договоров</span><b>0 ₸ через WhatsApp</b></div><div class="kv"><span>Турвизор, Кви-Кво</span><b>по их тарифам, если оставляете</b></div><div class="kv"><span>Менеджеров</span><b>сколько угодно, до 50 без доработок</b></div></div></div>
 ${said('А ежемесячно дополнительная оплата какая будет?','Только сервер — 5–10 $ в месяц, WhatsApp 5 000 ₸ за номер и ваша телефония.')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Пакет под ключ: единая система вместо amoCRM, U-ON и TrustMe, интеграция с 1С, сайт агентства с заявками прямо в воронку, внедрение и обучение персонала. Договор и счета — от ТОО.</p></div></div>
 <div class="pk1"><div><small>Пакет под ключ</small><b>5 000 000 ₸</b><span>один раз · без абонплаты</span></div><div><small>Срок</small><b>6–8 недель</b><span>ядро → полировка и запуск</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>500 000 ₸</b><span>при подписании</span></div><div><small>Ядро · 45%</small><b>2 250 000 ₸</b><span>после утверждения основного</span></div><div><small>Сдача · 45%</small><b>2 250 000 ₸</b><span>после полировки и запуска</span></div></div>
 <div class="g2"><div class="pan"><h3>Что входит</h3><div class="kv"><span>Единая система: воронка, туры, договор и подпись, оплаты, отчёты, Турвизор, Кви-Кво, телефония, WhatsApp, Instagram, перенос из U-ON и amoCRM</span><b>2 900 000 ₸</b></div><div class="kv"><span>Интеграция с 1С — оплаты, контрагенты, документы по турам</span><b>800 000 ₸</b></div><div class="kv"><span>Сайт агентства — туры, поиск через Турвизор, заявки сразу в воронку</span><b>800 000 ₸</b></div><div class="kv"><span>Внедрение и обучение — 10 занятий в Zoom, 2 недели сопровождения</span><b>500 000 ₸</b></div></div>
 <div class="pan"><h3>Отдельно</h3><div class="kv"><span>Доработки после запуска</span><b>20 $ в час · 5 часов ≈ 100 $</b></div><div class="kv"><span>Своё расширение вместо Кви-Кво</span><b>оценим отдельно</b></div><div class="kv"><span>Домен и хостинг сайта</span><b>по тарифам</b></div><p class="hint">3 месяца после сдачи — бесплатно исправляем ошибки. Справочник и записи занятий — входят.</p></div></div>`;

/* Каркас */
const CARD={};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase();const t=TOURS.find(x=>(x.cl+x.id+x.ho).toLowerCase().includes(v));if(t){openTour(t.id);return}const l=LEADS.find(x=>(x.n+x.id).toLowerCase().includes(v));if(l){openLead(l.id);return}toast('Ищите по имени туриста, номеру тура или отелю.')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">SAPAR</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='contract'&&TOURS.some(t=>t.sign!=='yes')?'<em>'+TOURS.filter(t=>t.sign!=='yes').length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['leads','Воронка'],['orders','Туры'],['pay','Оплаты'],['comm','Связь']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'SAPAR';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: договоры, оплаты, остатки, дедлайны и вылеты — как в U-ON, плюс воронка.'],
 ['leads','2 · Воронка продаж вместо amoCRM — с подсказкой следующего действия.'],
 ['pick','3 · Подборка туров из Турвизора и Кви-Кво — клиенту в WhatsApp.'],
 ['orders','4 · Заявки на туры: договор, оплаты, туроператор, дедлайн.'],
 ['contract','5 · Договор собирается сам и подписывается кодом — без оплаты за подпись.'],
 ['form','6 · Клиент заполняет паспорт по ссылке и подписывает.'],
 ['pay','7 · Оплаты туристов и туроператорам.'],
 ['rop','8 · Контроль РОПа.'],
 ['integr','9 · Что заменяем и что подключаем.'],
 ['costs','10 · Расходы: было ≈256 тыс. в месяц — станет в разы меньше.'],
 ['launch','11 · Стоимость: 5 млн под ключ — система, 1С, сайт, обучение; 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
