/* КВАЛИФИКАЦИЯ — центр повышения квалификации медработников, филиал (Альфия). Демо на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const bar=w=>`<div class="bar"><i style="width:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const said=(q,a)=>`<div class="said"><b>АЛЬФИЯ, 28.11</b><i>«${q}»</i>${a?`<div class="sa">${a}</div>`:''}</div>`;
const tbl=(h,rows)=>`<div class="tw"><table class="t"><thead><tr>${h.map(x=>`<th${x[0]==='>'?' class="r"':''}>${x.replace(/^>/,'')}</th>`).join('')}</tr></thead><tbody>${rows.join('')||'<tr><td colspan="9" class="note">Нет записей по фильтру.</td></tr>'}</tbody></table></div>`;
const kpi=a=>`<div class="kpi">${a.map(x=>`<div><small>${x[0]}</small><b>${x[1]}</b>${x[2]?`<i>${x[2]}</i>`:''}</div>`).join('')}</div>`;

const TODAY=new Date(2026,10,28);
const MON=['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
const dstr=d=>String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+d.getFullYear();
const addY=(d,y)=>new Date(d.getFullYear()+y,d.getMonth(),d.getDate());
const monthsTo=d=>(d.getFullYear()-TODAY.getFullYear())*12+(d.getMonth()-TODAY.getMonth())+(d.getDate()<TODAY.getDate()?-1:0);

const SEC=[
 {k:'own',n:'Руководителю',sub:[['dash','Пульт филиала'],['anal','Охват и аналитика'],['net','Сеть филиалов']]},
 {k:'exp',n:'Возврат слушателей',sub:[['expiring','Истекает срок'],['calls','Обзвон на сегодня'],['orgs','Больницы и поликлиники']]},
 {k:'base',n:'База',sub:[['people','Слушатели'],['person','Карточка слушателя'],['archive','Оцифровка архива']]},
 {k:'sale',n:'Заявки',sub:[['funnel','Воронка'],['wa','WhatsApp'],['mail','Рассылки и роботы']]},
 {k:'edu',n:'Обучение',sub:[['sched','Расписание циклов'],['group','Группа и журнал'],['certs','Сертификаты']]},
 {k:'money',n:'Деньги',sub:[['pay','Оплаты и договоры']]},
 {k:'sys',n:'О системе',sub:[['rights','Роли и права'],['costs','Стоимость и расходы']]}
];
const SECOF={},SUBN={},ALL=[];SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1];ALL.push(x[0])}));
const ROLES={
 'Руководитель филиала':{av:'РФ',n:'Альфия',note:'всё: охват, деньги, сеть, права',s:ALL.slice()},
 'Менеджер / администратор':{av:'МН',n:'Динара',note:'обзвон, база, заявки, WhatsApp, группы, оплаты',s:['expiring','calls','orgs','people','person','archive','funnel','wa','mail','sched','group','certs','pay']},
 'Преподаватель':{av:'ПР',n:'Гульнар Ахметовна',note:'свои группы, журнал, аттестация',s:['sched','group','certs']}
};
let role='Руководитель филиала',cur='dash';

/* справочники */
const SPEC=[['Медсестра','Сестринское дело',72,58000],['Акушерка','Акушерское дело',72,58000],['Фельдшер','Лечебное дело',72,62000],['Лаборант','Лабораторная диагностика',72,60000],['Фармацевт','Фармация',72,56000],['Рентгенлаборант','Рентгенология',108,74000],['Мед. сестра ОРИТ','Анестезиология и реанимация',108,78000],['Зубной врач','Стоматология',72,64000]];
const ORG=[['ОКБ (областная больница)','Уральск','Сейтказина Р. М.',84],['Городская поликлиника № 1','Уральск','Жумабаева А. К.',46],['Городская поликлиника № 3','Уральск','Ким Е. В.',39],['Перинатальный центр','Уральск','Нургалиева С. Б.',52],['Станция скорой помощи','Уральск','Абилов Т. С.',61],['ЦРБ Бурлинского района','Аксай','Утегенова Г. Ж.',44],['ЦРБ Теректинского района','Федоровка','Исмагулова Л. Т.',28],['Частная клиника «Шипагер-Мед»','Уральск','Ли О. А.',19],['Сеть аптек «Дәрі-Сауда»','Уральск','Бекова Н. Р.',23],['Стоматология «Ақ Тіс»','Уральск','Сагинов Д. М.',12]];
const DIST=['Уральск','Аксай','Федоровка','Уральск','Уральск'];
const FN=['Айгуль','Гульнара','Светлана','Динара','Жанар','Елена','Сауле','Мадина','Ольга','Асель','Назира','Татьяна','Айжан','Роза','Камила','Людмила','Индира','Алия','Наталья','Гаухар','Ерлан','Марат','Нурлан','Сергей','Бауыржан'];
const LN=['Ахметова','Сериккызы','Петрова','Жунусова','Ким','Абдрахманова','Иванова','Сагинтаева','Кузнецова','Нурланова','Тулегенова','Смирнова','Каримова','Байжанова','Ермекова','Волкова','Мусина','Оспанова','Белова','Жакупова','Утегенов','Мухамбетов','Сарсенов','Павлов','Касымов'];
/* слушатели: детерминированно */
const PEOPLE=[];(function(){let s=7;const r=n=>{s=(s*9301+49297)%233280;return Math.floor(s/233280*n)};
 for(let i=0;i<84;i++){const fi=r(FN.length);const male=fi>=20;const ln=LN[r(20)+(male?0:0)].replace(/а$/,male?'':'а');
  const last=new Date(2021+r(5)-(i%5===0?1:0),r(12),1+r(27));const sp=r(SPEC.length);const og=r(ORG.length);
  const iin=String(700000000000+((i*7919+r(99999))%300000000000)).slice(0,12);
  PEOPLE.push({id:i,fio:(male?LN[r(20)].replace(/а$/,''):LN[r(20)])+' '+FN[male?fi:fi%20]+' '+(male?'Серикович':['Маратовна','Ахметовна','Петровна','Ерлановна','Болатовна'][r(5)]),iin,sp,org:og,phone:i%6===3?'':'+7 7'+(10+r(80))+' '+(100+r(899))+' '+(10+r(89))+' '+(10+r(89)),cat:['вторая','первая','высшая','без категории'][r(4)],last,bd:new Date(1970+r(30),r(12),1+r(27)),hist:[[addY(last,-5),'Цикл '+SPEC[sp][1]+' · 72 ч'],[last,'Цикл '+SPEC[sp][1]+' · '+SPEC[sp][2]+' ч']],st:''})}})();
/* три «живых» героя */
PEOPLE[0].fio='Ахметова Айгуль Маратовна';PEOPLE[0].last=new Date(2021,11,14);PEOPLE[0].sp=0;PEOPLE[0].org=0;PEOPLE[0].phone='+7 701 482 15 37';
PEOPLE[1].fio='Петрова Светлана Ивановна';PEOPLE[1].last=new Date(2021,8,3);PEOPLE[1].sp=1;PEOPLE[1].org=3;PEOPLE[1].phone='+7 705 117 64 20';
PEOPLE[2].fio='Утегенов Ерлан Серикович';PEOPLE[2].last=new Date(2022,1,22);PEOPLE[2].sp=2;PEOPLE[2].org=4;PEOPLE[2].phone='+7 777 309 88 41';
PEOPLE.forEach(p=>{p.hist=[[addY(p.last,-5),'Цикл «'+SPEC[p.sp][1]+'» · 72 ч'],[p.last,'Цикл «'+SPEC[p.sp][1]+'» · '+SPEC[p.sp][2]+' ч']]});
const exp=p=>addY(p.last,5);
const mleft=p=>monthsTo(exp(p));
const light=p=>{const m=mleft(p);return m<0?'l0':m<=3?'l3':m<=6?'l6':m<=12?'l12':'lok'};
const LTXT={l0:'просрочено',l3:'≤ 3 мес',l6:'≤ 6 мес',l12:'≤ 12 мес',lok:'больше года'};
const byL=l=>PEOPLE.filter(p=>light(p)===l);
const price=p=>SPEC[p.sp][3];

let F={l:'l3',sp:-1,org:-1,dist:''};let SEL={};let selP=0;let TASKS=[];let SENT=[];
const POT=5700; /* потенциальных медработников в зоне филиала (оценка) */

function setF(k,v){F[k]=(k==='sp'||k==='org')?parseInt(v):v;SEL={};build()}
function flt(){return PEOPLE.filter(p=>(F.l==='all'||light(p)===F.l)&&(F.sp<0||p.sp===F.sp)&&(F.org<0||p.org===F.org)&&(!F.dist||ORG[p.org][1]===F.dist)).sort((a,b)=>exp(a)-exp(b))}
function tgSel(i){SEL[i]=!SEL[i];build()}
function selAll(){const L=flt();const all=L.every(p=>SEL[p.id]);L.forEach(p=>SEL[p.id]=!all);build()}
const selList=()=>PEOPLE.filter(p=>SEL[p.id]);
function massWA(){const L=selList();if(!L.length){toast('Отметьте слушателей галочками — или нажмите «выбрать всех».');return}
 const noP=L.filter(p=>!p.phone).length;L.filter(p=>p.phone).forEach(p=>{p.st='напомнили';SENT.unshift([dstr(TODAY),p.fio,'Напоминание о сроке · шаблон','доставлено'])});SEL={};build();
 toast(`WhatsApp-напоминание отправлено <b>${L.length-noP}</b> слушателям шаблоном «Ваш срок повышения квалификации истекает…».${noP?` У ${noP} нет телефона — поставлены в задачу «найти контакт».`:''}`)}
function massCall(){const L=selList();if(!L.length){toast('Отметьте слушателей, кому звонить.');return}L.forEach(p=>{if(!TASKS.find(t=>t.id===p.id))TASKS.push({id:p.id,done:false,res:''});p.st='в обзвоне'});SEL={};build();toast(`<b>${L.length}</b> задач на звонок поставлено менеджеру на сегодня — список в «Обзвон на сегодня».`)}
function massOrg(){const L=selList();if(!L.length){toast('Отметьте слушателей — система сгруппирует их по местам работы.');return}const g={};L.forEach(p=>{g[p.org]=(g[p.org]||0)+1});SEL={};build();
 openM('Группой в организацию','Корпоративные заявки по местам работы',tbl(['Организация','Контакт','>Сотрудников','>Сумма'],Object.keys(g).map(k=>`<tr><td>${esc(ORG[k][0])}</td><td>${esc(ORG[k][2])}</td><td class="r num">${g[k]}</td><td class="r num">${fmt(g[k]*52000)}</td></tr>`))+'<div class="note">Письмо и коммерческое предложение главной медсестре уходят из карточки организации. Цена — корпоративная, −10% от 5 человек.</div>')}
function callRes(i,r){const t=TASKS[i];t.done=true;t.res=r;const p=PEOPLE[t.id];p.st=r==='записан'?'записан в группу':r;if(r==='записан'){if(!DEALS[2].find(x=>x[0]===p.fio))DEALS[2].push([p.fio,SPEC[p.sp][0]+' · '+ORG[p.org][0],0])}build();toast(r==='записан'?`<b>${esc(p.fio)}</b> записан(а) в группу — карточка появилась в воронке на этапе «Запись в группу».`:`Результат звонка сохранён: «${r}». Следующее касание поставлено автоматически.`)}
function openP(i){selP=i;go('person')}

/* воронка */
const STG=['Заявка','Консультация','Запись в группу','Оплата','Обучение','Аттестация','Сертификат'];
let DEALS=[
 [['Жунусова Динара','Медсестра · сайт',1],['Ким Елена','Лаборант · звонок',0],['ГП № 3 · 6 человек','корпоративная',1]],
 [['Оспанова Асель','Фармацевт · WhatsApp',0],['Белова Наталья','Акушерка · напоминание',1]],
 [['Сагинтаева Мадина','Медсестра · напоминание',0],['Скорая помощь · 8 человек','выездной цикл',1]],
 [['Каримова Индира','Зубной врач · счёт выставлен',1],['Ермекова Камила','Медсестра ОРИТ',0]],
 [['Группа МС-11/26 · 18 человек','идёт обучение',0]],
 [['Группа ЛД-10/26 · 12 человек','тест 01.12',0]],
 [['Группа ФМ-10/26 · 14 человек','сертификаты готовы',0]]];
function mv(c,i){if(c>=STG.length-1){toast('Сертификат выдан — через 5 лет слушатель сам вернётся в «Истекает срок».');return}const d=DEALS[c].splice(i,1)[0];DEALS[c+1].push(d);build();toast(`«${esc(d[0])}» → <b>${STG[c+1]}</b>.${c+1===3?' Счёт и договор сформированы автоматически.':''}`)}

/* архив */
let ARC={done:1840,total:4200,form:{fio:'',iin:'',spec:0,date:'2022-03-15',phone:''}};
function setA(k,v){ARC.form[k]=v}
function addArc(){const f=ARC.form;if(!f.fio||!f.iin){toast('Заполните ФИО и ИИН с анкеты.');return}
 const dup=PEOPLE.find(p=>p.iin===f.iin||p.fio.toLowerCase()===f.fio.toLowerCase());
 if(dup){openM('Найден дубль','Такой слушатель уже есть в базе',`<div class="kv"><span>В базе</span><b>${esc(dup.fio)}</b></div><div class="kv"><span>ИИН</span><b class="num">${dup.iin}</b></div><div class="kv"><span>Последнее обучение</span><b>${dstr(dup.last)}</b></div><div class="note">Анкета добавится в историю обучений этой карточки — второй человек не создаётся.</div>`);return}
 const d=new Date(f.date);PEOPLE.push({id:PEOPLE.length,fio:f.fio,iin:f.iin,sp:parseInt(f.spec)||0,org:0,phone:f.phone,cat:'—',last:isNaN(d)?new Date(2022,2,15):d,bd:new Date(1985,0,1),hist:[],st:'из архива'});
 const np=PEOPLE[PEOPLE.length-1];np.hist=[[np.last,'Цикл «'+SPEC[np.sp][1]+'» · из бумажного архива']];ARC.done++;ARC.form={fio:'',iin:'',spec:0,date:'2022-03-15',phone:''};build();
 toast(`Анкета внесена. Срок следующего обучения — <b>${dstr(exp(np))}</b>, слушатель сразу попал в напоминания.`)}
function impXls(){ARC.done=Math.min(ARC.total,ARC.done+620);build();toast('Загружен файл «Архив 2019–2021.xlsx»: 620 строк, 34 дубля склеены с существующими карточками, 51 без телефона — в задачу «найти контакт».')}

/* расписание и группа */
let GR=[['МС-12/26','Сестринское дело · 72 ч',0,'02.12 – 13.12','Гульнар Ахметовна','очно',20,17],['ЛД-12/26','Лабораторная диагностика · 72 ч',3,'07.12 – 18.12','Рахимова С. К.','очно-онлайн',15,9],['АК-12/26','Акушерское дело · 72 ч',1,'09.12 – 20.12','Гульнар Ахметовна','очно',16,6],['СК-01/27','Выездной цикл · Станция скорой помощи',2,'12.01 – 23.01','Абдуллин Р. Т.','выезд в организацию',24,8],['ФМ-01/27','Фармация · 72 ч',4,'19.01 – 30.01','Рахимова С. К.','онлайн',25,4]];
function enroll(i){const g=GR[i];if(g[7]>=g[6]){toast('Группа заполнена — система предложит следующий поток.');return}g[7]++;build();toast(`Слушатель записан в группу <b>${g[0]}</b>. Подтверждение и памятка ушли в WhatsApp.`)}
let JR=[['Ахметова А. М.',[1,1,1,1,0],0],['Сагинтаева М. Е.',[1,1,1,1,1],0],['Жунусова Д. Б.',[1,0,1,1,1],0],['Ким Е. В.',[1,1,1,1,1],0],['Оспанова А. Р.',[1,1,0,1,1],0],['Белова Н. П.',[1,1,1,1,1],0]];
function tgJ(i,d){JR[i][1][d]=JR[i][1][d]?0:1;build()}
function setScore(i,v){JR[i][2]=Math.max(0,Math.min(100,parseInt(v)||0));build()}
let CERTS=[];
function issue(){let n=0;JR.forEach(j=>{const att=j[1].reduce((a,b)=>a+b,0);if(j[2]>=70&&att>=4&&!CERTS.find(c=>c[0]===j[0])){CERTS.push([j[0],'МС-12/26','№ 26-'+(1040+CERTS.length),dstr(TODAY),dstr(addY(TODAY,5))]);n++}});
 build();toast(n?`Выдано сертификатов: <b>${n}</b>. Следующий срок у каждого — <b>${dstr(addY(TODAY,5))}</b>, напоминания на 12/6/3/1 мес уже стоят.`:'Нет слушателей, прошедших аттестацию: нужен балл от 70 и посещаемость от 4 из 5 дней.')}

/* рассылки */
let RB=[['Напоминание за 12 мес','«Через год истекает срок вашего повышения квалификации…»',1],['Напоминание за 6 мес','«Осталось полгода — запишитесь заранее, места в группах ограничены»',1],['Напоминание за 3 мес','«Срок истекает через 3 месяца. Ближайшая группа — …»',1],['Напоминание за 1 мес','«Срок истекает через месяц. Позвонит менеджер»',1],['День рождения','«Поздравляем с днём рождения!»',1],['Праздники (Новый год, Наурыз, 8 марта, День медработника)','поздравление всей базе',1],['После обучения — отзыв','через 3 дня после сертификата',1],['Не дошёл до оплаты','через 2 дня после записи',0]];
function tgRb(i){RB[i][2]=RB[i][2]?0:1;build();toast(`Робот «${esc(RB[i][0])}» ${RB[i][2]?'включён':'выключен'}.`)}
let CH='green';let MC={n:0,kind:'service'};
function setCh(v){CH=v;build()}function setMK(v){MC.kind=v;build()}
function mailCost(n){if(CH==='green')return 5000;const per=MC.kind==='marketing'?75:15;return Math.max(0,n-1500)*per}
function sendNY(){const n=PEOPLE.filter(p=>p.phone).length*17;const c=mailCost(n);SENT.unshift([dstr(TODAY),'Вся база · '+fmt(n)+' контактов','Новогоднее поздравление','в очереди']);build();toast(`Рассылка поставлена в очередь на 31.12, 10:00: <b>${fmt(n)}</b> контактов, канал ${CH==='green'?'Green API':'официальный WhatsApp'} · расход ≈ <b>${tg(c)}</b>.`)}

/* оплаты */
let PAYS=[['Сагинтаева М. Е.','физлицо','МС-12/26',58000,58000,'Kaspi'],['Жунусова Д. Б.','физлицо','МС-12/26',58000,0,'—'],['Каримова И. А.','физлицо','СТ-12/26',64000,32000,'наличные'],['ГП № 3 (6 чел.)','организация','ЛД-12/26',313200,0,'—'],['Станция скорой помощи (8 чел.)','организация','СК-01/27',446400,223200,'безнал'],['Ким Е. В.','физлицо','ЛД-12/26',60000,60000,'Kaspi']];
function payIt(i){const p=PAYS[i];if(p[4]>=p[3]){toast('Оплачено полностью.');return}p[4]=p[3];p[5]=p[1]==='организация'?'безнал':'Kaspi';build();toast(`Оплата от «${esc(p[0])}» отмечена — слушатель допущен к обучению, акт сформирован.`)}

const SC={};
SC.dash=()=>{const ok=PEOPLE.filter(p=>mleft(p)>12).length;const soon=PEOPLE.filter(p=>mleft(p)>=0&&mleft(p)<=12).length;const over=byL('l0').length;
 const months=[];for(let m=0;m<12;m++){const n=PEOPLE.filter(p=>mleft(p)===m).length;months.push(n)}const mx=Math.max(...months,1);
 return said('Нам нужно аналитическое, которое будет подсказывать, у кого заканчивается… такой сортировщик, который будет подводить тех, кому обзванивать.','Пульт собирает охват, истекающие сроки и деньги, которые придут, если не упустить людей.')+
 kpi([['в базе','<span class="num">'+fmt(PEOPLE.length*17)+'</span>','из них с телефоном 83%'],['охват зоны',pct(PEOPLE.length*17,POT)+'%','из ≈ '+fmt(POT)+' медработников зоны'],['истекает ≤ 12 мес',fmt(soon*17),'ожидаемо '+String(Math.round(soon*17*58000/1e5)/10).replace('.',',')+' млн ₸'],['просрочено',fmt(over*17),'вернуть в первую очередь'],['слушателей в ноябре','58','план 60']])+
 `<div class="g31"><div class="box"><h3>Истекает по месяцам <small>человек · ожидаемая выручка при записи</small></h3><div class="mbar">${months.map(n=>`<div style="height:${Math.max(4,n/mx*100)}%"><span>${n*17}</span></div>`).join('')}</div><div class="mlab">${months.map((n,m)=>{const d=new Date(2026,10+m,1);return`<span>${MON[d.getMonth()]}</span>`}).join('')}</div>
 <div class="note">Декабрь — январь: ${fmt((months[0]+months[1])*17)} человек ≈ ${tg((months[0]+months[1])*17*58000)}. <a onclick="setF('l','l3');go('expiring')" style="cursor:pointer;color:var(--acc)">Открыть список →</a></div></div>
 <div class="box"><h3>Сегодня</h3><div class="kv"><span>Позвонить</span><b>${TASKS.filter(t=>!t.done).length||12}</b></div><div class="kv"><span>Напоминаний уйдёт роботом</span><b>47</b></div><div class="kv"><span>Не оплатили после записи</span><b>${PAYS.filter(p=>p[4]<p[3]).length}</b></div><div class="kv"><span>Старт группы МС-12/26</span><b>02.12</b></div><div class="kv"><span>Без телефона в базе</span><b>${PEOPLE.filter(p=>!p.phone).length*17}</b></div>
 <div class="btns"><button class="bt" onclick="go('calls')">К обзвону</button><button class="bt o" onclick="go('orgs')">Больницы</button></div></div></div>
 <div class="g3"><div class="box"><h3>Охват</h3>${bar(pct(ok+soon,PEOPLE.length))}<div class="note">${pct(ok,PEOPLE.length)}% базы — в сроке, ${pct(soon,PEOPLE.length)}% — подходят, ${pct(over,PEOPLE.length)}% — просрочены.</div></div>
 <div class="box"><h3>Напоминание → запись</h3><b class="num" style="font-size:22px">31%</b><div class="note">из 412 напоминаний за октябрь записались 128.</div></div>
 <div class="box"><h3>Выручка ноябрь</h3><b class="num" style="font-size:22px">3,42 млн ₸</b><div class="note">физлица 61% · организации 39%.</div></div></div>`};

SC.expiring=()=>{const L=flt();const ns=selList().length;
 return said('Медицинские работники забывают о том, что им нужно сертификат, обучение пройти. Это бы классно, если бы это всё можно было одним движением отправить.','Светофор по сроку → фильтр → галочки → одно действие на всех.')+
 `<div class="lights">${['l0','l3','l6','l12','all'].map(l=>`<div class="${F.l===l?'on':''}" style="border-top-color:${{l0:'var(--bad)',l3:'#e0712e',l6:'var(--y2)',l12:'var(--teal)',all:'var(--ink)'}[l]}" onclick="setF('l','${l}')"><small>${l==='all'?'вся база':LTXT[l]}</small><b>${(l==='all'?PEOPLE.length:byL(l).length)*17}</b></div>`).join('')}</div>
 <div class="flt"><select class="inp" onchange="setF('sp',this.value)"><option value="-1">Все специальности</option>${SPEC.map((s,i)=>`<option value="${i}" ${F.sp===i?'selected':''}>${s[0]}</option>`).join('')}</select>
 <select class="inp" onchange="setF('org',this.value)"><option value="-1">Все организации</option>${ORG.map((o,i)=>`<option value="${i}" ${F.org===i?'selected':''}>${esc(o[0])}</option>`).join('')}</select>
 <select class="inp" onchange="setF('dist',this.value)"><option value="">Все районы</option>${['Уральск','Аксай','Федоровка'].map(d=>`<option ${F.dist===d?'selected':''}>${d}</option>`).join('')}</select></div>
 <div class="box"><h3>Кого возвращать <small>показано ${L.length} из ${L.length*17} · выбрано ${ns}</small></h3>
 <div class="btns" style="margin:0 0 10px"><button class="bt o s" onclick="selAll()">Выбрать всех</button><button class="bt a s" onclick="massWA()">WhatsApp-напоминание</button><button class="bt s" onclick="massCall()">Задача на звонок</button><button class="bt o s" onclick="massOrg()">Группой в организацию</button></div>
 ${tbl(['','Срок','Слушатель','Специальность','Место работы','Телефон','>Истекает','Статус'],L.slice(0,30).map(p=>`<tr class="${SEL[p.id]?'hl':''}"><td><input type="checkbox" ${SEL[p.id]?'checked':''} onclick="tgSel(${p.id})" aria-label="выбрать"></td><td><span class="lt ${light(p)}"></span>${LTXT[light(p)]}</td><td><a onclick="openP(${p.id})" style="cursor:pointer"><b>${esc(p.fio)}</b></a></td><td>${SPEC[p.sp][0]}</td><td>${esc(ORG[p.org][0])}</td><td class="num">${p.phone||'<span class="tag bad">нет</span>'}</td><td class="r num">${dstr(exp(p))}</td><td>${p.st?`<span class="tag tl">${esc(p.st)}</span>`:''}</td></tr>`))}
 <div class="note">В демо показана выборка; на настоящих данных — вся база филиала. Сортировка — по ближайшему сроку.</div></div>`};

SC.calls=()=>{if(!TASKS.length)[0,1,2,5,7,9].forEach(i=>TASKS.push({id:i,done:false,res:''}));
 return said('Чтобы мы им обзванивали, а не за сообщение написали «Здравствуйте, как ваши дела».','Менеджер видит список «кому звонить сегодня» с причиной и сценарием разговора; результат — одной кнопкой.')+
 `<div class="g31"><div class="box"><h3>Обзвон на ${dstr(TODAY)} <small>${TASKS.filter(t=>t.done).length} из ${TASKS.length} выполнено</small></h3>${tbl(['Слушатель','Телефон','Почему звоним','Результат'],TASKS.map((t,i)=>{const p=PEOPLE[t.id];return`<tr><td><b>${esc(p.fio)}</b><br><small class="note">${SPEC[p.sp][0]} · ${esc(ORG[p.org][0])}</small></td><td class="num">${p.phone||'найти контакт'}</td><td>срок до ${dstr(exp(p))}<br><span class="lt ${light(p)}"></span>${LTXT[light(p)]}</td><td>${t.done?`<span class="tag ok">${esc(t.res)}</span>`:`<button class="bt s" onclick="callRes(${i},'записан')">Записан</button> <button class="bt o s" onclick="callRes(${i},'перезвонить')">Перезвонить</button> <button class="bt o s" onclick="callRes(${i},'не дозвонились')">Нет ответа</button>`}</td></tr>`}))}</div>
 <div class="box"><h3>Сценарий звонка</h3><div class="note" style="margin-top:0">1. Представиться, назвать центр.<br>2. «У вас срок повышения квалификации по специальности … истекает …».<br>3. Предложить ближайшую группу и формат (очно / онлайн).<br>4. Если работодатель оплачивает — взять контакт главной медсестры.<br>5. Записать — подтверждение уйдёт в WhatsApp само.</div>
 <div class="kv" style="margin-top:10px"><span>Звонок из системы с записью</span><b>опция, IP-телефония</b></div><div class="kv"><span>Со своего телефона</span><b>отметка результата вручную</b></div></div></div>`};

SC.orgs=()=>{const rows=ORG.map((o,i)=>{const L=PEOPLE.filter(p=>p.org===i);const soon=L.filter(p=>mleft(p)<=6).length;return{o,i,n:o[3],soon:soon*3+1}}).sort((a,b)=>b.soon-a.soon);
 return said('Мы же знаем, где они работают — можно и прийти к ним.','По месту работы видно, где истекает у многих сразу: выездной цикл или корпоративная заявка вместо десятков звонков.')+
 `<div class="box"><h3>Больницы и поликлиники зоны филиала <small>сотрудников в базе и у кого истекает ≤ 6 мес</small></h3>${tbl(['Организация','Город','Контакт (гл. медсестра / HR)','>В базе','>Истекает ≤ 6 мес','Предложение',''],rows.map(r=>`<tr${r.soon>=8?' class="hl"':''}><td><b>${esc(r.o[0])}</b></td><td>${r.o[1]}</td><td>${esc(r.o[2])}</td><td class="r num">${r.n}</td><td class="r num">${r.soon}</td><td>${r.soon>=8?'<span class="tag warn">выездной цикл</span>':'<span class="tag">корп. заявка</span>'}</td><td><button class="bt s" onclick="orgOffer(${r.i},${r.soon})">КП в WhatsApp</button></td></tr>`))}
 <div class="note">Выездной цикл — группа от 12 человек обучается на базе организации, преподаватель выезжает. Скидка 10% от 5 человек.</div></div>`};
function orgOffer(i,n){toast(`Коммерческое предложение на <b>${n}</b> сотрудников отправлено контакту «${esc(ORG[i][2])}» (${esc(ORG[i][0])}): список с датами истечения, ближайшие даты, цена со скидкой.`)}

SC.people=()=>`<div class="box"><h3>Слушатели <small>${PEOPLE.length*17} в базе · показаны первые 30</small></h3>${tbl(['ФИО','ИИН','Специальность','Категория','Место работы','Последнее обучение','>Следующий срок'],PEOPLE.slice(0,30).map(p=>`<tr class="lk" onclick="openP(${p.id})"><td><b>${esc(p.fio)}</b></td><td class="num">${p.iin}</td><td>${SPEC[p.sp][0]}</td><td>${p.cat}</td><td>${esc(ORG[p.org][0])}</td><td class="num">${dstr(p.last)}</td><td class="r num"><span class="lt ${light(p)}"></span>${dstr(exp(p))}</td></tr>`))}
 <div class="btns"><button class="bt" onclick="go('archive')">+ Внести из анкеты</button><button class="bt o" onclick="impXls()">Импорт Excel</button></div></div>`;

SC.person=()=>{const p=PEOPLE[selP]||PEOPLE[0];const o=ORG[p.org];
 return `<div class="g31"><div><div class="box"><h3>${esc(p.fio)} <small>${SPEC[p.sp][0]} · ${p.cat} категория</small></h3>
 <div class="g2"><div><div class="kv"><span>ИИН</span><b class="num">${p.iin}</b></div><div class="kv"><span>Телефон</span><b class="num">${p.phone||'—'}</b></div><div class="kv"><span>Дата рождения</span><b class="num">${dstr(p.bd)}</b></div></div>
 <div><div class="kv"><span>Место работы</span><b>${esc(o[0])}</b></div><div class="kv"><span>Город</span><b>${o[1]}</b></div><div class="kv"><span>Кто оплачивает</span><b>${p.id%3?'сам':'работодатель'}</b></div></div></div></div>
 <div class="box"><h3>История обучений</h3>${tbl(['Дата','Цикл','Сертификат'],p.hist.map((h,i)=>`<tr><td class="num">${dstr(h[0])}</td><td>${esc(h[1])}</td><td class="num">№ ${21+i}-${400+p.id}</td></tr>`))}</div>
 <div class="box"><h3>Лента касаний</h3><div class="kv"><span>${dstr(addY(exp(p),-1))}</span><b>Робот: напоминание за 12 мес · доставлено</b></div><div class="kv"><span>${dstr(new Date(2026,9,2))}</span><b>Звонок менеджера · «перезвонить после отпуска»</b></div><div class="kv"><span>${dstr(new Date(2026,10,20))}</span><b>WhatsApp: «Пришлите расписание на декабрь»</b></div></div></div>
 <div><div class="cert"><h4>Следующий срок</h4><b class="num" style="font-size:24px">${dstr(exp(p))}</b><div style="margin-top:6px"><span class="lt ${light(p)}"></span>${LTXT[light(p)]}</div><div class="note">Рассчитан от последнего обучения + 5 лет. Напоминания встают автоматически.</div></div>
 <div class="box" style="margin-top:16px"><h3>Действия</h3><div class="btns" style="margin-top:0"><button class="bt a" onclick="pWA(${p.id})">Напомнить в WhatsApp</button><button class="bt" onclick="pEnroll(${p.id})">Записать в группу</button><button class="bt o" onclick="pCall(${p.id})">Задача на звонок</button></div></div>
 <div class="box"><h3>Другие слушатели</h3>${[0,1,2].filter(i=>i!==p.id).map(i=>`<div class="kv"><a onclick="openP(${i})" style="cursor:pointer">${esc(PEOPLE[i].fio)}</a><span class="num">${dstr(exp(PEOPLE[i]))}</span></div>`).join('')}</div></div></div>`};
function pWA(i){const p=PEOPLE[i];if(!p.phone){toast('Телефона нет — задача «найти контакт» поставлена менеджеру.');return}p.st='напомнили';SENT.unshift([dstr(TODAY),p.fio,'Напоминание о сроке','доставлено']);toast(`Напоминание отправлено: «${esc(p.fio.split(' ')[1])}, срок вашего повышения квалификации — ${dstr(exp(p))}. Ближайшая группа — 02.12. Записать вас?»`)}
function pEnroll(i){const p=PEOPLE[i];const gi=GR.findIndex(g=>g[2]===p.sp);if(gi<0){toast('Ближайшей группы по специальности нет — система предложит открыть набор.');return}enroll(gi);p.st='записан в группу'}
function pCall(i){if(!TASKS.find(t=>t.id===i))TASKS.push({id:i,done:false,res:''});PEOPLE[i].st='в обзвоне';toast('Задача на звонок поставлена на сегодня.')}

SC.archive=()=>{const f=ARC.form;return said('У нас в архиве… на листочке всё, заявление подшито, а электронно есть просто фамилии, дата обучения.','Оцифровываем архив: Excel из «Эрмы» грузится сразу, бумажные анкеты вносятся формой с проверкой дублей.')+
 `<div class="box"><h3>Прогресс оцифровки <small>${fmt(ARC.done)} из ${fmt(ARC.total)} анкет</small></h3><div class="prog"><i style="width:${pct(ARC.done,ARC.total)}%"></i></div><div class="note">${pct(ARC.done,ARC.total)}% · при 60 анкетах в день архив будет внесён за ${Math.ceil((ARC.total-ARC.done)/60)} рабочих дней.</div></div>
 <div class="g2"><div class="box"><h3>Внести анкету</h3>
 <label class="note">ФИО</label><input class="inp" value="${esc(f.fio)}" oninput="setA('fio',this.value)" placeholder="Фамилия Имя Отчество">
 <label class="note">ИИН</label><input class="inp" value="${esc(f.iin)}" oninput="setA('iin',this.value)" placeholder="12 цифр">
 <label class="note">Специальность</label><select class="inp" onchange="setA('spec',this.value)">${SPEC.map((s,i)=>`<option value="${i}">${s[0]}</option>`).join('')}</select>
 <label class="note">Дата последнего обучения</label><input class="inp" type="date" value="${f.date}" onchange="setA('date',this.value)">
 <label class="note">Телефон</label><input class="inp" value="${esc(f.phone)}" oninput="setA('phone',this.value)" placeholder="+7 7…">
 <div class="btns"><button class="bt" onclick="addArc()">Сохранить</button><button class="bt o" onclick="ARC.form={fio:'Ахметова Айгуль Маратовна',iin:'${PEOPLE[0].iin}',spec:0,date:'2021-12-14',phone:''};addArc()">Проверить дубль на примере</button></div></div>
 <div class="box"><h3>Загрузка файлов</h3><div class="kv"><span>Выгрузка из базы «Эрма» (ФИО, даты)</span><b>Excel / CSV</b></div><div class="kv"><span>Скан анкеты</span><b>фото в карточку</b></div><div class="kv"><span>Склейка дублей</span><b>по ИИН и ФИО</b></div><div class="kv"><span>Без телефона</span><b>в задачу «найти контакт»</b></div>
 <div class="btns"><button class="bt" onclick="impXls()">Загрузить «Архив 2019–2021.xlsx»</button></div></div></div>`};

SC.funnel=()=>said('Раньше сами приходили своими ножками, сейчас всё удалённо, не хотят ходить — хотят быстро.','Заявки с сайта, WhatsApp и звонков — в одной воронке; карточка двигается кнопкой.')+
 `<div class="kan">${STG.map((s,c)=>`<div class="col"><h4>${s}<span>${DEALS[c].length}</span></h4>${DEALS[c].map((d,i)=>`<div class="dl ${d[2]?'hot':''}" onclick="mv(${c},${i})"><b>${esc(d[0])}</b>${esc(d[1])}<div class="note" style="margin-top:4px">→ дальше</div></div>`).join('')}</div>`).join('')}</div>
 <div class="note">Клик по карточке — следующий этап. После «Сертификата» человек через 5 лет сам попадает в «Истекает срок».</div>
 <div class="box" style="margin-top:16px"><h3>Откуда заявки за ноябрь</h3>${tbl(['Источник','>Заявок','>Записались','>Конверсия'],[['Напоминание роботом',96,34],['Обзвон по сроку',61,22],['WhatsApp сами',38,15],['Сайт',21,6],['Корпоративные (организации)',9,7]].map(r=>`<tr><td>${r[0]}</td><td class="r num">${r[1]}</td><td class="r num">${r[2]}</td><td class="r num">${pct(r[2],r[1])}%</td></tr>`))}</div>`;

SC.wa=()=>`<div class="g2"><div class="phone"><div class="ph">WhatsApp · Петрова Светлана</div>
 <div class="bub me">Светлана Ивановна, здравствуйте! Срок вашего повышения квалификации по акушерскому делу — ${dstr(exp(PEOPLE[1]))}. Ближайшая группа — 09.12, очно. Записать вас?</div>
 <div class="bub">Здравствуйте! А онлайн можно? Я на смене через сутки</div>
 <div class="bub me">Да, есть очно-онлайн формат: лекции онлайн, практика 2 дня. Стоимость 58 000 ₸, можно Kaspi.</div>
 <div class="bub">Записывайте, спасибо</div>
 <div class="bub me">Готово. Группа АК-12/26, старт 09.12. Пришлю ссылку на оплату и памятку.</div></div>
 <div><div class="box"><h3>Как работает WhatsApp в системе</h3><div class="kv"><span>Переписка</span><b>в карточке слушателя</b></div><div class="kv"><span>Новый номер написал</span><b>создаётся заявка</b></div><div class="kv"><span>Шаблоны</span><b>напоминание, запись, оплата</b></div><div class="kv"><span>Массовые рассылки</span><b>раздел «Рассылки и роботы»</b></div>
 <div class="btns"><button class="bt" onclick="pWA(1)">Отправить шаблон</button><button class="bt o" onclick="pEnroll(1)">Записать в группу</button></div></div>
 ${said('Говорят, что WhatsApp блокируют, что нельзя много сообщений одновременно отправлять.','Ожидаемые сообщения (напоминание о сроке, подтверждение записи) — через Green API, 5 000 ₸/мес. Массовые и маркетинговые — через официальный WhatsApp, там блокировок нет.')}</div></div>`;

SC.mail=()=>{const n=PEOPLE.filter(p=>mleft(p)>=0&&mleft(p)<=3).length*17;const c=mailCost(n);
 return `<div class="g2"><div class="box"><h3>Роботы <small>срабатывают сами</small></h3>${RB.map((r,i)=>`<div class="kv"><span><b>${esc(r[0])}</b><br><small class="note">${esc(r[1])}</small></span><button class="bt s ${r[2]?'':'o'}" onclick="tgRb(${i})">${r[2]?'включён':'выключен'}</button></div>`).join('')}</div>
 <div class="box"><h3>Канал и стоимость рассылки</h3>
 <label class="note">Канал</label><select class="inp" onchange="setCh(this.value)"><option value="green" ${CH==='green'?'selected':''}>Green API — 5 000 ₸/мес, без лимита (ожидаемые сообщения)</option><option value="waba" ${CH==='waba'?'selected':''}>Официальный WhatsApp — 1 500 бесплатно, далее за сообщение</option></select>
 <label class="note">Тип сообщения</label><select class="inp" onchange="setMK(this.value)"><option value="service" ${MC.kind==='service'?'selected':''}>Сервисное: напоминание о сроке (≈15 ₸)</option><option value="marketing" ${MC.kind==='marketing'?'selected':''}>Маркетинговое: акция, поздравление (≈75 ₸)</option></select>
 <div class="kv" style="margin-top:10px"><span>Напоминание «≤ 3 мес»</span><b class="num">${fmt(n)} контактов</b></div><div class="kv"><span>Расход в месяц</span><b class="num">${tg(c)}</b></div>
 <div class="note">${CH==='green'?'Риск: при жалобах «спам» номер могут заблокировать — для массовых акций переключаемся на официальный канал.':'Без блокировок. Первые 1 500 сервисных сообщений в месяц — бесплатно.'}</div>
 <div class="btns"><button class="bt a" onclick="sendNY()">Поставить новогоднюю рассылку</button></div></div></div>
 <div class="box"><h3>Журнал доставки</h3>${tbl(['Дата','Кому','Сообщение','Статус'],SENT.concat([['27.11.2026','Ким Елена Викторовна','Напоминание за 3 мес','прочитано'],['27.11.2026','Ермекова Камила','Подтверждение записи МС-12/26','доставлено'],['26.11.2026','Байжанова Роза','День рождения','прочитано'],['26.11.2026','+7 701 … 44','Напоминание за 1 мес','не доставлено — номер не в WhatsApp']]).slice(0,10).map(r=>`<tr><td class="num">${r[0]}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${r[3].indexOf('не ')===0?`<span class="tag bad">${r[3]}</span>`:`<span class="tag ok">${r[3]}</span>`}</td></tr>`))}</div>`};

SC.sched=()=>`<div class="box"><h3>Циклы и группы <small>декабрь — январь</small></h3>${tbl(['Группа','Цикл','Даты','Преподаватель','Формат','Заполнено',''],GR.map((g,i)=>`<tr><td class="num"><b>${g[0]}</b></td><td>${esc(g[1])}</td><td class="num">${g[3]}</td><td>${esc(g[4])}</td><td><span class="tag ${g[5]==='онлайн'?'tl':''}">${g[5]}</span></td><td style="min-width:120px">${g[7]} / ${g[6]}${bar(pct(g[7],g[6]))}</td><td><button class="bt s" onclick="enroll(${i})">Записать</button></td></tr>`))}
 <div class="note">Онлайн-занятия — по ссылке (Zoom / Meet). Собственная видеоплатформа — следующим этапом.</div></div>
 <div class="g3"><div class="box"><h3>Нагрузка преподавателей</h3><div class="kv"><span>Гульнар Ахметовна</span><b>144 ч</b></div><div class="kv"><span>Рахимова С. К.</span><b>144 ч</b></div><div class="kv"><span>Абдуллин Р. Т.</span><b>72 ч · выезд</b></div></div>
 <div class="box"><h3>Аудитории</h3><div class="kv"><span>Ауд. 1 (30 мест)</span><b>занята до 13.12</b></div><div class="kv"><span>Ауд. 2 (18 мест)</span><b>свободна 21.12+</b></div><div class="kv"><span>Симуляционный класс</span><b>по графику</b></div></div>
 <div class="box"><h3>Набор</h3><div class="note" style="margin-top:0">Группа открывается от 10 человек. Пока набирается — система подсказывает, кому из «Истекает срок» по этой специальности предложить.</div><div class="btns"><button class="bt o" onclick="setF('sp','0');go('expiring')">Медсёстры с истекающим сроком</button></div></div></div>`;

SC.group=()=>`<div class="steps"><div class="dn">Запись</div><div class="dn">Оплата</div><div class="on">Обучение</div><div>Аттестация</div><div>Сертификат</div></div>
 <div class="box"><h3>Группа МС-12/26 · Сестринское дело · 72 ч <small>преподаватель Гульнар Ахметовна</small></h3>${tbl(['Слушатель','Пн','Вт','Ср','Чт','Пт','>Тест, балл','Допуск'],JR.map((j,i)=>`<tr><td><b>${esc(j[0])}</b></td>${j[1].map((d,k)=>`<td><button class="bt s ${d?'':'o'}" onclick="tgJ(${i},${k})">${d?'был':'нет'}</button></td>`).join('')}<td class="r"><input class="inp qty num" style="width:70px;text-align:right" value="${j[2]||''}" placeholder="0" onchange="setScore(${i},this.value)"></td><td>${j[2]>=70&&j[1].reduce((a,b)=>a+b,0)>=4?'<span class="tag ok">сдал</span>':'<span class="tag">—</span>'}</td></tr>`))}
 <div class="btns"><button class="bt o" onclick="JR.forEach((j,i)=>{j[2]=[88,92,74,95,66,81][i]});build()">Внести результаты теста</button><button class="bt a" onclick="issue()">Выдать сертификаты</button></div>
 <div class="note">Допуск к сертификату: посещаемость от 4 из 5 дней и итоговый тест от 70 баллов.</div></div>`;

SC.certs=()=>`<div class="g31"><div class="box"><h3>Выданные сертификаты <small>${CERTS.length+3}</small></h3>${tbl(['Слушатель','Группа','Номер','Выдан','>Следующий срок'],CERTS.concat([['Абдрахманова Ж. С.','ФМ-10/26','№ 26-1031','21.11.2026','21.11.2031'],['Тулегенова Н. А.','ФМ-10/26','№ 26-1032','21.11.2026','21.11.2031'],['Смирнова Т. В.','ЛД-10/26','№ 26-1027','14.11.2026','14.11.2031']]).map(c=>`<tr><td><b>${esc(c[0])}</b></td><td class="num">${c[1]}</td><td class="num">${c[2]}</td><td class="num">${c[3]}</td><td class="r num">${c[4]}</td></tr>`))}
 <div class="btns"><button class="bt" onclick="go('group')">К журналу группы</button></div></div>
 <div class="cert"><h4>Сертификат о повышении квалификации</h4><div class="note">№ 26-1031 · 72 часа</div><div style="margin:10px 0"><b>Абдрахманова Жанар Сериковна</b><br>«Фармация»</div><div class="kv"><span>Выдан</span><b>21.11.2026</b></div><div class="kv"><span>Действует до</span><b>21.11.2031</b></div><div class="note">Шаблон печатается из системы; копия — в карточке слушателя и в WhatsApp.</div></div></div>`;

SC.pay=()=>{const due=PAYS.reduce((a,p)=>a+p[3]-p[4],0);
 return kpi([['выставлено','<span class="num">'+fmt(PAYS.reduce((a,p)=>a+p[3],0))+'</span>','₸ по декабрьским группам'],['оплачено','<span class="num">'+fmt(PAYS.reduce((a,p)=>a+p[4],0))+'</span>','₸'],['долг','<span class="num">'+fmt(due)+'</span>','₸'],['физлица','4',''],['организации','2','договоры, безнал']])+
 `<div class="box"><h3>Оплаты и договоры</h3>${tbl(['Плательщик','Тип','Группа','>Сумма','>Оплачено','Способ',''],PAYS.map((p,i)=>`<tr${p[4]<p[3]?' class="hl"':''}><td><b>${esc(p[0])}</b></td><td>${p[1]}</td><td class="num">${p[2]}</td><td class="r num">${fmt(p[3])}</td><td class="r num">${fmt(p[4])}</td><td>${p[5]}</td><td>${p[4]<p[3]?`<button class="bt s" onclick="payIt(${i})">Отметить оплату</button>`:'<span class="tag ok">оплачено</span>'}</td></tr>`))}
 <div class="note">Для организации — договор, счёт и акт из шаблона; для физлица — договор-оферта и ссылка на оплату Kaspi.</div></div>`};

SC.anal=()=>{const bySp=SPEC.map((s,i)=>{const L=PEOPLE.filter(p=>p.sp===i);return[s[0],L.length*17,L.filter(p=>mleft(p)<=12&&mleft(p)>=0).length*17,L.filter(p=>mleft(p)<0).length*17]});
 return said('Не охвачены 75 процентов.','Охват считаем от числа медработников зоны филиала: кто в сроке, кто подходит, кто ушёл к другим или просрочил.')+
 kpi([['охват зоны','25% → 41%','цель на 2027'],['напоминание → запись','31%','октябрь'],['повторно вернулись','58%','из тех, у кого истёк срок в 2026'],['средний чек','59 200 ₸',''],['доля корпоративных','39%','выручки']])+
 `<div class="g2"><div class="box"><h3>По специальностям</h3>${tbl(['Специальность','>В базе','>Истекает ≤ 12 мес','>Просрочено'],bySp.map(r=>`<tr><td>${r[0]}</td><td class="r num">${r[1]}</td><td class="r num">${r[2]}</td><td class="r num">${r[3]}</td></tr>`))}</div>
 <div class="box"><h3>По организациям <small>доля сотрудников, прошедших у нас</small></h3>${ORG.slice(0,7).map((o,i)=>{const v=[62,48,35,71,22,18,40][i];return`<div class="kv"><span>${esc(o[0])}</span><b class="num">${v}%</b></div>${bar(v)}`}).join('')}<div class="note">Низкая доля — повод для выездного цикла или переговоров с главной медсестрой.</div></div></div>`};

SC.net=()=>`<div class="box"><h3>Сеть филиалов <small>задел на будущее</small></h3>${tbl(['Филиал','Страна','Статус','Подключение'],[['Уральский','Казахстан','<span class="tag ok">в работе</span>','стандартный пакет'],['Атырауский','Казахстан','<span class="tag">не подключён</span>','50% стоимости пакета'],['Актюбинский','Казахстан','<span class="tag">не подключён</span>','50% стоимости пакета'],['Алматинский','Казахстан','<span class="tag">не подключён</span>','50% стоимости пакета'],['Бишкекский','Кыргызстан','<span class="tag">не подключён</span>','50% стоимости пакета'],['Самаркандский','Узбекистан','<span class="tag">не подключён</span>','50% стоимости пакета']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`))}
 <div class="note">Каждый филиал — своя копия системы на отдельном сервере: свои данные, свои права. Если два филиала заходят вместе — стоимость пакета делится пополам.</div></div>
 ${said('Если всё будет хорошо, то не только я — другие филиалы тоже могут потянуться.','Показываем результат Уральска на цифрах охвата — и подключаем следующих.')}`;

SC.rights=()=>`<div class="box"><h3>Кто что видит</h3>${tbl(['Раздел','Руководитель','Менеджер','Преподаватель'],[['Пульт, охват, деньги','✓','—','—'],['Истекает срок, обзвон','✓','✓','—'],['Слушатели, архив','✓','✓','только свои группы'],['Воронка, WhatsApp, рассылки','✓','✓','—'],['Расписание, журнал, сертификаты','✓','✓','✓'],['Оплаты и договоры','✓','✓','—'],['Сеть филиалов, права','✓','—','—']].map(r=>`<tr>${r.map((c,i)=>`<td>${i?c:'<b>'+c+'</b>'}</td>`).join('')}</tr>`))}
 <div class="note">Каждый действует под своим логином; журнал фиксирует, кто что изменил. Персональные данные (ИИН, телефоны) — только на вашем сервере.</div></div>`;

SC.costs=()=>`<div class="g2"><div class="box"><h3>Стоимость разработки <small>подробно — в КП</small></h3><div class="kv"><span>Стандартный пакет для одного филиала (всё, что в демо)</span><b class="num">2 000 000 ₸</b></div><div class="kv"><span>Срок</span><b>4–6 недель</b></div><div class="kv"><span>Оплата</span><b class="num">10 / 45 / 45</b></div><div class="kv"><span>Подписка</span><b class="num">0 ₸</b></div><div class="kv"><span>Сопровождение</span><b>3 мес включено</b></div><div class="kv"><span>Следующий филиал</span><b>50% пакета</b></div><div class="kv"><span>Два филиала вместе</span><b>пакет пополам</b></div></div>
 <div class="box"><h3>Расходы провайдерам в месяц</h3><div class="kv"><span>WhatsApp через Green API</span><b class="num">5 000 ₸</b></div><div class="kv"><span>или официальный WhatsApp</span><b>1 500 бесплатно, далее 15–75 ₸</b></div><div class="kv"><span>Сервер</span><b>0 ₸ до 10 ГБ, далее ≈ 5 $</b></div><div class="kv"><span>Домен</span><b>5–10 тыс. ₸ в год</b></div><div class="kv"><span>IP-телефония (опция)</span><b>от 25 000 ₸</b></div></div></div>`;

function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${v.av}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');document.getElementById('rsel').innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель филиала';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');document.getElementById('rsel').value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;document.getElementById('rsel').value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function goSec(k){const S=SEC.find(x=>x.k===k);const f=S.sub.find(x=>allowed(x[0]));if(f)go(f[0])}
function buildRail(){const vis=SEC.filter(s=>s.sub.some(x=>allowed(x[0])));const badge={expiring:byL('l0').length*17,calls:TASKS.filter(t=>!t.done).length||''};
 document.getElementById('rail').innerHTML=vis.map(s=>`<div class="ri ${s.k===SECOF[cur]?'on':''}" onclick="goSec('${s.k}')">${s.n}</div>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="sx ${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${badge[x[0]]?`<i>${badge[x[0]]}</i>`:''}</a>`).join('')).join('');
 document.getElementById('today').innerHTML=`${dstr(TODAY)} · Уральский филиал · истекает ≤ 3 мес: <b>${byL('l3').length*17}</b> · просрочено: <b>${byL('l0').length*17}</b>`;
 document.getElementById('crumb').innerHTML=`${esc(SEC.find(x=>x.k===SECOF[cur]).n)} / <b>${esc(SUBN[cur])}</b> · ${esc(role)}, ${esc(ROLES[role].n)}`}
function build(){if(!allowed(cur))cur=ROLES[role].s[0];buildRail();document.getElementById('ttl').textContent=SUBN[cur];document.getElementById('content').innerHTML=SC[cur]();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль.');return}cur=k;document.getElementById('side').classList.remove('open');build();window.scrollTo(0,0)}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6000)}
const TOUR=[['dash','1 · Пульт: охват и сколько истекает по месяцам.'],['expiring','2 · Истекает срок: светофор, фильтр, одно действие на всех.'],['calls','3 · Обзвон на сегодня с результатом в один клик.'],['orgs','4 · Больницы: выездной цикл вместо десятков звонков.'],['archive','5 · Оцифровка бумажного архива с проверкой дублей.'],['funnel','6 · Воронка от заявки до сертификата.'],['mail','7 · Роботы-напоминания и цена рассылки по каналам.'],['sched','8 · Расписание циклов и запись.'],['group','9 · Журнал, тест, выдача сертификатов.'],['anal','10 · Охват по специальностям и организациям.'],['net','11 · Подключение других филиалов.']];
let ti=-1,tRun=false;function tour(){if(tRun){tRun=false;return}tRun=true;ti=-1;step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){tRun=false;toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Руководитель филиала');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false}
(function(){renderRoles();document.getElementById('rsel').addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();tRun=false}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
