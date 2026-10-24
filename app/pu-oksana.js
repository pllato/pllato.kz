/* ПУ ДЕТАЛЬ — CRM и учёт производства изделий из полиуретана: все обращения (WhatsApp, звонки, сайт, площадки) сразу к менеджеру, воронка заказного изделия от чертежа до отгрузки, расчёт цены по чертежу, КП, счёт и договор одной кнопкой с отправкой в WhatsApp, источники рекламы, KPI, производство по этапам, пресс-формы, склад сырья и готовой продукции. Название, клиенты, изделия и суммы вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const TODAY='27.10.2026',NOW='14:30';
const LOGO_I='<svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="38" fill="currentColor"/><circle cx="50" cy="50" r="22" fill="var(--brand2,#f07b16)"/><circle cx="50" cy="50" r="10" fill="currentColor"/></svg>';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>«${q}»</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const tip=(h,t)=>`<div class="said bz-tip"><b>${h}</b><div class="said-a" style="margin-top:2px">${t}</div></div>`;
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
const SC={},CARD={};
const SEC=[
 {k:'top',n:'Руководителю',sub:[['dash','Пульт РОПа'],['ads','Источники и реклама'],['kpi','KPI менеджеров']]},
 {k:'sl',n:'Продажи',sub:[['inbox','Все обращения'],['funnel','Воронка заказа'],['calc','Расчёт по чертежу'],['docs','КП, счёт, договор'],['clients','Клиенты']]},
 {k:'pr',n:'Производство',sub:[['prod','Заказы в производстве'],['molds','Пресс-формы']]},
 {k:'wh',n:'Склады',sub:[['raw','Склад сырья'],['fg','Готовая продукция и отгрузки']]},
 {k:'sys',n:'Внедрение',sub:[['onec','1С — позже'],['launch','Стоимость и этапы']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'РОП':{av:'ОК',n:'Оксана',note:'Воронка, менеджеры, источники, KPI, документы',s:ALL.slice()},
 'Директор':{av:'АШ',n:'Александр',note:'Пульт, продажи, производство, склады',s:['dash','ads','kpi','funnel','prod','raw','fg','launch']},
 'Менеджер':{av:'МН',n:'Светлана',note:'Свои обращения, расчёты, КП, счета',s:['inbox','funnel','calc','docs','clients']},
 'Производство':{av:'ТХ',n:'Технолог · цех',note:'Заказы по этапам, пресс-формы, сырьё',s:['prod','molds','raw']},
 'Склад':{av:'СК',n:'Кладовщик',note:'Сырьё, готовая продукция, отгрузки',s:['raw','fg']}
};
let role='РОП',cur='dash',theme='light';
const SRC={ig:['Instagram','#c13584'],gg:['Google','#4285f4'],st:['Сайт','#1e2228'],kp:['Kaspi / площадки','#e5332a'],ph:['Звонок','#6b7280'],rf:['Рекомендация','#1f8a5b']};
const srcTag=k=>`<span class="srct" style="--sc:${SRC[k][1]}">${SRC[k][0]}</span>`;
const FST=[['new','Новое обращение'],['tz','Фото, чертёж, размеры'],['calc','Расчёт'],['kp','КП отправлено'],['inv','Счёт · ждём оплату'],['prod','В производстве'],['ship','Отгрузка'],['done','Завершено']];
let DL=[
 {id:'С-1184',cl:'ТОО «АвтоПарк Логистик»',it:'Сайлентблоки рычага · 120 шт',src:'gg',st:'calc',sum:0,mgr:'Светлана',d:'сегодня'},
 {id:'С-1183',cl:'СТО «Ходовая+»',it:'Втулки стабилизатора · 400 шт',src:'ig',st:'kp',sum:1240000,mgr:'Светлана',d:'вчера'},
 {id:'С-1181',cl:'ТОО «КазМашЗавод»',it:'Футеровка бункера · по чертежу',src:'st',st:'tz',sum:0,mgr:'Светлана',d:'вчера'},
 {id:'С-1179',cl:'ИП Ахметов (фура)',it:'Отбойники · 8 шт',src:'ph',st:'inv',sum:186000,mgr:'Светлана',d:'22.10'},
 {id:'С-1176',cl:'ТОО «Горный Сервис»',it:'Ролики конвейера · 60 шт',src:'rf',st:'prod',sum:2310000,mgr:'Светлана',d:'20.10'},
 {id:'С-1172',cl:'СТО «Мастер Подвеска»',it:'Втулки рессор · 200 шт',src:'kp',st:'ship',sum:540000,mgr:'Светлана',d:'17.10'},
 {id:'С-1185',cl:'Новый · +7 777 *** 41 20',it:'«Нужны втулки на Камаз, сколько стоит?»',src:'ig',st:'new',sum:0,mgr:'—',d:'14:22'}
];
/* Пульт РОПа */
SC.dash=()=>`<div class="hd"><div><h2>Пульт РОПа · ${TODAY}</h2><p>Сколько обращений пришло и откуда, сколько дошло до расчёта, КП и оплаты, кто из менеджеров не ответил. Цифры собираются сами из переписок, звонков и сделок.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('inbox')"><small>Обращений за неделю</small><b class="a">64</b><span>WhatsApp 38 · звонки 17 · сайт 9</span></div>
  <div class="clk" onclick="go('inbox')"><small>Без ответа</small><b>2</b><span>дольше 15 минут</span></div>
  <div class="clk" onclick="go('funnel')"><small>В расчёте и КП</small><b>${DL.filter(d=>['tz','calc','kp'].includes(d.st)).length+17}</b><span>ждут чертежи: 6</span></div>
  <div class="clk" onclick="go('funnel')"><small>Оплачено за октябрь</small><b class="g">${tg(14820000)}</b><span>41 заказ · средний чек 361 тыс.</span></div>
  <div class="clk" onclick="go('prod')"><small>В производстве</small><b>12 заказов</b><span>2 — срок под угрозой</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Воронка за октябрь</h3>${bars([['Обращения',248,'248'],['Получили фото или чертёж',151,'151'],['Расчёт сделан',122,'122'],['КП отправлено',97,'97'],['Счёт выставлен',58,'58'],['Оплачено',41,'41']])}</div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="go('inbox')"><i></i><div><b>Instagram · «Нужны втулки на Камаз» — 8 мин без ответа</b><span>менеджер не назначен</span></div></div>
  <div class="rf" onclick="go('funnel')"><i></i><div><b>КП «Ходовая+» без ответа 2 дня</b><span>напомнить клиенту</span></div></div>
  <div class="rf" onclick="go('prod')"><i></i><div><b>Ролики конвейера · отверждение затянулось</b><span>отгрузка 29.10 под угрозой</span></div></div>
  <div class="rf" onclick="go('raw')"><i></i><div><b>Изоцианат — на 6 дней</b><span>заказ поставщику не создан</span></div></div>
 </div></div>
 ${said('Хотим внедрить CRM, чтобы лиды падали из платформ и сайтов напрямую к менеджеру')}`;

SC.ads=()=>`<div class="hd"><div><h2>Источники и реклама</h2><p>Каждое обращение помечено источником: Instagram, Google, сайт, площадки, звонок, рекомендация. Видно, откуда идут продажи, а откуда только разговоры, и сколько стоит оплаченный заказ из рекламы.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Источник</th><th style="text-align:right">Обращений</th><th style="text-align:right">Расчётов</th><th style="text-align:right">Оплат</th><th style="text-align:right">Выручка</th><th style="text-align:right">Реклама</th><th style="text-align:right">Цена заказа</th></tr></thead><tbody>${[['ig',112,48,12,3.9,480000],['gg',61,37,14,5.6,620000],['st',29,18,7,2.8,0],['kp',18,9,4,0.9,0],['ph',17,6,2,0.7,0],['rf',11,4,2,0.9,0]].map(r=>`<tr><td>${srcTag(r[0])}</td><td class="mono" style="text-align:right">${r[1]}</td><td class="mono" style="text-align:right">${r[2]}</td><td class="mono" style="text-align:right">${r[3]}</td><td class="mono" style="text-align:right">${r[4].toFixed(1).replace('.',',')} млн</td><td class="mono" style="text-align:right">${r[5]?fmt(r[5]):'—'}</td><td class="mono" style="text-align:right">${r[5]?fmt(r[5]/r[3]):'—'}</td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Креативы','Для Instagram и Google метка ставится до объявления: видно, какой креатив приводит покупателей, а какой — только вопросы «сколько стоит».')}
 ${said('Рекламу даём в Instagram и Google, запустили')}`;

SC.kpi=()=>`<div class="hd"><div><h2>KPI менеджеров</h2><p>Скорость ответа, сколько обращений довели до расчёта, КП и оплаты, сумма продаж. Когда придут ещё двое менеджеров — их цифры видны с первого дня.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Менеджер</th><th style="text-align:right">Первый ответ</th><th style="text-align:right">Обращений</th><th style="text-align:right">Расчётов</th><th style="text-align:right">Оплат</th><th style="text-align:right">Продажи</th><th>План</th></tr></thead><tbody>${[['Светлана','4 мин',198,104,36,13.1,94],['Новый менеджер 1','с 01.11','—','—','—',0,0],['Новый менеджер 2','с 01.11','—','—','—',0,0]].map(r=>`<tr><td><b>${r[0]}</b></td><td class="mono" style="text-align:right">${r[1]}</td><td class="mono" style="text-align:right">${r[2]}</td><td class="mono" style="text-align:right">${r[3]}</td><td class="mono" style="text-align:right">${r[4]}</td><td class="mono" style="text-align:right">${r[5]?r[5].toFixed(1).replace('.',',')+' млн':'—'}</td><td>${r[6]?`<div class="bz-occ"><i style="width:${r[6]}%"></i></div><small class="mono">${r[6]}%</small>`:'—'}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Что считаем</h3>${[['Скорость первого ответа','по каждому обращению'],['Доля обращений с чертежом','получили фото или размеры'],['Конверсия расчёт → оплата','по менеджеру и источнику'],['Средний чек и маржа','по заказу']].map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div><div class="pan"><h3>План на ноябрь</h3><div class="kv"><span>Отдел</span><b>18 млн ₸</b></div><div class="kv"><span>На менеджера</span><b>6 млн ₸ · с ростом штата</b></div></div></div>`;

/* Обращения */
let INB=[['14:22','ig','+7 777 *** 41 20','Нужны втулки на Камаз, сколько стоит?','',1],['14:05','ph','ТОО «АвтоПарк Логистик»','Звонок 3:41 · запись · просят сайлентблоки','Светлана',0],['13:48','st','Заявка с сайта','Футеровка бункера, чертёж во вложении','Светлана',0],['13:10','kp','Kaspi · покупатель','Втулки рессор, есть ли в наличии?','Светлана',0]];
SC.inbox=()=>`<div class="hd"><div><h2>Все обращения</h2><p>WhatsApp, звонки телефонии, заявки с сайта, Instagram и площадок — в одной ленте. Новое обращение сразу назначается менеджеру; звонок записывается и прикрепляется к клиенту. Фото и чертежи из WhatsApp сохраняются в сделку.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Источник</th><th>Клиент</th><th>Сообщение</th><th>Менеджер</th><th></th></tr></thead><tbody>${INB.map((r,i)=>`<tr class="${r[5]?'rowwarn':''}"><td class="mono">${r[0]}</td><td>${srcTag(r[1])}</td><td><b>${r[2]}</b></td><td>${r[3]}</td><td>${r[4]||'—'}</td><td>${r[5]?`<button class="bt p sm" onclick="take(${i})">Взять</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Распределение','Обращения распределяются по очереди или по правилам: Kaspi — одному менеджеру, заводы — другому. Если менеджер не ответил за 15 минут, РОП получает уведомление.')}
 ${said('WhatsApp и телефония обязательно: готовых изделий нет, цену не скажем, пока не увидим фото, чертежи, размеры')}`;
function take(i){INB[i][4]='Светлана';INB[i][5]=0;const d=DL.find(x=>x.st==='new');if(d){d.mgr='Светлана';d.st='tz'}toast('Обращение у Светланы. Создана сделка, клиенту ушёл шаблон: «Пришлите фото детали, чертёж или размеры — посчитаем за час».');render()}

SC.funnel=()=>`<div class="hd"><div><h2>Воронка заказа</h2><p>Заказное изделие: от обращения через фото и чертёж, расчёт, КП и счёт до производства и отгрузки. На каждом этапе — что нужно сделать и сколько сделка уже стоит. Нажмите на карточку — она перейдёт дальше.</p></div></div>
 <div class="oxk" style="grid-template-columns:repeat(8,minmax(150px,1fr))">${FST.map(f=>`<div class="oxkc"><h4>${f[1]} <small>${DL.filter(d=>d.st===f[0]).length}</small></h4>${DL.filter(d=>d.st===f[0]).map(d=>`<div class="oxkt" onclick="dNext('${d.id}')"><b>${d.cl}</b><span>${d.it}</span><small>${SRC[d.src][0]} · ${d.sum?tg(d.sum):'сумма после расчёта'} · ${d.d}</small></div>`).join('')}</div>`).join('')}</div>`;
function dNext(id){const d=DL.find(x=>x.id===id);const i=FST.findIndex(f=>f[0]===d.st);if(i>=FST.length-1){toast(d.cl+': заказ завершён.');return}d.st=FST[i+1][0];if(d.st==='calc'){curCalc=d.id}if(d.st==='kp'&&!d.sum)d.sum=860000;toast(`${d.cl} → «${FST[i+1][1]}».`+(d.st==='kp'?' КП собрано по расчёту и отправлено в WhatsApp.':d.st==='prod'?' Оплата получена — заказ ушёл в цех, сырьё зарезервировано.':''));render()}
/* Расчёт по чертежу */
let curCalc='С-1184',CQ={mat:'СКУ-ПФЛ · 85 Shore A',w:0.18,q:120,arm:1,mold:'есть'};
const MAT={'СКУ-ПФЛ · 85 Shore A':4200,'СКУ-ПФЛ · 95 Shore A':4600,'Адипрен · 90 Shore A':6800};
const calcSum=()=>{const m=MAT[CQ.mat]*CQ.w*1.25,arm=CQ.arm?650:0,work=1100,mold=CQ.mold==='есть'?0:180000;return Math.round(((m+arm+work)*CQ.q+mold)*1.35/100)*100};
SC.calc=()=>{const d=DL.find(x=>x.id===curCalc)||DL[0];
 return `<div class="hd"><div><h2>Расчёт по чертежу · ${d.cl}</h2><p>Менеджер или технолог заполняет параметры по фото и чертежу: материал и твёрдость, вес детали, тираж, металлическая арматура, пресс-форма. Цена считается по вашим нормам и сразу попадает в КП.</p></div></div>
 <div class="g2 g21"><div class="pan"><h3>${d.it}</h3>
  <div class="kv"><span>Чертёж и фото</span><b>чертёж_рычаг.pdf · 3 фото из WhatsApp</b></div>
  <div class="kv"><span>Материал</span><b><select onchange="CQ.mat=this.value;render()">${Object.keys(MAT).map(k=>`<option ${k===CQ.mat?'selected':''}>${k}</option>`).join('')}</select></b></div>
  <div class="kv"><span>Вес детали, кг</span><b><input class="bz-qty" type="number" step="0.01" value="${CQ.w}" onchange="CQ.w=+this.value||0;render()"></b></div>
  <div class="kv"><span>Тираж, шт</span><b><input class="bz-qty" type="number" value="${CQ.q}" onchange="CQ.q=+this.value||0;render()"></b></div>
  <div class="kv"><span>Металлическая арматура</span><b><select onchange="CQ.arm=+this.value;render()"><option value="1" ${CQ.arm?'selected':''}>да</option><option value="0" ${CQ.arm?'':'selected'}>нет</option></select></b></div>
  <div class="kv"><span>Пресс-форма</span><b><select onchange="CQ.mold=this.value;render()">${['есть','изготовить'].map(x=>`<option ${x===CQ.mold?'selected':''}>${x}</option>`).join('')}</select></b></div></div>
 <div class="pan"><h3>Цена</h3><div class="kv"><span>За штуку</span><b class="mono">${tg(calcSum()/Math.max(1,CQ.q))}</b></div><div class="kv"><span>Партия</span><b class="mono">${tg(calcSum())}</b></div><div class="kv"><span>Срок изготовления</span><b>${CQ.mold==='есть'?'7–10 дней':'18–21 день (с пресс-формой)'}</b></div>
  <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="d=DL.find(x=>x.id===curCalc);if(d){d.sum=calcSum();d.st='kp'};go('docs')">Собрать КП</button></div>
  ${tip('Нормы','Цены материалов, расход, стоимость работ и наценку задаёте вы; технолог может поправить расчёт перед отправкой.')}</div></div>`};

/* Документы */
SC.docs=()=>{const d=DL.find(x=>x.id===curCalc)||DL[0];const s=d.sum||calcSum();
 return `<div class="hd"><div><h2>КП, счёт, договор</h2><p>Документы собираются из сделки и расчёта по вашим шаблонам — одним нажатием. Отправка клиенту в WhatsApp с подписью; клиент открывает КП как PDF или ссылку. Все версии хранятся в сделке.</p></div></div>
 <div class="g2"><div class="pan"><h3>${d.cl} · ${d.it}</h3>${[['Коммерческое предложение','КП-'+d.id.slice(2)+' · '+tg(s)],['Счёт на оплату','СЧ-'+d.id.slice(2)+' · '+tg(s)+' · предоплата 70%'],['Договор поставки','ДГ-'+d.id.slice(2)+' · срок 7–10 дней'],['Накладная и акт','после отгрузки']].map((r,i)=>`<div class="kv"><span>${r[0]}</span><b>${r[1]} ${i<3?`<button class="bt sm" onclick="act('${r[0]} отправлен(о) клиенту в WhatsApp: PDF и подпись. Отметка в сделке.')">В WhatsApp</button>`:''}</b></div>`).join('')}</div>
 <div class="pan"><h3>Пример сообщения</h3><div class="kv"><span>Текст</span><b>Добрый день! Высылаем КП на ${d.it.toLowerCase()}: ${tg(s)}, срок 7–10 дней. Чертёж согласован.</b></div><div class="kv"><span>Вложение</span><b>KP-${d.id}.pdf</b></div><div class="kv"><span>Если нет ответа</span><b>напоминание менеджеру через 2 дня</b></div></div></div>
 ${said('Мне нравится, когда можно КП, счета, договоры')}`};

SC.clients=()=>`<div class="hd"><div><h2>Клиенты</h2><p>СТО, автопарки, заводы и розница: история заказов, чертежи и расчёты, переписка и звонки, кто из клиентов давно не заказывал. Повторный заказ — по прошлому расчёту за минуту.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Тип</th><th style="text-align:right">Заказов</th><th style="text-align:right">Сумма за год</th><th>Последний заказ</th></tr></thead><tbody>${[['ТОО «Горный Сервис»','завод',9,'11,4 млн','20.10'],['СТО «Мастер Подвеска»','СТО',14,'6,2 млн','17.10'],['ТОО «АвтоПарк Логистик»','автопарк',4,'3,8 млн','12.08'],['СТО «Ходовая+»','СТО',6,'2,1 млн','03.09'],['ИП Ахметов (фура)','частный',2,'0,4 млн','22.10']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="mono" style="text-align:right">${r[2]}</td><td class="mono" style="text-align:right">${r[3]}</td><td class="mono">${r[4]}</td></tr>`).join('')}</tbody></table></div></div>`;

/* Производство */
const PST=['Пресс-форма','Подготовка','Заливка','Отверждение','Мехобработка','ОТК','Упаковка'];
let PO=[['З-412','ТОО «Горный Сервис»','Ролики конвейера · 60 шт','29.10',3,1],['З-413','СТО «Мастер Подвеска»','Втулки рессор · 200 шт','27.10',6,0],['З-415','ТОО «Дор Техника»','Сайлентблоки · 80 шт','02.11',2,0],['З-416','ИП Ахметов (фура)','Отбойники · 8 шт','30.10',0,0]];
SC.prod=()=>`<div class="hd"><div><h2>Заказы в производстве</h2><p>Оплаченный заказ сам попадает в цех: этапы, сроки, ответственный. Технолог отмечает этап с телефона, менеджер и клиент видят, когда будет готово. Сырьё списывается по нормам при заливке.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Заказ</th><th>Клиент · изделие</th><th>Этап</th><th>Срок</th><th></th></tr></thead><tbody>${PO.map((p,i)=>`<tr class="${p[5]?'rowwarn':''}"><td class="mono"><b>${p[0]}</b></td><td><b>${p[1]}</b><br><small>${p[2]}</small></td><td><div class="bz-occ"><i style="width:${(p[4]+1)/PST.length*100}%"></i></div><small>${PST[p[4]]}${p[5]?' · задержка':''}</small></td><td class="mono">${p[3]}</td><td>${p[4]<PST.length-1?`<button class="bt sm" onclick="pNext(${i})">Этап готов</button>`:tag('к отгрузке','g')}</td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Производственный цикл','Этапы, нормы времени и расхода настраиваем под ваш цех. Видно загрузку и что сдвигает сроки отгрузки.')}`;
function pNext(i){const p=PO[i];p[4]++;p[5]=0;toast(`${p[0]}: этап «${PST[p[4]-1]}» готов → «${PST[p[4]]}».`+(PST[p[4]]==='Отверждение'?' Сырьё списано по нормам.':PST[p[4]]==='Упаковка'?' Менеджер получил уведомление: заказ скоро к отгрузке.':''));render()}

SC.molds=()=>`<div class="hd"><div><h2>Пресс-формы</h2><p>Свои пресс-формы: под какую деталь, где лежат, сколько отливок сделали, состояние. При расчёте видно, есть ли форма или её нужно изготовить — и это сразу в цене и сроке.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Форма</th><th>Деталь</th><th>Гнёзд</th><th style="text-align:right">Отливок</th><th>Место</th><th>Состояние</th></tr></thead><tbody>${[['ПФ-031','Втулка стабилизатора Ø24',8,4120,'стеллаж А-2','норма'],['ПФ-044','Сайлентблок рычага',4,1860,'в работе · З-415','норма'],['ПФ-052','Втулка рессоры КамАЗ',6,9310,'стеллаж Б-1','износ · заказать новую'],['ПФ-060','Ролик конвейера Ø89',2,240,'в работе · З-412','норма']].map(r=>`<tr class="${/износ/.test(r[5])?'rowwarn':''}"><td class="mono"><b>${r[0]}</b></td><td>${r[1]}</td><td class="mono">${r[2]}</td><td class="mono" style="text-align:right">${fmt(r[3])}</td><td>${r[4]}</td><td>${r[5]}</td></tr>`).join('')}</tbody></table></div></div>`;

/* Склады */
SC.raw=()=>`<div class="hd"><div><h2>Склад сырья</h2><p>Полиолы, изоцианаты, отвердители, красители, металлическая арматура — остатки и на сколько дней хватит по заказам в работе. Приход по накладной, списание по нормам при заливке.</p></div><div class="btns"><button class="bt p" onclick="act('Приход сырья: поставщик, партия, вес, цена.')">+ Приход</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Сырьё</th><th>Остаток</th><th>Расход в день</th><th>Хватит на</th></tr></thead><tbody>${[['Полиол (форполимер СКУ-ПФЛ)','кг',820,46],['Изоцианат','кг',140,23],['Отвердитель МОКА','кг',96,6],['Краситель жёлтый','кг',18,0.6],['Металлическая арматура Ø24','шт',1400,60],['Разделительная смазка','л',22,1.1]].map(r=>{const d=Math.floor(r[2]/r[3]);return `<tr class="${d<8?'rowwarn':''}"><td><b>${r[0]}</b></td><td class="mono">${fmt(r[2])} ${r[1]}</td><td class="mono">${r[3]} ${r[1]}</td><td class="mono ${d<8?'neg':''}">${d} дн.</td></tr>`}).join('')}</tbody></table></div></div>`;

SC.fg=()=>`<div class="hd"><div><h2>Готовая продукция и отгрузки</h2><p>Изготовленное под заказ и ходовые позиции на складе. Отгрузка закрывает заказ, формирует накладную и сообщает клиенту в WhatsApp.</p></div></div>
 <div class="g2"><div class="pan"><h3>На складе</h3><div class="tw"><table class="t"><thead><tr><th>Позиция</th><th style="text-align:right">Шт</th><th>Для кого</th></tr></thead><tbody>${[['Втулки рессор КамАЗ','200','З-413 · СТО «Мастер Подвеска»'],['Втулки стабилизатора Ø24','340','склад · ходовая позиция'],['Отбойник универсальный','56','склад']].map(r=>`<tr><td><b>${r[0]}</b></td><td class="mono" style="text-align:right">${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Отгрузить сегодня</h3><div class="kv"><span>З-413 · СТО «Мастер Подвеска»</span><b><button class="bt p sm" onclick="act('Отгружено: накладная сформирована, клиенту в WhatsApp: «Ваш заказ отгружен».')">Отгрузить</button></b></div><div class="kv"><span>З-412 · ТОО «Горный Сервис»</span><b>после ОТК · 29.10</b></div><div class="kv"><span>Доставка</span><b>самовывоз · транспортная компания · свой транспорт</b></div></div></div>
 ${tip('Ходовые позиции','То, что заказывают часто, можно делать на склад: система подскажет минимальный остаток по продажам.')}`;

/* Внедрение */
SC.onec=()=>`<div class="hd"><div><h2>1С — позже, отдельным блоком</h2><p>На старте система работает без 1С. Когда понадобится, подключаем обмен: контрагенты, счета, реализации, оплаты — без двойного ввода. Глубина обмена зависит от вашей 1С.</p></div></div>
 <div class="pan"><div class="kv"><span>Обмен с 1С</span><b>800 000 ₸ · когда решите</b></div><div class="kv"><span>Что уходит в 1С</span><b>контрагенты, счета, реализации</b></div><div class="kv"><span>Что приходит из 1С</span><b>оплаты, остатки — по необходимости</b></div></div>
 ${said('Можно будет потом, позже, связать с 1С?','Да — отдельным блоком, когда понадобится.')}`;

SC.launch=()=>`<div class="hd"><div><h2>Стоимость и этапы</h2><p>Стандартный пакет разработки: CRM с WhatsApp и телефонией, расчёты и документы, производство и склады — всё из демо. Делаем под ваш бизнес, а не готовую коробку. Без абонплаты за пользователей.</p></div></div>
 <div class="pk1"><div><small>Стандартный пакет</small><b>1 500 000 ₸</b><span>один раз · без оплаты за каждого пользователя</span></div><div><small>Срок</small><b>4–6 недель</b><span>база через 7–10 дней</span></div></div>
 <div class="pay3"><div><small>1 · Старт · 10%</small><b>150 000 ₸</b><span>договорились — начинаем</span></div><div><small>2 · База · 45%</small><b>675 000 ₸</b><span>всё обговорённое работает на сервере, вы утвердили</span></div><div><small>3 · Полировка и сдача · 45%</small><b>675 000 ₸</b><span>кнопки, отчёты, прайсы, калькуляторы; перенос на ваш сервер, ключи</span></div></div>
 <div class="g2"><div class="pan"><h3>Входит</h3>${['Все обращения: WhatsApp, телефония, сайт, Instagram, площадки','Воронки, расчёт по чертежу, КП, счёт, договор в WhatsApp','Источники рекламы и KPI менеджеров','Производство по этапам, пресс-формы','Склад сырья и готовой продукции','4–5 пользователей и больше — без доплаты'].map(x=>`<div class="kv"><span>${x}</span><b>✓</b></div>`).join('')}</div>
 <div class="pan"><h3>Отдельно</h3><div class="kv"><span>Обмен с 1С</span><b>800 000 ₸, когда понадобится</b></div><div class="kv"><span>WhatsApp-канал</span><b>≈ 5 000 ₸ в месяц за номер</b></div><div class="kv"><span>Телефония</span><b>по тарифу оператора</b></div><div class="kv"><span>Сервер</span><b>5–15 $ в месяц</b></div><div class="kv"><span>Сопровождение</span><b>3 месяца бесплатно</b></div></div></div>
 ${tip('Сравните с подпиской','amoCRM и Битрикс берут плату за каждого пользователя каждый месяц и не ведут производство и склад. Здесь — один раз, и система ваша.')}`;

/* Каркас */
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const d=DL.find(x=>(x.id+x.cl+x.it).toLowerCase().includes(v));if(d&&v){curCalc=d.id;go('funnel');return}toast('Ищите по клиенту, изделию или номеру: «Горный», «втулки», «С-1184».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'РОП';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">ПУ ДЕТАЛЬ</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='inbox'?'<em>'+INB.filter(r=>r[5]).length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['inbox','Обращения'],['funnel','Воронка'],['calc','Расчёт'],['prod','Цех']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'ПУ ДЕТАЛЬ';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт РОПа: обращения, воронка, оплаты, цех.'],
 ['inbox','2 · WhatsApp, звонки, сайт и площадки — сразу к менеджеру.'],
 ['funnel','3 · Воронка заказного изделия: от чертежа до отгрузки.'],
 ['calc','4 · Расчёт цены по чертежу.'],
 ['docs','5 · КП, счёт, договор — одной кнопкой в WhatsApp.'],
 ['ads','6 · Какая реклама приводит покупателей.'],
 ['prod','7 · Заказ в цехе по этапам.'],
 ['raw','8 · Сырьё: на сколько дней хватит.'],
 ['launch','9 · Стандартный пакет — 1,5 млн ₸, 4–6 недель.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
