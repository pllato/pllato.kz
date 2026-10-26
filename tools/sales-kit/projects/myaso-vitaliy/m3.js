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
