
/* ===== Заявки ===== */
SC.leads=()=>`<div class="hd"><div><h2>Заявки</h2><p>Реклама, WhatsApp, звонки, сайт — заявки в одном списке с источником. Из заявки — заказ в один клик: клиент находится по телефону, если уже покупал, или заводится новый.</p></div></div>
 <div class="lead-l">${LEADS.map(l=>`<div class="ld ${l.st}"><div class="ldc">${esc(l.ch)}<small>${l.t}</small></div><div class="ldb"><b>${esc(l.name)}</b><span class="src">${esc(l.src)}</span><p>${esc(l.txt)}</p>
  ${l.st==='order'?`<span class="tag g">заказ ${esc(l.ord)}</span> ${ordL(l.ord)}`:`<div class="btns l"><button class="bt p" onclick="leadToOrder('${l.id}')">Создать заказ</button><button class="bt" onclick="go('calc')">Посчитать</button></div>`}</div></div>`).join('')}</div>
 <div class="note"><b>Воронки сейчас нет — теперь будет</b><p>Каждая заявка проходит этапы: заявка → расчёт → счёт → предоплата → производство → готово → остаток → отгрузка → получено. Видно, где заявки теряются и какой канал рекламы приносит заказы.</p></div>`;
function leadToOrder(id){const l=LEADS.find(x=>x.id===id);if(!l)return;const oid='Z-2026-'+(151+ORDERS.length-9);
 const cid='C'+(BCLIENTS.length+1);BCLIENTS.push({id:cid,n:l.name,kind:'Новый',city:'Астана',contact:l.ch,src:l.src,repeat:0,last:'—',avg:0,orders:0,debt:0,contract:false});
 ORDERS.unshift({id:oid,cl:cid,lines:[[/лотк/i.test(l.txt)?'LT01':'GK43',2000]],st:'new',d:TODAY,due:addDays(TODAY,7),pre:50,paid:0,deliv:'Самовывоз',mgr:'DN',note:'Из заявки: '+l.txt});
 l.st='order';l.ord=oid;curOrd=oid;go('border');toast(`Заказ ${oid} создан из заявки. Источник «${esc(l.src)}» сохранён — он попадёт в аналитику рекламы.`)}

/* ===== Воронка заказов ===== */
SC.bfunnel=()=>`<div class="hd"><div><h2>Воронка заказов</h2><p>Как у вас: стоимость → счёт → клиент оплачивает → заявка передаётся на производство → готово, сообщаем клиенту → он оплачивает остаток → самовывоз или доставка → клиент подтвердил, что получил. Карточки перетаскиваются.</p></div><div class="btns"><button class="bt p" onclick="go('calc')">+ Заказ</button></div></div>
 <div class="kanban">${BST.map(s=>{const c=ORDERS.filter(o=>o.st===s.k);return `<div class="kcol" ondragover="event.preventDefault();this.classList.add('over')" ondragleave="this.classList.remove('over')" ondrop="this.classList.remove('over');moveOrd(event.dataTransfer.getData('t'),'${s.k}')">
  <div class="khead" style="--c:${s.c}"><b>${s.n}</b><span>${c.length} · ${mln(c.reduce((a,o)=>a+oSum(o),0))}</span></div>
  ${c.map(o=>`<div class="kcard" draggable="true" ondragstart="event.dataTransfer.setData('t','${o.id}')" onclick="openOrd('${o.id}')"><span class="mono">${o.id}</span><b>${esc(BC(o.cl).n)}</b><span>${o.lines.map(l=>esc(PRD(l[0]).n)+' × '+fmt(l[1])).join('; ')}</span>
   <div class="km"><strong>${tg(oSum(o))}</strong><em class="${o.paid?'':'no'}">${o.paid?'оплачено '+pct(o.paid,oSum(o))+'%':'не оплачено'}</em></div><div class="kf"><span>до ${dd(o.due)} · ${esc(o.deliv)}</span>${o.due<TODAY&&o.st!=='got'?'<span class="neg">срок прошёл</span>':''}</div></div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>
 ${said('«Когда стоимость — счёт на оплату выставляет, клиент оплачивает. Оплата поступила — заявка передаётся на производство. Как готова — клиенту сообщаем, что готова, он оплачивает остаток» · «Отслеживать, когда он получил»')}`;
function moveOrd(id,k){const o=OR(id);if(!o||o.st===k)return;const i=BST.findIndex(s=>s.k===k);
 if(i>=4&&!o.paid){toast('В производство — только после предоплаты. Отметьте оплату в карточке заказа или в кассе.');return}
 if(k==='ship'&&o.paid<oSum(o)&&o.pre<100){toast('Отгрузка — после оплаты остатка. Система не даст отгрузить неоплаченный заказ.');return}
 o.st=k;if(k==='prod'&&!PRODQ.find(p=>p.ord===id))o.lines.forEach(l=>PRODQ.push({ord:id,item:l[0],q:l[1],done:0,line:'Линия 1 · высечка + печать',shift:dd(addDays(TODAY,1))+' · день',st:'plan',scrap:0}));
 render();toast(k==='ready'?`Клиенту ушло сообщение в WhatsApp: «Заказ ${id} готов, остаток к оплате ${tg(oSum(o)-o.paid)}».`:k==='prod'?'Заказ передан мастеру производства — появился в очереди смен.':k==='got'?'Клиент подтвердил получение — заказ закрыт, следующий повтор система ждёт по периодичности.':`${id} → ${BSTOF(k).n}`)}

/* ===== Карточка заказа ===== */
function payOrd(id,kind){const o=OR(id);const s=oSum(o);if(kind==='pre'){o.paid=Math.round(s*o.pre/100);if(o.st==='inv'||o.st==='calc'||o.st==='new')o.st='pre'}else{o.paid=s;if(o.st==='rest'||o.st==='ready')o.st='rest'}render();toast(kind==='pre'?`Предоплата ${o.pre}% отмечена: ${tg(o.paid)}. Заказ можно передавать в производство.`:'Заказ оплачен полностью — можно отгружать.')}
SC.border=()=>{const o=OR(curOrd)||ORDERS[0];const c=BC(o.cl);const s=oSum(o),si=BST.findIndex(x=>x.k===o.st);
 return `<div class="crumb"><a onclick="go('bfunnel')">Воронка заказов</a> › ${esc(o.id)}</div>
 <div class="hd"><div><h2>Заказ ${esc(o.id)} · ${esc(c.n)}</h2><p>${clL(o.cl)} · от ${dl(o.d)} · срок ${dl(o.due)} · ${esc(o.deliv)} · менеджер ${STAFF[o.mgr]}${o.note?' · '+esc(o.note):''}</p></div>
  <div class="btns"><button class="bt" onclick="card('inv','${o.id}')">Счёт на оплату</button>${o.paid<s*o.pre/100?`<button class="bt p" onclick="payOrd('${o.id}','pre')">Предоплата получена</button>`:o.paid<s?`<button class="bt p" onclick="payOrd('${o.id}','all')">Остаток получен</button>`:''}${si<BST.length-1?`<button class="bt" onclick="moveOrd('${o.id}','${BST[si+1].k}')">→ ${BST[si+1].n}</button>`:''}</div></div>
 <div class="steps">${BST.map((x,i)=>`<div class="stp ${i<si?'done':i===si?'on':''}"><i>${i<si?'✓':i+1}</i>${x.n}</div>`).join('')}</div>
 <div class="g21"><div class="pan"><h3>Состав заказа</h3><div class="tw"><table class="t"><thead><tr><th>Изделие</th><th>Размер · материал</th><th class="r">Кол-во</th><th class="r">Цена</th><th class="r">Сумма</th></tr></thead><tbody>
  ${o.lines.map(l=>{const p=PRD(l[0]);return `<tr><td><b>${esc(p.n)}</b><span class="sub">${esc(DIVN(p.div))}</span></td><td class="mini">${esc(p.size)} · ${esc(p.mat)}</td><td class="r">${fmt(l[1])}</td><td class="r">${p.price} ₸</td><td class="r">${fmt(l[1]*p.price)}</td></tr>`}).join('')}
  <tr class="total"><td>Итого</td><td></td><td class="r">${fmt(o.lines.reduce((a,l)=>a+l[1],0))} шт</td><td></td><td class="r">${tg(s)}</td></tr></tbody></table></div>
  <div class="kv"><span>Себестоимость · маржа</span><b>${tg(oCost(o))} · ${pct(s-oCost(o),s)}%</b></div></div>
 <div><div class="pan"><h3>Оплата</h3><div class="kv"><span>Предоплата ${o.pre}%</span><b>${tg(s*o.pre/100)}</b></div><div class="kv"><span>Оплачено</span><b class="pos">${tg(o.paid)}</b></div><div class="kv big"><span>Остаток</span><b>${tg(s-o.paid)}</b></div><div class="bar"><i class="g" style="--w:${pct(o.paid,s)}%"></i></div></div>
  <div class="pan"><h3>Производство</h3>${PRODQ.filter(p=>p.ord===o.id).map(p=>`<div class="kv"><span>${esc(PRD(p.item).n)} · ${esc(p.shift)}</span><b>${fmt(p.done)} / ${fmt(p.q)}</b></div>`).join('')||'<p class="mini">Попадёт в очередь после предоплаты.</p>'}</div>
  <div class="pan"><h3>Отгрузка</h3><div class="kv"><span>Способ</span><b>${esc(o.deliv)}</b></div><div class="kv"><span>Подтверждение клиента</span><b>${o.st==='got'?'<span class="tag g">получено · фото</span>':'ждём'}</b></div>${!c.contract?'<div class="al w"><b>Новый клиент</b><span>Договор нужен до предоплаты — сформируйте из реквизитов.</span></div>':''}</div></div></div>`;};

/* ===== Клиенты и повторы ===== */
SC.bclients=()=>`<div class="hd"><div><h2>Клиенты и повторы</h2><p>Постоянные клиенты заказывают каждый месяц или две недели. Система помнит, что и сколько брали, когда была последняя заявка и когда ждать следующую. Повтор — одной кнопкой: копия прошлого заказа с актуальными ценами.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Откуда</th><th class="r">Заказов</th><th class="r">Средний заказ</th><th>Периодичность</th><th>Последний</th><th>Ждём следующий</th><th class="r">Долг</th><th></th></tr></thead><tbody>
 ${BCLIENTS.map(c=>{const n=nextRepeat(c);const late=n&&n<TODAY;return `<tr onclick="card('cl','${c.id}')"><td><b>${esc(c.n)}</b><span class="sub">${esc(c.kind)} · ${esc(c.contact)}</span></td><td>${esc(c.src)}</td><td class="r">${c.orders}</td><td class="r">${c.avg?tg(c.avg):'—'}</td><td>${c.repeat?'каждые '+c.repeat+' дн.':'—'}</td><td>${c.last==='—'?'—':dl(c.last)}</td><td>${n?`<b class="${late?'neg':n<=addDays(TODAY,7)?'warnt':''}">${dl(n)}</b>${late?' <span class="tag r">позвонить</span>':''}`:'—'}</td><td class="r ${c.debt?'neg':''}">${c.debt?fmt(c.debt):'—'}</td><td>${c.orders?`<button class="bt" onclick="event.stopPropagation();repeatOrd('${c.id}')">Повторить</button>`:''}</td></tr>`}).join('')}
 </tbody></table></div>
 ${said('«Есть постоянные, которые ежемесячно заказывают… Заявка поступила — обновили и заново скопировали… Мы видим, сколько этот клиент заказал, когда он заказывал, когда последняя заявка была»')}`;
function repeatOrd(cid){const last=ORDERS.filter(o=>o.cl===cid).sort((a,b)=>a.d<b.d?1:-1)[0];const oid='Z-2026-'+(151+ORDERS.length-9);
 ORDERS.unshift({id:oid,cl:cid,lines:last?last.lines.map(l=>[l[0],l[1]]):[['PZ30',2000]],st:'inv',d:TODAY,due:addDays(TODAY,7),pre:50,paid:0,deliv:last?last.deliv:'Доставка',mgr:'DN',note:'Повтор заказа'+(last?' '+last.id:'')});
 const c=BC(cid);c.last=TODAY;c.orders++;curOrd=oid;go('border');toast(`Повтор готов: ${oid} — те же позиции, цены актуальные, счёт сформирован. Осталось отправить клиенту.`)}

/* ===== Изделия ===== */
let divF='all';
SC.catalog=()=>`<div class="hd"><div><h2>Изделия и цены</h2><p>Подразделения — пицца, гофрокороба, лотки, кондитерская упаковка, с печатью под заказ — и внутри размеры. Есть готовые на складе и изготавливаемые под заказ с логотипом клиента.</p></div><div class="btns"><button class="bt p" onclick="act('newprod')">+ Изделие</button></div></div>
 <div class="filt">${[['all','Все'],...DIV].map(d=>`<button class="${divF===d[0]?'on':''}" onclick="divF='${d[0]}';render()">${d[1]}</button>`).join('')}</div>
 <div class="tw"><table class="t"><thead><tr><th>Изделие</th><th>Подразделение</th><th>Размер, мм</th><th>Материал</th><th class="r">Цена за шт</th><th class="r">Себестоимость</th><th class="r">Маржа</th><th class="r">На складе</th></tr></thead><tbody>
 ${PRODUCTS.filter(p=>divF==='all'||p.div===divF).map(p=>`<tr onclick="calcP='${p.id}';go('calc')"><td><b>${esc(p.n)}</b>${p.ready?'':' <span class="tag w">под заказ</span>'}</td><td>${esc(DIVN(p.div))}</td><td class="mono">${esc(p.size)}</td><td class="mini">${esc(p.mat)}</td><td class="r">${p.price} ₸</td><td class="r">${p.cost} ₸</td><td class="r">${pct(p.price-p.cost,p.price)}%</td><td class="r">${p.stock?fmt(p.stock):'—'}</td></tr>`).join('')}
 </tbody></table></div>`;

/* ===== Расчёт и счёт ===== */
let calcP='PZ33',calcQ=5000,calcPrint=0,calcCl='C6';
const calcPrice=()=>{const p=PRD(calcP);const disc=calcQ>=10000?.06:calcQ>=5000?.03:0;const pr=Math.round(p.price*(1-disc))+(calcPrint?[0,18,30][calcPrint]:0);return {p,disc,pr,sum:pr*calcQ,cost:(p.cost+(calcPrint?[0,11,19][calcPrint]:0))*calcQ}};
SC.calc=()=>{const r=calcPrice();
 return `<div class="hd"><div><h2>Расчёт и счёт</h2><p>Менеджер выбирает изделие, тираж и печать — цена со скидкой за объём считается сразу, маржа видна только руководителю и менеджеру. Счёт формируется по реквизитам клиента; номер и дата — по вашей нумерации, позже можно связать с 1С.</p></div></div>
 <div class="g2"><div class="pan"><h3>Параметры</h3><div class="form">
  <label>Клиент<select onchange="calcCl=this.value">${BCLIENTS.map(c=>`<option value="${c.id}" ${c.id===calcCl?'selected':''}>${esc(c.n)}</option>`).join('')}</select></label>
  <label>Изделие<select onchange="calcP=this.value;render()">${PRODUCTS.map(p=>`<option value="${p.id}" ${p.id===calcP?'selected':''}>${esc(p.n)}</option>`).join('')}</select></label>
  <label>Тираж, шт<input value="${calcQ}" onchange="calcQ=Math.max(1,+this.value||1);render()"></label>
  <label>Печать логотипа<select onchange="calcPrint=+this.value;render()">${['Без печати','1 цвет (+18 ₸/шт)','2 цвета (+30 ₸/шт)'].map((x,i)=>`<option value="${i}" ${i===calcPrint?'selected':''}>${x}</option>`).join('')}</select></label></div>
  <p class="mini">Скидка за объём: от 5 000 шт — 3%, от 10 000 шт — 6%. Правила задаёт руководитель.</p></div>
 <div class="pan"><h3>Итог</h3><div class="kv"><span>${esc(r.p.n)}</span><b>${fmt(calcQ)} шт</b></div><div class="kv"><span>Цена за шт${r.disc?` · скидка ${r.disc*100}%`:''}</span><b>${r.pr} ₸</b></div><div class="kv big"><span>Сумма</span><b>${tg(r.sum)}</b></div><div class="kv"><span>Себестоимость · маржа</span><b>${tg(r.cost)} · ${pct(r.sum-r.cost,r.sum)}%</b></div><div class="kv"><span>Предоплата 50%</span><b>${tg(r.sum/2)}</b></div>
  <div class="btns l"><button class="bt" onclick="act('kp')">КП в WhatsApp</button><button class="bt p" onclick="calcToOrder()">Создать заказ и счёт</button></div></div></div>`;};
function calcToOrder(){const r=calcPrice();const oid='Z-2026-'+(151+ORDERS.length-9);ORDERS.unshift({id:oid,cl:calcCl,lines:[[calcP,calcQ]],st:'inv',d:TODAY,due:addDays(TODAY,7),pre:50,paid:0,deliv:'Доставка',mgr:'DN',note:calcPrint?'Печать логотипа':''});curOrd=oid;go('border');toast(`Заказ ${oid} создан, счёт на предоплату 50% — ${tg(r.sum/2)} — сформирован и готов к отправке.`)}

/* ===== Производство ===== */
SC.prod=()=>`<div class="hd"><div><h2>Производство</h2><p>После предоплаты заказ попадает мастеру: линия, смена, план и факт выпуска, брак. Менеджер видит, на каком этапе его заказ, без звонков в цех.</p></div><div class="btns"><button class="bt" onclick="act('plan')">План на неделю</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Заказ</th><th>Изделие</th><th>Линия</th><th>Смена</th><th class="r">План</th><th class="r">Сделано</th><th>Выпуск</th><th class="r">Брак</th><th></th></tr></thead><tbody>
 ${PRODQ.map((p,i)=>`<tr><td>${ordL(p.ord)}<span class="sub">${esc(BC(OR(p.ord).cl).n)}</span></td><td>${esc(PRD(p.item).n)}</td><td class="mini">${esc(p.line)}</td><td>${esc(p.shift)}</td><td class="r">${fmt(p.q)}</td><td class="r"><b>${fmt(p.done)}</b></td><td style="min-width:120px"><div class="bar"><i class="${p.done>=p.q?'g':''}" style="--w:${pct(p.done,p.q)}%"></i></div></td><td class="r ${p.scrap?'warnt':''}">${p.scrap||'—'}</td><td>${p.done<p.q?`<button class="bt" onclick="prodAdd(${i})">+ выпуск смены</button>`:'<span class="tag g">готово</span>'}</td></tr>`).join('')}
 </tbody></table></div>
 <div class="g2"><div class="pan"><h3>Материалы цеха</h3>${BMAT.map(m=>`<div class="kv"><span>${esc(m[0])}</span><b>${esc(m[1])} · <span class="${/заказать/.test(m[2])?'warnt':'mini'}">${esc(m[2])}</span></b></div>`).join('')}</div>
 <div class="pan"><h3>Картон с базы — на переработку</h3><p class="mini">Картон, собранный второй бригадой, передаётся на свой завод внутренним перемещением — видно, сколько своего сырья ушло в производство.</p><div class="kv"><span>Сентябрь: передано с базы</span><b>18 т</b></div><div class="kv"><span>Внутренняя цена</span><b>46 ₸/кг</b></div></div></div>`;
function prodAdd(i){const p=PRODQ[i];const add=Math.min(p.q-p.done,Math.round(p.q*.35));p.done+=add;p.scrap+=Math.round(add*.015);p.st=p.done>=p.q?'done':'work';const o=OR(p.ord);if(o&&PRODQ.filter(x=>x.ord===o.id).every(x=>x.done>=x.q)&&o.st==='prod'){o.st='ready';toast(`Заказ ${o.id} изготовлен полностью — переведён в «Готово», клиенту ушло сообщение.`)}else toast(`Выпуск смены: +${fmt(add)} шт. Брак ${Math.round(add*.015)} шт записан.`);render()}

/* ===== Склад коробок ===== */
SC.bstock=()=>`<div class="hd"><div><h2>Склад коробок</h2><p>Готовые изделия и сырьё цеха: поступления из производства, резерв под заказы, отгрузки, инвентаризация, брак и списание.</p></div><div class="btns"><button class="bt" onclick="act('inv')">Инвентаризация</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Изделие</th><th>Подразделение</th><th class="r">На складе</th><th class="r">В резерве</th><th class="r">Свободно</th><th class="r">Стоимость</th></tr></thead><tbody>
 ${PRODUCTS.filter(p=>p.ready).map(p=>{const r=ORDERS.filter(o=>['inv','pre','ready','rest'].includes(o.st)).reduce((a,o)=>a+o.lines.filter(l=>l[0]===p.id).reduce((s,l)=>s+l[1],0),0);const f=p.stock-r;return `<tr><td><b>${esc(p.n)}</b></td><td>${esc(DIVN(p.div))}</td><td class="r">${fmt(p.stock)}</td><td class="r">${r?fmt(r):'—'}</td><td class="r"><b class="${f<0?'neg':''}">${fmt(f)}</b></td><td class="r">${fmt(p.stock*p.cost)}</td></tr>`}).join('')}
 </tbody></table></div>
 ${said('«Остатки… инвентаризации… списание, брак бывает»')}`;

/* ===== Отгрузки ===== */
SC.ship=()=>`<div class="hd"><div><h2>Отгрузки</h2><p>Самовывоз или доставка — как договорились с клиентом. Отгрузка открывается только после оплаты остатка. Клиент подтверждает получение — фото накладной в карточке.</p></div></div>
 <div class="g2">${ORDERS.filter(o=>['ready','rest','ship','got'].includes(o.st)).map(o=>`<div class="pan shp"><div class="row"><div><h3>${ordL(o.id)} · ${esc(BC(o.cl).n)}</h3><p>${o.lines.map(l=>esc(PRD(l[0]).n)+' × '+fmt(l[1])).join('; ')}</p></div>${bst(o.st)}</div>
  <div class="kv"><span>Способ</span><b>${esc(o.deliv)}${o.deliv==='Доставка'?' · Газель 318, Арман':''}</b></div><div class="kv"><span>Оплата</span><b>${o.paid>=oSum(o)?'<span class="pos">оплачено полностью</span>':'остаток '+tg(oSum(o)-o.paid)}</b></div>
  <div class="btns l">${o.st==='ship'?`<button class="bt p" onclick="moveOrd('${o.id}','got')">Клиент получил</button>`:o.st==='got'?'<span class="tag g">получено, подтверждено фото</span>':`<button class="bt" onclick="moveOrd('${o.id}','ship')">Отгрузить</button>`}</div></div>`).join('')}</div>`;

/* ===== Договоры и счета ===== */
SC.docs=()=>`<div class="hd"><div><h2>Договоры и счета</h2><p>С новым клиентом составляется договор, с постоянным — только счета. Документы формируются из реквизитов, нумерация ваша. Интеграцию с 1С можно добавить позже — номера и даты счетов тогда совпадут.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Документ</th><th>Клиент</th><th>Основание</th><th class="r">Сумма</th><th>Статус</th></tr></thead><tbody>
 ${[['Договор поставки № 26/031','C5','новый клиент','—','черновик'],['Счёт № 412','C2','Z-2026-148',oSum(OR('Z-2026-148')),'отправлен в WhatsApp'],['Счёт № 409','C4','Z-2026-147',oSum(OR('Z-2026-147')),'оплачено 30%'],['Счёт № 404','C1','Z-2026-142',oSum(OR('Z-2026-142')),'оплачено 50%'],['Накладная № 388','C1','Z-2026-136',oSum(OR('Z-2026-136')),'подписана клиентом'],['Договор поставки № 26/024','C4','рамочный, 2026','—','подписан']].map(d=>`<tr><td><b>${d[0]}</b></td><td>${clL(d[1])}</td><td>${d[2].startsWith('Z-')?ordL(d[2]):esc(d[2])}</td><td class="r">${typeof d[3]==='number'?fmt(d[3]):d[3]}</td><td><span class="tag ${/подписан|оплачено 5|оплачено 3/.test(d[4])?'g':/черновик/.test(d[4])?'w':''}">${d[4]}</span></td></tr>`).join('')}
 </tbody></table></div>`;
