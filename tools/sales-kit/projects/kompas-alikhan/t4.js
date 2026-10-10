
/* Фирменный стиль — меняется по всему демо на лету */
const PRESETS=[['Океан','#0b4f6c','#ff6b4a'],['Небо','#0a5bd3','#ffb020'],['Пустыня','#7a4a1e','#2f8f83'],['Изумруд','#0f5c4d','#f2a03d'],['Графит','#22303a','#e8463b']];
let BR={n:'Компас Тур',c1:'#0b4f6c',c2:'#ff6b4a',logo:''};try{Object.assign(BR,JSON.parse(localStorage.getItem('kompas-brand')||'{}'))}catch(e){}
function mix(hex,a){const n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;return `rgba(${r},${g},${b},${a})`}
function applyBrand(){const d=document.documentElement.style;d.setProperty('--brand',BR.c1);d.setProperty('--rail',BR.c1);d.setProperty('--brand2',BR.c2);d.setProperty('--acc2',BR.c2);d.setProperty('--brandl',mix(BR.c1,.09));d.setProperty('--rail-a',BR.c2);
 document.querySelectorAll('.bname').forEach(e=>e.textContent=BR.n);document.querySelectorAll('.blogo').forEach(e=>e.innerHTML=BR.logo?`<img src="${BR.logo}" alt="">`:LOGO_I);try{localStorage.setItem('kompas-brand',JSON.stringify(BR))}catch(e){}}
function setBr(k,v){BR[k]=v;applyBrand();if(cur==='brand'){const p=document.getElementById('brprev');if(p)p.innerHTML=brPrev()}}
function brLogo(inp){const f=inp.files&&inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{BR.logo=r.result;applyBrand();render()};r.readAsDataURL(f)}
const brPrev=()=>`<div class="bp"><div class="bp-h"><span class="blogo">${BR.logo?`<img src="${BR.logo}" alt="">`:LOGO_I}</span><b>${esc(BR.n)}</b></div><div class="bp-b"><div class="bp-w"><small>Продажи</small><b>173 млн ₸</b></div><button class="bt p">Основная кнопка</button> <span class="tag b">Статус</span> <a class="lk">Ссылка</a><div class="pbr" style="margin-top:10px"><i style="width:68%"></i></div></div></div>`;
SC.brand=()=>`<div class="hd"><div><h2>Фирменный стиль</h2><p>Цвета, логотип и название компании — по всей админке и в приложении туриста. Попробуйте: выберите цвета — демо перекрасится сразу. На старте мы возьмём ваш брендбук.</p></div></div>
 <div class="g2"><div class="pan"><h3>Готовые палитры</h3><div class="presets">${PRESETS.map(p=>`<a onclick="setBr('c1','${p[1]}');setBr('c2','${p[2]}');render()" class="${BR.c1===p[1]?'on':''}"><i style="background:${p[1]}"></i><i style="background:${p[2]}"></i>${p[0]}</a>`).join('')}</div>
  <h3 style="margin-top:14px">Свои цвета и логотип</h3><div class="form"><label>Основной цвет<input type="color" value="${BR.c1}" oninput="setBr('c1',this.value)"></label><label>Акцентный цвет<input type="color" value="${BR.c2}" oninput="setBr('c2',this.value)"></label><label>Название<input value="${esc(BR.n)}" oninput="setBr('n',this.value)"></label><label>Логотип<input type="file" accept="image/*" onchange="brLogo(this)"></label></div><button class="bt sm" onclick="BR={n:'Компас Тур',c1:'#0b4f6c',c2:'#ff6b4a',logo:''};applyBrand();render()">Вернуть как было</button></div>
 <div class="pan"><h3>Как это выглядит</h3><div id="brprev">${brPrev()}</div></div></div>
 ${said('Оформить интерфейс в фирменных цветах компании.')}`;

SC.mobile=()=>`<div class="hd"><div><h2>Админка с телефона</h2><p>Каждый экран сделан сначала под телефон: таблицы превращаются в карточки, снизу — панель с главными разделами, кнопки крупные. Перенести рейс и отправить push можно из аэропорта. Откройте демо на телефоне — всё работает так же.</p></div></div>
 <div class="phones3">${[['Заказы',`<div class="m-s">★ Вылет завтра · 2</div>${ORDERS.slice(0,4).map(o=>`<div class="m-c"><b>${o.id}</b><span>${esc(o.pax[0][0])} · ${FL(o.fl).to}</span><em>${OSN(o.st)}</em></div>`).join('')}`],['Карточка заказа',`<div class="m-c big"><b>Z-24187</b><span>Шарм-эль-Шейх · 7 ночей</span><em>Документы выданы</em></div><div class="m-r"><span>Вылет</span><b>11.10 13:30</b></div><div class="m-r"><span>Долг</span><b>0 ₸</b></div><div class="m-r"><span>Документы</span><b>3 из 4</b></div><div class="m-btn">Push туристам</div>`],['Перенос рейса',`<div class="m-c big"><b>ST455</b><span>Алматы → Шарм · 11.10</span><em>09:15 → 13:30</em></div><div class="m-r"><span>Туристов</span><b>201</b></div><div class="m-btn">Обновить время и отправить push</div>`]].map(x=>`<div class="mphone"><div class="mp-h"><span class="blogo">${LOGO_I}</span><b>${x[0]}</b></div><div class="mp-b">${x[1]}</div><div class="mp-nav"><i>Пульт</i><i class="on">Заказы</i><i>Рейсы</i><i>Push</i><i>Ещё</i></div></div>`).join('')}</div>
 ${said('Сделать админку удобной для работы с телефона, сейчас некоторые элементы отображаются некорректно.')}`;

SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Стандартный пакет разработки: всё из вашего ТЗ и то, что в демо, — один раз, без абонентской платы. Подключаемся к вашей текущей базе и приложению туриста, код и данные — ваши.</p></div></div>
 <div class="pk1"><div><small>Стандартный пакет разработки</small><b>2 500 000 ₸</b><span>11 пунктов ТЗ + рейсы, заказы, туристы, роли · запас на правки при шлифовке</span></div><div><small>Срок</small><b>4–6 недель</b><span>ядро — через 2–3 недели</span></div></div>
 <div class="pay3"><div><small>Старт · 10 %</small><b>250 000 ₸</b><span>доступ к базе и приложению, начинаем</span></div><div><small>Ядро · 45 %</small><b>1 125 000 ₸</b><span>после приёмки ядра</span></div><div><small>Сдача · 45 %</small><b>1 125 000 ₸</b><span>после шлифовки и передачи</span></div></div>
 <div class="g2"><div class="pan"><h3>Ядро — 2–3 недели</h3>${['Пульт и аналитика, мобильная версия, фирменный стиль','Заказы: фильтры, сохранённые подборки, массовые действия','Карточка заказа: документы, комментарии, история изменений','Рейсы и массовые push с фильтрами'].map(x=>`<div class="li"><i>✓</i><span>${x}</span></div>`).join('')}</div>
 <div class="pan"><h3>Шлифовка — до сдачи</h3>${['Автоуведомления: регистрация, оплата, документы, вылет','Финансы: выручка, возвраты, задолженности','Выгрузки в Excel, журнал действий, роли','Ваши правки по итогам работы'].map(x=>`<div class="li n"><i>→</i><span>${x}</span></div>`).join('')}</div></div>`;

const CARD={};
CARD.move=id=>{const f=FL(id);return [`Перенос или задержка · ${id}`,`${f.from} → ${f.to} · ${f.d} · сейчас ${f.newT||f.t} · туристов ${f.tour}`,`<div class="form"><label>Что случилось<select id="mv_k"><option value="moved">Перенос авиакомпанией</option><option value="delay">Задержка</option></select></label><label>Новое время вылета<input id="mv_t" value="${f.id==='SL801'?'08:10':''}" placeholder="чч:мм"></label></div><label class="ck"><input type="checkbox" id="mv_p" checked> Сразу подготовить push всем туристам рейса</label><p class="mini">Время обновится во всех заказах рейса, в приложении туриста и в автоуведомлениях; изменение попадёт в историю заказов и журнал действий.</p><button class="bt p" onclick="moveDo('${id}')">Сохранить</button>`]};
CARD.pay=id=>{const o=OR(id);return ['Оплата по заказу '+id,'Долг '+tg(Math.max(0,o.sum-o.paid)),`<div class="form"><label>Сумма<input id="py_s" value="${Math.max(0,o.sum-o.paid)}"></label><label>Способ<select><option>Kaspi</option><option>Карта</option><option>Наличные</option><option>Безнал</option></select></label></div><button class="bt p" onclick="payDo('${id}')">Провести</button>`]};
function payDo(id){const o=OR(id),s=+document.getElementById('py_s').value||0;const old=o.paid;o.paid=Math.min(o.sum,o.paid+s);if(o.paid>=o.sum&&['new','wait','part'].includes(o.st))o.st='paid';else if(o.paid>0&&['new','wait'].includes(o.st))o.st='part';(HIST[id]=HIST[id]||[]).unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,'Оплата',tg(old),tg(o.paid)]);AUDIT.unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,role,'Финансы',`Отметил оплату ${id}`,`${fmt(old)} → ${fmt(o.paid)} ₸`,'Chrome · Mac']);closeM();render();toast('Оплата проведена — туристу ушёл push с чеком, история и журнал обновлены.')}
CARD.neword=()=>['Новый заказ','Менеджер оформляет за туриста — или турист сам в приложении',`<div class="form"><label>Турист<input id="no_n" value="Аружан Касымова"></label><label>Телефон<input value="+7 701 000 00 00"></label><label>Рейс<select id="no_f">${FLIGHTS.map(f=>`<option value="${f.id}">${f.id} · ${f.to} · ${f.d}</option>`).join('')}</select></label><label>Отель<input id="no_h" value="Lara Palace 5★, UAI"></label><label>Стоимость, ₸<input id="no_s" value="562000"></label></div><button class="bt p" onclick="newOrd()">Создать</button>`];
function newOrd(){const v=i=>document.getElementById(i).value.trim();const id='Z-'+(24230+ORDERS.length-9);ORDERS.unshift({id,fl:v('no_f'),back:'—',hotel:v('no_h'),nights:7,pax:[[v('no_n'),'взр.','—']],ph:'+7 701 000 00 00',sum:+v('no_s')||0,paid:0,st:'new',m:'DN',app:false,src:'Менеджер',docs:{vouch:0,ticket:0,ins:0,visa:0},created:TODAY.slice(0,5)});HIST[id]=[[TODAY.slice(0,5)+' '+NOW,ROLES[role].n,'Заказ создан','—',v('no_h')]];closeM();openOrd(id);toast(`${id} создан. Туристу ушла ссылка на приложение.`)}
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){if(!v)return;F.q=v;savedOn=-1;go('orders')}

function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}.`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
/* Навигация: одна колонка слева + нижняя панель на телефоне */
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${BR.logo?`<img src="${BR.logo}" alt="">`:LOGO_I}</span><b class="bname">${esc(BR.n)}</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='flights'&&FLIGHTS.some(f=>f.st!=='ok')?'<em>'+FLIGHTS.filter(f=>f.st!=='ok').length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['orders','Заказы'],['flights','Рейсы'],['push','Push'],['finance','Финансы']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Компас';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();applyBrand();
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('orders')?'':'none';try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: пользователи приложения, заказы и продажи за день, неделю, месяц — с графиками.'],
 ['orders','2 · Заказы: фильтры, сохранённые подборки, массовые действия, Excel.'],
 ['order','3 · Карточка заказа: перелёт, туристы, деньги, документы, комментарии, история изменений.'],
 ['flights','4 · Рейсы: перенос вводится один раз — обновляется везде, туристам уходит push.'],
 ['push','5 · Массовые push по рейсу, дате, направлению, авиакомпании — с превью на телефоне.'],
 ['auto','6 · Автоуведомления: регистрация, оплата, документы, вылет.'],
 ['finance','7 · Финансы: выручка, возвраты, долги туристов и партнёрам.'],
 ['reports','8 · Отчёты в Excel — файл скачивается по-настоящему.'],
 ['audit','9 · Журнал действий: кто, когда, что изменил.'],
 ['brand','10 · Фирменный стиль: цвета и логотип меняются сразу.'],
 ['mobile','11 · Админка с телефона.'],
 ['launch','12 · Стоимость: 2,5 млн, 4–6 недель, 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();applyBrand();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
