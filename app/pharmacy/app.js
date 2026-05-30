/* Pllato Pharmacy — ядро: состояние, вход, оболочка, роутер */
(function(){
'use strict';
const KEY='ph_state_v4', SKEY='ph_session_v4';
const M = window.M = {};            // реестр рендереров модулей
const root = document.getElementById('app');

/* ---------- state ---------- */
let S, session=null, cart=[], pay='cash';
function load(){
  try{ const r=JSON.parse(localStorage.getItem(KEY)); if(r&&r.version===4) return r; }catch(e){}
  const f=window.PH.fresh(); localStorage.setItem(KEY,JSON.stringify(f)); return f;
}
function save(){ localStorage.setItem(KEY,JSON.stringify(S)); }
function reset(){ localStorage.removeItem(KEY); S=load(); toast('Демо-данные сброшены','ok'); render(); }
S=load();
try{ session=JSON.parse(localStorage.getItem(SKEY))||null; }catch(e){}

/* ---------- utils ---------- */
const $=(s,el=document)=>el.querySelector(s);
const money=n=>{ const v=Math.round(n); return (v<0?'−':'')+Math.abs(v).toLocaleString('ru-RU')+' смн'; };
const num=n=>Math.round(n).toLocaleString('ru-RU');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const todayISO=()=>new Date().toISOString().slice(0,10);
const fmtDate=iso=>new Date(iso).toLocaleDateString('ru-RU',{day:'2-digit',month:'short'});
const fmtTime=iso=>new Date(iso).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
const daysLeft=iso=>Math.round((new Date(iso)-new Date())/864e5);
const byId=(arr,id)=>arr.find(x=>x.id===id);
const user=id=>byId(S.users,id)||{name:'—',initials:'?'};
const pharm=id=>byId(S.pharmacies,id)||{name:'—'};
const prod=id=>byId(S.products,id)||{name:'—'};

/* расходы (аренда+зп+коммуналка), сомони/день — для расчёта прибыли */
const EXP={a1:430,a2:340,a3:280};

window.PHU={S:()=>S, save, money, num, esc, todayISO, fmtDate, fmtTime, daysLeft, byId, user, pharm, prod,
  session:()=>session, toast, modal, closeModal, render, EXP, salesIn, stockAt};

function salesIn(pharmacyId, fromISO, toISO){
  return S.sales.filter(s=>{
    if(pharmacyId&&s.pharmacyId!==pharmacyId) return false;
    const d=s.ts.slice(0,10);
    if(fromISO&&d<fromISO) return false;
    if(toISO&&d>toISO) return false;
    return true;
  });
}
function stockAt(pharmacyId,pid){ return (S.stock[pharmacyId]||{})[pid]||{qty:0,min:0,expiry:''}; }

/* ---------- toast ---------- */
function toast(msg,kind=''){ const r=document.getElementById('toast-root');
  const t=document.createElement('div'); t.className='toast '+kind;
  t.innerHTML=(kind==='ok'?'✓ ':kind==='warn'?'⚠ ':'')+esc(msg); r.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(20px)';setTimeout(()=>t.remove(),250);},2600);
}
/* ---------- modal ---------- */
function modal(html,wide){ const r=document.getElementById('modal-root');
  r.innerHTML=`<div class="modal-bg"><div class="modal${wide?' wide':''}">${html}</div></div>`;
  r.querySelector('.modal-bg').addEventListener('click',e=>{ if(e.target.classList.contains('modal-bg')) closeModal(); });
}
function closeModal(){ document.getElementById('modal-root').innerHTML=''; }

/* ================= LOGIN ================= */
let loginStep={mode:'roles',user:null,pin:''};
function renderLogin(){
  const sideTags=['Касса','Склад','Финансы','Дашборд','3 точки · 1 окно'];
  let main='';
  if(loginStep.mode==='roles'){
    const roles=[
      {role:'owner',ic:'◆',name:'Собственник',desc:'Дашборд по сети, финансы, аналитика'},
      {role:'admin',ic:'❖',name:'Администратор',desc:'Каталог, поставщики, приёмка, отчёты'},
      {role:'pharm',ic:'＋',name:'Фармацевт',desc:'Касса · продажа только через систему'},
    ];
    main=`<div class="login-card">
      <h2>Вход в систему</h2>
      <p class="lead">Выберите роль — для демонстрации возможностей каждого уровня доступа.</p>
      <div class="role-grid">
        ${roles.map(r=>`<button class="role-btn" data-act="pick-role" data-role="${r.role}">
          <span class="role-ic">${r.ic}</span>
          <span><span class="role-name">${r.name}</span><br><span class="role-desc">${r.desc}</span></span>
          <span class="role-arrow">→</span></button>`).join('')}
      </div>
      <div class="demo-note">Это интерактивная демо-версия. Данные вымышленные, хранятся только в вашем браузере. <b>PIN для всех демо-пользователей подставляется автоматически.</b></div>
    </div>`;
  } else if(loginStep.mode==='users'){
    const us=S.users.filter(u=>u.role===loginStep.role);
    main=`<div class="login-card">
      <button class="pin-back" data-act="to-roles">← к выбору роли</button>
      <h2 style="margin-top:8px">Кто заходит?</h2>
      <p class="lead">${loginStep.role==='pharm'?'Каждая продажа привязана к сотруднику.':'Выберите учётную запись.'}</p>
      <div class="role-grid">
        ${us.map(u=>`<button class="role-btn" data-act="pick-user" data-id="${u.id}">
          <span class="role-ic">${u.initials}</span>
          <span><span class="role-name">${esc(u.name)}</span><br><span class="role-desc">${u.pharmacyId?esc(pharm(u.pharmacyId).name):'Вся сеть · 3 точки'}</span></span>
          <span class="role-arrow">→</span></button>`).join('')}
      </div></div>`;
  } else {
    const u=loginStep.user, dots=[0,1,2,3].map(i=>`<span class="pin-dot ${i<loginStep.pin.length?'on':''}"></span>`).join('');
    const keys=['1','2','3','4','5','6','7','8','9','clear','0','ok'];
    main=`<div class="pin-screen">
      <button class="pin-back" data-act="to-users">← назад</button>
      <div class="pin-user"><span class="pin-ava">${u.initials}</span>
        <span><div class="pin-name">${esc(u.name)}</div><div class="pin-role">${u.role==='owner'?'Собственник':u.role==='admin'?'Администратор':'Фармацевт · '+esc(pharm(u.pharmacyId).name)}</div></span></div>
      <div class="pin-dots" id="pin-dots">${dots}</div>
      <div class="pin-pad">
        ${keys.map(k=>k==='clear'?`<button class="pin-key fn" data-act="pin-clear">Стереть</button>`
          :k==='ok'?`<button class="pin-key fn" data-act="pin-ok">Войти</button>`
          :`<button class="pin-key" data-act="pin-d" data-d="${k}">${k}</button>`).join('')}
      </div>
      <div class="demo-note" style="text-align:center">Демо-PIN: <b>${u.pin}</b> · нажмите «Войти»</div>
    </div>`;
  }
  root.innerHTML=`<div class="login-wrap">
    <div class="login-side">
      <div class="login-brand">Pllato<span>.</span> Pharmacy</div>
      <div class="login-kicker">Учётная система для сети аптек</div>
      <h1 class="login-h1">Касса · Склад · Финансы.<br>Три точки в одном окне.</h1>
      <p class="login-sub">Продажа возможна только через систему: отсканировал — выбил чек — списало остаток — деньги в кассу. Дисциплина через интерфейс.</p>
      <div class="login-tags">${sideTags.map(t=>`<span class="login-tag">${t}</span>`).join('')}</div>
    </div>
    <div class="login-main">${main}</div></div>`;
}
function loginClick(e){
  const b=e.target.closest('[data-act]'); if(!b) return; const a=b.dataset.act;
  if(a==='pick-role'){ loginStep={mode:'users',role:b.dataset.role}; renderLogin(); }
  else if(a==='to-roles'){ loginStep={mode:'roles'}; renderLogin(); }
  else if(a==='pick-user'){ loginStep={mode:'pin',user:byId(S.users,b.dataset.id),pin:'',role:loginStep.role}; renderLogin(); }
  else if(a==='to-users'){ loginStep={mode:'users',role:loginStep.role}; renderLogin(); }
  else if(a==='pin-d'){ if(loginStep.pin.length<4){ loginStep.pin+=b.dataset.d; refreshDots(); if(loginStep.pin.length===4) setTimeout(tryPin,150);} }
  else if(a==='pin-clear'){ loginStep.pin=''; refreshDots(); }
  else if(a==='pin-ok'){ tryPin(); }
}
function refreshDots(){ const d=$('#pin-dots'); if(!d)return;
  d.innerHTML=[0,1,2,3].map(i=>`<span class="pin-dot ${i<loginStep.pin.length?'on':''}"></span>`).join(''); }
function tryPin(){ const u=loginStep.user;
  if(loginStep.pin===u.pin){ doLogin(u); }
  else{ const d=$('#pin-dots'); if(d) d.querySelectorAll('.pin-dot').forEach(x=>x.classList.add('err'));
    setTimeout(()=>{loginStep.pin='';refreshDots();},400); toast('Неверный PIN','warn'); }
}
function doLogin(u){
  session={userId:u.id,role:u.role,pharmacyId:u.pharmacyId||'a1',view:u.role==='pharm'?'a1':'all'};
  if(u.pharmacyId) session.view=u.pharmacyId;
  localStorage.setItem(SKEY,JSON.stringify(session));
  S.log.unshift({ts:new Date().toISOString(),userId:u.id,text:'Вход в систему ('+(u.role==='owner'?'собственник':u.role==='admin'?'администратор':'фармацевт')+')'});
  save(); route = defaultRoute(u.role); render();
}
function logout(){ session=null; localStorage.removeItem(SKEY); loginStep={mode:'roles'}; render(); }

/* ================= SHELL + ROUTER ================= */
let route='dashboard';
function defaultRoute(role){ return role==='pharm'?'pos':role==='admin'?'pos':'dashboard'; }
const NAV={
  owner:[['dashboard','▤','Дашборд'],['analytics','◷','Аналитика'],['finance','₸','Финансы'],
         ['catalog','▦','Каталог'],['warehouse','▣','Склад'],['suppliers','⛟','Поставщики'],
         ['pos','＋','Касса'],['log','≣','Журнал']],
  admin:[['pos','＋','Касса'],['dashboard','▤','Сводка'],['catalog','▦','Каталог'],
         ['warehouse','▣','Склад'],['suppliers','⛟','Поставщики'],['finance','₸','Финансы']],
  pharm:[['pos','＋','Касса'],['myshift','◷','Моя смена'],['catalog','▦','Поиск товара']],
};
function render(){
  if(!session){ renderLogin(); return; }
  const u=user(session.userId), nav=NAV[session.role];
  if(!nav.find(n=>n[0]===route)) route=defaultRoute(session.role);

  // POS — без общей оболочки (полноэкранный)
  if(route==='pos'){ renderPOSFull(); return; }

  const alerts=countAlerts();
  root.innerHTML=`<div class="app-shell">
    <aside class="sidebar">
      <div class="sb-brand">Pllato<span>.</span></div>
      <div class="sb-sub">Pharmacy · сеть аптек</div>
      ${nav.map(n=>{
        const badge=(n[0]==='warehouse'&&alerts)?`<span class="nav-badge">${alerts}</span>`:'';
        return `<button class="nav-item ${route===n[0]?'active':''}" data-route="${n[0]}"><span class="ic">${n[1]}</span>${n[2]}${badge}</button>`;
      }).join('')}
      <div class="sb-foot">
        <div class="sb-user"><span class="sb-ava">${u.initials}</span>
          <span><div class="sb-uname">${esc(u.name)}</div><div class="sb-urole">${session.role==='owner'?'Собственник':session.role==='admin'?'Администратор':'Фармацевт'}</div></span></div>
        <button class="sb-logout" data-act="logout">Выйти</button>
        ${session.role==='owner'?'<button class="sb-logout" data-act="reset" style="margin-top:6px">↺ Сбросить демо</button>':''}
      </div>
    </aside>
    <main class="main">
      <div class="topbar" id="topbar"></div>
      <div class="content" id="content"></div>
    </main></div>`;
  const fn=M[route]; if(fn) fn($('#content'),$('#topbar')); else $('#content').innerHTML='—';
}
function topbar(host,title,sub,right){
  const showSwitch = session.role!=='pharm';
  host.innerHTML=`<div><h1 class="page-title">${title}</h1>${sub?`<div class="page-sub">${sub}</div>`:''}</div>
    <div class="topbar-right">
      ${right||''}
      ${showSwitch?`<div class="pharm-switch"><span class="live-dot"></span><select id="pharmSel">
        ${session.role==='owner'?`<option value="all">Все 3 аптеки</option>`:''}
        ${S.pharmacies.map(p=>`<option value="${p.id}" ${session.view===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}
      </select></div>`:''}
    </div>`;
  const sel=$('#pharmSel',host); if(sel) sel.addEventListener('change',e=>{ session.view=e.target.value; localStorage.setItem(SKEY,JSON.stringify(session)); render(); });
}
window.PHU.topbar=topbar;

function countAlerts(){ let n=0; const view=session.view==='all'?null:session.view;
  S.products.forEach(p=>S.pharmacies.forEach(ph=>{ if(view&&ph.id!==view)return;
    const st=stockAt(ph.id,p.id); if(st.qty<=st.min) n++; const dl=daysLeft(st.expiry); if(st.qty>0&&dl<=30) n++; })); return n; }
window.PHU.countAlerts=countAlerts;

/* ---------- global click ---------- */
document.addEventListener('click',e=>{
  if(!session){ loginClick(e); return; }
  const r=e.target.closest('[data-route]'); if(r){ route=r.dataset.route; render(); return; }
  const b=e.target.closest('[data-act]'); if(!b) return; const a=b.dataset.act;
  if(a==='logout') logout();
  else if(a==='reset') reset();
  else if(a==='close-modal') closeModal();
  else if(M.action) M.action(a,b,e);   // делегируем модулям
});

/* ================= POS (касса) ================= */
function posPharmacy(){ return session.role==='owner'? (session.view==='all'?'a1':session.view) : session.pharmacyId; }
function renderPOSFull(){
  const phId=posPharmacy(), ph=pharm(phId), u=user(session.userId);
  const items=cart.map(c=>{ const p=prod(c.pid); const st=stockAt(phId,c.pid);
    return `<div class="cart-row">
      <div style="flex:1"><div class="ci-name">${esc(p.name)}</div><div class="ci-meta">${esc(p.dose)} · ${esc(p.pack)} · ${money(p.sale)}</div></div>
      <div class="qty"><button data-act="cart-dec" data-pid="${c.pid}">−</button><span>${c.qty}</span><button data-act="cart-inc" data-pid="${c.pid}">+</button></div>
      <div class="ci-sum">${money(c.qty*p.sale)}</div>
      <button class="ci-del" data-act="cart-del" data-pid="${c.pid}">×</button></div>`; }).join('');
  const total=cart.reduce((s,c)=>s+c.qty*prod(c.pid).sale,0);
  const cost=cart.reduce((s,c)=>s+c.qty*prod(c.pid).buy,0);
  const margin=total-cost;
  const showMargin=session.role!=='pharm';
  root.innerHTML=`<div class="pos">
    <div class="pos-left">
      <div class="flex between" style="margin-bottom:14px">
        <div><div class="page-title" style="font-size:20px">Касса</div>
          <div class="page-sub">${esc(ph.name)} · фармацевт ${esc(u.name)} · смена открыта</div></div>
        <button class="btn ghost" data-route="${defaultRoute(session.role)==='pos'?'catalog':'dashboard'}" data-act="${session.role==='pharm'?'pos-exit':''}">${session.role==='pharm'?'Закрыть смену →':'← В систему'}</button>
      </div>
      <div class="pos-scan"><span class="ic">▥</span>
        <input id="scan" placeholder="Отсканируйте штрихкод или введите название (от 3 букв)…" autocomplete="off"></div>
      <div class="pos-hint">Демо: введите название (напр. «дикл», «нурофен») или штрихкод. Сканер физически вводит код в это поле — здесь печатаем вручную.</div>
      <div class="pos-results" id="posResults"></div>
    </div>
    <div class="pos-right">
      <div class="cart-h"><b>Чек</b><span class="dim" style="color:#8fa093">${cart.length} поз.</span></div>
      <div class="cart-items">${cart.length?items:'<div class="cart-empty">Сканируйте товар —<br>он появится в чеке</div>'}</div>
      <div class="cart-tot">
        ${showMargin?`<div class="cart-line cart-margin"><span>Маржа чека</span><span>${money(margin)} · ${total?Math.round(margin/total*100):0}%</span></div>`:''}
        <div class="cart-line"><span>Позиций</span><span>${cart.reduce((s,c)=>s+c.qty,0)} шт</span></div>
        <div class="cart-line big"><span>Итого</span><b>${money(total)}</b></div>
        <div class="pay-row">
          ${[['cash','Наличные'],['card','Карта'],['transfer','Безнал']].map(p=>`<button class="pay-btn ${pay===p[0]?'on':''}" data-act="pay" data-p="${p[0]}">${p[1]}</button>`).join('')}
        </div>
        <button class="btn-checkout" data-act="checkout" ${cart.length?'':'disabled'}>Пробить чек · ${money(total)}</button>
      </div>
    </div></div>`;
  const sc=$('#scan'); sc.focus();
  sc.addEventListener('input',()=>posSearch(sc.value));
  sc.addEventListener('keydown',e=>{ if(e.key==='Enter'){ const first=$('#posResults .pos-prod'); if(first){ addToCart(first.dataset.pid); sc.value=''; posSearch(''); } } });
  posSearch('');
}
function posSearch(q){ const host=$('#posResults'); if(!host)return; const phId=posPharmacy();
  q=q.trim().toLowerCase();
  let list=S.products;
  if(q){ list=S.products.filter(p=>p.name.toLowerCase().includes(q)||p.inn.toLowerCase().includes(q)||p.barcode.includes(q)); }
  else { list=S.products.slice(0,8); }
  if(!list.length){ host.innerHTML='<div class="empty"><div class="ic">⌕</div>Ничего не найдено</div>'; return; }
  host.innerHTML=list.slice(0,40).map(p=>{ const st=stockAt(phId,p.id);
    const cl=st.qty<=0?'stock-no':st.qty<=st.min?'stock-low':'stock-ok';
    const sl=st.qty<=0?'нет в наличии':st.qty<=st.min?('мало · '+st.qty+' шт'):('в наличии · '+st.qty+' шт');
    return `<div class="pos-prod" data-act="pos-add" data-pid="${p.id}">
      <div><div class="pp-name">${esc(p.name)} ${p.rx?'<span class="pill rx" style="font-size:10px">Rx</span>':''}</div>
        <div class="pp-meta">${esc(p.inn)} · ${esc(p.dose)} · ${esc(p.pack)} · ${esc(p.manuf)}</div></div>
      <div class="pp-price"><b>${money(p.sale)}</b><div class="pp-stock ${cl}">${sl}</div></div></div>`;
  }).join('');
}
function addToCart(pid){ const phId=posPharmacy(); const st=stockAt(phId,pid);
  if(st.qty<=0){ toast('Нет в наличии в этой аптеке','warn'); return; }
  const ex=cart.find(c=>c.pid===pid);
  if(ex){ if(ex.qty>=st.qty){ toast('Недостаточно остатка','warn'); return; } ex.qty++; }
  else cart.push({pid,qty:1});
  renderPOSFull();
}
function checkout(){ const phId=posPharmacy();
  const lines=cart.map(c=>{ const p=prod(c.pid); return {pid:c.pid,name:p.name,qty:c.qty,price:p.sale,buy:p.buy}; });
  const total=lines.reduce((s,l)=>s+l.qty*l.price,0), cost=lines.reduce((s,l)=>s+l.qty*l.buy,0);
  // списываем остатки
  cart.forEach(c=>{ const st=stockAt(phId,c.pid); st.qty=Math.max(0,st.qty-c.qty); });
  const sale={id:'R'+Date.now().toString().slice(-6),pharmacyId:phId,userId:session.userId,
    ts:new Date().toISOString(),lines,total,cost,pay,type:'sale'};
  S.sales.push(sale); S.log.unshift({ts:sale.ts,userId:session.userId,text:`Продажа ${sale.id} · ${money(total)} · ${pay==='cash'?'наличные':pay==='card'?'карта':'безнал'}`});
  cart=[]; pay='cash'; save(); renderPOSFull(); showReceipt(sale);
}
function showReceipt(sale){ const ph=pharm(sale.pharmacyId), u=user(sale.userId);
  const rows=sale.lines.map(l=>`<div class="r-row"><span>${esc(l.name)} ×${l.qty}</span><span>${num(l.qty*l.price)}</span></div>`).join('');
  modal(`<div class="modal-b">
    <div class="receipt">
      <div class="r-c"><b>${esc(ph.name)}</b><br>${esc(ph.addr)}</div><hr>
      <div class="r-row"><span>Чек № ${sale.id}</span><span>${fmtTime(sale.ts)}</span></div>
      <div class="r-row"><span>Фармацевт</span><span>${esc(u.name)}</span></div><hr>
      ${rows}<hr>
      <div class="r-row"><b>ИТОГО</b><b>${num(sale.total)} смн</b></div>
      <div class="r-row"><span>${sale.pay==='cash'?'Наличные':sale.pay==='card'?'Карта':'Безнал'}</span><span>${num(sale.total)}</span></div><hr>
      <div class="r-c" style="font-size:11px">Остатки списаны автоматически · Спасибо за покупку!</div>
    </div>
    <div class="flex" style="justify-content:center;margin-top:16px;gap:10px">
      <button class="btn primary" data-act="close-modal">Новый чек</button>
    </div></div>`);
  setTimeout(()=>{ const sc=$('#scan'); if(sc)sc.focus(); },100);
}
// POS-действия (отдельный обработчик, т.к. POS вне общей оболочки)
document.addEventListener('click',e=>{ if(!session||route!=='pos')return;
  const b=e.target.closest('[data-act]'); if(!b)return; const a=b.dataset.act;
  if(a==='pos-add') addToCart(b.dataset.pid);
  else if(a==='cart-inc') addToCart(b.dataset.pid);
  else if(a==='cart-dec'){ const c=cart.find(x=>x.pid===b.dataset.pid); if(c){c.qty--; if(c.qty<=0)cart=cart.filter(x=>x.pid!==b.dataset.pid);} renderPOSFull(); }
  else if(a==='cart-del'){ cart=cart.filter(x=>x.pid!==b.dataset.pid); renderPOSFull(); }
  else if(a==='pay'){ pay=b.dataset.p; renderPOSFull(); }
  else if(a==='checkout'){ checkout(); }
  else if(a==='pos-exit'){ /* фармацевт «закрывает смену» — выход */ logout(); }
});

/* ---------- boot (после загрузки модулей) ---------- */
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',render);
else render();
})();
