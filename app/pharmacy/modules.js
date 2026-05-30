/* Pllato Pharmacy — модули: дашборд, каталог, склад, поставщики, моя смена */
(function(){
const U=window.PHU, M=window.M;
const {money,num,esc,fmtDate,fmtTime,daysLeft,todayISO}=U;
const S=()=>U.S();
const view=()=>{ const v=U.session().view; return v==='all'?null:v; };
const scopePharms=()=>{ const v=view(); return v?S().pharmacies.filter(p=>p.id===v):S().pharmacies; };

function agg(sales){ let rev=0,cost=0,ch=0,ret=0;
  sales.forEach(s=>{ rev+=s.total; cost+=s.cost; if(s.type==='return')ret++; else ch++; });
  return {rev,cost,margin:rev-cost,checks:ch,returns:ret}; }
function dayList(n){ const a=[]; for(let i=n-1;i>=0;i--){ a.push(new Date(Date.now()-i*864e5).toISOString().slice(0,10)); } return a; }
function revByDay(pharmId,days){ return days.map(d=>U.salesIn(pharmId,d,d).reduce((s,x)=>s+Math.max(0,x.total),0)); }

/* ================= DASHBOARD ================= */
M.dashboard=function(host,top){
  const v=view(), t=todayISO();
  U.topbar(top, v?U.pharm(v).name:'Дашборд сети', 'Сегодня · '+new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long'}));
  const today=agg(U.salesIn(v,t,t));
  const expToday=scopePharms().reduce((s,p)=>s+U.EXP[p.id],0);
  const profit=today.margin-expToday;
  // прошлая неделя (тот же набор дней -7)
  const wk=dayList(7), pwk=dayList(14).slice(0,7);
  const curW=agg(U.salesIn(v,wk[0],wk[6])).rev, prevW=agg(U.salesIn(v,pwk[0],pwk[6])).rev;
  const dW=prevW?Math.round((curW-prevW)/prevW*100):0;

  let html=`<div class="grid g4">
    <div class="kpi dark"><div class="kpi-label">Выручка сегодня</div><div class="kpi-val">${money(today.rev)}</div><div class="kpi-sub">${today.checks} чеков · ср. чек ${money(today.checks?today.rev/today.checks:0)}</div></div>
    <div class="kpi"><div class="kpi-label">Маржа сегодня</div><div class="kpi-val">${money(today.margin)}</div><div class="kpi-sub">${today.rev?Math.round(today.margin/today.rev*100):0}% от выручки</div></div>
    <div class="kpi"><div class="kpi-label">Прибыль сегодня</div><div class="kpi-val">${money(profit)}</div><div class="kpi-sub">после расходов ~${money(expToday)}/день</div></div>
    <div class="kpi"><div class="kpi-label">Выручка за неделю</div><div class="kpi-val">${money(curW)}</div><div class="kpi-sub"><span class="delta ${dW>=0?'up':'down'}">${dW>=0?'▲':'▼'} ${Math.abs(dW)}%</span> к прошлой</div></div>
  </div>`;

  // карточки по аптекам (только в режиме «вся сеть»)
  if(!v){
    const days=dayList(7);
    html+=`<div class="card-h" style="margin:24px 0 0"><h3>Аптеки сегодня</h3><span class="sub">выручка · маржа · прибыль</span></div>
    <div class="grid g3" style="margin-top:12px">`+S().pharmacies.map(p=>{
      const a=agg(U.salesIn(p.id,t,t)), pr=a.margin-U.EXP[p.id];
      const rb=revByDay(p.id,days), mx=Math.max(...rb,1);
      return `<div class="card"><div class="flex between"><b>${esc(p.name)}</b><span class="pill ${pr>=0?'':'red'}">${pr>=0?'+':''}${money(pr)}</span></div>
        <div class="dim" style="margin:2px 0 12px">${esc(p.addr)}</div>
        <div class="flex between" style="font-size:13px"><span class="muted">Выручка</span><b>${money(a.rev)}</b></div>
        <div class="flex between" style="font-size:13px;margin:4px 0"><span class="muted">Маржа</span><b>${money(a.margin)} · ${a.rev?Math.round(a.margin/a.rev*100):0}%</b></div>
        <div class="flex between" style="font-size:13px"><span class="muted">Чеков</span><b>${a.checks}</b></div>
        <div class="spark" style="margin-top:12px">${rb.map((x,i)=>`<i class="${i===6?'hl':''}" style="height:${Math.max(6,x/mx*100)}%" title="${fmtDate(days[i])}: ${money(x)}"></i>`).join('')}</div>
        <div class="dim" style="text-align:right;margin-top:4px">7 дней</div></div>`;
    }).join('')+`</div>`;
  }

  // топ-категории по марже + аномалии + лента
  const per=U.salesIn(v,dayList(14)[0],t);
  const byCat={}; per.forEach(s=>s.lines.forEach(l=>{ const c=(U.prod(l.pid).cat)||'Прочее'; byCat[c]=(byCat[c]||0)+l.qty*(l.price-l.buy)*(s.type==='return'?-1:1); }));
  const cats=Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,5); const cmax=cats.length?cats[0][1]:1;
  const feed=[...per].reverse().slice(0,8);
  // аномалии
  const anomalies=[];
  S().pharmacies.forEach(p=>{ if(v&&p.id!==v)return; const a=agg(U.salesIn(p.id,dayList(14)[0],t));
    const rr=a.checks?Math.round(a.returns/(a.checks+a.returns)*100):0; if(rr>=3) anomalies.push(`Аптека «${esc(p.name).replace(/Аптека\s*№?\d+\s*«?/,'').replace('»','')}»: возвраты ${rr}% — выше нормы`); });
  const deadCount=deadStockList(v).length;
  if(deadCount) anomalies.push(`${deadCount} позиций без продаж 14 дней — мёртвый сток (см. Аналитику)`);
  const expSoon=expiringList(v).length; if(expSoon) anomalies.push(`${expSoon} партий истекают в течение 30 дней`);

  html+=`<div class="grid g2" style="margin-top:24px">
    <div class="card"><div class="card-h"><h3>Топ-5 категорий по марже</h3><span class="sub">за 14 дней</span></div>
      ${cats.map(c=>`<div style="margin-bottom:11px"><div class="flex between" style="font-size:13.5px"><span>${esc(c[0])}</span><b>${money(c[1])}</b></div><div class="bar" style="margin-top:5px"><i style="width:${Math.max(4,c[1]/cmax*100)}%"></i></div></div>`).join('')}
    </div>
    <div class="card"><div class="card-h"><h3>Что требует внимания</h3></div>
      ${anomalies.length?anomalies.map(a=>`<div class="alert-box amber"><span class="ic">⚠</span><span>${a}</span></div>`).join(''):'<div class="empty"><div class="ic">✓</div>Аномалий не обнаружено</div>'}
    </div></div>`;

  html+=`<div class="card pad0" style="margin-top:24px"><div class="card-h" style="padding:16px 18px 0"><h3>Последние чеки</h3><span class="sub">обновляется в реальном времени</span><span class="right pill"><span class="live-dot"></span> live</span></div>
    <table class="tbl"><thead><tr><th>Время</th><th>Чек</th><th>Аптека</th><th>Фармацевт</th><th>Оплата</th><th class="t-right">Сумма</th></tr></thead><tbody>
    ${feed.map(s=>`<tr><td class="mono">${fmtTime(s.ts)}</td><td>${s.id}</td><td>${esc(U.pharm(s.pharmacyId).name)}</td><td>${esc(U.user(s.userId).name)}</td><td>${s.pay==='cash'?'Наличные':s.pay==='card'?'Карта':'Безнал'}</td><td class="t-right ${s.type==='return'?'':'mono'}" style="font-weight:600${s.type==='return'?';color:var(--red)':''}">${s.type==='return'?'возврат ':''}${money(s.total)}</td></tr>`).join('')}
    </tbody></table></div>`;
  host.innerHTML=html;
};

function deadStockList(v){ const t=todayISO(),from=dayList(14)[0]; const sold={};
  U.salesIn(v,from,t).forEach(s=>s.lines.forEach(l=>sold[l.pid]=(sold[l.pid]||0)+l.qty));
  return S().products.filter(p=>{ const has=scopePharms().some(ph=>U.stockAt(ph.id,p.id).qty>0); return has&&!sold[p.id]; }); }
function expiringList(v){ const out=[]; S().products.forEach(p=>scopePharms().forEach(ph=>{ const st=U.stockAt(ph.id,p.id); const dl=daysLeft(st.expiry); if(st.qty>0&&dl<=30) out.push({p,ph,st,dl}); })); return out; }
U.deadStockList=deadStockList; U.expiringList=expiringList; U.agg=agg; U.dayList=dayList; U.revByDay=revByDay;

/* ================= CATALOG ================= */
let catFilter={q:'',cat:'all',group:false};
M.catalog=function(host,top){
  const canEdit=U.session().role!=='pharm';
  U.topbar(top,'Каталог товаров',`${S().products.length} позиций · единая база на 3 аптеки`,
    canEdit?`<button class="btn primary" data-act="prod-new">+ Добавить товар</button>`:'');
  const cats=['all',...S().cats];
  let list=S().products.slice();
  if(catFilter.q){ const q=catFilter.q.toLowerCase(); list=list.filter(p=>p.name.toLowerCase().includes(q)||p.inn.toLowerCase().includes(q)||p.barcode.includes(q)); }
  if(catFilter.cat!=='all') list=list.filter(p=>p.cat===catFilter.cat);

  let body;
  if(catFilter.group){
    const groups={}; list.forEach(p=>{ (groups[p.inn]=groups[p.inn]||[]).push(p); });
    body=Object.entries(groups).sort((a,b)=>b[1].length-a[1].length).map(([inn,ps])=>{
      const minP=Math.min(...ps.map(p=>p.sale));
      return `<div class="card" style="margin-bottom:12px"><div class="flex between"><div><b>${esc(inn)}</b> <span class="pill gray">${ps.length} ${ps.length>4?'брендов':'бренда'}</span></div><span class="dim">дешевле всего: ${money(minP)}</span></div>
        <table class="tbl" style="margin-top:8px"><tbody>
        ${ps.sort((a,b)=>a.sale-b.sale).map(p=>`<tr class="row-click" data-act="prod-open" data-id="${p.id}"><td style="width:36%">${esc(p.name)} ${p.rx?'<span class="pill rx">Rx</span>':''}</td><td>${esc(p.manuf)}, ${esc(p.country)}</td><td>${esc(p.dose)} · ${esc(p.pack)}</td><td class="t-right">закуп ${num(p.buy)}</td><td class="t-right" style="font-weight:600">${money(p.sale)}</td><td class="t-right"><span class="pill ${p.margin>=45?'':'amber'}">${p.margin}%</span></td></tr>`).join('')}
        </tbody></table></div>`;
    }).join('');
    body=`<div class="dim" style="margin-bottom:12px">Сгруппировано по МНН — наглядно видно аналоги и какой производитель сейчас выгоднее.</div>`+body;
  } else {
    body=`<div class="card pad0"><table class="tbl"><thead><tr><th>Наименование</th><th>МНН</th><th>Производитель</th><th>Форма</th><th class="t-right">Закуп</th><th class="t-right">Продажа</th><th class="t-right">Маржа</th><th class="t-right">Остаток сети</th></tr></thead><tbody>
      ${list.map(p=>{ const tot=S().pharmacies.reduce((s,ph)=>s+U.stockAt(ph.id,p.id).qty,0);
      return `<tr class="row-click" data-act="prod-open" data-id="${p.id}"><td><b>${esc(p.name)}</b> ${p.rx?'<span class="pill rx">Rx</span>':''}</td><td>${esc(p.inn)}</td><td>${esc(p.manuf)}<br><span class="dim">${esc(p.country)}</span></td><td>${esc(p.form)}, ${esc(p.dose)}</td><td class="t-right mono">${num(p.buy)}</td><td class="t-right mono" style="font-weight:600">${num(p.sale)}</td><td class="t-right"><span class="pill ${p.margin>=45?'':'amber'}">${p.margin}%</span></td><td class="t-right mono ${tot<=8?'stock-low':''}">${tot} шт</td></tr>`;}).join('')}
    </tbody></table></div>`;
  }
  host.innerHTML=`<div class="toolbar">
    <div class="search"><span class="muted">⌕</span><input id="catq" placeholder="Поиск по названию, МНН, штрихкоду…" value="${esc(catFilter.q)}"></div>
    <select class="btn" id="catc" style="font-weight:500">${cats.map(c=>`<option value="${c}" ${catFilter.cat===c?'selected':''}>${c==='all'?'Все категории':c}</option>`).join('')}</select>
    <div class="seg"><button class="${catFilter.group?'':'on'}" data-act="cat-flat">Список</button><button class="${catFilter.group?'on':''}" data-act="cat-group">По МНН (аналоги)</button></div>
  </div>${body}`;
  const q=document.getElementById('catq'); if(q){ q.addEventListener('input',e=>{catFilter.q=e.target.value; M.catalog(host,top); q2(); }); }
  function q2(){ const el=document.getElementById('catq'); if(el){el.focus(); el.setSelectionRange(el.value.length,el.value.length);} }
  const cc=document.getElementById('catc'); if(cc) cc.addEventListener('change',e=>{catFilter.cat=e.target.value; M.catalog(host,top);});
};
U.catFilter=catFilter;

/* ================= WAREHOUSE ================= */
U.wh=U.wh||{tab:'stock'};
M.warehouse=function(host,top){
  const whTab=U.wh.tab;
  const canEdit=U.session().role!=='pharm', v=view();
  U.topbar(top,'Склад',`Остатки по ${v?'аптеке':'каждой точке'} · приход → расход → остатки`,
    canEdit?`<button class="btn primary" data-act="wh-receive">+ Новая поставка</button> <button class="btn" data-act="wh-transfer">⇄ Перемещение</button>`:'');
  const tabs=[['stock','Остатки'],['alerts','Алерты'],['inventory','Инвентаризация']];
  let html=`<div class="seg" style="margin-bottom:16px">${tabs.map(t=>`<button class="${whTab===t[0]?'on':''}" data-act="wh-tab" data-t="${t[0]}">${t[1]}${t[0]==='alerts'?` · ${U.countAlerts()}`:''}</button>`).join('')}</div>`;
  const phs=scopePharms();

  if(whTab==='stock'){
    html+=`<div class="card pad0"><table class="tbl"><thead><tr><th>Товар</th>${phs.map(p=>`<th class="t-right">${esc(p.name.replace(/Аптека\s*№?\d+\s*/,'№'+p.id.slice(1)+' '))}</th>`).join('')}<th class="t-right">Σ сеть</th><th class="t-right">Срок</th></tr></thead><tbody>`;
    html+=S().products.map(p=>{ let tot=0; let minExp=9999;
      const cells=phs.map(ph=>{ const st=U.stockAt(ph.id,p.id); tot+=st.qty; const dl=daysLeft(st.expiry); if(st.qty>0)minExp=Math.min(minExp,dl);
        const cl=st.qty<=0?'stock-no':st.qty<=st.min?'stock-low':''; return `<td class="t-right mono ${cl}">${st.qty}</td>`; }).join('');
      const expCl=minExp<=0?'pill red':minExp<=30?'pill amber':'';
      const expTxt=minExp===9999?'—':minExp<=0?'просрочен':minExp+' дн';
      return `<tr class="row-click" data-act="prod-open" data-id="${p.id}"><td><b>${esc(p.name)}</b><br><span class="dim">${esc(p.dose)} · ${esc(p.pack)}</span></td>${cells}<td class="t-right mono" style="font-weight:600">${tot}</td><td class="t-right">${expCl?`<span class="${expCl}">${expTxt}</span>`:`<span class="dim">${expTxt}</span>`}</td></tr>`;
    }).join('')+`</tbody></table></div>`;
  }
  else if(whTab==='alerts'){
    const low=[]; S().products.forEach(p=>phs.forEach(ph=>{ const st=U.stockAt(ph.id,p.id); if(st.qty<=st.min) low.push({p,ph,st}); }));
    const exp=U.expiringList(v);
    html+=`<div class="card"><div class="card-h"><h3>Заканчивается · ниже минимума</h3><span class="right pill ${low.length?'red':''}">${low.length}</span></div>
      ${low.length?`<table class="tbl"><tbody>${low.slice(0,30).map(x=>`<tr><td>${esc(x.p.name)}</td><td class="dim">${esc(x.ph.name)}</td><td class="t-right ${x.st.qty<=0?'stock-no':'stock-low'}">${x.st.qty} шт (мин. ${x.st.min})</td><td class="t-right">${canEdit?`<button class="btn sm" data-act="wh-order" data-id="${x.p.id}">Заказать</button>`:''}</td></tr>`).join('')}</tbody></table>`:'<div class="empty"><div class="ic">✓</div>Всё в норме</div>'}</div>
    <div class="card" style="margin-top:16px"><div class="card-h"><h3>Истекает срок годности · ≤ 30 дней</h3><span class="right pill ${exp.length?'amber':''}">${exp.length}</span></div>
      ${exp.length?`<table class="tbl"><tbody>${exp.sort((a,b)=>a.dl-b.dl).map(x=>`<tr><td>${esc(x.p.name)}</td><td class="dim">${esc(x.ph.name)}</td><td>${x.st.qty} шт</td><td class="t-right"><span class="pill ${x.dl<=0?'red':'amber'}">${x.dl<=0?'просрочен':'через '+x.dl+' дн'}</span></td><td class="t-right">${canEdit?`<button class="btn sm danger" data-act="wh-writeoff" data-pid="${x.p.id}" data-ph="${x.ph.id}">Списать</button>`:''}</td></tr>`).join('')}</tbody></table>`:'<div class="empty"><div class="ic">✓</div>Нет истекающих партий</div>'}</div>`;
  }
  else {
    html+=`<div class="card"><div class="card-h"><h3>Инвентаризация</h3><span class="sub">пересчёт реальных остатков · сравнение с системой</span></div>
      <p class="dim">Запустите пересчёт по аптеке — система покажет расхождения между фактом и учётом, и в каком чеке/у кого недостача.</p>
      <div class="flex gap6" style="margin-top:10px">${phs.map(p=>`<button class="btn" data-act="wh-invent" data-id="${p.id}">Пересчитать · ${esc(p.name)}</button>`).join('')}</div>
      <div class="alert-box amber mt16"><span class="ic">ℹ</span><span>В демо расхождения генерируются для примера. В бою — вводите фактический остаток, система сама посчитает недостачу и сумму убытка.</span></div></div>`;
  }
  host.innerHTML=html;
};

/* ================= SUPPLIERS ================= */
M.suppliers=function(host,top){
  const canEdit=U.session().role!=='pharm';
  U.topbar(top,'Поставщики',`${S().suppliers.length} поставщиков · долги, условия, маржа`,
    canEdit?`<button class="btn primary" data-act="sup-new">+ Поставщик</button>`:'');
  const totalDebt=S().suppliers.reduce((s,x)=>s+x.debt,0);
  host.innerHTML=`<div class="grid g3" style="margin-bottom:18px">
    <div class="kpi"><div class="kpi-label">Всего поставщиков</div><div class="kpi-val">${S().suppliers.length}</div></div>
    <div class="kpi"><div class="kpi-label">Задолженность</div><div class="kpi-val">${money(totalDebt)}</div><div class="kpi-sub">по отсрочкам платежа</div></div>
    <div class="kpi"><div class="kpi-label">Лучшая маржа</div><div class="kpi-val">${Math.max(...S().suppliers.map(s=>s.marginAfter))}%</div><div class="kpi-sub">после всех бонусов и скидок</div></div>
  </div>
  <div class="card pad0"><table class="tbl"><thead><tr><th>Поставщик</th><th>ИНН</th><th>Условия</th><th class="t-right">Маржа после скидок</th><th class="t-right">Задолженность</th></tr></thead><tbody>
  ${S().suppliers.map(s=>`<tr><td><b>${esc(s.name)}</b></td><td class="mono">${esc(s.inn)}</td><td>${esc(s.terms)}</td><td class="t-right"><span class="pill ${s.marginAfter>=50?'':'amber'}">${s.marginAfter}%</span></td><td class="t-right mono" style="font-weight:600${s.debt?';color:var(--red)':''}">${s.debt?money(s.debt):'—'}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="alert-box amber mt16"><span class="ic">ℹ</span><span>Аналитика по поставщику: «${esc(S().suppliers[3].name)}» даёт лучшую маржу (${S().suppliers[3].marginAfter}%), но только по предоплате. По «${esc(S().suppliers[0].name)}» висит долг ${money(S().suppliers[0].debt)} — срок оплаты подходит.</span></div>`;
};

/* ================= MY SHIFT (личный кабинет фармацевта) ================= */
M.myshift=function(host,top){
  const sess=U.session(), uid=sess.userId, phId=sess.pharmacyId, t=todayISO();
  U.topbar(top,'Моя смена',esc(U.user(uid).name)+' · '+esc(U.pharm(phId).name));
  const mine=U.salesIn(phId,t,t).filter(s=>s.userId===uid);
  const a=U.agg(mine);
  const wk=U.salesIn(phId,U.dayList(7)[0],t).filter(s=>s.userId===uid);
  host.innerHTML=`<div class="grid g4">
    <div class="kpi dark"><div class="kpi-label">Моя выручка сегодня</div><div class="kpi-val">${money(a.rev)}</div></div>
    <div class="kpi"><div class="kpi-label">Чеков</div><div class="kpi-val">${a.checks}</div></div>
    <div class="kpi"><div class="kpi-label">Средний чек</div><div class="kpi-val">${money(a.checks?a.rev/a.checks:0)}</div></div>
    <div class="kpi"><div class="kpi-label">Моя маржа</div><div class="kpi-val">${money(a.margin)}</div><div class="kpi-sub">${a.rev?Math.round(a.margin/a.rev*100):0}%</div></div>
  </div>
  <div class="card pad0" style="margin-top:20px"><div class="card-h" style="padding:16px 18px 0"><h3>Мои чеки сегодня</h3></div>
  ${mine.length?`<table class="tbl"><thead><tr><th>Время</th><th>Чек</th><th>Позиций</th><th>Оплата</th><th class="t-right">Сумма</th></tr></thead><tbody>
    ${[...mine].reverse().map(s=>`<tr><td class="mono">${fmtTime(s.ts)}</td><td>${s.id}</td><td>${s.lines.reduce((x,l)=>x+l.qty,0)}</td><td>${s.pay==='cash'?'Наличные':s.pay==='card'?'Карта':'Безнал'}</td><td class="t-right mono">${money(s.total)}</td></tr>`).join('')}
  </tbody></table>`:'<div class="empty"><div class="ic">▱</div>Сегодня ещё не было продаж — откройте Кассу</div>'}</div>
  <div class="flex" style="margin-top:18px"><button class="btn primary" data-route="pos">Открыть кассу →</button></div>`;
};

})();
