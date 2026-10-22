/* Кабинет тренера */
let TC=0;
const TCL=[['Ержан Сатыбалдиев','Похудение · 3 тренировки в неделю',[96.4,94.1,92.8,91.5,90.2],'1 900 ккал · белок 140 г'],['Данияр Касымов','Набор массы · 4 тренировки',[71.2,72.0,72.9,73.4,74.1],'3 100 ккал · белок 160 г'],['Алия Нурланова','Тонус · 2 тренировки',[61.0,60.6,60.2,59.9,59.7],'1 700 ккал · белок 110 г']];
SC.trainer=()=>{const c=TCL[TC];
 return `<div class="hd"><div><h2>Кабинет тренера · Арман · Самал</h2><p>Тренер ведёт своих клиентов: цели, замеры и вес, план тренировок и питания. Клиент видит свою программу и прогресс в приложении, отмечает выполненное. Руководитель видит загрузку и удержание клиентов у каждого тренера.</p></div></div>
 <div class="seg">${TCL.map((x,i)=>`<a class="${i===TC?'on':''}" onclick="TC=${i};render()">${x[0]}</a>`).join('')}</div>
 <div class="g2 g21"><div class="pan"><h3>${c[0]} · ${c[1]}</h3><h3 style="margin-top:6px">Вес за 4 недели, кг</h3>${bars(c[2].map((v,i)=>['неделя '+(i+1),v,v.toFixed(1).replace('.',',')]))}
  <h3 style="margin-top:12px">Программа на неделю</h3>${[['Пн','Грудь, трицепс · 6 упражнений','выполнено'],['Ср','Спина, бицепс · 6 упражнений','выполнено'],['Пт','Ноги, плечи · 7 упражнений','сегодня'],['Вс','Кардио 40 минут','—']].map(r=>`<div class="kv"><span><b>${r[0]}</b> · ${r[1]}</span><b>${r[2]==='выполнено'?tag(r[2],'g'):r[2]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Питание</h3><div class="kv"><span>Норма</span><b>${c[3]}</b></div><div class="kv"><span>План</span><b>5 приёмов · шаблон «${c[1].split(' ·')[0]}»</b></div><div class="btns l"><button class="bt sm" onclick="act('План питания отправлен клиенту в приложение.')">Отправить в приложение</button></div>
  <h3 style="margin-top:12px">Мои показатели · октябрь</h3><div class="kv"><span>Клиентов</span><b>24</b></div><div class="kv"><span>Персональных тренировок</span><b>186</b></div><div class="kv"><span>Продлили персональные</span><b>83%</b></div></div></div>
 ${said('Модуль для тренеров: вести клиентов, записывать результаты, вес, прописывать план питания, программы тренировок')}`};

/* Мобильное приложение */
SC.app=()=>`<div class="hd"><div><h2>Мобильное приложение клиента</h2><p>Одно приложение для всей сети в App Store и Google Play. QR для турникета в любом клубе, абонемент и продление с автоплатежом, запись на групповые занятия, программа и прогресс от тренера, уведомления. Позже — геймификация: баллы за посещения, челленджи между клубами.</p></div></div>
 <div class="g3 bz-phones">${[['Вход в клуб','<div class="bz-qr">▦▦▦<br>▦ ▦<br>▦▦▦</div><b>Покажите QR на турникете</b><span>действует в 18 клубах</span>'],['Абонемент','<b>Безлимит · вся сеть</b><span>до 25.10.2026 · осталось 2 дня</span><a>Продлить · 29 000 ₸</a><span>автопродление по карте: выкл.</span>'],['Запись','<b>Сайкл · 18:00 · Арман</b><span>мест нет · вы 2-й в листе ожидания</span><b style="margin-top:8px">Бокс · 19:00 · Ерлан</b><a>Записаться · 2 места</a>'],['Прогресс','<b>−6,2 кг за 4 недели</b><span>12 тренировок · серия 9 дней</span><span>программа на пятницу: ноги, плечи</span>']].map(p=>`<div class="pan"><h3>${p[0]}</h3><div class="phmini">${p[1]}</div></div>`).join('')}</div>
 <div class="g2"><div class="pan"><h3>Оплаты в приложении</h3><div class="kv"><span>Покупка и продление абонемента</span><b>эквайринг банка</b></div><div class="kv"><span>Автопродление (рекуррентные платежи)</span><b>по согласию клиента</b></div><div class="kv"><span>Персональные тренировки, бар</span><b>по желанию</b></div></div>
 <div class="pan"><h3>Публикация</h3><div class="kv"><span>App Store и Google Play</span><b>2–3 недели на проверку</b></div><div class="kv"><span>Аккаунты разработчика</span><b>на компанию клиента</b></div></div></div>
 ${said('Мобильное приложение: доступ на турникетную систему, эквайринг, рекуррентные платежи, онлайн-продажа, запись на групповые программы')}`;

/* Единое ядро */
SC.core=()=>`<div class="hd"><div><h2>Единое ядро и модули</h2><p>Финансы нельзя делать отдельно от всего остального: деньги рождаются в кассе, приложении и абонементах. Поэтому сначала — единое ядро (клиенты, клубы, абонементы, деньги, права), а модули подключаются к нему и не дублируют данные. Переход с текущих программ — по одному модулю, без остановки клубов.</p></div></div>
 <div class="bz-core"><div class="c"><b>ЯДРО</b><span>клиенты и карты · клубы и франшизы · абонементы · деньги · права и роли · журнал</span></div>${[['Финансы и инвесторы','P&L клубов, выписки, 1С, кабинет инвестора'],['Продажи и клиенты','воронка, Instagram, WhatsApp, Sipuni'],['Клуб','касса, бар и склад, турникеты, занятия'],['Тренеры','программы, питание, прогресс'],['Приложение','QR, оплаты, запись, прогресс'],['Геймификация','баллы, челленджи — позже']].map(m=>`<div class="m"><b>${m[0]}</b><span>${m[1]}</span></div>`).join('')}</div>
 <div class="pan"><h3>Переход с текущих программ</h3><div class="kv"><span>Сейчас: TS Portal (касса, учёт), приложение, Excel по финансам</span><b>работают параллельно</b></div><div class="kv"><span>Шаг 1: ядро + выбранный первый модуль</span><b>данные переносим из TS Portal</b></div><div class="kv"><span>Шаг 2–4: остальные модули по очереди</span><b>старые программы выключаются по мере готовности</b></div></div>
 ${tip('Почему не стыковать с чужой системой','Стыковка с системой, которую подрядчик потом оставит себе и будет продавать как продукт, — это постоянная зависимость и двойной ввод. Своё ядро остаётся вашим: код, данные и развитие.')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и этапы</h2><p>Каждый блок — стандартный пакет разработки: 4–6 недель с согласованием каждой версии. Начинаем с ядра и одного блока, который нужнее всего, дальше — по очереди. Платите за каждый блок отдельно, без абонплаты.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Блок</th><th>Что входит</th><th>Срок</th><th style="text-align:right">Стоимость</th></tr></thead><tbody>${[['1. Ядро + финансы и инвесторы','клиенты, клубы, абонементы, права; P&L клубов, 2 канала доходов и 3 расходов, выписки банков, кабинет инвестора','4–6 недель','2 500 000 ₸'],['2. Продажи и клуб','воронка с WhatsApp, Instagram, Sipuni; касса ресепшн и бар, склад, турникеты, групповые занятия','4–6 недель','2 500 000 ₸'],['3. Мобильное приложение','QR-вход в 18 клубов, покупка и автопродление, запись, уведомления; публикация в сторах','4–6 недель + 2–3 на публикацию','2 500 000 ₸'],['4. Тренеры и геймификация','программы, питание, прогресс клиента, баллы и челленджи','4–6 недель','2 500 000 ₸'],['Обмен с 1С','расходы, поступления, контрагенты','вместе с блоком 1','800 000 ₸']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td class="mono" style="text-align:right">${r[3]}</td></tr>`).join('')}<tr><td colspan="3"><b>Вся система</b></td><td class="mono" style="text-align:right"><b>≈ 10 800 000 ₸</b></td></tr></tbody></table></div></div>
 <div class="pay3"><div><small>Старт блока · 10%</small><b>250 000 ₸</b><span>при подписании</span></div><div><small>База · 45%</small><b>1 125 000 ₸</b><span>после приёмки базы</span></div><div><small>Сдача · 45%</small><b>1 125 000 ₸</b><span>после полировки</span></div></div>
 <p class="hint">Отдельно: эквайринг и комиссии банка, аккаунты разработчика Apple и Google, сервер (бесплатно или 5–10 $), WhatsApp через Green API ≈ 5 000 ₸ за номер, телефония Sipuni — по тарифу. Порядок блоков выбираете вы.</p>
 ${said('Примерно по срокам и по стоимости можете прикинуть?','Блок — 4–6 недель и около 2,5 млн ₸; четыре блока — около 10 млн ₸.')}`;

/* Каркас */
const CARD={};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const m=MEM.find(x=>(x.id+x.n+x.ph).toLowerCase().includes(v));if(m&&v){go('members');return}const c=CLUBS.findIndex(x=>(x[0]+x[1]).toLowerCase().includes(v));if(c>=0&&v){curClub=c;go('inv');return}toast('Ищите по клиенту, карте или клубу: «Ержан», «BL-04812», «Есиль».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">FITNESSBLITZ</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='money'?'<em>'+OPS.filter(o=>o[6]!=='ok').length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Сеть'],['fin','Финансы'],['funnel','Продажи'],['pos','Касса'],['app','Прилож.']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'FitnessBlitz';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт сети: выручка, абонементы, посещения, лиды, неразнесённые деньги.'],
 ['fin','2 · Финансы каждого клуба — прозрачно, как у Додо.'],
 ['money','3 · Два канала доходов и три канала расходов в одной ленте.'],
 ['bank','4 · Выписки банков разносятся по правилам и уходят в 1С.'],
 ['inv','5 · Кабинет инвестора: только свой клуб.'],
 ['clubs','6 · 18 клубов и роялти франшиз.'],
 ['funnel','7 · Воронка отдела продаж и клубы — одни данные.'],
 ['access','8 · Один QR — любой клуб сети.'],
 ['trainer','9 · Кабинет тренера: вес, питание, программа.'],
 ['app','10 · Мобильное приложение клиента.'],
 ['core','11 · Единое ядро, модули — по очереди.'],
 ['launch','12 · Стоимость: блок ≈ 2,5 млн ₸, 4–6 недель.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
