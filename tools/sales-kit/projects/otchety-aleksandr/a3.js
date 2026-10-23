/* Продажи */
SC.sales=()=>`<div class="hd"><div><h2>План-факт по филиалам</h2><p>План и факт по выручке, литрам и марже — по филиалу, менеджеру, группе товаров и каналу (B2B, магазины, Kaspi). Новые клиенты, средний чек, число позиций в заказе.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Филиал</th><th style="text-align:right">План, млн</th><th style="text-align:right">Факт, млн</th><th>Выполнение</th><th style="text-align:right">Маржа</th><th style="text-align:right">Новых клиентов</th><th style="text-align:right">Средний чек</th></tr></thead><tbody>${BR.map(b=>{const pl=Math.round(b[2]/(b[3]>40?0.98:b[3]>34?0.9:0.71));const pc=Math.round(b[2]/pl*100);return `<tr class="${pc<80?'rowwarn':''}"><td><b>${b[0]}</b></td><td class="mono" style="text-align:right">${pl}</td><td class="mono" style="text-align:right">${b[2]}</td><td><div class="bz-occ"><i style="width:${Math.min(100,pc)}%"></i></div><small class="mono">${pc}%</small></td><td class="mono" style="text-align:right">${(15+b[3]/10).toFixed(1).replace('.',',')}%</td><td class="mono" style="text-align:right">${Math.round(b[3]/3)}</td><td class="mono" style="text-align:right">${fmt(380000+b[3]*4000)}</td></tr>`}).join('')}</tbody></table></div></div>
 ${said('Показатели: план-факт, новые клиенты, позиции, средний чек по выручкам — это всё по первичке')}`;

SC.mgr=()=>`<div class="hd"><div><h2>Менеджеры и клиенты</h2><p>Каждый менеджер: сколько точек обошёл, сколько клиентов купили, выручка, литры, средний чек. Клиенты, которые перестали заказывать, — сразу видно.</p></div></div>
 <div class="g2"><div class="pan"><h3>Менеджеры · Астана · октябрь</h3><div class="tw"><table class="t"><thead><tr><th>Менеджер</th><th style="text-align:right">Клиентов</th><th style="text-align:right">Выручка</th><th style="text-align:right">План</th></tr></thead><tbody>${[['Ерлан К.',64,61.2,104],['Дмитрий С.',58,54.8,96],['Айжан Т.',41,38.1,88],['Руслан Б.',37,29.6,74]].map(r=>`<tr><td><b>${r[0]}</b></td><td class="mono" style="text-align:right">${r[1]}</td><td class="mono" style="text-align:right">${r[2].toFixed(1).replace('.',',')} млн</td><td class="mono" style="text-align:right">${r[3]}%</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Перестали заказывать · 45+ дней</h3>${[['СТО «Турбо»','Астана','последний заказ 02.09'],['Магазин «Масла и фильтры»','Караганда','14.08'],['ТОО «КазАгроТех»','Костанай','30.08']].map(r=>`<div class="kv"><span>${r[0]} · ${r[1]}</span><b>${r[2]}</b></div>`).join('')}</div></div>`;

SC.debt=()=>`<div class="hd"><div><h2>Дебиторка</h2><p>Кто должен, сколько и с какой просрочкой — по филиалам и менеджерам. Данные взаиморасчётов из 1С, без ручных сверок.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Филиал</th><th style="text-align:right">Долг</th><th style="text-align:right">Просрочено</th><th>Дней</th></tr></thead><tbody>${[['ТОО «АвтоМир Сервис»','Алматы',12.6,8.4,38],['ИП «Нефтехим Опт»','Шымкент',9.1,0,0],['ТОО «АгроДизель»','Костанай',7.8,3.2,21],['ТОО «Транс Логистик КЗ»','Астана',6.4,0,0],['ИП «Мотор Маркет»','Караганда',3.9,2.1,64]].map(r=>`<tr class="${r[4]>30?'rowbad':r[4]?'rowwarn':''}"><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="mono" style="text-align:right">${r[2].toFixed(1).replace('.',',')} млн</td><td class="mono" style="text-align:right">${r[3]?r[3].toFixed(1).replace('.',',')+' млн':'—'}</td><td class="mono">${r[4]||'—'}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>По сроку просрочки</h3>${bars([['не просрочено',272.2,'272,2 млн'],['1–30 дней',31.6,'31,6 млн'],['31–60 дней',10.9,'10,9 млн'],['60+ дней',3.7,'3,7 млн']])}</div><div class="pan"><h3>Рассылка</h3><div class="kv"><span>Менеджерам — их должники</span><b>каждый день 10:00 · в Битрикс24</b></div><div class="kv"><span>Руководителю — сводка</span><b>понедельник 09:00</b></div></div></div>`;

/* Отчёты */
let RB={g:'по филиалу',m:'выручка',p:'октябрь'};
SC.builder=()=>`<div class="hd"><div><h2>Конструктор отчётов</h2><p>Ваши нестандартные отчёты, которые сейчас собираются вручную из 1С, переносим в портал один раз. Дальше — выбираете группировку, показатель и период, сохраняете как свой отчёт.</p></div></div>
 <div class="g2 g21"><div class="pan"><h3>Новый отчёт</h3>
  <div class="kv"><span>Группировка</span><b><select onchange="RB.g=this.value;render()">${['по филиалу','по менеджеру','по группе товара','по клиенту','по бренду'].map(x=>`<option ${x===RB.g?'selected':''}>${x}</option>`).join('')}</select></b></div>
  <div class="kv"><span>Показатель</span><b><select onchange="RB.m=this.value;render()">${['выручка','литры','маржа','остаток','запас в днях'].map(x=>`<option ${x===RB.m?'selected':''}>${x}</option>`).join('')}</select></b></div>
  <div class="kv"><span>Период</span><b><select onchange="RB.p=this.value;render()">${['сегодня','неделя','октябрь','квартал','год'].map(x=>`<option ${x===RB.p?'selected':''}>${x}</option>`).join('')}</select></b></div>
  <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="act('Отчёт «${RB.m} ${RB.g} · ${RB.p}» сохранён. Назначьте, кто его видит и куда рассылать.')">Сохранить отчёт</button><button class="bt" onclick="act('Выгружено в Excel.')">Excel</button></div></div>
 <div class="pan"><h3>${RB.m[0].toUpperCase()+RB.m.slice(1)} ${RB.g} · ${RB.p}</h3>${bars(BR.slice(0,7).map(b=>[b[0],b[2],String(b[2])]))}</div></div>
 ${said('Некоторые отчёты у нас не шаблонные — вам надо будет смотреть наши отчёты','Пришлите названия отчётов — переносим каждый, согласуем на тестовой базе.')}`;

let RG=[['Пульт руководителя',1,1,0,0],['Остатки по складам',1,1,1,1],['Движение по складам',1,0,1,1],['План-факт по филиалам',1,1,1,0],['Маржа по товарам',1,1,0,0],['Дебиторка по клиентам',1,1,1,0],['Мои продажи (менеджер)',1,0,0,0]];
const RGH=['Руководитель','Ген. директор','Филиал','Логист'];
SC.rights=()=>`<div class="hd"><div><h2>Кто какие отчёты видит</h2><p>Для каждого отчёта — кто его видит. Руководитель филиала видит только свой склад и свои продажи, менеджер — только свои цифры. Маржа и закупочные цены скрыты от тех, кому не положено.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Отчёт</th>${RGH.map(h=>`<th style="text-align:center">${h}</th>`).join('')}</tr></thead><tbody>${RG.map((r,i)=>`<tr><td><b>${r[0]}</b></td>${r.slice(1).map((v,j)=>`<td style="text-align:center"><input type="checkbox" ${v?'checked':''} onchange="RG[${i}][${j+1}]=this.checked?1:0;toast('Права обновлены: ${RGH[j]} — ${r[0]}.')"></td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
 ${said('Главное — разграничение прав: какие-то отчёты могут видеть одни, какие-то — другие')}`;

SC.bitrix=()=>`<div class="hd"><div><h2>Отчёты в задачи Битрикс24</h2><p>Сотрудникам не нужен ещё один вход: по расписанию отчёт формируется и приходит задачей в их Битрикс24 — в Excel или PDF. Битрикс и ваши бизнес-процессы остаются как есть.</p></div></div>
 <div class="g2"><div class="pan"><h3>Расписание рассылок</h3><div class="tw"><table class="t"><thead><tr><th>Отчёт</th><th>Кому</th><th>Когда</th><th>Формат</th></tr></thead><tbody>${[['Мои продажи и план','менеджеры B2B · 46','каждый день 09:00','PDF в задачу'],['Остатки филиала','руководители филиалов · 11','пн и чт 08:30','Excel в задачу'],['Дебиторка с просрочкой','менеджеры по своим клиентам','каждый день 10:00','PDF в задачу'],['Пульт руководителя','генеральный директор','пятница 18:00','PDF + ссылка']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Задача в Битрикс24 · пример</h3><div class="kv"><span>Название</span><b>Отчёт «Мои продажи и план» · 26.10</b></div><div class="kv"><span>Исполнитель</span><b>Ерлан К.</b></div><div class="kv"><span>Вложение</span><b>prodazhi_erlan_26-10.pdf</b></div><div class="kv"><span>Текст</span><b>План 104% · 3 клиента не заказывают 45+ дней</b></div></div></div>
 ${said('Мы не хотим уходить с Битрикса — у нас много бизнес-процессов, которые неплохо работают','Битрикс остаётся. Портал только отчётов; сотрудникам отчёты приходят задачей в Битрикс24.')}`;

/* Внедрение */
SC.onec=()=>`<div class="hd"><div><h2>Подключение к 1С</h2><p>Подключаемся к 1С по стандартному протоколу OData и забираем данные в портал: остатки, движения, продажи, взаиморасчёты. Сначала — на тестовой базе, после согласования отчётов с бухгалтером — на рабочей.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Шаг</th><th>Что делаем</th><th>Срок</th></tr></thead><tbody>${[['1. Тестовая база','вы выдаёте копию 1С, мы подключаемся по OData','день 1–3'],['2. Список отчётов','вы присылаете названия и примеры, мы описываем каждый','день 1–5'],['3. Прогоны','3–5 версий: отчёт приходит в портал и Битрикс24, вы даёте правки','неделя 2–3'],['4. Приёмка бухгалтером','цифры сходятся с 1С','неделя 3'],['5. Рабочая база','переключаем на боевую 1С, включаем рассылки','неделя 3–4']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Скорость','Отчёт не формируется в 1С по 5 минут: данные уже лежат в портале и обновляются автоматически, поэтому любой отчёт открывается сразу.')}`;

SC.launch=()=>`<div class="hd"><div><h2>Стоимость и сроки</h2><p>Пакет отчётности: отдельный портал отчётов поверх 1С, без замены Битрикс24. Подключение к 1С входит.</p></div></div>
 <div class="pk1"><div><small>Пакет отчётности с 1С</small><b>1 000 000 ₸</b><span>портал отчётов + подключение к 1С · один раз</span></div><div><small>Срок</small><b>3–4 недели</b><span>тестовая база → 3–5 версий → рабочая база</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>100 000 ₸</b><span>при подписании</span></div><div><small>Подключение и первые отчёты · 45%</small><b>450 000 ₸</b><span>отчёты на тестовой базе</span></div><div><small>Сдача · 45%</small><b>450 000 ₸</b><span>после приёмки на рабочей базе</span></div></div>
 <div class="g2"><div class="pan"><h3>Входит</h3>${['Пульт руководителя и мобильная версия','Остатки, движение, оборачиваемость, ABC/XYZ','Продажи, менеджеры, дебиторка','Ваши нестандартные отчёты — 15–20 штук','Права на каждый отчёт','Рассылка отчётов задачами в Битрикс24','Выгрузка в Excel'].map(x=>`<div class="kv"><span>${x}</span><b>✓</b></div>`).join('')}</div>
 <div class="pan"><h3>Отдельно и дальше</h3><div class="kv"><span>Сервер</span><b>5–15 $ в месяц</b></div><div class="kv"><span>Сопровождение</span><b>3 месяца бесплатно</b></div><div class="kv"><span>Новые отчёты после сдачи</span><b>по часам</b></div><div class="kv"><span>Если решите заменить Битрикс24</span><b>стандартный пакет — 2 000 000 ₸</b></div></div></div>`;

/* Каркас */
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const p=PR.find(x=>(x[0]+x[1]).toLowerCase().includes(v));if(p&&v){go('stock');return}const b=BR.find(x=>x[0].toLowerCase().includes(v));if(b&&v){go('sales');return}toast('Ищите по товару, коду или филиалу: «5W-40», «М-540», «Астана».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">ПУЛЬС</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='turn'?'<em>'+PR.filter(p=>p[3]/p[4]<10).length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['stock','Склады'],['sales','Продажи'],['builder','Отчёты'],['bitrix','Битрикс24']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'ПУЛЬС';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт руководителя: цифры из 1С без ожидания.'],
 ['stock','2 · Остатки по 11 складам.'],
 ['moves','3 · Движение: приход, перемещения, отгрузки.'],
 ['turn','4 · Запас в днях: что кончается, где заморожены деньги.'],
 ['abc','5 · ABC/XYZ: что держать всегда, что под заказ.'],
 ['sales','6 · План-факт по филиалам.'],
 ['builder','7 · Ваши нестандартные отчёты — в конструкторе.'],
 ['rights','8 · Кто какие отчёты видит.'],
 ['bitrix','9 · Отчёты приходят задачей в Битрикс24.'],
 ['launch','10 · Пакет отчётности с 1С — 1 млн ₸, 3–4 недели.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
