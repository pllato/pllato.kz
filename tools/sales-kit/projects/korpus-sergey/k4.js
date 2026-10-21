/* Аналитика */
SC.analytics=()=>`<div class="hd"><div><h2>Источники и воронка</h2><p>Яндекс Метрика и Google Analytics на сайте, Instagram и звонки — всё связывается со сделками. Видно не только «сколько лидов», а сколько денег принёс каждый источник, филиал и менеджер.</p></div><div class="btns"><div class="seg"><a onclick="act('Неделя.')">Неделя</a><a class="on">Месяц</a><a onclick="act('Квартал.')">Квартал</a></div></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Источник</th><th>Визиты / обращения</th><th>Лиды</th><th>Сделки</th><th>Оплачено</th><th style="text-align:right">Выручка</th><th>Конверсия</th></tr></thead><tbody>${[['Сайт · Яндекс (поиск)','2 140',41,14,9,18600000,'22%'],['Сайт · Google (поиск)','1 380',23,8,5,9400000,'22%'],['Звонки на номер','—',148,39,24,31200000,'16%'],['WhatsApp','—',121,28,15,14800000,'12%'],['Instagram','4 200 просмотров',27,6,3,2900000,'11%'],['Telegram + MAX','—',57,11,6,5100000,'11%']].map(r=>`<tr><td><b>${r[0]}</b></td><td class="mono">${r[1]}</td><td class="mono">${r[2]}</td><td class="mono">${r[3]}</td><td class="mono">${r[4]}</td><td class="mono" style="text-align:right">${fmt(r[5])}</td><td class="mono">${r[6]}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Менеджеры</h3><div class="tw"><table class="t"><thead><tr><th>Менеджер</th><th>Филиал</th><th>Сделок</th><th>Выручка</th><th>Просрочек</th></tr></thead><tbody>${[['Асем','Алматы',31,'28,4 млн',1],['Марат','Алматы',22,'14,1 млн',2],['Дана','Актобе',18,'13,6 млн',1],['Новый менеджер','Астана',3,'0,9 млн',0]].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="mono">${r[2]}</td><td class="mono">${r[3]}</td><td class="mono ${r[4]>1?'neg':''}">${r[4]}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Воронка месяца</h3>${bars([['Лиды',417],['Квалифицированы',212],['КП отправлено',148],['Счёт',96],['Оплачено',62],['Отгружено',55]])}</div></div>
 ${said('Аналитика — Яндекс, Google, привязка к сайту, к Instagram')}`;

/* Конструктор */
SC.builder=()=>`<div class="hd"><div><h2>Конструктор воронок и отделов</h2><p>Сначала — отдел продаж, потом добавляются производство, закупка, логистика и другие направления. Для каждой воронки: этапы, обязательные поля, срок на этап и кто получает уведомление о просрочке. Меняет РОП или руководитель — без программиста.</p></div><div class="btns"><button class="bt p" onclick="act('Новая воронка: название, отдел, этапы.')">+ Воронка</button></div></div>
 <div class="pan">${[['Продажи','Новый лид → Квалификация → Расчёт и КП → Счёт → Оплата → Производство/закупка → Отгрузка → Закрыта','8 этапов · 14 обязательных полей'],['Производство','Раскрой → Гибка → Сварка → Покраска → Сборка → ОТК → Склад','7 этапов · норматив на участок'],['Закупка','Запрос → Поиск поставщика → Заказ → Оплата → Приход','5 этапов · ответ в сделку'],['Логистика','Запрос → Перевозчик → Погрузка → В пути → Доставлено','5 этапов · отдельный отдел — когда понадобится'],['Сервис и рекламации','Обращение → Диагностика → Решение → Закрыто','добавим на полировке, если нужно']].map(r=>`<div class="bz-rrow"><b>${r[0]}</b><div><div class="bz-chain">${r[1].split(' → ').map(x=>`<span>${x}</span>`).join('<i>→</i>')}</div><small class="hint" style="display:block;margin-top:4px">${r[2]}</small></div><a class="mvb" onclick="act('Воронка «${r[0]}» открыта для правки: этапы, поля, сроки, уведомления.')">изменить</a></div>`).join('')}</div>
 <div class="pan"><h3>Кто может менять настройки</h3><div class="kv"><span>Этапы, обязательные поля, сроки, уведомления</span><b>только руководитель и РОП</b></div><div class="kv"><span>Менеджеры</span><b class="neg">не могут настраивать под себя</b></div><div class="kv"><span>Каждое изменение воронки</span><b>в журнале: кто, когда, что</b></div><div class="kv"><span>После финальной приёмки</span><b>единый стандарт для всех филиалов</b></div></div>
 <div class="pan"><h3>Этап «Расчёт и КП» · настройки</h3><div class="kv"><span>Обязательно</span><b>спецификация, цена, КП отправлено, срок согласован</b></div><div class="kv"><span>Срок этапа</span><b>48 часов</b></div><div class="kv"><span>Напоминание</span><b>за 1 час · менеджеру</b></div><div class="kv"><span>Просрочка</span><b>руководителю + обязательное объяснение</b></div></div>
 ${said('Ответ на отдел продаж можно будет настраивать, выстраивать — и сделать так, чтобы могли добавить другие направления')}`;

/* Тарифы */
SC.costs=()=>`<div class="hd"><div><h2>Тарифы в месяц</h2><p>Система ваша — без подписки за каждого из 50–70 пользователей. В месяц остаются только услуги связи и сервер. Цифры ориентировочные — уточним при подключении.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Что</th><th>Как подключаем</th><th style="text-align:right">В месяц</th></tr></thead><tbody>${[['Система КОРПУС','своя, без абонплаты','0 ₸'],['Многоканальный номер','Tele2 / Beeline / Kcell · пакет номеров и каналов','≈ 20–25 тыс. ₸'],['АТС','Binotel (или ваша Beeline «Онлайн АТС»)','≈ 15 тыс. ₸'],['WhatsApp','Green API · за номер · вместо Wazzup 36 000 ₸','≈ 5 000 ₸'],['MAX','Green API · за подключение','≈ 5 000 ₸'],['Telegram','бот / Green API','0–5 000 ₸'],['Instagram','сервис подключения','≈ 10–15 $'],['Основной сервер','Cloudflare · до 10 ГБ бесплатно','0 или 5–10 $'],['Резервный сервер','казахстанский провайдер, копии каждый день','≈ 10–20 тыс. ₸'],['1С','остаётся на вашем сервере · может понадобиться статический IP','по тарифу провайдера']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="mono" style="text-align:right">${r[2]}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Мне нужны тарифы по всем этим дополнениям — расписанное, чтобы не просто словами пролетело')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Стандартный пакет разработки — всё из демо, кроме обмена с 1С, который считается отдельно. Делаем под ваше предприятие: база за 2–3 недели, затем полировка с теми, кто будет работать в системе.</p></div></div>
 <div class="pk1"><div><small>Пакет + обмен с 1С</small><b>3 300 000 ₸</b><span>2 500 000 ₸ система + 800 000 ₸ обмен с 1С · один раз</span></div><div><small>Срок</small><b>4–6 недель</b><span>при согласовании в течение суток</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>330 000 ₸</b><span>при подписании</span></div><div><small>База · 45%</small><b>1 485 000 ₸</b><span>после приёмки базы на сервере</span></div><div><small>Сдача · 45%</small><b>1 485 000 ₸</b><span>после полировки и запуска</span></div></div>
 <div class="g2"><div class="pan"><h3>Входит в 2 500 000 ₸</h3><div class="kv"><span>Единый чат, телефония, воронки с обязательными полями и сроками, просрочки</span><b>✓</b></div><div class="kv"><span>Контрагенты, аффилированность, производство, посты участков, закупка, логистика</span><b>✓</b></div><div class="kv"><span>Склады, аналитика источников, конструктор воронок, права, филиалы</span><b>✓</b></div><div class="kv"><span>Серверы, резервные копии, обучение</span><b>✓</b></div></div>
 <div class="pan"><h3>Отдельно</h3><div class="kv"><span>Обмен с 1С (OData): счета, оплаты, реализации, остатки, контрагенты</span><b>800 000 ₸</b></div><div class="kv"><span>Поддержка после сдачи</span><b>20 $ в час</b></div><p class="hint">50–70 пользователей — без доплат. Ошибки 3 месяца после сдачи исправляем бесплатно.</p></div></div>`;

/* Каркас */
const CARD={};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const d=DEALS.find(x=>(x.id+x.cl+x.items).toLowerCase().includes(v));if(d&&v){openDeal(d.id);return}toast('Ищите по сделке, контрагенту или изделию: «С-2418», «СтройМонтаж», «ШПК».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">КОРПУС</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='inbox'?'<em>'+CHATS.length+'</em>':x[0]==='sla'?'<em>'+SLA.filter(r=>!r[5]).length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['inbox','Чаты'],['funnel','Сделки'],['prod','Цех'],['stock','Склад']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'КОРПУС';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: лиды, деньги в воронке, просрочки, производство, оплаты из 1С.'],
 ['inbox','2 · WhatsApp, Telegram, MAX, Instagram, почта — в одном окне.'],
 ['calls','3 · Один номер, распределение по филиалам, всплывающее окно.'],
 ['funnel','4 · Жёсткая воронка: без обязательного дальше не пройти.'],
 ['deal','5 · Сделка: чек-лист этапа, срок, запросы в производство и закупку.'],
 ['sla','6 · Просрочка — руководителю, объяснение обязательно.'],
 ['counter','7 · Контрагенты и аффилированные компании.'],
 ['prod','8 · Производство по участкам — параллельная воронка.'],
 ['post','9 · Мастер вводит выработку с телефона.'],
 ['onec','10 · Обмен с 1С: счета, оплаты, реализации, остатки.'],
 ['costs','11 · Тарифы в месяц — по каждой услуге.'],
 ['launch','12 · 2,5 млн + 800 тыс. за 1С, 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
