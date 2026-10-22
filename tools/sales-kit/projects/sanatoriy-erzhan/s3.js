/* Медблок */
SC.med=()=>{const arr=GU.filter(g=>g.st==='arr'||g.id==='Г-1038');
 return `<div class="hd"><div><h2>Пульт главного врача</h2><p>Как только ресепшн заводит карточку гостя, пациент появляется здесь: кто заезжает сегодня, кому назначить программу, сколько процедур проведено и подтверждено пациентами, какие кабинеты загружены.</p></div></div>
 <div class="wid">
  <div><small>Пациентов в санатории</small><b class="a">${inHouse().reduce((a,g)=>a+ppl(g),0)}</b><span>по данным ресепшн</span></div>
  <div class="clk" onclick="go('cabs')"><small>Процедур сегодня</small><b>${PROC.length}</b><span>${pcnt('ok')} подтверждено · ${pcnt('done')} ждут · ${pcnt('miss')} не пришёл</span></div>
  <div class="clk" onclick="go('cabs')"><small>Загрузка кабинетов</small><b>${Math.round(PROC.length/(CABS.length*HOURS.length)*100*2.6)}%</b><span>${CABS.length} кабинетов в демо из 26</span></div>
  <div class="clk" onclick="go('paid')"><small>Платные сегодня</small><b class="g">${tg(186000)}</b><span>в фолио гостей</span></div>
 </div>
 <div class="g2"><div class="pan"><h3>Новые пациенты — назначить программу</h3>${arr.map(g=>`<div class="rf clk" onclick="go('prog')"><i></i><div><b>${g.n} · номер ${g.room}</b><span>${g.st==='arr'?'заезд сегодня':'заехал вчера'} · ${g.nn} ночей · путёвка «${PRG[g.prog].n}»</span></div></div>`).join('')}</div>
 <div class="pan"><h3>Процедуры по кабинетам сегодня</h3>${bars(CABS.map(c=>[c[0]+' '+c[1].split(',')[0],PROC.filter(p=>p[0]===c[0]).length,PROC.filter(p=>p[0]===c[0]).length+' проц.']).filter(r=>r[1]).slice(0,8))}</div></div>
 ${said('Гость приехал, создаём карточку — на медблоке сразу видно; главный врач должен видеть, что пациенты идут')}`};

/* Программа и автораспределение */
let AD=null;
const PCAB={'Минеральная ванна':'К-01','Йодобромная ванна':'К-02','Душ Шарко':'К-03','Циркулярный душ':'К-04','Солевая шахта':'К-05','Кислородный коктейль':'К-06','Электрофорез':'К-10','Электросон':'К-10','Прогревание (озокерит)':'К-11','Минеральная вода, приём':'бювет'};
function autoDist(){const g=GD('Г-1047'),pr=PRG[g.prog];const q=[];pr.pr.forEach(p=>{for(let i=0;i<p[1];i++)q.push(p[0])});
 const days=Array.from({length:g.nn},()=>[]);let d=0;
 while(q.length){const p=q.shift();let k=0;while(days[d%g.nn].includes(p)&&k<g.nn){d++;k++}days[d%g.nn].push(p);d++}
 AD=days.map((ps,i)=>ps.map((p,j)=>[HOURS[(j*2+i)%HOURS.length],p,PCAB[p]||'К-10']).sort((a,b)=>a[0]<b[0]?-1:1));
 toast(`Готово: ${pr.pr.reduce((a,p)=>a+p[1],0)} процедур распределены на ${g.nn} дней по часам и кабинетам. Медсёстры увидят их на планшетах, пациент — в телефоне.`);render()}
SC.prog=()=>{const g=GD('Г-1047'),pr=PRG[g.prog];
 return `<div class="hd"><div><h2>Программа и автораспределение</h2><p>Врач выбирает программу путёвки, при необходимости добавляет или убирает процедуры и нажимает «Автораспределение». Система раскладывает все процедуры по дням и часам с учётом загрузки кабинетов и того, чтобы у пациента не было двух одинаковых процедур в день.</p></div></div>
 <div class="g2 g21"><div class="pan"><h3>${g.n} · номер ${g.room} · ${g.nn} дней</h3>
  <div class="kv"><span>Программа</span><b>${pr.n}</b></div>${pr.pr.map(p=>`<div class="kv"><span>${p[0]}</span><b>${p[1]} раз</b></div>`).join('')}<div class="kv"><span><b>Всего процедур</b></span><b>${pr.pr.reduce((a,p)=>a+p[1],0)}</b></div>
  <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="autoDist()">Автораспределение</button><button class="bt" onclick="act('Процедура добавлена в программу пациента.')">+ Процедура</button></div></div>
 <div class="pan"><h3>Расписание пациента</h3>${AD?`<div class="tw"><table class="t"><thead><tr><th>День</th><th>Процедуры</th></tr></thead><tbody>${AD.map((ps,i)=>`<tr><td class="mono"><b>${dd(g.d0+i)}</b></td><td>${ps.map(p=>`<span class="pz"><b class="mono">${p[0]}</b> ${p[1]} <small class="mono">${p[2]}</small></span>`).join('')}</td></tr>`).join('')}</tbody></table></div>`:'<p class="hint">Нажмите «Автораспределение» — процедуры разложатся по дням и часам.</p>'}</div></div>
 ${said('Врач назначает процедуры и нажимает автораспределение — все процедуры на пять дней распределяются по дням, по часам, и у медсестёр есть планшеты')}`};

/* Кабинеты */
SC.cabs=()=>`<div class="hd"><div><h2>Кабинеты и расписание · сегодня</h2><p>Каждый кабинет со своими процедурами и закреплённой медсестрой (одна медсестра на два кабинета). Видно, кто во сколько придёт, что проведено и что подтвердил пациент.</p></div></div>
 <div class="pan"><div class="cbg" style="--n:${HOURS.length}"><div class="cb-h">Кабинет</div>${HOURS.map(h=>`<div class="cb-h mono">${h}</div>`).join('')}
 ${CABS.map(c=>`<div class="cb-r"><b class="mono">${c[0]}</b><small>${c[1]} · ${c[2]}</small></div>`+HOURS.map(h=>{const ps=PROC.filter(p=>p[0]===c[0]&&p[1]===h);return `<div class="cb-c">${ps.map(p=>`<span class="cb-p ${p[4]}" onclick="card('g','${p[2]}')">${GD(p[2]).n.split(' ')[0]}</span>`).join('')}</div>`}).join('')).join('')}</div>
 <div class="chl"><span class="cb-p plan">по плану</span><span class="cb-p done">проведена, ждёт пациента</span><span class="cb-p ok">подтверждена</span><span class="cb-p miss">не пришёл</span></div></div>
 ${said('У нас примерно двадцать пять–тридцать кабинетов, в каждом кабинете определённые процедуры, прикреплена медсестра — одна на два кабинета')}`;

/* Планшет медсестры */
SC.nurse=()=>{const my=PROC.filter(p=>p[0]==='К-03'||p[0]==='К-04').sort((a,b)=>a[1]<b[1]?-1:1);
 return `<div class="hd"><div><h2>Планшет медсестры · Айжан · К-03 и К-04</h2><p>Медсестра видит только свои кабинеты: кто, во сколько и на какую процедуру придёт. После процедуры нажимает «Провела» — пациенту в телефон приходит запрос на подтверждение. В выработку медсестры процедура идёт только после подтверждения пациентом.</p></div></div>
 <div class="tab"><div class="tab-in">${my.map(p=>{const i=PROC.indexOf(p),g=GD(p[2]);return `<div class="nr ${p[4]}"><b class="mono">${p[1]}</b><div><b>${g.n}</b><span>${p[3]} · ${p[0]} · номер ${g.room}</span></div><div>${p[4]==='plan'?`<button class="bt p sm" onclick="nDone(${i})">Провела</button> <button class="bt sm" onclick="nMiss(${i})">Не пришёл</button>`:tag(...PS[p[4]])}</div></div>`}).join('')}</div></div>
 ${said('Нужно знать, что клиент действительно попал на процедуру — чтобы клиент подтверждал с телефона, что он был, и медсёстры не приписывали себе')}`};
function nDone(i){PROC[i][4]='done';toast(`${GD(PROC[i][2]).n}: запрос «Подтвердите процедуру ${PROC[i][3]}» отправлен на телефон пациента.`);render()}
function nMiss(i){PROC[i][4]='miss';toast('Отмечено: не пришёл. Процедура перенесена на свободное время, пациент получил уведомление.');render()}

/* Телефон пациента */
SC.phone=()=>{const id='Г-1049',g=GD(id),my=PROC.filter(p=>p[2]===id).sort((a,b)=>a[1]<b[1]?-1:1);
 return `<div class="hd"><div><h2>Телефон пациента</h2><p>Пациент видит своё расписание процедур на день, подтверждает каждую проведённую процедуру одной кнопкой и сам покупает платные услуги — сумма попадает в фолио. Без приложения в магазине: ссылка или QR из номера.</p></div></div>
 <div class="sxp-wrap"><div class="sxp"><div class="sxp-top"><b>${g.n.split(' ')[0]}, доброе утро</b><span>номер ${g.room} · день 3 из ${g.nn}</span></div>
 ${my.map(p=>{const i=PROC.indexOf(p);return `<div class="sxp-p ${p[4]}"><b class="mono">${p[1]}</b><div><b>${p[3]}</b><span>${p[0]}</span></div>${p[4]==='done'?`<button class="bt p sm" onclick="pOk(${i})">Я был(а)</button>`:p[4]==='ok'?'<i class="okm">✓</i>':''}</div>`}).join('')}
 <h4>Платные услуги</h4>${Object.entries(PRICE).slice(0,4).map(([k,v])=>`<div class="sxp-s" onclick="act('${k} — записано на ближайшее свободное время, ${fmt(v)} ₸ добавлено в фолио.')"><span>${k}</span><b class="mono">${fmt(v)} ₸</b></div>`).join('')}
 <h4>Питание сегодня</h4><div class="sxp-s"><span>Обед 13:00 · диетический стол</span><b>включено</b></div></div>
 ${tip('Защита от приписок','Медсестра отмечает «провела» — у пациента появляется кнопка «Я был(а)». Подтверждение фиксируется со временем и с телефона пациента. Главный врач видит неподтверждённые процедуры по каждой медсестре.')}</div>`};
function pOk(i){PROC[i][4]='ok';toast(`Процедура «${PROC[i][3]}» подтверждена пациентом в ${NOW}.`);render()}

/* Платные процедуры */
SC.paid=()=>`<div class="hd"><div><h2>Платные процедуры</h2><p>Прейскурант платных услуг: массажи, бочки, косметология, лазер, системы. Продаёт ресепшн, медсестра или гость сам в телефоне; запись ставится в свободное время кабинета, сумма — в фолио гостя.</p></div><div class="btns"><button class="bt p" onclick="act('Новая услуга в прейскуранте: название, кабинет, длительность, цена, расход материалов.')">+ Услуга</button></div></div>
 <div class="g2 g21"><div class="pan"><h3>Прейскурант</h3><div class="tw"><table class="t"><thead><tr><th>Услуга</th><th style="text-align:right">Цена</th><th>Продано в октябре</th></tr></thead><tbody>${Object.entries(PRICE).map(([k,v],i)=>`<tr><td><b>${k}</b></td><td class="mono" style="text-align:right">${fmt(v)}</td><td class="mono">${[212,96,88,41,118,64,22,17][i]}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Выручка платных, октябрь</h3>${bars([['Массажи',2.53,'2,53 млн'],['Бочки',1.02,'1,02 млн'],['Косметология',0.87,'0,87 млн'],['Лазер, системы',0.44,'0,44 млн']])}</div></div>`;
