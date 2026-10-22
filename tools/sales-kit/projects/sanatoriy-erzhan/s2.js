const SC={},CARD={};
/* Процедуры на сегодня: кабинет, время, гость, процедура, статус (plan / done — проведена, ждёт пациента / ok — подтверждена пациентом / miss) */
const CABS=[['К-01','Минеральные ванны','Гульнар'],['К-02','Йодобромные ванны','Гульнар'],['К-03','Душ Шарко','Айжан'],['К-04','Циркулярный душ','Айжан'],['К-05','Солевая шахта','Мария'],['К-06','Кислородный бар','Мария'],['К-07','Массаж 1','Ербол'],['К-08','Массаж 2','Ербол'],['К-09','Фитобочки, кедровые бочки','Сания'],['К-10','Физиотерапия: электрофорез, электросон','Сания'],['К-11','Прогревание','Алия'],['К-12','Косметология','Алия']];
const HOURS=['08:00','08:40','09:20','10:00','10:40','11:20','14:00','14:40','15:20','16:00'];
let PROC=[
 ['К-01','08:00','Г-1031','Минеральная ванна','ok'],['К-01','08:40','Г-1042','Минеральная ванна','ok'],['К-01','09:20','Г-1049','Минеральная ванна','done'],['К-01','10:00','Г-1052','Минеральная ванна','plan'],['К-01','14:00','Г-1050','Минеральная ванна','plan'],
 ['К-02','08:00','Г-1036','Йодобромная ванна','ok'],['К-02','09:20','Г-1055','Йодобромная ванна','done'],['К-02','10:40','Г-1047','Йодобромная ванна','plan'],
 ['К-03','08:40','Г-1050','Душ Шарко','ok'],['К-03','09:20','Г-1031','Душ Шарко','miss'],['К-03','10:00','Г-1042','Душ Шарко','plan'],
 ['К-04','08:00','Г-1049','Циркулярный душ','ok'],['К-04','10:00','Г-1036','Циркулярный душ','plan'],['К-04','14:40','Г-1038','Циркулярный душ','plan'],
 ['К-05','09:20','Г-1036','Солевая шахта','ok'],['К-05','09:20','Г-1052','Солевая шахта','ok'],['К-05','15:20','Г-1048','Солевая шахта','plan'],
 ['К-06','08:00','Г-1052','Кислородный коктейль','ok'],['К-06','08:40','Г-1049','Кислородный коктейль','done'],['К-06','11:20','Г-1031','Кислородный коктейль','plan'],
 ['К-07','09:20','Г-1050','Массаж общий','done'],['К-07','10:40','Г-1031','Массаж общий','plan'],['К-08','10:00','Г-1049','Массаж рук и ног','plan'],['К-08','08:40','Г-1055','Массаж спины','done'],
 ['К-09','11:20','Г-1036','Кедровая бочка','plan'],['К-10','08:40','Г-1038','Электросон','ok'],['К-10','14:00','Г-1055','Электрофорез','plan'],['К-11','10:00','Г-1036','Прогревание (озокерит)','plan'],['К-11','08:00','Г-1031','Прогревание (озокерит)','ok'],['К-12','15:20','Г-1042','Косметология','plan']
];
const PS={plan:['по плану',''],done:['проведена · ждёт пациента','w'],ok:['подтверждена пациентом','g'],miss:['не пришёл','r']};
const pcnt=s=>PROC.filter(p=>p[4]===s).length;
const inHouse=()=>GU.filter(g=>g.st==='in'||g.st==='out'||g.st==='arr');
const ppl=g=>/ и /.test(g.n)?2:1;

SC.dash=()=>{const occ=GU.filter(g=>g.d0<=TI-2&&g.d0+g.nn>TI-2||g.st==='in'||g.st==='arr').length;
 return `<div class="hd"><div><h2>Пульт руководителя · ${TODAY}</h2><p>Номера, медблок, ресторан и деньги — на одном экране. Данные приходят с ресепшн, из кабинетов и от пациентов сами, ничего не нужно собирать по отделам.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('chess')"><small>Загрузка номеров</small><b class="a">${Math.round(occ/ROOMS.length*100)}%</b><span>${occ} из ${ROOMS.length} номеров · ${inHouse().reduce((a,g)=>a+ppl(g),0)} гостей</span></div>
  <div class="clk" onclick="go('report')"><small>Сегодня</small><b>${GU.filter(g=>g.st==='arr').length} заезда · ${GU.filter(g=>g.st==='out').length} выезда</b><span>заезды до 14:00, выезды до 12:00</span></div>
  <div class="clk" onclick="go('cabs')"><small>Процедур сегодня</small><b>${PROC.length}</b><span>подтверждено пациентами ${pcnt('ok')} · ждут ${pcnt('done')}</span></div>
  <div class="clk" onclick="go('paid')"><small>Платные услуги, октябрь</small><b class="g">${tg(4860000)}</b><span>массаж 52% · бочки 21% · косметология 18%</span></div>
  <div class="clk" onclick="go('food')"><small>Обед сегодня</small><b>${foodN('lunch')} порций</b><span>по данным ресепшн на ${NOW}</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Загрузка по дням, номеров из ${ROOMS.length}</h3>${bars(DAYS.slice(0,10).map((d,i)=>{const n=GU.filter(g=>g.d0<=i-TI&&g.d0+g.nn>i-TI).length;return [d+(i<TI?'.10':i<12?'.10':'.11'),n,String(n)]}))}</div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="go('cabs')"><i></i><div><b>Душ Шарко 09:20 — пациент не пришёл</b><span>Г-1031 · Айгуль Сапарова · процедура перенесена</span></div></div>
  <div class="rf" onclick="go('nurse')"><i></i><div><b>${pcnt('done')} процедуры ждут подтверждения пациентом</b><span>без подтверждения процедура не идёт в выработку медсестры</span></div></div>
  <div class="rf" onclick="go('med')"><i></i><div><b>2 заезда — главному врачу</b><span>Асем Нурланова и Серик Жумабаев · назначить программу</span></div></div>
  <div class="rf" onclick="go('hk')"><i></i><div><b>Номер 204 — заезд сегодня, уборка не закончена</b><span>хаускипинг · Айнур</span></div></div>
  <div class="rf" onclick="go('wmed')"><i></i><div><b>Массажное масло — на 5 дней</b><span>расход 0,54 л в день · заказать</span></div></div>
 </div></div>
 ${said('Нам сейчас самая основа — медблок','Медблок в базе: программы, автораспределение, кабинеты, планшеты медсестёр и подтверждение с телефона.')}`};

SC.report=()=>`<div class="hd"><div><h2>Отчёты: заезды и выезды</h2><p>Кто приехал, кто и когда выезжает, по какой путёвке и программе, сколько оплачено. Любой отчёт — за день, неделю или период, с выгрузкой в Excel.</p></div><div class="btns"><button class="bt" onclick="act('Отчёт выгружен в Excel.')">Excel</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Гость</th><th>Номер</th><th>Заезд</th><th>Выезд</th><th>Программа</th><th>Статус</th><th style="text-align:right">Платные услуги</th></tr></thead><tbody>${GU.filter(g=>g.st!=='book').concat(GU.filter(g=>g.st==='book')).map(g=>`<tr class="clk" onclick="card('g','${g.id}')"><td><b>${g.n}</b><br><small class="mono">${g.id}</small></td><td class="mono">${g.room}</td><td class="mono">${dd(g.d0)}</td><td class="mono">${dd(g.d0+g.nn)}</td><td>${PRG[g.prog].n}</td><td>${tag(...ST[g.st])}</td><td class="mono" style="text-align:right">${fmt(g.paid.reduce((a,p)=>a+p[1]*p[2],0))}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('В отчёте должно быть: кто приехал, кто когда выехал')}`;
const dd=o=>{const i=TI+o;if(i<0)return (20+i)+'.10';if(i<DAYS.length)return DAYS[i]+(i<12?'.10':'.11');return String(i-11).padStart(2,'0')+'.11'};

/* Шахматка */
SC.chess=()=>`<div class="hd"><div><h2>Шахматка номеров</h2><p>Номера по дням, как в гостинице: брони, проживающие, заезды и выезды. Нажмите на гостя — откроется карточка; на свободную клетку — новая бронь с путёвкой.</p></div><div class="btns"><button class="bt p" onclick="act('Новая бронь: гость, даты, номер, путёвка и программа.')">+ Бронь</button></div></div>
 <div class="pan"><div class="chs" style="--n:${DAYS.length}"><div class="ch-h">Номер</div>${DAYS.map((d,i)=>`<div class="ch-h ${i===TI?'today':''}">${d}</div>`).join('')}
 ${ROOMS.map(r=>{let cells='';for(let i=0;i<DAYS.length;i++){const g=GU.find(x=>x.room===r[0]&&x.d0<=i-TI&&x.d0+x.nn>i-TI);if(g&&(g.d0===i-TI||i===0)){const span=Math.min(g.d0+g.nn-(i-TI),DAYS.length-i);cells+=`<div class="ch-b ${g.st}" style="grid-column:span ${span}" onclick="card('g','${g.id}')"><b>${g.n.split(' ')[0]}</b> <small>${PRG[g.prog].n}</small></div>`;i+=span-1}else cells+=`<div class="ch-e ${i===TI?'today':''}" onclick="act('Свободно: ${r[0]}, ${DAYS[i]} — оформить бронь.')"></div>`}
 return `<div class="ch-r"><b class="mono">${r[0]}</b><small>${r[1]} · ${r[2]} м.</small></div>${cells}`}).join('')}</div>
 <div class="chl"><span class="ch-b in">проживает</span><span class="ch-b arr">заезд сегодня</span><span class="ch-b out">выезд сегодня</span><span class="ch-b book">бронь</span></div></div>
 ${said('У нас будет шахматка, как у гостиниц, и медблок — основные две функции')}`;

/* Карточка гостя */
CARD.g=id=>{const g=GD(id),pr=PRG[g.prog];const ps=PROC.filter(p=>p[2]===id);
 return [`${g.n}`,`${g.id} · номер ${g.room} · ${dd(g.d0)}–${dd(g.d0+g.nn)} · ${tag(...ST[g.st])}`,
 `<div class="kv"><span>Путёвка</span><b>${g.nn} ночей · проживание, 5-разовое питание, программа</b></div><div class="kv"><span>Программа</span><b>${pr.n}</b></div><div class="kv"><span>Оплата путёвки</span><b>оплачено полностью при заезде</b></div>
 <h3 style="margin-top:12px">Процедуры сегодня</h3>${ps.length?ps.map(p=>`<div class="kv"><span>${p[1]} · ${p[3]} · ${p[0]}</span><b>${tag(...PS[p[4]])}</b></div>`).join(''):'<p class="hint">Программа ещё не назначена врачом.</p>'}
 <h3 style="margin-top:12px">Фолио: платные услуги</h3>${g.paid.length?g.paid.map(p=>`<div class="kv"><span>${p[0]} × ${p[1]}</span><b class="mono">${tg(p[1]*p[2])}</b></div>`).join(''):'<p class="hint">Пока нет.</p>'}
 <div class="btns l" style="margin-top:10px">${g.st==='arr'?`<button class="bt p" onclick="checkIn('${g.id}')">Заселить</button>`:''}<button class="bt" onclick="closeM();go('contract')">Договор</button><button class="bt" onclick="act('Платная услуга добавлена в фолио.')">+ Платная услуга</button></div>`]};
function checkIn(id){const g=GD(id);g.st='in';closeM();toast(`${g.n} заселён(а) в ${g.room}. Карточка ушла на медблок — главный врач видит нового пациента; ресторан получил +${ppl(g)} к обеду.`);render()}

SC.guest=()=>{const g=GD('Г-1050'),pr=PRG[g.prog];
 return `<div class="hd"><div><h2>Карточка гостя и путёвка</h2><p>Одна карточка на весь заезд: путёвка (проживание, питание, программа лечения), процедуры и их статус, платные услуги в фолио, договор. Ресепшн, медблок и ресторан видят одну и ту же карточку.</p></div></div>
 <div class="g2"><div class="pan"><h3>${g.n} · ${g.id}</h3><div class="kv"><span>Номер</span><b>${g.room} · Люкс VIP · 2 гостя</b></div><div class="kv"><span>Даты</span><b>${dd(g.d0)} – ${dd(g.d0+g.nn)} · ${g.nn} ночей</b></div><div class="kv"><span>Путёвка</span><b>${tg(1260000)} · оплачено</b></div><div class="kv"><span>Программа</span><b>${pr.n}</b></div><div class="kv"><span>Питание</span><b>5 раз в день · включено · диетический стол</b></div>
 <h3 style="margin-top:12px">Входит в путёвку</h3>${pr.pr.map(p=>`<div class="kv"><span>${p[0]}</span><b>${p[1]} раз</b></div>`).join('')}</div>
 <div class="pan"><h3>Фолио: платные услуги</h3>${g.paid.map(p=>`<div class="kv"><span>${p[0]} × ${p[1]}</span><b class="mono">${tg(p[1]*p[2])}</b></div>`).join('')}<div class="kv"><span><b>К оплате при выезде</b></span><b class="mono">${tg(g.paid.reduce((a,p)=>a+p[1]*p[2],0))}</b></div>
 <div class="btns l" style="margin-top:10px"><button class="bt" onclick="card('g','${g.id}')">Процедуры сегодня</button><button class="bt" onclick="go('contract')">Договор</button></div>
 ${tip('Путёвка и платные услуги','Всё, что входит в путёвку, — бесплатно и расписано программой. Платное гость покупает по желанию: на ресепшн, у медсестры или сам в телефоне; сумма копится в фолио и закрывается при выезде.')}</div></div>
 ${said('Одна путёвка, просто платная процедура уже по желанию клиента — что хочет, то и покупает')}`};

SC.contract=()=>{const g=GD('Г-1047');
 return `<div class="hd"><div><h2>Договор при заезде</h2><p>Договор заполняется из карточки гостя автоматически: данные гостя, номер, даты, путёвка, программа, сумма. Гость оплачивает — ресепшн печатает договор и подписывает. Шаблон договора — ваш.</p></div><div class="btns"><button class="bt p" onclick="act('Договор отправлен на печать.')">Печать</button></div></div>
 <div class="pan dct"><h3 style="text-align:center">ДОГОВОР № С-2026-1047<br><small>на оказание санаторно-курортных услуг</small></h3>
 <p>г. Алматы · ${TODAY}</p>
 <p>Санаторий (Исполнитель) и <b>${g.n}</b> (Гость) заключили настоящий договор о нижеследующем.</p>
 <p><b>1. Предмет.</b> Исполнитель предоставляет Гостю путёвку: проживание в номере <b>${g.room}</b> (Стандарт) с <b>${dd(g.d0)}</b> по <b>${dd(g.d0+g.nn)}</b> (${g.nn} ночей), пятиразовое питание и программу лечения «<b>${PRG[g.prog].n}</b>» по назначению врача.</p>
 <p><b>2. Стоимость.</b> Стоимость путёвки — <b>${tg(450000)}</b>, оплачена полностью при заезде. Платные процедуры оплачиваются отдельно по прейскуранту.</p>
 <p><b>3. Правила.</b> Гость соблюдает распорядок и назначения врача, подтверждает получение процедур в мобильном приложении.</p>
 <div class="g2" style="margin-top:14px"><div><small>Исполнитель</small><br>________________</div><div><small>Гость</small><br>________________ ${g.n}</div></div></div>
 ${said('Клиент приезжает, полностью оплачивает, и потом договор подписываем')}`};
