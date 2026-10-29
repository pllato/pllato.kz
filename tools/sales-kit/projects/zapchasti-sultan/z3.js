
/* Каталог */
let BR='all';
SC.catalog=()=>`<div class="hd"><div><h2>Каталог и прайс</h2><p>Больше 1000 позиций — от кузова до шайбы. У каждой: артикул, фото, марка и модель самосвала, ячейка на складе, закупочная цена и цена продажи. Продавец находит запчасть по артикулу, названию или марке.</p></div><div class="dpcity">${['all','Shacman','HOWO','FAW','КамАЗ'].map(b=>`<button class="${BR===b?'on':''}" onclick="BR='${b}';render()">${b==='all'?'Все марки':b}</button>`).join('')}</div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th></th><th>Артикул</th><th>Запчасть</th><th>Марка</th><th>Ячейка</th><th class="r">Остаток</th><th class="r">Цена</th><th class="r">Наценка</th></tr></thead><tbody>${CAT.filter(p=>BR==='all'||p.m.indexOf(BR)===0).map(p=>`<tr><td>${PART}</td><td class="mono"><b>${p.a}</b></td><td>${p.n}</td><td>${p.m}</td><td class="mono">${p.cell}</td><td class="r">${fmt(p.q)}</td><td class="r"><b>${tg(p.pr)}</b></td><td class="r">${Math.round((p.pr/p.c-1)*100)} %</td></tr>`).join('')}</tbody></table></div></div>
 <div style="margin-top:4px"><button class="bt" onclick="act('Прайс выгружен в Excel и PDF — можно отправить оптовому клиенту.')">Выгрузить прайс для клиента</button> <button class="bt" onclick="act('Новые цены загружены из файла поставщика: 214 позиций обновлено, наценка пересчитана.')">Обновить цены из файла</button></div>`;

/* Остатки */
SC.stock=()=>`<div class="hd"><div><h2>Остатки</h2><p>Продажа списывает со склада сразу — по артикулу или штрихкоду. Видно, что ниже минимума, сколько уходит в неделю и на сколько хватит.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Артикул</th><th>Запчасть</th><th class="r">Остаток</th><th class="r">Минимум</th><th>Состояние</th><th></th></tr></thead><tbody>${CAT.map((p,i)=>{const low=p.q<p.min;return `<tr class="${low?'rowwarn':''}"><td class="mono">${p.a}</td><td><b>${p.n}</b><br><small class="mut">${p.m} · ${p.cell}</small></td><td class="r">${fmt(p.q)}</td><td class="r">${fmt(p.min)}</td><td>${low?tag('ниже минимума','bad'):tag('в норме','ok')}</td><td>${low?`<button class="bt sm" onclick="toBuy(${i})">В закуп</button>`:''}</td></tr>`}).join('')}</tbody></table></div></div>
 <div class="wid"><div><small>Позиций</small><b>1 186</b><span>в каталоге</span></div><div><small>Склад по закупу</small><b>${tg(184600000)}</b><span>замороженные деньги</span></div><div><small>Не продавалось 90 дней</small><b>${tg(11200000)}</b><span>142 позиции — в акцию</span></div></div>`;
function toBuy(i){const p=CAT[i];if(!BUY.find(b=>b[0]===p.a))BUY.unshift([p.a,p.n,p.m,p.min*2-p.q,p.c]);toast(`${p.a}: добавлено в закуп — ${p.min*2-p.q} шт.`);go('purchase')}

/* Приход контейнеров */
let CN=[['CN-14','HOWO и Shacman · ходовая, рессоры','Урумчи → Хоргос','04.11.2026','road'],['CN-15','FAW · фильтры, колодки, расходники','Урумчи → Хоргос','09.11.2026','road'],['CN-16','Гидроцилиндры, ступицы','Гуанчжоу','22.11.2026','sea'],['CN-13','Shacman · кузовные и метизы','получен 21.10.2026','21.10.2026','done']];
SC.income=()=>`<div class="hd"><div><h2>Приход контейнеров</h2><p>Каждый контейнер — с составом из инвойса поставщика: что едет, когда прибудет. При приходе склад принимает по списку, сканирует артикулы, расхождения видно сразу, себестоимость считается с доставкой и растаможкой.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Контейнер</th><th>Что везёт</th><th>Маршрут</th><th>Прибытие</th><th>Статус</th><th></th></tr></thead><tbody>${CN.map((c,i)=>`<tr><td class="mono"><b>${c[0]}</b></td><td>${c[1]}</td><td>${c[2]}</td><td>${c[3]}</td><td>${c[4]==='done'?tag('принят','ok'):c[4]==='sea'?tag('море','info'):tag('в пути','warn')}</td><td>${c[4]!=='done'?`<button class="bt sm" onclick="cnIn(${i})">Принять</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Себестоимость с доставкой · CN-13</h3><div class="kv"><span>Товар по инвойсу</span><b>${tg(21400000)}</b></div><div class="kv"><span>Доставка</span><b>${tg(2900000)}</b></div><div class="kv"><span>Растаможка и сборы</span><b>${tg(3100000)}</b></div><div class="kv"><span>Распределено по 312 позициям</span><b>+28 % к цене поставщика</b></div></div>
 <div class="pan"><h3>Как принимаем</h3><div class="kv"><span>Список из инвойса</span><b>загружается файлом</b></div><div class="kv"><span>Приёмка</span><b>сканируем артикулы с телефона</b></div><div class="kv"><span>Расхождения</span><b>акт для поставщика</b></div></div></div>`;
function cnIn(i){CN[i][4]='done';CN[i][2]='получен '+TODAY;CAT[0].q+=20;toast(`${CN[i][0]} принят: позиции оприходованы, расхождений 2 — акт для поставщика готов. Клиентам, кто ждал эти запчасти, ушло сообщение.`);render()}

/* Инвентаризация */
let INV=[['А-02','Рессора передняя SH-2911-05',14,14],['А-09','Ступица задняя SH-3104-01',4,3],['Б-14','Колодки HW-0420-11',62,62],['Г-21','Болт стремянки М16×80',1240,1228]];
SC.inv=()=>`<div class="hd"><div><h2>Инвентаризация</h2><p>Склад считают по ячейкам с телефона: сканируют артикул и вводят количество. Можно считать несколько человек сразу. Система сама сводит расхождения в акт.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Ячейка</th><th>Позиция</th><th class="r">По учёту</th><th class="r">По факту</th><th class="r">Разница</th></tr></thead><tbody>${INV.map(r=>`<tr class="${r[2]!==r[3]?'rowwarn':''}"><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td class="r">${fmt(r[2])}</td><td class="r">${fmt(r[3])}</td><td class="r">${r[2]===r[3]?'—':`<b class="r">${r[3]-r[2]}</b>`}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Кто считает сейчас</h3><div class="kv"><span>Кладовщик · ряды А, Б</span><b>212 из 340 ячеек</b></div><div class="kv"><span>Помощник · ряды В, Г</span><b>188 из 296 ячеек</b></div><div class="kv"><span>Продажи во время подсчёта</span><b>не останавливаем — система учтёт</b></div></div>
 <div class="pan"><h3>Итог прошлой инвентаризации · сентябрь</h3><div class="kv"><span>Недостача</span><b>${tg(412000)}</b></div><div class="kv"><span>Излишки</span><b>${tg(96000)}</b></div><div class="kv"><span>Больше всего расхождений</span><b>метизы, ряд Г</b></div></div></div>
 <div><button class="bt p" onclick="act('Акт инвентаризации сформирован: 2 расхождения на 160 200 ₸. Остатки исправлены, подпись владельца.')">Закрыть инвентаризацию</button></div>`;

/* Закуп */
let BUY=[['FW-1105-02','Фильтр топливный тонкой очистки','FAW J6',71,3100],['SH-3104-01','Ступица задняя в сборе','Shacman X3000',5,96000]];
SC.purchase=()=>`<div class="hd"><div><h2>Что заказать</h2><p>Система предлагает закуп сама: что ниже минимума, что быстро уходит, что ждут клиенты под заказ. Султан правит количество и собирает заказ поставщику в контейнер — с весом и суммой.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Артикул</th><th>Запчасть</th><th>Марка</th><th class="r">Заказать</th><th class="r">Цена закупа</th><th class="r">Сумма</th></tr></thead><tbody>${BUY.map(b=>`<tr><td class="mono">${b[0]}</td><td><b>${b[1]}</b></td><td>${b[2]}</td><td class="r">${fmt(b[3])}</td><td class="r">${tg(b[4])}</td><td class="r"><b>${tg(b[3]*b[4])}</b></td></tr>`).join('')}</tbody></table></div></div>
 <div class="wid"><div><small>Заказ поставщику</small><b>${tg(BUY.reduce((t,b)=>t+b[3]*b[4],0))}</b><span>${BUY.length} позиций</span></div><div><small>Заполнение контейнера</small><b>34 %</b><span>≈ 13,6 из 40 т</span></div><div><small>Ждут клиенты</small><b>6 заказов</b><span>под этот контейнер</span></div></div>
 <div><button class="bt p" onclick="act('Заказ поставщику сформирован: Excel на китайском и русском, артикулы поставщика подставлены. Контейнер CN-17 создан.')">Сформировать заказ поставщику</button></div>
 ${said('Закупом, наверное, я буду заниматься — я занимаюсь закупом','Закуп по данным: продажи, остатки, минимумы и заказы клиентов — в одном списке.')}`;

/* Сайт */
SC.site=()=>`<div class="hd"><div><h2>Сайт с каталогом</h2><p>Отдельно от системы, но связан с ней: каталог на сайте берёт наличие и цены прямо со склада, заявка с сайта сразу попадает в «Заказы клиентов». Клиент ищет по марке, модели или артикулу.</p></div></div>
 <div class="pan"><h3>Как это выглядит у клиента</h3><div class="kv"><span>Поиск</span><b>«ступица Shacman X3000» или артикул</b></div><div class="kv"><span>Карточка запчасти</span><b>фото, подходит к моделям, наличие, цена</b></div><div class="kv"><span>Заявка</span><b>в один клик → в воронку, ответ в WhatsApp</b></div><div class="kv"><span>Для оптовиков</span><b>вход с персональными ценами</b></div></div>
 <div class="pk1"><div><small>Сайт с каталогом</small><b>800 000 ₸</b><span>отдельно от пакета · связан со складом</span></div><div><small>Срок</small><b>вместе с системой</b><span>каталог — из той же базы</span></div></div>
 ${said('Сайта нет. Тоже нужен — чтобы каталог был и заявки могли оставлять')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и этапы</h2><p>Стандартный пакет разработки под ваш бизнес. Система ваша: код, сервер и данные у вас, без аренды и абонплаты. Пользователей — до 50.</p></div></div>
 <div class="pk1"><div><small>Стандартный пакет</small><b>2 000 000 ₸</b><span>всё из демо, до 50 пользователей</span></div><div><small>Срок</small><b>≈ 6 недель</b><span>первая версия через 2–3 недели</span></div></div>
 <div class="pay3"><div><small>1 · Старт · 10%</small><b>200 000 ₸</b><span>поднимаем сервер, загружаем каталог и остатки</span></div><div><small>2 · Первая версия · 45%</small><b>900 000 ₸</b><span>продажи, оплаты, долги, склад работают — вы утвердили</span></div><div><small>3 · Сдача · 45%</small><b>900 000 ₸</b><span>закуп, контейнеры, кэшбэк, 1С; код и ключи — ваши</span></div></div>
 <div class="g2"><div class="pan"><h3>Входит</h3>${['Продажи с телефона, журнал оплат','Долги, лимиты, напоминания, накладные','Заказы клиентов, клиенты и кэшбэк','Каталог 1000+ позиций, прайс, остатки','Приход контейнеров, инвентаризация, закуп','WhatsApp и телефония — внутри системы','Выгрузка бухгалтеру в 1С, поддержка после сдачи'].map(x=>`<div class="kv"><span>${x}</span><b>✓</b></div>`).join('')}</div>
 <div class="pan"><h3>Отдельно</h3><div class="kv"><span>Сайт с каталогом</span><b>800 000 ₸</b></div><div class="kv"><span>WhatsApp (Green API)</span><b>≈ 5 000 ₸ в месяц</b></div><div class="kv"><span>Сервер</span><b>≈ 15–30 $ в месяц</b></div></div></div>
 ${tip('Работаем вместе','Разрабатываем этапами и согласовываем с вами каждый: показываем версию, вы правите. После сдачи поддерживаем — обычно обращаются 1–2 раза в год.')}`;

/* Каркас */
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const p=CAT.find(x=>(x.a+x.n+x.m).toLowerCase().includes(v));if(p&&v&&allowed('catalog')){BR='all';go('catalog');toast(`${p.a} · ${p.n}: ${fmt(p.q)} шт., ячейка ${p.cell}, ${tg(p.pr)}.`);return}const c=CL.find(x=>x[0].toLowerCase().includes(v));if(c&&v&&allowed('clients')){go('clients');card('cl',c[0]);return}toast('Ищите по артикулу, запчасти, марке или клиенту: «рессора», «HOWO», «КарьерСтрой».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Владелец';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">ГРУЗДЕТАЛЬ</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='debts'?'<em>'+DB.filter(d=>d[4]>0).length+'</em>':x[0]==='stock'?'<em>'+CAT.filter(p=>p.q<p.min).length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['groups','Продажа'],['money','Оплаты'],['debts','Долги'],['nakl','Накладные'],['stock','Остатки'],['purchase','Закуп'],['income','Приход'],['inv','Инвент.'],['catalog','Каталог'],['clients','Клиенты']].filter(x=>allowed(x[0])).slice(0,5).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'ГРУЗДЕТАЛЬ';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: продажи, деньги, долги, склад — каждый день.'],
 ['groups','2 · Продажа с телефона вместо 20 групп.'],
 ['money','3 · Журнал оплат ведётся сам: QR, наличные, безнал.'],
 ['debts','4 · Долги: сроки, лимиты, напоминания в WhatsApp.'],
 ['nakl','5 · Накладные без бумаги, подпись на телефоне.'],
 ['catalog','6 · Каталог 1000+ позиций по маркам самосвалов.'],
 ['income','7 · Контейнеры: что едет, приёмка, себестоимость.'],
 ['purchase','8 · Закуп по данным — для Султана.'],
 ['launch','9 · 2 000 000 ₸, ≈ 6 недель, без абонплаты.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
