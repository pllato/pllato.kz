/* ZIPSKLAD · демо системы управления сетью self storage. Данные вымышленные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const mln=n=>n>=1e6?(n/1e6).toFixed(2).replace('.',',').replace(/,?0+$/,'')+' млн ₸':fmt(n)+' ₸';

const ROLES={
 'Владелец сети':{n:'Адиль',av:'АД',note:'Деньги, загрузка, аналитика по всем складам',s:['dash','wh','clients','billing','pay','access','lk','leads','analytics','admin']},
 'Менеджер':{n:'Асель К.',av:'АК',note:'Клиенты, договоры, счета и дебиторка',s:['wh','clients','billing','pay','leads','lk']},
 'Оператор охраны':{n:'Ержан Т.',av:'ЕТ',note:'Доступы, видеозвонки, журнал проходов',s:['access','wh','clients']},
 'Клиент':{n:'Айгерим (арендатор)',av:'АЙ',note:'Личный кабинет: бокс, счёт, оплата, доступ',s:['lk']},
 'Администратор':{n:'Данияр',av:'ДН',note:'Склады, тарифы, интеграции, пользователи',s:['admin','wh','analytics','access']}
};
const NAV=[
 ['ПУЛЬТ',[['dash','DSH','Пульт сети']]],
 ['СКЛАДЫ',[['wh','MAP','Склады и боксы'],['access','SEC','Доступ и охрана',2]]],
 ['КЛИЕНТЫ',[['clients','CRM','Арендаторы'],['leads','LED','Заявки и продажи',3],['lk','LK','Кабинет клиента']]],
 ['ДЕНЬГИ',[['billing','INV','Счета и начисления',1],['pay','PAY','Платежи и Kaspi'],['analytics','BI','Аналитика']]],
 ['СИСТЕМА',[['admin','ADM','Админка и связи']]]
];
const TITLES={
 dash:['Пульт сети','Загрузка, деньги и доступы по всем складам — вместо шести вкладок Google Sheets'],
 wh:['Склады и боксы','План каждого склада: занятые, свободные, должники и брони — кликните по боксу'],
 access:['Доступ и охрана','Face ID, видеозвонки и журнал проходов. Доступ закрывается сам при неоплате'],
 clients:['Арендаторы','Карточка клиента: боксы, период, тариф, доступы и вся история платежей'],
 leads:['Заявки и продажи','Обращения с сайта, WhatsApp, Instagram и звонков — в одной воронке'],
 lk:['Кабинет клиента','То, что видит арендатор с телефона: бокс, счёт, оплата в Kaspi и доступ'],
 billing:['Счета и начисления','Массовое выставление счетов за месяц вместо пятнадцати дней ручной работы'],
 pay:['Платежи и Kaspi','Поступления, автосопоставление с боксами и периодами, дебиторка'],
 analytics:['Аналитика','Загрузка, средняя ставка, отток, источники и прогноз выручки'],
 admin:['Админка и связи','Склады, тарифы, роли, интеграции Kaspi, WhatsApp и телефонии']
};
let role='Владелец сети',cur='dash';

/* ===== ДАННЫЕ ===== */
const WH=[
 {id:'shr',name:'Шахристан',addr:'ул. Шахристан, 12',boxes:168,busy:150,m2:820,rate:8500,lvl:2,face:0},
 {id:'buh',name:'Бухар Жырау',addr:'пр. Бухар Жырау, 45',boxes:144,busy:132,m2:610,rate:9200,lvl:1,face:1},
 {id:'ryb',name:'Рыскулова',addr:'пр. Рыскулова, 103',boxes:152,busy:124,m2:700,rate:7800,lvl:2,face:0},
 {id:'tol',name:'Толе би',addr:'ул. Толе би, 285',boxes:116,busy:104,m2:520,rate:8900,lvl:1,face:0},
 {id:'sey',name:'Сейфуллина',addr:'пр. Сейфуллина, 510',boxes:128,busy:112,m2:560,rate:8200,lvl:2,face:0},
 {id:'abay',name:'Абая',addr:'пр. Абая, 150',boxes:104,busy:92,m2:470,rate:9600,lvl:1,face:0},
 {id:'new',name:'Жандосова · новый',addr:'ул. Жандосова, 58',boxes:96,busy:32,m2:490,rate:8800,lvl:1,face:1}
];
let SEED=7;const rnd=()=>((SEED=SEED*1103515245+12345&0x7fffffff)/0x7fffffff);
const FN=['Айгерим','Ерлан','Динара','Тимур','Асель','Данияр','Гульмира','Санжар','Алия','Нурлан','Мадина','Азамат','Жанна','Руслан','Марат','Куралай','Аскар','Айнур','Бекзат','Сауле','Ержан','Камила','Олжас','Дана','Арман','Лаура','Нурсултан','Айжан','Даулет','Мейрам'];
const LN=['Сакенова','Мусаев','Абдуллаева','Байжанов','Нуртаева','Сериков','Ахметова','Оспанов','Каримова','Жумабаев','Ержанова','Токтаров','Смагулова','Ким','Досжанов','Абенова','Тлеуберды','Сагинтаев','Искаков','Бекова','Нургалиев','Жаксылык','Омарова','Турсунов','Алимова','Кенжебаев','Садыкова','Ибраев','Мукашева','Айтжанов'];
const ORG=['ТОО «Логистик Плюс»','ИП Сатыбалдиев','ТОО «Мебель Хаус»','ИП Ахметов','ТОО «СтройСнаб»','ИП Досым','ТОО «Алма Трейд»','ИП Байсеитова'];
const pickName=()=>rnd()<0.07?ORG[Math.floor(rnd()*ORG.length)]:FN[Math.floor(rnd()*FN.length)]+' '+LN[Math.floor(rnd()*LN.length)];
function genBoxes(){const out=[];
 WH.forEach(w=>{
  for(let i=1;i<=w.boxes;i++){
   const r=rnd();const m2=[2,2,3,3,4,4,6,9,12][Math.floor(rnd()*9)];
   let st='free';
   if(i<=w.busy)st=rnd()<0.09?'debt':'busy';
   else if(rnd()<0.12)st='res';
   const cl=st==='free'?null:pickName();
   const from=['01.06.2026','15.06.2026','01.07.2026','10.07.2026','01.08.2026','15.08.2026'][Math.floor(rnd()*6)];
   out.push({id:w.id+'-'+String(i).padStart(3,'0'),wh:w.id,num:i,m2,st,cl,rate:w.rate,sum:m2*w.rate,from,
    to:st==='free'?null:['01.09.2026','15.09.2026','01.10.2026'][Math.floor(rnd()*3)],
    lvl:w.lvl>1&&i>w.boxes/2?2:1,
    debt:st==='debt'?m2*w.rate*(rnd()<0.5?1:2):0,
    users:st==='free'?0:1+Math.floor(rnd()*2),
    src:['Сайт','Instagram','2ГИС','Рекомендация','WhatsApp'][Math.floor(rnd()*5)]});
  }});
 return out}
const BOXES=genBoxes();
const stat=()=>{const busy=BOXES.filter(b=>b.st==='busy'||b.st==='debt');
 return{total:BOXES.length,busy:busy.length,free:BOXES.filter(b=>b.st==='free').length,res:BOXES.filter(b=>b.st==='res').length,
  debt:BOXES.filter(b=>b.st==='debt'),rev:busy.reduce((a,b)=>a+b.sum,0),m2:busy.reduce((a,b)=>a+b.m2,0),
  load:Math.round(busy.length/BOXES.length*100)}};

let INV=[];let invRun=0;
const PAYS=[
 {id:'P-4412',cl:'Айгерим Сакенова',box:'buh-014',sum:36800,date:'сегодня 09:12',src:'Kaspi Платежи',auto:1,per:'01.09 – 30.09'},
 {id:'P-4411',cl:'Ерлан Мусаев',box:'shr-021',sum:25500,date:'сегодня 08:47',src:'Kaspi QR',auto:1,per:'01.09 – 30.09'},
 {id:'P-4410',cl:'ТОО «Логистик Плюс»',box:'ryb-007',sum:140400,date:'вчера 17:20',src:'Перевод на счёт',auto:0,per:'01.09 – 30.09'},
 {id:'P-4409',cl:'Динара Абдуллаева',box:'tol-011',sum:35600,date:'вчера 14:05',src:'Kaspi Платежи',auto:1,per:'01.09 – 30.09'},
 {id:'P-4408',cl:'Тимур Байжанов',box:'sey-019',sum:24600,date:'вчера 11:33',src:'Kaspi QR',auto:1,per:'15.08 – 14.09'}
];
const ACCESS=[
 {t:'Face ID',cl:'Айгерим Сакенова',box:'buh-014',wh:'Бухар Жырау',res:'ok',time:'09:41',note:'Распознавание 0,8 с, доступ открыт автоматически'},
 {t:'Видеозвонок',cl:'Ерлан Мусаев',box:'shr-021',wh:'Шахристан',res:'ok',time:'09:28',note:'Оператор Ержан подтвердил личность и открыл дверь'},
 {t:'Face ID',cl:'Санжар Оспанов',box:'buh-032',wh:'Бухар Жырау',res:'deny',time:'09:05',note:'Доступ закрыт: не оплачен период с 01.08, долг 27 600 ₸'},
 {t:'Видеозвонок',cl:'Гость · курьер',box:'ryb-007',wh:'Рыскулова',res:'ok',time:'08:52',note:'Разовый доступ по согласованию арендатора, 40 минут'},
 {t:'Face ID',cl:'Динара Абдуллаева',box:'tol-011',wh:'Толе би',res:'ok',time:'08:34',note:'Доступ открыт, второй пользователь бокса'}
];
const LEADS=[
 {n:'Марат Досжанов',ch:'WhatsApp',need:'Бокс 6 м² на 3 месяца, район Абая',st:0,t:'10:41',note:'Спрашивает цену и есть ли свободные'},
 {n:'Куралай Абенова',ch:'Сайт',need:'Хранение мебели после переезда, 9 м²',st:1,t:'10:12',note:'Заявка с формы на zipsklad.kz'},
 {n:'ТОО «Мебель Хаус»',ch:'Instagram',need:'Два бокса по 18 м² под товар',st:2,t:'вчера',note:'Юрлицо, нужен договор и счёт на оплату'},
 {n:'Азамат Токтаров',ch:'Звонок',need:'Бокс 3 м², спрашивает про Face ID',st:1,t:'вчера',note:'Запись разговора 2:14'},
 {n:'Жанна Смагулова',ch:'WhatsApp',need:'Продление на полгода со скидкой',st:3,t:'сегодня',note:'Действующий клиент, бокс shr-008'}
];
const LSTAGES=['Новая заявка','В работе','Бронь','Заселён'];

/* ===== ЭКРАНЫ ===== */
const SC={};

SC.dash=()=>{const s=stat();
 return `<div class="head"><div><h2>Пульт сети</h2><p>Всё, что сейчас разбросано по шести вкладкам Google Sheets — на одном экране и в реальном времени: загрузка по каждому складу, деньги, долги и доступы.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Сводка за день отправлена вам в WhatsApp.')">Сводка в WhatsApp</button><button class="btn y" onclick="go('billing')">⚡ Выставить счета</button></div></div>
 <div class="strip">
  <div><small>ВЫРУЧКА · СЕНТЯБРЬ (НАЧИСЛЕНО)</small><b>${mln(s.rev)}</b><span>${s.busy} боксов · ${fmt(s.m2)} м²</span></div>
  <div><small>ЗАГРУЗКА СЕТИ</small><b>${s.load}%</b><span class="good">цель 85%</span></div>
  <div><small>СВОБОДНО</small><b>${s.free}</b><span>${s.res} в брони</span></div>
  <div><small>ДОЛЖНИКИ</small><b class="bad">${s.debt.length}</b><span>${mln(s.debt.reduce((a,b)=>a+b.debt,0))}</span></div>
  <div><small>СРЕДНЯЯ СТАВКА</small><b>${fmt(s.rev/s.m2)} ₸</b><span>за м² в месяц</span></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph"><div><div class="ph-title">Склады сети</div><div class="ph-sub">загрузка, выручка и должники по каждому объекту</div></div><span class="tag y">${WH.length} складов</span></div>
   <div class="tw"><table class="data" style="min-width:620px"><thead><tr><th>Склад</th><th>Адрес</th><th class="right">Боксов</th><th class="right">Занято</th><th>Загрузка</th><th class="right">Выручка</th><th class="right">Долги</th></tr></thead><tbody>
   ${WH.map(w=>{const bs=BOXES.filter(b=>b.wh===w.id),busy=bs.filter(b=>b.st==='busy'||b.st==='debt'),dbt=bs.filter(b=>b.st==='debt');
    const load=Math.round(busy.length/bs.length*100);
    return `<tr onclick="go('wh');setTimeout(()=>selWh('${w.id}'),60)"><td><b>${w.name}</b>${w.face?'<div class="sub">Face ID подключён</div>':''}${w.lvl>1?'<div class="sub">2 уровня</div>':''}</td><td class="mini">${w.addr}</td><td class="right mono">${bs.length}</td><td class="right mono">${busy.length}</td>
    <td><div class="bar" style="width:76px"><i style="--w:${load}%;--tone:${load>85?'var(--green)':load>60?'var(--y)':'var(--red)'}"></i></div><div class="sub">${load}%</div></td>
    <td class="right mono"><b>${mln(busy.reduce((a,b)=>a+b.sum,0))}</b></td><td class="right"><span class="tag ${dbt.length?'red':'green'}">${dbt.length||'—'}</span></td></tr>`}).join('')}
   </tbody></table></div>
   <div class="hint"><b>Что это меняет:</b> сейчас, чтобы понять картину по сети, нужно открыть шесть вкладок и свести их руками. Здесь загрузка и деньги пересчитываются сами при каждом заселении, платеже и выезде.</div>
  </div>
  <div class="panel dark"><div class="ph"><div><div class="ph-title">Требуют решения</div><div class="ph-sub">система собрала отклонения по правилам</div></div><span class="tag red">4</span></div>
   ${[['var(--red)',`${s.debt.length} боксов с долгом`,`${mln(s.debt.reduce((a,b)=>a+b.debt,0))} · доступ закрыт автоматически`,'pay'],
      ['var(--y)','Счета за сентябрь не выставлены','812 начислений готовы к отправке одним запуском','billing'],
      ['var(--orange)','3 заявки без ответа','WhatsApp и сайт · дольше 15 минут','leads'],
      ['var(--blue)','Жандосова заполнен на 32%','новый склад · нужна реклама на район','analytics']]
     .map(x=>`<div style="border-left:3px solid ${x[0]};background:#242932;padding:10px 11px;margin-bottom:6px;cursor:pointer;border-radius:0 4px 4px 0" onclick="go('${x[3]}')"><b style="font-size:10px">${x[1]}</b><p style="font-size:8.8px;color:#8b93a1;margin:4px 0 0;line-height:1.5">${x[2]}</p></div>`).join('')}
   <div style="border-top:1px solid #2a2f39;margin-top:11px;padding-top:11px"><div class="ph-title" style="font-size:11px">Как работает автоматика</div>
    <p style="font-size:8.8px;color:#8b93a1;line-height:1.65;margin:6px 0 0">Первого числа система начисляет аренду по каждому боксу с его тарифом и периодом, отправляет счёт в Kaspi и WhatsApp. Оплата подтягивается и сама продлевает доступ. Не оплатил к сроку — Face ID и видеодомофон перестают пускать, оператору ничего делать не нужно.</p></div>
  </div>
 </div>
 <div class="g3">
  <div class="panel"><div class="ph"><div><div class="ph-title">Выручка по месяцам</div><div class="ph-sub">тёмное — начислено, жёлтое — оплачено</div></div><span class="tag green">▲ 14%</span></div>
   <div class="chart" style="height:120px">${[['апр',72,68],['май',78,74],['июн',83,79],['июл',88,83],['авг',94,88],['сен',100,42]].map(m=>`<div class="chart-col"><i style="--h:${m[1]}%;--p:${m[2]}%"></i><span>${m[0]}</span></div>`).join('')}</div>
   <div class="kpi-mini"><div style="--tone:var(--y)"><small>СЕНТЯБРЬ</small><b>${mln(s.rev)}</b></div><div style="--tone:var(--green)"><small>СОБИРАЕМОСТЬ</small><b>96%</b></div></div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Срок аренды</div><div class="ph-sub">сколько держат бокс</div></div><span class="tag y">ср. 2,8 мес</span></div>
   ${[['до 1 месяца',96,18,'#b8b6b0'],['1–3 месяца',214,41,'var(--y)'],['3–6 месяцев',142,27,'var(--blue)'],['больше полугода',72,14,'var(--green)']]
     .map(r=>`<div class="fr" style="grid-template-columns:96px 1fr 62px"><span>${r[0]}</span><div class="ftrack" style="height:16px"><i style="--w:${Math.round(r[1]/214*100)}%;background:${r[3]}"></i></div><b>${r[1]} · ${r[2]}%</b></div>`).join('')}
   <div class="hint" style="margin-top:9px"><b>Вывод:</b> 41% клиентов уходят в интервале 1–3 месяцев. Автопродление и напоминание за 5 дней до конца периода — прямой рост выручки.</div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Откуда приходят клиенты</div><div class="ph-sub">источник фиксируется в заявке</div></div></div>
   ${[['Instagram / реклама',38,'var(--y)'],['Сайт zipsklad.kz',27,'var(--blue)'],['2ГИС и карты',18,'var(--green)'],['Рекомендации',12,'var(--violet)'],['Прочее',5,'#b8b6b0']]
     .map(r=>`<div class="fr" style="grid-template-columns:118px 1fr 40px"><span>${r[0]}</span><div class="ftrack" style="height:16px"><i style="--w:${r[1]/38*100}%;background:${r[2]}"></i></div><b>${r[1]}%</b></div>`).join('')}
   <div class="kpi-mini"><div style="--tone:var(--y)"><small>ЗАЯВОК В МЕСЯЦ</small><b>146</b></div><div style="--tone:var(--green)"><small>ЗАСЕЛЕНИЕ</small><b>31%</b></div></div>
  </div>
 </div>`};

/* ---- СКЛАДЫ И БОКСЫ ---- */
let whF='shr',boxF='all';
SC.wh=()=>{const w=WH.find(x=>x.id===whF),bs=BOXES.filter(b=>b.wh===whF);
 const busy=bs.filter(b=>b.st==='busy'||b.st==='debt');
 return `<div class="head"><div><h2>Склады и боксы</h2><p>План склада вместо таблицы: цвет показывает состояние бокса, клик открывает карточку с арендатором, периодом, тарифом и доступами.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Схема склада выгружена в PDF для печати на стойку оператора.')">Печать схемы</button><button class="btn y" onclick="newRent()">+ Заселить клиента</button></div></div>
 <div class="filters">${WH.map(x=>`<button class="filter ${x.id===whF?'on':''}" onclick="selWh('${x.id}')">${x.name}</button>`).join('')}</div>
 <div class="strip">
  <div><small>СКЛАД</small><b>${w.name}</b><span>${w.addr}${w.lvl>1?' · 2 уровня':''}</span></div>
  <div><small>БОКСОВ</small><b>${bs.length}</b><span>${fmt(bs.reduce((a,b)=>a+b.m2,0))} м² всего</span></div>
  <div><small>ЗАНЯТО</small><b>${busy.length}</b><span>${Math.round(busy.length/bs.length*100)}% загрузка</span></div>
  <div><small>ВЫРУЧКА</small><b>${mln(busy.reduce((a,b)=>a+b.sum,0))}</b><span>${fmt(w.rate)} ₸/м² базовый тариф</span></div>
  <div><small>ДОСТУП</small><b>${w.face?'Face ID':'Видеозвонок'}</b><span>${w.face?'без оператора':'оператор подтверждает'}</span></div>
 </div>
 <div class="panel"><div class="ph"><div><div class="ph-title">План склада · ${w.name}${w.lvl>1?' · уровень 1 и 2':''}</div><div class="ph-sub">${bs.length} боксов · нажмите на бокс, чтобы открыть карточку</div></div>
  <div class="btns"><button class="filter ${boxF==='all'?'on':''}" onclick="fBox('all')">Все</button><button class="filter ${boxF==='busy'?'on':''}" onclick="fBox('busy')">Занятые</button><button class="filter ${boxF==='free'?'on':''}" onclick="fBox('free')">Свободные</button><button class="filter ${boxF==='debt'?'on':''}" onclick="fBox('debt')">Долг</button></div></div>
  ${w.lvl>1?`<div class="ph-sub" style="margin:4px 0 6px;font-weight:700">Уровень 1</div>`:''}
  <div class="plan">${bs.filter(b=>b.lvl===1&&(boxF==='all'||b.st===boxF||(boxF==='busy'&&b.st==='debt'))).map(boxHTML).join('')}</div>
  ${w.lvl>1?`<div class="ph-sub" style="margin:12px 0 6px;font-weight:700">Уровень 2 · надстройка</div><div class="plan">${bs.filter(b=>b.lvl===2&&(boxF==='all'||b.st===boxF||(boxF==='busy'&&b.st==='debt'))).map(boxHTML).join('')}</div>`:''}
  <div class="legend"><span><i style="background:#fdf0cd;border:1px solid #e8c765"></i>занят</span><span><i style="background:#e9f5ee;border:1px solid #a9d6bd"></i>свободен</span><span><i style="background:#f8e0dc;border:1px solid #e0a094"></i>долг · доступ закрыт</span><span><i style="background:#e6e0f4;border:1px solid #b7a7de"></i>бронь</span></div>
  <div class="hint"><b>Второй уровень уже учтён:</b> надстройка на складе показана отдельным ярусом со своим тарифом. Новые склады добавляются в админке без разработчика — вы сами открываете объект, задаёте сетку боксов и цены.</div>
 </div>`};
const boxHTML=b=>`<div class="box ${b.st}" onclick="openBox('${b.id}')"><i></i><b>${b.num}</b><small>${b.m2} м²</small>${b.st!=='free'?`<small style="font-size:7px">${b.cl?b.cl.split(' ')[0]:''}</small>`:''}</div>`;
function selWh(id){whF=id;render()}
function fBox(f){boxF=f;render()}
function openBox(id){const b=BOXES.find(x=>x.id===id),w=WH.find(x=>x.id===b.wh);
 openD(`Бокс ${b.num} · ${w.name}`,`${b.id} · ${b.m2} м² · уровень ${b.lvl} · ${b.st==='free'?'свободен':b.st==='res'?'бронь':b.st==='debt'?'долг':'занят'}`,['Карточка бокса'],
 b.st==='free'?`<div class="dg"><div class="det"><small>ПЛОЩАДЬ</small><b>${b.m2} м²</b></div><div class="det"><small>ТАРИФ</small><b>${fmt(b.rate)} ₸/м²</b></div><div class="det"><small>СТАВКА В МЕСЯЦ</small><b>${fmt(b.sum)} ₸</b></div><div class="det"><small>СОСТОЯНИЕ</small><b class="good">свободен</b></div></div>
  <div class="note" style="--tone:var(--green)"><b>Готов к заселению</b><p>Бокс свободен и виден на сайте как доступный. При бронировании онлайн он автоматически уйдёт в статус «бронь» на 24 часа.</p></div>
  <div class="btns" style="margin-top:11px"><button class="btn y" onclick="closeD();newRent('${b.id}')">Заселить клиента</button><button class="btn" onclick="closeD();toast('Бокс ${b.num} забронирован на 24 часа, на сайте показан как занятый.')">Забронировать</button></div>`
 :`<div class="dg"><div class="det"><small>АРЕНДАТОР</small><b>${esc(b.cl||'—')}</b></div><div class="det"><small>ПЛОЩАДЬ И ТАРИФ</small><b>${b.m2} м² · ${fmt(b.rate)} ₸/м²</b></div>
   <div class="det"><small>СТАВКА В МЕСЯЦ</small><b>${fmt(b.sum)} ₸</b></div><div class="det"><small>ПЕРИОД</small><b>${b.from} – ${b.to||'—'}</b></div>
   <div class="det"><small>ДОСТУП</small><b class="${b.st==='debt'?'bad':'good'}">${b.st==='debt'?'закрыт · долг':'открыт'}</b></div><div class="det"><small>ПОЛЬЗОВАТЕЛЕЙ</small><b>${b.users} чел.</b></div></div>
  ${b.debt?`<div class="note" style="--tone:var(--red)"><b>Задолженность ${fmt(b.debt)} ₸</b><p>Доступ на склад закрыт автоматически с первого дня просрочки. Как только оплата придёт в Kaspi, система откроет его обратно в течение 15 минут — оператору звонить не нужно.</p></div>`:''}
  <div class="ph-title" style="margin:12px 0 7px;font-size:12px">История по боксу</div>
  <div class="tl">
   <div class="tli"><b>Начислена аренда за сентябрь</b><p>${fmt(b.sum)} ₸ · счёт отправлен в Kaspi и WhatsApp</p><time>01.09 · автоматически</time></div>
   <div class="tli"><b>Оплата за август</b><p>${fmt(b.sum)} ₸ · Kaspi Платежи · доступ продлён</p><time>02.08 · подтверждено системой</time></div>
   <div class="tli"><b>Заселение</b><p>Договор подписан онлайн, добавлено ${b.users} пользователя с доступом</p><time>${b.from} · источник: ${b.src}</time></div>
  </div>
  <div class="btns" style="margin-top:12px">
   <button class="btn" onclick="toast('Счёт отправлен клиенту в WhatsApp и Kaspi.')">Выставить счёт</button>
   <button class="btn" onclick="toast('Напоминание отправлено арендатору в WhatsApp.')">Напомнить</button>
   <button class="btn ${b.st==='debt'?'green':''}" onclick="toggleAccess('${b.id}')">${b.st==='debt'?'Открыть доступ вручную':'Закрыть доступ'}</button>
   <button class="btn red" onclick="closeD();toast('Освобождение бокса ${b.num}: акт сформирован, бокс вернётся в продажу после осмотра.')">Освободить</button>
  </div>`)}
function toggleAccess(id){const b=BOXES.find(x=>x.id===id);
 if(b.st==='debt'){b.st='busy';b.debt=0;toast(`Доступ по боксу <b>${b.num}</b> открыт вручную. Обычно это делает система после оплаты.`)}
 else{b.st='debt';b.debt=b.sum;toast(`Доступ по боксу <b>${b.num}</b> закрыт. Face ID и домофон больше не пускают.`)}
 closeD();render()}
function newRent(boxId){const free=BOXES.filter(b=>b.st==='free').slice(0,40);
 openD('Заселение клиента','Договор, тариф и доступ оформляются в одном окне',['Новый арендатор'],
 `<div class="f2"><div class="fld"><small>КЛИЕНТ</small><input id="rcName" placeholder="ФИО или название компании"></div><div class="fld"><small>ТЕЛЕФОН</small><input id="rcPhone" placeholder="+7 ___ ___ __ __"></div></div>
  <div class="f3"><div class="fld"><small>БОКС</small><select id="rcBox">${free.map(b=>`<option value="${b.id}" ${b.id===boxId?'selected':''}>${WH.find(w=>w.id===b.wh).name} · № ${b.num} · ${b.m2} м²</option>`).join('')}</select></div>
   <div class="fld"><small>ПЕРИОД, МЕС</small><input id="rcMon" type="number" value="3"></div>
   <div class="fld"><small>ИСТОЧНИК</small><select id="rcSrc"><option>Сайт</option><option>Instagram</option><option>2ГИС</option><option>Рекомендация</option><option>WhatsApp</option></select></div></div>
  <div class="note" style="--tone:var(--y)"><b>Что произойдёт после сохранения</b><p>Система создаст договор с тарифом бокса, начислит первый период, отправит клиенту счёт в Kaspi и ссылку на личный кабинет, заведёт его в Face ID и откроет доступ после оплаты.</p></div>
  <div class="btns" style="margin-top:12px"><button class="btn y" onclick="saveRent()">Заселить и выставить счёт</button><button class="btn" onclick="closeD()">Отмена</button></div>`)}
function saveRent(){const n=document.getElementById('rcName').value.trim();if(!n)return toast('Укажите клиента.');
 const id=document.getElementById('rcBox').value,b=BOXES.find(x=>x.id===id);
 b.st='busy';b.cl=n;b.from='сегодня';b.to='через '+(document.getElementById('rcMon').value||3)+' мес.';b.users=1;b.src=document.getElementById('rcSrc').value;
 closeD();render();sparks();
 toast(`Клиент <b>${esc(n)}</b> заселён в бокс ${b.num}. Счёт на ${fmt(b.sum)} ₸ ушёл в Kaspi, кабинет создан.`)}

/* ---- СЧЕТА ---- */
SC.billing=()=>{const s=stat();const busy=BOXES.filter(b=>b.st==='busy'||b.st==='debt');
 return `<div class="head"><div><h2>Счета и начисления</h2><p>Главная боль: сейчас 800 счетов выставляются вручную и занимают у двух менеджеров пятнадцать дней в месяц. Здесь это один запуск — с тарифом, периодом и номером бокса по каждому клиенту.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Шаблон счёта открыт: реквизиты ИП, назначение платежа, период и бокс подставляются автоматически.')">Шаблон счёта</button><button class="btn y" onclick="runInv()">⚡ Выставить счета за сентябрь</button></div></div>
 <div class="strip">
  <div><small>К НАЧИСЛЕНИЮ · СЕНТЯБРЬ</small><b>${mln(s.rev)}</b><span>${busy.length} боксов</span></div>
  <div><small>СЧЕТОВ ОТПРАВЛЕНО</small><b>${INV.length}</b><span>${INV.length?'в этом запуске':'запуск не сделан'}</span></div>
  <div><small>ВРЕМЯ ЗАПУСКА</small><b>≈ 40 сек</b><span class="good">было 15 дней</span></div>
  <div><small>ОПЛАЧЕНО</small><b>${PAYS.length}</b><span>подтянуто из Kaspi</span></div>
  <div><small>ОШИБОК СОПОСТАВЛЕНИЯ</small><b class="good">0</b><span>бокс и период определены</span></div>
 </div>
 <div class="g12">
  <div class="inv-run" id="invRun">
   <h3>Массовое начисление</h3>
   <p>Система пройдёт по всем занятым боксам, посчитает аренду по тарифу и площади, определит период каждого договора и отправит счёт в Kaspi Платежи и WhatsApp.</p>
   <div class="progress-big"><i style="--w:${invRun}%"></i></div>
   <div style="display:flex;justify-content:space-between;font:700 9px 'IBM Plex Mono',monospace;color:#8b93a1"><span>ПРОГРЕСС</span><span id="invPct">${invRun}%</span></div>
   <div style="margin-top:11px;max-height:180px;overflow:auto" id="invLog">${INV.length?INV.slice(0,14).map(i=>`<div class="log-line">✓ ${i.box} · ${i.cl} · <b>${fmt(i.sum)} ₸</b> · ${i.per}</div>`).join(''):'<div class="log-line">Ожидание запуска…</div>'}</div>
   <button class="btn y" style="width:100%;margin-top:12px" onclick="runInv()">${INV.length?'Запустить ещё раз':'⚡ Запустить начисление'}</button>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Как считается счёт</div><div class="ph-sub">каждая строка формируется по данным бокса и договора</div></div><span class="tag y">пример</span></div>
   <div class="tw"><table class="data" style="min-width:520px"><thead><tr><th>Бокс</th><th>Клиент</th><th class="right">Площадь</th><th class="right">Тариф</th><th>Период</th><th class="right">К оплате</th></tr></thead><tbody>
   ${busy.slice(0,9).map(b=>`<tr onclick="openBox('${b.id}')"><td class="mono">${b.id}</td><td><b>${esc(b.cl)}</b></td><td class="right mono">${b.m2} м²</td><td class="right mono">${fmt(b.rate)}</td><td class="mini">01.09 – 30.09</td><td class="right mono"><b>${fmt(b.sum)} ₸</b></td></tr>`).join('')}
   </tbody></table></div>
   <div class="hint"><b>Ровно то, что вы просили:</b> в счёте видно, за какой бокс и за какой период платят. Клиенту не нужно ничего вписывать — он открывает Kaspi и нажимает «оплатить», как за коммуналку. Если платит не сам арендатор, а родственник или коллега, платёж всё равно привязан к боксу.</div>
  </div>
 </div>`};
function runInv(){if(invRun>0&&invRun<100)return;
 const busy=BOXES.filter(b=>b.st==='busy'||b.st==='debt');INV=[];invRun=0;
 if(cur!=='billing')go('billing');
 const step=()=>{invRun=Math.min(100,invRun+Math.ceil(100/22));
  const cnt=Math.round(busy.length*invRun/100);
  INV=busy.slice(0,cnt).map(b=>({box:b.id,cl:b.cl,sum:b.sum,per:'01.09 – 30.09'}));
  const bar=document.querySelector('.progress-big i'),pct=document.getElementById('invPct'),log=document.getElementById('invLog');
  if(bar)bar.style.setProperty('--w',invRun+'%');
  if(pct)pct.textContent=invRun+'%';
  if(log)log.innerHTML=INV.slice(-14).reverse().map(i=>`<div class="log-line">✓ ${i.box} · ${esc(i.cl)} · <b>${fmt(i.sum)} ₸</b> · ${i.per}</div>`).join('');
  if(invRun<100)setTimeout(step,90);
  else{sparks();render();
   toast(`Готово: <b>${busy.length} счетов</b> сформировано и отправлено в Kaspi и WhatsApp за 40 секунд. Раньше на это уходило 15 дней работы двух менеджеров.`)}};
 step()}

/* ---- ПЛАТЕЖИ ---- */
SC.pay=()=>{const s=stat();
 return `<div class="head"><div><h2>Платежи и Kaspi</h2><p>Поступления приходят в систему сами: платёж определяется по боксу и периоду, доступ продлевается автоматически. Дебиторка перестаёт быть ручной таблицей.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Проверка Kaspi: соединение активно, последняя синхронизация 40 секунд назад.')">Проверить связь</button><button class="btn" onclick="toast('Напоминания отправлены 34 должникам в WhatsApp со ссылкой на оплату.')">Напомнить должникам</button><button class="btn y" onclick="simulatePay()">▶ Симулировать оплату</button></div></div>
 <div class="strip">
  <div><small>ПОСТУПИЛО · СЕНТЯБРЬ</small><b>${mln(PAYS.reduce((a,p)=>a+p.sum,0)*38)}</b><span>${Math.round(PAYS.reduce((a,p)=>a+p.sum,0)*38/s.rev*100)}% от начисленного</span></div>
  <div><small>СЕГОДНЯ</small><b>${mln(PAYS.filter(p=>p.date.includes('сегодня')).reduce((a,p)=>a+p.sum,0))}</b><span>${PAYS.filter(p=>p.date.includes('сегодня')).length} платежа</span></div>
  <div><small>АВТОСОПОСТАВЛЕНИЕ</small><b>96%</b><span class="good">бокс и период найдены</span></div>
  <div><small>ДЕБИТОРКА</small><b class="bad">${mln(s.debt.reduce((a,b)=>a+b.debt,0))}</b><span>${s.debt.length} боксов</span></div>
  <div><small>ДОСТУП ЗАКРЫТ АВТО</small><b>${s.debt.length}</b><span>без участия оператора</span></div>
 </div>
 <div class="g12">
  <div class="panel dark"><div class="ph-title">Путь платежа</div>
   <div style="margin-top:11px">
   ${[['01','Начисление','система считает аренду по боксу, площади и тарифу'],
      ['02','Счёт в Kaspi Платежи','клиент видит его как коммуналку: бокс, период, сумма'],
      ['03','Оплата','Kaspi QR, Платежи или перевод — сумма приходит в систему'],
      ['04','Сопоставление','платёж привязывается к боксу и периоду, даже если платил не арендатор'],
      ['05','Доступ','Face ID и домофон открываются в течение 15 минут, оператор не участвует']]
    .map(x=>`<div style="display:grid;grid-template-columns:26px 1fr;gap:10px;padding:8px 0;border-bottom:1px solid #2a2f39"><span class="mono" style="color:var(--y);font-size:8.4px;font-weight:700">${x[0]}</span><div><b style="font-size:9.6px">${x[1]}</b><p style="font-size:8.6px;color:#8b93a1;margin:3px 0 0;line-height:1.5">${x[2]}</p></div></div>`).join('')}
   </div>
   <div style="background:#242932;padding:11px;margin-top:11px;border-radius:4px;border-left:3px solid var(--y)">
    <b style="font-size:9.6px;color:var(--y)">Если Kaspi не даст API</b>
    <p style="font-size:8.6px;color:#8b93a1;margin:5px 0 0;line-height:1.55">Резервный путь уже проверен на другом проекте: постоянная ссылка на оплату в кабинете плюс разбор писем Kaspi на вашей почте. Система читает подтверждения об оплате и открывает доступ так же автоматически.</p>
   </div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Последние поступления</div><div class="ph-sub">каждый платёж уже привязан к боксу и периоду</div></div><span class="tag green">live</span></div>
   <div class="tw"><table class="data" style="min-width:560px"><thead><tr><th>Платёж</th><th>Клиент</th><th>Бокс</th><th>Период</th><th>Источник</th><th class="right">Сумма</th></tr></thead><tbody id="payTb">
   ${PAYS.map(p=>`<tr onclick="payCard('${p.id}')"><td class="mono">${p.id}<div class="sub">${p.date}</div></td><td><b>${esc(p.cl)}</b></td><td class="mono">${p.box}</td><td class="mini">${p.per}</td><td><span class="tag ${p.src.includes('Kaspi')?'red':'blue'}">${p.src}</span></td><td class="right mono"><b>${fmt(p.sum)} ₸</b></td></tr>`).join('')}
   </tbody></table></div>
   <div class="ph-title" style="margin:14px 0 8px;font-size:12px">Дебиторка · доступ закрыт автоматически</div>
   <div class="tw"><table class="data" style="min-width:520px"><thead><tr><th>Бокс</th><th>Арендатор</th><th>Склад</th><th class="right">Долг</th><th>Действие</th></tr></thead><tbody>
   ${s.debt.slice(0,8).map(b=>`<tr onclick="openBox('${b.id}')"><td class="mono">${b.id}</td><td><b>${esc(b.cl)}</b></td><td class="mini">${WH.find(w=>w.id===b.wh).name}</td><td class="right mono bad"><b>${fmt(b.debt)} ₸</b></td><td><span class="tag red">доступ закрыт</span></td></tr>`).join('')}
   </tbody></table></div>
   <div class="hint"><b>Человеческий фактор убран:</b> раньше менеджер мог забыть внести оплату или закрыть доступ, и клиент либо заходил бесплатно, либо стоял у закрытой двери с оплаченным счётом. Теперь и то и другое делает система.</div>
  </div>
 </div>`};
function payCard(id){const p=PAYS.find(x=>x.id===id);
 openD(p.cl,`${p.id} · ${p.date} · ${p.src}`,['Платёж'],
 `<div class="dg"><div class="det"><small>СУММА</small><b>${fmt(p.sum)} ₸</b></div><div class="det"><small>БОКС</small><b>${p.box}</b></div><div class="det"><small>ПЕРИОД</small><b>${p.per}</b></div><div class="det"><small>СОПОСТАВЛЕНИЕ</small><b class="good">${p.auto?'автоматически':'вручную'}</b></div></div>
  <div class="note" style="--tone:var(--green)"><b>Что сделала система</b><p>Определила бокс и период по сумме и отправителю, закрыла начисление, продлила аренду и открыла доступ на склад. Оператору уведомление не требуется.</p></div>
  <div class="btns" style="margin-top:11px"><button class="btn" onclick="closeD();openBox('${p.box}')">Открыть бокс</button><button class="btn" onclick="toast('Чек отправлен клиенту в WhatsApp.')">Отправить чек</button></div>`)}
function simulatePay(){const d=stat().debt[0];if(!d)return toast('Должников нет — все оплатили.');
 PAYS.unshift({id:'P-44'+(13+PAYS.length),cl:d.cl,box:d.id,sum:d.debt,date:'только что',src:'Kaspi Платежи',auto:1,per:'01.09 – 30.09'});
 d.st='busy';d.debt=0;render();sparks();
 toast(`Оплата от <b>${esc(d.cl)}</b> получена. Бокс ${d.num}: начисление закрыто, доступ открыт автоматически — оператор не участвовал.`)}

/* ---- ДОСТУП ---- */
SC.access=()=>`
 <div class="head"><div><h2>Доступ и охрана</h2><p>Три оператора в три смены следят за шестью складами. Система забирает у них рутину: Face ID пускает клиента сам, а должника не пускает без звонка и уточнений.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Журнал проходов за месяц выгружен в Excel.')">Журнал за месяц</button><button class="btn y" onclick="faceDemo()">▶ Проход по Face ID</button></div></div>
 <div class="strip">
  <div><small>ПРОХОДОВ СЕГОДНЯ</small><b>84</b><span>Face ID 61 · видеозвонок 23</span></div>
  <div><small>БЕЗ УЧАСТИЯ ОПЕРАТОРА</small><b>73%</b><span class="good">было 0%</span></div>
  <div><small>ОТКАЗОВ</small><b class="bad">6</b><span>долг или нет доступа</span></div>
  <div><small>СРЕДНЕЕ ВРЕМЯ ВХОДА</small><b>0,8 сек</b><span>против 40 сек звонка</span></div>
  <div><small>СКЛАДОВ С FACE ID</small><b>2 из 7</b><span>масштабируем на все</span></div>
 </div>
 <div class="g12">
  <div class="panel"><div class="ph-title">Пункт входа · Бухар Жырау</div>
   <div class="cam" id="camBox" style="margin-top:9px"><div class="cam-face"></div><div class="cam-lbl" id="camLbl">ОЖИДАНИЕ · КАМЕРА 1</div><div class="cam-ok hidden" id="camOk">ДОСТУП ОТКРЫТ</div></div>
   <div class="kpi-mini"><div style="--tone:var(--green)"><small>СЕГОДНЯ ПУСТИЛА</small><b>61</b></div><div style="--tone:var(--red)"><small>ОТКАЗАЛА</small><b>6</b></div></div>
   <div class="hint"><b>Как это работает:</b> клиент регистрируется в кабинете и загружает фото сам — оператор больше не заносит лица вручную в программу охраны. Если аренда не оплачена, система просто не откроет дверь и покажет клиенту причину в кабинете.</div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Журнал проходов</div><div class="ph-sub">кто, куда и по какому основанию заходил</div></div><span class="tag green">live</span></div>
   <div class="tw"><table class="data" style="min-width:600px"><thead><tr><th>Время</th><th>Способ</th><th>Клиент</th><th>Бокс / склад</th><th>Результат</th><th>Комментарий</th></tr></thead><tbody id="accTb">
   ${ACCESS.map(a=>`<tr><td class="mono">${a.time}</td><td><span class="tag ${a.t==='Face ID'?'violet':'blue'}">${a.t}</span></td><td><b>${esc(a.cl)}</b></td><td class="mono">${a.box}<div class="sub">${a.wh}</div></td><td><span class="tag ${a.res==='ok'?'green':'red'}">${a.res==='ok'?'пропущен':'отказ'}</span></td><td class="mini">${esc(a.note)}</td></tr>`).join('')}
   </tbody></table></div>
   <div class="hint"><b>Разовый доступ:</b> арендатор может выдать курьеру или родственнику временный проход прямо из кабинета — на час или на день, без звонка оператору. Всё попадает в этот же журнал.</div>
  </div>
 </div>`;
function faceDemo(){if(cur!=='access')go('access');
 setTimeout(()=>{const l=document.getElementById('camLbl'),ok=document.getElementById('camOk');if(!l)return;
  l.textContent='РАСПОЗНАВАНИЕ…';
  setTimeout(()=>{l.textContent='АЙГЕРИМ САКЕНОВА · БОКС BUH-014';ok.classList.remove('hidden');
   ACCESS.unshift({t:'Face ID',cl:'Айгерим Сакенова',box:'buh-014',wh:'Бухар Жырау',res:'ok',time:'только что',note:'Аренда оплачена до 30.09, доступ открыт автоматически за 0,8 с'});
   const tb=document.getElementById('accTb');if(tb)tb.insertAdjacentHTML('afterbegin',`<tr style="background:#eef7f2"><td class="mono">только что</td><td><span class="tag violet">Face ID</span></td><td><b>Айгерим Сакенова</b></td><td class="mono">buh-014<div class="sub">Бухар Жырау</div></td><td><span class="tag green">пропущен</span></td><td class="mini">Аренда оплачена до 30.09, доступ открыт автоматически за 0,8 с</td></tr>`);
   toast('Клиент прошёл по <b>Face ID за 0,8 секунды</b>. Оператор не отвлекался, запись попала в журнал.');
   setTimeout(()=>{ok.classList.add('hidden');l.textContent='ОЖИДАНИЕ · КАМЕРА 1'},3200)},1200)},120)}

/* ---- АРЕНДАТОРЫ ---- */
let clF='all';
SC.clients=()=>{const busy=BOXES.filter(b=>b.st!=='free'&&b.cl);
 const byCl={};busy.forEach(b=>{(byCl[b.cl]=byCl[b.cl]||[]).push(b)});
 let list=Object.entries(byCl);
 if(clF==='debt')list=list.filter(([,bs])=>bs.some(b=>b.st==='debt'));
 if(clF==='multi')list=list.filter(([,bs])=>bs.length>1);
 if(clF==='ur')list=list.filter(([n])=>n.startsWith('ТОО')||n.startsWith('ИП'));
 return `<div class="head"><div><h2>Арендаторы</h2><p>Вместо строк в таблице — карточка клиента: все его боксы, периоды, платежи, кто имеет доступ и вся переписка.</p></div>
 <div class="btns"><button class="btn" onclick="toast('База выгружена в Excel: клиенты, боксы, периоды и контакты.')">Экспорт</button><button class="btn y" onclick="newRent()">+ Заселить</button></div></div>
 <div class="filters"><input class="search" id="cq" placeholder="Имя, телефон, номер бокса…" oninput="render()"><button class="filter ${clF==='all'?'on':''}" onclick="clF='all';render()">Все ${Object.keys(byCl).length}</button><button class="filter ${clF==='debt'?'on':''}" onclick="clF='debt';render()">С долгом</button><button class="filter ${clF==='multi'?'on':''}" onclick="clF='multi';render()">Несколько боксов</button><button class="filter ${clF==='ur'?'on':''}" onclick="clF='ur';render()">Юрлица</button></div>
 <div class="panel"><div class="tw"><table class="data" style="min-width:700px"><thead><tr><th>Клиент</th><th>Боксы</th><th class="right">Площадь</th><th class="right">В месяц</th><th>Период</th><th>Доступ</th><th>Источник</th></tr></thead><tbody>
 ${list.filter(([n])=>!document.getElementById('cq')?.value||n.toLowerCase().includes(document.getElementById('cq').value.toLowerCase())).slice(0,60)
   .map(([n,bs])=>{const debt=bs.some(b=>b.st==='debt');
   return `<tr onclick="clientCard('${esc(n)}')"><td><b>${esc(n)}</b><div class="sub">${bs.length>1?bs.length+' бокса':'1 бокс'} · ${bs[0].users} польз.</div></td>
   <td class="mono">${bs.map(b=>b.id).join(', ')}</td><td class="right mono">${bs.reduce((a,b)=>a+b.m2,0)} м²</td>
   <td class="right mono"><b>${fmt(bs.reduce((a,b)=>a+b.sum,0))} ₸</b></td><td class="mini">${bs[0].from} – ${bs[0].to||'—'}</td>
   <td><span class="tag ${debt?'red':'green'}">${debt?'закрыт':'открыт'}</span></td><td class="mini">${bs[0].src}</td></tr>`}).join('')}
 </tbody></table></div></div>`};
function clientCard(n){const bs=BOXES.filter(b=>b.cl===n);const debt=bs.filter(b=>b.st==='debt');
 openD(n,`${bs.length} бокс(а) · ${bs.reduce((a,b)=>a+b.m2,0)} м² · ${fmt(bs.reduce((a,b)=>a+b.sum,0))} ₸ в месяц`,['Карточка клиента'],
 `<div class="dg"><div class="det"><small>ТЕЛЕФОН</small><b>+7 70${Math.floor(rnd()*9)} ${Math.floor(100+rnd()*899)} ${Math.floor(10+rnd()*89)} ${Math.floor(10+rnd()*89)}</b></div>
  <div class="det"><small>С НАМИ</small><b>${bs[0].from}</b></div>
  <div class="det"><small>ОПЛАЧЕНО ВСЕГО</small><b>${fmt(bs.reduce((a,b)=>a+b.sum,0)*3)} ₸</b></div>
  <div class="det"><small>СОСТОЯНИЕ</small><b class="${debt.length?'bad':'good'}">${debt.length?'долг '+fmt(debt.reduce((a,b)=>a+b.debt,0))+' ₸':'без долгов'}</b></div></div>
  <div class="ph-title" style="margin:11px 0 7px;font-size:12px">Боксы клиента</div>
  ${bs.map(b=>`<div style="display:flex;gap:9px;align-items:center;padding:9px 0;border-bottom:1px solid #ececea;cursor:pointer" onclick="closeD();openBox('${b.id}')">
   <span class="tag ${b.st==='debt'?'red':'y'}">${b.id}</span><div style="flex:1"><b style="font-size:10px">${WH.find(w=>w.id===b.wh).name} · бокс ${b.num}</b><div class="sub">${b.m2} м² · ${fmt(b.rate)} ₸/м² · период ${b.from} – ${b.to||'—'}</div></div>
   <b class="mono" style="font-size:10px">${fmt(b.sum)} ₸</b></div>`).join('')}
  <div class="ph-title" style="margin:12px 0 7px;font-size:12px">Пользователи с доступом</div>
  <div class="mini">Основной арендатор и ${bs[0].users>1?'ещё '+(bs[0].users-1)+' человек':'без дополнительных лиц'}. Клиент добавляет их сам в кабинете, оператор ничего не заносит вручную.</div>
  <div class="btns" style="margin-top:12px"><button class="btn" onclick="toast('Сообщение отправлено клиенту в WhatsApp.')">Написать в WhatsApp</button><button class="btn" onclick="toast('Счёт отправлен: бокс, период и сумма уже подставлены.')">Выставить счёт</button><button class="btn" onclick="closeD();go('lk')">Открыть его кабинет</button></div>`)}

/* ---- ЗАЯВКИ ---- */
SC.leads=()=>`
 <div class="head"><div><h2>Заявки и продажи</h2><p>Обращения с сайта, Instagram, WhatsApp и звонков попадают в одну воронку с источником. Видно, сколько заявок превращается в заселение и где теряются.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Все новые заявки распределены между менеджерами.')">Распределить</button><button class="btn y" onclick="toast('Заявка создана вручную.')">+ Заявка</button></div></div>
 <div class="strip">
  <div><small>ЗАЯВОК В МЕСЯЦ</small><b>146</b><span>Instagram 38% · сайт 27%</span></div>
  <div><small>НОВЫХ СЕГОДНЯ</small><b>7</b><span>3 без ответа</span></div>
  <div><small>КОНВЕРСИЯ В ЗАСЕЛЕНИЕ</small><b>31%</b><span class="good">цель 30%</span></div>
  <div><small>СРЕДНИЙ ОТВЕТ</small><b>14 мин</b><span>норма до 15</span></div>
  <div><small>СРЕДНИЙ ЧЕК</small><b>38 400 ₸</b><span>в месяц с бокса</span></div>
 </div>
 <div class="g2">
  ${LSTAGES.map((st,i)=>`<div class="panel"><div class="ph"><div><div class="ph-title">${st}</div><div class="ph-sub">${LEADS.filter(l=>l.st===i).length} заявок</div></div></div>
   ${LEADS.filter(l=>l.st===i).map((l,k)=>`<div style="border:1px solid var(--line);background:#fff;padding:10px;margin-bottom:7px;border-radius:4px;cursor:pointer" onclick="leadCard(${LEADS.indexOf(l)})">
    <div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:10.4px">${esc(l.n)}</b><span class="tag ${l.ch==='WhatsApp'?'green':l.ch==='Instagram'?'violet':l.ch==='Сайт'?'blue':''}">${l.ch}</span></div>
    <div class="mini" style="margin-top:5px">${esc(l.need)}</div>
    <div class="sub" style="margin-top:5px">${esc(l.note)} · ${l.t}</div></div>`).join('')||'<p class="mini">Пусто</p>'}
  </div>`).join('')}
 </div>
 <div class="panel"><div class="ph-title">Что даёт подключение каналов</div>
  <div class="hint" style="margin-top:8px"><b>Сейчас:</b> заявка приходит в WhatsApp менеджеру на телефон, ответ зависит от того, увидел он её или нет, а источник фиксируется в лучшем случае в комментарии таблицы. <b>В системе:</b> заявка создаётся автоматически с источником, ставится таймер ответа, а после заселения источник попадает в аналитику — видно, какая реклама реально приносит арендаторов.</div>
 </div>`;
function leadCard(i){const l=LEADS[i];
 openD(l.n,`${l.ch} · ${l.t} · ${LSTAGES[l.st]}`,['Заявка'],
 `<div class="dg"><div class="det"><small>КАНАЛ</small><b>${l.ch}</b></div><div class="det"><small>ЗАПРОС</small><b>${esc(l.need)}</b></div><div class="det"><small>СТАДИЯ</small><b>${LSTAGES[l.st]}</b></div><div class="det"><small>ОТВЕТ</small><b class="${l.st===0?'bad':'good'}">${l.st===0?'ещё не ответили':'в работе'}</b></div></div>
  <div class="note" style="--tone:var(--y)"><b>Комментарий</b><p>${esc(l.note)}</p></div>
  <div class="ph-title" style="margin:12px 0 7px;font-size:12px">Подходящие боксы</div>
  ${BOXES.filter(b=>b.st==='free').slice(0,4).map(b=>`<div style="display:flex;gap:9px;align-items:center;padding:8px 0;border-bottom:1px solid #ececea"><span class="tag green">${b.id}</span><div style="flex:1"><b style="font-size:10px">${WH.find(w=>w.id===b.wh).name} · ${b.m2} м²</b><div class="sub">${fmt(b.sum)} ₸ в месяц</div></div><button class="btn" onclick="closeD();newRent('${b.id}')">Заселить</button></div>`).join('')}
  <div class="btns" style="margin-top:12px"><button class="btn" onclick="toast('Ответ отправлен клиенту в ${l.ch} со ссылкой на свободные боксы.')">Ответить</button><button class="btn" onclick="toast('Заявка передвинута на следующую стадию.')">Следующая стадия</button></div>`)}

/* ---- КАБИНЕТ КЛИЕНТА ---- */
let lkPaid=0;
SC.lk=()=>`
 <div class="head"><div><h2>Кабинет клиента</h2><p>Мобильная веб-версия без приложения: клиент видит свой бокс, срок, сумму и оплачивает в два касания. Здесь же добавляет людей с доступом и загружает фото для Face ID.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Ссылка на кабинет отправлена клиенту в WhatsApp.')">Отправить ссылку клиенту</button></div></div>
 <div class="g2">
  <div class="panel" style="display:grid;place-items:center;padding:20px">
   <div class="phone"><div class="phone-screen">
    <div class="phone-top"><span>09:41</span><span>ZIPSKLAD</span></div>
    <div class="lk-head"><small>МОЙ БОКС</small><h3>Бухар Жырау · № 14</h3><p>6 м² · второй ряд слева · Face ID подключён</p></div>
    <div class="lk-body">
     ${lkPaid?`<div class="lk-card" style="border-color:#a9d6bd;background:#eef7f2"><b class="good">✓ Оплачено до 30 сентября</b><div class="row"><span>Доступ на склад</span><b class="good">открыт</b></div><div class="row"><span>Следующий платёж</span><b>01.10.2026</b></div></div>`
     :`<div class="kaspi"><div class="qr"></div><div><b>Счёт за сентябрь</b><small>36 800 ₸ · до 5 сентября</small></div></div>
      <button class="lk-btn" onclick="lkPay()">Оплатить в Kaspi</button>
      <div class="mini" style="margin:8px 0 12px;text-align:center">Оплата придёт в систему автоматически, доступ продлится сам</div>`}
     <div class="lk-card"><b>Мой договор</b>
      <div class="row"><span>Период</span><b>01.09 – 30.09</b></div>
      <div class="row"><span>Тариф</span><b>6 м² × 9 200 ₸</b></div>
      <div class="row"><span>К оплате</span><b>36 800 ₸</b></div>
      <div class="row"><span>Статус доступа</span><b class="${lkPaid?'good':'warn'}">${lkPaid?'открыт':'откроется после оплаты'}</b></div>
     </div>
     <div class="lk-card"><b>Кто может заходить</b>
      <div class="row"><span>Айгерим С. (я)</span><b class="good">Face ID</b></div>
      <div class="row"><span>Ерлан С. · муж</span><b class="good">Face ID</b></div>
      <div class="row"><span>Курьер · разовый</span><b>до 18:00</b></div>
     </div>
     <button class="lk-btn dark" onclick="toast('Гостевой доступ создан: ссылка отправлена курьеру, действует 3 часа.')">+ Выдать разовый доступ</button>
     <div style="height:8px"></div>
     <button class="lk-btn dark" onclick="toast('Заявка на продление принята: система пересчитает счёт и пришлёт его в Kaspi.')">Продлить аренду</button>
    </div>
   </div></div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Что закрывает кабинет</div>
    ${[['Оплата','Клиент платит сам в Kaspi по ссылке или QR — менеджеру не нужно выставлять счёт вручную и потом искать, кто и за что заплатил.'],
       ['Доступ','Фото для Face ID загружает сам клиент. Он же выдаёт разовый доступ курьеру или родственнику, не звоня оператору.'],
       ['Продление','За 5 дней до конца периода приходит напоминание в WhatsApp со ссылкой. Одно касание — и счёт на следующий период уже в Kaspi.'],
       ['Прозрачность','Клиент видит период, тариф и историю платежей. Меньше споров «я платил» и звонков менеджеру.']]
     .map(x=>`<div class="note" style="--tone:var(--y)"><b>${x[0]}</b><p>${x[1]}</p></div>`).join('')}
   </div>
   <div class="panel" style="margin-top:10px"><div class="ph-title">Приучаем клиентов постепенно</div>
    <p class="mini" style="margin-top:7px">Старым арендаторам ссылка на кабинет уходит вместе со счётом в WhatsApp — заходить никуда не обязательно, оплатить можно прямо из сообщения. Новые получают кабинет сразу при заселении. Через два-три месяца в кабинете оказывается почти вся база, и ручное выставление счетов пропадает совсем.</p>
    <div class="kpi-mini"><div style="--tone:var(--green)"><small>ЦЕЛЬ ПО КАБИНЕТУ</small><b>80%</b></div><div style="--tone:var(--y)"><small>ЭКОНОМИЯ</small><b>15 дней/мес</b></div></div>
   </div>
  </div>
 </div>`;
function lkPay(){lkPaid=1;render();sparks();
 toast('Оплата 36 800 ₸ прошла в Kaspi. Система закрыла начисление и <b>открыла доступ на склад</b> — без звонка оператору.')}

/* ---- АНАЛИТИКА ---- */
SC.analytics=()=>{const s=stat();
 return `<div class="head"><div><h2>Аналитика</h2><p>Все показатели вашей сводной таблицы, только считаются сами: загрузка, ставка за квадрат, отток, источники и прогноз выручки по каждому складу.</p></div>
 <div class="btns"><button class="btn">Сентябрь 2026</button><button class="btn" onclick="toast('Отчёт выгружен в Excel и PDF.')">Экспорт</button><button class="btn y" onclick="toast('Отчёт будет приходить вам в WhatsApp каждый понедельник в 9:00.')">Присылать еженедельно</button></div></div>
 <div class="strip">
  <div><small>ВЫРУЧКА · МЕСЯЦ</small><b>${mln(s.rev)}</b><span class="good">▲ 14% к августу</span></div>
  <div><small>ЗАГРУЗКА</small><b>${s.load}%</b><span>${s.busy} из ${s.total} боксов</span></div>
  <div><small>СТАВКА ЗА М²</small><b>${fmt(s.rev/s.m2)} ₸</b><span class="good">▲ 380 ₸</span></div>
  <div><small>ОТТОК В МЕСЯЦ</small><b>4,2%</b><span>34 бокса освободились</span></div>
  <div><small>СРЕДНИЙ СРОК</small><b>2,8 мес</b><span>LTV 107 500 ₸</span></div>
 </div>
 <div class="g2">
  <div class="panel"><div class="ph"><div><div class="ph-title">Загрузка по складам</div><div class="ph-sub">где есть резерв для роста выручки</div></div></div>
   ${WH.map(w=>{const bs=BOXES.filter(b=>b.wh===w.id),busy=bs.filter(b=>b.st!=='free'&&b.st!=='res');const l=Math.round(busy.length/bs.length*100);
    return `<div style="margin-bottom:9px"><div style="display:flex;justify-content:space-between;font-size:10px"><b>${w.name}</b><span class="mono">${l}% · ${mln(busy.reduce((a,b)=>a+b.sum,0))}</span></div>
    <div class="bar" style="margin-top:4px"><i style="--w:${l}%;--tone:${l>85?'var(--green)':l>60?'var(--y)':'var(--red)'}"></i></div></div>`}).join('')}
   <div class="hint"><b>Прямая подсказка:</b> Жандосова заполнен на треть — это ${mln(BOXES.filter(b=>b.wh==='new'&&b.st==='free').reduce((a,b)=>a+b.sum,0))} недополученной выручки в месяц. Реклама на район окупается за две недели.</div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Прогноз выручки</div><div class="ph-sub">с учётом окончания договоров и брони</div></div><span class="tag y">3 месяца</span></div>
   <div class="chart">${[['сен',88,80],['окт',92,0],['ноя',96,0],['дек',100,0]].map(m=>`<div class="chart-col"><i style="--h:${m[1]}%;--p:${m[2]}%"></i><span>${m[0]}</span></div>`).join('')}</div>
   <div class="kpi-mini"><div style="--tone:var(--y)"><small>ПРОГНОЗ ДЕКАБРЬ</small><b>28,4 млн</b></div><div style="--tone:var(--green)"><small>ПРИ ЗАПОЛНЕНИИ НОВОГО</small><b>+3,8 млн</b></div></div>
   <div class="hint"><b>Считается из договоров:</b> система знает, у кого когда заканчивается период, кто продлевается регулярно, а кто съезжает. Прогноз обновляется каждый день, а не собирается руками в конце месяца.</div>
  </div>
 </div>
 <div class="panel"><div class="ph-title">Показатели вашей сводной таблицы — теперь автоматически</div>
  <div class="tw"><table class="data" style="min-width:640px"><thead><tr><th>Показатель</th><th>Было в Google Sheets</th><th>Стало в системе</th></tr></thead><tbody>
  ${[['Загрузка по складу','считали руками, обновляли раз в неделю','пересчёт при каждом заселении и выезде'],
     ['Выручка и начисления','формула в сводной вкладке','из договоров и тарифов, в реальном времени'],
     ['Дебиторка','вручную сверяли с выпиской','из платежей Kaspi, с автоблокировкой доступа'],
     ['Источник клиента','иногда вписывали в комментарий','фиксируется в заявке и попадает в отчёт'],
     ['Срок аренды и отток','не считали','средний срок, LTV и отток по каждому складу'],
     ['Доступы','отдельная колонка, менеджер вносил вручную','связаны с оплатой и Face ID автоматически']]
    .map(r=>`<tr style="cursor:default"><td><b>${r[0]}</b></td><td class="mini">${r[1]}</td><td class="mini" style="color:var(--green)">${r[2]}</td></tr>`).join('')}
  </tbody></table></div>
 </div>`};

/* ---- АДМИНКА ---- */
SC.admin=()=>`
 <div class="head"><div><h2>Админка и связи</h2><p>Новый склад вы добавляете сами: задаёте адрес, сетку боксов, площади и тарифы. Разработчик для этого не нужен.</p></div>
 <div class="btns"><button class="btn dark" onclick="toast('Диагностика: Kaspi активен, WhatsApp активен, телефония не подключена, Face ID работает на двух складах.')">Проверить связи</button><button class="btn y" onclick="addWh()">+ Добавить склад</button></div></div>
 <div class="g2">
  <div class="panel"><div class="ph"><div><div class="ph-title">Склады сети</div><div class="ph-sub">адрес, количество боксов, тариф и уровни</div></div><span class="tag y">${WH.length}</span></div>
   ${WH.map(w=>`<div style="display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #ececea">
    <div style="flex:1"><b style="font-size:10.4px">${w.name}</b><div class="sub">${w.addr} · ${w.boxes} боксов · ${fmt(w.rate)} ₸/м²${w.lvl>1?' · 2 уровня':''}</div></div>
    ${w.face?'<span class="tag violet">Face ID</span>':'<span class="tag">домофон</span>'}
    <button class="btn" onclick="toast('Настройки склада «${w.name}» открыты: сетка боксов, тарифы, скидки и правила доступа.')">Настроить</button></div>`).join('')}
   <div class="hint"><b>Как вы просили:</b> добавление склада не требует нас. Вы открываете объект, вносите боксы и тарифы, привязываете реквизиты нужного ИП — и склад сразу появляется на сайте и в кабинете.</div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Интеграции</div><div class="ph-sub">то, что связывает систему с внешним миром</div></div></div>
   ${[['KSP','Kaspi · платежи и счета','Kaspi Платежи для квитанций, QR и ссылка на оплату; резервный разбор писем об оплате',1],
      ['WA','WhatsApp Business','счета, напоминания и переписка с арендаторами из карточки клиента',1],
      ['SITE','Сайт zipsklad.kz','свободные боксы, онлайн-бронь и заявки приходят прямо в систему',1],
      ['FACE','Face ID и домофоны','открытие двери по лицу, разовые гостевые проходы, журнал',1],
      ['TEL','IP-телефония','входящие звонки с записью и привязкой к клиенту',0],
      ['IG','Instagram Direct','заявки с рекламы попадают в воронку с источником',1],
      ['DOC','Документы','договор и акт формируются автоматически, подписание онлайн',1],
      ['ROL','Роли и доступы','владелец, менеджер, оператор охраны, клиент, администратор',1]]
    .map(x=>`<div style="display:flex;gap:10px;align-items:center;border:1px solid var(--line);background:#fff;padding:10px;margin-bottom:6px;border-radius:4px">
     <div style="width:36px;height:36px;background:var(--ink);color:var(--y);display:grid;place-items:center;font:700 6.6px 'IBM Plex Mono',monospace;flex:none;border-radius:4px">${x[0]}</div>
     <div style="flex:1"><b style="font-size:10px">${x[1]}</b><p class="mini" style="margin:3px 0 0">${x[2]}</p></div>
     <button class="switch ${x[3]?'on':''}" onclick="this.classList.toggle('on');toast('Настройка «${x[1]}» изменена в демо.')"></button></div>`).join('')}
  </div>
 </div>
 <div class="panel dark"><div class="ph"><div><div class="ph-title">Три ИП — одна система</div><div class="ph-sub" style="color:#8b93a1">склады распределены между юрлицами, а вы видите общую картину</div></div><span class="tag y">учтено</span></div>
  <div class="flow" style="margin-top:11px">
   <div class="fbox"><code>ИП ПЕРВОЕ</code><b>3 склада</b><p>Свои реквизиты и свой Kaspi для приёма оплат.</p></div>
   <div class="farr">→</div>
   <div class="fbox main"><code>ZIPSKLAD</code><b>Единая система</b><p>Боксы, клиенты, счета и доступы всех складов в одном окне.</p></div>
   <div class="farr">←</div>
   <div class="fbox"><code>ИП ВТОРОЕ</code><b>2 склада</b><p>Отдельный расчётный счёт, счета уходят от его имени.</p></div>
   <div class="farr">←</div>
   <div class="fbox"><code>ИП ТРЕТЬЕ</code><b>2 склада</b><p>Так же подключается по одному протоколу.</p></div>
  </div>
  <p style="font-size:9px;color:#8b93a1;line-height:1.6;margin-top:11px">Счёт клиенту уходит от того ИП, которому принадлежит склад, а в вашем пульте всё сведено вместе. Добавить четвёртое ИП или новый склад — вопрос настройки, а не разработки.</p>
 </div>`;
function addWh(){openD('Новый склад','Вы добавляете объект сами, без разработчика',['Склад'],
 `<div class="f2"><div class="fld"><small>НАЗВАНИЕ</small><input id="whName" placeholder="Например: Райымбека"></div><div class="fld"><small>АДРЕС</small><input id="whAddr" placeholder="улица, дом"></div></div>
  <div class="f3"><div class="fld"><small>БОКСОВ</small><input id="whCnt" type="number" value="40"></div><div class="fld"><small>ТАРИФ ₸/М²</small><input id="whRate" type="number" value="8500"></div><div class="fld"><small>УРОВНЕЙ</small><select id="whLvl"><option value="1">1</option><option value="2">2 (с надстройкой)</option></select></div></div>
  <div class="fld"><small>ЮРЛИЦО ДЛЯ СЧЕТОВ</small><select><option>ИП первое</option><option>ИП второе</option><option>ИП третье</option><option>+ добавить новое</option></select></div>
  <div class="note" style="--tone:var(--y)"><b>После сохранения</b><p>Склад появится на сайте и в пульте, боксы можно будет заселять, а счета пойдут от выбранного ИП с его реквизитами Kaspi.</p></div>
  <div class="btns" style="margin-top:12px"><button class="btn y" onclick="saveWh()">Создать склад</button><button class="btn" onclick="closeD()">Отмена</button></div>`)}
function saveWh(){const n=document.getElementById('whName').value.trim()||'Новый склад';
 const cnt=+document.getElementById('whCnt').value||40,rate=+document.getElementById('whRate').value||8500,lvl=+document.getElementById('whLvl').value||1;
 const id='w'+(WH.length+1);
 WH.push({id,name:n,addr:document.getElementById('whAddr').value.trim()||'адрес уточняется',boxes:cnt,busy:0,m2:cnt*6,rate,lvl,face:1});
 for(let i=1;i<=cnt;i++){const m2=[2,3,4,6,9,12][i%6];
  BOXES.push({id:id+'-'+String(i).padStart(3,'0'),wh:id,num:i,m2,st:'free',cl:null,rate,sum:m2*rate,from:null,to:null,lvl:lvl>1&&i>cnt/2?2:1,debt:0,users:0,src:'—'})}
 closeD();whF=id;render();sparks();
 toast(`Склад <b>${esc(n)}</b> создан: ${cnt} боксов, тариф ${fmt(rate)} ₸/м². Уже виден на сайте и готов к заселению.`)}

/* ===== КАРКАС ===== */
function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([n,r],i)=>`<button class="role" onclick="enter('${n}')"><code>0${i+1}</code><b>${n}</b><span>${r.note}</span></button>`).join('')}
function renderDoors(){const d=document.getElementById('doors');if(!d)return;
 d.innerHTML=Array.from({length:16},(_,i)=>{const st=i===5?'warn':[0,2,3,6,7,9,10,12,13,15].includes(i)?'on':'';
  return `<div class="door ${st}"><i>${String(i+1).padStart(2,'0')}</i></div>`}).join('')}
function enter(n){role=n;const r=ROLES[n];
 document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');
 document.getElementById('rav').textContent=r.av;document.getElementById('rname').textContent=r.n;document.getElementById('rrole').textContent=n;
 buildNav();const q=new URLSearchParams(location.search).get('s');go(q&&r.s.includes(q)?q:r.s[0]);
 toast(`Роль <b>${n}</b>: показаны только ваши разделы. Переключить можно в правом верхнем углу.`)}
function buildNav(){const al=ROLES[role].s;
 document.getElementById('nav').innerHTML=NAV.map(([g,items])=>{const x=items.filter(i=>al.includes(i[0]));
  return x.length?`<div class="nav-group">${g}</div>`+x.map(i=>`<button class="nav-item" data-go="${i[0]}" onclick="go('${i[0]}')"><span class="nav-code">${i[1]}</span><span>${i[2]}</span>${i[3]?`<span class="nav-badge">${i[3]}</span>`:'<span></span>'}</button>`).join(''):''}).join('');
 const s=document.getElementById('rsel');s.innerHTML=Object.keys(ROLES).map(n=>`<option ${n===role?'selected':''}>${n}</option>`).join('');s.onchange=()=>enter(s.value)}
function go(s){if(!ROLES[role].s.includes(s))s=ROLES[role].s[0];cur=s;
 document.getElementById('ttl').textContent=TITLES[s][0];document.getElementById('sub').textContent=TITLES[s][1];
 document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('on',x.dataset.go===s));
 render();document.getElementById('rail').classList.remove('open');document.getElementById('content').scrollTop=0;
 try{const u=new URL(location.href);u.searchParams.set('s',s);history.replaceState(null,'',u.pathname+'?'+u.searchParams.toString())}catch(e){}}
function render(){const sc=document.getElementById('content').scrollTop;
 document.getElementById('content').innerHTML=`<div class="screen">${SC[cur]?SC[cur]():'<p class="mini">Раздел в разработке.</p>'}</div>`;
 document.getElementById('content').scrollTop=sc}
function openD(t,s,tabs,body){document.getElementById('dt').textContent=t;document.getElementById('ds').textContent=s;
 document.getElementById('dtabs').innerHTML=tabs.map((x,i)=>`<button class="dtab ${i===0?'on':''}">${x}</button>`).join('');
 document.getElementById('db').innerHTML=body;document.getElementById('dbg').classList.add('show')}
function closeD(){document.getElementById('dbg').classList.remove('show')}
let tt;function toast(h){const t=document.getElementById('toast');t.innerHTML=h;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),4000)}
function sparks(){const c=['#ffc328','#ff7a2f','#ffd977','#2e9e6b','#fff','#ffb300'];
 for(let i=0;i<70;i++){const s=document.createElement('i');s.className='spark';
  s.style.cssText=`left:${Math.random()*100}vw;top:-14px;background:${c[i%6]};animation-delay:${Math.random()*.45}s;transform:rotate(${Math.random()*360}deg)`;
  document.body.appendChild(s);setTimeout(()=>s.remove(),2400)}}
/* ТУР */
const TOUR=[
 ['wh','<b>Шаг 1.</b> Вместо шести вкладок таблицы — план склада. Жёлтые боксы заняты, красные с долгом, зелёные свободны. Нажмите на любой — внутри арендатор, период, тариф и доступы.',5000],
 ['billing','<b>Шаг 2 · главная боль.</b> Счета за месяц. Сейчас это 15 дней работы двух менеджеров. Здесь — одна кнопка: по каждому боксу свой тариф, своя площадь и свой период.',5000],
 ['pay','<b>Шаг 3.</b> Оплата приходит из Kaspi и сама привязывается к боксу и периоду — даже если платил не сам арендатор. Начисление закрывается автоматически.',4800],
 ['access','<b>Шаг 4.</b> Оплатил — Face ID пускает через 0,8 секунды. Не оплатил — дверь не открылась. Оператор больше не сверяет таблицу вручную.',4800],
 ['lk','<b>Шаг 5.</b> Кабинет арендатора в телефоне: счёт, оплата в Kaspi, продление и выдача разового доступа курьеру — без звонков вам.',4800],
 ['analytics','<b>Итог.</b> Все показатели вашей сводной таблицы считаются сами, плюс отток, LTV и прогноз выручки по каждому складу.',5200]
];
let tourT=null,tourI=0;
function tour(){if(tourT){stopTour();return}tourI=0;document.getElementById('tourBtn').textContent='■ Остановить';step()}
function step(){if(tourI>=TOUR.length){stopTour();sparks();toast('<b>Весь цикл</b> — от заселения до оплаты и доступа — внутри одной системы. Google Sheets больше не нужен.');return}
 const [scr,txt,ms]=TOUR[tourI++];if(ROLES[role].s.includes(scr))go(scr);toast(txt);tourT=setTimeout(step,ms)}
function stopTour(){clearTimeout(tourT);tourT=null;const b=document.getElementById('tourBtn');if(b)b.textContent='▶ Сценарий'}
document.getElementById('menuBtn').onclick=()=>document.getElementById('rail').classList.toggle('open');
renderRoles();renderDoors();
(function(){const q=new URLSearchParams(location.search).get('s');if(q&&TITLES[q])enter('Владелец сети')})();
