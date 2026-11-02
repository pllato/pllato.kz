
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
