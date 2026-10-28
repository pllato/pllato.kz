/* Остатки по размерам */
SC.stock=()=>`<div class="hd"><div><h2>Остатки по размерам</h2><p>Каждая модель — сеткой размеров по магазинам. Сразу видно «дыры» в ходовых размерах и где пара лежит: в Алматы или в Астане. Красным — ходовой размер закончился, жёлтым — осталась одна пара.</p></div>${shopSw()}</div>
 <div class="pan"><div class="tw"><table class="t shgrid"><thead><tr><th>Модель</th>${SZ.map(z=>`<th class="r">${z}</th>`).join('')}<th class="r">Всего</th><th class="r">Цена</th></tr></thead><tbody>${MD.map(m=>`<tr><td><b>${m.n}</b><br><small class="mono mut">${m.sku}</small></td>${SZ.map((z,i)=>{const q=qty(m,i);return `<td class="r ${q===0&&(m.a[i]+m.s[i]===0)?'':q===0?'z0':q===1?'z1':''}">${q||'·'}</td>`}).join('')}<td class="r"><b>${tot(m)}</b></td><td class="r">${tg(m.pr)}</td></tr>`).join('')}</tbody></table></div>
 <div class="dpleg"><span><i class="dpdot block"></i>в этом магазине нет, в другом есть</span><span><i class="dpdot debt"></i>осталась 1 пара</span></div></div>
 ${tip('Заказ поставщику','Система считает, сколько пар каждого размера продаётся в неделю, и предлагает заказ: «Челси 39 — 6 пар, 40 — 4 пары». Заказ уходит поставщику из системы.')}
 ${said('Складской учёт через МойСклад; из Retail CRM не все данные переводились, большие разницы','Один учёт: касса, Kaspi и чаты списывают из одних остатков — разниц нет.')}`;

/* Приход и перемещения */
let MV=[['П-0412','Приход','Поставщик «Обувь-Опт» → Алматы','Зима · 148 пар','Принят'],['Т-0207','Перемещение','Алматы → Астана','Челси ШГ-2041 · 39, 40 · 4 пары','В пути'],['Т-0206','Перемещение','Астана → Алматы','Кроссовки ШГ-2057 · 43 · 1 пара','Создан'],['В-0031','Возврат','Клиент → Алматы','Лоферы ШГ-2063 · 42 · брак','Принят']];
SC.move=()=>`<div class="hd"><div><h2>Приход и перемещения</h2><p>Приход от поставщика с себестоимостью, перемещения между Алматы и Астаной, возвраты от клиентов. Каждый документ меняет остатки и себестоимость — финансы считаются верно.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Документ</th><th>Тип</th><th>Откуда → куда</th><th>Что</th><th>Статус</th><th></th></tr></thead><tbody>${MV.map((r,i)=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${tag(r[4],r[4]==='Принят'?'ok':r[4]==='В пути'?'info':'warn')}</td><td>${r[4]!=='Принят'?`<button class="bt p sm" onclick="mvNext(${i})">${r[4]==='Создан'?'Отправить':'Принять'}</button>`:''}</td></tr>`).join('')}</tbody></table></div>
 <div style="margin-top:10px"><button class="bt" onclick="act('Новый приход: поставщик, модели, размеры, количество, себестоимость. Можно загрузить накладную Excel.')">+ Приход</button></div></div>`;
function mvNext(i){const r=MV[i];r[4]=r[4]==='Создан'?'В пути':'Принят';toast(`${r[0]}: «${r[4]}».`+(r[4]==='Принят'?' Остатки обновлены в обоих магазинах и на Kaspi.':''));render()}

/* Инвентаризация */
let INV={done:186,all:214,diff:[['ШГ-2057 · Кроссовки · 42','2','0','недостача 2'],['ШГ-2072 · Кеды · 37','3','4','излишек 1']]};
SC.inv=()=>`<div class="hd"><div><h2>Инвентаризация с QR</h2><p>Каждая коробка — с QR-этикеткой: модель, цвет, размер. Двое-трое сотрудников одновременно сканируют телефонами свои стеллажи, система сама сводит результат и показывает расхождения. Магазин не закрывается на день.</p></div></div>
 <div class="wid"><div><small>Отсканировано · Алматы</small><b class="a">${INV.done} из ${INV.all}</b><span>3 сотрудника · 42 минуты</span></div><div><small>Расхождений</small><b>${INV.diff.length}</b><span>на ${tg(61800)}</span></div><div><small>Последняя полная</small><b>01.10</b><span>Астана — 03.10</span></div></div>
 <div class="g2 g21"><div class="pan"><h3>Расхождения</h3><div class="tw"><table class="t"><thead><tr><th>Позиция</th><th class="r">По учёту</th><th class="r">Факт</th><th>Итог</th></tr></thead><tbody>${INV.diff.map(r=>`<tr><td><b>${r[0]}</b></td><td class="r">${r[1]}</td><td class="r">${r[2]}</td><td>${tag(r[3],r[3].startsWith('недостача')?'bad':'warn')}</td></tr>`).join('')}</tbody></table></div>
  <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="bt p" onclick="invScan()">Сканировать коробку</button><button class="bt" onclick="act('Акт инвентаризации собран: расхождения, кто сканировал, подпись. Остатки исправлены.')">Закрыть инвентаризацию</button></div></div>
 <div class="pan"><h3>QR-этикетка</h3><div class="shqr"><div class="shqrc">${Array.from({length:49},(_,i)=>`<i class="${[0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48,10,16,24,30,38,18,22,26,32].includes(i)?'on':''}"></i>`).join('')}</div><div><b>ШГ-2041 · Челси</b><span>чёрные · кожа · 39</span><span class="mono">42 900 ₸</span></div></div>
 <button class="bt" style="margin-top:10px" onclick="act('Печать этикеток для прихода П-0412: 148 штук на термопринтере.')">Печать этикеток</button></div></div>
 ${said('Инвентаризацию сделаем, QR-коды, если нужны','В МиксБьюти 3–4 человека одновременно делают инвентаризацию — так же сделаем у вас.')}`;
function invScan(){if(INV.done>=INV.all){toast('Всё отсканировано.');return}INV.done++;toast(`Отсканировано: ШГ-2041 · Челси · 39. ${INV.done} из ${INV.all}.`);render()}

/* Переход */
SC.migr=()=>`<div class="hd"><div><h2>Переход с МойСклад</h2><p>Переносим всё, что есть: модели и размеры, остатки по магазинам, себестоимость, клиентов и историю продаж. Работаете в МойСклад до дня переключения, потом — в новой системе. Сверяем остатки до и после.</p></div></div>
 <div class="dpflow">${['Выгрузка из МойСклад','Перенос моделей, размеров, цен','Остатки и себестоимость','Клиенты и история продаж','Сверка и переключение'].map((x,i)=>`<div><small>${i+1}</small><b>${x}</b></div>`).join('')}</div>
 <div class="g2"><div class="pan"><h3>Что переносим</h3>${[['Моделей и размеров','≈ 1 900 позиций'],['Остатки','оба магазина'],['Клиенты','с телефонами и покупками'],['История продаж','за 12 месяцев']].map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>От чего отказываетесь</h3><div class="kv"><span>МойСклад</span><b>не нужен</b></div><div class="kv"><span>Retail CRM, Битрикс, amoCRM</span><b>не нужны</b></div><div class="kv"><span>Power BI</span><b>отчёты внутри системы</b></div></div></div>
 ${said('До этого работали через Retail CRM — поняли, что складской учёт через МойСклад; смотрели Битрикс','Всё в одном окне: CRM, склад, касса, финансы и пульт — без мешанины программ.')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и этапы</h2><p>Стандартный пакет разработки и касса отдельным модулем. Система ваша: код, сервер и данные у вас, без абонплаты за пользователей и магазины.</p></div></div>
 <div class="pk1"><div><small>Пакет + касса</small><b>2 000 000 ₸</b><span>стандартный пакет 1 800 000 ₸ + касса 200 000 ₸</span></div><div><small>Срок</small><b>4–6 недель</b><span>первая версия через 10 дней</span></div></div>
 <div class="pay3"><div><small>1 · Старт · 10%</small><b>200 000 ₸</b><span>договорились — начинаем, выгружаем МойСклад</span></div><div><small>2 · Ядро · 45%</small><b>900 000 ₸</b><span>чаты, воронка, склад, касса работают на сервере — вы утвердили</span></div><div><small>3 · Полировка и сдача · 45%</small><b>900 000 ₸</b><span>лояльность, инвентаризация, отчёты, Kaspi; код и ключи — ваши</span></div></div>
 <div class="g2"><div class="pan"><h3>Входит</h3>${['WhatsApp, Instagram, звонки — одна лента','Воронка, клиенты, программа лояльности','Остатки по размерам, приход, перемещения','Инвентаризация с QR и этикетки','Kaspi-магазин: заказы и остатки','Финансы, реклама и креативы, пульт','Перенос из МойСклад, 3 месяца сопровождения'].map(x=>`<div class="kv"><span>${x}</span><b>✓</b></div>`).join('')}</div>
 <div class="pan"><h3>Отдельно</h3><div class="kv"><span>WhatsApp (Green API)</span><b>≈ 5 000 ₸ в месяц вместо 36 000</b></div><div class="kv"><span>Сервер</span><b>≈ 15–30 $ в месяц</b></div><div class="kv"><span>Моноблоки для касс</span><b>покупаете сами</b></div><div class="kv"><span>Доработки после сдачи</span><b>20 $ в час</b></div></div></div>
 ${tip('Работаем вместе','Каждую неделю — 1–2 зума: показываем новую версию, вы принимаете или правите. В пакете запас 10–15 % на то, что всплывёт по ходу.')}`;

/* Каркас */
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const m=MD.find(x=>(x.sku+x.n).toLowerCase().includes(v));if(m&&v&&allowed('stock')){go('stock');toast(`${m.n}: всего ${tot(m)} пар.`);return}const c=CL.find(x=>(x[0]+x[1]).toLowerCase().includes(v));if(c&&v&&allowed('clients')){go('clients');card('cl',c[0]);return}toast('Ищите по модели, артикулу или клиенту: «челси», «ШГ-2057», «Асель».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">ШАГОМ</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='inbox'?'<em>'+INB.filter(r=>r[5]).length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['inbox','Чаты'],['pos','Касса'],['stock','Остатки'],['funnel','Заявки'],['inv','Инвент.']].filter(x=>allowed(x[0])).slice(0,5).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'ШАГОМ';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт собственников: выручка, чаты, покупки, прибыль.'],
 ['inbox','2 · WhatsApp, Instagram и звонки — одна лента, с креативом.'],
 ['funnel','3 · Из чата в покупку: размер, резерв, оплата, выдача.'],
 ['stock','4 · Остатки сеткой размеров по магазинам.'],
 ['pos','5 · Касса на моноблоке: QR, бонусы, Kaspi QR.'],
 ['inv','6 · Инвентаризация с QR — несколько человек сразу.'],
 ['loyal','7 · Программа лояльности в кассе и чатах.'],
 ['money','8 · Прибыль, движение денег, платежи поставщикам.'],
 ['launch','9 · 2 000 000 ₸ с кассой, 4–6 недель.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
