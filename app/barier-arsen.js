/* БАРЬЕР — система службы дезинсекции и дератизации: заявки из рекламы, WhatsApp и звонков, распределение по дезинфекторам, приложение дезинфектора (адрес, время, вредитель, фото и видео, препараты, оплата), календарь выездов, клиенты и гарантийные повторы, склад препаратов, деньги и сдача наличных, зарплата, источники рекламы, отчёты. Все имена, адреса и суммы вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const fmt1=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const tg=n=>fmt(n)+' ₸';
const TODAY='14.10.2026',NOW='11:20';
const LOGO_I='<svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 8 86 22v26c0 22-15 37-36 44C29 85 14 70 14 48V22z" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="round"/><path d="M34 50l11 11 22-24" fill="none" stroke="var(--brand2,#ff7a3d)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>«${q}»</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;

const SEC=[
 {k:'top',n:'Пульт',sub:[['dash','Пульт руководителя']]},
 {k:'jb',n:'Заявки',sub:[['leads','Все заявки'],['board','Распределение'],['job','Карточка заявки'],['cal','Календарь выездов']]},
 {k:'mob',n:'Дезинфектор',sub:[['mobile','Приложение дезинфектора']]},
 {k:'cl',n:'Клиенты',sub:[['clients','Клиенты и гарантия'],['price','Услуги и прайс']]},
 {k:'mn',n:'Деньги и склад',sub:[['money','Оплаты и наличные'],['salary','Зарплата дезинфекторов'],['stock','Склад препаратов']]},
 {k:'rp',n:'Аналитика',sub:[['ads','Реклама и источники'],['reports','Отчёты · Excel']]},
 {k:'sys',n:'Система',sub:[['launch','Запуск и стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Производственный директор':{av:'АР',n:'Арсен',note:'Заявки, распределение по дезинфекторам, контроль выездов, склад, зарплата',s:ALL.slice()},
 'Генеральный директор':{av:'ГД',n:'Генеральный',note:'Пульт, деньги, реклама, отчёты',s:['dash','money','salary','ads','reports','leads','clients','launch']},
 'Оператор':{av:'ОП',n:'Мадина',note:'Принимает звонки и WhatsApp, заводит заявки, ставит время',s:['leads','job','board','cal','clients','price']},
 'Дезинфектор':{av:'БК',n:'Бекзат',note:'Свои выезды в телефоне: адрес, время, вредитель, фото, препараты, оплата',s:['mobile','cal']}
};
let role='Производственный директор',cur='dash',theme='light';

const DZ=[['BK','Бекзат','#2a7de1'],['DN','Данияр','#1f9a66'],['RS','Руслан','#c2413b']];
const DN=k=>(DZ.find(d=>d[0]===k)||['','не назначен','#999'])[1];
const DC=k=>(DZ.find(d=>d[0]===k)||['','','#9aa4ad'])[2];
const PESTS=['Тараканы','Клопы','Блохи','Муравьи','Грызуны','Клещи на участке','Моль','Плесень, дезинфекция'];
const OBJ=['Квартира 1–2 комн.','Квартира 3–4 комн.','Частный дом','Офис','Кафе, ресторан','Участок, 10 соток'];
const SRC=['Google','2ГИС','OLX','Instagram','WhatsApp','Повторный','Рекомендация'];
/* Прайс: вредитель × объект */
const PRICE={'Квартира 1–2 комн.':18000,'Квартира 3–4 комн.':25000,'Частный дом':45000,'Офис':35000,'Кафе, ресторан':55000,'Участок, 10 соток':30000};
const PK={'Клопы':1.3,'Грызуны':1.2,'Плесень, дезинфекция':1.4};
const priceOf=(p,o)=>Math.round((PRICE[o]||20000)*(PK[p]||1)/500)*500;
/* Статусы заявки */
const ST=[['new','Новая','#7c8aa5'],['set','Назначена','#2a7de1'],['road','В пути','#7a62c4'],['work','На объекте','#c58a1b'],['done','Обработано','#1f9a66'],['paid','Оплачено','#127a4c'],['cancel','Отказ','#9aa4ad']];
const STN=k=>(ST.find(s=>s[0]===k)||['',k])[1];
const STC=k=>(ST.find(s=>s[0]===k)||['','','#999'])[2];
/* Препараты */
let STOCK=[
 {c:'P1',n:'Инсектицид микрокапсулированный',u:'мл',bal:4200,min:1500,pr:38,per:{'Тараканы':60,'Клопы':90,'Блохи':70,'Муравьи':50,'Моль':40}},
 {c:'P2',n:'Инсектицид для холодного тумана, без запаха',u:'мл',bal:2600,min:1500,pr:44,per:{'Тараканы':40,'Клопы':80,'Блохи':60}},
 {c:'P3',n:'Гель от тараканов',u:'туба',bal:14,min:10,pr:2900,per:{'Тараканы':1}},
 {c:'P4',n:'Родентицид, приманка',u:'кг',bal:3.4,min:2,pr:6800,per:{'Грызуны':0.5}},
 {c:'P5',n:'Акарицид для участка',u:'мл',bal:900,min:1200,pr:52,per:{'Клещи на участке':300}},
 {c:'P6',n:'Дезсредство на основе ЧАС',u:'л',bal:11,min:5,pr:3600,per:{'Плесень, дезинфекция':1.5}},
 {c:'P7',n:'Бахилы, перчатки, респиратор — комплект',u:'к-т',bal:46,min:20,pr:650,per:{}}
];
const PS=c=>STOCK.find(s=>s.c===c);
const useOf=p=>STOCK.filter(s=>s.per[p]).map(s=>[s.c,s.per[p]]);
/* Заявки */
const NM=['Айгерим','Сергей Петрович','Динара','Ерлан','Ольга','Тимур','Гульнара','Алексей','Жанар','Марат','Светлана','Нурлан','Асель','Виктор'];
const STR=['мкр. Самал-2, д. 33','ул. Розыбакиева, 247','мкр. Аксай-4, д. 18','пр. Абая, 150','ул. Толе би, 286','мкр. Орбита-3, д. 12','ул. Жандосова, 98','Ремизовка, ул. Горная, 41','мкр. Алмагуль, д. 9','ул. Сейфуллина, 510','Каменка, ул. Садовая, 7','мкр. Мамыр-4, д. 101','ул. Тимирязева, 42','Бутаковка, ул. Ущельная, 3'];
let JOBS=[];
(function(){const plan=[
 ['08:00','paid','BK','Тараканы','Квартира 1–2 комн.','Google'],['09:00','paid','DN','Клопы','Квартира 3–4 комн.','2ГИС'],['09:30','done','RS','Клещи на участке','Участок, 10 соток','Instagram'],
 ['10:30','work','BK','Тараканы','Кафе, ресторан','Повторный'],['11:00','road','DN','Блохи','Частный дом','OLX'],['12:00','set','RS','Грызуны','Частный дом','Google'],
 ['13:30','set','BK','Клопы','Квартира 1–2 комн.','WhatsApp'],['15:00','set','DN','Муравьи','Квартира 3–4 комн.','Google'],['16:30','new','','Тараканы','Офис','2ГИС'],
 ['17:30','new','','Плесень, дезинфекция','Квартира 3–4 комн.','Instagram'],['—','new','','Клопы','Квартира 1–2 комн.','Google'],['18:00','cancel','','Моль','Квартира 1–2 комн.','OLX']];
 plan.forEach((p,i)=>JOBS.push({id:'З-'+(2140+i),d:'14.10',t:p[0],st:p[1],dz:p[2],pest:p[3],obj:p[4],src:p[5],nm:NM[i],ph:'+7 7'+['01','07','47','77','05','02'][i%6]+' *** '+String(10+i*7)+' '+String(20+i*5),addr:STR[i],
  sum:priceOf(p[3],p[4]),pay:p[1]==='paid'?(i%2?'Kaspi':'наличные'):'',photos:['done','paid'].includes(p[1])?4+i%3:p[1]==='work'?2:0,video:['done','paid'].includes(p[1]),
  note:['Сильное заселение на кухне, соседи тоже жалуются','Ребёнок 2 года — препарат без запаха','Участок с садом, обработать вдоль забора','Постоянный клиент — плановая обработка раз в месяц: кухня и подсобка','Кошка в доме, после обработки — проветрить 3 часа','Подвал и гараж, следы на чердаке','Нужна обработка сегодня, вечером уезжают','Муравьи в ванной и на балконе','Офис 120 м², обработка после 19:00 или в субботу','Плесень в ванной и углах спальни','Перезвонить — выбирает время','Дорого, отказался'][i],
  guar:['Тараканы','Клопы','Блохи'].includes(p[3])?'повтор через 14 дней бесплатно':'—'}))})();
const JB=id=>JOBS.find(j=>j.id===id);
let curJob='З-2143';
/* Неделя — для отчётов */
const WEEK=[['08.10',9,7,214500],['09.10',11,9,287000],['10.10',8,6,176500],['11.10',10,8,251000],['12.10',6,5,148000],['13.10',4,3,92000],['14.10',12,null,null]];
let AUDIT=[
 ['14.10 11:05','Данияр','Дезинфектор','Заявки','З-2144 · выехал','статус → В пути','телефон'],
 ['14.10 10:40','Бекзат','Дезинфектор','Заявки','З-2143 · на объекте','фото «до» 3 шт.','телефон'],
 ['14.10 10:12','Руслан','Дезинфектор','Заявки','З-2142 · обработано','фото 5, видео 1, акарицид 300 мл','телефон'],
 ['14.10 09:58','Арсен','Произв. директор','Распределение','З-2146 → Бекзат','13:30','компьютер'],
 ['14.10 09:20','Мадина','Оператор','Заявки','Новая заявка З-2148 из 2ГИС','Тараканы · офис','компьютер']
];

const SC={};
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const stTag=k=>`<span class="stg" style="--sc:${STC(k)}">${STN(k)}</span>`;
const dzTag=k=>k?`<span class="dzt" style="--dc:${DC(k)}">${DN(k)}</span>`:'<span class="dzt none">не назначен</span>';
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
const todayRev=()=>JOBS.filter(j=>j.st==='paid').reduce((a,j)=>a+j.sum,0);
const todayPlan=()=>JOBS.filter(j=>j.st!=='cancel').reduce((a,j)=>a+j.sum,0);

SC.dash=()=>{const act=JOBS.filter(j=>j.st!=='cancel');
 return `<div class="hd"><div><h2>Пульт · ${TODAY}, ${NOW}</h2><p>Сколько заявок пришло и откуда, кто из дезинфекторов где сейчас, сколько обработано и оплачено, оборот за день, неделю и месяц. Всё, что сейчас собирается из блокнота, WhatsApp и Excel в конце месяца.</p></div><div class="btns"><button class="bt" onclick="exportXls('jobs')">⇩ Excel</button></div></div>
 <div class="wid">
  <div class="clk" onclick="go('leads')"><small>Заявок сегодня</small><b>${JOBS.length}</b><span>новых без дезинфектора: ${JOBS.filter(j=>j.st==='new').length}</span></div>
  <div class="clk" onclick="go('board')"><small>Выездов сегодня</small><b class="a">${act.filter(j=>j.dz).length}</b><span>${JOBS.filter(j=>['road','work'].includes(j.st)).length} сейчас в пути или на объекте</span></div>
  <div class="clk" onclick="go('money')"><small>Оплачено сегодня</small><b class="g">${tg(todayRev())}</b><span>из ${tg(todayPlan())} по заявкам дня</span></div>
  <div class="clk" onclick="go('reports')"><small>Оборот за октябрь</small><b>${tg(2186000+todayRev())}</b><span>${82+JOBS.filter(j=>j.st==='paid').length} обработки · средний чек ${tg(26300)}</span></div>
  <div class="clk" onclick="go('money')"><small>Наличные у дезинфекторов</small><b class="w">${tg(cashOnHands())}</b><span>сдать в кассу вечером</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Дезинфекторы сейчас</h3>${DZ.map(d=>{const L=JOBS.filter(j=>j.dz===d[0]&&j.st!=='cancel').sort((a,b)=>a.t.localeCompare(b.t));const now=L.find(j=>['road','work'].includes(j.st));return `<div class="dzrow clk" onclick="go('board')"><span class="dzt" style="--dc:${d[2]}">${d[1]}</span><div class="dztl">${L.map(j=>`<i class="${j.st}" title="${j.t} ${j.pest}" style="--sc:${STC(j.st)}">${j.t}</i>`).join('')}</div><em>${now?STN(now.st)+': '+esc(now.addr):'между выездами'}</em></div>`}).join('')}</div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="go('board')"><i></i><div><b>${JOBS.filter(j=>j.st==='new').length} заявки без дезинфектора</b><span>офис на 16:30, плесень на 17:30 — распределить</span></div></div>
  <div class="rf bad" onclick="go('stock')"><i></i><div><b>Акарицид для участков: 900 мл при минимуме 1 200</b><span>хватит на 3 участка — заказать</span></div></div>
  <div class="rf" onclick="go('clients')"><i></i><div><b>4 гарантийных повтора на этой неделе</b><span>клопы и тараканы — позвонить, назначить время</span></div></div>
  <div class="rf" onclick="go('money')"><i></i><div><b>Бекзат: наличные за 2 дня не сданы</b><span>${tg(43000)}</span></div></div></div></div>
 <div class="g2"><div class="pan"><h3>Заявки по источникам, октябрь</h3>${bars([['Google',38],['2ГИС',21],['Instagram',14],['OLX',9],['WhatsApp',7],['Повторные',6],['Рекомендации',4]])}</div>
 <div class="pan"><h3>По вредителям, октябрь</h3>${bars([['Тараканы',36],['Клопы',24],['Клещи на участке',11],['Блохи',9],['Грызуны',8],['Муравьи',6],['Плесень',5]])}</div></div>
 ${said('Заявка в блокнот, потом через WhatsApp дезинфекторам, дезинфектор отчитывается в WhatsApp, в блокноте отмечаем, что отработано, вечером всё в Excel, в конце месяца отчётность')}`};

/* Заявки */
let LF={q:'',st:'',src:'',dz:''};
const lsel=(k,opts,ph)=>`<select onchange="LF.${k}=this.value;render()"><option value="">${ph}</option>${opts.map(o=>`<option value="${o[0]}" ${LF[k]===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>`;
SC.leads=()=>{const L=JOBS.filter(j=>(!LF.st||j.st===LF.st)&&(!LF.src||j.src===LF.src)&&(!LF.dz||j.dz===LF.dz)&&(!LF.q||(j.nm+j.ph+j.addr+j.id).toLowerCase().includes(LF.q.toLowerCase())));
 return `<div class="hd"><div><h2>Все заявки</h2><p>Звонок, WhatsApp, Google, 2ГИС, OLX, Instagram — каждая заявка попадает сюда с источником. Оператор или вы заводите её за полминуты: клиент, адрес, вредитель, объект, время. Цена считается по прайсу.</p></div><div class="btns"><button class="bt" onclick="exportXls('jobs')">⇩ Excel</button><button class="bt p" onclick="card('newjob')">+ Заявка</button></div></div>
 <div class="flt"><input placeholder="Имя, телефон, адрес" value="${esc(LF.q)}" onchange="LF.q=this.value;render()">${lsel('st',ST.map(s=>[s[0],s[1]]),'Все статусы')}${lsel('src',SRC.map(s=>[s,s]),'Все источники')}${lsel('dz',DZ.map(d=>[d[0],d[1]]),'Все дезинфекторы')}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Заявка</th><th>Время</th><th>Клиент</th><th>Адрес</th><th>Вредитель · объект</th><th>Сумма</th><th>Источник</th><th>Дезинфектор</th><th>Статус</th></tr></thead><tbody>${L.map(j=>`<tr class="clk" onclick="openJob('${j.id}')"><td><b>${j.id}</b></td><td class="mono">${j.d} ${j.t}</td><td>${esc(j.nm)}<br><small>${j.ph}</small></td><td>${esc(j.addr)}</td><td>${j.pest}<br><small>${j.obj}</small></td><td class="mono">${tg(j.sum)}</td><td>${j.src}</td><td>${dzTag(j.dz)}</td><td>${stTag(j.st)}</td></tr>`).join('')}</tbody></table></div></div>`};
function openJob(id){curJob=id;go('job')}

/* Распределение */
SC.board=()=>{const nw=JOBS.filter(j=>j.st==='new');
 return `<div class="hd"><div><h2>Распределение · ${TODAY}</h2><p>Слева — новые заявки, справа — день каждого дезинфектора по времени. Выбрали заявку → нажали на дезинфектора: заявка с адресом, временем и вредителем сразу у него в телефоне. Видно, кто свободен и где окно.</p></div></div>
 <div class="dist"><div class="kc" style="--sc:#7c8aa5"><div class="kh"><b>Новые, без дезинфектора</b><span>${nw.length}</span></div>${nw.map(j=>`<div class="kd ${PICK===j.id?'on':''}" onclick="PICK='${j.id}';render()"><div class="kt"><b>${j.id} · ${j.t}</b><span class="src">${j.src}</span></div><div class="kr">${j.pest} · ${j.obj}</div><div class="km">${esc(j.addr)}</div><div class="kf"><span>${esc(j.nm)}</span><b>${tg(j.sum)}</b></div></div>`).join('')||'<div class="kempty">все распределены ✓</div>'}</div>
 ${DZ.map(d=>{const L=JOBS.filter(j=>j.dz===d[0]&&j.st!=='cancel').sort((a,b)=>a.t.localeCompare(b.t));return `<div class="kc dzc" style="--sc:${d[2]}"><div class="kh"><b>${d[1]}</b><span>${L.length} выезда · ${tg(L.reduce((a,j)=>a+j.sum,0))}</span></div>${PICK?`<button class="bt sm p asg" onclick="assign('${PICK}','${d[0]}')">Назначить ${PICK} →</button>`:''}${L.map(j=>`<div class="kd" onclick="openJob('${j.id}')"><div class="kt"><b>${j.t}</b>${stTag(j.st)}</div><div class="kr">${j.pest} · ${j.obj}</div><div class="km">${esc(j.addr)}</div></div>`).join('')}</div>`}).join('')}</div>
 ${said('Заявка поступает, как-то в приложение вбивается, и чтоб она уходила — я распределял между дезинфекторами, чтоб они потом видели всю заявку: адрес, дату, время, куда ехать, от каких насекомых обработка')}`};
let PICK='';
function assign(id,dz){const j=JB(id);j.dz=dz;j.st='set';PICK='';AUDIT.unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,role,'Распределение',id+' → '+DN(dz),j.t,'компьютер']);render();toast(`${id} назначена: ${DN(dz)}. Ему пришло уведомление в приложение и WhatsApp — адрес, время, вредитель.`)}

/* Карточка заявки */
SC.job=()=>{const j=JB(curJob),u=useOf(j.pest);
 return `<div class="hd"><div><h2>${j.id} · ${j.pest} · ${j.obj}</h2><p>${esc(j.nm)} · ${j.ph} · ${esc(j.addr)} · ${j.d} ${j.t} · источник ${j.src}</p></div><div class="btns"><button class="bt" onclick="go('leads')">← К заявкам</button><button class="bt" onclick="act('Звонок через IP-телефонию — разговор запишется в карточку.')">☎ Позвонить</button><button class="bt" onclick="act('WhatsApp клиенту: подтверждение времени и памятка «как подготовить квартиру».')">WhatsApp</button></div></div>
 <div class="stp">${ST.filter(s=>s[0]!=='cancel').map(s=>`<div class="${s[0]===j.st?'on':''}" style="--sc:${s[2]}" onclick="setJobSt('${j.id}','${s[0]}')"><i></i>${s[1]}</div>`).join('')}</div>
 <div class="g2 g21"><div>
  <div class="pan"><h3>Заявка</h3><div class="kv"><span>Вредитель</span><b>${j.pest}</b></div><div class="kv"><span>Объект</span><b>${j.obj}</b></div><div class="kv"><span>Метод</span><b>${j.pest==='Грызуны'?'приманки и ловушки':j.pest==='Клещи на участке'?'опрыскивание участка':'холодный туман, без запаха'}</b></div><div class="kv"><span>Дезинфектор</span><b>${dzTag(j.dz)}</b></div><div class="kv"><span>Гарантия</span><b>${j.guar}</b></div><div class="kv on"><span><strong>Сумма</strong></span><b>${tg(j.sum)}${j.pay?' · '+j.pay:''}</b></div><div class="pin">${esc(j.note)}</div></div>
  <div class="pan"><h3>Отчёт дезинфектора</h3>${j.photos?`<div class="phg">${Array.from({length:j.photos},(_,i)=>`<div class="ph0"><span>${i<2?'до':'после'}</span></div>`).join('')}${j.video?'<div class="ph0 v"><span>▶ видео</span></div>':''}</div>`:'<p class="hint">Фото «до» и «после» и видео обработки появятся здесь, когда дезинфектор отправит их из приложения.</p>'}</div>
 </div><div>
  <div class="pan"><h3>Препараты на эту обработку</h3>${u.length?u.map(x=>`<div class="kv"><span>${esc(PS(x[0]).n)}</span><b>${x[1]} ${PS(x[0]).u}</b></div>`).join(''):'<p class="hint">Без препаратов из списка.</p>'}<p class="hint">Списываются со склада, когда дезинфектор нажимает «обработано». Себестоимость: ${tg(u.reduce((a,x)=>a+x[1]*PS(x[0]).pr,0))}.</p></div>
  <div class="pan"><h3>История</h3><div class="evt"><span class="mono">09:20</span><b>Заявка</b><span>${j.src}, оператор Мадина</span></div>${j.dz?`<div class="evt"><span class="mono">09:58</span><b>Назначена</b><span>${DN(j.dz)}</span></div>`:''}${['road','work','done','paid'].includes(j.st)?'<div class="evt"><span class="mono">10:15</span><b>В пути</b><span>клиенту ушло «дезинфектор выехал»</span></div>':''}${['done','paid'].includes(j.st)?'<div class="evt"><span class="mono">11:40</span><b>Обработано</b><span>фото, видео, препараты</span></div>':''}${j.st==='paid'?`<div class="evt"><span class="mono">11:42</span><b>Оплачено</b><span>${j.pay}</span></div>`:''}</div>
 </div></div>`};
function setJobSt(id,k){const j=JB(id);if(k!=='new'&&!j.dz){toast('Сначала назначьте дезинфектора.');return}j.st=k;if(k==='paid'&&!j.pay)j.pay='Kaspi';render();toast('Статус: '+STN(k)+'.')}

/* Календарь */
SC.cal=()=>{const days=['14.10 ср','15.10 чт','16.10 пт','17.10 сб','18.10 вс','19.10 пн','20.10 вт'];const busy=(d,i)=>i===0?JOBS.filter(j=>j.dz===d&&j.st!=='cancel').length:[3,2,4,2,0,3,1][(i+d.length*3)%7]+((d==='BK')?1:0);
 return `<div class="hd"><div><h2>Календарь выездов</h2><p>Неделя по дезинфекторам: сколько выездов у каждого и где свободно. Оператор видит окна и сразу предлагает клиенту время. Гарантийные повторы ставятся сюда автоматически.</p></div></div>
 <div class="pan"><div class="tw"><table class="t calg"><thead><tr><th>Дезинфектор</th>${days.map(d=>`<th>${d}</th>`).join('')}</tr></thead><tbody>${DZ.map(d=>`<tr><td><span class="dzt" style="--dc:${d[2]}">${d[1]}</span></td>${days.map((x,i)=>{const n=busy(d[0],i);return `<td class="${n>=4?'full':n===0?'free':'busy'}">${n?n+' выезд'+(n===1?'':n<5?'а':'ов'):'свободен'}${i===2&&d[0]==='DN'?'<br><small>повтор З-2131</small>':''}</td>`}).join('')}</tr>`).join('')}</tbody></table></div></div>`};

/* Приложение дезинфектора */
let MDZ='BK',MJ='З-2143',MPH=0;
const NEXT={set:['road','Выехал'],road:['work','На объекте · фото «до»'],work:['done','Обработано · фото и видео'],done:['paid','Оплата получена']};
SC.mobile=()=>{const L=JOBS.filter(j=>j.dz===MDZ&&j.st!=='cancel').sort((a,b)=>a.t.localeCompare(b.t));const j=JB(MJ)&&JB(MJ).dz===MDZ?JB(MJ):L[0];if(j)MJ=j.id;const nx=j&&NEXT[j.st];
 return `<div class="hd"><div><h2>Приложение дезинфектора</h2><p>У дезинфектора в телефоне — только его выезды: адрес с навигацией, время, вредитель, объект, пожелания клиента. Нажимает «выехал» — клиенту уходит сообщение. На объекте — фото «до», после — фото, видео и препараты, потом оплата. Попробуйте пройти выезд.</p></div><div class="seg">${DZ.map(d=>`<a class="${MDZ===d[0]?'on':''}" onclick="MDZ='${d[0]}';MJ='';render()">${d[1]}</a>`).join('')}</div></div>
 <div class="phones3">
  <div class="mphone"><div class="mp-h">${LOGO_I}<b>Мои выезды · ${TODAY.slice(0,5)}</b></div><div class="mp-b">${L.map(x=>`<div class="m-c ${x.id===MJ?'on':''}" onclick="MJ='${x.id}';render()"><div class="m-t"><b>${x.t}</b>${stTag(x.st)}</div><div>${x.pest} · ${x.obj}</div><small>${esc(x.addr)}</small></div>`).join('')||'<p class="hint">Выездов нет.</p>'}</div><div class="mp-nav"><i class="on">Выезды</i><i>Склад</i><i>Деньги</i><i>Профиль</i></div></div>
  ${j?`<div class="mphone"><div class="mp-h"><b>${j.id} · ${j.t}</b></div><div class="mp-b">
   <div class="m-s" style="background:${STC(j.st)}">${STN(j.st)}</div>
   <div class="m-r"><span>Вредитель</span><b>${j.pest}</b></div><div class="m-r"><span>Объект</span><b>${j.obj}</b></div><div class="m-r"><span>Клиент</span><b>${esc(j.nm)}</b></div>
   <div class="m-c"><b>${esc(j.addr)}</b><div class="m-l"><a onclick="act('Открывается 2ГИС с маршрутом до адреса.')">Маршрут</a><a onclick="act('Звонок клиенту.')">Позвонить</a><a onclick="act('WhatsApp клиенту.')">WhatsApp</a></div></div>
   <div class="m-c note">${esc(j.note)}</div>
   ${['work','done','paid'].includes(j.st)?`<div class="m-c"><b>Фото и видео</b><div class="phg sm">${Array.from({length:Math.max(j.photos,j.st==='work'?2:0)},(_,i)=>`<div class="ph0"><span>${i<2?'до':'после'}</span></div>`).join('')}${j.video?'<div class="ph0 v"><span>▶</span></div>':''}</div></div>`:''}
   ${j.st==='done'?`<div class="m-c"><b>Оплата · ${tg(j.sum)}</b><div class="m-l"><a onclick="mPay('наличные')">Наличные</a><a onclick="mPay('Kaspi')">Kaspi QR</a><a onclick="mPay('перевод')">Перевод</a></div></div>`:''}
   ${nx&&j.st!=='done'?`<div class="m-btn" onclick="mNext()">${nx[1]} →</div>`:''}${j.st==='paid'?`<div class="m-ok">✓ Выезд закрыт · ${j.pay} · ${tg(j.sum)}</div>`:''}${j.st==='new'?'<p class="hint">Заявка ещё не назначена.</p>':''}
  </div></div>`:''}
 </div>
 ${said('Чтоб они потом, как обработку завершать — фото, видео, завершение, оплаты. Вот это всё')}`};
function mNext(){const j=JB(MJ);const nx=NEXT[j.st];if(!nx)return;j.st=nx[0];
 if(j.st==='work')j.photos=2;if(j.st==='done'){j.photos=5;j.video=true;useOf(j.pest).forEach(([c,q])=>{PS(c).bal=+(PS(c).bal-q).toFixed(2)});}
 AUDIT.unshift([TODAY.slice(0,5)+' '+NOW,DN(j.dz),'Дезинфектор','Заявки',j.id+' · '+STN(j.st),j.st==='done'?'фото 5, видео 1':'','телефон']);render();
 toast({road:'Клиенту ушло: «Дезинфектор выехал, будет через ~30 минут».',work:'Фото «до» загружены. Арсен видит, что дезинфектор на объекте.',done:'Фото, видео сохранены, препараты списаны со склада. Осталось отметить оплату.'}[j.st]||STN(j.st))}
function mPay(how){const j=JB(MJ);j.st='paid';j.pay=how;AUDIT.unshift([TODAY.slice(0,5)+' '+NOW,DN(j.dz),'Дезинфектор','Оплата',j.id,tg(j.sum)+' · '+how,'телефон']);render();toast(`Оплата ${tg(j.sum)} (${how}) — в пульте и в зарплате дезинфектора.${how==='наличные'?' Наличные числятся за ним до сдачи в кассу.':''}`)}

/* Клиенты и гарантия */
SC.clients=()=>`<div class="hd"><div><h2>Клиенты и гарантия</h2><p>У каждого клиента — история обработок. По тараканам, клопам и блохам — бесплатный повтор через 14 дней: система сама ставит его в календарь и напоминает. Через полгода — напоминание о профилактике: повторные заказы без рекламы.</p></div></div>
 <div class="wid"><div><small>Клиентов в базе</small><b>214</b><span>за 2 месяца работы</span></div><div><small>Гарантийных повторов на неделе</small><b class="a">4</b><span>2 клопы, 2 тараканы</span></div><div><small>Напоминаний о профилактике</small><b>12</b><span>в ноябре</span></div><div><small>Повторных заказов</small><b class="g">6%</b><span>растёт с базой</span></div></div>
 <div class="pan"><h3>Гарантийные повторы</h3><div class="tw"><table class="t"><thead><tr><th>Дата</th><th>Клиент</th><th>Первая обработка</th><th>Вредитель</th><th>Дезинфектор</th><th></th></tr></thead><tbody>${[['15.10','Ольга','01.10 · З-2087','Клопы','DN'],['16.10','Тимур','02.10 · З-2093','Тараканы','BK'],['17.10','Гульнара','03.10 · З-2101','Клопы','RS'],['18.10','Кафе «Самса Хаус»','04.10 · З-2108','Тараканы','BK']].map(r=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${dzTag(r[4])}</td><td><button class="bt sm" onclick="act('Клиенту ушло в WhatsApp: «Завтра повторная обработка по гарантии, удобно в 11:00?»')">Напомнить</button></td></tr>`).join('')}</tbody></table></div></div>`;

/* Прайс */
SC.price=()=>`<div class="hd"><div><h2>Услуги и прайс</h2><p>Цена считается автоматически: объект × вредитель. Оператор называет её клиенту сразу. Прайс меняете сами.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Объект</th>${PESTS.slice(0,6).map(p=>`<th>${p}</th>`).join('')}</tr></thead><tbody>${OBJ.map(o=>`<tr><td><b>${o}</b></td>${PESTS.slice(0,6).map(p=>`<td class="mono">${tg(priceOf(p,o))}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="hint">Клопы ×1,3, грызуны ×1,2, дезинфекция ×1,4 к базовой цене объекта. Гарантийный повтор — бесплатно.</p></div>`;

/* Деньги */
const cashOnHands=()=>43000+JOBS.filter(j=>j.st==='paid'&&j.pay==='наличные').reduce((a,j)=>a+j.sum,0);
SC.money=()=>`<div class="hd"><div><h2>Оплаты и наличные</h2><p>Каждая оплата отмечается дезинфектором на месте: наличные, Kaspi QR или перевод. Наличные числятся за ним, пока не сдаст в кассу, — ничего не теряется между блокнотом и Excel.</p></div><div class="btns"><button class="bt" onclick="exportXls('pay')">⇩ Excel</button></div></div>
 <div class="wid"><div><small>Оплачено сегодня</small><b class="g">${tg(todayRev())}</b><span>${JOBS.filter(j=>j.st==='paid').length} выезда</span></div><div><small>Обработано, ждёт оплаты</small><b class="w">${tg(JOBS.filter(j=>j.st==='done').reduce((a,j)=>a+j.sum,0))}</b><span>${JOBS.filter(j=>j.st==='done').length} выезд</span></div><div><small>Наличные у дезинфекторов</small><b>${tg(cashOnHands())}</b><span>сдать в кассу</span></div><div><small>Октябрь</small><b>${tg(2186000+todayRev())}</b><span>Kaspi 64% · наличные 28% · перевод 8%</span></div></div>
 <div class="pan"><h3>Наличные к сдаче</h3>${DZ.map((d,i)=>{const c=(i===0?43000:0)+JOBS.filter(j=>j.dz===d[0]&&j.st==='paid'&&j.pay==='наличные').reduce((a,j)=>a+j.sum,0);return `<div class="kv"><span>${dzTag(d[0])}</span><b>${tg(c)} ${c?`<button class="bt sm" onclick="act('${d[1]} сдал ${tg(c)} в кассу — в журнале отмечено, кто принял.')">Принять</button>`:''}</b></div>`}).join('')}</div>
 <div class="pan"><h3>Оплаты сегодня</h3><div class="tw"><table class="t"><thead><tr><th>Заявка</th><th>Клиент</th><th>Дезинфектор</th><th>Способ</th><th>Сумма</th></tr></thead><tbody>${JOBS.filter(j=>j.st==='paid').map(j=>`<tr class="clk" onclick="openJob('${j.id}')"><td>${j.id}</td><td>${esc(j.nm)}</td><td>${dzTag(j.dz)}</td><td>${j.pay}</td><td class="mono pos">${tg(j.sum)}</td></tr>`).join('')}</tbody></table></div></div>`;

/* Зарплата */
SC.salary=()=>`<div class="hd"><div><h2>Зарплата дезинфекторов · октябрь</h2><p>Начисляется сама по закрытым выездам: процент от суммы обработки, ставка за гарантийный повтор, минус наличные, которые не сданы. Видно, кто сколько отработал и заработал.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Дезинфектор</th><th>Выездов</th><th>Сумма обработок</th><th>Процент 35%</th><th>Повторы × 3 000 ₸</th><th>Не сдано наличных</th><th>К выплате</th></tr></thead><tbody>${DZ.map((d,i)=>{const n=[31,28,25][i]+JOBS.filter(j=>j.dz===d[0]&&j.st==='paid').length,s=[812000,748000,626000][i]+JOBS.filter(j=>j.dz===d[0]&&j.st==='paid').reduce((a,j)=>a+j.sum,0),rp=[3,2,2][i],cash=i===0?43000:0;return `<tr><td>${dzTag(d[0])}</td><td class="mono">${n}</td><td class="mono">${tg(s)}</td><td class="mono">${tg(s*0.35)}</td><td class="mono">${tg(rp*3000)}</td><td class="mono ${cash?'neg':''}">${cash?'−'+tg(cash):'—'}</td><td class="mono"><b>${tg(s*0.35+rp*3000-cash)}</b></td></tr>`}).join('')}</tbody></table></div><p class="hint">Схему оплаты (процент, фикс за выезд, бонусы) настроим так, как у вас принято.</p></div>`;

/* Склад */
SC.stock=()=>`<div class="hd"><div><h2>Склад препаратов</h2><p>Препараты списываются по норме на каждую обработку, когда дезинфектор нажимает «обработано». Видно, сколько тратит каждый, себестоимость выезда и когда заказывать.</p></div><div class="btns"><button class="bt" onclick="act('Приход препарата: что, сколько, цена — остаток обновится.')">+ Приход</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Препарат</th><th>Остаток</th><th>Минимум</th><th>Норма на обработку</th><th>Цена за ед.</th></tr></thead><tbody>${STOCK.map(s=>`<tr class="${s.bal<s.min?'rowbad':''}"><td><b>${esc(s.n)}</b></td><td class="mono ${s.bal<s.min?'neg':''}">${fmt1(s.bal)} ${s.u}</td><td class="mono">${s.min} ${s.u}</td><td>${Object.entries(s.per).map(e=>e[0]+' '+e[1]+' '+s.u).join(' · ')||'1 к-т на выезд'}</td><td class="mono">${tg(s.pr)}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Расход на выезд, октябрь</h3>${bars([['Бекзат',2860,'2 860 ₸'],['Данияр',3120,'3 120 ₸'],['Руслан',4480,'4 480 ₸']])}<p class="hint">Руслан больше на участках — акарицид дороже. Резкий рост у одного — повод проверить.</p></div>
 <div class="pan"><h3>Себестоимость обработки</h3><div class="kv"><span>Средний чек</span><b>${tg(26300)}</b></div><div class="kv"><span>Препараты</span><b>${tg(3300)}</b></div><div class="kv"><span>Дезинфектор, 35%</span><b>${tg(9200)}</b></div><div class="kv"><span>Реклама на заявку</span><b>${tg(2900)}</b></div><div class="kv on"><span><strong>Остаётся компании</strong></span><b>${tg(10900)}</b></div></div></div>
 ${said('Сколько они препарата тратят')}`;

/* Реклама */
SC.ads=()=>{const R=[['Google',38,29,712000,96000],['2ГИС',21,15,388000,42000],['Instagram',14,8,214000,60000],['OLX',9,5,118000,18000],['WhatsApp',7,6,162000,0],['Повторные',6,6,141000,0],['Рекомендации',4,4,112000,0]];
 return `<div class="hd"><div><h2>Реклама и источники</h2><p>У каждой заявки — источник. Видно, сколько заявок дал Google, 2ГИС, OLX и Instagram, сколько из них стали выездами, какая выручка и сколько стоила одна заявка. Расход на рекламу вносите раз в неделю.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Источник</th><th>Заявок</th><th>Выездов</th><th>Конверсия</th><th>Выручка</th><th>Расход</th><th>Цена заявки</th><th>Окупаемость</th></tr></thead><tbody>${R.map(r=>`<tr><td><b>${r[0]}</b></td><td class="mono">${r[1]}</td><td class="mono">${r[2]}</td><td class="mono">${Math.round(r[2]/r[1]*100)}%</td><td class="mono">${tg(r[3])}</td><td class="mono">${r[4]?tg(r[4]):'—'}</td><td class="mono">${r[4]?tg(r[4]/r[1]):'—'}</td><td class="mono">${r[4]?fmt1(r[3]/r[4])+'×':'—'}</td></tr>`).join('')}</tbody></table></div><p class="hint">Instagram запущен недавно и пока на модерации — через месяц будет видно, окупается ли он против Google.</p></div>
 ${said('Мы в основном Google продвигаем, OLX был, недавно, месяца два как подключили 2ГИС, включили таргет Instagram')}`};

/* Отчёты */
SC.reports=()=>`<div class="hd"><div><h2>Отчёты · Excel</h2><p>День, неделя, месяц — без сведения блокнота и Excel по вечерам. Любой отчёт скачивается в Excel одной кнопкой — попробуйте.</p></div></div>
 <div class="pan"><h3>Неделя</h3><div class="tw"><table class="t"><thead><tr><th>День</th><th>Заявок</th><th>Выездов</th><th>Оплачено</th></tr></thead><tbody>${WEEK.map(w=>`<tr><td class="mono">${w[0]}</td><td class="mono">${w[1]}</td><td class="mono">${w[2]==null?JOBS.filter(j=>j.dz&&j.st!=='cancel').length:w[2]}</td><td class="mono">${tg(w[3]==null?todayRev():w[3])}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g3">${[['jobs','Заявки и выезды','дата, клиент, адрес, вредитель, дезинфектор, сумма, статус'],['pay','Оплаты','способ оплаты, кто получил, сдано ли в кассу'],['sal','Зарплата','выезды и начисления по дезинфекторам'],['stk','Расход препаратов','по дезинфекторам и обработкам'],['src','Источники','заявки, выезды, выручка по рекламе'],['guar','Гарантийные повторы','кто, когда, результат']].map(r=>`<div class="pan rep"><h3>${r[1]}</h3><p class="mini">${r[2]}</p><button class="bt p sm" onclick="exportXls('${r[0]}')">⇩ Скачать Excel</button></div>`).join('')}</div>
 ${said('В неделю может отчёты делать себе — где и когда были какие заявки, звонки поступают')}`;
function exportXls(k){let head=['Заявка','Дата','Время','Клиент','Телефон','Адрес','Вредитель','Объект','Дезинфектор','Сумма','Оплата','Статус','Источник'],rows=JOBS.map(j=>[j.id,j.d,j.t,j.nm,j.ph,j.addr,j.pest,j.obj,DN(j.dz),j.sum,j.pay,STN(j.st),j.src]),name='zayavki';
 if(k==='pay'){head=['Заявка','Клиент','Дезинфектор','Способ','Сумма'];rows=JOBS.filter(j=>j.st==='paid').map(j=>[j.id,j.nm,DN(j.dz),j.pay,j.sum]);name='oplaty'}
 if(k==='stk'){head=['Препарат','Остаток','Ед.','Минимум'];rows=STOCK.map(s=>[s.n,s.bal,s.u,s.min]);name='preparaty'}
 const x='<html><head><meta charset="utf-8"></head><body><table border="1"><tr>'+head.map(h=>`<th style="background:#103b3a;color:#fff">${esc(h)}</th>`).join('')+'</tr>'+rows.map(r=>'<tr>'+r.map(c=>`<td>${esc(c)}</td>`).join('')+'</tr>').join('')+'</table></body></html>';
 try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+x],{type:'application/vnd.ms-excel'}));a.download=name+'_'+TODAY.replace(/\./g,'-')+'.xls';document.body.appendChild(a);a.click();a.remove()}catch(e){}
 toast(`Excel скачан: ${rows.length} строк.`)}

SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Стандартный пакет разработки. Один платёж — система ставится на ваш сервер и становится вашей: код, база, документация. Дальше — поддержка по необходимости, 20 $ в час, без абонплаты.</p></div></div>
 <div class="pk1"><div><small>Стандартный пакет</small><b>1 500 000 ₸</b><span>при ответе сегодня — скидка 3%: <b>1 455 000 ₸</b></span></div><div><small>Срок</small><b>около месяца</b><span>ядро — около 10 дней, всё — 4–6 недель</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>150 000 ₸</b><span>при подписании · со скидкой 145 500 ₸</span></div><div><small>Ядро · 45%</small><b>675 000 ₸</b><span>после согласования ядра · 654 750 ₸</span></div><div><small>Сдача · 45%</small><b>675 000 ₸</b><span>после полной сдачи · 654 750 ₸</span></div></div>
 <div class="mvs"><div class="mv ok"><i>1</i><b>Согласование</b><span>генеральный директор и учредитель · сегодня</span></div><div class="mv on"><i>2</i><b>Ядро · 10 дней</b><span>заявки, распределение, приложение дезинфектора, оплаты</span></div><div class="mv"><i>3</i><b>Доработка с вами</b><span>сборки, ваши правки по ходу работы</span></div><div class="mv"><i>4</i><b>WhatsApp и телефония</b><span>заявки сами попадают в систему</span></div><div class="mv"><i>5</i><b>Запуск</b><span>сервер, обучение, передача кода</span></div></div>
 <div class="pan"><h3>Ежемесячно — напрямую сервисам</h3><div class="kv"><span>WhatsApp-провайдер</span><b>≈ 10 тыс. ₸</b></div><div class="kv"><span>IP-телефония с записью</span><b>по тарифу оператора</b></div><div class="kv"><span>Сервер</span><b>≈ 10–15 тыс. ₸</b></div></div>
 ${said('После полной оплаты приложение полностью наше остаётся?','Да: код, база и документация передаются вам, система работает на вашем сервере.')}`;

const CARD={};
CARD.newjob=()=>['Новая заявка','Оператор заводит за полминуты · цена по прайсу',`<div class="form"><label>Клиент<input id="nj_n" value="Алия"></label><label>Телефон<input id="nj_p" value="+7 701 555 12 34"></label><label>Адрес<input id="nj_a" value="мкр. Жетысу-2, д. 14, кв. 8"></label><label>Время<input id="nj_t" value="18:30"></label><label>Вредитель<select id="nj_pe">${PESTS.map(p=>`<option>${p}</option>`).join('')}</select></label><label>Объект<select id="nj_o">${OBJ.map(o=>`<option>${o}</option>`).join('')}</select></label><label>Источник<select id="nj_s">${SRC.map(s=>`<option>${s}</option>`).join('')}</select></label><label>Дезинфектор<select id="nj_d"><option value="">распределить позже</option>${DZ.map(d=>`<option value="${d[0]}">${d[1]}</option>`).join('')}</select></label></div><button class="bt p" onclick="newJob()">Создать заявку</button>`];
function newJob(){const v=k=>document.getElementById('nj_'+k).value.trim();const id='З-'+(2140+JOBS.length);const pe=v('pe'),o=v('o'),dz=v('d');
 JOBS.unshift({id,d:'14.10',t:v('t')||'—',st:dz?'set':'new',dz,pest:pe,obj:o,src:v('s'),nm:v('n')||'Клиент',ph:v('p'),addr:v('a'),sum:priceOf(pe,o),pay:'',photos:0,video:false,note:'Новая заявка',guar:['Тараканы','Клопы','Блохи'].includes(pe)?'повтор через 14 дней бесплатно':'—'});
 AUDIT.unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,role,'Заявки','Новая заявка '+id,pe+' · '+o,'компьютер']);closeM();curJob=id;go(dz?'job':'board');toast(`${id}: ${pe}, ${o} — ${tg(priceOf(pe,o))}. ${dz?'Заявка у '+DN(dz)+' в телефоне.':'Распределите её на дезинфектора.'}`)}
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){if(!v)return;LF.q=v;go('leads')}

function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Производственный директор';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(role==='Дезинфектор')MDZ='BK';if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}.`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">БАРЬЕР</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='board'&&JOBS.some(j=>j.st==='new')?'<em>'+JOBS.filter(j=>j.st==='new').length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['leads','Заявки'],['board','Распределение'],['mobile','Выезды'],['money','Деньги']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Барьер';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();const a=document.getElementById('addBtn');if(a)a.style.display=allowed('leads')?'':'none';try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: заявки, выезды, оплаты и наличные — за день и месяц.'],
 ['leads','2 · Все заявки с источником: Google, 2ГИС, OLX, Instagram, WhatsApp.'],
 ['board','3 · Распределение: выбрали заявку — назначили дезинфектора.'],
 ['mobile','4 · Приложение дезинфектора: выехал → фото «до» → обработано → оплата.'],
 ['job','5 · Карточка заявки: фото, видео, препараты, история.'],
 ['money','6 · Оплаты и наличные у дезинфекторов.'],
 ['salary','7 · Зарплата считается сама по выездам.'],
 ['stock','8 · Склад: препараты списываются по норме.'],
 ['ads','9 · Реклама: какой источник окупается.'],
 ['reports','10 · Отчёты в Excel — файл скачивается.'],
 ['launch','11 · Стоимость: 1,5 млн, 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
