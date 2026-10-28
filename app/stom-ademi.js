/* АҚ ТІС — единая система сети стоматологий вместо MacDent: 4 филиала (запас до 6), расписание врачей по креслам, утренние подтверждения записи в WhatsApp, чаты и воронка, карта пациента с зубной формулой, планы лечения, прайсы по филиалам, госзаказ ОСМС (дети до 18 лет, беременные) с проверкой кодов, склад материалов, финансы и пульт руководителя. Название, пациенты, врачи и суммы вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const TODAY='28.10.2026',NOW='08:40';
const LOGO_I='<svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true"><path d="M22 30c0-12 10-18 20-14l8 3 8-3c10-4 20 2 20 14 0 14-6 22-8 36-2 12-5 20-10 20-6 0-5-16-10-16s-4 16-10 16c-5 0-8-8-10-20-2-14-8-22-8-36z" fill="currentColor"/><circle cx="70" cy="26" r="9" fill="var(--brand2,#14998a)"/></svg>';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>«${q}»</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const tip=(h,t)=>`<div class="said bz-tip"><b>${h}</b><div class="said-a" style="margin-top:2px">${t}</div></div>`;
const TC={ok:'g',warn:'w',bad:'r',info:'i',violet:'v'};
const tag=(t,c)=>`<span class="tag ${TC[c]||c||''}">${t}</span>`;
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
const SC={},CARD={};
const SEC=[
 {k:'top',n:'Руководителю',sub:[['dash','Пульт сети'],['money','Выручка и врачи']]},
 {k:'pt',n:'Пациенты',sub:[['sched','Расписание'],['remind','Подтверждения в WhatsApp'],['inbox','Чаты и звонки'],['funnel','Воронка'],['patients','Пациенты']]},
 {k:'tr',n:'Лечение',sub:[['plan','Планы лечения'],['price','Прайсы']]},
 {k:'gos',n:'Госзаказ',sub:[['osms','Услуги по ОСМС'],['audit','Проверка кодов']]},
 {k:'wh',n:'Склад',sub:[['stock','Материалы']]},
 {k:'sys',n:'Внедрение',sub:[['migr','Переход с MacDent'],['launch','Стоимость и этапы']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Руководитель':{av:'АД',n:'Адеми',note:'Вся сеть: запись, лечение, деньги, ОСМС, склад',s:ALL.slice()},
 'Администратор':{av:'АМ',n:'Ресепшн · Центральный',note:'Расписание, подтверждения, чаты, воронка, пациенты',s:['sched','remind','inbox','funnel','patients','plan','price']},
 'Врач':{av:'ВР',n:'Стоматолог-терапевт',note:'Своё расписание, карты пациентов, планы лечения',s:['sched','patients','plan','osms']},
 'Специалист по ОСМС':{av:'ОС',n:'Госзаказ',note:'Услуги детям и беременным, коды, проверка до отправки',s:['osms','audit','patients']},
 'Старшая медсестра':{av:'МС',n:'Склад',note:'Материалы, приход, списание на приём',s:['stock']}
};
let role='Руководитель',cur='dash',theme='light',fil='all';
const FIL={all:'Вся сеть',c:'Центральный',n:'Северный',s:'Южный',d:'Детский'};
const K={all:1,c:.32,n:.24,s:.22,d:.22};
function filSw(){return `<div class="dpcity">${Object.entries(FIL).map(([k,v])=>`<button class="${fil===k?'on':''}" onclick="setFil('${k}')">${v}</button>`).join('')}</div>`}
function setFil(k){fil=k;toast(k==='all'?'Все 4 филиала вместе.':`Филиал «${FIL[k]}».`);render()}

/* Пульт */
SC.dash=()=>{const k=K[fil];return `<div class="hd"><div><h2>Пульт сети · ${TODAY}</h2><p>Все филиалы на одном экране: сколько записано на сегодня и сколько подтвердили в WhatsApp, загрузка кресел, выручка, новые обращения, услуги по ОСМС. Цифры собираются сами из расписания, кассы и чатов.</p></div>${filSw()}</div>
 <div class="wid">
  <div class="clk" onclick="go('sched')"><small>Записано на сегодня</small><b class="a">${Math.round(86*k)}</b><span>${Math.round(14*k)} кресел · загрузка 81 %</span></div>
  <div class="clk" onclick="go('remind')"><small>Подтвердили в WhatsApp</small><b class="g">${Math.round(71*k)}</b><span>не ответили ${Math.round(11*k)} · отменили ${Math.round(4*k)}</span></div>
  <div class="clk" onclick="go('money')"><small>Выручка вчера</small><b>${tg(2940000*k)}</b><span>${Math.round(79*k)} приёмов</span></div>
  <div class="clk" onclick="go('funnel')"><small>Новых обращений</small><b>${Math.round(23*k)}</b><span>Instagram, WhatsApp, звонки</span></div>
  <div class="clk" onclick="go('osms')"><small>Приёмов по ОСМС</small><b>${Math.round(19*k)}</b><span>дети и беременные · 2 с ошибкой кода</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Выручка за октябрь по филиалам</h3>${bars([['Центральный',21400000,'21,4 млн'],['Северный',15900000,'15,9 млн'],['Южный',14700000,'14,7 млн'],['Детский',9800000,'9,8 млн']])}</div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="go('audit')"><i></i><div><b>2 услуги по ОСМС с неверным кодом — не отправлены</b><span>Детский · исправить до закрытия месяца</span></div></div>
  <div class="rf" onclick="go('remind')"><i></i><div><b>11 пациентов не ответили на подтверждение</b><span>администратор звонит до 10:00, иначе окно отдаём</span></div></div>
  <div class="rf" onclick="go('stock')"><i></i><div><b>Композит Filtek A2 — осталось на 3 дня</b><span>Северный · заказать</span></div></div>
  <div class="rf" onclick="go('plan')"><i></i><div><b>9 планов лечения не начаты больше 2 недель</b><span>пациентам ушло напоминание</span></div></div>
 </div></div>
 ${said('Комплексный вопрос тогда — не только склад: и склад, и планы лечения, и прайсы','Всё это — в одной системе, на все филиалы.')}`};

/* Выручка и врачи */
SC.money=()=>`<div class="hd"><div><h2>Выручка и врачи</h2><p>Выручка по филиалам и врачам, средний чек, загрузка кресел, доля платных услуг и ОСМС. Зарплата врача считается сама — процент от выполненных работ минус материалы.</p></div>${filSw()}</div>
 <div class="wid"><div><small>Выручка · октябрь</small><b>${tg(61800000*K[fil])}</b><span>платные + ОСМС</span></div><div><small>Платные услуги</small><b>${tg(53400000*K[fil])}</b><span>86 %</span></div><div><small>ОСМС</small><b>${tg(8400000*K[fil])}</b><span>дети и беременные</span></div><div><small>Средний чек</small><b>${tg(37200)}</b><span>+6 % к сентябрю</span></div></div>
 <div class="pan"><h3>Врачи · октябрь</h3><div class="tw"><table class="t"><thead><tr><th>Врач</th><th>Филиал</th><th class="r">Приёмов</th><th class="r">Выручка</th><th class="r">Загрузка</th><th class="r">К выплате</th></tr></thead><tbody>${DOC.filter(d=>fil==='all'||d[2]===fil).map(d=>`<tr><td><b>${d[0]}</b><br><small class="mut">${d[1]}</small></td><td>${FIL[d[2]]}</td><td class="r">${d[3]}</td><td class="r">${tg(d[4])}</td><td class="r">${d[5]} %</td><td class="r"><b>${tg(d[4]*.3)}</b></td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Без отдельной программы','Касса, зарплаты врачей и выручка — в той же системе, что и запись. Не нужно сводить MacDent, Excel и банк.')}`;
const DOC=[['Сейткали А.','терапевт','c',142,5680000,88],['Ким Е.','ортопед','c',61,7320000,79],['Жумабаев Р.','хирург-имплантолог','n',54,8100000,74],['Ахметова Д.','терапевт','n',131,4720000,84],['Ли С.','ортодонт','s',96,5280000,81],['Нургалиева А.','детский стоматолог','d',188,3940000,92]];

/* Расписание */
const HRS=['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'];
let SCH=[
 ['Сейткали А.','Кресло 1',{'09:00':['Мусина Ж.','ok'],'10:00':['Оспанов Т.','ok'],'11:00':['Ермекова Л.','wait'],'14:00':['Ким Н.','ok'],'15:00':['Абенов Д.','no'],'16:00':['Сарсенова А.','ok']}],
 ['Ким Е.','Кресло 2',{'09:00':['Байжанов С.','ok'],'11:00':['Тлеуова М.','ok'],'12:00':['Исаев Р.','wait'],'15:00':['Кенжебек А.','ok'],'17:00':['Жунусова Г.','ok']}],
 ['Нургалиева А.','Детское кресло',{'09:00':['Айша, 7 лет · ОСМС','ok'],'10:00':['Алихан, 9 лет · ОСМС','ok'],'11:00':['Томирис, 12 лет','wait'],'12:00':['Ерасыл, 6 лет · ОСМС','no'],'14:00':['Амина, 15 лет · ОСМС','ok'],'16:00':['Даниял, 8 лет','ok']}],
 ['Ахметова Д.','Кресло 3',{'10:00':['Серикова Б. · беременность · ОСМС','ok'],'11:00':['Рахимов К.','ok'],'14:00':['Ли В.','wait'],'15:00':['Утепова С.','ok'],'16:00':['Жакупов Е.','ok'],'17:00':['Омарова Д.','wait']}]
];
const ST={ok:['подтвердил','ok'],wait:['ждём ответ','warn'],no:['не ответил','bad']};
SC.sched=()=>`<div class="hd"><div><h2>Расписание · Центральный · ${TODAY}</h2><p>Врачи и кресла по часам. Цвет записи — ответ на утреннее подтверждение в WhatsApp. Нажмите на свободное окно — запишете пациента, на запись — откроется карта.</p></div>${filSw()}</div>
 <div class="pan"><div class="tw"><table class="t dsch"><thead><tr><th>Время</th>${SCH.map(d=>`<th>${d[0]}<br><small class="mut">${d[1]}</small></th>`).join('')}</tr></thead><tbody>${HRS.map(h=>`<tr><td class="mono">${h}</td>${SCH.map((d,j)=>{const a=d[2][h];return a?`<td><div class="dslot ${a[1]}" onclick="card('pt','${esc(a[0])}')"><b>${a[0]}</b><span>${ST[a[1]][0]}</span></div></td>`:`<td><div class="dslot free" onclick="book(${j},'${h}')">+ свободно</div></td>`}).join('')}</tr>`).join('')}</tbody></table></div></div>
 <div class="wid"><div><small>Свободных окон</small><b>${SCH.reduce((t,d)=>t+HRS.filter(h=>!d[2][h]).length,0)}</b><span>сегодня в филиале</span></div><div><small>Филиалов</small><b>4</b><span>запас до 6</span></div><div><small>Сотрудников</small><b>без ограничений</b><span>не платите за места</span></div></div>`;
function book(j,h){SCH[j][2][h]=['Новый пациент · из Instagram','wait'];toast(`Записан на ${h} к ${SCH[j][0]}. Пациенту ушло в WhatsApp: «Вы записаны на ${h}, ${SCH[j][1]}. Ждём вас!»`);render()}

/* Подтверждения */
let RM=[['Ермекова Л.','+7 701 *** 12 40','11:00 · Сейткали А.','wait'],['Исаев Р.','+7 747 *** 88 05','12:00 · Ким Е.','wait'],['Абенов Д.','+7 705 *** 31 77','15:00 · Сейткали А.','no'],['Ерасыл, 6 лет (мама)','+7 777 *** 64 19','12:00 · Нургалиева А.','no'],['Мусина Ж.','+7 702 *** 03 58','09:00 · Сейткали А.','ok'],['Серикова Б.','+7 708 *** 47 22','10:00 · Ахметова Д.','ok']];
SC.remind=()=>`<div class="hd"><div><h2>Подтверждения записи в WhatsApp</h2><p>Каждое утро в 08:00 система сама пишет каждому, кто записан на сегодня. Пациент отвечает «1 — приду», «2 — перенести». Ответ сразу красит запись в расписании. Не ответил к 10:00 — администратор звонит, иначе окно отдаём другому.</p></div></div>
 <div class="g2"><div class="pan"><h3>Сообщение пациенту</h3><div class="msgs"><div class="mg">Здравствуйте, Лаура! Напоминаем: сегодня, 28 октября, в 11:00 у вас приём у врача Сейткали А. · Ақ тіс, филиал Центральный.<br>Ответьте: <b>1</b> — приду, <b>2</b> — перенести.<small>08:00</small></div><div class="mg me">1<small>08:14</small></div><div class="mg">Спасибо! Ждём вас в 11:00.<small>08:14</small></div></div></div>
 <div class="pan"><h3>Сегодня · 08:40</h3><div class="kv"><span>Отправлено</span><b>86</b></div><div class="kv"><span>Подтвердили</span><b>71</b></div><div class="kv"><span>Перенесли</span><b>4</b></div><div class="kv"><span>Не ответили</span><b>11</b></div><div class="kv"><span>Канал</span><b>WhatsApp через Green API</b></div></div></div>
 <div class="pan"><h3>Ответы пациентов</h3><div class="tw"><table class="t"><thead><tr><th>Пациент</th><th>Телефон</th><th>Запись</th><th>Ответ</th><th></th></tr></thead><tbody>${RM.map((r,i)=>`<tr class="${r[3]==='no'?'rowwarn':''}"><td><b>${r[0]}</b></td><td class="mono">${r[1]}</td><td>${r[2]}</td><td>${tag(ST[r[3]][0],ST[r[3]][1])}</td><td>${r[3]!=='ok'?`<button class="bt sm" onclick="rmCall(${i})">Позвонил — придёт</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Не спам — значит, не заблокируют','Шлём только сервисные сообщения тем, кто записан: напоминание, подтверждение, «как вы после удаления?». Такие сообщения пациенты ждут и не жмут «спам».')}
 ${said('Рассылка у нас каждый день утром: у вас сегодня запись в 15:00, подтверждаете ли?','Сделаем. WhatsApp через Green API — около 5 000 ₸ в месяц вместо 36 000 ₸ у Wazzup.')}`;
function rmCall(i){RM[i][3]='ok';const n=RM[i][0];SCH.forEach(d=>Object.values(d[2]).forEach(a=>{if(n.indexOf(a[0].split(',')[0])===0)a[1]='ok'}));toast(`${n}: отмечено «придёт», запись в расписании стала зелёной.`);render()}

/* Чаты */
const SRC={ig:['Instagram','#c13584'],wa:['WhatsApp','#1f8a5b'],ph:['Звонок','#6b7280'],gs:['2ГИС','#3a8a2e']};
const srcTag=k=>`<span class="srct" style="--sc:${SRC[k][1]}">${SRC[k][0]}</span>`;
let INB=[['08:31','wa','+7 701 *** 55 12','Здравствуйте, сколько стоит имплант под ключ?','',1],['08:22','ig','@aru.kz','Ребёнку 8 лет, болит зуб — по ОСМС можно сегодня?','',1],['08:10','ph','+7 777 *** 09 31','Звонок 1:48 · запись · перенос на пятницу','Динара',0],['07:55','wa','Ким Н.','Можно на 14:00 вместо 15:00?','Динара',0]];
SC.inbox=()=>`<div class="hd"><div><h2>Чаты и звонки</h2><p>WhatsApp, Instagram и звонки всех филиалов в одной ленте. Видно, кто ответил и как быстро. Переписка остаётся в карточке пациента и в сделке — даже если администратор сменился.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Канал</th><th>Кто</th><th>Сообщение</th><th>Ответил</th><th></th></tr></thead><tbody>${INB.map((r,i)=>`<tr class="${r[5]?'rowwarn':''}"><td class="mono">${r[0]}</td><td>${srcTag(r[1])}</td><td><b>${r[2]}</b></td><td>${r[3]}</td><td>${r[4]||'—'}</td><td>${r[5]?`<button class="bt p sm" onclick="take(${i})">Ответить</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Быстрые ответы','Администратор отвечает шаблоном из прайса нужного филиала и сразу предлагает свободные окна из расписания — пациент выбирает время прямо в чате.')}
 ${said('А CRM можно добавить туда?','Конечно: чаты, воронка и сделка с перепиской — в той же системе, что и запись.')}`;
function take(i){INB[i][4]='Динара';INB[i][5]=0;DL.unshift({id:'О-'+(412+DL.length),cl:INB[i][2],it:i===0?'Имплантация · консультация':'Лечение ребёнка · ОСМС',st:'cons',src:INB[i][1]});toast('Динара ответила и предложила окна: сегодня 16:00 или завтра 10:00. Обращение — в воронке на этапе «Консультация».');render()}

/* Воронка */
const FST=[['new','Обращение'],['cons','Записан на консультацию'],['plan','План лечения выдан'],['tr','Лечится'],['done','Лечение завершено']];
let DL=[
 {id:'О-401',cl:'+7 705 *** 21 90',it:'Брекеты · ребёнок 13 лет',st:'new',src:'ig'},
 {id:'О-398',cl:'Байжанов С.',it:'Имплант 36 · 420 000 ₸',st:'plan',src:'wa'},
 {id:'О-395',cl:'Тлеуова М.',it:'Коронки 11, 21 · 360 000 ₸',st:'tr',src:'gs'},
 {id:'О-390',cl:'Оспанов Т.',it:'Лечение каналов 46',st:'cons',src:'ph'},
 {id:'О-384',cl:'Мусина Ж.',it:'Гигиена + отбеливание',st:'done',src:'ig'},
 {id:'О-402',cl:'@dariya_m',it:'Виниры — сколько стоит?',st:'new',src:'ig'}
];
SC.funnel=()=>`<div class="hd"><div><h2>Воронка</h2><p>От обращения до завершённого лечения: консультация, выданный план, этапы лечения. Этапы настроим под вас. Нажмите на карточку — она перейдёт дальше.</p></div></div>
 <div class="oxk" style="grid-template-columns:repeat(5,minmax(150px,1fr))">${FST.map(f=>`<div class="oxkc"><h4>${f[1]} <small>${DL.filter(d=>d.st===f[0]).length}</small></h4>${DL.filter(d=>d.st===f[0]).map(d=>`<div class="oxkt" onclick="dNext('${d.id}')"><b>${d.cl}</b><span>${d.it}</span><small>${SRC[d.src][0]}</small></div>`).join('')}</div>`).join('')}</div>
 ${tip('Не теряем пациентов после консультации','Выдали план, а пациент не записался на лечение за 7 дней — система напомнит ему в WhatsApp и поставит задачу администратору.')}`;
function dNext(id){const d=DL.find(x=>x.id===id);const i=FST.findIndex(f=>f[0]===d.st);if(i>=FST.length-1){toast(d.cl+': лечение завершено. Через 6 месяцев придёт напоминание о гигиене.');return}d.st=FST[i+1][0];toast(`${d.cl} → «${FST[i+1][1]}».`+(d.st==='cons'?' Время записи ушло в WhatsApp.':d.st==='plan'?' План лечения с ценами ушёл пациенту.':d.st==='tr'?' Этапы плана — в расписании врача.':''));render()}

/* Пациенты */
let PT=[['Мусина Ж.','+7 702 *** 03 58','Центральный','Сейткали А.','',412000],['Байжанов С.','+7 701 *** 77 61','Центральный','Ким Е.','',186000],['Айша, 7 лет','+7 777 *** 40 12 (мама)','Детский','Нургалиева А.','ОСМС · до 18 лет',0],['Серикова Б.','+7 708 *** 47 22','Северный','Ахметова Д.','ОСМС · беременность',24000],['Тлеуова М.','+7 747 *** 15 93','Центральный','Ким Е.','',360000]];
SC.patients=()=>`<div class="hd"><div><h2>Пациенты</h2><p>Одна карта на всю сеть: пациент пришёл в другой филиал — врач видит всю историю, снимки, зубную формулу и план лечения. Пометка ОСМС ставится сама по возрасту или по беременности.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Пациент</th><th>Телефон</th><th>Филиал</th><th>Врач</th><th>Госзаказ</th><th class="r">Оплачено</th></tr></thead><tbody>${PT.map(r=>`<tr onclick="card('pt','${esc(r[0])}')" style="cursor:pointer"><td><b>${r[0]}</b></td><td class="mono">${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]?tag(r[4],'info'):'—'}</td><td class="r">${tg(r[5])}</td></tr>`).join('')}</tbody></table></div></div>`;
const TEETH=[[18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28],[48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]];
const TZ={16:['П','пломба'],26:['К','кариес'],36:['И','имплант'],46:['Э','эндо'],11:['Кр','коронка'],21:['Кр','коронка'],38:['Х','удалён']};
function zf(){return `<div class="dzf">${TEETH.map(r=>`<div>${r.map(t=>{const z=TZ[t];return `<span class="${z?'z':''}" title="${z?z[1]:''}"><small>${t}</small>${z?z[0]:''}</span>`}).join('')}</div>`).join('')}</div><div class="mut" style="font-size:11px;margin-top:4px">П — пломба · К — кариес · И — имплант · Э — лечение каналов · Кр — коронка · Х — удалён</div>`}
CARD.pt=n=>{const r=PT.find(x=>n.indexOf(x[0].split(',')[0])===0)||['Пациент','—','Центральный','Сейткали А.','',0];return [r[0],r[1]+' · '+r[2],`${zf()}
 <div class="kv" style="margin-top:10px"><span>Лечащий врач</span><b>${r[3]}</b></div><div class="kv"><span>Госзаказ</span><b>${r[4]||'платный пациент'}</b></div><div class="kv"><span>План лечения</span><b>3 этапа · 1 выполнен</b></div><div class="kv"><span>Оплачено</span><b>${tg(r[5])}</b></div><div class="kv"><span>Аллергии</span><b>лидокаин — нет · пенициллин — да</b></div>
 <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="bt p" onclick="act('Пациенту ушло в WhatsApp: свободные окна на эту неделю.')">Записать на приём</button><button class="bt" onclick="closeM();go('plan')">Открыть план лечения</button></div>`]};

/* Планы лечения */
let PL=[{p:'Байжанов С.',d:'Ким Е.',st:[['Удаление 36, костная пластика',120000,1],['Имплант 36',250000,0],['Коронка на импланте 36',170000,0]]},{p:'Тлеуова М.',d:'Ким Е.',st:[['Лечение каналов 11, 21',80000,1],['Коронки цирконий 11, 21',280000,0]]},{p:'Мусина Ж.',d:'Сейткали А.',st:[['Гигиена',25000,1],['Пломба 26',32000,1],['Отбеливание',90000,0]]}];
SC.plan=()=>`<div class="hd"><div><h2>Планы лечения</h2><p>Врач собирает план из прайса своего филиала: этапы, зубы, цены. Пациент получает план в WhatsApp и подписывает согласие. Выполненный этап сам уходит в кассу и в зарплату врача, материалы списываются со склада.</p></div></div>
 ${PL.map((x,i)=>{const s=x.st.reduce((t,e)=>t+e[1],0),d=x.st.filter(e=>e[2]).reduce((t,e)=>t+e[1],0);return `<div class="pan"><h3>${x.p} · врач ${x.d} <span class="mut" style="font-weight:400">· ${tg(d)} из ${tg(s)}</span></h3>${x.st.map((e,j)=>`<div class="kv"><span>${j+1}. ${e[0]}</span><b>${tg(e[1])} ${e[2]?tag('выполнен','ok'):`<button class="bt sm" onclick="plDone(${i},${j})">Отметить выполненным</button>`}</b></div>`).join('')}</div>`}).join('')}
 ${tip('Пациент не пропадает','План выдан, а следующий этап не записан 14 дней — пациенту уходит напоминание, администратору — задача позвонить.')}`;
function plDone(i,j){const e=PL[i].st[j];e[2]=1;toast(`${PL[i].p}: «${e[0]}» выполнен. ${tg(e[1])} — в кассу, 30 % — в зарплату врача, материалы списаны со склада.`);render()}

/* Прайсы */
let PR=[['Консультация','Т-01',5000,5000,0],['Пломба светоотверждаемая','Т-12',32000,29000,0],['Лечение каналов, 1 канал','Т-21',38000,35000,0],['Профессиональная гигиена','Г-01',25000,22000,0],['Удаление зуба простое','Х-02',15000,14000,0],['Имплант Osstem','И-04',250000,240000,0],['Коронка цирконий','О-15',140000,135000,0],['Брекеты металлические, 1 челюсть','ОД-3',280000,270000,0]];
SC.price=()=>`<div class="hd"><div><h2>Прайсы</h2><p>Один справочник услуг на сеть, цены могут отличаться по филиалам. Меняете цену один раз — она сразу в планах лечения, в кассе и в ответах администратора в чате.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Услуга</th><th>Код</th><th class="r">Центральный</th><th class="r">Северный, Южный</th><th></th></tr></thead><tbody>${PR.map((r,i)=>`<tr><td><b>${r[0]}</b></td><td class="mono">${r[1]}</td><td class="r">${tg(r[2])}</td><td class="r">${tg(r[3])}</td><td><button class="bt sm" onclick="prUp(${i})">+5 %</button></td></tr>`).join('')}</tbody></table></div></div>
 ${tip('История цен','Видно, кто и когда поменял цену. Уже выданные планы лечения остаются по старой цене, пока пациент их не начал.')}`;
function prUp(i){PR[i][2]=Math.round(PR[i][2]*1.05/500)*500;PR[i][3]=Math.round(PR[i][3]*1.05/500)*500;toast(`${PR[i][0]}: новая цена ${tg(PR[i][2])}. Уже в кассе и в шаблонах чата.`);render()}

/* Госзаказ ОСМС */
let OS=[['Айша, 7 лет','Детский','Нургалиева А.','Лечение кариеса 75','D-K02.1','ok'],['Алихан, 9 лет','Детский','Нургалиева А.','Герметизация фиссур 36','D-K02.0','ok'],['Серикова Б. · 24 нед.','Северный','Ахметова Д.','Пломба 26','D-K02.1','ok'],['Амина, 15 лет','Детский','Нургалиева А.','Удаление 85','D-K08.3','err'],['Ерасыл, 6 лет','Детский','Нургалиева А.','Пульпит 74','D-K04.1','err'],['Дамир, 18 лет 2 мес.','Южный','Ли С.','Лечение кариеса 46','D-K02.1','age']];
const OSE={ok:['проверено','ok'],err:['код не совпадает с услугой','bad'],age:['не подходит по возрасту','bad'],fix:['исправлено','ok']};
SC.osms=()=>`<div class="hd"><div><h2>Услуги по ОСМС · октябрь</h2><p>Бесплатное лечение детей до 18 лет и беременных. Врач отмечает услугу в карте, система сама подставляет код и проверяет его до отправки: возраст, беременность, услуга в перечне, код подходит к услуге и зубу, нет дублей. Ошибку видно сразу, а не через три года на проверке.</p></div>${filSw()}</div>
 <div class="wid"><div><small>Услуг за месяц</small><b>${Math.round(412*K[fil])}</b><span>дети ${Math.round(371*K[fil])} · беременные ${Math.round(41*K[fil])}</span></div><div><small>К оплате фондом</small><b>${tg(8400000*K[fil])}</b><span>по тарифам</span></div><div><small>С ошибкой</small><b class="r">${OS.filter(r=>r[5]==='err'||r[5]==='age').length}</b><span>не уйдут, пока не исправите</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Пациент</th><th>Филиал</th><th>Врач</th><th>Услуга</th><th>Код</th><th>Проверка</th><th></th></tr></thead><tbody>${OS.map((r,i)=>`<tr class="${r[5]==='err'||r[5]==='age'?'rowwarn':''}"><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td class="mono">${r[4]}</td><td>${tag(OSE[r[5]][0],OSE[r[5]][1])}</td><td>${r[5]==='err'?`<button class="bt sm" onclick="osFix(${i})">Исправить код</button>`:r[5]==='age'?`<button class="bt sm" onclick="osPaid(${i})">Перевести в платные</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Правила проверки — ваши','Перечень услуг, коды и правила настроим вместе с вашим специалистом по госзаказу. Поменялись правила фонда — меняем справочник, без переделки системы.')}
 ${said('Проверили 23, 24, 25 год — какой-то код неправильный, и из-за этого 14 миллионов хотят вернуть','Система не даст отправить услугу с неверным кодом и хранит, кто и что отметил. Чтобы такое не повторилось.')}`;
function osFix(i){OS[i][4]=i===3?'D-K08.1':'D-K04.0';OS[i][5]='fix';toast(`${OS[i][0]}: код заменён на ${OS[i][4]} по услуге «${OS[i][3]}». Изменение записано в журнал: кто, когда, что было.`);render()}
function osPaid(i){OS[i][5]='fix';OS[i][4]='платно';toast(`${OS[i][0]}: пациенту уже 18 — услуга переведена в платные, администратор предупредит пациента.`);render()}

/* Проверка кодов */
SC.audit=()=>`<div class="hd"><div><h2>Проверка кодов</h2><p>Сверка уже отправленных услуг за любой период — как это делает проверка фонда. Система показывает, где код, возраст, зуб или документ не сходятся, и кто отметил услугу. Перед ежемесячной отправкой специалист видит только то, что надо поправить.</p></div></div>
 <div class="wid"><div><small>Период</small><b>2023–2025</b><span>после переноса из MacDent</span></div><div><small>Услуг проверено</small><b>14 862</b><span>4 филиала</span></div><div><small>Вопросов к коду</small><b class="r">318</b><span>2,1 %</span></div><div><small>Сумма под вопросом</small><b>${tg(6900000)}</b><span>пример на придуманных данных</span></div></div>
 <div class="g2"><div class="pan"><h3>Где чаще ошибки</h3>${bars([['Код не подходит к услуге',164],['Возраст на дату приёма',71],['Нет подтверждения беременности',38],['Дубль услуги на тот же зуб',29],['Зуб не совпадает с картой',16]])}</div>
 <div class="pan"><h3>По врачам</h3>${[['Нургалиева А.','Детский',142],['Ли С.','Южный',88],['Ахметова Д.','Северный',51],['Сейткали А.','Центральный',37]].map(r=>`<div class="kv"><span>${r[0]} · ${r[1]}</span><b>${r[2]} вопросов</b></div>`).join('')}<div style="margin-top:10px"><button class="bt" onclick="act('Отчёт по проверке выгружен в Excel: пациент, дата, услуга, код, что не так, кто отметил.')">Выгрузить отчёт</button></div></div></div>
 ${tip('Для разговора с фондом','По каждой услуге — полная история: запись, карта, снимок, кто отметил код. Это помогает понять, где действительно ошибка, а где её нет. Юридическую часть ведёт ваш юрист.')}`;

/* Склад */
let MT=[['Композит Filtek A2','шприц 4 г','n',3,14,'3 дня'],['Анестетик Убистезин','карпула',null,640,300,'—'],['Имплант Osstem TS III','шт.','c',6,4,'—'],['Гуттаперча','упаковка','s',2,5,'5 дней'],['Перчатки нитрил M','упаковка 100 шт.',null,48,30,'—'],['Слепочная масса','банка','c',4,3,'—']];
SC.stock=()=>`<div class="hd"><div><h2>Материалы</h2><p>Остатки по филиалам. Врач отмечает выполненную услугу — материалы по норме списываются сами. Видно, на сколько дней хватит и кто тратит больше нормы.</p></div>${filSw()}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Материал</th><th>Ед.</th><th class="r">Остаток</th><th class="r">Минимум</th><th>Хватит</th><th></th></tr></thead><tbody>${MT.map((r,i)=>{const q=Math.round(r[3]*(r[2]?1:K[fil]));const low=r[3]<r[4];return `<tr class="${low?'rowwarn':''}"><td><b>${r[0]}</b>${r[2]?`<br><small class="mut">${FIL[r[2]]}</small>`:''}</td><td>${r[1]}</td><td class="r">${fmt(fil==='all'||!r[2]||r[2]===fil?q:0)}</td><td class="r">${r[4]}</td><td>${low?tag(r[5],'bad'):tag('хватит','ok')}</td><td>${low?`<button class="bt sm" onclick="mtOrder(${i})">Заказать</button>`:''}</td></tr>`}).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Нормы списания</h3><div class="kv"><span>Пломба светоотверждаемая</span><b>композит 0,3 г · адгезив 1 доза</b></div><div class="kv"><span>Лечение каналов</span><b>гуттаперча · силер · анестетик 1</b></div><div class="kv"><span>Имплантация</span><b>имплант · формирователь · анестетик 2</b></div></div>
 <div class="pan"><h3>Расход выше нормы · октябрь</h3><div class="kv"><span>Анестетик · Северный</span><b>+18 %</b></div><div class="kv"><span>Композит · Южный</span><b>+11 %</b></div></div></div>`;
function mtOrder(i){MT[i][3]+=MT[i][4]*2;toast(`${MT[i][0]}: заявка поставщику на ${MT[i][4]*2} ед. После прихода остаток обновится.`);render()}

/* Переход */
SC.migr=()=>`<div class="hd"><div><h2>Переход с MacDent</h2><p>Переносим пациентов, историю приёмов, планы лечения, прайсы и остатки. Работаете в MacDent до дня переключения. Оплаченная подписка дорабатывает своё — к её концу всё уже в новой системе.</p></div></div>
 <div class="dpflow">${['Выгрузка из MacDent','Пациенты и история','Прайсы и врачи','Остатки материалов','Сверка и переключение'].map((x,i)=>`<div><small>${i+1}</small><b>${x}</b></div>`).join('')}</div>
 <div class="g2"><div class="pan"><h3>Что меняется</h3><div class="kv"><span>Филиалы</span><b>4 сейчас, запас до 6</b></div><div class="kv"><span>Сотрудники</span><b>без ограничений</b></div><div class="kv"><span>Подписка за филиал</span><b>не нужна</b></div><div class="kv"><span>WhatsApp, CRM, склад, ОСМС</span><b>в одной системе</b></div></div>
 <div class="pan"><h3>Когда начинаем</h3><div class="kv"><span>Ноябрь</span><b>у вас проверка — не отвлекаем</b></div><div class="kv"><span>1 декабря</span><b>старт работ</b></div><div class="kv"><span>Середина декабря</span><b>первая версия на сервере</b></div><div class="kv"><span>Январь</span><b>сдача, 3 месяца сопровождения</b></div></div></div>
 ${said('Я и так в MacDent оплатила годовую; ноябрь — полная проверка, поэтому декабрь у меня первый','Подстроимся: старт 1 декабря, переключение — когда закончится подписка или раньше, как решите.')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и этапы</h2><p>Стандартный пакет разработки. Система ваша: код, сервер и данные у вас, без абонплаты за филиалы и сотрудников.</p></div></div>
 <div class="pk1"><div><small>Стандартный пакет</small><b>2 000 000 ₸</b><span>всё из демо, 4 филиала с запасом до 6</span></div><div><small>Срок</small><b>4–6 недель</b><span>первая версия через 10 дней</span></div></div>
 <div class="pay3"><div><small>1 · Старт · 10%</small><b>200 000 ₸</b><span>поднимаем сервер, выгружаем MacDent, подключаем WhatsApp</span></div><div><small>2 · Первая версия · 45%</small><b>900 000 ₸</b><span>запись, подтверждения, пациенты, планы работают на сервере — вы пользуетесь</span></div><div><small>3 · Полировка и сдача · 45%</small><b>900 000 ₸</b><span>правки по вашим замечаниям, ОСМС, склад, отчёты; код и ключи — ваши</span></div></div>
 <div class="g2"><div class="pan"><h3>Входит</h3>${['Расписание врачей по креслам, 4–6 филиалов','Подтверждения записи в WhatsApp каждое утро','Чаты, воронка, карта пациента с зубной формулой','Планы лечения и прайсы по филиалам','Услуги по ОСМС с проверкой кодов','Склад материалов со списанием на приём','Перенос из MacDent, 3 месяца сопровождения'].map(x=>`<div class="kv"><span>${x}</span><b>✓</b></div>`).join('')}</div>
 <div class="pan"><h3>Отдельно</h3><div class="kv"><span>WhatsApp (Green API)</span><b>≈ 5 000 ₸ в месяц вместо 36 000</b></div><div class="kv"><span>Сервер</span><b>≈ 15–30 $ в месяц</b></div><div class="kv"><span>Доработки после сдачи</span><b>по часам</b></div></div></div>
 ${tip('Работаем вместе','После первой версии вы пользуетесь и говорите, что добавить, убрать и поменять — это последний, самый большой этап, он входит в пакет. После сдачи 3 месяца в бою поддерживаем: наши ошибки исправляем бесплатно.')}`;

/* Каркас */
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const p=PT.find(x=>(x[0]+x[1]+x[3]).toLowerCase().includes(v));if(p&&v&&allowed('patients')){go('patients');card('pt',p[0]);return}toast('Ищите по пациенту, телефону или врачу: «Мусина», «Ким», «Айша».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">АҚ ТІС</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='inbox'?'<em>'+INB.filter(r=>r[5]).length+'</em>':x[0]==='audit'?'<em>'+OS.filter(r=>r[5]==='err'||r[5]==='age').length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['sched','Запись'],['remind','WhatsApp'],['patients','Пациенты'],['plan','Планы'],['osms','ОСМС'],['stock','Склад']].filter(x=>allowed(x[0])).slice(0,5).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'АҚ ТІС';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт сети: записи, подтверждения, выручка, ОСМС.'],
 ['sched','2 · Расписание врачей по креслам — цвет = ответ пациента.'],
 ['remind','3 · Каждое утро WhatsApp: «запись сегодня — подтверждаете?»'],
 ['funnel','4 · От обращения до завершённого лечения.'],
 ['patients','5 · Карта пациента с зубной формулой на всю сеть.'],
 ['plan','6 · План лечения: этап выполнен — касса, зарплата, склад.'],
 ['osms','7 · ОСМС: код проверяется до отправки.'],
 ['stock','8 · Материалы списываются на приём сами.'],
 ['launch','9 · 2 000 000 ₸, 4–6 недель, старт 1 декабря.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
