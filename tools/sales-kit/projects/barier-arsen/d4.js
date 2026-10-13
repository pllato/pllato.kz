
SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Стандартный пакет разработки. Один платёж — система ставится на ваш сервер и становится вашей: код, база, документация. Дальше — поддержка по необходимости, 20 $ в час, без абонплаты.</p></div></div>
 <div class="pk1"><div><small>Стандартный пакет</small><b>1 500 000 ₸</b><span>при ответе сегодня — скидка 3%: <b>1 455 000 ₸</b></span></div><div><small>Срок</small><b>около месяца</b><span>ядро — около 10 дней, всё — 4–6 недель</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>150 000 ₸</b><span>при подписании · со скидкой 145 500 ₸</span></div><div><small>Ядро · 45%</small><b>675 000 ₸</b><span>после согласования ядра · 654 750 ₸</span></div><div><small>Сдача · 45%</small><b>675 000 ₸</b><span>после полной сдачи · 654 750 ₸</span></div></div>
 <div class="mvs"><div class="mv ok"><i>1</i><b>Согласование</b><span>генеральный директор и учредитель · сегодня</span></div><div class="mv on"><i>2</i><b>Ядро · 10 дней</b><span>заявки, распределение, приложение дезинфектора, оплаты</span></div><div class="mv"><i>3</i><b>Доработка с вами</b><span>сборки, ваши правки по ходу работы</span></div><div class="mv"><i>4</i><b>WhatsApp и телефония</b><span>заявки сами попадают в систему</span></div><div class="mv"><i>5</i><b>Запуск</b><span>сервер, обучение, передача кода</span></div></div>
 <div class="pan"><h3>Ежемесячно — напрямую сервисам</h3><div class="kv"><span>WhatsApp-провайдер</span><b>≈ 10 тыс. ₸</b></div><div class="kv"><span>IP-телефония с записью</span><b>по тарифу оператора</b></div><div class="kv"><span>Сервер</span><b>≈ 10–15 тыс. ₸</b></div></div>
 ${said('После полной оплаты приложение полностью наше остаётся?','Да: код, база и документация передаются вам, система работает на вашем сервере.')}`;

const CARD={};
CARD.newjob=()=>['Новая заявка','Оператор заводит за полминуты · цена по прайсу',`<div class="form"><label>Клиент<input id="nj_n" value="Алия"></label><label>Телефон<input id="nj_p" value="+7 701 555 12 34"></label><label>Адрес<input id="nj_a" value="мкр. Жетысу-2, д. 14, кв. 8"></label><label>Время<input id="nj_t" value="18:30"></label><label>Вредитель<select id="nj_pe">${PESTS.map(p=>`<option>${p}</option>`).join('')}</select></label><label>Объект<select id="nj_o">${OBJ.map(o=>`<option>${o}</option>`).join('')}</select></label><label>Источник<select id="nj_s">${SRC.map(s=>`<option>${s}</option>`).join('')}</select></label><label>Дезинфектор<select id="nj_d"><option value="">распределить позже</option>${DZ.map(d=>`<option value="${d[0]}">${d[1]}</option>`).join('')}</select></label></div><button class="bt p" onclick="newJob()">Создать заявку</button>`];
function newJob(){const v=k=>document.getElementById('nj_'+k).value.trim();const id='З-'+(2140+JOBS.length);const pe=v('pe'),o=v('o'),dz=v('d');
 JOBS.unshift({id,d:'14.10',t:v('t')||'—',st:dz?'set':'new',dz,pest:pe,obj:o,src:v('s'),nm:v('n')||'Клиент',ph:v('p'),addr:v('a'),sum:priceOf(pe,o),pay:'',photos:0,video:false,note:'Новая заявка',guar:['Тараканы','Клопы','Блохи'].includes(pe)?'повтор через 14 дней бесплатно':'—'});
 AUDIT.unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,role,'Заявки','Новая заявка '+id,pe+' · '+o,'компьютер']);closeM();curJob=id;go(dz?'job':'board');toast(`${id}: ${pe}, ${o} — ${tg(priceOf(pe,o))}. ${dz?'Заявка у '+DN(dz)+' в телефоне.':'Распределите её на дезинфектора.'}`)}
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){if(!v)return;LF.q=v;go('leads')}

function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Производственный директор';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(role==='Дезинфектор')MDZ='BK';if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}.`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">БАРЬЕР</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='board'&&JOBS.some(j=>j.st==='new')?'<em>'+JOBS.filter(j=>j.st==='new').length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['leads','Заявки'],['board','Распределение'],['mobile','Выезды'],['money','Деньги']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Барьер';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();const a=document.getElementById('addBtn');if(a)a.style.display=allowed('leads')?'':'none';try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: заявки, выезды, оплаты и наличные — за день и месяц.'],
 ['leads','2 · Все заявки с источником: Google, 2ГИС, OLX, Instagram, WhatsApp.'],
 ['board','3 · Распределение: выбрали заявку — назначили дезинфектора.'],
 ['mobile','4 · Приложение дезинфектора: выехал → фото «до» → обработано → оплата.'],
 ['job','5 · Карточка заявки: фото, видео, препараты, история.'],
 ['money','6 · Оплаты и наличные у дезинфекторов.'],
 ['salary','7 · Зарплата считается сама по выездам.'],
 ['stock','8 · Склад: препараты списываются по норме.'],
 ['ads','9 · Реклама: какой источник окупается.'],
 ['reports','10 · Отчёты в Excel — файл скачивается.'],
 ['launch','11 · Стоимость: 1,5 млн, 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
