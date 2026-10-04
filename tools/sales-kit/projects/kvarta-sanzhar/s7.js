
/* ===== Кабинет клиента ===== */
let portCo='C4';
function portNew(dir){const c=CL(portCo);const id='R-'+(1042+REQS.length-16);REQS.unshift({id,cl:c.id,dir,t:{buh:'Вопрос бухгалтеру',law:'Нужен юрист',tax:'Вопрос по налогам',hr:'Кадровый вопрос'}[dir],from:'Портал',d:TODAY,tm:NOW,sla:TODAY+' 19:00',st:'new',resp:c.resp[dir]||'AS',docs:[],msgs:[['cl',c.boss,'Новая заявка из кабинета',NOW]]});render();toast(`Заявка ${id} создана — ${STAFF[c.resp[dir]||'AS']} получил уведомление. Статус видно здесь и в приложении.`)}
SC.portal=()=>{const c=CL(portCo),grp=CLIENTS.filter(x=>x.group==='Нур'),R=REQS.filter(r=>r.cl===c.id);
 return `<div class="hd"><div><h2>Кабинет клиента</h2><p>Так платформу видит клиент — в браузере и в приложении. Заявка в два нажатия, статус и срок, документы на подпись, счета, чат и звонок своей команде. Владелец нескольких компаний переключается между ними сверху.</p></div></div>
 <div class="bro"><div class="brb"><i></i><i></i><i></i><span>kabinet.kvarta.kz</span></div><div class="brc">
  <div class="pch"><b>КВАРТА</b><div class="cosw">${grp.map(x=>`<button class="${x.id===c.id?'on':''}" onclick="portCo='${x.id}';render()">${esc(x.sh)}</button>`).join('')}</div><span>${esc(c.boss)}</span></div>
  <div class="pcn">Новая заявка</div><div class="pnew">${Object.keys(DIRS).filter(k=>c.dirs.includes(k)).map(k=>`<button style="--c:${DIRS[k].c}" onclick="portNew('${k}')"><b>${DIRS[k].n}</b><span>${{buh:'вопрос, документ, отчёт',law:'договор, претензия',tax:'уведомление, проверка',hr:'приём, отпуск, увольнение'}[k]}</span></button>`).join('')}</div>
  <div class="g2" style="margin:0"><div><div class="pcn">Мои заявки</div>${R.slice(0,4).map(r=>`<div class="kv"><span>${dirm(r.dir)} ${esc(r.t)}</span><b>${rst(r.st)}</b></div>`).join('')||'<p class="mini">Заявок нет.</p>'}<div class="pcn">Нужно от вас</div><div class="kv"><span>Счёт-фактура от субподрядчика</span><b class="warnt">до 03.10</b></div><div class="kv"><span>Подписать приказ об отпуске</span><b class="warnt">ЭЦП</b></div></div>
  <div><div class="pcn">Счета</div><div class="kv"><span>Октябрь · абонентская плата</span><b class="${c.debt?'neg':'pos'}">${tg(c.fee)} · ${c.debt?'не оплачен':'оплачен'}</b></div><div class="pcn">Команда</div>${Object.entries(c.resp).map(([d,p])=>`<div class="kv"><span>${DIRS[d].n}</span><b>${STAFF[p]} · <a class="lk" onclick="callNow('audio','${c.id}')">звонок</a></b></div>`).join('')}</div></div>
 </div></div>
 ${said('«Обратная сторона с клиентом — заявки от наших клиентов, около пятисот.»')}`};

/* ===== Приложение ===== */
SC.app=()=>`<div class="hd"><div><h2>Мобильное приложение · iOS и Android</h2><p>Одно приложение на кросс-платформенном языке — публикуется сразу в App Store и Google Play. Внутри: мессенджер с командой, аудио- и видеозвонки, заявки с фото документа, push-уведомления, подпись. Подключается к порталу — данные одни и те же.</p></div></div>
 <div class="phones">
  <div class="phone"><div class="pht"><b>Чаты</b><small>Нур-Строй Инвест</small></div><div class="pb">${[['Ерлан · бухгалтер','Не хватает счёта-фактуры',1],['Тимур · юрист','Правки по субподряду внёс',0],['Марат · налоги','Авансы КПН до 25.10',0],['Общий чат компании','Счёт за октябрь выставлен',1]].map(x=>`<div class="pi"><span>${esc(x[0])}<small>${esc(x[1])}</small></span><b>${x[2]?'<em class="unr">'+x[2]+'</em>':''}</b></div>`).join('')}<div class="pbtn" onclick="toast('Новая заявка: направление → коротко что нужно → фото документа.')">+ Заявка</div></div></div>
  <div class="phone"><div class="pht"><b>Ерлан · бухгалтер</b><small>в сети · аудио · видео</small></div><div class="pb"><div class="chat sm"><div class="msg in"><b>Ерлан</b>Не хватает счёта-фактуры от субподрядчика<small>12:00</small></div><div class="msg out">Запросил, сфотографирую и пришлю<small>13:40</small></div><div class="msg out">[фото] Акт_выполненных_работ.jpg<small>13:41</small></div></div><div class="pbtn" onclick="callNow('audio','C4')">Позвонить</div></div></div>
  <div class="phone dark"><div class="pb vcall"><div class="cav">ЕР</div><b>Ерлан</b><span>видеозвонок · 02:18</span><div class="cbtn"><i>микрофон</i><i>камера</i><i class="end">завершить</i></div></div></div>
 </div>
 <div class="g3"><div class="note"><b>Срок</b><p>Около 4 недель после портала, плюс проверка Apple и Google — её сроки зависят от них, мы проходим этот процесс за вас.</p></div><div class="note"><b>Регулярно</b><p>Аккаунты разработчика Apple и Google — порядка 300–500 $ в год, как обсуждали на встрече.</p></div><div class="note"><b>Сначала портал</b><p>Приложение подключается к порталу через защищённый шлюз — поэтому сначала портал, потом приложение.</p></div></div>
 ${said('«Нам нужно будет мобильное приложение… там должен быть мессенджер и аудиозвонки.»')}`;

/* ===== Перенос и 1С ===== */
const MIG=[['Компании и реквизиты',512,512],['Контакты клиентов',1340,1340],['Сделки и история',2104,1890],['Задачи сотрудников',3810,2400],['Файлы',18,11],['Пользователи и роли',9,9]];
SC.migrate=()=>`<div class="hd"><div><h2>Перенос из Битрикс24 и 1С</h2><p>Пока вы переходите на новую платформу, данные из Битрикс24 переносятся целиком — клиенты, контакты, история, задачи, файлы. Перенос входит в пакет. Интеграция с 1С:Фреш — отдельно, если окажется нужна.</p></div></div>
 <div class="g2"><div class="pan"><h3>Перенос из Битрикс24 · входит в пакет</h3>${MIG.map(m=>`<div class="fr"><span>${m[0]}</span><span class="pbar w"><i style="width:${pct(m[2],m[1])}%;background:${m[2]>=m[1]?'var(--ok)':'var(--brand)'}"></i></span><b>${fmt(m[2])} / ${fmt(m[1])}${m[0]==='Файлы'?' ГБ':''}</b></div>`).join('')}<p class="mini" style="margin-top:8px">Пока идёт перенос, команда работает в обеих системах; переключение — в один день, без потери истории.</p></div>
 <div class="pan"><h3>1С:Фреш · по желанию · 800 000 ₸</h3>${[['Контрагенты','портал ↔ 1С'],['Счета на оплату и акты','портал → 1С'],['Оплаты','1С → портал'],['Сверки','по запросу']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}<div class="note" style="--tone:var(--warn)"><b>Сначала проверим, нужно ли</b><p>Если вся первичка и счета будут в портале, 1С может не понадобиться — так система стабильнее. Решим после разбора ваших процессов.</p></div></div></div>
 ${said('«Пока что будем переходить на новый портал — на начальном этапе можно будет интеграцию хотя бы сделать?»','Платон: перенос данных входит в пакет; интеграция с 1С — 800 000 ₸ отдельно.')}`;

/* ===== Серверы и данные ===== */
SC.security=()=>`<div class="hd"><div><h2>Серверы и персональные данные</h2><p>Платформа работает на виртуальном сервере в Казахстане — у казахстанского хостинга PS.kz в Алматы. Данные клиентов не выходят за пределы страны, как требует закон о персональных данных.</p></div></div>
 <div class="g2"><div class="pan"><h3>Где и как хранятся данные</h3>${[['Сервер','PS.kz, дата-центр в Алматы'],['Стоимость сервера','10 000–15 000 ₸ в месяц'],['Резервные копии','каждую ночь, хранение 30 дней'],['Доступ','по ролям, вход с кодом из SMS'],['Журнал','кто, когда и что открывал'],['Подпись документов','ЭЦП через NCALayer']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Права на систему</h3>${['Исключительные имущественные права на ПО — ваши, по договору','Исходный код передаём полностью','Разовая оплата разработки — никакой аренды и подписки','Сервер оформлен на вашу компанию'].map(x=>`<div class="li"><i>✓</i><span>${x}</span></div>`).join('')}<div class="note"><b>Astana Hub</b><p>Вы планируете войти в Astana Hub с этим проектом. Мы сами участники — подскажем, как подать заявку и подготовить проект.</p></div></div></div>
 ${said('«Заранее предусмотреть закон о персональных данных клиентов — чтобы сервер соответствовал требованиям.» · «Имущественные права на ПО будут изначально у нас?»')}`;

/* ===== Роли ===== */
SC.roles=()=>{const areas=[['Все клиенты и заявки',['SZ','AS']],['Клиенты своего направления',['SZ','AS','AY','AL','MR','MA']],['Мессенджер и звонки',['SZ','AS','AY','AL','MR','MA','CL']],['ИИ-шаблоны и подпись',['SZ','AY','AL','MR','MA']],['Тарифы и счета',['SZ','AS']],['Аналитика и загрузка команды',['SZ']],['Кабинет клиента',['CL']]];const R=Object.entries(ROLES);
 return `<div class="hd"><div><h2>Роли и права</h2><p>Бухгалтер видит клиентов и заявки своего направления, юрист — своего; менеджер клиентов — всех, но без глубины документов; клиент — только свои компании. Руководитель видит всё.</p></div></div>
 <div class="tw"><table class="t mx"><thead><tr><th>Что можно</th>${R.map(([k,v])=>`<th class="c">${esc(v.av)}<span>${esc(k)}</span></th>`).join('')}</tr></thead><tbody>${areas.map(a=>`<tr><td>${a[0]}</td>${R.map(([k,v])=>`<td class="c">${a[1].includes(v.p)?'<b class="pos">●</b>':'<span class="mini">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`};

/* ===== Запуск и стоимость ===== */
let with1c=false;
SC.launch=()=>{const tot=6000000+(with1c?800000:0);
 return `<div class="hd"><div><h2>Запуск и стоимость</h2><p>Сначала портал — 4–6 недель, затем приложение — около 4 недель плюс проверка Apple и Google. Всё вместе — 2–3 месяца. Оплата: 20% предоплата, 40% при выкатке ядра, 40% при полной передаче проекта.</p></div><div class="btns"><label class="chkl"><input type="checkbox" ${with1c?'checked':''} onchange="with1c=this.checked;render()"> с интеграцией 1С:Фреш</label></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Что</th><th>Срок</th><th class="r">Стоимость</th></tr></thead><tbody><tr><td><b>Портал</b><span class="sub">кабинет сотрудника и клиента, 4 направления, заявки, мессенджер, звонки, ИИ-шаблоны, задачи, счета, аналитика, перенос из Битрикс24</span></td><td>4–6 недель</td><td class="r mono">2 500 000</td></tr><tr><td><b>Мобильное приложение iOS и Android</b><span class="sub">мессенджер, аудио- и видеозвонки, заявки, push, подпись</span></td><td>≈ 4 недели + проверка сторов</td><td class="r mono">3 500 000</td></tr><tr class="${with1c?'':'off'}"><td><b>Интеграция с 1С:Фреш</b><span class="sub">по желанию — сначала проверим, нужна ли</span></td><td>в рамках проекта</td><td class="r mono">${with1c?'800 000':'— (800 000)'}</td></tr><tr class="total"><td>Итого</td><td>2–3 месяца</td><td class="r mono">${fmt(tot)}</td></tr></tbody></table></div>
 <div class="pay3"><div><small>Предоплата · 20%</small><b>${tg(tot*.2)}</b><span>начинаем работу</span></div><div><small>Выкатка ядра · 40%</small><b>${tg(tot*.4)}</b><span>портал на сервере, функционал устаканен</span></div><div><small>Передача проекта · 40%</small><b>${tg(tot*.4)}</b><span>портал и приложение полностью</span></div></div>
 <div class="g2"><div class="pan"><h3>Регулярные расходы</h3>${[['Сервер PS.kz','10–15 тыс. ₸ в месяц'],['Аккаунты Apple и Google','≈ 300–500 $ в год'],['Поддержка и доработки','20 $ в час, по факту'],['Ошибки по нашей вине','исправляем бесплатно']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Команда</h3><p class="mini">Ведущий разработчик Ернар и 6–7 постоянных fullstack-разработчиков — интерфейс, серверная часть, мобильная разработка. В пакете — запас 15–20% на ваши доработки по ходу.</p><div class="note" style="--tone:var(--ok)"><b>Скидка за скорость</b><p>10% на весь проект, если договор заключён в течение 3 дней после согласования с учредителем.</p></div></div></div>
 ${said('«Какие ещё могут быть расходы?» · «Шесть миллионов в общем… от семи, грубо говоря, если с 1С.»','Разработка — 6 000 000 ₸, с 1С — 6 800 000 ₸. Дальше только сервер, аккаунты сторов и доработки по часам.')}`};

/* ===== Карточки ===== */
const CARD={};
CARD.req=id=>{const r=RQ(id),c=CL(r.cl);return [esc(r.t),`${esc(c.n)} · ${RSTOF(r.st).n}`,`<div class="pan"><div class="chat">${r.msgs.map(m=>`<div class="msg ${m[0]==='me'?'out':m[0]==='sys'?'sys':'in'}">${m[1]?'<b>'+esc(m[1])+'</b>':''}${esc(m[2])}<small>${m[3]}</small></div>`).join('')}</div></div>`]};
CARD.newreq=cid=>{const c=CL(cid)||CL(curCl)||CLIENTS[0];return ['Новая заявка','Клиент, направление, суть, срок',`<div class="form"><label>Клиент<select id="nr_c">${CLIENTS.map(x=>`<option value="${x.id}" ${x.id===c.id?'selected':''}>${esc(x.n)}</option>`).join('')}</select></label><label>Направление<select id="nr_d">${Object.keys(DIRS).map(k=>`<option value="${k}">${DIRS[k].n}</option>`).join('')}</select></label><label>Что нужно<input id="nr_t" value="Подготовить доверенность на получение ЭЦП"></label><label>Срок ответа<select id="nr_s"><option value="4">4 часа</option><option value="24">1 день</option><option value="72">3 дня</option></select></label></div><button class="bt p" onclick="newReq()">Создать</button>`]};
function newReq(){const v=i=>document.getElementById(i).value;const c=CL(v('nr_c')),d=v('nr_d');const id='R-'+(1042+REQS.length-16);REQS.unshift({id,cl:c.id,dir:d,t:v('nr_t'),from:'Создана сотрудником',d:TODAY,tm:NOW,sla:(+v('nr_s')>=24?addDays(TODAY,+v('nr_s')/24):TODAY)+' 19:00',st:'new',resp:c.resp[d]||'AS',docs:[],msgs:[]});closeM();curReq=id;curCl=c.id;cur=allowed('req')?'req':'inbox';build();toast(`Заявка ${id} создана, ответственный — ${STAFF[c.resp[d]||'AS']}. Клиент видит её в кабинете.`)}
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(k){toast('Готово.')}
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();const c=CLIENTS.find(x=>(x.n+' '+x.bin+' '+x.boss).toLowerCase().includes(q));if(c){pickCl(c.id);return}const r=REQS.find(x=>(x.id+' '+x.t).toLowerCase().includes(q));if(r){openReq(r.id);return}toast('Не нашлось. Ищите по названию, БИН, руководителю или номеру заявки.')}

/* ===== Каркас: тёмная рейка, список клиентов как в мессенджере, вкладки экранов ===== */
const ICON={in:'<path d="M4 13l2.5-7h11L20 13v5H4z"/><path d="M4 13h4.5l1.2 2h4.6l1.2-2H20"/>',cl:'<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3.3 2.7-5 5.5-5s4.9 1.7 5.5 5M15.5 5.5a3 3 0 0 1 0 6M17.5 14.3c1.7.6 2.7 2.1 3 4.7"/>',dir:'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',doc:'<path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5V8h4M9.5 12.5h6M9.5 16h4"/>',co:'<path d="M4 20V8l8-4 8 4v12"/><path d="M9 20v-6h6v6"/>',side:'<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',sys:'<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>'};
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}.`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
function buildRail(){const on=SECOF[cur];const cnt={in:REQS.filter(r=>r.st==='new'&&vis(r)).length};document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="ri ${s.k===on?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')" title="${s.n}"><svg viewBox="0 0 24 24">${ICON[s.k]}</svg><span>${s.n}</span>${cnt[s.k]?`<em>${cnt[s.k]}</em>`:''}</a>`).join('')}
function buildList(){const el=document.getElementById('clist');const show=SECK[SECOF[cur]].list&&role!=='Клиент';document.getElementById('app').classList.toggle('nolist',!show);if(!show){el.innerHTML='';return}
 let L=CLIENTS.filter(c=>(!clQ||(c.n+' '+c.bin+' '+c.boss).toLowerCase().includes(clQ.toLowerCase()))&&(clF==='all'||c.dirs.includes(clF)));if(myDir())L=L.filter(c=>c.dirs.includes(myDir()));
 el.innerHTML=`<div class="clh"><b>Клиенты</b><span>${TOTAL_CLIENTS}</span></div><div class="cls"><input id="clq" placeholder="Поиск · Ctrl+K" value="${esc(clQ)}" oninput="clQ=this.value;buildList();const i=document.getElementById('clq');i.focus();i.setSelectionRange(i.value.length,i.value.length)"></div><div class="clf">${[['all','Все']].concat(Object.keys(DIRS).map(k=>[k,DIRS[k].s])).map(f=>`<button class="${clF===f[0]?'on':''}" onclick="clF='${f[0]}';buildList()">${f[1]}</button>`).join('')}</div>
 <div class="cll">${L.map(c=>`<div class="cli ${c.id===curCl?'on':''}" onclick="pickCl('${c.id}')"><span class="ava" style="--c:${DIRS[c.dirs[0]].c}">${esc(ini(c.sh))}</span><div class="clb"><div class="clt"><b>${esc(c.sh)}</b><small>${esc(c.lt)}</small></div><div class="clm"><span>${esc(c.last)}</span>${c.un?`<em>${c.un}</em>`:''}</div><div class="cld">${c.dirs.map(d=>`<i style="background:${DIRS[d].c}" title="${DIRS[d].n}"></i>`).join('')}</div></div></div>`).join('')}<div class="clmore">ещё ${TOTAL_CLIENTS-L.length} клиентов · прокрутка</div></div>`}
function buildSub(){const s=SECK[SECOF[cur]];document.getElementById('sub').innerHTML=s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('');const c=CL(curCl),ctx=document.getElementById('ctx');if(ctx)ctx.innerHTML=s.list&&role!=='Клиент'&&c?`<span class="ava" style="--c:${DIRS[c.dirs[0]].c}">${esc(ini(c.sh))}</span><div><b>${esc(c.n)}</b><small>${c.dirs.map(d=>DIRS[d].s).join(' · ')} · ${esc(c.tariff)}</small></div>`:`<div><b>${esc(s.n)}</b><small>${role==='Клиент'?'группа «Нур» · 3 компании':'вся компания · '+TOTAL_CLIENTS+' клиентов'}</small></div>`}
function build(){buildRail();buildList();buildSub();render()}
function render(){const f=SC[cur]||SC.inbox;document.getElementById('ttl').textContent=SUBN[cur]||'Кварта';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();buildRail();
 const a=document.getElementById('addBtn');if(a)a.style.display=role==='Клиент'?'none':'';try{history.replaceState(null,'','?s='+cur+(cur==='req'?'&r='+curReq:''))}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}

const TOUR=[
 ['inbox','1 · Входящие: каждый запрос клиента — заявка с направлением, ответственным и сроком ответа. Вместо WhatsApp и Telegram.'],
 ['req','2 · Заявка: переписка, документы, звонок, статус. Клиент видит всё у себя.'],
 ['board','3 · Доска по статусам — цвет полоски показывает направление.'],
 ['ws','4 · Рабочее место клиента. Слева — список клиентов как в мессенджере: выбрали — всё переключилось.'],
 ['chat','5 · Мессенджер с клиентом: внутренние заметки, файлы, аудио- и видеозвонки.'],
 ['calls','6 · Звонки внутри платформы с записью — без личных номеров.'],
 ['buh','7 · Бухгалтерия: сроки отчётности по всем клиентам и первичка — запрос недостающего одной кнопкой.'],
 ['law','8 · Юридическое: договоры, претензии, регистрация.'],
 ['hr','9 · HR: приёмы, отпуска, увольнения, табели клиентов.'],
 ['ai','10 · ИИ-шаблоны: реквизиты из карточки, условия от ИИ, отправка только после проверки специалистом.'],
 ['docs','11 · Архив и подпись ЭЦП.'],
 ['tasks','12 · Внутренние задачи — Битрикс24 больше не нужен.'],
 ['billing','13 · Счета всем клиентам — автоматически 1-го числа.'],
 ['analytics','14 · Аналитика: заявки, сроки, загрузка, отток.'],
 ['portal','15 · Кабинет клиента: заявка в два нажатия, документы, счета, команда; переключение между своими компаниями.'],
 ['app','16 · Приложение iOS и Android: мессенджер, аудио- и видеозвонки.'],
 ['migrate','17 · Перенос из Битрикс24 входит в пакет; 1С:Фреш — по желанию.'],
 ['security','18 · Серверы в Казахстане, права на ПО — ваши.'],
 ['launch','19 · Портал 2,5 млн + приложение 3,5 млн; 20 / 40 / 40.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается: заявки, клиенты, чат, шаблоны, счета.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;if(k==='req')curReq='R-1041';if(k==='ws'||k==='chat')curCl='C3';if(k==='ai'){aiTpl='T1';curCl='C7';aiGen=true}build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){const i=document.getElementById('clq');if(i){e.preventDefault();i.focus()}}});
 let q='',o='';try{const u=new URLSearchParams(location.search);q=u.get('s')||'';o=u.get('r')||''}catch(e){}if(o&&RQ(o)){curReq=o;curCl=RQ(o).cl}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
