
const SC={};
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const stTag=k=>`<span class="stg" style="--sc:${STC(k)}">${STN(k)}</span>`;
const dzTag=k=>k?`<span class="dzt" style="--dc:${DC(k)}">${DN(k)}</span>`:'<span class="dzt none">не назначен</span>';
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
const todayRev=()=>JOBS.filter(j=>j.st==='paid').reduce((a,j)=>a+j.sum,0);
const todayPlan=()=>JOBS.filter(j=>j.st!=='cancel').reduce((a,j)=>a+j.sum,0);

SC.dash=()=>{const act=JOBS.filter(j=>j.st!=='cancel');
 return `<div class="hd"><div><h2>Пульт · ${TODAY}, ${NOW}</h2><p>Сколько заявок пришло и откуда, кто из дезинфекторов где сейчас, сколько обработано и оплачено, оборот за день, неделю и месяц. Всё, что сейчас собирается из блокнота, WhatsApp и Excel в конце месяца.</p></div><div class="btns"><button class="bt" onclick="exportXls('jobs')">⇩ Excel</button></div></div>
 <div class="wid">
  <div class="clk" onclick="go('leads')"><small>Заявок сегодня</small><b>${JOBS.length}</b><span>новых без дезинфектора: ${JOBS.filter(j=>j.st==='new').length}</span></div>
  <div class="clk" onclick="go('board')"><small>Выездов сегодня</small><b class="a">${act.filter(j=>j.dz).length}</b><span>${JOBS.filter(j=>['road','work'].includes(j.st)).length} сейчас в пути или на объекте</span></div>
  <div class="clk" onclick="go('money')"><small>Оплачено сегодня</small><b class="g">${tg(todayRev())}</b><span>из ${tg(todayPlan())} по заявкам дня</span></div>
  <div class="clk" onclick="go('reports')"><small>Оборот за октябрь</small><b>${tg(2186000+todayRev())}</b><span>${82+JOBS.filter(j=>j.st==='paid').length} обработки · средний чек ${tg(26300)}</span></div>
  <div class="clk" onclick="go('money')"><small>Наличные у дезинфекторов</small><b class="w">${tg(cashOnHands())}</b><span>сдать в кассу вечером</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Дезинфекторы сейчас</h3>${DZ.map(d=>{const L=JOBS.filter(j=>j.dz===d[0]&&j.st!=='cancel').sort((a,b)=>a.t.localeCompare(b.t));const now=L.find(j=>['road','work'].includes(j.st));return `<div class="dzrow clk" onclick="go('board')"><span class="dzt" style="--dc:${d[2]}">${d[1]}</span><div class="dztl">${L.map(j=>`<i class="${j.st}" title="${j.t} ${j.pest}" style="--sc:${STC(j.st)}">${j.t}</i>`).join('')}</div><em>${now?STN(now.st)+': '+esc(now.addr):'между выездами'}</em></div>`}).join('')}</div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="go('board')"><i></i><div><b>${JOBS.filter(j=>j.st==='new').length} заявки без дезинфектора</b><span>офис на 16:30, плесень на 17:30 — распределить</span></div></div>
  <div class="rf bad" onclick="go('stock')"><i></i><div><b>Акарицид для участков: 900 мл при минимуме 1 200</b><span>хватит на 3 участка — заказать</span></div></div>
  <div class="rf" onclick="go('clients')"><i></i><div><b>4 гарантийных повтора на этой неделе</b><span>клопы и тараканы — позвонить, назначить время</span></div></div>
  <div class="rf" onclick="go('money')"><i></i><div><b>Бекзат: наличные за 2 дня не сданы</b><span>${tg(43000)}</span></div></div></div></div>
 <div class="g2"><div class="pan"><h3>Заявки по источникам, октябрь</h3>${bars([['Google',38],['2ГИС',21],['Instagram',14],['OLX',9],['WhatsApp',7],['Повторные',6],['Рекомендации',4]])}</div>
 <div class="pan"><h3>По вредителям, октябрь</h3>${bars([['Тараканы',36],['Клопы',24],['Клещи на участке',11],['Блохи',9],['Грызуны',8],['Муравьи',6],['Плесень',5]])}</div></div>
 ${said('Заявка в блокнот, потом через WhatsApp дезинфекторам, дезинфектор отчитывается в WhatsApp, в блокноте отмечаем, что отработано, вечером всё в Excel, в конце месяца отчётность')}`};

/* Заявки */
let LF={q:'',st:'',src:'',dz:''};
const lsel=(k,opts,ph)=>`<select onchange="LF.${k}=this.value;render()"><option value="">${ph}</option>${opts.map(o=>`<option value="${o[0]}" ${LF[k]===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>`;
SC.leads=()=>{const L=JOBS.filter(j=>(!LF.st||j.st===LF.st)&&(!LF.src||j.src===LF.src)&&(!LF.dz||j.dz===LF.dz)&&(!LF.q||(j.nm+j.ph+j.addr+j.id).toLowerCase().includes(LF.q.toLowerCase())));
 return `<div class="hd"><div><h2>Все заявки</h2><p>Звонок, WhatsApp, Google, 2ГИС, OLX, Instagram — каждая заявка попадает сюда с источником. Оператор или вы заводите её за полминуты: клиент, адрес, вредитель, объект, время. Цена считается по прайсу.</p></div><div class="btns"><button class="bt" onclick="exportXls('jobs')">⇩ Excel</button><button class="bt p" onclick="card('newjob')">+ Заявка</button></div></div>
 <div class="flt"><input placeholder="Имя, телефон, адрес" value="${esc(LF.q)}" onchange="LF.q=this.value;render()">${lsel('st',ST.map(s=>[s[0],s[1]]),'Все статусы')}${lsel('src',SRC.map(s=>[s,s]),'Все источники')}${lsel('dz',DZ.map(d=>[d[0],d[1]]),'Все дезинфекторы')}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Заявка</th><th>Время</th><th>Клиент</th><th>Адрес</th><th>Вредитель · объект</th><th>Сумма</th><th>Источник</th><th>Дезинфектор</th><th>Статус</th></tr></thead><tbody>${L.map(j=>`<tr class="clk" onclick="openJob('${j.id}')"><td><b>${j.id}</b></td><td class="mono">${j.d} ${j.t}</td><td>${esc(j.nm)}<br><small>${j.ph}</small></td><td>${esc(j.addr)}</td><td>${j.pest}<br><small>${j.obj}</small></td><td class="mono">${tg(j.sum)}</td><td>${j.src}</td><td>${dzTag(j.dz)}</td><td>${stTag(j.st)}</td></tr>`).join('')}</tbody></table></div></div>`};
function openJob(id){curJob=id;go('job')}

/* Распределение */
SC.board=()=>{const nw=JOBS.filter(j=>j.st==='new');
 return `<div class="hd"><div><h2>Распределение · ${TODAY}</h2><p>Слева — новые заявки, справа — день каждого дезинфектора по времени. Выбрали заявку → нажали на дезинфектора: заявка с адресом, временем и вредителем сразу у него в телефоне. Видно, кто свободен и где окно.</p></div></div>
 <div class="dist"><div class="kc" style="--sc:#7c8aa5"><div class="kh"><b>Новые, без дезинфектора</b><span>${nw.length}</span></div>${nw.map(j=>`<div class="kd ${PICK===j.id?'on':''}" onclick="PICK='${j.id}';render()"><div class="kt"><b>${j.id} · ${j.t}</b><span class="src">${j.src}</span></div><div class="kr">${j.pest} · ${j.obj}</div><div class="km">${esc(j.addr)}</div><div class="kf"><span>${esc(j.nm)}</span><b>${tg(j.sum)}</b></div></div>`).join('')||'<div class="kempty">все распределены ✓</div>'}</div>
 ${DZ.map(d=>{const L=JOBS.filter(j=>j.dz===d[0]&&j.st!=='cancel').sort((a,b)=>a.t.localeCompare(b.t));return `<div class="kc dzc" style="--sc:${d[2]}"><div class="kh"><b>${d[1]}</b><span>${L.length} выезда · ${tg(L.reduce((a,j)=>a+j.sum,0))}</span></div>${PICK?`<button class="bt sm p asg" onclick="assign('${PICK}','${d[0]}')">Назначить ${PICK} →</button>`:''}${L.map(j=>`<div class="kd" onclick="openJob('${j.id}')"><div class="kt"><b>${j.t}</b>${stTag(j.st)}</div><div class="kr">${j.pest} · ${j.obj}</div><div class="km">${esc(j.addr)}</div></div>`).join('')}</div>`}).join('')}</div>
 ${said('Заявка поступает, как-то в приложение вбивается, и чтоб она уходила — я распределял между дезинфекторами, чтоб они потом видели всю заявку: адрес, дату, время, куда ехать, от каких насекомых обработка')}`};
let PICK='';
function assign(id,dz){const j=JB(id);j.dz=dz;j.st='set';PICK='';AUDIT.unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,role,'Распределение',id+' → '+DN(dz),j.t,'компьютер']);render();toast(`${id} назначена: ${DN(dz)}. Ему пришло уведомление в приложение и WhatsApp — адрес, время, вредитель.`)}

/* Карточка заявки */
SC.job=()=>{const j=JB(curJob),u=useOf(j.pest);
 return `<div class="hd"><div><h2>${j.id} · ${j.pest} · ${j.obj}</h2><p>${esc(j.nm)} · ${j.ph} · ${esc(j.addr)} · ${j.d} ${j.t} · источник ${j.src}</p></div><div class="btns"><button class="bt" onclick="go('leads')">← К заявкам</button><button class="bt" onclick="act('Звонок через IP-телефонию — разговор запишется в карточку.')">☎ Позвонить</button><button class="bt" onclick="act('WhatsApp клиенту: подтверждение времени и памятка «как подготовить квартиру».')">WhatsApp</button></div></div>
 <div class="stp">${ST.filter(s=>s[0]!=='cancel').map(s=>`<div class="${s[0]===j.st?'on':''}" style="--sc:${s[2]}" onclick="setJobSt('${j.id}','${s[0]}')"><i></i>${s[1]}</div>`).join('')}</div>
 <div class="g2 g21"><div>
  <div class="pan"><h3>Заявка</h3><div class="kv"><span>Вредитель</span><b>${j.pest}</b></div><div class="kv"><span>Объект</span><b>${j.obj}</b></div><div class="kv"><span>Метод</span><b>${j.pest==='Грызуны'?'приманки и ловушки':j.pest==='Клещи на участке'?'опрыскивание участка':'холодный туман, без запаха'}</b></div><div class="kv"><span>Дезинфектор</span><b>${dzTag(j.dz)}</b></div><div class="kv"><span>Гарантия</span><b>${j.guar}</b></div><div class="kv on"><span><strong>Сумма</strong></span><b>${tg(j.sum)}${j.pay?' · '+j.pay:''}</b></div><div class="pin">${esc(j.note)}</div></div>
  <div class="pan"><h3>Отчёт дезинфектора</h3>${j.photos?`<div class="phg">${Array.from({length:j.photos},(_,i)=>`<div class="ph0"><span>${i<2?'до':'после'}</span></div>`).join('')}${j.video?'<div class="ph0 v"><span>▶ видео</span></div>':''}</div>`:'<p class="hint">Фото «до» и «после» и видео обработки появятся здесь, когда дезинфектор отправит их из приложения.</p>'}</div>
 </div><div>
  <div class="pan"><h3>Препараты на эту обработку</h3>${u.length?u.map(x=>`<div class="kv"><span>${esc(PS(x[0]).n)}</span><b>${x[1]} ${PS(x[0]).u}</b></div>`).join(''):'<p class="hint">Без препаратов из списка.</p>'}<p class="hint">Списываются со склада, когда дезинфектор нажимает «обработано». Себестоимость: ${tg(u.reduce((a,x)=>a+x[1]*PS(x[0]).pr,0))}.</p></div>
  <div class="pan"><h3>История</h3><div class="evt"><span class="mono">09:20</span><b>Заявка</b><span>${j.src}, оператор Мадина</span></div>${j.dz?`<div class="evt"><span class="mono">09:58</span><b>Назначена</b><span>${DN(j.dz)}</span></div>`:''}${['road','work','done','paid'].includes(j.st)?'<div class="evt"><span class="mono">10:15</span><b>В пути</b><span>клиенту ушло «дезинфектор выехал»</span></div>':''}${['done','paid'].includes(j.st)?'<div class="evt"><span class="mono">11:40</span><b>Обработано</b><span>фото, видео, препараты</span></div>':''}${j.st==='paid'?`<div class="evt"><span class="mono">11:42</span><b>Оплачено</b><span>${j.pay}</span></div>`:''}</div>
 </div></div>`};
function setJobSt(id,k){const j=JB(id);if(k!=='new'&&!j.dz){toast('Сначала назначьте дезинфектора.');return}j.st=k;if(k==='paid'&&!j.pay)j.pay='Kaspi';render();toast('Статус: '+STN(k)+'.')}

/* Календарь */
SC.cal=()=>{const days=['14.10 ср','15.10 чт','16.10 пт','17.10 сб','18.10 вс','19.10 пн','20.10 вт'];const busy=(d,i)=>i===0?JOBS.filter(j=>j.dz===d&&j.st!=='cancel').length:[3,2,4,2,0,3,1][(i+d.length*3)%7]+((d==='BK')?1:0);
 return `<div class="hd"><div><h2>Календарь выездов</h2><p>Неделя по дезинфекторам: сколько выездов у каждого и где свободно. Оператор видит окна и сразу предлагает клиенту время. Гарантийные повторы ставятся сюда автоматически.</p></div></div>
 <div class="pan"><div class="tw"><table class="t calg"><thead><tr><th>Дезинфектор</th>${days.map(d=>`<th>${d}</th>`).join('')}</tr></thead><tbody>${DZ.map(d=>`<tr><td><span class="dzt" style="--dc:${d[2]}">${d[1]}</span></td>${days.map((x,i)=>{const n=busy(d[0],i);return `<td class="${n>=4?'full':n===0?'free':'busy'}">${n?n+' выезд'+(n===1?'':n<5?'а':'ов'):'свободен'}${i===2&&d[0]==='DN'?'<br><small>повтор З-2131</small>':''}</td>`}).join('')}</tr>`).join('')}</tbody></table></div></div>`};
