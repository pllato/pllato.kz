/* ВОЗВРАТ — CRM коллекторского агентства: выкупленные портфели, должники с остатками и комментариями, воронка взыскания, звонки с записью и WhatsApp, обещания оплаты, платежи с разноской, коллекторы и план, отчёты в Excel для Нацбанка, загрузка портфеля, обучение новичков. Все имена, ИИН, телефоны и суммы вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const fmt1=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const tg=n=>fmt(n)+' ₸';
const mln=n=>fmt1(n/1e6)+' млн ₸';
const TODAY='13.10.2026',NOW='15:20';
const LOGO_I='<svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 12a38 38 0 1 0 38 38" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round"/><path d="M70 10l20 4-6 19" fill="none" stroke="var(--brand2,#2fb67c)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 52l10 10 20-22" fill="none" stroke="var(--brand2,#2fb67c)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>«${q}»</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;

const SEC=[
 {k:'top',n:'Пульт',sub:[['dash','Пульт руководителя'],['plan','План и коллекторы']]},
 {k:'db',n:'Должники',sub:[['debtors','Все должники'],['card','Карточка должника'],['funnel','Воронка взыскания'],['promises','Обещания и графики']]},
 {k:'cm',n:'Связь',sub:[['calls','Звонки и записи'],['wa','WhatsApp и рассылки']]},
 {k:'mn',n:'Деньги',sub:[['payments','Платежи и разноска'],['portfolios','Портфели']]},
 {k:'rp',n:'Отчёты',sub:[['reports','Отчёты в Excel · Нацбанк'],['import','Загрузка портфеля']]},
 {k:'sys',n:'Система',sub:[['learn','Обучение новичков'],['audit','Роли и журнал'],['launch','Запуск и стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Руководитель':{av:'МС',n:'Маргулан',note:'Всё: портфели, сборы за день, коллекторы, отчёты, настройки',s:ALL.slice()},
 'Руководитель взыскания':{av:'РВ',n:'Айгерим',note:'Распределение должников, план, контроль звонков и обещаний',s:['dash','plan','debtors','card','funnel','promises','calls','wa','payments','reports','learn']},
 'Коллектор':{av:'КЛ',n:'Ержан',note:'Свои должники, звонки, WhatsApp, комментарии, обещания',s:['debtors','card','funnel','promises','calls','wa','learn']},
 'Аналитик':{av:'АН',n:'Дина',note:'Портфели, платежи, отчёты в Excel и для Нацбанка',s:['dash','portfolios','payments','reports','import','debtors','card']},
 'Юрист':{av:'ЮР',n:'Рустем',note:'Претензии, исполнительные надписи, суд',s:['debtors','card','funnel']},
 'Бухгалтер':{av:'БХ',n:'Сауле',note:'Поступления, разноска по должникам, выписки',s:['payments','portfolios','reports']}
};
let role='Руководитель',cur='dash',theme='light';

/* Коллекторы */
const COLL=[['ER','Ержан'],['AS','Асель'],['DM','Дамир'],['ZH','Жанар'],['NR','Нурлан'],['KM','Камила'],['TL','Талгат'],['AL','Алина']];
const CN=k=>(COLL.find(c=>c[0]===k)||['','—'])[1];
/* Портфели, выкупленные у МФО */
let PORTS=[
 {id:'PF-07',seller:'МФО «Быстрый займ»',d:'02.09.2026',n:2840,nom:228400000,price:18270000,coll:21860000},
 {id:'PF-06',seller:'МФО «Kaz Credit Plus»',d:'15.07.2026',n:3120,nom:241900000,price:19350000,coll:48720000},
 {id:'PF-05',seller:'МФО «Деньги сразу»',d:'28.05.2026',n:1960,nom:152300000,price:13710000,coll:44110000},
 {id:'PF-04',seller:'МФО «Быстрый займ»',d:'10.03.2026',n:2480,nom:203600000,price:16290000,coll:79640000}
];
const PO=id=>PORTS.find(p=>p.id===id);
/* Этапы взыскания */
const ST=[['new','Новый, после выкупа','#7c8aa5'],['notice','Уведомлён о цессии','#5b7fc7'],['contact','Контакт есть','#2f9bb6'],['promise','Обещание оплаты','#c58a1b'],['sched','Платит по графику','#2fb67c'],['restr','Реструктуризация','#7a62c4'],['claim','Досудебная претензия','#d06a2b'],['court','Суд / исп. надпись','#c2413b'],['nocont','Нет контакта','#8c8c8c'],['closed','Взыскан, закрыт','#1d8a57']];
const STN=k=>(ST.find(s=>s[0]===k)||['',k])[1];
const STC=k=>(ST.find(s=>s[0]===k)||['','','#999'])[2];
/* Должники — генерируются детерминированно */
const FN=['Ерлан','Айгуль','Бауыржан','Динара','Серик','Гульмира','Нуржан','Асем','Марат','Жанна','Ринат','Салтанат','Арман','Алия','Тимур','Мадина','Данияр','Карлыгаш','Руслан','Айжан'];
const LN=['Ахметов','Байжанова','Касымов','Нурланова','Жумабаев','Сейткали','Омаров','Ибраева','Тулеуов','Абдиева','Мусин','Кенжебекова','Бекенов','Сулейменова','Нуртаев','Ермекова','Садыков','Жаксылыкова','Утепов','Калиева'];
const CITY=['Караганда','Темиртау','Алматы','Астана','Шымкент','Жезказган','Балхаш','Павлодар'];
const STW=['new','notice','notice','contact','contact','promise','promise','sched','sched','sched','restr','claim','court','nocont','nocont','closed'];
let DEBT=[];
(function(){for(let i=0;i<64;i++){const r=k=>((i*7919+k*104729)%1000)/1000;const male=i%2===0;const fn=FN[(i*3+Math.floor(i/20)*2)%20],ln=LN[(i*7+Math.floor(i/20)*6)%20];
 const nm=(male?ln.replace(/ова$/,'ов').replace(/ева$/,'ев').replace(/ина$/,'ин'):ln)+' '+fn;
 const body=Math.round((40000+r(1)*90000)/1000)*1000,pct=Math.round(body*(0.18+r(2)*0.4)/100)*100,pen=Math.round(body*(0.05+r(3)*0.15)/100)*100;
 const st=STW[Math.floor(r(4)*STW.length)],tot=body+pct+pen,paid=st==='closed'?tot:st==='sched'?Math.round(tot*(0.2+r(5)*0.5)/100)*100:st==='promise'||st==='restr'?Math.round(tot*r(6)*0.25/100)*100:0;
 DEBT.push({id:'Д-'+(10240+i*37),nm,iin:String(850000000000+Math.floor(r(7)*149999999999)).slice(0,6)+'******',ph:'+7 7'+['01','02','05','07','47','77'][i%6]+' *** '+String(10+(i*13)%89)+' '+String(10+(i*29)%89),city:CITY[i%8],port:PORTS[i%4].id,
  body,pct,pen,tot,paid,dpd:120+Math.floor(r(8)*600),st,col:COLL[i%8][0],last:['13.10','13.10','12.10','12.10','11.10','09.10','07.10','02.10'][i%8],
  prom:st==='promise'?{d:['13.10','13.10','14.10','15.10','16.10','12.10'][i%6],s:Math.round(tot*0.3/1000)*1000}:null,cont:'Займ № '+(54000+i*211)+' от '+['12.01','04.02','19.11','27.12'][i%4]+'.2025'})}})();
DEBT[0]=Object.assign(DEBT[0],{nm:'Ахметов Ерлан',st:'promise',body:86000,pct:31200,pen:9400,tot:126600,paid:20000,dpd:214,col:'ER',prom:{d:'13.10',s:40000},city:'Караганда',port:'PF-06'});
const DB=id=>DEBT.find(d=>d.id===id);
const rest=d=>Math.max(0,d.tot-d.paid);
let curDebt=DEBT[0].id;
/* Комментарии, звонки, платежи по должнику */
let COMM={};let CALLS={};let PAYS={};
DEBT.forEach((d,i)=>{COMM[d.id]=[[d.last+' 11:'+String(10+i%40),CN(d.col),{new:'Портфель загружен, телефоны проверяются.',notice:'Уведомление о переуступке отправлено SMS и WhatsApp, доставлено.',contact:'Дозвонился, должник признаёт долг, просит время до зарплаты.',promise:'Обещал оплатить '+(d.prom?d.prom.d+' — '+tg(d.prom.s):'частично')+'. Напомнить за день в WhatsApp.',sched:'Платит по графику, платёж 15-го числа.',restr:'Согласовали реструктуризацию на 6 месяцев, пени списаны частично.',claim:'На связь не выходит 45 дней. Направлена досудебная претензия.',court:'Документы переданы нотариусу на исполнительную надпись.',nocont:'Номер не обслуживается, второй номер — не отвечает. Нужен поиск контактов.',closed:'Долг погашен полностью, справка об отсутствии задолженности выдана.'}[d.st]]]});
COMM[DEBT[0].id]=[['13.10 10:42','Ержан','Позвонил, подтвердил обещание: 40 000 ₸ сегодня до 18:00 через Kaspi. Ссылку на оплату отправил в WhatsApp.'],['06.10 16:05','Ержан','Договорились: 20 000 ₸ сразу, остаток — 40 000 ₸ 13.10 и далее по 25 000 ₸ раз в две недели.'],['02.10 12:20','Айгерим','Передан Ержану из нераспределённых PF-06.'],['30.09 09:15','Система','Уведомление о цессии доставлено в WhatsApp, прочитано.']];
CALLS[DEBT[0].id]=[['13.10 10:38','исходящий','3:42','Подтвердил обещание','rec'],['06.10 15:58','исходящий','6:15','Обещание, первый платёж','rec'],['04.10 11:02','исходящий','0:00','Не ответил',''],['30.09 17:40','входящий','2:10','Спросил, откуда долг','rec']];
PAYS[DEBT[0].id]=[['06.10','Kaspi',20000,'по номеру договора']];
/* Журнал звонков за сегодня */
let CALLLOG=[];DEBT.slice(0,18).forEach((d,i)=>CALLLOG.push([['15:12','15:05','14:51','14:40','14:22','14:03','13:48','13:30','12:55','12:41','12:10','11:58','11:40','11:22','10:58','10:38','10:20','09:44'][i],d.id,CN(d.col),i%5===2?'0:00':(1+i%6)+':'+String(10+(i*17)%49),['Обещание оплаты','Не ответил','Нет связи','Отказ платить','Платит по графику','Перезвонить','Признаёт долг'][i%7],i%5!==2]));
/* Платежи за сегодня */
let PAYTODAY=[];
DEBT.slice(1,26).forEach((d,i)=>{const s=[15000,25000,40000,12000,30000,50000,20000,18000,35000,22000][i%10];PAYTODAY.push({t:['15:14','15:02','14:47','14:30','14:12','13:55','13:40','13:21','13:02','12:44','12:20','12:01','11:46','11:22','11:05','10:48','10:30','10:12','09:58','09:40','09:31','09:20','09:12','09:05','09:01'][i],src:['Kaspi','Kaspi','Halyk','Kaspi','Наличные в кассе','Kaspi','Forte','Kaspi'][i%8],s,id:i%9===4?'':d.id,ref:i%9===4?'Перевод без назначения, отправитель Нуртаев А.':'договор '+d.cont.split(' ')[2]})});
const PLAN_DAY=2500000;
let AUDIT=[
 ['13.10 15:14','Система','—','Платежи','Разнесён платёж Kaspi','25 000 ₸ → '+DEBT[1].id,'выписка'],
 ['13.10 14:58','Айгерим','Рук. взыскания','Должники','Переназначила 120 должников PF-07','Нурлан → Камила','компьютер'],
 ['13.10 13:10','Дина','Аналитик','Отчёты','Выгрузила «Остатки задолженности по портфелям»','10 400 строк','компьютер'],
 ['13.10 10:42','Ержан','Коллектор','Должники','Комментарий '+DEBT[0].id,'обещание 40 000 ₸ на 13.10','компьютер'],
 ['12.10 18:20','Рустем','Юрист','Должники','Претензия по 34 должникам','этап → Досудебная претензия','компьютер'],
 ['12.10 17:05','Ержан','Коллектор','Должники','Изменил телефон должника','+7 701 *** → +7 747 ***','компьютер']
];

const SC={};
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const stTag=k=>`<span class="stg" style="--sc:${STC(k)}">${STN(k)}</span>`;
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
function lineChart(pts,lbl){const w=600,h=150,mx=Math.max(...pts)*1.1,step=w/(pts.length-1),P=pts.map((v,i)=>[i*step,h-v/mx*h]);const d=P.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
 return `<svg class="lc" viewBox="0 -10 ${w} ${h+12}" preserveAspectRatio="none"><path d="${d} L ${w} ${h} L 0 ${h} Z" class="la"/><path d="${d}" class="ll"/>${P.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" class="lp"/>`).join('')}</svg><div class="lcl">${lbl.map(l=>`<span>${l}</span>`).join('')}</div>`}
/* Итоги по всей базе: в демо показаны 64 должника, итоги — по 10 400 */
const BASE_N=10400,BASE_REST=1042600000;
const EARLY_PAY=1236000;
const payToday=()=>EARLY_PAY+PAYTODAY.reduce((a,p)=>a+p.s,0);
const promToday=()=>DEBT.filter(d=>d.prom&&d.prom.d==='13.10');

SC.dash=()=>{const pt=payToday(),pc=Math.round(pt/PLAN_DAY*100),pr=promToday();
 return `<div class="hd"><div><h2>Пульт руководителя · ${TODAY}, ${NOW}</h2><p>Сколько зашло на счета сегодня против плана, сколько должников и остаток по всем портфелям, кто из коллекторов работает и какие обещания горят. Всё, что сейчас приходится собирать из Excel.</p></div><div class="btns"><button class="bt" onclick="exportXls('rest')">⇩ Excel</button></div></div>
 <div class="wid">
  <div class="clk" onclick="go('payments')"><small>Поступило сегодня</small><b class="g">${mln(pt)}</b><span>${pc}% от плана ${mln(PLAN_DAY)} в день</span></div>
  <div class="clk" onclick="go('debtors')"><small>Должников в работе</small><b>${fmt(BASE_N)}</b><span>4 портфеля · средний остаток ${tg(BASE_REST/BASE_N)}</span></div>
  <div class="clk" onclick="go('portfolios')"><small>Остаток задолженности</small><b>${(BASE_REST/1e9).toFixed(2).replace(".",",")} млрд ₸</b><span>основной долг, вознаграждение, пеня</span></div>
  <div class="clk" onclick="go('promises')"><small>Обещания на сегодня</small><b class="a">${pr.length+38}</b><span>на ${mln(pr.reduce((a,d)=>a+d.prom.s,0)+1520000)} · выполнено 21</span></div>
  <div class="clk" onclick="go('calls')"><small>Звонков сегодня</small><b>1 846</b><span>дозвон 41% · 9 ч 20 мин разговоров</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Поступления за 14 дней, млн ₸ · план 2,5 млн в день</h3>${lineChart([2.1,2.6,2.4,1.2,0.6,2.7,2.9,2.3,2.5,1.4,0.7,2.8,3.1,pt/1e6],['30.09','','','','','','06.10','','','','','','','13.10'])}</div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="go('promises')"><i></i><div><b>14 обещаний вчера не выполнено</b><span>на 486 000 ₸ · коллекторам ушли задачи «перезвонить до 12:00»</span></div></div>
  <div class="rf bad" onclick="go('payments')"><i></i><div><b>${PAYTODAY.filter(p=>!p.id).length} платежа без должника</b><span>перевод без назначения — разнести вручную</span></div></div>
  <div class="rf" onclick="go('debtors')"><i></i><div><b>1 120 должников из PF-07 без контакта</b><span>номера не отвечают — нужен поиск контактов</span></div></div>
  <div class="rf" onclick="go('plan')"><i></i><div><b>Нурлан: 62 звонка при норме 220</b><span>начал смену в 11:40</span></div></div>
  <div class="rf" onclick="go('reports')"><i></i><div><b>Отчёт в Нацбанк за сентябрь — до 15.10</b><span>выгрузка готова, проверить и отправить</span></div></div></div></div>
 <div class="g2"><div class="pan"><h3>Сборы сегодня по коллекторам</h3>${bars(COLL.map((c,i)=>[c[1],[412000,356000,298000,274000,96000,318000,241000,188000][i],tg([412000,356000,298000,274000,96000,318000,241000,188000][i])]))}</div>
 <div class="pan"><h3>Должники по этапам</h3>${bars(ST.map((s,i)=>[s[1],[860,1240,1980,720,2310,410,640,190,1650,400][i]]))}</div></div>
 ${said('Чтобы видеть этих всех должников, их видеть, и комментарий по ним можно было забивать — по суммам, по остаткам задолженности')}`};

SC.plan=()=>`<div class="hd"><div><h2>План и коллекторы</h2><p>План сборов на день и месяц делится по коллекторам. Видно, кто сколько звонит, дозванивается, берёт обещаний и сколько из них превращается в деньги. Новичок сразу виден по цифрам.</p></div></div>
 <div class="wid"><div><small>План октября</small><b>${mln(PLAN_DAY*22)}</b><span>${mln(PLAN_DAY)} в рабочий день</span></div><div><small>Собрано с 1 октября</small><b class="g">${mln(19840000+payToday())}</b><span>${Math.round((19840000+payToday())/(PLAN_DAY*22)*100)}% плана · день 9 из 22</span></div><div><small>Прогноз на месяц</small><b>${mln(52600000)}</b><span>96% плана при текущем темпе</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Коллектор</th><th>Должников</th><th>Звонков сегодня</th><th>Дозвон</th><th>Обещаний</th><th>Выполнено обещаний, мес.</th><th>Собрано сегодня</th><th>Собрано за месяц</th></tr></thead><tbody>${COLL.map((c,i)=>{const calls=[248,231,226,214,62,219,204,197][i];return `<tr class="${calls<150?'rowbad':''}"><td><b>${c[1]}</b></td><td class="mono">${fmt([1310,1290,1300,1280,1320,1310,1300,1290][i])}</td><td class="mono">${calls}</td><td class="mono">${[44,42,39,41,28,43,38,40][i]}%</td><td class="mono">${[9,8,6,7,2,8,5,4][i]}</td><td class="mono">${[78,74,66,69,41,72,63,58][i]}%</td><td class="mono">${tg([412000,356000,298000,274000,96000,318000,241000,188000][i])}</td><td class="mono">${mln([3.42,3.18,2.71,2.64,1.32,2.96,2.31,1.88][i]*1e6)}</td></tr>`}).join('')}</tbody></table></div></div>
 ${said('Нашим аналитикам тоже тяжеловато по Excel работать')}`;

/* Все должники */
let F={q:'',port:'',st:'',col:'',sum:'',city:''};
function fDebt(){return DEBT.filter(d=>{const t=(d.id+' '+d.nm+' '+d.iin+' '+d.ph+' '+d.cont).toLowerCase();
 if(F.q&&!t.includes(F.q.toLowerCase()))return false;if(F.port&&d.port!==F.port)return false;if(F.st&&d.st!==F.st)return false;if(F.col&&d.col!==F.col)return false;if(F.city&&d.city!==F.city)return false;
 const r=rest(d);if(F.sum==='s'&&r>=60000)return false;if(F.sum==='m'&&(r<60000||r>=120000))return false;if(F.sum==='l'&&r<120000)return false;return true})}
const sel=(k,opts,ph)=>`<select onchange="F.${k}=this.value;render()"><option value="">${ph}</option>${opts.map(o=>`<option value="${o[0]}" ${F[k]===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>`;
SC.debtors=()=>{const L=fDebt();
 return `<div class="hd"><div><h2>Все должники</h2><p>Вся база в одном списке вместо Excel: портфель, остаток долга, этап, коллектор, последний контакт и комментарий. Фильтры, поиск по ФИО, ИИН, телефону и номеру займа. Любой список — в Excel одной кнопкой.</p></div><div class="btns"><button class="bt" onclick="exportXls('list')">⇩ Excel по фильтру</button><button class="bt p" onclick="go('import')">⇧ Загрузить портфель</button></div></div>
 <div class="flt"><input placeholder="ФИО, ИИН, телефон, номер займа" value="${esc(F.q)}" onchange="F.q=this.value;render()">${sel('port',PORTS.map(p=>[p.id,p.id+' · '+p.seller]),'Все портфели')}${sel('st',ST.map(s=>[s[0],s[1]]),'Все этапы')}${sel('col',COLL,'Все коллекторы')}${sel('sum',[['s','до 60 000 ₸'],['m','60–120 тыс. ₸'],['l','больше 120 000 ₸']],'Любой остаток')}${sel('city',CITY.map(c=>[c,c]),'Все города')}${Object.values(F).some(Boolean)?`<a class="bt sm" onclick="F={q:'',port:'',st:'',col:'',sum:'',city:''};render()">Сбросить</a>`:''}</div>
 <div class="bulk"><span>Показано ${L.length} из ${fmt(BASE_N)} · остаток по выборке <b>${tg(L.reduce((a,d)=>a+rest(d),0))}</b></span><button class="bt sm" onclick="act('Выбранные должники переданы другому коллектору — у каждого в журнале запись «кто и когда переназначил».')">Переназначить</button><button class="bt sm" onclick="go('wa')">WhatsApp по выборке</button></div>
 <div class="pan"><div class="tw"><table class="t dlist"><thead><tr><th>Должник</th><th>Портфель · займ</th><th>Долг</th><th>Оплачено</th><th>Остаток</th><th>Просрочка</th><th>Этап</th><th>Коллектор</th><th>Последний комментарий</th></tr></thead><tbody>${L.map(d=>`<tr class="clk" onclick="openDebt('${d.id}')"><td><b>${esc(d.nm)}</b><br><small>${d.id} · ${d.city}</small></td><td>${d.port}<br><small>${d.cont}</small></td><td class="mono">${fmt(d.tot)}</td><td class="mono pos">${d.paid?fmt(d.paid):'—'}</td><td class="mono"><b>${fmt(rest(d))}</b></td><td class="mono">${d.dpd} дн.</td><td>${stTag(d.st)}</td><td>${CN(d.col)}</td><td class="cmt"><small>${d.last}</small> ${esc((COMM[d.id][0]||['','',''])[2]).slice(0,70)}…</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Именно по суммам, по задолженностям обязательно в Excel')}`};
function openDebt(id){curDebt=id;go('card')}

/* Карточка должника */
SC.card=()=>{const d=DB(curDebt),r=rest(d);
 return `<div class="hd"><div><h2>${esc(d.nm)} · ${d.id}</h2><p>${d.cont} · портфель ${d.port} (${esc(PO(d.port).seller)}) · ${d.city} · просрочка ${d.dpd} дней</p></div><div class="btns"><button class="bt" onclick="go('debtors')">← К списку</button><button class="bt" onclick="act('Звонок через IP-телефонию: номер набран, разговор записывается и попадёт в карточку.')">☎ Позвонить</button><button class="bt p" onclick="card('prom','${d.id}')">+ Обещание</button></div></div>
 <div class="stp">${ST.filter(s=>s[0]!=='nocont').map(s=>`<div class="${s[0]===d.st?'on':''}" style="--sc:${s[2]}" onclick="setSt('${d.id}','${s[0]}')"><i></i>${s[1]}</div>`).join('')}</div>
 <div class="g2 g21"><div>
  <div class="pan"><h3>Задолженность</h3><div class="kv"><span>Основной долг</span><b>${tg(d.body)}</b></div><div class="kv"><span>Вознаграждение</span><b>${tg(d.pct)}</b></div><div class="kv"><span>Пеня</span><b>${tg(d.pen)}</b></div><div class="kv"><span>Итого по договору цессии</span><b>${tg(d.tot)}</b></div><div class="kv"><span>Оплачено</span><b class="pos">${tg(d.paid)}</b></div><div class="kv on"><span><strong>Остаток</strong></span><b>${tg(r)}</b></div>${d.prom?`<div class="pin">Обещание: <b>${tg(d.prom.s)}</b> до ${d.prom.d}</div>`:''}</div>
  <div class="pan"><h3>Комментарии</h3><div class="cms">${COMM[d.id].map(c=>`<div class="cm"><small>${c[0]} · ${esc(c[1])}</small>${esc(c[2])}</div>`).join('')}</div><div class="qin"><input id="cmIn" placeholder="Комментарий: о чём договорились, что дальше"><button class="bt p" onclick="addCm('${d.id}')">Добавить</button></div>
   <div class="tpls">${['Не берёт трубку','Обещал оплатить','Просит реструктуризацию','Номер не обслуживается','Отказ платить','Перезвонить вечером'].map(t=>`<a onclick="document.getElementById('cmIn').value='${t}. '">${t}</a>`).join('')}</div></div>
 </div><div>
  <div class="pan"><h3>Контакты</h3><div class="kv"><span>ИИН</span><b class="mono">${d.iin}</b></div><div class="kv"><span>Телефон</span><b class="mono">${d.ph}</b></div><div class="kv"><span>Город</span><b>${d.city}</b></div><div class="kv"><span>Коллектор</span><b>${CN(d.col)}</b></div></div>
  <div class="pan"><h3>Звонки с записью</h3>${(CALLS[d.id]||[[d.last+' 11:20','исходящий','2:31','Разговор','rec']]).map(c=>`<div class="evt"><span class="mono">${c[0]}</span><b>${c[1]} · ${c[2]}</b><span>${esc(c[3])} ${c[4]?`<a class="play" onclick="act('Запись разговора воспроизводится прямо в карточке.')">▶ запись</a>`:''}</span></div>`).join('')}</div>
  <div class="pan"><h3>Платежи</h3>${(PAYS[d.id]||(d.paid?[['15.09','Kaspi',d.paid,'по номеру договора']]:[])).map(p=>`<div class="evt"><span class="mono">${p[0]}</span><b>${tg(p[2])}</b><span>${p[1]} · ${p[3]}</span></div>`).join('')||'<p class="hint">Платежей ещё не было.</p>'}</div>
  <div class="pan"><h3>Документы</h3>${['Договор займа (от продавца)','Договор цессии и реестр','Уведомление о переуступке','Досудебная претензия'].map((x,i)=>`<div class="doc"><i>${i<3?'PDF':'DOCX'}</i><span>${x}</span></div>`).join('')}</div>
 </div></div>`};
function addCm(id){const v=(document.getElementById('cmIn').value||'').trim();if(!v){toast('Напишите комментарий.');return}COMM[id].unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,v]);const d=DB(id);d.last=TODAY.slice(0,5);AUDIT.unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,role,'Должники','Комментарий '+id,v.slice(0,40),'компьютер']);render();toast('Комментарий сохранён — его видят руководитель и следующий коллектор.')}
function setSt(id,k){const d=DB(id);d.st=k;AUDIT.unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,role,'Должники','Этап '+id,STN(k),'компьютер']);render();toast('Этап: '+STN(k)+'.')}

/* Воронка */
SC.funnel=()=>`<div class="hd"><div><h2>Воронка взыскания</h2><p>Этапы — как вы ведёте должника сейчас в Excel: от выкупа и уведомления о цессии до оплаты, реструктуризации, претензии и суда. Этапы и правила переходов настраиваем под вас. Нажмите на карточку — откроется должник.</p></div></div>
 <div class="kb k10">${ST.map(s=>{const L=DEBT.filter(d=>d.st===s[0]);return `<div class="kc" style="--sc:${s[2]}"><div class="kh"><b>${s[1]}</b><span>${L.length}</span></div>${L.slice(0,6).map(d=>`<div class="kd" onclick="openDebt('${d.id}')"><div class="kt"><b>${esc(d.nm)}</b><span class="src">${CN(d.col)}</span></div><div class="km">${d.port} · ${d.dpd} дн.</div><div class="kf"><span>остаток</span><b>${tg(rest(d))}</b></div></div>`).join('')}${L.length>6?`<div class="kempty">ещё ${L.length-6}</div>`:''}${!L.length?'<div class="kempty">пусто</div>':''}</div>`}).join('')}</div>`;

/* Обещания */
SC.promises=()=>{const P=DEBT.filter(d=>d.prom).sort((a,b)=>a.prom.d.localeCompare(b.prom.d));
 return `<div class="hd"><div><h2>Обещания и графики</h2><p>Каждое обещание — сумма и дата. Накануне должнику уходит напоминание в WhatsApp со ссылкой на оплату. Пришёл платёж — обещание закрывается само; не пришёл — коллектору задача «перезвонить».</p></div></div>
 <div class="wid"><div><small>Обещаний на сегодня</small><b class="a">${promToday().length+38}</b><span>выполнено 21 · ждём до 23:59</span></div><div><small>Выполнение обещаний</small><b class="g">68%</b><span>за 30 дней</span></div><div><small>Не выполнено вчера</small><b class="w">14</b><span>486 000 ₸ · задачи созданы</span></div><div><small>Платят по графику</small><b>2 310</b><span>реструктуризация — 410</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Дата</th><th>Должник</th><th>Сумма</th><th>Остаток долга</th><th>Коллектор</th><th>Напоминание</th><th>Статус</th></tr></thead><tbody>${P.map(d=>`<tr class="clk" onclick="openDebt('${d.id}')"><td class="mono">${d.prom.d}</td><td><b>${esc(d.nm)}</b><br><small>${d.id}</small></td><td class="mono">${tg(d.prom.s)}</td><td class="mono">${tg(rest(d))}</td><td>${CN(d.col)}</td><td>${tag('WhatsApp накануне ✓','g')}</td><td>${d.prom.d==='12.10'?tag('не выполнено','r'):d.prom.d==='13.10'?tag('сегодня','w'):tag('ждём','i')}</td></tr>`).join('')}</tbody></table></div></div>`};

/* Звонки */
SC.calls=()=>`<div class="hd"><div><h2>Звонки и записи</h2><p>Звонки идут через IP-телефонию прямо из карточки должника — Битрикс для звонков больше не нужен. Каждый разговор записывается и лежит в карточке: руководитель слушает спорные, новичок учится на удачных.</p></div></div>
 <div class="wid"><div><small>Звонков сегодня</small><b>1 846</b><span>исходящих 1 712 · входящих 134</span></div><div><small>Дозвон</small><b>41%</b><span>757 разговоров</span></div><div><small>Время разговоров</small><b>9 ч 20 мин</b><span>в среднем 0:44</span></div><div><small>Пропущенные входящие</small><b class="w">7</b><span>перезвонить</span></div></div>
 <div class="pan"><h3>Последние звонки</h3><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Должник</th><th>Коллектор</th><th>Длительность</th><th>Итог</th><th>Запись</th></tr></thead><tbody>${CALLLOG.map(c=>{const d=DB(c[1]);return `<tr class="clk" onclick="openDebt('${c[1]}')"><td class="mono">${c[0]}</td><td>${esc(d.nm)}<br><small>${c[1]}</small></td><td>${c[2]}</td><td class="mono">${c[3]}</td><td>${c[4]}</td><td>${c[5]?'<a class="play">▶ слушать</a>':'—'}</td></tr>`}).join('')}</tbody></table></div></div>
 <p class="hint">IP-телефония — около 30–35 тыс. ₸ в месяц оператору, номера и тарифы ваши.</p>`;

/* WhatsApp */
let WA={st:'promise',tpl:0};
const WTPL=[['Напоминание об обещании','{имя}, напоминаем: вы обещали оплатить {сумма} до {дата}. Оплатить через Kaspi: {ссылка}'],['Уведомление о цессии','{имя}, право требования по займу {займ} перешло к нам. Остаток {остаток}. Свяжитесь с нами, чтобы договориться об удобном графике.'],['Предложение реструктуризации','{имя}, можем разбить остаток {остаток} на 6 платежей. Ответьте «да», и коллектор перезвонит.']];
SC.wa=()=>{const n=DEBT.filter(d=>!WA.st||d.st===WA.st).length*162;
 return `<div class="hd"><div><h2>WhatsApp и рассылки</h2><p>Переписка с должником — в его карточке, рядом со звонками. Массовые сообщения по этапу или портфелю: уведомление о цессии, напоминание об обещании, предложение графика. Ответ попадает коллектору, за которым закреплён должник.</p></div></div>
 <div class="g2"><div class="pan"><h3>Рассылка</h3><div class="form"><label>Кому — этап<select onchange="WA.st=this.value;render()"><option value="">Все в работе</option>${ST.map(s=>`<option value="${s[0]}" ${WA.st===s[0]?'selected':''}>${s[1]}</option>`).join('')}</select></label><label>Шаблон<select onchange="WA.tpl=+this.value;render()">${WTPL.map((t,i)=>`<option value="${i}" ${WA.tpl===i?'selected':''}>${t[0]}</option>`).join('')}</select></label></div>
  <div class="rcp"><b>${fmt(n)}</b><span>получателей · подставятся имя, сумма, дата и ссылка на оплату</span></div><div class="voice">${esc(WTPL[WA.tpl][1])}</div><button class="bt p" onclick="act('Рассылка поставлена в очередь: ${fmt(n)} сообщений, по 20 в минуту — чтобы номер не заблокировали.')">Отправить</button></div>
 <div class="pan"><h3>Переписка · ${esc(DB(curDebt).nm)}</h3><div class="msgs"><div class="mg"><small>30.09 09:15 · система</small>Здравствуйте! Право требования по вашему займу перешло к нам. Остаток 126 600 ₸.</div><div class="mg me"><small>30.09 17:32 · должник</small>А откуда долг? Я в МФО всё платил</div><div class="mg"><small>06.10 16:10 · Ержан</small>Отправил вам выписку по займу. Как договорились: 20 000 ₸ сегодня и 40 000 ₸ 13.10.</div><div class="mg"><small>12.10 18:00 · напоминание</small>Ерлан, напоминаем: завтра оплата 40 000 ₸. Оплатить через Kaspi: ссылка</div><div class="mg me"><small>13.10 10:45 · должник</small>Сегодня до шести оплачу</div></div></div></div>
 <p class="hint">Официальный WhatsApp-провайдер — около 10 тыс. ₸ в месяц.</p>`};

/* Платежи */
SC.payments=()=>{const pt=payToday();
 return `<div class="hd"><div><h2>Платежи и разноска</h2><p>Выписки Kaspi и банков загружаются файлом или подтягиваются автоматически. Платёж сам находит должника по номеру займа, ИИН или телефону, уменьшает остаток и закрывает обещание. Что не нашлось — в «Неразнесённые».</p></div><div class="btns"><button class="bt" onclick="act('Выписка загружена: 41 платёж, 39 разнесены автоматически, 2 — вручную.')">⇧ Загрузить выписку</button><button class="bt" onclick="exportXls('pay')">⇩ Excel</button></div></div>
 <div class="wid"><div><small>Сегодня</small><b class="g">${tg(pt)}</b><span>${PAYTODAY.length+71} платёж · план ${mln(PLAN_DAY)}</span></div><div><small>Разнесено автоматически</small><b>${PAYTODAY.length+71-PAYTODAY.filter(p=>!p.id).length}</b><span>по номеру займа и ИИН</span></div><div><small>Без должника</small><b class="w">${PAYTODAY.filter(p=>!p.id).length}</b><span>разнести вручную</span></div><div><small>Средний платёж</small><b>${tg(pt/(PAYTODAY.length+71))}</b><span>долг в среднем 70–80 тыс.</span></div></div>
 <div class="pan"><h3>Последние платежи</h3><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Источник</th><th>Сумма</th><th>Должник</th><th>Основание</th><th></th></tr></thead><tbody>${PAYTODAY.map((p,i)=>`<tr class="${p.id?'':'rowwarn'}"><td class="mono">${p.t}</td><td>${p.src}</td><td class="mono pos">${tg(p.s)}</td><td>${p.id?`<a class="clk" onclick="openDebt('${p.id}')">${esc(DB(p.id).nm)}</a>`:'—'}</td><td>${esc(p.ref)}</td><td>${p.id?tag('разнесён','g'):`<button class="bt sm" onclick="manualPay(${i})">Разнести</button>`}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Два с половиной миллиона в день на счета заходит')}`};
function manualPay(i){const p=PAYTODAY[i],d=DEBT.find(x=>x.nm.startsWith('Нуртаев'))||DEBT[5];p.id=d.id;d.paid=Math.min(d.tot,d.paid+p.s);AUDIT.unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,role,'Платежи','Ручная разноска',tg(p.s)+' → '+d.id,'компьютер']);render();toast(`Платёж ${tg(p.s)} разнесён на ${esc(d.nm)}. Остаток уменьшился.`)}

/* Портфели */
SC.portfolios=()=>`<div class="hd"><div><h2>Портфели</h2><p>Каждый выкупленный у МФО портфель: сколько должников, номинал долга, цена выкупа, сколько уже собрано и окупился ли. Видно, какие продавцы дают портфели, по которым платят лучше.</p></div><div class="btns"><button class="bt p" onclick="go('import')">⇧ Новый портфель</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Портфель</th><th>Продавец</th><th>Выкуплен</th><th>Должников</th><th>Номинал</th><th>Цена выкупа</th><th>Собрано</th><th>Окупаемость</th></tr></thead><tbody>${PORTS.map(p=>`<tr class="clk" onclick="F.port='${p.id}';go('debtors')"><td><b>${p.id}</b></td><td>${esc(p.seller)}</td><td class="mono">${p.d}</td><td class="mono">${fmt(p.n)}</td><td class="mono">${mln(p.nom)}</td><td class="mono">${mln(p.price)} · ${fmt1(p.price/p.nom*100)}%</td><td class="mono pos">${mln(p.coll)}</td><td><div class="fbar"><i style="width:${Math.min(100,p.coll/p.price/5*100)}%"></i></div><small>${fmt1(p.coll/p.price)}× цены выкупа</small></td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Собрано по месяцам после выкупа, % номинала</h3>${bars([['1-й месяц',3.1,'3,1%'],['2-й',5.4,'5,4%'],['3-й',6.2,'6,2%'],['4-й',5.8,'5,8%'],['5-й',4.9,'4,9%'],['6-й',4.1,'4,1%']])}</div>
 <div class="pan"><h3>Платят лучше</h3>${bars([['МФО «Деньги сразу»',29,'29% номинала'],['МФО «Быстрый займ»',27,'27%'],['МФО «Kaz Credit Plus»',20,'20%']])}<p class="hint">Помогает решать, какой следующий портфель и по какой цене брать.</p></div></div>
 ${said('Мы выкупаем у других микрофинансовых организаций должников — сразу портфель там десять тысяч, двадцать тысяч должников')}`;

/* Отчёты */
const REPS=[['rest','Остатки задолженности по портфелям','по каждому должнику: основной долг, вознаграждение, пеня, оплачено, остаток'],['nb','Отчётность для Нацбанка','форма по портфелю в формате, который вы сдаёте — настроим по вашему образцу'],['pay','Платежи за период','дата, источник, сумма, должник, займ'],['coll','Работа коллекторов','звонки, дозвон, обещания, выполнение, собрано'],['list','Должники по текущему фильтру','то, что отфильтровано в списке'],['prom','Обещания и выполнение','кто обещал, сколько, когда, оплатил ли']];
SC.reports=()=>`<div class="hd"><div><h2>Отчёты в Excel · Нацбанк</h2><p>Любой отчёт — в Excel одной кнопкой: файл скачивается по-настоящему, попробуйте. Отчётность для Нацбанка собирается по вашей форме, без ручного сведения таблиц.</p></div></div>
 <div class="g3">${REPS.map(r=>`<div class="pan rep"><h3>${r[1]}</h3><p class="mini">${r[2]}</p><button class="bt p sm" onclick="exportXls('${r[0]}')">⇩ Скачать Excel</button></div>`).join('')}</div>
 ${said('Это всё должно в Excel выгружаться — по суммам, по задолженностям обязательно, потому что мы этот Excel потом будем зашивать в Нацбанк')}`;
function exportXls(k){let head=[],rows=[],name='otchet';
 const dRow=d=>[d.id,d.nm,d.iin,d.port,d.cont,d.body,d.pct,d.pen,d.tot,d.paid,rest(d),d.dpd,STN(d.st),CN(d.col)];
 const dHead=['ID','ФИО','ИИН','Портфель','Займ','Основной долг','Вознаграждение','Пеня','Итого','Оплачено','Остаток','Дней просрочки','Этап','Коллектор'];
 if(k==='rest'||k==='nb'){head=dHead;rows=DEBT.map(dRow);name=k==='nb'?'nacbank_forma':'ostatki_zadolzhennosti'}
 else if(k==='list'){head=dHead;rows=fDebt().map(dRow);name='dolzhniki_filtr'}
 else if(k==='pay'){head=['Время','Источник','Сумма','Должник','Основание'];rows=PAYTODAY.map(p=>[p.t,p.src,p.s,p.id?DB(p.id).nm:'—',p.ref]);name='platezhi'}
 else if(k==='coll'){head=['Коллектор','Звонков','Дозвон %','Обещаний','Собрано сегодня'];rows=COLL.map((c,i)=>[c[1],[248,231,226,214,62,219,204,197][i],[44,42,39,41,28,43,38,40][i],[9,8,6,7,2,8,5,4][i],[412000,356000,298000,274000,96000,318000,241000,188000][i]]);name='kollektory'}
 else {head=['Дата','Должник','Сумма','Коллектор'];rows=DEBT.filter(d=>d.prom).map(d=>[d.prom.d,d.nm,d.prom.s,CN(d.col)]);name='obeshchaniya'}
 const x='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><tr>'+head.map(h=>`<th style="background:#17324d;color:#fff">${esc(h)}</th>`).join('')+'</tr>'+rows.map(r=>'<tr>'+r.map(c=>`<td>${esc(c)}</td>`).join('')+'</tr>').join('')+'</table></body></html>';
 try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+x],{type:'application/vnd.ms-excel'}));a.download=name+'_'+TODAY.replace(/\./g,'-')+'.xls';document.body.appendChild(a);a.click();a.remove()}catch(e){}
 AUDIT.unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,role,'Отчёты','Выгрузка «'+name+'»',rows.length+' строк','компьютер']);toast(`Excel скачан: ${rows.length} строк. В рабочей системе — все ${fmt(BASE_N)} должников.`)}

/* Загрузка портфеля */
let IMP=0;
SC.import=()=>`<div class="hd"><div><h2>Загрузка портфеля</h2><p>Продавец передаёт реестр в Excel. Загружаете файл, сопоставляете колонки один раз — шаблон запоминается для этого продавца. Система проверяет дубли и пустые телефоны и распределяет должников по коллекторам поровну или по правилам.</p></div></div>
 <div class="mvs">${['Файл реестра','Колонки','Проверка','Распределение','Готово'].map((s,i)=>`<div class="mv ${i<IMP?'ok':i===IMP?'on':''}"><i>${i+1}</i><b>${s}</b><span>${['Excel от продавца','ФИО, ИИН, займ, суммы','дубли, пустые поля','по 8 коллекторам','в работе'][i]}</span></div>`).join('')}</div>
 <div class="pan">${IMP===0?`<div class="upl"><b>reestr_cessii_PF-08.xlsx</b><span>МФО «Деньги сразу» · 4 120 строк · 1,8 МБ</span></div><button class="bt p" onclick="IMP=1;render()">Загрузить →</button>`:
 IMP===1?`<div class="tw"><table class="t"><thead><tr><th>Колонка в файле</th><th>Поле в системе</th></tr></thead><tbody>${[['ФИО заемщика','ФИО'],['ИИН','ИИН'],['№ договора','Займ'],['Сумма ОД','Основной долг'],['Начисл. вознагр.','Вознаграждение'],['Неустойка','Пеня'],['Тел. моб.','Телефон'],['Адрес регистрации','Адрес']].map(r=>`<tr><td>${r[0]}</td><td>${tag(r[1],'g')}</td></tr>`).join('')}</tbody></table></div><button class="bt p" onclick="IMP=2;render()">Проверить →</button>`:
 IMP===2?`<div class="kv"><span>Строк в файле</span><b>4 120</b></div><div class="kv"><span>Уже есть в базе (дубли по ИИН)</span><b class="neg">37</b></div><div class="kv"><span>Без телефона</span><b class="neg">214</b></div><div class="kv on"><span><strong>Будет загружено</strong></span><b>4 083 · номинал 318,4 млн ₸</b></div><button class="bt p" onclick="IMP=3;render()">Распределить →</button>`:
 IMP===3?`${COLL.map(c=>`<div class="kv"><span>${c[1]}</span><b>510 должников</b></div>`).join('')}<button class="bt p" onclick="IMP=4;render();toast('Портфель PF-08 загружен и распределён. Уведомления о цессии поставлены в очередь WhatsApp.')">Загрузить в работу →</button>`:
 `<div class="pin">Портфель PF-08 в работе: 4 083 должника, распределены по 8 коллекторам. Уведомления о переуступке отправляются.</div><button class="bt" onclick="IMP=0;render()">Ещё раз</button>`}</div>`;

/* Обучение */
SC.learn=()=>`<div class="hd"><div><h2>Обучение новичков</h2><p>Всё, что делал опытный коллектор, остаётся в системе: звонки с записью, переписка, комментарии. Новичку — подборка закрытых дел: «изучи десять должников, которые полностью погасили, и послушай, как с ними говорили».</p></div></div>
 <div class="g3">${[['Закрытые дела: полностью погасили','10 должников · звонки и переписка от первого контакта до оплаты'],['Сложные: «не признаю долг»','8 разговоров, где должник сначала отказывался платить'],['Реструктуризация','как предлагать график, чтобы платили'],['Скрипт первого звонка','уведомление о цессии, проверка личности, что говорить нельзя'],['Ошибки','5 записей, где разговор пошёл не так — с разбором руководителя'],['Тест после обучения','12 вопросов, результат видит руководитель']].map(x=>`<div class="pan rep"><h3>${x[0]}</h3><p class="mini">${x[1]}</p><button class="bt sm" onclick="act('Подборка открыта: записи, переписка и комментарии по каждому делу.')">Открыть</button></div>`).join('')}</div>`;

/* Роли и журнал */
SC.audit=()=>`<div class="hd"><div><h2>Роли и журнал действий</h2><p>Коллектор видит только своих должников, юрист — претензии и суд, бухгалтер — платежи. Персональные данные должников открыты только тем, кому нужны. Каждое действие записывается: кто, когда, что изменил — телефон, сумму, этап.</p></div></div>
 <div class="g2 g21"><div class="pan"><h3>Журнал</h3><div class="tw"><table class="t"><thead><tr><th>Когда</th><th>Кто</th><th>Раздел</th><th>Что сделал</th><th>Значение</th></tr></thead><tbody>${AUDIT.map(a=>`<tr><td class="mono">${a[0]}</td><td>${a[1]}<br><small>${a[2]}</small></td><td>${a[3]}</td><td>${esc(a[4])}</td><td>${esc(a[5])}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Роли</h3>${Object.entries(ROLES).map(([k,v])=>`<div class="kv"><span><b>${k}</b><small>${esc(v.note)}</small></span><b>${v.s.length} разд.</b></div>`).join('')}</div></div>`;

/* Запуск и стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Стандартный пакет разработки. Один платёж — система ставится на ваш сервер и становится вашей, ежегодной оплаты как у коробочных CRM нет. Ядро — около 10 дней, дальше полировка вместе с вами.</p></div></div>
 <div class="pk1"><div><small>Стандартный пакет</small><b>1 500 000 ₸</b><span>при решении в течение недели — скидка 5% за скорость: <b>1 425 000 ₸</b></span></div><div><small>Срок</small><b>4–6 недель</b><span>ядро — около 10 дней</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>150 000 ₸</b><span>при подписании · со скидкой 142 500 ₸</span></div><div><small>Ядро · 45%</small><b>675 000 ₸</b><span>после приёмки ядра · 641 250 ₸</span></div><div><small>Сдача · 45%</small><b>675 000 ₸</b><span>после всех правок · 641 250 ₸</span></div></div>
 <div class="mvs"><div class="mv ok"><i>1</i><b>Видео вашей любимой CRM</b><span>до среды 14.10 · вкладки и глубина</span></div><div class="mv on"><i>2</i><b>Ядро · 10 дней</b><span>должники, карточка, комментарии, воронка, Excel</span></div><div class="mv"><i>3</i><b>Полировка</b><span>сборки каждые 1–2 дня, ваши правки</span></div><div class="mv"><i>4</i><b>Перенос из Excel</b><span>10 000 должников, платежи, комментарии</span></div><div class="mv"><i>5</i><b>Запуск</b><span>телефония, WhatsApp, обучение команды</span></div></div>
 <div class="pan"><h3>Ежемесячно — напрямую сервисам</h3><div class="kv"><span>IP-телефония с записью разговоров</span><b>≈ 30–35 тыс. ₸</b></div><div class="kv"><span>WhatsApp-провайдер</span><b>≈ 10 тыс. ₸</b></div><div class="kv"><span>Сервер</span><b>≈ 10–15 тыс. ₸</b></div></div>
 ${said('Главное, чтобы удобство было, и всё — больше ничего нам не нужно','Внешний вид сделаем по видео CRM, которая вам понравилась: поменять дизайн для нас — сутки, бесплатно.')}`;

/* Карточки */
const CARD={};
CARD.prom=id=>{const d=DB(id);return ['Обещание оплаты · '+esc(d.nm),'Остаток '+tg(rest(d)),`<div class="form"><label>Сумма, ₸<input id="pr_s" type="number" value="${Math.round(rest(d)*0.3/1000)*1000}"></label><label>Дата<select id="pr_d">${['13.10','14.10','15.10','16.10','20.10'].map(x=>`<option>${x}</option>`).join('')}</select></label></div><label class="ck"><input type="checkbox" checked> Напомнить в WhatsApp накануне со ссылкой на оплату</label><button class="bt p" onclick="promDo('${id}')">Сохранить</button>`]};
function promDo(id){const d=DB(id),s=+document.getElementById('pr_s').value||0,dt=document.getElementById('pr_d').value;if(!s){toast('Сумма?');return}d.prom={d:dt,s};d.st='promise';COMM[id].unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,'Обещание: '+tg(s)+' до '+dt+'.']);AUDIT.unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,role,'Должники','Обещание '+id,tg(s)+' до '+dt,'компьютер']);closeM();render();toast('Обещание сохранено. Накануне должнику уйдёт напоминание, платёж закроет обещание сам.')}
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){if(!v)return;F.q=v;go('debtors')}

/* Каркас */
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(role==='Коллектор')F.col='ER';if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}.`)}
function switchRole(k){role=k;F.col=role==='Коллектор'?'ER':'';document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">ВОЗВРАТ</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='promises'?'<em>'+(promToday().length+38)+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['debtors','Должники'],['promises','Обещания'],['payments','Платежи'],['reports','Excel']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Возврат';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: сколько зашло сегодня против плана 2,5 млн, должники, остаток, обещания.'],
 ['debtors','2 · Все должники вместо Excel: фильтры, поиск, остатки, комментарии.'],
 ['card','3 · Карточка должника: долг по частям, комментарии, звонки с записью, платежи.'],
 ['funnel','4 · Воронка взыскания — этапы как у вас.'],
 ['promises','5 · Обещания: напоминание накануне, платёж закрывает обещание сам.'],
 ['calls','6 · Звонки через IP-телефонию, все записи в карточке.'],
 ['payments','7 · Платежи разносятся по должникам автоматически.'],
 ['portfolios','8 · Портфели: цена выкупа, собрано, окупаемость.'],
 ['reports','9 · Excel и отчётность для Нацбанка — файл скачивается.'],
 ['plan','10 · План и коллекторы.'],
 ['launch','11 · Стоимость: 1,5 млн, 4–6 недель, 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
