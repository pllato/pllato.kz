
SC.funds=()=>{const ex=DL('R-1016');const C=com(ex),V=vat(ex),N=C-V;const sum=RULES.reduce((a,r)=>a+r.p,0);
 const week=[];for(let i=0;i<7;i++)week.push(addDays(TODAY,i));const P=projection();
 const wIn=week.reduce((a,d)=>a+P[d].inn,0),wDrv=week.reduce((a,d)=>a+P[d].E.filter(e=>e.k==='out').reduce((x,e)=>x+e.s,0),0);
 const wFix=week.flatMap(d=>P[d].E.filter(e=>e.k==='fix'));
 const byF=k=>wFix.filter(e=>e.f===k).reduce((a,e)=>a+e.s,0);
 const TR=[['Halyk · ФОТ','staff',byF('staff')],['Kaspi · обязательные','fix',byF('fix')],['Halyk · налоги','tax',byF('tax')]].filter(x=>x[2]);
 return `<div class="hd"><div><h2>Фонды и неделя</h2><p>Каждая закрытая перевозка сама раскладывает комиссию по фондам — по вашим процентам. Раз в неделю, в понедельник, — план: что придёт, что уйдёт и сколько куда перевести.</p></div></div>
 <div class="g2">
  <div class="pan"><h3>Правила · как делится комиссия</h3><p class="mini">Сначала НДС — он не ваш и не считается в прибыль. Остальное — по процентам. Меняете здесь — пересчитывается всё.</p>
   ${RULES.map(r=>`<div class="rule"><i style="background:${r.c}"></i><div><b>${r.n}</b><span>${r.hint}</span></div><input type="number" value="${r.p}" min="0" max="100" onchange="setRule('${r.k}',this.value)"><em>%</em></div>`).join('')}
   <div class="kv"><span>Сумма</span><b class="${sum===100?'pos':'neg'}">${sum} %${sum===100?'':' — должно быть 100'}</b></div></div>
  <div class="pan"><h3>Пример: ${ex.id} · ${route(ex)}</h3>
   <div class="wf">
    <div><span>Клиент заплатил</span><b class="mono">${fmt(ex.c)}</b></div>
    <div><span>Водителю</span><b class="neg">− ${fmt(ex.d)}</b></div>
    <div class="sep"><span>Комиссия</span><b>${fmt(C)}</b></div>
    <div><span>НДС 12 % — в фонд НДС</span><b class="neg">− ${fmt(V)}</b></div>
    ${RULES.map(r=>`<div><span><i class="dot" style="background:${r.c}"></i>${r.n} · ${r.p} %</span><b class="mono">${fmt(N*r.p/100)}</b></div>`).join('')}
   </div>
   <p class="mini">Как в вашей таблице, только откладывается сразу, в момент закрытия перевозки: «сделка закрылась полностью — откинул».</p></div>
 </div>
 <div class="fgrid">${[['vat','НДС к уплате','#a8534a'],['staff','Фонд сотрудников','#2a6fb0'],['tax','Фонд налогов','#c23b3b'],['fix','Фонд обязательных','#8a5cc2']].map(([k,n,c])=>{const need=FIXED.filter(f=>f.f===k&&!f.done&&f.d>=TODAY).reduce((a,f)=>a+f.s,0);return `<div class="fund" style="--fc:${c}"><small>${n}</small><b>${tg(FUNDS[k])}</b><span>${need?`до конца месяца платить ${tg(need)}`:'платежи — в следующем месяце'}</span><div class="bar"><i style="width:${need?Math.min(100,pct(FUNDS[k],need)):100}%;background:${c}"></i></div><em class="${need&&FUNDS[k]<need?'neg':'pos'}">${need?(FUNDS[k]>=need?'хватает':'не хватает '+tg(need-FUNDS[k])+' — наберётся с закрытий'):'—'}</em></div>`}).join('')}</div>
 <div class="pan"><h3>Неделя ${dd(week[0])} – ${dd(week[6])} · понедельник, план</h3>
  <div class="ex"><div><small>Придёт от клиентов</small><b class="g">+ ${fmt(wIn)}</b></div><div><small>Уйдёт водителям</small><b class="neg">− ${fmt(wDrv)}</b></div><div><small>Обязательные</small><b class="neg">− ${fmt(wFix.reduce((a,e)=>a+e.s,0))}</b></div><div><small>Остаток на ${dd(week[6])}</small><b>${fmt(P[week[6]].bal)}</b></div></div>
  <div class="chk" style="margin-top:12px">${TR.map((t,i)=>`<div class="ci"><span class="bx" onclick="this.classList.toggle('on');this.textContent=this.classList.contains('on')?'✓':''"></span><span class="nm">Перевести <b>${tg(t[2])}</b> на счёт «${t[0]}» — платежи недели</span><span class="who">до ${dd(week[i+1]||week[1])}</span></div>`).join('')}
   <div class="ci"><span class="bx" onclick="this.classList.toggle('on');this.textContent=this.classList.contains('on')?'✓':''"></span><span class="nm">Напомнить ${owing().length} должникам до среды — иначе ${dd(Object.entries(P).filter(([k,v])=>v.bal!==null).sort((a,b)=>a[1].bal-b[1].bal)[0][0])} будет узко</span><span class="who">куратор</span></div></div></div>
 ${said('«Фонды сделай: допустим, водителям деньги, мои деньги, на налог откидывай» · «Бухгалтер в моменте с моего счёта два миллиона семьсот тысяч снимает — в налоги, а я планировал».','Платон: это недельное финансовое планирование; формулы фондов сядем и пропишем с вами.')}`};
function setRule(k,v){const r=RULES.find(x=>x.k===k);r.p=Math.max(0,Math.min(100,+v||0));render();toast('Правило изменено: '+r.n+' — '+r.p+' %. Пересчитаны пример и «моё свободно».')}

SC.debts=()=>{const O=owing().sort((a,b)=>b.c-a.c);const tot=O.reduce((a,d)=>a+d.c,0)+OTHERDEBT.sum;const drv=O.reduce((a,d)=>a+d.d,0)+OTHERDEBT.drv;
 return `<div class="hd"><div><h2>Кто должен</h2><p>Клиенты, которые ещё не оплатили выгруженные рейсы. По каждому: сколько из долга — деньги водителей, сколько — ваша комиссия, сколько дней просрочки и кто из кураторов ведёт.</p></div><div class="btns"><button class="bt" onclick="act('remindall')">Напомнить всем просроченным</button></div></div>
 <div class="wid">
  <div><small>Должны клиентов</small><b class="r">${O.length+OTHERDEBT.n}</b><span>за выгруженные рейсы</span></div>
  <div><small>Сумма долга</small><b>${mln(tot)}</b><span>с НДС</span></div>
  <div><small>Из неё — водителям</small><b>${mln(drv)}</b><span>часть уже заплатили своими</span></div>
  <div><small>Ваша комиссия в долгах</small><b class="w">${mln(tot-drv)}</b><span>до фондов</span></div>
  <div><small>Просрочено</small><b class="r">${O.filter(d=>clPayDay(d)<TODAY).length+9}</b><span>больше срока по договору</span></div>
 </div>
 <div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Рейс</th><th>Выгрузка</th><th>Срок оплаты</th><th>Просрочка</th><th class="r">Долг</th><th class="r">Водителю</th><th>Водителю оплачено?</th><th>Куратор</th><th></th></tr></thead><tbody>
 ${O.map(d=>{const late=daysBetween(clPayDay(d),TODAY);return `<tr><td><b class="lk" onclick="card('cl','${d.cl}')">${esc(CL(d.cl).n)}</b> ${fl(CL(d.cl).f)}</td><td class="lk" onclick="openDeal('${d.id}')">${d.id}</td><td class="mono">${dd(d.unl)}</td><td class="mono">${dd(clPayDay(d))}</td><td>${late>0?`<span class="tag r">${late} дн.</span>`:'<span class="tag">в срок</span>'}</td><td class="r mono">${fmt(d.c)}</td><td class="r mono">${fmt(d.d)}</td><td>${d.paidD?'<span class="tag w">да — своими</span>':'<span class="tag">ещё нет</span>'}</td><td>${STAFF[CL(d.cl).cur]}</td><td><button class="bt sm" onclick="act('remind','${d.cl}')">Напомнить</button></td></tr>`}).join('')}
 <tr class="total"><td>ещё ${OTHERDEBT.n} клиентов</td><td colspan="4" class="mini">мелкие рейсы по Казахстану, от 60 000 до 480 000 ₸</td><td class="r mono">${fmt(OTHERDEBT.sum)}</td><td class="r mono">${fmt(OTHERDEBT.drv)}</td><td colspan="3"></td></tr></tbody></table></div>
 <div class="g2"><div class="note"><b>Акт сверки — одной кнопкой</b><p>Откройте клиента → «Акт сверки»: все рейсы, оплаты и долг за период. Куратор отправляет его клиенту, бухгалтеру ничего собирать не нужно.</p></div>
 <div class="note" style="--tone:var(--bad)"><b>ИП Сагындыков — красная пометка</b><p>«Неплатёжеспособен, только предоплата». Если логист создаст ему заявку без предоплаты — карточка подсветится, а вам придёт уведомление.</p></div></div>
 ${said('«Мне должны тридцать два клиента… одни пятьсот тысяч, из которых водителям четыреста оплатить; другие полтора миллиона, из которых миллион триста семьдесят — водителям».')}`};

SC.analytics=()=>{const mx=Math.max(...MONTHS.map(m=>m[2]));const last=MONTHS[MONTHS.length-1];
 const byCl={};DEALS.forEach(d=>{byCl[d.cl]=byCl[d.cl]||{n:0,c:0};byCl[d.cl].n++;byCl[d.cl].c+=com(d)});const topCl=Object.entries(byCl).sort((a,b)=>b[1].c-a[1].c).slice(0,7);const tc=topCl[0][1].c;
 const ex=DL('R-1004');const C=com(ex),V=vat(ex),N=C-V;
 return `<div class="hd"><div><h2>Аналитика</h2><p>Ваша таблица с дашбордом — внутри системы. Цифры собираются из перевозок сами: сколько заработали в моменте, по клиентам, по логистам, международные и внутренние, налоги, проценты, план.</p></div><div class="btns"><button class="bt" onclick="act('xls')">Выгрузить в Excel</button></div></div>
 <div class="wid">
  <div><small>Фур в сентябре</small><b>${last[1]}</b><span>≈ ${Math.round(last[1]/26)} в рабочий день</span></div>
  <div><small>Комиссия</small><b class="a">${mln(last[2])}</b><span>+${pct(last[2]-MONTHS[2][2],MONTHS[2][2])} % к августу</span></div>
  <div><small>Сотрудникам · 50 %</small><b>${mln(last[2]/1.12*.5)}</b><span>логисты, кураторы, лиды</span></div>
  <div><small>Средняя комиссия</small><b>${fmt(last[2]/last[1])}</b><span>₸ с машины</span></div>
  <div><small>План компании</small><b class="w">${pct(last[2],PLAN)} %</b><span>${mln(last[2])} из ${mln(PLAN)}</span></div>
 </div>
 <div class="g2">
  <div class="pan"><h3>Комиссия по месяцам</h3><div class="bars">${MONTHS.map(m=>`<div><b>${mln(m[2])}</b><i style="height:${Math.round(m[2]/mx*120)}px"></i><span>${m[0]}<br><small>${m[1]} фур</small></span></div>`).join('')}<div class="pl"><b>${mln(PLAN)}</b><i style="height:${Math.min(150,Math.round(PLAN/mx*120))}px"></i><span>План<br><small>нужно</small></span></div></div></div>
  <div class="pan"><h3>Международные и внутренние · сентябрь</h3>
   <div class="mix"><div style="flex:64"><b>64 фуры · 36 %</b><span>международные</span></div><div style="flex:115"><b>115 фур · 64 %</b><span>по Казахстану</span></div></div>
   <div class="mix c"><div style="flex:62"><b>5,6 млн · 62 %</b><span>комиссии</span></div><div style="flex:38"><b>3,4 млн · 38 %</b><span>комиссии</span></div></div>
   <p class="mini">Международная машина приносит в среднем 87 500 ₸, внутренняя — 29 600 ₸. Но и риск выше: простой, штраф — и вся комиссия съедается.</p></div>
 </div>
 <div class="g2">
  <div class="pan"><h3>Клиенты · комиссия</h3>${topCl.map(([k,v])=>`<div class="hb clk" onclick="card('cl','${k}')"><span>${esc(CL(k).n)} ${fl(CL(k).f)}</span><i style="width:${Math.round(v.c/tc*100)}%"></i><b class="mono">${fmt(v.c)}</b></div>`).join('')}</div>
  <div class="pan"><h3>Логисты · принесли компании</h3>${KPI.map(k=>`<div class="hb clk" onclick="go('kpi')"><span>${k.n} · ${k.tr} фур</span><i style="width:${Math.round(k.com/KPI[0].com*100)}%;background:${k.com<k.plan?'var(--bad)':'var(--brand)'}"></i><b class="mono">${fmt(k.com)}</b></div>`).join('')}</div>
 </div>
 <div class="pan"><h3>Строка сделки — как в вашей таблице · ${ex.id}</h3><div class="tw"><table class="t"><thead><tr><th class="r">Клиент</th><th class="r">Водитель</th><th class="r">Комиссия</th><th class="r">НДС</th><th class="r">Логист 30 %</th><th class="r">Куратор 12 %</th><th class="r">Лиды 8 %</th><th class="r">Налоги</th><th class="r">Обязат.</th><th class="r">Вам</th><th class="r">Маржа</th></tr></thead><tbody><tr>
  <td class="r mono">${fmt(ex.c)}</td><td class="r mono">${fmt(ex.d)}</td><td class="r mono">${fmt(C)}</td><td class="r mono">${fmt(V)}</td><td class="r mono">${fmt(N*.3)}</td><td class="r mono">${fmt(N*.12)}</td><td class="r mono">${fmt(N*.08)}</td><td class="r mono">${fmt(N*RULES[1].p/100)}</td><td class="r mono">${fmt(N*RULES[2].p/100)}</td><td class="r mono"><b>${fmt(N*RULES[3].p/100)}</b></td><td class="r mono">${(N*RULES[3].p/100/ex.c*100).toFixed(1).replace('.',',')} %</td></tr></tbody></table></div>
  <p class="mini">Формулы переносим из вашей таблицы один в один — ваш программист уже всё собрал; мы подключим её к перевозкам, чтобы ничего не вбивать дважды.</p></div>
 ${said('«У меня есть программист, который все мои мысли собрал в одну таблицу: сколько я зарабатываю, какой процент на какую компанию заходит, сколько налогов, сколько лидов отработано».')}`};

SC.kpi=()=>{const me=role==='Логист'?'DN':null;const K=me?KPI.filter(k=>k.k===me):KPI;
 return `<div class="hd"><div><h2>План и KPI логистов</h2><p>Логист видит не только свой заработок, но и сколько он принёс компании и сколько должен по плану. Зарплата — 30 % от чистой комиссии, гарантия 450 000 ₸; план — 2,1 млн ₸ комиссии в месяц на логиста.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Логист</th><th class="r">Фур</th><th class="r">Принёс комиссии</th><th class="r">План</th><th>Выполнение</th><th class="r">Заработал сам</th><th class="r">Компании осталось</th><th>Вывод</th></tr></thead><tbody>
 ${K.map(k=>{const p=pct(k.com,k.plan);return `<tr><td><b>${k.n}</b></td><td class="r mono">${k.tr}</td><td class="r mono">${fmt(k.com)}</td><td class="r mono">${fmt(k.plan)}</td><td style="min-width:150px"><div class="bar"><i style="width:${Math.min(100,p)}%;background:${p<60?'var(--bad)':p<100?'var(--warn)':'var(--ok)'}"></i></div><span class="mini">${p} %</span></td><td class="r mono">${fmt(k.pay)}</td><td class="r mono">${fmt(k.com/1.12-k.pay)}</td><td>${p>=100?'<span class="tag g">выше плана</span>':p>=80?'<span class="tag w">почти</span>':`<span class="tag r">гарантия больше, чем принёс</span>`}</td></tr>`}).join('')}</tbody></table></div>
 ${me?'':`<div class="g2"><div class="note" style="--tone:var(--bad)"><b>Мадина: 15 фур, 900 000 ₸ комиссии, заработала 450 000 ₸</b><p>Компании от неё — около 350 000 ₸ до налогов и аренды. По плану должна приносить минимум 2,1 млн. Видно с первого дня месяца, а не в конце.</p></div>
 <div class="note"><b>Октябрь · идёт</b><p>Данияр — 11 фур за 5 дней, Тимур — 8, Бекзат — 7, Мадина — 2. Строка обновляется с каждой закрытой перевозкой; логист видит свою.</p></div></div>`}
 ${said('«Многие сидят, им триста тысяч хватает… пятнадцать фур отгрузил и сидит. Занёс девятьсот тысяч, а минимум два сто должен» · «Разрабатываю KPI для логистов».')}`};
