
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
