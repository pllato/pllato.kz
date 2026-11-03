
const SC={};
/* ===== Пульт ===== */
SC.dash=()=>{const today=SHIFTS.filter(s=>s.d==='04.11'),yest=SHIFTS.filter(s=>s.d==='03.11');
 const made=yest.reduce((a,s)=>a+s.fact,0),br=yest.reduce((a,s)=>a+s.br,0);
 const month=96400,plan=100000;const debt=DEALERS.reduce((a,d)=>a+dDebt(d),0),cons=DEALERS.reduce((a,d)=>a+dLeft(d),0);
 const openO=ORDERS.filter(o=>!['paid'].includes(o.stg));const lowRaw=RAW.filter(r=>r.q<r.min*1.5);
 return `<div class="hd"><div><h2>Доброе утро, Дмитрий</h2><p>${TODAY}, ${NOW}. Цех, сырьё, склад, заказы и посредники — на одном экране. Раньше это было в Excel.</p></div><div class="btns"><button class="bt" onclick="xlsDash()">Excel</button><button class="bt p" onclick="newOrder()">+ Заказ</button></div></div>
 <div class="tape">
  <div><small>Сделано за ноябрь</small><b>${fmt(month)} шт</b>${bar(pct(month,plan),'g')}<span>план ${fmt(plan)} · можно до 170 000 при полной загрузке</span></div>
  <div><small>Вчера, 2 смены</small><b>${fmt(made)} шт</b><span>брак ${fmt(br)} шт · ${(br/made*100).toFixed(1).replace('.',',')}%</span></div>
  <div><small>Сырьё на складе</small><b>${kg(RAW[0].q+RAW[1].q)}</b><span>хватит на ~${Math.round((RAW[0].q+RAW[1].q)/2600)} дней работы</span></div>
  <div><small>Открытые заказы</small><b>${openO.length}</b><span>${tg(openO.reduce((a,o)=>a+oSum(o)-o.paid,0))} к оплате</span></div>
  <div><small>Долг посредников</small><b class="bad">${tg(debt)}</b><span>ещё у них на реализации ${tg(cons)}</span></div>
 </div>
 <div class="g21"><div>
  <div class="pan"><h3>Цех сейчас · дневная смена</h3><p>Операторы вносят выпуск с телефона — цифры обновляются в течение смены.</p>
   <div class="machs">${today.map(s=>`<a class="mch ${s.st}" onclick="go('prod')"><code>${s.m}</code><b>${s.st==='stop'?'Стоит':esc(TY(s.t).n)}</b>${s.st==='stop'?'<span>ждёт пресс-форму Я-50 · с 08:00</span>':`<span>${fn(s.op)} · ${fmt(s.fact)} из ${fmt(s.plan)}</span>${bar(pct(s.fact,s.plan),pct(s.fact,s.plan)>70?'g':'w')}`}</a>`).join('')}</div></div>
  <div class="pan"><h3>Склад готовых ящиков</h3><p>По каждому виду: сколько есть, сколько зарезервировано под заказы, сколько свободно.</p>
   <table class="t sm"><thead><tr><th>Вид</th><th class="r">На складе</th><th class="r">Резерв</th><th class="r">Свободно</th><th style="width:28%"></th></tr></thead><tbody>${TYPES.map(t=>`<tr onclick="go('stock')"><td><b>${t.id}</b> ${esc(t.n)}</td><td class="r">${fmt(STOCK[t.id])}</td><td class="r">${fmt(RES[t.id]||0)}</td><td class="r ${free(t.id)<t.min?'bad':''}">${fmt(free(t.id))}</td><td>${bar(pct(free(t.id),t.min*3),free(t.id)<t.min?'r':'g')}</td></tr>`).join('')}</tbody></table></div>
 </div><div>
  <div class="pan"><h3>Требует внимания</h3><div class="alist">
   <a onclick="go('raw')"><i class="dt w"></i><b>Краситель: ${kg(RAW[2].q)}</b><span>хватит на 6 дней — пора заказать</span></a>
   <a onclick="openDealer('P1')"><i class="dt r"></i><b>Бахыт должен ${tg(dDebt(DLR('P1')))}</b><span>продал больше, чем оплатил · лимит ${tg(DLR('P1').lim)}</span></a>
   <a onclick="openOrder('З-514')"><i class="dt g"></i><b>З-514 «Талгар Агро» готов к отгрузке</b><span>3 500 ящиков · счёт не оплачен</span></a>
   <a onclick="go('prod')"><i class="dt w"></i><b>ТПА-4 стоит с утра</b><span>смена без оператора · план Я-50 сорван</span></a>
   <a onclick="go('stock')"><i class="dt r"></i><b>Я-50 свободно ${fmt(free('Я-50'))} — ниже минимума</b><span>заказ З-516 на 3 000 шт · поставьте в план</span></a>
  </div></div>
  <div class="pan"><h3>Деньги за ноябрь</h3><div class="kv"><span>Отгружено клиентам</span><b>${tg(31800000)}</b></div><div class="kv"><span>Оплачено</span><b>${tg(26400000)}</b></div><div class="kv"><span>Себестоимость (сырьё + смены)</span><b>${tg(20900000)}</b></div><div class="kv"><span>Валовая прибыль</span><b class="ok">${tg(10900000)}</b></div></div>
 </div></div>
 ${said('«Сейчас я это всё сам делаю в Excel… мне нужно больше понимания — объёмы выросли.»','Пульт собирает всё сам: операторы, кладовщик и менеджер вносят свои данные, Дмитрий видит итог.')}`};

/* ===== Воронка ===== */
SC.funnel=()=>`<div class="hd"><div><h2>Воронка заказов</h2><p>Каждый клиент и каждый заказ — карточкой. Перетащите заказ на следующий этап или откройте его. Широкая сверху и узкая снизу: не все, кто спросил, покупают — это и видно.</p></div><div class="btns"><button class="bt" onclick="xlsOrders()">Excel</button><button class="bt p" onclick="newOrder()">+ Заказ</button></div></div>
 <div class="kanban">${STG.map(([k,n])=>{const x=ORDERS.filter(o=>o.stg===k);return `<div class="kcol" ondragover="event.preventDefault()" ondrop="dropO(event,'${k}')"><div class="kh"><b>${n}</b><span>${x.length}</span></div>${x.map(o=>`<div class="kc" draggable="true" ondragstart="event.dataTransfer.setData('t','${o.id}')" onclick="openOrder('${o.id}')"><code>${o.id} · ${o.date}</code><b>${esc(CL(o.cl).n)}</b><span>${o.items.map(([t,q])=>fmt(q)+' × '+t).join(', ')}</span><div class="kf"><em>${tg(oSum(o))}</em><i>${kg(oKg(o))}</i></div></div>`).join('')||'<div class="kempty">пусто</div>'}</div>`}).join('')}</div>`;
function dropO(e,k){const o=OR(e.dataTransfer.getData('t'));if(!o)return;o.stg=k;if(k==='make')o.items.forEach(([t,q])=>RES[t]=(RES[t]||0)+0);render();toast(`${o.id} → <b>${STN(k)}</b>${k==='ship'?'. Ящики списаны со склада, клиенту ушла накладная.':k==='make'?'. Мастер цеха получил задание в план.':''}`)}
function openOrder(id){curO=id;go('order')}
function newOrder(){const id='З-'+(518+ORDERS.length-7);ORDERS.unshift({id,cl:'C1',items:[['К-10',10000]],stg:'calc',date:'04.11',due:'—',pay:'—',paid:0,mgr:'AS'});curO=id;go('order');toast(`Заказ ${id} создан. Выберите клиента и ящики — калькулятор посчитает цену, вес и сырьё.`)}

/* ===== Заказ и калькулятор ===== */
SC.order=()=>{const o=OR(curO),c=CL(o.cl);const si=STG.findIndex(s=>s[0]===o.stg);const sum=oSum(o);
 return crumbs(['Воронка',"go('funnel')"],[o.id])+`<div class="hd"><div><h2>Заказ ${o.id} · ${esc(c.n)}</h2><p>${esc(c.type)} · ${c.city} · ${c.ph} · срок ${o.due}</p></div><div class="btns"><button class="bt" onclick="bill()">Счёт в WhatsApp</button><button class="bt" onclick="toMake()">В производство</button><button class="bt p" onclick="shipO()">Отгрузить</button></div></div>
 <div class="chainS">${STG.map(([k,n],i)=>`<a class="${i<si?'ok':i===si?'cur':''}" onclick="OR(curO).stg='${k}';render()">${n}</a>`).join('')}</div>
 <div class="g21"><div>
  <div class="pan"><h3>Калькулятор заказа</h3><p>Выберите вид и количество — цена со скидкой за объём, вес и сырьё считаются сразу. Скидка: от 3 000 шт — 5%, от 10 000 — 10%.</p>
   <div class="tw"><table class="t"><thead><tr><th>Вид ящика</th><th class="r">Кол-во</th><th class="r">Цена</th><th class="r">Скидка</th><th class="r">Сумма</th><th class="r">Сырьё</th><th class="r">Свободно</th><th></th></tr></thead><tbody>
   ${o.items.map(([t,q],i)=>{const T=TY(t),d=disc(q);return `<tr><td><select class="sel sm" onchange="OR(curO).items[${i}][0]=this.value;render()">${TYPES.map(x=>`<option value="${x.id}" ${x.id===t?'selected':''}>${x.id} · ${esc(x.n)}</option>`).join('')}</select></td><td class="r"><input class="qin" type="number" value="${q}" onchange="OR(curO).items[${i}][1]=+this.value||0;render()"></td><td class="r">${tg(T.price)}</td><td class="r">${d?'−'+d*100+'%':'—'}</td><td class="r"><b>${tg(T.price*q*(1-d))}</b></td><td class="r">${kg(T.w*q*(1+WASTE))}</td><td class="r ${free(t)<q?'bad':'ok'}">${fmt(free(t))}</td><td><button class="xb" onclick="OR(curO).items.splice(${i},1);render()">×</button></td></tr>`}).join('')}
   <tr><td colspan="8"><a class="lnk" onclick="OR(curO).items.push(['Я-60',1000]);render()">+ добавить вид ящика</a></td></tr>
   <tr class="total"><td>Итого</td><td class="r">${fmt(o.items.reduce((a,x)=>a+x[1],0))} шт</td><td></td><td></td><td class="r">${tg(sum)}</td><td class="r">${kg(oKg(o))}</td><td></td><td></td></tr></tbody></table></div>
   ${o.items.some(([t,q])=>free(t)<q)?`<div class="warnb">Части ящиков нет на складе. Не хватает: ${o.items.filter(([t,q])=>free(t)<q).map(([t,q])=>fmt(q-free(t))+' × '+t).join(', ')}. «В производство» — мастер получит задание, система посчитает смены: ~${Math.ceil(o.items.reduce((a,[t,q])=>a+Math.max(0,q-free(t))*TY(t).cyc,0)/3600/11)} смен на одном ТПА.</div>`:'<div class="okb">Всё есть на складе — можно отгружать сразу после оплаты.</div>'}</div>
  <div class="pan"><h3>История заказа</h3>${[[o.date+' 10:12','Асель','Заказ из WhatsApp: «'+o.items.map(([t,q])=>fmt(q)+' '+TY(t).n.toLowerCase()).join(', ')+'»'],[o.date+' 10:30','Система','Расчёт: '+tg(sum)+', сырья '+kg(oKg(o))],si>=2?[o.date+' 11:00','Асель','Счёт № '+o.id.slice(2)+' отправлен клиенту в WhatsApp']:null,si>=3?['03.11 08:00','Сергей','Поставлен в план цеха: ТПА-1, ТПА-3']:null].filter(Boolean).map(h=>`<div class="kv"><span><code>${h[0]}</code> ${h[1]}</span><b class="wrap">${esc(h[2])}</b></div>`).join('')}</div>
 </div><div>
  <div class="pan inv"><div class="invh"><b>СЧЁТ № ${o.id.slice(2)}</b><span>от ${o.date}.2026</span></div><p class="mini">Покупатель: ${esc(c.n)}</p>${o.items.map(([t,q])=>`<div class="kv"><span>${esc(TY(t).n)} × ${fmt(q)}</span><b>${tg(TY(t).price*q*(1-disc(q)))}</b></div>`).join('')}<div class="kv tot"><span>К оплате</span><b>${tg(sum)}</b></div><div class="kv"><span>Оплачено</span><b>${tg(o.paid)}</b></div><div class="kv"><span>Способ</span><b>${o.pay}</b></div><button class="bt full" onclick="payO()">Отметить оплату</button></div>
  <div class="pan"><h3>Клиент</h3><div class="kv"><span>Объём</span><b>${esc(c.vol)}</b></div><div class="kv"><span>Заказов</span><b>${ORDERS.filter(x=>x.cl===c.id).length}</b></div><div class="kv"><span>Ответственный</span><b>${esc(SF(o.mgr).n)}</b></div></div>
 </div></div>`};
function bill(){const o=OR(curO);o.stg='bill';render();toast(`Счёт на ${tg(oSum(o))} сформирован и ушёл клиенту в WhatsApp.`)}
function toMake(){const o=OR(curO);o.stg='make';o.items.forEach(([t,q])=>RES[t]=(RES[t]||0)+Math.min(q,free(t)));render();toast('Заказ в производстве: свободные ящики зарезервированы, недостающие — в плане цеха у мастера.')}
function payO(){const o=OR(curO);o.paid=oSum(o);if(o.stg!=='ship')o.stg='paid';render();toast('Оплата отмечена. Бухгалтер видит её в отчёте, долг клиента закрыт.')}
function shipO(){go('ship');toast('Оформите отгрузку: количество, машина, бой при погрузке.')}

/* ===== Клиенты ===== */
SC.clients=()=>`<div class="hd"><div><h2>Клиенты</h2><p>Фермеры, сады, дистрибьюторы. Кто, что берёт, когда сезон — чтобы заранее напомнить и запланировать цех.</p></div><div class="btns"><button class="bt" onclick="xls('Клиенты',['Клиент','Тип','Город','Телефон','Объём'],CLIENTS.map(c=>[c.n,c.type,c.city,c.ph,c.vol]))">Excel</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Что выращивает</th><th>Город</th><th>Объём</th><th class="r">Заказов</th><th class="r">Сумма</th></tr></thead><tbody>${CLIENTS.map(c=>{const os=ORDERS.filter(o=>o.cl===c.id);return `<tr onclick="${os[0]?`openOrder('${os[0].id}')`:''}"><td><b>${esc(c.n)}</b><span class="sub">${c.ph}</span></td><td>${esc(c.type)}</td><td>${c.city}</td><td class="mini">${esc(c.vol)}</td><td class="r">${os.length}</td><td class="r">${tg(os.reduce((a,o)=>a+oSum(o),0))}</td></tr>`}).join('')}</tbody></table></div>
 <div class="pan" style="margin-top:12px"><h3>Сезонность</h3><p>Клубника — май–июнь, малина — июль, яблоки — сентябрь. Система напомнит менеджеру связаться за месяц до сезона, а мастеру — нарастить корзинки на склад.</p><div class="season">${['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'].map((m,i)=>`<div><i style="height:${[10,12,25,55,95,100,80,60,85,50,20,12][i]}%"></i><span>${m}</span></div>`).join('')}</div></div>`;
