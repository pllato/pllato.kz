
/* Магазины и доступы */
SC.branches=()=>`<div class="hd"><div><h2>Магазины и доступы</h2><p>Новый магазин или склад — кнопкой «+», без программиста: запас до 10 точек. Администратор видит только свой магазин, продавец — кассу и поиск, собственник — всю сеть.</p></div><div class="btns"><button class="bt p" onclick="addShop()">+ Магазин</button></div></div>
 <div class="g3">${SHOPS.map(s=>`<div class="pan"><h3>${s[1]}</h3><div class="kv"><span>${s[0]==='WH'?'Кладовщик':'Администратор'}</span><b>${s[2]}</b></div><div class="kv"><span>Пар на остатке</span><b>${fmt(MODELS.reduce((x,m)=>x+tot(m.a,s[0]),0))}</b></div><div class="kv"><span>${s[0]==='WH'?'Приём и отправка':'Продавцов'}</span><b>${s[0]==='WH'?'2 человека':'3'}</b></div></div>`).join('')}</div>
 <div class="pan"><h3>Кто что видит</h3><div class="tw"><table class="t"><thead><tr><th>Раздел</th><th>Собственник</th><th>Администратор</th><th>Продавец</th><th>Кладовщик</th><th>Kaspi и SMM</th><th>Бухгалтер</th></tr></thead><tbody>${[['Пульт и деньги сети','●','свой','—','—','—','●'],['Касса','●','●','●','—','—','○'],['Остатки','●','свой','поиск','●','поиск','—'],['Склад, приём, перемещения','●','свой','—','●','—','—'],['Клиенты и бонусы','●','●','●','—','●','—'],['Рассылки','●','—','—','—','●','—'],['Зарплата','●','—','своя','своя','своя','●']].map(r=>`<tr>${r.map((c,i)=>`<td${i?' class="mono"':''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="hint">● — видит и меняет · ○ — только смотрит · «свой» — только свой магазин.</p></div>
 ${said('Ещё хочу в Астане отдельно стоящий магазин открыть','Новый магазин добавляется кнопкой — сразу появляется в кассе, остатках и пульте.')}`;
function addShop(){const n=prompt('Название магазина','Отдельный магазин · ул. Кунаева');if(!n)return;const k='S'+SHOPS.length;SHOPS.splice(SHOPS.length-1,0,[k,n,'назначить']);MODELS.forEach(m=>STK[m.a][k]=SIZES.map(()=>0));render();toast('Магазин добавлен — он уже в кассе, остатках и пульте.')}

/* Зарплата */
SC.salary=()=>`<div class="hd"><div><h2>Зарплата продавцов · октябрь</h2><p>Каждая продажа записывается на продавца, который пробил чек. Зарплата считается сама: оклад плюс процент с продаж. Ставки задаёте вы.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Сотрудник</th><th>Магазин</th><th>Продажи</th><th>Оклад</th><th>% с продаж</th><th>Начислено</th></tr></thead><tbody>${[['Дана','MG',2184000,120000,3],['Аружан','MG',1962000,120000,3],['Айгерим (адм.)','MG',0,220000,1],['Алина','AP',1688000,120000,3],['Жанна (адм.)','AP',0,220000,1],['Ерлан','WH',0,180000,0]].map(r=>{const b=r[4]?(r[2]||(r[1]==='MG'?5920000:3410000))*r[4]/100:0;return `<tr><td><b>${r[0]}</b></td><td>${SN(r[1])}</td><td class="mono">${r[2]?tg(r[2]):'магазин'}</td><td class="mono">${tg(r[3])}</td><td class="mono">${r[4]}%</td><td class="mono"><b>${tg(r[3]+b)}</b></td></tr>`}).join('')}</tbody></table></div><p class="hint">Ставки — пример. Заведём ваши правила: проценты, планы, бонусы за выполнение.</p></div>`;

/* Переезд */
let MV=0;
SC.move=()=>`<div class="hd"><div><h2>Переезд из UMAG и SAGI</h2><p>Карточки заново заводить не нужно. Забираем номенклатуру, остатки и клиентов из UMAG — через его выгрузку или Excel, а если не дадут — считываем с экрана под вашим логином. Клиентов и бонусы — из SAGI. Потом сверяем количество.</p></div></div>
 <div class="mvs">${[['Номенклатура','модели, размеры, штрихкоды, цены'],['Остатки','по каждому магазину и складу'],['Клиенты и бонусы','5 000+ клиентов с балансами из SAGI'],['Сверка','сколько было — столько стало'],['Готово','UMAG и SAGI можно отключать']].map((s,i)=>`<div class="mv ${i<MV?'ok':i===MV?'on':''}" onclick="MV=${i};render()"><i>${i<MV?'✓':i+1}</i><b>${s[0]}</b><span>${s[1]}</span></div>`).join('')}</div>
 <div class="pan"><h3>Сверка</h3><div class="tw"><table class="t"><thead><tr><th>Что</th><th>Было</th><th>Стало</th><th></th></tr></thead><tbody>${[['Карточки товаров (модель × размер)','2 846'],['Пар на остатках','3 912'],['Клиенты','5 124'],['Бонусные балансы','5 124']].map(r=>`<tr><td>${r[0]}</td><td class="mono">${r[1]}</td><td class="mono">${MV>=3?r[1]:'—'}</td><td>${MV>=3?tag('совпадает ✓','g'):''}</td></tr>`).join('')}</tbody></table></div><button class="bt sm p" onclick="MV=Math.min(4,MV+1);render()">Следующий шаг →</button></div>
 ${said('Наша база, номенклатура, все товары в UMAG — их можно перевести или заново карточки создавать?','Переносим: через выгрузку UMAG или Excel; если доступа не дадут — считываем с экрана.')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Один платёж — программа ваша, без подписки. Касса и бонусная система — по символической цене, потому что берёте основной пакет: UMAG и SAGI больше не нужны.</p></div></div>
 <div class="pk1"><div><small>Итого</small><b>1 800 000 ₸</b><span>система 1 500 000 · касса 100 000 · бонусы 200 000</span></div><div><small>Срок</small><b>4–6 недель</b><span>около месяца при быстрых согласованиях</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>180 000 ₸</b><span>после демо · вернём, если демо не подойдёт</span></div><div><small>Ядро · 45%</small><b>810 000 ₸</b><span>после показа и утверждения ядра</span></div><div><small>Сдача · 45%</small><b>810 000 ₸</b><span>после всех правок и передачи</span></div></div>
 <div class="pan"><h3>Каждый месяц после запуска</h3><div class="kv"><span>Программа</span><b>0 ₸ — абонплаты нет</b></div><div class="kv"><span>Сервер</span><b>бесплатный тариф до 10 ГБ · потом ≈ 5 000 ₸ за 1 ТБ</b></div><div class="kv"><span>WhatsApp для ответов (Green API)</span><b>≈ 5 000 ₸ за номер</b></div><div class="kv"><span>Рассылки по базе (официальный WhatsApp)</span><b>по тарифу Meta за сообщения</b></div><div class="kv"><span>Instagram Direct</span><b>≈ 5–10 $</b></div><div class="kv"><span>UMAG и SAGI</span><b>больше не нужны</b></div></div>`;

/* Карточки */
const CARD={};
CARD.newmodel=()=>['Новая модель','Карточки на все размеры и штрихкоды создадутся сами',`<div class="form"><label>Артикул<input id="nm_a" value="TC-2490"></label><label>Название<input id="nm_n" value="Ботинки на шнуровке, кожа"></label><label>Цвет<input id="nm_c" value="чёрный"></label><label>Цена, ₸<input id="nm_p" type="number" value="45900"></label><label>Размеры от<input id="nm_f" type="number" value="36"></label><label>до<input id="nm_t" type="number" value="40"></label></div><button class="bt p" onclick="newModel()">Создать модель и размеры</button>`];
function newModel(){const v=k=>document.getElementById('nm_'+k).value.trim();const a=v('a')||'TC-2490';if(MD(a)){toast('Такой артикул уже есть.');return}const f=+v('f'),t=+v('t');MODELS.unshift({a,n:v('n'),c:v('c'),cat:'Ботинки',pr:+v('p')||0,sea:'Осень–зима 26',col:'#333'});STK[a]={};SHOPS.forEach(s=>STK[a][s[0]]=SIZES.map(()=>0));curModel=a;closeM();render();const n=SIZES.filter(z=>z>=f&&z<=t).length;toast(`Модель ${a}: создано ${n} карточек размеров со штрихкодами. Этикетки — в «Этикетках».`)}
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей программе здесь откроется форма.')}
function searchDemo(v){FQ=v||'';go('find')}

function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">TUCINO</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='orders'?'<em>'+ORDERS.filter(o=>o[4]==='новый').length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['pos','Касса'],['find','Поиск'],['stock','Остатки'],['clients','Клиенты']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'TUCINO';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: продажи каждого магазина, чеки, бонусы, Kaspi.'],
 ['pos','2 · Касса: продавец под своим кодом, бонусы клиента, Kaspi QR.'],
 ['catalog','3 · Модель один раз — карточки и штрихкоды на все размеры сами.'],
 ['find','4 · Поиск модели: где есть нужный размер — во всех магазинах.'],
 ['stock','5 · Остатки по размерам и магазинам.'],
 ['receiving','6 · Приём новинок и распределение по магазинам.'],
 ['inventory','7 · Инвентаризация камерой или сканером, причины расхождений.'],
 ['clients','8 · Своя бонусная система вместо SAGI.'],
 ['mailing','9 · Рассылки: новая коллекция, день рождения.'],
 ['orders','10 · Заявки Kaspi, WhatsApp, Instagram.'],
 ['purchase','11 · Закупки: что и сколько заказать по размерам.'],
 ['finance','12 · Финансы: настоящая прибыль, движение денег, деньги в товаре.'],
 ['ai','13 · ИИ-помощник отвечает по вашим цифрам.'],
 ['launch','14 · Стоимость и запуск.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
