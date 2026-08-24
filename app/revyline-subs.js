/* Revyline · модуль «Подписка на уход» — демо. Данные вымышленные, суммы в сомах. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const som=n=>fmt(n)+' сом';

const ROLES={
 'Владелец':{n:'Владелец сети',av:'ВЛ',note:'Деньги программы, продления, юнит-экономика',s:['dash','subs','comms','doctor','plans','econ','settings']},
 'Продавец':{n:'Продавец · касса',av:'ПР',note:'Подключение клиента у кассы за минуту',s:['subs','comms','plans']},
 'Врач-гигиенист':{n:'Врач-гигиенист',av:'ВГ',note:'Чат с подписчиками, рекомендации',s:['doctor','subs']},
 'Маркетолог':{n:'Маркетолог',av:'МК',note:'Шаблоны сообщений, конверсия, отчёты',s:['comms','dash','econ','settings']}
};
const NAV=[
 ['ПРОГРАММА',[['dash','DSH','Пульт программы'],['subs','SUB','Участники',3],['plans','TAR','Тарифы']]],
 ['АВТОМАТИКА',[['comms','MSG','Автокоммуникации',7],['doctor','DOC','Чат с врачом',2]]],
 ['ДЕНЬГИ',[['econ','ECO','Юнит-экономика'],['settings','SET','Настройки']]]
];
const TITLES={
 dash:['Пульт программы','Подписки, продления, конверсия напоминаний и деньги — на одном экране'],
 subs:['Участники программы','Карточка по номеру WhatsApp: товары, сроки замены, семья до 4 человек'],
 plans:['Тарифы подписки','Индивидуальная и семейная · 3, 6, 9 и 12 месяцев — как в программе'],
 comms:['Автокоммуникации','Система сама пишет за 7 дней до замены и повторяет через 7 дней'],
 doctor:['Чат с врачом-гигиенистом','Консультации для подписчиков всё время действия подписки'],
 econ:['Юнит-экономика','Что зарабатывает компания на каждом тарифе — таблица из программы'],
 settings:['Настройки','Товары программы, сроки замены, шаблоны сообщений, скидки']
};
let role='Владелец',cur='dash';

/* ===== ДАННЫЕ ===== */
const GOODS=[
 {id:'paste',n:'Зубная паста',price:1000,cycle:3},
 {id:'brush',n:'Ёршики межзубные',price:550,cycle:3},
 {id:'mono',n:'Монопучковая щётка',price:550,cycle:3},
 {id:'manual',n:'Мануальная щётка',price:450,cycle:3},
 {id:'head',n:'Насадка на электрощётку',price:1000,cycle:3},
 {id:'scraper',n:'Скребок для языка',price:400,cycle:3},
 {id:'floss',n:'Зубная нить',price:500,cycle:3}
];
const PLANS={
 ind:[{m:3,price:300,disc:15,gift:0,save:600},{m:6,price:600,disc:15,gift:0,save:1200},{m:9,price:800,disc:20,gift:0,save:2400},{m:12,price:1000,disc:20,gift:1,save:3200}],
 fam:[{m:3,price:1000,disc:15,gift:0,save:1920},{m:6,price:1500,disc:15,gift:0,save:3840},{m:9,price:2000,disc:20,gift:0,save:7680},{m:12,price:2200,disc:20,gift:1,save:10240}]
};
const gname=id=>GOODS.find(g=>g.id===id)?.n||id;
const gprice=id=>GOODS.find(g=>g.id===id)?.price||0;

let SUBS=[
 {id:1,phone:'+996 555 20 14 88',name:'Айжан Токтогулова',type:'fam',plan:12,started:'12.06.2026',until:'12.06.2027',status:'active',
  members:[
   {n:'Айжан',rel:'я',items:[{g:'head',last:'12.06.2026',due:'12.09.2026',state:'soon'},{g:'paste',last:'20.07.2026',due:'20.10.2026',state:'ok'}]},
   {n:'Бакыт',rel:'муж',items:[{g:'manual',last:'12.06.2026',due:'12.09.2026',state:'soon'},{g:'scraper',last:'12.06.2026',due:'12.09.2026',state:'soon'}]},
   {n:'Амина',rel:'дочь, 9 лет',items:[{g:'manual',last:'01.08.2026',due:'01.11.2026',state:'ok'}]},
   {n:'Эрлан',rel:'сын, 14 лет',items:[{g:'mono',last:'12.06.2026',due:'12.09.2026',state:'soon'},{g:'floss',last:'12.06.2026',due:'12.09.2026',state:'soon'}]}
  ],
  paid:2200,bought:3,spent:12400,doc:1,
  log:[['WA','Отправлено напоминание о замене насадки · до срока 7 дней','сегодня 09:00'],['BUY','Покупка по подписке: паста + нить · −20% · 1 200 сом','20.07.2026'],['DOC','Вопрос врачу: какую пасту ребёнку 9 лет','14.07.2026'],['SYS','Подключена семейная подписка на 12 месяцев + подарок','12.06.2026']]},
 {id:2,phone:'+996 700 88 12 44',name:'Тимур Асанов',type:'ind',plan:6,started:'20.05.2026',until:'20.11.2026',status:'active',
  members:[{n:'Тимур',rel:'я',items:[{g:'head',last:'26.05.2026',due:'26.08.2026',state:'over'},{g:'scraper',last:'20.06.2026',due:'20.09.2026',state:'ok'}]}],
  paid:600,bought:2,spent:4200,doc:0,
  log:[['WA','Повторное напоминание: «до окончания скидки 10 дней»','вчера 10:00'],['WA','Напоминание о замене насадки за 7 дней','19.08.2026'],['SYS','Подключена индивидуальная подписка на 6 месяцев','20.05.2026']]},
 {id:3,phone:'+996 777 45 90 21',name:'Гульнара Осмонова',type:'ind',plan:12,started:'02.03.2026',until:'02.03.2027',status:'active',
  members:[{n:'Гульнара',rel:'я',items:[{g:'paste',last:'04.08.2026',due:'04.11.2026',state:'ok'},{g:'brush',last:'04.08.2026',due:'04.11.2026',state:'ok'},{g:'floss',last:'04.08.2026',due:'04.11.2026',state:'ok'}]}],
  paid:1000,bought:4,spent:9800,doc:1,
  log:[['GIFT','Выдан подарок за полгода подписки: скребок для языка','02.09.2026 · план'],['BUY','Покупка по подписке · −20% · 1 640 сом','04.08.2026'],['DOC','Консультация по ёршикам — подобран размер 0,5 мм','11.07.2026'],['SYS','Подключена индивидуальная подписка на 12 месяцев','02.03.2026']]},
 {id:4,phone:'+996 550 33 76 10',name:'Нурбек Джумабеков',type:'ind',plan:3,started:'30.07.2026',until:'30.10.2026',status:'new',
  members:[{n:'Нурбек',rel:'я',items:[{g:'mono',last:'30.07.2026',due:'30.10.2026',state:'ok'},{g:'paste',last:'30.07.2026',due:'30.10.2026',state:'ok'}]}],
  paid:300,bought:1,spent:1550,doc:0,
  log:[['SYS','Подключена индивидуальная подписка на 3 месяца','30.07.2026']]},
 {id:5,phone:'+996 505 62 18 03',name:'Салтанат Мамбетова',type:'fam',plan:6,started:'15.04.2026',until:'15.10.2026',status:'risk',
  members:[
   {n:'Салтанат',rel:'я',items:[{g:'head',last:'15.04.2026',due:'15.07.2026',state:'over'}]},
   {n:'Азат',rel:'муж',items:[{g:'manual',last:'15.04.2026',due:'15.07.2026',state:'over'}]}
  ],
  paid:1500,bought:1,spent:5200,doc:0,
  log:[['WARN','Два напоминания без ответа — передано продавцу на звонок','01.08.2026'],['WA','Повторное напоминание о скидке','25.07.2026'],['WA','Напоминание о замене за 7 дней','08.07.2026'],['SYS','Подключена семейная подписка на 6 месяцев','15.04.2026']]}
];
let seq=6;

let COMMS=[
 {cl:'Айжан Токтогулова',phone:'+996 555 20 14 88',kind:'first',due:'сегодня 09:00',st:'sent',item:'Насадка на электрощётку · Айжан',disc:20,
  text:'Айжан, здравствуйте! Прошло почти три месяца с момента покупки. Пришло время заменить насадку для вашей электрической щётки. Мы уже подготовили для вас комплект со скидкой 20% 🦷 Забронировать к выдаче или получить персональную консультацию?'},
 {cl:'Тимур Асанов',phone:'+996 700 88 12 44',kind:'repeat',due:'вчера 10:00',st:'sent',item:'Насадка на электрощётку',disc:15,
  text:'Тимур, напоминаем: до окончания действия вашей персональной скидки 15% осталось 10 дней. Насадка уже отложена для вас в аптеке на Киевской.'},
 {cl:'Эрлан (семья Токтогуловых)',phone:'+996 555 20 14 88',kind:'first',due:'05.09 09:00',st:'plan',item:'Монопучковая щётка + нить · Эрлан',disc:20,text:'Плановое напоминание по товарам Эрлана — сформируется автоматически.'},
 {cl:'Бакыт (семья Токтогуловых)',phone:'+996 555 20 14 88',kind:'first',due:'05.09 09:00',st:'plan',item:'Щётка + скребок · Бакыт',disc:20,text:'Плановое напоминание по товарам Бакыта — объединяется с товарами Эрлана в одно сообщение семье.'},
 {cl:'Гульнара Осмонова',phone:'+996 777 45 90 21',kind:'gift',due:'02.09 12:00',st:'plan',item:'Подарок за полгода подписки',disc:0,text:'Гульнара, вы с нами уже полгода! 🎁 Ваш подарок ждёт в аптеке — скребок для языка Revyline. Просто покажите это сообщение.'},
 {cl:'Салтанат Мамбетова',phone:'+996 505 62 18 03',kind:'call',due:'просрочено',st:'fail',item:'Насадка + щётка · 2 напоминания без ответа',disc:15,text:'Задача продавцу: позвонить, предложить помощь с выбором. Автоцепочка остановлена до контакта.'},
 {cl:'Нурбек Джумабеков',phone:'+996 550 33 76 10',kind:'first',due:'23.10 09:00',st:'plan',item:'Монопучковая щётка + паста',disc:15,text:'Плановое напоминание за 7 дней до срока замены.'}
];

const DOCCHAT=[
 {cl:'Айжан Токтогулова',last:'Спасибо большое, возьмём детскую с кальцием!',t:'14:02',unread:0,
  msgs:[['in','Здравствуйте! Дочке 9 лет, какая паста лучше подойдёт? Сейчас берём взрослую.','13:40'],
        ['out','Здравствуйте, Айжан! До 12 лет лучше детская паста с пониженным содержанием фтора. У вас в подписке Revyline Kids с кальцием — по вашей скидке 20% выйдет 640 сом. Могу добавить в следующий заказ.','13:55'],
        ['in','Спасибо большое, возьмём детскую с кальцием!','14:02']]},
 {cl:'Гульнара Осмонова',last:'Кровоточивость ушла, ёршики 0,5 подошли 👍',t:'вчера',unread:0,
  msgs:[['in','Дёсны кровоточат при ёршиках, это нормально?','11.07'],
        ['out','Первые 5–7 дней лёгкая кровоточивость допустима. Если больше недели — уменьшите размер: вам подойдёт 0,5 мм вместо 0,7. Отметил в вашей карточке, продавец выдаст нужный размер.','11.07'],
        ['in','Кровоточивость ушла, ёршики 0,5 подошли 👍','вчера']]},
 {cl:'Тимур Асанов',last:'Как часто менять насадку, если щётка звуковая?',t:'10:12',unread:1,
  msgs:[['in','Как часто менять насадку, если щётка звуковая?','10:12']]},
 {cl:'Салтанат Мамбетова',last:'Врач: подобрал программу ухода для всей семьи',t:'02.08',unread:1,
  msgs:[['out','Салтанат, здравствуйте! Вижу, что вы давно не обновляли средства. Составил рекомендации для вас и Азата — посмотрите, пожалуйста. Это входит в вашу подписку.','02.08']]}
];

/* ===== ЭКРАНЫ ===== */
const SC={};
const planOf=s=>PLANS[s.type].find(p=>p.m===s.plan);
const stTag=s=>s.status==='active'?'<span class="tag green">активна</span>':s.status==='new'?'<span class="tag blue">новая</span>':s.status==='risk'?'<span class="tag red">риск оттока</span>':'<span class="tag">пауза</span>';

SC.dash=()=>{
 const act=SUBS.filter(s=>s.status!=='off');
 const mrr=act.reduce((a,s)=>a+s.paid,0);
 return `<div class="head"><div><h2>Пульт программы</h2><p>Модуль работает внутри вашей CRM: клиенты, каталог и продажи уже здесь, WhatsApp уже подключён. Этот экран показывает, что программа делает сама и сколько приносит.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Отчёт по программе выгружен в Excel.')">Экспорт</button><button class="btn acc" onclick="newSub()">+ Подключить клиента</button></div></div>
 <div class="strip">
  <div><small>АКТИВНЫХ ПОДПИСОК</small><b>418</b><span>322 индивидуальных · 96 семейных</span></div>
  <div><small>ДОХОД С ПОДПИСОК</small><b>214 600 сом</b><span>плата за подписку, накопленно</span></div>
  <div><small>ПОКУПКИ ПО ПРОГРАММЕ</small><b>1,84 млн сом</b><span class="good">▲ 31% к прошлому кварталу</span></div>
  <div><small>ВОЗВРАТ К ПОКУПКЕ</small><b>67%</b><span>после напоминания</span></div>
  <div><small>ПРОДЛЕВАЮТ ПОДПИСКУ</small><b>58%</b><span>по окончании срока</span></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph"><div><div class="ph-title">Как работает цикл</div><div class="ph-sub">от покупки у кассы до повторной покупки — без участия персонала</div></div><span class="tag acc">автоматика</span></div>
   ${[['01','Продавец фиксирует номер WhatsApp','карточка участника создаётся в CRM автоматически: дата покупки, товары, срок замены 3 месяца, вид подписки'],
      ['02','Система следит за сроками','по каждому товару каждого члена семьи — своя дата замены и своя дата уведомления'],
      ['03','За 7 дней — персональное сообщение','«Пришло время заменить насадку. Комплект со скидкой 20% уже подготовлен» + ссылка'],
      ['04','Через 7 дней — повтор','«До окончания действия вашей персональной скидки осталось 10 дней»'],
      ['05','Не ответил дважды — задача продавцу','автоцепочка останавливается, живой человек звонит и помогает'],
      ['06','Купил — цикл начинается заново','дата замены пересчитывается от новой покупки']]
    .map(x=>`<div style="display:grid;grid-template-columns:26px 1fr;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)"><span class="mono" style="color:var(--acc2);font-size:8.4px;font-weight:700">${x[0]}</span><div><b style="font-size:10px">${x[1]}</b><p class="mini" style="margin:3px 0 0">${x[2]}</p></div></div>`).join('')}
  </div>
  <div>
   <div class="panel"><div class="ph"><div><div class="ph-title">Сегодня система сделала</div><div class="ph-sub">без участия сотрудников</div></div></div>
    ${[['WA','Отправлено 14 напоминаний о замене','за 7 дней до срока · конверсия 67%'],
       ['WA','6 повторных «скидка сгорает»','через 7 дней после первого'],
       ['BUY','9 покупок по подписке · 11 350 сом','скидка применилась автоматически'],
       ['DOC','4 вопроса врачу-гигиенисту','среднее время ответа 18 минут'],
       ['WARN','2 участника передано продавцу','дважды не ответили на напоминания']]
     .map(a=>`<div style="display:flex;gap:9px;padding:8px 0;border-bottom:1px solid var(--line)"><span class="mono" style="width:36px;height:28px;background:var(--panel2);display:grid;place-items:center;font-size:6.8px;font-weight:700;flex:none;border-radius:7px;color:var(--acc2)">${a[0]}</span><div><b style="font-size:9.6px">${a[1]}</b><p class="mini" style="margin:2px 0 0">${a[2]}</p></div></div>`).join('')}
   </div>
   <div class="panel" style="margin-top:10px"><div class="ph-title">Конверсия напоминаний</div>
    ${[['Купили после 1-го сообщения',52,'var(--acc)'],['Купили после повтора',15,'#34d399'],['Пришли без покупки',9,'var(--amber)'],['Не отреагировали',24,'#31473c']]
      .map(r=>`<div class="fr" style="grid-template-columns:150px 1fr 44px"><span>${r[0]}</span><div class="ftrack" style="height:15px"><i style="--w:${r[1]/52*100}%;background:${r[2]}"></i></div><b>${r[1]}%</b></div>`).join('')}
   </div>
  </div>
 </div>
 <div class="g3">
  <div class="panel"><div class="ph-title">Подписки по месяцам</div>
   <div class="chart" style="height:110px">${[['мар',22,18],['апр',38,30],['май',52,44],['июн',68,58],['июл',86,74],['авг',100,88]].map(m=>`<div class="chart-col"><i style="--h:${m[1]}%;--p:${m[2]}%"></i><span>${m[0]}</span></div>`).join('')}</div>
   <div class="kpi-mini"><div style="--tone:var(--acc)"><small>НОВЫХ В АВГУСТЕ</small><b>74</b></div><div style="--tone:var(--violet)"><small>СЕМЕЙНЫХ</small><b>23%</b></div></div>
  </div>
  <div class="panel"><div class="ph-title">Что покупают по программе</div>
   ${[['Насадки на электрощётки',34,'var(--acc)'],['Зубные пасты',26,'#34d399'],['Ёршики',15,'var(--violet)'],['Щётки',13,'var(--blue)'],['Нить и скребки',12,'var(--amber)']]
     .map(r=>`<div class="fr" style="grid-template-columns:132px 1fr 40px"><span>${r[0]}</span><div class="ftrack" style="height:15px"><i style="--w:${r[1]/34*100}%;background:${r[2]}"></i></div><b>${r[1]}%</b></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Эффект программы</div>
   <div class="kpi-mini" style="margin-top:4px">
    <div style="--tone:var(--acc)"><small>ПОВТОРНЫЕ ПОКУПКИ</small><b>+41%</b></div>
    <div style="--tone:var(--violet)"><small>СРЕДНИЙ ЧЕК</small><b>+18%</b></div>
    <div style="--tone:#34d399"><small>LTV ПОДПИСЧИКА</small><b>× 2,4</b></div>
   </div>
   <div class="hint"><b>Цель программы из ТЗ выполняется:</b> привычка покупать уход именно в «Зубной аптеке Revyline» формируется автоматическими касаниями каждые 3 месяца.</div>
  </div>
 </div>`};

/* ---- УЧАСТНИКИ ---- */
let subF='all';
SC.subs=()=>{
 const q=(document.getElementById('sq')?.value||'').toLowerCase();
 let list=SUBS.filter(s=>(subF==='all'||(subF==='fam'?s.type==='fam':subF==='risk'?s.status==='risk':true))&&(s.name+' '+s.phone).toLowerCase().includes(q));
 return `<div class="head"><div><h2>Участники программы</h2><p>Подписка присваивается по номеру телефона WhatsApp. В карточке — все товары, сроки замены, семья до четырёх человек и вся история коммуникаций.</p></div>
 <div class="btns"><button class="btn" onclick="toast('База участников выгружена в Excel.')">Экспорт</button><button class="btn acc" onclick="newSub()">+ Подключить клиента</button></div></div>
 <div class="filters"><input class="search" id="sq" placeholder="Имя или номер WhatsApp…" oninput="render()"><button class="filter ${subF==='all'?'on':''}" onclick="subF='all';render()">Все 418</button><button class="filter ${subF==='fam'?'on':''}" onclick="subF='fam';render()">Семейные 96</button><button class="filter ${subF==='risk'?'on':''}" onclick="subF='risk';render()">Риск оттока 12</button></div>
 <div class="panel"><div class="tw"><table class="data" style="min-width:720px"><thead><tr><th>Участник · WhatsApp</th><th>Подписка</th><th>Состав</th><th>Ближайшая замена</th><th class="right">Куплено по программе</th><th>Врач</th><th>Статус</th></tr></thead><tbody>
 ${list.map(s=>{const p=planOf(s);const items=s.members.flatMap(m=>m.items);const soon=items.filter(i=>i.state!=='ok').length;
  return `<tr onclick="openSub(${s.id})"><td><b>${esc(s.name)}</b><div class="sub mono">${s.phone}</div></td>
  <td><span class="tag ${s.type==='fam'?'violet':'acc'}">${s.type==='fam'?'семейная':'индивид.'}</span><div class="sub">${s.plan} мес · −${p.disc}%${p.gift?' · подарок':''}</div></td>
  <td>${s.members.length} чел. · ${items.length} товаров</td>
  <td>${soon?`<span class="due ${items.some(i=>i.state==='over')?'over':'soon'}">${items.some(i=>i.state==='over')?'просрочена':'через 7 дней'} · ${soon} поз.</span>`:'<span class="due ok">всё по графику</span>'}</td>
  <td class="right mono"><b>${som(s.spent)}</b><div class="sub">${s.bought} покупок</div></td>
  <td>${s.doc?'<span class="tag wa">чат активен</span>':'<span class="tag">—</span>'}</td>
  <td>${stTag(s)}</td></tr>`}).join('')}
 </tbody></table></div>
 <div class="hint"><b>Один аккаунт — вся семья:</b> до четырёх человек, у каждого свои товары и свои сроки замены. Система объединяет их напоминания в одно сообщение и один заказ — или присылает по отдельности, как удобно клиенту.</div></div>`};

let dTab=0,dOpen=null;
function openSub(id,tab=0){const s=SUBS.find(x=>x.id===id);if(!s)return;dOpen=id;dTab=tab;const p=planOf(s);
 const tabs=['Подписка','Семья и товары','История','Врач'];
 document.getElementById('dt').textContent=s.name;
 document.getElementById('ds').textContent=`${s.phone} · ${s.type==='fam'?'семейная':'индивидуальная'} · ${s.plan} мес · −${p.disc}% · до ${s.until}`;
 document.getElementById('dtabs').innerHTML=tabs.map((t,i)=>`<button class="dtab ${i===tab?'on':''}" onclick="openSub(${id},${i})">${t}</button>`).join('');
 document.getElementById('db').innerHTML=subBody(s,tab);
 document.getElementById('dbg').classList.add('show')}
function subBody(s,tab){const p=planOf(s);
 if(tab===0)return `<div class="dg">
  <div class="det"><small>ТАРИФ</small><b>${s.type==='fam'?'Семейная':'Индивидуальная'} · ${s.plan} мес</b></div>
  <div class="det"><small>ОПЛАЧЕНО ЗА ПОДПИСКУ</small><b>${som(s.paid)}</b></div>
  <div class="det"><small>СКИДКА УЧАСТНИКА</small><b class="good">−${p.disc}% на товары программы</b></div>
  <div class="det"><small>ДЕЙСТВУЕТ</small><b>${s.started} — ${s.until}</b></div>
  <div class="det"><small>КУПЛЕНО ПО ПРОГРАММЕ</small><b>${som(s.spent)} · ${s.bought} покупок</b></div>
  <div class="det"><small>ЧАТ С ВРАЧОМ</small><b>${p?'включён в подписку':''}${s.doc?' · активен':''}</b></div>
 </div>
 ${p.gift?`<div class="note" style="--tone:var(--violet)"><b>🎁 Подарок раз в полгода</b><p>Тариф 12 месяцев: ближайший подарок — ${s.id===3?'02.09.2026, скребок для языка (уже запланирован)':'по графику подписки'}. Система напомнит сама.</p></div>`:''}
 <div class="note" style="--tone:var(--acc)"><b>Выгода клиента по этому тарифу</b><p>Экономия на товарах до ${som(p.save)} за срок подписки при цене подписки ${som(p.price)} — чистая выгода видна клиенту при подключении, это главный аргумент продавца.</p></div>
 <div class="btns" style="margin-top:12px">
  <button class="btn" onclick="toast('Сообщение отправлено в WhatsApp участника.')">Написать в WhatsApp</button>
  <button class="btn" onclick="openSub(${s.id},1)">Семья и товары</button>
  <button class="btn violet" onclick="toast('Продление предложено: за 2 недели до конца срока система сама пришлёт клиенту выгодное предложение.')">Предложить продление</button>
  ${s.status==='risk'?`<button class="btn red" onclick="toast('Задача продавцу создана: позвонить и вернуть клиента в программу.')">Задача продавцу</button>`:''}
 </div>`;
 if(tab===1)return s.members.map(m=>`<div class="member">
  <div class="mh"><span class="av">${esc(m.n.slice(0,2).toUpperCase())}</span><div><b>${esc(m.n)}</b><div class="sub">${esc(m.rel)}</div></div>
  <button class="btn" style="margin-left:auto;padding:5px 9px;font-size:9px" onclick="toast('Товар добавлен для ${esc(m.n)} — срок замены рассчитается от даты покупки.')">+ товар</button></div>
  ${m.items.map(i=>`<div class="mitem"><span>${gname(i.g)} <span class="mini">· ${som(gprice(i.g))}</span></span>
   <span class="due ${i.state==='over'?'over':i.state==='soon'?'soon':'ok'}">${i.state==='over'?'⚠ просрочено с '+i.due:i.state==='soon'?'замена '+i.due:'до '+i.due}</span></div>`).join('')}
 </div>`).join('')+`
 <div class="note" style="--tone:var(--violet)"><b>Семейная логика</b><p>У каждого члена семьи свой набор и свои даты. Напоминания по совпадающим срокам объединяются в одно сообщение, заказ можно собрать общий — одна поездка в аптеку вместо четырёх.</p></div>
 <div class="btns" style="margin-top:11px">${s.members.length<4?`<button class="btn acc" onclick="toast('Член семьи добавлен — до 4 человек в одном аккаунте по номеру WhatsApp.')">+ Добавить члена семьи</button>`:'<span class="tag violet">максимум 4 человека в аккаунте</span>'}</div>`;
 if(tab===2)return `<div class="ph-title" style="margin-bottom:9px">История участника</div><div class="tl">
 ${s.log.map(l=>`<div class="tli"><b>${({WA:'WhatsApp · автоматически',BUY:'Покупка по подписке',DOC:'Чат с врачом',SYS:'Система',GIFT:'Подарок',WARN:'Эскалация продавцу'})[l[0]]||l[0]}</b><p>${esc(l[1])}</p><time>${l[2]}</time></div>`).join('')}</div>`;
 return `<div class="ph-title" style="margin-bottom:9px">Чат с врачом-гигиенистом</div>
 ${s.doc?`<div style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px">
  ${(DOCCHAT.find(d=>d.cl===s.name)?.msgs||[]).map(m=>`<div class="wa-msg ${m[0]==='out'?'out':''}">${esc(m[1])}<time>${m[2]}</time></div>`).join('')||'<p class="mini">Диалог ещё не начат.</p>'}
 </div>`:'<p class="mini">Клиент ещё не писал врачу. Доступ к чату включён в подписку — кнопка есть в каждом сообщении программы.</p>'}
 <div class="note" style="--tone:var(--wa)"><b>Как это устроено</b><p>Вопрос уходит в общий чат врача в этой же CRM. Врач видит карточку клиента: подписку, товары и историю — и отвечает предметно. Рекомендация врача превращается в позицию следующего заказа.</p></div>`}

function newSub(){openD('Подключение к программе','Продавец делает это у кассы за минуту',['Новый участник'],
 `<div class="f2"><div class="fld"><small>НОМЕР WHATSAPP · КЛЮЧ ПОДПИСКИ</small><input id="nsPhone" placeholder="+996 ___ __ __ __" value="+996 555 "></div>
  <div class="fld"><small>ИМЯ</small><input id="nsName" placeholder="Как обращаться в сообщениях"></div></div>
 <div class="f2"><div class="fld"><small>ВИД ПОДПИСКИ</small><select id="nsType" onchange="nsCalc()"><option value="ind">Индивидуальная</option><option value="fam">Семейная · до 4 человек</option></select></div>
  <div class="fld"><small>СРОК</small><select id="nsPlan" onchange="nsCalc()"><option value="3">3 месяца</option><option value="6">6 месяцев</option><option value="9">9 месяцев</option><option value="12" selected>12 месяцев · подарок</option></select></div></div>
 <div class="fld"><small>ТОВАРЫ СЕГОДНЯШНЕЙ ПОКУПКИ · ОТ НИХ СЧИТАЕМ СРОК ЗАМЕНЫ</small>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">${GOODS.map(g=>`<label style="display:flex;gap:7px;align-items:center;border:1px solid var(--line2);border-radius:9px;padding:7px 9px;font-size:9.8px;cursor:pointer"><input type="checkbox" ${['head','paste'].includes(g.id)?'checked':''} onchange="nsCalc()" class="nsG" value="${g.id}"> ${g.n} · ${som(g.price)}</label>`).join('')}</div></div>
 <div class="note" style="--tone:var(--acc)" id="nsOut"></div>
 <div class="btns" style="margin-top:12px"><button class="btn acc" onclick="saveSub()">Подключить и отправить приветствие</button><button class="btn" onclick="closeD()">Отмена</button></div>`);
 setTimeout(nsCalc,50)}
function nsCalc(){const t=document.getElementById('nsType')?.value||'ind';const m=+(document.getElementById('nsPlan')?.value||12);
 const p=PLANS[t].find(x=>x.m===m);const out=document.getElementById('nsOut');if(!out||!p)return;
 out.innerHTML=`<b>Что скажет продавец клиенту</b><p>Подписка ${som(p.price)} за ${m} мес: скидка −${p.disc}% на все товары программы (экономия до ${som(p.save)}), чат с врачом-гигиенистом${p.gift?' и подарок раз в полгода':''}. Чистая выгода клиента — до ${som(p.save-p.price)}.</p>`}
function saveSub(){const ph=document.getElementById('nsPhone').value.trim(),nm=document.getElementById('nsName').value.trim()||'Новый участник';
 if(ph.length<12)return toast('Укажите номер WhatsApp — подписка присваивается по нему.');
 const t=document.getElementById('nsType').value,m=+document.getElementById('nsPlan').value;
 const items=[...document.querySelectorAll('.nsG:checked')].map(c=>({g:c.value,last:'24.08.2026',due:'24.11.2026',state:'ok'}));
 SUBS.unshift({id:seq++,phone:ph,name:nm,type:t,plan:m,started:'24.08.2026',until:'24.'+String((8+m-1)%12+1).padStart(2,'0')+'.2027',status:'new',
  members:[{n:nm.split(' ')[0],rel:'я',items}],paid:PLANS[t].find(x=>x.m===m).price,bought:1,spent:items.reduce((a,i)=>a+gprice(i.g),0),doc:0,
  log:[['WA','Отправлено приветствие с условиями подписки и кнопкой чата с врачом','сейчас'],['SYS','Карточка участника создана автоматически: товары, срок замены 3 мес, график напоминаний','сейчас']]});
 closeD();if(cur!=='subs')go('subs');else render();sparks();
 toast(`<b>${esc(nm)}</b> подключён к программе. Карточка создана, приветствие ушло в WhatsApp, первое напоминание — за 7 дней до срока замены.`)}

/* ---- ТАРИФЫ ---- */
SC.plans=()=>`
 <div class="head"><div><h2>Тарифы подписки</h2><p>Ровно как в вашей программе: индивидуальная и семейная до 4 человек, сроки 3–12 месяцев. Продавец показывает клиенту выгоду прямо с этого экрана.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Цены и скидки тарифов меняются в настройках без разработчика.')">Изменить условия</button><button class="btn acc" onclick="newSub()">+ Подключить клиента</button></div></div>
 <div class="ph-title" style="margin:4px 0 9px">Индивидуальная</div>
 <div class="g4">${PLANS.ind.map(p=>planCard(p,'ind')).join('')}</div>
 <div class="ph-title" style="margin:14px 0 9px">Семейная · до 4 человек в одном аккаунте</div>
 <div class="g4">${PLANS.fam.map(p=>planCard(p,'fam')).join('')}</div>
 <div class="g2" style="margin-top:12px">
  <div class="panel"><div class="ph-title">Товары программы</div>
   <div class="tw"><table class="data" style="min-width:420px"><thead><tr><th>Товар</th><th class="right">Цена</th><th class="right">Срок замены</th></tr></thead><tbody>
   ${GOODS.map(g=>`<tr onclick="toast('${g.n}: участвует в программе, скидка подписчика применяется автоматически на кассе.')"><td><b>${g.n}</b></td><td class="right mono">${som(g.price)}</td><td class="right mono">${g.cycle} мес</td></tr>`).join('')}
   </tbody></table></div>
   <div class="hint"><b>Можно по отдельности или пакетом:</b> клиент выбирает конкретные товары или комплексный набор — система ведёт срок по каждой позиции.</div>
  </div>
  <div class="panel"><div class="ph-title">Что получает клиент · коротко</div>
   <div class="tw"><table class="data" style="min-width:440px"><thead><tr><th>Подписка</th><th class="right">Цена</th><th>Что получает</th><th class="right">Выгода на товарах</th></tr></thead><tbody>
   ${PLANS.ind.map(p=>`<tr style="cursor:default"><td><b>${p.m} мес</b></td><td class="right mono">${som(p.price)}</td><td class="mini">−${p.disc}% + консультация${p.gift?' + подарок':''}</td><td class="right mono good">до ${som(p.save)}</td></tr>`).join('')}
   </tbody></table></div>
   <div class="hint"><b>Таблица из вашего ТЗ</b> — продавец разворачивает её клиенту на планшете или печатает памяткой к кассе.</div>
  </div>
 </div>`;
function planCard(p,t){return `<div class="plan ${p.m===12?'hot':''}" onclick="newSub()">
 ${p.m===12?'<span class="flag tag acc">выгоднее всего</span>':''}
 <div class="dur">${t==='fam'?'СЕМЕЙНАЯ':'ИНДИВИДУАЛЬНАЯ'} · ${p.m} МЕС</div>
 <div class="price">${fmt(p.price)} <small>сом</small></div>
 <ul>
  <li>Скидка <b>−${p.disc}%</b> на товары программы</li>
  <li>Экономия до <b>${som(p.save)}</b></li>
  <li>Чат с врачом-гигиенистом</li>
  ${p.gift?'<li>🎁 Подарок раз в полгода</li>':''}
  <li>Чистая выгода: <b>до ${som(p.save-p.price)}</b></li>
 </ul></div>`}

/* ---- АВТОКОММУНИКАЦИИ ---- */
SC.comms=()=>`
 <div class="head"><div><h2>Автокоммуникации</h2><p>Система сама отслеживает сроки замены и запускает цепочку: за 7 дней — персональное предложение, ещё через 7 — напоминание о сгорающей скидке, дальше — задача продавцу.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Шаблоны сообщений открыты — тексты меняются в настройках.')">Шаблоны</button><button class="btn violet" onclick="simDay()">⏩ Симулировать день</button></div></div>
 <div class="strip">
  <div><small>ОТПРАВЛЕНО ЗА МЕСЯЦ</small><b>486</b><span>первые 322 · повторы 118 · подарки 46</span></div>
  <div><small>КУПИЛИ ПОСЛЕ СООБЩЕНИЯ</small><b class="good">67%</b><span>52% с первого + 15% с повтора</span></div>
  <div><small>ЗАПЛАНИРОВАНО</small><b>${COMMS.filter(c=>c.st==='plan').length}</b><span>на ближайшие 14 дней</span></div>
  <div><small>ЭСКАЛАЦИЙ ПРОДАВЦУ</small><b class="warn">${COMMS.filter(c=>c.st==='fail').length}</b><span>дважды без ответа</span></div>
  <div><small>ОТПИСАЛИСЬ</small><b>1,2%</b><span>можно в один клик — это важно</span></div>
 </div>
 <div class="g12">
  <div class="panel"><div class="ph-title">Как выглядит у клиента</div>
   <div style="background:#0b1a12;border:1px solid var(--line2);border-radius:14px;padding:13px;margin-top:6px">
    <div class="mini" style="text-align:center;margin-bottom:9px">WhatsApp · Зубная аптека Revyline</div>
    <div class="wa-msg">Айжан, здравствуйте! Прошло почти три месяца с момента покупки. Пришло время заменить <b>насадку для вашей электрической щётки</b>. Мы уже подготовили для вас комплект со скидкой <b>20%</b> 🦷<div class="wa-btn" onclick="toast('Клик клиента: заказ забронирован, продавец увидит его в CRM.')">Забронировать со скидкой</div><div class="wa-btn" onclick="toast('Клик клиента: вопрос ушёл врачу-гигиенисту в этой же системе.')">Консультация врача</div><time>09:00 · автоматически</time></div>
    <div class="wa-msg out">Спасибо! Заберу в субботу, забронируйте 🙌<time>09:14</time></div>
   </div>
   <div class="hint"><b>Тексты — из вашего ТЗ,</b> подставляются имя, товар и персональная скидка тарифа. Шаблоны редактируются в настройках без программиста.</div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Лента коммуникаций</div><div class="ph-sub">отправленные, запланированные и эскалации</div></div><span class="tag wa">GreenAPI</span></div>
   <div class="tw"><table class="data" style="min-width:620px"><thead><tr><th>Когда</th><th>Тип</th><th>Кому</th><th>По чему</th><th>Статус</th></tr></thead><tbody id="commTb">
   ${COMMS.map((c,i)=>`<tr onclick="commCard(${i})"><td class="mono">${c.due}</td>
    <td><span class="tag ${c.kind==='first'?'acc':c.kind==='repeat'?'amber':c.kind==='gift'?'violet':'red'}">${({first:'за 7 дней',repeat:'повтор',gift:'подарок',call:'продавцу'})[c.kind]}</span></td>
    <td><b>${esc(c.cl)}</b><div class="sub mono">${c.phone}</div></td><td class="mini">${esc(c.item)}</td>
    <td><span class="tag ${c.st==='sent'?'green':c.st==='plan'?'blue':'red'}">${({sent:'отправлено',plan:'в плане',fail:'эскалация'})[c.st]}</span></td></tr>`).join('')}
   </tbody></table></div>
   <div class="hint"><b>Семейные напоминания объединяются:</b> у Бакыта и Эрлана замена в один день — семья получит одно сообщение со списком, а не четыре подряд.</div>
  </div>
 </div>`;
function commCard(i){const c=COMMS[i];
 openD(c.cl,`${c.phone} · ${({first:'напоминание за 7 дней',repeat:'повтор через 7 дней',gift:'подарок',call:'эскалация продавцу'})[c.kind]} · ${c.due}`,['Сообщение'],
 `<div class="wa-msg" style="max-width:100%">${esc(c.text)}${c.disc?`<div class="wa-btn">Забронировать со скидкой ${c.disc}%</div>`:''}<time>${c.due}</time></div>
  <div class="note" style="--tone:var(--acc)"><b>Логика цепочки</b><p>Купил — цепочка закрывается, срок пересчитывается. Не купил — через 7 дней повтор про сгорающую скидку. Снова тишина — задача продавцу на звонок, автоматика останавливается.</p></div>
  <div class="btns" style="margin-top:11px">${c.st==='plan'?`<button class="btn acc" onclick="closeD();toast('Сообщение отправлено сейчас, вне графика.')">Отправить сейчас</button>`:''}<button class="btn" onclick="closeD();toast('Открыта карточка участника.')">Карточка участника</button></div>`)}
function simDay(){sparks();
 COMMS.unshift({cl:'Гульнара Осмонова',phone:'+996 777 45 90 21',kind:'gift',due:'только что',st:'sent',item:'Подарок за полгода подписки',disc:0,text:'Гульнара, вы с нами уже полгода! 🎁 Ваш подарок ждёт в аптеке.'});
 COMMS.unshift({cl:'Тимур Асанов',phone:'+996 700 88 12 44',kind:'call',due:'только что',st:'fail',item:'Насадка · 2 напоминания без ответа',disc:15,text:'Задача продавцу: связаться.'});
 render();
 toast('⏩ День промотан: система отправила <b>3 напоминания</b>, зафиксировала <b>2 покупки</b> по подписке и создала <b>1 задачу продавцу</b>. Персонал в этом не участвовал.')}

/* ---- ЧАТ С ВРАЧОМ ---- */
let docI=0;
SC.doctor=()=>`
 <div class="head"><div><h2>Чат с врачом-гигиенистом</h2><p>Доступ к консультации входит в каждую подписку. Врач видит карточку клиента — подписку, товары и сроки — и отвечает предметно, а его рекомендация превращается в следующий заказ.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Шаблоны ответов врача открыты.')">Шаблоны ответов</button></div></div>
 <div class="strip">
  <div><small>ДИАЛОГОВ ЗА МЕСЯЦ</small><b>168</b><span>от 418 подписчиков</span></div>
  <div><small>СРЕДНИЙ ОТВЕТ</small><b>18 мин</b><span>в рабочие часы</span></div>
  <div><small>БЕЗ ОТВЕТА</small><b class="warn">${DOCCHAT.filter(d=>d.unread).length}</b><span>ждут врача</span></div>
  <div><small>РЕКОМЕНДАЦИИ → ПОКУПКА</small><b class="good">44%</b><span>совет врача продаёт</span></div>
  <div><small>НАГРУЗКА</small><b>~6 в день</b><span>справляется один врач</span></div>
 </div>
 <div class="g12">
  <div class="panel" style="padding:8px">
   ${DOCCHAT.map((d,i)=>`<div onclick="docI=${i};render()" style="padding:10px 11px;border-radius:10px;cursor:pointer;${i===docI?'background:var(--panel2)':''};border-bottom:1px solid var(--line)">
    <div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:10.4px">${esc(d.cl)}</b><time class="mono" style="font-size:7.6px;color:var(--muted2)">${d.t}</time></div>
    <div class="mini" style="margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(d.last)}</div>
    ${d.unread?'<span class="tag red" style="margin-top:5px">не отвечено</span>':''}</div>`).join('')}
  </div>
  <div class="panel">
   <div class="ph"><div><div class="ph-title">${esc(DOCCHAT[docI].cl)}</div><div class="ph-sub">подписчик · карточка и товары видны врачу справа от чата</div></div><button class="btn" onclick="toast('Открыта карточка участника: подписка, товары, сроки замены.')">Карточка</button></div>
   <div style="background:#0b1a12;border:1px solid var(--line2);border-radius:14px;padding:13px;min-height:220px">
    ${DOCCHAT[docI].msgs.map(m=>`<div class="wa-msg ${m[0]==='out'?'out':''}">${esc(m[1])}<time>${m[2]}</time></div>`).join('')}
   </div>
   <div style="display:flex;gap:6px;margin-top:9px"><input class="search" id="docMsg" placeholder="Ответ врача…" onkeydown="if(event.key==='Enter')docSend()"><button class="btn" onclick="toast('Рекомендация превращена в заказ: товар добавлен клиенту со скидкой подписки.')">→ В заказ</button><button class="btn acc" onclick="docSend()">Отправить</button></div>
   <div class="hint"><b>Границы сервиса:</b> врач консультирует по домашнему уходу и подбору средств. При жалобах на боль или воспаление — шаблонный ответ с рекомендацией очного приёма: это снимает медицинские риски с аптеки.</div>
  </div>
 </div>`;
function docSend(){const el=document.getElementById('docMsg');const v=el?.value.trim();if(!v)return;
 DOCCHAT[docI].msgs.push(['out',v,'сейчас']);DOCCHAT[docI].unread=0;DOCCHAT[docI].last='Врач: '+v;render();
 toast('Ответ отправлен подписчику в WhatsApp.')}

/* ---- ЮНИТ-ЭКОНОМИКА ---- */
SC.econ=()=>`
 <div class="head"><div><h2>Юнит-экономика</h2><p>Таблица из вашей программы, посчитанная системой на живых данных: продажи, скидки, плата за подписку и остаток по каждому тарифу.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Выгружено в Excel.')">Экспорт</button></div></div>
 <div class="strip">
  <div><small>ВАЛОВЫЙ ОСТАТОК ПРОГРАММЫ</small><b>612 000 сом</b><span>товары после скидки + подписки, квартал</span></div>
  <div><small>ДОХОД С ПОДПИСОК</small><b>214 600 сом</b><span>оплачено картой и наличными</span></div>
  <div><small>СКИДОК ВЫДАНО</small><b>287 400 сом</b><span>цена удержания клиентов</span></div>
  <div><small>ПОДАРКОВ</small><b>18 400 сом</b><span>46 подарков · 12-мес тарифы</span></div>
  <div><small>LTV ПОДПИСЧИКА</small><b class="good">× 2,4</b><span>против обычного покупателя</span></div>
 </div>
 <div class="panel"><div class="ph"><div><div class="ph-title">Семейная подписка · расчёт на один аккаунт</div><div class="ph-sub">из вашего ТЗ · «остаток» — валовая прибыль товаров + подписка, до расходов на врача, подарки и персонал</div></div><span class="tag acc">живые данные</span></div>
  <div class="tw"><table class="data" style="min-width:680px"><thead><tr><th>Срок</th><th class="right">Продажи товаров без скидки</th><th class="right">Скидка</th><th class="right">Валовая прибыль после скидки</th><th class="right">Цена подписки</th><th class="right">Остаток</th></tr></thead><tbody>
  ${[[3,'12 800–14 800','15%','1 920–2 220','1 000','2 920–3 220'],[6,'25 600–29 600','15%','3 840–4 440','1 500','5 340–5 940'],[9,'38 400–44 400','20%','3 840–4 440','2 000','5 840–6 440'],[12,'51 200–59 200','20%','5 120–5 920','2 200','7 320–8 120']]
   .map(r=>`<tr style="cursor:default"><td><b>${r[0]} мес</b></td><td class="right mono">${r[1]}</td><td class="right mono">${r[2]}</td><td class="right mono">${r[3]}</td><td class="right mono">${r[4]}</td><td class="right mono good"><b>${r[5]}</b></td></tr>`).join('')}
  </tbody></table></div>
  <div class="hint"><b>Что добавляет система к вашей таблице:</b> расчёт идёт не по плановым «~16 000 сом», а по фактическим покупкам каждого аккаунта. Видно, какие тарифы реально выгоднее и где скидка 20% не окупается частотой покупок.</div>
 </div>
 <div class="g2">
  <div class="panel"><div class="ph-title">Фактический остаток по тарифам · квартал</div>
   ${[['Индивидуальная 3–6 мес',148000,'var(--acc)'],['Индивидуальная 9–12 мес',186000,'#34d399'],['Семейная 3–6 мес',114000,'var(--violet)'],['Семейная 9–12 мес',164000,'var(--blue)']]
     .map(r=>`<div class="fr" style="grid-template-columns:172px 1fr 84px"><span>${r[0]}</span><div class="ftrack"><i style="--w:${r[1]/186000*100}%;background:${r[2]}"></i></div><b>${som(r[1])}</b></div>`).join('')}
   <div class="hint"><b>Вывод по данным:</b> 12-месячные тарифы дают лучший остаток на аккаунт — их и стоит продвигать у кассы, что продавец и видит в своём экране тарифов.</div>
  </div>
  <div class="panel"><div class="ph-title">Что не входит в «остаток»</div>
   <p class="mini" style="margin-top:6px">Как честно указано в вашем документе: остаток — это валовая прибыль от товаров плюс стоимость подписки <b>до</b> расходов на чат с врачом, подарки, персонал, аренду, эквайринг и маркетинг. Система позволяет добавить эти статьи в настройках и увидеть чистую прибыль программы.</p>
   <div class="kpi-mini"><div style="--tone:var(--amber)"><small>ВРАЧ · ЧАСЫ В МЕСЯЦ</small><b>~24 ч</b></div><div style="--tone:var(--violet)"><small>ПОДАРКИ</small><b>18 400 сом</b></div><div style="--tone:var(--acc)"><small>WHATSAPP</small><b>~450 сом/мес</b></div></div>
  </div>
 </div>`;

/* ---- НАСТРОЙКИ ---- */
SC.settings=()=>`
 <div class="head"><div><h2>Настройки программы</h2><p>Всё, что захотите поменять — без разработчика: товары и сроки замены, тексты сообщений, размеры скидок и цены тарифов.</p></div></div>
 <div class="g2">
  <div class="panel"><div class="ph-title">Правила программы</div>
   ${[['Срок замены товаров','3 месяца (по каждому товару отдельно)'],['Первое напоминание','за 7 дней до срока замены'],['Повторное напоминание','через 7 дней, «скидка сгорает через 10 дней»'],['Эскалация продавцу','после 2 сообщений без реакции'],['Членов семьи в аккаунте','до 4 человек'],['Подарок','раз в полгода на тарифах 12 месяцев']]
     .map(x=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);font-size:10px"><span class="muted">${x[0]}</span><b style="text-align:right">${x[1]}</b></div>`).join('')}
   <div class="hint"><b>Все правила — параметры,</b> а не код: решили напоминать за 5 дней или заменить пасту раз в 2 месяца — поменяли в этом экране.</div>
  </div>
  <div class="panel"><div class="ph-title">Интеграции модуля</div>
   ${[['CRM','Клиенты и заказы','модуль живёт внутри вашей CRM Revyline — та же база, те же карточки'],
      ['WA','WhatsApp · GreenAPI','уже подключён в CRM — используется тот же канал'],
      ['1C','Продажи и каталог · 1С','покупка на кассе сама закрывает цикл и пересчитывает срок замены'],
      ['PAY','Оплата подписки','касса аптеки или ссылка на оплату; продление — тем же сообщением'],
      ['DOC','Рабочее место врача','чат в этой же системе, с карточкой клиента перед глазами']]
    .map(x=>`<div style="display:flex;gap:10px;align-items:center;border:1px solid var(--line);background:var(--panel2);padding:10px;margin-bottom:6px;border-radius:10px">
     <div style="width:36px;height:36px;background:var(--bg2);color:var(--acc2);display:grid;place-items:center;font:600 7px 'IBM Plex Mono',monospace;flex:none;border-radius:9px">${x[0]}</div>
     <div style="flex:1"><b style="font-size:10px">${x[1]}</b><p class="mini" style="margin:3px 0 0">${x[2]}</p></div></div>`).join('')}
  </div>
 </div>`;

/* ===== КАРКАС ===== */
function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([n,r],i)=>`<button class="role" onclick="enter('${n}')"><code>0${i+1}</code><b>${n}</b><span>${r.note}</span></button>`).join('')}
function enter(n){role=n;const r=ROLES[n];
 document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');
 document.getElementById('rav').textContent=r.av;document.getElementById('rname').textContent=n;document.getElementById('rrole').textContent=r.note;
 buildNav();const q=new URLSearchParams(location.search).get('s');go(q&&r.s.includes(q)?q:r.s[0]);
 toast(`Роль <b>${n}</b>: показаны только ваши разделы.`)}
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
function closeD(){dOpen=null;document.getElementById('dbg').classList.remove('show')}
let tt;function toast(h){const t=document.getElementById('toast');t.innerHTML=h;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),4200)}
function sparks(){const c=['#10b981','#34d399','#7c3aed','#25d366','#e9f3ee','#0891b2'];
 for(let i=0;i<70;i++){const s=document.createElement('i');s.className='spark';
  s.style.cssText=`left:${Math.random()*100}vw;top:-14px;background:${c[i%6]};animation-delay:${Math.random()*.45}s;transform:rotate(${Math.random()*360}deg)`;
  document.body.appendChild(s);setTimeout(()=>s.remove(),2400)}}
const TOUR=[
 ['plans','<b>Шаг 1.</b> Продавец у кассы показывает тарифы: подписка от 300 сом, скидка до 20%, чат с врачом. Чистая выгода клиента посчитана заранее.',5000],
 ['subs','<b>Шаг 2.</b> Номер WhatsApp зафиксирован — карточка создалась сама: товары, сроки замены, семья до 4 человек, у каждого свой график.',5000],
 ['comms','<b>Шаг 3.</b> За 7 дней до замены система пишет сама. Не купил — повтор через 7 дней. Снова тишина — задача продавцу. Конверсия 67%.',5200],
 ['doctor','<b>Шаг 4.</b> Чат с врачом-гигиенистом внутри подписки: рекомендация врача превращается в следующий заказ — 44% советов заканчиваются покупкой.',5000],
 ['econ','<b>Итог.</b> Юнит-экономика из вашего документа считается на живых данных: остаток по каждому тарифу, LTV подписчика ×2,4.',5200]
];
let tourT=null,tourI=0;
function tour(){if(tourT){stopTour();return}tourI=0;document.getElementById('tourBtn').textContent='■ Остановить';step()}
function step(){if(tourI>=TOUR.length){stopTour();sparks();toast('<b>Весь цикл подписки</b> — от кассы до повторной покупки — работает внутри вашей CRM автоматически.');return}
 const [scr,txt,ms]=TOUR[tourI++];if(ROLES[role].s.includes(scr))go(scr);toast(txt);tourT=setTimeout(step,ms)}
function stopTour(){clearTimeout(tourT);tourT=null;const b=document.getElementById('tourBtn');if(b)b.textContent='▶ Сценарий'}
document.getElementById('menuBtn').onclick=()=>document.getElementById('rail').classList.toggle('open');
renderRoles();
(function(){const q=new URLSearchParams(location.search).get('s');if(q&&TITLES[q])enter('Владелец')})();
