/* ЧИСТАЯ ЛИНИЯ — оптовый склад ухода и косметики (Юлия). Демо на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const bar=w=>`<div class="bar"><i style="width:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const said=(q,a)=>`<div class="said"><b>ЮЛИЯ, 20.11</b><i>«${q}»</i>${a?`<div class="sa">${a}</div>`:''}</div>`;
const tbl=(h,rows)=>`<div class="tw"><table class="t"><thead><tr>${h.map(x=>`<th${x[0]==='>'?' class="r"':''}>${x.replace(/^>/,'')}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
const strip=a=>`<div class="strip">${a.map(x=>`<div><small>${x[0]}</small><b>${x[1]}</b>${x[2]?`<i>${x[2]}</i>`:''}</div>`).join('')}</div>`;

const SEC=[
 {k:'own',n:'Руководителю',sub:[['dash','Пульт'],['fin','Финансы и завод'],['pay','Зарплата реализаторов'],['anal','Что идёт, что лежит'],['reorder','Пора заказывать']]},
 {k:'sale',n:'Продажи',sub:[['funnel','Воронка B2B'],['order','Заказ · калькулятор'],['clients','Контрагенты и лимиты'],['promo','Цены и акции']]},
 {k:'skl',n:'Склад',sub:[['income','Приход по накладной'],['stock','Остатки и партии'],['pick','Лист сборки'],['ship','Отгрузка и списание'],['rev','Ревизия']]},
 {k:'tp',n:'Торговые',sub:[['tpmob','ТП · телефон'],['route','Маршруты на день']]},
 {k:'com',n:'Связь',sub:[['wa','WhatsApp']]},
 {k:'sys',n:'О системе',sub:[['rights','Роли и права'],['own2','Код и передача'],['launch','Стоимость']]}
];
const SECOF={},SUBN={},ALL=[];SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1];ALL.push(x[0])}));
const ROLES={
 'Собственник':{av:'СБ',n:'Юлия',note:'всё: деньги, закуп, маржа, права',s:ALL.slice()},
 'Менеджер':{av:'МН',n:'Айгерим',note:'воронка, заказы, клиенты, WhatsApp; закупочные цены не видит',s:['funnel','order','clients','promo','stock','pick','ship','wa','route','tpmob']},
 'Кладовщик':{av:'КЛ',n:'Ерлан',note:'приход, остатки, сборка, отгрузка, ревизия; без денег',s:['income','stock','pick','ship','rev']},
 'Торговый представитель':{av:'ТП',n:'Данияр',note:'с телефона: остатки, цены, акции, свои клиенты, маршрут',s:['tpmob','route','promo','clients']},
 'Финансист':{av:'ФН',n:'Марат',note:'деньги, завод, зарплаты, долги клиентов',s:['fin','pay','clients','anal','reorder','launch']}
};
let role='Собственник',cur='dash';

/* номенклатура: [код, наименование, бренд, шт/кор, опт ₸, закуп ₸, остаток шт, продано за 30 дн, дней без продаж] */
const P=[
 ['GL-201','Гель для душа «Морская соль» 400 мл','Aqua Verde',24,1150,780,1320,610,0],
 ['GL-204','Гель для душа «Зелёный чай» 400 мл','Aqua Verde',24,1150,780,960,540,1],
 ['SH-110','Шампунь «Объём» 500 мл','Mila Care',20,1490,1010,780,420,0],
 ['SH-114','Шампунь «Против перхоти» 500 мл','Mila Care',20,1590,1080,240,310,2],
 ['BL-120','Бальзам «Восстановление» 500 мл','Mila Care',20,1390,940,410,150,4],
 ['SC-301','Скраб для тела «Кофе» 250 г','Botanica Lux',30,1890,1250,600,280,1],
 ['SC-305','Скраб для тела «Манго» 250 г','Botanica Lux',30,1890,1250,330,60,19],
 ['CR-401','Крем для рук «Ромашка» 75 мл','Botanica Lux',48,690,430,1150,720,0],
 ['CR-410','Крем для лица ночной 50 мл','Botanica Lux',36,2790,1890,190,25,41],
 ['MS-501','Мыло жидкое «Лимон» 500 мл','Aqua Verde',20,890,590,1480,880,0],
 ['MS-502','Мыло жидкое «Алоэ» 5 л','Aqua Verde',4,4900,3400,64,38,3],
 ['DZ-610','Дезодорант-ролик «Fresh» 50 мл','Mila Care',36,990,640,120,290,0],
 ['MC-701','Мицеллярная вода 400 мл','Botanica Lux',24,1690,1120,95,12,57],
 ['HS-801','Набор подарочный «Уход» ','Botanica Lux',8,6900,4600,48,3,64]
];
/* клиенты: [название, тип, город/район, лимит ₸, долг ₸, ТП, оборот 3 мес] */
const C=[
 ['Магазин «Айсулу»','магазин у дома','мкр. Самал',400000,128000,'Данияр',1240000],
 ['Аптека «Дәрі-Плюс»','аптека','центр',800000,312000,'Данияр',2950000],
 ['Сеть «Таза Үй» (4 точки)','сеть хозтоваров','весь город',1500000,940000,'Айгерим',6100000],
 ['Салон «Мейрам»','салон красоты','ул. Толе би',250000,0,'Данияр',480000],
 ['Минимаркет «Береке»','магазин у дома','мкр. Жайлау',300000,286000,'Данияр',870000],
 ['ИП Садыкова · рынок','точка на рынке','рынок',200000,64000,'Данияр',690000],
 ['Гостиница «Каратау»','HoReCa','центр',600000,0,'Айгерим',1120000],
 ['Магазин «Ақ Шаңырақ»','магазин','район вокзала',350000,410000,'Данияр',930000]
];
const pRow=i=>P[i];
const stockTot=()=>P.reduce((a,p)=>a+p[6]*p[5],0);

/* заказ — калькулятор */
let ORD={cl:2,lines:[[0,10],[2,6],[7,8]]};
function ordSum(){return ORD.lines.reduce((a,l)=>a+P[l[0]][4]*P[l[0]][3]*l[1],0)}
function setQ(i,v){v=Math.max(0,parseInt(v)||0);ORD.lines[i][1]=v;build()}
function addL(){const used=ORD.lines.map(l=>l[0]);const f=P.findIndex((p,i)=>used.indexOf(i)<0);if(f<0){toast('Все позиции уже в заказе.');return}ORD.lines.push([f,1]);build()}
function delL(i){ORD.lines.splice(i,1);build()}
function setCl(v){ORD.cl=parseInt(v)||0;build()}
function postOrd(){const c=C[ORD.cl],s=ordSum();if(c[4]+s>c[3]){toast(`Заказ на <b>${tg(s)}</b> превышает лимит «${esc(c[0])}» — нужно согласование собственника или оплата долга.`);return}
 if(ORD.lines.some(l=>l[1]*P[l[0]][3]>P[l[0]][6])){toast('В заказе есть позиция больше остатка — система не даст провести, предложит замену или предзаказ.');return}
 toast(`Заказ на <b>${tg(s)}</b> проведён: резерв на складе, лист сборки ушёл кладовщику, клиенту — счёт в WhatsApp.`)}

/* приход */
let INC=[[0,40,24],[2,30,20],[5,20,30],[11,25,36]];let incDone=false;
function setInc(i,v){INC[i][1]=Math.max(0,parseInt(v)||0);build()}
function postInc(){if(incDone){toast('Накладная уже оприходована — повторно не проведётся.');return}INC.forEach(l=>{P[l[0]][6]+=l[1]*l[2]});incDone=true;build();toast('Приход проведён: остатки увеличены, партия № П-1124, долг перед заводом вырос на сумму накладной.')}
/* сборка */
let PICK=[true,true,false,false,false];
function tgP(i){PICK[i]=!PICK[i];build()}
/* ревизия */
let REV={0:1320,2:778,5:600,7:1146,9:1480,12:95};
function setRev(i,v){REV[i]=parseInt(v)||0;build()}
let shipDone=false;
function doShip(){if(shipDone){toast('Отгрузка уже проведена.');return}shipDone=true;build();toast('Отгружено: товар списан со склада, долг клиента +192 960 ₸, накладная и счёт-фактура сформированы.')}

const SC={};
SC.dash=()=>{const debt=C.reduce((a,c)=>a+c[4],0);return said('Чтобы всё было в одном, чтобы ничего не потерялось — а не десять программ и десять файлов.','Пульт собирает склад, продажи, долги и завод на одном экране.')+
 strip([['Продажи ноябрь','14,8 млн ₸','план 16 млн · 92%'],['Товар на складе',(stockTot()/1e6).toFixed(1).replace('.',',')+' млн ₸','по закупу'],['Долги клиентов',tg(debt),'2 клиента сверх лимита'],['Долг заводу','6,2 млн ₸','оплата до 05.12'],['Маржа','32%','после скидок']])+
 `<div class="g31"><div class="box"><h3>Сегодня <small>пятница, 20.11</small></h3>${tbl(['Что','Кто','>Сумма',''],[
 `<tr><td>Заказ «Таза Үй» — собрать к 16:00</td><td>Ерлан</td><td class="r num">${tg(192960)}</td><td><span class="tag warn">сборка</span></td></tr>`,
 `<tr><td>Приход: накладная завода № 4471</td><td>Ерлан</td><td class="r num">${tg(2140000)}</td><td><span class="tag">ждёт</span></td></tr>`,
 `<tr><td>3 заказа от торговых с маршрута</td><td>Данияр</td><td class="r num">${tg(318400)}</td><td><span class="tag ok">в резерве</span></td></tr>`,
 `<tr class="hl"><td>«Ақ Шаңырақ» превысил лимит</td><td>Айгерим</td><td class="r num">${tg(410000)}</td><td><span class="tag bad">стоп-отгрузка</span></td></tr>`,
 `<tr><td>Завтра ревизия — бланк готов</td><td>Ерлан</td><td class="r num">14 SKU</td><td><span class="tag">план</span></td></tr>`])}
 <div class="btns"><button class="bt" onclick="go('order')">Новый заказ</button><button class="bt o" onclick="go('income')">Принять приход</button><button class="bt o" onclick="go('reorder')">Что заказать у завода</button></div></div>
 <div class="box"><h3>Сигналы</h3>
 <div class="kv"><span><span class="dot d-bad"></span>Мицеллярная вода — 57 дней без продаж</span><b class="num">95 шт</b></div>
 <div class="kv"><span><span class="dot d-warn"></span>Дезодорант «Fresh» закончится через 12 дней</span><b class="num">120 шт</b></div>
 <div class="kv"><span><span class="dot d-warn"></span>Шампунь «Против перхоти» — на 23 дня</span><b class="num">240 шт</b></div>
 <div class="kv"><span><span class="dot d-bad"></span>2 клиента выше лимита</span><b class="num">696 000 ₸</b></div>
 <div class="kv"><span><span class="dot d-ok"></span>Поставка от завода идёт ~45 дней</span><b class="num">заказ до 25.11</b></div>
 <p class="note">Сигналы считаются сами из остатков, продаж и срока поставки.</p></div></div>`};
SC.fin=()=>strip([['Выручка ноябрь','14,8 млн ₸'],['Закуп за месяц','9,6 млн ₸'],['Оплачено заводу','3,4 млн ₸'],['Зарплата реализаторов','1,12 млн ₸'],['Остаток на счёте','2,9 млн ₸']])+
 said('По сути, из расходов у нас только закупки товара, расчёты с заводом и зарплаты реализаторов.','Поэтому финмодель простая: три статьи расходов и живой баланс по заводу.')+
 `<div class="g2"><div class="box"><h3>Расчёты с заводом <small>акт сверки в один клик</small></h3>${tbl(['Дата','Документ','>Начислено','>Оплачено','>Долг'],[
 '<tr><td>02.10</td><td>Накладная № 4398</td><td class="r num">4 820 000</td><td class="r num"></td><td class="r num">4 820 000</td></tr>',
 '<tr><td>15.10</td><td>Платёж п/п 211</td><td class="r num"></td><td class="r num">2 000 000</td><td class="r num">2 820 000</td></tr>',
 '<tr><td>06.11</td><td>Накладная № 4433</td><td class="r num">4 780 000</td><td class="r num"></td><td class="r num">7 600 000</td></tr>',
 '<tr><td>14.11</td><td>Платёж п/п 236</td><td class="r num"></td><td class="r num">1 400 000</td><td class="r num">6 200 000</td></tr>',
 '<tr class="hl"><td>05.12</td><td>Плановый платёж</td><td class="r num"></td><td class="r num">3 000 000</td><td class="r num">3 200 000</td></tr>'])}
 <div class="btns"><button class="bt o s" onclick="toast(\'Акт сверки с заводом сформирован в Excel и PDF.\')">Акт сверки</button><button class="bt o s" onclick="toast(\'Платёж 05.12 поставлен в календарь платежей, финансисту — напоминание за 2 дня.\')">Запланировать платёж</button></div></div>
 <div class="box"><h3>Движение денег по неделям</h3>${tbl(['Неделя','>Пришло','>Заводу','>Зарплата','>Итог'],[
 '<tr><td>02–08.11</td><td class="r num">3 420 000</td><td class="r num">0</td><td class="r num">0</td><td class="r num">+3 420 000</td></tr>',
 '<tr><td>09–15.11</td><td class="r num">3 910 000</td><td class="r num">1 400 000</td><td class="r num">560 000</td><td class="r num">+1 950 000</td></tr>',
 '<tr><td>16–22.11</td><td class="r num">2 880 000</td><td class="r num">0</td><td class="r num">0</td><td class="r num">+2 880 000</td></tr>',
 '<tr><td>23–29.11</td><td class="r num">≈3 600 000</td><td class="r num">0</td><td class="r num">560 000</td><td class="r num">прогноз</td></tr>'])}
 <p class="note">Финансист видит деньги и долги, но не может менять заказы и склад — так настроены права.</p></div></div>`;
SC.pay=()=>said('…зарплаты реализаторов.','Процент считается с оплаченных отгрузок — неоплаченный долг клиента в зарплату не идёт.')+
 `<div class="box"><h3>Ноябрь, по оплаченным отгрузкам <small>схема: оклад + % — правится в настройках</small></h3>${tbl(['Сотрудник','Роль','>Оклад','>Оплачено клиентами','>%','>Бонус','>Итого'],[
 `<tr><td>Данияр</td><td>торговый представитель</td><td class="r num">150 000</td><td class="r num">6 120 000</td><td class="r num">3%</td><td class="r num">183 600</td><td class="r num"><b>333 600</b></td></tr>`,
 `<tr><td>Айгерим</td><td>менеджер</td><td class="r num">220 000</td><td class="r num">7 340 000</td><td class="r num">2%</td><td class="r num">146 800</td><td class="r num"><b>366 800</b></td></tr>`,
 `<tr><td>Ерлан</td><td>кладовщик</td><td class="r num">200 000</td><td class="r num">—</td><td class="r num">—</td><td class="r num">20 000</td><td class="r num"><b>220 000</b></td></tr>`,
 `<tr><td>Асель</td><td>торговый, полставки</td><td class="r num">90 000</td><td class="r num">1 330 000</td><td class="r num">3%</td><td class="r num">39 900</td><td class="r num"><b>129 900</b></td></tr>`])}
 <p class="note">Бонус кладовщику — за ревизию без расхождений. Суммы условные.</p><div class="btns"><button class="bt o s" onclick="toast(\'Ведомость за ноябрь выгружена в Excel.\')">Ведомость в Excel</button></div></div>`;
SC.anal=()=>{const rows=P.map((p,i)=>({p,i,rev:p[7]*p[4]})).sort((a,b)=>b.rev-a.rev);const tot=rows.reduce((a,r)=>a+r.rev,0);let acc=0;
 return said('…что идёт, что задержалось, где что хорошо идёт.','ABC по выручке и список залежалого: деньги, замороженные в товаре.')+
 `<div class="g31"><div class="box"><h3>ABC за 30 дней</h3>${tbl(['Код','Товар','>Продано, шт','>Выручка','Класс',''],rows.map(r=>{acc+=r.rev;const c=acc/tot<=.7?'A':acc/tot<=.9?'B':'C';return `<tr><td class="num">${r.p[0]}</td><td>${esc(r.p[1])}</td><td class="r num">${fmt(r.p[7])}</td><td class="r num">${fmt(r.rev)}</td><td><span class="tag ${c==='A'?'ok':c==='C'?'bad':''}">${c}</span></td><td style="width:90px">${bar(pct(r.rev,rows[0].rev))}</td></tr>`}))}</div>
 <div class="box"><h3>Лежит без движения</h3>${P.filter(p=>p[8]>=14).map(p=>`<div class="kv"><span>${esc(p[1])}<br><small class="note">${p[8]} дн. без продаж</small></span><b class="num">${tg(p[6]*p[5])}</b></div>`).join('')}
 <p class="note">Предложение системы: включить эти позиции в акцию для торговых или в набор к ходовому товару.</p><div class="btns"><button class="bt a s" onclick="go('promo')">Сделать акцию</button></div></div></div>`};
SC.reorder=()=>said('Мы убеждаемся постоянно: ждём за две недели — получаем через полтора месяца.','Поэтому система считает остаток в днях и сравнивает со сроком поставки ~45 дней + запас.')+
 `<div class="box"><h3>Заказ заводу <small>срок поставки 45 дн. · запас 15 дн.</small></h3>${tbl(['Код','Товар','>Остаток','>Продаж/день','>Хватит, дн.','>Заказать, кор.',''],P.map(p=>{const d=p[7]/30,days=d?Math.round(p[6]/d):999,need=Math.max(0,Math.ceil((d*60-p[6])/p[3]));return `<tr${days<60?' class="hl"':''}><td class="num">${p[0]}</td><td>${esc(p[1])}</td><td class="r num">${fmt(p[6])}</td><td class="r num">${d.toFixed(1)}</td><td class="r num">${days>500?'—':days}</td><td class="r num">${need||'—'}</td><td>${days<45?'<span class="tag bad">срочно</span>':days<60?'<span class="tag warn">пора</span>':'<span class="tag ok">ок</span>'}</td></tr>`}))}
 <div class="btns"><button class="bt" onclick="toast(\'Черновик заказа заводу собран по строкам «срочно» и «пора» — отправлен на согласование Юлии.\')">Собрать заказ заводу</button><button class="bt o" onclick="toast(\'Заказ выгружен в Excel в формате завода.\')">Excel для завода</button></div></div>`;
SC.funnel=()=>{const cols=[['Новый лид',[['Аптека «Шипагер»','звонок · 2 точки',0],['Салон «Ару»','WhatsApp',0]]],['Прайс отправлен',[['Магазин «Дана»','ждёт ответа 2 дня',1],['Кафе-отель «Тараз Ин»','HoReCa',0]]],['Пробный заказ',[['Минимаркет «Нур»','82 000 ₸',0]]],['Постоянный',[['Сеть «Таза Үй»','6,1 млн за 3 мес',0],['Аптека «Дәрі-Плюс»','2,95 млн',0]]],['Повтор просрочен',[['Салон «Мейрам»','нет заказа 34 дня',1]]],['Стоп: долг',[['Магазин «Ақ Шаңырақ»','410 000 ₸ сверх лимита',1]]]];
 return said('Нужно, чтобы продажи были связаны со складом.','Воронка B2B: новые точки и повторные заказы постоянных клиентов.')+
 `<div class="kan">${cols.map(c=>`<div class="col"><h4>${c[0]}<span class="num">${c[1].length}</span></h4>${c[1].map(d=>`<div class="dl ${d[2]?'hot':''}" onclick="openM('${esc(d[0])}','${esc(c[0])}','<div class=kv><span>Ответственный</span><b>Айгерим</b></div><div class=kv><span>Источник</span><b>${esc(d[1])}</b></div><div class=kv><span>Следующий шаг</span><b>позвонить сегодня до 17:00</b></div><p class=note>Из карточки — заказ, счёт и переписка в WhatsApp.</p>')"><b>${esc(d[0])}</b>${esc(d[1])}</div>`).join('')}</div>`).join('')}</div>
 <p class="note">«Повтор просрочен» система ставит сама, если постоянный клиент не заказывал дольше обычного.</p>`};
SC.order=()=>{const c=C[ORD.cl],s=ordSum(),free=c[3]-c[4];
 return said('Формируем заказ клиента, его нужно собрать и списать со склада — в деньгах и в количестве.','Калькулятор сразу проверяет остаток на складе и лимит клиента.')+
 `<div class="g31"><div class="box"><h3>Заказ № З-2287</h3><div style="margin-bottom:10px"><select class="inp" onchange="setCl(this.value)" aria-label="Клиент">${C.map((x,i)=>`<option value="${i}" ${i===ORD.cl?'selected':''}>${esc(x[0])}</option>`).join('')}</select></div>
 ${tbl(['Товар','>Кор.','>Шт','>Остаток','>Сумма',''],ORD.lines.map((l,i)=>{const p=P[l[0]],pcs=l[1]*p[3],ok=pcs<=p[6];return `<tr${ok?'':' class="hl"'}><td>${esc(p[1])}<br><small class="note">${p[3]} шт/кор · ${tg(p[4])}/шт</small></td><td class="r"><input class="inp qty num" type="number" min="0" value="${l[1]}" onchange="setQ(${i},this.value)" aria-label="коробок"></td><td class="r num">${fmt(pcs)}</td><td class="r num">${ok?fmt(p[6]):'<b style="color:var(--bad)">'+fmt(p[6])+'</b>'}</td><td class="r num">${fmt(pcs*p[4])}</td><td><button class="bt o s" onclick="delL(${i})">×</button></td></tr>`}))}
 <div class="btns"><button class="bt o s" onclick="addL()">+ позиция</button></div></div>
 <div class="box"><h3>Итого</h3><div class="kv"><span>Сумма заказа</span><b class="num">${tg(s)}</b></div><div class="kv"><span>Лимит клиента</span><b class="num">${tg(c[3])}</b></div><div class="kv"><span>Текущий долг</span><b class="num">${tg(c[4])}</b></div><div class="kv"><span>Свободно</span><b class="num" style="color:${free-s<0?'var(--bad)':'var(--ok)'}">${tg(free-s)}</b></div>
 ${free-s<0?'<p class="note" style="color:var(--bad)">Превышение лимита — заказ уйдёт на согласование.</p>':''}
 <div class="btns"><button class="bt a" onclick="postOrd()">Провести и в сборку</button><button class="bt o" onclick="toast('Счёт на оплату отправлен клиенту в WhatsApp.')">Счёт в WhatsApp</button></div></div></div>`};
SC.clients=()=>`<div class="box"><h3>Контрагенты <small>лимит, долг, ответственный</small></h3>${tbl(['Клиент','Тип','Район','ТП','>Оборот 3 мес','>Лимит','>Долг',''],C.map(c=>`<tr${c[4]>c[3]?' class="hl"':''}><td><b>${esc(c[0])}</b></td><td>${c[1]}</td><td>${c[2]}</td><td>${c[5]}</td><td class="r num">${fmt(c[6])}</td><td class="r num">${fmt(c[3])}</td><td class="r num">${fmt(c[4])}</td><td>${c[4]>c[3]?'<span class="tag bad">стоп</span>':c[4]>c[3]*.8?'<span class="tag warn">близко</span>':'<span class="tag ok">ок</span>'}</td></tr>`))}
 <div class="btns"><button class="bt o s" onclick="toast('Напоминания о долге отправлены 3 клиентам в WhatsApp.')">Напомнить о долгах</button><button class="bt o s" onclick="toast('Акт сверки с клиентом сформирован.')">Акт сверки</button></div></div>
 <p class="note">Торговый видит только своих клиентов; лимиты меняет только собственник.</p>`;
SC.promo=()=>`<div class="g2"><div class="box"><h3>Прайс-лист опт <small>цена за штуку</small></h3>${tbl(['Код','Товар','Бренд','>Шт/кор','>Цена'],P.map(p=>`<tr><td class="num">${p[0]}</td><td>${esc(p[1])}</td><td>${p[2]}</td><td class="r num">${p[3]}</td><td class="r num">${fmt(p[4])}</td></tr>`))}
 <div class="btns"><button class="bt o s" onclick="toast('Прайс в PDF отправлен в WhatsApp-рассылку постоянным клиентам.')">Прайс в WhatsApp</button></div></div>
 <div class="box"><h3>Акции ноября</h3>
 <div class="kv"><span><b>−15% на «Манго» и мицеллярную воду</b><br><small class="note">разгружаем залежалое · до 30.11</small></span><span class="tag ok">идёт</span></div>
 <div class="kv"><span><b>10 кор. гелей → 1 кор. крема для рук</b><br><small class="note">для магазинов у дома</small></span><span class="tag ok">идёт</span></div>
 <div class="kv"><span><b>Подарочные наборы к Новому году</b><br><small class="note">предзаказ до 10.12</small></span><span class="tag">план</span></div>
 <p class="note">Торговые видят акции в телефоне и предлагают их на точке.</p><div class="btns"><button class="bt a s" onclick="toast('Новая акция создана и появилась у торговых.')">+ акция</button></div></div></div>`;
SC.income=()=>{const sum=INC.reduce((a,l)=>a+l[1]*l[2]*P[l[0]][5],0),pcs=INC.reduce((a,l)=>a+l[1]*l[2],0);
 return said('Получили товар с завода — нужно эту накладную посадить на наш склад: сколько коробок, сколько в коробке штук.','Кладовщик вводит коробки, штуки считаются сами, партия получает номер.')+
 `<div class="box"><h3>Накладная завода № 4471 <small>от 18.11.2026 · партия П-1124</small></h3>${tbl(['Код','Товар','>Коробок','>Шт в кор.','>Штук','>Закуп/шт','>Сумма'],INC.map((l,i)=>{const p=P[l[0]];return `<tr><td class="num">${p[0]}</td><td>${esc(p[1])}</td><td class="r"><input class="inp qty num" type="number" min="0" value="${l[1]}" onchange="setInc(${i},this.value)" ${incDone?'disabled':''} aria-label="коробок"></td><td class="r num">${l[2]}</td><td class="r num">${fmt(l[1]*l[2])}</td><td class="r num">${fmt(p[5])}</td><td class="r num">${fmt(l[1]*l[2]*p[5])}</td></tr>`}))}
 ${strip([['Коробок',fmt(INC.reduce((a,l)=>a+l[1],0))],['Штук',fmt(pcs)],['Сумма по закупу',tg(sum)],['Статус',incDone?'проведено':'черновик']])}
 <div class="btns"><button class="bt a" onclick="postInc()">${incDone?'Проведено ✓':'Оприходовать'}</button><button class="bt o" onclick="toast('Фото накладной прикреплено к партии П-1124.')">Фото накладной</button><button class="bt o" onclick="toast('Расхождение по коробкам записано — акт для завода сформирован.')">Акт расхождения</button></div></div>`};
SC.stock=()=>`<div class="box"><h3>Остатки <small>в коробках, штуках и деньгах</small></h3>${tbl(['Код','Товар','Бренд','>Кор.','>Шт','>По закупу','>По опту','Партии'],P.map(p=>`<tr><td class="num">${p[0]}</td><td>${esc(p[1])}</td><td>${p[2]}</td><td class="r num">${Math.floor(p[6]/p[3])}</td><td class="r num">${fmt(p[6])}</td><td class="r num">${fmt(p[6]*p[5])}</td><td class="r num">${fmt(p[6]*p[4])}</td><td class="num">П-1092, П-1124</td></tr>`))}
 ${strip([['Всего по закупу',tg(stockTot())],['Всего по опту',tg(P.reduce((a,p)=>a+p[6]*p[4],0))],['Позиций',P.length],['Брендов','3 + китайский товар — позже']])}</div>
 <p class="note">Когда добавится китайский товар — это просто новый поставщик и новые карточки, отдельная программа не нужна.</p>`;
SC.pick=()=>{const L=[[0,10],[1,6],[7,8],[9,12],[11,4]];const done=PICK.filter(Boolean).length;
 return `<div class="steps"><div class="dn">Заказ</div><div class="on">Сборка</div><div>Отгрузка</div><div>Оплата</div></div>
 <div class="box"><h3>Лист сборки · заказ З-2286 · «Таза Үй» <small>собрано ${done} из ${L.length}</small></h3>${tbl(['','Ячейка','Товар','>Кор.','>Шт'],L.map((l,i)=>{const p=P[l[0]];return `<tr${PICK[i]?'':' class="hl"'}><td><button class="bt ${PICK[i]?'':'o'} s" onclick="tgP(${i})">${PICK[i]?'✓':'—'}</button></td><td class="num">A-${i+1}-0${(i%3)+1}</td><td>${esc(p[1])}</td><td class="r num">${l[1]}</td><td class="r num">${fmt(l[1]*p[3])}</td></tr>`}))}
 ${bar(pct(done,L.length))}<div class="btns"><button class="bt" onclick="${done===L.length?"go('ship')":"toast('Соберите все строки — тогда заказ перейдёт в отгрузку.')"}">Собрано → в отгрузку</button><button class="bt o" onclick="toast('Лист сборки отправлен на печать.')">Печать листа</button></div></div>
 <p class="note">Работает и с компьютера, и с телефона/КПК на складе: отметка по строке.</p>`};
SC.ship=()=>`<div class="steps"><div class="dn">Заказ</div><div class="dn">Сборка</div><div class="${shipDone?'dn':'on'}">Отгрузка</div><div ${shipDone?'class="on"':''}>Оплата</div></div>
 <div class="g2"><div class="box"><h3>Отгрузка З-2286 · «Таза Үй»</h3>${tbl(['Товар','>Шт','>Сумма'],[[0,240],[1,144],[7,384],[9,240],[11,144]].map(l=>`<tr><td>${esc(P[l[0]][1])}</td><td class="r num">${l[1]}</td><td class="r num">${fmt(l[1]*P[l[0]][4])}</td></tr>`))}
 <div class="btns"><button class="bt a" onclick="doShip()">${shipDone?'Отгружено ✓':'Отгрузить и списать'}</button><button class="bt o" onclick="toast('Накладная на отпуск товара — в PDF.')">Накладная</button></div></div>
 <div class="box"><h3>Что произойдёт при отгрузке</h3>
 <div class="kv"><span>Склад — списание в штуках</span><b class="num">1 152 шт</b></div>
 <div class="kv"><span>Склад — списание по закупу</span><b class="num">${tg(784320)}</b></div>
 <div class="kv"><span>Клиенту — долг по опту</span><b class="num">${tg(1196160)}</b></div>
 <div class="kv"><span>Маржа отгрузки</span><b class="num">${tg(411840)}</b></div>
 <div class="kv"><span>Реализатору в зарплату</span><b>после оплаты клиентом</b></div>
 <p class="note">${shipDone?'Проведено: остатки уменьшены, долг клиента вырос.':'Пока не проведено.'}</p></div></div>`;
SC.rev=()=>{const ks=Object.keys(REV).map(Number);let diff=0;
 const rows=ks.map(i=>{const p=P[i],d=REV[i]-p[6];diff+=d*p[5];return `<tr${d?' class="hl"':''}><td>${esc(p[1])}</td><td class="r num">${fmt(p[6])}</td><td class="r"><input class="inp qty num" type="number" value="${REV[i]}" onchange="setRev(${i},this.value)" aria-label="факт"></td><td class="r num">${d>0?'+':''}${d}</td><td class="r num">${fmt(d*p[5])}</td></tr>`});
 return said('Завтра мы планировали ревизию провести.','Бланк ревизии: учёт против факта, расхождения сразу в деньгах.')+
 `<div class="box"><h3>Ревизия 21.11 · выборочно 6 позиций</h3>${tbl(['Товар','>Учёт','>Факт','>Разница','>₸'],rows)}
 ${strip([['Расхождение',tg(diff)],['Позиций с разницей',ks.filter(i=>REV[i]!==P[i][6]).length],['Ответственный','Ерлан']])}
 <div class="btns"><button class="bt a" onclick="toast('Ревизия закрыта: акт сформирован, остатки выровнены, расхождение — собственнику.')">Закрыть ревизию</button><button class="bt o" onclick="toast('Бланк ревизии распечатан.')">Бланк на печать</button></div></div>`};
SC.tpmob=()=>`<div class="g2"><div class="phone"><div class="ph">Данияр · торговый · 20.11</div>
 <div class="pc" onclick="go('route')"><b>Маршрут: 7 точек</b>пройдено 3 · следующая «Береке», 11:40</div>
 <div class="pc" onclick="openM('Остатки','для торговых — без закупочных цен','${P.slice(0,8).map(p=>`<div class=kv><span>${esc(p[1])}</span><b>${fmt(p[6])} шт</b></div>`).join('')}')"><b>Остатки на складе</b>что можно продавать сегодня</div>
 <div class="pc" onclick="go('promo')"><b>Акции · 2</b>−15% «Манго», подарок к гелям</div>
 <div class="pc" onclick="toast('Заказ с точки «Айсулу» на 84 600 ₸ отправлен — склад видит его сразу.')"><b>+ Заказ с точки</b>«Айсулу» · 6 позиций</div>
 <div class="pc" onclick="toast('Долг «Береке»: 286 000 ₸ — лимит почти исчерпан, сначала оплата.')"><b>Долг клиента</b>«Береке» · близко к лимиту</div></div>
 <div class="box"><h3>Что видит торговый</h3>${said('Чтобы торговые хотя бы владели остатками, понимали, что им продавать.','Отдельная роль с ограниченным доступом: работает с телефона или КПК.')}
 <div class="kv"><span>Остатки и цены опта</span><b>да</b></div><div class="kv"><span>Акции</span><b>да</b></div><div class="kv"><span>Свои клиенты и долги</span><b>да</b></div><div class="kv"><span>Маршрут на день</span><b>да</b></div><div class="kv"><span>Закупочные цены и маржа</span><b>нет</b></div><div class="kv"><span>Чужие клиенты</span><b>нет</b></div></div></div>`;
SC.route=()=>`<div class="box"><h3>Маршрут Данияра · 20.11 <small>7 точек</small></h3>${tbl(['№','Точка','Время','Задача','Итог'],[
 '<tr><td>1</td><td>Аптека «Дәрі-Плюс»</td><td class="num">09:30</td><td>повторный заказ</td><td><span class="tag ok">заказ 126 400</span></td></tr>',
 '<tr><td>2</td><td>Салон «Мейрам»</td><td class="num">10:20</td><td>34 дня без заказа</td><td><span class="tag ok">заказ 42 000</span></td></tr>',
 '<tr><td>3</td><td>ИП Садыкова · рынок</td><td class="num">11:00</td><td>забрать оплату</td><td><span class="tag ok">оплата 64 000</span></td></tr>',
 '<tr class="hl"><td>4</td><td>Минимаркет «Береке»</td><td class="num">11:40</td><td>долг у лимита</td><td><span class="tag warn">в пути</span></td></tr>',
 '<tr><td>5</td><td>Магазин «Айсулу»</td><td class="num">12:30</td><td>акция гели + крем</td><td><span class="tag">план</span></td></tr>',
 '<tr><td>6</td><td>Магазин «Ақ Шаңырақ»</td><td class="num">14:00</td><td>только оплата — стоп-отгрузка</td><td><span class="tag bad">стоп</span></td></tr>',
 '<tr><td>7</td><td>Новая точка «Шипагер»</td><td class="num">15:00</td><td>презентация прайса</td><td><span class="tag">план</span></td></tr>'])}
 <div class="btns"><button class="bt o s" onclick="toast('Маршрут на завтра собран по точкам с просроченным повтором и долгами.')">Собрать маршрут на завтра</button></div></div>
 <p class="note">Маршрут менеджер составляет за минуту — система подсказывает, кого пора навестить.</p>`;
SC.wa=()=>`<div class="chat"><div class="chl"><div class="on">Сеть «Таза Үй»<small>Пришлите счёт, пожалуйста</small></div><div>Аптека «Дәрі-Плюс»<small>Есть шампунь от перхоти?</small></div><div>Салон «Мейрам»<small>Скраб манго ещё по акции?</small></div><div>Новый номер +7 701 …<small>Здравствуйте, вы оптом?</small></div></div>
 <div class="chm"><div class="msg">Добрый день! Пришлите счёт по сегодняшнему заказу, пожалуйста</div><div class="msg me">Здравствуйте! Заказ З-2286 собран, счёт на 1 196 160 ₸</div><div class="msg me">Счёт № 2286.pdf — вложение</div><div class="msg">Спасибо, оплатим сегодня</div>
 <div class="btns"><button class="bt s" onclick="toast('Из переписки создан заказ — открыт калькулятор.');go('order')">Создать заказ</button><button class="bt o s" onclick="toast('Новый номер заведён лидом в воронку.')">В воронку</button></div></div></div>
 <p class="note">Все переписки остаются в карточке клиента — даже если менеджер уволится.</p>`;
SC.rights=()=>`<div class="box"><h3>Кто что видит</h3>${tbl(['Раздел','Собств.','Менеджер','Кладовщик','Торговый','Финансист'],[
 ['Закупочные цены, маржа','✓','—','—','—','✓'],['Заказы и воронка','✓','✓','—','свои','—'],['Приход, сборка, ревизия','✓','просмотр','✓','—','—'],['Лимиты клиентов','меняет','видит','—','свои','видит'],['Деньги, завод, зарплаты','✓','—','—','—','✓'],['Права и пользователи','✓','—','—','—','—']].map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`))}
 <p class="note">6 пользователей сейчас; ограничений по числу пользователей нет — запас до 50.</p></div>
 <div class="box"><h3>Как добавить сотрудника</h3><div class="kv"><span>1. Собственник создаёт логин</span><b>1 минута</b></div><div class="kv"><span>2. Выбирает роль — права подставятся сами</span><b>5 ролей</b></div><div class="kv"><span>3. Уволился — логин блокируется, клиенты и переписки остаются</span><b>в системе</b></div><div class="btns"><button class="bt o s" onclick="toast('Новый пользователь создан с ролью «Торговый представитель».')">+ пользователь</button></div></div>`;
SC.own2=()=>`<div class="g2"><div class="box"><h3>Система ваша</h3><div class="kv"><span>Код</span><b>передаётся полностью</b></div><div class="kv"><span>Сервер</span><b>ваш</b></div><div class="kv"><span>Аренда, подписка</span><b>0 ₸</b></div><div class="kv"><span>Ограничения по пользователям</span><b>нет</b></div><div class="kv"><span>На баланс компании</span><b>можно</b></div></div>
 <div class="box"><h3>После сдачи</h3><div class="kv"><span>Сопровождение</span><b>3 месяца включено</b></div><div class="kv"><span>Дальше</span><b>20 $/час по запросу</b></div><div class="kv"><span>Обычно</span><b>1–2 обращения в год</b></div><p class="note">Документация и доступы — у вас, можно работать с любым разработчиком.</p></div></div>
 <div class="box"><h3>Почему не аренда</h3><p>Аренда облачной CRM и складской программы на 6 человек обычно стоит десятки тысяч тенге каждый месяц и дорожает каждый год. Своя система оплачивается один раз и дальше работает без абонплаты — бизнес-процессы склада годами не меняются, а новые позиции и поставщиков вы заводите сами.</p><p class="note">Цифры аренды в КП — ориентировочная оценка.</p></div>`;
SC.launch=()=>`<div class="box"><h3>Стоимость <small>подробно — в КП</small></h3><div class="kv"><span>Стандартный пакет (всё, что в этом демо)</span><b class="num">1 800 000 ₸</b></div><div class="kv"><span>Интеграция с 1С — опция</span><b class="num">+800 000 ₸</b></div><div class="kv"><span>Срок</span><b>4–6 недель</b></div><div class="kv"><span>Оплата</span><b class="num">30 / 40 / 30</b></div><div class="kv"><span>Сервер и WhatsApp-шлюз</span><b>провайдерам напрямую</b></div></div>
 <div class="box"><h3>Три этапа</h3><div class="kv"><span>1. Старт: утверждаем склад, роли, воронку</span><b class="num">540 000 ₸</b></div><div class="kv"><span>2. Система развёрнута на вашем сервере и работает</span><b class="num">720 000 ₸</b></div><div class="kv"><span>3. Полировка по вашим правкам и сдача</span><b class="num">540 000 ₸</b></div><p class="note">В пакете запас ~20% на функции, которые всплывут по ходу. Срок держим, если правки приходят в течение суток.</p></div>`;

function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${v.av}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');document.getElementById('rsel').innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');document.getElementById('rsel').value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;document.getElementById('rsel').value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function goSec(k){const S=SEC.find(x=>x.k===k);const f=S.sub.find(x=>allowed(x[0]));if(f)go(f[0])}
function buildRail(){const vis=SEC.filter(s=>s.sub.some(x=>allowed(x[0])));document.getElementById('rail').innerHTML=vis.map((s,i)=>`<div class="ri ${s.k===SECOF[cur]?'on':''}" onclick="goSec('${s.k}')"><span>${String(i+1).padStart(2,'0')}</span>${s.n}</div>`).join('');
 const S=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('tabs').innerHTML=S.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('');
 document.getElementById('crumb').innerHTML=`${esc(S.n)} / <b>${esc(SUBN[cur])}</b> · ${esc(role)}, ${esc(ROLES[role].n)}`}
function build(){if(!allowed(cur))cur=ROLES[role].s[0];buildRail();document.getElementById('ttl').textContent=SUBN[cur];document.getElementById('content').innerHTML=SC[cur]();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль.');return}cur=k;build();window.scrollTo(0,0)}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6000)}
const TOUR=[['dash','1 · Пульт: продажи, склад, долги, завод.'],['income','2 · Приход: коробки × штуки, партия.'],['order','3 · Заказ: проверка остатка и лимита клиента.'],['pick','4 · Лист сборки для кладовщика.'],['ship','5 · Отгрузка: списание в штуках и деньгах.'],['tpmob','6 · Торговый с телефона: остатки, акции, заказ.'],['anal','7 · Что идёт, что лежит.'],['reorder','8 · Пора заказывать у завода — с учётом 45 дней.'],['fin','9 · Завод, зарплаты, деньги.'],['own2','10 · Код и сервер — ваши.']];
let ti=-1,tRun=false;function tour(){if(tRun){tRun=false;return}tRun=true;ti=-1;step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){tRun=false;toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Собственник');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false}
(function(){renderRoles();document.getElementById('rsel').addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();tRun=false}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
