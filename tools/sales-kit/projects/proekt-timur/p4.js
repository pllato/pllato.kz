
const CARD={};
CARD.newpr=()=>['Новый проект','Разделы создадутся по шаблону типа объекта',`<div class="form"><label>Объект<input id="np_n" value="Склад 1 200 м² и АБК"></label><label>Клиент<input id="np_c" value="ТОО «Шыгыс Агро»"></label><label>Тип объекта<select id="np_t"><option>Производственное здание · 18 разделов</option><option>Детский сад · 24 раздела</option><option>Жилой дом · 28 разделов</option><option>Школа · 30 разделов</option></select></label><label>ГИП<select id="np_g"><option>Ерлан</option><option>Асель</option></select></label><label>Сумма договора, ₸<input id="np_s" value="9800000"></label><label>Направления<select><option>Проект + стройка + слаботочка</option><option>Только проект</option></select></label></div><button class="bt p" onclick="newPr()">Создать</button>`];
function newPr(){const v=i=>document.getElementById(i).value.trim();const id='П-'+(2623+PRJ.length-7);PRJ.push({id,n:v('np_n'),cl:v('np_c'),addr:'—',st:'land',gip:v('np_g'),sum:+v('np_s')||0,paid:0,due:'—',done:0,docs:parseInt(v('np_t').split('·')[1])||18,late:0,full:true});closeM();curPr=id;go('projects');toast(`${id} создан: стадия «Земельный участок», разделы по шаблону, ГИП ${v('np_g')} уведомлён.`)}
CARD.newlead=()=>['Новое обращение','Клиента привёл директор или учредитель',`<div class="form"><label>Клиент<input id="nl_n" value="ТОО «Иртыш Логистик»"></label><label>Что нужно<input id="nl_t" value="Проект и строительство склада"></label><label>Кто привёл<select id="nl_s"><option>Тимур</option><option>Учредитель</option></select></label><label>Ориентир, ₸<input id="nl_m" value="12000000"></label></div><button class="bt p" onclick="newLead()">Добавить</button>`];
function newLead(){const v=i=>document.getElementById(i).value.trim();const id='К-'+(305+LEADS.length-6);LEADS.unshift({id,n:v('nl_n'),t:v('nl_t'),src:v('nl_s'),st:'new',sum:+v('nl_m')||0,who:'Тимур',d:'07.10'});closeM();go('leads');toast(`${id} в воронке клиентов.`)}
CARD.expadd=()=>['Замечание экспертизы','Привязать к разделу и исполнителю',`<div class="form"><label>Раздел<select id="ea_s">${DOCS.map(d=>`<option>${d[0]}</option>`).join('')}</select></label><label>Срок<input id="ea_d" value="10.10"></label><label style="grid-column:1/3">Текст замечания<input id="ea_t" value="Уточнить нагрузки на перекрытие в осях 2–3"></label></div><button class="bt p" onclick="expAdd()">Добавить</button>`];
function expAdd(){const v=i=>document.getElementById(i).value.trim();const sec=v('ea_s');const d=DOCS.find(x=>x[0]===sec);EXP.push({n:EXP.length+1,sec,t:v('ea_t'),who:d?d[2]:'—',due:v('ea_d'),st:'work'});closeM();render();toast(`Замечание добавлено и отправлено исполнителю раздела ${sec}.`)}
CARD.newfun=()=>['Новая воронка','Своё направление со своими этапами',`<div class="form"><label>Название<input value="Инженерные сети (ВК, ОВ)"></label><label>Этапы через запятую<input value="Обследование, Материалы, Монтаж, Испытания, Акты"></label></div><button class="bt p" onclick="closeM();toast('Воронка создана. Выберите, кто в ней работает, — права по должностям.')">Создать</button>`];
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){if(!v)return;toast('Поиск по проектам, разделам, клиентам и файлам: «'+esc(v)+'».')}

function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Директор проектного отдела';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}.`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
/* Навигация — дерево разделов в одной колонке */
function buildRail(){const on=SECOF[cur];document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<div class="tg ${s.k===on?'on':''}"><a class="th" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')">${s.n}</a><div class="tsub">${s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')}</div></div>`).join('')}
function buildSub(){const s=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.today;document.getElementById('ttl').textContent=SUBN[cur]||'Ось';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();buildRail();
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('projects')?'':'none';try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['today','1 · Пульт директора: проектирование, стройка и слаботочка в одном месте.'],
 ['leads','2 · Воронка клиентов: обращения от вас и учредителя не теряются.'],
 ['projects','3 · Канбан проектов: участок → ИРД → эскиз → проект → экспертиза → РД.'],
 ['project','4 · Карточка проекта: стадии, разделы, файлы, ход проекта.'],
 ['docs','5 · 20–30 разделов, у каждого исполнитель и срок.'],
 ['ird','6 · Участок и технические условия — сроки госорганов на виду.'],
 ['expert','7 · Замечания экспертизы → исполнителям → сводный ответ.'],
 ['load','8 · Загрузка проектировщиков: перегруз видно заранее.'],
 ['build','9 · Строительство — своя воронка в той же системе.'],
 ['lowcur','10 · Монтаж слаботочных систем — ваша зона.'],
 ['chat','11 · Переписка по проектам вместо WhatsApp.'],
 ['finance','12 · Бухгалтерия по проектам вместо отдельного Excel.'],
 ['analytics','13 · Стоимость проектов и сроки стадий.'],
 ['funnels','14 · Свои воронки под каждое направление.'],
 ['launch','15 · Стоимость: 2 млн, 4–6 недель, 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
