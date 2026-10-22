/* 1С */
SC.onec=()=>`<div class="hd"><div><h2>Обмен с 1С</h2><p>Бухгалтерия остаётся в 1С, но вводить в неё повторно ничего не нужно: реализации, поступления, оплаты и контрагенты уходят из системы сами, а данные бухгалтерии — обратно.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Данные</th><th>Направление</th><th>Когда</th></tr></thead><tbody>${[['Контрагенты и договоры','⇄ в обе стороны','при изменении'],['Реализации (накладные) дилерам и клиентам','система → 1С','при отгрузке'],['Поступления сырья и упаковки','система → 1С','при приходе'],['Оплаты из банка','1С → система','каждый час'],['Выпуск продукции и списание сырья','система → 1С','при закрытии партии']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div></div>`;

/* Переход */
SC.migrate=()=>`<div class="hd"><div><h2>Вместо МойСклад и Битрикс</h2><p>Всё, что сейчас разбросано по трём программам, — в одной. Данные переносим: товары, остатки, контрагенты, заказы и сделки из МойСклад и Битрикс. После запуска подписки этих сервисов можно отключить.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Сейчас</th><th>Для чего</th><th>В новой системе</th></tr></thead><tbody>${[['МойСклад','склад, остатки, заказы — основное','Склад сырья и ГП, производство, заказы, инвентаризация'],['Битрикс24','сделки, клиенты','Заказы и клиенты во всех каналах, кабинет дилера'],['1С','бухгалтерия','Остаётся — обмен с системой'],['Excel и звонки','долги, консигнация','Дебиторка, кредиторка, консигнация со сроками']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Битрикс, МойСклад есть, 1С; в основном МойСклад')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Стандартный пакет разработки: всё из демо, кроме обмена с 1С, который считается отдельно. Делаем под ваши процессы: база, затем версии на согласование, пока система не станет удобной. Система ваша — дальше платить не нужно.</p></div></div>
 <div class="pk1"><div><small>Пакет + обмен с 1С</small><b>2 800 000 ₸</b><span>2 000 000 ₸ система + 800 000 ₸ обмен с 1С · один раз</span></div><div><small>Срок</small><b>4–6 недель</b><span>база → полировка → запуск</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>280 000 ₸</b><span>при подписании</span></div><div><small>База · 45%</small><b>1 260 000 ₸</b><span>после приёмки базы на вашем сервере</span></div><div><small>Сдача · 45%</small><b>1 260 000 ₸</b><span>после полировки и передачи</span></div></div>
 <div class="g2"><div class="pan"><h3>Входит</h3><div class="kv"><span>Продажи, дилеры, маркетплейсы, ABC</span><b>✓</b></div><div class="kv"><span>Склады, производство, инвентаризация, логистика</span><b>✓</b></div><div class="kv"><span>Дебиторка, кредиторка, консигнация, деньги</span><b>✓</b></div><div class="kv"><span>Перенос из МойСклад и Битрикс, мобильная версия, до 50 пользователей</span><b>✓</b></div></div>
 <div class="pan"><h3>После сдачи</h3><div class="kv"><span>Сопровождение</span><b>3 месяца бесплатно</b></div><div class="kv"><span>Дальше</span><b>20 $ в час, по необходимости</b></div><div class="kv"><span>Сервер</span><b>бесплатно или 5–10 $</b></div></div></div>`;

/* Каркас */
const CARD={};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const o=ORD.find(x=>(x.id+x.cl+x.city).toLowerCase().includes(v));if(o&&v){go('orders');return}const g=GP.find(x=>(x[0]+x[1]).toLowerCase().includes(v));if(g&&v){go('fg');return}toast('Ищите по заказу, клиенту или товару: «З-2214», «ЗооМир», «котят».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">ПРОКОРМ</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='orders'?'<em>'+ORD.filter(o=>o.st==='new').length+'</em>':x[0]==='ar'?'<em>'+AR.filter(r=>r[4]>0).length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['orders','Заказы'],['ar','Долги'],['fg','Склад'],['logi','Рейсы']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'ПРОКОРМ';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: продажи по каналам, долги, деньги, остатки — вместо трёх программ.'],
 ['orders','2 · Заказы дилеров, Kaspi, Halyk и прямые — в одной воронке.'],
 ['abc','3 · ABC-анализ: что приносит выручку и маржу.'],
 ['dealer','4 · Кабинет дилера: заявка, наличие, долг.'],
 ['ar','5 · Кто нам должен и кому должны мы — со сроками.'],
 ['consign','6 · Консигнация: когда закрывать и сколько выставить.'],
 ['raw','7 · Склад сырья: на сколько дней хватит.'],
 ['prod','8 · Выпуск партий по рецептуре и себестоимость.'],
 ['logi','9 · Рейсы и водители.'],
 ['launch','10 · Стоимость: 2 млн + 1С 800 тыс., 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
