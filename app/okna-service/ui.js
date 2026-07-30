'use strict';
/* ============ ROOT RENDER ============ */
function render(){
  const app=document.getElementById('app');
  const g=gateStatus();
  if(g.mode==='locked' || g.mode==='expired'){ app.innerHTML=renderGate(g); return; }
  if(!state.user){ app.innerHTML=renderLogin(g); return; }
  app.innerHTML=renderShell();
  renderModule();
}

/* ============ ШЛЮЗ ДОСТУПА ПО ССЫЛКЕ ============ */
function fmtExpiry(ts){ try{ const d=new Date(ts); return d.toLocaleString('ru-RU',{day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit'}); }catch(e){ return ''; } }
function renderGate(g){
  const expired = g.mode==='expired';
  return `<div class="gate-wrap"><button class="theme-fab" data-act="theme" title="Сменить тему">${icon(state.theme==='light'?'moon':'sun')}</button>
    <div class="gate-card">
      <div class="gate-icon">${icon(expired?'clock':'lock','lg')}</div>
      <div class="brand-name" style="font-size:15px;letter-spacing:.04em">ОКНА СЕРВИС · демо</div>
      <h1>${expired?'Срок доступа к демо истёк':'Доступ к демо по ссылке'}</h1>
      <p>${expired
        ? `Эта демо-ссылка действовала до <b>${fmtExpiry(g.exp)}</b> и больше не активна. Запросите новую ссылку у менеджера Pllato — мы откроем доступ ещё раз.`
        : 'Демонстрационная версия открывается по персональной ссылке с ограниченным сроком. Попросите у менеджера Pllato актуальную ссылку для просмотра.'}</p>
      <a class="gate-btn" href="https://wa.me/77011239999" target="_blank" rel="noopener">${icon('wa','sm')} Запросить доступ в WhatsApp</a>
      <div class="gate-foot">Pllato · кастомные CRM · pllato.kz</div>
    </div></div>`;
}
function shareModal(){
  const opts=[{h:24,t:'24 часа'},{h:72,t:'3 дня'},{h:168,t:'7 дней'},{h:720,t:'30 дней'}];
  openModal(`<div class="modal-h">${icon('link')}<div><h3>Ссылка для клиента</h3><div class="mh-sub">Демо откроется по ссылке и закроется по истечении срока</div></div><button class="x" data-act="close-modal">${icon('x')}</button></div>
    <div class="modal-b"><div class="constr-body" style="padding:0">
      <div class="fld full"><label>Срок действия ссылки</label>
        <div class="share-opts">${opts.map((o,i)=>`<button class="share-opt${i===0?' on':''}" data-act="share-pick" data-h="${o.h}">${o.t}</button>`).join('')}</div>
      </div>
      <div class="fld full"><label>Своё значение, часов (необязательно)</label><input type="number" min="1" id="share-hours" placeholder="например 48"></div>
      <div class="fld full"><label>Кому (метка, необязательно)</label><input id="share-label" placeholder="например: ЖК Алтын, Серик"></div>
      <div id="share-out"></div>
    </div></div>
    <div class="modal-f"><button class="btn" data-act="close-modal">Закрыть</button><button class="btn green" data-act="share-make" data-h="24">${icon('link','sm')} Создать ссылку</button></div>`);
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
  else if(m==='project')   html=renderProject();
  else if(m==='objectmap') html=renderObjectMap();
  else if(m==='procurement')html=renderProcurement();
  else if(m==='warehouse') html=renderWarehouse();
  else if(m==='production')html=renderProduction();
  else if(m==='quality')   html=renderQuality();
  else if(m==='logistics') html=renderLogistics();
  else if(m==='payroll')   html=renderPayroll();
  else if(m==='finance')   html=renderFinance();
  else if(m==='audit')     html=renderAudit();
  else if(m==='settings')  html=renderSettings();
  view.innerHTML=html;
  if(m==='measure') initMeasureBindings();
  view.scrollTop=0;
}

/* ============ LOGIN ============ */
function renderLogin(g){
  g = g || gateStatus();
  const ownerBtn = g.mode==='owner' ? `<button class="share-fab" data-act="share-demo" title="Создать ссылку для клиента">${icon('link','sm')} Поделиться демо</button>` : '';
  const clientBanner = g.mode==='valid' ? `<div class="demo-banner">${icon('clock','sm')} Демо-доступ активен до <b>${fmtExpiry(g.exp)}</b>${g.label?` · ${g.label}`:''}</div>` : '';
  const accts = DB.users.map(u=>{
    const c=colorFor(u.id);
    return `<button class="acct" data-act="login" data-id="${u.id}">
      <span class="av" style="background:${c}">${initials(u.name)}</span>
      <span class="ai"><span class="an">${u.name}</span><span class="at">${u.title}</span></span>
      <span class="ar">${u.primary?'демо':roleRu(u.role)}</span>
      ${icon('arrow','go')}
    </button>`;
  }).join('');
  return `<div class="login-wrap"><div class="login-fabs">${ownerBtn}<button class="theme-fab" data-act="theme" title="Сменить тему">${icon(state.theme==='light'?'moon':'sun')}</button></div>${clientBanner}<div class="login-card">
    <div class="login-side">
      <div class="brand">
        <div class="brand-logo">${icon('grid','lg')}</div>
        <div><div class="brand-name">ОКНА СЕРВИС</div><div class="brand-sub">сквозная CRM производства</div></div>
      </div>
      <h1>Заказ и результат сотрудника — <span class="grad">в одном цифровом контуре</span></h1>
      <p>Продажи → замер → проектирование → закупка → склад → производство → ОТК → доставка → монтаж → оплата. Выполненный объём автоматически превращается в KPI, зарплату, себестоимость и прибыль.</p>
      <div class="login-feats">
        <div class="login-feat"><span class="fi">${icon('ruler','sm')}</span> Единая карточка проекта и автоматическая передача между 11 отделами</div>
        <div class="login-feat"><span class="fi">${icon('finance','sm')}</span> Подтверждённый объём → KPI → зарплата → себестоимость</div>
        <div class="login-feat"><span class="fi">${icon('pin','sm')}</span> Карта объектов, маршруты и live-геолокация выездных задач</div>
        <div class="login-feat"><span class="fi">${icon('shield','sm')}</span> Ролевые кабинеты: каждый видит только необходимые данные</div>
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
function roleRu(r){ return ({director:'Директор',manager:'Менеджер',surveyor:'Замерщик',finance:'Финансы',head:'Руководитель',procurement:'Закупки',quality:'ОТК',logistics:'Логистика',production:'Производство',warehouse:'Склад'})[r]||r; }

/* ============ SHELL ============ */
function navGroups(){
  return [
    {title:'Продажи', items:['dashboard','funnel','clients']},
    {title:'Проекты', items:['project','objectmap','measure']},
    {title:'Исполнение',items:['procurement','warehouse','production','quality','logistics']},
    {title:'Результат',items:['payroll','finance']},
    {title:'Контроль',items:['audit','settings']},
  ];
}
const MODULE_META = {
  dashboard:{name:'Дашборд',  icon:'dashboard', sub:'Ключевые показатели бизнеса'},
  funnel:   {name:'Воронка',  icon:'funnel',    sub:'Сделки по стадиям'},
  clients:  {name:'Клиенты',  icon:'clients',   sub:'База клиентов и история'},
  project:  {name:'Карточка проекта',icon:'doc',sub:'Весь заказ, исполнители, сроки и документы в одном месте'},
  objectmap:{name:'Карта объектов',icon:'pin',sub:'Выезды, маршруты, просрочки и live-геолокация'},
  measure:  {name:'Замер и КП',icon:'ruler',    sub:'Расчёт конструкций на объекте'},
  procurement:{name:'Закупки',icon:'truck',sub:'Дефицит, поставщики, транспорт и маршруты'},
  warehouse:{name:'Склад',    icon:'warehouse', sub:'Профиль, стеклопакеты, фурнитура'},
  production:{name:'Производство',icon:'production',sub:'Резка, стеклопакет, сборка, монтаж'},
  quality:  {name:'ОТК и переделки',icon:'shield',sub:'Контроль качества, дефекты и ответственность'},
  logistics:{name:'Логистика и монтаж',icon:'truck',sub:'Рейсы, маршруты, мобильные задачи и акты'},
  payroll:  {name:'Зарплата и KPI',icon:'wallet',sub:'Объём, расценка, KPI, подтверждение и расчётный период'},
  finance:  {name:'Финансы',  icon:'finance',   sub:'Дебиторка, оплаты, отчётность'},
  audit:    {name:'Журнал действий',icon:'clock',sub:'Кто, когда и что изменил — без удаления истории'},
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
          <div><div class="brand-name">ОКНА СЕРВИС</div><div class="brand-sub">полный контур · demo</div></div>
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
