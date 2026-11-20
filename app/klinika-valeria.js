/* МЕЙРИМ — многопрофильная клиника, 3 филиала (Валерия, Меруерт). Демо на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(Math.round(n/100000)/10).toString().replace('.',',')+' млн ₸';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const bar=w=>`<div class="bar"><i style="width:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const said=(q,a)=>`<div class="said"><b>ВАЛЕРИЯ, 20.11</b><i>«${q}»</i>${a?`<div class="sa">${a}</div>`:''}</div>`;
const tbl=(h,rows)=>`<div class="tw"><table class="t"><thead><tr>${h.map(x=>`<th${x[0]==='>'?' class="r"':''}>${x.replace(/^>/,'')}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
const dot=(c,t)=>`<span class="st"><span class="dot d-${c}"></span>${t}</span>`;

const SEC=[
 {k:'own',n:'Руководителю',sub:[['dash','Пульт по 3 филиалам'],['rep','Отчёты по первичке'],['pay','Зарплата и дисциплина']]},
 {k:'reg',n:'Регистратура',sub:[['sched','Расписание'],['list','Пациенты'],['pat','Карточка пациента'],['cash','Касса и оплаты']]},
 {k:'med',n:'Врачу',sub:[['plan','План лечения и КП'],['proto','Программы бесплодия'],['usg','УЗИ-протоколы'],['sheet','Лечебные листы']]},
 {k:'stk',n:'Склад',sub:[['stock','Остатки 3 филиалов'],['link','Услуги ↔ расходники'],['move','Перемещения'],['exp','Сроки годности']]},
 {k:'sale',n:'Продажи',sub:[['funnel','Заявки и воронка'],['inbox','WhatsApp и звонки']]},
 {k:'sys',n:'Система',sub:[['migr','Перенос из МакДент'],['cab','Кабинет пациента'],['acc','Доступы и роли'],['launch','Стоимость и запуск']]}
];
const SECOF={},SUBN={},ALL=[];SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1];ALL.push(x[0])}));
const IC={own:'M3 13h4v8H3zM10 8h4v13h-4zM17 3h4v18h-4z',reg:'M4 5h16v15H4zM4 10h16M9 3v4M15 3v4',med:'M12 4v16M4 12h16',stk:'M3 8l9-5 9 5v11H3zM8 19v-6h8v6',sale:'M3 5h18l-7 8v6l-4 2v-8z',sys:'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3'};
const ic=k=>`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="${IC[k]}"/></svg>`;
const ROLES={
 'Собственник':{av:'МР',n:'Меруерт',note:'все филиалы, деньги, зарплаты, отчёты',s:ALL.slice()},
 'Управляющая':{av:'ВС',n:'Валерия',note:'все филиалы, склад, персонал, перенос данных',s:ALL.slice()},
 'Медрегистратор':{av:'РГ',n:'Камила · Есиль',note:'расписание, пациенты, касса, заявки; зарплаты и закуп не видит',s:['sched','list','pat','cash','funnel','inbox','cab']},
 'Врач':{av:'ВР',n:'Ахметова Г. С.',note:'своё расписание, карточки, планы лечения, УЗИ, листы назначений',s:['sched','pat','plan','proto','usg','sheet']},
 'Склад':{av:'СК',n:'Старшая медсестра',note:'остатки, приход, перемещения, сроки годности',s:['stock','link','move','exp']}
};
let role='Собственник',cur='dash',curB='E';
const BR={E:'Есиль',S:'Сарыарка',B:'Байконур'};
const CAB=[['G1','Гинеколог 1'],['G2','Гинеколог 2'],['U','УЗИ 3D/4D'],['P','Процедурный'],['K','Косметология']];
const DOC={
 D1:{n:'Ахметова Г. С.',sp:'акушер-гинеколог',br:'E',cab:'G1',pc:35},D2:{n:'Ким Е. В.',sp:'репродуктолог',br:'E',cab:'G2',pc:35},
 D3:{n:'Сейтказина А. Б.',sp:'врач УЗИ',br:'E',cab:'U',pc:30},D5:{n:'Жумабаева Л. Е.',sp:'косметолог',br:'E',cab:'K',pc:30},
 D6:{n:'Нургалиева С. К.',sp:'процедурная м/с',br:'E',cab:'P',pc:10},D4:{n:'Омарова Д. К.',sp:'гинеколог-эндокринолог',br:'S',cab:'G1',pc:35},
 D7:{n:'Бекова А. Т.',sp:'врач УЗИ',br:'S',cab:'U',pc:30},D10:{n:'Садыкова А. М.',sp:'процедурная м/с',br:'S',cab:'P',pc:10},
 D8:{n:'Тлеуова М. Р.',sp:'акушер-гинеколог',br:'B',cab:'G1',pc:35},D9:{n:'Абдрахманова Ж. С.',sp:'врач УЗИ',br:'B',cab:'U',pc:30}
};
const SV={
 CONS:{n:'Приём акушера-гинеколога',p:9000,it:[['GLV',2],['SPC',1]]},
 REPC:{n:'Консультация репродуктолога',p:15000,it:[['GLV',2]]},
 VMS:{n:'Установка ВМС (внутриматочной спирали)',p:35000,it:[['VMS',1],['GLV',2],['SPC',1],['NAP',1],['ANT',1]]},
 RVMS:{n:'Удаление ВМС',p:12000,it:[['SPC',1],['GLV',2],['ANT',1]]},
 USG34:{n:'УЗИ плода 3D/4D',p:18000,it:[['GEL',1],['NAP',1]]},
 USGM:{n:'УЗИ органов малого таза',p:9000,it:[['GEL',1],['CVR',1],['GLV',2]]},
 FOL:{n:'Фолликулометрия',p:8000,it:[['GEL',1],['CVR',1],['GLV',2]]},
 SMR:{n:'Мазок на флору + цитология',p:6500,it:[['SPC',1],['BRS',1],['GLS',2],['GLV',2]]},
 INS:{n:'Внутриматочная инсеминация',p:65000,it:[['CAT',1],['SPC',1],['GLV',2],['MED',1]]},
 PRP:{n:'Плазмолифтинг лица',p:25000,it:[['PRP',2],['NDL',3],['GLV',2],['ANT',1]]}
};
const SK={
 VMS:{n:'Спираль внутриматочная Cu 375',u:'шт',c:6200,min:5,st:{E:7,S:3,B:8},ex:'08.2027'},
 GLV:{n:'Перчатки смотровые нитрил M',u:'пар',c:45,min:200,st:{E:640,S:380,B:310},ex:'03.2028'},
 SPC:{n:'Зеркало Куско одноразовое M',u:'шт',c:260,min:40,st:{E:96,S:55,B:58},ex:'11.2029'},
 NAP:{n:'Салфетка стерильная 45×45',u:'шт',c:90,min:50,st:{E:140,S:66,B:74},ex:'06.2027'},
 ANT:{n:'Антисептик кожный, 1 доза',u:'доза',c:35,min:100,st:{E:420,S:150,B:190},ex:'12.2026'},
 GEL:{n:'Гель для УЗИ, порция 20 мл',u:'порц.',c:40,min:100,st:{E:260,S:120,B:135},ex:'05.2027'},
 CVR:{n:'Чехол на датчик',u:'шт',c:55,min:80,st:{E:210,S:110,B:95},ex:'09.2028'},
 BRS:{n:'Цитощётка',u:'шт',c:70,min:40,st:{E:90,S:48,B:51},ex:'01.2028'},
 GLS:{n:'Стекло предметное',u:'шт',c:25,min:60,st:{E:150,S:70,B:90},ex:'—'},
 CAT:{n:'Катетер для инсеминации',u:'шт',c:4800,min:4,st:{E:6,S:1,B:6},ex:'02.2027'},
 MED:{n:'Среда для обработки спермы, 1 мл',u:'фл.',c:7900,min:3,st:{E:4,S:0,B:4},ex:'12.2026'},
 PRP:{n:'Пробирка PRP с гелем',u:'шт',c:2900,min:20,st:{E:34,S:26,B:24},ex:'01.2027'},
 NDL:{n:'Игла 30G 4 мм',u:'шт',c:60,min:60,st:{E:180,S:90,B:75},ex:'07.2029'}
};
const svCost=k=>SV[k].it.reduce((a,[s,q])=>a+SK[s].c*q,0);
const soon=ex=>/^(12\.2026|01\.2027|02\.2027)$/.test(ex);
const PT={
 P1:{n:'Сарсенова Айжан Маратовна',dob:'14.03.1993',ph:'+7 701 4** ** 12',br:'E',src:'Instagram',tag:'беременность 24 нед',dep:0},
 P2:{n:'Есенова Гаухар Айдаровна',dob:'02.07.1988',ph:'+7 747 3** ** 80',br:'E',src:'повторный',tag:'контрацепция',dep:0},
 P3:{n:'Каримова Алия Нурлановна',dob:'21.11.1990',ph:'+7 777 1** ** 44',br:'E',src:'2ГИС',tag:'программа бесплодия',dep:120000},
 P4:{n:'Муканова Дана Ерлановна',dob:'09.01.1996',ph:'+7 705 6** ** 31',br:'E',src:'WhatsApp',tag:'первичная',dep:0},
 P5:{n:'Ибраева Сабина Рустемовна',dob:'30.05.1985',ph:'+7 701 2** ** 09',br:'E',src:'по рекомендации',tag:'плазмолифтинг, курс 3',dep:50000},
 P6:{n:'Ли Виктория Олеговна',dob:'17.08.1991',ph:'+7 778 5** ** 63',br:'E',src:'сайт',tag:'УЗИ 3D',dep:0},
 P7:{n:'Тажибаева Асем Кайратовна',dob:'05.12.1994',ph:'+7 702 8** ** 27',br:'S',src:'Instagram',tag:'гинекология',dep:0},
 P8:{n:'Оспанова Меруерт Бахытовна',dob:'11.04.1987',ph:'+7 700 9** ** 55',br:'S',src:'повторный',tag:'эндокринология',dep:0},
 P9:{n:'Жакупова Инкар Талгатовна',dob:'23.09.1998',ph:'+7 776 7** ** 18',br:'B',src:'2ГИС',tag:'первичная',dep:0},
 P10:{n:'Смагулова Лаура Ериковна',dob:'28.02.1992',ph:'+7 707 1** ** 71',br:'B',src:'WhatsApp',tag:'УЗИ плода',dep:0}
};
let VIS=[
 {id:'V1',pt:'P2',doc:'D1',cab:'G1',br:'E',t:'09:00',l:2,sv:['CONS','VMS'],st:'paid'},
 {id:'V2',pt:'P1',doc:'D3',cab:'U',br:'E',t:'09:30',l:2,sv:['USG34'],st:'paid'},
 {id:'V3',pt:'P4',doc:'D1',cab:'G1',br:'E',t:'10:30',l:2,sv:['CONS','VMS'],st:'in'},
 {id:'V4',pt:'P3',doc:'D2',cab:'G2',br:'E',t:'10:00',l:1,sv:['FOL'],st:'come'},
 {id:'V5',pt:'P5',doc:'D5',cab:'K',br:'E',t:'11:00',l:2,sv:['PRP'],st:'come'},
 {id:'V6',pt:'P6',doc:'D3',cab:'U',br:'E',t:'11:30',l:2,sv:['USG34'],st:'book'},
 {id:'V7',pt:'P3',doc:'D2',cab:'G2',br:'E',t:'13:00',l:2,sv:['INS'],st:'book'},
 {id:'V8',pt:'P4',doc:'D6',cab:'P',br:'E',t:'12:00',l:1,sv:['SMR'],st:'book'},
 {id:'V9',pt:'P2',doc:'D1',cab:'G1',br:'E',t:'15:00',l:1,sv:['CONS'],st:'no'},
 {id:'V10',pt:'P1',doc:'D1',cab:'G1',br:'E',t:'16:00',l:2,sv:['CONS'],st:'book'},
 {id:'V11',pt:'P7',doc:'D4',cab:'G1',br:'S',t:'09:30',l:2,sv:['CONS','SMR'],st:'paid'},
 {id:'V12',pt:'P8',doc:'D7',cab:'U',br:'S',t:'10:00',l:1,sv:['USGM'],st:'come'},
 {id:'V13',pt:'P7',doc:'D4',cab:'G1',br:'S',t:'12:00',l:2,sv:['RVMS','VMS'],st:'book'},
 {id:'V14',pt:'P9',doc:'D8',cab:'G1',br:'B',t:'09:00',l:2,sv:['CONS'],st:'paid'},
 {id:'V15',pt:'P10',doc:'D9',cab:'U',br:'B',t:'10:30',l:2,sv:['USG34'],st:'in'},
 {id:'V16',pt:'P9',doc:'D9',cab:'U',br:'B',t:'14:00',l:1,sv:['USGM'],st:'book'}
];
const vSum=v=>v.sv.reduce((a,k)=>a+SV[k].p,0);
let WO=[{v:'V1',t:'09:52',br:'E',ln:[['VMS',1],['GLV',4],['SPC',2],['NAP',1],['ANT',1]],by:'оплата Kaspi QR'},{v:'V2',t:'10:14',br:'E',ln:[['GEL',1],['NAP',1]],by:'оплата картой'}];
let CASH=[{v:'V1',m:'Kaspi QR',s:44000,t:'09:52'},{v:'V2',m:'Карта',s:18000,t:'10:14'},{v:'V11',m:'Наличные',s:15500,t:'10:31'},{v:'V14',m:'Kaspi QR',s:9000,t:'09:48'}];
let CURV='V3',CURP='P3',PTAB='vis',CH='c1';
const ST={book:['info','записан'],come:['warn','пришёл'],in:['rose','в кабинете'],paid:['ok','оплачен'],no:['bad','не пришёл']};
let MV=[{id:'ПМ-031',sku:'VMS',q:2,from:'E',to:'S',st:'в пути',d:'20.11'},{id:'ПМ-030',sku:'MED',q:2,from:'E',to:'S',st:'принято',d:'18.11'},{id:'ПМ-029',sku:'GLV',q:100,from:'B',to:'S',st:'принято',d:'15.11'}];
let LD=[
 {id:'L1',n:'Асель',src:'Instagram',need:'УЗИ 3D на 26 неделе',st:'new',br:'E'},{id:'L2',n:'Мадина',src:'WhatsApp',need:'Консультация по бесплодию',st:'new',br:'E'},
 {id:'L3',n:'Жанна',src:'2ГИС',need:'Установка спирали',st:'contact',br:'S'},{id:'L4',n:'Ольга',src:'сайт',need:'Плазмолифтинг, цена курса',st:'contact',br:'E'},
 {id:'L5',n:'Дана',src:'WhatsApp',need:'Первичный приём гинеколога',st:'booked',br:'E'},{id:'L6',n:'Айгерим',src:'звонок',need:'УЗИ малого таза',st:'booked',br:'B'},
 {id:'L7',n:'Алия',src:'2ГИС',need:'Программа ВМИ',st:'came',br:'E'},{id:'L8',n:'Сабина',src:'по рекомендации',need:'Курс плазмолифтинга',st:'course',br:'E'},
 {id:'L9',n:'Карина',src:'Instagram',need:'УЗИ 4D',st:'lost',br:'S'}
];
const LST=[['new','Новые'],['contact','Связались'],['booked','Записаны'],['came','Пришли'],['course','Курс / программа'],['lost','Отказ']];
const CHATS={c1:{n:'Мадина · WhatsApp',m:[['c','Здравствуйте! Хотим с мужем на консультацию по бесплодию, есть ли запись на этой неделе?','11:02'],['me','Здравствуйте, Мадина! Репродуктолог Ким Е. В. принимает в филиале Есиль. Есть окно в понедельник в 10:00 и вторник в 15:30.','11:05']]},
 c2:{n:'Асель · Instagram',m:[['c','Сколько стоит УЗИ 3D и можно ли записать видео?','10:41']]},
 c3:{n:'Звонок · +7 705 6** ** 31',m:[['c','Входящий 2:41, запись разговора сохранена. Записана на приём 20.11 в 10:30.','09:12']]}};
let PLAN=[['CONS',1],['USGM',1],['SMR',1],['VMS',1]],PDISC=0;
let PROTO=[['Д2','УЗИ + гормоны (ФСГ, ЛГ, эстрадиол)','done','12.11'],['Д3','Начало стимуляции по схеме врача','done','13.11'],['Д8','Фолликулометрия №1','done','18.11'],['Д10','Фолликулометрия №2','today','20.11'],['Д11','Триггер овуляции','plan','21.11'],['Д12','Внутриматочная инсеминация','plan','22.11'],['Д26','ХГЧ в крови, результат программы','plan','06.12']];
let SHEET=[['Фолиевая кислота 400 мкг','1 раз в день','весь цикл',[1,1,1,1,1,0,0]],['Препарат для стимуляции (по схеме)','подкожно, вечером','Д3–Д10',[1,1,1,1,1,1,0]],['Прогестерон поддержка','после ВМИ','Д13–Д26',[0,0,0,0,0,0,0]]];
let MIG={done:false,mode:'',chk:false};
const MIGI=[['Пациенты (ФИО, дата рождения, теги)',18426],['Телефоны и согласия на рассылку',18104],['Визиты и записи за 4 года',71380],['Оплаты и продажи',69912],['Врачи, кабинеты, прайс услуг',214],['Комментарии и файлы к визитам',9640]];

const SC={};
SC.dash=()=>{const rev={E:0,S:0,B:0},cnt={E:0,S:0,B:0};VIS.forEach(v=>{cnt[v.br]++;if(v.st==='paid')rev[v.br]+=vSum(v)});const low=Object.entries(SK).filter(([k,s])=>Object.values(s.st).some(x=>x<s.min));const exp=Object.values(SK).filter(s=>soon(s.ex));const M={E:[11.8,312,74],S:[7.4,201,61],B:[6.1,176,58]};
 return `<div class="hd"><div><h2>Пульт по трём филиалам</h2><p>Деньги, записи, загрузка кабинетов и склад — сразу по Есилю, Сарыарке и Байконуру. Открывается с телефона.</p></div><div class="btns"><button class="bt" onclick="go('rep')">Отчёты</button><button class="bt p" onclick="go('sched')">Расписание</button></div></div>
 <div class="strip"><div><small>Оплачено сегодня</small><b>${tg(rev.E+rev.S+rev.B)}</b><i>по всем филиалам</i></div><div><small>Записей сегодня</small><b>${VIS.length}</b><i>${VIS.filter(v=>v.st==='no').length} не пришли</i></div><div><small>Выручка ноября</small><b>${mln(25300000)}</b><i>план 31 млн ₸</i></div><div><small>Расходники ниже минимума</small><b style="color:var(--bad)">${low.length}</b><i>${exp.length} позиции со сроком до 3 мес.</i></div></div>
 <div class="pan"><h3>Филиалы <small>ноябрь, на 20.11</small></h3>${tbl(['Филиал','>Выручка','>Визиты','>Средний чек','Загрузка кабинетов','>Сегодня оплачено','>Записей сегодня'],Object.keys(BR).map(b=>`<tr onclick="setB('${b}');go('sched')"><td><b>${BR[b]}</b></td><td class="r">${mln(M[b][0]*1e6)}</td><td class="r">${M[b][1]}</td><td class="r">${tg(M[b][0]*1e6/M[b][1])}</td><td>${bar(M[b][2])}<span class="sm mut">${M[b][2]}%</span></td><td class="r">${tg(rev[b])}</td><td class="r">${cnt[b]}</td></tr>`))}</div>
 <div class="g2"><div class="pan"><h3>Сигналы <small>на что посмотреть</small></h3><div class="pb">
  ${low.map(([k,s])=>`<div style="margin-bottom:6px">${dot('bad','')}<b>${esc(s.n)}</b> — ниже минимума: ${Object.keys(BR).filter(b=>s.st[b]<s.min).map(b=>BR[b]+' '+s.st[b]+' '+s.u).join(', ')}</div>`).join('')}
  ${exp.map(s=>`<div style="margin-bottom:6px">${dot('warn','')}<b>${esc(s.n)}</b> — срок годности до ${s.ex}</div>`).join('')}
  <div>${dot('info','')}${VIS.filter(v=>v.st==='come'||v.st==='in').length} пациента на приёме без оплаты — касса напомнит при выходе</div>
  <div style="margin-top:10px"><button class="bt s" onclick="go('stock')">Склад</button> <button class="bt s" onclick="go('exp')">Сроки</button></div></div></div>
 <div class="pan"><h3>Последние списания расходников <small>автоматически при оплате</small></h3><div class="pb">${WO.slice(0,4).map(w=>{const v=VIS.find(x=>x.id===w.v);return `<div style="margin-bottom:8px"><b>${w.t} · ${BR[w.br]}</b> · ${esc(PT[v.pt].n.split(' ').slice(0,2).join(' '))} — ${v.sv.map(k=>esc(SV[k].n)).join(', ')}<br><span class="sm mut">${w.ln.map(([s,q])=>esc(SK[s].n)+' × '+q).join('; ')}</span></div>`}).join('')}<button class="bt s" onclick="go('cash')">В кассу</button></div></div></div>`};
SC.rep=()=>{const M=[['Июнь',19.2],['Июль',21.0],['Август',22.4],['Сентябрь',24.1],['Октябрь',26.9],['Ноябрь*',25.3]];const mx=27;
 return `<div class="hd"><div><h2>Отчёты по первичке</h2><p>Всё строится из визитов, оплат и списаний — без ручных таблиц. Любой отчёт выгружается в Excel.</p></div><div class="btns"><button class="bt" onclick="xls('Отчёт по филиалам')">Excel</button></div></div>
 <div class="g2"><div class="pan"><h3>Выручка по месяцам <small>млн ₸, все филиалы</small></h3><div class="pb">${M.map(m=>`<div class="pr"><span>${m[0]}</span>${bar(m[1]/mx*100)}<span class="num r">${String(m[1]).replace('.',',')}</span></div>`).join('')}<div class="sm mut">* ноябрь на 20-е число</div></div></div>
 <div class="pan"><h3>Топ услуг ноября</h3>${tbl(['Услуга','>Кол-во','>Выручка','>Расходники'],[['USGM',412],['CONS',388],['USG34',164],['FOL',121],['PRP',58],['VMS',37],['INS',14]].map(([k,n])=>`<tr><td>${esc(SV[k].n)}</td><td class="r">${n}</td><td class="r">${tg(n*SV[k].p)}</td><td class="r">${tg(n*svCost(k))}</td></tr>`))}</div></div>
 <div class="g2"><div class="pan"><h3>По врачам <small>ноябрь</small></h3>${tbl(['Врач','Филиал','>Приёмов','>Выручка'],[['D1',182,3.9],['D3',240,3.4],['D2',96,3.1],['D4',150,2.6],['D8',131,2.2],['D5',58,1.6]].map(([d,n,r])=>`<tr><td>${esc(DOC[d].n)} <span class="sm mut">${DOC[d].sp}</span></td><td>${BR[DOC[d].br]}</td><td class="r">${n}</td><td class="r">${mln(r*1e6)}</td></tr>`))}</div>
 <div class="pan"><h3>Склад: сходится ли расход <small>списано по услугам vs инвентаризация</small></h3>${tbl(['Позиция','Филиал','>По услугам','>По пересчёту','>Разница'],[['VMS','E',12,12,0],['GLV','S',410,452,-42],['GEL','B',190,214,-24],['PRP','E',36,36,0]].map(([k,b,a,f,d])=>`<tr class="${d?'lo':''}"><td>${esc(SK[k].n)}</td><td>${BR[b]}</td><td class="r">${a}</td><td class="r">${f}</td><td class="r">${d?d+' '+SK[k].u:'—'}</td></tr>`))}<div class="pb sm mut">Расхождение — повод проверить, все ли услуги проведены через кассу. Раньше это было не видно совсем.</div></div></div>
 <div class="pan"><h3>Пациенты</h3><div class="pb"><div class="kv"><span>Новых в ноябре</span><b>286</b><span>Повторных визитов</span><b>64%</b><span>Из Instagram</span><b>31%</b><span>Из 2ГИС</span><b>22%</b><span>По рекомендации</span><b>18%</b></div></div></div>`};
SC.pay=()=>{const D=[['D1',3.9],['D2',3.1],['D3',3.4],['D4',2.6],['D5',1.6],['D8',2.2],['D9',1.9],['D7',1.8]];const A=[['Камила','Есиль',182,1,0],['Айдана','Есиль',164,0,2],['Томирис','Сарыарка',140,3,4],['Гульмира','Байконур',121,0,1]];
 return `<div class="hd"><div><h2>Зарплата и дисциплина</h2><p>Врачам — процент от оплаченных услуг, регистратуре — оклад плюс за каждую проведённую оплату. Нарушения считаются сами.</p></div><div class="btns"><button class="bt" onclick="xls('Зарплата ноябрь')">Ведомость в Excel</button><button class="bt p" onclick="toast('Ноябрь закрыт: ведомость зафиксирована, врачи и администраторы видят свои начисления.')">Закрыть месяц</button></div></div>
 <div class="pan"><h3>Врачи <small>ноябрь, на 20.11</small></h3>${tbl(['Врач','Специальность','>Выручка','>%','>Начислено'],D.map(([d,r])=>`<tr><td><b>${esc(DOC[d].n)}</b></td><td>${DOC[d].sp} · ${BR[DOC[d].br]}</td><td class="r">${mln(r*1e6)}</td><td class="r">${DOC[d].pc}%</td><td class="r">${tg(r*1e6*DOC[d].pc/100)}</td></tr>`))}</div>
 <div class="pan"><h3>Регистратура <small>оклад 180 000 ₸ + 250 ₸ за проведённую оплату − 2 000 ₸ за нарушение</small></h3>${tbl(['Администратор','Филиал','>Оплат','>Опозданий','>Незакрытых визитов','>Начислено'],A.map(a=>`<tr class="${a[4]>2?'lo':''}"><td><b>${a[0]}</b></td><td>${a[1]}</td><td class="r">${a[2]}</td><td class="r">${a[3]}</td><td class="r">${a[4]}</td><td class="r">${tg(180000+a[2]*250-(a[3]+a[4])*2000)}</td></tr>`))}<div class="pb sm mut">Незакрытый визит — пациент был, а оплата не проведена: деньги и расходники повисли. Видно, у кого и когда.</div></div>`};

function setB(b){curB=b;build()}
SC.sched=()=>{const times=[];for(let h=9;h<19;h++){times.push(String(h).padStart(2,'0')+':00');times.push(String(h).padStart(2,'0')+':30')}const V=VIS.filter(v=>v.br===curB&&(role!=='Врач'||v.doc==='D1'));
 const cols=role==='Врач'?CAB.filter(c=>c[0]==='G1'):CAB;const dc=c=>Object.keys(DOC).find(d=>DOC[d].br===curB&&DOC[d].cab===c);
 let g=`<div class="sch" style="grid-template-columns:62px repeat(${cols.length},1fr)"><div class="h"></div>${cols.map(c=>`<div class="h">${c[1]}<small>${dc(c[0])?esc(DOC[dc(c[0])].n):'свободен'}</small></div>`).join('')}`;
 times.forEach(t=>{g+=`<div class="tm">${t}</div>`;cols.forEach(c=>{const a=V.find(v=>v.cab===c[0]&&v.t===t);g+=`<div class="c" onclick="newAppt('${c[0]}','${t}')">${a?`<div class="ap s-${a.st}" style="height:${a.l*34-4}px" onclick="event.stopPropagation();apptM('${a.id}')"><b>${esc(PT[a.pt].n.split(' ').slice(0,2).join(' '))}</b>${a.sv.map(k=>esc(SV[k].n)).join(', ')}</div>`:''}</div>`})});g+='</div>';
 return `<div class="hd"><div><h2>Расписание · ${BR[curB]}</h2><p>Та же сетка, к которой привыкла регистратура: кабинеты по столбцам, время по строкам. Клик по пустой клетке — запись, по записи — карточка, статус, оплата.</p></div><div class="btns">${Object.keys(BR).map(b=>`<button class="bt ${b===curB?'p':''}" onclick="setB('${b}')">${BR[b]}</button>`).join('')}</div></div>
 ${said('Его можно сделать, чтоб он был максимально похож на МакДент?','Да: та же логика экранов и привычные действия регистратора, только в ваших цветах и с вашим логотипом. Переход без «ломки».')}
 <div class="leg">${Object.values(ST).map(s=>dot(s[0],s[1])).join('')}</div><div class="tw">${g}</div>`};
function apptM(id){const v=VIS.find(x=>x.id===id);const p=PT[v.pt];openM(esc(p.n),`${v.t} · ${CAB.find(c=>c[0]===v.cab)[1]} · ${esc(DOC[v.doc].n)} · ${BR[v.br]}`,
 `<div class="kv"><span>Телефон</span><b>${p.ph}</b><span>Услуги</span><b>${v.sv.map(k=>esc(SV[k].n)).join(', ')}</b><span>Сумма</span><b>${tg(vSum(v))}</b><span>Статус</span><b>${ST[v.st][1]}</b></div><div class="btns" style="margin-top:12px"><button class="bt" onclick="setVS('${id}','come')">Пришёл</button><button class="bt" onclick="setVS('${id}','in')">В кабинете</button><button class="bt" onclick="closeM();CURP='${v.pt}';go('pat')">Карточка</button>${v.st!=='paid'?`<button class="bt p" onclick="closeM();CURV='${id}';go('cash')">К оплате</button>`:''}</div>`)}
function setVS(id,s){const v=VIS.find(x=>x.id===id);v.st=s;closeM();build();toast(`Статус: <b>${ST[s][1]}</b>. Врач видит пациента в своём списке.`)}
function newAppt(c,t){openM('Новая запись',`${BR[curB]} · ${CAB.find(x=>x[0]===c)[1]} · ${t}`,`<label class="fld"><span>Пациент</span><select class="inp" id="na-p">${Object.keys(PT).map(k=>`<option value="${k}">${esc(PT[k].n)}</option>`).join('')}</select></label><label class="fld"><span>Услуга</span><select class="inp" id="na-s">${Object.keys(SV).map(k=>`<option value="${k}">${esc(SV[k].n)} — ${tg(SV[k].p)}</option>`).join('')}</select></label><button class="bt p" onclick="addAppt('${c}','${t}')">Записать</button>`)}
function addAppt(c,t){const pe=document.getElementById('na-p'),se=document.getElementById('na-s');const p=pe?pe.value:'P4',s=se?se.value:'CONS';const d=Object.keys(DOC).find(x=>DOC[x].br===curB&&DOC[x].cab===c)||'D1';const id='V'+(VIS.length+1);VIS.push({id,pt:p,doc:d,cab:c,br:curB,t,l:1,sv:[s],st:'book'});closeM();build();toast(`Записано: <b>${esc(PT[p].n)}</b>, ${t}. Пациенту ушло напоминание в WhatsApp.`)}

SC.list=()=>`<div class="hd"><div><h2>Пациенты</h2><p>Единая база трёх филиалов: пациентка, пришедшая в Сарыарку, видна в Есиле со всей историей. Поиск по ФИО и телефону.</p></div><div class="btns"><button class="bt" onclick="xls('Пациенты')">Excel</button><button class="bt p" onclick="newPt()">+ Пациент</button></div></div>
 <div class="pan">${tbl(['ФИО','Дата рождения','Телефон','Филиал','Откуда','Метка','>Депозит'],Object.entries(PT).map(([k,p])=>`<tr onclick="CURP='${k}';go('pat')"><td><b>${esc(p.n)}</b></td><td class="num">${p.dob}</td><td class="num">${p.ph}</td><td>${BR[p.br]}</td><td>${p.src}</td><td><span class="chip ${/бесплод/.test(p.tag)?'ro':''}">${p.tag}</span></td><td class="r">${p.dep?tg(p.dep):'—'}</td></tr>`))}</div>
 <div class="note">После переноса здесь будут все 18 426 пациентов из текущей программы — с визитами, оплатами и телефонами.</div>`;
function newPt(){openM('Новый пациент','Карточка создаётся за 20 секунд',`<label class="fld"><span>ФИО</span><input class="inp" value="Абенова Жанель Сериковна"></label><label class="fld"><span>Телефон</span><input class="inp" value="+7 701 000 00 00"></label><button class="bt p" onclick="addPt()">Создать</button>`)}
function addPt(){const id='P'+(Object.keys(PT).length+1);PT[id]={n:'Абенова Жанель Сериковна',dob:'01.01.1995',ph:'+7 701 0** ** 00',br:curB,src:'регистратура',tag:'первичная',dep:0};closeM();CURP=id;go('pat');toast('Пациент создан. Можно сразу записать в расписание.')}

SC.pat=()=>{const p=PT[CURP]||PT.P3;const V=VIS.filter(v=>v.pt===CURP);const H=[['12.11','Ким Е. В.','Консультация репродуктолога','15 000'],['18.11','Сейтказина А. Б.','Фолликулометрия','8 000'],['02.10','Ахметова Г. С.','Приём + мазок','15 500'],['14.08','Ахметова Г. С.','УЗИ малого таза','9 000']];
 const tabs=[['vis','Визиты'],['pay','Оплаты'],['plan','План лечения'],['usg','УЗИ'],['doc','Документы']];
 let body='';
 if(PTAB==='vis')body=tbl(['Дата','Врач','Услуги','>Сумма','Статус'],V.map(v=>`<tr onclick="apptM('${v.id}')"><td>20.11 ${v.t}</td><td>${esc(DOC[v.doc].n)}</td><td>${v.sv.map(k=>esc(SV[k].n)).join(', ')}</td><td class="r">${tg(vSum(v))}</td><td>${dot(ST[v.st][0],ST[v.st][1])}</td></tr>`).concat(H.map(h=>`<tr><td>${h[0]}</td><td>${h[1]}</td><td>${h[2]}</td><td class="r">${h[3]} ₸</td><td>${dot('ok','оплачен')}</td></tr>`)));
 if(PTAB==='pay')body=tbl(['Дата','Способ','>Сумма','Чек'],[['18.11','Kaspi QR','8 000'],['12.11','Карта','15 000'],['12.11','Депозит на программу','120 000'],['02.10','Наличные','15 500']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td class="r">${r[2]} ₸</td><td><button class="bt s" onclick="toast('Чек отправлен пациенту в WhatsApp.')">Отправить</button></td></tr>`))+`<div class="pb sm">Депозит на счёте: <b>${tg(p.dep)}</b> — списывается при оплате услуг программы.</div>`;
 if(PTAB==='plan')body=`<div class="pb">Программа «Стимуляция + ВМИ», цикл 1. Сейчас — <b>Д10</b>. <button class="bt s" onclick="go('proto')">Открыть программу</button> <button class="bt s" onclick="go('plan')">План и КП</button></div>`;
 if(PTAB==='usg')body=`<div class="pb">18.11 · Фолликулометрия: доминантный фолликул 14 мм справа, эндометрий 7,8 мм.<br>12.11 · УЗИ малого таза Д2: без патологии, АФК 9.<br><button class="bt s" onclick="go('usg')">Все протоколы УЗИ</button></div>`;
 if(PTAB==='doc')body=`<div class="pb">Информированное согласие на ВМИ — подписано 12.11<br>Договор на программу — подписан 12.11<br>Результаты анализов (3 файла)<br><button class="bt s" onclick="toast('Файл прикреплён к карточке.')">+ Файл</button></div>`;
 return `<div class="hd"><div><h2>Карточка пациента</h2><p>Всё о пациентке на одном экране: визиты во всех филиалах, оплаты, план лечения, УЗИ, документы.</p></div><div class="btns"><button class="bt" onclick="go('list')">Все пациенты</button><button class="bt p" onclick="newAppt('G2','17:00')">Записать</button></div></div>
 <div class="pt"><div class="pcard"><div class="pav">${p.n.split(' ').slice(0,2).map(x=>x[0]).join('')}</div><b>${esc(p.n)}</b><div class="sm mut" style="margin:4px 0 10px">${p.dob} · ${p.ph}</div><div class="kv" style="grid-template-columns:90px 1fr"><span>Филиал</span><b>${BR[p.br]}</b><span>Откуда</span><b>${p.src}</b><span>Метка</span><b>${p.tag}</b><span>Депозит</span><b>${p.dep?tg(p.dep):'—'}</b></div>
 <div class="btns" style="margin-top:12px"><button class="bt s" onclick="CH='c1';go('inbox')">WhatsApp</button><button class="bt s" onclick="toast('Звонок через IP-телефонию, запись разговора сохранится в карточке.')">Позвонить</button></div></div>
 <div class="pan" style="margin:0"><div class="ptabs">${tabs.map(t=>`<div class="ptab ${t[0]===PTAB?'on':''}" onclick="PTAB='${t[0]}';build()">${t[1]}</div>`).join('')}</div>${body}</div></div>`};

SC.cash=()=>{const V=VIS.filter(v=>v.br===curB).sort((a,b)=>a.t<b.t?-1:1);const v=VIS.find(x=>x.id===CURV)||V[0];const by={};CASH.forEach(c=>{const vv=VIS.find(x=>x.id===c.v);if(vv&&vv.br===curB)by[c.m]=(by[c.m]||0)+c.s});
 return `<div class="hd"><div><h2>Касса и оплаты · ${BR[curB]}</h2><p>Оплата проводится по визиту. В этот момент со склада филиала сами списываются расходники, привязанные к услугам.</p></div><div class="btns">${Object.keys(BR).map(b=>`<button class="bt ${b===curB?'p':''}" onclick="setB('${b}')">${BR[b]}</button>`).join('')}</div></div>
 ${said('Установка ВМС — можем привязать к процедуре склад, чтобы мы проводили продажу?','Да. Оплатили «Установку ВМС» — спираль, перчатки, зеркало, салфетка и антисептик списались со склада именно этого филиала.')}
 <div class="g21"><div class="pan"><h3>Визиты сегодня</h3>${tbl(['Время','Пациент','Услуги','>Сумма','Статус',''],V.map(x=>`<tr onclick="CURV='${x.id}';build()" style="${x.id===(v&&v.id)?'outline:2px solid var(--acc)':''}"><td class="num">${x.t}</td><td>${esc(PT[x.pt].n.split(' ').slice(0,2).join(' '))}</td><td>${x.sv.map(k=>esc(SV[k].n)).join(', ')}</td><td class="r">${tg(vSum(x))}</td><td>${dot(ST[x.st][0],ST[x.st][1])}</td><td>${x.st!=='paid'&&x.st!=='no'?`<button class="bt s p" onclick="event.stopPropagation();payM('${x.id}')">Оплатить</button>`:''}</td></tr>`))}</div>
 <div><div class="pan"><h3>Что спишется со склада <small>${v?esc(PT[v.pt].n.split(' ')[0]):''}</small></h3><div class="pb">${v?`<div class="wo"><b>${v.sv.map(k=>esc(SV[k].n)).join(' + ')}</b><ul>${woLines(v).map(([s,q])=>`<li>${esc(SK[s].n)} × ${q} ${SK[s].u} <span class="mut">(остаток ${BR[v.br]}: ${SK[s].st[v.br]})</span></li>`).join('')}</ul>${v.st==='paid'?`<div class="sm" style="color:var(--ok)">Уже списано при оплате.</div>`:`<button class="bt r s" onclick="payM('${v.id}')">Оплатить и списать</button>`}</div>`:''}</div></div>
 <div class="pan"><h3>Смена</h3><div class="pb kv">${['Kaspi QR','Карта','Наличные'].map(m=>`<span>${m}</span><b>${tg(by[m]||0)}</b>`).join('')}<span>Итого</span><b>${tg(Object.values(by).reduce((a,b)=>a+b,0))}</b></div></div></div></div>
 <div class="pan"><h3>Журнал списаний <small>кто, когда, по какому визиту</small></h3>${tbl(['Время','Филиал','Визит','Списано','Основание'],WO.map(w=>`<tr><td class="num">${w.t}</td><td>${BR[w.br]}</td><td>${esc(PT[VIS.find(x=>x.id===w.v).pt].n.split(' ')[0])}</td><td class="sm">${w.ln.map(([s,q])=>esc(SK[s].n)+' × '+q).join('; ')}</td><td>${w.by}</td></tr>`))}</div>`};
function woLines(v){const m={};v.sv.forEach(k=>SV[k].it.forEach(([s,q])=>m[s]=(m[s]||0)+q));return Object.entries(m)}
function payM(id){const v=VIS.find(x=>x.id===id);openM('Оплата визита',`${esc(PT[v.pt].n)} · ${tg(vSum(v))}`,`<div class="btns">${['Kaspi QR','Карта','Наличные'].map(m=>`<button class="bt p" onclick="pay('${id}','${m}')">${m}</button>`).join('')}</div><div class="wo" style="margin-top:12px">Со склада «${BR[v.br]}» спишется: <ul>${woLines(v).map(([s,q])=>`<li>${esc(SK[s].n)} × ${q}</li>`).join('')}</ul></div>`)}
function pay(id,m){const v=VIS.find(x=>x.id===id);if(!v||v.st==='paid'){closeM();return}m=m||'Kaspi QR';const ln=woLines(v);ln.forEach(([s,q])=>SK[s].st[v.br]-=q);v.st='paid';WO.unshift({v:id,t:'11:'+String(10+WO.length).padStart(2,'0'),br:v.br,ln,by:'оплата '+m});CASH.push({v:id,m,s:vSum(v)});CURV=id;closeM();build();
 const low=ln.filter(([s])=>SK[s].st[v.br]<SK[s].min);toast(`Оплачено <b>${tg(vSum(v))}</b> (${m}). Со склада ${BR[v.br]} списано: ${ln.map(([s,q])=>esc(SK[s].n.split(',')[0])+' × '+q).join(', ')}.${low.length?' <b>Ниже минимума: '+low.map(([s])=>esc(SK[s].n.split(' ')[0])).join(', ')+' — заявка на закуп создана.</b>':''}`)}

SC.plan=()=>{const sum=PLAN.reduce((a,[k,q])=>a+SV[k].p*q,0);const tot=sum*(1-PDISC/100);
 return `<div class="hd"><div><h2>План лечения и КП пациенту</h2><p>Врач собирает план из прайса прямо на приёме — пациентка сразу получает его в WhatsApp и в личном кабинете, регистратура видит, что записать.</p></div><div class="btns"><button class="bt" onclick="addPl()">+ Услуга</button><button class="bt p" onclick="sendPlan()">Отправить пациенту</button></div></div>
 <div class="g21"><div class="pan"><h3>План · ${esc(PT.P4.n)} <small>врач Ахметова Г. С.</small></h3>${tbl(['Услуга','>Кол-во','>Цена','>Сумма',''],PLAN.map(([k,q],i)=>`<tr><td>${esc(SV[k].n)}</td><td class="r">${q}</td><td class="r">${tg(SV[k].p)}</td><td class="r">${tg(SV[k].p*q)}</td><td><button class="bt s" onclick="PLAN.splice(${i},1);build()">убрать</button></td></tr>`))}
 <div class="pb kv"><span>Итого</span><b>${tg(sum)}</b><span>Скидка</span><b><button class="bt s" onclick="PDISC=PDISC?0:10;build()">${PDISC?'10% — убрать':'дать 10%'}</button></b><span>К оплате</span><b style="font-size:17px">${tg(tot)}</b></div></div>
 <div class="pan"><h3>Как это увидит пациентка</h3><div class="pb"><div class="phone"><h4>Мейрим · ваш план</h4>${PLAN.map(([k])=>`<div class="pi"><b>${esc(SV[k].n)}</b>${tg(SV[k].p)}</div>`).join('')}<div class="pi" style="background:var(--accl)"><b>Итого ${tg(tot)}</b>Можно оплатить частями по визитам</div><button class="bt p s" onclick="toast('Пациентка подтвердила план — регистратура получила задачу записать её.')">Согласна, записаться</button></div></div></div></div>`};
function addPl(){const ks=Object.keys(SV).filter(k=>!PLAN.some(p=>p[0]===k));if(ks.length)PLAN.push([ks[0],1]);build();toast('Услуга добавлена в план.')}
function sendPlan(){toast('План лечения отправлен в WhatsApp и появился в личном кабинете пациентки.')}
SC.proto=()=>`<div class="hd"><div><h2>Программы лечения бесплодия</h2><p>Протокол разбит на дни цикла: что сделать, когда, кто ответственный. Регистратура видит, когда записать пациентку, врач — что уже сделано.</p></div><div class="btns"><button class="bt" onclick="toast('Шаблон программы сохранён — следующей пациентке протокол создаётся в один клик.')">Сохранить как шаблон</button></div></div>
 <div class="g21"><div class="pan"><h3>${esc(PT.P3.n)} · «Стимуляция + ВМИ», цикл 1 <small>репродуктолог Ким Е. В.</small></h3>${tbl(['День','Этап','Дата','Статус',''],PROTO.map((r,i)=>`<tr><td class="num"><b>${r[0]}</b></td><td>${r[1]}</td><td class="num">${r[3]}</td><td>${r[2]==='done'?dot('ok','сделано'):r[2]==='today'?dot('rose','сегодня'):dot('info','по плану')}</td><td>${r[2]!=='done'?`<button class="bt s" onclick="protoDone(${i})">Отметить</button>`:''}</td></tr>`))}</div>
 <div class="pan"><h3>Деньги по программе</h3><div class="pb kv"><span>Стоимость программы</span><b>${tg(185000)}</b><span>Внесён депозит</span><b>${tg(120000)}</b><span>Оплачено услугами</span><b>${tg(23000)}</b><span>Остаток к оплате</span><b>${tg(42000)}</b></div><div class="pb sm mut">Расходники программы (катетер, среда) списываются при оплате инсеминации — видно себестоимость каждой программы.</div></div></div>`;
function protoDone(i){PROTO[i][2]='done';build();toast(`Этап «${esc(PROTO[i][1])}» отмечен. Пациентке ушло сообщение о следующем шаге.`)}
SC.usg=()=>`<div class="hd"><div><h2>УЗИ-протоколы</h2><p>Шаблоны заключений для 3D/4D, малого таза, фолликулометрии. Готовое заключение с фото уходит пациентке в кабинет и в WhatsApp.</p></div><div class="btns"><button class="bt p" onclick="usgNew()">+ Протокол</button></div></div>
 <div class="pan">${tbl(['Дата','Пациент','Исследование','Врач','Заключение',''],[['20.11','P1','УЗИ плода 3D/4D, 24 нед.','D3','Один живой плод, размеры соответствуют сроку, видео 4D записано'],['18.11','P3','Фолликулометрия','D3','Доминантный фолликул 14 мм справа, эндометрий 7,8 мм'],['20.11','P10','УЗИ плода 3D/4D, 30 нед.','D9','Без особенностей, предлежание головное'],['19.11','P8','УЗИ щитовидной железы','D7','Узловых образований не выявлено']].map(r=>`<tr><td class="num">${r[0]}</td><td>${esc(PT[r[1]].n.split(' ').slice(0,2).join(' '))}</td><td>${r[2]}</td><td>${esc(DOC[r[3]].n)}</td><td class="sm">${r[4]}</td><td><button class="bt s" onclick="toast('Заключение с фото отправлено пациентке.')">Отправить</button></td></tr>`))}</div>
 <div class="note">Шаблон подставляет нормы по сроку беременности и дню цикла — врач правит только отклонения.</div>`;
function usgNew(){openM('Новый УЗИ-протокол','Шаблон: фолликулометрия',`<label class="fld"><span>Доминантный фолликул, мм</span><input class="inp" value="17"></label><label class="fld"><span>Эндометрий, мм</span><input class="inp" value="8,6"></label><button class="bt p" onclick="closeM();toast('Протокол сохранён в карточке и отправлен пациентке.')">Сохранить</button>`)}
SC.sheet=()=>`<div class="hd"><div><h2>Лечебные листы</h2><p>Назначения по дням: что принимать, когда, отметки о выполнении. Пациентка видит лист у себя в кабинете с напоминаниями.</p></div><div class="btns"><button class="bt" onclick="toast('Лист распечатан.')">Печать</button></div></div>
 <div class="pan"><h3>${esc(PT.P3.n)} · неделя 16–22.11</h3>${tbl(['Назначение','Как','Период','пн','вт','ср','чт','пт','сб','вс'],SHEET.map((r,i)=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td>${r[3].map((x,j)=>`<td><button class="bt s" onclick="SHEET[${i}][3][${j}]=SHEET[${i}][3][${j}]?0:1;build()">${x?'✓':'·'}</button></td>`).join('')}</tr>`))}</div>
 <div class="note">Отметки ставит пациентка в кабинете или медсестра на приёме. Пропуск — напоминание врачу.</div>`;

SC.stock=()=>`<div class="hd"><div><h2>Остатки трёх филиалов</h2><p>Каждый филиал — свой склад. Расход идёт автоматически по оплаченным услугам, приход — по накладной. Ниже минимума подсвечено.</p></div><div class="btns"><button class="bt" onclick="xls('Остатки')">Excel</button><button class="bt p" onclick="arrM()">+ Приход</button></div></div>
 ${said('Они вообще не ведут учёт расхода, не ведут учёт склада общего.','Теперь каждая спираль и каждая пара перчаток учтены: сколько пришло, на какую услугу ушло, сколько осталось в каждом филиале.')}
 <div class="pan">${tbl(['Позиция','Ед.','>Есиль','>Сарыарка','>Байконур','>Мин.','>Цена','Срок'],Object.entries(SK).map(([k,s])=>`<tr class="${Object.values(s.st).some(x=>x<s.min)?'lo':''}"><td><b>${esc(s.n)}</b></td><td>${s.u}</td>${['E','S','B'].map(b=>`<td class="r" style="${s.st[b]<s.min?'color:var(--bad);font-weight:700':''}">${s.st[b]}</td>`).join('')}<td class="r">${s.min}</td><td class="r">${tg(s.c)}</td><td class="num ${soon(s.ex)?'':'mut'}" style="${soon(s.ex)?'color:var(--warn);font-weight:700':''}">${s.ex}</td></tr>`))}</div>`;
function arrM(){openM('Приход по накладной','Поставщик: ТОО «МедСнаб» (вымышл.)',`<label class="fld"><span>Филиал</span><select class="inp" id="ar-b">${Object.keys(BR).map(b=>`<option value="${b}">${BR[b]}</option>`).join('')}</select></label><label class="fld"><span>Позиция</span><select class="inp" id="ar-s">${Object.keys(SK).map(k=>`<option value="${k}">${esc(SK[k].n)}</option>`).join('')}</select></label><label class="fld"><span>Количество</span><input class="inp" id="ar-q" value="10"></label><button class="bt p" onclick="arrive()">Оприходовать</button>`)}
function arrive(){const b=(document.getElementById('ar-b')||{}).value||'S',s=(document.getElementById('ar-s')||{}).value||'VMS',q=parseInt((document.getElementById('ar-q')||{}).value)||10;SK[s].st[b]+=q;closeM();build();toast(`Приход: ${esc(SK[s].n)} × ${q} на склад «${BR[b]}».`)}
SC.link=()=>`<div class="hd"><div><h2>Услуги ↔ расходники</h2><p>Один раз указываем, что уходит на каждую услугу. Дальше списание при оплате автоматическое — и видна себестоимость и маржа каждой услуги.</p></div></div>
 <div class="pan">${tbl(['Услуга','>Цена','Расходники на 1 услугу','>Себестоимость','>Маржа',''],Object.entries(SV).map(([k,s])=>`<tr><td><b>${esc(s.n)}</b></td><td class="r">${tg(s.p)}</td><td>${s.it.map(([x,q])=>`<span class="chip ${k==='VMS'&&x==='VMS'?'ro':''}">${esc(SK[x].n.split(',')[0])} × ${q}</span>`).join('')}</td><td class="r">${tg(svCost(k))}</td><td class="r">${pct(s.p-svCost(k),s.p)}%</td><td><button class="bt s" onclick="linkM('${k}')">Изменить</button></td></tr>`))}</div>`;
function linkM(k){openM(esc(SV[k].n),'Расходники на одну услугу',SV[k].it.map(([x,q])=>`<label class="fld"><span>${esc(SK[x].n)}</span><input class="inp" value="${q}"></label>`).join('')+`<button class="bt p" onclick="closeM();toast('Состав услуги сохранён. Со следующей оплаты списание по новому составу.')">Сохранить</button>`)}
SC.move=()=>`<div class="hd"><div><h2>Перемещения между филиалами</h2><p>Закончились спирали в Сарыарке — перекидываем из Есиля. Отправил один склад, принял другой — остатки обоих сразу правильные.</p></div><div class="btns"><button class="bt p" onclick="newMove()">+ Перемещение</button></div></div>
 <div class="pan">${tbl(['№','Позиция','>Кол-во','Откуда','Куда','Дата','Статус',''],MV.map(m=>`<tr><td class="num">${m.id}</td><td>${esc(SK[m.sku].n)}</td><td class="r">${m.q}</td><td>${BR[m.from]}</td><td>${BR[m.to]}</td><td class="num">${m.d}</td><td>${m.st==='принято'?dot('ok','принято'):dot('warn','в пути')}</td><td>${m.st!=='принято'?`<button class="bt s" onclick="accMove('${m.id}')">Принять</button>`:''}</td></tr>`))}</div>
 <div class="note">Система сама подсказывает перемещение: в Сарыарке среды для обработки 0 при минимуме 3, а в Есиле 4.</div>`;
function newMove(){const id='ПМ-0'+(32+MV.length-3);MV.unshift({id,sku:'MED',q:1,from:'E',to:'S',st:'в пути',d:'20.11'});SK.MED.st.E-=1;build();toast(`Перемещение <b>${id}</b>: среда для обработки × 1, Есиль → Сарыарка.`)}
function accMove(id){const m=MV.find(x=>x.id===id);if(m.st==='принято')return;m.st='принято';SK[m.sku].st[m.to]+=m.q;build();toast(`${id} принято в филиале ${BR[m.to]}. Остаток обновлён.`)}
SC.exp=()=>{const L=Object.entries(SK).filter(([k,s])=>s.ex!=='—').sort((a,b)=>{const f=x=>x[1].ex.split('.').reverse().join('');return f(a)<f(b)?-1:1});
 return `<div class="hd"><div><h2>Сроки годности</h2><p>Что скоро истечёт — видно заранее, пока можно использовать или переместить туда, где расходуется быстрее.</p></div></div>
 <div class="pan">${tbl(['Позиция','Срок','Есиль','Сарыарка','Байконур','>Сумма в товаре',''],L.map(([k,s])=>`<tr class="${soon(s.ex)?'lo':''}"><td><b>${esc(s.n)}</b></td><td class="num">${s.ex}</td><td>${s.st.E}</td><td>${s.st.S}</td><td>${s.st.B}</td><td class="r">${tg((s.st.E+s.st.S+s.st.B)*s.c)}</td><td>${soon(s.ex)?`<button class="bt s" onclick="toast('Задача старшей медсестре: использовать в первую очередь, оповещены врачи филиалов.')">В работу</button>`:''}</td></tr>`))}</div>
 <div class="note">Раньше просрочка обнаруживалась при случайной проверке. Теперь — сигнал за три месяца на пульте руководителя.</div>`};

SC.funnel=()=>`<div class="hd"><div><h2>Заявки и воронка</h2><p>Instagram, WhatsApp, 2ГИС, сайт и звонки — в одном месте. Видно, кто записался, кто пришёл, кто ушёл и почему.</p></div><div class="btns"><button class="bt p" onclick="newLead()">+ Заявка</button></div></div>
 <div class="fn">${LST.map(s=>`<div class="fc"><h4>${s[1]}<span class="num">${LD.filter(l=>l.st===s[0]).length}</span></h4>${LD.filter(l=>l.st===s[0]).map(l=>`<div class="pc" onclick="leadM('${l.id}')"><b>${esc(l.n)}</b>${esc(l.need)}<br><small>${l.src} · ${BR[l.br]}</small></div>`).join('')}</div>`).join('')}</div>
 <div class="note" style="margin-top:12px">Конверсия ноября: заявка → запись 58%, запись → визит 87%. Причины отказов: цена (41%), далеко (23%), не дозвонились (19%).</div>`;
function leadM(id){const l=LD.find(x=>x.id===id);openM(esc(l.n),`${l.src} · ${BR[l.br]}`,`<div style="margin-bottom:10px">${esc(l.need)}</div><div class="btns">${LST.map(s=>`<button class="bt s ${s[0]===l.st?'p':''}" onclick="mvLead('${id}','${s[0]}')">${s[1]}</button>`).join('')}</div>`)}
function mvLead(id,s){LD.find(x=>x.id===id).st=s;closeM();build();toast('Заявка перемещена. Если «Записаны» — визит появится в расписании.')}
function newLead(){LD.unshift({id:'L'+(LD.length+1),n:'Новая заявка',src:'WhatsApp',need:'Узнать цену УЗИ 3D',st:'new',br:curB});build();toast('Заявка создана, ответственный — администратор филиала.')}
SC.inbox=()=>{const c=CHATS[CH];return `<div class="hd"><div><h2>WhatsApp и звонки</h2><p>Переписки и записи разговоров привязаны к пациенту. Отвечает тот администратор, кто свободен; руководитель видит время ответа.</p></div></div>
 <div class="chat"><div class="cl">${Object.entries(CHATS).map(([k,x])=>`<div class="ci ${k===CH?'on':''}" onclick="CH='${k}';build()"><b>${esc(x.n)}</b><small>${esc(x.m[x.m.length-1][1]).slice(0,48)}…</small></div>`).join('')}</div>
 <div class="cm"><div class="msgs">${c.m.map(m=>`<div class="m ${m[0]==='me'?'me':''}">${esc(m[1])}<small>${m[2]}</small></div>`).join('')}</div><div class="cin"><input class="inp" id="msgi" value="Записала вас на понедельник, 10:00. Напоминание придёт за день."><button class="bt p" onclick="sendMsg()">Отправить</button></div></div></div>
 <div class="note" style="margin-top:12px">Шаблоны ответов: цены, подготовка к УЗИ, адреса филиалов. Среднее время ответа в ноябре — 6 минут.</div>`};
function sendMsg(){const i=document.getElementById('msgi');CHATS[CH].m.push(['me',(i&&i.value)||'Спасибо!','сейчас']);build();toast('Сообщение отправлено в WhatsApp.')}

SC.migr=()=>`<div class="hd"><div><h2>Перенос из МакДент</h2><p>Пациенты, визиты, продажи и номера телефонов переносятся полностью — ничего не теряется. Старая программа работает до дня переключения.</p></div><div class="btns"><button class="bt" onclick="migr('parse')">Запасной путь: выгрузка с экранов</button><button class="bt p" onclick="migr('api')">Перенести по API</button></div></div>
 ${said('А мы сможем принести данные с МакДента? Продажи, пациенты, номера — чтобы ничего не потерялось?','Два пути. Официальный — запрос доступа к API, перенос около 5 часов. Если откажут — забираем данные через ваш логин с экранов программы.')}
 <div class="pan"><h3>Что переносим <small>${MIG.done?(MIG.mode==='api'?'перенесено по API':'перенесено выгрузкой'):'ожидает запуска'}</small></h3><div class="pb">${MIGI.map(m=>`<div class="pr"><span>${m[0]}</span>${bar(MIG.done?100:0)}<span class="num">${MIG.done?fmt(m[1]):'0'}</span></div>`).join('')}</div></div>
 <div class="pan"><h3>Сверка после переноса</h3><div class="pb">${MIG.chk?tbl(['Показатель','>В старой программе','>В новой','Итог'],[['Пациентов',18426,18426],['Выручка за 2025 г., ₸',241380500,241380500],['Визитов за октябрь',6214,6214]].map(r=>`<tr><td>${r[0]}</td><td class="r">${fmt(r[1])}</td><td class="r">${fmt(r[2])}</td><td>${dot('ok','совпало')}</td></tr>`)):`<span class="mut">Сверка запускается после переноса: количество пациентов, выручка по годам, визиты по месяцам.</span> `}<div style="margin-top:8px"><button class="bt s" onclick="migChk()">Сверить</button></div></div></div>`;
function migr(m){MIG.done=true;MIG.mode=m;build();toast(m==='api'?'Перенос по API завершён: 18 426 пациентов, 71 380 визитов, 69 912 оплат.':'Выгрузка с экранов завершена — данные те же, путь медленнее (1–2 дня).')}
function migChk(){if(!MIG.done){toast('Сначала запустите перенос.');return}MIG.chk=true;build();toast('Сверка пройдена: цифры совпали.')}
SC.cab=()=>`<div class="hd"><div><h2>Кабинет пациента</h2><p>Ссылка приходит в WhatsApp, без установки приложения: запись, план лечения, результаты УЗИ, лечебный лист и оплата.</p></div></div>
 <div class="g2"><div class="pan"><div class="pb"><div class="phone"><h4>Мейрим · Айжан</h4><div class="pi"><b>Следующий визит</b>Пн, 23.11, 16:00 · Ахметова Г. С. · Есиль<br><button class="bt s" onclick="toast('Визит подтверждён — регистратура видит отметку.')">Подтвердить</button> <button class="bt s" onclick="toast('Запрос на перенос отправлен администратору.')">Перенести</button></div><div class="pi"><b>УЗИ 3D/4D от 20.11</b>Заключение и видео 4D <button class="bt s" onclick="toast('Видео открыто.')">Смотреть</button></div><div class="pi"><b>Записаться</b><button class="bt s" onclick="toast('Онлайн-запись: выбор филиала, врача и свободного окна.')">Выбрать время</button></div><div class="pi"><b>Оплата</b>Kaspi по ссылке <button class="bt s" onclick="toast('Счёт Kaspi отправлен.')">Оплатить</button></div></div></div></div>
 <div class="pan"><h3>Что это даёт клинике</h3><div class="pb"><ul style="margin-left:18px"><li>Меньше «не пришёл» — подтверждение визита за день.</li><li>Регистратура не пересылает результаты вручную.</li><li>Пациентки программ видят свой протокол и лист назначений.</li><li>Онлайн-запись в свободные окна без звонка.</li></ul><p class="sm mut" style="margin-top:10px">Это веб-кабинет внутри системы. Отдельное мобильное приложение и сайт в пакет не входят.</p></div></div></div>`;
SC.acc=()=>`<div class="hd"><div><h2>Доступы и роли</h2><p>Каждый сотрудник входит по своему логину и видит только своё. Запас по нагрузке — до 50 одновременных пользователей при 6–7 медрегистраторах.</p></div><div class="btns"><button class="bt p" onclick="toast('Сотрудник добавлен, логин отправлен в WhatsApp.')">+ Сотрудник</button></div></div>
 <div class="pan">${tbl(['Роль','Кто','Расписание','Касса','Карточки','Склад','Зарплаты','Отчёты'],[['Собственник','Меруерт',1,1,1,1,1,1],['Управляющая','Валерия',1,1,1,1,1,1],['Медрегистратор','6–7 чел., по филиалам',1,1,1,0,0,0],['Врач','своё расписание',1,0,1,0,0,0],['Склад','старшая медсестра',0,0,0,1,0,0]].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td>${r.slice(2).map(x=>`<td>${x?dot('ok','да'):dot('','—')}</td>`).join('')}</tr>`))}</div>
 <div class="note">Журнал действий: кто открыл карточку, кто отменил оплату, кто правил остаток. Удалённое восстанавливается.</div>`;
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Своя программа вместо подписки: один раз разрабатываем, передаём код, ключи и документацию.</p></div></div>
 <div class="g2"><div class="pan"><h3>Пакет разработки</h3><div class="pb kv"><span>Стоимость</span><b style="font-size:18px">2 500 000 ₸</b><span>Срок</span><b>4–6 недель (ориентир месяц + 2 недели запаса)</b><span>Этап 1 · 30%</span><b>750 000 ₸ — старт, утверждаем экраны</b><span>Этап 2 · 40%</span><b>1 000 000 ₸ — рабочая система развёрнута</b><span>Этап 3 · 30%</span><b>750 000 ₸ — полировка, перенос, передача</b><span>Сопровождение</span><b>3 месяца включены, далее 20 $/час</b></div></div>
 <div class="pan"><h3>Сравнение с подпиской <small>оценка</small></h3>${tbl(['Период','>Подписка ≈200 тыс./мес','>Своя система'],[['12 месяцев',2400000,2500000],['24 месяца',4800000,2500000],['36 месяцев',7200000,2500000]].map(r=>`<tr><td>${r[0]}</td><td class="r">${tg(r[1])}</td><td class="r">${tg(r[2])}</td></tr>`))}<div class="pb sm mut">Сервер оплачивается провайдеру напрямую (обычно 15–30 тыс. ₸/мес). Дальнейшие доработки — по часам, обычно до 10 часов в год.</div></div></div>`;

const TOUR=[['dash','1 · Пульт: три филиала, деньги и сигналы склада.'],['sched','2 · Привычная сетка расписания по кабинетам.'],['cash','3 · Оплата → расходники списались со склада филиала.'],['link','4 · Состав расходников по каждой услуге.'],['stock','5 · Остатки трёх филиалов и минимумы.'],['proto','6 · Программа бесплодия по дням цикла.'],['plan','7 · План лечения сразу пациентке.'],['migr','8 · Перенос всех данных из МакДент.'],['launch','9 · Стоимость и этапы.']];

function xls(n){toast(`Файл «${esc(n)}» выгружен в Excel.`)}
function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${v.av}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');document.getElementById('rsel').innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');document.getElementById('rsel').value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;document.getElementById('rsel').value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){const lowN=Object.values(SK).filter(s=>Object.values(s.st).some(x=>x<s.min)).length;
 document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<div class="sg">${s.n}</div>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="ri ${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${ic(s.k)}${x[1]}${x[0]==='stock'&&lowN?`<span class="cnt">${lowN}</span>`:''}</a>`).join('')).join('');
 document.getElementById('btabs').innerHTML=Object.keys(BR).map(b=>`<button class="bt-b ${b===curB?'on':''}" onclick="setB('${b}')">${BR[b]}</button>`).join('');
 document.getElementById('shint').textContent=(SEC.find(s=>s.k===SECOF[cur])||{n:''}).n.toUpperCase()+' · '+role+' · '+ROLES[role].n}
function build(){if(!allowed(cur))cur=ROLES[role].s[0];buildRail();document.getElementById('ttl').textContent=SUBN[cur];document.getElementById('content').innerHTML=SC[cur]();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль вверху.');return}cur=k;build();window.scrollTo(0,0)}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6000)}
let ti=-1,tRun=false;function tour(){if(tRun){tRun=false;return}tRun=true;ti=-1;step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){tRun=false;toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Собственник');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false}
(function(){renderRoles();document.getElementById('rsel').addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();tRun=false}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
