/* Кабинет тренера */
let TC=0;
const TCL=[['Ержан Сатыбалдиев','Похудение · 3 тренировки в неделю',[96.4,94.1,92.8,91.5,90.2],'1 900 ккал · белок 140 г'],['Данияр Касымов','Набор массы · 4 тренировки',[71.2,72.0,72.9,73.4,74.1],'3 100 ккал · белок 160 г'],['Алия Нурланова','Тонус · 2 тренировки',[61.0,60.6,60.2,59.9,59.7],'1 700 ккал · белок 110 г']];
SC.trainer=()=>{const c=TCL[TC];
 return `<div class="hd"><div><h2>Кабинет тренера · Арман · Самал</h2><p>Тренер ведёт своих клиентов: цели, замеры и вес, план тренировок и питания. Клиент видит свою программу и прогресс в приложении, отмечает выполненное. Руководитель видит загрузку и удержание клиентов у каждого тренера.</p></div></div>
 <div class="seg">${TCL.map((x,i)=>`<a class="${i===TC?'on':''}" onclick="TC=${i};render()">${x[0]}</a>`).join('')}</div>
 <div class="g2 g21"><div class="pan"><h3>${c[0]} · ${c[1]}</h3><h3 style="margin-top:6px">Вес за 4 недели, кг</h3>${bars(c[2].map((v,i)=>['неделя '+(i+1),v,v.toFixed(1).replace('.',',')]))}
  <h3 style="margin-top:12px">Программа на неделю</h3>${[['Пн','Грудь, трицепс · 6 упражнений','выполнено'],['Ср','Спина, бицепс · 6 упражнений','выполнено'],['Пт','Ноги, плечи · 7 упражнений','сегодня'],['Вс','Кардио 40 минут','—']].map(r=>`<div class="kv"><span><b>${r[0]}</b> · ${r[1]}</span><b>${r[2]==='выполнено'?tag(r[2],'g'):r[2]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Питание</h3><div class="kv"><span>Норма</span><b>${c[3]}</b></div><div class="kv"><span>План</span><b>5 приёмов · шаблон «${c[1].split(' ·')[0]}»</b></div><div class="btns l"><button class="bt sm" onclick="act('План питания отправлен клиенту в приложение.')">Отправить в приложение</button></div>
  <h3 style="margin-top:12px">Мои показатели · октябрь</h3><div class="kv"><span>Клиентов</span><b>24</b></div><div class="kv"><span>Персональных тренировок</span><b>186</b></div><div class="kv"><span>Продлили персональные</span><b>83%</b></div></div></div>
 ${said('Модуль для тренеров: вести клиентов, записывать результаты, вес, прописывать план питания, программы тренировок')}`};

/* Мобильное приложение */
SC.app=()=>`<div class="hd"><div><h2>Кабинет клиента и приложение</h2><p><b>Этап 1</b> — кабинет клиента в телефоне без установки (веб-версия): абонемент, QR, запись, гостевое посещение в другом клубе. <b>Этап 2</b>, после месяца работы, — одно приложение для всей сети в App Store и Google Play. QR для турникета в любом клубе, абонемент и продление с автоплатежом, запись на групповые занятия, программа и прогресс от тренера, уведомления. В этапе 2 — тренеры, годовые программы и геймификация: серии, звёзды и уровни как в Duolingo, тренировки с друзьями, челленджи между клубами.</p></div></div>
 <div class="g3 bz-phones">${[['Вход в клуб','<div class="bz-qr">▦▦▦<br>▦ ▦<br>▦▦▦</div><b>Покажите QR на турникете</b><span>действует в 18 клубах</span>'],['Абонемент','<b>Безлимит · вся сеть</b><span>до 25.10.2026 · осталось 2 дня</span><a>Продлить · 29 000 ₸</a><span>автопродление по карте: выкл.</span>'],['Запись','<b>Сайкл · 18:00 · Арман</b><span>мест нет · вы 2-й в листе ожидания</span><b style="margin-top:8px">Бокс · 19:00 · Ерлан</b><a>Записаться · 2 места</a>'],['Прогресс','<b>−6,2 кг за 4 недели</b><span>12 тренировок · серия 9 дней</span><span>программа на пятницу: ноги, плечи</span>']].map(p=>`<div class="pan"><h3>${p[0]}</h3><div class="phmini">${p[1]}</div></div>`).join('')}</div>
 <div class="g2"><div class="pan"><h3>Оплаты в приложении</h3><div class="kv"><span>Покупка и продление абонемента</span><b>эквайринг банка</b></div><div class="kv"><span>Автопродление (рекуррентные платежи)</span><b>по согласию клиента</b></div><div class="kv"><span>Персональные тренировки, бар</span><b>по желанию</b></div></div>
 <div class="pan"><h3>Публикация</h3><div class="kv"><span>App Store и Google Play</span><b>2–3 недели на проверку</b></div><div class="kv"><span>Аккаунты разработчика</span><b>на компанию клиента</b></div></div></div>
 ${said('Мобильное приложение: доступ на турникетную систему, эквайринг, рекуррентные платежи, онлайн-продажа, запись на групповые программы')}`;

/* Единое ядро */
SC.core=()=>`<div class="hd"><div><h2>Единое ядро и этапы</h2><p>Сейчас у вас три программы: управление клубом с кассой, продажи в Битрикс и приложение. Правильно — одно окно: что происходит в клубе, сразу видно в воронке продаж. Поэтому продажи и управление клубом делаем одним проектом, а приложение с тренерами и геймификацией — вторым этапом.</p></div></div>
 <div class="bz-core"><div class="c"><b>ЯДРО</b><span>клиенты и карты · клубы и франшизы · абонементы · деньги · права и роли · журнал</span></div>${[['Этап 1 · Финансы','P&L клубов, выписки Kaspi и Halyk, инвесторы, взаиморасчёты'],['Этап 1 · Продажи','воронки от событий клуба, Instagram, WhatsApp, Sipuni'],['Этап 1 · Клуб','касса, бар и склад, турникеты, занятия, загрузка'],['Этап 1 · Кабинет клиента','в телефоне без установки'],['Этап 2 · Приложение','App Store и Google Play'],['Этап 2 · Тренеры и геймификация','годовые программы, серии, челленджи']].map(m=>`<div class="m"><b>${m[0]}</b><span>${m[1]}</span></div>`).join('')}</div>
 <div class="pan"><h3>План</h3><div class="kv"><span>Ядро на сервере, первые версии</span><b>через 10–15 дней</b></div><div class="kv"><span>Этап 1 полностью, 7–10 версий с вашими правками</span><b>4–6 недель</b></div><div class="kv"><span>Месяц работы в бою, дорабатываем кабинет клиента</span><b>≈ 1 месяц</b></div><div class="kv"><span>Этап 2: приложение, тренеры, геймификация</span><b>затем · весь проект 3–4 месяца</b></div><div class="kv"><span>Переход с TS Portal и Битрикс</span><b>переносим то, что у вас работает хорошо</b></div></div>
 ${said('Два окна исходит из того, что у них розничная торговля уже была, фитнес написали потом и интегрировали')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и этапы</h2><p>Объединили блоки: ядро с финансами, продажи и управление клубом — один проект, приложение с тренерами и геймификацией — второй. 1С не нужна: выписки банков и отчёты в Excel для бухгалтерии. Вместо 10,8 млн ₸ — 6,5 млн ₸.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Этап</th><th>Что входит</th><th>Срок</th><th style="text-align:right">Стоимость</th></tr></thead><tbody>${[['1. Ядро, финансы, продажи и клуб','клиенты, клубы, абонементы (заморозка, возврат, передача), права; P&L клубов, выписки Kaspi и Halyk, инвесторы, взаиморасчёты между клубами; воронки от событий клуба; касса, бар и склад, турникеты, занятия, загрузка; кабинет клиента в телефоне','4–6 недель','3 000 000 ₸'],['2. Приложение, тренеры, геймификация','приложение в App Store и Google Play, кабинет тренера, годовые программы, серии и челленджи','после месяца работы этапа 1','3 500 000 ₸'],['Обмен с 1С','не нужен — выписки банков и Excel для бухгалтерии','—','0 ₸']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td class="mono" style="text-align:right">${r[3]}</td></tr>`).join('')}<tr><td colspan="3"><b>Вся система</b> <small>(было 10 800 000 ₸)</small></td><td class="mono" style="text-align:right"><b>6 500 000 ₸</b></td></tr></tbody></table></div></div>
 <div class="pay3"><div><small>Старт этапа 1 · 10%</small><b>300 000 ₸</b><span>единственная предоплата</span></div><div><small>Ядро · 45%</small><b>1 350 000 ₸</b><span>рабочая версия на сервере, вы её приняли</span></div><div><small>Сдача · 45%</small><b>1 350 000 ₸</b><span>после полировки и вашей приёмки</span></div></div>
 <div class="g2"><div class="pan"><h3>Гарантии</h3><div class="kv"><span>Предоплата</span><b>только 10% на старте</b></div><div class="kv"><span>Ядро</span><b>платите после того, как приняли рабочую версию</b></div><div class="kv"><span>Правки</span><b>переделываем, пока не примете</b></div><div class="kv"><span>Запас на доработки</span><b>≈ 15% времени проекта</b></div><div class="kv"><span>NDA</span><b>в договоре</b></div></div>
 <div class="pan"><h3>Отдельно</h3><div class="kv"><span>Эквайринг, комиссии банка</span><b>по тарифу банка</b></div><div class="kv"><span>Сервис выписок, если банк не даёт API</span><b>≈ 10 000 ₸ в месяц</b></div><div class="kv"><span>Аккаунты Apple и Google</span><b>на компанию, этап 2</b></div><div class="kv"><span>Сервер</span><b>ваш · 5–15 $ в месяц</b></div></div></div>
 ${said('Итого за всё про всё, с приложением — во сколько нам станет?','Объединяем блоки: 3 млн ₸ этап 1 и 3,5 млн ₸ этап 2 — 6,5 млн ₸ вместо 10,8; 1С не нужна.')}`;

/* Каркас */
const CARD={};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const m=MEM.find(x=>(x.id+x.n+x.ph).toLowerCase().includes(v));if(m&&v){go('members');return}const c=CLUBS.findIndex(x=>(x[0]+x[1]).toLowerCase().includes(v));if(c>=0&&v){curClub=c;go('inv');return}toast('Ищите по клиенту, карте или клубу: «Ержан», «BL-04812», «Есиль».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">FITNESSBLITZ</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='money'?'<em>'+OPS.filter(o=>o[6]!=='ok').length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Сеть'],['fin','Финансы'],['funnel','Продажи'],['pos','Касса'],['app','Прилож.']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'FitnessBlitz';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт сети: выручка, абонементы, посещения, лиды, неразнесённые деньги.'],
 ['fin','2 · Финансы каждого клуба — прозрачно, как у Додо.'],
 ['bank','3 · Выписки Kaspi и Halyk вместо 1С.'],
 ['mutual','4 · Взаиморасчёты между клубами: гостевые визиты и зачёт.'],
 ['load','5 · Загрузка клубов: где недогруз, где расширяться.'],
 ['triggers','6 · События клуба сами создают задачи в воронках продаж.'],
 ['sub','7 · Абонемент: заморозка, возврат, передача.'],
 ['ltv','8 · LTV и честная доходность: продажи минус возвраты.'],
 ['pos','9 · Касса без двойных чеков.'],
 ['app','10 · Кабинет клиента сейчас, приложение — этапом 2.'],
 ['data','11 · Ваши данные и резервные копии.'],
 ['launch','12 · Стоимость: 3 + 3,5 = 6,5 млн ₸ вместо 10,8.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
