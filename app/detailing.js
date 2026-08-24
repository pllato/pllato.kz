/* GTA Detailing · система управления детейлинг-центром — демо. Данные вымышленные, суммы в тенге. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';

const ROLES={
 'Владелец':{n:'Владелец студии',av:'ВЛ',note:'Деньги, загрузка, мастера — вся студия',s:['dash','leads','calc','deals','sched','cars','fin','staff','stock','client','settings']},
 'Администратор':{n:'Администратор',av:'АД',note:'Лента заявок, расчёты, запись на посты',s:['leads','calc','deals','sched','cars','client']},
 'Мастер':{n:'Мастер цеха',av:'МА',note:'Мои наряды, чек-листы, фото до/после',s:['jobs','sched','stock']},
 'Клиент':{n:'Клиент · WhatsApp',av:'КЛ',note:'Как всё выглядит для владельца авто',s:['client']}
};
const NAV=[
 ['ПРОДАЖИ',[['dash','DSH','Пульт студии'],['leads','LDS','Заявки · одна лента',6],['calc','CLC','Калькулятор 30 сек'],['deals','DLS','Сделки · канбан']]],
 ['ЦЕХ',[['sched','CAL','Посты и запись'],['jobs','JOB','Наряды мастеров',2],['cars','CAR','База авто'],['stock','STK','Материалы',1]]],
 ['ДЕНЬГИ',[['fin','FIN','Финансы'],['staff','STF','Мастера и зарплата']]],
 ['СЕРВИС',[['client','WAP','Глазами клиента'],['settings','SET','Настройки']]]
];
const TITLES={
 dash:['Пульт студии','Заявки, загрузка постов, выручка и мастера — на одном экране'],
 leads:['Заявки · одна лента','Instagram, WhatsApp, 2GIS, звонки и сайт — всё в одном месте, ничего не теряется'],
 calc:['Калькулятор · расчёт за 30 секунд','Тип кузова × услуги → сумма → расчёт клиенту в WhatsApp одной кнопкой'],
 deals:['Сделки','От заявки до выдачи авто — весь путь по этапам'],
 sched:['Посты и запись','Пять постов, загрузка и записи — свободное время видно сразу'],
 jobs:['Наряды мастеров','Чек-лист работ, фотофиксация при приёмке, фото до/после'],
 cars:['База авто','Каждое авто с историей: что делали, когда вернётся, что предложить'],
 fin:['Финансы','Выручка по услугам, средний чек, зарплаты мастеров, дебиторка юрлиц'],
 staff:['Мастера и зарплата','Выработка каждого из 7 мастеров, проценты и рейтинг'],
 stock:['Материалы','Плёнка, керамика, химия — остатки и списание по нарядам'],
 client:['Глазами клиента','Вся цепочка в WhatsApp: от заявки до напоминания о повторном визите'],
 settings:['Настройки','Услуги, цены, посты, шаблоны сообщений — меняются без разработчика']
};
let role='Владелец',cur='dash';

/* ===== ДАННЫЕ ===== */
const BODY=[['sedan','Седан',1],['cross','Кроссовер',1.15],['suv','Внедорожник',1.3],['bus','Минивэн / бус',1.45]];
const SVCS=[
 {id:'wash',n:'Комплексная мойка-детейлинг',p:18000,d:'кузов + салон + чернение',h:3},
 {id:'dry',n:'Химчистка салона',p:60000,d:'полная разборка, пар, экстрактор',h:8},
 {id:'pol1',n:'Полировка лёгкая · 1 шаг',p:70000,d:'убирает паутинку и голограммы',h:6},
 {id:'pol2',n:'Полировка глубокая · 3 шага',p:140000,d:'царапины, окисление, до зеркала',h:12},
 {id:'cer',n:'Керамика · 3 слоя',p:220000,d:'Gyeon / CarPro, гарантия 2 года',h:16},
 {id:'ppf',n:'Антигравийная плёнка · зоны риска',p:280000,d:'капот, бампер, зеркала, пороги',h:10},
 {id:'ppfx',n:'Полная оклейка PPF',p:950000,d:'весь кузов, XPEL / Hexis',h:40},
 {id:'tint',n:'Тонировка по кругу',p:55000,d:'плёнка премиум, съёмная — по запросу',h:4},
 {id:'head',n:'Бронирование фар + полировка',p:45000,d:'полиуретан 210 мкм',h:2},
 {id:'ozon',n:'Озонирование · удаление запахов',p:25000,d:'табак, животные, сырость',h:2}
];
const svc=id=>SVCS.find(s=>s.id===id);
const MASTERS=[
 {n:'Даурен',sp:'Полировка · керамика',pct:35,jobs:26,out:2140000,rate:4.9},
 {n:'Ержан',sp:'Керамика · защитные покрытия',pct:35,jobs:22,out:1980000,rate:4.8},
 {n:'Санжар',sp:'Оклейка PPF · винил',pct:38,jobs:11,out:2870000,rate:4.9},
 {n:'Мирас',sp:'Химчистка · салон',pct:32,jobs:31,out:1620000,rate:4.7},
 {n:'Азамат',sp:'Мойка-детейлинг',pct:30,jobs:64,out:1180000,rate:4.8},
 {n:'Данияр',sp:'Тонировка · фары',pct:33,jobs:28,out:1390000,rate:4.6},
 {n:'Олжас',sp:'Универсал · сборка-разборка',pct:30,jobs:35,out:1240000,rate:4.7}
];
let LEADS=[
 {id:1,src:'ig',who:'@aibek_almaty',car:'Lexus LX600 · 2023',txt:'Сколько керамика на LX? И антигравийку на капот думаю',t:'2 мин назад',sla:'ok',state:'Автоответ ушёл · ждёт расчёта',est:500000},
 {id:2,src:'wa2',who:'+7 707 44 12 890 · Мадина',car:'BMW X5 · 2021',txt:'Здравствуйте! Химчистка салона, ребёнок разлил сок, светлая кожа',t:'9 мин назад',sla:'ok',state:'Расчёт отправлен · 68 000 ₸',est:68000},
 {id:3,src:'gis',who:'2GIS · Ерлан',car:'Toyota Camry 75',txt:'Полировка и тонировка, сколько по времени?',t:'26 мин назад',sla:'warn',state:'Ждёт ответа · таймер SLA',est:125000},
 {id:4,src:'call',who:'Звонок · +7 701 55 23 411',car:'—',txt:'Пропущенный звонок в 12:41 — система отправила SMS + WhatsApp «мы заняты, перезвоним»',t:'34 мин назад',sla:'warn',state:'Автосообщение ушло · перезвонить',est:0},
 {id:5,src:'web',who:'Сайт · Алия',car:'Kia Sorento · 2024',txt:'Форма: керамика + бронь фар, спрашивает рассрочку Kaspi',t:'1 ч назад',sla:'fire',state:'Просрочен ответ · эскалация',est:265000},
 {id:6,src:'ig',who:'@timur.kz',car:'Mercedes G63',txt:'Полная оклейка PPF, матовая. Когда можно приехать показать?',t:'1 ч назад',sla:'ok',state:'Записан на осмотр завтра 11:00',est:1100000}
];
let leadSeq=7;
const STAGES=[['new','НОВЫЕ','var(--blue)'],['calc','РАСЧЁТ ОТПРАВЛЕН','var(--cyan)'],['booked','ЗАПИСАН','var(--violet)'],['work','АВТО В РАБОТЕ','var(--acc)'],['done','ГОТОВО К ВЫДАЧЕ','var(--green)']];
let DEALS=[
 {id:1,st:'new',car:'Lexus LX600',who:'Айбек',svc:'Керамика + PPF капот',sum:500000,note:'из Instagram · 2 мин назад',m:null},
 {id:2,st:'new',car:'Mercedes G63',who:'Тимур',svc:'Полная оклейка PPF',sum:1100000,note:'осмотр завтра 11:00',m:'Санжар'},
 {id:3,st:'calc',car:'BMW X5',who:'Мадина',svc:'Химчистка салона',sum:68000,note:'расчёт в WA · ждём ответ',m:null},
 {id:4,st:'calc',car:'Toyota Camry 75',who:'Ерлан',svc:'Полировка + тонировка',sum:125000,note:'вилка отправлена · думает',m:null},
 {id:5,st:'booked',car:'Kia K5',who:'Санжар А.',svc:'Полировка лёгкая',sum:80500,note:'завтра 09:00 · пост 3',m:'Даурен'},
 {id:6,st:'booked',car:'Hyundai Palisade',who:'Гульмира',svc:'Химчистка + озонирование',sum:110000,note:'вт 10:00 · пост 4 · предоплата 30%',m:'Мирас'},
 {id:7,st:'work',car:'Lexus RX350',who:'Арман',svc:'Керамика 3 слоя',sum:253000,note:'2-й слой · готовность завтра 18:00',m:'Даурен'},
 {id:8,st:'work',car:'Porsche Cayenne',who:'Бекзат',svc:'PPF зоны риска',sum:322000,note:'капот оклеен · бампер в работе',m:'Санжар'},
 {id:9,st:'done',car:'Toyota LC300',who:'Нурлан',svc:'Мойка + полировка фар',sum:64000,note:'фотоотчёт отправлен · ждёт клиента',m:'Азамат'}
];
const CARS=[
 {no:'777 AAA 02',car:'Lexus RX350 · 2022',who:'Арман · +7 705 111 22 33',vis:6,sum:812000,note:'Керамика до 08.2028 · ТО покрытия через 5 мес',tag:'vip'},
 {no:'001 KZ 02',car:'Porsche Cayenne · 2023',who:'Бекзат · +7 707 88 44 21',vis:3,sum:1140000,note:'PPF в работе · предложить керамику на стёкла',tag:'vip'},
 {no:'555 BBB 05',car:'Toyota LC300 · 2022',who:'Нурлан · +7 701 33 44 55',vis:9,sum:486000,note:'Ездит на мойку каждые 2 недели · абонемент?',tag:'loyal'},
 {no:'234 QWE 02',car:'BMW X5 · 2021',who:'Мадина · +7 707 44 12 89',vis:1,sum:68000,note:'Новый клиент · после химчистки предложить керамику салона',tag:'new'},
 {no:'718 KAZ 02',car:'Hyundai Palisade · 2024',who:'Гульмира · +7 702 12 98 76',vis:2,sum:190000,note:'Напоминание 12.09: поддерживающая мойка −20%',tag:'loyal'}
];
const STOCK=[
 {n:'Плёнка PPF XPEL Ultimate · рулон 15 м',have:'6,2 м',min:'5 м',st:'warn',use:'Расход по нарядам: списывается метраж на каждый элемент'},
 {n:'Керамика Gyeon MOHS · 50 мл',have:'7 фл.',min:'3 фл.',st:'ok',use:'1 флакон ≈ 1 кузов · списание автоматически из наряда'},
 {n:'Полироль Koch M3.02 · 1 л',have:'4 шт',min:'2 шт',st:'ok',use:'Полировальные пасты по шагам'},
 {n:'Химия для химчистки · комплект',have:'11 л',min:'6 л',st:'ok',use:'Экстрактор + пар'},
 {n:'Тонировочная плёнка Llumar · рулон',have:'2,8 м',min:'6 м',st:'fire',use:'⚠ Ниже минимума — заявка поставщику сформирована'},
 {n:'Круги полировальные · комплект',have:'18 шт',min:'10 шт',st:'ok',use:'Меняются по износу, фиксируется в наряде'}
];
const JOB={car:'Lexus RX350 · 2022 · 777 AAA 02',who:'Арман · +7 705 111 22 33',svc:'Керамика Gyeon 3 слоя + лёгкая полировка',m:'Даурен',due:'завтра 18:00',sum:253000};
let DMG=[{x:24,y:18,t:'Скол на капоте, 3 мм'},{x:78,y:44,t:'Царапина на правой двери, до грунта'},{x:30,y:82,t:'Потёртость заднего бампера'}];
let STEPS=[
 {t:'Приёмка: фото по кругу + фиксация повреждений',done:1,at:'вчера 09:20'},
 {t:'Мойка + глина + обезжиривание',done:1,at:'вчера 12:40'},
 {t:'Лёгкая полировка · 1 шаг',done:1,at:'вчера 18:05'},
 {t:'Керамика · 1-й слой + ИК-сушка',done:1,at:'сегодня 11:30'},
 {t:'Керамика · 2-й слой + ИК-сушка',done:0,at:''},
 {t:'Керамика · 3-й слой + финальная сушка 12 ч',done:0,at:''},
 {t:'Фото «после» + фотоотчёт клиенту',done:0,at:''}
];

/* ===== ЭКРАНЫ ===== */
const SC={};
const srcIcon={ig:'📷',wa2:'💬',gis:'🟢',call:'📞',web:'🌐'};
const srcName={ig:'Instagram',wa2:'WhatsApp',gis:'2GIS',call:'Звонок',web:'Сайт'};

SC.dash=()=>`
 <div class="head"><div><h2>Пульт студии</h2><p>Сегодня, ${new Date().getHours()>17?'вечер':'день'}: система приняла все заявки сама, вы смотрите на итог, а не на переписки. Всё кликабельно — провалитесь в любой раздел.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Сводка дня отправлена вам в WhatsApp — так каждый вечер в 21:00.')">Сводка дня</button><button class="btn acc" onclick="simLead()">⚡ Новая заявка</button></div></div>
 <div class="strip">
  <div><small>ЗАЯВОК СЕГОДНЯ</small><b>34</b><span class="good">все получили ответ · среднее 28 сек</span></div>
  <div><small>ЗАПИСАЛИСЬ</small><b>19</b><span>конверсия 56%</span></div>
  <div><small>ВЫРУЧКА ДНЯ</small><b>1,86 млн ₸</b><span class="good">▲ 22% к прошлой неделе</span></div>
  <div><small>СРЕДНИЙ ЧЕК</small><b>97 800 ₸</b><span>▲ растёт за счёт допродаж</span></div>
  <div><small>ЗАГРУЗКА ПОСТОВ</small><b>84%</b><span>свободно: чт после 15:00</span></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph"><div><div class="ph-title">Воронка сегодняшнего дня</div><div class="ph-sub">от заявки до денег — где теряются клиенты, видно сразу</div></div><span class="tag acc">живые данные</span></div>
   ${[['Заявок пришло',34,'var(--blue)'],['Получили расчёт за 30 сек',31,'var(--cyan)'],['Записались',19,'var(--violet)'],['Приехали / в работе',11,'var(--acc)'],['Выдано + оплачено',8,'var(--green)']]
     .map(r=>`<div class="fr" style="grid-template-columns:170px 1fr 44px"><span>${r[0]}</span><div class="ftrack"><i style="--w:${r[1]/34*100}%;background:${r[2]}"></i></div><b>${r[1]}</b></div>`).join('')}
   <div class="hint"><b>Раньше:</b> вы один разбирали 34 переписки и часть отвечала «уже сделал в другом месте». <b>Теперь:</b> ответ уходит за 30 секунд, а вы подключаетесь только к дорогим сделкам — PPF и керамике.</div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Система сделала сама</div><div class="ph-sub">сегодня, без вашего участия</div></div></div>
   ${[['WA','Ответила на 34 заявки · среднее 28 сек','автоответ + расчёт по прайсу'],
      ['CLC','Отправила 26 расчётов стоимости','по типу кузова, с фото работ'],
      ['CAL','Записала 19 авто на посты','с учётом длительности услуг'],
      ['PHO','Отправила 8 фотоотчётов клиентам','фото до/после + чек'],
      ['REM','Напомнила 12 клиентам о повторном визите','мойка, ТО керамики, сезонная химчистка'],
      ['RVW','Попросила 6 отзывов на 2GIS','после выдачи · 4 уже оставили ★5']]
    .map(a=>`<div style="display:flex;gap:9px;padding:7px 0;border-bottom:1px solid var(--line)"><span class="mono" style="width:36px;height:26px;background:var(--panel2);display:grid;place-items:center;font-size:6.8px;font-weight:700;flex:none;border-radius:7px;color:var(--acc2)">${a[0]}</span><div><b style="font-size:9.6px">${a[1]}</b><p class="mini" style="margin:2px 0 0">${a[2]}</p></div></div>`).join('')}
  </div>
 </div>
 <div class="g3">
  <div class="panel"><div class="ph-title">Выручка по неделям</div>
   <div class="chart" style="height:110px">${[['н1',52,44],['н2',66,58],['н3',74,66],['н4',88,80],['тек',100,74]].map(m=>`<div class="chart-col"><i style="--h:${m[0]==='тек'?100:m[1]}%;--p:${m[2]}%"></i><span>${m[0]}</span></div>`).join('')}</div>
   <div class="kpi-mini"><div style="--tone:var(--acc)"><small>МЕСЯЦ</small><b>38,4 млн ₸</b></div><div style="--tone:var(--green)"><small>ПРОГНОЗ</small><b>41+ млн ₸</b></div></div>
  </div>
  <div class="panel"><div class="ph-title">Что приносит деньги</div>
   ${[['Оклейка PPF',34,'var(--acc)'],['Керамика',26,'var(--amber)'],['Полировка',16,'var(--violet)'],['Химчистка',13,'var(--blue)'],['Мойка и прочее',11,'var(--cyan)']]
     .map(r=>`<div class="fr" style="grid-template-columns:110px 1fr 40px"><span>${r[0]}</span><div class="ftrack" style="height:15px"><i style="--w:${r[1]/34*100}%;background:${r[2]}"></i></div><b>${r[1]}%</b></div>`).join('')}
   <div class="hint" style="margin-top:9px"><b>Инсайт из данных:</b> клиенты мойки, которым предложили полировку в WhatsApp, соглашаются в 23% случаев. Система предлагает сама.</div>
  </div>
  <div class="panel"><div class="ph-title">Мастера сегодня</div>
   ${MASTERS.slice(0,5).map(m=>`<div class="fr" style="grid-template-columns:76px 1fr 70px"><span>${m.n}</span><div class="ftrack" style="height:15px"><i style="--w:${m.out/2870000*100}%"></i></div><b>${fmt(m.out/1000)}К</b></div>`).join('')}
   <div class="mini" style="margin-top:7px">Выработка за месяц · все 7 — в разделе «Мастера»</div>
  </div>
 </div>`;

/* ---- ЗАЯВКИ ---- */
SC.leads=()=>`
 <div class="head"><div><h2>Заявки · одна лента</h2><p>Instagram, WhatsApp, 2GIS, звонки и сайт падают в одно место. Каждая получает автоответ сразу, а таймер SLA не даёт ни одной «протухнуть» — то, что сейчас съедает весь ваш день.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Шаблоны автоответов открыты — тексты свои, меняются без разработчика.')">Автоответы</button><button class="btn acc" onclick="simLead()">⚡ Симулировать заявку</button></div></div>
 <div class="strip">
  <div><small>СЕГОДНЯ</small><b>34</b><span>IG 14 · WA 9 · 2GIS 6 · звонки 3 · сайт 2</span></div>
  <div><small>СРЕДНИЙ ОТВЕТ</small><b class="good">28 сек</b><span>раньше — до 4 часов</span></div>
  <div><small>ЖДУТ ДЕЙСТВИЯ</small><b>${LEADS.filter(l=>l.sla!=='ok').length}</b><span>подсвечены таймером</span></div>
  <div><small>ПРОПУЩЕННЫХ</small><b>0</b><span>звонок без ответа = авто-SMS</span></div>
  <div><small>КОНВЕРСИЯ В ЗАПИСЬ</small><b>56%</b><span>▲ 19 из 34</span></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph"><div><div class="ph-title">Лента · живая</div><div class="ph-sub">новые сверху, просроченные горят красным</div></div><span class="tag wa">все каналы</span></div>
   <div id="leadList">${LEADS.map(leadRow).join('')}</div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Что происходит с заявкой</div>
    ${[['01','Заявка падает в ленту','из любого канала, с текстом и профилем клиента'],
       ['02','Автоответ за секунды','«Здравствуйте! Считаем стоимость, минуту» — клиент не уходит к конкуренту'],
       ['03','Расчёт за 30 секунд','администратор жмёт калькулятор: кузов + услуги → сумма → в WhatsApp'],
       ['04','Запись на пост','система видит свободные окна и длительность услуг'],
       ['05','Не записался — дожим','через 4 часа и через 2 дня система вежливо напомнит сама']]
     .map(x=>`<div style="display:grid;grid-template-columns:26px 1fr;gap:10px;padding:7px 0;border-bottom:1px solid var(--line)"><span class="mono" style="color:var(--acc2);font-size:8.4px;font-weight:700">${x[0]}</span><div><b style="font-size:10px">${x[1]}</b><p class="mini" style="margin:3px 0 0">${x[2]}</p></div></div>`).join('')}
   </div>
   <div class="panel" style="margin-top:10px"><div class="ph-title">Откуда приходят</div>
    ${[['Instagram',41,'#c13584'],['WhatsApp',26,'var(--wa)'],['2GIS',18,'#2f9e44'],['Звонки',9,'var(--blue)'],['Сайт',6,'var(--violet)']]
      .map(r=>`<div class="fr" style="grid-template-columns:92px 1fr 40px"><span>${r[0]}</span><div class="ftrack" style="height:15px"><i style="--w:${r[1]/41*100}%;background:${r[2]}"></i></div><b>${r[1]}%</b></div>`).join('')}
    <div class="hint" style="margin-top:9px"><b>Источник виден в каждой сделке</b> — вы наконец узнаете, какая реклама приводит деньги, а какая просто лайки.</div>
   </div>
  </div>
 </div>`;
function leadRow(l){return `<div class="lead ${l.fresh?'fresh':''}" onclick="openLead(${l.id})">
 <div class="src ${l.src}">${srcIcon[l.src]}</div>
 <div><b>${esc(l.who)}</b> <span class="tag" style="margin-left:4px">${srcName[l.src]}</span>${l.car!=='—'?` <span class="tag blue">${esc(l.car)}</span>`:''}
  <div class="lt">${esc(l.txt)}</div>
  <div class="lt" style="color:var(--acc2);font-weight:700">${esc(l.state)}</div></div>
 <div style="text-align:right"><span class="sla ${l.sla}">${l.sla==='ok'?'SLA OK':l.sla==='warn'?'⏱ '+l.t:'⚠ ПРОСРОЧЕН'}</span><div class="sub mono">${l.t}</div></div>
</div>`}
function openLead(id){const l=LEADS.find(x=>x.id===id);if(!l)return;
 openD(l.who,`${srcName[l.src]} · ${l.car} · ${l.t}`,['Заявка'],
 `<div class="wa-msg">${esc(l.txt)}<time>${l.t}</time></div>
  <div class="wa-msg out">Здравствуйте! Спасибо за обращение в GTA Detailing 🏁 Уже считаем стоимость для вашего авто — ответим в течение пары минут.<time>автоответ · через 6 сек</time></div>
  ${l.est?`<div class="note" style="--tone:var(--acc)"><b>Черновик расчёта готов</b><p>Система прикинула по прайсу: ~${tg(l.est)}. Проверьте состав в калькуляторе и отправьте одной кнопкой.</p></div>`:''}
  <div class="btns" style="margin-top:12px">
   <button class="btn acc" onclick="closeD();go('calc')">⚡ Открыть калькулятор</button>
   <button class="btn wa" onclick="closeD();toast('Расчёт отправлен клиенту в WhatsApp — сделка перешла на этап «Расчёт отправлен».')">Отправить расчёт в WA</button>
   <button class="btn" onclick="closeD();toast('Клиент записан — выберите окно в «Посты и запись».')">Записать</button>
  </div>`)}
function simLead(){const l={id:leadSeq++,src:'ig',who:'@zhanna_a05',car:'Toyota RAV4 · 2023',txt:'Добрый день! Сколько будет керамика и химчистка? Машина новая, хочу сразу защитить',t:'только что',sla:'ok',state:'Автоответ ушёл за 6 сек · черновик расчёта готов: 297 000 ₸',est:297000,fresh:1};
 LEADS.unshift(l);
 const nb=NAV[0][1].find(x=>x[0]==='leads');if(nb)nb[3]=(nb[3]||0)+1;
 if(cur!=='leads'&&ROLES[role].s.includes('leads'))go('leads');else render();
 buildNav();document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('on',x.dataset.go===cur));
 sparks();
 toast('⚡ <b>Новая заявка из Instagram</b> упала в ленту. Автоответ уже ушёл (6 сек), черновик расчёта готов — осталось нажать «Отправить». Вы бы отвечали на неё вечером — система ответила сразу.');
 setTimeout(()=>{delete l.fresh},2500)}

/* ---- КАЛЬКУЛЯТОР ---- */
let C={body:'cross',svcs:['cer','head']};
SC.calc=()=>{const k=BODY.find(b=>b[0]===C.body)[2];
 const rows=C.svcs.map(id=>({s:svc(id),sum:Math.round(svc(id).p*k/500)*500}));
 const total=rows.reduce((a,r)=>a+r.sum,0);
 const hours=rows.reduce((a,r)=>a+r.s.h,0);
 return `<div class="head"><div><h2>Калькулятор · 30 секунд</h2><p>Тип кузова умножает базовый прайс. Отметили услуги — сумма и срок готовы, кнопка отправляет красивый расчёт клиенту в WhatsApp. Никаких «я вам позже посчитаю».</p></div></div>
 <div class="g12">
  <div class="panel">
   <div class="ph-title" style="margin-bottom:8px">Тип кузова</div>
   <div class="seg">${BODY.map(b=>`<button class="${C.body===b[0]?'on':''}" onclick="calcBody('${b[0]}')">${b[1]}${b[2]>1?' ×'+b[2]:''}</button>`).join('')}</div>
   <div class="ph-title" style="margin:14px 0 8px">Услуги</div>
   ${SVCS.map(s=>`<div class="svc ${C.svcs.includes(s.id)?'on':''}" onclick="calcSvc('${s.id}')"><i>${C.svcs.includes(s.id)?'✓':''}</i><div><b>${s.n}</b><div class="sub">${s.d}</div></div><span class="pr">${tg(Math.round(s.p*k/500)*500)}</span></div>`).join('')}
  </div>
  <div>
   <div class="panel"><div class="ph"><div><div class="ph-title">Расчёт для клиента</div><div class="ph-sub">${BODY.find(b=>b[0]===C.body)[1]} · так это увидит клиент в WhatsApp</div></div></div>
    ${rows.length?`<div class="tw"><table class="data" style="min-width:0"><tbody>
    ${rows.map(r=>`<tr style="cursor:default"><td><b>${r.s.n}</b><div class="sub">${r.s.d}</div></td><td class="right mono"><b>${tg(r.sum)}</b></td></tr>`).join('')}
    </tbody></table></div>`:'<p class="mini">Отметьте услуги слева — сумма посчитается сама.</p>'}
    <div class="total" style="margin-top:11px"><div><small>ИТОГО · СРОК ~${Math.ceil(hours/8)} РАБ. ${Math.ceil(hours/8)===1?'ДЕНЬ':'ДНЯ(-ЕЙ)'}</small><b>${tg(total)}</b></div>
     <div class="btns"><button class="btn wa" onclick="sendCalc(${total})">📤 Отправить в WhatsApp</button><button class="btn" onclick="toast('Ссылка на оплату Kaspi сформирована — предоплата 30% бронирует окно.')">Kaspi-ссылка 30%</button></div></div>
    <div class="hint"><b>В сообщение подставятся</b> фото ваших работ по этим услугам, срок, гарантия и кнопка «Записаться». Цены и коэффициенты кузова меняются в настройках.</div>
   </div>
   <div class="panel" style="margin-top:10px"><div class="ph-title">Почему это продаёт</div>
    ${[['Скорость','Расчёт приходит, пока клиент ещё «тёплый» — конверсия в запись 56% против ~20% при ответе через час'],
       ['Допродажи','К мойке система предлагает полировку фар, к керамике — бронь зон риска: +18% к среднему чеку'],
       ['Предоплата','Kaspi-ссылка на 30% бронирует окно — «записался и пропал» уходит в прошлое']]
     .map(x=>`<div class="note" style="--tone:var(--acc)"><b>${x[0]}</b><p>${x[1]}</p></div>`).join('')}
   </div>
  </div>
 </div>`};
function calcBody(b){C.body=b;keepScroll()}
function calcSvc(id){C.svcs.includes(id)?C.svcs=C.svcs.filter(x=>x!==id):C.svcs.push(id);keepScroll()}
function keepScroll(){const el=document.getElementById('content');const s=el.scrollTop;render();el.scrollTop=s}
function sendCalc(t){sparks();toast(`📤 Расчёт на <b>${tg(t)}</b> отправлен клиенту в WhatsApp: состав работ, фото ваших кейсов, срок и кнопка «Записаться». Сделка создана на этапе «Расчёт отправлен».`)}

/* ---- КАНБАН ---- */
SC.deals=()=>`
 <div class="head"><div><h2>Сделки</h2><p>Каждая заявка становится карточкой и двигается по этапам до выдачи авто. Ничего не живёт «в голове» и не теряется в переписках.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Фильтр: только дорогие сделки — PPF и керамика от 200 000 ₸.')">Только крупные</button><button class="btn acc" onclick="simLead()">⚡ Новая заявка</button></div></div>
 <div class="kwrap">
 ${STAGES.map(([st,name,tone])=>{const cards=DEALS.filter(d=>d.st===st);
  return `<div class="kcol"><h4>${name}<span>${cards.length} · ${fmt(cards.reduce((a,c)=>a+c.sum,0)/1000)}К</span></h4>
  ${cards.map(d=>`<div class="kcard" style="--tone:${tone}" onclick="openDeal(${d.id})">
   <b>${esc(d.car)}</b><div class="sub">${esc(d.who)} · ${esc(d.svc)}</div>
   <div class="sub" style="color:var(--muted2)">${esc(d.note)}</div>
   <div class="kfoot"><span class="kmoney">${tg(d.sum)}</span>${d.m?`<span class="tag">${d.m}</span>`:'<span class="tag amber">без мастера</span>'}</div>
  </div>`).join('')||'<p class="mini" style="padding:8px 4px">Пусто</p>'}</div>`}).join('')}
 </div>
 <div class="hint"><b>Этап меняется сам:</b> отправили расчёт — карточка переехала, клиент оплатил бронь — переехала, мастер закрыл чек-лист — «Готово к выдаче» и клиенту ушло сообщение. Руками двигать не надо, но можно.</div>`;
function openDeal(id){const d=DEALS.find(x=>x.id===id);if(!d)return;
 const idx=STAGES.findIndex(s=>s[0]===d.st);
 openD(d.car,`${d.who} · ${d.svc} · ${tg(d.sum)}`,['Сделка'],
 `<div class="dg">
  <div class="det"><small>ЭТАП</small><b>${STAGES[idx][1]}</b></div>
  <div class="det"><small>СУММА</small><b>${tg(d.sum)}</b></div>
  <div class="det"><small>МАСТЕР</small><b>${d.m||'—'}</b></div>
  <div class="det"><small>ЗАМЕТКА</small><b>${esc(d.note)}</b></div>
 </div>
 <div class="ph-title" style="margin:6px 0 8px">История</div>
 <div class="tl">
  <div class="tli"><b>Заявка из ${d.id%2?'Instagram':'WhatsApp'}</b><p>Автоответ ушёл за несколько секунд</p><time>этап 1</time></div>
  ${idx>=1?'<div class="tli"><b>Расчёт отправлен в WhatsApp</b><p>Состав работ, фото кейсов, срок и кнопка записи</p><time>этап 2</time></div>':''}
  ${idx>=2?'<div class="tli"><b>Записан на пост · предоплата Kaspi</b><p>Окно забронировано, напоминание за день придёт само</p><time>этап 3</time></div>':''}
  ${idx>=3?'<div class="tli"><b>Авто принято · фотофиксация</b><p>Фото по кругу + отметки повреждений — клиент подтвердил в WhatsApp</p><time>этап 4</time></div>':''}
  ${idx>=4?'<div class="tli"><b>Работы завершены · фотоотчёт отправлен</b><p>Клиенту ушли фото до/после и счёт</p><time>этап 5</time></div>':''}
 </div>
 <div class="btns" style="margin-top:12px">
  ${idx<4?`<button class="btn acc" onclick="dealNext(${d.id})">→ Следующий этап</button>`:`<button class="btn acc" onclick="closeD();sparks();toast('Авто выдано! Клиенту ушла просьба об отзыве на 2GIS, через 2 недели — напоминание о поддерживающей мойке.')">✓ Выдать авто</button>`}
  <button class="btn wa" onclick="toast('Открыт чат WhatsApp с клиентом — вся переписка в карточке сделки.')">Чат с клиентом</button>
  <button class="btn" onclick="closeD()">Закрыть</button>
 </div>`)}
function dealNext(id){const d=DEALS.find(x=>x.id===id);const i=STAGES.findIndex(s=>s[0]===d.st);
 if(i<STAGES.length-1){d.st=STAGES[i+1][0];closeD();render();toast(`<b>${esc(d.car)}</b> → этап «${STAGES[i+1][1]}». Клиенту автоматически ушло сообщение о статусе.`)}}

/* ---- ПОСТЫ ---- */
const POSTS=['Пост 1 · мойка','Пост 2 · химчистка','Пост 3 · полировка','Пост 4 · керамика','Пост 5 · оклейка'];
SC.sched=()=>{
 const bookings={
  '0-0':['Toyota LC300 · мойка','var(--cyan)',1],'0-2':['Kia Rio · мойка','var(--cyan)',1],'0-3':['Camry 70 · мойка','var(--cyan)',1],
  '1-0':['Palisade · химчистка','var(--blue)',2],'1-3':['BMW X5 · химчистка','var(--blue)',2],
  '2-1':['Kia K5 · полировка','var(--violet)',2],'2-3':['Camry 75 · полировка','var(--violet)',2],
  '3-0':['Lexus RX350 · керамика · 2/3 слоя','var(--acc)',5],
  '4-0':['Porsche Cayenne · PPF','var(--amber)',3],'4-3':['G63 · осмотр 11:00','var(--amber)',1]};
 const days=['ПН 25','ВТ 26','СР 27','ЧТ 28','ПТ 29'];
 return `<div class="head"><div><h2>Посты и запись</h2><p>Пять постов, у каждой услуги — своя длительность: мойка 3 часа, керамика двое суток. Система не даст записать два авто в одно окно и сама видит, куда ставить следующего клиента.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Напоминания за день до визита уходят клиентам сами — неявки упали с 25% до 6%.')">Напоминания</button><button class="btn acc" onclick="toast('Свободные окна: чт после 15:00 — пост 3 и 5, пт — пост 2. Система предложила их двум клиентам из очереди дожима.')">Свободные окна</button></div></div>
 <div class="strip">
  <div><small>ЗАГРУЗКА НЕДЕЛИ</small><b>84%</b><span>цель 85–90%</span></div>
  <div><small>ЗАПИСЕЙ</small><b>27</b><span>на неделю вперёд</span></div>
  <div><small>НЕЯВКИ</small><b class="good">6%</b><span>было 25% до напоминаний</span></div>
  <div><small>ПРОСТОЙ</small><b>чт 15:00+</b><span>система дожимает очередь</span></div>
  <div><small>ДЛИННЫЕ РАБОТЫ</small><b>2</b><span>керамика · PPF (2–5 дней)</span></div>
 </div>
 <div class="panel"><div class="tw"><div class="cal">
  <div></div>${days.map(d=>`<div class="ch">${d}</div>`).join('')}
  ${POSTS.map((p,pi)=>`<div class="ct">${p.split(' · ')[0]}<div class="sub" style="text-align:right">${p.split(' · ')[1]}</div></div>`+
   days.map((_,di)=>{const b=bookings[pi+'-'+di];
    return b?`<div class="book" style="--tone:${b[1]}" onclick="toast('${esc(b[0])} — карточка сделки откроется по клику, мастер и статус внутри.')"><b>${b[0].split(' · ')[0]}</b>${b[0].split(' · ').slice(1).join(' · ')}</div>`
     :`<div class="slot" onclick="toast('Свободное окно: сюда система предложит запись следующему клиенту из ленты.')"></div>`}).join('')).join('')}
 </div></div>
 <div class="hint"><b>Керамика на посту 4 занимает всю неделю?</b> Нет — система знает, что между слоями авто сохнет, и в «окна сушки» ставит на пост короткие работы. Загрузка растёт без хаоса.</div></div>`};

/* ---- НАРЯДЫ ---- */
SC.jobs=()=>{
 const doneN=STEPS.filter(s=>s.done).length;
 return `<div class="head"><div><h2>Наряд мастера · Даурен</h2><p>Мастер видит своё задание, отмечает этапы, фотографирует до/после. Приёмка с фотофиксацией повреждений — ваша защита от «это вы мне поцарапали».</p></div>
 <div class="btns"><button class="btn" onclick="toast('Все наряды: у Даурена сегодня 2 — Lexus RX350 (керамика) и Kia K5 завтра.')">Мои наряды · 2</button></div></div>
 <div class="strip">
  <div><small>АВТО</small><b style="font-size:15px">${JOB.car}</b><span>${JOB.who}</span></div>
  <div><small>РАБОТА</small><b style="font-size:13px">Керамика 3 слоя</b><span>+ лёгкая полировка</span></div>
  <div><small>ГОТОВНОСТЬ</small><b style="font-size:15px">${JOB.due}</b><span>клиент предупреждён</span></div>
  <div><small>СУММА НАРЯДА</small><b style="font-size:15px">${tg(JOB.sum)}</b><span>ваши 35% · ${tg(JOB.sum*.35)}</span></div>
  <div><small>ПРОГРЕСС</small><b style="font-size:15px">${doneN}/${STEPS.length}</b><span>этапов закрыто</span></div>
 </div>
 <div class="g3">
  <div class="panel"><div class="ph"><div><div class="ph-title">Приёмка · повреждения</div><div class="ph-sub">кликните по схеме — добавьте отметку</div></div><span class="tag red">${DMG.length} отмечено</span></div>
   <div class="carmap" id="carmap" onclick="dmgAdd(event)">
    <svg viewBox="0 0 200 400">
     <rect x="12" y="60" width="18" height="52" rx="7" fill="#0a0c0f" stroke="#2c3a4e"/>
     <rect x="170" y="60" width="18" height="52" rx="7" fill="#0a0c0f" stroke="#2c3a4e"/>
     <rect x="12" y="286" width="18" height="52" rx="7" fill="#0a0c0f" stroke="#2c3a4e"/>
     <rect x="170" y="286" width="18" height="52" rx="7" fill="#0a0c0f" stroke="#2c3a4e"/>
     <rect x="28" y="14" width="144" height="372" rx="46" fill="#171d27" stroke="#3a4c66" stroke-width="1.6"/>
     <path d="M52 118 Q100 96 148 118 L142 156 Q100 142 58 156 Z" fill="#0e1116" stroke="#2c3a4e"/>
     <path d="M56 300 Q100 316 144 300 L148 336 Q100 356 52 336 Z" fill="#0e1116" stroke="#2c3a4e"/>
     <rect x="40" y="168" width="22" height="52" rx="8" fill="#0e1116" stroke="#2c3a4e"/>
     <rect x="138" y="168" width="22" height="52" rx="8" fill="#0e1116" stroke="#2c3a4e"/>
     <rect x="40" y="232" width="22" height="48" rx="8" fill="#0e1116" stroke="#2c3a4e"/>
     <rect x="138" y="232" width="22" height="48" rx="8" fill="#0e1116" stroke="#2c3a4e"/>
     <line x1="70" y1="228" x2="130" y2="228" stroke="#2c3a4e" stroke-dasharray="4 4"/>
    </svg>
    ${DMG.map((d,i)=>`<span class="dmg ${d.n?'new':''}" style="left:${d.x}%;top:${d.y}%" onclick="event.stopPropagation();toast('📍 ${esc(d.t)} — фото прикреплено, клиент подтвердил в WhatsApp при приёмке.')">${i+1}</span>`).join('')}
   </div>
   <div class="mini" style="margin-top:8px">${DMG.map((d,i)=>`<div style="padding:3px 0"><b class="mono" style="color:#f87171">${i+1}</b> · ${esc(d.t)}</div>`).join('')}</div>
   <div class="hint"><b>Клиент подтверждает схему в WhatsApp</b> до начала работ. Спор «была царапина или нет» закрыт навсегда.</div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Чек-лист работ</div><div class="ph-sub">этап закрыт — клиент видит статус</div></div></div>
   <div class="bar" style="margin-bottom:10px"><i style="--w:${doneN/STEPS.length*100}%;--tone:var(--green)"></i></div>
   ${STEPS.map((s,i)=>`<div class="chk ${s.done?'done':''}" onclick="stepToggle(${i})"><i>${s.done?'✓':''}</i><span>${s.t}</span><time>${s.at}</time></div>`).join('')}
   <div class="note" style="--tone:var(--amber)"><b>Материалы спишутся сами</b><p>Закрыли этап «1-й слой» — минус 1 флакон Gyeon со склада, в наряде зафиксировано.</p></div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Фото до / после</div><div class="ph-sub">снимает мастер с телефона · улетает клиенту</div></div></div>
   <div class="shots">
    ${[['📸','ДО · капот',  'linear-gradient(135deg,#2c3a4e,#171d27)'],['📸','ДО · правый борт','linear-gradient(135deg,#31405a,#171d27)'],['✨','ПОСЛЕ · 1-й слой','linear-gradient(135deg,#ff7a1a44,#171d27)'],['✨','ПОСЛЕ · блик','linear-gradient(135deg,#ffa05544,#12161d)'],['📸','ДО · салон','linear-gradient(135deg,#2c3a4e,#12161d)'],['✨','ПОСЛЕ · диски','linear-gradient(135deg,#22d3ee33,#171d27)'],['📷','+ добавить','var(--bg2)'],['🎬','видео-обход','var(--bg2)']]
     .map(s=>`<div class="shot" style="background:${s[2]}" onclick="toast('${s[1]==='+ добавить'?'Камера открыта — фото привяжется к наряду и этапу.':'Фото «'+s[1]+'» — хранится в карточке авто навсегда.'}')">${s[0]}<small>${s[1]}</small></div>`).join('')}
   </div>
   <div class="btns" style="margin-top:11px">
    <button class="btn wa" onclick="sparks();toast('📤 Фотоотчёт отправлен Арману в WhatsApp: 6 фото, статус «2-й слой нанесён», готовность завтра 18:00. Клиент спокоен — и не звонит вам каждый час.')">📤 Фотоотчёт клиенту</button>
    <button class="btn" onclick="toast('Отчёт «до/после» собран в красивую карточку для Instagram студии — контент делается сам.')">→ Пост в Instagram</button>
   </div>
   <div class="hint"><b>Побочный эффект:</b> каждая работа — готовый контент для вашего Instagram, который приводит новые заявки.</div>
  </div>
 </div>`};
function stepToggle(i){STEPS[i].done=STEPS[i].done?0:1;STEPS[i].at=STEPS[i].done?'сейчас':'';keepScroll();
 const left=STEPS.filter(s=>!s.done).length;
 if(!left){sparks();toast('✅ Все этапы закрыты! Сделка перешла в «Готово к выдаче», клиенту ушло сообщение с фотоотчётом и суммой.')}
 else if(STEPS[i].done)toast(`Этап закрыт. Клиент видит прогресс: осталось ${left}.`)}
function dmgAdd(e){const r=document.getElementById('carmap').getBoundingClientRect();
 const x=Math.round((e.clientX-r.left)/r.width*100),y=Math.round((e.clientY-r.top)/r.height*100);
 if(x<6||x>94||y<3||y>97)return;
 DMG.push({x,y,t:'Новая отметка · фото прикрепите с телефона',n:1});keepScroll();
 toast('📍 Отметка добавлена. На планшете мастер сразу прикрепляет фото зоны — и клиенту уходит схема на подтверждение.')}

/* ---- БАЗА АВТО ---- */
SC.cars=()=>`
 <div class="head"><div><h2>База авто</h2><p>Карточка на каждое авто: что делали, какими материалами, когда пора вернуться. Повторные визиты — самые дешёвые деньги студии, и система добывает их сама.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Экспорт базы в Excel.')">Экспорт</button><button class="btn acc" onclick="toast('Сегодня система отправила 12 напоминаний: 5 — поддерживающая мойка, 4 — ТО керамики, 3 — сезонная химчистка. Записались уже трое.')">Напоминания · 12</button></div></div>
 <div class="strip">
  <div><small>АВТО В БАЗЕ</small><b>1 240</b><span>с историей работ</span></div>
  <div><small>ВЕРНУЛИСЬ ЗА МЕСЯЦ</small><b class="good">168</b><span>по напоминаниям — 74</span></div>
  <div><small>НА ГАРАНТИИ</small><b>86</b><span>керамика · PPF</span></div>
  <div><small>VIP</small><b>34</b><span>чек от 500 000 ₸</span></div>
  <div><small>ДОЛЯ ПОВТОРНЫХ</small><b>41%</b><span>▲ было 24% без системы</span></div>
 </div>
 <div class="panel"><div class="tw"><table class="data" style="min-width:760px"><thead><tr><th>Госномер</th><th>Авто · владелец</th><th class="right">Визитов</th><th class="right">Потрачено</th><th>Система предлагает</th><th></th></tr></thead><tbody>
 ${CARS.map(c=>`<tr onclick="toast('Карточка ${esc(c.no)}: вся история работ, фото, материалы, гарантии — открывается по клику или по госномеру с камеры на воротах.')">
  <td class="mono"><b>${c.no}</b></td><td><b>${esc(c.car)}</b><div class="sub">${esc(c.who)}</div></td>
  <td class="right mono">${c.vis}</td><td class="right mono"><b>${tg(c.sum)}</b></td>
  <td class="mini">${esc(c.note)}</td>
  <td>${c.tag==='vip'?'<span class="tag amber">VIP</span>':c.tag==='loyal'?'<span class="tag green">постоянный</span>':'<span class="tag blue">новый</span>'}</td></tr>`).join('')}
 </tbody></table></div>
 <div class="hint"><b>Камера на воротах читает госномер</b> — карточка авто открывается сама ещё до того, как клиент вышел из машины. Администратор здоровается по имени. Это и есть «вау» для клиента.</div></div>`;

/* ---- ФИНАНСЫ ---- */
SC.fin=()=>`
 <div class="head"><div><h2>Финансы</h2><p>Деньги считаются сами из сделок и нарядов: выручка, средний чек, зарплаты процентом, должники. Вечером — сводка в WhatsApp владельцу.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Выгрузка в Excel / 1С.')">Экспорт</button></div></div>
 <div class="strip">
  <div><small>ВЫРУЧКА МЕСЯЦА</small><b>38,4 млн ₸</b><span class="good">▲ 22% к прошлому</span></div>
  <div><small>СРЕДНИЙ ЧЕК</small><b>97 800 ₸</b><span>▲ 18% за счёт допродаж</span></div>
  <div><small>ЗАРПЛАТЫ МАСТЕРОВ</small><b>4,2 млн ₸</b><span>считаются сами · 30–38%</span></div>
  <div><small>ДЕБИТОРКА ЮРЛИЦ</small><b class="warn">1,86 млн ₸</b><span>3 компании</span></div>
  <div><small>ПРЕДОПЛАТ KASPI</small><b>2,4 млн ₸</b><span>брони будущих недель</span></div>
 </div>
 <div class="g2">
  <div class="panel"><div class="ph-title">Выручка по услугам · месяц</div>
   ${[['Оклейка PPF',13100000,'var(--acc)'],['Керамика',10000000,'var(--amber)'],['Полировка',6100000,'var(--violet)'],['Химчистка',5000000,'var(--blue)'],['Мойка-детейлинг',2700000,'var(--cyan)'],['Тонировка · фары',1500000,'#8b9cb8']]
     .map(r=>`<div class="fr" style="grid-template-columns:132px 1fr 84px"><span>${r[0]}</span><div class="ftrack"><i style="--w:${r[1]/13100000*100}%;background:${r[2]}"></i></div><b>${fmt(r[1]/1000000*10)/10} млн</b></div>`).join('')}
   <div class="hint"><b>Видно, что растить:</b> PPF даёт треть денег при 11% заявок — система приоритизирует такие лиды и подсвечивает их вам лично.</div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Дебиторка юрлиц</div><div class="ph-sub">автопарки и салоны — обслуживаем по договору, платят по счёту</div></div><span class="tag amber">3 должника</span></div>
   ${[['Автопарк «Премиум Такси»','12 моек + 2 химчистки · август',680000,'счёт от 05.08 · напоминание ушло'],
      ['Автосалон «Мотор-Сити»','предпродажная подготовка · 6 авто',940000,'оплата по графику · 28.08'],
      ['СТО «Гараж 55»','полировка после кузовного · 3 авто',240000,'⚠ просрочка 6 дней — эскалация']]
    .map(d=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--line)"><div><b style="font-size:10.4px">${d[0]}</b><div class="sub">${d[1]}</div><div class="sub" style="color:var(--muted2)">${d[3]}</div></div><b class="mono" style="font-size:11px;white-space:nowrap">${tg(d[2])}</b></div>`).join('')}
   <div class="note" style="--tone:var(--acc)"><b>Юрлица — отдельный контур</b><p>Договор, счета, акты, взаиморасчёты — система напоминает должникам сама, вежливо и вовремя.</p></div>
  </div>
 </div>`;

/* ---- МАСТЕРА ---- */
SC.staff=()=>`
 <div class="head"><div><h2>Мастера и зарплата</h2><p>Семь мастеров, у каждого — специализация, процент и выработка. Зарплата считается из закрытых нарядов сама: ни тетрадок, ни споров в конце месяца.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Расчётные листы за август сформированы по каждому мастеру.')">Расчётные листы</button></div></div>
 <div class="strip">
  <div><small>МАСТЕРОВ</small><b>7</b><span>+ администратор</span></div>
  <div><small>ВЫРАБОТКА МЕСЯЦА</small><b>12,4 млн ₸</b><span>закрытые наряды</span></div>
  <div><small>ФОНД ЗАРПЛАТЫ</small><b>4,2 млн ₸</b><span>30–38% от нарядов</span></div>
  <div><small>СРЕДНИЙ РЕЙТИНГ</small><b class="good">4,8 ★</b><span>из отзывов клиентов</span></div>
  <div><small>ПРОСТОИ</small><b>−41%</b><span>после умной записи</span></div>
 </div>
 <div class="panel"><div class="tw"><table class="data" style="min-width:720px"><thead><tr><th>Мастер</th><th>Специализация</th><th class="right">Нарядов</th><th class="right">Выработка</th><th class="right">%</th><th class="right">Зарплата</th><th class="right">Рейтинг</th></tr></thead><tbody>
 ${MASTERS.map(m=>`<tr onclick="toast('${m.n}: наряды, фото работ, отзывы клиентов и динамика по месяцам — в карточке мастера.')">
  <td><b>${m.n}</b></td><td class="mini">${m.sp}</td><td class="right mono">${m.jobs}</td>
  <td class="right mono"><b>${tg(m.out)}</b></td><td class="right mono">${m.pct}%</td>
  <td class="right mono good"><b>${tg(m.out*m.pct/100)}</b></td>
  <td class="right mono">${m.rate} ★</td></tr>`).join('')}
 </tbody></table></div>
 <div class="hint"><b>Рейтинг из реальных отзывов:</b> после выдачи клиент оценивает работу в WhatsApp одним нажатием. Оценка привязывается к мастеру — премии считаются честно.</div></div>`;

/* ---- МАТЕРИАЛЫ ---- */
SC.stock=()=>`
 <div class="head"><div><h2>Материалы</h2><p>Плёнка метражом, керамика флаконами, химия литрами. Списание идёт из нарядов, минимумы под контролем — «плёнка кончилась, а завтра оклейка» больше не случится.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Приход оформлен: накладная, цены, партия — себестоимость работ считается точно.')">+ Приход</button><button class="btn acc" onclick="toast('Заявка поставщику на тонировочную плёнку сформирована автоматически — остаток ниже минимума.')">Заявка поставщику · 1</button></div></div>
 <div class="strip">
  <div><small>ПОЗИЦИЙ НА СКЛАДЕ</small><b>48</b><span>материалы и расходники</span></div>
  <div><small>НИЖЕ МИНИМУМА</small><b class="bad">1</b><span>тонировочная плёнка</span></div>
  <div><small>СЕБЕСТОИМОСТЬ РАБОТ</small><b>14%</b><span>от выручки · норма</span></div>
  <div><small>СПИСАНО ЗА МЕСЯЦ</small><b>5,4 млн ₸</b><span>по нарядам, не «на глаз»</span></div>
  <div><small>ИНВЕНТАРИЗАЦИЯ</small><b>12 мин</b><span>вместо субботы</span></div>
 </div>
 <div class="panel">
  ${STOCK.map(s=>`<div style="display:grid;grid-template-columns:1fr auto auto;gap:12px;align-items:center;padding:10px 4px;border-bottom:1px solid var(--line)">
   <div><b style="font-size:10.6px">${s.n}</b><div class="sub">${s.use}</div></div>
   <div style="text-align:right"><small class="mono" style="color:var(--muted2);font-size:7.4px">ОСТАТОК / МИН</small><div class="mono" style="font-size:11px"><b class="${s.st==='fire'?'bad':s.st==='warn'?'warn':''}">${s.have}</b> / ${s.min}</div></div>
   ${s.st==='fire'?'<span class="tag red">заказать</span>':s.st==='warn'?'<span class="tag amber">заканчивается</span>':'<span class="tag green">в норме</span>'}
  </div>`).join('')}
 <div class="hint"><b>Плёнка — по метрам на элемент:</b> капот LX — 2,1 м, бампер — 1,6 м. Наряд закрыт → метраж списан → себестоимость сделки точная, а не «примерно».</div></div>`;

/* ---- ГЛАЗАМИ КЛИЕНТА ---- */
SC.client=()=>`
 <div class="head"><div><h2>Глазами клиента</h2><p>Вся цепочка, которую клиент получает в WhatsApp — от первого сообщения до напоминания через полгода. Ощущение премиум-сервиса, которое отличает вас от гаражей.</p></div></div>
 <div class="g2">
  <div class="panel"><div class="ph-title">День заказа</div>
   <div style="background:#0b1220;border:1px solid var(--line2);border-radius:14px;padding:13px">
    <div class="mini" style="text-align:center;margin-bottom:9px">WhatsApp · GTA Detailing</div>
    <div class="wa-msg out">Здравствуйте! Сколько керамика на RX350?<time>10:02</time></div>
    <div class="wa-msg">Здравствуйте, Арман! 🏁 Считаем стоимость для вашего кроссовера — минуту.<time>10:02 · автоответ за 6 сек</time></div>
    <div class="wa-msg">Готово! <b>Керамика Gyeon 3 слоя + лёгкая полировка — 253 000 ₸</b>, 2 дня. Гарантия на покрытие 2 года. Фото наших работ: [7 фото]<div class="wa-btn" onclick="toast('Клик клиента: свободные окна показаны, запись в 2 касания.')">Записаться</div><div class="wa-btn" onclick="toast('Клик: предоплата 30% через Kaspi бронирует окно.')">Kaspi · бронь 30%</div><time>10:03</time></div>
    <div class="wa-msg out">Записался на завтра 👍<time>10:07</time></div>
   </div>
  </div>
  <div class="panel"><div class="ph-title">Работа и после</div>
   <div style="background:#0b1220;border:1px solid var(--line2);border-radius:14px;padding:13px">
    <div class="wa-msg">Арман, авто приняли 🚘 Фото по кругу и схема с 3 отметками (скол на капоте был до нас — зафиксировали). Подтвердите, пожалуйста.<div class="wa-btn" onclick="toast('Клиент подтвердил схему повреждений — спор о царапинах невозможен.')">✓ Подтверждаю</div><time>вчера 09:24</time></div>
    <div class="wa-msg">Статус: 2-й слой керамики нанесён ✨ [фото]. Готовность — завтра к 18:00.<time>сегодня 11:35</time></div>
    <div class="wa-msg">Готово! 🏁 Фотоотчёт до/после [12 фото]. Итог 253 000 ₸, Kaspi-ссылка внутри. Первые 7 дней не мойте авто — памятка приложена.<div class="wa-btn" onclick="toast('Оплата прошла — чек в 1С, сделка закрыта.')">Оплатить</div><time>завтра 17:40</time></div>
    <div class="wa-msg">Арман, как вам результат? Оцените, пожалуйста ★★★★★ — а отзыв на 2GIS поможет нам больше всего 🙏<time>через день</time></div>
    <div class="wa-msg">Прошло 6 месяцев — пора на бесплатное ТО керамики: проверим покрытие и обновим гидрофоб. Для вас — вода и мойка в подарок.<div class="wa-btn" onclick="toast('Повторный визит записан — это и есть автопилот повторных продаж.')">Записаться на ТО</div><time>через 6 мес · автоматически</time></div>
   </div>
  </div>
 </div>
 <div class="hint"><b>Ни одно из этих сообщений не написал человек.</b> Персонал занимается машинами — переписку ведёт система по вашим шаблонам.</div>`;

/* ---- НАСТРОЙКИ ---- */
SC.settings=()=>`
 <div class="head"><div><h2>Настройки</h2><p>Всё меняется без разработчика: услуги, цены, коэффициенты кузова, посты, шаблоны сообщений, проценты мастеров.</p></div></div>
 <div class="g2">
  <div class="panel"><div class="ph-title">Правила студии</div>
   ${[['Автоответ на заявку','мгновенно, свой текст на каждый канал'],['SLA на расчёт','15 минут, потом эскалация владельцу'],['Дожим не записавшихся','через 4 часа и через 2 дня'],['Напоминание о визите','за 24 часа · неявки 25% → 6%'],['Предоплата брони','30% через Kaspi-ссылку'],['Повторные визиты','мойка 2 нед · ТО керамики 6 мес · химчистка сезон'],['Проценты мастеров','30–38% по типу работ']]
     .map(x=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);font-size:10px"><span class="muted">${x[0]}</span><b style="text-align:right">${x[1]}</b></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Интеграции</div>
   ${[['WA','WhatsApp Business','вся переписка в системе, шаблоны, рассылки — канал ~5 000 ₸/мес'],
      ['IG','Instagram Direct','заявки из директа и комментариев падают в ленту'],
      ['GIS','2GIS · Google Maps','сообщения и отзывы; просьба об отзыве после выдачи'],
      ['KSP','Kaspi Pay','ссылки на предоплату и оплату, чеки автоматически'],
      ['ATC','Телефония','запись звонков в карточке; пропущенный = авто-SMS'],
      ['CAM','Камера на воротах','распознавание госномера — карточка авто открывается сама'],
      ['1C','1С · касса','чеки, касса, зарплатные ведомости']]
    .map(x=>`<div style="display:flex;gap:10px;align-items:center;border:1px solid var(--line);background:var(--panel2);padding:10px;margin-bottom:6px;border-radius:10px">
     <div style="width:36px;height:36px;background:var(--bg2);color:var(--acc2);display:grid;place-items:center;font:600 7px 'IBM Plex Mono',monospace;flex:none;border-radius:9px">${x[0]}</div>
     <div style="flex:1"><b style="font-size:10px">${x[1]}</b><p class="mini" style="margin:3px 0 0">${x[2]}</p></div></div>`).join('')}
  </div>
 </div>`;

/* ===== КАРКАС ===== */
function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([n,r],i)=>`<button class="role" onclick="enter('${n}')"><code>0${i+1}</code><b>${n}</b><span>${r.note}</span></button>`).join('')}
function enter(n){role=n;const r=ROLES[n];
 document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');
 document.getElementById('rav').textContent=r.av;document.getElementById('rname').textContent=n;document.getElementById('rrole').textContent=r.note;
 buildNav();const q=new URLSearchParams(location.search).get('s');go(q&&r.s.includes(q)?q:r.s[0]);
 toast(`Роль <b>${n}</b>: показаны только ваши разделы.`)}
function buildNav(){const al=ROLES[role].s;
 document.getElementById('nav').innerHTML=NAV.map(([g,items])=>{const x=items.filter(i=>al.includes(i[0]));
  return x.length?`<div class="nav-group">${g}</div>`+x.map(i=>`<button class="nav-item" data-go="${i[0]}" onclick="go('${i[0]}')"><span class="nav-code">${i[1]}</span><span>${i[2]}</span>${i[3]?`<span class="nav-badge">${i[3]}</span>`:'<span></span>'}</button>`).join(''):''}).join('');
 const s=document.getElementById('rsel');s.innerHTML=Object.keys(ROLES).map(n=>`<option ${n===role?'selected':''}>${n}</option>`).join('');s.onchange=()=>enter(s.value)}
function go(s){if(!ROLES[role].s.includes(s))s=ROLES[role].s[0];cur=s;
 document.getElementById('ttl').textContent=TITLES[s][0];document.getElementById('sub').textContent=TITLES[s][1];
 document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('on',x.dataset.go===s));
 render();document.getElementById('rail').classList.remove('open');document.getElementById('content').scrollTop=0;
 try{const u=new URL(location.href);u.searchParams.set('s',s);history.replaceState(null,'',u.pathname+'?'+u.searchParams.toString())}catch(e){}}
function render(){document.getElementById('content').innerHTML=`<div class="screen">${SC[cur]?SC[cur]():'<p class="mini">Раздел в разработке.</p>'}</div>`}
function openD(t,s,tabs,body){document.getElementById('dt').textContent=t;document.getElementById('ds').textContent=s;
 document.getElementById('dtabs').innerHTML=tabs.map((x,i)=>`<button class="dtab ${i===0?'on':''}">${x}</button>`).join('');
 document.getElementById('db').innerHTML=body;document.getElementById('dbg').classList.add('show')}
function closeD(){document.getElementById('dbg').classList.remove('show')}
let tt;function toast(h){const t=document.getElementById('toast');t.innerHTML=h;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),4600)}
function sparks(){const c=['#ff7a1a','#ffa055','#22d3ee','#8b5cf6','#eef2f7','#22c55e'];
 for(let i=0;i<70;i++){const s=document.createElement('i');s.className='spark';
  s.style.cssText=`left:${Math.random()*100}vw;top:-14px;background:${c[i%6]};animation-delay:${Math.random()*.45}s;transform:rotate(${Math.random()*360}deg)`;
  document.body.appendChild(s);setTimeout(()=>s.remove(),2400)}}
const TOUR=[
 ['leads','<b>Шаг 1.</b> Все 34 заявки дня — в одной ленте: Instagram, WhatsApp, 2GIS, звонки. Автоответ ушёл за секунды, SLA-таймер не даёт ни одной протухнуть.',5200],
 ['calc','<b>Шаг 2.</b> Калькулятор: кузов × услуги → сумма за 30 секунд → расчёт с фото работ улетает в WhatsApp, пока клиент «тёплый».',5200],
 ['deals','<b>Шаг 3.</b> Заявка стала сделкой и едет по этапам до выдачи. Этапы двигаются сами: оплатил бронь — переехала, мастер закрыл чек-лист — «Готово».',5200],
 ['sched','<b>Шаг 4.</b> Пять постов, длительность каждой услуги учтена. Неявки упали с 25% до 6% благодаря автонапоминаниям.',5000],
 ['jobs','<b>Шаг 5.</b> Наряд мастера: чек-лист, фото до/после и фотофиксация повреждений при приёмке — спор «вы поцарапали» закрыт навсегда.',5400],
 ['client','<b>Шаг 6.</b> Клиент всё это видит в WhatsApp: статусы, фотоотчёты, счёт и напоминание о ТО керамики через полгода. Премиум-сервис на автопилоте.',5400],
 ['fin','<b>Итог.</b> Выручка, средний чек +18%, зарплаты мастеров и должники — считаются сами. Вечером сводка дня приходит владельцу в WhatsApp.',5200]
];
let tourT=null,tourI=0;
function tour(){if(tourT){stopTour();return}tourI=0;document.getElementById('tourBtn').textContent='■ Остановить';step()}
function step(){if(tourI>=TOUR.length){stopTour();sparks();toast('<b>Весь путь — от заявки до повторного визита</b> — система ведёт сама. Вы управляете студией, а не тонете в переписках.');return}
 const [scr,txt,ms]=TOUR[tourI++];if(ROLES[role].s.includes(scr))go(scr);toast(txt);tourT=setTimeout(step,ms)}
function stopTour(){clearTimeout(tourT);tourT=null;const b=document.getElementById('tourBtn');if(b)b.textContent='▶ Сценарий'}
document.getElementById('menuBtn').onclick=()=>document.getElementById('rail').classList.toggle('open');
renderRoles();
(function(){const q=new URLSearchParams(location.search).get('s');if(q&&TITLES[q])enter(q==='jobs'?'Мастер':q==='client'?'Клиент':'Владелец')})();
