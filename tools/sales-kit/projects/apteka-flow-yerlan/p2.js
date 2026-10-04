
/* ===== Расчёты ===== */
const SC={};
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const RES_ST=['res','pack','courier','refuse'];
const inStore=s=>store==='all'||store===s;
const stName=s=>STORES[s].n;
const reserved=(pid,s)=>ORDERS.filter(o=>o.s===s&&RES_ST.includes(o.st)).reduce((a,o)=>a+o.it.filter(i=>i[0]===pid).reduce((b,i)=>b+i[1],0),0);
const onHand=(pid,s)=>PR(pid).st[s][0];
const freeQ=(pid,s)=>onHand(pid,s)-reserved(pid,s);
const lineSum=i=>{const p=PR(i[0]);return i[2]==='u'&&p.u?p.u[2]*i[1]:p.price*i[1]};
const oSum=o=>o.it.reduce((a,i)=>a+lineSum(i),0);
const oQty=o=>o.it.reduce((a,i)=>a+i[1],0);
const cSum=c=>c.it.reduce((a,i)=>a+lineSum(i),0);
const ost=k=>{const s=OSTOF(k);return `<span class="st" style="--sc:${s.c}">${esc(s.n)}</span>`};
const mpm=k=>`<span class="mpm" style="--c:${MP[k].c}">${esc(MP[k].s)}</span>`;
const catm=k=>`<span class="catm" style="--c:${CATS[k].c}">${CATS[k].s}</span>`;
const stm=s=>`<span class="stm">${STORES[s].s}</span>`;
const ordL=id=>`<a class="lk mono" onclick="event.stopPropagation();openOrd('${id}')">${esc(id)}</a>`;
const prL=id=>`<a class="lk" onclick="event.stopPropagation();card('pr','${id}')">${esc(PR(id).n)}</a>`;
const vatSplit=items=>{const r={};items.forEach(i=>{const p=PR(i[0]),v=vatOf(p);r[v]=(r[v]||0)+lineSum(i)});return r};
const vatLine=items=>{const r=vatSplit(items);return Object.keys(r).sort((a,b)=>a-b).map(v=>`НДС ${v}%: ${tg(vatSum(r[v],+v))}`).join(' · ')};
const SO=()=>ORDERS.filter(o=>inStore(o.s));
const cnt=k=>SO().filter(o=>o.st===k).length;
const uAb=p=>({блистер:'бл.',пакетик:'пак.',маска:'шт.'})[p.u[0]]||'шт.';
const uPl=(p,n)=>plural(n,{блистер:['блистер','блистера','блистеров'],пакетик:['пакетик','пакетика','пакетиков'],маска:['маска','маски','масок']}[p.u[0]]||['шт.','шт.','шт.']);
const isPickup=o=>o.dlv.indexOf('Самовывоз')===0;
let tcN={A1:458,A2:319},fcN={A1:18825,A2:7418};
function fefoTake(pid,s,q){BATCHES.filter(b=>b.p===pid&&b.s===s&&b.q>0).sort((a,b)=>a.exp<b.exp?-1:1).forEach(b=>{const t=Math.min(b.q,q);b.q-=t;q-=t})}
function issue(o,how){o.st='done';const n=fcN[o.s]++;o.fc=`ФЧ-${o.s[1]}-0${n}`;o.it.forEach(i=>{PR(i[0]).st[o.s][0]-=i[1];fefoTake(i[0],o.s,i[1])});
 const wa=o.ph.indexOf('+7')===0;CHECKS.unshift({no:o.fc,s:o.s,t:NOW,src:o.mp,ord:o.id,it:o.it.map(i=>i.slice()),pay:MP[o.mp].s,ofd:'ok',wa});o.h.push([NOW,how+' → фискальный чек '+o.fc+' ушёл в ОФД'+(o.it.some(i=>PR(i[0]).mk)?', коды маркировки выведены из оборота в ИС МПТ':'')]);if(wa)o.h.push([NOW,'Ссылка на фискальный чек отправлена клиенту в WhatsApp']);o.dlv=o.dlv.split(' · ')[0]+' · выдан '+NOW}
function ordAdv(id){const o=OR(id);if(!o)return;let m='';
 if(o.st==='new'){const short=o.it.filter(i=>freeQ(i[0],o.s)<i[1]);if(short.length){toast(`Не хватает на ${stName(o.s)}: ${short.map(i=>esc(PR(i[0]).n)+' — нужно '+i[1]+', свободно '+freeQ(i[0],o.s)).join('; ')}. Сделайте перемещение с другой аптеки.`);return}
  o.st='res';o.tc=`ТЧ-${o.s[1]}-0${tcN[o.s]++}`;TCHECKS.unshift({no:o.tc,ord:o.id,s:o.s,d:TODAY,st:'res'});o.h.push([NOW,`Резерв на ${stName(o.s)}: ${oQty(o)} ${plural(oQty(o),['позиция','позиции','позиций'])} убраны из свободного остатка · товарный чек ${o.tc}`]);m=`Резерв поставлен: на Kaspi, Halyk и Forte остаток уменьшился сразу. Распечатан <b>товарный чек ${o.tc}</b> — фискального пока нет.`}
 else if(o.st==='res'){o.st='pack';o.h.push([NOW,'Собран · '+(STAFF[ROLES[role].p]||'сотрудник')]);m='Заказ собран. Следующий шаг — передать курьеру или выдать в аптеке.'}
 else if(o.st==='pack'){if(isPickup(o)){issue(o,'Выдан в аптеке');m=`Выдан в аптеке. <b>Фискальный чек ${o.fc}</b> пробит автоматически, товар списан с ${stName(o.s)}.`}else if(o.own){o.st='courier';o.courier='KR';o.h.push([NOW,'Передан своему курьеру Серику · заказ у него на карте']);m='Передан своему курьеру: адрес уже у Серика в телефоне. «Доставлен» — и чек пробьётся сам.'}else{o.st='courier';o.h.push([NOW,'Передан курьеру '+MP[o.mp].s]);m='Передан курьеру. Резерв держится, пока площадка не пришлёт «выдан» или «отказ».'}}
 else if(o.st==='courier'){issue(o,MP[o.mp].s+': выдан клиенту');m=`${MP[o.mp].s} прислал «выдан». <b>Фискальный чек ${o.fc}</b> ушёл в ОФД автоматически — руками ничего вводить не нужно.`}
 tcSync();render();if(document.getElementById('mbg').classList.contains('show'))card('ord',id);toast(m)}
function ordRefuse(id){const o=OR(id);if(!o)return;
 if(['new','res','pack'].includes(o.st)){o.st='back';o.why='Отменён до передачи курьеру';o.h.push([NOW,'Отмена до отправки · резерв снят, товар на полке']);toast('Заказ отменён до отправки — резерв снят сразу, чек не пробивался.')}
 else if(o.st==='courier'){o.st='refuse';o.why='Отказ клиента при доставке';o.h.push([NOW,MP[o.mp].s+': отказ клиента · товар везут назад']);toast('Отказ: товар в пути обратно. Резерв держится до тех пор, пока вы не подтвердите, что товар вернулся.')}
 tcSync();render();if(document.getElementById('mbg').classList.contains('show'))card('ord',id)}
function ordBack(id){const o=OR(id);if(!o||o.st!=='refuse')return;o.st='back';o.arrived=true;o.h.push([NOW,`Возврат принят · ${STAFF[ROLES[role].p]||'сотрудник'}: резерв снят, ${oQty(o)} шт. снова свободны на ${stName(o.s)}`]);o.dlv=o.dlv.split(' · ')[0]+' · возврат принят '+NOW;tcSync();render();if(document.getElementById('mbg').classList.contains('show'))card('ord',id);
 toast(`Возврат принят: резерв снят, товар снова в продаже на ${stName(o.s)} и на площадках. <b>Фискальный чек не пробивался</b> — возвращать через ОФД нечего, коды маркировки остались в обороте.`)}
function tcSync(){TCHECKS.forEach(t=>{const o=OR(t.ord);if(o)t.st=o.st})}
function setStore(s){const lock=ROLES[role].st;if(lock&&s!==lock&&s!=='all'){toast(`Роль «${esc(role)}» работает только со своей аптекой — так настроены права.`);return}store=s;buildSync();render()}

/* ===== Пульт дня ===== */
SC.today=()=>{const O=SO();const ch=CHECKS.filter(c=>inStore(c.s));
 const lanes=OST.map(s=>({s,n:O.filter(o=>o.st===s.k).length}));
 const rev={};Object.keys(MP).forEach(k=>rev[k]={A1:0,A2:0});ch.forEach(c=>rev[c.src][c.s]+=cSum(c));
 const tot=Object.values(rev).reduce((a,r)=>a+r.A1+r.A2,0);
 const AL=[];
 O.filter(o=>o.st==='new').forEach(o=>AL.push(['b',`Новый заказ ${MP[o.mp].s} ${o.id}`,`${esc(o.cl)} · ${oQty(o)} шт. · ${tg(oSum(o))} · ${stName(o.s)} — поставить в резерв`,`openOrd('${o.id}')`]));
 O.filter(o=>o.own&&o.st==='pack').forEach(o=>AL.push(['b',`Своя доставка ${o.id} — передать курьеру`,`${esc(o.addr)} · ${tg(oSum(o))} · ${stName(o.s)}`,`go('courier')`]));
 O.filter(o=>o.st==='refuse'&&o.arrived).forEach(o=>AL.push(['r',`Отказ ${o.id} привезли в аптеку`,`Подтвердите, что товар на месте — резерв снимется, остаток восстановится`,`openOrd('${o.id}')`]));
 O.filter(o=>o.st==='refuse'&&!o.arrived).forEach(o=>AL.push(['w',`Отказ ${o.id} — товар в пути назад`,`${esc(o.why||'')} · резерв держится до приёмки`,`openOrd('${o.id}')`]));
 PRODUCTS.forEach(p=>SK.filter(inStore).forEach(s=>{if(freeQ(p.id,s)<p.min&&freeQ(p.id,s)<=p.min/3)AL.push(['w',`${esc(p.n)} — ${freeQ(p.id,s)} уп. на ${STORES[s].s}`,`Минимум ${p.min}. ${MOVES.some(m=>m.st==='way'&&m.to===s&&m.lines.some(l=>l[0]===p.id))?'Перемещение уже в пути':'Заказать у поставщика или переместить'}`,`card('pr','${p.id}')`])}));
 if(INT('ismp').st==='err')AL.push(['r','ИС МПТ: 1 код БАД не найден','Накладная ВМ-Н-2207 «Витамакс» — запрос поставщику отправлен',`card('int','ismp')`]);
 BATCHES.filter(b=>inStore(b.s)&&b.q>0&&daysBetween(TODAY,b.exp)<=45).forEach(b=>AL.push(['w',`Срок: ${esc(PR(b.p).n)}`,`Партия ${b.no} · ${b.q} уп. на ${STORES[b.s].s} · годен до ${dl(b.exp)}`,`go('batches')`]));
 CONTRACTS.filter(c=>daysBetween(TODAY,c.to)<=30).forEach(c=>AL.push(['i',`Договор ${c.no} истекает ${dl(c.to)}`,`${esc(SU(c.sup).n)} — продлить или подписать ДС`,`card('ctr','${c.id}')`]));
 if(INT('wolt').st==='wait')AL.push(['i','Wolt: нужен доступ к API','Запрос в Wolt отправлен · пока заказы Wolt вносятся вручную',`card('int','wolt')`]);
 PRODUCTS.filter(p=>p.nkt!=='ok'&&p.mpl.length).forEach(p=>AL.push(['i',`НКТ: карточка «${esc(p.n)}» на модерации`,'Пока на площадках не публикуется',`go('nkt')`]));
 return `<div class="hd"><div><h2>Пульт дня · 1 октября, ${NOW}</h2><p>${store==='all'?'Обе аптеки':stName(store)+' · '+STORES[store].addr}. Все заказы Kaspi, Halyk, Forte и Wolt попадают сюда сами — вводить номер, товар и сумму вручную больше не нужно.</p></div><div class="btns"><button class="bt" onclick="go('analytics')">Аналитика</button><button class="bt p" onclick="go('orders')">Лента заказов</button></div></div>
 <div class="route">${lanes.map(l=>`<div class="rt rt-${l.s.k}" style="--c:${l.s.c}" onclick="ordF='${l.s.k}';go('orders')"><small>${esc(l.s.n)}</small><b>${l.n}</b><span>${esc(l.s.d)}</span></div>`).join('')}</div>
 <div class="g21"><div class="pan"><h3>Требует действия · ${AL.length}</h3><p>Система сама собирает то, что раньше держалось в голове: новые заказы, отказы, минимальные остатки, сроки, ошибки маркировки, договоры.</p>${AL.slice(0,9).map(a=>`<div class="al ${a[0]}" onclick="${a[3]}"><b>${a[1]}</b><span>${a[2]}</span></div>`).join('')}</div>
 <div><div class="pan"><h3>Выручка сегодня · ${tg(tot)}</h3><p>Только по фискальным чекам — заказ в пути выручкой не считается.</p><div class="tw"><table class="t"><thead><tr><th>Канал</th>${SK.filter(inStore).map(s=>`<th class="r">${STORES[s].s}</th>`).join('')}<th class="r">Итого</th></tr></thead><tbody>${Object.keys(MP).map(k=>`<tr onclick="go('checks')"><td>${mpm(k)} ${esc(MP[k].n)}</td>${SK.filter(inStore).map(s=>`<td class="r mono">${fmt(rev[k][s])}</td>`).join('')}<td class="r mono"><b>${fmt(rev[k].A1+rev[k].A2)}</b></td></tr>`).join('')}</tbody></table></div>
  <div class="kv" style="margin-top:8px"><span>Фискальных чеков сегодня</span><b>${ch.length}</b></div><div class="kv"><span>Открытых товарных чеков (резерв, сборка, доставка)</span><b>${O.filter(o=>RES_ST.includes(o.st)).length}</b></div><div class="kv"><span>Товар в резерве, по продажной цене</span><b>${tg(O.filter(o=>RES_ST.includes(o.st)).reduce((a,o)=>a+oSum(o),0))}</b></div></div>
 <div class="pan"><h3>Интеграции</h3>${INTEG.map(i=>`<div class="kv" style="cursor:pointer" onclick="card('int','${i.k}')"><span><i class="dot ${i.st}"></i>${esc(i.full)}</span><b class="mono">${esc(i.ago)}</b></div>`).join('')}</div></div></div>
 ${said('«Заказ выпал — мне надо у себя в программе сделать реализацию: ввести номер заказа, наименование товара, сумму, откуда упал заказ, в какой магазин… А заказ в пути — клиент может отказать, а я уже пробил фискальный чек.»','Теперь: заказ приходит сам, до выдачи — только резерв и товарный чек, фискальный чек — автоматически по статусу «выдан».')}`};

/* ===== Аналитика ===== */
const MONTH={wolt:{A1:[260000,41,1],A2:[190000,30,1]},kaspi:{A1:[4210000,312,11],A2:[2940000,228,9]},halyk:{A1:[910000,74,6],A2:[620000,51,4]},forte:{A1:[380000,33,5],A2:[290000,24,3]},shop:{A1:[6820000,2140,0],A2:[5130000,1720,0]}};
const MONTH_PREV={wolt:230000,kaspi:3720000,halyk:780000,forte:410000,shop:11400000};
SC.analytics=()=>{const S=SK.filter(inStore);const sum=k=>S.reduce((a,s)=>a+MONTH[k][s][0],0),cnt2=k=>S.reduce((a,s)=>a+MONTH[k][s][1],0),ref=k=>S.reduce((a,s)=>a+MONTH[k][s][2],0);
 const tot=Object.keys(MP).reduce((a,k)=>a+sum(k),0),mx=Math.max(...Object.keys(MP).map(sum));
 const top=[['P07',96,315840],['P09',61,365390],['P01',388,112520],['P12',14,250600],['P04',118,116820],['P08',41,188190],['P16',57,136230]];
 const marg=p=>pct(PR(p).price-PR(p).cost,PR(p).price);
 const prev=Object.keys(MP).reduce((a,k)=>a+MONTH_PREV[k],0)*(S.length/2),grow=pct(tot-prev,prev);
 return `<div class="hd"><div><h2>Аналитика · сентябрь 2026</h2><p>${store==='all'?'Обе аптеки':stName(store)}. Продажи по каналам и аптекам, отказы по площадкам, маржа по товарам, остатки без движения. Любой показатель, который захотите — добавим.</p></div><div class="btns"><button class="bt" onclick="act('report')">Отчёт в WhatsApp каждый вечер</button></div></div>
 <div class="wid"><div><small>Выручка за месяц</small><b class="a">${mln(tot)}</b><span>${grow>0?'+':''}${grow}% к августу</span></div><div><small>Доля площадок</small><b>${pct(tot-sum('shop'),tot)}%</b><span>Kaspi + Halyk + Forte</span></div><div><small>Заказов с площадок</small><b>${fmt(cnt2('kaspi')+cnt2('halyk')+cnt2('forte'))}</b><span>отказов ${ref('kaspi')+ref('halyk')+ref('forte')}</span></div><div><small>Средний чек в аптеке</small><b>${tg(sum('shop')/cnt2('shop'))}</b><span>${fmt(cnt2('shop'))} чеков</span></div><div><small>Валовая маржа</small><b class="g">36%</b><span>по себестоимости партий</span></div></div>
 <div class="g2"><div class="pan"><h3>Выручка по каналам</h3><p>Сентябрь, по фискальным чекам.</p>${Object.keys(MP).map(k=>`<div class="fr"><span>${mpm(k)} ${esc(MP[k].n)}</span><div class="bar"><i style="--w:${pct(sum(k),mx)}%;background:${MP[k].c}"></i></div><b>${mln(sum(k))} · ${pct(sum(k),tot)}%</b></div>`).join('')}
  <div class="tw" style="margin-top:12px"><table class="t"><thead><tr><th>Канал</th>${S.map(s=>`<th class="r">${STORES[s].s}</th>`).join('')}<th class="r">Заказов</th><th class="r">Отказы</th></tr></thead><tbody>${Object.keys(MP).map(k=>`<tr><td>${esc(MP[k].s)}</td>${S.map(s=>`<td class="r mono">${fmt(MONTH[k][s][0])}</td>`).join('')}<td class="r mono">${fmt(cnt2(k))}</td><td class="r mono">${k==='shop'?'—':ref(k)+' · '+(Math.round(ref(k)/cnt2(k)*1000)/10).toString().replace('.',',')+'%'}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Топ товаров площадок</h3><p>Сколько продано, на какую сумму и какая маржа.</p><div class="tw"><table class="t"><thead><tr><th>Товар</th><th class="r">Шт.</th><th class="r">Сумма</th><th class="r">Маржа</th></tr></thead><tbody>${top.map(t=>`<tr onclick="card('pr','${t[0]}')"><td>${esc(PR(t[0]).n)}</td><td class="r mono">${t[1]}</td><td class="r mono">${fmt(t[2])}</td><td class="r mono">${marg(t[0])}%</td></tr>`).join('')}</tbody></table></div>
  <div class="note" style="--tone:var(--warn)"><b>Без движения 60+ дней</b><p>Крем детский 75 мл — 10 шт. на 9 800 ₸ себестоимости; пластырь №20 на №2 — 16 шт. Предложение: переместить или выставить на Kaspi.</p></div></div></div>
 <div class="pan"><h3>Отказы по площадкам и причинам</h3><p>Каждый отказ — это товар, который сутки-двое был в резерве и не продавался. Видно, где их больше.</p><div class="g3" style="margin:0">${[['Клиент не отвечал',9,'kaspi'],['Передумал при получении',7,'forte'],['Неверный адрес',6,'kaspi'],['Долгая доставка',5,'halyk'],['Нашёл дешевле',4,'kaspi'],['Прочее',7,'halyk']].map(r=>`<div class="kv"><span>${r[0]}</span><b class="mono">${r[1]}</b></div>`).join('')}</div></div>`};
