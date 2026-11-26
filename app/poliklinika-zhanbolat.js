/* ШИПАГЕР — поликлиника (госзаказ + платно) и 7 аптек (Жанболат). Демо на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(Math.round(n/100000)/10).toString().replace('.',',')+' млн ₸';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const bar=(w,c)=>`<div class="bar ${c||''}"><i style="width:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const tbl=(h,rows)=>`<div class="tw"><table class="t"><thead><tr>${h.map(x=>`<th${x[0]==='>'?' class="r"':''}>${x.replace(/^>/,'')}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
const dot=(c,t)=>`<span class="st"><span class="dot d-${c}"></span>${t}</span>`;
const FL=f=>f==='g'?'<span class="flow f-g">ГОБМП/ОСМС</span>':'<span class="flow f-p">ПЛАТНО</span>';
const say=t=>`<div class="say">${t}</div>`;

const SEC=[
 {k:'own',n:'Собственнику',sub:[['dash','Главное за месяц'],['flows','Госзаказ и платно'],['mkt','Реклама и заявки'],['pay','Зарплата и KPI']]},
 {k:'sale',n:'Продажи',sub:[['funnel','Воронка платных'],['inbox','WhatsApp'],['calls','Звонки и записи']]},
 {k:'reg',n:'Регистратура',sub:[['sched','Запись к врачам'],['pat','Карточка пациента'],['cash','Касса'],['price','Прайс платных услуг']]},
 {k:'doc',n:'Врачу',sub:[['myday','Мой приём сегодня']]},
 {k:'ph',n:'Аптеки и склад',sub:[['phd','Остатки по аптекам'],['wcard','Карточка товара'],['in','Приход'],['out','Расход и списания'],['move','Перемещения'],['inv','Инвентаризация'],['exp','Сроки годности'],['order','Автозаказ и закуп'],['pos','Касса аптеки'],['jrn','Журнал движений'],['abc','Отчёты склада']]},
 {k:'sys',n:'Система',sub:[['gov','Гос. системы не трогаем'],['acc','Роли и доступы'],['launch','Стоимость и запуск']]}
];
const SECOF={},SUBN={},ALL=[];SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1];ALL.push(x[0])}));
const ROLES={
 'Собственник':{av:'СБ',n:'Жанболат',note:'всё: деньги, реклама, аптеки, зарплаты',s:ALL.slice()},
 'Продажник':{av:'ПР',n:'Айгерим',note:'заявки, звонки, WhatsApp, запись в платные слоты',s:['funnel','inbox','calls','sched','pat','price']},
 'Регистратура':{av:'РГ',n:'Гульмира, касса',note:'запись, карточка, касса; деньги клиники целиком не видит',s:['sched','pat','cash','price','calls']},
 'Врач':{av:'ВР',n:'Касымов Е. Б., кардиолог',note:'свой приём, метка потока, направление на платные услуги',s:['myday','sched','pat','price']},
 'Аптека':{av:'АП',n:'Сауле, зав. аптекой №3 · Ынтымак',note:'своя аптека: приход, касса, списания, инвентаризация, заявка в центр',s:['phd','wcard','in','out','move','inv','exp','order','pos','jrn']},
 'Центральный склад':{av:'ЦС',n:'Ерлан, закуп и центральный склад',note:'все 7 аптек и центр: приход, отгрузки, перемещения, закуп, отчёты',s:['phd','wcard','in','out','move','inv','exp','order','jrn','abc']}
};
let role='Собственник',cur='dash';

/* ===== поликлиника ===== */
const DOC={
 D1:{n:'Абдиева С. Т.',sp:'терапевт',cab:'101',pc:30,ph:'15:00–17:00'},
 D2:{n:'Касымов Е. Б.',sp:'кардиолог',cab:'204',pc:35,ph:'14:00–17:00'},
 D3:{n:'Нурланова А. К.',sp:'гинеколог',cab:'207',pc:35,ph:'14:00–17:00'},
 D4:{n:'Оспанов Р. Ж.',sp:'невролог',cab:'210',pc:35,ph:'15:00–17:00'},
 D5:{n:'Тажибаева Г. М.',sp:'педиатр',cab:'112',pc:30,ph:'16:00–17:00'},
 D6:{n:'Сейтжан М. А.',sp:'врач УЗИ',cab:'105',pc:30,ph:'весь день, отдельный кабинет'},
 D7:{n:'Алимова Д. С.',sp:'эндокринолог',cab:'212',pc:35,ph:'15:00–17:00'}
};
const HRS=['08','09','10','11','12','13','14','15','16'];
const PSTART={D1:15,D2:14,D3:14,D4:15,D5:16,D6:8,D7:15};
const SV={
 TER:{n:'Приём терапевта (платно)',p:5000,d:'D1'},KAR:{n:'Кардиолог + ЭКГ',p:9000,d:'D2'},GIN:{n:'Приём гинеколога',p:7000,d:'D3'},
 NEV:{n:'Приём невролога',p:7000,d:'D4'},PED:{n:'Педиатр без очереди',p:5000,d:'D5'},USA:{n:'УЗИ брюшной полости',p:6000,d:'D6'},
 UST:{n:'УЗИ щитовидной железы',p:4500,d:'D6'},UZG:{n:'УЗИ малого таза',p:6500,d:'D6'},END:{n:'Эндокринолог',p:7500,d:'D7'},
 S086:{n:'Справка 086 (комиссия)',p:6000,d:'D1'},LAB:{n:'Анализы «Чек-ап» (кровь, сахар, холестерин)',p:8500,d:'D1'},DRP:{n:'Капельница (процедурный)',p:4000,d:'D1'}
};
const PT={
 P1:{n:'Есенова Асель Маратовна',ph:'+7 707 4** ** 18',att:'прикреплена',src:'Instagram',vis:4,sum:31500},
 P2:{n:'Жакупов Нурлан Ерикович',ph:'+7 701 2** ** 55',att:'не прикреплён',src:'с улицы',vis:2,sum:15000},
 P3:{n:'Ташенова Бибигуль Сейтовна',ph:'+7 775 9** ** 03',att:'прикреплена',src:'звонок',vis:7,sum:48500},
 P4:{n:'Омаров Данияр Асанович',ph:'+7 747 1** ** 76',att:'прикреплён',src:'—',vis:1,sum:0},
 P5:{n:'Курмангалиева Жанар Б.',ph:'+7 702 6** ** 41',att:'не прикреплена',src:'Instagram',vis:1,sum:9000},
 P6:{n:'Ибраимов Серик Т.',ph:'+7 776 3** ** 90',att:'прикреплён',src:'сайт',vis:3,sum:19500},
 P7:{n:'Абенова Камила (ребёнок)',ph:'+7 708 5** ** 12',att:'прикреплена',src:'WhatsApp',vis:2,sum:10000},
 P8:{n:'Сатыбалдиев Ержан К.',ph:'+7 771 8** ** 64',att:'не прикреплён',src:'с улицы',vis:1,sum:0}
};
let AP=[
 {id:'A1',d:'D1',h:'09',pt:'P4',f:'g',sv:'',st:'came'},{id:'A2',d:'D1',h:'10',pt:'P3',f:'g',sv:'',st:'book'},{id:'A3',d:'D1',h:'15',pt:'P2',f:'p',sv:'S086',st:'book'},
 {id:'A4',d:'D2',h:'09',pt:'P6',f:'g',sv:'',st:'came'},{id:'A5',d:'D2',h:'14',pt:'P1',f:'p',sv:'KAR',st:'paid'},{id:'A6',d:'D2',h:'15',pt:'P8',f:'p',sv:'KAR',st:'book'},
 {id:'A7',d:'D3',h:'11',pt:'P1',f:'g',sv:'',st:'came'},{id:'A8',d:'D3',h:'14',pt:'P5',f:'p',sv:'GIN',st:'book'},
 {id:'A9',d:'D4',h:'08',pt:'P3',f:'g',sv:'',st:'came'},{id:'A10',d:'D5',h:'10',pt:'P7',f:'g',sv:'',st:'book'},
 {id:'A11',d:'D6',h:'09',pt:'P5',f:'p',sv:'UZG',st:'paid'},{id:'A12',d:'D6',h:'10',pt:'P6',f:'p',sv:'USA',st:'book'},{id:'A13',d:'D6',h:'12',pt:'P2',f:'p',sv:'UST',st:'book'},
 {id:'A14',d:'D7',h:'12',pt:'P3',f:'g',sv:'',st:'came'},{id:'A15',d:'D7',h:'16',pt:'P6',f:'p',sv:'END',st:'book'}
];
let CASH=[{t:'09:12',pt:'P5',sv:'UZG',m:'Kaspi QR',s:6500},{t:'14:20',pt:'P1',sv:'KAR',m:'Карта',s:9000},{t:'08:40',pt:'P2',sv:'LAB',m:'Наличные',s:8500}];
let CURP='P1',CURA='A6';
const LST=[['new','Новая'],['call','Связались'],['book','Записан'],['came','Пришёл'],['paid','Оплатил'],['rep','Повторный']];
let LD=[
 {id:'L1',n:'Ажар, 34',src:'Instagram',need:'Сколько стоит УЗИ щитовидки? Можно сегодня?',st:'new',own:'Айгерим',t:'11:42'},
 {id:'L2',n:'Мурат, 51',src:'Звонок',need:'Кардиолог без очереди, давление',st:'new',own:'Данияр',t:'11:30'},
 {id:'L3',n:'Динара, 28',src:'Сайт',need:'Гинеколог, суббота',st:'call',own:'Айгерим',t:'10:15'},
 {id:'L4',n:'Бахыт, 45',src:'Instagram',need:'Чек-ап анализы для мужа и для себя',st:'call',own:'Данияр',t:'09:58'},
 {id:'L5',n:'Сауле, 39',src:'WhatsApp',need:'Справка 086 для колледжа, ребёнок',st:'book',own:'Айгерим',t:'вчера'},
 {id:'L6',n:'Ержан, 52',src:'Звонок',need:'Кардиолог + ЭКГ',st:'book',own:'Данияр',t:'вчера'},
 {id:'L7',n:'Асель, 31',src:'Instagram',need:'Кардиолог',st:'paid',own:'Айгерим',t:'вчера'},
 {id:'L8',n:'Жанар, 26',src:'Instagram',need:'УЗИ малого таза',st:'paid',own:'Данияр',t:'19.11'},
 {id:'L9',n:'Серик, 60',src:'Сайт',need:'Эндокринолог, контроль сахара',st:'rep',own:'Айгерим',t:'15.11'},
 {id:'L10',n:'Гульнар, 47',src:'Звонок',need:'Невролог, спина',st:'came',own:'Данияр',t:'сегодня'}
];
const SRC=[['Instagram',180000,128,41],['Сайт',40000,34,12],['Звонки',0,52,19],['WhatsApp',0,38,15],['С улицы (касса)',0,96,96]];
const SELLERS=[{n:'Айгерим',leads:96,book:58,paid:44,rev:356000},{n:'Данияр',leads:88,book:49,paid:36,rev:298000}];
let CHATS={
 c1:{n:'Ажар · Instagram',m:[['in','Здравствуйте! Сколько стоит УЗИ щитовидки? Можно сегодня?','11:42']]},
 c2:{n:'Сауле · WhatsApp',m:[['in','Справка 086 для колледжа, ребёнку 16 лет','вчера'],['me','Здравствуйте! 6 000 ₸, комиссия в один день. Записала на пт 15:00 к терапевту.','вчера'],['in','Спасибо!','вчера']]},
 c3:{n:'Мурат · после звонка',m:[['me','Мурат, записали к кардиологу на сегодня 15:00, каб. 204. Возьмите прошлые ЭКГ, если есть.','11:35']]}
};
let CH='c1';
let CALLS=[
 {t:'11:30',n:'+7 701 5** ** 21',who:'Данияр',dur:'2:41',res:'записан к кардиологу',miss:false},
 {t:'11:12',n:'+7 775 3** ** 08',who:'—',dur:'—',res:'пропущен',miss:true},
 {t:'10:47',n:'+7 707 9** ** 44',who:'Айгерим',dur:'1:12',res:'узнала цену, думает',miss:false},
 {t:'10:05',n:'+7 747 2** ** 63',who:'—',dur:'—',res:'пропущен',miss:true},
 {t:'09:31',n:'+7 702 1** ** 90',who:'Айгерим',dur:'3:05',res:'записана на УЗИ',miss:false}
];

/* ===== аптеки ===== */
const PH=['№1 Центр','№2 Береке','№3 Ынтымак','№4 Жаңа Жол','№5 Базар','№6 Самал','№7 Достық'];
// st — остаток по 7 аптекам, s30 — продано за 30 дней по 7 аптекам
let DR=[
 {k:'PAR',n:'Парацетамол 500 мг №20',p:420,min:20,st:[64,18,9,22,40,12,15],s30:[120,44,38,51,96,30,27],exp:'08.2027'},
 {k:'AML',n:'Амлодипин 5 мг №30',p:1350,min:10,st:[22,6,3,8,12,4,5],s30:[48,19,17,22,30,11,9],exp:'03.2027'},
 {k:'MET',n:'Метформин 850 мг №60',p:1900,min:8,st:[18,5,7,4,9,2,6],s30:[26,12,10,9,15,6,8],exp:'11.2027'},
 {k:'AMX',n:'Амоксиклав 875 мг №14',p:3800,min:5,st:[11,3,1,4,6,2,2],s30:[22,8,9,7,14,5,4],exp:'06.2027'},
 {k:'OMZ',n:'Омепразол 20 мг №30',p:980,min:10,st:[30,14,12,9,21,7,10],s30:[40,15,14,13,28,9,10],exp:'01.2028'},
 {k:'NUR',n:'Нурофен детский сироп',p:2600,min:4,st:[9,5,2,6,7,3,1],s30:[16,8,9,6,13,5,6],exp:'09.2027'},
 {k:'LOR',n:'Лоратадин 10 мг №10',p:650,min:10,st:[25,11,14,12,19,8,9],s30:[30,12,10,11,22,7,8],exp:'05.2028'},
 {k:'VIT',n:'Витамин D3 2000 МЕ',p:4900,min:3,st:[14,9,8,7,10,6,9],s30:[3,0,1,0,2,0,0],exp:'02.2027'},
 {k:'KAG',n:'Кагоцел №10',p:3200,min:3,st:[16,11,9,10,12,8,7],s30:[2,1,0,0,1,0,0],exp:'01.2027'},
 {k:'SHP',n:'Шприц 5 мл',p:60,min:100,st:[600,140,90,160,300,80,70],s30:[900,260,240,280,520,150,140],exp:'12.2030'},
 {k:'ENT',n:'Энтерофурил 200 мг №16',p:2900,min:3,st:[6,4,0,3,5,2,8],s30:[11,5,6,4,9,3,0],exp:'12.2026'},
 {k:'FLU',n:'Флюкостат 150 мг №1',p:1100,min:5,st:[12,9,4,6,8,3,11],s30:[14,5,6,5,10,4,1],exp:'01.2027'}
];
let ORD=[],OSENT=false,OSHIP=false;
let MOV=[{id:'ПМ-112',k:'ENT',q:5,from:6,to:2,st:'в пути'},{id:'ПМ-111',k:'FLU',q:6,from:6,to:2,st:'принято'}];
let CPH=2,CART=[];
const DAYS={'12.2026':25,'01.2027':56,'02.2027':84,'03.2027':115};
const daysLeft=e=>DAYS[e]!==undefined?DAYS[e]:400;
const sum=a=>a.reduce((x,y)=>x+y,0);
const lowCnt=()=>DR.reduce((n,d)=>n+d.st.filter((x,i)=>x<(d.mn?d.mn[i]:d.min)).length,0);
const phRev=i=>DR.reduce((s,d)=>s+d.s30[i]*d.p,0);
const phStock=i=>DR.reduce((s,d)=>s+d.st[i]*d.p,0);

/* ===== экраны ===== */
const SC={};
SC.dash=()=>{const paidRev=4120000,goal=8240000,phr=sum(PH.map((_,i)=>phRev(i)))*4.2;
 return `<div class="hd"><div><h2>Главное за ноябрь — простыми цифрами</h2><p>Одна страница: сколько принесли платные приёмы, сколько людей прошло по госзаказу, что с рекламой и что с аптеками.</p></div><div class="btns"><button class="bt" onclick="go('flows')">Госзаказ и платно →</button><button class="bt a" onclick="go('mkt')">Реклама →</button></div></div>
 ${say(`<b>Коротко:</b> платный приём в ноябре — <b>${mln(paidRev)}</b>. Цель «в два раза больше» — <b>${mln(goal)}</b> в месяц. Сейчас из каждых 10 заявок платят 5. Если продажники доведут до 7 — это ещё ≈1,6 млн ₸ в месяц без лишней рекламы.`)}
 <div class="big"><div><small>Платный приём, ноябрь</small><b>${mln(paidRev)}</b><i class="up">+18% к октябрю</i></div><div><small>Приёмов по госзаказу</small><b>3 214</b><i>в гос. системе, как и раньше</i></div><div><small>Заявок на платное</small><b>348</b><i>из них оплатили 183</i></div><div><small>Аптеки, 7 точек</small><b>${mln(phr)}</b><i>выручка за месяц</i></div></div>
 <div class="g2"><div class="pan"><h3>Куда идём <small>платно, млн ₸ в месяц</small></h3><div class="pb">${[['Август',2.9],['Сентябрь',3.2],['Октябрь',3.5],['Ноябрь',4.1],['Цель',8.2]].map(([m,v])=>`<div style="display:grid;grid-template-columns:90px 1fr 70px;gap:10px;align-items:center;margin-bottom:8px"><span>${m}</span>${bar(v/8.2*100,'p')}<b class="num" style="text-align:right">${String(v).replace('.',',')}</b></div>`).join('')}<div class="note">Рост даёт не реклама сама по себе, а то, что каждую заявку кто-то довёл до записи и оплаты.</div></div></div>
 <div class="pan"><h3>На что обратить внимание сегодня</h3><div class="pb">
  <p style="margin-bottom:8px">${dot('bad','')} <b>${CALLS.filter(c=>c.miss).length} пропущенных звонка</b> — продажники ещё не перезвонили. <button class="bt s" onclick="go('calls')">Открыть</button></p>
  <p style="margin-bottom:8px">${dot('warn','')} <b>${lowCnt()} строк</b> по аптекам ниже минимума — заказ в центр готов. <button class="bt s" onclick="go('order')">Открыть</button></p>
  <p style="margin-bottom:8px">${dot('warn','')} <b>Неликвид ≈ ${mln(DR.filter(d=>sum(d.s30)<=4).reduce((s,d)=>s+sum(d.st)*d.p,0))}</b> лежит в аптеках: витамин D3, Кагоцел. <button class="bt s" onclick="go('abc')">Открыть</button></p>
  <p>${dot('ok','')} УЗИ-кабинет занят платными на 78% — можно открыть вечерние часы.</p></div></div></div>`};
SC.flows=()=>{const g=AP.filter(a=>a.f==='g').length,p=AP.filter(a=>a.f==='p').length;
 return `<div class="hd"><div><h2>Госзаказ и платно — раздельно</h2><p>У каждой записи метка потока. Платный приём идёт в свои часы и кабинеты, госзаказ — в своём порядке. Отчёт показывает, сколько приносит коммерция.</p></div></div>
 <div class="pan"><h3>Сегодня в расписании <small>${AP.length} записей</small></h3><div class="pb"><div class="split"><div class="g" style="width:${pct(g,AP.length)}%"></div><div class="p" style="width:${pct(p,AP.length)}%"></div></div><div class="legend"><span>${dot('gov','')} ГОБМП/ОСМС — ${g}</span><span>${dot('paid','')} Платно — ${p}</span></div></div></div>
 <div class="g2"><div class="pan"><h3>Платные часы врачей</h3>${tbl(['Врач','Специальность','Каб.','Платные часы'],Object.values(DOC).map(d=>`<tr><td>${esc(d.n)}</td><td>${d.sp}</td><td class="num">${d.cab}</td><td><span class="flow f-p">${d.ph}</span></td></tr>`))}</div>
 <div class="pan"><h3>Платный приём по врачам <small>ноябрь</small></h3>${tbl(['Врач','>Приёмов','>Выручка','Доля'],[['D6',212,1310000],['D2',96,864000],['D3',88,616000],['D1',140,700000],['D7',41,307500],['D4',33,231000],['D5',18,90000]].map(([k,n,s])=>`<tr><td>${esc(DOC[k].n)}</td><td class="r">${n}</td><td class="r">${tg(s)}</td><td>${bar(s/1310000*100,'p')}</td></tr>`))}</div></div>
 <div class="pan"><h3>Как разделяем на деле</h3><div class="pb">1) Каждому врачу — 2–3 платных часа в день, в расписании они жёлтые. 2) УЗИ — отдельный платный кабинет весь день. 3) Платный пациент приходит ко времени, в живую очередь не встаёт. 4) Если госпациенту нужно быстрее — регистратура предлагает платный слот, но не навязывает.<div class="note">Госзаказ ведётся в гос. системах как сейчас. Здесь — только метка «ГОБМП/ОСМС» для распределения кабинетов и отчёта.</div></div></div>`};
SC.mkt=()=>`<div class="hd"><div><h2>Реклама и заявки</h2><p>Сколько заявок дал каждый источник, сколько из них дошли до оплаты и сколько стоила одна заявка и один платящий пациент.</p></div><button class="bt" onclick="xls('Источники заявок, ноябрь')">Выгрузить в Excel</button></div>
 ${say('Instagram даёт больше всего заявок. Одна заявка — <b>1 406 ₸</b>, один платящий пациент — <b>4 390 ₸</b> при среднем чеке 7 800 ₸ и повторных визитах. Реклама окупается, если заявки не теряются.')}
 <div class="pan"><h3>Источники · ноябрь</h3>${tbl(['Источник','>Расход','>Заявок','>Оплатили','>Цена заявки','>Цена пациента','Конверсия'],SRC.map(([n,c,l,p])=>`<tr><td><b>${n}</b></td><td class="r">${c?tg(c):'—'}</td><td class="r">${l}</td><td class="r">${p}</td><td class="r">${c?tg(c/l):'—'}</td><td class="r">${c?tg(c/p):'—'}</td><td>${bar(pct(p,l))}<small>${pct(p,l)}%</small></td></tr>`))}</div>
 <div class="g2"><div class="pan"><h3>Что спрашивают чаще всего</h3><div class="pb">${[['УЗИ (щитовидка, брюшная, малый таз)',31],['Кардиолог + ЭКГ',18],['Справка 086',14],['Гинеколог',13],['Анализы «Чек-ап»',11],['Невролог',8]].map(([n,v])=>`<div style="display:grid;grid-template-columns:1fr 120px 36px;gap:8px;align-items:center;margin-bottom:6px"><span>${n}</span>${bar(v/31*100,'p')}<b class="num">${v}%</b></div>`).join('')}<div class="note">Под эти услуги и делаем рекламу — так советовали на встрече: не «поликлиника вообще», а конкретные услуги.</div></div></div>
 <div class="pan"><h3>Где теряются заявки</h3><div class="pb">${LST.map(([k,n],i)=>{const v=[348,301,224,201,183,64][i];return `<div style="display:grid;grid-template-columns:90px 1fr 46px;gap:8px;align-items:center;margin-bottom:6px"><span>${n}</span>${bar(v/348*100)}<b class="num">${v}</b></div>`}).join('')}<div class="note">Больше всего теряется между «Связались» и «Записан» — здесь помогают скрипты и напоминания.</div></div></div></div>`;
SC.pay=()=>`<div class="hd"><div><h2>Зарплата и KPI</h2><p>Продажникам — оклад и бонус за каждого оплатившего пациента. Врачам — процент с платных приёмов. Госзаказ по зарплате считается как раньше.</p></div><button class="bt" onclick="xls('Зарплата, ноябрь')">Выгрузить в Excel</button></div>
 <div class="pan"><h3>Продажники · ноябрь</h3>${tbl(['Сотрудник','>Заявок','>Записали','>Оплатили','>Выручка','>Оклад','>Бонус 1 500 ₸','>Итого'],SELLERS.map(s=>`<tr><td><b>${s.n}</b></td><td class="r">${s.leads}</td><td class="r">${s.book}</td><td class="r">${s.paid}</td><td class="r">${tg(s.rev)}</td><td class="r">${tg(150000)}</td><td class="r">${tg(s.paid*1500)}</td><td class="r"><b>${tg(150000+s.paid*1500)}</b></td></tr>`))}</div>
 <div class="pan"><h3>Врачи · процент с платного</h3>${tbl(['Врач','>Платных приёмов','>Выручка','>%','>К выплате'],[['D6',212,1310000],['D2',96,864000],['D3',88,616000],['D1',140,700000],['D7',41,307500]].map(([k,n,s])=>`<tr><td>${esc(DOC[k].n)} <small>${DOC[k].sp}</small></td><td class="r">${n}</td><td class="r">${tg(s)}</td><td class="r">${DOC[k].pc}%</td><td class="r"><b>${tg(s*DOC[k].pc/100)}</b></td></tr>`))}<div class="pb note">Проценты и оклады в демо условные — ставим ваши на старте.</div></div>`;

/* продажи */
SC.funnel=()=>`<div class="hd"><div><h2>Воронка платных приёмов</h2><p>Каждая заявка — из Instagram, сайта, звонка или WhatsApp — попадает сюда с ответственным. Нажмите на карточку, чтобы перевести дальше.</p></div><div class="btns"><button class="bt a" onclick="newLead()">+ Заявка</button></div></div>
 <div class="tw"><div class="kb">${LST.map(([k,n])=>{const ls=LD.filter(l=>l.st===k);return `<div class="kc"><h4>${n}<span class="num">${ls.length}</span></h4>${ls.map(l=>`<div class="lc" onclick="leadM('${l.id}')"><span class="src">${l.src.toUpperCase()}</span><b>${esc(l.n)}</b>${esc(l.need)}<br><small>${l.own} · ${l.t}</small></div>`).join('')}</div>`}).join('')}</div></div>
 <div class="pan"><h3>Робот-помощник по этапам</h3><div class="pb">«Новая» дольше 15 минут — напоминание продажнику. «Записан» — пациенту WhatsApp с временем и кабинетом, за 2 часа — напоминание. «Оплатил» — через 3 дня вопрос о самочувствии, через месяц — приглашение на контроль.<div class="note">Это обычные автоматические сообщения, не ИИ. Разговаривают с пациентами люди.</div></div></div>`;
SC.inbox=()=>{const c=CHATS[CH];return `<div class="hd"><div><h2>WhatsApp — один номер на всех продажников</h2><p>Переписки не теряются, видно, кто ответил. Из чата — сразу запись в платный слот.</p></div></div>
 <div class="pan"><div class="chat"><div class="cl2">${Object.entries(CHATS).map(([k,v])=>`<div class="ci ${k===CH?'on':''}" onclick="CH='${k}';build()"><b>${esc(v.n)}</b><small>${esc(v.m[v.m.length-1][1]).slice(0,48)}…</small></div>`).join('')}</div>
 <div><div class="msgs">${c.m.map(m=>`<div class="m ${m[0]==='me'?'me':''}">${esc(m[1])}<small>${m[2]}</small></div>`).join('')}</div>
 <div class="cin"><input class="inp" id="msgi" value="УЗИ щитовидки — 4 500 ₸. Сегодня есть 12:00 и 16:00, каб. 105. Записать?"><button class="bt p" onclick="sendMsg()">Отправить</button><button class="bt a" onclick="go('sched')">Записать</button></div></div></div></div>
 <div class="pan"><h3>Быстрые ответы продажника</h3><div class="pb">${[['Цена и время','Приём кардиолога с ЭКГ — 9 000 ₸. Сегодня свободно 15:00 и 16:00, каб. 204. Записать вас?'],['Как подготовиться к УЗИ','УЗИ брюшной полости натощак, последний приём пищи за 6–8 часов. Возьмите удостоверение.'],['Напоминание','Напоминаем: завтра в 10:00 у вас приём, каб. 105. Если планы изменились — напишите, перенесём.']].map(([t,x])=>`<p style="margin-bottom:8px"><b>${t}.</b> ${x} <button class="bt s" onclick="toast('Шаблон вставлен в сообщение.')">Вставить</button></p>`).join('')}<div class="note">Шаблоны пишет руководитель — ответы одинаково быстрые и вежливые у всех продажников.</div></div></div>`};
SC.calls=()=>`<div class="hd"><div><h2>Звонки и записи разговоров</h2><p>IP-телефония: каждый звонок записан, пропущенные видны сразу. По записи руководитель проверяет, как продажник ведёт разговор.</p></div></div>
 ${say(`Сегодня пропущено <b>${CALLS.filter(c=>c.miss).length}</b> звонка. Каждый пропущенный — потерянный платный пациент, поэтому они вверху и с кнопкой «Перезвонить».`)}
 <div class="pan"><h3>Звонки · сегодня</h3>${tbl(['Время','Номер','Кто','Длительность','Итог',''],CALLS.map((c,i)=>`<tr><td class="num">${c.t}</td><td class="num">${c.n}</td><td>${c.who}</td><td class="num">${c.dur}</td><td>${c.miss?dot('bad','пропущен'):esc(c.res)}</td><td>${c.miss?`<button class="bt s a" onclick="callBack(${i})">Перезвонить</button>`:`<button class="play" onclick="toast('Запись разговора воспроизводится (в демо — без звука).')">&#9654; запись</button>`}</td></tr>`))}</div>`;

/* регистратура */
SC.sched=()=>`<div class="hd"><div><h2>Запись к врачам · пятница 20.11</h2><p>Синие — госзаказ, жёлтые — платный приём. Пунктирные жёлтые — свободные платные слоты: их и продают продажники.</p></div><div class="legend"><span>${dot('gov','')} ГОБМП/ОСМС</span><span>${dot('paid','')} Платно</span></div></div>
 <div class="pan"><div class="tw"><table class="cal"><thead><tr><th class="dn">Врач · кабинет</th>${HRS.map(h=>`<th>${h}:00</th>`).join('')}</tr></thead><tbody>${Object.entries(DOC).map(([k,d])=>`<tr><td class="dn"><b>${esc(d.n)}</b><small>${d.sp} · каб. ${d.cab}</small></td>${HRS.map(h=>{const a=AP.find(x=>x.d===k&&x.h===h);const paidH=+h>=PSTART[k];
  if(a)return `<td><span class="slot ${a.f} ${a.st==='paid'?'paid':''}" onclick="apM('${a.id}')">${esc(PT[a.pt].n.split(' ')[0])}<br><small>${a.f==='p'?esc(SV[a.sv].n).slice(0,16):'госзаказ'}</small></span></td>`;
  return `<td>${paidH?`<span class="slot fp" onclick="newAp('${k}','${h}')">+ платно</span>`:`<span class="slot ff" onclick="newAp('${k}','${h}')">·</span>`}</td>`}).join('')}</tr>`).join('')}</tbody></table></div></div>
 <div class="note">Филиалы в посёлках — отдельная вкладка с теми же правилами. В демо показан центр.</div>`;
SC.pat=()=>{const p=PT[CURP];const my=AP.filter(a=>a.pt===CURP);return `<div class="hd"><div><h2>${esc(p.n)}</h2><p>Карточка для записи и денег. Медицинскую историю здесь не дублируем — она ведётся в гос. системе.</p></div><div class="btns"><select class="inp" style="width:auto" onchange="CURP=this.value;build()">${Object.keys(PT).map(k=>`<option value="${k}" ${k===CURP?'selected':''}>${esc(PT[k].n)}</option>`).join('')}</select></div></div>
 <div class="g21"><div class="pan"><h3>Данные</h3><div class="pb"><div class="kv"><span>Телефон</span><b class="num">${p.ph}</b><span>Прикрепление</span><b>${p.att}</b><span>Откуда пришёл</span><b>${p.src}</b><span>Платных визитов</span><b>${p.vis}</b><span>Оплачено всего</span><b>${tg(p.sum)}</b></div>
 <div class="ext" style="margin-top:12px">Медицинская запись (осмотры, диагнозы, назначения) ведётся в гос. системе. Здесь — только запись, оплаты и связь с пациентом, чтобы ничего не вносить дважды.</div></div></div>
 <div class="pan"><h3>Действия</h3><div class="pb"><div class="btns" style="flex-direction:column;align-items:stretch"><button class="bt a" onclick="go('sched')">Записать в платный слот</button><button class="bt" onclick="CH='c2';go('inbox')">Написать в WhatsApp</button><button class="bt" onclick="toast('Напоминание о контрольном визите поставлено на 20.12.')">Напомнить о повторном визите</button></div></div></div></div>
 <div class="pan"><h3>Записи сегодня</h3>${my.length?tbl(['Время','Врач','Поток','Услуга','Статус'],my.map(a=>`<tr class="cl" onclick="apM('${a.id}')"><td class="num">${a.h}:00</td><td>${esc(DOC[a.d].n)}</td><td>${FL(a.f)}</td><td>${a.f==='p'?esc(SV[a.sv].n):'—'}</td><td>${stN(a.st)}</td></tr>`)):'<div class="pb">Сегодня записей нет.</div>'}</div>`};
const stN=s=>({book:dot('mut','записан'),came:dot('warn','пришёл'),paid:dot('ok','оплачено')})[s];
SC.cash=()=>{const due=AP.filter(a=>a.f==='p'&&a.st!=='paid');const tot=sum(CASH.map(c=>c.s));return `<div class="hd"><div><h2>Касса платного приёма</h2><p>Пациент оплачивает до приёма — Kaspi QR, картой или наличными. Чек и сумма сразу в отчёте собственника.</p></div><button class="bt" onclick="xls('Касса за 20.11')">Выгрузить в Excel</button></div>
 <div class="big"><div><small>Принято сегодня</small><b>${tg(tot)}</b></div><div><small>Оплат</small><b>${CASH.length}</b></div><div><small>Ждут оплаты</small><b>${due.length}</b></div><div><small>Средний чек</small><b>${tg(tot/CASH.length)}</b></div></div>
 <div class="g2"><div class="pan"><h3>Ждут оплаты</h3>${due.length?tbl(['Время','Пациент','Услуга','>Сумма',''],due.map(a=>`<tr><td class="num">${a.h}:00</td><td>${esc(PT[a.pt].n)}</td><td>${esc(SV[a.sv].n)}</td><td class="r">${tg(SV[a.sv].p)}</td><td><button class="bt s a" onclick="payM('${a.id}')">Оплата</button></td></tr>`)):'<div class="pb">Все платные приёмы оплачены.</div>'}</div>
 <div class="pan"><h3>Оплаты сегодня</h3>${tbl(['Время','Пациент','Услуга','Способ','>Сумма'],CASH.map(c=>`<tr><td class="num">${c.t}</td><td>${esc(PT[c.pt].n)}</td><td>${esc(SV[c.sv].n)}</td><td>${c.m}</td><td class="r">${tg(c.s)}</td></tr>`))}</div></div>`};
SC.price=()=>`<div class="hd"><div><h2>Прайс платных услуг</h2><p>Один прайс для регистратуры, продажников и сайта. Изменили цену здесь — она везде.</p></div><button class="bt" onclick="toast('Новая цена сохранена и видна регистратуре и продажникам.')">Изменить цену</button></div>
 <div class="pan">${tbl(['Услуга','Врач','Кабинет','>Цена'],Object.values(SV).map(s=>`<tr><td><b>${esc(s.n)}</b></td><td>${esc(DOC[s.d].n)} · ${DOC[s.d].sp}</td><td class="num">${DOC[s.d].cab}</td><td class="r"><b>${tg(s.p)}</b></td></tr>`))}<div class="pb note">Цены в демо условные. Ваш прайс загружаем на старте.</div></div>`;
SC.myday=()=>{const d='D2';const my=AP.filter(a=>a.d===d);return `<div class="hd"><div><h2>Мой приём · ${esc(DOC[d].n)}, ${DOC[d].sp}</h2><p>Врач видит свой список с меткой потока. Если пациенту по госзаказу нужно обследование быстрее — одной кнопкой передаёт продажнику.</p></div></div>
 <div class="pan">${tbl(['Время','Пациент','Поток','Услуга','Статус',''],my.map(a=>`<tr><td class="num">${a.h}:00</td><td>${esc(PT[a.pt].n)}</td><td>${FL(a.f)}</td><td>${a.f==='p'?esc(SV[a.sv].n):'приём по госзаказу'}</td><td>${stN(a.st)}</td><td>${a.f==='g'?`<button class="bt s a" onclick="refer('${a.pt}')">Предложить УЗИ без очереди</button>`:''}</td></tr>`))}</div>
 <div class="pan"><h3>Мой процент с платного · ноябрь</h3><div class="pb"><div class="kv"><span>Платных приёмов</span><b>96</b><span>Выручка</span><b>${tg(864000)}</b><span>Мой процент</span><b>${DOC[d].pc}% = ${tg(864000*DOC[d].pc/100)}</b></div><div class="note">Осмотр и диагноз врач заполняет в гос. системе, как сейчас. Здесь — только расписание и деньги.</div></div></div>`};

/* аптеки */
SC.phd=()=>`<div class="hd"><div><h2>7 аптек — остатки онлайн</h2><p>Больше никто не передаёт остатки по телефону: продажа на кассе аптеки сразу уменьшает остаток. Красным — ниже минимума.</p></div><button class="bt a" onclick="go('order')">Заказ в центр (${lowCnt()})</button></div>
 <div class="big"><div><small>Товара в аптеках</small><b>${mln(sum(PH.map((_,i)=>phStock(i))))}</b></div><div><small>Ниже минимума</small><b class="dn">${lowCnt()}</b></div><div><small>Продано за 30 дней</small><b>${mln(sum(PH.map((_,i)=>phRev(i))))}</b><i>по позициям демо</i></div><div><small>Срок < 3 мес.</small><b>${DR.filter(d=>daysLeft(d.exp)<90).length}</b></div></div>
 <div class="pan">${tbl(['Препарат',...PH.map(p=>'>'+p),'>Мин.'],DR.map(d=>`<tr><td>${esc(d.n)}</td>${d.st.map(v=>`<td class="r" style="${v<d.min?'color:var(--bad);font-weight:700':''}">${v}</td>`).join('')}<td class="r">${d.min}</td></tr>`))}</div>`;
SC.abc=()=>{const rows=DR.map(d=>({d,rev:sum(d.s30)*d.p,stv:sum(d.st)*d.p})).sort((a,b)=>b.rev-a.rev);const tot=sum(rows.map(r=>r.rev));let acc=0;
 return `<div class="hd"><div><h2>Что продаётся, а что лежит</h2><p>ABC: группа A — 80% выручки, за ней следим в первую очередь. Неликвид — то, что почти не продаётся, но держит деньги.</p></div><button class="bt" onclick="xls('ABC по аптекам')">Выгрузить в Excel</button></div>
 ${say(`Витамин D3 и Кагоцел за месяц продались <b>${sum(DR[7].s30)+sum(DR[8].s30)} раз</b>, а на полках их на <b>${tg(sum(DR[7].st)*DR[7].p+sum(DR[8].st)*DR[8].p)}</b>. Это деньги, которые центр заморозил при заказе вслепую.`)}
 <div class="pan">${tbl(['Препарат','>Продано, шт','>Выручка 30 дн.','>На полках','Группа','Лучшая аптека'],rows.map(r=>{acc+=r.rev;const g=sum(r.d.s30)<=4?'неликвид':acc/tot<=.8?'A':acc/tot<=.95?'B':'C';const best=r.d.s30.indexOf(Math.max(...r.d.s30));
  return `<tr><td>${esc(r.d.n)}</td><td class="r">${sum(r.d.s30)}</td><td class="r">${tg(r.rev)}</td><td class="r">${tg(r.stv)}</td><td>${g==='неликвид'?dot('bad','неликвид'):g==='A'?dot('ok','A'):dot('mut',g)}</td><td>${PH[best]}</td></tr>`}))}</div>
 <div class="pan"><h3>Выручка по аптекам · 30 дней</h3><div class="pb">${PH.map((p,i)=>`<div style="display:grid;grid-template-columns:120px 1fr 110px;gap:8px;align-items:center;margin-bottom:6px"><span>${p}</span>${bar(phRev(i)/phRev(0)*100,'p')}<b class="num" style="text-align:right">${tg(phRev(i))}</b></div>`).join('')}</div></div>`};
SC.order=()=>{const need=[];DR.forEach(d=>d.st.forEach((v,i)=>{if(v<d.min)need.push({d,i,q:d.min*2-v})}));
 return `<div class="hd"><div><h2>Автозаказ в центр</h2><p>Система сама собирает заказ: всё, что ниже минимума, доводит до запаса на ~2 недели по фактическим продажам. Центр не гадает — видит цифры.</p></div><div class="btns"><button class="bt a" onclick="sendOrder()">${OSENT?'Заказ отправлен':'Отправить заказ в центр'}</button>${OSENT&&!OSHIP?`<button class="bt p" onclick="ship()">Центр: отгрузить</button>`:''}</div></div>
 ${OSHIP?say('<b>Отгружено.</b> Остатки аптек обновились, позиции ниже минимума закрыты.'):''}
 <div class="pan"><h3>Заказ на сегодня <small>${need.length} строк</small></h3>${need.length?tbl(['Аптека','Препарат','>Остаток','>Мин.','>Продажи 30 дн.','>Заказать','>Сумма'],need.map(n=>`<tr><td>${PH[n.i]}</td><td>${esc(n.d.n)}</td><td class="r" style="color:var(--bad)">${n.d.st[n.i]}</td><td class="r">${n.d.min}</td><td class="r">${n.d.s30[n.i]}</td><td class="r"><b>${n.q}</b></td><td class="r">${tg(n.q*n.d.p)}</td></tr>`)):'<div class="pb">Все аптеки выше минимума. Заказывать нечего.</div>'}
 <div class="pb"><b>Итого: ${tg(sum(need.map(n=>n.q*n.d.p)))}</b><div class="note">Минимумы ставим по каждой аптеке отдельно: в посёлке и на базаре продажи разные.</div></div></div>`};
SC.move=()=>`<div class="hd"><div><h2>Перемещения между аптеками</h2><p>Где лежит без движения — забираем туда, где заканчивается. Не покупаем то, что уже есть в соседней аптеке.</p></div><button class="bt a" onclick="newMove()">Предложить перемещение</button></div>
 <div class="pan"><h3>Подсказка системы</h3><div class="pb">Энтерофурил: в аптеке ${PH[6]} лежит ${DR[10].st[6]} шт и за месяц не продан, в ${PH[2]} — 0 шт при продажах ${DR[10].s30[2]} в месяц. Переместить 5 шт.</div></div>
 <div class="pan">${tbl(['№','Препарат','>Кол-во','Откуда','Куда','Статус',''],MOV.map(m=>`<tr><td class="num">${m.id}</td><td>${esc(DR.find(d=>d.k===m.k).n)}</td><td class="r">${m.q}</td><td>${PH[m.from]}</td><td>${PH[m.to]}</td><td>${m.st==='принято'?dot('ok','принято'):dot('warn','в пути')}</td><td>${m.st!=='принято'?`<button class="bt s" onclick="accMove('${m.id}')">Принять</button>`:''}</td></tr>`))}</div>`;
SC.exp=()=>`<div class="hd"><div><h2>Сроки годности</h2><p>Что истекает в ближайшие 3 месяца и где. Лучше переместить или сделать скидку, чем списать.</p></div></div>
 <div class="pan">${tbl(['Препарат','Годен до','>Дней','>Всего шт','Где больше всего','Что сделать'],DR.filter(d=>daysLeft(d.exp)<120).sort((a,b)=>daysLeft(a.exp)-daysLeft(b.exp)).map(d=>{const mx=d.st.indexOf(Math.max(...d.st));const dl=daysLeft(d.exp);
  return `<tr><td>${esc(d.n)}</td><td class="num">${d.exp}</td><td class="r" style="${dl<60?'color:var(--bad);font-weight:700':''}">${dl}</td><td class="r">${sum(d.st)}</td><td>${PH[mx]} · ${d.st[mx]} шт</td><td><button class="bt s" onclick="toast('Скидка 15% на «${esc(d.n)}» включена на кассах всех аптек.')">Скидка</button> <button class="bt s" onclick="newMove()">Переместить</button></td></tr>`}))}<div class="pb note">Сроки вносятся при приходе товара — кассир аптеки отмечает партию.</div></div>`;
SC.pos=()=>{const t=sum(CART.map(c=>c.q*DR.find(d=>d.k===c.k).p));return `<div class="hd"><div><h2>Касса аптеки · ${PH[CPH]}</h2><p>Продажа сразу уменьшает остаток — центр видит его без звонков.</p></div><select class="inp" style="width:auto" onchange="CPH=+this.value;CART=[];build()">${PH.map((p,i)=>`<option value="${i}" ${i===CPH?'selected':''}>${p}</option>`).join('')}</select></div>
 <div class="g21"><div class="pan"><h3>Товары</h3>${tbl(['Препарат','>Цена','>Остаток',''],DR.map(d=>`<tr><td>${esc(d.n)}</td><td class="r">${tg(d.p)}</td><td class="r" style="${d.st[CPH]<d.min?'color:var(--bad)':''}">${d.st[CPH]}</td><td><button class="bt s" onclick="addCart('${d.k}')">+ в чек</button></td></tr>`))}</div>
 <div class="pan"><h3>Чек</h3><div class="pb">${CART.length?CART.map(c=>{const d=DR.find(x=>x.k===c.k);return `<div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:6px"><span>${esc(d.n)} × ${c.q}</span><b class="num">${tg(c.q*d.p)}</b></div>`}).join(''):'<p class="note">Добавьте товары слева.</p>'}<div class="cart"><span>Итого</span><span class="num">${tg(t)}</span></div><div class="btns" style="margin-top:10px"><button class="bt a" onclick="sell('Kaspi QR')">Kaspi QR</button><button class="bt p" onclick="sell('Наличные')">Наличные</button></div></div></div></div>`};

/* система */
SC.gov=()=>`<div class="hd"><div><h2>Гос. системы не трогаем и не дублируем</h2><p>Главный страх — двойной ввод. Поэтому делим чётко: что остаётся там, где сейчас, и что появляется в новой программе.</p></div></div>
 <div class="pan">${tbl(['Что','Где ведётся','В новой программе'],[
  ['Приём по госзаказу, прикрепление, медицинская запись','Дамумед, МедЭлемент и др. гос. системы','только метка «ГОБМП/ОСМС» в расписании'],
  ['Электронная очередь','ваша текущая система','не меняем'],
  ['Бухгалтерия, налоги, кадровые документы','1С','выгрузка в Excel; интеграция с 1С — опция'],
  ['Заявки, звонки, WhatsApp, продажники','нигде — теряется','✓ полностью'],
  ['Запись в платные слоты, касса платного','частично, вручную','✓ полностью'],
  ['Аптеки: остатки, продажи, заказ, сроки','вручную по телефону','✓ полностью'],
  ['Отчёт собственника','нет','✓ одна страница']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2].startsWith('✓')?dot('ok',r[2].slice(2)):r[2]}</td></tr>`))}</div>
 <div class="ext">Если понадобится — 1С подключаем отдельным пакетом, чтобы бухгалтер видел продажи аптек и платного приёма без ручного ввода.</div>`;
SC.acc=()=>`<div class="hd"><div><h2>Роли и доступы</h2><p>Каждый видит только своё. Продажник не видит деньги клиники, аптека — только свои остатки.</p></div></div>
 <div class="pan">${tbl(['Роль','Кто','Что видит','Экранов'],Object.entries(ROLES).map(([k,v])=>`<tr><td><b>${k}</b></td><td>${esc(v.n)}</td><td>${esc(v.note)}</td><td class="r">${v.s.length}</td></tr>`))}<div class="pb note">Вход по логину и паролю, без привязки к компьютеру. Аптекам в посёлках хватит телефона или планшета.</div></div>`;
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Один раз разрабатываем, ставим на ваш сервер и передаём. Абонплаты нет.</p></div></div>
 <div class="big"><div><small>Разработка</small><b>2 500 000 ₸</b><i>поликлиника + аптеки</i></div><div><small>Срок</small><b>4–6 недель</b></div><div><small>Абонплата</small><b>0 ₸</b></div><div><small>Сопровождение</small><b>3 месяца</b><i>включено</i></div></div>
 <div class="pan"><h3>Три этапа — три платежа</h3><div class="pb">${[['1','Старт и согласование','Утверждаем потоки, прайс, роли, аптеки и минимумы.','750 000 ₸'],['2','Программа на вашем сервере','Разворачиваем, переносим прайс и остатки, подключаем WhatsApp и телефонию.','1 000 000 ₸'],['3','Полировка и сдача','Правим по вашим замечаниям (запас +20% на правки), учим людей, передаём код и описание.','750 000 ₸']].map(s=>`<div class="stage"><span class="n">${s[0]}</span><div><b>${s[1]}</b><br><small>${s[2]}</small></div><b class="num">${s[3]}</b></div>`).join('')}</div></div>
 <div class="pan"><h3>Опция</h3><div class="pb">Интеграция с 1С — 800 000 ₸. Сервер, телефония и WhatsApp оплачиваются провайдерам напрямую.</div></div>`;

/* ===== действия ===== */
function apM(id){const a=AP.find(x=>x.id===id);if(!a)return;CURA=id;const p=PT[a.pt];openM(esc(p.n),`${a.h}:00 · ${esc(DOC[a.d].n)} · каб. ${DOC[a.d].cab} · ${a.f==='p'?'платно':'госзаказ'}`,
 `<div class="kv"><span>Поток</span><b>${FL(a.f)}</b><span>Услуга</span><b>${a.f==='p'?esc(SV[a.sv].n)+' — '+tg(SV[a.sv].p):'приём по госзаказу'}</b><span>Статус</span><b>${stN(a.st)}</b></div><div class="btns" style="margin-top:12px"><button class="bt" onclick="setSt('${id}','came')">Пришёл</button>${a.f==='p'&&a.st!=='paid'?`<button class="bt a" onclick="payM('${id}')">Оплата</button>`:''}<button class="bt" onclick="CURP='${a.pt}';closeM();go('pat')">Карточка</button></div>`)}
function setSt(id,s){const a=AP.find(x=>x.id===id);if(a&&a.st!=='paid')a.st=s;closeM();build();toast('Статус обновлён. Врач видит пациента в своём списке.')}
function newAp(d,h){const svs=Object.keys(SV).filter(k=>SV[k].d===d);openM('Новая запись',`${esc(DOC[d].n)} · ${h}:00 · каб. ${DOC[d].cab}`,
 `<label class="fld"><span>Пациент</span><select class="inp" id="na-p">${Object.keys(PT).map(k=>`<option value="${k}">${esc(PT[k].n)}</option>`).join('')}</select></label>
 <label class="fld"><span>Поток</span><select class="inp" id="na-f"><option value="p">Платно</option><option value="g">ГОБМП/ОСМС</option></select></label>
 <label class="fld"><span>Услуга (для платного)</span><select class="inp" id="na-s">${(svs.length?svs:['TER']).map(k=>`<option value="${k}">${esc(SV[k].n)} — ${tg(SV[k].p)}</option>`).join('')}</select></label>
 <button class="bt a" onclick="addAp('${d}','${h}')">Записать</button>`)}
function addAp(d,h){const v=id=>(document.getElementById(id)||{}).value;const pt=v('na-p')||'P2',f=v('na-f')||'p',sv=v('na-s')||'TER';if(AP.some(a=>a.d===d&&a.h===h)){closeM();return}
 AP.push({id:'A'+(AP.length+1),d,h,pt,f,sv:f==='p'?sv:'',st:'book'});closeM();build();toast(`Записан: <b>${esc(PT[pt].n)}</b>, ${h}:00. Пациенту ушло сообщение в WhatsApp с временем и кабинетом.`)}
function payM(id){const a=AP.find(x=>x.id===id);if(!a||!a.sv){closeM();return}openM('Оплата',`${esc(PT[a.pt].n)} · ${esc(SV[a.sv].n)} · ${tg(SV[a.sv].p)}`,`<div class="btns">${['Kaspi QR','Карта','Наличные'].map(m=>`<button class="bt a" onclick="pay('${id}','${m}')">${m}</button>`).join('')}</div>`)}
function pay(id,m){const a=AP.find(x=>x.id===id);if(!a||a.st==='paid'){closeM();return}a.st='paid';CASH.unshift({t:'11:'+String(40+CASH.length).padStart(2,'0'),pt:a.pt,sv:a.sv,m:m||'Kaspi QR',s:SV[a.sv].p});const l=LD.find(x=>x.st==='book');if(l)l.st='paid';closeM();build();toast(`Оплачено <b>${tg(SV[a.sv].p)}</b> (${m}). Сумма — в отчёте собственника, бонус продажнику начислен.`)}
function leadM(id){const l=LD.find(x=>x.id===id);if(!l)return;openM(esc(l.n),`${l.src} · ответственный: ${l.own}`,`<p style="margin-bottom:10px">${esc(l.need)}</p><div class="btns">${LST.map(([k,n])=>`<button class="bt s ${k===l.st?'p':''}" onclick="mvLead('${id}','${k}')">${n}</button>`).join('')}</div><div class="btns l"><button class="bt a" onclick="closeM();go('sched')">Записать в слот</button></div>`)}
function mvLead(id,s){const l=LD.find(x=>x.id===id);if(l)l.st=s;closeM();build();toast(s==='book'?'Записан. Пациенту ушло напоминание в WhatsApp.':'Заявка перемещена.')}
function newLead(){LD.unshift({id:'L'+(LD.length+1),n:'Новая заявка',src:'Instagram',need:'Узнать цену УЗИ',st:'new',own:'Айгерим',t:'сейчас'});build();toast('Заявка создана, ответственный — Айгерим. Если не ответит за 15 минут — напоминание.')}
function sendMsg(){const i=document.getElementById('msgi');CHATS[CH].m.push(['me',(i&&i.value)||'Спасибо!','сейчас']);build();toast('Сообщение отправлено в WhatsApp.')}
function callBack(i){const c=CALLS[i];if(!c||!c.miss)return;c.miss=false;c.who='Айгерим';c.dur='1:48';c.res='перезвонили, записан на УЗИ';LD.unshift({id:'L'+(LD.length+1),n:'Звонок '+c.n.slice(-5),src:'Звонок',need:'Перезвонили после пропущенного',st:'book',own:'Айгерим',t:'сейчас'});build();toast('Перезвонили — пациент записан, заявка появилась в воронке.')}
function refer(pt){LD.unshift({id:'L'+(LD.length+1),n:PT[pt].n.split(' ').slice(0,2).join(' '),src:'Врач',need:'Кардиолог рекомендует УЗИ без очереди',st:'call',own:'Данияр',t:'сейчас'});toast('Передано продажнику: он позвонит пациенту и предложит платный слот УЗИ. Навязывать не будет.')}
function sendOrder(){OSENT=true;build();toast('Заказ отправлен в центр. Закупщик видит строки, остатки и продажи по каждой аптеке.')}
function ship(){DR.forEach(d=>d.st.forEach((v,i)=>{if(v<d.min)d.st[i]=d.min*2}));OSHIP=true;build();toast('Центр отгрузил заказ. Остатки во всех аптеках обновились.')}
function newMove(){const d=DR[10];if(d.st[6]>=5){d.st[6]-=5;MOV.unshift({id:'ПМ-'+(113+MOV.length-2),k:'ENT',q:5,from:6,to:2,st:'в пути'})}build();toast(`Перемещение создано: Энтерофурил × 5, ${PH[6]} → ${PH[2]}.`)}
function accMove(id){const m=MOV.find(x=>x.id===id);if(!m||m.st==='принято')return;m.st='принято';DR.find(d=>d.k===m.k).st[m.to]+=m.q;build();toast(`${id} принято. Остаток в ${PH[m.to]} обновлён.`)}
function addCart(k){const c=CART.find(x=>x.k===k);if(c)c.q++;else CART.push({k,q:1});build()}
function sell(m){if(!CART.length){toast('Чек пустой — добавьте товар.');return}let t=0;CART.forEach(c=>{const d=DR.find(x=>x.k===c.k);d.st[CPH]=Math.max(0,d.st[CPH]-c.q);d.s30[CPH]+=c.q;t+=c.q*d.p});CART=[];build();toast(`Продано на <b>${tg(t)}</b> (${m}). Остаток аптеки уменьшился — центр видит это сразу.`)}
function xls(n){toast(`Файл «${esc(n)}» выгружен в Excel.`)}

/* ===== каркас ===== */
const TOUR=[['dash','Собственник: всё главное за месяц на одной странице'],['flows','Госзаказ и платно — раздельно, у каждой записи метка'],['mkt','Реклама: сколько стоит заявка и платящий пациент'],['funnel','Воронка: каждая заявка доведена до записи'],['calls','Пропущенные звонки — сверху, с кнопкой «Перезвонить»'],['sched','Платные слоты — жёлтые, их и продают'],['cash','Касса платного приёма'],['phd','7 аптек — остатки онлайн'],['order','Автозаказ в центр по минимумам'],['abc','Что продаётся, а что лежит'],['gov','Гос. системы не трогаем'],['launch','Стоимость и этапы']];
function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${v.av}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div><i>→</i></div>`).join('');document.getElementById('rsel').innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
function allowed(k){return ROLES[role].s.indexOf(k)>=0}
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');document.getElementById('rsel').value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;document.getElementById('rsel').value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){const sk=SECOF[cur];const low=lowCnt();
 document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>{const first=s.sub.find(x=>allowed(x[0]))[0];return `<a class="ri ${s.k===sk?'on':''}" onclick="go('${first}')">${s.n}${s.k==='ph'&&low?`<span class="cnt">${low}</span>`:''}${s.k==='sale'?`<span class="cnt">${LD.filter(l=>l.st==='new').length}</span>`:''}</a>`}).join('');
 const sec=SEC.find(s=>s.k===sk);document.getElementById('sub').innerHTML=`<h4>${sec.n}</h4>`+sec.sub.filter(x=>allowed(x[0])).map(x=>`<a class="si ${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('');
 document.getElementById('shint').textContent=sec.n.toUpperCase()+' · '+role+' · '+ROLES[role].n}
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
