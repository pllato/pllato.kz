
/* Роли и журнал */
SC.audit=()=>`<div class="hd"><div><h2>Роли и журнал действий</h2><p>Коллектор видит только своих должников, юрист — претензии и суд, бухгалтер — платежи. Персональные данные должников открыты только тем, кому нужны. Каждое действие записывается: кто, когда, что изменил — телефон, сумму, этап.</p></div></div>
 <div class="g2 g21"><div class="pan"><h3>Журнал</h3><div class="tw"><table class="t"><thead><tr><th>Когда</th><th>Кто</th><th>Раздел</th><th>Что сделал</th><th>Значение</th></tr></thead><tbody>${AUDIT.map(a=>`<tr><td class="mono">${a[0]}</td><td>${a[1]}<br><small>${a[2]}</small></td><td>${a[3]}</td><td>${esc(a[4])}</td><td>${esc(a[5])}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Роли</h3>${Object.entries(ROLES).map(([k,v])=>`<div class="kv"><span><b>${k}</b><small>${esc(v.note)}</small></span><b>${v.s.length} разд.</b></div>`).join('')}</div></div>`;

/* Запуск и стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Стандартный пакет разработки. Один платёж — система ставится на ваш сервер и становится вашей, ежегодной оплаты как у коробочных CRM нет. Ядро — около 10 дней, дальше полировка вместе с вами.</p></div></div>
 <div class="pk1"><div><small>Стандартный пакет</small><b>1 500 000 ₸</b><span>при решении в течение недели — скидка 5% за скорость: <b>1 425 000 ₸</b></span></div><div><small>Срок</small><b>4–6 недель</b><span>ядро — около 10 дней</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>150 000 ₸</b><span>при подписании · со скидкой 142 500 ₸</span></div><div><small>Ядро · 45%</small><b>675 000 ₸</b><span>после приёмки ядра · 641 250 ₸</span></div><div><small>Сдача · 45%</small><b>675 000 ₸</b><span>после всех правок · 641 250 ₸</span></div></div>
 <div class="mvs"><div class="mv ok"><i>1</i><b>Видео вашей любимой CRM</b><span>до среды 14.10 · вкладки и глубина</span></div><div class="mv on"><i>2</i><b>Ядро · 10 дней</b><span>должники, карточка, комментарии, воронка, Excel</span></div><div class="mv"><i>3</i><b>Полировка</b><span>сборки каждые 1–2 дня, ваши правки</span></div><div class="mv"><i>4</i><b>Перенос из Excel</b><span>10 000 должников, платежи, комментарии</span></div><div class="mv"><i>5</i><b>Запуск</b><span>телефония, WhatsApp, обучение команды</span></div></div>
 <div class="pan"><h3>Ежемесячно — напрямую сервисам</h3><div class="kv"><span>IP-телефония с записью разговоров</span><b>≈ 30–35 тыс. ₸</b></div><div class="kv"><span>WhatsApp-провайдер</span><b>≈ 10 тыс. ₸</b></div><div class="kv"><span>Сервер</span><b>≈ 10–15 тыс. ₸</b></div></div>
 ${said('Главное, чтобы удобство было, и всё — больше ничего нам не нужно','Внешний вид сделаем по видео CRM, которая вам понравилась: поменять дизайн для нас — сутки, бесплатно.')}`;

/* Карточки */
const CARD={};
CARD.prom=id=>{const d=DB(id);return ['Обещание оплаты · '+esc(d.nm),'Остаток '+tg(rest(d)),`<div class="form"><label>Сумма, ₸<input id="pr_s" type="number" value="${Math.round(rest(d)*0.3/1000)*1000}"></label><label>Дата<select id="pr_d">${['13.10','14.10','15.10','16.10','20.10'].map(x=>`<option>${x}</option>`).join('')}</select></label></div><label class="ck"><input type="checkbox" checked> Напомнить в WhatsApp накануне со ссылкой на оплату</label><button class="bt p" onclick="promDo('${id}')">Сохранить</button>`]};
function promDo(id){const d=DB(id),s=+document.getElementById('pr_s').value||0,dt=document.getElementById('pr_d').value;if(!s){toast('Сумма?');return}d.prom={d:dt,s};d.st='promise';COMM[id].unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,'Обещание: '+tg(s)+' до '+dt+'.']);AUDIT.unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,role,'Должники','Обещание '+id,tg(s)+' до '+dt,'компьютер']);closeM();render();toast('Обещание сохранено. Накануне должнику уйдёт напоминание, платёж закроет обещание сам.')}
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){if(!v)return;F.q=v;go('debtors')}

/* Каркас */
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(role==='Коллектор')F.col='ER';if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}.`)}
function switchRole(k){role=k;F.col=role==='Коллектор'?'ER':'';document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">ВОЗВРАТ</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='promises'?'<em>'+(promToday().length+38)+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['debtors','Должники'],['promises','Обещания'],['payments','Платежи'],['reports','Excel']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Возврат';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: сколько зашло сегодня против плана 2,5 млн, должники, остаток, обещания.'],
 ['debtors','2 · Все должники вместо Excel: фильтры, поиск, остатки, комментарии.'],
 ['card','3 · Карточка должника: долг по частям, комментарии, звонки с записью, платежи.'],
 ['funnel','4 · Воронка взыскания — этапы как у вас.'],
 ['promises','5 · Обещания: напоминание накануне, платёж закрывает обещание сам.'],
 ['calls','6 · Звонки через IP-телефонию, все записи в карточке.'],
 ['payments','7 · Платежи разносятся по должникам автоматически.'],
 ['portfolios','8 · Портфели: цена выкупа, собрано, окупаемость.'],
 ['reports','9 · Excel и отчётность для Нацбанка — файл скачивается.'],
 ['plan','10 · План и коллекторы.'],
 ['launch','11 · Стоимость: 1,5 млн, 4–6 недель, 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
