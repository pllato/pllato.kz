/* TUCINO — система сети обувных магазинов: касса с бонусами, номенклатура по размерам и печать этикеток, поиск модели по фото и размеру во всех магазинах, остатки, приём новинок, перемещения, инвентаризация со сканером, клиенты и бонусная система, рассылки WhatsApp, заявки из WhatsApp, Instagram и Kaspi, магазины и филиалы, зарплата продавцов, переезд из UMAG и SAGI. Модели, цены, клиенты и суммы вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const TODAY='15.10.2026',NOW='16:00';
const LOGO_I='<img class="tlogo" src="/app/img/tucino/logo.jpg" alt="TUCINO">';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>«${q}»</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;

const SEC=[
 {k:'top',n:'Главное',sub:[['dash','Пульт собственника'],['pos','Касса']]},
 {k:'gd',n:'Товар',sub:[['catalog','Модели и размеры'],['find','Поиск модели'],['stock','Остатки по магазинам'],['labels','Этикетки и штрихкоды']]},
 {k:'wh',n:'Склад',sub:[['receiving','Приём новинок'],['transfer','Перемещения'],['inventory','Инвентаризация']]},
 {k:'cl',n:'Клиенты',sub:[['clients','Клиенты и бонусы'],['mailing','Рассылки WhatsApp'],['orders','Заявки: WhatsApp, Instagram, Kaspi']]},
 {k:'tm',n:'Компания',sub:[['branches','Магазины и доступы'],['salary','Зарплата продавцов'],['move','Переезд из UMAG и SAGI'],['launch','Стоимость и запуск']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Собственник':{av:'РБ',n:'Рустем',note:'Вся сеть: продажи, остатки, бонусы, деньги, зарплата',s:ALL.slice()},
 'Администратор магазина':{av:'АМ',n:'Айгерим · Mega Silk Way',note:'Только свой магазин: касса, остатки, перемещения, продавцы',s:['dash','pos','find','stock','transfer','inventory','clients','orders']},
 'Продавец':{av:'ПР',n:'Дана',note:'Касса под своим кодом, поиск модели, клиенты и бонусы',s:['pos','find','clients']},
 'Кладовщик':{av:'КЛ',n:'Ерлан',note:'Приём новинок, этикетки, перемещения, инвентаризация',s:['receiving','catalog','labels','transfer','inventory','stock']},
 'Kaspi и SMM':{av:'КС',n:'Мадина',note:'Заявки Kaspi, WhatsApp, Instagram; рассылки',s:['orders','mailing','find','clients']},
 'Бухгалтер':{av:'БХ',n:'Сауле',note:'Продажи, кассы, зарплата',s:['dash','salary','pos']}
};
let role='Собственник',cur='dash',theme='light';

/* Магазины и склад */
let SHOPS=[['MG','ТРЦ Mega Silk Way','Айгерим'],['AP','ТРЦ Asia Park','Жанна'],['WH','Склад','Ерлан']];
const SN=k=>(SHOPS.find(s=>s[0]===k)||['',k])[1];
const SIZES=[35,36,37,38,39,40,41];
/* Модели: остатки по размерам и магазинам */
const MODELS=[
 {a:'TC-2481',n:'Ботильоны на каблуке, кожа',c:'чёрный',cat:'Ботильоны',pr:48900,sea:'Осень–зима 26',col:'#1c1c1c'},
 {a:'TC-2477',n:'Челси, замша',c:'бежевый',cat:'Ботинки',pr:42900,sea:'Осень–зима 26',col:'#c9a77c'},
 {a:'TC-2465',n:'Лоферы, лак',c:'бордо',cat:'Лоферы',pr:36900,sea:'Осень 26',col:'#6b1e2a'},
 {a:'TC-2459',n:'Сапоги ботфорты, эластик',c:'чёрный',cat:'Сапоги',pr:64900,sea:'Осень–зима 26',col:'#222'},
 {a:'TC-2452',n:'Кроссовки, кожа',c:'белый',cat:'Кроссовки',pr:39900,sea:'Всесезон',col:'#e9e6e0'},
 {a:'TC-2440',n:'Туфли лодочки, кожа',c:'нюд',cat:'Туфли',pr:34900,sea:'Всесезон',col:'#d9b59a'},
 {a:'TC-2431',n:'Сапоги на платформе',c:'коричневый',cat:'Сапоги',pr:58900,sea:'Осень–зима 26',col:'#5a3a26'},
 {a:'TC-2418',n:'Мюли, кожа',c:'чёрный',cat:'Мюли',pr:29900,sea:'Весна 26',col:'#2a2a2a'}
];
const MD=a=>MODELS.find(m=>m.a===a);
let STK={};MODELS.forEach((m,i)=>{STK[m.a]={};SHOPS.forEach((s,j)=>{STK[m.a][s[0]]=SIZES.map((z,k)=>Math.max(0,((i*7+j*5+k*3)%6)-(j===2?-2:1)-(k===0||k===6?1:0)))})});
const bc=(a,z)=>'48700'+a.replace(/\D/g,'')+String(z);
let curModel='TC-2481';
/* Клиенты и бонусы */
let CLIENTS=[
 {ph:'+7 701 *** 45 12',n:'Айгуль Сейткали',bon:6840,buys:7,sum:312400,last:'12.10',bd:'18.10',lvl:'Gold'},
 {ph:'+7 777 *** 08 33',n:'Динара Абенова',bon:2150,buys:3,sum:118700,last:'02.10',bd:'03.11',lvl:'Silver'},
 {ph:'+7 705 *** 77 01',n:'Мадина Жумабаева',bon:940,buys:1,sum:48900,last:'15.10',bd:'21.10',lvl:'Base'},
 {ph:'+7 702 *** 64 18',n:'Асель Тулеуова',bon:4320,buys:5,sum:226500,last:'27.09',bd:'09.12',lvl:'Gold'},
 {ph:'+7 707 *** 50 44',n:'Жанар Омарова',bon:1280,buys:2,sum:72800,last:'10.08',bd:'16.10',lvl:'Silver'},
 {ph:'+7 747 *** 26 61',n:'Камила Сеитова',bon:0,buys:0,sum:0,last:'—',bd:'—',lvl:'Base'}
];
const LVL={Base:5,Silver:7,Gold:10};
/* Касса */
let CART=[],CCL=null,USEBON=0,SELLER='Дана · код 214';
let SALES=[['15.10 15:52','MG','Дана','TC-2481 · 38','48 900','Kaspi QR','Айгуль Сейткали'],['15.10 15:31','AP','Алина','TC-2452 · 37','39 900','карта','—'],['15.10 15:12','MG','Аружан','TC-2465 · 36 + уход','41 400','наличные','Динара Абенова'],['15.10 14:48','AP','Алина','TC-2477 · 39','42 900','Kaspi QR','Асель Тулеуова']];
/* Заявки */
let ORDERS=[['K-58412','Kaspi','TC-2481 · 37','48 900','новый','Мадина','заберёт в Mega Silk Way'],['WA-1931','WhatsApp','Челси бежевые, 38 — есть?','—','ответили','Мадина','отправили фото и наличие'],['IG-0877','Instagram','Ботфорты 39','64 900','резерв','Мадина','резерв в Asia Park до 18:00'],['K-58399','Kaspi','TC-2452 · 38','39 900','выдан','Айгерим','выдан в Mega Silk Way'],['WA-1925','WhatsApp','Лоферы бордо 36','36 900','оплачен','Мадина','доставка курьером']];
let AUDIT=[];

const SC={};
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
const sw=m=>`<span class="sw" style="background:${m.col}"></span>`;
const tot=(a,s)=>STK[a][s].reduce((x,y)=>x+y,0);
const totAll=a=>SHOPS.reduce((x,s)=>x+tot(a,s[0]),0);

SC.dash=()=>`<div class="hd"><div><h2>Пульт собственника · ${TODAY}</h2><p>Продажи каждого магазина сегодня и за месяц, средний чек, бонусы, заказы Kaspi и что заканчивается на складе — с телефона, в любом месте.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('pos')"><small>Продажи сегодня</small><b class="g">${tg(684300)}</b><span>Mega Silk Way 412 600 · Asia Park 271 700</span></div>
  <div class="clk"><small>Чеков сегодня</small><b>17</b><span>средний чек ${tg(40250)}</span></div>
  <div class="clk" onclick="go('orders')"><small>Заявки Kaspi, WhatsApp, Instagram</small><b class="a">${ORDERS.filter(o=>o[4]!=='выдан').length}</b><span>1 новый заказ Kaspi</span></div>
  <div class="clk" onclick="go('clients')"><small>Бонусов списано</small><b>${tg(18400)}</b><span>начислено ${tg(34200)}</span></div>
  <div class="clk"><small>Октябрь</small><b>${tg(9846000)}</b><span>+12% к сентябрю</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Продажи по магазинам · октябрь, млн ₸</h3>${bars([['ТРЦ Mega Silk Way',5.92,'5,92'],['ТРЦ Asia Park',3.41,'3,41'],['Kaspi магазин',0.52,'0,52']])}<h3 style="margin-top:14px">Хиты месяца</h3>${bars([['Ботильоны TC-2481',46],['Челси TC-2477',38],['Кроссовки TC-2452',31],['Ботфорты TC-2459',22]])}</div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="go('stock')"><i></i><div><b>Ботильоны TC-2481 · 37: остался 1 пара во всей сети</b><span>самый ходовой размер — заказать у поставщика</span></div></div>
  <div class="rf" onclick="go('transfer')"><i></i><div><b>Перемещение склад → Asia Park не принято</b><span>12 пар отправлены вчера</span></div></div>
  <div class="rf" onclick="go('orders')"><i></i><div><b>Новый заказ Kaspi K-58412</b><span>TC-2481 · 37 — подтвердить до 18:00</span></div></div>
  <div class="rf" onclick="go('mailing')"><i></i><div><b>3 клиентки с днём рождения на неделе</b><span>поздравление с бонусом уйдёт автоматически</span></div></div></div></div>
 ${said('Чтобы было удобнее, чем UMAG','Сначала воспроизводим то, к чему вы привыкли, потом на демо вы говорите, что сделать удобнее.')}`;

/* Касса */
let POSQ='';
function posAdd(a,z){const m=MD(a);CART.push({a,z,n:m.n,pr:m.pr});render()}
function posClient(i){CCL=CCL===i?null:i;USEBON=0;render()}
function posPay(how){if(!CART.length){toast('Добавьте товар.');return}const sum=CART.reduce((x,c)=>x+c.pr,0)-USEBON;const c=CCL!=null?CLIENTS[CCL]:null;let add=0;
 if(c){c.bon-=USEBON;add=Math.round(sum*LVL[c.lvl]/100);c.bon+=add;c.buys++;c.sum+=sum;c.last=TODAY.slice(0,5)}
 CART.forEach(x=>{const s=STK[x.a].MG,k=SIZES.indexOf(x.z);if(s[k]>0)s[k]--});
 SALES.unshift([TODAY.slice(0,5)+' '+NOW,'MG',SELLER.split(' ')[0],CART.map(x=>x.a+' · '+x.z).join(', '),fmt(sum),how,c?c.n:'—']);
 toast(`Чек ${tg(sum)} · ${how}. ${c?`Начислено ${fmt(add)} бонусов, баланс ${fmt(c.bon)}. `:''}Остаток списан с Mega Silk Way.`);CART=[];USEBON=0;CCL=null;render()}
SC.pos=()=>{const sum=CART.reduce((x,c)=>x+c.pr,0),c=CCL!=null?CLIENTS[CCL]:null,maxB=c?Math.min(c.bon,Math.round(sum*0.3)):0;
 return `<div class="hd"><div><h2>Касса · ТРЦ Mega Silk Way</h2><p>Каждый продавец входит под своим кодом — продажа записывается на него. Пробили модель и размер, нашли клиента по телефону — бонусы списываются и начисляются сами. Оплата Kaspi QR, картой или наличными.</p></div><div class="btns"><span class="seller">👤 ${SELLER}</span></div></div>
 <div class="posw"><div class="pan"><div class="qin" style="margin:0 0 10px"><input placeholder="Сканируйте штрихкод или введите артикул / название" value="${esc(POSQ)}" onchange="POSQ=this.value;render()"></div>
  ${MODELS.filter(m=>!POSQ||(m.a+m.n).toLowerCase().includes(POSQ.toLowerCase())).slice(0,5).map(m=>`<div class="posm"><div>${sw(m)}<b>${m.a}</b> ${esc(m.n)} · ${m.c}<span class="pp">${tg(m.pr)}</span></div><div class="szs">${SIZES.map((z,k)=>{const q=STK[m.a].MG[k];return `<a class="${q?'':'off'}" ${q?`onclick="posAdd('${m.a}',${z})"`:''}>${z}<em>${q}</em></a>`}).join('')}</div></div>`).join('')}</div>
 <div class="pan"><h3>Чек</h3>${CART.map((x,i)=>`<div class="kv"><span>${x.a} · ${x.z} · ${esc(x.n)}</span><b>${tg(x.pr)} <a class="rm" onclick="CART.splice(${i},1);render()">✕</a></b></div>`).join('')||'<p class="hint">Нажмите на размер слева или отсканируйте штрихкод.</p>'}
  <h3 style="margin-top:12px">Клиент</h3><div class="pcl">${CLIENTS.slice(0,4).map((x,i)=>`<a class="${CCL===i?'on':''}" onclick="posClient(${i})">${x.ph}<span>${esc(x.n)} · ${fmt(x.bon)} б.</span></a>`).join('')}</div>
  ${c?`<div class="kv"><span>Бонусы клиента · ${c.lvl}, ${LVL[c.lvl]}%</span><b>${fmt(c.bon)}</b></div><label class="ck"><input type="checkbox" ${USEBON?'checked':''} onchange="USEBON=this.checked?${maxB}:0;render()"> Списать ${fmt(maxB)} бонусами (до 30% чека)</label>`:''}
  <div class="kv on"><span><strong>К оплате</strong></span><b>${tg(sum-USEBON)}</b></div>
  <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="posPay('Kaspi QR')">Kaspi QR</button><button class="bt" onclick="posPay('карта')">Карта</button><button class="bt" onclick="posPay('наличные')">Наличные</button></div></div></div>
 <div class="pan"><h3>Последние продажи</h3><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Магазин</th><th>Продавец</th><th>Товар</th><th>Сумма</th><th>Оплата</th><th>Клиент</th></tr></thead><tbody>${SALES.slice(0,6).map(s=>`<tr><td class="mono">${s[0]}</td><td>${SN(s[1])}</td><td>${s[2]}</td><td>${s[3]}</td><td class="mono">${s[4]} ₸</td><td>${s[5]}</td><td>${esc(s[6])}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('В кассе несколько продавцов — каждый свой открывать?','Да: каждый продавец входит под своим кодом, продажи и зарплата считаются на него.')}`};

/* Модели и размеры */
SC.catalog=()=>{const m=MD(curModel);
 return `<div class="hd"><div><h2>Модели и размеры</h2><p>Создаёте модель один раз — система сама делает карточки на каждый размер со своим штрихкодом. Не нужно заводить 400 карточек руками: модель × размеры = готово, этикетки печатаются пачкой.</p></div><div class="btns"><button class="bt p" onclick="card('newmodel')">+ Модель</button></div></div>
 <div class="g2 g21"><div class="pan"><div class="tw"><table class="t"><thead><tr><th>Модель</th><th>Категория</th><th>Цена</th><th>Сезон</th><th>Пар в сети</th></tr></thead><tbody>${MODELS.map(x=>`<tr class="clk ${x.a===curModel?'sel':''}" onclick="curModel='${x.a}';render()"><td>${sw(x)}<b>${x.a}</b> ${esc(x.n)}<br><small>${x.c}</small></td><td>${x.cat}</td><td class="mono">${tg(x.pr)}</td><td>${x.sea}</td><td class="mono">${totAll(x.a)}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><div class="mph" style="--mc:${m.col}"><span>${m.cat}</span></div><h3>${m.a} · ${esc(m.n)}</h3><div class="kv"><span>Цвет</span><b>${m.c}</b></div><div class="kv"><span>Цена</span><b>${tg(m.pr)}</b></div><h3 style="margin-top:10px">Размеры и штрихкоды</h3>${SIZES.map(z=>`<div class="kv"><span>${z} · <span class="mono">${bc(m.a,z)}</span></span><b>${SHOPS.map(s=>STK[m.a][s[0]][SIZES.indexOf(z)]).reduce((x,y)=>x+y,0)} пар</b></div>`).join('')}<button class="bt sm" onclick="go('labels')">Печать этикеток →</button></div></div>
 ${said('Мы на каждую обувь создаём сами новую карточку… одна обувь — пять размеров, на каждый разные коды создаём, распечатываем, клеим')}`};

/* Поиск модели */
let FQ='',FZ=0;
SC.find=()=>{const L=MODELS.filter(m=>!FQ||(m.a+m.n+m.c+m.cat).toLowerCase().includes(FQ.toLowerCase()));
 return `<div class="hd"><div><h2>Поиск модели</h2><p>Покупатель показывает фото или спрашивает размер — продавец за секунды видит модель и где она есть: в каком магазине, на складе, сколько пар каждого размера. Можно сразу отложить или переместить.</p></div></div>
 <div class="flt"><input placeholder="Название, цвет, артикул — или загрузите фото" value="${esc(FQ)}" onchange="FQ=this.value;render()"><select onchange="FZ=+this.value;render()"><option value="0">Любой размер</option>${SIZES.map(z=>`<option ${FZ===z?'selected':''}>${z}</option>`).join('')}</select><button class="bt" onclick="act('Фото с телефона покупателя: система показывает похожие модели из вашего каталога.')">📷 По фото</button></div>
 <div class="fgrid">${L.map(m=>`<div class="fcard"><div class="mph sm" style="--mc:${m.col}"><span>${m.cat}</span></div><b>${m.a} · ${esc(m.n)}</b><small>${m.c} · ${tg(m.pr)}</small><table class="szt"><tr><td></td>${SIZES.map(z=>`<th class="${FZ===z?'hl':''}">${z}</th>`).join('')}</tr>${SHOPS.map(s=>`<tr><td>${s[1].replace('ТРЦ ','')}</td>${STK[m.a][s[0]].map((q,k)=>`<td class="${q?'':'z'} ${FZ===SIZES[k]?'hl':''}">${q||'·'}</td>`).join('')}</tr>`).join('')}</table><div class="btns l"><button class="bt sm" onclick="act('Пара отложена на 2 часа для покупателя — видно всем магазинам.')">Отложить</button><button class="bt sm" onclick="go('transfer')">Переместить</button></div></div>`).join('')}</div>
 ${said('Девочки одну модель ищут… автоматизации нету, поэтому по картинкам ищу — этот размер')}`};

/* Остатки */
SC.stock=()=>`<div class="hd"><div><h2>Остатки по магазинам</h2><p>Каждая модель по размерам во всех магазинах и на складе. Красным — размеры, которых осталось мало во всей сети: пора дозаказать или переместить.</p></div><div class="btns"><button class="bt" onclick="act('Excel остатков скачан.')">⇩ Excel</button></div></div>
 <div class="pan"><div class="tw"><table class="t stk"><thead><tr><th>Модель</th><th>Где</th>${SIZES.map(z=>`<th>${z}</th>`).join('')}<th>Всего</th></tr></thead><tbody>${MODELS.map(m=>SHOPS.map((s,j)=>`<tr>${j===0?`<td rowspan="3">${sw(m)}<b>${m.a}</b><br><small>${esc(m.n)}</small></td>`:''}<td>${s[1]}</td>${STK[m.a][s[0]].map((q,k)=>{const all=SHOPS.reduce((x,t)=>x+STK[m.a][t[0]][k],0);return `<td class="mono ${all<=1?'low':''}">${q||'·'}</td>`}).join('')}<td class="mono"><b>${tot(m.a,s[0])}</b></td></tr>`).join('')).join('')}</tbody></table></div></div>`;

/* Этикетки */
let LBL={};
SC.labels=()=>{const m=MD(curModel);
 return `<div class="hd"><div><h2>Этикетки и штрихкоды</h2><p>Выбрали модель, указали сколько пар каждого размера — этикетки печатаются одной пачкой на обычном или этикеточном принтере. Штрихкод читает касса и сканер инвентаризации.</p></div><div class="btns"><button class="bt p" onclick="act('Отправлено на печать: этикетки ${m.a}.')">🖨 Печать</button></div></div>
 <div class="seg">${MODELS.map(x=>`<a class="${x.a===curModel?'on':''}" onclick="curModel='${x.a}';render()">${x.a}</a>`).join('')}</div>
 <div class="lbls">${SIZES.map(z=>`<div class="lbl"><b>TUCINO</b><span>${m.a} · ${esc(m.n)}</span><span>${m.c} · размер <strong>${z}</strong></span><div class="bars">${bc(m.a,z).split('').map((d,i)=>`<i style="width:${1+(+d%3)}px;margin-right:${1+((+d+i)%2)}px"></i>`).join('')}</div><em class="mono">${bc(m.a,z)}</em><strong class="lp">${tg(m.pr)}</strong></div>`).join('')}</div>`};

/* Приём новинок */
let RCV=[['TC-2481',[0,2,4,4,3,2,0]],['TC-2477',[0,1,3,3,2,1,0]],['TC-2459',[0,1,2,3,2,1,1]]],RCVDONE=false;
SC.receiving=()=>`<div class="hd"><div><h2>Приём новинок</h2><p>Пришла поставка — кладовщик сканирует коробки или вводит количество по размерам. Товар встаёт на склад, этикетки печатаются, а распределение по магазинам предлагается само — по тому, что где продаётся.</p></div><div class="btns"><button class="bt p" ${RCVDONE?'disabled':''} onclick="rcvDo()">${RCVDONE?'✓ Принято':'Принять на склад'}</button></div></div>
 <div class="pan"><h3>Поставка № П-0318 · поставщик «Guangzhou Shoes» · 15.10</h3><div class="tw"><table class="t stk"><thead><tr><th>Модель</th>${SIZES.map(z=>`<th>${z}</th>`).join('')}<th>Пар</th><th>Себестоимость</th></tr></thead><tbody>${RCV.map(r=>{const m=MD(r[0]);return `<tr><td>${sw(m)}<b>${m.a}</b> ${esc(m.n)}</td>${r[1].map(q=>`<td class="mono">${q||'·'}</td>`).join('')}<td class="mono"><b>${r[1].reduce((x,y)=>x+y,0)}</b></td><td class="mono">${tg(Math.round(m.pr*0.42)*r[1].reduce((x,y)=>x+y,0))}</td></tr>`}).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Предложение: куда отправить</h3><div class="kv"><span>ТРЦ Mega Silk Way — продаёт ботильоны в 1,7 раза быстрее</span><b>20 пар</b></div><div class="kv"><span>ТРЦ Asia Park</span><b>14 пар</b></div><div class="kv"><span>Оставить на складе</span><b>10 пар</b></div><button class="bt sm" onclick="go('transfer')">Создать перемещения →</button></div>
 ${said('Склад хранения, где новинки, новые товары принимаем, там перемещение')}`;
function rcvDo(){RCV.forEach(r=>r[1].forEach((q,k)=>STK[r[0]].WH[k]+=q));RCVDONE=true;render();toast('Поставка принята: 44 пары на складе, этикетки готовы к печати.')}

/* Перемещения */
let TRF=[['ПМ-112','WH','AP','12 пар · ботильоны, челси','в пути','14.10 17:20'],['ПМ-111','WH','MG','8 пар · кроссовки','принято','14.10 11:05'],['ПМ-110','AP','MG','1 пара · TC-2481 · 37 под покупателя','принято','13.10 15:40']];
SC.transfer=()=>`<div class="hd"><div><h2>Перемещения</h2><p>Склад → магазин или магазин → магазин. Отправитель отмечает «отправлено», получатель сканирует и нажимает «принято». Пока не принято — товар числится «в пути», и видно, где он.</p></div><div class="btns"><button class="bt p" onclick="trfNew()">+ Перемещение</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>№</th><th>Откуда → куда</th><th>Что</th><th>Отправлено</th><th>Статус</th></tr></thead><tbody>${TRF.map((t,i)=>`<tr class="${t[4]==='в пути'?'rowwarn':''}"><td class="mono">${t[0]}</td><td>${SN(t[1])} → ${SN(t[2])}</td><td>${t[3]}</td><td class="mono">${t[5]}</td><td>${t[4]==='в пути'?`<button class="bt sm" onclick="TRF[${i}][4]='принято';render();toast('Принято в ${SN(t[2])} — остатки обновлены.')">Принять</button>`:tag(t[4],'g')}</td></tr>`).join('')}</tbody></table></div></div>`;
function trfNew(){TRF.unshift(['ПМ-'+(113+TRF.length-3),'WH','MG','20 пар · новинки П-0318','в пути',TODAY.slice(0,5)+' '+NOW]);render();toast('Перемещение создано: склад → Mega Silk Way. Ждёт приёма в магазине.')}

/* Инвентаризация */
let INV=[['TC-2481 · 38','MG',3,3,''],['TC-2477 · 39','MG',2,1,''],['TC-2452 · 37','MG',4,4,''],['TC-2465 · 36','MG',2,2,''],['TC-2459 · 38','MG',1,0,'']],INVSCAN=37;
const REAS=['','хищение','естественная убыль (брак)','переместили, не записали','недостача'];
SC.inventory=()=>`<div class="hd"><div><h2>Инвентаризация · ТРЦ Mega Silk Way</h2><p>Продавец сканирует пары камерой телефона или сканером — система сравнивает с учётом. По каждому расхождению указывают причину: хищение, брак, переместили и не записали, недостача. Итог видит собственник.</p></div></div>
 <div class="wid"><div><small>Отсканировано</small><b>${INVSCAN} из 214</b><span>камера телефона или сканер</span></div><div><small>Расхождений</small><b class="w">${INV.filter(r=>r[2]!==r[3]).length}</b><span>на ${tg(INV.filter(r=>r[2]!==r[3]).reduce((x,r)=>x+(r[2]-r[3])*MD(r[0].split(' ')[0]).pr,0))}</span></div><div><small>Причина указана</small><b>${INV.filter(r=>r[2]!==r[3]&&r[4]).length} из ${INV.filter(r=>r[2]!==r[3]).length}</b><span></span></div></div>
 <div class="g2 g21"><div class="pan"><div class="tw"><table class="t"><thead><tr><th>Товар</th><th>По учёту</th><th>Факт</th><th>Разница</th><th>Причина</th></tr></thead><tbody>${INV.map((r,i)=>`<tr class="${r[2]!==r[3]?'rowwarn':''}"><td>${r[0]}</td><td class="mono">${r[2]}</td><td class="mono">${r[3]}</td><td class="mono ${r[2]!==r[3]?'neg':''}">${r[3]-r[2]||'—'}</td><td>${r[2]!==r[3]?`<select onchange="INV[${i}][4]=this.value;render()">${REAS.map(x=>`<option ${r[4]===x?'selected':''}>${x||'выберите'}</option>`).join('')}</select>`:'✓'}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan scan"><h3>Сканер</h3><div class="cam"><span>наведите камеру на штрихкод</span></div><button class="bt p" onclick="INVSCAN++;render();toast('Пара TC-2481 · 39 отсканирована.')">Сканировать</button></div></div>
 ${said('Инвентаризация — как будет: через телефон, терминал данных или сканер? В UMAG камера открывается, можно сканировать','Так же: камера телефона или сканер.')}`;

/* Клиенты и бонусы */
SC.clients=()=>`<div class="hd"><div><h2>Клиенты и бонусы</h2><p>Своя бонусная система вместо SAGI: клиент — по номеру телефона, с первой покупки 5% бонусами, дальше уровни. Бонусы на день рождения, карта клиента в Apple Wallet и Google Wallet. Платите один раз — без ежемесячной подписки.</p></div><div class="btns"><button class="bt" onclick="act('Excel клиентов скачан.')">⇩ Excel</button></div></div>
 <div class="wid"><div><small>Клиентов в базе</small><b>5 124</b><span>перенесём из SAGI и UMAG</span></div><div><small>Начислено бонусов, октябрь</small><b>${tg(412000)}</b><span>списано ${tg(268000)}</span></div><div><small>Повторные покупки</small><b class="g">38%</b><span>клиентов купили 2+ раза</span></div><div><small>Дни рождения на неделе</small><b>3</b><span>бонус +5 000 уйдёт сам</span></div></div>
 <div class="g2 g21"><div class="pan"><div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Уровень</th><th>Бонусы</th><th>Покупок</th><th>Сумма</th><th>Последняя</th><th>ДР</th></tr></thead><tbody>${CLIENTS.map(c=>`<tr><td><b>${esc(c.n)}</b><br><small>${c.ph}</small></td><td>${tag(c.lvl+' · '+LVL[c.lvl]+'%',c.lvl==='Gold'?'w':c.lvl==='Silver'?'i':'')}</td><td class="mono">${fmt(c.bon)}</td><td class="mono">${c.buys}</td><td class="mono">${tg(c.sum)}</td><td class="mono">${c.last}</td><td class="mono">${c.bd}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Правила бонусов</h3><div class="kv"><span>Первая покупка</span><b>5% бонусами</b></div><div class="kv"><span>Silver — от 100 000 ₸ покупок</span><b>7%</b></div><div class="kv"><span>Gold — от 250 000 ₸</span><b>10%</b></div><div class="kv"><span>Списание</span><b>до 30% чека</b></div><div class="kv"><span>День рождения</span><b>+5 000 бонусов</b></div><div class="wcard"><b>TUCINO</b><span>Айгуль Сейткали · Gold</span><em>6 840 бонусов</em><small>Apple Wallet · Google Wallet</small></div></div></div>
 ${said('Бонусная система: клиент покупает, мы добавляем в базу, и с первой покупки сразу пять процентов бонусов даём')}`;

/* Рассылки */
let MLD=0;
SC.mailing=()=>`<div class="hd"><div><h2>Рассылки WhatsApp</h2><p>Раз в 3–4 месяца — новая коллекция всей базе, чтобы клиенты, купившие год-два назад, не забывали. Плюс автоматические: день рождения с бонусами, «бонусы сгорают через 7 дней», «ваша модель снова в наличии».</p></div></div>
 <div class="g2"><div class="pan"><h3>Рассылка: новая коллекция</h3><div class="kv"><span>Кому</span><b>все клиенты · 5 124</b></div><div class="kv"><span>Канал</span><b>официальный WhatsApp (WABA)</b></div><div class="voice">Здравствуйте, {имя}! В TUCINO новая коллекция осень–зима: ботильоны, челси и ботфорты. У вас {бонусы} бонусов — ими можно оплатить до 30% покупки. Ждём в Mega Silk Way и Asia Park!</div><button class="bt p" ${MLD?'disabled':''} onclick="MLD=1;render();toast('Рассылка запланирована: 5 124 сообщения, по 20 в минуту.')">${MLD?'✓ Запланирована':'Отправить'}</button></div>
 <div class="pan"><h3>Автоматические сообщения</h3>${[['День рождения','за 3 дня · +5 000 бонусов',1],['Бонусы сгорают','за 7 дней до сгорания',1],['Модель снова в наличии','если клиент спрашивал размер',1],['Спасибо за покупку','через 1 день · просьба об отзыве',0]].map(r=>`<div class="kv"><span>${r[0]}<small>${r[1]}</small></span><b>${r[2]?tag('включено','g'):tag('выключено','')}</b></div>`).join('')}<p class="hint">Для приветствий и ответов — обычный WhatsApp через Green API (около 5 000 ₸ в месяц). Для рассылки по всей базе — официальный WhatsApp (WABA), оплата за сообщения по тарифу Meta.</p></div></div>
 ${said('Есть клиенты, которые два года назад купили, — чтобы они не забывали нас, предупреждать, что у нас новая коллекция')}`;

/* Заявки */
SC.orders=()=>`<div class="hd"><div><h2>Заявки: WhatsApp, Instagram, Kaspi</h2><p>Заказы Kaspi магазина, вопросы в WhatsApp и Instagram Direct — в одном списке. Менеджер сразу видит наличие размера во всех магазинах, отвечает и ставит резерв.</p></div></div>
 <div class="kb k5">${['новый','ответили','резерв','оплачен','выдан'].map(s=>`<div class="kc"><div class="kh"><b>${s}</b><span>${ORDERS.filter(o=>o[4]===s).length}</span></div>${ORDERS.filter(o=>o[4]===s).map(o=>`<div class="kd"><div class="kt"><b>${o[0]}</b><span class="src">${o[1]}</span></div><div class="kr">${esc(o[2])}</div><div class="km">${esc(o[6])}</div><div class="kf"><span>${o[5]}</span><b>${o[3]!=='—'?o[3]+' ₸':''}</b></div></div>`).join('')||'<div class="kempty">пусто</div>'}</div>`).join('')}</div>
 ${said('Через Instagram тоже продаём и хотели Kaspi магазин подключить')}`;

/* Магазины и доступы */
SC.branches=()=>`<div class="hd"><div><h2>Магазины и доступы</h2><p>Новый магазин или склад — кнопкой «+», без программиста: запас до 10 точек. Администратор видит только свой магазин, продавец — кассу и поиск, собственник — всю сеть.</p></div><div class="btns"><button class="bt p" onclick="addShop()">+ Магазин</button></div></div>
 <div class="g3">${SHOPS.map(s=>`<div class="pan"><h3>${s[1]}</h3><div class="kv"><span>${s[0]==='WH'?'Кладовщик':'Администратор'}</span><b>${s[2]}</b></div><div class="kv"><span>Пар на остатке</span><b>${fmt(MODELS.reduce((x,m)=>x+tot(m.a,s[0]),0))}</b></div><div class="kv"><span>${s[0]==='WH'?'Приём и отправка':'Продавцов'}</span><b>${s[0]==='WH'?'2 человека':'3'}</b></div></div>`).join('')}</div>
 <div class="pan"><h3>Кто что видит</h3><div class="tw"><table class="t"><thead><tr><th>Раздел</th><th>Собственник</th><th>Администратор</th><th>Продавец</th><th>Кладовщик</th><th>Kaspi и SMM</th><th>Бухгалтер</th></tr></thead><tbody>${[['Пульт и деньги сети','●','свой','—','—','—','●'],['Касса','●','●','●','—','—','○'],['Остатки','●','свой','поиск','●','поиск','—'],['Склад, приём, перемещения','●','свой','—','●','—','—'],['Клиенты и бонусы','●','●','●','—','●','—'],['Рассылки','●','—','—','—','●','—'],['Зарплата','●','—','своя','своя','своя','●']].map(r=>`<tr>${r.map((c,i)=>`<td${i?' class="mono"':''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="hint">● — видит и меняет · ○ — только смотрит · «свой» — только свой магазин.</p></div>
 ${said('Ещё хочу в Астане отдельно стоящий магазин открыть','Новый магазин добавляется кнопкой — сразу появляется в кассе, остатках и пульте.')}`;
function addShop(){const n=prompt('Название магазина','Отдельный магазин · ул. Кунаева');if(!n)return;const k='S'+SHOPS.length;SHOPS.splice(SHOPS.length-1,0,[k,n,'назначить']);MODELS.forEach(m=>STK[m.a][k]=SIZES.map(()=>0));render();toast('Магазин добавлен — он уже в кассе, остатках и пульте.')}

/* Зарплата */
SC.salary=()=>`<div class="hd"><div><h2>Зарплата продавцов · октябрь</h2><p>Каждая продажа записывается на продавца, который пробил чек. Зарплата считается сама: оклад плюс процент с продаж. Ставки задаёте вы.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Сотрудник</th><th>Магазин</th><th>Продажи</th><th>Оклад</th><th>% с продаж</th><th>Начислено</th></tr></thead><tbody>${[['Дана','MG',2184000,120000,3],['Аружан','MG',1962000,120000,3],['Айгерим (адм.)','MG',0,220000,1],['Алина','AP',1688000,120000,3],['Жанна (адм.)','AP',0,220000,1],['Ерлан','WH',0,180000,0]].map(r=>{const b=r[4]?(r[2]||(r[1]==='MG'?5920000:3410000))*r[4]/100:0;return `<tr><td><b>${r[0]}</b></td><td>${SN(r[1])}</td><td class="mono">${r[2]?tg(r[2]):'магазин'}</td><td class="mono">${tg(r[3])}</td><td class="mono">${r[4]}%</td><td class="mono"><b>${tg(r[3]+b)}</b></td></tr>`}).join('')}</tbody></table></div><p class="hint">Ставки — пример. Заведём ваши правила: проценты, планы, бонусы за выполнение.</p></div>`;

/* Переезд */
let MV=0;
SC.move=()=>`<div class="hd"><div><h2>Переезд из UMAG и SAGI</h2><p>Карточки заново заводить не нужно. Забираем номенклатуру, остатки и клиентов из UMAG — через его выгрузку или Excel, а если не дадут — считываем с экрана под вашим логином. Клиентов и бонусы — из SAGI. Потом сверяем количество.</p></div></div>
 <div class="mvs">${[['Номенклатура','модели, размеры, штрихкоды, цены'],['Остатки','по каждому магазину и складу'],['Клиенты и бонусы','5 000+ клиентов с балансами из SAGI'],['Сверка','сколько было — столько стало'],['Готово','UMAG и SAGI можно отключать']].map((s,i)=>`<div class="mv ${i<MV?'ok':i===MV?'on':''}" onclick="MV=${i};render()"><i>${i<MV?'✓':i+1}</i><b>${s[0]}</b><span>${s[1]}</span></div>`).join('')}</div>
 <div class="pan"><h3>Сверка</h3><div class="tw"><table class="t"><thead><tr><th>Что</th><th>Было</th><th>Стало</th><th></th></tr></thead><tbody>${[['Карточки товаров (модель × размер)','2 846'],['Пар на остатках','3 912'],['Клиенты','5 124'],['Бонусные балансы','5 124']].map(r=>`<tr><td>${r[0]}</td><td class="mono">${r[1]}</td><td class="mono">${MV>=3?r[1]:'—'}</td><td>${MV>=3?tag('совпадает ✓','g'):''}</td></tr>`).join('')}</tbody></table></div><button class="bt sm p" onclick="MV=Math.min(4,MV+1);render()">Следующий шаг →</button></div>
 ${said('Наша база, номенклатура, все товары в UMAG — их можно перевести или заново карточки создавать?','Переносим: через выгрузку UMAG или Excel; если доступа не дадут — считываем с экрана.')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Один платёж — программа ваша, без подписки. Касса и бонусная система — по символической цене, потому что берёте основной пакет: UMAG и SAGI больше не нужны.</p></div></div>
 <div class="pk1"><div><small>Итого</small><b>1 800 000 ₸</b><span>система 1 500 000 · касса 100 000 · бонусы 200 000</span></div><div><small>Срок</small><b>4–6 недель</b><span>около месяца при быстрых согласованиях</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>180 000 ₸</b><span>после демо · вернём, если демо не подойдёт</span></div><div><small>Ядро · 45%</small><b>810 000 ₸</b><span>после показа и утверждения ядра</span></div><div><small>Сдача · 45%</small><b>810 000 ₸</b><span>после всех правок и передачи</span></div></div>
 <div class="pan"><h3>Каждый месяц после запуска</h3><div class="kv"><span>Программа</span><b>0 ₸ — абонплаты нет</b></div><div class="kv"><span>Сервер</span><b>бесплатный тариф до 10 ГБ · потом ≈ 5 000 ₸ за 1 ТБ</b></div><div class="kv"><span>WhatsApp для ответов (Green API)</span><b>≈ 5 000 ₸ за номер</b></div><div class="kv"><span>Рассылки по базе (официальный WhatsApp)</span><b>по тарифу Meta за сообщения</b></div><div class="kv"><span>Instagram Direct</span><b>≈ 5–10 $</b></div><div class="kv"><span>UMAG и SAGI</span><b>больше не нужны</b></div></div>`;

/* Карточки */
const CARD={};
CARD.newmodel=()=>['Новая модель','Карточки на все размеры и штрихкоды создадутся сами',`<div class="form"><label>Артикул<input id="nm_a" value="TC-2490"></label><label>Название<input id="nm_n" value="Ботинки на шнуровке, кожа"></label><label>Цвет<input id="nm_c" value="чёрный"></label><label>Цена, ₸<input id="nm_p" type="number" value="45900"></label><label>Размеры от<input id="nm_f" type="number" value="36"></label><label>до<input id="nm_t" type="number" value="40"></label></div><button class="bt p" onclick="newModel()">Создать модель и размеры</button>`];
function newModel(){const v=k=>document.getElementById('nm_'+k).value.trim();const a=v('a')||'TC-2490';if(MD(a)){toast('Такой артикул уже есть.');return}const f=+v('f'),t=+v('t');MODELS.unshift({a,n:v('n'),c:v('c'),cat:'Ботинки',pr:+v('p')||0,sea:'Осень–зима 26',col:'#333'});STK[a]={};SHOPS.forEach(s=>STK[a][s[0]]=SIZES.map(()=>0));curModel=a;closeM();render();const n=SIZES.filter(z=>z>=f&&z<=t).length;toast(`Модель ${a}: создано ${n} карточек размеров со штрихкодами. Этикетки — в «Этикетках».`)}
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей программе здесь откроется форма.')}
function searchDemo(v){FQ=v||'';go('find')}

function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">TUCINO</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='orders'?'<em>'+ORDERS.filter(o=>o[4]==='новый').length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['pos','Касса'],['find','Поиск'],['stock','Остатки'],['clients','Клиенты']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'TUCINO';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: продажи каждого магазина, чеки, бонусы, Kaspi.'],
 ['pos','2 · Касса: продавец под своим кодом, бонусы клиента, Kaspi QR.'],
 ['catalog','3 · Модель один раз — карточки и штрихкоды на все размеры сами.'],
 ['find','4 · Поиск модели: где есть нужный размер — во всех магазинах.'],
 ['stock','5 · Остатки по размерам и магазинам.'],
 ['receiving','6 · Приём новинок и распределение по магазинам.'],
 ['inventory','7 · Инвентаризация камерой или сканером, причины расхождений.'],
 ['clients','8 · Своя бонусная система вместо SAGI.'],
 ['mailing','9 · Рассылки: новая коллекция, день рождения.'],
 ['orders','10 · Заявки Kaspi, WhatsApp, Instagram.'],
 ['launch','11 · 1,8 млн один раз: система + касса + бонусы.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
