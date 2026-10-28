
/* Госзаказ ОСМС */
let OS=[['Айша, 7 лет','Детский','Нургалиева А.','Лечение кариеса 75','D-K02.1','ok'],['Алихан, 9 лет','Детский','Нургалиева А.','Герметизация фиссур 36','D-K02.0','ok'],['Серикова Б. · 24 нед.','Северный','Ахметова Д.','Пломба 26','D-K02.1','ok'],['Амина, 15 лет','Детский','Нургалиева А.','Удаление 85','D-K08.3','err'],['Ерасыл, 6 лет','Детский','Нургалиева А.','Пульпит 74','D-K04.1','err'],['Дамир, 18 лет 2 мес.','Южный','Ли С.','Лечение кариеса 46','D-K02.1','age']];
const OSE={ok:['проверено','ok'],err:['код не совпадает с услугой','bad'],age:['не подходит по возрасту','bad'],fix:['исправлено','ok']};
SC.osms=()=>`<div class="hd"><div><h2>Услуги по ОСМС · октябрь</h2><p>Бесплатное лечение детей до 18 лет и беременных. Врач отмечает услугу в карте, система сама подставляет код и проверяет его до отправки: возраст, беременность, услуга в перечне, код подходит к услуге и зубу, нет дублей. Ошибку видно сразу, а не через три года на проверке.</p></div>${filSw()}</div>
 <div class="wid"><div><small>Услуг за месяц</small><b>${Math.round(412*K[fil])}</b><span>дети ${Math.round(371*K[fil])} · беременные ${Math.round(41*K[fil])}</span></div><div><small>К оплате фондом</small><b>${tg(8400000*K[fil])}</b><span>по тарифам</span></div><div><small>С ошибкой</small><b class="r">${OS.filter(r=>r[5]==='err'||r[5]==='age').length}</b><span>не уйдут, пока не исправите</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Пациент</th><th>Филиал</th><th>Врач</th><th>Услуга</th><th>Код</th><th>Проверка</th><th></th></tr></thead><tbody>${OS.map((r,i)=>`<tr class="${r[5]==='err'||r[5]==='age'?'rowwarn':''}"><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td class="mono">${r[4]}</td><td>${tag(OSE[r[5]][0],OSE[r[5]][1])}</td><td>${r[5]==='err'?`<button class="bt sm" onclick="osFix(${i})">Исправить код</button>`:r[5]==='age'?`<button class="bt sm" onclick="osPaid(${i})">Перевести в платные</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Правила проверки — ваши','Перечень услуг, коды и правила настроим вместе с вашим специалистом по госзаказу. Поменялись правила фонда — меняем справочник, без переделки системы.')}
 ${said('Проверили 23, 24, 25 год — какой-то код неправильный, и из-за этого 14 миллионов хотят вернуть','Система не даст отправить услугу с неверным кодом и хранит, кто и что отметил. Чтобы такое не повторилось.')}`;
function osFix(i){OS[i][4]=i===3?'D-K08.1':'D-K04.0';OS[i][5]='fix';toast(`${OS[i][0]}: код заменён на ${OS[i][4]} по услуге «${OS[i][3]}». Изменение записано в журнал: кто, когда, что было.`);render()}
function osPaid(i){OS[i][5]='fix';OS[i][4]='платно';toast(`${OS[i][0]}: пациенту уже 18 — услуга переведена в платные, администратор предупредит пациента.`);render()}

/* Проверка кодов */
SC.audit=()=>`<div class="hd"><div><h2>Проверка кодов</h2><p>Сверка уже отправленных услуг за любой период — как это делает проверка фонда. Система показывает, где код, возраст, зуб или документ не сходятся, и кто отметил услугу. Перед ежемесячной отправкой специалист видит только то, что надо поправить.</p></div></div>
 <div class="wid"><div><small>Период</small><b>2023–2025</b><span>после переноса из MacDent</span></div><div><small>Услуг проверено</small><b>14 862</b><span>4 филиала</span></div><div><small>Вопросов к коду</small><b class="r">318</b><span>2,1 %</span></div><div><small>Сумма под вопросом</small><b>${tg(6900000)}</b><span>пример на придуманных данных</span></div></div>
 <div class="g2"><div class="pan"><h3>Где чаще ошибки</h3>${bars([['Код не подходит к услуге',164],['Возраст на дату приёма',71],['Нет подтверждения беременности',38],['Дубль услуги на тот же зуб',29],['Зуб не совпадает с картой',16]])}</div>
 <div class="pan"><h3>По врачам</h3>${[['Нургалиева А.','Детский',142],['Ли С.','Южный',88],['Ахметова Д.','Северный',51],['Сейткали А.','Центральный',37]].map(r=>`<div class="kv"><span>${r[0]} · ${r[1]}</span><b>${r[2]} вопросов</b></div>`).join('')}<div style="margin-top:10px"><button class="bt" onclick="act('Отчёт по проверке выгружен в Excel: пациент, дата, услуга, код, что не так, кто отметил.')">Выгрузить отчёт</button></div></div></div>
 ${tip('Для разговора с фондом','По каждой услуге — полная история: запись, карта, снимок, кто отметил код. Это помогает понять, где действительно ошибка, а где её нет. Юридическую часть ведёт ваш юрист.')}`;

/* Склад */
let MT=[['Композит Filtek A2','шприц 4 г','n',3,14,'3 дня'],['Анестетик Убистезин','карпула',null,640,300,'—'],['Имплант Osstem TS III','шт.','c',6,4,'—'],['Гуттаперча','упаковка','s',2,5,'5 дней'],['Перчатки нитрил M','упаковка 100 шт.',null,48,30,'—'],['Слепочная масса','банка','c',4,3,'—']];
SC.stock=()=>`<div class="hd"><div><h2>Материалы</h2><p>Остатки по филиалам. Врач отмечает выполненную услугу — материалы по норме списываются сами. Видно, на сколько дней хватит и кто тратит больше нормы.</p></div>${filSw()}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Материал</th><th>Ед.</th><th class="r">Остаток</th><th class="r">Минимум</th><th>Хватит</th><th></th></tr></thead><tbody>${MT.map((r,i)=>{const q=Math.round(r[3]*(r[2]?1:K[fil]));const low=r[3]<r[4];return `<tr class="${low?'rowwarn':''}"><td><b>${r[0]}</b>${r[2]?`<br><small class="mut">${FIL[r[2]]}</small>`:''}</td><td>${r[1]}</td><td class="r">${fmt(fil==='all'||!r[2]||r[2]===fil?q:0)}</td><td class="r">${r[4]}</td><td>${low?tag(r[5],'bad'):tag('хватит','ok')}</td><td>${low?`<button class="bt sm" onclick="mtOrder(${i})">Заказать</button>`:''}</td></tr>`}).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Нормы списания</h3><div class="kv"><span>Пломба светоотверждаемая</span><b>композит 0,3 г · адгезив 1 доза</b></div><div class="kv"><span>Лечение каналов</span><b>гуттаперча · силер · анестетик 1</b></div><div class="kv"><span>Имплантация</span><b>имплант · формирователь · анестетик 2</b></div></div>
 <div class="pan"><h3>Расход выше нормы · октябрь</h3><div class="kv"><span>Анестетик · Северный</span><b>+18 %</b></div><div class="kv"><span>Композит · Южный</span><b>+11 %</b></div></div></div>`;
function mtOrder(i){MT[i][3]+=MT[i][4]*2;toast(`${MT[i][0]}: заявка поставщику на ${MT[i][4]*2} ед. После прихода остаток обновится.`);render()}

/* Переход */
SC.migr=()=>`<div class="hd"><div><h2>Переход с MacDent</h2><p>Переносим пациентов, историю приёмов, планы лечения, прайсы и остатки. Работаете в MacDent до дня переключения. Оплаченная подписка дорабатывает своё — к её концу всё уже в новой системе.</p></div></div>
 <div class="dpflow">${['Выгрузка из MacDent','Пациенты и история','Прайсы и врачи','Остатки материалов','Сверка и переключение'].map((x,i)=>`<div><small>${i+1}</small><b>${x}</b></div>`).join('')}</div>
 <div class="g2"><div class="pan"><h3>Что меняется</h3><div class="kv"><span>Филиалы</span><b>4 сейчас, запас до 6</b></div><div class="kv"><span>Сотрудники</span><b>без ограничений</b></div><div class="kv"><span>Подписка за филиал</span><b>не нужна</b></div><div class="kv"><span>WhatsApp, CRM, склад, ОСМС</span><b>в одной системе</b></div></div>
 <div class="pan"><h3>Когда начинаем</h3><div class="kv"><span>Ноябрь</span><b>у вас проверка — не отвлекаем</b></div><div class="kv"><span>1 декабря</span><b>старт работ</b></div><div class="kv"><span>Середина декабря</span><b>первая версия на сервере</b></div><div class="kv"><span>Январь</span><b>сдача, 3 месяца сопровождения</b></div></div></div>
 ${said('Я и так в MacDent оплатила годовую; ноябрь — полная проверка, поэтому декабрь у меня первый','Подстроимся: старт 1 декабря, переключение — когда закончится подписка или раньше, как решите.')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и этапы</h2><p>Стандартный пакет разработки. Система ваша: код, сервер и данные у вас, без абонплаты за филиалы и сотрудников.</p></div></div>
 <div class="pk1"><div><small>Стандартный пакет</small><b>2 000 000 ₸</b><span>всё из демо, 4 филиала с запасом до 6</span></div><div><small>Срок</small><b>4–6 недель</b><span>первая версия через 10 дней</span></div></div>
 <div class="pay3"><div><small>1 · Старт · 10%</small><b>200 000 ₸</b><span>поднимаем сервер, выгружаем MacDent, подключаем WhatsApp</span></div><div><small>2 · Первая версия · 45%</small><b>900 000 ₸</b><span>запись, подтверждения, пациенты, планы работают на сервере — вы пользуетесь</span></div><div><small>3 · Полировка и сдача · 45%</small><b>900 000 ₸</b><span>правки по вашим замечаниям, ОСМС, склад, отчёты; код и ключи — ваши</span></div></div>
 <div class="g2"><div class="pan"><h3>Входит</h3>${['Расписание врачей по креслам, 4–6 филиалов','Подтверждения записи в WhatsApp каждое утро','Чаты, воронка, карта пациента с зубной формулой','Планы лечения и прайсы по филиалам','Услуги по ОСМС с проверкой кодов','Склад материалов со списанием на приём','Перенос из MacDent, 3 месяца сопровождения'].map(x=>`<div class="kv"><span>${x}</span><b>✓</b></div>`).join('')}</div>
 <div class="pan"><h3>Отдельно</h3><div class="kv"><span>WhatsApp (Green API)</span><b>≈ 5 000 ₸ в месяц вместо 36 000</b></div><div class="kv"><span>Сервер</span><b>≈ 15–30 $ в месяц</b></div><div class="kv"><span>Доработки после сдачи</span><b>по часам</b></div></div></div>
 ${tip('Работаем вместе','После первой версии вы пользуетесь и говорите, что добавить, убрать и поменять — это последний, самый большой этап, он входит в пакет. После сдачи 3 месяца в бою поддерживаем: наши ошибки исправляем бесплатно.')}`;

/* Каркас */
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const p=PT.find(x=>(x[0]+x[1]+x[3]).toLowerCase().includes(v));if(p&&v&&allowed('patients')){go('patients');card('pt',p[0]);return}toast('Ищите по пациенту, телефону или врачу: «Мусина», «Ким», «Айша».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">АҚ ТІС</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='inbox'?'<em>'+INB.filter(r=>r[5]).length+'</em>':x[0]==='audit'?'<em>'+OS.filter(r=>r[5]==='err'||r[5]==='age').length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['sched','Запись'],['remind','WhatsApp'],['patients','Пациенты'],['plan','Планы'],['osms','ОСМС'],['stock','Склад']].filter(x=>allowed(x[0])).slice(0,5).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'АҚ ТІС';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт сети: записи, подтверждения, выручка, ОСМС.'],
 ['sched','2 · Расписание врачей по креслам — цвет = ответ пациента.'],
 ['remind','3 · Каждое утро WhatsApp: «запись сегодня — подтверждаете?»'],
 ['funnel','4 · От обращения до завершённого лечения.'],
 ['patients','5 · Карта пациента с зубной формулой на всю сеть.'],
 ['plan','6 · План лечения: этап выполнен — касса, зарплата, склад.'],
 ['osms','7 · ОСМС: код проверяется до отправки.'],
 ['stock','8 · Материалы списываются на приём сами.'],
 ['launch','9 · 2 000 000 ₸, 4–6 недель, старт 1 декабря.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
