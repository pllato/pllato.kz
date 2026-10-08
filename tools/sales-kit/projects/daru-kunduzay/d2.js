
const SC={};
const pbar=p=>`<div class="pbr"><i style="width:${Math.min(100,p)}%"></i></div>`;
const stTag=k=>`<span class="stp-t s-${k}">${PST[PSI(k)][1]}</span>`;

SC.today=()=>{const tr=PTS.filter(p=>p.st==='treat');
 return `<div class="hd"><div><h2>Пульт клиники · ${TODAY}</h2><p>Заявки, звонки, пациенты на лечении, кабинеты, склад и касса — в одном окне. Без переключения между amoCRM, МоимСкладом, Excel и таблицами.</p></div><div class="btns"><button class="bt" onclick="go('aiboard')">Спросить ИИ</button><button class="bt p" onclick="card('newlead')">+ Заявка</button></div></div>
 <div class="wid">
  <div class="clk" onclick="go('leads')"><small>Заявок сегодня</small><b>27</b><span>2 ждут больше 5 минут</span></div>
  <div class="clk" onclick="go('leads')"><small>Записано к врачу</small><b class="a">11</b><span>конверсия заявка → запись 41%</span></div>
  <div class="clk" onclick="go('sheet')"><small>На лечении</small><b>18</b><span>капельничная: 14 из 16 мест</span></div>
  <div class="clk" onclick="go('cash')"><small>Касса сегодня</small><b class="g">1,26 млн</b><span>Kaspi 64% · наличные 36%</span></div>
  <div class="clk" onclick="go('stock')"><small>Склад</small><b class="r">4</b><span>позиции ниже минимума</span></div>
 </div>
 <div class="g3">
  <div class="pan"><h3>Путь пациента сегодня</h3>${[['Заявки',27],['Дозвонились',22],['Консультация КЦ',16],['Записаны',11],['Пришли на приём',7],['Подобран курс',5]].map((x,i,a)=>`<div class="fn"><span>${x[0]}</span><i style="width:${x[1]/a[0][1]*100}%"></i><b>${x[1]}</b></div>`).join('')}</div>
  <div class="pan"><h3>Требует внимания</h3>
   <div class="rf bad" onclick="go('leads')"><i></i><div><b>Заявка Гаухар С. висит 8 минут</b><span>никто не взял · 2ГИС</span></div></div>
   <div class="rf bad" onclick="go('stock')"><i></i><div><b>Пиявки — срок до 14.10</b><span>140 шт, по курсам нужно 9 — остальное списать или перенести</span></div></div>
   <div class="rf" onclick="go('discipline')"><i></i><div><b>Мадияр: 3 ответа в WhatsApp дольше 15 минут</b><span>вышел на линию в 09:41 вместо 09:00</span></div></div>
   <div class="rf" onclick="go('calls')"><i></i><div><b>ИИ: 4 звонка без предложения записи</b><span>за утро · Мадияр 3, Ерболат 1</span></div></div>
  </div>
  <div class="pan"><h3>Кабинеты сейчас</h3>${[['Капельничная',14,16],['Физиокабинет',3,4],['Кабинет хиджамы',1,1],['Иглотерапия',1,2],['Приём врача',2,2]].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]} / ${x[2]}</b></div>`).join('')}<button class="bt sm" onclick="go('schedule')">Расписание →</button></div>
 </div>
 <div class="pan"><h3>На лечении · день курса</h3><div class="tw"><table class="t"><thead><tr><th>Пациент</th><th>Врач</th><th style="width:30%">Курс</th><th class="r">Курс, ₸</th><th class="r">Оплачено</th></tr></thead><tbody>${tr.map(p=>`<tr class="clk" onclick="curPt='${p.id}';go('sheet')"><td><b>${p.n}</b><div class="sub">${p.note}</div></td><td>${p.dr}</td><td>${pbar(p.day/15*100)}<span class="mini">день ${p.day} из 15</span></td><td class="r mono">${fmt(cSum(p.course))}</td><td class="r mono ${p.paid<cSum(p.course)?'wtx':''}">${fmt(p.paid)}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('«Индивидуально не подбирается — нужно миллион вариантов дописывать прямо в моменте. Вот какие у нас сейчас сложности».')}`};

SC.analytics=()=>`<div class="hd"><div><h2>Маркетинг и воронка</h2><p>Откуда приходят пациенты, сколько стоит заявка и пациент, кто доходит до курса — по каждому каналу. Маркетолог видит результат рекламы в деньгах, а не в лайках.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Канал</th><th class="r">Бюджет</th><th class="r">Заявки</th><th class="r">Записаны</th><th class="r">Пришли</th><th class="r">Курс</th><th class="r">Цена пациента</th><th class="r">Выручка</th><th class="r">ROMI</th></tr></thead><tbody>${[['Instagram',1200000,412,168,121,74,26400000],['TikTok',600000,260,82,51,26,8900000],['Реклама 2ГИС',300000,118,61,48,32,11300000],['Сарафан и рекомендации',0,64,52,47,39,14100000]].map(r=>`<tr><td><b>${r[0]}</b></td><td class="r mono">${r[1]?fmt(r[1]):'—'}</td><td class="r mono">${r[2]}</td><td class="r mono">${r[3]}</td><td class="r mono">${r[4]}</td><td class="r mono">${r[5]}</td><td class="r mono">${r[1]?fmt(r[1]/r[5]):'—'}</td><td class="r mono">${mln(r[6])}</td><td class="r mono pos">${r[1]?Math.round((r[6]-r[1])/r[1]*100)+'%':'—'}</td></tr>`).join('')}</tbody></table></div>
 <div class="g2"><div class="pan"><h3>Где теряем пациентов · сентябрь</h3>${[['Заявка → дозвон',82],['Дозвон → запись',47],['Запись → пришёл',76],['Пришёл → курс',64]].map(x=>`<div class="fn"><span>${x[0]}</span><i style="width:${x[1]}%"></i><b>${x[1]}%</b></div>`).join('')}<p class="mini">Самая большая потеря — на записи. ИИ по звонкам: в 38% разговоров менеджер не предложил конкретное время приёма.</p></div>
 <div class="pan"><h3>Повторные и рекомендации</h3><div class="kv"><span>Пациентов прошли курс</span><b>171</b></div><div class="kv"><span>Пришли повторно</span><b>23</b></div><div class="kv"><span>Привели знакомых</span><b>39</b></div><div class="kv"><span>Средняя оценка курса</span><b>9,4 из 10</b></div></div></div>`;

const AIQ=[
 ['Почему упала запись в понедельник?','В понедельник 27 заявок, записано 6 (обычно 11). 9 заявок пришли с 09:00 до 09:40 — на линии был один менеджер: Мадияр вышел в 09:41, Аружан не вышла. Среднее время до первого звонка — 23 минуты вместо 4. Предлагаю: утренняя смена с 08:45 и автоматическая передача заявки свободному менеджеру через 3 минуты.'],
 ['Какие процедуры чаще добавляют к курсу?','За сентябрь к основе (капельницы + очищение) добавляли: магнитотерапию — 61% курсов, хиджаму — 38%, иглотерапию — 29%, фитосбор — 54%. Средний курс вырос с 312 до 348 тыс. ₸ — врачи чаще подбирают физиолечение индивидуально.'],
 ['Хватит ли лекарств на курсы, которые стартуют на неделе?','Нет по двум позициям: адеметионин — остаток 96 фл, по 12 стартующим курсам нужно 120; мельдоний — 380 амп при потребности 410. Заказ нужен сегодня — поставщик везёт 3 дня.'],
 ['Сделай отчёт по менеджерам за неделю','Айжан — 214 звонков, 46 записей, 29 курсов, оценка разговоров 91. Ерболат — 188 / 37 / 21, оценка 84. Мадияр — 97 / 14 / 6, оценка 68: опоздания 4 из 5 дней, долгие ответы в WhatsApp. Рекомендация: разбор 5 звонков Мадияра с РОПом.']
];
let aiOpen=[0];
SC.aiboard=()=>`<div class="hd"><div><h2>ИИ-помощник руководителя</h2><p>Спрашиваете своими словами — ИИ отвечает по данным клиники: заявки, звонки, курсы, склад, касса. Плюс ИИ слушает звонки менеджеров и оценивает их по вашему скрипту.</p></div></div>
 <div class="chatai">${aiOpen.map(i=>`<div class="qq"><b>Кундузай</b>${AIQ[i][0]}</div><div class="qa"><i>ИИ</i><div>${AIQ[i][1]}</div></div>`).join('')}</div>
 <div class="qsug">${AIQ.map((q,i)=>aiOpen.includes(i)?'':`<a onclick="aiOpen.push(${i});render()">${q[0]}</a>`).join('')}</div>
 <div class="qin"><input placeholder="Например: сколько пациентов закончат курс на этой неделе?" onkeydown="if(event.key==='Enter')toast('В рабочей системе ответ придёт по вашим данным. В демо — выберите вопрос из подсказок.')"><button class="bt p" onclick="toast('В рабочей системе ответ придёт по вашим данным. В демо — выберите вопрос из подсказок.')">Спросить</button></div>
 ${said('«Мне нужен искусственный интеллект».','ИИ здесь не ставит диагнозы и не назначает лечение — это делает врач. ИИ работает на продажи, контроль и отчёты.')}`;

SC.leads=()=>`<div class="hd"><div><h2>Заявки · путь пациента</h2><p>Заявка из рекламы падает сразу в систему → колл-центр звонит и записывает → администратор встречает → врач подбирает курс → лечение 15 дней → оценка и повторный визит. Как сейчас в amoCRM, но вместе с клиникой, складом и кассой.</p></div><div class="btns"><button class="bt p" onclick="card('newlead')">+ Заявка</button></div></div>
 <div class="kb">${PST.map(([k,n])=>{const L=PTS.filter(p=>p.st===k);return `<div class="kc s-${k}"><div class="kh"><b>${n}</b><span>${L.length}</span></div>${L.map(p=>`<div class="kd ${p.st==='new'&&p.note.includes('8 минут')?'alarm':''}" onclick="curPt='${p.id}';go('patient')"><div class="kt"><b>${p.n}</b><span class="src">${p.src}</span></div><div class="km">${p.note}</div><div class="kf">${p.m}${p.course?`<b>${fmt(cSum(p.course))} ₸</b>`:''}</div></div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>
 <p class="mini">Новая заявка без ответа 3 минуты — уходит свободному менеджеру, через 5 минут — уведомление РОПу.</p>`;

SC.patient=()=>{const p=PT(curPt),i=PSI(p.st);
 return `<div class="hd"><div><div class="mini"><a class="lk" onclick="go('leads')">Заявки</a> / ${p.id}</div><h2>${p.n}, ${p.age}</h2><p>${p.ph} · источник ${p.src} · менеджер ${p.m}${p.dr?' · врач '+p.dr:''}</p></div><div class="btns"><button class="bt" onclick="go('builder')">Курс</button><button class="bt p" onclick="ptNext('${p.id}')">→ ${i<PST.length-1?PST[i+1][1]:'готово'}</button></div></div>
 <div class="stps">${PST.map((s,j)=>`<div class="${j<i?'ok':j===i?'on':''}"><i>${j<i?'✓':j+1}</i>${s[1]}</div>`).join('')}</div>
 <div class="g3">
  <div class="pan"><h3>Пациент</h3><div class="kv"><span>Жалобы</span><b>${p.note}</b></div><div class="kv"><span>Курс</span><b>${p.course?fmt(cSum(p.course))+' ₸':'не подобран'}</b></div><div class="kv"><span>Оплачено</span><b>${fmt(p.paid)} ₸</b></div><div class="kv"><span>День курса</span><b>${p.day?p.day+' из 15':'—'}</b></div></div>
  <div class="pan"><h3>WhatsApp</h3><div class="msgs">${[['Пациент','Здравствуйте, сколько стоит лечение суставов?'],['Айжан','Сауле, здравствуйте! Курс подбирает врач после осмотра. Консультация 12 000 ₸. Удобно завтра в 10:00 или 15:00?'],['Пациент','В 10:00'],['Робот','Напоминание: завтра в 10:00 приём, адрес и карта по ссылке.']].map(m=>`<div class="mg ${m[0]==='Пациент'?'':'me'}"><small>${m[0]}</small>${m[1]}</div>`).join('')}</div></div>
  <div class="pan"><h3>Звонки</h3>${[['исх.','25.09 · 16:12','4:38','Записала на приём 26.09 10:00','92'],['вход.','25.09 · 15:50','1:05','Первый звонок по заявке','—']].map(c=>`<div class="cl"><b>${c[0]} ${c[1]} · ${c[2]}</b><span>${c[3]}</span>${c[4]!=='—'?`<em>оценка ИИ ${c[4]}</em>`:''}</div>`).join('')}<button class="bt sm" onclick="toast('Запись разговора воспроизводится в карточке — телефония Sipuni или Binotel.')">▶ Прослушать</button></div>
 </div>
 <div class="pan"><h3>История</h3>${[['25.09 15:46','Заявка из Instagram, форма «Суставы»'],['25.09 15:50','Айжан взяла заявку через 4 минуты'],['25.09 16:12','Записана к врачу на 26.09 10:00'],['26.09 10:05','Администратор отметила приход'],['26.09 10:40','Врач подобрал курс — 371 000 ₸, старт 03.10, оплата 100%'],['08.10 10:45','Врач добавил хиджаму ×2 — доплата 30 000 ₸ оплачена']].map(x=>`<div class="evt"><span class="mono">${x[0]}</span><em>${x[1]}</em></div>`).join('')}</div>`};
function ptNext(id){const p=PT(id),i=PSI(p.st);if(i>=PST.length-1){toast('Пациент уже на финальном этапе.');return}if(PST[i+1][0]==='treat'&&!p.course){toast('Нельзя начать лечение без курса — подберите курс в конструкторе.');go('builder');return}p.st=PST[i+1][0];render();toast(`${p.n} → «${PST[i+1][1]}».`)}

const CALLS=[
 {m:'Айжан',t:'10:42',d:'5:12',pt:'Динара Ж.',sc:94,ok:['Поздоровалась по имени','Выяснила жалобы','Предложила два времени приёма','Закрыла на запись'],bad:[]},
 {m:'Мадияр',t:'10:31',d:'2:04',pt:'Ерлан К.',sc:58,ok:['Поздоровался'],bad:['Назвал цену курса до осмотра врача','Не предложил время приёма','Не договорился о следующем шаге']},
 {m:'Ерболат',t:'10:15',d:'3:47',pt:'Марат А.',sc:86,ok:['Выяснил жалобы','Записал на приём'],bad:['Не рассказал про подготовку к анализам']},
 {m:'Мадияр',t:'09:58',d:'1:31',pt:'Гаухар С.',sc:61,ok:['Перезвонил'],bad:['Не выяснил жалобы','Не предложил время приёма']}
];
SC.calls=()=>`<div class="hd"><div><h2>Звонки и оценка консультаций ИИ</h2><p>Каждый звонок записывается через телефонию и попадает в карточку пациента. ИИ расшифровывает разговор и оценивает его по вашему скрипту: что менеджер сделал, что пропустил.</p></div></div>
 <div class="wid">${MGR.filter(m=>m.on).map(m=>`<div><small>${m.n}</small><b class="${m.score>=85?'g':m.score>=75?'w':'r'}">${m.score}</b><span>${m.calls} звонков · ${m.book} записей</span></div>`).join('')}<div><small>Скрипт</small><b>9 пунктов</b><span>настраивает РОП</span></div></div>
 ${CALLS.map(c=>`<div class="pan call"><div class="ch"><b>${c.m} → ${c.pt}</b><span class="mono">${c.t} · ${c.d}</span><span class="sc ${c.sc>=85?'g':c.sc>=75?'w':'r'}">${c.sc}</span></div><div class="g2">${c.ok.length?`<div>${c.ok.map(x=>`<div class="pk ok">✓ ${x}</div>`).join('')}</div>`:'<div></div>'}<div>${c.bad.map(x=>`<div class="pk bad">! ${x}</div>`).join('')}</div></div></div>`).join('')}
 ${said('«Оценивается разговор менеджера… в amoCRM».','Здесь оценка ставится по каждому звонку автоматически — РОП разбирает только проблемные.')}`;

SC.discipline=()=>`<div class="hd"><div><h2>Дисциплина и тайм-менеджмент</h2><p>Большая часть менеджеров работает удалённо. Видно, кто на линии с какого времени, сколько звонков и минут разговора, как быстро отвечает в WhatsApp. Кнопка «Я на работе» + реальные действия в системе.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Менеджер</th><th>Статус</th><th>На линии с</th><th class="r">Звонки</th><th class="r">Минут</th><th class="r">WhatsApp</th><th class="r">Ответ >15 мин</th><th style="width:22%">Активность за день</th></tr></thead><tbody>${MGR.map(m=>`<tr class="${!m.on?'rowbad':m.slow>2?'rowwarn':''}"><td><b>${m.n}</b></td><td>${m.on?'<span class="tag g">на линии</span>':'<span class="tag r">не вышла</span>'}</td><td class="mono ${m.since>'09:05'&&m.on?'neg':''}">${m.since}</td><td class="r mono">${m.calls}</td><td class="r mono">${m.talk}</td><td class="r mono">${m.wa}</td><td class="r mono ${m.slow?'neg':''}">${m.slow}</td><td><div class="act">${Array.from({length:12},(_,i)=>`<i style="opacity:${m.on?(.25+((i*7+m.calls)%9)/12):.08}"></i>`).join('')}</div></td></tr>`).join('')}</tbody></table></div>
 <div class="g2"><div class="pan"><h3>Правила смены</h3><div class="kv"><span>Начало смены</span><b>09:00</b></div><div class="kv"><span>Опоздание</span><b>уведомление РОПу</b></div><div class="kv"><span>Нет действий 20 минут</span><b>вопрос менеджеру, потом РОПу</b></div><div class="kv"><span>Заявка без ответа 3 минуты</span><b>передать свободному</b></div></div>
 <div class="pan"><h3>Неделя</h3>${MGR.slice(0,3).map(m=>`<div class="kv"><span>${m.n}</span><b>${m.n==='Мадияр'?'опоздания 4 из 5 дней':'вовремя 5 из 5'}</b></div>`).join('')}</div></div>
 ${said('«У меня ещё дисциплина, тайм-менеджмент — большая часть менеджеров сидят удалённо онлайн, их нужно проконтролировать».')}`;

SC.salary=()=>`<div class="hd"><div><h2>Зарплата менеджеров</h2><p>Менеджер видит свою зарплату в реальном времени: оклад, процент с проданных курсов, бонус за оценку разговоров, штрафы за опоздания. Финдиректор получает итог без ручного подсчёта.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Менеджер</th><th class="r">Оклад</th><th class="r">Продано курсов</th><th class="r">Выручка</th><th class="r">5% с выручки</th><th class="r">Бонус за оценку</th><th class="r">Опоздания</th><th class="r">Итого на сегодня</th></tr></thead><tbody>${MGR.slice(0,3).map(m=>{const k=m.rev*5.5;const b=m.score>=85?50000:m.score>=75?20000:0;const f=m.n==='Мадияр'?-20000:0;return `<tr><td><b>${m.n}</b></td><td class="r mono">150 000</td><td class="r mono">${m.sold*5}</td><td class="r mono">${mln(k)}</td><td class="r mono">${fmt(k*.05)}</td><td class="r mono">${fmt(b)}</td><td class="r mono ${f?'neg':''}">${fmt(f)}</td><td class="r mono"><b>${fmt(150000+k*.05+b+f)}</b></td></tr>`}).join('')}</tbody></table></div>
 <p class="mini">Правила мотивации настраиваются: проценты, пороги, бонусы. В демо — пример.</p>`;
