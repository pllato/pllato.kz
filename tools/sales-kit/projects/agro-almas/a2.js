
const SC={};
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
const fillBar=(v,cap,c)=>`<div class="fbar"><i style="width:${Math.min(100,v/cap*100)}%;${c?'background:'+c:''}"></i></div>`;
/* Баланс зерна за сезон: собрано − норматив подработки − отгружено − населению = должно лежать; сравниваем с замером складов */
const GRAIN_IDS=['S1','S2','S3','S4','S5'];
const harvAll=()=>FIELDS.reduce((a,f)=>a+harvT(f),0);
const storesNow=()=>GRAIN_IDS.reduce((a,k)=>a+STO(k).bal,0);
const tripsToday=()=>TRIPS.reduce((a,t)=>a+t.farm,0);
let VIL_SEASON=186;
const SHIP_BEFORE=harvAll()-Math.round(harvAll()*0.018)-VIL_SEASON-storesNow()-438-tripsToday();
function grainBal(){const H=harvAll(),norm=Math.round(H*0.018),S=SHIP_BEFORE+tripsToday(),exp=H-norm-S-VIL_SEASON,act=storesNow();return {H,norm,S,V:VIL_SEASON,exp,act,diff:act-exp}}

SC.dash=()=>{const g=grainBal(),fuel=TANKS.reduce((a,t)=>a+t.bal,0),herd=HERD.slice(0,5).reduce((a,h)=>a+h[2],0),work=MACH.filter(m=>m.st==='work').length,dl=DAILY.filter(d=>d[4]==='ok').length;
 const flax=FIELDS.filter(f=>f.c==='fl'),fp=Math.round(flax.reduce((a,f)=>a+f.ha*f.prog,0)/flax.reduce((a,f)=>a+f.ha,0));
 return `<div class="hd"><div><h2>Пульт директора · ${TODAY}, ${NOW}</h2><p>Всё хозяйство онлайн, а не в конце месяца на бумаге: сколько зерна в каждом ангаре, сколько ушло на элеватор, сколько топлива в ёмкостях и кто сколько заправил, какая техника стоит, сколько мяса пришло в магазины.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('grain')"><small>Зерно на складах</small><b>${fmt(g.act)} т</b><span>5 складов · ${fmt(STO('S7').bal)} т сена</span></div>
  <div class="clk" onclick="go('ship')"><small>Отгружено сегодня</small><b class="a">${fmt1(tripsToday())} т</b><span>${TRIPS.length} рейсов · ${TRIPS.filter(t=>t.st==='road').length} в пути</span></div>
  <div class="clk" onclick="go('fuel')"><small>ГСМ в ёмкостях</small><b>${fmt(fuel)} л</b><span>заправлено сегодня ${fmt(FILLS.reduce((a,f)=>a+f[4],0))} л</span></div>
  <div class="clk" onclick="go('herd')"><small>Поголовье КРС</small><b>${fmt(herd)}</b><span>овцы ${HERD[5][2]} · забой сегодня ${SLAUGHTER.filter(s=>s.d===TODAY.slice(0,5)).length}</span></div>
  <div class="clk" onclick="go('fields')"><small>Уборка льна</small><b class="g">${fp}%</b><span>остальное убрано · ${fmt(FIELDS.reduce((a,f)=>a+f.ha,0))} га</span></div>
  <div class="clk" onclick="go('fleet')"><small>Техника в работе</small><b>${work} из ${MACH.length}</b><span>${MACH.filter(m=>m.st==='repair').length} в ремонте</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Склады · заполнение и остаток сейчас</h3>${STORES.map(s=>`<div class="srow2 clk" onclick="go('grain')"><span><b>${s.n}</b> · ${esc(s.cr)}</span>${fillBar(s.bal,s.cap)}<em>${fmt(s.bal)} т</em></div>`).join('')}</div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="go('loss')"><i></i><div><b>Зерно: по учёту должно быть на ${fmt(-g.diff)} т больше, чем на складах</b><span>сверка сезона: собрано − отгружено − выдано − норматив подработки</span></div></div>
  <div class="rf bad" onclick="go('ship')"><i></i><div><b>Рейс Р-4420: элеватор принял на 1,22 т меньше</b><span>КамАЗ 233 ADK · Руслан Ибраев · Склад №1 → ХПП «Сарыарка»</span></div></div>
  <div class="rf bad" onclick="go('fuel')"><i></i><div><b>ГАЗель 088 BCD: расход 25,9 л/100 км при норме 16</b><span>по пробегу GPS — 34 л лишних за сутки</span></div></div>
  <div class="rf" onclick="go('fleet')"><i></i><div><b>Комбайн Acros №1 стоит: нет ремня вариатора</b><span>в дефектовке, заявка на закуп создана</span></div></div>
  <div class="rf" onclick="go('parts')"><i></i><div><b>Аккумулятор на МТЗ-1221 №4 выдан, но не отмечен как установленный</b><span>выдан 11.10 · Асхат Мусин</span></div></div>
  <div class="rf" onclick="go('daily')"><i></i><div><b>Ежедневные отчёты: сдали ${dl} из ${DAILY.length}</b><span>нет отчёта: механик, бригадир фермы №2, энергетик</span></div></div></div></div>
 <div class="g2"><div class="pan"><h3>Убойный цех → бухгалтерия → магазины, сегодня</h3>${SLST.map(x=>`<div class="kv"><span>${x[1]}</span><b>${SLAUGHTER.filter(s=>s.st===x[0]).length} · ${fmt(SLAUGHTER.filter(s=>s.st===x[0]).reduce((a,s)=>a+s.carc,0))} кг</b></div>`).join('')}<button class="bt sm" onclick="go('slaughter')">Открыть убойный цех →</button></div>
 <div class="pan"><h3>Урожай по культурам, т</h3>${bars(Object.keys(CROPS).filter(k=>k!=='par').map(k=>[CROPS[k][0],FIELDS.filter(f=>f.c===k).reduce((a,f)=>a+harvT(f),0)]))}</div></div>
 ${said('Я хотел бы это видеть в онлайне. Склад номер три — у меня там пять тысяч пшеницы, вывезли столько-то','Сейчас это приносят в конце месяца на бумаге. В системе каждая цифра появляется в момент события: взвесили рейс, заправили машину, выдали запчасть.')}`};

SC.loss=()=>{const g=grainBal();
 const fuelOver=FILLS.filter(f=>f[9]!=='ok').map(f=>{const a=parseFloat(f[7].replace(',','.')),n=parseFloat(f[8]);return [f[1],f[7],f[8],Math.round(f[4]*(a-n)/a)]});
 return `<div class="hd"><div><h2>Сверка и недостачи</h2><p>То, с чем вы столкнулись после уборки: недостача есть, а где именно — непонятно. Система каждый день сводит баланс по зерну, топливу и запчастям и показывает, на каком шаге расходится.</p></div><div class="btns"><button class="bt" onclick="act('Сверка выгружена в Excel.')">⇩ Excel</button></div></div>
 <div class="g2"><div class="pan"><h3>Зерно за сезон, т</h3>
  <div class="kv"><span>Собрано с полей (бункерный вес, по рейсам с поля)</span><b>${fmt(g.H)}</b></div>
  <div class="kv"><span>− Норматив подработки и усушки 1,8%</span><b>${fmt(g.norm)}</b></div>
  <div class="kv"><span>− Отгружено на элеваторы (вес на выезде)</span><b>${fmt(g.S)}</b></div>
  <div class="kv"><span>− Выдано населению по накладным</span><b>${fmt(g.V)}</b></div>
  <div class="kv on"><span><strong>Должно лежать на складах</strong></span><b>${fmt(g.exp)}</b></div>
  <div class="kv"><span>Лежит по замеру складов</span><b>${fmt(g.act)}</b></div>
  <div class="kv on"><span><strong>Расхождение</strong></span><b class="neg">−${fmt(Math.abs(g.diff))} т · ${fmt1(Math.abs(g.diff)/g.H*100)}%</b></div>
  <p class="hint">Где искать: по складам — Склад №1 (−236 т), Склад №3 (−202 т); по рейсам — 6 рейсов с расхождением с элеватором больше 0,5 т; по полям — 3 поля, где бункерный вес ниже урожайности соседних полей на 20%.</p></div>
 <div class="pan"><h3>Где расходится — по шагам</h3>
  <div class="fc r"><b>Поле → склад</b><span>−112 т</span><em>рейсы с поля без взвешивания на въезде: 9 за сезон</em></div>
  <div class="fc r"><b>Склад → элеватор</b><span>−164 т</span><em>разница веса на выезде и в квитанции элеватора, 38 рейсов</em></div>
  <div class="fc w"><b>Склад: хранение</b><span>−162 т</span><em>Склад №1 и №3 — после зачистки сверить с замером</em></div>
  <div class="fc g"><b>Выдача населению</b><span>0 т</span><em>все выдачи по накладным, остатки сходятся</em></div></div></div>
 <div class="g2"><div class="pan"><h3>ГСМ сегодня: перерасход против нормы по пробегу GPS</h3><div class="tw"><table class="t"><thead><tr><th>Техника</th><th>Факт</th><th>Норма</th><th>Лишние литры</th></tr></thead><tbody>${fuelOver.map(r=>`<tr class="clk" onclick="go('fuel')"><td>${esc(r[0])}</td><td class="mono">${r[1]}</td><td class="mono">${r[2]}</td><td class="mono neg">${r[3]} л</td></tr>`).join('')}</tbody></table></div><p class="hint">За октябрь: перерасход 1 840 л ≈ ${tg(1840*318)} по цене ДТ.</p></div>
 <div class="pan"><h3>Запчасти: выдано ↔ установлено</h3>
  <div class="kv"><span>Выдано со склада в октябре</span><b>146 позиций</b></div><div class="kv"><span>Отмечено «установлено» с фото</span><b>138</b></div>
  <div class="kv on"><span><strong>Выдано, но не установлено</strong></span><b class="neg">8 позиций · ${tg(312400)}</b></div>
  <div class="kv"><span>Списано в 1С автоматически</span><b>138 · без ручного «крыжения»</b></div>
  <button class="bt sm" onclick="go('parts')">Открыть выдачи →</button></div></div>
 ${said('Столкнулись после уборки с определённым количеством недостачи. Это как раз упущения того, что нету должного контроля — за дизелем, за запчастями, за складом')}`};

/* Карта полей */
let mapCrop='';
function vtx(c,r){const W=640,H=420,x0=20,y0=20,dx=(W-40)/6,dy=(H-40)/4;const inner=c>0&&c<6&&r>0&&r<4;const jx=inner?(((c*53+r*31)%23)-11)*2.4:0,jy=inner?(((c*29+r*47)%19)-9)*2.2:0;return [x0+c*dx+jx,y0+r*dy+jy]}
function fieldMap(sel){return `<svg class="fmap" viewBox="0 0 640 420" role="img" aria-label="Карта полей">
 <rect x="0" y="0" width="640" height="420" fill="var(--mapbg)"/>
 <path d="M0 214 C120 196 180 240 300 222 S520 190 640 206" stroke="#8fb4d6" stroke-width="7" fill="none" opacity=".55"/>
 ${FIELDS.map((f,i)=>{const c=i%6,r=Math.floor(i/6),p=[vtx(c,r),vtx(c+1,r),vtx(c+1,r+1),vtx(c,r+1)];const cx=p.reduce((a,v)=>a+v[0],0)/4,cy=p.reduce((a,v)=>a+v[1],0)/4;const dim=mapCrop&&mapCrop!==f.c;
  return `<g class="fp${sel===f.id?' on':''}" onclick="card('field','${f.id}')" style="opacity:${dim?.25:1}"><polygon points="${p.map(v=>v.join(',')).join(' ')}" fill="${CROPS[f.c][1]}"/>${f.st==='harv'?`<polygon points="${p.map(v=>v.join(',')).join(' ')}" fill="url(#hatch)"/>`:''}<text x="${cx}" y="${cy-3}" class="fpl">${f.id}</text><text x="${cx}" y="${cy+11}" class="fps">${fmt(f.ha)} га</text></g>`}).join('')}
 <defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="8" fill="rgba(255,255,255,.45)"/></pattern></defs>
 <g class="poi"><rect x="296" y="200" width="46" height="26" rx="4"/><text x="319" y="217">База</text></g>
</svg>`}
SC.fields=()=>{const tot=FIELDS.reduce((a,f)=>a+f.ha,0);
 return `<div class="hd"><div><h2>Карта полей · ${fmt(tot)} га · ${FIELDS.length} полей</h2><p>Каждое поле — клетка со своей историей: что посеяно, когда была химобработка, когда вносили удобрения, когда приезжал агроном и сколько собрали. Нажмите на поле.</p></div><div class="btns"><button class="bt" onclick="act('Контуры полей загружаются из файла KML / Shape — тех, что у вас уже есть в агросервисе или у кадастра.')">⇧ Загрузить контуры</button></div></div>
 <div class="seg"><a class="${!mapCrop?'on':''}" onclick="mapCrop='';render()">Все</a>${Object.keys(CROPS).map(k=>`<a class="${mapCrop===k?'on':''}" onclick="mapCrop='${k}';render()"><i class="dot" style="background:${CROPS[k][1]}"></i>${CROPS[k][0]}</a>`).join('')}</div>
 <div class="g2 g21"><div class="pan">${fieldMap(curField)}<div class="lg3">${Object.keys(CROPS).map(k=>`<span><i style="background:${CROPS[k][1]}"></i>${CROPS[k][0]} · ${fmt(FIELDS.filter(f=>f.c===k).reduce((a,f)=>a+f.ha,0))} га</span>`).join('')}<span><i class="hz"></i>уборка идёт</span></div></div>
 <div class="pan"><h3>Поля${mapCrop?' · '+CROPS[mapCrop][0]:''}</h3><div class="tw"><table class="t"><thead><tr><th>Поле</th><th>Га</th><th>Культура</th><th>Ц/га</th><th>Агроном был</th></tr></thead><tbody>${FIELDS.filter(f=>!mapCrop||f.c===mapCrop).map(f=>`<tr class="clk" onclick="card('field','${f.id}')"><td><b>${f.id}</b> ${esc(f.n)}</td><td class="mono">${fmt(f.ha)}</td><td><i class="dot" style="background:${CROPS[f.c][1]}"></i>${CROPS[f.c][0]}${f.st==='harv'?' · '+f.prog+'%':''}</td><td class="mono">${f.y?fmt1(f.y):'—'}</td><td class="mono">${f.visit}</td></tr>`).join('')}</tbody></table></div></div></div>
 ${said('Мне нужно, чтобы у меня агроном — ему вручается планшет — я знаю, когда он посещал ту или иную клетку, когда в той клетке происходила химобработка, когда мы вносили удобрение','Карту полей не надо рисовать заново: контуры загружаются из файлов, которые у вас уже есть.')}`};

/* Агрооперации */
let opF='';
SC.agro=()=>{const all=[];FIELDS.forEach(f=>OPS[f.id].forEach(o=>all.push([f,...o])));
 const L=all.filter(r=>!opF||r[2]===opF).sort((a,b)=>{const d=s=>{const [dd,mm]=s.split('.');return +mm*100+ +dd};return d(b[1])-d(a[1])}).slice(0,22);
 const types=['Визит агронома','Уборка','Уборка идёт','Гербицид','Фунгицид','Посев','Удобрение'];
 return `<div class="hd"><div><h2>Агрооперации и агроном</h2><p>Агроном вносит операцию с планшета прямо в поле: тип, препарат и норма, техника, фото. Планшет ставит отметку места — видно, что он действительно был на этом поле. Каждая операция сразу попадает в историю поля.</p></div><div class="btns"><button class="bt p" onclick="card('op','${curField}')">+ Операция</button></div></div>
 <div class="wid"><div><small>Визитов агронома за неделю</small><b>31</b><span>все поля, кроме П-11 и П-23 (пар)</span></div><div><small>Обработано гербицидом</small><b>${fmt(FIELDS.filter(f=>f.c!=='par').reduce((a,f)=>a+f.ha,0))} га</b><span>расход препарата сходится со складом</span></div><div><small>Операций без отметки трактора на поле</small><b class="w">${FIELDS.filter((f,i)=>i%7===3&&f.c!=='par').length}</b><span>проверить — обработано ли поле</span></div></div>
 <div class="seg"><a class="${!opF?'on':''}" onclick="opF='';render()">Все</a>${types.map(t=>`<a class="${opF===t?'on':''}" onclick="opF='${t}';render()">${t}</a>`).join('')}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Дата</th><th>Поле</th><th>Операция</th><th>Что и норма</th><th>Техника</th><th>Агроном</th><th>Место</th></tr></thead><tbody>${L.map(r=>`<tr class="clk" onclick="card('field','${r[0].id}')"><td class="mono">${r[1]}</td><td><b>${r[0].id}</b></td><td>${r[2]}</td><td>${esc(r[3])}</td><td>${esc(r[4])}</td><td>${r[5]}</td><td>${r[6]==='gps'?tag('в поле ✓','g'):tag('нет отметки','w')}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Я знаю, когда он посещал ту или иную клетку')}`};

/* Склады зерна */
SC.grain=()=>`<div class="hd"><div><h2>Зерно, ангары и сеновал</h2><p>Остаток каждого склада в реальном времени: приход с полей по весовой, расход по рейсам на элеватор и накладным населению. Склад добавляется кнопкой — с типом, вместимостью и культурой.</p></div><div class="btns"><button class="bt" onclick="card('newstore')">+ Склад</button><button class="bt p" onclick="card('trip')">+ Рейс на элеватор</button></div></div>
 <div class="stg2">${STORES.map(s=>`<div class="sto"><div class="sto-h"><b>${s.n}</b><span>${s.t}</span></div><div class="sto-c">${esc(s.cr)}</div><div class="sto-v">${fmt(s.bal)} <small>т из ${fmt(s.cap)}</small></div>${fillBar(s.bal,s.cap)}<div class="sto-m"><span>сегодня приход <b class="pos">+${fmt1(s.inT)}</b></span><span>расход <b class="neg">−${fmt1(s.outT)}</b></span>${s.moist?`<span>влажность ${fmt1(s.moist)}%</span>`:''}</div></div>`).join('')}</div>
 <div class="pan"><h3>Движение сегодня</h3><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Документ</th><th>Склад</th><th>Откуда / куда</th><th>Тонн</th></tr></thead><tbody>
 ${TRIPS.map(t=>`<tr><td class="mono">${t.t}</td><td>Рейс ${t.n}</td><td>${STO(t.s).n}</td><td>→ ${ELEV[t.e]}</td><td class="mono neg">−${fmt1(t.farm)}</td></tr>`).join('')}
 <tr><td class="mono">14:10</td><td>С поля П-16</td><td>Склад №2</td><td>← Комбайн Acros №2, 6 бункеров</td><td class="mono pos">+146</td></tr>
 <tr><td class="mono">10:15</td><td>Накладная Н-2231</td><td>Склад №6</td><td>→ население, Сейтказы Б.</td><td class="mono neg">−0,4</td></tr></tbody></table></div></div>
 ${said('У нас есть склады, где мы храним свою продукцию, есть сеновал, где хранится готовый объём сена. У меня есть остатки, что сейчас там хранится')}`;

/* Отгрузка на элеваторы */
SC.ship=()=>{const ok=TRIPS.filter(t=>t.elev!=null);
 return `<div class="hd"><div><h2>Отгрузка на элеваторы</h2><p>Каждый рейс взвешивается на выезде: весовщица вносит вес в планшет, машина и водитель выбираются из списка. Элеватор присылает квитанцию — её вес вносится в тот же рейс, и разница видна сразу, а не через месяц.</p></div><div class="btns"><button class="bt p" onclick="card('trip')">+ Рейс</button></div></div>
 <div class="wid"><div><small>Рейсов сегодня</small><b>${TRIPS.length}</b><span>${TRIPS.filter(t=>t.st==='road').length} в пути</span></div><div><small>Отгружено сегодня</small><b class="a">${fmt1(tripsToday())} т</b><span>по весу на выезде</span></div><div><small>Принято элеваторами</small><b>${fmt1(ok.reduce((a,t)=>a+t.elev,0))} т</b><span>из ${fmt1(ok.reduce((a,t)=>a+t.farm,0))} т отправленных</span></div><div><small>Расхождение</small><b class="w">${fmt1(ok.reduce((a,t)=>a+t.elev-t.farm,0))} т</b><span>норма — до 0,3% на рейс</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Рейс</th><th>Выезд</th><th>Машина и водитель</th><th>Склад → элеватор</th><th>Наш вес</th><th>Элеватор</th><th>Разница</th><th></th></tr></thead><tbody>${TRIPS.map(t=>{const d=t.elev==null?null:t.elev-t.farm;return `<tr class="${t.st==='diff'?'rowbad':''}"><td><b>${t.n}</b></td><td class="mono">${t.t}</td><td>${esc(t.tr)}<br><small>${esc(t.drv)}</small></td><td>${STO(t.s).n} → ${ELEV[t.e]}</td><td class="mono">${fmt1(t.farm)} т</td><td class="mono">${t.elev==null?'—':fmt1(t.elev)+' т'}</td><td class="mono ${d!=null&&d<-0.3?'neg':''}">${d==null?'—':fmt1(d)}</td><td>${t.st==='road'?`<button class="bt sm" onclick="card('elev','${t.n}')">Квитанция</button>`:tag(TST[t.st][0],TST[t.st][1])}</td></tr>`}).join('')}</tbody></table></div></div>
 ${said('Мне несут выписки — в день столько-то КамАЗов загрузилось, 500 тонн ушло на элеватор. Я это вижу, либо мне скидывают в WhatsApp, но не в онлайн-режиме')}`};

/* Выдача населению */
SC.village=()=>`<div class="hd"><div><h2>Выдача населению</h2><p>Жители села получают корма, зерно и зерноотходы. Каждая выдача — накладная из планшета: кто, что, сколько, на каком основании. В счёт зарплаты — удержание уходит в расчёт зарплаты автоматически.</p></div><div class="btns"><button class="bt p" onclick="card('vissue')">+ Выдача</button></div></div>
 <div class="wid"><div><small>Выдано в октябре</small><b>38,6 т</b><span>146 накладных</span></div><div><small>В счёт зарплаты</small><b>21,2 т</b><span>${tg(1272000)} — удержано в расчёте</span></div><div><small>За наличные</small><b>${tg(486000)}</b><span>сдано в кассу</span></div><div><small>Льгота пенсионерам</small><b>4,1 т</b><span>лимит 300 кг на двор в месяц</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Когда</th><th>Житель</th><th>Что</th><th>Сколько</th><th>Основание</th><th>Накладная</th><th>Выдал</th></tr></thead><tbody>${VIL.map(v=>`<tr><td class="mono">${v[0]}</td><td>${esc(v[1])}<br><small>${esc(v[2])}</small></td><td>${v[3]}</td><td class="mono">${fmt(v[4])} ${v[5]}</td><td>${tag(v[6],v[6]==='льгота'?'i':v[6]==='за наличные'?'g':'w')}</td><td class="mono">${v[7]}</td><td>${v[8]}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Порядка восьмисот человек здесь живёт, мы градообразующая компания. Обеспечиваем их кормами, зерном, зерноотходами. Бухгалтерия выписывает накладные')}`;
