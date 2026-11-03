/* SKINLINE — CRM дистрибьютора препаратов эстетической медицины по ТЗ клиента. Данные вымышленные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const M=n=>(Math.round(n/10000)/100).toFixed(2).replace('.',',')+'M ₸';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const TODAY='04.11.2026',NOW='10:15';
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const bar=(w,c)=>`<div class="bar"><i class="${c||''}" style="--w:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const tz=(n,q,a)=>`<div class="said"><b>ТЗ · раздел ${n}</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const crumbs=(...a)=>`<div class="crumbl">${a.map((x,i)=>i<a.length-1?`<a onclick="${x[1]}">${esc(x[0])}</a>`:`<b>${esc(x[0])}</b>`).join(' <i>›</i> ')}</div>`;
const SEC=[
 {k:'an',n:'Аналитика',sub:[['dash','План-факт'],['pnl','P&L'],['liq','Ликвидность и дивиденды'],['mkt','Маркетинг: CAC и ROI']]},
 {k:'sale',n:'Продажи',sub:[['funnel','Воронка'],['deal','Сделка и калькулятор'],['clients','Контрагенты и лимиты'],['inbox','Звонки и WhatsApp']]},
 {k:'fin',n:'Финансы',sub:[['debts','Дебиторка'],['bank','Банк-клиент'],['opex','Расходы (OPEX)'],['mexp','Расход с телефона']]},
 {k:'ops',n:'Склад и доставка',sub:[['stock','Остатки и резервы 1С'],['cdek','Доставка СДЭК'],['docs','Документы']]},
 {k:'hr',n:'Команда',sub:[['kpi','KPI и зарплата'],['ai','ИИ-ассистент и вебхуки'],['launch','Состав и стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Учредитель':{av:'УЧ',n:'Учредитель',note:'P&L, ликвидность, дивиденды, план-факт, всё',s:ALL.slice()},
 'Коммерческий директор':{av:'КД',n:'Коммерческий директор',note:'Воронка, каналы, дебиторка, KPI команды, маркетинг',s:['dash','mkt','funnel','deal','clients','inbox','debts','stock','cdek','docs','kpi']},
 'Ведущий менеджер':{av:'АЖ',n:'Айгерим Жумабаева · Алматы',note:'Свои сделки, калькулятор, звонки, WhatsApp, документы, свой KPI',s:['funnel','deal','clients','inbox','stock','cdek','docs','kpi','mexp']},
 'Менеджер регионов':{av:'ДК',n:'Даурен Кенжебаев · Караганда',note:'Свои сделки и расходы в поездках',s:['funnel','deal','clients','inbox','mexp','kpi']},
 'Бухгалтер':{av:'НС',n:'Наталья Сон',note:'Банк-клиент, дебиторка, расходы к выплате, P&L, документы',s:['bank','debts','opex','pnl','liq','docs']}
};
let role='Учредитель',cur='dash';
/* Номенклатура */
const SKU=[
 {id:'JF-FN',b:'Jufora',n:'Jufora Fine 1,0 мл',price:38000,cost:21500,q:412,res:60},
 {id:'JF-DP',b:'Jufora',n:'Jufora Deep 1,0 мл',price:42000,cost:23800,q:268,res:40},
 {id:'BG-RV',b:'Biogel',n:'Biogel Revital 2,0 мл',price:29000,cost:15200,q:530,res:120},
 {id:'BG-SB',b:'Biogel',n:'Biogel Skin Booster 2,0 мл',price:33000,cost:17900,q:18,res:10},
 {id:'VL-LF',b:'Volto',n:'Volto Lift 1,0 мл',price:46000,cost:27400,q:146,res:30},
 {id:'VL-CN',b:'Volto',n:'Volto Contour 1,0 мл',price:49000,cost:29100,q:0,res:0}
];
const SK=id=>SKU.find(s=>s.id===id)||SKU[0];
const CH=['Алматы','Караганда','Регионы'];
const SEG={clinic:'Клиника',priv:'Частник',dealer:'Дилер'};
let CLIENTS=[
 {id:'K1',n:'Клиника «Эстетика Плюс»',seg:'clinic',ch:'Алматы',bin:'180940012345',lim:3000000,debt:1840000,over:0,mgr:'AZ',ph:'+7 727 355 10 10',pay:'отсрочка 14 дн.'},
 {id:'K2',n:'ТОО «Дерма Центр»',seg:'clinic',ch:'Алматы',bin:'150540023456',lim:2500000,debt:2960000,over:12,mgr:'AZ',ph:'+7 727 244 20 20',pay:'отсрочка 21 дн.'},
 {id:'K3',n:'ИП Мухамеджанова (косметолог)',seg:'priv',ch:'Алматы',bin:'900312400111',lim:300000,debt:0,over:0,mgr:'MS',ph:'+7 701 233 45 67',pay:'предоплата'},
 {id:'K4',n:'ТОО «БьютиМед Дистрибуция»',seg:'dealer',ch:'Регионы',bin:'170240034567',lim:6000000,debt:5120000,over:41,mgr:'DK',ph:'+7 7172 50 30 30',pay:'100% предоплата (просрочка)'},
 {id:'K5',n:'Клиника «Лазер Арт»',seg:'clinic',ch:'Караганда',bin:'160840045678',lim:2000000,debt:1210000,over:0,mgr:'DK',ph:'+7 7212 41 00 00',pay:'отсрочка 14 дн.'},
 {id:'K6',n:'ИП Ли (частный специалист)',seg:'priv',ch:'Караганда',bin:'880515300222',lim:250000,debt:180000,over:35,mgr:'DK',ph:'+7 705 777 88 99',pay:'отсрочка 7 дн.'},
 {id:'K7',n:'ТОО «Медэстет Шымкент» (дилер)',seg:'dealer',ch:'Регионы',bin:'190340056789',lim:4000000,debt:2780000,over:0,mgr:'MS',ph:'+7 7252 33 22 11',pay:'отсрочка 30 дн.'}
];
const CL=id=>CLIENTS.find(c=>c.id===id)||CLIENTS[0];
const STAFF={AZ:{n:'Айгерим Жумабаева',r:'Ведущий менеджер по продажам',loc:'Алматы',base:450000,tax:0.115,plan:9000000,fact:10350000},MS:{n:'Мадина Сапарова',r:'Менеджер по продажам',loc:'Алматы',base:350000,tax:0.115,plan:7000000,fact:5880000},DK:{n:'Даурен Кенжебаев',r:'Менеджер регионов',loc:'Караганда',base:380000,tax:0.115,plan:8000000,fact:8240000}};
const STG=[['lead','Новый лид'],['qual','Квалификация'],['kp','КП отправлено'],['bill','Счёт выставлен'],['pre','Предоплата получена'],['paid','Оплачено'],['ship','Отгружено'],['won','Успешно реализовано']];
const STN=k=>(STG.find(s=>s[0]===k)||['lost','Закрыто и не реализовано'])[1];
let DEALS=[
 {id:'SD-1041',cl:'K1',stg:'bill',items:[['JF-FN',20],['BG-RV',30]],tax:0.03,deliv:6500,mgr:'AZ',src:'instagram / cpc / jufora_nov',date:'02.11',paid:0},
 {id:'SD-1042',cl:'K2',stg:'kp',items:[['VL-LF',15],['JF-DP',10]],tax:0.03,deliv:6500,mgr:'AZ',src:'сайт / organic',date:'03.11',paid:0},
 {id:'SD-1043',cl:'K4',stg:'pre',items:[['BG-RV',80],['JF-FN',40]],tax:0.03,deliv:24000,mgr:'DK',src:'дилерская сеть',date:'30.10',paid:2000000},
 {id:'SD-1044',cl:'K5',stg:'paid',items:[['VL-LF',10],['BG-SB',8]],tax:0.03,deliv:9800,mgr:'DK',src:'whatsapp / referral',date:'28.10',paid:724000},
 {id:'SD-1045',cl:'K3',stg:'lead',items:[['BG-RV',5]],tax:0.03,deliv:2900,mgr:'MS',src:'instagram / cpc / biogel_promo',date:'04.11',paid:0},
 {id:'SD-1046',cl:'K7',stg:'qual',items:[['JF-FN',50],['VL-LF',20]],tax:0.03,deliv:18000,mgr:'MS',src:'выставка KIBS',date:'01.11',paid:0},
 {id:'SD-1039',cl:'K1',stg:'won',items:[['JF-DP',12],['BG-RV',20]],tax:0.03,deliv:6500,mgr:'AZ',src:'повторный',date:'21.10',paid:1084000},
 {id:'SD-1040',cl:'K6',stg:'ship',items:[['BG-RV',6]],tax:0.03,deliv:2900,mgr:'DK',src:'instagram / cpc / biogel_promo',date:'24.10',paid:0}
];
const DL=id=>DEALS.find(d=>d.id===id)||DEALS[0];
let curD='SD-1041';
const VAT=0.12;
const econ=d=>{const rev=d.items.reduce((a,[s,q])=>a+SK(s).price*q,0),cogs=d.items.reduce((a,[s,q])=>a+SK(s).cost*q,0);const noVat=rev/(1+VAT);const taxes=noVat*d.tax;const gp=noVat-cogs-taxes-d.deliv;return {rev,noVat,cogs,taxes,deliv:d.deliv,gp,mg:noVat?gp/noVat*100:0}};
/* Банк */
let BANK=[
 {id:'b1',bank:'Freedom Bank',t:'09:41',sum:724000,bin:'160840045678',note:'Оплата по счёту № 1044 за препараты',deal:'SD-1044',st:'auto'},
 {id:'b2',bank:'Bank CenterCredit',t:'09:12',sum:2000000,bin:'170240034567',note:'Предоплата по сч. 1043',deal:'SD-1043',st:'auto'},
 {id:'b3',bank:'Freedom Bank',t:'08:55',sum:500000,bin:'150540023456',note:'Частичная оплата задолженности',deal:null,st:'client'},
 {id:'b4',bank:'Bank CenterCredit',t:'08:30',sum:-186000,bin:'—',note:'СДЭК Казахстан, пополнение депозита',deal:null,st:'opex'},
 {id:'b5',bank:'Freedom Bank',t:'вчера',sum:180000,bin:'770101300999',note:'Перевод без назначения',deal:null,st:'manual'}
];
/* Расходы */
let OPEX=[
 {id:'R-311',who:'DK',cat:'Командировки',sum:84000,pay:'Личные средства',chk:'Air Astana · e-ticket',st:'pay',d:'01.11'},
 {id:'R-312',who:'DK',cat:'Такси',sum:6400,pay:'Личные средства',chk:'Яндекс Go',st:'pay',d:'02.11'},
 {id:'R-313',who:'AZ',cat:'Логистика',sum:12800,pay:'Корп. карта',chk:'СДЭК',st:'ok',d:'02.11'},
 {id:'R-314',who:'MS',cat:'Бензин',sum:18000,pay:'Личные средства',chk:'Helios АЗС',st:'new',d:'03.11'},
 {id:'R-315',who:'AZ',cat:'Реклама',sum:350000,pay:'Корп. карта',chk:'Meta Ads · Jufora_nov',st:'ok',d:'01.11'},
 {id:'R-316',who:'MS',cat:'Обучение',sum:120000,pay:'Корп. карта',chk:'Семинар инъекционистов',st:'ok',d:'31.10'}
];
const OST={new:['на проверке','w'],pay:['к выплате','i'],ok:['учтено','g'],paid:['выплачено','']};
let INBOX=[
 {id:'i1',ch:'WA',who:'Клиника «Эстетика Плюс» · Асем',cl:'K1',t:'10:02',msgs:[['in','Добрый день! Счёт получили, оплатим в пятницу. Можно доставку в четверг?','10:02']]},
 {id:'i2',ch:'TEL',who:'ТОО «Дерма Центр» · гл. врач',cl:'K2',t:'09:30',dir:'входящий → Айгерим (закреплённый менеджер)',dur:'8:12',ai:'Клиника просит отсрочку 30 дней вместо 21 и скидку 5% на Volto Lift при заказе от 15 шт. Есть просрочка 12 дней — менеджер пообещал согласовать после оплаты долга 960 000 ₸. Результат: ждём оплату долга до 07.11, затем КП.'},
 {id:'i3',ch:'WA',who:'ИП Ли · частный специалист',cl:'K6',t:'09:00',auto:true,msgs:[['out','Напоминание: по счёту № 1040 срок оплаты 180 000 ₸ прошёл 35 дней назад. Отгрузки приостановлены до оплаты. Реквизиты во вложении.','09:00']]},
 {id:'i4',ch:'TEL',who:'+7 708 555 12 34 · новый номер',cl:null,t:'08:47',dir:'входящий → очередь «Новые клиенты»',dur:'3:05',ai:'Косметолог из Талдыкоргана интересуется Biogel Revital, хочет прайс для частников и обучение. Создан лид, канал «Регионы».'}
];
let curI='i2';

const SC={};
/* ===== План-факт ===== */
const MON=['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя'];
const PF={'Алматы':[[14,12.1],[14,13.8],[15,16.2],[15,14.9],[16,17.4],[16,15.1],[15,13.2],[15,14.6],[17,18.3],[18,19.1],[18,8.4]],'Караганда':[[6,5.2],[6,5.9],[6,6.4],[7,6.1],[7,7.3],[7,6.8],[6,5.1],[6,5.7],[7,7.6],[8,8.1],[8,3.2]],'Регионы':[[8,6.4],[8,7.9],[9,8.2],[9,9.6],[10,8.8],[10,10.4],[9,7.3],[9,8.1],[10,11.2],[11,10.6],[11,4.9]]};
let pfCh='Все';
SC.dash=()=>{const chs=pfCh==='Все'?CH:[pfCh];const ser=MON.map((m,i)=>chs.reduce((a,c)=>[a[0]+PF[c][i][0],a[1]+PF[c][i][1]],[0,0]));const mx=Math.max(...ser.map(s=>Math.max(s[0],s[1])));
 const ytdP=ser.slice(0,10).reduce((a,s)=>a+s[0],0),ytdF=ser.slice(0,10).reduce((a,s)=>a+s[1],0);const debt=CLIENTS.reduce((a,c)=>a+c.debt,0),od=CLIENTS.filter(c=>c.over>30).reduce((a,c)=>a+c.debt,0);
 return `<div class="hd"><div><h2>План-факт продаж</h2><p>По месяцам и каналам сбыта — из сделок, без ручного свода и битых формул. Суммы с НДС, млн ₸.</p></div><div class="btns"><div class="seg">${['Все',...CH].map(c=>`<a class="${pfCh===c?'on':''}" onclick="pfCh='${c}';render()">${c}</a>`).join('')}</div><button class="bt" onclick="xlsPF()">Excel</button></div></div>
 <div class="kpis"><div><small>Январь–октябрь, факт</small><b>${ytdF.toFixed(1).replace('.',',')}M ₸</b><span>план ${ytdP.toFixed(1).replace('.',',')}M · ${pct(ytdF,ytdP)}%</span></div><div><small>Ноябрь, на ${TODAY.slice(0,5)}</small><b>${ser[10][1].toFixed(1).replace('.',',')}M ₸</b><span>план ${ser[10][0]}M · ${pct(ser[10][1],ser[10][0])}% при 13% месяца</span></div><div><small>Дебиторка</small><b class="bad">${M(debt)}</b><span>просрочка 30+ дней: ${M(od)}</span></div><div><small>Оборачиваемость ДЗ</small><b class="warn">41 дн.</b><span>норматив &lt; 30 дн.</span></div><div><small>Буфер ликвидности</small><b>${M(1640000)}</b><span>норматив ≥ 2,00M · дивиденды на паузе</span></div></div>
 <div class="pan"><h3>Динамика: план и факт</h3><p>Светлый столбец — план, синий — факт. Наведите или нажмите на месяц.</p>
  <div class="chart">${ser.map((s,i)=>`<div class="cc" title="${MON[i]}: план ${s[0]}M, факт ${s[1].toFixed(1)}M"><div class="cb"><i class="pl" style="height:${s[0]/mx*100}%"></i><i class="fa ${s[1]<s[0]*.9&&i<10?'lo':''}" style="height:${s[1]/mx*100}%"></i></div><span>${MON[i]}</span><em>${pct(s[1],s[0])}%</em></div>`).join('')}</div></div>
 <div class="g2"><div class="pan"><h3>Каналы сбыта · октябрь</h3><table class="t"><thead><tr><th>Канал</th><th class="r">План</th><th class="r">Факт</th><th class="r">%</th><th style="width:30%"></th></tr></thead><tbody>${CH.map(c=>{const [p,f]=PF[c][9];return `<tr onclick="pfCh='${c}';render()"><td><b>${c}</b></td><td class="r">${p}M</td><td class="r">${f.toFixed(1).replace('.',',')}M</td><td class="r ${f<p?'bad':'ok'}">${pct(f,p)}%</td><td>${bar(pct(f,p),f<p?'w':'g')}</td></tr>`}).join('')}</tbody></table></div>
 <div class="pan"><h3>Сегменты · октябрь</h3><table class="t"><thead><tr><th>Сегмент</th><th class="r">Выручка</th><th class="r">Маржа</th><th class="r">ДЗ</th></tr></thead><tbody>${[['Клиники',19.4,46,6.01],['Частники',5.1,52,0.18],['Дилеры',13.3,31,7.9]].map(r=>`<tr><td><b>${r[0]}</b></td><td class="r">${String(r[1]).replace('.',',')}M</td><td class="r">${r[2]}%</td><td class="r">${String(r[3]).replace('.',',')}M</td></tr>`).join('')}</tbody></table></div></div>
 ${tz(6,'План-факт анализ: динамика выполнения плана продаж (₸ и %) по месяцам и целевым каналам сбыта (Алматы, Караганда, Регионы).','Считается из сделок, оплат и банковских выписок. Без таблиц и формул.')}`};

/* ===== P&L ===== */
SC.pnl=()=>{const rows=[['Выручка с НДС',39.8,34.1,1],['НДС',-4.26,-3.65,0],['Выручка без НДС',35.54,30.45,1],['Себестоимость',-19.6,-17.2,0],['Валовая прибыль',15.94,13.25,1],['Налоги и комиссии',-1.07,-0.91,0],['Доставка (СДЭК)',-0.62,-0.55,0],['OPEX: реклама',-1.85,-1.4,0],['OPEX: командировки, такси, бензин',-0.94,-0.88,0],['OPEX: обучение',-0.36,-0.2,0],['ФОТ: оклады и налоги',-3.62,-3.3,0],['ФОТ: бонусы по сделкам',-1.21,-0.98,0],['Аренда и прочее',-1.1,-1.05,0],['Чистая прибыль',5.17,3.98,1]];
 return `<div class="hd"><div><h2>Отчёт о прибылях и убытках · октябрь 2026</h2><p>Сквозной P&L: продажи из сделок, себестоимость из 1С, расходы из модуля OPEX и банковских выписок. Сравнение с октябрём 2025 (YoY).</p></div><div class="btns"><select class="sel"><option>Октябрь 2026</option><option>3 квартал 2026</option><option>2026 год</option></select><button class="bt" onclick="xlsPnl()">Excel</button></div></div>
 <div class="tw"><table class="t pnl"><thead><tr><th>Статья</th><th class="r">Окт 2026, M ₸</th><th class="r">Окт 2025, M ₸</th><th class="r">YoY</th><th style="width:22%"></th></tr></thead><tbody>
 ${rows.map(r=>{const y=(r[1]-r[2])/Math.abs(r[2])*100;return `<tr class="${r[3]?'sum':''}"><td>${r[0]}</td><td class="r">${r[1].toFixed(2).replace('.',',')}</td><td class="r">${r[2].toFixed(2).replace('.',',')}</td><td class="r ${(r[1]>=0?y>=0:y<=0)?'ok':'bad'}">${y>0?'+':''}${y.toFixed(0)}%</td><td>${r[3]?bar(Math.abs(r[1])/39.8*100,'b'):''}</td></tr>`}).join('')}</tbody></table></div>
 ${tz(6,'Сквозная аналитика P&L: автоматическое сведение продаж (с НДС), себестоимости и расходов (OPEX) для формирования итогового отчёта о прибылях и убытках с расчётом YoY динамики.')}`};

/* ===== Ликвидность ===== */
SC.liq=()=>{const buf=1640000,target=2000000;
 return `<div class="hd"><div><h2>Ликвидность и дивиденды</h2><p>Дашборд учредителей: остатки на счетах, обязательный буфер ликвидности и мораторий на выплаты. Пока буфер ниже норматива — дивиденды не распределяются.</p></div></div>
 <div class="g21"><div class="pan"><h3>Деньги на счетах · сейчас</h3>${[['Freedom Bank · KZT',4120000],['Bank CenterCredit · KZT',2380000],['Касса',140000]].map(x=>`<div class="kv"><span>${x[0]}</span><b>${tg(x[1])}</b></div>`).join('')}<div class="kv"><span>Обязательства 14 дней (поставщики, ФОТ, налоги)</span><b class="bad">− ${tg(5000000)}</b></div><div class="kv tot"><span>Свободный буфер</span><b>${tg(buf)}</b></div>
  <div class="gauge2"><div><i style="width:${pct(buf,target*1.5)}%"></i><em style="left:${pct(target,target*1.5)}%">норматив 2,0M</em></div></div></div>
 <div class="pan mor"><h3>Мораторий на дивиденды</h3><b class="big">Действует</b><p>Буфер ${M(buf)} ниже норматива ${M(target)}. До выплат нужно ещё ${tg(target-buf)}.</p><div class="kv"><span>Ожидаемые поступления 7 дней</span><b>${tg(3940000)}</b></div><div class="kv"><span>Прогноз снятия моратория</span><b>~11.11.2026</b></div><button class="bt" onclick="toast('Мораторий может снять только учредитель — действие записывается в журнал.')">Снять мораторий вручную</button></div></div>
 <div class="pan"><h3>Кассовый календарь · 14 дней</h3><div class="cal14">${Array.from({length:14},(_,i)=>{const v=[1.64,1.9,2.4,2.1,1.2,1.6,2.8,3.1,2.6,2.2,2.9,3.4,3.0,3.6][i];return `<div><i class="${v<2?'lo':''}" style="height:${v/3.6*100}%"></i><span>${5+i}.11</span></div>`}).join('')}</div><p class="mini">Красным — дни, когда буфер ниже 2,0M: система предупредит заранее о возможном кассовом разрыве.</p></div>
 ${tz(4,'Дашборд для учредителей, отслеживающий формирование обязательного буфера ликвидности (целевой норматив ≥ 2.0M ₸) перед распределением дивидендов и позволяющий контролировать временный мораторий на выплаты.')}`};

/* ===== Маркетинг ===== */
const MKT=[['instagram / cpc / jufora_nov','Алматы',350000,14,4,1920000],['instagram / cpc / biogel_promo','Регионы',220000,22,3,410000],['google / cpc / volto','Алматы',180000,6,1,520000],['выставка KIBS','Все',600000,31,6,3100000],['сайт / organic','Все',0,9,2,880000],['whatsapp / referral','Караганда',0,5,3,940000]];
SC.mkt=()=>{const R=MKT;
 return `<div class="hd"><div><h2>Маркетинг: CAC и ROI</h2><p>UTM-метки лида сохраняются в сделке. Затраты на канал — из модуля расходов (статья «Реклама»). ROI считается по фактической валовой прибыли оплаченных сделок, а не по выручке.</p></div><div class="btns"><button class="bt" onclick="xls('Маркетинг',['Источник','Канал','Затраты','Лиды','Клиенты','Валовая прибыль'],MKT)">Excel</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Источник / кампания (UTM)</th><th>Канал сбыта</th><th class="r">Затраты</th><th class="r">Лиды</th><th class="r">Клиенты</th><th class="r">CAC</th><th class="r">Валовая прибыль</th><th class="r">ROI</th><th>Решение</th></tr></thead><tbody>
 ${R.map(r=>{const cac=r[4]?r[2]/r[4]:0,roi=r[2]?(r[5]-r[2])/r[2]*100:null;return `<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td class="r">${tg(r[2])}</td><td class="r">${r[3]}</td><td class="r">${r[4]}</td><td class="r">${r[2]?tg(cac):'—'}</td><td class="r">${tg(r[5])}</td><td class="r ${roi!==null&&roi<50?'bad':'ok'}">${roi===null?'∞':fmt(roi)+'%'}</td><td>${roi!==null&&roi<100?tag('отключить / пересобрать','r'):tag('масштабировать','g')}</td></tr>`}).join('')}</tbody></table></div>
 ${tz(11,'Автоматическое вычисление CAC и ROI путём сопоставления фактической валовой прибыли по сделке с затратами на рекламный канал (данные из блока переменных расходов).')}`};

/* ===== Воронка ===== */
SC.funnel=()=>`<div class="hd"><div><h2>Воронка сделок</h2><p>Перетаскивайте сделки. Правила этапов из ТЗ: «Счёт выставлен» — резерв в 1С на 3 рабочих дня; оплата из банка переводит сделку сама; клиенту с просрочкой 30+ дней отгрузка заблокирована.</p></div><div class="btns"><button class="bt" onclick="xls('Воронка',['Сделка','Контрагент','Этап','Сумма с НДС','Валовая прибыль','Маржа %'],DEALS.map(d=>{const e=econ(d);return [d.id,CL(d.cl).n,STN(d.stg),Math.round(e.rev),Math.round(e.gp),e.mg.toFixed(1)]}))">Excel</button></div></div>
 <div class="kanban">${STG.map(([k,n])=>{const x=DEALS.filter(d=>d.stg===k);return `<div class="kcol" ondragover="event.preventDefault()" ondrop="dropD(event,'${k}')"><div class="kh"><b>${n}</b><span>${x.length}</span></div>${x.map(d=>{const e=econ(d),c=CL(d.cl);return `<div class="kc ${c.over>30?'blk':''}" draggable="true" ondragstart="event.dataTransfer.setData('t','${d.id}')" onclick="openDeal('${d.id}')"><code>${d.id} · ${SEG[c.seg]} · ${c.ch}</code><b>${esc(c.n)}</b><div class="kf"><em>${tg(e.rev)}</em><i>маржа ${e.mg.toFixed(0)}%</i></div>${c.over>30?'<div class="kb">просрочка '+c.over+' дн. · только предоплата</div>':''}</div>`}).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>`;
function dropD(e,k){const d=DL(e.dataTransfer.getData('t'));if(!d)return;const c=CL(d.cl);if(k==='ship'&&c.over>30){toast(`Отгрузка заблокирована: у «${esc(c.n)}» просрочка ${c.over} дней. Нужна 100% предоплата.`);return}if(k==='ship'&&c.debt+econ(d).rev>c.lim&&d.paid<econ(d).rev){toast(`Превышен кредитный лимит ${tg(c.lim)}. Отгрузка — только после оплаты или с разрешения директора.`);return}
 d.stg=k;render();toast(k==='bill'?`${d.id}: счёт выставлен — в 1С отправлен резерв на 3 рабочих дня, клиенту ушёл счёт в WhatsApp.`:`${d.id} → ${STN(k)}`)}
function openDeal(id){curD=id;go('deal')}

/* ===== Сделка ===== */
SC.deal=()=>{const d=DL(curD),c=CL(d.cl),e=econ(d);const si=STG.findIndex(s=>s[0]===d.stg);const blk=c.over>30;
 return crumbs(['Воронка',"go('funnel')"],[d.id])+`<div class="hd"><div><h2>${d.id} · ${esc(c.n)}</h2><p>${SEG[c.seg]} · ${c.ch} · БИН ${c.bin} · ответственный ${esc(STAFF[d.mgr].n)} · источник <span class="mono">${esc(d.src)}</span></p></div><div class="btns"><button class="bt" onclick="genDoc('Счёт на оплату')">Счёт</button><button class="bt" onclick="genDoc('Договор поставки')">Договор</button><button class="bt" onclick="go('cdek')">Накладная СДЭК</button><button class="bt p" onclick="callC()">Позвонить</button></div></div>
 ${blk?`<div class="alert">Отгрузка заблокирована: просрочка ${c.over} дней, долг ${tg(c.debt)}. Контрагент переведён на 100% предоплату.</div>`:''}
 <div class="chainS">${STG.map(([k,n],i)=>`<a class="${i<si?'ok':i===si?'cur':''}" onclick="setSt('${k}')">${n}</a>`).join('')}</div>
 <div class="g21"><div>
  <div class="pan"><h3>Товары · остатки и резерв из 1С ERP</h3><div class="tw"><table class="t"><thead><tr><th>Препарат</th><th class="r">Кол-во</th><th class="r">Цена с НДС</th><th class="r">Сумма</th><th class="r">Себест.</th><th class="r">На складе 1С</th><th class="r">Свободно</th></tr></thead><tbody>
  ${d.items.map(([s,q],i)=>{const k=SK(s),f=k.q-k.res;return `<tr><td><b>${esc(k.n)}</b><span class="sub">${k.b} · ${k.id}</span></td><td class="r"><input class="qin" type="number" value="${q}" onchange="DL(curD).items[${i}][1]=+this.value||0;render()"></td><td class="r">${tg(k.price)}</td><td class="r">${tg(k.price*q)}</td><td class="r">${tg(k.cost*q)}</td><td class="r">${k.q}</td><td class="r ${f<q?'bad':'ok'}">${f}${f<q?' · не хватает':''}</td></tr>`}).join('')}</tbody></table></div>
  ${['bill','pre','paid'].includes(d.stg)?`<div class="okb">Резерв в 1С ERP активен до 07.11 (3 рабочих дня). Если сделку закроют как «не реализовано» — резерв снимется сам, без кладовщика.</div>`:''}</div>
  <div class="pan"><h3>Таймлайн</h3>${[['10:02','WhatsApp','Клиент: «Счёт получили, оплатим в пятницу»'],['09:30','Звонок 4:12','ИИ-резюме: подтвердили состав, доставка в четверг СДЭК-экспресс'],['02.11 16:40','Документ','Счёт № '+d.id.slice(3)+' (.docx) отправлен в WhatsApp'],['02.11 16:40','1С ERP','Резерв: '+d.items.map(([s,q])=>q+' × '+s).join(', ')],[d.date+' 11:20','Лид','UTM: '+d.src]].map(t=>`<div class="tln"><time>${t[0]}</time><b>${t[1]}</b><span>${esc(t[2])}</span></div>`).join('')}</div>
 </div><div>
  <div class="pan econ"><h3>Калькулятор экономики сделки</h3>
   <div class="kv"><span>Сумма реализации с НДС</span><b>${tg(e.rev)}</b></div><div class="kv"><span>Сумма без НДС (12%)</span><b>${tg(e.noVat)}</b></div><div class="kv"><span>Себестоимость продукции</span><b>− ${tg(e.cogs)}</b></div><div class="kv"><span>Налоги и комиссии (${(d.tax*100).toFixed(0)}%)</span><b>− ${tg(e.taxes)}</b></div><div class="kv"><span>Экспресс-доставка СДЭК</span><b>− ${tg(e.deliv)}</b></div>
   <div class="kv tot"><span>Валовая прибыль</span><b>${tg(e.gp)}</b></div><div class="kv tot2"><span>Маржинальность</span><b class="${e.mg<30?'bad':'ok'}">${e.mg.toFixed(1).replace('.',',')}%</b></div>
   <div class="kv"><span>Бонус менеджеру (10% от прибыли)</span><b>${tg(e.gp*0.1)}</b></div></div>
  <div class="pan"><h3>Контрагент</h3><div class="kv"><span>Кредитный лимит</span><b>${tg(c.lim)}</b></div><div class="kv"><span>Долг сейчас</span><b class="${c.debt>c.lim?'bad':''}">${tg(c.debt)}</b></div>${bar(pct(c.debt,c.lim),c.debt>c.lim?'r':'b')}<div class="kv"><span>Условия</span><b>${esc(c.pay)}</b></div><div class="kv"><span>Оплачено по сделке</span><b>${tg(d.paid)}</b></div></div>
 </div></div>
 ${tz(2,'Каждая сделка должна содержать встроенный калькулятор: сумма с НДС и без, себестоимость, налоги и комиссии → валовая прибыль (₸) и маржинальность (%).')}`};
function setSt(k){const d=DL(curD),c=CL(d.cl);if(k==='ship'&&c.over>30){toast('Отгрузка заблокирована просрочкой. Только 100% предоплата.');return}d.stg=k;render();toast(k==='bill'?'Счёт выставлен → webhook в 1С: резерв на 3 рабочих дня.':k==='won'?`Сделка реализована, оплата поступила → менеджеру начислен бонус ${tg(econ(d).gp*0.1)}.`:'Этап: '+STN(k))}
function callC(){toast('Звонок через виртуальную АТС (Tele2/Izi). Запись прикрепится к сделке, ИИ сделает резюме и заполнит «Результат звонка».')}
function genDoc(n){const d=DL(curD),c=CL(d.cl),e=econ(d);openM(n+' № '+d.id.slice(3),'Сформирован по шаблону из полей сделки',`<div class="docp"><div class="dh"><b>ТОО «SKINLINE»</b><span>БИН 000000000000 · г. Алматы</span></div><h4>${n} № ${d.id.slice(3)} от ${TODAY}</h4><p>Покупатель: <b>${esc(c.n)}</b>, БИН ${c.bin}</p><table class="t sm"><thead><tr><th>Наименование</th><th class="r">Кол-во</th><th class="r">Цена</th><th class="r">Сумма</th></tr></thead><tbody>${d.items.map(([s,q])=>`<tr><td>${esc(SK(s).n)}</td><td class="r">${q}</td><td class="r">${tg(SK(s).price)}</td><td class="r">${tg(SK(s).price*q)}</td></tr>`).join('')}<tr class="total"><td colspan="3">Итого с НДС</td><td class="r">${tg(e.rev)}</td></tr><tr><td colspan="3">в т. ч. НДС 12%</td><td class="r">${tg(e.rev-e.noVat)}</td></tr></tbody></table></div><div class="btns l"><button class="bt">.docx</button><button class="bt">.xlsx</button><button class="bt g" onclick="closeM();toast('Документ отправлен клиенту в WhatsApp и сохранён в сделке и облачном архиве.')">Отправить в WhatsApp</button><button class="bt" onclick="closeM();toast('Отправлено на email клиента.')">Email</button></div>`)}

/* ===== Контрагенты ===== */
let cSeg='all';
SC.clients=()=>`<div class="hd"><div><h2>Контрагенты и кредитные лимиты</h2><p>Клиники, частники, дилеры по каналам. У каждого — индивидуальный лимит. Просрочка 30+ дней — автоматический перевод на 100% предоплату и блокировка отгрузки.</p></div><div class="btns"><div class="seg">${[['all','Все'],['clinic','Клиники'],['priv','Частники'],['dealer','Дилеры']].map(([k,n])=>`<a class="${cSeg===k?'on':''}" onclick="cSeg='${k}';render()">${n}</a>`).join('')}</div></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Контрагент</th><th>Сегмент</th><th>Канал</th><th class="r">Лимит</th><th class="r">Долг</th><th style="width:14%">Использовано</th><th class="r">Просрочка</th><th>Статус</th></tr></thead><tbody>
 ${CLIENTS.filter(c=>cSeg==='all'||c.seg===cSeg).map(c=>`<tr onclick="${DEALS.find(d=>d.cl===c.id)?`openDeal('${DEALS.find(d=>d.cl===c.id).id}')`:''}"><td><b>${esc(c.n)}</b><span class="sub">БИН ${c.bin} · ${esc(STAFF[c.mgr].n)}</span></td><td>${SEG[c.seg]}</td><td>${c.ch}</td><td class="r">${tg(c.lim)}</td><td class="r">${tg(c.debt)}</td><td>${bar(pct(c.debt,c.lim),c.debt>c.lim?'r':pct(c.debt,c.lim)>80?'w':'b')}</td><td class="r ${c.over>30?'bad':c.over?'warn':''}">${c.over?c.over+' дн.':'—'}</td><td>${c.over>30?tag('100% предоплата','r'):c.debt>c.lim?tag('лимит превышен','w'):tag('отгрузка разрешена','g')}</td></tr>`).join('')}</tbody></table></div>
 ${tz(3,'Индивидуальные лимиты задолженности для дилеров и клиник. Блокировка отгрузки при превышении лимита или просрочке свыше 30 дней. Перевод контрагентов с просрочкой на 100% предоплату.')}`;

/* ===== Звонки и WhatsApp ===== */
SC.inbox=()=>{const m=INBOX.find(x=>x.id===curI)||INBOX[0];
 return `<div class="hd"><div><h2>Звонки и WhatsApp</h2><p>Виртуальная АТС с умной маршрутизацией: звонок действующего клиента сразу идёт закреплённому менеджеру. Записи и ИИ-резюме — в карточке. Официальный WhatsApp Business API, шаблоны напоминаний о платеже.</p></div><div class="btns"><span class="live"><i></i>WhatsApp Business API</span><span class="live"><i></i>АТС Tele2 / Izi</span></div></div>
 <div class="inbox"><div class="ilist">${INBOX.map(x=>`<a class="${x.id===m.id?'on':''}" onclick="curI='${x.id}';render()"><span class="ch ${x.ch}">${x.ch==='WA'?'WA':'ТЛ'}</span><div><b>${esc(x.who)}</b><small>${x.ch==='WA'?esc(x.msgs[x.msgs.length-1][1]):esc(x.dir)}</small></div><time>${x.t}</time></a>`).join('')}</div>
 <div class="ichat"><div class="ich"><b>${esc(m.who)}</b><small>${m.cl?'контрагент: '+esc(CL(m.cl).n)+' · менеджер '+esc(STAFF[CL(m.cl).mgr].n):'новый контакт'}</small></div>
 ${m.ch==='WA'?`<div class="bubbles">${m.msgs.map(x=>`<div class="bb ${x[0]}">${m.auto?'<small>автонапоминание · шаблон «Просрочка»</small>':''}<p>${esc(x[1])}</p><time>${x[2]}</time></div>`).join('')}</div><div class="tpls">${['Напоминание: срок оплаты через 3 дня','Счёт во вложении','Трек-номер СДЭК'].map(t=>`<a onclick="document.getElementById('itx').value='${t}'">${t}</a>`).join('')}</div><div class="wsend"><input id="itx" placeholder="Сообщение…"><button class="bt p" onclick="toast('Отправлено через WhatsApp Business API, сохранено в таймлайне.')">Отправить</button></div>`
 :`<div class="callc"><div class="player"><button class="bt p">▶</button><div class="wave">${Array.from({length:70},(_,i)=>`<i style="height:${5+Math.abs(Math.sin(i*1.3))*24}px"></i>`).join('')}</div><span>${m.dur}</span></div><div class="aibox"><b>ИИ-резюме (Gemini) · поле «Результат звонка» заполнено</b><p>${esc(m.ai)}</p><a class="lnk" onclick="toast('Транскрипт разговора открыт: 1 140 слов.')">Транскрипт</a> · <a class="lnk" onclick="toast('Черновик follow-up письма готов: учтены условия и история заказов клиники.')">Черновик follow-up</a></div></div>`}
 </div></div>${tz(8,'Входящий звонок от действующего клиента автоматически направляется на закреплённого менеджера. Запись разговоров прикрепляется к карточке. Вся переписка WhatsApp — из окна CRM.')}`};

/* ===== Дебиторка ===== */
const AG=[['0–15 дн.',0,15],['16–30 дн.',16,30],['31–60 дн.',31,60],['60+ дн.',61,999]];
SC.debts=()=>{const tot=CLIENTS.reduce((a,c)=>a+c.debt,0);const ag=AG.map(([n,a,b])=>[n,CLIENTS.filter(c=>c.debt&&c.over>=a&&c.over<=b).reduce((s,c)=>s+c.debt,0)]);
 return `<div class="hd"><div><h2>Дебиторская задолженность · ${M(tot)}</h2><p>Платёжная дисциплина: возраст долга, напоминания клиентам и менеджерам до и в день платежа, блокировки и перевод на предоплату — автоматически.</p></div><div class="btns"><button class="bt" onclick="xls('Дебиторка',['Контрагент','Канал','Долг','Просрочка, дн.','Лимит'],CLIENTS.map(c=>[c.n,c.ch,c.debt,c.over,c.lim]))">Excel</button><button class="bt p" onclick="toast('Напоминания отправлены 3 должникам через WhatsApp Business API, менеджерам — задачи на звонок.')">Напомнить всем с просрочкой</button></div></div>
 <div class="aging">${ag.map((a,i)=>`<div class="${i>1?'r':''}"><small>${a[0]}</small><b>${M(a[1])}</b>${bar(pct(a[1],tot),i>1?'r':i?'w':'b')}</div>`).join('')}<div><small>Оборачиваемость</small><b class="warn">41 дн.</b><span>норматив &lt; 30</span></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Контрагент</th><th>Счёт</th><th class="r">Сумма</th><th>Срок</th><th class="r">Просрочка</th><th>Напоминания</th><th>Действие системы</th></tr></thead><tbody>
 ${CLIENTS.filter(c=>c.debt).sort((a,b)=>b.over-a.over).map(c=>`<tr><td><b>${esc(c.n)}</b><span class="sub">${SEG[c.seg]} · ${c.ch} · ${esc(STAFF[c.mgr].n)}</span></td><td class="mono">№ ${1000+c.id.charCodeAt(1)*3}</td><td class="r">${tg(c.debt)}</td><td class="mono">${c.over?'истёк':'08.11'}</td><td class="r ${c.over>30?'bad':c.over?'warn':''}">${c.over?c.over+' дн.':'—'}</td><td class="mini">${c.over?'за 3 дня · в день · +7 · +14 · +30':'за 3 дня (05.11)'}</td><td>${c.over>30?tag('блок + предоплата','r'):c.over?tag('задача менеджеру','w'):tag('напоминание 05.11','i')}</td></tr>`).join('')}</tbody></table></div>
 ${tz(3,'Автоматическая отправка сообщений клиентам и менеджерам до и в момент наступления даты платежа. Перевод контрагентов с просрочкой на 100% предоплату.')}`};

/* ===== Банк-клиент ===== */
const BST={auto:['привязано к сделке','g'],client:['зачтено в долг клиента','i'],opex:['расход → P&L','v'],manual:['разобрать вручную','w']};
SC.bank=()=>`<div class="hd"><div><h2>Банк-клиент</h2><p>Выписки Freedom Bank и Bank CenterCredit забираются каждые 15 минут по API. Поступление привязывается к сделке и контрагенту по БИН/ИИН или номеру счёта, сделка сама переходит в «Оплачено» или «Предоплата получена», менеджер получает уведомление.</p></div><div class="btns"><span class="live"><i></i>Freedom Bank · 09:45</span><span class="live"><i></i>BCC · 09:45</span></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Время</th><th>Банк</th><th>Назначение</th><th>БИН/ИИН</th><th class="r">Сумма</th><th>Результат</th></tr></thead><tbody>
 ${BANK.map(b=>`<tr><td class="mono">${b.t}</td><td>${b.bank}</td><td>${esc(b.note)}${b.deal?`<span class="sub">→ <a class="lnk" onclick="event.stopPropagation();openDeal('${b.deal}')">${b.deal}</a> · ${STN(DL(b.deal).stg)}</span>`:''}</td><td class="mono">${b.bin}</td><td class="r ${b.sum<0?'bad':'ok'}">${b.sum>0?'+':''}${tg(b.sum)}</td><td>${b.st==='manual'?`<select class="sel sm" onchange="BANK.find(x=>x.id==='${b.id}').st='client';render();toast('Платёж привязан. Система запомнила правило для этого ИИН.')"><option>— привязать к —</option>${CLIENTS.map(c=>`<option>${esc(c.n)}</option>`).join('')}</select>`:tag(BST[b.st][0],BST[b.st][1])}</td></tr>`).join('')}</tbody></table></div>
 <div class="g3" style="margin-top:12px"><div class="pan"><h3>Сегодня</h3><div class="kv"><span>Поступило</span><b>${tg(3404000)}</b></div><div class="kv"><span>Списано</span><b>${tg(186000)}</b></div></div><div class="pan"><h3>Автопривязка</h3><b class="big">92%</b><p class="mini">платежей разнесены без бухгалтера</p></div><div class="pan"><h3>Синхронизация</h3><p class="mini">Каждая транзакция сразу отражается в дашборде ликвидности и P&L.</p></div></div>
 ${tz(7,'Автоматическая привязка поступивших средств к сделке и контрагенту по БИН/ИИН или номеру счёта. При поступлении оплаты сделка автоматически переходит на этап «Оплачено» или «Предоплата получена».')}`;

/* ===== Расходы ===== */
SC.opex=()=>`<div class="hd"><div><h2>Расходы (OPEX)</h2><p>Вместо ручного ввода чеков в таблицы: сотрудник вносит расход с телефона и фото чека, бухгалтер подтверждает, личные средства уходят в «К выплате». Реклама попадает в расчёт CAC и ROI.</p></div><div class="btns"><button class="bt" onclick="xls('Расходы',['№','Сотрудник','Статья','Сумма','Оплата','Чек','Статус'],OPEX.map(o=>[o.id,STAFF[o.who].n,o.cat,o.sum,o.pay,o.chk,OST[o.st][0]]))">Excel</button></div></div>
 <div class="g21"><div class="tw"><table class="t"><thead><tr><th>№</th><th>Сотрудник</th><th>Статья</th><th class="r">Сумма</th><th>Оплата</th><th>Чек</th><th>Статус</th><th></th></tr></thead><tbody>
 ${OPEX.map(o=>`<tr><td class="mono">${o.id}</td><td>${esc(STAFF[o.who].n)}</td><td>${o.cat}</td><td class="r">${tg(o.sum)}</td><td>${o.pay}</td><td><a class="chk" onclick="toast('Скан чека: ${esc(o.chk)}')">▤ ${esc(o.chk)}</a></td><td>${tag(OST[o.st][0],OST[o.st][1])}</td><td>${o.st==='new'?`<button class="bt sm" onclick="OPEX.find(x=>x.id==='${o.id}').st='pay';render()">Подтвердить</button>`:o.st==='pay'?`<button class="bt sm p" onclick="OPEX.find(x=>x.id==='${o.id}').st='paid';render();toast('Компенсация выплачена, статус «К выплате» снят.')">Выплатить</button>`:''}</td></tr>`).join('')}</tbody></table></div>
 <div class="pan"><h3>Ноябрь по статьям</h3>${['Реклама','Командировки','Обучение','Бензин','Логистика','Такси'].map(c=>{const s=OPEX.filter(o=>o.cat===c).reduce((a,o)=>a+o.sum,0);return `<div class="kv"><span>${c}</span><b>${tg(s)}</b></div>`}).join('')}<div class="kv tot"><span>К выплате сотрудникам</span><b>${tg(OPEX.filter(o=>o.st==='pay').reduce((a,o)=>a+o.sum,0))}</b></div></div></div>
 ${tz(4,'Сотрудники вносят операционные расходы через мобильный интерфейс: статья, сумма, способ оплаты, скан чека. Отслеживание статуса компенсации («К выплате»).')}`;
let mx={cat:'Такси',sum:'4 200',pay:'Личные средства'};
SC.mexp=()=>`<div class="hd"><div><h2>Расход с телефона</h2><p>Так выглядит у менеджера: 20 секунд — и расход в системе с чеком.</p></div></div>
 <div class="phw"><div class="phone3"><div class="phs"><div class="phtop"><b>Новый расход</b><span>${esc(ROLES[role].n.split(' · ')[0])}</span></div>
 <label>Статья<div class="chipr">${['Такси','Бензин','Логистика','Командировки','Реклама','Обучение'].map(c=>`<a class="${mx.cat===c?'on':''}" onclick="mx.cat='${c}';render()">${c}</a>`).join('')}</div></label>
 <label>Сумма, ₸<input class="pin" value="${mx.sum}"></label>
 <label>Способ оплаты<div class="chipr">${['Личные средства','Корп. карта'].map(c=>`<a class="${mx.pay===c?'on':''}" onclick="mx.pay='${c}';render()">${c}</a>`).join('')}</div></label>
 <div class="photo"><span>Фото чека</span><b>Яндекс Go · 4 200 ₸ · 03.11</b><small>сумма распознана с чека</small></div>
 <button class="bt p full" onclick="OPEX.unshift({id:'R-317',who:'DK',cat:mx.cat,sum:4200,pay:mx.pay,chk:'Яндекс Go',st:'new',d:'04.11'});toast('Расход отправлен бухгалтеру. Статус: на проверке → к выплате.')">Отправить</button></div></div>
 <div class="pan"><h3>Мои расходы</h3>${OPEX.filter(o=>o.who==='DK').map(o=>`<div class="kv"><span>${o.d} · ${o.cat}</span><b>${tg(o.sum)} · ${OST[o.st][0]}</b></div>`).join('')}</div></div>`;

/* ===== Склад ===== */
SC.stock=()=>`<div class="hd"><div><h2>Остатки и резервы · 1C ERP</h2><p>Остатки препаратов приходят из 1С в реальном времени и видны прямо в сделке. «Счёт выставлен» → webhook в 1С: резерв на 3 рабочих дня. Сделка закрыта как «не реализовано» — резерв снимается сам.</p></div><div class="btns"><span class="live"><i></i>1С ERP · синхронизация 10:14</span></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Препарат</th><th>Бренд</th><th class="r">На складе</th><th class="r">В резерве</th><th class="r">Свободно</th><th class="r">Цена</th><th class="r">Себест.</th><th>Резервы</th></tr></thead><tbody>
 ${SKU.map(k=>{const f=k.q-k.res;return `<tr><td><b>${esc(k.n)}</b><span class="sub">${k.id}</span></td><td>${k.b}</td><td class="r">${k.q}</td><td class="r">${k.res}</td><td class="r ${f<20?'bad':''}">${f}</td><td class="r">${tg(k.price)}</td><td class="r">${tg(k.cost)}</td><td class="mini">${DEALS.filter(d=>['bill','pre','paid'].includes(d.stg)&&d.items.some(i=>i[0]===k.id)).map(d=>d.id+' до 07.11').join(', ')||'—'}</td></tr>`}).join('')}</tbody></table></div>
 <div class="g2" style="margin-top:12px"><div class="pan"><h3>Журнал обмена с 1С</h3>${[['10:14','← остатки','6 позиций'],['09:41','→ снять резерв','SD-1037 закрыта «не реализовано»'],['02.11 16:40','→ резерв 3 р.д.','SD-1041: JF-FN 20, BG-RV 30'],['02.11 16:41','← подтверждение','резерв № 000412']].map(x=>`<div class="kv"><span><code>${x[0]}</code> ${x[1]}</span><b>${x[2]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Защита от продажи «воздуха»</h3><p class="mini">Volto Contour — 0 шт: менеджер видит это в сделке и не может выставить счёт без подтверждения поставки.</p></div></div>
 ${tz(9,'Виджет остатков в карточке сделки. При переводе на «Счёт выставлен» CRM отправляет webhook в 1C на резервирование на 3 рабочих дня; при «Закрыто и не реализовано» резерв снимается без участия кладовщика.')}`;

/* ===== СДЭК ===== */
let depo=148600;
const SHIPS=[['SD-1044','Клиника «Лазер Арт»','Караганда','экспресс',9800,'в пути','1102938475'],['SD-1040','ИП Ли','Караганда','экспресс',2900,'доставлено','1102938101'],['SD-1039','Клиника «Эстетика Плюс»','Алматы','курьер',6500,'доставлено','1102937720']];
SC.cdek=()=>`<div class="hd"><div><h2>Доставка СДЭК</h2><p>Накладная создаётся из сделки в личном кабинете СДЭК по API. Стоимость экспресс-доставки списывается с виртуального «Депозита доставки» и попадает в экономику сделки.</p></div><div class="btns"><button class="bt p" onclick="mkWay()">+ Накладная</button></div></div>
 <div class="g21"><div class="tw"><table class="t"><thead><tr><th>Сделка</th><th>Получатель</th><th>Город</th><th>Тариф</th><th class="r">Стоимость</th><th>Трек</th><th>Статус</th></tr></thead><tbody>${SHIPS.map(s=>`<tr onclick="openDeal('${s[0]}')"><td class="mono">${s[0]}</td><td>${esc(s[1])}</td><td>${s[2]}</td><td>${s[3]}</td><td class="r">${tg(s[4])}</td><td class="mono">${s[6]}</td><td>${tag(s[5],s[5]==='доставлено'?'g':'i')}</td></tr>`).join('')}</tbody></table></div>
 <div class="pan depo"><h3>Депозит доставки</h3><b class="big">${tg(depo)}</b>${bar(pct(depo,300000),depo<100000?'r':'b')}<div class="kv"><span>Пополнено в ноябре</span><b>${tg(186000)}</b></div><div class="kv"><span>Списано за доставки</span><b>${tg(37400)}</b></div><p class="mini">При остатке ниже 100 000 ₸ бухгалтер получит напоминание пополнить.</p></div></div>
 ${tz(2,'Прямая интеграция с личным кабинетом СДЭК для генерации накладных. Автоматический трекинг стоимости экспресс-доставки и учёт остатка виртуального «Депозита доставки».')}`;
function mkWay(){depo-=6500;SHIPS.unshift(['SD-1041','Клиника «Эстетика Плюс»','Алматы','экспресс',6500,'создана','1102939012']);render();toast('Накладная СДЭК создана, трек отправлен клиенту в WhatsApp, 6 500 ₸ списано с депозита и учтено в сделке.')}

/* ===== Документы ===== */
SC.docs=()=>`<div class="hd"><div><h2>Документы по шаблонам</h2><p>Договоры поставки, счета, счета-фактуры, акты и КП собираются из полей сделки: реквизиты, подписант, номенклатура, суммы с НДС и без. Хранятся в сделке, отправляются в один клик.</p></div></div>
 <div class="docg">${[['Договор поставки','.docx','реквизиты сторон, подписант, условия отсрочки по лимиту'],['Счёт на оплату','.docx / .xlsx','номенклатура, НДС 12%, срок резерва'],['Счёт-фактура','.xlsx','по данным отгрузки'],['Акт выполненных работ','.docx','для услуг: обучение, семинары'],['Коммерческое предложение','.docx','персональные цены клиники, ИИ-текст'],['Акт сверки','.xlsx','по банку и отгрузкам']].map(d=>`<div class="docc" onclick="genDoc('${d[0]}')"><code>${d[1]}</code><b>${d[0]}</b><span>${d[2]}</span></div>`).join('')}</div>
 ${tz(10,'Автоматическое создание договоров поставки, счетов-фактур, актов и КП в .docx и .xlsx с подстановкой переменных и корректным расчётом НДС.')}`;

/* ===== KPI ===== */
SC.kpi=()=>`<div class="hd"><div><h2>KPI и зарплатный фонд · ноябрь</h2><p>Оклад и налоги — в карточке сотрудника. Бонус 10% от прибыли сделки начисляется сам, когда сделка «Успешно реализовано» и деньги поступили. Пороги KPI видны менеджеру в его рабочем пространстве.</p></div><div class="btns"><button class="bt" onclick="xls('ФОТ_ноябрь',['Сотрудник','Должность','Оклад','Налоги','План','Факт','Бонус','Итого'],Object.values(STAFF).map(s=>{const b=kb(s);return [s.n,s.r,s.base,Math.round(s.base*s.tax),s.plan,s.fact,b,s.base+b]}))">Excel</button></div></div>
 <div class="kpig">${Object.entries(STAFF).map(([k,s])=>{const p=pct(s.fact,s.plan),b=kb(s);return `<div class="pan kp"><div class="kph"><b>${esc(s.n)}</b><span>${esc(s.r)} · ${s.loc}</span></div><div class="ring" style="--p:${Math.min(p,100)}"><b>${p}%</b><small>плана</small></div>${bar(p,p>=100?'g':p>=80?'b':'w')}<div class="thr"><span class="${p>=80?'on':''}">80%</span><span class="${p>=100?'on':''}">100% · +2%</span><span class="${p>=120?'on':''}">120% · +4%</span></div>
 <div class="kv"><span>Оклад</span><b>${tg(s.base)}</b></div><div class="kv"><span>Налоги компании</span><b>${tg(s.base*s.tax)}</b></div><div class="kv"><span>Прибыль оплаченных сделок</span><b>${tg(s.fact*0.31)}</b></div><div class="kv"><span>Бонус ${p>=100?'12%':'10%'}</span><b>${tg(b)}</b></div><div class="kv tot"><span>К начислению</span><b>${tg(s.base+b)}</b></div></div>`}).join('')}</div>
 <div class="pan"><h3>Как начисляется</h3><div class="flow4">${['Сделка «Успешно реализовано»','Оплата из банка привязана','Бонус 10% от прибыли сделки','Порог 100%+ плана → повышенная ставка'].map((x,i)=>`<div><b>${i+1}</b>${x}</div>`).join('')}</div><p class="mini">Сложные прогрессивные модели (десяток переменных) — внешним скриптом на Python через вебхук, см. «ИИ-ассистент и вебхуки».</p></div>
 ${tz(5,'CRM автоматически начисляет бонусный процент (10% от чистой прибыли сделок) при переводе сделки в «Успешно реализовано» и поступлении средств. Индикация KPI в рабочем пространстве менеджера.')}`;
const kb=s=>Math.round(s.fact*0.31*(s.fact>=s.plan?0.12:0.10));

/* ===== ИИ и вебхуки ===== */
SC.ai=()=>`<div class="hd"><div><h2>ИИ-ассистент и вебхуки</h2><p>Архитектура с запасом: события CRM уходят на внешние скрипты, Google Gemini разбирает звонки и помогает с письмами.</p></div></div>
 <div class="g2"><div class="pan"><h3>Вебхуки</h3><table class="t sm"><thead><tr><th>Событие</th><th>Куда</th><th>Статус</th></tr></thead><tbody>${[['deal.stage = «Счёт выставлен»','1С ERP · резерв','200 OK · 09:41'],['deal.stage = «Успешно реализовано»','kpi-calc.py · прогрессивный KPI','200 OK · вчера'],['payment.received','ликвидность · P&L','200 OK · 09:41'],['call.recorded','Gemini · транскрибация','200 OK · 09:38'],['client.overdue > 30','блокировка отгрузки','200 OK · 09:00']].map(r=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td>${tag(r[2],'g')}</td></tr>`).join('')}</tbody></table></div>
 <div class="pan"><h3>Gemini по звонкам</h3><div class="aibox"><b>Переговоры с дилером «БьютиМед» · 24 мин</b><p>Дилер готов погасить 2,0M до 10.11 и просит отгрузку Biogel Revital 80 шт под 100% предоплату. Возражение: цена Jufora выше конкурента на 6%. Договорились: КП с бонусной партией при закупке от 50 шт.</p></div><div class="btns l"><button class="bt" onclick="toast('Транскрипт открыт.')">Транскрипт</button><button class="bt p" onclick="openM('Черновик follow-up','Gemini · по истории клиники','<div class=&quot;pan&quot;><p>Здравствуйте, Ербол! Спасибо за разговор. Как договорились: при погашении 2,0M до 10.11 отгружаем Biogel Revital 80 шт по предоплате, а к закупке Jufora от 50 шт добавляем бонусную партию 5 шт. КП во вложении.</p></div>')">Черновик follow-up</button></div></div></div>
 ${tz(12,'Внешние обработчики (Webhooks) для скриптов на Python/C#. Интеграция с Google Gemini: транскрибация звонков, резюме переговоров с заполнением «Результат звонка», персонализированные follow-up.')}`;

/* ===== Стоимость ===== */
const PRICE=[['Ядро CRM: справочники, воронка с калькулятором экономики, контрагенты и лимиты, дебиторка с напоминаниями, OPEX с мобильного, ликвидность и дивиденды, KPI и ФОТ, план-факт и P&L, документы по шаблонам, маркетинг (UTM, CAC, ROI), роли',2800000,'1–6, 10, 11'],['Омниканальность: виртуальная АТС с маршрутизацией и записями, WhatsApp Business API, шаблоны',400000,'8'],['СДЭК: накладные по API, трекинг, депозит доставки',200000,'2'],['Банк-клиент: Freedom Bank и Bank CenterCredit, автопривязка платежей, смена статусов',500000,'7'],['1C ERP: остатки в сделке, резерв и снятие по вебхуку, себестоимость',800000,'9'],['ИИ и вебхуки: Gemini — транскрибация, резюме, follow-up; внешние скрипты KPI',300000,'12']];
SC.launch=()=>{const tot=PRICE.reduce((a,p)=>a+p[1],0);return `<div class="hd"><div><h2>Состав и стоимость по ТЗ</h2><p>Вместо связки amoCRM + 1С и платных модулей — своя система Skinline: без абонплаты за пользователей и виджеты, код и сервер — ваши, 1С остаётся учётной системой.</p></div></div>
 <div class="g21"><div class="tw"><table class="t"><thead><tr><th>Блок</th><th>Раздел ТЗ</th><th class="r">Стоимость</th></tr></thead><tbody>${PRICE.map(p=>`<tr><td>${p[0]}</td><td class="mono">${p[2]}</td><td class="r">${tg(p[1])}</td></tr>`).join('')}<tr class="total"><td>Итого полный объём ТЗ</td><td></td><td class="r">${tg(tot)}</td></tr></tbody></table></div>
 <div><div class="pan"><h3>Оплата и сроки</h3><div class="kv"><span>Старт</span><b>30%</b></div><div class="kv"><span>Ядро и интеграции работают</span><b>40%</b></div><div class="kv"><span>Сдача</span><b>30%</b></div><div class="kv"><span>Срок</span><b>8–10 недель</b></div><div class="kv"><span>Абонплата</span><b>нет</b></div><div class="kv"><span>Доработки</span><b>20 $ в час</b></div></div></div></div>`};

/* ===== Каркас (верхняя навигация) ===== */
function searchDemo(v){if(!v)return;const q=v.toLowerCase();const c=CLIENTS.find(x=>(x.n+x.bin).toLowerCase().includes(q));if(c){const d=DEALS.find(x=>x.cl===c.id);if(d&&allowed('deal')){openDeal(d.id);return}}toast('Не найдено. Попробуйте: «Дерма», «БьютиМед», БИН.')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Учредитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="ri ${s.k===SECOF[cur]?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><span>${s.n}</span></a>`).join('');
 const S=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=S.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Skinline';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function xls(name,head,rows){const h=`<html><head><meta charset="utf-8"></head><body><table border="1"><tr>${head.map(x=>`<th style="background:#1556b8;color:#fff">${esc(x)}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></body></html>`;try{const b=new Blob(['﻿'+h],{type:'application/vnd.ms-excel'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name+'.xls';document.body.appendChild(a);a.click();a.remove()}catch(e){}toast(`Файл <b>${esc(name)}.xls</b> скачан.`)}
const xlsPF=()=>xls('План-факт',['Месяц',...CH.flatMap(c=>[c+' план',c+' факт'])],MON.map((m,i)=>[m,...CH.flatMap(c=>PF[c][i])]));
const xlsPnl=()=>xls('PnL_октябрь',['Статья','2026','2025'],[['Выручка с НДС',39.8,34.1],['Валовая прибыль',15.94,13.25],['Чистая прибыль',5.17,3.98]]);
let theme='light';function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme()}
const TOUR=[['dash','1 · План-факт по месяцам и каналам — из сделок, без формул.'],['funnel','2 · Воронка с правилами: резерв в 1С, блокировка должников.'],['deal','3 · Сделка: калькулятор — прибыль и маржа, остатки 1С, документы.'],['clients','4 · Кредитные лимиты и перевод на предоплату.'],['debts','5 · Дебиторка: возраст долга и автонапоминания.'],['bank','6 · Банк-клиент: оплаты привязываются к сделкам сами.'],['opex','7 · Расходы с чеками, «К выплате».'],['liq','8 · Буфер ликвидности и мораторий на дивиденды.'],['pnl','9 · P&L с YoY.'],['kpi','10 · KPI: бонус 10% от прибыли сам.'],['inbox','11 · АТС и WhatsApp API, ИИ-резюме звонков.'],['cdek','12 · СДЭК и депозит доставки.'],['mkt','13 · CAC и ROI каналов.'],['launch','14 · Состав и стоимость по ТЗ.']];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Учредитель');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false;ti=-1}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
