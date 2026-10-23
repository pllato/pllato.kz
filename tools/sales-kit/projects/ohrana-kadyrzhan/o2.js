/* Пульт директоров */
SC.dash=()=>`<div class="hd"><div><h2>Пульт директоров · ${TODAY}</h2><p>Готовые цифры без звонков в бухгалтерию: сколько абонентов, кто оплатил, кто должен, кто на отключении, сколько договоров в работе и что сейчас на пульте. Тот же экран открывается в телефоне.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('subs')"><small>Абонентов</small><b class="a">${fmt(TOT.all)}</b><span>+${TOT.conn} на подключении</span></div>
  <div class="clk" onclick="go('money')"><small>Оплатили за октябрь</small><b class="g">${fmt(TOT.paid)}</b><span>${Math.round(TOT.paid/TOT.all*100)}% · ${tg(118400000)}</span></div>
  <div class="clk" onclick="go('remind')"><small>Должны</small><b>${fmt(TOT.debt)}</b><span>${tg(21650000)} · напоминания идут</span></div>
  <div class="clk" onclick="go('cut')"><small>На отключение</small><b>${TOT.cutq}</b><span>ждут решения директора</span></div>
  <div class="clk" onclick="go('cut')"><small>Отключены</small><b>${TOT.cut}</b><span>${tg(3240000)} долга</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Договоры по стадиям</h3>${bars([['Заявка',26,'26'],['Обследование объекта',14,'14'],['Смета и КП',11,'11'],['Договор на подписи (ЭЦП)',9,'9'],['Монтаж',7,'7'],['Подключение к пульту',5,'5']])}
  <h3 style="margin-top:14px">Оплаты по месяцам, млн ₸</h3>${bars([['май',104.2,'104,2'],['июнь',106.9,'106,9'],['июль',109.5,'109,5'],['август',112.0,'112,0'],['сентябрь',115.6,'115,6'],['октябрь',118.4,'118,4']])}</div>
 <div class="pan"><h3>Сейчас</h3>
  <div class="rf bad" onclick="go('alarm')"><i></i><div><b>Тревожная кнопка · ТОО «Алем Маркет»</b><span>10:31 · мкр Самал-2, 58 · экипаж не назначен</span></div></div>
  <div class="rf" onclick="go('alarm')"><i></i><div><b>2 вызова в работе</b><span>ГБР-3 едет · ГБР-1 на месте</span></div></div>
  <div class="rf" onclick="go('apps')"><i></i><div><b>4 заявления ждут вашей визы</b><span>отпуск, аванс, приём на работу</span></div></div>
  <div class="rf" onclick="go('cut')"><i></i><div><b>${TOT.cutq} абонента на отключение</b><span>просрочка больше 30 дней</span></div></div>
  <div class="rf" onclick="go('staff')"><i></i><div><b>Сотрудники: 124 · на постах 86</b><span>2 больничных · 3 в отпуске</span></div></div>
 </div></div>
 ${said('Чтобы директора в реальном времени видели, сколько клиентов, сколько оплатили, сколько на отключение, сколько отключены — в мобильном телефоне, готовые цифры, чтобы не звонили бухгалтеру')}`;

SC.money=()=>`<div class="hd"><div><h2>Начисления и оплаты</h2><p>Каждый месяц система сама начисляет абонплату по договорам, оплаты приходят из банка и Kaspi и закрывают счета. Долг каждого абонента считается автоматически, без сверок в Excel.</p></div></div>
 <div class="wid"><div><small>Начислено за октябрь</small><b>${tg(140050000)}</b><span>${fmt(TOT.all)} абонентов</span></div><div><small>Оплачено</small><b class="g">${tg(118400000)}</b><span>банк 71% · Kaspi 26% · касса 3%</span></div><div><small>Долг всего</small><b class="a">${tg(21650000)}</b><span>${TOT.debt+TOT.cutq+TOT.cut} абонентов</span></div><div><small>Физическая охрана</small><b>${tg(46300000)}</b><span>38 объектов · посты</span></div></div>
 <div class="pan"><h3>Последние оплаты</h3><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Абонент</th><th>Откуда</th><th style="text-align:right">Сумма</th><th>Закрыто</th></tr></thead><tbody>${[['10:22','ТЦ «Арена»','Halyk · платёжное поручение',2860000,'счёт № 10-0771'],['10:05','ИП Касымова','Kaspi · по ссылке из напоминания',38000,'счёт № 10-1187'],['09:41','Школа «Зерде»','Банк · платёжное поручение',410000,'счёт № 10-3310'],['09:13','ТОО «Нур Строй»','Kaspi',92000,'частично · 1 из 2 счетов']].map(r=>`<tr><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td><td class="mono" style="text-align:right">${fmt(r[3])}</td><td>${r[4]}</td></tr>`).join('')}</tbody></table></div></div>`;

/* Абоненты */
let subF='all';
SC.subs=()=>{const list=SUB.filter(s=>subF==='all'||s.st===subF);
 return `<div class="hd"><div><h2>База абонентов</h2><p>Все ${fmt(TOT.all)} абонентов в одной базе вместо Excel: объект, тариф, кнопки, договор, долг и статус. Статус меняется сам — по оплатам и срокам.</p></div><div class="btns"><button class="bt p" onclick="go('funnel')">+ Новый клиент</button></div></div>
 <div class="oxf">${[['all','Все',TOT.all],['ok','Обслуживаются',TOT.paid],['debt','Долг',TOT.debt],['cutq','На отключение',TOT.cutq],['cut','Отключены',TOT.cut],['conn','Подключение',TOT.conn]].map(c=>`<button class="oxc ${subF===c[0]?'on':''}" onclick="subF='${c[0]}';render()">${c[1]} <b>${fmt(c[2])}</b></button>`).join('')}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Абонент</th><th>Объект</th><th>Тариф</th><th style="text-align:right">Абонплата</th><th style="text-align:right">Долг</th><th>Статус</th></tr></thead><tbody>${list.map(s=>`<tr class="clk ${s.st==='cutq'||s.st==='cut'?'rowbad':s.st==='warn'?'rowwarn':''}" onclick="curSub='${s.id}';go('card')"><td><b>${s.n}</b><br><small class="mono">${s.id}</small></td><td>${s.obj}</td><td><small>${s.plan}</small></td><td class="mono" style="text-align:right">${fmt(s.fee)}</td><td class="mono ${s.debt?'neg':''}" style="text-align:right">${s.debt?fmt(s.debt):'—'}</td><td>${tag(...ST[s.st])}</td></tr>`).join('')||'<tr><td colspan="6" class="hint">В демо по этому статусу нет строк.</td></tr>'}</tbody></table></div><p class="hint">В демо — 8 абонентов из ${fmt(TOT.all)}.</p></div>
 ${said('Есть пул клиентов, которые платят абонентскую плату, — по ним полный цикл обслуживания: счета, договоры, напоминания об оплате, об отключении')}`};

let curSub='А-0933';
SC.card=()=>{const s=SD(curSub);
 return `<div class="hd"><div><h2>${s.n} <small class="mono">${s.id}</small></h2><p>Карточка абонента: объекты, кнопки и датчики, договор, начисления и оплаты, документы, история напоминаний и вызовов. Поля карточки настраиваются под вас.</p></div><div class="btns"><select onchange="curSub=this.value;render()">${SUB.map(x=>`<option value="${x.id}" ${x.id===curSub?'selected':''}>${x.n}</option>`).join('')}</select></div></div>
 <div class="g2"><div class="pan"><h3>Абонент и объект</h3><div class="kv"><span>Статус</span><b>${tag(...ST[s.st])}</b></div><div class="kv"><span>Объект</span><b>${s.obj}</b></div><div class="kv"><span>Тариф</span><b>${s.plan}</b></div><div class="kv"><span>Абонплата</span><b class="mono">${tg(s.fee)} / мес</b></div><div class="kv"><span>Тревожных кнопок и датчиков</span><b>${s.btn}</b></div><div class="kv"><span>Договор</span><b>№ ОХ-${s.id.slice(2)} · подписан ЭЦП</b></div><div class="kv"><span>Контакт</span><b>${s.ph}</b></div>
 <h3 style="margin-top:12px">Ваши поля</h3><div class="kv"><span>Ответственный на объекте</span><b>заведующий складом</b></div><div class="kv"><span>Ключи от объекта</span><b>на пульте, ячейка 41</b></div><div class="kv"><span>Код снятия с охраны</span><b>скрыт · виден дежурному</b></div></div>
 <div class="pan"><h3>Деньги</h3><div class="kv"><span>Долг</span><b class="mono ${s.debt?'neg':''}">${s.debt?tg(s.debt):'нет'}</b></div><div class="kv"><span>Просрочка</span><b>${s.days?s.days+' дн.':'—'}</b></div>
 <h3 style="margin-top:12px">Документы · в кабинете клиента</h3>${['Счёт на оплату за октябрь','Акт выполненных работ за сентябрь','ЭСФ за сентябрь (из 1С)','Договор и приложения'].map(d=>`<div class="kv"><span>${d}</span><b>PDF</b></div>`).join('')}
 <h3 style="margin-top:12px">История</h3>${[['26.10','Напоминание о долге · WhatsApp','отправлено'],['21.10','Тревога: проникновение · ГБР-3','ложная, закрыта'],['05.10','Счёт за октябрь · в кабинет и на e-mail','отправлен']].map(r=>`<div class="kv"><span>${r[0]} · ${r[1]}</span><b>${r[2]}</b></div>`).join('')}</div></div>`};
