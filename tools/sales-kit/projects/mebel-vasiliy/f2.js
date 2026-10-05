
/* ===== Общие ===== */
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const stg=k=>{const s=STN(k);return `<span class="stg" style="--sc:${s.c}">${s.n}</span>`};
const KIND={kitchen:'Кухня',wardrobe:'Шкаф / гардероб',other:'Другое изделие'};
const ready=o=>{const s=STN(o.st);if(o.st!=='podr')return s.r;const J=JOBS.filter(j=>j.ord===o.id);return s.r+Math.round((J.filter(j=>j.st==='done').length/Math.max(1,J.length))*15)};
const rbar=o=>`<div class="rd"><span><i style="width:${ready(o)}%"></i></span><b>${ready(o)} %</b></div>`;
const debt=o=>STI(o.st)>STI('dog')?o.sum-o.paid:0;
const jobsOf=id=>JOBS.filter(j=>j.ord===id);
const coDebt=p=>JOBS.filter(j=>j.p===p&&j.st!=='sent').reduce((a,j)=>a+j.sum-j.paid,0);
const inWork=()=>ORDERS.filter(o=>!['lead','done'].includes(o.st));
const SC={};

function hot(){const F=[];
 JOBS.filter(jLate).forEach(j=>F.push({lv:'bad',t:`${CO(j.p).n} просрочил ${daysBetween(j.due,TODAY)} дн. · ${j.ord}`,s:`${j.w} · срок был ${dd(j.due)}, монтаж у клиента ${dd(OR(j.ord).mont)}`,go:`go('contractors')`}));
 STOCK.filter(s=>s.q-s.res<0).forEach(s=>F.push({lv:'bad',t:`Не хватает на складе: ${s.n.split(' · ')[0]}`,s:`есть ${s.q} ${s.u}, в резерве под заказы ${s.res} — дозаказать ${s.res-s.q}`,go:`go('requests')`}));
 ORDERS.filter(o=>o.st==='dog'&&o.chM.some(x=>!x)).forEach(o=>F.push({lv:'warn',t:`${o.id}: чек-лист менеджера не закрыт`,s:`${STAFF[o.mgr]} · ${o.chM.filter(x=>!x).length} пункта — карточка не уйдёт конструктору`,go:`openOrd('${o.id}')`}));
 ORDERS.filter(o=>o.st==='wait').forEach(o=>F.push({lv:'warn',t:`${o.id} готов и ждёт монтажа на складе`,s:`${CL(o.cl).n} · монтаж ${dd(o.mont)} · менеджеру ушло уведомление`,go:`openOrd('${o.id}')`}));
 ORDERS.filter(o=>o.st==='done'&&debt(o)>0).forEach(o=>F.push({lv:'warn',t:`${CL(o.cl).n} должен ${tg(debt(o))}`,s:`${o.id} сдан ${dd(o.mont)}, остаток не оплачен`,go:`go('debts')`}));
 return F}

/* ===== Собственник ===== */
SC.today=()=>{const W=inWork();const F=hot();const debts=ORDERS.reduce((a,o)=>a+debt(o),0);const cd=CONTR.reduce((a,c)=>a+coDebt(c.id),0);
 const inn=CASH.filter(c=>c.k==='in').reduce((a,c)=>a+c.s,0),out=CASH.filter(c=>c.k==='out').reduce((a,c)=>a+c.s,0);
 return `<div class="hd"><div><h2>Пульт · ${dd(TODAY)}, ${dayOf(TODAY)}</h2><p>Все заказы — на каком этапе и насколько готовы, что горит у подрядчиков и на складе, деньги месяца. Вместо восемнадцати Google-таблиц — одна система.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('funnel')"><small>Заказов в работе</small><b>${W.length}</b><span>на ${mln(W.reduce((a,o)=>a+o.sum,0))}</span></div>
  <div class="clk" onclick="go('contractors')"><small>У подрядчиков</small><b class="w">${JOBS.filter(j=>j.st!=='done').length}</b><span>${JOBS.filter(jLate).length} просрочено</span></div>
  <div class="clk" onclick="go('debts')"><small>Клиенты должны</small><b class="a">${mln(debts)}</b><span>остатки по договорам</span></div>
  <div class="clk" onclick="go('debts')"><small>Мы должны подрядчикам</small><b class="r">${mln(cd)}</b><span>за принятые и в работе</span></div>
  <div class="clk" onclick="go('money')"><small>Октябрь: пришло / ушло</small><b>${mln(inn)} / ${mln(out)}</b><span>с 1 октября</span></div>
 </div>
 <div class="g21">
  <div class="pan"><h3>Заказы и готовность</h3><div class="tw"><table class="t"><thead><tr><th>Заказ</th><th>Клиент</th><th>Этап</th><th style="width:170px">Готовность</th><th>Монтаж</th><th class="r">Сумма</th></tr></thead><tbody>
  ${W.sort((a,b)=>STI(b.st)-STI(a.st)).map(o=>`<tr class="clk" onclick="openOrd('${o.id}')"><td><b>${o.id}</b><div class="sub">${KIND[o.kind]}</div></td><td>${esc(CL(o.cl).n)}</td><td>${stg(o.st)}</td><td>${rbar(o)}</td><td class="mono">${o.mont?dd(o.mont):'—'}</td><td class="r mono">${fmt(o.sum)}</td></tr>`).join('')}</tbody></table></div></div>
  <div class="pan hot"><h3>Горит · ${F.length}</h3>${F.map(f=>`<div class="rf ${f.lv}" onclick="${f.go}"><i></i><div><b>${f.t}</b><span>${f.s}</span></div></div>`).join('')}</div>
 </div>
 <div class="pan"><h3>Воронка сейчас</h3><div class="fl">${ST.filter(s=>s.k!=='done').map(s=>{const n=ORDERS.filter(o=>o.st===s.k).length;return `<div onclick="go('funnel')" style="--sc:${s.c}"><b>${n}</b><span>${s.n}</span></div>`}).join('')}</div></div>
 ${said('«У меня около восемнадцати Google-таблиц, которые отвечают за свои определённые действия: долги клиентов, учёт подрядчиков, расчётник, зарплаты, приходы и расходы».')}`};

SC.money=()=>{const cats=[...new Set(CASH.filter(c=>c.k==='out').map(c=>c.c))];const out=CASH.filter(c=>c.k==='out');const tot=out.reduce((a,c)=>a+c.s,0);
 return `<div class="hd"><div><h2>Приходы и расходы · октябрь</h2><p>Оплаты клиентов и подрядчикам попадают сюда из карточек заказов сами. Административные расходы — чай, кофе, вода, уборка, кондиционер, техника, аренда — вносятся одной строкой и тоже видны.</p></div><div class="btns"><button class="bt p" onclick="card('cash')">+ Расход</button></div></div>
 <div class="g2"><div class="pan"><h3>Расходы по статьям</h3>${cats.map(c=>{const s=out.filter(x=>x.c===c).reduce((a,x)=>a+x.s,0);return `<div class="hb"><span>${c}</span><i style="width:${pct(s,tot)}%"></i><b class="mono">${fmt(s)}</b></div>`}).join('')}</div>
 <div class="pan"><h3>Подписки, которые уйдут</h3><div class="kv"><span>Битрикс24 и МойСклад</span><b class="mono neg">108 000 ₸ в месяц</b></div><div class="kv"><span>За год</span><b class="mono neg">1 296 000 ₸</b></div><div class="kv"><span>Своя система: сервер</span><b class="mono">до 10 000 ₸ в месяц</b></div><div class="kv"><span>WhatsApp, казахстанский провайдер</span><b class="mono">≈ 5 000 ₸ за номер</b></div>${said('«Мы на Битриксе и на Моём складе каждый месяц платим абонентскую плату… они каждый год поднимают цены».')}</div></div>
 <div class="tw"><table class="t"><thead><tr><th>Дата</th><th>Статья</th><th>Что</th><th class="r">Приход</th><th class="r">Расход</th></tr></thead><tbody>${CASH.slice().reverse().map(c=>`<tr><td class="mono">${dd(c.d)}</td><td><span class="tag ${c.c==='Административные'?'w':c.c==='Заказы'?'g':''}">${c.c}</span></td><td>${esc(c.n)}</td><td class="r mono pos">${c.k==='in'?fmt(c.s):''}</td><td class="r mono neg">${c.k==='out'?fmt(c.s):''}</td></tr>`).join('')}</tbody></table></div>
 ${said('«Есть ещё административные расходы: чай, кофе, вода, кондиционер, уборка, покупка оборудования какого-то — чтобы это тоже где-то фиксировалось, аренда».')}`};

SC.debts=()=>{const O=ORDERS.filter(o=>debt(o)>0).sort((a,b)=>STI(b.st)-STI(a.st));
 return `<div class="hd"><div><h2>Долги клиентов и подрядчикам</h2><p>Слева — кто из клиентов сколько должен и на каком этапе заказ. Справа — сколько мы должны каждому подрядчику: цена фиксируется, когда конструктор передал работу, оплаты вычитаются.</p></div></div>
 <div class="g2"><div class="pan"><h3>Клиенты · ${tg(O.reduce((a,o)=>a+debt(o),0))}</h3><div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Заказ</th><th>Этап</th><th class="r">Долг</th></tr></thead><tbody>${O.map(o=>`<tr class="clk ${o.st==='done'?'rowbad':''}" onclick="openOrd('${o.id}')"><td>${esc(CL(o.cl).n)}</td><td>${o.id}</td><td>${stg(o.st)}</td><td class="r mono">${fmt(debt(o))}</td></tr>`).join('')}</tbody></table></div><p class="mini">Красная строка — заказ сдан, остаток не оплачен.</p></div>
 <div class="pan"><h3>Подрядчики · ${tg(CONTR.reduce((a,c)=>a+coDebt(c.id),0))}</h3><div class="tw"><table class="t"><thead><tr><th>Подрядчик</th><th class="r">Начислено</th><th class="r">Оплачено</th><th class="r">Должны</th></tr></thead><tbody>${CONTR.filter(c=>JOBS.some(j=>j.p===c.id)).map(c=>{const J=JOBS.filter(j=>j.p===c.id&&j.st!=='sent');const s=J.reduce((a,j)=>a+j.sum,0),p=J.reduce((a,j)=>a+j.paid,0);return `<tr class="clk" onclick="curCo='${c.id}';go('contractor')"><td><b>${esc(c.n)}</b><div class="sub">${esc(c.w)}</div></td><td class="r mono">${fmt(s)}</td><td class="r mono">${fmt(p)}</td><td class="r mono ${s-p?'neg':''}">${fmt(s-p)}</td></tr>`}).join('')}</tbody></table></div></div></div>
 ${said('«Чтобы конструктор зафиксировал цену — и мы сразу увидели, сколько какому подрядчику денег должны, сколько уже оплатили, какое у нас с ним сальдо».')}`};

SC.salary=()=>`<div class="hd"><div><h2>Зарплаты · октябрь</h2><p>Оклад плюс сдельная часть: бригадам — за собранные и смонтированные заказы, конструкторам — за сданные проекты. Сдельная часть считается из карточек, а не в отдельной таблице.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Сотрудник</th><th>Роль</th><th class="r">Оклад</th><th class="r">Сдельно</th><th>Откуда сдельная</th><th class="r">Итого</th></tr></thead><tbody>${SAL.map(s=>`<tr><td><b>${s.n}</b></td><td>${s.r}</td><td class="r mono">${fmt(s.ok)}</td><td class="r mono">${s.pc?fmt(s.pc):'—'}</td><td class="mini">${s.r.startsWith('Бригада')?'сборка и монтаж: К-1505, К-1510, К-1502':s.r==='Конструктор'?'проекты, переданные в производство':'—'}</td><td class="r mono"><b>${fmt(s.ok+s.pc)}</b></td></tr>`).join('')}
 <tr class="total"><td colspan="5">Итого начислено</td><td class="r mono">${fmt(SAL.reduce((a,s)=>a+s.ok+s.pc,0))}</td></tr></tbody></table></div>
 <div class="note"><b>Менеджерам — без бонуса за продажу</b><p>Как сейчас: заказы приходят по сарафану, менеджер их прорабатывает. Если решите ввести процент за сданный в срок заказ — он добавляется правилом.</p></div>
 <div class="note" style="--tone:var(--muted)"><b>Доступ</b><p>Зарплаты видит только собственник. Сборщик видит только свой заказ, кладовщик — только склад.</p></div>`;

SC.analytics=()=>{const mx=Math.max(...MONTHS.map(m=>m[2]));
 return `<div class="hd"><div><h2>Аналитика</h2><p>Сколько заказов и на какую сумму, откуда клиенты, сколько дней от договора до монтажа, кто из подрядчиков срывает сроки.</p></div></div>
 <div class="wid"><div><small>Заказов в сентябре</small><b>12</b><span>на 21,6 млн ₸</span></div><div><small>Средний чек</small><b class="a">1,8 млн</b><span>кухня — 2,6 млн</span></div><div><small>Замер → договор</small><b>64 %</b><span>конверсия</span></div><div><small>Договор → монтаж</small><b>34 дня</b><span>в среднем</span></div><div><small>Подрядчики в срок</small><b class="w">81 %</b><span>«Стекло-Мастер» — 62 %</span></div></div>
 <div class="g2"><div class="pan"><h3>Выручка по месяцам</h3><div class="bars">${MONTHS.map(m=>`<div><b>${mln(m[2])}</b><i style="height:${Math.round(m[2]/mx*130)}px"></i><span>${m[0]}<br><small>${m[1]} заказов</small></span></div>`).join('')}</div></div>
 <div class="pan"><h3>Откуда клиенты</h3>${[['Сарафан',62],['Повторные',21],['Instagram',9],['2ГИС',8]].map(x=>`<div class="hb"><span>${x[0]}</span><i style="width:${x[1]}%"></i><b class="mono">${x[1]} %</b></div>`).join('')}<h3 style="margin-top:14px">Где заказы стоят дольше всего</h3>${[['У подрядчиков',11],['Конструкторская документация',7],['Готово · ждёт монтажа',5],['Сборка в цеху',4]].map(x=>`<div class="hb"><span>${x[0]}</span><i style="width:${x[1]*8}%;background:var(--warn)"></i><b class="mono">${x[1]} дн.</b></div>`).join('')}</div></div>`};
