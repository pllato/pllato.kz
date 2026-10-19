/* Права доступа */
const GR=['Руководство','Юрист','Бухгалтерия','Договорной отдел','Снабжение','ОТК','Отдел кадров','Все сотрудники'];
const FD=['Договоры','Корреспонденция','Приказы по основной деятельности','Приказы по личному составу','Решения участника','Протоколы совещаний','Служебные записки','Кадры · личные дела'];
let MX={};const L0={'Руководство':'w','Юрист':'w'};
FD.forEach((f,i)=>GR.forEach(g=>{let v=L0[g]||'';if(!v){if(g==='Все сотрудники')v=['Служебные записки','Приказы по основной деятельности'].includes(f)?'r':'';else if(g==='Бухгалтерия')v=['Договоры','Корреспонденция'].includes(f)?'r':'';else if(g==='Договорной отдел')v=f==='Договоры'?'w':f==='Корреспонденция'?'r':'';else if(g==='Снабжение')v=['Договоры','Служебные записки'].includes(f)?'r':'';else if(g==='ОТК')v=f==='Корреспонденция'?'r':'';else if(g==='Отдел кадров')v=['Приказы по личному составу','Кадры · личные дела'].includes(f)?'w':''}if(g==='Юрист'&&f==='Кадры · личные дела')v='r';MX[f+'|'+g]=v}));
const MXN={'':['—','нет доступа'],r:['👁','просмотр'],w:['✎','просмотр и правка']};
SC.access=()=>`<div class="hd"><div><h2>Права доступа</h2><p>Руководитель сам решает, кто что видит: нажатие по клетке переключает «нет доступа → просмотр → правка». Без программиста и без настроек в коде. Права можно задать на папку, на вид документа или на один конкретный документ. Каждое изменение прав — в журнале.</p></div><div class="btns"><button class="bt" onclick="act('Пользователи: добавить сотрудника, назначить отдел, отключить уволенного — его документы остаются в архиве.')">Пользователи · 23</button></div></div>
 <div class="pan"><div class="tw"><table class="t mx bz-mx"><thead><tr><th>Папка</th>${GR.map(g=>`<th class="c">${g}</th>`).join('')}</tr></thead><tbody>${FD.map(f=>`<tr><td><b>${['Приказы по личному составу','Решения участника','Кадры · личные дела'].includes(f)?'🔒 ':''}${f}</b></td>${GR.map(g=>{const v=MX[f+'|'+g];return `<td class="c"><a class="bz-cell ${v}" title="${MXN[v][1]}" onclick="mxT('${f}','${g}')">${MXN[v][0]}</a></td>`}).join('')}</tr>`).join('')}</tbody></table></div><p class="hint">👁 просмотр · ✎ просмотр и правка · — нет доступа. Скачивание и печать можно запретить отдельно.</p></div>
 ${said('Права доступа мог определять руководитель — не внутренними настройками программирования, а с помощью интерфейса: предоставлять или исключать права доступа')}`;
function mxT(f,g){const k=f+'|'+g,c=['','r','w'];MX[k]=c[(c.indexOf(MX[k])+1)%3];render();toast(`${g} · «${f}»: ${MXN[MX[k]][1]}. Изменение записано в журнал.`)}

/* Журнал и ПДн */
SC.audit=()=>`<div class="hd"><div><h2>Журнал действий и персональные данные</h2><p>Каждое действие с документом записывается: кто открыл, скачал, изменил, согласовал, поменял права. Документы с персональными данными помечены — их открытие видно отдельно. Журнал нельзя изменить или удалить даже администратору.</p></div><div class="btns"><button class="bt" onclick="act('Журнал за период — выгрузка в Excel для проверки.')">Выгрузить журнал</button></div></div>
 <div class="wid"><div><small>Документов с ПДн</small><b>148</b><span>кадры, личный состав</span></div><div><small>Открытий ПДн за неделю</small><b>12</b><span>все — отдел кадров и руководитель</span></div><div><small>Попыток без доступа</small><b class="a">1</b><span>отклонено · руководитель уведомлён</span></div><div><small>Изменений прав</small><b>3</b><span>за октябрь</span></div></div>
 <div class="g2 g21"><div class="pan"><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Кто</th><th>Действие</th><th>Документ</th></tr></thead><tbody>${[['20.10 11:42','Владимир','согласовал с замечанием','ДОГ-2026-118'],['20.10 11:05','Отдел кадров','открыл (ПДн)','Личное дело · Сериков А.'],['20.10 10:31','Ерлан','попытка открыть — нет доступа','Кадры · личные дела'],['20.10 09:58','Руководитель','изменил права: Снабжение → просмотр','Договоры'],['20.10 09:40','Айгерим','зарегистрировала','ВХ-2026-0342'],['19.10 18:22','Финдиректор','скачал','ДОГ-2026-117'],['19.10 03:00','Система','резервная копия на второй сервер','весь архив']].map(r=>`<tr class="${r[2].startsWith('попытка')?'rowbad':''}"><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Защита персональных данных</h3><div class="kv"><span>Доступ к ПДн — только по правам</span><b class="pos">✓</b></div><div class="kv"><span>Метка «ПДн» на документе и папке</span><b class="pos">✓</b></div><div class="kv"><span>Журнал каждого открытия ПДн</span><b class="pos">✓</b></div><div class="kv"><span>Запрет скачивания и печати</span><b class="pos">по выбору</b></div><div class="kv"><span>Хранение на серверах компании</span><b class="pos">✓</b></div><div class="kv"><span>Шифрованное соединение и резервные копии</span><b class="pos">✓</b></div><div class="kv"><span>Вход с подтверждением кодом</span><b class="pos">по выбору</b></div><p class="hint">Помогает выполнять требования закона РК «О персональных данных и их защите»; это можно показывать партнёрам как преимущество.</p></div></div>
 ${said('Защита персональных данных через права доступа — и чтобы было видно, что есть элементы, которые обеспечивают сохранность персональных данных')}`;

/* Хранение */
SC.backup=()=>`<div class="hd"><div><h2>Хранение и резервные копии</h2><p>Система стоит на серверах, которые принадлежат компании. Основной сервер и резервный — в разных местах, копия каждую ночь. Раз в месяц проверяем, что из копии всё восстанавливается. Своей серверной в офисе не нужно — без затрат на железо, свет и интернет.</p></div></div>
 <div class="g2"><div class="pan"><h3>Серверы компании</h3><div class="bz-srv"><div><b>Основной</b><span>облачный сервер на вашу компанию</span><em class="pos">работает · 4,2 ГБ из 10 ГБ</em></div><i>⇄</i><div><b>Резервный</b><span>второй сервер у другого провайдера</span><em class="pos">копия 20.10 в 03:00 ✓</em></div></div>
  <div class="kv"><span>Резервное копирование</span><b>каждую ночь · храним 30 копий</b></div><div class="kv"><span>Проверка восстановления</span><b>ежемесячно · последняя 01.10 ✓</b></div><div class="kv"><span>Можно перенести на свой сервер в офисе</span><b>в любой момент</b></div></div>
 <div class="pan"><h3>Расходы на хранение</h3><div class="kv"><span>Сервер до 10 ГБ</span><b>бесплатно</b></div><div class="kv"><span>Если документов станет больше</span><b>5–10 $ в месяц</b></div><div class="kv"><span>Абонплата за систему</span><b>нет</b></div><div class="kv"><span>Если не заплатили — данные пропадут?</span><b class="pos">нет, система ваша</b></div>${tip('Почему не Битрикс','В подписочных системах при задержке оплаты доступ прерывается. Здесь программа и данные принадлежат компании: ничего не отключится.')}</div></div>
 ${said('Размещение на внутренних системах и серверах корпорации, и как альтернатива — коннектор с облаком')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Стандартный пакет разработки: документооборот и архив пишем с нуля под компанию. Не коробка — код и данные принадлежат вам. Каждый экран утверждаем вместе; 20–30% объёма оставляем в запасе на ваши идеи на этапе полировки.</p></div></div>
 <div class="pk1"><div><small>Стандартный пакет</small><b>1 500 000 ₸</b><span>один раз · без абонплаты · код ваш</span></div><div><small>Срок</small><b>4–6 недель</b><span>демо → ядро → полировка</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>150 000 ₸</b><span>при подписании</span></div><div><small>Ядро · 45%</small><b>675 000 ₸</b><span>после утверждения основного</span></div><div><small>Сдача · 45%</small><b>675 000 ₸</b><span>после полировки и запуска</span></div></div>
 <div class="g2"><div class="pan"><h3>Входит</h3><div class="kv"><span>Реестр, папки, поиск, карточка с версиями и следом</span><b>✓</b></div><div class="kv"><span>Согласование, маршруты, поручения, контроль</span><b>✓</b></div><div class="kv"><span>Журналы регистрации, права доступа, журнал действий, ПДн</span><b>✓</b></div><div class="kv"><span>Два сервера и резервные копии</span><b>✓</b></div><div class="kv"><span>Обучение, пилотный период, прямая линия</span><b>✓</b></div></div>
 <div class="pan"><h3>Второй этап, по желанию</h3><div class="kv"><span>Обмен с 1С: договоры и документы — в бухгалтерию</span><b>800 000 ₸</b></div><div class="kv"><span>Новые модули на основе системы</span><b>предложим, решаете вы</b></div><p class="hint">3 месяца после сдачи — бесплатно исправляем ошибки.</p></div></div>`;

/* Каркас */
const CARD={};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const d=DOCS.find(x=>(x.id+x.n+x.ca).toLowerCase().includes(v));if(d&&v){openDoc(d.id);return}toast('Ищите по номеру, названию или контрагенту: «ДОГ-2026-118», «претензия», «МедьПром».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">СВОД</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='approve'?'<em>'+APQ.filter(r=>!r[5]).length+'</em>':x[0]==='tasks'&&TASKS.some(t=>t.late)?'<em>'+TASKS.filter(t=>t.late).length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['registry','Реестр'],['nav','Архив'],['approve','Согласовать'],['tasks','Поручения']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'СВОД';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: что ждёт решения, просроченные поручения, динамика договоров.'],
 ['registry','2 · Реестр всех документов с поиском по тексту.'],
 ['nav','3 · Архив по папкам — путеводитель, замок на закрытых папках.'],
 ['doc','4 · Карточка документа: маршрут, версии, комментарии, след.'],
 ['approve','5 · Мои согласования: согласовать или вернуть с замечанием.'],
 ['tasks','6 · Поручения: исполнено, продлено, снято — со следом.'],
 ['journals','7 · Журналы регистрации входящих и исходящих.'],
 ['access','8 · Права доступа — руководитель меняет сам, нажатием.'],
 ['audit','9 · Журнал действий и персональные данные.'],
 ['backup','10 · Два сервера компании и резервные копии каждую ночь.'],
 ['launch','11 · Стоимость: 1,5 млн один раз, 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
