/* КОМПАС — админ-панель туроператора/турагентства с приложением для туристов: пульт и аналитика, заказы с сохранёнными фильтрами и массовыми действиями, карточка заказа (документы, комментарии, история), рейсы и перенос с push, массовые push по рейсу/дате/направлению/авиакомпании, автоуведомления, финансы (выручка, возвраты, долги), выгрузки в Excel, журнал действий, фирменные цвета, работа с телефона. Все имена, рейсы, авиакомпании и суммы вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(n<0?'−':'')+(Math.round(Math.abs(n)/10000)/100).toString().replace('.',',')+' млн';
const TODAY='10.10.2026',NOW='14:20';
const LOGO_I='<svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="8"/><path d="M50 18 62 50 50 82 38 50z" fill="var(--brand2,#ff6b4a)"/><circle cx="50" cy="50" r="6" fill="currentColor"/></svg>';
const said=(q,a)=>`<div class="said"><b>Из вашего ТЗ</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;

const SEC=[
 {k:'dash',n:'Пульт',sub:[['dash','Пульт и аналитика']]},
 {k:'ord',n:'Продажи',sub:[['orders','Заказы'],['order','Карточка заказа'],['tourists','Туристы и приложение']]},
 {k:'fl',n:'Рейсы и туры',sub:[['flights','Рейсы'],['tours','Направления и туры']]},
 {k:'com',n:'Уведомления',sub:[['push','Массовые push'],['auto','Автоуведомления']]},
 {k:'fin',n:'Финансы',sub:[['finance','Выручка, возвраты, долги'],['reports','Отчёты в Excel']]},
 {k:'ctl',n:'Контроль',sub:[['audit','Журнал действий'],['staff','Сотрудники и роли']]},
 {k:'set',n:'Настройки',sub:[['brand','Фирменный стиль'],['mobile','Админка с телефона'],['launch','Запуск и стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Руководитель':{av:'АЛ',n:'Алихан',note:'Всё: пульт, заказы, рейсы, push, финансы, журнал действий, настройки',s:ALL.slice()},
 'Менеджер по продажам':{av:'МН',n:'Дана',note:'Свои заказы, туристы, документы, комментарии, сохранённые фильтры',s:['orders','order','tourists','tours','dash']},
 'Авиа и операционный отдел':{av:'ОП',n:'Арман',note:'Рейсы, перенос и задержки, массовые push, автоуведомления',s:['flights','push','auto','orders','order','tourists']},
 'Бухгалтер':{av:'БХ',n:'Сауле',note:'Финансы, возвраты, долги туристов и партнёрам, выгрузки в Excel',s:['finance','reports','orders','order']},
 'Маркетинг':{av:'МК',n:'Ая',note:'Push-рассылки и акции, туристы в приложении, аналитика',s:['push','tourists','dash','tours']}
};
let role='Руководитель',cur='dash',theme='light',curOrd='Z-24187';

const MGR={DN:'Дана',TM:'Тимур',AS:'Асель',ER:'Ерлан'};
const AIR={SL:'SkyLine KZ',ST:'Steppe Air',OW:'Orient Wings'};
const DIR=['Анталья','Шарм-эль-Шейх','Дубай','Нячанг','Пхукет'];
/* Рейсы */
let FLIGHTS=[
 {id:'SL801',air:'SL',from:'Алматы',to:'Анталья',d:'11.10',t:'06:40',seats:189,sold:176,st:'ok',reg:'открыта',tour:142},
 {id:'ST455',air:'ST',from:'Алматы',to:'Шарм-эль-Шейх',d:'11.10',t:'09:15',seats:212,sold:201,st:'moved',newT:'13:30',reg:'откроется 10.10 13:30',tour:168},
 {id:'OW217',air:'OW',from:'Астана',to:'Дубай',d:'12.10',t:'02:10',seats:174,sold:150,st:'ok',reg:'откроется 11.10 02:10',tour:96},
 {id:'SL809',air:'SL',from:'Алматы',to:'Нячанг',d:'13.10',t:'23:55',seats:220,sold:188,st:'ok',reg:'откроется 12.10',tour:131},
 {id:'ST461',air:'ST',from:'Астана',to:'Анталья',d:'14.10',t:'07:20',seats:189,sold:143,st:'delay',newT:'09:05',reg:'—',tour:117},
 {id:'OW233',air:'OW',from:'Алматы',to:'Пхукет',d:'15.10',t:'01:30',seats:240,sold:198,st:'ok',reg:'—',tour:154}
];
const FL=id=>FLIGHTS.find(f=>f.id===id);
const FST={ok:['По расписанию','g'],moved:['Перенос','w'],delay:['Задержка','r'],done:['Вылетел','']};
/* Заказы */
const OST=[['new','Новый'],['wait','Ждёт оплаты'],['part','Частично оплачен'],['paid','Оплачен'],['docs','Документы выданы'],['fly','В туре'],['done','Завершён'],['refund','Возврат']];
const OSN=k=>(OST.find(x=>x[0]===k)||['',k])[1];
let ORDERS=[
 {id:'Z-24187',fl:'ST455',back:'ST456 · 18.10',hotel:'Coral Bay Resort 5★, AI',nights:7,pax:[['Ержан Абдиев','взр.','N12345678'],['Айгерим Абдиева','взр.','N12345679'],['Алан Абдиев','реб. 8 лет','N12345680']],ph:'+7 701 *** 45 12',sum:1486000,paid:1486000,st:'docs',m:'DN',app:true,src:'Приложение',docs:{vouch:1,ticket:1,ins:1,visa:0},created:'21.09'},
 {id:'Z-24203',fl:'SL801',back:'SL802 · 18.10',hotel:'Lara Palace 5★, UAI',nights:7,pax:[['Мадина Сейткали','взр.','N22345671'],['Руслан Сейткали','взр.','N22345672']],ph:'+7 777 *** 08 33',sum:1124000,paid:562000,st:'part',m:'TM',app:true,src:'Instagram',docs:{vouch:1,ticket:0,ins:1,visa:0},created:'02.10'},
 {id:'Z-24211',fl:'OW217',back:'OW218 · 19.10',hotel:'Marina View 4★, BB',nights:7,pax:[['Олжас Тулеуов','взр.','N32345670']],ph:'+7 705 *** 77 01',sum:612000,paid:0,st:'wait',m:'AS',app:false,src:'Сайт',docs:{vouch:0,ticket:0,ins:0,visa:0},created:'08.10'},
 {id:'Z-24166',fl:'SL801',back:'SL802 · 18.10',hotel:'Side Garden 4★, AI',nights:7,pax:[['Елена Ким','взр.','N42345671'],['Виктор Ким','взр.','N42345672']],ph:'+7 701 *** 31 90',sum:948000,paid:948000,st:'docs',m:'DN',app:true,src:'Повторный',docs:{vouch:1,ticket:1,ins:1,visa:0},created:'15.09'},
 {id:'Z-24220',fl:'SL809',back:'SL810 · 23.10',hotel:'Sea Pearl 4★, BB',nights:10,pax:[['Динара Жумабаева','взр.','N52345670'],['Асхат Жумабаев','взр.','N52345671']],ph:'+7 702 *** 64 18',sum:1318000,paid:400000,st:'part',m:'ER',app:true,src:'Приложение',docs:{vouch:0,ticket:0,ins:1,visa:1},created:'09.10'},
 {id:'Z-24224',fl:'ST461',back:'ST462 · 21.10',hotel:'Alanya Sun 4★, AI',nights:7,pax:[['Гульнара Омарова','взр.','N62345671'],['Самат Омаров','взр.','N62345672'],['Амир Омаров','реб. 5 лет','N62345673']],ph:'+7 707 *** 50 44',sum:1077000,paid:1077000,st:'paid',m:'TM',app:true,src:'Instagram',docs:{vouch:1,ticket:0,ins:1,visa:0},created:'05.10'},
 {id:'Z-24198',fl:'OW233',back:'OW234 · 24.10',hotel:'Kata Beach 5★, BB',nights:9,pax:[['Арман Кенжебеков','взр.','N72345670'],['Жанна Кенжебекова','взр.','N72345671']],ph:'+7 701 *** 12 77',sum:1690000,paid:845000,st:'part',m:'AS',app:false,src:'Сайт',docs:{vouch:0,ticket:0,ins:0,visa:0},created:'29.09'},
 {id:'Z-24152',fl:'ST455',back:'ST456 · 18.10',hotel:'Coral Bay Resort 5★, AI',nights:7,pax:[['Ирина Павлова','взр.','N82345670']],ph:'+7 778 *** 90 05',sum:684000,paid:684000,st:'refund',m:'ER',app:true,src:'Приложение',docs:{vouch:0,ticket:0,ins:0,visa:0},created:'10.09',refund:520000},
 {id:'Z-24229',fl:'SL801',back:'SL802 · 18.10',hotel:'Lara Palace 5★, UAI',nights:7,pax:[['Бауыржан Сеитов','взр.','N92345670'],['Камила Сеитова','взр.','N92345671']],ph:'+7 747 *** 26 61',sum:1124000,paid:0,st:'new',m:'DN',app:true,src:'Приложение',docs:{vouch:0,ticket:0,ins:0,visa:0},created:'10.10'}
];
const OR=id=>ORDERS.find(o=>o.id===id);
const debt=o=>Math.max(0,o.sum-o.paid-(o.refund||0)*0);
/* История изменений заказа и журнал */
let HIST={'Z-24187':[['10.10 13:32','Система','Рейс ST455','вылет 09:15','вылет 13:30 (перенос авиакомпании)'],['10.10 13:33','Арман','Push «Перенос рейса»','—','доставлено 3 из 3, открыто 2'],['04.10 11:10','Дана','Документы','ваучер, страховка','+ авиабилеты'],['28.09 16:45','Сауле','Оплата','743 000 ₸','1 486 000 ₸ · оплачено полностью'],['21.09 12:02','Дана','Статус','Новый','Ждёт оплаты'],['21.09 12:00','Приложение','Заказ создан','—','Шарм-эль-Шейх, 3 туриста']]};
let COMMENTS={'Z-24187':[['Дана','04.10 11:12','Туристы просили номер с видом на море — подтверждено отелем письмом, файл в документах.'],['Арман','10.10 13:35','Рейс перенесён на 13:30, трансфер в аэропорт сдвинули, туристам ушёл push.']]};
const AUDIT=[
 ['10.10 14:02','Сауле','Бухгалтер','Финансы','Отметила оплату Z-24220','0 → 400 000 ₸','Chrome · Mac'],
 ['10.10 13:33','Арман','Авиа','Push','Массовый push по рейсу ST455','201 получатель','Safari · iPhone'],
 ['10.10 13:32','Арман','Авиа','Рейсы','Изменил время вылета ST455','09:15 → 13:30','Safari · iPhone'],
 ['10.10 12:40','Дана','Менеджер','Заказы','Изменила отель Z-24203','Lara Beach 4★ → Lara Palace 5★','Chrome · Windows'],
 ['10.10 11:58','Тимур','Менеджер','Заказы','Удалил комментарий Z-24166','«перезвонить» → —','Chrome · Windows'],
 ['10.10 11:20','Алихан','Руководитель','Настройки','Изменил права роли «Маркетинг»','+ просмотр туристов','Chrome · Mac'],
 ['10.10 10:05','Ая','Маркетинг','Push','Рассылка «Осенние скидки −10%»','12 480 получателей','Chrome · Mac'],
 ['10.10 09:12','Асель','Менеджер','Заказы','Выгрузила отчёт в Excel','«Неоплаченные до вылета 7 дней»','Chrome · Windows'],
 ['09.10 18:44','Ерлан','Менеджер','Заказы','Оформил возврат Z-24152','— → 520 000 ₸','Chrome · Windows']
];
/* Сохранённые фильтры */
let SAVED=[
 {n:'Вылет завтра',f:{when:'tomorrow'}},{n:'Не оплачены, вылет < 7 дней',f:{unpaid:1}},{n:'Без документов',f:{nodocs:1}},{n:'Рейсы с переносом',f:{moved:1}},{n:'Мои заказы',f:{mine:1}}
];

const SC={};
const tagSt=k=>{const m={new:'i',wait:'w',part:'w',paid:'g',docs:'g',fly:'i',done:'',refund:'r'};return `<span class="tag ${m[k]||''}">${OSN(k)}</span>`};
const fTag=f=>`<span class="tag ${FST[f.st][1]}">${FST[f.st][0]}${f.newT?' · '+f.newT:''}</span>`;
/* графики */
function lineChart(pts,{h=150,lbl=[]}={}){const w=600,mx=Math.max(...pts)*1.1,step=w/(pts.length-1),P=pts.map((v,i)=>[i*step,h-v/mx*h]);const d=P.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
 return `<svg class="lc" viewBox="0 -10 ${w} ${h+12}" preserveAspectRatio="none"><path d="${d} L ${w} ${h} L 0 ${h} Z" class="la"/><path d="${d}" class="ll"/>${P.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" class="lp"/>`).join('')}</svg><div class="lcl">${lbl.map(l=>`<span>${l}</span>`).join('')}</div>`}
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]));return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
let dPer='week';
const SALES={day:[0.4,0.9,1.6,2.1,2.8,3.4,4.2,4.9,5.6,6.1,6.8,7.4],week:[18.2,22.6,19.4,27.8,31.2,24.6,29.4],month:[61,74,82,96,88,104,118,126,97,112,131,142]};
const SLBL={day:['09:00','','','12:00','','','15:00','','','18:00','','21:00'],week:['пн','вт','ср','чт','пт','сб','вс'],month:['ноя','дек','янв','фев','мар','апр','май','июн','июл','авг','сен','окт']};
SC.dash=()=>{const tot={day:7.4,week:173.2,month:1331}[dPer];const ordN={day:14,week:96,month:742}[dPer];
 return `<div class="hd"><div><h2>Пульт · ${TODAY}</h2><p>Пользователи приложения, заказы и продажи за день, неделю, месяц — с графиками. Ниже — ближайшие рейсы и что требует внимания.</p></div><div class="seg">${[['day','День'],['week','Неделя'],['month','Месяц']].map(x=>`<a class="${dPer===x[0]?'on':''}" onclick="dPer='${x[0]}';render()">${x[1]}</a>`).join('')}</div></div>
 <div class="wid">
  <div class="clk" onclick="go('tourists')"><small>Пользователей приложения</small><b>18 942</b><span>+412 за неделю · 63% с включёнными push</span></div>
  <div class="clk" onclick="go('orders')"><small>Заказов за ${dPer==='day'?'день':dPer==='week'?'неделю':'месяц'}</small><b class="a">${ordN}</b><span>${dPer==='day'?'+3 к вчера':dPer==='week'?'+12% к прошлой':'+9% к сентябрю'}</span></div>
  <div class="clk" onclick="go('finance')"><small>Продажи</small><b class="g">${{day:'7,4 млн',week:'173 млн',month:'1,33 млрд'}[dPer]} ₸</b><span>средний чек 1,18 млн</span></div>
  <div class="clk" onclick="go('finance')"><small>Долги туристов</small><b class="w">${mln(ORDERS.reduce((a,o)=>a+(o.st==='refund'?0:o.sum-o.paid),0))}</b><span>${ORDERS.filter(o=>o.st!=='refund'&&o.sum>o.paid).length} заказа · ближайший вылет завтра</span></div>
  <div class="clk" onclick="go('flights')"><small>Рейсы на неделе</small><b>${FLIGHTS.length}</b><span>${FLIGHTS.filter(f=>f.st!=='ok').length} с изменениями</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Продажи, млн ₸ · ${dPer==='day'?'сегодня по часам':dPer==='week'?'эта неделя':'12 месяцев'}</h3>${lineChart(SALES[dPer],{lbl:SLBL[dPer]})}</div>
 <div class="pan"><h3>Направления · заказы за месяц</h3>${bars([['Анталья',268],['Шарм-эль-Шейх',176],['Дубай',121],['Нячанг',98],['Пхукет',79]])}<h3 style="margin-top:14px">Источники заказов</h3>${bars([['Приложение',338,'46%'],['Instagram',176,'24%'],['Сайт',139,'19%'],['Повторные',89,'11%']])}</div></div>
 <div class="g2"><div class="pan"><h3>Ближайшие рейсы</h3><div class="tw"><table class="t"><thead><tr><th>Рейс</th><th>Дата</th><th>Туристов</th><th>Статус</th></tr></thead><tbody>${FLIGHTS.slice(0,4).map(f=>`<tr class="clk" onclick="go('flights')"><td><b>${f.id}</b> ${f.from} → ${f.to}</td><td class="mono">${f.d} ${f.t}</td><td class="mono">${f.tour}</td><td>${fTag(f)}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="go('flights')"><i></i><div><b>ST455 Шарм-эль-Шейх перенесён на 13:30</b><span>push отправлен 201 туристу · открыли 164</span></div></div>
  <div class="rf bad" onclick="applySaved(1)"><i></i><div><b>3 заказа не оплачены, вылет меньше чем через 7 дней</b><span>долг 2,84 млн · напоминание об оплате уходит автоматически</span></div></div>
  <div class="rf" onclick="applySaved(2)"><i></i><div><b>4 заказа без авиабилетов в документах</b><span>вылеты 11–15.10</span></div></div>
  <div class="rf" onclick="go('auto')"><i></i><div><b>Регистрация на SL809 откроется 12.10</b><span>push «Регистрация открыта» уйдёт автоматически 131 туристу</span></div></div></div></div>
 ${said('Дашборд с основной аналитикой: количество пользователей, количество заказов, продажи за день/неделю/месяц, графики и статистика.')}`};

/* Заказы */
let F={q:'',st:'',fl:'',dir:'',air:'',m:'',when:'',unpaid:0,nodocs:0,moved:0,mine:0},SEL=new Set(),savedOn=-1;
function applySaved(i){const s=SAVED[i];F={q:'',st:'',fl:'',dir:'',air:'',m:'',when:'',unpaid:0,nodocs:0,moved:0,mine:0,...s.f};savedOn=i;go('orders')}
function fOrders(){return ORDERS.filter(o=>{const f=FL(o.fl);const t=(o.id+' '+o.pax.map(p=>p[0]).join(' ')+' '+o.hotel+' '+o.ph).toLowerCase();
 if(F.q&&!t.includes(F.q.toLowerCase()))return false;if(F.st&&o.st!==F.st)return false;if(F.fl&&o.fl!==F.fl)return false;if(F.dir&&f.to!==F.dir)return false;if(F.air&&f.air!==F.air)return false;if(F.m&&o.m!==F.m)return false;
 if(F.when==='tomorrow'&&f.d!=='11.10')return false;if(F.unpaid&&!(o.paid<o.sum&&o.st!=='refund'))return false;if(F.nodocs&&!(o.st!=='refund'&&(!o.docs.ticket||!o.docs.vouch)))return false;if(F.moved&&f.st==='ok')return false;if(F.mine&&o.m!=='DN')return false;return true})}
const sel=(id,opts,v,ph)=>`<select onchange="F.${id}=this.value;savedOn=-1;render()"><option value="">${ph}</option>${opts.map(o=>`<option value="${o[0]}" ${v===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>`;
SC.orders=()=>{const L=fOrders();
 return `<div class="hd"><div><h2>Заказы</h2><p>Фильтры по статусу, рейсу, направлению, авиакомпании и менеджеру. Частые подборки сохраняются одним кликом. Выделили заказы — отправили push, напоминание об оплате или выгрузили в Excel.</p></div><div class="btns"><button class="bt" onclick="exportXls('orders')">⇩ Excel</button><button class="bt p" onclick="card('neword')">+ Заказ</button></div></div>
 <div class="saved">${SAVED.map((s,i)=>`<a class="${savedOn===i?'on':''}" onclick="applySaved(${i})">★ ${esc(s.n)}<em>${(()=>{const b=F,bo=savedOn;F={q:'',st:'',fl:'',dir:'',air:'',m:'',when:'',unpaid:0,nodocs:0,moved:0,mine:0,...s.f};const n=fOrders().length;F=b;savedOn=bo;return n})()}</em></a>`).join('')}<a class="add" onclick="saveFilter()">+ Сохранить текущий фильтр</a></div>
 <div class="flt"><input placeholder="Поиск: номер, турист, телефон, отель" value="${esc(F.q)}" onchange="F.q=this.value;savedOn=-1;render()">${sel('st',OST,F.st,'Все статусы')}${sel('fl',FLIGHTS.map(f=>[f.id,f.id+' '+f.to]),F.fl,'Все рейсы')}${sel('dir',DIR.map(d=>[d,d]),F.dir,'Все направления')}${sel('air',Object.entries(AIR),F.air,'Все авиакомпании')}${sel('m',Object.entries(MGR),F.m,'Все менеджеры')}<a class="lk" onclick="F={q:'',st:'',fl:'',dir:'',air:'',m:'',when:'',unpaid:0,nodocs:0,moved:0,mine:0};savedOn=-1;render()">Сбросить</a></div>
 ${SEL.size?`<div class="bulk"><b>Выбрано: ${SEL.size}</b><button class="bt sm p" onclick="bulkPush()">Отправить push</button><button class="bt sm" onclick="toast('Напоминание об оплате отправлено ${SEL.size} заказам: push + WhatsApp.')">Напомнить об оплате</button><button class="bt sm" onclick="exportXls('sel')">⇩ Excel</button><a class="lk" onclick="SEL.clear();render()">снять выделение</a></div>`:''}
 <div class="tw"><table class="t ord"><thead><tr><th><input type="checkbox" onchange="if(this.checked)fOrders().forEach(o=>SEL.add(o.id));else SEL.clear();render()" ${L.length&&L.every(o=>SEL.has(o.id))?'checked':''}></th><th>Заказ</th><th>Туристы</th><th>Рейс</th><th>Отель</th><th class="r">Сумма</th><th class="r">Долг</th><th>Документы</th><th>Статус</th><th>Менеджер</th></tr></thead><tbody>${L.map(o=>{const f=FL(o.fl);const d=o.st==='refund'?0:o.sum-o.paid;return `<tr class="clk ${SEL.has(o.id)?'sel':''}"><td onclick="event.stopPropagation()"><input type="checkbox" ${SEL.has(o.id)?'checked':''} onchange="this.checked?SEL.add('${o.id}'):SEL.delete('${o.id}');render()"></td><td onclick="openOrd('${o.id}')"><b>${o.id}</b><div class="sub">${o.created} · ${o.src}${o.app?' · в приложении':''}</div></td><td onclick="openOrd('${o.id}')">${esc(o.pax[0][0])}${o.pax.length>1?` +${o.pax.length-1}`:''}</td><td onclick="openOrd('${o.id}')"><b>${o.fl}</b> ${f.to}<div class="sub">${f.d} ${f.newT||f.t} ${f.st!=='ok'?`<span class="neg">${FST[f.st][0].toLowerCase()}</span>`:''}</div></td><td onclick="openOrd('${o.id}')" class="mini">${esc(o.hotel)}</td><td class="r mono" onclick="openOrd('${o.id}')">${fmt(o.sum)}</td><td class="r mono ${d?'neg':''}" onclick="openOrd('${o.id}')">${d?fmt(d):'—'}</td><td onclick="openOrd('${o.id}')">${docDots(o)}</td><td onclick="openOrd('${o.id}')">${tagSt(o.st)}</td><td onclick="openOrd('${o.id}')">${MGR[o.m]}</td></tr>`}).join('')||'<tr><td colspan="10" class="mini">Ничего не найдено</td></tr>'}</tbody></table></div>
 <p class="mini">Показано ${L.length} из ${ORDERS.length} · в рабочей системе — все заказы с постраничной загрузкой.</p>
 ${said('Добавить возможность сохранять часто используемые фильтры и быстрые подборки заказов. Выгружать отчёты в Excel.')}`};
const docDots=o=>`<span class="dd">${[['vouch','В'],['ticket','Б'],['ins','С'],['visa','Ви']].map(([k,l])=>`<i class="${o.docs[k]?'on':''}" title="${{vouch:'Ваучер',ticket:'Авиабилет',ins:'Страховка',visa:'Виза'}[k]}">${l}</i>`).join('')}</span>`;
function saveFilter(){const n=prompt('Название подборки','Мои фильтры '+(SAVED.length+1));if(!n)return;SAVED.push({n,f:{...F}});savedOn=SAVED.length-1;render();toast(`Подборка «${esc(n)}» сохранена — видна вам; руководитель может сделать её общей.`)}
function bulkPush(){PUSH.ids=[...SEL];PUSH.mode='orders';go('push');toast(`Получатели — туристы из ${SEL.size} выбранных заказов.`)}
function openOrd(id){curOrd=id;go('order')}

SC.order=()=>{const o=OR(curOrd),f=FL(o.fl),h=HIST[o.id]||[['10.10 10:00','Система','Заказ создан','—',o.created]],cm=COMMENTS[o.id]||[];const d=o.st==='refund'?0:o.sum-o.paid;
 return `<div class="hd"><div><div class="mini"><a class="lk" onclick="go('orders')">Заказы</a> / ${o.id}</div><h2>${o.id} · ${f.to}, ${o.nights} ночей</h2><p>${esc(o.hotel)} · ${o.pax.length} туриста · менеджер ${MGR[o.m]} · создан ${o.created} · ${o.src}</p></div><div class="btns"><button class="bt" onclick="PUSH.ids=['${o.id}'];PUSH.mode='orders';go('push')">Push туристам</button><button class="bt p" onclick="card('pay','${o.id}')">+ Оплата</button></div></div>
 <div class="ostp">${OST.slice(0,7).map((s,i)=>{const ci=OST.findIndex(x=>x[0]===o.st);return `<div class="${o.st==='refund'?'':i<ci?'ok':i===ci?'on':''}"><i>${i<ci&&o.st!=='refund'?'✓':i+1}</i>${s[1]}</div>`}).join('')}</div>
 <div class="g3">
  <div class="pan"><h3>Перелёт</h3><div class="kv"><span>Туда</span><b>${o.fl} · ${f.from} → ${f.to}</b></div><div class="kv"><span>Вылет</span><b>${f.d} ${f.newT?`<s>${f.t}</s> ${f.newT}`:f.t}</b></div><div class="kv"><span>Авиакомпания</span><b>${AIR[f.air]}</b></div><div class="kv"><span>Обратно</span><b>${o.back}</b></div><div class="kv"><span>Регистрация</span><b>${f.reg}</b></div>${f.st!=='ok'?`<div class="pin">${FST[f.st][0]}: новое время ${f.newT}. Туристам отправлен push.</div>`:''}</div>
  <div class="pan"><h3>Туристы</h3>${o.pax.map(p=>`<div class="kv"><span>${esc(p[0])}<em class="mini"> · ${p[1]}</em></span><b class="mono">${p[2]}</b></div>`).join('')}<div class="kv"><span>Телефон</span><b class="mono">${o.ph}</b></div><div class="kv"><span>Приложение</span><b>${o.app?'установлено · push включены':'<span class="neg">не установлено — SMS / WhatsApp</span>'}</b></div></div>
  <div class="pan"><h3>Деньги</h3><div class="kv"><span>Стоимость</span><b class="mono">${tg(o.sum)}</b></div><div class="kv"><span>Оплачено</span><b class="mono pos">${tg(o.paid)}</b></div><div class="kv"><span>Долг</span><b class="mono ${d?'neg':''}">${tg(d)}</b></div>${o.refund?`<div class="kv"><span>Возврат</span><b class="mono neg">${tg(o.refund)}</b></div>`:''}<div class="kv"><span>Оплатить до</span><b>${d?'за 7 дней до вылета · авто-напоминание':'—'}</b></div></div>
 </div>
 <div class="g2">
  <div class="pan"><h3>Документы</h3>${[['vouch','Ваучер на отель','PDF'],['ticket','Авиабилеты','PDF'],['ins','Страховка','PDF'],['visa','Виза / разрешение','PDF'],['contract','Договор с туристом','подписан ЭЦП']].map(([k,n,t])=>{const has=k==='contract'||o.docs[k];return `<div class="doc ${has?'':'no'}"><i>${has?'PDF':'—'}</i><span><b>${n}</b><em>${has?t+' · отправлен в приложение':'не загружен'}</em></span>${has?'<a class="lk" onclick="toast(\'Документ открыт.\')">Открыть</a>':`<a class="lk" onclick="OR('${o.id}').docs['${k}']=1;render();toast('Документ загружен — туристу ушёл push «Документы готовы».')">Загрузить</a>`}</div>`}).join('')}</div>
  <div class="pan"><h3>Комментарии</h3><div class="cms">${cm.map(c=>`<div class="cm"><small>${c[0]} · ${c[1]}</small>${esc(c[2])}</div>`).join('')||'<p class="mini">Комментариев пока нет.</p>'}</div><div class="qin"><input id="cmin" placeholder="Комментарий для коллег, @упоминание…" onkeydown="if(event.key==='Enter')addCm()"><button class="bt p" onclick="addCm()">Добавить</button></div></div>
 </div>
 <div class="pan"><h3>История изменений заказа</h3><div class="tw"><table class="t"><thead><tr><th>Когда</th><th>Кто</th><th>Что</th><th>Было</th><th>Стало</th></tr></thead><tbody>${h.map(x=>`<tr><td class="mono">${x[0]}</td><td><b>${x[1]}</b></td><td>${x[2]}</td><td class="mini">${esc(x[3])}</td><td>${esc(x[4])}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Сделать более информативную карточку заказа, где будут все документы, комментарии и история изменений. Историю — кто, когда и какие изменения внёс.')}`};
function addCm(){const v=document.getElementById('cmin');if(!v||!v.value.trim())return;(COMMENTS[curOrd]=COMMENTS[curOrd]||[]).push([ROLES[role].n,TODAY.slice(0,5)+' '+NOW,v.value.trim()]);(HIST[curOrd]=HIST[curOrd]||[]).unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,'Комментарий','—',v.value.trim().slice(0,60)]);render()}

SC.tourists=()=>`<div class="hd"><div><h2>Туристы и приложение</h2><p>База туристов: кто установил приложение, включены ли push, сколько поездок. Отсюда же — сегменты для рассылок.</p></div></div>
 <div class="wid"><div><small>Туристов в базе</small><b>31 406</b><span>за всё время</span></div><div><small>Установили приложение</small><b class="a">18 942</b><span>60%</span></div><div><small>Push включены</small><b class="g">11 930</b><span>63% установивших</span></div><div><small>Повторные</small><b>27%</b><span>2+ поездки</span></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Турист</th><th>Телефон</th><th>Поездок</th><th>Последний заказ</th><th>Приложение</th><th>Push</th></tr></thead><tbody>${ORDERS.flatMap(o=>o.pax.filter(p=>p[1]==='взр.').slice(0,1).map(p=>[p[0],o.ph,o.id==='Z-24166'?4:o.id==='Z-24187'?2:1,o.id+' · '+FL(o.fl).to,o.app,o.app&&o.id!=='Z-24203'])).map(r=>`<tr><td><b>${esc(r[0])}</b></td><td class="mono">${r[1]}</td><td class="mono">${r[2]}</td><td>${r[3]}</td><td>${r[4]?'<span class="tag g">установлено</span>':'<span class="tag">нет</span>'}</td><td>${r[5]?'вкл':'—'}</td></tr>`).join('')}</tbody></table></div>`;

SC.flights=()=>`<div class="hd"><div><h2>Рейсы</h2><p>Все рейсы с туристами: загрузка, регистрация, статус. Перенос или задержка вводится один раз — время обновляется во всех заказах, и туристам рейса уходит push.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Рейс</th><th>Авиакомпания</th><th>Маршрут</th><th>Вылет</th><th>Места</th><th>Туристов</th><th>Регистрация</th><th>Статус</th><th></th></tr></thead><tbody>${FLIGHTS.map(f=>`<tr class="${f.st==='moved'?'rowwarn':f.st==='delay'?'rowbad':''}"><td><b>${f.id}</b></td><td>${AIR[f.air]}</td><td>${f.from} → ${f.to}</td><td class="mono">${f.d} ${f.newT?`<s>${f.t}</s> <b>${f.newT}</b>`:f.t}</td><td><div class="pbr"><i style="width:${f.sold/f.seats*100}%"></i></div><span class="mini">${f.sold} / ${f.seats}</span></td><td class="mono">${f.tour}</td><td class="mini">${f.reg}</td><td>${fTag(f)}</td><td><button class="bt sm" onclick="card('move','${f.id}')">Перенос / задержка</button></td></tr>`).join('')}</tbody></table></div>
 ${said('Массовая отправка Push-уведомлений туристам с фильтрацией по рейсу… например, при переносе рейса или изменении времени вылета.')}`;
function moveDo(id){const f=FL(id),t=document.getElementById('mv_t').value.trim(),k=document.getElementById('mv_k').value;if(!t){toast('Укажите новое время');return}const old=f.newT||f.t;f.newT=t;f.st=k;(HIST['Z-24187']=HIST['Z-24187']||[]);AUDIT.unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,role,'Рейсы',`Изменил время вылета ${id}`,`${old} → ${t}`,'Chrome · Mac']);closeM();
 if(document.getElementById('mv_p').checked){PUSH.f={fl:id,dir:'',air:'',date:'',pay:''};PUSH.mode='filter';PUSH.title=k==='delay'?'Задержка рейса '+id:'Перенос рейса '+id;PUSH.text=`Внимание! Рейс ${id} ${f.from} → ${f.to} ${f.d}: новое время вылета ${t}. Трансфер в аэропорт сдвинут автоматически. Вопросы — в чат в приложении.`;go('push');toast(`Время ${id} обновлено во всех заказах. Push подготовлен — проверьте текст и отправьте.`)}else{render();toast(`Время ${id} обновлено во всех заказах.`)}}

SC.tours=()=>`<div class="hd"><div><h2>Направления и туры</h2><p>Направления, отели и блоки мест на рейсах — откуда менеджер собирает заказ, а туристы в приложении видят предложения.</p></div></div>
 <div class="g3">${[['Анталья','Турция','268 заказов в месяц','Lara Palace 5★ · Side Garden 4★ · Alanya Sun 4★','от 498 000 ₸'],['Шарм-эль-Шейх','Египет','176 заказов','Coral Bay Resort 5★ · Reef Oasis 4★','от 452 000 ₸'],['Дубай','ОАЭ','121 заказ','Marina View 4★ · Palm Club 5★','от 612 000 ₸'],['Нячанг','Вьетнам','98 заказов','Sea Pearl 4★ · Nha Trang Bay 5★','от 589 000 ₸'],['Пхукет','Таиланд','79 заказов','Kata Beach 5★ · Patong Hill 4★','от 701 000 ₸']].map(d=>`<div class="pan dest"><h3>${d[0]} <span class="mini">${d[1]}</span></h3><div class="kv"><span>Спрос</span><b>${d[2]}</b></div><p class="mini">${d[3]}</p><b class="pr">${d[4]}</b></div>`).join('')}</div>`;

/* Массовые push */
let PUSH={mode:'filter',f:{fl:'',dir:'',air:'',date:'',pay:''},ids:[],title:'Осенние скидки −10%',text:'Только до 20 октября: −10% на туры в Анталью и Шарм-эль-Шейх при оплате в приложении.',when:'now'};
let PSENT=[['10.10 13:33','Арман','Перенос рейса ST455','рейс ST455',201,198,164],['10.10 10:05','Ая','Осенние скидки −10%','все с push',11930,11702,3011],['09.10 18:00','Авто','Напоминание о вылете','рейс SL801 · завтра',176,174,149],['09.10 12:00','Авто','Напоминание об оплате','долг · вылет < 7 дней',12,12,10]];
function pushRecipients(){if(PUSH.mode==='orders')return ORDERS.filter(o=>PUSH.ids.includes(o.id)).reduce((a,o)=>a+o.pax.length,0);
 let n=0;FLIGHTS.forEach(f=>{if(PUSH.f.fl&&f.id!==PUSH.f.fl)return;if(PUSH.f.dir&&f.to!==PUSH.f.dir)return;if(PUSH.f.air&&f.air!==PUSH.f.air)return;if(PUSH.f.date&&f.d!==PUSH.f.date)return;n+=f.tour});if(PUSH.f.pay==='debt')n=Math.round(n*.08);if(!PUSH.f.fl&&!PUSH.f.dir&&!PUSH.f.air&&!PUSH.f.date&&!PUSH.f.pay)n=11930;return n}
const psel=(k,opts,ph)=>`<label>${ph}<select onchange="PUSH.f.${k}=this.value;PUSH.mode='filter';render()"><option value="">Все</option>${opts.map(o=>`<option value="${o[0]}" ${PUSH.f[k]===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></label>`;
SC.push=()=>{const n=pushRecipients();
 return `<div class="hd"><div><h2>Массовые push-уведомления</h2><p>Выбираете туристов фильтрами — по рейсу, дате, направлению, авиакомпании, оплате — или из выделенных заказов. Видно, сколько человек получит, как выглядит уведомление на телефоне, сколько доставлено и открыто.</p></div></div>
 <div class="pushw"><div class="pan"><h3>1. Кому</h3>${PUSH.mode==='orders'?`<div class="pin">Туристы из выбранных заказов: ${PUSH.ids.join(', ')} <a class="lk" onclick="PUSH.mode='filter';render()">выбрать фильтрами</a></div>`:`<div class="form">${psel('fl',FLIGHTS.map(f=>[f.id,f.id+' · '+f.to+' · '+f.d]),'Рейс')}${psel('date',[...new Set(FLIGHTS.map(f=>f.d))].map(d=>[d,d]),'Дата вылета')}${psel('dir',DIR.map(d=>[d,d]),'Направление')}${psel('air',Object.entries(AIR),'Авиакомпания')}${psel('pay',[['debt','Есть долг по оплате'],['paid','Оплачено полностью']],'Оплата')}</div>`}
  <div class="rcp"><b>${fmt(n)}</b><span>получателей с включёнными push · остальным — SMS / WhatsApp</span></div>
  <h3>2. Сообщение</h3><div class="form one"><label>Заголовок<input value="${esc(PUSH.title)}" oninput="PUSH.title=this.value;pv()"></label><label>Текст<textarea rows="4" oninput="PUSH.text=this.value;pv()">${esc(PUSH.text)}</textarea></label><label>Что откроется по нажатию<select><option>Карточка заказа в приложении</option><option>Информация о рейсе</option><option>Чат с менеджером</option><option>Акция</option></select></label></div>
  <div class="tpls"><span class="mini">Шаблоны:</span>${[['Перенос рейса','Внимание! Время вылета вашего рейса изменилось. Новое время — в приложении.'],['Регистрация открыта','Онлайн-регистрация на ваш рейс открыта. Зарегистрируйтесь в приложении, чтобы выбрать места.'],['Документы готовы','Ваш ваучер, билеты и страховка готовы — они уже в приложении.'],['Напоминание об оплате','Остаток по туру нужно оплатить до вылета. Оплатить можно в приложении через Kaspi.']].map(t=>`<a onclick="PUSH.title=${JSON.stringify(t[0]).replace(/"/g,'&quot;')};PUSH.text=${JSON.stringify(t[1]).replace(/"/g,'&quot;')};render()">${t[0]}</a>`).join('')}</div>
  <h3>3. Когда</h3><div class="seg">${[['now','Сейчас'],['plan','Запланировать']].map(x=>`<a class="${PUSH.when===x[0]?'on':''}" onclick="PUSH.when='${x[0]}';render()">${x[1]}</a>`).join('')}</div>${PUSH.when==='plan'?'<input class="inp" value="11.10.2026 09:00">':''}
  <div class="btns l" style="margin-top:14px"><button class="bt p" onclick="pushSend(${n})">Отправить ${fmt(n)} туристам</button><button class="bt" onclick="toast('Тестовое уведомление отправлено на ваш телефон.')">Тест себе</button></div></div>
 <div class="phonew"><div class="phone"><div class="ph-top"><span>14:20</span><span>●●● ▮</span></div><div class="ph-lock"><b>14:20</b><span>суббота, 10 октября</span></div><div class="ntf" id="pvn"><div class="ntf-h"><i>К</i><b>Компас Тур</b><span>сейчас</span></div><b class="ntf-t">${esc(PUSH.title)}</b><p>${esc(PUSH.text)}</p></div></div><p class="mini" style="text-align:center">Так туристы увидят уведомление</p></div></div>
 <div class="pan"><h3>Отправленные рассылки</h3><div class="tw"><table class="t"><thead><tr><th>Когда</th><th>Кто</th><th>Рассылка</th><th>Кому</th><th class="r">Отправлено</th><th class="r">Доставлено</th><th class="r">Открыли</th></tr></thead><tbody>${PSENT.map(r=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td><b>${esc(r[2])}</b></td><td class="mini">${esc(r[3])}</td><td class="r mono">${fmt(r[4])}</td><td class="r mono">${fmt(r[5])}</td><td class="r mono">${fmt(r[6])} · ${Math.round(r[6]/r[5]*100)}%</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Массовая отправка Push-уведомлений туристам с фильтрацией по рейсу, дате, направлению или авиакомпании.')}`};
function pv(){const n=document.getElementById('pvn');if(n){n.querySelector('.ntf-t').textContent=PUSH.title;n.querySelector('p').textContent=PUSH.text}}
function pushSend(n){PSENT.unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,PUSH.title,PUSH.mode==='orders'?'выбранные заказы':Object.entries(PUSH.f).filter(x=>x[1]).map(x=>x[1]).join(' · ')||'все с push',n,Math.round(n*.985),0]);AUDIT.unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,role,'Push',`Массовый push «${PUSH.title}»`,n+' получателей','Chrome · Mac']);SEL.clear();render();toast(`${PUSH.when==='now'?'Отправлено':'Запланировано'}: ${fmt(n)} туристам. Статистика доставки и открытий — в таблице ниже.`)}

/* Автоуведомления */
let AUTO=[['Регистрация открыта','за 24 ч до вылета (по данным авиакомпании)','push · WhatsApp',1,'«Онлайн-регистрация на рейс {рейс} открыта»'],['Напоминание об оплате','за 10, 7 и 3 дня до вылета, если есть долг','push · WhatsApp · SMS',1,'«Остаток {долг} ₸ нужно оплатить до {дата}»'],['Документы готовы','когда менеджер загрузил ваучер / билеты / страховку','push',1,'«Ваши документы уже в приложении»'],['Напоминание о вылете','за 24 часа и за 4 часа','push · SMS',1,'«Вылет {рейс} завтра в {время}, будьте в аэропорту за 3 часа»'],['Перенос или задержка рейса','при изменении времени в разделе «Рейсы»','push · SMS',1,'«Новое время вылета {время}»'],['Трансфер','за 12 часов до трансфера','push',1,'«Трансфер из отеля в {время}, гид {имя}»'],['Обратный вылет','за 24 часа до обратного рейса','push',1,'«Вылет домой {дата} {время}»'],['Отзыв о поездке','на следующий день после возвращения','push',0,'«Оцените поездку — 1 минута»'],['День рождения','в день рождения туриста','push',0,'«Скидка −5% на следующий тур»']];
SC.auto=()=>`<div class="hd"><div><h2>Автоматические уведомления</h2><p>Система сама пишет туристам в нужный момент: регистрация, оплата, документы, вылет. Включаете правило, правите текст — дальше работает без менеджера.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Уведомление</th><th>Когда</th><th>Каналы</th><th>Текст</th><th>Вкл.</th></tr></thead><tbody>${AUTO.map((a,i)=>`<tr><td><b>${a[0]}</b></td><td class="mini">${a[1]}</td><td class="mini">${a[2]}</td><td class="mini">${esc(a[4])}</td><td><span class="sw ${a[3]?'on':''}" onclick="AUTO[${i}][3]=AUTO[${i}][3]?0:1;this.classList.toggle('on');toast(AUTO[${i}][3]?'Включено':'Выключено')"></span></td></tr>`).join('')}</tbody></table></div>
 <div class="g2"><div class="pan"><h3>Сегодня уйдёт автоматически</h3>${[['13:30','Регистрация открыта','ST455 · 201 турист'],['18:00','Напоминание о вылете','SL801, ST455 · 377 туристов'],['20:00','Напоминание об оплате','3 заказа с долгом']].map(x=>`<div class="kv"><span class="mono">${x[0]}</span><span>${x[1]}</span><b>${x[2]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Если нет приложения</h3><p class="mini">Туристам без приложения или с выключенными push то же сообщение уходит в WhatsApp или SMS — через провайдера с API. В карточке заказа видно, что и когда отправлено.</p></div></div>
 ${said('Автоматические уведомления туристам (об открытии регистрации, напоминание об оплате, отправка документов, напоминание о вылете).')}`;

/* Финансы */
SC.finance=()=>{const debtT=ORDERS.filter(o=>o.st!=='refund'&&o.paid<o.sum);
 return `<div class="hd"><div><h2>Финансы</h2><p>Выручка, возвраты и задолженности: туристы — нам, мы — туроператорам и авиакомпаниям. По месяцам, направлениям и менеджерам.</p></div><div class="btns"><button class="bt" onclick="exportXls('finance')">⇩ Excel</button></div></div>
 <div class="wid"><div><small>Выручка · октябрь</small><b class="g">142 млн</b><span>+8,5% к сентябрю</span></div><div><small>Маржа</small><b>18,6 млн</b><span>13,1% от выручки</span></div><div><small>Возвраты · октябрь</small><b class="r">4,8 млн</b><span>9 заказов · 3,4%</span></div><div><small>Долги туристов</small><b class="w">${mln(debtT.reduce((a,o)=>a+o.sum-o.paid,0))}</b><span>${debtT.length} заказа</span></div><div><small>Долг партнёрам</small><b>38,4 млн</b><span>оплатить до 15.10</span></div></div>
 <div class="g2 g21"><div class="pan"><h3>Выручка и возвраты, млн ₸</h3>${lineChart(SALES.month,{lbl:SLBL.month})}<div class="lg2"><i class="c1"></i>выручка · возвраты в октябре 3,4% — в таблице справа внизу</div></div>
 <div class="pan"><h3>Выручка по менеджерам · октябрь</h3>${bars([['Дана',48.2,'48,2 млн'],['Тимур',36.9,'36,9 млн'],['Асель',31.4,'31,4 млн'],['Ерлан',25.5,'25,5 млн']])}</div></div>
 <div class="g2"><div class="pan"><h3>Долги туристов</h3><div class="tw"><table class="t"><thead><tr><th>Заказ</th><th>Вылет</th><th class="r">Долг</th><th>Напоминание</th></tr></thead><tbody>${debtT.map(o=>`<tr class="clk" onclick="openOrd('${o.id}')"><td><b>${o.id}</b> ${esc(o.pax[0][0])}</td><td class="mono">${FL(o.fl).d}</td><td class="r mono neg">${fmt(o.sum-o.paid)}</td><td class="mini">авто · за 7 и 3 дня</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Возвраты</h3><div class="tw"><table class="t"><thead><tr><th>Заказ</th><th>Причина</th><th class="r">Сумма</th><th>Статус</th></tr></thead><tbody>${[['Z-24152','Болезнь туриста, справка','520 000','выплачен'],['Z-24098','Отмена рейса авиакомпанией','1 240 000','ждёт оператора'],['Z-24077','Отказ в визе','388 000','выплачен']].map(r=>`<tr><td><b>${r[0]}</b></td><td class="mini">${r[1]}</td><td class="r mono">${r[2]}</td><td><span class="tag ${r[3]==='выплачен'?'g':'w'}">${r[3]}</span></td></tr>`).join('')}</tbody></table></div><h3 style="margin-top:12px">Долг партнёрам</h3>${[['Туроператор «Анатолия Трэвел»','21,6 млн','15.10'],['SkyLine KZ · блоки мест','12,1 млн','13.10'],['Отели Египта (прямые)','4,7 млн','18.10']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]} · до ${x[2]}</b></div>`).join('')}</div></div>
 ${said('Добавить раздел «Финансы» с аналитикой по выручке, возвратам и задолженностям.')}`};

/* Отчёты в Excel — настоящая выгрузка */
const REPS=[['orders','Заказы по текущему фильтру','номер, туристы, рейс, отель, сумма, оплачено, долг, статус, менеджер'],['debts','Неоплаченные заказы до вылета','заказ, турист, телефон, вылет, долг'],['flight','Списки туристов по рейсу','рейс, ФИО, паспорт, телефон, отель — для авиакомпании и трансфера'],['finance','Выручка и возвраты за период','месяц, выручка, возвраты, маржа'],['managers','Продажи по менеджерам','менеджер, заказы, выручка, средний чек'],['push','Отчёт по рассылкам','рассылка, отправлено, доставлено, открыто']];
SC.reports=()=>`<div class="hd"><div><h2>Отчёты в Excel</h2><p>Любой отчёт — в Excel одной кнопкой. Попробуйте: файл скачается по-настоящему, с данными демо.</p></div></div>
 <div class="g3">${REPS.map(r=>`<div class="pan rep"><h3>${r[1]}</h3><p class="mini">${r[2]}</p><button class="bt p sm" onclick="exportXls('${r[0]}')">⇩ Скачать Excel</button></div>`).join('')}</div>
 ${said('Добавить возможность выгружать отчёты в Excel.')}`;
function exportXls(k){let head=[],rows=[],name='otchet';
 const oRow=o=>{const f=FL(o.fl);return [o.id,o.pax.map(p=>p[0]).join(', '),o.fl+' '+f.to+' '+f.d,o.hotel,o.sum,o.paid,o.st==='refund'?0:o.sum-o.paid,OSN(o.st),MGR[o.m]]};
 if(k==='orders'||k==='sel'){head=['Заказ','Туристы','Рейс','Отель','Сумма','Оплачено','Долг','Статус','Менеджер'];rows=(k==='sel'?ORDERS.filter(o=>SEL.has(o.id)):fOrders()).map(oRow);name='zakazy'}
 else if(k==='debts'){head=['Заказ','Турист','Телефон','Вылет','Долг'];rows=ORDERS.filter(o=>o.st!=='refund'&&o.paid<o.sum).map(o=>[o.id,o.pax[0][0],o.ph,FL(o.fl).d+' '+FL(o.fl).t,o.sum-o.paid]);name='dolgi'}
 else if(k==='flight'){head=['Рейс','ФИО','Паспорт','Телефон','Отель'];rows=ORDERS.flatMap(o=>o.pax.map(p=>[o.fl,p[0],p[2],o.ph,o.hotel]));name='spiski_reisov'}
 else if(k==='finance'){head=['Месяц','Выручка, млн','Возвраты, млн','Маржа, млн'];rows=SLBL.month.map((m,i)=>[m,SALES.month[i],Math.round(SALES.month[i]*.035*10)/10,Math.round(SALES.month[i]*.13*10)/10]);name='finansy'}
 else if(k==='managers'){head=['Менеджер','Заказов','Выручка, млн','Средний чек'];rows=[['Дана',41,48.2,1175600],['Тимур',31,36.9,1190300],['Асель',27,31.4,1162900],['Ерлан',22,25.5,1159100]];name='menedzhery'}
 else {head=['Когда','Рассылка','Отправлено','Доставлено','Открыли'];rows=PSENT.map(r=>[r[0],r[2],r[4],r[5],r[6]]);name='rassylki'}
 const x='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><tr>'+head.map(h=>`<th style="background:#0b4f6c;color:#fff">${esc(h)}</th>`).join('')+'</tr>'+rows.map(r=>'<tr>'+r.map(c=>`<td>${esc(c)}</td>`).join('')+'</tr>').join('')+'</table></body></html>';
 try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+x],{type:'application/vnd.ms-excel'}));a.download=name+'_'+TODAY.replace(/\./g,'-')+'.xls';document.body.appendChild(a);a.click();a.remove()}catch(e){}
 AUDIT.unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,role,'Отчёты',`Выгрузил в Excel «${name}»`,rows.length+' строк','Chrome · Mac']);toast(`Excel скачан: ${rows.length} строк.`)}

/* Журнал действий */
let aF='';
SC.audit=()=>{const L=AUDIT.filter(a=>!aF||a[3]===aF);return `<div class="hd"><div><h2>Журнал действий пользователей</h2><p>Каждое изменение в системе: кто, когда, что сделал, что было и что стало, с какого устройства. Ничего нельзя удалить незаметно.</p></div><div class="btns"><button class="bt" onclick="toast('Журнал выгружен в Excel.')">⇩ Excel</button></div></div>
 <div class="seg">${['','Заказы','Рейсы','Push','Финансы','Отчёты','Настройки'].map(x=>`<a class="${aF===x?'on':''}" onclick="aF='${x}';render()">${x||'Все'}</a>`).join('')}</div>
 <div class="tw"><table class="t"><thead><tr><th>Когда</th><th>Кто</th><th>Раздел</th><th>Действие</th><th>Было → стало</th><th>Устройство</th></tr></thead><tbody>${L.map(a=>`<tr><td class="mono">${a[0]}</td><td><b>${a[1]}</b><div class="sub">${a[2]}</div></td><td>${a[3]}</td><td>${esc(a[4])}</td><td class="mini">${esc(a[5])}</td><td class="mini">${a[6]}</td></tr>`).join('')}</tbody></table></div>
 ${said('Добавить журнал действий пользователей для контроля всех изменений в системе.')}`};

SC.staff=()=>{const A=[['Пульт и аналитика',{Р:2,М:1,О:1,Б:1,Мк:1}],['Заказы — все',{Р:2,О:1,Б:1}],['Заказы — свои',{Р:2,М:2,О:1}],['Рейсы, перенос',{Р:2,О:2}],['Массовые push',{Р:2,О:2,Мк:2}],['Финансы',{Р:2,Б:2}],['Журнал действий',{Р:2}],['Настройки и стиль',{Р:2}]];const R=[['Р','Руководитель'],['М','Менеджер'],['О','Авиа и опер.'],['Б','Бухгалтер'],['Мк','Маркетинг']];
 return `<div class="hd"><div><h2>Сотрудники и роли</h2><p>Каждый входит под своим логином и видит только своё. Права настраиваются без программиста.</p></div><div class="btns"><button class="bt p" onclick="toast('Приглашение отправлено на почту сотрудника.')">+ Сотрудник</button></div></div>
 <div class="tw"><table class="t mx"><thead><tr><th>Раздел</th>${R.map(r=>`<th class="c">${r[1]}</th>`).join('')}</tr></thead><tbody>${A.map(a=>`<tr><td>${a[0]}</td>${R.map(r=>`<td class="c">${a[1][r[0]]===2?'●':a[1][r[0]]===1?'○':'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="mini">● — меняет · ○ — только смотрит · — — не видит.</p>`};

/* Фирменный стиль — меняется по всему демо на лету */
const PRESETS=[['Океан','#0b4f6c','#ff6b4a'],['Небо','#0a5bd3','#ffb020'],['Пустыня','#7a4a1e','#2f8f83'],['Изумруд','#0f5c4d','#f2a03d'],['Графит','#22303a','#e8463b']];
let BR={n:'Компас Тур',c1:'#0b4f6c',c2:'#ff6b4a',logo:''};try{Object.assign(BR,JSON.parse(localStorage.getItem('kompas-brand')||'{}'))}catch(e){}
function mix(hex,a){const n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;return `rgba(${r},${g},${b},${a})`}
function applyBrand(){const d=document.documentElement.style;d.setProperty('--brand',BR.c1);d.setProperty('--rail',BR.c1);d.setProperty('--brand2',BR.c2);d.setProperty('--acc2',BR.c2);d.setProperty('--brandl',mix(BR.c1,.09));d.setProperty('--rail-a',BR.c2);
 document.querySelectorAll('.bname').forEach(e=>e.textContent=BR.n);document.querySelectorAll('.blogo').forEach(e=>e.innerHTML=BR.logo?`<img src="${BR.logo}" alt="">`:LOGO_I);try{localStorage.setItem('kompas-brand',JSON.stringify(BR))}catch(e){}}
function setBr(k,v){BR[k]=v;applyBrand();if(cur==='brand'){const p=document.getElementById('brprev');if(p)p.innerHTML=brPrev()}}
function brLogo(inp){const f=inp.files&&inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{BR.logo=r.result;applyBrand();render()};r.readAsDataURL(f)}
const brPrev=()=>`<div class="bp"><div class="bp-h"><span class="blogo">${BR.logo?`<img src="${BR.logo}" alt="">`:LOGO_I}</span><b>${esc(BR.n)}</b></div><div class="bp-b"><div class="bp-w"><small>Продажи</small><b>173 млн ₸</b></div><button class="bt p">Основная кнопка</button> <span class="tag b">Статус</span> <a class="lk">Ссылка</a><div class="pbr" style="margin-top:10px"><i style="width:68%"></i></div></div></div>`;
SC.brand=()=>`<div class="hd"><div><h2>Фирменный стиль</h2><p>Цвета, логотип и название компании — по всей админке и в приложении туриста. Попробуйте: выберите цвета — демо перекрасится сразу. На старте мы возьмём ваш брендбук.</p></div></div>
 <div class="g2"><div class="pan"><h3>Готовые палитры</h3><div class="presets">${PRESETS.map(p=>`<a onclick="setBr('c1','${p[1]}');setBr('c2','${p[2]}');render()" class="${BR.c1===p[1]?'on':''}"><i style="background:${p[1]}"></i><i style="background:${p[2]}"></i>${p[0]}</a>`).join('')}</div>
  <h3 style="margin-top:14px">Свои цвета и логотип</h3><div class="form"><label>Основной цвет<input type="color" value="${BR.c1}" oninput="setBr('c1',this.value)"></label><label>Акцентный цвет<input type="color" value="${BR.c2}" oninput="setBr('c2',this.value)"></label><label>Название<input value="${esc(BR.n)}" oninput="setBr('n',this.value)"></label><label>Логотип<input type="file" accept="image/*" onchange="brLogo(this)"></label></div><button class="bt sm" onclick="BR={n:'Компас Тур',c1:'#0b4f6c',c2:'#ff6b4a',logo:''};applyBrand();render()">Вернуть как было</button></div>
 <div class="pan"><h3>Как это выглядит</h3><div id="brprev">${brPrev()}</div></div></div>
 ${said('Оформить интерфейс в фирменных цветах компании.')}`;

SC.mobile=()=>`<div class="hd"><div><h2>Админка с телефона</h2><p>Каждый экран сделан сначала под телефон: таблицы превращаются в карточки, снизу — панель с главными разделами, кнопки крупные. Перенести рейс и отправить push можно из аэропорта. Откройте демо на телефоне — всё работает так же.</p></div></div>
 <div class="phones3">${[['Заказы',`<div class="m-s">★ Вылет завтра · 2</div>${ORDERS.slice(0,4).map(o=>`<div class="m-c"><b>${o.id}</b><span>${esc(o.pax[0][0])} · ${FL(o.fl).to}</span><em>${OSN(o.st)}</em></div>`).join('')}`],['Карточка заказа',`<div class="m-c big"><b>Z-24187</b><span>Шарм-эль-Шейх · 7 ночей</span><em>Документы выданы</em></div><div class="m-r"><span>Вылет</span><b>11.10 13:30</b></div><div class="m-r"><span>Долг</span><b>0 ₸</b></div><div class="m-r"><span>Документы</span><b>3 из 4</b></div><div class="m-btn">Push туристам</div>`],['Перенос рейса',`<div class="m-c big"><b>ST455</b><span>Алматы → Шарм · 11.10</span><em>09:15 → 13:30</em></div><div class="m-r"><span>Туристов</span><b>201</b></div><div class="m-btn">Обновить время и отправить push</div>`]].map(x=>`<div class="mphone"><div class="mp-h"><span class="blogo">${LOGO_I}</span><b>${x[0]}</b></div><div class="mp-b">${x[1]}</div><div class="mp-nav"><i>Пульт</i><i class="on">Заказы</i><i>Рейсы</i><i>Push</i><i>Ещё</i></div></div>`).join('')}</div>
 ${said('Сделать админку удобной для работы с телефона, сейчас некоторые элементы отображаются некорректно.')}`;

SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Стандартный пакет разработки: всё из вашего ТЗ и то, что в демо, — один раз, без абонентской платы. Подключаемся к вашей текущей базе и приложению туриста, код и данные — ваши.</p></div></div>
 <div class="pk1"><div><small>Стандартный пакет разработки</small><b>2 500 000 ₸</b><span>11 пунктов ТЗ + рейсы, заказы, туристы, роли · запас на правки при шлифовке</span></div><div><small>Срок</small><b>4–6 недель</b><span>ядро — через 2–3 недели</span></div></div>
 <div class="pay3"><div><small>Старт · 10 %</small><b>250 000 ₸</b><span>доступ к базе и приложению, начинаем</span></div><div><small>Ядро · 45 %</small><b>1 125 000 ₸</b><span>после приёмки ядра</span></div><div><small>Сдача · 45 %</small><b>1 125 000 ₸</b><span>после шлифовки и передачи</span></div></div>
 <div class="g2"><div class="pan"><h3>Ядро — 2–3 недели</h3>${['Пульт и аналитика, мобильная версия, фирменный стиль','Заказы: фильтры, сохранённые подборки, массовые действия','Карточка заказа: документы, комментарии, история изменений','Рейсы и массовые push с фильтрами'].map(x=>`<div class="li"><i>✓</i><span>${x}</span></div>`).join('')}</div>
 <div class="pan"><h3>Шлифовка — до сдачи</h3>${['Автоуведомления: регистрация, оплата, документы, вылет','Финансы: выручка, возвраты, задолженности','Выгрузки в Excel, журнал действий, роли','Ваши правки по итогам работы'].map(x=>`<div class="li n"><i>→</i><span>${x}</span></div>`).join('')}</div></div>`;

const CARD={};
CARD.move=id=>{const f=FL(id);return [`Перенос или задержка · ${id}`,`${f.from} → ${f.to} · ${f.d} · сейчас ${f.newT||f.t} · туристов ${f.tour}`,`<div class="form"><label>Что случилось<select id="mv_k"><option value="moved">Перенос авиакомпанией</option><option value="delay">Задержка</option></select></label><label>Новое время вылета<input id="mv_t" value="${f.id==='SL801'?'08:10':''}" placeholder="чч:мм"></label></div><label class="ck"><input type="checkbox" id="mv_p" checked> Сразу подготовить push всем туристам рейса</label><p class="mini">Время обновится во всех заказах рейса, в приложении туриста и в автоуведомлениях; изменение попадёт в историю заказов и журнал действий.</p><button class="bt p" onclick="moveDo('${id}')">Сохранить</button>`]};
CARD.pay=id=>{const o=OR(id);return ['Оплата по заказу '+id,'Долг '+tg(Math.max(0,o.sum-o.paid)),`<div class="form"><label>Сумма<input id="py_s" value="${Math.max(0,o.sum-o.paid)}"></label><label>Способ<select><option>Kaspi</option><option>Карта</option><option>Наличные</option><option>Безнал</option></select></label></div><button class="bt p" onclick="payDo('${id}')">Провести</button>`]};
function payDo(id){const o=OR(id),s=+document.getElementById('py_s').value||0;const old=o.paid;o.paid=Math.min(o.sum,o.paid+s);if(o.paid>=o.sum&&['new','wait','part'].includes(o.st))o.st='paid';else if(o.paid>0&&['new','wait'].includes(o.st))o.st='part';(HIST[id]=HIST[id]||[]).unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,'Оплата',tg(old),tg(o.paid)]);AUDIT.unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,role,'Финансы',`Отметил оплату ${id}`,`${fmt(old)} → ${fmt(o.paid)} ₸`,'Chrome · Mac']);closeM();render();toast('Оплата проведена — туристу ушёл push с чеком, история и журнал обновлены.')}
CARD.neword=()=>['Новый заказ','Менеджер оформляет за туриста — или турист сам в приложении',`<div class="form"><label>Турист<input id="no_n" value="Аружан Касымова"></label><label>Телефон<input value="+7 701 000 00 00"></label><label>Рейс<select id="no_f">${FLIGHTS.map(f=>`<option value="${f.id}">${f.id} · ${f.to} · ${f.d}</option>`).join('')}</select></label><label>Отель<input id="no_h" value="Lara Palace 5★, UAI"></label><label>Стоимость, ₸<input id="no_s" value="562000"></label></div><button class="bt p" onclick="newOrd()">Создать</button>`];
function newOrd(){const v=i=>document.getElementById(i).value.trim();const id='Z-'+(24230+ORDERS.length-9);ORDERS.unshift({id,fl:v('no_f'),back:'—',hotel:v('no_h'),nights:7,pax:[[v('no_n'),'взр.','—']],ph:'+7 701 000 00 00',sum:+v('no_s')||0,paid:0,st:'new',m:'DN',app:false,src:'Менеджер',docs:{vouch:0,ticket:0,ins:0,visa:0},created:TODAY.slice(0,5)});HIST[id]=[[TODAY.slice(0,5)+' '+NOW,ROLES[role].n,'Заказ создан','—',v('no_h')]];closeM();openOrd(id);toast(`${id} создан. Туристу ушла ссылка на приложение.`)}
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){if(!v)return;F.q=v;savedOn=-1;go('orders')}

function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}.`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
/* Навигация: одна колонка слева + нижняя панель на телефоне */
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${BR.logo?`<img src="${BR.logo}" alt="">`:LOGO_I}</span><b class="bname">${esc(BR.n)}</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='flights'&&FLIGHTS.some(f=>f.st!=='ok')?'<em>'+FLIGHTS.filter(f=>f.st!=='ok').length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['orders','Заказы'],['flights','Рейсы'],['push','Push'],['finance','Финансы']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Компас';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();applyBrand();
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('orders')?'':'none';try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: пользователи приложения, заказы и продажи за день, неделю, месяц — с графиками.'],
 ['orders','2 · Заказы: фильтры, сохранённые подборки, массовые действия, Excel.'],
 ['order','3 · Карточка заказа: перелёт, туристы, деньги, документы, комментарии, история изменений.'],
 ['flights','4 · Рейсы: перенос вводится один раз — обновляется везде, туристам уходит push.'],
 ['push','5 · Массовые push по рейсу, дате, направлению, авиакомпании — с превью на телефоне.'],
 ['auto','6 · Автоуведомления: регистрация, оплата, документы, вылет.'],
 ['finance','7 · Финансы: выручка, возвраты, долги туристов и партнёрам.'],
 ['reports','8 · Отчёты в Excel — файл скачивается по-настоящему.'],
 ['audit','9 · Журнал действий: кто, когда, что изменил.'],
 ['brand','10 · Фирменный стиль: цвета и логотип меняются сразу.'],
 ['mobile','11 · Админка с телефона.'],
 ['launch','12 · Стоимость: 2,5 млн, 4–6 недель, 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();applyBrand();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
