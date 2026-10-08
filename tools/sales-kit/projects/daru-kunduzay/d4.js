
const DEPS=['Маркетинг','Продажи','Услуги и клиника','Учёт и контроль','HR','IT'];
let TASKS=[
 ['Маркетинг','Запустить рекламу «Суставы» в Instagram','Тимур','09.10','work'],['Маркетинг','Снять 3 видео-отзыва пациентов','Тимур','12.10','new'],
 ['Продажи','Разбор 5 звонков Мадияра','Ерлан','08.10','work'],['Продажи','Обновить скрипт: предложение времени приёма','Ерлан','10.10','new'],
 ['Услуги и клиника','Заказать адеметионин 150 фл','Руслан','08.10','late'],['Услуги и клиника','Списать пиявки с истекающим сроком','Руслан','14.10','new'],
 ['Учёт и контроль','Сверка кассы за неделю','Мадина','09.10','work'],['Учёт и контроль','Зарплата за сентябрь','Мадина','10.10','work'],
 ['HR','Найти процедурную медсестру','Алия','20.10','work'],['HR','Адаптация нового менеджера КЦ','Алия','15.10','new'],
 ['IT','Подключить второй номер WhatsApp','—','12.10','new']
];
SC.tasks=()=>`<div class="hd"><div><h2>Задачи отделов</h2><p>Структура как в вашей схеме бизнеса: маркетинг, продажи, услуги и клиника, учёт и контроль, HR, IT. У задачи — исполнитель, срок, статус; просроченные видны руководителю.</p></div><div class="btns"><button class="bt p" onclick="toast('Новая задача: выберите отдел, исполнителя и срок.')">+ Задача</button></div></div>
 <div class="kb k6">${DEPS.map(d=>{const L=TASKS.filter(t=>t[0]===d);return `<div class="kc"><div class="kh"><b>${d}</b><span>${L.length}</span></div>${L.map(t=>`<div class="kd ${t[4]==='late'?'alarm':''}"><div class="kr">${t[1]}</div><div class="kf">${t[2]}<b>${t[3]}</b></div>${t[4]==='late'?'<div class="lack">просрочено</div>':''}</div>`).join('')}</div>`}).join('')}</div>`;

SC.hr=()=>`<div class="hd"><div><h2>HR и найм</h2><p>Два блока, как у вас: HR коммерческого блока (колл-центр, маркетинг) и HR клиники (врачи, медсёстры). Вакансии, кандидаты по этапам, онлайн-тест до собеседования — на интервью зовём только прошедших.</p></div></div>
 <div class="g2">${[['Коммерческий блок',[['Менеджер колл-центра (удалённо)',46,9,3],['Таргетолог',12,4,1]]],['Клиника',[['Процедурная медсестра',18,5,2],['Врач-терапевт',6,2,1]]]].map(b=>`<div class="pan"><h3>${b[0]}</h3><div class="tw"><table class="t"><thead><tr><th>Вакансия</th><th class="r">Откликов</th><th class="r">Прошли тест</th><th class="r">Интервью</th></tr></thead><tbody>${b[1].map(v=>`<tr><td><b>${v[0]}</b></td><td class="r mono">${v[1]}</td><td class="r mono">${v[2]}</td><td class="r mono">${v[3]}</td></tr>`).join('')}</tbody></table></div></div>`).join('')}</div>
 <p class="mini">Глубокая автоматизация найма (тренажёры по скриптам, тесты на каждую должность) — отдельно по желанию; в пакете — вакансии, кандидаты, этапы и задачи HR.</p>`;

SC.robots=()=>`<div class="hd"><div><h2>Роботы и рассылки</h2><p>Автоматические действия по пути пациента: напоминания о приёме, сообщения в дни курса, поздравления с праздниками и днём рождения, оценка курса и приглашение на контроль. Каждый робот включается переключателем.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Когда</th><th>Что делает</th><th>Канал</th><th>Вкл.</th></tr></thead><tbody>${[['Новая заявка','Передать менеджеру; через 3 минуты без ответа — свободному','система'],['За день до приёма','Напоминание, адрес, как подготовиться к анализам','WhatsApp'],['Курс подобран','КП курса с графиком по дням и суммой','WhatsApp'],['5-й день курса','Как самочувствие? Ответ уходит врачу','WhatsApp'],['Последний день курса','Оценка курса 1–10 и отзыв','WhatsApp'],['Оценка ниже 8','Задача руководителю — связаться с пациентом','система'],['Через месяц после курса','Приглашение на контрольный приём','WhatsApp'],['День рождения','Поздравление и подарок — фитосбор','WhatsApp'],['Праздники','Поздравление всем пациентам за год','WhatsApp']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="mini">${r[2]}</td><td><span class="sw on" onclick="this.classList.toggle('on')"></span></td></tr>`).join('')}</tbody></table></div>`;

SC.cabinet=()=>`<div class="hd"><div><h2>Личный кабинет пациента</h2><p>Пациент открывает кабинет по ссылке из WhatsApp или с сайта — в телефоне, как приложение, без установки. Видит запись, свой курс по дням, оплаты, переписку с клиникой, оценивает курс. Позже из этого же кабинета собирается мобильное приложение.</p></div></div>
 <div class="phones">
  <div class="mob"><div class="phh"><b>ДАРУ</b><span>Сауле Н.</span></div><div class="phb"><small>Ваш курс</small><b class="big">День 6 из 15</b>${pbar(40)}<div class="pl"><span>09:00</span>Капельница</div><div class="pl"><span>10:00</span>Магнитотерапия</div><div class="pl"><span>11:00</span>Хиджама</div><a class="pbtn">Перенести процедуру</a></div></div>
  <div class="mob"><div class="phh"><b>Оплаты</b><span>курс 401 000 ₸</span></div><div class="phb"><div class="pl"><span>26.09</span>Оплачено 371 000 ₸</div><div class="pl"><span>08.10</span>Хиджама доп. 30 000 ₸</div><a class="pbtn">Оплатить через Kaspi</a><small style="margin-top:12px">Документы</small><div class="pl"><span>PDF</span>Договор и чек</div><div class="pl"><span>PDF</span>Результаты анализов</div></div></div>
  <div class="mob"><div class="phh"><b>Чат с клиникой</b><span>врач и администратор</span></div><div class="phb"><div class="mg"><small>Клиника</small>Сауле, как самочувствие на 5-й день?</div><div class="mg me"><small>Вы</small>Лучше, давление 125/80.</div><div class="mg"><small>Асем Каримовна</small>Отлично, продолжаем по плану.</div><small style="margin-top:10px">Оцените курс</small><div class="stars">★★★★★</div></div></div>
 </div>
 ${said('«Эту программу мы ещё будем нашим клиентам передавать, чтобы они могли использовать».','Сейчас — кабинет в браузере телефона, входит в сайт. Мобильное приложение App Store / Google Play — отдельным этапом, когда кабинет обкатан.')}`;

SC.site=()=>`<div class="hd"><div><h2>Сайт клиники</h2><p>Сайт с описанием методики, процедур и врачей, отзывами и формой записи. Заявка с сайта сразу падает в воронку, вход в личный кабинет пациента — с сайта. Адаптирован под телефон.</p></div></div>
 <div class="site"><div class="sh"><b>ДАРУ</b><span>Методика · Процедуры · Врачи · Отзывы · Цены</span><a>Записаться</a></div><div class="shero"><h3>Комплексное лечение за 15 дней — дневной стационар без госпитализации</h3><p>10 дней основного курса и 5 дней очищения. Врач подбирает процедуры индивидуально: физиолечение, хиджама, иглотерапия, фитотерапия.</p><a>Записаться на консультацию</a></div><div class="sgrid">${['Капельницы по методике','Очищение печени и почек','Физиолечение','Хиджама и иглотерапия'].map(x=>`<div>${x}</div>`).join('')}</div></div>`;

SC.roles=()=>{const A=[['Пульт, ИИ, аналитика',{OW:2,RP:1,FD:1,MK:1}],['Заявки и карточка пациента',{OW:2,RP:2,MN:2,AD:1,DR:1}],['Звонки и оценка ИИ',{OW:2,RP:2,MN:1}],['Дисциплина и зарплата менеджеров',{OW:2,RP:2,FD:1}],['Конструктор курса',{OW:2,DR:2}],['Лечебный лист и процедуры',{OW:2,AD:1,DR:2,NS:2}],['Склад',{OW:2,SK:2,FD:1}],['Касса',{OW:2,AD:2,FD:2}],['Отчёты финдиректору',{OW:2,FD:2}],['Задачи, HR, роботы',{OW:2,RP:1,HR:2,MK:2}]];const R=Object.entries(ROLES);
 return `<div class="hd"><div><h2>Роли и права</h2><p>Каждый входит под своим логином: менеджер видит свои заявки, медсестра — свои процедуры, врач — своих пациентов, финдиректор — деньги. Пароли не передаются — у каждого свой вход.</p></div></div>
 <div class="tw"><table class="t mx"><thead><tr><th>Раздел</th>${R.map(([k,v])=>`<th class="c">${esc(v.av)}<span>${esc(k)}</span></th>`).join('')}</tr></thead><tbody>${A.map(a=>`<tr><td>${a[0]}</td>${R.map(([k,v])=>`<td class="c">${a[1][v.p]===2?'●':a[1][v.p]===1?'○':'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
 <p class="mini">● — меняет · ○ — только смотрит · — — не видит.</p>`};

SC.integr=()=>`<div class="hd"><div><h2>Интеграции и переезд</h2><p>Всё в одном окне: от amoCRM, МоегоСклада, Excel-кассы и таблиц можно отказаться. Переносим данные, подключаем телефонию и WhatsApp.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Сейчас</th><th>Что делаем</th><th>Статус</th></tr></thead><tbody>${[['amoCRM','Перенос пациентов, сделок и истории; заявки с рекламы — сразу в систему','в пакете'],['МойСклад','Перенос номенклатуры (~300 позиций) и остатков','в пакете'],['Excel-касса','Перенос долгов пациентов, касса в системе','в пакете'],['Sipuni (телефония)','Звонки и записи в карточке; при желании — переход на Binotel','в пакете'],['WhatsApp','Через провайдера (Green API, около 5 000 ₸/мес за номер)','в пакете'],['Kaspi','Оплата по ссылке и QR, отметка в кассе','в пакете · по API Kaspi'],['ИИ','Расшифровка и оценка звонков, помощник руководителя','в пакете · сервис по факту'],['1С','Не используете — не нужна; если понадобится — отдельно 800 000 ₸','отдельно']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td><span class="tag ${r[2]==='отдельно'?'':'g'}">${r[2]}</span></td></tr>`).join('')}</tbody></table></div>`;

SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Делаем с нуля под вас — не адаптируем коробку. Стандартный пакет разработки: ядро → полировка с вами → передача на ваш сервер.</p></div></div>
 <div class="pk3"><div class="on"><small>Портал клиники</small><b>2 500 000 ₸</b><span>всё, что в демо, кроме сайта; +10% объёма на полировку без доплаты</span></div><div class="on"><small>Сайт + кабинет пациента</small><b>800 000 ₸</b><span>сайт, запись, личный кабинет в браузере телефона</span></div><div><small>Мобильное приложение</small><b>3 000 000 ₸</b><span>отдельный этап: 2 месяца + месяц публикации; поддержка ≈1 млн ₸ в год</span></div></div>
 <div class="tot2"><span>Портал + сайт</span><b>3 300 000 ₸</b><em>при решении в день встречи — скидка 5%: 3 135 000 ₸</em></div>
 <div class="pay3"><div><small>Старт · 10 %</small><b>330 000 ₸</b><span>предоплата, договор</span></div><div><small>Ядро · 45 %</small><b>1 485 000 ₸</b><span>после утверждения ядра</span></div><div><small>Сдача · 45 %</small><b>1 485 000 ₸</b><span>после полной сдачи портала и сайта</span></div></div>
 <div class="g3"><div class="pan"><h3>Ядро · ~1,5 недели</h3>${['Воронка и карточка пациента','Конструктор курса и лечебный лист','Склад лекарств, касса','Задачи отделов, роли'].map(x=>`<div class="li"><i>✓</i><span>${x}</span></div>`).join('')}</div><div class="pan"><h3>Полировка · 3–4 недели</h3>${['1–2 созвона в неделю','Звонки, ИИ-оценка, дисциплина, зарплата','Роботы, HR, отчёты финдиректору','Сайт и кабинет пациента'].map(x=>`<div class="li n"><i>→</i><span>${x}</span></div>`).join('')}</div><div class="pan"><h3>Запуск и отладка</h3>${['Сервер, документация, обучение','1–2 недели отладки в работе','Потом — по часам, 20 $/ч','Код и данные — ваши'].map(x=>`<div class="li n"><i>→</i><span>${x}</span></div>`).join('')}</div></div>`;

const CARD={};
CARD.newlead=()=>['Новая заявка','Вручную или из рекламы автоматически',`<div class="form"><label>Имя<input id="nl_n" value="Жанна Омарова"></label><label>Телефон<input id="nl_p" value="+7 701 000 00 00"></label><label>Источник<select id="nl_s"><option>Instagram</option><option>TikTok</option><option>Реклама 2ГИС</option><option>Сарафан</option></select></label><label>Жалобы<input id="nl_c" value="Боли в спине, давление"></label></div><button class="bt p" onclick="newLead()">Добавить</button>`];
function newLead(){const v=i=>document.getElementById(i).value.trim();const id='P-'+(1063+PTS.length-11);PTS.unshift({id,n:v('nl_n'),age:45,ph:v('nl_p'),src:v('nl_s'),st:'new',m:'—',dr:'',day:0,course:null,paid:0,note:v('nl_c')});closeM();go('leads');toast(`${id} в воронке. Свободный менеджер получит заявку сразу.`)}
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){if(!v)return;toast('Поиск по пациентам, телефонам, курсам и препаратам: «'+esc(v)+'».')}

function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель клиники';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}.`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
function buildRail(){const on=SECOF[cur];document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="ri ${s.k===on?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><i><svg viewBox="0 0 24 24">${s.ic}</svg></i><span>${s.n}</span></a>`).join('')}
function buildSub(){const s=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.today;document.getElementById('ttl').textContent=SUBN[cur]||'Дару';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();buildRail();
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('leads')?'':'none';try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['today','1 · Пульт: заявки, пациенты на лечении, кабинеты, склад, касса — в одном окне.'],
 ['leads','2 · Путь пациента от заявки из рекламы до повторного визита.'],
 ['patient','3 · Карточка: WhatsApp, звонки с записью, история.'],
 ['calls','4 · ИИ оценивает каждый звонок по вашему скрипту.'],
 ['discipline','5 · Удалённые менеджеры: кто на линии, звонки, скорость ответов.'],
 ['builder','6 · Главное: курс собирается индивидуально из прайса, цена сразу.'],
 ['sheet','7 · Лечебный лист на 15 дней: отметки, списание, доплаты.'],
 ['schedule','8 · Расписание капельничной, кабинетов и врачей.'],
 ['stock','9 · Склад лекарств: сроки, минимум, списание по процедурам.'],
 ['cash','10 · Касса вместо Excel.'],
 ['findir','11 · Отчёты финдиректору и себестоимость курса.'],
 ['tasks','12 · Задачи отделов по вашей схеме бизнеса.'],
 ['robots','13 · Роботы: напоминания, оценка курса, праздники.'],
 ['cabinet','14 · Личный кабинет пациента — основа будущего приложения.'],
 ['aiboard','15 · ИИ-помощник руководителя.'],
 ['launch','16 · Стоимость: портал 2,5 млн + сайт 0,8 млн, приложение — отдельно.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
