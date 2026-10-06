
/* ===== Продажи ===== */
const myOrders=()=>role==='Менеджер'?ORDERS.filter(o=>o.mgr==='AG'):ORDERS;
SC.funnel=()=>{const L=myOrders();
 return `<div class="hd"><div><h2>Воронка заказов${role==='Менеджер'?' · мои':''}</h2><p>Этапы по вашему ТЗ: новая заявка → сбор информации → первичная отрисовка → корректировка → согласование → договор → замер и техпроект → модерация менеджером → запуск → производство и подрядчики → сборка → готово к вывозу → доставка и монтаж → качество и АВР → оплата → закрыт. Одна карточка проекта на весь путь, шкала готовности на каждой.</p></div><div class="btns"><button class="bt p" onclick="card('newlead')">+ Заявка</button></div></div>
 <div class="kb">${ST.map(s=>{const X=L.filter(o=>o.st===s.k);return `<div class="kc" style="--sc:${s.c}"><div class="kh"><b>${s.n}</b><span>${X.length}</span></div>${X.map(o=>`<div class="kd ${jobsOf(o.id).some(jLate)?'alarm':''}" onclick="openOrd('${o.id}')"><div class="kt"><b>${o.id}</b><span class="tag">${KIND[o.kind]}</span></div><div class="kr">${esc(CL(o.cl).n)}</div><div class="km">${esc(o.t)}</div>${rbar(o)}<div class="kf"><span>${STAFF[o.mgr]}${o.kon?' · '+STAFF[o.kon]:''}</span><b class="mono">${mln(o.sum)}</b></div></div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>
 ${said('«Нужно, чтобы эта карточка дальше двигалась по этапам и этапы были разграничены: продажа, после договора — дизайнеры и конструкторы, потом снабжение и подрядные работы, сборка и монтаж».')}`};

function openOrd(id){if(!allowed('order')){toast('Карточка заказа этой роли недоступна.');return}curOrd=id;go('order')}
function zoneChk(o){const z=STN(o.st).z;if(z==='m')return {k:'m',key:'chM',L:CHK.m};if(z==='k')return {k:o.kind,key:'chK',L:CHK[o.kind]};return null}
SC.order=()=>{const o=OR(curOrd)||ORDERS[0];const c=CL(o.cl);const si=STI(o.st);const z=zoneChk(o);const J=jobsOf(o.id);const R=REQS.find(r=>r.ord===o.id);const blk=nextBlock(o);
 return `<div class="hd"><div><div class="crumb"><a onclick="go('funnel')">Воронка</a> / ${o.id}</div><h2>${o.id} · ${esc(o.t)}</h2><p>${esc(c.n)} · ${esc(c.addr)} · менеджер ${STAFF[o.mgr]}${o.kon?' · конструктор '+STAFF[o.kon]:''}${o.br?' · '+BRIG[o.br].n:''}</p></div>
  <div class="btns">${si<=STI('agree')?`<button class="bt" onclick="card('lostq','${o.id}')">Отказ</button>`:''}${o.st!=='done'?`<button class="bt ${blk?'':'p'}" onclick="nextSt('${o.id}')">→ ${ST[si+1].n}</button>`:''}</div></div>
 <div class="stp">${ST.map((s,i)=>`<div class="${i<si?'ok':i===si?'on':''}" style="--sc:${s.c}" title="${s.n}"><i>${i<si?'✓':i+1}</i><span>${s.n}</span></div>`).join('')}</div>
 <div class="rdbig">${rbar(o)}<span>готовность заказа</span></div>
 ${blk?`<div class="note" style="--tone:var(--bad)"><b>Дальше не двигается: ${blk}</b><p>Так задумано: пока ответственный не прошёл свой чек-лист или не выполнено условие этапа, карточка стоит.</p></div>`:''}
 <div class="g3">
  <div class="pan"><h3>Клиент</h3><div class="kv"><span>Имя</span><b class="lk" onclick="card('cl','${c.id}')">${esc(c.n)}</b></div><div class="kv"><span>Телефон</span><b class="mono">${c.ph}</b></div><div class="kv"><span>Откуда</span><b>${c.src}</b></div>${c.note!=='—'?`<div class="pin">${esc(c.note)}</div>`:''}</div>
  <div class="pan"><h3>Деньги</h3><div class="kv"><span>Сумма договора</span><b class="mono">${fmt(o.sum)}</b></div><div class="kv"><span>Оплачено</span><b class="mono pos">${fmt(o.paid)}</b></div><div class="kv"><span>Остаток</span><b class="mono ${o.sum-o.paid?'neg':''}">${fmt(o.sum-o.paid)}</b></div><div class="kv"><span>Подрядчикам</span><b class="mono">${fmt(J.reduce((a,j)=>a+j.sum,0))}</b></div>${o.sum>o.paid&&si>=STI('dog')?`<button class="bt sm" onclick="payOrd('${o.id}')">Отметить оплату</button>`:''}</div>
  <div class="pan"><h3>Документы</h3>${[['Эскиз и 3D',si>=STI('sketch')],['КП',si>=STI('sketch')],['Договор',si>=STI('dog')?(o.paid?'подписан':'отправлен на ЭЦП'):0],['Чертежи для цеха',si>STI('kd')],['Акт сдачи',o.st==='done']].map(d=>`<div class="kv"><span>${d[0]}</span><b>${d[1]?`<span class="tag g">${d[1]===true?'есть':d[1]}</span>`:'<span class="tag">—</span>'}</b></div>`).join('')}<button class="bt sm" onclick="go('kp')">КП и договор →</button></div>
 </div>
 ${z?`<div class="pan"><h3>Чек-лист: ${z.L.n} · ${o[z.key].filter(Boolean).length} из ${z.L.items.length}</h3><div class="chk">${z.L.items.map((x,i)=>`<div class="ci"><span class="bx ${o[z.key][i]?'on':''}" onclick="togChk('${o.id}','${z.key}',${i})">${o[z.key][i]?'✓':''}</span><span class="nm">${esc(x)}</span><span class="who">${z.key==='chM'?STAFF[o.mgr]:STAFF[o.kon]||'конструктор'}</span></div>`).join('')}</div></div>`:''}
 ${STN(o.st).z==='k'?`<div class="pan"><h3>Подрядчики по этому заказу — отмечает конструктор</h3><div class="cog">${CONTR.map(p=>`<label class="coc ${o.podr.includes(p.id)?'on':''}"><input type="checkbox" ${o.podr.includes(p.id)?'checked':''} onchange="togPodr('${o.id}','${p.id}')"><b>${esc(p.n)}</b><span>${esc(p.w)}</span></label>`).join('')}</div><p class="mini">Когда конструктор закроет чек-лист и передаст в производство, на доске каждого отмеченного подрядчика появится своя карточка с документами и сроком.</p></div>`:''}
 ${J.length?`<div class="pan"><h3>Подрядчики · ${J.filter(j=>j.st==='done').length} из ${J.length} сдали</h3><div class="tw"><table class="t"><thead><tr><th>Подрядчик</th><th>Работа</th><th>Передано</th><th>Срок</th><th>Статус</th><th class="r">Цена</th><th class="r">Оплачено</th></tr></thead><tbody>${J.map(j=>`<tr class="${jLate(j)?'rowbad':''}"><td><b>${esc(CO(j.p).n)}</b></td><td>${esc(j.w)}</td><td class="mono">${dd(j.sent)}</td><td class="mono">${dd(j.due)}</td><td>${jst(j)}</td><td class="r mono">${j.sum?fmt(j.sum):'свои'}</td><td class="r mono">${fmt(j.paid)}</td></tr>`).join('')}</tbody></table></div></div>`:''}
 ${R?`<div class="pan"><h3>Заявка на склад · ${R.st==='done'?'<span class="tag g">отгружено</span>':'<span class="tag w">ждёт склад</span>'}</h3>${R.lines.map(([s,q])=>`<div class="kv"><span>${esc(SK(s).n)} · ячейка ${SK(s).cell}</span><b class="mono">${q} ${SK(s).u}</b></div>`).join('')}</div>`:''}
 ${ordExtra(o)}
 <div class="g2"><div class="pan"><h3>WhatsApp с клиентом</h3>${waThread(o).slice(-3).map(m=>`<div class="msg ${m[0]}"><small>${m[1]}</small>${esc(m[2])}</div>`).join('')}<button class="bt sm" onclick="curOrd='${o.id}';go('wa')">Вся переписка →</button></div>
 <div class="pan"><h3>Ход заказа</h3><div class="tl">${ordLog(o).map(x=>`<div class="tli ${x[2]||'ok'}"><span class="who">${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div></div></div>`};
const jst=j=>j.st==='done'?'<span class="tag g">сдал</span>':jLate(j)?`<span class="tag r">просрочка ${daysBetween(j.due,TODAY)} дн.</span>`:j.st==='work'?'<span class="tag w">в работе</span>':'<span class="tag i">передано</span>';
function ordLog(o){const si=STI(o.st);const L=[[dd(o.d)+' · '+STAFF[o.mgr],'Заявка: '+o.t]];ST.slice(1,si+1).forEach((s,i)=>L.push([dd(addDays(o.d,(i+1)*3)),s.n]));return L.slice(-7).concat(o.log)}
function nextBlock(o){const si=STI(o.st);const n=ST[si+1];if(!n)return '';
 if(o.st==='dog'&&o.chM.some(x=>!x))return 'чек-лист менеджера не закрыт — '+o.chM.filter(x=>!x).length+' пункта';
 if(o.st==='dog'&&!o.paid)return 'нет предоплаты';
 if(o.st==='zam2'&&o.chK.some(x=>!x))return 'техпроект не готов: чек-лист конструктора — '+o.chK.filter(x=>!x).length+' пункта';
 if(o.st==='kd'&&o.moder!=='final')return 'запуск запрещён: менеджер не подтвердил финальный технический проект';
 if(o.st==='kd'&&!o.podr.length)return 'конструктор не отметил подрядчиков';
 if(o.st==='start'&&o.pkg.some(x=>!x))return 'пакет запуска неполный — нет: '+PKG.filter((x,i)=>!o.pkg[i]).join(', ');
 if(o.st==='start'){const R=REQS.find(r=>r.ord===o.id);if(R&&R.st!=='done')return 'склад ещё не собрал заявку — закупщик отгружает или дозаказывает'}
 if(o.st==='podr'&&jobsOf(o.id).some(j=>j.st!=='done'))return 'не все подрядчики сдали работу: '+jobsOf(o.id).filter(j=>j.st!=='done').map(j=>CO(j.p).n).join(', ');
 if(o.st==='qa'&&!o.avr)return 'АВР не подписан клиентом';
 if(o.st==='pay'&&(o.paid<o.sum||!o.closed))return o.paid<o.sum?'остаток не оплачен: '+tg(o.sum-o.paid):'закрывающие документы не сданы';
 return ''}
function nextSt(id){const o=OR(id);const b=nextBlock(o);if(b){toast('Карточка не двигается: '+b+'.');return}
 const was=o.st;o.st=ST[STI(o.st)+1].k;let msg=`${o.id} → «${STN(o.st).n}».`;
 if(was==='kd'){o.pkg=o.pkg||PKG.map(()=>0);let n=0;o.podr.forEach(p=>{if(!JOBS.some(j=>j.ord===o.id&&j.p===p)){JOBS.push({id:'J'+(JOBS.length+1),ord:o.id,p,w:CO(p).w+' по '+o.id,sent:TODAY,due:addDays(TODAY,7),st:'sent',sum:0,paid:0,docs:['Чертежи '+o.id+'.pdf']});n++}});if(!REQS.some(r=>r.ord===o.id))REQS.unshift({ord:o.id,by:o.kon||'TM',d:TODAY,st:'new',lines:[['S1',8],['S6',90],['S8',18],['S13',12]]});msg+=` Карточка размножилась: ${o.podr.length} ${plural(o.podr.length,['подрядчик','подрядчика','подрядчиков'])} получили свои карточки, на склад ушла заявка.`}
 if(o.st==='wait')msg+=` Менеджеру ${STAFF[o.mgr]} пришло уведомление: «Заказ готов — сообщите клиенту и договоритесь о монтаже».`;
 if(o.st==='mont')msg+=' Создана задача доставки: водитель и ответственный менеджер.';
 if(o.st==='qa')msg+=' Создана задача контроля качества и АВР.';
 if(o.st==='pay')msg+=' АВР подписан — проект переведён в оплату.';
 if(o.st==='done')msg+=' Оплачено, документы закрыты — проект закрыт. Бригаде начислена сдельная часть.';
 if(o.st==='kd')msg+=' Техпроект отправлен менеджеру на модерацию.';
 if(o.st==='zam2')msg+=' Дата передачи зафиксирована, конструктору создана задача и пришёл пакет от менеджера.';
 o.log.push(['сейчас · '+ROLES[role].n,'Этап: '+STN(o.st).n]);render();toast(msg)}
function togChk(id,key,i){const o=OR(id);if(key==='chM'&&!['Собственник','Менеджер'].includes(role)){toast('Этот чек-лист отмечает менеджер.');return}if(key==='chK'&&!['Собственник','Конструктор'].includes(role)){toast('Этот чек-лист отмечает конструктор.');return}o[key][i]=o[key][i]?0:1;render()}
function togPodr(id,p){const o=OR(id);o.podr=o.podr.includes(p)?o.podr.filter(x=>x!==p):o.podr.concat(p);render()}
function payOrd(id){const o=OR(id);const s=Math.min(o.sum-o.paid,Math.round(o.sum/2));o.paid+=s;CASH.push({d:TODAY,k:'in',n:'Оплата '+o.id+' · '+CL(o.cl).n,s,c:'Заказы'});render();toast(`Оплата ${tg(s)} — в карточке, в «Приходах» и в долгах клиента.`)}

SC.clients=()=>`<div class="hd"><div><h2>Клиенты</h2><p>Клиент и все его заказы, оплаты, долг и переписка — в одной карточке.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Адрес</th><th>Откуда</th><th>Заказы</th><th class="r">Сумма</th><th class="r">Долг</th><th>Заметка</th></tr></thead><tbody>${CLIENTS.map(c=>{const O=ORDERS.filter(o=>o.cl===c.id);return `<tr class="clk" onclick="card('cl','${c.id}')"><td><b>${esc(c.n)}</b><div class="sub mono">${c.ph}</div></td><td>${esc(c.addr)}</td><td>${c.src}</td><td>${O.map(o=>o.id).join(', ')}</td><td class="r mono">${fmt(O.reduce((a,o)=>a+o.sum,0))}</td><td class="r mono ${O.reduce((a,o)=>a+debt(o),0)?'neg':''}">${fmt(O.reduce((a,o)=>a+debt(o),0))}</td><td class="mini nt">${c.note==='—'?'':esc(c.note)}</td></tr>`}).join('')}</tbody></table></div>`;

/* Калькулятор — по образцу вашей Google-таблицы */
const CALC={kind:'Кухня',ldsp:'S1',sh:10,edge:'S6',em:300,hdf:3,fac:'mdf',fm2:5.2,top:'quartz',tl:3,hinge:'S8',hq:20,box:'S10',bq:5,lift:2,legs:16,hang:8,gola:3,led:3,mark:35};
const FAC={ldsp:['ЛДСП, как корпус',0],mdf:['МДФ эмаль, своя малярка',38000],veneer:['Шпон «Шпон-Арт»',62000],alu:['Алюминий + стекло «AluSystem»',54000]};
const TOP={none:['Без столешницы',0],ldsp:['ЛДСП 38 мм',18000],acryl:['Акрил «Stone Line»',95000],quartz:['Кварц «Stone Line»',145000]};
function calcLines(){const C=CALC,s=k=>SK(C[k]);return [
 ['Корпус',s('ldsp').n,C.sh,'лист',s('ldsp').pr],['Кромка',s('edge').n,C.em,'м',s('edge').pr],['Задняя стенка',SK('S5').n,C.hdf,'лист',SK('S5').pr],
 ['Фасады',FAC[C.fac][0],C.fm2,'м²',FAC[C.fac][1]],['Столешница',TOP[C.top][0],C.top==='none'?0:C.tl,'м',TOP[C.top][1]],
 ['Петли',s('hinge').n,C.hq,'шт',s('hinge').pr],['Ящики',s('box').n,C.bq,'компл',s('box').pr],['Подъёмники',SK('S12').n,C.lift,'компл',SK('S12').pr],
 ['Ножки',SK('S13').n,C.legs,'шт',SK('S13').pr],['Навесы',SK('S14').n,C.hang,'пара',SK('S14').pr],['Профиль Gola',SK('S15').n,C.gola,'шт',SK('S15').pr],['Подсветка','LED-лента в профиле, 24 В',C.led,'м',9000],
 ['Распил и кромкование','«Раскрой-Центр», за лист',C.sh,'лист',6500],['Сборка и монтаж','бригада, сдельно',1,'',0],['Доставка','по Алматы',1,'',25000]]}
function calcTot(){const L=calcLines();let m=L.reduce((a,l)=>a+l[2]*l[4],0);const mont=Math.round(m*.12);m+=mont;return {mat:m-mont,mont,cost:m,price:Math.round(m*(1+CALC.mark/100)/1000)*1000}}
function setC(k,v){CALC[k]=isNaN(+v)?v:+v;render()}
SC.calc=()=>{const C=CALC,L=calcLines(),T=calcTot();const sel=(k,opts)=>`<select onchange="setC('${k}',this.value)">${opts.map(([v,n])=>`<option value="${v}" ${C[k]==v?'selected':''}>${esc(n)}</option>`).join('')}</select>`;const num=(k,st)=>`<input type="number" step="${st||1}" value="${C[k]}" onchange="setC('${k}',this.value)">`;const pick=g=>STOCK.filter(s=>s.g===g||g.includes(s.id)).map(s=>[s.id,s.n]);
 return `<div class="hd"><div><h2>Расчёт заказа</h2><p>Ваша Google-таблица внутри системы: менеджер проходит пункты, в каждом — свои варианты, цены подтягиваются из прайсов поставщиков по артикулу. Здесь 15 пунктов для примера — в вашей таблице около 50 пунктов и 200 вариантов, переносим все.</p></div><div class="btns"><button class="bt p" onclick="go('kp');toast('КП собрано из расчёта: позиции, материалы, сумма.')">Сформировать КП →</button></div></div>
 <div class="cg"><div class="pan"><div class="cform">
  <label>Изделие${sel('kind',[['Кухня','Кухня'],['Шкаф','Шкаф / гардероб'],['Другое','Другое']])}</label>
  <label>ЛДСП корпуса${sel('ldsp',pick(['S1','S2','S3']))}</label><label>Листов${num('sh')}</label>
  <label>Кромка${sel('edge',pick(['S6','S7']))}</label><label>Метров${num('em')}</label>
  <label>Задняя стенка ХДФ, листов${num('hdf')}</label>
  <label>Фасады${sel('fac',Object.entries(FAC).map(([k,v])=>[k,v[0]]))}</label><label>Площадь фасадов, м²${num('fm2',.1)}</label>
  <label>Столешница${sel('top',Object.entries(TOP).map(([k,v])=>[k,v[0]]))}</label><label>Длина, м${num('tl',.1)}</label>
  <label>Петли${sel('hinge',pick(['S8','S9']))}</label><label>Петель, шт${num('hq')}</label>
  <label>Ящики${sel('box',pick(['S10','S11']))}</label><label>Ящиков${num('bq')}</label>
  <label>Подъёмники Aventos${num('lift')}</label><label>Ножки${num('legs')}</label><label>Навесы, пар${num('hang')}</label><label>Gola, шт${num('gola')}</label><label>Подсветка, м${num('led',.5)}</label><label>Наценка, %${num('mark')}</label>
 </div></div>
 <div class="pan"><h3>Итог</h3><div class="wf"><div><span>Материалы и подрядчики</span><b>${fmt(T.mat)}</b></div><div><span>Сборка и монтаж · 12 %</span><b>${fmt(T.mont)}</b></div><div class="sep"><span>Себестоимость</span><b>${fmt(T.cost)}</b></div><div><span>Наценка ${C.mark} %</span><b>${fmt(T.price-T.cost)}</b></div><div class="tot"><span>Цена клиенту</span><b>${fmt(T.price)}</b></div></div><p class="mini">Прайсы обновлены 03.10: «Blum Казахстан», «Мебельные материалы KZ», «ДСП-Центр». Если у поставщика цена изменилась — расчёт пересчитается.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Пункт</th><th>Выбрано</th><th class="r">Кол-во</th><th class="r">Цена</th><th class="r">Сумма</th></tr></thead><tbody>${L.filter(l=>l[4]&&l[2]).map(l=>`<tr><td>${l[0]}</td><td>${esc(l[1])}</td><td class="r mono">${l[2]} ${l[3]}</td><td class="r mono">${fmt(l[4])}</td><td class="r mono">${fmt(l[2]*l[4])}</td></tr>`).join('')}</tbody></table></div>
 ${said('«Около пятидесяти пунктов надо выбрать, в каждом всплывающие варианты… петли бывают в двадцати вариантах… всё это подтягивается с других таблиц, где исходные данные от поставщиков».','Ирина: калькулятор лучше перенести на начальном этапе, чем потом отдельно.')}`};

SC.kp=()=>{const o=OR('К-1508'),T=calcTot();const d=OR('К-1507');
 return `<div class="hd"><div><h2>КП, договор, ЭЦП</h2><p>КП собирается из расчёта, договор — из карточки: клиент, изделие, сумма, сроки, график оплат. Подписать можно на бумаге (скан в карточку) или по ссылке через ЭЦП.</p></div></div>
 <div class="g2"><div class="pan"><h3>КП · ${o.id} · ${esc(CL(o.cl).n)}</h3><div class="doc"><div class="dh"><div class="dlg">КОРПУС<small>МЕБЕЛЬ НА ЗАКАЗ · АЛМАТЫ</small></div><div style="text-align:right;font-size:10px">КП № ${o.id}<br>${dd(TODAY)}.2026</div></div><h4>Коммерческое предложение</h4><p style="font-size:11px">${esc(o.t)} · ${esc(CL(o.cl).addr)}</p>${calcLines().filter(l=>l[4]&&l[2]).slice(0,8).map(l=>`<div class="drow"><span>${l[0]}</span><span>${esc(l[1].split(' · ')[0])}</span><span class="r">${l[2]} ${l[3]}</span></div>`).join('')}<div class="dsum"><span>Итого</span><span>${tg(T.price)}</span></div><div class="dfoot"><span>Срок изготовления — 30–35 рабочих дней. Предоплата 50 %, остаток — после монтажа.</span></div></div><div class="btns l" style="margin-top:10px"><button class="bt p" onclick="toast('КП отправлено клиенту в WhatsApp из карточки.')">Отправить в WhatsApp</button><button class="bt" onclick="go('calc')">Изменить расчёт</button></div></div>
 <div class="pan"><h3>Договор · ${d.id} · ${esc(CL(d.cl).n)}</h3>${[['Договор сформирован из карточки','ok'],['Отправлен клиенту ссылкой · 03.10','ok'],['Подпись клиента через ЭЦП (eGov / NCALayer)',d.paid?'ok':'wait'],['Подпись со стороны компании',d.paid?'ok':'wait'],['Счёт на предоплату 50 %',d.paid?'ok':'wait']].map(x=>`<div class="li ${x[1]==='ok'?'':'w'}"><i>${x[1]==='ok'?'✓':'…'}</i><span>${x[0]}</span></div>`).join('')}
  <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="signDog()">Клиент подписал ЭЦП</button><button class="bt" onclick="toast('Скан бумажного договора прикреплён к карточке.')">Бумажный — загрузить скан</button></div>
  <div class="note"><b>Сейчас — бумага</b><p>Оставляем оба способа: бумажный договор со сканом в карточке и подписание ЭЦП по ссылке для тех, кому удобно.</p></div></div></div>
 ${said('«КП, договор — чтобы всё в одной системе было» · «Пока что в бумажном виде с клиентом, хотелось бы тоже сделать возможность подписать в электронном виде».')}`};
function signDog(){const d=OR('К-1507');if(d.paid){toast('Уже подписан.');return}d.paid=Math.round(d.sum/2);d.chM[0]=1;d.chM[1]=1;CASH.push({d:TODAY,k:'in',n:'Предоплата К-1507 · Байжанов',s:d.paid,c:'Заказы'});render();toast('Договор К-1507 подписан ЭЦП, предоплата пришла — чек-лист менеджера обновился.')}

const WA={'К-1501':[['in','09:12','Добрый день! Когда будут фасады? Мы переезжаем 20-го'],['out','09:20 · Айгерим','Здравствуйте, Жанар! Фасады в покраске до 9 октября, монтаж стоит на 16-е — успеваем.'],['in','09:21','Отлично, спасибо!']],'К-1503':[['in','вчера 18:40','Почему шкаф ещё не готов? Обещали к 10-му'],['out','вчера 19:05 · Максат','Динара, ждём зеркала от подрядчика, сегодня уточню срок.'],['in','10:02','Есть новости по зеркалам?']],'К-1510':[['sys','авто','Ваш заказ готов. Менеджер свяжется, чтобы согласовать монтаж.'],['out','11:30 · Дина','Камила, монтаж 8 октября с 10:00 — удобно?'],['in','11:48','Да, ждём']]};
const waThread=o=>WA[o.id]||[['sys','авто',`Заказ ${o.id} принят. Ваш менеджер — ${STAFF[o.mgr]}.`]];
const AUTO={dog:1,start:1,wait:1,mont:1};
SC.wa=()=>{const o=OR(curOrd)||ORDERS[0];const T=Object.keys(WA).map(OR);
 return `<div class="hd"><div><h2>WhatsApp в карточке заказа</h2><p>Номер компании подключается к системе: вся переписка менеджеров с клиентами видна в карточке заказа, руководитель видит, кто и когда ответил. Казахстанский провайдер — около 5 000 ₸ за номер в месяц.</p></div></div>
 <div class="g12"><div class="pan"><h3>Чаты</h3>${T.map(x=>{const L=waThread(x),last=L[L.length-1];return `<div class="ch ${x.id===o.id?'on':''}" onclick="curOrd='${x.id}';render()"><b>${esc(CL(x.cl).n)} · ${x.id}</b><span>${esc(last[2]).slice(0,60)}</span>${last[0]==='in'?`<em>ждёт ответа${x.id==='К-1503'?' 5 ч':''}</em>`:''}</div>`}).join('')}</div>
 <div class="pan"><h3>${esc(CL(o.cl).n)} · ${o.id} · менеджер ${STAFF[o.mgr]}</h3><div class="chat">${waThread(o).map(m=>`<div class="msg ${m[0]}"><small>${m[1]}</small>${esc(m[2])}</div>`).join('')}</div><div class="wain"><input id="wa_t" placeholder="Сообщение клиенту" value="Добрый день! Заказ на этапе «${STN(o.st).n}»."><button class="bt p" onclick="waSend('${o.id}')">Отправить</button></div></div></div>
 <div class="pan"><h3>Авто-сообщения клиенту при смене этапа</h3>${[['dog','Договор подписан — «Спасибо! Договор подписан, ваш конструктор — …»'],['start','Запуск — «Заказ передан в производство, ориентировочная дата монтажа …»'],['wait','Готово — «Ваш заказ готов, менеджер согласует время монтажа»'],['mont','Монтаж — «Завтра в 10:00 приедет бригада»']].map(([k,n])=>`<div class="srow"><span class="nm">${n}</span><span class="sw ${AUTO[k]?'on':''}" onclick="AUTO['${k}']=AUTO['${k}']?0:1;render()"></span></div>`).join('')}</div>
 ${said('«Переписываются они в WhatsApp с клиентом… было бы удобно, если бы это можно было проконтролировать, проанализировать — увидеть внутри системы».')}`};
function waSend(id){const el=document.getElementById('wa_t');if(!el)return;const t=el.value.trim();if(!t)return;WA[id]=waThread(OR(id)).concat([['out',NOW+' · '+ROLES[role].n,t]]);render();toast('Сообщение отправлено клиенту в WhatsApp и сохранено в карточке.')}
