/* ТАЗА ӨМІР — центр интегративной медицины, Алматы (Еркин). Демо на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(n/1e6).toFixed(1).replace('.',',')+' млн ₸';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const TODAY='12.11.2026',NOW='11:40';
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const bar=(w,c)=>`<div class="bar"><i class="${c||''}" style="--w:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const said=(q,a)=>`<div class="said"><b>Из встречи</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const vbars=(arr,lab,yi)=>{const m=Math.max(...arr.map(Math.abs));return `<div class="vbars">${arr.map((v,i)=>`<div class="${yi&&yi.includes(i)?'y':''}" style="height:${Math.max(4,Math.round(Math.abs(v)/m*100))}%"><em>${fmt(v)}</em></div>`).join('')}</div><div class="vlab">${lab.map(l=>`<span>${l}</span>`).join('')}</div>`};
const SEC=[
 {k:'sum',n:'Пульт',sub:[['dash','Пульт собственника'],['pnl','P&L и убыточные месяцы'],['rnp','РНП и финплан']]},
 {k:'cl',n:'Клиника',sub:[['sched','Расписание врачей'],['doc','Телефон врача'],['pat','Карточка пациента'],['svc','Чекапы и услуги'],['plan','Лечение: 10 дней + 3 месяца']]},
 {k:'sale',n:'Продажи',sub:[['funnel','Воронка МОП'],['calls','Звонки и записи'],['wa','WhatsApp'],['rop','РОП: план и KPI'],['mkt','Маркетинг']]},
 {k:'fin',n:'Деньги',sub:[['fin','Доходы и расходы'],['pay','ФОТ и бонусы'],['stock','БАДы и медикаменты']]},
 {k:'gov',n:'Связи',sub:[['mis','МИС: гос. учёт'],['onec','Обмен с 1С'],['online','Онлайн-детокс']]},
 {k:'grow',n:'Рост',sub:[['branch','Второй центр и франшиза'],['tasks','Задачи']]},
 {k:'go',n:'Запуск',sub:[['move','Переезд из 6 программ'],['roles','Роли и права'],['launch','Стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Собственник':{av:'ЕК',n:'Еркин · директор',note:'Всё: деньги, P&L, РНП, продажи, клиника, рост',s:ALL.slice()},
 'Главврач':{av:'ГВ',n:'Главврач',note:'Врачи, расписание, карточки, протоколы лечения, МИС',s:['sched','doc','pat','svc','plan','stock','mis','online','tasks']},
 'Врач':{av:'ВР',n:'Д-р Сейтова · гастроэнтеролог',note:'Только свои пациенты: день, карточка, назначения — с телефона',s:['doc','pat','plan']},
 'Администратор':{av:'АД',n:'Регистратура',note:'Запись, расписание, оплата, продажа БАДов',s:['sched','svc','calls','wa','stock','tasks']},
 'МОП':{av:'МП',n:'Алина · менеджер продаж',note:'Лиды, звонки, WhatsApp, запись. Медкарту не видит',s:['funnel','calls','wa','svc','tasks']},
 'РОП':{av:'РП',n:'Руслан · РОП',note:'План и KPI МОП, воронка, звонки, маркетинг',s:['rop','funnel','calls','wa','mkt','tasks']},
 'Маркетолог':{av:'МК',n:'Маркетинг · таргет · SMM',note:'Каналы, бюджет, CPL, ROMI, лиды',s:['mkt','funnel','tasks']},
 'Бухгалтер':{av:'БХ',n:'Бухгалтер на аутсорсе',note:'Доходы и расходы, ФОТ, склад, 1С и МИС',s:['fin','pay','stock','onec','mis','pnl','rnp']}
};
let role='Собственник',cur='dash';
/* Врачи */
const DOCS=[
 {id:'D1',n:'Д-р Сейтова',sp:'Гастроэнтеролог',lo:82},
 {id:'D2',n:'Д-р Абенов',sp:'Терапевт',lo:76},
 {id:'D3',n:'Д-р Ким',sp:'Эндокринолог',lo:64},
 {id:'D4',n:'Д-р Жумабаева',sp:'Гинеколог',lo:58},
 {id:'D5',n:'Д-р Нурланов',sp:'Педиатр',lo:41}
];
const DN=id=>(DOCS.find(d=>d.id===id)||DOCS[0]).n;
/* Пациенты */
let PAT=[
 {id:'P-2041',n:'Айгуль Касымова',ph:'+7 701 512 44 10',age:41,doc:'D1',prog:'Детокс 10 дней',day:6,src:'Instagram',paid:780000,ltv:1240000,st:'в клинике',an:'Вздутие, тяжесть после еды, утомляемость. Кожные высыпания 2 года.',tests:'Чекап взрослый 05.11: ферритин ↓, витамин D 18, кальпротектин ↑'},
 {id:'P-2038',n:'Марат Ибраев',ph:'+7 705 300 18 22',age:52,doc:'D2',prog:'Детокс 10 дней',day:9,src:'Звонок 2ГИС',paid:780000,ltv:930000,st:'в клинике',an:'Гастрит, изжога, лишний вес 18 кг.',tests:'Чекап VIP 02.11: инсулин ↑, ЛПНП ↑'},
 {id:'P-2029',n:'Дана Сапарова',ph:'+7 777 410 05 91',age:34,doc:'D4',prog:'План 3 месяца',day:41,src:'Рекомендация',paid:420000,ltv:1620000,st:'дома, месяц 2',an:'Нарушение цикла, акне.',tests:'Гормоны 20.09: пролактин ↑'},
 {id:'P-2051',n:'Ерлан Тлеуов',ph:'+7 702 881 30 70',age:47,doc:'D3',prog:'Чекап взрослый',day:0,src:'Таргет',paid:150000,ltv:150000,st:'консультация завтра',an:'Сахар натощак 6,4.',tests:'—'},
 {id:'P-2047',n:'Сауле Ахметова',ph:'+7 747 220 64 13',age:9,doc:'D5',prog:'Чекап детский',day:0,src:'Instagram',paid:130000,ltv:130000,st:'результаты готовы',an:'Аллергия, частые ОРВИ (со слов мамы).',tests:'Чекап детский 10.11'},
 {id:'P-2012',n:'Гульнара Беккер',ph:'+7 701 990 12 58',age:58,doc:'D1',prog:'План 3 месяца',day:76,src:'Рекомендация',paid:610000,ltv:2140000,st:'дома, месяц 3',an:'СРК, суставы.',tests:'Контроль 01.11: кальпротектин в норме'}
];
let patSel='P-2041';
const PT=id=>PAT.find(p=>p.id===id)||PAT[0];
/* Услуги */
const SVC=[
 ['Консультация врача (терапевт, гастроэнтеролог)',20000,'консультация'],['Консультация гинеколога / эндокринолога',20000,'консультация'],
 ['Чекап детский',130000,'чекап'],['Чекап взрослый',150000,'чекап'],['Чекап VIP',250000,'чекап'],
 ['Детокс-программа 10 дней в клинике',780000,'лечение'],['План поддержки 3 месяца (контроль + БАДы)',420000,'лечение'],['Повторный контроль',15000,'контроль']
];
/* Лиды и воронка */
const FST=[['new','Новый лид'],['cons','Записан на консультацию'],['chk','Чекап'],['treat','Лечение продано'],['lost','Отказ']];
let LEADS=[
 {id:'L-881',n:'Жанна, 38',src:'Instagram',mop:'Алина',st:'new',sum:20000,t:'11:32'},
 {id:'L-879',n:'Бахыт, 55',src:'Таргет',mop:'Данияр',st:'new',sum:20000,t:'10:58'},
 {id:'L-874',n:'Ерлан Тлеуов',src:'Таргет',mop:'Алина',st:'cons',sum:20000,t:'вчера'},
 {id:'L-870',n:'Мадина, 29',src:'Звонок 2ГИС',mop:'Камила',st:'cons',sum:20000,t:'вчера'},
 {id:'L-866',n:'Сауле (мама)',src:'Instagram',mop:'Данияр',st:'chk',sum:130000,t:'10.11'},
 {id:'L-862',n:'Тимур, 44',src:'Рекомендация',mop:'Асем',st:'chk',sum:250000,t:'09.11'},
 {id:'L-851',n:'Айгуль Касымова',src:'Instagram',mop:'Алина',st:'treat',sum:780000,t:'06.11'},
 {id:'L-847',n:'Марат Ибраев',src:'Звонок 2ГИС',mop:'Камила',st:'treat',sum:780000,t:'03.11'},
 {id:'L-840',n:'Ольга, 61',src:'Таргет',mop:'Нурсултан',st:'lost',sum:0,t:'05.11',why:'Дорого, «подумаю»'}
];
const MOPS=[
 {n:'Алина',plan:9000000,fact:6840000,leads:118,cons:41,chk:19,treat:7,calls:412,miss:6},
 {n:'Камила',plan:9000000,fact:5920000,leads:104,cons:36,chk:15,treat:6,calls:388,miss:11},
 {n:'Данияр',plan:8000000,fact:3110000,leads:97,cons:22,chk:9,treat:3,calls:240,miss:27},
 {n:'Асем',plan:8000000,fact:4780000,leads:91,cons:30,chk:14,treat:5,calls:351,miss:8},
 {n:'Нурсултан',plan:7000000,fact:2260000,leads:86,cons:18,chk:6,treat:2,calls:198,miss:34}
];
/* Склад БАДов и медикаментов */
let STK=[
 {n:'Пробиотик комплекс, 60 капс.',g:'БАД',q:84,min:40,buy:9800,sell:16500,use:'назначение · детокс, план 3 мес'},
 {n:'Омега-3 1000 мг, 90 капс.',g:'БАД',q:22,min:30,buy:7400,sell:12900,use:'назначение · план 3 мес'},
 {n:'Витамин D3 5000 МЕ',g:'БАД',q:61,min:30,buy:3900,sell:7500,use:'назначение'},
 {n:'Сорбент энтеро, 20 пак.',g:'Медикамент',q:140,min:80,buy:2100,sell:0,use:'расход · процедуры детокса'},
 {n:'Раствор для инфузий 400 мл',g:'Медикамент',q:36,min:60,buy:1450,sell:0,use:'расход · капельницы'},
 {n:'Магний хелат, 120 таб.',g:'БАД',q:48,min:25,buy:5200,sell:9900,use:'назначение · продажа'}
];
const SC={};
/* Месяцы P&L, тыс. ₸ */
const MON=['май','июн','июл','авг','сен','окт'];
const REV=[71200,74800,69400,61900,58200,57400];
const COST={'ФОТ врачей и персонала':[17800,18100,18400,18900,19300,19400],'ФОТ и бонусы МОП':[5200,5400,5100,4900,4700,4800],'Маркетинг и таргет':[9800,10400,13900,16800,18900,19600],'БАДы и медикаменты':[6100,6400,6000,5600,5300,5500],'Аренда и коммунальные':[4200,4200,4200,4200,4200,4200],'Сервисы и программы':[640,640,690,720,720,720],'Прочее и ремонт':[1500,1800,2900,6900,7800,6200]};
const NET=MON.map((m,i)=>REV[i]-Object.values(COST).reduce((a,c)=>a+c[i],0));
SC.dash=()=>{const i=5;
 return `<div class="hd"><div><h2>Пульт собственника · ${TODAY}</h2><p>Деньги, продажи, клиника и склад — в одном окне. Цифры приходят сами из записи, касс, МОП и расходов, без Excel.</p></div><div class="btns"><button class="bt" onclick="xlsPnl()">Excel</button><button class="bt p" onclick="go('pnl')">P&amp;L</button></div></div>
 <div class="strip"><div><small>Выручка, октябрь</small><b>${mln(REV[i]*1000)}</b><span>${pct(REV[i]-REV[0],REV[0])}% к маю</span></div><div><small>Чистая прибыль, октябрь</small><b class="${NET[i]<0?'bad':'ok'}">${mln(NET[i]*1000)}</b><span>3-й месяц в минусе</span></div><div><small>РНП ноября</small><b>${mln(64300000)}</b><span>план 72,0 млн · 89%</span></div><div><small>Пациентов в лечении</small><b>38</b><span>12 в клинике · 26 дома по плану</span></div><div><small>Касса сегодня</small><b>${tg(1840000)}</b><span>чекапы, консультации, БАДы</span></div></div>
 <div class="g21"><div>
  <div class="pan"><h3>Прибыль по месяцам, тыс. ₸</h3><p>Выручка падает с июля, расходы на маркетинг выросли вдвое. Откройте P&amp;L — видно по строкам.</p>${vbars(NET,MON,[3,4,5])}</div>
  <div class="pan"><h3>Где утекают деньги</h3><div class="tw"><table class="t"><thead><tr><th>Причина</th><th class="r">Октябрь</th><th class="r">к маю</th><th>Что делать</th></tr></thead><tbody>
   <tr onclick="go('mkt')"><td><b>Маркетинг: CPL вырос с 4 800 до 11 200 ₸</b></td><td class="r">19,6 млн</td><td class="r bad">+100%</td><td>отключить 2 кампании с ROMI &lt; 1</td></tr>
   <tr onclick="go('rop')"><td><b>Конверсия консультация → лечение упала до 12%</b></td><td class="r">−9,8 млн</td><td class="r bad">было 21%</td><td>2 МОП ниже плана, 61 пропущенный звонок</td></tr>
   <tr onclick="go('plan')"><td><b>План на 3 месяца: 9 пациентов не на контроле</b></td><td class="r">−3,8 млн</td><td class="r bad">допродажи</td><td>напоминания и задачи врачам</td></tr>
   <tr onclick="go('fin')"><td><b>Прочее и ремонт без статьи</b></td><td class="r">6,2 млн</td><td class="r bad">×4</td><td>расход только со статьёй и чеком</td></tr>
   <tr onclick="go('stock')"><td><b>БАДы выданы, но не проданы</b></td><td class="r">0,9 млн</td><td class="r">—</td><td>списание только по назначению</td></tr>
  </tbody></table></div></div>
 </div><div>
  <div class="pan"><h3>Требует внимания</h3><div class="alist">
   <a onclick="go('calls')"><i class="dt r"></i><b>27 пропущенных звонков за неделю у Данияра</b><span>перезвон не позже 15 минут</span></a>
   <a onclick="go('stock')"><i class="dt w"></i><b>Омега-3 и раствор для инфузий ниже минимума</b><span>заказ поставщику</span></a>
   <a onclick="go('plan')"><i class="dt w"></i><b>Контроль месяца 2 у 5 пациентов на этой неделе</b><span>Дана Сапарова — завтра</span></a>
   <a onclick="go('mis')"><i class="dt i"></i><b>14 приёмов ждут выгрузки в МИС</b><span>за 11.11</span></a>
   <a onclick="go('sched')"><i class="dt g"></i><b>Завтра 31 запись, свободно 6 окон</b><span>Д-р Ким — после 15:00</span></a>
  </div></div>
  ${said('Хочу с одного места дашбордом: по финансовой части и аналитика — чтобы всё показывалось в одном месте.','Пульт собирается сам: выручка из записи и касс, расходы — из раздела «Деньги», продажи — из воронки МОП.')}
 </div></div>`};
function xlsPnl(){const h=`<html><head><meta charset="utf-8"></head><body><table border="1"><tr><th>Статья</th>${MON.map(m=>`<th>${m}</th>`).join('')}</tr><tr><td>Выручка</td>${REV.map(v=>`<td>${v*1000}</td>`).join('')}</tr>${Object.entries(COST).map(([k,v])=>`<tr><td>${k}</td>${v.map(x=>`<td>${x*1000}</td>`).join('')}</tr>`).join('')}<tr><td>Чистая прибыль</td>${NET.map(v=>`<td>${v*1000}</td>`).join('')}</tr></table></body></html>`;try{const b=new Blob(['﻿'+h],{type:'application/vnd.ms-excel'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='PnL_'+TODAY+'.xls';document.body.appendChild(a);a.click();a.remove()}catch(e){}toast('Файл <b>PnL.xls</b> скачан.')}
SC.pnl=()=>`<div class="hd"><div><h2>P&amp;L и убыточные месяцы</h2><p>Отчёт о прибылях и убытках по месяцам. Красным — строки, которые выросли больше чем на 20% к маю. Клик по строке — список операций.</p></div><div class="btns"><button class="bt" onclick="xlsPnl()">Excel</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Статья, тыс. ₸</th>${MON.map(m=>`<th class="r">${m}</th>`).join('')}</tr></thead><tbody>
 <tr><td><b>Выручка</b></td>${REV.map(v=>`<td class="r"><b>${fmt(v)}</b></td>`).join('')}</tr>
 ${Object.entries(COST).map(([k,v])=>`<tr onclick="toast('Операции: <b>${esc(k)}</b> — 214 строк, каждая со статьёй, чеком и ответственным.')"><td>${esc(k)}</td>${v.map((x,i)=>`<td class="r ${x>v[0]*1.2?'bad':''}">${fmt(x)}</td>`).join('')}</tr>`).join('')}
 <tr><td><b>Чистая прибыль</b></td>${NET.map(v=>`<td class="r ${v<0?'bad':'ok'}"><b>${fmt(v)}</b></td>`).join('')}</tr></tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Почему минус с августа</h3><div class="kv"><span>Маркетинг вырос</span><b class="bad">+9,8 млн</b></div><div class="kv"><span>Выручка упала</span><b class="bad">−13,8 млн</b></div><div class="kv"><span>Ремонт и прочее без статьи</span><b class="bad">+4,7 млн</b></div><div class="kv"><span>ФОТ</span><b>+1,6 млн</b></div></div>
 ${said('Есть таблица доходов в Excel, есть таблица расходов, по зарплатам, по РНП, по маркетингу.','Все пять таблиц становятся одним отчётом: строки P&amp;L собираются из операций, а не переносятся руками.')}</div>`;
SC.rnp=()=>{const plan=72000000,fact=34100000,days=12,tot=30,rnp=Math.round(fact/days*tot);
 return `<div class="hd"><div><h2>РНП и финплан · ноябрь</h2><p>Рука на пульсе: факт на сегодня, прогноз до конца месяца и разрыв с планом — по направлениям.</p></div></div>
 <div class="strip"><div><small>План ноября</small><b>${mln(plan)}</b></div><div><small>Факт на ${TODAY}</small><b>${mln(fact)}</b><span>${days} из ${tot} дней</span></div><div><small>Прогноз (РНП)</small><b class="${rnp<plan?'bad':'ok'}">${mln(rnp)}</b><span>${pct(rnp,plan)}% плана</span></div><div><small>Нужно в день до плана</small><b>${tg((plan-fact)/(tot-days))}</b></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Направление</th><th class="r">План</th><th class="r">Факт</th><th class="r">Прогноз</th><th style="width:20%">к плану</th></tr></thead><tbody>
 ${[['Детокс 10 дней',31200000,14820000],['План 3 месяца',12600000,5880000],['Чекапы',14400000,7350000],['Консультации',4800000,2140000],['БАДы',6000000,2810000],['Онлайн (запуск в декабре)',3000000,1100000]].map(r=>{const p=Math.round(r[2]/days*tot);return `<tr><td>${r[0]}</td><td class="r">${tg(r[1])}</td><td class="r">${tg(r[2])}</td><td class="r ${p<r[1]?'bad':'ok'}">${tg(p)}</td><td>${bar(pct(p,r[1]),p<r[1]?'r':'g')}</td></tr>`}).join('')}
 </tbody></table></div></div>`};
SC.fin=()=>`<div class="hd"><div><h2>Доходы и расходы · ноябрь</h2><p>Вместо двух Excel-таблиц. Доходы приходят сами из записи и кассы, расходы вносят с телефона — со статьёй и чеком. Без статьи расход не проходит.</p></div><div class="btns"><button class="bt p" onclick="toast('Расход внесён: <b>Таргет Instagram · 450 000 ₸</b>, статья «Маркетинг», чек прикреплён.')">+ Расход</button></div></div>
 <div class="g2"><div class="pan"><h3>Доходы</h3><div class="tw"><table class="t"><thead><tr><th>Дата</th><th>Пациент / источник</th><th>Услуга</th><th class="r">Сумма</th><th>Оплата</th></tr></thead><tbody>
 ${[['12.11','Ерлан Тлеуов','Чекап взрослый',150000,'Kaspi QR'],['12.11','Сауле Ахметова','Чекап детский',130000,'карта'],['11.11','Айгуль Касымова','Детокс, доплата',390000,'перевод'],['11.11','Регистратура','БАДы, 6 позиций',71400,'наличные'],['11.11','Дана Сапарова','Контроль, месяц 2',15000,'Kaspi QR']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="r">${tg(r[3])}</td><td>${tag(r[4],'g')}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Расходы</h3><div class="tw"><table class="t"><thead><tr><th>Дата</th><th>Статья</th><th>Кто внёс</th><th class="r">Сумма</th><th>Чек</th></tr></thead><tbody>
 ${[['12.11','Маркетинг · таргет','Маркетолог',450000,1],['11.11','Медикаменты · раствор','Главврач',87000,1],['11.11','Ремонт · кондиционер','Администратор',120000,0],['10.11','Аренда ноябрь','Бухгалтер',4200000,1],['10.11','Программы и связь','Бухгалтер',96000,1]].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="r">${tg(r[3])}</td><td>${r[4]?tag('есть','g'):tag('нет чека','r')}</td></tr>`).join('')}</tbody></table></div></div></div>`;
SC.pay=()=>`<div class="hd"><div><h2>ФОТ и бонусы · октябрь</h2><p>Вместо таблицы зарплат: оклад, процент врача от своих лечений, бонус МОП от оплаченных продаж. Считается сам из записи и оплат.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Сотрудник</th><th>Роль</th><th class="r">Оклад</th><th class="r">Бонус</th><th>Как считается</th><th class="r">Итого</th></tr></thead><tbody>
 ${[['Д-р Сейтова','Гастроэнтеролог',600000,412000,'5% от лечений своих пациентов'],['Д-р Абенов','Терапевт',550000,298000,'5% от лечений + консультации'],['Д-р Ким','Эндокринолог',500000,184000,'40% от консультаций'],['Алина','МОП',250000,342000,'5% от оплаченных продаж'],['Камила','МОП',250000,296000,'5% от оплаченных продаж'],['Нурсултан','МОП',250000,113000,'5% · ниже 50% плана — ставка 3%'],['Руслан','РОП',400000,260000,'1% от выручки отдела при плане 80%+']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="r">${tg(r[2])}</td><td class="r">${tg(r[3])}</td><td class="mini">${r[4]}</td><td class="r"><b>${tg(r[2]+r[3])}</b></td></tr>`).join('')}
 </tbody></table></div></div>`;
SC.stock=()=>`<div class="hd"><div><h2>БАДы и медикаменты</h2><p>Остатки, приход, продажа БАДов и списание по назначениям врача. Медикаменты на процедуры списываются по протоколу детокса — недостачу видно сразу.</p></div><div class="btns"><button class="bt" onclick="toast('Приход по накладной: <b>Пробиотик, 60 шт.</b> — остаток обновлён, в 1С уйдёт поступление.')">+ Приход</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Позиция</th><th>Тип</th><th class="r">Остаток</th><th class="r">Минимум</th><th class="r">Закуп</th><th class="r">Продажа</th><th>Как уходит</th><th></th></tr></thead><tbody>
 ${STK.map((s,i)=>`<tr><td><b>${esc(s.n)}</b></td><td>${tag(s.g,s.g==='БАД'?'g':'i')}</td><td class="r ${s.q<s.min?'bad':''}">${s.q}</td><td class="r">${s.min}</td><td class="r">${tg(s.buy)}</td><td class="r">${s.sell?tg(s.sell):'—'}</td><td class="mini">${s.use}</td><td><button class="bt sm" onclick="STK[${i}].q--;render();toast('Списано по назначению: <b>${esc(s.n)}</b> → пациент Айгуль Касымова.')">Списать</button></td></tr>`).join('')}
 </tbody></table></div></div>
 ${said('Чтобы медикаменты тоже были, чтобы полностью там просчитывались. Бады считаются товаром.','Каждая выдача — по назначению в карточке пациента или продажей с чеком. Остатки и движение уходят в 1С.')}`;
/* Клиника */
const HRS=['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'];
let SLOT={'D1':{'09:00':'Айгуль Касымова · детокс д.6','10:00':'Гульнара Беккер · контроль','12:00':'Новый · консультация','15:00':'Марат Ибраев · детокс д.9'},'D2':{'09:00':'Марат Ибраев · осмотр','11:00':'Тимур · чекап VIP','14:00':'Консультация','16:00':'Консультация'},'D3':{'10:00':'Ерлан Тлеуов · консультация','11:00':'Чекап взрослый'},'D4':{'09:00':'Дана Сапарова · контроль','12:00':'Консультация','15:00':'Консультация'},'D5':{'10:00':'Сауле Ахметова · результаты','14:00':'Чекап детский'}};
SC.sched=()=>`<div class="hd"><div><h2>Расписание врачей · завтра, 13.11</h2><p>Вместо Bumpix: регистратура и МОП записывают сюда, врач видит свой день на телефоне. Свободное окно — клик, и запись готова.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Время</th>${DOCS.map(d=>`<th>${d.n}<br><span class="mini">${d.sp}</span></th>`).join('')}</tr></thead><tbody>
 ${HRS.map(h=>`<tr><td><b>${h}</b></td>${DOCS.map(d=>{const v=(SLOT[d.id]||{})[h];return v?`<td>${tag(esc(v),'g')}</td>`:`<td><button class="bt sm" onclick="SLOT['${d.id}']=SLOT['${d.id}']||{};SLOT['${d.id}']['${h}']='Новая запись';render();toast('Записано: <b>${d.n}, ${h}</b>. Пациенту ушло напоминание в WhatsApp, врачу — в телефон.')">свободно</button></td>`}).join('')}</tr>`).join('')}
 </tbody></table></div></div>
 ${said('Bumpix — каждый врач по телефону видит своих пациентов в день, какой час, какой клиент приходит.','Тот же вид у врача на телефоне, но запись, карточка и оплата — в одной системе.')}`;
SC.doc=()=>{const mine=PAT.filter(p=>p.doc==='D1');
 return `<div class="hd"><div><h2>Телефон врача · Д-р Сейтова</h2><p>Врач видит только своих пациентов: день, карточку, назначения. Открывается ярлыком с экрана телефона.</p></div></div>
 <div class="g2"><div class="phone3"><div class="phs"><div class="phtop"><b>Сегодня · 4 приёма</b><span>12.11</span></div>
 ${Object.entries(SLOT.D1).map(([h,v])=>`<div class="ci2"><span>${h}</span><b>${esc(v)}</b></div>`).join('')}
 <div class="ci2"><span>Назначить</span><b><button class="bt sm p" onclick="toast('Назначение: <b>Пробиотик, 1 уп.</b> — склад спишет при выдаче.')">БАД</button></b></div></div></div>
 <div class="pan"><h3>Мои пациенты в лечении</h3>${mine.map(p=>`<div class="kv" onclick="patSel='${p.id}';go('pat')"><span>${esc(p.n)} · ${p.prog}</span><b>${p.st}</b></div>`).join('')}</div></div>`};
SC.pat=()=>{const list=role==='Врач'?PAT.filter(p=>p.doc==='D1'):PAT;if(!list.find(p=>p.id===patSel))patSel=list[0].id;const p=PT(patSel);
 return `<div class="hd"><div><h2>Карточка пациента</h2><p>Вместо MedElement: анамнез, анализы, назначения, план лечения, оплаты и переписка — в одной карточке. МОП медкарту не видит.</p></div></div>
 <div class="chipr">${list.map(x=>`<a class="${x.id===p.id?'on':''}" onclick="patSel='${x.id}';render()">${esc(x.n)}</a>`).join('')}</div>
 <div class="g21"><div><div class="pan"><h3>${esc(p.n)}, ${p.age} лет · ${p.id}</h3>
  <div class="kv"><span>Врач</span><b>${DN(p.doc)}</b></div><div class="kv"><span>Программа</span><b>${p.prog}${p.day?' · день '+p.day:''}</b></div><div class="kv"><span>Статус</span><b>${p.st}</b></div><div class="kv"><span>Жалобы и анамнез</span><b>${esc(p.an)}</b></div><div class="kv"><span>Анализы и чекап</span><b>${esc(p.tests)}</b></div></div>
  <div class="pan"><h3>Назначения</h3><div class="tw"><table class="t"><thead><tr><th>Что</th><th>Схема</th><th>Выдано</th></tr></thead><tbody><tr><td>Пробиотик комплекс</td><td>2 капс. утром, 60 дней</td><td>${tag('1 уп.','g')}</td></tr><tr><td>Омега-3</td><td>1 капс., 90 дней</td><td>${tag('ждёт выдачи','w')}</td></tr><tr><td>Питание</td><td>протокол «ЖКТ-1», без сахара и глютена</td><td>${tag('PDF отправлен','i')}</td></tr></tbody></table></div></div></div>
 <div><div class="pan"><h3>Деньги</h3><div class="kv"><span>Оплачено</span><b>${tg(p.paid)}</b></div><div class="kv"><span>Всего за время с нами</span><b>${tg(p.ltv)}</b></div><div class="kv"><span>Источник</span><b>${p.src}</b></div></div>
 <div class="pan"><h3>Выгрузки</h3><div class="kv"><span>МИС</span><b>${tag('выгружено','g')}</b></div><div class="kv"><span>1С</span><b>${tag('счёт и оплата','g')}</b></div></div></div></div>`};
SC.svc=()=>`<div class="hd"><div><h2>Чекапы и услуги</h2><p>Прайс — один для регистратуры, МОП и кассы. Меняете цену здесь — меняется везде.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Услуга</th><th>Группа</th><th class="r">Цена</th><th class="r">Продано в ноябре</th></tr></thead><tbody>
 ${SVC.map((s,i)=>`<tr><td><b>${s[0]}</b></td><td>${tag(s[2],s[2]==='лечение'?'g':s[2]==='чекап'?'i':'')}</td><td class="r">${tg(s[1])}</td><td class="r">${[64,22,14,31,9,19,14,47][i]}</td></tr>`).join('')}</tbody></table></div></div>`;
SC.plan=()=>`<div class="hd"><div><h2>Лечение: 10 дней в клинике + 3 месяца дома</h2><p>После 10 дней пациент уходит на план поддержки: БАДы по назначению, контроль раз в месяц. Система сама напоминает пациенту и ставит задачу врачу.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Пациент</th><th>Врач</th><th>Этап</th><th style="width:22%">Прогресс</th><th>Следующее</th><th></th></tr></thead><tbody>
 ${PAT.filter(p=>p.day>0).map(p=>{const d=p.day,tot=d<=10?10:100;return `<tr><td><b>${esc(p.n)}</b></td><td>${DN(p.doc)}</td><td>${d<=10?'клиника · день '+d+' из 10':'дома · день '+d+' из 100'}</td><td>${bar(pct(d,tot),'g')}</td><td>${d<=10?'выписка и план на 3 месяца':'контроль месяца '+(Math.floor(d/30)+1)}</td><td><button class="bt sm" onclick="toast('Напоминание отправлено <b>${esc(p.n)}</b> в WhatsApp, задача врачу — ${DN(p.doc)}.')">Напомнить</button></td></tr>`}).join('')}
 </tbody></table></div></div>
 ${said('После десяти дней у нас на три месяца записывается план лечения, каждый месяц спрашиваем, как проходит.','Контроль не теряется: каждый пропуск — задача врачу, каждый контроль — допродажа БАДов.')}`;
/* Продажи */
SC.funnel=()=>`<div class="hd"><div><h2>Воронка МОП</h2><p>Вместо Битрикса: лиды из Instagram, таргета, 2ГИС и звонков сами попадают в воронку. Перетащите карточку — этап сменится.</p></div><div class="btns"><button class="bt p" onclick="LEADS.unshift({id:'L-'+(882+LEADS.length),n:'Новый лид',src:'Instagram',mop:'Алина',st:'new',sum:20000,t:'${NOW}'});render()">+ Лид</button></div></div>
 <div class="kanban">${FST.map(([k,n])=>`<div class="kcol" ondragover="event.preventDefault()" ondrop="const l=LEADS.find(x=>x.id===event.dataTransfer.getData('t'));l.st='${k}';render()"><div class="kh"><b>${n}</b><span>${LEADS.filter(l=>l.st===k).length}</span></div>${LEADS.filter(l=>l.st===k).map(l=>`<div class="kc" draggable="true" ondragstart="event.dataTransfer.setData('t','${l.id}')"><code>${l.id} · ${l.t}</code><b>${esc(l.n)}</b><span>${l.src} · ${l.mop}</span>${l.sum?`<em>${tg(l.sum)}</em>`:''}${l.why?`<span>${esc(l.why)}</span>`:''}</div>`).join('')}</div>`).join('')}</div>`;
SC.calls=()=>`<div class="hd"><div><h2>Звонки и записи</h2><p>IP-телефония внутри системы: звонок из карточки, запись разговора, пропущенный — задача на перезвон за 15 минут.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Время</th><th>МОП</th><th>Клиент</th><th>Тип</th><th class="r">Длит.</th><th>Итог</th><th></th></tr></thead><tbody>
 ${[['11:32','Алина','Жанна, 38','входящий','4:12','записана на консультацию'],['11:20','Данияр','+7 708 ***','пропущен','—','перезвонить до 11:35'],['11:05','Камила','Мадина, 29','исходящий','6:40','чекап в пятницу'],['10:48','Нурсултан','Ольга, 61','исходящий','1:05','«дорого» — отказ'],['10:31','Асем','Тимур, 44','исходящий','8:18','VIP-чекап оплачен']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${tag(r[3],r[3]==='пропущен'?'r':'')}</td><td class="r">${r[4]}</td><td>${r[5]}</td><td>${r[4]!=='—'?`<button class="bt sm" onclick="toast('Запись разговора ${r[0]} · ${r[1]} — воспроизводится. РОП может оценить по чек-листу.')">Слушать</button>`:''}</td></tr>`).join('')}
 </tbody></table></div></div>`;
SC.wa=()=>`<div class="hd"><div><h2>WhatsApp</h2><p>Ваш текущий WhatsApp в режиме сосуществования: номер остаётся в телефоне, переписка — в карточке клиента, рассылки по дешёвому тарифу.</p></div></div>
 <div class="g2"><div class="pan"><h3>Диалоги</h3>${[['Жанна, 38','Сколько стоит чекап для женщин?','Алина'],['Дана Сапарова','Анализы сдала, когда контроль?','Регистратура'],['Бахыт, 55','Можно записаться на субботу?','Данияр']].map(d=>`<div class="kv"><span><b>${d[0]}</b><br><span class="mini">${d[1]}</span></span><b>${d[2]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Шаблоны</h3><div class="kv"><span>Напоминание о приёме за сутки</span><b>${tag('авто','g')}</b></div><div class="kv"><span>Результаты чекапа готовы</span><b>${tag('авто','g')}</b></div><div class="kv"><span>Контроль месяца плана</span><b>${tag('авто','g')}</b></div><div class="kv"><span>Акция на чекап</span><b><button class="bt sm" onclick="toast('Рассылка по сегменту «чекап был, лечения не было» — 214 получателей.')">Разослать</button></b></div></div></div>
 ${said('Мы сейчас по ваба, а сделали по шесть тенге за сообщение — наш айтишник подключил.','Подключаем ваш же номер и тариф, только переписка теперь в карточке пациента и видна РОП.')}`;
SC.rop=()=>`<div class="hd"><div><h2>РОП: план и KPI МОП · ноябрь</h2><p>Каждый МОП: план, факт, конверсия по этапам, звонки и пропущенные. Видно, кто тянет отдел вниз — без вопросов РОПу.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>МОП</th><th class="r">План</th><th class="r">Факт</th><th style="width:16%"></th><th class="r">Лиды</th><th class="r">Консульт.</th><th class="r">Чекап</th><th class="r">Лечение</th><th class="r">Пропущено</th></tr></thead><tbody>
 ${MOPS.map(m=>`<tr><td><b>${m.n}</b></td><td class="r">${mln(m.plan)}</td><td class="r">${mln(m.fact)}</td><td>${bar(pct(m.fact,m.plan),pct(m.fact,m.plan)<50?'r':'g')}</td><td class="r">${m.leads}</td><td class="r">${m.cons} · ${pct(m.cons,m.leads)}%</td><td class="r">${m.chk}</td><td class="r">${m.treat}</td><td class="r ${m.miss>20?'bad':''}">${m.miss}</td></tr>`).join('')}
 </tbody></table></div></div>`;
SC.mkt=()=>`<div class="hd"><div><h2>Маркетинг · октябрь</h2><p>Бюджет, лиды, стоимость лида, продажи и окупаемость по каждому каналу. Расходы — из раздела «Деньги», продажи — из воронки.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Канал</th><th class="r">Бюджет</th><th class="r">Лиды</th><th class="r">CPL</th><th class="r">Продажи</th><th class="r">ROMI</th><th>Решение</th></tr></thead><tbody>
 ${[['Instagram · таргет «Детокс»',7200000,610,21400000],['Instagram · таргет «Чекап»',5400000,820,9800000],['Instagram · таргет «Похудение»',4100000,390,2600000],['2ГИС и звонки',600000,140,8900000],['Блогеры',1900000,96,1400000],['Рекомендации',0,88,11200000]].map(r=>{const romi=r[1]?(r[3]-r[1])/r[1]:0;return `<tr><td><b>${r[0]}</b></td><td class="r">${tg(r[1])}</td><td class="r">${r[2]}</td><td class="r">${r[1]?tg(r[1]/r[2]):'—'}</td><td class="r">${tg(r[3])}</td><td class="r ${r[1]&&romi<1?'bad':'ok'}">${r[1]?romi.toFixed(1):'∞'}</td><td>${r[1]&&romi<1?tag('отключить','r'):tag('масштабировать','g')}</td></tr>`}).join('')}
 </tbody></table></div></div>`;
/* Связи */
SC.mis=()=>`<div class="hd"><div><h2>МИС: государственный учёт</h2><p>Приёмы и пациенты ведутся в системе, в МИС уходит то, что требует государство. Выгрузка по кнопке или каждый вечер — по формату и доступу, который даст МИС.</p></div><div class="btns"><button class="bt p" onclick="toast('Выгружено в МИС: <b>14 приёмов за 11.11</b>. Ошибок нет.')">Выгрузить за вчера</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Дата</th><th>Приёмов</th><th>Пациентов</th><th>Статус</th></tr></thead><tbody>
 <tr><td>11.11</td><td>14</td><td>13</td><td>${tag('ждёт выгрузки','w')}</td></tr><tr><td>10.11</td><td>17</td><td>15</td><td>${tag('выгружено','g')}</td></tr><tr><td>09.11</td><td>12</td><td>12</td><td>${tag('выгружено','g')}</td></tr></tbody></table></div></div>
 ${said('Государство проверять будет через МИС — у них обязаловка, чтобы пациенты были выведены.','Пациенты из карточек уходят в МИС без двойного ввода.')}`;
SC.onec=()=>`<div class="hd"><div><h2>Обмен с 1С</h2><p>Работаете в одной системе, а в 1С уходит то, что нужно показывать государству и бухгалтеру: оплаты, услуги, поступления и продажи БАДов. Отдельный пакет — 800 000 ₸.</p></div></div>
 <div class="g2"><div class="pan"><h3>Что уходит в 1С</h3><div class="kv"><span>Оплаты пациентов (касса, Kaspi, перевод)</span><b>${tag('каждый день','g')}</b></div><div class="kv"><span>Реализация услуг</span><b>${tag('каждый день','g')}</b></div><div class="kv"><span>Поступления БАДов и медикаментов</span><b>${tag('по накладной','g')}</b></div><div class="kv"><span>Продажа и списание БАДов</span><b>${tag('каждый день','g')}</b></div><div class="kv"><span>Зарплаты — итоги месяца</span><b>${tag('1-го числа','i')}</b></div></div>
 <div class="pan"><h3>Журнал обмена</h3>${[['12.11 07:00','оплаты 11.11 · 38 документов','ok'],['12.11 07:00','склад 11.11 · 12 движений','ok'],['11.11 07:00','оплаты 10.11 · 41 документ','ok']].map(r=>`<div class="kv"><span>${r[0]} · ${r[1]}</span><b>${tag('без ошибок','g')}</b></div>`).join('')}</div></div>
 ${said('Через 1С государство будет проверять, налоговики знают 1С. Чтобы с платформы в 1С уходило то, что хотим показывать государству.','Так и делаем: вся работа — в системе, в 1С — бухгалтерские документы.')}`;
SC.online=()=>`<div class="hd"><div><h2>Онлайн-детокс · второй этап</h2><p>Онлайн-направление снова запускается в той же системе: оплата программы, куратор, ежедневные отметки пациента, БАДы с доставкой.</p></div></div>
 <div class="g2"><div class="pan"><h3>Поток «Декабрь»</h3><div class="kv"><span>Записались</span><b>46</b></div><div class="kv"><span>Оплатили</span><b>31 · ${tg(31*95000)}</b></div><div class="kv"><span>Кураторы</span><b>2</b></div><div class="kv"><span>Старт</span><b>01.12</b></div></div>
 <div class="pan"><h3>Как работает</h3><div class="kv"><span>Анкета и оплата по ссылке</span><b>${tag('Kaspi','g')}</b></div><div class="kv"><span>Чат куратора в WhatsApp</span><b>${tag('в карточке','g')}</b></div><div class="kv"><span>Переход в офлайн-программу</span><b>${tag('воронка МОП','i')}</b></div></div></div>
 ${said('Онлайн пока приостановили, потом обратно хотим добавлять.','Онлайн не нужна отдельная программа — это ещё одна воронка и поток в той же системе.')}`;
/* Рост */
SC.branch=()=>`<div class="hd"><div><h2>Второй центр и франшиза</h2><p>Система сразу рассчитана на несколько центров: каждый со своими врачами, кассой и P&amp;L, собственник видит сеть целиком. Франчайзи получает готовые протоколы и отчёты.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Центр</th><th>Статус</th><th class="r">Выручка, мес.</th><th class="r">Роялти</th><th>Протоколы</th></tr></thead><tbody>
 <tr><td><b>Алматы · Шевченко</b></td><td>${tag('работает','g')}</td><td class="r">${mln(57400000)}</td><td class="r">—</td><td>все</td></tr>
 <tr><td><b>Алматы · второй центр</b></td><td>${tag('ищем помещение','w')}</td><td class="r">—</td><td class="r">—</td><td>копия при открытии</td></tr>
 <tr><td><b>Астана · франшиза</b></td><td>${tag('переговоры','i')}</td><td class="r">план 25 млн</td><td class="r">7%</td><td>детокс, чекапы</td></tr>
 <tr><td><b>Шымкент · франшиза</b></td><td>${tag('заявка','i')}</td><td class="r">—</td><td class="r">7%</td><td>—</td></tr></tbody></table></div></div>
 ${said('Если систему хорошую поставим, по франшизе по всему Казахстану хотим открыть, в каждом городе.','Франшиза начинается со стандарта: те же экраны, протоколы и отчёты для каждого центра.')}`;
let TK=[{t:'Перезвонить 27 пропущенных',w:'Данияр',d:'сегодня',st:'w'},{t:'Контроль месяца 2 — Дана Сапарова',w:'Д-р Жумабаева',d:'13.11',st:'i'},{t:'Отключить кампанию «Похудение»',w:'Маркетолог',d:'14.11',st:'i'},{t:'Заказ Омега-3 и раствора',w:'Главврач',d:'сегодня',st:'r'},{t:'Выгрузить приёмы в МИС',w:'Регистратура',d:'сегодня',st:'w'}];
SC.tasks=()=>`<div class="hd"><div><h2>Задачи</h2><p>Задачи ставите вы или система: пропущенный звонок, контроль пациента, минимум склада, выгрузка. Просрочка видна на пульте.</p></div><div class="btns"><button class="bt p" onclick="TK.unshift({t:'Новая задача',w:'РОП',d:'завтра',st:'i'});render()">+ Задача</button></div></div>
 <div class="pan">${TK.map((k,i)=>`<div class="kv"><span><b>${esc(k.t)}</b><br><span class="mini">${k.w} · до ${k.d}</span></span><b><button class="bt sm" onclick="TK.splice(${i},1);render();toast('Задача закрыта.')">Готово</button></b></div>`).join('')}</div>`;
/* Запуск */
SC.move=()=>`<div class="hd"><div><h2>Переезд из 6 программ</h2><p>Переносим данные и отключаем лишнее по очереди, клиника не останавливается.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Сейчас</th><th>Что переносим</th><th>Куда</th><th>После переезда</th></tr></thead><tbody>
 ${[['Битрикс24 (раньше amoCRM)','лиды, сделки, история','Воронка МОП','отключаем'],['MedElement','карточки пациентов','Карточка пациента','только архив'],['Bumpix','расписание врачей','Расписание и телефон врача','отключаем'],['Excel и Google-таблицы','доходы, расходы, ФОТ, РНП, маркетинг','Деньги, P&L, РНП, маркетинг','не нужны'],['Google Drive','анализы, документы','Файлы в карточке','по желанию'],['1С','товары, бухгалтерия','остаётся для бухгалтерии и налоговой','обмен по пакету 1С']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${tag(r[3],r[3]==='отключаем'||r[3]==='не нужны'?'g':'i')}</td></tr>`).join('')}
 </tbody></table></div></div>
 ${said('Сейчас пять-шесть программ используем — хочу систематизировать, чтобы всё в одном месте.','Одно окно: каждая программа из списка либо переезжает внутрь, либо получает данные автоматически.')}`;
const PERM=['Пульт и P&L','Деньги и ФОТ','Медкарта пациента','Свои пациенты','Воронка МОП','Звонки и WhatsApp','Склад','Маркетинг','1С и МИС'];
const PM={'Собственник':'111111111','Главврач':'001101101','Врач':'000100000','Администратор':'000011100','МОП':'000011000','РОП':'000011010','Маркетолог':'000010010','Бухгалтер':'110000101'};
SC.roles=()=>`<div class="hd"><div><h2>Роли и права</h2><p>Врач видит только своих пациентов. МОП продаёт и записывает, но медкарту не видит. Деньги и зарплаты — только собственник и бухгалтер.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Роль</th>${PERM.map(p=>`<th class="mini">${p}</th>`).join('')}</tr></thead><tbody>${Object.entries(PM).map(([r,b])=>`<tr><td><b>${r}</b></td>${b.split('').map(x=>`<td>${x==='1'?tag('да','g'):'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
let OPT1C=true;
SC.launch=()=>{const t=2000000+(OPT1C?800000:0);
 return `<div class="hd"><div><h2>Стоимость</h2><p>Своя система: один раз платите — код, данные и сервер ваши. Абонплаты и лимита пользователей нет.</p></div></div>
 <div class="g21"><div class="pan price"><h3>Портал · стандартный пакет — 2 000 000 ₸</h3><p>Пульт собственника, P&amp;L и РНП, расписание и телефон врача, карточка пациента, чекапы и лечение с планом на 3 месяца, воронка МОП, звонки и WhatsApp, РОП и маркетинг, доходы и расходы, ФОТ и бонусы, склад БАДов и медикаментов, МИС, задачи, роли, перенос данных, обучение.</p>
  <label class="pan opt ${OPT1C?'on':''}"><input type="checkbox" ${OPT1C?'checked':''} onchange="OPT1C=this.checked;render()"> <b>Интеграция с 1С — 800 000 ₸</b><br><span class="mini">оплаты, услуги, склад и зарплаты уходят в 1С для бухгалтера и налоговой</span></label>
 </div><div class="pan"><h3>Итого</h3><div class="kv tot"><span>Сумма</span><b>${tg(t)}</b></div><div class="kv"><span>30% — старт</span><b>${tg(t*.3)}</b></div><div class="kv"><span>40% — база на вашем сервере</span><b>${tg(t*.4)}</b></div><div class="kv"><span>30% — сдача и передача кода</span><b>${tg(t*.3)}</b></div><div class="kv"><span>Срок</span><b>4–6 недель${OPT1C?' + 1–2 на 1С':''}</b></div><div class="kv"><span>Поддержка</span><b>3 месяца бесплатно, далее 20 $/час</b></div><div class="kv"><span>Сервер</span><b>5–10 $ или ~15–20 тыс. ₸ в Казахстане</b></div><div class="kv"><span>Абонплата</span><b>нет</b></div></div></div>`};
/* ===== Каркас: верхние вкладки + левая колонка ===== */
function searchDemo(v){if(!v)return;const q=v.toLowerCase();const p=PAT.find(x=>(x.n+x.ph).toLowerCase().includes(q));if(p&&allowed('pat')){patSel=p.id;go('pat');return}const k=STK.find(x=>x.n.toLowerCase().includes(q));if(k&&allowed('stock')){go('stock');toast('Позиция: <b>'+esc(k.n)+'</b>');return}toast('Не найдено. Попробуйте: «Айгуль», «пробиотик».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="ri ${s.k===SECOF[cur]?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><span>${s.n}</span></a>`).join('');
 const S=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=`<h4>${esc(S.n)}</h4>`+S.sub.filter(x=>allowed(x[0])).map((x,i)=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')"><code>${String(i+1).padStart(2,'0')}</code>${esc(x[1])}</a>`).join('')+`<div class="shint"><b>${esc(role)}</b><br>${esc(ROLES[role].note)}</div>`}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Таза Өмір';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
let theme='light';function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme()}
const TOUR=[['dash','1 · Пульт: P&L, РНП и где утекают деньги.'],['pnl','2 · Убыточные месяцы: причины по строкам.'],['sched','3 · Расписание врачей вместо Bumpix.'],['pat','4 · Карточка пациента вместо MedElement.'],['plan','5 · 10 дней в клинике и план на 3 месяца.'],['funnel','6 · Продажи МОП: лид → консультация → чекап → лечение.'],['calls','7 · Звонки с записями и WhatsApp.'],['rop','8 · РОП: план и KPI каждого МОП.'],['mkt','9 · Маркетинг: CPL и ROMI по каналам.'],['stock','10 · БАДы и медикаменты: списание по назначениям.'],['fin','11 · Доходы и расходы вместо Excel.'],['pay','12 · ФОТ и бонусы врачей и МОП.'],['onec','13 · В 1С и МИС уходит то, что нужно государству.'],['branch','14 · Второй центр и франшиза.'],['launch','15 · 2 000 000 ₸ + 1С 800 000 ₸, без абонплаты.']];
let ti=-1,tRun=false;function tour(){if(tRun){tRun=false;return}tRun=true;ti=-1;step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){tRun=false;toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Собственник');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();tRun=false}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
function stopTour(){tRun=false}
