
/* ===== Карточки и формы ===== */
const CARD={};
CARD.cl=id=>{const c=CL(id);const D=DEALS.filter(d=>d.cl===id),P=PROJECTS.filter(p=>p.cl===id);
 return [esc(c.n),`${esc(c.ind)} · ${esc(c.city)} · клиент с ${c.since}`,`<div class="g2"><div class="pan"><h3>Клиент</h3>${[['Контакт',esc(c.contact)],['Откуда пришёл',esc(SRC[c.src]||'—')],['Направления',c.dirs.map(dirTag).join(' ')],['Проектов',c.projects],['LTV',c.ltv?tg(c.ltv):'—'],['Последний проект',c.last==='—'?'—':dl(c.last)]].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
  <div class="pan"><h3>Сделки и проекты</h3>${D.map(d=>`<div class="kv"><span>${dealL(d.id)}</span><b>${stTag(d.st)}</b></div>`).join('')}${P.map(p=>`<div class="kv"><span>${projL(p.id)}</span><b>${pstTag(p.st)}</b></div>`).join('')||(D.length?'':'<p class="mini">Пока нет.</p>')}</div></div>`]};
CARD.newdeal=()=>['Новая сделка','Источник и направление — обязательны: из них строится аналитика',`<div class="form">
  <label>Клиент<select id="nd_c">${CLIENTS.map(c=>`<option value="${c.id}">${esc(c.n)}</option>`).join('')}</select></label>
  <label>Название<input id="nd_t" value="Корпоративный вечер"></label>
  <label>Направление<select id="nd_d">${Object.entries(DIRS).map(([k,v])=>`<option value="${k}">${v.n}</option>`).join('')}</select></label>
  <label>Формат отбора<select id="nd_ten">${Object.entries(TENDER).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>
  <label>Источник<select id="nd_s">${Object.entries(SRC).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>
  <label>Менеджер<select id="nd_m"><option value="AB">Алина</option><option value="TM">Тимур</option><option value="DS">Дана</option></select></label>
  <label>Дата мероприятия<input id="nd_dt" type="date" value="2026-12-12"></label>
  <label>Ориентир бюджета, ₸<input id="nd_sum" value="15000000"></label>
 </div><button class="bt p" onclick="saveDeal()">Создать сделку</button>`];
function saveDeal(){const v=id=>document.getElementById(id).value;const id='D'+(DEALS.length+1);DEALS.unshift({id,cl:v('nd_c'),t:v('nd_t')||'Новая сделка',dir:v('nd_d'),ten:v('nd_ten'),src:v('nd_s'),mgr:v('nd_m'),st:'new',sum:+v('nd_sum')||0,mg:0,date:v('nd_dt'),guests:0,cr:false,days:0,next:'Первый контакт',city:'—'});closeM();curDeal=id;dealTab='over';go('deal');toast('Сделка создана в «Новой заявке» — ответственный получил уведомление.')}
CARD.task=ref=>['Новая задача',`к ${esc(ref)}`,`<div class="form"><label>Задача<input id="nt_t" value="Согласовать с клиентом меню"></label><label>Ответственный<select id="nt_w">${Object.entries(TEAM).map(([k,v])=>`<option value="${k}">${esc(v.f)} · ${esc(v.r)}</option>`).join('')}</select></label><label>Срок<input id="nt_d" type="date" value="${addDays(TODAY,3)}"></label><label>Важность<select id="nt_p"><option value="high">Срочно</option><option value="mid" selected>Обычная</option><option value="low">Низкая</option></select></label></div><button class="bt p" onclick="saveTask('${ref}')">Поставить задачу</button>`];
function saveTask(ref){const v=id=>document.getElementById(id).value;TASKS.push({id:'T'+(TASKS.length+1),ref,t:v('nt_t')||'Задача',who:v('nt_w'),due:v('nt_d'),st:'todo',pr:v('nt_p')});closeM();render();toast(`Задача поставлена: ${who(v('nt_w'))} увидит её в «Моих задачах» и в Telegram.`)}
CARD.lost=id=>['Сделка проиграна','Причина обязательна — из неё строится аналитика потерь',`<div class="form"><label>Причина<select id="lr">${['Цена','Перенос или отмена мероприятия','Выбрали агентство клиента','Не успеваем по срокам','Другое'].map(x=>`<option>${x}</option>`).join('')}</select></label><label>Комментарий<input id="lc" value=""></label></div><button class="bt" onclick="const d=DL('${id}');d.st='lost';d.lost=document.getElementById('lr').value;closeM();go('pipeline');toast('Сделка закрыта как проигранная — причина в аналитике.')">Закрыть сделку</button>`];
CARD.kp=id=>{const d=DL(id),t=estTotal(id),e=EST[id];return ['Коммерческое предложение',`${esc(CL(d.cl).n)} · смета v${e.ver}`,`<div class="doc"><div class="dh"><div class="dlg">КУЛИСА<small>EVENT-АГЕНТСТВО</small></div><div style="text-align:right;font-size:10px">КП № ${id}-v${e.ver}<br>${dl(TODAY)}</div></div>
 <h4>${esc(d.t)}</h4><p style="font-size:11px;color:#6b6560;margin:0 0 10px">${esc(CL(d.cl).n)} · ${d.date?dl(d.date):''} · ${d.guests} гостей</p>
 <div class="drow h"><span>№</span><span>Статья</span><span class="r">Кол-во</span><span class="r">Сумма, ₸</span></div>
 ${e.lines.map((l,i)=>`<div class="drow"><span>${i+1}</span><span>${esc(l.n)}</span><span class="r">${l.q} ${esc(l.u)}</span><span class="r">${fmt(l.q*l.price)}</span></div>`).join('')}
 <div class="drow"><span></span><span>Агентская комиссия ${e.comm}%</span><span></span><span class="r">${fmt(t.comm)}</span></div>
 <div class="dsum"><span>Итого</span><span>${tg(t.client)}</span></div><div class="dfoot"><span>Себестоимость и маржа в КП не попадают — клиент видит только свои цены.</span></div></div>
 <div class="btns" style="margin-top:12px"><button class="bt p" onclick="closeM();toast('КП и презентация отправлены клиенту в WhatsApp и на почту, версия зафиксирована в истории.')">Отправить клиенту</button></div>`]};
CARD.vers=()=>{const e=EST[curEst];return ['Сравнение версий сметы',esc(DL(curEst).t),`<div class="tw"><table class="t"><thead><tr><th>Версия</th><th>Дата</th><th>Что изменили</th><th class="r">Итого клиенту</th></tr></thead><tbody>${e.vers.map(v=>`<tr><td>v${v.v}</td><td>${dd(v.d)}</td><td>${esc(v.note)}</td><td class="r">${tg(v.sum||estTotal(curEst).client)}</td></tr>`).join('')}</tbody></table></div>`]};
CARD.crnew=()=>['Задача креативу','Попадёт в очередь Аскара',`<div class="form"><label>Сделка<select id="cr_d">${DEALS.filter(d=>!['lost','won'].includes(d.st)).map(d=>`<option value="${d.id}">${esc(CL(d.cl).n)} · ${esc(d.t)}</option>`).join('')}</select></label><label>Что нужно<input id="cr_t" value="Концепция и мудборд"></label><label>Срок<input id="cr_due" type="date" value="${addDays(TODAY,4)}"></label></div><button class="bt p" onclick="CREATIVE.push({id:'CR'+(CREATIVE.length+1),deal:document.getElementById('cr_d').value,t:document.getElementById('cr_t').value,who:'AS',st:'queue',due:document.getElementById('cr_due').value,kind:'Концепция',ver:0});closeM();render();toast('Задача в очереди креативной группы.')">Отправить в креатив</button>`];
CARD.book=()=>['Бронь реквизита','Система проверит, хватит ли исправного реквизита на каждый день',`<div class="form"><label>Позиция<select id="bk_p">${PROPS.map(p=>`<option value="${p.id}">${esc(p.n)} · исправно ${p.ok}</option>`).join('')}</select></label><label>Количество<input id="bk_q" value="4"></label><label>С<input id="bk_f" type="date" value="2026-10-17"></label><label>По<input id="bk_t" type="date" value="2026-10-17"></label>
 <label>Под что<select id="bk_r">${[...PROJECTS.filter(p=>p.st!=='done').map(p=>[p.id,'Проект · '+CL(p.cl).n]),...DEALS.filter(d=>!['lost','won'].includes(d.st)).map(d=>[d.id,'Сделка · '+CL(d.cl).n+' (предварительно)'])].map(x=>`<option value="${x[0]}">${esc(x[1])}</option>`).join('')}</select></label></div><div id="bk_res"></div><button class="bt p" onclick="bookProp()">Забронировать</button>`];
CARD.prop=id=>{const p=RP(id);return [esc(p.n),`${esc(p.cat)} · ячейка ${esc(p.cell)} · оценка ${tg(p.val)} за шт`,`<div class="g2"><div class="pan"><h3>Состояние</h3><div class="kv"><span>Всего</span><b>${p.tot}</b></div><div class="kv"><span>Исправно</span><b>${p.ok}</b></div><div class="kv"><span>В ремонте или списано</span><b>${p.broken}</b></div></div>
 <div class="pan"><h3>Брони</h3>${BOOK.filter(b=>b.p===id).map(b=>`<div class="kv"><span>${dd(b.from)}${b.to!==b.from?'–'+dd(b.to):''} · ${who(b.by)} · ${refL(b.ref)}</span><b>${b.q} шт</b></div>`).join('')||'<p class="mini">Нет броней.</p>'}</div></div>
 <div class="pan"><h3>История</h3>${REVLOG.filter(r=>r.p===id).map(r=>`<div class="kv"><span>${dd(r.d)} · ревизия · ${esc(r.why)}</span><b>${r.was} → ${r.now}</b></div>`).join('')}${ISSUES.filter(x=>x.p===id).map(x=>`<div class="kv"><span>${dd(x.d)} · ${esc(x.kind)} · ${refL(x.ref)}</span><b>${x.q} шт</b></div>`).join('')||''}</div>`]};
CARD.newdoc=ref=>['Новый документ','Формируется из реквизитов клиента и сметы',`<div class="form"><label>Тип<select id="dc_k"><option>Договор</option><option>Счёт на аванс</option><option>Акт выполненных работ</option></select></label><label>Как подписываем<select id="dc_m"><option>ЭЦП</option><option>Бумага</option></select></label></div><button class="bt p" onclick="const d=DL('${ref}')||PR('${ref}');DOCS.unshift({id:'DC'+(DOCS.length+1),k:document.getElementById('dc_k').value,ref:'${ref}',no:'EV-2026/0'+(43+DOCS.length),sum:d?d.sum:0,mode:document.getElementById('dc_m').value,st:'draft',d:TODAY});closeM();go('docs');toast('Документ сформирован из шаблона — проверьте и подпишите.')">Сформировать</button>`];
CARD.docv=id=>{const x=DOCS.find(d=>d.id===id);return [esc(x.k+' '+x.no),DOCST[x.st][0],`<div class="doc"><div class="dh"><div class="dlg">КУЛИСА<small>ДОКУМЕНТ</small></div><div style="text-align:right;font-size:10px">${esc(x.no)}<br>${dl(x.d)}</div></div><h4>${esc(x.k)}</h4><p style="font-size:11px">${refL(x.ref)}</p><div class="dsum"><span>Сумма</span><span>${tg(x.sum)}</span></div><div class="dfoot"><span>${x.mode==='ЭЦП'?'Подписи ЭЦП: агентство ✓ · клиент ✓ · QR-код проверки':'Скан бумажного оригинала с подписями и печатями'}</span></div></div>`]};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}

function act(k){const M={
 weekly:'Еженедельный отчёт собран: заявки, конверсия, задел, проекты недели — уходит вам в Telegram по пятницам.',
 distrib:'Распределение заявок: по очереди между Алиной и Тимуром, постоянные клиенты — своему менеджеру, B2G — Дане.',
 spam:'Отмечено «не заявка» — в аналитику источников не попадает.',
 brieflink:'Ссылка на бриф отправлена клиенту: ответы сами попадут в карточку сделки.',
 wa:'Сообщение отправлено с рабочего номера WhatsApp и сохранено в истории сделки.',
 export:'Выгрузка в Excel готова.',
 rosprint:'Тайминг в PDF для подрядчиков — с зонами и ответственными, без внутренних заметок.',
 contr:'Новый подрядчик: категория, город, условия, контакты. Рейтинг появится после первого проекта.',
 contrcard:'Карточка подрядчика: договоры, проекты, оценки проджектов и заметки.',
 kbnew:'Новая статья базы знаний: текст, файлы, видео, кому показывать.',
 kbopen:'Статья открыта. Новичок отмечает «прочитал» — это видно в онбординге.',
 issue:'Выдача проведена: фото состояния, подпись получателя, реквизит числится за проектом до возврата.'
};toast(M[k]||'Готово.')}
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();
 const d=DEALS.find(x=>(x.t+' '+CL(x.cl).n).toLowerCase().includes(q));if(d){openDeal(d.id);toast('Найдена сделка: '+esc(d.t));return}
 const p=PROJECTS.find(x=>(x.t+' '+CL(x.cl).n).toLowerCase().includes(q));if(p){openProj(p.id);toast('Найден проект: '+esc(p.t));return}
 const r=PROPS.find(x=>x.n.toLowerCase().includes(q));if(r){go('props');card('prop',r.id);return}
 const c=CLIENTS.find(x=>x.n.toLowerCase().includes(q));if(c){card('cl',c.id);return}
 toast('Ничего не найдено: попробуйте «Nomad», «указатель», «форум».')}

/* ===== Каркас ===== */
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Операционный директор';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');
 const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}. Показаны разделы этой роли.`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
const CNT={inbox:()=>INBOX.filter(i=>i.st==='new').length,pipeline:()=>DEALS.filter(d=>!['lost','won'].includes(d.st)).length,projects:()=>PROJECTS.filter(p=>p.st!=='done').length,tasks:()=>TASKS.filter(t=>t.st!=='done'&&t.due<=TODAY).length,propcal:()=>{let n=0;PROPS.forEach(p=>{for(let i=0;i<31;i++){if(bookedOn(p.id,addDays('2026-10-05',i))>p.ok){n++;break}}});return n},docs:()=>DOCS.filter(d=>['draft','our'].includes(d.st)).length};
function buildRail(){document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<div class="grp"><h5>${esc(s.n)}</h5>${s.sub.filter(x=>allowed(x[0])).map(x=>{const c=CNT[x[0]]?CNT[x[0]]():0;return `<a class="nv ${x[0]===cur?'on':''} ${['tasks','propcal'].includes(x[0])&&c?'hot':''}" onclick="go('${x[0]}')"><span>${esc(x[1])}</span>${c?`<em>${c}</em>`:''}</a>`}).join('')}</div>`).join('')}
function buildSub(){const me=myKey();const T=TASKS.filter(t=>t.who===me&&t.st!=='done').sort((a,b)=>a.due<b.due?-1:1);const ev=PROJECTS.filter(p=>p.from>=TODAY).sort((a,b)=>a.from<b.from?-1:1).slice(0,3);
 document.getElementById('sub').innerHTML=`<div class="ag"><div class="agh"><small>Сегодня</small><b>${dayOf(TODAY)}, ${dlong(TODAY)}</b><span>${esc(ROLES[role].n)} · ${esc(role)}</span></div>
 <h6>Мои задачи</h6>${T.length?T.slice(0,5).map(t=>`<div class="agt ${t.due<TODAY?'late':''}" onclick="toggleTask('${t.id}')"><i></i><div><b>${esc(t.t)}</b><span>до ${dd(t.due)} · ${t.ref[0]==='P'?esc(CL(PR(t.ref).cl).n):DL(t.ref)?esc(CL(DL(t.ref).cl).n):''}</span></div></div>`).join(''):`<p class="agn">${me==='IN'?'Личных задач нет. Просрочено у команды: '+TASKS.filter(t=>t.st!=='done'&&t.due<TODAY).length:'На сегодня пусто.'}</p>`}
 <h6>Ближайшие мероприятия</h6>${ev.map(p=>`<div class="age" onclick="${allowed('project')?`openProj('${p.id}')`:''}"><b>${p.from.slice(8)}.${p.from.slice(5,7)}</b><div><span>${esc(CL(p.cl).n)}</span><small>${esc(p.t.slice(0,48))}${p.t.length>48?'…':''}</small></div></div>`).join('')}
 <h6>Сегодня в 16:00</h6><div class="agx">Созвон с Nomad Telecom: списки пассажиров чартера и рассадка гала-ужина.</div></div>`}
function build(){buildRail();buildSub();render()}
const WIDE=['pipeline','estimate','propcal','creative','projects'];let agOff=false,agWide=false;
function toggleAg(){if(WIDE.includes(cur))agWide=!agWide;else agOff=!agOff;render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('app').classList.toggle('noag',WIDE.includes(cur)?!agWide:agOff);document.getElementById('ttl').textContent=SUBN[cur]||'Кулиса';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('pipeline')?'':'none';try{history.replaceState(null,'','?s='+cur+(cur==='deal'?'&d='+curDeal:cur==='project'?'&p='+curProj:''))}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}

/* ===== Сценарий показа ===== */
const TOUR=[
 ['dash','1 · Пульт: весь путь агентства — входящие, продажи, задел, реализация, закрытие. Справа — ваш день: задачи и ближайшие мероприятия.'],
 ['inbox','2 · Входящие: WhatsApp, почта, сайт, звонки, Instagram, 2ГИС — в одной ленте. Из сообщения — сделка с источником в один клик.'],
 ['pipeline','3 · Воронка с вашими этапами: бриф, просчёт, креатив, КП, защита, ждём ответ, подтверждён, договор. Фильтр по направлениям: маркетинг, HR, B2G.'],
 ['deal','4 · Карточка сделки: бриф, сметы, креатив, переписка, документы и история — от первого сообщения. Ничего не уходит в личные телефоны.'],
 ['estimate','5 · Смета без прайса: любые статьи от руки, себестоимость и цена клиенту, комиссия и маржа сразу. Каждая версия сохраняется.'],
 ['creative','6 · Креатив отдельным треком: подключается креатор или нет, концепция, презентация, версии до защиты.'],
 ['tenders','7 · Тендер, условный тендер, без тендера — у каждой сделки, с документами и дедлайном.'],
 ['docs','8 · Договор, счёт, акт: электронно с ЭЦП или на бумаге — как попросит клиент.'],
 ['projects','9 · После аванса сделка сама становится проектом. Портфель с календарём агентства вместо Excel.'],
 ['project','10 · Карточка проекта: задачи с ответственными, бюджет план-факт, рабочая и клиентская группы, реквизит.'],
 ['chats','11 · Две группы на проект: внутренняя — только команда, клиентская — WhatsApp-группа рабочего номера.'],
 ['ros','12 · Тайминг дня: поминутно, с зонами и ответственными. Сдвиг на 15 минут — вся команда видит сразу.'],
 ['propcal','13 · Реквизит: брони по датам, конфликт подсвечен — два менеджера больше не возьмут одни указатели.'],
 ['revision','14 · Ревизия: было 10 указателей, стало 7 — и все брони считают от семи.'],
 ['analytics','15 · Конверсия, задел, план-факт, направления и форматы отбора, причины потерь.'],
 ['sources','16 · Путь клиента: Google Ads, Instagram, 2ГИС, рекомендации — до выручки.'],
 ['roles','17 · У каждого руководителя свой контур: продажи не видят задачи реализации.'],
 ['kb','18 · База знаний и онбординг: новичок открывает одну страницу.'],
 ['migrate','19 · Переезд с amoCRM: ядро за две недели, до конца лицензии.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Дальше — сами: всё кликается, роли переключаются справа вверху.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;if(k==='deal'){curDeal='D2';dealTab='over'}if(k==='project')curProj='P1';if(k==='estimate')curEst='D2';build();toast(m);setTimeout(step,ti===0?6500:7400)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='',d='',p='';try{const u=new URLSearchParams(location.search);q=u.get('s')||'';d=u.get('d')||'';p=u.get('p')||''}catch(e){}if(d&&DL(d))curDeal=d;if(p&&PR(p))curProj=p;
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
