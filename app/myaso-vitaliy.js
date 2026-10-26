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
 {k:'top',n:'Собственнику',sub:[['dash','Пульт собственника'],['comms','Все каналы связи'],['flow','Путь продукции']]},
 {k:'or',n:'Заявки',sub:[['orders','Все заявки: МОБИЭС, операторы, оптовики'],['req','Заявка на производство'],['sku','Номенклатура без пересортов']]},
 {k:'wh',n:'Склады',sub:[['wh','Остатки: ГП, в пути, реализация'],['transit','Рейсы с производства'],['shelf','Сроки хранения партий'],['inv','Инвентаризация и пересорт']]},
 {k:'pr',n:'Производство',sub:[['pfunnel','Воронка производства'],['plan','План выпуска по сменам'],['prod','Цех: готово → на склад']]},
 {k:'tp',n:'Торговым',sub:[['tp','Торговый представитель'],['funnel','Воронка лидов и калькулятор'],['debt','Дебиторка']]},
 {k:'sys',n:'Внедрение',sub:[['integr','1С и МОБИЭС'],['launch','Стоимость и этапы']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Собственник':{av:'ВТ',n:'Виталий',note:'Всё: заявки, склады, производство, продажи',s:ALL.slice()},
 'Оператор заявок':{av:'ОП',n:'Оператор',note:'Все каналы, заявки, лиды, корректировки',s:['comms','orders','req','sku','wh','funnel']},
 'Склад реализации':{av:'СР',n:'Кладовщик реализации',note:'Приёмка рейсов, остатки, сборка, сроки',s:['wh','transit','shelf','inv','orders']},
 'Производство':{av:'ПР',n:'Мастер смены',note:'Заявка на производство, план, отметка «готово»',s:['pfunnel','req','plan','prod','transit']},
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

/* ===== Доработки 26.10: каналы связи, воронки производства и лидов, калькулятор, инвентаризация ===== */
/* Все каналы связи */
const CHN={wa:['WhatsApp','#1f8a5b'],tg:['Telegram','#2a8bd2'],ig:['Instagram','#c13584'],ph:['Телефония','#5a1a1f'],em:['Почта','#6b7280'],mb:['МОБИЭС','#c98a1e'],st:['Сайт','#1e2228']};
const chTag=k=>`<span class="srct" style="--sc:${CHN[k][1]}">${CHN[k][0]}</span>`;
let CV=[
 {id:'cv1',ch:'wa',who:'ТОО «Кокше Продукт» · Асель',last:'Можно добавить ещё 40 кг «Народной» к завтрашней?',t:'11:38',un:2,mgr:'Оператор',msgs:[['in','10:02','Доброе утро! Заявка на завтра как обычно'],['out','10:05','Принято: К-101 · 120 кг, К-103 · 80 кг'],['in','11:38','Можно добавить ещё 40 кг «Народной» к завтрашней?']]},
 {id:'cv2',ch:'ph',who:'Минимаркет «Ажар»',last:'Входящий звонок 2:14 · запись',t:'11:21',un:0,mgr:'Ерлан',msgs:[['in','11:21','Звонок 2:14 · «Сардельки будут сегодня?» · запись прикреплена'],['out','11:23','Задача: проверить рейс Р-2 и перезвонить']]},
 {id:'cv3',ch:'mb',who:'ТП Ерлан · Магазин «Береке»',last:'Заявка: К-101 · 12 кг, С-201 · 6 кг',t:'10:52',un:1,mgr:'Ерлан',msgs:[['in','10:52','Заявка из МОБИЭС: К-101 · 12 кг, С-201 · 6 кг']]},
 {id:'cv4',ch:'ig',who:'@stepmarket_astana',last:'Здравствуйте, вы работаете с сетями в Астане?',t:'10:30',un:1,mgr:'—',msgs:[['in','10:30','Здравствуйте, вы работаете с сетями в Астане?']]},
 {id:'cv5',ch:'tg',who:'ИП Жумабаев · Степногорск',last:'Пришлите прайс на ноябрь',t:'09:47',un:0,mgr:'Оператор',msgs:[['in','09:47','Пришлите прайс на ноябрь'],['out','09:50','Прайс_ноябрь.pdf']]},
 {id:'cv6',ch:'em',who:'zakupki@burabay-tour.kz',last:'Запрос КП на сезон: санатории Бурабая',t:'09:12',un:1,mgr:'—',msgs:[['in','09:12','Запрос КП на поставку колбасных изделий в 4 санатория на сезон']]},
 {id:'cv7',ch:'st',who:'Форма на сайте · Тимур',last:'Хочу стать дистрибьютором в Кокшетау',t:'вчера',un:0,mgr:'Оператор',msgs:[['in','вчера','Хочу стать дистрибьютором в Кокшетау, какие условия?']]}
];
let cvF='all',cvSel='cv1';
SC.comms=()=>{const list=CV.filter(c=>cvF==='all'||c.ch===cvF),c=CV.find(x=>x.id===cvSel)||list[0];
 return `<div class="hd"><div><h2>Все каналы связи</h2><p>WhatsApp, Telegram, Instagram, звонки телефонии, почта, сайт и заявки МОБИЭС — в одном окне. Каждый диалог привязан к клиенту и сделке, звонки записываются, из любого сообщения — заявка, задача или сделка одной кнопкой.</p></div></div>
 <div class="oxf">${[['all','Все',CV.length]].concat(Object.keys(CHN).map(k=>[k,CHN[k][0],CV.filter(x=>x.ch===k).length])).map(f=>`<button class="oxc ${cvF===f[0]?'on':''}" onclick="cvF='${f[0]}';render()">${f[1]} <b>${f[2]}</b></button>`).join('')}</div>
 <div class="cvw"><div class="cvl">${list.map(x=>`<div class="cvi ${x.id===(c&&c.id)?'on':''}" onclick="cvSel='${x.id}';CV.find(y=>y.id==='${x.id}').un=0;render()"><div>${chTag(x.ch)} <small>${x.t}</small></div><b>${x.who}</b><span>${x.last}</span>${x.un?`<em>${x.un}</em>`:''}</div>`).join('')}</div>
 <div class="cvc">${c?`<div class="cvh"><div><b>${c.who}</b><small>${CHN[c.ch][0]} · ответственный: ${c.mgr}</small></div><div class="btns"><button class="bt sm" onclick="act('Заявка создана из сообщения: позиции распознаны, на завтра.')">→ Заявка</button><button class="bt sm" onclick="go('funnel')">→ Сделка</button><button class="bt sm" onclick="act('Задача поставлена с напоминанием.')">→ Задача</button></div></div>
  <div class="cvm">${c.msgs.map(m=>`<div class="msg ${m[0]}"><span>${m[2]}</span><small>${m[1]}</small></div>`).join('')}</div>
  <div class="cvin"><input placeholder="Ответить в ${CHN[c.ch][0]}…" onkeydown="if(event.key==='Enter'&&this.value){CV.find(y=>y.id==='${c.id}').msgs.push(['out','${NOW}',this.value]);render()}"><button class="bt p sm" onclick="const i=this.previousElementSibling;if(i.value){CV.find(y=>y.id==='${c.id}').msgs.push(['out','${NOW}',i.value]);render()}">Отправить</button></div>`:''}</div></div>
 ${tip('Каналы','Подключаем то, чем вы пользуетесь: номера WhatsApp, Telegram, Instagram, IP-телефонию с записью звонков, почту и форму сайта. Заявки МОБИЭС приходят в эту же ленту.')}`};

/* Воронка производства */
const PFS=[['ok','Заявка утверждена'],['raw','Сырьё выдано'],['mince','Фарш / куттер'],['form','Формовка'],['heat','Термообработка'],['cool','Охлаждение'],['pack','Упаковка'],['gp','На складе ГП']];
let PF=[
 {id:'П-1030',sku:'К-101',kg:330,st:'ok',sh:'1-я',who:'Мастер Канат',t:'06:00'},
 {id:'П-1031',sku:'К-103',kg:230,st:'raw',sh:'1-я',who:'Мастер Канат',t:'06:20'},
 {id:'П-1032',sku:'С-201',kg:220,st:'mince',sh:'1-я',who:'Мастер Канат',t:'06:40'},
 {id:'П-1027',sku:'К-102',kg:280,st:'heat',sh:'1-я',who:'Мастер Канат',t:'05:10'},
 {id:'П-1028',sku:'С-202',kg:180,st:'pack',sh:'ночная',who:'Мастер Айдос',t:'02:00'},
 {id:'П-1026',sku:'П-301',kg:150,st:'cool',sh:'ночная',who:'Мастер Айдос',t:'вчера 22:00'},
 {id:'П-1025',sku:'К-101',kg:260,st:'gp',sh:'ночная',who:'Мастер Айдос',t:'вчера 20:00'}
];
const REC={'К-101':[['Говядина жилованная','62%'],['Шпик','12%'],['Вода/лёд','18%'],['Специи, соль','3%'],['Оболочка','—']],'К-103':[['Говядина','48%'],['Курица МДМ','22%'],['Вода/лёд','24%'],['Специи','3%']],'С-201':[['Говядина','40%'],['Курица','30%'],['Молоко сухое','4%'],['Вода/лёд','22%']]};
SC.pfunnel=()=>`<div class="hd"><div><h2>Воронка производства</h2><p>Каждая партия идёт по этапам цеха: от утверждённой заявки до склада ГП. Нажмите на карточку — откроется партия: рецептура, списанное сырьё, ответственный, время этапов, кнопка «следующий этап».</p></div></div>
 <div class="oxk" style="grid-template-columns:repeat(8,minmax(140px,1fr))">${PFS.map(f=>`<div class="oxkc"><h4>${f[1]} <small>${PF.filter(p=>p.st===f[0]).length}</small></h4>${PF.filter(p=>p.st===f[0]).map(p=>`<div class="oxkt" onclick="card('pf','${p.id}')"><b>${SD(p.sku)[1].replace('Колбаса ','')}</b><span>${p.id} · ${p.kg} кг</span><small>${p.sh} смена · ${p.who}</small></div>`).join('')}</div>`).join('')}</div>
 <div class="g2"><div class="pan"><h3>Сегодня по цеху</h3>${bars(PFS.map(f=>[f[1],PF.filter(p=>p.st===f[0]).reduce((a,p)=>a+p.kg,0),fmt(PF.filter(p=>p.st===f[0]).reduce((a,p)=>a+p.kg,0))+' кг']))}</div><div class="pan"><h3>Узкое место</h3><div class="kv"><span>Термообработка</span><b>камера 2 занята до 12:40</b></div><div class="kv"><span>Ближайший рейс</span><b>Р-3 в 15:00 · успеваем 4 партии</b></div></div></div>`;
CARD.pf=id=>{const p=PF.find(x=>x.id===id),s=SD(p.sku),i=PFS.findIndex(f=>f[0]===p.st),r=REC[p.sku]||REC['К-101'];
 return [`Партия ${p.id} · ${s[1]}`,`${p.kg} кг · ${p.sh} смена · ${p.who} · этап: ${PFS[i][1]}`,
 `<div class="pfst">${PFS.map((f,j)=>`<span class="${j<i?'done':j===i?'cur':''}">${f[1]}</span>`).join('')}</div>
 <div class="g2" style="margin-top:10px"><div><h3>Рецептура</h3>${r.map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div><div><h3>Сырьё списано</h3>${i>=1?r.slice(0,3).map(x=>`<div class="kv"><span>${x[0]}</span><b class="mono">${Math.round(p.kg*parseFloat(x[1])/100)} кг</b></div>`).join(''):'<p class="hint">Спишется при выдаче сырья.</p>'}</div></div>
 <h3 style="margin-top:10px">Журнал</h3><div class="kv"><span>${p.t}</span><b>${PFS[0][1]} · из заявки на 27.10</b></div>${i>0?`<div class="kv"><span>+40 мин</span><b>${PFS[1][1]} · кладовщик сырья</b></div>`:''}
 <div class="btns l" style="margin-top:10px">${i<PFS.length-1?`<button class="bt p" onclick="pfNext('${p.id}')">Готово → ${PFS[i+1][1]}</button>`:tag('на складе ГП · ждёт рейс','g')}</div>`]};
function pfNext(id){const p=PF.find(x=>x.id===id),i=PFS.findIndex(f=>f[0]===p.st);p.st=PFS[i+1][0];if(p.st==='gp'){const s=SD(p.sku);s[3]+=p.kg}closeM();toast(`${p.id}: «${PFS[i+1][1]}».`+(p.st==='raw'?' Сырьё списано по рецептуре.':p.st==='gp'?' Партия на складе ГП, срок пошёл, попадёт в ближайший рейс.':''));render()}

/* Воронка лидов + калькулятор */
const LFS=[['new','Новый лид'],['ct','Контакт'],['tr','Дегустация / пробная поставка'],['kp','КП и цены'],['dg','Договор'],['go','Первая поставка']];
let LD=[
 {id:'Л-301',n:'ТОО «Степь Маркет»',d:'сеть 6 магазинов · Астана',src:'ig',st:'new',type:'сеть'},
 {id:'Л-298',n:'zakupki@burabay-tour.kz',d:'4 санатория Бурабая · сезон',src:'em',st:'ct',type:'HoReCa'},
 {id:'Л-295',n:'ИП Жумабаев',d:'дистрибьютор · Степногорск',src:'tg',st:'tr',type:'дистрибьютор'},
 {id:'Л-290',n:'Тимур · Кокшетау',d:'хочет стать дистрибьютором',src:'st',st:'kp',type:'дистрибьютор'},
 {id:'Л-287',n:'ТОО «Кокше Продукт»',d:'опт · 2 т в неделю',src:'wa',st:'dg',type:'опт'},
 {id:'Л-280',n:'Магазин «Сауле»',d:'через торгового · Кокшетау',src:'mb',st:'go',type:'розница'}
];
const PRICE={'К-101':2650,'К-102':1450,'К-103':2190,'С-201':2380,'С-202':2560,'П-301':3890,'Д-401':4200};
const DISC={'розница':0,'опт':8,'дистрибьютор':12,'сеть':6,'HoReCa':5};
let CALC={'К-101':120,'К-103':80,'С-201':40},calcLead='Л-287',calcDel='своя машина · 0 ₸';
const calcTot=t=>{const sub=Object.entries(CALC).reduce((a,[k,q])=>a+PRICE[k]*q,0),d=Math.round(sub*(DISC[t]||0)/100),del=/0 ₸/.test(calcDel)?0:25000;return {sub,d,del,tot:sub-d+del}};
SC.funnel=()=>`<div class="hd"><div><h2>Воронка лидов</h2><p>Новые оптовики, сети, дистрибьюторы и HoReCa — из всех каналов. Нажмите на карточку — откроется сделка: история, переписка, калькулятор заказа с ценой по типу клиента и кнопки КП и счёта в WhatsApp.</p></div></div>
 <div class="oxk" style="grid-template-columns:repeat(6,minmax(150px,1fr))">${LFS.map(f=>`<div class="oxkc"><h4>${f[1]} <small>${LD.filter(l=>l.st===f[0]).length}</small></h4>${LD.filter(l=>l.st===f[0]).map(l=>`<div class="oxkt" onclick="calcLead='${l.id}';card('ld','${l.id}')"><b>${l.n}</b><span>${l.d}</span><small>${CHN[l.src][0]} · ${l.type}</small></div>`).join('')}</div>`).join('')}</div>
 <div class="pan"><h3>Конверсия за октябрь</h3>${bars([['Лиды',48,'48'],['Контакт',36,'36'],['Пробная поставка',17,'17'],['КП',14,'14'],['Договор',8,'8'],['Первая поставка',6,'6']])}</div>`;
CARD.ld=id=>{const l=LD.find(x=>x.id===id),i=LFS.findIndex(f=>f[0]===l.st),t=calcTot(l.type);
 return [`${l.n}`,`${l.id} · ${l.d} · ${CHN[l.src][0]} · этап: ${LFS[i][1]}`,
 `<div class="pfst">${LFS.map((f,j)=>`<span class="${j<i?'done':j===i?'cur':''}">${f[1]}</span>`).join('')}</div>
 <h3 style="margin-top:12px">Калькулятор заказа · тип клиента: ${l.type} (скидка ${DISC[l.type]||0}%)</h3>
 <div class="tw"><table class="t"><thead><tr><th>Позиция</th><th style="text-align:right">Цена</th><th style="text-align:right">Кол-во</th><th style="text-align:right">Сумма</th></tr></thead><tbody>${SKU.map(s=>`<tr><td>${s[1]}</td><td class="mono" style="text-align:right">${fmt(PRICE[s[0]])}</td><td style="text-align:right"><input class="bz-qty" type="number" min="0" value="${CALC[s[0]]||0}" onchange="CALC['${s[0]}']=+this.value||0;card('ld','${l.id}')"> ${s[2]}</td><td class="mono" style="text-align:right">${fmt(PRICE[s[0]]*(CALC[s[0]]||0))}</td></tr>`).join('')}</tbody></table></div>
 <div class="kv"><span>Доставка</span><b><select onchange="calcDel=this.value;card('ld','${l.id}')">${['своя машина · 0 ₸','межгород · 25 000 ₸'].map(x=>`<option ${x===calcDel?'selected':''}>${x}</option>`).join('')}</select></b></div>
 <div class="kv"><span>Сумма</span><b class="mono">${tg(t.sub)}</b></div><div class="kv"><span>Скидка ${DISC[l.type]||0}%</span><b class="mono">−${tg(t.d)}</b></div><div class="kv"><span>Доставка</span><b class="mono">${tg(t.del)}</b></div><div class="kv"><span><b>Итого</b></span><b class="mono">${tg(t.tot)}</b></div>
 <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="act('КП на ${tg(t.tot)} собрано и отправлено в ${CHN[l.src][0]}.')">КП в ${CHN[l.src][0]}</button><button class="bt" onclick="act('Счёт на ${tg(t.tot)} выставлен и отправлен клиенту.')">Счёт</button>${i<LFS.length-1?`<button class="bt" onclick="ldNext('${l.id}')">→ ${LFS[i+1][1]}</button>`:''}</div>`]};
function ldNext(id){const l=LD.find(x=>x.id===id),i=LFS.findIndex(f=>f[0]===l.st);l.st=LFS[i+1][0];closeM();toast(`${l.n} → «${LFS[i+1][1]}».`+(l.st==='go'?' Клиент добавлен в заявки и дебиторку.':''));render()}

/* Инвентаризация — пошагово */
let INV={step:0,zone:'Склад реализации · камера 1',cnt:{'К-101':270,'К-102':340,'К-103':140,'С-201':95,'С-202':70,'П-301':420,'Д-401':22},done:{}};
const INVZ=['Склад реализации · камера 1','Склад реализации · камера 2','Склад ГП'];
const invDiff=s=>(INV.cnt[s[0]]??s[5])-s[5];
SC.inv=()=>{const st=['1 · Зона','2 · Пересчёт','3 · Расхождения','4 · Провести'];const counted=Object.keys(INV.done).length;
 return `<div class="hd"><div><h2>Инвентаризация</h2><p>Пошагово, с телефона кладовщика: выбрать зону → пересчитать позиции кнопками «+/−» или сканером → система сама находит расхождения и узнаёт пересорт → провести одним документом, корректировка уходит в 1С.</p></div></div>
 <div class="pfst big">${st.map((x,i)=>`<span class="${i<INV.step?'done':i===INV.step?'cur':''}" onclick="INV.step=${i};render()">${x}</span>`).join('')}</div>
 ${INV.step===0?`<div class="g3">${INVZ.map(z=>`<div class="pan clk invz ${z===INV.zone?'on':''}" onclick="INV.zone='${z}';INV.step=1;render()"><h3>${z}</h3><div class="kv"><span>Позиций</span><b>${SKU.length}</b></div><div class="kv"><span>Последняя</span><b>${z.includes('ГП')?'19.10':'24.10'}</b></div><button class="bt p sm">Начать</button></div>`).join('')}</div>`:''}
 ${INV.step===1?`<div class="pan"><h3>${INV.zone} · посчитано ${counted} из ${SKU.length}</h3><div class="bz-occ" style="margin-bottom:10px"><i style="width:${counted/SKU.length*100}%"></i></div>${SKU.map(s=>`<div class="invr ${INV.done[s[0]]?'ok':''}"><div><b>${s[1]}</b><small class="mono">${s[0]} · по учёту ${s[5]} ${s[2]}</small></div><div class="invc"><button class="bt sm" onclick="INV.cnt['${s[0]}']=(INV.cnt['${s[0]}']??${s[5]})-${s[2]==='шт'?1:5};render()">−</button><b class="mono">${INV.cnt[s[0]]??s[5]} ${s[2]}</b><button class="bt sm" onclick="INV.cnt['${s[0]}']=(INV.cnt['${s[0]}']??${s[5]})+${s[2]==='шт'?1:5};render()">+</button><button class="bt ${INV.done[s[0]]?'':'p'} sm" onclick="INV.done['${s[0]}']=1;render()">${INV.done[s[0]]?'✓':'Посчитано'}</button></div></div>`).join('')}
  <div class="btns l" style="margin-top:10px"><button class="bt" onclick="act('Сканер: наведите камеру на штрихкод ящика — позиция и вес подставятся сами.')">Сканировать</button><button class="bt p" onclick="SKU.forEach(s=>INV.done[s[0]]=1);INV.step=2;render()">Завершить пересчёт</button></div></div>`:''}
 ${INV.step===2?`<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Позиция</th><th style="text-align:right">Учёт</th><th style="text-align:right">Факт</th><th style="text-align:right">Разница</th><th>Вывод</th></tr></thead><tbody>${SKU.map(s=>{const d=invDiff(s);const pair=s[0]==='К-101'&&invDiff(SD('К-102'))>0||s[0]==='К-102'&&invDiff(SD('К-101'))<0;return `<tr class="${pair?'rowwarn':d?'rowbad':''}"><td><b>${s[1]}</b></td><td class="mono" style="text-align:right">${s[5]}</td><td class="mono" style="text-align:right">${INV.cnt[s[0]]??s[5]}</td><td class="mono" style="text-align:right">${d>0?'+':''}${d||'—'}</td><td>${pair?tag('пересорт: батон ↔ штучная','w'):d?tag(d<0?'недостача':'излишек','r'):tag('совпало','g')}</td></tr>`}).join('')}</tbody></table></div>
  <div class="pairv"><div><small>Батон К-101</small><b>−40 кг</b></div><i>⇄</i><div><small>Штучная К-102</small><b>+80 шт × 0,5 кг = +40 кг</b></div><span>Вес совпадает — это пересорт при сборке, а не недостача.</span></div>
  <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="INV.step=3;render()">Далее → провести</button></div></div>`:''}
 ${INV.step===3?`<div class="pan"><h3>Документ инвентаризации · ${INV.zone}</h3><div class="kv"><span>Пересорт К-101 ⇄ К-102</span><b>исправить — одним документом</b></div><div class="kv"><span>Недостачи и излишки</span><b>${SKU.filter(s=>invDiff(s)&&!['К-101','К-102'].includes(s[0])).length||'нет'}</b></div><div class="kv"><span>Корректировка в 1С</span><b>уйдёт после проведения</b></div><div class="btns l" style="margin-top:10px"><button class="bt p" onclick="SKU.forEach(s=>{s[5]=INV.cnt[s[0]]??s[5]});INV={step:0,zone:INV.zone,cnt:{},done:{}};toast('Инвентаризация проведена: остатки исправлены, пересорт закрыт, корректировка ушла в 1С.');render()">Провести</button></div></div>`:''}
 ${said('Когда возникает вопрос в пересортах — по факту на складе товар есть, но другого аналогичного вида больше ровно настолько, сколько должно было быть')}`};
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
