/* АЛПРОФ СКО — демо по ТЗ заказчика (редакция ноябрь 2026). Клиенты, объекты, суммы и сотрудники вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const bar=w=>`<div class="bar"><i style="width:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const tz=(p,t)=>`<div class="said"><b>ТЗ · п. ${p}</b><i>${t}</i></div>`;
const tbl=(h,rows)=>`<div class="tw"><table class="t"><thead><tr>${h.map(x=>`<th${x[0]==='>'?' class="r"':''}>${x.replace(/^>/,'')}</th>`).join('')}</tr></thead><tbody>${rows.join('')||`<tr><td colspan="${h.length}" class="mut">Пусто</td></tr>`}</tbody></table></div>`;
const NOW='26.11 14:00';

/* ===== разделы и роли (ТЗ п. 2) ===== */
const SEC=[
 {k:'own',n:'Руководителю',sub:[['dash','Пульт'],['an','Сквозная аналитика'],['disc','Дисциплина и сроки'],['pf','Производство и финансы'],['tabel','Табель'],['jr','Журнал разблокировок']]},
 {k:'sale',n:'Воронка продаж',sub:[['funnel','Воронка 3.1 · этапы 1–8'],['deal','Карточка сделки / проекта'],['cl','Контрагенты и дубли'],['tasks','Задачи и переносы']]},
 {k:'zr',n:'Замер и расчёт',sub:[['zam','Календарь замеров'],['zmob','Замерщик · телефон'],['eng','Инженер-расчётчик']]},
 {k:'prj',n:'Проектный контур',sub:[['proj','Проекты 3.2 · этапы 9–15'],['mat','Материалы, ЛЗК, пирамиды'],['mont','Монтаж и наряды'],['mmob','Бригадир · телефон']]},
 {k:'acc',n:'Бухгалтерия',sub:[['pay','Ожидают подтверждения оплаты'],['ctr','Карточка договора']]},
 {k:'ch',n:'Каналы и сайт',sub:[['inbox','Единое окно'],['site','Сайт: формы, виджет, коллтрекинг'],['ads','Передача статусов в рекламу'],['tgn','Уведомления в Telegram']]},
 {k:'adm',n:'Настройки',sub:[['users','Пользователи и права'],['dict','Справочники'],['tzm','Соответствие ТЗ'],['price','Стоимость и этапы']]}
];
const SECOF={},SUBN={},ALL=[];SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1];ALL.push(x[0])}));
const ROLES={
 'Руководитель':{av:'РК',n:'Ерлан Сапаров',note:'всё: воронки, проекты, сроки, финансы, аналитика, табель, ручная разблокировка',s:ALL.slice()},
 'Менеджер':{av:'МН',n:'Николай',note:'свои сделки и проекты, общий реестр контрагентов, аналитика по себе',s:['funnel','deal','cl','tasks','zam','proj','inbox','site']},
 'Замерщик':{av:'ЗМ',n:'Артём',note:'свои наряды на замер, лист замера, фото; без финансов',s:['zmob','zam']},
 'Инженер-расчётчик':{av:'ИН',n:'Ольга · ПТО',note:'задачи на расчёт, замеры, чертежи, складские остатки; без переписки и цен',s:['eng','mat']},
 'Производство / Склад':{av:'ЦХ',n:'Геннадий · нач. производства',note:'этапы 10–15, давальческое, ЛЗК, пирамиды; без коммерческой переписки',s:['proj','mat','mont']},
 'Монтаж (бригадир)':{av:'БР',n:'Сергей · бригада 1',note:'назначенные монтажи, фотоотчёт, акт или акт о неявке',s:['mmob','mont']},
 'Бухгалтер':{av:'БХ',n:'Айгерим',note:'только реестр «Ожидают подтверждения оплаты» и карточка договора',s:['pay','ctr']},
 'Администратор':{av:'АД',n:'Админ',note:'учётные записи, права, справочники, этапы, подключения каналов',s:['users','dict','tgn','tzm']}
};
let role='Руководитель',cur='dash';

/* ===== справочники ===== */
const TYPES=['Витражи','Фасадное остекление','Входные группы','Алюминиевые двери','Окна','Офисные перегородки','Ограждения','Резка и обработка'];
const FMT={own:'Собственное сырьё («под ключ»)',dav:'Давальческое сырьё',fab:'Только изготовление'};
const LOST=['Дорого','Сроки','Выбрали конкурента','Нецелевой запрос','Не вышел на связь','Отложили проект'];
const MOVE=['Задержка поставки стекла','Задержка профиля / покраски','Автоматика не поступила','Перенос по просьбе клиента','Погода','Занятость бригады','Болезнь сотрудника'];
const DIRN={roz:'Петропавловск, розница',corp:'Корпоративные объекты',dav:'Давальческое сырьё'};
const ST=[['s1','Новая заявка'],['s2','Квалификация'],['s3','Замер назначен'],['s4','Замер выполнен'],['s5','Инженерный расчёт'],['s6','КП отправлено'],['s7','Согласование'],['s8','Договор'],
 ['p9','Ожидает предоплату'],['p10','Подготовка и материалы'],['p11','В производстве'],['p12','Ожидает оплату перед отгрузкой'],['p13','Монтаж'],['p14','Сдача-приёмка и возврат'],['p15','Проект закрыт']];
const STN=Object.fromEntries(ST);STN.lost='Отказ';
const SI=k=>ST.findIndex(x=>x[0]===k);
const RESP={s1:'Система → Менеджер',s2:'Менеджер',s3:'Менеджер → Замерщик',s4:'Замерщик',s5:'Инженер-расчётчик',s6:'Менеджер',s7:'Менеджер',s8:'Менеджер',p9:'Бухгалтер',p10:'Производство / Склад',p11:'Производство',p12:'Бухгалтер / Менеджер',p13:'Монтажный отдел',p14:'Монтаж / Склад',p15:'Система / Руководитель'};

/* ===== контрагенты (ТЗ п. 4.1) ===== */
let CL=[
 {id:'c1',t:'ФЛ',n:'Ирина Ковалёва',iin:'870412400215',ph:'+7 705 214 33 10',addr:'г. Петропавловск, ул. Жамбыла 112, кв. 48'},
 {id:'c2',t:'ТОО',n:'ТОО «СеверСтрой-П»',bin:'150940012345',ph:'+7 7152 46 12 30',addr:'г. Петропавловск, ул. Конституции Казахстана 34',iik:'KZ836017111000004512',bank:'АО «Народный Банк Казахстана»',bik:'HSBKKZKX',kbe:'17',sg:'Бекенов Айдар Талгатович, директор',bs:'Устав'},
 {id:'c3',t:'ИП',n:'ИП Сабитов Е. К.',bin:'791105300418',ph:'+7 777 410 22 87',addr:'г. Петропавловск, ул. Абая 61',iik:'KZ45722S000002331190',bank:'АО «Kaspi Bank»',bik:'CASPKZKA',kbe:'19',sg:'Сабитов Ержан Кайратович',bs:'Талон о регистрации ИП'},
 {id:'c4',t:'ТОО',n:'ТОО «АгроЦентр СК»',bin:'090240008811',ph:'+7 7152 50 41 18',addr:'СКО, Кызылжарский р-н, с. Бишкуль, ул. Мира 2',iik:'KZ219261802170344000',bank:'АО «Kazkommertsbank» (Halyk)',bik:'HSBKKZKX',kbe:'17',sg:'Ким Виталий Сергеевич, ген. директор',bs:'Доверенность № 14 от 02.11.2026'},
 {id:'c5',t:'ФЛ',n:'Елена Смирнова',iin:'910226450117',ph:'+7 701 833 40 21',addr:'СКО, пос. Боровской, ул. Лесная 9'},
 {id:'c6',t:'ТОО',n:'ТОО «Кокше Фасад»',bin:'180540021477',ph:'+7 7162 25 77 01',addr:'г. Кокшетау, ул. Ауэзова 189',iik:'KZ07998CTB0000556610',bank:'АО «First Heartland Jusan Bank»',bik:'TSESKZKA',kbe:'17',sg:'Жумабаев Нурлан Серикович, директор',bs:'Устав'},
 {id:'c7',t:'ФЛ',n:'Андрей Мельник',iin:'830719300902',ph:'+7 776 120 55 63',addr:'г. Петропавловск, СНТ «Рассвет», уч. 41'},
 {id:'c8',t:'ТОО',n:'ТОО «Арай-Сервис»',bin:'200340019925',ph:'+7 7152 33 08 14',addr:'г. Петропавловск, ул. Интернациональная 20'},
 {id:'c9',t:'ФЛ',n:'Виктор Ли',iin:'760301300556',ph:'+7 702 455 90 12',addr:'г. Петропавловск, ул. Ауэзова 14, кв. 7'},
 {id:'c10',t:'ИП',n:'ИП Нурланова А. М.',bin:'880914400331',ph:'+7 747 300 18 44',addr:'г. Петропавловск, ТЦ «Северный», бутик 12',iik:'KZ55722S000014422011',bank:'АО «Kaspi Bank»',bik:'CASPKZKA',kbe:'19',sg:'Нурланова Асель Муратовна',bs:'Талон о регистрации ИП'},
 {id:'c11',t:'ТОО',n:'ТОО «Тайынша Агро»',bin:'110640031208',ph:'+7 71536 2 14 70',addr:'СКО, г. Тайынша, ул. Конституции 7',iik:'KZ576017111000099120',bank:'АО «Народный Банк Казахстана»',bik:'HSBKKZKX',kbe:'17',sg:'Оспанов Канат Ерболович, директор',bs:'Устав'}
];
const clOf=id=>CL.find(x=>x.id===id);
const isUL=c=>c.t!=='ФЛ';
const reqOk=c=>c.t==='ФЛ'?!!(c.iin&&c.addr):!!(c.bin&&c.n&&c.addr&&c.iik&&c.bik&&c.bank&&c.kbe&&c.sg&&c.bs);

/* ===== сделки и проекты ===== */
let SEQ=140;
function mk(o){return Object.assign({mgr:'Николай',fmt:null,type:null,city:'',addr:'',src:'Сайт · форма «Заказ замера»',page:'/zamer',utm:'',target:null,taken:false,
 zam:{date:'',contact:'',task:false},f:{zam:false,calc:false,calcOk:false,kp:false,kpSent:false,agreed:false,contract:false,sched:false},calcV:0,kpV:0,
 task:null,sum:0,plan:[0,0,0],paid:{pre:false,ship:false,fin:false},mat:{stock:false,davAct:false,lzk:null},due:'',ready:false,mon:{br:'',date:'',photo:false},
 act:null,pyr:{out:0,back:0},rest:false,recvMin:0,zamH:0,monH:0,prodDays:0,lost:null,unl:{},hist:[],files:{f1:[],f2:[],f3:[],f4:[],f5:[],f6:[]}},o)}
function fill(d){/* дозаполнить до текущего этапа, чтобы данные были согласованы */
 const i=SI(d.st);const c=clOf(d.cl);
 if(i>=1)d.taken=true;
 if(i>=2){d.fmt=d.fmt||'own';d.type=d.type||'Витражи';d.city=d.city||'Петропавловск';d.addr=d.addr||c.addr;if(d.target===null)d.target=true}
 if(i>=3){d.zam={date:d.zam.date||'20.11 11:00',contact:d.zam.contact||c.n.replace(/^ТОО |^ИП /,'')+', '+c.ph,task:true}}
 if(i>=4){d.f.zam=true;d.files.f1=d.files.f1.length?d.files.f1:['Лист замера.pdf','Фото проёма 1.jpg','Фото проёма 2.jpg','Видео подъезда.mp4']}
 if(i>=5){d.f.calc=true;d.f.calcOk=true;d.calcV=d.calcV||1;d.files.f2=d.files.f2.length?d.files.f2:['Расчёт и спецификация v'+d.calcV+'.xlsx','Чертёж.dwg']}
 if(i>=6){d.f.kp=true;d.f.kpSent=true;d.kpV=d.kpV||1;d.files.f3=d.files.f3.length?d.files.f3:['КП v'+d.kpV+'.pdf'];if(!d.task&&d.st!=='s7')d.task={t:'Созвон по КП',d:'27.11 11:00'}}
 if(i>=7)d.f.agreed=true;
 if(i>=8){d.f.contract=true;d.f.sched=true;d.files.f4=d.files.f4.length?d.files.f4:['Договор подписан.pdf','Спецификация.pdf','График платежей.pdf']}
 if(i>=9)d.paid.pre=true;
 if(i>=10){if(d.fmt==='dav'){d.mat.davAct=true;d.files.f5=d.files.f5.length?d.files.f5:['Акт приёма давальческого сырья.pdf']}else d.mat.stock=true;d.mat.lzk=d.mat.lzk||{n:'ЛЗК-'+(300+SEQ++%90),d:'18.11'};d.due=d.due||'02.12'}
 if(i>=11)d.ready=true;
 if(i>=12)d.paid.ship=true;
 if(i>=13){d.mon={br:d.mon.br||'Бригада 1 · Сергей, Андрей',date:d.mon.date||'24.11',photo:true};d.files.f6=d.files.f6.length?d.files.f6:['Фото до.jpg','Фото после.jpg'];d.pyr.out=d.pyr.out||3}
 if(i>=14){d.act='signed';d.pyr.back=d.pyr.out;d.rest=true;d.paid.fin=true}
 return d}
const sp=(sum,dav)=>dav?[Math.round(sum*.5),Math.round(sum*.5),0]:[Math.round(sum*.5),Math.round(sum*.4),Math.round(sum*.1)];
let D=[
 mk({id:'A-139',cl:'c8',st:'s1',src:'Сайт · форма «Заказ замера»',page:'/zamer',utm:'utm_source=yandex&utm_campaign=vitrazhi_pk',recvMin:12,sum:0,files:{f1:['Чертёж клиента.pdf'],f2:[],f3:[],f4:[],f5:[],f6:[]},type:'Входные группы',city:'Петропавловск',hist:[['26.11 13:48','Заявка с сайта: форма «Заказ замера», продукт «Входная группа», приложен чертёж клиента'],['26.11 13:48','Автоприветствие клиенту в WhatsApp отправлено']]}),
 mk({id:'A-138',cl:'c7',st:'s1',src:'Instagram · реклама',page:'lead form',utm:'campaign=dveri_nov / объявление «Тёплые двери»',recvMin:47,hist:[['26.11 13:13','Заявка из рекламной формы Instagram']]}),
 mk({id:'A-137',cl:'c5',st:'s2',src:'WhatsApp',taken:true,type:'Окна',city:'Боровской',recvMin:180,hist:[['26.11 11:00','Новый номер написал в WhatsApp — карточка создана автоматически']]}),
 mk({id:'A-136',cl:'c3',st:'s3',src:'Звонок · коллтрекинг (2ГИС)',type:'Входные группы',fmt:'own',sum:0,zam:{date:'27.11 11:00',contact:'Ержан, +7 777 410 22 87',task:true}}),
 mk({id:'A-135',cl:'c2',st:'s4',src:'Холодные корпоративные продажи',type:'Фасадное остекление',fmt:'own',zamH:30,mgr:'Дана'}),
 mk({id:'A-134',cl:'c6',st:'s5',src:'Сайт · форма «Заявка на давальческое сырьё»',page:'/davalcheskoe',fmt:'dav',type:'Витражи',city:'Кокшетау',zamH:52,mgr:'Дана'}),
 mk({id:'A-133',cl:'c9',st:'s6',src:'Рекомендация',type:'Окна',sum:920000,task:{t:'Созвон по КП',d:'27.11 11:00'}}),
 mk({id:'A-132',cl:'c11',st:'s7',src:'Сайт · форма «Расчёт стоимости»',page:'/raschet',type:'Ограждения',sum:3640000,task:null,calcV:2,kpV:2,mgr:'Дана'}),
 mk({id:'A-131',cl:'c2',st:'s8',src:'Холодные корпоративные продажи',type:'Офисные перегородки',sum:4860000}),
 mk({id:'A-129',cl:'c2',st:'p9',src:'Рекомендация',type:'Витражи',sum:5120000,mgr:'Дана'}),
 mk({id:'A-128',cl:'c4',st:'p10',src:'Сайт · форма «Заявка на давальческое сырьё»',fmt:'dav',type:'Входные группы',sum:1380000,city:'с. Бишкуль'}),
 mk({id:'A-127',cl:'c10',st:'p11',src:'Instagram · реклама',type:'Витражи',sum:1260000,prodDays:6,due:'28.11'}),
 mk({id:'A-126',cl:'c6',st:'p11',src:'Сайт · форма «Заявка на давальческое сырьё»',fmt:'dav',type:'Фасадное остекление',sum:2140000,prodDays:3,due:'01.12',city:'Кокшетау',mgr:'Дана'}),
 mk({id:'A-125',cl:'c1',st:'p12',src:'Сайт · форма «Обратный звонок»',type:'Алюминиевые двери',sum:780000}),
 mk({id:'A-124',cl:'c9',st:'p13',src:'Рекомендация',type:'Окна',sum:920000,mon:{br:'Бригада 1 · Сергей, Андрей',date:'26.11',photo:false}}),
 mk({id:'A-123',cl:'c5',st:'p14',src:'Instagram · реклама',type:'Входные группы',sum:2410000,monH:20,act:null}),
 mk({id:'A-120',cl:'c7',st:'p15',src:'WhatsApp',type:'Окна',sum:860000}),
 mk({id:'A-119',cl:'c3',st:'lost',src:'Звонок',type:'Резка и обработка',lost:['Дорого','Сравнил с Кокшетау, у них дешевле на 12%']})
];
D.forEach(d=>{if(d.st!=='lost')fill(d);if(d.sum){d.plan=sp(d.sum,d.fmt==='dav')}});
/* точечные состояния под демо */
(()=>{const g=id=>D.find(x=>x.id===id);
 const a=g('A-139');a.taken=false;const b=g('A-138');b.taken=false;
 const c=g('A-137');c.fmt=null;c.addr='';c.target=null;
 const d=g('A-135');d.f.calc=false;d.f.calcOk=false;d.calcV=0;d.files.f2=[];
 const e=g('A-134');e.f.calc=false;e.calcV=0;e.files.f2=[];
 const f=g('A-131');f.f.contract=false;f.f.sched=false;f.files.f4=[];CL.find(x=>x.id==='c2').bs='';
 const h=g('A-129');h.paid.pre=false;
 const k=g('A-128');k.mat.davAct=false;k.mat.lzk=null;k.files.f5=[];k.due='';
 const m=g('A-127');m.ready=false;const n=g('A-126');n.ready=false;
 const p=g('A-125');p.paid.ship=false;
 const q=g('A-124');q.mon.photo=false;q.files.f6=['Фото до.jpg'];q.pyr.out=4;
 const r=g('A-123');r.act=null;r.pyr={out:3,back:1};r.rest=false;r.paid.fin=false;
 D.forEach(x=>{if(!x.hist.length)x.hist=[['—','Карточка создана: '+x.src]];});
})();
const byId=id=>D.find(x=>x.id===id);
let curDeal='A-131';
const dirOf=d=>d.fmt==='dav'?'dav':(isUL(clOf(d.cl))&&d.sum>1500000?'corp':'roz');
const paidSum=d=>(d.paid.pre?d.plan[0]:0)+(d.paid.ship?d.plan[1]:0)+(d.paid.fin?d.plan[2]:0);
const isProj=d=>d.st[0]==='p';

/* журналы */
let JR=[['24.11 16:20','Ерлан Сапаров','A-118','Стоп-кран 2 снят вручную: отгрузка без доплаты','Клиент — школа, оплата через казначейство в течение 5 дней, гарантийное письмо приложено']];
let TG=[['26.11 13:48','Николай','Новая заявка с сайта A-139 · форма «Заказ замера» · 30 мин на ответ'],['26.11 13:43','Ерлан Сапаров','Просрочка: A-138 без ответа 30 мин'],['26.11 10:05','Айгерим','Запрос: подтвердить предоплату A-129 · 2 560 000 ₸'],['26.11 09:00','Ольга · ПТО','Угроза срока 48 ч: A-134 · расчёт просрочен на 4 ч']];
let ADS=[['26.11 12:10','A-133','Договор оплачен','Мета (Instagram)','отправлено'],['25.11 17:42','A-136','Замер назначен','Яндекс Метрика','отправлено'],['25.11 17:42','A-136','Замер назначен','Google Analytics 4','отправлено'],['25.11 11:05','A-137','Целевое обращение','Мета (Instagram)','отправлено']];
let NOTE=[['25.11 15:10','A-127','Перенос готовности 26.11 → 28.11','Задержка поставки стекла','Закалённое стекло 10 мм пришло с браком, поставщик меняет партию','Николай, Ерлан Сапаров']];
function tgPush(to,m){TG.unshift([NOW,to,m])}
function adsPush(id,st){['Мета (Instagram)','Яндекс Метрика','Google Analytics 4'].forEach(s=>ADS.unshift([NOW,id,st,s,'отправлено']))}
function hist(d,m){d.hist.unshift([NOW,m])}

/* ===== условия перехода (стоп-краны) ===== */
function need(d){const c=clOf(d.cl);switch(d.st){
 case 's1':return[[d.taken,'Менеджер взял заявку в работу и зафиксировал первый контакт']];
 case 's2':return[[!!d.fmt,'Формат сырья'],[!!d.type,'Тип конструкции'],[!!(d.city&&d.addr),'Город и адрес объекта'],[d.target===true,'Статус «Целевое»']];
 case 's3':return[[!!d.addr,'Адрес'],[!!d.zam.contact,'Контакт на объекте'],[!!d.zam.date,'Дата и время замера'],[d.zam.task,'Задача замерщику создана']];
 case 's4':return[[d.f.zam,'Приложен файл или фото листа замера']];
 case 's5':return[[d.f.calc,'Приложен файл расчёта'],[d.f.calcOk,'Расчёт принят менеджером']];
 case 's6':return[[d.f.kp,'Файл КП приложен'],[d.f.kpSent,'КП отправлено клиенту'],[!!d.task,'Назначена задача на созвон']];
 case 's7':return[[d.f.agreed,'Согласие клиента по финальной спецификации и цене']];
 case 's8':return[[reqOk(c),'Реквизиты контрагента заполнены полностью'],[d.f.contract,'Загружен подписанный договор'],[d.f.sched,'Задан график оплат']];
 case 'p9':return[[d.f.contract,'Подписанный договор'],[d.f.zam,'Лист замера'],[d.paid.pre,'Предоплата подтверждена бухгалтером']];
 case 'p10':return[[d.fmt==='dav'?d.mat.davAct:d.mat.stock,d.fmt==='dav'?'Акт приёма давальческого сырья':'Наличие сырья подтверждено'],[!!d.mat.lzk,'Лимитно-заборная карта оформлена'],[!!d.due,'Задан срок готовности']];
 case 'p11':return[[d.ready,'Отметка цеха «Изделия готовы и укомплектованы»']];
 case 'p12':return[[d.paid.ship,'Оплата перед отгрузкой подтверждена бухгалтером']];
 case 'p13':return[[!!d.mon.br,'Назначена бригада и дата'],[d.mon.photo,'Загружен фотоотчёт монтажа']];
 case 'p14':return[[!!d.act,'Подписанный акт (или акт о неявке)'],[d.pyr.back>=d.pyr.out&&d.pyr.out>0,'Склад: пирамиды возвращены'],[d.rest,'Склад: остатки материалов возвращены']];
 default:return[]}}
const CRIT={p9:'Стоп-кран 1 · запуск в производство',p12:'Стоп-кран 2 · отгрузка и выезд бригады',p14:'Стоп-кран 3 · закрытие проекта'};
const missing=d=>need(d).filter(x=>!x[0]).map(x=>x[1]);
const blocked=d=>missing(d).length>0&&!d.unl[d.st];

/* ===== таймеры (ТЗ п. 5) ===== */
function timers(d){const r=[];
 if(d.st==='s1'&&!d.taken){const l=30-d.recvMin;r.push(l>=0?['w',`⏱ первый ответ: осталось ${l} мин`]:['r',`⏱ просрочка ответа ${-l} мин · сигнал руководителю`])}
 if(d.st==='s4'||d.st==='s5'||(d.st==='s6'&&!d.f.kpSent)){const l=48-d.zamH;r.push(l>=0?['w',`⏱ расчёт и КП: осталось ${l} ч из 48`]:['r',`⏱ 48 ч просрочено на ${-l} ч`])}
 if(d.st==='p11'){r.push(d.prodDays>=5?['r',`🔔 ${d.prodDays} дн. в цехе — проинформировать клиента`]:['i',`в цехе ${d.prodDays} дн., напоминание на 5–7 день`])}
 if(d.st==='p14'&&!(d.pyr.back>=d.pyr.out&&d.rest)){const l=24-d.monH;r.push(l>=0?['w',`⏱ возврат пирамид: осталось ${l} ч из 24`]:['r',`⏱ возврат пирамид просрочен на ${-l} ч`])}
 return r}
const tmrHtml=d=>timers(d).map(x=>`<span class="tmr lbl ${x[0]==='r'?'bad':x[0]==='w'?'w':'i'}">${x[1]}</span>`).join('');
const noStep=d=>!['lost','p15'].includes(d.st)&&!isProj(d)&&SI(d.st)>=5&&!d.task;

/* ===== экраны ===== */
const SC={};
const nums=a=>`<div class="nums">${a.map(x=>`<div><small>${x[0]}</small><b>${x[1]}</b><span>${x[2]||''}</span></div>`).join('')}</div>`;
SC.dash=()=>{const act=D.filter(d=>!['lost','p15'].includes(d.st));const tv=act.filter(d=>timers(d).some(t=>t[0]==='r'));const bl=act.filter(d=>CRIT[d.st]&&blocked(d));const ns=act.filter(noStep);
 const deb=D.filter(isProj).reduce((a,d)=>a+Math.max(0,d.sum-paidSum(d)),0);
 return `<div class="hd"><div><h2>Пульт руководителя</h2><p>Всё, что требует внимания сейчас: просроченные таймеры, заблокированные стоп-краны, сделки без следующего шага. Время демо — ${NOW}.</p></div><div class="btns"><button class="bt a" onclick="runAll('own')">▶ Прогнать заказ «своё сырьё»</button><button class="bt a" onclick="runAll('dav')">▶ Прогнать заказ «давальческое»</button></div></div>
 ${nums([['сделок в воронке',act.filter(d=>!isProj(d)).length,'этапы 1–8'],['проектов в работе',act.filter(isProj).length,'этапы 9–14'],['нарушений таймеров',tv.length,'30 мин / 48 ч / 24 ч'],['на стоп-кранах',bl.length,'ждут условий'],['дебиторка',tg(deb),'по договорам']])}
 <div class="g3"><div class="pan"><h3>Просрочки таймеров <small>сигнал руководителю</small></h3>${tv.map(d=>`<div class="kv" onclick="openDeal('${d.id}')" style="cursor:pointer"><span><b>${d.id}</b> ${esc(clOf(d.cl).n)}</span><span>${tmrHtml(d)}</span></div>`).join('')||'<p class="mut">Нет</p>'}</div>
 <div class="pan"><h3>Стоят на стоп-кранах <small>критические 1–3</small></h3>${bl.map(d=>`<div class="kv" onclick="openDeal('${d.id}')" style="cursor:pointer"><span><b>${d.id}</b> ${esc(CRIT[d.st])}</span><span class="lbl bad">${esc(missing(d).join(', '))}</span></div>`).join('')||'<p class="mut">Нет</p>'}</div>
 <div class="pan"><h3>Нет следующего шага <small>подсвечены красным</small></h3>${ns.map(d=>`<div class="kv" onclick="openDeal('${d.id}')" style="cursor:pointer"><span><b>${d.id}</b> ${esc(clOf(d.cl).n)}</span><span class="lbl bad">${esc(STN[d.st])} · задачи нет · ${esc(d.mgr)}</span></div>`).join('')||'<p class="mut">Нет</p>'}</div></div>
 <div class="g2"><div class="pan"><h3>Воронка продаж сейчас</h3>${ST.slice(0,8).map(s=>{const n=D.filter(d=>d.st===s[0]).length;return `<div class="kv"><span>${s[1]}</span><b class="num">${n}</b></div>`}).join('')}</div>
 <div class="pan"><h3>Проектный контур сейчас</h3>${ST.slice(8).map(s=>{const l=D.filter(d=>d.st===s[0]);return `<div class="kv"><span>${s[1]}</span><b class="num">${l.length} · ${tg(l.reduce((a,d)=>a+d.sum,0))}</b></div>`}).join('')}</div></div>
 <div class="pan"><h3>Последние уведомления <small>Telegram</small></h3>${TG.slice(0,5).map(t=>`<div class="kv"><span>${esc(t[2])}</span><span class="lbl">${esc(t[0])} · ${esc(t[1])}</span></div>`).join('')}</div>`};

/* --- воронка 3.1 --- */
let fMgr='все';
SC.funnel=()=>{const own=role!=='Менеджер';const L=D.filter(d=>!isProj(d)&&(own||d.mgr===ROLES[role].n)&&(fMgr==='все'||d.mgr===fMgr));const cols=ST.slice(0,8).concat([['lost','Отказ']]);
 return `<div class="hd"><div><h2>Воронка продаж · этапы 1–8 и «Отказ»</h2><p>Карточка не переходит дальше, пока не выполнено условие этапа — кнопка «Дальше» неактивна и показывает, чего не хватает. На этапе «Договор» автоматически создаётся проект (этап 9) с переносом истории и файлов.</p></div><div class="btns">${own?`<div class="chips" style="margin:0">${['все','Николай','Дана'].map(m=>`<a class="${fMgr===m?'on':''}" onclick="fMgr='${m}';build()">${m}</a>`).join('')}</div>`:''}<button class="bt p" onclick="newLead()">+ Заявка вручную</button></div></div>
 ${tz('3.1','8 этапов с условием перехода на каждом; отказ — с причиной из справочника и комментарием. Таймер 30 минут на первый ответ.')}
 <div class="kan" style="--kc:9">${cols.map(s=>{const l=L.filter(d=>d.st===s[0]);return `<div class="kcol"><div class="kh">${s[1]}<span>${l.length}</span></div>${l.map(d=>`<div class="kc ${noStep(d)?'red':''}" onclick="openDeal('${d.id}')"><b>${d.id} · ${esc(clOf(d.cl).n)}</b>${esc(d.type||'тип не выбран')} · ${esc(d.city||'город?')}<br><span class="lbl">${esc(d.src)}</span>${d.sum?`<span class="num"> · ${tg(d.sum)}</span>`:''}${tmrHtml(d)}${noStep(d)?'<span class="tmr lbl bad">нет следующего шага</span>':''}${s[0]==='lost'?`<span class="tmr lbl bad">${esc(d.lost[0])}</span>`:missing(d).length?`<span class="tmr lbl">не хватает: ${missing(d).length}</span>`:'<span class="tmr lbl ok">готово к переходу</span>'}</div>`).join('')}</div>`}).join('')}</div>`};

/* --- карточка сделки/проекта --- */
function actionsFor(d){const a=[];const B=(f,t,c)=>a.push(`<button class="bt ${c||''}" onclick="${f}">${t}</button>`);const id=`'${d.id}'`;
 switch(d.st){
  case 's1':if(!d.taken)B(`act(${id},'take')`,'Взять в работу · первый контакт','a');break;
  case 's2':B(`qual(${id})`,'Заполнить квалификацию','a');B(`act(${id},'nontarget')`,'Нецелевое → отказ');break;
  case 's3':B(`zamSet(${id})`,'Назначить замер в календаре','a');break;
  case 's4':if(!d.f.zam)B(`act(${id},'zamFile')`,'Загрузить лист замера и фото','a');break;
  case 's5':if(!d.f.calc)B(`act(${id},'calcFile')`,'Инженер: загрузить расчёт','a');else if(!d.f.calcOk)B(`act(${id},'calcOk')`,'Менеджер: принять расчёт','a');break;
  case 's6':if(!d.f.kpSent)B(`act(${id},'kpSend')`,'Сформировать КП и отправить в WhatsApp','a');if(!d.task)B(`taskSet(${id})`,'Назначить созвон');break;
  case 's7':B(`act(${id},'agree')`,'Клиент согласен','a');B(`act(${id},'recalc')`,'Правки → перерасчёт инженеру');if(!d.task)B(`taskSet(${id})`,'Назначить следующий шаг');break;
  case 's8':if(!reqOk(clOf(d.cl)))B(`rekv('${d.cl}')`,'Заполнить реквизиты','a');if(!d.f.contract)B(`act(${id},'contract')`,'Загрузить подписанный договор и график оплат','a');break;
  case 'p9':if(!d.paid.pre)B(`askPay(${id},'pre')`,'Запросить бухгалтера в мессенджер','a');break;
  case 'p10':if(d.fmt==='dav'&&!d.mat.davAct)B(`act(${id},'davAct')`,'Акт приёма давальческого сырья','a');if(d.fmt!=='dav'&&!d.mat.stock)B(`act(${id},'stock')`,'Наличие сырья подтверждено','a');if(!d.mat.lzk)B(`act(${id},'lzk')`,'Оформить ЛЗК в цех','a');if(!d.due)B(`act(${id},'due')`,'Задать срок готовности');break;
  case 'p11':if(!d.ready)B(`act(${id},'ready')`,'Цех: изделия готовы и укомплектованы','a');B(`resched(${id})`,'Перенести дату готовности');if(d.prodDays>=5)B(`act(${id},'inform')`,'Клиент проинформирован');break;
  case 'p12':if(!d.paid.ship)B(`askPay(${id},'ship')`,'Счёт на доплату + запрос бухгалтеру','a');break;
  case 'p13':if(!d.mon.br)B(`act(${id},'brig')`,'Назначить бригаду и дату','a');if(!d.mon.photo)B(`act(${id},'photo')`,'Загрузить фотоотчёт','a');break;
  case 'p14':if(!d.act){B(`act(${id},'actSigned')`,'Загрузить подписанный акт','a');B(`act(${id},'noshow')`,'Акт о неявке заказчика')}if(d.pyr.back<d.pyr.out)B(`act(${id},'pyr')`,'Склад: пирамиды вернулись','a');if(!d.rest)B(`act(${id},'rest')`,'Склад: остатки возвращены','a');break;
 }
 if(!['lost','p15'].includes(d.st)){if(!isProj(d))B(`lose(${id})`,'Отказ');}
 return a.join('')}
SC.deal=()=>{const d=byId(curDeal)||D[0];const c=clOf(d.cl);const i=SI(d.st);const own=role==='Руководитель';const ms=missing(d);const crit=CRIT[d.st];
 const stg=`<div class="stg">${ST.map((s,k)=>`<i class="${d.st==='lost'?'l':k<i?'d':k===i?'c':''}" title="${s[1]}"></i>`).join('')}</div>`;
 const gate=d.st==='lost'||d.st==='p15'?'':`<div class="${crit?'crit':'gatebox'}">${crit?`<b>${crit}</b> — обязательная блокировка по ТЗ<br>`:''}<b style="color:inherit">Условие перехода «${esc(STN[d.st])}» → «${esc(ST[i+1]?ST[i+1][1]:'')}»</b><ul>${need(d).map(x=>`<li class="${x[0]?'y':''}">${esc(x[1])}</li>`).join('')}</ul>${d.unl[d.st]?'<span class="lbl w">разблокировано руководителем вручную — запись в журнале</span>':''}</div>`;
 const files=[['f1','1. Замеры и фото проёмов'],['f2','2. Инженерные расчёты и чертежи'],['f3','3. Коммерческие предложения (версии)'],['f4','4. Договор, спецификация, доверенность'],['f5','5. Движение материалов и давальческое'],['f6','6. Фото монтажа, акты, дефектные ведомости']];
 return `<div class="hd"><div><h2>${d.id} · ${esc(c.n)}</h2><p>${isProj(d)?'Проект':'Сделка'} · ${esc(STN[d.st])} · ответственный: ${esc(RESP[d.st]||'—')} · менеджер ${esc(d.mgr)}</p></div><div class="btns"><select class="sel" style="width:auto" onchange="openDeal(this.value)">${D.map(x=>`<option value="${x.id}" ${x.id===d.id?'selected':''}>${x.id} · ${esc(clOf(x.cl).n)} · ${esc(STN[x.st])}</option>`).join('')}</select></div></div>
 ${stg}${tmrHtml(d)}${noStep(d)?'<div class="crit"><b>Нет следующего шага.</b> Правило ТЗ п. 5: у активной сделки должна быть открытая задача с датой и временем.</div>':''}
 <div class="g21"><div>
  <div class="pan"><h3>Действия на этапе</h3><div class="btns">${actionsFor(d)}</div>${gate}
   ${d.st!=='lost'&&d.st!=='p15'?`<div class="btns"><button class="bt p" ${blocked(d)?'disabled':''} onclick="next('${d.id}')">Дальше → ${esc(ST[i+1]?ST[i+1][1]:'')}</button>${blocked(d)&&own?`<button class="bt" onclick="unlock('${d.id}')">Разблокировать вручную (руководитель)</button>`:''}${d.task?`<button class="bt" onclick="resched('${d.id}')">Перенести задачу</button>`:''}</div>`:''}
   ${d.st==='lost'?`<p class="bad">Отказ: <b>${esc(d.lost[0])}</b> — ${esc(d.lost[1])}</p>`:''}</div>
  <div class="pan"><h3>Карточка проекта <small>ТЗ п. 4.2</small></h3>
   <div class="kv"><span>Формат работы</span><b>${esc(FMT[d.fmt]||'—')}</b></div><div class="kv"><span>Тип конструкции</span><b>${esc(d.type||'—')}</b></div>
   <div class="kv"><span>Локация</span><b>${esc((d.city||'—')+(d.addr?', '+d.addr:''))}</b></div><div class="kv"><span>Направление</span><b>${esc(DIRN[dirOf(d)])}</b></div>
   <div class="kv"><span>Источник</span><b>${esc(d.src)}</b></div><div class="kv"><span>Страница / метки</span><span class="mono sm2">${esc(d.page)} ${esc(d.utm)}</span></div>
   <div class="kv"><span>Целевое обращение</span><b>${d.target===true?'да':d.target===false?'нет':'—'}</b></div><div class="kv"><span>Замер</span><b>${esc(d.zam.date||'—')} ${esc(d.zam.contact)}</b></div>
   <div class="kv"><span>Задача</span><b class="${d.task?'':'bad'}">${d.task?esc(d.task.t)+' · '+esc(d.task.d):'нет'}</b></div><div class="kv"><span>Версии</span><b>расчёт v${d.calcV} · КП v${d.kpV}</b></div></div>
  <div class="g2"><div class="pan"><h3>Учёт материалов и тары</h3>
   <div class="kv"><span>Акт приёма давальческого</span><b>${d.fmt==='dav'?(d.mat.davAct?'подписан':'нет'):'не требуется'}</b></div>
   <div class="kv"><span>ЛЗК в цех</span><b>${d.mat.lzk?esc(d.mat.lzk.n+' от '+d.mat.lzk.d):'—'}</b></div>
   <div class="kv"><span>Срок готовности</span><b>${esc(d.due||'—')}</b></div>
   <div class="kv"><span>Пирамиды выдано / возвращено</span><b class="${d.pyr.back<d.pyr.out?'bad':''}">${d.pyr.out} / ${d.pyr.back}</b></div>
   <div class="kv"><span>Остатки профиля и фурнитуры</span><b>${d.rest?'возвращены':isProj(d)&&SI(d.st)>=12?'ждём склад':'—'}</b></div></div>
  <div class="pan"><h3>Финансы и график платежей</h3>${role==='Инженер-расчётчик'?'<p class="mut">Цены скрыты для роли.</p>':`
   <div class="kv"><span>Сумма договора</span><b>${d.sum?tg(d.sum):'—'}</b></div>
   <div class="kv"><span>Предоплата</span><b class="${d.paid.pre?'ok':''}">${tg(d.plan[0])} ${d.paid.pre?'✓ подтверждено':''}</b></div>
   <div class="kv"><span>Перед отгрузкой</span><b class="${d.paid.ship?'ok':''}">${tg(d.plan[1])} ${d.paid.ship?'✓ подтверждено':''}</b></div>
   <div class="kv"><span>Окончательный расчёт</span><b class="${d.paid.fin?'ok':''}">${tg(d.plan[2])} ${d.paid.fin?'✓':''}</b></div>
   <div class="kv tot"><span>Задолженность</span><b>${tg(Math.max(0,d.sum-paidSum(d)))}</b></div>`}</div></div>
  <div class="pan"><h3>Хранилище файлов <small>предпросмотр без скачивания</small></h3><div class="fold">${files.map(f=>`<div><b>${f[1]}</b>${d.files[f[0]].map(n=>`<a onclick="prev('${esc(n)}')">${esc(n)}</a>`).join('')||'<span class="mut sm2">пусто</span>'}</div>`).join('')}</div></div>
 </div><div>
  <div class="pan"><h3>Контрагент <small>${esc(c.t)}</small></h3><div class="kv"><span>${isUL(c)?'БИН':'ИИН'}</span><b class="mono">${esc(c.bin||c.iin)}</b></div><div class="kv"><span>Телефон</span><b>${esc(c.ph)}</b></div><div class="kv"><span>Реквизиты</span><b class="${reqOk(c)?'ok':'bad'}">${reqOk(c)?'полные':'не хватает'}</b></div><div class="btns l"><button class="bt sm" onclick="rekv('${c.id}')">Открыть реквизиты</button><button class="bt sm" onclick="toast('Звонок ${esc(c.ph)} через облачную АТС — запись попадёт в ленту.')">Позвонить</button></div></div>
  <div class="pan"><h3>Единая лента <small>переписка, звонки, события</small></h3><div class="tl">${d.hist.slice(0,14).map(h=>`<div><small>${esc(h[0])}</small>${esc(h[1])}</div>`).join('')}</div></div>
 </div></div>`};

/* --- контрагенты и дубли --- */
let dupQ='';
SC.cl=()=>{const q=dupQ.replace(/\D/g,'');const hit=q.length>=6?CL.filter(c=>(c.ph.replace(/\D/g,'').includes(q))||((c.bin||c.iin||'').includes(q))):[];
 return `<div class="hd"><div><h2>Контрагенты · проверка дублей</h2><p>Физлица, ТОО и ИП. Перед этапом «Договор» обязательны полные реквизиты. При создании новой карточки система ищет совпадения по телефону и БИН/ИИН.</p></div><button class="bt p" onclick="rekv('new')">+ Новый контрагент</button></div>
 ${tz('4.1','Тип контрагента; обязательные реквизиты; защита от дублей по номеру телефона и идентификационному номеру.')}
 <div class="pan"><h3>Проверка дубля</h3><div class="g2"><label class="fld"><span>Телефон или БИН/ИИН</span><input class="inp" id="dq" value="${esc(dupQ)}" placeholder="например 7152461230"></label><div class="btns" style="align-items:end"><button class="bt a" onclick="dupQ=document.getElementById('dq').value;build()">Проверить</button><button class="bt" onclick="dupQ='+7 7152 46 12 30';build()">Пример: дубль по телефону</button></div></div>
 ${q.length>=6?(hit.length?`<div class="crit"><b>Найден дубль:</b> ${hit.map(c=>`${esc(c.n)} (${esc(c.ph)}, ${esc(c.bin||c.iin)}) — сделки: ${D.filter(d=>d.cl===c.id).map(d=>d.id).join(', ')}`).join('; ')}. Новая карточка не создаётся — откройте существующую.</div>`:'<p class="ok">Совпадений нет — можно создавать.</p>'):''}</div>
 <div class="pan">${tbl(['Контрагент','Тип','БИН / ИИН','Телефон','Реквизиты','Сделки'],CL.map(c=>`<tr onclick="rekv('${c.id}')"><td><b>${esc(c.n)}</b><br><span class="lbl">${esc(c.addr)}</span></td><td>${c.t}</td><td class="mono">${esc(c.bin||c.iin)}</td><td>${esc(c.ph)}</td><td><span class="lbl ${reqOk(c)?'ok':'bad'}">${reqOk(c)?'полные':'не хватает'}</span></td><td>${D.filter(d=>d.cl===c.id).map(d=>d.id).join(', ')}</td></tr>`))}</div>`};

/* --- задачи и переносы --- */
SC.tasks=()=>{const L=D.filter(d=>!['lost','p15'].includes(d.st)&&(role!=='Менеджер'||d.mgr===ROLES[role].n));
 return `<div class="hd"><div><h2>Задачи и переносы сроков</h2><p>«Нет сделки без следующего шага»: сделки без задачи — красным. Перенос любой даты — только с причиной и комментарием, уведомление уходит менеджеру и руководителю.</p></div></div>
 ${tz('5','Нет сделки без следующего шага; запрет тихого переноса; таймеры 30 мин / 48 ч / 24 ч / напоминание каждые 5–7 дней в производстве.')}
 <div class="pan"><h3>Открытые задачи и таймеры</h3>${tbl(['Сделка','Этап','Задача','Таймеры','Менеджер',''],L.map(d=>`<tr><td onclick="openDeal('${d.id}')" style="cursor:pointer"><b>${d.id}</b> ${esc(clOf(d.cl).n)}</td><td>${esc(STN[d.st])}</td><td class="${noStep(d)?'bad':''}">${d.task?esc(d.task.t+' · '+d.task.d):noStep(d)?'<b>нет задачи</b>':'—'}</td><td>${tmrHtml(d)||'—'}</td><td>${esc(d.mgr)}</td><td>${d.task?`<button class="bt sm" onclick="resched('${d.id}')">Перенести</button>`:`<button class="bt sm a" onclick="taskSet('${d.id}')">Поставить</button>`}</td></tr>`))}</div>
 <div class="pan"><h3>Журнал переносов <small>причина обязательна</small></h3>${tbl(['Когда','Сделка','Что','Причина','Комментарий','Уведомлены'],NOTE.map(n=>`<tr><td class="mono">${esc(n[0])}</td><td>${esc(n[1])}</td><td>${esc(n[2])}</td><td>${esc(n[3])}</td><td>${esc(n[4])}</td><td>${esc(n[5])}</td></tr>`))}</div>`};

/* --- замеры --- */
SC.zam=()=>{const L=D.filter(d=>d.zam.date);return `<div class="hd"><div><h2>Календарь замеров</h2><p>Менеджер выбирает слот — замерщик получает наряд в системе и дублем в мессенджер: адрес, время, контакт на объекте и ссылку для загрузки листа замера.</p></div></div>
 ${tz('8.1','Выделенный замерщик; задачи в календаре системы с автоотправкой в мессенджер.')}
 <div class="pan">${tbl(['Дата и время','Сделка','Адрес','Контакт на объекте','Замерщик','Статус'],L.map(d=>`<tr onclick="${allowed('deal')?`openDeal('${d.id}')`:`go('zmob')`}"><td class="mono">${esc(d.zam.date)}</td><td><b>${d.id}</b> ${esc(d.type||'')}</td><td>${esc(d.city+', '+d.addr)}</td><td>${esc(d.zam.contact)}</td><td>Артём</td><td><span class="lbl ${d.f.zam?'ok':'w'}">${d.f.zam?'лист замера загружен':'назначен'}</span></td></tr>`))}</div>
 <div class="pan"><h3>Свободные слоты на неделю</h3><div class="chips">${['27.11 09:00','27.11 15:00','28.11 10:00','28.11 14:00','30.11 11:00'].map(s=>`<a onclick="toast('Слот ${s} — выберите сделку в карточке и нажмите «Назначить замер».')">${s}</a>`).join('')}</div></div>`};
SC.zmob=()=>{const L=D.filter(d=>d.st==='s3'||d.st==='s4');return `<div class="hd"><div><h2>Замерщик с телефона</h2><p>Наряд пришёл в WhatsApp со ссылкой. По ссылке — эта страница: лист замера, эскизы, фото и видео проёмов и подъезда.</p></div></div>
 <div class="g2"><div class="phone"><div class="pt"><span>Артём · замерщик</span><span>${NOW}</span></div>${L.map(d=>`<div class="pc"><b>${d.id} · ${esc(d.zam.date)}</b>${esc(d.city+', '+d.addr)}<br><span class="lbl">${esc(d.zam.contact)}</span><div class="btns l">${d.f.zam?'<span class="lbl ok">лист замера загружен → задача инженеру, таймер 48 ч</span>':`<button class="bt sm a" onclick="act('${d.id}','zamFile')">Загрузить лист замера + фото</button>`}</div></div>`).join('')||'<p class="mut">Нарядов нет</p>'}</div>
 <div class="pan"><h3>Дубль наряда в мессенджере</h3><div class="msg"><small>WhatsApp · Алпроф СКО</small>🔧 Замер ${esc(L[0]?L[0].zam.date:'')}<br>${esc(L[0]?L[0].city+', '+L[0].addr:'')}<br>Контакт: ${esc(L[0]?L[0].zam.contact:'')}<br>Загрузить лист замера: alprof.kz/z/${L[0]?L[0].id:''}</div><p class="mut sm2">Ссылка открывает мобильную форму без входа в полный интерфейс. Финансы и чужие клиенты замерщику не видны.</p></div></div>`};
SC.eng=()=>{const L=D.filter(d=>['s4','s5','s7'].includes(d.st)&&d.f.zam);return `<div class="hd"><div><h2>Инженер-расчётчик · ПТО</h2><p>После загрузки листа замера задача приходит автоматически. Таймер 48 часов на расчёт и КП. Переписка с клиентом и цены продажи инженеру не видны.</p></div></div>
 ${tz('3.1 этап 5','Расчёт и спецификация (таблицы или документы), загрузка в карточку, уведомление менеджеру; при правках — перерасчёт с сохранением версий.')}
 <div class="pan">${tbl(['Сделка','Тип','Замер','Версия расчёта','Таймер 48 ч',''],L.map(d=>`<tr><td><b>${d.id}</b></td><td>${esc(d.type)} · ${esc(FMT[d.fmt]||'')}</td><td>${d.files.f1.map(n=>`<a class="lbl i" style="cursor:pointer" onclick="prev('${esc(n)}')">${esc(n)}</a>`).join('<br>')}</td><td>v${d.calcV}</td><td>${tmrHtml(d)||'—'}</td><td>${!d.f.calc?`<button class="bt sm a" onclick="act('${d.id}','calcFile')">Загрузить расчёт</button>`:'<span class="lbl ok">загружен, ждёт приёмки менеджером</span>'}</td></tr>`))}</div>
 <div class="pan"><h3>Складские остатки для расчёта <small>без цен продажи</small></h3>${tbl(['Позиция','Остаток','Резерв','Поставка'],STK.map(s=>`<tr><td>${esc(s[0])}</td><td class="r">${esc(s[1])}</td><td class="r">${esc(s[2])}</td><td>${esc(s[3])}</td></tr>`))}</div>`};

/* --- проекты 3.2 --- */
SC.proj=()=>{const cols=ST.slice(8);return `<div class="hd"><div><h2>Проектный контур · этапы 9–15</h2><p>Проект создаётся автоматически при подписании договора. Три критических стоп-крана: запуск в цех, отгрузка и монтаж, закрытие проекта.</p></div></div>
 ${tz('3.2','Запуск в производство — только с договором, листом замера и подтверждённой предоплатой; отгрузка и выезд — только после оплаты перед отгрузкой; закрытие — только с актом и возвратом пирамид и остатков.')}
 <div class="kan" style="--kc:7">${cols.map(s=>{const l=D.filter(d=>d.st===s[0]);return `<div class="kcol"><div class="kh">${s[1]}<span>${l.length}</span></div>${l.map(d=>`<div class="kc ${CRIT[d.st]&&blocked(d)?'lock':''}" onclick="${allowed('deal')?`openDeal('${d.id}')`:`quick('${d.id}')`}"><b>${d.id} · ${esc(clOf(d.cl).n)}</b>${esc(d.type)} · ${esc(FMT[d.fmt].split(' (')[0])}${role!=='Производство / Склад'?`<span class="num"> · ${tg(d.sum)}</span>`:''}${tmrHtml(d)}${CRIT[d.st]&&blocked(d)?`<span class="tmr lbl bad">🔒 ${esc(CRIT[d.st].split(' · ')[0])}</span>`:''}${missing(d).length?`<span class="tmr lbl">не хватает: ${esc(missing(d).join(', '))}</span>`:''}</div>`).join('')}</div>`}).join('')}</div>`};
function quick(id){const d=byId(id);openM(`${d.id} · ${esc(STN[d.st])}`,esc(clOf(d.cl).n)+' · '+esc(d.type),`<div class="btns">${actionsFor(d)}<button class="bt p" ${blocked(d)?'disabled':''} onclick="closeM();next('${d.id}')">Дальше</button></div><div class="gatebox"><ul>${need(d).map(x=>`<li class="${x[0]?'y':''}">${esc(x[1])}</li>`).join('')}</ul></div>`)}

/* --- материалы --- */
const STK=[['Стекло закалённое 10 мм','46 м²','28 м²','крит.: поставка 29.11, Астана'],['Стекло крупноформатное 3,2×6 м','6 листов','4','крит.: под заказ, 14 дней'],['Профиль тёплый (система 70)','212 хлыст','96','на складе'],['Профиль холодный (система 50)','148 хлыст','40','на складе'],['Покраска RAL 7016 (нестандарт)','—','—','крит.: 10 дней, внешний покрасчик'],['Автоматика раздвижных дверей','2 компл.','2','крит.: поставка 04.12'],['Фурнитура дверная','64 компл.','18','на складе']];
SC.mat=()=>{const P=D.filter(isProj);return `<div class="hd"><div><h2>Материалы, лимитно-заборные карты, пирамиды</h2><p>Давальческое сырьё принимается по акту и учитывается отдельно от своего склада. Отпуск в цех — по ЛЗК. После монтажа — 24 часа на возврат пирамид и остатков.</p></div><button class="bt p" onclick="act('A-128','davAct')">+ Акт приёма давальческого</button></div>
 ${tz('1.2, 4.2','Фиксация приёмки давальческого сырья, отпуска в цех по ЛЗК и возврата остатков и пирамид в течение 24 часов после монтажа.')}
 <div class="g2"><div class="pan"><h3>Давальческое сырьё <small>учёт отдельно</small></h3>${tbl(['Проект','Заказчик','Акт приёма','Состав'],P.filter(d=>d.fmt==='dav').map(d=>`<tr><td><b>${d.id}</b></td><td>${esc(clOf(d.cl).n)}</td><td>${d.mat.davAct?'<span class="lbl ok">подписан</span>':`<button class="bt sm a" onclick="act('${d.id}','davAct')">Принять по акту</button>`}</td><td class="sm2">профиль 48 хлыст., стеклопакеты 22 шт., фурнитура 6 компл.</td></tr>`))}</div>
 <div class="pan"><h3>Лимитно-заборные карты</h3>${tbl(['Проект','ЛЗК','Лимит по спецификации','Перерасход'],P.filter(d=>SI(d.st)>=9).map(d=>`<tr><td><b>${d.id}</b></td><td>${d.mat.lzk?esc(d.mat.lzk.n+' от '+d.mat.lzk.d):`<button class="bt sm a" onclick="act('${d.id}','lzk')">Оформить</button>`}</td><td class="sm2">профиль ${Math.round(d.sum/52000)} хлыст., стекло ${Math.round(d.sum/68000)} м²</td><td>${d.id==='A-126'?'<span class="lbl w">+2 хлыста · брак резки</span>':'—'}</td></tr>`))}</div></div>
 <div class="pan"><h3>Пирамиды и остатки после монтажа <small>таймер 24 ч</small></h3>${tbl(['Проект','Выдано пирамид','Возвращено','Остатки','Таймер',''],P.filter(d=>d.pyr.out>0).map(d=>`<tr><td><b>${d.id}</b> ${esc(clOf(d.cl).n)}</td><td class="r">${d.pyr.out}</td><td class="r ${d.pyr.back<d.pyr.out?'bad':''}">${d.pyr.back}</td><td>${d.rest?'возвращены':'—'}</td><td>${tmrHtml(d)||'—'}</td><td>${d.pyr.back<d.pyr.out?`<button class="bt sm a" onclick="act('${d.id}','pyr')">Принять пирамиды</button>`:''}${!d.rest&&SI(d.st)>=13?`<button class="bt sm" onclick="act('${d.id}','rest')">Принять остатки</button>`:''}</td></tr>`))}</div>
 <div class="pan"><h3>Критичные позиции снабжения <small>ТЗ п. 8.5</small></h3>${tbl(['Позиция','Остаток','Резерв','Поставка'],STK.map(s=>`<tr><td>${esc(s[0])}</td><td class="r">${esc(s[1])}</td><td class="r">${esc(s[2])}</td><td class="${/крит/.test(s[3])?'bad':''}">${esc(s[3])}</td></tr>`))}</div>`};

/* --- монтаж --- */
SC.mont=()=>{const P=D.filter(d=>['p12','p13','p14'].includes(d.st));return `<div class="hd"><div><h2>Монтаж и наряды</h2><p>Назначить бригаду можно только после подтверждения оплаты перед отгрузкой (стоп-кран 2). Наряд уходит бригадиру в систему и дублем в мессенджер.</p></div></div>
 ${tz('3.2 этап 13','Назначение бригады и даты; проверочный лист отгрузки (изделия, комплектующие, пирамиды); фотоотчёт.')}
 <div class="pan">${tbl(['Проект','Адрес','Этап','Оплата перед отгрузкой','Бригада и дата','Фото',''],P.map(d=>`<tr><td><b>${d.id}</b> ${esc(clOf(d.cl).n)}</td><td>${esc(d.city+', '+d.addr)}</td><td>${esc(STN[d.st])}</td><td>${d.paid.ship?'<span class="lbl ok">подтверждена</span>':'<span class="lbl bad">🔒 нет — выезд заблокирован</span>'}</td><td>${esc(d.mon.br?d.mon.br+' · '+d.mon.date:'—')}</td><td>${d.mon.photo?'✓':'—'}</td><td>${d.st==='p13'&&!d.mon.br?`<button class="bt sm a" onclick="act('${d.id}','brig')">Назначить</button>`:''}${d.st==='p12'?`<button class="bt sm" disabled title="Сначала оплата">Назначить</button>`:''}</td></tr>`))}</div>
 <div class="pan"><h3>Проверочный лист отгрузки · A-124</h3>${[['Изделия: окна 5 шт.',1],['Комплектующие: подоконники, отливы, пена',1],['Пирамиды: 4 шт. (№ 11, 12, 17, 21)',1],['Крепёж и герметик',1]].map(x=>`<div class="kv"><span>${x[0]}</span><b class="ok">✓</b></div>`).join('')}</div>`};
SC.mmob=()=>{const L=D.filter(d=>['p13','p14'].includes(d.st));return `<div class="hd"><div><h2>Бригадир с телефона</h2><p>Наряд, адрес, контакт, фото «до и после», дефектная ведомость, подписанный акт или акт о неявке.</p></div></div>
 <div class="g2"><div class="phone"><div class="pt"><span>Сергей · бригада 1</span><span>${NOW}</span></div>${L.map(d=>`<div class="pc"><b>${d.id} · ${esc(d.mon.date)}</b>${esc(d.city+', '+d.addr)}<br><span class="lbl">${esc(clOf(d.cl).n)} · ${esc(clOf(d.cl).ph)}</span><div class="btns l">${!d.mon.photo?`<button class="bt sm a" onclick="act('${d.id}','photo')">Фото до / после</button>`:'<span class="lbl ok">фото ✓</span>'}${d.st==='p14'&&!d.act?`<button class="bt sm a" onclick="act('${d.id}','actSigned')">Акт подписан</button><button class="bt sm" onclick="act('${d.id}','noshow')">Акт о неявке</button>`:''}<button class="bt sm" onclick="defect('${d.id}')">Дефектная ведомость</button></div></div>`).join('')}</div>
 <div class="pan"><h3>Проверка полномочий подписанта</h3><p class="sm2">При загрузке акта бригадир указывает, кто подписал: ФИО и основание (доверенность, приказ). Если представитель уклоняется — акт о неявке с фото и временем. ТЗ п. 8.6.</p><div class="msg"><small>WhatsApp · наряд</small>🛠 Монтаж ${esc(L[0]?L[0].mon.date:'')} · ${esc(L[0]?L[0].addr:'')}<br>Загрузить фото и акт: alprof.kz/m/${L[0]?L[0].id:''}</div></div></div>`};

/* --- бухгалтерия --- */
SC.pay=()=>{const L=D.filter(d=>(d.st==='p9'&&!d.paid.pre)||(d.st==='p12'&&!d.paid.ship));return `<div class="hd"><div><h2>Ожидают подтверждения оплаты</h2><p>Бухгалтер видит только этот реестр и карточку договора. Увидев поступление в 1С, нажимает одну кнопку — проект разблокируется.</p></div></div>
 ${tz('2, 3.2 этап 9 и 12','Подтверждение поступления предоплаты и доплаты перед отгрузкой в один клик по уведомлению в мессенджере.')}
 <div class="pan">${tbl(['Проект','Контрагент','Платёж','>Сумма','Договор',''],L.map(d=>{const k=d.st==='p9'?'pre':'ship';return `<tr><td><b>${d.id}</b></td><td>${esc(clOf(d.cl).n)}</td><td>${k==='pre'?'Предоплата':'Оплата перед отгрузкой'}</td><td class="r">${tg(d.plan[k==='pre'?0:1])}</td><td><a class="lbl i" style="cursor:pointer" onclick="curDeal='${d.id}';go('ctr')">открыть</a></td><td><button class="bt sm a" onclick="confirmPay('${d.id}','${k}')">${k==='pre'?'Предоплата подтверждена':'Оплата перед отгрузкой подтверждена'}</button></td></tr>`}))}</div>
 <div class="pan"><h3>Как приходит запрос</h3><div class="msg"><small>Telegram · бот Алпроф</small>💳 Подтвердите оплату: A-129 · ТОО «СеверСтрой-П» · предоплата 2 560 000 ₸<br>Открыть: alprof.kz/pay/A-129</div></div>`};
SC.ctr=()=>{const d=byId(curDeal)&&isProj(byId(curDeal))?byId(curDeal):D.find(x=>x.st==='p9');const c=clOf(d.cl);return `<div class="hd"><div><h2>Карточка договора · ${d.id}</h2><p>Только данные для сверки оплаты: стороны, сумма, график, фактические оплаты.</p></div><select class="sel" style="width:auto" onchange="curDeal=this.value;build()">${D.filter(isProj).map(x=>`<option value="${x.id}" ${x.id===d.id?'selected':''}>${x.id} · ${esc(clOf(x.cl).n)}</option>`).join('')}</select></div>
 <div class="g2"><div class="pan"><h3>Стороны</h3><div class="kv"><span>Контрагент</span><b>${esc(c.n)}</b></div><div class="kv"><span>${isUL(c)?'БИН':'ИИН'}</span><b class="mono">${esc(c.bin||c.iin)}</b></div><div class="kv"><span>Банк</span><b>${esc(c.bank||'—')}</b></div><div class="kv"><span>ИИК</span><b class="mono">${esc(c.iik||'—')}</b></div><div class="kv"><span>Подписант</span><b>${esc(c.sg||c.n)}</b></div></div>
 <div class="pan"><h3>График и факт</h3>${['Предоплата','Перед отгрузкой','Окончательный расчёт'].map((n,i)=>{const k=['pre','ship','fin'][i];return `<div class="kv"><span>${n}</span><b class="${d.paid[k]?'ok':''}">${tg(d.plan[i])} ${d.paid[k]?'✓':''}</b></div>`}).join('')}<div class="kv tot"><span>Остаток</span><b>${tg(Math.max(0,d.sum-paidSum(d)))}</b></div>
 ${d.st==='p9'&&!d.paid.pre?`<button class="bt a" onclick="confirmPay('${d.id}','pre')">Предоплата подтверждена</button>`:''}${d.st==='p12'&&!d.paid.ship?`<button class="bt a" onclick="confirmPay('${d.id}','ship')">Оплата перед отгрузкой подтверждена</button>`:''}</div></div>
 <div class="pan"><h3>Документы</h3><div class="fold"><div><b>Договор и спецификация</b>${d.files.f4.map(n=>`<a onclick="prev('${esc(n)}')">${esc(n)}</a>`).join('')}</div></div></div>`};

/* --- каналы --- */
let CH=[{n:'ТОО «Арай-Сервис»',ch:'Сайт',id:'A-139',m:[['c','Форма «Заказ замера»: входная группа 2,4×2,6, чертёж во вложении. Стр. /zamer','13:48'],['m','Здравствуйте! Заявку получили, менеджер свяжется в течение 30 минут. — Алпроф СКО','13:48']]},
 {n:'Андрей Мельник',ch:'Instagram',id:'A-138',m:[['c','Реклама «Тёплые двери» — сколько стоит дверь с порогом?','13:13']]},
 {n:'Елена Смирнова',ch:'WhatsApp',id:'A-137',m:[['c','Добрый день, нужны окна в частный дом в Боровском','11:00'],['m','Здравствуйте, Елена! Сколько проёмов и какой профиль рассматриваете?','11:06'],['c','5 окон, тёплый алюминий','11:20']]},
 {n:'Виктор Ли',ch:'Звонок',id:'A-133',m:[['c','📞 Входящий 4:12 · запись разговора','вчера'],['m','КП v1 отправлено в WhatsApp','вчера']]},
 {n:'ИП Сабитов',ch:'Звонок',id:'A-136',m:[['c','📞 Пропущенный · номер с сайта (коллтрекинг 2ГИС) → автозадача «Перезвонить»','25.11']]}];
let curCh=0;
SC.inbox=()=>{const c=CH[curCh];return `<div class="hd"><div><h2>Единое окно</h2><p>Сайт, WhatsApp, Instagram и рекламные формы, звонки с записью — в одной ленте и в карточке клиента. Новый номер — автоматически новая заявка.</p></div><div class="btns"><button class="bt" onclick="missed()">Симулировать пропущенный звонок</button></div></div>
 <div class="chat"><div class="pan cl">${CH.map((x,i)=>`<a class="${i===curCh?'on':''}" onclick="curCh=${i};build()"><b>${esc(x.n)}</b><span>${esc(x.ch)} · ${esc(x.id)}</span></a>`).join('')}</div>
 <div class="pan"><h3>${esc(c.n)} <small>${esc(c.ch)} · ${esc(c.id)}</small></h3>${c.m.map(m=>`<div class="msg ${m[0]==='m'?'me':''}"><small>${esc(m[2])}</small>${esc(m[1])}</div>`).join('')}
 <div class="btns l"><button class="bt a" onclick="sendMsg()">Отправить ответ</button><button class="bt" onclick="sendKp()">Отправить КП</button><button class="bt" onclick="toast('Звонок в один клик: облачная АТС набирает клиента, запись попадёт в ленту.')">Позвонить</button><button class="bt" onclick="openDeal('${c.id}')">Открыть сделку</button></div></div></div>`};
const FORMS=[['Заказ замера','/zamer','Входные группы',38],['Расчёт стоимости','/raschet','Витражи',26],['Обратный звонок','виджет',null,41],['Скачать каталог','/katalog',null,19],['Заявка на давальческое сырьё','/davalcheskoe','Витражи',9]];
SC.site=()=>`<div class="hd"><div><h2>Сайт: формы, виджет, коллтрекинг</h2><p>Любая форма сайта создаёт карточку: продукт, файлы и чертежи, город, страница, рекламные метки. Клиенту — автоприветствие в WhatsApp, менеджеру — уведомление и таймер 30 минут.</p></div></div>
 ${tz('6, 6.1','Все формы и виджеты сайта; передача продукта, файлов, города, страницы и меток; коллтрекинг; единый виджет связи.')}
 <div class="pan"><h3>Формы сайта <small>за ноябрь</small></h3>${tbl(['Форма','Страница','Продукт по умолчанию','>Заявок',''],FORMS.map((f,i)=>`<tr><td><b>${esc(f[0])}</b></td><td class="mono">${esc(f[1])}</td><td>${esc(f[2]||'клиент выбирает')}</td><td class="r">${f[3]}</td><td><button class="bt sm a" onclick="siteLead(${i})">Отправить тестовую заявку</button></td></tr>`))}</div>
 <div class="g2"><div class="pan"><h3>Коллтрекинг · номера по каналам</h3>${tbl(['Номер','Канал',''],[['+7 7152 50 01 01','Яндекс Директ'],['+7 7152 50 01 02','Google Ads'],['+7 7152 50 01 03','Instagram'],['+7 7152 50 01 04','2ГИС'],['+7 7152 50 01 05','SEO / прямые']].map(n=>`<tr><td class="mono">${n[0]}</td><td>${n[1]}</td><td><button class="bt sm" onclick="ctCall('${n[1]}')">Тестовый звонок</button></td></tr>`))}<p class="mut sm2">Подмена номеров — сторонний сервис коллтрекинга; система принимает источник звонка в карточку.</p></div>
 <div class="pan"><h3>Виджет связи на сайте</h3><div class="sk" style="min-height:180px;flex-direction:column;gap:8px"><button class="bt a" onclick="siteLead(2)">💬 Написать в WhatsApp</button><button class="bt" onclick="siteLead(2)">📞 Перезвоните мне</button><span class="lbl">текст обращения и источник перехода уходят в карточку</span></div></div></div>`;
SC.ads=()=>`<div class="hd"><div><h2>Передача статусов в рекламу и веб-аналитику</h2><p>Когда сделка получает статус «Целевое обращение», «Замер назначен» или «Договор оплачен», система отправляет событие в рекламный кабинет и в Метрику / GA — реклама учится на реальных покупателях.</p></div><button class="bt" onclick="ADS.forEach(a=>a[4]='отправлено');toast('Повторная отправка выполнена.');build()">Повторить отправку</button></div>
 ${tz('6, 6.1','Обратная передача статусов «Целевое обращение», «Замер назначен», «Договор оплачен» в рекламный кабинет и системы веб-аналитики.')}
 <div class="pan">${tbl(['Когда','Сделка','Статус','Куда','Результат'],ADS.slice(0,24).map(a=>`<tr><td class="mono">${esc(a[0])}</td><td>${esc(a[1])}</td><td><b>${esc(a[2])}</b></td><td>${esc(a[3])}</td><td><span class="lbl ok">${esc(a[4])}</span></td></tr>`))}</div>`;
SC.tgn=()=>`<div class="hd"><div><h2>Уведомления в Telegram</h2><p>Персональные: новая заявка, угроза или просрочка срока, передача задачи между отделами, запрос бухгалтеру на подтверждение оплаты, сбой подключения WhatsApp.</p></div><button class="bt" onclick="tgPush('Ерлан Сапаров','Тест: сбой подключения WhatsApp — шлюз переподключён');toast('Тестовое уведомление отправлено.');build()">Тест: сбой WhatsApp</button></div>
 <div class="pan">${tbl(['Когда','Кому','Сообщение'],TG.slice(0,25).map(t=>`<tr><td class="mono">${esc(t[0])}</td><td>${esc(t[1])}</td><td>${esc(t[2])}</td></tr>`))}</div>`;

/* --- аналитика (ТЗ п. 7) --- */
const MK=[['Instagram (реклама)',380000,64,38,22,9,8460000],['Яндекс Директ',260000,41,27,18,7,9120000],['Google Ads',140000,22,14,9,3,3860000],['2ГИС',45000,19,12,8,3,2310000],['Сайт · SEO / прямые',0,31,21,14,6,7240000],['WhatsApp (прямые)',0,27,15,9,4,3020000],['Холодные корпоративные',0,12,8,6,3,11400000],['Рекомендации',0,18,16,12,7,6180000]];
const DIR=[['roz',520000,72,31,12,16200000],['corp',255000,34,24,14,28400000],['dav',50000,22,16,10,6980000]];
SC.an=()=>{const t=MK.reduce((a,x)=>a.map((v,i)=>v+(x[i+1]||0)),[0,0,0,0,0,0]);return `<div class="hd"><div><h2>Сквозная аналитика · ноябрь</h2><p>Расходы на рекламу → обращения по каналам → целевые → замеры → договоры → выручка. Нецелевые вопросы отделены от целевых заявок.</p></div><button class="bt" onclick="csv('analitika.csv',[['Канал','Расход','Обращений','Целевых','Замеров','Договоров','Выручка']].concat(MK))">Выгрузить в Excel</button></div>
 ${tz('7','Маркетинг и качество заявок; реальная стоимость целевой заявки и договора по направлениям.')}
 ${nums([['расход на рекламу',tg(t[0])],['обращений',t[1]],['целевых',t[2],pct(t[2],t[1])+'%'],['договоров',t[4]],['выручка',tg(t[5])]])}
 <div class="pan"><h3>По каналам</h3>${tbl(['Канал','>Расход','>Обращений','>Целевых','>Замеров','>Договоров','>Выручка','>Цена целевой','>Цена договора'],MK.map(x=>`<tr><td>${x[0]}</td><td class="r">${tg(x[1])}</td><td class="r">${x[2]}</td><td class="r">${x[3]}</td><td class="r">${x[4]}</td><td class="r">${x[5]}</td><td class="r">${tg(x[6])}</td><td class="r">${x[1]?tg(x[1]/x[3]):'—'}</td><td class="r">${x[1]?tg(x[1]/x[5]):'—'}</td></tr>`))}</div>
 <div class="pan"><h3>По направлениям <small>реальная стоимость заявки и договора</small></h3>${tbl(['Направление','>Расход','>Целевых','>Замеров','>Договоров','>Выручка','>Цена целевой','>Цена договора'],DIR.map(x=>`<tr><td><b>${DIRN[x[0]]}</b></td><td class="r">${tg(x[1])}</td><td class="r">${x[2]}</td><td class="r">${x[3]}</td><td class="r">${x[4]}</td><td class="r">${tg(x[5])}</td><td class="r">${tg(x[1]/x[2])}</td><td class="r">${tg(x[1]/x[4])}</td></tr>`))}</div>`};
SC.disc=()=>`<div class="hd"><div><h2>Дисциплина и соблюдение сроков</h2><p>Доля заявок, взятых в работу быстрее 30 минут; средний срок расчёта и КП (норма 48 ч); рейтинг просрочек по отделам; контроль возврата пирамид за 24 ч.</p></div></div>
 ${nums([['ответ < 30 мин','86%','норма 100%'],['средний срок расчёта и КП','31 ч','норма ≤ 48 ч'],['просрочек 48 ч','3','за месяц'],['пирамиды вовремя','7 из 9','норма 24 ч'],['сделок без шага',D.filter(noStep).length,'сейчас']])}
 <div class="g2"><div class="pan"><h3>Менеджеры</h3>${tbl(['Менеджер','>Заявок','>Ответ < 30 мин','>Средний ответ','>Без шага'],[['Николай',58,'91%','14 мин',D.filter(d=>noStep(d)&&d.mgr==='Николай').length],['Дана',46,'80%','22 мин',D.filter(d=>noStep(d)&&d.mgr==='Дана').length]].map(r=>`<tr>${r.map((v,i)=>`<td class="${i?'r':''}">${v}</td>`).join('')}</tr>`))}</div>
 <div class="pan"><h3>Просрочки по отделам</h3>${tbl(['Отдел','>Просрочек','Типичная причина'],[['Коммерческий',4,'ответ > 30 мин в выходные'],['ПТО (расчёт)',3,'сложные витражи, > 48 ч'],['Производство',2,'задержка закалённого стекла'],['Монтаж / склад',2,'пирамиды вернули через 30–40 ч']].map(r=>`<tr><td>${r[0]}</td><td class="r">${r[1]}</td><td>${r[2]}</td></tr>`))}</div></div>`;
SC.pf=()=>{const P=D.filter(isProj);const reasons={};D.filter(d=>d.st==='lost').forEach(d=>reasons[d.lost[0]]=(reasons[d.lost[0]]||0)+1);const RR=[['Дорого',9],['Сроки',4],['Выбрали конкурента',3],['Нецелевой запрос',11],['Не вышел на связь',6]];
 return `<div class="hd"><div><h2>Производство и финансы</h2><p>Реестр проектов по этапам, загрузка цеха и бригад, план и факт готовности, дебиторка, причины отказов.</p></div></div>
 <div class="pan"><h3>Реестр проектов</h3>${tbl(['Проект','Этап','Формат','>Сумма','>Оплачено','>Долг','План готовности','Факт'],P.map(d=>`<tr onclick="openDeal('${d.id}')"><td><b>${d.id}</b> ${esc(clOf(d.cl).n)}</td><td>${esc(STN[d.st])}</td><td>${esc(FMT[d.fmt].split(' (')[0])}</td><td class="r">${tg(d.sum)}</td><td class="r">${tg(paidSum(d))}</td><td class="r ${d.sum-paidSum(d)>0?'bad':''}">${tg(Math.max(0,d.sum-paidSum(d)))}</td><td>${esc(d.due||'—')}</td><td>${d.ready?'готово':d.id==='A-127'?'<span class="lbl bad">перенос +2 дн.</span>':'—'}</td></tr>`))}</div>
 <div class="g3"><div class="pan"><h3>Загрузка цеха</h3>${[['нед. 23–29.11',86],['нед. 30.11–06.12',64],['нед. 07–13.12',38]].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}%</b></div>${bar(x[1])}`).join('')}</div>
 <div class="pan"><h3>Загрузка бригад</h3>${[['Бригада 1 · Сергей',90],['Бригада 2 · Тимур',70],['Бригада 3 · Олег',45]].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}%</b></div>${bar(x[1])}`).join('')}</div>
 <div class="pan"><h3>Причины отказов <small>за квартал</small></h3>${RR.map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div></div>`};
const EMP=['Ерлан Сапаров','Николай','Дана','Артём','Ольга','Геннадий','Сергей','Андрей','Тимур','Олег','Айгерим','Мария (склад)'];
const DAYS=['23.11','24.11','25.11','26.11','27.11','28.11'];
let TB=EMP.map((e,i)=>DAYS.map((d,j)=>j>3?'':(i===9&&j===2)?'Б':(i===4&&j<2)?'О':'П'));
SC.tabel=()=>`<div class="hd"><div><h2>Табель рабочего времени</h2><p>Отметки «пришёл / ушёл / больничный / отпуск». Клик по ячейке меняет отметку. Выгрузка для бухгалтерии.</p></div><div class="btns"><button class="bt a" onclick="csv('tabel.csv',[['Сотрудник'].concat(DAYS)].concat(EMP.map((e,i)=>[e].concat(TB[i]))))">Выгрузить в Excel</button><button class="bt" onclick="TB.forEach(r=>r[4]=r[4]||'П');toast('Отмечены приходы за 27.11.');build()">Отметить приход всем за 27.11</button></div></div>
 ${tz('7','Табель: пришёл / ушёл / больничный / отпуск, учёт времени по отделам, выгрузка в таблицу.')}
 <div class="pan"><div class="tw"><table class="t tb"><thead><tr><th>Сотрудник</th>${DAYS.map(d=>`<th>${d}</th>`).join('')}<th class="r">Дней</th></tr></thead><tbody>${EMP.map((e,i)=>`<tr><td>${esc(e)}</td>${TB[i].map((m,j)=>`<td class="m m${m}" onclick="tbCycle(${i},${j})">${m||'·'}${m==='П'?'<br><small>09:00–18:00</small>':''}</td>`).join('')}<td class="r">${TB[i].filter(m=>m==='П').length}</td></tr>`).join('')}</tbody></table></div><p class="mut sm2">П — пришёл/ушёл (время с отметки), Б — больничный, О — отпуск.</p></div>`;
SC.jr=()=>`<div class="hd"><div><h2>Журнал ручных разблокировок</h2><p>Снять стоп-кран может только руководитель — с обязательным комментарием. Каждое действие сохраняется.</p></div></div>
 <div class="g3"><div class="crit"><b>Стоп-кран 1</b> · запуск в цех без договора, листа замера и подтверждённой предоплаты невозможен.</div><div class="crit"><b>Стоп-кран 2</b> · отгрузка и выезд бригады — только после подтверждения оплаты перед отгрузкой.</div><div class="crit"><b>Стоп-кран 3</b> · проект не закрыть без акта (или акта о неявке) и возврата пирамид и остатков.</div></div>
 <div class="pan">${tbl(['Когда','Кто','Проект','Действие','Комментарий'],JR.map(j=>`<tr><td class="mono">${esc(j[0])}</td><td>${esc(j[1])}</td><td>${esc(j[2])}</td><td><b>${esc(j[3])}</b></td><td>${esc(j[4])}</td></tr>`))}</div>`;

/* --- настройки --- */
let USERS=[['Ерлан Сапаров','Руководитель','активен'],['Николай','Менеджер','активен'],['Дана','Менеджер','активен'],['Артём','Замерщик','активен'],['Ольга','Инженер-расчётчик','активен'],['Геннадий','Производство / Склад','активен'],['Мария','Производство / Склад','активен'],['Сергей','Монтаж (бригадир)','активен'],['Тимур','Монтаж (бригадир)','активен'],['Айгерим','Бухгалтер','активен'],['Админ','Администратор','активен']];
SC.users=()=>`<div class="hd"><div><h2>Пользователи и права</h2><p>Пользователей без ограничений и без доплат. При отключении сотрудника доступ блокируется мгновенно, а его клиенты, переписка, записи звонков и файлы остаются и переназначаются.</p></div><button class="bt p" onclick="USERS.push(['Новый сотрудник','Менеджер','активен']);toast('Сотрудник добавлен — без доплаты за лицензию.');build()">+ Сотрудник</button></div>
 ${tz('1.3, 2','Масштабирование без доплат; правило информационной безопасности при отключении сотрудника.')}
 <div class="pan">${tbl(['Сотрудник','Роль','Статус','Сделок',''],USERS.map((u,i)=>`<tr><td><b>${esc(u[0])}</b></td><td>${esc(u[1])}</td><td><span class="lbl ${u[2]==='активен'?'ok':'bad'}">${esc(u[2])}</span></td><td class="r">${D.filter(d=>d.mgr===u[0]).length}</td><td>${u[2]==='активен'&&u[1]!=='Руководитель'?`<button class="bt sm" onclick="fire(${i})">Отключить</button>`:''}</td></tr>`))}</div>
 <div class="pan"><h3>Матрица прав</h3>${tbl(['Роль','Что видит'],Object.entries(ROLES).map(([k,v])=>`<tr><td><b>${esc(k)}</b></td><td>${esc(v.note)}</td></tr>`))}</div>`;
SC.dict=()=>`<div class="hd"><div><h2>Справочники</h2><p>Редактируются администратором без программиста.</p></div></div>
 <div class="g3"><div class="pan"><h3>Типы конструкций</h3>${TYPES.map(t=>`<div class="kv"><span>${esc(t)}</span></div>`).join('')}<button class="bt sm" onclick="TYPES.push('Зимние сады');toast('Тип «Зимние сады» добавлен.');build()">+ Добавить</button></div>
 <div class="pan"><h3>Причины отказа</h3>${LOST.map(t=>`<div class="kv"><span>${esc(t)}</span></div>`).join('')}</div>
 <div class="pan"><h3>Причины переноса</h3>${MOVE.map(t=>`<div class="kv"><span>${esc(t)}</span></div>`).join('')}</div></div>
 <div class="pan"><h3>Этапы и ответственные</h3>${tbl(['№','Этап','Ответственный'],ST.map((s,i)=>`<tr><td>${i+1}</td><td>${s[1]}</td><td>${RESP[s[0]]}</td></tr>`))}</div>`;
const TZM=[['1.2','Цели: единое окно, связка 4 отделов, стоп-краны, материалы и тара, аналитика','dash'],['1.3','Пользователи без доплат, веб + мобильная версия, сервер в РК','users'],['2','Роли и права (8 ролей), отключение сотрудника с переназначением','users'],['3.1','Воронка продаж: 8 этапов, условия перехода, отказ с причиной','funnel'],['3.2','Проектный контур 9–15, автосоздание проекта','proj'],['3.2','Три критических стоп-крана, ручная разблокировка руководителем','jr'],['4.1','Карточка контрагента, реквизиты, проверка дублей, единая лента','cl'],['4.2','Карточка проекта: формат, тип, локация, материалы и тара, финансы, 6 папок файлов','deal'],['5','Нет сделки без шага, запрет тихого переноса, таймеры 30 мин / 48 ч / 24 ч / 5–7 дн.','tasks'],['5','Наряды замерщику и бригадиру с дублем в мессенджер','zmob'],['6','Сайт: все формы и виджеты, файлы, город, страница, метки','site'],['6','WhatsApp, Instagram, телефония с записью, звонок в клик, автоперезвон','inbox'],['6','Telegram-уведомления сотрудникам','tgn'],['6.1','Коллтрекинг, виджет, передача статусов в Метрику / GA / кабинет','ads'],['7','Сквозная аналитика и стоимость целевой заявки и договора по направлениям','an'],['7','Дисциплина и сроки','disc'],['7','Производство и финансы, дебиторка, причины отказов','pf'],['7','Табель с выгрузкой','tabel'],['8','Вводные: календарь замеров, расчёты из таблиц, график оплат, критичное снабжение, акт о неявке','mat'],['9','Этапы внедрения и критерии приёмки','price']];
SC.tzm=()=>`<div class="hd"><div><h2>Соответствие ТЗ</h2><p>Каждый раздел технического задания — где он в демо. Клик открывает экран.</p></div></div>
 <div class="pan">${tbl(['Пункт ТЗ','Требование','Экран демо'],TZM.map(t=>`<tr onclick="goAny('${t[2]}')"><td class="mono">${t[0]}</td><td>${esc(t[1])}</td><td><span class="lbl i">${esc(SUBN[t[2]])} →</span></td></tr>`))}</div>`;
SC.price=()=>`<div class="hd"><div><h2>Стоимость и этапы</h2><p>Стандартный пакет «под ключ» по всем разделам ТЗ — 2 500 000 ₸ фиксированно. Абонплаты за платформу и лицензий нет, пользователей без ограничений.</p></div></div>
 <div class="g2"><div class="pan"><h3>Итог · 2 500 000 ₸</h3><div class="kv"><span>Стандартный пакет: все разделы ТЗ — воронка, проекты, стоп-краны, таймеры, давальческое, ЛЗК, пирамиды, сайт и сквозная аналитика, каналы, Telegram, табель, мобильная версия</span><b>2 500 000 ₸</b></div><div class="kv"><span>Опция · интеграция с 1С</span><b>+800 000 ₸</b></div><div class="kv tot"><span>Оплата 30 / 40 / 30</span><b>750 / 1 000 / 750 тыс.</b></div><p class="mut sm2" style="margin-top:8px">Сторонние сервисы — сервер в РК, шлюз WhatsApp, облачная АТС, коллтрекинг — по тарифам провайдеров.</p></div>
 <div class="pan"><h3>Этапы ТЗ п. 9</h3><div class="kv"><span>0 · Согласование, доступы</span><b>1–2 р. дня</b></div><div class="kv"><span>1 · Коммерческий блок, сайт, каналы</span><b>≈ 1 250 000 ₸</b></div><div class="kv"><span>2 · Производство, материалы, монтаж</span><b>≈ 1 250 000 ₸</b></div><div class="kv"><span>3 · Сопровождение 3 мес.</span><b>включено</b></div><p class="mut sm2" style="margin-top:8px">Приёмка этапа 2 — сквозной прогон двух заказов (своё и давальческое сырьё). На пульте есть кнопки этого прогона.</p></div></div>`;

/* ===== действия ===== */
function act(id,k){const d=byId(id);if(!d)return;const c=clOf(d.cl);
 switch(k){
  case 'take':d.taken=true;hist(d,'Менеджер взял в работу, первый контакт зафиксирован');toast(`${id}: взято в работу. Таймер 30 мин остановлен.`);break;
  case 'nontarget':d.target=false;d.st='lost';d.lost=['Нецелевой запрос','Спрашивали про ремонт ПВХ-окон'];hist(d,'Отказ: нецелевой запрос');toast(`${id}: закрыто как нецелевое.`);break;
  case 'zamFile':d.f.zam=true;d.zamH=0;d.files.f1=['Лист замера.pdf','Эскиз.jpg','Фото проёма 1.jpg','Видео подъезда.mp4'];if(d.st==='s3'){d.st='s4'}hist(d,'Замерщик загрузил лист замера и фото → задача инженеру, таймер 48 ч');tgPush('Ольга · ПТО',`Новая задача на расчёт ${id} · 48 ч`);toast(`${id}: лист замера загружен. Инженеру ушла задача, таймер 48 ч.`);break;
  case 'calcFile':d.f.calc=true;d.calcV++;d.files.f2.unshift('Расчёт и спецификация v'+d.calcV+'.xlsx');if(d.st==='s4')d.st='s5';hist(d,`Инженер загрузил расчёт v${d.calcV}`);tgPush(d.mgr,`Расчёт ${id} v${d.calcV} готов — примите`);toast(`${id}: расчёт v${d.calcV} загружен, менеджер уведомлён.`);break;
  case 'calcOk':d.f.calcOk=true;hist(d,'Менеджер принял расчёт');toast(`${id}: расчёт принят.`);break;
  case 'kpSend':d.f.kp=true;d.f.kpSent=true;d.kpV++;d.files.f3.unshift('КП v'+d.kpV+'.pdf');d.task={t:'Созвон по КП',d:'27.11 11:00'};if(!d.sum)d.sum=1640000;d.plan=sp(d.sum,d.fmt==='dav');hist(d,`КП v${d.kpV} отправлено в WhatsApp, задача «Созвон» 27.11 11:00`);toast(`${id}: КП v${d.kpV} ушло клиенту, назначен созвон.`);break;
  case 'recalc':d.f.calcOk=false;d.f.agreed=false;hist(d,`Правки клиента → перерасчёт инженеру (сохранены расчёт v${d.calcV} и КП v${d.kpV})`);tgPush('Ольга · ПТО',`Перерасчёт ${id}: правки клиента`);d.f.calc=false;d.st='s5';toast(`${id}: вернули на перерасчёт, версии сохранены.`);break;
  case 'agree':d.f.agreed=true;hist(d,'Клиент согласовал спецификацию и цену');toast(`${id}: согласовано.`);break;
  case 'contract':d.f.contract=true;d.f.sched=true;d.files.f4=['Договор подписан.pdf','Спецификация.pdf','График платежей.pdf'];if(!d.sum)d.sum=1640000;d.plan=sp(d.sum,d.fmt==='dav');hist(d,'Загружен подписанный договор и график оплат');toast(`${id}: договор и график загружены.`);break;
  case 'davAct':d.mat.davAct=true;d.files.f5.unshift('Акт приёма давальческого сырья.pdf');hist(d,'Склад принял давальческое сырьё по акту (48 хлыст., 22 стеклопакета, 6 компл. фурнитуры)');toast(`${id}: давальческое принято по акту.`);break;
  case 'stock':d.mat.stock=true;hist(d,'Склад подтвердил наличие сырья');toast(`${id}: сырьё в наличии.`);break;
  case 'lzk':d.mat.lzk={n:'ЛЗК-'+(400+SEQ++),d:'26.11'};d.files.f5.unshift(d.mat.lzk.n+'.pdf');hist(d,`Отпуск в цех по ${d.mat.lzk.n}`);if(!d.due)d.due='04.12';toast(`${id}: оформлена ${d.mat.lzk.n}, срок готовности ${d.due}.`);break;
  case 'due':d.due='04.12';hist(d,'Срок готовности 04.12');toast(`${id}: срок готовности 04.12.`);break;
  case 'ready':d.ready=true;hist(d,'Цех: изделия готовы и укомплектованы');tgPush(d.mgr,`${id} готов — выставьте счёт на доплату`);toast(`${id}: готово. Менеджер уведомлён о доплате.`);break;
  case 'inform':d.prodDays=0;hist(d,'Клиент проинформирован о статусе производства');toast(`${id}: клиент проинформирован, следующее напоминание через 5–7 дней.`);break;
  case 'brig':if(!d.paid.ship&&!d.unl.p12){toast('🔒 Стоп-кран 2: без подтверждённой оплаты перед отгрузкой бригаду назначить нельзя.');return}d.mon.br='Бригада 2 · Тимур, Олег';d.mon.date='28.11';d.pyr.out=d.pyr.out||3;hist(d,'Назначена бригада 2 на 28.11, наряд ушёл в мессенджер');tgPush('Тимур',`Наряд ${id} · 28.11 · ${d.addr}`);toast(`${id}: бригада назначена, наряд отправлен.`);break;
  case 'photo':d.mon.photo=true;d.files.f6=['Фото до.jpg','Фото после 1.jpg','Фото после 2.jpg'];hist(d,'Фотоотчёт монтажа загружен');toast(`${id}: фотоотчёт загружен.`);break;
  case 'actSigned':d.act='signed';d.monH=d.monH||2;d.files.f6.unshift('Акт выполненных работ (подписан).pdf');hist(d,`Акт подписан: ${c.sg||c.n}${c.bs?' · основание: '+c.bs:''}`);toast(`${id}: акт загружен, полномочия подписанта отмечены. Таймер 24 ч на пирамиды.`);break;
  case 'noshow':d.act='noshow';d.files.f6.unshift('Акт о неявке заказчика.pdf');hist(d,'Акт о неявке заказчика с фото и временем');toast(`${id}: акт о неявке загружен.`);break;
  case 'pyr':d.pyr.back=d.pyr.out;hist(d,`Склад: пирамиды возвращены ${d.pyr.out}/${d.pyr.out}`);toast(`${id}: пирамиды на складе.`);break;
  case 'rest':d.rest=true;hist(d,'Склад: остатки профиля и фурнитуры возвращены');toast(`${id}: остатки приняты.`);break;
 }
 if(SI(d.st)>=13&&d.pyr.back>=d.pyr.out&&d.rest&&d.act)d.paid.fin=true;
 build()}
function next(id){const d=byId(id);const ms=missing(d);
 if(ms.length&&!d.unl[d.st]){toast(`${CRIT[d.st]?'🔒 '+CRIT[d.st]+'. ':''}Не хватает: ${esc(ms.join(', '))}.`);return}
 const i=SI(d.st);const nx=ST[i+1][0];
 if(d.st==='s8'){hist(d,`Проект создан автоматически из договора: перенесены история (${d.hist.length} событий) и файлы`);tgPush('Айгерим',`Запрос: подтвердить предоплату ${id} · ${tg(d.plan[0])}`)}
 if(d.st==='s2'&&d.target===true)adsPush(id,'Целевое обращение');
 d.st=nx;hist(d,'Этап → '+STN[nx]);
 if(nx==='p15'){hist(d,'Проект закрыт и включён в аналитику');toast(`${id}: проект закрыт.`)}else toast(`${id} → ${STN[nx]}`);
 build()}
function unlock(id){const d=byId(id);openM('Ручная разблокировка',`${d.id} · ${esc(STN[d.st])} · только руководитель, комментарий обязателен`,`<label class="fld"><span>Комментарий</span><textarea class="inp" id="ucm" placeholder="почему снимаем стоп-кран"></textarea></label><button class="bt a" onclick="doUnlock('${id}')">Разблокировать и записать в журнал</button>`)}
function doUnlock(id){const d=byId(id);const v=(document.getElementById('ucm')||{}).value||'';if(v.trim().length<5){toast('Без комментария разблокировка невозможна.');return}d.unl[d.st]=true;JR.unshift([NOW,'Ерлан Сапаров',id,`Снят ${CRIT[d.st]||'этап «'+STN[d.st]+'»'} вручную`,v]);hist(d,'Руководитель снял ограничение вручную: '+v);closeM();toast('Разблокировано, запись в журнале.');build()}
function qual(id){const d=byId(id);const c=clOf(d.cl);openM('Квалификация',`${d.id} · ${esc(c.n)}`,`<label class="fld"><span>Формат сырья</span><select class="sel" id="qf">${Object.entries(FMT).map(([k,v])=>`<option value="${k}">${esc(v)}</option>`).join('')}</select></label><label class="fld"><span>Тип конструкции</span><select class="sel" id="qt">${TYPES.map(t=>`<option ${t===d.type?'selected':''}>${esc(t)}</option>`).join('')}</select></label><label class="fld"><span>Город</span><input class="inp" id="qc" value="${esc(d.city||'Петропавловск')}"></label><label class="fld"><span>Адрес объекта</span><input class="inp" id="qa" value="${esc(d.addr||c.addr)}"></label><label class="fld"><span>Статус обращения</span><select class="sel" id="qg"><option value="1">Целевое</option><option value="0">Нецелевое</option></select></label><button class="bt a" onclick="saveQual('${id}')">Сохранить</button>`)}
function saveQual(id){const d=byId(id);const v=k=>(document.getElementById(k)||{}).value;d.fmt=v('qf')||'own';d.type=v('qt')||d.type;d.city=v('qc')||'Петропавловск';d.addr=v('qa')||clOf(d.cl).addr;d.target=v('qg')!=='0';hist(d,`Квалификация: ${FMT[d.fmt]}, ${d.type}, ${d.city}, ${d.target?'целевое':'нецелевое'}`);closeM();toast(`${id}: квалификация заполнена.`);build()}
function zamSet(id){const d=byId(id);openM('Назначить замер',`${d.id} · ${esc(d.city)}, ${esc(d.addr)}`,`<label class="fld"><span>Слот</span><select class="sel" id="zs">${['27.11 09:00','27.11 15:00','28.11 10:00'].map(s=>`<option>${s}</option>`).join('')}</select></label><label class="fld"><span>Контакт на объекте</span><input class="inp" id="zc" value="${esc(clOf(d.cl).ph)}"></label><button class="bt a" onclick="saveZam('${id}')">Назначить и отправить замерщику</button>`)}
function saveZam(id){const d=byId(id);d.zam={date:(document.getElementById('zs')||{}).value||'27.11 09:00',contact:(document.getElementById('zc')||{}).value||clOf(d.cl).ph,task:true};if(!d.addr)d.addr=clOf(d.cl).addr;hist(d,`Замер ${d.zam.date}, наряд замерщику в систему и WhatsApp`);tgPush('Артём',`Замер ${id} · ${d.zam.date} · ${d.addr}`);adsPush(id,'Замер назначен');closeM();toast(`${id}: замер назначен, наряд у замерщика. Статус «Замер назначен» ушёл в рекламу.`);build()}
function taskSet(id){const d=byId(id);d.task={t:'Созвон с клиентом',d:'27.11 12:00'};hist(d,'Задача: созвон 27.11 12:00');toast(`${id}: следующий шаг назначен.`);build()}
function resched(id){const d=byId(id);openM('Перенос срока',`${d.id} · без причины и комментария перенос невозможен`,`<label class="fld"><span>Новая дата</span><input class="inp" id="rd" value="30.11"></label><label class="fld"><span>Причина</span><select class="sel" id="rr">${MOVE.map(m=>`<option>${esc(m)}</option>`).join('')}</select></label><label class="fld"><span>Комментарий</span><textarea class="inp" id="rc"></textarea></label><button class="bt a" onclick="doResched('${id}')">Перенести и уведомить</button>`)}
function doResched(id){const d=byId(id);const g=k=>(document.getElementById(k)||{}).value||'';const c=g('rc');if(c.trim().length<5){toast('Укажите комментарий — тихий перенос запрещён.');return}const nd=g('rd')||'30.11';const what=isProj(d)?'готовности':'задачи';const old=isProj(d)?d.due:(d.task?d.task.d:'');if(isProj(d))d.due=nd;else if(d.task)d.task.d=nd;NOTE.unshift([NOW,id,`Перенос ${what} ${old} → ${nd}`,g('rr'),c,`${d.mgr}, Ерлан Сапаров`]);hist(d,`Перенос ${what} на ${nd}: ${g('rr')} — ${c}`);tgPush('Ерлан Сапаров',`Перенос ${id}: ${g('rr')}`);closeM();toast('Перенесено, менеджер и руководитель уведомлены.');build()}
function lose(id){const d=byId(id);openM('Отказ',`${d.id} · причина из справочника обязательна`,`<label class="fld"><span>Причина</span><select class="sel" id="lr">${LOST.map(m=>`<option>${esc(m)}</option>`).join('')}</select></label><label class="fld"><span>Комментарий</span><textarea class="inp" id="lc"></textarea></label><button class="bt a" onclick="doLose('${id}')">Закрыть сделку</button>`)}
function doLose(id){const d=byId(id);const g=k=>(document.getElementById(k)||{}).value||'';if(g('lc').trim().length<3){toast('Комментарий обязателен.');return}d.lost=[g('lr'),g('lc')];d.st='lost';hist(d,'Отказ: '+g('lr'));closeM();toast(`${id}: закрыто с причиной.`);build()}
function askPay(id,k){const d=byId(id);tgPush('Айгерим',`Подтвердите ${k==='pre'?'предоплату':'оплату перед отгрузкой'} ${id} · ${tg(d.plan[k==='pre'?0:1])}`);hist(d,'Запрос бухгалтеру отправлен в мессенджер');toast('Бухгалтер получил уведомление со ссылкой.');build()}
function confirmPay(id,k){const d=byId(id);d.paid[k]=true;hist(d,`Бухгалтер: ${k==='pre'?'предоплата':'оплата перед отгрузкой'} ${tg(d.plan[k==='pre'?0:1])} подтверждена`);if(k==='pre')adsPush(id,'Договор оплачен');tgPush(d.mgr,`${id}: оплата подтверждена — ${k==='pre'?'можно в цех':'можно отгружать и назначать бригаду'}`);toast(`${id}: подтверждено. ${k==='pre'?'Стоп-кран 1 снят, «Договор оплачен» ушёл в рекламу.':'Стоп-кран 2 снят.'}`);build()}
function rekv(cid){const c=cid==='new'?{id:'new',t:'ТОО',n:'',ph:'',addr:''}:clOf(cid);const F=(k,l)=>`<label class="fld"><span>${l}</span><input class="inp" id="r_${k}" value="${esc(c[k]||'')}"></label>`;
 openM(cid==='new'?'Новый контрагент':esc(c.n),'Обязательно перед этапом «Договор»',`<label class="fld"><span>Тип</span><select class="sel" id="r_t">${['ТОО','ИП','ФЛ'].map(t=>`<option ${t===c.t?'selected':''}>${t}</option>`).join('')}</select></label>${F('n','Наименование / ФИО')}${F('ph','Телефон')}${c.t==='ФЛ'?F('iin','ИИН'):F('bin','БИН / ИИН')}${F('addr','Адрес')}${c.t==='ФЛ'?'':F('iik','ИИК')+F('bank','Банк')+F('bik','БИК')+F('kbe','КБе')+F('sg','ФИО подписанта')+F('bs','Основание полномочий (устав / доверенность)')}<button class="bt a" onclick="saveRekv('${cid}')">Сохранить</button>`)}
function saveRekv(cid){const g=k=>{const e=document.getElementById('r_'+k);return e?e.value:undefined};
 if(cid==='new'){const ph=(g('ph')||'').replace(/\D/g,'');const b=g('bin')||g('iin')||'';const dup=CL.find(c=>(ph.length>=6&&c.ph.replace(/\D/g,'').includes(ph))||(b&&(c.bin===b||c.iin===b)));if(dup){toast(`Дубль: ${esc(dup.n)} уже есть — откройте существующую карточку.`);return}CL.push({id:'c'+(CL.length+1),t:g('t'),n:g('n')||'Новый контрагент',ph:g('ph')||'',bin:g('bin'),iin:g('iin'),addr:g('addr')||''});closeM();toast('Контрагент создан.');build();return}
 const c=clOf(cid);['n','ph','iin','bin','addr','iik','bank','bik','kbe','sg','bs'].forEach(k=>{const v=g(k);if(v!==undefined)c[k]=v});if(c.t!=='ФЛ'){c.bs=c.bs||'Устав'}closeM();toast(reqOk(c)?'Реквизиты полные.':'Сохранено, но реквизиты ещё не полные.');build()}
function prev(n){const isImg=/\.(jpg|mp4)$/.test(n);openM(esc(n),'Предпросмотр в браузере без скачивания',isImg?`<div class="sk"><svg viewBox="0 0 300 180" width="100%"><rect width="300" height="180" fill="#e1e9ee"/><rect x="40" y="20" width="220" height="140" fill="none" stroke="#2a7d9c" stroke-width="6"/><path d="M150 20v140M40 90h220" stroke="#2a7d9c" stroke-width="4"/><text x="150" y="176" text-anchor="middle" font-size="10" fill="#5f6f7a">${esc(n)}</text></svg></div>`:`<div class="tw"><table class="t"><thead><tr><th>Позиция</th><th class="r">Кол-во</th><th>Ед.</th></tr></thead><tbody><tr><td>Профиль тёплый, рама</td><td class="r">18</td><td>хлыст</td></tr><tr><td>Стеклопакет 4-16-4 закалённый</td><td class="r">12</td><td>шт.</td></tr><tr><td>Фурнитура дверная</td><td class="r">2</td><td>компл.</td></tr><tr><td>Уплотнитель EPDM</td><td class="r">64</td><td>м</td></tr></tbody></table></div><p class="mut sm2">Документ, таблица или PDF открываются прямо в карточке.</p>`)}
function defect(id){const d=byId(id);d.files.f6.unshift('Дефектная ведомость.pdf');hist(d,'Загружена дефектная ведомость');toast(`${id}: дефектная ведомость загружена.`);build()}
function newLead(){const n='A-'+(SEQ++);D.unshift(mk({id:n,cl:'c8',st:'s1',src:'Ручной ввод',recvMin:0,hist:[[NOW,'Заявка создана вручную']]}));tgPush('Николай',`Новая заявка ${n} · 30 мин на ответ`);openDeal(n)}
function siteLead(i){const f=FORMS[i];const n='A-'+(SEQ++);D.unshift(mk({id:n,cl:'c1',st:'s1',src:'Сайт · форма «'+f[0]+'»',page:f[1],utm:'utm_source=yandex&utm_medium=cpc&utm_campaign=alprof_'+(i+1),type:f[2],city:'Петропавловск',recvMin:0,files:{f1:i===0||i===4?['Чертёж клиента.pdf']:[],f2:[],f3:[],f4:[],f5:[],f6:[]},hist:[[NOW,`Заявка с сайта: форма «${f[0]}», страница ${f[1]}${f[2]?', продукт «'+f[2]+'»':''}`],[NOW,'Автоприветствие клиенту в WhatsApp отправлено']]}));tgPush('Николай',`Новая заявка с сайта ${n} · «${f[0]}» · 30 мин`);CH.unshift({n:'Ирина Ковалёва',ch:'Сайт',id:n,m:[['c',`Форма «${f[0]}» · стр. ${f[1]}`,'сейчас'],['m','Здравствуйте! Заявку получили, ответим в течение 30 минут. — Алпроф СКО','сейчас']]});curCh=0;FORMS[i][3]++;toast(`Заявка ${n} создана из формы «${esc(f[0])}»: метки, страница и файлы в карточке, автоприветствие ушло, таймер 30 мин.`);build()}
function ctCall(ch){const n='A-'+(SEQ++);D.unshift(mk({id:n,cl:'c9',st:'s1',src:'Звонок · коллтрекинг ('+ch+')',page:'номер канала',recvMin:0,hist:[[NOW,`Входящий звонок с номера канала «${ch}» — запись разговора в ленте`]]}));toast(`Звонок с канала «${esc(ch)}» → заявка ${n} с источником.`);build()}
function missed(){const n='A-'+(SEQ++);D.unshift(mk({id:n,cl:'c7',st:'s1',src:'Звонок · пропущенный',recvMin:0,task:{t:'Перезвонить',d:'сегодня'},hist:[[NOW,'Пропущенный вызов → автоматическая задача «Перезвонить»']]}));CH.unshift({n:'Андрей Мельник',ch:'Звонок',id:n,m:[['c','📞 Пропущенный вызов → задача «Перезвонить»','сейчас']]});curCh=0;toast(`Пропущенный звонок: создана заявка ${n} и задача на перезвон.`);build()}
function sendMsg(){CH[curCh].m.push(['m','Здравствуйте! Подскажите удобное время для замера?','сейчас']);build()}
function sendKp(){CH[curCh].m.push(['m','📎 КП v1.pdf','сейчас']);const d=byId(CH[curCh].id);if(d)hist(d,'КП отправлено из единого окна');toast('КП отправлено в один клик.');build()}
function fire(i){const u=USERS[i];openM(`Отключить: ${esc(u[0])}`,'Доступ блокируется мгновенно. Клиенты, переписка, записи и файлы остаются в базе.',`<label class="fld"><span>Кому передать сделки</span><select class="sel" id="fr">${USERS.filter(x=>x[1]===u[1]&&x[0]!==u[0]&&x[2]==='активен').map(x=>`<option>${esc(x[0])}</option>`).join('')||'<option>Ерлан Сапаров</option>'}</select></label><button class="bt a" onclick="doFire(${i})">Отключить и переназначить</button>`)}
function doFire(i){const u=USERS[i];const to=(document.getElementById('fr')||{}).value||'Ерлан Сапаров';const l=D.filter(d=>d.mgr===u[0]);l.forEach(d=>{d.mgr=to;hist(d,`Сделка переназначена: ${u[0]} → ${to} (сотрудник отключён)`)});u[2]='отключён';JR.unshift([NOW,'Админ','—',`Отключён ${u[0]}`,`передано ${l.length} сделок → ${to}`]);closeM();toast(`${esc(u[0])} отключён, ${l.length} сделок переданы ${esc(to)}.`);build()}
function tbCycle(i,j){const o=['П','Б','О',''];TB[i][j]=o[(o.indexOf(TB[i][j])+1)%o.length];build()}
function csv(name,rows){try{const b=new Blob(['﻿'+rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n')],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);if(!navigator.webdriver)a.click();a.remove()}catch(e){}toast(`Файл ${esc(name)} выгружен для Excel.`)}
function openDeal(id){if(!byId(id))return;curDeal=id;if(allowed('deal'))go('deal');else quick(id)}
function goAny(k){if(!allowed(k))switchRole('Руководитель');go(k)}

/* сквозной прогон (приёмка этапа Б) */
let runT=null;
function runAll(f){clearTimeout(runT);const n='A-'+(SEQ++);const cl=f==='dav'?'c6':'c2';
 D.unshift(mk({id:n,cl,st:'s1',src:f==='dav'?'Сайт · форма «Заявка на давальческое сырьё»':'Сайт · форма «Заказ замера»',page:f==='dav'?'/davalcheskoe':'/zamer',utm:'utm_source=google&utm_campaign=test',recvMin:0,hist:[[NOW,'Тестовая заявка для сквозного прогона']]}));
 const d=byId(n);curDeal=n;if(role!=='Руководитель')switchRole('Руководитель');go('deal');
 const S=[()=>act(n,'take'),()=>next(n),()=>{d.fmt=f;d.type=f==='dav'?'Витражи':'Входные группы';d.city=f==='dav'?'Кокшетау':'Петропавловск';d.addr=clOf(cl).addr;d.target=true;hist(d,'Квалификация заполнена');build()},()=>next(n),()=>{d.zam={date:'27.11 10:00',contact:clOf(cl).ph,task:true};adsPush(n,'Замер назначен');hist(d,'Замер назначен');build()},()=>next(n),()=>act(n,'zamFile'),()=>next(n),()=>act(n,'calcFile'),()=>act(n,'calcOk'),()=>next(n),()=>act(n,'kpSend'),()=>next(n),()=>act(n,'agree'),()=>next(n),()=>{const c=clOf(cl);c.bs=c.bs||'Устав';act(n,'contract')},()=>next(n),()=>next(n),()=>confirmPay(n,'pre'),()=>next(n),()=>act(n,f==='dav'?'davAct':'stock'),()=>act(n,'lzk'),()=>next(n),()=>act(n,'ready'),()=>next(n),()=>next(n),()=>confirmPay(n,'ship'),()=>next(n),()=>act(n,'brig'),()=>act(n,'photo'),()=>next(n),()=>act(n,'actSigned'),()=>next(n),()=>act(n,'pyr'),()=>act(n,'rest'),()=>next(n)];
 let i=0;const tick=()=>{if(i>=S.length){toast(`<b>${n}: сквозной прогон «${f==='dav'?'давальческое':'своё сырьё'}» завершён</b> — от заявки до акта и возврата пирамид. Попытки обойти стоп-краны были отклонены.`);return}try{S[i]()}catch(e){}i++;runT=setTimeout(tick,navigator.webdriver?0:900)};tick()}

/* ===== каркас ===== */
function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${v.av}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');document.getElementById('rsel').innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');document.getElementById('rsel').value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;document.getElementById('rsel').value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map((s,i)=>`<div class="ri ${s.k===SECOF[cur]?'on':''}"><span>${String(i+1).padStart(2,'0')}</span>${s.n}</div>${s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="si ${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')}`).join('');
 const S=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('crumb').innerHTML=`${esc(S.n)} /<b>${esc(SUBN[cur])}</b> · ${esc(role)}, ${esc(ROLES[role].n)}`}
function build(){if(!allowed(cur))cur=ROLES[role].s[0];buildRail();document.getElementById('ttl').textContent=SUBN[cur];document.getElementById('content').innerHTML=SC[cur]();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль.');return}cur=k;build();window.scrollTo(0,0)}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6000)}
const TOUR=[['dash','1 · Пульт: просрочки таймеров, стоп-краны, сделки без шага.'],['site','2 · Заявка с сайта: форма, продукт, файлы, метки, таймер 30 мин.'],['funnel','3 · Воронка 3.1: условие перехода на каждом этапе.'],['deal','4 · Карточка: реквизиты, материалы, финансы, 6 папок файлов.'],['eng','5 · Инженер: расчёт за 48 ч, версии.'],['pay','6 · Бухгалтер: подтверждение оплаты в один клик.'],['proj','7 · Проекты 9–15 и три стоп-крана.'],['mat','8 · Давальческое, ЛЗК, пирамиды за 24 ч.'],['an','9 · Сквозная аналитика по направлениям.'],['tzm','10 · Соответствие каждому пункту ТЗ.']];
let ti=-1,tRun=false;function tour(){if(tRun){tRun=false;return}tRun=true;ti=-1;step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){tRun=false;toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Руководитель');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false}
(function(){renderRoles();document.getElementById('rsel').addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();tRun=false}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
