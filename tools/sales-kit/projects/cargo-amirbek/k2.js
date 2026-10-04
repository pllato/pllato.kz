
/* ===== Расчёты ===== */
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const com=d=>d.c-d.d;
const vat=d=>d.nds?Math.round(com(d)*12/112):0;
const net=d=>com(d)-vat(d);
const route=d=>`${esc(d.from)} → ${esc(d.to)}`;
const stg=k=>{const s=STN(k);return `<span class="stg" style="--sc:${s.c}">${s.n}</span>`};
const fl=f=>f==='bad'?'<span class="flag bad" title="Красная пометка">●</span>':f==='warn'?'<span class="flag warn" title="Пометка">●</span>':'';
const docsOk=d=>d.docs.every(Boolean);
const drvDocsOk=d=>d.docs[3]&&d.docs[4]&&d.docs[5];
const afterUnl=d=>STI(d.st)>=STI('unl');
/* деньги водителей, которые уже лежат на счёте: клиент оплатил, водителю ещё нет */
const held=()=>DEALS.filter(d=>d.paidC&&!d.paidD);
const heldDrv=()=>held().reduce((a,d)=>a+d.d,0);
const heldCom=()=>held().reduce((a,d)=>a+com(d),0);
/* заплатили водителю своими, клиент ещё не оплатил */
const frozen=()=>DEALS.filter(d=>d.paidD&&!d.paidC);
/* клиент должен после выгрузки */
const owing=()=>DEALS.filter(d=>!d.paidC&&afterUnl(d));
const OTHERDEBT={n:25,sum:6840000,drv:5960000,com:880000};
const fundsSum=()=>FUNDS.vat+FUNDS.staff+FUNDS.tax+FUNDS.fix;
const notMine=()=>heldDrv()+heldCom()+fundsSum();
const freeMine=()=>BANK.open-notMine();
const waitMine=()=>owing().reduce((a,d)=>a+net(d)*RULES.find(r=>r.k==='own').p/100,0)+OTHERDEBT.com*RULES.find(r=>r.k==='own').p/100;
const monthCom=()=>MONTHS[MONTHS.length-1][2];
/* когда платим водителю: на «Оплате водителю» — сегодня, иначе через 2 дня после выгрузки */
const drvPayDay=d=>{if(d.paidD)return null;if(d.st==='pay'||d.st==='docs')return TODAY;const x=addDays(d.unl,2);return x<TODAY?TODAY:x};
const clPayDay=d=>{if(d.paidC)return null;return addDays(d.unl,CL(d.cl).term)};
function dayEvents(day){const E=[];
 DEALS.forEach(d=>{const p=drvPayDay(d);if(p===day)E.push({k:'out',n:`Водителю ${DR(d.dr).n} · ${d.id} ${d.from} → ${d.to}`,s:d.d,deal:d.id,ok:d.st==='pay'?'документы на месте':d.st==='docs'?(drvDocsOk(d)?'документы на месте':'нет документов от водителя'):'после выгрузки и документов'});
  const c=clPayDay(d);if(c===day&&c>=TODAY)E.push({k:'in',n:`${CL(d.cl).n} · ${d.id}`,s:d.c,deal:d.id});
  if(c&&c<TODAY&&day===TODAY)E.push({k:'late',n:`${CL(d.cl).n} · ${d.id} — просрочено ${daysBetween(c,TODAY)} дн.`,s:d.c,deal:d.id})});
 FIXED.forEach(f=>{if(f.d===day)E.push({k:f.done?'paid':'fix',n:f.n,s:f.s,f:f.f,bx:f.bx})});
 return E}
function projection(){const R={};let b=BANK.open;for(let i=1;i<=31;i++){const day='2026-10-'+String(i).padStart(2,'0');const E=dayEvents(day);const inn=E.filter(e=>e.k==='in').reduce((a,e)=>a+e.s,0),out=E.filter(e=>e.k==='out'||e.k==='fix').reduce((a,e)=>a+e.s,0);if(day>=TODAY)b+=inn-out;R[day]={E,inn,out,bal:day>=TODAY?b:null}}return R}
const phaseOf=i=>i<=12?1:i<=17?2:3;
const PHASES=[[1,'1–12','ФОТ, аренда, оклады — самая большая нагрузка'],[2,'13–17','окно: почти ничего не платим'],[3,'18–31','кредиты, налоги, личные расходы']];

function splitBar(){const parts=[['drv','Деньги водителей',heldDrv(),'#7b8794'],['com','Комиссия в работе',heldCom(),'#b9a37a'],['vat','НДС',FUNDS.vat,'#a8534a'],['staff','Фонд сотрудников',FUNDS.staff,'#2a6fb0'],['tax','Налоги',FUNDS.tax,'#c23b3b'],['fix','Обязательные',FUNDS.fix,'#8a5cc2'],['own','Моё свободно',freeMine(),'#2e7d4f']];
 return `<div class="split"><div class="sbar">${parts.map(p=>`<i style="flex:${Math.max(p[2],0)};background:${p[3]}" title="${p[1]}: ${tg(p[2])}"></i>`).join('')}</div><div class="slg">${parts.map(p=>`<span><i style="background:${p[3]}"></i>${p[1]}<b>${mln(p[2])}</b></span>`).join('')}</div></div>`}

/* ===== Деньги ===== */
const SC={};
SC.today=()=>{const pay=DEALS.filter(d=>drvPayDay(d)===TODAY);const flags=redFlags();const P=projection();const next=[];for(let i=0;i<8;i++)next.push(addDays(TODAY,i));
 return `<div class="hd"><div><h2>Пульт собственника · ${dd(TODAY)}, ${dayOf(TODAY)}</h2><p>Одним экраном: сколько на счёте и сколько из этого ваше, кому платить сегодня, что горит. Открыли с телефона где угодно — и всё понятно.</p></div><div class="btns"><button class="bt" onclick="act('report')">Отчёт в WhatsApp в 19:00</button></div></div>
 <div class="wid">
  <div onclick="go('money')" class="clk"><small>На счетах</small><b>${mln(BANK.open)}</b><span>Kaspi + Halyk, на ${NOW}</span></div>
  <div onclick="go('money')" class="clk"><small>Не ваше</small><b class="r">${mln(notMine())}</b><span>водителям, НДС, фонды</span></div>
  <div onclick="go('money')" class="clk"><small>Ваше свободно</small><b class="g">${mln(freeMine())}</b><span>можно тратить</span></div>
  <div onclick="go('debts')" class="clk"><small>Ещё не пришло вашей прибыли</small><b class="w">${mln(waitMine())}</b><span>${owing().length+OTHERDEBT.n} ${plural(owing().length+OTHERDEBT.n,['клиент должен','клиента должны','клиентов должны'])}</span></div>
  <div onclick="go('analytics')" class="clk"><small>План месяца</small><b class="a">${pct(monthCom(),PLAN)} %</b><span>${mln(monthCom())} из ${mln(PLAN)} в сентябре</span></div>
 </div>
 ${splitBar()}
 <div class="g21">
  <div class="pan"><h3>Сегодня оплатить водителям · ${tg(pay.reduce((a,d)=>a+d.d,0))}</h3>
   <div class="tw"><table class="t"><thead><tr><th>Рейс</th><th>Водитель</th><th>Клиент оплатил</th><th>Документы</th><th class="r">Сумма</th></tr></thead><tbody>
   ${pay.map(d=>`<tr class="clk" onclick="openDeal('${d.id}')"><td><b>${d.id}</b><div class="sub">${route(d)}</div></td><td>${esc(DR(d.dr).n)} ${fl(DR(d.dr).f)}</td><td>${d.paidC?`<span class="tag g">${dd(d.paidC)} · ${daysBetween(d.paidC,TODAY)} дн. назад</span>`:'<span class="tag r">ещё нет — платим своими</span>'}</td><td>${drvDocsOk(d)?'<span class="tag g">3 из 3</span>':`<span class="tag r">${d.docs.slice(3).filter(Boolean).length} из 3 — оплату держим</span>`}</td><td class="r mono">${fmt(d.d)}</td></tr>`).join('')}</tbody></table></div>
   <div class="note" style="--tone:var(--warn)"><b>R-1004 · Екатеринбург → Караганда</b><p>Клиент оплатил 25.09 — за 7 дней до выгрузки. Машина выгрузилась только 02.10, водителю 950 000 ₸. Эти деньги всю неделю лежали на счёте как будто ваши — теперь система держит их отдельно, пока не оплатите.</p></div>
  </div>
  <div class="pan hot"><h3>Горит · ${flags.length}</h3>${flags.slice(0,7).map(f=>`<div class="rf ${f.lv}" onclick="${f.go}"><i></i><div><b>${f.t}</b><span>${f.s}</span></div></div>`).join('')}</div>
 </div>
 <div class="pan"><h3>Ближайшие дни · что придёт и что уйдёт</h3><div class="days">${next.map(day=>{const p=P[day];return `<div class="day ${p.bal<0?'bad':p.bal<2000000?'warn':''}" onclick="card('day','${day}')"><small>${dd(day)} · ${dayOf(day)}</small><span>+ ${mln(p.inn)}</span><span>− ${mln(p.out)}</span><b>${mln(p.bal)}</b></div>`}).join('')}</div><p class="mini" style="margin:8px 0 0">Остаток на счетах на конец дня — по тому, что уже есть в системе: выгрузки, сроки оплаты клиентов, зарплаты по вашим датам, кредиты.</p></div>
 <div class="pan"><h3>Перевозки сейчас</h3><div class="fleet">${ST.filter(s=>s.k!=='done').map(s=>{const n=DEALS.filter(d=>d.st===s.k).length;return `<div onclick="go('board')" style="--sc:${s.c}"><b>${n}</b><span>${s.n}</span></div>`}).join('')}<div style="--sc:#2e7d4f"><b>179</b><span>фур в сентябре</span></div></div></div>
 ${said('«Я завтра хочу где-то, условно, на Бали быть — открыл, и всё знаю сразу, вижу в моменте».')}`};

function redFlags(){const F=[];
 DEALS.filter(d=>['load','road'].includes(d.st)&&(!d.cc||!d.cd||!d.ok)).forEach(d=>F.push({lv:'bad',t:`${d.id} грузится без договора с ${!d.cd?'водителем':'клиентом'}`,s:`${route(d)} · ${DR(d.dr).n} · логист ${STAFF[d.lg]}`,go:`openDeal('${d.id}')`}));
 DEALS.filter(d=>d.st==='unl'&&!drvDocsOk(d)).forEach(d=>F.push({lv:'bad',t:`${DR(d.dr).n} на выгрузке и ждёт оплату`,s:`${d.id} · документов от водителя нет — без них бухгалтер не оплатит`,go:`openDeal('${d.id}')`}));
 TASKS.filter(overdue).forEach(t=>F.push({lv:'bad',t:`Просрочена задача · ${STAFF[t.who]}`,s:`${t.t} · срок ${t.due.slice(8,10)}.${t.due.slice(5,7)} ${t.due.slice(11)} — дашборд сотрудника закрыт`,go:`go('tasks')`}));
 DEALS.filter(d=>['load','road','dog'].includes(d.st)&&DR(d.dr).f==='bad').forEach(d=>F.push({lv:'warn',t:`${d.id}: водитель с красной пометкой`,s:`${DR(d.dr).n} — ${DR(d.dr).note}`,go:`openDeal('${d.id}')`}));
 owing().filter(d=>daysBetween(clPayDay(d),TODAY)>0).forEach(d=>F.push({lv:'warn',t:`${CL(d.cl).n} не оплатил ${tg(d.c)}`,s:`${d.id} · просрочено ${daysBetween(clPayDay(d),TODAY)} дн.${d.paidD?' · водителю уже заплатили своими':''}`,go:`go('debts')`}));
 DEALS.filter(d=>d.st==='docs'&&!drvDocsOk(d)).forEach(d=>F.push({lv:'warn',t:`${d.id}: нет документов от перевозчика`,s:`${DR(d.dr).n} · не хватает: ${DOCN.filter((x,i)=>i>2&&!d.docs[i]).join(', ')}`,go:`openDeal('${d.id}')`}));
 return F}

SC.money=()=>{const H=held(),Fz=frozen(),O=owing();
 return `<div class="hd"><div><h2>Мои и не мои деньги</h2><p>На счёте лежит одна сумма, а ваших в ней — меньшая часть. Система раскладывает каждый тенге: деньги водителей по оплаченным рейсам, комиссия в работе, НДС, фонды и только потом — ваше свободное.</p></div></div>
 <div class="g2">
  <div class="pan"><h3>На счетах · ${tg(BANK.open)}</h3>${BANK.acc.map(a=>`<div class="kv"><span>${a[0]}</span><b class="mono">${fmt(a[1])}</b></div>`).join('')}
   <div class="wf">
    <div><span>Деньги водителей · клиент оплатил, водителю ещё нет</span><b class="neg">− ${fmt(heldDrv())}</b></div>
    <div><span>Комиссия по этим рейсам · разложится в фонды при закрытии</span><b class="neg">− ${fmt(heldCom())}</b></div>
    <div><span>НДС к уплате</span><b class="neg">− ${fmt(FUNDS.vat)}</b></div>
    <div><span>Фонд сотрудников · зарплаты 07 и 10 октября</span><b class="neg">− ${fmt(FUNDS.staff)}</b></div>
    <div><span>Фонд налогов</span><b class="neg">− ${fmt(FUNDS.tax)}</b></div>
    <div><span>Фонд обязательных · аренда, оклады, кредит</span><b class="neg">− ${fmt(FUNDS.fix)}</b></div>
    <div class="tot"><span>Ваше свободно</span><b>${fmt(freeMine())}</b></div>
   </div></div>
  <div class="pan"><h3>Как это выглядело раньше</h3><p class="mini" style="font-size:12.4px;line-height:1.7">Пришло 8 000 000 ₸ за пять машин из Москвы. На счёте стало много, а ваших в этих деньгах — 400 000 ₸ комиссии, и из неё ещё половина — сотрудникам. Остальные 7 600 000 ₸ — водителям, но платить им через 5–10 дней, после выгрузки и документов. За эти дни деньги «растворяются»: аванс, солярка, зарплата — а потом не хватает водителю.</p>
   <div class="ex"><div><small>Пришло</small><b>8 000 000</b></div><div><small>Водителям</small><b>7 600 000</b></div><div><small>Ваша комиссия</small><b>400 000</b></div><div><small>Вам после сотрудников и фондов</small><b class="g">${fmt(Math.round(400000/1.12*RULES[3].p/100))}</b></div></div>
   ${said('«Я понимаю же, что там с пяти миллионов мой заработок — только максимум пятьсот тысяч» · «Деньги на счету лежат, и я их считаю как будто это мои».')}</div>
 </div>
 <div class="pan"><h3>Деньги водителей на счёте · ${tg(heldDrv())}</h3><div class="tw"><table class="t"><thead><tr><th>Рейс</th><th>Клиент</th><th>Оплатил</th><th>Лежит</th><th>Статус</th><th>Почему ещё не оплатили водителю</th><th class="r">Водителю</th></tr></thead><tbody>
 ${H.map(d=>`<tr class="clk" onclick="openDeal('${d.id}')"><td><b>${d.id}</b><div class="sub">${route(d)}</div></td><td>${esc(CL(d.cl).n)}</td><td class="mono">${dd(d.paidC)}</td><td><span class="tag ${daysBetween(d.paidC,TODAY)>7?'w':''}">${daysBetween(d.paidC,TODAY)} дн.</span></td><td>${stg(d.st)}</td><td class="mini">${d.st==='pay'?'документы на месте — можно платить сегодня':d.st==='docs'?(drvDocsOk(d)?'ждёт бухгалтера':'нет документов от водителя'):d.st==='unl'?'на выгрузке, документов ещё нет':'машина ещё в пути, выгрузка '+dd(d.unl)}</td><td class="r mono">${fmt(d.d)}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2">
  <div class="pan"><h3>Заплатили водителям своими · ${tg(Fz.reduce((a,d)=>a+d.d,0)+OTHERDEBT.drv)}</h3><p class="mini">Клиент ещё не оплатил, водителю уже отдали — это ваши оборотные, «замороженные» в чужих рейсах.</p>${Fz.map(d=>`<div class="kv clk" onclick="openDeal('${d.id}')"><span>${d.id} · ${esc(CL(d.cl).n)} ${fl(CL(d.cl).f)}</span><b class="mono">${fmt(d.d)}</b></div>`).join('')}<div class="kv"><span>ещё ${OTHERDEBT.n} клиентов, мелкие рейсы</span><b class="mono">${fmt(OTHERDEBT.drv)}</b></div></div>
  <div class="pan"><h3>Ещё не пришло вашей прибыли · ${tg(waitMine())}</h3><p class="mini">Ваша доля из комиссии по рейсам, за которые клиент ещё не заплатил.</p>${O.map(d=>`<div class="kv clk" onclick="openDeal('${d.id}')"><span>${d.id} · ${esc(CL(d.cl).n)}</span><b class="mono">${fmt(net(d)*RULES[3].p/100)}</b></div>`).join('')}<div class="kv"><span>ещё ${OTHERDEBT.n} клиентов</span><b class="mono">${fmt(OTHERDEBT.com*RULES[3].p/100)}</b></div></div>
 </div>
 ${said('«Мне нужно чётко понимать: мои деньги — не мои деньги».','Логисты и кураторы этого экрана не видят — только руководитель, бухгалтер видит календарь и долги.')}`};

SC.calendar=()=>{const P=projection();const first=new Date('2026-10-01T00:00:00Z').getUTCDay();const pad=(first+6)%7;const cells=[];for(let i=0;i<pad;i++)cells.push('<div class="cd emp"></div>');
 for(let i=1;i<=31;i++){const day='2026-10-'+String(i).padStart(2,'0');const p=P[day];const past=day<TODAY;const fx=p.E.filter(e=>e.k==='fix'||e.k==='paid');
  cells.push(`<div class="cd ph${phaseOf(i)} ${past?'past':''} ${day===TODAY?'now':''} ${!past&&p.bal<0?'bad':!past&&p.bal<2000000?'warn':''}" onclick="card('day','${day}')"><div class="ch"><b>${i}</b><small>${dayOf(day)}</small></div>${p.inn?`<span class="in">+ ${mln(p.inn)}</span>`:''}${p.out?`<span class="out">− ${mln(p.out)}</span>`:''}${fx.slice(0,2).map(e=>`<em class="${e.bx?'bxr':''}">${esc(e.n.split(' · ')[0])}</em>`).join('')}${p.bal!==null?`<strong>${mln(p.bal)}</strong>`:''}</div>`)}
 const low=Object.entries(P).filter(([k,v])=>v.bal!==null).sort((a,b)=>a[1].bal-b[1].bal)[0];
 return `<div class="hd"><div><h2>Календарь платежей · октябрь</h2><p>Каждый день: сколько придёт от клиентов, сколько уйдёт водителям и по обязательным платежам, и сколько останется на счёте. Красный день — денег не хватит: видно заранее, а не в шесть вечера.</p></div><div class="btns"><button class="bt" onclick="card('fixnew')">+ Платёж</button><button class="bt p" onclick="go('funds')">Неделя и фонды →</button></div></div>
 <div class="phs">${PHASES.map(p=>`<div class="ph ph${p[0]}"><b>${p[1]}</b><span>${p[2]}</span></div>`).join('')}</div>
 <div class="calg"><div class="cw">пн</div><div class="cw">вт</div><div class="cw">ср</div><div class="cw">чт</div><div class="cw">пт</div><div class="cw">сб</div><div class="cw">вс</div>${cells.join('')}</div>
 <div class="g2">
  <div class="note" style="--tone:var(--bad)"><b>Самый узкий день — ${dd(low[0])}: ${mln(low[1].bal)}</b><p>К этому дню выплаты водителям по выгрузкам и зарплата логистов обгоняют поступления. Варианты: напомнить должникам заранее (кнопка в «Кто должен»), сдвинуть часть зарплаты, как вы делаете, на 9–12 число, или не брать в эти дни рейсы с оплатой водителю до оплаты клиента.</p></div>
  <div class="note" style="--tone:var(--ok)"><b>Битрикс в календаре — последний раз</b><p>10.10: 176 000 ₸ — тариф «Бизнес» и интегратор. После переезда этот платёж уходит из календаря: около 2,1 млн ₸ в год.</p></div>
 </div>
 ${said('«Мне нужен какой-то календарь платежей: сколько я счетов выставил, сколько нужно за сегодня оплату произвести» · «Прибыль идёт кусками, а выход денег — сразу в первых числах, в миллионах».')}`};
