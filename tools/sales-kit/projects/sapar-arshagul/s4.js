
/* Что заменяем, что подключаем */
SC.integr=()=>`<div class="hd"><div><h2>Что заменяем, что подключаем</h2><p>Можно ли сделать всё единым? Да, с одной оговоркой: базы цен туроператоров (Турвизор) и подборщики с их сайтов (Кви-Кво) — это отдельные сервисы с данными, их выгоднее подключить, чем писать заново. Всё остальное — в вашей системе.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Сейчас</th><th>Для чего</th><th>Что будет</th><th></th></tr></thead><tbody>${[
 ['amoCRM','Воронка, телефония, помощь РОПу','Воронка, подсказки РОПу, звонки с записью — внутри системы','заменяем','g'],
 ['U-ON.Travel','Туры, договоры, оплаты, документы','Заявки на туры, договор по шаблону, оплаты туристов и туроператорам, дедлайны','заменяем','g'],
 ['TrustMe','Подпись договоров по SMS','Своя подпись по коду из WhatsApp или SMS — без оплаты за каждую подпись','заменяем','g'],
 ['Заявки с сайта → U-ON и amoCRM','Не терять заявки','Заявки с сайта сразу в воронку','заменяем','g'],
 ['WhatsApp, 36 000 ₸','Переписка с туристами','Через Green API — около 5 000 ₸ за номер','дешевле','g'],
 ['Instagram Direct','Заявки из Instagram','Подключаем в то же окно — около 5–10 $','подключаем','i'],
 ['Телефония Altel','Звонки','Подключаем, если у оператора есть API; тариф ваш','подключаем','i'],
 ['Турвизор','Поиск туров и цен туроператоров','Подключаем: выбранный тур переходит в заявку и договор','подключаем','i'],
 ['Кви-Кво','Подборка туров с сайтов туроператоров','Подключаем через их интеграцию; своё расширение — отдельный проект','подключаем','i']
 ].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${tag(r[3],r[4])}</td></tr>`).join('')}</tbody></table></div><p class="hint">Перед стартом проверяем доступ к API Турвизора, Кви-Кво и вашей телефонии — подключаем официальными способами.</p></div>
 ${said('Мне нужен единый CRM для туризма — я не хочу платить за два CRM')}`;

/* Расходы */
SC.costs=()=>`<div class="hd"><div><h2>Расходы в месяц: сейчас и после</h2><p>Система ваша — без абонплаты и без доплат за менеджеров. Остаются только сервисы, которые нужны в любом случае.</p></div></div>
 <div class="g2"><div class="pan cmp bad"><h3>Сейчас · ≈ 256 000 ₸ в месяц на 3 менеджеров</h3><div class="kv"><span>amoCRM</span><b>по счёту</b></div><div class="kv"><span>U-ON.Travel</span><b>≈ 27 000 ₸</b></div><div class="kv"><span>WhatsApp</span><b>36 000 ₸</b></div><div class="kv"><span>Телефония Altel</span><b>11 400 ₸</b></div><div class="kv"><span>Прочие сервисы</span><b>≈ 18 000 ₸</b></div><div class="kv"><span>TrustMe — за каждую подпись</span><b>по факту</b></div><div class="kv on"><span><strong>Всего, по вашим словам</strong></span><b>≈ 256 000 ₸</b></div></div>
 <div class="pan cmp good"><h3>После</h3><div class="kv"><span>Своя система — без абонплаты</span><b>0 ₸</b></div><div class="kv"><span>Сервер</span><b>бесплатно до 10 ГБ · потом 5–10 $</b></div><div class="kv"><span>WhatsApp через Green API</span><b>≈ 5 000 ₸ за номер</b></div><div class="kv"><span>Instagram Direct</span><b>≈ 5 000 ₸</b></div><div class="kv"><span>Телефония Altel</span><b>11 400 ₸ — ваш тариф</b></div><div class="kv"><span>Подпись договоров</span><b>0 ₸ через WhatsApp</b></div><div class="kv"><span>Турвизор, Кви-Кво</span><b>по их тарифам, если оставляете</b></div><div class="kv"><span>Менеджеров</span><b>сколько угодно, до 50 без доработок</b></div></div></div>
 ${said('Два миллиона — а ежемесячно дополнительная оплата какая будет?','Только сервер — 5–10 $ в месяц, WhatsApp 5 000 ₸ за номер и ваша телефония.')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Стандартный пакет разработки: воронка и РОП вместо amoCRM, туры, договоры, подпись и оплаты вместо U-ON, подключение WhatsApp, Instagram, телефонии, Турвизора и Кви-Кво. Договор и счета — от ТОО.</p></div></div>
 <div class="pk1"><div><small>Стандартный пакет</small><b>2 000 000 ₸</b><span>один раз · без абонплаты</span></div><div><small>Срок</small><b>4–6 недель</b><span>2 больших этапа</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>200 000 ₸</b><span>при подписании</span></div><div><small>Ядро · 45%</small><b>900 000 ₸</b><span>после утверждения основного</span></div><div><small>Сдача · 45%</small><b>900 000 ₸</b><span>после полировки и запуска</span></div></div>
 <div class="pan"><h3>Отдельно, по желанию</h3><div class="kv"><span>Обучение всей команды: 3–5 занятий в Zoom</span><b>200 000 ₸</b></div><div class="kv"><span>Доработки после запуска</span><b>20 $ в час · 5 часов ≈ 100 $</b></div><div class="kv"><span>Своё расширение вместо Кви-Кво</span><b>оценим отдельно</b></div><p class="hint">3 месяца после сдачи — бесплатно исправляем ошибки. Справочник по системе для сотрудников — входит.</p></div>`;

/* Каркас */
const CARD={};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase();const t=TOURS.find(x=>(x.cl+x.id+x.ho).toLowerCase().includes(v));if(t){openTour(t.id);return}const l=LEADS.find(x=>(x.n+x.id).toLowerCase().includes(v));if(l){openLead(l.id);return}toast('Ищите по имени туриста, номеру тура или отелю.')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">SAPAR</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='contract'&&TOURS.some(t=>t.sign!=='yes')?'<em>'+TOURS.filter(t=>t.sign!=='yes').length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['leads','Воронка'],['orders','Туры'],['pay','Оплаты'],['comm','Связь']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'SAPAR';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: договоры, оплаты, остатки, дедлайны и вылеты — как в U-ON, плюс воронка.'],
 ['leads','2 · Воронка продаж вместо amoCRM — с подсказкой следующего действия.'],
 ['pick','3 · Подборка туров из Турвизора и Кви-Кво — клиенту в WhatsApp.'],
 ['orders','4 · Заявки на туры: договор, оплаты, туроператор, дедлайн.'],
 ['contract','5 · Договор собирается сам и подписывается кодом — без оплаты за подпись.'],
 ['form','6 · Клиент заполняет паспорт по ссылке и подписывает.'],
 ['pay','7 · Оплаты туристов и туроператорам.'],
 ['rop','8 · Контроль РОПа.'],
 ['integr','9 · Что заменяем и что подключаем.'],
 ['costs','10 · Расходы: было ≈256 тыс. в месяц — станет в разы меньше.'],
 ['launch','11 · Стоимость: 2 млн один раз, 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
