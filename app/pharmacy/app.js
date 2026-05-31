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
function money(kgs){const v=Math.round(kgs*DB.fx[state.cur]);return v.toLocaleString('ru-RU')+' '+DB.curSym[state.cur];}
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
    {id:'catalog', t:'Каталог · 1С', i:'i-box'},
  ]},
  {g:'Маркетинг', items:[
    {id:'marketing', t:'Промокоды и акции', i:'i-tag'},
    {id:'bloggers', t:'Блогеры', i:'i-star'},
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
  catalog:['Каталог · остатки 1С','Зеркало 4 000 SKU в реальном времени'],
  marketing:['Промокоды и акции','Живут в CRM · в 1С уходит итоговая цена'],
  bloggers:['Блогеры и креаторы','Персональные коды · KPI · ROI'],
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
      const b=el(`<button class="nav-item ${state.page===it.id?'active':''}" data-page="${it.id}">
        ${ic(it.i)}<span>${it.t}</span>${it.badge?`<span class="badge ${it.alt?'alt':''}">${it.badge}</span>`:''}</button>`);
      b.onclick=()=>go(it.id);
      nav.appendChild(b);
    });
  });
}
function renderRoleSel(){
  const sel=$('#roleSel');sel.innerHTML='';
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
  const k=(ic_,col,lbl,val,sub,up)=>`<div class="kpi"><div class="k-ic" style="background:${col}22;color:${col}">${ic(ic_)}</div>
    <div class="k-lbl">${lbl}</div><div class="k-val">${val}</div><div class="k-sub ${up>0?'up':up<0?'down':''}">${sub}</div></div>`;
  c.appendChild(el(`<div class="cards-row">
    ${k('i-users','#10b981','Лиды за период',' 312','▲ 18% к апрелю',1)}
    ${k('i-funnel','#2563eb','Конверсия B2C','31%','▲ 4 п.п.',1)}
    ${k('i-money','#7c3aed','Средний чек',money(2180),'розница',0)}
    ${k('i-cart','#0891b2','Выручка месяц',money(4860000),'▲ 12%',1)}
    ${k('i-clock','#d97706','Скорость ответа','4 мин','▼ 1 мин — быстрее',1)}
  </div>`));
  c.appendChild(el(`<div class="cards-row section-gap">
    ${k('i-repeat','#db2777','LTV клиента',money(21400),'постоянные',0)}
    ${k('i-target','#16a34a','Активность продавцов','92%','план выполняется',1)}
    ${k('i-truck','#dc2626','Возвраты','1.8%','осн. причина — размер',0)}
    ${k('i-star','#e1306c','ROI маркетинга','312%','блогеры + сезон',1)}
    ${k('i-box','#0e7490','SKU в 1С','4 012','остатки синхронны',0)}
  </div>`));

  // funnel + channels
  c.appendChild(el(`<div class="grid-2 section-gap">
    <div class="panel"><div class="panel-h"><h3>Воронка B2C · этапы</h3><span class="ph-sub">розница</span></div>
      <div class="panel-b">${funnelVis([['Заявка',312,'#10b981'],['Квалификация',214,'#22c55e'],['Консультация',158,'#2563eb'],['Подтверждение',121,'#7c3aed'],['Доставка',104,'#0891b2'],['Закрыта',97,'#16a34a']])}</div></div>
    <div class="panel"><div class="panel-h"><h3>Лиды по каналам</h3></div><div class="panel-b">
      ${barList([['WhatsApp · 5 каналов',148,'var(--wa)'],['Instagram Direct',84,'var(--ig)'],['Reliney.kg',46,'#d97706'],['Dental Pharmacy',22,'#16a34a'],['Сарафан',12,'#7c3aed']],312)}
    </div></div>
  </div>`));

  c.appendChild(el(`<div class="grid-2 section-gap">
    <div class="panel"><div class="panel-h"><h3>Топ-товары месяца</h3></div><div class="panel-b">
      ${barList([['Pampers Premium 3',182000,'#10b981'],['Always Ultra ×10',96000,'#2563eb'],['Curaprox CS 5460',88000,'#7c3aed'],['Head&Shoulders 400мл',74000,'#0891b2'],['R.O.C.S. паста',61000,'#db2777']],182000,true)}
    </div></div>
    <div class="panel"><div class="panel-h"><h3>Выручка по магазинам</h3></div><div class="panel-b">
      ${barList([['Центр',1640000,'#10b981'],['Восток',1180000,'#2563eb'],['Ала-Тоо',980000,'#7c3aed'],['Юг',720000,'#0891b2'],['Опт-канал',340000,'#d97706']],1640000,true)}
    </div></div>
  </div>`));

  c.appendChild(el(`<div class="panel section-gap"><div class="panel-h"><h3>Активность продавцов</h3>
    <span class="ph-sub">входящие → закрытые → конверсия</span></div>
    <table class="tbl"><thead><tr><th>Продавец</th><th>Роль</th><th>Входящие</th><th>Закрыто</th><th>Конверсия</th><th class="num">Факт</th></tr></thead><tbody>
    ${DB.sellers.map(s=>`<tr><td><div class="cell-name"><span class="avatar-xs" style="background:${avBg(s.name)}">${initials(s.name)}</span>${s.name}</div></td>
      <td class="muted">${s.role}</td><td>${s.incoming}</td><td>${s.won}</td>
      <td><div class="row"><div class="mini-bar" style="width:80px"><i style="width:${s.conv}%;background:var(--accent)"></i></div><b>${s.conv}%</b></div></td>
      <td class="num">${money(s.fact)}</td></tr>`).join('')}
    </tbody></table></div>`));
};

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
  c.appendChild(el(`<div class="toolbar">
    <div class="seg" id="funnelSeg"><button class="${state.funnel==='b2c'?'on':''}" data-f="b2c">B2C · розница</button><button class="${state.funnel==='b2b'?'on':''}" data-f="b2b">B2B · опт</button></div>
    <select class="sel"><option>Все ответственные</option><option>Айгуль</option><option>Нурлан</option><option>Бекзат</option></select>
    <select class="sel"><option>Все источники</option><option>WhatsApp</option><option>Instagram</option><option>Сайт</option></select>
    <div class="spacer"></div>
    <button class="btn" onclick="toast('Настройка этапов воронки — без программиста','i-cog')">${ic('i-cog','sm')} Настроить этапы</button>
    <button class="btn primary" onclick="newDeal()">${ic('i-plus','sm')} Сделка</button>
  </div>`));
  $('#funnelSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{state.funnel=b.dataset.f;renderPage();});
  const stages=state.funnel==='b2c'?DB.stagesB2C:DB.stagesB2B;
  const deals=DB.deals.filter(d=>d.type===state.funnel);
  const board=el(`<div class="kanban" id="kanban"></div>`);
  stages.forEach(stg=>{
    const list=deals.filter(d=>d.stage===stg);
    const sum=list.reduce((a,d)=>a+d.sum,0);
    const col=el(`<div class="kcol" data-stage="${stg}">
      <div class="kcol-h"><span class="kc-name">${stg}</span><span class="kc-count">${list.length}</span><span class="kc-sum">${money(sum)}</span></div>
      <div class="kcol-b"></div></div>`);
    const body=col.querySelector('.kcol-b');
    list.forEach(d=>body.appendChild(dealCard(d)));
    // drop
    col.addEventListener('dragover',e=>{e.preventDefault();col.classList.add('drop-hot');});
    col.addEventListener('dragleave',()=>col.classList.remove('drop-hot'));
    col.addEventListener('drop',e=>{e.preventDefault();col.classList.remove('drop-hot');
      const id=e.dataTransfer.getData('id');const d=DB.deals.find(x=>x.id===id);
      if(d&&d.stage!==stg){d.stage=stg;renderPage();toast(`Сделка перенесена в «${stg}» — триггер этапа отправлен`,'i-flame','var(--amber)');}});
    board.appendChild(col);
  });
  c.appendChild(board);
};
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
  c.appendChild(el(`<div class="toolbar">
    <div class="fld-in">${ic('i-search','sm')}<input placeholder="Поиск по ФИО, телефону, карте…"></div>
    <select class="sel"><option>Все типы</option><option>розница</option><option>опт</option><option>врач</option><option>дисконт</option><option>подписчик</option><option>партнёр</option></select>
    <select class="sel"><option>Все метки</option><option>постоянный</option><option>новый</option><option>не хочет рассылок</option></select>
    <div class="spacer"></div>
    <button class="btn primary" onclick="toast('Карточка клиента создана','i-users')">${ic('i-plus','sm')} Клиент</button>
  </div>`));
  const panel=el(`<div class="panel"><table class="tbl"><thead><tr>
    <th>Клиент</th><th>Тип</th><th>Источник</th><th>Менеджер</th><th>Сделок</th><th class="num">LTV</th><th>Метки</th></tr></thead><tbody></tbody></table></div>`);
  const tb=panel.querySelector('tbody');
  DB.clients.forEach(cl=>{
    const tr=el(`<tr class="clickable">
      <td><div class="cell-name"><span class="avatar-xs" style="background:${avBg(cl.name)}">${initials(cl.name)}</span>
        <div><div>${cl.name}</div><div class="muted2" style="font-size:11px">${cl.phone}</div></div></div></td>
      <td>${cl.type.map(t=>`<span class="tag" style="margin:1px">${t}</span>`).join('')}</td>
      <td class="muted">${cl.source}</td><td>${cl.mgr}</td><td>${cl.deals}</td>
      <td class="num">${money(cl.ltv)}</td>
      <td>${cl.sub?'<span class="tag violet">'+ic('i-repeat','sm')+' подписка</span>':''}${cl.loyalty.includes('не хочет рассылок')?'<span class="tag red">no-рассылки</span>':''}</td></tr>`);
    tr.onclick=()=>clientModal(cl);tb.appendChild(tr);
  });
  c.appendChild(panel);
  c.appendChild(el(`<div class="note section-gap">${ic('i-info','sm')} Входящий поток из всех каналов попадает в CRM. В 1С передаются только реальные покупатели и опт-клиенты — чтобы база 1С не разрасталась.</div>`));
};
function clientModal(cl){
  state.clientTab=0;
  const bg=openModal(clientModalHTML(cl),'wide');
  bg.addEventListener('click',e=>{const t=e.target.closest('.tab');if(t){state.clientTab=+t.dataset.t;$('.modal',bg).innerHTML=clientModalHTML(cl);}});
}
function clientModalHTML(cl){
  const tabs=['Профиль','История покупок · 1С','Переписка','Сделки','Подписка'];
  let body='';
  if(state.clientTab===0){
    body=`<div class="grid-2b">
      <div><div class="fld"><label>ФИО</label><input value="${cl.name}"></div>
      <div class="fld"><label>Телефон</label><input value="${cl.phone}"></div>
      <div class="fld-row"><div class="fld"><label>Дата рождения</label><input value="${cl.dob}"></div><div class="fld"><label>Дисконтная карта</label><input value="${cl.card}"></div></div>
      <div class="fld"><label>Ответственный менеджер</label><input value="${cl.mgr}"></div></div>
      <div><div class="fld"><label>Тип клиента</label><div class="chips">${['розница','опт','врач','дисконт','подписчик','партнёр'].map(t=>`<span class="chip ${cl.type.includes(t)?'on':''}">${t}</span>`).join('')}</div></div>
      <div class="fld"><label>Метки лояльности</label><div class="chips">${['постоянный','новый','не хочет рассылок','заинтересован в подписке'].map(t=>`<span class="chip ${cl.loyalty.includes(t)?'on':''}">${t}</span>`).join('')}</div></div>
      <div class="fld"><label>Источник лида</label><input value="${cl.source}"></div></div>
    </div>`;
  } else if(state.clientTab===1){
    body=`<div class="note blue">${ic('i-sync','sm')} История покупок подтягивается из 1С Listki EG автоматически. LTV: <b>${money(cl.ltv)}</b> · сделок: ${cl.deals}</div>
    <div class="timeline section-gap">${cl.history.map(h=>tl('#16a34a','i-cart',h.t,h.d)).join('')}</div>`;
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
    <div><h3>${cl.name}</h3><div class="mh-sub">${cl.phone} · ${cl.card!=='—'?'карта '+cl.card:'без карты'}</div></div></div>
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
  c.appendChild(el(`<div class="toolbar">
    <div class="fld-in">${ic('i-search','sm')}<input placeholder="Поиск по SKU или названию…"></div>
    <select class="sel"><option>Все категории</option><option>Полость рта</option><option>Женская гигиена</option><option>Детская гигиена</option><option>Антисептика</option></select>
    <select class="sel"><option>Все юр.лица</option><option>ТОО</option><option>ИП</option></select>
    <div class="spacer"></div>
    <span class="tag green">${ic('i-sync','sm')} 4 012 SKU · зеркало 1С</span>
  </div>`));
  const panel=el(`<div class="panel"><table class="tbl"><thead><tr><th>SKU</th><th>Товар</th><th>Категория</th><th>Цвет</th><th>Юр.лицо</th><th class="num">Цена</th><th class="num">Остаток</th></tr></thead><tbody>
    ${DB.products.map(p=>`<tr class="clickable"><td class="muted2">${p.sku}</td><td>${p.name}</td><td class="muted">${p.cat}</td><td>${p.color}</td>
      <td><span class="tag ${p.entity==='ТОО'?'blue':'violet'}">${p.entity}</span></td><td class="num">${money(p.price)}</td>
      <td class="num">${p.stock===0?'<span class="tag red">нет</span>':p.stock<15?'<span class="tag amber">'+p.stock+'</span>':p.stock}</td></tr>`).join('')}
  </tbody></table></div>`);
  panel.querySelectorAll('tr.clickable').forEach((tr,i)=>tr.onclick=()=>toast('Остаток '+DB.products[i].name+' читается из 1С на момент клика','i-box'));
  c.appendChild(panel);
  c.appendChild(el(`<div class="note blue section-gap">${ic('i-info','sm')} Остатки, цены и разбивка по цвету/юр.лицу зеркалятся из 1С Listki EG. На начальном этапе (2–3 мес) 1С — источник правды по остаткам.</div>`));
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
  c.appendChild(el(`<div class="toolbar"><div class="seg"><button class="on">Все</button><button>Мои</button><button>По сделкам</button><button>Функциональные</button></div>
    <div class="spacer"></div><button class="btn primary" onclick="toast('Задача создана','i-check2')">${ic('i-plus','sm')} Задача</button></div>`));
  const panel=el(`<div class="panel"></div>`);
  DB.tasks.forEach(t=>{
    const row=el(`<div class="row" style="padding:13px 18px;border-bottom:1px solid var(--line)">
      <div class="toggle ${t.done?'on':''}" data-id="${t.id}"></div>
      <div style="flex:1"><div style="font-weight:600;${t.done?'text-decoration:line-through;opacity:.5':''}">${t.title}</div>
        <div class="muted" style="font-size:12px">${t.deal!=='—'?'сделка '+t.deal+' · ':''}${t.who} · ${t.due}</div></div>
      <span class="tag ${t.type==='звонок'?'blue':t.type==='отгрузка'?'violet':'amber'}">${t.type}</span>
      ${t.prio==='high'?'<span class="tag red">срочно</span>':''}</div>`);
    row.querySelector('.toggle').onclick=function(){t.done=!t.done;this.classList.toggle('on');row.querySelector('div[style*="flex"] div').style.cssText=t.done?'font-weight:600;text-decoration:line-through;opacity:.5':'font-weight:600';toast(t.done?'Задача выполнена':'Задача возвращена в работу');};
    panel.appendChild(row);
  });
  c.appendChild(panel);
  c.appendChild(el(`<div class="note section-gap">${ic('i-info','sm')} Автоматизированные «дела» — периодика по сделкам без ручного создания. Руководитель ставит задачи продавцам и видит выполнение в дашборде.</div>`));
};

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
  c.appendChild(el(`<div class="note amber section-gap">${ic('i-info','sm')} Массовые WhatsApp-рассылки через GreenAPI запрещены — риск бана номера. Для базы 10k+ рекомендуем bulk-провайдера (~15 ₸/сообщение) или ретаргет.</div>`));
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

// ---------- TEAM ----------
PAGES.team=(c)=>{
  const sections=[['Дашборд','dash'],['Воронки','funnels'],['Клиенты','clients'],['Чаты','inbox'],['Заказы','orders'],['Каталог','catalog'],['Маркетинг','marketing'],['Триггеры','triggers'],['Аналитика','analytics'],['KPI','kpi'],['Команда','team'],['Интеграции','integrations']];
  c.appendChild(el(`<div class="page-sub" style="margin-bottom:14px">Каждая роль видит только свой раздел. WhatsApp-каналы привязаны к сотрудникам.</div>`));
  const panel=el(`<div class="panel" style="overflow-x:auto"><table class="tbl perm-tbl"><thead><tr><th>Раздел</th>${DB.roles.map(r=>`<th style="text-align:center">${r.name.split(' ')[0]}</th>`).join('')}</tr></thead><tbody>
    ${sections.map(([lbl,id])=>`<tr><td>${lbl}</td>${DB.roles.map(r=>`<td style="text-align:center">${DB.access[r.id].includes(id)?'<span class="yes">'+ic('i-check2','sm')+'</span>':'<span class="no">—</span>'}</td>`).join('')}</tr>`).join('')}
  </tbody></table></div>`);
  c.appendChild(panel);
  c.appendChild(el(`<div class="grid-2 section-gap">
    <div class="panel"><div class="panel-h"><h3>Команда</h3></div><table class="tbl"><tbody>
      ${DB.roles.map(r=>`<tr><td><div class="cell-name"><span class="avatar-xs" style="background:${r.color}">${initials(r.who)}</span><div><div>${r.who}</div><div class="muted2" style="font-size:11px">${r.name}</div></div></div></td><td style="text-align:right"><span class="tag green">активен</span></td></tr>`).join('')}
    </tbody></table></div>
    <div class="panel"><div class="panel-h"><h3>Привязка WhatsApp-каналов</h3></div><table class="tbl"><tbody>
      ${DB.channels.filter(x=>x.type==='wa').map(ch=>`<tr><td><div class="cell-name"><span class="ci" style="width:26px;height:26px;border-radius:8px;background:var(--wa)22;color:var(--wa);display:grid;place-items:center">${ic('i-phone','sm')}</span>${ch.name}</div></td><td class="muted">${ch.phone}</td><td style="text-align:right"><b>${ch.owner}</b></td></tr>`).join('')}
    </tbody></table></div>
  </div>`));
};

// ---------- INTEGRATIONS ----------
PAGES.integrations=(c)=>{
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
  c.appendChild(el(`<div class="panel section-gap"><div class="panel-h"><h3>Журнал обмена с 1С</h3></div>
    <table class="tbl"><thead><tr><th>Время</th><th>Операция</th><th>Объект</th><th>Статус</th></tr></thead><tbody>
    ${[['12:01','Чтение остатков','4 012 SKU','ok'],['11:58','Запись заказа','#1078 → заказ покупателя','ok'],['11:40','Webhook дисконт.карта','DC-0502 → клиент','ok'],['11:20','Запись заказа','#B-205','очередь · 1С недоступен']].map(r=>`<tr><td class="muted2">${r[0]}</td><td>${r[1]}</td><td class="muted">${r[2]}</td><td><span class="tag ${r[3]==='ok'?'green':'amber'}">${r[3]}</span></td></tr>`).join('')}
  </tbody></table></div>`));
};

// ---------- SETTINGS ----------
PAGES.settings=(c)=>{
  c.appendChild(el(`<div class="grid-2 section-gap" style="margin-top:0">
    <div class="panel"><div class="panel-h"><h3>Воронки · этапы</h3><span class="ph-sub">настраиваются без программиста</span></div><div class="panel-b">
      <div style="font-weight:600;margin-bottom:8px">B2C · розница</div><div class="chips" style="margin-bottom:16px">${DB.stagesB2C.map(s=>`<span class="chip on">${s}</span>`).join('')}<span class="chip">${ic('i-plus','sm')}</span></div>
      <div style="font-weight:600;margin-bottom:8px">B2B · опт</div><div class="chips">${DB.stagesB2B.map(s=>`<span class="chip on">${s}</span>`).join('')}<span class="chip">${ic('i-plus','sm')}</span></div>
    </div></div>
    <div class="panel"><div class="panel-h"><h3>Локализация</h3></div><div class="panel-b">
      <div class="ctx-row"><span>Интерфейс</span><b>Русский</b></div>
      <div class="ctx-row"><span>Валюты</span><b>KGS · KZT (переключение)</b></div>
      <div class="ctx-row"><span>Часовой пояс</span><b>UTC+5</b></div>
      <div class="ctx-row"><span>Курс для отчётов</span><b>НБ КР</b></div>
    </div></div>
  </div>`));
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
$('#curSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{
  $('#curSeg').querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');
  state.cur=b.dataset.cur;renderPage();toast('Валюта: '+(state.cur==='KGS'?'сом (Кыргызстан)':'тенге (Казахстан)'),'i-money');});

// ---------- theme ----------
function applyTheme(t){
  state.theme=t;
  document.body.classList.toggle('light',t==='light');
  $('#themeBtn')?.querySelector('use')?.setAttribute('href',t==='light'?'#i-moon':'#i-sun');
  try{localStorage.setItem('pllatoTheme',t);}catch(e){}
}
$('#themeBtn').onclick=()=>{const t=state.theme==='light'?'dark':'light';applyTheme(t);
  toast('Тема: '+(t==='light'?'светлая':'тёмная'),t==='light'?'i-sun':'i-moon','var(--accent)');};

// ---------- init ----------
let savedTheme='dark';try{savedTheme=localStorage.getItem('pllatoTheme')||'dark';}catch(e){}
applyTheme(savedTheme);
renderNav();renderRoleSel();renderPage();

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
  renderNav(); renderPage();
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
