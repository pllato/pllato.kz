/* Инновационный центр Аллы Казаниной · демо системы центра (замена Altegio). Данные вымышленные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const mln=n=>n>=1e6?(n/1e6).toFixed(2).replace('.',',').replace(/,?0+$/,'')+' млн ₸':fmt(n)+' ₸';

const ROLES={
 'Владелец':{n:'Алла Юрьевна',av:'АЮ',note:'Финансы, зарплаты, филиалы, аналитика',s:['dash','sched','clients','leads','sales','fin','staff','stock','booking','settings']},
 'Управляющий':{n:'Диана',av:'ДИ',note:'Запись, клиенты, продажи, контроль смен',s:['dash','sched','clients','leads','sales','staff','stock','booking']},
 'Администратор':{n:'Администратор Ак-Сай',av:'АД',note:'Запись клиентов, оплаты, свой филиал',s:['sched','clients','leads','sales','stock','booking']},
 'Мастер':{n:'Мастер Айгуль',av:'МА',note:'Своё расписание и свои клиенты',s:['sched','clients','staff']},
 'Клиент':{n:'Онлайн-запись',av:'КЛ',note:'Запись по ссылке без приложения',s:['booking']}
};
const NAV=[
 ['ПУЛЬТ',[['dash','DSH','Пульт центра']]],
 ['РАБОТА',[['sched','CAL','Расписание'],['clients','CRM','Клиенты'],['leads','LED','Заявки',4],['booking','WEB','Онлайн-запись']]],
 ['ДЕНЬГИ',[['sales','SAL','Продажи и касса'],['fin','FIN','Финансы и отчёты'],['staff','KPI','Сотрудники и зарплаты'],['stock','STK','Склад и материалы']]],
 ['СИСТЕМА',[['settings','SET','Настройки и связи']]]
];
const TITLES={
 dash:['Пульт центра','Загрузка, выручка и клиенты по двум филиалам — то, за чем вы заходите в Altegio'],
 sched:['Расписание','Два филиала, кабинеты и аппараты: запись, статусы визитов и загрузка дня'],
 clients:['Клиенты','Карточка клиента: курс процедур, история визитов, оплаты, абонемент и переписка'],
 leads:['Заявки','Instagram, WhatsApp и звонки в одной воронке — от обращения до первой записи'],
 booking:['Онлайн-запись','Ссылка для клиента: выбрал услугу, мастера и время — запись сразу в расписании'],
 sales:['Продажи и касса','Визиты, абонементы, товары и оплаты: наличные, карта, Kaspi'],
 fin:['Финансы и отчёты','Выручка, средний чек, возвраты клиентов и прибыль по филиалам'],
 staff:['Сотрудники и зарплаты','Процент мастера, KPI администратора и расчёт зарплаты без бухгалтера'],
 stock:['Склад и материалы','Расходники и товары на продажу: остатки, списание за процедуру'],
 settings:['Настройки и связи','Услуги, цены, филиалы, доступы, WhatsApp, Instagram и телефония']
};
let role='Владелец',cur='dash';

/* ===== ДАННЫЕ ===== */
const BRANCH=[{id:'aks',name:'Ак-Сай',rooms:['Кабинет 1 · LPG','Кабинет 2 · Криолиполиз','Кабинет 3 · Прессотерапия']},
              {id:'far',name:'Аль-Фараби',rooms:['Кабинет 1 · LPG','Кабинет 2 · RF-лифтинг','Кабинет 3 · Массаж']}];
const SERV=[
 {id:'lpg',n:'LPG-массаж тела',dur:2,price:18000,cost:2200,cat:'Аппаратная коррекция'},
 {id:'cryo',n:'Криолиполиз · зона',dur:3,price:45000,cost:7500,cat:'Аппаратная коррекция'},
 {id:'rf',n:'RF-лифтинг тела',dur:2,price:22000,cost:2800,cat:'Аппаратная коррекция'},
 {id:'press',n:'Прессотерапия',dur:1,price:9000,cost:900,cat:'Аппаратная коррекция'},
 {id:'cav',n:'Кавитация',dur:2,price:20000,cost:2400,cat:'Аппаратная коррекция'},
 {id:'mio',n:'Миостимуляция',dur:1,price:12000,cost:1200,cat:'Аппаратная коррекция'},
 {id:'mas',n:'Ручной моделирующий массаж',dur:2,price:16000,cost:0,cat:'Массаж'},
 {id:'diag',n:'Диагностика и составление курса',dur:1,price:0,cost:0,cat:'Первичный приём'}
];
const MASTERS=[
 {id:'ayg',n:'Айгуль',br:'aks',role:'Мастер',pct:25,plan:900000,fact:1042000,visits:78,ret:82},
 {id:'sau',n:'Сауле',br:'aks',role:'Мастер',pct:25,plan:800000,fact:764000,visits:64,ret:74},
 {id:'kam',n:'Камила',br:'far',role:'Мастер',pct:25,plan:900000,fact:948000,visits:71,ret:79},
 {id:'zha',n:'Жанна',br:'far',role:'Мастер',pct:22,plan:700000,fact:612000,visits:55,ret:68},
 {id:'adm1',n:'Диана · админ',br:'aks',role:'Администратор',pct:3,plan:2000000,fact:1806000,visits:0,ret:0},
 {id:'adm2',n:'Асем · админ',br:'far',role:'Администратор',pct:3,plan:1800000,fact:1560000,visits:0,ret:0}
];
const CNAMES=['Айгерим Сакенова','Динара Абдуллаева','Асель Нуртаева','Гульмира Ахметова','Алия Каримова','Мадина Ержанова','Жанна Смагулова','Куралай Абенова','Айнур Бекова','Сауле Омарова','Дана Алимова','Лаура Садыкова','Камила Мукашева','Айжан Турсунова','Назгуль Ибраева','Индира Кенжебаева'];
let SEED=11;const rnd=()=>((SEED=SEED*1103515245+12345&0x7fffffff)/0x7fffffff);
const HOURS=['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];
function genAppts(){const out=[];
 BRANCH.forEach(b=>{b.rooms.forEach((r,ri)=>{
  let h=0;
  while(h<HOURS.length){
   if(rnd()<0.32){h++;continue}
   const s=SERV[Math.floor(rnd()*(SERV.length-1))];
   const dur=Math.min(s.dur,HOURS.length-h);
   const st=h<4?'done':rnd()<0.2?'new':rnd()<0.35?'paid':'plan';
   out.push({br:b.id,room:ri,h,dur,srv:s.id,cl:CNAMES[Math.floor(rnd()*CNAMES.length)],
    master:MASTERS.filter(m=>m.br===b.id&&m.role==='Мастер')[ri%2]?.n||'Айгуль',
    st,course:1+Math.floor(rnd()*10),courseAll:10,paid:st==='done'||st==='paid'});
   h+=dur;
  }})});
 return out}
let APPTS=genAppts();
let LEADS=[
 {n:'Айгерим Сакенова',ch:'Instagram',t:'10:41',need:'Реклама коррекции фигуры, спрашивает цену курса',st:0,note:'Написала в Direct после рекламы'},
 {n:'+7 701 445 22 18',ch:'WhatsApp',t:'10:22',need:'Хочет записаться на диагностику',st:0,note:'Первое обращение, номер новый'},
 {n:'Динара А.',ch:'WhatsApp',t:'09:50',need:'Уточняет, можно ли перенести визит',st:1,note:'Действующий клиент, курс LPG 4 из 10'},
 {n:'Сауле О.',ch:'Звонок',t:'вчера',need:'Интересуется криолиполизом, была на диагностике',st:2,note:'Запись разговора 3:12'},
 {n:'Лаура С.',ch:'Instagram',t:'вчера',need:'Подруга клиентки, просит скидку по рекомендации',st:1,note:'Источник: рекомендация'},
 {n:'Камила М.',ch:'Сайт',t:'вчера',need:'Заявка с формы: курс на 10 процедур',st:3,note:'Записана на 22.08 в 15:00'}
];
const LST=['Новая','В работе','Записан','Пришёл'];
const GOODS=[
 {n:'Антицеллюлитный крем 200 мл',qty:14,price:12000,cost:5200,type:'Товар'},
 {n:'Дренажный гель 300 мл',qty:8,price:9500,cost:4100,type:'Товар'},
 {n:'Комплекс для тела · курс',qty:5,price:38000,cost:17000,type:'Товар'},
 {n:'Одноразовое бельё',qty:210,price:0,cost:350,type:'Расходник'},
 {n:'Гель-проводник для LPG',qty:11,price:0,cost:3800,type:'Расходник'},
 {n:'Криопакеты',qty:26,price:0,cost:2200,type:'Расходник'}
];
const PAYS=[
 {cl:'Айгерим Сакенова',what:'Курс LPG · 10 процедур',sum:162000,pay:'Kaspi',t:'сегодня 10:14',master:'Айгуль',br:'Ак-Сай'},
 {cl:'Динара Абдуллаева',what:'Криолиполиз · 1 зона',sum:45000,pay:'Карта',t:'сегодня 09:40',master:'Камила',br:'Аль-Фараби'},
 {cl:'Асель Нуртаева',what:'Прессотерапия · разовая',sum:9000,pay:'Наличные',t:'сегодня 09:20',master:'Сауле',br:'Ак-Сай'},
 {cl:'Гульмира Ахметова',what:'Антицеллюлитный крем',sum:12000,pay:'Kaspi',t:'вчера 18:30',master:'Диана · админ',br:'Ак-Сай'},
 {cl:'Алия Каримова',what:'Курс RF · 6 процедур',sum:118800,pay:'Kaspi',t:'вчера 17:05',master:'Жанна',br:'Аль-Фараби'}
];

/* ===== ЭКРАНЫ ===== */
const SC={};
const srvOf=id=>SERV.find(s=>s.id===id);

SC.dash=()=>{const rev=PAYS.reduce((a,p)=>a+p.sum,0);
 return `<div class="head"><div><h2>Пульт центра</h2><p>То, ради чего вы заходите в Altegio: сколько записей, сколько денег, кто из мастеров сколько принёс и что происходит с клиентами. Только внутри вашей системы и с вашими правилами.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Сводка за день отправлена вам в WhatsApp.')">Сводка в WhatsApp</button><button class="btn gold" onclick="go('sched')">Открыть расписание</button></div></div>
 <div class="strip">
  <div><small>ВЫРУЧКА · АВГУСТ</small><b>9,4 млн ₸</b><span class="good">▲ 18% к июлю</span></div>
  <div><small>ЗАПИСЕЙ НА НЕДЕЛЮ</small><b>${APPTS.length*4}</b><span>2 филиала · 6 кабинетов</span></div>
  <div><small>ЗАГРУЗКА КАБИНЕТОВ</small><b>78%</b><span>Ак-Сай 82% · Аль-Фараби 74%</span></div>
  <div><small>СРЕДНИЙ ЧЕК</small><b>34 200 ₸</b><span class="good">▲ 4 100 ₸</span></div>
  <div><small>ВОЗВРАТ КЛИЕНТОВ</small><b>76%</b><span>доходят до конца курса</span></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph"><div><div class="ph-title">Сегодня в центре</div><div class="ph-sub">визиты, оплаты и свободные окна по двум филиалам</div></div><span class="tag gold">${new Date?'20 августа':''}</span></div>
   ${BRANCH.map(b=>{const ap=APPTS.filter(a=>a.br===b.id);const done=ap.filter(a=>a.st==='done').length;
    const money=ap.filter(a=>a.paid).reduce((s,a)=>s+srvOf(a.srv).price,0);
    return `<div style="padding:11px 0;border-bottom:1px solid #efe9ea">
     <div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:11.4px">${b.name}</b><span class="mono" style="font-size:10px">${mln(money)}</span></div>
     <div class="bar" style="margin-top:6px"><i style="--w:${Math.round(ap.length/18*100)}%;--tone:var(--gold)"></i></div>
     <div class="mini" style="margin-top:4px">${ap.length} записей · ${done} уже прошли · ${18-ap.length} свободных окон · 3 кабинета</div></div>`}).join('')}
   <div class="kpi-mini"><div style="--tone:var(--green)"><small>ОПЛАЧЕНО СЕГОДНЯ</small><b>${mln(rev)}</b></div><div style="--tone:var(--rose2)"><small>НОВЫХ КЛИЕНТОВ</small><b>4</b></div><div style="--tone:var(--blue)"><small>ПЕРЕНОСОВ</small><b>2</b></div></div>
   <div class="hint"><b>Главное отличие от таблицы и Altegio:</b> запись, оплата, списание расходников и процент мастера — это одно действие. Администратор закрывает визит, и деньги, зарплата и склад пересчитываются сами.</div>
  </div>
  <div class="panel dark"><div class="ph"><div><div class="ph-title">Требуют внимания</div><div class="ph-sub">система собрала по правилам</div></div><span class="tag red">4</span></div>
   ${[['var(--rose2)','2 заявки без ответа','Instagram и WhatsApp · дольше 15 минут','leads'],
      ['var(--gold)','7 клиентов не дошли до конца курса','остановились на 4–6 процедуре из 10','clients'],
      ['var(--blue)','Гель для LPG заканчивается','осталось 11 упаковок, хватит на 9 дней','stock'],
      ['var(--green)','Жанна отстаёт от плана','612 000 из 700 000 · до конца месяца 9 дней','staff']]
     .map(x=>`<div style="border-left:3px solid ${x[0]};background:#3a3141;padding:10px 11px;margin-bottom:6px;cursor:pointer;border-radius:0 5px 5px 0" onclick="go('${x[3]}')"><b style="font-size:10px">${x[1]}</b><p style="font-size:8.8px;color:#9d93a4;margin:4px 0 0;line-height:1.5">${x[2]}</p></div>`).join('')}
   <div style="border-top:1px solid #453a4c;margin-top:11px;padding-top:11px"><div class="ph-title" style="font-size:11px">Что заменяет система</div>
    <p style="font-size:8.8px;color:#9d93a4;line-height:1.7;margin:6px 0 0">Расписание и онлайн-запись, карточки клиентов и курсы процедур, кассу и абонементы, расчёт процентов мастерам и KPI администраторов, склад расходников, финансовые отчёты и воронку заявок. Всё, что сейчас в Altegio, плюс то, чего там нет: ваша воронка лидов из Instagram и WhatsApp с источниками.</p></div>
  </div>
 </div>
 <div class="g3">
  <div class="panel"><div class="ph"><div><div class="ph-title">Выручка по месяцам</div><div class="ph-sub">тёмное — услуги, золотое — товары и абонементы</div></div><span class="tag green">▲ 18%</span></div>
   <div class="chart" style="height:118px">${[['мар',62,12],['апр',68,15],['май',74,17],['июн',81,19],['июл',80,18],['авг',94,24]].map(m=>`<div class="chart-col"><i style="--h:${m[1]}%;--p:${m[2]}%"></i><span>${m[0]}</span></div>`).join('')}</div>
   <div class="kpi-mini"><div style="--tone:var(--gold)"><small>АВГУСТ</small><b>9,4 млн</b></div><div style="--tone:var(--blue)"><small>ТОВАРЫ</small><b>1,1 млн</b></div></div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Топ услуг</div><div class="ph-sub">по выручке за месяц</div></div></div>
   ${[['Криолиполиз',3240000,'var(--violet)'],['LPG-массаж',2680000,'var(--gold)'],['RF-лифтинг',1740000,'var(--blue)'],['Кавитация',920000,'var(--rose2)'],['Прессотерапия',520000,'var(--green)']]
     .map(r=>`<div class="fr" style="grid-template-columns:100px 1fr 72px"><span>${r[0]}</span><div class="ftrack" style="height:16px"><i style="--w:${Math.round(r[1]/3240000*100)}%;background:${r[2]}"></i></div><b>${mln(r[1])}</b></div>`).join('')}
   <div class="hint" style="margin-top:9px"><b>Видно сразу:</b> криолиполиз даёт треть выручки при том, что занимает всего один кабинет. Второй аппарат окупится за два месяца.</div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Откуда приходят клиенты</div><div class="ph-sub">источник фиксируется в заявке</div></div></div>
   ${[['Instagram · реклама',44,'var(--rose2)'],['Рекомендации',26,'var(--gold)'],['WhatsApp напрямую',14,'var(--green)'],['Сайт и карты',11,'var(--blue)'],['Прочее',5,'#c6bcc0']]
     .map(r=>`<div class="fr" style="grid-template-columns:112px 1fr 40px"><span>${r[0]}</span><div class="ftrack" style="height:16px"><i style="--w:${r[1]/44*100}%;background:${r[2]}"></i></div><b>${r[1]}%</b></div>`).join('')}
   <div class="kpi-mini"><div style="--tone:var(--rose2)"><small>ЗАЯВОК В МЕСЯЦ</small><b>168</b></div><div style="--tone:var(--green)"><small>ДОХОДЯТ ДО ВИЗИТА</small><b>41%</b></div></div>
  </div>
 </div>`};

/* ---- РАСПИСАНИЕ ---- */
let brF='aks';
SC.sched=()=>{const b=BRANCH.find(x=>x.id===brF);const ap=APPTS.filter(a=>a.br===brF);
 return `<div class="head"><div><h2>Расписание</h2><p>Общее расписание филиала по кабинетам и аппаратам. Цвет показывает состояние визита, клик открывает карточку записи с клиентом, курсом и оплатой.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Расписание на неделю отправлено мастерам в WhatsApp.')">Отправить мастерам</button><button class="btn gold" onclick="newAppt()">+ Записать клиента</button></div></div>
 <div class="filters">${BRANCH.map(x=>`<button class="filter ${x.id===brF?'on':''}" onclick="brF='${x.id}';render()">${x.name}</button>`).join('')}
  <span class="tag violet">запланировано</span><span class="tag gold">оплачено вперёд</span><span class="tag green">визит прошёл</span><span class="tag rose">новый клиент</span></div>
 <div class="strip">
  <div><small>ФИЛИАЛ</small><b>${b.name}</b><span>3 кабинета · 11 рабочих часов</span></div>
  <div><small>ЗАПИСЕЙ СЕГОДНЯ</small><b>${ap.length}</b><span>${ap.filter(a=>a.st==='done').length} уже прошли</span></div>
  <div><small>ЗАГРУЗКА</small><b>${Math.round(ap.reduce((s,a)=>s+a.dur,0)/(HOURS.length*3)*100)}%</b><span>по времени кабинетов</span></div>
  <div><small>ВЫРУЧКА ДНЯ</small><b>${mln(ap.filter(a=>a.paid).reduce((s,a)=>s+srvOf(a.srv).price,0))}</b><span>оплаченные визиты</span></div>
  <div><small>СВОБОДНЫХ ОКОН</small><b>${HOURS.length*3-ap.reduce((s,a)=>s+a.dur,0)}</b><span>можно предложить клиентам</span></div>
 </div>
 <div class="panel" style="overflow:auto">
  <div class="sched" style="--cols:${b.rooms.length}">
   <div class="hh"></div>
   ${b.rooms.map(r=>`<div class="hd-c"><b>${r.split(' · ')[0]}</b><small>${r.split(' · ')[1]||''}</small></div>`).join('')}
   ${HOURS.map((h,hi)=>`<div class="hh">${h}</div>`+b.rooms.map((r,ri)=>{
     const a=ap.find(x=>x.room===ri&&x.h===hi);
     const covered=ap.find(x=>x.room===ri&&x.h<hi&&x.h+x.dur>hi);
     if(covered)return '';
     if(!a)return `<div class="cell"><div class="slot-free" onclick="newAppt(${ri},${hi})">свободно</div></div>`;
     const s=srvOf(a.srv);
     return `<div class="cell"><div class="appt ${a.st==='done'?'done':a.st==='new'?'new':a.st==='paid'?'paid':''} ${a.dur>1?'h'+a.dur:''}" onclick="apptCard(${APPTS.indexOf(a)})">
      <b>${esc(a.cl.split(' ')[0])} ${esc(a.cl.split(' ')[1]||'')}</b><small>${esc(s.n)}</small><small>${a.master} · курс ${a.course}/${a.courseAll}</small></div></div>`}).join('')).join('')}
  </div>
  <div class="hint"><b>Как это работает у администратора:</b> клик по свободному окну — запись за 15 секунд, клик по визиту — отметить приход, принять оплату и списать расходники. Мастер со своего телефона видит только своё расписание.</div>
 </div>`};
function apptCard(i){const a=APPTS[i],s=srvOf(a.srv);
 openD(a.cl,`${esc(s.n)} · ${HOURS[a.h]} · ${BRANCH.find(b=>b.id===a.br).name} · ${a.master}`,['Визит'],
 `<div class="dg"><div class="det"><small>УСЛУГА</small><b>${esc(s.n)}</b></div><div class="det"><small>СТОИМОСТЬ</small><b>${fmt(s.price)} ₸</b></div>
  <div class="det"><small>КУРС</small><b>${a.course} из ${a.courseAll} процедур</b></div><div class="det"><small>СОСТОЯНИЕ</small><b class="${a.st==='done'?'good':a.st==='new'?'warn':''}">${a.st==='done'?'визит прошёл':a.st==='paid'?'оплачено вперёд':a.st==='new'?'новый клиент':'запланирован'}</b></div></div>
  <div class="bar" style="height:10px"><i style="--w:${a.course/a.courseAll*100}%;--tone:var(--gold)"></i></div>
  <div class="mini" style="margin-top:5px">Прогресс курса: пройдено ${a.course} из ${a.courseAll}. Осталось ${a.courseAll-a.course} процедур на сумму ${fmt((a.courseAll-a.course)*s.price)} ₸.</div>
  <div class="ph-title" style="margin:12px 0 7px;font-size:12px">Что произойдёт при закрытии визита</div>
  ${[['Оплата','сумма попадёт в кассу и в выручку филиала'],['Мастер',`${a.master} получит ${srvOf(a.srv).price*0.25|0} ₸ (25% от услуги)`],['Склад','спишется гель-проводник и одноразовое бельё'],['Клиент','процедура отметится в курсе, придёт напоминание о следующей']]
   .map(x=>`<div style="display:flex;gap:9px;padding:7px 0;border-bottom:1px solid #efe9ea;font-size:9.8px"><b style="width:74px">${x[0]}</b><span class="mini" style="flex:1">${x[1]}</span></div>`).join('')}
  <div class="btns" style="margin-top:12px">
   ${a.st!=='done'?`<button class="btn green" onclick="closeVisit(${i})">Клиент пришёл · закрыть визит</button>`:''}
   <button class="btn" onclick="closeD();clientCard('${esc(a.cl)}')">Карточка клиента</button>
   <button class="btn" onclick="toast('Клиенту отправлено напоминание в WhatsApp.')">Напомнить</button>
   <button class="btn red" onclick="closeD();toast('Визит перенесён, клиенту отправлено новое время.')">Перенести</button>
  </div>`)}
function closeVisit(i){const a=APPTS[i],s=srvOf(a.srv);a.st='done';a.paid=1;a.course=Math.min(a.courseAll,a.course+1);
 PAYS.unshift({cl:a.cl,what:s.n,sum:s.price,pay:'Kaspi',t:'только что',master:a.master,br:BRANCH.find(b=>b.id===a.br).name});
 const m=MASTERS.find(x=>x.n===a.master);if(m)m.fact+=s.price;
 closeD();render();sparks();
 toast(`Визит закрыт: <b>${fmt(s.price)} ₸</b> в кассу, ${fmt(s.price*(m?m.pct:25)/100)} ₸ начислено мастеру ${a.master}, расходники списаны со склада.`)}
function newAppt(room,hour){const b=BRANCH.find(x=>x.id===brF);
 openD('Новая запись','Клиент, услуга, мастер и время — одно окно',['Запись'],
 `<div class="f2"><div class="fld"><small>КЛИЕНТ</small><input id="apName" placeholder="Имя или телефон" list="cl"></div><div class="fld"><small>ТЕЛЕФОН</small><input id="apPhone" placeholder="+7 ___ ___ __ __"></div></div>
  <datalist id="cl">${CNAMES.map(n=>`<option>${n}</option>`).join('')}</datalist>
  <div class="f2"><div class="fld"><small>УСЛУГА</small><select id="apSrv">${SERV.map(s=>`<option value="${s.id}">${s.n} · ${fmt(s.price)} ₸ · ${s.dur} ч</option>`).join('')}</select></div>
   <div class="fld"><small>МАСТЕР</small><select id="apMaster">${MASTERS.filter(m=>m.br===brF&&m.role==='Мастер').map(m=>`<option>${m.n}</option>`).join('')}</select></div></div>
  <div class="f3"><div class="fld"><small>ФИЛИАЛ</small><select id="apBr">${BRANCH.map(x=>`<option value="${x.id}" ${x.id===brF?'selected':''}>${x.name}</option>`).join('')}</select></div>
   <div class="fld"><small>КАБИНЕТ</small><select id="apRoom">${b.rooms.map((r,i)=>`<option value="${i}" ${i===room?'selected':''}>${r}</option>`).join('')}</select></div>
   <div class="fld"><small>ВРЕМЯ</small><select id="apHour">${HOURS.map((h,i)=>`<option value="${i}" ${i===hour?'selected':''}>${h}</option>`).join('')}</select></div></div>
  <div class="fld"><small>КУРС</small><select id="apCourse"><option value="1">Разовая процедура</option><option value="6">Курс 6 процедур</option><option value="10" selected>Курс 10 процедур</option></select></div>
  <div class="note" style="--tone:var(--gold)"><b>После сохранения</b><p>Запись появится в расписании, клиенту уйдёт подтверждение в WhatsApp, а за сутки до визита — напоминание. Мастер увидит запись в своём расписании.</p></div>
  <div class="btns" style="margin-top:12px"><button class="btn gold" onclick="saveAppt()">Записать</button><button class="btn" onclick="closeD()">Отмена</button></div>`)}
function saveAppt(){const n=document.getElementById('apName').value.trim();if(!n)return toast('Укажите клиента.');
 const srv=document.getElementById('apSrv').value,s=srvOf(srv);
 APPTS.push({br:document.getElementById('apBr').value,room:+document.getElementById('apRoom').value,h:+document.getElementById('apHour').value,
  dur:s.dur,srv,cl:n,master:document.getElementById('apMaster').value,st:'new',course:1,courseAll:+document.getElementById('apCourse').value,paid:0});
 closeD();render();sparks();
 toast(`<b>${esc(n)}</b> записана на ${s.n}. Подтверждение ушло в WhatsApp, напоминание придёт за сутки.`)}

/* ---- КЛИЕНТЫ ---- */
SC.clients=()=>{
 const map={};APPTS.forEach(a=>{(map[a.cl]=map[a.cl]||[]).push(a)});
 const q=(document.getElementById('cq')?.value||'').toLowerCase();
 return `<div class="head"><div><h2>Клиенты</h2><p>Карточка клиента вместо строки в таблице: курс процедур с прогрессом, история визитов и оплат, фото до и после, абонемент и вся переписка.</p></div>
 <div class="btns"><button class="btn" onclick="toast('База клиентов выгружена в Excel.')">Экспорт</button><button class="btn gold" onclick="newAppt()">+ Записать</button></div></div>
 <div class="strip">
  <div><small>КЛИЕНТОВ В БАЗЕ</small><b>642</b><span>активных за 90 дней — 268</span></div>
  <div><small>НА КУРСЕ СЕЙЧАС</small><b>84</b><span>средний прогресс 5 из 10</span></div>
  <div><small>ВОЗВРАЩАЮТСЯ</small><b>76%</b><span class="good">после первого визита</span></div>
  <div><small>СРЕДНИЙ LTV</small><b>187 000 ₸</b><span>за всё время</span></div>
  <div><small>ДНЕЙ ДО ВОЗВРАТА</small><b>9</b><span>средний интервал визитов</span></div>
 </div>
 <div class="filters"><input class="search" id="cq" placeholder="Имя, телефон, услуга…" oninput="render()"><button class="filter on">Все</button><button class="filter" onclick="toast('Фильтр: клиенты, которые не дошли до конца курса — 7 человек.')">Бросили курс</button><button class="filter" onclick="toast('Фильтр: не были дольше 60 дней — 42 клиента.')">Давно не были</button></div>
 <div class="panel"><div class="tw"><table class="data" style="min-width:700px"><thead><tr><th>Клиент</th><th>Услуга</th><th>Курс</th><th>Мастер</th><th>Филиал</th><th class="right">Оплачено</th><th>Состояние</th></tr></thead><tbody>
 ${Object.entries(map).filter(([n])=>n.toLowerCase().includes(q)).slice(0,30).map(([n,as])=>{const a=as[0],s=srvOf(a.srv);
  return `<tr onclick="clientCard('${esc(n)}')"><td><b>${esc(n)}</b><div class="sub">+7 70${Math.floor(rnd()*9)} ${Math.floor(100+rnd()*899)} ${Math.floor(10+rnd()*89)} ${Math.floor(10+rnd()*89)}</div></td>
  <td>${esc(s.n)}</td><td><div class="bar" style="width:70px"><i style="--w:${a.course/a.courseAll*100}%;--tone:var(--gold)"></i></div><div class="sub">${a.course} из ${a.courseAll}</div></td>
  <td>${a.master}</td><td class="mini">${BRANCH.find(b=>b.id===a.br).name}</td><td class="right mono"><b>${fmt(s.price*a.course)} ₸</b></td>
  <td><span class="tag ${a.st==='done'?'green':a.st==='new'?'rose':'violet'}">${a.st==='done'?'был сегодня':a.st==='new'?'новый':'записан'}</span></td></tr>`}).join('')}
 </tbody></table></div></div>`};
function clientCard(n){const as=APPTS.filter(a=>a.cl===n);const a=as[0]||{course:3,courseAll:10,srv:'lpg',master:'Айгуль'};const s=srvOf(a.srv);
 openD(n,`Клиент центра · курс ${a.course} из ${a.courseAll} · мастер ${a.master}`,['Карточка','Курс и визиты','Оплаты','Переписка'],
 `<div class="dg"><div class="det"><small>ТЕЛЕФОН</small><b>+7 701 ${Math.floor(100+rnd()*899)} ${Math.floor(10+rnd()*89)} ${Math.floor(10+rnd()*89)}</b></div>
  <div class="det"><small>С НАМИ</small><b>с апреля 2026</b></div>
  <div class="det"><small>ОПЛАЧЕНО ВСЕГО</small><b>${fmt(s.price*a.course+38000)} ₸</b></div>
  <div class="det"><small>ИСТОЧНИК</small><b>Instagram · реклама</b></div></div>
  <div class="ph-title" style="margin:11px 0 7px;font-size:12px">Курс процедур</div>
  <div class="bar" style="height:12px"><i style="--w:${a.course/a.courseAll*100}%;--tone:var(--gold)"></i></div>
  <div class="mini" style="margin-top:6px">Пройдено ${a.course} из ${a.courseAll} процедур ${esc(s.n)}. Следующий визит — через 3 дня, напоминание уйдёт автоматически.</div>
  <div class="ph-title" style="margin:13px 0 7px;font-size:12px">История</div>
  <div class="tl">
   <div class="tli"><b>Процедура ${a.course} из ${a.courseAll}</b><p>${esc(s.n)} · мастер ${a.master} · оплачено ${fmt(s.price)} ₸</p><time>сегодня</time></div>
   <div class="tli"><b>Покупка средства для дома</b><p>Антицеллюлитный крем 200 мл · 12 000 ₸</p><time>3 дня назад</time></div>
   <div class="tli"><b>Замеры и фото</b><p>Объём талии −4 см за курс, фото до и после в карточке</p><time>неделю назад</time></div>
   <div class="tli"><b>Первый визит и диагностика</b><p>Составлен курс на ${a.courseAll} процедур, оплачен целиком со скидкой 10%</p><time>апрель 2026</time></div>
  </div>
  <div class="btns" style="margin-top:12px"><button class="btn" onclick="toast('Сообщение отправлено клиенту в WhatsApp.')">Написать</button><button class="btn" onclick="closeD();newAppt()">Записать</button><button class="btn" onclick="toast('Абонемент продлён, клиенту отправлена ссылка на оплату Kaspi.')">Продлить курс</button></div>`)}

/* ---- ЗАЯВКИ ---- */
SC.leads=()=>`
 <div class="head"><div><h2>Заявки</h2><p>Реклама Instagram и WhatsApp приводят обращения — они попадают в воронку с источником и таймером ответа. Этого в Altegio нет, а именно здесь теряются деньги.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Все новые заявки распределены между администраторами.')">Распределить</button><button class="btn gold" onclick="toast('Заявка создана вручную.')">+ Заявка</button></div></div>
 <div class="strip">
  <div><small>ЗАЯВОК В МЕСЯЦ</small><b>168</b><span>Instagram 44% · рекомендации 26%</span></div>
  <div><small>БЕЗ ОТВЕТА</small><b class="bad">2</b><span>дольше 15 минут</span></div>
  <div><small>СРЕДНИЙ ОТВЕТ</small><b>12 мин</b><span class="good">норма до 15</span></div>
  <div><small>ДОХОДЯТ ДО ВИЗИТА</small><b>41%</b><span>69 первых визитов</span></div>
  <div><small>СТОИМОСТЬ ЗАЯВКИ</small><b>3 400 ₸</b><span>из рекламы</span></div>
 </div>
 <div class="g2">
  ${LST.map((st,i)=>`<div class="panel"><div class="ph"><div><div class="ph-title">${st}</div><div class="ph-sub">${LEADS.filter(l=>l.st===i).length} заявок</div></div></div>
   ${LEADS.filter(l=>l.st===i).map(l=>`<div style="border:1px solid var(--line);background:#fff;padding:11px;margin-bottom:7px;border-radius:5px;cursor:pointer" onclick="leadCard(${LEADS.indexOf(l)})">
    <div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:10.4px">${esc(l.n)}</b><span class="tag ${l.ch==='Instagram'?'rose':l.ch==='WhatsApp'?'green':l.ch==='Сайт'?'blue':''}">${l.ch}</span></div>
    <div class="mini" style="margin-top:5px">${esc(l.need)}</div><div class="sub" style="margin-top:4px">${esc(l.note)} · ${l.t}</div></div>`).join('')||'<p class="mini">Пусто</p>'}
  </div>`).join('')}
 </div>
 <div class="panel"><div class="ph-title">Почему это важнее, чем кажется</div>
  <div class="cmp" style="margin-top:9px">
   <div class="was"><h4>КАК СЕЙЧАС</h4>
    <div class="row">Заявка приходит в Direct или WhatsApp администратору на телефон</div>
    <div class="row">Ответила — хорошо, не заметила — клиент ушёл к конкуренту</div>
    <div class="row">Непонятно, сколько заявок дала реклама и во сколько обошёлся клиент</div>
    <div class="row">Altegio видит только тех, кто уже записался</div>
   </div>
   <div class="now"><h4>В СИСТЕМЕ</h4>
    <div class="row">Заявка создаётся автоматически с источником и таймером</div>
    <div class="row">Не ответили за 15 минут — руководитель видит это на пульте</div>
    <div class="row">Видно конверсию по каждому источнику и стоимость клиента</div>
    <div class="row">Вся дорога от рекламы до курса процедур в одном месте</div>
   </div>
  </div>
 </div>`;
function leadCard(i){const l=LEADS[i];
 openD(l.n,`${l.ch} · ${l.t} · ${LST[l.st]}`,['Заявка'],
 `<div class="dg"><div class="det"><small>КАНАЛ</small><b>${l.ch}</b></div><div class="det"><small>ЗАПРОС</small><b>${esc(l.need)}</b></div>
  <div class="det"><small>СТАДИЯ</small><b>${LST[l.st]}</b></div><div class="det"><small>ОТВЕТ</small><b class="${l.st===0?'bad':'good'}">${l.st===0?'ещё не ответили':'в работе'}</b></div></div>
  <div class="note" style="--tone:var(--gold)"><b>Комментарий</b><p>${esc(l.note)}</p></div>
  <div class="note" style="--tone:var(--rose2)"><b>Что предложить</b><p>Первый шаг — бесплатная диагностика и составление курса. По статистике центра 41% пришедших на диагностику покупают курс от шести процедур.</p></div>
  <div class="btns" style="margin-top:12px"><button class="btn" onclick="toast('Ответ отправлен клиенту в ${l.ch}.')">Ответить</button><button class="btn gold" onclick="closeD();newAppt()">Записать на диагностику</button></div>`)}

/* ---- ОНЛАЙН-ЗАПИСЬ ---- */
let bkStep=0,bkSrv=null,bkSlot=null;
SC.booking=()=>`
 <div class="head"><div><h2>Онлайн-запись</h2><p>Клиент переходит по ссылке из Instagram или WhatsApp, выбирает услугу, мастера и время — запись сразу появляется в расписании. Без приложения и без регистрации.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Ссылка на онлайн-запись скопирована: zapis.kazanina.kz')">Скопировать ссылку</button><button class="btn" onclick="toast('QR-код сохранён — можно поставить на ресепшн и в шапку профиля.')">QR для профиля</button></div></div>
 <div class="g2">
  <div class="panel" style="display:grid;place-items:center;padding:20px">
   <div class="phone"><div class="phone-screen">
    <div class="phone-top"><span>09:41</span><span>ЗАПИСЬ</span></div>
    <div class="bk-head"><div class="kmark"><span>ИЦ</span></div><b>Инновационный центр</b><small>Аллы Казаниной · онлайн-запись</small></div>
    <div class="bk-body">
     ${bkStep===0?`<div class="bk-step"><h4>1. Выберите услугу</h4>
      ${SERV.slice(0,5).map(s=>`<div class="bk-opt ${bkSrv===s.id?'on':''}" onclick="bkSrv='${s.id}';render()"><div><b>${s.n}</b><small>${s.dur} ч · ${fmt(s.price)} ₸</small></div><span class="tag gold">выбрать</span></div>`).join('')}</div>
      <button class="bk-btn" ${bkSrv?'':'style="opacity:.45"'} onclick="${bkSrv?'bkStep=1;render()':"toast('Сначала выберите услугу.')"}">Далее</button>`
     :bkStep===1?`<div class="bk-step"><h4>2. Филиал и мастер</h4>
      <div class="bk-opt on"><div><b>Ак-Сай</b><small>ул. Ак-Сай, 12 · сегодня свободно 4 окна</small></div></div>
      <div class="bk-opt"><div><b>Аль-Фараби</b><small>пр. Аль-Фараби, 88 · сегодня свободно 6 окон</small></div></div>
      <div style="height:8px"></div><h4>Мастер</h4>
      <div class="bk-opt on"><div><b>Любой свободный</b><small>ближайшее время</small></div></div>
      <div class="bk-opt"><div><b>Айгуль</b><small>ваш мастер по прошлым визитам</small></div></div></div>
      <div class="bk-step"><h4>3. Время · 22 августа</h4>
      <div class="bk-slots">${['10:00','11:00','13:00','15:00','16:00','18:00'].map(t=>`<div class="bk-slot ${bkSlot===t?'on':''}" onclick="bkSlot='${t}';render()">${t}</div>`).join('')}</div></div>
      <button class="bk-btn" ${bkSlot?'':'style="opacity:.45"'} onclick="${bkSlot?'bkDone()':"toast('Выберите время.')"}">Записаться</button>`
     :`<div class="bk-ok"><div class="ico">✓</div><b style="font-size:13px;display:block">Вы записаны</b>
       <p class="mini" style="margin-top:8px">${srvOf(bkSrv)?.n||'Процедура'} · 22 августа в ${bkSlot}<br>Ак-Сай, ул. Ак-Сай, 12</p>
       <div class="note" style="--tone:var(--green);text-align:left;margin-top:12px"><b>Что дальше</b><p>Подтверждение придёт в WhatsApp. За сутки до визита — напоминание. Перенести можно по той же ссылке.</p></div>
       <button class="bk-btn" style="margin-top:12px" onclick="bkStep=0;bkSrv=null;bkSlot=null;render()">Записаться ещё раз</button></div>`}
    </div>
   </div></div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Что даёт онлайн-запись</div>
    ${[['Запись без администратора','Клиент записывается сам в любое время, в том числе ночью и в выходные. Администратор не тратит время на переписку «а когда есть окно».'],
       ['Меньше пустых окон','Свободные слоты видны клиенту сразу. Освободилось окно из-за переноса — его тут же может занять другой человек.'],
       ['Меньше неявок','Подтверждение и напоминание уходят автоматически в WhatsApp. Перенос доступен по ссылке, а не звонком в последний момент.'],
       ['Ссылка везде','Шапка профиля в Instagram, сообщение в WhatsApp, QR-код на ресепшене — везде одна и та же ссылка, ведущая в ваше расписание.']]
     .map(x=>`<div class="note" style="--tone:var(--gold)"><b>${x[0]}</b><p>${x[1]}</p></div>`).join('')}
   </div>
   <div class="panel" style="margin-top:10px"><div class="ph-title">Правила записи настраиваете вы</div>
    <div class="mini" style="margin-top:8px">За сколько часов можно записаться и отменить, нужен ли предоплатный депозит на дорогие процедуры, какие услуги вообще показывать онлайн, можно ли выбирать конкретного мастера. Всё это в настройках, без обращения к разработчику.</div>
    <div class="kpi-mini"><div style="--tone:var(--green)"><small>ЗАПИСЕЙ ОНЛАЙН</small><b>34%</b></div><div style="--tone:var(--rose2)"><small>НЕЯВКИ</small><b>−41%</b></div></div>
   </div>
  </div>
 </div>`;
function bkDone(){bkStep=2;const s=srvOf(bkSrv);
 APPTS.push({br:'aks',room:0,h:HOURS.indexOf(bkSlot)>=0?HOURS.indexOf(bkSlot):5,dur:s.dur,srv:bkSrv,cl:'Новый клиент · онлайн',master:'Айгуль',st:'new',course:1,courseAll:10,paid:0});
 render();sparks();
 toast(`Клиент записался сам через ссылку: <b>${s.n}</b>, 22 августа в ${bkSlot}. Запись уже в расписании, администратор не участвовал.`)}

/* ---- ПРОДАЖИ И КАССА ---- */
SC.sales=()=>{const today=PAYS.reduce((a,p)=>a+p.sum,0);
 return `<div class="head"><div><h2>Продажи и касса</h2><p>Услуги, курсы, абонементы и товары в одной кассе. Оплата закрывает визит, начисляет процент мастеру и списывает расходники.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Смена закрыта: сверка кассы, отчёт отправлен владельцу.')">Закрыть смену</button><button class="btn gold" onclick="sellCourse()">+ Продать курс</button></div></div>
 <div class="strip">
  <div><small>КАССА СЕГОДНЯ</small><b>${mln(today)}</b><span>${PAYS.length} операций</span></div>
  <div><small>KASPI</small><b>${mln(PAYS.filter(p=>p.pay==='Kaspi').reduce((a,p)=>a+p.sum,0))}</b><span>${Math.round(PAYS.filter(p=>p.pay==='Kaspi').length/PAYS.length*100)}% оплат</span></div>
  <div><small>КАРТА И НАЛИЧНЫЕ</small><b>${mln(PAYS.filter(p=>p.pay!=='Kaspi').reduce((a,p)=>a+p.sum,0))}</b><span>сверяется при закрытии смены</span></div>
  <div><small>ПРОДАНО КУРСОВ</small><b>2</b><span>на 280 800 ₸</span></div>
  <div><small>ТОВАРЫ</small><b>12 000 ₸</b><span>средство для дома</span></div>
 </div>
 <div class="g12">
  <div class="panel"><div class="ph-title">Абонементы и курсы</div>
   ${[['Курс LPG · 10 процедур',162000,180000,'скидка 10%'],['Курс RF · 6 процедур',118800,132000,'скидка 10%'],['Криолиполиз · 4 зоны',162000,180000,'скидка 10%'],['Разовая процедура','—','по прайсу','без скидки']]
     .map(x=>`<div style="padding:10px 0;border-bottom:1px solid #efe9ea"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:10.4px">${x[0]}</b><b class="mono" style="font-size:10.4px">${typeof x[1]==='number'?fmt(x[1])+' ₸':x[1]}</b></div>
      <div class="sub">${typeof x[2]==='number'?'вместо '+fmt(x[2])+' ₸ · ':''}${x[3]}</div></div>`).join('')}
   <div class="hint"><b>Почему курсы важнее разовых:</b> клиент с курсом приходит 10 раз и приносит 162 000 ₸ вместо 18 000. Система сама показывает, у кого курс заканчивается, и напоминает продлить.</div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Операции за сегодня</div><div class="ph-sub">каждая строка привязана к визиту, мастеру и филиалу</div></div><span class="tag green">live</span></div>
   <div class="tw"><table class="data" style="min-width:560px"><thead><tr><th>Время</th><th>Клиент</th><th>За что</th><th>Мастер</th><th>Филиал</th><th>Оплата</th><th class="right">Сумма</th></tr></thead><tbody>
   ${PAYS.map(p=>`<tr onclick="toast('Операция открыта: чек, визит, мастер и списанные расходники.')"><td class="mono">${p.t}</td><td><b>${esc(p.cl)}</b></td><td class="mini">${esc(p.what)}</td><td>${p.master}</td><td class="mini">${p.br}</td>
    <td><span class="tag ${p.pay==='Kaspi'?'red':p.pay==='Карта'?'blue':'green'}">${p.pay}</span></td><td class="right mono"><b>${fmt(p.sum)} ₸</b></td></tr>`).join('')}
   </tbody></table></div>
   <div class="hint"><b>Одно действие вместо трёх:</b> сейчас оплата отмечается в Altegio, процент мастера считается отдельно, расходники — вообще на бумаге. Здесь всё это происходит в момент закрытия визита.</div>
  </div>
 </div>`};
function sellCourse(){openD('Продажа курса','Курс, скидка и способ оплаты',['Продажа'],
 `<div class="f2"><div class="fld"><small>КЛИЕНТ</small><input placeholder="Имя клиента" value="Айгерим Сакенова"></div>
  <div class="fld"><small>КУРС</small><select><option>LPG-массаж · 10 процедур · 162 000 ₸</option><option>RF-лифтинг · 6 процедур · 118 800 ₸</option><option>Криолиполиз · 4 зоны · 162 000 ₸</option></select></div></div>
  <div class="f3"><div class="fld"><small>СКИДКА</small><select><option>10% за курс</option><option>15% по рекомендации</option><option>Без скидки</option></select></div>
   <div class="fld"><small>ОПЛАТА</small><select><option>Kaspi</option><option>Карта</option><option>Наличные</option><option>Рассрочка Kaspi</option></select></div>
   <div class="fld"><small>МАСТЕР</small><select>${MASTERS.filter(m=>m.role==='Мастер').map(m=>`<option>${m.n}</option>`).join('')}</select></div></div>
  <div class="note" style="--tone:var(--green)"><b>Что произойдёт</b><p>Курс появится в карточке клиента с прогрессом 0 из 10, деньги попадут в кассу, мастеру начислится процент, а клиенту уйдёт сообщение с датой первой процедуры.</p></div>
  <div class="btns" style="margin-top:12px"><button class="btn gold" onclick="closeD();sparks();toast('Курс продан: <b>162 000 ₸</b> в кассу, прогресс курса заведён, клиенту отправлено подтверждение.')">Провести продажу</button><button class="btn" onclick="closeD()">Отмена</button></div>`)}

/* ---- ФИНАНСЫ ---- */
SC.fin=()=>`
 <div class="head"><div><h2>Финансы и отчёты</h2><p>Тот самый финансовый отчёт, ради которого вы держите Altegio: выручка, средний чек, возвраты клиентов, прибыль по филиалам и вклад каждого мастера.</p></div>
 <div class="btns"><button class="btn">Август 2026</button><button class="btn" onclick="toast('Отчёт выгружен в Excel и PDF.')">Экспорт</button><button class="btn gold" onclick="toast('Отчёт будет приходить вам в WhatsApp каждый понедельник в 9:00.')">Присылать еженедельно</button></div></div>
 <div class="strip">
  <div><small>ВЫРУЧКА · АВГУСТ</small><b>9,4 млн ₸</b><span class="good">▲ 18% к июлю</span></div>
  <div><small>РАСХОДЫ</small><b>5,1 млн ₸</b><span>зарплаты 3,2 · аренда 1,1 · прочее 0,8</span></div>
  <div><small>ПРИБЫЛЬ</small><b class="good">4,3 млн ₸</b><span>маржа 46%</span></div>
  <div><small>СРЕДНИЙ ЧЕК</small><b>34 200 ₸</b><span>по курсам 41 800 ₸</span></div>
  <div><small>ВОЗВРАТ КЛИЕНТОВ</small><b>76%</b><span class="good">цель 70%</span></div>
 </div>
 <div class="g2">
  <div class="panel"><div class="ph"><div><div class="ph-title">Филиалы</div><div class="ph-sub">выручка, расходы и прибыль по каждому</div></div></div>
   <div class="tw"><table class="data" style="min-width:520px"><thead><tr><th>Филиал</th><th class="right">Выручка</th><th class="right">Зарплаты</th><th class="right">Прочее</th><th class="right">Прибыль</th><th>Маржа</th></tr></thead><tbody>
   ${[['Ак-Сай',5240000,1780000,1050000],['Аль-Фараби',4160000,1420000,850000]].map(r=>{const pr=r[1]-r[2]-r[3],m=pr/r[1]*100;
    return `<tr onclick="toast('${r[0]}: разложение по услугам, мастерам и дням недели.')"><td><b>${r[0]}</b></td><td class="right mono">${fmt(r[1])}</td><td class="right mono muted">${fmt(r[2])}</td><td class="right mono muted">${fmt(r[3])}</td><td class="right mono"><b>${fmt(pr)}</b></td><td><span class="tag ${m>45?'green':'gold'}">${m.toFixed(0)}%</span></td></tr>`}).join('')}
   </tbody></table></div>
   <div class="hint"><b>Что видно сразу:</b> Ак-Сай приносит больше, но и зарплатный фонд там выше. Маржа по филиалам почти одинаковая — значит, дело в загрузке, а не в ценах.</div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Вклад мастеров в выручку</div><div class="ph-sub">факт против плана за месяц</div></div></div>
   ${MASTERS.filter(m=>m.role==='Мастер').map(m=>`<div style="margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;font-size:10px"><b>${m.n}</b><span class="mono">${fmt(m.fact)} / ${fmt(m.plan)} ₸</span></div>
    <div class="bar" style="margin-top:4px"><i style="--w:${Math.min(100,m.fact/m.plan*100)}%;--tone:${m.fact>=m.plan?'var(--green)':'var(--gold)'}"></i></div>
    <div class="mini" style="margin-top:3px">${m.visits} визитов · возврат клиентов ${m.ret}% · ${Math.round(m.fact/m.plan*100)}% плана</div></div>`).join('')}
   <div class="hint"><b>Возврат клиентов — главный показатель мастера:</b> у Айгуль 82%, у Жанны 68%. Разница в 14 пунктов на дистанции стоит центру около 900 000 ₸ в год.</div>
  </div>
 </div>
 <div class="panel"><div class="ph-title">Что было в Altegio и что стало</div>
  <div class="cmp" style="margin-top:9px">
   <div class="was"><h4>ALTEGIO</h4>
    <div class="row">Финансовый отчёт есть, но по своей логике</div>
    <div class="row">Зарплаты считаются по правилам сервиса</div>
    <div class="row">Ежемесячная подписка за каждого сотрудника</div>
    <div class="row">Нет воронки заявок из Instagram и WhatsApp</div>
    <div class="row">Данные лежат у сервиса, выгрузка ограничена</div>
    <div class="row">Доработать под себя нельзя</div>
   </div>
   <div class="now"><h4>ВАША СИСТЕМА</h4>
    <div class="row">Отчёты в вашей логике, включая маржу по филиалам</div>
    <div class="row">Схемы оплаты труда любые: процент, оклад, KPI, бонусы</div>
    <div class="row">Оплата один раз, дальше пользование бесплатно</div>
    <div class="row">Вся дорога от рекламы до курса в одном месте</div>
    <div class="row">База ваша, на вашем сервере, выгрузка в любой момент</div>
    <div class="row">Любая доработка под ваш процесс</div>
   </div>
  </div>
 </div>`;

/* ---- СОТРУДНИКИ ---- */
SC.staff=()=>`
 <div class="head"><div><h2>Сотрудники и зарплаты</h2><p>Кто продал, кто провёл процедуру, кто получил свой процент — считается автоматически. Именно этим вам сейчас нравится Altegio, и это мы переносим целиком.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Расчётные листы отправлены сотрудникам в WhatsApp.')">Расчётные листы</button><button class="btn gold" onclick="payroll()">⚡ Рассчитать зарплату за месяц</button></div></div>
 <div class="strip">
  <div><small>ФОНД ОПЛАТЫ · АВГУСТ</small><b>3,2 млн ₸</b><span>34% от выручки</span></div>
  <div><small>СОТРУДНИКОВ</small><b>${MASTERS.length}</b><span>4 мастера · 2 администратора</span></div>
  <div><small>СРЕДНИЙ ПРОЦЕНТ</small><b>25%</b><span>от услуги мастера</span></div>
  <div><small>ВЫПОЛНИЛИ ПЛАН</small><b>2 из 4</b><span>мастеров</span></div>
  <div><small>РАСЧЁТ ЗАНИМАЕТ</small><b>1 минуту</b><span class="good">вместо вечера с калькулятором</span></div>
 </div>
 <div class="panel"><div class="ph"><div><div class="ph-title">Расчёт по сотрудникам</div><div class="ph-sub">выручка, процент, KPI и итог к выплате — нажмите на строку</div></div><span class="tag gold">август</span></div>
  <div class="tw"><table class="data" style="min-width:720px"><thead><tr><th>Сотрудник</th><th>Роль</th><th>Филиал</th><th class="right">Принёс выручки</th><th class="right">План</th><th class="right">Процент</th><th class="right">KPI / бонус</th><th class="right">К выплате</th></tr></thead><tbody>
  ${MASTERS.map(m=>{const base=m.fact*m.pct/100;const bonus=m.fact>=m.plan?(m.role==='Мастер'?40000:30000):0;
   return `<tr onclick="staffCard('${m.id}')"><td><b>${m.n}</b><div class="sub">возврат клиентов ${m.ret||'—'}${m.ret?'%':''}</div></td><td><span class="tag ${m.role==='Мастер'?'violet':'blue'}">${m.role}</span></td>
   <td class="mini">${BRANCH.find(b=>b.id===m.br).name}</td><td class="right mono">${fmt(m.fact)}</td><td class="right mono muted">${fmt(m.plan)}</td>
   <td class="right mono">${m.pct}% · ${fmt(base)}</td><td class="right mono ${bonus?'good':'muted'}">${bonus?'+'+fmt(bonus):'—'}</td>
   <td class="right mono"><b>${fmt(base+bonus)} ₸</b></td></tr>`}).join('')}
  <tr style="background:#faf7f6;cursor:default"><td><b>Итого</b></td><td colspan="6"></td><td class="right mono"><b>${fmt(MASTERS.reduce((a,m)=>a+m.fact*m.pct/100+(m.fact>=m.plan?(m.role==='Мастер'?40000:30000):0),0))} ₸</b></td></tr>
  </tbody></table></div>
  <div class="hint"><b>Схема оплаты настраивается под вас:</b> процент от услуги, разный процент по разным процедурам, оклад плюс процент, бонус за выполнение плана, KPI администратора за продажи курсов и за возврат клиентов. Всё это правила в настройках, а не переписывание кода.</div>
 </div>
 <div class="g2">
  <div class="panel"><div class="ph-title">KPI администраторов</div>
   ${MASTERS.filter(m=>m.role==='Администратор').map(m=>`<div style="padding:11px 0;border-bottom:1px solid #efe9ea">
    <div style="display:flex;justify-content:space-between"><b style="font-size:10.6px">${m.n}</b><span class="mono" style="font-size:10px">${fmt(m.fact)} / ${fmt(m.plan)} ₸</span></div>
    <div class="bar" style="margin-top:5px"><i style="--w:${Math.min(100,m.fact/m.plan*100)}%;--tone:${m.fact>=m.plan?'var(--green)':'var(--gold)'}"></i></div>
    <div class="mini" style="margin-top:4px">Продажи курсов через администратора · ${Math.round(m.fact/m.plan*100)}% плана · процент ${m.pct}%</div></div>`).join('')}
   <div class="hint"><b>За что платим администратору:</b> не за смены, а за проданные курсы и записанных клиентов. Система считает это сама из кассы и расписания.</div>
  </div>
  <div class="panel"><div class="ph-title">Доступы сотрудников</div>
   ${[['Владелец','всё: финансы, зарплаты, настройки, оба филиала'],['Управляющий','всё кроме настроек зарплатных схем'],['Администратор','свой филиал: запись, клиенты, касса, склад'],['Мастер','только своё расписание и свои клиенты'],['Бухгалтер','выгрузки по кассе и зарплатам']]
     .map(x=>`<div style="display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-bottom:1px solid #efe9ea"><b style="font-size:10px;width:104px">${x[0]}</b><span class="mini" style="flex:1">${x[1]}</span></div>`).join('')}
   <div class="hint"><b>До 50 учётных записей включено.</b> Вы просили до пяти — запас нужен на случай роста и на отдельные доступы для мастеров, которые сейчас работают без своего входа.</div>
  </div>
 </div>`;
function staffCard(id){const m=MASTERS.find(x=>x.id===id);const base=m.fact*m.pct/100,bonus=m.fact>=m.plan?(m.role==='Мастер'?40000:30000):0;
 openD(m.n,`${m.role} · ${BRANCH.find(b=>b.id===m.br).name} · август 2026`,['Расчёт'],
 `<div class="dg"><div class="det"><small>ПРИНЁС ВЫРУЧКИ</small><b>${fmt(m.fact)} ₸</b></div><div class="det"><small>ПЛАН</small><b>${fmt(m.plan)} ₸</b></div>
  <div class="det"><small>ПРОЦЕНТ</small><b>${m.pct}% · ${fmt(base)} ₸</b></div><div class="det"><small>БОНУС</small><b class="${bonus?'good':''}">${bonus?fmt(bonus)+' ₸':'план не выполнен'}</b></div></div>
  <div class="bar" style="height:11px"><i style="--w:${Math.min(100,m.fact/m.plan*100)}%;--tone:${m.fact>=m.plan?'var(--green)':'var(--gold)'}"></i></div>
  <div class="mini" style="margin-top:5px">${Math.round(m.fact/m.plan*100)}% плана${m.visits?' · '+m.visits+' визитов · возврат клиентов '+m.ret+'%':''}</div>
  <div class="ph-title" style="margin:13px 0 7px;font-size:12px">Из чего складывается</div>
  ${[['Услуги по прайсу',fmt(m.fact)+' ₸'],[`Процент ${m.pct}%`,fmt(base)+' ₸'],['Бонус за план',bonus?fmt(bonus)+' ₸':'—'],['Итого к выплате',fmt(base+bonus)+' ₸']]
   .map((x,i)=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #efe9ea;font-size:10px;${i===3?'font-weight:800;border-bottom:0;padding-top:11px':''}"><span>${x[0]}</span><b class="mono">${x[1]}</b></div>`).join('')}
  <div class="btns" style="margin-top:12px"><button class="btn" onclick="toast('Расчётный лист отправлен сотруднику в WhatsApp.')">Отправить расчётный лист</button><button class="btn" onclick="toast('История начислений за 6 месяцев открыта.')">История</button></div>`)}
function payroll(){sparks();toast(`Зарплата рассчитана: <b>${fmt(MASTERS.reduce((a,m)=>a+m.fact*m.pct/100+(m.fact>=m.plan?(m.role==='Мастер'?40000:30000):0),0))} ₸</b> по шести сотрудникам. Расчётные листы готовы к отправке.`)}

/* ---- СКЛАД ---- */
SC.stock=()=>`
 <div class="head"><div><h2>Склад и материалы</h2><p>Расходники списываются автоматически при закрытии визита, товары на продажу учитываются в кассе. Видно, что заканчивается, до того как оно закончилось.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Приход оформлен: позиции добавлены на склад.')">+ Приход</button><button class="btn gold" onclick="toast('Заказ поставщику сформирован по позициям, которых осталось меньше нормы.')">Заказать у поставщика</button></div></div>
 <div class="strip">
  <div><small>СТОИМОСТЬ СКЛАДА</small><b>${mln(GOODS.reduce((a,g)=>a+g.qty*g.cost,0))}</b><span>${GOODS.length} позиций</span></div>
  <div><small>ТОВАРЫ НА ПРОДАЖУ</small><b>${GOODS.filter(g=>g.type==='Товар').reduce((a,g)=>a+g.qty,0)}</b><span>продано за месяц 34</span></div>
  <div><small>ЗАКАНЧИВАЕТСЯ</small><b class="bad">2</b><span>гель и крем</span></div>
  <div><small>СПИСАНО ЗА МЕСЯЦ</small><b>412 000 ₸</b><span>расходники по процедурам</span></div>
  <div><small>МАРЖА НА ТОВАРАХ</small><b>57%</b><span>средства для дома</span></div>
 </div>
 <div class="panel"><div class="tw"><table class="data" style="min-width:640px"><thead><tr><th>Позиция</th><th>Тип</th><th class="right">Остаток</th><th class="right">Себестоимость</th><th class="right">Цена продажи</th><th>Состояние</th></tr></thead><tbody>
 ${GOODS.map(g=>`<tr onclick="toast('${esc(g.n)}: движение, списания по процедурам и продажи.')"><td><b>${esc(g.n)}</b></td><td><span class="tag ${g.type==='Товар'?'gold':'violet'}">${g.type}</span></td>
  <td class="right mono ${g.qty<12?'bad':''}"><b>${g.qty}</b></td><td class="right mono muted">${fmt(g.cost)} ₸</td><td class="right mono">${g.price?fmt(g.price)+' ₸':'—'}</td>
  <td><span class="tag ${g.qty<12?'red':'green'}">${g.qty<12?'пора заказать':'в норме'}</span></td></tr>`).join('')}
 </tbody></table></div>
 <div class="hint"><b>Связь с процедурами:</b> за каждой услугой закреплены расходники и их количество. Провели LPG — списался гель и одноразовое бельё. В конце месяца вы видите реальную себестоимость процедуры, а не примерную.</div></div>`;

/* ---- НАСТРОЙКИ ---- */
SC.settings=()=>`
 <div class="head"><div><h2>Настройки и связи</h2><p>Услуги и цены, филиалы и кабинеты, схемы оплаты труда, правила онлайн-записи и подключение каналов — всё меняете вы, без разработчика.</p></div>
 <div class="btns"><button class="btn dark" onclick="toast('Диагностика: WhatsApp активен, Instagram активен, телефония не подключена, Kaspi активен.')">Проверить связи</button></div></div>
 <div class="g2">
  <div class="panel"><div class="ph"><div><div class="ph-title">Услуги и цены</div><div class="ph-sub">длительность, цена, себестоимость и расходники</div></div><button class="btn" onclick="toast('Новая услуга добавлена в прайс и в онлайн-запись.')">+ Услуга</button></div>
   <div class="tw"><table class="data" style="min-width:480px"><thead><tr><th>Услуга</th><th class="right">Время</th><th class="right">Цена</th><th class="right">Расходники</th></tr></thead><tbody>
   ${SERV.map(s=>`<tr onclick="toast('${esc(s.n)}: цена, длительность, мастера и списываемые материалы.')"><td><b>${esc(s.n)}</b><div class="sub">${s.cat}</div></td><td class="right mono">${s.dur} ч</td><td class="right mono"><b>${s.price?fmt(s.price)+' ₸':'бесплатно'}</b></td><td class="right mono muted">${s.cost?fmt(s.cost)+' ₸':'—'}</td></tr>`).join('')}
   </tbody></table></div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Подключения</div><div class="ph-sub">каналы, через которые приходят клиенты и деньги</div></div></div>
   ${[['WA','WhatsApp Business','заявки, подтверждения записи, напоминания и переписка с клиентом',1],
      ['IG','Instagram Direct','обращения с рекламы попадают в воронку с источником',1],
      ['WEB','Онлайн-запись','ссылка и QR: клиент записывается сам в ваше расписание',1],
      ['KSP','Kaspi','оплата курсов и товаров, в том числе рассрочка',1],
      ['TEL','IP-телефония','входящие звонки с записью и привязкой к клиенту',0],
      ['SMS','Напоминания','автоматические сообщения за сутки до визита',1],
      ['ROL','Роли и доступы','владелец, управляющий, администратор, мастер, бухгалтер',1],
      ['BKP','Резервные копии','ежедневная копия базы, ваши данные всегда у вас',1]]
    .map(x=>`<div style="display:flex;gap:10px;align-items:center;border:1px solid var(--line);background:#fff;padding:10px;margin-bottom:6px;border-radius:5px">
     <div style="width:36px;height:36px;background:var(--ink);color:var(--gold);display:grid;place-items:center;font:600 6.6px 'IBM Plex Mono',monospace;flex:none;border-radius:5px">${x[0]}</div>
     <div style="flex:1"><b style="font-size:10px">${x[1]}</b><p class="mini" style="margin:3px 0 0">${x[2]}</p></div>
     <button class="switch ${x[3]?'on':''}" onclick="this.classList.toggle('on');toast('Настройка «${x[1]}» изменена в демо.')"></button></div>`).join('')}
  </div>
 </div>
 <div class="panel dark"><div class="ph"><div><div class="ph-title">Переход с Altegio без потерь</div><div class="ph-sub" style="color:#9d93a4">подписка оплачена вперёд — это не мешает</div></div><span class="tag gold">план перехода</span></div>
  <div class="flow" style="margin-top:11px">
   <div class="fbox"><code>ШАГ 1</code><b>Выгрузка</b><p>Забираем из Altegio клиентов, историю визитов, услуги и цены.</p></div>
   <div class="farr">→</div>
   <div class="fbox main"><code>ШАГ 2</code><b>Параллельная работа</b><p>Ваша система работает рядом с Altegio, администраторы привыкают без риска.</p></div>
   <div class="farr">→</div>
   <div class="fbox"><code>ШАГ 3</code><b>Полный переход</b><p>Записи ведутся только у вас, Altegio остаётся как архив до конца оплаченного периода.</p></div>
   <div class="farr">→</div>
   <div class="fbox"><code>ШАГ 4</code><b>Отказ от подписки</b><p>Когда оплаченный год закончится, продлевать уже нечего — система ваша.</p></div>
  </div>
  <p style="font-size:9.2px;color:#9d93a4;line-height:1.65;margin-top:11px">Оплаченная вперёд подписка не повод откладывать: за оставшееся время система как раз выйдет на полную мощность, а вы перестанете платить ежемесячно вообще.</p>
 </div>`;

/* ===== КАРКАС ===== */
function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([n,r],i)=>`<button class="role" onclick="enter('${n}')"><code>0${i+1}</code><b>${n}</b><span>${r.note}</span></button>`).join('')}
function enter(n){role=n;const r=ROLES[n];
 document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');
 document.getElementById('rav').textContent=r.av;document.getElementById('rname').textContent=r.n;document.getElementById('rrole').textContent=n;
 buildNav();const q=new URLSearchParams(location.search).get('s');go(q&&r.s.includes(q)?q:r.s[0]);
 toast(`Роль <b>${n}</b>: показаны только ваши разделы. Переключить можно в правом верхнем углу.`)}
function buildNav(){const al=ROLES[role].s;
 document.getElementById('nav').innerHTML=NAV.map(([g,items])=>{const x=items.filter(i=>al.includes(i[0]));
  return x.length?`<div class="nav-group">${g}</div>`+x.map(i=>`<button class="nav-item" data-go="${i[0]}" onclick="go('${i[0]}')"><span class="nav-code">${i[1]}</span><span>${i[2]}</span>${i[3]?`<span class="nav-badge">${i[3]}</span>`:'<span></span>'}</button>`).join(''):''}).join('');
 const s=document.getElementById('rsel');s.innerHTML=Object.keys(ROLES).map(n=>`<option ${n===role?'selected':''}>${n}</option>`).join('');s.onchange=()=>enter(s.value)}
function go(s){if(!ROLES[role].s.includes(s))s=ROLES[role].s[0];cur=s;
 document.getElementById('ttl').textContent=TITLES[s][0];document.getElementById('sub').textContent=TITLES[s][1];
 document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('on',x.dataset.go===s));
 render();document.getElementById('rail').classList.remove('open');document.getElementById('content').scrollTop=0;
 try{const u=new URL(location.href);u.searchParams.set('s',s);history.replaceState(null,'',u.pathname+'?'+u.searchParams.toString())}catch(e){}}
function render(){const sc=document.getElementById('content').scrollTop;
 document.getElementById('content').innerHTML=`<div class="screen">${SC[cur]?SC[cur]():'<p class="mini">Раздел в разработке.</p>'}</div>`;
 document.getElementById('content').scrollTop=sc}
function openD(t,s,tabs,body){document.getElementById('dt').textContent=t;document.getElementById('ds').textContent=s;
 document.getElementById('dtabs').innerHTML=tabs.map((x,i)=>`<button class="dtab ${i===0?'on':''}">${x}</button>`).join('');
 document.getElementById('db').innerHTML=body;document.getElementById('dbg').classList.add('show')}
function closeD(){document.getElementById('dbg').classList.remove('show')}
let tt;function toast(h){const t=document.getElementById('toast');t.innerHTML=h;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),4000)}
function sparks(){const c=['#c9a86a','#c98a94','#4a9070','#fff','#e0c68e','#a35f6c'];
 for(let i=0;i<70;i++){const s=document.createElement('i');s.className='spark';
  s.style.cssText=`left:${Math.random()*100}vw;top:-14px;background:${c[i%6]};animation-delay:${Math.random()*.45}s;transform:rotate(${Math.random()*360}deg)`;
  document.body.appendChild(s);setTimeout(()=>s.remove(),2400)}}
const TOUR=[
 ['leads','<b>Шаг 1.</b> Клиент пишет в Instagram после рекламы. Заявка сама попадает в воронку с источником и таймером ответа — этого в Altegio нет.',4800],
 ['booking','<b>Шаг 2.</b> Клиент записывается сам по ссылке: услуга, филиал, мастер, время. Администратор не участвует, запись сразу в расписании.',4800],
 ['sched','<b>Шаг 3.</b> Общее расписание двух филиалов по кабинетам и аппаратам. Клик по визиту — отметить приход и принять оплату.',4800],
 ['sales','<b>Шаг 4.</b> Оплата закрывает визит: деньги в кассу, процент мастеру, расходники со склада, процедура отмечена в курсе клиента.',4800],
 ['staff','<b>Шаг 5.</b> Зарплата считается сама: процент мастера, KPI администратора за проданные курсы, бонус за план.',4800],
 ['fin','<b>Итог.</b> Финансовый отчёт, ради которого вы держите Altegio, только в вашей логике и без ежемесячной подписки.',5200]
];
let tourT=null,tourI=0;
function tour(){if(tourT){stopTour();return}tourI=0;document.getElementById('tourBtn').textContent='■ Остановить';step()}
function step(){if(tourI>=TOUR.length){stopTour();sparks();toast('<b>Весь путь клиента</b> — от рекламы до курса процедур и зарплаты мастера — внутри одной вашей системы.');return}
 const [scr,txt,ms]=TOUR[tourI++];if(ROLES[role].s.includes(scr))go(scr);toast(txt);tourT=setTimeout(step,ms)}
function stopTour(){clearTimeout(tourT);tourT=null;const b=document.getElementById('tourBtn');if(b)b.textContent='▶ Сценарий'}
document.getElementById('menuBtn').onclick=()=>document.getElementById('rail').classList.toggle('open');
renderRoles();
(function(){const q=new URLSearchParams(location.search).get('s');if(q&&TITLES[q])enter('Владелец')})();
