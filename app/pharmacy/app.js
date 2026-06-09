/* ===== Pllato CRM demo — app.js ===== */
const state = { page:'dash', role:'owner', cur:'KGS', funnel:'b2c', thread:'t1', clientTab:0, theme:'dark' };

// ---------- AUTH / API config ----------
const API_BASE = 'https://pharmacy-crm-worker.uurraa.workers.dev';
const GOOGLE_CLIENT_ID = '773798066647-jg137in0mum92famuml70kauonp7amgg.apps.googleusercontent.com';
let AUTH = { token:null, user:null };

// ---------- helpers ----------
const $ = (s,r=document)=>r.querySelector(s);
const el = (h)=>{const t=document.createElement('template');t.innerHTML=h.trim();return t.content.firstElementChild;};
const ic = (id,cls='')=>`<svg class="svg-i ${cls}"><use href="#${id}"/></svg>`;
// экранирование пользовательских/1С-данных при вставке в HTML (текст и атрибуты в "")
const esc = (s)=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function money(kgs){const v=Math.round(kgs*DB.fx[state.cur]);return v.toLocaleString('ru-RU')+' '+DB.curSym[state.cur];}
function initials(n){return n.split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();}
function avBg(seed){const c=['#10b981','#2563eb','#7c3aed','#db2777','#0891b2','#d97706','#16a34a','#e1306c'];let h=0;for(const ch of seed)h=ch.charCodeAt(0)+((h<<5)-h);return c[Math.abs(h)%c.length];}
const chColor = t=> t==='wa'?'var(--wa)': t==='ig'?'var(--ig)': t==='wp'?'var(--amber)':'var(--muted)';
const chIcon  = t=> t==='wa'?'i-phone': t==='ig'?'i-chat': 'i-doc';
const chLabel = t=> t==='wa'?'WhatsApp': t==='ig'?'Instagram': 'Сайт';

function toast(msg,icon='i-check2',color='var(--accent)'){
  const t=el(`<div class="t"><div class="ti" style="background:${color}22;color:${color}">${ic(icon,'sm')}</div><div>${msg}</div></div>`);
  $('#toast-root').appendChild(t);setTimeout(()=>{t.style.opacity='0';t.style.transition='.3s';setTimeout(()=>t.remove(),300);},2600);
}
function openModal(html,cls=''){
  const bg=el(`<div class="modal-bg"><div class="modal ${cls}">${html}</div></div>`);
  bg.addEventListener('click',e=>{if(e.target===bg)bg.remove();});
  $('#modal-root').appendChild(bg);return bg;
}
const closeModal = ()=>$('.modal-bg')?.remove();

// ---------- nav config ----------
const NAV = [
  {g:'Продажи', items:[
    {id:'dash', t:'Дашборд', i:'i-grid', badge:''},
    {id:'funnels', t:'Воронки', i:'i-funnel'},
    {id:'clients', t:'Клиенты', i:'i-users'},
    {id:'inbox', t:'Чаты', i:'i-chat', badge:'9', alt:false},
    {id:'orders', t:'Заказы', i:'i-cart'},
    {id:'sales', t:'Продажи · 1С', i:'i-money'},
    {id:'catalog', t:'Каталог · 1С', i:'i-box'},
  ]},
  {g:'Маркетинг', items:[
    {id:'marketing', t:'Промокоды и акции', i:'i-tag'},
    {id:'bloggers', t:'Блогеры', i:'i-star'},
    {id:'doctors', t:'Врачи-партнёры', i:'i-tooth'},
    {id:'analytics', t:'Аналитика', i:'i-chart'},
  ]},
  {g:'Автоматизация', items:[
    {id:'tasks', t:'Задачи', i:'i-check2', badge:'5', alt:true},
    {id:'subs', t:'Подписки', i:'i-repeat'},
    {id:'triggers', t:'Триггеры', i:'i-flame'},
    {id:'ai', t:'AI-агент', i:'i-bot'},
    {id:'kpi', t:'KPI продавцов', i:'i-target'},
  ]},
  {g:'Система', items:[
    {id:'team', t:'Команда и роли', i:'i-shield'},
    {id:'integrations', t:'Интеграции', i:'i-plug'},
    {id:'settings', t:'Настройки', i:'i-cog'},
  ]},
];
const PAGE_META = {
  dash:['Дашборд владельца','10 ключевых метрик · обновлено только что'],
  funnels:['Воронки продаж','B2C и B2B · drag-and-drop сделок между этапами'],
  clients:['Клиенты','Единая база · история покупок из 1С'],
  inbox:['Чаты','5 WhatsApp + Instagram Direct + формы сайтов в одном окне'],
  orders:['Заказы','Сформированы в CRM → переданы в 1С Listki EG'],
  sales:['Продажи · 1С','Выручка, прибыль, топ товаров и KPI продавцов из регистра «Продажи» 1С'],
  catalog:['Каталог · остатки 1С','Зеркало 4 000 SKU в реальном времени'],
  marketing:['Промокоды и акции','Живут в CRM · в 1С уходит итоговая цена'],
  bloggers:['Блогеры и креаторы','Персональные коды · KPI · ROI'],
  doctors:['Врачи-партнёры','Промокоды врачей · пациенты · кэшбек · сводная по врачу'],
  analytics:['Аналитика','Классическая вороночная аналитика'],
  tasks:['Задачи и дела','Привязанные к сделкам и функциональные'],
  subs:['Подписочная модель','Авто-заказ наборов каждые N месяцев'],
  triggers:['Триггерные рассылки','ДР · рекуррент · статусы заказов'],
  ai:['AI-агент на WhatsApp','Ночные консультации · обкатка на тестовой группе'],
  kpi:['KPI продавцов','План / факт / бонус в реальном времени'],
  team:['Команда и роли','Разграничение доступа по ролям'],
  integrations:['Интеграции','1С · GreenAPI · Meta · WordPress'],
  settings:['Настройки','Воронки, валюты, безопасность'],
};

// ---------- render shell ----------
function renderNav(){
  const allowed=DB.access[state.role];
  const nav=$('#nav');nav.innerHTML='';
  NAV.forEach(group=>{
    const items=group.items.filter(it=>allowed.includes(it.id));
    if(!items.length)return;
    nav.appendChild(el(`<div class="nav-group">${group.g}</div>`));
    items.forEach(it=>{
      let badge=it.badge;
      if(it.id==='inbox') badge=String(DB.threads.reduce((a,t)=>a+(t.unread||0),0)||'');
      if(it.id==='tasks') badge=String((window.__taskBadge!=null?window.__taskBadge:0)||'');
      const b=el(`<button class="nav-item ${state.page===it.id?'active':''}" data-page="${it.id}">
        ${ic(it.i)}<span>${it.t}</span>${badge?`<span class="badge ${it.alt?'alt':''}">${badge}</span>`:''}</button>`);
      b.onclick=()=>go(it.id);
      nav.appendChild(b);
    });
  });
}
function renderRoleSel(){
  const sel=$('#roleSel'); if(!sel) return;
  // Переключатель ролей — только для админов (владелец/суперадмин). Остальным скрываем (роль фиксирована).
  if(!isAdminRole()){ sel.style.display='none'; sel.onchange=null; return; }
  sel.style.display=''; sel.innerHTML='';
  DB.roles.forEach(r=>sel.appendChild(el(`<option value="${r.id}" ${state.role===r.id?'selected':''}>${r.name} (${r.who})</option>`)));
  sel.onchange=()=>{state.role=sel.value;const r=DB.roles.find(x=>x.id===state.role);
    $('#userName').textContent=r.who;$('#userRole').textContent=r.name;
    $('#userAv').textContent=initials(r.who);$('#userAv').style.background=r.color;
    const allowed=DB.access[state.role];if(!allowed.includes(state.page))state.page=allowed[0];
    renderNav();renderPage();toast(`Роль: <b>${r.name}</b> — показаны только доступные разделы`,'i-shield',r.color);};
}
function go(p){state.page=p;document.getElementById('sidebar').classList.remove('open');renderNav();renderPage();}
function renderPage(){
  const [t,s]=PAGE_META[state.page]||['',''];
  $('#pageTitle').textContent=t;$('#pageSub').textContent=s;
  $('#content').innerHTML='';
  (PAGES[state.page]||(()=>{}))($('#content'));
  $('#content').scrollTop=0;
}

// ============================================================
//  PAGES
// ============================================================
const PAGES={};

// ---------- DASHBOARD ----------
PAGES.dash=(c)=>{
  if(isAdminRole()){
    const bar=el(`<div class="row" style="justify-content:flex-end;margin-bottom:14px">
      <button class="btn" id="dashInvite">${ic('i-plus','sm')} Пригласить сотрудника</button></div>`);
    bar.querySelector('#dashInvite').onclick=()=>openInviteModal();
    c.appendChild(bar);
  }
  const tbar=el(`<div class="toolbar">
    <div class="seg" data-dh="range">
      <button data-d="7">7 дней</button>
      <button class="on" data-d="30">30 дней</button>
      <button data-d="90">90 дней</button>
    </div>
    <div class="fld-in">${ic('i-clock','sm')}<input type="date" data-dh="from" title="С даты"></div>
    <div class="fld-in">${ic('i-clock','sm')}<input type="date" data-dh="to" title="По дату"></div>
    <button class="btn sm" data-dh="apply">Показать</button>
  </div>`);
  c.appendChild(tbar);
  const wrap=el(`<div><div class="muted2" style="padding:10px">Загрузка дашборда…</div></div>`);
  c.appendChild(wrap);
  const seg=tbar.querySelector('[data-dh=range]'), fromI=tbar.querySelector('[data-dh=from]'), toI=tbar.querySelector('[data-dh=to]'), applyB=tbar.querySelector('[data-dh=apply]');
  seg.querySelectorAll('button').forEach(b=>b.onclick=()=>{ seg.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); fromI.value=''; toI.value=''; loadDash(wrap,'days='+b.dataset.d); });
  applyB.onclick=()=>{ if(fromI.value&&toI.value){ seg.querySelectorAll('button').forEach(x=>x.classList.remove('on')); loadDash(wrap,'from='+fromI.value+'&to='+toI.value); } else toast('Укажите обе даты','i-info'); };
  loadDash(wrap,'days=30');
};
const DASH_COLORS=['#10b981','#2563eb','#7c3aed','#0891b2','#db2777','#16a34a','#d97706'];
function dashKpi(icn,col,lbl,val,sub,dir){
  return `<div class="kpi"><div class="k-ic" style="background:${col}22;color:${col}">${ic(icn)}</div>
    <div class="k-lbl">${lbl}</div><div class="k-val">${val}</div>${sub?`<div class="k-sub ${dir>0?'up':dir<0?'down':''}">${sub}</div>`:''}</div>`;
}
function dashDelta(p){ return p==null?'нет базы для сравнения':(p>0?'▲ ':p<0?'▼ ':'')+Math.abs(p)+'% к пред. периоду'; }
function dashBars(rows){ const max=Math.max(...rows.map(x=>x.revenue||0),1); return barList(rows.map((x,i)=>[esc(x.name||'—'),x.revenue||0,DASH_COLORS[i%DASH_COLORS.length]]),max,true); }
function dashDayChart(rows){
  if(!rows||!rows.length) return '<div class="muted2" style="padding:16px">Нет данных</div>';
  const max=Math.max(...rows.map(r=>r.revenue||0),1);
  return `<div style="display:flex;align-items:flex-end;gap:3px;height:120px;padding:10px 2px 4px">${rows.map(p=>`<div title="${esc(p.d)}: ${money(p.revenue)}" style="flex:1;min-width:3px;background:linear-gradient(180deg,var(--accent2),var(--accent));border-radius:3px 3px 0 0;height:${Math.max(2,Math.round((p.revenue||0)/max*100))}%"></div>`).join('')}</div>`;
}
async function loadDash(wrap,qs){
  const fmt=(n)=>(n||0).toLocaleString('ru-RU');
  wrap.innerHTML=`<div class="muted2" style="padding:10px">Загрузка…</div>`;
  const r=await api('/api/1c/dashboard'+(qs?('?'+qs):''));
  if(!r.ok){
    const why=r.status===403?'нужен доступ':r.status===401?'войдите':'нет связи';
    wrap.innerHTML=`<div class="note section-gap" style="margin-top:0">${ic('i-info','sm')} Дашборд в демо-режиме (${why}). Реальные метрики появятся при доступе к 1С.</div>
      <div class="cards-row">
        ${dashKpi('i-money','#10b981','Выручка',money(2480000),'▲ 12% к пред. периоду',1)}
        ${dashKpi('i-chart','#2563eb','Прибыль · 30%',money(744000),'▲ 8% к пред. периоду',1)}
        ${dashKpi('i-doc','#7c3aed','Документов','1 240','▲ 5% к пред. периоду',1)}
        ${dashKpi('i-cart','#0891b2','Средний документ',money(2000),'розница',0)}
      </div>`;
    return;
  }
  const d=r.data;
  if(d.empty){ wrap.innerHTML=`<div class="note blue">${ic('i-info','sm')} Нет данных продаж в 1С — запустите синхронизацию.</div>`; return; }
  const cur=d.cur, dl=d.delta, t=d.totals, n=d.days||30;
  // отразить фактическое окно в полях дат (когда выбран быстрый диапазон)
  const fi=document.querySelector('[data-dh=from]'), ti=document.querySelector('[data-dh=to]');
  if(fi&&ti&&!fi.value&&d.from&&d.to){ fi.value=d.from; ti.value=d.to; }
  wrap.innerHTML=
   `<div class="cards-row">
      ${dashKpi('i-money','#10b981','Выручка · '+n+' дн',money(cur.revenue),dashDelta(dl.revenue),dl.revenue)}
      ${dashKpi('i-chart','#2563eb','Прибыль · '+cur.margin+'%',money(cur.profit),dashDelta(dl.profit),dl.profit)}
      ${dashKpi('i-doc','#7c3aed','Документов',fmt(cur.docs),dashDelta(dl.docs),dl.docs)}
      ${dashKpi('i-cart','#0891b2','Средний документ',money(cur.avg),'розница',0)}
      ${dashKpi('i-box','#db2777','Продано позиций',fmt(cur.qty),'за '+n+' дн',0)}
    </div>
    <div class="cards-row section-gap">
      ${dashKpi('i-users','#16a34a','Покупателей',fmt(t.buyers),'в базе 1С',0)}
      ${dashKpi('i-tooth','#10b981','Врачей-партнёров',fmt(t.doctors),'группы «Врач партнер»',0)}
      ${dashKpi('i-box','#0e7490','SKU в каталоге',fmt(t.products),'остатки синхронны',0)}
      ${dashKpi('i-truck','#d97706','Магазинов с продажами',fmt(d.byStore.length),'за '+n+' дн',0)}
    </div>
    <div class="grid-2 section-gap">
      <div class="panel"><div class="panel-h"><h3>Топ товаров · ${n} дн</h3></div><div class="panel-b">${d.topProducts.length?dashBars(d.topProducts):'<div class="muted2">Нет данных</div>'}</div></div>
      <div class="panel"><div class="panel-h"><h3>Выручка по магазинам · ${n} дн</h3></div><div class="panel-b">${d.byStore.length?dashBars(d.byStore):'<div class="muted2">Нет данных</div>'}</div></div>
    </div>
    <div class="grid-2 section-gap">
      <div class="panel"><div class="panel-h"><h3>Топ врачи · ${n} дн</h3></div><div class="panel-b">${d.topDoctors.length?dashBars(d.topDoctors):'<div class="muted2">Нет данных</div>'}</div></div>
      <div class="panel"><div class="panel-h"><h3>Выручка по дням</h3><span class="ph-sub">${esc(d.from||'')} — ${esc(d.to||d.asOf||'')}</span></div><div class="panel-b">${dashDayChart(d.byDay)}</div></div>
    </div>
    <div class="note section-gap">${ic('i-info','sm')} Период ${esc(d.from||'')} — ${esc(d.to||d.asOf||'')} (${n} дн), сравнение — с предыдущим периодом такой же длины. Данные 1С на ${esc(d.dmax||d.asOf||'')}. Синхронизация раз в 30 мин.</div>`;
}

function funnelVis(rows){
  const max=rows[0][1];
  return `<div class="funnel-vis">${rows.map((r,i)=>{const w=Math.max(18,r[1]/max*100);const conv=i?Math.round(r[1]/rows[i-1][1]*100):100;
    return `<div class="fv-row"><div class="fv-lbl">${r[0]}</div>
      <div class="fv-bar" style="width:${w}%;background:linear-gradient(90deg,${r[2]},${r[2]}cc)"><span>${r[1]}</span></div>
      <div class="fv-conv">${i?conv+'%':''}</div></div>`;}).join('')}</div>`;
}
function barList(rows,max,isMoney){
  return `<div class="bars">${rows.map(r=>`<div class="bar-row"><div class="bl">${r[0]}</div>
    <div class="bar-track"><div class="bar-fill" style="width:${Math.max(8,r[1]/max*100)}%;background:${r[2]}"></div></div>
    <div class="bv">${isMoney?money(r[1]):r[1]}</div></div>`).join('')}</div>`;
}

// ---------- FUNNELS ----------
PAGES.funnels=(c)=>{
  const tbar=el(`<div class="toolbar">
    <div class="seg" id="funnelSeg"><button class="${state.funnel==='b2c'?'on':''}" data-f="b2c">B2C · розница</button><button class="${state.funnel==='b2b'?'on':''}" data-f="b2b">B2B · опт</button></div>
    <div class="spacer"></div>
    <span class="ph-sub" id="funnelCnt"></span>
    <button class="btn primary" id="newDealBtn">${ic('i-plus','sm')} Сделка</button>
  </div>`);
  c.appendChild(tbar);
  const board=el(`<div class="kanban" id="kanban"><div class="muted2" style="padding:14px">Загрузка…</div></div>`);
  c.appendChild(board);
  // авто-прокрутка доски при перетаскивании карточки к левому/правому краю (HTML5 drag сам не скроллит)
  let _dragX=0,_kScroll=null;
  board.addEventListener('dragover',e=>{ e.preventDefault(); _dragX=e.clientX;
    if(!_kScroll) _kScroll=setInterval(()=>{ const r=board.getBoundingClientRect(),edge=80,step=26;
      if(_dragX>r.right-edge) board.scrollLeft+=step; else if(_dragX<r.left+edge) board.scrollLeft-=step; },16); });
  const _kStop=()=>{ if(_kScroll){clearInterval(_kScroll);_kScroll=null;} };
  board.addEventListener('drop',_kStop); board.addEventListener('dragend',_kStop);
  c.appendChild(el(`<div class="note section-gap">${ic('i-info','sm')} Сделки хранятся в CRM. Клиента можно выбрать из базы 1С. Перетаскивайте карточки между этапами — статус сохраняется автоматически.</div>`));
  const cnt=tbar.querySelector('#funnelCnt');
  tbar.querySelector('#funnelSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{state.funnel=b.dataset.f;renderPage();});
  tbar.querySelector('#newDealBtn').onclick=()=>newDealLive(load);
  let demoMode=false, current=[];
  function renderBoard(){
    const stages=state.funnel==='b2c'?DB.stagesB2C:DB.stagesB2B;
    board.innerHTML=''; let total=0;
    stages.forEach(stg=>{
      const list=current.filter(d=>d.stage===stg); const sum=list.reduce((a,d)=>a+(d.amount||d.sum||0),0); total+=list.length;
      const col=el(`<div class="kcol" data-stage="${esc(stg)}"><div class="kcol-h"><span class="kc-name">${esc(stg)}</span><span class="kc-count">${list.length}</span><span class="kc-sum">${money(sum)}</span></div><div class="kcol-b"></div></div>`);
      const cbody=col.querySelector('.kcol-b');
      list.forEach(d=>cbody.appendChild(demoMode?dealCard(d):dealCardLive(d)));
      if(!demoMode){
        col.addEventListener('dragover',e=>{e.preventDefault();col.classList.add('drop-hot');});
        col.addEventListener('dragleave',()=>col.classList.remove('drop-hot'));
        col.addEventListener('drop',async e=>{e.preventDefault();col.classList.remove('drop-hot');
          const id=e.dataTransfer.getData('id'); const d=current.find(x=>x.id===id);
          if(d&&d.stage!==stg){ const old=d.stage; d.stage=stg; renderBoard();
            const r=await api('/api/deals/'+id,{method:'POST',body:JSON.stringify({stage:stg})});
            if(r.ok) toast('Сделка перенесена в «'+stg+'»','i-funnel'); else { d.stage=old; renderBoard(); toast('Не удалось сохранить','i-x','#dc2626'); } } });
      }
      board.appendChild(col);
    });
    cnt.textContent=(demoMode?'демо · ':'')+total+' '+plural(total,'сделка','сделки','сделок');
  }
  async function load(){
    const r=await api('/api/deals?funnel='+state.funnel);
    if(!r.ok){ demoMode=true; current=DB.deals.filter(d=>d.type===state.funnel); renderBoard(); return; }
    demoMode=false; current=r.data.items||[]; renderBoard();
  }
  window.__reloadFunnels=load;
  load();
};
function dealCardLive(d){
  const days=d.created_at?Math.max(0,Math.round((Date.now()-d.created_at)/864e5)):0;
  const card=el(`<div class="kcard ${d.funnel==='b2b'?'b2b':''}" draggable="true" data-id="${d.id}">
    <div class="kc-top"><div class="kc-client">${esc(d.client_name||'—')}</div>${d.client_ref?'<span class="tag green" title="из 1С">1С</span>':''}</div>
    ${d.note?`<div class="kc-prod">${esc(d.note)}</div>`:''}
    <div class="kc-sum">${money(d.amount||0)}</div>
    <div class="kc-meta">${d.source?`<span class="tag">${esc(d.source)}</span>`:''}${d.mgr?`<span class="tag amber">${esc(d.mgr)}</span>`:''}<span class="kc-days">${ic('i-clock','sm')} ${days}д</span></div></div>`);
  card.addEventListener('dragstart',e=>{e.dataTransfer.setData('id',d.id);card.classList.add('dragging');});
  card.addEventListener('dragend',()=>card.classList.remove('dragging'));
  card.onclick=()=>dealModalLive(d);
  return card;
}
function newDealLive(onSaved){
  const stages=state.funnel==='b2c'?DB.stagesB2C:DB.stagesB2B;
  const bg=openModal(`<div class="modal-h"><div><h3>Новая сделка</h3><div class="mh-sub">${state.funnel==='b2c'?'B2C · розница':'B2B · опт'}</div></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="fld"><label>Клиент — поиск в 1С или ввод вручную</label><div class="fld-in" style="width:100%">${ic('i-search','sm')}<input data-nd="client" placeholder="ФИО или название" autocomplete="off" style="width:100%"></div><div id="ndSug" class="panel" style="margin-top:4px;display:none;max-height:170px;overflow:auto"></div></div>
    <div class="fld-row"><div class="fld"><label>Телефон</label><input data-nd="phone"></div><div class="fld"><label>Сумма, с</label><input data-nd="amount" type="number" placeholder="0"></div></div>
    <div class="fld-row"><div class="fld"><label>Этап</label><select data-nd="stage">${stages.map(s=>`<option>${esc(s)}</option>`).join('')}</select></div><div class="fld"><label>Источник</label><select data-nd="source"><option value="">—</option><option>WhatsApp</option><option>Instagram</option><option>Сайт</option><option>Звонок</option><option>Сарафан</option></select></div></div>
    <div class="fld"><label>Ответственный</label><input data-nd="mgr" value="${esc((AUTH.user||{}).name||'')}"></div>
    <div class="fld"><label>Комментарий</label><input data-nd="note" placeholder="Что нужно клиенту"></div>
  </div>
  <div class="modal-f"><button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="ndSave">Создать сделку</button></div>`);
  const q=bg.querySelector('[data-nd=client]'), sug=bg.querySelector('#ndSug'); let ref=null, qt=null;
  q.addEventListener('input',()=>{ ref=null; clearTimeout(qt); const v=q.value.trim(); if(v.length<2){sug.style.display='none';return;}
    qt=setTimeout(async()=>{ const r=await api('/api/1c/contractors?limit=6&q='+encodeURIComponent(v)); if(!r.ok||!(r.data.items||[]).length){sug.style.display='none';return;}
      sug.innerHTML=r.data.items.map(x=>`<div class="doc-row" data-ref="${esc(x.ref_key)}" data-name="${esc(x.name||'')}" data-phone="${esc(x.phone||'')}"><div><div class="dt">${esc(x.name||'—')}</div><div class="ds">${esc(x.code||'')} · ${esc(x.phone||'')}</div></div></div>`).join('');
      sug.style.display='block';
      sug.querySelectorAll('[data-ref]').forEach(it=>it.onclick=()=>{ ref=it.dataset.ref; q.value=it.dataset.name; bg.querySelector('[data-nd=phone]').value=it.dataset.phone; sug.style.display='none'; }); },300); });
  bg.querySelector('#ndSave').onclick=async()=>{
    const name=q.value.trim(); if(!name){toast('Укажите клиента','i-info');return;}
    const body={funnel:state.funnel,stage:bg.querySelector('[data-nd=stage]').value,client_ref:ref,client_name:name,phone:bg.querySelector('[data-nd=phone]').value.trim(),amount:Number(bg.querySelector('[data-nd=amount]').value)||0,source:bg.querySelector('[data-nd=source]').value,mgr:bg.querySelector('[data-nd=mgr]').value.trim(),note:bg.querySelector('[data-nd=note]').value.trim()};
    const r=await api('/api/deals',{method:'POST',body:JSON.stringify(body)});
    if(!r.ok){toast('Не удалось создать сделку','i-x','#dc2626');return;}
    closeModal(); toast('Сделка создана','i-funnel'); onSaved&&onSaved();
  };
}
function dealModalLive(d){
  const stages=state.funnel==='b2c'?DB.stagesB2C:DB.stagesB2B;
  const bg=openModal(`<div class="modal-h"><div class="cell-name"><span class="avatar-xs" style="width:40px;height:40px;font-size:14px;background:${avBg(d.client_name||'?')}">${initials(d.client_name||'?')}</span><div><h3>${esc(d.client_name||'—')}</h3><div class="mh-sub">${esc(d.phone||'')} ${d.client_ref?'· привязан к 1С':''}</div></div></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="fld-row"><div class="fld"><label>Этап</label><select data-dm="stage">${stages.map(s=>`<option ${s===d.stage?'selected':''}>${esc(s)}</option>`).join('')}</select></div><div class="fld"><label>Сумма, с</label><input data-dm="amount" type="number" value="${d.amount||0}"></div></div>
    <div class="fld-row"><div class="fld"><label>Ответственный</label><input data-dm="mgr" value="${esc(d.mgr||'')}"></div><div class="fld"><label>Источник</label><input data-dm="source" value="${esc(d.source||'')}"></div></div>
    <div class="fld"><label>Комментарий</label><input data-dm="note" value="${esc(d.note||'')}"></div>
  </div>
  <div class="modal-f"><button class="btn" id="dmDel" style="color:var(--red)">${ic('i-x','sm')} Удалить</button><button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="dmSave">Сохранить</button></div>`,'wide');
  bg.querySelector('#dmSave').onclick=async()=>{
    const body={stage:bg.querySelector('[data-dm=stage]').value,amount:Number(bg.querySelector('[data-dm=amount]').value)||0,mgr:bg.querySelector('[data-dm=mgr]').value.trim(),source:bg.querySelector('[data-dm=source]').value.trim(),note:bg.querySelector('[data-dm=note]').value.trim()};
    const r=await api('/api/deals/'+d.id,{method:'POST',body:JSON.stringify(body)});
    if(!r.ok){toast('Ошибка сохранения','i-x','#dc2626');return;} closeModal(); toast('Сохранено','i-check2'); if(window.__reloadFunnels)window.__reloadFunnels();
  };
  bg.querySelector('#dmDel').onclick=async()=>{ if(!confirm('Удалить сделку?'))return; const r=await api('/api/deals/'+d.id,{method:'DELETE'}); if(r.ok){closeModal();toast('Сделка удалена','i-check2'); if(window.__reloadFunnels)window.__reloadFunnels();} else toast('Ошибка','i-x','#dc2626'); };
}
function dealCard(d){
  const card=el(`<div class="kcard ${d.type==='b2b'?'b2b':''}" draggable="true" data-id="${d.id}">
    <div class="kc-top"><div class="kc-client">${d.client}</div>${d.hot?`<span class="tag red">${ic('i-flame','sm')}</span>`:''}</div>
    <div class="kc-prod">${d.product}</div>
    <div class="kc-sum">${money(d.sum)}</div>
    <div class="kc-meta">
      <span class="tag ${d.src==='wa'?'wa':d.src==='ig'?'ig':'amber'}">${chLabel(d.src)}</span>
      ${d.promo?`<span class="tag green">${d.promo}</span>`:''}
      <span class="kc-days">${ic('i-clock','sm')} ${d.days}д</span>
    </div></div>`);
  card.addEventListener('dragstart',e=>{e.dataTransfer.setData('id',d.id);card.classList.add('dragging');});
  card.addEventListener('dragend',()=>card.classList.remove('dragging'));
  card.onclick=()=>dealModal(d);
  return card;
}
function dealModal(d){
  const prods=DB.products.slice(0,3);
  openModal(`<div class="modal-h"><div><h3>Сделка · ${d.client}</h3><div class="mh-sub">${d.type==='b2c'?'B2C розница':'B2B опт'} · этап «${d.stage}»</div></div>
    <button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="grid-2b">
      <div>
        <div class="fld"><label>Клиент</label><input value="${d.client}"></div>
        <div class="fld"><label>Ответственный</label><input value="${d.mgr}"></div>
        <div class="fld"><label>Канал входа лида</label><input value="${chLabel(d.src)}"></div>
        <div class="fld"><label>Промокод / акция</label><select><option>${d.promo||'— без промокода —'}</option>${DB.promos.filter(p=>p.status==='активна').map(p=>`<option>${p.code} (−${p.disc}%)</option>`).join('')}</select></div>
      </div>
      <div>
        <h4 class="muted" style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:9px">Товары (каталог 1С)</h4>
        ${prods.map(p=>`<div class="ob-item"><div class="ob-n">${p.name}<div class="muted2" style="font-size:11px">остаток 1С: ${p.stock} шт</div></div><input class="ob-q" value="1"><span class="ob-rm">${money(p.price)}</span></div>`).join('')}
        <div class="ob-tot"><span>Скидка ${d.promo?'(промокод)':''}</span><b>${d.promo?'−'+money(d.sum*0.1):'0'}</b></div>
        <div class="ob-tot"><span>Доставка</span><b>${money(150)}</b></div>
        <div class="ob-tot grand"><span>Итого</span><b>${money(d.sum)}</b></div>
      </div>
    </div>
    <div class="note section-gap">${ic('i-info','sm')} Рентабельность по чеку считается в CRM: расход на доставку ${money(150)}, маржа ~${money(d.sum*0.28)}. В 1С уходит итоговая цена со скидкой.</div>
    <h4 class="muted section-gap" style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:11px">Журнал изменений</h4>
    <div class="timeline">
      ${tl('#10b981','i-plus','Сделка создана из лида '+chLabel(d.src),'2 дня назад')}
      ${tl('#2563eb','i-edit','Добавлены товары из каталога 1С','вчера 14:20')}
      ${tl('#7c3aed','i-funnel','Перемещена в «'+d.stage+'»','сегодня 10:42')}
    </div>
  </div>
  <div class="modal-f">
    <button class="btn" onclick="toast('WhatsApp-диалог встроен в карточку','i-chat','var(--wa)')">${ic('i-chat','sm')} Открыть переписку</button>
    <button class="btn primary" onclick="closeModal();toast('Заказ сформирован и передан в 1С Listki EG','i-cart')">${ic('i-cart','sm')} Сформировать заказ → 1С</button>
  </div>`,'wide');
}
const tl=(col,i,t,d)=>`<div class="tl-item"><div class="tl-dot" style="background:${col}22;color:${col}">${ic(i,'sm')}</div><div class="tl-c"><div class="tl-t">${t}</div><div class="tl-d">${d}</div></div></div>`;
function newDeal(){openModal(`<div class="modal-h"><div><h3>Новая сделка</h3><div class="mh-sub">${state.funnel==='b2c'?'B2C розница':'B2B опт'}</div></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b"><div class="fld"><label>Клиент</label><input placeholder="ФИО или название"></div>
  <div class="fld-row"><div class="fld"><label>Телефон</label><input placeholder="+996"></div><div class="fld"><label>Канал</label><select><option>WhatsApp · Центр</option><option>Instagram</option><option>Сайт Reliney</option></select></div></div>
  <div class="fld"><label>Ответственный</label><select><option>Айгуль</option><option>Нурлан</option><option>Бекзат</option></select></div></div>
  <div class="modal-f"><button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" onclick="closeModal();toast('Сделка создана в этапе «Заявка»')">Создать</button></div>`);}

// ---------- CLIENTS ----------
PAGES.clients=(c)=>{
  const tbar=el(`<div class="toolbar">
    <div class="fld-in">${ic('i-search','sm')}<input placeholder="Поиск по ФИО, телефону, коду, ИНН…" data-cl="q"></div>
    <select class="sel" data-cl="seg"><option value="">Все сегменты</option><option value="b2c">B2C · розница</option><option value="b2b">B2B · опт</option><option value="doctor">Врачи-партнёры</option><option value="supplier">Поставщики</option></select>
    <div class="spacer"></div>
    <span class="ph-sub" data-cl="cnt"></span>
  </div>`);
  c.appendChild(tbar);
  const segCards=el(`<div class="cards-row section-gap"></div>`);
  c.appendChild(segCards);
  const panel=el(`<div class="panel"><table class="tbl"><thead><tr>
    <th>Клиент</th><th>Телефон</th><th>Код 1С</th><th>ИНН</th><th>Сегмент</th><th>Роль</th></tr></thead><tbody><tr><td colspan="6" class="muted2" style="font-size:13px">Загрузка…</td></tr></tbody></table></div>`);
  const tb=panel.querySelector('tbody'), cnt=tbar.querySelector('[data-cl=cnt]'), qInput=tbar.querySelector('[data-cl=q]'), segSel=tbar.querySelector('[data-cl=seg]');
  const segTag=(s)=>{ const m={b2c:'green',b2b:'blue',doctor:'pink',supplier:'amber'},t={b2c:'B2C',b2b:'B2B',doctor:'врач',supplier:'поставщик'}; return s?`<span class="tag ${m[s]||''}">${t[s]||s}</span>`:'—'; };
  const roleTags=(r)=> ((r.is_buyer?'<span class="tag green">покупатель</span>':'')+(r.is_supplier?'<span class="tag amber">поставщик</span>':''))||'—';
  function rowLive(r){ return `<td><div class="cell-name"><span class="avatar-xs" style="background:${avBg(r.name||'?')}">${initials(r.name||'?')}</span><div>${esc(r.name||'—')}</div></div></td>
    <td>${esc(r.phone||'—')}</td><td class="muted2">${esc(r.code||'—')}</td><td class="muted">${esc(r.inn||'—')}</td>
    <td>${segTag(r.segment)}</td><td>${roleTags(r)}</td>`; }
  async function loadSegments(){
    const r=await api('/api/1c/segments');
    if(!r.ok){ segCards.innerHTML=''; return; }
    const rev=r.data.revenue||{}, n=r.data.counts||{};
    segCards.innerHTML =
      dashKpi('i-users','#10b981','Розница · B2C',money(rev.b2c||0),(n.b2c||0)+' '+plural(n.b2c||0,'клиент','клиента','клиентов'),0)
      + dashKpi('i-truck','#2563eb','Опт · B2B',money(rev.b2b||0),(n.b2b||0)+' '+plural(n.b2b||0,'клиент','клиента','клиентов'),0)
      + dashKpi('i-tooth','#db2777','Врачи-партнёры',money(rev.doctor||0),(n.doctor||0)+' '+plural(n.doctor||0,'врач','врача','врачей'),0)
      + dashKpi('i-box','#d97706','Поставщики','—',(n.supplier||0)+' '+plural(n.supplier||0,'поставщик','поставщика','поставщиков'),0);
    const set=(v,base,c2)=>{ const o=[...segSel.options].find(o=>o.value===v); if(o&&c2!=null)o.textContent=base+' ('+c2+')'; };
    set('b2c','B2C · розница',n.b2c); set('b2b','B2B · опт',n.b2b); set('doctor','Врачи-партнёры',n.doctor); set('supplier','Поставщики',n.supplier);
  }
  function rowDemo(cl){ const type=Array.isArray(cl.type)?cl.type:[]; return `<td><div class="cell-name"><span class="avatar-xs" style="background:${avBg(cl.name)}">${initials(cl.name)}</span><div>${esc(cl.name)}</div></div></td>
    <td>${esc(cl.phone||'—')}</td><td class="muted2">${esc(cl.card||'—')}</td><td class="muted">—</td>
    <td>${type.map(t=>`<span class="tag" style="margin:1px">${esc(t)}</span>`).join('')}</td><td>${esc(cl.mgr||'—')}</td>`; }
  const pager=el(`<div class="row section-gap" style="justify-content:center;gap:12px" hidden>
    <button class="btn sm" data-pg="prev">‹ Назад</button>
    <span class="muted" style="font-size:13px" data-pg="info"></span>
    <button class="btn sm" data-pg="next">Вперёд ›</button></div>`);
  const pgInfo=pager.querySelector('[data-pg=info]'), pgPrev=pager.querySelector('[data-pg=prev]'), pgNext=pager.querySelector('[data-pg=next]');
  const PAGE=100; let offset=0, total=0;
  function renderPager(shown,isDemo){
    if(isDemo||total<=PAGE){ pager.hidden=true; return; }
    pager.hidden=false; pgInfo.textContent=(offset+1)+'–'+(offset+shown)+' из '+total;
    pgPrev.disabled=offset<=0; pgNext.disabled=offset+PAGE>=total;
  }
  async function load(){
    const q=qInput.value.trim(), seg=segSel.value;
    const r=await api('/api/1c/contractors?limit='+PAGE+'&offset='+offset+(seg?('&segment='+seg):'')+(q?('&q='+encodeURIComponent(q)):''));
    if(!r.ok){
      cnt.textContent = r.status===401?'демо · войдите' : r.status===403?'демо · нужен доступ' : 'демо · нет связи';
      tb.innerHTML=''; DB.clients.forEach(cl=>{ const tr=el(`<tr class="clickable">${rowDemo(cl)}</tr>`); tr.onclick=()=>clientModal(cl); tb.appendChild(tr); });
      renderPager(0,true); return;
    }
    const items=r.data.items||[]; total=r.data.total!=null?r.data.total:items.length;
    cnt.textContent = total+' '+plural(total,'клиент','клиента','клиентов')+' · 1С';
    tb.innerHTML='';
    if(!items.length){ tb.innerHTML='<tr><td colspan="6" class="muted2" style="font-size:13px;padding:18px">Ничего не найдено</td></tr>'; renderPager(0,false); return; }
    items.forEach(x=>{ const tr=el(`<tr class="clickable">${rowLive(x)}</tr>`); tr.onclick=()=>contractorModal(x); tb.appendChild(tr); });
    renderPager(items.length,false);
  }
  let qt=null;
  qInput.addEventListener('input',()=>{clearTimeout(qt);qt=setTimeout(()=>{offset=0;load();},300);});
  segSel.onchange=()=>{offset=0;load();};
  pgPrev.onclick=()=>{ if(offset>0){offset=Math.max(0,offset-PAGE);load();$('#content').scrollTop=0;} };
  pgNext.onclick=()=>{ if(offset+PAGE<total){offset+=PAGE;load();$('#content').scrollTop=0;} };
  load(); loadSegments();
  c.appendChild(panel); c.appendChild(pager);
  c.appendChild(el(`<div class="note section-gap">${ic('i-info','sm')} База клиентов — контрагенты из 1С. Сегмент: B2C (физлица, розница) · B2B (юр.лица и ИП, опт) · Врачи-партнёры · Поставщики. Выручка по сегментам — из регистра «Продажи» 1С (розница без контрагента учтена в B2C). Синхронизация раз в 30 мин.</div>`));
};
function contractorModal(r){
  openModal(`<div class="modal-h"><div class="cell-name"><span class="avatar-xs" style="width:40px;height:40px;font-size:14px;background:${avBg(r.name||'?')}">${initials(r.name||'?')}</span>
    <div><h3>${esc(r.name||'—')}</h3><div class="mh-sub">${esc(r.code||'')} · ${r.kind==='ЮридическоеЛицо'?'юр.лицо':r.kind==='ФизическоеЛицо'?'физ.лицо':'—'}</div></div></div>
    <button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="grid-2b">
      <div class="fld"><label>Телефон</label><input value="${esc(r.phone||'')}"></div>
      <div class="fld"><label>ИНН</label><input value="${esc(r.inn||'')}"></div>
      <div class="fld"><label>Код 1С</label><input value="${esc(r.code||'')}"></div>
      <div class="fld"><label>Дата рождения</label><input value="${esc((r.dob||'').slice(0,10))}"></div>
    </div>
    <div class="row" style="gap:7px;margin-top:6px">${r.is_buyer?'<span class="tag green">покупатель</span>':''}${r.is_supplier?'<span class="tag amber">поставщик</span>':''}</div>
    <div class="panel section-gap" style="margin-top:14px"><div class="panel-h"><h3>${ic('i-money','sm')} История покупок · 1С</h3><span class="ph-sub" id="cmHistSub" style="margin-left:auto">загрузка…</span></div>
      <div id="cmHist"><div class="muted2" style="padding:14px;font-size:13px">Загрузка…</div></div></div>
  </div>
  <div class="modal-f"><button class="btn" onclick="closeModal()">Закрыть</button></div>`,'wide');
  loadContractorHistory(r);
}
async function loadContractorHistory(r){
  const box=document.getElementById('cmHist'), sub=document.getElementById('cmHistSub');
  if(!box) return;
  if(!r.ref_key){ if(sub)sub.textContent=''; box.innerHTML='<div class="muted2" style="padding:14px;font-size:13px">Нет привязки к 1С</div>'; return; }
  const res=await api('/api/1c/sales?contractor='+encodeURIComponent(r.ref_key)+'&limit=200');
  if(!res.ok){ if(sub)sub.textContent=res.status===403?'нужен доступ':res.status===401?'войдите':'нет связи'; box.innerHTML='<div class="muted2" style="padding:14px;font-size:13px">История недоступна</div>'; return; }
  const it=res.data.items||[], docs=res.data.docs||0;
  if(sub) sub.textContent = it.length ? (money(res.data.total||0)+' · '+docs+' '+plural(docs,'документ','документа','документов')) : 'нет покупок';
  if(!it.length){ box.innerHTML='<div class="note section-gap" style="margin:14px">'+ic('i-info','sm')+' Покупок, привязанных к этому клиенту, в 1С пока нет. Розничные продажи без дисконтной карты учитываются обезличенно.</div>'; return; }
  box.innerHTML='<table class="tbl"><thead><tr><th>Дата</th><th>Товар</th><th class="num">Кол-во</th><th class="num">Сумма</th></tr></thead><tbody>'+it.map(x=>`<tr><td class="muted2">${esc((x.date||'').slice(0,10))}</td><td>${esc(x.name||'—')}</td><td class="num">${(x.qty||0).toLocaleString('ru-RU')}</td><td class="num">${money(x.amount||0)}</td></tr>`).join('')+'</tbody></table>';
}
function newClientModal(onSaved){
  const TYPES=['розница','опт','врач','дисконт','подписчик','партнёр'];
  const bg=openModal(`<div class="modal-h"><div><h3>Новый клиент</h3><div class="mh-sub">Карточка сохранится в CRM (D1)</div></div>
    <button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="grid-2b">
      <div><div class="fld"><label>ФИО *</label><input data-nc="name" placeholder="Иванова Анна"></div>
        <div class="fld"><label>Телефон</label><input data-nc="phone" placeholder="+7 7XX XXX XX XX"></div>
        <div class="fld-row"><div class="fld"><label>Дисконтная карта</label><input data-nc="card" placeholder="—"></div>
          <div class="fld"><label>Источник лида</label><input data-nc="source" placeholder="WhatsApp / сайт / рекомендация"></div></div></div>
      <div><div class="fld"><label>Тип клиента</label><div class="chips" data-nc="types">${TYPES.map(t=>`<span class="chip" data-t="${t}">${t}</span>`).join('')}</div></div>
        <div class="fld"><label>Ответственный менеджер</label><input data-nc="mgr" placeholder="${(AUTH.user||{}).name||''}"></div></div>
    </div>
    <div class="modal-foot section-gap" style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn" onclick="closeModal()">Отмена</button>
      <button class="btn primary" data-nc="save">${ic('i-check2','sm')} Сохранить</button>
    </div>
  </div>`,'wide');
  const sel=new Set();
  bg.querySelectorAll('[data-nc=types] .chip').forEach(ch=>ch.addEventListener('click',()=>{
    const t=ch.dataset.t; if(sel.has(t)){sel.delete(t);ch.classList.remove('on');}else{sel.add(t);ch.classList.add('on');}
  }));
  const gv=k=>(bg.querySelector(`[data-nc=${k}]`)?.value||'').trim();
  bg.querySelector('[data-nc=save]').onclick=async()=>{
    const name=gv('name');
    if(!name){ toast('Укажите ФИО','i-info','#dc2626'); return; }
    const btn=bg.querySelector('[data-nc=save]'); btn.disabled=true;
    const body={ name, phone:gv('phone'), card:gv('card'), source:gv('source'), mgr:gv('mgr'), type:[...sel] };
    const r=await api('/api/clients',{method:'POST',body:JSON.stringify(body)});
    btn.disabled=false;
    if(!r.ok){ toast(r.data?.error||'Не удалось сохранить','i-info','#dc2626'); return; }
    closeModal();
    toast('Клиент «'+name+'» создан','i-users');
    if(onSaved)onSaved();
  };
}
function clientModal(cl){
  state.clientTab=0;
  const bg=openModal(clientModalHTML(cl),'wide');
  bg.addEventListener('click',e=>{const t=e.target.closest('.tab');if(t){state.clientTab=+t.dataset.t;$('.modal',bg).innerHTML=clientModalHTML(cl);}});
}
function clientModalHTML(cl){
  const tabs=['Профиль','История покупок · 1С','Переписка','Сделки','Подписка'];
  const clType=Array.isArray(cl.type)?cl.type:[];
  const clLoyalty=Array.isArray(cl.loyalty)?cl.loyalty:[];
  const clHistory=Array.isArray(cl.history)?cl.history:[];
  let body='';
  if(state.clientTab===0){
    body=`<div class="grid-2b">
      <div><div class="fld"><label>ФИО</label><input value="${esc(cl.name||'')}"></div>
      <div class="fld"><label>Телефон</label><input value="${esc(cl.phone||'')}"></div>
      <div class="fld-row"><div class="fld"><label>Дата рождения</label><input value="${esc(cl.dob||'')}"></div><div class="fld"><label>Дисконтная карта</label><input value="${esc(cl.card||'')}"></div></div>
      <div class="fld"><label>Ответственный менеджер</label><input value="${esc(cl.mgr||'')}"></div></div>
      <div><div class="fld"><label>Тип клиента</label><div class="chips">${['розница','опт','врач','дисконт','подписчик','партнёр'].map(t=>`<span class="chip ${clType.includes(t)?'on':''}">${t}</span>`).join('')}</div></div>
      <div class="fld"><label>Метки лояльности</label><div class="chips">${['постоянный','новый','не хочет рассылок','заинтересован в подписке'].map(t=>`<span class="chip ${clLoyalty.includes(t)?'on':''}">${t}</span>`).join('')}</div></div>
      <div class="fld"><label>Источник лида</label><input value="${esc(cl.source||'')}"></div></div>
    </div>`;
  } else if(state.clientTab===1){
    body=`<div class="note blue">${ic('i-sync','sm')} История покупок подтягивается из 1С Listki EG автоматически. LTV: <b>${money(cl.ltv||0)}</b> · сделок: ${cl.deals!=null?cl.deals:'—'}</div>
    ${clHistory.length?`<div class="timeline section-gap">${clHistory.map(h=>tl('#16a34a','i-cart',h.t,h.d)).join('')}</div>`:`<div class="empty section-gap">${ic('i-cart')}<div>Истории покупок пока нет</div></div>`}`;
  } else if(state.clientTab===2){
    body=`<div class="note">${ic('i-chat','sm')} Единая лента: WhatsApp + Instagram Direct + комментарии менеджеров — в одной карточке.</div>
    <div class="timeline section-gap">
      ${tl('var(--wa)','i-phone','«Беру обе щётки, когда заберу?»','WhatsApp · Центр · 10:42')}
      ${tl('#2563eb','i-edit','Менеджер Айгуль: «Уточнила доставку»','внутр. комментарий · 10:45')}
      ${tl('var(--ig)','i-chat','«А подгузники 3 размер есть?»','Instagram · вчера')}
    </div>`;
  } else if(state.clientTab===3){
    const ds=DB.deals.filter(d=>d.client.includes(cl.name.split(' ')[0])||d.client===cl.name);
    body=ds.length?`<table class="tbl"><thead><tr><th>Сделка</th><th>Этап</th><th>Канал</th><th class="num">Сумма</th></tr></thead><tbody>
      ${ds.map(d=>`<tr><td>${d.product}</td><td><span class="tag blue">${d.stage}</span></td><td>${chLabel(d.src)}</td><td class="num">${money(d.sum)}</td></tr>`).join('')}</tbody></table>`
      :`<div class="empty">${ic('i-funnel')}<div>Активных сделок нет</div></div>`;
  } else {
    body=cl.sub?`<div class="list-card"><div class="row"><div class="k-ic" style="width:40px;height:40px;border-radius:11px;background:#7c3aed22;color:#c4b5fd;display:grid;place-items:center">${ic('i-repeat')}</div>
      <div><div style="font-weight:700">Активная подписка</div><div class="muted" style="font-size:12.5px">Авто-заказ набора каждые N месяцев · списание из 1С</div></div><span class="tag green" style="margin-left:auto">активна</span></div>
      <div class="grid-3 section-gap">
        <div><div class="muted" style="font-size:11px">Набор</div><div style="font-weight:600">Полость рта · базовый</div></div>
        <div><div class="muted" style="font-size:11px">Периодичность</div><div style="font-weight:600">3 месяца</div></div>
        <div><div class="muted" style="font-size:11px">Следующая отгрузка</div><div style="font-weight:600">12.08.2026</div></div>
      </div></div>
      <div class="note section-gap">${ic('i-info','sm')} За 7 дней до отгрузки клиент получит напоминание с возможностью приостановить или отменить.</div>`
      :`<div class="empty">${ic('i-repeat')}<div>Подписки нет</div><button class="btn primary" style="margin-top:14px" onclick="toast('Карточка подписки создана','i-repeat','#7c3aed')">${ic('i-plus','sm')} Оформить подписку</button></div>`;
  }
  return `<div class="modal-h"><div class="cell-name"><span class="avatar-xs" style="width:40px;height:40px;font-size:14px;background:${avBg(cl.name)}">${initials(cl.name)}</span>
    <div><h3>${esc(cl.name)}</h3><div class="mh-sub">${esc(cl.phone||'—')} · ${(cl.card&&cl.card!=='—')?'карта '+esc(cl.card):'без карты'}</div></div></div>
    <button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b"><div class="tabs" style="margin-bottom:18px">${tabs.map((t,i)=>`<button class="tab ${state.clientTab===i?'on':''}" data-t="${i}">${t}</button>`).join('')}</div>${body}</div>`;
}

// ---------- INBOX ----------
PAGES.inbox=(c)=>{
  const wrap=el(`<div class="inbox"></div>`);
  // channels
  const chBox=el(`<div class="ib-channels"></div>`);
  chBox.appendChild(el(`<div class="ib-ch-group">WhatsApp · GreenAPI</div>`));
  DB.channels.filter(c=>c.type==='wa').forEach(ch=>chBox.appendChild(chBtn(ch)));
  chBox.appendChild(el(`<div class="ib-ch-group">Instagram Direct</div>`));
  DB.channels.filter(c=>c.type==='ig').forEach(ch=>chBox.appendChild(chBtn(ch)));
  chBox.appendChild(el(`<div class="ib-ch-group">Формы сайтов</div>`));
  DB.channels.filter(c=>c.type==='wp').forEach(ch=>chBox.appendChild(chBtn(ch)));
  wrap.appendChild(chBox);
  // threads
  const thBox=el(`<div class="ib-threads"><div class="ib-search"><div class="fld-in">${ic('i-search','sm')}<input placeholder="Поиск диалога…"></div></div></div>`);
  DB.threads.forEach(t=>{
    const ch=DB.channels.find(x=>x.id===t.ch);
    const row=el(`<button class="thread ${state.thread===t.id?'on':''}" data-t="${t.id}">
      <div class="av" style="background:${t.av}">${initials(t.name)}<span class="src" style="background:${chColor(ch.type)}">${ic(chIcon(ch.type),'sm')}</span></div>
      <div class="ti"><div class="tn">${t.name} ${t.ai?'<span class="tag blue" style="padding:0 6px">AI</span>':''}</div><div class="tm">${t.last}</div></div>
      <div class="tt">${t.time}</div>${t.unread?`<span class="un">${t.unread}</span>`:''}</button>`);
    row.onclick=()=>{state.thread=t.id;renderPage();};thBox.appendChild(row);
  });
  wrap.appendChild(thBox);
  // chat
  const t=DB.threads.find(x=>x.id===state.thread)||DB.threads[0];
  const ch=DB.channels.find(x=>x.id===t.ch);
  const chat=el(`<div class="ib-chat">
    <div class="chat-h"><div class="av" style="background:${t.av}">${initials(t.name)}</div>
      <div><div style="font-weight:700;font-size:14px">${t.name}</div><div class="muted" style="font-size:11.5px">${ch.name} · ${chLabel(ch.type)} ${t.online?'· <span style="color:var(--accent)">онлайн</span>':''}</div></div>
      <div class="spacer"></div>
      <button class="btn sm" onclick="toast('Канал привязан к: '+'${ch.owner}','i-shield','var(--wa)')">${ic('i-shield','sm')} ${ch.owner}</button>
      <button class="btn sm primary" onclick="orderFromChat('${t.name.replace(/'/g,'')}')">${ic('i-cart','sm')} Заказ</button></div>
    <div class="chat-body" id="chatBody">
      <div class="day-sep">Сегодня</div>
      ${t.msgs.map(m=>`<div class="msg ${m.dir==='out'?'out':m.dir==='ai'?'ai':'in'}">${m.t}<div class="mt">${m.tm}</div></div>`).join('')}
    </div>
    <div class="chat-input">
      <button class="icon-btn" title="Файл">${ic('i-paperclip')}</button>
      <div class="ci-box"><input id="msgInput" placeholder="Сообщение в ${chLabel(ch.type)}…"><button class="icon-btn" style="width:30px;height:30px;border:none;background:none" title="Голосовое">${ic('i-mic','sm')}</button></div>
      <button class="btn primary" onclick="sendMsg('${t.id}')">${ic('i-send','sm')}</button>
    </div></div>`);
  wrap.appendChild(chat);
  // context
  const cl=DB.clients.find(x=>t.name.includes(x.name.split(' ')[0]));
  wrap.appendChild(el(`<div class="ib-context">
    <div class="ctx-card"><h4>Клиент</h4>
      <div class="ctx-row"><span>Имя</span><b>${t.name}</b></div>
      <div class="ctx-row"><span>Канал</span><b>${ch.name}</b></div>
      <div class="ctx-row"><span>Менеджер</span><b>${ch.owner}</b></div>
      ${cl?`<div class="ctx-row"><span>Тип</span><b>${cl.type[0]}</b></div><div class="ctx-row"><span>LTV (из 1С)</span><b>${money(cl.ltv)}</b></div>`:'<div class="ctx-row"><span>Статус</span><b>Новый лид</b></div>'}
    </div>
    <div class="ctx-card"><h4>Быстрый заказ · остатки 1С</h4>
      ${DB.products.slice(0,3).map(p=>`<div class="ctx-row"><span>${p.name.slice(0,22)}…</span><b>${p.stock} шт</b></div>`).join('')}
      <button class="btn sm primary" style="width:100%;justify-content:center;margin-top:11px" onclick="orderFromChat('${t.name.replace(/'/g,'')}')">${ic('i-cart','sm')} Собрать заказ</button>
    </div>
    ${t.ai?`<div class="ctx-card"><h4>AI-агент</h4><div class="note blue" style="margin:0">${ic('i-bot','sm')} Ночью отвечал AI. Эскалировано консультанту утром — ждёт ответа.</div></div>`:''}
    <div class="ctx-card"><h4>Метки</h4><div class="chips">${['постоянный','подписка','no-рассылки','опт'].map(m=>`<span class="chip">${m}</span>`).join('')}</div></div>
  </div>`));
  c.appendChild(wrap);
  const cb=$('#chatBody');if(cb)cb.scrollTop=cb.scrollHeight;
};
function chBtn(ch){
  const b=el(`<button class="ib-ch ${DB.threads.find(t=>t.id===state.thread)?.ch===ch.id?'on':''}">
    <span class="ci" style="background:${chColor(ch.type)}22;color:${chColor(ch.type)}">${ic(chIcon(ch.type),'sm')}</span>
    <span class="cn">${ch.name}</span>${ch.unread?`<span class="cb">${ch.unread}</span>`:''}</button>`);
  b.onclick=()=>{const t=DB.threads.find(t=>t.ch===ch.id);if(t){state.thread=t.id;renderPage();}else toast('Нет активных диалогов в этом канале','i-info');};
  return b;
}
function sendMsg(tid){
  const inp=$('#msgInput');if(!inp||!inp.value.trim())return;
  const t=DB.threads.find(x=>x.id===tid);t.msgs.push({dir:'out',t:inp.value,tm:'сейчас'});t.last=inp.value;
  inp.value='';renderPage();toast('Отправлено в WhatsApp (GreenAPI)','i-send','var(--wa)');
}
function orderFromChat(name){
  openModal(`<div class="modal-h"><div><h3>Заказ · ${name}</h3><div class="mh-sub">товары из каталога 1С · остатки в реальном времени</div></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    ${DB.products.slice(0,4).map(p=>`<div class="ob-item"><div class="ob-n">${p.name}<div class="muted2" style="font-size:11px">${p.sku} · ${p.entity} · остаток ${p.stock>0?p.stock+' шт':'<span style="color:var(--red)">нет</span>'}</div></div><input class="ob-q" value="${p.id==='p1'?2:0}" ${p.stock===0?'disabled':''}><span class="ob-rm">${money(p.price)}</span></div>`).join('')}
    <div class="fld section-gap"><label>Промокод</label><select><option>— нет —</option>${DB.promos.filter(p=>p.status==='активна').map(p=>`<option>${p.code} (−${p.disc}%)</option>`).join('')}</select></div>
    <div class="ob-tot grand"><span>Итого</span><b>${money(960)}</b></div>
  </div>
  <div class="modal-f"><button class="btn" onclick="closeModal()">Отмена</button>
    <button class="btn primary" onclick="closeModal();toast('Заказ создан в CRM → отправлен в 1С как «заказ покупателя»','i-cart')">${ic('i-cart','sm')} Передать в 1С</button></div>`,'wide');
}

// ---------- ORDERS ----------
PAGES.orders=(c)=>{
  const orders=[
    ['#1078','Динара Жумабекова','Pampers Premium 3',5200,'wa','В 1С · накладная','green'],
    ['#1075','Салтанат Орозова','Набор «Семья»',4200,'wa','Собран','blue'],
    ['#1071','Гульнара Осмонова','Микс гигиена',6200,'ig','Доставка','amber'],
    ['#B-205','Аптека «Шифо» (опт)','Опт микс',142000,'wa','Очередь в 1С (1С недоступен)','red'],
    ['#1055','Эркин Текебаев','Шампунь ×4',1730,'wp','Закрыт','green'],
    ['#B-201','Клиника «Авиценна»','Маски, антисептик',96500,'wa','Оплата','violet'],
  ];
  c.appendChild(el(`<div class="toolbar">
    <select class="sel"><option>Все статусы</option><option>В 1С</option><option>Очередь</option><option>Доставка</option></select>
    <select class="sel"><option>Все юр.лица</option><option>ТОО</option><option>ИП</option></select>
    <div class="spacer"></div>
    <div class="row"><span class="tag green">${ic('i-sync','sm')} 1С синхронизирован 1 мин назад</span></div>
  </div>`));
  c.appendChild(el(`<div class="note amber section-gap" style="margin-top:0">${ic('i-info','sm')} Заказ #B-205 в очереди: 1С временно недоступен. После восстановления — автоматическая досинхронизация. Магазины при этом продолжают работать.</div>`));
  const panel=el(`<div class="panel section-gap"><table class="tbl"><thead><tr><th>Заказ</th><th>Клиент</th><th>Состав</th><th>Канал</th><th class="num">Сумма</th><th>Статус 1С</th></tr></thead><tbody>
    ${orders.map(o=>`<tr class="clickable"><td><b>${o[0]}</b></td><td>${o[1]}</td><td class="muted">${o[2]}</td><td><span class="tag ${o[4]==='wa'?'wa':o[4]==='ig'?'ig':'amber'}">${chLabel(o[4])}</span></td><td class="num">${money(o[3])}</td><td><span class="tag ${o[6]}">${o[5]}</span></td></tr>`).join('')}
  </tbody></table></div>`);
  panel.querySelectorAll('tr.clickable').forEach(tr=>tr.onclick=()=>toast('Карточка заказа · детализация по товарам и журнал обмена с 1С','i-cart'));
  c.appendChild(panel);
};

// ---------- CATALOG ----------
PAGES.catalog=(c)=>{
  const tbar=el(`<div class="toolbar">
    <div class="fld-in">${ic('i-search','sm')}<input placeholder="Поиск по названию, коду, артикулу, штрихкоду…" data-cat="q"></div>
    <div class="spacer"></div>
    <span class="tag green" data-cat="cnt">${ic('i-sync','sm')} зеркало 1С</span>
  </div>`);
  c.appendChild(tbar);
  const panel=el(`<div class="panel"><table class="tbl"><thead><tr><th>Код</th><th>Товар</th><th>Артикул</th><th>Категория</th><th>Штрихкод</th><th class="num">Цена</th><th class="num">Остаток</th></tr></thead><tbody><tr><td colspan="7" class="muted2" style="font-size:13px">Загрузка…</td></tr></tbody></table></div>`);
  const tb=panel.querySelector('tbody'), cnt=tbar.querySelector('[data-cat=cnt]'), qInput=tbar.querySelector('[data-cat=q]');
  const stCell=(s)=> s>0 ? (s<15?'<span class="tag amber">'+s+'</span>':s) : '<span class="muted2">0</span>';
  function rowsLive(items){ return items.map(p=>`<tr><td class="muted2">${esc(p.code||'')}</td><td>${esc(p.name||'')}</td>
    <td class="muted">${esc(p.article||'—')}</td><td class="muted">${esc(p.category||'—')}</td>
    <td class="muted2">${esc(p.barcode||'—')}</td><td class="num">${p.price!=null?money(p.price):'—'}</td><td class="num">${stCell(p.stock||0)}</td></tr>`).join(''); }
  function rowsDemo(){ return DB.products.map(p=>`<tr><td class="muted2">${esc(p.sku)}</td><td>${esc(p.name)}</td>
    <td class="muted">—</td><td class="muted">${esc(p.cat)}</td><td class="muted2">—</td><td class="num">${money(p.price)}</td>
    <td class="num">${p.stock===0?'<span class="tag red">нет</span>':p.stock<15?'<span class="tag amber">'+p.stock+'</span>':p.stock}</td></tr>`).join(''); }
  const pager=el(`<div class="row section-gap" style="justify-content:center;gap:12px" hidden>
    <button class="btn sm" data-pg="prev">‹ Назад</button>
    <span class="muted" style="font-size:13px" data-pg="info"></span>
    <button class="btn sm" data-pg="next">Вперёд ›</button></div>`);
  const pgInfo=pager.querySelector('[data-pg=info]'), pgPrev=pager.querySelector('[data-pg=prev]'), pgNext=pager.querySelector('[data-pg=next]');
  const PAGE=100; let offset=0, total=0;
  function renderPager(isDemo,shown){
    if(isDemo||total<=PAGE){ pager.hidden=true; return; }
    pager.hidden=false; pgInfo.textContent=(offset+1)+'–'+(offset+shown)+' из '+total;
    pgPrev.disabled=offset<=0; pgNext.disabled=offset+PAGE>=total;
  }
  async function load(){
    const q=qInput.value.trim();
    const r=await api('/api/1c/products?limit='+PAGE+'&offset='+offset+(q?('&q='+encodeURIComponent(q)):''));
    if(!r.ok){
      cnt.innerHTML=ic('i-sync','sm')+' '+(r.status===403?'демо · нужен доступ':r.status===401?'демо · войдите':'демо · нет связи');
      tb.innerHTML=rowsDemo(); renderPager(true,0); return;
    }
    const items=r.data.items||[]; total=r.data.total!=null?r.data.total:items.length;
    cnt.innerHTML=ic('i-sync','sm')+' '+total+' SKU · зеркало 1С';
    tb.innerHTML=items.length?rowsLive(items):'<tr><td colspan="7" class="muted2" style="font-size:13px;padding:18px">Ничего не найдено</td></tr>';
    renderPager(false,items.length);
  }
  let qt=null;
  qInput.addEventListener('input',()=>{clearTimeout(qt);qt=setTimeout(()=>{offset=0;load();},300);});
  pgPrev.onclick=()=>{ if(offset>0){offset=Math.max(0,offset-PAGE);load();$('#content').scrollTop=0;} };
  pgNext.onclick=()=>{ if(offset+PAGE<total){offset+=PAGE;load();$('#content').scrollTop=0;} };
  load();
  c.appendChild(panel); c.appendChild(pager);
  c.appendChild(el(`<div class="note blue section-gap">${ic('i-info','sm')} Товары и остатки зеркалятся из 1С (синхронизация раз в 30 мин). Цены, цвет и юр.лицо появятся, когда добавим соответствующие регистры в выгрузку 1С.</div>`));
};

// ---------- ПРОДАЖИ (зеркало регистра «Продажи» 1С) ----------
PAGES.sales=(c)=>{
  const tbar=el(`<div class="toolbar">
    <div class="seg" data-sl="range">
      <button data-d="30">30 дней</button>
      <button class="on" data-d="90">90 дней</button>
      <button data-d="365">Год</button>
      <button data-d="0">Всё</button>
    </div>
    <div class="fld-in">${ic('i-clock','sm')}<input type="date" data-sl="from" title="С даты"></div>
    <div class="fld-in">${ic('i-clock','sm')}<input type="date" data-sl="to" title="По дату"></div>
    <button class="btn sm" data-sl="apply">Показать</button>
    <div class="spacer"></div>
    <span class="tag green" data-sl="cnt">${ic('i-sync','sm')} зеркало 1С</span>
  </div>`);
  c.appendChild(tbar);
  const cards=el(`<div class="cards-row"></div>`);
  const panels=el(`<div class="grid-2b section-gap"></div>`);
  const panels2=el(`<div class="grid-2b section-gap"></div>`);
  c.appendChild(cards); c.appendChild(panels); c.appendChild(panels2);
  c.appendChild(el(`<div class="note blue section-gap">${ic('i-info','sm')} Продажи зеркалятся из регистра «Продажи» 1С (отчёты о розничных продажах). Прибыль = выручка − себестоимость. Продавцы — из справочников 1С, выручка по организациям — по юр.лицу продажи. Синхронизация раз в 30 мин.</div>`));
  const fromI=tbar.querySelector('[data-sl=from]'), toI=tbar.querySelector('[data-sl=to]'), cnt=tbar.querySelector('[data-sl=cnt]'), applyB=tbar.querySelector('[data-sl=apply]');
  const fmtN=(n)=>(n||0).toLocaleString('ru-RU');
  function cardsHTML(t){
    return miniStat('i-money','#10b981','Выручка',money(t.revenue||0))
      + miniStat('i-chart','#2563eb','Прибыль · '+(t.margin||0)+'%',money(t.profit||0))
      + miniStat('i-cart','#7c3aed','Продано позиций',fmtN(t.qty||0))
      + miniStat('i-doc','#db2777','Средний документ',money(t.avg||0));
  }
  function topHTML(rows){
    const body=rows.length?rows.map((p,i)=>`<tr><td class="muted2">${i+1}</td><td>${esc(p.name||'—')}</td><td class="num">${fmtN(p.qty)}</td><td class="num">${money(p.revenue||0)}</td><td class="num">${money(p.profit||0)}</td></tr>`).join(''):'<tr><td colspan="5" class="muted2" style="padding:16px">Нет данных</td></tr>';
    return `<div class="panel"><div class="panel-h"><h3>${ic('i-box','sm')} Топ товаров</h3></div><table class="tbl"><thead><tr><th>#</th><th>Товар</th><th class="num">Кол-во</th><th class="num">Выручка</th><th class="num">Прибыль</th></tr></thead><tbody>${body}</tbody></table></div>`;
  }
  function sellersHTML(rows){
    const body=rows.length?rows.map(s=>`<tr><td><div class="cell-name"><span class="avatar-xs" style="background:${avBg(s.name||s.key||'?')}">${initials(s.name||'П')}</span><div>${esc(s.name||('продавец '+String(s.key||'').slice(0,8)))}</div></div></td><td class="num">${money(s.revenue||0)}</td><td class="num">${money(s.profit||0)}</td><td class="num">${fmtN(s.qty)}</td></tr>`).join(''):'<tr><td colspan="4" class="muted2" style="padding:16px">Нет данных</td></tr>';
    return `<div class="panel"><div class="panel-h"><h3>${ic('i-target','sm')} KPI продавцов</h3></div><table class="tbl"><thead><tr><th>Продавец</th><th class="num">Выручка</th><th class="num">Прибыль</th><th class="num">Позиций</th></tr></thead><tbody>${body}</tbody></table></div>`;
  }
  function orgHTML(rows){
    const body=rows.length?rows.map(o=>`<tr><td>${esc(o.name||'—')}</td><td class="num">${money(o.revenue||0)}</td><td class="num">${money(o.profit||0)}</td></tr>`).join(''):'<tr><td colspan="3" class="muted2" style="padding:16px">Нет данных</td></tr>';
    return `<div class="panel"><div class="panel-h"><h3>${ic('i-shield','sm')} Выручка по организациям</h3></div><table class="tbl"><thead><tr><th>Организация</th><th class="num">Выручка</th><th class="num">Прибыль</th></tr></thead><tbody>${body}</tbody></table></div>`;
  }
  function storeHTML(rows){
    const named=rows.some(s=>s.name);
    const body=rows.length?rows.map((s,i)=>`<tr><td>${esc(s.name||('Магазин '+(i+1)))}</td><td class="num">${money(s.revenue||0)}</td><td class="num">${fmtN(s.docs)}</td></tr>`).join(''):'<tr><td colspan="3" class="muted2" style="padding:16px">Нет данных</td></tr>';
    const hint=(!named&&rows.length)?`<div class="muted2" style="padding:8px 14px;font-size:11px">${ic('i-info','sm')} Названия магазинов появятся после добавления справочника «Склады» в выгрузку 1С OData</div>`:'';
    return `<div class="panel"><div class="panel-h"><h3>${ic('i-truck','sm')} Выручка по магазинам</h3></div><table class="tbl"><thead><tr><th>Магазин</th><th class="num">Выручка</th><th class="num">Док-тов</th></tr></thead><tbody>${body}</tbody></table>${hint}</div>`;
  }
  function demo(){
    cards.innerHTML=cardsHTML({revenue:2480000,profit:744000,margin:30,qty:3184,avg:82000});
    panels.innerHTML=topHTML([
      {name:'Ирригатор Revyline RL-700',qty:42,revenue:378000,profit:132000},
      {name:'Зубная паста R.O.C.S. Bionica',qty:210,revenue:168000,profit:58000},
      {name:'Ополаскиватель Listerine 500мл',qty:156,revenue:124800,profit:41000},
      {name:'Зубные нити Revyline Expert',qty:198,revenue:99000,profit:38000},
      {name:'Щётка электрическая RL-010',qty:21,revenue:94500,profit:31000},
    ])+sellersHTML([
      {name:'Айгерим Сапарова',revenue:920000,profit:280000,qty:1180},
      {name:'Динара Жумабаева',revenue:800000,profit:236000,qty:1024},
      {name:'Бекзат Орынбеков',revenue:760000,profit:228000,qty:980},
    ]);
    panels2.innerHTML=orgHTML([
      {name:'ИП Каменев В.И.',revenue:1860000,profit:540000},
      {name:'ИП Сергеева Л.С.',revenue:740000,profit:210000},
    ])+storeHTML([
      {name:'Магазин «Центр»',revenue:980000,docs:1240},
      {name:'Магазин «Восток»',revenue:760000,docs:980},
    ]);
  }
  async function load(){
    cards.innerHTML='<div class="muted2" style="padding:10px">Загрузка…</div>'; panels.innerHTML=''; panels2.innerHTML='';
    const qs=[]; if(fromI.value)qs.push('from='+fromI.value); if(toI.value)qs.push('to='+toI.value);
    const r=await api('/api/1c/sales/summary'+(qs.length?('?'+qs.join('&')):''));
    if(!r.ok){ cnt.innerHTML=ic('i-sync','sm')+' '+(r.status===403?'демо · нужен доступ':r.status===401?'демо · войдите':'демо · нет связи'); demo(); return; }
    const d=r.data, t=d.totals||{};
    cards.innerHTML=cardsHTML(t);
    panels.innerHTML=topHTML(d.topProducts||[])+sellersHTML(d.bySeller||[]);
    panels2.innerHTML=orgHTML(d.byOrg||[])+storeHTML(d.byStore||[]);
    if(t.docs){ cnt.innerHTML=ic('i-sync','sm')+' '+(t.dmin||'')+' — '+(t.dmax||'')+' · 1С'; if(!fromI.value&&t.dmin)fromI.value=t.dmin; if(!toI.value&&t.dmax)toI.value=t.dmax; }
    else { cnt.innerHTML=ic('i-sync','sm')+' ожидание данных · запустите синхронизацию'; }
  }
  const seg=tbar.querySelector('[data-sl=range]');
  const ymd=(d)=>d.toISOString().slice(0,10);
  function setRange(days){
    seg.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.d===days));
    if(days){ toI.value=ymd(new Date()); fromI.value=ymd(new Date(Date.now()-days*864e5)); }
    else { fromI.value=''; toI.value=''; }
    load();
  }
  seg.querySelectorAll('button').forEach(b=>b.onclick=()=>setRange(+b.dataset.d));
  applyB.onclick=()=>{ seg.querySelectorAll('button').forEach(b=>b.classList.remove('on')); load(); };
  setRange(90);
};

// ---------- MARKETING ----------
PAGES.marketing=(c)=>{
  c.appendChild(el(`<div class="cards-row">
    ${miniStat('i-tag','#10b981','Активных промокодов','4')}
    ${miniStat('i-users','#2563eb','Клиентов по акциям','277')}
    ${miniStat('i-money','#db2777','Потери от скидок',money(168000))}
    ${miniStat('i-chart','#7c3aed','Выручка с акций',money(589000))}
  </div>`));
  c.appendChild(el(`<div class="toolbar section-gap">
    <div class="seg"><button class="on">Промокоды</button><button onclick="toast('Раздел акций','i-tag')">Акции</button></div>
    <div class="spacer"></div>
    <button class="btn primary" onclick="newPromo()">${ic('i-plus','sm')} Промокод</button>
  </div>`));
  const panel=el(`<div class="panel"><table class="tbl"><thead><tr><th>Код</th><th>Тип</th><th>Скидка</th><th>Использован</th><th>Блогер</th><th class="num">Выручка</th><th>Статус</th></tr></thead><tbody>
    ${DB.promos.map(p=>`<tr class="clickable"><td><b>${p.code}</b></td><td><span class="tag ${p.type==='блогерский код'?'pink':p.type==='сезонная'?'cyan':p.type==='персональный'?'violet':'blue'}">${p.type}</span></td>
      <td>−${p.disc}%</td><td>${p.used}</td><td class="muted">${p.blogger||'—'}</td><td class="num">${money(p.revenue)}</td>
      <td><span class="tag ${p.status==='активна'?'green':'red'}">${p.status}</span></td></tr>`).join('')}
  </tbody></table></div>`);
  panel.querySelectorAll('tr.clickable').forEach((tr,i)=>tr.onclick=()=>promoModal(DB.promos[i]));
  c.appendChild(panel);
};
const miniStat=(i,col,lbl,val)=>`<div class="kpi"><div class="k-ic" style="background:${col}22;color:${col}">${ic(i)}</div><div class="k-lbl">${lbl}</div><div class="k-val">${val}</div></div>`;
function promoModal(p){openModal(`<div class="modal-h"><div><h3>Промокод ${p.code}</h3><div class="mh-sub">${p.type} · −${p.disc}%</div></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b"><div class="cards-row">
    ${miniStat('i-users','#10b981','Клиентов',p.used)}
    ${miniStat('i-money','#2563eb','Средний чек',money(p.revenue/p.used))}
    ${miniStat('i-chart','#7c3aed','Выручка',money(p.revenue))}
  </div>
  <div class="fld section-gap"><label>Срок действия</label><input value="${p.until}"></div>
  ${p.blogger?`<div class="note">${ic('i-star','sm')} Привязан к блогеру ${p.blogger}. KPI считается в разделе «Блогеры».</div>`:''}
  </div><div class="modal-f"><button class="btn" onclick="closeModal()">Закрыть</button></div>`);}
function newPromo(){openModal(`<div class="modal-h"><div><h3>Новый промокод</h3></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b"><div class="fld-row"><div class="fld"><label>Код</label><input placeholder="LETO20"></div><div class="fld"><label>Скидка %</label><input value="10"></div></div>
  <div class="fld"><label>Тип</label><select><option>общая акция</option><option>блогерский код</option><option>персональный</option><option>сезонная</option></select></div>
  <div class="fld"><label>Срок действия</label><input type="date"></div></div>
  <div class="modal-f"><button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" onclick="closeModal();toast('Промокод создан')">Создать</button></div>`);}

// ---------- BLOGGERS ----------
PAGES.bloggers=(c)=>{
  c.appendChild(el(`<div class="toolbar"><div class="page-sub">Партнёры по маркетингу · KPI: переходы → продажи → ROI</div><div class="spacer"></div>
    <button class="btn primary" onclick="toast('Карточка блогера создана','i-star')">${ic('i-plus','sm')} Блогер</button></div>`));
  const grid=el(`<div class="grid-3"></div>`);
  DB.bloggers.forEach(b=>{
    grid.appendChild(el(`<div class="list-card">
      <div class="row"><span class="avatar-xs" style="width:42px;height:42px;font-size:14px;background:${avBg(b.nick)}">${initials(b.name)}</span>
        <div><div style="font-weight:700">${b.nick}</div><div class="muted" style="font-size:12px">${b.name} · ${b.topic}</div></div>
        <span class="tag pink" style="margin-left:auto">${b.code}</span></div>
      <div class="grid-2b section-gap" style="gap:11px">
        <div><div class="muted" style="font-size:11px">Охват</div><div style="font-weight:700">${b.reach}</div></div>
        <div><div class="muted" style="font-size:11px">Переходы</div><div style="font-weight:700">${b.clicks}</div></div>
        <div><div class="muted" style="font-size:11px">Продажи</div><div style="font-weight:700">${b.sales}</div></div>
        <div><div class="muted" style="font-size:11px">Средний чек</div><div style="font-weight:700">${money(b.avg)}</div></div>
      </div>
      <div class="row section-gap" style="justify-content:space-between;padding-top:12px;border-top:1px solid var(--line)">
        <div><div class="muted" style="font-size:11px">ROI</div><div style="font-weight:800;color:var(--accent2);font-size:18px">${b.roi}</div></div>
        <div style="text-align:right"><div class="muted" style="font-size:11px">Выплачено</div><div style="font-weight:700">${money(b.paid)}</div></div>
      </div></div>`));
  });
  c.appendChild(grid);
};

// ---------- DOCTORS (врачи-партнёры · промокоды · кэшбек) ----------
PAGES.doctors=(c)=>{
  let rate=10; // ставка кэшбека, %
  const tbar=el(`<div class="toolbar">
    <div class="fld-in">${ic('i-search','sm')}<input placeholder="Поиск по ФИО, промокоду, телефону…" data-dr="q"></div>
    <div class="fld-in" title="Ставка кэшбека от выручки">${ic('i-gift','sm')}<input type="number" min="0" max="100" step="1" value="10" style="width:46px" data-dr="rate">%</div>
    <button class="btn sm" data-dr="journal">${ic('i-gift','sm')} Журнал кэшбека</button>
    <div class="spacer"></div>
    <span class="ph-sub" data-dr="cnt"></span>
  </div>`);
  const cards=el(`<div class="cards-row section-gap"></div>`);
  const panel=el(`<div class="panel section-gap"><table class="tbl"><thead><tr>
    <th>Промокод</th><th>Врач</th><th>Телефон</th><th>Город</th><th class="num">Выручка</th><th class="num">Продаж</th><th class="num">Кэшбек</th></tr></thead><tbody><tr><td colspan="7" class="muted2" style="font-size:13px;padding:16px">Загрузка…</td></tr></tbody></table></div>`);
  const pager=el(`<div class="row section-gap" style="justify-content:center;gap:12px" hidden>
    <button class="btn sm" data-pg="prev">‹ Назад</button><span class="muted" style="font-size:13px" data-pg="info"></span><button class="btn sm" data-pg="next">Вперёд ›</button></div>`);
  c.appendChild(tbar); c.appendChild(cards); c.appendChild(panel); c.appendChild(pager);
  c.appendChild(el(`<div class="note blue section-gap">${ic('i-info','sm')} Врачи — контрагенты групп «Врач партнер» из 1С. Продажи привязаны к врачу через контрагента в чеке (промокод = код 1С). Кэшбек считается от выручки по выбранной ставке; реальные правила по брендам уточним.</div>`));
  const tb=panel.querySelector('tbody'), cnt=tbar.querySelector('[data-dr=cnt]'), qI=tbar.querySelector('[data-dr=q]'), rateI=tbar.querySelector('[data-dr=rate]');
  tbar.querySelector('[data-dr=journal]').onclick=()=>cashbackJournalModal();
  const pgInfo=pager.querySelector('[data-pg=info]'), pgPrev=pager.querySelector('[data-pg=prev]'), pgNext=pager.querySelector('[data-pg=next]');
  const PAGE=100; let offset=0, total=0, lastSummary=null, lastItems=[], demoMode=false;
  const cb=(rev)=>Math.round((rev||0)*rate/100);
  function renderCards(s){
    cards.innerHTML =
      miniStat('i-tooth','#10b981','Врачей-партнёров',(s.doctors||0).toLocaleString('ru-RU'))
      + miniStat('i-users','#2563eb','С продажами',(s.withSales||0).toLocaleString('ru-RU'))
      + miniStat('i-money','#7c3aed','Выручка по врачам',money(s.revenue||0))
      + miniStat('i-gift','#db2777','Кэшбек ('+rate+'%)',money(cb(s.revenue)));
  }
  function renderTable(){
    if(demoMode){
      tb.innerHTML=(DB.doctors||[]).map(d=>`<tr class="clickable" data-id="${d.id}"><td><span class="tag pink">${esc(d.code)}</span></td>
        <td><div class="cell-name"><span class="avatar-xs" style="background:${avBg(d.name)}">${initials(d.name)}</span><div>${esc(d.name)}</div></div></td>
        <td>${esc(d.phone||'—')}</td><td class="muted">${esc(d.clinic||'—')}</td><td class="num">${money(d.revenue)}</td><td class="num">${d.patients}</td><td class="num">${money(d.cashbackSum)}</td></tr>`).join('');
      tb.querySelectorAll('tr.clickable').forEach(tr=>tr.onclick=()=>doctorModal(DB.doctors.find(x=>x.id===tr.dataset.id)));
      return;
    }
    if(!lastItems.length){ tb.innerHTML='<tr><td colspan="7" class="muted2" style="font-size:13px;padding:16px">Ничего не найдено</td></tr>'; return; }
    tb.innerHTML=lastItems.map(x=>`<tr class="clickable"><td><span class="tag pink">${esc(x.code||'—')}</span></td>
      <td><div class="cell-name"><span class="avatar-xs" style="background:${avBg(x.name||'?')}">${initials(x.name||'?')}</span><div>${esc(x.name||'—')}</div></div></td>
      <td>${esc(x.phone||'—')}</td><td class="muted">${esc(x.city||'—')}</td>
      <td class="num">${x.revenue?money(x.revenue):'<span class="muted2">—</span>'}</td>
      <td class="num">${x.docs||'<span class="muted2">0</span>'}</td>
      <td class="num">${x.revenue?money(cb(x.revenue)):'<span class="muted2">—</span>'}</td></tr>`).join('');
    [...tb.querySelectorAll('tr.clickable')].forEach((tr,i)=>tr.onclick=()=>doctorModalLive(lastItems[i],rate));
  }
  function renderPager(shown){ if(demoMode||total<=PAGE){pager.hidden=true;return;} pager.hidden=false; pgInfo.textContent=(offset+1)+'–'+(offset+shown)+' из '+total; pgPrev.disabled=offset<=0; pgNext.disabled=offset+PAGE>=total; }
  async function load(){
    const q=qI.value.trim();
    const r=await api('/api/1c/doctors?limit='+PAGE+'&offset='+offset+(q?('&q='+encodeURIComponent(q)):''));
    if(!r.ok){ demoMode=true; cnt.textContent=r.status===403?'демо · нужен доступ':r.status===401?'демо · войдите':'демо · нет связи';
      const docs=DB.doctors||[]; renderCards({doctors:docs.length,withSales:docs.length,revenue:docs.reduce((a,d)=>a+d.revenue,0)}); renderTable(); renderPager(0); return; }
    demoMode=false; const d=r.data; total=d.total||0; lastSummary=d.summary||{}; lastItems=d.items||[];
    cnt.textContent=total+' '+plural(total,'врач','врача','врачей')+' · 1С';
    renderCards(lastSummary); renderTable(); renderPager(lastItems.length);
  }
  let qt=null; qI.addEventListener('input',()=>{clearTimeout(qt);qt=setTimeout(()=>{offset=0;load();},300);});
  rateI.addEventListener('input',()=>{ rate=Math.max(0,Math.min(100,+rateI.value||0)); if(lastSummary)renderCards(lastSummary); renderTable(); });
  pgPrev.onclick=()=>{ if(offset>0){offset=Math.max(0,offset-PAGE);load();$('#content').scrollTop=0;} };
  pgNext.onclick=()=>{ if(offset+PAGE<total){offset+=PAGE;load();$('#content').scrollTop=0;} };
  window.__reloadDoctors=load; // для авто-обновления после изменений кэшбека
  load();
};
function doctorModalLive(d,rate){
  const remainingBase=Math.max(0,(d.revenue||0)-(d.cb_base||0));
  const cbSum=Math.round(remainingBase*(rate||0)/100); // к начислению (остаток)
  const accruedAmt=Math.round(d.cb_amount||0);          // уже начислено
  const cbKpiInner=(rem,acc)=>`<div class="k-ic" style="background:#db277722;color:#db2777">${ic('i-gift')}</div><div class="k-lbl">К начислению · ${rate}%</div><div class="k-val">${money(rem)}</div>${acc>0?`<div class="k-sub">уже начислено ${money(acc)}</div>`:''}`;
  openModal(`<div class="modal-h"><div class="cell-name"><span class="avatar-xs" style="width:40px;height:40px;font-size:14px;background:${avBg(d.name||'?')}">${initials(d.name||'?')}</span>
    <div><h3>${esc(d.name||'—')}</h3><div class="mh-sub">Промокод ${esc(d.code||'—')} · ${esc(d.city||'')}</div></div></div>
    <button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="cards-row">
      ${miniStat('i-money','#10b981','Выручка',money(d.revenue||0))}
      ${miniStat('i-cart','#7c3aed','Продаж',(d.docs||0).toLocaleString('ru-RU'))}
      ${miniStat('i-box','#2563eb','Позиций',(d.qty||0).toLocaleString('ru-RU'))}
      <div class="kpi" id="cbKpi">${cbKpiInner(cbSum,accruedAmt)}</div>
    </div>
    <div class="grid-2b section-gap">
      <div class="fld"><label>Промокод (код 1С)</label><input value="${esc(d.code||'')}" readonly></div>
      <div class="fld"><label>Телефон</label><input value="${esc(d.phone||'')}" readonly></div>
      <div class="fld"><label>Город</label><input value="${esc(d.city||'')}" readonly></div>
      <div class="fld"><label>Дата рождения</label><input value="${esc((d.dob||'').slice(0,10))}" readonly></div>
    </div>
    <div class="panel section-gap" style="margin-top:14px"><div class="panel-h"><h3>${ic('i-cart','sm')} Продажи по врачу · 1С</h3><span class="ph-sub" id="docHistSub" style="margin-left:auto">загрузка…</span></div>
      <div id="docHist"><div class="muted2" style="padding:14px;font-size:13px">Загрузка…</div></div></div>
  </div>
  <div class="modal-f">
    <button class="btn" id="cbReportBtn">${ic('i-doc','sm')} Выгрузить отчёт</button>
    <button class="btn primary" id="cbAccrueBtn"${cbSum>0?'':' disabled'}>${ic(cbSum>0?'i-gift':'i-check2','sm')} ${cbSum>0?('Начислить кэшбек '+money(cbSum)):'Кэшбек начислен'}</button>
  </div>`,'wide');
  const cbb=document.getElementById('cbAccrueBtn');
  if(cbb && cbSum>0) cbb.onclick=async()=>{
    cbb.disabled=true; cbb.textContent='Начисляю…';
    const r=await api('/api/1c/doctors/cashback',{method:'POST',body:JSON.stringify({doctor_ref:d.ref_key,rate})});
    if(!r.ok){ cbb.disabled=false; cbb.innerHTML=ic('i-gift','sm')+' Начислить кэшбек '+money(cbSum); toast((r.data&&r.data.error)||'Не удалось начислить кэшбек','i-x','#dc2626'); return; }
    cbb.disabled=true; cbb.classList.remove('primary'); cbb.innerHTML=ic('i-check2','sm')+' Начислено '+money(r.data.amount||0);
    const k=document.getElementById('cbKpi'); if(k) k.innerHTML=cbKpiInner(0, accruedAmt+(r.data.amount||0));
    toast('Кэшбек '+money(r.data.amount||0)+' начислен · смотри «Журнал кэшбека»','i-gift','#db2777');
    if(window.__reloadDoctors) window.__reloadDoctors();
  };
  const rep=document.getElementById('cbReportBtn'); if(rep) rep.onclick=()=>exportDoctorReport(d);
  loadDoctorHistory(d.ref_key);
}
async function exportDoctorReport(d){
  toast('Готовлю отчёт…','i-doc');
  const r=await api('/api/1c/sales?contractor='+encodeURIComponent(d.ref_key)+'&limit=500');
  const it=(r.ok&&r.data.items)?r.data.items:[];
  const head=[['Врач',d.name||''],['Промокод',d.code||''],['Город',d.city||''],['Выручка (сом)',Math.round(d.revenue||0)],['Продаж',d.docs||0],['']];
  const body=[['Дата','Товар','Кол-во','Сумма (сом)']].concat(it.map(x=>[(x.date||'').slice(0,10),x.name||'',x.qty||0,Math.round(x.amount||0)]));
  const csv='﻿'+head.concat(body).map(row=>row.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(';')).join('\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); a.download='Отчёт_врач_'+(d.code||'врач')+'.csv'; a.click(); URL.revokeObjectURL(a.href);
  toast('Отчёт по врачу выгружен (CSV)','i-doc');
}
async function cashbackJournalModal(){
  openModal(`<div class="modal-h"><div><h3>Журнал кэшбека врачам</h3><div class="mh-sub">начисления и выплаты</div></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
    <div class="modal-b" id="cbBody"><div class="muted2" style="padding:14px;font-size:13px">Загрузка…</div></div>
    <div class="modal-f"><button class="btn" id="cbExport">${ic('i-doc','sm')} Экспорт CSV</button><button class="btn" onclick="closeModal()">Закрыть</button></div>`,'wide');
  renderCashbackJournal();
}
async function renderCashbackJournal(){
  const body=document.getElementById('cbBody'); if(!body) return;
  const r=await api('/api/1c/doctors/cashback');
  if(!r.ok){ body.innerHTML='<div class="muted2" style="padding:14px;font-size:13px">'+(r.status===403?'Нужен доступ':r.status===401?'Войдите':'Недоступно (демо)')+'</div>'; return; }
  const it=r.data.items||[], t=r.data.totals||{};
  const fdt=(ms)=>ms?new Date(ms).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}):'—';
  body.innerHTML=
    `<div class="cards-row" style="margin-bottom:14px">
      ${dashKpi('i-gift','#db2777','К выплате',money(t.accrued||0),'начислено, не выплачено',0)}
      ${dashKpi('i-check2','#16a34a','Выплачено',money(t.paid||0),'всего',0)}
      ${dashKpi('i-doc','#2563eb','Записей',(t.n||0).toLocaleString('ru-RU'),'в журнале',0)}
    </div>`+
    (it.length?`<table class="tbl"><thead><tr><th>Дата</th><th>Врач</th><th>Промокод</th><th class="num">База</th><th class="num">Ставка</th><th class="num">Кэшбек</th><th>Статус</th><th></th></tr></thead><tbody>`+
      it.map(x=>`<tr><td class="muted2">${fdt(x.created_at)}</td><td>${esc(x.doctor_name||'—')}</td><td><span class="tag pink">${esc(x.doctor_code||'—')}</span></td><td class="num">${money(x.base_revenue||0)}</td><td class="num">${x.rate||0}%</td><td class="num">${money(x.amount||0)}</td><td>${x.status==='paid'?'<span class="tag green">выплачено</span>':'<span class="tag amber">начислено</span>'}</td><td><div class="row" style="gap:6px;justify-content:flex-end">${x.status==='accrued'?`<button class="btn sm" data-pay="${x.id}">Выплатить</button>`:''}<button class="btn sm" data-del="${x.id}" title="Удалить запись">${ic('i-x','sm')}</button></div></td></tr>`).join('')+
      `</tbody></table>`:'<div class="muted2" style="padding:16px;font-size:13px">Начислений пока нет. Откройте карточку врача → «Начислить кэшбек».</div>');
  body.querySelectorAll('[data-pay]').forEach(b=>b.onclick=async()=>{ b.disabled=true; const rr=await api('/api/1c/doctors/cashback/'+b.dataset.pay+'/pay',{method:'POST'}); if(rr.ok){ toast('Отмечено выплаченным','i-check2','#16a34a'); renderCashbackJournal(); } else { b.disabled=false; toast('Ошибка','i-x','#dc2626'); } });
  body.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{ if(!confirm('Удалить эту запись начисления? Кэшбек снова станет доступен к начислению.'))return; b.disabled=true; const rr=await api('/api/1c/doctors/cashback/'+b.dataset.del,{method:'DELETE'}); if(rr.ok){ toast('Запись удалена · кэшбек снова доступен','i-check2'); renderCashbackJournal(); if(window.__reloadDoctors) window.__reloadDoctors(); } else { b.disabled=false; toast('Ошибка','i-x','#dc2626'); } });
  const ex=document.getElementById('cbExport'); if(ex) ex.onclick=()=>{ const rows=[['Дата','Врач','Промокод','База','Ставка %','Кэшбек','Статус']].concat(it.map(x=>[new Date(x.created_at).toLocaleString('ru-RU'),x.doctor_name||'',x.doctor_code||'',Math.round(x.base_revenue||0),x.rate||0,Math.round(x.amount||0),x.status==='paid'?'выплачено':'начислено'])); const csv='﻿'+rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(';')).join('\n'); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); a.download='cashback.csv'; a.click(); URL.revokeObjectURL(a.href); toast('CSV выгружен','i-doc'); };
}
async function loadDoctorHistory(ref){
  const box=document.getElementById('docHist'), sub=document.getElementById('docHistSub');
  if(!box) return;
  if(!ref){ if(sub)sub.textContent=''; box.innerHTML='<div class="muted2" style="padding:14px;font-size:13px">Нет привязки к 1С</div>'; return; }
  const res=await api('/api/1c/sales?contractor='+encodeURIComponent(ref)+'&limit=200');
  if(!res.ok){ if(sub)sub.textContent='нет связи'; box.innerHTML='<div class="muted2" style="padding:14px;font-size:13px">История недоступна</div>'; return; }
  const it=res.data.items||[], docs=res.data.docs||0;
  if(sub) sub.textContent = it.length ? (money(res.data.total||0)+' · '+docs+' '+plural(docs,'продажа','продажи','продаж')) : 'нет продаж';
  if(!it.length){ box.innerHTML='<div class="muted2" style="padding:14px;font-size:13px">Продаж по этому врачу в 1С пока нет.</div>'; return; }
  box.innerHTML='<table class="tbl"><thead><tr><th>Дата</th><th>Товар</th><th class="num">Кол-во</th><th class="num">Сумма</th></tr></thead><tbody>'+it.map(x=>`<tr><td class="muted2">${esc((x.date||'').slice(0,10))}</td><td>${esc(x.name||'—')}</td><td class="num">${(x.qty||0).toLocaleString('ru-RU')}</td><td class="num">${money(x.amount||0)}</td></tr>`).join('')+'</tbody></table>';
}
function doctorModal(d){
  const maxM=Math.max(...d.months.map(m=>m[1]));
  const avg=d.patients?Math.round(d.revenue/d.patients):0;
  openModal(`<div class="modal-h"><div class="cell-name"><span class="avatar-xs" style="width:40px;height:40px;font-size:14px;background:${avBg(d.name)}">${initials(d.name)}</span>
    <div><h3>${d.name}</h3><div class="mh-sub">${d.spec} · ${d.clinic}</div></div></div>
    <button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="cards-row">
      ${miniStat('i-users','#10b981','Пациентов',d.patients)}
      ${miniStat('i-money','#2563eb','Выручка',money(d.revenue))}
      ${miniStat('i-gift','#db2777','Кэшбек',money(d.cashbackSum))}
      ${miniStat('i-cart','#7c3aed','Средний чек',money(avg))}
    </div>
    <div class="grid-2b section-gap">
      <div class="fld"><label>Промокод</label><input value="${d.code}"></div>
      <div class="fld"><label>Телефон</label><input value="${d.phone}"></div>
    </div>
    <div class="grid-3 section-gap">
      <div class="fld"><label>Бренд</label><input value="${d.brand}"></div>
      <div class="fld"><label>Скидка пациенту</label><input value="${d.disc}%"></div>
      <div class="fld"><label>Кэшбек врачу</label><input value="${d.cashback}%"></div>
    </div>
    <h4 class="muted section-gap" style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:11px">Динамика выручки по месяцам</h4>
    ${barList(d.months.map(m=>[m[0],m[1],'#10b981']),maxM,true)}
    <h4 class="muted section-gap" style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:11px">Последние продажи по промокоду</h4>
    <div class="timeline">${(d.last||[]).map(h=>tl('#16a34a','i-cart',h.t,h.d)).join('')||'<div class="muted2" style="font-size:13px">Нет данных</div>'}</div>
    <div class="note blue section-gap">${ic('i-info','sm')} Когда подключим 1С — пациенты, суммы и динамика станут реальными: продажи по промокоду ${d.code} из 1С, с учётом бренда.</div>
  </div>
  <div class="modal-f">
    <button class="btn" onclick="toast('Отчёт по врачу выгружен','i-doc')">${ic('i-doc','sm')} Выгрузить отчёт</button>
    <button class="btn primary" onclick="closeModal();toast('Кэшбек ${money(d.cashbackSum)} начислен к выплате','i-gift','#db2777')">${ic('i-gift','sm')} Начислить кэшбек</button>
  </div>`,'wide');
}

// ---------- ANALYTICS ----------
PAGES.analytics=(c)=>{
  c.appendChild(el(`<div class="note">${ic('i-info','sm')} Классическая «динозаврическая» аналитика — без AI-обобщений в первой итерации (по решению встречи). LLM-аналитика — опционально, тестовый режим.</div>`));
  c.appendChild(el(`<div class="grid-2 section-gap">
    <div class="panel"><div class="panel-h"><h3>Конверсия по продавцам</h3><span class="ph-sub">входящие → отработанные → результат</span></div>
      <table class="tbl"><thead><tr><th>Продавец</th><th>Входящие</th><th>Закрыто</th><th>Конверсия</th></tr></thead><tbody>
      ${DB.sellers.map(s=>`<tr><td>${s.name}</td><td>${s.incoming}</td><td>${s.won}</td><td><div class="row"><div class="mini-bar"><i style="width:${s.conv}%;background:var(--accent)"></i></div>${s.conv}%</div></td></tr>`).join('')}
      </tbody></table></div>
    <div class="panel"><div class="panel-h"><h3>Воронка B2B · опт</h3></div><div class="panel-b">
      ${funnelVis([['Заявка',64,'#7c3aed'],['Квалификация',48,'#8b5cf6'],['КП',34,'#2563eb'],['Согласование',22,'#0891b2'],['Отгрузка',16,'#10b981'],['Оплата',12,'#16a34a']])}</div></div>
  </div>`));
  c.appendChild(el(`<div class="grid-2 section-gap">
    <div class="panel"><div class="panel-h"><h3>Средний чек по сегментам</h3></div><div class="panel-b">
      ${barList([['Опт',96000,'#7c3aed'],['Врачи',4200,'#2563eb'],['Дисконт',2900,'#0891b2'],['Розница',2180,'#10b981'],['Новые',1180,'#16a34a']],96000,true)}</div></div>
    <div class="panel"><div class="panel-h"><h3>Возвраты и причины</h3></div><div class="panel-b">
      ${barList([['Не подошёл размер',42,'#dc2626'],['Брак упаковки',18,'#d97706'],['Передумал',11,'#7c3aed'],['Дубль заказа',5,'#0891b2']],42)}</div></div>
  </div>`));
};

// ---------- TASKS ----------
PAGES.tasks=(c)=>{
  const tbar=el(`<div class="toolbar">
    <div class="seg" data-tk="filter"><button class="on" data-s="active">Активные</button><button data-s="all">Все</button><button data-s="done">Выполненные</button></div>
    <div class="spacer"></div><span class="ph-sub" data-tk="cnt"></span>
    <button class="btn primary" id="newTaskBtn">${ic('i-plus','sm')} Задача</button></div>`);
  c.appendChild(tbar);
  const panel=el(`<div class="panel"><div class="muted2" style="padding:14px;font-size:13px">Загрузка…</div></div>`);
  c.appendChild(panel);
  c.appendChild(el(`<div class="note section-gap">${ic('i-info','sm')} Задачи и follow-up по клиентам и сделкам. Можно привязать клиента из 1С, поставить срок и ответственного.</div>`));
  const cnt=tbar.querySelector('[data-tk=cnt]'), seg=tbar.querySelector('[data-tk=filter]');
  let status='active';
  seg.querySelectorAll('button').forEach(b=>b.onclick=()=>{ seg.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); status=b.dataset.s; load(); });
  tbar.querySelector('#newTaskBtn').onclick=()=>newTaskLive(load);
  const typeTag=(t)=>{ const m={'звонок':'blue','встреча':'violet','отгрузка':'amber'}; return `<span class="tag ${m[t]||''}">${esc(t||'задача')}</span>`; };
  const overdue=(due,done)=>!done&&due&&due<new Date().toISOString().slice(0,10);
  function rowLive(t){
    const r=el(`<div class="row" style="padding:13px 18px;border-bottom:1px solid var(--line);gap:12px;align-items:center">
      <div class="toggle ${t.done?'on':''}" style="flex:none"></div>
      <div style="flex:1;min-width:0;cursor:pointer" data-edit><div style="font-weight:600;${t.done?'text-decoration:line-through;opacity:.5':''}">${esc(t.title)}</div>
        <div class="muted" style="font-size:12px">${t.client_name?esc(t.client_name)+' · ':''}${t.assignee?esc(t.assignee)+' · ':''}${t.due_at?('срок '+esc(t.due_at)):'без срока'}</div></div>
      ${overdue(t.due_at,t.done)?'<span class="tag red">просрочено</span>':''}${t.priority==='high'&&!t.done?'<span class="tag amber">срочно</span>':''}${typeTag(t.type)}
      <button class="btn sm" data-del title="Удалить">${ic('i-x','sm')}</button></div>`);
    r.querySelector('.toggle').onclick=async()=>{ const nd=!t.done; const rr=await api('/api/tasks/'+t.id,{method:'POST',body:JSON.stringify({done:nd})}); if(rr.ok){ toast(nd?'Задача выполнена':'Возвращена в работу','i-check2'); load(); } else toast('Ошибка','i-x','#dc2626'); };
    r.querySelector('[data-edit]').onclick=()=>taskModalLive(t,load);
    r.querySelector('[data-del]').onclick=async(e)=>{ e.stopPropagation(); if(!confirm('Удалить задачу?'))return; const rr=await api('/api/tasks/'+t.id,{method:'DELETE'}); if(rr.ok){toast('Удалено','i-check2');load();} else toast('Ошибка','i-x','#dc2626'); };
    return r;
  }
  function rowDemo(t){ return el(`<div class="row" style="padding:13px 18px;border-bottom:1px solid var(--line)"><div class="toggle ${t.done?'on':''}"></div><div style="flex:1"><div style="font-weight:600;${t.done?'text-decoration:line-through;opacity:.5':''}">${esc(t.title)}</div><div class="muted" style="font-size:12px">${esc(t.who||'')} · ${esc(t.due||'')}</div></div><span class="tag">${esc(t.type||'')}</span></div>`); }
  async function load(){
    panel.innerHTML='<div class="muted2" style="padding:14px;font-size:13px">Загрузка…</div>';
    const r=await api('/api/tasks?status='+status);
    if(!r.ok){ cnt.textContent='демо · нет связи'; panel.innerHTML=''; (DB.tasks||[]).forEach(t=>panel.appendChild(rowDemo(t))); return; }
    const items=r.data.items||[], tt=r.data.totals||{};
    cnt.textContent=(tt.active||0)+' активных · '+(tt.total||0)+' всего';
    window.__taskBadge=tt.active||0; renderNav();
    panel.innerHTML=''; if(!items.length){ panel.innerHTML='<div class="muted2" style="padding:18px;font-size:13px">Задач нет. Нажмите «Задача», чтобы создать.</div>'; return; }
    items.forEach(t=>panel.appendChild(rowLive(t)));
  }
  load();
};
function newTaskLive(onSaved){
  const bg=openModal(`<div class="modal-h"><div><h3>Новая задача</h3></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="fld"><label>Название *</label><input data-nt="title" placeholder="Напр. перезвонить клиенту"></div>
    <div class="fld-row"><div class="fld"><label>Тип</label><select data-nt="type"><option>задача</option><option>звонок</option><option>встреча</option><option>отгрузка</option><option>email</option></select></div><div class="fld"><label>Срок</label><input type="date" data-nt="due"></div></div>
    <div class="fld-row"><div class="fld"><label>Приоритет</label><select data-nt="prio"><option value="normal">обычный</option><option value="high">срочно</option></select></div><div class="fld"><label>Ответственный</label><input data-nt="assignee" value="${esc((AUTH.user||{}).name||'')}"></div></div>
    <div class="fld"><label>Клиент из 1С (необязательно)</label><div class="fld-in" style="width:100%">${ic('i-search','sm')}<input data-nt="client" placeholder="поиск по 1С" autocomplete="off" style="width:100%"></div><div id="ntSug" class="panel" style="margin-top:4px;display:none;max-height:160px;overflow:auto"></div></div>
    <div class="fld"><label>Комментарий</label><input data-nt="note"></div>
  </div>
  <div class="modal-f"><button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="ntSave">Создать</button></div>`);
  const q=bg.querySelector('[data-nt=client]'), sug=bg.querySelector('#ntSug'); let ref=null,qt=null;
  q.addEventListener('input',()=>{ ref=null; clearTimeout(qt); const v=q.value.trim(); if(v.length<2){sug.style.display='none';return;}
    qt=setTimeout(async()=>{ const r=await api('/api/1c/contractors?limit=6&q='+encodeURIComponent(v)); if(!r.ok||!(r.data.items||[]).length){sug.style.display='none';return;}
      sug.innerHTML=r.data.items.map(x=>`<div class="doc-row" data-ref="${esc(x.ref_key)}" data-name="${esc(x.name||'')}"><div><div class="dt">${esc(x.name||'—')}</div><div class="ds">${esc(x.code||'')} · ${esc(x.phone||'')}</div></div></div>`).join(''); sug.style.display='block';
      sug.querySelectorAll('[data-ref]').forEach(it=>it.onclick=()=>{ref=it.dataset.ref;q.value=it.dataset.name;sug.style.display='none';}); },300); });
  bg.querySelector('#ntSave').onclick=async()=>{ const title=bg.querySelector('[data-nt=title]').value.trim(); if(!title){toast('Укажите название','i-info');return;}
    const body={title,type:bg.querySelector('[data-nt=type]').value,priority:bg.querySelector('[data-nt=prio]').value,due_at:bg.querySelector('[data-nt=due]').value,assignee:bg.querySelector('[data-nt=assignee]').value.trim(),client_ref:ref,client_name:q.value.trim(),note:bg.querySelector('[data-nt=note]').value.trim()};
    const r=await api('/api/tasks',{method:'POST',body:JSON.stringify(body)}); if(!r.ok){toast('Не удалось создать','i-x','#dc2626');return;} closeModal(); toast('Задача создана','i-check2'); onSaved&&onSaved(); };
}
function taskModalLive(t,onSaved){
  const bg=openModal(`<div class="modal-h"><div><h3>Задача</h3></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="fld"><label>Название</label><input data-tm="title" value="${esc(t.title||'')}"></div>
    <div class="fld-row"><div class="fld"><label>Тип</label><select data-tm="type">${['задача','звонок','встреча','отгрузка','email'].map(x=>`<option ${x===t.type?'selected':''}>${x}</option>`).join('')}</select></div><div class="fld"><label>Срок</label><input type="date" data-tm="due" value="${esc(t.due_at||'')}"></div></div>
    <div class="fld-row"><div class="fld"><label>Приоритет</label><select data-tm="prio"><option value="normal" ${t.priority!=='high'?'selected':''}>обычный</option><option value="high" ${t.priority==='high'?'selected':''}>срочно</option></select></div><div class="fld"><label>Ответственный</label><input data-tm="assignee" value="${esc(t.assignee||'')}"></div></div>
    <div class="fld"><label>Комментарий</label><input data-tm="note" value="${esc(t.note||'')}"></div>
    ${t.client_name?`<div class="note blue section-gap">${ic('i-info','sm')} Клиент: ${esc(t.client_name)}</div>`:''}
  </div>
  <div class="modal-f"><button class="btn" id="tmDel" style="color:var(--red)">${ic('i-x','sm')} Удалить</button><button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="tmSave">Сохранить</button></div>`);
  bg.querySelector('#tmSave').onclick=async()=>{ const body={title:bg.querySelector('[data-tm=title]').value.trim(),type:bg.querySelector('[data-tm=type]').value,priority:bg.querySelector('[data-tm=prio]').value,due_at:bg.querySelector('[data-tm=due]').value,assignee:bg.querySelector('[data-tm=assignee]').value.trim(),note:bg.querySelector('[data-tm=note]').value.trim()}; const r=await api('/api/tasks/'+t.id,{method:'POST',body:JSON.stringify(body)}); if(!r.ok){toast('Ошибка','i-x','#dc2626');return;} closeModal(); toast('Сохранено','i-check2'); onSaved&&onSaved(); };
  bg.querySelector('#tmDel').onclick=async()=>{ if(!confirm('Удалить задачу?'))return; const r=await api('/api/tasks/'+t.id,{method:'DELETE'}); if(r.ok){closeModal();toast('Удалено','i-check2');onSaved&&onSaved();} else toast('Ошибка','i-x','#dc2626'); };
}

// ---------- SUBS ----------
PAGES.subs=(c)=>{
  c.appendChild(el(`<div class="toolbar"><div class="page-sub">Авто-формирование заказа каждые N месяцев · списание из 1С</div><div class="spacer"></div>
    <button class="btn primary" onclick="toast('Новая подписка','i-repeat','#7c3aed')">${ic('i-plus','sm')} Подписка</button></div>`));
  const grid=el(`<div class="grid-3"></div>`);
  DB.subs.forEach(s=>{
    grid.appendChild(el(`<div class="list-card">
      <div class="row"><div class="k-ic" style="width:38px;height:38px;border-radius:11px;background:#7c3aed22;color:#c4b5fd;display:grid;place-items:center">${ic('i-repeat')}</div>
        <div><div style="font-weight:700">${s.client}</div><div class="muted" style="font-size:12px">${s.set}</div></div>
        <span class="tag ${s.status==='активна'?'green':'amber'}" style="margin-left:auto">${s.status}</span></div>
      <div class="grid-3 section-gap" style="gap:10px">
        <div><div class="muted" style="font-size:11px">Период</div><div style="font-weight:600">${s.period}</div></div>
        <div><div class="muted" style="font-size:11px">Цена</div><div style="font-weight:600">${money(s.price)}</div></div>
        <div><div class="muted" style="font-size:11px">След. отгрузка</div><div style="font-weight:600">${s.next}</div></div>
      </div>
      <div class="row section-gap" style="gap:8px;padding-top:12px;border-top:1px solid var(--line)">
        <button class="btn sm" onclick="toast('Напоминание за 7 дней отправлено','i-bell','#7c3aed')">${ic('i-bell','sm')} Напомнить</button>
        <button class="btn sm" onclick="toast('Подписка ${s.status==='активна'?'приостановлена':'возобновлена'}','i-pause')">${ic('i-pause','sm')} ${s.status==='активна'?'Пауза':'Возобновить'}</button>
      </div></div>`));
  });
  c.appendChild(grid);
};

// ---------- TRIGGERS ----------
PAGES.triggers=(c)=>{
  c.appendChild(el(`<div class="page-sub" style="margin-bottom:14px">Триггерные рассылки через GreenAPI · учитывают метку «не хочет рассылок»</div>`));
  const panel=el(`<div class="panel"></div>`);
  DB.triggers.forEach(t=>{
    const row=el(`<div class="row" style="padding:15px 18px;border-bottom:1px solid var(--line);align-items:flex-start">
      <div class="k-ic" style="width:40px;height:40px;border-radius:11px;background:${t.risk==='высокий'?'var(--red-soft);color:#f87171':'var(--accent-soft);color:var(--accent2)'};display:grid;place-items:center;flex:none">${ic(t.type==='ДР'?'i-gift':t.type==='рекуррент'?'i-repeat':t.type==='статус'?'i-truck':t.type==='масс'?'i-bell':'i-repeat')}</div>
      <div style="flex:1"><div class="row" style="gap:9px"><div style="font-weight:700">${t.name}</div><span class="tag ${t.risk==='высокий'?'red':'green'}">риск ${t.risk}</span></div>
        <div class="muted" style="font-size:12.5px;margin-top:4px">${t.desc}</div>
        <div class="muted2" style="font-size:11.5px;margin-top:6px">Отправлено: ${t.sent}</div></div>
      <div class="toggle ${t.on?'on':''}" data-id="${t.id}"></div></div>`);
    row.querySelector('.toggle').onclick=function(){t.on=!t.on;this.classList.toggle('on');toast(t.name+': '+(t.on?'включена':'выключена'),'i-flame','var(--amber)');};
    panel.appendChild(row);
  });
  c.appendChild(panel);
  c.appendChild(el(`<div class="note amber section-gap">${ic('i-info','sm')} Массовые WhatsApp-рассылки через GreenAPI запрещены — риск бана номера. Для базы 10k+ рекомендуем bulk-провайдера (~15 с/сообщение) или ретаргет.</div>`));
};

// ---------- AI ----------
PAGES.ai=(c)=>{
  c.appendChild(el(`<div class="panel"><div class="panel-h"><div class="k-ic" style="width:40px;height:40px;border-radius:11px;background:var(--blue-soft);color:#93c5fd;display:grid;place-items:center">${ic('i-bot')}</div>
    <div><h3>AI-агент на WhatsApp</h3><span class="ph-sub">ночные консультации без живого менеджера · режим обкатки</span></div>
    <div class="spacer"></div><div class="toggle on" id="aiToggle"></div></div>
    <div class="panel-b"><div class="cards-row">
      ${miniStat('i-chat','#2563eb','Диалогов за ночь','24')}
      ${miniStat('i-check2','#10b981','Закрыто без эскалации','17')}
      ${miniStat('i-users','#d97706','Эскалаций утром','7')}
      ${miniStat('i-money','#7c3aed','Стоимость токенов','$3.20')}
    </div></div></div>`));
  $('#aiToggle').onclick=function(){this.classList.toggle('on');toast('AI-агент '+(this.classList.contains('on')?'включён':'выключен по кнопке'),'i-bot','#2563eb');};
  c.appendChild(el(`<div class="grid-2 section-gap">
    <div class="panel"><div class="panel-h"><h3>Сценарии</h3></div><div class="panel-b">
      <div class="timeline">
        ${tl('#2563eb','i-chat','Приветствие, сбор контактов (ФИО, город, интерес)','шаг 1')}
        ${tl('#10b981','i-info','Ответы на FAQ по обученной базе (наличие, цена, доставка)','шаг 2')}
        ${tl('#7c3aed','i-box','Подбор товара по запросу из каталога 1С','шаг 3')}
        ${tl('#d97706','i-users','Эскалация на консультанта утром — карточка ждёт в CRM','шаг 4')}
      </div></div></div>
    <div class="panel"><div class="panel-h"><h3>Обучение и обкатка</h3></div><div class="panel-b">
      <div class="ctx-row"><span>Источник: история переписок</span><b>загружено</b></div>
      <div class="ctx-row"><span>Скрипты заказчика</span><b>3 файла</b></div>
      <div class="ctx-row"><span>Каталог 1С</span><b>синхронизирован</b></div>
      <div class="ctx-row"><span>Логирование диалогов</span><b>100%</b></div>
      <div class="ctx-row"><span>Период обкатки</span><b>2–4 недели</b></div>
      <div class="note blue section-gap">${ic('i-info','sm')} Решение оставлять агента или нет принимается после обкатки на тестовой группе. 100% покрытие диалогов — для ручной проверки.</div>
    </div></div>
  </div>`));
  const log=el(`<div class="panel section-gap"><div class="panel-h"><h3>Лог ночных диалогов</h3><span class="ph-sub">100% логируется</span></div>
    <table class="tbl"><thead><tr><th>Время</th><th>Клиент</th><th>Запрос</th><th>Ответ AI</th><th>Эскалация</th></tr></thead><tbody>
    ${DB.aiLog.map(l=>`<tr class="clickable"><td>${l.time}</td><td>${l.client}</td><td class="muted">${l.q}</td><td class="muted">${l.a}</td><td>${l.esc?'<span class="tag amber">утром</span>':'<span class="tag green">закрыто</span>'}</td></tr>`).join('')}
    </tbody></table></div>`);
  log.querySelectorAll('tr.clickable').forEach(tr=>tr.onclick=()=>toast('Полная переписка с AI открыта для проверки','i-eye','#2563eb'));
  c.appendChild(log);
};

// ---------- KPI ----------
PAGES.kpi=(c)=>{
  c.appendChild(el(`<div class="note">${ic('i-info','sm')} Формула KPI настраивается заказчиком, Pllato внедряет. Расчёт автоматический по данным CRM + 1С.</div>`));
  const grid=el(`<div class="grid-2b section-gap"></div>`);
  DB.sellers.forEach(s=>{
    const pct=Math.round(s.fact/s.plan*100);
    grid.appendChild(el(`<div class="list-card">
      <div class="row"><span class="avatar-xs" style="width:42px;height:42px;font-size:14px;background:${avBg(s.name)}">${initials(s.name)}</span>
        <div><div style="font-weight:700">${s.name}</div><div class="muted" style="font-size:12px">${s.role}</div></div>
        <div style="margin-left:auto" class="donut" style="--p:${Math.min(100,pct)}"><div class="dv" style="font-size:16px">${pct}%</div></div></div>
      <div class="grid-3 section-gap" style="gap:10px">
        <div><div class="muted" style="font-size:11px">План</div><div style="font-weight:700">${money(s.plan)}</div></div>
        <div><div class="muted" style="font-size:11px">Факт</div><div style="font-weight:700;color:var(--accent2)">${money(s.fact)}</div></div>
        <div><div class="muted" style="font-size:11px">Бонус сейчас</div><div style="font-weight:700">${money(s.bonus)}</div></div>
      </div>
      <div class="row section-gap" style="justify-content:space-between;padding-top:12px;border-top:1px solid var(--line);font-size:12.5px">
        <span class="muted">Конверсия ${s.conv}%</span><span class="muted">Активных задач: ${s.tasks}</span></div></div>`));
  });
  c.appendChild(grid);
};

// ---------- приглашения сотрудников (owner/superadmin) ----------
function roleOptions(sel){
  return DB.roles.map(r=>`<option value="${r.id}"${r.id===sel?' selected':''}>${r.name}</option>`).join('');
}
async function copyText(t){ try{ await navigator.clipboard.writeText(t); toast('Ссылка скопирована','i-check2'); }
  catch(e){ toast('Скопируйте вручную: '+t,'i-info','#d97706'); } }

// Показать ссылку-инвайт в модалке (ручной режим, если WhatsApp не отправился авто).
function showInviteLinkBox(bg, inv, waLink){
  bg.querySelector('.modal').innerHTML = `<h3 style="margin:0 0 4px">Приглашение создано</h3>
    <div class="muted" style="font-size:13px;margin-bottom:14px">Авто-отправка в WhatsApp не настроена. Отправьте ссылку сотруднику вручную:</div>
    <div style="background:var(--bg2,#0c1424);border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:12px;word-break:break-all;margin-bottom:14px">${inv.link}</div>
    <div class="row" style="gap:8px;flex-wrap:wrap">
      <button class="btn" id="invOpenWa">${ic('i-phone','sm')} Открыть WhatsApp</button>
      <button class="btn ghost" id="invCopy">Скопировать ссылку</button>
      <button class="btn ghost" id="invClose" style="margin-left:auto">Готово</button></div>`;
  bg.querySelector('#invOpenWa').onclick=()=>window.open(waLink,'_blank');
  bg.querySelector('#invCopy').onclick=()=>copyText(inv.link);
  bg.querySelector('#invClose').onclick=()=>bg.remove();
}

function openInviteModal(onDone){
  const lab='display:grid;gap:5px;font-size:12px;color:var(--muted);margin-bottom:12px';
  const bg = openModal(`<h3 style="margin:0 0 4px">Пригласить сотрудника</h3>
    <div class="muted" style="font-size:13px;margin-bottom:16px">Сотрудник получит ссылку в WhatsApp и сам задаст пароль для входа.</div>
    <label style="${lab}">Имя<input id="invName" class="login-field" placeholder="Имя Фамилия" style="margin:0"></label>
    <label style="${lab}">Телефон · WhatsApp <span class="muted2">(в межд. формате, только цифры)</span>
      <input id="invPhone" class="login-field" inputmode="numeric" placeholder="996700123456" style="margin:0"></label>
    <label style="${lab}">Роль<select id="invRole" class="login-field" style="margin:0">${roleOptions('seller')}</select></label>
    <label style="${lab}">Email <span class="muted2">(опц., для входа через Google)</span>
      <input id="invEmail" class="login-field" type="email" placeholder="name@gmail.com" style="margin:0"></label>
    <div class="row" style="gap:8px;justify-content:flex-end;margin-top:6px">
      <button class="btn ghost" id="invCancel">Отмена</button>
      <button class="btn" id="invSend">${ic('i-phone','sm')} Создать и отправить</button></div>`);
  bg.querySelector('#invCancel').onclick=()=>bg.remove();
  bg.querySelector('#invSend').onclick=async ()=>{
    const name=bg.querySelector('#invName').value.trim();
    const phone=bg.querySelector('#invPhone').value.trim();
    const role=bg.querySelector('#invRole').value;
    const email=bg.querySelector('#invEmail').value.trim();
    if(!phone){ toast('Укажите телефон','i-info','#d97706'); return; }
    const b=bg.querySelector('#invSend'); b.disabled=true; b.textContent='Отправка…';
    const r=await api('/api/invites',{method:'POST',body:JSON.stringify({role,name,phone,email:email||undefined})});
    b.disabled=false;
    if(!r.ok){ toast((r.data&&r.data.error)||'Не удалось создать приглашение','i-info','#ef4444');
      b.innerHTML=ic('i-phone','sm')+' Создать и отправить'; return; }
    if(onDone) onDone();
    const wa=r.data.whatsapp;
    if(wa&&wa.sent){ toast('Приглашение отправлено в WhatsApp ✓','i-check2'); bg.remove(); }
    else showInviteLinkBox(bg, r.data.invite, r.data.wa_link);
  };
}

// Панель активных приглашений: грузит GET /api/invites, копирование ссылки, отзыв.
function invitesPanel(){
  const panel=el(`<div class="panel section-gap"><div class="panel-h"><h3>Приглашения</h3>
    <button class="btn sm" data-inv="add">${ic('i-plus','sm')} Пригласить сотрудника</button></div>
    <div data-inv="body" class="panel-b"><div class="muted2" style="font-size:13px">Загрузка…</div></div></div>`);
  const body=panel.querySelector('[data-inv=body]');
  panel.querySelector('[data-inv=add]').onclick=()=>openInviteModal(()=>load());
  async function load(){
    const r=await api('/api/invites');
    if(!r.ok){ body.innerHTML=`<div class="muted2" style="font-size:13px">${r.status===403?'Недостаточно прав':'Не удалось загрузить'}</div>`; return; }
    const items=r.data.items||[];
    if(!items.length){ body.innerHTML='<div class="muted2" style="font-size:13px">Активных приглашений нет. Нажмите «Пригласить сотрудника».</div>'; return; }
    const stMap={pending:['ожидает','amber'],used:['принято','green'],expired:['истекло','']};
    body.innerHTML=`<table class="tbl"><tbody>${items.map((it,i)=>{
      const st=stMap[it.status]||['—',''];
      return `<tr data-i="${i}"><td><div class="cell-name"><div><div>${esc(it.name||'—')}</div>
        <div class="muted2" style="font-size:11px">${esc(it.roleName||it.role)} · ${esc(it.phone||'')}</div></div></div></td>
        <td style="text-align:right;white-space:nowrap"><span class="tag ${st[1]}">${st[0]}</span>
        ${it.status==='pending'?`<button class="btn sm ghost" data-act="copy" data-i="${i}" style="margin-left:8px">копи</button>
          <button class="btn sm ghost" data-act="revoke" data-i="${i}">отозвать</button>`:''}</td></tr>`;
    }).join('')}</tbody></table>`;
    body.querySelectorAll('[data-act=copy]').forEach(b=>b.onclick=()=>copyText(items[+b.dataset.i].link));
    body.querySelectorAll('[data-act=revoke]').forEach(b=>b.onclick=async ()=>{
      const it=items[+b.dataset.i]; b.disabled=true;
      const r=await api('/api/invites/'+it.token,{method:'DELETE'});
      if(r.ok){ toast('Приглашение отозвано','i-logout','var(--muted)'); load(); }
      else toast('Не удалось отозвать','i-info','#ef4444');
    });
  }
  load();
  return panel;
}

// Живой список сотрудников: GET /api/admin/users (D1). Если нет прав/связи —
// откатываемся на демо-состав из DB.roles, чтобы раздел не выглядел пустым.
function teamMembersPanel(){
  const panel=el(`<div class="panel"><div class="panel-h"><h3>Команда</h3>
    <span class="ph-sub" data-tm="cnt"></span></div>
    <table class="tbl"><tbody data-tm="body"><tr><td class="muted2" style="font-size:13px">Загрузка…</td></tr></tbody></table></div>`);
  const body=panel.querySelector('[data-tm=body]');
  const cnt=panel.querySelector('[data-tm=cnt]');
  function renderDemo(note){
    cnt.textContent = note||'демо-состав';
    body.innerHTML=DB.roles.map(r=>`<tr><td><div class="cell-name"><span class="avatar-xs" style="background:${r.color}">${initials(r.who)}</span><div><div>${r.who}</div><div class="muted2" style="font-size:11px">${r.name}</div></div></div></td><td style="text-align:right"><span class="tag green">активен</span></td></tr>`).join('');
  }
  async function load(){
    const r=await api('/api/admin/users');
    if(!r.ok){ renderDemo(r.status===403?'демо · нужен доступ владельца':'демо · нет связи'); return; }
    const items=r.data.items||[];
    if(!items.length){ renderDemo('пока нет аккаунтов'); return; }
    cnt.textContent = items.length+' '+plural(items.length,'сотрудник','сотрудника','сотрудников');
    body.innerHTML=items.map(u=>{
      const st = u.active ? '<span class="tag green">активен</span>' : '<span class="tag">отключён</span>';
      const me = u.is_me ? '<span class="tag blue" style="margin-left:6px">вы</span>' : '';
      const sub = (u.roleName||u.role)+(u.email?' · '+u.email:(u.login?' · '+u.login:''));
      return `<tr><td><div class="cell-name"><span class="avatar-xs" style="background:${avBg(u.name||u.login||'?')}">${initials(u.name||u.login||'?')}</span>
        <div><div>${esc(u.name||u.login||'—')}${me}</div><div class="muted2" style="font-size:11px">${esc(sub)}</div></div></div></td>
        <td style="text-align:right">${st}</td></tr>`;
    }).join('');
  }
  load();
  return panel;
}
function plural(n,one,few,many){ const m=n%100, d=n%10;
  if(m>=11&&m<=14) return many; if(d===1) return one; if(d>=2&&d<=4) return few; return many; }

// ---------- TEAM ----------
PAGES.team=(c)=>{
  if(isAdminRole()) c.appendChild(invitesPanel());
  const sections=[['Дашборд','dash'],['Воронки','funnels'],['Клиенты','clients'],['Чаты','inbox'],['Заказы','orders'],['Каталог','catalog'],['Маркетинг','marketing'],['Блогеры','bloggers'],['Врачи-партнёры','doctors'],['Аналитика','analytics'],['Задачи','tasks'],['Подписки','subs'],['Триггеры','triggers'],['AI-агент','ai'],['KPI','kpi'],['Команда','team'],['Интеграции','integrations'],['Настройки','settings']];
  c.appendChild(el(`<div class="page-sub" style="margin-bottom:14px">Каждая роль видит только свой раздел. WhatsApp-каналы привязаны к сотрудникам.</div>`));
  const panel=el(`<div class="panel" style="overflow-x:auto"><table class="tbl perm-tbl"><thead><tr><th>Раздел</th>${DB.roles.map(r=>`<th style="text-align:center">${r.name.split(' ')[0]}</th>`).join('')}</tr></thead><tbody>
    ${sections.map(([lbl,id])=>`<tr><td>${lbl}</td>${DB.roles.map(r=>`<td style="text-align:center">${DB.access[r.id].includes(id)?'<span class="yes">'+ic('i-check2','sm')+'</span>':'<span class="no">—</span>'}</td>`).join('')}</tr>`).join('')}
  </tbody></table></div>`);
  c.appendChild(panel);
  const grid=el(`<div class="grid-2 section-gap"></div>`);
  grid.appendChild(teamMembersPanel());
  grid.appendChild(el(`<div class="panel"><div class="panel-h"><h3>Привязка WhatsApp-каналов</h3></div><table class="tbl"><tbody>
      ${DB.channels.filter(x=>x.type==='wa').map(ch=>`<tr><td><div class="cell-name"><span class="ci" style="width:26px;height:26px;border-radius:8px;background:var(--wa)22;color:var(--wa);display:grid;place-items:center">${ic('i-phone','sm')}</span>${ch.name}</div></td><td class="muted">${ch.phone}</td><td style="text-align:right"><b>${ch.owner}</b></td></tr>`).join('')}
    </tbody></table></div>`));
  c.appendChild(grid);
};

// ---------- INTEGRATIONS ----------
// ---------- GreenAPI: живая панель настроек (owner/superadmin) ----------
function isAdminRole(){ return ['owner','superadmin'].includes((AUTH.user||{}).role); }

function gaSetBadge(badge, text, color){
  badge.textContent = text;
  badge.style.background = color+'22'; badge.style.color = color; badge.style.borderColor = color+'55';
}
async function gaLoadStatus(refs){
  const { badge, info, idInp, urlInp, tokInp } = refs;
  gaSetBadge(badge, 'проверка…', '#64748b');
  const r = await api('/api/admin/greenapi/status');
  if(!r.ok){ gaSetBadge(badge, r.status===403?'нет прав':'ошибка связи', '#ef4444');
    info.textContent = (r.data&&r.data.error)||''; return; }
  const d = r.data;
  // заполняем поля сохранённым (без перезаписи введённого токена)
  if(d.id_instance && document.activeElement!==idInp) idInp.value = d.id_instance;
  if(document.activeElement!==urlInp) urlInp.value = (d.api_url && d.api_url!=='https://api.green-api.com') ? d.api_url : '';
  if(!d.configured){
    gaSetBadge(badge, 'не настроено', '#64748b');
    info.textContent = d.hint || 'Укажите idInstance и apiTokenInstance из консоли green-api.com.';
    tokInp.placeholder = 'apiTokenInstance';
  } else if(d.authorized){
    gaSetBadge(badge, 'подключено'+(d.phone?(' · +'+d.phone.replace(/\D/g,'')):''), '#16a34a');
    info.textContent = 'WhatsApp привязан. Источник конфига: '+(d.source==='crm'?'CRM':'секреты воркера')+'. Состояние: '+d.state+'.';
    tokInp.placeholder = '••• токен сохранён (пусто = не менять)';
  } else if(d.state){
    gaSetBadge(badge, 'не авторизован', '#d97706');
    info.textContent = d.hint || 'Инстанс есть, но WhatsApp не привязан — отсканируйте QR в консоли GreenAPI. Состояние: '+d.state+'.';
    tokInp.placeholder = '••• токен сохранён (пусто = не менять)';
  } else {
    gaSetBadge(badge, 'ошибка инстанса', '#ef4444');
    info.textContent = 'GreenAPI не отвечает ('+(d.error||'')+'). Проверьте idInstance / токен / API URL.';
  }
}
function greenApiPanel(){
  const panel = el(`<div class="panel section-gap" style="margin-top:0">
    <div class="panel-h"><h3>WhatsApp · GreenAPI</h3>
      <span class="tag" data-ga="badge" style="border:1px solid">…</span></div>
    <div class="panel-b">
      <div class="note">${ic('i-info','sm')} Подключение WhatsApp для авто-отправки приглашений сотрудникам (и далее — омни-чатов). <b>idInstance</b> и <b>apiTokenInstance</b> берутся в консоли green-api.com. Токен хранится на сервере и не показывается целиком.</div>
      <div style="display:grid;gap:10px;margin-top:14px;max-width:540px">
        <label style="display:grid;gap:5px;font-size:12px;color:var(--muted)">idInstance
          <input data-ga="id" class="login-field" inputmode="numeric" placeholder="напр. 1101000001" style="margin:0"></label>
        <label style="display:grid;gap:5px;font-size:12px;color:var(--muted)">apiTokenInstance
          <input data-ga="token" class="login-field" type="password" autocomplete="off" placeholder="apiTokenInstance" style="margin:0"></label>
        <label style="display:grid;gap:5px;font-size:12px;color:var(--muted)">API URL <span class="muted2">(опц., у новых инстансов вида https://1101.api.greenapi.com)</span>
          <input data-ga="url" class="login-field" placeholder="https://api.green-api.com" style="margin:0"></label>
      </div>
      <div class="row" style="gap:8px;margin-top:14px;flex-wrap:wrap">
        <button class="btn" data-ga="save">${ic('i-check2','sm')} Сохранить и проверить</button>
        <button class="btn ghost" data-ga="check">${ic('i-sync','sm')} Проверить статус</button>
        <button class="btn ghost" data-ga="test">${ic('i-phone','sm')} Отправить тест</button>
        <button class="btn ghost" data-ga="off" style="margin-left:auto">Отключить</button>
      </div>
      <div class="muted2" data-ga="info" style="margin-top:10px;font-size:12px;line-height:1.5"></div>
    </div></div>`);

  const refs = {
    badge: panel.querySelector('[data-ga=badge]'),
    info:  panel.querySelector('[data-ga=info]'),
    idInp: panel.querySelector('[data-ga=id]'),
    tokInp:panel.querySelector('[data-ga=token]'),
    urlInp:panel.querySelector('[data-ga=url]'),
  };
  const btnSave = panel.querySelector('[data-ga=save]');
  const btnCheck= panel.querySelector('[data-ga=check]');
  const btnTest = panel.querySelector('[data-ga=test]');
  const btnOff  = panel.querySelector('[data-ga=off]');

  btnSave.onclick = async ()=>{
    const body = { id_instance: refs.idInp.value.trim(), api_url: refs.urlInp.value.trim() };
    const tok = refs.tokInp.value.trim(); if(tok) body.token = tok;
    if(!body.id_instance){ toast('Укажите idInstance','i-info','#d97706'); return; }
    btnSave.disabled=true; const old=btnSave.innerHTML; btnSave.textContent='Сохранение…';
    const r = await api('/api/admin/greenapi/settings',{method:'PUT',body:JSON.stringify(body)});
    btnSave.disabled=false; btnSave.innerHTML=old;
    if(!r.ok){ toast((r.data&&r.data.error)||'Не удалось сохранить','i-info','#ef4444'); return; }
    refs.tokInp.value=''; toast('Настройки сохранены','i-check2'); gaLoadStatus(refs);
  };
  btnCheck.onclick = ()=>gaLoadStatus(refs);
  btnTest.onclick = ()=>{
    const bg = openModal(`<h3 style="margin:0 0 4px">Тест WhatsApp</h3>
      <div class="muted" style="font-size:13px;margin-bottom:14px">Отправим сообщение через GreenAPI. Номер в международном формате, только цифры.</div>
      <input id="gaTestPhone" class="login-field" placeholder="996700123456" style="margin:0 0 14px">
      <div class="row" style="gap:8px;justify-content:flex-end">
        <button class="btn ghost" id="gaTestCancel">Отмена</button>
        <button class="btn" id="gaTestSend">Отправить</button></div>`);
    bg.querySelector('#gaTestCancel').onclick=()=>bg.remove();
    bg.querySelector('#gaTestSend').onclick = async ()=>{
      const phone = bg.querySelector('#gaTestPhone').value.trim();
      if(!phone){ toast('Введите номер','i-info','#d97706'); return; }
      const sBtn=bg.querySelector('#gaTestSend'); sBtn.disabled=true; sBtn.textContent='Отправка…';
      const r = await api('/api/admin/greenapi/test',{method:'POST',body:JSON.stringify({phone})});
      bg.remove();
      const wa = r.data && r.data.whatsapp;
      if(wa && wa.sent) toast('Тест отправлен ✓','i-check2');
      else { const link=r.data&&r.data.wa_link;
        toast('Не отправлено через API'+(link?' — открываю WhatsApp':''),'i-info','#d97706');
        if(link) window.open(link,'_blank'); }
    };
  };
  btnOff.onclick = ()=>{
    const bg = openModal(`<h3 style="margin:0 0 4px">Отключить GreenAPI?</h3>
      <div class="muted" style="font-size:13px;margin-bottom:16px">Сохранённые idInstance и токен будут удалены из CRM. Приглашения вернутся в ручной режим (ссылка wa.me).</div>
      <div class="row" style="gap:8px;justify-content:flex-end">
        <button class="btn ghost" id="gaOffCancel">Отмена</button>
        <button class="btn" id="gaOffYes" style="background:#ef4444;border-color:#ef4444">Отключить</button></div>`);
    bg.querySelector('#gaOffCancel').onclick=()=>bg.remove();
    bg.querySelector('#gaOffYes').onclick=async ()=>{
      bg.remove();
      const r = await api('/api/admin/greenapi/settings',{method:'DELETE'});
      if(r.ok){ refs.idInp.value=''; refs.urlInp.value=''; refs.tokInp.value=''; toast('GreenAPI отключён','i-logout','var(--muted)'); gaLoadStatus(refs); }
      else toast('Не удалось отключить','i-info','#ef4444');
    };
  };

  gaLoadStatus(refs);
  return panel;
}

PAGES.integrations=(c)=>{
  if(isAdminRole()) c.appendChild(greenApiPanel());
  const intgs=[
    ['1С','Listki EG (Кыргызстан)','#16a34a','1С','Остатки 4 000 SKU · заказы · накладные','Синхронизирован 1 мин назад','green'],
    ['WhatsApp','GreenAPI · 5 каналов','#25d366','W','$50/мес · безлимит сообщений','5 каналов активны','green'],
    ['Instagram','Meta Business API','#e1306c','IG','Direct · webhook','2 аккаунта подключены','green'],
    ['WordPress','Reliney + Dental Pharmacy','#d97706','WP','Формы → webhook → лиды','2 сайта · UTM активны','green'],
    ['AI / LLM','Anthropic Claude','#2563eb','AI','Ночные консультации','Режим обкатки','amber'],
  ];
  const grid=el(`<div class="grid-2 section-gap" style="margin-top:0"></div>`);
  intgs.forEach(g=>{
    grid.appendChild(el(`<div class="intg-card"><div class="ic" style="background:${g[2]}">${g[3]}</div>
      <div class="ii"><div class="in">${g[0]} <span class="muted" style="font-weight:500;font-size:12px">· ${g[1]}</span></div>
        <div class="id">${g[4]}</div><div class="row" style="margin-top:7px"><span class="tag ${g[6]}">${ic('i-sync','sm')} ${g[5]}</span></div></div>
      <button class="btn sm" onclick="toast('Настройки интеграции ${g[0]}','i-cog')">${ic('i-cog','sm')}</button></div>`));
  });
  c.appendChild(grid);
  c.appendChild(el(`<div class="note section-gap">${ic('i-info','sm')} Поведение при сбоях: 1С недоступен → заказы копятся в очереди, после восстановления — досинхронизация. GreenAPI/Meta недоступны → сотрудники работают с телефонов, синхронизация подхватит.</div>`));
  const syncBox=el(`<div class="panel section-gap"><div class="panel-h"><h3>${ic('i-sync','sm')} Статус синхронизации 1С</h3><span class="ph-sub" id="syncSub" style="margin-left:auto"></span></div>
    <div id="syncBody"><div class="muted2" style="padding:14px;font-size:13px">Загрузка…</div></div></div>`);
  c.appendChild(syncBox);
  c.appendChild(el(`<div class="note section-gap">${ic('i-info','sm')} Продажи и цены синхронизируются <b>инкрементально</b> (только свежие записи по дате) — поэтому «строк в последнем прогоне» по ним небольшое, а в зеркале — вся история. Справочники и товары — полностью. Полная сверка — ночью (04:00–06:00).</div>`));
  loadSyncStatus();
};
async function loadSyncStatus(){
  const body=document.getElementById('syncBody'), sub=document.getElementById('syncSub');
  if(!body) return;
  const fdt=(ms)=>ms?new Date(ms).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'—';
  const r=await api('/api/1c/sync-status');
  if(!r.ok){ if(sub)sub.textContent=r.status===403?'нужен доступ':r.status===401?'войдите':'демо · нет связи'; body.innerHTML='<div class="muted2" style="padding:14px;font-size:13px">Статус доступен с боевыми данными 1С</div>'; return; }
  const d=r.data, ents=d.entities||[], M=d.mirror||{};
  const L={products:'Товары',categories:'Категории',orgs:'Организации',contractors:'Контрагенты',pricetypes:'Виды цен',prices:'Цены',stock:'Остатки',users:'Пользователи',persons:'Физлица',employees:'Сотрудники',stores:'Склады',sales:'Продажи'};
  const mir={products:M.products,contractors:M.contractors,sales:M.sales,prices:M.prices,persons:M.persons,stores:M.stores};
  const incr={sales:1,prices:1};
  if(sub) sub.textContent = ents.length? ('обновлено '+fdt(Math.max(...ents.map(e=>e.last_sync||0)))) : '';
  if(!ents.length){ body.innerHTML='<div class="muted2" style="padding:14px;font-size:13px">Синхронизация ещё не запускалась</div>'; return; }
  body.innerHTML='<table class="tbl"><thead><tr><th>Сущность</th><th>Последняя синхр.</th><th class="num">Строк в посл. прогоне</th><th class="num">Всего в зеркале</th></tr></thead><tbody>'+
    ents.map(e=>`<tr><td>${esc(L[e.entity]||e.entity)}${incr[e.entity]?' <span class="tag green" style="font-size:9px;vertical-align:middle">инкр.</span>':''}</td>
      <td class="muted2">${fdt(e.last_sync)}</td>
      <td class="num">${(e.last_run_rows||0).toLocaleString('ru-RU')}</td>
      <td class="num">${mir[e.entity]!=null?mir[e.entity].toLocaleString('ru-RU'):'<span class="muted2">—</span>'}</td></tr>`).join('')+
    '</tbody></table>';
}

// ---------- SETTINGS ----------
PAGES.settings=(c)=>{
  c.appendChild(el(`<div class="grid-2 section-gap" style="margin-top:0">
    <div class="panel"><div class="panel-h"><h3>Воронки · этапы</h3><span class="ph-sub">настраиваются без программиста</span></div><div class="panel-b">
      <div style="font-weight:600;margin-bottom:8px">B2C · розница</div><div class="chips" style="margin-bottom:16px">${DB.stagesB2C.map(s=>`<span class="chip on">${s}</span>`).join('')}<span class="chip">${ic('i-plus','sm')}</span></div>
      <div style="font-weight:600;margin-bottom:8px">B2B · опт</div><div class="chips">${DB.stagesB2B.map(s=>`<span class="chip on">${s}</span>`).join('')}<span class="chip">${ic('i-plus','sm')}</span></div>
    </div></div>
    <div class="panel"><div class="panel-h"><h3>Локализация</h3></div><div class="panel-b">
      <div class="ctx-row"><span>Интерфейс</span><b>Русский</b></div>
      <div class="ctx-row"><span>Валюты</span><b>Сом · рубль (переключение)</b></div>
      <div class="ctx-row"><span>Часовой пояс</span><b>UTC+5</b></div>
      <div class="ctx-row"><span>Курс для отчётов</span><b>НБ КР / вручную ↓</b></div>
    </div></div>
  </div>`));

  // --- Курс валюты: ручной ввод + авто из НБ КР ---
  const fxPanel=el(`<div class="panel section-gap" style="margin-top:0"><div class="panel-h"><h3>Курс валюты · сом ↔ рубль</h3><span class="ph-sub">ручной ввод или авто (НБ КР)</span></div><div class="panel-b">
    <div class="note blue">${ic('i-info','sm')} В проде пересчёт валют выполняет 1С по курсу НБ КР. Здесь можно задать курс вручную (сохранится в браузере) или подтянуть из НБ КР.</div>
    <div class="row wrap section-gap" style="gap:12px;align-items:flex-end">
      <div class="fld" style="margin:0"><label>1 сом = ₽</label><input data-fx="rate" type="number" step="0.01" min="0" style="width:130px" value="${DB.fx.RUB}"></div>
      <button class="btn primary" data-fx="save">${ic('i-check2','sm')} Сохранить</button>
      <button class="btn" data-fx="nbkr">${ic('i-sync','sm')} Обновить из НБ КР</button>
    </div>
    <div class="muted2" data-fx="info" style="font-size:12px;margin-top:10px">Текущий курс: 1 сом = ${DB.fx.RUB} ₽</div>
  </div></div>`);
  const fxInput=fxPanel.querySelector('[data-fx=rate]');
  const fxInfo=fxPanel.querySelector('[data-fx=info]');
  fxPanel.querySelector('[data-fx=save]').onclick=()=>{
    const v=parseFloat(fxInput.value);
    if(!(v>0)){ toast('Введите корректный курс','i-info','#d97706'); return; }
    setFxRub(v); fxInfo.textContent='Курс сохранён: 1 сом = '+v+' ₽ (вручную)'; toast('Курс сохранён','i-money');
  };
  fxPanel.querySelector('[data-fx=nbkr]').onclick=async()=>{
    fxInfo.textContent='Запрос курса из НБ КР…';
    const r=await api('/api/fx');
    if(r.ok && r.data && r.data.rub>0){
      setFxRub(r.data.rub); fxInput.value=r.data.rub;
      fxInfo.textContent='Курс из НБ КР: 1 сом = '+r.data.rub+' ₽'+(r.data.date?(' · '+r.data.date):'');
      toast('Курс обновлён из НБ КР','i-sync');
    } else {
      fxInfo.textContent='Авто-курс заработает после подключения backend/1С (эндпоинт /api/fx). Пока задайте вручную.';
      toast('Авто-курс — нужен backend/1С','i-info','#d97706');
    }
  };
  c.appendChild(fxPanel);

  c.appendChild(el(`<div class="grid-2 section-gap">
    <div class="panel"><div class="panel-h"><h3>Безопасность</h3></div><div class="panel-b">
      ${['HTTPS / TLS 1.3','Аутентификация по логину + 2FA','Разграничение доступа по ролям','Логирование действий','Шифрование чувствительных данных','Ежедневный бэкап · хранение 30 дней'].map(s=>`<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line)"><span class="yes" style="color:var(--accent2)">${ic('i-check2','sm')}</span><span style="font-size:13px">${s}</span></div>`).join('')}
    </div></div>
    <div class="panel"><div class="panel-h"><h3>Собственность</h3></div><div class="panel-b">
      <div class="note">${ic('i-info','sm')} Исходный код в приватном GitHub заказчика. Wiki с инструкциями. Аккаунты CloudFlare/GreenAPI/Meta переводятся на заказчика к приёмке. Без vendor-lock.</div>
      <button class="btn section-gap" style="width:100%;justify-content:center" onclick="toast('Экспорт всей базы запущен','i-doc')">${ic('i-doc','sm')} Экспорт всей базы</button>
    </div></div>
  </div>`));
};

// ---------- currency ----------
// Курс рубля: ручной override из localStorage имеет приоритет над демо-значением.
function setFxRub(v){ DB.fx.RUB=v; try{ localStorage.setItem('pharmaFxRub', String(v)); }catch(e){} }
try{ const _r=parseFloat(localStorage.getItem('pharmaFxRub')); if(_r>0) DB.fx.RUB=_r; }catch(e){}
$('#curSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{
  $('#curSeg').querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');
  state.cur=b.dataset.cur;renderPage();toast('Валюта: '+(state.cur==='KGS'?'сом (Кыргызстан)':'рубль'),'i-money');});

// ---------- theme ----------
function applyTheme(t){
  state.theme=t;
  document.body.classList.toggle('light',t==='light');
  $('#themeBtn')?.querySelector('use')?.setAttribute('href',t==='light'?'#i-moon':'#i-sun');
  try{localStorage.setItem('pllatoTheme',t);}catch(e){}
}
$('#themeBtn').onclick=()=>{const t=state.theme==='light'?'dark':'light';applyTheme(t);
  toast('Тема: '+(t==='light'?'светлая':'тёмная'),t==='light'?'i-sun':'i-moon','var(--accent)');};

// ---------- Документы CRM (подшивка) ----------
// Реестр документов проекта. Файлы лежат в app/pharmacy/docs/.
// Сюда же подшиваем все будущие документы (протоколы, КП, ТЗ, инструкции).
const DOCS = [
  { id:'zadachi-2026-06-02', title:'Задачи проекта', date:'02.06.2026',
    desc:'Список задач по итогам встречи (скелет + интеграции)', file:'docs/zadachi-2026-06-02.pdf',
    type:'PDF', size:'0,3 МБ' },
  { id:'protocol-2026-06-02', title:'Протокол встречи', date:'02.06.2026',
    desc:'Обзор и утверждение скелета CRM', file:'docs/protocol-2026-06-02.pdf',
    type:'PDF', size:'0,5 МБ' },
];
function docEsc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function renderDocsPop(){
  const pop=$('#docsPop'); if(!pop) return;
  const rows = DOCS.length ? DOCS.map(d=>`
    <a class="doc-row" href="${docEsc(d.file)}" target="_blank" rel="noopener" title="Открыть: ${docEsc(d.title)}">
      <div class="di">${docEsc(d.type||'PDF')}</div>
      <div style="min-width:0">
        <div class="dt">${docEsc(d.title)}</div>
        <div class="ds">${docEsc(d.date)} · ${docEsc(d.desc)} · ${docEsc(d.size||'')}</div>
      </div>
      <span class="dl">${ic('i-eye','sm')}</span>
    </a>`).join('')
    : `<div class="dp-empty">Документов пока нет</div>`;
  pop.innerHTML =
    `<div class="dp-h"><b>Документы</b><span class="dp-cnt">${DOCS.length} ${plural(DOCS.length,'файл','файла','файлов')}</span></div>`
    + rows
    + `<div class="dp-foot">Все документы проекта подшиваются здесь</div>`;
}
function toggleDocsPop(force){
  const pop=$('#docsPop'); if(!pop) return;
  const show = force!=null ? force : pop.hidden;
  if(show) renderDocsPop();
  pop.hidden = !show;
}
$('#docsBtn')?.addEventListener('click',e=>{e.stopPropagation();toggleDocsPop();});
document.addEventListener('click',e=>{
  const p=$('#docsPop');
  if(p && !p.hidden && !e.target.closest('.docs-wrap')) p.hidden=true;
});

// ============================================================
//  Плавающий виджет чатов (нижний правый угол) — как в ELC CRM.
//  Кружок 💬 → панель со списком диалогов по каналам → переписка
//  с композером. Данные демо-мокапа: DB.threads / DB.channels.
// ============================================================
const cwEsc = (s)=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CW = { open:false, view:'list', thread:null, threads:null, source:'demo' };

// Время для строк виджета: сегодня → ЧЧ:ММ, иначе ДД.ММ.
function cwFmtTime(ts){
  if(!ts) return '';
  const d=new Date(ts), now=new Date();
  return d.toDateString()===now.toDateString()
    ? d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})
    : d.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'});
}
// Нормализованный диалог: {id,name,av,groupKey,groupName,chType,unread,time,last,online,phone,msgs,live,loaded}
function cwNormFromDemo(){
  return DB.threads.map(t=>{
    const ch=DB.channels.find(c=>c.id===t.ch)||{id:t.ch,name:'Прочее',type:'wp'};
    return { id:t.id, name:t.name, av:t.av||avBg(t.name), groupKey:ch.id, groupName:ch.name,
      chType:ch.type, unread:t.unread||0, time:t.time||'', last:t.last||'', online:t.online,
      msgs:(t.msgs||[]).map(m=>({dir:m.dir,t:m.t,tm:m.tm||''})), live:false, loaded:true };
  });
}
function cwNormFromLive(items){
  return (items||[]).map(it=>({
    id:it.id, name:it.title||it.phone||'Диалог', av:avBg(it.title||it.phone||it.id),
    groupKey:it.ch||'wa', groupName:it.chName||chLabel(it.ch||'wa'), chType:it.ch||'wa',
    unread:it.unread||0, time:cwFmtTime(it.last_ts), last:it.preview||'', online:false,
    phone:it.phone||'', msgs:[], live:true, loaded:false }));
}
// Все диалоги (ленивая инициализация демо-составом для бейджа до первой загрузки).
function cwAll(){ if(!CW.threads) CW.threads=cwNormFromDemo(); return CW.threads; }
function cwFindThread(tid){ return cwAll().find(t=>t.id===tid); }
// Подтянуть диалоги из CRM (live); при недоступности — демо-фолбэк.
async function cwLoadThreads(){
  const r=await api('/api/inbox/threads');
  // живые диалоги показываем, как только они появятся; пока их нет — оставляем демо-ленту (мокап «живой»)
  if(r.ok && r.data && Array.isArray(r.data.items) && r.data.items.length){
    CW.source='live'; CW.threads=cwNormFromLive(r.data.items);
  } else {
    CW.source='demo'; CW.threads=cwNormFromDemo();
  }
}

function cwUnreadTotal(){ return cwAll().reduce((s,t)=>s+(t.unread||0),0); }

function cwEnsureStyles(){
  if(document.getElementById('cw-styles')) return;
  const s=document.createElement('style'); s.id='cw-styles';
  s.textContent=`
  #cw-root{position:fixed;bottom:74px;right:20px;z-index:90;font-family:inherit}
  .cw-fab{width:56px;height:56px;border-radius:28px;background:var(--wa);color:#fff;border:none;cursor:pointer;
    box-shadow:0 6px 20px rgba(0,0,0,.28);display:grid;place-items:center;position:relative;transition:transform .14s}
  .cw-fab:hover{transform:scale(1.06)}
  .cw-fab .svg-i{width:26px;height:26px}
  .cw-fab-badge{position:absolute;top:-3px;right:-3px;background:var(--red);color:#fff;border-radius:12px;min-width:22px;height:22px;
    padding:0 6px;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg)}
  .cw-panel{width:380px;max-width:calc(100vw - 36px);height:540px;max-height:calc(100vh - 120px);
    background:var(--panel);border:1px solid var(--line);border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.4);
    display:flex;flex-direction:column;overflow:hidden}
  .cw-head{background:var(--wa);color:#fff;padding:12px 14px;display:flex;align-items:center;gap:10px;flex:0 0 auto}
  .cw-head .cw-title{flex:1;font-weight:700;font-size:14px}
  .cw-head .cw-sub{font-size:11px;opacity:.9;margin-top:1px;font-weight:500}
  .cw-iconbtn{background:rgba(255,255,255,.2);border:none;color:#fff;width:30px;height:30px;border-radius:50%;
    cursor:pointer;display:grid;place-items:center}
  .cw-iconbtn:hover{background:rgba(255,255,255,.35)}
  .cw-iconbtn .svg-i{width:16px;height:16px}
  .cw-body{flex:1;overflow-y:auto;background:var(--bg)}
  .cw-sec{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:8px;padding:7px 14px;
    background:var(--panel2);border-bottom:1px solid var(--line);font-size:11px;font-weight:700;color:var(--muted)}
  .cw-sec .cw-sec-ic{width:14px;height:14px}
  .cw-sec-unread{background:var(--wa);color:#fff;min-width:18px;height:18px;padding:0 5px;border-radius:9px;
    font-size:10px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;margin-left:auto}
  .cw-row{display:flex;gap:10px;padding:10px 14px;border-bottom:1px solid var(--line);cursor:pointer}
  .cw-row:hover{background:var(--panel)}
  .cw-av{width:40px;height:40px;border-radius:50%;color:#fff;display:grid;place-items:center;font-weight:800;font-size:13px;flex:0 0 auto}
  .cw-rbody{flex:1;min-width:0}
  .cw-rname{font-weight:700;font-size:13px;color:var(--txt);display:flex;justify-content:space-between;gap:8px}
  .cw-rtime{font-size:10px;color:var(--muted);flex:0 0 auto;font-weight:600}
  .cw-rprev{font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;
    display:flex;align-items:center;gap:6px}
  .cw-rprev span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .cw-runread{background:var(--wa);color:#fff;border-radius:10px;padding:0 6px;font-size:10px;font-weight:800;
    min-width:18px;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;margin-left:auto}
  .cw-empty{padding:34px 14px;text-align:center;color:var(--muted);font-size:12px}
  .cw-chat-head{display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--panel2);
    border-bottom:1px solid var(--line);flex:0 0 auto}
  .cw-chat-head .cw-back{background:none;border:none;color:var(--txt);cursor:pointer;width:30px;height:30px;
    display:grid;place-items:center;border-radius:8px}
  .cw-chat-head .cw-back:hover{background:var(--panel)}
  .cw-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:6px;background:var(--bg)}
  .cw-msg{max-width:78%;padding:8px 11px;border-radius:13px;font-size:13px;line-height:1.4;word-wrap:break-word}
  .cw-msg .cw-mt{font-size:9.5px;opacity:.65;margin-top:3px;text-align:right}
  .cw-msg.in{align-self:flex-start;background:var(--panel2);color:var(--txt);border-bottom-left-radius:4px}
  .cw-msg.out{align-self:flex-end;background:var(--wa);color:#fff;border-bottom-right-radius:4px}
  .cw-msg.ai{align-self:flex-start;background:var(--accent-soft);color:var(--txt);border:1px solid var(--accent);border-bottom-left-radius:4px}
  .cw-ai-tag{font-size:9px;font-weight:800;color:var(--accent);text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px}
  .cw-comp{flex:0 0 auto;padding:9px 10px;background:var(--panel2);border-top:1px solid var(--line);display:flex;gap:7px;align-items:flex-end}
  .cw-comp textarea{flex:1;border:1px solid var(--line);border-radius:10px;padding:8px 11px;font-size:13px;resize:none;
    max-height:100px;font-family:inherit;background:var(--bg);color:var(--txt);outline:none}
  .cw-comp textarea:focus{border-color:var(--wa)}
  .cw-comp .cw-send{background:var(--wa);color:#fff;border:none;border-radius:10px;width:38px;height:38px;
    cursor:pointer;flex:0 0 auto;display:grid;place-items:center}
  .cw-comp .cw-send .svg-i{width:17px;height:17px}
  `;
  document.head.appendChild(s);
}

function initChatWidget(){
  cwEnsureStyles();
  if(!document.getElementById('cw-root')){
    const r=document.createElement('div'); r.id='cw-root'; document.body.appendChild(r);
  }
  cwRender();
  cwLoadThreads().then(()=>cwRender()).catch(()=>{});
}

function cwRender(){
  const root=document.getElementById('cw-root'); if(!root) return;
  if(!CW.open){
    const n=cwUnreadTotal();
    root.innerHTML=`<button class="cw-fab" id="cw-fab" title="Чаты WhatsApp / Instagram">${ic('i-chat')}${n>0?`<span class="cw-fab-badge">${n>99?'99+':n}</span>`:''}</button>`;
    $('#cw-fab',root).onclick=()=>{ CW.open=true; CW.view='list'; cwRender();
      cwLoadThreads().then(()=>{ if(CW.open&&CW.view==='list') cwRender(); }); };
    return;
  }
  if(CW.view==='chat' && CW.thread){ cwRenderChat(root); }
  else { cwRenderList(root); }
}

function cwRenderList(root){
  const all=cwAll();
  const total=all.length, unread=cwUnreadTotal();
  // группируем по каналу, как «📞 Канал» в ELC
  const byCh=new Map();
  all.forEach(t=>{ if(!byCh.has(t.groupKey)) byCh.set(t.groupKey,[]); byCh.get(t.groupKey).push(t); });
  const groups=[...byCh.entries()].map(([key,list])=>{
    const ch={name:list[0].groupName||'Прочее', type:list[0].chType||'wp'};
    const u=list.reduce((s,t)=>s+(t.unread||0),0);
    list.sort((a,b)=>(b.unread||0)-(a.unread||0));
    return {ch,list,unread:u};
  }).sort((a,b)=>(b.unread-a.unread)||a.ch.name.localeCompare(b.ch.name,'ru'));

  let body='';
  if(total===0){ body='<div class="cw-empty">📭 Диалогов нет</div>'; }
  else groups.forEach(g=>{
    body+=`<div class="cw-sec"><svg class="svg-i cw-sec-ic" style="color:${chColor(g.ch.type)}"><use href="#${chIcon(g.ch.type)}"/></svg>
      <span>${cwEsc(g.ch.name)}</span>${g.unread>0?`<span class="cw-sec-unread">${g.unread}</span>`:''}</div>`;
    body+=g.list.map(cwRowHtml).join('');
  });

  root.innerHTML=`<div class="cw-panel">
    <div class="cw-head">
      <div style="flex:1"><div class="cw-title">Чаты</div>
        <div class="cw-sub">${total} диалог${total%10===1&&total%100!==11?'':'ов'} · ${unread} непрочит.</div></div>
      <button class="cw-iconbtn" id="cw-close" title="Свернуть">${ic('i-x')}</button>
    </div>
    <div class="cw-body" id="cw-list">${body}</div>
  </div>`;
  $('#cw-close',root).onclick=()=>{ CW.open=false; cwRender(); };
  root.querySelectorAll('.cw-row').forEach(r=>r.onclick=()=>cwOpenThread(r.dataset.tid));
}

function cwRowHtml(t){
  const av=t.av||avBg(t.name);
  const prev=(t.msgs&&t.msgs.length?t.msgs[t.msgs.length-1]:null);
  const tick=(prev&&prev.dir==='out')?'✓ ':'';
  const last=t.last||(prev?prev.t:'');
  return `<div class="cw-row" data-tid="${cwEsc(t.id)}">
    <div class="cw-av" style="background:${av}">${cwEsc(initials(t.name))}</div>
    <div class="cw-rbody">
      <div class="cw-rname"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${cwEsc(t.name)}</span>
        <span class="cw-rtime">${cwEsc(t.time||'')}</span></div>
      <div class="cw-rprev"><span>${cwEsc(tick+last)}</span>${t.unread>0?`<span class="cw-runread">${t.unread}</span>`:''}</div>
    </div></div>`;
}

async function cwOpenThread(tid){
  const t=cwFindThread(tid); if(!t) return;
  CW.thread=tid; CW.view='chat'; cwRender();   // мгновенно открываем (может показать «Загрузка…»)
  t.unread=0;                                   // снять счётчик локально
  if(t.live){
    if(t.id) api('/api/inbox/threads/'+encodeURIComponent(t.id)+'/read',{method:'POST'}).catch(()=>{});
    if(!t.loaded){
      const r=await api('/api/inbox/threads/'+encodeURIComponent(t.id)+'/messages');
      if(r.ok && r.data && Array.isArray(r.data.items)){
        t.msgs=r.data.items.map(m=>({dir:m.dir,t:m.body,tm:cwFmtTime(m.ts)}));
        t.loaded=true;
      }
      if(CW.open && CW.view==='chat' && CW.thread===tid) cwRender();
    }
  }
}

function cwRenderChat(root){
  const t=cwFindThread(CW.thread); if(!t){ CW.view='list'; cwRender(); return; }
  const ch={name:t.groupName||'', type:t.chType||'wp'};
  const loading=t.live && !t.loaded;
  const msgs=loading ? '<div class="cw-empty">Загрузка…</div>' : (t.msgs||[]).map(m=>{
    const cls=m.dir==='out'?'out':(m.dir==='ai'?'ai':'in');
    const tag=m.dir==='ai'?'<div class="cw-ai-tag">AI-агент</div>':'';
    return `<div class="cw-msg ${cls}">${tag}${cwEsc(m.t)}<div class="cw-mt">${cwEsc(m.tm||'')}</div></div>`;
  }).join('');
  root.innerHTML=`<div class="cw-panel">
    <div class="cw-chat-head">
      <button class="cw-back" id="cw-back" title="К списку" style="font-size:22px;line-height:1">‹</button>
      <div class="cw-av" style="width:34px;height:34px;font-size:12px;background:${t.av||avBg(t.name)}">${cwEsc(initials(t.name))}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:13px;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${cwEsc(t.name)}</div>
        <div style="font-size:11px;color:var(--muted)">${cwEsc(ch.name)} · ${chLabel(ch.type)}${t.online?' · <span style="color:var(--accent)">онлайн</span>':''}</div>
      </div>
    </div>
    <div class="cw-msgs" id="cw-msgs">${msgs}</div>
    <div class="cw-comp">
      <textarea id="cw-input" rows="1" placeholder="Сообщение в ${cwEsc(chLabel(ch.type))}…"></textarea>
      <button class="cw-send" id="cw-send" title="Отправить">${ic('i-send')}</button>
    </div>
  </div>`;
  const back=$('#cw-back',root); if(back) back.onclick=()=>{ CW.view='list'; cwRender(); };
  const ta=$('#cw-input',root), msgsBox=$('#cw-msgs',root);
  if(msgsBox) msgsBox.scrollTop=msgsBox.scrollHeight;
  const send=async ()=>{
    const v=ta.value.trim(); if(!v) return;
    const now=new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
    t.msgs=t.msgs||[]; t.msgs.push({dir:'out',t:v,tm:now}); t.last=v; t.time=now;
    ta.value=''; ta.style.height='auto';
    cwRenderChat(root);
    if(t.live){
      const r=await api('/api/inbox/threads/'+encodeURIComponent(t.id)+'/send',{method:'POST',body:JSON.stringify({text:v})});
      if(!r.ok){ toast(r.data&&r.data.error?r.data.error:'Не доставлено','i-info','#dc2626'); return; }
      const w=r.data&&r.data.whatsapp;
      toast(w&&w.sent?'Доставлено в WhatsApp':'Сохранено · WhatsApp не настроен','i-send','var(--wa)');
    } else {
      toast('Отправлено в '+chLabel(ch.type)+' (демо)','i-send','var(--wa)');
    }
  };
  if(ta){
    ta.addEventListener('input',()=>{ ta.style.height='auto'; ta.style.height=Math.min(ta.scrollHeight,100)+'px'; });
    ta.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send(); } });
    ta.focus();
  }
  const sb=$('#cw-send',root); if(sb) sb.onclick=send;
}

// ---------- init ----------
let savedTheme='light';try{savedTheme=localStorage.getItem('pllatoTheme')||'light';}catch(e){}
applyTheme(savedTheme);
renderNav();renderRoleSel();renderPage();
initChatWidget();

// ---------- AUTH (вход / выход / Google) ----------
function getToken(){ try{return localStorage.getItem('pharmaToken')||null;}catch(e){return null;} }
function setToken(t){ try{ t?localStorage.setItem('pharmaToken',t):localStorage.removeItem('pharmaToken'); }catch(e){} }

async function api(path, opts={}){
  const headers = Object.assign({'Content-Type':'application/json'}, opts.headers||{});
  const t = AUTH.token || getToken();
  if(t) headers['Authorization'] = 'Bearer '+t;
  let res, data=null;
  try{ res = await fetch(API_BASE+path, Object.assign({}, opts, {headers})); }
  catch(e){ return {ok:false, status:0, data:{error:'Нет связи с сервером'}}; }
  try{ data = await res.json(); }catch(e){}
  return { ok: res.ok && !(data && data.ok===false), status:res.status, data };
}

function loginError(msg){ const e=$('#loginError'); if(!e) return;
  if(!msg){ e.classList.add('hide'); return; } e.textContent=msg; e.classList.remove('hide'); }
function showLogin(){ const s=$('#loginScreen'); if(s) s.style.display='grid'; }
function hideLogin(){ const s=$('#loginScreen'); if(s) s.style.display='none'; }

// Роли вне мокап-матрицы (например superadmin) для навигации показываем как владельца.
function applyUser(user){
  AUTH.user = user;
  $('#userName').textContent = user.name || user.login || 'Пользователь';
  $('#userRole').textContent = user.roleName || user.role || '';
  $('#userAv').textContent = initials(user.name || user.login || '?');
  const r = (DB.access && DB.access[user.role]) ? user.role : 'owner';
  state.role = r;
  const sel=$('#roleSel'); if(sel){ const o=[...sel.options].find(x=>x.value===r); if(o) sel.value=r; }
  if(!DB.access[state.role].includes(state.page)) state.page = DB.access[state.role][0];
  renderRoleSel(); renderNav(); renderPage();
  // реальный счётчик активных задач для бейджа в меню
  if((DB.access[state.role]||[]).includes('tasks')) api('/api/tasks?status=active').then(r=>{ if(r&&r.ok){ window.__taskBadge=(r.data.totals||{}).active||0; renderNav(); } }).catch(()=>{});
}

async function doLogin(ident, password){
  loginError('');
  const btn=$('#loginSubmit'); const old=btn.textContent; btn.disabled=true; btn.textContent='Вход…';
  const r = await api('/api/auth/login',{method:'POST',body:JSON.stringify({login:ident,password})});
  btn.disabled=false; btn.textContent=old;
  if(!r.ok){ loginError((r.data&&r.data.error)||'Не удалось войти'); return; }
  AUTH.token=r.data.token; setToken(r.data.token); applyUser(r.data.user); hideLogin();
  toast('Вы вошли как '+(r.data.user.name||r.data.user.login),'i-check2');
}
async function doGoogle(credential){
  loginError('');
  const r = await api('/api/auth/google',{method:'POST',body:JSON.stringify({id_token:credential})});
  if(!r.ok){ loginError((r.data&&r.data.error)||'Google-вход не удался'); return; }
  AUTH.token=r.data.token; setToken(r.data.token); applyUser(r.data.user); hideLogin();
  toast('Вход через Google','i-check2');
}
async function doLogout(){
  try{ await api('/api/auth/logout',{method:'POST'}); }catch(e){}
  AUTH={token:null,user:null}; setToken(null);
  if(window.google&&google.accounts&&google.accounts.id) google.accounts.id.disableAutoSelect();
  showLogin();
  toast('Вы вышли','i-logout','var(--muted)');
}

function initGoogleBtn(tries=0){
  if(!(window.google&&google.accounts&&google.accounts.id)){
    if(tries<20) setTimeout(()=>initGoogleBtn(tries+1),300);
    return;
  }
  try{
    google.accounts.id.initialize({ client_id:GOOGLE_CLIENT_ID, callback:(resp)=>doGoogle(resp.credential) });
    google.accounts.id.renderButton($('#googleBtn'), { theme:'filled_black', size:'large', shape:'pill', text:'signin_with', width:330 });
  }catch(e){ /* GIS не загрузился (офлайн/блокировка) — остаётся вход по паролю */ }
}

async function bootAuth(){
  const form=$('#loginForm');
  if(form) form.addEventListener('submit', e=>{ e.preventDefault();
    doLogin($('#loginIdent').value.trim(), $('#loginPass').value); });
  const logoutBtn=document.querySelector('.user-chip .icon-btn');
  if(logoutBtn) logoutBtn.onclick=doLogout;
  initGoogleBtn();

  const t=getToken();
  if(t){ AUTH.token=t; const me=await api('/api/auth/me');
    if(me.ok){ applyUser(me.data.user); hideLogin(); return; }
    setToken(null); AUTH.token=null;
  }
  showLogin();
}
bootAuth();
