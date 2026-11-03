/* ТАУАР — опт и розница одежды и чулочно-носочных изделий (Нурсултан, Актобе), замена Umag.
   Демо-макет на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(Math.round(n/100000)/10).toString().replace('.',',')+' млн';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};
const TODAY='2026-11-03',NOW='13:40';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const bar=(w,c)=>`<div class="bar"><i class="${c||''}" style="--w:${Math.max(2,Math.min(100,w))}%"></i></div>`;

const SEC=[
 {k:'day',n:'Сегодня',sub:[['today','Пульт владельца']]},
 {k:'sale',n:'Продажи',sub:[['pos','Касса · розница'],['opt','Оптовый заказ'],['orders','Заказы WhatsApp и Kaspi'],['returns','Возвраты']]},
 {k:'goods',n:'Товар',sub:[['catalog','Товары и фото'],['packs','Упаковки и поштучно'],['surch','Надбавки к товару'],['income','Оприходование'],['stock','Склады и остатки'],['inv','Ревизия']]},
 {k:'cli',n:'Клиенты',sub:[['clients','Оптовые клиенты'],['debts','Долги и отсрочка'],['prices','Цены: опт и розница']]},
 {k:'money',n:'Деньги',sub:[['sellers','Продавцы и проценты'],['profit','Прибыль по товарам'],['reports','Отчёты']]},
 {k:'sys',n:'Система',sub:[['migrate','Переезд с Umag'],['roles','Роли и права'],['launch','Запуск и стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Владелец':{av:'НС',n:'Нурсултан',note:'Всё: продажи, склад, клиенты, деньги, проценты продавцов',s:ALL.slice()},
 'Совладелец':{av:'АС',n:'сестра · партнёр',note:'Те же данные — решения принимаете вдвоём',s:ALL.slice()},
 'Продавец':{av:'ГЛ',n:'Гульнара · розница',note:'Касса, возвраты, остатки и фото товара, свой процент',s:['pos','returns','catalog','stock','sellers']},
 'Оптовый менеджер':{av:'ЕР',n:'Ерлан · опт',note:'Оптовые заказы, WhatsApp и Kaspi, клиенты, долги',s:['opt','orders','clients','debts','prices','catalog','stock']},
 'Кладовщик':{av:'ДН',n:'Данияр · склад',note:'Оприходование, упаковки, остатки, ревизия',s:['income','packs','stock','inv','catalog']},
 'Бухгалтер':{av:'СВ',n:'Светлана',note:'Отчёты, прибыль, долги, проценты продавцов',s:['reports','profit','debts','sellers']}
};
let role='Владелец',cur='today';

/* ===== Товары ===== pk — штук в упаковке; opt — цена упаковки оптом; rt — цена штуки в розницу;
   sur — надбавка за штуку при покупке меньше упаковки (привязана к товару) */
let GOODS=[
 {id:'10234',n:'Носки мужские хлопок, чёрные',cat:'Носки',pk:5,cost:180,opt:1250,rt:350,sur:50,st:{M:420,S:38},h:220,sold:96,surQ:41},
 {id:'10235',n:'Носки мужские хлопок, серые',cat:'Носки',pk:5,cost:180,opt:1250,rt:350,sur:50,st:{M:310,S:24},h:210,sold:72,surQ:30},
 {id:'11402',n:'Носки женские укороченные, белые',cat:'Носки',pk:10,cost:120,opt:1600,rt:250,sur:30,st:{M:880,S:64},h:40,sold:154,surQ:88},
 {id:'12011',n:'Колготки женские 40 ден',cat:'Колготки',pk:5,cost:420,opt:2600,rt:790,sur:100,st:{M:260,S:31},h:330,sold:58,surQ:22},
 {id:'12077',n:'Колготки детские хлопок',cat:'Колготки',pk:3,cost:510,opt:1950,rt:890,sur:80,st:{M:190,S:18},h:150,sold:41,surQ:12},
 {id:'13350',n:'Носки термо зимние',cat:'Носки',pk:3,cost:640,opt:2400,rt:1190,sur:120,st:{M:140,S:22},h:20,sold:63,surQ:29},
 {id:'14018',n:'Футболка базовая хлопок',cat:'Одежда',pk:1,cost:1450,opt:2300,rt:3490,sur:0,st:{M:120,S:16},h:190,sold:23,surQ:0},
 {id:'14102',n:'Трусы мужские боксеры',cat:'Бельё',pk:3,cost:690,opt:2600,rt:1290,sur:90,st:{M:230,S:27},h:0,sold:48,surQ:17},
 {id:'15009',n:'Следки капрон',cat:'Носки',pk:10,cost:60,opt:850,rt:150,sur:20,st:{M:1200,S:90},h:350,sold:210,surQ:140},
 {id:'16021',n:'Пижама женская фланель',cat:'Одежда',pk:1,cost:3900,opt:5800,rt:8900,sur:0,st:{M:44,S:6},h:300,sold:9,surQ:0}
];
const GO=id=>GOODS.find(g=>g.id===id)||GOODS[0];
const STORES={M:'Склад · опт',S:'Магазин · розница'};
let curG='10234';

/* ===== Клиенты опт ===== */
let CLIENTS=[
 {n:'ИП «Алтын» · рынок Шанхай',city:'Актобе',ph:'+7 701 412 18 30',tier:'Крупный опт',sum:4820000,debt:380000,days:14,last:'02.11'},
 {n:'Магазин «Семья»',city:'Хромтау',ph:'+7 777 230 44 19',tier:'Опт',sum:1960000,debt:0,days:7,last:'30.10'},
 {n:'ИП Сарсенова',city:'Кандыагаш',ph:'+7 705 118 72 04',tier:'Опт',sum:1240000,debt:215000,days:7,last:'28.10',late:true},
 {n:'ТОО «Детский мир Запад»',city:'Уральск',ph:'+7 702 455 61 20',tier:'Крупный опт',sum:6110000,debt:920000,days:21,last:'01.11'},
 {n:'Точка на базаре · Айгерим',city:'Актобе',ph:'+7 708 320 15 77',tier:'Мелкий опт',sum:640000,debt:0,days:0,last:'03.11'}
];
const TIERS={'Мелкий опт':[0,'от 5 упаковок'],'Опт':[5,'от 20 упаковок, −5%'],'Крупный опт':[10,'от 100 упаковок, −10%']};

/* ===== Продавцы ===== */
let SELLERS=[
 {n:'Гульнара',where:'Магазин',rate:2,fact:1840000,chk:412},{n:'Айжан',where:'Магазин',rate:2,fact:1520000,chk:356},
 {n:'Ерлан',where:'Опт',rate:1,fact:8640000,chk:94},{n:'Бекзат',where:'Опт',rate:1,fact:5210000,chk:61}
];

/* ===== Заказы ===== */
const OST=[['new','Новый'],['pick','Собирается'],['ready','Собран'],['sent','Отправлен'],['done','Оплачен']];
let ORDERS=[
 {id:'WA-2211',ch:'WhatsApp',who:'Магазин «Семья», Хромтау',sum:186000,items:'носки муж. 40 уп., следки 30 уп.',st:'new'},
 {id:'WA-2210',ch:'WhatsApp',who:'ИП Сарсенова',sum:94500,items:'колготки 40 ден 25 уп., термо 12 уп.',st:'pick'},
 {id:'K-88123',ch:'Kaspi',who:'Kaspi · Мадина Т.',sum:2400,items:'носки термо, 1 уп.',st:'new'},
 {id:'WA-2207',ch:'WhatsApp',who:'ТОО «Детский мир Запад»',sum:612000,items:'колготки детские 180 уп., пижамы 40 шт',st:'ready'},
 {id:'WA-2201',ch:'WhatsApp',who:'ИП «Алтын»',sum:325000,items:'ассорти носков 260 уп.',st:'sent'}
];
const ISALES={M:[1180000,9],S:[214000,61]};

const SC={};
const ph=g=>{const h=(+g.id*47)%360;const sock=g.cat==='Носки'||g.cat==='Колготки';return `<div class="gph" style="--h:${g.h}"><svg viewBox="0 0 40 40">${sock?'<path d="M14 4h10v16l8 6c3 2 2 8-3 8h-9c-4 0-6-3-6-6z" fill="currentColor"/>':'<path d="M10 8l6-3h8l6 3 5 6-5 3-2-2v20H12V15l-2 2-5-3z" fill="currentColor"/>'}</svg></div>`};

/* ===== Пульт ===== */
SC.today=()=>{const sur=GOODS.reduce((a,g)=>a+g.sur*g.surQ,0);const debt=CLIENTS.reduce((a,c)=>a+c.debt,0);
 return `<div class="hd"><div><h2>Вторник, 3 ноября</h2><p>Опт и розница в одной системе: всё, что вы делаете в Umag, плюс три вещи, которых там нет, — продажа штучно из упаковки, надбавка, привязанная к товару, и проценты продавцам.</p></div><div class="btns"><button class="bt" onclick="go('opt')">Оптовый заказ</button><button class="bt p" onclick="go('pos')">Касса</button></div></div>
 <div class="kpi"><div><small>Опт сегодня</small><b>${tg(ISALES.M[0])}</b><span>${ISALES.M[1]} заказов</span></div><div><small>Розница сегодня</small><b>${tg(ISALES.S[0])}</b><span>${ISALES.S[1]} чеков</span></div><div><small>Надбавки за октябрь</small><b class="y">${tg(sur)}</b><span>доп. прибыль по товарам</span></div><div><small>Долги оптовиков</small><b class="r">${tg(debt)}</b><span>${CLIENTS.filter(c=>c.debt).length} клиента</span></div><div><small>Заказов в WhatsApp</small><b>${ORDERS.filter(o=>o.st==='new').length} новых</b><span>и Kaspi</span></div></div>
 <div class="g2"><div class="pan"><h3>Что требует внимания</h3>
  <div class="al r" onclick="go('debts')"><b>ИП Сарсенова просрочила оплату</b><span>215 000 ₸, отсрочка 7 дней закончилась 31.10. Новый заказ — только после оплаты.</span></div>
  <div class="al w" onclick="go('stock')"><b>Заканчиваются в магазине</b><span>${GOODS.filter(g=>g.st.S<25).map(g=>esc(g.n.split(',')[0])).slice(0,3).join(', ')} — перенести со склада опта.</span></div>
  <div class="al i" onclick="go('orders')"><b>Новый заказ в WhatsApp</b><span>Магазин «Семья», Хромтау — 186 000 ₸. Собрать сегодня.</span></div>
  <div class="al i" onclick="go('income')"><b>Приход ждёт оприходования</b><span>Поставщик «Текстиль-Иваново»: 64 позиции, 1 920 упаковок.</span></div></div>
 <div class="pan"><h3>Лучшие по надбавкам</h3><p>Сколько дополнительной прибыли принесла продажа поштучно — по каждому товару, а не «универсальным продуктом».</p>${GOODS.filter(g=>g.sur).sort((a,b)=>b.sur*b.surQ-a.sur*a.surQ).slice(0,5).map(g=>`<div class="hl" onclick="curG='${g.id}';go('surch')"><span>${esc(g.n.split(',')[0])}</span>${bar(pct(g.sur*g.surQ,4200),'y')}<b>${tg(g.sur*g.surQ)}</b></div>`).join('')}</div></div>
 ${said('«Фото, универсальный продукт и проценты. Остальное всё как в Umag.»','Всё, что есть в Umag, переносим, а эти три вещи делаем как надо: фото у каждого товара, надбавка привязана к товару с отчётом по прибыли, проценты продавцов считаются сами.')}`};

/* ===== Касса розница ===== */
let CART=[],lastChk=null;
SC.pos=()=>{const sum=CART.reduce((a,c)=>a+c.p*c.q+c.s*c.q,0);
 return `<div class="hd"><div><h2>Касса · магазин</h2><p>Продавец сканирует штрихкод. Можно продать упаковкой или поштучно: при продаже поштучно система сама вскрывает упаковку на остатке и добавляет надбавку этого товара — отдельной строкой, чтобы было видно, сколько она принесла.</p></div></div>
 <div class="pos"><div class="pan"><h3>Товары</h3><div class="plist">${GOODS.map(g=>`<div class="pi">${ph(g)}<div><b>${esc(g.n)}</b><span>${g.id} · в упаковке ${g.pk} шт · в магазине ${g.st.S} шт</span></div><div class="pb">${g.pk>1?`<button onclick="addC('${g.id}','pk')">Упаковка<em>${tg(g.rt*g.pk)}</em></button>`:''}<button onclick="addC('${g.id}','pc')">${g.pk>1?'Штука':'Шт.'}<em>${tg(g.rt)}${g.sur?' + '+g.sur:''}</em></button></div></div>`).join('')}</div></div>
 <div class="pan cart"><h3>Чек</h3>${CART.map((c,i)=>`<div class="kv"><span>${esc(c.n)}<br><small class="mini">${c.q} × ${tg(c.p)}${c.s?` · надбавка ${tg(c.s)}/шт`:''}</small></span><b>${tg((c.p+c.s)*c.q)} <a class="x" onclick="CART.splice(${i},1);render()">×</a></b></div>`).join('')||'<p class="mini">Добавьте товар.</p>'}
  ${CART.length?`<div class="kv"><span>Из них надбавки</span><b class="y">${tg(CART.reduce((a,c)=>a+c.s*c.q,0))}</b></div><div class="tot"><span>К оплате</span><b>${tg(sum)}</b></div><div class="pays">${['Наличные','Карта','Kaspi QR'].map(m=>`<button onclick="payC('${m}')">${m}</button>`).join('')}</div>`:''}
  ${lastChk?`<div class="note ok">${lastChk}</div>`:''}</div></div>`};
function addC(id,k){const g=GO(id);const ex=CART.find(c=>c.id===id&&c.k===k);if(ex)ex.q++;else CART.push({id,k,n:g.n+(k==='pk'?' · упаковка':' · штучно'),p:k==='pk'?g.rt*g.pk:g.rt,s:k==='pc'&&g.pk>1?g.sur:0,q:1});lastChk=null;render()}
function payC(m){let op=0;CART.forEach(c=>{const g=GO(c.id);const n=c.k==='pk'?g.pk*c.q:c.q;if(c.k==='pc'&&g.pk>1&&g.st.S%g.pk<n)op++;g.st.S=Math.max(0,g.st.S-n);if(c.s)g.surQ+=c.q;g.sold++});const s=CART.reduce((a,c)=>a+(c.p+c.s)*c.q,0);ISALES.S[0]+=s;ISALES.S[1]++;lastChk=`<b>Чек пробит · ${m} · ${tg(s)}.</b> ${op?'Упаковка вскрыта автоматически. ':''}Надбавки записаны на товары, продавцу начислен процент.`;CART=[];render()}

/* ===== Оптовый заказ ===== */
let OPT={cl:0,lines:[['10234',40],['11402',30],['12011',25]]};
SC.opt=()=>{const c=CLIENTS[OPT.cl];const d=TIERS[c.tier][0];const rows=OPT.lines.map(([id,q])=>{const g=GO(id);return {g,q,p:Math.round(g.opt*(100-d)/100)}});const sum=rows.reduce((a,r)=>a+r.p*r.q,0);
 return `<div class="hd"><div><h2>Оптовый заказ</h2><p>Клиент — с его уровнем опта: цена считается сама по прайсу и скидке уровня. Видно его долг и отсрочку. Заказ собирается на складе, накладная — в WhatsApp клиенту.</p></div><div class="btns"><select class="rsel" onchange="OPT.cl=+this.value;render()">${CLIENTS.map((x,i)=>`<option value="${i}" ${i===OPT.cl?'selected':''}>${esc(x.n)}</option>`).join('')}</select></div></div>
 ${c.debt?`<div class="note ${c.late?'':'ok'}"><b>${c.late?'Просрочен долг':'Долг в пределах отсрочки'}: ${tg(c.debt)}</b> · отсрочка ${c.days} дн. ${c.late?'Отгрузка — только после оплаты или с разрешения владельца.':''}</div>`:''}
 <div class="tw"><table class="t"><thead><tr><th>Товар</th><th class="r">В упаковке</th><th class="r">Упаковок</th><th class="r">Цена упаковки</th><th class="r">Сумма</th><th class="r">На складе</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td><b>${esc(r.g.n)}</b><div class="mini">${r.g.id}</div></td><td class="r">${r.g.pk} шт</td><td class="r"><span class="stp"><button onclick="OPT.lines[${i}][1]=Math.max(1,OPT.lines[${i}][1]-5);render()">−</button><b>${r.q}</b><button onclick="OPT.lines[${i}][1]+=5;render()">+</button></span></td><td class="r mono">${tg(r.p)}${d?` <span class="mini">−${d}%</span>`:''}</td><td class="r mono">${tg(r.p*r.q)}</td><td class="r mono">${Math.floor(r.g.st.M/r.g.pk)} уп.</td></tr>`).join('')}<tr class="total"><td colspan="4">Итого · ${esc(c.tier)} (${TIERS[c.tier][1]})</td><td class="r">${tg(sum)}</td><td></td></tr></tbody></table></div>
 <div class="btns" style="justify-content:flex-start;margin-top:10px"><button class="bt p" onclick="ORDERS.unshift({id:'WA-'+(2212+ORDERS.length),ch:'WhatsApp',who:CLIENTS[OPT.cl].n,sum:${sum},items:'${rows.length} позиции',st:'pick'});toast('Заказ на ${tg(sum)} отправлен на сборку. Накладная ушла клиенту в WhatsApp, остаток зарезервирован.')">Отправить на сборку</button><button class="bt" onclick="OPT.lines.push(['15009',20]);render()">+ Следки, 20 уп.</button></div>`};

/* ===== Заказы ===== */
SC.orders=()=>`<div class="hd"><div><h2>Заказы WhatsApp и Kaspi</h2><p>Заказ из переписки WhatsApp менеджер оформляет в один клик; заказы Kaspi приходят сами. Все — в одной доске по стадиям, товар резервируется.</p></div></div>
 <div class="board">${OST.map(([k,n])=>{const L=ORDERS.filter(o=>o.st===k);return `<div class="bcol"><div class="bh"><b>${n}</b><span>${L.length}</span></div>${L.map(o=>`<div class="oc" onclick="advO('${o.id}')"><small>${o.id} · ${o.ch}</small><b>${esc(o.who)}</b><span>${esc(o.items)}</span><em>${tg(o.sum)}</em></div>`).join('')}</div>`}).join('')}</div><p class="mini">Нажмите на заказ — он перейдёт на следующую стадию.</p>`;
function advO(id){const o=ORDERS.find(x=>x.id===id);const k=OST.map(x=>x[0]);const i=k.indexOf(o.st);if(i<k.length-1)o.st=k[i+1];render();toast(`${o.id}: ${OST[k.indexOf(o.st)][1].toLowerCase()}.`)}

/* ===== Возвраты ===== */
SC.returns=()=>`<div class="hd"><div><h2>Возвраты</h2><p>По чеку или накладной: товар возвращается на остаток нужного склада, если был продан поштучно — штуками; надбавка по возвращённым штукам снимается с отчёта.</p></div><div class="btns"><button class="bt p" onclick="toast('Возврат по чеку № 5512: 2 шт. носков на остаток магазина, деньги — наличными.')">Возврат по чеку</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Документ</th><th>Кто</th><th>Что</th><th class="r">Сумма</th><th>Причина</th></tr></thead><tbody>${[['Чек № 5498','розница','Колготки 40 ден, 1 шт','890','не тот размер'],['Накл. № 3311','ИП «Алтын»','Носки термо, 6 уп.','14 400','брак, 2 пары'],['Чек № 5470','розница','Пижама фланель','8 900','передумала']].map(r=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="r mono">${r[3]} ₸</td><td>${r[4]}</td></tr>`).join('')}</tbody></table></div>`;

/* ===== Товары и фото ===== */
let catF='all';
SC.catalog=()=>{const g=GO(curG);const L=GOODS.filter(x=>catF==='all'||x.cat===catF);
 return `<div class="hd"><div><h2>Товары и фото</h2><p>У каждого товара — фото, код, который остаётся за ним навсегда (даже если производитель вернёт модель через 5 лет), упаковка и цены. На складе находите товар по фото, даже если не помните код. Около 10 000 позиций, 5–8 тысяч активных.</p></div><div class="btns"><button class="bt p" onclick="toast('Новый товар: фото с телефона, название, код, упаковка, цены опт и розница, надбавка.')">+ Товар</button></div></div>
 <div class="filt">${['all','Носки','Колготки','Бельё','Одежда'].map(c=>`<button class="${c===catF?'on':''}" onclick="catF='${c}';render()">${c==='all'?'Все':c} · ${GOODS.filter(x=>c==='all'||x.cat===c).length}</button>`).join('')}</div>
 <div class="ggrid">${L.map(x=>`<div class="gc ${x.id===curG?'on':''}" onclick="curG='${x.id}';render()">${ph(x)}<small>${x.id}</small><b>${esc(x.n)}</b><span>${x.pk>1?x.pk+' шт в упаковке':'поштучно'} · склад ${Math.floor(x.st.M/x.pk)} уп.</span></div>`).join('')}</div>
 <div class="pan"><h3>${esc(g.n)}</h3><div class="gcard">${ph(g)}<div>${[['Код',g.id+' · закреплён за товаром'],['Категория',g.cat],['В упаковке',g.pk+' шт'],['Себестоимость штуки',tg(g.cost)],['Опт · упаковка',tg(g.opt)],['Розница · штука',tg(g.rt)],['Надбавка при продаже штучно',g.sur?tg(g.sur)+' за шт':'нет'],['Остаток','склад '+g.st.M+' шт · магазин '+g.st.S+' шт']].map(k=>`<div class="kv"><span>${k[0]}</span><b>${k[1]}</b></div>`).join('')}</div></div></div>
 ${said('«Фотографии привязывать к товару… код не помню, но у меня 50 штук на складе — посмотрел по фото, сразу увидел.»')}`};

/* ===== Упаковки ===== */
let OPENLOG=[['03.11 12:14','Носки мужские хлопок, чёрные','1 уп. → 5 шт','касса, продажа 2 шт'],['03.11 11:02','Колготки женские 40 ден','1 уп. → 5 шт','касса, продажа 1 шт'],['02.11 18:40','Следки капрон','2 уп. → 20 шт','перенос в магазин']];
SC.packs=()=>`<div class="hd"><div><h2>Упаковки и поштучно</h2><p>Товар хранится в упаковках, а продаётся и упаковкой, и поштучно. Когда продаётся штука, а вскрытых упаковок нет, система сама «вскрывает» одну: −1 упаковка, +5 штук. Остаток всегда правильный — в упаковках и штуках.</p></div><div class="btns"><button class="bt p" onclick="OPENLOG.unshift(['03.11 '+NOW,'Носки термо зимние','1 уп. → 3 шт','вручную, на витрину']);render();toast('Упаковка вскрыта: −1 уп., +3 шт на остатке магазина.')">Вскрыть упаковку</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Товар</th><th class="r">В упаковке</th><th class="r">Склад, уп.</th><th class="r">Магазин: целых уп.</th><th class="r">Магазин: штук вскрыто</th></tr></thead><tbody>${GOODS.filter(g=>g.pk>1).map(g=>`<tr><td><b>${esc(g.n)}</b></td><td class="r">${g.pk}</td><td class="r mono">${Math.floor(g.st.M/g.pk)}</td><td class="r mono">${Math.floor(g.st.S/g.pk)}</td><td class="r mono">${g.st.S%g.pk}</td></tr>`).join('')}</tbody></table></div>
 <div class="pan"><h3>Журнал вскрытий</h3>${OPENLOG.map(l=>`<div class="kv"><span>${l[0]} · ${esc(l[1])}<br><small class="mini">${l[3]}</small></span><b>${l[2]}</b></div>`).join('')}</div>
 ${said('«Есть упаковками, есть эти упаковки делятся. Допустим, в пачке 5 штук — нужно по одной штуке это разделить.»')}`;

/* ===== Надбавки ===== */
SC.surch=()=>{const L=GOODS.filter(g=>g.pk>1).sort((a,b)=>b.sur*b.surQ-a.sur*a.surQ);const tot=L.reduce((a,g)=>a+g.sur*g.surQ,0);
 return `<div class="hd"><div><h2>Надбавки к товару</h2><p>Надбавка задаётся у каждого товара: если покупают меньше упаковки — к цене штуки добавляется своя сумма. Она привязана к товару, а не идёт «универсальным продуктом», поэтому видно, сколько дополнительной прибыли принёс каждый товар.</p></div></div>
 <div class="kpi"><div><small>Надбавки за октябрь</small><b class="y">${tg(tot)}</b><span>дополнительная прибыль</span></div><div><small>Штук продано поштучно</small><b>${L.reduce((a,g)=>a+g.surQ,0)}</b><span>с надбавкой</span></div><div><small>Товаров с надбавкой</small><b>${L.filter(g=>g.sur).length}</b><span>из ${L.length} в упаковках</span></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Товар</th><th class="r">В упаковке</th><th class="r">Надбавка, ₸/шт</th><th class="r">Продано поштучно</th><th class="r">Принесла</th><th></th></tr></thead><tbody>${L.map(g=>`<tr class="${g.id===curG?'sel':''}"><td><b>${esc(g.n)}</b><div class="mini">${g.id}</div></td><td class="r">${g.pk}</td><td class="r"><span class="stp"><button onclick="GO('${g.id}').sur=Math.max(0,GO('${g.id}').sur-10);render()">−</button><b>${g.sur}</b><button onclick="GO('${g.id}').sur+=10;render()">+</button></span></td><td class="r">${g.surQ} шт</td><td class="r mono"><b>${tg(g.sur*g.surQ)}</b></td><td style="min-width:120px">${bar(pct(g.sur*g.surQ,tot)*3,'y')}</td></tr>`).join('')}</tbody></table></div>
 ${said('«Если покупает меньше — дополнительно на эту сумму, привязать именно к товару. Сейчас в Umag универсальный продукт: я не смогу проверить, сколько этот товар дополнительной прибыли мне принёс.»')}`};

/* ===== Оприходование ===== */
let INC=[{id:'ПР-0418',sup:'Текстиль-Иваново',pos:64,pk:1920,sum:2840000,st:'new'},{id:'ПР-0417',sup:'ТД «Носочный двор», Алматы',pos:22,pk:640,sum:910000,st:'done'}];
SC.income=()=>`<div class="hd"><div><h2>Оприходование</h2><p>Как в Umag: накладная поставщика, сканирование, цены. Плюс: товары, которые уже были, находятся по своему коду — даже через годы; новые создаются с фото с телефона. Загрузка накладной из Excel.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>№</th><th>Поставщик</th><th class="r">Позиций</th><th class="r">Упаковок</th><th class="r">Сумма</th><th>Статус</th><th></th></tr></thead><tbody>${INC.map((x,i)=>`<tr><td class="mono">${x.id}</td><td>${esc(x.sup)}</td><td class="r">${x.pos}</td><td class="r">${x.pk}</td><td class="r mono">${tg(x.sum)}</td><td>${x.st==='new'?tag('ждёт','w'):tag('оприходован','g')}</td><td>${x.st==='new'?`<button class="bt sm" onclick="INC[${i}].st='done';render();toast('Приход оприходован: 58 позиций найдены по кодам, 6 новых — ждут фото. Остаток склада опта обновлён.')">Оприходовать</button>`:''}</td></tr>`).join('')}</tbody></table></div>
 <div class="g3">${[['Старый код — старая карточка','Модель вернулась через 5 лет — цены и фото подтянулись сами'],['Новый товар','фото с телефона прямо при приёмке'],['Цены','пересчёт опта и розницы по наценке, предупреждение, если себестоимость выросла']].map(x=>`<div class="pan"><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join('')}</div>`;

/* ===== Склады ===== */
SC.stock=()=>`<div class="hd"><div><h2>Склады и остатки</h2><p>Склад опта и магазин — отдельные остатки, перемещение документом. Складов можно завести сколько угодно.</p></div><div class="btns"><button class="bt p" onclick="toast('Перемещение создано: 10 уп. носков и 5 уп. колготок со склада опта в магазин.')">Переместить в магазин</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Товар</th><th class="r">${STORES.M}, уп.</th><th class="r">${STORES.S}, шт</th><th class="r">Сумма по себестоимости</th><th></th></tr></thead><tbody>${GOODS.map(g=>`<tr onclick="curG='${g.id}';go('catalog')"><td><b>${esc(g.n)}</b><div class="mini">${g.id}</div></td><td class="r mono">${Math.floor(g.st.M/g.pk)}</td><td class="r mono ${g.st.S<25?'red':''}">${g.st.S}</td><td class="r mono">${tg((g.st.M+g.st.S)*g.cost)}</td><td>${g.st.S<25?tag('мало в магазине','w'):''}</td></tr>`).join('')}</tbody></table></div>`;

/* ===== Ревизия ===== */
SC.inv=()=>`<div class="hd"><div><h2>Ревизия</h2><p>Сканером или телефоном, по складу или по полке. Упаковки и вскрытые штуки считаются отдельно, расхождения — сразу в списке.</p></div><div class="btns"><button class="bt p" onclick="toast('Ревизия магазина закрыта: расхождения списаны актом.')">Закрыть ревизию</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Товар</th><th class="r">По учёту</th><th class="r">Факт</th><th>Итог</th></tr></thead><tbody>${[['10234','38 шт','36 шт','не хватает 2 шт'],['11402','64 шт','64 шт','сходится'],['12011','31 шт','30 шт','не хватает 1 шт'],['15009','90 шт','92 шт','лишние 2 шт']].map(r=>`<tr><td><b>${esc(GO(r[0]).n)}</b></td><td class="r">${r[1]}</td><td class="r">${r[2]}</td><td>${tag(r[3],/сход/.test(r[3])?'g':/лиш/.test(r[3])?'w':'r')}</td></tr>`).join('')}</tbody></table></div>`;

/* ===== Клиенты ===== */
SC.clients=()=>`<div class="hd"><div><h2>Оптовые клиенты</h2><p>Магазины и точки по Актобе и области: уровень опта, отсрочка, сумма закупок, долг. Заказы приходят в WhatsApp — история переписки в карточке клиента.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Город</th><th>Уровень</th><th class="r">Закупки за год</th><th class="r">Отсрочка</th><th class="r">Долг</th><th>Последний заказ</th></tr></thead><tbody>${CLIENTS.map(c=>`<tr><td><b>${esc(c.n)}</b><div class="mini">${c.ph}</div></td><td>${c.city}</td><td>${tag(c.tier,c.tier==='Крупный опт'?'g':'')}</td><td class="r mono">${tg(c.sum)}</td><td class="r">${c.days?c.days+' дн.':'—'}</td><td class="r mono ${c.late?'red':''}">${c.debt?tg(c.debt):'—'}</td><td class="mono">${c.last}</td></tr>`).join('')}</tbody></table></div>`;
SC.debts=()=>`<div class="hd"><div><h2>Долги и отсрочка</h2><p>Отгрузка в долг — с отсрочкой по клиенту. Просрочил — система не даст отгрузить новый заказ без разрешения владельца и напомнит клиенту в WhatsApp.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Клиент</th><th class="r">Долг</th><th class="r">Отсрочка</th><th>Статус</th><th></th></tr></thead><tbody>${CLIENTS.filter(c=>c.debt).map((c,i)=>`<tr><td><b>${esc(c.n)}</b></td><td class="r mono">${tg(c.debt)}</td><td class="r">${c.days} дн.</td><td>${c.late?tag('просрочен','r'):tag('в срок','g')}</td><td><button class="bt sm" onclick="toast('Напоминание об оплате отправлено в WhatsApp.')">Напомнить</button></td></tr>`).join('')}</tbody></table></div>`;
SC.prices=()=>`<div class="hd"><div><h2>Цены: опт и розница</h2><p>Одна цена себестоимости — и правила: наценка опта и розницы, скидки по уровням опта. Изменилась себестоимость — цены пересчитываются, вы подтверждаете.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Уровень</th><th>Условие</th><th class="r">Скидка от опта</th></tr></thead><tbody>${Object.entries(TIERS).map(([k,v])=>`<tr><td><b>${k}</b></td><td>${v[1]}</td><td class="r">${v[0]}%</td></tr>`).join('')}</tbody></table></div>
 <div class="tw" style="margin-top:12px"><table class="t"><thead><tr><th>Товар</th><th class="r">Себестоимость шт</th><th class="r">Опт за уп.</th><th class="r">Наценка опт</th><th class="r">Розница шт</th><th class="r">Наценка розн.</th></tr></thead><tbody>${GOODS.map(g=>`<tr><td>${esc(g.n)}</td><td class="r mono">${tg(g.cost)}</td><td class="r mono">${tg(g.opt)}</td><td class="r">${pct(g.opt-g.cost*g.pk,g.cost*g.pk)}%</td><td class="r mono">${tg(g.rt)}</td><td class="r">${pct(g.rt-g.cost,g.cost)}%</td></tr>`).join('')}</tbody></table></div>`;

/* ===== Деньги ===== */
SC.sellers=()=>`<div class="hd"><div><h2>Продавцы и проценты</h2><p>Процент от продаж задаётся каждому продавцу — отдельно для розницы и опта. Начисление считается само из чеков и заказов; продавец видит свой процент.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Продавец</th><th>Где</th><th class="r">Процент</th><th class="r">Продажи за месяц</th><th class="r">Чеков / заказов</th><th class="r">Начислено</th></tr></thead><tbody>${SELLERS.map((s,i)=>`<tr><td><b>${s.n}</b></td><td>${s.where}</td><td class="r"><span class="stp"><button onclick="SELLERS[${i}].rate=Math.max(0,SELLERS[${i}].rate-0.5);render()">−</button><b>${s.rate}%</b><button onclick="SELLERS[${i}].rate+=0.5;render()">+</button></span></td><td class="r mono">${tg(s.fact)}</td><td class="r">${s.chk}</td><td class="r mono"><b>${tg(s.fact*s.rate/100)}</b></td></tr>`).join('')}</tbody></table></div>
 ${said('«По процентам каждому продавцу — вот эта функция тоже нужна.»')}`;
SC.profit=()=>`<div class="hd"><div><h2>Прибыль по товарам</h2><p>Выручка минус себестоимость — по каждому товару, отдельно опт и розница, и отдельно — сколько принесли надбавки.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Товар</th><th class="r">Продано</th><th class="r">Выручка</th><th class="r">Прибыль</th><th class="r">в т. ч. надбавки</th></tr></thead><tbody>${GOODS.map(g=>{const rev=g.sold*g.opt;const pr=rev-g.sold*g.pk*g.cost;return `<tr><td><b>${esc(g.n)}</b></td><td class="r">${g.sold} уп.</td><td class="r mono">${tg(rev)}</td><td class="r mono">${tg(pr+g.sur*g.surQ)}</td><td class="r mono">${g.sur?tg(g.sur*g.surQ):'—'}</td></tr>`}).join('')}</tbody></table></div>`;
SC.reports=()=>`<div class="hd"><div><h2>Отчёты</h2><p>Те же отчёты, что в Umag, и свои — кнопкой, с выгрузкой в Excel.</p></div></div>
 <div class="rgrid">${[['Продажи по дням','опт и розница отдельно'],['Прибыль по товарам','с надбавками'],['Остатки','склад и магазин, в упаковках и штуках'],['Движение товара','приход, продажа, вскрытия, возвраты'],['Долги клиентов','с отсрочками'],['Проценты продавцов','за любой период'],['Оптовые клиенты','кто сколько закупил'],['Неликвид','что не продаётся 90 дней']].map(x=>`<div class="rep" onclick="toast('Отчёт «${x[0]}» сформирован.')"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div>`;

/* ===== Система ===== */
SC.migrate=()=>`<div class="hd"><div><h2>Переезд с Umag</h2><p>Сначала воссоздаём то, к чему вы привыкли в Umag, — потом добавляем ваше. Данные переносим мы: товары с кодами, остатки, клиенты, история.</p></div></div>
 <div class="steps">${[['1','Выгрузка из Umag','товары, коды, цены, остатки, клиенты'],['2','Загрузка и сверка','количество позиций и сумм совпадает'],['3','Ревизия','одна по каждому складу'],['4','Неделя параллельно','продажи — в новой системе'],['5','Отказ от Umag','без абонентской платы']].map(s=>`<div><b>${s[0]}</b><h3>${s[1]}</h3><p>${s[2]}</p></div>`).join('')}</div>
 <div class="g2"><div class="pan"><h3>Как в Umag</h3>${['Касса и чеки','Оприходование','Остатки и перемещения','Ревизия','Отчёты'].map(x=>`<div class="li ok"><i>=</i><span>${x}</span></div>`).join('')}</div><div class="pan"><h3>Чего в Umag нет</h3>${['Продажа поштучно из упаковки с автоматическим вскрытием','Надбавка, привязанная к товару, и отчёт по ней','Фото у каждого товара','Проценты продавцам','Оптовые уровни, отсрочка и долги','WhatsApp и Kaspi в одной доске'].map(x=>`<div class="li ok"><i>+</i><span>${x}</span></div>`).join('')}</div></div>`;
SC.roles=()=>`<div class="hd"><div><h2>Роли и права</h2><p>Сотрудников — сколько угодно, каждый видит своё.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Раздел</th>${Object.keys(ROLES).map(r=>`<th class="c">${r}</th>`).join('')}</tr></thead><tbody>${SEC.map(s=>s.sub.map(x=>`<tr><td>${x[1]}</td>${Object.values(ROLES).map(r=>`<td class="c">${r.s.includes(x[0])?'<i class="ck"></i>':''}</td>`).join('')}</tr>`).join('')).join('')}</tbody></table></div>`;
SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Один раз разрабатываем — передаём вам. Без абонентской платы, без лимитов на сотрудников, склады и товары.</p></div></div>
 <div class="pay3"><div><small>Стандарт</small><b>2 000 000 ₸</b><span>всё, что в демо, Kaspi и WhatsApp, перенос из Umag, 4–6 недель</span></div><div><small>Расширенный</small><b>2 500 000 ₸</b><span>+ кабинет оптовика с каталогом и заказом, телефония, автозаказ поставщику</span></div><div><small>Доработки потом</small><b>20 $ / час</b><span>оценка заранее</span></div></div>
 <div class="g2"><div class="pan"><h3>Оплата</h3>${[['10% · старт','200 000 / 250 000 ₸'],['45% · база работает на сервере','900 000 / 1 125 000 ₸'],['45% · после полировки','900 000 / 1 125 000 ₸']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Расходы потом</h3>${[['Сервер','5–30 $ в месяц'],['Исправление ошибок','3 месяца бесплатно'],['Абонентская плата','нет']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div></div>`;
let theme='light';

/* ===== Каркас ===== */
function act(k){toast('Готово.')}
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();const g=GOODS.find(x=>(x.id+' '+x.n).toLowerCase().includes(q));if(g&&allowed('catalog')){curG=g.id;go('catalog');return}const c=CLIENTS.find(x=>x.n.toLowerCase().includes(q));if(c&&allowed('clients')){go('clients');return}toast('Не найдено. Попробуйте: «10234», «носки», «Алтын».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Владелец';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;setMe();if(!allowed(cur))cur=ROLES[role].s[0];build()}
function setMe(){document.getElementById('me').textContent=ROLES[role].av;const n=document.getElementById('mename');if(n)n.innerHTML=`<b>${esc(ROLES[role].n)}</b><small>${esc(role)}</small>`}
function switchRole(k){role=k;setMe();const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){const cnt={sale:ORDERS.filter(o=>o.st==='new').length,goods:INC.filter(x=>x.st==='new').length,cli:CLIENTS.filter(c=>c.late).length};
 document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="ri ${s.k===SECOF[cur]?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><span>${s.n}</span>${cnt[s.k]?`<em>${cnt[s.k]}</em>`:''}</a>`).join('');
 const S=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=S.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')"><i>${String(S.sub.indexOf(x)+1).padStart(2,'0')}</i>${esc(x[1])}</a>`).join('')}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.today;document.getElementById('ttl').textContent=SUBN[cur]||'Тауар';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme()}
const TOUR=[
 ['today','1 · Пульт владельца: опт и розница сегодня, надбавки, долги, заказы WhatsApp.'],
 ['pos','2 · Касса: упаковкой или поштучно; надбавка товара добавляется сама, упаковка вскрывается сама.'],
 ['packs','3 · Упаковки и штуки: остаток всегда правильный.'],
 ['surch','4 · Надбавки привязаны к товару — видно, сколько каждый принёс.'],
 ['catalog','5 · Фото у каждого товара, код закреплён навсегда.'],
 ['opt','6 · Оптовый заказ: уровень опта, скидка, отсрочка и долг клиента.'],
 ['orders','7 · Заказы WhatsApp и Kaspi в одной доске.'],
 ['income','8 · Оприходование как в Umag — плюс старые коды находятся сами.'],
 ['sellers','9 · Проценты продавцам считаются сами.'],
 ['migrate','10 · Переезд с Umag делаем мы.'],
 ['launch','11 · Стоимость: 2 000 000 ₸ или 2 500 000 ₸ расширенный.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен — всё кликается: касса, упаковки, надбавки, опт, проценты.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Владелец');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
