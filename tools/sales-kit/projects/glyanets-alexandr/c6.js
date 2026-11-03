
/* ===== Мультибизнес ===== */
SC.multi=()=>{const tot=BIZ.reduce((a,b)=>a+b.rev,0);
 return `<div class="hd"><div><h2>Мультибизнес · опция +400 000 ₸</h2><p>У Александра есть и другие направления — ассоциация скалолазания, баскетбол. Их можно вести в этой же системе: у каждого своя воронка, свой склад, свои задачи и команда — а у собственника один сводный пульт. Переключатель бизнеса — слева вверху.</p></div></div>
 <div class="mbiz">${BIZ.map(b=>`<a class="${b.id===biz?'on':''}" style="--c:${b.c}" onclick="setBiz('${b.id}')"><i></i><b>${b.n}</b><span>${b.d}</span>
  <div class="kv"><span>Продажи ноября</span><b>${mln(b.rev)} ₸</b></div><div class="kv"><span>Открытых сделок</span><b>${b.deals}</b></div><div class="kv"><span>Склад</span><b>${mln(b.stock)} ₸</b></div><div class="kv"><span>Задач</span><b>${b.tasks}</b></div><div class="share"><i style="width:${pct(b.rev,tot)}%"></i></div><small>${pct(b.rev,tot)}% выручки группы</small></a>`).join('')}</div>
 <div class="g2"><div class="pan"><h3>Что даёт опция</h3>${[['Мультиворонки','у каждого бизнеса свои этапы: техника — через демо и тендер, химия — через автозаказ'],['Мультисклады','отдельные остатки и инвентаризации, перемещения между бизнесами — документом'],['Мультизадачи','сотрудник может работать в двух бизнесах, задачи помечены цветом бизнеса'],['Мультидашборд','сводный пульт собственника: выручка, маржа, склад, долги — по группе и по каждому']].map(x=>`<div class="kv"><span><b>${x[0]}</b><br><span class="mini">${x[1]}</span></span></div>`).join('')}</div>
 <div class="pan"><h3>Сводно по группе</h3><div class="kv"><span>Выручка ноября</span><b>${tg(tot)}</b></div><div class="kv"><span>Склад, все бизнесы</span><b>${tg(BIZ.reduce((a,b)=>a+b.stock,0))}</b></div><div class="kv"><span>Открытых сделок</span><b>${BIZ.reduce((a,b)=>a+b.deals,0)}</b></div><p class="mini">Команды и воронки у направлений разные, а пульт собственника — один: деньги и задачи всех бизнесов на одном экране.</p></div></div>`};
function setBiz(id){biz=id;const s=document.getElementById('bizsel');if(s)s.value=id;build();toast(`Бизнес: <b>${esc(BIZ.find(b=>b.id===id).n)}</b>. Воронка, склад и задачи переключились.`)}

/* ===== Запуск и стоимость ===== */
SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Система под ваш процесс: CRM, склады, инвентаризация, задачи, WhatsApp и IP-телефония. Без абонплаты за пользователей.</p></div></div>
 <div class="g21"><div class="pan"><h3>Состав</h3><div class="tw"><table class="t"><tbody>${[['CRM: воронка, сделки, клиенты, КП и счета из шаблонов'],['WhatsApp (Green API), Telegram и заявки с нескольких сайтов — в одном окне'],['IP-телефония (Asterisk): звонки из CRM, записи, пропущенные → задачи, лид с нового номера'],['3 филиала: Алматы, Астана, Костанай; РОП и продажники филиала видят своё'],['Склады: 3 склада в филиалах, ячейки, серийные номера, резерв, приход, отгрузки, перемещения'],['Инвентаризация: план, слепой подсчёт с телефона, расхождения, акт, проведение'],['Отчёты в Excel и отчёты по расписанию'],['Задачи: доска, чек-листы, наблюдатели, авто-задачи, лента'],['Сотрудники и роли: добавление, отключение с передачей дел, права'],['Сервис: история каждой машины — продажа, ТО, запчасти, замечания клиента; аренда'],['Перенос клиентов и остатков (до 10 000 позиций) из Bitrix24, Excel и 1С, обучение команды']].map((x,i)=>`<tr><td class="mono" style="width:40px">${String(i+1).padStart(2,'0')}</td><td>${x[0]}</td></tr>`).join('')}</tbody></table></div></div>
 <div><div class="pan price"><h3>Стоимость</h3><div class="kv"><span>Разработка и внедрение</span><b>${tg(2000000)}</b></div><div class="kv opt"><span>Опция «Мультибизнес» +20%: мультиворонки, мультисклады, мультизадачи, мультидашборд</span><b>+ ${tg(400000)}</b></div><div class="kv tot"><span>С мультибизнесом</span><b>${tg(2400000)}</b></div><div class="kv opt"><span>По желанию: постоянный обмен с 1С (вместо разового переноса)</span><b>+ ${tg(800000)}</b></div></div>
 <div class="pan"><h3>Оплата и сроки</h3><div class="kv"><span>Предоплата</span><b>10%</b></div><div class="kv"><span>После демонстрации CRM и склада</span><b>45%</b></div><div class="kv"><span>После запуска</span><b>45%</b></div><div class="kv"><span>Срок</span><b>4–6 недель</b></div><div class="kv"><span>Сервер (Cloudflare)</span><b>5–10 $ в месяц</b></div><div class="kv"><span>Абонплата за пользователей</span><b>нет</b></div></div></div></div>`;

/* ===== Каркас ===== */
const SUBT={dash:'Деньги, склад и задачи на одном экране',funnel:'От лида до пусконаладки',deal:'Товары, резерв, переписка, звонки',clients:'Объекты и техника у клиента',inbox:'Общий номер и АТС',kp:'Из сделки — в WhatsApp',stock:'Склады, ячейки, серийники',product:'Остатки и движение',receive:'Сверка, сканирование, проведение',ship:'Сборка, доставка, резерв',moves:'Между складами',inv:'План → подсчёт → акт',whrep:'Скачивается по кнопке',service:'Моточасы и ТО',tasks:'Доска, список, по людям',task:'Чек-лист и обсуждение',feed:'Всё, что происходит',team:'Добавить и отключить',roles:'Кто что видит',multi:'Несколько бизнесов в одном',launch:'Цена и сроки'};
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();const s=SERIALS.find(x=>x.sn.toLowerCase().includes(q));if(s){openSN(s.sn);return}const p=PRODUCTS.find(x=>(x.n+' '+x.id).toLowerCase().includes(q));if(p&&allowed('product')){openProd(p.id);return}const d=DEALS.find(x=>(x.t+' '+CL(x.cl).n+' '+x.id).toLowerCase().includes(q));if(d&&allowed('deal')){openDeal(d.id);return}toast('Не найдено. Попробуйте: «Mega», «SC-55», «SC55-24».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('');
 const b=document.getElementById('bizsel');if(b){b.innerHTML=BIZ.map(x=>`<option value="${x.id}">${esc(x.n)}</option>`).join('');b.onchange=e=>setBiz(e.target.value)}}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;setMe();if(!allowed(cur))cur=ROLES[role].s[0];build()}
function setMe(){document.getElementById('me').textContent=ROLES[role].av;const n=document.getElementById('mename');if(n)n.innerHTML=`<b>${esc(ROLES[role].n)}</b><small>${esc(role)}</small>`;const b=document.getElementById('bizw');if(b)b.style.display=role==='Собственник'?'':'none'}
function switchRole(k){role=k;setMe();const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){const cnt={inbox:INBOX.reduce((a,m)=>a+(m.un||0),0),tasks:TASKS.filter(t=>t.st==='new').length,stock:PRODUCTS.filter(p=>freeQ(p.id)<p.min).length,ship:SHIPS.filter(s=>s.st==='pick').length,service:SVC.filter(s=>s.st!=='ok').length};
 document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<div class="ng">${s.n}</div>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="ri ${x[0]===cur?'on':''}" onclick="go('${x[0]}')"><code>${x[2]}</code><span>${esc(x[1])}</span>${cnt[x[0]]?`<em>${cnt[x[0]]}</em>`:''}</a>`).join('')).join('');
 const bz=BIZ.find(b=>b.id===biz);const d=document.getElementById('bizdot');if(d)d.style.background=bz.c}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Глянец';const sb=document.getElementById('subt');if(sb)sb.textContent=SUBT[cur]||'';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0;document.body.classList.remove('nav')}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
let theme='light';
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme()}
const TOUR=[
 ['dash','1 · Пульт собственника: деньги в воронке, продажи, склад в тенге, что горит сегодня.'],
 ['funnel','2 · Воронка: от лида до пусконаладки. Перетаскивание, без оплаты не отгрузить.'],
 ['deal','3 · Сделка: товары с живым остатком, резерв машины по серийнику, WhatsApp и звонки.'],
 ['inbox','4 · Общий WhatsApp и IP-телефония: новый номер — лид, пропущенный — задача.'],
 ['stock','5 · Склад: 3 склада в филиалах, ячейки, серийники, свободно/резерв, ниже минимума — к заказу.'],
 ['product','6 · Карточка товара: остатки по складам, серийные номера, движение.'],
 ['receive','7 · Приход: сверка, скан серийников, провести — остатки обновились.'],
 ['inv','8 · Инвентаризация: план → слепой подсчёт с телефона → расхождения → акт → Excel.'],
 ['whrep','9 · Отчёты в Excel одной кнопкой и по расписанию.'],
 ['tasks','10 · Задачи: доска, по людям, авто-задачи из звонков, оплат и ТО.'],
 ['team','11 · Команда: добавить за минуту, удалить — с передачей сделок и задач.'],
 ['multi','12 · Опция «Мультибизнес»: несколько бизнесов, один пульт. +400 000 ₸.'],
 ['service','12б · Сервис: история каждой машины — ТО, запчасти, замечания клиента.'],['launch','13 · Стоимость: 2 000 000 ₸, 4–6 недель, без абонплаты.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■ Стоп';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Собственник');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶ Сценарий'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
