
/* ===== Карточки ===== */
const CARD={};
CARD.slot=id=>{const s=SLOTS.find(x=>x.id===id);const tr=TR(s.tr);
 return [`${s.t} · ${esc(SVC[s.k].n)}`,`${esc(AR(s.ar).n)} · ${esc(tr.n)} · запись: ${SRCN[s.src]}`,`<div class="pan"><h3>${esc(slotWho(s))}</h3>${[['Статус',SO(s.st).n],['Длительность',SVC[s.k].d+' мин'],['Всадников',riders(s)],['Сумма',s.w?tg(slotSum(s))+' · '+esc(s.w.paid):'по абонементу'],['Телефон',s.w?esc(s.w.ph):esc(CL(s.cl||s.g[0]).ph)]].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Лошади</h3>${s.h.map(x=>{const h=HO(x);return `<div class="kv"><span>${horseChip(x)} ${esc(h.br)}</span><b>${hLoad(x)} из ${h.max} сегодня</b></div>`}).join('')}</div>
 <div class="btns" style="justify-content:flex-start">${s.st==='booked'||s.st==='in'?`<button class="bt g" onclick="mark('${s.id}','done');closeM()">Пришли</button><button class="bt" onclick="mark('${s.id}','noshow');closeM()">Не пришёл</button><button class="bt w" onclick="cancelSlot('${s.id}')">Отменить</button>`:''}${s.cl?`<button class="bt" onclick="closeM();openCl('${s.cl}')">Карточка всадника</button>`:''}</div>`]};
function cancelSlot(id){const s=SLOTS.find(x=>x.id===id);s.st='cancel';closeM();render();const w=WAIT.find(x=>x.d===TODAY);toast(`Запись в ${s.t} отменена, лошади освободились.${w?'':' Место ушло в приложение — его увидят всадники своего уровня.'}`)}
CARD.newslot=x=>{const [ar,t,cl]=(x||'A1|16:00').split('|');const c=CL(cl||'C09');const hs=freeHorses(t,60,['beg','mid','pro']);
 return ['Новая запись',`${esc(AR(ar).n)} · сегодня, ${t}`,`<div class="form"><label>Всадник<select id="ns_c">${CLIENTS.map(x=>`<option value="${x.id}" ${x.id===c.id?'selected':''}>${esc(x.n)} · ${LVL[x.lvl].n} · осталось ${x.left}</option>`).join('')}</select></label>
 <label>Занятие<select id="ns_k">${['ind','grp','kid'].map(k=>`<option value="${k}">${SVC[k].n}</option>`).join('')}</select></label>
 <label>Время<select id="ns_t">${HOURS.map(h=>`<option ${h===t?'selected':''}>${h}</option>`).join('')}</select></label>
 <label>Лошадь<select id="ns_h">${hs.map(h=>`<option value="${h.id}">${esc(h.n)} · ${LVL[h.lvl].n} · ${hLoad(h.id)}/${h.max}</option>`).join('')||'<option value="">нет свободных — в очередь</option>'}</select></label>
 <label>Тренер<select id="ns_tr">${TRAINERS.map(r=>`<option value="${r.id}">${esc(r.n)}</option>`).join('')}</select></label>
 <input type="hidden" id="ns_a" value="${ar}"></div><p class="mini">В списке — только свободные лошади, у которых не исчерпан предел на сегодня.</p><div class="btns" style="justify-content:flex-start;margin-top:10px"><button class="bt p" onclick="newSlot()">Записать</button></div>`]};
function newSlot(){const v=i=>document.getElementById(i).value;const h=v('ns_h');const c=CL(v('ns_c'));if(!h){WAIT.push({id:'W'+(WAIT.length+20),cl:c.id,d:TODAY,t:v('ns_t'),k:v('ns_k'),want:'любая',since:dd(TODAY)+' '+NOW,src:'admin'});closeM();render();toast('Свободных лошадей нет — всадник поставлен в лист ожидания.');return}
 if(busyAt(h,v('ns_t'),60)){toast('Эта лошадь в это время уже занята.');return}
 SKN++;SLOTS.push({id:'S'+SKN,t:v('ns_t'),k:v('ns_k'),cl:c.id,h:[h],tr:v('ns_tr'),ar:v('ns_a'),st:'booked',src:'admin'});SLOTS.sort((a,b)=>tm(a.t)-tm(b.t));closeM();render();toast(`${esc(c.n)} записан(а) на ${v('ns_t')}, лошадь ${esc(HO(h).n)}. Уведомление ушло в приложение.`)}
CARD.sell=id=>{const c=CL(id);return ['Продажа абонемента',`${esc(c.n)} · сейчас: ${esc(SUBT[c.sub].n)}, осталось ${c.left}`,`<div class="form"><label>Абонемент<select id="sl_t">${Object.entries(SUBT).map(([k,s])=>`<option value="${k}" ${k===c.sub?'selected':''}>${esc(s.n)} · ${tg(s.p)} · ${s.days} дн.</option>`).join('')}</select></label><label>Оплата<select id="sl_m"><option>Kaspi</option><option>Карта</option><option>Наличные</option><option>Перевод</option></select></label></div><p class="mini">Остаток старого абонемента переносится, если продление до его окончания.</p><div class="btns" style="justify-content:flex-start;margin-top:10px"><button class="bt p" onclick="sellSub('${c.id}')">Оплачено</button><button class="bt" onclick="closeM();toast('Ссылка на оплату Kaspi отправлена — абонемент продлится сам после оплаты.')">Отправить ссылку</button></div>`]};
CARD.newcl=()=>['Новый всадник','Карточка, абонемент, договор',`<div class="form"><label>ФИО<input id="nc_n" value="Акерке Сулейменова"></label><label>Телефон<input id="nc_p" value="+7 701 920 18 44"></label><label>Уровень<select id="nc_l">${Object.entries(LVL).map(([k,v])=>`<option value="${k}" ${k==='beg'?'selected':''}>${v.n}</option>`).join('')}</select></label><label>Тренер<select id="nc_t">${TRAINERS.map(r=>`<option value="${r.id}" ${r.id==='T2'?'selected':''}>${esc(r.n)}</option>`).join('')}</select></label></div><div class="btns" style="justify-content:flex-start;margin-top:10px"><button class="bt p" onclick="newCl()">Создать и отправить договор</button></div>`];
function newCl(){const v=i=>document.getElementById(i).value;const id='C'+(CLIENTS.length+1);CLIENTS.unshift({id,n:v('nc_n'),ph:v('nc_p'),lvl:v('nc_l'),tr:v('nc_t'),sub:'S4',left:4,to:addDays(TODAY,30),since:TODAY,visits:0,last:'—',src:'Таргет',horse:'H03',sign:false});closeM();cliF='all';render();toast('Всадник создан. Договор и ссылка на приложение ушли в WhatsApp.')}
CARD.newlead=()=>['Новая заявка','Источник и интерес',`<div class="form"><label>Имя<input id="nl_n" value="Аружан Касымова"></label><label>Источник<select id="nl_s">${Object.keys(SRC).map(s=>`<option>${s}</option>`).join('')}</select></label><label>Что хочет<input id="nl_w" value="Прогулка на двоих в субботу"></label></div><div class="btns" style="justify-content:flex-start;margin-top:10px"><button class="bt p" onclick="newLead()">Добавить</button></div>`];
function newLead(){const v=i=>document.getElementById(i).value;LEADS.unshift({id:'L'+(LEADS.length+20),n:v('nl_n'),ph:'',src:v('nl_s'),want:v('nl_w'),st:'new',d:dd(TODAY)+' '+NOW,mgr:'AI'});closeM();render();toast('Заявка добавлена — администратору ушло уведомление.')}
CARD.contract=i=>{const c=CONTRACTS[i];const cl=CL(c.cl);return [`Договор ${c.no}`,esc(c.what),`<div class="doc"><div class="dh"><b>ALMATY HILLS</b><span>конноспортивный клуб · Алматы</span></div><h4>${esc(c.what)}</h4><p>г. Алматы, ${dl(c.d)}</p><p>Клуб оказывает услуги по обучению верховой езде и прокату лошадей, а ${esc(cl.n)} оплачивает их по выбранному абонементу. Всадник подтверждает, что ознакомлен с правилами клуба и техникой безопасности и принимает риски верховой езды.</p><div class="sgn"><span>Клуб: подписано</span><span>${esc(cl.n)}: ${esc(c.sign||'ждёт подписи')}</span></div></div>`]};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(k){const M={import:'Перенос из Fitbase: всадники, абонементы с остатками, история посещений, тренеры. Обе системы работают параллельно неделю.'};toast(M[k]||'Готово.')}
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();const c=CLIENTS.find(x=>(x.n+' '+x.ph).toLowerCase().includes(q));if(c&&allowed('client')){openCl(c.id);return}const h=HORSES.find(x=>x.n.toLowerCase().includes(q));if(h&&allowed('horse')){openHorse(h.id);return}toast('Не найдено. Попробуйте: «Асем», «Ласточка», «+7 701».')}

/* ===== Каркас: дерево разделов слева, лента условий дня сверху ===== */
const ICON={day:'<path d="M3 12h3M18 12h3M12 3v3M12 18v3"/><circle cx="12" cy="12" r="4"/>',cli:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 3.6-6 7-6s6 2 7 6"/>',stab:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10M10 20v-6h4v6"/>',sale:'<path d="M4 6h16l-2 9H6z"/><circle cx="9" cy="19" r="1.5"/><circle cx="16" cy="19" r="1.5"/>',money:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/>',app:'<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',glamp:'<path d="M3 20L12 5l9 15z"/><path d="M12 20v-6"/>',sys:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>'};
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('')+`<div class="role cli" onclick="enterApp()"><div class="rav">АК</div><div><b>Всадник · приложение</b><span>Асем Каримова · запись, очередь, абонемент в телефоне</span></div></div>`;
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function enterApp(){cur='app';appTab='book';enter('Руководитель')}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
function buildRail(){const cnt={today:SLOTS.filter(s=>s.st==='booked').length,wait:WAIT.length,leads:LEADS.filter(l=>l.st==='new').length,vet:VETS.filter(v=>v.st==='plan'&&v.d<=addDays(TODAY,3)).length,contracts:CONTRACTS.filter(c=>c.st!=='signed').length,subs:CLIENTS.filter(c=>subSt(c)!=='действует').length};
 document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<div class="tg ${s.k===SECOF[cur]?'on':''}"><div class="tgh"><svg viewBox="0 0 24 24">${ICON[s.k]}</svg>${s.n}</div>${s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="ri ${x[0]===cur?'on':''}" onclick="go('${x[0]}')"><span>${esc(x[1])}</span>${cnt[x[0]]?`<em>${cnt[x[0]]}</em>`:''}</a>`).join('')}</div>`).join('')}
function buildSub(){}
function buildRibbon(){const el=document.getElementById('ribbon');if(!el)return;const inW=HORSES.filter(h=>h.st==='work').length;
 el.innerHTML=[['Сб, 31 октября','10:40'],['Погода','+7°, ясно, без ветра'],['Крытый манеж','открыт'],['Тропа','открыта до 17:00'],['Лошадей в работе',inW+' из '+HORSES.length],['Левада 2','откроется 7 ноября']].map(x=>`<span><small>${x[0]}</small><b>${x[1]}</b></span>`).join('')}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.today;document.getElementById('ttl').textContent=SUBN[cur]||'Almaty Hills';const cr=document.getElementById('crumb');if(cr)cr.textContent=(SEC.find(s=>s.k===SECOF[cur])||{n:''}).n;document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();buildRibbon();
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('sched')&&role!=='Конюх'?'':'none';try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}

const TOUR=[
 ['today','1 · Пульт дня: кто в седле, кто следующий, какие лошади отработали и что требует решения.'],
 ['sched','2 · Расписание манежей: одна сетка для приложения, ресепшн и тренеров. Запись открывается за 7 дней — для всех одинаково.'],
 ['walks','3 · Прогулка для компании: заказчик и количество гостей — без виртуальных клиентов. Лошади подбираются сами.'],
 ['app','4 · Приложение для клиентов: запись, прогулки для гостей, очередь, абонемент, уведомления.'],
 ['wait','5 · Лист ожидания: кто-то отменил — первому в очереди уходит предложение.'],
 ['horses','6 · Конюшня: у каждой лошади предел занятий в день, ковка, прививки. На отдыхе — не попадает в запись.'],
 ['client','7 · Карточка всадника: абонемент, уровень, тренер, заметки, договор.'],
 ['subs','8 · Абонементы и стоп-продажа до открытия Левады 2.'],
 ['leads','9 · Заявки из таргета и Instagram — к весеннему потоку ×2.'],
 ['wa','10 · WhatsApp в одном окне через Green-API: ≈ 5 000 ₸ вместо 36 000 ₸ в месяц.'],
 ['contracts','11 · Договор — подпись по ссылке с телефона.'],
 ['pay','12 · Зарплата тренеров по процентам — из отметок «пришли».'],
 ['dash','13 · Отчёт собственника — каждый вечер в WhatsApp.'],
 ['move','14 · Переезд с Fitbase: забираем плюсы, убираем минусы. За 3 года дешевле.'],
 ['launch','15 · Стоимость: портал 2 000 000 ₸ + приложение 500 000 ₸, оплата 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается: запись, прогулка, очередь, лошади, абонементы, договоры, зарплаты.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Руководитель');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
