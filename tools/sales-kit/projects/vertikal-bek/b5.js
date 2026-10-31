
/* ===== Каркас ===== */
function act(k){toast('Готово.')}
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();const p=PROJECTS.find(x=>(x.n+' '+x.cl).toLowerCase().includes(q));if(p){openP(p.id);return}const s=STAFF.find(x=>x.n.toLowerCase().includes(q));if(s&&allowed('staff')){go('staff');toast(esc(s.n)+' — '+esc(s.pos));return}toast('Не найдено. Попробуйте: «Тау», «LogiPark», «Данияр».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;setMe();if(!allowed(cur))cur=ROLES[role].s[0];build()}
function setMe(){document.getElementById('me').textContent=ROLES[role].av;const n=document.getElementById('mename');if(n)n.innerHTML=`<b>${esc(ROLES[role].n)}</b><small>${esc(role)}</small>`}
function switchRole(k){role=k;setMe();const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){const cnt={today:2,tasks:TASKS.filter(t=>t.st==='check').length,time:FIELD().filter(s=>MARKS[s.id]&&['none','far'].includes(MARKS[s.id][1])).length,safety:FIELD().filter(s=>s.dop<TODAY).length,materials:MATS.filter(m=>m.st==='new').length,acts:ACTS.filter(a=>a.st==='draft').length};
 document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<div class="ng">${s.n}</div>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="ri ${x[0]===cur?'on':''}" onclick="go('${x[0]}')"><code>${x[2]}</code><span>${esc(x[1])}</span>${cnt[x[0]]?`<em>${cnt[x[0]]}</em>`:''}</a>`).join('')).join('')}
const SUBT={today:'Объекты, люди, часы и деньги — на одном экране',map:'Отметки с геолокацией',projects:'Бюджет, график, команда и факт',project:'Этапы, наряды, команда',gantt:'Сроки всех объектов',tasks:'Бригады, плановые и фактические часы',time:'Приход и уход с телефона',sheet:'Собирается сам из отметок',mobile:'Так это видит рабочий',staff:'Должности, ставки, допуски',safety:'Допуски, инструктажи, СИЗ',cost:'Материалы, труд, техника, субподряд',payroll:'Часы, сдельщина, переработки',clients:'Договоры, акты, долги',acts:'Выполненные объёмы за месяц',materials:'От прораба до объекта',machines:'Моточасы и стоимость',c1:'Табель, начисления, акты, оплаты',reports:'Кнопкой вместо Excel',roles:'Кто что видит',launch:'Цена, оплата, сроки'};
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.today;document.getElementById('ttl').textContent=SUBN[cur]||'Вертикаль';const sb=document.getElementById('subt');if(sb)sb.textContent=SUBT[cur]||'';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('light',theme==='light')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme()}
const TOUR=[
 ['today','1 · Пульт руководителя: объекты, люди на местах, часы, ФОТ, маржа и что требует решения.'],
 ['map','2 · Где люди сейчас: отметки с геолокацией, «вне объекта» видно сразу.'],
 ['mobile','3 · Так отмечается рабочий: «Я на объекте» + фото, время идёт на наряд.'],
 ['time','4 · Учёт времени сегодня: пришёл, опоздал, не вышел, отработано.'],
 ['sheet','5 · Табель за месяц собирается сам и уходит в 1С.'],
 ['projects','6 · Все проекты: бюджет, готовность, труд факт против плана.'],
 ['project','7 · Карточка проекта: по каждому этапу видно, где труд дороже сметы.'],
 ['tasks','8 · Наряды бригадам с плановыми часами — перерасход виден сразу.'],
 ['cost','9 · Себестоимость и маржа каждого объекта в моменте.'],
 ['payroll','10 · Зарплата из часов и нарядов: почасовые, сдельщики, переработки.'],
 ['c1','11 · Обмен с 1С без двойного ввода.'],
 ['launch','12 · Стоимость: 10 800 000 ₸ + 1С 500 000 ₸.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■ Стоп';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Руководитель');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶ Сценарий'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
