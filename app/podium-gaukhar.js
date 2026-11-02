/* ПОДИУМ — система бутиков обуви и аксессуаров (Гаухар, Алматы): каждая модель приходит один раз за сезон.
   Демо-макет на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(Math.round(n/100000)/10).toString().replace('.',',')+' млн';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};
const dd=s=>{const [y,m,d]=s.split('-');return d+'.'+m};
const TODAY='2026-11-02',NOW='12:30';
const addDays=(s,n)=>new Date(new Date(s+'T00:00:00').getTime()+n*864e5).toISOString().slice(0,10);
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const bar=(w,c)=>`<div class="bar"><i class="${c||''}" style="--w:${Math.max(2,Math.min(100,w))}%"></i></div>`;

const SEC=[
 {k:'day',n:'Сегодня',sub:[['today','Пульт собственника'],['shops','Бутики сегодня']]},
 {k:'sale',n:'Продажи',sub:[['pos','Касса'],['returns','Возвраты и обмены'],['promo','Скидки и акции'],['orders','Kaspi и Instagram']]},
 {k:'goods',n:'Товар',sub:[['income','Приход коллекции'],['catalog','Модели и размеры'],['labels','Штрихкоды и этикетки'],['stock','Остатки по бутикам'],['moves','Перемещения'],['inv','Инвентаризация']]},
 {k:'cli',n:'Покупатели',sub:[['clients','База покупателей'],['bonus','Бонусы и рассылки']]},
 {k:'team',n:'Команда',sub:[['staff','Продавцы и план'],['tasks','Задачи вместо WhatsApp']]},
 {k:'money',n:'Деньги',sub:[['season','Сезон: что продалось'],['reports','Отчёты'],['buh','Выгрузка бухгалтеру']]},
 {k:'sys',n:'Система',sub:[['move1c','Переезд с 1С'],['roles','Роли и права'],['launch','Запуск и стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Собственник':{av:'ГА',n:'Гаухар',note:'Все бутики, продажи, сезон, деньги, команда',s:ALL.slice()},
 'Управляющая':{av:'АЙ',n:'Айгерим',note:'Бутики, товар, перемещения, продавцы, задачи',s:['today','shops','returns','promo','income','catalog','stock','moves','inv','clients','staff','tasks','season','reports']},
 'Продавец':{av:'ДН',n:'Дана · бутик Достык',note:'Касса, возвраты, остатки, покупатели, свои задачи',s:['pos','returns','stock','clients','tasks']},
 'Кладовщик':{av:'ЕР',n:'Ерлан · склад',note:'Приход, этикетки, перемещения, инвентаризация',s:['income','catalog','labels','stock','moves','inv','tasks']},
 'Онлайн-менеджер':{av:'КМ',n:'Камила',note:'Kaspi и Instagram, покупатели, рассылки',s:['orders','clients','bonus','stock','tasks']},
 'Бухгалтер':{av:'СВ',n:'Светлана',note:'Продажи, возвраты, выгрузка для 1С и налоговой',s:['reports','buh','returns']}
};
let role='Собственник',cur='today';

/* ===== Бутики ===== */
const SHOPS=[
 {id:'B1',n:'Достык',addr:'Mega Alma-Ata, 1 этаж',plan:5200000,c:'#8c2f39'},
 {id:'B2',n:'Есентай',addr:'Esentai Mall, 2 этаж',plan:6800000,c:'#b08d57'},
 {id:'B3',n:'Абай',addr:'пр. Абая, 44',plan:3600000,c:'#3d5a6c'},
 {id:'SK',n:'Склад',addr:'ул. Толе би, 286',plan:0,c:'#6b6560'}
];
const SH=id=>SHOPS.find(s=>s.id===id)||SHOPS[0];
const SALES={B1:[1240000,23,34],B2:[1980000,19,41],B3:[610000,11,18]}; // сегодня: выручка, чеков, посетителей по счётчику

/* ===== Модели ===== каждая модель приходит один раз: код модели + цвет + размеры */
const SIZES=['36','37','38','39','40','41'];
let MODELS=[
 {id:'AW26-0412',n:'Ботфорты замшевые',brand:'Casadei',cat:'Обувь',col:'чёрный',price:189000,cost:82000,in:'2026-09-05',sz:{B1:[0,1,2,1,0,0],B2:[1,2,1,1,0,0],B3:[0,0,1,0,0,0]},sold:14,got:24},
 {id:'AW26-0418',n:'Челси кожаные',brand:'Santoni',cat:'Обувь',col:'коньяк',price:142000,cost:61000,in:'2026-09-05',sz:{B1:[0,0,1,1,1,0],B2:[0,1,2,2,1,1],B3:[0,1,1,0,0,0]},sold:9,got:22},
 {id:'AW26-0533',n:'Лоферы на платформе',brand:'Pollini',cat:'Обувь',col:'бордо',price:118000,cost:48000,in:'2026-09-20',sz:{B1:[1,1,1,0,0,0],B2:[0,0,1,1,0,0],B3:[0,0,0,0,0,0]},sold:17,got:22},
 {id:'AW26-0541',n:'Сапоги казаки',brand:'Le Silla',cat:'Обувь',col:'бежевый',price:226000,cost:98000,in:'2026-09-20',sz:{B1:[0,1,1,1,0,0],B2:[1,1,1,1,1,0],B3:[0,1,1,1,0,0]},sold:3,got:18},
 {id:'AW26-0602',n:'Ботильоны на каблуке',brand:'Casadei',cat:'Обувь',col:'графит',price:164000,cost:71000,in:'2026-10-02',sz:{B1:[1,1,2,1,1,0],B2:[1,2,2,2,1,0],B3:[0,1,1,1,0,0]},sold:4,got:22},
 {id:'AW26-0717',n:'Берет шерстяной',brand:'Maison Michel',cat:'Головные уборы',col:'молочный',price:48000,cost:17000,in:'2026-10-14',sz:{B1:[3,0,0,0,0,0],B2:[4,0,0,0,0,0],B3:[2,0,0,0,0,0]},sold:11,got:20},
 {id:'AW26-0721',n:'Шапка кашемир',brand:'Loro Piana',cat:'Головные уборы',col:'серый',price:96000,cost:41000,in:'2026-10-14',sz:{B1:[2,0,0,0,0,0],B2:[3,0,0,0,0,0],B3:[1,0,0,0,0,0]},sold:6,got:12},
 {id:'AW26-0805',n:'Сумка-тоут кожаная',brand:'Furla',cat:'Аксессуары',col:'чёрный',price:212000,cost:93000,in:'2026-10-20',sz:{B1:[1,0,0,0,0,0],B2:[2,0,0,0,0,0],B3:[1,0,0,0,0,0]},sold:2,got:6},
 {id:'SS26-0214',n:'Сандалии плетёные',brand:'Pollini',cat:'Обувь',col:'песочный',price:98000,cost:44000,in:'2026-04-10',sz:{B1:[0,1,1,0,0,0],B2:[0,0,1,1,0,0],B3:[1,1,0,0,0,0]},sold:16,got:24,old:true},
 {id:'SS26-0230',n:'Мюли текстиль',brand:'Le Silla',cat:'Обувь',col:'пудра',price:86000,cost:37000,in:'2026-04-10',sz:{B1:[1,1,0,0,0,0],B2:[0,1,1,0,0,0],B3:[0,0,1,1,0,0]},sold:12,got:20,old:true}
];
const MO=id=>MODELS.find(m=>m.id===id)||MODELS[0];
const left=(m,s)=>s?m.sz[s].reduce((a,x)=>a+x,0):Object.values(m.sz).reduce((a,r)=>a+r.reduce((x,y)=>x+y,0),0);
let curM='AW26-0412';

/* ===== Приход ===== */
let INCOME=[
 {id:'ПР-0094',sup:'Casadei S.p.A.',d:'2026-11-02',models:46,pairs:212,sum:14820000,st:'new',file:'Casadei_AW26_drop3.xlsx'},
 {id:'ПР-0093',sup:'Maison Michel',d:'2026-10-14',models:18,pairs:64,sum:2240000,st:'done'},
 {id:'ПР-0092',sup:'Furla',d:'2026-10-20',models:9,pairs:22,sum:1980000,st:'done'}
];

/* ===== Покупатели ===== */
let CLIENTS=[
 {n:'Алия Сейткали',ph:'+7 701 555 12 40',seg:'VIP',sum:3420000,cnt:21,last:'2026-10-28',size:'38',bon:68400,shop:'B2'},
 {n:'Мадина Ахметова',ph:'+7 777 230 44 19',seg:'VIP',sum:2180000,cnt:14,last:'2026-10-30',size:'37',bon:43600,shop:'B1'},
 {n:'Жанна Ким',ph:'+7 705 118 72 04',seg:'Постоянная',sum:860000,cnt:7,last:'2026-09-12',size:'39',bon:17200,shop:'B1',risk:true},
 {n:'Сауле Нурланова',ph:'+7 702 455 61 20',seg:'Постоянная',sum:640000,cnt:5,last:'2026-10-21',size:'38',bon:12800,shop:'B3'},
 {n:'Динара Оспанова',ph:'+7 708 320 15 77',seg:'Новая',sum:189000,cnt:1,last:'2026-11-01',size:'37',bon:3780,shop:'B2'},
 {n:'Айгуль Тлеубаева',ph:'+7 747 901 33 81',seg:'Постоянная',sum:1120000,cnt:9,last:'2026-08-30',size:'40',bon:22400,shop:'B2',risk:true},
 {n:'Камила Абилова',ph:'+7 776 515 90 03',seg:'Новая',sum:118000,cnt:1,last:'2026-10-25',size:'36',bon:2360,shop:'B1'}
];

/* ===== Заказы онлайн ===== */
const OST=[['new','Новый'],['ok','Подтверждён'],['pack','Упакован'],['sent','Отправлен'],['done','Доставлен']];
let ORDERS=[
 {id:'K-614502',ch:'Kaspi',who:'Асель М.',m:'AW26-0533',size:'37',sum:118000,st:'new',shop:'B1'},
 {id:'K-614498',ch:'Kaspi',who:'Гульнара Т.',m:'AW26-0717',size:'—',sum:48000,st:'ok',shop:'B2'},
 {id:'IG-0331',ch:'Instagram',who:'@aidana.style',m:'AW26-0602',size:'38',sum:164000,st:'new',shop:'B2'},
 {id:'IG-0329',ch:'Instagram',who:'@zhanel_k',m:'AW26-0412',size:'37',sum:189000,st:'pack',shop:'B1'},
 {id:'K-614471',ch:'Kaspi',who:'Ерке Б.',m:'AW26-0721',size:'—',sum:96000,st:'sent',shop:'B3'},
 {id:'IG-0322',ch:'Instagram',who:'@madina.a',m:'AW26-0418',size:'39',sum:142000,st:'done',shop:'B2'}
];

/* ===== Команда ===== */
let STAFF=[
 {n:'Дана',shop:'B1',plan:5200000,fact:4380000,chk:96,avg:45600},{n:'Асель',shop:'B1',plan:5200000,fact:3910000,chk:88,avg:44400},
 {n:'Мария',shop:'B2',plan:6800000,fact:6120000,chk:104,avg:58800},{n:'Жанель',shop:'B2',plan:6800000,fact:5240000,chk:97,avg:54000},
 {n:'Аружан',shop:'B3',plan:3600000,fact:2310000,chk:61,avg:37900}
];
let TASKS=[
 {t:'Переоценка SS26 — повесить ценники −40%',who:'Дана',shop:'B1',due:'02.11',st:'go'},
 {t:'Принять приход Casadei, 212 пар',who:'Ерлан',shop:'SK',due:'03.11',st:'go'},
 {t:'Переместить казаки 38–39 в Есентай',who:'Ерлан',shop:'SK',due:'02.11',st:'done'},
 {t:'Обзвонить VIP: новая коллекция Casadei',who:'Камила',shop:'—',due:'04.11',st:'go'},
 {t:'Витрина: ботильоны графит вперёд',who:'Аружан',shop:'B3',due:'02.11',st:'check'}
];

const SC={};
const sell=m=>pct(m.sold,m.got);
const promoOf=m=>PROMOS.find(p=>p.on&&p.match(m));
const priceNow=m=>{const p=promoOf(m);return p?Math.round(m.price*(100-p.pct)/100/1000)*1000:m.price};

/* ===== Пульт собственника ===== */
SC.today=()=>{const rev=Object.values(SALES).reduce((a,x)=>a+x[0],0),chk=Object.values(SALES).reduce((a,x)=>a+x[1],0),vis=Object.values(SALES).reduce((a,x)=>a+x[2],0);
 const fresh=MODELS.filter(m=>!m.old);const slow=fresh.filter(m=>sell(m)<25);
 return `<div class="hd"><div><h2>Понедельник, 2 ноября</h2><p>Три бутика, склад, Kaspi и Instagram — в одной системе. Видно не только выручку, но и главное для модной обуви: какая модель сезона продаётся, а какая останется на распродажу.</p></div><div class="btns"><button class="bt" onclick="go('season')">Сезон</button><button class="bt p" onclick="go('pos')">Открыть кассу</button></div></div>
 <div class="kpi"><div><small>Выручка сегодня</small><b>${tg(rev)}</b><span>${chk} ${plural(chk,['чек','чека','чеков'])} · средний ${tg(rev/chk)}</span></div><div><small>Конверсия</small><b>${pct(chk,vis)}%</b><span>${vis} посетителей по счётчику</span></div><div><small>Месяц к плану</small><b>78%</b><span>12,2 из 15,6 млн</span></div><div><small>Продано AW26</small><b>${pct(fresh.reduce((a,m)=>a+m.sold,0),fresh.reduce((a,m)=>a+m.got,0))}%</b><span>коллекции осень-зима</span></div><div><small>Онлайн</small><b>${ORDERS.filter(o=>o.st==='new').length} новых</b><span>Kaspi и Instagram</span></div></div>
 <div class="cols"><div class="pan"><h3>Бутики сегодня</h3>${SHOPS.filter(s=>SALES[s.id]).map(s=>{const x=SALES[s.id];return `<div class="shoprow" onclick="go('shops')"><i style="background:${s.c}"></i><div><b>${s.n}</b><span>${esc(s.addr)}</span></div><div class="num"><b>${tg(x[0])}</b><span>${x[1]} чеков · конверсия ${pct(x[1],x[2])}%</span></div>${bar(pct(x[0],s.plan/30*1.4),'b')}</div>`}).join('')}</div>
 <div class="pan"><h3>Требует решения</h3>
  <div class="al r" onclick="go('season')"><b>${slow.length} ${plural(slow.length,['модель','модели','моделей'])} AW26 продаются медленно</b><span>${slow.map(m=>esc(m.n)).join(', ')} — продано меньше 25% за месяц. Предложение: перенести в Есентай и показать VIP.</span></div>
  <div class="al w" onclick="go('moves')"><b>Размерные дыры</b><span>Лоферы бордо: в Абае закончились все размеры, на складе их нет — 3 пары в Достыке.</span></div>
  <div class="al i" onclick="go('income')"><b>Приход Casadei ждёт приёмки</b><span>46 моделей, 212 пар — карточки и штрихкоды создадутся из файла поставщика.</span></div>
  <div class="al w" onclick="go('promo')"><b>Распродажа SS26 действует до 15.11</b><span>Скидка 40% ставится на кассе сама — вручную никто ничего не считает.</span></div>
  <div class="al i" onclick="go('clients')"><b>2 VIP не были больше 60 дней</b><span>Жанна Ким, Айгуль Тлеубаева — пригласить на новую коллекцию.</span></div></div></div>
 ${said('«Чтобы решиться на эту авантюру, я должна понимать, а что я от этого буду иметь.»','Ответ на экране: что продаётся в каждом бутике, где размерные дыры, какие модели останутся на распродажу — и всё это без 1С-программиста из другого города.')}`};

/* ===== Бутики ===== */
SC.shops=()=>`<div class="hd"><div><h2>Бутики сегодня</h2><p>По каждому бутику: выручка, чеки, конверсия, продавцы на смене и товар, который лучше переместить.</p></div></div>
 <div class="g3">${SHOPS.filter(s=>SALES[s.id]).map(s=>{const x=SALES[s.id];const st=STAFF.filter(p=>p.shop===s.id);return `<div class="pan shopcard" style="border-top:3px solid ${s.c}"><h3>${s.n}</h3><p>${esc(s.addr)}</p>${[['Выручка сегодня',tg(x[0])],['Чеков',x[1]],['Посетителей',x[2]],['Конверсия',pct(x[1],x[2])+'%'],['План месяца',mln(s.plan)+' ₸'],['На смене',st.map(p=>p.n).join(', ')],['Пар в бутике',MODELS.reduce((a,m)=>a+left(m,s.id),0)]].map(k=>`<div class="kv"><span>${k[0]}</span><b>${k[1]}</b></div>`).join('')}</div>`}).join('')}</div>`;

/* ===== Касса ===== */
let CART=[],posShop='B1',lastCheck=null;
SC.pos=()=>{const pick=MODELS.filter(m=>left(m,posShop)>0);const sum=CART.reduce((a,c)=>a+c.p,0);const full=CART.reduce((a,c)=>a+c.full,0);
 return `<div class="hd"><div><h2>Касса · ${SH(posShop).n}</h2><p>Продавец сканирует штрихкод — модель, цвет и размер находятся сами. Скидка по действующей акции ставится автоматически, бонусы покупателя — тоже. Оплата наличными, картой или Kaspi QR.</p></div><div class="btns"><div class="seg">${SHOPS.filter(s=>SALES[s.id]).map(s=>`<button class="${s.id===posShop?'on':''}" onclick="posShop='${s.id}';CART=[];render()">${s.n}</button>`).join('')}</div></div></div>
 <div class="pos"><div class="pan"><h3>Сканер</h3><p>В демо нажмите на товар — как будто отсканировали штрихкод.</p><div class="scan">${pick.map(m=>{const i=m.sz[posShop].findIndex(x=>x>0);return `<button onclick="addCart('${m.id}',${i})"><b>${esc(m.n)}</b><span>${esc(m.brand)} · ${m.col} · ${m.cat==='Обувь'?'р. '+SIZES[i]:'один размер'}</span><em>${promoOf(m)?`<s>${tg(m.price)}</s> `:''}${tg(priceNow(m))}</em><code>${barcode(m,i)}</code></button>`}).join('')}</div></div>
 <div class="pan cart"><h3>Чек</h3>${CART.map((c,i)=>`<div class="kv"><span>${esc(c.n)}<br><small class="mini">${c.sz}${c.promo?' · '+esc(c.promo):''}</small></span><b>${tg(c.p)} <a class="x" onclick="CART.splice(${i},1);render()">×</a></b></div>`).join('')||'<p class="mini">Отсканируйте товар.</p>'}
  ${CART.length?`<div class="kv"><span>Без скидок</span><b>${tg(full)}</b></div><div class="kv"><span>Скидка по акциям</span><b>−${tg(full-sum)}</b></div><div class="tot"><span>К оплате</span><b>${tg(sum)}</b></div><div class="pays">${['Наличные','Карта','Kaspi QR'].map(m=>`<button onclick="payCart('${m}')">${m}</button>`).join('')}</div>`:''}
  ${lastCheck?`<div class="note ok"><b>Чек ${lastCheck}</b> пробит, остатки списаны, бонусы начислены.</div>`:''}</div></div>`};
const barcode=(m,i)=>'48'+m.id.replace(/\D/g,'').slice(0,8)+String(i+36);
function addCart(id,i){const m=MO(id);const p=promoOf(m);CART.push({id,i,n:m.n+' · '+m.brand,sz:m.cat==='Обувь'?'размер '+SIZES[i]:m.col,p:priceNow(m),full:m.price,promo:p?p.n:''});lastCheck=null;render()}
function payCart(how){CART.forEach(c=>{const m=MO(c.id);if(m.sz[posShop][c.i]>0)m.sz[posShop][c.i]--;m.sold++});const s=CART.reduce((a,c)=>a+c.p,0);SALES[posShop][0]+=s;SALES[posShop][1]++;lastCheck='№ '+(4100+SALES[posShop][1]);CART=[];render();toast(`Оплачено: ${how}, ${tg(s)}. Остаток в бутике уменьшился, продажа попала в выгрузку бухгалтеру.`)}

/* ===== Возвраты ===== */
let RETS=[{chk:'№ 4071',d:'31.10',shop:'B2',m:'AW26-0418',sz:'39',sum:142000,why:'Не подошёл размер — обмен на 40',st:'обмен'},{chk:'№ 3987',d:'28.10',shop:'B1',m:'AW26-0533',sz:'37',sum:118000,why:'Брак: отклеилась подошва',st:'возврат поставщику'}];
SC.returns=()=>`<div class="hd"><div><h2>Возвраты и обмены</h2><p>Возврат делается по чеку: система находит покупку, возвращает пару на остаток нужного бутика, возвращает деньги тем же способом, списывает начисленные бонусы. Брак уходит в отдельный список «вернуть поставщику».</p></div><div class="btns"><button class="bt p" onclick="RETS.unshift({chk:'№ 4102',d:'02.11',shop:'B1',m:'AW26-0602',sz:'38',sum:164000,why:'Передумала — возврат денег',st:'возврат'});render();toast('Возврат по чеку № 4102: деньги вернутся на карту, пара — на остаток Достыка, бонусы списаны.')">Возврат по чеку</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Чек</th><th>Дата</th><th>Бутик</th><th>Модель</th><th>Размер</th><th class="r">Сумма</th><th>Причина</th><th>Итог</th></tr></thead><tbody>${RETS.map(r=>`<tr><td class="mono">${r.chk}</td><td class="mono">${r.d}</td><td>${SH(r.shop).n}</td><td><b>${esc(MO(r.m).n)}</b><div class="mini">${r.m}</div></td><td>${r.sz}</td><td class="r mono">${tg(r.sum)}</td><td>${esc(r.why)}</td><td>${tag(r.st,r.st==='обмен'?'i':r.st==='возврат'?'w':'r')}</td></tr>`).join('')}</tbody></table></div>
 <div class="g3">${[['Возвратов за октябрь','11 · 1,4 млн ₸'],['Из них обмен размера','7'],['Брак поставщику','2 пары · Pollini']].map(x=>`<div class="pan"><h3>${x[1]}</h3><p>${x[0]}</p></div>`).join('')}</div>`;

/* ===== Скидки и акции ===== */
let PROMOS=[
 {n:'Распродажа SS26 −40%',pct:40,from:'2026-10-15',to:'2026-11-15',on:true,who:'вся коллекция весна-лето 2026',match:m=>m.id.startsWith('SS26')},
 {n:'Головные уборы −15% к новой коллекции',pct:15,from:'2026-11-01',to:'2026-11-10',on:true,who:'категория «Головные уборы»',match:m=>m.cat==='Головные уборы'},
 {n:'Black Friday −25%',pct:25,from:'2026-11-27',to:'2026-11-30',on:false,who:'вся обувь AW26, кроме Casadei',match:m=>m.id.startsWith('AW26')&&m.cat==='Обувь'&&m.brand!=='Casadei'},
 {n:'Конец сезона AW26 −30%',pct:30,from:'2027-01-10',to:'2027-02-15',on:false,who:'модели AW26, где продано меньше 60%',match:m=>false}
];
SC.promo=()=>`<div class="hd"><div><h2>Скидки и акции</h2><p>Акция задаётся один раз: на что, сколько процентов и с какого по какое число. В нужный день касса сама начинает считать скидку и сама прекращает. Ценники для переоценки — списком для каждого бутика.</p></div><div class="btns"><button class="bt p" onclick="toast('Новая акция: что (коллекция, бренд, категория, модели), процент, даты, бутики.')">+ Акция</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Акция</th><th>На что</th><th class="r">Скидка</th><th>Период</th><th>Моделей</th><th>Действует</th></tr></thead><tbody>${PROMOS.map((p,i)=>`<tr><td><b>${esc(p.n)}</b></td><td>${esc(p.who)}</td><td class="r mono">${p.pct}%</td><td class="mono">${dd(p.from)} — ${dd(p.to)}</td><td>${MODELS.filter(p.match).length}</td><td><span class="sw ${p.on?'on':''}" onclick="PROMOS[${i}].on=!PROMOS[${i}].on;render();toast(PROMOS[${i}].on?'Акция включена — касса считает скидку сама.':'Акция выключена.')"></span></td></tr>`).join('')}</tbody></table></div>
 ${said('«…как возврат, скидка на определённый период. И все эти вещи не вручную, а автоматизированы.»')}`;

/* ===== Kaspi и Instagram ===== */
SC.orders=()=>`<div class="hd"><div><h2>Kaspi и Instagram</h2><p>Онлайн-заказы в одной доске: Kaspi приходит сам, заказ из Instagram менеджер создаёт в один клик из переписки. Товар резервируется в нужном бутике и не продаётся на кассе дважды.</p></div></div>
 <div class="board">${OST.map(([k,n])=>{const L=ORDERS.filter(o=>o.st===k);return `<div class="bcol"><div class="bh"><b>${n}</b><span>${L.length}</span></div>${L.map(o=>`<div class="oc" onclick="advOrd('${o.id}')"><small>${o.id} · ${o.ch}</small><b>${esc(MO(o.m).n)}</b><span>${esc(o.who)} · р. ${o.size} · ${SH(o.shop).n}</span><em>${tg(o.sum)}</em></div>`).join('')}</div>`}).join('')}</div>
 <p class="mini">Нажмите на заказ — он перейдёт на следующую стадию.</p>`;
function advOrd(id){const o=ORDERS.find(x=>x.id===id);const k=OST.map(x=>x[0]);const i=k.indexOf(o.st);if(i<k.length-1)o.st=k[i+1];render();toast(`${o.id}: ${OST[k.indexOf(o.st)][1].toLowerCase()}.${o.st==='ok'?' Пара зарезервирована в бутике '+SH(o.shop).n+'.':''}`)}

/* ===== Приход коллекции ===== */
const DROP=[['AW26-0901','Мокасины замшевые','тауп',128000,[2,4,6,6,4,2]],['AW26-0902','Ботинки на шнуровке','чёрный',154000,[1,3,5,5,3,1]],['AW26-0903','Туфли лодочки','красный',136000,[2,3,4,4,2,1]],['AW26-0904','Полусапоги','шоколад',198000,[1,2,4,4,2,1]]];
SC.income=()=>{const n=INCOME.find(x=>x.st==='new');
 return `<div class="hd"><div><h2>Приход коллекции</h2><p>Каждая модель приходит один раз — поэтому карточки не заводятся руками. Загружаете файл поставщика (Excel), система сама создаёт модели с цветами и размерной сеткой, присваивает штрихкоды и предлагает распределить пары по бутикам.</p></div></div>
 ${n?`<div class="pan"><h3>${n.id} · ${esc(n.sup)} · ${dd(n.d)}</h3><p>Файл <b>${esc(n.file)}</b>: ${n.models} моделей, ${n.pairs} пар, закуп ${tg(n.sum)}. Ниже — первые 4 модели, как их распознала система.</p>
  <div class="tw"><table class="t"><thead><tr><th>Код</th><th>Модель</th><th>Цвет</th>${SIZES.map(s=>`<th class="c">${s}</th>`).join('')}<th class="r">Пар</th><th class="r">Цена</th><th>Распределить</th></tr></thead><tbody>${DROP.map(d=>`<tr><td class="mono">${d[0]}</td><td><b>${d[1]}</b></td><td>${d[2]}</td>${d[4].map(x=>`<td class="c mono">${x}</td>`).join('')}<td class="r mono">${d[4].reduce((a,x)=>a+x,0)}</td><td class="r mono">${tg(d[3])}</td><td class="mini">Есентай 40% · Достык 35% · Абай 25%</td></tr>`).join('')}</tbody></table></div>
  <div class="btns" style="justify-content:flex-start;margin-top:10px"><button class="bt p" onclick="acceptIncome()">Принять: создать карточки и штрихкоды</button><button class="bt" onclick="go('labels')">Этикетки</button></div></div>`:'<div class="note ok"><b>Все приходы приняты.</b></div>'}
 <div class="tw"><table class="t"><thead><tr><th>№</th><th>Поставщик</th><th>Дата</th><th class="r">Моделей</th><th class="r">Пар</th><th class="r">Сумма</th><th>Статус</th></tr></thead><tbody>${INCOME.map(x=>`<tr><td class="mono">${x.id}</td><td>${esc(x.sup)}</td><td class="mono">${dd(x.d)}</td><td class="r">${x.models}</td><td class="r">${x.pairs}</td><td class="r mono">${tg(x.sum)}</td><td>${x.st==='new'?tag('ждёт приёмки','w'):tag('принят','g')}</td></tr>`).join('')}</tbody></table></div>
 ${said('«У меня ни разу не повторяется SKU. Оно только на один приход… Каждый раз карточку заводить.»','Поэтому карточки создаются из файла поставщика, а не руками: 46 моделей Casadei — одной кнопкой.')}`};
function acceptIncome(){const n=INCOME.find(x=>x.st==='new');n.st='done';DROP.forEach(d=>MODELS.unshift({id:d[0],n:d[1],brand:'Casadei',cat:'Обувь',col:d[2],price:d[3],cost:Math.round(d[3]*0.44),in:TODAY,sz:{B1:d[4].map(x=>Math.round(x*0.35)),B2:d[4].map(x=>Math.round(x*0.4)),B3:d[4].map(x=>Math.round(x*0.25))},sold:0,got:d[4].reduce((a,x)=>a+x,0)}));render();toast('Приход принят: 46 карточек и 212 штрихкодов созданы, пары распределены по бутикам. Задача «наклеить этикетки» ушла на склад.')}

/* ===== Модели ===== */
SC.catalog=()=>{const m=MO(curM);
 return `<div class="hd"><div><h2>Модели и размеры</h2><p>Карточка модели: бренд, цвет, цена и себестоимость, размерная сетка по каждому бутику, сколько продано из прихода. Около 3 000 позиций в сезон — поиск по коду, бренду или названию.</p></div></div>
 <div class="mgrid">${MODELS.slice(0,12).map(x=>`<div class="mcard ${x.id===curM?'on':''}" onclick="curM='${x.id}';render()"><div class="ph" style="--h:${(x.id.charCodeAt(6)*37)%360}"><svg viewBox="0 0 60 30"><path d="M4 22c8 0 14-2 20-8l6-8h6l2 6c2 6 8 8 18 9v3H4z" fill="currentColor" opacity=".55"/></svg></div><small>${x.id}</small><b>${esc(x.n)}</b><span>${esc(x.brand)} · ${x.col}</span><em>${tg(priceNow(x))}</em></div>`).join('')}</div>
 <div class="pan"><h3>${esc(m.n)} · ${esc(m.brand)} · ${m.col}</h3><p>${m.id} · приход ${dd(m.in)} · цена ${tg(m.price)} · себестоимость ${tg(m.cost)} · наценка ${pct(m.price-m.cost,m.cost)}%</p>
  <div class="tw"><table class="t"><thead><tr><th>Бутик</th>${m.cat==='Обувь'?SIZES.map(s=>`<th class="c">${s}</th>`).join(''):'<th class="c">шт.</th>'}<th class="r">Всего</th></tr></thead><tbody>${['B1','B2','B3'].map(s=>`<tr><td>${SH(s).n}</td>${(m.cat==='Обувь'?m.sz[s]:[m.sz[s][0]]).map(x=>`<td class="c mono ${x?'':'zero'}">${x||'—'}</td>`).join('')}<td class="r mono">${left(m,s)}</td></tr>`).join('')}</tbody></table></div>
  <div class="kv"><span>Продано из прихода</span><b>${m.sold} из ${m.got} · ${sell(m)}%</b></div></div>`};

/* ===== Этикетки ===== */
const bars=code=>{let x=0,o='';for(const ch of code){const w=1+(+ch%3);o+=`<rect x="${x}" y="0" width="${w}" height="34" />`;x+=w+1+((+ch)%2)}return `<svg viewBox="0 0 ${x} 34" preserveAspectRatio="none">${o}</svg>`};
SC.labels=()=>`<div class="hd"><div><h2>Штрихкоды и этикетки</h2><p>Штрихкод присваивается каждой паре при приходе: модель + цвет + размер. Этикетки печатаются пачкой на термопринтере — с брендом, размером и ценой. При переоценке — новые ценники только на те модели, где цена изменилась.</p></div><div class="btns"><button class="bt p" onclick="toast('Отправлено на печать: 212 этикеток прихода ПР-0094.')">Печать прихода</button></div></div>
 <div class="labels">${MODELS.slice(0,8).map((m,i)=>{const c=barcode(m,2);return `<div class="lab"><b>${esc(m.brand)}</b><span>${esc(m.n)}</span><div class="lr"><em>${m.cat==='Обувь'?'р. 38':m.col}</em><strong>${tg(priceNow(m))}</strong></div><div class="bc">${bars(c)}</div><code>${c}</code></div>`}).join('')}</div>`;

/* ===== Остатки ===== */
SC.stock=()=>`<div class="hd"><div><h2>Остатки по бутикам</h2><p>Сколько пар каждой модели в каждом бутике, по размерам. Продавец видит, есть ли нужный размер в соседнем бутике, — и может попросить перемещение, не звоня никому.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Модель</th>${['B1','B2','B3'].map(s=>`<th class="c">${SH(s).n}</th>`).join('')}<th class="r">Всего</th><th class="r">Продано</th></tr></thead><tbody>${MODELS.map(m=>`<tr onclick="curM='${m.id}';go('catalog')"><td><b>${esc(m.n)}</b><div class="mini">${m.id} · ${esc(m.brand)} · ${m.col}</div></td>${['B1','B2','B3'].map(s=>`<td class="c"><div class="szs">${(m.cat==='Обувь'?m.sz[s]:[m.sz[s][0]]).map((x,i)=>`<i class="${x?'y':''}" title="${SIZES[i]}">${m.cat==='Обувь'?SIZES[i]:'шт'}</i>`).join('')}</div></td>`).join('')}<td class="r mono">${left(m)}</td><td class="r mono">${sell(m)}%</td></tr>`).join('')}</tbody></table></div>
 <div class="legend"><span><i class="y"></i>есть в наличии</span><span><i></i>нет размера</span></div>`;

/* ===== Перемещения ===== */
let MOVES=[{m:'AW26-0533',from:'B1',to:'B3',sz:'36, 37',n:2,why:'В Абае закончились все размеры',st:'new'},{m:'AW26-0541',from:'B2',to:'B1',sz:'39',n:1,why:'Спрашивали в Достыке 2 раза',st:'new'},{m:'AW26-0541',from:'SK',to:'B2',sz:'38, 39',n:2,why:'Перемещение со склада',st:'done'}];
SC.moves=()=>`<div class="hd"><div><h2>Перемещения</h2><p>Система сама предлагает, что переместить: где размер закончился, а в соседнем бутике лежит. Перемещение — документом: в пути пара не продаётся, при приёмке встаёт на остаток.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Модель</th><th>Откуда → куда</th><th>Размеры</th><th class="r">Пар</th><th>Почему</th><th></th></tr></thead><tbody>${MOVES.map((x,i)=>`<tr><td><b>${esc(MO(x.m).n)}</b><div class="mini">${x.m}</div></td><td>${SH(x.from).n} → ${SH(x.to).n}</td><td>${x.sz}</td><td class="r">${x.n}</td><td class="mini">${esc(x.why)}</td><td>${x.st==='new'?`<button class="bt sm" onclick="MOVES[${i}].st='done';render();toast('Перемещение создано: курьеру задача, в ${SH(x.to).n} пара появится после приёмки.')">Переместить</button>`:tag('выполнено','g')}</td></tr>`).join('')}</tbody></table></div>`;

/* ===== Инвентаризация ===== */
let invDone=false;
SC.inv=()=>`<div class="hd"><div><h2>Инвентаризация</h2><p>Продавец сканирует пары на полке телефоном или сканером. Система сравнивает с остатком и показывает расхождения: чего не хватает, что лишнее, что пересортица по размеру.</p></div><div class="btns"><button class="bt p" onclick="invDone=true;render();toast('Инвентаризация Достыка закрыта: расхождения списаны актом, остатки исправлены.')">Закрыть инвентаризацию</button></div></div>
 <div class="kpi"><div><small>Бутик</small><b>Достык</b><span>${invDone?'закрыта':'идёт'} · начата 10:05</span></div><div><small>Отсканировано</small><b>412 из 418</b><span>пар</span></div><div><small>Не хватает</small><b class="r">4</b><span>пары</span></div><div><small>Лишние</small><b>1</b><span>не числится в бутике</span></div><div><small>Пересортица</small><b>1</b><span>размер 38 вместо 37</span></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Модель</th><th>Размер</th><th class="r">По учёту</th><th class="r">Факт</th><th>Что это</th></tr></thead><tbody>${[['AW26-0412','38',2,1,'не хватает'],['AW26-0602','38',2,1,'не хватает'],['AW26-0717','—',3,2,'не хватает'],['SS26-0230','37',1,0,'пересортица: лежит 38'],['AW26-0418','40',0,1,'числится в Есентае']].map(r=>`<tr><td><b>${esc(MO(r[0]).n)}</b><div class="mini">${r[0]}</div></td><td>${r[1]}</td><td class="r">${r[2]}</td><td class="r">${r[3]}</td><td>${tag(r[4],/не хватает/.test(r[4])?'r':'w')}</td></tr>`).join('')}</tbody></table></div>`;

/* ===== Покупатели ===== */
SC.clients=()=>`<div class="hd"><div><h2>База покупателей</h2><p>Покупатель привязывается к чеку по номеру телефона. Видно, сколько и что она покупает, её размер, любимые бренды и когда была последний раз. VIP и «давно не была» — отдельными списками.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Покупатель</th><th>Сегмент</th><th class="r">Покупок</th><th class="r">Сумма</th><th>Размер</th><th>Бутик</th><th>Была</th><th class="r">Бонусы</th></tr></thead><tbody>${CLIENTS.map(c=>`<tr><td><b>${esc(c.n)}</b><div class="mini">${c.ph}${c.risk?' · <span class="red">давно не была</span>':''}</div></td><td>${tag(c.seg,c.seg==='VIP'?'g':c.seg==='Новая'?'i':'')}</td><td class="r">${c.cnt}</td><td class="r mono">${tg(c.sum)}</td><td>${c.size}</td><td>${SH(c.shop).n}</td><td class="mono">${dd(c.last)}</td><td class="r mono">${tg(c.bon)}</td></tr>`).join('')}</tbody></table></div>`;
SC.bonus=()=>`<div class="hd"><div><h2>Бонусы и рассылки</h2><p>2% от покупки возвращаются бонусами, у VIP — 5%. Рассылки в WhatsApp по поводу: новая коллекция её размера, день рождения, давно не была, конец сезона.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Когда</th><th>Что получает покупатель</th><th class="r">За октябрь</th></tr></thead><tbody>${[['Пришла коллекция её бренда и размера','Фото новинок и приглашение в бутик',142],['День рождения','Поздравление и бонус 10 000 ₸',37],['Не была 60 дней','Подборка новинок от продавца',58],['Старт распродажи','Модели её размера со скидкой',410],['После покупки','Спасибо и как ухаживать за кожей и замшей',388]].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="r">${r[2]}</td></tr>`).join('')}</tbody></table></div>`;

/* ===== Команда ===== */
SC.staff=()=>`<div class="hd"><div><h2>Продавцы и план</h2><p>План продаж на месяц у каждого продавца, факт по чекам, средний чек. Процент продавца считается сам.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Продавец</th><th>Бутик</th><th>План</th><th class="r">Факт</th><th class="r">Чеков</th><th class="r">Средний чек</th><th class="r">Бонус 3%</th></tr></thead><tbody>${STAFF.map(s=>`<tr><td><b>${s.n}</b></td><td>${SH(s.shop).n}</td><td style="min-width:160px">${bar(pct(s.fact,s.plan),pct(s.fact,s.plan)<70?'r':'g')}<span class="mini">${pct(s.fact,s.plan)}% · план ${mln(s.plan)}</span></td><td class="r mono">${tg(s.fact)}</td><td class="r">${s.chk}</td><td class="r mono">${tg(s.avg)}</td><td class="r mono">${tg(s.fact*0.03)}</td></tr>`).join('')}</tbody></table></div>`;
SC.tasks=()=>`<div class="hd"><div><h2>Задачи вместо WhatsApp</h2><p>Поручения команде — с ответственным, сроком и фото результата. В WhatsApp они тонут, здесь видно, кто что сделал.</p></div><div class="btns"><button class="bt p" onclick="TASKS.unshift({t:'Подготовить витрину Casadei',who:'Мария',shop:'B2',due:'03.11',st:'go'});render();toast('Задача поставлена — Марии пришло уведомление.')">+ Задача</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Задача</th><th>Кто</th><th>Где</th><th>Срок</th><th>Статус</th></tr></thead><tbody>${TASKS.map((t,i)=>`<tr onclick="TASKS[${i}].st=TASKS[${i}].st==='go'?'check':'done';render()"><td><b>${esc(t.t)}</b></td><td>${t.who}</td><td>${t.shop==='—'?'онлайн':SH(t.shop).n}</td><td class="mono">${t.due}</td><td>${tag(t.st==='go'?'в работе':t.st==='check'?'на проверке · фото':'готово',t.st==='done'?'g':t.st==='check'?'w':'i')}</td></tr>`).join('')}</tbody></table></div>`;

/* ===== Сезон ===== */
SC.season=()=>{const F=MODELS.filter(m=>!m.old).sort((a,b)=>sell(b)-sell(a));
 return `<div class="hd"><div><h2>Сезон: что продалось</h2><p>Главный отчёт для модной обуви: какая доля прихода каждой модели уже продана. Лидеров можно дозаказать у поставщика, пока сезон идёт; аутсайдеров — переместить, показать VIP или заранее заложить в распродажу.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Модель</th><th>Бренд</th><th>Приход</th><th class="r">Пришло</th><th class="r">Продано</th><th style="min-width:160px">Продано из прихода</th><th class="r">Маржа</th><th>Совет системы</th></tr></thead><tbody>${F.map(m=>{const s=sell(m);return `<tr onclick="curM='${m.id}';go('catalog')"><td><b>${esc(m.n)}</b><div class="mini">${m.id}</div></td><td>${esc(m.brand)}</td><td class="mono">${dd(m.in)}</td><td class="r">${m.got}</td><td class="r">${m.sold}</td><td>${bar(s,s<25?'r':s>60?'g':'b')}<span class="mini">${s}%</span></td><td class="r mono">${tg((m.price-m.cost)*m.sold)}</td><td class="mini">${s>60?'дозаказать, если поставщик даёт':s<25?'переместить в Есентай, показать VIP':'в норме'}</td></tr>`}).join('')}</tbody></table></div>`};

/* ===== Отчёты ===== */
SC.reports=()=>`<div class="hd"><div><h2>Отчёты</h2><p>Всё, что сейчас просите у 1С-программиста, — кнопкой. Выгрузка в Excel.</p></div></div>
 <div class="rgrid">${[['Продажи по дням и бутикам','выручка, чеки, средний чек, конверсия'],['Продажи по брендам и категориям','обувь, головные уборы, аксессуары'],['Сезон: продано из прихода','по моделям и поставщикам'],['Остатки на дату','в штуках и по себестоимости'],['Маржа','по моделям, брендам, бутикам'],['Возвраты','причины, бутики, поставщики'],['Продавцы','план, факт, бонус'],['Скидки','сколько отдали скидкой по каждой акции']].map(x=>`<div class="rep" onclick="toast('Отчёт «${x[0]}» сформирован — откройте или выгрузите в Excel.')"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div>`;

/* ===== Бухгалтеру ===== */
SC.buh=()=>`<div class="hd"><div><h2>Выгрузка бухгалтеру</h2><p>Бухгалтерия остаётся в 1С:Бухгалтерии. Продажи, возвраты и приходы за период выгружаются файлом в формате, который 1С загружает сама, — бухгалтеру не нужно ничего вбивать вручную. Если позже понадобится автоматический обмен — это отдельная интеграция.</p></div><div class="btns"><button class="bt p" onclick="toast('Выгрузка за октябрь сформирована: продажи 1 284 чека, возвраты 11, приходы 3. Файл для загрузки в 1С готов.')">Выгрузить октябрь</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Что</th><th>Как попадает в 1С</th><th>Период</th></tr></thead><tbody>${[['Розничные продажи по бутикам','файл загрузки в 1С: «Отчёт о розничных продажах»','день, неделя, месяц'],['Возвраты','файл загрузки в 1С','тот же'],['Приходы от поставщиков','файл загрузки: поступление товаров','по документам'],['Оплаты по способам','наличные, карта, Kaspi — сводом','день'],['Остатки на дату','Excel для сверки','любая дата']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div>
 ${said('«Бухгалтер… ей просто выгрузку делают с 1С-склада, какие продажи — для отчётов в налоговую.»','Та же выгрузка — из новой системы. Прямой обмен с 1С (800 000 ₸) нужен, только если файла окажется мало.')}`;

/* ===== Переезд с 1С ===== */
SC.move1c=()=>`<div class="hd"><div><h2>Переезд с 1С</h2><p>Перенос делаем мы, а не вручную ваша команда. Остатки, покупатели и история продаж выгружаются из текущей 1С и загружаются в систему. Потом — одна инвентаризация, чтобы сверить.</p></div></div>
 <div class="steps">${[['1','Выгрузка из 1С','модели, размеры, штрихкоды, остатки по бутикам, цены, покупатели'],['2','Загрузка и проверка','сверяем количество моделей и пар, суммы остатков'],['3','Инвентаризация','одна по каждому бутику — сканером, 1–2 часа'],['4','Две системы неделю','продажи идут в новой, 1С — для сверки'],['5','Переключение','1С остаётся только у бухгалтера']].map(s=>`<div><b>${s[0]}</b><h3>${s[1]}</h3><p>${s[2]}</p></div>`).join('')}</div>
 <div class="g2"><div class="pan"><h3>Что меняется для команды</h3>${['Касса — проще: скан, скидка сама, три кнопки оплаты','Приход — файл поставщика вместо ручных карточек','Возврат — по чеку за минуту','Программист — в Алматы, может приехать'].map(x=>`<div class="li ok"><i>+</i><span>${x}</span></div>`).join('')}</div>
 <div class="pan"><h3>Если с нами что-то случится</h3>${['Исходный код и ключи — у вас','Документация для любого программиста среднего уровня','Сервер — ваш, данные — ваши','Без абонентской платы'].map(x=>`<div class="li ok"><i>+</i><span>${x}</span></div>`).join('')}</div></div>
 ${said('«Наши айтишники продали компанию… офис не в Алматы, всё теперь только онлайн. А нам нужно, чтобы кто-то приехал и на месте разбирался.»')}`;

SC.roles=()=>`<div class="hd"><div><h2>Роли и права</h2><p>Каждый видит только своё.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Раздел</th>${Object.keys(ROLES).map(r=>`<th class="c">${r}</th>`).join('')}</tr></thead><tbody>${SEC.map(s=>s.sub.map(x=>`<tr><td>${x[1]}</td>${Object.values(ROLES).map(r=>`<td class="c">${r.s.includes(x[0])?'<i class="ck"></i>':''}</td>`).join('')}</tr>`).join('')).join('')}</tbody></table></div>`;

SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Стандартный пакет: всё, что в демо, перенос данных из 1С и выгрузки для бухгалтера. Система ваша — без абонентской платы.</p></div></div>
 <div class="pay3"><div><small>Стандартный пакет</small><b>2 500 000 ₸</b><span>всё, что в демо</span></div><div><small>Срок</small><b>4–6 недель</b><span>старт → база на сервере → полировка</span></div><div><small>Прямой обмен с 1С</small><b>+800 000 ₸</b><span>только если понадобится</span></div></div>
 <div class="g2"><div class="pan"><h3>Оплата</h3>${[['10% · старт','250 000 ₸'],['45% · база работает на вашем сервере','1 125 000 ₸'],['45% · после полировки и сдачи','1 125 000 ₸']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>После запуска</h3>${[['Исправление ошибок','3 месяца бесплатно'],['Запас на ваши правки','10–15% в пакете'],['Доработки','по часам'],['Абонентская плата','нет']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div></div>`;
let theme='light';

/* ===== Каркас ===== */
function act(k){toast('Готово.')}
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();const m=MODELS.find(x=>(x.id+' '+x.n+' '+x.brand).toLowerCase().includes(q));if(m&&allowed('catalog')){curM=m.id;go('catalog');return}const c=CLIENTS.find(x=>(x.n+x.ph).toLowerCase().includes(q));if(c&&allowed('clients')){go('clients');toast(esc(c.n)+' · размер '+c.size);return}toast('Не найдено. Попробуйте: «Casadei», «ботфорты», «Алия».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;setMe();if(!allowed(cur))cur=ROLES[role].s[0];build()}
function setMe(){document.getElementById('me').textContent=ROLES[role].av;const n=document.getElementById('mename');if(n)n.innerHTML=`<b>${esc(ROLES[role].n)}</b><small>${esc(role)}</small>`}
function switchRole(k){role=k;setMe();const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){const cnt={sale:ORDERS.filter(o=>o.st==='new').length,goods:INCOME.filter(x=>x.st==='new').length+MOVES.filter(m=>m.st==='new').length,team:TASKS.filter(t=>t.st==='check').length};
 document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="ri ${s.k===SECOF[cur]?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><span>${s.n}</span>${cnt[s.k]?`<em>${cnt[s.k]}</em>`:''}</a>`).join('');
 const S=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=S.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.today;document.getElementById('ttl').textContent=SUBN[cur]||'Подиум';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme()}
const TOUR=[
 ['today','1 · Пульт собственника: выручка бутиков, конверсия, продано из коллекции и что требует решения.'],
 ['income','2 · Приход коллекции: файл поставщика → карточки, размеры и штрихкоды одной кнопкой.'],
 ['labels','3 · Этикетки печатаются пачкой — с размером и ценой.'],
 ['pos','4 · Касса: скан, скидка по акции сама, оплата наличными, картой или Kaspi QR.'],
 ['returns','5 · Возврат по чеку за минуту — пара на остаток, деньги тем же способом.'],
 ['promo','6 · Скидки на период включаются и выключаются сами.'],
 ['stock','7 · Остатки по бутикам и размерам.'],
 ['moves','8 · Система подсказывает, что переместить между бутиками.'],
 ['season','9 · Сезон: какая модель продаётся, а какая останется на распродажу.'],
 ['orders','10 · Kaspi и Instagram в одной доске.'],
 ['clients','11 · Покупатели: размер, бренды, VIP, давно не была.'],
 ['buh','12 · Бухгалтеру — файл для загрузки в 1С, без ручного ввода.'],
 ['move1c','13 · Переезд с 1С делаем мы; программисты — в Алматы.'],
 ['launch','14 · Стоимость: 2 500 000 ₸, 4–6 недель.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен — всё кликается: касса, приход, возвраты, акции, перемещения.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Собственник');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
