/* МЯСОКОМБИНАТ — единая система мясоперерабатывающего производства поверх 1С и МОБИЭС: заявки торговых представителей, операторов и дистрибьюторов в одной ленте, единая номенклатура без пересортов, автоматическая заявка на производство (заявки минус остатки и товар в пути), склады готовой продукции и реализации, рейсы с производства с приёмкой одной кнопкой, сроки хранения партий (не больше 5 дней), план выпуска и цех, веб-доступ торговому представителю с актуальными остатками, оптовики и дебиторка, интеграции с 1С и МОБИЭС. Название, продукция, клиенты и суммы вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const TODAY='26.10.2026',NOW='11:40';
const LOGO_I='<svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true"><rect x="14" y="30" width="72" height="40" rx="20" fill="currentColor"/><path d="M30 42v16M42 42v16M54 42v16M66 42v16" stroke="var(--brand2,#e0a33a)" stroke-width="5" stroke-linecap="round"/></svg>';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>«${q}»</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const tip=(h,t)=>`<div class="said bz-tip"><b>${h}</b><div class="said-a" style="margin-top:2px">${t}</div></div>`;
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
const SC={},CARD={};
const SEC=[
 {k:'top',n:'Собственнику',sub:[['dash','Пульт собственника'],['flow','Путь продукции']]},
 {k:'or',n:'Заявки',sub:[['orders','Все заявки: МОБИЭС, операторы, оптовики'],['req','Заявка на производство'],['sku','Номенклатура без пересортов']]},
 {k:'wh',n:'Склады',sub:[['wh','Остатки: ГП, в пути, реализация'],['transit','Рейсы с производства'],['shelf','Сроки хранения партий'],['inv','Инвентаризация и пересорт']]},
 {k:'pr',n:'Производство',sub:[['plan','План выпуска по сменам'],['prod','Цех: готово → на склад']]},
 {k:'tp',n:'Торговым',sub:[['tp','Торговый представитель'],['funnel','Оптовики и дистрибьюторы'],['debt','Дебиторка']]},
 {k:'sys',n:'Внедрение',sub:[['integr','1С и МОБИЭС'],['launch','Стоимость и этапы']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Собственник':{av:'ВТ',n:'Виталий',note:'Всё: заявки, склады, производство, продажи',s:ALL.slice()},
 'Оператор заявок':{av:'ОП',n:'Оператор',note:'Заявки оптовиков и дистрибьюторов, корректировки',s:['orders','req','sku','wh','funnel']},
 'Склад реализации':{av:'СР',n:'Кладовщик реализации',note:'Приёмка рейсов, остатки, сборка, сроки',s:['wh','transit','shelf','inv','orders']},
 'Производство':{av:'ПР',n:'Мастер смены',note:'Заявка на производство, план, отметка «готово»',s:['req','plan','prod','transit']},
 'Торговый представитель':{av:'ТП',n:'Ерлан · Щучинск – Кокшетау',note:'Актуальные остатки и свои заявки с телефона',s:['tp']},
 'Бухгалтерия':{av:'БХ',n:'Бухгалтер',note:'Дебиторка, обмен с 1С',s:['debt','integr','inv']}
};
let role='Собственник',cur='dash',theme='light';
/* Номенклатура: код, название, ед., остаток ГП (кг), в пути, реализация, заявлено на завтра, срок годности дней */
let SKU=[
 ['К-101','Колбаса варёная говяжья · батон','кг',220,180,310,940,10],
 ['К-102','Колбаса варёная говяжья · штучная 0,5 кг','шт',140,0,260,610,10],
 ['К-103','Колбаса варёная «Народная» · батон','кг',90,120,140,520,10],
 ['С-201','Сосиски молочные','кг',160,60,95,480,7],
 ['С-202','Сардельки говяжьи','кг',40,0,70,260,7],
 ['П-301','Колбаса полукопчёная «Краковская»','кг',310,0,420,380,20],
 ['Д-401','Деликатес · рулет куриный','кг',35,0,22,140,12]
];
const SD=c=>SKU.find(s=>s[0]===c);
/* Пульт */
const need=s=>Math.max(0,s[6]-s[3]-s[4]-s[5]+Math.round(s[6]*0.1));
SC.dash=()=>`<div class="hd"><div><h2>Пульт собственника · ${TODAY}</h2><p>Заявки на завтра, что нужно произвести, что едет с производства, что лежит на складах и сколько дней. Всё в одном окне, без захода в 1С.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('orders')"><small>Заявок на завтра</small><b class="a">${ORD.length+186}</b><span>МОБИЭС 142 · операторы 38 · сайт 6</span></div>
  <div class="clk" onclick="go('req')"><small>Произвести на завтра</small><b>${fmt(SKU.reduce((a,s)=>a+need(s),0))} кг</b><span>по ${SKU.filter(s=>need(s)>0).length} позициям</span></div>
  <div class="clk" onclick="go('transit')"><small>В пути на склад</small><b>${fmt(SKU.reduce((a,s)=>a+s[4],0))} кг</b><span>рейс 2 из 3 · прибытие 12:30</span></div>
  <div class="clk" onclick="go('shelf')"><small>Партий 4+ дней на складе</small><b>3</b><span>правило — не больше 5 дней</span></div>
  <div class="clk" onclick="go('debt')"><small>Дебиторка</small><b>${tg(18400000)}</b><span>просрочено ${tg(2100000)}</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Отгрузки за неделю, тонн</h3>${bars([['пн',11.2,'11,2'],['вт',12.4,'12,4'],['ср',10.8,'10,8'],['чт',13.1,'13,1'],['пт',14.6,'14,6'],['сб',9.2,'9,2']])}</div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="go('shelf')"><i></i><div><b>Сосиски молочные · партия от 21.10 — 5-й день</b><span>отгрузить сегодня, иначе нарушение срока</span></div></div>
  <div class="rf" onclick="go('inv')"><i></i><div><b>Пересорт: «Варёная говяжья» батон ↔ штучная</b><span>−40 кг / +80 шт — не совпало при сборке</span></div></div>
  <div class="rf" onclick="go('req')"><i></i><div><b>Заявка на производство не утверждена</b><span>до закрытия приёма — 15:00</span></div></div>
  <div class="rf" onclick="go('transit')"><i></i><div><b>Рейс 2 в пути — 180 кг варёной</b><span>торговым видно как «в пути»</span></div></div>
 </div></div>
 ${said('Вопрос стоит именно в складах: подача заявки со склада реализации на производство — вот здесь проблема')}`;

SC.flow=()=>`<div class="hd"><div><h2>Путь продукции</h2><p>Каждый килограмм виден на каждом шаге: произвели — на складе готовой продукции — в машине — на складе реализации — собрали — отгрузили. Поэтому торговый видит реальный остаток, а заявка на производство считается без ручных прикидок.</p></div></div>
 <div class="pfl" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:14px">${[['Производство','мастер жмёт «готово»','партия, вес, дата'],['Склад ГП','партия приходуется сама','срок пошёл'],['В пути','рейс 2–3 раза в день','виден торговым'],['Склад реализации','приёмка одной кнопкой','без пересортов'],['Сборка и отгрузка','по заявкам, старые партии первыми','накладная → 1С']].map((s,i)=>`<div class="pfs"><small>${i+1}</small><b>${s[0]}</b><span>${s[1]}</span><em>${s[2]}</em></div>`).join('')}</div>
 ${tip('Где сейчас теряется точность','Продукция в машине ещё не посажена на склад реализации — торговый видит «нет», хотя товар через час будет. А пересорт между похожими номенклатурами ломает остаток и заявку. В новой схеме «в пути» — отдельный остаток, а номенклатура одна на все системы.')}
 ${said('Машина 2–3 раза в день перевозит продукцию с производства на склад, по факту она ещё не посажена — и торговый не взял заявку')}`;

/* Заявки */
let ORD=[['10:52','МОБИЭС','ТП Ерлан','Магазин «Береке» · Щучинск','К-101 · 12 кг, С-201 · 6 кг','new'],['10:40','Оператор','оптовик','ТОО «Кокше Продукт»','К-101 · 120 кг, К-103 · 80 кг','ok'],['10:31','МОБИЭС','ТП Айгуль','Магазин «Сауле» · Кокшетау','К-102 · 30 шт','ok'],['10:12','WhatsApp → оператор','дистрибьютор','ИП Жумабаев · Степногорск','П-301 · 60 кг','ok'],['09:58','МОБИЭС','ТП Ерлан','Минимаркет «Ажар»','С-202 · 10 кг · нет на складе, есть в пути','wait']];
SC.orders=()=>`<div class="hd"><div><h2>Все заявки</h2><p>Заявки торговых из МОБИЭС приходят сюда сами, оптовики и дистрибьюторы — через оператора или WhatsApp. Одна лента, одна номенклатура. Если товара нет на складе, но он в пути — заявка принимается с пометкой.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Откуда</th><th>Кто</th><th>Клиент</th><th>Состав</th><th>Статус</th></tr></thead><tbody>${ORD.map(o=>`<tr class="${o[5]==='wait'?'rowwarn':''}"><td class="mono">${o[0]}</td><td>${tag(o[1],o[1]==='МОБИЭС'?'b':'')}</td><td>${o[2]}</td><td><b>${o[3]}</b></td><td><small>${o[4]}</small></td><td>${o[5]==='new'?tag('новая','w'):o[5]==='wait'?tag('ждёт рейс','w'):tag('принята','g')}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Торговые собирают по МОБИЭС, оптовики — к оператору, оператор вносит в МОБИЭС, и она отображается в 1С как заявка','МОБИЭС оставляем — интегрируемся; торговым ничего менять не нужно.')}`;

let reqOk=false;
SC.req=()=>`<div class="hd"><div><h2>Заявка на производство · на ${'27.10'}</h2><p>Считается сама: заявлено на завтра − остаток на складе реализации − в пути − на складе ГП + страховой запас 10%. Никаких «прошёл по складу, посмотрел, написал». Мастер видит утверждённую заявку у себя.</p></div><div class="btns">${reqOk?tag('утверждена 11:40','g'):`<button class="bt p" onclick="reqGo()">Утвердить и отправить в цех</button>`}</div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Позиция</th><th style="text-align:right">Заявлено</th><th style="text-align:right">Реализация</th><th style="text-align:right">В пути</th><th style="text-align:right">Склад ГП</th><th style="text-align:right">Запас 10%</th><th style="text-align:right">Произвести</th></tr></thead><tbody>${SKU.map(s=>`<tr><td><b>${s[1]}</b><br><small class="mono">${s[0]}</small></td><td class="mono" style="text-align:right">${fmt(s[6])}</td><td class="mono" style="text-align:right">−${fmt(s[5])}</td><td class="mono" style="text-align:right">${s[4]?'−'+fmt(s[4]):'—'}</td><td class="mono" style="text-align:right">−${fmt(s[3])}</td><td class="mono" style="text-align:right">+${fmt(Math.round(s[6]*0.1))}</td><td class="mono" style="text-align:right"><b>${need(s)?fmt(need(s))+' '+s[2]:'—'}</b></td></tr>`).join('')}</tbody></table></div></div>
 ${said('Не даётся правильная заявка с реализации на производство; сейчас, грубо говоря, с пальца выдувают: прошёл по складу, посмотрел, написал и скинул')}`;
function reqGo(){reqOk=true;toast('Заявка на производство утверждена: '+fmt(SKU.reduce((a,s)=>a+need(s),0))+' кг по '+SKU.filter(s=>need(s)>0).length+' позициям ушла в цех и в план смен.');render()}

SC.sku=()=>`<div class="hd"><div><h2>Номенклатура без пересортов</h2><p>Похожие позиции — батон и штучная, «говяжья» и «Народная» — разделены чётко: свой код, фото этикетки, вес, срок. Одна номенклатура для портала, МОБИЭС и 1С; соответствие кодов хранится в системе.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Код</th><th>Название</th><th>Ед.</th><th>Срок, дней</th><th>Код МОБИЭС</th><th>Код 1С</th></tr></thead><tbody>${SKU.map((s,i)=>`<tr><td class="mono"><b>${s[0]}</b></td><td>${s[1]}</td><td>${s[2]}</td><td class="mono">${s[7]}</td><td class="mono">MB-${4100+i*7}</td><td class="mono">00-0000${312+i}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Колбаса варёная из говядины — на неё три номенклатуры: варёная, штучная, «Народная»; при передаче со склада ГП на реализацию случаются пересорты')}`;
/* Склады */
SC.wh=()=>`<div class="hd"><div><h2>Остатки: ГП, в пути, реализация</h2><p>Три остатка по каждой позиции: на складе готовой продукции, в машине, на складе реализации. Торговый видит «реализация + в пути» — и берёт заявку, даже если машина ещё не разгрузилась.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Позиция</th><th style="text-align:right">Склад ГП</th><th style="text-align:right">В пути</th><th style="text-align:right">Реализация</th><th style="text-align:right">Доступно торговым</th></tr></thead><tbody>${SKU.map(s=>`<tr><td><b>${s[1]}</b></td><td class="mono" style="text-align:right">${fmt(s[3])}</td><td class="mono" style="text-align:right">${s[4]?fmt(s[4]):'—'}</td><td class="mono" style="text-align:right">${fmt(s[5])}</td><td class="mono" style="text-align:right"><b>${fmt(s[4]+s[5])} ${s[2]}</b></td></tr>`).join('')}</tbody></table></div></div>`;

let TR=[['Р-1','08:10','Ербол','К-101 · 200 кг, С-201 · 90 кг, П-301 · 150 кг','принят 08:55'],['Р-2','11:20','Ербол','К-101 · 180 кг, К-103 · 120 кг, С-201 · 60 кг','в пути'],['Р-3','15:00','Ербол','по готовности цеха','план']];
SC.transit=()=>`<div class="hd"><div><h2>Рейсы с производства на склад реализации</h2><p>Склад ГП отгружает рейс — продукция сразу видна как «в пути». Склад реализации принимает одной кнопкой: если вес или позиция не совпали, расхождение фиксируется сразу, а не всплывает пересортом в конце месяца.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Рейс</th><th>Выезд</th><th>Водитель</th><th>Груз</th><th>Статус</th><th></th></tr></thead><tbody>${TR.map((t,i)=>`<tr><td class="mono"><b>${t[0]}</b></td><td class="mono">${t[1]}</td><td>${t[2]}</td><td><small>${t[3]}</small></td><td>${t[4]==='в пути'?tag('в пути','w'):t[4]==='план'?tag('план',''):tag(t[4],'g')}</td><td>${t[4]==='в пути'?`<button class="bt p sm" onclick="trOk(${i})">Принять</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Если торговый на точке в 11–12 часов, а машина ещё в разгрузке — он просто не взял заявку','Остаток «в пути» виден торговым — заявка принимается.')}`;
function trOk(i){TR[i][4]='принят '+NOW;SKU.forEach(s=>{s[5]+=s[4];s[4]=0});toast('Рейс '+TR[i][0]+' принят на склад реализации: вес совпал, остатки обновлены, торговые видят продукцию на складе.');render()}

SC.shelf=()=>`<div class="hd"><div><h2>Сроки хранения партий</h2><p>Каждая партия — с датой выпуска. Правило: на складах не больше 5 дней. Система показывает, что отгрузить сегодня, и при сборке предлагает старые партии первыми.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Партия</th><th>Позиция</th><th>Выпуск</th><th>Склад</th><th style="text-align:right">Остаток</th><th>Дней на складе</th></tr></thead><tbody>${[['П-1021','Сосиски молочные','21.10','реализация',48,5],['П-1022','Колбаса варёная говяжья · батон','22.10','реализация',64,4],['П-1022-2','Сардельки говяжьи','22.10','ГП',18,4],['П-1024','Колбаса варёная «Народная»','24.10','реализация',90,2],['П-1026','Колбаса варёная говяжья · батон','26.10','в пути',180,0]].map(r=>`<tr class="${r[5]>=5?'rowbad':r[5]>=4?'rowwarn':''}"><td class="mono"><b>${r[0]}</b></td><td>${r[1]}</td><td class="mono">${r[2]}</td><td>${r[3]}</td><td class="mono" style="text-align:right">${r[4]} кг</td><td class="mono">${r[5]} ${r[5]>=5?'· отгрузить сегодня':''}</td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Срок не больше 5 дней','Задача из вашей заявки: продукция не должна лежать на складах завода дольше 5 дней. Партии на 4-м дне подсвечиваются, на 5-м — задача складу и уведомление вам.')}`;

SC.inv=()=>`<div class="hd"><div><h2>Инвентаризация и пересорт</h2><p>Пересчёт с телефона по зонам. Если батона меньше, а штучной больше ровно на тот же вес — система показывает это как пересорт, а не как недостачу, и предлагает исправить одним документом.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Позиция</th><th style="text-align:right">По учёту</th><th style="text-align:right">Факт</th><th>Разница</th><th>Вывод</th></tr></thead><tbody>${[['Колбаса варёная говяжья · батон','310 кг','270 кг','−40 кг','пересорт со штучной'],['Колбаса варёная говяжья · штучная 0,5 кг','260 шт','340 шт','+80 шт (= 40 кг)','пересорт с батоном'],['Сосиски молочные','95 кг','95 кг','—','совпало']].map(r=>`<tr class="${/пересорт/.test(r[4])?'rowwarn':''}"><td><b>${r[0]}</b></td><td class="mono" style="text-align:right">${r[1]}</td><td class="mono" style="text-align:right">${r[2]}</td><td class="mono">${r[3]}</td><td>${r[4]}</td></tr>`).join('')}</tbody></table></div><div class="btns l" style="margin-top:10px"><button class="bt p" onclick="act('Пересорт исправлен одним документом, в 1С ушла корректировка.')">Исправить пересорт</button></div></div>`;

/* Производство */
SC.plan=()=>`<div class="hd"><div><h2>План выпуска по сменам</h2><p>Утверждённая заявка раскладывается по сменам и линиям: варка, копчение, упаковка. Видно, успевает ли цех к рейсам на склад реализации.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Позиция</th><th>Смена</th><th>Линия</th><th style="text-align:right">План</th><th>К рейсу</th></tr></thead><tbody>${SKU.filter(s=>need(s)>0).map((s,i)=>`<tr><td><b>${s[1]}</b></td><td>${i%2?'2-я · 14:00–22:00':'1-я · 06:00–14:00'}</td><td>${/П-|Д-/.test(s[0])?'копчение':'варка'}</td><td class="mono" style="text-align:right">${fmt(need(s))} ${s[2]}</td><td>${i%2?'Р-1 завтра 08:10':'Р-3 сегодня 15:00'}</td></tr>`).join('')}</tbody></table></div></div>`;

let PB=[['П-1027','Колбаса варёная говяжья · батон',260,'варка · остывание'],['П-1028','Сосиски молочные',180,'упаковка'],['П-1029','Колбаса полукопчёная «Краковская»',120,'копчение']];
SC.prod=()=>`<div class="hd"><div><h2>Цех: готово → на склад</h2><p>Мастер отмечает партию «готово» с телефона — вес и дата, партия сама приходуется на склад готовой продукции, срок пошёл. Никаких записок и передач по телефону.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Партия</th><th>Позиция</th><th style="text-align:right">Вес</th><th>Этап</th><th></th></tr></thead><tbody>${PB.map((b,i)=>`<tr><td class="mono"><b>${b[0]}</b></td><td>${b[1]}</td><td class="mono" style="text-align:right">${b[2]} кг</td><td>${b[3]==='на складе ГП'?tag(b[3],'g'):b[3]}</td><td>${b[3]!=='на складе ГП'?`<button class="bt p sm" onclick="pbOk(${i})">Готово</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Человек на производстве отмечает, что продукция готова, нажимает кнопку — и она автоматически садится на склад, и это сразу видит торговый представитель')}`;
function pbOk(i){PB[i][3]='на складе ГП';toast(`Партия ${PB[i][0]} (${PB[i][2]} кг) на складе готовой продукции. Попадёт в рейс Р-3 в 15:00.`);render()}

/* Торговым */
SC.tp=()=>`<div class="hd"><div><h2>Торговый представитель</h2><p>Веб-доступ с телефона без установки: актуальные остатки «склад + в пути», сроки, свои заявки и долги точек. Можно оставить МОБИЭС для заявок — тогда остатки из портала передаются в МОБИЭС.</p></div></div>
 <div class="oxph-wrap"><div class="oxph"><div class="oxph-top"><small>ЕРЛАН · ${TODAY}</small><b>Что есть для заявки</b></div>
 ${SKU.slice(0,6).map(s=>`<div class="kv"><span>${s[1].replace('Колбаса ','')}</span><b class="mono">${fmt(s[4]+s[5])} ${s[2]}${s[4]?' · '+fmt(s[4])+' в пути':''}</b></div>`).join('')}
 <button class="bt p oxbig" onclick="act('Заявка точки «Береке» передана: в МОБИЭС или прямо в портал — как решите.')">Новая заявка</button></div>
 ${said('Нам нужно приложение для торгового представителя — хотя бы веб-доступ, чтобы он заходил и видел актуальные данные по складу')}</div>`;

SC.funnel=()=>`<div class="hd"><div><h2>Оптовики и дистрибьюторы</h2><p>Новые оптовые клиенты и дистрибьюторы — в воронке. В карточке сделки калькулятор: позиции, объёмы, цена по типу клиента — КП собирается сразу, без Excel.</p></div></div>
 <div class="oxk" style="grid-template-columns:repeat(5,minmax(160px,1fr))">${[['Новый',[['ТОО «Степь Маркет»','сеть 6 магазинов · Астана']]],['Пробная поставка',[['ИП Жумабаев','дистрибьютор · Степногорск']]],['КП и цены',[['ТОО «Бурабай Тур»','санатории · сезон']]],['Договор',[['ТОО «Кокше Продукт»','опт · 2 т в неделю']]],['Работаем',[['Магазины района','64 точки через торговых']]]].map(c=>`<div class="oxkc"><h4>${c[0]} <small>${c[1].length}</small></h4>${c[1].map(x=>`<div class="oxkt" onclick="act('Карточка: калькулятор позиций и цен, КП в WhatsApp одной кнопкой.')"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div>`).join('')}</div>
 ${tip('Калькулятор в сделке','Менеджер выбирает позиции и объёмы, цена считается по прайсу клиента — КП и счёт формируются сразу.')}`;

SC.debt=()=>`<div class="hd"><div><h2>Дебиторка</h2><p>Кто из оптовиков и точек должен, сколько и сколько дней. Торговый видит долг точки прямо при заявке.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Клиент</th><th style="text-align:right">Долг</th><th>Просрочка</th><th>Торговый</th></tr></thead><tbody>${[['ТОО «Кокше Продукт»',4200000,0,'оператор'],['ИП Жумабаев · Степногорск',1850000,12,'дистрибьютор'],['Магазин «Береке»',86000,0,'Ерлан'],['Минимаркет «Ажар»',142000,21,'Ерлан']].map(r=>`<tr class="${r[2]>14?'rowbad':r[2]?'rowwarn':''}"><td><b>${r[0]}</b></td><td class="mono" style="text-align:right">${fmt(r[1])}</td><td class="mono">${r[2]?r[2]+' дн.':'—'}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Лимит по клиенту','Для каждого оптовика задаётся лимит долга и отсрочка. Превысил — новая заявка уходит на согласование вам, торговый видит это сразу при заявке.')}`;

/* Внедрение */
SC.integr=()=>`<div class="hd"><div><h2>1С и МОБИЭС</h2><p>Первичка — заявки, склады, рейсы, производство — живёт в портале. 1С остаётся бухгалтерией: туда уходят реализации, поступления и корректировки. МОБИЭС остаётся у торговых, если удобнее: заявки приходят в портал, остатки уходят в МОБИЭС.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Данные</th><th>Направление</th></tr></thead><tbody>${[['Номенклатура и коды','портал ⇄ 1С и МОБИЭС'],['Остатки на старте','1С → портал, один раз'],['Заявки торговых','МОБИЭС → портал'],['Остатки для торговых (склад + в пути)','портал → МОБИЭС'],['Реализации, поступления, корректировки','портал → 1С'],['Оплаты','1С → портал']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Торговые точки ещё не умеют работать в новом — не получится убрать МОБИЭС','Оставляем МОБИЭС и интегрируемся.')}`;

SC.launch=()=>`<div class="hd"><div><h2>Стоимость и этапы</h2><p>Стандартный пакет разработки: заявки, склады с рейсами и сроками, производство, торговые и оптовики. Интеграции с 1С и МОБИЭС — отдельным блоком. Делаем под ваш процесс, правки — за сутки.</p></div></div>
 <div class="pk1"><div><small>Стандартный пакет</small><b>2 000 000 ₸</b><span>заявки, склады, производство, торговые · один раз</span></div><div><small>Интеграции 1С и МОБИЭС</small><b>800 000 ₸</b><span>итого 2 800 000 ₸ · 4–6 недель</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>280 000 ₸</b><span>при подписании</span></div><div><small>База · 45%</small><b>1 260 000 ₸</b><span>база на сервере, вы утвердили</span></div><div><small>Сдача · 45%</small><b>1 260 000 ₸</b><span>после полировки с вашей командой</span></div></div>
 <div class="g2"><div class="pan"><h3>Входит</h3>${['Заявки из МОБИЭС, от операторов и оптовиков','Автоматическая заявка на производство','Номенклатура без пересортов','Склады ГП и реализации, рейсы, сроки партий','План выпуска и отметка «готово» в цехе','Веб-доступ торговым, воронка оптовиков, дебиторка'].map(x=>`<div class="kv"><span>${x}</span><b>✓</b></div>`).join('')}</div>
 <div class="pan"><h3>Отдельно и дальше</h3><div class="kv"><span>Сервер</span><b>5–15 $ в месяц</b></div><div class="kv"><span>Сопровождение</span><b>3 месяца бесплатно</b></div><div class="kv"><span>Мессенджеры, телефония</span><b>по тарифам провайдеров</b></div></div></div>`;

/* Каркас */
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const k=SKU.find(x=>(x[0]+x[1]).toLowerCase().includes(v));if(k&&v){go('wh');return}const o=ORD.find(x=>x[3].toLowerCase().includes(v));if(o&&v){go('orders');return}toast('Ищите по позиции, коду или клиенту: «сосиски», «К-101», «Береке».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">МЯСОКОМБИНАТ</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='transit'?'<em>'+TR.filter(t=>t[4]==='в пути').length+'</em>':x[0]==='req'&&!reqOk?'<em>1</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['orders','Заявки'],['req','В цех'],['wh','Склады'],['tp','Торговый']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'МЯСОКОМБИНАТ';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: заявки, что произвести, что в пути, сроки партий.'],
 ['flow','2 · Путь продукции: цех → ГП → в пути → реализация → отгрузка.'],
 ['orders','3 · Заявки из МОБИЭС, от операторов и оптовиков — в одной ленте.'],
 ['req','4 · Заявка на производство считается сама.'],
 ['sku','5 · Одна номенклатура — без пересортов.'],
 ['transit','6 · Рейс принят одной кнопкой, «в пути» видно торговым.'],
 ['shelf','7 · Партии не дольше 5 дней на складе.'],
 ['prod','8 · Мастер жмёт «готово» — партия на складе.'],
 ['tp','9 · Торговый видит реальный остаток.'],
 ['launch','10 · 2 млн ₸ + интеграции 800 тыс., 4–6 недель.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
