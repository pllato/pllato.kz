/* Абонементы */
SC.subs=()=>{const A=PAT.filter(p=>p.phase!=='first');
 return `<div class="hd"><div><h2>Абонементы</h2><p>Абонемент на 12 занятий. Каждый визит уменьшает остаток сам. Когда остаётся одно занятие — пациенту уходит напоминание, а администратор видит его в списке на продление. Курс из нескольких абонементов виден целиком.</p></div><div class="btns"><button class="bt" onclick="act('Виды абонементов: 12 занятий взрослый, 12 занятий детский, 8 занятий поддерживающий, разовое занятие — цены задаёте вы.')">Виды и цены</button></div></div>
 <div class="wid"><div><small>Активных абонементов</small><b>219</b><span>взрослых 176 · детских 43</span></div><div><small>Осталось 0–1 занятие</small><b class="w">${A.filter(p=>left(p)<=1).length+4}</b><span>продлить на этой неделе</span></div><div><small>Продлили в октябре</small><b class="g">38</b><span>из 46, у кого закончился</span></div><div><small>Взрослый / детский</small><b>${fmt(PRICE.sub)} / ${fmt(PRICE.kid)} ₸</b><span>12 занятий · для примера</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Пациент</th><th>Абонемент</th><th>Занятия</th><th>Осталось</th><th>Курс</th><th></th></tr></thead><tbody>${A.slice().sort((a,b)=>left(a)-left(b)).map(p=>`<tr class="${left(p)<=1?'rowwarn':''}"><td><a class="clk" onclick="openPat('${p.id}')"><b>${esc(p.n)}</b></a> <small class="mono">${p.id}</small></td><td>${p.subs}-й · ${p.kid?'детский':'взрослый'}</td><td style="min-width:160px">${subBar(p)}</td><td class="mono ${left(p)<=1?'neg':''}">${left(p)}</td><td>${phTag(p.phase)}</td><td>${left(p)<=1?`<button class="bt sm" onclick="subRenew('${p.id}')">Продлить</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Абонемент на двенадцать занятий')}`};
function subRenew(id){const p=PT(id);p.subs++;p.used=0;p.debt=0;render();toast(`${esc(p.n)}: абонемент № ${p.subs} оформлен, ${tg(p.kid?PRICE.kid:PRICE.sub)}. Бонус за продление — инструктору ${p.ins}.`)}

/* Оплаты */
SC.pay=()=>`<div class="hd"><div><h2>Оплаты и долги</h2><p>Каждая оплата привязана к пациенту и абонементу: Kaspi QR, перевод, наличные, карта. Касса дня сходится сама. Если пациент оплатил не всё — долг виден на ресепшене при отметке визита.</p></div><div class="btns"><button class="bt p" onclick="act('Оплата: пациент, за что (абонемент, первичный приём), сумма, способ. Чек — в WhatsApp.')">+ Оплата</button></div></div>
 <div class="wid"><div><small>Касса сегодня</small><b>${tg(338000)}</b><span>Kaspi 256 000 · наличные 82 000</span></div><div><small>За октябрь</small><b>${tg(4218000)}</b><span>абонементов 52 · первичных 36</span></div><div><small>Долги пациентов</small><b class="a">${tg(108000)}</b><span>3 пациента</span></div></div>
 <div class="g2 g21"><div class="pan"><h3>Оплаты сегодня</h3><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Пациент</th><th>За что</th><th>Способ</th><th style="text-align:right">Сумма</th></tr></thead><tbody>${[['11:08','Сагинтаева Гульжан','Абонемент № 4 · частично','Kaspi QR',36000],['10:40','Абдрахманова Лаура','Абонемент № 1','Kaspi QR',72000],['10:12','Ким Ольга','Абонемент № 15','наличные',72000],['09:30','Касымова Дина','Абонемент № 1 · детский','Kaspi перевод',60000],['09:05','Тлеуов Арман','Первичный приём','Kaspi QR',8000],['08:20','Нургалиев Бауыржан','Абонемент № 11','Kaspi QR',72000],['08:05','Ахмед Е.','Первичный приём','Kaspi QR',8000],['08:01','Иса Р.','Разовое занятие','наличные',10000]].map(r=>`<tr><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td><td>${r[3]}</td><td class="mono" style="text-align:right">${fmt(r[4])}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Должны</h3>${[['0121','Сагинтаева Гульжан',36000,'остаток за абонемент № 4'],['0137','Оспанова Жанар',36000,'пауза с 26.09'],['0140','Петрова Марина',36000,'рассрочка, 2-я часть до 20.10']].map(r=>`<div class="fc r clk" onclick="openPat('${r[0]}')"><b>${r[1]}</b><span>${tg(r[2])}</span><em>${r[3]}</em></div>`).join('')}<p class="hint">Финансы без лишнего: сколько пришло, от кого и кто должен.</p></div></div>`;

/* Бонусы инструкторов */
let BR={first:5000,renew:2000};
const BON=[['Ерлан',[['Тлеуов Арман','первичный 17.10','ждём покупку абонемента',0],['Сериков Аскар','продлил абонемент № 2','продление',2000],['Петрова Марина','первичный → абонемент','новый пациент',5000],['Абдрахманова Лаура','первичный → абонемент','новый пациент',5000]]],['Дана',[['Мухамбетова Динара','первичный → абонемент','новый пациент',5000],['Ким Ольга','вернулась, абонемент № 15','продление',2000]]],['Руслан',[['Ахметов Даулет','продлил абонемент № 4','продление',2000],['Бекова Алия','продлил абонемент № 2','продление',2000],['Касымова Дина','первичный → абонемент','новый пациент',5000]]],['Айдар',[['Нургалиев Бауыржан','продлил абонемент № 11','продление',2000],['Жумабаев Нурлан','первичный → абонемент','новый пациент',5000]]]];
SC.bonus=()=>{const mine=role==='Инструктор';const B=BON.filter(b=>!mine||b[0]==='Ерлан');
 return `<div class="hd"><div><h2>Бонусы инструкторов · октябрь</h2><p>Система помнит, какой инструктор провёл первичный приём пациента. Если пациент после приёма купил абонемент — инструктору начисляется бонус. Продлил абонемент — ещё бонус. Считать вручную не нужно.${mine?' Инструктор видит только свои бонусы.':''}</p></div></div>
 ${mine?'':`<div class="pan"><h3>Правила</h3><div class="form" style="grid-template-columns:1fr 1fr 1fr"><label>За нового пациента (первичный → абонемент)<input value="${fmt(BR.first)} ₸"></label><label>За продление абонемента<input value="${fmt(BR.renew)} ₸"></label><label>Или процент от абонемента<select><option>фиксированная сумма</option><option>5% от абонемента</option></select></label></div></div>`}
 <div class="g2">${B.map(b=>{const t=b[1].reduce((a,r)=>a+r[3],0);return `<div class="pan"><h3>${insTag(b[0])} · ${tg(t)}</h3>${b[1].map(r=>`<div class="kv"><span><b>${r[0]}</b> · ${r[1]}</span><b class="${r[3]?'':'neg'}">${r[3]?'+'+fmt(r[3])+' ₸':r[2]}</b></div>`).join('')}</div>`}).join('')}</div>
 ${said('Кто из инструкторов этот приём на себя взял, и если пациент вернулся с абонементом — бонус начисляется инструктору от этого пациента')}`};

/* Нагрузка и удержание */
SC.team=()=>`<div class="hd"><div><h2>Нагрузка и удержание</h2><p>Сколько занятий провёл каждый инструктор, сколько у него пациентов и сколько из них продолжают курс. Удержание — главный показатель для центра: пациент, который бросил на середине, не получил результат.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Инструктор</th><th>Занятий за неделю</th><th>Пациентов</th><th>Первичных в октябре</th><th>Купили абонемент</th><th>Продлили</th><th>Пропали</th></tr></thead><tbody>${[['Ерлан',64,58,9,8,'86%',1],['Дана',52,47,7,6,'81%',2],['Руслан',48,51,6,6,'91%',0],['Айдар',44,39,5,4,'78%',1]].map(r=>`<tr><td>${insTag(r[0])}</td><td class="mono">${r[1]}</td><td class="mono">${r[2]}</td><td class="mono">${r[3]}</td><td class="mono">${r[4]}</td><td class="mono">${r[5]}</td><td class="mono ${r[6]>1?'neg':''}">${r[6]}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Занятий по дням недели</h3>${bars([['Понедельник',58],['Вторник',51],['Среда',61],['Четверг',49],['Пятница',57],['Суббота',38]])}</div><div class="pan"><h3>Задачи команды</h3>${[['Айгерим','Обзвонить 5 пропавших до 18:00','сегодня'],['Гульмира','Контрольный осмотр: Сериков, Ахметов','19.10'],['Ерлан','Отзыв: Петрова — спросить причину паузы','сегодня'],['Тимур','Пациент недоволен — перезвонить','сегодня']].map(r=>`<div class="kv"><span><b>${r[0]}</b> · ${r[1]}</span><b>${r[2]}</b></div>`).join('')}</div></div>`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Стандартный пакет разработки для центра в Уральске: пациенты и карты, отметка визита, запись и напоминания в WhatsApp, курс и абонементы, пропавшие пациенты, воронка, план лечения и цена от врача, оплаты, бонусы инструкторов. Каждый экран утверждаем вместе с вами.</p></div></div>
 <div class="pk1"><div><small>Стандартный пакет</small><b>2 000 000 ₸</b><span>один раз · без абонплаты · система ваша</span></div><div><small>Срок</small><b>4–6 недель</b><span>ядро → полировка</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>200 000 ₸</b><span>при подписании</span></div><div><small>Ядро · 45%</small><b>900 000 ₸</b><span>после утверждения основного</span></div><div><small>Сдача · 45%</small><b>900 000 ₸</b><span>после полировки и передачи</span></div></div>
 <div class="g2"><div class="pan"><h3>Как идём</h3><div class="kv"><span><b>1.</b> Согласуем состав — по этому демо</span><b>сейчас</b></div><div class="kv"><span><b>2.</b> Ядро: пациенты, визиты, запись, абонементы</span><b>2–3 недели</b></div><div class="kv"><span><b>3.</b> Полировка: кнопки, сообщения WhatsApp, отчёты — по вашим замечаниям</span><b>2–3 недели</b></div><div class="kv"><span><b>4.</b> Перенос пациентов из вашей таблицы, обучение</span><b>входит</b></div></div>
 <div class="pan"><h3>В месяц</h3><div class="kv"><span>Система</span><b>0 ₸ — абонплаты нет</b></div><div class="kv"><span>Сервер</span><b>бесплатно или 5–10 $</b></div><div class="kv"><span>WhatsApp-напоминания</span><b>≈ 5 000 ₸ за номер</b></div><div class="kv"><span>Сотрудников</span><b>сколько угодно</b></div><p class="hint">Делаем для центра в Уральске. Если позже понадобится для других филиалов сети — система уже готова к этому.</p></div></div>
 ${said('Только на Уральск надо делать')}`;
/* Каркас */
const CARD={};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const d=v.replace(/\D/g,'');const p=PAT.find(x=>(d.length>=2&&(x.id===d.padStart(4,'0')||x.ph.replace(/\D/g,'').endsWith(d)))||(v.length>1&&x.n.toLowerCase().includes(v)));if(p){openPat(p.id);return}toast('Ищите по номеру карты (0147), телефону или фамилии.')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">ЦЕНТР БУБНОВСКОГО</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='lost'?'<em>'+lost().length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['checkin','Визит'],['sched','Запись'],['patients','Пациенты'],['lost','Пропали']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Центр Бубновского';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: сколько записано и пришло, у кого заканчивается абонемент, кто пропал, касса.'],
 ['checkin','2 · Отметка визита: набрали номер карты — видно, сколько прошёл и сколько осталось.'],
 ['sched','3 · Расписание и запись по часам и инструкторам.'],
 ['remind','4 · Напоминания в WhatsApp за день и за 3 часа — с подтверждением.'],
 ['patient','5 · Карточка пациента: диагноз, курс, абонемент, история.'],
 ['lost','6 · Не был 10 дней — подсвечивается, администратор звонит.'],
 ['plan','7 · План лечения и цена курса — их называет врач.'],
 ['funnel','8 · Воронка: от звонка до абонемента.'],
 ['bonus','9 · Бонусы инструкторам считаются сами.'],
 ['launch','10 · Стоимость: 2 млн один раз, 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
