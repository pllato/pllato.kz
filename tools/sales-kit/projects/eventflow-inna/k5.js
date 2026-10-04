
/* ===== Портфель проектов ===== */
const myProj=()=>PROJECTS.filter(p=>role!=='Проджект-менеджер'||p.pm==='RT');
SC.projects=()=>{
 const L=myProj();const t0='2026-08-24',days=126;const x=d=>Math.max(0,Math.min(100,daysBetween(t0,d)/days*100));
 const weeks=[];for(let i=0;i<days;i+=7)weeks.push(addDays(t0,i));
 const rows=[...L.map(p=>({id:p.id,P:1,t:p.t,cl:p.cl,from:p.from,to:p.to,st:p.st,c:PSTOF(p.st).c})),...DEALS.filter(d=>['confirmed','contract'].includes(d.st)).map(d=>({id:d.id,P:0,t:d.t,cl:d.cl,from:d.date,to:d.date,st:d.st,c:'#a39b92'}))].sort((a,b)=>a.from<b.from?-1:1);
 return `<div class="hd"><div><h2>Портфель проектов</h2><p>После аванса сделка становится проектом сама: смета → бюджет, менеджер и клиентский сервис остаются в команде, добавляется проджект. Сверху — календарь агентства, ниже — карточки.</p></div><div class="btns"><button class="bt" onclick="go('tasks')">Задачи команды</button></div></div>
 <div class="pan gantt"><div class="gh">${weeks.map(w=>`<span style="left:${x(w)}%">${dd(w)}</span>`).join('')}<i class="now" style="left:${x(TODAY)}%"></i></div>
  ${rows.map(r=>`<div class="gr" onclick="${r.P?`openProj('${r.id}')`:`openDeal('${r.id}')`}"><div class="gl"><b>${esc(CL(r.cl).n)}</b><span>${esc(r.t)}</span></div><div class="gt"><i style="left:${x(r.from)}%;width:${Math.max(1.2,x(addDays(r.to,1))-x(r.from))}%;--c:${r.c}" class="${r.P?'':'tent'}"></i><i class="now" style="left:${x(TODAY)}%"></i></div></div>`).join('')}
  <div class="legend">${PST.map(s=>`<span><i style="background:${s.c}"></i>${s.n}</span>`).join('')}<span><i class="tent"></i>задел: подтверждён, не подписан</span></div></div>
 <div class="ogrid">${L.map(p=>`<div class="ocard" onclick="openProj('${p.id}')"><div class="oh"><b>${esc(CL(p.cl).n)}</b>${pstTag(p.st)}</div><p>${esc(p.t)}</p>
  <div class="kv"><span>Даты · город</span><b>${dd(p.from)}${p.to!==p.from?'–'+dd(p.to):''} · ${esc(p.city)}</b></div><div class="kv"><span>Проджект</span><b>${av(p.pm)} ${who(p.pm)}</b></div><div class="kv"><span>Бюджет</span><b>${mln(p.sum)}</b></div>
  <div class="bar"><i style="--w:${p.ready}%"></i></div><div class="om"><span>готовность ${p.ready}%</span><span>${dirTag(p.dir)}</span></div>${p.risk?`<div class="evr">${esc(p.risk)}</div>`:''}</div>`).join('')}</div>
 ${said('«Задачи по реализации мероприятия… они ведутся уже просто в Excel» · «от поступления заявки до вообще успешной реализации, включая все этапы производства — как-то фиксируется история проекта»')}`;
};

/* ===== Карточка проекта ===== */
const taskRow=t=>`<div class="tk ${t.st==='done'?'done':''}"><span class="bx ${t.st==='done'?'on':''}" onclick="event.stopPropagation();toggleTask('${t.id}')">${t.st==='done'?'✓':''}</span><div><b>${esc(t.t)}</b><span>${av(t.who)} ${who(t.who)} · до ${dd(t.due)} ${t.st!=='done'&&t.due<TODAY?'<span class="neg">просрочено</span>':''}</span></div><span class="pri" style="--c:${PRI[t.pr][1]}">${PRI[t.pr][0]}</span></div>`;
function toggleTask(id){const t=TASKS.find(x=>x.id===id);if(!t)return;t.st=t.st==='done'?'todo':'done';const p=PR(t.ref);if(p){const all=TASKS.filter(x=>x.ref===p.id);p.ready=Math.max(p.ready,Math.round(all.filter(x=>x.st==='done').length/all.length*100))}render();toast(t.st==='done'?'Задача закрыта — руководитель и команда видят это сразу.':'Задача снова открыта.')}
SC.project=()=>{
 const p=PR(curProj)||PROJECTS[0];const si=PST.findIndex(s=>s.k===p.st);const B=BUDGET[p.id];
 return `<div class="crumb"><a onclick="go('projects')">Портфель</a> › ${esc(CL(p.cl).n)}</div>
 <div class="hd"><div><h2>${esc(p.t)}</h2><p>${clL(p.cl)} · ${dirTag(p.dir)} · ${dl(p.from)}${p.to!==p.from?' — '+dl(p.to):''} · ${esc(p.city)} · проджект ${av(p.pm)} ${esc(TEAM[p.pm].f)}</p></div>
  <div class="btns"><button class="bt" onclick="curChat='p1in';go('chats')">Чат проекта</button><button class="bt" onclick="go('ros')">Тайминг дня</button>${si<PST.length-1?`<button class="bt p" onclick="PR('${p.id}').st='${PST[Math.min(si+1,PST.length-1)].k}';render();toast('Этап проекта изменён — команда получила уведомление.')">→ ${PST[Math.min(si+1,PST.length-1)].n}</button>`:''}</div></div>
 <div class="steps">${PST.map((s,i)=>`<div class="stp ${i<si?'done':i===si?'on':''}"><i>${i<si?'✓':i+1}</i>${s.n}</div>`).join('')}</div>
 ${p.risk?`<div class="al r" style="margin-bottom:12px"><b>Риск</b><span>${esc(p.risk)}</span></div>`:''}
 <div class="g21"><div>
  <div class="pan"><h3>Задачи проекта</h3><p>Каждая задача — с ответственным и сроком. У Руслана она в «Моих задачах», у Инны — в общей картине.</p>${TASKS.filter(t=>t.ref===p.id).map(taskRow).join('')||'<p class="mini">Задач пока нет.</p>'}<button class="bt" onclick="card('task','${p.id}')">+ Задача</button></div>
  ${B?`<div class="pan"><h3>Бюджет: план и факт по статьям</h3><div class="tw"><table class="t"><thead><tr><th>Статья</th><th>Подрядчик</th><th class="r">План</th><th class="r">Факт</th><th>Статус</th></tr></thead><tbody>${B.map(b=>`<tr><td>${esc(b.n)}</td><td class="mini">${esc(b.c)}</td><td class="r">${fmt(b.plan)}</td><td class="r">${fmt(b.fact)}</td><td><span class="tag">${esc(b.st)}</span></td></tr>`).join('')}<tr class="total"><td>Итого себестоимость</td><td></td><td class="r">${fmt(B.reduce((a,b)=>a+b.plan,0))}</td><td class="r">${fmt(B.reduce((a,b)=>a+b.fact,0))}</td><td></td></tr></tbody></table></div>
   <div class="kv"><span>Клиент платит</span><b>${tg(p.sum)}</b></div><div class="kv"><span>Оплачено клиентом</span><b>${tg(p.paid)}</b></div><div class="kv"><span>Маржа по плану</span><b class="pos">${tg(p.sum-B.reduce((a,b)=>a+b.plan,0))} · ${pct(p.sum-B.reduce((a,b)=>a+b.plan,0),p.sum)}%</b></div></div>`:`<div class="pan"><h3>Бюджет</h3><div class="kv"><span>Клиент платит</span><b>${tg(p.sum)}</b></div><div class="kv"><span>Себестоимость план · факт</span><b>${tg(p.plan)} · ${tg(p.fact)}</b></div><div class="kv"><span>Оплачено клиентом</span><b>${tg(p.paid)}</b></div></div>`}
 </div><div>
  <div class="pan"><h3>Рабочая группа</h3><p>Только команда агентства — внутренний чат проекта.</p>${p.team.map(k=>`<div class="mem">${av(k)}<div><b>${esc(TEAM[k].f)}</b><span>${esc(TEAM[k].r)}</span></div></div>`).join('')}</div>
  <div class="pan"><h3>Клиентская группа</h3><p>WhatsApp-группа с рабочего номера: клиент пишет из обычного WhatsApp, переписка падает сюда.</p>
   <div class="mem"><span class="av cl">КЛ</span><div><b>${esc(CL(p.cl).contact)}</b><span>представитель клиента</span></div></div>
   ${[p.team.find(k=>['AB','TM','DS'].includes(k)),'MK',p.pm].filter(Boolean).map(k=>`<div class="mem">${av(k)}<div><b>${esc(TEAM[k].f)}</b><span>${esc(TEAM[k].r)}</span></div></div>`).join('')}</div>
  <div class="pan"><h3>Реквизит</h3>${BOOK.filter(b=>b.ref===p.id).map(b=>`<div class="kv"><span>${esc(RP(b.p).n)}</span><b>${b.q} шт · ${dd(b.from)}</b></div>`).join('')||'<p class="mini">Нет броней.</p>'}<button class="bt" onclick="go('propcal')">Брони по датам</button></div>
  <div class="pan"><h3>Документы</h3>${DOCS.filter(x=>x.ref===p.id).map(x=>`<div class="kv"><span>${esc(x.k)} ${esc(x.no)}</span><b>${DOCST[x.st][0]}</b></div>`).join('')||'<p class="mini">Нет документов.</p>'}</div>
 </div></div>`;
};

/* ===== Задачи ===== */
let taskMode='all';
SC.tasks=()=>{
 const me=myKey();const L=TASKS.filter(t=>taskMode==='mine'?t.who===me:true).filter(t=>role!=='Склад реквизита'||t.who==='SE'||taskMode==='all').sort((a,b)=>a.st==='done'?1:b.st==='done'?-1:a.due<b.due?-1:1);
 const people=[...new Set(L.map(t=>t.who))];
 return `<div class="hd"><div><h2>Задачи команды</h2><p>Задача ставится в карточке проекта или сделки и сразу появляется у ответственного. Руководитель видит всё: кто, что, к какому сроку, что просрочено.</p></div>
  <div class="btns"><div class="seg"><button class="${taskMode==='mine'?'on':''}" onclick="taskMode='mine';render()">Мои</button><button class="${taskMode==='all'?'on':''}" onclick="taskMode='all';render()">Вся команда</button></div><button class="bt p" onclick="card('task','P1')">+ Задача</button></div></div>
 <div class="g3">${[['Сегодня и раньше',L.filter(t=>t.st!=='done'&&t.due<=TODAY).length,'r'],['На неделе',L.filter(t=>t.st!=='done'&&t.due>TODAY&&t.due<=addDays(TODAY,7)).length,''],['Закрыто',L.filter(t=>t.st==='done').length,'g']].map(x=>`<div class="pan stat"><small>${x[0]}</small><b class="${x[2]==='r'?'neg':x[2]==='g'?'pos':''}">${x[1]}</b></div>`).join('')}</div>
 ${people.map(k=>`<div class="pan"><h3>${av(k)} ${esc(TEAM[k].f)} <span class="mini">· ${esc(TEAM[k].r)}</span></h3>${L.filter(t=>t.who===k).map(t=>taskRow(t).replace('</b><span>',`</b><span>${refL(t.ref)} · `)).join('')}</div>`).join('')||'<div class="pan"><p class="mini">Задач нет.</p></div>'}`;
};

/* ===== Тайминг дня ===== */
let rosNow=6;
function shiftRos(i,m){ROS.forEach((r,j)=>{if(j>=i){const [h,mm]=r.t.split(':').map(Number);const t=h*60+mm+m;r.t=String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')}});render();toast(`Тайминг сдвинут на ${m} минут начиная с «${esc(ROS[i].n)}». Команда и клиентская группа получили обновление.`)}
SC.ros=()=>`<div class="hd"><div><h2>Тайминг дня · гала-ужин 18 октября</h2><p>${projL('P1')} · караван-сарай, Туркестан. Поминутный план с зонами и ответственными; на площадке проджект отмечает пункты с телефона, сдвиг тайминга уходит всей команде.</p></div>
  <div class="btns"><button class="bt" onclick="act('rosprint')">PDF для подрядчиков</button></div></div>
 <div class="ros">${ROS.map((r,i)=>`<div class="rr ${r.done?'done':''} ${i===rosNow?'now':''}"><span class="rt">${r.t}</span><span class="rd">${r.d} мин</span><div class="rn"><b>${esc(r.n)}</b><span>${esc(r.z)} · ${av(r.who)} ${who(r.who)}</span></div>
  <div class="ra"><span class="bx ${r.done?'on':''}" onclick="ROS[${i}].done=!ROS[${i}].done;rosNow=ROS.findIndex(x=>!x.done);render()">${r.done?'✓':''}</span><button class="bt" onclick="shiftRos(${i},15)">+15 мин</button></div></div>`).join('')}</div>
 ${said('«Создаётся рабочая группа по проекту… и создаётся клиентская группа» ','Тайминг виден обеим группам: команде — с подрядчиками и зонами, клиенту — программа для гостей.')}`;

/* ===== Подрядчики ===== */
SC.contractors=()=>`<div class="hd"><div><h2>Подрядчики</h2><p>База подрядчиков с условиями и рейтингом по прошлым проектам: проджект выбирает подрядчика в смету и бюджет, оценка ставится при закрытии проекта.</p></div><div class="btns"><button class="bt p" onclick="act('contr')">+ Подрядчик</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Подрядчик</th><th>Категория</th><th>Город</th><th>Условия</th><th class="r">Проектов с нами</th><th class="r">Рейтинг</th><th>Заметка</th></tr></thead><tbody>
 ${CONTRACTORS.map(c=>`<tr onclick="act('contrcard')"><td><b>${esc(c.n)}</b></td><td>${esc(c.cat)}</td><td>${esc(c.city)}</td><td>${esc(c.rate)}</td><td class="r">${c.proj}</td><td class="r"><b>${c.score.toFixed(1).replace('.',',')}</b> <span class="stars" style="--p:${c.score/5*100}%"></span></td><td class="mini">${esc(c.note)}</td></tr>`).join('')}
 </tbody></table></div>`;

/* ===== Чаты ===== */
const chatWho=k=>k==='CLIENT'?'Гаухар · Nomad Telecom':who(k);
function sendChat(){const i=document.getElementById('cmsg');if(!i||!i.value.trim())return;CHATS[curChat].msgs.push({w:myKey(),t:'11:58',m:i.value.trim()});render();toast(curChat==='p1cl'?'Сообщение ушло в WhatsApp-группу клиента с рабочего номера.':'Сообщение во внутреннем чате — клиент его не видит.')}
SC.chats=()=>{const c=CHATS[curChat];
 return `<div class="hd"><div><h2>Чаты · команда и клиент</h2><p>Внутренние чаты живут в системе — телефоны сотрудников подключать не нужно. Клиентская группа — это WhatsApp-группа рабочего номера: клиент пишет как обычно, команда видит и отвечает из системы.</p></div></div>
 <div class="chatw"><div class="chl">${Object.entries(CHATS).map(([k,x])=>`<a class="${k===curChat?'on':''}" onclick="curChat='${k}';render()"><b>${esc(x.n)}</b><span>${esc(x.kind)} · ${x.members.length} уч.</span></a>`).join('')}</div>
  <div class="chm"><div class="chh"><b>${esc(c.n)}</b><span>${esc(c.kind)} · ${c.members.map(m=>m==='CLIENT'?'клиент':who(m)).join(', ')}</span></div>
   <div class="chat">${c.msgs.map(m=>`<div class="msg ${m.w===myKey()?'out':m.w==='CLIENT'?'in cl':'in'}"><b>${esc(chatWho(m.w))}</b> ${esc(m.m)}<small>${m.t}</small></div>`).join('')}</div>
   <div class="send"><input id="cmsg" placeholder="${curChat==='p1cl'?'Ответ клиенту — уйдёт в WhatsApp':'Сообщение команде'}" onkeydown="if(event.key==='Enter')sendChat()"><button class="bt p" onclick="sendChat()">Отправить</button></div></div></div>
 ${said('«По каждому проекту создаётся рабочая группа, где только участники команды, и создаётся клиентская группа, в которую подключается представитель клиента, менеджер отдела продаж, клиентской службы и проджект»','Так и сделано: две группы на проект, обе привязаны к карточке. Клиент не видит внутреннюю переписку.')}`;
};
