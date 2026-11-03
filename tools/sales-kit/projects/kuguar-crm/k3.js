let theme='light';

/* ===== Каркас ===== */
function act(k){toast('Готово.')}
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();const l=LEADS.find(x=>(x.id+' '+x.n+' '+x.ph).toLowerCase().includes(q));if(l&&allowed('lead')){curL=l.id;go('lead');return}toast('Не найдено. Попробуйте: «Z-1039», «Жанна», «Тюбетейка».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Директор';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;setMe();if(!allowed(cur))cur=ROLES[role].s[0];build()}
function setMe(){document.getElementById('me').textContent=ROLES[role].av;const n=document.getElementById('mename');if(n)n.innerHTML=`<b>${esc(ROLES[role].n)}</b><small>${esc(role)}</small>`}
function switchRole(k){role=k;setMe();const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){const cnt={crm:LEADS.filter(l=>l.stg==='new').length,mont:LEADS.filter(l=>l.stg==='mount').length};
 document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="ri ${s.k===SECOF[cur]?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><span>${s.n}</span>${cnt[s.k]?`<em>${cnt[s.k]}</em>`:''}</a>`).join('');
 const S=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=S.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.today;document.getElementById('ttl').textContent=SUBN[cur]||'Кугуар';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme()}
const TOUR=[
 ['site','1 · Сайт: плавающая кнопка «Хочу быть в безопасности!» на всех страницах.'],
 ['funnel','2 · Заявка с сайта попадает в воронку «Новая»; клиенту и менеджеру — бот в WhatsApp.'],
 ['lead','3 · Карточка заявки: менеджер квалифицирует — обследование, КП без обследования или нестандартный запрос.'],
 ['lead','4 · Смета и договор формируются системой и уходят клиенту в WhatsApp.'],
 ['installer','5 · Монтажник видит задачу в телефоне и отмечает «Завершено» — клиенту уходит акт.'],
 ['cabinet','6 · Клиент на охране: личный кабинет — объект, документы, заявки, бонусы.'],
 ['loyal','7 · Правила лояльности.'],
 ['summary','8 · Сводка директора: источники, стадии, конверсия, просрочки.'],
 ['bp','9 · Все 7 бизнес-процессов договора — где их посмотреть.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен — всё кликается: заявка с сайта, квалификация, смета, договор, монтаж, кабинет.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Директор');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
