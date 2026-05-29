'use strict';
/* ============ ROOT RENDER ============ */
function render(){
  const app=document.getElementById('app');
  if(!state.user){ app.innerHTML=renderLogin(); return; }
  app.innerHTML=renderShell();
  renderModule();
}
function renderModule(){
  const view=document.getElementById('view'); if(!view) return;
  const m=state.module;
  let html='';
  if(!canSee(m)){ html=renderNoAccess(); }
  else if(m==='dashboard') html=renderDashboard();
  else if(m==='funnel')    html=renderFunnel();
  else if(m==='clients')   html=renderClients();
  else if(m==='measure')   html=renderMeasure();
  else if(m==='warehouse') html=renderWarehouse();
  else if(m==='production')html=renderProduction();
  else if(m==='finance')   html=renderFinance();
  else if(m==='settings')  html=renderSettings();
  view.innerHTML=html;
  if(m==='measure') initMeasureBindings();
  view.scrollTop=0;
}

/* ============ LOGIN ============ */
function renderLogin(){
  const accts = DB.users.map(u=>{
    const c=colorFor(u.id);
    return `<button class="acct" data-act="login" data-id="${u.id}">
      <span class="av" style="background:${c}">${initials(u.name)}</span>
      <span class="ai"><span class="an">${u.name}</span><span class="at">${u.title}</span></span>
      <span class="ar">${u.primary?'демо':roleRu(u.role)}</span>
      ${icon('arrow','go')}
    </button>`;
  }).join('');
  return `<div class="login-wrap"><button class="theme-fab" data-act="theme" title="Сменить тему">${icon(state.theme==='light'?'moon':'sun')}</button><div class="login-card">
    <div class="login-side">
      <div class="brand">
        <div class="brand-logo">${icon('grid','lg')}</div>
        <div><div class="brand-name">ОКНА CRM</div><div class="brand-sub">для оконного производства</div></div>
      </div>
      <h1>CRM, <span class="grad">собранная под оконный бизнес</span></h1>
      <p>Воронка продаж, выезд на замер с расчётом конструкций прямо на объекте, мгновенное КП клиенту в WhatsApp, склад профиля и стеклопакетов, финансы и дебиторка — в одном окне.</p>
      <div class="login-feats">
        <div class="login-feat"><span class="fi">${icon('ruler','sm')}</span> Замер → расчёт → КП → предоплата за один визит</div>
        <div class="login-feat"><span class="fi">${icon('finance','sm')}</span> Дебиторка и эффективность продаж в реальном времени</div>
        <div class="login-feat"><span class="fi">${icon('warehouse','sm')}</span> Склад профиля, стеклопакетов и фурнитуры</div>
        <div class="login-feat"><span class="fi">${icon('shield','sm')}</span> Права доступа: сборщики и склад не видят финансы</div>
      </div>
    </div>
    <div class="login-main">
      <h2>Выберите демо-доступ</h2>
      <div class="lead">Каждая роль открывает свой набор модулей. Все данные демонстрационные.</div>
      <div class="accounts">${accts}</div>
      <div class="login-extra">Демо: ${DB.company.legal}, ${DB.company.city}. ${DB.company.workshop}. Оборот ${DB.company.revenueYear}.<br>Все цифры и клиенты вымышленные — можно смело кликать, двигать сделки и принимать оплаты.</div>
    </div>
  </div></div>`;
}
function roleRu(r){ return ({director:'Директор',manager:'Менеджер',surveyor:'Замерщик',production:'Производство',warehouse:'Склад'})[r]||r; }

/* ============ SHELL ============ */
function navGroups(){
  return [
    {title:'Продажи', items:['dashboard','funnel','clients']},
    {title:'Поле',    items:['measure']},
    {title:'Операции',items:['warehouse','production']},
    {title:'Финансы', items:['finance']},
    {title:'Система',  items:['settings']},
  ];
}
const MODULE_META = {
  dashboard:{name:'Дашборд',  icon:'dashboard', sub:'Ключевые показатели бизнеса'},
  funnel:   {name:'Воронка',  icon:'funnel',    sub:'Сделки по стадиям'},
  clients:  {name:'Клиенты',  icon:'clients',   sub:'База клиентов и история'},
  measure:  {name:'Замер и КП',icon:'ruler',    sub:'Расчёт конструкций на объекте'},
  warehouse:{name:'Склад',    icon:'warehouse', sub:'Профиль, стеклопакеты, фурнитура'},
  production:{name:'Производство',icon:'production',sub:'Резка, стеклопакет, сборка, монтаж'},
  finance:  {name:'Финансы',  icon:'finance',   sub:'Дебиторка, оплаты, отчётность'},
  settings: {name:'Настройки',icon:'settings',  sub:'Сотрудники и права доступа'},
};
function renderShell(){
  const u=state.user;
  const measureCount = DB.deals.filter(d=>d.stage==='measure').length;
  const prodCount = DB.deals.filter(d=>['production','install'].includes(d.stage)).length;
  const nav = navGroups().map(g=>{
    const items=g.items.filter(canSee); if(!items.length) return '';
    return `<div class="nav-group">${g.title}</div>`+items.map(id=>{
      const m=MODULE_META[id]; const active=state.module===id?'active':'';
      let badge='';
      if(id==='measure'&&measureCount) badge=`<span class="badge">${measureCount}</span>`;
      if(id==='production'&&prodCount) badge=`<span class="badge alt">${prodCount}</span>`;
      return `<button class="nav-item ${active}" data-act="nav" data-mod="${id}">${icon(m.icon)}<span>${m.name}</span>${badge}</button>`;
    }).join('');
  }).join('');
  const meta=MODULE_META[state.module]||{name:'',sub:''};
  return `<div class="shell">
    <aside class="sidebar ${state.sideOpen?'open':''}">
      <div class="side-top">
        <div class="brand">
          <div class="brand-logo">${icon('grid','lg')}</div>
          <div><div class="brand-name">ОКНА CRM</div><div class="brand-sub">v1.0 demo</div></div>
        </div>
        <div class="company-pill">
          <div class="cn">${DB.company.name}</div>
          <div class="cc">${icon('pin','sm')} ${DB.company.city} · ${DB.company.workshop.split(' · ')[0]}</div>
        </div>
      </div>
      <nav class="nav">${nav}</nav>
      <div class="side-bottom">
        <div class="user-chip">
          <span class="av" style="background:${colorFor(u.id)}">${initials(u.name)}</span>
          <span class="ui"><span class="un">${u.name}</span><span class="ut">${u.title}</span></span>
          <button class="sw" data-act="logout" title="Сменить пользователя">${icon('logout','sm')}</button>
        </div>
      </div>
    </aside>
    <main class="main">
      <header class="topbar">
        <button class="icon-btn menu-toggle" data-act="toggle-side">${icon('menu')}</button>
        <div>
          <div class="page-title">${meta.name}</div>
          <div class="page-sub">${meta.sub}</div>
        </div>
        <div class="search">${icon('search','sm')}<input placeholder="Поиск клиента, сделки…" data-act="noop"></div>
        <button class="icon-btn" data-act="theme" title="Сменить тему">${icon(state.theme==='light'?'moon':'sun')}</button>
        <button class="icon-btn" data-act="notif" title="Уведомления">${icon('bell')}<span class="dot"></span></button>
        <button class="icon-btn" data-act="reset" title="Сбросить демо-данные">${icon('refresh')}</button>
      </header>
      <section class="content" id="view"></section>
    </main>
  </div>`;
}
function renderNoAccess(){
  return `<div class="empty">${icon('shield')}<h3>Нет доступа</h3><p>Этот раздел недоступен для роли «${state.user.title}».<br>Так работают права: сборщики и склад не видят финансы и клиентскую воронку.</p></div>`;
}

/* ============ MODAL ============ */
function openModal(html, wide){
  const root=document.getElementById('modal-root');
  root.innerHTML=`<div class="modal-bg" data-act="modal-bg"><div class="modal ${wide?'wide':''}">${html}</div></div>`;
}
function closeModal(){ document.getElementById('modal-root').innerHTML=''; }

/* ============ TOAST ============ */
function toast(text, kind){
  const root=document.getElementById('toast-root');
  root.innerHTML=`<div class="toast"><div class="t ${kind||'ok'}">
    <span class="ti" style="background:${kind==='warn'?'var(--amber-soft)':'var(--green-soft)'};color:${kind==='warn'?'#fbbf24':'#4ade80'}">${icon(kind==='warn'?'alert':'check','sm')}</span>
    <span>${text}</span></div></div>`;
  clearTimeout(window.__toastT);
  window.__toastT=setTimeout(()=>{ root.innerHTML=''; }, 3200);
}

/* ============ SMALL UI HELPERS ============ */
function kpi(o){
  const c=o.color||'var(--accent)';
  return `<div class="kpi ${o.act?'clickable':''}" ${o.act?`data-act="${o.act}"`:''}>
    <div class="k-ic" style="background:${o.soft||'var(--accent-soft)'};color:${c}">${icon(o.icon)}</div>
    <div class="k-lbl">${o.label}</div>
    <div class="k-val">${o.value}</div>
    ${o.sub?`<div class="k-sub ${o.subClass||''}">${o.sub}</div>`:''}
  </div>`;
}
function avatarXs(name,id){ return `<span class="avatar-xs" style="background:${colorFor(id||name)}">${initials(name)}</span>`; }
function bars(rows, max){
  max = max || Math.max(1,...rows.map(r=>r.value));
  return `<div class="bars">`+rows.map(r=>`
    <div class="bar-row">
      <span class="bl">${r.label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(2,r.value/max*100)}%;background:${r.color||'linear-gradient(90deg,#2563eb,#3b82f6)'}">${r.inBar||''}</div></div>
      <span class="bv">${r.display!=null?r.display:r.value}</span>
    </div>`).join('')+`</div>`;
}
