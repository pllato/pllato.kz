/* ===== Доработки 26.10: каналы связи, воронки производства и лидов, калькулятор, инвентаризация ===== */
/* Все каналы связи */
const CHN={wa:['WhatsApp','#1f8a5b'],tg:['Telegram','#2a8bd2'],ig:['Instagram','#c13584'],ph:['Телефония','#5a1a1f'],em:['Почта','#6b7280'],mb:['МОБИЭС','#c98a1e'],st:['Сайт','#1e2228']};
const chTag=k=>`<span class="srct" style="--sc:${CHN[k][1]}">${CHN[k][0]}</span>`;
let CV=[
 {id:'cv1',ch:'wa',who:'ТОО «Кокше Продукт» · Асель',last:'Можно добавить ещё 40 кг «Народной» к завтрашней?',t:'11:38',un:2,mgr:'Оператор',msgs:[['in','10:02','Доброе утро! Заявка на завтра как обычно'],['out','10:05','Принято: К-101 · 120 кг, К-103 · 80 кг'],['in','11:38','Можно добавить ещё 40 кг «Народной» к завтрашней?']]},
 {id:'cv2',ch:'ph',who:'Минимаркет «Ажар»',last:'Входящий звонок 2:14 · запись',t:'11:21',un:0,mgr:'Ерлан',msgs:[['in','11:21','Звонок 2:14 · «Сардельки будут сегодня?» · запись прикреплена'],['out','11:23','Задача: проверить рейс Р-2 и перезвонить']]},
 {id:'cv3',ch:'mb',who:'ТП Ерлан · Магазин «Береке»',last:'Заявка: К-101 · 12 кг, С-201 · 6 кг',t:'10:52',un:1,mgr:'Ерлан',msgs:[['in','10:52','Заявка из МОБИЭС: К-101 · 12 кг, С-201 · 6 кг']]},
 {id:'cv4',ch:'ig',who:'@stepmarket_astana',last:'Здравствуйте, вы работаете с сетями в Астане?',t:'10:30',un:1,mgr:'—',msgs:[['in','10:30','Здравствуйте, вы работаете с сетями в Астане?']]},
 {id:'cv5',ch:'tg',who:'ИП Жумабаев · Степногорск',last:'Пришлите прайс на ноябрь',t:'09:47',un:0,mgr:'Оператор',msgs:[['in','09:47','Пришлите прайс на ноябрь'],['out','09:50','Прайс_ноябрь.pdf']]},
 {id:'cv6',ch:'em',who:'zakupki@burabay-tour.kz',last:'Запрос КП на сезон: санатории Бурабая',t:'09:12',un:1,mgr:'—',msgs:[['in','09:12','Запрос КП на поставку колбасных изделий в 4 санатория на сезон']]},
 {id:'cv7',ch:'st',who:'Форма на сайте · Тимур',last:'Хочу стать дистрибьютором в Кокшетау',t:'вчера',un:0,mgr:'Оператор',msgs:[['in','вчера','Хочу стать дистрибьютором в Кокшетау, какие условия?']]}
];
let cvF='all',cvSel='cv1';
SC.comms=()=>{const list=CV.filter(c=>cvF==='all'||c.ch===cvF),c=CV.find(x=>x.id===cvSel)||list[0];
 return `<div class="hd"><div><h2>Все каналы связи</h2><p>WhatsApp, Telegram, Instagram, звонки телефонии, почта, сайт и заявки МОБИЭС — в одном окне. Каждый диалог привязан к клиенту и сделке, звонки записываются, из любого сообщения — заявка, задача или сделка одной кнопкой.</p></div></div>
 <div class="oxf">${[['all','Все',CV.length]].concat(Object.keys(CHN).map(k=>[k,CHN[k][0],CV.filter(x=>x.ch===k).length])).map(f=>`<button class="oxc ${cvF===f[0]?'on':''}" onclick="cvF='${f[0]}';render()">${f[1]} <b>${f[2]}</b></button>`).join('')}</div>
 <div class="cvw"><div class="cvl">${list.map(x=>`<div class="cvi ${x.id===(c&&c.id)?'on':''}" onclick="cvSel='${x.id}';CV.find(y=>y.id==='${x.id}').un=0;render()"><div>${chTag(x.ch)} <small>${x.t}</small></div><b>${x.who}</b><span>${x.last}</span>${x.un?`<em>${x.un}</em>`:''}</div>`).join('')}</div>
 <div class="cvc">${c?`<div class="cvh"><div><b>${c.who}</b><small>${CHN[c.ch][0]} · ответственный: ${c.mgr}</small></div><div class="btns"><button class="bt sm" onclick="act('Заявка создана из сообщения: позиции распознаны, на завтра.')">→ Заявка</button><button class="bt sm" onclick="go('funnel')">→ Сделка</button><button class="bt sm" onclick="act('Задача поставлена с напоминанием.')">→ Задача</button></div></div>
  <div class="cvm">${c.msgs.map(m=>`<div class="msg ${m[0]}"><span>${m[2]}</span><small>${m[1]}</small></div>`).join('')}</div>
  <div class="cvin"><input placeholder="Ответить в ${CHN[c.ch][0]}…" onkeydown="if(event.key==='Enter'&&this.value){CV.find(y=>y.id==='${c.id}').msgs.push(['out','${NOW}',this.value]);render()}"><button class="bt p sm" onclick="const i=this.previousElementSibling;if(i.value){CV.find(y=>y.id==='${c.id}').msgs.push(['out','${NOW}',i.value]);render()}">Отправить</button></div>`:''}</div></div>
 ${tip('Каналы','Подключаем то, чем вы пользуетесь: номера WhatsApp, Telegram, Instagram, IP-телефонию с записью звонков, почту и форму сайта. Заявки МОБИЭС приходят в эту же ленту.')}`};

/* Воронка производства */
const PFS=[['ok','Заявка утверждена'],['raw','Сырьё выдано'],['mince','Фарш / куттер'],['form','Формовка'],['heat','Термообработка'],['cool','Охлаждение'],['pack','Упаковка'],['gp','На складе ГП']];
let PF=[
 {id:'П-1030',sku:'К-101',kg:330,st:'ok',sh:'1-я',who:'Мастер Канат',t:'06:00'},
 {id:'П-1031',sku:'К-103',kg:230,st:'raw',sh:'1-я',who:'Мастер Канат',t:'06:20'},
 {id:'П-1032',sku:'С-201',kg:220,st:'mince',sh:'1-я',who:'Мастер Канат',t:'06:40'},
 {id:'П-1027',sku:'К-102',kg:280,st:'heat',sh:'1-я',who:'Мастер Канат',t:'05:10'},
 {id:'П-1028',sku:'С-202',kg:180,st:'pack',sh:'ночная',who:'Мастер Айдос',t:'02:00'},
 {id:'П-1026',sku:'П-301',kg:150,st:'cool',sh:'ночная',who:'Мастер Айдос',t:'вчера 22:00'},
 {id:'П-1025',sku:'К-101',kg:260,st:'gp',sh:'ночная',who:'Мастер Айдос',t:'вчера 20:00'}
];
const REC={'К-101':[['Говядина жилованная','62%'],['Шпик','12%'],['Вода/лёд','18%'],['Специи, соль','3%'],['Оболочка','—']],'К-103':[['Говядина','48%'],['Курица МДМ','22%'],['Вода/лёд','24%'],['Специи','3%']],'С-201':[['Говядина','40%'],['Курица','30%'],['Молоко сухое','4%'],['Вода/лёд','22%']]};
SC.pfunnel=()=>`<div class="hd"><div><h2>Воронка производства</h2><p>Каждая партия идёт по этапам цеха: от утверждённой заявки до склада ГП. Нажмите на карточку — откроется партия: рецептура, списанное сырьё, ответственный, время этапов, кнопка «следующий этап».</p></div></div>
 <div class="oxk" style="grid-template-columns:repeat(8,minmax(140px,1fr))">${PFS.map(f=>`<div class="oxkc"><h4>${f[1]} <small>${PF.filter(p=>p.st===f[0]).length}</small></h4>${PF.filter(p=>p.st===f[0]).map(p=>`<div class="oxkt" onclick="card('pf','${p.id}')"><b>${SD(p.sku)[1].replace('Колбаса ','')}</b><span>${p.id} · ${p.kg} кг</span><small>${p.sh} смена · ${p.who}</small></div>`).join('')}</div>`).join('')}</div>
 <div class="g2"><div class="pan"><h3>Сегодня по цеху</h3>${bars(PFS.map(f=>[f[1],PF.filter(p=>p.st===f[0]).reduce((a,p)=>a+p.kg,0),fmt(PF.filter(p=>p.st===f[0]).reduce((a,p)=>a+p.kg,0))+' кг']))}</div><div class="pan"><h3>Узкое место</h3><div class="kv"><span>Термообработка</span><b>камера 2 занята до 12:40</b></div><div class="kv"><span>Ближайший рейс</span><b>Р-3 в 15:00 · успеваем 4 партии</b></div></div></div>`;
CARD.pf=id=>{const p=PF.find(x=>x.id===id),s=SD(p.sku),i=PFS.findIndex(f=>f[0]===p.st),r=REC[p.sku]||REC['К-101'];
 return [`Партия ${p.id} · ${s[1]}`,`${p.kg} кг · ${p.sh} смена · ${p.who} · этап: ${PFS[i][1]}`,
 `<div class="pfst">${PFS.map((f,j)=>`<span class="${j<i?'done':j===i?'cur':''}">${f[1]}</span>`).join('')}</div>
 <div class="g2" style="margin-top:10px"><div><h3>Рецептура</h3>${r.map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div><div><h3>Сырьё списано</h3>${i>=1?r.slice(0,3).map(x=>`<div class="kv"><span>${x[0]}</span><b class="mono">${Math.round(p.kg*parseFloat(x[1])/100)} кг</b></div>`).join(''):'<p class="hint">Спишется при выдаче сырья.</p>'}</div></div>
 <h3 style="margin-top:10px">Журнал</h3><div class="kv"><span>${p.t}</span><b>${PFS[0][1]} · из заявки на 27.10</b></div>${i>0?`<div class="kv"><span>+40 мин</span><b>${PFS[1][1]} · кладовщик сырья</b></div>`:''}
 <div class="btns l" style="margin-top:10px">${i<PFS.length-1?`<button class="bt p" onclick="pfNext('${p.id}')">Готово → ${PFS[i+1][1]}</button>`:tag('на складе ГП · ждёт рейс','g')}</div>`]};
function pfNext(id){const p=PF.find(x=>x.id===id),i=PFS.findIndex(f=>f[0]===p.st);p.st=PFS[i+1][0];if(p.st==='gp'){const s=SD(p.sku);s[3]+=p.kg}closeM();toast(`${p.id}: «${PFS[i+1][1]}».`+(p.st==='raw'?' Сырьё списано по рецептуре.':p.st==='gp'?' Партия на складе ГП, срок пошёл, попадёт в ближайший рейс.':''));render()}

/* Воронка лидов + калькулятор */
const LFS=[['new','Новый лид'],['ct','Контакт'],['tr','Дегустация / пробная поставка'],['kp','КП и цены'],['dg','Договор'],['go','Первая поставка']];
let LD=[
 {id:'Л-301',n:'ТОО «Степь Маркет»',d:'сеть 6 магазинов · Астана',src:'ig',st:'new',type:'сеть'},
 {id:'Л-298',n:'zakupki@burabay-tour.kz',d:'4 санатория Бурабая · сезон',src:'em',st:'ct',type:'HoReCa'},
 {id:'Л-295',n:'ИП Жумабаев',d:'дистрибьютор · Степногорск',src:'tg',st:'tr',type:'дистрибьютор'},
 {id:'Л-290',n:'Тимур · Кокшетау',d:'хочет стать дистрибьютором',src:'st',st:'kp',type:'дистрибьютор'},
 {id:'Л-287',n:'ТОО «Кокше Продукт»',d:'опт · 2 т в неделю',src:'wa',st:'dg',type:'опт'},
 {id:'Л-280',n:'Магазин «Сауле»',d:'через торгового · Кокшетау',src:'mb',st:'go',type:'розница'}
];
const PRICE={'К-101':2650,'К-102':1450,'К-103':2190,'С-201':2380,'С-202':2560,'П-301':3890,'Д-401':4200};
const DISC={'розница':0,'опт':8,'дистрибьютор':12,'сеть':6,'HoReCa':5};
let CALC={'К-101':120,'К-103':80,'С-201':40},calcLead='Л-287',calcDel='своя машина · 0 ₸';
const calcTot=t=>{const sub=Object.entries(CALC).reduce((a,[k,q])=>a+PRICE[k]*q,0),d=Math.round(sub*(DISC[t]||0)/100),del=/0 ₸/.test(calcDel)?0:25000;return {sub,d,del,tot:sub-d+del}};
SC.funnel=()=>`<div class="hd"><div><h2>Воронка лидов</h2><p>Новые оптовики, сети, дистрибьюторы и HoReCa — из всех каналов. Нажмите на карточку — откроется сделка: история, переписка, калькулятор заказа с ценой по типу клиента и кнопки КП и счёта в WhatsApp.</p></div></div>
 <div class="oxk" style="grid-template-columns:repeat(6,minmax(150px,1fr))">${LFS.map(f=>`<div class="oxkc"><h4>${f[1]} <small>${LD.filter(l=>l.st===f[0]).length}</small></h4>${LD.filter(l=>l.st===f[0]).map(l=>`<div class="oxkt" onclick="calcLead='${l.id}';card('ld','${l.id}')"><b>${l.n}</b><span>${l.d}</span><small>${CHN[l.src][0]} · ${l.type}</small></div>`).join('')}</div>`).join('')}</div>
 <div class="pan"><h3>Конверсия за октябрь</h3>${bars([['Лиды',48,'48'],['Контакт',36,'36'],['Пробная поставка',17,'17'],['КП',14,'14'],['Договор',8,'8'],['Первая поставка',6,'6']])}</div>`;
CARD.ld=id=>{const l=LD.find(x=>x.id===id),i=LFS.findIndex(f=>f[0]===l.st),t=calcTot(l.type);
 return [`${l.n}`,`${l.id} · ${l.d} · ${CHN[l.src][0]} · этап: ${LFS[i][1]}`,
 `<div class="pfst">${LFS.map((f,j)=>`<span class="${j<i?'done':j===i?'cur':''}">${f[1]}</span>`).join('')}</div>
 <h3 style="margin-top:12px">Калькулятор заказа · тип клиента: ${l.type} (скидка ${DISC[l.type]||0}%)</h3>
 <div class="tw"><table class="t"><thead><tr><th>Позиция</th><th style="text-align:right">Цена</th><th style="text-align:right">Кол-во</th><th style="text-align:right">Сумма</th></tr></thead><tbody>${SKU.map(s=>`<tr><td>${s[1]}</td><td class="mono" style="text-align:right">${fmt(PRICE[s[0]])}</td><td style="text-align:right"><input class="bz-qty" type="number" min="0" value="${CALC[s[0]]||0}" onchange="CALC['${s[0]}']=+this.value||0;card('ld','${l.id}')"> ${s[2]}</td><td class="mono" style="text-align:right">${fmt(PRICE[s[0]]*(CALC[s[0]]||0))}</td></tr>`).join('')}</tbody></table></div>
 <div class="kv"><span>Доставка</span><b><select onchange="calcDel=this.value;card('ld','${l.id}')">${['своя машина · 0 ₸','межгород · 25 000 ₸'].map(x=>`<option ${x===calcDel?'selected':''}>${x}</option>`).join('')}</select></b></div>
 <div class="kv"><span>Сумма</span><b class="mono">${tg(t.sub)}</b></div><div class="kv"><span>Скидка ${DISC[l.type]||0}%</span><b class="mono">−${tg(t.d)}</b></div><div class="kv"><span>Доставка</span><b class="mono">${tg(t.del)}</b></div><div class="kv"><span><b>Итого</b></span><b class="mono">${tg(t.tot)}</b></div>
 <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="act('КП на ${tg(t.tot)} собрано и отправлено в ${CHN[l.src][0]}.')">КП в ${CHN[l.src][0]}</button><button class="bt" onclick="act('Счёт на ${tg(t.tot)} выставлен и отправлен клиенту.')">Счёт</button>${i<LFS.length-1?`<button class="bt" onclick="ldNext('${l.id}')">→ ${LFS[i+1][1]}</button>`:''}</div>`]};
function ldNext(id){const l=LD.find(x=>x.id===id),i=LFS.findIndex(f=>f[0]===l.st);l.st=LFS[i+1][0];closeM();toast(`${l.n} → «${LFS[i+1][1]}».`+(l.st==='go'?' Клиент добавлен в заявки и дебиторку.':''));render()}

/* Инвентаризация — пошагово */
let INV={step:0,zone:'Склад реализации · камера 1',cnt:{'К-101':270,'К-102':340,'К-103':140,'С-201':95,'С-202':70,'П-301':420,'Д-401':22},done:{}};
const INVZ=['Склад реализации · камера 1','Склад реализации · камера 2','Склад ГП'];
const invDiff=s=>(INV.cnt[s[0]]??s[5])-s[5];
SC.inv=()=>{const st=['1 · Зона','2 · Пересчёт','3 · Расхождения','4 · Провести'];const counted=Object.keys(INV.done).length;
 return `<div class="hd"><div><h2>Инвентаризация</h2><p>Пошагово, с телефона кладовщика: выбрать зону → пересчитать позиции кнопками «+/−» или сканером → система сама находит расхождения и узнаёт пересорт → провести одним документом, корректировка уходит в 1С.</p></div></div>
 <div class="pfst big">${st.map((x,i)=>`<span class="${i<INV.step?'done':i===INV.step?'cur':''}" onclick="INV.step=${i};render()">${x}</span>`).join('')}</div>
 ${INV.step===0?`<div class="g3">${INVZ.map(z=>`<div class="pan clk invz ${z===INV.zone?'on':''}" onclick="INV.zone='${z}';INV.step=1;render()"><h3>${z}</h3><div class="kv"><span>Позиций</span><b>${SKU.length}</b></div><div class="kv"><span>Последняя</span><b>${z.includes('ГП')?'19.10':'24.10'}</b></div><button class="bt p sm">Начать</button></div>`).join('')}</div>`:''}
 ${INV.step===1?`<div class="pan"><h3>${INV.zone} · посчитано ${counted} из ${SKU.length}</h3><div class="bz-occ" style="margin-bottom:10px"><i style="width:${counted/SKU.length*100}%"></i></div>${SKU.map(s=>`<div class="invr ${INV.done[s[0]]?'ok':''}"><div><b>${s[1]}</b><small class="mono">${s[0]} · по учёту ${s[5]} ${s[2]}</small></div><div class="invc"><button class="bt sm" onclick="INV.cnt['${s[0]}']=(INV.cnt['${s[0]}']??${s[5]})-${s[2]==='шт'?1:5};render()">−</button><b class="mono">${INV.cnt[s[0]]??s[5]} ${s[2]}</b><button class="bt sm" onclick="INV.cnt['${s[0]}']=(INV.cnt['${s[0]}']??${s[5]})+${s[2]==='шт'?1:5};render()">+</button><button class="bt ${INV.done[s[0]]?'':'p'} sm" onclick="INV.done['${s[0]}']=1;render()">${INV.done[s[0]]?'✓':'Посчитано'}</button></div></div>`).join('')}
  <div class="btns l" style="margin-top:10px"><button class="bt" onclick="act('Сканер: наведите камеру на штрихкод ящика — позиция и вес подставятся сами.')">Сканировать</button><button class="bt p" onclick="SKU.forEach(s=>INV.done[s[0]]=1);INV.step=2;render()">Завершить пересчёт</button></div></div>`:''}
 ${INV.step===2?`<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Позиция</th><th style="text-align:right">Учёт</th><th style="text-align:right">Факт</th><th style="text-align:right">Разница</th><th>Вывод</th></tr></thead><tbody>${SKU.map(s=>{const d=invDiff(s);const pair=s[0]==='К-101'&&invDiff(SD('К-102'))>0||s[0]==='К-102'&&invDiff(SD('К-101'))<0;return `<tr class="${pair?'rowwarn':d?'rowbad':''}"><td><b>${s[1]}</b></td><td class="mono" style="text-align:right">${s[5]}</td><td class="mono" style="text-align:right">${INV.cnt[s[0]]??s[5]}</td><td class="mono" style="text-align:right">${d>0?'+':''}${d||'—'}</td><td>${pair?tag('пересорт: батон ↔ штучная','w'):d?tag(d<0?'недостача':'излишек','r'):tag('совпало','g')}</td></tr>`}).join('')}</tbody></table></div>
  <div class="pairv"><div><small>Батон К-101</small><b>−40 кг</b></div><i>⇄</i><div><small>Штучная К-102</small><b>+80 шт × 0,5 кг = +40 кг</b></div><span>Вес совпадает — это пересорт при сборке, а не недостача.</span></div>
  <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="INV.step=3;render()">Далее → провести</button></div></div>`:''}
 ${INV.step===3?`<div class="pan"><h3>Документ инвентаризации · ${INV.zone}</h3><div class="kv"><span>Пересорт К-101 ⇄ К-102</span><b>исправить — одним документом</b></div><div class="kv"><span>Недостачи и излишки</span><b>${SKU.filter(s=>invDiff(s)&&!['К-101','К-102'].includes(s[0])).length||'нет'}</b></div><div class="kv"><span>Корректировка в 1С</span><b>уйдёт после проведения</b></div><div class="btns l" style="margin-top:10px"><button class="bt p" onclick="SKU.forEach(s=>{s[5]=INV.cnt[s[0]]??s[5]});INV={step:0,zone:INV.zone,cnt:{},done:{}};toast('Инвентаризация проведена: остатки исправлены, пересорт закрыт, корректировка ушла в 1С.');render()">Провести</button></div></div>`:''}
 ${said('Когда возникает вопрос в пересортах — по факту на складе товар есть, но другого аналогичного вида больше ровно настолько, сколько должно было быть')}`};
