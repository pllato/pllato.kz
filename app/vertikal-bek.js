/* ВЕРТИКАЛЬ — учёт проектов, времени сотрудников и себестоимости строительной компании (Бек, 25 человек).
   Демо-макет на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(n<0?'−':'')+(Math.round(Math.abs(n)/100000)/10).toString().replace('.',',')+' млн';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};
const dd=s=>{const [y,m,d]=s.split('-');return d+'.'+m};
const TODAY='2026-10-30',NOW='10:15';
const addDays=(s,n)=>new Date(new Date(s+'T00:00:00').getTime()+n*864e5).toISOString().slice(0,10);
const dow=s=>['вс','пн','вт','ср','чт','пт','сб'][new Date(s+'T00:00:00').getDay()];
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const hh=m=>Math.floor(m/60)+' ч'+(m%60?' '+String(m%60).padStart(2,'0')+' м':'');

const SEC=[
 {k:'day',n:'Сегодня',sub:[['today','Пульт руководителя','DSH'],['map','Где люди сейчас','MAP']]},
 {k:'proj',n:'Проекты',sub:[['projects','Все проекты','PRJ'],['project','Карточка проекта','CRD'],['gantt','График работ','GNT'],['tasks','Наряды и задачи','TSK']]},
 {k:'time',n:'Время',sub:[['time','Учёт времени сегодня','TIM'],['sheet','Табель за месяц','TBL'],['mobile','Отметка с телефона','MOB']]},
 {k:'people',n:'Люди',sub:[['staff','Сотрудники','STF'],['safety','Допуски и охрана труда','SAF']]},
 {k:'money',n:'Деньги',sub:[['cost','Себестоимость и маржа','CST'],['payroll','Зарплата','PAY'],['clients','Заказчики и оплаты','CLI'],['acts','Акты выполненных работ','ACT']]},
 {k:'supply',n:'Снабжение',sub:[['materials','Заявки на материалы','MAT'],['machines','Техника','MCH']]},
 {k:'sys',n:'Система',sub:[['c1','Обмен с 1С','1C'],['reports','Отчёты','REP'],['roles','Роли и права','ROL'],['launch','Запуск и стоимость','LNC']]}
];
const SECOF={},SUBN={},CODE={};
SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1];CODE[x[0]]=x[2]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));

const ROLES={
 'Руководитель':{av:'БК',n:'Бек',note:'Все проекты, люди, часы, деньги и маржа',s:ALL.slice()},
 'Руководитель проекта':{av:'АН',n:'Асхат Нуров',note:'Свои проекты: график, наряды, часы, бюджет, акты',s:['today','map','projects','project','gantt','tasks','time','sheet','staff','cost','acts','materials','machines','reports']},
 'Прораб':{av:'ЕР',n:'Ерлан · прораб',note:'Свой объект: кто вышел, наряды, приёмка, заявки на материалы',s:['map','project','tasks','time','mobile','safety','materials','machines']},
 'Рабочий':{av:'ДМ',n:'Данияр · монолитчик',note:'Телефон: отметка на объекте, свои наряды и часы',s:['mobile']},
 'Сметчик / ПТО':{av:'ЖС',n:'Жанар · ПТО',note:'Сметы, бюджет по этапам, акты выполненных работ',s:['projects','project','gantt','cost','acts','reports']},
 'Снабженец':{av:'СР',n:'Серик · снабжение',note:'Заявки на материалы, закуп, техника',s:['materials','machines','projects']},
 'Бухгалтер':{av:'ГЛ',n:'Гульнара',note:'Табель, зарплата, оплаты заказчиков, обмен с 1С',s:['sheet','payroll','clients','acts','c1','reports','staff']}
};
let role='Руководитель',cur='today',theme='dark';

/* ===== Проекты ===== */
let PROJECTS=[
 {id:'P1',n:'ЖК «Тау Самал», блок 3',k:'Монолитный каркас 12 этажей',cl:'ТОО «Тау Девелопмент»',pm:'АН',fore:'ЕР',addr:'мкр. Хан Тенгри, ул. Ахмади Ыскака',budget:186000000,labPlan:41000000,start:'2026-04-01',end:'2026-12-20',prog:62,st:'go',c:'#ff7a1a',
  stages:[['Фундамент',100,9800000,9600000],['Каркас 1–6 этажей',100,14500000,15900000],['Каркас 7–12 этажей',48,14200000,8100000],['Кладка',10,6300000,600000],['Кровля',0,2400000,0]]},
 {id:'P2',n:'БЦ «Нурлы», отделка 2–4 этажей',k:'Внутренняя отделка 3 200 м²',cl:'ТОО «Нурлы Пропертиз»',pm:'АН',fore:'МК',addr:'пр. Аль-Фараби, 77',budget:74000000,labPlan:21000000,start:'2026-09-01',end:'2027-01-31',prog:35,st:'go',c:'#3b82f6',
  stages:[['Демонтаж',100,1800000,1700000],['Перегородки ГКЛ',70,5200000,3900000],['Электрика',40,4600000,2100000],['Чистовая отделка',5,7400000,300000]]},
 {id:'P3',n:'Склад «LogiPark»',k:'Металлокаркас и сэндвич-панели 4 800 м²',cl:'ТОО «LogiPark Kazakhstan»',pm:'ТБ',fore:'НС',addr:'Илийский тракт, 12 км',budget:128000000,labPlan:26000000,start:'2026-05-15',end:'2026-11-30',prog:80,st:'risk',c:'#a855f7',
  stages:[['Фундамент',100,5100000,5400000],['Металлокаркас',100,8800000,10600000],['Стены и кровля',75,7600000,6900000],['Полы',30,4500000,1500000]]},
 {id:'P4',n:'Частный дом, Ремизовка',k:'Дом 340 м² под ключ',cl:'Частный заказчик',pm:'ТБ',fore:'МК',addr:'ул. Кожамкулова, 214',budget:42000000,labPlan:9800000,start:'2026-10-01',end:'2027-06-30',prog:15,st:'go',c:'#22c55e',
  stages:[['Фундамент',80,2100000,1500000],['Стены',0,3600000,0],['Кровля',0,1800000,0],['Инженерия',0,2300000,0]]},
 {id:'P5',n:'Школа № 12, кровля',k:'Капитальный ремонт кровли · госзаказ',cl:'ГУ «Отдел образования»',pm:'АН',fore:'НС',addr:'Турксибский район',budget:58000000,labPlan:12000000,start:'2026-07-01',end:'2026-11-10',prog:91,st:'late',c:'#f59e0b',
  stages:[['Демонтаж',100,1600000,1700000],['Основание',100,3900000,4300000],['Мембрана',85,4800000,4600000],['Водосток',40,1700000,800000]]}
];
const PR=id=>PROJECTS.find(p=>p.id===id)||PROJECTS[0];
const PST={go:['в графике','g'],risk:['перерасход труда','w'],late:['отстаёт от срока','r']};
let curP='P1';

/* ===== Сотрудники =====
 rate — ставка ₸ за час; pay: hour — почасовая, piece — сдельная, salary — оклад */
const RAW=[
 ['БК','Бек','Руководитель','office',0,'salary'],['АН','Асхат Нуров','Руководитель проекта','office',0,'salary'],['ТБ','Тимур Бекенов','Руководитель проекта','office',0,'salary'],
 ['ЖС','Жанар Сейтова','Сметчик / ПТО','office',0,'salary'],['СР','Серик Рахимов','Снабженец','office',0,'salary'],['ГЛ','Гульнара Ли','Бухгалтер','office',0,'salary'],
 ['ЕР','Ерлан Рысбеков','Прораб','P1',4200,'hour'],['МК','Марат Касымов','Прораб','P2',4200,'hour'],['НС','Нурлан Сарсенов','Прораб','P3',4200,'hour'],
 ['ДМ','Данияр Муратов','Монолитчик','P1',3200,'hour'],['АК','Айдар Каримов','Монолитчик','P1',3200,'hour'],['РЖ','Руслан Жумабеков','Арматурщик','P1',3000,'hour'],['БС','Бауыржан Садыков','Арматурщик','P1',3000,'hour'],
 ['ОТ','Олжас Тулеев','Сварщик','P3',3600,'hour'],['ВК','Виктор Ким','Сварщик','P3',3600,'hour'],['ЕА','Ербол Абенов','Монтажник','P3',3100,'hour'],
 ['ИП','Игорь Пак','Электрик','P2',3400,'hour'],['СМ','Санжар Мухтаров','Отделочник','P2',2900,'piece'],['АТ','Азамат Темиров','Отделочник','P2',2900,'piece'],['КЕ','Кайрат Ермеков','Плиточник','P2',3000,'piece'],
 ['ЖН','Жандос Нуриев','Кровельщик','P5',3100,'hour'],['ТС','Талгат Сулейменов','Кровельщик','P5',3100,'hour'],
 ['АБ','Алмас Бейсенов','Разнорабочий','P4',2200,'hour'],['ДЖ','Дастан Жаксылыков','Разнорабочий','P1',2200,'hour'],['МТ','Медет Тлеубаев','Водитель-экскаваторщик','P4',3300,'hour']
];
let STAFF=RAW.map((r,i)=>({id:r[0],n:r[1],pos:r[2],p:r[3],rate:r[4],pay:r[5],ph:'+7 70'+(1+i%7)+' '+(300+i*17)+' '+String(10+i*3).slice(-2)+' '+String(40+i*7).slice(-2),
 dop:addDays(TODAY,[-3,40,120,200,14,90][i%6])}));
const SF=id=>STAFF.find(s=>s.id===id)||STAFF[0];
const FIELD=()=>STAFF.filter(s=>s.p!=='office');

/* ===== Отметки сегодня ===== */
const MARKS={ЕР:['07:52','ok'],МК:['08:05','ok'],НС:['07:58','ok'],ДМ:['07:55','ok'],АК:['08:21','late'],РЖ:['07:59','ok'],БС:['','none'],ОТ:['08:00','ok'],ВК:['08:02','ok'],ЕА:['08:47','late'],ИП:['08:10','ok'],СМ:['08:03','ok'],АТ:['08:06','ok'],КЕ:['','sick'],ЖН:['07:49','ok'],ТС:['08:12','far'],АБ:['08:01','ok'],ДЖ:['07:57','ok'],МТ:['07:40','ok']};
const MST={ok:['на объекте','g'],late:['опоздал','w'],none:['не вышел','r'],sick:['больничный','i'],far:['отметка вне объекта','r']};
const minsSince=t=>{const [a,b]=t.split(':'),[c,d]=NOW.split(':');return (+c*60+ +d)-(+a*60+ +b)};

/* ===== Наряды ===== */
let TASKS=[
 {id:'N-1041',p:'P1',t:'Армирование плиты перекрытия 8 этажа',who:['РЖ','БС'],plan:32,fact:21,st:'go',due:'2026-10-31'},
 {id:'N-1042',p:'P1',t:'Бетонирование колонн 8 этажа, захватка 2',who:['ДМ','АК'],plan:24,fact:6,st:'go',due:'2026-11-02'},
 {id:'N-1039',p:'P1',t:'Опалубка стен лестничной клетки',who:['ДМ','ДЖ'],plan:16,fact:18,st:'check',due:'2026-10-29'},
 {id:'N-2017',p:'P2',t:'Перегородки ГКЛ, 3 этаж, оси 4–9',who:['СМ','АТ'],plan:40,fact:34,st:'go',due:'2026-11-03'},
 {id:'N-2018',p:'P2',t:'Электрика: разводка 3 этаж',who:['ИП'],plan:28,fact:12,st:'go',due:'2026-11-06'},
 {id:'N-3022',p:'P3',t:'Монтаж сэндвич-панелей, ось Г',who:['ОТ','ВК','ЕА'],plan:36,fact:41,st:'go',due:'2026-10-30',over:true},
 {id:'N-5009',p:'P5',t:'Мембрана, секция В',who:['ЖН','ТС'],plan:20,fact:14,st:'go',due:'2026-10-31'},
 {id:'N-4003',p:'P4',t:'Обратная засыпка фундамента',who:['МТ','АБ'],plan:12,fact:12,st:'done',due:'2026-10-28'}
];
const TST={go:['в работе','i'],check:['на приёмке','w'],done:['принят','g']};

/* ===== Материалы и техника ===== */
let MATS=[
 {id:'З-311',p:'P1',t:'Бетон В25, 48 м³',sum:1680000,who:'ЕР',st:'new',need:'2026-10-31'},
 {id:'З-309',p:'P1',t:'Арматура А500С Ø16, 6,2 т',sum:2790000,who:'ЕР',st:'buy',need:'2026-11-01'},
 {id:'З-305',p:'P2',t:'Профиль и ГКЛ на 3 этаж',sum:940000,who:'МК',st:'deliv',need:'2026-10-30'},
 {id:'З-302',p:'P3',t:'Саморезы кровельные, 40 000 шт',sum:310000,who:'НС',st:'done',need:'2026-10-27'},
 {id:'З-312',p:'P5',t:'Водосточная система, 120 м',sum:860000,who:'НС',st:'new',need:'2026-11-03'}
];
const MSTS={new:['новая','w'],buy:['закупается','i'],deliv:['в пути','i'],done:['на объекте','g']};
let MACH=[
 ['Автокран 25 т','аренда','P1',38000,7.5],['Экскаватор-погрузчик JCB','своя','P4',14000,6],['Бетононасос','аренда','P1',42000,4],['Леса рамные, 600 м²','своя','P2',0,0],['Газель','своя','—',6000,5.5]
];

/* ===== Заказчики и оплаты ===== */
let PAYIN=[
 {p:'P1',d:'2026-10-05',sum:24000000,what:'Аванс по этапу «Каркас 7–12»'},
 {p:'P3',d:'2026-10-12',sum:18500000,what:'Оплата по акту № 6'},
 {p:'P2',d:'2026-10-20',sum:11000000,what:'Аванс 15%'},
 {p:'P5',d:'2026-10-25',sum:9400000,what:'Оплата по акту № 3'}
];
let ACTS=[
 {no:'АВР-17',p:'P1',per:'октябрь',sum:16800000,st:'draft'},
 {no:'АВР-7',p:'P3',per:'октябрь',sum:21400000,st:'sent'},
 {no:'АВР-4',p:'P5',per:'октябрь',sum:7900000,st:'signed'},
 {no:'АВР-2',p:'P2',per:'октябрь',sum:6200000,st:'draft'}
];
const AST={draft:['черновик',''],sent:['у заказчика','w'],signed:['подписан','g']};

/* ===== Расчёт часов ===== */
// часы по проекту за месяц: сотрудники проекта × рабочие дни × ~9 ч, плюс переработки
function monthHours(id){const s=SF(id);if(s.p==='office')return 0;const d=21-(id.charCodeAt(0)%3);return d*9*60+((id.charCodeAt(1)%5)*60)}
function laborFact(pid){return STAFF.filter(s=>s.p===pid).reduce((a,s)=>a+monthHours(s.id)/60*s.rate,0)}
const stageSum=(p,i)=>p.stages.reduce((a,s)=>a+s[i],0);

const SC={};
const bar=(w,c)=>`<div class="bar"><i class="${c||''}" style="--w:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const prog=p=>{const pl=stageSum(p,2),f=p.stages.reduce((a,s)=>a+s[2]*s[1]/100,0);return {pl,fact:stageSum(p,3),earned:f}};

/* ===== Пульт руководителя ===== */
SC.today=()=>{
 const F=FIELD();const on=F.filter(s=>MARKS[s.id]&&['ok','late','far'].includes(MARKS[s.id][1])).length;
 const late=F.filter(s=>MARKS[s.id]&&MARKS[s.id][1]==='late');const none=F.filter(s=>MARKS[s.id]&&MARKS[s.id][1]==='none');const far=F.filter(s=>MARKS[s.id]&&MARKS[s.id][1]==='far');
 const tot=PROJECTS.reduce((a,p)=>a+p.budget,0);
 const al=[
  ['r','Склад «LogiPark»: труд дороже плана на 12%','Металлокаркас — 10,6 млн вместо 8,8 млн. Наряд N-3022 уже 41 ч из 36.',"openP('P3')"],
  ['r','Школа № 12 отстаёт: сдача 10 ноября','Готово 91%, водосток — 40%. Нужно +2 кровельщика на неделю.',"openP('P5')"],
  ['w',`${far.length} отметка вне объекта`,far.map(s=>s.n).join(', ')+' — отметился в 2,4 км от школы. Прораб уточняет.',"go('time')"],
  ['w',`${late.length} опоздали, ${none.length} не вышел`,late.concat(none).map(s=>s.n.split(' ')[0]).join(', ')+' — часы посчитаны с фактического прихода.',"go('time')"],
  ['w',`Допуск истёк: ${FIELD().filter(s=>s.dop<TODAY).length} чел.`,FIELD().filter(s=>s.dop<TODAY).map(s=>s.n).join(', ')+' — система не даст поставить на высотные работы.',"go('safety')"],
  ['i','2 заявки на материалы ждут решения','Бетон на 31.10 и водосток для школы — 2,5 млн.',"go('materials')"]
 ];
 return `<div class="hd"><div><h2>Пульт руководителя</h2><p>Пятница, 30 октября. Пять объектов, 25 человек: кто где работает, сколько часов ушло и во что это обходится — без звонков прорабам и Excel-табелей.</p></div><div class="btns"><button class="bt" onclick="go('map')">Где люди</button><button class="bt p" onclick="go('cost')">Маржа по проектам</button></div></div>
 <div class="kpi">
  <div><small>НА ОБЪЕКТАХ СЕЙЧАС</small><b>${on} из ${F.length}</b><span class="g">отметились с телефона</span></div>
  <div><small>ЧАСОВ СЕГОДНЯ</small><b>${Math.round(F.reduce((a,s)=>a+(MARKS[s.id]&&MARKS[s.id][0]?Math.max(0,minsSince(MARKS[s.id][0])):0),0)/60)} ч</b><span>к 18:00 будет ≈ 170 ч</span></div>
  <div><small>ПРОЕКТОВ В РАБОТЕ</small><b>${PROJECTS.length}</b><span>портфель ${mln(tot)} ₸</span></div>
  <div><small>ФОТ ОКТЯБРЯ</small><b>${mln(STAFF.reduce((a,s)=>a+monthHours(s.id)/60*s.rate,0)+6*650000)} ₸</b><span>по часам из системы</span></div>
  <div><small>МАРЖА ПОРТФЕЛЯ</small><b>21,4%</b><span class="w">план 24% · LogiPark тянет вниз</span></div>
 </div>
 <div class="g21"><div class="pan"><h3>Проекты сегодня</h3><p>Готовность, освоение бюджета на труд и люди на объекте.</p>
  ${PROJECTS.map(p=>{const g=prog(p);const ppl=FIELD().filter(s=>s.p===p.id&&MARKS[s.id]&&MARKS[s.id][0]).length;return `<div class="prow2" onclick="openP('${p.id}')"><i style="background:${p.c}"></i><div><b>${esc(p.n)}</b><span>${esc(p.k)} · ${ppl} чел. на объекте</span></div><div class="pr-b">${bar(p.prog,'b')}<small>готово ${p.prog}%</small></div><div class="pr-b">${bar(pct(g.fact,g.pl),g.fact>g.earned*1.05?'r':'g')}<small>труд ${pct(g.fact,g.pl)}% бюджета</small></div>${tag(PST[p.st][0],PST[p.st][1])}</div>`}).join('')}</div>
 <div class="pan"><h3>Требует решения</h3>${al.map(a=>`<div class="al ${a[0]}" onclick="${a[3]}"><b>${esc(a[1])}</b><span>${esc(a[2])}</span></div>`).join('')}</div></div>
 ${said('«25 человек в команде. Нужен учёт проектов и времени работы сотрудников.»','Каждый отмечается на объекте с телефона, часы ложатся на проект и этап, а из часов и ставок считается себестоимость — руководитель видит маржу каждого объекта в моменте, а не после сдачи.')}`};

/* ===== Где люди сейчас ===== */
SC.map=()=>{const pos={P1:[62,30],P2:[44,52],P3:[84,18],P4:[30,70],P5:[70,62]};
 return `<div class="hd"><div><h2>Где люди сейчас</h2><p>Отметка прихода с телефона проверяет геолокацию: человек должен быть в радиусе объекта. Отметка «вне объекта» сразу видна прорабу и руководителю.</p></div></div>
 <div class="g21"><div class="pan mapw"><svg viewBox="0 0 100 80" class="cmap"><path d="M0 40 Q30 34 50 44 T100 38" class="rd"/><path d="M40 0 Q46 40 38 80" class="rd"/><path d="M0 64 L100 58" class="rd2"/>
  ${PROJECTS.map(p=>{const [x,y]=pos[p.id];const n=FIELD().filter(s=>s.p===p.id&&MARKS[s.id]&&MARKS[s.id][0]).length;return `<g onclick="openP('${p.id}')" class="pin"><circle cx="${x}" cy="${y}" r="6" fill="${p.c}" opacity=".18"/><circle cx="${x}" cy="${y}" r="2.6" fill="${p.c}"/><text x="${x+4}" y="${y-3}">${esc(p.n.split(',')[0])}</text><text x="${x+4}" y="${y+1.5}" class="sm">${n} чел.</text></g>`}).join('')}
  <circle cx="58" cy="70" r="1.8" fill="#ef4444"/><text x="61" y="71" class="sm r">Талгат С. · вне объекта</text></svg></div>
 <div class="pan"><h3>По объектам</h3>${PROJECTS.map(p=>{const L=FIELD().filter(s=>s.p===p.id);return `<div class="obj"><b><i style="background:${p.c}"></i>${esc(p.n)}</b>${L.map(s=>{const m=MARKS[s.id]||['','none'];return `<div class="kv"><span>${esc(s.n)} · ${esc(s.pos.toLowerCase())}</span><b>${m[0]||'—'} ${tag(MST[m[1]][0],MST[m[1]][1])}</b></div>`}).join('')}</div>`}).join('')}</div></div>`};

/* ===== Проекты ===== */
SC.projects=()=>`<div class="hd"><div><h2>Все проекты</h2><p>Каждый объект — с бюджетом, графиком, командой и фактическими часами. Новый проект создаётся из сметы: этапы и бюджет на труд подтягиваются сами.</p></div><div class="btns"><button class="bt p" onclick="toast('Новый проект: заказчик, адрес, смета Excel → этапы и бюджет, руководитель, прораб.')">+ Проект</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Проект</th><th>Заказчик</th><th>Руководитель · прораб</th><th class="r">Бюджет</th><th>Готово</th><th>Труд: факт / план</th><th>Срок</th><th>Статус</th></tr></thead><tbody>${PROJECTS.map(p=>{const g=prog(p);return `<tr onclick="openP('${p.id}')"><td><b><i class="dot" style="background:${p.c}"></i>${esc(p.n)}</b><div class="mini">${esc(p.k)}</div></td><td>${esc(p.cl)}</td><td>${esc(SF(p.pm).n)}<div class="mini">${esc(SF(p.fore).n)}</div></td><td class="r mono">${mln(p.budget)}</td><td style="min-width:110px">${bar(p.prog,'b')}<span class="mini">${p.prog}%</span></td><td class="mono">${mln(g.fact)} / ${mln(g.pl)}</td><td class="mono">${dd(p.end)}.${p.end.slice(2,4)}</td><td>${tag(PST[p.st][0],PST[p.st][1])}</td></tr>`}).join('')}</tbody></table></div>`;
function openP(id){curP=id;go(allowed('project')?'project':'projects')}

/* ===== Карточка проекта ===== */
SC.project=()=>{const p=PR(curP);const g=prog(p);const team=FIELD().filter(s=>s.p===p.id);const T=TASKS.filter(t=>t.p===p.id);
 return `<div class="hd"><div><div class="crumbl"><a onclick="go('projects')">Проекты</a> / ${esc(p.n)}</div><h2>${esc(p.n)}</h2><p>${esc(p.k)} · ${esc(p.cl)} · ${esc(p.addr)} · ${dd(p.start)} — ${dd(p.end)}</p></div><div class="btns"><select class="rsel" onchange="openP(this.value)">${PROJECTS.map(x=>`<option value="${x.id}" ${x.id===p.id?'selected':''}>${esc(x.n)}</option>`).join('')}</select><button class="bt p" onclick="go('acts')">Акт за месяц</button></div></div>
 <div class="kpi"><div><small>БЮДЖЕТ ПРОЕКТА</small><b>${mln(p.budget)} ₸</b><span>по договору</span></div><div><small>ГОТОВНОСТЬ</small><b>${p.prog}%</b><span>по этапам</span></div><div><small>ТРУД ПО ПЛАНУ</small><b>${mln(g.pl)} ₸</b><span>заложено в смете</span></div><div><small>ТРУД ФАКТ</small><b class="${g.fact>g.earned*1.05?'r':''}">${mln(g.fact)} ₸</b><span>${g.fact>g.earned*1.05?'дороже выполненного объёма':'в пределах объёма'}</span></div><div><small>КОМАНДА</small><b>${team.length} чел.</b><span>прораб ${esc(SF(p.fore).n.split(' ')[0])}</span></div></div>
 <div class="pan"><h3>Этапы: выполнено и сколько стоил труд</h3><p>Освоено — сколько труда «заработано» выполненным объёмом. Если факт больше освоенного — этап идёт дороже сметы.</p><div class="tw"><table class="t"><thead><tr><th>Этап</th><th>Готово</th><th class="r">Труд по смете</th><th class="r">Освоено</th><th class="r">Факт по часам</th><th class="r">Отклонение</th></tr></thead><tbody>${p.stages.map(s=>{const e=s[2]*s[1]/100,d=s[3]-e;return `<tr><td><b>${esc(s[0])}</b></td><td style="min-width:120px">${bar(s[1],'b')}<span class="mini">${s[1]}%</span></td><td class="r mono">${tg(s[2])}</td><td class="r mono">${tg(e)}</td><td class="r mono">${tg(s[3])}</td><td class="r mono ${d>e*0.05&&d>0?'red':'grn'}">${d>0?'+':''}${tg(d)}</td></tr>`}).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Наряды</h3>${T.map(t=>`<div class="kv"><span><b>${t.id}</b> ${esc(t.t)}<br><small class="mini">${t.who.map(w=>SF(w).n.split(' ')[0]).join(', ')} · до ${dd(t.due)}</small></span><b>${t.fact} / ${t.plan} ч</b></div>`).join('')||'<p class="mini">Нарядов нет.</p>'}</div>
 <div class="pan"><h3>Команда сегодня</h3>${team.map(s=>{const m=MARKS[s.id]||['','none'];return `<div class="kv"><span>${esc(s.n)} · ${esc(s.pos.toLowerCase())}</span><b>${m[0]||'—'} ${tag(MST[m[1]][0],MST[m[1]][1])}</b></div>`}).join('')}</div></div>`};

/* ===== График ===== */
SC.gantt=()=>{const a=new Date('2026-04-01'),b=new Date('2027-07-01'),W=b-a;const x=d=>((new Date(d)-a)/W*100);const months=['апр','май','июн','июл','авг','сен','окт','ноя','дек','янв','фев','мар','апр','май','июн'];
 return `<div class="hd"><div><h2>График работ</h2><p>Все проекты на одной шкале: сроки договоров, готовность и сегодняшний день. Отставание видно до того, как заказчик позвонит.</p></div></div>
 <div class="pan gnt"><div class="gm">${months.map(m=>`<span>${m}</span>`).join('')}</div>${PROJECTS.map(p=>`<div class="gr" onclick="openP('${p.id}')"><b>${esc(p.n)}</b><div class="gl"><i style="left:${x(p.start)}%;width:${x(p.end)-x(p.start)}%;background:${p.c}33;border-color:${p.c}"><em style="width:${p.prog}%;background:${p.c}"></em></i></div></div>`).join('')}<div class="gtoday" style="left:calc(220px + (100% - 220px) * ${x(TODAY)/100})"><span>сегодня</span></div></div>
 <div class="pan"><h3>Этапы проекта «${esc(PR(curP).n)}»</h3>${PR(curP).stages.map(s=>`<div class="hl"><span>${esc(s[0])}</span>${bar(s[1],'b')}<b>${s[1]}%</b></div>`).join('')}</div>`};

/* ===== Наряды и задачи ===== */
SC.tasks=()=>`<div class="hd"><div><h2>Наряды и задачи</h2><p>Прораб выдаёт наряд бригаде с плановыми часами. Рабочие отмечают время на наряде в телефоне. Приёмка — с фото. Перерасход часов виден сразу.</p></div><div class="btns"><button class="bt p" onclick="newTask()">+ Наряд</button></div></div>
 <div class="board">${Object.entries(TST).map(([k,v])=>{const L=TASKS.filter(t=>t.st===k);return `<div class="bcol"><div class="bh"><b>${v[0]}</b><span>${L.length}</span></div>${L.map(t=>`<div class="oc ${t.fact>t.plan?'over':''}" onclick="advTask('${t.id}')"><small>${t.id} · ${esc(PR(t.p).n.split(',')[0])}</small><b>${esc(t.t)}</b><span>${t.who.map(w=>SF(w).n.split(' ')[0]).join(', ')} · до ${dd(t.due)}</span>${bar(pct(t.fact,t.plan),t.fact>t.plan?'r':'g')}<em>${t.fact} из ${t.plan} ч${t.fact>t.plan?' · перерасход':''}</em></div>`).join('')}</div>`}).join('')}</div>
 <p class="mini">Нажмите на наряд — он перейдёт на следующий этап: в работе → на приёмке → принят.</p>`;
function advTask(id){const t=TASKS.find(x=>x.id===id);t.st=t.st==='go'?'check':t.st==='check'?'done':'done';render();toast(t.st==='check'?`${t.id} отправлен на приёмку — прорабу пришло уведомление с фото.`:`${t.id} принят. Часы закрыты на этап, сдельщикам начислено.`)}
function newTask(){TASKS.unshift({id:'N-'+(1050+TASKS.length),p:'P1',t:'Монтаж опалубки плиты 9 этажа',who:['ДМ','АК','ДЖ'],plan:30,fact:0,st:'go',due:addDays(TODAY,4)});render();toast('Наряд выдан бригаде: у троих рабочих он появился в телефоне.')}

/* ===== Учёт времени сегодня ===== */
SC.time=()=>{const F=FIELD();
 return `<div class="hd"><div><h2>Учёт времени сегодня</h2><p>Приход и уход — с телефона на объекте: геолокация и фото. Опоздания, отметки вне объекта и переработки считаются сами. Прораб может поправить отметку — с причиной в журнале.</p></div><div class="btns"><button class="bt" onclick="toast('Табель за день выгружен в Excel.')">Excel</button><button class="bt p" onclick="go('sheet')">Табель за месяц</button></div></div>
 <div class="kpi">${Object.entries(MST).map(([k,v])=>`<div><small>${v[0].toUpperCase()}</small><b class="${v[1]==='r'?'r':''}">${F.filter(s=>(MARKS[s.id]||['','none'])[1]===k).length}</b><span>человек</span></div>`).join('')}</div>
 <div class="tw"><table class="t"><thead><tr><th>Сотрудник</th><th>Объект</th><th>Пришёл</th><th>Проверка</th><th class="r">Отработано</th><th>Наряд</th><th></th></tr></thead><tbody>${F.map(s=>{const m=MARKS[s.id]||['','none'];const t=TASKS.find(x=>x.who.includes(s.id)&&x.st!=='done');return `<tr><td><b>${esc(s.n)}</b><div class="mini">${esc(s.pos)} · ${s.pay==='piece'?'сдельно':tg(s.rate)+'/ч'}</div></td><td>${esc(PR(s.p).n.split(',')[0])}</td><td class="mono">${m[0]||'—'}</td><td>${tag(MST[m[1]][0],MST[m[1]][1])}${m[1]==='ok'||m[1]==='late'?' <span class="mini">гео ✓ фото ✓</span>':''}</td><td class="r mono">${m[0]?hh(Math.max(0,minsSince(m[0]))):'—'}</td><td class="mini">${t?t.id+' · '+esc(t.t.slice(0,34))+'…':'—'}</td><td>${m[1]==='far'||m[1]==='none'?`<button class="bt sm" onclick="fixMark('${s.id}')">Поправить</button>`:''}</td></tr>`}).join('')}</tbody></table></div>`};
function fixMark(id){const s=SF(id);MARKS[id]=[MARKS[id][0]||'09:30','ok'];render();toast(`${esc(s.n)}: отметка подтверждена прорабом с причиной «работал на складе материалов» — запись в журнале.`)}

/* ===== Табель за месяц ===== */
let sheetP='all';
SC.sheet=()=>{const days=[];for(let i=1;i<=30;i++){const d='2026-10-'+String(i).padStart(2,'0');days.push(d)}
 const L=FIELD().filter(s=>sheetP==='all'||s.p===sheetP);
 const cell=(s,d,i)=>{const w=dow(d);if(w==='вс')return ['','off'];if(d>TODAY)return ['',''];const k=(s.id.charCodeAt(0)+i*7)%23;if(s.id==='КЕ'&&i>25)return ['Б','sick'];if(k===3)return ['Н','abs'];const h=w==='сб'?6:k%5===0?10:9;return [h,h>9?'ot':'']};
 return `<div class="hd"><div><h2>Табель за октябрь</h2><p>Собирается сам из отметок с телефона. Часы раскладываются по проектам. Переработки выделены, больничные и прогулы отмечены. Табель уходит в 1С и в расчёт зарплаты.</p></div><div class="btns"><select class="rsel" onchange="sheetP=this.value;render()"><option value="all">Все объекты</option>${PROJECTS.map(p=>`<option value="${p.id}" ${p.id===sheetP?'selected':''}>${esc(p.n)}</option>`).join('')}</select><button class="bt p" onclick="toast('Табель утверждён и отправлен в 1С.')">Утвердить и в 1С</button></div></div>
 <div class="tw sheet"><table class="t tb"><thead><tr><th class="st">Сотрудник</th>${days.map(d=>`<th class="c ${dow(d)==='вс'?'we':''}">${d.slice(8)}<small>${dow(d)}</small></th>`).join('')}<th class="r">Часы</th><th class="r">Перераб.</th></tr></thead><tbody>${L.map(s=>{let t=0,o=0;const c=days.map((d,i)=>{const [v,k]=cell(s,d,i);if(typeof v==='number'){t+=v;if(v>8)o+=v-8}return `<td class="c ${k}">${v}</td>`}).join('');return `<tr><td class="st"><b>${esc(s.n)}</b><div class="mini">${esc(PR(s.p).n.split(',')[0])}</div></td>${c}<td class="r mono"><b>${t}</b></td><td class="r mono">${o}</td></tr>`}).join('')}</tbody></table></div>
 <div class="legend"><span><i class="ot"></i>переработка</span><span><i class="sick"></i>Б — больничный</span><span><i class="abs"></i>Н — неявка</span><span><i class="we"></i>выходной</span></div>`};

/* ===== Отметка с телефона ===== */
let mobIn=false,mobTask='N-1042';
SC.mobile=()=>{const me=SF('ДМ');const T=TASKS.filter(t=>t.who.includes('ДМ'));
 return `<div class="hd"><div><h2>Отметка с телефона</h2><p>Рабочему не нужно ничего, кроме телефона: открыл ссылку — нажал «Я на объекте». Система проверит, что он в радиусе 300 м от объекта, попросит фото и засчитает время на выбранный наряд.</p></div></div>
 <div class="phones"><div class="ph"><div class="pht"><span>9:41</span><b>ВЕРТИКАЛЬ</b><span>●●●</span></div><div class="pb">
  <div class="phh"><small>ДОБРОЕ УТРО</small><b>${esc(me.n.split(' ')[0])}</b><span>Монолитчик · ЖК «Тау Самал»</span></div>
  <div class="geo ${mobIn?'on':''}"><i></i><div><b>${mobIn?'Вы на объекте с 07:55':'Вы в 120 м от объекта'}</b><span>${mobIn?'Отработано сегодня: '+hh(minsSince('07:55')):'Радиус отметки — 300 м'}</span></div></div>
  <button class="pbig ${mobIn?'out':''}" onclick="mobIn=!mobIn;render();toast(mobIn?'Приход отмечен: геолокация совпала, фото принято. Время идёт на наряд '+mobTask+'.':'Уход отмечен. За день: 9 ч 05 м, из них 1 ч 05 м переработка — прораб подтвердит.')">${mobIn?'Ушёл с объекта':'Я на объекте · сделать фото'}</button>
  <small class="phl">НАРЯД НА СЕГОДНЯ</small>${T.map(t=>`<div class="pt ${t.id===mobTask?'on':''}" onclick="mobTask='${t.id}';render()"><b>${esc(t.t)}</b><span>${t.fact} из ${t.plan} ч · до ${dd(t.due)}</span></div>`).join('')}
  <small class="phl">МОИ ЧАСЫ В ОКТЯБРЕ</small><div class="pkv"><span>Отработано</span><b>196 ч</b></div><div class="pkv"><span>Переработки</span><b>14 ч</b></div><div class="pkv"><span>Начислено</span><b>${tg(196*3200+14*1600)}</b></div>
 </div></div>
 <div class="pan" style="max-width:520px"><h3>Как защищены отметки</h3>${[['Геолокация','отметка только в радиусе объекта; вне радиуса — «на проверку»'],['Фото','селфи при приходе — нельзя отметиться за другого'],['Без интернета','отметка сохраняется и уходит, когда появится сеть'],['Правка','только прораб и только с причиной — всё в журнале'],['Телефон','обычный браузер, ставится на экран как приложение']].map(x=>`<div class="kv"><span>${x[0]}</span><b class="wrapb">${x[1]}</b></div>`).join('')}</div></div>`};

/* ===== Сотрудники ===== */
SC.staff=()=>`<div class="hd"><div><h2>Сотрудники</h2><p>25 человек: офис и объекты. У каждого — должность, ставка и способ оплаты (почасовая, сдельная, оклад), текущий объект и допуски.</p></div><div class="btns"><button class="bt p" onclick="toast('Новый сотрудник: ФИО, ИИН, должность, ставка, объект — данные уходят в 1С.')">+ Сотрудник</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Сотрудник</th><th>Должность</th><th>Объект</th><th>Оплата</th><th class="r">Часов в октябре</th><th>Допуск до</th><th>Телефон</th></tr></thead><tbody>${STAFF.map(s=>`<tr><td><b>${esc(s.n)}</b></td><td>${esc(s.pos)}</td><td>${s.p==='office'?'офис':esc(PR(s.p).n.split(',')[0])}</td><td>${s.pay==='salary'?'оклад':s.pay==='piece'?'сдельно':tg(s.rate)+' / ч'}</td><td class="r mono">${s.p==='office'?'—':Math.round(monthHours(s.id)/60)}</td><td class="mono ${s.dop<TODAY?'red':''}">${s.p==='office'?'—':dd(s.dop)}</td><td class="mono mini">${s.ph}</td></tr>`).join('')}</tbody></table></div>`;

/* ===== Допуски и охрана труда ===== */
SC.safety=()=>{const F=FIELD();const ex=F.filter(s=>s.dop<TODAY),soon=F.filter(s=>s.dop>=TODAY&&s.dop<=addDays(TODAY,30));
 return `<div class="hd"><div><h2>Допуски и охрана труда</h2><p>Инструктажи, допуски к высотным и сварочным работам, медосмотры, выдача СИЗ. Человека с просроченным допуском система не поставит в наряд на опасные работы.</p></div></div>
 <div class="kpi"><div><small>ПРОСРОЧЕНО</small><b class="r">${ex.length}</b><span>${ex.map(s=>s.n.split(' ')[0]).join(', ')}</span></div><div><small>ИСТЕКАЕТ ЗА 30 ДНЕЙ</small><b>${soon.length}</b><span>напоминание инженеру ОТ</span></div><div><small>ИНСТРУКТАЖ СЕГОДНЯ</small><b>19 / 19</b><span>подписали в телефоне</span></div><div><small>СИЗ ВЫДАНО</small><b>25</b><span>каски, пояса, перчатки</span></div><div><small>ДНЕЙ БЕЗ ТРАВМ</small><b class="g">214</b><span></span></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Сотрудник</th><th>Допуск</th><th>До</th><th>Медосмотр</th><th>Статус</th></tr></thead><tbody>${F.map(s=>`<tr><td><b>${esc(s.n)}</b><div class="mini">${esc(s.pos)}</div></td><td>${/Свар/.test(s.pos)?'сварочные работы':/Кров|Монол|Армат|Монтаж/.test(s.pos)?'работы на высоте':'общий'}</td><td class="mono">${dd(s.dop)}</td><td class="mono">${dd(addDays(s.dop,60))}</td><td>${s.dop<TODAY?tag('просрочен','r'):s.dop<=addDays(TODAY,30)?tag('скоро истекает','w'):tag('в порядке','g')}</td></tr>`).join('')}</tbody></table></div>`};

/* ===== Себестоимость и маржа ===== */
const COST={P1:[86.2,9.4,6.1,0],P2:[18.9,2.6,0.4,3.2],P3:[61.3,7.1,4.8,8.4],P4:[6.8,1.2,1.9,0],P5:[29.4,3.1,0.9,0]};
SC.cost=()=>{const R=PROJECTS.map(p=>{const g=prog(p);const c=COST[p.id];const lab=g.fact/1e6;const tot=c[0]+lab+c[1]+c[2]+c[3];const earned=p.budget/1e6*p.prog/100;return {p,lab,c,tot,earned,m:pct(earned-tot,earned)}});
 return `<div class="hd"><div><h2>Себестоимость и маржа</h2><p>Себестоимость проекта собирается из того, что и так вводится в работе: часы × ставки, материалы по заявкам, техника по моточасам, субподряд по актам. Маржа считается от выполненного объёма — видно, какой объект зарабатывает, а какой съедает прибыль.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Проект</th><th class="r">Выполнено на</th><th class="r">Материалы</th><th class="r">Труд</th><th class="r">Накладные</th><th class="r">Техника</th><th class="r">Субподряд</th><th class="r">Себестоимость</th><th class="r">Маржа</th></tr></thead><tbody>${R.map(r=>`<tr onclick="openP('${r.p.id}')"><td><b><i class="dot" style="background:${r.p.c}"></i>${esc(r.p.n)}</b></td><td class="r mono">${r.earned.toFixed(1)}</td><td class="r mono">${r.c[0].toFixed(1)}</td><td class="r mono">${r.lab.toFixed(1)}</td><td class="r mono">${r.c[1].toFixed(1)}</td><td class="r mono">${r.c[2].toFixed(1)}</td><td class="r mono">${r.c[3].toFixed(1)}</td><td class="r mono"><b>${r.tot.toFixed(1)}</b></td><td class="r mono"><b class="${r.m<15?'red':'grn'}">${r.m}%</b></td></tr>`).join('')}</tbody></table><p class="mini" style="padding:6px 10px">Суммы — млн ₸, нарастающим итогом.</p></div>
 <div class="g2"><div class="pan"><h3>Куда уходит труд · LogiPark</h3>${PR('P3').stages.map(s=>`<div class="hl"><span>${esc(s[0])}</span>${bar(pct(s[3],s[2]),s[3]>s[2]?'r':'g')}<b>${pct(s[3],s[2])}%</b></div>`).join('')}<p class="mini">Металлокаркас: +1,8 млн к смете. Причина в нарядах — переделка узлов по оси Г (41 ч вместо 36).</p></div>
 <div class="pan"><h3>Цена часа по должностям</h3>${[...new Set(FIELD().map(s=>s.pos))].map(pos=>{const L=FIELD().filter(s=>s.pos===pos);return `<div class="kv"><span>${esc(pos)} · ${L.length}</span><b>${tg(L[0].rate)}</b></div>`}).join('')}<p class="mini">С налогами и отчислениями работодателя час обходится в ×1,22 — коэффициент задаётся в настройках.</p></div></div>`};

/* ===== Зарплата ===== */
SC.payroll=()=>{const F=FIELD().map(s=>{const h=monthHours(s.id)/60;const ot=Math.max(0,h-176);const base=s.pay==='piece'?TASKS.filter(t=>t.who.includes(s.id)).reduce((a,t)=>a+t.fact,0)*s.rate*4.6:Math.min(h,176)*s.rate;const otp=ot*s.rate*1.5;const adv=150000;return {s,h,ot,base,otp,adv,tot:base+otp-adv}});
 return `<div class="hd"><div><h2>Зарплата · октябрь</h2><p>Почасовым — часы из табеля × ставка, переработки × 1,5. Сдельщикам — по принятым нарядам. Минус аванс и удержания. Ведомость уходит в 1С, где считаются налоги и выплата.</p></div><div class="btns"><button class="bt" onclick="toast('Расчётные листки отправлены сотрудникам в телефон.')">Расчётные листки</button><button class="bt p" onclick="go('c1')">Отправить в 1С</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Сотрудник</th><th>Оплата</th><th class="r">Часы</th><th class="r">Перераб.</th><th class="r">Начислено</th><th class="r">Переработки</th><th class="r">Аванс</th><th class="r">К выплате</th></tr></thead><tbody>${F.map(r=>`<tr><td><b>${esc(r.s.n)}</b><div class="mini">${esc(r.s.pos)}</div></td><td>${r.s.pay==='piece'?'сдельно':tg(r.s.rate)+'/ч'}</td><td class="r mono">${Math.round(r.h)}</td><td class="r mono">${Math.round(r.ot)}</td><td class="r mono">${tg(r.base)}</td><td class="r mono">${tg(r.otp)}</td><td class="r mono">−${tg(r.adv)}</td><td class="r mono"><b>${tg(r.tot)}</b></td></tr>`).join('')}<tr class="total"><td colspan="7">Итого по объектам (офис — оклады в 1С)</td><td class="r">${tg(F.reduce((a,r)=>a+r.tot,0))}</td></tr></tbody></table></div>`};

/* ===== Заказчики и оплаты ===== */
SC.clients=()=>`<div class="hd"><div><h2>Заказчики и оплаты</h2><p>По каждому проекту: сумма договора, сколько выполнено по актам, сколько оплачено и сколько должен заказчик.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Заказчик · проект</th><th class="r">Договор</th><th class="r">Выполнено</th><th class="r">Оплачено</th><th class="r">Долг заказчика</th></tr></thead><tbody>${PROJECTS.map((p,i)=>{const done=p.budget*p.prog/100;const paid=done*[0.82,0.9,0.7,1.1,0.86][i];return `<tr onclick="openP('${p.id}')"><td><b>${esc(p.cl)}</b><div class="mini">${esc(p.n)}</div></td><td class="r mono">${mln(p.budget)}</td><td class="r mono">${mln(done)}</td><td class="r mono">${mln(paid)}</td><td class="r mono ${done-paid>0?'red':'grn'}">${done-paid>0?mln(done-paid):'аванс '+mln(paid-done)}</td></tr>`}).join('')}</tbody></table></div>
 <div class="pan"><h3>Поступления в октябре</h3>${PAYIN.map(x=>`<div class="kv"><span>${dd(x.d)} · ${esc(PR(x.p).cl)} · ${esc(x.what)}</span><b>${tg(x.sum)}</b></div>`).join('')}</div>`;

/* ===== Акты ===== */
SC.acts=()=>`<div class="hd"><div><h2>Акты выполненных работ</h2><p>Акт за месяц собирается из выполненных объёмов по этапам: сметчик проверяет, отправляет заказчику, отмечает подпись. Подписанный акт уходит в 1С как реализация.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>№</th><th>Проект</th><th>Период</th><th class="r">Сумма</th><th>Статус</th><th></th></tr></thead><tbody>${ACTS.map((a,i)=>`<tr><td class="mono">${a.no}</td><td><b>${esc(PR(a.p).n)}</b><div class="mini">${esc(PR(a.p).cl)}</div></td><td>${a.per}</td><td class="r mono">${tg(a.sum)}</td><td>${tag(AST[a.st][0],AST[a.st][1])}</td><td>${a.st!=='signed'?`<button class="bt sm" onclick="advAct(${i})">${a.st==='draft'?'Отправить заказчику':'Отметить подпись'}</button>`:''}</td></tr>`).join('')}</tbody></table></div>`;
function advAct(i){const a=ACTS[i];a.st=a.st==='draft'?'sent':'signed';render();toast(a.st==='sent'?`${a.no} отправлен заказчику в PDF.`:`${a.no} подписан — реализация ушла в 1С, долг заказчика обновлён.`)}

/* ===== Заявки на материалы ===== */
SC.materials=()=>`<div class="hd"><div><h2>Заявки на материалы</h2><p>Прораб создаёт заявку с телефона, снабженец закупает, прораб подтверждает приход на объект. Сумма сразу ложится в себестоимость проекта.</p></div><div class="btns"><button class="bt p" onclick="MATS.unshift({id:'З-3'+(13+MATS.length),p:'P2',t:'Шпаклёвка финишная, 80 мешков',sum:384000,who:'МК',st:'new',need:addDays(TODAY,3)});render();toast('Заявка создана прорабом — снабженцу пришло уведомление.')">+ Заявка</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>№</th><th>Проект</th><th>Что</th><th>Прораб</th><th>Нужно к</th><th class="r">Сумма</th><th>Статус</th><th></th></tr></thead><tbody>${MATS.map((m,i)=>`<tr><td class="mono">${m.id}</td><td>${esc(PR(m.p).n.split(',')[0])}</td><td><b>${esc(m.t)}</b></td><td>${esc(SF(m.who).n)}</td><td class="mono">${dd(m.need)}</td><td class="r mono">${tg(m.sum)}</td><td>${tag(MSTS[m.st][0],MSTS[m.st][1])}</td><td>${m.st!=='done'?`<button class="bt sm" onclick="advMat(${i})">Дальше</button>`:''}</td></tr>`).join('')}</tbody></table></div>`;
function advMat(i){const o=['new','buy','deliv','done'];const m=MATS[i];m.st=o[o.indexOf(m.st)+1];render();toast(`${m.id}: ${MSTS[m.st][0]}.${m.st==='done'?' Сумма списана на проект.':''}`)}

/* ===== Техника ===== */
SC.machines=()=>`<div class="hd"><div><h2>Техника</h2><p>Своя и арендованная: на каком объекте, сколько моточасов сегодня, во сколько обходится. Стоимость автоматически распределяется на проекты.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Техника</th><th>Тип</th><th>Объект</th><th class="r">Моточасов сегодня</th><th class="r">Цена часа</th><th class="r">Сегодня</th></tr></thead><tbody>${MACH.map(m=>`<tr><td><b>${esc(m[0])}</b></td><td>${m[1]}</td><td>${m[2]==='—'?'на базе':esc(PR(m[2]).n.split(',')[0])}</td><td class="r mono">${m[4]}</td><td class="r mono">${m[3]?tg(m[3]):'—'}</td><td class="r mono">${tg(m[3]*m[4])}</td></tr>`).join('')}</tbody></table></div>`;

/* ===== 1С ===== */
SC.c1=()=>`<div class="hd"><div><h2>Обмен с 1С</h2><p>Учёт работы — в системе, бухгалтерия — в 1С. Обмен двусторонний: что куда идёт, видно в журнале. Двойного ввода нет.</p></div><div class="btns"><button class="bt p" onclick="toast('Обмен выполнен: 19 табелей, 4 акта, 3 поступления. Ошибок нет.')">Обменяться сейчас</button></div></div>
 <div class="g2"><div class="pan"><h3>Из системы в 1С</h3>${[['Табель','часы по сотрудникам за месяц'],['Начисления','почасовые, сдельные, переработки'],['Акты выполненных работ','как реализация по договору'],['Поступления материалов','по закрытым заявкам']].map(x=>`<div class="kv"><span>${x[0]}</span><b class="wrapb">${x[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Из 1С в систему</h3>${[['Сотрудники','ФИО, ИИН, должность, приём и увольнение'],['Контрагенты','заказчики и поставщики'],['Оплаты','поступления от заказчиков, оплаты поставщикам'],['Номенклатура','материалы и цены закупки']].map(x=>`<div class="kv"><span>${x[0]}</span><b class="wrapb">${x[1]}</b></div>`).join('')}</div></div>
 <div class="pan"><h3>Журнал обмена</h3>${[['30.10 09:00','Получено 3 поступления от заказчиков','ok'],['29.10 18:30','Отправлен табель за 29.10 · 19 человек','ok'],['28.10 18:30','Акт АВР-4 · ГУ «Отдел образования»','ok'],['27.10 18:30','Сотрудник «Кайрат Ермеков» — больничный из 1С','ok']].map(x=>`<div class="li"><i>${x[0].slice(0,5)}</i><span>${x[1]}</span></div>`).join('')}</div>`;

/* ===== Отчёты ===== */
SC.reports=()=>`<div class="hd"><div><h2>Отчёты</h2><p>Всё, что сейчас собирается вручную из табелей и Excel, — кнопкой. Руководителю каждый вечер приходит короткая сводка в WhatsApp.</p></div></div>
 <div class="rgrid">${[['Часы по проектам','сколько часов и денег ушло на каждый объект и этап'],['Производительность бригад','план и факт часов по нарядам'],['Опоздания и прогулы','по сотрудникам за период'],['Переработки','кто, где и сколько'],['Маржа по проектам','выполнено, себестоимость, маржа'],['Дебиторка','долги заказчиков по актам'],['Материалы','заявки и закуп по объектам'],['Вечерняя сводка','люди, часы, проблемы — в WhatsApp в 19:00']].map(x=>`<div class="rep" onclick="toast('Отчёт «${x[0]}» сформирован — можно открыть или выгрузить в Excel.')"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div>`;

/* ===== Роли ===== */
SC.roles=()=>`<div class="hd"><div><h2>Роли и права</h2><p>Каждый видит только своё: рабочий — телефон, прораб — свой объект, бухгалтер — табель и деньги.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Раздел</th>${Object.keys(ROLES).map(r=>`<th class="c">${esc(r)}</th>`).join('')}</tr></thead><tbody>${SEC.map(s=>s.sub.map(x=>`<tr><td>${esc(x[1])}</td>${Object.values(ROLES).map(r=>`<td class="c">${r.s.includes(x[0])?'<i class="ck"></i>':''}</td>`).join('')}</tr>`).join('')).join('')}</tbody></table></div>`;

/* ===== Запуск и стоимость ===== */
SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Система разрабатывается под вашу компанию, без абонентской платы и лимитов на сотрудников и проекты. Код и данные — ваши.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Что</th><th class="r">Цена</th><th class="r">Скидка</th><th class="r">Итого</th></tr></thead><tbody>
  <tr><td><b>Система учёта проектов и времени</b><div class="mini">всё, что в демо, + мобильная отметка для рабочих</div></td><td class="r mono">12 000 000</td><td class="r mono">−1 200 000 (10%)</td><td class="r mono"><b>10 800 000 ₸</b></td></tr>
  <tr><td><b>Интеграция с 1С</b><div class="mini">табель, начисления, акты, оплаты, сотрудники</div></td><td class="r mono">800 000</td><td class="r mono">−300 000</td><td class="r mono"><b>500 000 ₸</b></td></tr>
  <tr class="total"><td>Итого</td><td class="r">12 800 000</td><td class="r">−1 500 000</td><td class="r">11 300 000 ₸</td></tr></tbody></table></div>
 <div class="g2"><div class="pan"><h3>Оплата</h3>${[['10% · после договора','1 130 000 ₸'],['45% · после запуска ядра','5 085 000 ₸'],['45% · после полной сдачи','5 085 000 ₸']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>После запуска</h3>${[['Исправление ошибок','3 месяца бесплатно'],['Сервер','от 10 000 ₸ в месяц'],['Доработки','по часам, около 20 $ в час'],['Абонентская плата','нет']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div></div>`;

/* ===== Каркас ===== */
function act(k){toast('Готово.')}
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();const p=PROJECTS.find(x=>(x.n+' '+x.cl).toLowerCase().includes(q));if(p){openP(p.id);return}const s=STAFF.find(x=>x.n.toLowerCase().includes(q));if(s&&allowed('staff')){go('staff');toast(esc(s.n)+' — '+esc(s.pos));return}toast('Не найдено. Попробуйте: «Тау», «LogiPark», «Данияр».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;setMe();if(!allowed(cur))cur=ROLES[role].s[0];build()}
function setMe(){document.getElementById('me').textContent=ROLES[role].av;const n=document.getElementById('mename');if(n)n.innerHTML=`<b>${esc(ROLES[role].n)}</b><small>${esc(role)}</small>`}
function switchRole(k){role=k;setMe();const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){const cnt={today:2,tasks:TASKS.filter(t=>t.st==='check').length,time:FIELD().filter(s=>MARKS[s.id]&&['none','far'].includes(MARKS[s.id][1])).length,safety:FIELD().filter(s=>s.dop<TODAY).length,materials:MATS.filter(m=>m.st==='new').length,acts:ACTS.filter(a=>a.st==='draft').length};
 document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<div class="ng">${s.n}</div>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="ri ${x[0]===cur?'on':''}" onclick="go('${x[0]}')"><code>${x[2]}</code><span>${esc(x[1])}</span>${cnt[x[0]]?`<em>${cnt[x[0]]}</em>`:''}</a>`).join('')).join('')}
const SUBT={today:'Объекты, люди, часы и деньги — на одном экране',map:'Отметки с геолокацией',projects:'Бюджет, график, команда и факт',project:'Этапы, наряды, команда',gantt:'Сроки всех объектов',tasks:'Бригады, плановые и фактические часы',time:'Приход и уход с телефона',sheet:'Собирается сам из отметок',mobile:'Так это видит рабочий',staff:'Должности, ставки, допуски',safety:'Допуски, инструктажи, СИЗ',cost:'Материалы, труд, техника, субподряд',payroll:'Часы, сдельщина, переработки',clients:'Договоры, акты, долги',acts:'Выполненные объёмы за месяц',materials:'От прораба до объекта',machines:'Моточасы и стоимость',c1:'Табель, начисления, акты, оплаты',reports:'Кнопкой вместо Excel',roles:'Кто что видит',launch:'Цена, оплата, сроки'};
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.today;document.getElementById('ttl').textContent=SUBN[cur]||'Вертикаль';const sb=document.getElementById('subt');if(sb)sb.textContent=SUBT[cur]||'';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('light',theme==='light')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme()}
const TOUR=[
 ['today','1 · Пульт руководителя: объекты, люди на местах, часы, ФОТ, маржа и что требует решения.'],
 ['map','2 · Где люди сейчас: отметки с геолокацией, «вне объекта» видно сразу.'],
 ['mobile','3 · Так отмечается рабочий: «Я на объекте» + фото, время идёт на наряд.'],
 ['time','4 · Учёт времени сегодня: пришёл, опоздал, не вышел, отработано.'],
 ['sheet','5 · Табель за месяц собирается сам и уходит в 1С.'],
 ['projects','6 · Все проекты: бюджет, готовность, труд факт против плана.'],
 ['project','7 · Карточка проекта: по каждому этапу видно, где труд дороже сметы.'],
 ['tasks','8 · Наряды бригадам с плановыми часами — перерасход виден сразу.'],
 ['cost','9 · Себестоимость и маржа каждого объекта в моменте.'],
 ['payroll','10 · Зарплата из часов и нарядов: почасовые, сдельщики, переработки.'],
 ['c1','11 · Обмен с 1С без двойного ввода.'],
 ['launch','12 · Стоимость: 10 800 000 ₸ + 1С 500 000 ₸.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■ Стоп';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Руководитель');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶ Сценарий'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
