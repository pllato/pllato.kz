
/* ===== Конюшня ===== */
let hF='all';
SC.horses=()=>{
 const F={all:['Все',()=>true],work:['В работе',h=>h.st==='work'],rest:['Отдых и ветеринар',h=>h.st!=='work'],club:['Клубные',h=>h.own==='club'],stay:['На постое',h=>h.own==='stay']};
 const L=HORSES.filter(F[hF][1]);
 return `<div class="hd"><div><h2>Лошади</h2><p>Каждая лошадь — со своим пределом нагрузки в день, уровнем всадников, ковкой и прививками. Лошадь на отдыхе или у ветеринара не появится в записи ни в приложении, ни у администратора.</p></div><div class="btns"><button class="bt p" onclick="toast('Новая лошадь: кличка, порода, возраст, уровень всадников, предел занятий в день, денник, владелец.')">+ Лошадь</button></div></div>
 <div class="wid"><div><small>Всего</small><b>${HORSES.length}</b><span>в демо; в клубе — 42</span></div><div><small>В работе</small><b class="g">${HORSES.filter(h=>h.st==='work').length}</b><span>сегодня</span></div><div><small>Отдых и ветеринар</small><b class="w">${HORSES.filter(h=>h.st!=='work').length}</b><span>не попадают в запись</span></div><div><small>На постое</small><b>${HORSES.filter(h=>h.own==='stay').length}</b><span>работают только с владельцем</span></div><div><small>Ковка за 7 дней</small><b class="i">${VETS.filter(v=>v.k==='Ковка'&&v.st==='plan').length}</b><span>кузнец — понедельник и среда</span></div></div>
 <div class="filt">${Object.entries(F).map(([k,v])=>`<button class="${k===hF?'on':''}" onclick="hF='${k}';render()">${v[0]} · ${HORSES.filter(v[1]).length}</button>`).join('')}</div>
 <div class="hgrid">${L.map(h=>{const n=hLoad(h.id);return `<div class="hbox ${h.st}" onclick="openHorse('${h.id}')"><div class="hb-top"><i style="background:${h.c}"></i><div><b>${esc(h.n)}</b><span>${esc(h.br)} · ${h.sex}, ${h.age} лет</span></div><span class="tag ${HST[h.st].c}">${HST[h.st].n}</span></div>
  <div class="hb-m"><div><small>Денник</small><b>${h.stall}</b></div><div><small>Уровень</small><b>${LVL[h.lvl].n}</b></div><div><small>Сегодня</small><b class="${n>=h.max?'red':''}">${n} из ${h.max}</b></div><div><small>Ковка</small><b>${dd(h.far)}</b></div></div>
  ${h.own==='stay'?`<div class="mini">Постой · владелец ${esc(h.ownr)}</div>`:''}${h.note?`<div class="mini">${esc(h.note)}</div>`:''}</div>`}).join('')}</div>`};
function openHorse(id){if(!allowed('horse')){toast('Карточка лошади этой роли недоступна.');return}curHorse=id;go('horse')}

/* ===== Карточка лошади ===== */
SC.horse=()=>{
 const h=HO(curHorse);const my=SLOTS.filter(s=>s.h.includes(h.id)&&s.st!=='cancel');const vv=VETS.filter(v=>v.h===h.id);
 const wk=[3,2,3,1,0,2,my.length];
 return `<div class="hd"><div><div class="crumbl"><a onclick="go('horses')">Лошади</a> / ${esc(h.n)}</div><h2>${esc(h.n)}</h2><p>${esc(h.br)} · ${h.sex}, ${h.age} лет · ${h.w} кг · денник ${h.stall} · ${h.own==='club'?'клубная':'постой, владелец '+esc(h.ownr)}</p></div><div class="btns"><select class="rsel" onchange="openHorse(this.value)">${HORSES.map(x=>`<option value="${x.id}" ${x.id===h.id?'selected':''}>${esc(x.n)}</option>`).join('')}</select>
  <div class="seg">${Object.entries(HST).map(([k,v])=>`<button class="${h.st===k?'on':''}" onclick="setHst('${k}')">${v.n}</button>`).join('')}</div></div></div>
 ${h.note?`<div class="note"><b>Заметка.</b> ${esc(h.note)}</div>`:''}
 <div class="g3"><div class="pan"><h3>Нагрузка</h3><div class="hload"><b class="${my.length>=h.max?'red':''}">${my.length} / ${h.max}</b><span>занятий сегодня из допустимого</span></div>
  <div class="wkbars">${wk.map((n,i)=>`<div><i style="height:${n*22+4}px" class="${n>=h.max?'r':''}"></i><small>${dow(addDays(TODAY,i-6))}</small></div>`).join('')}</div>
  <p class="mini">Предел меняет старший тренер или ветеринар. После двух дней на пределе система предложит день отдыха.</p></div>
 <div class="pan"><h3>Сегодня</h3>${my.map(s=>`<div class="kv" onclick="card('slot','${s.id}')" style="cursor:pointer"><span>${s.t} · ${esc(slotWho(s))}</span><b>${esc(TR(s.tr).s)}</b></div>`).join('')||'<p class="mini">Сегодня не работает.</p>'}
  <h3 style="margin-top:12px">Кто может ездить</h3><p class="mini">${h.own==='stay'?'Только владелец и Данияр С. — в приложении другим не показывается.':'Всадники уровня «'+LVL[h.lvl].n+'»'+(h.lvl==='pro'?' и выше':' и выше; спортивные — по согласованию тренера')+'.'}</p></div>
 <div class="pan"><h3>Уход</h3>${[['Ковка',dl(h.far)],['Прививки до',dl(h.vac)],['Рацион','овёс 4 кг, сено 9 кг, 2 раза'],['Седло и амуниция','седло №'+h.stall.replace('-','')+', трензель'],['Последний осмотр','24.10 · без замечаний']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div></div>
 <div class="pan"><h3>Журнал ветеринара и кузнеца</h3>${vv.map(v=>`<div class="li"><i>${dd(v.d)}</i><span><b>${esc(v.k)}</b> — ${esc(v.t)} · ${esc(STAFF[v.who]||v.who)} ${v.st==='plan'?tag('запланировано','i'):tag('сделано','g')}</span></div>`).join('')||'<p class="mini">Записей нет — всё по плану.</p>'}</div>`};
function setHst(k){const h=HO(curHorse);h.st=k;render();toast(k==='work'?`${esc(h.n)} снова в работе — появилась в записи.`:`${esc(h.n)}: ${HST[k].n}. Из записи убрана, всадникам на будущие занятия предложена замена лошади.`)}

/* ===== Ветеринар и ковка ===== */
SC.vet=()=>{
 const plan=VETS.filter(v=>v.st==='plan').sort((a,b)=>a.d<b.d?-1:1),done=VETS.filter(v=>v.st==='done');
 return `<div class="hd"><div><h2>Ветеринар и ковка</h2><p>План на две недели: ковка, прививки, зубы, глистогонка, осмотры. В день ковки лошадь автоматически не ставится на утренние занятия.</p></div><div class="btns"><button class="bt p" onclick="toast('Новая запись в журнал: лошадь, что сделано, кто, следующая дата — напоминание придёт ветеринару и конюху.')">+ Запись</button></div></div>
 <div class="days">${[0,1,2,3,4,5,6,7,8].map(i=>{const d=addDays(TODAY,i);const n=plan.filter(v=>v.d===d);return `<div class="day ${n.length>1?'warn':''}"><small>${dow(d)} ${dd(d)}</small><span>${n.map(v=>esc(HO(v.h).n)).join(', ')||'—'}</span><b>${n.length?n.map(v=>v.k).join(', '):''}</b></div>`}).join('')}</div>
 <div class="g2" style="margin-top:12px"><div class="pan"><h3>Запланировано</h3>${plan.map(v=>`<div class="li" onclick="openHorse('${v.h}')" style="cursor:pointer"><i>${dd(v.d)}</i><span><b>${esc(HO(v.h).n)} · ${esc(v.k)}</b> — ${esc(v.t)}<br><small class="mini">${esc(STAFF[v.who]||v.who)}</small></span></div>`).join('')}</div>
 <div class="pan"><h3>Сделано</h3>${done.map(v=>`<div class="li ok"><i>${dd(v.d)}</i><span><b>${esc(HO(v.h).n)} · ${esc(v.k)}</b> — ${esc(v.t)}</span></div>`).join('')}
  <h3 style="margin-top:12px">Прививки истекают</h3>${HORSES.slice().sort((a,b)=>a.vac<b.vac?-1:1).slice(0,4).map(h=>`<div class="kv"><span>${esc(h.n)}</span><b>${dl(h.vac)}</b></div>`).join('')}</div></div>`};

/* ===== Манежи и левады ===== */
SC.arenas=()=>`<div class="hd"><div><h2>Манежи и левады</h2><p>У каждой площадки — вместимость и часы работы. Запись сверх вместимости невозможна. Новая левада добавляется одной строкой — и сразу появляется в приложении.</p></div></div>
 <div class="agrid">${ARENAS.map(a=>{const sl=SLOTS.filter(s=>s.ar===a.id&&s.st!=='cancel');const r=sl.reduce((x,s)=>x+riders(s),0);return `<div class="abox ${a.st}"><div class="ab-h"><b>${esc(a.n)}</b>${a.st==='soon'?tag('с 7 ноября','w'):tag('открыта','g')}</div><p>${esc(a.d)}</p>
  ${[['Вместимость',a.cap+' всадников'],['Занятий сегодня',sl.length],['Всадников сегодня',r],['Загрузка',a.st==='soon'?'—':pct(r,a.cap*HOURS.length)+'%']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}
  ${a.st==='soon'?`<button class="bt p sm" onclick="openLev()">Открыть запись с 7 ноября</button>`:''}</div>`}).join('')}</div>
 ${said('«Мы поставили на стоп продажу абонементов и ждём второе место — леваду, где обучение проходит… через неделю-две откроется.»','Когда левада откроется — одна кнопка: площадка появляется в расписании и в приложении, стоп-продажа снимается, очередь на покупку получает предложение.')}`;
function openLev(){const a=AR('A4');a.st='open';a.d='обучение новичков · открыта';stopSale=false;render();toast('Левада 2 открыта с 7 ноября: +4 места в час. Стоп-продажа снята, 31 человеку из очереди на покупку ушло предложение купить абонемент.')}

