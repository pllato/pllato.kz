
const SC={};
const bar=(w,c)=>`<div class="bar"><i class="${c||''}" style="--w:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const prog=p=>{const pl=stageSum(p,2),f=p.stages.reduce((a,s)=>a+s[2]*s[1]/100,0);return {pl,fact:stageSum(p,3),earned:f}};

/* ===== Пульт руководителя ===== */
SC.today=()=>{
 const F=FIELD();const on=F.filter(s=>MARKS[s.id]&&['ok','late','far'].includes(MARKS[s.id][1])).length;
 const late=F.filter(s=>MARKS[s.id]&&MARKS[s.id][1]==='late');const none=F.filter(s=>MARKS[s.id]&&MARKS[s.id][1]==='none');const far=F.filter(s=>MARKS[s.id]&&MARKS[s.id][1]==='far');
 const tot=PROJECTS.reduce((a,p)=>a+p.budget,0);
 const al=[
  ['r','Склад «LogiPark»: труд дороже плана на 12%','Металлокаркас — 10,6 млн вместо 8,8 млн. Наряд N-3022 уже 41 ч из 36.',"openP('P3')"],
  ['r','Школа № 12 отстаёт: сдача 10 ноября','Готово 91%, водосток — 40%. Нужно +2 кровельщика на неделю.',"openP('P5')"],
  ['w',`${far.length} отметка вне объекта`,far.map(s=>s.n).join(', ')+' — отметился в 2,4 км от школы. Прораб уточняет.',"go('time')"],
  ['w',`${late.length} опоздали, ${none.length} не вышел`,late.concat(none).map(s=>s.n.split(' ')[0]).join(', ')+' — часы посчитаны с фактического прихода.',"go('time')"],
  ['w',`Допуск истёк: ${FIELD().filter(s=>s.dop<TODAY).length} чел.`,FIELD().filter(s=>s.dop<TODAY).map(s=>s.n).join(', ')+' — система не даст поставить на высотные работы.',"go('safety')"],
  ['i','2 заявки на материалы ждут решения','Бетон на 31.10 и водосток для школы — 2,5 млн.',"go('materials')"]
 ];
 return `<div class="hd"><div><h2>Пульт руководителя</h2><p>Пятница, 30 октября. Пять объектов, 25 человек: кто где работает, сколько часов ушло и во что это обходится — без звонков прорабам и Excel-табелей.</p></div><div class="btns"><button class="bt" onclick="go('map')">Где люди</button><button class="bt p" onclick="go('cost')">Маржа по проектам</button></div></div>
 <div class="kpi">
  <div><small>НА ОБЪЕКТАХ СЕЙЧАС</small><b>${on} из ${F.length}</b><span class="g">отметились с телефона</span></div>
  <div><small>ЧАСОВ СЕГОДНЯ</small><b>${Math.round(F.reduce((a,s)=>a+(MARKS[s.id]&&MARKS[s.id][0]?Math.max(0,minsSince(MARKS[s.id][0])):0),0)/60)} ч</b><span>к 18:00 будет ≈ 170 ч</span></div>
  <div><small>ПРОЕКТОВ В РАБОТЕ</small><b>${PROJECTS.length}</b><span>портфель ${mln(tot)} ₸</span></div>
  <div><small>ФОТ ОКТЯБРЯ</small><b>${mln(STAFF.reduce((a,s)=>a+monthHours(s.id)/60*s.rate,0)+6*650000)} ₸</b><span>по часам из системы</span></div>
  <div><small>МАРЖА ПОРТФЕЛЯ</small><b>21,4%</b><span class="w">план 24% · LogiPark тянет вниз</span></div>
 </div>
 <div class="g21"><div class="pan"><h3>Проекты сегодня</h3><p>Готовность, освоение бюджета на труд и люди на объекте.</p>
  ${PROJECTS.map(p=>{const g=prog(p);const ppl=FIELD().filter(s=>s.p===p.id&&MARKS[s.id]&&MARKS[s.id][0]).length;return `<div class="prow2" onclick="openP('${p.id}')"><i style="background:${p.c}"></i><div><b>${esc(p.n)}</b><span>${esc(p.k)} · ${ppl} чел. на объекте</span></div><div class="pr-b">${bar(p.prog,'b')}<small>готово ${p.prog}%</small></div><div class="pr-b">${bar(pct(g.fact,g.pl),g.fact>g.earned*1.05?'r':'g')}<small>труд ${pct(g.fact,g.pl)}% бюджета</small></div>${tag(PST[p.st][0],PST[p.st][1])}</div>`}).join('')}</div>
 <div class="pan"><h3>Требует решения</h3>${al.map(a=>`<div class="al ${a[0]}" onclick="${a[3]}"><b>${esc(a[1])}</b><span>${esc(a[2])}</span></div>`).join('')}</div></div>
 ${said('«25 человек в команде. Нужен учёт проектов и времени работы сотрудников.»','Каждый отмечается на объекте с телефона, часы ложатся на проект и этап, а из часов и ставок считается себестоимость — руководитель видит маржу каждого объекта в моменте, а не после сдачи.')}`};

/* ===== Где люди сейчас ===== */
SC.map=()=>{const pos={P1:[62,30],P2:[44,52],P3:[84,18],P4:[30,70],P5:[70,62]};
 return `<div class="hd"><div><h2>Где люди сейчас</h2><p>Отметка прихода с телефона проверяет геолокацию: человек должен быть в радиусе объекта. Отметка «вне объекта» сразу видна прорабу и руководителю.</p></div></div>
 <div class="g21"><div class="pan mapw"><svg viewBox="0 0 100 80" class="cmap"><path d="M0 40 Q30 34 50 44 T100 38" class="rd"/><path d="M40 0 Q46 40 38 80" class="rd"/><path d="M0 64 L100 58" class="rd2"/>
  ${PROJECTS.map(p=>{const [x,y]=pos[p.id];const n=FIELD().filter(s=>s.p===p.id&&MARKS[s.id]&&MARKS[s.id][0]).length;return `<g onclick="openP('${p.id}')" class="pin"><circle cx="${x}" cy="${y}" r="6" fill="${p.c}" opacity=".18"/><circle cx="${x}" cy="${y}" r="2.6" fill="${p.c}"/><text x="${x+4}" y="${y-3}">${esc(p.n.split(',')[0])}</text><text x="${x+4}" y="${y+1.5}" class="sm">${n} чел.</text></g>`}).join('')}
  <circle cx="58" cy="70" r="1.8" fill="#ef4444"/><text x="61" y="71" class="sm r">Талгат С. · вне объекта</text></svg></div>
 <div class="pan"><h3>По объектам</h3>${PROJECTS.map(p=>{const L=FIELD().filter(s=>s.p===p.id);return `<div class="obj"><b><i style="background:${p.c}"></i>${esc(p.n)}</b>${L.map(s=>{const m=MARKS[s.id]||['','none'];return `<div class="kv"><span>${esc(s.n)} · ${esc(s.pos.toLowerCase())}</span><b>${m[0]||'—'} ${tag(MST[m[1]][0],MST[m[1]][1])}</b></div>`}).join('')}</div>`}).join('')}</div></div>`};

/* ===== Проекты ===== */
SC.projects=()=>`<div class="hd"><div><h2>Все проекты</h2><p>Каждый объект — с бюджетом, графиком, командой и фактическими часами. Новый проект создаётся из сметы: этапы и бюджет на труд подтягиваются сами.</p></div><div class="btns"><button class="bt p" onclick="toast('Новый проект: заказчик, адрес, смета Excel → этапы и бюджет, руководитель, прораб.')">+ Проект</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Проект</th><th>Заказчик</th><th>Руководитель · прораб</th><th class="r">Бюджет</th><th>Готово</th><th>Труд: факт / план</th><th>Срок</th><th>Статус</th></tr></thead><tbody>${PROJECTS.map(p=>{const g=prog(p);return `<tr onclick="openP('${p.id}')"><td><b><i class="dot" style="background:${p.c}"></i>${esc(p.n)}</b><div class="mini">${esc(p.k)}</div></td><td>${esc(p.cl)}</td><td>${esc(SF(p.pm).n)}<div class="mini">${esc(SF(p.fore).n)}</div></td><td class="r mono">${mln(p.budget)}</td><td style="min-width:110px">${bar(p.prog,'b')}<span class="mini">${p.prog}%</span></td><td class="mono">${mln(g.fact)} / ${mln(g.pl)}</td><td class="mono">${dd(p.end)}.${p.end.slice(2,4)}</td><td>${tag(PST[p.st][0],PST[p.st][1])}</td></tr>`}).join('')}</tbody></table></div>`;
function openP(id){curP=id;go(allowed('project')?'project':'projects')}

/* ===== Карточка проекта ===== */
SC.project=()=>{const p=PR(curP);const g=prog(p);const team=FIELD().filter(s=>s.p===p.id);const T=TASKS.filter(t=>t.p===p.id);
 return `<div class="hd"><div><div class="crumbl"><a onclick="go('projects')">Проекты</a> / ${esc(p.n)}</div><h2>${esc(p.n)}</h2><p>${esc(p.k)} · ${esc(p.cl)} · ${esc(p.addr)} · ${dd(p.start)} — ${dd(p.end)}</p></div><div class="btns"><select class="rsel" onchange="openP(this.value)">${PROJECTS.map(x=>`<option value="${x.id}" ${x.id===p.id?'selected':''}>${esc(x.n)}</option>`).join('')}</select><button class="bt p" onclick="go('acts')">Акт за месяц</button></div></div>
 <div class="kpi"><div><small>БЮДЖЕТ ПРОЕКТА</small><b>${mln(p.budget)} ₸</b><span>по договору</span></div><div><small>ГОТОВНОСТЬ</small><b>${p.prog}%</b><span>по этапам</span></div><div><small>ТРУД ПО ПЛАНУ</small><b>${mln(g.pl)} ₸</b><span>заложено в смете</span></div><div><small>ТРУД ФАКТ</small><b class="${g.fact>g.earned*1.05?'r':''}">${mln(g.fact)} ₸</b><span>${g.fact>g.earned*1.05?'дороже выполненного объёма':'в пределах объёма'}</span></div><div><small>КОМАНДА</small><b>${team.length} чел.</b><span>прораб ${esc(SF(p.fore).n.split(' ')[0])}</span></div></div>
 <div class="pan"><h3>Этапы: выполнено и сколько стоил труд</h3><p>Освоено — сколько труда «заработано» выполненным объёмом. Если факт больше освоенного — этап идёт дороже сметы.</p><div class="tw"><table class="t"><thead><tr><th>Этап</th><th>Готово</th><th class="r">Труд по смете</th><th class="r">Освоено</th><th class="r">Факт по часам</th><th class="r">Отклонение</th></tr></thead><tbody>${p.stages.map(s=>{const e=s[2]*s[1]/100,d=s[3]-e;return `<tr><td><b>${esc(s[0])}</b></td><td style="min-width:120px">${bar(s[1],'b')}<span class="mini">${s[1]}%</span></td><td class="r mono">${tg(s[2])}</td><td class="r mono">${tg(e)}</td><td class="r mono">${tg(s[3])}</td><td class="r mono ${d>e*0.05&&d>0?'red':'grn'}">${d>0?'+':''}${tg(d)}</td></tr>`}).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Наряды</h3>${T.map(t=>`<div class="kv"><span><b>${t.id}</b> ${esc(t.t)}<br><small class="mini">${t.who.map(w=>SF(w).n.split(' ')[0]).join(', ')} · до ${dd(t.due)}</small></span><b>${t.fact} / ${t.plan} ч</b></div>`).join('')||'<p class="mini">Нарядов нет.</p>'}</div>
 <div class="pan"><h3>Команда сегодня</h3>${team.map(s=>{const m=MARKS[s.id]||['','none'];return `<div class="kv"><span>${esc(s.n)} · ${esc(s.pos.toLowerCase())}</span><b>${m[0]||'—'} ${tag(MST[m[1]][0],MST[m[1]][1])}</b></div>`}).join('')}</div></div>`};

/* ===== График ===== */
SC.gantt=()=>{const a=new Date('2026-04-01'),b=new Date('2027-07-01'),W=b-a;const x=d=>((new Date(d)-a)/W*100);const months=['апр','май','июн','июл','авг','сен','окт','ноя','дек','янв','фев','мар','апр','май','июн'];
 return `<div class="hd"><div><h2>График работ</h2><p>Все проекты на одной шкале: сроки договоров, готовность и сегодняшний день. Отставание видно до того, как заказчик позвонит.</p></div></div>
 <div class="pan gnt"><div class="gm">${months.map(m=>`<span>${m}</span>`).join('')}</div>${PROJECTS.map(p=>`<div class="gr" onclick="openP('${p.id}')"><b>${esc(p.n)}</b><div class="gl"><i style="left:${x(p.start)}%;width:${x(p.end)-x(p.start)}%;background:${p.c}33;border-color:${p.c}"><em style="width:${p.prog}%;background:${p.c}"></em></i></div></div>`).join('')}<div class="gtoday" style="left:calc(220px + (100% - 220px) * ${x(TODAY)/100})"><span>сегодня</span></div></div>
 <div class="pan"><h3>Этапы проекта «${esc(PR(curP).n)}»</h3>${PR(curP).stages.map(s=>`<div class="hl"><span>${esc(s[0])}</span>${bar(s[1],'b')}<b>${s[1]}%</b></div>`).join('')}</div>`};

/* ===== Наряды и задачи ===== */
SC.tasks=()=>`<div class="hd"><div><h2>Наряды и задачи</h2><p>Прораб выдаёт наряд бригаде с плановыми часами. Рабочие отмечают время на наряде в телефоне. Приёмка — с фото. Перерасход часов виден сразу.</p></div><div class="btns"><button class="bt p" onclick="newTask()">+ Наряд</button></div></div>
 <div class="board">${Object.entries(TST).map(([k,v])=>{const L=TASKS.filter(t=>t.st===k);return `<div class="bcol"><div class="bh"><b>${v[0]}</b><span>${L.length}</span></div>${L.map(t=>`<div class="oc ${t.fact>t.plan?'over':''}" onclick="advTask('${t.id}')"><small>${t.id} · ${esc(PR(t.p).n.split(',')[0])}</small><b>${esc(t.t)}</b><span>${t.who.map(w=>SF(w).n.split(' ')[0]).join(', ')} · до ${dd(t.due)}</span>${bar(pct(t.fact,t.plan),t.fact>t.plan?'r':'g')}<em>${t.fact} из ${t.plan} ч${t.fact>t.plan?' · перерасход':''}</em></div>`).join('')}</div>`}).join('')}</div>
 <p class="mini">Нажмите на наряд — он перейдёт на следующий этап: в работе → на приёмке → принят.</p>`;
function advTask(id){const t=TASKS.find(x=>x.id===id);t.st=t.st==='go'?'check':t.st==='check'?'done':'done';render();toast(t.st==='check'?`${t.id} отправлен на приёмку — прорабу пришло уведомление с фото.`:`${t.id} принят. Часы закрыты на этап, сдельщикам начислено.`)}
function newTask(){TASKS.unshift({id:'N-'+(1050+TASKS.length),p:'P1',t:'Монтаж опалубки плиты 9 этажа',who:['ДМ','АК','ДЖ'],plan:30,fact:0,st:'go',due:addDays(TODAY,4)});render();toast('Наряд выдан бригаде: у троих рабочих он появился в телефоне.')}
