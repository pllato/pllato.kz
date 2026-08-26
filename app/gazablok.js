/* ТК Газаблок · МОБИЛЬНАЯ версия — интерфейс. Данные и расчёт — в gazablok-data.js */
/* ===== РОЛИ ===== */
const ROLES={
 'Менеджер · Аливиа':{av:'АС',n:'Асель',r:'Аливиа · менеджер',note:'Создаёт заявки с телефона, следит за своими',
  tabs:[['my','📋','Заявки'],['new','➕','Новая'],['pal','🧱','Поддоны'],['me','👤','Профиль']]},
 'ТК Газаблок':{av:'АЙ',n:'Айдана',r:'ТК Газаблок · диспетчер',note:'Подтверждает, отклоняет, возвращает на исправление',
  tabs:[['inbox','📥','Заявки'],['reis','🚚','Рейсы'],['palall','🧱','Поддоны'],['rep','📊','Отчёты']]},
 'Завсклада':{av:'НБ',n:'Нурбек',r:'Склад · завсклада',note:'Видит подтверждённые, формирует ТТН из заказа',
  tabs:[['wh','✅','К отгрузке'],['ttn','📄','ТТН'],['whpal','🧱','Поддоны'],['whist','🕘','История']]},
 'Водитель':{av:'МО',n:'Марат Ошақбаев',r:'Манипулятор · 774 ABC 02',note:'Свой рейс, статусы и фото доставки',
  tabs:[['trip','🚚','Мой рейс'],['tdone','✅','Выполнено'],['tpal','🧱','Поддоны'],['tme','👤','Профиль']]},
 'Администратор':{av:'АД',n:'Администратор',r:'ТК Газаблок · настройки',note:'Нормы блоков на поддон, компании, отчёты',
  tabs:[['norms','⚙️','Нормы'],['cos','🏢','Компании'],['rep','📊','Отчёты'],['log','🕘','Журнал']]}
};
let role='Менеджер · Аливиа',tab='my',view=null;

/* ===== ЭКРАНЫ ===== */
const SC={};
const orderCard=(o,onclick)=>`<div class="card tap" onclick="${onclick}">
 <div class="crow"><div><span class="cno">${o.no}</span><div class="ctitle">${esc(o.cl)}</div>
  <div class="cmeta">${esc(o.obj)} · ${esc(o.addr)}</div>
  <div class="cmeta">${o.date} · рейс ${o.reis} · ${sz(o.size).n} · <b>${num(o.m3)} м³</b> · ${calcOrder(o.m3,o.size).pal} подд.</div></div>
  <div style="text-align:right">${chip(o.st)}</div></div></div>`;

/* --- МЕНЕДЖЕР --- */
SC.my=()=>{const list=ORDERS.filter(o=>o.co===0);
 return `<div class="scr"><h2 class="h1">Мои заявки</h2><p class="sub">Компания «Аливиа» · менеджер Асель. Видно только свои заявки и их статус.</p>
 <div class="stat">
  <div><small>ВСЕГО ЗА АВГУСТ</small><b>34</b></div>
  <div><small>ОБЪЁМ, М³</small><b>612</b></div>
  <div><small>В РАБОТЕ</small><b class="a">${list.filter(o=>!['done','rej'].includes(o.st)).length}</b></div>
  <div><small>ПОДДОНОВ У КЛИЕНТОВ</small><b class="r">27</b></div>
 </div>
 ${list.map(o=>orderCard(o,`openOrder('${o.no}')`)).join('')}
 <button class="btn" onclick="go('new')">➕ Новая заявка</button></div>`};

let NF={cl:'',ph:'+7 ',obj:'',addr:'',date:'26.08.2026',reis:1,size:'s1',m3:'',drv:0,cmt:''};
SC.new=()=>{const m3=parseFloat(String(NF.m3).replace(',','.'))||0;const c=calcOrder(m3,NF.size);const s=sz(NF.size);
 return `<div class="scr"><h2 class="h1">Новая заявка</h2><p class="sub">Заполняется с телефона за минуту. Номер заказа присвоится автоматически после отправки.</p>
 <div class="fld"><label>Клиент</label><input id="f_cl" value="${esc(NF.cl)}" placeholder="ТОО «Алатау Курылыс»" oninput="NF.cl=this.value"></div>
 <div class="fld"><label>Телефон клиента</label><input id="f_ph" value="${esc(NF.ph)}" placeholder="+7 701 000 00 00" oninput="NF.ph=this.value"></div>
 <div class="fld"><label>Объект</label><input id="f_obj" value="${esc(NF.obj)}" placeholder="ЖК «Алатау», блок 3" oninput="NF.obj=this.value"></div>
 <div class="fld"><label>Адрес доставки</label><input id="f_addr" value="${esc(NF.addr)}" placeholder="ул. Жандосова, 58" oninput="NF.addr=this.value"></div>
 <div class="f2">
  <div class="fld"><label>Дата отгрузки</label><input id="f_date" value="${NF.date}" oninput="NF.date=this.value"></div>
  <div class="fld"><label>Рейс</label><select onchange="NF.reis=+this.value">${[1,2,3].map(r=>`<option value="${r}" ${NF.reis===r?'selected':''}>Рейс ${r}</option>`).join('')}</select></div>
 </div>
 <div class="fld"><label>Размер газоблока</label><select onchange="NF.size=this.value;render()">${SIZES.map(x=>`<option value="${x.id}" ${NF.size===x.id?'selected':''}>${x.n} · ${x.d}</option>`).join('')}</select></div>
 <div class="fld"><label>Количество, м³</label><input id="f_m3" inputmode="decimal" value="${esc(String(NF.m3))}" placeholder="24" oninput="NF.m3=this.value;recalc()"></div>
 <div class="calc" id="calcBox">
  <div class="cl">СИСТЕМА ПОСЧИТАЛА АВТОМАТИЧЕСКИ</div>
  <div class="cgrid">
   <div class="cg"><b id="cb">${m3?fmt(c.blocks):'—'}</b><small>блоков</small></div>
   <div class="cg"><b id="cp">${m3?c.pal:'—'}</b><small>поддонов</small></div>
   <div class="cg"><b id="cv">${m3?num(c.vol):'—'}</b><small>к отгрузке, м³</small></div>
  </div>
  <div class="cnote" id="cn">Норма: <b style="color:#fff">${s.per} блоков на поддон</b> · поддон ${num(palVol(s))} м³ · блок ${num(s.v*1000)/1000} м³.<br>${m3?`Заявлено <b style="color:#fff">${num(m3)} м³</b> → округляем вверх до целого поддона: <b style="color:#fff">${c.pal} подд. = ${num(c.vol)} м³</b>.`:'Нормы задаёт администратор ТК Газаблок — расчёт идёт по ним.'}</div>
 </div>
 <div class="f2">
  <div class="fld"><label>Манипулятор / водитель</label><select onchange="NF.drv=+this.value">${DRIVERS.map((d,i)=>`<option value="${i}" ${NF.drv===i?'selected':''}>${d.n.split(' ')[0]} · ${d.car.split('· ')[1]}</option>`).join('')}</select></div>
  <div class="fld"><label>Комментарий</label><input value="${esc(NF.cmt)}" placeholder="условия разгрузки" oninput="NF.cmt=this.value"></div>
 </div>
 <button class="btn" onclick="sendOrder()">Отправить заявку</button>
 <button class="btn sec" style="margin-top:7px" onclick="fillDemo()">Заполнить примером</button></div>`};
function recalc(){const m3=parseFloat(String(NF.m3).replace(',','.'))||0;const c=calcOrder(m3,NF.size);
 const b=document.getElementById('cb'),p=document.getElementById('cp'),v=document.getElementById('cv');
 if(!b)return;b.textContent=m3?fmt(c.blocks):'—';p.textContent=m3?c.pal:'—';v.textContent=m3?num(c.vol):'—';
 const box=document.getElementById('calcBox');box.style.transition='none';box.style.boxShadow='0 0 0 3px var(--accs)';
 setTimeout(()=>{box.style.transition='.4s';box.style.boxShadow='none'},220)}
function fillDemo(){NF={cl:'ТОО «Алатау Курылыс»',ph:'+7 701 220 44 18',obj:'ЖК «Алатау», блок 3',addr:'ул. Жандосова, 58',date:'26.08.2026',reis:1,size:'s1',m3:'24',drv:0,cmt:'Разгрузка до 17:00'};render();
 toast('Пример заполнен: 24 м³ размера 600×300×200 — система сразу показала <b>14 поддонов = 700 блоков = 25,2 м³</b> (округление вверх до целого поддона).')}
function sendOrder(){const m3=parseFloat(String(NF.m3).replace(',','.'))||0;
 if(!NF.cl||!m3)return toast('Заполните клиента и количество в м³ — остальное система посчитает сама.');
 const c=calcOrder(m3,NF.size);const no='ГБ-2026-0'+(seq++);
 ORDERS.unshift({no,co:0,mgr:0,cl:NF.cl,ph:NF.ph,obj:NF.obj||'—',addr:NF.addr||'—',date:NF.date,reis:NF.reis,size:NF.size,m3,drv:NF.drv,cmt:NF.cmt,st:'new',
  pallets:{out:0,back:0},hist:[['Заявка создана','Асель · Аливиа','сейчас',`Объём ${num(m3)} м³ · ${sz(NF.size).n} · ${c.pal} поддонов`]]});
 NF={cl:'',ph:'+7 ',obj:'',addr:'',date:'26.08.2026',reis:1,size:'s1',m3:'',drv:0,cmt:''};
 go('my');sparks();
 toast(`Заявка <b>${no}</b> отправлена. Заявлено ${num(m3)} м³ → к отгрузке <b>${c.pal} поддонов = ${fmt(c.blocks)} блоков = ${num(c.vol)} м³</b>. ТК Газаблок уже видит её у себя.`)}

SC.pal=()=>{const my=ORDERS.filter(o=>o.co===0);
 const out=my.reduce((a,o)=>a+o.pallets.out,0),back=my.reduce((a,o)=>a+o.pallets.back,0);
 return `<div class="scr"><h2 class="h1">Поддоны</h2><p class="sub">Отдельный учёт по компании «Аливиа»: сколько выдано, сколько вернули, сколько осталось у клиентов.</p>
 <div class="stat">
  <div><small>ВЫДАНО ВСЕГО</small><b>${out+112}</b></div>
  <div><small>ВОЗВРАЩЕНО</small><b class="g">${back+85}</b></div>
  <div><small>ОСТАЛОСЬ У КЛИЕНТОВ</small><b class="r">${out+112-(back+85)}</b></div>
  <div><small>ЗАЛОГ ЗА ПОДДОН</small><b>2 500 ₸</b></div>
 </div>
 <div class="card"><b style="font-size:11px">По клиентам</b>
  ${[['ТОО «Курылыс Плюс»',10,0],['ТОО «Алатау Курылыс»',14,8],['ИП Сериков',7,7],['ТОО «Аском Строй»',20,14]]
   .map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]} выдано · ${r[2]} возврат · <span style="color:${r[1]-r[2]?'var(--red)':'var(--green)'}">${r[1]-r[2]} долг</span></b></div>`).join('')}</div>
 <div class="alert info"><b>Как это работает</b>Водитель при выгрузке отмечает выданные поддоны, при следующем рейсе — принятые обратно. Долг по поддонам виден и вам, и ТК Газаблок в реальном времени.</div></div>`};

SC.me=()=>`<div class="scr"><h2 class="h1">Профиль</h2><p class="sub">Менеджер компании-перекупа</p>
 <div class="card"><div class="kv"><span>Сотрудник</span><b>Асель Жумабаева</b></div>
 <div class="kv"><span>Компания</span><b>Аливиа</b></div>
 <div class="kv"><span>Телефон / вход</span><b>+7 701 555 12 34</b></div>
 <div class="kv"><span>Роль</span><b>Менеджер</b></div>
 <div class="kv"><span>Заявок за месяц</span><b>34 · 612 м³</b></div></div>
 <div class="alert info"><b>Приложение ставить не нужно</b>Это сайт: открыли в браузере телефона, нажали «добавить на главный экран» — появится иконка, как у обычного приложения. Обновления прилетают сами.</div>
 <div class="card"><b style="font-size:11px">Что видит менеджер</b>
  <div class="kv"><span>Свои заявки</span><b>да</b></div>
  <div class="kv"><span>Заявки других компаний</span><b style="color:var(--red)">нет</b></div>
  <div class="kv"><span>Цены и склад ТК</span><b style="color:var(--red)">нет</b></div>
  <div class="kv"><span>Поддоны своей компании</span><b>да</b></div></div></div>`;

/* --- ТК ГАЗАБЛОК --- */
SC.inbox=()=>{const nw=ORDERS.filter(o=>o.st==='new');
 return `<div class="scr"><h2 class="h1">Заявки компаний</h2><p class="sub">Все заявки от компаний-перекупов. Можно подтвердить, отклонить или вернуть на исправление.</p>
 <div class="stat">
  <div><small>НОВЫХ</small><b class="a">${nw.length}</b></div>
  <div><small>ПОДТВЕРЖДЕНО СЕГОДНЯ</small><b class="g">7</b></div>
  <div><small>ОБЪЁМ НА ЗАВТРА</small><b>96 м³</b></div>
  <div><small>КОМПАНИЙ</small><b>3</b></div>
 </div>
 ${ORDERS.map(o=>`<div class="card tap" onclick="openOrder('${o.no}')">
  <div class="crow"><div><span class="cno">${o.no}</span> <span class="badge">${co(o.co)}</span>
   <div class="ctitle">${esc(o.cl)}</div>
   <div class="cmeta">${esc(o.obj)} · менеджер ${MANAGERS[o.mgr]}</div>
   <div class="cmeta">${o.date} · рейс ${o.reis} · ${sz(o.size).n} · <b>${num(o.m3)} м³</b> · ${calcOrder(o.m3,o.size).pal} подд.</div></div>
   <div style="text-align:right">${chip(o.st)}</div></div></div>`).join('')}</div>`};

SC.reis=()=>`<div class="scr"><h2 class="h1">Рейсы на 26 августа</h2><p class="sub">Кто, куда и с каким грузом едет. Водителю уходит его рейс в телефон.</p>
 ${[[1,'Ерлан Сатыбалдиев','512 KZA 02',[['ГБ-2026-0147','ЖК «Алатау», блок 3','24 м³ · 14 подд.'],['ГБ-2026-0146','мкр. Нурлы Тау','12 м³ · 7 подд.']]],
    [2,'Марат Ошақбаев','774 ABC 02',[['ГБ-2026-0144','ЖК «Достык», паркинг','18 м³ · 10 подд.']]]]
  .map(r=>`<div class="card"><div class="crow"><div><span class="cno">РЕЙС ${r[0]}</span><div class="ctitle">${r[1]}</div><div class="cmeta">Манипулятор ${r[2]}</div></div><span class="badge o">${r[3].length} точки</span></div>
   <div style="margin-top:8px">${r[3].map(x=>`<div class="kv"><span>${x[0]} · ${x[1]}</span><b>${x[2]}</b></div>`).join('')}</div></div>`).join('')}
 <div class="alert info"><b>Загрузка машины</b>Система складывает поддоны по рейсу и показывает, влезает ли груз: манипулятор берёт до 14 поддонов за ходку.</div></div>`;

SC.palall=()=>`<div class="scr"><h2 class="h1">Поддоны · вся сеть</h2><p class="sub">Учёт по компаниям и клиентам: выдано, возвращено, осталось.</p>
 <div class="stat">
  <div><small>ВЫДАНО ЗА МЕСЯЦ</small><b>418</b></div>
  <div><small>ВОЗВРАЩЕНО</small><b class="g">341</b></div>
  <div><small>У КЛИЕНТОВ</small><b class="r">77</b></div>
  <div><small>СУММА ЗАЛОГА</small><b>192 500 ₸</b></div>
 </div>
 <div class="card"><b style="font-size:11px">По компаниям</b>
 ${[['Аливиа',186,159],['СтройБаза KZ',142,118],['Мега Строй',90,64]].map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]} / ${r[2]} · <span style="color:var(--red)">${r[1]-r[2]}</span></b></div>`).join('')}</div>
 <div class="alert warn"><b>Долг больше 30 поддонов</b>У «Мега Строй» на руках 26 поддонов дольше 14 дней — система подсветила и предложила выставить залог к оплате.</div></div>`;

SC.rep=()=>`<div class="scr"><h2 class="h1">Отчёты</h2><p class="sub">Любой срез выгружается в Excel одной кнопкой.</p>
 <div class="seg"><button class="on">Август</button><button onclick="toast('Период меняется: неделя, месяц, квартал или произвольные даты.')">Июль</button><button onclick="toast('Произвольный период: с — по.')">Период</button></div>
 <div class="stat">
  <div><small>ОТГРУЖЕНО, М³</small><b>1 284</b></div>
  <div><small>БЛОКОВ</small><b>38 640</b></div>
  <div><small>РЕЙСОВ</small><b>96</b></div>
  <div><small>ЗАКАЗОВ</small><b>112</b></div>
 </div>
 <div class="card"><b style="font-size:11px">Объём по компаниям, м³</b>
 ${[['Аливиа',612,100],['СтройБаза KZ',428,70],['Мега Строй',244,40]].map(r=>`<div style="margin:7px 0"><div class="kv" style="border:0;padding:2px 0"><span>${r[0]}</span><b>${r[1]} м³</b></div>
  <div style="height:7px;background:var(--line);border-radius:4px;overflow:hidden"><i style="display:block;height:100%;width:${r[2]}%;background:var(--acc)"></i></div></div>`).join('')}</div>
 <div class="card"><b style="font-size:11px">Выгрузка в Excel</b>
 ${[['Отгрузки за период','м³, блоки, поддоны, рейсы, даты'],['По клиентам','объект, объём, поддоны, долг'],['По компаниям','заявки, объём, менеджеры'],['Поддоны','выдано, возвращено, остаток'],['Рейсы и водители','точки, груз, время доставки']]
  .map(r=>`<div class="kv" style="cursor:pointer" onclick="toast('Файл «${r[0]}» выгружен в Excel: ${r[1]}.')"><span>${r[0]}</span><b style="color:var(--green)">⬇ XLSX</b></div>`).join('')}</div></div>`;

/* --- ЗАВСКЛАДА --- */
SC.wh=()=>{const list=ORDERS.filter(o=>['ok','ttn'].includes(o.st));
 return `<div class="scr"><h2 class="h1">К отгрузке</h2><p class="sub">Только подтверждённые заявки. Переписывать данные руками не нужно — ТТН формируется из заказа.</p>
 <div class="stat">
  <div><small>К ОТГРУЗКЕ</small><b>${list.length}</b></div>
  <div><small>ОБЪЁМ, М³</small><b>${num(list.reduce((a,o)=>a+o.m3,0))}</b></div>
  <div><small>ПОДДОНОВ</small><b>${list.reduce((a,o)=>a+calcOrder(o.m3,o.size).pal,0)}</b></div>
  <div><small>ТТН ГОТОВО</small><b class="g">${list.filter(o=>o.ttn).length}</b></div>
 </div>
 ${list.map(o=>orderCard(o,`openOrder('${o.no}')`)).join('')||'<div class="card"><p class="sub" style="margin:0">Подтверждённых заявок пока нет.</p></div>'}</div>`};

SC.ttn=()=>{const o=ORDERS.find(x=>x.no==='ГБ-2026-0145');const c=calcOrder(o.m3,o.size);
 return `<div class="scr"><h2 class="h1">ТТН</h2><p class="sub">Формируется из заказа автоматически: клиент, адрес, груз, количество, поддоны, водитель.</p>
 <div class="ttn"><div class="ttn-h"><b>${o.ttn||'ТТН-2026-0388'}</b><small>от ${o.date}</small></div>
  <div class="ttn-b">
   <div class="kv"><span>Заказ</span><b>${o.no}</b></div>
   <div class="kv"><span>Грузополучатель</span><b>${esc(o.cl)}</b></div>
   <div class="kv"><span>Адрес доставки</span><b style="max-width:60%">${esc(o.addr)}</b></div>
   <div class="kv"><span>Водитель</span><b>${DRIVERS[o.drv].n.split(' ')[0]} · ${DRIVERS[o.drv].car.split('· ')[1]}</b></div>
   <table class="tbl" style="margin-top:8px"><tr><th>Груз</th><th class="r">Кол-во</th></tr>
    <tr><td>Газоблок ${sz(o.size).n} ${sz(o.size).d}</td><td class="r">${fmt(c.blocks)} шт</td></tr>
    <tr><td>Объём</td><td class="r">${num(c.vol)} м³</td></tr>
    <tr><td>Поддонов</td><td class="r">${c.pal} шт</td></tr></table>
  </div></div>
 <div class="btn2"><button class="btn sm dk" onclick="toast('ТТН отправлена водителю в телефон и на печать. PDF сохранён в заказе.')">📄 Печать / PDF</button>
 <button class="btn sm bl" onclick="whChange()">✏️ Изменить количество</button></div>
 <div class="alert ok" style="margin-top:9px"><b>Ничего не переписывается вручную</b>Все данные ТТН взяты из заказа менеджера. Ошибки при переносе исключены — это была одна из главных задач по ТЗ.</div></div>`};
function whChange(){
 openView(`<div class="scr"><h2 class="h1">Изменение количества</h2><p class="sub">Заказ ГБ-2026-0145 · ТТН-2026-0388</p>
 <div class="alert warn"><b>⚠ Внимание</b>Вы меняете данные подтверждённой заявки. Изменение увидят менеджер компании и ТК Газаблок, а система сохранит: кто, когда и что изменил.</div>
 <div class="f2"><div class="fld"><label>Было, м³</label><input value="36" disabled style="background:#f1f5f9"></div>
 <div class="fld"><label>Стало, м³</label><input id="chM3" value="34,2" inputmode="decimal"></div></div>
 <div class="fld"><label>Причина изменения</label><select id="chWhy"><option>Фактическая загрузка меньше — не поместилось на машину</option><option>Клиент уменьшил объём на месте</option><option>Ошибка в заявке</option><option>Замена размера блока</option></select></div>
 <div class="calc"><div class="cl">ПЕРЕСЧЁТ ПОСЛЕ ИЗМЕНЕНИЯ</div>
  <div class="cgrid"><div class="cg"><b>1 140</b><small>блоков</small></div><div class="cg"><b>19</b><small>поддонов</small></div><div class="cg"><b>34,2</b><small>объём, м³</small></div></div>
  <div class="cnote">Было: 1 200 блоков · 20 поддонов · 36 м³</div></div>
 <button class="btn rd" onclick="whSave()">Сохранить изменение</button>
 <button class="btn sec" style="margin-top:7px" onclick="closeView()">Отмена</button></div>`)}
function whSave(){const o=ORDERS.find(x=>x.no==='ГБ-2026-0145');
 o.m3=34.2;o.hist.push(['Изменено количество','Завсклада Нурбек','сейчас','Было 36 м³ / 20 подд. → стало 34,2 м³ / 19 подд. Причина: фактическая загрузка меньше']);
 closeView();sparks();
 toast('Изменение сохранено. В истории заказа записано: <b>Нурбек, сейчас, 36 → 34,2 м³</b>. Менеджеру «СтройБаза KZ» и ТК Газаблок ушло уведомление.')}

SC.whpal=()=>`<div class="scr"><h2 class="h1">Поддоны склада</h2><p class="sub">Выдача под рейс и приём возврата.</p>
 <div class="stat"><div><small>НА СКЛАДЕ</small><b>642</b></div><div><small>ВЫДАНО В РЕЙСЫ</small><b class="a">41</b></div>
 <div><small>ЖДЁМ ВОЗВРАТ</small><b class="r">77</b></div><div><small>БРАК</small><b>6</b></div></div>
 <div class="card"><b style="font-size:11px">Выдача под сегодняшние рейсы</b>
 ${[['Рейс 1 · Ерлан','21 поддон','выдано'],['Рейс 2 · Марат','10 поддонов','выдано'],['Рейс 3 · резерв','10 поддонов','подготовлено']]
  .map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]} · <span style="color:${r[2]==='выдано'?'var(--green)':'var(--muted)'}">${r[2]}</span></b></div>`).join('')}</div>
 <button class="btn sec" onclick="toast('Приём возврата: сканируем или вводим количество, поддоны возвращаются на склад, долг клиента уменьшается.')">Принять возврат поддонов</button></div>`;

SC.whist=()=>`<div class="scr"><h2 class="h1">История изменений</h2><p class="sub">Все правки по заказам: кто, когда и что изменил. Удалить запись нельзя.</p>
 ${[['ГБ-2026-0145','Нурбек · завсклада','25.08 08:12','Количество 36 → 34,2 м³ (20 → 19 поддонов)','warn'],
    ['ГБ-2026-0142','Айдана · ТК Газаблок','23.08 11:30','Возвращена на исправление: не совпадает объём','info'],
    ['ГБ-2026-0144','Марат · водитель','25.08 08:05','Статус: выехал на объект','info'],
    ['ГБ-2026-0143','Ерлан · водитель','24.08 11:55','Возврат поддонов: 3 из 5','ok'],
    ['ГБ-2026-0141','Нурбек · завсклада','23.08 07:40','Размер 600×250×200 → 600×300×200 по согласованию','warn']]
  .map(h=>`<div class="alert ${h[4]}" style="margin-bottom:7px"><b>${h[0]} · ${h[2]}</b>${h[3]}<div style="font-size:8.6px;margin-top:3px;opacity:.8">${h[1]}</div></div>`).join('')}</div>`;

/* --- ВОДИТЕЛЬ --- */
SC.trip=()=>{const o=ORDERS.find(x=>x.no==='ГБ-2026-0144');const c=calcOrder(o.m3,o.size);
 const step=o.st==='road'?1:o.st==='done'?3:0;
 return `<div class="scr"><h2 class="h1">Мой рейс · сегодня</h2><p class="sub">Рейс 2 · манипулятор 774 ABC 02</p>
 <div class="steps">
  <div class="st ${step>=0?'done':''}"><i></i>Принял груз</div>
  <div class="st ${step>=1?(step===1?'cur':'done'):''}"><i></i>Выехал</div>
  <div class="st ${step>=3?'done':''}"><i></i>Доставлено</div>
 </div>
 <div class="card"><div class="crow"><div><span class="cno">${o.no}</span><div class="ctitle">${esc(o.cl)}</div>
  <div class="cmeta">${esc(o.obj)}</div></div>${chip(o.st)}</div>
  <div style="margin-top:8px">
   <div class="kv"><span>Адрес</span><b style="max-width:62%">${esc(o.addr)}</b></div>
   <div class="kv"><span>Груз</span><b>Газоблок ${sz(o.size).n}</b></div>
   <div class="kv"><span>Количество</span><b>${fmt(c.blocks)} шт · ${num(c.vol)} м³</b></div>
   <div class="kv"><span>Поддонов</span><b>${c.pal}</b></div>
   <div class="kv"><span>Контакт на объекте</span><b>${esc(o.ph)}</b></div>
  </div>
  <div class="btn2" style="margin-top:9px">
   <button class="btn sm bl" onclick="toast('Открывается 2ГИС / Google Карты с маршрутом до объекта.')">🧭 Маршрут</button>
   <button class="btn sm sec" onclick="toast('Звонок клиенту прямо из заявки — номер не нужно искать в переписке.')">📞 Позвонить</button>
  </div>
 </div>
 ${o.st==='done'?`<div class="alert ok"><b>Доставлено</b>Фото загружены, поддоны отмечены. Заказ закрыт.</div>`:`
 <button class="btn ${o.st==='road'?'gr':''}" onclick="drvNext()">${o.st==='road'?'✅ Доставлено':'🚚 Выехал на объект'}</button>`}
 <div class="card" style="margin-top:9px"><b style="font-size:11px">Фото доставки</b>
  <p class="sub" style="margin:5px 0 8px">Снимок выгруженного товара на объекте — подтверждение для клиента и компании.</p>
  <div class="photos"><div class="photo" onclick="toast('Камера открыта: фото прикрепится к заказу и попадёт в историю.')">📷</div>
   <div class="photo" style="background:linear-gradient(135deg,#94a3b8,#64748b)" onclick="toast('Фото выгрузки от 25.08, 11:42.')">🧱</div></div>
  <button class="btn sec sm" style="width:100%" onclick="toast('Фото добавлено к заказу ${o.no}.')">+ Добавить фото</button></div></div>`};
function drvNext(){const o=ORDERS.find(x=>x.no==='ГБ-2026-0144');
 if(o.st!=='road'){o.st='road';o.hist.push(['Выехал на объект','Марат Ошақбаев','сейчас','']);render();
  toast('Статус «Выехал». Менеджер и ТК Газаблок видят это сразу, клиенту можно назвать точное время.');return}
 o.st='done';o.pallets.out=calcOrder(o.m3,o.size).pal;
 o.hist.push(['Доставлено · фото приложены','Марат Ошақбаев','сейчас','Принял: прораб на объекте']);
 render();sparks();
 toast('Доставка закрыта: фото приложены, <b>10 поддонов</b> записаны за клиентом. Заказ прошёл полный путь от заявки до выгрузки.')}

SC.tdone=()=>`<div class="scr"><h2 class="h1">Выполнено</h2><p class="sub">Мои рейсы за август: 38 доставок, 486 м³</p>
 <div class="stat"><div><small>ДОСТАВОК</small><b>38</b></div><div><small>ОБЪЁМ, М³</small><b>486</b></div>
 <div><small>ПОДДОНОВ ВЫДАНО</small><b>271</b></div><div><small>ВОЗВРАТ</small><b class="g">232</b></div></div>
 ${ORDERS.filter(o=>o.st==='done').map(o=>orderCard(o,`openOrder('${o.no}')`)).join('')}
 <div class="card"><b style="font-size:11px">За неделю</b>
 ${[['ПН',6],['ВТ',5],['СР',7],['ЧТ',4],['ПТ',8],['СБ',3]].map(d=>`<div style="display:flex;align-items:center;gap:8px;margin:5px 0">
  <span style="width:24px;font-size:9px;color:var(--muted)">${d[0]}</span>
  <div style="flex:1;height:8px;background:var(--line);border-radius:4px;overflow:hidden"><i style="display:block;height:100%;width:${d[1]/8*100}%;background:var(--acc)"></i></div>
  <b style="font-size:9.6px">${d[1]}</b></div>`).join('')}</div></div>`;

SC.tpal=()=>`<div class="scr"><h2 class="h1">Поддоны в рейсе</h2><p class="sub">Отмечаем выданные и принятые обратно — прямо на объекте.</p>
 <div class="card"><b style="font-size:11px">ГБ-2026-0144 · ЖК «Достык»</b>
  <div class="kv"><span>Выдано при выгрузке</span><b>10</b></div>
  <div class="kv"><span>Принято обратно</span><b>0</b></div>
  <div class="kv"><span>Осталось у клиента</span><b style="color:var(--red)">10</b></div>
  <div class="btn2" style="margin-top:9px"><button class="btn sm" onclick="toast('Отмечено: выдано 10 поддонов. Записано за клиентом.')">Выдал поддоны</button>
  <button class="btn sm gr" onclick="toast('Принято 4 поддона обратно — долг клиента уменьшился до 6.')">Принял возврат</button></div></div>
 <div class="alert info"><b>Зачем это водителю</b>Две кнопки на объекте — и в офисе уже знают, сколько поддонов у клиента. Не нужно вечером сверяться по телефону.</div></div>`;

SC.tme=()=>`<div class="scr"><h2 class="h1">Профиль</h2><p class="sub">Водитель-манипуляторщик</p>
 <div class="card"><div class="kv"><span>Водитель</span><b>Марат Ошақбаев</b></div>
 <div class="kv"><span>Машина</span><b>Манипулятор 774 ABC 02</b></div>
 <div class="kv"><span>Телефон</span><b>+7 707 331 88 04</b></div>
 <div class="kv"><span>Рейсов за месяц</span><b>38</b></div></div>
 <div class="alert info"><b>Только свой рейс</b>Водитель видит адреса и грузы только своего рейса — чужие заказы, цены и данные компаний ему недоступны.</div></div>`;

/* --- АДМИНИСТРАТОР --- */
SC.norms=()=>`<div class="scr"><h2 class="h1">Нормы блоков на поддон</h2><p class="sub">Задаются администратором ТК Газаблок. От них считаются поддоны во всех заявках.</p>
 ${SIZES.map((s,i)=>`<div class="card"><div class="crow"><div><div class="ctitle">${s.n}</div><div class="cmeta">${s.d} · объём блока ${num(s.v*1000)/1000} м³</div></div>
  <span class="badge o">${num(palVol(s))} м³ / поддон</span></div>
  <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
   <button class="btn sm sec" style="width:44px" onclick="normSet(${i},-5)">−</button>
   <div style="flex:1;text-align:center"><b style="font-size:19px">${s.per}</b><div style="font-size:8.4px;color:var(--muted)">блоков на поддон</div></div>
   <button class="btn sm sec" style="width:44px" onclick="normSet(${i},5)">+</button>
  </div></div>`).join('')}
 <div class="alert warn"><b>Изменение норм</b>Новые нормы применяются к новым заявкам. Уже созданные заказы не пересчитываются — иначе разъедутся ТТН и отгрузки.</div></div>`;
function normSet(i,d){SIZES[i].per=Math.max(5,SIZES[i].per+d);render();
 toast(`Норма для ${SIZES[i].n}: <b>${SIZES[i].per} блоков на поддон</b> (${num(palVol(SIZES[i]))} м³). Все новые заявки считаются по ней.`)}

SC.cos=()=>`<div class="scr"><h2 class="h1">Компании и доступы</h2><p class="sub">Подключаем партнёров по одному. Первая — «Аливиа».</p>
 ${[['Аливиа','3 менеджера','активна','g'],['СтройБаза KZ','2 менеджера','активна','g'],['Мега Строй','1 менеджер','тест','a'],['+ Новая компания','подключается за 5 минут','','']]
  .map(c=>`<div class="card tap" onclick="toast('${c[0]}: менеджеры, заявки, поддоны и лимиты — в карточке компании.')">
   <div class="crow"><div><div class="ctitle">${c[0]}</div><div class="cmeta">${c[1]}</div></div>${c[2]?`<span class="badge ${c[3]}">${c[2]}</span>`:''}</div></div>`).join('')}
 <div class="card"><b style="font-size:11px">Пользователи системы</b>
 ${[['Менеджеры компаний',6],['Диспетчеры ТК',2],['Завсклада',1],['Водители',4],['Администраторы',1]].map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div>
 <div class="alert info"><b>Вход по телефону</b>Сотрудник вводит номер, получает код в SMS или WhatsApp — пароли помнить не нужно. Доступ можно отключить одной кнопкой.</div></div>`;

SC.log=()=>`<div class="scr"><h2 class="h1">Журнал действий</h2><p class="sub">Кто что сделал в системе. Записи не удаляются.</p>
 ${[['09:12','Асель · Аливиа','Создала заявку ГБ-2026-0147'],
    ['09:05','Айдана · ТК','Подтвердила ГБ-2026-0146'],
    ['08:12','Нурбек · склад','Изменил количество в ГБ-2026-0145'],
    ['08:05','Марат · водитель','Статус «Выехал» по ГБ-2026-0144'],
    ['07:45','Нурбек · склад','Сформировал ТТН-2026-0388'],
    ['07:40','Ерлан · водитель','Принял груз по рейсу 1']]
  .map(l=>`<div class="card" style="padding:9px 11px"><div class="crow"><div><b style="font-size:10.4px">${l[2]}</b><div class="cmeta">${l[1]}</div></div><span class="badge">${l[0]}</span></div></div>`).join('')}</div>`;

/* ===== КАРТОЧКА ЗАКАЗА ===== */
function openOrder(no){const o=ORDERS.find(x=>x.no===no);if(!o)return;const c=calcOrder(o.m3,o.size);
 const isTK=role==='ТК Газаблок',isWH=role==='Завсклада';
 openView(`<div class="scr">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
   <div><h2 class="h1" style="margin:0">${o.no}</h2><p class="sub" style="margin:2px 0 0">${co(o.co)} · менеджер ${MANAGERS[o.mgr]}</p></div>${chip(o.st)}</div>
  <div class="card" style="margin-top:10px">
   <div class="kv"><span>Клиент</span><b style="max-width:60%">${esc(o.cl)}</b></div>
   <div class="kv"><span>Телефон</span><b>${esc(o.ph)}</b></div>
   <div class="kv"><span>Объект</span><b style="max-width:60%">${esc(o.obj)}</b></div>
   <div class="kv"><span>Адрес</span><b style="max-width:60%">${esc(o.addr)}</b></div>
   <div class="kv"><span>Дата · рейс</span><b>${o.date} · рейс ${o.reis}</b></div>
   <div class="kv"><span>Размер</span><b>${sz(o.size).n}</b></div>
   <div class="kv"><span>Водитель</span><b>${DRIVERS[o.drv].n.split(' ')[0]} · ${DRIVERS[o.drv].car.split('· ')[1]}</b></div>
   ${o.ttn?`<div class="kv"><span>ТТН</span><b>${o.ttn}</b></div>`:''}
   ${o.cmt?`<div class="kv"><span>Комментарий</span><b style="max-width:60%;font-weight:500">${esc(o.cmt)}</b></div>`:''}
  </div>
  <div class="calc"><div class="cl">РАСЧЁТ ПО ЗАЯВКЕ</div>
   <div class="cgrid"><div class="cg"><b>${fmt(c.blocks)}</b><small>блоков</small></div><div class="cg"><b>${c.pal}</b><small>поддонов</small></div><div class="cg"><b>${num(c.vol)}</b><small>объём, м³</small></div></div>
   <div class="cnote">Заявлено ${num(o.m3)} м³ → к отгрузке ${c.pal} поддонов = ${num(c.vol)} м³ (округление вверх до целого поддона)<br>Норма: ${c.perPal} блоков на поддон · поддон ${num(c.palVol)} м³</div></div>
  ${o.pallets.out?`<div class="card"><b style="font-size:11px">Поддоны</b>
   <div class="kv"><span>Выдано</span><b>${o.pallets.out}</b></div>
   <div class="kv"><span>Возвращено</span><b>${o.pallets.back}</b></div>
   <div class="kv"><span>У клиента</span><b style="color:${o.pallets.out-o.pallets.back?'var(--red)':'var(--green)'}">${o.pallets.out-o.pallets.back}</b></div></div>`:''}
  ${isTK&&o.st==='new'?`<div class="btn2"><button class="btn sm gr" onclick="setSt('${o.no}','ok')">✅ Подтвердить</button>
   <button class="btn sm sec" onclick="setSt('${o.no}','fix')">↩ На исправление</button></div>
   <button class="btn rd sm" style="width:100%;margin-top:7px" onclick="setSt('${o.no}','rej')">✕ Отклонить</button>`:''}
  ${isWH&&o.st==='ok'?`<button class="btn" onclick="makeTTN('${o.no}')">📄 Сформировать ТТН из заказа</button>`:''}
  <div style="margin-top:12px"><b style="font-size:11px">История заказа</b>
   <div class="tl" style="margin-top:7px">${o.hist.map(h=>`<div class="tli"><b>${h[0]}</b><p>${h[1]}${h[3]?' · '+esc(h[3]):''}</p><time>${h[2]}</time></div>`).join('')}</div></div>
  <div class="alert info"><b>Полная цепочка</b>Компания → менеджер → клиент → объект → заказ → ТТН → склад → водитель → отгрузка → доставка → поддоны. Всё в одной карточке.</div>
  <button class="btn sec" onclick="closeView()">Закрыть</button></div>`)}
function setSt(no,k){const o=ORDERS.find(x=>x.no===no);o.st=k;
 const t={ok:['Подтверждена','Заявка подтверждена. Завсклада увидит её у себя и сформирует ТТН.'],
  fix:['Возвращена на исправление','Заявка ушла обратно менеджеру с пометкой «на исправление» — он получит уведомление.'],
  rej:['Отклонена','Заявка отклонена, менеджер уведомлён.']}[k];
 o.hist.push([t[0],'ТК Газаблок · Айдана','сейчас','']);
 closeView();render();toast(`<b>${no}</b>: ${t[1]}`)}
function makeTTN(no){const o=ORDERS.find(x=>x.no===no);const c=calcOrder(o.m3,o.size);
 o.st='ttn';o.ttn='ТТН-2026-0'+(389+ORDERS.filter(x=>x.ttn).length);
 o.hist.push(['ТТН сформирована','Завсклада Нурбек','сейчас',`${o.ttn} · ${c.pal} поддонов, ${fmt(c.blocks)} блоков`]);
 closeView();render();sparks();
 toast(`<b>${o.ttn}</b> сформирована из заказа автоматически: клиент, адрес, груз, ${fmt(c.blocks)} блоков, ${c.pal} поддонов, водитель. Ничего не переписывали руками.`)}

/* ===== КАРКАС ===== */
function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([n,r],i)=>
 `<button class="role" onclick="enter('${n}')"><code>0${i+1}</code><b>${n}</b><span>${r.note}</span></button>`).join('')}
function enter(n){role=n;const r=ROLES[n];view=null;
 document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');
 document.getElementById('pav').textContent=r.av;document.getElementById('pname').textContent=r.n;document.getElementById('prole').textContent=r.r;
 const ms=document.getElementById('mrsel');ms.innerHTML=Object.keys(ROLES).map(x=>`<option ${x===n?'selected':''}>${x}</option>`).join('');ms.onchange=()=>enter(ms.value);
 tab=r.tabs[0][0];buildTabs();render();
 toast(`Роль <b>${n}</b> — так система выглядит у этого сотрудника в телефоне.`)}
function buildTabs(){const t=ROLES[role].tabs;const el=document.getElementById('tabs');
 el.style.gridTemplateColumns=`repeat(${t.length},1fr)`;
 el.innerHTML=t.map(x=>`<button class="ph-tab ${tab===x[0]?'on':''}" onclick="go('${x[0]}')"><i>${x[1]}</i>${x[2]}</button>`).join('')}
function go(t){tab=t;view=null;buildTabs();render();document.getElementById('body').scrollTop=0;
 try{const u=new URL(location.href);u.searchParams.set('s',t);history.replaceState(null,'',u.pathname+'?'+u.searchParams.toString())}catch(e){}}
function render(){document.getElementById('body').innerHTML=view||(SC[tab]?SC[tab]():'<p class="sub">Раздел в разработке.</p>');side()}
function openView(html){view=html;render();document.getElementById('body').scrollTop=0}
function closeView(){view=null;render()}
function side(){
 const L={my:['Кабинет компании-перекупа','Менеджер работает только с телефона: список своих заявок со статусами и кнопка создать новую.'],
  new:['Создание заявки','Все поля из вашего ТЗ: клиент, телефон, объект, дата, рейс, размер, м³, манипулятор, комментарий. Номер заказа присваивается сам.'],
  pal:['Поддоны компании','Сколько выдано, возвращено и осталось у клиентов — по каждому клиенту отдельно.'],
  me:['Профиль и права','Менеджер видит только свою компанию: чужие заявки, цены и склад ему недоступны.'],
  inbox:['Кабинет ТК Газаблок','Все заявки всех компаний: компания, менеджер, клиент, объект, м³, размер, поддоны, рейс и статус.'],
  reis:['Рейсы','Заявки собираются в рейсы, водитель получает свой рейс в телефон.'],
  palall:['Поддоны по сети','Долг по поддонам в разрезе компаний и клиентов.'],
  rep:['Отчёты','Любой срез выгружается в Excel: м³, блоки, рейсы, клиенты, компании, поддоны, отгрузки, период.'],
  wh:['Кабинет завсклада','Только подтверждённые заявки — ничего лишнего и никакого ручного переписывания.'],
  ttn:['ТТН из заказа','Формируется автоматически из данных заявки: груз, количество, поддоны, водитель, адрес.'],
  whpal:['Поддоны склада','Выдача под рейс и приём возврата.'],
  whist:['История изменений','Кто, когда и что изменил. Записи неудаляемые — как вы и просили.'],
  trip:['Кабинет водителя','Свой рейс: клиент, адрес, груз, количество, поддоны и контакт. Три кнопки статуса и фото.'],
  tdone:['Выполненные рейсы','История доставок водителя и его выработка.'],
  tpal:['Поддоны в рейсе','Отметка выдачи и возврата прямо на объекте.'],
  tme:['Профиль водителя','Видит только свой рейс — чужие заказы недоступны.'],
  norms:['Нормы блоков на поддон','Настраиваются администратором — от них считаются поддоны во всех заявках. Попробуйте изменить.'],
  cos:['Компании и доступы','Партнёры подключаются по одному. Первая — «Аливиа», дальше остальные.'],
  log:['Журнал действий','Полный аудит: кто что сделал и когда.']}[tab]||['',''];
 document.getElementById('sideL').innerHTML=`<div class="side-h">Что на экране</div>
  <h3>${L[0]}</h3><p>${L[1]}</p>
  <div class="side-h" style="margin-top:16px">Роль</div>
  <select class="rsel" onchange="enter(this.value)">${Object.keys(ROLES).map(n=>`<option ${n===role?'selected':''}>${n}</option>`).join('')}</select>
  <div class="tbtns"><button class="tbtn acc" id="tourBtn" onclick="tour()">▶ Сценарий</button><button class="tbtn" onclick="location.reload()">↺ Сбросить</button></div>
  <div class="box acc"><b>Это мобильный сайт</b><p>Открывается в браузере телефона, ставить приложение не нужно. Можно добавить на главный экран — будет как приложение.</p></div>`;
 document.getElementById('sideR').innerHTML=`<div class="side-h">Ключевое по ТЗ</div>
  <div class="box"><b>Автоматический расчёт</b><p>Менеджер вводит только м³ — система считает блоки, поддоны и итоговый объём по нормам администратора.</p></div>
  <div class="box"><b>ТТН без переписывания</b><p>Завсклада получает готовую ТТН из заказа. Изменил количество — предупреждение и запись в историю.</p></div>
  <div class="box"><b>Полная цепочка</b><p>Компания → менеджер → клиент → объект → заказ → ТТН → склад → водитель → отгрузка → доставка → поддоны.</p></div>
  <div class="box"><b>Поддоны</b><p>Выдано, возвращено, осталось — по клиентам и компаниям, с залогом.</p></div>
  <div class="box"><b>Отчёты в Excel</b><p>м³, блоки, рейсы, клиенты, компании, поддоны, отгрузки за любой период.</p></div>`}
let tt;function toast(h){const t=document.getElementById('toast');t.innerHTML=h;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),5000)}
function sparks(){const c=['#ea580c','#f97316','#2563eb','#16a34a','#ffffff','#f59e0b'];
 for(let i=0;i<60;i++){const s=document.createElement('i');s.className='spark';
  s.style.cssText=`left:${Math.random()*100}vw;top:-14px;background:${c[i%6]};animation-delay:${Math.random()*.45}s;transform:rotate(${Math.random()*360}deg)`;
  document.body.appendChild(s);setTimeout(()=>s.remove(),2400)}}
/* тур */
const TOUR=[
 ['Менеджер · Аливиа','new','<b>Шаг 1.</b> Менеджер «Аливиа» создаёт заявку с телефона. Вводит только м³ — блоки, поддоны и объём считаются сами по нормам ТК Газаблок.',6000],
 ['ТК Газаблок','inbox','<b>Шаг 2.</b> ТК Газаблок видит заявки всех компаний: кто, для кого, сколько кубов, какой размер и рейс. Подтверждает, отклоняет или возвращает на исправление.',6000],
 ['Завсклада','ttn','<b>Шаг 3.</b> Завсклада работает только с подтверждёнными и получает готовую ТТН из заказа — ничего не переписывает руками.',5800],
 ['Завсклада','whist','<b>Шаг 4.</b> Если склад меняет количество или размер — предупреждение и запись в историю: кто, когда и что изменил.',5600],
 ['Водитель','trip','<b>Шаг 5.</b> Водитель получает свой рейс: адрес, груз, поддоны, контакт. Отмечает «Принял → Выехал → Доставлено» и прикладывает фото.',6000],
 ['ТК Газаблок','palall','<b>Шаг 6.</b> Поддоны считаются отдельно: сколько выдано, сколько вернули, сколько осталось у клиента и компании.',5400],
 ['Администратор','norms','<b>Итог.</b> Нормы блоков на поддон настраивает администратор, а любой отчёт выгружается в Excel за нужный период.',5600]
];
let tourT=null,tourI=0;
function tour(){if(tourT){stopTour();return}tourI=0;const b=document.getElementById('tourBtn');if(b)b.textContent='■ Стоп';step()}
function step(){if(tourI>=TOUR.length){stopTour();sparks();toast('<b>Весь путь заказа</b> — от заявки в телефоне менеджера до выгрузки и возврата поддонов — работает в одной системе.');return}
 const [r,t,txt,ms]=TOUR[tourI++];
 if(role!==r)enter(r);
 setTimeout(()=>{go(t);toast(txt)},role!==r?400:0);
 tourT=setTimeout(step,ms)}
function stopTour(){clearTimeout(tourT);tourT=null;const b=document.getElementById('tourBtn');if(b)b.textContent='▶ Сценарий'}
(function(){const c=document.getElementById('clock');if(c)c.textContent=new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})})();
renderRoles();
(function(){const q=new URLSearchParams(location.search).get('s');
 if(q){for(const [n,r] of Object.entries(ROLES))if(r.tabs.some(t=>t[0]===q)){enter(n);go(q);return}}})();
