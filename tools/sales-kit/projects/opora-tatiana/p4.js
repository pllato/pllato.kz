
/* Переезд из Битрикса */
let MV=0;
const MVS=[['Выгрузка','Забираем из Битрикса всё: лиды, сделки, клиентов, комментарии, файлы и ссылки на Google Диск'],['Проверка','Сверяем количество: сколько было в Битриксе — столько стало у вас'],['Воронки','Раскладываем сделки по вашим 10 воронкам и этапам'],['Параллельно','Неделю можно работать и там, и там — ничего не теряется'],['Готово','Битрикс больше не нужен; он оплачен до января — успеваем']];
SC.move=()=>`<div class="hd"><div><h2>Переезд из Битрикса</h2><p>Боитесь потерять базу — это нормально. Переезд занимает 2–3 дня, и мы сверяем каждую цифру: сколько было в Битриксе, столько будет у вас. Битрикс оплачен до января — переезжаем спокойно, без спешки.</p></div></div>
 <div class="mvs">${MVS.map((s,i)=>`<div class="mv ${i<MV?'ok':i===MV?'on':''}" onclick="MV=${i};render()"><i>${i<MV?'✓':i+1}</i><b>${s[0]}</b><span>${s[1]}</span></div>`).join('')}</div>
 <div class="pan"><h3>Сверка после переноса</h3><div class="tw"><table class="t"><thead><tr><th>Что</th><th>В Битриксе</th><th>У вас</th><th></th></tr></thead><tbody>${[['Лиды в архиве','25 140','25 140'],['Клиенты','10 386','10 386'],['Сделки','14 902','14 902'],['Комментарии и история','312 480','312 480'],['Ссылки на Google Диск','10 211','10 211'],['Сотрудники и доступы','25','25']].map(r=>`<tr><td>${r[0]}</td><td class="mono">${r[1]}</td><td class="mono">${MV>=2?r[2]:'—'}</td><td>${MV>=2?tag('совпадает ✓','g'):tag('после проверки','')}</td></tr>`).join('')}</tbody></table></div><button class="bt sm p" onclick="MV=Math.min(4,MV+1);render()">Следующий шаг переезда →</button></div>
 ${said('У меня страх: столько лидов, в архиве двадцать пять тысяч, база клиентов больше десяти тысяч — как это всё плавно перенести, чтобы не потерять','Недавно перенесли из Битрикса компанию со 150 000 клиентов — перенос занял 2–3 дня.')}`;

/* Расходы в месяц */
SC.costs=()=>`<div class="hd"><div><h2>Расходы в месяц: сейчас и после</h2><p>Свою программу вы оплачиваете один раз. Дальше остаются только мелкие ежемесячные расходы — без абонплаты за систему и без доплат за сотрудников и память.</p></div></div>
 <div class="g2"><div class="pan cmp bad"><h3>Сейчас</h3><div class="kv"><span>Битрикс24, тариф «Профессиональный»</span><b>по вашему счёту</b></div><div class="kv"><span>WhatsApp: 3 номера × ~36 000 ₸</span><b>≈ 108 000 ₸</b></div><div class="kv"><span>Интегратор Битрикса</span><b>≈ 10 часов в год</b></div><div class="kv"><span>Не хватает памяти — переход на тариф выше</span><b>дороже</b></div><div class="kv on"><span><strong>Всего, по вашим словам</strong></span><b>≈ 300 000 ₸ в месяц</b></div></div>
 <div class="pan cmp good"><h3>После</h3><div class="kv"><span>Своя программа — абонплаты нет</span><b>0 ₸</b></div><div class="kv"><span>WhatsApp: 3 номера × 5 000 ₸</span><b>15 000 ₸</b></div><div class="kv"><span>Сервер (где хранится программа и база)</span><b>≈ 5–10 $ ≈ 2 500–5 000 ₸</b></div><div class="kv"><span>Звонки с записью — если подключите</span><b>по тарифу оператора</b></div><div class="kv"><span>Сотрудники и память</span><b>без ограничений</b></div><div class="kv on"><span><strong>Всего</strong></span><b>≈ 20 000–30 000 ₸ в месяц</b></div></div></div>
 <div class="pan"><h3>Поддержка после запуска</h3><div class="kv"><span>Первые 3 месяца</span><b>бесплатно: исправляем всё, что работает не так, как договорились</b></div><div class="kv"><span>Потом — только когда нужно</span><b>20 $ в час · без ежемесячной платы</b></div><div class="kv"><span>Если, как сейчас с Битриксом, нужно ~10 часов в год</span><b>≈ 200 $ в год</b></div><div class="kv"><span>Где хранятся программа, база и доступы</span><b>на сервере, оформленном на вашу компанию; ключи — у вас</b></div></div>
 ${said('Чтобы мы понимали: вместо трёхсот тысяч мы уйдём на тридцать')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Один платёж за программу, сделанную под вашу компанию. Сначала — основное за 2 недели, потом доводим вместе с вами: что удобно, что неудобно. Программа, база и код — ваши.</p></div></div>
 <div class="pk1"><div><small>Стоимость</small><b>2 000 000 ₸</b><span>один раз · без абонплаты</span></div><div><small>Срок</small><b>4–6 недель</b><span>основное — около 2 недель</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>200 000 ₸</b><span>после подписания договора</span></div><div><small>Основное готово · 45%</small><b>900 000 ₸</b><span>заявки, воронки, карточка, WhatsApp</span></div><div><small>Всё готово · 45%</small><b>900 000 ₸</b><span>после доводки, переезда и обучения</span></div></div>
 <div class="mvs"><div class="mv ok"><i>1</i><b>Демо</b><span>четверг, 14:00 — с собственником</span></div><div class="mv on"><i>2</i><b>Основное · 2 недели</b><span>заявки, воронки, карточка клиента, WhatsApp</span></div><div class="mv"><i>3</i><b>Доводка с вами</b><span>расчёт, сопровождение, оплаты, статистики</span></div><div class="mv"><i>4</i><b>Переезд · 2–3 дня</b><span>вся база из Битрикса со сверкой</span></div><div class="mv"><i>5</i><b>Обучение</b><span>каждого сотрудника по его работе</span></div></div>`;

/* Карточки, каркас */
const CARD={};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей программе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase();const c=CL.find(x=>(x.n+x.ph+x.id).toLowerCase().includes(v));if(c){openCl(c.id)}else toast('Ищите по имени, телефону или номеру клиента.')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Исполнительный директор';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">ОПОРА</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='leads'?'<em>9</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['leads','Заявки'],['funnels','Воронки'],['chat','WhatsApp'],['costs','Расходы']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Опора';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();const a=document.getElementById('addBtn');if(a)a.style.display=allowed('leads')?'':'none';try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт собственника: заявки, договоры, деньги и статистики — на одном экране.'],
 ['stats','2 · Статистики должностей: растёт или падает, по неделям.'],
 ['leads','3 · Заявки из Instagram, TikTok, сайтов и WhatsApp — в один список.'],
 ['funnels','4 · Воронки по услугам. Этапы меняете сами.'],
 ['client','5 · Карточка клиента: переписка, документы, оплата — вместо ссылок на Диск.'],
 ['chat','6 · Все номера WhatsApp в одном окне.'],
 ['calc','7 · Расчёт пенсии — сразу файл клиенту.'],
 ['salary','8 · Сдельная оплата считается сама.'],
 ['move','9 · Переезд из Битрикса за 2–3 дня, со сверкой.'],
 ['costs','10 · Расходы: было ~300 тыс. в месяц — станет ~20–30 тыс.'],
 ['launch','11 · Стоимость: 2 млн один раз, 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
