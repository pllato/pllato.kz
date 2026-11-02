let theme='light';

/* ===== Каркас ===== */
function act(k){toast('Готово.')}
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();const m=MODELS.find(x=>(x.id+' '+x.n+' '+x.brand).toLowerCase().includes(q));if(m&&allowed('catalog')){curM=m.id;go('catalog');return}const c=CLIENTS.find(x=>(x.n+x.ph).toLowerCase().includes(q));if(c&&allowed('clients')){go('clients');toast(esc(c.n)+' · размер '+c.size);return}toast('Не найдено. Попробуйте: «Casadei», «ботфорты», «Алия».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;setMe();if(!allowed(cur))cur=ROLES[role].s[0];build()}
function setMe(){document.getElementById('me').textContent=ROLES[role].av;const n=document.getElementById('mename');if(n)n.innerHTML=`<b>${esc(ROLES[role].n)}</b><small>${esc(role)}</small>`}
function switchRole(k){role=k;setMe();const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){const cnt={sale:ORDERS.filter(o=>o.st==='new').length,goods:INCOME.filter(x=>x.st==='new').length+MOVES.filter(m=>m.st==='new').length,team:TASKS.filter(t=>t.st==='check').length};
 document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="ri ${s.k===SECOF[cur]?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><span>${s.n}</span>${cnt[s.k]?`<em>${cnt[s.k]}</em>`:''}</a>`).join('');
 const S=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=S.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.today;document.getElementById('ttl').textContent=SUBN[cur]||'Подиум';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme()}
const TOUR=[
 ['today','1 · Пульт собственника: выручка бутиков, конверсия, продано из коллекции и что требует решения.'],
 ['income','2 · Приход коллекции: файл поставщика → карточки, размеры и штрихкоды одной кнопкой.'],
 ['labels','3 · Этикетки печатаются пачкой — с размером и ценой.'],
 ['pos','4 · Касса: скан, скидка по акции сама, оплата наличными, картой или Kaspi QR.'],
 ['returns','5 · Возврат по чеку за минуту — пара на остаток, деньги тем же способом.'],
 ['promo','6 · Скидки на период включаются и выключаются сами.'],
 ['stock','7 · Остатки по бутикам и размерам.'],
 ['moves','8 · Система подсказывает, что переместить между бутиками.'],
 ['season','9 · Сезон: какая модель продаётся, а какая останется на распродажу.'],
 ['orders','10 · Kaspi и Instagram в одной доске.'],
 ['clients','11 · Покупатели: размер, бренды, VIP, давно не была.'],
 ['buh','12 · Бухгалтеру — файл для загрузки в 1С, без ручного ввода.'],
 ['move1c','13 · Переезд с 1С делаем мы; программисты — в Алматы.'],
 ['launch','14 · Стоимость: 2 500 000 ₸, 4–6 недель.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен — всё кликается: касса, приход, возвраты, акции, перемещения.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Собственник');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
