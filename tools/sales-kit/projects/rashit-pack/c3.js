
const SC={};
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const bst=k=>{const s=BSTOF(k);return `<span class="stg" style="--sc:${s.c}">${esc(s.n)}</span>`};
const clL=id=>BC(id)?`<a class="lk" onclick="card('cl','${id}')">${esc(BC(id).n)}</a>`:'—';
const ordL=id=>OR(id)?`<a class="lk mono" onclick="openOrd('${id}')">${esc(id)}</a>`:'—';
const ptL=id=>PT(id)?`<a class="lk" onclick="card('pt','${id}')">${esc(PT(id).n)}</a>`:'—';
function openOrd(id){curOrd=id;go('border')}
const carKg=c=>TRIPS.filter(t=>t.car===c).reduce((a,t)=>a+tripKg(t),0);
const carSum=c=>TRIPS.filter(t=>t.car===c).reduce((a,t)=>a+t.lines.reduce((s,l)=>s+lineSum(l),0),0);
const todayMat=()=>{const r={};TRIPS.forEach(t=>t.lines.forEach(l=>r[l.m]=(r[l.m]||0)+l.kg));return r};
const ptToday=id=>TRIPS.reduce((a,t)=>a+t.lines.filter(l=>l.pt===id).reduce((s,l)=>s+lineSum(l),0),0);
const nextRepeat=c=>c.repeat&&c.last!=='—'?addDays(c.last,c.repeat):'';
const cashIn=()=>CASH.lines.filter(l=>l.k==='in').reduce((a,l)=>a+l.sum,0),cashOut=()=>CASH.lines.filter(l=>l.k==='out').reduce((a,l)=>a+l.sum,0);
const myKey=()=>ROLES[role].p;

/* ===== Сводка дня ===== */
SC.today=()=>{
 const tm=todayMat(),tot=Object.values(tm).reduce((a,b)=>a+b,0);
 const inProd=ORDERS.filter(o=>o.st==='prod'),ready=ORDERS.filter(o=>['ready','rest'].includes(o.st)),shipping=ORDERS.filter(o=>o.st==='ship');
 const due=BCLIENTS.filter(c=>nextRepeat(c)&&nextRepeat(c)<=addDays(TODAY,7));
 return `<div class="hd"><div><h2>Сводка дня · ${dl(TODAY)}</h2><p>Два направления работают отдельно, но собственник видит их на одном экране: что в производстве и отгрузке, сколько тонн привезли машины и сколько за это заплатили, что в кассе.</p></div>
  <div class="btns"><button class="bt" onclick="act('report')">Отчёт в WhatsApp в 19:00</button></div></div>
 <div class="split">
  <div class="half box"><div class="hh"><span>КОРОБКИ</span><a onclick="go('bfunnel')">воронка заказов ›</a></div>
   <div class="nums"><div onclick="go('prod')"><b>${inProd.length}</b><small>в производстве</small><em>${fmt(inProd.reduce((a,o)=>a+o.lines.reduce((s,l)=>s+l[1],0),0))} шт</em></div>
    <div onclick="go('bfunnel')"><b>${ready.length}</b><small>готово, ждём оплату остатка</small><em>${mln(ready.reduce((a,o)=>a+oSum(o)-o.paid,0))}</em></div>
    <div onclick="go('ship')"><b>${shipping.length}</b><small>в пути к клиенту</small><em>ETA 14:30</em></div>
    <div onclick="go('bclients')"><b>${due.length}</b><small>повторных заказов ждём на неделе</small><em>${due.map(c=>c.n.replace(/[«»]/g,'').split(' ').slice(-2).join(' ')).join(', ')}</em></div></div>
   <div class="ol">${ORDERS.filter(o=>!['got'].includes(o.st)).slice(0,6).map(o=>`<div class="or" onclick="openOrd('${o.id}')"><span class="mono">${o.id}</span><b>${esc(BC(o.cl).n)}</b>${bst(o.st)}<strong>${tg(oSum(o))}</strong></div>`).join('')}</div></div>
  <div class="half raw"><div class="hh"><span>ВТОРСЫРЬЁ</span><a onclick="go('trips')">рейсы ›</a></div>
   <div class="nums"><div onclick="go('trips')"><b>${tn(tot)}</b><small>собрано сегодня</small><em>${TRIPS.filter(t=>t.st==='done').length} рейсов закрыто</em></div>
    <div onclick="go('payouts')"><b>${mln(TRIPS.reduce((a,t)=>a+t.lines.reduce((s,l)=>s+lineSum(l),0),0))}</b><small>за сырьё по ценам точек</small><em>наличными и безналом</em></div>
    <div onclick="go('rawstock')"><b>${tn(Object.values(RSTOCK).reduce((a,x)=>a+x.kg,0))}</b><small>на складе базы</small><em>${Object.values(RSTOCK).reduce((a,x)=>a+x.bales,0)} тюков</em></div>
    <div onclick="go('sales')"><b>${SALES.filter(x=>x.st!=='done').length}</b><small>партии к отгрузке</small><em>${tn(SALES.filter(x=>x.st!=='done').reduce((a,x)=>a+x.kg,0))}</em></div></div>
   <div class="cars">${CARS.map(c=>{const kg=carKg(c.id);return `<div class="car" onclick="curCar='${c.id}';go('trip')"><b>${esc(c.n)}</b><span>${STAFF[c.drv]} · ${TRIPS.filter(t=>t.car===c.id).length} ${plural(TRIPS.filter(t=>t.car===c.id).length,['рейс','рейса','рейсов'])}</span><strong>${tn(kg)}</strong><div class="mbar">${Object.keys(MAT).map(m=>{const v=TRIPS.filter(t=>t.car===c.id).reduce((a,t)=>a+t.lines.filter(l=>l.m===m).reduce((s,l)=>s+l.kg,0),0);return v?`<i style="--c:${MAT[m].c};flex:${v}" title="${MAT[m].n}: ${kgf(v)}"></i>`:''}).join('')}</div></div>`}).join('')}</div>
   <div class="legend">${Object.entries(MAT).map(([k,m])=>`<span><i style="background:${m.c}"></i>${m.n} · ${kgf(tm[k]||0)}</span>`).join('')}</div></div>
 </div>
 <div class="g2"><div class="pan"><h3>Касса сегодня</h3><div class="kv"><span>На начало смены</span><b>${tg(CASH.open)}</b></div><div class="kv"><span>Пришло</span><b class="pos">+ ${tg(cashIn())}</b></div><div class="kv"><span>Выдано: подотчёт водителям и выплаты сдатчикам</span><b class="neg">− ${tg(cashOut())}</b></div><div class="kv big"><span>Должно быть в кассе</span><b>${tg(CASH.open+cashIn()-cashOut())}</b></div><button class="bt" onclick="go('money')">Смена кассира</button></div>
 <div class="pan"><h3>Требует внимания</h3>
  ${[['r','Расхождение по весам','Газель 712, рейс 3: водитель записал 756 кг, весы — 742 кг (−14 кг).','intake'],['w','Долг клиента','«Бал Тәтті» — остаток 135 000 ₸ по заказу Z-2026-144, готово с 29.09.','bfunnel'],['w','Не сфотографировано','Газель 500, рейс 4: пластик ПНД 180 кг без фото.','trip'],['w','Клей ПВА','Осталось 140 кг — заказать до 05.10, иначе встанет склейка.','prod'],['i','Новый клиент без договора','Grill Point — договор нужен до предоплаты.','docs']].map(a=>`<div class="al ${a[0]}" onclick="go('${a[3]}')"><b>${a[1]}</b><span>${a[2]}</span></div>`).join('')}</div></div>
 ${said('«Нет общей информации: на WhatsApp пишешь, на бумаге пишет» · «Мы будем видеть, например, Газель номер 500 — сегодня завезла пять тонн семьсот»','Сводка собирается сама из рейсов, весов, заказов и кассы — без ручных отчётов.')}`;
};

/* ===== Касса ===== */
SC.money=()=>{const need=CASH.open+cashIn()-cashOut();
 return `<div class="hd"><div><h2>Касса и деньги</h2><p>Смена кассира: подотчёт водителям, выплаты сдатчикам за сырьё, оплаты клиентов за коробки. Каждая строка связана с рейсом, точкой или заказом — видно, кто, сколько и за что.</p></div><div class="btns"><button class="bt" onclick="card('cashop','in')">+ Приход</button><button class="bt" onclick="card('cashop','out')">+ Расход</button></div></div>
 <div class="g21"><div class="pan"><h3>Смена · ${dl(TODAY)} · кассир Гульнара</h3><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Операция</th><th class="r">Приход</th><th class="r">Расход</th></tr></thead><tbody>
  <tr><td>08:00</td><td>Остаток на начало смены</td><td class="r">${fmt(CASH.open)}</td><td></td></tr>
  ${CASH.lines.map(l=>`<tr><td class="mono">${l.t}</td><td>${esc(l.n)}</td><td class="r pos">${l.k==='in'?fmt(l.sum):''}</td><td class="r neg">${l.k==='out'?fmt(l.sum):''}</td></tr>`).join('')}
  <tr class="total"><td></td><td>Должно быть в кассе</td><td class="r" colspan="2">${tg(need)}</td></tr></tbody></table></div>
  <div class="close"><label>Фактически в кассе <input id="cash_fact" class="qin w" value="${need}"></label><button class="bt p" onclick="closeShift(${need})">Закрыть смену</button></div></div>
 <div><div class="pan"><h3>Банк и Kaspi</h3>${BANK.map(b=>`<div class="kv"><span>${b[0]} · ${esc(b[1])}</span><b class="${b[2]<0?'neg':'pos'}">${b[2]<0?'− ':'+ '}${tg(Math.abs(b[2]))}</b></div>`).join('')}</div>
  <div class="pan"><h3>Кто нам должен</h3>${ORDERS.filter(o=>['ready','rest','ship'].includes(o.st)&&oSum(o)>o.paid).map(o=>`<div class="kv"><span>${clL(o.cl)} · ${ordL(o.id)}</span><b>${tg(oSum(o)-o.paid)}</b></div>`).join('')}</div>
  <div class="pan"><h3>Кому должны мы</h3>${PAYOUTS.filter(v=>v.st==='wait').map(v=>`<div class="kv"><span>${esc(v.who)}<span class="sub">${esc(v.how)}</span></span><b>${tg(v.sum||ptToday(v.to))}</b></div>`).join('')}</div></div></div>
 ${said('«Кассир — учёт денег, расчёт… Они должны видеть, кто сколько привёз и на какую сумму»')}`;};
function closeShift(d){const f=+String(document.getElementById('cash_fact').value).replace(/\s/g,'');const r=f-d;toast(r===0?'Смена закрыта: касса сходится до тенге. Отчёт ушёл руководителю.':`Смена закрыта с расхождением ${r>0?'+':''}${fmt(r)} ₸ — руководитель получил уведомление, строку можно разобрать.`)}

/* ===== Аналитика ===== */
SC.analytics=()=>{
 const last=RAWTON[RAWTON.length-1];const maxT=Math.max(...RAWTON.map(r=>Object.values(r).reduce((a,b)=>a+b,0)));
 return `<div class="hd"><div><h2>Аналитика</h2><p>Коробки: выручка, маржа по видам, повторные клиенты. Вторсырьё: тонны по видам, цена закупа против цены продажи, лучшие точки и машины, засор. Всё из ежедневной работы.</p></div></div>
 <div class="g2"><div class="pan"><h3>Коробки · выручка по месяцам, млн ₸</h3><div class="cols">${BOXREV.map((v,i)=>`<div class="col"><div class="cb"><i style="height:${v/22*100}%;background:#9a6a32"></i></div><b>${String(v).replace('.',',')}</b><small>${MONTHS[i]}</small></div>`).join('')}</div>
  <div class="tw"><table class="t"><thead><tr><th>Вид</th><th class="r">Цена</th><th class="r">Себест.</th><th class="r">Маржа</th></tr></thead><tbody>${DIV.map(d=>{const P=PRODUCTS.filter(p=>p.div===d[0]);const pr=P.reduce((a,p)=>a+p.price,0),co=P.reduce((a,p)=>a+p.cost,0);return `<tr><td>${d[1]}</td><td class="r">${fmt(pr/P.length)} ₸</td><td class="r">${fmt(co/P.length)} ₸</td><td class="r">${pct(pr-co,pr)}%</td></tr>`}).join('')}</tbody></table></div>
  <p class="mini">Повторные клиенты — 78% выручки сентября.</p></div>
 <div class="pan"><h3>Вторсырьё · тонны по месяцам</h3><div class="cols">${RAWTON.map((r,i)=>{const s=Object.values(r).reduce((a,b)=>a+b,0);return `<div class="col"><div class="cb"><div class="stack" style="height:${s/maxT*100}%">${Object.keys(MAT).map(k=>`<i style="flex:${r[k]};background:${MAT[k].c}"></i>`).join('')}</div></div><b>${Math.round(s)} т</b><small>${MONTHS[i]}</small></div>`}).join('')}</div>
  <div class="tw"><table class="t"><thead><tr><th>Вид</th><th class="r">Сентябрь</th><th class="r">Закуп ₸/кг</th><th class="r">Продажа ₸/кг</th><th class="r">Маржа с тонны</th></tr></thead><tbody>${Object.entries(MAT).map(([k,m])=>`<tr><td>${matTag(k)}</td><td class="r">${String(last[k]).replace('.',',')} т</td><td class="r">${m.buy}</td><td class="r">${m.sell}</td><td class="r"><b>${fmt((m.sell-m.buy)*1000)} ₸</b></td></tr>`).join('')}</tbody></table></div></div></div>
 <div class="g2"><div class="pan"><h3>Точки: кто даёт больше всего</h3>${POINTS.slice().sort((a,b)=>b.month-a.month).slice(0,6).map(p=>`<div class="fr"><span>${esc(p.n)}</span><div class="bar"><i style="--w:${p.month/14200*100}%;background:#2f7a4f"></i></div><b>${tn(p.month)} / мес</b></div>`).join('')}</div>
 <div class="pan"><h3>Машины за сентябрь</h3><div class="tw"><table class="t"><thead><tr><th>Машина</th><th class="r">Рейсов</th><th class="r">Тонн</th><th class="r">Т за рейс</th><th class="r">Расхождение с весами</th></tr></thead><tbody>${[['Газель 500','KN',96,118.4,'−0,4%'],['Газель 712','MR',91,104.6,'−1,1%'],['Газель 318','AR',74,82.0,'−0,3%']].map(r=>`<tr><td>${r[0]} · ${STAFF[r[1]]}</td><td class="r">${r[2]}</td><td class="r">${String(r[3]).replace('.',',')}</td><td class="r">${(r[3]/r[2]).toFixed(2).replace('.',',')}</td><td class="r ${r[4]==='−1,1%'?'warnt':''}">${r[4]}</td></tr>`).join('')}</tbody></table></div><p class="mini">Расхождение — разница между тем, что записал водитель, и весами на базе. Больше 1% — повод разобраться.</p></div></div>`;
};

/* ===== Рост ===== */
SC.growth=()=>`<div class="hd"><div><h2>Новый завод · рост</h2><p>Весной начинается стройка нового завода: производство, реализация, логисты. Систему делаем сразу так, чтобы новая площадка добавлялась как ещё один склад, цех и касса — без переписывания.</p></div></div>
 <div class="tl big">${GROWTH.map((g,i)=>`<div class="tli ${i===0?'ok':'on'}"><span class="who">${g[0]}</span><p>${esc(g[1])}</p></div>`).join('')}</div>
 <div class="sites"><div class="site on"><small>Площадка 1</small><b>Цех коробок</b><span>3 линии · склад готовой продукции · отгрузки</span></div><div class="site on"><small>Площадка 2</small><b>База вторсырья</b><span>весы · сортировка · пресс · 3 машины</span></div><div class="site plan"><small>Площадка 3 · весна 2027</small><b>Новый завод</b><span>появится в системе кнопкой «Добавить площадку»</span></div></div>
 ${said('«Весной уже будет стройка… будет завод, и производство, и реализация, логисты будут» · «Чтобы не было так, что мы сейчас делаем, а она будет недоработанная для нас»','Ирина предложила внедрить систему на текущем производстве и потом доработать под завод — так и заложено.')}`;
