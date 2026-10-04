
/* ===== Рейсы и машины ===== */
SC.trips=()=>`<div class="hd"><div><h2>Рейсы и машины · ${dl(TODAY)}</h2><p>Водитель заполняет рейс в телефоне: точка, вид сырья, вес, цена, фото. Здесь это сразу видно по каждой машине: сколько рейсов, сколько тонн и на какую сумму, и что показали весы на базе.</p></div><div class="btns"><button class="bt" onclick="go('schedule')">График вывоза</button></div></div>
 ${CARS.map(c=>{const T=TRIPS.filter(t=>t.car===c.id);return `<div class="pan carp"><div class="row"><div><h3>${esc(c.n)} · ${STAFF[c.drv]}</h3><p>${T.length} ${plural(T.length,['рейс','рейса','рейсов'])} · собрано ${tn(carKg(c.id))} · по ценам точек ${tg(carSum(c.id))}</p></div><button class="bt" onclick="curCar='${c.id}';go('trip')">Открыть как водитель</button></div>
  <div class="tw"><table class="t"><thead><tr><th>Рейс</th><th>Точки и сырьё</th><th class="r">Записал водитель</th><th class="r">Весы на базе</th><th class="r">Разница</th><th class="r">Сумма</th><th>Статус</th></tr></thead><tbody>
  ${T.map(t=>{const kg=tripKg(t),d=t.weighed?t.weighed-kg:0;return `<tr><td class="mono">№${t.n}</td><td>${t.lines.map(l=>`${ptL(l.pt)} · ${matTag(l.m)} ${l.kg?kgf(l.kg):''}${l.ph?'':' <span class="tag w">нет фото</span>'}`).join('<br>')}</td><td class="r">${kg?kgf(kg):'—'}</td><td class="r">${t.weighed?kgf(t.weighed):'—'}</td><td class="r ${Math.abs(d)>kg*.01?'neg':''}">${t.weighed?(d>0?'+':'')+fmt(d)+' кг':'—'}</td><td class="r">${fmt(t.lines.reduce((a,l)=>a+lineSum(l),0))}</td><td>${t.st==='done'?'<span class="tag g">на базе</span>':t.st==='go'?'<span class="tag w">в пути</span>':'<span class="tag">план</span>'}</td></tr>`}).join('')}</tbody></table></div></div>`}).join('')}
 ${said('«Забивает точку А: например, сколько тонн картона забрали, по какой цене; точка Б — сколько картона забрали… И мы будем видеть, например, Газель номер 500»')}`;

/* ===== Рейс водителя: большой телефон ===== */
let tripPt='T3',tripM='KRT',tripKgv='',tripPh=false;
SC.trip=()=>{const c=CARS.find(x=>x.id===curCar)||CARS[0];const T=TRIPS.filter(t=>t.car===c.id);const cur=T.find(t=>t.st==='go')||T[T.length-1];const p=PT(tripPt);const pr=(p.price&&p.price[tripM])||MAT[tripM].buy;
 return `<div class="hd"><div><h2>Рейс водителя · ${esc(c.n)}</h2><p>Так это выглядит у водителя в телефоне: крупные кнопки, цена подставляется из договорённости с точкой, фото обязательно. Интернет пропал — запись сохранится и отправится, когда появится связь.</p></div>
  <div class="btns">${CARS.map(x=>`<button class="bt ${x.id===c.id?'p':''}" onclick="curCar='${x.id}';render()">${esc(x.n)}</button>`).join('')}</div></div>
 <div class="drv"><div class="phone big"><div class="pht"><b>${esc(c.n)} · ${STAFF[c.drv]}</b><small>рейс №${cur.n} · сегодня ${tn(carKg(c.id))}</small></div><div class="pb">
  <div class="dlab">Точка</div><div class="dbtns">${POINTS.map(x=>`<button class="${x.id===tripPt?'on':''}" onclick="tripPt='${x.id}';tripM=PT('${x.id}').mats[0];render()">${esc(x.n.replace(/«|»/g,'').slice(0,22))}</button>`).join('')}</div>
  <div class="dlab">Что забрали</div><div class="dbtns m">${p.mats.map(m=>`<button class="${m===tripM?'on':''}" style="--c:${MAT[m].c}" onclick="tripM='${m}';render()">${MAT[m].n}</button>`).join('')}</div>
  <div class="dlab">Вес, кг</div><input class="dkg" id="tkg" inputmode="numeric" value="${tripKgv}" placeholder="например, 640" oninput="tripKgv=this.value;document.getElementById('tsum').textContent=new Intl.NumberFormat('ru-RU').format((+this.value||0)*${pr})+' ₸'">
  <div class="dprice"><span>Цена точки: ${pr} ₸/кг</span><b id="tsum">${fmt((+tripKgv||0)*pr)} ₸</b></div>
  <div class="dph ${tripPh?'on':''}" onclick="tripPh=!tripPh;render()">${tripPh?'✓ Фото сделано':'Сфотографировать груз'}</div>
  <div class="pbtn" onclick="addTripLine()">Записать</div>
  <div class="dlist">${cur.lines.filter(l=>l.kg).map(l=>`<div class="pi"><span>${esc(PT(l.pt).n.slice(0,24))}<small>${MAT[l.m].n} · ${l.ts}</small></span><b>${kgf(l.kg)}</b></div>`).join('')}</div>
  <div class="pbtn alt" onclick="finishTrip()">Еду на базу — закрыть рейс</div></div></div>
 <div class="drvr"><div class="pan"><h3>Как оплачивается сдатчик</h3><div class="kv"><span>Точка</span><b>${esc(p.n)}</b></div><div class="kv"><span>Договорённость</span><b>${Object.entries(p.price||{}).map(([m,v])=>MAT[m].n+' — '+v+' ₸/кг').join('; ')}</b></div><div class="kv"><span>Оплата</span><b>${esc(p.pay)}</b></div><div class="kv"><span>График</span><b>${esc(p.sch)}</b></div><p class="mini">Если «наличные на месте» — сумма списывается с подотчёта водителя; если «в кассе» — кассир видит выплату в своей смене.</p></div>
 ${said('«Водителю, который ездит на Газели, ему в телефоне это всё заполнять» · «Чтобы удобно было и водителям, и нам — заполнять данные в телефоне»')}</div></div>`;};
function addTripLine(){const kg=+String(tripKgv).replace(/\s/g,'');if(!kg||kg<1){toast('Введите вес в килограммах');return}if(!tripPh){toast('Сделайте фото груза — без фото запись не принимается.');return}
 const T=TRIPS.filter(t=>t.car===curCar);let cur=T.find(t=>t.st==='go');if(!cur){cur={car:curCar,n:T.length+1,st:'go',lines:[],weighed:0};TRIPS.push(cur)}
 cur.lines.push({pt:tripPt,m:tripM,kg,ph:true,ts:'15:4'+cur.lines.length});const s=lineSum(cur.lines[cur.lines.length-1]);tripKgv='';tripPh=false;render();
 toast(`Записано: ${esc(PT(tripPt).n)} · ${MAT[tripM].n} ${kgf(kg)} на ${tg(s)}. Руководитель и кассир видят это сразу.`)}
function finishTrip(){const cur=TRIPS.find(t=>t.car===curCar&&t.st==='go');if(!cur){toast('Открытого рейса нет.');return}cur.st='done';cur.weighed=Math.round(tripKg(cur)*.992);render();toast(`Рейс №${cur.n} закрыт. Весы на базе: ${kgf(cur.weighed)} — разница с записью водителя ${fmt(cur.weighed-tripKg(cur))} кг.`)}

/* ===== Точки и сдатчики ===== */
SC.points=()=>`<div class="hd"><div><h2>Точки и сдатчики</h2><p>Компании, магазины, рынки и дворники — у каждой точки свои виды сырья, цены за килограмм, способ оплаты и график. Видно, когда забирали в последний раз и сколько точка даёт в месяц.</p></div><div class="btns"><button class="bt p" onclick="card('newpt')">+ Точка</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Точка</th><th>Тип</th><th>Сырьё и цена, ₸/кг</th><th>График</th><th>Оплата</th><th>Последний вывоз</th><th class="r">В месяц</th></tr></thead><tbody>
 ${POINTS.map(p=>`<tr onclick="card('pt','${p.id}')"><td><b>${esc(p.n)}</b><span class="sub">${esc(p.addr)}</span></td><td>${esc(p.kind)}</td><td>${p.mats.map(m=>matTag(m)+' '+(p.price[m]||'—')).join(' ')}</td><td>${esc(p.sch)}</td><td class="mini">${esc(p.pay)}</td><td>${dd(p.last)}${daysBetween(p.last,TODAY)>=4?' <span class="tag w">'+daysBetween(p.last,TODAY)+' дн.</span>':''}</td><td class="r">${tn(p.month)}</td></tr>`).join('')}
 </tbody></table></div>
 ${said('«Разные компании… мы сами забираем, у дворников это есть» · «Есть картон, есть плёнка, есть пластик и есть бутылки, пластиковые и алюминиевые банки»')}`;

/* ===== График вывоза ===== */
SC.schedule=()=>{const days=[];for(let i=0;i<7;i++)days.push(addDays(TODAY,i));
 const on=(p,d)=>{const w=dayOf(d);if(/Ежедневно/.test(p.sch))return true;if(/Пн, ср, пт/.test(p.sch))return ['пн','ср','пт'].includes(w);if(/Вт, пт/.test(p.sch))return ['вт','пт'].includes(w);if(/Пн, чт/.test(p.sch))return ['пн','чт'].includes(w);if(/неделю/.test(p.sch))return w==='пт';return false};
 return `<div class="hd"><div><h2>График вывоза</h2><p>Постоянные точки — по расписанию: каждый день, по дням недели, раз в неделю. «По звонку» — заявка от точки ставится логистом на ближайший рейс. Логист видит загрузку машин на неделю.</p></div></div>
 <div class="pan"><div class="wk"><div></div>${days.map(d=>`<div class="wkh ${d===TODAY?'td':''}"><b>${dd(d)}</b><small>${dayOf(d)}</small></div>`).join('')}
 ${POINTS.map(p=>`<div class="wkn"><b>${esc(p.n)}</b><span>${esc(p.sch)}</span></div>${days.map(d=>`<div class="wkc ${on(p,d)?'on':''}">${on(p,d)?(p.id==='T1'||p.id==='T4'?'500':p.id==='T5'||p.id==='T7'?'712':p.id==='T2'?'500':'318'):''}</div>`).join('')}`).join('')}</div>
 <div class="legend"><span><i style="background:#2f7a4f"></i>вывоз по графику · номер машины</span><span>По звонку: Ақ Жол Логистик (от 500 кг), бар «Хмель и Солод»</span></div></div>`;};

/* ===== Приёмка и весы ===== */
SC.intake=()=>`<div class="hd"><div><h2>Приёмка и весы</h2><p>Машина заезжает на весы: брутто, тара, нетто. Приёмщик отмечает засор и сорт. Система сравнивает с тем, что записал водитель на точках, — расхождение больше 1% подсвечивается.</p></div><div class="btns"><button class="bt p" onclick="weighNext()">Взвесить машину в очереди</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Машина · рейс</th><th>Сырьё</th><th class="r">Брутто</th><th class="r">Тара</th><th class="r">Нетто</th><th class="r">По записи водителя</th><th class="r">Разница</th><th class="r">Засор</th></tr></thead><tbody>
 ${TRIPS.filter(t=>t.weighed).map(t=>{const kg=tripKg(t),d=t.weighed-kg;const tara=CARS.find(c=>c.id===t.car).id==='500'?2140:2210;return `<tr><td>${esc(CARS.find(c=>c.id===t.car).n)} · №${t.n}</td><td>${[...new Set(t.lines.map(l=>l.m))].map(matTag).join(' ')}</td><td class="r">${fmt(t.weighed+tara)}</td><td class="r">${fmt(tara)}</td><td class="r"><b>${fmt(t.weighed)}</b></td><td class="r">${fmt(kg)}</td><td class="r ${Math.abs(d)>kg*.01?'neg':''}">${d>0?'+':''}${fmt(d)}</td><td class="r">${t.lines.some(l=>l.pt==='T5')?'3%':'1%'}</td></tr>`}).join('')}
 </tbody></table></div>
 <div class="note"><b>Засор вычитается из веса</b><p>Мокрый картон и мусор в мешках — процент засора по точке копится в аналитике: видно, с кем пересмотреть цену.</p></div>`;
function weighNext(){const t=TRIPS.find(x=>x.st==='go');if(!t){toast('Очередь на весах пуста.');return}t.st='done';t.weighed=Math.round(tripKg(t)*.991);render();toast(`${esc(CARS.find(c=>c.id===t.car).n)}, рейс ${t.n}: нетто ${kgf(t.weighed)}. Остатки склада пополнены.`)}

/* ===== Склад вторсырья ===== */
SC.rawstock=()=>`<div class="hd"><div><h2>Склад вторсырья</h2><p>Остатки по видам после приёмки и прессовки: килограммы, тюки, средняя цена закупа и стоимость. Инвентаризация, брак и списание — с причиной.</p></div><div class="btns"><button class="bt" onclick="card('inv')">Инвентаризация</button></div></div>
 <div class="stk">${Object.entries(RSTOCK).map(([k,v])=>`<div class="sk" style="--c:${MAT[k].c}"><small>${MAT[k].n}</small><b>${tn(v.kg)}</b><span>${v.bales} тюков · закуп ${String(v.avg).replace('.',',')} ₸/кг</span><em>${tg(v.kg*v.avg)}</em><i>→ ${MAT[k].to}</i></div>`).join('')}</div>
 <div class="pan"><h3>Инвентаризации и списания</h3>${INV.map(r=>`<div class="kv"><span>${dd(r.d)} · ${STAFF[r.who]} · ${matTag(r.m)} ${esc(r.why)}</span><b>${fmt(r.was)} → ${fmt(r.now)} кг · ${esc(r.act)}</b></div>`).join('')}</div>
 ${said('«Нам нужно видеть остатки… инвентаризации… списание, брак бывает»')}`;

/* ===== Отгрузка переработчикам ===== */
SC.sales=()=>`<div class="hd"><div><h2>Отгрузка переработчикам</h2><p>Картон уходит на свой завод внутренним перемещением, плёнка, ПЭТ, ПНД и алюминий — партиями компаниям, которые перерабатывают. Видно цену продажи против цены закупа и маржу партии.</p></div><div class="btns"><button class="bt p" onclick="card('sale')">+ Партия</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Партия</th><th>Сырьё</th><th>Кому</th><th class="r">Вес</th><th class="r">Цена ₸/кг</th><th class="r">Сумма</th><th class="r">Маржа партии</th><th>Дата</th><th>Статус</th></tr></thead><tbody>
 ${SALES.map(x=>`<tr><td class="mono">${x.id}</td><td>${matTag(x.m)}</td><td>${esc(x.to)}<span class="sub">${esc(x.pay)}</span></td><td class="r">${tn(x.kg)}</td><td class="r">${x.price}</td><td class="r">${fmt(x.kg*x.price)}</td><td class="r pos">${fmt(x.kg*(x.price-RSTOCK[x.m].avg))}</td><td>${dd(x.d)}</td><td>${x.st==='done'?'<span class="tag g">закрыто</span>':x.st==='ship'?'<span class="tag w">в пути</span>':`<button class="bt" onclick="SALES.find(s=>s.id==='${x.id}').st='ship';RSTOCK['${x.m}'].kg-=${x.kg};render();toast('Партия отгружена — остаток склада уменьшен.')">Отгрузить</button>`}</td></tr>`).join('')}
 </tbody></table></div>
 ${said('«Картон — наш завод уже перерабатывает» · «Мы сдаём компаниям, которые уже сами перерабатывают. Мы занимаемся сбором»')}`;

/* ===== Выплаты сдатчикам ===== */
SC.payouts=()=>`<div class="hd"><div><h2>Выплаты сдатчикам</h2><p>За сырьё платим по-разному: наличными на месте (с подотчёта водителя), в кассе базы или безналом по акту. Кассир видит, кому и сколько, — сумма считается из рейсов и цен точки.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Кому</th><th>Основание</th><th>Как платим</th><th class="r">Сумма</th><th>Статус</th></tr></thead><tbody>
 ${PAYOUTS.map(v=>`<tr><td><b>${esc(v.who)}</b></td><td class="mini">${esc(v.note)}</td><td>${esc(v.how)}</td><td class="r"><b>${tg(v.sum||ptToday(v.to))}</b></td><td>${v.st==='paid'?`<span class="tag g">выплачено${v.by?' · '+STAFF[v.by]:''}</span>`:`<button class="bt p" onclick="payOut('${v.id}')">Выплатить</button>`}</td></tr>`).join('')}
 </tbody></table></div>`;
function payOut(id){const v=PAYOUTS.find(x=>x.id===id);if(!v)return;const s=v.sum||ptToday(v.to);v.sum=s;v.st='paid';v.by='GL';if(/кассе/.test(v.how))CASH.lines.push({t:'15:20',k:'out',n:'Выплата за сырьё · '+v.who,sum:s});render();toast(/кассе/.test(v.how)?`Выплачено ${tg(s)} из кассы — строка появилась в смене кассира.`:`Платёж ${tg(s)} отмечен — акт сверки по весам приложен.`)}
