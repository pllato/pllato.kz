/* Ресторан */
let ALC=[['401','Стейк из говядины',6500,'ужин','принят'],['302','Овощи на гриле без соли',2800,'обед','готовится']];
function foodN(m){const base={br:142,lunch:146,dn:139}[m];return base+GU.filter(g=>g.st==='in'&&g.id==='Г-1047').length*2}
SC.food=()=>`<div class="hd"><div><h2>Ресторан: сколько готовить</h2><p>Ресепшн заселяет и выселяет гостей — ресторан сразу видит, сколько человек будет на каждом приёме пищи и сколько по каким столам. Пятиразовое питание входит в путёвку; блюда вне меню гость заказывает за отдельную плату — в фолио.</p></div></div>
 <div class="wid"><div><small>Завтрак 08:00</small><b>${foodN('br')}</b><span>по списку гостей на утро</span></div><div><small>Обед 13:00</small><b class="a">${foodN('lunch')}</b><span>+${GU.filter(g=>g.st==='arr').length} заезда до обеда</span></div><div><small>Полдник 16:00</small><b>${foodN('lunch')-12}</b><span>по отметкам вчера</span></div><div><small>Ужин 19:00</small><b>${foodN('dn')}</b><span>−${GU.filter(g=>g.st==='out').length} выезда · бронь вечер</span></div><div><small>Кефир 21:00</small><b>${foodN('dn')-30}</b><span>по назначениям</span></div></div>
 <div class="g2"><div class="pan"><h3>Обед по столам</h3>${bars([['Общий стол',84,'84'],['Диетический стол №5 (ЖКТ)',38,'38'],['Стол №9 (сахар)',14,'14'],['Детское меню',10,'10']])}${tip('Калькуляция','Под это число склад продуктов списывает продукты по технологическим картам блюд — сколько мяса, овощей и круп ушло на обед.')}</div>
 <div class="pan"><h3>Заказы вне меню · платно</h3>${ALC.map(r=>`<div class="kv"><span>Номер ${r[0]} · ${r[1]} · ${r[3]}</span><b class="mono">${fmt(r[2])} ₸ · ${r[4]}</b></div>`).join('')}<div class="btns l" style="margin-top:10px"><button class="bt p" onclick="alc()">+ Заказ</button></div></div></div>
 ${said('Ресепшн показывает, сколько у него людей, — ресторан должен видеть это и под это уже готовить')}
 ${said('Если сегодня в меню нет стейка, а клиент захотел стейк — такая функция тоже должна быть')}`;
function alc(){ALC.push(['204','Омлет на пару',1800,'ужин','принят']);toast('Заказ из номера 204: омлет на пару, 1 800 ₸ — в фолио гостя, кухне — в работу.');render()}

/* Склад продуктов */
let WF=[['Говядина','кг',62.4,0.12],['Курица (филе)','кг',48,0.1],['Картофель','кг',210,0.18],['Морковь','кг',74,0.05],['Рис','кг',90,0.04],['Гречка','кг',66,0.04],['Молоко','л',120,0.25],['Хлеб','шт',90,0.3],['Яблоки','кг',58,0.15]],wfOff=false;
SC.wfood=()=>{const n=foodN('lunch');
 return `<div class="hd"><div><h2>Склад продуктов</h2><p>Приход продуктов по накладным, расход — по калькуляции: количество гостей с ресепшн × норма на порцию из технологической карты. Сколько ушло и сколько осталось — видно каждый день, перерасход подсвечивается.</p></div><div class="btns"><button class="bt" onclick="act('Приход продуктов: поставщик, накладная, вес, цена.')">+ Приход</button>${wfOff?'':`<button class="bt p" onclick="wfWrite()">Списать на обед · ${n} чел.</button>`}</div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Продукт</th><th>Остаток</th><th>Норма на гостя в день</th><th>На обед ${n} чел.</th><th>Хватит на</th></tr></thead><tbody>${WF.map(r=>{const need=r[3]*n,dd=Math.floor(r[2]/(r[3]*n*1.6));return `<tr class="${dd<3?'rowwarn':''}"><td><b>${r[0]}</b></td><td class="mono">${String(Math.round(r[2]*10)/10).replace('.',',')} ${r[1]}</td><td class="mono">${String(r[3]).replace('.',',')} ${r[1]}</td><td class="mono">${String(Math.round(need*10)/10).replace('.',',')} ${r[1]}</td><td class="mono ${dd<3?'neg':''}">${dd} дн.</td></tr>`}).join('')}</tbody></table></div></div>
 ${said('Склад на калькуляцию: купили продукты, и через список гостей списываются определённые продукты — овощи, фрукты, мясо')}`};
function wfWrite(){const n=foodN('lunch');WF.forEach(r=>r[2]=Math.max(0,r[2]-r[3]*n*0.6));wfOff=true;toast(`Списано по калькуляции обеда на ${n} гостей. Остатки обновлены.`);render()}

/* Медикаменты и расходники */
let WM=[['Масло массажное','л',2.7,'Массаж общий · 30 мл',18],['Масло массажное · спина','л',1.1,'Массаж спины · 15 мл',9],['Озокерит','кг',14,'Прогревание · 0,4 кг',16],['Соль йодобромная','кг',22,'Ванна · 0,5 кг',12],['Кислородная смесь','бал.',3,'Коктейль · 1/80 баллона',24],['Перчатки','пар',380,'Процедура · 1 пара',96],['Простыни одноразовые','шт',540,'Процедура · 1 шт',88]];
SC.wmed=()=>`<div class="hd"><div><h2>Медикаменты и расходники</h2><p>Каждой процедуре задан расход материалов. Медсестра отметила «провела» — масло, озокерит, соль, перчатки списываются сами. Остатки и «на сколько дней хватит» — по фактическим процедурам.</p></div><div class="btns"><button class="bt" onclick="act('Приход медикаментов и расходников.')">+ Приход</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Материал</th><th>Остаток</th><th>Норма</th><th>Процедур в день</th><th>Хватит на</th></tr></thead><tbody>${WM.map(r=>{const per=parseFloat(r[3].split('· ')[1].replace(',','.'))/(/мл/.test(r[3])?1000:1)||1/80;const d=Math.floor(r[2]/(per*r[4]));return `<tr class="${d<6?'rowwarn':''}"><td><b>${r[0]}</b></td><td class="mono">${String(r[2]).replace('.',',')} ${r[1]}</td><td>${r[3]}</td><td class="mono">${r[4]}</td><td class="mono ${d<6?'neg':''}">${d} дн.</td></tr>`}).join('')}</tbody></table></div></div>
 ${said('К массажисту записан человек, гость принимает массаж — после массажа сколько-то масла списывается')}`;

/* Хозяйственный склад */
SC.whouse=()=>`<div class="hd"><div><h2>Хозяйственный склад</h2><p>Отдельный склад: лампочки, бельё, полотенца, одноразовые принадлежности, моющие. Выдача — на номер, корпус или сотрудника, чтобы было видно, куда ушло.</p></div><div class="btns"><button class="bt p" onclick="act('Выдача со склада: что, сколько, на какой номер или кому.')">Выдать</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Позиция</th><th>Остаток</th><th>Выдано за месяц</th><th>Куда чаще</th></tr></thead><tbody>${[['Постельное бельё, комплект',186,240,'хаускипинг'],['Полотенца',320,410,'хаускипинг'],['Тапочки одноразовые',640,520,'номера'],['Лампочки E27',48,22,'корпус 1, 2 этаж'],['Моющие средства, л',96,140,'хаускипинг'],['Халаты',84,36,'номера VIP']].map(r=>`<tr><td><b>${r[0]}</b></td><td class="mono">${r[1]}</td><td class="mono">${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Хозяйственный склад должен быть отдельно: лампочки, постельное, одноразовые')}`;

/* Хаускипинг */
const HKS=[['busy','занят'],['dirty','выезд · грязный'],['clean','уборка'],['ready','готов'],['free','свободен, чистый']];
let HK={'101':'busy','102':'busy','103':'busy','104':'busy','105':'dirty','201':'busy','202':'free','203':'dirty','204':'clean','205':'ready','301':'busy','302':'free','303':'free','401':'busy','402':'free'};
const ARRR=['204','205'];
SC.hk=()=>`<div class="hd"><div><h2>Хаускипинг · номера</h2><p>Ресепшн принимает номер у выезжающего гостя — номер становится «грязным» и попадает в список уборки. Горничная с телефона нажимает «Убираю», затем «Готов»; ресепшн видит, что номер можно заселять. Номера с заездом сегодня — первыми.</p></div></div>
 <div class="hkg">${ROOMS.map(r=>{const s=HK[r[0]];return `<div class="hkc ${s}" onclick="hkNext('${r[0]}')"><b class="mono">${r[0]}</b><span>${HKS.find(x=>x[0]===s)[1]}</span>${ARRR.includes(r[0])?'<em>заезд сегодня</em>':''}${s==='dirty'?'<button class="bt sm">Убираю</button>':s==='clean'?'<button class="bt p sm">Готов</button>':''}</div>`}).join('')}</div>
 ${said('Ресепшн говорит хаускипингу: в этом номере заезд, нужно подготовить, — и хаускипинг нажимает кнопку: очистил, готово')}`;
function hkNext(r){const s=HK[r];if(s==='dirty'){HK[r]='clean';toast(`Номер ${r}: уборка начата.`)}else if(s==='clean'){HK[r]='ready';toast(`Номер ${r} готов — ресепшн получил уведомление, можно заселять.`)}else{toast(`Номер ${r}: ${HKS.find(x=>x[0]===s)[1]}.`);return}render()}

/* Переход */
SC.migrate=()=>`<div class="hd"><div><h2>Вместо Shelter</h2><p>Сейчас программа стоит на сервере в санатории: отключается свет — появляются ошибки, а свои «хотелки» настроить нельзя. Новая система работает в облаке и делается под ваши процессы.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th></th><th>Shelter сейчас</th><th>Новая система</th></tr></thead><tbody>${[['Где работает','локальный сервер в санатории','облачный сервер в дата-центре; свет в здании не влияет'],['Доступ','с компьютеров в здании','с компьютера, планшета медсестры, телефона руководителя и гостя'],['Настройка','много настроек, свои хотелки не настроить','делаем под ваши процессы, дорабатываем по ходу'],['Медблок','—','программы, автораспределение, кабинеты, подтверждение пациентом'],['Ресторан и склады','—','количество гостей с ресепшн, калькуляция, расход по процедурам'],['Данные','перенос из Shelter: номера, гости, брони, прейскурант','перенос включён']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('У нас иногда свет отключается, из-за этого ошибки выходят. Вторая проблема — свои хотелки мы не можем настроить в Шелтере')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Стандартный пакет: всё из демо. Сначала база — номера и медблок, затем ресторан, склады и хаускипинг, затем полировка с вашими сотрудниками. Система ваша — абонплаты нет.</p></div></div>
 <div class="pk1"><div><small>Пакет</small><b>2 500 000 ₸</b><span>один раз · до 50 пользователей</span></div><div><small>Срок</small><b>4–6 недель</b><span>база → полировка → запуск</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>250 000 ₸</b><span>при подписании</span></div><div><small>База · 45%</small><b>1 125 000 ₸</b><span>после приёмки базы</span></div><div><small>Сдача · 45%</small><b>1 125 000 ₸</b><span>после полировки и передачи</span></div></div>
 <div class="g2"><div class="pan"><h3>Входит</h3><div class="kv"><span>Шахматка, карточка гостя, путёвки, договор, отчёты</span><b>✓</b></div><div class="kv"><span>Медблок: программы, автораспределение, кабинеты, планшеты, подтверждение пациентом</span><b>✓</b></div><div class="kv"><span>Ресторан, склады продуктов, медикаментов, хозяйственный, хаускипинг</span><b>✓</b></div><div class="kv"><span>Перенос данных из Shelter</span><b>✓</b></div></div>
 <div class="pan"><h3>После сдачи</h3><div class="kv"><span>Сопровождение</span><b>3 месяца бесплатно</b></div><div class="kv"><span>Дальше</span><b>20 $ в час, по необходимости</b></div><div class="kv"><span>Сервер</span><b>5–15 $ в месяц</b></div></div></div>`;

/* Каркас */
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const g=GU.find(x=>(x.id+x.n+x.room).toLowerCase().includes(v));if(g&&v){card('g',g.id);return}toast('Ищите по гостю, номеру или карточке: «Сапарова», «204», «Г-1047».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">САНАТОРИЙ</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='med'?'<em>'+GU.filter(g=>g.st==='arr').length+'</em>':x[0]==='nurse'?'<em>'+pcnt('done')+'</em>':x[0]==='hk'?'<em>'+Object.values(HK).filter(s=>s==='dirty').length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['chess','Шахматка'],['med','Медблок'],['cabs','Кабинеты'],['food','Ресторан']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'САНАТОРИЙ';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: номера, процедуры, ресторан, платные услуги — на одном экране.'],
 ['chess','2 · Шахматка номеров, как в гостинице.'],
 ['med','3 · Главный врач сразу видит заезды.'],
 ['prog','4 · Программа и автораспределение по дням и часам.'],
 ['cabs','5 · Кабинеты и медсёстры: кто во сколько придёт.'],
 ['nurse','6 · Планшет медсестры.'],
 ['phone','7 · Пациент подтверждает процедуру с телефона — без приписок.'],
 ['food','8 · Ресторан видит, сколько готовить.'],
 ['wmed','9 · Масло и расходники списываются по процедурам.'],
 ['hk','10 · Хаускипинг: грязный → уборка → готов.'],
 ['launch','11 · Стоимость: 2,5 млн ₸, 10 / 45 / 45, 4–6 недель.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
