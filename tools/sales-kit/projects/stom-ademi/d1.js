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
