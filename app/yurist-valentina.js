/* АРГУМЕНТ — юридическая компания: штат + юристы-аутсорсеры (Валентина, управляющий партнёр). Демо на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const TODAY='18.11.2026',NOW='09:40',TD=18;
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const bar=(w,c)=>`<div class="bar"><i class="${c||''}" style="--w:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const said=(q,a,who)=>`<div class="said"><b>${who||'Валентина, 17.11'}</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const SEC=[
 {k:'sum',n:'Пульт',d:'отчёт дня, аналитика',sub:[['dash','Отчёт руководителю'],['anal','Аналитика дел'],['ads','Реклама и источники']]},
 {k:'sale',n:'Продажи',d:'две линии и каналы',sub:[['line1','1-я линия · бот и лидоруб'],['line2','2-я линия · юристы-клоузеры'],['client','Карточка клиента'],['channels','Чат-бот и каналы']]},
 {k:'case',n:'Дела',d:'от «здравствуйте» до «спасибо»',sub:[['cases','Воронка дел'],['plan','План работ по делу'],['cal','Календарь сроков'],['tasks','Задачи'],['court','Судебный кабинет'],['docs','Документы и шаблоны'],['fee','Гонорар успеха']]},
 {k:'law',n:'Право',d:'нормы и поправки',sub:[['lib','Библиотека и поправки Әділет']]},
 {k:'team',n:'Команда',d:'аутсорсеры и время',sub:[['out','Юристы-аутсорсеры'],['time','Рабочее время и цифровой след']]},
 {k:'money',n:'Деньги',d:'управленческий учёт',sub:[['fin','Деньги и признание дохода'],['onec','Данные из 1С'],['roi','Окупаемость против amoCRM']]},
 {k:'sys',n:'Система',d:'доступы, пакет, цена',sub:[['roles','Роли и доступы'],['move','Переезд с amoCRM'],['pack','Стандартный пакет'],['launch','Стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Управляющий партнёр':{av:'ВЛ',n:'Валентина',note:'Всё: продажи, дела, сроки, команда, деньги, доступы',s:ALL.slice()},
 'Собственник':{av:'СБ',n:'Нурлан · собственник',note:'Цифры: отчёт дня, деньги, окупаемость, аналитика, гонорары успеха',s:['dash','anal','ads','fin','onec','roi','fee','cases','out','time','roles','pack','launch']},
 'Лидоруб · 1-я линия':{av:'ЛД',n:'Дана · первая линия',note:'Заявки из бота, WhatsApp, Instagram, сайта → квалификация → запись на консультацию',s:['line1','channels','client','tasks']},
 'Юрист-клоузер':{av:'ЮК',n:'Ерлан · семейное и гражданское',note:'Свои консультации и контракты, свои дела; чужие сделки и деньги не видит',s:['line2','client','cases','plan','cal','tasks','court','docs','lib','fee']},
 'Юрист-аутсорсер':{av:'ЮА',n:'Айдос · корпоративное право, удалённо',note:'Только переданные ему дела: план работ, сроки, документы, суд, учёт времени',s:['cases','plan','cal','tasks','court','docs','lib','time']},
 'Бухгалтер':{av:'БХ',n:'Сауле · бухгалтер (своя 1С)',note:'Признание дохода по АВР, гонорары, выплаты аутсорсерам, пакет из 1С',s:['fin','onec','fee','out']}
};
let role='Управляющий партнёр',cur='dash';
/* люди */
const LAW=[
 {id:'L1',n:'Ерлан Сейтжанов',t:'штат',sp:'Семейное и гражданское',rate:0,line:2},
 {id:'L2',n:'Асель Мухамеджанова',t:'штат',sp:'Крупные контракты, корпоративное',rate:0,line:2},
 {id:'O1',n:'Айдос Тулегенов',t:'аутсорс',sp:'Корпоративное право',rate:9000},
 {id:'O2',n:'Мадина Калиева',t:'аутсорс',sp:'Семейное право',rate:8000},
 {id:'O3',n:'Руслан Абенов',t:'аутсорс',sp:'Гражданские споры, выезд',rate:8500}
];
const LN=id=>(LAW.find(l=>l.id===id)||{n:'—'}).n;
const LF=id=>LN(id).split(' ')[0];
/* лиды первой линии */
const SRC={bot:'Чат-бот',wa:'WhatsApp',ig:'Instagram',web:'Сайт',call:'Звонок',ga:'Google Ads'};
const L1ST=[['new','Новые'],['qual','Квалификация'],['book','Записан на консультацию'],['junk','Не наш вопрос']];
let LEADS=[
 {id:'Z-581',n:'Жанар К.',q:'Раздел имущества при разводе, квартира в ипотеке',src:'bot',t:'03:12',st:'new',area:'Семейное'},
 {id:'Z-582',n:'ТОО «Нур Строй»',q:'Взыскание долга с подрядчика, 18 млн ₸',src:'ga',t:'08:47',st:'new',area:'Корпоративное'},
 {id:'Z-583',n:'Марат С.',q:'Наследство: пропущен срок принятия',src:'wa',t:'09:05',st:'qual',area:'Гражданское'},
 {id:'Z-584',n:'Гульнара А.',q:'Алименты, бывший муж ИП',src:'ig',t:'09:18',st:'qual',area:'Семейное'},
 {id:'Z-577',n:'ТОО «Алем Логистик»',q:'Претензия от поставщика, сопровождение сделки',src:'web',t:'вчера',st:'book',area:'Корпоративное',cons:'18.11 15:00',to:'L2'},
 {id:'Z-574',n:'Ербол Т.',q:'Спор с застройщиком, неустойка',src:'call',t:'вчера',st:'book',area:'Гражданское',cons:'18.11 11:30',to:'L1'},
 {id:'Z-569',n:'Аноним',q:'Вопрос по ДТП в другой стране',src:'bot',t:'16.11',st:'junk',area:'—'}
];
/* консультации и сделки второй линии */
const L2ST=[['cons','Консультация назначена'],['done','Проведена'],['kp','Предложение и договор'],['won','Контракт подписан'],['lost','Отказ']];
let CONS=[
 {id:'K-301',cl:'C5',n:'Ербол Т.',q:'Неустойка с застройщика',by:'L1',when:'18.11 11:30',st:'cons',sum:450000},
 {id:'K-302',cl:'C6',n:'ТОО «Алем Логистик»',q:'Претензия поставщика, сопровождение',by:'L2',when:'18.11 15:00',st:'cons',sum:3800000},
 {id:'K-296',cl:'C3',n:'Самал Б.',q:'Определение места жительства ребёнка',by:'L1',when:'17.11',st:'done',sum:600000},
 {id:'K-293',cl:'C7',n:'ТОО «Кен Агро»',q:'Корпоративный спор участников',by:'L2',when:'15.11',st:'kp',sum:6500000},
 {id:'K-288',cl:'C1',n:'Алия Р.',q:'Раздел имущества',by:'L1',when:'12.11',st:'won',sum:850000},
 {id:'K-285',cl:'C8',n:'Тимур Ж.',q:'Трудовой спор',by:'L1',when:'10.11',st:'lost',sum:300000,why:'дорого, ушёл к знакомому'}
];
/* клиенты и дела */
let CL=[
 {id:'C1',n:'Алия Р.',ph:'+7 701 *** 21 40',type:'физлицо',resp:'O2',own:'L1'},
 {id:'C2',n:'ТОО «Сапа Трейд»',ph:'+7 727 *** 55 10',type:'юрлицо',resp:'O1',own:'L2'},
 {id:'C3',n:'Самал Б.',ph:'+7 707 *** 13 98',type:'физлицо',resp:'L1',own:'L1'},
 {id:'C4',n:'ТОО «Береке Мед»',ph:'+7 717 *** 40 02',type:'юрлицо',resp:'O1',own:'L2'},
 {id:'C5',n:'Ербол Т.',ph:'+7 778 *** 66 31',type:'физлицо',resp:'L1',own:'L1'},
 {id:'C6',n:'ТОО «Алем Логистик»',ph:'+7 727 *** 90 14',type:'юрлицо',resp:'L2',own:'L2'},
 {id:'C7',n:'ТОО «Кен Агро»',ph:'+7 7232 ** 11 85',type:'юрлицо',resp:'L2',own:'L2'},
 {id:'C8',n:'Тимур Ж.',ph:'+7 702 *** 03 77',type:'физлицо',resp:'L1',own:'L1'},
 {id:'C9',n:'Динара С.',ph:'+7 705 *** 48 50',type:'физлицо',resp:'O3',own:'L1'}
];
const CLN=id=>(CL.find(c=>c.id===id)||{n:'—'}).n;
const CST=[['start','Договор и предоплата'],['plan','План работ'],['pre','Досудебный этап'],['court','Суд'],['decision','Решение'],['avr','АВР и закрытие'],['fee','Гонорар успеха']];
let CASES=[
 {id:'Д-112',cl:'C2',title:'Взыскание долга 24,6 млн ₸ с контрагента',area:'Корпоративное',resp:'O1',st:'court',sum:2400000,paid:1200000,fee:5,feeBase:24600000,next:'20.11',nextT:'Отзыв на возражение ответчика',court:'СМЭС г. Алматы'},
 {id:'Д-118',cl:'C1',title:'Раздел имущества супругов',area:'Семейное',resp:'O2',st:'plan',sum:850000,paid:425000,fee:0,next:'25.11',nextT:'Досудебное соглашение — проект',court:'—'},
 {id:'Д-104',cl:'C3',title:'Определение места жительства ребёнка',area:'Семейное',resp:'L1',st:'court',sum:600000,paid:600000,fee:0,next:'19.11',nextT:'Заседание, 10:00, зал 4',court:'Медеуский районный суд'},
 {id:'Д-097',cl:'C4',title:'Оспаривание штрафа и предписания',area:'Корпоративное',resp:'O1',st:'decision',sum:1500000,paid:1500000,fee:3,feeBase:9800000,next:'21.11',nextT:'Срок обжалования решения истекает',court:'СМЭС г. Астаны'},
 {id:'Д-089',cl:'C9',title:'Неустойка по договору подряда',area:'Гражданское',resp:'O3',st:'pre',sum:500000,paid:250000,fee:10,feeBase:3200000,next:'22.11',nextT:'Досудебная претензия — отправить',court:'—'},
 {id:'Д-076',cl:'C7',title:'Корпоративный спор участников ТОО',area:'Корпоративное',resp:'L2',st:'avr',sum:6500000,paid:6500000,fee:0,next:'—',nextT:'АВР подписан, закрыть',court:'СМЭС ВКО'},
 {id:'Д-061',cl:'C2',title:'Банкротство дебитора, включение в реестр',area:'Корпоративное',resp:'O1',st:'fee',sum:1800000,paid:1800000,fee:7,feeBase:15400000,next:'—',nextT:'Выставить гонорар успеха',court:'СМЭС г. Алматы'}
];
const CS=id=>CASES.find(c=>c.id===id)||CASES[0];
let CASE='Д-112',CURCL='C2';
/* стандартные действия плана работ */
const ACTS=['Досудебная претензия','Исковое заявление','Отзыв на иск','Апелляционная жалоба','Адвокатский запрос','Ходатайство об истребовании доказательств','Нотариальное заверение','Апостиль','Заявление о выдаче исполнительного листа','Мировое соглашение — проект'];
let PLAN={'Д-112':{'Исковое заявление':{on:true,d:'2026-10-21',done:true},'Отзыв на иск':{on:true,d:'2026-11-20'},'Ходатайство об истребовании доказательств':{on:true,d:'2026-11-26'}}};
/* задачи */
let TASKS=[
 {id:'T-901',t:'Отзыв на возражение ответчика',cs:'Д-112',who:'O1',due:20,st:'open'},
 {id:'T-902',t:'Заседание, 10:00, зал 4 — подготовить позицию',cs:'Д-104',who:'L1',due:19,st:'open'},
 {id:'T-903',t:'Апелляционная жалоба — срок обжалования',cs:'Д-097',who:'O1',due:21,st:'open'},
 {id:'T-904',t:'Досудебная претензия — отправить',cs:'Д-089',who:'O3',due:17,st:'open'},
 {id:'T-905',t:'Проект досудебного соглашения',cs:'Д-118',who:'O2',due:25,st:'open'},
 {id:'T-906',t:'Ходатайство об истребовании доказательств',cs:'Д-112',who:'O1',due:26,st:'open'},
 {id:'T-899',t:'Исковое заявление подано',cs:'Д-112',who:'O1',due:14,st:'done'}
];
const dLeft=d=>d-TD;
const lvl=d=>{const x=dLeft(d);return x<0?'r':x<=2?'r':x<=5?'w':'g'};
const lvlT=d=>{const x=dLeft(d);return x<0?`просрочено на ${-x} дн.`:x===0?'сегодня':x<=2?`через ${x} дн. · красный`:`через ${x} дн.`};
/* поправки из Әділет */
let AMEND=[
 {id:'A1',code:'ГПК РК',art:'ст. 403',what:'Изменён срок подачи апелляционной жалобы на решения по упрощённому производству',from:'01.12.2026',st:'new',cases:['Д-097']},
 {id:'A2',code:'Кодекс о браке и семье',art:'ст. 139',what:'Уточнён порядок взыскания алиментов с индивидуальных предпринимателей',from:'01.01.2027',st:'new',cases:['Д-118']},
 {id:'A3',code:'Закон «О реабилитации и банкротстве»',art:'ст. 87',what:'Пункт 3 утратил силу',from:'15.11.2026',st:'read',cases:['Д-061']},
 {id:'A4',code:'Налоговый кодекс',art:'ст. 412',what:'Новая ставка НДС 16% — справочно для расчёта гонораров юрлицам',from:'01.01.2026',st:'read',cases:[]}
];
const NORMS=[
 {g:'Гражданский процесс',l:[['ГПК РК, ст. 403','Сроки апелляционного обжалования'],['ГПК РК, ст. 148','Требования к исковому заявлению'],['ГПК РК, ст. 166','Отзыв на исковое заявление']]},
 {g:'Семейное право',l:[['Кодекс о браке и семье, ст. 33','Общая собственность супругов'],['Кодекс о браке и семье, ст. 139','Размер алиментов']]},
 {g:'Корпоративное право',l:[['Закон о ТОО и ТДО, ст. 43','Общее собрание участников'],['Закон о реабилитации и банкротстве, ст. 87','Реестр требований кредиторов']]}
];
/* время и цифровой след */
let DAY={start:null,end:null};
const TIME=[
 {who:'O1',days:[[9.2,7.1],[8.8,6.4],[9.5,7.6],[7.1,3.2],[8.6,6.9]],claim:42},
 {who:'O2',days:[[6.0,5.1],[6.5,5.6],[5.8,4.9],[6.2,5.4],[6.1,5.2]],claim:28},
 {who:'O3',days:[[8.0,2.4],[7.5,3.1],[8.2,2.0],[7.8,2.7],[8.0,2.9]],claim:39}
];
const TRAIL=[
 ['13:15','Вход в «Судебный кабинет» по ЭЦП','ok'],['13:16','Открыт черновик: отзыв по делу Д-112',''],['13:24','Попытка загрузки: файл 28 МБ — ошибка «размер больше 20 МБ»','bad'],['13:40','Нет активности 1 ч 45 мин',''],['17:25','Файл сжат до 6 МБ, подписан ЭЦП','ok'],['17:26','Загружено, получена квитанция № 2611-04718','ok']
];
/* деньги */
const MONTHS=['Июл','Авг','Сен','Окт','Ноя'];
const CASH=[[9.4,6.1],[11.2,7.0],[10.6,8.3],[13.8,8.9],[12.1,9.6]];
const EXP=[['Аутсорс-юристы (физлица, без документов)',2840000,'упр.'],['Зарплаты штатных',4200000,'1С'],['Реклама Google и Meta',1100000,'1С'],['Аренда офиса',650000,'1С'],['Нотариус, госпошлины',380000,'упр.'],['Сервисы и связь',190000,'1С']];
let ONEC=false;
/* ===== Видимость по ролям ===== */
const MEID=()=>role==='Юрист-клоузер'?'L1':role==='Юрист-аутсорсер'?'O1':null;
const seeCase=c=>{const m=MEID();if(!m)return true;return c.resp===m||(CL.find(x=>x.id===c.cl)||{}).own===m};
const seeCl=cl=>{const m=MEID();if(role==='Лидоруб · 1-я линия')return true;if(!m)return true;return cl.resp===m||cl.own===m||CASES.some(c=>c.cl===cl.id&&c.resp===m)};
const stN=k=>(CST.find(x=>x[0]===k)||['',k])[1];
const SC={};
/* ===== Пульт ===== */
SC.dash=()=>{const nl=LEADS.filter(l=>l.st==='new').length;const hot=TASKS.filter(t=>t.st==='open'&&dLeft(t.due)<=2);const consToday=CONS.filter(c=>c.when.startsWith('18.11')).length;
return `<div class="hd"><div><h2>Отчёт руководителю · ${TODAY}, ${NOW}</h2><p>То, что сейчас собирается вручную из amoCRM, таблиц и переписки, — одним экраном каждое утро: заявки, консультации, продажи, касса и сроки, которые горят.</p></div><div class="btns"><button class="bt" onclick="xls()">Excel</button><button class="bt p" onclick="go('cal')">Сроки</button></div></div>
${said('Мне нужно, чтобы всё складывалось в отчёт руководителя по продажам каждый день: сколько заявок, сколько консультаций проведено и назначено, сколько продаж, сколько в кассе.','Отчёт собирается сам из воронок и оплат — ничего не надо сводить в Excel.')}
<div class="strip"><div><small>Заявки за сутки</small><b>${LEADS.length+19}</b><span>${nl} ждут первой линии · бот ночью принял 6</span></div><div><small>Консультации</small><b>3 / ${consToday+2}</b><span>проведено вчера / назначено на сегодня</span></div><div><small>Новые контракты, ноябрь</small><b>${tg(9750000)}</b><span>7 договоров · ${bar(71,'g')}</span></div><div><small>Касса сегодня</small><b>${tg(1475000)}</b><span>предоплаты 1 050 000 · гонорары 425 000</span></div><div><small>Сроки в красной зоне</small><b class="bad">${hot.length}</b><span>до дедлайна 2 дня и меньше</span></div></div>
<div class="g21"><div>
 <div class="pan"><h3>Сроки, которые горят</h3><div class="tw"><table class="t"><thead><tr><th>Срок</th><th>Действие</th><th>Дело</th><th>Ответственный</th><th>Статус</th></tr></thead><tbody>${TASKS.filter(t=>t.st==='open').sort((a,b)=>a.due-b.due).map(t=>`<tr onclick="CASE='${t.cs}';go('plan')"><td class="mono">${t.due}.11</td><td><b>${esc(t.t)}</b></td><td>${t.cs}</td><td>${esc(LN(t.who))}</td><td><span class="lvl ${lvl(t.due)}"></span>${lvlT(t.due)}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Продажи по линиям за ноябрь</h3><div class="tw"><table class="t"><thead><tr><th>Линия</th><th class="r">Заявки</th><th class="r">Консультации</th><th class="r">Контракты</th><th class="r">Сумма</th><th class="r">Конверсия</th></tr></thead><tbody>
  <tr><td>1-я линия · бот и лидоруб</td><td class="r">214</td><td class="r">63</td><td class="r">—</td><td class="r">—</td><td class="r">29%</td></tr>
  <tr><td>2-я линия · Ерлан (консультации)</td><td class="r">—</td><td class="r">38</td><td class="r">5</td><td class="r">${tg(3250000)}</td><td class="r">13%</td></tr>
  <tr><td>2-я линия · Асель (крупные контракты)</td><td class="r">—</td><td class="r">25</td><td class="r">2</td><td class="r">${tg(6500000)}</td><td class="r">8%</td></tr>
 </tbody></table></div><p class="sm2 mut">Каждый юрист видит только свою строку — чужие деньги ему не показываются.</p></div>
</div><div>
 <div class="pan"><h3>Требует внимания</h3><div class="alist">
  <a onclick="go('fee')"><i class="dt r"></i><b>Гонорар успеха по Д-061 не выставлен</b><span>решение вступило в силу 9 дней назад · 7% от 15,4 млн ₸</span></a>
  <a onclick="go('lib')"><i class="dt w"></i><b>2 новые поправки затрагивают ваши дела</b><span>ГПК ст. 403 — Д-097 · Кодекс о браке ст. 139 — Д-118</span></a>
  <a onclick="go('time')"><i class="dt w"></i><b>Руслан: заявлено 39 ч, активность 13 ч</b><span>аутсорсер · часовая ставка · проверить цифровой след</span></a>
  <a onclick="go('line1')"><i class="dt i"></i><b>${nl} новые заявки без ответа</b><span>бот ответил ночью, ждут лидоруба</span></a>
  <a onclick="go('cases')"><i class="dt i"></i><b>Д-076: АВР подписан — доход признаётся в ноябре</b><span>6,5 млн ₸ переходят из предоплат в доход</span></a>
 </div></div>
 <div class="pan"><h3>Дела по этапам</h3><div class="tw"><table class="t sm"><tbody>${CST.map(([k,n])=>`<tr onclick="go('cases')"><td>${n}</td><td class="r"><b>${CASES.filter(c=>c.st===k).length}</b></td></tr>`).join('')}</tbody></table></div></div>
</div></div>`};
SC.anal=()=>{const W=[['Семейное',18,4],['Гражданское',14,5],['Корпоративное',11,2]];
return `<div class="hd"><div><h2>Аналитика дел</h2><p>Выигранные и проигранные дела по направлениям и юристам, причины проигрышей и отказов клиентов. Считается из воронки дел, без ручных таблиц.</p></div></div>
<div class="strip"><div><small>Закрыто дел за 2026</small><b>54</b></div><div><small>Выиграно / мировое</small><b class="ok">43</b><span>80%</span></div><div><small>Проиграно</small><b class="bad">11</b></div><div><small>Средний срок дела</small><b>4,7 мес.</b></div><div><small>Гонорары успеха</small><b>${tg(4380000)}</b><span>получено за год</span></div></div>
<div class="g2"><div class="pan"><h3>По направлениям</h3><div class="tw"><table class="t"><thead><tr><th>Направление</th><th class="r">Выиграно</th><th class="r">Проиграно</th><th style="width:34%">Доля побед</th></tr></thead><tbody>${W.map(w=>`<tr><td>${w[0]}</td><td class="r">${w[1]}</td><td class="r">${w[2]}</td><td>${bar(pct(w[1],w[1]+w[2]),'g')}</td></tr>`).join('')}</tbody></table></div></div>
<div class="pan"><h3>Причины проигрышей и отказов</h3><div class="tw"><table class="t"><tbody>
<tr><td>Пропущен процессуальный срок</td><td class="r bad"><b>3</b></td></tr><tr><td>Недостаточно доказательств у клиента</td><td class="r">4</td></tr><tr><td>Судебная практика против</td><td class="r">4</td></tr><tr><td>Отказ клиента: дорого</td><td class="r">9</td></tr><tr><td>Отказ клиента: ушёл к знакомому юристу</td><td class="r">5</td></tr></tbody></table></div><p class="sm2 mut">Пропущенные сроки — та самая «красная» зона: календарь сроков и напоминания за 2 дня убирают эту причину.</p></div></div>
<div class="pan"><h3>Юристы</h3><div class="tw"><table class="t"><thead><tr><th>Юрист</th><th>Статус</th><th class="r">Дел в работе</th><th class="r">Закрыто</th><th class="r">Выиграно</th><th class="r">Просрочек сроков</th></tr></thead><tbody>${LAW.map((l,i)=>`<tr><td><b>${esc(l.n)}</b><br><span class="mut">${esc(l.sp)}</span></td><td>${tag(l.t,l.t==='штат'?'b':'a')}</td><td class="r">${CASES.filter(c=>c.resp===l.id).length}</td><td class="r">${[14,9,12,10,9][i]}</td><td class="r">${[12,7,10,8,6][i]}</td><td class="r ${[0,0,1,0,2][i]?'bad':''}">${[0,0,1,0,2][i]}</td></tr>`).join('')}</tbody></table></div></div>`};
SC.ads=()=>{const R=[['Google Ads · «юрист по разводам»','ga',420000,96,31,4,2900000],['Meta · Instagram, лид-формы','ig',380000,141,22,2,1450000],['Сайт и SEO','web',90000,38,14,2,1900000],['Рекомендации','call',0,22,15,5,4100000]];
return `<div class="hd"><div><h2>Реклама и источники</h2><p>Расход тянется из рекламных кабинетов Google и Meta по API, заявки и контракты — из воронок. Видно, сколько стоит консультация и контракт с каждого источника.</p></div></div>
${said('Аналитику — интеграцией с рекламным кабинетом Google и кабинетом Meta, чтобы данные доставались сами.','Расход за день подтягивается автоматически, ручной выгрузки нет.')}
<div class="pan"><h3>Ноябрь, 1–18</h3><div class="tw"><table class="t"><thead><tr><th>Источник</th><th class="r">Расход</th><th class="r">Заявки</th><th class="r">Консультации</th><th class="r">Контракты</th><th class="r">Сумма контрактов</th><th class="r">Цена заявки</th><th class="r">Цена контракта</th></tr></thead><tbody>${R.map(r=>`<tr><td><b>${r[0]}</b></td><td class="r">${tg(r[2])}</td><td class="r">${r[3]}</td><td class="r">${r[4]}</td><td class="r">${r[5]}</td><td class="r">${tg(r[6])}</td><td class="r">${r[2]?tg(r[2]/r[3]):'—'}</td><td class="r">${r[2]?tg(r[2]/r[5]):'—'}</td></tr>`).join('')}</tbody></table></div>
<p class="sm2 mut">Подключение Google Ads и Meta Marketing API входит в стандартный пакет.</p></div>`};
/* ===== Продажи ===== */
function l1move(id,st){const l=LEADS.find(x=>x.id===id);l.st=st;if(st==='book'){l.cons='19.11 12:00';l.to=l.area==='Корпоративное'?'L2':'L1'}render();toast(st==='book'?`Заявка ${id} записана на консультацию к юристу <b>${LF(l.to)}</b> — ему ушла задача, клиенту — подтверждение в WhatsApp.`:`Заявка ${id}: ${L1ST.find(x=>x[0]===st)[1]}.`)}
SC.line1=()=>`<div class="hd"><div><h2>1-я линия · бот и лидоруб</h2><p>Вне рабочего времени заявки принимает чат-бот: собирает суть вопроса и контакт. Днём бот отвечает сразу, а лидоруб квалифицирует и записывает на консультацию к нужному юристу второй линии.</p></div><div class="btns"><button class="bt" onclick="go('channels')">Каналы и бот</button></div></div>
${said('У меня двухлинейная система продаж: первая линия — лидоруб, который принимает лиды, вне рабочего времени это делает бот. А юристы, которые консультируют, — клоузеры.')}
<div class="kanban k4">${L1ST.map(([k,n])=>`<div class="kcol"><div class="kh"><b>${n}</b><span>${LEADS.filter(l=>l.st===k).length}</span></div>${LEADS.filter(l=>l.st===k).map(l=>`<div class="kc"><code>${l.id} · ${SRC[l.src]} · ${l.t}</code><b>${esc(l.n)}</b><span>${esc(l.q)}</span><span>${tag(l.area,'b')}${l.cons?' '+tag('консультация '+l.cons+' · '+LF(l.to),'g'):''}</span>${k==='new'?`<div class="btns l"><button class="bt sm" onclick="l1move('${l.id}','qual')">В квалификацию</button><button class="bt sm" onclick="l1move('${l.id}','junk')">Не наш</button></div>`:k==='qual'?`<div class="btns l"><button class="bt sm p" onclick="l1move('${l.id}','book')">Записать к юристу</button></div>`:''}</div>`).join('')||'<div class="kempty">пусто</div>'}</div>`).join('')}</div>`;
function l2move(id,st){const c=CONS.find(x=>x.id===id);c.st=st;if(st==='won'){const n='Д-'+(120+CASES.length);CASES.unshift({id:n,cl:c.cl,title:c.q,area:'Гражданское',resp:c.by,st:'start',sum:c.sum,paid:Math.round(c.sum*.5),fee:0,next:'25.11',nextT:'План работ — заполнить',court:'—'});CASE=n;toast(`Контракт подписан — создано дело <b>${n}</b> в процессной воронке. Юрист заполняет план работ.`)}else toast(`${id}: ${L2ST.find(x=>x[0]===st)[1]}.`);render()}
SC.line2=()=>{const m=MEID();const L=CONS.filter(c=>!m||c.by===m);
return `<div class="hd"><div><h2>2-я линия · юристы-клоузеры</h2><p>Ерлан закрывает консультации на договоры, Асель — крупные контракты от миллионов. ${m?'Вы видите только свои консультации и свои суммы.':'Руководитель видит обе линии.'}</p></div></div>
${said('Нет такого, чтобы один видел одни сделки, а другой другие. Мне нужно разделение — чтобы они не считали деньги друг друга и не лезли друг другу в карман.','Каждый клоузер видит только свои консультации, суммы и проценты.')}
<div class="kanban">${L2ST.map(([k,n])=>`<div class="kcol"><div class="kh"><b>${n}</b><span>${L.filter(c=>c.st===k).length}</span></div>${L.filter(c=>c.st===k).map(c=>`<div class="kc"><code>${c.id} · ${c.when} · ${LF(c.by)}</code><b>${esc(c.n)}</b><span>${esc(c.q)}</span><em>${tg(c.sum)}</em>${c.why?`<span class="bad">${esc(c.why)}</span>`:''}${k==='cons'?`<div class="btns l"><button class="bt sm" onclick="l2move('${c.id}','done')">Проведена</button></div>`:k==='done'?`<div class="btns l"><button class="bt sm" onclick="l2move('${c.id}','kp')">Отправить договор</button></div>`:k==='kp'?`<div class="btns l"><button class="bt sm p" onclick="l2move('${c.id}','won')">Подписан</button><button class="bt sm" onclick="l2move('${c.id}','lost')">Отказ</button></div>`:''}</div>`).join('')||'<div class="kempty">пусто</div>'}</div>`).join('')}</div>`};
function assignCl(id){const c=CL.find(x=>x.id===id);c.resp='O1';CASES.filter(x=>x.cl===id).forEach(x=>x.resp='O1');render();toast(`Клиент передан Айдосу: теперь он видит карточку, папку и дела. Запись в журнале доступа.`)}
SC.client=()=>{const c=CL.find(x=>x.id===CURCL)||CL[0];const ok=seeCl(c);const L=CL.filter(seeCl);
const body=ok?`<div class="g21"><div><div class="pan"><h3>${esc(c.n)} · ${c.type}</h3><div class="kv"><span>Телефон</span><b>${c.ph}</b></div><div class="kv"><span>Привёл</span><b>${esc(LN(c.own))}</b></div><div class="kv"><span>Ответственный юрист</span><b>${esc(LN(c.resp))}</b></div>
<h3 style="margin-top:12px">Дела</h3><div class="tw"><table class="t sm"><tbody>${CASES.filter(x=>x.cl===c.id).map(x=>`<tr onclick="CASE='${x.id}';go('plan')"><td>${x.id}</td><td>${esc(x.title)}</td><td>${tag(stN(x.st),'b')}</td></tr>`).join('')||'<tr><td class="mut">дел ещё нет — консультация</td></tr>'}</tbody></table></div></div>
<div class="pan"><h3>Папка клиента</h3><div class="tw"><table class="t sm"><tbody><tr><td>Договор об оказании юридических услуг.pdf</td><td>подписан ЭЦП</td></tr><tr><td>Доверенность.pdf</td><td>нотариус, 10.11</td></tr><tr><td>Исковое заявление.docx</td><td>подано в суд</td></tr><tr><td>Квитанция о приёме № 2611-04718.pdf</td><td>Судебный кабинет</td></tr></tbody></table></div></div></div>
<div><div class="pan"><h3>Переписка и звонки</h3><div class="feed"><div class="fi"><code>WhatsApp · 16.11 19:02</code>Добрый вечер, когда будет следующее заседание?</div><div class="fi out"><code>Айдос · 16.11 19:20</code>Отзыв подаём до 20.11, заседание назначат после. Сообщу дату.</div><div class="fi"><code>Звонок · 17.11 · 4 мин · запись</code>Обсудили документы для ходатайства</div></div></div>
<div class="pan"><h3>Кто видит эту карточку</h3><div class="kv"><span>Управляющий партнёр, собственник</span><b>всё</b></div><div class="kv"><span>${esc(LN(c.resp))}</span><b>ответственный</b></div><div class="kv"><span>Остальные юристы</span><b class="mut">не видят</b></div>${role==='Управляющий партнёр'&&c.resp!=='O1'?`<button class="bt full" onclick="assignCl('${c.id}')">Передать Айдосу (аутсорсер)</button>`:''}</div></div></div>`
:`<div class="pan"><h3>${esc(c.n)}</h3><p class="lock">Нет доступа. Этот клиент не передан вам. Карточка, папка и переписка откроются, когда руководитель назначит вас ответственным или передаст материал задачей.</p></div>`;
return `<div class="hd"><div><h2>Карточка клиента</h2><p>Каждый заходит под своей учётной записью и видит только своих клиентов и папки — пока его не назначат ответственным или не передадут материал.</p></div><div class="btns"><select class="sel" onchange="CURCL=this.value;render()">${CL.map(x=>`<option value="${x.id}" ${x.id===c.id?'selected':''}>${esc(x.n)}${seeCl(x)?'':' · нет доступа'}</option>`).join('')}</select></div></div>
${said('Он не видит других клиентов до тех пор, пока ему не назначат ответственным либо не передадут ему материал.')}
${body}<p class="sm2 mut">Сейчас вам доступно клиентов: ${L.length} из ${CL.length}.</p>`};
SC.channels=()=>`<div class="hd"><div><h2>Чат-бот и каналы</h2><p>WhatsApp, Instagram, сайт и ваш текущий чат-бот — в одном окне. Бот подключается по API «одной кнопкой»: передаёт в систему суть вопроса, направление и контакт.</p></div></div>
${said('Сейчас у нас работает чат-бот, у него широкая интеграция по API — его можно подключить одной кнопкой.')}
<div class="g2"><div class="pan"><h3>Подключённые каналы</h3><div class="tw"><table class="t"><tbody>
<tr><td><b>Чат-бот (ваш текущий сервис)</b><br><span class="mut">ночью и в выходные — сам, днём — передаёт лидорубу</span></td><td>${tag('подключён','g')}</td></tr>
<tr><td><b>WhatsApp, 2 номера</b><br><span class="mut">первая линия и юристы</span></td><td>${tag('подключён','g')}</td></tr>
<tr><td><b>Instagram Direct</b><br><span class="mut">и лид-формы Meta</span></td><td>${tag('подключён','g')}</td></tr>
<tr><td><b>Сайт · форма заявки</b></td><td>${tag('подключён','g')}</td></tr>
<tr><td><b>IP-телефония</b><br><span class="mut">записи звонков в карточке</span></td><td>${tag('по выбору','w')}</td></tr></tbody></table></div></div>
<div class="pan"><h3>Ночной диалог бота · 03:12</h3><div class="feed"><div class="fi"><code>Жанар К.</code>Здравствуйте, нужен юрист по разделу квартиры, она в ипотеке</div><div class="fi out"><code>Бот</code>Здравствуйте! Подскажите: вы в браке сейчас и есть ли несовершеннолетние дети?</div><div class="fi"><code>Жанар К.</code>Развод в процессе, ребёнок 7 лет</div><div class="fi out"><code>Бот</code>Спасибо. Юрист по семейным делам свяжется с вами сегодня до 10:00. Удобно в WhatsApp?</div></div><button class="bt full" onclick="go('line1')">Заявка Z-581 уже у лидоруба</button></div></div>`;
/* ===== Дела ===== */
function cmove(id,dir){const c=CS(id);const i=CST.findIndex(x=>x[0]===c.st);const j=Math.max(0,Math.min(CST.length-1,i+dir));c.st=CST[j][0];render();if(c.st==='fee')toast(`${id}: решение в пользу клиента — дело ушло в «Гонорар успеха». Бухгалтер получил задачу выставить счёт.`);else if(c.st==='avr')toast(`${id}: подписан АВР — доход признаётся в этом месяце.`);else toast(`${id}: ${stN(c.st)}.`)}
SC.cases=()=>{const L=CASES.filter(seeCase);
return `<div class="hd"><div><h2>Воронка дел</h2><p>Процессная воронка — от «здравствуйте» до «спасибо» и гонорара успеха. ${MEID()?'Вы видите только дела, где вы ответственный.':'Руководитель видит все дела штата и аутсорсеров.'}</p></div></div>
${said('Мне нужен весь бизнес-процесс — от клиентского «здравствуйте» до «спасибо, что обратились» и success fee, который нельзя забыть выплатить.')}
<div class="kanban dk" style="grid-template-columns:repeat(7,minmax(170px,1fr))">${CST.map(([k,n])=>`<div class="kcol"><div class="kh"><b>${n}</b><span>${L.filter(c=>c.st===k).length}</span></div>${L.filter(c=>c.st===k).map(c=>`<div class="kc" onclick="CASE='${c.id}';go('plan')"><code>${c.id} · ${esc(LF(c.resp))}</code><b>${esc(c.title)}</b><span>${esc(CLN(c.cl))} · ${c.area}</span>${c.next!=='—'?`<span><span class="lvl ${lvl(+c.next.slice(0,2))}"></span>${c.next} · ${esc(c.nextT)}</span>`:''}<div class="btns l" onclick="event.stopPropagation()"><button class="bt sm" onclick="cmove('${c.id}',-1)">←</button><button class="bt sm" onclick="cmove('${c.id}',1)">Дальше →</button></div></div>`).join('')||'<div class="kempty">—</div>'}</div>`).join('')}</div>`};
function pTog(a){const P=PLAN[CASE]=PLAN[CASE]||{};P[a]=P[a]||{on:false,d:''};P[a].on=!P[a].on;if(P[a].on&&!P[a].d)P[a].d='2026-11-'+String(Math.min(30,TD+5+Object.keys(P).length)).padStart(2,'0');render()}
function pDate(a,v){const P=PLAN[CASE]=PLAN[CASE]||{};P[a]=P[a]||{on:true};P[a].d=v;P[a].on=true}
function pMake(){const P=PLAN[CASE]||{};const c=CS(CASE);let n=0;Object.entries(P).forEach(([a,x])=>{if(x.on&&!x.done&&x.d&&!TASKS.some(t=>t.cs===CASE&&t.t===a)){TASKS.push({id:'T-'+(910+TASKS.length),t:a,cs:CASE,who:c.resp,due:+x.d.slice(8,10),st:'open'});n++}});toast(n?`Создано задач: <b>${n}</b>. За 2 дня до каждого срока ${esc(LF(c.resp))} и руководитель получат напоминание, в день срока — красный уровень.`:'Новых задач нет — всё уже в календаре.');render()}
SC.plan=()=>{const L=CASES.filter(seeCase);if(!L.find(c=>c.id===CASE))CASE=(L[0]||CASES[0]).id;const c=CS(CASE);const P=PLAN[CASE]||{};
return `<div class="hd"><div><h2>План работ по делу</h2><p>Юрист отмечает галочками стандартные действия и ставит даты. Кнопка превращает план в задачи с напоминанием за 2 дня до срока — так не пропускаются сроки подачи.</p></div><div class="btns"><select class="sel" onchange="CASE=this.value;render()">${L.map(x=>`<option value="${x.id}" ${x.id===CASE?'selected':''}>${x.id} · ${esc(x.title)}</option>`).join('')}</select></div></div>
${said('Чтобы он просто чек-боксами отметил план работы: иск, отзыв, жалоба, претензия, нотариус, апостиль — и выставил даты. Потом это превращается в задачу, которая за пару дней до дедлайна предупреждает.')}
<div class="g21"><div class="pan"><h3>${c.id} · ${esc(c.title)}</h3><p class="mut">${esc(CLN(c.cl))} · ${c.area} · ответственный: ${esc(LN(c.resp))} · ${esc(c.court)}</p>
<div class="plan">${ACTS.map(a=>{const x=P[a]||{};return `<label class="${x.on?'on':''}"><input type="checkbox" ${x.on?'checked':''} ${x.done?'disabled':''} onchange="pTog('${a}')"> ${a}${x.done?' '+tag('сделано','g'):''}<input type="date" value="${x.d||''}" onchange="pDate('${a}',this.value)" onclick="event.stopPropagation()"></label>`}).join('')}</div>
<div class="btns l"><button class="bt p" onclick="pMake()">Создать задачи из плана</button><button class="bt" onclick="go('cal')">Календарь сроков</button></div></div>
<div class="pan"><h3>Задачи по делу</h3><div class="alist">${TASKS.filter(t=>t.cs===CASE).sort((a,b)=>a.due-b.due).map(t=>`<a onclick="go('tasks')"><i class="dt ${t.st==='done'?'g':lvl(t.due)}"></i><b>${esc(t.t)}</b><span>${t.due}.11 · ${t.st==='done'?'выполнено':lvlT(t.due)}</span></a>`).join('')||'<p class="mut">задач пока нет</p>'}</div></div></div>`};
SC.cal=()=>{const days=[];for(let d=16;d<=29;d++)days.push(d);const T=TASKS.filter(t=>t.st==='open'&&seeCase(CS(t.cs)));
return `<div class="hd"><div><h2>Календарь сроков</h2><p>Все процессуальные сроки и задачи по делам. За 2 дня до дедлайна срок становится красным, ответственный и руководитель получают напоминание.</p></div></div>
<div class="strip"><div><small>Красный уровень</small><b class="bad">${T.filter(t=>lvl(t.due)==='r').length}</b><span>2 дня и меньше или просрочено</span></div><div><small>Жёлтый</small><b>${T.filter(t=>lvl(t.due)==='w').length}</b><span>3–5 дней</span></div><div><small>В плане</small><b class="ok">${T.filter(t=>lvl(t.due)==='g').length}</b></div></div>
<div class="pan"><div class="cal">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(x=>`<div class="hdw">${x}</div>`).join('')}${days.map(d=>`<div class="${d===TD?'td':''}"><b>${d}.11</b>${T.filter(t=>t.due===d).map(t=>`<span class="ev ${lvl(t.due)}" onclick="CASE='${t.cs}';go('plan')">${t.cs} · ${esc(t.t)}</span>`).join('')}</div>`).join('')}</div></div>`};
function tDone(id){const t=TASKS.find(x=>x.id===id);t.st=t.st==='done'?'open':'done';render();toast(t.st==='done'?`«${esc(t.t)}» — выполнено, срок снят с красной зоны.`:'Задача снова открыта.')}
SC.tasks=()=>{const T=TASKS.filter(t=>seeCase(CS(t.cs)));
return `<div class="hd"><div><h2>Задачи</h2><p>Задачи из планов работ, поручения руководителя и автоматические напоминания. Просроченные и «красные» — сверху.</p></div></div>
<div class="pan"><div class="tw"><table class="t"><thead><tr><th style="width:40px"></th><th>Задача</th><th>Дело</th><th>Ответственный</th><th>Срок</th><th>Уровень</th></tr></thead><tbody>${T.sort((a,b)=>(a.st==='done')-(b.st==='done')||a.due-b.due).map(t=>`<tr><td><input type="checkbox" ${t.st==='done'?'checked':''} onchange="tDone('${t.id}')"></td><td><b>${esc(t.t)}</b></td><td>${t.cs}</td><td>${esc(LN(t.who))}</td><td class="mono">${t.due}.11</td><td>${t.st==='done'?tag('выполнено','g'):`<span class="lvl ${lvl(t.due)}"></span>${lvlT(t.due)}`}</td></tr>`).join('')}</tbody></table></div></div>`};
/* судебный кабинет */
let COURT={step:0,log:[]};
const CSTEPS=['Документ из папки дела','Подпись ЭЦП','Загрузка в «Судебный кабинет»','Квитанция и цифровой след'];
function cStep(){if(COURT.step>=4)return;const t=['13:15','13:17','13:18','13:19'][COURT.step];COURT.log.push([t,['Выбран файл «Отзыв на возражение · Д-112.pdf», 6,1 МБ','Подписано ЭЦП юриста, сертификат действителен до 03.2027','Отправлено в «Судебный кабинет» (sud.gov.kz), дело № 7594-26-00-2/4471','Получена квитанция о приёме № 2611-04822 — сохранена в папку клиента'][COURT.step],'ok']);COURT.step++;render();if(COURT.step===4)toast('Документ подан. Квитанция и цифровой след сохранены в карточке дела — задача «Отзыв на возражение» закрыта.')}
SC.court=()=>`<div class="hd"><div><h2>Судебный кабинет</h2><p>Из карточки дела юрист выходит в «Судебный кабинет» и eGov, подписывает и загружает документ. Квитанция и цифровой след — время входа, подписи, ошибки — возвращаются в систему.</p></div><div class="btns"><button class="bt" onclick="COURT={step:0,log:[]};render()">Сначала</button><button class="bt p" onclick="cStep()" ${COURT.step>=4?'disabled':''}>${['Выбрать документ','Подписать ЭЦП','Загрузить','Получить квитанцию'][COURT.step]||'Подано'}</button></div></div>
${said('Из системы должен быть выход в судебный кабинет для загрузки документов — сделать там цифровой след и вернуться обратно домой, в нашу систему.')}
<div class="route">${CSTEPS.map((s,i)=>`<div class="rs ${i<COURT.step?'ok':i===COURT.step?'now':'wait'}"><code>Шаг ${i+1}</code><b>${s}</b><em>${i<COURT.step?'готово':i===COURT.step?'сейчас':'ждёт'}</em></div>`).join('<i class="ra">→</i>')}</div>
<div class="g2"><div class="pan"><h3>Подача по делу Д-112</h3><div class="trail">${COURT.log.map(l=>`<div class="${l[2]}"><code>${l[0]}</code>${esc(l[1])}</div>`).join('')||'<div>Нажмите «Выбрать документ», чтобы пройти подачу.</div>'}</div></div>
<div class="pan"><h3>Спорный случай: «кабинет не работал»</h3><div class="trail">${TRAIL.map(l=>`<div class="${l[2]}"><code>${l[0]}</code>${esc(l[1])}</div>`).join('')}</div><p class="sm2 mut">Цифровой след показывает, что именно произошло — без споров «я пыталась, но не грузилось».</p></div></div>`;
/* документы */
const TPL=[['Исковое заявление','ГПК ст. 148'],['Досудебная претензия','ГК ст. 349'],['Отзыв на иск','ГПК ст. 166'],['Апелляционная жалоба','ГПК ст. 403'],['Адвокатский запрос','Закон об адвокатской деятельности'],['Договор об оказании юридических услуг','с условием о гонораре успеха']];
function tplOpen(i){const c=CS(CASE);openM(TPL[i][0],esc(c.id)+' · '+esc(CLN(c.cl)),`<div class="pan" style="font-family:'PT Serif',serif;font-size:13px;line-height:1.6"><p style="text-align:right">В ${esc(c.court==='—'?'суд по месту нахождения ответчика':c.court)}<br>Истец: ${esc(CLN(c.cl))}</p><p style="text-align:center"><b>${TPL[i][0].toUpperCase()}</b></p><p>${esc(c.title)}. Основание: ${TPL[i][1]}. Реквизиты сторон, суммы и даты подставлены из карточки дела.</p><p>Приложение: копии документов из папки клиента (4 файла).</p></div><div class="btns l"><button class="bt p" onclick="closeM();toast('Документ сохранён в папку дела и отправлен юристу на проверку.')">Сохранить в папку дела</button><button class="bt" onclick="closeM();go('court')">Подать в суд</button></div>`)}
SC.docs=()=>`<div class="hd"><div><h2>Документы и шаблоны</h2><p>Шаблоны ваших документов с подстановкой данных клиента и дела. Готовый документ сохраняется в папку дела и подаётся в суд из системы. Почта на вашем сервере — видно, кто и когда отправил документ.</p></div></div>
<div class="g2"><div class="pan"><h3>Шаблоны</h3><div class="tw"><table class="t"><tbody>${TPL.map((t,i)=>`<tr onclick="tplOpen(${i})"><td><b>${t[0]}</b><br><span class="mut">${t[1]}</span></td><td class="r"><button class="bt sm">Сформировать</button></td></tr>`).join('')}</tbody></table></div></div>
<div class="pan"><h3>Журнал отправок · почта на вашем сервере</h3><div class="tw"><table class="t sm"><thead><tr><th>Когда</th><th>Кто</th><th>Документ</th><th>Кому</th></tr></thead><tbody>
<tr><td>17.11 16:40</td><td>Айдос</td><td>Ходатайство · Д-112</td><td>СМЭС, канцелярия</td></tr><tr><td>17.11 11:05</td><td>Мадина</td><td>Проект соглашения · Д-118</td><td>Клиент</td></tr><tr><td>15.11 18:22</td><td>Руслан</td><td>Претензия · Д-089 — <span class="bad">не отправлена</span></td><td>—</td></tr></tbody></table></div><p class="sm2 mut">Потеряли документ — история показывает, у кого он был и куда ушёл.</p></div></div>`;
/* гонорар успеха */
function feeBill(id){const c=CS(id);c.feeSt='bill';render();toast(`${id}: счёт на гонорар успеха ${tg(c.feeBase*c.fee/100)} выставлен клиенту, напоминания об оплате — через 5 и 10 дней.`)}
function feePaid(id){const c=CS(id);c.feeSt='paid';c.st='fee';render();toast(`${id}: гонорар успеха получен — дело закрыто «Спасибо, что обратились».`)}
SC.fee=()=>{const L=CASES.filter(c=>c.fee&&seeCase(c));
return `<div class="hd"><div><h2>Гонорар успеха</h2><p>Success fee прописан в договоре процентом от суммы, которую получил клиент. Когда решение вступает в силу, система сама ставит задачу выставить счёт и следит, чтобы гонорар не забыли получить.</p></div></div>
<div class="strip"><div><small>Ожидается по делам в работе</small><b>${tg(L.filter(c=>c.st!=='fee').reduce((a,c)=>a+c.feeBase*c.fee/100,0))}</b></div><div><small>К выставлению сейчас</small><b class="bad">${tg(L.filter(c=>c.st==='fee'&&c.feeSt!=='paid').reduce((a,c)=>a+c.feeBase*c.fee/100,0))}</b></div><div><small>Получено за год</small><b class="ok">${tg(4380000)}</b></div></div>
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Дело</th><th>Клиент</th><th class="r">Сумма для клиента</th><th class="r">%</th><th class="r">Гонорар</th><th>Этап</th><th></th></tr></thead><tbody>${L.map(c=>`<tr><td>${c.id}</td><td>${esc(CLN(c.cl))}</td><td class="r">${tg(c.feeBase)}</td><td class="r">${c.fee}%</td><td class="r"><b>${tg(c.feeBase*c.fee/100)}</b></td><td>${c.feeSt==='paid'?tag('получен','g'):c.feeSt==='bill'?tag('счёт выставлен','w'):c.st==='fee'?tag('выставить','r'):tag(stN(c.st),'b')}</td><td>${c.st==='fee'&&!c.feeSt?`<button class="bt sm p" onclick="feeBill('${c.id}')">Выставить счёт</button>`:c.feeSt==='bill'?`<button class="bt sm" onclick="feePaid('${c.id}')">Оплачен</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>`};
/* библиотека */
function amRead(id){AMEND.find(a=>a.id===id).st='read';render();toast('Поправка отмечена прочитанной. Ответственные по связанным делам получили уведомление.')}
SC.lib=()=>`<div class="hd"><div><h2>Библиотека норм и поправки из Әділет</h2><p>Своя библиотека правовых норм со ссылками. Изменения подтягиваются из открытого государственного банка НПА (adilet.zan.kz): что поправили, что утратило силу, с какой даты. Система сама показывает, каких дел это касается.</p></div></div>
${said('Нам нужно, чтобы из этого портала к нам шли данные: если существует поправка, она уже лежит у нас с оповещением — что изменили, что утратило силу и дата вступления. Мы платим за подписку только за оповещения.','Подписка на коммерческую правовую базу ради уведомлений больше не нужна.')}
<div class="g21"><div class="pan"><h3>Лента поправок</h3>${AMEND.map(a=>`<div class="amend ${a.st==='new'?'new':''}"><b>${esc(a.code)}, ${a.art} ${a.st==='new'?tag('новое','r'):''}</b><span>${esc(a.what)} · вступает ${a.from}${a.cases.length?' · касается: '+a.cases.join(', '):''}</span>${a.st==='new'?`<div class="btns l"><button class="bt sm" onclick="amRead('${a.id}')">Прочитано</button></div>`:''}</div>`).join('')}</div>
<div class="pan"><h3>Библиотека</h3>${NORMS.map(g=>`<p style="margin:8px 0 4px"><b>${g.g}</b></p><div class="tw"><table class="t sm"><tbody>${g.l.map(n=>`<tr><td>${n[0]}</td><td class="mut">${n[1]}</td></tr>`).join('')}</tbody></table></div>`).join('')}</div></div>`;
/* аутсорсеры */
function payOut(id){toast(`Выплата ${esc(LN(id))} отмечена: сумма за подтверждённые часы ушла в управленческий учёт как расход.`)}
SC.out=()=>`<div class="hd"><div><h2>Юристы-аутсорсеры</h2><p>Удалённые юристы по договору: какие дела ведут, сколько часов заявили и сколько подтверждено активностью в системе, ставка и выплата.</p></div></div>
${said('Содержать штатного юриста сейчас очень дорого. Чтобы масштабироваться с меньшей кровью, мы сделали договоры с удалёнными сотрудниками — они берут дела и работают как выездной сервис.')}
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Юрист</th><th>Направление</th><th class="r">Дел</th><th class="r">Заявлено ч</th><th class="r">Подтверждено ч</th><th class="r">Ставка</th><th class="r">К выплате</th><th></th></tr></thead><tbody>${TIME.map(r=>{const l=LAW.find(x=>x.id===r.who);const conf=r.days.reduce((a,d)=>a+d[1],0);return `<tr><td><b>${esc(l.n)}</b></td><td>${esc(l.sp)}</td><td class="r">${CASES.filter(c=>c.resp===l.id).length}</td><td class="r">${r.claim}</td><td class="r ${conf<r.claim*.7?'bad':''}">${conf.toFixed(1).replace('.',',')}</td><td class="r">${tg(l.rate)}</td><td class="r"><b>${tg(conf*l.rate)}</b></td><td><button class="bt sm" onclick="payOut('${l.id}')">Выплатить</button></td></tr>`}).join('')}</tbody></table></div><p class="sm2 mut">К выплате считается по подтверждённым часам. Разницу юрист может обосновать — например, выездом в суд, отмеченным в задаче.</p></div>`;
function dayStart(){DAY.start=NOW;render();toast('Рабочий день начат в 09:40 — отметка ушла в учёт времени.')}
function dayEnd(){DAY.end='18:10';render();toast('Рабочий день закрыт: 8 ч 30 мин в системе, активность 6 ч 50 мин.')}
SC.time=()=>`<div class="hd"><div><h2>Рабочее время и цифровой след</h2><p>День начинается и заканчивается в системе. Активность считается по действиям: открытые дела, документы, задачи, подачи в суд, письма — а не по движению мышкой.</p></div><div class="btns"><button class="bt ${DAY.start?'':'p'}" onclick="dayStart()" ${DAY.start?'disabled':''}>${DAY.start?'Начат в '+DAY.start:'Начать день'}</button><button class="bt" onclick="dayEnd()" ${!DAY.start||DAY.end?'disabled':''}>${DAY.end?'Закрыт в '+DAY.end:'Закончить день'}</button></div></div>
${said('Особенно для аутсорсеров, которые говорят «я потратила пять часов, оплатите часовую ставку», — эта функция учёта времени, когда происходят активные действия, важна.')}
<div class="pan"><h3>Неделя 9–13 ноября · в системе / активные действия, часов</h3><div class="tw"><table class="t"><thead><tr><th>Юрист</th>${['Пн','Вт','Ср','Чт','Пт'].map(d=>`<th class="r">${d}</th>`).join('')}<th class="r">Заявлено</th><th style="width:22%">Активность</th></tr></thead><tbody>${TIME.map(r=>{const conf=r.days.reduce((a,d)=>a+d[1],0);return `<tr><td><b>${esc(LN(r.who))}</b></td>${r.days.map(d=>`<td class="r mono">${String(d[0]).replace('.',',')} / ${String(d[1]).replace('.',',')}</td>`).join('')}<td class="r">${r.claim}</td><td>${bar(pct(conf,r.claim),conf<r.claim*.7?'r':'g')}</td></tr>`}).join('')}</tbody></table></div></div>
<div class="pan"><h3>Цифровой след: Айдос, 12.11</h3><div class="trail">${TRAIL.map(l=>`<div class="${l[2]}"><code>${l[0]}</code>${esc(l[1])}</div>`).join('')}</div></div>`;
/* деньги */
SC.fin=()=>{const prep=CASES.filter(c=>!['avr','fee'].includes(c.st)).reduce((a,c)=>a+c.paid,0);
return `<div class="hd"><div><h2>Деньги и признание дохода</h2><p>Управленческий учёт отдельно от бухгалтерии. Деньги приходят предоплатами, а доход признаётся только когда дело закрыто актом выполненных работ. Расходы — и официальные из 1С, и подрядчики-физлица.</p></div></div>
${said('Суды могут длиться годами. Мы не можем закрывать предоплатные сделки раньше, чем завершился процесс, — в доход садим только то, что фактически закрылось по АВР в этом периоде.')}
<div class="strip"><div><small>Поступило в ноябре</small><b>${tg(12100000)}</b></div><div><small>Признано доходом (АВР)</small><b>${tg(9600000)}</b></div><div><small>Предоплаты по делам в работе</small><b>${tg(prep)}</b><span>возможен возврат — не доход</span></div><div><small>Расходы ноября</small><b>${tg(EXP.reduce((a,e)=>a+e[1],0))}</b></div></div>
<div class="g2"><div class="pan"><h3>Поступления и признанный доход, млн ₸</h3><div class="tw"><table class="t"><thead><tr><th>Месяц</th><th class="r">Поступило</th><th class="r">Признано по АВР</th><th style="width:40%"></th></tr></thead><tbody>${MONTHS.map((m,i)=>`<tr><td>${m}</td><td class="r">${String(CASH[i][0]).replace('.',',')}</td><td class="r">${String(CASH[i][1]).replace('.',',')}</td><td>${bar(pct(CASH[i][1],CASH[i][0]),'g')}</td></tr>`).join('')}</tbody></table></div></div>
<div class="pan"><h3>Расходы ноября</h3><div class="tw"><table class="t"><tbody>${EXP.map(e=>`<tr><td>${esc(e[0])}</td><td>${tag(e[2]==='1С'?'из 1С':'управленческий',e[2]==='1С'?'i':'a')}</td><td class="r">${tg(e[1])}</td></tr>`).join('')}</tbody></table></div><p class="sm2 mut">Расходы на подрядчиков без документов видны только в управленческом учёте и в бухгалтерию не попадают.</p></div></div>`};
SC.onec=()=>`<div class="hd"><div><h2>Данные из 1С бухгалтера · опция</h2><p>Бухгалтер работает в своей 1С. В систему приходит только пакет данных для финансового отчёта: оборот, обязательства, НДС к уплате. Бухгалтерия внутрь системы не переносится.</p></div><div class="btns"><button class="bt ${ONEC?'':'p'}" onclick="ONEC=!ONEC;render();toast(ONEC?'Пакет данных из 1С включён в отчёт.':'Пакет из 1С отключён.')">${ONEC?'Отключить':'Подключить 1С'}</button></div></div>
${said('Мне не нужна бухгалтерия внутри этой системы — мне нужно, чтобы пакет данных из 1С подтягивался в финансовый отчёт: текущий оборот, обязательства, НДС.')}
<div class="g2"><div class="pan"><h3>Что берём из 1С</h3><div class="tw"><table class="t"><tbody><tr><td>Оборот по счетам за месяц</td><td class="r">${ONEC?tg(10840000):'—'}</td></tr><tr><td>Обязательства перед бюджетом</td><td class="r">${ONEC?tg(1735000):'—'}</td></tr><tr><td>НДС к уплате (16%)</td><td class="r">${ONEC?tg(1496000):'—'}</td></tr><tr><td>Официальные расходы по статьям</td><td class="r">${ONEC?'6 статей':'—'}</td></tr></tbody></table></div></div>
<div class="pan"><h3>Что отдаём в 1С</h3><div class="tw"><table class="t"><tbody><tr><td>Контрагенты — новые клиенты-юрлица</td><td>${tag('по желанию','w')}</td></tr><tr><td>АВР по закрытым делам — для счетов-фактур</td><td>${tag('по желанию','w')}</td></tr></tbody></table></div><p class="sm2 mut">Обмен по протоколу OData, раз в день или по кнопке. Отдельный пакет — 800 000 ₸.</p></div></div>`;
let ROI={amo:12,lic:9,lu:24000,wa:180000,ig:120000,int:600000,base:2800000};
function roiSet(k,v){ROI[k]=+v||0;render()}
SC.roi=()=>{const year=ROI.lic*ROI.lu*12+ROI.wa+ROI.ig+ROI.int;const pay=ROI.base;const m=year?Math.ceil(pay/(year/12)):0;
return `<div class="hd"><div><h2>Окупаемость против amoCRM</h2><p>Считаем, сколько уходит в год на лицензии, сервисы и доработки сейчас, и за сколько месяцев окупается разовая разработка. Цифры условные — подставим ваши.</p></div></div>
${said('Мне кажется, проще один раз вложить и всё будет принадлежать нам на бесконечное количество лицензий, чем каждые полгода-год оплачивать систему, когда растёт число партнёров.','Собственнику — расчёт в цифрах: сейчас в год против разовой разработки.')}
<div class="g2"><div class="pan"><h3>Сейчас в год (условно)</h3><div class="roi">
<div><label>Пользователей с лицензией</label><input type="number" value="${ROI.lic}" onchange="roiSet('lic',this.value)"></div>
<div><label>Лицензия в месяц за пользователя, ₸</label><input type="number" value="${ROI.lu}" onchange="roiSet('lu',this.value)"></div>
<div><label>WhatsApp-интеграция в год, ₸</label><input type="number" value="${ROI.wa}" onchange="roiSet('wa',this.value)"></div>
<div><label>Instagram и рекламные кабинеты в год, ₸</label><input type="number" value="${ROI.ig}" onchange="roiSet('ig',this.value)"></div>
<div><label>Доработки и настройки интегратора в год, ₸</label><input type="number" value="${ROI.int}" onchange="roiSet('int',this.value)"></div>
<div><label>Разработка (стандартный пакет), ₸</label><input type="number" value="${ROI.base}" onchange="roiSet('base',this.value)"></div></div></div>
<div class="pan"><h3>Итог</h3><div class="kv"><span>Сейчас уходит в год</span><b>${tg(year)}</b></div><div class="kv"><span>Каждый новый юрист добавляет в год</span><b>${tg(ROI.lu*12)}</b></div><div class="kv"><span>Своя система: лицензии</span><b class="ok">0 ₸ при любом числе юристов</b></div><div class="kv"><span>Сервер в месяц</span><b>около 15 000 ₸</b></div><div class="kv tot"><span>Окупаемость</span><b>${m} мес.</b></div><p class="sm2 mut">При росте числа партнёров и аутсорсеров срок окупаемости сокращается: лицензий на каждого больше нет.</p></div></div>`};
/* система */
SC.roles=()=>{const R=['Управляющий партнёр','Собственник','Лидоруб','Юрист-клоузер','Юрист-аутсорсер','Бухгалтер'];const M=[['Заявки первой линии','y','y','y','n','n','n'],['Свои консультации и контракты','y','y','n','y','n','n'],['Чужие сделки и суммы','y','y','n','n','n','n'],['Свои клиенты и дела','y','y','p','y','y','n'],['Переданные дела','y','y','n','y','y','n'],['План работ, сроки, суд','y','p','n','y','y','n'],['Гонорар успеха','y','y','n','p','n','y'],['Деньги и признание дохода','y','y','n','n','n','y'],['Учёт времени аутсорсеров','y','y','n','n','p','y'],['Настройка доступов','y','n','n','n','n','n']];const V={y:'<span class="y">да</span>',n:'<span class="n">—</span>',p:'<span class="p">своё</span>'};
return `<div class="hd"><div><h2>Роли и доступы</h2><p>Каждый заходит под своей учётной записью. Доступ к клиентам и делам открывается назначением ответственным или передачей материала, все открытия — в журнале.</p></div></div>
<div class="pan"><div class="tw"><table class="t matrix"><thead><tr><th>Раздел</th>${R.map(r=>`<th class="c">${r}</th>`).join('')}</tr></thead><tbody>${M.map(r=>`<tr><td>${r[0]}</td>${r.slice(1).map(v=>`<td class="c">${V[v]}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="sm2 mut">Пользователей без ограничений: новый юрист-аутсорсер — новая учётная запись, без лицензии.</p></div>`};
SC.move=()=>`<div class="hd"><div><h2>Переезд с amoCRM</h2><p>Переносим клиентов, сделки и историю переписки из amoCRM, обучаем команду по ролям — каждому только его экраны, поэтому учить проще.</p></div></div>
${said('Учить их этому, а потом снова переучивать — титанический труд, в который я не хочу идти.','В системе только ваши этапы и кнопки — юрист видит три-четыре экрана, а не весь конструктор.')}
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Что</th><th>Как</th><th>Когда</th></tr></thead><tbody>
<tr><td>Контакты и компании</td><td>выгрузка из amoCRM по API, проверка дублей</td><td>неделя 2</td></tr><tr><td>Сделки продажной и процессной воронок</td><td>сопоставление этапов с новыми воронками</td><td>неделя 2</td></tr><tr><td>Примечания, задачи, переписка</td><td>в карточку клиента, по датам</td><td>неделя 3</td></tr><tr><td>Параллельная работа</td><td>неделю работаете в обеих системах, затем amoCRM отключается</td><td>неделя 4–5</td></tr><tr><td>Обучение</td><td>по ролям, видеоинструкции на каждый экран</td><td>неделя 5</td></tr></tbody></table></div></div>`;
SC.pack=()=>`<div class="hd"><div><h2>Стандартный пакет разработки</h2><p>Что входит в 2 800 000 ₸, что считаем отдельно и как идёт работа. Хотелки собственника отмечаем: в пакет или сверх пакета с ценой.</p></div></div>
<div class="g2"><div class="pan"><h3>Входит</h3><div class="alist"><a><i class="dt g"></i><b>Портал под ваши процессы</b><span>две линии продаж, воронка дел, план работ, сроки, задачи</span></a><a><i class="dt g"></i><b>Роли и доступы</b><span>каждый видит своё, журнал доступа</span></a><a><i class="dt g"></i><b>Документы, библиотека, отчёты</b><span>шаблоны, папки дел, отчёт руководителю, аналитика</span></a><a><i class="dt g"></i><b>Интеграции по открытому API</b><span>WhatsApp, Instagram, ваш бот, телефония, Google и Meta, Әділет, судебный кабинет</span></a><a><i class="dt g"></i><b>Переезд, сервер, обучение</b><span>перенос из amoCRM, сервер и копии, 3 месяца поддержки</span></a></div></div>
<div class="pan"><h3>Отдельно</h3><div class="alist"><a><i class="dt w"></i><b>Интеграция с 1С — 800 000 ₸</b><span>пакет данных для финотчёта</span></a><a><i class="dt i"></i><b>Приложения в App Store и Google Play</b><span>система работает в браузере телефона</span></a><a><i class="dt i"></i><b>Закрытые API без доступа</b><span>подключаем, когда сервис даёт ключ</span></a><a><i class="dt i"></i><b>ИИ-агенты, платные подписки сервисов</b><span>оцениваем отдельно</span></a></div></div></div>`;
let WITH1C=false;
SC.launch=()=>{const t=2800000+(WITH1C?800000:0);
return `<div class="hd"><div><h2>Стоимость</h2><p>Один раз за разработку — без лицензий на каждого юриста и без абонплаты. Код и сервер ваши.</p></div></div>
<div class="g2"><div class="pan price"><h3>Состав</h3><div class="kv"><span>Стандартный пакет разработки</span><b>${tg(2800000)}</b></div><label class="chk2"><input type="checkbox" ${WITH1C?'checked':''} onchange="WITH1C=this.checked;render()"> Интеграция с 1С бухгалтера · ${tg(800000)}</label><div class="kv tot"><span>Итого, без НДС</span><b>${tg(t)}</b></div><p class="sm2 mut">4–6 недель. Поддержка 3 месяца, далее 20 $ в час по необходимости.</p></div>
<div class="pan"><h3>Оплата 30 / 40 / 30</h3><div class="kv"><span>Старт</span><b>${tg(t*.3)}</b></div><div class="kv"><span>База на вашем сервере</span><b>${tg(t*.4)}</b></div><div class="kv"><span>Сдача после полировки</span><b>${tg(t*.3)}</b></div></div></div>
${said('Три миллиона мы как-то переживём — это инвестиция, а не трата.')}`};
/* ===== Каркас ===== */
function searchDemo(v){if(!v)return;const q=v.toLowerCase();const c=CL.find(x=>x.n.toLowerCase().includes(q));if(c){CURCL=c.id;go('client')}else toast('Не найдено в доступных вам клиентах.')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Управляющий партнёр';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map((s,i)=>`<a class="ri ${s.k===SECOF[cur]?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><code>${String(i+1).padStart(2,'0')}</code><span>${s.n}</span><small>${s.d}</small></a>`).join('');
 const S=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=S.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('');
 const h=document.getElementById('shint');if(h)h.innerHTML=`<b>${esc(role)}</b>${esc(ROLES[role].note)}`}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Аргумент';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function xls(){const h=`<html><head><meta charset="utf-8"></head><body><table border="1"><tr><th>Срок</th><th>Действие</th><th>Дело</th><th>Ответственный</th></tr>${TASKS.filter(t=>t.st==='open').map(t=>`<tr><td>${t.due}.11.2026</td><td>${esc(t.t)}</td><td>${t.cs}</td><td>${esc(LN(t.who))}</td></tr>`).join('')}</table></body></html>`;try{const b=new Blob(['\ufeff'+h],{type:'application/vnd.ms-excel'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='Отчёт_'+TODAY+'.xls';document.body.appendChild(a);a.click();a.remove()}catch(e){}toast('Файл <b>Отчёт.xls</b> скачан.')}
let theme='light';function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme()}
const TOUR=[['dash','1 · Отчёт руководителю: заявки, консультации, продажи, касса, горящие сроки.'],['line1','2 · Первая линия: бот ночью, лидоруб днём, запись к юристу.'],['line2','3 · Вторая линия: каждый клоузер видит только свои деньги.'],['cases','4 · Воронка дел: от договора до гонорара успеха.'],['plan','5 · План работ галочками → задачи с напоминанием за 2 дня.'],['cal','6 · Календарь сроков: красная зона не пропускается.'],['court','7 · Судебный кабинет: подача и цифровой след.'],['lib','8 · Поправки из Әділет приходят сами.'],['time','9 · Рабочее время аутсорсеров по действиям.'],['fin','10 · Деньги: предоплаты отдельно от признанного дохода.'],['roi','11 · Окупаемость против amoCRM.'],['launch','12 · 2,8 млн ₸, 4–6 недель, без лицензий.']];
let ti=-1,tRun=false;function tour(){if(tRun){tRun=false;return}tRun=true;ti=-1;step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){tRun=false;toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Управляющий партнёр');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();tRun=false}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
