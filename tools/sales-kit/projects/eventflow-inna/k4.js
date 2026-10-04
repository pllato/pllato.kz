
/* ===== Смета ===== */
let curEst='D2';
function estTotal(id){const e=EST[id];if(!e)return {cost:0,price:0,comm:0,client:0,mg:0};
 const L=e.lines.filter(l=>e.cr||l.cat!=='Сценография и креатив'||!/Концепция/.test(l.n));
 const cost=L.reduce((a,l)=>a+l.q*l.cost,0),price=L.reduce((a,l)=>a+l.q*l.price,0),comm=Math.round(price*e.comm/100),client=price+comm;
 return {cost,price,comm,client,mg:client-cost,mgp:pct(client-cost,client)}}
function setL(i,f,v){const e=EST[curEst];const n=+String(v).replace(/\s/g,'').replace(',','.');if(isNaN(n)||n<0){toast('Нужно число');render();return}e.lines[i][f]=n;render()}
function addLine(){const e=EST[curEst];const v=id=>document.getElementById(id).value.trim();const n=v('nl_n');if(!n){toast('Введите название статьи — любую: от аренды самолёта до флажков');return}
 e.lines.push({cat:v('nl_c'),n,c:v('nl_k')||'подрядчик',q:+v('nl_q')||1,u:'шт',cost:+v('nl_s')||0,price:+v('nl_p')||0});render();toast('Статья добавлена — смета и маржа пересчитаны.')}
function delLine(i){EST[curEst].lines.splice(i,1);render()}
function newEst(id){EST[id]={ver:1,comm:10,cr:!!DL(id).cr,vers:[{v:1,d:TODAY,sum:0,note:'Создана из шаблона «Конференция»'}],lines:EST.D2.lines.slice(0,6).map(l=>Object.assign({},l))};curEst=id;go('estimate');toast('Смета создана из шаблона: статьи можно менять, удалять, добавлять свои.')}
function saveVer(){const e=EST[curEst];const t=estTotal(curEst);e.vers[e.vers.length-1].sum=t.client;e.ver++;e.vers.push({v:e.ver,d:TODAY,sum:0,note:'Новая версия от '+dd(TODAY)});render();toast(`Версия v${e.ver-1} зафиксирована: ${tg(t.client)}. Работаем в v${e.ver}.`)}
SC.estimate=()=>{
 const d=DL(curEst);const e=EST[curEst];
 if(!e)return `<div class="hd"><div><h2>Смета · ${esc(d.t)}</h2><p>Сметы ещё нет.</p></div></div><div class="pan"><button class="bt p" onclick="newEst('${d.id}')">Создать из шаблона</button></div>`;
 const t=estTotal(curEst);
 const cats=[...new Set(e.lines.map(l=>l.cat))];
 return `<div class="crumb"><a onclick="openDeal('${d.id}')">${esc(CL(d.cl).n)} · ${esc(d.t)}</a> › смета</div>
 <div class="hd"><div><h2>Смета v${e.ver} · ${esc(CL(d.cl).n)}</h2><p>Индивидуальная смета без типовых услуг: любые статьи вручную, себестоимость подрядчика и цена клиенту в одной строке, агентская комиссия и маржа считаются сразу. Каждая отправленная версия сохраняется.</p></div>
  <div class="btns"><button class="bt" onclick="card('vers')">Сравнить версии</button><button class="bt" onclick="saveVer()">Зафиксировать версию</button><button class="bt p" onclick="card('kp','${d.id}')">Сформировать КП</button></div></div>
 <div class="vers">${e.vers.map(v=>`<div class="vr ${v.v===e.ver?'on':''}"><small>v${v.v} · ${dd(v.d)}</small><b>${v.sum?mln(v.sum):mln(t.client)}</b><span>${esc(v.note)}</span></div>`).join('')}</div>
 <div class="esum"><div><small>Себестоимость</small><b>${tg(t.cost)}</b></div><div><small>Цена статей клиенту</small><b>${tg(t.price)}</b></div><div><small>Комиссия, %</small><b><input class="qin" value="${e.comm}" onchange="EST[curEst].comm=+this.value||0;render()"> ${fmt(t.comm)}</b></div><div class="hi"><small>Итого клиенту</small><b>${tg(t.client)}</b></div><div><small>Маржа агентства</small><b class="${t.mgp<20?'warnt':'pos'}">${tg(t.mg)} · ${t.mgp}%</b></div><div><small>Креатив в смете</small><b><span class="sw ${e.cr?'on':''}" onclick="EST[curEst].cr=!EST[curEst].cr;render()"></span></b></div></div>
 <p class="mini" style="margin:-4px 0 10px">Бюджет клиента по брифу — до 23 млн. ${t.client<=23000000?'<b class="pos">Укладываемся.</b>':'<b class="neg">Выше бюджета на '+mln(t.client-23000000)+'.</b>'} Себестоимость и маржа в КП клиенту не попадают.</p>
 <div class="tw"><table class="t est"><thead><tr><th>Статья</th><th>Подрядчик</th><th class="r">Кол-во</th><th class="r">Себест. за ед.</th><th class="r">Цена клиенту за ед.</th><th class="r">Сумма клиенту</th><th class="r">Маржа</th><th></th></tr></thead><tbody>
 ${cats.map(c=>`<tr class="grp"><td colspan="8">${esc(c)}</td></tr>`+e.lines.map((l,i)=>l.cat!==c?'':`<tr class="${!e.cr&&/Концепция/.test(l.n)?'off':''}"><td><b>${esc(l.n)}</b></td><td class="mini">${esc(l.c)}</td>
  <td class="r"><input class="qin" value="${l.q}" onchange="setL(${i},'q',this.value)"> <small>${esc(l.u)}</small></td>
  <td class="r"><input class="qin w" value="${l.cost}" onchange="setL(${i},'cost',this.value)"></td>
  <td class="r"><input class="qin w" value="${l.price}" onchange="setL(${i},'price',this.value)"></td>
  <td class="r"><b>${fmt(l.q*l.price)}</b></td><td class="r ${l.price<=l.cost?'neg':''}">${pct(l.price-l.cost,l.price)}%</td><td><button class="xb" onclick="delLine(${i})" title="Удалить">×</button></td></tr>`).join('')).join('')}
 <tr class="add"><td><input id="nl_n" placeholder="Новая статья: например, аренда самолёта"></td><td><input id="nl_k" placeholder="подрядчик"></td><td class="r"><input id="nl_q" class="qin" placeholder="1"></td><td class="r"><input id="nl_s" class="qin w" placeholder="0"></td><td class="r"><input id="nl_p" class="qin w" placeholder="0"></td>
  <td colspan="2"><select id="nl_c">${EST_CATS.map(c=>`<option>${c}</option>`).join('')}</select></td><td><button class="bt p" onclick="addLine()">+</button></td></tr>
 </tbody></table></div>
 ${said('«У нас нет стандартных историй. Каждый проект индивидуальный… одна смета не похожа на другую, в одной смете нет типовых услуг» · «Всё что угодно — от аренды самолёта до…»','Поэтому здесь нет прайса: строки вписываются от руки, шаблоны лишь подсказывают структуру.')}`;
};

/* ===== Креатив ===== */
SC.creative=()=>{
 const load={};CREATIVE.filter(c=>['work','review','queue'].includes(c.st)&&c.who).forEach(c=>load[c.who]=(load[c.who]||0)+1);
 return `<div class="hd"><div><h2>Креатив и презентации</h2><p>Креатив — отдельный трек сделки: подключается креатор или нет, концепция, key visual, презентация, версии и согласование до защиты. Аскар видит загрузку группы, менеджер — где его задача.</p></div>
  <div class="btns"><button class="bt p" onclick="card('crnew')">+ Задача креативу</button></div></div>
 <div class="loads">${['AS','ZH','OL'].map(k=>`<div class="ld">${av(k)}<div><b>${esc(TEAM[k].f)}</b><span>${esc(TEAM[k].r)}</span></div><strong>${load[k]||0}</strong></div>`).join('')}</div>
 <div class="kanban cr">${CRST.map(s=>`<div class="kcol" ondragover="event.preventDefault()" ondrop="moveCr(event.dataTransfer.getData('t'),'${s[0]}')"><div class="khead" style="--c:#6d4c7d"><b>${s[1]}</b><span>${CREATIVE.filter(c=>c.st===s[0]).length}</span></div>
  ${CREATIVE.filter(c=>c.st===s[0]).map(c=>`<div class="kcard" draggable="true" ondragstart="event.dataTransfer.setData('t','${c.id}')" onclick="openDeal('${c.deal}')"><div class="kt"><span class="ttag">${esc(c.kind)}</span>${c.ver?`<span class="ttag">v${c.ver}</span>`:''}</div><b>${esc(CL(DL(c.deal).cl).n)}</b><span>${esc(c.t)}</span><div class="km"><strong>${c.due?'до '+dd(c.due):''}</strong>${av(c.who)}</div></div>`).join('')}</div>`).join('')}</div>
 <div class="pan"><h3>Без креатива</h3>${CREATIVE.filter(c=>c.st==='skip').map(c=>`<div class="kv"><span>${dealL(c.deal)}</span><b>${esc(c.t)}</b></div>`).join('')}</div>
 ${said('«Коммерческое предложение имеет расчёт ценовой и имеет подготовку креативную… Есть проекты, которые требуют креативных разработок, есть которые не требуют — подключается креатор или не подключается»')}`;
};
function moveCr(id,k){const c=CREATIVE.find(x=>x.id===id);if(!c)return;c.st=k;if(k==='review')c.ver++;render();toast(k==='done'?'Креатив готов к защите — менеджер получил уведомление.':`Креатив → ${(CRST.find(s=>s[0]===k)||[,''])[1]}.`)}

/* ===== Тендеры ===== */
SC.tenders=()=>`<div class="hd"><div><h2>Тендеры</h2><p>Три формата отбора — тендер, условный тендер, без тендера — у каждой сделки. Для тендеров: площадка, номер, дедлайн и чек-лист документов. Аналитика считает выигрыши по каждому формату.</p></div></div>
 <div class="g3">${BYTEN.map(b=>`<div class="pan stat"><small>${TENDER[b.k]}</small><b>${b.n}</b><span>выиграно ${b.won} · конверсия ${pct(b.won,b.n)}%</span></div>`).join('')}</div>
 ${TENDERS.map((t,ti)=>{const d=DL(t.deal);const ok=t.docs.filter(x=>x[1]).length;return `<div class="pan"><div class="row"><div><h3>${dealL(t.deal)}</h3><p>${clL(d.cl)} · ${tenTag(t.kind)} · ${esc(t.plat)} ${esc(t.no)} · ${dirTag(d.dir)}</p></div><div class="dl0"><b>${dd(t.due)}</b><span>${dleft(t.due)}</span></div></div>
  <div class="docs">${t.docs.map((x,i)=>`<label class="dck ${x[1]?'on':''}" onclick="TENDERS[${ti}].docs[${i}][1]=TENDERS[${ti}].docs[${i}][1]?0:1;render()"><i>${x[1]?'✓':''}</i>${esc(x[0])}</label>`).join('')}</div>
  <div class="mini">Документов ${ok} из ${t.docs.length}. ${esc(t.note)}</div></div>`}).join('')}
 ${said('«Какие проекты тендерные, какие условные тендеры, какие нетендерные»')}`;

/* ===== Клиенты ===== */
SC.clients=()=>{
 const L=CLIENTS.slice().sort((a,b)=>b.ltv-a.ltv);
 return `<div class="hd"><div><h2>Клиенты и LTV</h2><p>Сколько клиент принёс за всё время, сколько проектов, по каким направлениям, откуда пришёл и когда был последний проект. Постоянные клиенты — отдельной меткой.</p></div><div class="btns"><button class="bt" onclick="act('export')">Выгрузить в Excel</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Отрасль</th><th>Направления</th><th>Откуда пришёл</th><th class="r">Проектов</th><th class="r">LTV</th><th>Последний проект</th><th>В работе</th></tr></thead><tbody>
 ${L.map(c=>{const a=DEALS.filter(d=>d.cl===c.id&&!['lost','won'].includes(d.st));return `<tr onclick="card('cl','${c.id}')"><td><b>${esc(c.n)}</b>${c.projects>=3?' <span class="tag g">постоянный</span>':''}<span class="sub">${esc(c.contact)}</span></td><td>${esc(c.ind)}</td><td>${c.dirs.map(dirTag).join(' ')}</td><td>${esc(SRC[c.src]||'—')}</td><td class="r">${c.projects}</td><td class="r"><b>${c.ltv?tg(c.ltv):'—'}</b></td><td>${c.last==='—'?'—':dl(c.last)}</td><td>${a.length?a.map(d=>stTag(d.st)).join(' '):'—'}</td></tr>`}).join('')}
 </tbody></table></div>
 ${said('«Постоянный клиент к нам обращается — какой объём, лайфтайм вэлью клиента, то есть понимать, сколько клиент нам в целом принёс денег»')}`;
};

/* ===== Документы и ЭЦП ===== */
const docRow=x=>{const s=DOCST[x.st];return `<div class="dr"><div><b>${esc(x.k)} ${esc(x.no)}</b><span>${refL(x.ref)} · ${dd(x.d)} · ${esc(x.mode)}</span></div><div class="r"><b>${tg(x.sum)}</b><span class="stg" style="--sc:${s[1]}">${s[0]}</span></div>
 <div class="da">${x.st==='draft'?(x.mode==='ЭЦП'?`<button class="bt p" onclick="signDoc('${x.id}')">Подписать ЭЦП</button>`:`<button class="bt" onclick="paperDoc('${x.id}')">Распечатан и подписан</button>`):x.st==='our'||x.st==='sent'?`<button class="bt" onclick="signDoc('${x.id}')">${x.st==='our'?'Клиент подписал':'Отметить подпись'}</button>`:`<button class="bt" onclick="card('docv','${x.id}')">Открыть</button>`}</div></div>`};
function signDoc(id){const x=DOCS.find(d=>d.id===id);if(!x)return;if(x.st==='draft'){x.st='our';toast('NCALayer: документ подписан ЭЦП директора. Клиент получил ссылку и подписывает своей ЭЦП — без бумаги и курьера.')}else{x.st='signed';toast('Документ подписан обеими сторонами: две подписи и QR-код проверки, файл в карточке.')}render()}
function paperDoc(id){const x=DOCS.find(d=>d.id===id);if(!x)return;x.st='signed';render();toast('Бумажный вариант: скан с подписями загружен, статус — подписан.')}
SC.docs=()=>`<div class="hd"><div><h2>Договоры, счета, акты · ЭЦП</h2><p>Документ формируется из реквизитов клиента и сметы. Дальше — как попросит клиент: электронно с ЭЦП или на бумаге со сканом. Статус виден в сделке, проекте и здесь.</p></div><div class="btns"><button class="bt p" onclick="card('newdoc','D7')">+ Документ</button></div></div>
 <div class="flow">${[['01','Сформировать','из шаблона и реквизитов'],['02','Отправить','ссылкой в WhatsApp или на почту'],['03','Подписать нами','ЭЦП директора через NCALayer'],['04','Подписать клиентом','своей ЭЦП, без установки системы'],['05','В архив проекта','PDF с двумя подписями и QR']].map((f,i)=>`<div class="fbx ${i===2?'on':''}"><code>${f[0]}</code><b>${f[1]}</b><p>${f[2]}</p></div>`).join('')}</div>
 <div class="pan">${DOCS.map(docRow).join('')}</div>
 ${said('«Иногда бумажные варианты, иногда электронный вариант — это зависит от того, как клиент просит»')}`;

/* ===== Бюджеты и оплаты ===== */
SC.finance=()=>{
 const L=PROJECTS;const recv=L.reduce((a,p)=>a+p.sum-p.paid,0);
 return `<div class="hd"><div><h2>Бюджеты и оплаты проектов</h2><p>Смета после подписания становится бюджетом: план себестоимости, факт по подрядчикам, оплаты клиента и остаток к получению. Маржа план и факт — по каждому проекту.</p></div></div>
 <div class="g3"><div class="pan stat"><small>Ждём от клиентов</small><b>${tg(recv)}</b><span>по актам и графику оплат</span></div><div class="pan stat"><small>Маржа портфеля, план</small><b>${pct(L.reduce((a,p)=>a+p.sum-p.plan,0),L.reduce((a,p)=>a+p.sum,0))}%</b><span>${mln(L.reduce((a,p)=>a+p.sum-p.plan,0))}</span></div><div class="pan stat"><small>Перерасход по факту</small><b class="neg">1 проект</b><span>Школа медпредставителей: +100 000 ₸</span></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Проект</th><th>Этап</th><th class="r">Сумма клиенту</th><th class="r">Себест. план</th><th class="r">Себест. факт</th><th class="r">Оплачено клиентом</th><th class="r">Остаток</th><th class="r">Маржа план</th></tr></thead><tbody>
 ${L.map(p=>`<tr onclick="openProj('${p.id}')"><td><b>${esc(CL(p.cl).n)}</b><span class="sub">${esc(p.t)}</span></td><td>${pstTag(p.st)}</td><td class="r">${fmt(p.sum)}</td><td class="r">${fmt(p.plan)}</td><td class="r ${p.fact>p.plan?'neg':''}">${fmt(p.fact)}</td><td class="r">${fmt(p.paid)}</td><td class="r"><b>${p.sum-p.paid?fmt(p.sum-p.paid):'—'}</b></td><td class="r">${pct(p.sum-p.plan,p.sum)}%</td></tr>`).join('')}
 </tbody></table></div>
 <div class="note"><b>Adesk остаётся как есть</b><p>Управленческий учёт у вас в Adesk — система не дублирует его. По желанию проекты и оплаты можно передавать в Adesk по API — оцениваем отдельно.</p></div>`;
};
