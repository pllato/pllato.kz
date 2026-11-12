/* ДАЛА ТРЕЙД — дистрибуция продуктов, 3 склада (Рахат). Демо на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const TODAY='12.11.2026',NOW='09:40';
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const bar=(w,c)=>`<div class="bar"><i class="${c||''}" style="--w:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const said=(q,a)=>`<div class="said"><b>Из встречи</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const SEC=[
 {k:'sum',n:'Пульт',sub:[['dash','Пульт учредителя'],['flow','Как работает сборка']]},
 {k:'ops',n:'Сборка',sub:[['queue','Накладные из 1С'],['pick','Сборка по накладной'],['tsd','Телефон кладовщика'],['pallets','Паллеты и отгрузка']]},
 {k:'wh',n:'Склад',sub:[['map','Карта склада и ячейки'],['inb','Приходы'],['moves','Перемещения'],['stock','Остатки по 3 складам']]},
 {k:'ctrl',n:'Контроль',sub:[['rev','Ревизия и инвентаризация'],['errs','Пересорты и расхождения'],['sku','Товары и штрихкоды']]},
 {k:'link',n:'1С и отчёты',sub:[['onec','Обмен с 1С'],['reports','Отчёты']]},
 {k:'go',n:'Запуск',sub:[['pilot','Пилот → 3 склада'],['roles','Роли и права'],['launch','Стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Учредитель':{av:'РМ',n:'Рахат',note:'Всё: пульт, остатки, ревизия, пересорты, отчёты, 1С',s:ALL.slice()},
 'Бухгалтер':{av:'БХ',n:'Гульнара · бухгалтер',note:'Остатки, ревизия, расхождения, обмен с 1С, отчёты',s:['dash','stock','rev','errs','sku','onec','reports']},
 'Старший склада':{av:'СС',n:'Ерлан · старший склада, Петропавловск',note:'Накладные, сборка, паллеты, приходы, ячейки. Остатки и ревизию не видит',s:['queue','pick','tsd','pallets','map','inb','moves','errs','sku']},
 'Кладовщик':{av:'КЛ',n:'Данияр · сборщик',note:'Только сборка со сканером на телефоне',s:['tsd','pick']}
};
let role='Учредитель',cur='dash';
const WH=[{id:'P',n:'Петропавловск',st:'пилот',c:'#f2c230'},{id:'A',n:'Астана',st:'этап 2',c:'#5c87b2'},{id:'K',n:'Кокшетау',st:'этап 2',c:'#8a9097'}];
/* товары: похожие пары помечены pair */
const SKU=[
 {id:'S1',n:'Салфетки «Мягкий дом» 80 шт, кухонные',bc:'4870001001018',cell:'A-02-1',pr:690,pair:'S2',q:{P:340,A:210,K:96}},
 {id:'S2',n:'Салфетки «Мягкий дом» 80 шт, детские',bc:'4870001001025',cell:'C-07-2',pr:740,pair:'S1',q:{P:180,A:150,K:64}},
 {id:'S3',n:'Приправа «Дастархан» для плова, 30 г',bc:'4870002200310',cell:'B-04-1',pr:320,pair:'S4',q:{P:620,A:400,K:210}},
 {id:'S4',n:'Приправа «Дастархан» для мяса, 30 г',bc:'4870002200327',cell:'D-11-3',pr:320,pair:'S3',q:{P:540,A:380,K:190}},
 {id:'S5',n:'Приправа универсальная, 75 г',bc:'4870002200501',cell:'B-04-2',pr:450,q:{P:410,A:260,K:120}},
 {id:'S6',n:'Чай чёрный «Алтын», 100 пак.',bc:'4870003100100',cell:'A-05-1',pr:1450,pair:'S7',q:{P:260,A:300,K:110}},
 {id:'S7',n:'Чай чёрный «Алтын», 25 пак.',bc:'4870003100025',cell:'C-02-1',pr:430,pair:'S6',q:{P:390,A:270,K:150}},
 {id:'S8',n:'Макароны «Дала» спагетти, 400 г',bc:'4870004400401',cell:'A-09-2',pr:380,pair:'S9',q:{P:720,A:650,K:300}},
 {id:'S9',n:'Макароны «Дала» рожки, 400 г',bc:'4870004400418',cell:'D-03-2',pr:380,pair:'S8',q:{P:690,A:610,K:280}},
 {id:'S10',n:'Масло подсолнечное, 1 л',bc:'4870005501001',cell:'E-01-1',pr:890,pair:'S11',q:{P:480,A:520,K:230}},
 {id:'S11',n:'Масло подсолнечное, 5 л',bc:'4870005505004',cell:'F-06-1',pr:4100,pair:'S10',q:{P:120,A:140,K:60}},
 {id:'S12',n:'Соль йодированная, 1 кг',bc:'4870006600011',cell:'E-04-3',pr:190,q:{P:900,A:700,K:340}},
 {id:'S13',n:'Сахар-песок, 1 кг',bc:'4870006600028',cell:'E-05-1',pr:520,q:{P:850,A:780,K:410}},
 {id:'S14',n:'Мука высший сорт, 2 кг',bc:'4870006600035',cell:'F-02-2',pr:780,q:{P:430,A:390,K:180}},
 {id:'S15',n:'Кетчуп «Томатный», 350 г',bc:'4870007700350',cell:'B-08-1',pr:560,pair:'S16',q:{P:310,A:290,K:120}},
 {id:'S16',n:'Кетчуп «Шашлычный», 350 г',bc:'4870007700367',cell:'D-08-3',pr:560,pair:'S15',q:{P:280,A:240,K:100}}
];
const SK=id=>SKU.find(s=>s.id===id);
/* накладные из 1С (пришли от Advance Agent) */
let INV=[
 {id:'РН-48211',sh:'Магазин «Береке», ул. Жамбыла 12',ag:'Нурлан',t:'08:12',wh:'P',st:'new',lines:[['S1',12],['S3',30],['S6',6],['S8',24],['S10',12],['S15',10]]},
 {id:'РН-48212',sh:'Минимаркет «Арман», ул. Абая 40',ag:'Нурлан',t:'08:20',wh:'P',st:'new',lines:[['S2',8],['S4',20],['S7',10],['S9',20],['S12',15]]},
 {id:'РН-48213',sh:'Супермаркет «Нур», пр. Назарбаева 77',ag:'Айгерим',t:'08:31',wh:'P',st:'picking',lines:[['S5',18],['S11',6],['S13',30],['S14',12],['S16',8]]},
 {id:'РН-48205',sh:'Магазин «Алтын», ул. Букетова 3',ag:'Айгерим',t:'07:55',wh:'P',st:'done',lines:[['S1',6],['S6',4],['S12',10]]},
 {id:'РН-48199',sh:'Магазин «Достык», ул. Конституции 9',ag:'Нурлан',t:'вчера',wh:'P',st:'shipped',lines:[['S3',20],['S8',12]]},
 {id:'РН-37740',sh:'Магазин «Самал», Астана, ул. Кенесары 5',ag:'Марат',t:'08:44',wh:'A',st:'new',lines:[['S6',10],['S10',20]]}
];
const IV=id=>INV.find(x=>x.id===id);
const ST={new:['новая','i'],picking:['в сборке','w'],done:['собрана','g'],shipped:['отгружена','']};
/* состояние сборки: сколько отсканировано по строке */
let PICK={id:'РН-48211',got:{}};
let ERRS=[
 {d:'11.11 16:20',inv:'РН-48190',who:'Данияр',want:'S1',took:'S2',wh:'P',res:'остановлено сканером'},
 {d:'11.11 11:05',inv:'РН-48174',who:'Асель',want:'S8',took:'S9',wh:'P',res:'остановлено сканером'},
 {d:'10.11 15:40',inv:'РН-48151',who:'Данияр',want:'S3',took:'S4',wh:'P',res:'остановлено сканером'},
 {d:'09.11 10:12',inv:'РН-48120',who:'Ерлан',want:'S15',took:'S16',wh:'P',res:'остановлено сканером'}
];
let REV=[
 {d:'31.10',k:'месячная',wh:'P',pos:312,diff:7,sum:-18400,who:'Ерлан, Гульнара'},
 {d:'05.11',k:'выборочная · приправы',wh:'P',pos:40,diff:2,sum:-1280,who:'Ерлан'},
 {d:'10.11',k:'выборочная · салфетки',wh:'P',pos:6,diff:0,sum:0,who:'Ерлан'}
];
let REVRUN=null;
const PAL=[{inv:'РН-48205',sh:'Магазин «Алтын»',drv:'Серик (своя машина)',box:3,st:'на рампе'},{inv:'РН-48199',sh:'Магазин «Достык»',drv:'Арман (наёмный)',box:2,st:'уехал 08:10'}];
let INB=[{id:'ПР-2210',sup:'Производство, Алматы',d:'11.11',lines:[['S3',600],['S4',500],['S5',300]],st:'принят'},{id:'ПР-2211',sup:'ТОО «Север Опт»',d:'12.11',lines:[['S1',200],['S2',120],['S12',400]],st:'ждёт приёмки'}];
let MOV=[{id:'ПМ-118',from:'P',to:'K',d:'11.11',lines:[['S8',120],['S9',100]],st:'в пути'},{id:'ПМ-117',from:'A',to:'P',d:'08.11',lines:[['S11',40]],st:'принят'}];
const SC={};
const whN=id=>WH.find(w=>w.id===id).n;
const totQ=s=>s.q.P+s.q.A+s.q.K;
SC.dash=()=>{const nw=INV.filter(i=>i.st==='new').length,pk=INV.filter(i=>i.st==='picking').length,dn=INV.filter(i=>i.st==='done'||i.st==='shipped').length;const val=SKU.reduce((a,s)=>a+totQ(s)*s.pr,0);
return `<div class="hd"><div><h2>Пульт учредителя · ${TODAY}, ${NOW}</h2><p>Три склада на одном экране: накладные из 1С, сборки, пойманные пересорты, остатки и последняя ревизия. Видят только учредитель и бухгалтер.</p></div><div class="btns"><button class="bt" onclick="xls()">Excel</button><button class="bt p" onclick="go('pick')">Открыть сборку</button></div></div>
<div class="strip"><div><small>Накладные сегодня</small><b>${INV.length}</b><span>новых ${nw} · в сборке ${pk} · собрано ${dn}</span></div><div><small>Пересорт пойман</small><b class="ok">${ERRS.length}</b><span>за неделю · до полки не дошёл</span></div><div><small>Ушло с пересортом</small><b class="ok">0</b><span>с начала пилота</span></div><div><small>Товар на складах</small><b>${tg(val)}</b><span>${SKU.length} позиций в демо · 3 склада</span></div><div><small>Ревизия 31.10</small><b class="bad">${tg(REV[0].sum)}</b><span>${REV[0].diff} расхождений из ${REV[0].pos}</span></div></div>
<div class="g21"><div>
 <div class="pan"><h3>Склады</h3><div class="tw"><table class="t"><thead><tr><th>Склад</th><th>Этап</th><th class="r">Накладных</th><th class="r">Собрано</th><th class="r">Пересорт пойман</th><th class="r">Товар, ₸</th></tr></thead><tbody>${WH.map(w=>{const iv=INV.filter(i=>i.wh===w.id);return `<tr onclick="go('stock')"><td><i class="tm" style="background:${w.c}"></i><b>${w.n}</b></td><td>${tag(w.st,w.id==='P'?'g':'')}</td><td class="r">${iv.length}</td><td class="r">${iv.filter(i=>i.st==='done'||i.st==='shipped').length}</td><td class="r">${ERRS.filter(e=>e.wh===w.id).length}</td><td class="r">${tg(SKU.reduce((a,s)=>a+s.q[w.id]*s.pr,0))}</td></tr>`}).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Последние пойманные пересорты</h3><div class="tw"><table class="t sm"><thead><tr><th>Когда</th><th>Накладная</th><th>Нужно</th><th>Пытались положить</th><th>Кто</th></tr></thead><tbody>${ERRS.slice(0,4).map(e=>`<tr onclick="go('errs')"><td>${e.d}</td><td class="mono">${e.inv}</td><td>${esc(SK(e.want).n)}</td><td class="bad">${esc(SK(e.took).n)}</td><td>${e.who}</td></tr>`).join('')}</tbody></table></div></div>
</div><div>
 <div class="pan"><h3>Требует внимания</h3><div class="alist">
  <a onclick="go('queue')"><i class="dt w"></i><b>${nw} новые накладные ждут сборки</b><span>пришли из 1С от торговых · Петропавловск</span></a>
  <a onclick="go('inb')"><i class="dt i"></i><b>Приход ПР-2211 ждёт приёмки</b><span>салфетки и соль · ТОО «Север Опт»</span></a>
  <a onclick="go('rev')"><i class="dt r"></i><b>Ревизия октября: −18 400 ₸</b><span>7 позиций · 5 из них приправы</span></a>
  <a onclick="go('sku')"><i class="dt w"></i><b>8 пар похожих товаров</b><span>разнесены по разным рядам</span></a>
 </div></div>
 ${said('«Склад путает салфетки восьмидесятиштучные для кухни и детские. Хотелось бы, чтобы он по штрихкодам пропикивал и видел, что не то положил.»','Сборка идёт только по накладной из 1С. Чужой штрихкод — красный экран, позиция не засчитывается.')}
</div></div>`};
SC.flow=()=>`<div class="hd"><div><h2>Как работает сборка</h2><p>Advance Agent и 1С остаются как есть. Портал берёт накладную из 1С и ведёт склад.</p></div></div>
<div class="stps">${['Торговый в Advance Agent','Заявка падает в 1С','Накладная приходит в портал','Сборщик пикает каждую позицию','Паллета по магазину','Отгрузка, остаток в 1С'].map((x,i)=>`<div class="done"><b>${i+1}</b><br>${x}</div>`).join('')}</div>
<div class="g2"><div class="pan"><h3>Что меняется для склада</h3><div class="kv"><span>Сейчас</span><b>печатают накладную, собирают по бумаге</b></div><div class="kv"><span>Будет</span><b>номер накладной → список на телефоне → сканер</b></div><div class="kv"><span>Не тот товар</span><b class="bad">сканер не пропускает</b></div><div class="kv"><span>Не хватает</span><b>видно сразу, недовложение фиксируется</b></div><div class="kv"><span>Конец месяца</span><b>факт против учёта по каждой ячейке</b></div></div>
<div class="pan"><h3>Что не трогаем</h3><div class="kv"><span>Advance Agent у торговых</span><b>остаётся</b></div><div class="kv"><span>Обе базы 1С</span><b>остаются, обмен в обе стороны</b></div><div class="kv"><span>Водители и маршруты</span><b>как сейчас</b></div><div class="kv"><span>Заказы магазинов сами</span><b>не делаем</b></div></div></div>
${said('«У меня на 1С стоит программа, которая позволяет торговым агентам выгружать заявки. Оно будет мешать вашей интеграции?»','Подключаемся к 1С по стандартному протоколу OData. Приложение торговых не меняется.')}`;
SC.queue=()=>`<div class="hd"><div><h2>Накладные из 1С</h2><p>Заявка торгового из Advance Agent → 1С → портал за 1–2 минуты. Печатать не нужно: сборщик открывает её на телефоне.</p></div><div class="btns"><button class="bt" onclick="syncNow()">Обновить из 1С</button></div></div>
<div class="tw"><table class="t"><thead><tr><th>Накладная</th><th>Магазин</th><th>Торговый</th><th>Время</th><th>Склад</th><th class="r">Позиций</th><th class="r">Сумма</th><th>Статус</th><th></th></tr></thead><tbody>${INV.map(i=>`<tr><td class="mono"><b>${i.id}</b></td><td>${esc(i.sh)}</td><td>${i.ag}</td><td>${i.t}</td><td>${whN(i.wh)}</td><td class="r">${i.lines.length}</td><td class="r">${tg(i.lines.reduce((a,l)=>a+SK(l[0]).pr*l[1],0))}</td><td>${tag(ST[i.st][0],ST[i.st][1])}</td><td>${i.st==='new'||i.st==='picking'?`<button class="bt sm p" onclick="startPick('${i.id}')">Собрать</button>`:`<button class="bt sm" onclick="openInv('${i.id}')">Открыть</button>`}</td></tr>`).join('')}</tbody></table></div>`;
function syncNow(){if(!INV.find(i=>i.id==='РН-48214'))INV.unshift({id:'РН-48214',sh:'Магазин «Жулдыз», ул. Ауэзова 18',ag:'Нурлан',t:NOW,wh:'P',st:'new',lines:[['S1',10],['S16',6],['S13',20]]});render();toast('Из 1С пришла накладная <b>РН-48214</b> — Нурлан, магазин «Жулдыз».')}
function openInv(id){const i=IV(id);openM('Накладная '+id,esc(i.sh)+' · '+i.ag+' · '+whN(i.wh),`<table class="t sm"><thead><tr><th>Товар</th><th>Ячейка</th><th class="r">Кол-во</th><th class="r">Сумма</th></tr></thead><tbody>${i.lines.map(l=>`<tr><td>${esc(SK(l[0]).n)}</td><td class="mono">${SK(l[0]).cell}</td><td class="r">${l[1]}</td><td class="r">${tg(SK(l[0]).pr*l[1])}</td></tr>`).join('')}</tbody></table>`)}
function startPick(id){PICK={id,got:{},last:null};const i=IV(id);if(i.st==='new')i.st='picking';go('pick')}
const pickInv=()=>IV(PICK.id)||INV[0];
function pickDone(){const i=pickInv();return i.lines.every(l=>(PICK.got[l[0]]||0)>=l[1])}
function pickScan(sid,wrong){const i=pickInv();const line=i.lines.find(l=>l[0]===sid);
 if(wrong){const s=SK(sid);const t=SK(s.pair);PICK.last={ok:false,msg:`Нет в накладной: <b>${esc(t.n)}</b> вместо «${esc(s.n)}»`};ERRS.unshift({d:'12.11 '+NOW,inv:i.id,who:'Данияр',want:sid,took:s.pair,wh:i.wh,res:'остановлено сканером'});render();toast('Пересорт остановлен. Положите товар обратно в ячейку '+t.cell+'.');return}
 const g=PICK.got[sid]||0;if(g>=line[1]){PICK.last={ok:false,msg:`Лишнее: «${esc(SK(sid).n)}» уже собрано ${line[1]} шт.`};render();return}
 PICK.got[sid]=line[1];PICK.last={ok:true,msg:`Совпало: «${esc(SK(sid).n)}» × ${line[1]}`};render()}
function pickCode(){const v=(document.getElementById('bcin')||{}).value||'';const s=SKU.find(x=>x.bc===v.trim());const i=pickInv();if(!s){PICK.last={ok:false,msg:'Штрихкод не найден в справочнике'};render();return}
 if(i.lines.find(l=>l[0]===s.id)){pickScan(s.id,false)}else{PICK.last={ok:false,msg:`Нет в накладной: <b>${esc(s.n)}</b>`};ERRS.unshift({d:'12.11 '+NOW,inv:i.id,who:'Данияр',want:(s.pair&&i.lines.find(l=>l[0]===s.pair))?s.pair:i.lines[0][0],took:s.id,wh:i.wh,res:'остановлено сканером'});render()}}
function pickClose(){const i=pickInv();if(!pickDone()){toast('Не все позиции собраны. Недовложение отметит старший склада.');return}i.st='done';PAL.unshift({inv:i.id,sh:i.sh.split(',')[0],drv:'назначить',box:Math.ceil(i.lines.length/3),st:'на рампе'});i.lines.forEach(l=>SK(l[0]).q[i.wh]-=l[1]);toast('Накладная <b>'+i.id+'</b> собрана без пересорта. Паллета на рампе, остаток ушёл в 1С.');go('pallets')}
SC.pick=()=>{const i=pickInv();const done=i.lines.filter(l=>(PICK.got[l[0]]||0)>=l[1]).length;const L=PICK.last;
return `<div class="hd"><div><h2>Сборка по накладной ${i.id}</h2><p>${esc(i.sh)} · торговый ${i.ag} · ${whN(i.wh)}. Каждую позицию пропикайте сканером. Кнопка «похожий» показывает, что будет, если сборщик ошибётся.</p></div><div class="btns"><select class="sel" onchange="startPick(this.value)">${INV.filter(x=>x.st!=='shipped').map(x=>`<option ${x.id===i.id?'selected':''}>${x.id}</option>`).join('')}</select></div></div>
<div class="pan"><div class="scan"><i>|||| ||| |||| |</i><b>Сканер или ввод штрихкода</b><input id="bcin" class="fld" style="max-width:260px;margin:6px auto 0;display:block" placeholder="например 4870001001025" onkeydown="if(event.key==='Enter')pickCode()"></div>
${L?`<div class="alert" style="border-left:4px solid var(--${L.ok?'ok':'bad'});background:var(--${L.ok?'ok':'bad'}-l);padding:10px 12px;margin-bottom:10px"><b>${L.ok?'Совпало':'Стоп — пересорт'}</b><br>${L.msg}</div>`:''}
${bar(pct(done,i.lines.length),done===i.lines.length?'g':'w')}<small class="mini">Собрано ${done} из ${i.lines.length} позиций</small>
<div class="tw"><table class="t"><thead><tr><th>Товар</th><th>Ячейка</th><th>Штрихкод</th><th class="r">Нужно</th><th class="r">Собрано</th><th></th></tr></thead><tbody>${i.lines.map(l=>{const s=SK(l[0]);const g=PICK.got[l[0]]||0;return `<tr><td><b>${esc(s.n)}</b>${s.pair?`<br><small class="mini">похожий: ${esc(SK(s.pair).n)}</small>`:''}</td><td class="mono">${s.cell}</td><td class="mono">${s.bc}</td><td class="r">${l[1]}</td><td class="r ${g>=l[1]?'ok':''}">${g}</td><td>${g>=l[1]?tag('готово','g'):`<button class="bt sm p" onclick="pickScan('${l[0]}',false)">Пикнуть</button>${s.pair?` <button class="bt sm" onclick="pickScan('${l[0]}',true)">Пикнуть похожий</button>`:''}`}</td></tr>`}).join('')}</tbody></table></div>
<div class="btns l" style="margin-top:10px"><button class="bt p" onclick="pickClose()">Закрыть сборку</button></div></div>
${said('«Пытается положить что-то другое — она не проходит, потому что её нет в накладной. Вот такая система мне нужна.»')}`};
SC.tsd=()=>{const i=pickInv();const nx=i.lines.find(l=>(PICK.got[l[0]]||0)<l[1]);const L=PICK.last;
return `<div class="hd"><div><h2>Телефон кладовщика</h2><p>Сборщик работает с телефона или терминала со сканером. Видит только свою накладную и следующую ячейку.</p></div></div>
<div class="phw"><div class="phone3"><div class="phs"><div class="phtop"><b>${i.id}</b><span>${esc(i.sh.split(',')[0])}<br>${whN(i.wh)}</span></div>
${L?`<div style="padding:8px;border-radius:6px;margin-bottom:8px;background:var(--${L.ok?'ok':'bad'}-l);color:var(--${L.ok?'ok':'bad'});font-size:12px"><b>${L.ok?'Совпало':'Стоп'}</b> · ${L.msg}</div>`:''}
${nx?`<div class="kv"><span>Иди в ячейку</span><b class="mono">${SK(nx[0]).cell}</b></div><div style="padding:8px 0;border-bottom:1px solid var(--line)"><small class="mini">Товар</small><b style="display:block;font-size:14px">${esc(SK(nx[0]).n)}</b><small class="mini mono">${SK(nx[0]).bc}</small></div><div class="kv"><span>Взять</span><b>${nx[1]} шт</b></div><button class="bt p full" onclick="pickScan('${nx[0]}',false)">Сканировать</button>${SK(nx[0]).pair?`<button class="bt full" style="margin-top:6px" onclick="pickScan('${nx[0]}',true)">Взял похожий</button>`:''}`:`<div class="kv"><span>Всё собрано</span><b class="ok">${i.lines.length} позиций</b></div><button class="bt p full" onclick="pickClose()">Закрыть и на рампу</button>`}
</div></div><div class="pan"><h3>Почему не ошибётся</h3><div class="kv"><span>Список</span><b>только из накладной</b></div><div class="kv"><span>Порядок</span><b>по ячейкам, без лишней ходьбы</b></div><div class="kv"><span>Похожий товар</span><b class="bad">красный экран</b></div><div class="kv"><span>Сканер</span><b>USB, Bluetooth или камера телефона</b></div></div></div>`};
SC.pallets=()=>`<div class="hd"><div><h2>Паллеты и отгрузка</h2><p>Собранная накладная — паллета под магазин. Водитель забирает готовое, отгрузка уходит в 1С.</p></div></div>
<div class="tw"><table class="t"><thead><tr><th>Накладная</th><th>Магазин</th><th>Водитель</th><th class="r">Мест</th><th>Статус</th><th></th></tr></thead><tbody>${PAL.map((p,k)=>`<tr><td class="mono">${p.inv}</td><td>${esc(p.sh)}</td><td>${esc(p.drv)}</td><td class="r">${p.box}</td><td>${tag(p.st,p.st.startsWith('уехал')?'':'w')}</td><td>${p.st==='на рампе'?`<button class="bt sm p" onclick="shipPal(${k})">Отгрузить</button>`:''}</td></tr>`).join('')}</tbody></table></div>
<div class="g2"><div class="pan"><h3>Как сейчас</h3><div class="kv"><span>Паллеты по магазинам</span><b>собирают по бумаге</b></div><div class="kv"><span>Ошибка видна</span><b>в магазине, при возврате</b></div></div><div class="pan"><h3>Как будет</h3><div class="kv"><span>Паллета</span><b>только после сборки без пересорта</b></div><div class="kv"><span>Водитель</span><b>свой или наёмный, отметка «уехал»</b></div><div class="kv"><span>1С</span><b>отгрузка уходит сама</b></div></div></div>
${said('«Водители забирают готовое: на паллете уже по магазинам разделено, кто сколько заказал.»')}`;
function shipPal(k){const p=PAL[k];p.st='уехал '+NOW;if(p.drv==='назначить')p.drv='Серик (своя машина)';const i=IV(p.inv);if(i)i.st='shipped';render();toast('Паллета '+p.inv+' отгружена. Отметка ушла в 1С.')}
let mapW='P';
SC.map=()=>{const rows=['A','B','C','D','E','F'];return `<div class="hd"><div><h2>Карта склада и ячейки · ${whN(mapW)}</h2><p>У каждого товара свой адрес: ряд — стеллаж — ярус. Похожие товары специально разнесены по разным рядам.</p></div><div class="btns"><div class="zseg">${WH.map(w=>`<button class="${w.id===mapW?'on':''}" onclick="mapW='${w.id}';render()">${w.n}</button>`).join('')}</div></div></div>
${rows.map(r=>`<div class="pan"><h3>Ряд ${r}</h3><div class="cellg">${Array.from({length:12},(_,n)=>{const code=r+'-'+String(n+1).padStart(2,'0');const s=SKU.filter(x=>x.cell.startsWith(code));return s.length?s.map(x=>`<div class="cell" style="background:${x.pair?'var(--accl)':'var(--ok-l)'}" onclick="openSku('${x.id}')"><b>${x.cell}</b><span>${esc(x.n.split(',')[0])}</span><span>${x.q[mapW]} шт</span></div>`).join(''):`<div class="cell free"><b>${code}</b><span>свободно</span></div>`}).join('')}</div></div>`).join('')}
<div class="lgd"><span><i style="background:var(--accl)"></i>есть похожий товар — стоит в другом ряду</span><span><i style="background:var(--ok-l)"></i>обычный товар</span></div>`};
function openSku(id){const s=SK(id);openM(esc(s.n),'Штрихкод '+s.bc+' · ячейка '+s.cell,`<div class="kv"><span>Цена</span><b>${tg(s.pr)}</b></div>${WH.map(w=>`<div class="kv"><span>${w.n}</span><b>${s.q[w.id]} шт</b></div>`).join('')}${s.pair?`<div class="kv"><span>Похожий товар</span><b class="bad">${esc(SK(s.pair).n)} · ${SK(s.pair).cell}</b></div>`:''}`)}
SC.inb=()=>`<div class="hd"><div><h2>Приходы</h2><p>Приход сканируется так же, как сборка: что не по документу — видно сразу. Товар раскладывается по ячейкам.</p></div></div>
<div class="tw"><table class="t"><thead><tr><th>Документ</th><th>Поставщик</th><th>Дата</th><th>Состав</th><th>Статус</th><th></th></tr></thead><tbody>${INB.map((p,k)=>`<tr><td class="mono">${p.id}</td><td>${esc(p.sup)}</td><td>${p.d}</td><td>${p.lines.map(l=>esc(SK(l[0]).n.split(',')[0])+' × '+l[1]).join('<br>')}</td><td>${tag(p.st,p.st==='принят'?'g':'w')}</td><td>${p.st!=='принят'?`<button class="bt sm p" onclick="acceptInb(${k})">Принять сканером</button>`:''}</td></tr>`).join('')}</tbody></table></div>`;
function acceptInb(k){const p=INB[k];p.st='принят';p.lines.forEach(l=>SK(l[0]).q.P+=l[1]);render();toast('Приход '+p.id+' принят, остатки обновлены и ушли в 1С.')}
SC.moves=()=>`<div class="hd"><div><h2>Перемещения между складами</h2><p>Отправил один склад — принял другой со сканером. Пока в пути, товар не числится ни там, ни там.</p></div><div class="btns"><button class="bt p" onclick="newMove()">Новое перемещение</button></div></div>
<div class="tw"><table class="t"><thead><tr><th>Документ</th><th>Откуда → куда</th><th>Дата</th><th>Состав</th><th>Статус</th><th></th></tr></thead><tbody>${MOV.map((m,k)=>`<tr><td class="mono">${m.id}</td><td>${whN(m.from)} → ${whN(m.to)}</td><td>${m.d}</td><td>${m.lines.map(l=>esc(SK(l[0]).n.split(',')[0])+' × '+l[1]).join('<br>')}</td><td>${tag(m.st,m.st==='принят'?'g':'w')}</td><td>${m.st!=='принят'?`<button class="bt sm p" onclick="acceptMove(${k})">Принять</button>`:''}</td></tr>`).join('')}</tbody></table></div>
<div class="g2"><div class="pan"><h3>Правила</h3><div class="kv"><span>Отправка</span><b>сканером по списку</b></div><div class="kv"><span>В пути</span><b>отдельный остаток «в дороге»</b></div><div class="kv"><span>Приёмка</span><b>сканером, расхождение — акт</b></div></div><div class="pan"><h3>Склады</h3>${WH.map(w=>`<div class="kv"><span>${w.n}</span><b>${w.st}</b></div>`).join('')}</div></div>`;
function newMove(){MOV.unshift({id:'ПМ-'+(119+MOV.length),from:'P',to:'A',d:'12.11',lines:[['S3',100]],st:'в пути'});SK('S3').q.P-=100;render();toast('Перемещение создано: приправа для плова × 100, Петропавловск → Астана.')}
function acceptMove(k){const m=MOV[k];m.st='принят';m.lines.forEach(l=>SK(l[0]).q[m.to]+=l[1]);render();toast('Перемещение '+m.id+' принято на складе '+whN(m.to)+'.')}
SC.stock=()=>`<div class="hd"><div><h2>Остатки по 3 складам</h2><p>Онлайн, без ожидания конца месяца. Видят учредитель и бухгалтер.</p></div><div class="btns"><button class="bt" onclick="xls()">Excel</button></div></div>
<div class="tw"><table class="t"><thead><tr><th>Товар</th>${WH.map(w=>`<th class="r">${w.n}</th>`).join('')}<th class="r">Всего</th><th class="r">Сумма</th></tr></thead><tbody>${SKU.map(s=>`<tr onclick="openSku('${s.id}')"><td>${esc(s.n)}</td>${WH.map(w=>`<td class="r">${fmt(s.q[w.id])}</td>`).join('')}<td class="r"><b>${fmt(totQ(s))}</b></td><td class="r">${tg(totQ(s)*s.pr)}</td></tr>`).join('')}</tbody></table></div>
${said('«Там должен быть учредитель и бухгалтер. Это два человека, которые видят остатки и ревизию. Остальные работают по факту.»')}`;
SC.rev=()=>`<div class="hd"><div><h2>Ревизия и инвентаризация</h2><p>Быстрая — по группе товаров за 10 минут. Месячная — по всем ячейкам. Факт сканируется, разница с учётом считается сама.</p></div><div class="btns"><button class="bt p" onclick="startRev()">Быстрая ревизия: салфетки</button></div></div>
${REVRUN?`<div class="pan"><h3>Идёт ревизия · салфетки · Петропавловск</h3><div class="tw"><table class="t"><thead><tr><th>Товар</th><th>Ячейка</th><th class="r">Учёт</th><th class="r">Факт</th><th class="r">Разница</th><th></th></tr></thead><tbody>${REVRUN.map((r,k)=>`<tr><td>${esc(SK(r.s).n)}</td><td class="mono">${SK(r.s).cell}</td><td class="r">${r.book}</td><td class="r">${r.fact===null?'—':r.fact}</td><td class="r ${r.fact!==null&&r.fact!==r.book?'bad':''}">${r.fact===null?'':r.fact-r.book}</td><td>${r.fact===null?`<button class="bt sm p" onclick="revScan(${k})">Пересчитать сканером</button>`:''}</td></tr>`).join('')}</tbody></table></div>${REVRUN.every(r=>r.fact!==null)?`<button class="bt p" onclick="revClose()">Закрыть ревизию</button>`:''}</div>`:''}
<div class="tw"><table class="t"><thead><tr><th>Дата</th><th>Вид</th><th>Склад</th><th class="r">Позиций</th><th class="r">Расхождений</th><th class="r">Сумма</th><th>Кто</th></tr></thead><tbody>${REV.map(r=>`<tr><td>${r.d}</td><td>${r.k}</td><td>${whN(r.wh)}</td><td class="r">${r.pos}</td><td class="r ${r.diff?'bad':''}">${r.diff}</td><td class="r ${r.sum<0?'bad':''}">${tg(r.sum)}</td><td>${r.who}</td></tr>`).join('')}</tbody></table></div>
${said('«Месяц закончился — фактически видят остатки, сразу считают, сколько в наличии, и проверяют, есть или нету.»')}`;
function startRev(){REVRUN=[{s:'S1',book:SK('S1').q.P,fact:null},{s:'S2',book:SK('S2').q.P,fact:null}];render()}
function revScan(k){const r=REVRUN[k];r.fact=k===1?r.book-2:r.book;render()}
function revClose(){const d=REVRUN.reduce((a,r)=>a+(r.fact-r.book),0);REV.unshift({d:'12.11',k:'выборочная · салфетки',wh:'P',pos:2,diff:REVRUN.filter(r=>r.fact!==r.book).length,sum:d*SK('S2').pr,who:'Ерлан'});REVRUN.forEach(r=>SK(r.s).q.P=r.fact);REVRUN=null;render();toast('Ревизия закрыта. Расхождение −2 детских салфеток, акт ушёл бухгалтеру и в 1С.')}
SC.errs=()=>`<div class="hd"><div><h2>Пересорты и расхождения</h2><p>Каждая попытка положить не тот товар записывается: накладная, сборщик, что нужно и что взяли. Видно, какие пары путают чаще.</p></div></div>
<div class="g2"><div class="pan"><h3>Журнал</h3><div class="tw"><table class="t sm"><thead><tr><th>Когда</th><th>Накладная</th><th>Нужно</th><th>Взяли</th><th>Кто</th><th>Итог</th></tr></thead><tbody>${ERRS.map(e=>`<tr><td>${e.d}</td><td class="mono">${e.inv}</td><td>${esc(SK(e.want).n)}</td><td class="bad">${esc(SK(e.took).n)}</td><td>${e.who}</td><td>${tag(e.res,'g')}</td></tr>`).join('')}</tbody></table></div></div>
<div class="pan"><h3>Кого путают чаще</h3>${[['S1','S2'],['S3','S4'],['S8','S9'],['S15','S16']].map(p=>{const n=ERRS.filter(e=>(e.want===p[0]&&e.took===p[1])||(e.want===p[1]&&e.took===p[0])).length;return `<div class="kv"><span>${esc(SK(p[0]).n.split(',')[0])}: ${esc(SK(p[0]).n.split(', ')[1]||'')} / ${esc(SK(p[1]).n.split(', ')[1]||'')}</span><b class="${n?'bad':''}">${n}</b></div>`}).join('')}</div></div>`;
SC.sku=()=>`<div class="hd"><div><h2>Товары и штрихкоды</h2><p>Справочник берётся из 1С. Пары похожих товаров подсвечены — у них разные штрихкоды и разные ячейки.</p></div></div>
<div class="tw"><table class="t"><thead><tr><th>Товар</th><th>Штрихкод</th><th>Ячейка</th><th>Похожий</th><th class="r">Цена</th></tr></thead><tbody>${SKU.map(s=>`<tr onclick="openSku('${s.id}')" style="${s.pair?'background:var(--accl)':''}"><td>${esc(s.n)}</td><td class="mono">${s.bc}</td><td class="mono">${s.cell}</td><td>${s.pair?esc(SK(s.pair).n):''}</td><td class="r">${tg(s.pr)}</td></tr>`).join('')}</tbody></table></div>`;
const LOG=[['09:38','Накладная РН-48213 · 1С (основная) → портал','ок'],['09:31','Остатки Петропавловск · портал → 1С (основная)','ок'],['09:31','Остатки · портал → 1С (официальная)','ок'],['09:12','Приход ПР-2210 · портал → обе базы','ок'],['08:44','Накладная РН-37740 · 1С → портал','ок']];
SC.onec=()=>`<div class="hd"><div><h2>Обмен с 1С</h2><p>Две базы — основная и официальная. Обмен в обе стороны каждые 1–2 минуты по стандартному протоколу 1С (OData). Advance Agent работает как раньше.</p></div><div class="btns"><button class="bt" onclick="syncNow()">Синхронизировать</button></div></div>
<div class="g2"><div class="pan"><h3>Что идёт из 1С</h3><div class="kv"><span>Накладные от торговых</span><b>сразу</b></div><div class="kv"><span>Справочник товаров и штрихкоды</span><b>при изменении</b></div><div class="kv"><span>Цены</span><b>при изменении</b></div></div>
<div class="pan"><h3>Что уходит в 1С</h3><div class="kv"><span>Факт сборки и недовложения</span><b>сразу</b></div><div class="kv"><span>Приходы и перемещения</span><b>сразу</b></div><div class="kv"><span>Акты ревизии</span><b>после закрытия</b></div></div></div>
<div class="pan"><h3>Журнал обмена</h3><div class="tw"><table class="t sm"><tbody>${LOG.map(l=>`<tr><td>${l[0]}</td><td>${l[1]}</td><td>${tag(l[2],'g')}</td></tr>`).join('')}</tbody></table></div></div>
${said('«Две базы. Нужно, чтобы она всегда взаимодействовала, всегда было видно, постоянный взаимообмен шёл.»')}`;
SC.reports=()=>`<div class="hd"><div><h2>Отчёты</h2><p>Любой отчёт по первичке склада. Формулы согласуем с вами и бухгалтером.</p></div><div class="btns"><button class="bt" onclick="xls()">Excel</button></div></div>
<div class="g2">${[['Движение товара','приход, сборка, перемещения по любому товару за период'],['Остатки на дату','по складам и ячейкам, в штуках и тенге'],['Ревизии','расхождения, суммы, кто считал'],['Пересорты','по сборщикам и парам товаров'],['Скорость сборки','накладных в день, минут на накладную'],['Недовложения','что не хватило и почему']].map(r=>`<div class="pan"><h3>${r[0]}</h3><p>${r[1]}</p><button class="bt sm" onclick="xls()">Скачать</button></div>`).join('')}</div>`;
SC.pilot=()=>`<div class="hd"><div><h2>Пилот → 3 склада</h2><p>Начинаем с Петропавловска: там самый большой ассортимент. Работает — подключаем Астану и Кокшетау.</p></div></div>
<div class="stps">${[['Неделя 1','сервер, обмен с 1С, справочник'],['Неделя 2','карта и ячейки Петропавловска'],['Неделя 3','сборка со сканером, приходы'],['Неделя 4','ревизия, отчёты, обучение'],['Этап 2','Астана и Кокшетау — настройка'],['Итог','3 склада в одном пульте']].map((x,i)=>`<div class="${i<4?'done':''}"><b>${x[0]}</b><br>${x[1]}</div>`).join('')}</div>
${said('«Для начала хотя бы один склад, практикануть, посмотреть, как оно выглядит. Если сработает — на три склада.»','Подключение Астаны и Кокшетау входит в пакет: это настройка ячеек и обучение, а не новая разработка.')}`;
SC.roles=()=>`<div class="hd"><div><h2>Роли и права</h2><p>Пользователей сколько угодно, но видят они разное.</p></div></div>
<div class="tw"><table class="t perm"><thead><tr><th>Раздел</th>${Object.keys(ROLES).map(r=>`<th>${r}</th>`).join('')}</tr></thead><tbody>${[['Остатки и ревизия','1100'],['Сборка и накладные','1011'],['Приходы, ячейки','1010'],['Пересорты','1110'],['Обмен с 1С, отчёты','1100']].map(r=>`<tr><td>${r[0]}</td>${r[1].split('').map(c=>`<td>${c==='1'?tag('да','g'):'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
<div class="g2"><div class="pan"><h3>Учредитель и бухгалтер</h3><p>Видят остатки, ревизии, деньги и отчёты по всем трём складам.</p></div><div class="pan"><h3>Склад</h3><p>Старший склада и сборщики работают по накладным и ячейкам. Остатки в тенге и ревизию не видят.</p></div></div>
${said('«Мне не нужны миллион пользователей. Учредитель и бухгалтер видят остатки и ревизию, все остальные работают по факту.»')}`;
let VAR='A';
SC.launch=()=>{const t=VAR==='A'?2300000:3300000;return `<div class="hd"><div><h2>Стоимость</h2><p>Платите один раз. Без абонплаты, без ограничений по пользователям, код и сервер — ваши.</p></div><div class="btns"><div class="zseg"><button class="${VAR==='A'?'on':''}" onclick="VAR='A';render()">Путь А · склад + 1С</button><button class="${VAR==='B'?'on':''}" onclick="VAR='B';render()">Путь Б · всё в одном окне</button></div></div></div>
<div class="g2"><div class="pan price"><h3>${VAR==='A'?'Путь А · рекомендуем':'Путь Б'}</h3>${VAR==='A'?`<div class="kv"><span>Пакет «Склад»: сборка по накладной со сканером, ячейки, приходы, перемещения, ревизия, пересорты, отчёты, 3 склада</span><b>1 500 000 ₸</b></div>`:`<div class="kv"><span>Стандартный пакет: склад + торговые заказывают в портале вместо Advance Agent, накладные в портале</span><b>2 500 000 ₸</b></div>`}<div class="kv"><span>Интеграция с 1С (две базы, обмен в обе стороны)</span><b>800 000 ₸</b></div><div class="kv tot"><span>Итого</span><b>${tg(t)}</b></div></div>
<div class="pan"><h3>Оплата 30 / 40 / 30</h3><div class="kv"><span>Старт</span><b>${tg(t*.3)}</b></div><div class="kv"><span>База на сервере (7–10 дней)</span><b>${tg(t*.4)}</b></div><div class="kv"><span>Сдача</span><b>${tg(t*.3)}</b></div><div class="kv"><span>Срок</span><b>${VAR==='A'?'около 4 недель':'4–6 недель'}</b></div><div class="kv"><span>Поддержка</span><b>3 месяца включены</b></div><div class="kv"><span>Не входит</span><b>сканеры, принтер</b></div></div></div>`};
function searchDemo(v){if(!v)return;const q=v.toLowerCase();const s=SKU.find(x=>(x.n+x.bc).toLowerCase().includes(q));if(s){openSku(s.id);return}const i=INV.find(x=>x.id.toLowerCase().includes(q));if(i){openInv(i.id);return}toast('Не найдено. Попробуйте: «салфетки», «РН-48211», «4870001001025».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Учредитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="ri ${s.k===SECOF[cur]?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><span>${s.n}</span></a>`).join('');
 const S=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=`<h4>${esc(S.n)}</h4>`+S.sub.filter(x=>allowed(x[0])).map((x,i)=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')"><code>${String(i+1).padStart(2,'0')}</code>${esc(x[1])}</a>`).join('')+`<div class="shint"><b>${esc(role)}</b><br>${esc(ROLES[role].note)}</div>`}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Дала Трейд';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function xls(){const h=`<html><head><meta charset="utf-8"></head><body><table border="1"><tr><th>Товар</th><th>Штрихкод</th>${WH.map(w=>`<th>${w.n}</th>`).join('')}</tr>${SKU.map(s=>`<tr><td>${esc(s.n)}</td><td>${s.bc}</td>${WH.map(w=>`<td>${s.q[w.id]}</td>`).join('')}</tr>`).join('')}</table></body></html>`;try{const b=new Blob(['﻿'+h],{type:'application/vnd.ms-excel'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='Остатки_'+TODAY+'.xls';document.body.appendChild(a);a.click();a.remove()}catch(e){}toast('Файл <b>Остатки.xls</b> скачан.')}
let theme='light';function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme()}
const TOUR=[['dash','1 · Пульт: накладные, сборки, пойманные пересорты, ревизия.'],['flow','2 · Advance Agent и 1С остаются. Портал ведёт склад.'],['queue','3 · Накладные приходят из 1С сами.'],['pick','4 · Сборка: пикнули похожий — красный экран.'],['tsd','5 · Телефон сборщика: ячейка, товар, количество.'],['map','6 · Ячейки: похожие товары в разных рядах.'],['rev','7 · Быстрая ревизия за 10 минут.'],['errs','8 · Журнал пересортов: кто и что путает.'],['onec','9 · Две базы 1С, обмен в обе стороны.'],['pilot','10 · Пилот в Петропавловске, затем 3 склада.'],['launch','11 · 1,5 млн склад + 0,8 млн 1С.']];
let ti=-1,tRun=false;function tour(){if(tRun){tRun=false;return}tRun=true;ti=-1;step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){tRun=false;toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Учредитель');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();tRun=false}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
