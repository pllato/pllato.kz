/* ИРБИС ДЕВЕЛОПМЕНТ — аренда коммерческих помещений (Алмас). Демо на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const bar=w=>`<div class="bar"><i style="width:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const said=(q,a)=>`<div class="said"><b>АЛМАС, 23.11</b><i>«${q}»</i>${a?`<div class="sa">${a}</div>`:''}</div>`;
const tbl=(h,rows)=>`<div class="tw"><table class="t"><thead><tr>${h.map(x=>`<th${x[0]==='>'?' class="r"':''}>${x.replace(/^>/,'')}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
const strip=a=>`<div class="strip">${a.map(x=>`<div><small>${x[0]}</small><b>${x[1]}</b>${x[2]?`<i>${x[2]}</i>`:''}</div>`).join('')}</div>`;

const SEC=[
 {k:'own',n:'Руководителю',sub:[['dash','Пульт'],['occ','Заполняемость и доход'],['anal','Каналы и менеджеры'],['group','Бизнесы группы']]},
 {k:'obj',n:'Объекты',sub:[['objects','Объекты'],['floor','Шахматка этажа'],['unit','Карточка помещения'],['presale','Новый объект · предпродажа']]},
 {k:'sale',n:'Продажи аренды',sub:[['inbound','Входящие заявки'],['cold','Холодная база'],['mass','Рассылка и обзвон'],['shows','Показы · календарь']]},
 {k:'ten',n:'Арендаторы',sub:[['tenants','Арендаторы'],['contracts','Договоры и продления'],['pays','Оплаты и долги']]},
 {k:'com',n:'Связь',sub:[['inbox','Единое окно'],['boss','Все чаты менеджеров'],['mob','Телефон руководителя'],['calls','Звонки и записи']]},
 {k:'it',n:'IT · медиамониторинг',sub:[['itdeal','Воронка IT'],['itcl','Клиенты IT']]},
 {k:'sys',n:'О системе',sub:[['rights','Роли и права'],['own2','Код и сервер'],['launch','Стоимость']]}
];
const SECOF={},SUBN={},ALL=[];SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1];ALL.push(x[0])}));
const ROLES={
 'Собственник':{av:'СБ',n:'Алмас',note:'всё: объекты, деньги, все чаты менеджеров, бизнесы группы',s:ALL.slice()},
 'Менеджер аренды':{av:'МА',n:'Дана',note:'свои заявки, показы, холодная база, переписки; чужие чаты не видит',s:['inbound','cold','mass','shows','objects','floor','unit','presale','tenants','contracts','inbox','calls']},
 'Менеджер IT':{av:'IT',n:'Руслан',note:'воронка и клиенты медиамониторинга, свои переписки и звонки',s:['itdeal','itcl','inbox','calls']},
 'Бухгалтер':{av:'БХ',n:'Сауле',note:'договоры, начисления, оплаты, долги, доход по объектам',s:['tenants','contracts','pays','occ','launch']}
};
let role='Собственник',cur='dash',biz='ar';

/* объекты: [код, название, тип, адрес, этажей, м² к сдаче, ставка ₸/м²] */
const O=[
 ['BC1','БЦ «Ирбис»','бизнес-центр','ул. Набережная, 12',4,3200,4200],
 ['TD1','ТД «Шығыс»','торговый дом','пр. Абая, 77',2,2600,5600],
 ['BC2','БЦ «Ирбис-2»','строится · сдача весна 2027','ул. Набережная, 14',5,4100,4500]
];
/* помещения этажа 2 БЦ «Ирбис»: [№, м², статус free|bron|busy, арендатор] */
const U=[
 ['201',48,'busy','ТОО «Нур-Аудит»'],['202',36,'free',''],['203',62,'bron','Салон «Әсем»'],['204',24,'busy','ИП Касымов'],
 ['205',90,'free',''],['206',41,'busy','Нотариус Беков'],['207',33,'free',''],['208',120,'busy','Отдел гос. услуг'],
 ['209',28,'busy','Стоматология «Дент»'],['210',55,'bron','IT-школа «Код»'],['211',44,'free',''],['212',70,'busy','Банк, отделение'],
 ['213',30,'busy','Юрист Алиева'],['214',38,'free',''],['215',52,'busy','Страховая «Сақтау»'],['216',66,'busy','Турфирма «Жол»']
];
let UNIT=1;
const ST={free:'свободно',bron:'бронь',busy:'сдано'};
function openUnit(i){UNIT=i;const u=U[i];openM(`Помещение ${u[0]} · БЦ «Ирбис», 2 этаж`,`${u[1]} м² · ${ST[u[2]]}${u[3]?' · '+esc(u[3]):''}`,
 `<div class="kv"><span>Ставка</span><b class="num">${fmt(4200)} ₸/м²</b></div><div class="kv"><span>В месяц</span><b class="num">${tg(u[1]*4200)}</b></div><div class="kv"><span>Коммуналка</span><b>по счётчикам, отдельно</b></div>`+
 `<div class="btns">${u[2]==='free'?`<button class="bt a" onclick="bookUnit(${i})">Поставить бронь</button>`:''}<button class="bt o" onclick="go('unit');closeM()">Открыть карточку</button></div>`)}
function bookUnit(i){if(U[i][2]!=='free'){toast('Помещение уже занято или в брони.');return}U[i][2]='bron';U[i][3]='ИП Сейткали (из заявки)';closeM();build();toast(`Помещение <b>${U[i][0]}</b> в брони на 3 дня — Дана получила задачу «подготовить договор».`)}

/* заявки: [клиент, канал, что ищет, менеджер, этап, горячая] */
const L=[
 ['ИП Сейткали','Крыша','офис 30–40 м², до 180 тыс.','Дана',0,1],['Салон «Мөлдір»','Instagram','первый этаж, 50 м²','Ержан',0,0],['Аптека «Дәрумен»','звонок','ТД, вход с улицы','Дана',0,1],
 ['Нотариус Ахметова','Крыша','кабинет 20 м²','Ержан',1,0],['Курсы «Ағылшын»','2ГИС-рассылка','2 кабинета','Дана',1,0],
 ['Кофейня «Бариста»','Instagram','ТД, фудкорт','Ержан',2,1],['Банк, мини-офис','звонок','90 м², 1 этаж','Дана',2,0],
 ['IT-школа «Код»','рассылка','55 м²','Дана',3,1],['Салон «Әсем»','Крыша','62 м²','Ержан',3,0],
 ['Стоматология «Дент»','рекомендация','расширение +30 м²','Дана',4,0],
 ['Магазин «Ою»','Instagram','отказ: дорого','Ержан',5,0]
];
const LST=['Новая заявка','Показ назначен','Торг / условия','Бронь','Договор и заселение','Отказ'];
function moveL(i){if(L[i][4]>=4){toast('Сделка уже на заселении — дальше арендатор.');return}L[i][4]++;build();toast(`«${esc(L[i][0])}» → <b>${LST[L[i][4]]}</b>. История и переписка остаются в карточке.`)}

/* холодная база: [сегмент, найдено, отправлено, ответили, тёплые] */
const CB=[['Госорганы и учреждения',140,0,0,0],['Салоны красоты',210,180,26,9],['Кафе и кофейни',160,160,31,7],['Стоматологии и клиники',95,60,11,4],['Юристы и нотариусы',120,0,0,0],['Образование, курсы',88,88,14,5]];
let SEG=0;
function setSeg(v){SEG=parseInt(v)||0;build()}
function sendMass(){const c=CB[SEG];if(c[2]>=c[1]){toast('По этому сегменту рассылка уже прошла — смотрите ответы.');return}c[2]=c[1];c[3]=Math.round(c[1]*.13);c[4]=Math.round(c[1]*.04);build();toast(`Рассылка «${esc(c[0])}»: <b>${c[1]}</b> сообщений. Ответившие сами попадут в воронку на менеджера.`)}

/* арендаторы: [арендатор, объект, помещение, м², ставка, конец договора, долг, дней просрочки] */
const T=[
 ['ТОО «Нур-Аудит»','БЦ «Ирбис»','201',48,4200,'31.01.2027',0,0],['Отдел гос. услуг','БЦ «Ирбис»','208',120,3800,'31.12.2027',0,0],
 ['Банк, отделение','БЦ «Ирбис»','212',70,4600,'30.06.2027',0,0],['Стоматология «Дент»','БЦ «Ирбис»','209',28,4200,'15.12.2026',117600,12],
 ['ИП Касымов','БЦ «Ирбис»','204',24,4200,'28.02.2027',100800,34],['Супермаркет «Береке»','ТД «Шығыс»','1-01',420,5200,'31.08.2028',0,0],
 ['Бутик «Ару»','ТД «Шығыс»','1-14',36,6200,'10.12.2026',223200,8],['Кафе «Самал»','ТД «Шығыс»','2-03',140,5000,'31.05.2027',0,0]
];
let paid={};
function payT(i){if(!T[i][6]){toast('Долга нет.');return}paid[i]=T[i][6];T[i][6]=0;T[i][7]=0;build();toast(`Оплата от «${esc(T[i][0])}» разнесена: <b>${tg(paid[i])}</b>. Напоминания остановлены.`)}
let ext={};
function extT(i){ext[i]=1;build();toast(`«${esc(T[i][0])}»: предложение о продлении на 11 мес отправлено в WhatsApp, ставка +5%.`)}

/* чаты: [менеджер, клиент, канал, последнее, ждёт ответа мин] */
const CH=[
 ['Дана','ИП Сейткали','WhatsApp','Можно посмотреть 202 сегодня после 17?',4],['Ержан','Салон «Мөлдір»','Instagram','А первый этаж есть с витриной?',41],
 ['Дана','Аптека «Дәрумен»','WhatsApp','Пришлите план ТД, пожалуйста',0],['Ержан','Кофейня «Бариста»','WhatsApp','Согласны на 5 000 за м², если с 1 января',12],
 ['Айжан','Курсы «Ағылшын»','WhatsApp','Нужно 2 кабинета рядом',0],['Ержан','Нотариус Ахметова','звонок + WhatsApp','Перезвоните завтра',95]
];
let CHAT=0;
function pickChat(i){CHAT=i;build()}

const SC={};
SC.dash=()=>{const busy=U.filter(u=>u[2]==='busy').length,debt=T.reduce((a,t)=>a+t[6],0);return said('Входящие звонки, Крыша, объявления, Instagram — CRM особо не ведётся. Хотелось бы всё систематизировать.','Пульт собирает объекты, заявки, переписки и долги арендаторов на одном экране.')+
 strip([['Заполняемость','БЦ 84% · ТД 92%',`2 этаж БЦ: сдано ${busy} из ${U.length}`],['Доход аренды, ноябрь','24,6 млн ₸','+3% к октябрю'],['Заявок за неделю','38','Крыша 17 · Instagram 9 · звонки 8 · рассылка 4'],['Без ответа > 30 мин','2','Ержан'],['Долг арендаторов',tg(debt),'3 арендатора']])+
 `<div class="g31"><div class="box"><h3>Сегодня <small>24.11</small></h3>${tbl(['Время','Что','Кто'],[
 '<tr><td class="num">11:00</td><td>Показ 202 и 207 · ИП Сейткали</td><td>Дана</td></tr>','<tr><td class="num">14:30</td><td>Показ фудкорта ТД · Кофейня «Бариста»</td><td>Ержан</td></tr>',
 '<tr class="hl"><td class="num">15:00</td><td>Истекает бронь 203 · Салон «Әсем» — нужен договор</td><td>Ержан</td></tr>','<tr><td class="num">17:00</td><td>Рассылка «Госорганы» — 140 адресов готово</td><td>Дана</td></tr>'])}</div>
 <div class="box"><h3>Внимание</h3><div class="kv"><span><span class="dot d-bad"></span>Ержан не ответил «Нотариус Ахметова»</span><b>95 мин</b></div><div class="kv"><span><span class="dot d-warn"></span>Договор «Бутик «Ару»» кончается</span><b>10.12</b></div><div class="kv"><span><span class="dot d-bad"></span>ИП Касымов, просрочка</span><b>34 дня</b></div><div class="kv"><span><span class="dot d-ok"></span>Новый объект · заявок до старта</span><b>23</b></div>
 <div class="btns"><button class="bt" onclick="go('boss')">Открыть все чаты</button><button class="bt o" onclick="go('pays')">Долги</button></div></div></div>`};
SC.occ=()=>`<div class="box"><h3>Заполняемость и доход по объектам <small>ноябрь 2026</small></h3>${tbl(['Объект','Тип','>м² к сдаче','>Сдано м²','Заполн.','>Ставка ₸/м²','>Доход в мес'],[
 ['БЦ «Ирбис»','бизнес-центр',3200,2690,4200],['ТД «Шығыс»','торговый дом',2600,2390,5600]].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="r num">${fmt(r[2])}</td><td class="r num">${fmt(r[3])}</td><td style="min-width:120px">${bar(pct(r[3],r[2]))}<span class="num">${pct(r[3],r[2])}%</span></td><td class="r num">${fmt(r[4])}</td><td class="r num">${tg(r[3]*r[4])}</td></tr>`))}
 <p class="note">Свободные метры сразу видны в шахматке — менеджер предлагает их из карточки заявки, а не по памяти.</p></div>
 <div class="g2"><div class="box"><h3>Простой помещений</h3><div class="kv"><span>205 · 90 м²</span><b>свободно 74 дня</b></div><div class="kv"><span>211 · 44 м²</span><b>свободно 31 день</b></div><div class="kv"><span>ТД 2-08 · 60 м²</span><b>свободно 12 дней</b></div><p class="note">Недополученный доход за простой — около 1,6 млн ₸ с начала года.</p></div>
 <div class="box"><h3>Начисления ноября</h3><div class="kv"><span>Начислено аренды</span><b class="num">24 640 000 ₸</b></div><div class="kv"><span>Оплачено</span><b class="num">23 230 000 ₸</b></div><div class="kv"><span>Коммуналка выставлена</span><b class="num">1 910 000 ₸</b></div><div class="kv"><span>В 1С уходит</span><b>акты и счета — опция</b></div></div></div>`;
SC.anal=()=>`<div class="g2"><div class="box"><h3>Заявки по каналам <small>октябрь–ноябрь</small></h3>${tbl(['Канал','>Заявок','>Показов','>Договоров','Конверсия'],[['Крыша',64,31,9],['Instagram',38,14,4],['Входящие звонки',29,18,6],['Холодная рассылка 2ГИС',21,9,3],['Рекомендации',8,6,4]].map(r=>`<tr><td>${r[0]}</td><td class="r num">${r[1]}</td><td class="r num">${r[2]}</td><td class="r num">${r[3]}</td><td>${bar(pct(r[3],r[1])*3)}<span class="num">${pct(r[3],r[1])}%</span></td></tr>`))}</div>
 <div class="box"><h3>Менеджеры</h3>${tbl(['Менеджер','>Заявок','>Ср. ответ','>Показов','>Договоров'],[['Дана',58,'6 мин',34,12],['Ержан',61,'38 мин',27,8],['Айжан',41,'11 мин',17,6]].map(r=>`<tr><td><b>${r[0]}</b></td><td class="r num">${r[1]}</td><td class="r num">${r[2]}</td><td class="r num">${r[3]}</td><td class="r num">${r[4]}</td></tr>`))}<p class="note">Скорость первого ответа считается по переписке и звонкам автоматически — без отчётов от менеджеров.</p></div></div>`;
SC.group=()=>said('Чтобы все лиды консолидировались в одной CRM — и потом к следующему проекту.','Один вход для группы: у каждого бизнеса свои воронки и права, у собственника — общий пульт.')+
 `<div class="g2"><div class="box"><h3>Бизнесы в системе</h3>${tbl(['Бизнес','Статус','Пользователи','Что внутри'],[
 '<tr><td><b>Аренда · БЦ и ТД</b></td><td><span class="tag ok">в этом пакете</span></td><td class="num">5</td><td>объекты, заявки, арендаторы, чаты</td></tr>',
 '<tr><td><b>IT · медиамониторинг</b></td><td><span class="tag ok">в этом пакете</span></td><td class="num">3</td><td>замена amoCRM: воронка, клиенты, звонки, WhatsApp</td></tr>',
 '<tr><td>Производство</td><td><span class="tag">следующий этап</span></td><td class="num">—</td><td>по отдельной оценке</td></tr>','<tr><td>Розница</td><td><span class="tag">следующий этап</span></td><td class="num">—</td><td>по отдельной оценке</td></tr>'])}</div>
 <div class="box"><h3>Как переключаться</h3><p>Слева сверху — «Бизнес группы». Менеджер видит только свой бизнес, собственник переключается между всеми. Клиенты не смешиваются, но общий контакт (например, арендатор, который заказал медиамониторинг) виден в обеих воронках.</p><div class="btns"><button class="bt" onclick="setBiz('it')">Переключить на IT</button></div></div></div>`;
SC.objects=()=>`<div class="g3">${O.map((o,i)=>`<div class="box"><h3>${o[1]} <small>${o[2]}</small></h3><div class="kv"><span>Адрес</span><b>${o[3]}, Семей</b></div><div class="kv"><span>Этажей</span><b class="num">${o[4]}</b></div><div class="kv"><span>К сдаче</span><b class="num">${fmt(o[5])} м²</b></div><div class="kv"><span>Базовая ставка</span><b class="num">${fmt(o[6])} ₸/м²</b></div>
 <div class="btns">${i<2?`<button class="bt" onclick="go('floor')">Шахматка</button>`:`<button class="bt a" onclick="go('presale')">Предпродажа</button>`}</div></div>`).join('')}</div>
 <p class="note">Объекты, этажи и помещения заводятся один раз — дальше заявки, брони и договоры привязываются к конкретному помещению.</p>`;
SC.floor=()=>{const c={free:0,bron:0,busy:0};U.forEach(u=>c[u[2]]++);return `<div class="box"><h3>БЦ «Ирбис» · 2 этаж <small><span class="dot d-ok"></span>свободно ${c.free} · <span class="dot d-warn"></span>бронь ${c.bron} · <span class="dot d-n"></span>сдано ${c.busy}</small></h3>
 <div class="fl">${U.map((u,i)=>`<div class="pc ${u[2]}" onclick="openUnit(${i})"><b>${u[0]}</b><span class="num">${u[1]} м²</span><br><small>${u[3]?esc(u[3]):ST[u[2]]}</small></div>`).join('')}</div>
 <p class="note">Нажмите на свободное помещение — можно сразу поставить бронь под заявку. Бронь живёт 3 дня, потом снимается автоматически.</p></div>`};
SC.unit=()=>{const u=U[UNIT];return said('Пять менеджеров, около шести–восьми тысяч карточек.','У каждого помещения своя карточка: параметры, фото, план, история показов и заявок — менеджеры не путаются, что кому предлагали.')+`<div class="g2"><div class="box"><h3>Помещение ${u[0]} <small>БЦ «Ирбис», 2 этаж</small></h3><div class="kv"><span>Площадь</span><b class="num">${u[1]} м²</b></div><div class="kv"><span>Статус</span><b>${ST[u[2]]}</b></div><div class="kv"><span>Ставка</span><b class="num">4 200 ₸/м²</b></div><div class="kv"><span>Аренда в месяц</span><b class="num">${tg(u[1]*4200)}</b></div><div class="kv"><span>Окна</span><b>2, на набережную</b></div><div class="kv"><span>Фото и план</span><b>6 фото, PDF плана</b></div>
 <div class="btns"><button class="bt" onclick="openUnit(${UNIT})">Действия</button><button class="bt o" onclick="go('floor')">К шахматке</button></div></div>
 <div class="box"><h3>История помещения</h3>${tbl(['Дата','Событие'],['<tr><td class="num">02.09</td><td>Освободилось: «Фото-студия» съехала</td></tr>','<tr><td class="num">14.10</td><td>Показ · Курсы «Ағылшын» · Дана</td></tr>','<tr><td class="num">21.11</td><td>Запрос с Крыши: ИП Сейткали</td></tr>','<tr><td class="num">24.11</td><td>Показ назначен на 11:00</td></tr>'])}</div></div>`};
SC.presale=()=>said('Проект завершается — нужен маркетинг. Систематизировать то, что сделаем сейчас, и подготовить следующий проект.','Новый объект заводится заранее: лист ожидания, предбронь этажей, отдельная воронка.')+
 strip([['Объект','БЦ «Ирбис-2»','сдача весна 2027'],['Метров к сдаче','4 100'],['Лист ожидания','23','из текущих заявок и рассылок'],['Предбронь','610 м²','4 компании']])+
 `<div class="box"><h3>Лист ожидания <small>кто уже спрашивал</small></h3>${tbl(['Компания','Откуда','Нужно','Статус'],['<tr><td>Банк, мини-офис</td><td>звонок</td><td>90 м², 1 этаж</td><td><span class="tag ok">предбронь</span></td></tr>','<tr><td>Клиника «Жан»</td><td>Крыша</td><td>300 м²</td><td><span class="tag ok">предбронь</span></td></tr>','<tr><td>Курсы «Ағылшын»</td><td>рассылка</td><td>2 кабинета</td><td><span class="tag">ждёт цены</span></td></tr>','<tr><td>Салон «Мөлдір»</td><td>Instagram</td><td>1 этаж, витрина</td><td><span class="tag">интерес</span></td></tr>'])}
 <div class="btns"><button class="bt a" onclick="toast('Анонс «Ирбис-2» уйдёт 23 компаниям из листа ожидания и 210 салонам из холодной базы.')">Разослать анонс</button></div></div>`;
SC.inbound=()=>`<div class="kan">${LST.map((st,k)=>`<div class="col"><h4>${st}<span class="num">${L.filter(l=>l[4]===k).length}</span></h4>${L.map((l,i)=>l[4]===k?`<div class="dl ${l[5]?'hot':''}" onclick="moveL(${i})"><b>${esc(l[0])}</b>${esc(l[2])}<br><small>${l[1]} · ${l[3]}</small></div>`:'').join('')}</div>`).join('')}</div>
 <p class="note">Заявки с Крыши, Instagram и звонков падают сюда сами и распределяются по менеджерам по очереди. Нажмите карточку — она уйдёт на следующий этап.</p>`;
SC.cold=()=>said('Делаем целевой обзвон и рассылку — по госорганам, салонам красоты, кому подходит помещение. Парсим 2ГИС.','База сегментов хранится в системе, повторно одним и тем же не пишем, ответы сами становятся заявками.')+
 `<div class="box"><h3>Холодная база по сегментам</h3>${tbl(['Сегмент','>Найдено','>Отправлено','>Ответили','>Тёплые',''],CB.map(c=>`<tr><td><b>${c[0]}</b></td><td class="r num">${c[1]}</td><td class="r num">${c[2]}</td><td class="r num">${c[3]}</td><td class="r num">${c[4]}</td><td>${c[2]?'<span class="tag ok">идёт</span>':'<span class="tag">готово к запуску</span>'}</td></tr>`))}
 <p class="note">Список загружается из выгрузки 2ГИС (Excel). Дубли с текущими арендаторами и заявками отсекаются автоматически.</p></div>`;
SC.mass=()=>{const c=CB[SEG];return `<div class="g2"><div class="box"><h3>Новая рассылка</h3><div class="kv"><span>Сегмент</span><select class="inp" style="max-width:240px" onchange="setSeg(this.value)">${CB.map((x,i)=>`<option value="${i}"${i===SEG?' selected':''}>${x[0]}</option>`).join('')}</select></div>
 <div class="kv"><span>Адресов</span><b class="num">${c[1]}</b></div><div class="kv"><span>Канал</span><b>WhatsApp, по 40 в час</b></div><div class="kv"><span>Ответы</span><b>в воронку, на менеджера</b></div>
 <div class="msg" style="margin-top:10px">Здравствуйте! В БЦ «Ирбис» на Набережной освободились кабинеты от 30 м² — рядом с ЦОНом, парковка. Прислать план и цену?</div>
 <div class="btns"><button class="bt a" onclick="sendMass()">Запустить рассылку</button><button class="bt o" onclick="toast('Список на обзвон: ${c[1]} номеров распределён между Даной и Айжан, звонки пишутся.')">Сделать список на обзвон</button></div></div>
 <div class="box"><h3>Итоги по сегменту</h3><div class="kv"><span>Отправлено</span><b class="num">${c[2]}</b></div><div class="kv"><span>Ответили</span><b class="num">${c[3]}</b></div><div class="kv"><span>Тёплые</span><b class="num">${c[4]}</b></div><div class="kv"><span>Конверсия в ответ</span><b class="num">${pct(c[3],c[2])}%</b></div><p class="note">Частота отправки ограничена, чтобы номер не заблокировали.</p></div></div>`};
SC.shows=()=>`<div class="box"><h3>Показы на неделю <small>24–28 ноября</small></h3>${tbl(['День','Время','Объект · помещение','Клиент','Менеджер','Итог'],[
 '<tr><td>вт 24</td><td class="num">11:00</td><td>БЦ · 202, 207</td><td>ИП Сейткали</td><td>Дана</td><td><span class="tag">запланирован</span></td></tr>','<tr><td>вт 24</td><td class="num">14:30</td><td>ТД · фудкорт 2-08</td><td>Кофейня «Бариста»</td><td>Ержан</td><td><span class="tag">запланирован</span></td></tr>',
 '<tr><td>ср 25</td><td class="num">10:00</td><td>ТД · 1-05</td><td>Аптека «Дәрумен»</td><td>Дана</td><td><span class="tag">запланирован</span></td></tr>','<tr><td>чт 26</td><td class="num">16:00</td><td>БЦ · 205</td><td>Банк, мини-офис</td><td>Дана</td><td><span class="tag">запланирован</span></td></tr>','<tr><td>пн 23</td><td class="num">12:00</td><td>БЦ · 210</td><td>IT-школа «Код»</td><td>Дана</td><td><span class="tag ok">бронь</span></td></tr>'])}
 <p class="note">Клиент получает напоминание в WhatsApp за 2 часа. После показа менеджер ставит итог — без итога показ висит в «Внимание» у руководителя.</p></div>`;
SC.tenants=()=>`<div class="box"><h3>Арендаторы <small>${T.length} договоров</small></h3>${tbl(['Арендатор','Объект','Пом.','>м²','>Ставка','>В месяц','До','>Долг'],T.map(t=>`<tr${t[6]?' class="hl"':''}><td><b>${esc(t[0])}</b></td><td>${t[1]}</td><td class="num">${t[2]}</td><td class="r num">${t[3]}</td><td class="r num">${fmt(t[4])}</td><td class="r num">${fmt(t[3]*t[4])}</td><td class="num">${t[5]}</td><td class="r num">${fmt(t[6])}</td></tr>`))}</div>`;
SC.contracts=()=>`<div class="box"><h3>Договоры: продления <small>заканчиваются в ближайшие 90 дней</small></h3>${tbl(['Арендатор','Помещение','Конец','Предложение',''],T.map((t,i)=>[t,i]).filter(x=>/2026|01\.2027|02\.2027/.test(x[0][5])).map(([t,i])=>`<tr><td><b>${esc(t[0])}</b></td><td>${t[1]} · ${t[2]}</td><td class="num">${t[5]}</td><td>${ext[i]?'<span class="tag ok">отправлено</span>':'продление 11 мес, +5%'}</td><td><button class="bt s" onclick="extT(${i})">Предложить</button></td></tr>`))}
 <p class="note">Договор собирается из шаблона: стороны, помещение, площадь, ставка и срок подставляются из карточки. Подписанный скан хранится там же.</p></div>`;
SC.pays=()=>{const debt=T.reduce((a,t)=>a+t[6],0);return strip([['Долг всего',tg(debt)],['Арендаторов с долгом',String(T.filter(t=>t[6]).length)],['Оплачено в ноябре','23,23 млн ₸']])+
 `<div class="box"><h3>Должники</h3>${tbl(['Арендатор','Помещение','>Долг','>Дней',''],T.map((t,i)=>[t,i]).filter(x=>x[0][6]).map(([t,i])=>`<tr><td><b>${esc(t[0])}</b></td><td>${t[1]} · ${t[2]}</td><td class="r num">${fmt(t[6])}</td><td class="r num">${t[7]}</td><td><button class="bt s" onclick="payT(${i})">Отметить оплату</button></td></tr>`).concat(debt?[]:['<tr><td colspan="5">Долгов нет — все оплаты разнесены.</td></tr>']))}
 <p class="note">Напоминание уходит арендатору в WhatsApp на 1-й, 5-й и 10-й день просрочки. Выписку банка бухгалтер загружает файлом — оплаты разносятся по договорам.</p></div>`};
SC.inbox=()=>{const c=CH[CHAT];return `<div class="chat"><div class="chl">${CH.map((x,i)=>`<div class="${i===CHAT?'on':''}" onclick="pickChat(${i})">${esc(x[1])}<small>${x[2]} · ${esc(x[3])}</small></div>`).join('')}</div>
 <div class="chm"><div class="ms">${esc(c[1])} · ${c[2]} · менеджер ${c[0]}</div><div class="msg">${esc(c[3])}</div><div class="msg me">Добрый день! Отправляю план этажа и цены, могу показать сегодня.</div>
 <div class="btns"><button class="bt" onclick="toast('Шаблон «План и цена» отправлен с PDF плана этажа.')">Отправить план</button><button class="bt o" onclick="go('shows')">Назначить показ</button></div></div></div>
 <p class="note">WhatsApp и Instagram всех менеджеров приходят в одно окно. Каждый диалог привязан к карточке клиента — переписка не теряется, если менеджер уволится.</p>`};
SC.boss=()=>said('Можно ли мне видеть всю их переписку со своего телефона — текущие и архивные?','Да. Руководитель видит все чаты всех менеджеров и может вмешаться в любой диалог.')+
 `<div class="box"><h3>Все чаты менеджеров <small>сейчас открыто ${CH.length}</small></h3>${tbl(['Менеджер','Клиент','Канал','Последнее сообщение','>Ждёт ответа'],CH.map((x,i)=>`<tr${x[4]>30?' class="hl"':''}><td><b>${x[0]}</b></td><td><a onclick="pickChat(${i});go('inbox')">${esc(x[1])}</a></td><td>${x[2]}</td><td>${esc(x[3])}</td><td class="r num">${x[4]?x[4]+' мин':'—'}</td></tr>`))}
 <div class="btns"><button class="bt o" onclick="toast('Архив: 7 412 диалогов за 2 года, поиск по клиенту, номеру и тексту.')">Архив переписок</button><button class="bt" onclick="go('mob')">Вид с телефона</button></div></div>`;
SC.mob=()=>`<div class="g2"><div class="phone"><div class="ph">Алмас · телефон · 24.11</div>
 <div class="pc" onclick="go('boss')"><b>Без ответа > 30 мин: 2</b>Ержан · Салон «Мөлдір», Нотариус Ахметова</div>
 <div class="pc" onclick="go('inbound')"><b>Новых заявок сегодня: 6</b>Крыша 3 · Instagram 2 · звонок 1</div>
 <div class="pc" onclick="go('pays')"><b>Долг арендаторов</b>${tg(T.reduce((a,t)=>a+t[6],0))}</div>
 <div class="pc" onclick="go('occ')"><b>Заполняемость</b>БЦ 84% · ТД 92%</div></div>
 <div class="box"><h3>Руководитель с телефона</h3><p>Открывается в браузере телефона, приложение ставить не нужно. Главное — чаты менеджеров: можно открыть любой диалог, прочитать историю и ответить от имени компании.</p><div class="kv"><span>Текущие чаты</span><b>да</b></div><div class="kv"><span>Архив</span><b>да, с поиском</b></div><div class="kv"><span>Записи звонков</span><b>да</b></div><div class="kv"><span>Уведомления</span><b>в Telegram или push</b></div></div></div>`;
SC.calls=()=>`<div class="box"><h3>Звонки <small>сегодня</small></h3>${tbl(['Время','Номер','Менеджер','Длит.','Итог','Запись'],[
 '<tr><td class="num">09:12</td><td class="num">+7 702 ··· 41 18</td><td>Дана</td><td class="num">3:40</td><td>заявка «Аптека «Дәрумен»»</td><td><button class="bt s" onclick="toast(\'Воспроизведение записи 3:40\')">▶</button></td></tr>',
 '<tr><td class="num">10:05</td><td class="num">+7 777 ··· 09 52</td><td>Ержан</td><td class="num">1:15</td><td>перезвонить</td><td><button class="bt s" onclick="toast(\'Воспроизведение записи 1:15\')">▶</button></td></tr>',
 '<tr class="hl"><td class="num">10:48</td><td class="num">+7 705 ··· 77 03</td><td>—</td><td class="num">0:00</td><td>пропущен</td><td><button class="bt s" onclick="toast(\'Задача «перезвонить» создана на Айжан.\')">Перезвонить</button></td></tr>',
 '<tr><td class="num">11:30</td><td class="num">+7 701 ··· 26 90</td><td>Айжан</td><td class="num">6:02</td><td>холодный обзвон · интерес</td><td><button class="bt s" onclick="toast(\'Воспроизведение записи 6:02\')">▶</button></td></tr>'])}
 <p class="note">IP-телефония: входящий номер определяется, карточка клиента открывается сама, все разговоры пишутся и хранятся на вашем сервере.</p></div>`;
SC.itdeal=()=>said('В IT-компании используется amoCRM — телефония, запись звонков, WhatsApp. Можете сделать лучше и без подписки?','Та же логика, что у аренды, только своя воронка: медиамониторинг для компаний и госорганов.')+
 `<div class="kan">${[['Заявка',['Акимат района · пилот','ТОО «Энерго-Восток»']],['Демо доступа',['Банк · PR-отдел']],['КП',['Университет · 12 мес']],['Договор',['Сеть АЗС · 6 мес']],['Продление',['Холдинг «Ертіс» · через 20 дн']]].map(c=>`<div class="col"><h4>${c[0]}<span class="num">${c[1].length}</span></h4>${c[1].map(x=>`<div class="dl" onclick="toast('Карточка «${x}»: переписка, звонки, тариф, дата продления.')"><b>${x}</b>медиамониторинг</div>`).join('')}</div>`).join('')}</div>
 <p class="note">После переноса из amoCRM все сделки, контакты и история звонков остаются. Подписка amoCRM больше не нужна.</p>`;
SC.itcl=()=>`<div class="box"><h3>Клиенты IT <small>медиамониторинг</small></h3>${tbl(['Клиент','Тариф','>В месяц','Продление','Менеджер'],[['Холдинг «Ертіс»','Расширенный',450000,'14.12.2026','Руслан'],['Сеть АЗС','Базовый',180000,'01.05.2027','Руслан'],['Банк · PR-отдел','Демо',0,'—','Мадина'],['Университет','Базовый',180000,'—','Мадина']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="r num">${fmt(r[2])}</td><td class="num">${r[3]}</td><td>${r[4]}</td></tr>`))}
 <p class="note">Напоминание о продлении за 30 дней — менеджеру и клиенту. Доход IT виден у собственника отдельно от аренды. Звонки и переписка с клиентом IT лежат в той же карточке, что и в amoCRM, — после переноса история сохраняется.</p></div>`;
SC.rights=()=>`<div class="box"><h3>Кто что видит</h3>${tbl(['Раздел','Собств.','Менеджер аренды','Менеджер IT','Бухгалтер'],[
 ['Пульт и доход','да','—','—','доход'],['Объекты и шахматка','да','да','—','—'],['Заявки и показы','все','свои','—','—'],['Холодная база','да','да','—','—'],['Арендаторы, договоры','да','да','—','да'],['Оплаты и долги','да','—','—','да'],['Свои чаты','да','да','да','—'],['Чаты всех менеджеров','да','—','—','—'],['IT · медиамониторинг','да','—','да','—']].map(r=>`<tr>${r.map((x,i)=>i?`<td>${x==='да'||x==='все'?'<span class="dot d-ok"></span>':''}${x}</td>`:`<td><b>${x}</b></td>`).join('')}</tr>`))}
 <p class="note">Права настраиваются до поля: например, менеджер видит ставку, но не видит долг арендатора.</p></div>`;
SC.own2=()=>`<div class="g2"><div class="box"><h3>Система ваша</h3><div class="kv"><span>Код</span><b>передаётся полностью</b></div><div class="kv"><span>Сервер</span><b>ваш, в Казахстане</b></div><div class="kv"><span>Подписка</span><b>0 ₸</b></div><div class="kv"><span>Ограничения по пользователям</span><b>нет</b></div><div class="kv"><span>Резервные копии</span><b>каждую ночь</b></div></div>
 <div class="box"><h3>Перенос из amoCRM</h3><p>Сделки, контакты, задачи и история звонков IT-подразделения переносятся по API. Карточки аренды (~6–8 тыс.) загружаем из ваших таблиц и выгрузок. После проверки amoCRM можно отключить.</p></div></div><p class="note">Документация и инструкция для сотрудников передаются вместе с кодом — любой разработчик разберётся за 1–2 дня. Данные арендаторов и переписки хранятся только у вас, без чужих облаков.</p>`;
SC.launch=()=>`<div class="box"><h3>Стоимость <small>подробно — в КП</small></h3><div class="kv"><span>Стандартный пакет (всё, что в этом демо)</span><b class="num">2 500 000 ₸</b></div><div class="kv"><span>Интеграция с 1С — опция</span><b class="num">+800 000 ₸</b></div><div class="kv"><span>Следующие бизнесы группы</span><b>по отдельной оценке</b></div><div class="kv"><span>Срок</span><b>4–6 недель</b></div><div class="kv"><span>Оплата</span><b class="num">30 / 40 / 30</b></div><div class="kv"><span>Сервер, телефония, WhatsApp-шлюз</span><b>провайдерам напрямую</b></div></div>
 <div class="box"><h3>Поддержка</h3><p>3 месяца сопровождения включены. Дальше — по необходимости, 20 $ в час. Ошибки по нашей вине исправляем бесплатно.</p></div><p class="note">Для сравнения: подписка облачной CRM на 5 менеджеров с телефонией и WhatsApp стоит порядка 1–1,5 млн ₸ в год (оценка), и платить её нужно каждый год. Здесь — один раз.</p>`;

function setBiz(v){biz=v;const s=document.getElementById('biz');if(s)s.value=v;if(v==='it'){if(allowed('itdeal'))go('itdeal');else toast('Этой роли IT-воронка недоступна.')}else if(v==='ar'){go(allowed('dash')?'dash':ROLES[role].s[0])}else toast('Этот бизнес подключается следующим этапом — по отдельной оценке.')}
function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${v.av}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');document.getElementById('rsel').innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');document.getElementById('rsel').value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;document.getElementById('rsel').value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function goSec(k){const S=SEC.find(x=>x.k===k);const f=S.sub.find(x=>allowed(x[0]));if(f)go(f[0])}
function buildRail(){const vis=SEC.filter(s=>s.sub.some(x=>allowed(x[0])));document.getElementById('rail').innerHTML=vis.map((s,i)=>`<div class="ri ${s.k===SECOF[cur]?'on':''}" onclick="goSec('${s.k}')"><span>${String(i+1).padStart(2,'0')}</span>${s.n}</div>`).join('');
 const S=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('tabs').innerHTML=S.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('');
 document.getElementById('crumb').innerHTML=`${esc(S.n)} / <b>${esc(SUBN[cur])}</b> · ${esc(role)}, ${esc(ROLES[role].n)}`;
 const b=document.getElementById('biz');if(b)b.value=SECOF[cur]==='it'?'it':(biz==='it'?'ar':biz)}
function build(){if(!allowed(cur))cur=ROLES[role].s[0];buildRail();document.getElementById('ttl').textContent=SUBN[cur];document.getElementById('content').innerHTML=SC[cur]();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль.');return}cur=k;build();window.scrollTo(0,0)}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6000)}
const TOUR=[['dash','1 · Пульт: объекты, заявки, чаты, долги.'],['floor','2 · Шахматка: свободно, бронь, сдано.'],['inbound','3 · Входящие с Крыши, Instagram и звонков.'],['cold','4 · Холодная база по сегментам из 2ГИС.'],['mass','5 · Рассылка: ответы сами идут в воронку.'],['boss','6 · Все чаты менеджеров — для руководителя.'],['mob','7 · То же с телефона.'],['pays','8 · Арендаторы и долги.'],['presale','9 · Новый объект: лист ожидания заранее.'],['itdeal','10 · IT: замена amoCRM в той же системе.']];
let ti=-1,tRun=false;function tour(){if(tRun){tRun=false;return}tRun=true;ti=-1;step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){tRun=false;toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Собственник');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false}
(function(){renderRoles();document.getElementById('rsel').addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();tRun=false}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
