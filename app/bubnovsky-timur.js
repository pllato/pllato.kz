/* Центр доктора Бубновского · Уральск — учёт пациентов: отметка визита по номеру карты, запись и напоминания, курс лечения и абонемент на 12 занятий, пропавшие пациенты, воронка, план лечения и цена от врача, оплаты, бонусы инструкторов. Все имена, диагнозы и суммы вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const TODAY='17.10.2026',NOW='11:40';
const LOGO_I='<svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="7"/><path d="M50 18c-9 8 9 14 0 22s9 14 0 22-9 14 0 20" fill="none" stroke="var(--brand2,#f26a3d)" stroke-width="8" stroke-linecap="round"/></svg>';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>«${q}»</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const tip=(h,t)=>`<div class="said bz-tip"><b>${h}</b><div class="said-a" style="margin-top:2px">${t}</div></div>`;

const SEC=[
 {k:'top',n:'Главное',sub:[['dash','Пульт руководителя']]},
 {k:'rc',n:'Ресепшн',sub:[['checkin','Отметка визита'],['sched','Расписание и запись'],['remind','Напоминания и подтверждения']]},
 {k:'pt',n:'Пациенты',sub:[['funnel','Воронка: от звонка до курса'],['patients','Все пациенты'],['patient','Карточка пациента'],['plan','План лечения и цена'],['lost','Пропали — позвонить']]},
 {k:'mn',n:'Абонементы и деньги',sub:[['subs','Абонементы'],['pay','Оплаты и долги']]},
 {k:'tm',n:'Команда',sub:[['bonus','Бонусы инструкторов'],['team','Нагрузка и удержание']]},
 {k:'sys',n:'Запуск',sub:[['launch','Стоимость и запуск']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Руководитель':{av:'ТМ',n:'Тимур',note:'Всё: пациенты, запись, абонементы, деньги, бонусы, команда',s:ALL.slice()},
 'Администратор':{av:'АД',n:'Айгерим',note:'Отметка визитов, запись, напоминания, абонементы, оплаты, обзвон',s:['checkin','sched','remind','funnel','patients','patient','lost','subs','pay']},
 'Врач':{av:'ВР',n:'Гульмира',note:'Первичный приём, диагноз, план лечения и цена курса',s:['sched','patients','patient','plan','lost']},
 'Инструктор':{av:'ИН',n:'Ерлан',note:'Свои занятия и пациенты, свои бонусы',s:['sched','patients','patient','bonus']}
};
let role='Руководитель',cur='dash',theme='light';

const INS=[['Ерлан','#2f6fd0'],['Дана','#c2416b'],['Руслан','#1f8a5b'],['Айдар','#b0731a']];
const INC=n=>(INS.find(x=>x[0]===n)||['','#888'])[1];
const DOC='Гульмира Сарсенова';
const PRICE={first:8000,sub:72000,kid:60000};
const PH={first:['Первичный приём','#6b5bd3'],active:['Активный курс','#2f6fd0'],support:['Поддерживающая фаза','#1f8a5b'],pause:['Пауза','#b0731a']};
/* gap — дней без занятий на сегодня */
let PAT=[
 {id:'0147',n:'Сериков Аскар',age:46,ph:'+7 701 *** 45 12',dx:'Грыжа L4–L5, боли в пояснице',phase:'active',mo:[2,3],used:7,subs:2,gap:1,last:'16.10',next:'19.10 18:00',ins:'Ерлан',debt:0,src:'Instagram'},
 {id:'0152',n:'Мухамбетова Динара',age:38,ph:'+7 777 *** 08 33',dx:'Протрузии шейного отдела',phase:'active',mo:[1,3],used:3,subs:1,gap:2,last:'15.10',next:'17.10 10:00',ins:'Дана',debt:0,src:'Рекомендация'},
 {id:'0098',n:'Ахметов Даулет',age:9,ph:'+7 705 *** 77 01 (мама Асель)',dx:'Сколиоз 2 степени',phase:'active',mo:[4,6],used:10,subs:4,gap:1,last:'16.10',next:'17.10 16:00',ins:'Руслан',debt:0,src:'Врач-ортопед',kid:true},
 {id:'0061',n:'Ким Ольга',age:57,ph:'+7 702 *** 64 18',dx:'Артроз коленных суставов',phase:'support',mo:[19,0],used:5,subs:14,gap:14,last:'03.10',next:'—',ins:'Дана',debt:0,src:'2GIS'},
 {id:'0133',n:'Жумабаев Нурлан',age:34,ph:'+7 707 *** 50 44',dx:'Восстановление после травмы плеча',phase:'active',mo:[2,3],used:11,subs:2,gap:1,last:'16.10',next:'18.10 19:00',ins:'Айдар',debt:0,src:'Instagram'},
 {id:'0140',n:'Петрова Марина',age:49,ph:'+7 747 *** 26 61',dx:'Остеохондроз поясничного отдела',phase:'active',mo:[1,3],used:4,subs:1,gap:11,last:'06.10',next:'—',ins:'Ерлан',debt:36000,src:'Сайт'},
 {id:'0121',n:'Сагинтаева Гульжан',age:62,ph:'+7 701 *** 18 77',dx:'После эндопротезирования тазобедренного сустава',phase:'active',mo:[3,4],used:12,subs:3,gap:2,last:'15.10',next:'17.10 12:00',ins:'Руслан',debt:36000,src:'Рекомендация'},
 {id:'0158',n:'Тлеуов Арман',age:29,ph:'+7 776 *** 31 09',dx:'Подозрение на грыжу L5–S1 · ждём МРТ',phase:'first',mo:[0,3],used:0,subs:0,gap:0,last:'—',next:'17.10 12:00',ins:'Ерлан',debt:0,src:'Звонок'},
 {id:'0115',n:'Иванов Сергей',age:44,ph:'+7 708 *** 90 15',dx:'Боли в спине, сидячая работа',phase:'support',mo:[8,0],used:8,subs:7,gap:17,last:'30.09',next:'—',ins:'Айдар',debt:0,src:'Instagram'},
 {id:'0102',n:'Бекова Алия',age:12,ph:'+7 705 *** 32 66 (папа Марат)',dx:'Нарушение осанки, плоскостопие',phase:'active',mo:[2,4],used:6,subs:2,gap:3,last:'14.10',next:'17.10 16:00',ins:'Руслан',debt:0,src:'Школа',kid:true},
 {id:'0089',n:'Нургалиев Бауыржан',age:51,ph:'+7 701 *** 11 90',dx:'Гонартроз 2 степени',phase:'support',mo:[11,0],used:9,subs:10,gap:4,last:'13.10',next:'18.10 09:00',ins:'Айдар',debt:0,src:'Рекомендация'},
 {id:'0137',n:'Оспанова Жанар',age:55,ph:'+7 777 *** 44 08',dx:'Остеопороз, боли в грудном отделе',phase:'pause',mo:[2,3],used:6,subs:2,gap:21,last:'26.09',next:'—',ins:'Дана',debt:36000,src:'2GIS'}
];
const PT=id=>PAT.find(p=>p.id===id);
let curPat='0147';
const LOSTDAYS=10;
const lost=()=>PAT.filter(p=>p.gap>=LOSTDAYS);
/* Воронка обращений */
const FST=[['new','Обращение'],['booked','Записан на первичный'],['came','Пришёл на приём'],['plan','Курс назначен'],['paid','Купил абонемент']];
let LEADS=[
 {id:'О-412',n:'Утепова Сауле',ph:'+7 702 *** 12 40',src:'Звонок',why:'Боли в шее, немеют руки',st:'new',next:'Перезвонить — записать на первичный',late:true},
 {id:'О-413',n:'Касымов Ербол',ph:'+7 701 *** 88 21',src:'Instagram',why:'Грыжа, врач посоветовал ЛФК',st:'new',next:'Ответить в Direct',late:false},
 {id:'О-409',n:'Тлеуов Арман',ph:'+7 776 *** 31 09',src:'Звонок',why:'Боли в пояснице',st:'booked',next:'Приём сегодня 12:00 · подтвердил',late:false,pid:'0158'},
 {id:'О-410',n:'Мама Камилы, 8 лет',ph:'+7 705 *** 60 02',src:'Сайт',why:'Сколиоз у ребёнка',st:'booked',next:'Приём 18.10 11:00 · ждём подтверждения',late:false},
 {id:'О-405',n:'Давлетов Ринат',ph:'+7 747 *** 05 17',src:'2GIS',why:'После операции на колене',st:'came',next:'Не купил абонемент — позвонить через 2 дня',late:true},
 {id:'О-403',n:'Абдрахманова Лаура',ph:'+7 777 *** 21 63',src:'Рекомендация',why:'Остеохондроз',st:'plan',next:'Врач назначил курс 3 мес. — ждём оплату',late:false},
 {id:'О-401',n:'Мухамбетова Динара',ph:'+7 777 *** 08 33',src:'Рекомендация',why:'Протрузии шейного отдела',st:'paid',next:'Абонемент оплачен — курс идёт',late:false,pid:'0152'}
];
const LD=id=>LEADS.find(l=>l.id===id);
/* Расписание на сегодня: время → занятия по инструкторам [записано, мест] */
const HOURS=['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];
const SLOT={
 '08:00':{Ерлан:[4,6],Айдар:[3,6]},'09:00':{Ерлан:[6,6],Дана:[5,6],Айдар:[4,6]},'10:00':{Ерлан:[5,6],Дана:[6,6],Руслан:[3,6]},
 '11:00':{Дана:[4,6],Руслан:[4,6]},'12:00':{Ерлан:[2,6,'перв.'],Руслан:[5,6]},'13:00':{},'14:00':{Дана:[2,6],Айдар:[3,6]},
 '15:00':{Ерлан:[3,6],Руслан:[4,6]},'16:00':{Руслан:[6,6,'дети'],Дана:[4,6]},'17:00':{Ерлан:[6,6],Дана:[5,6],Айдар:[5,6]},
 '18:00':{Ерлан:[6,6],Дана:[6,6],Руслан:[5,6],Айдар:[4,6]},'19:00':{Ерлан:[5,6],Айдар:[6,6]}
};
let AUDIT=[];
const SC={};
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const phTag=k=>{const p=PH[k];return `<span class="srct" style="--sc:${p[1]}">${p[0]}</span>`};
const insTag=n=>`<span class="srct" style="--sc:${INC(n)}">${esc(n)}</span>`;
const left=p=>12-p.used;
const subBar=p=>`<div class="bz-sb">${Array.from({length:12},(_,i)=>`<i class="${i<p.used?'on':''}"></i>`).join('')}</div>`;
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
function openPat(id){curPat=id;go('patient')}

/* Пульт */
SC.dash=()=>{const L=lost(),end=PAT.filter(p=>p.phase!=='first'&&left(p)<=1);
 return `<div class="hd"><div><h2>Пульт руководителя · суббота, ${TODAY}</h2><p>Без лишней аналитики — только то, что нужно каждый день: сколько пришло, кто записан, у кого заканчивается абонемент, кто пропал и сколько денег в кассе.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('sched')"><small>Записано сегодня</small><b>${Object.values(SLOT).reduce((a,h)=>a+Object.values(h).reduce((x,v)=>x+v[0],0),0)}</b><span>пришли к ${NOW}: 31 · первичных 2</span></div>
  <div class="clk" onclick="go('remind')"><small>Подтвердили на завтра</small><b class="g">41 из 48</b><span>5 не ответили, 2 просят перенести</span></div>
  <div class="clk" onclick="go('subs')"><small>Абонемент заканчивается</small><b class="w">${end.length+4}</b><span>осталось 0–1 занятие — предложить продление</span></div>
  <div class="clk" onclick="go('lost')"><small>Не были ${LOSTDAYS}+ дней</small><b class="a">${L.length}</b><span>позвонить и узнать причину</span></div>
  <div class="clk" onclick="go('pay')"><small>Касса сегодня</small><b>${tg(338000)}</b><span>5 абонементов · 2 первичных · 1 разовое</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Пациенты в работе · ${PAT.length*21} человек</h3>${bars([['Активный курс',148],['Поддерживающая фаза',71],['Первичный приём на неделе',14],['Пауза или пропали',19]])}
  <h3 style="margin-top:14px">Новые за октябрь — откуда пришли</h3>${bars([['Instagram',11],['Рекомендация',9],['2GIS',6],['Звонок',5],['Сайт',3],['Врачи-ортопеды',2]])}</div>
 <div class="pan"><h3>Требует внимания сегодня</h3>
  ${L.slice(0,3).map(p=>`<div class="rf bad" onclick="go('lost')"><i></i><div><b>${esc(p.n)} — не был ${p.gap} дней</b><span>${esc(p.dx)} · ${p.ins} · позвонить</span></div></div>`).join('')}
  <div class="rf" onclick="openPat('0121')"><i></i><div><b>Сагинтаева Г.: абонемент закончился, долг 36 000 ₸</b><span>сегодня на занятии в 12:00 — продлить на ресепшене</span></div></div>
  <div class="rf" onclick="openPat('0133')"><i></i><div><b>Жумабаев Н.: осталось 1 занятие</b><span>напоминание о продлении уйдёт в WhatsApp само</span></div></div>
  <div class="rf" onclick="go('funnel')"><i></i><div><b>2 обращения без ответа</b><span>Утепова С. (звонок), Давлетов Р. не купил абонемент</span></div></div></div></div>
 ${said('Сильно аналитики не надо — мы сами ведём и отслеживаем. Нам базовая программа нужна')}`};

/* Отметка визита */
let ciId='0147',ciDone=false;
SC.checkin=()=>{const p=PT(ciId);const warn=[];
 if(left(p)<=1&&p.phase!=='first')warn.push(['w',left(p)<=0?'Абонемент закончился — продлить сейчас':'Осталось 1 занятие — предложить продление']);
 if(p.debt)warn.push(['r','Долг '+tg(p.debt)]);
 if(p.gap>=LOSTDAYS)warn.push(['r',`Не был ${p.gap} дней — спросить, всё ли в порядке`]);
 if(p.phase==='first')warn.push(['i','Первичный приём: к врачу '+DOC]);
 return `<div class="hd"><div><h2>Отметка визита</h2><p>Пациент пришёл — администратор набирает номер карты или последние цифры телефона. Сразу видно, кто это, какой диагноз, сколько занятий прошёл и сколько осталось. Одно нажатие — визит отмечен, счётчик абонемента уменьшился. Вместо ручной таблицы.</p></div></div>
 <div class="g2 g21"><div class="pan"><div class="bz-ci"><input id="ciq" value="${p.id}" placeholder="Номер карты или телефон" onkeydown="if(event.key==='Enter')ciFind(this.value)"><button class="bt p" onclick="ciFind(document.getElementById('ciq').value)">Найти</button></div>
  <div class="bz-qk">Попробуйте: ${['0147','0121','0133','0061','0158','0098'].map(x=>`<a onclick="ciFind('${x}')">${x}</a>`).join('')}</div>
  <div class="bz-pc"><div class="bz-av">${esc(p.n.split(' ').map(x=>x[0]).join('').slice(0,2))}</div><div><b>${esc(p.n)}</b><span>Карта № ${p.id} · ${p.age} ${p.kid?'лет · ребёнок':'лет'} · ${esc(p.ph)}</span><span>${esc(p.dx)}</span><div style="margin-top:6px">${phTag(p.phase)} ${insTag(p.ins)}</div></div></div>
  ${p.phase==='first'?'':`<div class="bz-left"><div><small>Прошёл</small><b>${p.used}</b></div><div><small>Осталось</small><b class="${left(p)<=1?'w':''}">${left(p)}</b></div><div><small>Абонемент</small><b>${p.subs}-й</b></div><div><small>Курс</small><b>${p.mo[1]?p.mo[0]+' из '+p.mo[1]+' мес.':p.mo[0]+' мес.'}</b></div></div>${subBar(p)}`}
  ${warn.map(w=>`<div class="fc ${w[0]==='i'?'g':w[0]}"><span>${w[1]}</span></div>`).join('')}
  <div class="btns l" style="margin-top:10px">${ciDone?`<button class="bt" disabled>✓ Визит отмечен в ${NOW}</button>`:`<button class="bt p" onclick="ciMark()">✓ Отметить визит</button>`}${left(p)<=1&&p.phase!=='first'?`<button class="bt" onclick="act('Продление: новый абонемент на 12 занятий, оплата Kaspi QR или наличными. Бонус инструктору начислится сам.')">Продлить абонемент</button>`:''}<button class="bt" onclick="openPat('${p.id}')">Открыть карточку</button></div></div>
 <div class="pan"><h3>Пришли сегодня · 31</h3>${[['11:32','Мухамбетова Динара','0152','3 → 4 из 12'],['11:05','Сагинтаева Гульжан','0121','12 из 12 · продлить'],['10:58','Ким Ольга','0061','вернулась после 14 дней'],['10:02','Жумабаев Нурлан','0133','10 → 11 из 12'],['09:55','Нургалиев Бауыржан','0089','8 → 9 из 12'],['09:01','Сериков Аскар','0147','6 → 7 из 12']].map(r=>`<div class="evt clk" onclick="ciFind('${r[2]}')"><span class="mono">${r[0]}</span><b>${r[2]}</b><span>${r[1]} <em>· ${r[3]}</em></span></div>`).join('')}</div></div>
 ${said('Пациент пришёл — по номеру карты или мобильного вышла фамилия, и сразу видно, сколько занятий прошёл и сколько осталось')}`};
function ciFind(v){v=String(v||'').replace(/\D/g,'');const p=PAT.find(x=>x.id===v.padStart(4,'0'))||PAT.find(x=>v.length>=2&&x.ph.replace(/\D/g,'').endsWith(v));if(!p){toast('Не нашли. Попробуйте номер карты: 0147, 0121, 0133.');return}ciId=p.id;ciDone=false;render()}
function ciMark(){const p=PT(ciId);if(p.phase!=='first'){p.used=Math.min(12,p.used+1)}p.gap=0;p.last='17.10';ciDone=true;render();toast(p.phase==='first'?'Первичный приём отмечен. Врач заполнит диагноз и план лечения.':`Визит отмечен: ${esc(p.n)} — ${p.used} из 12, осталось ${left(p)}.${left(p)<=1?' Пациенту уйдёт напоминание о продлении.':''}`)}

/* Расписание и запись */
let slH='12:00',slI='Ерлан';
SC.sched=()=>{const mine=role==='Инструктор';const cols=mine?INS.filter(x=>x[0]==='Ерлан'):INS;
 return `<div class="hd"><div><h2>Расписание и запись · ${TODAY}</h2><p>Пациент звонит или пишет в WhatsApp — администратор записывает в свободное время к инструктору. Видно, сколько мест занято в каждом часе. Запись сразу ставит напоминания: за день и за 3 часа до занятия.${mine?' Инструктор видит только свои занятия.':''}</p></div><div class="btns"><div class="seg"><a class="on">День</a><a onclick="act('Неделя: те же часы по дням, заполненность цветом.')">Неделя</a></div><button class="bt p" onclick="act('Новая запись: пациент (поиск по карте или телефону), день, время, инструктор. Напоминания поставятся сами.')">+ Записать</button></div></div>
 <div class="g2 g21"><div class="pan"><div class="tw"><table class="t bz-sg"><thead><tr><th>Время</th>${cols.map(c=>`<th>${insTag(c[0])}</th>`).join('')}</tr></thead><tbody>${HOURS.map(h=>`<tr><td class="mono">${h}</td>${cols.map(c=>{const v=(SLOT[h]||{})[c[0]];if(!v)return '<td class="bz-free" onclick="act(\'Свободно — нажмите, чтобы записать пациента.\')">свободно</td>';const full=v[0]>=v[1];return `<td class="clk ${h===slH&&c[0]===slI?'on':''}" onclick="slPick('${h}','${c[0]}')"><div class="bz-sl ${full?'full':''}" style="--sc:${c[1]}"><b>${v[0]}/${v[1]}</b>${v[2]?`<em>${v[2]}</em>`:''}<i style="width:${v[0]/v[1]*100}%"></i></div></td>`}).join('')}</tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>${slH} · ${slI}</h3>${slList().map(r=>`<div class="evt clk" onclick="openPat('${r[0]}')"><span class="mono">${r[0]}</span><b>${esc(r[1])}</b><span>${r[2]}</span></div>`).join('')}<div class="btns l"><button class="bt sm" onclick="act('Пациент записан на ${slH} к инструктору ${slI}. В WhatsApp ушло: «Вы записаны…»')">+ Записать сюда</button></div>
  <h3 style="margin-top:14px">Сегодня по залу</h3><div class="kv"><span>Занятий</span><b>${Object.values(SLOT).reduce((a,h)=>a+Object.keys(h).length,0)}</b></div><div class="kv"><span>Заполненность</span><b>78%</b></div><div class="kv"><span>Пустые часы</span><b>13:00 — обед</b></div></div></div>
 ${said('Звонят, записываются на приём — чтобы в таблице было видно, в какое время записались')}`};
function slList(){const base=[['0158','Тлеуов Арман','первичный · подтвердил'],['0121','Сагинтаева Гульжан','12 из 12 · продлить'],['0152','Мухамбетова Динара','3 из 12'],['0089','Нургалиев Бауыржан','9 из 12'],['0102','Бекова Алия','6 из 12 · ребёнок'],['0133','Жумабаев Нурлан','11 из 12']];const v=(SLOT[slH]||{})[slI]||[0];return base.slice(0,Math.max(1,v[0]))}
function slPick(h,i){slH=h;slI=i;render()}

/* Напоминания */
let RM=[
 ['0147','Сериков Аскар','18.10 09:00','Ерлан','ok','ok'],['0152','Мухамбетова Динара','18.10 10:00','Дана','ok','wait'],['0133','Жумабаев Нурлан','18.10 19:00','Айдар','ok','wait'],
 ['0089','Нургалиев Бауыржан','18.10 09:00','Айдар','ok','ok'],['0140','Петрова Марина','18.10 18:00','Ерлан','none','—'],['0098','Ахметов Даулет','18.10 16:00','Руслан','move','—'],['0102','Бекова Алия','18.10 16:00','Руслан','ok','wait']
];
const RMS={ok:['подтвердил','g'],none:['не ответил','r'],move:['просит перенести','w'],wait:['уйдёт за 3 часа',''],'—':['—','']};
SC.remind=()=>`<div class="hd"><div><h2>Напоминания и подтверждения</h2><p>Система сама пишет пациенту в WhatsApp: за день — «Вы записаны на завтра в 18:00, подтвердите: 1 — приду, 2 — перенести». В день занятия — за 3 часа. Ответ ставит отметку в расписании. Кто не ответил — попадает администратору на звонок.</p></div></div>
 <div class="wid"><div><small>Завтра записано</small><b>48</b><span>напоминание ушло всем в 18:00</span></div><div><small>Подтвердили</small><b class="g">41</b><span>ответ «1»</span></div><div><small>Просят перенести</small><b class="w">2</b><span>администратор предложит время</span></div><div><small>Не ответили</small><b class="a">5</b><span>позвонить до 20:00</span></div></div>
 <div class="g2 g21"><div class="pan"><h3>Завтра, 18.10</h3><div class="tw"><table class="t"><thead><tr><th>Пациент</th><th>Время</th><th>Инструктор</th><th>За день</th><th>За 3 часа</th><th></th></tr></thead><tbody>${RM.map((r,i)=>`<tr class="${r[4]==='none'?'rowwarn':''}"><td><a class="clk" onclick="openPat('${r[0]}')"><b>${esc(r[1])}</b></a></td><td class="mono">${r[2]}</td><td>${insTag(r[3])}</td><td>${tag(RMS[r[4]][0],RMS[r[4]][1])}</td><td>${tag(RMS[r[5]][0],RMS[r[5]][1])}</td><td>${r[4]==='none'?`<button class="bt sm" onclick="rmCall(${i})">☎ Позвонил</button>`:r[4]==='move'?`<button class="bt sm" onclick="act('Перенос: выберите новое время — пациенту уйдёт новое подтверждение.')">Перенести</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Как это видит пациент</h3><div class="phmini"><b>Центр Бубновского · Уральск</b><div class="mg" style="max-width:100%">Аскар, здравствуйте! Вы записаны на завтра, 18.10, в 09:00 к инструктору Ерлану. Подтвердите, пожалуйста: 1 — приду, 2 — нужно перенести.</div><div class="mg mout" style="max-width:60%">1</div><div class="mg" style="max-width:100%">Спасибо, ждём вас! Возьмите сменную обувь и воду.</div></div>
  <h3 style="margin-top:12px">Шаблоны</h3><div class="kv"><span>За день, 18:00</span><b>вкл.</b></div><div class="kv"><span>За 3 часа</span><b>вкл.</b></div><div class="kv"><span>Осталось 1 занятие по абонементу</span><b>вкл.</b></div><div class="kv"><span>Не был 10 дней</span><b>администратору</b></div><div class="kv"><span>С днём рождения</span><b>вкл.</b></div></div></div>
 ${said('Чтобы была возможность отправить пациенту уведомление за день до приёма, потом в день приёма за несколько часов — чтобы подтвердить')}`;
function rmCall(i){RM[i][4]='ok';render();toast('Отметка: дозвонились, придёт. В расписании — «подтвердил».')}
/* Воронка */
const FSC=['#6b5bd3','#2f6fd0','#0a8aa0','#b0731a','#1f8a5b'];
SC.funnel=()=>`<div class="hd"><div><h2>Воронка: от звонка до курса</h2><p>Каждое обращение — звонок, WhatsApp, Instagram, сайт, 2GIS — попадает сюда. Видно, кто записан на первичный приём, кто пришёл, кому врач назначил курс и кто купил абонемент. Кто пришёл на первичный и не купил — система напомнит позвонить.</p></div><div class="btns"><button class="bt p" onclick="act('Новое обращение: имя, телефон, жалоба, откуда узнал — за полминуты.')">+ Обращение</button></div></div>
 <div class="kb k5">${FST.map((s,i)=>`<div class="kc" style="--sc:${FSC[i]}"><div class="kh"><b>${s[1]}</b><span>${LEADS.filter(l=>l.st===s[0]).length}</span></div>${LEADS.filter(l=>l.st===s[0]).map(l=>`<div class="kd ${l.late?'alarm':''}" onclick="${l.pid?`openPat('${l.pid}')`:`act('Карточка обращения: ${esc(l.n)} · ${esc(l.why)}')`}"><div class="kt"><b>${l.id}</b><span class="src">${l.src}</span></div><div class="kr">${esc(l.n)}</div><div class="km">${esc(l.why)}</div><div class="nx">→ ${esc(l.next)}</div>${i<FST.length-1?`<div class="kf"><a class="mvb" onclick="event.stopPropagation();fNext('${l.id}')">дальше →</a></div>`:''}</div>`).join('')||'<div class="kempty">пусто</div>'}</div>`).join('')}</div>
 <div class="pan"><h3>Октябрь: из обращения в пациенты</h3><div class="bz-fn">${[['Обращений',58],['Записались на первичный',41],['Пришли',36],['Назначен курс',33],['Купили абонемент',27]].map((r,i,a)=>`<div><small>${r[0]}</small><b>${r[1]}</b><span>${i?Math.round(r[1]/a[i-1][1]*100)+'% от предыдущего':''}</span></div>`).join('')}</div></div>`;
function fNext(id){const l=LD(id),i=FST.findIndex(s=>s[0]===l.st);if(i<FST.length-1){l.st=FST[i+1][0];l.late=false;render();toast(`${esc(l.n)} → «${FST[i+1][1]}».${l.st==='booked'?' Пациенту ушло подтверждение записи в WhatsApp.':l.st==='paid'?' Заведена карта пациента, бонус инструктору первичного приёма начислен.':''}`)}}

/* Пациенты */
let pf='all';
SC.patients=()=>{const mine=role==='Инструктор';let L=PAT.filter(p=>!mine||p.ins==='Ерлан');
 if(pf==='kid')L=L.filter(p=>p.kid);if(pf==='end')L=L.filter(p=>p.phase!=='first'&&left(p)<=1);if(pf==='lost')L=L.filter(p=>p.gap>=LOSTDAYS);if(pf==='support')L=L.filter(p=>p.phase==='support');
 return `<div class="hd"><div><h2>Все пациенты</h2><p>Взрослые и дети от 7 лет. У каждого — карта, диагноз, этап курса, абонемент и последний визит. Фильтры для обзвона: у кого заканчивается абонемент, кто пропал, кто на поддерживающей фазе.${mine?' Инструктор видит своих пациентов.':''}</p></div><div class="btns"><button class="bt" onclick="act('Выгрузка в Excel — тем же списком, что на экране.')">Excel</button><button class="bt p" onclick="act('Новый пациент: ФИО, телефон, дата рождения, жалоба. Номер карты присвоится сам.')">+ Пациент</button></div></div>
 <div class="seg">${[['all','Все'],['end','Заканчивается абонемент'],['lost','Не были 10+ дней'],['support','Поддерживающая фаза'],['kid','Дети']].map(f=>`<a class="${pf===f[0]?'on':''}" onclick="pf='${f[0]}';render()">${f[1]}</a>`).join('')}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Карта</th><th>Пациент</th><th>Диагноз</th><th>Этап</th><th>Абонемент</th><th>Был</th><th>Инструктор</th></tr></thead><tbody>${L.map(p=>`<tr class="clk ${p.gap>=LOSTDAYS?'rowbad':left(p)<=1&&p.phase!=='first'?'rowwarn':''}" onclick="openPat('${p.id}')"><td class="mono">${p.id}</td><td><b>${esc(p.n)}</b><br><small>${p.age} ${p.kid?'лет · ребёнок':'лет'}</small></td><td>${esc(p.dx)}</td><td>${phTag(p.phase)}</td><td class="mono">${p.phase==='first'?'—':p.used+' / 12'}</td><td class="mono">${p.last}${p.gap>=LOSTDAYS?`<br><small class="neg">${p.gap} дн.</small>`:''}</td><td>${insTag(p.ins)}</td></tr>`).join('')}</tbody></table></div></div>`};

/* Карточка пациента */
SC.patient=()=>{const p=PT(curPat);
 return `<div class="hd"><div><h2>${esc(p.n)} · карта № ${p.id}</h2><p>${p.age} ${p.kid?'лет · ребёнок':'лет'} · ${esc(p.ph)} · пришёл: ${esc(p.src)} · врач ${DOC} · инструктор ${p.ins}</p></div><div class="btns"><button class="bt" onclick="go('patients')">← Пациенты</button><button class="bt" onclick="act('WhatsApp пациенту — переписка сохранится в карточке.')">WhatsApp</button><button class="bt p" onclick="ciId='${p.id}';ciDone=false;go('checkin')">Отметить визит</button></div></div>
 <div class="stp" style="grid-template-columns:repeat(4,1fr)">${['first','active','support'].map((k,i)=>`<div class="${p.phase===k?'on':(['first','active','support'].indexOf(p.phase)>i?'ok':'')}" style="--sc:${PH[k][1]}"><i>${i+1}</i>${PH[k][0]}</div>`).join('')}<div class="${p.phase==='pause'?'on':''}" style="--sc:${PH.pause[1]}"><i>!</i>Пауза</div></div>
 <div class="g2 g21"><div class="pan"><h3>Диагноз и курс</h3><div class="kv"><span>Диагноз</span><b>${esc(p.dx)}</b></div><div class="kv"><span>Курс</span><b>${p.mo[1]?`месяц ${p.mo[0]} из ${p.mo[1]}`:`поддерживающая фаза · ${p.mo[0]} мес. с нами`}</b></div><div class="kv"><span>Абонемент</span><b>${p.phase==='first'?'ещё нет':`${p.subs}-й · прошёл ${p.used} из 12, осталось ${left(p)}`}</b></div>${p.phase==='first'?'':subBar(p)}<div class="kv"><span>Последний визит</span><b>${p.last}${p.gap>=LOSTDAYS?` · <span class="neg">${p.gap} дней назад</span>`:''}</b></div><div class="kv"><span>Следующая запись</span><b>${p.next}</b></div><div class="kv"><span>Долг</span><b class="${p.debt?'neg':''}">${p.debt?tg(p.debt):'нет'}</b></div>
  <h3 style="margin-top:14px">План лечения от врача</h3>${[['Тренажёры МТБ: тяга, жим, декомпрессия','3 раза в неделю'],['Суставная гимнастика','каждое занятие'],['Дыхательные упражнения, баня/криосауна','по показаниям'],['Контрольный осмотр врача','раз в месяц']].map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}<div class="btns l"><button class="bt sm" onclick="go('plan')">План и цена курса →</button></div></div>
 <div class="pan"><h3>История</h3>${pHist(p).map(e=>`<div class="cm"><small>${e[0]} · ${e[1]}</small>${esc(e[2])}</div>`).join('')}<div class="pin">Бумажная карта остаётся у пациента — в системе тот же номер.</div></div></div>`};

function pHist(p){if(p.phase==='first')return [['17.10 12:00','Первичный приём','Записан к врачу '+DOC+' · подтвердил в WhatsApp'],['15.10 16:20','Звонок','Обращение: '+p.dx+' · откуда: '+p.src]];
 const H=[[p.last,'Визит',`Занятие ${p.used} из 12 · ${p.ins}`]];if(p.gap>=LOSTDAYS)H.unshift([TODAY.slice(0,5),'Система',`Не был ${p.gap} дней — в списке на звонок`]);
 H.push(['01.10','Осмотр врача','Динамика положительная · нагрузку увеличить']);H.push(['—','Оплата',`Абонемент № ${p.subs} · ${tg(p.kid?PRICE.kid:PRICE.sub)} · Kaspi QR`]);if(p.debt)H.push(['15.10','Долг','Не доплачено '+tg(p.debt)]);
 H.push(['—','Первичный приём',`${DOC} · ${p.mo[1]?'курс '+p.mo[1]+' мес.':'курс завершён, поддерживающая фаза'} · инструктор ${p.ins}`]);return H}
/* План лечения и цена */
let PL=[['Курс кинезитерапии · 3 месяца','3 абонемента по 12 занятий',3,PRICE.sub],['Первичный приём и диагностика','проведён',1,0],['Контрольные осмотры врача','раз в месяц',3,0],['Скидка за оплату курса сразу','5%',1,-10800]];
SC.plan=()=>{const sum=PL.reduce((a,r)=>a+r[2]*r[3],0);
 return `<div class="hd"><div><h2>План лечения и цена курса</h2><p>На первичном приёме врач ставит диагноз, выбирает программу и длительность курса — система сама считает стоимость. Врач показывает пациенту план на экране и называет цену. Администратор только принимает оплату.</p></div></div>
 <div class="g2 g21"><div class="pan"><h3>Тлеуов Арман · 29 лет · первичный приём сегодня 12:00</h3><div class="form"><label>Диагноз<input value="Грыжа L5–S1 по МРТ, острый период прошёл"></label><label>Программа<select><option>Позвоночник · поясничный отдел</option><option>Шейный отдел</option><option>Суставы</option><option>Сколиоз · дети</option><option>Реабилитация после операции</option></select></label><label>Длительность<select><option>3 месяца</option><option>2 месяца</option><option>6 месяцев</option></select></label><label>Инструктор<select>${INS.map(x=>`<option>${x[0]}</option>`).join('')}</select></label></div>
  <div class="tw"><table class="t"><thead><tr><th>Что входит</th><th></th><th>Кол-во</th><th style="text-align:right">Сумма</th></tr></thead><tbody>${PL.map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="mono">${r[2]}</td><td class="mono" style="text-align:right">${r[3]?tg(r[2]*r[3]):'входит'}</td></tr>`).join('')}<tr><td colspan="3"><b>Стоимость курса</b></td><td class="mono" style="text-align:right"><b>${tg(sum)}</b></td></tr></tbody></table></div>
  <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="act('План утверждён: пациенту ушёл план и цена в WhatsApp, администратору — «принять оплату».')">Утвердить и отправить пациенту</button><button class="bt" onclick="act('Оплата по абонементу: первый абонемент сейчас, следующие — по мере прохождения.')">Оплата помесячно</button></div></div>
 <div class="pan">${tip('Совет из опыта: цену называет врач','Одна и та же сумма звучит по-разному. Когда цену курса называет врач на приёме — пациент доверяет и соглашается. Когда ту же сумму говорит администратор — «дорого». Так работают стоматологии, с которыми мы делали системы: врач собирает план и цену прямо на приёме.')}
  <h3 style="margin-top:12px">Программы курса</h3>${[['Позвоночник','3 мес. · 3 абонемента'],['Сколиоз, дети','6 мес. · 6 абонементов'],['Суставы','2–3 мес.'],['После операции','3–4 мес.'],['Поддерживающая фаза','абонемент в месяц']].map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}<p class="hint">Программы и цены вы задаёте сами — в демо цифры для примера.</p></div></div>
 ${said('Курс лечения зависит от диагноза: может быть два месяца, три, полгода. При сколиозе — полгода. Есть пациенты, которые несколько лет ходят на поддерживающей фазе')}`};

/* Пропали */
let LR={};
SC.lost=()=>{const L=lost();
 return `<div class="hd"><div><h2>Пропали — позвонить</h2><p>Если пациент не был ${LOSTDAYS} дней и больше — он сам попадает в этот список. Администратор звонит, узнаёт причину и отмечает итог: вернётся, заболел, уехал, недоволен. Так пациенты не теряются молча.</p></div><div class="btns"><div class="seg">${[7,10,14].map(d=>`<a class="${d===LOSTDAYS?'on':''}" onclick="act('Порог настраивается: ${d} дней без занятий.')">${d} дней</a>`).join('')}</div></div></div>
 <div class="wid"><div><small>Сейчас в списке</small><b class="a">${L.length}</b><span>не были ${LOSTDAYS}+ дней</span></div><div><small>Вернули за октябрь</small><b class="g">9 из 14</b><span>после звонка администратора</span></div><div><small>Главная причина</small><b>болезнь</b><span>потом — работа, отъезд</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Пациент</th><th>Диагноз</th><th>Не был</th><th>Абонемент</th><th>Инструктор</th><th>Итог звонка</th></tr></thead><tbody>${L.map(p=>`<tr class="${LR[p.id]?'':'rowbad'}"><td><a class="clk" onclick="openPat('${p.id}')"><b>${esc(p.n)}</b></a><br><small>${esc(p.ph)}</small></td><td>${esc(p.dx)}</td><td class="mono neg">${p.gap} дн. · с ${p.last}</td><td class="mono">${p.used} / 12</td><td>${insTag(p.ins)}</td><td>${LR[p.id]?tag(LR[p.id],'g'):`<select class="bz-sel" onchange="lostRes('${p.id}',this.value)"><option value="">— позвонить —</option><option>Вернётся, записан</option><option>Болеет, перезвонить через неделю</option><option>Уехал</option><option>Недоволен — к руководителю</option><option>Не дозвонились</option></select>`}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Если у одного пациента дней десять или две недели нет занятий — чтобы подсвечивался, мы могли ему позвонить, узнать, в чём причина. Чтобы мы не теряли своих пациентов')}`};
function lostRes(id,v){if(!v)return;LR[id]=v;render();toast(v.startsWith('Недоволен')?'Задача руководителю: перезвонить пациенту сегодня.':v.startsWith('Вернётся')?'Отлично: пациент записан, напоминание поставлено.':'Итог сохранён в карточке. Система напомнит перезвонить.')}
/* Абонементы */
SC.subs=()=>{const A=PAT.filter(p=>p.phase!=='first');
 return `<div class="hd"><div><h2>Абонементы</h2><p>Абонемент на 12 занятий. Каждый визит уменьшает остаток сам. Когда остаётся одно занятие — пациенту уходит напоминание, а администратор видит его в списке на продление. Курс из нескольких абонементов виден целиком.</p></div><div class="btns"><button class="bt" onclick="act('Виды абонементов: 12 занятий взрослый, 12 занятий детский, 8 занятий поддерживающий, разовое занятие — цены задаёте вы.')">Виды и цены</button></div></div>
 <div class="wid"><div><small>Активных абонементов</small><b>219</b><span>взрослых 176 · детских 43</span></div><div><small>Осталось 0–1 занятие</small><b class="w">${A.filter(p=>left(p)<=1).length+4}</b><span>продлить на этой неделе</span></div><div><small>Продлили в октябре</small><b class="g">38</b><span>из 46, у кого закончился</span></div><div><small>Взрослый / детский</small><b>${fmt(PRICE.sub)} / ${fmt(PRICE.kid)} ₸</b><span>12 занятий · для примера</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Пациент</th><th>Абонемент</th><th>Занятия</th><th>Осталось</th><th>Курс</th><th></th></tr></thead><tbody>${A.slice().sort((a,b)=>left(a)-left(b)).map(p=>`<tr class="${left(p)<=1?'rowwarn':''}"><td><a class="clk" onclick="openPat('${p.id}')"><b>${esc(p.n)}</b></a> <small class="mono">${p.id}</small></td><td>${p.subs}-й · ${p.kid?'детский':'взрослый'}</td><td style="min-width:160px">${subBar(p)}</td><td class="mono ${left(p)<=1?'neg':''}">${left(p)}</td><td>${phTag(p.phase)}</td><td>${left(p)<=1?`<button class="bt sm" onclick="subRenew('${p.id}')">Продлить</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Абонемент на двенадцать занятий')}`};
function subRenew(id){const p=PT(id);p.subs++;p.used=0;p.debt=0;render();toast(`${esc(p.n)}: абонемент № ${p.subs} оформлен, ${tg(p.kid?PRICE.kid:PRICE.sub)}. Бонус за продление — инструктору ${p.ins}.`)}

/* Оплаты */
SC.pay=()=>`<div class="hd"><div><h2>Оплаты и долги</h2><p>Каждая оплата привязана к пациенту и абонементу: Kaspi QR, перевод, наличные, карта. Касса дня сходится сама. Если пациент оплатил не всё — долг виден на ресепшене при отметке визита.</p></div><div class="btns"><button class="bt p" onclick="act('Оплата: пациент, за что (абонемент, первичный приём), сумма, способ. Чек — в WhatsApp.')">+ Оплата</button></div></div>
 <div class="wid"><div><small>Касса сегодня</small><b>${tg(338000)}</b><span>Kaspi 256 000 · наличные 82 000</span></div><div><small>За октябрь</small><b>${tg(4218000)}</b><span>абонементов 52 · первичных 36</span></div><div><small>Долги пациентов</small><b class="a">${tg(108000)}</b><span>3 пациента</span></div></div>
 <div class="g2 g21"><div class="pan"><h3>Оплаты сегодня</h3><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Пациент</th><th>За что</th><th>Способ</th><th style="text-align:right">Сумма</th></tr></thead><tbody>${[['11:08','Сагинтаева Гульжан','Абонемент № 4 · частично','Kaspi QR',36000],['10:40','Абдрахманова Лаура','Абонемент № 1','Kaspi QR',72000],['10:12','Ким Ольга','Абонемент № 15','наличные',72000],['09:30','Касымова Дина','Абонемент № 1 · детский','Kaspi перевод',60000],['09:05','Тлеуов Арман','Первичный приём','Kaspi QR',8000],['08:20','Нургалиев Бауыржан','Абонемент № 11','Kaspi QR',72000],['08:05','Ахмед Е.','Первичный приём','Kaspi QR',8000],['08:01','Иса Р.','Разовое занятие','наличные',10000]].map(r=>`<tr><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td><td>${r[3]}</td><td class="mono" style="text-align:right">${fmt(r[4])}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Должны</h3>${[['0121','Сагинтаева Гульжан',36000,'остаток за абонемент № 4'],['0137','Оспанова Жанар',36000,'пауза с 26.09'],['0140','Петрова Марина',36000,'рассрочка, 2-я часть до 20.10']].map(r=>`<div class="fc r clk" onclick="openPat('${r[0]}')"><b>${r[1]}</b><span>${tg(r[2])}</span><em>${r[3]}</em></div>`).join('')}<p class="hint">Финансы без лишнего: сколько пришло, от кого и кто должен.</p></div></div>`;

/* Бонусы инструкторов */
let BR={first:5000,renew:2000};
const BON=[['Ерлан',[['Тлеуов Арман','первичный 17.10','ждём покупку абонемента',0],['Сериков Аскар','продлил абонемент № 2','продление',2000],['Петрова Марина','первичный → абонемент','новый пациент',5000],['Абдрахманова Лаура','первичный → абонемент','новый пациент',5000]]],['Дана',[['Мухамбетова Динара','первичный → абонемент','новый пациент',5000],['Ким Ольга','вернулась, абонемент № 15','продление',2000]]],['Руслан',[['Ахметов Даулет','продлил абонемент № 4','продление',2000],['Бекова Алия','продлил абонемент № 2','продление',2000],['Касымова Дина','первичный → абонемент','новый пациент',5000]]],['Айдар',[['Нургалиев Бауыржан','продлил абонемент № 11','продление',2000],['Жумабаев Нурлан','первичный → абонемент','новый пациент',5000]]]];
SC.bonus=()=>{const mine=role==='Инструктор';const B=BON.filter(b=>!mine||b[0]==='Ерлан');
 return `<div class="hd"><div><h2>Бонусы инструкторов · октябрь</h2><p>Система помнит, какой инструктор провёл первичный приём пациента. Если пациент после приёма купил абонемент — инструктору начисляется бонус. Продлил абонемент — ещё бонус. Считать вручную не нужно.${mine?' Инструктор видит только свои бонусы.':''}</p></div></div>
 ${mine?'':`<div class="pan"><h3>Правила</h3><div class="form" style="grid-template-columns:1fr 1fr 1fr"><label>За нового пациента (первичный → абонемент)<input value="${fmt(BR.first)} ₸"></label><label>За продление абонемента<input value="${fmt(BR.renew)} ₸"></label><label>Или процент от абонемента<select><option>фиксированная сумма</option><option>5% от абонемента</option></select></label></div></div>`}
 <div class="g2">${B.map(b=>{const t=b[1].reduce((a,r)=>a+r[3],0);return `<div class="pan"><h3>${insTag(b[0])} · ${tg(t)}</h3>${b[1].map(r=>`<div class="kv"><span><b>${r[0]}</b> · ${r[1]}</span><b class="${r[3]?'':'neg'}">${r[3]?'+'+fmt(r[3])+' ₸':r[2]}</b></div>`).join('')}</div>`}).join('')}</div>
 ${said('Кто из инструкторов этот приём на себя взял, и если пациент вернулся с абонементом — бонус начисляется инструктору от этого пациента')}`};

/* Нагрузка и удержание */
SC.team=()=>`<div class="hd"><div><h2>Нагрузка и удержание</h2><p>Сколько занятий провёл каждый инструктор, сколько у него пациентов и сколько из них продолжают курс. Удержание — главный показатель для центра: пациент, который бросил на середине, не получил результат.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Инструктор</th><th>Занятий за неделю</th><th>Пациентов</th><th>Первичных в октябре</th><th>Купили абонемент</th><th>Продлили</th><th>Пропали</th></tr></thead><tbody>${[['Ерлан',64,58,9,8,'86%',1],['Дана',52,47,7,6,'81%',2],['Руслан',48,51,6,6,'91%',0],['Айдар',44,39,5,4,'78%',1]].map(r=>`<tr><td>${insTag(r[0])}</td><td class="mono">${r[1]}</td><td class="mono">${r[2]}</td><td class="mono">${r[3]}</td><td class="mono">${r[4]}</td><td class="mono">${r[5]}</td><td class="mono ${r[6]>1?'neg':''}">${r[6]}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Занятий по дням недели</h3>${bars([['Понедельник',58],['Вторник',51],['Среда',61],['Четверг',49],['Пятница',57],['Суббота',38]])}</div><div class="pan"><h3>Задачи команды</h3>${[['Айгерим','Обзвонить 5 пропавших до 18:00','сегодня'],['Гульмира','Контрольный осмотр: Сериков, Ахметов','19.10'],['Ерлан','Отзыв: Петрова — спросить причину паузы','сегодня'],['Тимур','Пациент недоволен — перезвонить','сегодня']].map(r=>`<div class="kv"><span><b>${r[0]}</b> · ${r[1]}</span><b>${r[2]}</b></div>`).join('')}</div></div>`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Стандартный пакет разработки для центра в Уральске: пациенты и карты, отметка визита, запись и напоминания в WhatsApp, курс и абонементы, пропавшие пациенты, воронка, план лечения и цена от врача, оплаты, бонусы инструкторов. Каждый экран утверждаем вместе с вами.</p></div></div>
 <div class="pk1"><div><small>Стандартный пакет</small><b>2 000 000 ₸</b><span>один раз · без абонплаты · система ваша</span></div><div><small>Срок</small><b>4–6 недель</b><span>ядро → полировка</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>200 000 ₸</b><span>при подписании</span></div><div><small>Ядро · 45%</small><b>900 000 ₸</b><span>после утверждения основного</span></div><div><small>Сдача · 45%</small><b>900 000 ₸</b><span>после полировки и передачи</span></div></div>
 <div class="g2"><div class="pan"><h3>Как идём</h3><div class="kv"><span><b>1.</b> Согласуем состав — по этому демо</span><b>сейчас</b></div><div class="kv"><span><b>2.</b> Ядро: пациенты, визиты, запись, абонементы</span><b>2–3 недели</b></div><div class="kv"><span><b>3.</b> Полировка: кнопки, сообщения WhatsApp, отчёты — по вашим замечаниям</span><b>2–3 недели</b></div><div class="kv"><span><b>4.</b> Перенос пациентов из вашей таблицы, обучение</span><b>входит</b></div></div>
 <div class="pan"><h3>В месяц</h3><div class="kv"><span>Система</span><b>0 ₸ — абонплаты нет</b></div><div class="kv"><span>Сервер</span><b>бесплатно или 5–10 $</b></div><div class="kv"><span>WhatsApp-напоминания</span><b>≈ 5 000 ₸ за номер</b></div><div class="kv"><span>Сотрудников</span><b>сколько угодно</b></div><p class="hint">Делаем для центра в Уральске. Если позже понадобится для других филиалов сети — система уже готова к этому.</p></div></div>
 ${said('Только на Уральск надо делать')}`;
/* Каркас */
const CARD={};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const d=v.replace(/\D/g,'');const p=PAT.find(x=>(d.length>=2&&(x.id===d.padStart(4,'0')||x.ph.replace(/\D/g,'').endsWith(d)))||(v.length>1&&x.n.toLowerCase().includes(v)));if(p){openPat(p.id);return}toast('Ищите по номеру карты (0147), телефону или фамилии.')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">ЦЕНТР БУБНОВСКОГО</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='lost'?'<em>'+lost().length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['checkin','Визит'],['sched','Запись'],['patients','Пациенты'],['lost','Пропали']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Центр Бубновского';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: сколько записано и пришло, у кого заканчивается абонемент, кто пропал, касса.'],
 ['checkin','2 · Отметка визита: набрали номер карты — видно, сколько прошёл и сколько осталось.'],
 ['sched','3 · Расписание и запись по часам и инструкторам.'],
 ['remind','4 · Напоминания в WhatsApp за день и за 3 часа — с подтверждением.'],
 ['patient','5 · Карточка пациента: диагноз, курс, абонемент, история.'],
 ['lost','6 · Не был 10 дней — подсвечивается, администратор звонит.'],
 ['plan','7 · План лечения и цена курса — их называет врач.'],
 ['funnel','8 · Воронка: от звонка до абонемента.'],
 ['bonus','9 · Бонусы инструкторам считаются сами.'],
 ['launch','10 · Стоимость: 2 млн один раз, 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
