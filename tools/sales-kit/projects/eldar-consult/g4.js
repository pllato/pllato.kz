
/* ===== Система ===== */
SC.roles=()=>{const A=[['Все воронки и сделки',['EL','AI']],['Свои сделки',['EL','AI','NS']],['Распределение заявок',['EL','AI']],['Маркетплейс и фирмы',['EL','AI','NS','AS']],['Проверка фирм юристом',['EL','AS']],['Прайс и калькулятор',['EL','AI','NS']],['Звонки и записи',['EL','AI','NS']],['Аналитика отдела',['EL','AI']],['Настройки и права',['EL']]];const R=Object.entries(ROLES);
 return `<div class="hd"><div><h2>Роли и права</h2><p>Каждый входит под своим логином. Менеджер видит свои сделки, РОП — весь отдел, юрист — документы и проверку фирм. Сотрудников сколько угодно — без доплаты за пользователя.</p></div></div>
 <div class="tw"><table class="t mx"><thead><tr><th>Раздел</th>${R.map(([k,v])=>`<th class="c">${v.av}<span>${esc(k)}</span></th>`).join('')}</tr></thead><tbody>${A.map(a=>`<tr><td>${a[0]}</td>${R.map(([k,v])=>`<td class="c">${a[1].includes(v.p)?'<b class="pos">●</b>':'<span class="mini">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
 <div class="g2">${R.map(([k,v])=>`<div class="pan"><h3>${esc(k)} · ${esc(v.n)}</h3><p class="mini">${esc(v.note)}</p></div>`).join('')}</div>`};
SC.mobile=()=>`<div class="hd"><div><h2>С телефона</h2><p>Мобильная версия в браузере: ссылка сохраняется на экран как приложение, пуш-уведомления приходят, даже когда она закрыта. Отдельное приложение из магазина не нужно — оно в 2 раза дороже.</p></div></div>
 <div class="phones"><div class="phone"><div class="pht"><b>Нурсултан</b><small>мои сделки</small></div><div class="pb">${DEALS.filter(d=>d.m==='NS'&&d.st!=='real').map(d=>`<div class="pi"><span>${d.id} ${esc((d.co!=='—'?d.co:d.ct).slice(0,22))}<small>${STN(d.st).n}</small></span><b>${mln(dealSum(d))}</b></div>`).join('')}<div class="pbtn" onclick="go('funnel')">Открыть воронку</div></div></div>
 <div class="phone"><div class="pht"><b>Пуш-уведомления</b><small>экран блокировки</small></div><div class="pb"><div class="push"><b>РЕЕСТР · сейчас</b><span>Новая заявка Д-2330 с сайта — Караганда, СМР II. Взять в работу за 15 минут.</span></div><div class="push"><b>РЕЕСТР · 15:48</b><span>Клиент написал в мессенджер: «У конкурентов 700 тысяч…»</span></div><div class="push"><b>РЕЕСТР · 14:20</b><span>Пропущенный звонок +7 777 *** 08 93 — ТОО «Сапа Мед».</span></div></div></div></div>
 ${said('«Есть какое-то приложение, чтобы через мобильное устройство могли пользоваться?»','Платон: мобильная версия в браузере и пуш-уведомления — главное; приложение — по необходимости, оно в два раза дороже.')}`;
SC.move=()=>`<div class="hd"><div><h2>Переезд с amoCRM</h2><p>Переносим воронки с этапами, сделки, контакты и компании, задачи, примечания и файлы. Пока amoCRM оплачена — работаете параллельно, отключаете, когда удобно.</p></div></div>
 <div class="mvs">${[['1','Выгрузка из amoCRM','сделки, контакты, компании, файлы','ok'],['2','Воронки и этапы','«Отдел продаж», предложения, постоянные','ok'],['3','Поля и теги','услуга, город, источник, категория','on'],['4','Загрузка и сверка','вы проверяете, что всё на месте',''],['5','Переключение','сайт, маркетплейс, мессенджер, телефония — на новую систему','']].map(s=>`<div class="mv ${s[3]}"><i>${s[3]==='ok'?'✓':s[0]}</i><b>${s[1]}</b><span>${s[2]}</span></div>`).join('')}</div>
 <div class="wid"><div><small>Сделок</small><b>2 310</b><span>за всё время</span></div><div><small>Контактов</small><b>3 870</b><span>и 1 940 компаний</span></div><div><small>Файлов</small><b>3,3 ГБ</b><span>из сделок</span></div><div><small>amoCRM сейчас</small><b class="r">≈ 400 $</b><span>в год, 4 пользователя + пакеты памяти</span></div><div><small>Потом</small><b class="g">сервер</b><span>до 10 ГБ бесплатно</span></div></div>
 ${said('«amoCRM полностью будет в этой новой платформе, которую будем разрабатывать?» · «Мы можем какое-то время попользоваться — у нас оплачено».')}`;
SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Стандартный пакет разработки — 1 500 000 ₸ один раз, без абонентской платы. 4–6 недель до полной сдачи. Код и документацию передаём вам.</p></div></div>
 <div class="pk"><div><small>Стандартный пакет</small><b>1 500 000 ₸</b><span>150 000 · 675 000 · 675 000</span></div><div class="on"><small>Со скидкой за скорость −10 %</small><b>1 350 000 ₸</b><span>если договор подписан в течение суток: 150 000 · 600 000 · 600 000</span></div></div>
 <div class="pay3"><div><small>Старт · 10 %</small><b>150 000 ₸</b><span>собираем доступ к amoCRM, прайсы, шаблоны</span></div><div><small>Ядро · ~3 недели</small><b>600–675 тыс.</b><span>после того, как вы приняли ядро</span></div><div><small>Сдача · 4–6 недель</small><b>600–675 тыс.</b><span>после шлифовки и передачи кода</span></div></div>
 <div class="g2"><div class="pan"><h3>Ядро</h3>${['Воронки из amoCRM: отдел продаж, продают компанию, постоянные','Карточка сделки, распределение заявок','Маркетплейс фирм и интеграция сайта','Прайс и калькулятор, КП, счёт, договор','Переезд данных и файлов'].map(x=>`<div class="li"><i>✓</i><span>${x}</span></div>`).join('')}</div>
 <div class="pan"><h3>Шлифовка</h3>${['Мессенджер в карточке','Телефония: звонки, записи, минуты на линии','Аналитика отдела','Мобильная версия и пуш-уведомления','Ваши доработки — около 20 % времени заложено'].map(x=>`<div class="li n"><i>→</i><span>${x}</span></div>`).join('')}</div></div>
 ${said('«Мы годовую оплачиваем — где-то до четырёхсот».','Платон: своя система чуть дороже, но за два-три года полностью отрабатывает деньги — и всё ваше.')}`;

/* ===== Карточки ===== */
const CARD={};
CARD.newlead=()=>['Новая заявка','Уйдёт менеджеру по правилам распределения',`<div class="form"><label>Контакт<input id="nl_c" value="Асхат Бекенов"></label><label>Компания<input id="nl_co" value="ТОО «Жас Курылыс»"></label><label>Услуга<select id="nl_s">${SERV.map(s=>`<option value="${s.id}">${esc(s.n)}</option>`).join('')}</select></label><label>Город<select id="nl_city">${CITIES.map(c=>`<option>${c}</option>`).join('')}</select></label><label>Источник<select id="nl_src">${SRC.map(s=>`<option>${s}</option>`).join('')}</select></label></div><button class="bt p" onclick="newLead()">Создать</button>`];
function newLead(){const v=i=>document.getElementById(i).value;const A=Object.keys(MGR).filter(k=>!DIST.away[k]).sort((a,b)=>LEADS_TODAY[a]-LEADS_TODAY[b]);const m=A[0]||'NS';LEADS_TODAY[m]++;const id='Д-'+(2332+DEALS.length-12);DEALS.unshift({id,co:v('nl_co'),ct:v('nl_c'),city:v('nl_city'),sv:v('nl_s'),firm:null,m,st:'new',touch:0,src:v('nl_src'),note:''});closeM();curDeal=id;go('deal');toast(`${id} создана и ушла ${MGR[m]} — у него меньше всех заявок за день.`)}
CARD.sell=()=>['Предложение продать фирму','Попадёт в воронку «Продают компанию»',`<div class="form"><label>Фирма<input id="sl_n" value="ТОО «Каспий Строй»"></label><label>Кто продаёт<input id="sl_w" value="Ринат К."></label><label>Город<select id="sl_c">${CITIES.map(c=>`<option>${c}</option>`).join('')}</select></label><label>Лицензия<input id="sl_l" value="СМР III категория"></label><label>Цена продавца, ₸<input id="sl_p" value="2800000"></label></div><button class="bt p" onclick="const v=i=>document.getElementById(i).value;SELL.unshift({id:'P-'+(42+SELL.length-6),n:v('sl_n'),who:v('sl_w'),city:v('sl_c'),lic:v('sl_l'),ask:+v('sl_p')||0,st:'in',d:'05.10'});closeM();render();toast('Предложение добавлено — юристу ушла задача на проверку.')">Добавить</button>`];
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(k){toast('Готово.')}
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();const d=DEALS.find(x=>(x.id+x.co+x.ct+x.city).toLowerCase().includes(q));if(d&&allowed('deal')){openDeal(d.id);return}const f=FIRMS.find(x=>(x.id+x.n+x.city+x.lic).toLowerCase().includes(q));if(f&&allowed('firm')){curFirm=f.id;go('firm');return}toast('Не найдено: попробуйте «Д-2318», «Шымкент», «Сарыарка».')}

/* ===== Каркас: разделы сверху ===== */
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}.`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
function buildRail(){const on=SECOF[cur];document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="dir ${s.k===on?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')">${s.n}</a>`).join('')}
function buildSub(){const s=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.today;document.getElementById('ttl').textContent=SUBN[cur]||'Реестр';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();buildSub();
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('funnel')?'':'none';try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['today','1 · Пульт: заявки, сделки, звонки, маркетплейс и документы — одним экраном.'],
 ['funnel','2 · Воронка «Отдел продаж» с вашими этапами из amoCRM.'],
 ['deal','3 · Карточка сделки: услуга и цена из прайса, документы без лимита, мессенджер, звонки с записями.'],
 ['distrib','4 · Распределение заявок: поровну, по специализации, 15 минут на ответ.'],
 ['sellers','5 · Продают компанию: документы, проверка юристом, цена — и на маркетплейс.'],
 ['market','6 · Маркетплейс готовых фирм — тот же каталог, что на сайте.'],
 ['prices','7 · Прайс и калькулятор: цена, госпошлина и срок — сразу в КП.'],
 ['chat','8 · Мессенджер в карточке сделки.'],
 ['calls','9 · Звонки: минуты на линии, пропущенные, касания по менеджерам.'],
 ['files','10 · Хранилище документов — без пакетов памяти.'],
 ['analytics','11 · Аналитика отдела: воронка, источники, услуги.'],
 ['move','12 · Переезд с amoCRM — пока оплачено, работаете параллельно.'],
 ['launch','13 · Стоимость: 1,5 млн один раз, 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
