
const SC={};
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const stTag=k=>`<span class="stg" style="--sc:${STC(k)}">${STN(k)}</span>`;
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
function lineChart(pts,lbl){const w=600,h=150,mx=Math.max(...pts)*1.1,step=w/(pts.length-1),P=pts.map((v,i)=>[i*step,h-v/mx*h]);const d=P.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
 return `<svg class="lc" viewBox="0 -10 ${w} ${h+12}" preserveAspectRatio="none"><path d="${d} L ${w} ${h} L 0 ${h} Z" class="la"/><path d="${d}" class="ll"/>${P.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" class="lp"/>`).join('')}</svg><div class="lcl">${lbl.map(l=>`<span>${l}</span>`).join('')}</div>`}
/* Итоги по всей базе: в демо показаны 64 должника, итоги — по 10 400 */
const BASE_N=10400,BASE_REST=1042600000;
const EARLY_PAY=1236000;
const payToday=()=>EARLY_PAY+PAYTODAY.reduce((a,p)=>a+p.s,0);
const promToday=()=>DEBT.filter(d=>d.prom&&d.prom.d==='13.10');

SC.dash=()=>{const pt=payToday(),pc=Math.round(pt/PLAN_DAY*100),pr=promToday();
 return `<div class="hd"><div><h2>Пульт руководителя · ${TODAY}, ${NOW}</h2><p>Сколько зашло на счета сегодня против плана, сколько должников и остаток по всем портфелям, кто из коллекторов работает и какие обещания горят. Всё, что сейчас приходится собирать из Excel.</p></div><div class="btns"><button class="bt" onclick="exportXls('rest')">⇩ Excel</button></div></div>
 <div class="wid">
  <div class="clk" onclick="go('payments')"><small>Поступило сегодня</small><b class="g">${mln(pt)}</b><span>${pc}% от плана ${mln(PLAN_DAY)} в день</span></div>
  <div class="clk" onclick="go('debtors')"><small>Должников в работе</small><b>${fmt(BASE_N)}</b><span>4 портфеля · средний остаток ${tg(BASE_REST/BASE_N)}</span></div>
  <div class="clk" onclick="go('portfolios')"><small>Остаток задолженности</small><b>${(BASE_REST/1e9).toFixed(2).replace(".",",")} млрд ₸</b><span>основной долг, вознаграждение, пеня</span></div>
  <div class="clk" onclick="go('promises')"><small>Обещания на сегодня</small><b class="a">${pr.length+38}</b><span>на ${mln(pr.reduce((a,d)=>a+d.prom.s,0)+1520000)} · выполнено 21</span></div>
  <div class="clk" onclick="go('calls')"><small>Звонков сегодня</small><b>1 846</b><span>дозвон 41% · 9 ч 20 мин разговоров</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Поступления за 14 дней, млн ₸ · план 2,5 млн в день</h3>${lineChart([2.1,2.6,2.4,1.2,0.6,2.7,2.9,2.3,2.5,1.4,0.7,2.8,3.1,pt/1e6],['30.09','','','','','','06.10','','','','','','','13.10'])}</div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="go('promises')"><i></i><div><b>14 обещаний вчера не выполнено</b><span>на 486 000 ₸ · коллекторам ушли задачи «перезвонить до 12:00»</span></div></div>
  <div class="rf bad" onclick="go('payments')"><i></i><div><b>${PAYTODAY.filter(p=>!p.id).length} платежа без должника</b><span>перевод без назначения — разнести вручную</span></div></div>
  <div class="rf" onclick="go('debtors')"><i></i><div><b>1 120 должников из PF-07 без контакта</b><span>номера не отвечают — нужен поиск контактов</span></div></div>
  <div class="rf" onclick="go('plan')"><i></i><div><b>Нурлан: 62 звонка при норме 220</b><span>начал смену в 11:40</span></div></div>
  <div class="rf" onclick="go('reports')"><i></i><div><b>Отчёт в Нацбанк за сентябрь — до 15.10</b><span>выгрузка готова, проверить и отправить</span></div></div></div></div>
 <div class="g2"><div class="pan"><h3>Сборы сегодня по коллекторам</h3>${bars(COLL.map((c,i)=>[c[1],[412000,356000,298000,274000,96000,318000,241000,188000][i],tg([412000,356000,298000,274000,96000,318000,241000,188000][i])]))}</div>
 <div class="pan"><h3>Должники по этапам</h3>${bars(ST.map((s,i)=>[s[1],[860,1240,1980,720,2310,410,640,190,1650,400][i]]))}</div></div>
 ${said('Чтобы видеть этих всех должников, их видеть, и комментарий по ним можно было забивать — по суммам, по остаткам задолженности')}`};

SC.plan=()=>`<div class="hd"><div><h2>План и коллекторы</h2><p>План сборов на день и месяц делится по коллекторам. Видно, кто сколько звонит, дозванивается, берёт обещаний и сколько из них превращается в деньги. Новичок сразу виден по цифрам.</p></div></div>
 <div class="wid"><div><small>План октября</small><b>${mln(PLAN_DAY*22)}</b><span>${mln(PLAN_DAY)} в рабочий день</span></div><div><small>Собрано с 1 октября</small><b class="g">${mln(19840000+payToday())}</b><span>${Math.round((19840000+payToday())/(PLAN_DAY*22)*100)}% плана · день 9 из 22</span></div><div><small>Прогноз на месяц</small><b>${mln(52600000)}</b><span>96% плана при текущем темпе</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Коллектор</th><th>Должников</th><th>Звонков сегодня</th><th>Дозвон</th><th>Обещаний</th><th>Выполнено обещаний, мес.</th><th>Собрано сегодня</th><th>Собрано за месяц</th></tr></thead><tbody>${COLL.map((c,i)=>{const calls=[248,231,226,214,62,219,204,197][i];return `<tr class="${calls<150?'rowbad':''}"><td><b>${c[1]}</b></td><td class="mono">${fmt([1310,1290,1300,1280,1320,1310,1300,1290][i])}</td><td class="mono">${calls}</td><td class="mono">${[44,42,39,41,28,43,38,40][i]}%</td><td class="mono">${[9,8,6,7,2,8,5,4][i]}</td><td class="mono">${[78,74,66,69,41,72,63,58][i]}%</td><td class="mono">${tg([412000,356000,298000,274000,96000,318000,241000,188000][i])}</td><td class="mono">${mln([3.42,3.18,2.71,2.64,1.32,2.96,2.31,1.88][i]*1e6)}</td></tr>`}).join('')}</tbody></table></div></div>
 ${said('Нашим аналитикам тоже тяжеловато по Excel работать')}`;

/* Все должники */
let F={q:'',port:'',st:'',col:'',sum:'',city:''};
function fDebt(){return DEBT.filter(d=>{const t=(d.id+' '+d.nm+' '+d.iin+' '+d.ph+' '+d.cont).toLowerCase();
 if(F.q&&!t.includes(F.q.toLowerCase()))return false;if(F.port&&d.port!==F.port)return false;if(F.st&&d.st!==F.st)return false;if(F.col&&d.col!==F.col)return false;if(F.city&&d.city!==F.city)return false;
 const r=rest(d);if(F.sum==='s'&&r>=60000)return false;if(F.sum==='m'&&(r<60000||r>=120000))return false;if(F.sum==='l'&&r<120000)return false;return true})}
const sel=(k,opts,ph)=>`<select onchange="F.${k}=this.value;render()"><option value="">${ph}</option>${opts.map(o=>`<option value="${o[0]}" ${F[k]===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>`;
SC.debtors=()=>{const L=fDebt();
 return `<div class="hd"><div><h2>Все должники</h2><p>Вся база в одном списке вместо Excel: портфель, остаток долга, этап, коллектор, последний контакт и комментарий. Фильтры, поиск по ФИО, ИИН, телефону и номеру займа. Любой список — в Excel одной кнопкой.</p></div><div class="btns"><button class="bt" onclick="exportXls('list')">⇩ Excel по фильтру</button><button class="bt p" onclick="go('import')">⇧ Загрузить портфель</button></div></div>
 <div class="flt"><input placeholder="ФИО, ИИН, телефон, номер займа" value="${esc(F.q)}" onchange="F.q=this.value;render()">${sel('port',PORTS.map(p=>[p.id,p.id+' · '+p.seller]),'Все портфели')}${sel('st',ST.map(s=>[s[0],s[1]]),'Все этапы')}${sel('col',COLL,'Все коллекторы')}${sel('sum',[['s','до 60 000 ₸'],['m','60–120 тыс. ₸'],['l','больше 120 000 ₸']],'Любой остаток')}${sel('city',CITY.map(c=>[c,c]),'Все города')}${Object.values(F).some(Boolean)?`<a class="bt sm" onclick="F={q:'',port:'',st:'',col:'',sum:'',city:''};render()">Сбросить</a>`:''}</div>
 <div class="bulk"><span>Показано ${L.length} из ${fmt(BASE_N)} · остаток по выборке <b>${tg(L.reduce((a,d)=>a+rest(d),0))}</b></span><button class="bt sm" onclick="act('Выбранные должники переданы другому коллектору — у каждого в журнале запись «кто и когда переназначил».')">Переназначить</button><button class="bt sm" onclick="go('wa')">WhatsApp по выборке</button></div>
 <div class="pan"><div class="tw"><table class="t dlist"><thead><tr><th>Должник</th><th>Портфель · займ</th><th>Долг</th><th>Оплачено</th><th>Остаток</th><th>Просрочка</th><th>Этап</th><th>Коллектор</th><th>Последний комментарий</th></tr></thead><tbody>${L.map(d=>`<tr class="clk" onclick="openDebt('${d.id}')"><td><b>${esc(d.nm)}</b><br><small>${d.id} · ${d.city}</small></td><td>${d.port}<br><small>${d.cont}</small></td><td class="mono">${fmt(d.tot)}</td><td class="mono pos">${d.paid?fmt(d.paid):'—'}</td><td class="mono"><b>${fmt(rest(d))}</b></td><td class="mono">${d.dpd} дн.</td><td>${stTag(d.st)}</td><td>${CN(d.col)}</td><td class="cmt"><small>${d.last}</small> ${esc((COMM[d.id][0]||['','',''])[2]).slice(0,70)}…</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Именно по суммам, по задолженностям обязательно в Excel')}`};
function openDebt(id){curDebt=id;go('card')}

/* Карточка должника */
SC.card=()=>{const d=DB(curDebt),r=rest(d);
 return `<div class="hd"><div><h2>${esc(d.nm)} · ${d.id}</h2><p>${d.cont} · портфель ${d.port} (${esc(PO(d.port).seller)}) · ${d.city} · просрочка ${d.dpd} дней</p></div><div class="btns"><button class="bt" onclick="go('debtors')">← К списку</button><button class="bt" onclick="act('Звонок через IP-телефонию: номер набран, разговор записывается и попадёт в карточку.')">☎ Позвонить</button><button class="bt p" onclick="card('prom','${d.id}')">+ Обещание</button></div></div>
 <div class="stp">${ST.filter(s=>s[0]!=='nocont').map(s=>`<div class="${s[0]===d.st?'on':''}" style="--sc:${s[2]}" onclick="setSt('${d.id}','${s[0]}')"><i></i>${s[1]}</div>`).join('')}</div>
 <div class="g2 g21"><div>
  <div class="pan"><h3>Задолженность</h3><div class="kv"><span>Основной долг</span><b>${tg(d.body)}</b></div><div class="kv"><span>Вознаграждение</span><b>${tg(d.pct)}</b></div><div class="kv"><span>Пеня</span><b>${tg(d.pen)}</b></div><div class="kv"><span>Итого по договору цессии</span><b>${tg(d.tot)}</b></div><div class="kv"><span>Оплачено</span><b class="pos">${tg(d.paid)}</b></div><div class="kv on"><span><strong>Остаток</strong></span><b>${tg(r)}</b></div>${d.prom?`<div class="pin">Обещание: <b>${tg(d.prom.s)}</b> до ${d.prom.d}</div>`:''}</div>
  <div class="pan"><h3>Комментарии</h3><div class="cms">${COMM[d.id].map(c=>`<div class="cm"><small>${c[0]} · ${esc(c[1])}</small>${esc(c[2])}</div>`).join('')}</div><div class="qin"><input id="cmIn" placeholder="Комментарий: о чём договорились, что дальше"><button class="bt p" onclick="addCm('${d.id}')">Добавить</button></div>
   <div class="tpls">${['Не берёт трубку','Обещал оплатить','Просит реструктуризацию','Номер не обслуживается','Отказ платить','Перезвонить вечером'].map(t=>`<a onclick="document.getElementById('cmIn').value='${t}. '">${t}</a>`).join('')}</div></div>
 </div><div>
  <div class="pan"><h3>Контакты</h3><div class="kv"><span>ИИН</span><b class="mono">${d.iin}</b></div><div class="kv"><span>Телефон</span><b class="mono">${d.ph}</b></div><div class="kv"><span>Город</span><b>${d.city}</b></div><div class="kv"><span>Коллектор</span><b>${CN(d.col)}</b></div></div>
  <div class="pan"><h3>Звонки с записью</h3>${(CALLS[d.id]||[[d.last+' 11:20','исходящий','2:31','Разговор','rec']]).map(c=>`<div class="evt"><span class="mono">${c[0]}</span><b>${c[1]} · ${c[2]}</b><span>${esc(c[3])} ${c[4]?`<a class="play" onclick="act('Запись разговора воспроизводится прямо в карточке.')">▶ запись</a>`:''}</span></div>`).join('')}</div>
  <div class="pan"><h3>Платежи</h3>${(PAYS[d.id]||(d.paid?[['15.09','Kaspi',d.paid,'по номеру договора']]:[])).map(p=>`<div class="evt"><span class="mono">${p[0]}</span><b>${tg(p[2])}</b><span>${p[1]} · ${p[3]}</span></div>`).join('')||'<p class="hint">Платежей ещё не было.</p>'}</div>
  <div class="pan"><h3>Документы</h3>${['Договор займа (от продавца)','Договор цессии и реестр','Уведомление о переуступке','Досудебная претензия'].map((x,i)=>`<div class="doc"><i>${i<3?'PDF':'DOCX'}</i><span>${x}</span></div>`).join('')}</div>
 </div></div>`};
function addCm(id){const v=(document.getElementById('cmIn').value||'').trim();if(!v){toast('Напишите комментарий.');return}COMM[id].unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,v]);const d=DB(id);d.last=TODAY.slice(0,5);AUDIT.unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,role,'Должники','Комментарий '+id,v.slice(0,40),'компьютер']);render();toast('Комментарий сохранён — его видят руководитель и следующий коллектор.')}
function setSt(id,k){const d=DB(id);d.st=k;AUDIT.unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,role,'Должники','Этап '+id,STN(k),'компьютер']);render();toast('Этап: '+STN(k)+'.')}

/* Воронка */
SC.funnel=()=>`<div class="hd"><div><h2>Воронка взыскания</h2><p>Этапы — как вы ведёте должника сейчас в Excel: от выкупа и уведомления о цессии до оплаты, реструктуризации, претензии и суда. Этапы и правила переходов настраиваем под вас. Нажмите на карточку — откроется должник.</p></div></div>
 <div class="kb k10">${ST.map(s=>{const L=DEBT.filter(d=>d.st===s[0]);return `<div class="kc" style="--sc:${s[2]}"><div class="kh"><b>${s[1]}</b><span>${L.length}</span></div>${L.slice(0,6).map(d=>`<div class="kd" onclick="openDebt('${d.id}')"><div class="kt"><b>${esc(d.nm)}</b><span class="src">${CN(d.col)}</span></div><div class="km">${d.port} · ${d.dpd} дн.</div><div class="kf"><span>остаток</span><b>${tg(rest(d))}</b></div></div>`).join('')}${L.length>6?`<div class="kempty">ещё ${L.length-6}</div>`:''}${!L.length?'<div class="kempty">пусто</div>':''}</div>`}).join('')}</div>`;

/* Обещания */
SC.promises=()=>{const P=DEBT.filter(d=>d.prom).sort((a,b)=>a.prom.d.localeCompare(b.prom.d));
 return `<div class="hd"><div><h2>Обещания и графики</h2><p>Каждое обещание — сумма и дата. Накануне должнику уходит напоминание в WhatsApp со ссылкой на оплату. Пришёл платёж — обещание закрывается само; не пришёл — коллектору задача «перезвонить».</p></div></div>
 <div class="wid"><div><small>Обещаний на сегодня</small><b class="a">${promToday().length+38}</b><span>выполнено 21 · ждём до 23:59</span></div><div><small>Выполнение обещаний</small><b class="g">68%</b><span>за 30 дней</span></div><div><small>Не выполнено вчера</small><b class="w">14</b><span>486 000 ₸ · задачи созданы</span></div><div><small>Платят по графику</small><b>2 310</b><span>реструктуризация — 410</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Дата</th><th>Должник</th><th>Сумма</th><th>Остаток долга</th><th>Коллектор</th><th>Напоминание</th><th>Статус</th></tr></thead><tbody>${P.map(d=>`<tr class="clk" onclick="openDebt('${d.id}')"><td class="mono">${d.prom.d}</td><td><b>${esc(d.nm)}</b><br><small>${d.id}</small></td><td class="mono">${tg(d.prom.s)}</td><td class="mono">${tg(rest(d))}</td><td>${CN(d.col)}</td><td>${tag('WhatsApp накануне ✓','g')}</td><td>${d.prom.d==='12.10'?tag('не выполнено','r'):d.prom.d==='13.10'?tag('сегодня','w'):tag('ждём','i')}</td></tr>`).join('')}</tbody></table></div></div>`};
