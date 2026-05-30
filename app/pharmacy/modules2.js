/* Pllato Pharmacy — модули: финансы, аналитика, журнал + обработчик действий */
(function(){
const U=window.PHU, M=window.M;
const {money,num,esc,fmtDate,fmtTime,daysLeft,todayISO}=U;
const S=()=>U.S();
const view=()=>{ const v=U.session().view; return v==='all'?null:v; };
const scopePharms=()=>{ const v=view(); return v?S().pharmacies.filter(p=>p.id===v):S().pharmacies; };

/* ================= FINANCE ================= */
let finPeriod='month';
M.finance=function(host,top){
  const v=view(), t=todayISO();
  U.topbar(top,'Финансы', v?U.pharm(v).name:'Сводно по сети');
  // Z-отчёт (сегодня)
  const tod=U.salesIn(v,t,t);
  const cash=tod.filter(s=>s.pay==='cash').reduce((s,x)=>s+x.total,0);
  const card=tod.filter(s=>s.pay==='card').reduce((s,x)=>s+x.total,0);
  const tr=tod.filter(s=>s.pay==='transfer').reduce((s,x)=>s+x.total,0);
  const a=U.agg(tod), exp=scopePharms().reduce((s,p)=>s+U.EXP[p.id],0);
  // топ-10 проданных за сегодня
  const top10={}; tod.forEach(s=>s.lines.forEach(l=>top10[l.pid]=(top10[l.pid]||0)+l.qty));
  const top10arr=Object.entries(top10).sort((a,b)=>b[1]-a[1]).slice(0,10);

  let html=`<div class="card-h"><h3>Z-отчёт за сегодня</h3><span class="sub">${new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})}</span><span class="right"><button class="btn sm" onclick="window.print()">⎙ Печать</button></span></div>
  <div class="grid g4" style="margin-bottom:8px">
    <div class="kpi"><div class="kpi-label">Выручка</div><div class="kpi-val">${money(a.rev)}</div><div class="kpi-sub">${a.checks} чеков · ср. ${money(a.checks?a.rev/a.checks:0)}</div></div>
    <div class="kpi"><div class="kpi-label">Маржа</div><div class="kpi-val">${money(a.margin)}</div><div class="kpi-sub">${a.rev?Math.round(a.margin/a.rev*100):0}%</div></div>
    <div class="kpi"><div class="kpi-label">Расходы (день)</div><div class="kpi-val">${money(exp)}</div><div class="kpi-sub">аренда+зп+коммуналка</div></div>
    <div class="kpi dark"><div class="kpi-label">Чистая прибыль</div><div class="kpi-val">${money(a.margin-exp)}</div></div>
  </div>
  <div class="grid g2" style="margin-top:16px">
    <div class="card"><div class="card-h"><h3>Касса на конец смены</h3><span class="sub">для сверки</span></div>
      <table class="tbl"><tbody>
        <tr><td>Наличные</td><td class="t-right mono" style="font-weight:600">${money(cash)}</td></tr>
        <tr><td>Карта</td><td class="t-right mono">${money(card)}</td></tr>
        <tr><td>Безнал / перевод</td><td class="t-right mono">${money(tr)}</td></tr>
        <tr><td><b>Должно быть в кассе (наличные)</b></td><td class="t-right mono" style="font-weight:700">${money(cash)}</td></tr>
      </tbody></table>
      <div class="alert-box amber mt8" style="margin-top:12px"><span class="ic">ℹ</span><span>Столько наличных фармацевт обязан сдать. Расхождение = недостача.</span></div>
    </div>
    <div class="card"><div class="card-h"><h3>Топ-10 проданных сегодня</h3></div>
      ${top10arr.length?`<table class="tbl"><tbody>${top10arr.map(([pid,q],i)=>`<tr><td style="width:24px" class="dim">${i+1}</td><td>${esc(U.prod(pid).name)}</td><td class="t-right mono">${q} шт</td></tr>`).join('')}</tbody></table>`:'<div class="empty"><div class="ic">▱</div>Сегодня продаж пока нет</div>'}
    </div>
  </div>`;

  // P&L за период
  const days=finPeriod==='month'?30:finPeriod==='quarter'?90:7;
  const from=U.dayList(days)[0];
  html+=`<div class="card-h" style="margin-top:26px"><h3>Отчёт о прибылях и убытках</h3>
    <span class="right seg">${[['week','Неделя'],['month','Месяц'],['quarter','Квартал']].map(p=>`<button class="${finPeriod===p[0]?'on':''}" data-act="fin-period" data-p="${p[0]}">${p[1]}</button>`).join('')}</span></div>
  <div class="card pad0" style="margin-top:12px"><table class="tbl"><thead><tr><th>Показатель</th>${scopePharms().map(p=>`<th class="t-right">${esc(p.name.replace(/Аптека\s*№?\d+\s*«?/,'№'+p.id.slice(1)+' ').replace('»',''))}</th>`).join('')}<th class="t-right">Σ Сеть</th></tr></thead><tbody>`;
  const rows=[
    ['Выручка', ph=>U.agg(U.salesIn(ph,from,t)).rev, false],
    ['Себестоимость проданного', ph=>U.agg(U.salesIn(ph,from,t)).cost, false],
    ['Валовая маржа', ph=>U.agg(U.salesIn(ph,from,t)).margin, true],
    ['Расходы (аренда, зп, прочее)', ph=>U.EXP[ph]*days, false],
    ['Чистая прибыль', ph=>U.agg(U.salesIn(ph,from,t)).margin-U.EXP[ph]*days, true],
  ];
  const phs=scopePharms();
  rows.forEach(r=>{ const vals=phs.map(p=>r[1](p.id)); const sum=vals.reduce((s,x)=>s+x,0);
    html+=`<tr${r[2]?' style="font-weight:700;background:#fff8"':''}><td>${r[0]}</td>${vals.map(x=>`<td class="t-right mono">${money(x)}</td>`).join('')}<td class="t-right mono">${money(sum)}</td></tr>`; });
  html+=`</tbody></table></div>
  <div class="alert-box amber mt16"><span class="ic">ℹ</span><span>Себестоимость считается автоматически из закупочных цен. Расходы (${money(0).replace('0 ','')}аренда, зарплаты, коммуналка) собственник вносит вручную — в демо заданы примерные.</span></div>`;
  host.innerHTML=html;
};

/* ================= ANALYTICS ================= */
let anTab='abc';
M.analytics=function(host,top){
  const v=view(), t=todayISO(), from=U.dayList(14)[0];
  U.topbar(top,'Аналитика и контроль','за 14 дней · '+(v?U.pharm(v).name:'вся сеть'));
  const tabs=[['abc','ABC / XYZ'],['dead','Мёртвый сток'],['staff','Фармацевты'],['compare','Сравнение аптек'],['comp','Конкуренты']];
  let html=`<div class="seg" style="margin-bottom:18px">${tabs.map(x=>`<button class="${anTab===x[0]?'on':''}" data-act="an-tab" data-t="${x[0]}">${x[1]}</button>`).join('')}</div>`;
  const sales=U.salesIn(v,from,t);

  if(anTab==='abc'){
    // ABC по выручке + XYZ по стабильности
    const rev={},days={}; const win=U.dayList(14); const N=win.length;
    sales.forEach(s=>s.lines.forEach(l=>{ rev[l.pid]=(rev[l.pid]||0)+l.qty*l.price; const d=s.ts.slice(0,10); (days[l.pid]=days[l.pid]||{})[d]=(days[l.pid][d]||0)+l.qty; }));
    const arr=Object.entries(rev).sort((a,b)=>b[1]-a[1]); const total=arr.reduce((s,x)=>s+x[1],0);
    let cum=0; const rows=arr.map(([pid,r])=>{ cum+=r; const share=cum/total;
      const cls=share<=0.8?'A':share<=0.95?'B':'C';
      // XYZ: стабильность спроса по коэффициенту вариации дневного спроса (14 дней)
      const dd=days[pid]||{}; const vals=win.map(d=>dd[d]||0); const sum=vals.reduce((a,b)=>a+b,0);
      let xyz='Z'; if(sum>0){ const mean=sum/N; const sd=Math.sqrt(vals.reduce((a,b)=>a+(b-mean)**2,0)/N); const cv=sd/mean; xyz=cv<0.6?'X':cv<0.78?'Y':'Z'; }
      return {pid,r,cls,xyz,share:r/total}; });
    const cntA=rows.filter(r=>r.cls==='A').length;
    html+=`<div class="grid g3" style="margin-bottom:16px">
      <div class="kpi"><div class="kpi-label">Группа A</div><div class="kpi-val">${cntA} поз.</div><div class="kpi-sub">дают 80% выручки</div></div>
      <div class="kpi"><div class="kpi-label">Стабильный спрос (X)</div><div class="kpi-val">${rows.filter(r=>r.xyz==='X').length}</div><div class="kpi-sub">можно держать минимум на складе</div></div>
      <div class="kpi"><div class="kpi-label">Случайный спрос (Z)</div><div class="kpi-val">${rows.filter(r=>r.xyz==='Z').length}</div><div class="kpi-sub">закупать осторожно</div></div></div>
    <div class="card pad0"><table class="tbl"><thead><tr><th>Товар</th><th>ABC</th><th>XYZ</th><th class="t-right">Выручка 14 дн</th><th class="t-right">Доля</th></tr></thead><tbody>
    ${rows.slice(0,40).map(r=>`<tr><td>${esc(U.prod(r.pid).name)}</td><td><span class="pill ${r.cls==='A'?'':r.cls==='B'?'gray':'amber'}">${r.cls}</span></td><td><span class="tag">${r.xyz}</span></td><td class="t-right mono">${money(r.r)}</td><td class="t-right">${(r.share*100).toFixed(1)}%</td></tr>`).join('')}
    </tbody></table></div><div class="legend mt16"><span><i style="background:var(--green-soft)"></i>A — топ-выручка</span><span><i style="background:#e9e5d6"></i>B</span><span><i style="background:var(--amber-soft)"></i>C — хвост</span><span>· X — стабильно, Y — колеблется, Z — случайно</span></div>`;
  }
  else if(anTab==='dead'){
    const dead=U.deadStockList(v);
    html+=`<div class="card"><div class="card-h"><h3>Мёртвый сток</h3><span class="sub">есть на остатках, но 0 продаж за 14 дней</span><span class="right pill ${dead.length?'amber':''}">${dead.length}</span></div>
    ${dead.length?`<table class="tbl"><tbody>${dead.map(p=>{ const tot=scopePharms().reduce((s,ph)=>s+U.stockAt(ph.id,p.id).qty,0); return `<tr><td><b>${esc(p.name)}</b> <span class="dim">${esc(p.inn)}</span></td><td class="t-right">${tot} шт на остатках</td><td class="t-right mono">${money(tot*p.buy)} заморожено</td><td class="t-right"><button class="btn sm" data-act="prod-open" data-id="${p.id}">Открыть</button></td></tr>`; }).join('')}</tbody></table>
    <div class="alert-box amber mt16"><span class="ic">⚠</span><span>В этих позициях заморожены деньги. Решение: вернуть поставщику, переместить в точку где продаётся, или распродать со скидкой.</span></div>`:'<div class="empty"><div class="ic">✓</div>Мёртвого стока нет — весь ассортимент оборачивается</div>'}</div>`;
  }
  else if(anTab==='staff'){
    const byU={}; S().users.filter(u=>u.role==='pharm').forEach(u=>byU[u.id]={rev:0,margin:0,checks:0,returns:0});
    sales.forEach(s=>{ if(!byU[s.userId])return; byU[s.userId].rev+=s.total; byU[s.userId].margin+=s.total-s.cost; if(s.type==='return')byU[s.userId].returns++; else byU[s.userId].checks++; });
    const arr=Object.entries(byU).sort((a,b)=>b[1].rev-a[1].rev);
    html+=`<div class="card pad0"><table class="tbl"><thead><tr><th>Фармацевт</th><th>Аптека</th><th class="t-right">Выручка 14 дн</th><th class="t-right">Чеков</th><th class="t-right">Ср. чек</th><th class="t-right">Маржа %</th><th class="t-right">Возвраты</th></tr></thead><tbody>
    ${arr.map(([uid,d],i)=>{ const u=U.user(uid); const flag=d.returns>=3;
      return `<tr><td><b>${i+1}. ${esc(u.name)}</b></td><td class="dim">${esc(U.pharm(u.pharmacyId).name)}</td><td class="t-right mono" style="font-weight:600">${money(d.rev)}</td><td class="t-right mono">${d.checks}</td><td class="t-right mono">${money(d.checks?d.rev/d.checks:0)}</td><td class="t-right">${d.rev?Math.round(d.margin/d.rev*100):0}%</td><td class="t-right">${flag?`<span class="pill red">${d.returns} ⚠</span>`:d.returns}</td></tr>`; }).join('')}
    </tbody></table></div>
    <div class="alert-box amber mt16"><span class="ic">ℹ</span><span>Рейтинг по выручке и марже. Подозрительные паттерны (много возвратов, частые отмены) подсвечиваются красным — повод проверить по журналу действий.</span></div>`;
  }
  else if(anTab==='compare'){
    const days=U.dayList(7);
    html+=`<div class="card"><div class="card-h"><h3>Сравнение аптек</h3><span class="sub">выручка по дням, 7 дней</span></div>`;
    const maxR=Math.max(1,...S().pharmacies.map(p=>Math.max(...U.revByDay(p.id,days))));
    html+=S().pharmacies.map(p=>{ const rb=U.revByDay(p.id,days); const sum=rb.reduce((s,x)=>s+x,0);
      return `<div style="margin-bottom:16px"><div class="flex between"><b>${esc(p.name)}</b><span class="mono">${money(sum)} / нед</span></div>
        <div class="spark" style="margin-top:8px;height:54px">${rb.map((x,i)=>`<i style="height:${Math.max(6,x/maxR*100)}%" title="${fmtDate(days[i])}: ${money(x)}"></i>`).join('')}</div></div>`; }).join('');
    html+=`</div>
    <div class="card mt16"><div class="card-h"><h3>Один товар — почему разрыв?</h3></div>
      <p class="dim">Пример: «Болтарин (диклофенак)» продаётся в Аптеке №1 значительно активнее, чем в №3. Система показывает разницу — собственник решает: переместить остаток, обучить фармацевта, или скорректировать ассортимент.</p>
      <table class="tbl mt8"><tbody>${S().pharmacies.map(p=>{ const q=U.salesIn(p.id,U.dayList(14)[0],todayISO()).reduce((s,x)=>s+x.lines.filter(l=>l.pid==='p6').reduce((y,l)=>y+l.qty,0),0); return `<tr><td>${esc(p.name)}</td><td class="t-right mono">${q} уп. за 14 дней</td></tr>`; }).join('')}</tbody></table></div>`;
  }
  else {
    html+=`<div class="card"><div class="card-h"><h3>Цены конкурентов</h3><span class="sub">ручной ввод, 10–15 ключевых позиций</span></div>
    <table class="tbl"><thead><tr><th>Товар</th><th class="t-right">Наша цена</th><th class="t-right">У конкурента</th><th>Кто</th><th class="t-right">Рекомендация</th></tr></thead><tbody>
    ${S().competitors.map(c=>{ const diff=Math.round((c.our-c.comp)/c.our*100); const dearer=c.our>c.comp;
      return `<tr><td>${esc(c.name)}</td><td class="t-right mono">${money(c.our)}</td><td class="t-right mono">${money(c.comp)}</td><td class="dim">${esc(c.who)}</td><td class="t-right">${dearer?`<span class="pill amber">дороже на ${diff}% — подумать</span>`:`<span class="pill">мы дешевле</span>`}</td></tr>`; }).join('')}
    </tbody></table>
    <div class="alert-box amber mt16"><span class="ic">ℹ</span><span>Система не заставляет снижать цену — только даёт информацию. Держите «комфортный паритет» на ключевых позициях, не воюйте ценой по всему ассортименту.</span></div></div>`;
  }
  host.innerHTML=html;
};

/* ================= LOG ================= */
M.log=function(host,top){
  U.topbar(top,'Журнал действий','кто, что и когда сделал в системе — для расследований');
  host.innerHTML=`<div class="card pad0"><table class="tbl"><thead><tr><th>Время</th><th>Пользователь</th><th>Действие</th></tr></thead><tbody>
    ${S().log.slice(0,60).map(l=>`<tr><td class="mono" style="white-space:nowrap">${fmtDate(l.ts)} ${fmtTime(l.ts)}</td><td>${esc(U.user(l.userId).name)} <span class="dim">${U.user(l.userId).role==='owner'?'· собственник':U.user(l.userId).role==='admin'?'· админ':'· фармацевт'}</span></td><td>${esc(l.text)}</td></tr>`).join('')}
  </tbody></table></div>`;
};

/* ================= ACTIONS ================= */
M.action=function(a,b,e){
  // вкладки / фильтры
  if(a==='cat-flat'){ U.catFilter.group=false; U.render(); }
  else if(a==='cat-group'){ U.catFilter.group=true; U.render(); }
  else if(a==='wh-tab'){ U.wh.tab=b.dataset.t; U.render(); }
  else if(a==='an-tab'){ anTab=b.dataset.t; U.render(); }
  else if(a==='fin-period'){ finPeriod=b.dataset.p; U.render(); }
  // карточка товара
  else if(a==='prod-open'){ U.closeModal(); productModal(b.dataset.id); }
  else if(a==='prod-new'){ productForm(); }
  else if(a==='prod-save'){ saveProduct(); }
  // склад
  else if(a==='wh-receive'){ receiveForm(); }
  else if(a==='wh-receive-do'){ doReceive(); }
  else if(a==='wh-transfer'){ transferForm(); }
  else if(a==='wh-transfer-do'){ doTransfer(); }
  else if(a==='wh-writeoff'){ doWriteoff(b.dataset.pid,b.dataset.ph); }
  else if(a==='wh-order'){ U.toast('Заявка поставщику сформирована (демо)','ok'); }
  else if(a==='wh-invent'){ doInventory(b.dataset.id); }
  // поставщик
  else if(a==='sup-new'){ supplierForm(); }
  else if(a==='sup-save'){ saveSupplier(); }
};

/* ---- product modal ---- */
function productModal(id){ const p=U.prod(id); const S0=S();
  const analogs=S0.products.filter(x=>x.inn===p.inn).sort((a,b)=>a.sale-b.sale);
  const stocks=S0.pharmacies.map(ph=>{ const st=U.stockAt(ph.id,p.id); return `<tr><td>${esc(ph.name)}</td><td class="t-right mono ${st.qty<=st.min?'stock-low':''}">${st.qty} шт</td><td class="t-right"><span class="pill ${daysLeft(st.expiry)<=30?'amber':'gray'}">${daysLeft(st.expiry)<=0?'просрочен':daysLeft(st.expiry)+' дн'}</span></td></tr>`; }).join('');
  U.modal(`<div class="modal-h"><h3>${esc(p.name)}</h3><button class="modal-x" data-act="close-modal">×</button></div>
  <div class="modal-b">
    <div class="prod-head"><div class="prod-img">${p.rx?'℞':'＋'}</div>
      <div style="flex:1"><div class="flex gap6 wrap" style="margin-bottom:6px"><span class="pill">${esc(p.cat)}</span>${p.rx?'<span class="pill rx">Рецептурный</span>':'<span class="pill gray">Безрецептурный</span>'}<span class="pill ${p.margin>=45?'':'amber'}">маржа ${p.margin}%</span></div>
      <dl class="kv">
        <dt>МНН</dt><dd>${esc(p.inn)}</dd>
        <dt>Производитель</dt><dd>${esc(p.manuf)}, ${esc(p.country)}</dd>
        <dt>Форма · дозировка</dt><dd>${esc(p.form)}, ${esc(p.dose)} · ${esc(p.pack)}</dd>
        <dt>Штрихкод</dt><dd class="mono">${esc(p.barcode)}</dd>
        <dt>Закупка / продажа</dt><dd><b>${money(p.buy)}</b> → <b>${money(p.sale)}</b></dd>
      </dl></div></div>
    <div class="card-h" style="margin:18px 0 8px"><h3 style="font-size:15px">Остатки по аптекам</h3></div>
    <table class="tbl analog-tbl"><tbody>${stocks}</tbody></table>
    <div class="card-h" style="margin:18px 0 8px"><h3 style="font-size:15px">Аналоги (${esc(p.inn)})</h3><span class="sub">${analogs.length} ${analogs.length>4?'брендов':'бренда'}</span></div>
    <table class="tbl analog-tbl"><thead><tr><th>Бренд</th><th>Производитель</th><th class="t-right">Цена</th><th class="t-right">Маржа</th></tr></thead><tbody>
    ${analogs.map(x=>`<tr ${x.id===p.id?'style="background:var(--green-soft)"':''}><td>${esc(x.name)}${x.id===p.id?' ←':''}</td><td class="dim">${esc(x.country)}</td><td class="t-right mono">${money(x.sale)}</td><td class="t-right">${x.margin}%</td></tr>`).join('')}
    </tbody></table>
    <div class="dim mt16">Фармацевт видит аналоги при продаже и может предложить клиенту вариант дешевле, если врач не зафиксировал бренд.</div>
  </div>`,true);
}

/* ---- product form ---- */
function productForm(){ const cats=S().cats;
  U.modal(`<div class="modal-h"><h3>Новый товар</h3><button class="modal-x" data-act="close-modal">×</button></div>
  <div class="modal-b">
    <div class="field"><label>Торговое наименование</label><input id="f_name" placeholder="напр. Вольтарен"></div>
    <div class="frow"><div class="field"><label>МНН (международное)</label><input id="f_inn" placeholder="Диклофенак"></div>
      <div class="field"><label>Категория</label><select id="f_cat">${cats.map(c=>`<option>${c}</option>`).join('')}</select></div></div>
    <div class="frow"><div class="field"><label>Производитель</label><input id="f_manuf"></div><div class="field"><label>Страна</label><input id="f_country"></div></div>
    <div class="frow"><div class="field"><label>Форма / дозировка</label><input id="f_form" placeholder="таблетки 50 мг"></div><div class="field"><label>Упаковка</label><input id="f_pack" placeholder="20 шт"></div></div>
    <div class="frow"><div class="field"><label>Закупочная цена, смн</label><input id="f_buy" type="number" value="0"></div><div class="field"><label>Цена продажи, смн</label><input id="f_sale" type="number" value="0"></div></div>
    <div class="field"><label><input type="checkbox" id="f_rx" style="width:auto"> Рецептурный (Rx)</label></div>
  </div>
  <div class="modal-f"><button class="btn ghost" data-act="close-modal">Отмена</button><button class="btn primary" data-act="prod-save">Сохранить</button></div>`);
}
function saveProduct(){ const g=id=>document.getElementById(id);
  const name=g('f_name').value.trim(); if(!name){U.toast('Введите наименование','warn');return;}
  const buy=+g('f_buy').value||0, sale=+g('f_sale').value||0;
  const p={id:'p'+Date.now(),name,inn:g('f_inn').value.trim()||name,cat:g('f_cat').value,manuf:g('f_manuf').value.trim()||'—',country:g('f_country').value.trim()||'—',form:g('f_form').value.trim()||'—',dose:'',pack:g('f_pack').value.trim()||'—',rx:g('f_rx').checked,buy,sale,barcode:String(4600000000000+Date.now()%9999999),margin:sale?Math.round((sale-buy)/sale*100):0};
  const st=S(); st.products.push(p); st.pharmacies.forEach(ph=>st.stock[ph.id][p.id]={qty:0,min:5,expiry:new Date(Date.now()+365*864e5).toISOString().slice(0,10)});
  st.log.unshift({ts:new Date().toISOString(),userId:U.session().userId,text:'Добавлен товар: '+name});
  U.save(); U.closeModal(); U.toast('Товар добавлен в каталог','ok'); U.render();
}

/* ---- receive shipment ---- */
function receiveForm(){ const v=view()||U.session().pharmacyId||'a1';
  U.modal(`<div class="modal-h"><h3>Новая поставка</h3><button class="modal-x" data-act="close-modal">×</button></div>
  <div class="modal-b">
    <div class="frow"><div class="field"><label>Аптека (куда)</label><select id="r_ph">${S().pharmacies.map(p=>`<option value="${p.id}" ${p.id===v?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Поставщик</label><select id="r_sup">${S().suppliers.map(s=>`<option>${esc(s.name)}</option>`).join('')}</select></div></div>
    <div class="field"><label>Товар</label><select id="r_prod">${S().products.map(p=>`<option value="${p.id}">${esc(p.name)} (${esc(p.inn)})</option>`).join('')}</select></div>
    <div class="frow"><div class="field"><label>Количество</label><input id="r_qty" type="number" value="20"></div>
      <div class="field"><label>Срок годности</label><input id="r_exp" type="date" value="${new Date(Date.now()+540*864e5).toISOString().slice(0,10)}"></div></div>
    <div class="alert-box amber"><span class="ic">▥</span><span>В бою: сканируете штрихкоды поступивших упаковок — количество проставляется автоматически. Здесь добавим вручную.</span></div>
  </div>
  <div class="modal-f"><button class="btn ghost" data-act="close-modal">Отмена</button><button class="btn primary" data-act="wh-receive-do">Принять поставку</button></div>`);
}
function doReceive(){ const g=id=>document.getElementById(id);
  const ph=g('r_ph').value, pid=g('r_prod').value, qty=+g('r_qty').value||0, exp=g('r_exp').value, sup=g('r_sup').value;
  if(qty<=0){U.toast('Укажите количество','warn');return;}
  const st=U.stockAt(ph,pid); st.qty+=qty; st.expiry=exp;
  S().log.unshift({ts:new Date().toISOString(),userId:U.session().userId,text:`Приёмка: ${U.prod(pid).name} +${qty} шт от «${sup}» → ${U.pharm(ph).name}`});
  U.save(); U.closeModal(); U.toast(`Принято ${qty} шт · остаток обновлён`,'ok'); U.render();
}

/* ---- transfer ---- */
function transferForm(){
  U.modal(`<div class="modal-h"><h3>Перемещение между аптеками</h3><button class="modal-x" data-act="close-modal">×</button></div>
  <div class="modal-b">
    <div class="field"><label>Товар</label><select id="t_prod">${S().products.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>
    <div class="frow"><div class="field"><label>Из аптеки</label><select id="t_from">${S().pharmacies.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>
      <div class="field"><label>В аптеку</label><select id="t_to">${S().pharmacies.map((p,i)=>`<option value="${p.id}" ${i===1?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div></div>
    <div class="field"><label>Количество</label><input id="t_qty" type="number" value="5"></div>
  </div>
  <div class="modal-f"><button class="btn ghost" data-act="close-modal">Отмена</button><button class="btn primary" data-act="wh-transfer-do">Переместить</button></div>`);
}
function doTransfer(){ const g=id=>document.getElementById(id);
  const pid=g('t_prod').value, from=g('t_from').value, to=g('t_to').value, qty=+g('t_qty').value||0;
  if(from===to){U.toast('Выберите разные аптеки','warn');return;}
  const sf=U.stockAt(from,pid); if(sf.qty<qty){U.toast('Недостаточно остатка в источнике','warn');return;}
  sf.qty-=qty; U.stockAt(to,pid).qty+=qty;
  S().log.unshift({ts:new Date().toISOString(),userId:U.session().userId,text:`Перемещение: ${U.prod(pid).name} ${qty} шт · ${U.pharm(from).name} → ${U.pharm(to).name}`});
  U.save(); U.closeModal(); U.toast('Перемещение проведено','ok'); U.render();
}

/* ---- writeoff ---- */
function doWriteoff(pid,ph){ const st=U.stockAt(ph,pid); const loss=st.qty*U.prod(pid).buy; const q=st.qty;
  st.qty=0; S().log.unshift({ts:new Date().toISOString(),userId:U.session().userId,text:`Списание просрочки: ${U.prod(pid).name} ${q} шт · убыток ${money(loss)} · ${U.pharm(ph).name}`});
  U.save(); U.toast(`Списано ${q} шт · убыток ${money(loss)} зафиксирован`,'warn'); U.render();
}

/* ---- inventory ---- */
function doInventory(phId){ const st=S().stock[phId]; const diffs=[];
  S().products.forEach((p,i)=>{ if((i*7+3)%9===0){ const sys=U.stockAt(phId,p.id).qty; const fact=Math.max(0,sys-((i%3)+1)); if(sys!==fact) diffs.push({p,sys,fact,loss:(sys-fact)*p.buy}); } });
  U.modal(`<div class="modal-h"><h3>Инвентаризация · ${esc(U.pharm(phId).name)}</h3><button class="modal-x" data-act="close-modal">×</button></div>
  <div class="modal-b">
    ${diffs.length?`<div class="alert-box red"><span class="ic">⚠</span><span>Найдено расхождений: ${diffs.length}. Сумма недостачи: <b>${money(diffs.reduce((s,d)=>s+d.loss,0))}</b></span></div>
    <table class="tbl"><thead><tr><th>Товар</th><th class="t-right">Учёт</th><th class="t-right">Факт</th><th class="t-right">Недостача</th></tr></thead><tbody>
    ${diffs.map(d=>`<tr><td>${esc(d.p.name)}</td><td class="t-right mono">${d.sys}</td><td class="t-right mono">${d.fact}</td><td class="t-right mono" style="color:var(--red)">−${d.sys-d.fact} (${money(d.loss)})</td></tr>`).join('')}
    </tbody></table><div class="dim mt16">Отчёт собственнику: где недостача и у какого фармацевта была смена. В бою — вводите фактический остаток вручную.</div>`
    :'<div class="empty"><div class="ic">✓</div>Расхождений нет — факт совпадает с учётом</div>'}
  </div><div class="modal-f"><button class="btn primary" data-act="close-modal">Закрыть</button></div>`,true);
}

/* ---- supplier ---- */
function supplierForm(){
  U.modal(`<div class="modal-h"><h3>Новый поставщик</h3><button class="modal-x" data-act="close-modal">×</button></div>
  <div class="modal-b">
    <div class="field"><label>Наименование</label><input id="s_name"></div>
    <div class="frow"><div class="field"><label>ИНН</label><input id="s_inn"></div><div class="field"><label>Условия</label><input id="s_terms" placeholder="отсрочка 30 дней"></div></div>
  </div><div class="modal-f"><button class="btn ghost" data-act="close-modal">Отмена</button><button class="btn primary" data-act="sup-save">Сохранить</button></div>`);
}
function saveSupplier(){ const g=id=>document.getElementById(id); const name=g('s_name').value.trim();
  if(!name){U.toast('Введите наименование','warn');return;}
  S().suppliers.push({id:'s'+Date.now(),name,inn:g('s_inn').value.trim()||'—',terms:g('s_terms').value.trim()||'—',debt:0,marginAfter:45});
  U.save(); U.closeModal(); U.toast('Поставщик добавлен','ok'); U.render();
}

})();
