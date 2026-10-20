/* Продажи и маржа */
SC.reports=()=>`<div class="hd"><div><h2>Продажи и маржа</h2><p>Онлайн и офлайн, по каналам, категориям и товарам — с себестоимостью и маржой. Всё считается из заказов и чеков кассы, без ручного Excel. Видно, что продаётся и на чём вы зарабатываете.</p></div><div class="btns"><div class="seg"><a onclick="act('Период: день.')">День</a><a onclick="act('Период: неделя.')">Неделя</a><a class="on">Октябрь</a></div></div></div>
 <div class="wid"><div><small>Выручка</small><b>${tg(9840000)}</b><span>онлайн 6,1 млн · точка 3,7 млн</span></div><div><small>Валовая прибыль</small><b class="g">${tg(4034000)}</b><span>маржа 41%</span></div><div><small>Заказов</small><b>508</b><span>средний чек ${tg(19370)}</span></div><div><small>Комплектов продано</small><b>62</b><span>+18% к чеку</span></div></div>
 <div class="g2"><div class="pan"><h3>По категориям, тыс. ₸</h3>${bars([['Палатки',3920],['Мебель',1840],['Газ',1210],['Сон',1180],['Рыбалка',920],['Свет',770]].map(r=>[r[0],r[1],fmt(r[1])]))}</div>
 <div class="pan"><h3>Топ товаров</h3><div class="tw"><table class="t"><thead><tr><th>Товар</th><th>Продано</th><th style="text-align:right">Выручка</th><th>Маржа</th></tr></thead><tbody>${[['Палатка «Камчатка 4»',31,2759000,'37%'],['Кресло складное',96,1392000,'46%'],['Газовый баллон 450 г',410,738000,'47%'],['Спальник −10°C',27,729000,'41%'],['Раскладушка',29,696000,'44%']].map(r=>`<tr><td><b>${r[0]}</b></td><td class="mono">${r[1]}</td><td class="mono" style="text-align:right">${fmt(r[2])}</td><td class="mono">${r[3]}</td></tr>`).join('')}</tbody></table></div></div></div>
 ${said('Даже продажи вручную записываем — три человека, при большом потоке это нереально, недосчёты')}`;

/* Видео → заявки */
SC.content=()=>`<div class="hd"><div><h2>Видео → заявки</h2><p>Продажи идут с органики: сняли видео — пошли сообщения. Менеджер отмечает в заявке, с какого видео пришёл клиент, и система считает, сколько заявок, заказов и денег принесло каждое видео. Контент-план строится по цифрам, а не наугад.</p></div><div class="btns"><button class="bt p" onclick="act('Новая публикация в контент-плане: площадка, тема, дата, кто снимает.')">+ В контент-план</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Видео</th><th>Площадка</th><th>Дата</th><th>Заявок</th><th>Заказов</th><th style="text-align:right">Продажи</th></tr></thead><tbody>${[['Палатка за 3 минуты','ig','02.10',38,21,1640000],['Кухня на природе','tt','06.10',24,9,780000],['Семейный кемпинг','ig','10.10',19,8,1120000],['Тепло в палатке','tt','12.10',17,11,610000],['Рыбалка на Капшагае','ig','15.10',11,4,198000],['Обзор газовых плиток','yt','30.09',8,5,96000]].map(r=>`<tr><td><b>${r[0]}</b></td><td>${chTag(r[1])}</td><td class="mono">${r[2]}</td><td class="mono">${r[3]}</td><td class="mono">${r[4]}</td><td class="mono" style="text-align:right">${fmt(r[5])}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Контент-план · неделя</h3>${[['Пн','Instagram','Как выбрать спальник к зиме'],['Ср','TikTok','Тёплая палатка: тест ночью'],['Пт','Instagram','Комплект «Семейный выезд» за 1 минуту'],['Вс','YouTube','Обзор: 5 палаток до 100 000 ₸']].map(r=>`<div class="kv"><span><b>${r[0]}</b> · ${r[1]}</span><b>${r[2]}</b></div>`).join('')}</div>
 <div class="pan">${tip('Почему это важно','Вы не запускаете рекламу и живёте на органике — значит, видео и есть ваш маркетинг. Когда видно, какое видео приносит деньги, понятно, что снимать дальше.')}</div></div>
 ${said('Хотим придерживаться контент-плана и системно заниматься контентом, каждый день')}`;

/* Команда */
SC.team=()=>`<div class="hd"><div><h2>Сотрудники и задачи</h2><p>Сейчас трое, скоро — продавцы на две точки и новые люди в онлайн-продажи. Каждый входит под своим логином и видит свой участок. Новички учатся по системе: воронка подсказывает, что делать дальше.</p></div><div class="btns"><button class="bt p" onclick="act('Новый сотрудник: роль, точка — доступ появится сразу.')">+ Сотрудник</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Сотрудник</th><th>Роль</th><th>Где</th><th>Заказов / чеков за неделю</th><th>Продажи</th><th>Задач</th></tr></thead><tbody>${[['Миндегали','Руководитель','всё','—','—',3],['Алибек','Онлайн-продажи','офис',96,2140000,5],['Даурен','Склад и закуп','склад','сборка 88','—',4],['Айбек','Продавец','точка у Барахолки',71,1236000,1],['Вакансия','Продавец','точка в городе','—','—',0],['Вакансия','Продавец','точка в городе','—','—',0]].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td class="mono">${r[3]}</td><td class="mono">${typeof r[4]==='number'?fmt(r[4]):r[4]}</td><td class="mono">${r[5]}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Задачи</h3>${[['Даурен','Принять приход ПР-118 и разложить по зонам','21.10'],['Алибек','Перезвонить 6 клиентам, не забравшим резерв','сегодня'],['Миндегали','Утвердить ассортимент новой точки','23.10'],['SMM','Снять видео «Комплект Семейный выезд»','22.10']].map(r=>`<div class="kv"><span><b>${r[0]}</b> · ${r[1]}</span><b>${r[2]}</b></div>`).join('')}</div>`;

/* Расходы */
SC.costs=()=>`<div class="hd"><div><h2>Расходы: сейчас и после</h2><p>Система ваша: без ежемесячной оплаты за amoCRM и за каждого сотрудника. Остаются только каналы связи — и они дешевле, чем сейчас.</p></div></div>
 <div class="g2"><div class="pan cmp bad"><h3>Сейчас</h3><div class="kv"><span>amoCRM — за каждого пользователя</span><b>каждый месяц</b></div><div class="kv"><span>Wazzup (WhatsApp)</span><b>≈ 30 000 ₸ / мес</b></div><div class="kv"><span>Excel и учёт «в голове»</span><b>время и недосчёты</b></div><div class="kv"><span>Новый продавец</span><b>+ ещё одна подписка</b></div></div>
 <div class="pan cmp good"><h3>После</h3><div class="kv"><span>Своя система</span><b>0 ₸ — абонплаты нет</b></div><div class="kv"><span>WhatsApp через Green API</span><b>≈ 5 000 ₸ за номер</b></div><div class="kv"><span>Instagram</span><b>≈ 10–15 $ / мес</b></div><div class="kv"><span>TikTok</span><b>проверим способ подключения</b></div><div class="kv"><span>IP-телефония, если понадобится</span><b>30–50 тыс. ₸ / мес</b></div><div class="kv"><span>Сервер</span><b>бесплатно или 5–10 $</b></div><div class="kv"><span>Сотрудников</span><b>до 50 без доплат</b></div></div></div>
 ${said('Вот расходы в виде чего — мы и так будем платить за интеграции с соцсетями и WhatsApp?','Да, за каналы платите их владельцам, но меньше: WhatsApp — 5 000 ₸ вместо 30 000 ₸.')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Стандартный пакет разработки: одно окно для заявок, воронка заказов, склад и точки, касса, инвентаризация, цифры. Делаем под вас, разворачиваем на вашем сервере и передаём — дальше платить за систему не нужно.</p></div></div>
 <div class="pk1"><div><small>Стандартный пакет</small><b>2 500 000 ₸</b><span>при решении в течение суток — скидка 5%: 2 375 000 ₸</span></div><div><small>Срок</small><b>4–6 недель</b><span>база → полировка → запуск</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>237 500 ₸</b><span>при подписании</span></div><div><small>База · 45%</small><b>1 068 750 ₸</b><span>после приёмки базы</span></div><div><small>Сдача · 45%</small><b>1 068 750 ₸</b><span>после полировки и запуска</span></div></div>
 <div class="g2"><div class="pan"><h3>Как идём</h3><div class="kv"><span><b>1.</b> Демо и согласование</span><b>сейчас</b></div><div class="kv"><span><b>2.</b> База: заявки, воронка, склад, касса — на вашем сервере</span><b>2–3 недели</b></div><div class="kv"><span><b>3.</b> Полировка: кнопки, этапы, инвентаризация — версии до «нравится»</span><b>2–3 недели</b></div><div class="kv"><span><b>4.</b> Загрузка товаров, обучение, запуск</span><b>входит</b></div></div>
 <div class="pan"><h3>После запуска</h3><div class="kv"><span>Поддержка</span><b>3 месяца бесплатно</b></div><div class="kv"><span>Доработки потом</span><b>по часам</b></div><div class="kv"><span>Новая точка</span><b>добавляется в настройках</b></div><p class="hint">Цены без скидки: 250 000 / 1 125 000 / 1 125 000 ₸.</p></div></div>`;

/* Каркас */
const CARD={};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const o=ORD.find(x=>(x.id+x.cl+x.ph).toLowerCase().includes(v));if(o&&v){openOrd(o.id);return}const g=GOODS.find(x=>(x[0]+x[1]).toLowerCase().includes(v));if(g&&v){sf='all';go('stock');return}toast('Ищите по заказу, клиенту или товару: «З-1284», «Ерлан», «палатка».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">TIGERS</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='inbox'?'<em>'+INB.length+'</em>':x[0]==='stock'&&low().length?'<em>'+low().length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['inbox','Заявки'],['funnel','Заказы'],['pos','Касса'],['stock','Склад']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Tigers';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: продажи онлайн и на точке, заявки, что заканчивается, маржа.'],
 ['inbox','2 · Instagram, TikTok, WhatsApp — в одном окне. Видно, есть ли товар.'],
 ['funnel','3 · Воронка заказов: от заявки до выдачи — одинаково для всех.'],
 ['order','4 · Заказ из того, что есть на складе: резерв, оплата, доставка.'],
 ['pos','5 · Касса точки: чек — и остаток списан, продажа в отчётах.'],
 ['stock','6 · Остатки по складу и точкам, что заканчивается.'],
 ['invent','7 · Инвентаризация камерой телефона.'],
 ['kits','8 · Комплекты: палатка + раскладушки + газ.'],
 ['content','9 · Какое видео приносит заявки и деньги.'],
 ['costs','10 · Расходы: WhatsApp 5 000 ₸ вместо 30 000 ₸, без подписок.'],
 ['launch','11 · Стоимость: 2,5 млн, −5% при решении за сутки.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
