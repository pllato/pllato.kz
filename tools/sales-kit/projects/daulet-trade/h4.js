
/* ===== Система ===== */
SC.roles=()=>{const A=[['Пульт, контроль, отчёты',['DK','OW']],['Сделки, счёт и КП',['DK','OW','AS','GA']],['Товары и остатки',['DK','OW','AS','ER','SA','GA']],['Закупочные цены',['DK','OW','ER','SA','GA']],['Приход',['DK','ER','SA']],['Реализация и вагоны',['DK','GA']],['Заявки на закупку',['DK','ER','SA']],['Касса',['DK','OW','KS']],['Авансы — согласование',['DK']]];const R=Object.entries(ROLES);
 return `<div class="hd"><div><h2>Роли и права</h2><p>Каждый входит под своим логином и видит только своё. Менеджер не видит закупочные цены, кассир — только кассу. Собственник смотрит то же, что удобно директору.</p></div></div>
 <div class="tw"><table class="t mx"><thead><tr><th>Раздел</th>${R.map(([k,v])=>`<th class="c">${v.av}<span>${esc(k)}</span></th>`).join('')}</tr></thead><tbody>${A.map(a=>`<tr><td>${a[0]}</td>${R.map(([k,v])=>`<td class="c">${a[1].includes(v.p)?'<b class="pos">●</b>':'<span class="mini">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
 ${said('«Собственник тоже будет принимать участие — он будет смотреть то, что мне будет комфортно смотреть».')}`};
SC.onec=()=>`<div class="hd"><div><h2>Уход с 1С</h2><p>Сейчас счета и накладные делаются в рабочей базе 1С. Переносим номенклатуру, остатки, контрагентов и открытые документы, какое-то время работаете параллельно — потом рабочую базу 1С отключаете. Налоговую базу можно оставить у бухгалтера, пока она нужна.</p></div></div>
 <div class="mvs">${[['1','Выгрузка из 1С','номенклатура, цены, остатки, контрагенты','ok'],['2','Склад и цены','группы, единицы, места хранения','ok'],['3','Открытые документы','неоплаченные счета, долги, заказы поставщикам','on'],['4','Параллельная работа','2 недели: документы в системе, отчётность в 1С',''],['5','Отключение рабочей базы','всё в одной системе','']].map(s=>`<div class="mv ${s[3]}"><i>${s[3]==='ok'?'✓':s[0]}</i><b>${s[1]}</b><span>${s[2]}</span></div>`).join('')}</div>
 <div class="g2"><div class="note"><b>Почему так</b><p>«Очень костлявое — даже отчёт получить проблема; если кто-то неправильно что-то сделает, уже тяжело». Здесь отчёт — экран, а исправление — одна правка с историей, кто и когда.</p></div><div class="note"><b>Битрикс не нужен</b><p>Канбан, звонки, переписка, задачи — уже здесь. Подписки нет.</p></div></div>
 ${said('«Хочу убрать этот 1С… не сразу, конечно, но планирую его полностью убрать, чтобы все работали через CRM».')}`;
SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Стандартный пакет разработки — 1 500 000 ₸ один раз, без абонентской платы. 4–6 недель с несколькими итерациями согласования. Сервер передаём вам: до 10 ГБ — бесплатно, дальше — несколько долларов в месяц.</p></div></div>
 <div class="pay3"><div><small>Старт · 10 %</small><b>150 000 ₸</b><span>выгрузка из 1С, товары, роли</span></div><div><small>Ядро · 45 %</small><b>675 000 ₸</b><span>после того, как вы приняли ядро</span></div><div><small>Сдача · 45 %</small><b>675 000 ₸</b><span>после шлифовки и передачи сервера</span></div></div>
 <div class="g2"><div class="pan"><h3>Ядро</h3>${['Товары и остатки, перенос из 1С','Сделки в канбане, счёт на оплату и КП','Приход и реализация для двух бухгалтеров','Заявки на закупку с согласованием','Касса — простой экран'].map(x=>`<div class="li"><i>✓</i><span>${x}</span></div>`).join('')}</div>
 <div class="pan"><h3>Шлифовка</h3>${['Телефония с записями, мессенджер в карточке','Отгрузка вагонами','Авансы и командировочные','Пульт директора и отчёты','Ваши доработки по ходу — около 20 % времени заложено'].map(x=>`<div class="li n"><i>→</i><span>${x}</span></div>`).join('')}</div></div>
 ${said('«Первоначально такое небольшое ТЗ, потому что нужно с чего-то начинать, а потом будем дорабатывать».','Платон: стандартный пакет точно поместимся, 4–6 недель, 1,5 млн, предоплата 10 %.')}`;

/* ===== Карточки ===== */
const CARD={};
CARD.newdeal=()=>['Новая сделка','Товары из каталога, счёт — из сделки',`<div class="form"><label>Клиент<input id="nd_c" value="ТОО «Жана Курылыс»"></label><label>Источник<select id="nd_s"><option>Instagram</option><option>Звонок</option><option>Повторный</option></select></label><label>Товар<select id="nd_g">${GOODS.map(g=>`<option value="${g.id}">${esc(g.n)}</option>`).join('')}</select></label><label>Количество<input id="nd_q" value="100"></label></div><button class="bt p" onclick="newDeal()">Создать</button>`];
function newDeal(){const v=i=>document.getElementById(i).value;const id='С-'+(1191+DEALS.length-8);DEALS.unshift({id,cl:v('nd_c'),ct:'—',m:role==='Менеджер'?'AS':'AI',st:'new',src:v('nd_s'),lines:[[v('nd_g'),+v('nd_q')||1]],paid:0,note:''});closeM();curDeal=id;go('deal');toast(`${id} создана.`)}
CARD.income=()=>['Новый приход','Накладная поставщика — остатки обновятся',`<div class="form"><label>Поставщик<input id="ic_s" value="ТОО «КарМет Трейд»"></label><label>Товар<select id="ic_g">${GOODS.map(g=>`<option value="${g.id}">${esc(g.n)}</option>`).join('')}</select></label><label>Количество<input id="ic_q" value="20"></label><label>Сумма, ₸<input id="ic_p" value="6180000"></label></div><button class="bt p" onclick="const v=i=>document.getElementById(i).value;INC.unshift({n:String(415+INC.length-3),sup:v('ic_s'),d:'ожидается',lines:[[v('ic_g'),+v('ic_q')||0]],sum:+v('ic_p')||0,st:'way'});closeM();render();toast('Приход создан — «Принять на склад», когда товар придёт.')">Создать</button>`];
CARD.wagon=()=>['Новый вагон','Привязан к сделке',`<div class="form"><label>Сделка<select id="wg_d">${DEALS.map(d=>`<option>${d.id}</option>`).join('')}</select></label><label>Станция<input id="wg_t" value="Шымкент"></label><label>Груз<input id="wg_c" value="Арматура Ø12"></label><label>Тонн<input id="wg_q" value="60"></label></div><button class="bt p" onclick="const v=i=>document.getElementById(i).value;WAG.unshift({n:'№ 5'+Math.floor(1e7+Math.random()*9e7),deal:v('wg_d'),to:v('wg_t'),cargo:v('wg_c'),t:+v('wg_q')||0,st:'apply',d:'заявка подана '+TODAY});closeM();render();toast('Вагон добавлен.')">Добавить</button>`];
CARD.preq=()=>['Заявка на закупку','Снабженцу и на согласование директору',`<div class="form"><label>Товар<select id="pq_g">${GOODS.map(g=>`<option value="${g.id}">${esc(g.n)}</option>`).join('')}</select></label><label>Количество<input id="pq_q" value="10"></label><label>Для чего<input id="pq_w" value="Ниже минимума"></label></div><button class="bt p" onclick="const v=i=>document.getElementById(i).value;const g=v('pq_g');PREQ.unshift({id:'З-'+(312+PREQ.length-5),who:ROLES[role].n,why:v('pq_w'),g,q:+v('pq_q')||1,sup:'подбирает снабженец',pr:GD(g).buy,st:'new',d:'05.10'});closeM();render();toast('Заявка создана — снабженцу пришло уведомление.')">Создать</button>`];
CARD.adv=()=>['Заявка на аванс','Директор согласует, кассир выдаст',`<div class="form"><label>На что<input id="av_w" value="Командировка Алматы, 2 дня"></label><label>Сумма, ₸<input id="av_s" value="70000"></label></div><button class="bt p" onclick="const v=i=>document.getElementById(i).value;ADV.unshift({id:'А-'+(28+ADV.length-3),who:ROLES[role].n,why:v('av_w'),s:+v('av_s')||0,st:'agree'});closeM();render();toast('Заявка отправлена директору.')">Отправить</button>`];
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(k){toast('Готово.')}
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();const d=DEALS.find(x=>(x.id+x.cl).toLowerCase().includes(q));if(d&&allowed('deal')){openDeal(d.id);return}const g=GOODS.find(x=>x.n.toLowerCase().includes(q));if(g&&allowed('catalog')){go('catalog');toast(`${g.n}: ${String(g.q).replace('.',',')} ${g.u}, ${g.cell}.`);return}toast('Не найдено: попробуйте «С-1184», «цемент», «арматура».')}

/* ===== Каркас ===== */
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Исполнительный директор';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}.`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
function buildRail(){const on=SECOF[cur];document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="ri ${s.k===on?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><i><svg viewBox="0 0 24 24">${s.ic}</svg></i><span>${s.n}</span></a>`).join('')}
function buildSub(){const s=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.today;document.body.dataset.role=role==='Кассир'?'cash':'';document.getElementById('ttl').textContent=SUBN[cur]||'Опора';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();buildRail();
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('funnel')?'':'none';try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['today','1 · Пульт директора: продажи, склад, закупки, деньги и три зоны контроля — в одном месте.'],
 ['control','2 · Контроль: звонки и переписка менеджеров, приход и реализация, переговоры снабженцев.'],
 ['funnel','3 · Сделки в канбане. Не хватает товара — карточка подсвечена.'],
 ['deal','4 · Карточка сделки: товары с остатками, маржа, переписка, записи звонков.'],
 ['invoice','5 · Счёт и КП собираются из товаров сделки — без 1С.'],
 ['catalog','6 · Товары и остатки, как в «Моём складе».'],
 ['income','7 · Приход — бухгалтер по приходу.'],
 ['realize','8 · Реализация — бухгалтер по реализации.'],
 ['wagons','9 · Отгрузка вагонами.'],
 ['preq','10 · Заявки на закупку с согласованием директора.'],
 ['cash','11 · Касса — три большие кнопки.'],
 ['advances','12 · Авансы и командировочные.'],
 ['reports','13 · Отчёты в одной таблице.'],
 ['launch','14 · Стоимость: 1,5 млн, 4–6 недель, 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
