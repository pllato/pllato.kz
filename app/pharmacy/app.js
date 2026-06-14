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
  bg.addEventListener('click',e=>{if(e.target===bg)closeModal();});
  $('#modal-root').appendChild(bg);return bg;
}
const closeModal = ()=>{ $('.modal-bg')?.remove(); try{ history.replaceState(null,'','#/'+state.page); }catch(e){} };

// ---------- URL-роутинг: вкладка в #hash (перезагрузка не сбрасывает) + прямые ссылки на сущности ----------
function parseHash(){ const h=(location.hash||'').replace(/^#\/?/,''); const parts=h.split('/'); return { page: parts[0]||'', sub: parts.slice(1).join('/')||'' }; }
const DEEPLINK = {
  tasks:   async(id)=>{ const r=await api('/api/tasks?status=all'); const t=r&&r.ok&&(r.data.items||[]).find(x=>x.id===id); if(t) taskModalLive(t,()=>go('tasks')); },
  orders:  async(id)=>{ const r=await api('/api/orders'); const o=r&&r.ok&&(r.data.items||[]).find(x=>x.id===id); if(o) orderModalLive(o,()=>go('orders')); },
  clients: async(ref)=>{ const r=await api('/api/1c/contractors?limit=1&ref='+encodeURIComponent(ref)); const x=r&&r.ok&&(r.data.items||[])[0]; if(x) contractorModal(x); },
  funnels: async(id)=>{ for(const f of ['b2c','b2b']){ const r=await api('/api/deals?funnel='+f); const d=r&&r.ok&&(r.data.items||[]).find(x=>x.id===id); if(d){ state.funnel=f; renderPage(); dealModalLive(d); return; } } },
};
function applyHash(){
  const {page,sub}=parseHash();
  const allowed=allowedSections(state.role);
  const target=(page&&allowed.includes(page))?page:(allowed.includes(state.page)?state.page:(allowed[0]||'dash'));
  state.page=target; renderNav(); renderPage();
  if(sub&&DEEPLINK[target]) DEEPLINK[target](sub);
}
function setEntityHash(page,id){ try{ history.replaceState(null,'','#/'+page+(id?('/'+id):'')); }catch(e){} }
window.addEventListener('hashchange', applyHash);

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
    {id:'triggers', t:'Триггеры', i:'i-flame'},
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
  integrations:['Интеграции','1С · GreenAPI · Meta'],
  settings:['Настройки','Воронки, валюты, безопасность'],
};

// ---------- render shell ----------
let ACCESS_MAP={}; // role -> sections (эффективные права из БД, загружаются для админов)
function allowedSections(role){
  if(ACCESS_MAP && ACCESS_MAP[role]) return ACCESS_MAP[role];
  if(typeof AUTH!=='undefined' && AUTH.user && AUTH.user.role===role && Array.isArray(AUTH.user.sections)) return AUTH.user.sections;
  return (DB.access && DB.access[role]) || [];
}
function renderNav(){
  const allowed=allowedSections(state.role);
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
    const allowed=allowedSections(state.role);if(!allowed.includes(state.page))state.page=allowed[0];
    renderNav();renderPage();toast(`Роль: <b>${r.name}</b> — показаны только доступные разделы`,'i-shield',r.color);};
}
function go(p, sub){
  document.getElementById('sidebar').classList.remove('open');
  const h='#/'+p+(sub?('/'+sub):'');
  if(location.hash===h){ state.page=p; renderNav(); renderPage(); if(sub&&DEEPLINK[p])DEEPLINK[p](sub); }
  else location.hash=h;
}
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
PAGES.funnels=async(c)=>{
  const fUsers=await fetchUsers();
  const fStores=await fetchStores();
  const fStages=state.funnel==='b2c'?DB.stagesB2C:DB.stagesB2B;
  const tbar=el(`<div class="toolbar">
    <div class="seg" id="funnelSeg"><button class="${state.funnel==='b2c'?'on':''}" data-f="b2c">B2C · розница</button><button class="${state.funnel==='b2b'?'on':''}" data-f="b2b">B2B · опт</button></div>
    <select class="sel" id="flMgr" title="Фильтр по ответственному"><option value="">Все ответственные</option>${fUsers.map(u=>`<option>${esc(u.name)}</option>`).join('')}</select>
    <select class="sel" id="flStage" title="Фильтр по этапу"><option value="">Все этапы</option>${fStages.map(s=>`<option>${esc(s)}</option>`).join('')}</select>
    ${storeSelectHtml(fStores,'','class="sel" id="flStore" title="Фильтр по точке"','Все точки')}
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
  let demoMode=false, current=[], flMgr='', flStage='', flStore='';
  tbar.querySelector('#flMgr').onchange=e=>{flMgr=e.target.value;renderBoard();};
  tbar.querySelector('#flStage').onchange=e=>{flStage=e.target.value;renderBoard();};
  tbar.querySelector('#flStore').onchange=e=>{flStore=e.target.value;renderBoard();};
  function renderBoard(){
    const stages=state.funnel==='b2c'?DB.stagesB2C:DB.stagesB2B;
    board.innerHTML=''; let total=0;
    (flStage?stages.filter(s=>s===flStage):stages).forEach(stg=>{
      let list=current.filter(d=>d.stage===stg); if(flMgr) list=list.filter(d=>(d.mgr||'')===flMgr); if(flStore) list=list.filter(d=>(d.store_key||'')===flStore); const sum=list.reduce((a,d)=>a+(d.amount||d.sum||0),0); total+=list.length;
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
            if(r.ok){ toast('Сделка перенесена в «'+stg+'»','i-funnel'); if(r.data&&r.data.order_created)toast('Сделка закрыта → создан черновик заказа (раздел «Заказы»)','i-cart','#16a34a'); } else { d.stage=old; renderBoard(); toast('Не удалось сохранить','i-x','#dc2626'); } } });
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
async function newDealLive(onSaved){
  const ndStores=await fetchStores();
  const stages=state.funnel==='b2c'?DB.stagesB2C:DB.stagesB2B;
  const bg=openModal(`<div class="modal-h"><div><h3>Новая сделка</h3><div class="mh-sub">${state.funnel==='b2c'?'B2C · розница':'B2B · опт'}</div></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="fld"><label>Клиент — поиск в 1С или ввод вручную</label><div style="position:relative"><div class="fld-in" style="width:100%">${ic('i-search','sm')}<input data-nd="client" placeholder="ФИО или название" autocomplete="off" style="width:100%"></div><div id="ndSug" class="panel" style="position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:40;display:none;max-height:200px;overflow:auto;box-shadow:var(--shadow-lg)"></div></div></div>
    <div class="fld-row"><div class="fld"><label>Телефон</label><input data-nd="phone"></div><div class="fld"><label>Сумма, с</label><input data-nd="amount" type="number" placeholder="0"></div></div>
    <div class="fld-row"><div class="fld"><label>Этап</label><select data-nd="stage">${stages.map(s=>`<option>${esc(s)}</option>`).join('')}</select></div><div class="fld"><label>Источник</label><select data-nd="source"><option value="">—</option><option>WhatsApp</option><option>Instagram</option><option>Сайт</option><option>Звонок</option><option>Сарафан</option></select></div></div>
    <div class="fld-row"><div class="fld"><label>Ответственный</label><input data-nd="mgr" value="${esc((AUTH.user||{}).name||'')}"></div><div class="fld"><label>Точка</label>${storeSelectHtml(ndStores,'','data-nd="store_key"','— точка —')}</div></div>
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
    const body={funnel:state.funnel,stage:bg.querySelector('[data-nd=stage]').value,client_ref:ref,client_name:name,phone:bg.querySelector('[data-nd=phone]').value.trim(),amount:Number(bg.querySelector('[data-nd=amount]').value)||0,source:bg.querySelector('[data-nd=source]').value,mgr:bg.querySelector('[data-nd=mgr]').value.trim(),store_key:bg.querySelector('[data-nd=store_key]').value||null,note:bg.querySelector('[data-nd=note]').value.trim()};
    const r=await api('/api/deals',{method:'POST',body:JSON.stringify(body)});
    if(!r.ok){toast('Не удалось создать сделку','i-x','#dc2626');return;}
    closeModal(); toast('Сделка создана','i-funnel'); onSaved&&onSaved();
  };
}
async function dealModalLive(d){
  setEntityHash('funnels', d.id);
  const dmStores=await fetchStores();
  const stages=state.funnel==='b2c'?DB.stagesB2C:DB.stagesB2B;
  const bg=openModal(`<div class="modal-h"><div class="cell-name"><span class="avatar-xs" style="width:40px;height:40px;font-size:14px;background:${avBg(d.client_name||'?')}">${initials(d.client_name||'?')}</span><div><h3>${esc(d.client_name||'—')}</h3><div class="mh-sub">${esc(d.phone||'')} ${d.client_ref?'· привязан к 1С':''}</div></div></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="fld-row"><div class="fld"><label>Этап</label><select data-dm="stage">${stages.map(s=>`<option ${s===d.stage?'selected':''}>${esc(s)}</option>`).join('')}</select></div><div class="fld"><label>Сумма, с</label><input data-dm="amount" type="number" value="${d.amount||0}"></div></div>
    <div class="fld-row"><div class="fld"><label>Ответственный</label><input data-dm="mgr" value="${esc(d.mgr||'')}"></div><div class="fld"><label>Источник</label><input data-dm="source" value="${esc(d.source||'')}"></div></div>
    <div class="fld"><label>Точка</label>${storeSelectHtml(dmStores,d.store_key,'data-dm="store_key"','— точка —')}</div>
    <div class="fld"><label>Комментарий</label><input data-dm="note" value="${esc(d.note||'')}"></div>
  </div>
  <div class="modal-f"><button class="btn" id="dmDel" style="color:var(--red)">${ic('i-x','sm')} Удалить</button><button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="dmSave">Сохранить</button></div>`,'wide');
  bg.querySelector('#dmSave').onclick=async()=>{
    const body={stage:bg.querySelector('[data-dm=stage]').value,amount:Number(bg.querySelector('[data-dm=amount]').value)||0,mgr:bg.querySelector('[data-dm=mgr]').value.trim(),source:bg.querySelector('[data-dm=source]').value.trim(),store_key:bg.querySelector('[data-dm=store_key]').value||null,note:bg.querySelector('[data-dm=note]').value.trim()};
    const r=await api('/api/deals/'+d.id,{method:'POST',body:JSON.stringify(body)});
    if(!r.ok){toast('Ошибка сохранения','i-x','#dc2626');return;} closeModal(); toast('Сохранено','i-check2'); if(r.data&&r.data.order_created)toast('Сделка закрыта → создан черновик заказа (раздел «Заказы»)','i-cart','#16a34a'); if(window.__reloadFunnels)window.__reloadFunnels();
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
PAGES.clients=async(c)=>{
  const clStores=await fetchStores();
  const tbar=el(`<div class="toolbar">
    <div class="fld-in">${ic('i-search','sm')}<input placeholder="Поиск по ФИО, телефону, коду, ИНН…" data-cl="q"></div>
    <select class="sel" data-cl="seg"><option value="">Все сегменты</option><option value="b2c">B2C · розница</option><option value="b2b">B2B · опт</option><option value="doctor">Врачи-партнёры</option><option value="supplier">Поставщики</option></select>
    ${storeSelectHtml(clStores,'','class="sel" data-cl="store" title="Покупали в точке"','Покупали: все точки')}
    <div class="spacer"></div>
    <span class="ph-sub" data-cl="cnt"></span>
    <button class="btn primary" id="newClientBtn">${ic('i-plus','sm')} Клиент</button>
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
    const q=qInput.value.trim(), seg=segSel.value, sv=tbar.querySelector('[data-cl=store]').value;
    const r=await api('/api/1c/contractors?limit='+PAGE+'&offset='+offset+(seg?('&segment='+seg):'')+(q?('&q='+encodeURIComponent(q)):'')+(sv?('&store='+encodeURIComponent(sv)):''));
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
  tbar.querySelector('[data-cl=store]').onchange=()=>{offset=0;load();};
  tbar.querySelector('#newClientBtn').onclick=()=>newClientModal(load);
  pgPrev.onclick=()=>{ if(offset>0){offset=Math.max(0,offset-PAGE);load();$('#content').scrollTop=0;} };
  pgNext.onclick=()=>{ if(offset+PAGE<total){offset+=PAGE;load();$('#content').scrollTop=0;} };
  load(); loadSegments();
  c.appendChild(panel); c.appendChild(pager);
  c.appendChild(el(`<div class="note section-gap">${ic('i-info','sm')} База клиентов — контрагенты из 1С. Сегмент: B2C (физлица, розница) · B2B (юр.лица и ИП, опт) · Врачи-партнёры · Поставщики. Выручка по сегментам — из регистра «Продажи» 1С (розница без контрагента учтена в B2C). Синхронизация раз в 30 мин.</div>`));
};
function contractorModal(r){
  setEntityHash('clients', r.ref_key);
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
  const bg=openModal(`<div class="modal-h"><div><h3>Новый клиент</h3><div class="mh-sub">Создастся в 1С как контрагент</div></div>
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
    toast('Клиент «'+name+'» создаётся в 1С (появится после синхронизации)','i-users');
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
const ORDER_ST={new:['Новый','blue'],queued_1c:['Очередь 1С','amber'],synced_1c:['В 1С','green'],done:['Готово','green'],cancelled:['Отменён','red']};
function ordStTag(s){const m=ORDER_ST[s]||['—',''];return `<span class="tag ${m[1]}">${esc(m[0])}</span>`;}
function ordItemsText(j){ let a=[]; try{a=JSON.parse(j||'[]');}catch(e){} return a.map(x=>(x.name||'')+(x.qty>1?(' ×'+x.qty):'')).join(', '); }
PAGES.orders=async(c)=>{
  const oStores=await fetchStores();
  const tbar=el(`<div class="toolbar">
    <div class="seg" data-or="filter"><button class="on" data-s="all">Все</button><button data-s="new">Новые</button><button data-s="queued_1c">Очередь 1С</button><button data-s="synced_1c">В 1С</button><button data-s="done">Готово</button></div>
    ${storeSelectHtml(oStores,'','class="sel" data-or="store" title="Точка"','Все точки')}
    <div class="spacer"></div><span class="ph-sub" data-or="cnt"></span><button class="btn primary" id="newOrderBtn">${ic('i-plus','sm')} Заказ</button></div>`);
  const cards=el(`<div class="cards-row section-gap"></div>`);
  const panel=el(`<div class="panel section-gap"><table class="tbl"><thead><tr><th>Клиент</th><th>Состав</th><th class="num">Сумма</th><th>Статус</th><th>№ 1С</th></tr></thead><tbody><tr><td colspan="5" class="muted2" style="padding:16px">Загрузка…</td></tr></tbody></table></div>`);
  c.appendChild(tbar); c.appendChild(cards); c.appendChild(panel);
  c.appendChild(el(`<div class="note blue section-gap">${ic('i-info','sm')} Заказы из CRM (звонок/WhatsApp/форма). Состав и сумма — из каталога 1С. «Отправить в 1С» ставит заказ в очередь записи: агент создаст «Заказ покупателя» в 1С (Фаза 2, сначала на тестовой базе).</div>`));
  const cnt=tbar.querySelector('[data-or=cnt]'), seg=tbar.querySelector('[data-or=filter]');
  let status='all';
  seg.querySelectorAll('button').forEach(b=>b.onclick=()=>{ seg.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); status=b.dataset.s; load(); });
  tbar.querySelector('#newOrderBtn').onclick=()=>newOrderLive(load);
  tbar.querySelector('[data-or=store]').onchange=()=>load();
  async function load(){
    const tb=panel.querySelector('tbody'); tb.innerHTML=`<tr><td colspan="5" class="muted2" style="padding:16px">Загрузка…</td></tr>`;
    const r=await api('/api/orders'+(status!=='all'?('?status='+status):''));
    if(!r.ok){ cards.innerHTML=miniStat('i-cart','#0891b2','Заказы','демо'); tb.innerHTML='<tr><td colspan="5" class="muted2" style="padding:16px">Демо-режим (нет связи)</td></tr>'; return; }
    const t=r.data.totals||{}; const sv=tbar.querySelector('[data-or=store]').value; const items=(r.data.items||[]).filter(o=>!sv||(o.store_key||'')===sv);
    cards.innerHTML=miniStat('i-cart','#0891b2','Всего заказов',t.total||0)+miniStat('i-check2','#10b981','В работе',t.active||0)+miniStat('i-money','#16a34a','Сумма',money(t.amount||0))+miniStat('i-sync','#d97706','В очереди 1С',t.queued||0);
    cnt.textContent=items.length+' заказов';
    if(!items.length){ tb.innerHTML=`<tr><td colspan="5" class="muted2" style="padding:18px">Заказов нет. Нажмите «Заказ», чтобы создать.</td></tr>`; return; }
    tb.innerHTML='';
    items.forEach(o=>{ const tr=el(`<tr style="cursor:pointer"><td><div style="font-weight:600">${esc(o.client_name||'—')}</div><div class="muted2" style="font-size:11px">${esc(o.phone||'')}${o.mgr?(' · '+esc(o.mgr)):''}</div></td><td class="muted" style="font-size:12px;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(ordItemsText(o.items))||'—'}</td><td class="num">${money(o.total||0)}</td><td>${ordStTag(o.status)}</td><td class="muted2" style="font-size:12px">${o.ext_id?esc(o.ext_id):'—'}</td></tr>`); tr.onclick=()=>orderModalLive(o,load); tb.appendChild(tr); });
  }
  load();
};
async function newOrderLive(onSaved){
  const ed=makeItemsEditor([]);
  const users=await fetchUsers();
  const noStores=await fetchStores();
  const bg=openModal(`<div class="modal-h"><div><h3>Новый заказ</h3></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="fld"><label>Клиент *</label><div style="position:relative"><div class="fld-in" style="width:100%">${ic('i-search','sm')}<input data-no="client" placeholder="поиск в 1С или ввод вручную" autocomplete="off" style="width:100%"></div><div id="noSug" class="panel" style="position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:40;display:none;max-height:200px;overflow:auto;box-shadow:var(--shadow-lg)"></div></div></div>
    <div class="fld-row"><div class="fld"><label>Телефон</label><input data-no="phone"></div><div class="fld"><label>Ответственный</label>${userSelectHtml(users,(AUTH.user||{}).name||'','data-no="mgr"')}</div></div>
    <div class="fld"><label>Точка (магазин)</label>${storeSelectHtml(noStores,'','data-no="store_key"','— точка —')}</div>
    <div class="fld"><label>Состав заказа (товары из 1С)</label><div id="noItems"></div></div>
    <div class="fld"><label>Комментарий</label><input data-no="note"></div>
  </div>
  <div class="modal-f"><button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="noSave">Создать</button></div>`);
  bg.querySelector('#noItems').appendChild(ed.node);
  const q=bg.querySelector('[data-no=client]'), sug=bg.querySelector('#noSug'); let ref=null,qt=null;
  q.addEventListener('input',()=>{ ref=null; clearTimeout(qt); const v=q.value.trim(); if(v.length<2){sug.style.display='none';return;}
    qt=setTimeout(async()=>{ const r=await api('/api/1c/contractors?limit=6&q='+encodeURIComponent(v)); if(!r.ok||!(r.data.items||[]).length){sug.style.display='none';return;}
      sug.innerHTML=r.data.items.map(x=>`<div class="doc-row" data-ref="${esc(x.ref_key)}" data-name="${esc(x.name||'')}" data-phone="${esc(x.phone||'')}"><div><div class="dt">${esc(x.name||'—')}</div><div class="ds">${esc(x.code||'')} · ${esc(x.phone||'')}</div></div></div>`).join(''); sug.style.display='block';
      sug.querySelectorAll('[data-ref]').forEach(it=>it.onclick=()=>{ref=it.dataset.ref;q.value=it.dataset.name;bg.querySelector('[data-no=phone]').value=it.dataset.phone;sug.style.display='none';}); },300); });
  bg.querySelector('#noSave').onclick=async()=>{ const name=q.value.trim(); if(!name){toast('Укажите клиента','i-info');return;} if(!ed.getItems().length){toast('Добавьте товары','i-info');return;}
    const body={client_ref:ref,client_name:name,phone:bg.querySelector('[data-no=phone]').value.trim(),items:ed.getItems(),mgr:bg.querySelector('[data-no=mgr]').value.trim(),store_key:bg.querySelector('[data-no=store_key]').value||null,note:bg.querySelector('[data-no=note]').value.trim()};
    const r=await api('/api/orders',{method:'POST',body:JSON.stringify(body)}); if(!r.ok){toast('Не удалось создать','i-x','#dc2626');return;} closeModal(); toast('Заказ создан','i-cart'); onSaved&&onSaved(); };
}
async function orderModalLive(o,onSaved){
  setEntityHash('orders', o.id);
  let init=[]; try{ init=JSON.parse(o.items||'[]'); }catch(e){}
  const ed=makeItemsEditor(init);
  const users=await fetchUsers();
  const omStores=await fetchStores();
  const bg=openModal(`<div class="modal-h"><div><h3>Заказ</h3><div class="mh-sub">${esc(o.client_name||'')}${o.ext_id?(' · 1С №'+esc(o.ext_id)):''}</div></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="fld-row"><div class="fld"><label>Клиент</label><input data-om="client_name" value="${esc(o.client_name||'')}"></div><div class="fld"><label>Телефон</label><input data-om="phone" value="${esc(o.phone||'')}"></div></div>
    <div class="fld-row"><div class="fld"><label>Статус</label><select data-om="status">${[['new','Новый'],['queued_1c','Очередь 1С'],['synced_1c','В 1С'],['done','Готово'],['cancelled','Отменён']].map(([v,tt])=>`<option value="${v}" ${v===o.status?'selected':''}>${tt}</option>`).join('')}</select></div><div class="fld"><label>Ответственный</label>${userSelectHtml(users,o.mgr,'data-om="mgr"')}</div></div>
    <div class="fld"><label>Точка (магазин)</label>${storeSelectHtml(omStores,o.store_key,'data-om="store_key"','— точка —')}</div>
    <div class="fld"><label>Состав заказа</label><div id="omItems"></div></div>
    <div class="fld"><label>Комментарий</label><input data-om="note" value="${esc(o.note||'')}"></div>
    ${o.error?`<div class="note amber">${ic('i-info','sm')} Ошибка 1С: ${esc(o.error)}</div>`:''}
  </div>
  <div class="modal-f"><button class="btn" id="omDel" style="color:var(--red)">${ic('i-x','sm')} Удалить</button><button class="btn" id="omSend">${ic('i-sync','sm')} В 1С</button><button class="btn primary" id="omSave">Сохранить</button></div>`);
  bg.querySelector('#omItems').appendChild(ed.node);
  const g=s=>bg.querySelector('[data-om='+s+']');
  const collect=()=>({client_name:g('client_name').value.trim(),phone:g('phone').value.trim(),mgr:g('mgr').value.trim(),store_key:g('store_key').value||null,note:g('note').value.trim(),items:ed.getItems()});
  bg.querySelector('#omSave').onclick=async()=>{ const r=await api('/api/orders/'+o.id,{method:'POST',body:JSON.stringify(Object.assign(collect(),{status:g('status').value}))}); if(!r.ok){toast('Ошибка','i-x','#dc2626');return;} closeModal(); toast('Сохранено','i-check2'); onSaved&&onSaved(); };
  bg.querySelector('#omSend').onclick=async()=>{ const r=await api('/api/orders/'+o.id,{method:'POST',body:JSON.stringify(Object.assign(collect(),{status:'queued_1c'}))}); if(!r.ok){toast('Ошибка','i-x','#dc2626');return;} closeModal(); toast('Заказ в очереди на запись в 1С','i-sync','#d97706'); onSaved&&onSaved(); };
  bg.querySelector('#omDel').onclick=async()=>{ if(!confirm('Удалить заказ?'))return; const r=await api('/api/orders/'+o.id,{method:'DELETE'}); if(r.ok){closeModal();toast('Удалено','i-check2');onSaved&&onSaved();} else toast('Ошибка','i-x','#dc2626'); };
}

// ---------- CATALOG ----------
PAGES.catalog=async(c)=>{
  const catStores=await fetchStores();
  const tbar=el(`<div class="toolbar">
    <div class="fld-in">${ic('i-search','sm')}<input placeholder="Поиск по названию, коду, артикулу, штрихкоду…" data-cat="q"></div>
    ${storeSelectHtml(catStores,'','class="sel" data-cat="store" title="Остаток на точке"','Остаток: все точки')}
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
    const sv=tbar.querySelector('[data-cat=store]').value;
    const r=await api('/api/1c/products?limit='+PAGE+'&offset='+offset+(q?('&q='+encodeURIComponent(q)):'')+(sv?('&store='+encodeURIComponent(sv)):''));
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
  tbar.querySelector('[data-cat=store]').onchange=()=>{offset=0;load();};
  pgPrev.onclick=()=>{ if(offset>0){offset=Math.max(0,offset-PAGE);load();$('#content').scrollTop=0;} };
  pgNext.onclick=()=>{ if(offset+PAGE<total){offset+=PAGE;load();$('#content').scrollTop=0;} };
  load();
  c.appendChild(panel); c.appendChild(pager);
  c.appendChild(el(`<div class="note blue section-gap">${ic('i-info','sm')} Товары и остатки зеркалятся из 1С (синхронизация раз в 30 мин). Цены, цвет и юр.лицо появятся, когда добавим соответствующие регистры в выгрузку 1С.</div>`));
};

// ---------- ПРОДАЖИ (зеркало регистра «Продажи» 1С) ----------
PAGES.sales=async(c)=>{
  const slStores=await fetchStores();
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
    ${storeSelectHtml(slStores,'','class="sel" data-sl="store" title="Точка"','Все точки')}
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
    const storeV=tbar.querySelector('[data-sl=store]').value; if(storeV)qs.push('store='+encodeURIComponent(storeV));
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
  tbar.querySelector('[data-sl=store]').onchange=()=>load();
  setRange(90);
};

// ---------- MARKETING ----------
PAGES.marketing=(c)=>{
  const cards=el(`<div class="cards-row"></div>`);
  const tbar=el(`<div class="toolbar section-gap">
    <div class="fld-in">${ic('i-search','sm')}<input placeholder="Поиск по коду, блогеру, типу…" data-mk="q"></div>
    <div class="spacer"></div>
    <button class="btn primary" id="newPromoBtn">${ic('i-plus','sm')} Промокод</button></div>`);
  const panel=el(`<div class="panel"><table class="tbl"><thead><tr><th>Код</th><th>Тип</th><th>Скидка</th><th>Срок</th><th>Блогер</th><th class="num">Исп.</th><th>Статус</th></tr></thead><tbody><tr><td colspan="7" class="muted2" style="font-size:13px;padding:14px">Загрузка…</td></tr></tbody></table></div>`);
  c.appendChild(cards); c.appendChild(tbar); c.appendChild(panel);
  c.appendChild(el(`<div class="note section-gap">${ic('i-info','sm')} Промокоды и акции хранятся в CRM. Скидка применяется на кассе в 1С; счётчик использований и выручку по коду подключим, когда сопоставим скидки 1С. Промокоды врачей — в разделе «Врачи-партнёры».</div>`));
  const tb=panel.querySelector('tbody'), qI=tbar.querySelector('[data-mk=q]');
  const typeTag=(t)=>{ const m={'блогерский код':'pink','сезонная':'cyan','персональный':'violet','общая акция':'blue'}; return `<span class="tag ${m[t]||''}">${esc(t||'—')}</span>`; };
  const expd=(e)=>e&&e<new Date().toISOString().slice(0,10);
  function render(items,tt){
    cards.innerHTML = miniStat('i-tag','#10b981','Активных промокодов',(tt.active||0)) + miniStat('i-doc','#2563eb','Всего промокодов',(tt.total||0)) + miniStat('i-star','#db2777','Блогерских кодов',(tt.blogger||0));
    if(!items.length){ tb.innerHTML='<tr><td colspan="7" class="muted2" style="font-size:13px;padding:16px">Промокодов нет. Нажмите «Промокод».</td></tr>'; return; }
    tb.innerHTML='';
    items.forEach(p=>{ const tr=el(`<tr class="clickable"><td><b>${esc(p.code)}</b></td><td>${typeTag(p.type)}</td>
      <td>−${p.value||0}${p.kind==='fixed'?' с':'%'}</td><td class="muted2">${p.expires_at?(esc(p.expires_at)+(expd(p.expires_at)?' ⚠':'')):'бессрочно'}</td>
      <td class="muted">${esc(p.blogger||'—')}</td><td class="num">${p.uses||0}${p.limit_uses?('/'+p.limit_uses):''}</td>
      <td><span class="tag ${p.active?'green':'red'}">${p.active?'активен':'на паузе'}</span></td></tr>`);
      tr.onclick=()=>promoModalLive(p,load); tb.appendChild(tr); });
  }
  async function load(){
    const q=qI.value.trim();
    const r=await api('/api/promos'+(q?('?q='+encodeURIComponent(q)):''));
    if(!r.ok){ cards.innerHTML=miniStat('i-tag','#10b981','Промокоды','демо'); tb.innerHTML=(DB.promos||[]).map(p=>`<tr><td><b>${esc(p.code)}</b></td><td>${typeTag(p.type)}</td><td>−${p.disc}%</td><td class="muted2">${esc(p.until||'')}</td><td class="muted">${esc(p.blogger||'—')}</td><td class="num">${p.used}</td><td><span class="tag ${p.status==='активна'?'green':'red'}">${esc(p.status)}</span></td></tr>`).join(''); return; }
    render(r.data.items||[], r.data.totals||{});
  }
  let qt=null; qI.addEventListener('input',()=>{clearTimeout(qt);qt=setTimeout(load,300);});
  tbar.querySelector('#newPromoBtn').onclick=()=>newPromoLive(load);
  load();
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
async function newPromoLive(onSaved){
  const cardTypes=await fetchCardTypes();
  const bg=openModal(`<div class="modal-h"><div><h3>Новый промокод</h3></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="fld-row"><div class="fld"><label>Код *</label><input data-np="code" placeholder="LETO20"></div><div class="fld"><label>Тип</label><select data-np="type"><option>общая акция</option><option>сезонная</option><option>блогерский код</option><option>персональный</option></select></div></div>
    <div class="fld-row"><div class="fld"><label>Скидка</label><input data-np="value" type="number" value="10"></div><div class="fld"><label>Вид</label><select data-np="kind"><option value="percent">% процент</option><option value="fixed">сом фикс.</option></select></div></div>
    <div class="fld-row"><div class="fld"><label>Срок действия</label><input type="date" data-np="exp"></div><div class="fld"><label>Лимит использований</label><input data-np="limit" type="number" placeholder="без лимита"></div></div>
    <div class="fld"><label>Блогер (если код блогерский)</label><input data-np="blogger" placeholder="@nick"></div>
    <div class="fld"><label>Вид карты в 1С (запишется как дисконтная карта)</label><select data-np="type_key"><option value="">— не писать в 1С —</option>${cardTypes.map(t=>`<option value="${esc(t.ref_key)}">${esc(t.name)}</option>`).join('')}</select></div>
    <div class="fld"><label>Комментарий</label><input data-np="note"></div>
  </div>
  <div class="modal-f"><button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="npSave">Создать</button></div>`);
  bg.querySelector('#npSave').onclick=async()=>{ const code=bg.querySelector('[data-np=code]').value.trim(); if(!code){toast('Укажите код','i-info');return;}
    const body={code,type:bg.querySelector('[data-np=type]').value,kind:bg.querySelector('[data-np=kind]').value,value:Number(bg.querySelector('[data-np=value]').value)||0,expires_at:bg.querySelector('[data-np=exp]').value,limit_uses:bg.querySelector('[data-np=limit]').value,blogger:bg.querySelector('[data-np=blogger]').value.trim(),type_key:bg.querySelector('[data-np=type_key]').value||'',note:bg.querySelector('[data-np=note]').value.trim()};
    const r=await api('/api/promos',{method:'POST',body:JSON.stringify(body)}); if(!r.ok){toast('Не удалось создать','i-x','#dc2626');return;} closeModal(); toast(body.type_key?'Промокод создаётся в 1С (дисконтная карта)':'Промокод создан','i-tag'); onSaved&&onSaved(); };
}
function promoModalLive(p,onSaved){
  const bg=openModal(`<div class="modal-h"><div><h3>Промокод ${esc(p.code)}</h3><div class="mh-sub">${esc(p.type||'')} · −${p.value||0}${p.kind==='fixed'?' с':'%'}</div></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="fld-row"><div class="fld"><label>Код</label><input data-pm="code" value="${esc(p.code||'')}"></div><div class="fld"><label>Тип</label><select data-pm="type">${['общая акция','сезонная','блогерский код','персональный'].map(x=>`<option ${x===p.type?'selected':''}>${x}</option>`).join('')}</select></div></div>
    <div class="fld-row"><div class="fld"><label>Скидка</label><input data-pm="value" type="number" value="${p.value||0}"></div><div class="fld"><label>Вид</label><select data-pm="kind"><option value="percent" ${p.kind!=='fixed'?'selected':''}>% процент</option><option value="fixed" ${p.kind==='fixed'?'selected':''}>сом фикс.</option></select></div></div>
    <div class="fld-row"><div class="fld"><label>Срок действия</label><input type="date" data-pm="exp" value="${esc(p.expires_at||'')}"></div><div class="fld"><label>Лимит</label><input data-pm="limit" type="number" value="${p.limit_uses||''}"></div></div>
    <div class="fld-row"><div class="fld"><label>Использований (конверсии)</label><input data-pm="uses" type="number" min="0" value="${p.uses||0}"></div><div class="fld"><label>Блогер</label><input data-pm="blogger" value="${esc(p.blogger||'')}"></div></div>
    <div class="fld"><label>Комментарий</label><input data-pm="note" value="${esc(p.note||'')}"></div>
  </div>
  <div class="modal-f"><button class="btn" id="pmDel" style="color:var(--red)">${ic('i-x','sm')} Удалить</button><button class="btn" id="pmToggle">${p.active?'На паузу':'Активировать'}</button><button class="btn primary" id="pmSave">Сохранить</button></div>`);
  bg.querySelector('#pmSave').onclick=async()=>{ const body={code:bg.querySelector('[data-pm=code]').value.trim(),type:bg.querySelector('[data-pm=type]').value,kind:bg.querySelector('[data-pm=kind]').value,value:Number(bg.querySelector('[data-pm=value]').value)||0,expires_at:bg.querySelector('[data-pm=exp]').value,limit_uses:bg.querySelector('[data-pm=limit]').value,uses:Number(bg.querySelector('[data-pm=uses]').value)||0,blogger:bg.querySelector('[data-pm=blogger]').value.trim(),note:bg.querySelector('[data-pm=note]').value.trim()}; const r=await api('/api/promos/'+p.id,{method:'POST',body:JSON.stringify(body)}); if(!r.ok){toast('Ошибка','i-x','#dc2626');return;} closeModal(); toast('Сохранено','i-check2'); onSaved&&onSaved(); };
  bg.querySelector('#pmToggle').onclick=async()=>{ const r=await api('/api/promos/'+p.id,{method:'POST',body:JSON.stringify({active:!p.active})}); if(r.ok){closeModal();toast(p.active?'Промокод на паузе':'Промокод активирован','i-tag');onSaved&&onSaved();} else toast('Ошибка','i-x','#dc2626'); };
  bg.querySelector('#pmDel').onclick=async()=>{ if(!confirm('Удалить промокод?'))return; const r=await api('/api/promos/'+p.id,{method:'DELETE'}); if(r.ok){closeModal();toast('Удалено','i-check2');onSaved&&onSaved();} else toast('Ошибка','i-x','#dc2626'); };
}

// ---------- BLOGGERS ----------
const BLOG_PLATFORMS=[['','—'],['instagram','instagram'],['tiktok','tiktok'],['youtube','youtube'],['telegram','telegram'],['другое','другое']];
const BLOG_MODELS=[['per_sale','За продажу (сом)'],['percent','% от продаж'],['fixed','Фикс / мес'],['barter','Бартер']];
function payoutLabel(b){ const m=b.payout_model||'per_sale', v=b.payout_value||0; if(m==='barter')return 'Бартер'; if(m==='percent')return v+'% с продаж'; if(m==='fixed')return money(v)+'/мес'; return money(v)+' / прод.'; }
function blogStatusTag(s){ return s==='paused'?'<span class="tag amber">пауза</span>':s==='archived'?'<span class="tag">архив</span>':'<span class="tag green">активен</span>'; }
// Сколько причитается блогеру по его модели оплаты (для подсказки «сколько платить»).
function accrualDue(b){
  const r=Number(b.payout_value)||0, m=b.payout_model||'per_sale';
  if(m==='per_sale') return Math.round(r*(b.uses||0));
  if(m==='percent')  return Math.round(r*(b.revenue||0)/100);
  if(m==='fixed')    return Math.round(r);
  return 0; // barter
}
function blogCard(b){
  const cpa=(b.uses>0&&(b.paid||0)>0)?money(Math.round((b.paid||0)/b.uses)):'—';
  return `<div class="list-card" style="cursor:pointer">
    <div class="row"><span class="avatar-xs" style="width:42px;height:42px;font-size:14px;background:${avBg(b.nick||b.name||'?')}">${initials(b.name||b.nick||'?')}</span>
      <div style="min-width:0"><div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(b.nick||b.name||'—')}</div><div class="muted" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(b.name||'')}${b.topic?(' · '+esc(b.topic)):''}</div></div>
      ${b.auto?`<span class="tag green" style="margin-left:auto;flex:none" title="Конверсии и выручка из чеков 1С">1С · авто</span>`:`<span style="margin-left:auto;flex:none">${blogStatusTag(b.status)}</span>`}</div>
    <div class="grid-2b section-gap" style="gap:11px">
      <div><div class="muted" style="font-size:11px">Конверсии</div><div style="font-weight:700">${b.uses||0}</div></div>
      <div><div class="muted" style="font-size:11px">Выручка</div><div style="font-weight:700;white-space:nowrap">${money(b.revenue||0)}</div></div>
      <div><div class="muted" style="font-size:11px">CPA</div><div style="font-weight:700;white-space:nowrap">${cpa}</div></div>
      <div><div class="muted" style="font-size:11px">Охват</div><div style="font-weight:700">${esc(b.reach||'—')}</div></div>
    </div>
    <div class="row section-gap" style="justify-content:space-between;padding-top:12px;border-top:1px solid var(--line)">
      <div class="row" style="gap:6px">${blogStatusTag(b.status)}${b.platform?`<span class="tag">${esc(b.platform)}</span>`:''}</div>
      <div style="text-align:right"><div class="muted" style="font-size:11px">Выплачено</div><div style="font-weight:800;color:var(--accent2);white-space:nowrap">${money(b.paid||0)}</div></div>
    </div></div>`;
}
function blogCardDemo(b){
  return `<div class="list-card">
    <div class="row"><span class="avatar-xs" style="width:42px;height:42px;font-size:14px;background:${avBg(b.nick)}">${initials(b.name)}</span>
      <div><div style="font-weight:700">${esc(b.nick)}</div><div class="muted" style="font-size:12px">${esc(b.name)} · ${esc(b.topic)}</div></div>
      <span class="tag pink" style="margin-left:auto">${esc(b.code)}</span></div>
    <div class="grid-2b section-gap" style="gap:11px">
      <div><div class="muted" style="font-size:11px">Охват</div><div style="font-weight:700">${esc(b.reach)}</div></div>
      <div><div class="muted" style="font-size:11px">Переходы</div><div style="font-weight:700">${b.clicks}</div></div>
      <div><div class="muted" style="font-size:11px">Продажи</div><div style="font-weight:700">${b.sales}</div></div>
      <div><div class="muted" style="font-size:11px">Средний чек</div><div style="font-weight:700">${money(b.avg)}</div></div>
    </div>
    <div class="row section-gap" style="justify-content:space-between;padding-top:12px;border-top:1px solid var(--line)">
      <div><div class="muted" style="font-size:11px">ROI</div><div style="font-weight:800;color:var(--accent2);font-size:18px">${b.roi}</div></div>
      <div style="text-align:right"><div class="muted" style="font-size:11px">Выплачено</div><div style="font-weight:700">${money(b.paid)}</div></div>
    </div></div>`;
}
PAGES.bloggers=(c)=>{
  const tbar=el(`<div class="toolbar">
    <div class="fld-in">${ic('i-search','sm')}<input placeholder="Поиск по нику, имени, коду, нише…" data-bl="q"></div>
    <div class="spacer"></div>
    <button class="btn primary" id="newBlogBtn">${ic('i-plus','sm')} Блогер</button></div>`);
  const cards=el(`<div class="cards-row section-gap"></div>`);
  const grid=el(`<div class="grid-3 section-gap"></div>`);
  c.appendChild(tbar); c.appendChild(cards); c.appendChild(grid);
  c.appendChild(el(`<div class="note blue section-gap">${ic('i-info','sm')} Блогеры — внешние партнёры с промо-картой 1С. «Конверсии» и «Выручка» считаются автоматически из чеков (по применённой карте). Выплаты фиксируются вручную; CPA = выплачено ÷ конверсии.</div>`));
  const qI=tbar.querySelector('[data-bl=q]');
  async function load(){
    const q=qI.value.trim();
    const r=await api('/api/bloggers'+(q?('?q='+encodeURIComponent(q)):''));
    if(!r.ok){ cards.innerHTML=miniStat('i-star','#db2777','Блогеры','демо'); grid.innerHTML=(DB.bloggers||[]).map(blogCardDemo).join(''); return; }
    const t=r.data.totals||{};
    cards.innerHTML = miniStat('i-star','#db2777','Всего блогеров',t.total||0)
      + miniStat('i-tag','#10b981','Конверсий',t.conversions||0)
      + miniStat('i-chart','#2563eb','Выручка по кодам',money(t.revenue||0))
      + miniStat('i-money','#d97706','Выплачено',money(t.paid||0));
    const items=r.data.items||[];
    if(!items.length){ grid.innerHTML=`<div class="panel" style="grid-column:1/-1;text-align:center;padding:42px;color:var(--muted)">${ic('i-star','lg')}<div style="margin-top:8px;font-weight:600">${q?'Ничего не найдено':'Блогеров пока нет'}</div><div class="muted2" style="font-size:12px;margin-top:4px">${q?'Измените запрос':'Добавьте первого партнёра кнопкой «Блогер»'}</div></div>`; return; }
    grid.innerHTML=''; items.forEach(b=>{ const card=el(blogCard(b)); card.onclick=()=>bloggerModalLive(b,load); grid.appendChild(card); });
  }
  qI.addEventListener('input',()=>{clearTimeout(qI._t);qI._t=setTimeout(load,300);});
  tbar.querySelector('#newBlogBtn').onclick=()=>newBloggerLive(load);
  load();
};
async function fetchBloggerCodes(){ const r=await api('/api/promos'); if(!r||!r.ok) return []; return (r.data.items||[]).filter(p=>(p.type||'')==='блогерский код'); }
function codeSelectHtml(codes, selected, attr){
  const sel=(selected||'').toUpperCase();
  let opts='<option value="">— без кода —</option>'+codes.map(c=>`<option value="${esc(c.code)}" ${(c.code||'').toUpperCase()===sel?'selected':''}>${esc(c.code)}${c.uses?(' · '+c.uses+' исп.'):''}</option>`).join('');
  if(sel && !codes.some(c=>(c.code||'').toUpperCase()===sel)) opts+=`<option value="${esc(selected)}" selected>${esc(selected)} (текущий)</option>`;
  return `<select ${attr}>${opts}</select>`;
}
function blogCodeHint(codes){ return codes.length?'':`<div class="note amber">${ic('i-info','sm')} Блогерских промокодов пока нет. Создайте код в разделе «Маркетинг» (тип «блогерский код») — он появится в списке.</div>`; }
// Промо-карты 1С (виды «Промокод…») — реальный источник конверсий/выручки по чекам.
async function fetchPromoCards(){ const r=await api('/api/1c/promocards'); if(!r||!r.ok) return []; return r.data.items||[]; }
function cardSelectHtml(cards, selectedRef, attr){
  const sel=selectedRef||'';
  let opts='<option value="">— не привязан —</option>'+cards.map(c=>`<option value="${esc(c.ref_key)}" ${c.ref_key===sel?'selected':''}>${esc(c.name)} · ${c.uses||0} исп.</option>`).join('');
  if(sel && !cards.some(c=>c.ref_key===sel)) opts+=`<option value="${esc(sel)}" selected>(текущая карта)</option>`;
  return `<select ${attr}>${opts}</select>`;
}
function cardHint(cards){ return cards.length?'':`<div class="note amber">${ic('i-info','sm')} Промо-карты из 1С не найдены — появятся после синхронизации (виды карт «Промокод…»). Пока конверсии можно не привязывать.</div>`; }
async function newBloggerLive(onSaved){
  const cards=await fetchPromoCards();
  const bg=openModal(`<div class="modal-h"><div><h3>Новый блогер</h3></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="fld-row"><div class="fld"><label>Ник / аккаунт *</label><input data-nb="nick" placeholder="@nick"></div><div class="fld"><label>Имя</label><input data-nb="name" placeholder="Имя Фамилия"></div></div>
    <div class="fld-row"><div class="fld"><label>Площадка</label><select data-nb="platform">${BLOG_PLATFORMS.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></div><div class="fld"><label>Ниша / тематика</label><input data-nb="topic" placeholder="Бьюти, стоматология…"></div></div>
    <div class="fld-row"><div class="fld"><label>Охват</label><input data-nb="reach" placeholder="82k"></div><div class="fld"><label>Промокод (карта 1С)</label>${cardSelectHtml(cards,'','data-nb="card_ref"')}</div></div>
    <div class="fld-row"><div class="fld"><label>Модель оплаты</label><select data-nb="payout_model">${BLOG_MODELS.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></div><div class="fld"><label>Ставка</label><input data-nb="payout_value" type="number" value="0"></div></div>
    <div class="fld"><label>Контакт для выплат</label><input data-nb="contact" placeholder="телефон / карта / Kaspi"></div>
    <div class="fld"><label>Комментарий</label><input data-nb="note"></div>
    ${cardHint(cards)}<div class="note blue">${ic('i-info','sm')} Привяжите промо-карту из 1С — конверсии и выручка считаются автоматически из чеков. CPA = выплачено ÷ конверсии.</div>
  </div>
  <div class="modal-f"><button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="nbSave">Создать</button></div>`);
  bg.querySelector('#nbSave').onclick=async()=>{
    const g=s=>bg.querySelector('[data-nb='+s+']').value;
    const nick=g('nick').trim(), name=g('name').trim();
    if(!nick&&!name){toast('Укажите ник или имя','i-info');return;}
    const body={nick,name,platform:g('platform'),topic:g('topic').trim(),reach:g('reach').trim(),card_ref:g('card_ref'),payout_model:g('payout_model'),payout_value:Number(g('payout_value'))||0,contact:g('contact').trim(),note:g('note').trim()};
    const r=await api('/api/bloggers',{method:'POST',body:JSON.stringify(body)});
    if(!r.ok){toast('Не удалось создать','i-x','#dc2626');return;} closeModal(); toast('Блогер добавлен','i-star'); onSaved&&onSaved();
  };
}
async function bloggerModalLive(b,onSaved){
  const cards=await fetchPromoCards();
  const cpa=(b.uses>0&&(b.paid||0)>0)?money(Math.round((b.paid||0)/b.uses)):'—';
  const bg=openModal(`<div class="modal-h"><div><h3>${esc(b.nick||b.name||'Блогер')}</h3><div class="mh-sub">${esc(b.name||'')}${b.topic?(' · '+esc(b.topic)):''}</div></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="cards-row">
      ${miniStat('i-tag','#10b981','Конверсии'+(b.auto?' · авто':''),b.uses||0)}
      ${miniStat('i-chart','#2563eb','Выручка',money(b.revenue||0))}
      ${miniStat('i-gift','#16a34a','К начислению',money(accrualDue(b)))}
      ${miniStat('i-money','#d97706','Выплачено',money(b.paid||0))}
      ${miniStat('i-target','#7c3aed','CPA',cpa)}
    </div>
    <div class="fld-row section-gap"><div class="fld"><label>Ник / аккаунт</label><input data-bm="nick" value="${esc(b.nick||'')}"></div><div class="fld"><label>Имя</label><input data-bm="name" value="${esc(b.name||'')}"></div></div>
    <div class="fld-row"><div class="fld"><label>Площадка</label><select data-bm="platform">${BLOG_PLATFORMS.map(([v,t])=>`<option value="${v}" ${v===(b.platform||'')?'selected':''}>${t}</option>`).join('')}</select></div><div class="fld"><label>Ниша</label><input data-bm="topic" value="${esc(b.topic||'')}"></div></div>
    <div class="fld-row"><div class="fld"><label>Охват</label><input data-bm="reach" value="${esc(b.reach||'')}"></div><div class="fld"><label>Промокод (карта 1С)</label>${cardSelectHtml(cards,b.card_ref,'data-bm="card_ref"')}</div></div>
    <div class="fld-row"><div class="fld"><label>Модель оплаты</label><select data-bm="payout_model">${BLOG_MODELS.map(([v,t])=>`<option value="${v}" ${v===(b.payout_model||'per_sale')?'selected':''}>${t}</option>`).join('')}</select></div><div class="fld"><label>Ставка</label><input data-bm="payout_value" type="number" value="${b.payout_value||0}"></div></div>
    <div class="fld-row"><div class="fld"><label>Контакт для выплат</label><input data-bm="contact" value="${esc(b.contact||'')}"></div><div class="fld"><label>Статус</label><select data-bm="status">${[['active','Активен'],['paused','Пауза'],['archived','Архив']].map(([v,t])=>`<option value="${v}" ${v===(b.status||'active')?'selected':''}>${t}</option>`).join('')}</select></div></div>
    <div class="fld"><label>Комментарий</label><input data-bm="note" value="${esc(b.note||'')}"></div>
    <div class="row section-gap" style="gap:8px;align-items:flex-end;border-top:1px solid var(--line);padding-top:14px">
      <div class="fld" style="flex:1;margin:0"><label>Сумма выплаты</label><input data-bm="payamt" type="number" placeholder="напр. 18000"></div>
      <div class="fld" style="flex:1;margin:0"><label>Период</label><input data-bm="payper" placeholder="Июнь 2026"></div>
      <button class="btn" id="bmPay">${ic('i-money','sm')} Выплата</button>
      <button class="btn sm" id="bmJournal">${ic('i-doc','sm')} Журнал</button>
    </div>
  </div>
  <div class="modal-f"><button class="btn" id="bmDel" style="color:var(--red)">${ic('i-x','sm')} Удалить</button><button class="btn primary" id="bmSave">Сохранить</button></div>`);
  const g=s=>bg.querySelector('[data-bm='+s+']');
  bg.querySelector('#bmSave').onclick=async()=>{ const body={nick:g('nick').value.trim(),name:g('name').value.trim(),platform:g('platform').value,topic:g('topic').value.trim(),reach:g('reach').value.trim(),card_ref:g('card_ref').value,payout_model:g('payout_model').value,payout_value:Number(g('payout_value').value)||0,contact:g('contact').value.trim(),status:g('status').value,note:g('note').value.trim()}; const r=await api('/api/bloggers/'+b.id,{method:'POST',body:JSON.stringify(body)}); if(!r.ok){toast('Ошибка','i-x','#dc2626');return;} closeModal(); toast('Сохранено','i-check2'); onSaved&&onSaved(); };
  bg.querySelector('#bmPay').onclick=async()=>{ const amt=Number(g('payamt').value)||0; if(amt<=0){toast('Укажите сумму выплаты','i-info');return;} const r=await api('/api/bloggers/'+b.id+'/pay',{method:'POST',body:JSON.stringify({amount:amt,period_label:g('payper').value.trim()})}); if(!r.ok){toast((r.data&&r.data.error)||'Ошибка','i-x','#dc2626');return;} closeModal(); toast('Выплата зафиксирована: '+money(amt),'i-money'); onSaved&&onSaved(); };
  bg.querySelector('#bmJournal').onclick=()=>blogPayoutsModal(b,onSaved);
  bg.querySelector('#bmDel').onclick=async()=>{ if(!confirm('Удалить блогера и все его выплаты?'))return; const r=await api('/api/bloggers/'+b.id,{method:'DELETE'}); if(r.ok){closeModal();toast('Удалено','i-check2');onSaved&&onSaved();} else toast('Ошибка','i-x','#dc2626'); };
}
function blogPayoutsModal(b,onSaved){
  const bg=openModal(`<div class="modal-h"><div><h3>Журнал выплат</h3><div class="mh-sub">${esc(b.nick||b.name||'')}</div></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b"><div class="panel"><table class="tbl"><thead><tr><th>Дата</th><th>Период</th><th class="num">Сумма</th><th>Кто</th><th></th></tr></thead><tbody id="bpRows"><tr><td colspan="5" class="muted2" style="padding:14px;font-size:13px">Загрузка…</td></tr></tbody></table></div></div>
  <div class="modal-f"><button class="btn" onclick="closeModal()">Закрыть</button></div>`);
  const fdt=(ms)=>ms?new Date(ms).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}):'—';
  async function load(){
    const r=await api('/api/bloggers/payouts?blogger_id='+b.id);
    const tb=bg.querySelector('#bpRows');
    if(!r.ok){ tb.innerHTML='<tr><td colspan="5" class="muted2" style="padding:14px">Ошибка загрузки</td></tr>'; return; }
    const items=r.data.items||[];
    if(!items.length){ tb.innerHTML='<tr><td colspan="5" class="muted2" style="padding:14px;font-size:13px">Выплат пока нет</td></tr>'; return; }
    tb.innerHTML=items.map(p=>`<tr><td class="muted2" style="font-size:12px">${fdt(p.created_at)}</td><td>${esc(p.period_label||'—')}</td><td class="num" style="font-weight:700">${money(p.amount)}</td><td class="muted" style="font-size:12px">${esc(p.created_by||'—')}</td><td class="num"><button class="btn sm" data-del="${p.id}" title="Удалить">${ic('i-x','sm')}</button></td></tr>`).join('')
      +`<tr><td colspan="2" style="font-weight:700">Итого</td><td class="num" style="font-weight:800;color:var(--accent2)">${money(r.data.totals.paid||0)}</td><td colspan="2"></td></tr>`;
    tb.querySelectorAll('[data-del]').forEach(btn=>btn.onclick=async()=>{ if(!confirm('Удалить эту выплату?'))return; const rr=await api('/api/bloggers/payouts/'+btn.dataset.del,{method:'DELETE'}); if(rr.ok){toast('Выплата удалена','i-check2');load();onSaved&&onSaved();} else toast('Ошибка','i-x','#dc2626'); });
  }
  load();
}

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
PAGES.analytics=async(c)=>{
  const ahStores=await fetchStores();
  const tbar=el(`<div class="toolbar">
    <div class="seg" data-ah="range"><button data-d="7">7 дней</button><button class="on" data-d="30">30 дней</button><button data-d="90">90 дней</button></div>
    <div class="fld-in">${ic('i-clock','sm')}<input type="date" data-ah="from" title="С даты"></div>
    <div class="fld-in">${ic('i-clock','sm')}<input type="date" data-ah="to" title="По дату"></div>
    <button class="btn sm" data-ah="apply">Показать</button>
    ${storeSelectHtml(ahStores,'','class="sel" data-ah="store" title="Точка"','Все точки')}
  </div>`);
  const host=el(`<div class="section-gap"><div class="muted2" style="padding:10px">Загрузка аналитики…</div></div>`);
  c.appendChild(tbar); c.appendChild(host);
  const seg=tbar.querySelector('[data-ah=range]'),fromI=tbar.querySelector('[data-ah=from]'),toI=tbar.querySelector('[data-ah=to]'),applyB=tbar.querySelector('[data-ah=apply]');
  let curF=isoDaysAgo(30), curT=isoDaysAgo(0);
  const go=(f,t)=>{ curF=f; curT=t; loadAnalytics(host,f,t,tbar.querySelector('[data-ah=store]').value); };
  seg.querySelectorAll('button').forEach(b=>b.onclick=()=>{ seg.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); fromI.value='';toI.value=''; go(isoDaysAgo(+b.dataset.d),isoDaysAgo(0)); });
  applyB.onclick=()=>{ if(fromI.value&&toI.value){ seg.querySelectorAll('button').forEach(x=>x.classList.remove('on')); go(fromI.value,toI.value); } else toast('Укажите обе даты','i-info'); };
  tbar.querySelector('[data-ah=store]').onchange=()=>go(curF,curT);
  go(isoDaysAgo(30),isoDaysAgo(0));
};
function anMargin(x){ return x.revenue>0?Math.round((x.profit||0)/x.revenue*100):0; }
async function loadAnalytics(host,from,to,store){
  host.innerHTML=`<div class="muted2" style="padding:10px">Загрузка…</div>`;
  const r=await api('/api/1c/sales/summary?from='+from+'&to='+to+(store?('&store='+encodeURIComponent(store)):''));
  if(!r.ok){
    host.innerHTML=`<div class="note">${ic('i-info','sm')} Аналитика в демо-режиме (нет доступа к 1С).</div>
      <div class="grid-2 section-gap"><div class="panel"><div class="panel-h"><h3>Средний чек по сегментам</h3></div><div class="panel-b">${barList([['Опт',96000,'#7c3aed'],['Врачи',4200,'#2563eb'],['Розница',2180,'#10b981']],96000,true)}</div></div>
      <div class="panel"><div class="panel-h"><h3>Воронка B2B</h3></div><div class="panel-b">${funnelVis([['Заявка',64,'#7c3aed'],['КП',34,'#2563eb'],['Оплата',12,'#16a34a']])}</div></div></div>`;
    return;
  }
  const d=r.data,t=d.totals||{},fmt=n=>(n||0).toLocaleString('ru-RU');
  const tp=d.topProducts||[],bs=d.byStore||[],bo=d.byOrg||[];
  const maxTP=Math.max(...tp.map(x=>x.revenue),1);
  const prodRows=tp.length?tp.map((x,i)=>`<tr><td class="muted2">${i+1}</td><td>${esc(x.name||'—')}</td><td class="num">${fmt(x.qty)}</td><td class="num"><div style="font-weight:600">${money(x.revenue)}</div><div style="height:3px;background:var(--line);border-radius:3px;margin-top:3px;overflow:hidden"><div style="height:100%;width:${Math.max(2,Math.round(x.revenue/maxTP*100))}%;background:var(--accent2)"></div></div></td><td class="num">${money(x.profit)}</td><td class="num">${anMargin(x)}%</td></tr>`).join(''):`<tr><td colspan="6" class="muted2" style="padding:14px">Нет данных за период</td></tr>`;
  const chRows=(rows,empty)=>rows.length?rows.map(x=>`<tr><td>${esc(x.name||'—')}</td><td class="num">${money(x.revenue)}</td><td class="num">${money(x.profit)}</td><td class="num">${anMargin(x)}%</td><td class="num">${fmt(x.docs)}</td></tr>`).join(''):`<tr><td colspan="5" class="muted2" style="padding:14px">${empty}</td></tr>`;
  host.innerHTML=
    `<div class="cards-row">
      ${dashKpi('i-money','#10b981','Выручка',money(t.revenue||0),'',0)}
      ${dashKpi('i-chart','#2563eb','Прибыль · '+(t.margin||0)+'%',money(t.profit||0),'',0)}
      ${dashKpi('i-doc','#7c3aed','Чеки',fmt(t.docs),'',0)}
      ${dashKpi('i-cart','#0891b2','Средний чек',money(t.avg||0),'',0)}
      ${dashKpi('i-box','#db2777','Продано позиций',fmt(t.qty),'',0)}
    </div>
    <div class="panel section-gap"><div class="panel-h"><h3>Топ-20 товаров</h3><span class="ph-sub">по выручке · с прибылью и маржой</span></div>
      <table class="tbl"><thead><tr><th style="width:30px">#</th><th>Товар</th><th class="num">Продано</th><th class="num">Выручка</th><th class="num">Прибыль</th><th class="num">Маржа</th></tr></thead><tbody>${prodRows}</tbody></table></div>
    <div class="grid-2 section-gap">
      <div class="panel"><div class="panel-h"><h3>По магазинам</h3></div>
        <table class="tbl"><thead><tr><th>Магазин</th><th class="num">Выручка</th><th class="num">Прибыль</th><th class="num">Маржа</th><th class="num">Чеки</th></tr></thead><tbody>${chRows(bs,'Нет данных')}</tbody></table></div>
      <div class="panel"><div class="panel-h"><h3>По организациям</h3></div>
        <table class="tbl"><thead><tr><th>Организация</th><th class="num">Выручка</th><th class="num">Прибыль</th><th class="num">Маржа</th><th class="num">Чеки</th></tr></thead><tbody>${chRows(bo,'Нет данных')}</tbody></table></div>
    </div>
    <div class="panel section-gap"><div class="panel-h"><h3>Динамика выручки по дням</h3><span class="ph-sub">${esc(from)} — ${esc(to)}</span></div><div class="panel-b">${dashDayChart(d.byDay)}</div></div>
    <div class="note blue section-gap">${ic('i-info','sm')} Аналитика из продаж 1С за период. Прибыль = выручка − себестоимость, маржа = прибыль ÷ выручка.</div>`;
}

// ---------- TASKS ----------
function jparse(s,f){ try{ const v=JSON.parse(s); return v==null?f:v; }catch(e){ return f; } }
const TASK_LABELS=[{k:'vip',t:'VIP',c:'#db2777'},{k:'opt',t:'Опт',c:'#7c3aed'},{k:'complaint',t:'Жалоба',c:'#dc2626'},{k:'wait',t:'Ожидание',c:'#d97706'},{k:'newcl',t:'Новый клиент',c:'#2563eb'},{k:'important',t:'Важное',c:'#16a34a'}];
function labelBars(keys){ const a=keys||[]; if(!a.length)return ''; return `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:7px">${a.map(k=>{const L=TASK_LABELS.find(x=>x.k===k);return L?`<span title="${esc(L.t)}" style="height:7px;width:30px;border-radius:4px;background:${L.c}"></span>`:'';}).join('')}</div>`; }
function fmtWhen(ms){ if(!ms)return ''; const d=new Date(ms),p=n=>String(n).padStart(2,'0'); return p(d.getDate())+'.'+p(d.getMonth()+1)+' '+p(d.getHours())+':'+p(d.getMinutes()); }
function fmtSize(b){ b=b||0; return b<1024?b+' Б':b<1048576?(Math.round(b/1024)+' КБ'):((b/1048576).toFixed(1)+' МБ'); }
async function uploadTaskFile(taskId,file){ const t=AUTH.token||getToken();
  try{ const res=await fetch(API_BASE+'/api/tasks/'+taskId+'/attach',{method:'POST',headers:{'Authorization':'Bearer '+t,'Content-Type':file.type||'application/octet-stream','X-File-Name':encodeURIComponent(file.name)},body:file});
    const data=await res.json().catch(()=>null); return {ok:res.ok&&data&&data.ok!==false,data}; }
  catch(e){ return {ok:false,data:{error:'Нет связи'}}; } }
async function downloadTaskFile(taskId,idx,name){ const t=AUTH.token||getToken();
  try{ const res=await fetch(API_BASE+'/api/tasks/'+taskId+'/attach/'+idx,{headers:{'Authorization':'Bearer '+t}});
    if(!res.ok){ toast('Не удалось скачать','i-x','#dc2626'); return; }
    const blob=await res.blob(),url=URL.createObjectURL(blob),a=document.createElement('a'); a.href=url; a.download=name||'file'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),5000); }
  catch(e){ toast('Ошибка скачивания','i-x','#dc2626'); } }
PAGES.tasks=(c)=>{
  let cols=[];
  const stOf=t=>t.status||(t.done?'done':'todo');
  const typeTag=(t)=>{ const m={'звонок':'blue','встреча':'violet','отгрузка':'amber'}; return `<span class="tag ${m[t]||''}">${esc(t||'задача')}</span>`; };
  const overdue=(t)=>{ if(stOf(t)==='done'||!t.due_at)return false; const now=new Date().toISOString(); return String(t.due_at).length>10 ? t.due_at<now.slice(0,16) : t.due_at<now.slice(0,10); };
  const dueSoon=(t)=>{ if(stOf(t)==='done'||!t.due_at)return false; const due=new Date(t.due_at).getTime(),now=Date.now(); return due>now && (due-now)<86400000; };
  const tbar=el(`<div class="toolbar">
    <div class="seg" id="tkView"><button class="on" data-v="board">Доска</button><button data-v="calendar">Календарь</button></div>
    <select class="sel" id="tkFa" style="max-width:190px"><option value="">Все ответственные</option></select>
    <select class="sel" id="tkFl" style="max-width:160px"><option value="">Все метки</option>${TASK_LABELS.map(L=>`<option value="${L.k}">${esc(L.t)}</option>`).join('')}</select>
    <button class="btn sm" id="tkFclear" title="Сбросить фильтры">${ic('i-x','sm')}</button>
    <div class="spacer"></div><span class="ph-sub" id="tkCnt"></span><button class="btn primary" id="newTaskBtn">${ic('i-plus','sm')} Задача</button></div>`);
  c.appendChild(tbar);
  const board=el(`<div class="kanban" id="tkBoard"><div class="muted2" style="padding:14px">Загрузка…</div></div>`);
  c.appendChild(board);
  const cal=el(`<div id="tkCal" style="display:none"></div>`);
  c.appendChild(cal);
  c.appendChild(el(`<div class="note section-gap">${ic('i-info','sm')} Канбан как в Trello: «К выполнению» → «В работе» → «Готово». Статус сохраняется при перетаскивании. Клик по карточке — детали и редактирование.</div>`));
  const cnt=tbar.querySelector('#tkCnt');
  const faSel=tbar.querySelector('#tkFa'), flSel=tbar.querySelector('#tkFl');
  let fAssignee='', fLabel='', view='board', calY=null, calM=null;
  faSel.onchange=()=>{ fAssignee=faSel.value; render(); };
  flSel.onchange=()=>{ fLabel=flSel.value; render(); };
  tbar.querySelector('#tkFclear').onclick=()=>{ fAssignee='';fLabel='';faSel.value='';flSel.value=''; render(); };
  tbar.querySelector('#tkView').querySelectorAll('button').forEach(b=>b.onclick=()=>{ tbar.querySelector('#tkView').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); view=b.dataset.v; render(); });
  tbar.querySelector('#newTaskBtn').onclick=()=>newTaskLive(load);
  const filtered=()=>current.filter(t=>(!fAssignee||t.assignee===fAssignee)&&(!fLabel||jparse(t.labels,[]).includes(fLabel)));
  function render(){ if(view==='calendar'){ board.style.display='none'; cal.style.display=''; renderCalendar(); } else { board.style.display=''; cal.style.display='none'; renderBoard(); } }
  let _dx=0,_sc=null;
  board.addEventListener('dragover',e=>{ e.preventDefault(); _dx=e.clientX; if(!_sc) _sc=setInterval(()=>{ const r=board.getBoundingClientRect(); if(_dx>r.right-80)board.scrollLeft+=26; else if(_dx<r.left+80)board.scrollLeft-=26; },16); });
  const stop=()=>{ if(_sc){clearInterval(_sc);_sc=null;} }; board.addEventListener('drop',stop); board.addEventListener('dragend',stop);
  let current=[];
  function card(t){
    const od=overdue(t);
    const cl=jparse(t.checklist,[]),dn=cl.filter(i=>i&&i.done).length,cms=jparse(t.comments,[]),att=jparse(t.attachments,[]);
    const k=el(`<div class="kcard" draggable="true" data-id="${esc(t.id)}">
      ${labelBars(jparse(t.labels,[]))}
      <div style="font-weight:600;font-size:13px;line-height:1.35">${esc(t.title)}</div>
      ${(t.client_name||t.assignee)?`<div class="kc-prod">${esc([t.client_name,t.assignee].filter(Boolean).join(' · '))}</div>`:''}
      <div class="kc-meta">${typeTag(t.type)}${t.priority==='high'&&stOf(t)!=='done'?'<span class="tag amber">срочно</span>':''}${cl.length?`<span class="tag ${dn===cl.length?'green':''}">☑ ${dn}/${cl.length}</span>`:''}${cms.length?`<span class="tag">💬 ${cms.length}</span>`:''}${att.length?`<span class="tag">📎 ${att.length}</span>`:''}${t.due_at?`<span class="tag ${od?'red':dueSoon(t)?'amber':''}" style="margin-left:auto">${ic('i-clock','sm')} ${esc(fmtDue(t.due_at))}</span>`:'<span style="margin-left:auto"></span>'}</div></div>`);
    k.addEventListener('dragstart',e=>{e.dataTransfer.setData('id',t.id);k.classList.add('dragging');});
    k.addEventListener('dragend',()=>k.classList.remove('dragging'));
    k.onclick=()=>{ if(!k.classList.contains('dragging')) taskModalLive(t,load); };
    return k;
  }
  function renderBoard(){
    const vis=filtered();
    const adm=typeof isAdminRole==='function'&&isAdminRole();
    const colIds=new Set(cols.map(x=>x.id)), first=cols[0]?cols[0].id:'todo';
    const norm=t=>{ const s=stOf(t); return colIds.has(s)?s:first; };
    board.innerHTML='';
    cols.forEach((co,ci)=>{
      const key=co.id, label=co.title;
      const list=vis.filter(t=>norm(t)===key);
      const tools=adm?`<span class="kc-tools"><button class="kc-tool" data-mv="-1" title="Левее">‹</button><button class="kc-tool" data-ren title="Переименовать">✎</button>${(key!=='todo'&&key!=='done')?`<button class="kc-tool" data-del title="Удалить">✕</button>`:''}<button class="kc-tool" data-mv="1" title="Правее">›</button></span>`:'';
      const col=el(`<div class="kcol" data-status="${esc(key)}"><div class="kcol-h"><span class="kc-name">${esc(label)}</span><span class="kc-count">${list.length}</span>${tools}</div><div class="kcol-b"></div></div>`);
      const cb=col.querySelector('.kcol-b');
      list.forEach(t=>cb.appendChild(card(t)));
      col.addEventListener('dragover',e=>{e.preventDefault();col.classList.add('drop-hot');});
      col.addEventListener('dragleave',()=>col.classList.remove('drop-hot'));
      col.addEventListener('drop',async e=>{e.preventDefault();col.classList.remove('drop-hot');
        const id=e.dataTransfer.getData('id'),t=current.find(x=>x.id===id);
        if(t&&stOf(t)!==key){ const oS=t.status,oD=t.done; t.status=key; t.done=(key==='done'?1:0); renderBoard(); badge();
          const r=await api('/api/tasks/'+id,{method:'POST',body:JSON.stringify({status:key})});
          if(r.ok) toast('Перенесено в «'+label+'»','i-check2'); else { t.status=oS;t.done=oD; renderBoard(); badge(); toast('Не удалось сохранить','i-x','#dc2626'); } } });
      if(adm){
        const ren=col.querySelector('[data-ren]'); if(ren)ren.onclick=async(e)=>{ e.stopPropagation(); const nt=prompt('Название колонки:',label); if(nt==null||!nt.trim())return; const r=await api('/api/task-columns/'+key,{method:'POST',body:JSON.stringify({title:nt.trim()})}); if(r.ok)load(); else toast('Ошибка','i-x','#dc2626'); };
        const del=col.querySelector('[data-del]'); if(del)del.onclick=async(e)=>{ e.stopPropagation(); if(!confirm('Удалить колонку «'+label+'»? Её задачи перейдут в «К выполнению».'))return; const r=await api('/api/task-columns/'+key,{method:'DELETE'}); if(r.ok)load(); else toast((r.data&&r.data.error)||'Ошибка','i-x','#dc2626'); };
        col.querySelectorAll('[data-mv]').forEach(b=>b.onclick=async(e)=>{ e.stopPropagation(); const j=ci+(+b.dataset.mv); if(j<0||j>=cols.length)return; const a=cols[ci],bb=cols[j]; await api('/api/task-columns/'+a.id,{method:'POST',body:JSON.stringify({position:bb.position})}); await api('/api/task-columns/'+bb.id,{method:'POST',body:JSON.stringify({position:a.position})}); load(); });
      }
      board.appendChild(col);
    });
    if(adm){ const ac=el(`<div class="kcol kcol-add"><button class="btn" style="width:100%;justify-content:center">${ic('i-plus','sm')} Колонка</button></div>`); ac.querySelector('button').onclick=async()=>{ const nt=prompt('Название новой колонки:'); if(nt==null||!nt.trim())return; const r=await api('/api/task-columns',{method:'POST',body:JSON.stringify({title:nt.trim()})}); if(r.ok)load(); else toast('Ошибка','i-x','#dc2626'); }; board.appendChild(ac); }
    cnt.textContent=vis.length+(vis.length!==current.length?(' из '+current.length):'')+' задач';
  }
  function renderCalendar(){
    const now=new Date(); if(calY==null){ calY=now.getFullYear(); calM=now.getMonth(); }
    const vis=filtered(); const byDay={}; vis.forEach(t=>{ if(t.due_at){ const d=String(t.due_at).slice(0,10); (byDay[d]=byDay[d]||[]).push(t); } });
    const noDue=vis.filter(t=>!t.due_at).length, pad=n=>String(n).padStart(2,'0');
    const first=new Date(calY,calM,1), dow=(first.getDay()+6)%7, start=new Date(calY,calM,1-dow);
    const todayISO=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());
    const monthName=first.toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
    let cells='';
    for(let i=0;i<42;i++){ const d=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i);
      const iso=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()), inMonth=d.getMonth()===calM, isToday=iso===todayISO, list=byDay[iso]||[];
      cells+=`<div class="cal-cell ${inMonth?'':'cal-out'} ${isToday?'cal-today':''}"><div class="cal-d">${d.getDate()}</div>`
        +list.slice(0,4).map(t=>{ const ov=overdue(t), sn=dueSoon(t), lb=jparse(t.labels,[])[0], L=lb&&TASK_LABELS.find(x=>x.k===lb); return `<div class="cal-task ${ov?'ov':sn?'soon':''}" data-id="${esc(t.id)}" title="${esc(t.title)}"><span class="cal-dot" style="background:${L?L.c:'var(--muted2)'}"></span>${esc(t.title)}</div>`; }).join('')
        +(list.length>4?`<div class="cal-more">+${list.length-4} ещё</div>`:'')+`</div>`; }
    cal.innerHTML=`<div class="cal-head"><button class="btn sm" id="calPrev">‹</button><div class="cal-title">${esc(monthName)}</div><button class="btn sm" id="calNext">›</button><button class="btn sm" id="calToday">Сегодня</button>${noDue?`<span class="ph-sub" style="margin-left:auto">без срока: ${noDue}</span>`:''}</div>
      <div class="cal-grid cal-dows">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(x=>`<div class="cal-dow">${x}</div>`).join('')}</div>
      <div class="cal-grid">${cells}</div>`;
    cal.querySelector('#calPrev').onclick=()=>{ calM--; if(calM<0){calM=11;calY--;} renderCalendar(); };
    cal.querySelector('#calNext').onclick=()=>{ calM++; if(calM>11){calM=0;calY++;} renderCalendar(); };
    cal.querySelector('#calToday').onclick=()=>{ const n=new Date(); calY=n.getFullYear(); calM=n.getMonth(); renderCalendar(); };
    cal.querySelectorAll('.cal-task').forEach(e=>e.onclick=()=>{ const t=current.find(x=>x.id===e.dataset.id); if(t)taskModalLive(t,load); });
    cnt.textContent=vis.length+(vis.length!==current.length?(' из '+current.length):'')+' задач';
  }
  function badge(){ window.__taskBadge=current.filter(t=>stOf(t)!=='done').length; if(typeof renderNav==='function')renderNav(); }
  async function load(){
    const [rc,r]=await Promise.all([api('/api/task-columns'),api('/api/tasks?status=all')]);
    if(!r.ok){ board.innerHTML=`<div class="note" style="margin:0">${ic('i-info','sm')} Задачи в демо-режиме (нет связи с сервером).</div>`; cnt.textContent=''; return; }
    cols=(rc&&rc.ok&&(rc.data.items||[]).length)?rc.data.items:[{id:'todo',title:'К выполнению',position:1},{id:'doing',title:'В работе',position:2},{id:'done',title:'Готово',position:3}];
    current=r.data.items||[];
    const as=[...new Set(current.map(t=>(t.assignee||'').trim()).filter(Boolean))].sort();
    faSel.innerHTML='<option value="">Все ответственные</option>'+as.map(a=>`<option value="${esc(a)}" ${a===fAssignee?'selected':''}>${esc(a)}</option>`).join('');
    badge(); render();
  }
  window.__reloadTasks=load;
  load();
};
async function fetchUsers(){ const r=await api('/api/users'); if(!r||!r.ok) return []; return r.data.items||[]; }
let __storesCache=null;
async function fetchStores(){ if(__storesCache) return __storesCache; const r=await api('/api/1c/stores'); __storesCache=(r&&r.ok)?(r.data.items||[]):[]; return __storesCache; }
async function fetchCardTypes(){ const r=await api('/api/1c/card-types'); if(!r||!r.ok) return []; return r.data.items||[]; }
function storeSelectHtml(stores, selectedKey, attr, allLabel){ const sel=(selectedKey||'').toString(); return `<select ${attr}><option value="">${allLabel||'— точка —'}</option>`+(stores||[]).map(s=>`<option value="${esc(s.ref_key)}" ${s.ref_key===sel?'selected':''}>${esc(s.name)}</option>`).join('')+`</select>`; }
function userSelectHtml(users, selectedName, attr){
  const sel=(selectedName||'').trim();
  let opts='<option value="">— не назначен —</option>'+users.map(u=>`<option value="${esc(u.name)}" ${u.name===sel?'selected':''}>${esc(u.name)}${u.roleName?(' · '+esc(u.roleName)):''}</option>`).join('');
  if(sel && !users.some(u=>u.name===sel)) opts+=`<option value="${esc(sel)}" selected>${esc(sel)} (текущий)</option>`;
  return `<select ${attr}>${opts}</select>`;
}
function fmtDue(s){ if(!s)return ''; const p=String(s).split('T'); const d=p[0].split('-'); if(d.length<3)return s; return d[2]+'.'+d[1]+'.'+d[0]+(p[1]?(' '+p[1].slice(0,5)):''); }
function dtLocal(s){ if(!s)return ''; if(String(s).length===10)return s+'T00:00'; return String(s).slice(0,16); }
async function newTaskLive(onSaved){
  const users=await fetchUsers();
  const bg=openModal(`<div class="modal-h"><div><h3>Новая задача</h3></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="fld"><label>Название *</label><input data-nt="title" placeholder="Напр. перезвонить клиенту"></div>
    <div class="fld-row"><div class="fld"><label>Тип</label><select data-nt="type"><option>задача</option><option>звонок</option><option>встреча</option><option>отгрузка</option><option>email</option></select></div><div class="fld"><label>Срок (дата и время)</label><input type="datetime-local" data-nt="due"></div></div>
    <div class="fld-row"><div class="fld"><label>Приоритет</label><select data-nt="prio"><option value="normal">обычный</option><option value="high">срочно</option></select></div><div class="fld"><label>Ответственный</label>${userSelectHtml(users,(AUTH.user||{}).name||'','data-nt="assignee"')}</div></div>
    <div class="fld"><label>Клиент из 1С (необязательно)</label><div style="position:relative"><div class="fld-in" style="width:100%">${ic('i-search','sm')}<input data-nt="client" placeholder="поиск по 1С" autocomplete="off" style="width:100%"></div><div id="ntSug" class="panel" style="position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:40;display:none;max-height:200px;overflow:auto;box-shadow:var(--shadow-lg)"></div></div></div>
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
async function taskModalLive(t,onSaved){
  setEntityHash('tasks', t.id);
  const users=await fetchUsers();
  let lbls=jparse(t.labels,[]), cl=jparse(t.checklist,[]), cms=jparse(t.comments,[]), atts=jparse(t.attachments,[]);
  if(!Array.isArray(lbls))lbls=[]; if(!Array.isArray(cl))cl=[]; if(!Array.isArray(cms))cms=[]; if(!Array.isArray(atts))atts=[];
  const bg=openModal(`<div class="modal-h"><div><h3>Задача</h3></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="fld"><label>Название</label><input data-tm="title" value="${esc(t.title||'')}"></div>
    <div class="fld-row"><div class="fld"><label>Тип</label><select data-tm="type">${['задача','звонок','встреча','отгрузка','email'].map(x=>`<option ${x===t.type?'selected':''}>${x}</option>`).join('')}</select></div><div class="fld"><label>Срок (дата и время)</label><input type="datetime-local" data-tm="due" value="${esc(dtLocal(t.due_at))}"></div></div>
    <div class="fld-row"><div class="fld"><label>Приоритет</label><select data-tm="prio"><option value="normal" ${t.priority!=='high'?'selected':''}>обычный</option><option value="high" ${t.priority==='high'?'selected':''}>срочно</option></select></div><div class="fld"><label>Ответственный</label>${userSelectHtml(users,t.assignee,'data-tm="assignee"')}</div></div>
    <div class="fld"><label>Метки</label><div id="tmLabels" class="chips"></div></div>
    <div class="fld"><label>Чек-лист <span id="tmClProg" class="muted2" style="font-weight:400;font-size:11px"></span></label><div id="tmCl" style="display:flex;flex-direction:column;gap:5px"></div>
      <div class="row" style="gap:6px;margin-top:7px"><input id="tmClNew" placeholder="Добавить пункт…" style="flex:1"><button class="btn sm" id="tmClAdd">${ic('i-plus','sm')}</button></div></div>
    <div class="fld"><label>Вложения</label><div id="tmAtt" style="display:flex;flex-direction:column;gap:6px"></div>
      <div class="row" style="gap:8px;margin-top:7px"><input type="file" id="tmAttFile" style="display:none"><button class="btn sm" id="tmAttBtn">${ic('i-plus','sm')} Файл</button><span class="muted2" id="tmAttHint" style="font-size:11px">до 15 МБ</span></div></div>
    <div class="fld"><label>Заметка</label><input data-tm="note" value="${esc(t.note||'')}"></div>
    ${t.client_name?`<div class="note blue">${ic('i-info','sm')} Клиент: ${esc(t.client_name)}</div>`:''}
    <div class="fld section-gap"><label>Обсуждение</label><div id="tmCms" style="display:flex;flex-direction:column;gap:8px;max-height:170px;overflow:auto"></div>
      <div class="row" style="gap:6px;margin-top:7px"><input id="tmCmNew" placeholder="Написать комментарий…" style="flex:1"><button class="btn sm" id="tmCmAdd">${ic('i-plus','sm')} Добавить</button></div></div>
  </div>
  <div class="modal-f"><button class="btn" id="tmDel" style="color:var(--red)">${ic('i-x','sm')} Удалить</button><button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="tmSave">Сохранить</button></div>`);
  // Метки
  const lblBox=bg.querySelector('#tmLabels');
  function renderLabels(){ lblBox.innerHTML=TASK_LABELS.map(L=>`<button type="button" class="chip ${lbls.includes(L.k)?'on':''}" data-k="${L.k}" style="${lbls.includes(L.k)?('background:'+L.c+'22;border-color:'+L.c+';color:'+L.c):''}">${esc(L.t)}</button>`).join('');
    lblBox.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{ const k=b.dataset.k; lbls=lbls.includes(k)?lbls.filter(x=>x!==k):[...lbls,k]; renderLabels(); }); }
  renderLabels();
  // Чек-лист
  const clBox=bg.querySelector('#tmCl'), clProg=bg.querySelector('#tmClProg');
  function renderCl(){ const dn=cl.filter(i=>i.done).length; clProg.textContent=cl.length?(dn+'/'+cl.length+' выполнено'):'';
    clBox.innerHTML=cl.length?cl.map((it,i)=>`<div class="row" style="gap:9px;align-items:center"><span class="ck-box ${it.done?'on':''}" data-ci="${i}">✓</span><span style="flex:1;font-size:13.5px;${it.done?'text-decoration:line-through;opacity:.55':''}">${esc(it.text)}</span><button type="button" class="btn sm" data-cd="${i}" style="flex:none">${ic('i-x','sm')}</button></div>`).join(''):'<div class="muted2" style="font-size:12px">Пунктов нет</div>';
    clBox.querySelectorAll('[data-ci]').forEach(b=>b.onclick=()=>{ cl[+b.dataset.ci].done=!cl[+b.dataset.ci].done; renderCl(); });
    clBox.querySelectorAll('[data-cd]').forEach(b=>b.onclick=()=>{ cl.splice(+b.dataset.cd,1); renderCl(); }); }
  renderCl();
  const clNew=bg.querySelector('#tmClNew'); const addCl=()=>{ const v=clNew.value.trim(); if(!v)return; cl.push({text:v.slice(0,200),done:false}); clNew.value=''; renderCl(); clNew.focus(); };
  bg.querySelector('#tmClAdd').onclick=addCl; clNew.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();addCl();} });
  // Вложения
  const attBox=bg.querySelector('#tmAtt'), attFile=bg.querySelector('#tmAttFile'), attHint=bg.querySelector('#tmAttHint');
  function renderAtt(){ attBox.innerHTML=atts.length?atts.map((a,i)=>`<div class="row" style="gap:8px;align-items:center;background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:6px 9px"><span style="flex:1;min-width:0;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.name)}</span><span class="muted2" style="font-size:11px;flex:none">${fmtSize(a.size)}</span><button type="button" class="btn sm" data-dl="${i}" title="Скачать">↓</button><button type="button" class="btn sm" data-rm="${esc(a.key)}" title="Удалить">${ic('i-x','sm')}</button></div>`).join(''):'<div class="muted2" style="font-size:12px">Файлов нет</div>';
    attBox.querySelectorAll('[data-dl]').forEach(b=>b.onclick=()=>downloadTaskFile(t.id,+b.dataset.dl,atts[+b.dataset.dl].name));
    attBox.querySelectorAll('[data-rm]').forEach(b=>b.onclick=async()=>{ if(!confirm('Удалить файл?'))return; const r=await api('/api/tasks/'+t.id,{method:'POST',body:JSON.stringify({remove_attach:b.dataset.rm})}); if(r.ok){ atts=atts.filter(a=>a.key!==b.dataset.rm); renderAtt(); if(onSaved)onSaved(); } else toast('Ошибка','i-x','#dc2626'); }); }
  renderAtt();
  bg.querySelector('#tmAttBtn').onclick=()=>attFile.click();
  attFile.onchange=async()=>{ const f=attFile.files[0]; if(!f)return; if(f.size>15*1024*1024){ toast('Файл больше 15 МБ','i-info'); attFile.value=''; return; } attHint.textContent='Загрузка…'; const r=await uploadTaskFile(t.id,f); attHint.textContent='до 15 МБ'; attFile.value=''; if(r.ok&&r.data.attachment){ atts=[...atts,r.data.attachment]; renderAtt(); toast('Файл загружен','i-check2'); if(onSaved)onSaved(); } else toast((r.data&&r.data.error)||'Не удалось загрузить','i-x','#dc2626'); };
  // Комментарии
  const cmsBox=bg.querySelector('#tmCms');
  function renderCms(){ cmsBox.innerHTML=cms.length?cms.map(cm=>`<div style="background:var(--bg2);border:1px solid var(--line);border-radius:9px;padding:8px 10px"><div class="muted2" style="font-size:11px;margin-bottom:3px">${esc(cm.author||'—')} · ${fmtWhen(cm.at)}</div><div style="font-size:13px;white-space:pre-wrap">${esc(cm.text)}</div></div>`).join(''):'<div class="muted2" style="font-size:12px">Комментариев нет</div>'; cmsBox.scrollTop=cmsBox.scrollHeight; }
  renderCms();
  const cmNew=bg.querySelector('#tmCmNew');
  bg.querySelector('#tmCmAdd').onclick=async()=>{ const v=cmNew.value.trim(); if(!v)return; const r=await api('/api/tasks/'+t.id,{method:'POST',body:JSON.stringify({add_comment:{text:v}})}); if(r.ok){ cms=[...cms,{text:v,author:(AUTH.user||{}).name||'—',at:Date.now()}]; cmNew.value=''; renderCms(); if(onSaved)onSaved(); } else toast('Ошибка','i-x','#dc2626'); };
  cmNew.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();bg.querySelector('#tmCmAdd').click();} });
  bg.querySelector('#tmSave').onclick=async()=>{ const body={title:bg.querySelector('[data-tm=title]').value.trim(),type:bg.querySelector('[data-tm=type]').value,priority:bg.querySelector('[data-tm=prio]').value,due_at:bg.querySelector('[data-tm=due]').value,assignee:bg.querySelector('[data-tm=assignee]').value,note:bg.querySelector('[data-tm=note]').value.trim(),labels:lbls,checklist:cl}; const r=await api('/api/tasks/'+t.id,{method:'POST',body:JSON.stringify(body)}); if(!r.ok){toast('Ошибка','i-x','#dc2626');return;} closeModal(); toast('Сохранено','i-check2'); onSaved&&onSaved(); };
  bg.querySelector('#tmDel').onclick=async()=>{ if(!confirm('Удалить задачу?'))return; const r=await api('/api/tasks/'+t.id,{method:'DELETE'}); if(r.ok){closeModal();toast('Удалено','i-check2');onSaved&&onSaved();} else toast('Ошибка','i-x','#dc2626'); };
}

// ---------- SUBS ----------
PAGES.subs=(c)=>{
  const tbar=el(`<div class="toolbar">
    <div class="seg" data-sb="filter"><button class="on" data-s="active">Активные</button><button data-s="all">Все</button><button data-s="paused">На паузе</button></div>
    <div class="spacer"></div><span class="ph-sub" data-sb="cnt"></span>
    <button class="btn primary" id="newSubBtn">${ic('i-plus','sm')} Подписка</button></div>`);
  const cards=el(`<div class="cards-row section-gap"></div>`);
  const grid=el(`<div class="grid-3 section-gap"><div class="muted2" style="padding:14px">Загрузка…</div></div>`);
  c.appendChild(tbar); c.appendChild(cards); c.appendChild(grid);
  c.appendChild(el(`<div class="note section-gap">${ic('i-info','sm')} Подписки — авто-напоминание о следующем заказе набора. «Доставлено» сдвигает дату на период вперёд. Клиента можно привязать из 1С.</div>`));
  const cnt=tbar.querySelector('[data-sb=cnt]'), seg=tbar.querySelector('[data-sb=filter]');
  let status='active';
  seg.querySelectorAll('button').forEach(b=>b.onclick=()=>{ seg.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); status=b.dataset.s; load(); });
  tbar.querySelector('#newSubBtn').onclick=()=>newSubLive(load);
  const soon=(d)=>d&&d<=new Date(Date.now()+14*864e5).toISOString().slice(0,10);
  function card(s){
    const active=s.status==='active';
    const co=el(`<div class="list-card">
      <div class="row"><div class="k-ic" style="width:38px;height:38px;border-radius:11px;background:#7c3aed22;color:#c4b5fd;display:grid;place-items:center">${ic('i-repeat')}</div>
        <div style="min-width:0"><div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.client_name||'—')}</div><div class="muted" style="font-size:12px">${esc(s.product||'—')}</div></div>
        <span class="tag ${active?'green':'amber'}" style="margin-left:auto">${active?'активна':'пауза'}</span></div>
      <div class="grid-3 section-gap" style="gap:10px">
        <div><div class="muted" style="font-size:11px">Период</div><div style="font-weight:600">${s.interval_months||1} мес</div></div>
        <div><div class="muted" style="font-size:11px">Цена</div><div style="font-weight:600">${money(s.amount||0)}</div></div>
        <div><div class="muted" style="font-size:11px">След. отгрузка</div><div style="font-weight:600${soon(s.next_at)&&active?';color:var(--amber)':''}">${s.next_at?esc(s.next_at):'—'}</div></div>
      </div>
      <div class="row section-gap" style="gap:8px;padding-top:12px;border-top:1px solid var(--line);flex-wrap:wrap">
        ${active?`<button class="btn sm" data-act="deliver">${ic('i-check2','sm')} Доставлено</button>`:''}
        <button class="btn sm" data-act="toggle">${ic('i-pause','sm')} ${active?'Пауза':'Возобновить'}</button>
        <button class="btn sm" data-act="edit">${ic('i-edit','sm')} Изменить</button>
      </div></div>`);
    const db=co.querySelector('[data-act=deliver]'); if(db) db.onclick=async()=>{ const r=await api('/api/subs/'+s.id,{method:'POST',body:JSON.stringify({delivered:true})}); if(r.ok){toast('Отгружено · дата сдвинута на '+(s.interval_months||1)+' мес','i-repeat','#7c3aed');load();} else toast('Ошибка','i-x','#dc2626'); };
    co.querySelector('[data-act=toggle]').onclick=async()=>{ const r=await api('/api/subs/'+s.id,{method:'POST',body:JSON.stringify({status:active?'paused':'active'})}); if(r.ok){toast(active?'Подписка на паузе':'Подписка возобновлена','i-pause');load();} else toast('Ошибка','i-x','#dc2626'); };
    co.querySelector('[data-act=edit]').onclick=()=>subModalLive(s,load);
    return co;
  }
  async function load(){
    const r=await api('/api/subs?status='+status);
    if(!r.ok){ cnt.textContent='демо · нет связи'; cards.innerHTML=''; grid.innerHTML=''; (DB.subs||[]).forEach(s=>grid.appendChild(el(`<div class="list-card"><div class="row"><div style="font-weight:700">${esc(s.client)}</div><span class="tag ${s.status==='активна'?'green':'amber'}" style="margin-left:auto">${esc(s.status)}</span></div><div class="muted section-gap" style="font-size:12px">${esc(s.set)} · ${esc(s.period)} · ${money(s.price)} · след ${esc(s.next)}</div></div>`))); return; }
    const items=r.data.items||[], tt=r.data.totals||{};
    cnt.textContent=(tt.active||0)+' активных';
    cards.innerHTML=miniStat('i-repeat','#7c3aed','Активных подписок',(tt.active||0))+miniStat('i-money','#10b981','Сумма активных/период',money(tt.amount||0))+miniStat('i-bell','#d97706','Ближайшие · ≤14 дн',(tt.soon||0));
    grid.innerHTML=''; if(!items.length){ grid.innerHTML='<div class="muted2" style="padding:16px;font-size:13px">Подписок нет. Нажмите «Подписка».</div>'; return; }
    items.forEach(s=>grid.appendChild(card(s)));
  }
  load();
};
// Редактор состава набора: поиск товаров в каталоге 1С + мультивыбор + кол-во + авто-сумма
function makeItemsEditor(initial){
  const items=(initial||[]).map(x=>({ref:x.ref||null,name:x.name||'',qty:x.qty||1,price:x.price||0}));
  const node=el(`<div>
    <div style="position:relative">
      <div class="fld-in" style="width:100%">${ic('i-search','sm')}<input data-ie="q" placeholder="добавить товар из каталога 1С" autocomplete="off" style="width:100%"></div>
      <div data-ie="sug" class="panel" style="position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:40;display:none;max-height:220px;overflow:auto;box-shadow:var(--shadow-lg)"></div>
    </div>
    <div data-ie="list" style="margin-top:8px"></div>
    <div class="row" style="justify-content:space-between;padding:9px 2px 2px;border-top:1px solid var(--line);margin-top:6px"><span class="muted">Итого за отгрузку</span><b data-ie="total" style="font-size:15px"></b></div>
  </div>`);
  const q=node.querySelector('[data-ie=q]'),sug=node.querySelector('[data-ie=sug]'),list=node.querySelector('[data-ie=list]'),totalEl=node.querySelector('[data-ie=total]');
  const total=()=>items.reduce((a,x)=>a+(x.price||0)*(x.qty||1),0);
  function renderList(){
    list.innerHTML = items.length ? items.map((x,i)=>`<div class="row" style="gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line)">
      <div style="flex:1;min-width:0"><div style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(x.name||'—')}</div><div class="muted2" style="font-size:11px">${money(x.price||0)} × ${x.qty}</div></div>
      <button class="btn sm" data-q="-" data-i="${i}">−</button><b style="min-width:20px;text-align:center">${x.qty}</b><button class="btn sm" data-q="+" data-i="${i}">+</button>
      <button class="btn sm" data-rm="${i}" title="Убрать">${ic('i-x','sm')}</button></div>`).join('') : '<div class="muted2" style="font-size:12px;padding:6px 2px">Товары не добавлены — найдите выше</div>';
    list.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;items[i].qty=Math.max(1,(items[i].qty||1)+(b.dataset.q==='+'?1:-1));renderList();});
    list.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{items.splice(+b.dataset.rm,1);renderList();});
    totalEl.textContent=money(total());
  }
  let qt=null;
  q.addEventListener('input',()=>{clearTimeout(qt);const v=q.value.trim();if(v.length<2){sug.style.display='none';return;}
    qt=setTimeout(async()=>{const r=await api('/api/1c/products?limit=8&q='+encodeURIComponent(v));if(!r.ok||!(r.data.items||[]).length){sug.style.display='none';return;}
      sug.innerHTML=r.data.items.map(p=>`<div class="doc-row" data-ref="${esc(p.ref_key)}" data-name="${esc(p.name||'')}" data-price="${p.price||0}"><div><div class="dt">${esc(p.name||'—')}</div><div class="ds">${esc(p.code||'')} · ${p.price!=null?money(p.price):'без цены'}</div></div></div>`).join('');
      sug.style.display='block';
      sug.querySelectorAll('[data-ref]').forEach(it=>it.onclick=()=>{const ref=it.dataset.ref;const ex=items.find(x=>x.ref===ref);if(ex)ex.qty++;else items.push({ref,name:it.dataset.name,qty:1,price:Number(it.dataset.price)||0});q.value='';sug.style.display='none';renderList();});},300);});
  renderList();
  return {node,getItems:()=>items,total};
}
function newSubLive(onSaved){
  const ed=makeItemsEditor([]);
  const bg=openModal(`<div class="modal-h"><div><h3>Новая подписка</h3></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="fld"><label>Клиент *</label><div style="position:relative"><div class="fld-in" style="width:100%">${ic('i-search','sm')}<input data-ns="client" placeholder="поиск в 1С или ввод вручную" autocomplete="off" style="width:100%"></div><div id="nsSug" class="panel" style="position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:40;display:none;max-height:200px;overflow:auto;box-shadow:var(--shadow-lg)"></div></div></div>
    <div class="fld-row"><div class="fld"><label>Телефон</label><input data-ns="phone"></div><div class="fld"><label>Ответственный</label><input data-ns="mgr" value="${esc((AUTH.user||{}).name||'')}"></div></div>
    <div class="fld"><label>Состав набора (товары из 1С)</label><div id="nsItems"></div></div>
    <div class="fld-row"><div class="fld"><label>Период</label><select data-ns="interval"><option value="1">1 мес</option><option value="2">2 мес</option><option value="3" selected>3 мес</option><option value="6">6 мес</option><option value="12">12 мес</option></select></div><div class="fld"><label>След. отгрузка</label><input type="date" data-ns="next"></div></div>
  </div>
  <div class="modal-f"><button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="nsSave">Создать</button></div>`);
  bg.querySelector('#nsItems').appendChild(ed.node);
  const q=bg.querySelector('[data-ns=client]'), sug=bg.querySelector('#nsSug'); let ref=null,qt=null;
  q.addEventListener('input',()=>{ ref=null; clearTimeout(qt); const v=q.value.trim(); if(v.length<2){sug.style.display='none';return;}
    qt=setTimeout(async()=>{ const r=await api('/api/1c/contractors?limit=6&q='+encodeURIComponent(v)); if(!r.ok||!(r.data.items||[]).length){sug.style.display='none';return;}
      sug.innerHTML=r.data.items.map(x=>`<div class="doc-row" data-ref="${esc(x.ref_key)}" data-name="${esc(x.name||'')}" data-phone="${esc(x.phone||'')}"><div><div class="dt">${esc(x.name||'—')}</div><div class="ds">${esc(x.code||'')} · ${esc(x.phone||'')}</div></div></div>`).join(''); sug.style.display='block';
      sug.querySelectorAll('[data-ref]').forEach(it=>it.onclick=()=>{ref=it.dataset.ref;q.value=it.dataset.name;bg.querySelector('[data-ns=phone]').value=it.dataset.phone;sug.style.display='none';}); },300); });
  bg.querySelector('#nsSave').onclick=async()=>{ const name=q.value.trim(); if(!name){toast('Укажите клиента','i-info');return;}
    const body={client_ref:ref,client_name:name,phone:bg.querySelector('[data-ns=phone]').value.trim(),items:ed.getItems(),interval_months:bg.querySelector('[data-ns=interval]').value,next_at:bg.querySelector('[data-ns=next]').value,mgr:bg.querySelector('[data-ns=mgr]').value.trim()};
    const r=await api('/api/subs',{method:'POST',body:JSON.stringify(body)}); if(!r.ok){toast('Не удалось создать','i-x','#dc2626');return;} closeModal(); toast('Подписка создана','i-repeat','#7c3aed'); onSaved&&onSaved(); };
}
function subModalLive(s,onSaved){
  let init=[]; try{ init=JSON.parse(s.items||'[]'); }catch(e){}
  const ed=makeItemsEditor(init);
  const bg=openModal(`<div class="modal-h"><div><h3>Подписка</h3><div class="mh-sub">${esc(s.client_name||'')}</div></div><button class="x" onclick="closeModal()">${ic('i-x')}</button></div>
  <div class="modal-b">
    <div class="fld"><label>Состав набора (товары из 1С)</label><div id="smItems"></div></div>
    <div class="fld-row"><div class="fld"><label>Период</label><select data-sm="interval">${[1,2,3,6,12].map(n=>`<option value="${n}" ${n===s.interval_months?'selected':''}>${n} мес</option>`).join('')}</select></div><div class="fld"><label>След. отгрузка</label><input type="date" data-sm="next" value="${esc(s.next_at||'')}"></div></div>
    <div class="fld-row"><div class="fld"><label>Телефон</label><input data-sm="phone" value="${esc(s.phone||'')}"></div><div class="fld"><label>Ответственный</label><input data-sm="mgr" value="${esc(s.mgr||'')}"></div></div>
    <div class="fld"><label>Комментарий</label><input data-sm="note" value="${esc(s.note||'')}"></div>
    ${!init.length&&s.product?`<div class="note section-gap">${ic('i-info','sm')} Старый набор: ${esc(s.product)}. Добавьте товары из 1С, чтобы цена считалась автоматически.</div>`:''}
  </div>
  <div class="modal-f"><button class="btn" id="smDel" style="color:var(--red)">${ic('i-x','sm')} Удалить</button><button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="smSave">Сохранить</button></div>`);
  bg.querySelector('#smItems').appendChild(ed.node);
  bg.querySelector('#smSave').onclick=async()=>{ const body={items:ed.getItems(),interval_months:bg.querySelector('[data-sm=interval]').value,next_at:bg.querySelector('[data-sm=next]').value,phone:bg.querySelector('[data-sm=phone]').value.trim(),mgr:bg.querySelector('[data-sm=mgr]').value.trim(),note:bg.querySelector('[data-sm=note]').value.trim()}; const r=await api('/api/subs/'+s.id,{method:'POST',body:JSON.stringify(body)}); if(!r.ok){toast('Ошибка','i-x','#dc2626');return;} closeModal(); toast('Сохранено','i-check2'); onSaved&&onSaved(); };
  bg.querySelector('#smDel').onclick=async()=>{ if(!confirm('Удалить подписку?'))return; const r=await api('/api/subs/'+s.id,{method:'DELETE'}); if(r.ok){closeModal();toast('Удалено','i-check2');onSaved&&onSaved();} else toast('Ошибка','i-x','#dc2626'); };
}

// ---------- TRIGGERS ----------
PAGES.triggers=(c)=>{
  const tbar=el(`<div class="toolbar">
    <div class="seg" data-tg="tab"><button class="on" data-t="birthdays">🎂 Дни рождения</button><button data-t="lapsed">⏳ Давно не покупали</button><button data-t="repeat">🔁 Повтор покупки</button></div>
    <div class="spacer"></div><span class="ph-sub" data-tg="cnt"></span>
  </div>`);
  const panel=el(`<div class="panel section-gap"><div class="muted2" style="padding:16px">Загрузка…</div></div>`);
  c.appendChild(tbar); c.appendChild(panel);
  c.appendChild(el(`<div class="note blue section-gap">${ic('i-info','sm')} Триггеры — списки клиентов из 1С под действие: «🎂» ближайшие ДР, «⏳» не покупали 60+ дней, «🔁» пора повторить покупку. Кнопка «Задача» создаёт напоминание. Авто-рассылка в WhatsApp — после подключения GreenAPI.</div>`));
  let data=null, tab='birthdays';
  const seg=tbar.querySelector('[data-tg=tab]'), cnt=tbar.querySelector('[data-tg=cnt]');
  function render(){
    const sgm=(data&&data[tab])||{items:[]}, items=sgm.items||[];
    cnt.textContent=items.length+' клиентов';
    if(!items.length){ panel.innerHTML=`<div class="muted2" style="padding:28px;text-align:center">Нет клиентов в этом сегменте</div>`; return; }
    const dateCol=tab==='birthdays'?'День рождения':'Последняя покупка';
    const rows=items.map(x=>{
      const phone=(x.phone||'').trim();
      const phoneCell=phone?`<a href="tel:${esc(phone)}" style="color:var(--accent2)">${esc(phone)}</a>`:'<span class="muted2">—</span>';
      let info,sub;
      if(tab==='birthdays'){ info=esc(x.next_bday||''); sub=x.days_until<=0?'сегодня! 🎉':x.days_until===1?'завтра':('через '+x.days_until+' дн'); }
      else { info=esc(x.last_buy||''); sub=(x.days_since||0)+' дн назад'+(x.total?(' · '+money(x.total)):''); }
      return `<tr>
        <td style="font-weight:600">${esc(x.name||'—')}</td>
        <td>${phoneCell}</td>
        <td>${info}<div class="muted2" style="font-size:11px">${sub}</div></td>
        <td class="num"><button class="btn sm" data-task="${esc(x.ref_key)}">${ic('i-plus','sm')} Задача</button></td>
      </tr>`;
    }).join('');
    panel.innerHTML=`<table class="tbl"><thead><tr><th>Клиент</th><th>Телефон</th><th>${dateCol}</th><th class="num"></th></tr></thead><tbody>${rows}</tbody></table>`;
    panel.querySelectorAll('[data-task]').forEach(b=>b.onclick=async()=>{
      const x=items.find(i=>i.ref_key===b.dataset.task); if(!x)return;
      const title=tab==='birthdays'?('Поздравить с ДР — '+(x.name||'')):tab==='lapsed'?('Реактивация — '+(x.name||'')):('Напомнить о покупке — '+(x.name||''));
      b.disabled=true;
      const r=await api('/api/tasks',{method:'POST',body:JSON.stringify({title,type:'звонок',client_ref:x.ref_key,client_name:x.name||'',assignee:(AUTH.user||{}).name||''})});
      if(r.ok){ toast('Задача создана','i-check2'); b.outerHTML='<span class="tag green">✓ задача</span>'; }
      else { toast((r.data&&r.data.error)||'Ошибка','i-x','#dc2626'); b.disabled=false; }
    });
  }
  seg.querySelectorAll('button').forEach(b=>b.onclick=()=>{ seg.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); tab=b.dataset.t; render(); });
  (async()=>{
    const r=await api('/api/triggers');
    if(!r.ok){ panel.innerHTML=`<div class="note">${ic('i-info','sm')} Триггеры в демо-режиме (нет доступа к 1С).</div>`; cnt.textContent=''; return; }
    data=r.data;
    seg.querySelector('[data-t=birthdays]').textContent='🎂 ДР · '+(data.birthdays.count||0);
    seg.querySelector('[data-t=lapsed]').textContent='⏳ Не покупали · '+(data.lapsed.count||0);
    seg.querySelector('[data-t=repeat]').textContent='🔁 Повтор · '+(data.repeat.count||0);
    render();
  })();
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
function isoDaysAgo(n){ const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); }
PAGES.kpi=async(c)=>{
  const khStores=await fetchStores();
  const tbar=el(`<div class="toolbar">
    <div class="seg" data-kh="range">
      <button data-d="7">7 дней</button>
      <button class="on" data-d="30">30 дней</button>
      <button data-d="90">90 дней</button>
    </div>
    <div class="fld-in">${ic('i-clock','sm')}<input type="date" data-kh="from" title="С даты"></div>
    <div class="fld-in">${ic('i-clock','sm')}<input type="date" data-kh="to" title="По дату"></div>
    <button class="btn sm" data-kh="apply">Показать</button>
    ${storeSelectHtml(khStores,'','class="sel" data-kh="store" title="Точка"','Все точки')}
  </div>`);
  const cards=el(`<div class="cards-row section-gap"></div>`);
  const panel=el(`<div class="panel section-gap"><table class="tbl"><thead><tr><th style="width:38px">#</th><th>Продавец</th><th class="num">Выручка</th><th class="num">Прибыль</th><th class="num">Маржа</th><th class="num">Чеки</th><th class="num">Ср. чек</th><th class="num">Доля</th></tr></thead><tbody><tr><td colspan="8" class="muted2" style="padding:16px">Загрузка…</td></tr></tbody></table></div>`);
  c.appendChild(tbar); c.appendChild(cards); c.appendChild(panel);
  c.appendChild(el(`<div class="note blue section-gap">${ic('i-info','sm')} KPI из реальных продаж 1С по ответственному (продавцу) за период. «Чеки» — число документов продаж, «Ср. чек» — выручка ÷ чеки, «Маржа» — прибыль ÷ выручка. Планы/бонусы добавим по формуле заказчика.</div>`));
  const seg=tbar.querySelector('[data-kh=range]'), fromI=tbar.querySelector('[data-kh=from]'), toI=tbar.querySelector('[data-kh=to]'), applyB=tbar.querySelector('[data-kh=apply]');
  let curF=isoDaysAgo(30), curT=isoDaysAgo(0);
  const go=(f,t)=>{ curF=f; curT=t; loadKpi(cards,panel,f,t,tbar.querySelector('[data-kh=store]').value); };
  seg.querySelectorAll('button').forEach(b=>b.onclick=()=>{ seg.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); fromI.value='';toI.value=''; go(isoDaysAgo(+b.dataset.d),isoDaysAgo(0)); });
  applyB.onclick=()=>{ if(fromI.value&&toI.value){ seg.querySelectorAll('button').forEach(x=>x.classList.remove('on')); go(fromI.value,toI.value); } else toast('Укажите обе даты','i-info'); };
  tbar.querySelector('[data-kh=store]').onchange=()=>go(curF,curT);
  go(isoDaysAgo(30),isoDaysAgo(0));
};
async function loadKpi(cards,panel,from,to,store){
  const tb=panel.querySelector('tbody');
  cards.innerHTML=''; tb.innerHTML=`<tr><td colspan="8" class="muted2" style="padding:16px">Загрузка…</td></tr>`;
  const r=await api('/api/1c/sales/summary?from='+from+'&to='+to+(store?('&store='+encodeURIComponent(store)):''));
  if(!r.ok){
    cards.innerHTML=miniStat('i-target','#7c3aed','KPI продавцов','демо');
    tb.innerHTML=(DB.sellers||[]).map((s,i)=>`<tr><td>${i+1}</td><td>${esc(s.name)}</td><td class="num">${money(s.fact)}</td><td class="num">—</td><td class="num">—</td><td class="num">—</td><td class="num">—</td><td class="num">—</td></tr>`).join('');
    return;
  }
  const t=r.data.totals||{}, sellers=(r.data.bySeller||[]).filter(s=>s.revenue>0);
  cards.innerHTML =
     dashKpi('i-money','#10b981','Выручка',money(t.revenue||0),sellers.length+' прод.',0)
    +dashKpi('i-chart','#2563eb','Прибыль · '+(t.margin||0)+'%',money(t.profit||0),'',0)
    +dashKpi('i-doc','#7c3aed','Чеки',(t.docs||0).toLocaleString('ru-RU'),'',0)
    +dashKpi('i-cart','#0891b2','Средний чек',money(t.avg||0),'',0);
  if(!sellers.length){ tb.innerHTML=`<tr><td colspan="8" class="muted2" style="padding:16px">Нет продаж за выбранный период</td></tr>`; return; }
  const maxRev=Math.max(...sellers.map(s=>s.revenue),1), totalRev=t.revenue||sellers.reduce((a,s)=>a+s.revenue,0)||1;
  tb.innerHTML=sellers.map((s,i)=>{
    const margin=s.revenue>0?Math.round(s.profit/s.revenue*100):0, avg=s.docs?Math.round(s.revenue/s.docs):0;
    const share=Math.round(s.revenue/totalRev*100), barW=Math.max(2,Math.round(s.revenue/maxRev*100));
    const rank=i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1);
    return `<tr>
      <td style="font-weight:700">${rank}</td>
      <td><div class="row" style="gap:9px"><span class="avatar-xs" style="width:30px;height:30px;font-size:11px;background:${avBg(s.name||'?')}">${initials(s.name||'?')}</span><span style="font-weight:600">${esc(s.name||'—')}</span></div></td>
      <td class="num"><div style="font-weight:700">${money(s.revenue)}</div><div style="height:4px;background:var(--line);border-radius:3px;margin-top:4px;overflow:hidden"><div style="height:100%;width:${barW}%;background:var(--accent2)"></div></div></td>
      <td class="num">${money(s.profit)}</td>
      <td class="num">${margin}%</td>
      <td class="num">${(s.docs||0).toLocaleString('ru-RU')}</td>
      <td class="num">${money(avg)}</td>
      <td class="num">${share}%</td>
    </tr>`;
  }).join('');
}

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
  const sections=[['Дашборд','dash'],['Воронки','funnels'],['Клиенты','clients'],['Чаты','inbox'],['Заказы','orders'],['Продажи','sales'],['Каталог','catalog'],['Маркетинг','marketing'],['Блогеры','bloggers'],['Врачи-партнёры','doctors'],['Аналитика','analytics'],['Задачи','tasks'],['Триггеры','triggers'],['KPI','kpi'],['Команда','team'],['Интеграции','integrations'],['Настройки','settings']];
  c.appendChild(el(`<div class="page-sub" style="margin-bottom:14px">${isAdminRole()?'Права ролей — отметьте галочками доступные разделы и сохраните. Владелец и Суперадмин видят всё всегда.':'Каждая роль видит только свои разделы.'}</div>`));
  const panel=el(`<div class="panel" style="overflow-x:auto"><div class="muted2" style="padding:14px;font-size:13px">Загрузка прав…</div></div>`);
  c.appendChild(panel);
  const grid=el(`<div class="grid-2 section-gap"></div>`);
  grid.appendChild(teamMembersPanel());
  grid.appendChild(el(`<div class="panel"><div class="panel-h"><h3>Привязка WhatsApp-каналов</h3></div><table class="tbl"><tbody>
      ${DB.channels.filter(x=>x.type==='wa').map(ch=>`<tr><td><div class="cell-name"><span class="ci" style="width:26px;height:26px;border-radius:8px;background:var(--wa)22;color:var(--wa);display:grid;place-items:center">${ic('i-phone','sm')}</span>${esc(ch.name)}</div></td><td class="muted">${esc(ch.phone)}</td><td style="text-align:right"><b>${esc(ch.owner)}</b></td></tr>`).join('')}
    </tbody></table></div>`));
  c.appendChild(grid);
  async function loadPerm(){
    const admin=isAdminRole();
    const r= admin ? await api('/api/admin/roles') : {ok:false};
    let roles, editable=false;
    if(r.ok){ roles=r.data.roles; editable=true; ACCESS_MAP={}; roles.forEach(x=>ACCESS_MAP[x.id]=x.sections); renderNav(); }
    else { roles=(DB.roles||[]).map(x=>({id:x.id,name:x.name,locked:(x.id==='owner'||x.id==='superadmin'),sections:(DB.access&&DB.access[x.id])||[]})); }
    panel.innerHTML=`<table class="tbl perm-tbl"><thead><tr><th>Раздел</th>${roles.map(x=>`<th style="text-align:center">${esc(x.name.split(' ')[0])}</th>`).join('')}</tr></thead><tbody>
      ${sections.map(([lbl,id])=>`<tr><td>${lbl}</td>${roles.map(x=>{const on=(x.sections||[]).includes(id);return `<td style="text-align:center">${editable&&!x.locked?`<input type="checkbox" data-role="${x.id}" data-sec="${id}" ${on?'checked':''} style="width:16px;height:16px;accent-color:var(--accent);cursor:pointer">`:(on?'<span class="yes">'+ic('i-check2','sm')+'</span>':'<span class="no">—</span>')}</td>`;}).join('')}</tr>`).join('')}
    </tbody></table>${editable?`<div class="row" style="padding:12px 14px;justify-content:flex-end;gap:12px;border-top:1px solid var(--line)"><span class="muted" style="font-size:12px">Применится ко всем сотрудникам роли</span><button class="btn primary" data-perm="save">${ic('i-shield','sm')} Сохранить права</button></div>`:''}`;
    if(editable){
      const changed=new Set();
      panel.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.onchange=()=>changed.add(cb.dataset.role));
      panel.querySelector('[data-perm=save]').onclick=async(e)=>{
        const btn=e.currentTarget; const toSave=[...changed]; if(!toSave.length){toast('Изменений нет','i-info');return;}
        const byRole={}; panel.querySelectorAll('input[type=checkbox]').forEach(cb=>{ byRole[cb.dataset.role]=byRole[cb.dataset.role]||[]; if(cb.checked) byRole[cb.dataset.role].push(cb.dataset.sec); });
        btn.disabled=true; btn.textContent='Сохраняю…';
        for(const role of toSave){ const rr=await api('/api/admin/roles',{method:'POST',body:JSON.stringify({role,sections:byRole[role]||[]})}); if(!rr.ok){ btn.disabled=false; toast('Ошибка сохранения','i-x','#dc2626'); return; } }
        toast('Права сохранены','i-shield','#10b981');
        try{ const me=await api('/api/auth/me'); if(me.ok) AUTH.user=me.data.user; }catch(e2){}
        loadPerm();
      };
    }
  }
  loadPerm();
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
  const wrap=el('<div class="set-wrap"></div>'); c.appendChild(wrap);
  wrap.appendChild(el(`<div class="grid-2">
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
  const fxPanel=el(`<div class="panel"><div class="panel-h"><h3>Курс валюты · сом ↔ рубль</h3><span class="ph-sub">ручной ввод или авто (НБ КР)</span></div><div class="panel-b">
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
  wrap.appendChild(fxPanel);

  wrap.appendChild(el(`<div class="grid-2">
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
// ---------- Напоминания (колокольчик): мои дедлайны ----------
async function loadNotifications(){
  const r=await api('/api/notifications'); if(!r||!r.ok)return;
  window.__notif=r.data; const dot=document.getElementById('bellDot');
  if(dot) dot.hidden=(r.data.items||[]).length===0;
}
function renderBellPop(){
  const pop=document.getElementById('bellPop'); if(!pop)return;
  const d=window.__notif||{items:[]}, items=d.items||[];
  pop.innerHTML=`<div class="dp-h"><b>Напоминания</b><span class="dp-cnt">${d.overdue||0} просроч. · ${items.length}</span></div>`
    +(items.length?items.map(t=>{const od=t.kind==='overdue';return `<a class="doc-row" data-go="1"><div class="di" style="background:${od?'var(--red-soft)':'var(--amber-soft)'};color:${od?'var(--red)':'var(--amber)'};font-size:15px">${od?'!':'⏰'}</div><div style="min-width:0"><div class="dt">${esc(t.title)}</div><div class="ds">${od?'просрочено':'скоро'} · ${esc(fmtDue(t.due_at))}${t.client_name?(' · '+esc(t.client_name)):''}</div></div></a>`;}).join(''):'<div class="dp-empty">Дедлайнов нет 🎉</div>')
    +`<div class="dp-foot">Ваши задачи: просроченные и ближайшие 24 ч</div>`;
  pop.querySelectorAll('[data-go]').forEach(a=>a.onclick=()=>{ pop.hidden=true; go('tasks'); });
}
document.getElementById('bellBtn')?.addEventListener('click',async e=>{ e.stopPropagation(); const pop=document.getElementById('bellPop'),dp=document.getElementById('docsPop'); if(dp)dp.hidden=true; if(!pop)return; const show=pop.hidden; if(show){ await loadNotifications(); renderBellPop(); } pop.hidden=!show; });
document.addEventListener('click',e=>{ const p=document.getElementById('bellPop'); if(p&&!p.hidden&&!e.target.closest('.docs-wrap')) p.hidden=true; });
setInterval(()=>{ if(AUTH&&AUTH.token) loadNotifications(); }, 300000);

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
  const al0=allowedSections(state.role); if(!al0.includes(state.page)) state.page = al0[0]||'dash';
  renderRoleSel(); applyHash();
  // реальный счётчик активных задач для бейджа в меню
  if(allowedSections(state.role).includes('tasks')) api('/api/tasks?status=active').then(r=>{ if(r&&r.ok){ window.__taskBadge=(r.data.totals||{}).active||0; renderNav(); } }).catch(()=>{});
  loadNotifications();
  // эффективные права ролей из БД (для меню/превью/матрицы) — для админа
  if(['owner','superadmin'].includes(user.role)) api('/api/admin/roles').then(r=>{ if(r&&r.ok){ ACCESS_MAP={}; r.data.roles.forEach(x=>ACCESS_MAP[x.id]=x.sections); renderNav(); } }).catch(()=>{});
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
