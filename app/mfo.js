/* Кредитный портал · залоговая МФО — демо по встрече 14.09.2026 (Серик) */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const num=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const pct=(a,b)=>num(a/b*100)+'%';
const mln=n=>num(n/1000000)+' млн';
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};

/* ===== РАЗДЕЛЫ ===== */
const SEC=[
 {k:'dash', ic:'▦', n:'Пульт',      sub:[['dash','Сводка'],['analytics','Аналитика']]},
 {k:'leads',ic:'⇄', n:'Заявки',     sub:[['inbox','Входящие'],['funnel','Воронка'],['path','Путь заявки']]},
 {k:'risk', ic:'⚖', n:'Скоринг',    sub:[['scoring','Прескоринг'],['calc','Калькулятор'],['pledge','Залоги']]},
 {k:'loans',ic:'▤', n:'Займы',      sub:[['portfolio','Портфель'],['payments','Платежи'],['overdue','Просрочка'],['docs','Документы']]},
 {k:'cl',   ic:'☺', n:'Клиенты',    sub:[['clients','База клиентов'],['lk','Личный кабинет']]},
 {k:'chan', ic:'✆', n:'Каналы',     sub:[['comms','WhatsApp и звонки'],['site','Сайт и заявка']]},
 {k:'int',  ic:'⇆', n:'Интеграции', sub:[['integr','Внешние сервисы'],['c1','Обмен с 1С']]},
 {k:'mgmt', ic:'★', n:'Управление', sub:[['kpi','KPI специалистов'],['tasks','Задачи'],['reports','Отчётность']]},
 {k:'setup',ic:'⚙', n:'Настройки',  sub:[['settings','Поля и этапы'],['users','Пользователи'],['economy','Экономика'],['stack','Передача']]}
];
const SECOF={},SUBN={};
SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));

/* ===== РОЛИ ===== */
const ROLES={
 'Кредитный специалист':{av:'АЙ',n:'Айгерим',r:'продажи',note:'Свои заявки, прескоринг, залог, документы',
  s:['inbox','funnel','scoring','calc','pledge','docs','clients','lk','comms','tasks']},
 'Руководитель продаж':{av:'ДН',n:'Данияр',r:'отдел продаж',note:'Воронка, план, распределение заявок, скорость ответа',
  s:['dash','inbox','funnel','path','analytics','calc','clients','kpi','tasks','site','comms']},
 'Риск-менеджер':{av:'МД',n:'Мадина',r:'андеррайтинг',note:'Скоринг, пороги, залоги, решения и лимиты',
  s:['scoring','funnel','pledge','calc','portfolio','overdue','analytics','reports','settings']},
 'Юрист по залогам':{av:'ЕР',n:'Ерлан',r:'договоры и обременения',note:'Договоры займа и залога, регистрация обременений',
  s:['docs','pledge','clients','portfolio','tasks']},
 'Бухгалтер':{av:'АС',n:'Асель',r:'деньги и 1С',note:'Выдачи, погашения, сверка и обмен с 1С',
  s:['payments','portfolio','c1','reports','clients']},
 'Специалист по взысканию':{av:'ТМ',n:'Тимур',r:'просрочка',note:'Корзины просрочки, обзвон, досудебная работа',
  s:['overdue','payments','clients','comms','tasks']},
 'Директор':{av:'СР',n:'Серик',r:'руководство',note:'Портфель, деньги, риск, отчётность и стоимость владения',
  s:['dash','analytics','path','portfolio','overdue','kpi','reports','economy','integr','users','stack','settings','lk','site']}
};
let role='Директор',cur='dash',theme='light';

/* ===== ДАННЫЕ ===== */
const F={
 leads:312, preOk:154, approved:68, issued:51, avg:16000000,
 active:428, portfolio:3640000000, npl90:126000000, specialists:7, staff:20,
 get issuedSum(){return this.issued*this.avg},
 get convFull(){return this.issued/this.leads*100}
};
const CH=[['Сайт',119,'i'],['WhatsApp',75,'g'],['Звонок',65,'a'],['Офис',37,''],['Рекомендация',16,'v']];
const PRE_REJ=[['Просрочки в кредитной истории',62],['Высокая долговая нагрузка (КДН)',41],
 ['Нет подтверждённого дохода',23],['Активные исполнительные производства',14],
 ['Возраст или гражданство',10],['Дубль заявки',8]];
const POST_REJ=[['Залог не подошёл по ликвидности',28],['Клиента не устроила сумма или ставка',24],
 ['Клиент не вышел на связь',17],['Обременение на залоге',11],['Решение риск-менеджера',6]];
const BUCK=[['1–30 дней',14,108000000,'var(--warn)'],['31–60 дней',6,52000000,'#d9631f'],
 ['61–90 дней',3,27000000,'#c8452a'],['90+ дней',8,126000000,'var(--bad)']];
const PROD=[
 {n:'Под залог недвижимости',ltv:70,rate:3.0,term:'6–36 мес',share:64,cnt:274},
 {n:'Под залог автотранспорта',ltv:55,rate:3.5,term:'3–24 мес',share:34,cnt:146},
 {n:'Без залога · экспресс',ltv:0,rate:4.5,term:'3–12 мес',share:2,cnt:8}
];
const SPEC=[
 {n:'Айгерим',leads:52,issued:11,sum:182000000,plan:160000000,sla:'3 мин'},
 {n:'Данияр',leads:47,issued:9,sum:151000000,plan:160000000,sla:'4 мин'},
 {n:'Мадина',leads:44,issued:8,sum:139000000,plan:140000000,sla:'6 мин'},
 {n:'Ерлан',leads:45,issued:7,sum:112000000,plan:140000000,sla:'8 мин'},
 {n:'Асель',leads:43,issued:7,sum:106000000,plan:120000000,sla:'5 мин'},
 {n:'Тимур',leads:41,issued:5,sum:78000000,plan:120000000,sla:'11 мин'},
 {n:'Жанна',leads:40,issued:4,sum:48000000,plan:100000000,sla:'9 мин'}
];
/* этапы воронки — как описал клиент */
const ST=[
 ['new','Новая заявка','#69748a'],['pd','Согласие на обработку ПД','#2b6cb0'],
 ['pre','Прескоринг','#3a7fbf'],['score','Скоринг и решение','#6b4ea8'],
 ['pledgeS','Оценка залога','#b9761f'],['appr','Одобрено','#2f8f5b'],
 ['docsS','Документы','#1f8f7a'],['sign','Подписание и обременение','#13775f'],
 ['issue','Выдача','#0f6b4f']
];
const STN=Object.fromEntries(ST.map(s=>[s[0],s[1]]));
const STC=Object.fromEntries(ST.map(s=>[s[0],s[2]]));

let LEADS=[
 {id:2841,c:'Ахметов Р. К.',iin:'7804••••••31',s:'new',ch:'Сайт',mg:'Айгерим',sum:18000000,pl:'Квартира · Алматы',t:'2 мин',hot:1},
 {id:2842,c:'ТОО «Береке Строй»',iin:'0912••••••07',s:'new',ch:'Звонок',mg:'Данияр',sum:42000000,pl:'Коммерческая недвижимость',t:'6 мин',hot:1},
 {id:2843,c:'Сейтова А. М.',iin:'8611••••••44',s:'new',ch:'WhatsApp',mg:'Мадина',sum:9000000,pl:'Toyota Camry 2019',t:'11 мин',hot:1},
 {id:2836,c:'Жумабеков Д.',iin:'9003••••••18',s:'pd',ch:'Сайт',mg:'Айгерим',sum:14000000,pl:'Квартира · Астана'},
 {id:2837,c:'Нурланова Г.',iin:'8207••••••52',s:'pd',ch:'WhatsApp',mg:'Ерлан',sum:7500000,pl:'Hyundai Tucson 2021'},
 {id:2828,c:'Оспанов Б. Т.',iin:'7511••••••09',s:'pre',ch:'Сайт',mg:'Данияр',sum:23000000,pl:'Дом · Алматинская обл.'},
 {id:2829,c:'Каримова С.',iin:'8809••••••63',s:'pre',ch:'Офис',mg:'Асель',sum:11000000,pl:'Kia Sportage 2020'},
 {id:2830,c:'ИП Сатыбалды',iin:'8104••••••27',s:'pre',ch:'Рекомендация',mg:'Айгерим',sum:31000000,pl:'Торговое помещение'},
 {id:2819,c:'Мукашев А. Е.',iin:'7906••••••71',s:'score',ch:'Сайт',mg:'Мадина',sum:16000000,pl:'Квартира · Алматы'},
 {id:2820,c:'Досжанова М.',iin:'9107••••••38',s:'score',ch:'WhatsApp',mg:'Жанна',sum:6000000,pl:'Lada Vesta 2022'},
 {id:2811,c:'Абдрахманов К.',iin:'7302••••••15',s:'pledgeS',ch:'Звонок',mg:'Данияр',sum:27000000,pl:'Дом · Каскелен'},
 {id:2812,c:'ТОО «Астана Агро»',iin:'1104••••••82',s:'pledgeS',ch:'Рекомендация',mg:'Айгерим',sum:55000000,pl:'Складское помещение'},
 {id:2805,c:'Ибраева Ж. С.',iin:'8505••••••94',s:'appr',ch:'Сайт',mg:'Ерлан',sum:13000000,pl:'Квартира · Шымкент'},
 {id:2806,c:'Серикбаев Н.',iin:'8012••••••46',s:'appr',ch:'Офис',mg:'Тимур',sum:8500000,pl:'Mercedes E200 2018'},
 {id:2798,c:'Кенжебаев М.',iin:'7708••••••23',s:'docsS',ch:'Сайт',mg:'Мадина',sum:21000000,pl:'Квартира · Алматы'},
 {id:2799,c:'Алиева Д. Т.',iin:'8903••••••57',s:'docsS',ch:'WhatsApp',mg:'Асель',sum:12500000,pl:'Toyota Land Cruiser 2017'},
 {id:2790,c:'Байжанов С.',iin:'7405••••••68',s:'sign',ch:'Звонок',mg:'Айгерим',sum:34000000,pl:'Коммерческое помещение'},
 {id:2784,c:'Турсынова А.',iin:'8710••••••31',s:'issue',ch:'Сайт',mg:'Данияр',sum:17000000,pl:'Квартира · Алматы'},
 {id:2785,c:'ИП Нурмуханов',iin:'8301••••••75',s:'issue',ch:'Рекомендация',mg:'Ерлан',sum:26000000,pl:'Автопарк · 2 единицы'}
];
const LOANS=[
 {id:'З-4412',c:'Турсынова А. К.',sum:17000000,rest:14820000,rate:3.0,term:24,paid:4,next:'20.09',st:'Действует',pl:'Квартира, Алматы',ltv:58},
 {id:'З-4398',c:'ИП Нурмуханов',sum:26000000,rest:23140000,rate:3.5,term:18,paid:2,next:'22.09',st:'Действует',pl:'Автопарк, 2 ед.',ltv:52},
 {id:'З-4371',c:'Абишев Т. С.',sum:12000000,rest:8640000,rate:3.0,term:24,paid:9,next:'18.09',st:'Действует',pl:'Дом, Талгар',ltv:61},
 {id:'З-4355',c:'Сагындыкова Б.',sum:9500000,rest:7420000,rate:3.5,term:18,paid:5,next:'25.09',st:'Просрочка 12 дн',pl:'Kia K5 2021',ltv:54,od:12},
 {id:'З-4340',c:'ТОО «Куат»',sum:48000000,rest:41200000,rate:3.0,term:36,paid:6,next:'15.09',st:'Действует',pl:'Склад, Алматы',ltv:66},
 {id:'З-4318',c:'Мусаев К. Р.',sum:15000000,rest:13900000,rate:3.5,term:12,paid:1,next:'12.09',st:'Просрочка 47 дн',pl:'Toyota Prado 2019',ltv:49,od:47},
 {id:'З-4290',c:'Жаксылыкова А.',sum:22000000,rest:11800000,rate:3.0,term:24,paid:14,next:'28.09',st:'Действует',pl:'Квартира, Астана',ltv:57},
 {id:'З-4265',c:'Оразбаев Н.',sum:31000000,rest:29450000,rate:3.0,term:30,paid:2,next:'10.09',st:'Просрочка 96 дн',pl:'Дом, Каскелен',ltv:63,od:96}
];
const CLIENTS=[
 {n:'Турсынова Айгуль Кайратовна',iin:'8710••••••31',ph:'+7 701 ••• 44 12',loans:2,sum:29000000,st:'Действующий',since:'2024',seg:'Повторный'},
 {n:'ИП Нурмуханов Б. А.',iin:'8301••••••75',ph:'+7 707 ••• 19 08',loans:3,sum:61000000,st:'Действующий',since:'2023',seg:'Постоянный'},
 {n:'ТОО «Куат»',iin:'0904••••••12',ph:'+7 727 ••• 55 30',loans:2,sum:78000000,st:'Действующий',since:'2022',seg:'Корпоративный'},
 {n:'Абишев Тимур Серикович',iin:'7902••••••64',ph:'+7 747 ••• 02 77',loans:1,sum:12000000,st:'Действующий',since:'2025',seg:'Новый'},
 {n:'Мусаев Кайрат Русланович',iin:'8405••••••19',ph:'+7 700 ••• 81 46',loans:1,sum:15000000,st:'Просрочка',since:'2025',seg:'Проблемный'},
 {n:'Жаксылыкова Асем',iin:'9001••••••53',ph:'+7 708 ••• 37 25',loans:2,sum:34000000,st:'Действующий',since:'2023',seg:'Повторный'}
];
const TASKS=[
 {id:781,t:'Перезвонить — заявка висит 11 минут без ответа',who:'Мадина',due:'просрочено',grp:'late',lead:2843,ty:'Звонок'},
 {id:782,t:'Запросить справку о доходах по заявке 2828',who:'Данияр',due:'сегодня 15:00',grp:'today',lead:2828,ty:'Документы'},
 {id:783,t:'Выехать на осмотр залога — дом в Каскелене',who:'Ерлан',due:'сегодня 17:00',grp:'today',lead:2811,ty:'Осмотр'},
 {id:784,t:'Обзвон корзины 1–30 дней: 14 договоров',who:'Тимур',due:'сегодня',grp:'today',lead:0,ty:'Взыскание'},
 {id:785,t:'Подать документы на регистрацию обременения',who:'Ерлан',due:'завтра 11:00',grp:'week',lead:2790,ty:'Обременение'},
 {id:786,t:'Сформировать отчёт в кредитное бюро за сентябрь',who:'Асель',due:'30.09',grp:'week',lead:0,ty:'Отчётность'}
];

/* ===== СОСТОЯНИЕ ===== */
let fMine=false,pathStep=0,seq=2850;
let SC_STATE={step:0,gbdfl:null,kb:null,score:null,decision:null};
let CALC={sum:16000000,term:24,rate:3.2,type:0};
let ECON={bx:100000,users:20,dev:2000000,host:35000,years:3};
const SC={};

/* ===== ВСПОМОГАТЕЛЬНОЕ ===== */
const ini=n=>n.replace(/[«»"]/g,'').split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const AVC=['','a','i','v','g'];
const avc=n=>AVC[(n.charCodeAt(0)+n.length)%5];
const avatar=n=>`<span class="av ${avc(n)}" title="${esc(n)}">${esc(ini(n))}</span>`;
const head=(h,p,btns)=>`<div class="hd"><div><h2>${h}</h2><p>${p}</p></div>${btns?`<div class="btns">${btns}</div>`:''}</div>`;
/* аннуитетный платёж */
function annuity(sum,months,mRate){const r=mRate/100;return r?sum*r*Math.pow(1+r,months)/(Math.pow(1+r,months)-1):sum/months}
/* ГЭСВ — годовая эффективная ставка, упрощённо от месячной */
const gesv=mRate=>(Math.pow(1+mRate/100,12)-1)*100;

/* ====== ПУЛЬТ ====== */
SC.dash=()=>`${head('Пульт директора','Портфель, выдачи, качество и скорость за сентябрь. Всё считается из заявок, договоров и платежей — сводить руками в конце месяца не нужно.',
 '<button class="bt p" onclick="go(\'path\')">Путь заявки →</button><button class="bt" onclick="go(\'analytics\')">Аналитика</button>')}
 <div class="wid">
  <div><small>Портфель</small><b class="a">${mln(F.portfolio)} ₸</b><span>${F.active} действующих договоров</span></div>
  <div><small>Выдано за месяц</small><b>${mln(F.issuedSum)} ₸</b><span>${F.issued} ${plural(F.issued,['заём','займа','займов'])}</span></div>
  <div><small>Средний заём</small><b>${mln(F.avg)} ₸</b><span>залоговых 98%</span></div>
  <div><small>Заявок</small><b class="i">${F.leads}</b><span>конверсия в выдачу ${num(F.convFull)}%</span></div>
  <div><small>NPL 90+</small><b class="r">${num(F.npl90/F.portfolio*100)}%</b><span>${mln(F.npl90)} ₸</span></div>
 </div>
 <div class="g21">
  <div class="pan"><h3>Воронка заявок за месяц</h3><p>Где отсеиваются заявки и сколько доходит до денег.</p>
   ${[['Заявок принято',F.leads,''],['Прошли прескоринг',F.preOk,'i'],['Одобрено после скоринга и залога',F.approved,'w'],['Выдано',F.issued,'g']].map((r,i)=>
    `<div class="fr"><span>${esc(r[0])}</span>
     <div class="bar" style="--w:${r[1]/F.leads*100}%"><i class="${r[2]}"></i></div>
     <b>${fmt(r[1])} · ${pct(r[1],F.leads)}</b></div>`).join('')}
   <div class="note" style="--tone:var(--bad)"><b>Половина заявок отсеивается на прескоринге</b>
    <p>158 из 312 — и это правильно: они не дошли до специалиста и не съели его время. Но видно и обратное: из 154 прошедших до денег дошёл 51. Разрыв в 103 заявки — это то, где лежат деньги.</p></div>
   <h3 style="margin-top:16px">Откуда пришли заявки</h3><p>Сайт ещё в предзапуске и уже даёт больше трети.</p>
   ${CH.map(c=>`<div class="fr"><span>${esc(c[0])}</span>
    <div class="bar" style="--w:${c[1]/CH[0][1]*100}%"><i class="${c[2]}"></i></div>
    <b>${c[1]} · ${pct(c[1],F.leads)}</b></div>`).join('')}
   <div class="kv" style="margin-top:8px"><span>Дошло до выдачи с сайта</span><b>21 из 119</b></div>
   <div class="kv"><span>Дошло до выдачи по рекомендации</span><b style="color:var(--ok)">9 из 16</b></div>
  </div>
  <div>
   <div class="pan"><h3>Скорость — то, что вы назвали главным</h3>
    <div class="kv"><span>Среднее время до прескоринга</span><b style="color:var(--ok)">4 мин 12 с</b></div>
    <div class="kv"><span>Среднее время до звонка менеджера</span><b style="color:var(--ok)">6 мин</b></div>
    <div class="kv"><span>Заявок вне норматива 5 минут</span><b style="color:var(--bad)">37 из 312</b></div>
    <div class="kv"><span>Ждут ответа прямо сейчас</span><b style="color:var(--bad)">3</b></div>
    <div class="hint">Вы сказали: «пять минут, конечно, лучше, чем пять часов — за пять часов уже потеряешь». Норматив зашит в систему: таймер на карточке, эскалация руководителю и отчёт по каждому специалисту.</div>
   </div>
   <div class="pan"><h3>Просрочка по корзинам</h3>
    ${BUCK.map(b=>`<div class="kv"><span>${esc(b[0])}</span><b>${b[1]} дог. · ${mln(b[2])} ₸</b></div>`).join('')}
    <div class="kv"><span><b>Итого проблемных</b></span><b style="color:var(--bad)">${BUCK.reduce((a,b)=>a+b[1],0)} дог. · ${mln(BUCK.reduce((a,b)=>a+b[2],0))} ₸</b></div>
   </div>
  </div>
 </div>
 <div class="pan"><h3>Продукты</h3><p>Доли в портфеле — 98% залоговых, как вы и говорили.</p>
  <div class="tw" style="border:0"><table class="t"><thead><tr><th>Продукт</th><th class="r">Договоров</th><th class="r">Доля портфеля</th><th class="r">Ставка, мес</th><th class="r">Макс. LTV</th><th>Срок</th></tr></thead>
  <tbody>${PROD.map(p=>`<tr onclick="toast('Параметры продукта — ставка, максимальный LTV, срок, требования к залогу и пороги скоринга — настраиваются в разделе «Настройки» без разработчика.')">
   <td><b>${esc(p.n)}</b></td><td class="r">${p.cnt}</td><td class="r">${p.share}%</td>
   <td class="r">${num(p.rate)}%</td><td class="r">${p.ltv?p.ltv+'%':'—'}</td><td class="sub2">${esc(p.term)}</td></tr>`).join('')}</tbody></table></div>
 </div>`;

/* ====== ПУТЬ ЗАЯВКИ ====== */
const PATH=[
 ['Клиент нажал «Подать заявку» на сайте','ИИН, телефон, сумма 18 млн ₸, тип залога — квартира. Форма из четырёх полей, дольше клиент не заполняет.','Заявка ушла в портал напрямую с сайта, без почты и без ручного переноса.','Сайт'],
 ['Заявка в системе','Канал «Сайт» проставлен, специалист назначен по очереди, пошёл таймер норматива.','Айгерим видит карточку через 8 секунд после нажатия кнопки. Таймер 5 минут запущен.','Система'],
 ['Согласие на обработку персональных данных','Клиенту ушёл код в WhatsApp, он подтвердил в один клик.','Без согласия запрос в ГБД ФЛ и бюро невозможен — система не даст перейти дальше. Согласие с отметкой времени легло в карточку.','Система'],
 ['Запрос в ГБД ФЛ','По ИИН: ФИО, дата рождения, документ, адрес прописки, семейное положение.','Данные подставились в карточку сами. Менеджер ничего не набирает и не ошибается в ИИН.','ГБД ФЛ'],
 ['Запрос в кредитное бюро','Кредитная история, действующие обязательства, просрочки за 5 лет, долговая нагрузка.','Найдено 2 действующих кредита на 3,1 млн ₸, просрочек нет. КДН 27% — в пределах порога.','Кредитное бюро'],
 ['Скоринг','Балл 724 при пороге 650. Предварительный лимит 18 млн ₸ под залог квартиры.','Решение — предварительно одобрено. Пороги и веса задаются вами в настройках, не нами в коде.','Скоринговый движок'],
 ['Ответ клиенту','WhatsApp: «Предварительно одобрено до 18 млн ₸. Менеджер перезвонит в течение 5 минут».','Прошло 4 минуты 12 секунд с момента заявки. Клиент ещё на сайте и ещё тёплый.','Система'],
 ['Оценка залога','Квартира, 62 м², Алматы. Оценка 31 млн ₸, LTV 58% при лимите 70%. Обременений нет.','Проверка обременений по базе, фото и отчёт оценщика прикреплены к карточке. LTV считается сам.','Айгерим · специалист'],
 ['Документы и подписание','Договор займа, договор залога, график платежей — собраны по шаблону с подставленными данными.','Ни одного документа не набирали руками. Обременение подано на регистрацию, статус виден в карточке.','Ерлан · юрист'],
 ['Выдача','Перевод 18 млн ₸, договор в портфеле, график построен, личный кабинет клиента активен.','Заявка стала займом. С этого момента она живёт в портфеле, в графике платежей и в отчётности.','Система']
];
SC.path=()=>{
 const auto=PATH.filter((_,i)=>i<=pathStep&&['Система','ГБД ФЛ','Кредитное бюро','Скоринговый движок','Сайт'].includes(PATH[i][3])).length;
 return `${head('Путь заявки','Десять шагов от нажатия кнопки на сайте до выдачи денег. Нажимайте «Следующий шаг» — видно, что делает человек, а что система, и сколько времени это занимает.',
  `<button class="bt p" onclick="pathNext()">${pathStep>=PATH.length-1?'Пройти заново':'Следующий шаг →'}</button><button class="bt" onclick="pathReset()">Сбросить</button>`)}
 <div class="wid">
  <div><small>Шаг</small><b class="a">${pathStep+1} из ${PATH.length}</b><span>${esc(PATH[pathStep][0]).slice(0,34)}</span></div>
  <div><small>Сделала система</small><b class="g">${auto}</b><span>шагов без человека</span></div>
  <div><small>Участие человека</small><b>${pathStep+1-auto}</b><span>звонок, осмотр, документы</span></div>
  <div><small>До ответа клиенту</small><b class="i">${pathStep>=6?'4 мин 12 с':'идёт отсчёт'}</b><span>норматив 5 минут</span></div>
  <div><small>Сумма займа</small><b>18 млн ₸</b><span>залог — квартира, LTV 58%</span></div>
 </div>
 <div class="g21">
  <div class="pan"><h3>Заявка № 2851</h3><p>Ахметов Р. К. · сайт · специалист Айгерим</p>
   <div class="tl">${PATH.map((p,i)=>`<div class="tli ${i<pathStep?'ok':i===pathStep?'on':''}" style="${i>pathStep?'opacity:.4':''}">
     <span class="who">${esc(p[3])}</span><b>${i+1}. ${esc(p[0])}</b><p>${esc(p[1])}</p>
     ${i<=pathStep?`<div class="note" style="--tone:${['Система','ГБД ФЛ','Кредитное бюро','Скоринговый движок','Сайт'].includes(p[3])?'var(--ok)':'var(--acc)'};margin-top:7px"><p>${esc(p[2])}</p></div>`:''}
    </div>`).join('')}</div>
  </div>
  <div>
   <div class="pan"><h3>Что уже известно о клиенте</h3><p>Поля заполняются по ходу, вручную не набираются.</p>
    ${[['ИИН','780412••••31',pathStep>=0],['Телефон','+7 701 ••• 44 12',pathStep>=0],['Канал','Сайт',pathStep>=1],
       ['Согласие на обработку ПД','получено, 10:14',pathStep>=2],['ФИО и документ','из ГБД ФЛ',pathStep>=3],
       ['Кредитная история','2 кредита, просрочек нет',pathStep>=4],['Долговая нагрузка','КДН 27%',pathStep>=4],
       ['Скоринговый балл','724 из 1000',pathStep>=5],['Решение','предварительно одобрено',pathStep>=5],
       ['Залог и оценка','квартира, 31 млн ₸',pathStep>=7],['LTV','58% при лимите 70%',pathStep>=7],
       ['Договоры','займа и залога подписаны',pathStep>=8]].map(([k,v,on])=>
     `<div class="kv"><span>${esc(k)}</span><b style="color:${on?'var(--ok)':'var(--muted2)'}">${on?esc(v):'—'}</b></div>`).join('')}
   </div>
   <div class="pan"><h3>Почему это важно именно вам</h3>
    <div class="note" style="--tone:var(--acc)"><b>Пять минут — не лозунг, а норматив в системе</b>
     <p>Таймер на карточке, автоэскалация руководителю при превышении, отчёт по каждому специалисту. Вы сами сказали: за пять часов клиента уже потеряешь.</p></div>
    <div class="note" style="--tone:var(--ok)"><b>Семь из десяти шагов — без человека</b>
     <p>Специалист подключается там, где нужен человек: звонок, осмотр залога, переговоры по сумме. Остальное делают интеграции.</p></div>
   </div>
  </div>
 </div>`};
function pathNext(){pathStep=pathStep>=PATH.length-1?0:pathStep+1;render();
 if(pathStep===0){toast('Сценарий сброшен. На встрече удобно вести по шагам и останавливаться там, где у вас по-другому.');return}
 const p=PATH[pathStep];toast(`<b>Шаг ${pathStep+1}. ${esc(p[0])}</b> — ${esc(p[2])}`);
 if(pathStep===PATH.length-1)sparks()}
function pathReset(){pathStep=0;render();toast('Путь заявки сброшен на первый шаг.')}

/* ====== ПРЕСКОРИНГ — живой прогон ====== */
SC.scoring=()=>{
 const S=SC_STATE;
 const card=(n,title,state,body,btn)=>`
  <div class="sbox ${state}">
   <div class="sh"><span class="sn">${n}</span>${state==='done'?'<span class="tag g">получено</span>':state==='run'?'<span class="tag i"><span class="spin"></span> запрос</span>':'<span class="tag">ожидает</span>'}</div>
   <h5>${title}</h5>${body}${btn||''}</div>`;
 return `${head('Прескоринг','Вы описали цепочку: заявка зашла → специалист забрал → взял согласие → отправил на прескоринг → пришло решение. Здесь она работает по-настоящему: нажмите кнопки по очереди и посмотрите, за сколько приходит ответ.',
  '<button class="bt" onclick="scReset()">Сбросить</button><button class="bt p" onclick="scAll()">Прогнать всё сразу</button>')}
 <div class="wid">
  <div><small>Заявка</small><b class="a">№ 2851</b><span>Ахметов Р. К.</span></div>
  <div><small>Запрошено</small><b>18 млн ₸</b><span>залог — квартира</span></div>
  <div><small>Этап</small><b class="i">${['согласие','ГБД ФЛ','бюро','скоринг','решение'][Math.min(4,S.step)]}</b><span>шаг ${Math.min(4,S.step)+1} из 5</span></div>
  <div><small>Прошло времени</small><b>${['0:00','0:38','1:52','3:07','4:12'][Math.min(4,S.step)]}</b><span>норматив 5 минут</span></div>
  <div><small>Решение</small><b class="${S.decision==='ok'?'g':S.decision==='no'?'r':''}">${S.decision==='ok'?'Одобрено':S.decision==='no'?'Отказ':'—'}</b><span>${S.decision?'предварительное':'ещё не вынесено'}</span></div>
 </div>
 <div class="score">
  ${card('Шаг 1','Согласие на обработку персональных данных',S.step>0?'done':'',
   S.step>0?`<div class="kv"><span>Способ</span><b>код в WhatsApp</b></div>
    <div class="kv"><span>Получено</span><b>10:14:32</b></div>
    <div class="kv"><span>Хранение</span><b>в карточке, с отметкой времени</b></div>`
   :`<p class="mini">Без согласия запросы в государственные базы и бюро невозможны. Система физически не пустит дальше.</p>`,
   S.step>0?'':'<div class="btns" style="margin-top:11px"><button class="bt p" onclick="scStep(1)">Запросить согласие</button></div>')}
  ${card('Шаг 2','ГБД ФЛ — государственная база физлиц',S.step>1?'done':S.step===1?'':'wait',
   S.gbdfl?`<div class="kv"><span>ФИО</span><b>${esc(S.gbdfl.fio)}</b></div>
    <div class="kv"><span>Дата рождения</span><b>${S.gbdfl.dr}</b></div>
    <div class="kv"><span>Документ</span><b>${esc(S.gbdfl.doc)}</b></div>
    <div class="kv"><span>Адрес прописки</span><b>${esc(S.gbdfl.adr)}</b></div>
    <div class="kv"><span>Статус</span><b style="color:var(--ok)">действителен</b></div>`
   :`<p class="mini">По ИИН подтягиваются ФИО, дата рождения, документ и адрес. Менеджер не набирает это руками и не ошибается в цифрах.</p>`,
   S.step===1?'<div class="btns" style="margin-top:11px"><button class="bt p" onclick="scStep(2)">Запросить ГБД ФЛ</button></div>':'')}
  ${card('Шаг 3','Кредитное бюро — история и нагрузка',S.step>2?'done':S.step===2?'':'wait',
   S.kb?`<div class="kv"><span>Действующих кредитов</span><b>${S.kb.act}</b></div>
    <div class="kv"><span>Сумма обязательств</span><b>${fmt(S.kb.debt)} ₸</b></div>
    <div class="kv"><span>Просрочки за 5 лет</span><b style="color:${S.kb.od?'var(--bad)':'var(--ok)'}">${S.kb.od?S.kb.od+' случая':'нет'}</b></div>
    <div class="kv"><span>Долговая нагрузка (КДН)</span><b style="color:${S.kb.kdn>50?'var(--bad)':'var(--ok)'}">${S.kb.kdn}%</b></div>
    <div class="kv"><span>Исполнительные производства</span><b style="color:var(--ok)">нет</b></div>`
   :`<p class="mini">Кредитная история, действующие обязательства, просрочки и коэффициент долговой нагрузки. Это основной отсев: половина заявок не проходит именно здесь.</p>`,
   S.step===2?'<div class="btns" style="margin-top:11px"><button class="bt p" onclick="scStep(3)">Запросить бюро</button></div>':'')}
 </div>
 <div class="g21">
  <div class="pan"><h3>Скоринговый балл и решение</h3><p>Веса и пороги задаёте вы — в настройках, а не мы в коде.</p>
   ${S.score?`<div style="display:flex;align-items:flex-end;gap:16px;margin:6px 0 4px">
     <div class="bignum" style="color:${S.score>=650?'var(--ok)':'var(--bad)'}">${S.score}</div>
     <div class="mini" style="padding-bottom:6px">из 1000 · порог одобрения <b>650</b></div></div>
    <div class="gauge"><i style="--w:${S.score/10}%"></i></div>
    <div class="kv"><span>Кредитная история</span><b>+280 из 350</b></div>
    <div class="kv"><span>Долговая нагрузка</span><b>+190 из 250</b></div>
    <div class="kv"><span>Доход и занятость</span><b>+154 из 200</b></div>
    <div class="kv"><span>Возраст и стаж</span><b>+100 из 120</b></div>
    <div class="kv"><span>Поведение по прошлым займам</span><b>0 из 80 · новый клиент</b></div>
    <div class="note" style="--tone:${S.decision==='ok'?'var(--ok)':'var(--bad)'}">
     <b>${S.decision==='ok'?'Предварительно одобрено · лимит 18 000 000 ₸':'Отказ на прескоринге'}</b>
     <p>${S.decision==='ok'?'Клиенту ушло сообщение в WhatsApp, специалисту поставлена задача перезвонить в течение 5 минут. Дальше — оценка залога.':'Клиенту отправлено уведомление с рекомендацией обратиться через 90 дней. Заявка закрыта с причиной и попала в аналитику.'}</p></div>`
   :`<p class="mini">Балл считается после ответов ГБД ФЛ и бюро. Пройдите шаги слева — или нажмите «Прогнать всё сразу».</p>
     <div class="gauge"><i style="--w:0%"></i></div>`}
  </div>
  <div class="pan"><h3>Почему отсеиваются заявки</h3><p>158 из 312 за месяц — разрез по причинам.</p>
   ${PRE_REJ.map(r=>`<div class="fr"><span>${esc(r[0])}</span>
     <div class="bar" style="--w:${r[1]/62*100}%"><i class="r"></i></div><b>${r[1]}</b></div>`).join('')}
   <div class="hint">Каждая причина — поле, а не текст в примечании. Поэтому этот отчёт собирается сам и по нему видно, что менять: пороги, продукт или источник трафика.</div>
  </div>
 </div>`};
function scStep(n){const S=SC_STATE;
 if(n===1){S.step=1;render();toast('Согласие на обработку персональных данных получено — код подтверждён в WhatsApp за 38 секунд. Теперь запросы в государственные базы законны.');return}
 if(n===2){S.step=2;S.gbdfl={fio:'Ахметов Руслан Каирбекович',dr:'12.04.1978',doc:'уд. личности № 04••••56',adr:'г. Алматы, Бостандыкский р-н'};
  render();toast('<b>ГБД ФЛ ответила за 1,2 секунды.</b> ФИО, дата рождения, документ и адрес подставлены в карточку — менеджер не набирал ни одного символа.');return}
 if(n===3){S.step=3;S.kb={act:2,debt:3140000,od:0,kdn:27};S.score=724;S.decision='ok';S.step=4;
  render();sparks();
  toast('<b>Кредитное бюро: просрочек нет, КДН 27%.</b> Скоринговый балл 724 при пороге 650 — предварительно одобрено до 18 млн ₸. С момента заявки прошло 4 минуты 12 секунд.');return}}
function scAll(){scStep(1);setTimeout(()=>scStep(2),700);setTimeout(()=>scStep(3),1500)}
function scReset(){SC_STATE={step:0,gbdfl:null,kb:null,score:null,decision:null};render();toast('Прескоринг сброшен — можно показать заново.')}

/* ====== КАЛЬКУЛЯТОР ====== */
SC.calc=()=>{
 const p=PROD[CALC.type], rate=CALC.rate, pay=annuity(CALC.sum,CALC.term,rate);
 const total=pay*CALC.term, over=total-CALC.sum, ef=gesv(rate);
 const pledgeNeed=p.ltv?CALC.sum/(p.ltv/100):0;
 let rest=CALC.sum, rows='';
 for(let i=1;i<=Math.min(CALC.term,60);i++){
  const int=rest*rate/100, body=pay-int; rest=Math.max(0,rest-body);
  rows+=`<tr><td class="r">${i}</td><td class="r">${fmt(pay)}</td><td class="r">${fmt(body)}</td><td class="r">${fmt(int)}</td><td class="r">${fmt(rest)}</td></tr>`;
 }
 return `${head('Кредитный калькулятор','Менеджер считает условия прямо в карточке заявки: платёж, переплата, ГЭСВ и график. Клиент получает цифры в разговоре, а не «перезвоню через час».',
  '<button class="bt" onclick="toast(\'График платежей выгружается в PDF и уходит клиенту в WhatsApp одной кнопкой — вместе с договором.\')">Выгрузить график</button>')}
 <div class="calc">
  <div class="pan">
   <h3>Параметры займа</h3>
   <div class="btns" style="margin:10px 0 16px">
    ${PROD.map((x,i)=>`<button class="bt ${CALC.type===i?'p':''}" onclick="calcSet('type',${i})">${esc(x.n.replace('Под залог ','').replace(' · экспресс',''))}</button>`).join('')}
   </div>
   <div class="crow"><label>Сумма займа <b>${fmt(CALC.sum)} ₸</b></label>
    <input id="cSum" type="range" min="1000000" max="60000000" step="500000" value="${CALC.sum}" oninput="calcSet('sum',+this.value)"></div>
   <div class="crow"><label>Срок <b>${CALC.term} ${plural(CALC.term,['месяц','месяца','месяцев'])}</b></label>
    <input id="cTerm" type="range" min="3" max="36" step="1" value="${CALC.term}" oninput="calcSet('term',+this.value)"></div>
   <div class="crow"><label>Ставка в месяц <b>${num(rate)}%</b></label>
    <input id="cRate" type="range" min="2" max="5" step="0.1" value="${rate}" oninput="calcSet('rate',+this.value)"></div>
   ${p.ltv?`<div class="note" style="--tone:var(--acc)"><b>Требуемая оценка залога</b>
     <p>При максимальном LTV ${p.ltv}% для суммы ${fmt(CALC.sum)} ₸ залог должен быть оценён не менее чем в <b>${fmt(pledgeNeed)} ₸</b>. Система проверяет это сама и не даст одобрить сверх лимита.</p></div>`
    :`<div class="note" style="--tone:var(--warn)"><b>Без залога</b><p>Экспресс-продукт с лимитом до 1 млн ₸ — всего 2% портфеля. Для таких заявок цепочка короче: прескоринг и сразу решение.</p></div>`}
  </div>
  <div>
   <div class="res">
    <div class="rr"><span>Ежемесячный платёж</span><b>${fmt(pay)} ₸</b></div>
    <div class="rr"><span>Всего к возврату</span><b>${fmt(total)} ₸</b></div>
    <div class="rr"><span>Переплата</span><b>${fmt(over)} ₸</b></div>
    <div class="rr"><span>Ставка годовая номинальная</span><b>${num(rate*12)}%</b></div>
    <div class="rr hi"><span>ГЭСВ · годовая эффективная</span><b>${num(ef)}%</b></div>
   </div>
   <div class="note" style="--tone:var(--info)"><b>ГЭСВ считается автоматически</b>
    <p>Показывать её обязательно, и ошибка в расчёте — это претензия регулятора. Здесь она пересчитывается при любом изменении суммы, срока или ставки, а не забивается руками в договор.</p></div>
   <h4>График платежей</h4>
   <div class="res sched"><table class="t" style="min-width:440px">
    <thead><tr><th class="r">№</th><th class="r">Платёж</th><th class="r">Основной долг</th><th class="r">Вознаграждение</th><th class="r">Остаток</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
  </div>
 </div>`};
function calcSet(k,v){CALC[k]=v;if(k==='type')CALC.rate=PROD[v].rate;render()}

/* ====== ВХОДЯЩИЕ ====== */
SC.inbox=()=>{
 const hot=LEADS.filter(l=>l.hot);
 return `${head('Входящие заявки','Заявки с сайта, из WhatsApp, звонков и офиса — одной лентой. Таймер норматива идёт с момента поступления, просроченные подсвечиваются и эскалируются руководителю.',
  '<button class="bt p" onclick="addLead()">+ ЗАЯВКА</button>')}
 <div class="wid">
  <div><small>Ждут ответа</small><b class="r">${hot.length}</b><span>дольше норматива</span></div>
  <div><small>Сегодня</small><b>14</b><span>заявок принято</span></div>
  <div><small>Средний ответ</small><b class="g">4 мин</b><span>по отделу за неделю</span></div>
  <div><small>Вне норматива</small><b class="w">37</b><span>из 312 за месяц</span></div>
  <div><small>С сайта</small><b class="i">38%</b><span>главный канал</span></div>
 </div>
 <div class="tw"><table class="t" style="min-width:900px">
  <thead><tr><th>№</th><th>Клиент</th><th>Канал</th><th class="r">Сумма</th><th>Залог</th><th>Специалист</th><th>Ждёт</th><th></th></tr></thead>
  <tbody>${LEADS.filter(l=>['new','pd'].includes(l.s)).map(l=>`<tr onclick="openLead(${l.id})">
   <td class="mono">${l.id}</td>
   <td><b>${esc(l.c)}</b><div class="sub">ИИН ${esc(l.iin)}</div></td>
   <td><span class="tag ${l.ch==='Сайт'?'i':l.ch==='WhatsApp'?'g':l.ch==='Звонок'?'a':''}">${esc(l.ch)}</span></td>
   <td class="r"><b>${fmt(l.sum)} ₸</b></td>
   <td class="sub2">${esc(l.pl)}</td>
   <td>${avatar(l.mg)} ${esc(l.mg)}</td>
   <td>${l.t?`<span class="tag ${l.hot?'r':''}">${esc(l.t)}</span>`:'<span class="tag g">в работе</span>'}</td>
   <td class="r"><button class="bt" onclick="event.stopPropagation();go('scoring')">Прескоринг</button></td></tr>`).join('')}</tbody>
 </table></div>
 <div class="g2" style="margin-top:12px">
  <div class="pan"><h3>Откуда приходят заявки</h3><p>Канал проставляется системой, менеджер его не выбирает.</p>
   ${CH.map(c=>`<div class="fr"><span>${esc(c[0])}</span>
     <div class="bar" style="--w:${c[1]/119*100}%"><i class="${c[2]}"></i></div><b>${c[1]} · ${pct(c[1],F.leads)}</b></div>`).join('')}
   <div class="hint">Сайт у вас в предзапуске. Мы делаем на нём форму заявки и прескоринг — и заявка падает сюда напрямую, без почты и без ручного переноса.</div>
  </div>
  <div class="pan"><h3>Что происходит с заявкой автоматически</h3>
   <div class="li n"><i>1</i><span>Назначается специалист по очереди или по загрузке<span class="sub">правило распределения настраивается</span></span></div>
   <div class="li n"><i>2</i><span>Проверяется дубль по ИИН и телефону<span class="sub">8 дублей за месяц отсеяно до специалиста</span></span></div>
   <div class="li n"><i>3</i><span>Запускается таймер норматива 5 минут<span class="sub">при превышении — задача и эскалация руководителю</span></span></div>
   <div class="li n"><i>4</i><span>Клиенту уходит подтверждение в WhatsApp<span class="sub">«заявка принята, менеджер свяжется»</span></span></div>
   <div class="li n"><i>5</i><span>Запрашивается согласие на обработку данных<span class="sub">без него дальше система не пустит</span></span></div>
  </div>
 </div>`};

/* ====== ВОРОНКА ====== */
SC.funnel=()=>{
 const list=LEADS.filter(l=>!fMine||l.mg===ROLES[role].n);
 const sum=list.reduce((a,l)=>a+l.sum,0);
 return `${head('Воронка заявок','Этапы — те, что вы описали: заявка, согласие, прескоринг, скоринг, залог, одобрение, документы, подписание, выдача. Карточка перетаскивается мышью.','')}
 <div class="btns" style="margin-bottom:12px">
  <button class="bt ${fMine?'':'p'}" onclick="setMine(false)">Все заявки</button>
  <button class="bt ${fMine?'p':''}" onclick="setMine(true)">Мои</button>
  <span class="mini" style="margin-left:auto;align-self:center">${list.length} ${plural(list.length,['заявка','заявки','заявок'])} на ${mln(sum)} ₸</span>
 </div>
 <div class="pipe" id="pipe">
  ${ST.map(([k,n,c])=>{
   const col=list.filter(l=>l.s===k), s=col.reduce((a,l)=>a+l.sum,0);
   return `<div>
    <div class="phead" style="background:${c}">${esc(n)}</div>
    <div class="pmeta"><span>${col.length} ${plural(col.length,['заявка','заявки','заявок'])}</span><b>${mln(s)} ₸</b></div>
    <div class="pbody" id="col-${k}" ondragover="colOver(event,'${k}')" ondragleave="colOut('${k}')" ondrop="drop(event,'${k}')">
     ${col.map(l=>`<div class="pc" draggable="true" ondragstart="dragS(event,${l.id})" ondragend="dragE(event)" onclick="openLead(${l.id})">
      <div class="pt">${esc(l.c)}</div>
      <div class="pn">${esc(l.pl)}</div>
      <div class="pp">${fmt(l.sum)} ₸</div>
      <div class="prow"><span class="tag ${l.ch==='Сайт'?'i':l.ch==='WhatsApp'?'g':''}">${esc(l.ch)}</span>${avatar(l.mg)}</div>
     </div>`).join('')||'<div class="mini" style="padding:8px 3px;opacity:.5">пусто</div>'}
    </div></div>`}).join('')}
 </div>
 <div class="g2" style="margin-top:13px">
  <div class="pan"><h3>Где теряются заявки</h3><p>158 отсеялось на прескоринге, ещё 86 — после скоринга и оценки залога.</p>
   ${POST_REJ.map(r=>`<div class="fr"><span>${esc(r[0])}</span>
     <div class="bar" style="--w:${r[1]/28*100}%"><i class="w"></i></div><b>${r[1]}</b></div>`).join('')}
   <div class="note" style="--tone:var(--warn)"><b>28 отказов из-за залога — самая дорогая строка</b>
    <p>Это клиенты, которые прошли скоринг: их привели, проверили, потратили время специалиста. Видно, по каким типам залога отказы повторяются — значит, либо менять требования, либо не брать такие заявки в работу с самого начала.</p></div>
  </div>
  <div class="pan"><h3>Карточка заявки под вас</h3><p>Вы сказали: «полная кастомизация внутри карточки — то, чего не получить в коробке».</p>
   <div class="li"><i>✓</i><span>Данные из ГБД ФЛ и бюро подставляются, а не набираются</span></div>
   <div class="li"><i>✓</i><span>Скоринговый балл и решение прямо в карточке</span></div>
   <div class="li"><i>✓</i><span>Блок залога: тип, оценка, LTV, обременения, фото и отчёт оценщика</span></div>
   <div class="li"><i>✓</i><span>Калькулятор с ГЭСВ и графиком — здесь же, без Excel</span></div>
   <div class="li"><i>✓</i><span>Переписка WhatsApp и записи звонков внутри заявки</span></div>
   <div class="li"><i>✓</i><span>Документы формируются по шаблону с подставленными данными</span></div>
   <div class="li"><i>✓</i><span>Таймер норматива и история всех действий по заявке</span></div>
  </div>
 </div>`};
function setMine(v){fMine=v;render()}
let dragId=null;
function dragS(e,id){dragId=id;e.target.classList.add('drag');try{e.dataTransfer.setData('text/plain',String(id))}catch(x){}}
function dragE(e){e.target.classList.remove('drag')}
function colOver(e,k){e.preventDefault();const c=document.getElementById('col-'+k);if(c)c.classList.add('over')}
function colOut(k){const c=document.getElementById('col-'+k);if(c)c.classList.remove('over')}
function drop(e,k){e.preventDefault();colOut(k);const l=LEADS.find(x=>x.id===dragId);if(!l)return;
 const from=STN[l.s];l.s=k;l.hot=0;l.t='';render();
 const hints={pre:'Запущены запросы в ГБД ФЛ и кредитное бюро.',pledgeS:'Юристу поставлена задача на осмотр и оценку залога.',
  sign:'Пакет документов ушёл на подписание, обременение подано на регистрацию.',issue:'Заём попал в портфель, построен график платежей, кабинет клиента активирован.'};
 toast(`Заявка <b>№${l.id}</b> · ${esc(l.c)}: «${esc(from)}» → «${esc(STN[k])}». ${hints[k]||'Время в этапе зафиксировано — из него считается скорость воронки.'}`)}
function addLead(){const l={id:seq++,c:'Новая заявка',iin:'——',s:'new',ch:'Офис',mg:ROLES[role].n,sum:0,pl:'не указан',t:'0 мин',hot:0};
 LEADS.unshift(l);if(!['inbox','funnel'].includes(cur))go('funnel');else render();
 toast(`Заявка <b>№${l.id}</b> создана. Обязательные поля — ИИН, телефон, сумма и тип залога: без них заявка не уйдёт на прескоринг.`)}
function searchDemo(q){if(!q)return;
 const l=LEADS.find(x=>(x.c+' '+x.iin+' '+x.id).toLowerCase().includes(q.toLowerCase()));
 if(l){openLead(l.id);toast('Поиск ищет по ИИН, телефону, номеру заявки и договора, ФИО и адресу залога — сразу во всех разделах.')}
 else toast('Ничего не нашлось. Поиск работает по ИИН, телефону, номеру заявки и договора, ФИО и залогу.')}

/* ====== ЗАЛОГИ ====== */
SC.pledge=()=>{
 const PL=[
  {t:'Квартира',a:'Алматы, Бостандыкский р-н, 62 м²',oc:31000000,loan:18000000,st:'Обременение зарегистрировано','c':'ok'},
  {t:'Дом',a:'Каскелен, 180 м², участок 8 соток',oc:46000000,loan:27000000,st:'На оценке','c':'w'},
  {t:'Toyota Land Cruiser 2017',a:'VIN ••••4821, пробег 142 000 км',oc:23000000,loan:12500000,st:'Обременение зарегистрировано','c':'ok'},
  {t:'Складское помещение',a:'Алматы, Турксибский р-н, 420 м²',oc:92000000,loan:55000000,st:'Проверка обременений','c':'w'},
  {t:'Kia K5 2021',a:'VIN ••••7734, пробег 68 000 км',oc:17500000,loan:9500000,st:'Обременение зарегистрировано','c':'ok'},
  {t:'Торговое помещение',a:'Шымкент, 96 м²',oc:52000000,loan:31000000,st:'Есть обременение третьего лица','c':'r'}
 ];
 return `${head('Залоги','98% ваших займов — залоговые, поэтому залог здесь отдельная сущность, а не текст в примечании. У каждого — оценка, LTV, обременения, фото и отчёт оценщика.',
  '<button class="bt p" onclick="toast(\'Карточка залога: тип, адрес или VIN, оценка, отчёт оценщика, фото, проверка обременений, история переоценок и связь с договором займа.\')">+ ЗАЛОГ</button>')}
 <div class="wid">
  <div><small>В залоге</small><b class="a">${fmt(F.active)}</b><span>объектов по действующим займам</span></div>
  <div><small>Недвижимость</small><b>64%</b><span>макс. LTV 70%</span></div>
  <div><small>Автотранспорт</small><b>34%</b><span>макс. LTV 55%</span></div>
  <div><small>Средний LTV</small><b class="g">58%</b><span>по портфелю</span></div>
  <div><small>Требуют внимания</small><b class="r">3</b><span>обременения и переоценка</span></div>
 </div>
 <div class="tw"><table class="t" style="min-width:900px">
  <thead><tr><th>Объект</th><th>Идентификация</th><th class="r">Оценка</th><th class="r">Заём</th><th class="r">LTV</th><th>Статус</th></tr></thead>
  <tbody>${PL.map(p=>{const ltv=p.loan/p.oc*100;return `<tr onclick="toast('Карточка залога открывается из заявки и из договора. Здесь же отчёт оценщика, фото, выписка об обременениях и история переоценок.')">
   <td><b>${esc(p.t)}</b></td><td class="sub2">${esc(p.a)}</td>
   <td class="r">${fmt(p.oc)} ₸</td><td class="r">${fmt(p.loan)} ₸</td>
   <td class="r"><span class="tag ${ltv>68?'w':'g'}">${num(ltv)}%</span></td>
   <td><span class="tag ${p.c}">${esc(p.st)}</span></td></tr>`}).join('')}</tbody>
 </table></div>
 <div class="g2" style="margin-top:12px">
  <div class="pan"><h3>Что система проверяет сама</h3>
   <div class="li"><i>✓</i><span>LTV не выше лимита продукта<span class="sub">одобрить сверх лимита нельзя — блокируется на этапе решения</span></span></div>
   <div class="li"><i>✓</i><span>Наличие обременений третьих лиц<span class="sub">11 отказов за месяц именно по этой причине</span></span></div>
   <div class="li"><i>✓</i><span>Срок действия отчёта об оценке<span class="sub">просроченная оценка — задача на переоценку</span></span></div>
   <div class="li"><i>✓</i><span>Комплектность документов по залогу<span class="sub">правоустанавливающие, техпаспорт, согласие супруга</span></span></div>
   <div class="li w"><i>!</i><span>Регистрация обременения после подписания<span class="sub">статус виден в карточке, пока не зарегистрировано — деньги не выдаются</span></span></div>
  </div>
  <div class="pan"><h3>Переоценка и контроль</h3>
   <div class="kv"><span>Объектов с оценкой старше 12 месяцев</span><b class="num">17</b></div>
   <div class="kv"><span>Средний дисконт к рыночной цене</span><b>12%</b></div>
   <div class="kv"><span>Залогов по проблемным займам</span><b style="color:var(--bad)">31</b></div>
   <div class="kv"><span>На реализации</span><b>4 объекта · ${mln(87000000)} ₸</b></div>
   <div class="note" style="--tone:var(--acc)"><b>Залог связан с займом и с клиентом</b>
    <p>Из карточки клиента видно всё его имущество в залоге, из договора — конкретный объект, из объекта — договор и текущая задолженность. В 1С такой связи нет, в универсальной CRM её не сделать.</p></div>
  </div>
 </div>`};

/* ====== ПОРТФЕЛЬ ====== */
SC.portfolio=()=>`${head('Портфель займов','Все действующие договоры: остаток основного долга, график, залог, LTV и статус. Отсюда строится отчётность и видно качество портфеля.','')}
 <div class="wid">
  <div><small>Остаток долга</small><b class="a">${mln(F.portfolio)} ₸</b><span>${F.active} договоров</span></div>
  <div><small>Выдано всего</small><b>${mln(5820000000)} ₸</b><span>с начала года</span></div>
  <div><small>Средняя ставка</small><b>3,2% / мес</b><span>ГЭСВ ${num(gesv(3.2))}%</span></div>
  <div><small>Средний срок</small><b>23 мес</b><span>по действующим</span></div>
  <div><small>Проблемных</small><b class="r">${BUCK.reduce((a,b)=>a+b[1],0)}</b><span>${mln(BUCK.reduce((a,b)=>a+b[2],0))} ₸</span></div>
 </div>
 <div class="tw"><table class="t" style="min-width:960px">
  <thead><tr><th>Договор</th><th>Заёмщик</th><th class="r">Выдано</th><th class="r">Остаток</th><th class="r">Ставка</th><th class="r">Платежей</th><th>След. платёж</th><th>Залог</th><th>Статус</th></tr></thead>
  <tbody>${LOANS.map(l=>`<tr onclick="openLoan('${l.id}')">
   <td class="mono"><b>${l.id}</b></td><td>${esc(l.c)}</td>
   <td class="r">${fmt(l.sum)} ₸</td><td class="r"><b>${fmt(l.rest)} ₸</b></td>
   <td class="r">${num(l.rate)}%</td><td class="r">${l.paid} из ${l.term}</td>
   <td class="mono">${l.next}</td><td class="sub2">${esc(l.pl)} · LTV ${l.ltv}%</td>
   <td><span class="tag ${l.od?(l.od>90?'r':'w'):'g'}">${esc(l.st)}</span></td></tr>`).join('')}</tbody>
 </table></div>
 <div class="g2" style="margin-top:12px">
  <div class="pan"><h3>Структура портфеля</h3>
   ${PROD.map(p=>`<div class="fr"><span>${esc(p.n)}</span>
     <div class="bar" style="--w:${p.share}%"><i class="${p.ltv===70?'':p.ltv===55?'i':'w'}"></i></div>
     <b>${p.share}% · ${p.cnt} дог.</b></div>`).join('')}
   <div class="kv" style="margin-top:10px"><span>Доля залоговых</span><b>98%</b></div>
   <div class="kv"><span>Средний LTV</span><b>58%</b></div>
   <div class="kv"><span>Покрытие портфеля залогом</span><b style="color:var(--ok)">1,72×</b></div>
  </div>
  <div class="pan"><h3>Качество портфеля</h3>
   <div class="kv"><span>NPL 90+</span><b style="color:var(--bad)">${num(F.npl90/F.portfolio*100)}% · ${mln(F.npl90)} ₸</b></div>
   <div class="kv"><span>Просрочка 1–90 дней</span><b style="color:var(--warn)">${num(187000000/F.portfolio*100)}% · ${mln(187000000)} ₸</b></div>
   <div class="kv"><span>Сформировано провизий</span><b>${mln(142000000)} ₸</b></div>
   <div class="kv"><span>Досрочные погашения за месяц</span><b>6 договоров · ${mln(74000000)} ₸</b></div>
   <div class="hint">Провизии и NPL считаются по вашим правилам классификации, а не по зашитым в коробку. При изменении требований регулятора правило меняется в настройках.</div>
  </div>
 </div>`;

/* ====== ПЛАТЕЖИ ====== */
SC.payments=()=>{
 const P=[['20.09','З-4412','Турсынова А. К.',987400,'Ожидается',''],
  ['18.09','З-4371','Абишев Т. С.',612300,'Оплачен','g'],
  ['15.09','З-4340','ТОО «Куат»',2184000,'Оплачен','g'],
  ['12.09','З-4318','Мусаев К. Р.',1485000,'Просрочен 47 дн','r'],
  ['10.09','З-4265','Оразбаев Н.',1742000,'Просрочен 96 дн','r'],
  ['25.09','З-4355','Сагындыкова Б.',694500,'Просрочен 12 дн','w'],
  ['22.09','З-4398','ИП Нурмуханов',1846000,'Ожидается','']];
 return `${head('Платежи','График по каждому договору, фактические поступления, пени и разнос платежей. Данные уходят в 1С и приходят обратно — руками никто ничего не сверяет.',
  '<button class="bt p" onclick="toast(\'Платёж разносится автоматически: сначала пеня, затем вознаграждение, затем основной долг — по правилу, которое вы задаёте в настройках.\')">Разнести платежи</button>')}
 <div class="wid">
  <div><small>Ожидается в сентябре</small><b>${mln(94600000)} ₸</b><span>по графику</span></div>
  <div><small>Поступило</small><b class="g">${mln(71300000)} ₸</b><span>75% плана месяца</span></div>
  <div><small>Просрочено</small><b class="r">${mln(23300000)} ₸</b><span>31 договор</span></div>
  <div><small>Начислено пени</small><b class="w">${mln(4180000)} ₸</b><span>за месяц</span></div>
  <div><small>Досрочных</small><b class="i">6</b><span>на ${mln(74000000)} ₸</span></div>
 </div>
 <div class="tw"><table class="t" style="min-width:760px">
  <thead><tr><th>Дата</th><th>Договор</th><th>Заёмщик</th><th class="r">Сумма платежа</th><th>Статус</th><th></th></tr></thead>
  <tbody>${P.map(p=>`<tr onclick="toast('Карточка платежа: плановая и фактическая дата, разнос по телу и вознаграждению, пеня, способ оплаты и проводка в 1С.')">
   <td class="mono">${p[0]}</td><td class="mono"><b>${p[1]}</b></td><td>${esc(p[2])}</td>
   <td class="r"><b>${fmt(p[3])} ₸</b></td><td><span class="tag ${p[5]}">${esc(p[4])}</span></td>
   <td class="r"><button class="bt" onclick="event.stopPropagation();toast('Напоминание ушло клиенту в WhatsApp: сумма, дата и ссылка на оплату. Отправляется автоматически за 3 дня и в день платежа.')">Напомнить</button></td></tr>`).join('')}</tbody>
 </table></div>
 <div class="g2" style="margin-top:12px">
  <div class="pan"><h3>Что делает система без бухгалтера</h3>
   <div class="li n"><i>1</i><span>Строит график при выдаче — аннуитет или дифференцированный</span></div>
   <div class="li n"><i>2</i><span>Начисляет вознаграждение и пеню по расписанию</span></div>
   <div class="li n"><i>3</i><span>Разносит поступление по правилу очерёдности</span></div>
   <div class="li n"><i>4</i><span>Напоминает клиенту за 3 дня и в день платежа</span></div>
   <div class="li n"><i>5</i><span>Переводит договор в корзину просрочки на следующий день</span></div>
   <div class="li n"><i>6</i><span>Отдаёт проводки в 1С и сверяет остатки</span></div>
  </div>
  <div class="pan"><h3>Способы оплаты</h3>
   <div class="kv"><span>Kaspi перевод</span><b>54%</b></div>
   <div class="kv"><span>Через кассу в офисе</span><b>21%</b></div>
   <div class="kv"><span>Банковский перевод</span><b>18%</b></div>
   <div class="kv"><span>Из личного кабинета</span><b>7%</b></div>
   <div class="note" style="--tone:var(--acc)"><b>Личный кабинет снимает нагрузку с офиса</b>
    <p>Сейчас 7% — потому что кабинета нет. По другим проектам после запуска доля онлайн-оплат за полгода вырастает до 30–40%, а звонков «сколько я должен» становится в разы меньше.</p></div>
  </div>
 </div>`};

/* ====== ПРОСРОЧКА ====== */
SC.overdue=()=>`${head('Просрочка и взыскание','Корзины по дням, сценарий работы на каждой и история контактов. Специалист по взысканию видит, кому звонить сегодня, а не листает выгрузку из 1С.',
 '<button class="bt p" onclick="toast(\'Список на обзвон формируется на утро: корзина, сумма, дата последнего контакта, обещание клиента и результат прошлого разговора.\')">Список на обзвон</button>')}
 <div class="buck">
  ${BUCK.map(b=>`<div class="bk" style="--c:${b[3]}"><small>${esc(b[0])}</small><b>${fmt(b[1])}</b>
   <span>${mln(b[2])} ₸ · ${pct(b[2],F.portfolio)} портфеля</span></div>`).join('')}
 </div>
 <div class="g21">
  <div class="pan" style="padding:0"><div style="padding:15px 17px 8px"><h3>Договоры в просрочке</h3>
   <p>Сортировка по дням — сверху те, кто только что вышел в просрочку: их вернуть дешевле всего.</p></div>
   <div class="tw" style="border:0"><table class="t" style="min-width:700px">
    <thead><tr><th>Договор</th><th>Заёмщик</th><th class="r">Дней</th><th class="r">Долг с пеней</th><th>Залог</th><th>Последний контакт</th></tr></thead>
    <tbody>${[['З-4355','Сагындыкова Б.',12,7820000,'Kia K5 2021','вчера · обещал 20.09'],
      ['З-4318','Мусаев К. Р.',47,15240000,'Toyota Prado 2019','5 дней назад · не берёт трубку'],
      ['З-4265','Оразбаев Н.',96,31870000,'Дом, Каскелен','досудебная претензия вручена'],
      ['З-4201','Тлеубаев С.',23,4310000,'Hyundai Elantra 2020','сегодня · просит отсрочку'],
      ['З-4188','ТОО «Строй Сервис»',64,18960000,'Помещение, Алматы','юрист готовит иск']].map(r=>
     `<tr onclick="toast('Карточка просрочки: график контактов, обещания клиента и их выполнение, начисленная пеня, документы по досудебной работе и статус реализации залога.')">
      <td class="mono"><b>${r[0]}</b></td><td>${esc(r[1])}</td>
      <td class="r"><span class="tag ${r[2]>90?'r':r[2]>30?'w':''}">${r[2]}</span></td>
      <td class="r"><b>${fmt(r[3])} ₸</b></td><td class="sub2">${esc(r[4])}</td>
      <td class="sub2">${esc(r[5])}</td></tr>`).join('')}</tbody>
   </table></div>
  </div>
  <div class="pan"><h3>Сценарий по корзинам</h3><p>Настраивается вами, запускается системой.</p>
   <div class="li w"><i>1</i><span><b>1–30 дней</b> — SMS и WhatsApp в день просрочки, звонок на 3-й день<span class="sub">возвращается 78% этой корзины</span></span></div>
   <div class="li w"><i>2</i><span><b>31–60 дней</b> — звонок специалиста по взысканию, письмо<span class="sub">фиксируется обещание и дата</span></span></div>
   <div class="li w"><i>3</i><span><b>61–90 дней</b> — досудебная претензия, выезд<span class="sub">подключается юрист</span></span></div>
   <div class="li"><i>4</i><span><b>90+ дней</b> — обращение взыскания на залог<span class="sub">4 объекта на реализации, ${mln(87000000)} ₸</span></span></div>
   <div class="note" style="--tone:var(--ok)"><b>Главное — первые тридцать дней</b>
    <p>Из корзины 1–30 возвращается почти четыре из пяти договоров, если позвонить вовремя. Система сама ставит задачу на первый день просрочки — не надо ждать выгрузки в конце месяца.</p></div>
  </div>
 </div>`;

/* ====== ДОКУМЕНТЫ ====== */
SC.docs=()=>`${head('Документы','Договоры займа и залога, графики, акты и претензии формируются по вашим шаблонам с подставленными данными. Никто не копирует ФИО и суммы руками.',
 '<button class="bt p" onclick="toast(\'Шаблон загружается в формате Word с метками полей. Система подставляет данные заявки, клиента и залога и отдаёт готовый файл на подпись.\')">+ ШАБЛОН</button>')}
 <div class="g2">
  <div class="pan"><h3>Шаблоны документов</h3>
   ${[['Договор о предоставлении микрокредита','автоматически при одобрении','g'],
      ['Договор залога недвижимости','по типу залога','g'],
      ['Договор залога движимого имущества','по типу залога','g'],
      ['График погашения','из калькулятора, с ГЭСВ','g'],
      ['Согласие на обработку персональных данных','до прескоринга','g'],
      ['Согласие на запрос в кредитное бюро','до прескоринга','g'],
      ['Заявление на регистрацию обременения','после подписания','w'],
      ['Досудебная претензия','при просрочке 60+','w'],
      ['Справка об остатке задолженности','по запросу клиента','']].map(d=>
    `<div class="kv"><span>${esc(d[0])}<div class="sub">${esc(d[1])}</div></span><span class="tag ${d[2]}">${d[2]==='g'?'автоматически':d[2]==='w'?'по событию':'по запросу'}</span></div>`).join('')}
  </div>
  <div class="pan"><h3>Пакет по заявке № 2790</h3><p>Байжанов С. · 34 000 000 ₸ · коммерческое помещение</p>
   <div class="li"><i>✓</i><span>Договор микрокредита · сформирован 12.09<span class="sub">подписан обеими сторонами</span></span></div>
   <div class="li"><i>✓</i><span>Договор залога · сформирован 12.09<span class="sub">подписан, нотариально удостоверен</span></span></div>
   <div class="li"><i>✓</i><span>График погашения · 30 платежей<span class="sub">ГЭСВ 42,6%, выдан клиенту</span></span></div>
   <div class="li w"><i>!</i><span>Регистрация обременения · подано 13.09<span class="sub">ожидается до 16.09, деньги удерживаются до регистрации</span></span></div>
   <div class="li no"><i>·</i><span>Акт выдачи · после регистрации обременения</span></div>
   <div class="note" style="--tone:var(--warn)"><b>Деньги не уходят раньше обременения</b>
    <p>Система блокирует выдачу, пока не зарегистрировано обременение. Это правило, а не дисциплина сотрудника — обойти его нельзя.</p></div>
  </div>
 </div>`;

/* ====== АНАЛИТИКА ====== */
SC.analytics=()=>`${head('Аналитика','Откуда приходят заявки, где теряются и сколько стоит каждая выдача. Цифры собираются сами — не из выгрузки в Excel в конце месяца.',
 '<button class="bt" onclick="toast(\'Любой отчёт выгружается в Excel и ставится на расписание — приходит на почту утром в понедельник.\')">Выгрузить</button>')}
 <div class="wid">
  <div><small>Заявок</small><b>${F.leads}</b><span>за сентябрь</span></div>
  <div><small>Прошли прескоринг</small><b class="a">${F.preOk}</b><span>${pct(F.preOk,F.leads)}</span></div>
  <div><small>Одобрено</small><b>${F.approved}</b><span>${pct(F.approved,F.preOk)} от прошедших</span></div>
  <div><small>Выдано</small><b class="g">${F.issued}</b><span>${pct(F.issued,F.approved)} от одобренных</span></div>
  <div><small>Сквозная конверсия</small><b>${num(F.convFull)}%</b><span>заявка → деньги</span></div>
 </div>
 <div class="g2">
  <div class="pan"><h3>Каналы заявок</h3><p>Сайт только в предзапуске — и уже даёт больше трети.</p>
   ${CH.map(c=>`<div class="fr"><span>${esc(c[0])}</span><div class="bar" style="--w:${c[1]/CH[0][1]*100}%"><i class="${c[2]}"></i></div><b>${c[1]} · ${pct(c[1],F.leads)}</b></div>`).join('')}
   <div class="note" style="--tone:var(--info)"><b>Источник виден до самой выдачи</b>
    <p>По каждому каналу видно не только количество заявок, но и сколько из них дошло до денег и на какую сумму. Это позволяет считать стоимость выдачи по каналу, а не стоимость клика.</p></div>
  </div>
  <div class="pan"><h3>Причины отказа</h3><p>До прескоринга и после него — разные причины и разные выводы.</p>
   <div class="kv"><span><b>Отказ на прескоринге</b></span><b>${F.leads-F.preOk} заявок</b></div>
   ${PRE_REJ.map(r=>`<div class="fr"><span class="mini">${esc(r[0])}</span><div class="bar" style="--w:${r[1]/62*100}%"><i class="r"></i></div><b>${r[1]}</b></div>`).join('')}
   <div class="kv" style="margin-top:10px"><span><b>Потери после прескоринга</b></span><b>${F.preOk-F.issued} заявок</b></div>
   ${POST_REJ.map(r=>`<div class="fr"><span class="mini">${esc(r[0])}</span><div class="bar" style="--w:${r[1]/28*100}%"><i class="w"></i></div><b>${r[1]}</b></div>`).join('')}
  </div>
 </div>
 <div class="g2">
  <div class="pan"><h3>Скорость — то, за что вы платите</h3>
   <div class="kv"><span>Среднее время до первого ответа</span><b style="color:var(--ok)">4 мин 10 сек</b></div>
   <div class="kv"><span>Прескоринг от согласия до решения</span><b style="color:var(--ok)">2 мин 40 сек</b></div>
   <div class="kv"><span>От заявки до выдачи</span><b>2,8 дня</b></div>
   <div class="kv"><span>Заявок без ответа дольше 15 минут</span><b style="color:var(--bad)">9 из ${F.leads}</b></div>
   <div class="hint">Вы сказали: «в течение пяти минут нужно позвонить». Система считает это не по ощущениям, а по каждой заявке — и показывает, кто именно не уложился и в какой час дня.</div>
  </div>
  <div class="pan"><h3>Выдачи по продуктам</h3>
   ${PROD.map(p=>`<div class="fr"><span>${esc(p.n)}<div class="sub">LTV до ${p.ltv||'—'}% · ${p.term}</div></span>
    <div class="bar" style="--w:${p.share}%"><i class="${p.ltv===70?'':'i'}"></i></div><b>${p.share}%</b></div>`).join('')}
   <div class="kv" style="margin-top:10px"><span>Средняя сумма займа</span><b>${mln(F.avg)} ₸</b></div>
   <div class="kv"><span>Выдано за месяц</span><b>${mln(F.issuedSum)} ₸</b></div>
   <div class="kv"><span>Повторные клиенты</span><b>38% выдач</b></div>
   <div class="kv"><span>Средний чек повторного</span><b>${mln(21000000)} ₸ · на 31% выше</b></div>
  </div>
 </div>`;

/* ====== КЛИЕНТЫ ====== */
SC.clients=()=>`${head('База клиентов','Один клиент — одна карточка: все заявки, все займы, всё имущество в залоге, платежи и переписка. Не пять файлов у пяти сотрудников.',
 '<button class="bt p" onclick="toast(\'Клиент заводится один раз по ИИН или БИН. При повторном обращении система находит его сама и подтягивает историю — повторному клиенту не нужно приносить документы заново.\')">+ КЛИЕНТ</button>')}
 <div class="wid">
  <div><small>Всего клиентов</small><b>1 284</b><span>физлица и компании</span></div>
  <div><small>С действующим займом</small><b class="a">${F.active}</b><span>${pct(F.active,1284)} базы</span></div>
  <div><small>Повторных</small><b class="g">38%</b><span>выдач за месяц</span></div>
  <div><small>Предпринимателей</small><b>71%</b><span>ваш основной сегмент</span></div>
  <div><small>Средний срок жизни</small><b>2,4 года</b><span>2,1 займа на клиента</span></div>
 </div>
 <div class="tw"><table class="t" style="min-width:880px">
  <thead><tr><th>Клиент</th><th>ИИН / БИН</th><th>Телефон</th><th class="r">Займов</th><th class="r">Сумма</th><th>Сегмент</th><th>Статус</th></tr></thead>
  <tbody>${CLIENTS.map(c=>`<tr onclick="openClient('${esc(c.n).replace(/'/g,'')}')">
   <td><b>${avatar(c.n)} ${esc(c.n)}</b><div class="sub2">клиент с ${c.since} года</div></td>
   <td class="mono">${esc(c.iin)}</td><td class="mono">${esc(c.ph)}</td>
   <td class="r">${c.loans}</td><td class="r"><b>${fmt(c.sum)} ₸</b></td>
   <td><span class="tag ${c.seg==='Корпоративный'?'i':c.seg==='Проблемный'?'r':c.seg==='Новый'?'':'a'}">${esc(c.seg)}</span></td>
   <td><span class="tag ${c.st==='Просрочка'?'r':'g'}">${esc(c.st)}</span></td></tr>`).join('')}</tbody>
 </table></div>
 <div class="g2" style="margin-top:12px">
  <div class="pan"><h3>Что видно в карточке клиента</h3>
   <div class="li"><i>✓</i><span>Все заявки и решения по ним, включая отказы и причину</span></div>
   <div class="li"><i>✓</i><span>Все займы: остаток, график, платёжная дисциплина</span></div>
   <div class="li"><i>✓</i><span>Всё имущество в залоге с оценками и обременениями</span></div>
   <div class="li"><i>✓</i><span>Переписка WhatsApp и записи звонков — в одной ленте</span></div>
   <div class="li"><i>✓</i><span>Документы: согласия, договоры, справки</span></div>
   <div class="li"><i>✓</i><span>Связанные лица: созаёмщик, залогодатель, поручитель</span></div>
  </div>
  <div class="pan"><h3>Повторные продажи — деньги, которые уже ваши</h3>
   <div class="kv"><span>Займы закрываются в ближайшие 60 дней</span><b>47 договоров</b></div>
   <div class="kv"><span>Из них без просрочек за весь срок</span><b style="color:var(--ok)">39</b></div>
   <div class="kv"><span>Потенциал повторной выдачи</span><b>${mln(624000000)} ₸</b></div>
   <div class="note" style="--tone:var(--ok)"><b>Система сама поставит задачу</b>
    <p>За 30 дней до закрытия займа у клиента без просрочек специалисту падает задача: предложить новый заём на большую сумму. Сейчас про таких клиентов вспоминают случайно.</p></div>
  </div>
 </div>`;

/* ====== ЛИЧНЫЙ КАБИНЕТ ====== */
SC.lk=()=>`${head('Личный кабинет клиента','«Чтобы клиент заходил и видел, сколько у него осталось, есть ли просрочка» — ровно это. Кабинет снимает с офиса поток однотипных звонков.',
 '<button class="bt" onclick="toast(\'Вход по номеру телефона и коду из SMS. Отдельный пароль клиенту не нужен — это снижает количество обращений в поддержку.\')">Как входит клиент</button>')}
 <div class="g21">
  <div class="pan"><h3>Что клиент делает сам, без звонка вам</h3>
   <div class="li"><i>✓</i><span>Видит остаток долга и дату ближайшего платежа<span class="sub">самый частый звонок в офис — закрывается кабинетом</span></span></div>
   <div class="li"><i>✓</i><span>Видит просрочку и начисленную пеню, если она есть<span class="sub">сумма всегда актуальна, спорить не о чем</span></span></div>
   <div class="li"><i>✓</i><span>Смотрит и скачивает график погашения<span class="sub">и договор, и справку об остатке</span></span></div>
   <div class="li"><i>✓</i><span>Платит онлайн и сразу видит, что платёж зачтён</span></div>
   <div class="li"><i>✓</i><span>Подаёт заявку на новый заём — данные уже есть<span class="sub">повторная заявка занимает одну минуту</span></span></div>
   <div class="li"><i>✓</i><span>Загружает документы, если специалист их запросил</span></div>
   <div class="li w"><i>!</i><span>Получает напоминание за 3 дня и в день платежа<span class="sub">push и WhatsApp — снижает просрочку на первой корзине</span></span></div>
   <div class="note" style="--tone:var(--acc)"><b>Считаем нагрузку</b>
    <p>428 действующих договоров. Даже один звонок на договор в месяц — это больше 400 звонков, которые сегодня принимают ваши сотрудники. Кабинет забирает большую их часть.</p></div>
  </div>
  <div class="pan" style="display:grid;place-items:center">
   <div class="phone">
    <div class="pht"><b>Турсынова А. К.</b><small>Договор З-4412 · заём от 20.05.2026</small></div>
    <div class="pb">
     <div class="pi"><span>Остаток основного долга</span><b>14 820 000 ₸</b></div>
     <div class="pi"><span>Ближайший платёж</span><b>20.09</b></div>
     <div class="pi"><span>Сумма платежа</span><b>987 400 ₸</b></div>
     <div class="pi"><span>Просрочка</span><b style="color:var(--ok)">нет</b></div>
     <div class="pi"><span>Оплачено платежей</span><b>4 из 24</b></div>
     <div class="pi"><span>Залог</span><b>Квартира, Алматы</b></div>
     <div class="pbtn" onclick="toast('Оплата проходит онлайн, платёж разносится автоматически и сразу виден в кабинете и в 1С.')">ОПЛАТИТЬ 987 400 ₸</div>
     <div class="pbtn" style="background:var(--card3);color:var(--ink)" onclick="toast('График, договор и справка об остатке скачиваются в PDF прямо из кабинета.')">График и документы</div>
    </div>
   </div>
  </div>
 </div>`;

/* ====== САЙТ И ЗАЯВКА ====== */
SC.site=()=>`${head('Сайт и форма заявки','Сайт у вас в предзапуске. Форма на нём должна не просто отправлять письмо, а заводить заявку в системе и сразу ставить задачу специалисту.',
 '<button class="bt p" onclick="addLead()">Смоделировать заявку с сайта</button>')}
 <div class="flow">
  <div class="fbx on"><code>01</code><b>0 сек</b><p>Клиент отправил форму на сайте</p></div>
  <div class="fbx"><code>02</code><b>2 сек</b><p>Заявка создана, назначен специалист по правилу распределения</p></div>
  <div class="fbx"><code>03</code><b>10 сек</b><p>Клиенту ушло WhatsApp-подтверждение «заявка принята»</p></div>
  <div class="fbx"><code>04</code><b>&lt; 5 мин</b><p>Задача «позвонить» с обратным отсчётом у специалиста</p></div>
  <div class="fbx"><code>05</code><b>+3 мин</b><p>Согласие на обработку ПД → прескоринг</p></div>
 </div>
 <div class="g2">
  <div class="pan"><h3>Поля формы на сайте</h3><p>Минимум полей — максимум заявок. Остальное специалист уточнит по телефону.</p>
   <div class="srow"><span class="nm">ФИО</span><span class="tag a">обязательно</span></div>
   <div class="srow"><span class="nm">Номер телефона</span><span class="tag a">обязательно</span></div>
   <div class="srow"><span class="nm">Сумма, которую хочет получить</span><span class="tag a">обязательно</span></div>
   <div class="srow"><span class="nm">Что готов оставить в залог</span><span class="tag">список</span></div>
   <div class="srow"><span class="nm">Город</span><span class="tag">список</span></div>
   <div class="srow"><span class="nm">Согласие с политикой обработки ПД</span><span class="tag a">галочка</span></div>
   <div class="hint">ИИН на сайте не спрашиваем: это отпугивает и это персональные данные. Его берёт специалист по телефону вместе с согласием — и только тогда идёт запрос в ГБД ФЛ и бюро.</div>
  </div>
  <div class="pan"><h3>Что даёт связка сайт → система</h3>
   <div class="li"><i>✓</i><span>Ни одна заявка не теряется в почте и в личке<span class="sub">каждая с номером, временем и ответственным</span></span></div>
   <div class="li"><i>✓</i><span>Видно, с какой страницы и по какой рекламе пришёл клиент<span class="sub">до самой выдачи, а не до клика</span></span></div>
   <div class="li"><i>✓</i><span>Дубли определяются по телефону и ИИН<span class="sub">повторная заявка цепляется к существующему клиенту</span></span></div>
   <div class="li"><i>✓</i><span>Онлайн-калькулятор на сайте считает по вашим ставкам<span class="sub">клиент приходит с понятным ожиданием</span></span></div>
   <div class="li w"><i>!</i><span>Нерабочее время — заявка всё равно фиксируется<span class="sub">утром в 9:00 она первая в очереди с пометкой «ночная»</span></span></div>
   <div class="note" style="--tone:var(--info)"><b>Подключение формы — 800 000 ₸ отдельным блоком</b>
    <p>Это как раз то, о чём говорили: сайт, скоринг и передача заявки от сайта в систему. Сайт при этом остаётся вашим — мы подключаемся к нему, а не переделываем его.</p></div>
  </div>
 </div>`;

/* ====== WHATSAPP И ЗВОНКИ ====== */
SC.comms=()=>`${head('WhatsApp, телефония и Telegram','Переписка и звонки живут в карточке клиента, а не в телефоне сотрудника. Сотрудник ушёл — история осталась у компании.',
 '<button class="bt" onclick="toast(\'Подключается официальный WhatsApp Business API на номер компании. Личные номера сотрудников не используются — переписка принадлежит компании.\')">Как подключается</button>')}
 <div class="g21">
  <div class="pan"><h3>Переписка по заявке № 2841 · Ахметов Р. К.</h3>
   <div class="tl">
    <div class="tli ok"><b>Система → клиенту · 11:02</b><p>Рахметжан, здравствуйте! Заявка № 2841 на 18 000 000 ₸ принята. Кредитный специалист Айгерим свяжется с вами в течение 5 минут.</p></div>
    <div class="tli ok"><b>Клиент · 11:03</b><p>Здравствуйте, жду</p></div>
    <div class="tli ok"><b>Звонок · Айгерим · 11:04 · 6 мин 12 сек</b><p>Запись разговора прикреплена к заявке. Получено устное согласие, ссылка на согласие ПД отправлена в WhatsApp.</p></div>
    <div class="tli ok"><b>Система → клиенту · 11:05</b><p>Ссылка на согласие на обработку персональных данных и запрос в кредитное бюро. Подпись — кодом из SMS.</p></div>
    <div class="tli on"><b>Клиент · 11:09</b><p>Согласие подписано. Запущен прескоринг: ГБД ФЛ и кредитное бюро.</p></div>
    <div class="tli"><b>Дальше автоматически</b><p>Результат прескоринга уйдёт клиенту в WhatsApp, а специалисту — задача с запросом документов по списку.</p></div>
   </div>
  </div>
  <div class="pan"><h3>Каналы</h3>
   <div class="srow"><span class="nm">WhatsApp Business API<div class="sub">на номер компании</div></span><span class="sw on" onclick="this.classList.toggle('on');toast('Основной канал: 75 заявок за месяц пришли именно отсюда.')"></span></div>
   <div class="srow"><span class="nm">Телефония с записью<div class="sub">звонок из карточки в один клик</div></span><span class="sw on" onclick="this.classList.toggle('on');toast('Звонок делается из карточки, запись и длительность сохраняются автоматически.')"></span></div>
   <div class="srow"><span class="nm">Telegram<div class="sub">второй канал переписки</div></span><span class="sw on" onclick="this.classList.toggle('on')"></span></div>
   <div class="srow"><span class="nm">SMS · коды и напоминания<div class="sub">подпись согласия и графика</div></span><span class="sw on" onclick="this.classList.toggle('on')"></span></div>
   <div class="srow"><span class="nm">Email<div class="sub">документы и справки</div></span><span class="sw" onclick="this.classList.toggle('on')"></span></div>
   <div class="kv" style="margin-top:12px"><span>Шаблонов сообщений</span><b>14</b></div>
   <div class="kv"><span>Отправляется автоматически</span><b>9 из 14</b></div>
   <div class="kv"><span>Среднее время ответа в WhatsApp</span><b style="color:var(--ok)">3 мин</b></div>
   <div class="note" style="--tone:var(--warn)"><b>Сейчас переписка — у сотрудника в телефоне</b>
    <p>Когда специалист увольняется, вместе с ним уходит история общения с его клиентами. После подключения номера компании переписка остаётся в системе независимо от того, кто её вёл.</p></div>
  </div>
 </div>`;

/* ====== ИНТЕГРАЦИИ ====== */
const INTG=[
 {n:'ГБД ФЛ',d:'Государственная база данных «Физические лица»',u:'Проверка личности, ИИН, документа и адреса',st:'ok',t:'8–20 сек'},
 {n:'Кредитное бюро',d:'Первое кредитное бюро / ГКБ',u:'Кредитная история, действующие обязательства, КДН',st:'ok',t:'20–60 сек'},
 {n:'Скоринговый движок',d:'Ваш собственный, который поднимают отдельные разработчики',u:'Итоговый балл и рекомендация по решению',st:'plan',t:'до 5 сек'},
 {n:'1С: Бухгалтерия',d:'Выдачи, погашения, начисления',u:'Двусторонний обмен документами и остатками',st:'ok',t:'каждые 15 мин'},
 {n:'WhatsApp Business API',d:'Официальный канал на номер компании',u:'Переписка, уведомления, напоминания',st:'ok',t:'мгновенно'},
 {n:'Телефония',d:'Подключается ваша АТС',u:'Звонок из карточки, запись, пропущенные',st:'ok',t:'мгновенно'},
 {n:'Реестр залогов и обременений',d:'Проверка обременений на имуществе',u:'Чистота залога до одобрения',st:'ok',t:'1–3 мин'},
 {n:'Платёжный шлюз',d:'Оплата из личного кабинета',u:'Погашение онлайн и автоматический разнос',st:'plan',t:'мгновенно'}
];
SC.integr=()=>`${head('Внешние сервисы','Восемь подключений. Каждое — не «галочка в списке», а конкретное действие в конкретной точке процесса.',
 '<button class="bt" onclick="toast(\'Каждая интеграция изолирована: если внешний сервис недоступен, заявка не теряется — она встаёт в очередь и обрабатывается при восстановлении связи.\')">Что при сбое</button>')}
 <div class="wid">
  <div><small>Интеграций</small><b class="a">${INTG.length}</b><span>в контуре проекта</span></div>
  <div><small>Запросов в сутки</small><b>~640</b><span>к внешним сервисам</span></div>
  <div><small>Прескоринг</small><b class="g">2 мин 40 с</b><span>ГБД ФЛ + бюро + балл</span></div>
  <div><small>Обмен с 1С</small><b>каждые 15 мин</b><span>в обе стороны</span></div>
  <div><small>Ручного ввода</small><b class="g">0</b><span>данные приходят сами</span></div>
 </div>
 <div class="tw"><table class="t" style="min-width:900px">
  <thead><tr><th>Сервис</th><th>Что именно даёт</th><th>Когда вызывается</th><th class="r">Время ответа</th><th>Статус</th></tr></thead>
  <tbody>${INTG.map(i=>`<tr onclick="toast('${esc(i.n)}: ${esc(i.u)}. Ответ сохраняется в заявке целиком — видно, что именно ответил сервис и когда.')">
   <td><b>${esc(i.n)}</b><div class="sub2">${esc(i.d)}</div></td>
   <td class="sub2">${esc(i.u)}</td>
   <td class="sub2">${i.n==='1С: Бухгалтерия'?'по расписанию и при событии':i.st==='plan'?'на этапе решения / оплаты':'на прескоринге и в карточке'}</td>
   <td class="r mono">${esc(i.t)}</td>
   <td><span class="tag ${i.st==='ok'?'g':'w'}">${i.st==='ok'?'в проекте':'ваш подрядчик'}</span></td></tr>`).join('')}</tbody>
 </table></div>
 <div class="g2" style="margin-top:12px">
  <div class="pan"><h3>Скоринговый движок — ваш</h3>
   <p>Вы сказали, что движок поднимают отдельные ребята. Мы не переписываем его и не спорим с ним — мы даём ему данные и принимаем ответ.</p>
   <div class="li n"><i>1</i><span>Система собирает пакет: анкета, ГБД ФЛ, бюро, залог</span></div>
   <div class="li n"><i>2</i><span>Отправляет его в ваш движок одним запросом</span></div>
   <div class="li n"><i>3</i><span>Получает балл, класс риска и рекомендацию</span></div>
   <div class="li n"><i>4</i><span>Применяет ваши пороги и показывает решение специалисту</span></div>
   <div class="li n"><i>5</i><span>Сохраняет весь ответ целиком — для аудита и разбора</span></div>
   <div class="hint">Пока движок не готов, работает встроенная модель по правилам: КДН, история просрочек, LTV, стаж и сумма. Её видно в разделе «Прескоринг» — она уже считает.</div>
  </div>
  <div class="pan"><h3>Если внешний сервис лёг</h3>
   <div class="li w"><i>!</i><span><b>Бюро не ответило</b> — заявка не отказывается, ставится в очередь, специалист видит «ожидает бюро»<span class="sub">повтор каждые 2 минуты, до 30 минут</span></span></div>
   <div class="li w"><i>!</i><span><b>ГБД ФЛ недоступна</b> — можно продолжить вручную с пометкой «проверка отложена»<span class="sub">решение при этом блокируется до проверки</span></span></div>
   <div class="li w"><i>!</i><span><b>1С недоступна</b> — документы копятся в очереди и уходят пачкой<span class="sub">ничего не теряется и не дублируется</span></span></div>
   <div class="li"><i>✓</i><span>Все обращения к сервисам пишутся в журнал<span class="sub">видно, кто, когда, что запросил и что получил</span></span></div>
   <div class="note" style="--tone:var(--bad)"><b>Так не бывает в коробке</b>
    <p>В универсальной CRM интеграция с ГБД ФЛ и бюро — это всегда отдельная разработка сверху, которую делает третья компания. Сбои при этом никто не обрабатывает.</p></div>
  </div>
 </div>`;

/* ====== ОБМЕН С 1С ====== */
SC.c1=()=>`${head('Обмен с 1С','1С остаётся у вас и остаётся главной по бухгалтерии. Система не заменяет её — она перестаёт заставлять людей вводить одно и то же дважды.',
 '<button class="bt p" onclick="toast(\'Обмен идёт по расписанию каждые 15 минут и дополнительно при событии — выдача, погашение, изменение договора.\')">Запустить обмен</button>')}
 <div class="g2">
  <div class="pan"><h3>Система → 1С</h3>
   <div class="li"><i>→</i><span>Договор займа и график<span class="sub">при выдаче, с суммой, ставкой и сроком</span></span></div>
   <div class="li"><i>→</i><span>Факт выдачи денег<span class="sub">после регистрации обременения</span></span></div>
   <div class="li"><i>→</i><span>Начисление вознаграждения<span class="sub">по графику, помесячно</span></span></div>
   <div class="li"><i>→</i><span>Начисление пени по просрочке</span></div>
   <div class="li"><i>→</i><span>Контрагент: клиент с ИИН/БИН и реквизитами<span class="sub">заводится один раз, без ручного дубля</span></span></div>
  </div>
  <div class="pan"><h3>1С → система</h3>
   <div class="li i"><i>←</i><span>Поступление платежа с расчётного счёта<span class="sub">разносится по договору автоматически</span></span></div>
   <div class="li i"><i>←</i><span>Кассовые операции<span class="sub">оплаты в офисе</span></span></div>
   <div class="li i"><i>←</i><span>Подтверждение выдачи<span class="sub">платёжное поручение</span></span></div>
   <div class="li i"><i>←</i><span>Остатки для сверки<span class="sub">расхождения подсвечиваются, а не тонут</span></span></div>
   <div class="li i"><i>←</i><span>Справочник статей и счетов</span></div>
  </div>
 </div>
 <div class="g21">
  <div class="pan"><h3>Журнал обмена</h3>
   <div class="tw" style="border:0"><table class="t" style="min-width:620px">
    <thead><tr><th>Время</th><th>Направление</th><th>Документ</th><th class="r">Кол-во</th><th>Результат</th></tr></thead>
    <tbody>${[['11:45','→ в 1С','Начисление вознаграждения',14,'Проведено','g'],
     ['11:45','← из 1С','Поступление на счёт',6,'Разнесено','g'],
     ['11:30','→ в 1С','Договор займа З-4412',1,'Проведено','g'],
     ['11:30','← из 1С','Кассовые операции',3,'Разнесено','g'],
     ['11:15','← из 1С','Поступление на счёт',2,'Расхождение 1 200 ₸','w'],
     ['11:00','→ в 1С','Начисление пени',9,'Проведено','g']].map(r=>
    `<tr><td class="mono">${r[0]}</td><td class="mono">${r[1]}</td><td>${esc(r[2])}</td><td class="r">${r[3]}</td>
     <td><span class="tag ${r[5]}">${esc(r[4])}</span></td></tr>`).join('')}</tbody>
   </table></div>
  </div>
  <div class="pan"><h3>Что это меняет для бухгалтера</h3>
   <div class="kv"><span>Документов в день вручную сейчас</span><b>~45</b></div>
   <div class="kv"><span>После обмена</span><b style="color:var(--ok)">0</b></div>
   <div class="kv"><span>Сверка остатков</span><b>автоматически, 15 мин</b></div>
   <div class="kv"><span>Расхождения за месяц</span><b style="color:var(--warn)">3 · подсвечены</b></div>
   <div class="note" style="--tone:var(--acc)"><b>Интеграция с 1С — 800 000 ₸</b>
    <p>Отдельный блок работ: настройка обмена по документам, справочникам и остаткам с вашей конфигурацией. Ровно та сумма, которую обсуждали на встрече.</p></div>
   <div class="hint">Сейчас у вас всё живёт только в 1С. 1С — про бухгалтерию, а не про заявки, скоринг, залоги и просрочку. Поэтому она остаётся, но перестаёт быть единственным местом, куда всё вбивают руками.</div>
  </div>
 </div>`;

/* ====== KPI ====== */
SC.kpi=()=>`${head('KPI кредитных специалистов','Сейчас семь специалистов, по плану пятнадцать. Пока их семь, можно держать всё в голове. На пятнадцати — уже нет.',
 '<button class="bt" onclick="toast(\'План ставится по сумме выдач, количеству выдач и скорости первого ответа. Считается автоматически из заявок и договоров.\')">Настроить план</button>')}
 <div class="wid">
  <div><small>Специалистов</small><b class="a">${F.specialists}</b><span>план по штату — 15</span></div>
  <div><small>Выдано за месяц</small><b>${mln(F.issuedSum)} ₸</b><span>${F.issued} договоров</span></div>
  <div><small>План месяца</small><b>${mln(SPEC.reduce((a,s)=>a+s.plan,0))} ₸</b><span>выполнен на ${pct(SPEC.reduce((a,s)=>a+s.sum,0),SPEC.reduce((a,s)=>a+s.plan,0))}</span></div>
  <div><small>Средняя конверсия</small><b>${num(F.issued/F.leads*100)}%</b><span>заявка → выдача</span></div>
  <div><small>Лучший ответ</small><b class="g">3 мин</b><span>Айгерим</span></div>
 </div>
 <div class="tw"><table class="t" style="min-width:880px">
  <thead><tr><th>Специалист</th><th class="r">Заявок</th><th class="r">Выдач</th><th class="r">Конверсия</th><th class="r">Сумма</th><th>План</th><th class="r">Ответ</th></tr></thead>
  <tbody>${SPEC.map(s=>{const d=s.sum/s.plan*100;return `<tr onclick="toast('${esc(s.n)}: карточка сотрудника — заявки, выдачи, отказы с причинами, скорость ответа по часам и записи звонков.')">
   <td><b>${avatar(s.n)} ${esc(s.n)}</b></td>
   <td class="r">${s.leads}</td><td class="r"><b>${s.issued}</b></td>
   <td class="r">${num(s.issued/s.leads*100)}%</td>
   <td class="r"><b>${mln(s.sum)} ₸</b></td>
   <td><div class="bar" style="--w:${Math.min(100,d)}%"><i class="${d>=100?'g':d>=85?'':'w'}"></i></div><div class="sub2">${num(d)}% от ${mln(s.plan)}</div></td>
   <td class="r"><span class="tag ${parseInt(s.sla)<=5?'g':parseInt(s.sla)<=8?'w':'r'}">${esc(s.sla)}</span></td></tr>`}).join('')}</tbody>
 </table></div>
 <div class="g2" style="margin-top:12px">
  <div class="pan"><h3>Что видно руководителю без планёрки</h3>
   <div class="li"><i>✓</i><span>Кто не перезвонил за 5 минут и по каким заявкам<span class="sub">видно сразу, а не в конце месяца</span></span></div>
   <div class="li"><i>✓</i><span>У кого заявки зависают дольше суток на одном этапе</span></div>
   <div class="li"><i>✓</i><span>У кого много отказов после прескоринга<span class="sub">значит, не тем обещает или не те заявки берёт</span></span></div>
   <div class="li"><i>✓</i><span>Сколько заявок в работе у каждого прямо сейчас<span class="sub">чтобы распределять новые честно</span></span></div>
   <div class="li"><i>✓</i><span>Запись любого звонка — в один клик из карточки</span></div>
  </div>
  <div class="pan"><h3>Рост с 7 до 15 человек</h3>
   <div class="kv"><span>Заявок на специалиста сейчас</span><b>45 в месяц</b></div>
   <div class="kv"><span>При 15 специалистах и том же потоке</span><b>21 в месяц</b></div>
   <div class="kv"><span>Значит, нужен поток</span><b style="color:var(--acc)">×2 заявок</b></div>
   <div class="note" style="--tone:var(--acc)"><b>Сначала поток, потом люди</b>
    <p>Нанимать вдвое больше специалистов имеет смысл, когда есть чем их загрузить. Сайт, WhatsApp и быстрый прескоринг дают поток; система показывает, хватает ли его на новых людей — до того, как они выйдут на работу.</p></div>
   <div class="hint">Новый специалист садится за готовый процесс: этапы, чек-листы, шаблоны и подсказки уже в системе. Обучение — день, а не месяц рядом с опытным.</div>
  </div>
 </div>`;

/* ====== ЗАДАЧИ ====== */
SC.tasks=()=>{
 const G=[['late','Просрочено','r'],['today','Сегодня','w'],['week','На неделе','']];
 return `${head('Задачи','Задачи ставит система по событиям, а не человек по памяти. Пропущенная заявка — это не «забыл», это красная строка.',
  '<button class="bt p" onclick="toast(\'Задачи создаются автоматически: новая заявка, зависание на этапе, дата платежа, выход в просрочку, истечение оценки залога, закрытие займа.\')">Правила задач</button>')}
 <div class="g3">
  ${G.map(g=>`<div class="pan"><h3>${esc(g[1])} <span class="tag ${g[2]}">${TASKS.filter(t=>t.grp===g[0]).length}</span></h3>
   ${TASKS.filter(t=>t.grp===g[0]).map(t=>`<div class="li ${g[0]==='late'?'w':g[0]==='today'?'n':'no'}" onclick="${t.lead?`openLead(${t.lead})`:`toast('Задача по массовому обзвону: открывается список договоров корзины с телефонами и историей контактов.')`}" style="cursor:pointer">
    <i>${g[0]==='late'?'!':'·'}</i><span>${esc(t.t)}<span class="sub">${esc(t.ty)} · ${esc(t.who)} · ${esc(t.due)}</span></span></div>`).join('')}
  </div>`).join('')}
 </div>
 <div class="g2">
  <div class="pan"><h3>Задачи, которые система ставит сама</h3>
   <div class="kv"><span>Новая заявка — позвонить за 5 минут</span><b>при создании</b></div>
   <div class="kv"><span>Заявка стоит на этапе дольше суток</span><b>автоматически</b></div>
   <div class="kv"><span>Клиент не подписал согласие за 2 часа</span><b>напомнить</b></div>
   <div class="kv"><span>Документы не собраны за 3 дня</span><b>руководителю</b></div>
   <div class="kv"><span>Завтра платёж по договору</span><b>клиенту и специалисту</b></div>
   <div class="kv"><span>Первый день просрочки</span><b>взысканию</b></div>
   <div class="kv"><span>Оценке залога больше 12 месяцев</span><b>переоценка</b></div>
   <div class="kv"><span>За 30 дней до закрытия хорошего займа</span><b>предложить новый</b></div>
  </div>
  <div class="pan"><h3>Дисциплина в цифрах</h3>
   <div class="kv"><span>Задач создано за месяц</span><b>1 847</b></div>
   <div class="kv"><span>Из них системой</span><b style="color:var(--acc)">91%</b></div>
   <div class="kv"><span>Выполнено в срок</span><b style="color:var(--ok)">88%</b></div>
   <div class="kv"><span>Просрочено сейчас</span><b style="color:var(--bad)">${TASKS.filter(t=>t.grp==='late').length}</b></div>
   <div class="note" style="--tone:var(--ok)"><b>Ничего не забывается</b>
    <p>Пока задачи живут в голове и в переписке, часть заявок теряется — это нормально для семи человек и смертельно для пятнадцати. Система не забывает и не уходит в отпуск.</p></div>
  </div>
 </div>`};

/* ====== ОТЧЁТНОСТЬ ====== */
SC.reports=()=>`${head('Отчётность','Управленческие отчёты и выгрузки для регулятора собираются из тех же данных, что и вся работа. Не из Excel, который кто-то ведёт параллельно.',
 '<button class="bt p" onclick="toast(\'Любой отчёт ставится на расписание: приходит на почту в нужный день в Excel или PDF.\')">Расписание отчётов</button>')}
 <div class="g2">
  <div class="pan"><h3>Управленческие</h3>
   ${[['Портфель на дату','остаток, структура, LTV, залоги'],
      ['Выдачи за период','по продуктам, каналам и специалистам'],
      ['Качество портфеля','корзины просрочки, NPL, провизии'],
      ['Воронка и конверсия','по этапам, с причинами отказов'],
      ['Эффективность специалистов','план-факт, скорость, конверсия'],
      ['Движение денег','выдачи, погашения, пени, план поступлений']].map(r=>
    `<div class="kv"><span>${esc(r[0])}<div class="sub">${esc(r[1])}</div></span>
     <button class="bt" onclick="toast('Отчёт «${esc(r[0])}» формируется за любой период и выгружается в Excel. Можно поставить на расписание.')">Excel</button></div>`).join('')}
  </div>
  <div class="pan"><h3>Регуляторные и внешние</h3>
   ${[['Отчёт в кредитное бюро','ежемесячно, по всем договорам'],
      ['Отчётность по МФО','формы регулятора, из данных системы'],
      ['Реестр договоров','для проверок и аудита'],
      ['Реестр залогов и обременений','с датами регистрации'],
      ['Журнал согласий на обработку ПД','кто, когда, чем подписал'],
      ['Журнал действий пользователей','кто что менял и когда']].map(r=>
    `<div class="kv"><span>${esc(r[0])}<div class="sub">${esc(r[1])}</div></span>
     <button class="bt" onclick="toast('Выгрузка «${esc(r[0])}» формируется в требуемом формате. При смене требований меняется шаблон, а не система.')">Выгрузить</button></div>`).join('')}
   <div class="note" style="--tone:var(--info)"><b>Журнал действий — не опция</b>
    <p>В кредитовании важно не только решение, но и кто его принял. Каждое изменение суммы, ставки, срока и статуса пишется с пользователем и временем. Это защищает и компанию, и сотрудника.</p></div>
  </div>
 </div>
 <div class="pan"><h3>Что считается само, без сведения в Excel</h3>
  <div class="g3" style="margin:0">
   <div><div class="kv"><span>Остаток портфеля</span><b>${mln(F.portfolio)} ₸</b></div>
    <div class="kv"><span>NPL 90+</span><b>${num(F.npl90/F.portfolio*100)}%</b></div>
    <div class="kv"><span>Средний LTV</span><b>58%</b></div></div>
   <div><div class="kv"><span>Выдано за месяц</span><b>${mln(F.issuedSum)} ₸</b></div>
    <div class="kv"><span>Средний чек</span><b>${mln(F.avg)} ₸</b></div>
    <div class="kv"><span>Конверсия</span><b>${num(F.convFull)}%</b></div></div>
   <div><div class="kv"><span>Ожидается поступлений</span><b>${mln(94600000)} ₸</b></div>
    <div class="kv"><span>Начислено пени</span><b>${mln(4180000)} ₸</b></div>
    <div class="kv"><span>Провизии</span><b>${mln(142000000)} ₸</b></div></div>
  </div>
 </div>`;

/* ====== НАСТРОЙКИ: ПОЛЯ И ЭТАПЫ ====== */
SC.settings=()=>`${head('Поля и этапы','Этапы, поля, продукты и пороги меняете вы сами, без программиста и без обращения к нам. Процесс у вас поменяется — система поменяется вместе с ним.',
 '<button class="bt p" onclick="toast(\'Новый этап добавляется мышкой: название, цвет, обязательные поля и правило автоматического перехода.\')">+ ЭТАП</button>')}
 <div class="g2">
  <div class="pan"><h3>Этапы работы с заявкой</h3><p>Порядок меняется перетаскиванием. Ровно та цепочка, которую вы описали на встрече.</p>
   ${ST.map((s,i)=>`<div class="srow"><span class="gr">⣿</span><span class="cbox" style="background:${s[2]}"></span>
    <span class="nm">${esc(s[1])}<div class="sub">${i===1?'обязательно до любого запроса во внешние сервисы':i===2?'ГБД ФЛ и кредитное бюро, целевое время — 5 минут':i===4?'оценка, LTV, проверка обременений':i===7?'договор залога и регистрация обременения':'этап воронки'}</div></span>
    <span class="sw on" onclick="this.classList.toggle('on');toast('Этап можно выключить — он исчезнет из воронки, а заявки перейдут на следующий.')"></span></div>`).join('')}
  </div>
  <div class="pan"><h3>Продукты и пороги</h3>
   ${PROD.map(p=>`<div class="srow"><span class="nm"><b>${esc(p.n)}</b>
    <div class="sub">ставка ${num(p.rate)}% в месяц · ГЭСВ ${num(gesv(p.rate))}% · ${esc(p.term)} · LTV до ${p.ltv||'—'}%</div></span>
    <span class="tag a">${p.cnt} дог.</span></div>`).join('')}
   <div class="kv" style="margin-top:12px"><span>Порог одобрения по баллу</span><b>650</b></div>
   <div class="kv"><span>Максимальная долговая нагрузка (КДН)</span><b>0,5</b></div>
   <div class="kv"><span>Максимальный LTV по недвижимости</span><b>70%</b></div>
   <div class="kv"><span>Максимальный LTV по авто</span><b>55%</b></div>
   <div class="kv"><span>Допустимая просрочка в истории</span><b>до 30 дней, закрытая</b></div>
   <div class="hint">Пороги — это не код. Риск-менеджер меняет их в интерфейсе, изменение пишется в журнал с датой и автором. Решения, принятые по старым порогам, остаются как есть.</div>
  </div>
 </div>
 <div class="g2">
  <div class="pan"><h3>Поля заявки</h3>
   ${[['Сумма займа','число','обязательное'],['Тип залога','список','обязательное'],
      ['Оценочная стоимость залога','число','обязательное'],['ИИН / БИН','текст','обязательное'],
      ['Источник дохода','список',''],['Цель займа','список',''],
      ['Созаёмщик','связь',''],['Комментарий специалиста','текст','']].map(f=>
    `<div class="srow"><span class="gr">⣿</span><span class="nm">${esc(f[0])}<div class="sub">${esc(f[1])}</div></span>
     ${f[2]?`<span class="tag a">${esc(f[2])}</span>`:'<span class="tag">необязательное</span>'}</div>`).join('')}
   <div class="hint">Добавить своё поле — минута. Оно сразу появится в карточке, в фильтрах и в выгрузках.</div>
  </div>
  <div class="pan"><h3>Правила автоматики</h3>
   <div class="srow"><span class="nm">Распределять заявки по очереди<div class="sub">поровну между свободными специалистами</div></span><span class="sw on" onclick="this.classList.toggle('on')"></span></div>
   <div class="srow"><span class="nm">Заявки свыше 30 млн — руководителю<div class="sub">крупные суммы забирает старший</div></span><span class="sw on" onclick="this.classList.toggle('on')"></span></div>
   <div class="srow"><span class="nm">Блокировать одобрение выше LTV продукта<div class="sub">жёсткое правило, обойти нельзя</div></span><span class="sw on" onclick="this.classList.toggle('on')"></span></div>
   <div class="srow"><span class="nm">Не выдавать до регистрации обременения<div class="sub">деньги удерживаются</div></span><span class="sw on" onclick="this.classList.toggle('on')"></span></div>
   <div class="srow"><span class="nm">Автоотказ при активном исполнительном производстве<div class="sub">по данным прескоринга</div></span><span class="sw on" onclick="this.classList.toggle('on')"></span></div>
   <div class="srow"><span class="nm">Напоминание о платеже за 3 дня<div class="sub">WhatsApp и push</div></span><span class="sw on" onclick="this.classList.toggle('on')"></span></div>
   <div class="srow"><span class="nm">Переоценка залога раз в 12 месяцев<div class="sub">задача юристу</div></span><span class="sw on" onclick="this.classList.toggle('on')"></span></div>
  </div>
 </div>`;

/* ====== ПОЛЬЗОВАТЕЛИ ====== */
SC.users=()=>`${head('Пользователи и права','20 человек в компании, у каждого — своя часть. Бухгалтер не видит скоринг, специалист не видит чужие заявки, взыскание не меняет условия договора.',
 '<button class="bt p" onclick="toast(\'Сотрудник заводится за минуту: имя, роль, доступ к разделам. При увольнении доступ закрывается, а его заявки и переписка остаются в компании.\')">+ СОТРУДНИК</button>')}
 <div class="wid">
  <div><small>Сотрудников</small><b class="a">${F.staff}</b><span>в системе</span></div>
  <div><small>Ролей</small><b>${Object.keys(ROLES).length}</b><span>настраиваемых</span></div>
  <div><small>Кредитных специалистов</small><b>${F.specialists}</b><span>план — 15</span></div>
  <div><small>Лицензии за людей</small><b class="g">не платите</b><span>количество не ограничено</span></div>
  <div><small>Журнал действий</small><b>ведётся</b><span>кто, что, когда</span></div>
 </div>
 <div class="tw"><table class="t" style="min-width:900px">
  <thead><tr><th>Роль</th><th>Кто это</th><th>Что видит</th><th class="r">Разделов</th><th>Ограничения</th></tr></thead>
  <tbody>${Object.entries(ROLES).map(([k,v])=>`<tr onclick="enter('${esc(k)}')" title="Открыть систему глазами этой роли">
   <td><b>${avatar(v.n)} ${esc(k)}</b></td><td>${esc(v.n)} · ${esc(v.r)}</td>
   <td class="sub2">${esc(v.note)}</td><td class="r">${v.s.length}</td>
   <td class="sub2">${k==='Кредитный специалист'?'только свои заявки, не меняет ставку':k==='Бухгалтер'?'не видит скоринг и кредитную историю':k==='Специалист по взысканию'?'не меняет условия договора':k==='Юрист по залогам'?'не видит финансовые показатели':k==='Риск-менеджер'?'меняет пороги, не выдаёт деньги':k==='Руководитель продаж'?'все заявки отдела, не меняет пороги':'полный доступ'}</td></tr>`).join('')}</tbody>
 </table></div>
 <div class="g2" style="margin-top:12px">
  <div class="pan"><h3>Почему это важно именно в кредитовании</h3>
   <div class="li"><i>✓</i><span>Кредитная история — персональные данные, доступ к ним должен быть ограничен ролью<span class="sub">и зафиксирован в журнале</span></span></div>
   <div class="li"><i>✓</i><span>Специалист не может изменить ставку или сумму после одобрения<span class="sub">только через риск-менеджера, с записью в журнал</span></span></div>
   <div class="li"><i>✓</i><span>Никто не выгружает базу клиентов «на флешку»<span class="sub">выгрузки ограничены ролью и пишутся в журнал</span></span></div>
   <div class="li"><i>✓</i><span>При увольнении закрывается доступ, а не теряется история<span class="sub">заявки и переписка передаются другому</span></span></div>
  </div>
  <div class="pan"><h3>Лицензии — отдельный разговор</h3>
   <div class="kv"><span>Сейчас сотрудников</span><b>${F.staff}</b></div>
   <div class="kv"><span>Планируете нанять специалистов</span><b>+8</b></div>
   <div class="kv"><span>Доплата за новых пользователей у нас</span><b style="color:var(--ok)">0 ₸</b></div>
   <div class="kv"><span>В коробочных CRM</span><b style="color:var(--warn)">за каждого пользователя</b></div>
   <div class="note" style="--tone:var(--ok)"><b>Система ваша</b>
    <p>Вы платите за разработку один раз, а не за право пользоваться своей же базой каждый год. Когда штат вырастет с 20 до 35 человек, стоимость владения не изменится.</p></div>
  </div>
 </div>`;

/* ====== ЭКОНОМИКА ====== */
ECON.bx=1500000;ECON.grow=15;ECON.dev=3600000;ECON.host=35000;ECON.years=3;
function econSet(k,v){ECON[k]=+v;render()}
function econCalc(){
 let bx=0,r=ECON.bx;
 for(let i=0;i<ECON.years;i++){bx+=r;r*=1+ECON.grow/100}
 const our=ECON.dev+ECON.host*12*ECON.years;
 return {bx:Math.round(bx),our:Math.round(our),diff:Math.round(bx-our)};
}
SC.economy=()=>{const E=econCalc();return `${head('Стоимость владения','Вы сравнивали с Битриксом — посчитаем честно, на ваших цифрах и на вашем горизонте.',
 '<button class="bt" onclick="toast(\'Все суммы — из разговора на встрече. Подписку коробочной CRM берём 1,5 млн ₸ в год с ростом, как вы и говорили.\')">Откуда цифры</button>')}
 <div class="calc">
  <div>
   <div class="crow"><label>Подписка коробочной CRM, ₸ в год <b>${fmt(ECON.bx)} ₸</b></label>
    <input type="range" min="800000" max="3000000" step="100000" value="${ECON.bx}" oninput="econSet('bx',this.value)"></div>
   <div class="crow"><label>Ежегодный рост цены подписки <b>${ECON.grow}%</b></label>
    <input type="range" min="0" max="25" step="5" value="${ECON.grow}" oninput="econSet('grow',this.value)"></div>
   <div class="crow"><label>Горизонт сравнения <b>${ECON.years} ${plural(ECON.years,['год','года','лет'])}</b></label>
    <input type="range" min="1" max="5" step="1" value="${ECON.years}" oninput="econSet('years',this.value)"></div>
   <div class="crow"><label>Сопровождение и хостинг у нас, ₸ в месяц <b>${fmt(ECON.host)} ₸</b></label>
    <input type="range" min="0" max="100000" step="5000" value="${ECON.host}" oninput="econSet('host',this.value)"></div>
   <div class="note" style="--tone:var(--acc)"><b>Подписка платится каждый год и растёт</b>
    <p>Разработка платится один раз. Через ${ECON.years} ${plural(ECON.years,['год','года','лет'])} подписка не заканчивается — она продолжает расти, а система так и остаётся чужой.</p></div>
  </div>
  <div class="res">
   <div class="rr"><span>Коробочная CRM за ${ECON.years} ${plural(ECON.years,['год','года','лет'])}</span><b>${fmt(E.bx)} ₸</b></div>
   <div class="rr"><span>Своя система: разработка</span><b>${fmt(ECON.dev)} ₸</b></div>
   <div class="rr"><span>Своя система: сопровождение</span><b>${fmt(ECON.host*12*ECON.years)} ₸</b></div>
   <div class="rr"><span>Итого своя система</span><b>${fmt(E.our)} ₸</b></div>
   <div class="rr hi"><span>Своя система ${E.diff>=0?'дешевле':'дороже'} на</span><b>${fmt(Math.abs(E.diff))} ₸</b></div>
   <div class="rr"><span>На ${ECON.years+1}-й год подписка</span><b>${fmt(Math.round(ECON.bx*Math.pow(1+ECON.grow/100,ECON.years)))} ₸</b></div>
   <div class="rr"><span>На ${ECON.years+1}-й год у нас</span><b>${fmt(ECON.host*12)} ₸</b></div>
   <div class="rr"><span>Лицензии за новых сотрудников</span><b>0 ₸</b></div>
   <div class="rr"><span>Кому принадлежит система</span><b>вам, с кодом и базой</b></div>
  </div>
 </div>
 <div class="g2">
  <div class="pan"><h3>Из чего складывается разработка</h3>
   <div class="kv"><span>Ядро системы<div class="sub">заявки, воронка, клиенты, займы, платежи, просрочка, задачи, права, отчёты</div></span><b>2 000 000 ₸</b></div>
   <div class="kv"><span>Сайт, скоринг и передача заявки<div class="sub">форма на сайте, прескоринг, ГБД ФЛ и бюро, связь с вашим движком</div></span><b>800 000 ₸</b></div>
   <div class="kv"><span>Интеграция с 1С<div class="sub">двусторонний обмен документами, справочниками и остатками</div></span><b>800 000 ₸</b></div>
   <div class="kv"><span><b>Итого разработка</b></span><b style="color:var(--acc)">3 600 000 ₸</b></div>
   <div class="kv"><span>Доработки после запуска<div class="sub">по факту, по вашим задачам</div></span><b>20 $ / час</b></div>
   <div class="kv"><span>Сопровождение и хостинг<div class="sub">обновления, резервные копии, поддержка</div></span><b>от 35 000 ₸ / мес</b></div>
   <div class="hint">Срок — 4–6 недель. Первым запускаем блок «заявка → прескоринг → решение»: он даёт эффект раньше всего остального.</div>
  </div>
  <div class="pan"><h3>Что не входит в подписку коробки</h3>
   <div class="li w"><i>!</i><span>Интеграция с ГБД ФЛ и кредитным бюро<span class="sub">отдельная разработка сторонней компании, поверх коробки</span></span></div>
   <div class="li w"><i>!</i><span>Залоги как отдельная сущность с LTV и обременениями<span class="sub">в коробке этого нет — делается кастомом</span></span></div>
   <div class="li w"><i>!</i><span>График погашения, пени и разнос платежей<span class="sub">это не CRM-функции</span></span></div>
   <div class="li w"><i>!</i><span>Личный кабинет клиента<span class="sub">отдельный продукт или отдельная разработка</span></span></div>
   <div class="li w"><i>!</i><span>Обмен с 1С по вашим документам<span class="sub">типовой обмен не покрывает микрокредиты</span></span></div>
   <div class="li w"><i>!</i><span>Новые сотрудники<span class="sub">лицензии считаются по людям, а штат вы планируете удвоить</span></span></div>
   <div class="note" style="--tone:var(--bad)"><b>Главный риск коробки</b>
    <p>Половину нужного всё равно придётся заказывать отдельно — и платить и за подписку, и за разработку. Подписка при этом растёт каждый год, а доработки остаются у стороннего подрядчика.</p></div>
  </div>
 </div>`};

/* ====== ПЕРЕДАЧА ====== */
SC.stack=()=>`${head('Что вы получаете на выходе','Не доступ к чужому сервису, а систему, которая принадлежит вам: код, база, сервер и документация.',
 '<button class="bt p" onclick="toast(\'Исходный код передаётся в ваш репозиторий, база — на ваш сервер. Продолжать развитие можно с нами или без нас.\')">Условия передачи</button>')}
 <div class="g3">
  <div class="pan"><h3>Код</h3>
   <div class="li"><i>✓</i><span>Исходный код в вашем репозитории</span></div>
   <div class="li"><i>✓</i><span>Исключительные права по договору</span></div>
   <div class="li"><i>✓</i><span>Без скрытых модулей и лицензионных ключей</span></div>
   <div class="li"><i>✓</i><span>Техническая документация и схема базы</span></div>
  </div>
  <div class="pan"><h3>Данные</h3>
   <div class="li"><i>✓</i><span>База на вашем сервере или в вашем облаке</span></div>
   <div class="li"><i>✓</i><span>Персональные данные не уходят за периметр</span></div>
   <div class="li"><i>✓</i><span>Ежедневные резервные копии</span></div>
   <div class="li"><i>✓</i><span>Полная выгрузка в любой момент</span></div>
  </div>
  <div class="pan"><h3>Дальше</h3>
   <div class="li"><i>✓</i><span>Развитие с нами — 20 $ / час по факту</span></div>
   <div class="li"><i>✓</i><span>Или своей командой — код и документация у вас</span></div>
   <div class="li"><i>✓</i><span>Сопровождение и обновления — от 35 000 ₸ / мес</span></div>
   <div class="li"><i>✓</i><span>Гарантия на разработанное — по договору</span></div>
  </div>
 </div>
 <div class="g21">
  <div class="pan"><h3>План запуска · 4–6 недель</h3>
   <div class="tl">
    <div class="tli ok"><b>Неделя 1 · Процесс и данные</b><p>Фиксируем этапы, поля, продукты и пороги. Переносим клиентов и действующие договоры из 1С. Согласуем макеты.</p></div>
    <div class="tli ok"><b>Неделя 2 · Заявки и воронка</b><p>Заявки, распределение, задачи, карточки клиента и залога, права ролей. Специалисты уже могут работать.</p></div>
    <div class="tli on"><b>Неделя 3 · Прескоринг</b><p>ГБД ФЛ, кредитное бюро, согласие на обработку ПД, пороги, решение. Тот самый блок «5 минут».</p></div>
    <div class="tli"><b>Неделя 4 · Займы и платежи</b><p>Договоры, графики, начисления, платежи, корзины просрочки, документы по шаблонам.</p></div>
    <div class="tli"><b>Неделя 5 · Сайт, 1С и кабинет</b><p>Форма на сайте, обмен с 1С, личный кабинет клиента, WhatsApp и телефония.</p></div>
    <div class="tli"><b>Неделя 6 · Обучение и запуск</b><p>Обучение сотрудников, параллельная работа со старым процессом неделю, полный переход.</p></div>
   </div>
  </div>
  <div class="pan"><h3>Чем рискуете</h3>
   <div class="kv"><span>Оплата по этапам</span><b>не всё вперёд</b></div>
   <div class="kv"><span>Демо-версия до старта</span><b style="color:var(--ok)">перед вами</b></div>
   <div class="kv"><span>Показываем работу каждую неделю</span><b>живьём, не в отчёте</b></div>
   <div class="kv"><span>Старый процесс не выключаем сразу</span><b>неделя параллельно</b></div>
   <div class="note" style="--tone:var(--acc)"><b>Начать можно с одного блока</b>
    <p>Если 3,6 млн сразу — много, начинаем с «заявка → прескоринг → решение» за 2,8 млн. Он окупается первым: это скорость ответа и отсечение заведомо плохих заявок. Остальное добавляется потом, на той же базе.</p></div>
  </div>
 </div>`;

/* ====== МОДАЛКИ ====== */
function openLead(id){
 const l=LEADS.find(x=>x.id===id);if(!l)return;
 const idx=ST.findIndex(s=>s[0]===l.s);
 openM(`Заявка № ${l.id} · ${esc(l.c)}`,`${esc(l.ch)} · ${esc(l.mg)} · ${esc(STN[l.s])}`,`
  <div class="wid" style="margin-bottom:12px">
   <div><small>Сумма</small><b class="a">${l.sum?fmt(l.sum)+' ₸':'не указана'}</b><span>запрошено клиентом</span></div>
   <div><small>Залог</small><b style="font-size:14px">${esc(l.pl)}</b><span>предварительно</span></div>
   <div><small>Этап</small><b style="font-size:14px">${esc(STN[l.s])}</b><span>${idx+1} из ${ST.length}</span></div>
   <div><small>ИИН</small><b class="mono" style="font-size:14px">${esc(l.iin)}</b><span>маскируется по правам</span></div>
  </div>
  <div class="g2" style="margin-bottom:0">
   <div class="pan"><h3>Движение по этапам</h3>
    <div class="tl">${ST.map((s,i)=>`<div class="tli ${i<idx?'ok':i===idx?'on':''}">
     <b>${esc(s[1])}</b><p>${i<idx?'пройден':i===idx?'текущий этап':'впереди'}</p></div>`).join('')}</div>
   </div>
   <div class="pan"><h3>Что здесь делает специалист</h3>
    <div class="li ${idx>=1?'':'n'}"><i>${idx>=1?'✓':'1'}</i><span>Взять согласие на обработку персональных данных</span></div>
    <div class="li ${idx>=2?'':'n'}"><i>${idx>=2?'✓':'2'}</i><span>Запустить прескоринг: ГБД ФЛ и кредитное бюро</span></div>
    <div class="li ${idx>=3?'':'n'}"><i>${idx>=3?'✓':'3'}</i><span>Получить балл и применить пороги</span></div>
    <div class="li ${idx>=4?'':'n'}"><i>${idx>=4?'✓':'4'}</i><span>Оценить залог и проверить обременения</span></div>
    <div class="li ${idx>=6?'':'n'}"><i>${idx>=6?'✓':'5'}</i><span>Запросить документы по списку продукта</span></div>
    <div class="li ${idx>=8?'':'n'}"><i>${idx>=8?'✓':'6'}</i><span>Подписать договоры и зарегистрировать обременение</span></div>
    <div class="btns" style="margin-top:12px">
     <button class="bt p" onclick="closeM();go('scoring')">Открыть прескоринг</button>
     <button class="bt" onclick="closeM();go('calc')">Посчитать платёж</button>
     <button class="bt" onclick="toast('Звонок уходит из карточки через вашу АТС. Запись и длительность сохранятся здесь же.')">Позвонить</button>
    </div>
   </div>
  </div>`);
}
function openLoan(id){
 const l=LOANS.find(x=>x.id===id);if(!l)return;
 const pay=annuity(l.sum,l.term,l.rate);
 openM(`Договор ${l.id} · ${esc(l.c)}`,`${esc(l.pl)} · LTV ${l.ltv}% · ${esc(l.st)}`,`
  <div class="wid" style="margin-bottom:12px">
   <div><small>Выдано</small><b>${fmt(l.sum)} ₸</b><span>${l.term} мес · ${num(l.rate)}% в месяц</span></div>
   <div><small>Остаток долга</small><b class="a">${fmt(l.rest)} ₸</b><span>оплачено ${l.paid} из ${l.term}</span></div>
   <div><small>Платёж</small><b>${fmt(pay)} ₸</b><span>следующий ${l.next}</span></div>
   <div><small>ГЭСВ</small><b>${num(gesv(l.rate))}%</b><span>годовая эффективная</span></div>
   <div><small>Статус</small><b class="${l.od?(l.od>90?'r':'w'):'g'}" style="font-size:14px">${esc(l.st)}</b><span>${l.od?'корзина '+(l.od<=30?'1–30':l.od<=60?'31–60':l.od<=90?'61–90':'90+'):'без просрочек'}</span></div>
  </div>
  <div class="g2" style="margin-bottom:0">
   <div class="pan"><h3>Ближайшие платежи</h3>
    <div class="res sched">${Array.from({length:6},(_,i)=>{
      const n=l.paid+i+1;if(n>l.term)return '';
      const rest=Math.max(0,l.rest-pay*i*0.62);
      return `<div class="rr"><span>Платёж № ${n}</span><b>${fmt(pay)} ₸</b><span class="sub2">остаток ${fmt(rest)} ₸</span></div>`}).join('')}</div>
   </div>
   <div class="pan"><h3>Залог и документы</h3>
    <div class="kv"><span>Объект</span><b>${esc(l.pl)}</b></div>
    <div class="kv"><span>LTV</span><b>${l.ltv}%</b></div>
    <div class="kv"><span>Обременение</span><b style="color:var(--ok)">зарегистрировано</b></div>
    <div class="kv"><span>Договор займа и залога</span><b>подписаны</b></div>
    <div class="kv"><span>График погашения</span><b>выдан клиенту</b></div>
    <div class="btns" style="margin-top:12px">
     <button class="bt p" onclick="toast('Справка об остатке задолженности формируется в PDF и уходит клиенту в WhatsApp.')">Справка об остатке</button>
     <button class="bt" onclick="closeM();go('payments')">Платежи</button>
     ${l.od?`<button class="bt r" onclick="closeM();go('overdue')">Просрочка</button>`:''}
    </div>
   </div>
  </div>`);
}
function openClient(n){
 const c=CLIENTS.find(x=>x.n.replace(/'/g,'')===n)||CLIENTS[0];
 openM(esc(c.n),`${esc(c.seg)} · клиент с ${c.since} года · ${esc(c.ph)}`,`
  <div class="wid" style="margin-bottom:12px">
   <div><small>Займов всего</small><b class="a">${c.loans}</b><span>включая закрытые</span></div>
   <div><small>Общая сумма</small><b>${fmt(c.sum)} ₸</b><span>за всё время</span></div>
   <div><small>Статус</small><b class="${c.st==='Просрочка'?'r':'g'}" style="font-size:14px">${esc(c.st)}</b><span>по действующим</span></div>
   <div><small>ИИН / БИН</small><b class="mono" style="font-size:14px">${esc(c.iin)}</b><span>маскируется по правам</span></div>
  </div>
  <div class="g2" style="margin-bottom:0">
   <div class="pan"><h3>История отношений</h3>
    <div class="tl">
     <div class="tli ok"><b>${c.since} · первый заём</b><p>Пришёл по рекомендации, залог — недвижимость. Погашен без просрочек.</p></div>
     <div class="tli ok"><b>Повторное обращение</b><p>Документы не запрашивались заново — данные и залог уже были в системе. Решение за один день.</p></div>
     <div class="tli ${c.st==='Просрочка'?'':'on'}"><b>Действующий договор</b><p>${c.st==='Просрочка'?'Вышел в просрочку, работает специалист по взысканию.':'Платит по графику, просрочек нет.'}</p></div>
     <div class="tli"><b>Что дальше</b><p>${c.st==='Просрочка'?'После погашения — пересмотр условий и возможность нового займа.':'За 30 дней до закрытия система поставит задачу предложить новый заём.'}</p></div>
    </div>
   </div>
   <div class="pan"><h3>Всё в одном месте</h3>
    <div class="li"><i>✓</i><span>Заявки и решения, включая отказы с причинами</span></div>
    <div class="li"><i>✓</i><span>Договоры, графики и платёжная дисциплина</span></div>
    <div class="li"><i>✓</i><span>Имущество в залоге с оценками и обременениями</span></div>
    <div class="li"><i>✓</i><span>Переписка WhatsApp и записи звонков</span></div>
    <div class="li"><i>✓</i><span>Документы и подписанные согласия</span></div>
    <div class="btns" style="margin-top:12px">
     <button class="bt p" onclick="closeM();go('portfolio')">Договоры клиента</button>
     <button class="bt" onclick="closeM();go('lk')">Его личный кабинет</button>
    </div>
   </div>
  </div>`);
}

/* ====== ИНФРАСТРУКТУРА ====== */
function renderRoles(){
 const r=document.getElementById('roles');if(!r)return;
 r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')">
  <div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');
 if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');
}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){
 role=ROLES[k]?k:'Директор';
 document.getElementById('gate').classList.add('hidden');
 document.getElementById('app').classList.remove('hidden');
 const s=document.getElementById('rsel');if(s)s.value=role;
 document.getElementById('me').textContent=ROLES[role].av;
 if(!allowed(cur))cur=ROLES[role].s[0];
 build();
 toast(`Вы вошли как «${role}» · ${ROLES[role].n}. Показаны только те разделы, которые нужны этой роли.`);
}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;
 if(!allowed(cur))cur=ROLES[role].s[0];build();
 toast(`Роль: ${role}. Разделов доступно: ${ROLES[role].s.length}. ${ROLES[role].note}.`)}
const ownerOf=k=>SECOF[k];
function buildRail(){
 const on=ownerOf(cur);
 document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>{
  const n=s.sub.filter(x=>allowed(x[0])).length;
  return `<div class="ri ${s.k===on?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')" title="${esc(s.n)}">
   <i>${s.ic}</i><span>${esc(s.n)}</span>${n>1?`<b class="cnt">${n}</b>`:''}</div>`}).join('');
}
function buildSub(){
 const on=ownerOf(cur),s=SEC.find(x=>x.k===on);if(!s)return;
 document.getElementById('sub').innerHTML=`<h4>${esc(s.n)}</h4>`+
  s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')+
  `<div class="shint"><b>${esc(role)}</b><br>${esc(ROLES[role].note)}</div>`;
}
function build(){buildRail();buildSub();render()}
function render(){
 const f=SC[cur]||SC.dash;
 document.getElementById('ttl').textContent=SUBN[cur]||'Пульт';
 document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('inbox')||allowed('funnel')?'':'none';
 try{history.replaceState(null,'','?s='+cur)}catch(e){}
}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права доступа.');return}
 cur=k;build();document.querySelector('.content').scrollTop=0}
function openM(t,s,b){
 document.getElementById('mt').innerHTML=t;
 document.getElementById('ms').innerHTML=s;
 document.getElementById('mbody').innerHTML=b;
 document.getElementById('mbg').classList.add('show');
}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;
function toast(m){const t=document.getElementById('toast');
 t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),5200)}
function sparks(n){for(let i=0;i<n;i++){const s=document.createElement('i');s.className='spark';
 s.style.left=(14+Math.random()*72)+'vw';s.style.background=['#b9761f','#2f8f5b','#2b6cb0','#6b4ea8'][i%4];s.style.borderRadius=i%2?'50%':'2px';
 s.style.animationDelay=(Math.random()*.4)+'s';document.body.appendChild(s);setTimeout(()=>s.remove(),1400)}}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();
 toast(theme==='dark'?'Тёмная тема — для работы вечером и для проектора.':'Светлая тема.')}

/* ====== СЦЕНАРИЙ ПОКАЗА ====== */
const TOUR=[
 ['dash','Пульт директора: портфель, выдачи, качество и скорость. Всё считается само — сводить в конце месяца не нужно.'],
 ['path','Путь заявки — ровно та цепочка, которую вы описали: заявка, согласие, прескоринг, решение, документы.'],
 ['scoring','Прескоринг за минуты: ГБД ФЛ, кредитное бюро, балл и решение. Нажмите «Прогнать всё» — посмотрим вживую.'],
 ['calc','Калькулятор: аннуитет, ГЭСВ и график. Клиент получает точные цифры сразу, а не «перезвоним».'],
 ['funnel','Воронка по этапам — карточки перетаскиваются мышкой, этап меняется вместе с задачами.'],
 ['pledge','Залоги как отдельная сущность: оценка, LTV, обременения. 98% ваших займов — залоговые.'],
 ['overdue','Просрочка по корзинам со сценарием работы на каждой. Первые 30 дней решают почти всё.'],
 ['lk','Личный кабинет клиента: остаток, просрочка, график, оплата. Ровно то, о чём вы просили.'],
 ['c1','Обмен с 1С: 1С остаётся у вас, но никто больше не вводит одно и то же дважды.'],
 ['economy','И стоимость владения — сравнение с коробочной подпиской на вашем горизонте.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;
 document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;
 if(ti>=TOUR.length){stopTour();toast('Сценарий показа закончен. Дальше можно листать разделы вручную — всё кликается.');return}
 const [k,m]=TOUR[ti];
 if(!allowed(k)){step();return}
 cur=k;build();toast(m);
 setTimeout(step,ti===0?5200:6400);
}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}

/* ====== СТАРТ ====== */
(function(){
 renderRoles();applyTheme();
 const s=document.getElementById('rsel');
 if(s)s.addEventListener('change',e=>switchRole(e.target.value));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){
  const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);
  if(r){cur=q;enter(r)}
 }
})();
