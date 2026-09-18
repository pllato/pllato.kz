/* ОБЪЕКТ — производственная система подрядчика коммерческой отделки.
   Демо-макет для Олжаса по встрече 17 сентября 2026.
   Воронка начинается не с лида, а с подписанного объекта. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const num=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const mln=n=>num(n/1000000)+' млн';
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};
const days=n=>n+' '+plural(n,['день','дня','дней']);

const SEC=[
 {k:'dash', ic:'▦', n:'Пульт',     sub:[['dash','Девять объектов'],['today','Что горит сегодня']]},
 {k:'obj',  ic:'◧', n:'Объекты',   sub:[['funnel','Производственная воронка'],['card','Карточка объекта'],['gantt','График работ'],['passport','Паспорт объекта']]},
 {k:'est',  ic:'₸', n:'Смета и факт',sub:[['estfact','Смета против факта'],['est','Смета по разделам'],['volumes','Объёмы и закрытие'],['extra','Допработы и изменения']]},
 {k:'men',  ic:'☗', n:'Люди',      sub:[['crews','Бригады и загрузка'],['foreman','Экран прораба'],['wa','Факт через WhatsApp'],['tabel','Табель и выработка']]},
 {k:'sup',  ic:'▤', n:'Снабжение', sub:[['req','Заявки с объектов'],['purch','Закуп и поставки'],['stock','Материал на объекте']]},
 {k:'acc',  ic:'☑', n:'Приёмка',   sub:[['hidden','Скрытые работы'],['accept','Сдача заказчику'],['defects','Замечания и переделки'],['photo','Фотоотчёт']]},
 {k:'fin',  ic:'◈', n:'Деньги',    sub:[['pay','Платежи по объекту'],['debt','Дебиторка и авансы'],['cash','Кассовый календарь']]},
 {k:'an',   ic:'▥', n:'Аналитика', sub:[['margin','Маржа по объектам'],['delays','Почему сорвали срок'],['cap','Сколько ещё потянем']]},
 {k:'set',  ic:'⚙', n:'Настройки', sub:[['roles','Права доступа'],['integr','Интеграции'],['migr','Переход с Битрикса'],['stack','Состав релиза']]}
];
const SECOF={},SUBN={};
SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));

const ROLES={
 'Владелец':{av:'ОЛ',n:'Олжас',r:'собственник',note:'Все девять объектов, смета против факта, сроки, деньги и маржа по каждому объекту',
  s:['dash','today','funnel','card','gantt','passport','estfact','est','volumes','extra','crews','foreman','wa','tabel','req','purch','stock','hidden','accept','defects','photo','pay','debt','cash','margin','delays','cap','roles','integr','migr','stack']},
 'Руководитель проектов':{av:'АС',n:'Аскар',r:'ведёт 4–5 объектов',note:'Свои объекты: график, бригады, закупки, приёмка и закрытие. Без маржи и зарплат',
  s:['dash','today','funnel','card','gantt','passport','estfact','volumes','extra','crews','foreman','wa','tabel','req','purch','stock','hidden','accept','defects','photo','delays']},
 'Прораб':{av:'ЕР',n:'Ержан',r:'на объекте, не в офисе',note:'Только свой объект и только то, что нужно сегодня: объём, люди, материал, фото',
  s:['foreman','wa','card','photo','req','stock','hidden']},
 'ПТО и сметчик':{av:'ГМ',n:'Гульмира',r:'считает и закрывает объёмы',note:'Сметы, расценки, объёмы, акты и допработы. Видит себестоимость, не видит маржу компании',
  s:['dash','funnel','card','est','estfact','volumes','extra','hidden','accept','gantt','passport']},
 'Снабжение':{av:'НР',n:'Нурлан',r:'закупает и возит',note:'Заявки с объектов, закуп, поставки и остатки. Видит цены закупа, не видит сметы продажи',
  s:['today','req','purch','stock','crews','card','cash']},
 'Бухгалтер':{av:'АЛ',n:'Асель',r:'деньги и документы',note:'Платежи, авансы, дебиторка, акты и табель. Без производственной части',
  s:['pay','debt','cash','tabel','accept','volumes','card']}
};
let role='Владелец',cur='dash',theme='light';

/* ====== ДЕВЯТЬ ОБЪЕКТОВ ====== */
/* st: этап воронки; p — план по договору; f — освоено фактом; d — дней до сдачи (минус = просрочка) */
const STAGES=[['zam','Замер'],['sm','Смета'],['dog','Договор'],['mob','Мобилизация'],['chern','Черновые'],['chist','Чистовые'],['sda','Сдача'],['gar','Гарантия']];
const OBJ=[
 {id:'O-141',n:'Starbucks · ТРЦ Достык Плаза',t:'кофейня',m2:180,st:'chist',pm:'Аскар',pr:'Ержан',p:30040000,f:22444300,cost:18070000,d:4,ready:78,start:'25.08',end:'22.09',cl:'Alliance Coffee',risk:'ok',crew:9},
 {id:'O-138',n:'KFC · Сайран',t:'фудкорт',m2:240,st:'chern',pm:'Аскар',pr:'Серик',p:34200000,f:16800000,cost:15100000,d:11,ready:49,start:'02.09',end:'29.09',cl:'QSR Kazakhstan',risk:'warn',crew:12},
 {id:'O-133',n:'Офис КазМунайГаз Сервис',t:'офис',m2:620,st:'chern',pm:'Динара',pr:'Марат',p:71500000,f:38200000,cost:34700000,d:19,ready:53,start:'18.08',end:'07.10',cl:'КМГ Сервис',risk:'ok',crew:16},
 {id:'O-144',n:'Ресторан Ткемали',t:'ресторан',m2:310,st:'mob',pm:'Динара',pr:'Ержан',p:41800000,f:3100000,cost:2800000,d:26,ready:8,start:'15.09',end:'14.10',cl:'ИП Мамедов',risk:'ok',crew:5},
 {id:'O-129',n:'Отделение Банк ЦентрКредит',t:'банк',m2:210,st:'sda',pm:'Аскар',pr:'Серик',p:26900000,f:25800000,cost:22400000,d:-2,ready:96,start:'04.08',end:'15.09',cl:'БЦК',risk:'bad',crew:4},
 {id:'O-146',n:'Аптека Европа · Абая',t:'аптека',m2:95,st:'dog',pm:'Аскар',pr:'—',p:11200000,f:0,cost:0,d:34,ready:0,start:'22.09',end:'22.10',cl:'Europharma',risk:'ok',crew:0},
 {id:'O-136',n:'Коворкинг SmartSpace',t:'коворкинг',m2:480,st:'chist',pm:'Динара',pr:'Марат',p:52300000,f:40100000,cost:36900000,d:8,ready:71,start:'11.08',end:'26.09',cl:'SmartSpace KZ',risk:'warn',crew:11},
 {id:'O-148',n:'Магазин Kari · Мега',t:'ритейл',m2:160,st:'sm',pm:'Динара',pr:'—',p:14600000,f:0,cost:0,d:41,ready:0,start:'29.09',end:'29.10',cl:'Kari Retail',risk:'ok',crew:0},
 {id:'O-131',n:'Клиника Сункар',t:'медицина',m2:340,st:'gar',pm:'Аскар',pr:'Марат',p:44700000,f:44700000,cost:38100000,d:0,ready:100,start:'07.07',end:'02.09',cl:'МЦ Сункар',risk:'ok',crew:0}
];
const O=id=>OBJ.find(o=>o.id===id)||OBJ[0];
let curObj='O-141';

/* ====== РАЗДЕЛЫ СМЕТЫ ====== */
/* по объекту O-141: план, выполнено %, освоено, себестоимость факт */
const EST=[
 {r:'Демонтаж',p:1850000,done:100,f:1850000,c:1370000,u:'компл'},
 {r:'Черновые стены и перегородки',p:3420000,done:100,f:3420000,c:2600000,u:'м²'},
 {r:'Полы: стяжка и подготовка',p:2960000,done:100,f:2960000,c:2280000,u:'м²'},
 {r:'Электрика и щитовая',p:4780000,done:92,f:4397600,c:3560000,u:'точек'},
 {r:'Слаботочка и видеонаблюдение',p:1640000,done:74,f:1213600,c:960000,u:'точек'},
 {r:'Вентиляция и кондиционирование',p:5120000,done:81,f:4147200,c:3650000,u:'компл'},
 {r:'Водоснабжение и канализация',p:1980000,done:100,f:1980000,c:1560000,u:'точек'},
 {r:'Потолки',p:2240000,done:58,f:1299200,c:1080000,u:'м²'},
 {r:'Чистовая отделка стен',p:2870000,done:41,f:1176700,c:1010000,u:'м²'},
 {r:'Напольные покрытия',p:1560000,done:0,f:0,c:0,u:'м²'},
 {r:'Двери и витражи',p:980000,done:0,f:0,c:0,u:'шт'},
 {r:'Вывеска и навигация',p:640000,done:0,f:0,c:0,u:'компл'}
];

/* ====== ГРАФИК РАБОТ (три недели) ====== */
const GANTT=[
 {w:'Демонтаж и вывоз',s:0,l:3,fact:3,cr:'Бригада 1',st:'done'},
 {w:'Перегородки и черновые стены',s:2,l:5,fact:5,cr:'Бригада 1',st:'done'},
 {w:'Электрика: штробы и трассы',s:4,l:6,fact:7,cr:'Электрики',st:'done'},
 {w:'Стяжка пола',s:6,l:4,fact:4,cr:'Бригада 2',st:'done'},
 {w:'Вентиляция: магистрали',s:7,l:6,fact:8,cr:'Подряд ОВиК',st:'late'},
 {w:'Сантехника: разводка',s:9,l:4,fact:4,cr:'Сантехники',st:'done'},
 {w:'Слаботочка',s:12,l:4,fact:3,cr:'Электрики',st:'go'},
 {w:'Потолки: каркас и зашивка',s:14,l:5,fact:3,cr:'Бригада 2',st:'go'},
 {w:'Чистовая отделка стен',s:16,l:6,fact:2,cr:'Отделочники',st:'go'},
 {w:'Напольные покрытия',s:20,l:4,fact:0,cr:'Бригада 2',st:'plan'},
 {w:'Двери и витражи',s:22,l:3,fact:0,cr:'Подряд',st:'plan'},
 {w:'Вывеска',s:23,l:2,fact:0,cr:'Подряд',st:'plan'},
 {w:'Уборка и сдача',s:25,l:2,fact:0,cr:'Бригада 1',st:'plan'}
];

/* ====== БРИГАДЫ ====== */
const CREW=[
 {n:'Бригада 1 · общестрой',br:'Асхат',men:6,obj:'O-141',free:0,rate:14500,spec:'демонтаж, стены, стяжка'},
 {n:'Бригада 2 · отделка',br:'Канат',men:5,obj:'O-141',free:0,rate:16200,spec:'потолки, шпаклёвка, покраска'},
 {n:'Электрики',br:'Руслан',men:4,obj:'O-138',free:1,rate:19800,spec:'силовая, слаботочка, щиты'},
 {n:'Сантехники',br:'Бекзат',men:3,obj:'O-133',free:0,rate:18400,spec:'водоснабжение, канализация'},
 {n:'Бригада 3 · общестрой',br:'Дархан',men:7,obj:'O-133',free:0,rate:14500,spec:'общестрой'},
 {n:'Бригада 4 · отделка',br:'Ерлан',men:6,obj:'O-136',free:2,rate:16200,spec:'отделка, полы'},
 {n:'Подряд ОВиК · «Климат Про»',br:'внешние',men:5,obj:'O-141',free:0,rate:0,spec:'вентиляция, кондиционирование'},
 {n:'Подряд · витражи «АлюмСтрой»',br:'внешние',men:3,obj:'O-129',free:0,rate:0,spec:'двери, витражи, фасад'}
];

/* ====== ЗАЯВКИ НА МАТЕРИАЛ ====== */
const REQ=[
 {id:'З-902',o:'O-141',w:'Профиль потолочный ПП 60×27',q:'180 шт',by:'Ержан',at:'сегодня 08:12',st:'new',need:'19.09',sum:126000,note:'по смете есть, остаток кончился'},
 {id:'З-901',o:'O-141',w:'Краска Dulux матовая, белая',q:'14 вёдер',by:'Ержан',at:'сегодня 08:10',st:'new',need:'20.09',sum:238000,note:''},
 {id:'З-899',o:'O-138',w:'Кабель ВВГнг 3×2,5',q:'420 м',by:'Серик',at:'вчера 17:48',st:'buy',need:'19.09',sum:310800,note:'сверх сметы на 60 м — трасса изменилась'},
 {id:'З-897',o:'O-133',w:'Гипсокартон ГКЛВ 12,5 мм',q:'210 листов',by:'Марат',at:'вчера 16:20',st:'way',need:'18.09',sum:441000,note:''},
 {id:'З-896',o:'O-136',w:'Ламинат 33 класс, дуб',q:'340 м²',by:'Марат',at:'16.09 09:05',st:'way',need:'19.09',sum:1428000,note:'заказчик утвердил образец'},
 {id:'З-893',o:'O-141',w:'Светильники трековые',q:'46 шт',by:'Ержан',at:'15.09 11:30',st:'got',need:'17.09',sum:874000,note:''},
 {id:'З-890',o:'O-129',w:'Плинтус алюминиевый',q:'85 м',by:'Серик',at:'14.09 14:12',st:'got',need:'16.09',sum:212500,note:''}
];
const RST={new:['Новая','var(--warn)'],buy:['В закупе','var(--acc)'],way:['В пути','var(--violet)'],got:['На объекте','var(--ok)']};
const SC={};
const seeMoney=()=>['Владелец','Бухгалтер'].indexOf(role)>=0;
const seeMargin=()=>role==='Владелец';
const RISKC={ok:'var(--ok)',warn:'var(--warn)',bad:'var(--bad)'};
const stName=k=>(STAGES.find(s=>s[0]===k)||['','—'])[1];
const dTag=d=>d<0?`<span class="tag" style="background:var(--bad-l);color:var(--bad)">просрочка ${Math.abs(d)} дн</span>`
 :d===0?`<span class="tag" style="background:var(--ok-l);color:var(--ok)">сдан</span>`
 :d<=5?`<span class="tag" style="background:var(--warn-l);color:var(--warn)">${days(d)}</span>`
 :`<span class="tag">${days(d)}</span>`;
const barHtml=(p,c)=>`<div class="bar"><i style="display:block;height:100%;width:${Math.min(100,p)}%;background:${c||'var(--brand2)'}"></i></div>`;

/* ====== ПУЛЬТ ====== */
SC.dash=()=>{
 const act=OBJ.filter(o=>['mob','chern','chist','sda'].indexOf(o.st)>=0);
 const pSum=act.reduce((a,o)=>a+o.p,0), fSum=act.reduce((a,o)=>a+o.f,0);
 const late=OBJ.filter(o=>o.d<0).length, soon=OBJ.filter(o=>o.d>0&&o.d<=5).length;
 const men=OBJ.reduce((a,o)=>a+o.crew,0);
 return `<div class="hd"><div><h2>Девять объектов · 18 сентября 2026</h2>
 <p>Один экран вместо обхода прорабов и переписки в WhatsApp. Всё, что здесь видно, собирается само — из отметок объёмов, заявок на материал, поставок и платежей. Ничего из этого не набирается руками в офисе.</p></div>
 <div class="btns"><button class="bt" onclick="go('today')">Что горит сегодня</button><button class="bt p" onclick="go('funnel')">Производственная воронка</button></div></div>
<div class="wid">
 <div><small>Объектов в работе</small><b class="a">${act.length}</b><span>всего в системе ${OBJ.length} · ${OBJ.filter(o=>o.st==='gar').length} на гарантии</span></div>
 <div><small>Людей на объектах</small><b>${men}</b><span>8 бригад, из них 2 подрядные</span></div>
 <div><small>Срок под угрозой</small><b class="${late?'r':'w'}">${late+soon}</b><span>${late} просрочен · ${soon} на грани</span></div>
 <div><small>Освоено по договорам</small><b>${mln(fSum)} ₸</b><span>из ${mln(pSum)} ₸ · ${Math.round(fSum/pSum*100)}%</span></div>
 ${seeMargin()?`<div><small>Маржа по активным</small><b class="g">${mln(act.reduce((a,o)=>a+o.f-o.cost,0))} ₸</b><span>считается каждый день, а не в конце</span></div>`
  :`<div><small>Заявок на материал</small><b class="w">${REQ.filter(r=>r.st==='new').length}</b><span>ждут решения снабжения</span></div>`}
</div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 4px">Объекты по срокам</h3>
  <p class="mini" style="margin:0 0 10px">Отсортированы по тому, что раньше сгорит. Цвет слева — состояние срока, а не этапа: объект может быть на 96% готов и всё равно быть красным.</p>
  ${OBJ.filter(o=>o.st!=='gar').sort((a,b)=>a.d-b.d).map(o=>`<div class="dl" style="--c:${RISKC[o.risk]}" onclick="openObj('${o.id}')">
   <div style="flex:1;min-width:0"><b style="font-size:12.2px">${esc(o.n)}</b>
    <div class="mini">${esc(o.t)} · ${o.m2} м² · ${stName(o.st)} · прораб ${esc(o.pr)} · сдача ${o.end}</div></div>
   <div style="width:128px">${barHtml(o.ready,RISKC[o.risk])}<div class="mini" style="text-align:right;margin-top:3px">${o.ready}%</div></div>
   <div style="width:104px;text-align:right">${dTag(o.d)}</div></div>`).join('')}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Сегодня в системе</h3>
   <div class="kv"><span>Объёмы отметили прорабы</span><b>3 из 5</b></div>
   <div class="kv"><span>Новых заявок на материал</span><b style="color:var(--warn)">${REQ.filter(r=>r.st==='new').length}</b></div>
   <div class="kv"><span>Поставок сегодня</span><b>2</b></div>
   <div class="kv"><span>Скрытых работ к освидетельствованию</span><b>1</b></div>
   <div class="kv"><span>Замечаний заказчика открыто</span><b style="color:var(--bad)">4</b></div>
   <div class="kv" style="border:0"><span>Актов на подпись</span><b>2</b></div>
   <button class="bt p" style="width:100%;margin-top:11px" onclick="go('today')">Открыть список дел</button>
  </div>
  <div class="pan" style="background:var(--rail);color:#dce7ec;border-color:var(--rail)">
   <h3 style="margin:0 0 7px;color:#fff">Почему воронка, а не CRM</h3>
   <p class="mini" style="color:#a9bcc8;margin:0">Ваши слова: «Мне нужна производственная воронка, в которую по факту попадает заказ, и мы его отрабатываем». Здесь первая стадия — не лид, а замер по уже полученному заказу. Стадии продаж нет вовсе: она вам не нужна, заказы идут по знакомству.</p>
  </div>
 </div>
</div>
<div class="said"><b>Это главный экран.</b> Вы говорили, что хотите видеть смету, факт исполнения и график. Здесь верхний уровень: девять объектов и где горит. Клик по любой строке — и внутри смета против факта по каждому разделу, график на три недели и что именно тормозит.</div>`;
};

SC.today=()=>`<div class="hd"><div><h2>Что горит сегодня · четверг, 18 сентября</h2>
 <p>Список того, что требует решения именно от вас или от руководителя проектов. Собирается из отклонений: сорванный срок, заявка сверх сметы, непринятые скрытые работы, просроченный платёж.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Отмечено как разобранное. В реальной системе список пустеет по мере решения, а нерешённое к вечеру уходит вам в WhatsApp одним сообщением.')">Разобрал всё</button></div></div>
<div class="g2">
 <div>
  <div class="tsk" style="--c:var(--bad)"><b>Банк ЦентрКредит · просрочка 2 дня</b>
   <p class="mini" style="margin:5px 0 8px">Готовность 96%. Держат две позиции: витражи от подрядчика «АлюмСтрой» приехали с браком, и не подписан акт скрытых работ по слаботочке. Заказчик уже написал письмо.</p>
   <button class="bt" onclick="openObj('O-129')">Открыть объект</button> <button class="bt" onclick="toast('Подрядчику «АлюмСтрой» отправлена претензия с фото брака и требованием замены за их счёт. Срок — 2 дня. В системе это фиксируется и попадает в историю подрядчика: в следующий раз видно, кто срывал.')">Претензия подрядчику</button></div>
  <div class="tsk" style="--c:var(--warn)"><b>KFC Сайран · отставание 3 дня по графику</b>
   <p class="mini" style="margin:5px 0 8px">Вентиляция начата на 3 дня позже: ждали согласование трассы с ТРЦ. Критический путь сместился, сдача 29.09 под угрозой. Нагнать можно второй сменой на потолках.</p>
   <button class="bt" onclick="go('gantt')">Показать на графике</button> <button class="bt" onclick="toast('Вторая смена на потолках поставлена в график с 20.09. Пересчёт: сдача возвращается на 29.09, перерасход по ФОТ +340 000 ₸. Это решение видно в карточке объекта — потом не будет вопроса «почему вышли дороже».')">Поставить вторую смену</button></div>
  <div class="tsk" style="--c:var(--warn)"><b>Заявка сверх сметы · KFC Сайран</b>
   <p class="mini" style="margin:5px 0 8px">Кабель ВВГнг 3×2,5 — 420 м вместо 360 по смете. Трасса изменилась после согласования с арендодателем. Перерасход 44 400 ₸. Нужно решение: списать в свой минус или оформить допработой заказчику.</p>
   <button class="bt p" onclick="toast('Оформлено допработой: позиция уходит в дополнительное соглашение к договору, сумма 52 000 ₸ с наценкой. Пока заказчик не подписал — материал закупается, но в смету продажи не попадает.')">Оформить допработой</button> <button class="bt" onclick="toast('Списано в наш минус. Сумма 44 400 ₸ ушла в перерасход по объекту и видна в марже. Так накапливается статистика: по какому разделу мы чаще всего промахиваемся в смете.')">Списать в минус</button></div>
 </div>
 <div>
  <div class="tsk" style="--c:var(--acc)"><b>Скрытые работы · Starbucks Достык</b>
   <p class="mini" style="margin:5px 0 8px">Электрика за подвесным потолком готова к освидетельствованию. Пока не подписан акт — потолок зашивать нельзя, а бригада отделки уже на объекте и простаивает с завтрашнего дня.</p>
   <button class="bt p" onclick="go('hidden')">Вызвать технадзор</button></div>
  <div class="tsk" style="--c:var(--acc)"><b>Коворкинг SmartSpace · ламинат в пути</b>
   <p class="mini" style="margin:5px 0 8px">340 м² выехали со склада поставщика, ожидание завтра до 12:00. Бригада отделки освободится сегодня вечером — если материал не придёт, простой 6 человек.</p>
   <button class="bt" onclick="toast('Поставщику отправлен запрос подтверждения времени. При срыве система сама предложит переставить бригаду на другой объект — она знает, где есть фронт работ.')">Подтвердить поставку</button></div>
  <div class="tsk" style="--c:var(--violet)"><b>Деньги · два счёта на подпись</b>
   <p class="mini" style="margin:5px 0 8px">КМГ Сервис — второй промежуточный платёж 18 400 000 ₸, документы готовы. Alliance Coffee — задержка оплаты 9 дней по первому этапу, 8 500 000 ₸.</p>
   <button class="bt" onclick="go('debt')">Открыть дебиторку</button></div>
  <div class="note" style="--tone:var(--brand)"><b>Откуда берётся этот список</b>
   <p class="mini" style="margin:5px 0 0">Никто его не составляет. Система сравнивает график с фактом, заявки со сметой, даты платежей с договором — и показывает только расхождения. Если всё идёт по плану, экран пустой, и это нормально.</p></div>
 </div>
</div>`;

/* ====== ПРОИЗВОДСТВЕННАЯ ВОРОНКА ====== */
SC.funnel=()=>{
 const cols=STAGES.map(([k,n])=>{
  const list=OBJ.filter(o=>o.st===k);
  const sum=list.reduce((a,o)=>a+o.p,0);
  return `<div><div class="phead" style="background:${k==='gar'?'var(--ok)':k==='sda'?'var(--acc)':k==='chist'||k==='chern'?'var(--brand)':'var(--rail-h)'}">${esc(n)} · ${list.length}${sum?` · ${mln(sum)} ₸`:''}</div>
  <div class="pbody" style="background:var(--card2)">${list.map(o=>`<div class="pc" onclick="openObj('${o.id}')" draggable="true">
   <b style="font-size:11.4px;display:block;line-height:1.35">${esc(o.n)}</b>
   <div class="mini" style="margin-top:3px">${o.m2} м² · ${mln(o.p)} ₸</div>
   <div class="mini" style="margin-top:2px">${esc(o.pr==='—'?'прораб не назначен':'прораб '+o.pr)}</div>
   <div style="margin-top:6px">${dTag(o.d)}</div></div>`).join('')||'<div class="mini" style="padding:11px;text-align:center;color:var(--muted2)">пусто</div>'}</div></div>`;
 }).join('');
 return `<div class="hd"><div><h2>Производственная воронка</h2>
 <p>Восемь стадий от замера до окончания гарантии. Карточка объекта тянется мышкой между стадиями — при переходе система требует то, без чего дальше нельзя: на «Договор» — подписанный договор и смету, на «Сдачу» — закрытые скрытые работы.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Стадии настраиваются под вас: можно добавить «Проект», «Согласование с ТРЦ» или «Пусконаладка». Мы сделаем те, что есть в вашей работе, а не те, что придумали за вас.')">Настроить стадии</button><button class="bt p" onclick="go('dash')">К списку объектов</button></div></div>
<div class="pipe">${cols}</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 8px">Что система требует при переходе</h3>
  <div class="kv"><span>Замер → Смета</span><b class="mono" style="font-size:11px">обмерный план, фото</b></div>
  <div class="kv"><span>Смета → Договор</span><b class="mono" style="font-size:11px">утверждённая смета</b></div>
  <div class="kv"><span>Договор → Мобилизация</span><b class="mono" style="font-size:11px">договор, аванс, график</b></div>
  <div class="kv"><span>Мобилизация → Черновые</span><b class="mono" style="font-size:11px">бригада, допуск на объект</b></div>
  <div class="kv"><span>Черновые → Чистовые</span><b class="mono" style="font-size:11px">акты скрытых работ</b></div>
  <div class="kv"><span>Чистовые → Сдача</span><b class="mono" style="font-size:11px">исполнительная, чек-лист</b></div>
  <div class="kv" style="border:0"><span>Сдача → Гарантия</span><b class="mono" style="font-size:11px">КС-2, КС-3, оплата</b></div>
  <p class="mini" style="margin:10px 0 0">Это не бюрократия ради галочек. Каждый пункт — то, из-за чего у подрядчиков потом не принимают работы и не платят.</p>
 </div>
 <div class="pan"><h3 style="margin:0 0 8px">Почему не Битрикс</h3>
  <p class="mini" style="margin:0 0 9px">Ваши слова: «У него основной функционал — это привлечение клиентов, воронка продаж, а потом уже как бы обслуживание. Мы пытались Битрикс поженить со всеми этими работами».</p>
  <div class="kv"><span>Стадия «Лид», «Квалификация»</span><b style="color:var(--muted2)">убрана</b></div>
  <div class="kv"><span>Первая стадия воронки</span><b>Замер по заказу</b></div>
  <div class="kv"><span>Единица работы</span><b>объект, не сделка</b></div>
  <div class="kv"><span>Что двигает карточку</span><b>факт работ</b></div>
  <div class="kv" style="border:0"><span>Абонплата за пользователей</span><b style="color:var(--ok)">нет</b></div>
  <button class="bt" style="margin-top:10px" onclick="go('migr')">Как переходим с Битрикса</button>
 </div>
</div>`;
};
/* ====== КАРТОЧКА ОБЪЕКТА ====== */
SC.card=()=>{
 const o=O(curObj);
 const marg=o.f-o.cost, mp=o.f?Math.round(marg/o.f*100):0;
 return `<div class="hd"><div><h2>${esc(o.n)}</h2>
 <p>${esc(o.t)} · ${o.m2} м² · заказчик ${esc(o.cl)} · договор ${mln(o.p)} ₸ · работы ${o.start} — ${o.end}</p></div>
 <div class="btns">
  <select class="rsel" onchange="curObj=this.value;build()">${OBJ.map(x=>`<option value="${x.id}"${x.id===o.id?' selected':''}>${esc(x.n)}</option>`).join('')}</select>
  <button class="bt" onclick="go('gantt')">График</button><button class="bt p" onclick="go('estfact')">Смета и факт</button></div></div>
<div class="wid" style="grid-template-columns:repeat(${seeMargin()?5:4},1fr)">
 <div><small>Готовность</small><b class="a">${o.ready}%</b><span>${stName(o.st)}</span></div>
 <div><small>Срок</small><b class="${o.d<0?'r':o.d<=5?'w':''}">${o.d<0?'−'+Math.abs(o.d):o.d} дн</b><span>сдача ${o.end}</span></div>
 <div><small>Освоено</small><b>${mln(o.f)} ₸</b><span>из ${mln(o.p)} ₸ по договору</span></div>
 <div><small>Людей на объекте</small><b>${o.crew}</b><span>прораб ${esc(o.pr)} · РП ${esc(o.pm)}</span></div>
 ${seeMargin()?`<div><small>Маржа на сегодня</small><b class="${mp<15?'w':'g'}">${mp}%</b><span>${mln(marg)} ₸ · план по смете 22%</span></div>`:''}
</div>
<div class="g21">
 <div>
  <div class="pan"><h3 style="margin:0 0 9px">Разделы работ · коротко</h3>
   ${EST.slice(0,8).map(e=>`<div class="fr"><span>${esc(e.r)}</span>${barHtml(e.done,e.done===100?'var(--ok)':e.done>0?'var(--brand2)':'var(--line2)')}<span class="mono" style="text-align:right;font-size:11px">${e.done}% · ${fmt(e.f)} ₸</span></div>`).join('')}
   <button class="bt" style="margin-top:8px" onclick="go('estfact')">Все 12 разделов со сметой и фактом</button>
  </div>
  <div class="pan"><h3 style="margin:0 0 9px">Лента объекта</h3>
   <div class="tl">
    <div class="tli"><b style="font-size:11.6px">Сегодня 08:12 · Ержан</b><p class="mini" style="margin:2px 0 0">Отметил объём: потолки, каркас — 62 м². Через WhatsApp, одним сообщением. Заявка на профиль ПП 60×27, 180 шт.</p></div>
    <div class="tli"><b style="font-size:11.6px">Вчера 18:04 · система</b><p class="mini" style="margin:2px 0 0">Вентиляция закрыта на 81%. Отставание по разделу 2 дня — подрядчик «Климат Про» вышел позже срока.</p></div>
    <div class="tli"><b style="font-size:11.6px">Вчера 14:30 · Аскар</b><p class="mini" style="margin:2px 0 0">Замечание заказчика: перенести две розетки у барной стойки. Оформлено допработой на 74 000 ₸, заказчик подтвердил в переписке.</p></div>
    <div class="tli"><b style="font-size:11.6px">16.09 09:20 · Нурлан</b><p class="mini" style="margin:2px 0 0">Поставка: светильники трековые 46 шт принята на объекте, фото накладной приложено.</p></div>
    <div class="tli"><b style="font-size:11.6px">15.09 11:00 · Гульмира</b><p class="mini" style="margin:2px 0 0">Подписан акт скрытых работ по электрике в полу. Можно заливать финишный слой.</p></div>
   </div>
  </div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Деньги по объекту</h3>
   <div class="kv"><span>Договор</span><b>${fmt(o.p)} ₸</b></div>
   <div class="kv"><span>Аванс получен</span><b style="color:var(--ok)">${fmt(Math.round(o.p*0.3))} ₸</b></div>
   <div class="kv"><span>Закрыто актами</span><b>${fmt(Math.round(o.f*0.72))} ₸</b></div>
   <div class="kv"><span>Ожидается платёж</span><b style="color:var(--warn)">8 500 000 ₸</b></div>
   ${seeMargin()?`<div class="kv"><span>Затраты факт</span><b>${fmt(o.cost)} ₸</b></div>
   <div class="kv" style="border:0"><span>Маржа</span><b style="color:var(--ok)">${fmt(marg)} ₸</b></div>`:'<div class="kv" style="border:0"><span>Затраты</span><b style="color:var(--muted2)">роли не видны</b></div>'}
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Что тормозит</h3>
   <div class="srow" style="border-left:3px solid var(--warn)"><div><b>Вентиляция</b><div class="mini">подрядчик отстаёт 2 дня</div></div></div>
   <div class="srow" style="border-left:3px solid var(--acc)"><div><b>Скрытые работы</b><div class="mini">ждём технадзор заказчика</div></div></div>
   <div class="srow" style="border-left:3px solid var(--violet)"><div><b>Оплата этапа</b><div class="mini">задержка 9 дней</div></div></div>
   <button class="bt p" style="width:100%;margin-top:9px" onclick="go('delays')">Причины срывов по всем объектам</button>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Документы</h3>
   <div class="kv"><span>Договор и смета</span><b style="color:var(--ok)">✓</b></div>
   <div class="kv"><span>График работ</span><b style="color:var(--ok)">✓</b></div>
   <div class="kv"><span>Акты скрытых работ</span><b>4 из 6</b></div>
   <div class="kv"><span>Допсоглашения</span><b>2</b></div>
   <div class="kv" style="border:0"><span>Исполнительная</span><b style="color:var(--warn)">в работе</b></div>
  </div>
 </div>
</div>`;
};

/* ====== ГРАФИК РАБОТ ====== */
SC.gantt=()=>{
 const o=O(curObj),TOT=27,today=17;
 const col={done:'var(--ok)',go:'var(--brand2)',late:'var(--bad)',plan:'var(--line2)'};
 return `<div class="hd"><div><h2>График работ · ${esc(o.n)}</h2>
 <p>Три недели от мобилизации до сдачи. Серая полоса — план по договору, цветная — факт. Красная вертикаль — сегодня. Видно не «мы отстаём вообще», а какая именно работа тянет срок за собой.</p></div>
 <div class="btns"><select class="rsel" onchange="curObj=this.value;build()">${OBJ.filter(x=>x.st!=='sm'&&x.st!=='dog').map(x=>`<option value="${x.id}"${x.id===o.id?' selected':''}>${esc(x.n)}</option>`).join('')}</select>
 <button class="bt" onclick="toast('Пересчёт критического пути: вентиляция тянет за собой потолки, потолки — отделку, отделка — полы. Сдвиг вентиляции на 2 дня даёт сдвиг сдачи на 2 дня. Чтобы вернуть срок, нужна вторая смена на потолках с 20.09.')">Пересчитать критический путь</button></div></div>
<div class="pan" style="overflow-x:auto">
 <div style="min-width:760px">
  <div style="display:grid;grid-template-columns:215px 1fr;gap:11px;margin-bottom:7px">
   <div class="mini" style="font-weight:700">Работа</div>
   <div style="position:relative;height:17px">
    ${[0,7,14,21].map(d=>`<span class="mini" style="position:absolute;left:${d/TOT*100}%;font-size:9.6px">${d===0?'25.08':d===7?'01.09':d===14?'08.09':'15.09'}</span>`).join('')}
   </div>
  </div>
  ${GANTT.map(g=>{
   const late=g.st==='late';
   return `<div style="display:grid;grid-template-columns:215px 1fr;gap:11px;align-items:center;margin-bottom:6px">
    <div style="font-size:11.4px;min-width:0"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(g.w)}</b><span class="mini">${esc(g.cr)}</span></div>
    <div style="position:relative;height:22px;background:var(--card2);border-radius:4px">
     <i style="position:absolute;left:${g.s/TOT*100}%;width:${g.l/TOT*100}%;top:3px;height:6px;background:var(--line2);border-radius:3px"></i>
     ${g.fact?`<i style="position:absolute;left:${g.s/TOT*100}%;width:${g.fact/TOT*100}%;top:11px;height:8px;background:${col[g.st]};border-radius:4px"></i>`:''}
     ${late?`<span class="mini" style="position:absolute;left:${(g.s+g.fact)/TOT*100}%;top:9px;color:var(--bad);font-weight:700;font-size:9.4px;padding-left:4px">+2 дн</span>`:''}
     <i style="position:absolute;left:${today/TOT*100}%;top:0;bottom:0;width:2px;background:var(--bad);opacity:.75"></i>
    </div></div>`}).join('')}
 </div>
 <div style="display:flex;gap:16px;margin-top:11px;flex-wrap:wrap">
  ${[['Выполнено','var(--ok)'],['Идёт сейчас','var(--brand2)'],['Отставание','var(--bad)'],['План','var(--line2)']].map(([n,c])=>`<span class="mini"><i style="display:inline-block;width:14px;height:7px;background:${c};border-radius:3px;margin-right:5px;vertical-align:middle"></i>${n}</span>`).join('')}
 </div>
</div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 5px">Критический путь</h3><p class="mini" style="margin:0">Вентиляция → потолки → отделка стен → полы. Любой день задержки на вентиляции — день задержки сдачи. Остальные работы имеют запас и на срок не влияют.</p></div>
 <div class="pan"><h3 style="margin:0 0 5px">Отставание</h3><p class="mini" style="margin:0">2 дня, всё в подрядчике ОВиК. Внутренние бригады идут в графике и даже с опережением на слаботочке.</p></div>
 <div class="pan"><h3 style="margin:0 0 5px">Как нагнать</h3><p class="mini" style="margin:0">Вторая смена на потолках с 20.09: возвращает срок, стоит +340 000 ₸ по ФОТ. Решение фиксируется в объекте — потом видно, почему вышли дороже сметы.</p></div>
</div>
<div class="said"><b>Вы сказали:</b> «Мы заходим, через три недели должны уже выйти с объекта, у нас там каждый час на счету». Поэтому график здесь в днях, а не в месяцах, и показывает не проценты, а какая работа кого держит.</div>`;
};

/* ====== ПАСПОРТ ОБЪЕКТА ====== */
SC.passport=()=>{
 const o=O(curObj);
 return `<div class="hd"><div><h2>Паспорт объекта · ${esc(o.n)}</h2>
 <p>Всё, что относится к объекту, в одном месте: договор, контакты, доступы, ограничения площадки. То, что сейчас живёт в голове прораба и в переписке — и теряется при его отпуске.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Паспорт распечатан в PDF: контакты, режим доступа, ограничения, контакты подрядчиков. Прораб держит его в телефоне, новый человек на объекте входит в курс за 10 минут.')">Выгрузить в PDF</button></div></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Договор и заказчик</h3>
  <div class="kv"><span>Заказчик</span><b>${esc(o.cl)}</b></div>
  <div class="kv"><span>Договор</span><b>№ ${o.id}/2026 от 20.08.2026</b></div>
  <div class="kv"><span>Сумма</span><b>${fmt(o.p)} ₸</b></div>
  <div class="kv"><span>Срок по договору</span><b>${o.start} — ${o.end}</b></div>
  <div class="kv"><span>Штраф за просрочку</span><b>0,1% в день</b></div>
  <div class="kv"><span>Гарантия</span><b>12 месяцев</b></div>
  <div class="kv" style="border:0"><span>Контакт заказчика</span><b>Ирина, технадзор</b></div>
 </div>
 <div class="pan"><h3 style="margin:0 0 9px">Площадка и ограничения</h3>
  <div class="kv"><span>Адрес</span><b>ТРЦ Достык Плаза, 2 этаж</b></div>
  <div class="kv"><span>Шумные работы</span><b style="color:var(--warn)">только до 10:00</b></div>
  <div class="kv"><span>Вывоз мусора</span><b>ночью, через служебный</b></div>
  <div class="kv"><span>Пропуска</span><b>14 оформлено</b></div>
  <div class="kv"><span>Лифт грузовой</span><b>по заявке за сутки</b></div>
  <div class="kv" style="border:0"><span>Электричество</span><b>от щита ТРЦ, 25 кВт</b></div>
  <div class="note" style="--tone:var(--warn)"><p class="mini" style="margin:0"><b>Почему это важно.</b> «Шумные работы до 10:00» — причина, по которой штробление на этом объекте идёт в три раза дольше нормы. Если это записано в паспорте, сметчик закладывает время сразу, а не объясняет постфактум.</p></div>
 </div>
</div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 7px">Наша команда</h3>
  <div class="kv"><span>Руководитель проекта</span><b>${esc(o.pm)}</b></div>
  <div class="kv"><span>Прораб</span><b>${esc(o.pr)}</b></div>
  <div class="kv"><span>Сметчик</span><b>Гульмира</b></div>
  <div class="kv" style="border:0"><span>Снабжение</span><b>Нурлан</b></div></div>
 <div class="pan"><h3 style="margin:0 0 7px">Подрядчики</h3>
  <div class="kv"><span>ОВиК</span><b>Климат Про</b></div>
  <div class="kv"><span>Витражи</span><b>АлюмСтрой</b></div>
  <div class="kv"><span>Вывеска</span><b>Неон Сити</b></div>
  <div class="kv" style="border:0"><span>Клининг</span><b>CleanPro</b></div></div>
 <div class="pan"><h3 style="margin:0 0 7px">Ключевые даты</h3>
  <div class="kv"><span>Аванс получен</span><b>22.08</b></div>
  <div class="kv"><span>Скрытые сданы</span><b>4 из 6</b></div>
  <div class="kv"><span>Сдача заказчику</span><b>${o.end}</b></div>
  <div class="kv" style="border:0"><span>Гарантия до</span><b>22.09.2027</b></div></div>
</div>`;
};
/* ====== СМЕТА ПРОТИВ ФАКТА — главный экран запроса ====== */
SC.estfact=()=>{
 const o=O(curObj);
 const P=EST.reduce((a,e)=>a+e.p,0), F=EST.reduce((a,e)=>a+e.f,0), C=EST.reduce((a,e)=>a+e.c,0);
 const rows=EST.map(e=>{
  const should=e.p*e.done/100;           /* сколько должно быть освоено при таком проценте */
  const dev=e.f-should;                   /* отклонение освоения от плана */
  const marg=e.f?Math.round((e.f-e.c)/e.f*100):null;
  const bad=marg!==null&&marg<12;
  return `<tr>
   <td style="padding:7px 8px"><b>${esc(e.r)}</b></td>
   <td class="mono" style="text-align:right;padding:7px 8px">${fmt(e.p)}</td>
   <td style="padding:7px 8px;width:118px">${barHtml(e.done,e.done===100?'var(--ok)':e.done>0?'var(--brand2)':'var(--line2)')}<div class="mini" style="text-align:right;margin-top:2px">${e.done}%</div></td>
   <td class="mono" style="text-align:right;padding:7px 8px">${fmt(e.f)}</td>
   ${seeMargin()?`<td class="mono" style="text-align:right;padding:7px 8px;color:var(--muted)">${e.c?fmt(e.c):'—'}</td>
   <td class="mono" style="text-align:right;padding:7px 8px;font-weight:700;color:${marg===null?'var(--muted2)':bad?'var(--bad)':'var(--ok)'}">${marg===null?'—':marg+'%'}</td>`:''}
   <td style="padding:7px 8px;text-align:right">${e.done===0?'<span class="tag">не начат</span>':e.done===100?'<span class="tag" style="background:var(--ok-l);color:var(--ok)">закрыт</span>':'<span class="tag" style="background:var(--brandl);color:var(--brand)">идёт</span>'}</td></tr>`;
 }).join('');
 return `<div class="hd"><div><h2>Смета против факта · ${esc(o.n)}</h2>
 <p>То, ради чего всё это делается. Слева — что продали заказчику по смете, справа — что реально сделали и во что это нам обошлось. Проценты берутся не со слов, а из отметок объёмов, которые прораб даёт каждый вечер.</p></div>
 <div class="btns"><select class="rsel" onchange="curObj=this.value;build()">${OBJ.filter(x=>x.f>0).map(x=>`<option value="${x.id}"${x.id===o.id?' selected':''}>${esc(x.n)}</option>`).join('')}</select>
 <button class="bt" onclick="toast('Выгружено в Excel: разделы, план, процент выполнения, освоение, себестоимость и маржа. Тот же файл уходит бухгалтеру для КС-2 и вам для контроля.')">В Excel</button></div></div>
<div class="wid" style="grid-template-columns:repeat(${seeMargin()?5:4},1fr)">
 <div><small>Смета по договору</small><b class="a">${fmt(P)} ₸</b><span>12 разделов</span></div>
 <div><small>Выполнено</small><b>${Math.round(F/P*100)}%</b><span>взвешенно по деньгам</span></div>
 <div><small>Освоено</small><b>${fmt(F)} ₸</b><span>подтверждено объёмами</span></div>
 <div><small>Осталось</small><b>${fmt(P-F)} ₸</b><span>${days(o.d>0?o.d:0)} до сдачи</span></div>
 ${seeMargin()?`<div><small>Маржа факт</small><b class="${(F-C)/F*100<18?'w':'g'}">${Math.round((F-C)/F*100)}%</b><span>план по смете 22%</span></div>`:''}
</div>
<div class="pan mx"><table class="t" style="font-size:11.4px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">
  <th style="text-align:left;padding:8px;font-size:10px;color:var(--muted)">РАЗДЕЛ</th>
  <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">ПО СМЕТЕ</th>
  <th style="text-align:left;padding:8px;font-size:10px;color:var(--muted)">ВЫПОЛНЕНО</th>
  <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">ОСВОЕНО</th>
  ${seeMargin()?'<th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">ЗАТРАТЫ</th><th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">МАРЖА</th>':''}
  <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">СТАТУС</th></tr></thead>
 <tbody>${rows}</tbody>
 <tfoot><tr style="border-top:1.5px solid var(--line2);font-weight:800">
  <td style="padding:9px 8px">Итого</td><td class="mono" style="text-align:right;padding:9px 8px">${fmt(P)}</td>
  <td style="padding:9px 8px" class="mini">${Math.round(F/P*100)}%</td>
  <td class="mono" style="text-align:right;padding:9px 8px">${fmt(F)}</td>
  ${seeMargin()?`<td class="mono" style="text-align:right;padding:9px 8px">${fmt(C)}</td><td class="mono" style="text-align:right;padding:9px 8px;color:var(--ok)">${Math.round((F-C)/F*100)}%</td>`:''}
  <td></td></tr></tfoot>
</table></div>
${seeMargin()?`<div class="g2">
 <div class="pan"><h3 style="margin:0 0 7px">Где мы теряем</h3>
  <div class="srow" style="border-left:3px solid var(--bad)"><div style="flex:1"><b>Вентиляция и кондиционирование</b><div class="mini">маржа 12% против 22% в смете. Подрядчик поднял цену после подписания договора с заказчиком</div></div><b class="mono">−512 000 ₸</b></div>
  <div class="srow" style="border-left:3px solid var(--warn)"><div style="flex:1"><b>Слаботочка</b><div class="mini">маржа 27%, но объём вырос: заказчик добавил 8 камер без допсоглашения</div></div><b class="mono">риск</b></div>
  <div class="srow" style="border-left:3px solid var(--ok)"><div style="flex:1"><b>Демонтаж и черновые</b><div class="mini">маржа 26% — своя бригада отработала быстрее нормы на два дня</div></div><b class="mono">+340 000 ₸</b></div>
 </div>
 <div class="pan"><h3 style="margin:0 0 7px">Что это даёт на следующем объекте</h3>
  <p class="mini" style="margin:0 0 9px">Когда таких объектов проходит двадцать, видно не «мы вроде зарабатываем», а конкретно: на вентиляции мы стабильно промахиваемся в смете на 8–10%, а на общестрое закладываем слишком много. Смета следующего объекта считается уже по вашей собственной статистике, а не по справочнику.</p>
  <div class="kv"><span>Объектов с полной статистикой</span><b>9</b></div>
  <div class="kv"><span>Средняя маржа факт</span><b>19,4%</b></div>
  <div class="kv" style="border:0"><span>Средняя маржа по сметам</span><b>22,0%</b></div>
 </div>
</div>`:'<div class="hint">Себестоимость и маржа по разделам видны владельцу. Руководитель проектов и ПТО видят план, процент и освоение — этого достаточно для работы, но не раскрывает наценку.</div>'}
<div class="said"><b>Вы сказали:</b> «Процесс, чтобы я видел в нём смету, по факту исполнения». Это он. Ничего сверх этого на экране нет — ни лидов, ни чатов, ни воронки продаж.</div>`;
};

/* ====== СМЕТА ПО РАЗДЕЛАМ ====== */
SC.est=()=>`<div class="hd"><div><h2>Смета по разделам · Starbucks Достык Плаза</h2>
 <p>Смета живёт в системе, а не в отдельном Excel у сметчика. Из неё автоматически появляются: разделы для отметки объёмов, план закупа материалов и график платежей заказчика.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Смета загружена из вашего Excel: система разобрала разделы, позиции, объёмы и расценки. Формат шаблона настраивается один раз под то, как считает Гульмира.')">Загрузить из Excel</button><button class="bt p" onclick="toast('Создана смета нового объекта на основе этой. Расценки подставились по вашей статистике: вентиляция +9% к справочнику, общестрой −6%, потому что так выходило на последних девяти объектах.')">Новая смета по образцу</button></div></div>
<div class="g21">
 <div class="pan mx"><table class="t" style="font-size:11.4px">
  <thead><tr style="border-bottom:1.5px solid var(--line2)">
   <th style="text-align:left;padding:8px;font-size:10px;color:var(--muted)">РАЗДЕЛ И ПОЗИЦИИ</th>
   <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">ОБЪЁМ</th>
   <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">ЦЕНА</th>
   <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">СУММА</th></tr></thead>
  <tbody>
  ${[['Демонтаж',''],['— демонтаж перегородок','86 м²','7 400','636 400'],['— демонтаж стяжки','180 м²','4 200','756 000'],['— вывоз мусора','14 рейсов','32 000','448 000'],
     ['Электрика и щитовая',''],['— штробление под трассы','420 м','2 900','1 218 000'],['— кабель силовой, монтаж','1 240 м','1 450','1 798 000'],['— щит учёта и распределения','1 компл','980 000','980 000'],['— розетки и выключатели','78 точек','10 050','783 800'],
     ['Вентиляция',''],['— магистральные воздуховоды','118 м','19 400','2 289 200'],['— приточная установка','1 шт','1 840 000','1 840 000'],['— диффузоры и монтаж','34 шт','29 100','989 400']
    ].map(r=>r.length===2
     ? `<tr style="background:var(--card2)"><td colspan="4" style="padding:8px;font-weight:800">${esc(r[0])}</td></tr>`
     : `<tr><td style="padding:6px 8px;padding-left:18px;color:var(--muted)">${esc(r[0])}</td><td class="mono" style="text-align:right;padding:6px 8px">${esc(r[1])}</td><td class="mono" style="text-align:right;padding:6px 8px">${esc(r[2])}</td><td class="mono" style="text-align:right;padding:6px 8px">${esc(r[3])}</td></tr>`).join('')}
  </tbody></table>
  <p class="mini" style="margin:9px 0 0">Показаны три раздела из двенадцати. Полная смета — 147 позиций.</p>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Что смета порождает сама</h3>
   <div class="li"><b style="color:var(--brand)">→</b><div><b style="font-size:11.6px">Разделы для отметки объёмов</b><div class="mini">прораб видит только свои работы и вводит цифры, а не пишет текстом</div></div></div>
   <div class="li"><b style="color:var(--brand)">→</b><div><b style="font-size:11.6px">План закупа</b><div class="mini">сколько и чего нужно купить, с датами по графику работ</div></div></div>
   <div class="li"><b style="color:var(--brand)">→</b><div><b style="font-size:11.6px">График платежей</b><div class="mini">этапы оплаты заказчиком привязаны к закрытию разделов</div></div></div>
   <div class="li" style="border:0"><b style="color:var(--brand)">→</b><div><b style="font-size:11.6px">Норматив по людям</b><div class="mini">сколько человеко-дней заложено — с этим потом сравнивается табель</div></div></div>
  </div>
  ${seeMargin()?`<div class="pan"><h3 style="margin:0 0 8px">Структура цены</h3>
   <div class="kv"><span>Материалы</span><b>41%</b></div>
   <div class="kv"><span>Работа своих бригад</span><b>27%</b></div>
   <div class="kv"><span>Подряд</span><b>16%</b></div>
   <div class="kv"><span>Накладные и логистика</span><b>6%</b></div>
   <div class="kv" style="border:0"><span>Прибыль в смете</span><b style="color:var(--ok)">22%</b></div>
   <div class="yld"><i style="width:41%;background:var(--acc)"></i><i style="width:27%;background:var(--brand2)"></i><i style="width:16%;background:var(--violet)"></i><i style="width:6%;background:var(--steel)"></i><i style="width:10%;background:var(--ok)"></i></div>
  </div>`:''}
 </div>
</div>`;

/* ====== ОБЪЁМЫ И ЗАКРЫТИЕ ====== */
SC.volumes=()=>`<div class="hd"><div><h2>Объёмы и закрытие</h2>
 <p>Отметки прорабов за неделю и формирование актов заказчику. Объём, который прораб отметил вечером, к утру уже в проценте выполнения, в освоении и в готовности к КС-2.</p></div>
 <div class="btns"><button class="bt p" onclick="makeAct()">Сформировать КС-2 за период</button></div></div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Отметки за неделю · Starbucks Достык Плаза</h3>
  ${[['18.09','Потолки: каркас','62 м²','Ержан','WhatsApp','ok'],
     ['18.09','Отделка стен: шпаклёвка','48 м²','Ержан','WhatsApp','ok'],
     ['17.09','Слаботочка: прокладка','86 м','Ержан','приложение','ok'],
     ['17.09','Вентиляция: диффузоры','12 шт','Климат Про','подрядчик','wait'],
     ['16.09','Потолки: каркас','54 м²','Ержан','WhatsApp','ok'],
     ['16.09','Электрика: розетки','22 точки','Ержан','WhatsApp','ok'],
     ['15.09','Стяжка: финишный слой','180 м²','Ержан','приложение','ok']
    ].map(([d,w,q,who,src,st])=>`<div class="srow"><b class="mono" style="width:44px;font-size:10.6px">${d}</b>
   <div style="flex:1"><b>${esc(w)}</b><div class="mini">${esc(who)} · ${esc(src)}</div></div>
   <b class="mono" style="width:76px;text-align:right">${esc(q)}</b>
   <span class="tag" style="background:${st==='ok'?'var(--ok-l)':'var(--warn-l)'};color:${st==='ok'?'var(--ok)':'var(--warn)'}">${st==='ok'?'принято':'проверка'}</span></div>`).join('')}
  <div class="hint"><b>Обратите внимание на источник.</b> Пять отметок из семи пришли из WhatsApp — прораб не заходил ни в какую систему. Это ответ на ваше «тяжело заставить сотрудников, чтоб они каждый процесс писали».</div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Готово к закрытию</h3>
   <div class="kv"><span>Период</span><b>01.09 — 18.09</b></div>
   <div class="kv"><span>Разделов закрыто полностью</span><b>4</b></div>
   <div class="kv"><span>Сумма к КС-2</span><b>${fmt(9840000)} ₸</b></div>
   <div class="kv"><span>Скрытые работы подписаны</span><b style="color:var(--ok)">✓ 4 из 6</b></div>
   <div class="kv" style="border:0"><span>Блокирует закрытие</span><b style="color:var(--warn)">вентиляция</b></div>
   <button class="bt p" style="width:100%;margin-top:10px" onclick="makeAct()">Сформировать акт</button>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Спор с заказчиком — чем закрываем</h3>
   <p class="mini" style="margin:0">По каждой отметке объёма хранится дата, автор, фото и геометка с объекта. Когда технадзор говорит «этого не было», открывается фотография за нужное число. Это не про недоверие, а про то, что через месяц никто не помнит.</p>
  </div>
 </div>
</div>`;

/* ====== ДОПРАБОТЫ ====== */
SC.extra=()=>`<div class="hd"><div><h2>Допработы и изменения</h2>
 <p>Место, где подрядчики теряют больше всего денег. Заказчик просит «мелочь» устно, прораб делает, а в акт это не попадает. Здесь любое отклонение от сметы превращается в документ до того, как работа начата.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Создано допсоглашение № 3 к договору: перенос розеток, замена светильников и 8 дополнительных камер. Сумма 486 000 ₸, отправлено заказчику на подпись через WhatsApp и почту.')">Собрать допсоглашение</button></div></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Открытые изменения</h3>
  ${[['Перенос двух розеток у барной стойки','Starbucks','74 000','подтверждено перепиской','ok'],
     ['8 дополнительных камер видеонаблюдения','Starbucks','312 000','ждёт подписи','wait'],
     ['Замена трековых светильников на другую модель','Starbucks','100 000','ждёт подписи','wait'],
     ['Усиление стяжки под оборудование кухни','KFC Сайран','268 000','подтверждено','ok'],
     ['Дополнительный щит для кофемашин','Starbucks','—','сделано без документа','bad']
    ].map(([n,o,s,st,c])=>`<div class="srow" style="border-left:3px solid ${c==='ok'?'var(--ok)':c==='wait'?'var(--warn)':'var(--bad)'}">
   <div style="flex:1"><b>${esc(n)}</b><div class="mini">${esc(o)} · ${esc(st)}</div></div><b class="mono">${esc(s)} ${s!=='—'?'₸':''}</b></div>`).join('')}
  <div class="note" style="--tone:var(--bad)"><p class="mini" style="margin:0"><b>Последняя строка — типичная потеря.</b> Щит поставили по устной просьбе, документа нет, в акт не попадёт. Система ловит это иначе: расход материала, которого нет в смете, сам поднимает вопрос «это допработа или наш минус?» — и не даёт забыть.</p></div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Итого по изменениям</h3>
   <div class="kv"><span>Оформлено и подписано</span><b style="color:var(--ok)">342 000 ₸</b></div>
   <div class="kv"><span>Ждёт подписи заказчика</span><b style="color:var(--warn)">412 000 ₸</b></div>
   <div class="kv"><span>Сделано без документа</span><b style="color:var(--bad)">не посчитано</b></div>
   <div class="kv" style="border:0"><span>Доля от договора</span><b>2,7%</b></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Правило, которое система держит</h3>
   <p class="mini" style="margin:0 0 9px">Работа, которой нет в смете, не может быть отмечена как выполненная, пока не появится допсоглашение или явное решение «делаем за свой счёт». Прораб не может «просто сделать» — он получает вопрос в WhatsApp и отвечает одним словом.</p>
   <div class="srow"><div class="mini" style="flex:1"><b>Бот:</b> Ержан, в заявке кабель сверх сметы на 60 м. Это допработа заказчику или наш минус?</div></div>
   <div class="srow" style="background:var(--brandl)"><div class="mini" style="flex:1"><b>Ержан:</b> допработа, трассу они сами перенесли</div></div>
   <div class="srow"><div class="mini" style="flex:1"><b>Бот:</b> Принято. Аскару поставлена задача оформить допсоглашение до 20.09.</div></div>
  </div>
 </div>
</div>`;
/* ====== БРИГАДЫ ====== */
SC.crews=()=>`<div class="hd"><div><h2>Бригады и загрузка</h2>
 <p>Восемь бригад, из них две подрядные. Видно, кто где стоит, у кого есть свободные руки и куда их можно перебросить сегодня, не сорвав другой объект.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Бригада 4 переброшена на Starbucks с 19.09: там простой по отделке из-за незакрытых потолков, а на коворкинге ламинат приедет только завтра. Оба графика пересчитаны.')">Перебросить свободных</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Бригад</small><b class="a">${CREW.length}</b><span>6 своих · 2 подрядных</span></div>
 <div><small>Людей всего</small><b>${CREW.reduce((a,c)=>a+c.men,0)}</b><span>на девяти объектах</span></div>
 <div><small>Свободных рук</small><b class="w">${CREW.reduce((a,c)=>a+c.free,0)}</b><span>можно перебросить сегодня</span></div>
 <div><small>Загрузка</small><b>88%</b><span>норма для трёх недель на объект</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">
  ${['БРИГАДА','БРИГАДИР','ЛЮДЕЙ','ОБЪЕКТ','СПЕЦИАЛИЗАЦИЯ','СВОБОДНО'].map((h,i)=>`<th style="text-align:${i>1&&i!==3&&i!==4?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${CREW.map(c=>{const o=OBJ.find(x=>x.id===c.obj);return `<tr>
  <td style="padding:8px"><b>${esc(c.n)}</b></td><td style="padding:8px">${esc(c.br)}</td>
  <td class="mono" style="text-align:right;padding:8px">${c.men}</td>
  <td style="padding:8px">${esc(o?o.n:'—')}</td>
  <td style="padding:8px;color:var(--muted)">${esc(c.spec)}</td>
  <td style="text-align:right;padding:8px">${c.free?`<span class="tag" style="background:var(--warn-l);color:var(--warn)">${c.free} чел</span>`:'<span class="tag">—</span>'}</td></tr>`}).join('')}</tbody>
</table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 8px">Что система считает сама</h3>
  <div class="kv"><span>Человеко-дней по смете</span><b>412</b></div>
  <div class="kv"><span>Человеко-дней по табелю</span><b style="color:var(--warn)">438</b></div>
  <div class="kv"><span>Перерасход</span><b style="color:var(--bad)">26 дней · 6,3%</b></div>
  <div class="kv" style="border:0"><span>Где именно</span><b>потолки и отделка</b></div>
  <p class="mini" style="margin:10px 0 0">Норматив берётся из сметы, факт — из табеля. Расхождение видно на третьей неделе, а не когда объект закрыт и деньги потрачены.</p>
 </div>
 <div class="pan"><h3 style="margin:0 0 8px">Подрядчики: история, а не память</h3>
  <div class="srow"><div style="flex:1"><b>Климат Про · ОВиК</b><div class="mini">4 объекта · 2 раза сорвали срок · средняя задержка 3 дня</div></div><span class="tag" style="background:var(--warn-l);color:var(--warn)">риск</span></div>
  <div class="srow"><div style="flex:1"><b>АлюмСтрой · витражи</b><div class="mini">6 объектов · 1 срыв · брак на текущем объекте</div></div><span class="tag" style="background:var(--warn-l);color:var(--warn)">риск</span></div>
  <div class="srow"><div style="flex:1"><b>Неон Сити · вывески</b><div class="mini">9 объектов · срывов нет</div></div><span class="tag" style="background:var(--ok-l);color:var(--ok)">надёжен</span></div>
  <p class="mini" style="margin:8px 0 0">Через год этот список решает, кого звать на срочный объект, а кого не звать вовсе.</p>
 </div>
</div>`;

/* ====== ЭКРАН ПРОРАБА ====== */
SC.foreman=()=>`<div class="hd"><div><h2>Экран прораба · телефон</h2>
 <p>Вы сказали: «Бригадиры, прорабы этим заниматься не будут». Поэтому у прораба не система, а четыре кнопки и ни одного текстового поля. Всё вводится цифрами и фотографиями, за 40 секунд в конце смены.</p></div>
 <div class="btns"><button class="bt" onclick="go('wa')">А можно вообще без приложения →</button></div></div>
<div style="display:flex;gap:26px;flex-wrap:wrap;align-items:flex-start">
 <div class="phone">
  <div style="background:var(--rail);color:#fff;padding:13px 15px">
   <div style="font-size:9.6px;color:#8fa3b0;letter-spacing:.08em">ЧЕТВЕРГ, 18 СЕНТЯБРЯ</div>
   <b style="font-size:14px;display:block;margin-top:3px">Starbucks · Достык Плаза</b>
   <div style="font-size:10.4px;color:#a9bcc8;margin-top:2px">до сдачи 4 дня · готовность 78%</div>
  </div>
  <div style="padding:13px">
   <button class="bt p" style="width:100%;padding:13px;font-size:13px;margin-bottom:8px" onclick="fmVol()">Отметить объём</button>
   <button class="bt" style="width:100%;padding:13px;font-size:13px;margin-bottom:8px" onclick="fmReq()">Заявка на материал</button>
   <button class="bt" style="width:100%;padding:13px;font-size:13px;margin-bottom:8px" onclick="fmMen()">Кто вышел · 9 человек</button>
   <button class="bt" style="width:100%;padding:13px;font-size:13px" onclick="fmPhoto()">Фото работ</button>
   <div style="border-top:1px solid var(--line);margin-top:13px;padding-top:11px">
    <div class="mini" style="font-weight:700;margin-bottom:6px">Сегодня уже отмечено</div>
    <div class="kv" style="font-size:11px;padding:5px 0"><span>Потолки: каркас</span><b>62 м²</b></div>
    <div class="kv" style="font-size:11px;padding:5px 0"><span>Отделка: шпаклёвка</span><b>48 м²</b></div>
    <div class="kv" style="font-size:11px;padding:5px 0;border:0"><span>Людей на смене</span><b>9</b></div>
   </div>
   <div style="background:var(--warn-l);border-radius:6px;padding:9px 11px;margin-top:11px">
    <div class="mini" style="color:var(--warn);font-weight:700">Что мешает работать</div>
    <div class="mini" style="margin-top:3px">Потолок нельзя зашивать: не подписаны скрытые по электрике. Аскар вызвал технадзор на завтра 10:00.</div>
   </div>
  </div>
 </div>
 <div style="flex:1;min-width:330px">
  <div class="pan"><h3 style="margin:0 0 8px">Чего здесь намеренно нет</h3>
   <div class="li"><b style="color:var(--bad)">×</b><div><b style="font-size:11.6px">Текстовых отчётов</b><div class="mini">никаких «опишите, что сделано за день» — только цифра напротив своей работы</div></div></div>
   <div class="li"><b style="color:var(--bad)">×</b><div><b style="font-size:11.6px">Чужих объектов</b><div class="mini">прораб видит один свой объект, переключателя нет</div></div></div>
   <div class="li"><b style="color:var(--bad)">×</b><div><b style="font-size:11.6px">Денег и смет</b><div class="mini">объёмы в метрах и штуках, суммы не показываются вообще</div></div></div>
   <div class="li"><b style="color:var(--bad)">×</b><div><b style="font-size:11.6px">Задач и согласований</b><div class="mini">всё, что требует решения, уходит руководителю проектов, а не прорабу</div></div></div>
   <div class="li" style="border:0"><b style="color:var(--ok)">✓</b><div><b style="font-size:11.6px">Работает офлайн</b><div class="mini">в подвале и на минус первом этаже связи нет — отметки уходят, когда появится сеть</div></div></div>
  </div>
  <div class="said"><b>Честно о рисках.</b> Даже четыре кнопки — это приложение, которое надо открыть. Поэтому основной способ сбора факта мы делаем другим: бот в WhatsApp, где прорабы уже сидят. Приложение остаётся для фото и для тех, кому так удобнее.</div>
 </div>
</div>`;

/* ====== ФАКТ ЧЕРЕЗ WHATSAPP ====== */
SC.wa=()=>`<div class="hd"><div><h2>Факт через WhatsApp</h2>
 <p>Главный ответ на «их не заставить заполнять». Прораб не заходит никуда: в 18:00 бот сам пишет ему в WhatsApp три вопроса по его объекту. Он отвечает цифрами — данные попадают в систему и пересчитывают график, освоение и готовность.</p></div>
 <div class="btns"><button class="bt p" onclick="waRun()">Прогнать вечерний опрос</button></div></div>
<div style="display:flex;gap:26px;flex-wrap:wrap;align-items:flex-start">
 <div class="phone">
  <div style="background:#075e54;color:#fff;padding:11px 14px;display:flex;align-items:center;gap:10px">
   <div style="width:32px;height:32px;border-radius:50%;background:#128c7e;display:grid;place-items:center;font-size:13px;font-weight:800">О</div>
   <div><b style="font-size:12.6px">ОБЪЕКТ · бот</b><div style="font-size:9.6px;color:#b7d8d2">в сети</div></div>
  </div>
  <div id="wachat" style="background:#ece5dd;padding:11px;min-height:320px;max-height:420px;overflow:auto">
   <div class="msg" style="background:#fff;margin-bottom:7px">Ержан, конец смены. Starbucks Достык Плаза.<br><b>1.</b> Потолки, каркас — сколько м² сегодня?</div>
   <div class="msg" style="background:#dcf8c6;margin:0 0 7px auto">62</div>
   <div class="msg" style="background:#fff;margin-bottom:7px"><b>2.</b> Шпаклёвка стен — сколько м²?</div>
   <div class="msg" style="background:#dcf8c6;margin:0 0 7px auto">48</div>
   <div class="msg" style="background:#fff;margin-bottom:7px"><b>3.</b> Сколько человек было на смене?</div>
   <div class="msg" style="background:#dcf8c6;margin:0 0 7px auto">9</div>
   <div class="msg" style="background:#fff;margin-bottom:7px">Записал. Готовность объекта 78%, до сдачи 4 дня.<br>Что-то мешает работать? Ответьте «нет» или напишите одним словом.</div>
   <div class="msg" style="background:#dcf8c6;margin:0 0 7px auto">потолок не закрыть, скрытые не подписаны</div>
   <div class="msg" style="background:#fff">Принято. Аскару поставлена задача вызвать технадзор. Спасибо, до завтра.</div>
  </div>
 </div>
 <div style="flex:1;min-width:330px">
  <div class="pan"><h3 style="margin:0 0 8px">Почему это работает, а Битрикс не сработал</h3>
   <div class="kv"><span>Куда заходить прорабу</span><b>никуда</b></div>
   <div class="kv"><span>Что установить</span><b>ничего</b></div>
   <div class="kv"><span>Чему учить</span><b>отвечать цифрой</b></div>
   <div class="kv"><span>Время в день</span><b>40 секунд</b></div>
   <div class="kv" style="border:0"><span>Если не ответил до 19:30</span><b style="color:var(--warn)">напоминание, потом РП</b></div>
   <p class="mini" style="margin:10px 0 0">Ваши слова: «Тяжело заставить сотрудников — они в WhatsApp-то не описываются». Мы не боремся с этим, а используем: вопросы приходят туда, где человек уже есть, и требуют ответа в одно число.</p>
  </div>
  <div class="g2" style="margin-bottom:0">
   <div class="pan"><h3 style="margin:0 0 6px">Что ещё умеет бот</h3>
    <div class="mini" style="line-height:1.85">→ принимает фото работ с геометкой<br>→ принимает заявку на материал голосом<br>→ спрашивает про допработы, если расход сверх сметы<br>→ утром напоминает, что поставка сегодня<br>→ по субботам просит табель одним сообщением</div></div>
   <div class="pan"><h3 style="margin:0 0 6px">Ответственность</h3>
    <div class="mini" style="line-height:1.85">→ не ответил 2 дня — видно у РП<br>→ 3 дня — видно у вас<br>→ цифры расходятся с приёмкой — помечается<br>→ вся переписка хранится в объекте<br>→ отпуск прораба не уносит историю</div></div>
  </div>
 </div>
</div>`;

/* ====== ТАБЕЛЬ ====== */
SC.tabel=()=>`<div class="hd"><div><h2>Табель и выработка</h2>
 <p>Кто выходил, сколько дней, сколько заложено сметой. Табель собирается из вечерних ответов прорабов, а не переписывается из тетради в конце месяца.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Табель за сентябрь выгружен: 47 человек, 438 человеко-дней по девяти объектам, разбивка по бригадам и объектам. Файл уходит бухгалтеру для расчёта.')">Выгрузить за месяц</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Человек в сентябре</small><b class="a">47</b><span>своих 39 · подряд 8</span></div>
 <div><small>Человеко-дней</small><b>438</b><span>по смете 412</span></div>
 <div><small>Перерасход</small><b class="w">6,3%</b><span>потолки и отделка</span></div>
 <div><small>ФОТ к выплате</small><b>${seeMoney()?'6 940 000 ₸':'скрыт'}</b><span>${seeMoney()?'без подрядных':'по роли'}</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">
  <th style="text-align:left;padding:8px;font-size:10px;color:var(--muted)">БРИГАДА</th>
  <th style="text-align:left;padding:8px;font-size:10px;color:var(--muted)">ОБЪЕКТ</th>
  <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">ЧЕЛ·ДНЕЙ ФАКТ</th>
  <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">ПО СМЕТЕ</th>
  <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">ОТКЛОНЕНИЕ</th></tr></thead>
 <tbody>${[['Бригада 1 · общестрой','Starbucks',84,88],['Бригада 2 · отделка','Starbucks',71,62],['Электрики','KFC Сайран',52,54],['Сантехники','КМГ Сервис',38,40],['Бригада 3 · общестрой','КМГ Сервис',96,92],['Бригада 4 · отделка','Коворкинг',97,76]]
  .map(([b,o,f,p])=>{const d=f-p;return `<tr><td style="padding:8px"><b>${esc(b)}</b></td><td style="padding:8px;color:var(--muted)">${esc(o)}</td>
  <td class="mono" style="text-align:right;padding:8px">${f}</td><td class="mono" style="text-align:right;padding:8px;color:var(--muted)">${p}</td>
  <td class="mono" style="text-align:right;padding:8px;font-weight:700;color:${d>6?'var(--bad)':d>0?'var(--warn)':'var(--ok)'}">${d>0?'+':''}${d}</td></tr>`}).join('')}</tbody>
</table></div>
<div class="hint"><b>Бригада 4 на коворкинге: +21 человеко-день к смете.</b> Это 340 000 ₸ сверх плана, и причина известна — дважды переделывали полы из-за неровной стяжки, которую приняли без замера. Такой вывод возможен только потому, что табель и объёмы лежат рядом в одном объекте.</div>`;
/* ====== ЗАЯВКИ С ОБЪЕКТОВ ====== */
SC.req=()=>`<div class="hd"><div><h2>Заявки с объектов</h2>
 <p>Прораб отправляет заявку одной строкой из WhatsApp или приложения. Система сама сверяет позицию со сметой и помечает то, что идёт сверх — до закупа, а не после.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Две новые заявки взяты в закуп. Система подобрала поставщиков по истории цен: профиль — «СтройДом» (на 4% дешевле прошлой закупки), краска — «Колорит». Счета запрошены автоматически.')">Взять новые в закуп</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Новых заявок</small><b class="w">${REQ.filter(r=>r.st==='new').length}</b><span>ждут снабжения</span></div>
 <div><small>В закупе</small><b>${REQ.filter(r=>r.st==='buy').length}</b><span>счета у поставщиков</span></div>
 <div><small>В пути</small><b>${REQ.filter(r=>r.st==='way').length}</b><span>доставка сегодня-завтра</span></div>
 <div><small>Сверх сметы</small><b class="r">1</b><span>требует решения</span></div>
</div>
<div class="pan">${REQ.map(r=>{const o=OBJ.find(x=>x.id===r.o),[nm,c]=RST[r.st];
 return `<div class="dl" style="--c:${c}">
  <b class="mono" style="width:56px;font-size:10.6px">${r.id}</b>
  <div style="flex:1;min-width:0"><b>${esc(r.w)} · ${esc(r.q)}</b>
   <div class="mini">${esc(o?o.n:'')} · ${esc(r.by)} · ${esc(r.at)}${r.note?` · <span style="color:var(--bad)">${esc(r.note)}</span>`:''}</div></div>
  <b class="mono" style="width:104px;text-align:right">${fmt(r.sum)} ₸</b>
  <span class="tag" style="width:88px;text-align:center;background:${c};color:#fff">${nm}</span>
  <span class="mini" style="width:74px;text-align:right">нужно ${r.need}</span></div>`}).join('')}
</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 8px">Что система проверяет в момент заявки</h3>
  <div class="li"><b style="color:var(--ok)">✓</b><div><b style="font-size:11.6px">Есть ли позиция в смете</b><div class="mini">и сколько по ней ещё не выбрано</div></div></div>
  <div class="li"><b style="color:var(--ok)">✓</b><div><b style="font-size:11.6px">Не лежит ли это уже на объекте</b><div class="mini">или на другом объекте, откуда можно перекинуть</div></div></div>
  <div class="li"><b style="color:var(--ok)">✓</b><div><b style="font-size:11.6px">Успевает ли по графику</b><div class="mini">если работа начинается через 2 дня, а поставка 5 — заявка краснеет сразу</div></div></div>
  <div class="li" style="border:0"><b style="color:var(--ok)">✓</b><div><b style="font-size:11.6px">Цена против прошлых закупок</b><div class="mini">рост больше 10% подсвечивается снабженцу</div></div></div>
 </div>
 <div class="pan"><h3 style="margin:0 0 8px">Заявка сверх сметы · З-899</h3>
  <p class="mini" style="margin:0 0 9px">Кабель ВВГнг 3×2,5 — 420 м, в смете 360 м. Перерасход 60 м на 44 400 ₸. До того как купить, нужно решение: это наш просчёт или изменение по вине заказчика.</p>
  <button class="bt p" onclick="toast('Оформлено допработой: 52 000 ₸ уходят в допсоглашение № 3. Материал закупается сегодня, работа не останавливается.')">Допработа заказчику</button>
  <button class="bt" onclick="toast('Списано в наш минус: 44 400 ₸ в перерасход объекта. Позиция попадёт в отчёт «где мы промахиваемся в сметах» — по электрике это уже третий случай за квартал.')">Наш минус</button>
  <div class="note" style="--tone:var(--acc)"><p class="mini" style="margin:0">Решение занимает 10 секунд и принимается один раз. Сейчас этот же вопрос всплывает через месяц, когда никто не помнит, почему кабеля ушло больше.</p></div>
 </div>
</div>`;

/* ====== ЗАКУП И ПОСТАВКИ ====== */
SC.purch=()=>`<div class="hd"><div><h2>Закуп и поставки</h2>
 <p>От заявки до материала на объекте. Снабженец видит, что купить, у кого дешевле по истории и к какому числу это нужно на площадке по графику работ.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Сводная заявка поставщику «СтройДом» на 4 позиции по трём объектам: 1 214 000 ₸. Одна доставка вместо трёх — экономия на логистике 46 000 ₸.')">Объединить по поставщику</button></div></div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Поставки этой недели</h3>
  ${[['18.09','Гипсокартон ГКЛВ, 210 листов','КМГ Сервис','СтройДом','441 000','сегодня 14:00','way'],
     ['18.09','Ламинат 33 класс, 340 м²','Коворкинг','Флоор Маркет','1 428 000','завтра до 12:00','way'],
     ['19.09','Профиль ПП 60×27, 180 шт','Starbucks','СтройДом','126 000','заявка новая','new'],
     ['20.09','Краска Dulux, 14 вёдер','Starbucks','Колорит','238 000','заявка новая','new'],
     ['17.09','Светильники трековые, 46 шт','Starbucks','Свет Про','874 000','принято на объекте','got']
    ].map(([d,w,o,s,sum,st,c])=>`<div class="srow" style="border-left:3px solid ${RST[c][1]}">
   <b class="mono" style="width:44px;font-size:10.6px">${d}</b>
   <div style="flex:1"><b>${esc(w)}</b><div class="mini">${esc(o)} · ${esc(s)} · ${esc(st)}</div></div>
   <b class="mono">${esc(sum)} ₸</b></div>`).join('')}
  <div class="hint"><b>Материал привязан к работе, а не просто к объекту.</b> Профиль нужен 19.09, потому что 20.09 по графику начинается зашивка потолка. Если поставка сдвигается, система сама двигает работу и показывает, поедет ли из-за этого срок сдачи.</div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">История цен · гипсокартон</h3>
   <div class="kv"><span>Июль · СтройДом</span><b class="mono">2 240 ₸</b></div>
   <div class="kv"><span>Август · МегаСтрой</span><b class="mono">2 380 ₸</b></div>
   <div class="kv"><span>Сентябрь · СтройДом</span><b class="mono" style="color:var(--ok)">2 100 ₸</b></div>
   <div class="kv" style="border:0"><span>Заложено в смете</span><b class="mono">2 300 ₸</b></div>
   <p class="mini" style="margin:9px 0 0">По каждой позиции видно, у кого и почём брали. Через полгода это превращается в переговорную позицию с поставщиком.</p>
  </div>
  ${seeMoney()?`<div class="pan"><h3 style="margin:0 0 8px">Закуп за сентябрь</h3>
   <div class="kv"><span>Куплено материалов</span><b>18 420 000 ₸</b></div>
   <div class="kv"><span>По смете заложено</span><b>19 100 000 ₸</b></div>
   <div class="kv" style="border:0"><span>Экономия</span><b style="color:var(--ok)">680 000 ₸ · 3,6%</b></div>
  </div>`:''}
 </div>
</div>`;

/* ====== МАТЕРИАЛ НА ОБЪЕКТЕ ====== */
SC.stock=()=>`<div class="hd"><div><h2>Материал на объекте</h2>
 <p>Что привезли, что израсходовано, что осталось. Не полноценный склад с кладовщиком, а ровно то, что нужно подрядчику: не купить дважды и не забыть вывезти остатки.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Найдено на других объектах: профиль ПП 60×27 — 240 шт остаток на КМГ Сервис, там потолки закрыты. Перекинуть дешевле, чем купить: экономия 126 000 ₸ и два дня ожидания.')">Поискать на других объектах</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">
  <th style="text-align:left;padding:8px;font-size:10px;color:var(--muted)">МАТЕРИАЛ</th>
  <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">ПРИВЕЗЛИ</th>
  <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">СПИСАНО</th>
  <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">ОСТАТОК</th>
  <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">ПО СМЕТЕ</th>
  <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">СИГНАЛ</th></tr></thead>
 <tbody>${[['Гипсокартон ГКЛВ 12,5','320 л','298 л','22 л','310 л','over'],
  ['Профиль ПП 60×27','640 шт','640 шт','0 шт','700 шт','need'],
  ['Кабель ВВГнг 3×2,5','1 240 м','1 186 м','54 м','1 240 м','ok'],
  ['Краска Dulux матовая','18 вёдер','16 вёдер','2 ведра','26 вёдер','ok'],
  ['Светильники трековые','46 шт','0 шт','46 шт','46 шт','ok'],
  ['Клей плиточный','42 меш','44 меш','0 меш','38 меш','over']]
  .map(([m,a,b,c,d,s])=>`<tr><td style="padding:8px"><b>${esc(m)}</b></td>
  <td class="mono" style="text-align:right;padding:8px">${esc(a)}</td><td class="mono" style="text-align:right;padding:8px">${esc(b)}</td>
  <td class="mono" style="text-align:right;padding:8px">${esc(c)}</td><td class="mono" style="text-align:right;padding:8px;color:var(--muted)">${esc(d)}</td>
  <td style="text-align:right;padding:8px">${s==='over'?'<span class="tag" style="background:var(--bad-l);color:var(--bad)">перерасход</span>':s==='need'?'<span class="tag" style="background:var(--warn-l);color:var(--warn)">кончился</span>':'<span class="tag" style="background:var(--ok-l);color:var(--ok)">норма</span>'}</td></tr>`).join('')}</tbody>
</table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Перерасход материала — ранний сигнал</h3>
  <p class="mini" style="margin:0">Клея ушло 44 мешка вместо 38, гипсокартона 298 против 310 при готовности раздела 74% — значит по факту уйдёт около 340. Это видно сейчас, когда ещё можно разобраться, а не в конце объекта, когда деньги потрачены.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Остатки после объекта</h3>
  <p class="mini" style="margin:0">При закрытии объекта система показывает, что осталось и сколько это стоит. Обычно эти деньги просто теряются на площадке. Здесь остаток переезжает на следующий объект и списывается с его закупа.</p></div>
</div>`;

/* ====== СКРЫТЫЕ РАБОТЫ ====== */
SC.hidden=()=>`<div class="hd"><div><h2>Скрытые работы</h2>
 <p>Работы, которые закрываются другими конструкциями: электрика в стене, трубы в полу, гидроизоляция. Без подписанного акта их нельзя зашивать — иначе при сдаче заказчик вправе требовать вскрытия за ваш счёт.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Технадзору заказчика отправлено приглашение на освидетельствование: завтра 10:00, электрика за подвесным потолком. Фото и исполнительная схема приложены — обычно это снимает половину вопросов ещё до выезда.')">Вызвать технадзор</button></div></div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Starbucks · Достык Плаза</h3>
  ${[['Гидроизоляция санузлов','подписан','12.09','ok'],['Электрика в полу','подписан','15.09','ok'],['Водоснабжение: разводка в стенах','подписан','15.09','ok'],['Канализация: лежак','подписан','16.09','ok'],['Электрика за подвесным потолком','готово к вызову','—','wait'],['Вентиляция: воздуховоды в запотолочном','не готово','—','no']]
   .map(([n,s,d,c])=>`<div class="srow" style="border-left:3px solid ${c==='ok'?'var(--ok)':c==='wait'?'var(--warn)':'var(--line2)'}">
   <div style="flex:1"><b>${esc(n)}</b><div class="mini">${esc(s)}${d!=='—'?' · акт от '+d:''}</div></div>
   ${c==='ok'?'<span class="tag" style="background:var(--ok-l);color:var(--ok)">акт есть</span>':c==='wait'?'<button class="bt" onclick="toast(\'Вызов отправлен, освидетельствование завтра в 10:00.\')">Вызвать</button>':'<span class="tag">ждёт работ</span>'}</div>`).join('')}
  <div class="note" style="--tone:var(--bad)"><p class="mini" style="margin:0"><b>Блокировка работает жёстко.</b> Пока акт по электрике не подписан, работа «Потолки: зашивка» не может быть отмечена выполненной. Прораб видит причину в своём телефоне, руководитель проектов — в списке того, что горит.</p></div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">По всем объектам</h3>
   <div class="kv"><span>Актов подписано</span><b>28</b></div>
   <div class="kv"><span>Ждут технадзора</span><b style="color:var(--warn)">3</b></div>
   <div class="kv"><span>Блокируют работы</span><b style="color:var(--bad)">1</b></div>
   <div class="kv" style="border:0"><span>Средний срок подписания</span><b>1,8 дня</b></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Что прикладывается к акту</h3>
   <div class="mini" style="line-height:1.85">→ фотографии до закрытия, с датой и геометкой<br>→ исполнительная схема<br>→ паспорта и сертификаты на материал<br>→ подпись прораба и технадзора<br>→ ссылка на раздел сметы</div>
   <p class="mini" style="margin:9px 0 0">Всё это собирается по ходу работ, а не восстанавливается в панике перед сдачей.</p>
  </div>
 </div>
</div>`;

/* ====== СДАЧА ЗАКАЗЧИКУ ====== */
SC.accept=()=>`<div class="hd"><div><h2>Сдача заказчику</h2>
 <p>Чек-лист готовности к сдаче. Пока не закрыты все пункты, объект нельзя перевести на стадию «Гарантия» — это защищает от ситуации, когда работы приняты, а исполнительной документации нет и оплату держат.</p></div>
 <div class="btns"><button class="bt p" onclick="acceptRun()">Проверить готовность к сдаче</button></div></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Банк ЦентрКредит · сдача просрочена на 2 дня</h3>
  <div class="chk" id="acclist">
  ${[['Все разделы сметы закрыты','ok'],['Акты скрытых работ подписаны','ok'],['Исполнительная документация','ok'],['Паспорта и сертификаты на материалы','ok'],['Пусконаладка инженерных систем','ok'],['Замечания заказчика устранены','bad'],['Витражи приняты без брака','bad'],['Уборка и вывоз строймусора','ok'],['КС-2 и КС-3 подписаны','wait'],['Гарантийное письмо','wait']]
   .map(([n,s])=>`<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-bottom:1px solid var(--line)">
   <b style="color:${s==='ok'?'var(--ok)':s==='bad'?'var(--bad)':'var(--muted2)'};font-size:13px">${s==='ok'?'✓':s==='bad'?'×':'○'}</b>
   <span style="flex:1;font-size:11.6px">${esc(n)}</span>
   <span class="tag" style="background:${s==='ok'?'var(--ok-l)':s==='bad'?'var(--bad-l)':'var(--card3)'};color:${s==='ok'?'var(--ok)':s==='bad'?'var(--bad)':'var(--muted)'}">${s==='ok'?'готово':s==='bad'?'блокирует':'ждёт'}</span></div>`).join('')}
  </div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Что держит сдачу</h3>
   <div class="srow" style="border-left:3px solid var(--bad)"><div style="flex:1"><b>Витражи с браком</b><div class="mini">подрядчик АлюмСтрой · замена обещана к 20.09 · претензия отправлена</div></div></div>
   <div class="srow" style="border-left:3px solid var(--bad)"><div style="flex:1"><b>4 замечания заказчика</b><div class="mini">2 по покраске, 1 по дверям, 1 по освещению</div></div></div>
   <button class="bt" style="width:100%;margin-top:8px" onclick="go('defects')">Открыть замечания</button>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Стоимость просрочки</h3>
   <div class="kv"><span>Штраф по договору</span><b>0,1% в день</b></div>
   <div class="kv"><span>За 2 дня</span><b style="color:var(--bad)">53 800 ₸</b></div>
   <div class="kv"><span>Простой бригады</span><b style="color:var(--bad)">116 000 ₸</b></div>
   <div class="kv" style="border:0"><span>Итого потери</span><b style="color:var(--bad)">169 800 ₸</b></div>
   <p class="mini" style="margin:9px 0 0">Цифра считается сама и видна сразу. Это то, что обычно обнаруживается только при закрытии объекта.</p>
  </div>
 </div>
</div>`;

/* ====== ЗАМЕЧАНИЯ ====== */
SC.defects=()=>`<div class="hd"><div><h2>Замечания и переделки</h2>
 <p>Список замечаний заказчика с фотографиями, сроками и ответственными. Заменяет переписку в WhatsApp, где замечание живёт до тех пор, пока его кто-то помнит.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Отчёт по замечаниям отправлен технадзору заказчика: 4 открытых, 11 устранённых, по каждому фото «до» и «после». Такой отчёт закрывает половину вопросов на приёмке.')">Отчёт заказчику</button></div></div>
<div class="g21">
 <div class="pan">
  ${[['Покраска стен в переговорной: видны стыки','Банк ЦентрКредит','Бригада 2','19.09','open'],
     ['Дверь в серверную не закрывается плотно','Банк ЦентрКредит','Подряд','19.09','open'],
     ['Два трековых светильника не работают','Банк ЦентрКредит','Электрики','18.09','work'],
     ['Царапина на витраже у входа','Банк ЦентрКредит','АлюмСтрой','20.09','open'],
     ['Плинтус отходит у окна','Коворкинг','Бригада 4','17.09','done'],
     ['Не закрыт шов на потолке','Starbucks','Бригада 2','16.09','done']]
   .map(([n,o,w,d,s])=>`<div class="dl" style="--c:${s==='open'?'var(--bad)':s==='work'?'var(--warn)':'var(--ok)'}">
   <div style="flex:1"><b>${esc(n)}</b><div class="mini">${esc(o)} · ${esc(w)} · срок ${d}</div></div>
   <span class="tag" style="background:${s==='open'?'var(--bad-l)':s==='work'?'var(--warn-l)':'var(--ok-l)'};color:${s==='open'?'var(--bad)':s==='work'?'var(--warn)':'var(--ok)'}">${s==='open'?'открыто':s==='work'?'в работе':'устранено'}</span>
   <button class="bt" onclick="toast('Замечание отмечено устранённым. Требуется фото «после» — без него система не закроет пункт, и при сдаче он всё равно всплывёт.')">Устранено</button></div>`).join('')}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Статистика переделок</h3>
   <div class="kv"><span>Замечаний за квартал</span><b>63</b></div>
   <div class="kv"><span>Чаще всего</span><b>покраска и стыки</b></div>
   <div class="kv"><span>Стоимость переделок</span><b style="color:var(--bad)">1 240 000 ₸</b></div>
   <div class="kv" style="border:0"><span>Кто чаще переделывает</span><b>Бригада 2</b></div>
   <p class="mini" style="margin:9px 0 0">Это не для наказания, а для решения: либо бригаде нужен другой мастер, либо в смете на покраску заложено мало времени и люди торопятся.</p>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Гарантийные случаи</h3>
   <p class="mini" style="margin:0">Объект на гарантии не исчезает из системы. Обращение от заказчика попадает в ту же карточку: видно, кто делал, какой материал, какой акт подписан и кто из подрядчиков отвечает.</p>
  </div>
 </div>
</div>`;

/* ====== ФОТООТЧЁТ ====== */
SC.photo=()=>`<div class="hd"><div><h2>Фотоотчёт</h2>
 <p>Фотографии с объекта по датам и разделам. Прораб снимает и отправляет в WhatsApp, снимки сами раскладываются по объекту, работе и дате — искать ничего не нужно.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Фотоотчёт за неделю собран в PDF: 34 снимка по разделам и датам. Такой отчёт раз в неделю уходит заказчику — снимает больше половины звонков «а что там у вас происходит».')">Собрать отчёт заказчику</button></div></div>
<div class="bays">
 ${[['18.09','Потолки: каркас','var(--brand)'],['18.09','Шпаклёвка стен','var(--acc)'],['17.09','Слаботочка','var(--violet)'],['17.09','Вентиляция','var(--warn)'],['16.09','Электрика: розетки','var(--acc)'],['15.09','Стяжка: финиш','var(--ok)'],['15.09','Скрытые: электрика в полу','var(--rail-h)'],['14.09','Демонтаж завершён','var(--steel)']]
  .map(([d,n,c])=>`<div class="fbx" style="padding:0;overflow:hidden">
  <div style="height:88px;background:linear-gradient(135deg,${c} 0%,var(--rail) 100%);display:grid;place-items:center;color:#fff;font-size:22px">▣</div>
  <div style="padding:9px 11px"><b style="font-size:11.4px;display:block">${esc(n)}</b><span class="mini">${d} · Starbucks · Ержан</span></div></div>`).join('')}
</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Зачем это, кроме отчёта</h3>
  <p class="mini" style="margin:0">Через полгода заказчик звонит: «у вас тут труба течёт, вы плохо сделали». Открывается фотография скрытых работ за нужное число — видно, как именно было смонтировано и что технадзор это принял. Один такой случай окупает внедрение.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Как фото попадают в систему</h3>
  <p class="mini" style="margin:0">Прораб отправляет их в WhatsApp боту, как обычную фотографию. Бот спрашивает одним сообщением, к какой работе они относятся, — и раскладывает. Никаких папок, дисков и «скинь мне на почту».</p></div>
</div>`;
/* ====== ПЛАТЕЖИ ПО ОБЪЕКТУ ====== */
SC.pay=()=>`<div class="hd"><div><h2>Платежи по объектам</h2>
 <p>График платежей привязан к закрытию этапов, а не к календарю. Как только раздел сметы закрыт актом, система сама показывает, что можно выставлять счёт.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Сформированы 2 счёта: КМГ Сервис на 18 400 000 ₸ (второй этап закрыт актами) и SmartSpace на 9 200 000 ₸. Документы приложены, отправлены заказчикам.')">Выставить по закрытым этапам</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Законтрактовано</small><b class="a">${mln(OBJ.reduce((a,o)=>a+o.p,0))} ₸</b><span>девять объектов</span></div>
 <div><small>Получено</small><b>${mln(148600000)} ₸</b><span>авансы и этапы</span></div>
 <div><small>Ожидается</small><b class="w">${mln(46800000)} ₸</b><span>выставлено, не оплачено</span></div>
 <div><small>Просрочено</small><b class="r">${mln(8500000)} ₸</b><span>Alliance Coffee · 9 дней</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">
  <th style="text-align:left;padding:8px;font-size:10px;color:var(--muted)">ОБЪЕКТ</th>
  <th style="text-align:left;padding:8px;font-size:10px;color:var(--muted)">ЭТАП</th>
  <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">СУММА</th>
  <th style="text-align:left;padding:8px;font-size:10px;color:var(--muted)">СРОК</th>
  <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">СОСТОЯНИЕ</th></tr></thead>
 <tbody>${[['Starbucks Достык','Аванс 30%','8 520 000','22.08','paid'],
  ['Starbucks Достык','Этап 1 · черновые','8 500 000','09.09','late'],
  ['Starbucks Достык','Этап 2 · чистовые','8 520 000','25.09','plan'],
  ['КМГ Сервис','Аванс 30%','21 450 000','18.08','paid'],
  ['КМГ Сервис','Этап 1','18 400 000','20.09','ready'],
  ['Коворкинг SmartSpace','Этап 2','9 200 000','22.09','ready'],
  ['Банк ЦентрКредит','Финальный расчёт','5 380 000','по сдаче','hold'],
  ['KFC Сайран','Аванс 30%','10 260 000','05.09','paid']]
  .map(([o,e,s,d,st])=>{const m={paid:['оплачено','var(--ok)'],late:['просрочено','var(--bad)'],plan:['по плану','var(--muted)'],ready:['можно выставить','var(--acc)'],hold:['держат до сдачи','var(--warn)']}[st];
  return `<tr><td style="padding:8px"><b>${esc(o)}</b></td><td style="padding:8px;color:var(--muted)">${esc(e)}</td>
  <td class="mono" style="text-align:right;padding:8px">${esc(s)} ₸</td><td class="mono" style="padding:8px">${esc(d)}</td>
  <td style="text-align:right;padding:8px"><span class="tag" style="color:${m[1]}">${m[0]}</span></td></tr>`}).join('')}</tbody>
</table></div>
<div class="hint"><b>Связь с производством прямая.</b> Финальный расчёт по Банку ЦентрКредит держат не из вредности — не подписан акт сдачи, потому что не устранены замечания и брак по витражам. Пока это два разных мира (стройка отдельно, деньги отдельно), причину задержки оплаты приходится выяснять звонками.</div>`;

/* ====== ДЕБИТОРКА ====== */
SC.debt=()=>`<div class="hd"><div><h2>Дебиторка и авансы</h2>
 <p>Кто должен, сколько и почему. Отдельно — деньги, которые держат по вашей вине (не закрыты документы), и деньги, которые просто не платят.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Напоминания отправлены по трём заказчикам с суммой, номером счёта и приложенными актами. По Alliance Coffee создана задача Олжасу: 9 дней просрочки при хороших отношениях — это разговор, а не письмо.')">Напомнить по всем</button></div></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Не платят</h3>
  <div class="dl" style="--c:var(--bad)"><div style="flex:1"><b>Alliance Coffee</b><div class="mini">Starbucks Достык · этап 1 · документы подписаны 09.09</div></div><b class="mono">8 500 000 ₸</b><span class="tag" style="background:var(--bad-l);color:var(--bad)">9 дней</span></div>
  <div class="dl" style="--c:var(--warn)"><div style="flex:1"><b>QSR Kazakhstan</b><div class="mini">KFC Сайран · этап 1 · срок оплаты 22.09</div></div><b class="mono">10 260 000 ₸</b><span class="tag">по плану</span></div>
  <div class="note" style="--tone:var(--bad)"><p class="mini" style="margin:0"><b>Про сарафанное радио.</b> Вы сказали, что заказы идут по знакомству и клиентов немного. Это значит, что жёсткие напоминания здесь не работают, зато работает точность: показать акт, дату подписания и срок по договору. Система готовит это одним нажатием, без поиска по почте.</p></div>
 </div>
 <div class="pan"><h3 style="margin:0 0 9px">Держат из-за нас</h3>
  <div class="dl" style="--c:var(--violet)"><div style="flex:1"><b>БЦК · финальный расчёт</b><div class="mini">не подписан акт сдачи: 4 замечания и брак по витражам</div></div><b class="mono">5 380 000 ₸</b></div>
  <div class="dl" style="--c:var(--violet)"><div style="flex:1"><b>SmartSpace · этап 2</b><div class="mini">акт готов, ждём подписи технадзора</div></div><b class="mono">9 200 000 ₸</b></div>
  <h3 style="margin:14px 0 8px">Авансы подрядчикам</h3>
  <div class="kv"><span>Климат Про · ОВиК</span><b class="mono">4 200 000 ₸</b></div>
  <div class="kv"><span>АлюмСтрой · витражи</span><b class="mono">2 800 000 ₸</b></div>
  <div class="kv" style="border:0"><span>Отработано из них</span><b class="mono" style="color:var(--warn)">72%</b></div>
 </div>
</div>`;

/* ====== КАССОВЫЙ КАЛЕНДАРЬ ====== */
SC.cash=()=>`<div class="hd"><div><h2>Кассовый календарь</h2>
 <p>Что придёт и что нужно заплатить по неделям. Для подрядчика это главный финансовый вопрос: девять объектов одновременно означают девять графиков закупа и зарплат.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Прогноз построен на четыре недели вперёд по договорным срокам, графику закупа и ФОТ. Красная неделя 29.09 — 05.10: минус 6,2 млн ₸, если КМГ Сервис задержит платёж на неделю.')">Прогноз на месяц</button></div></div>
<div class="pan">
 ${[['15–21.09','+18 400 000','−14 200 000','+4 200 000','ok'],
    ['22–28.09','+17 720 000','−16 800 000','+920 000','warn'],
    ['29.09–05.10','+9 200 000','−15 400 000','−6 200 000','bad'],
    ['06–12.10','+24 600 000','−13 100 000','+11 500 000','ok']]
  .map(([w,i,o,b,s])=>`<div class="fr" style="grid-template-columns:130px 1fr 1fr 120px">
  <b style="font-size:11.6px">${w}</b>
  <span class="mono" style="color:var(--ok);font-size:11.4px">${i} ₸</span>
  <span class="mono" style="color:var(--bad);font-size:11.4px">${o} ₸</span>
  <b class="mono" style="text-align:right;color:${s==='ok'?'var(--ok)':s==='warn'?'var(--warn)':'var(--bad)'}">${b} ₸</b></div>`).join('')}
 <div class="note" style="--tone:var(--bad)"><p class="mini" style="margin:0"><b>Неделя 29.09 — 05.10 в минусе.</b> Совпали закуп по двум объектам, зарплата и платёж подрядчику ОВиК, а поступление от КМГ Сервис приходит только 06.10. Видно за две недели — значит есть время либо ускорить закрытие этапа, либо сдвинуть закуп на неделю.</p></div>
</div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Расходы по статьям</h3>
  <div class="kv" style="font-size:11px"><span>Материалы</span><b>18 420 000 ₸</b></div>
  <div class="kv" style="font-size:11px"><span>ФОТ</span><b>6 940 000 ₸</b></div>
  <div class="kv" style="font-size:11px"><span>Подрядчики</span><b>11 300 000 ₸</b></div>
  <div class="kv" style="font-size:11px;border:0"><span>Накладные</span><b>2 180 000 ₸</b></div></div>
 <div class="pan"><h3 style="margin:0 0 6px">Что даёт прогноз</h3>
  <p class="mini" style="margin:0">Кассовый разрыв на стройке обычно обнаруживают в день зарплаты. Здесь он виден за две недели, потому что система знает и график закупа, и сроки платежей по договорам.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Связь с производством</h3>
  <p class="mini" style="margin:0">Ускорить закрытие этапа на КМГ Сервис — это не финансовое решение, а производственное: нужно подписать два акта скрытых работ. Обе части в одной системе, поэтому решение видно сразу.</p></div>
</div>`;

/* ====== МАРЖА ПО ОБЪЕКТАМ ====== */
SC.margin=()=>{
 const rows=OBJ.filter(o=>o.f>0).map(o=>{const m=o.f-o.cost,p=Math.round(m/o.f*100);
  return `<tr><td style="padding:8px"><b>${esc(o.n)}</b><div class="mini">${o.m2} м² · ${esc(o.t)}</div></td>
  <td class="mono" style="text-align:right;padding:8px">${fmt(o.p)}</td>
  <td class="mono" style="text-align:right;padding:8px">${fmt(o.f)}</td>
  <td class="mono" style="text-align:right;padding:8px;color:var(--muted)">${fmt(o.cost)}</td>
  <td class="mono" style="text-align:right;padding:8px;font-weight:800;color:${p<15?'var(--bad)':p<20?'var(--warn)':'var(--ok)'}">${p}%</td>
  <td class="mono" style="text-align:right;padding:8px">${fmt(Math.round(m/o.m2))}</td></tr>`}).join('');
 return `<div class="hd"><div><h2>Маржа по объектам</h2>
 <p>Сколько реально заработано на каждом объекте, а не сколько было в смете. Считается каждый день по освоению и фактическим затратам, а не после закрытия.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Выгружено: маржа по объектам, по разделам и по типам объектов за квартал. Видно, что кофейни и аптеки дают 24–26%, а офисы 16–18% — при том что офисы крупнее и кажутся выгоднее.')">Отчёт за квартал</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Средняя маржа факт</small><b class="a">19,4%</b><span>по девяти объектам</span></div>
 <div><small>Заложено в сметах</small><b>22,0%</b><span>разрыв 2,6 пункта</span></div>
 <div><small>Лучший тип объекта</small><b class="g">кофейни</b><span>25,8% · быстрый цикл</span></div>
 <div><small>Худший</small><b class="w">офисы</b><span>16,4% · длинные сроки</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">
  <th style="text-align:left;padding:8px;font-size:10px;color:var(--muted)">ОБЪЕКТ</th>
  <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">ДОГОВОР</th>
  <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">ОСВОЕНО</th>
  <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">ЗАТРАТЫ</th>
  <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">МАРЖА</th>
  <th style="text-align:right;padding:8px;font-size:10px;color:var(--muted)">₸ / М²</th></tr></thead>
 <tbody>${rows}</tbody></table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 7px">Вывод, который виден только на данных</h3>
  <p class="mini" style="margin:0">Офис КМГ Сервис — самый крупный объект по сумме и самый слабый по марже на квадратный метр. Причина в сроке: пять недель вместо трёх означают в полтора раза больше накладных и людей, привязанных к одному объекту. Маленькая аптека за три недели приносит на метр больше, чем офис за пять.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Что с этим делать</h3>
  <p class="mini" style="margin:0">Это не значит «не брать офисы». Это значит считать их по другой ставке: закладывать не 22%, а 26–28%, потому что длинный объект съедает больше, чем кажется. Через год таких данных смета перестаёт быть догадкой.</p></div>
</div>`;
};

/* ====== ПОЧЕМУ СОРВАЛИ СРОК ====== */
SC.delays=()=>`<div class="hd"><div><h2>Почему сорвали срок</h2>
 <p>Каждая задержка фиксируется с причиной в момент, когда она происходит, а не восстанавливается по памяти. За квартал набирается картина, с которой уже можно что-то делать.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Отчёт за квартал: 9 объектов, 14 задержек, суммарно 38 дней. 61% всех потерянных дней — подрядчики, из них две трети приходятся на двоих: Климат Про и АлюмСтрой.')">Отчёт за квартал</button></div></div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Причины задержек · квартал</h3>
  ${[['Подрядчики вышли позже или сорвали срок',23,'var(--bad)'],
     ['Поставка материала опоздала',6,'var(--warn)'],
     ['Согласование с ТРЦ или арендодателем',5,'var(--acc)'],
     ['Заказчик менял решение по ходу',3,'var(--violet)'],
     ['Переделки по своей вине',1,'var(--steel)']]
   .map(([n,d,c])=>`<div class="fr"><span>${esc(n)}</span>
   <div class="bar"><i style="display:block;height:100%;width:${d/23*100}%;background:${c}"></i></div>
   <b class="mono" style="text-align:right">${days(d)}</b></div>`).join('')}
  <div class="note" style="--tone:var(--bad)"><p class="mini" style="margin:0"><b>61% потерянных дней — подрядчики.</b> Причём две трети из них дают два подрядчика. Это конкретное управленческое решение: либо менять их, либо закладывать их задержку в график изначально и не обещать заказчику дату, которую вы не контролируете.</p></div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Сколько это стоило</h3>
   <div class="kv"><span>Штрафы заказчикам</span><b style="color:var(--bad)">340 000 ₸</b></div>
   <div class="kv"><span>Простои бригад</span><b style="color:var(--bad)">1 860 000 ₸</b></div>
   <div class="kv"><span>Вторые смены, чтобы нагнать</span><b style="color:var(--bad)">920 000 ₸</b></div>
   <div class="kv" style="border:0"><span>Итого за квартал</span><b style="color:var(--bad)">3 120 000 ₸</b></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Как фиксируется причина</h3>
   <p class="mini" style="margin:0">Когда работа выходит за плановый срок, система спрашивает у руководителя проектов причину — одним выбором из списка, без описаний. Через квартал этот список превращается в таблицу выше.</p>
  </div>
 </div>
</div>`;

/* ====== СКОЛЬКО ЕЩЁ ПОТЯНЕМ ====== */
SC.cap=()=>`<div class="hd"><div><h2>Сколько ещё объектов потянем</h2>
 <p>Вопрос, на который сейчас отвечают ощущением. Система считает по свободным бригадам, по загрузке прорабов и по деньгам в обороте.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Расчёт: при текущих бригадах и трёх прорабах можно взять ещё один объект до 200 м² со стартом после 26.09 — когда закроются Starbucks и коворкинг. Взять два — значит либо нанимать прораба, либо срывать сроки.')">Посчитать под новый объект</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Прорабов</small><b class="a">3</b><span>девять объектов на троих</span></div>
 <div><small>Объектов на прораба</small><b class="w">3,0</b><span>норма 2–3 при трёх неделях</span></div>
 <div><small>Свободных бригад</small><b>0</b><span>3 свободных человека</span></div>
 <div><small>Можем взять</small><b class="g">1 объект</b><span>до 200 м², старт после 26.09</span></div>
</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Загрузка прорабов</h3>
  ${[['Ержан',2,'Starbucks, Ткемали','ok'],['Серик',2,'KFC Сайран, БЦК','ok'],['Марат',3,'КМГ Сервис, коворкинг, Сункар','warn']]
   .map(([n,c,o,s])=>`<div class="srow" style="border-left:3px solid ${s==='ok'?'var(--ok)':'var(--warn)'}">
   <div style="flex:1"><b>${esc(n)}</b><div class="mini">${esc(o)}</div></div><b class="mono">${c} ${plural(c,['объект','объекта','объектов'])}</b></div>`).join('')}
  <p class="mini" style="margin:9px 0 0">У Марата три объекта, причём два крупных. Это предел: следующий объект к нему ставить нельзя, даже если бригады найдутся.</p>
 </div>
 <div class="pan"><h3 style="margin:0 0 9px">Что ограничивает рост</h3>
  <div class="kv"><span>Бригады</span><b style="color:var(--warn)">почти предел</b></div>
  <div class="kv"><span>Прорабы</span><b style="color:var(--bad)">предел</b></div>
  <div class="kv"><span>Оборотные деньги</span><b style="color:var(--ok)">запас есть</b></div>
  <div class="kv" style="border:0"><span>Узкое место</span><b>прорабы</b></div>
  <div class="hint" style="margin-top:11px"><b>Практический вывод.</b> Чтобы вырасти с девяти объектов до двенадцати, нужен не оборот и не бригады, а четвёртый прораб. Найм одного человека открывает три объекта — это считается, а не угадывается.</div>
 </div>
</div>`;
/* ====== НАСТРОЙКИ ====== */
SC.roles=()=>`<div class="hd"><div><h2>Права доступа</h2>
 <p>Шесть ролей. Прораб не видит денег, снабженец не видит смет продажи, руководитель проектов не видит маржи. Это не про недоверие, а про то, чтобы у каждого на экране было только его.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Роли настраиваются вами: можно добавить «Технадзор заказчика» с доступом только к фотоотчёту и актам по его объекту — удобный способ снять с себя половину звонков.')">Добавить роль</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.4px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)"><th style="text-align:left;padding:8px;font-size:10px;color:var(--muted)">ЧТО ВИДНО</th>
 ${Object.keys(ROLES).map(r=>`<th style="text-align:center;padding:8px;font-size:9.6px;color:var(--muted)">${esc(r.toUpperCase())}</th>`).join('')}</tr></thead>
 <tbody>${[['Все девять объектов',[1,0,0,1,0,0]],['Свой объект',[1,1,1,1,1,1]],['Смета продажи',[1,1,0,1,0,0]],['Себестоимость и маржа',[1,0,0,0,0,0]],['График работ',[1,1,0,1,0,0]],['Отметка объёмов',[1,1,1,1,0,0]],['Заявки на материал',[1,1,1,0,1,0]],['Цены закупа',[1,0,0,0,1,1]],['Платежи и дебиторка',[1,0,0,0,0,1]],['Табель и ФОТ',[1,1,0,0,0,1]],['Акты и закрытие',[1,1,0,1,0,1]],['Настройки системы',[1,0,0,0,0,0]]]
  .map(([n,a])=>`<tr><td style="padding:7px 8px">${esc(n)}</td>${a.map(v=>`<td style="text-align:center;padding:7px 8px;color:${v?'var(--ok)':'var(--line2)'};font-weight:800">${v?'✓':'—'}</td>`).join('')}</tr>`).join('')}</tbody>
</table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 7px">Журнал действий</h3>
  <p class="mini" style="margin:0">Кто что изменил и когда — по каждой смете, объёму, заявке и акту. Когда через месяц выясняется, что объём завышен, видно, кто и когда его поставил.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Вход</h3>
  <p class="mini" style="margin:0">По номеру телефона с кодом из SMS — прорабам не нужно помнить пароли. Уволился сотрудник — доступ снимается одной кнопкой, а история его отметок остаётся в объектах.</p></div>
</div>`;

SC.integr=()=>`<div class="hd"><div><h2>Интеграции</h2>
 <p>Система не должна становиться ещё одним местом, куда всё вбивается руками. Подключаем то, что у вас уже работает.</p></div></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 7px">WhatsApp</h3><span class="tag" style="background:var(--ok-l);color:var(--ok)">первый релиз</span>
  <p class="mini" style="margin:7px 0 0">Вечерний опрос прорабов, приём фото и заявок, уведомления заказчикам. Через официальный шлюз, с сохранением переписки в объекте.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">1С Бухгалтерия</h3><span class="tag" style="background:var(--ok-l);color:var(--ok)">первый релиз</span>
  <p class="mini" style="margin:7px 0 0">Выгрузка актов и счетов, приём оплат. Бухгалтер не переносит документы руками, а закрывающие по объекту собираются автоматически.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Банк</h3><span class="tag">второй этап</span>
  <p class="mini" style="margin:7px 0 0">Подтягивание поступлений по выписке: платёж сам находит объект и этап, дебиторка обновляется без ручной сверки.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Excel</h3><span class="tag" style="background:var(--ok-l);color:var(--ok)">первый релиз</span>
  <p class="mini" style="margin:7px 0 0">Загрузка смет в том формате, в котором их считает ваш сметчик, и выгрузка любых таблиц обратно. Переучивать никого не нужно.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Телефония</h3><span class="tag">по желанию</span>
  <p class="mini" style="margin:7px 0 0">Если понадобится: звонки заказчикам и подрядчикам с записью, привязанные к объекту.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Расчёт по чертежам</h3><span class="tag" style="background:var(--violet-l);color:var(--violet)">отдельный проект</span>
  <p class="mini" style="margin:7px 0 0">Автоматический подсчёт объёмов по чертежам — то, что мы делали для электромонтажной компании. Обсуждается отдельно, после основной системы.</p></div>
</div>
<div class="said"><b>Что сознательно не подключаем.</b> Никаких «интеграций ради галочки»: календари, диски, доски задач. Чем меньше мест, куда нужно заходить, тем выше шанс, что системой будут пользоваться.</div>`;

SC.migr=()=>`<div class="hd"><div><h2>Переход с Битрикса</h2>
 <p>Вы уже проходили внедрение: полтора миллиона за настройку, ежемесячная оплата и система, которой не пользовались. Здесь важно не повторить тот же путь, поэтому переход устроен иначе.</p></div></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Что было тогда</h3>
  <div class="kv"><span>Стоимость внедрения</span><b>~1 500 000 ₸</b></div>
  <div class="kv"><span>Ежемесячно</span><b>платили</b></div>
  <div class="kv"><span>Пользовались</span><b style="color:var(--bad)">нет</b></div>
  <div class="kv"><span>Почему</span><b>воронка продаж вместо производства</b></div>
  <div class="kv" style="border:0"><span>Кто не заполнял</span><b>прорабы и бригадиры</b></div>
  <div class="note" style="--tone:var(--bad)"><p class="mini" style="margin:0">Ваши слова: «Мы пытались Битрикс поженить со всеми этими работами», «тяжело заставить сотрудников». Система не прижилась не потому, что Битрикс плохой, а потому, что он про другое.</p></div>
 </div>
 <div class="pan"><h3 style="margin:0 0 9px">Как делаем сейчас</h3>
  <div class="li"><b style="color:var(--brand)">1</b><div><b style="font-size:11.6px">Начинаем с одного объекта</b><div class="mini">не переводим все девять разом. Берём один, ведём его от начала до сдачи, смотрим, что не так</div></div></div>
  <div class="li"><b style="color:var(--brand)">2</b><div><b style="font-size:11.6px">Прорабов не трогаем</b><div class="mini">им ничего не устанавливаем и ничему не учим. Бот в WhatsApp начинает писать им сам</div></div></div>
  <div class="li"><b style="color:var(--brand)">3</b><div><b style="font-size:11.6px">Сметы берём как есть</b><div class="mini">загружаем из Excel в том виде, в каком их считает Гульмира</div></div></div>
  <div class="li"><b style="color:var(--brand)">4</b><div><b style="font-size:11.6px">Расширяем по одному объекту</b><div class="mini">каждый новый заходит в систему с момента замера. Через полтора месяца там все</div></div></div>
  <div class="li" style="border:0"><b style="color:var(--brand)">5</b><div><b style="font-size:11.6px">Абонплаты нет</b><div class="mini">система ваша, стоит на вашем сервере. Платите один раз за разработку</div></div></div>
 </div>
</div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Что переносим</h3><p class="mini" style="margin:0">Действующие девять объектов: договоры, сметы, что уже сделано, платежи. Историю сделок из Битрикса — по желанию, обычно она не нужна.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Сколько это занимает</h3><p class="mini" style="margin:0">Перенос активных объектов — три дня силами вашего ПТО вместе с нами. Обучение офиса — два занятия по полтора часа.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Что если не пойдёт</h3><p class="mini" style="margin:0">Первый объект в системе — это проверка. Если после него вы говорите «не то», мы переделываем в рамках проекта, а не продаём доработку.</p></div>
</div>`;

SC.stack=()=>`<div class="hd"><div><h2>Состав первого релиза</h2>
 <p>Что именно входит в работу, в какие сроки и за какие деньги. Этот экран становится приложением № 1 к договору после того, как вы пройдёте демо и скажете, что убрать и что добавить.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Состав релиза выгружен в PDF. После встречи он превращается в приложение № 1 к договору: перечень экранов, ролей и правил, которые мы обязуемся сделать.')">Выгрузить состав</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Стоимость</small><b class="a">2 500 000 ₸</b><span>стандартная разработка</span></div>
 <div><small>Срок</small><b>4–6 недель</b><span>с вашим согласованием</span></div>
 <div><small>Оплата</small><b>10 / 45 / 45</b><span>250 000 при старте</span></div>
 <div><small>Абонплата</small><b class="g">нет</b><span>код и сервер ваши</span></div>
</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Входит в первый релиз</h3>
  ${['Производственная воронка: 8 стадий с правилами перехода','Карточка объекта: смета, факт, график, лента, документы','Смета против факта по разделам, с маржой для владельца','График работ на три недели с критическим путём','Экран прораба: 4 кнопки, работа офлайн','Сбор факта через WhatsApp: вечерний опрос, фото, заявки','Заявки на материал со сверкой по смете','Закуп, поставки и остатки на объекте','Скрытые работы с блокировкой зашивки','Сдача: чек-лист, замечания, фотоотчёт','Допработы и изменения к договору','Платежи, дебиторка, кассовый календарь','Маржа по объектам и причины срывов','Табель и сравнение с нормативом сметы','6 ролей с правами, журнал действий','Загрузка смет из Excel, выгрузка в 1С']
   .map(t=>`<div class="chk" style="border:0;display:flex;gap:8px;align-items:flex-start;padding:4px 0"><b style="color:var(--ok)">✓</b><span style="font-size:11.4px">${esc(t)}</span></div>`).join('')}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 9px">Как идёт работа</h3>
   <div class="tl">
    <div class="tli"><b style="font-size:11.6px">Неделя 1 · архитектура</b><p class="mini" style="margin:2px 0 0">Разбираем ваши процессы, стадии воронки, роли, разделы смет. Утверждаем состав — то самое приложение № 1.</p></div>
    <div class="tli"><b style="font-size:11.6px">Недели 2–3 · ядро</b><p class="mini" style="margin:2px 0 0">Воронка, объекты, сметы и факт, график, WhatsApp-бот. Первый билд вы смотрите на второй неделе.</p></div>
    <div class="tli"><b style="font-size:11.6px">Недели 4–5 · обвязка</b><p class="mini" style="margin:2px 0 0">Снабжение, приёмка, деньги, аналитика, роли. Ещё два-три билда с вашими правками.</p></div>
    <div class="tli"><b style="font-size:11.6px">Неделя 6 · запуск</b><p class="mini" style="margin:2px 0 0">Перенос девяти объектов, обучение, первый объект в работе. Дальше месяц сопровождения.</p></div>
   </div>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Оплата по этапам</h3>
   <div class="kv"><span>При старте · 10%</span><b>250 000 ₸</b></div>
   <div class="kv"><span>После ядра · 45%</span><b>1 125 000 ₸</b></div>
   <div class="kv" style="border:0"><span>При сдаче · 45%</span><b>1 125 000 ₸</b></div>
   <p class="mini" style="margin:9px 0 0">Вы платите 10% и видите ядро. Основные деньги — только после того, как убедились, что это работает.</p>
  </div>
 </div>
</div>
<div class="said"><b>Что мы не обещаем.</b> Что прорабы полюбят систему, — они её просто не заметят, потому что останутся в WhatsApp. И что всё угадаем с первого раза: поэтому и заложены 4–5 билдов с вашими правками, а не один большой запуск в конце.</div>`;

/* ====== ДЕЙСТВИЯ ====== */
function openObj(id){curObj=id;cur='card';build()}
function makeAct(){
 openM('КС-2 за период 01.09 — 18.09','Starbucks · Достык Плаза · Alliance Coffee',
 `<p style="font-size:11.6px;line-height:1.7">Акт собран автоматически из отметок объёмов. В него попали только те разделы, по которым закрыты скрытые работы, — остальное система придержала, чтобы заказчик не отклонил акт целиком из-за одной строки.</p>
  <div class="kv"><span>Демонтаж</span><b class="mono">1 850 000 ₸</b></div>
  <div class="kv"><span>Черновые стены</span><b class="mono">3 420 000 ₸</b></div>
  <div class="kv"><span>Полы: стяжка</span><b class="mono">2 960 000 ₸</b></div>
  <div class="kv"><span>Водоснабжение и канализация</span><b class="mono">1 610 000 ₸</b></div>
  <div class="kv" style="border:0"><span><b>Итого к закрытию</b></span><b class="mono" style="font-size:13px">9 840 000 ₸</b></div>
  <div class="note" style="--tone:var(--warn)"><p class="mini" style="margin:0"><b>Не вошло:</b> вентиляция — не подписан акт скрытых работ по воздуховодам. Сумма 4 147 200 ₸ перенесена в следующий акт.</p></div>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('КС-2 и КС-3 сформированы, отправлены заказчику на подпись. В графике платежей этап помечен как «можно выставить счёт» — бухгалтер увидит это сегодня же.')">Отправить заказчику</button>`);
}
function fmVol(){
 openM('Отметить объём','Starbucks · Достык Плаза · 18 сентября',
 `<p style="font-size:11.6px;line-height:1.7">Прорабу показываются только работы его объекта, которые идут сейчас. Он нажимает на строку и вводит число — без единиц измерения, без выбора из справочников.</p>
  ${[['Потолки: каркас','м²','62'],['Отделка стен: шпаклёвка','м²','48'],['Слаботочка: прокладка','м',''],['Электрика: розетки','точек','']]
   .map(([n,u,v])=>`<div class="srow"><div style="flex:1"><b>${esc(n)}</b><div class="mini">единица: ${u}</div></div>
   <input value="${v}" placeholder="—" style="width:74px;padding:7px;border:1px solid var(--line2);border-radius:5px;text-align:right;background:var(--card);font-weight:700">
   ${v?'<span class="tag" style="background:var(--ok-l);color:var(--ok)">внесено</span>':''}</div>`).join('')}
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Объёмы записаны. Готовность объекта 78%, освоение +1 240 000 ₸, график пересчитан. Всё это произошло без участия офиса.')">Готово</button>`);
}
function fmReq(){
 openM('Заявка на материал','Starbucks · Достык Плаза',
 `<p style="font-size:11.6px;line-height:1.7">Прораб выбирает позицию из сметы объекта и указывает количество. Система сразу показывает, сколько по этой позиции ещё не выбрано, — и предупреждает, если он просит сверх.</p>
  <div class="srow"><div style="flex:1"><b>Профиль потолочный ПП 60×27</b><div class="mini">по смете 700 шт · выбрано 640 · остаток 60</div></div><b class="mono">180 шт</b></div>
  <div class="note" style="--tone:var(--warn)"><p class="mini" style="margin:0"><b>Сверх сметы на 120 шт.</b> Нужно решение руководителя проектов: допработа или наш перерасход. Заявка уйдёт в закуп сразу, чтобы работа не встала, но в смету продажи не попадёт до решения.</p></div>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Заявка З-902 создана и ушла Нурлану. Аскару поставлен вопрос по превышению сметы. Прораб при этом не ждёт ничьего ответа — материал уже в закупе.')">Отправить</button>`);
}
function fmMen(){toast('Отмечено: 9 человек на смене. Это попадёт в табель и сравнится с нормативом по смете. Если людей стабильно больше, чем заложено, — значит смета посчитана оптимистично, и это видно до конца объекта.')}
function fmPhoto(){toast('Фото прикреплено к работе «Потолки: каркас» с датой и геометкой объекта. Через полгода при гарантийном споре это будет доказательством, а не воспоминанием.')}
function waRun(){
 const c=document.getElementById('wachat');if(!c)return;
 const add=(t,mine)=>{const d=document.createElement('div');d.className='msg';
  d.style.cssText=`background:${mine?'#dcf8c6':'#fff'};margin:${mine?'0 0 7px auto':'0 0 7px 0'}`;d.innerHTML=t;c.appendChild(d);c.scrollTop=c.scrollHeight};
 const seq=[['Серик, конец смены. KFC Сайран.<br><b>1.</b> Вентиляция, магистрали — сколько метров?',0],['34',1],
  ['<b>2.</b> Сколько человек было?',0],['12',1],
  ['Записал. Готовность 49%, до сдачи 11 дней.<br>Вентиляция идёт на 3 дня позже графика — что мешает?',0],
  ['подрядчик людей не вывел',1],
  ['Принято. Причина «подрядчик» зафиксирована, Аскару поставлена задача. За квартал это уже пятая задержка по Климат Про — видно в отчёте по подрядчикам.',0]];
 let i=0;const tick=()=>{if(i>=seq.length){toast('Так собирается факт по всем девяти объектам каждый вечер. Прораб не открывал ничего, кроме WhatsApp, — а в системе обновились график, освоение, табель и статистика по подрядчику.');return}
  add(seq[i][0],seq[i][1]);i++;setTimeout(tick,900)};
 c.innerHTML='';tick();
}
function acceptRun(){toast('Проверка готовности: 7 пунктов из 10 закрыты. Объект не может быть переведён на «Гарантию» — блокируют замечания заказчика и брак по витражам. Финальный платёж 5 380 000 ₸ держится именно из-за этого.')}
function searchDemo(v){if(!v)return;
 toast(`Поиск «${esc(v)}»: сквозной по объектам, работам, материалам, заявкам, бригадам и актам. По названию материала видно, на каких объектах он закупался и почём, — удобно перед разговором с поставщиком.`);}
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
 role=ROLES[k]?k:'Владелец';
 document.getElementById('gate').classList.add('hidden');
 document.getElementById('app').classList.remove('hidden');
 const s=document.getElementById('rsel');if(s)s.value=role;
 document.getElementById('me').textContent=ROLES[role].av;
 if(!allowed(cur))cur=ROLES[role].s[0];
 build();
 toast(`Вы вошли как «${role}» · ${ROLES[role].n}. Показаны только те разделы, которые нужны этой роли — так же будет и у ваших сотрудников.`);
}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;
 const s=document.getElementById('rsel');if(s)s.value=role;
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
 document.getElementById('ttl').textContent=SUBN[cur]||'Девять объектов';
 document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('req')?'':'none';
 try{history.replaceState(null,'','?s='+cur)}catch(e){}
}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права доступа. Переключите роль в правом верхнем углу, чтобы посмотреть.');return}
 cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){
 document.getElementById('mt').innerHTML=t;
 document.getElementById('ms').innerHTML=s;
 document.getElementById('mbody').innerHTML=b;
 document.getElementById('mbg').classList.add('show');
}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;
function toast(m){const t=document.getElementById('toast');
 t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();
 toast(theme==='dark'?'Тёмная тема — для вечерней работы и для проектора.':'Светлая тема.')}

/* ====== СЦЕНАРИЙ ПОКАЗА ====== */
const TOUR=[
 ['dash','Девять объектов на одном экране. Сверху не выручка, а то, что горит: срок, готовность, люди. Один объект уже просрочен на два дня.'],
 ['funnel','Производственная воронка. Первая стадия — не лид, а замер по полученному заказу: воронки продаж здесь нет вовсе, она вам не нужна.'],
 ['estfact','Главный экран. Смета против факта по двенадцати разделам: что продали, что сделали, во что обошлось и какая маржа по каждому разделу.'],
 ['gantt','График на три недели. Серое — план, цветное — факт, красная черта — сегодня. Видно не «отстаём», а что именно тянет срок: вентиляция от подрядчика.'],
 ['wa','А вот как это всё наполняется. Прораб не заходит никуда: бот пишет ему в WhatsApp в 18:00 и получает три цифры. Нажмите «Прогнать вечерний опрос».'],
 ['foreman','Приложение прораба на случай, если оно понадобится: четыре кнопки, ни одного текстового поля, работает без связи.'],
 ['req','Заявки с объектов. Система сама сверяет со сметой: кабеля просят больше, чем заложено, — и требует решения до закупа, а не после.'],
 ['hidden','Скрытые работы. Пока технадзор не подписал акт, потолок нельзя зашивать — система физически не даст отметить работу выполненной.'],
 ['volumes','Отметки объёмов за неделю. Обратите внимание на колонку источника: пять отметок из семи пришли из WhatsApp.'],
 ['extra','Допработы — место, где подрядчики теряют больше всего. Последняя строка: щит поставили по устной просьбе, документа нет, денег не будет.'],
 ['accept','Сдача: десять пунктов чек-листа. Объект не уйдёт на гарантию, пока не закрыты все, — и видно, что просрочка уже стоила 169 800 ₸.'],
 ['cash','Кассовый календарь. Неделя с 29 сентября в минусе на 6,2 млн — видно за две недели, а не в день зарплаты.'],
 ['margin','Маржа по объектам. Вывод, который виден только на данных: крупный офис приносит на квадратный метр меньше, чем маленькая аптека.'],
 ['delays','Почему сорвали срок: 61% потерянных дней за квартал — подрядчики, и две трети из них дают всего двое.'],
 ['cap','Сколько ещё объектов потянем. Узкое место — не деньги и не бригады, а прорабы: четвёртый человек открывает три объекта.'],
 ['migr','Как переходим с Битрикса — с одного объекта, не трогая прорабов, без абонплаты.'],
 ['stack','И состав первого релиза: 2 500 000 ₸, оплата 10 / 45 / 45, срок 4–6 недель, код и сервер ваши.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;
 document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;
 if(ti>=TOUR.length){stopTour();toast('Сценарий показа закончен. Дальше можно листать разделы вручную — всё кликается: объекты, объёмы, заявки, акты, WhatsApp-бот.');return}
 const [k,m]=TOUR[ti];
 if(!allowed(k)){step();return}
 cur=k;build();toast(m);
 setTimeout(step,ti===0?5800:6900);
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
