/* ТРАССА — система транспортно-экспедиторской компании: перевозки вместо Битрикса, договоры-заявки с клиентом и водителем, документы по рейсу, «мои и не мои деньги» на счёте, календарь платежей, фонды, дебиторка, задачи с красными флагами, громкие уведомления, KPI логистов, базы клиентов и перевозчиков, аналитика. Все имена, компании, номера и суммы вымышленные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(n<0?'−':'')+(Math.round(Math.abs(n)/10000)/100).toString().replace('.',',')+' млн';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};
const D=s=>s&&s.length===5?'2026-'+s:s;
const dd=s=>{if(!s)return '—';const [y,m,d]=D(s).split('-');return d+'.'+m};
const dl=s=>{const [y,m,d]=D(s).split('-');return d+'.'+m+'.'+y};
const TODAY='2026-10-05',NOW='10:40';
const addDays=(s,n)=>new Date(new Date(D(s)+'T00:00:00Z').getTime()+n*864e5).toISOString().slice(0,10);
const daysBetween=(a,b)=>Math.round((new Date(D(b)+'T00:00:00Z')-new Date(D(a)+'T00:00:00Z'))/864e5);
const dayOf=s=>['вс','пн','вт','ср','чт','пт','сб'][new Date(D(s)+'T00:00:00Z').getUTCDay()];

const SEC=[
 {k:'own',n:'Деньги',ic:'<path d="M3 7h18v12H3z M3 11h18 M7 15h4"/>',sub:[['today','Пульт собственника'],['money','Мои и не мои деньги'],['calendar','Календарь платежей'],['funds','Фонды и неделя'],['debts','Кто должен'],['analytics','Аналитика']]},
 {k:'ops',n:'Перевозки',ic:'<path d="M2 7h11v9H2z M13 10h4l3 3v3h-7z"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>',sub:[['board','Доска перевозок'],['deal','Карточка перевозки'],['check','Проверка договоров'],['docs','Документы по рейсам'],['buh','Кабинет бухгалтера']]},
 {k:'team',n:'Команда',ic:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6 M16 5.2a3 3 0 0 1 0 5.6 M18 14c2 .8 3 2.8 3 6"/>',sub:[['tasks','Задачи и красные флаги'],['alerts','Уведомления'],['kpi','План и KPI логистов'],['my','Мой день · логист']]},
 {k:'base',n:'Базы',ic:'<ellipse cx="12" cy="5.5" rx="8" ry="2.8"/><path d="M4 5.5v13c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8v-13 M4 12c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8"/>',sub:[['clients','Клиенты'],['drivers','Перевозчики'],['move','Переезд с Битрикса']]},
 {k:'sys',n:'Система',ic:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9l2.1 2.1 M17 17l2.1 2.1 M4.9 19.1L7 17 M17 7l2.1-2.1"/>',sub:[['roles','Роли и права'],['mobile','С телефона'],['launch','Запуск и стоимость']]}
];
const SECOF={},SUBN={};
SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));

const ROLES={
 'Руководитель':{av:'АМ',p:'AM',n:'Амирбек',note:'Всё: деньги на счёте с разбивкой «моё / не моё», календарь платежей, фонды, долги клиентов, перевозки, команда и аналитика',s:ALL.slice()},
 'Логист':{av:'ДН',p:'DN',n:'Данияр',note:'Свои перевозки: поиск машины, статусы, водители и клиенты, свои задачи и свой заработок. Деньги компании не видит',s:['my','board','deal','tasks','alerts','drivers','clients','kpi','mobile']},
 'Куратор':{av:'АС',p:'AS',n:'Асель',note:'Сопровождение клиентов: счета, оплаты, долги и акты сверки, документы по рейсам',s:['my','board','deal','debts','docs','clients','tasks','alerts','mobile']},
 'Офис-менеджер':{av:'ЖН',p:'ZH',n:'Жанна',note:'Договоры-заявки с клиентом и водителем: галочка «согласовано» в карточке, документы, базы',s:['check','board','deal','docs','drivers','clients','move','tasks','alerts','mobile']},
 'Бухгалтер':{av:'ГМ',p:'GM',n:'Гульмира · аутсорс',note:'Кого оплатить сегодня, какие документы выставить, календарь и долги — без переписки в WhatsApp',s:['buh','docs','calendar','debts','board','deal','alerts','mobile']}
};
let role='Руководитель',cur='today',theme='light',curDeal='R-1013';
const STAFF={AM:'Амирбек',DN:'Данияр',TM:'Тимур',MD:'Мадина',BK:'Бекзат',AS:'Асель',KR:'Карина',ZH:'Жанна',GM:'Гульмира'};

/* Клиенты: f — пометка (ok / warn / bad) */
const CLIENTS=[
 {id:'C1',n:'ТОО «Астык Трейд»',city:'Астана',cur:'AS',term:7,ph:'+7 701 *** 14 22',f:'warn',note:'Тендерные грузы на 15 млн. Звонит логисту и ночью — где машина, скиньте геолокацию. Отвечать сразу, не писать «завтра».'},
 {id:'C2',n:'ТОО «Нур-Строй Комплект»',city:'Астана',cur:'AS',term:10,ph:'+7 777 *** 80 15',f:'warn',note:'Платит с задержкой 10–15 дней. Акт сверки — каждый месяц, иначе спорит по суммам.'},
 {id:'C3',n:'ТОО «Каспий Агро»',city:'Актобе',cur:'KR',term:5,ph:'+7 701 *** 33 90',f:'ok',note:'Платит вовремя, с НДС. Любит одного логиста — Тимура.'},
 {id:'C4',n:'ИП Сагындыков Б.',city:'Костанай',cur:'KR',term:0,ph:'+7 705 *** 61 07',f:'bad',note:'Неплатёжеспособен: должен с августа. Работать только по 100% предоплате.'},
 {id:'C5',n:'ТОО «Евразия Пром»',city:'Астана',cur:'AS',term:0,ph:'+7 701 *** 27 48',f:'ok',note:'Москва → Астана, по 5 машин. Платит вперёд за всю партию.'},
 {id:'C6',n:'ТОО «Север Металл»',city:'Павлодар',cur:'KR',term:5,ph:'+7 778 *** 52 31',f:'warn',note:'Нервный: нужен отчёт о местоположении машины два раза в день. Срыв сроков — сразу претензия.'},
 {id:'C7',n:'ТОО «Арна Импорт»',city:'Алматы',cur:'AS',term:10,ph:'+7 707 *** 11 64',f:'ok',note:'Китай: Урумчи, Хоргос. Без НДС, документы на английском и русском.'},
 {id:'C8',n:'ТОО «Qazaq Fresh»',city:'Астана',cur:'KR',term:7,ph:'+7 701 *** 70 02',f:'ok',note:'Продукты, только реф. Температура в заявке обязательно.'},
 {id:'C9',n:'ТОО «Темір Снаб»',city:'Павлодар',cur:'AS',term:14,ph:'+7 776 *** 48 19',f:'ok',note:'Металл из России. Отсрочка 14 дней по договору.'},
 {id:'C10',n:'ТОО «Алтын Дән»',city:'Кокшетау',cur:'KR',term:7,ph:'+7 702 *** 90 36',f:'ok',note:'Зерно и мука, сезон с сентября по ноябрь.'},
 {id:'C11',n:'ТОО «Сарыарка Полимер»',city:'Караганда',cur:'AS',term:10,ph:'+7 701 *** 05 77',f:'ok',note:'Плёнка и гранулы из Екатеринбурга.'},
 {id:'C12',n:'ТОО «Бәйтерек Мебель»',city:'Астана',cur:'KR',term:14,ph:'+7 747 *** 39 58',f:'warn',note:'Минск → Астана. Водителю заплатили своими, клиент тянет — держать на контроле.'}
];
const CL=id=>CLIENTS.find(c=>c.id===id);

/* Перевозчики — 12 из ~1 500, которые переедут из Битрикса */
const DRIVERS=[
 {id:'D1',n:'Серик Ахметов',ip:'ИП «Ахметов С.»',ph:'+7 701 *** 41 18',truck:'Volvo FH · тент 20 т',plate:'512 ARA 01',routes:'Россия ↔ Казахстан',trips:23,f:'ok',note:'Надёжный, документы сдаёт сразу после выгрузки.'},
 {id:'D2',n:'Виктор Ким',ip:'ИП «Ким В. Г.»',ph:'+7 777 *** 08 63',truck:'MAN TGX · тент 20 т',plate:'204 KMA 02',routes:'по Казахстану',trips:31,f:'ok',note:'61 год. Ссылки не открывает — только звонок и бумажный договор, фото подписанного договора — в карточку.'},
 {id:'D3',n:'Бауыржан Тлеуов',ip:'ИП «Тлеуов Б.»',ph:'+7 705 *** 93 40',truck:'Scania R · реф',plate:'877 BTL 10',routes:'Россия, по Казахстану',trips:12,f:'ok',note:'Реф, держит −18 °C. Работает с НДС.'},
 {id:'D4',n:'Олег Пономарёв',ip:'ИП Пономарёв О. В. (РФ)',ph:'+7 912 *** 55 21',truck:'DAF XF · тент 20 т',plate:'Х 341 ОР 196',routes:'Екатеринбург, Москва',trips:9,f:'warn',note:'Документы присылает с опозданием на 3–5 дней — оплату держать до сдачи.'},
 {id:'D5',n:'Нурлан Есенов',ip:'ИП «Есенов Н.»',ph:'+7 702 *** 16 84',truck:'Shacman · тент 20 т',plate:'098 NES 14',routes:'Сибирь, по Казахстану',trips:6,f:'bad',note:'Сорвал загрузку 12.08 — клиент выставил штраф 150 000 ₸. Брать только при отсутствии других.'},
 {id:'D6',n:'Ринат Галиев',ip:'ИП «Галиев Р.»',ph:'+7 747 *** 70 30',truck:'КамАЗ 54901 · тент',plate:'331 RGA 09',routes:'Караганда, Астана',trips:40,f:'ok',note:'Короткие рейсы по области, всегда на связи.'},
 {id:'D7',n:'Ван Лэй',ip:'Xinjiang Huayun Logistics',ph:'+86 139 *** 2207',truck:'Sitrak · тент 20 т',plate:'新A 7Q312',routes:'Урумчи, Хоргос',trips:7,f:'ok',note:'Китай. Связь через WeChat, документы на китайском и русском.'},
 {id:'D8',n:'Ержан Мусин',ip:'ИП «Мусин Е.»',ph:'+7 701 *** 62 95',truck:'Volvo FH · тент 20 т',plate:'640 EMU 01',routes:'Россия ↔ Казахстан',trips:18,f:'ok',note:'—'},
 {id:'D9',n:'Айдос Кенжебаев',ip:'ИП «Кенжебаев А.»',ph:'+7 775 *** 44 10',truck:'Mercedes Actros · изотерм',plate:'719 AKN 01',routes:'по Казахстану, Хоргос',trips:15,f:'ok',note:'—'},
 {id:'D10',n:'Андрей Литвинов',ip:'ИП Литвинов А. С. (РФ)',ph:'+7 916 *** 03 77',truck:'Scania S · тент 20 т',plate:'А 902 ВК 77',routes:'Москва, Минск',trips:5,f:'ok',note:'Москва. Просит оплату на выгрузке — заранее напоминать про документы.'},
 {id:'D11',n:'Канат Жумабаев',ip:'ИП «Жумабаев К.»',ph:'+7 778 *** 21 50',truck:'MAN TGS · тент 20 т',plate:'155 KZH 15',routes:'Россия, Костанай',trips:21,f:'ok',note:'—'},
 {id:'D12',n:'Марат Исин',ip:'ИП «Исин М.»',ph:'+7 701 *** 87 26',truck:'DAF CF · тент 10 т',plate:'402 MIS 01',routes:'по Казахстану',trips:27,f:'ok',note:'—'}
];
const DR=id=>DRIVERS.find(d=>d.id===id);

/* Статусы перевозки — как карточка двигается сейчас в Битриксе */
const ST=[
 {k:'new',n:'Новая заявка',c:'#6b7684'},
 {k:'dog',n:'Договоры',c:'#8a5cc2'},
 {k:'load',n:'Погрузка',c:'#2a6fb0'},
 {k:'road',n:'В пути',c:'#1f8a8a'},
 {k:'unl',n:'Выгрузка',c:'#c27a12'},
 {k:'docs',n:'Документы',c:'#b0532a'},
 {k:'pay',n:'Оплата водителю',c:'#c23b3b'},
 {k:'done',n:'Закрыто',c:'#2e7d4f'}
];
const STI=k=>ST.findIndex(s=>s.k===k);
const STN=k=>ST[STI(k)];
const DOCN=['Счёт на оплату клиенту','АВР клиенту','ЭСФ клиенту','Счёт от перевозчика','АВР от перевозчика','ЭСФ от перевозчика'];

/* Перевозки: c — ставка клиента, d — ставка водителю; paidC — дата оплаты клиентом; paidD — водителю оплачено; cc/cd — договор-заявка с клиентом/водителем подписан; ok — офис-менеджер поставил галочку; docs — 6 документов (1 — есть) */
const DEALS=[
 ['R-1013','C5','D10','Москва','Астана',1,1600000,1520000,1,'DN','AS','unl','09-27','10-05','09-24',0,1,1,1,'000000'],
 ['R-1012','C5','D1','Москва','Астана',1,1600000,1520000,1,'DN','AS','docs','09-26','10-03','09-24',0,1,1,1,'110110'],
 ['R-1016','C5','D11','Москва','Астана',1,1600000,1520000,1,'DN','AS','pay','09-25','10-02','09-24',0,1,1,1,'111111'],
 ['R-1014','C5','D4','Москва','Астана',1,1600000,1520000,1,'DN','AS','road','09-29','10-07','09-24',0,1,1,1,'000000'],
 ['R-1015','C5','D8','Москва','Астана',1,1600000,1520000,1,'DN','AS','road','09-30','10-08','09-24',0,1,1,1,'000000'],
 ['R-1004','C11','D3','Екатеринбург','Караганда',1,1030000,950000,1,'TM','AS','pay','09-22','10-02','09-25',0,1,1,1,'111111'],
 ['R-1009','C2','D6','Астана','Караганда',0,185000,150000,1,'TM','AS','pay','09-29','09-30','10-02',0,1,1,1,'111111'],
 ['R-1008','C6','D8','Павлодар','Екатеринбург',1,880000,810000,1,'BK','KR','done','09-18','09-24','10-01',1,1,1,1,'111111'],
 ['R-1011','C8','D9','Алматы','Астана',0,540000,480000,1,'MD','KR','docs','09-27','09-30','09-30',0,1,1,1,'111110'],
 ['R-1017','C1','D2','Астана','Шымкент',0,420000,375000,1,'DN','AS','load','10-05','10-08',null,0,1,0,0,'000000'],
 ['R-1018','C1','D9','Хоргос','Астана',1,1900000,1790000,1,'TM','AS','road','10-02','10-07',null,0,1,1,1,'000000'],
 ['R-1019','C3','D12','Астана','Актобе',0,650000,590000,1,'TM','KR','dog','10-06','10-09',null,0,1,0,0,'000000'],
 ['R-1020','C8','D3','Алматы','Астана',0,520000,465000,1,'MD','KR','new','10-07','10-09',null,0,0,0,0,'000000'],
 ['R-1021','C7','D7','Урумчи','Алматы',1,2400000,2280000,0,'BK','AS','road','09-30','10-09',null,0,1,1,1,'000000'],
 ['R-1022','C9','D5','Новосибирск','Павлодар',1,980000,915000,1,'BK','AS','load','10-05','10-09',null,0,1,1,1,'000000'],
 ['R-1023','C10','D6','Кокшетау','Астана',0,210000,180000,1,'DN','KR','new','10-06','10-06',null,0,0,0,0,'000000'],
 ['R-1024','C11','D4','Екатеринбург','Караганда',1,1030000,955000,1,'TM','AS','dog','10-07','10-14',null,0,1,1,0,'000000'],
 ['R-1001','C12','D10','Минск','Астана',1,2600000,2480000,1,'BK','KR','done','09-10','09-20',null,1,1,1,1,'111111'],
 ['R-1002','C2','D12','Астана','Караганда',0,190000,155000,1,'TM','AS','done','09-19','09-20',null,1,1,1,1,'111111'],
 ['R-1003','C9','D1','Омск','Павлодар',1,760000,700000,1,'BK','AS','done','09-17','09-21','09-30',1,1,1,1,'111111'],
 ['R-1005','C3','D12','Астана','Актобе',0,640000,585000,1,'TM','KR','done','09-20','09-23','09-26',1,1,1,1,'111111'],
 ['R-1006','C10','D2','Кокшетау','Астана',0,205000,175000,1,'DN','KR','docs','09-28','09-29',null,0,1,1,1,'110111'],
 ['R-1007','C4','D11','Астана','Костанай',0,430000,385000,1,'MD','KR','done','09-15','09-17',null,1,1,1,1,'111111'],
 ['R-1010','C9','D5','Новосибирск','Павлодар',1,960000,900000,1,'BK','AS','done','09-21','09-25',null,1,1,1,1,'111111']
].map(a=>({id:a[0],cl:a[1],dr:a[2],from:a[3],to:a[4],intl:!!a[5],c:a[6],d:a[7],nds:!!a[8],lg:a[9],cur:a[10],st:a[11],load:D(a[12]),unl:D(a[13]),paidC:a[14]?D(a[14]):null,paidD:!!a[15],cc:!!a[16],cd:!!a[17],ok:!!a[18],docs:a[19].split('').map(Number),log:[]}));
const DL=id=>DEALS.find(d=>d.id===id);

/* Деньги */
const BANK={open:15860000,acc:[['Kaspi Business · основной',13420000],['Halyk · ФОТ',1690000],['Halyk · налоги',750000]]};
/* Правила фондов: как делится комиссия каждой закрытой сделки (после НДС) */
const RULES=[
 {k:'staff',n:'Сотрудники · логист, куратор, лиды',p:50,c:'#2a6fb0',hint:'ваши 50 %: логист 30, куратор 12, лиды 8'},
 {k:'tax',n:'Налоги · КПН, ИПН, соцплатежи',p:10,c:'#c23b3b',hint:'откладывается сразу — бухгалтер не снимет 2,7 млн «вдруг»'},
 {k:'fix',n:'Обязательные · аренда, оклады, кредиты',p:17,c:'#8a5cc2',hint:'аренда, бухгалтер, офис-менеджер, кредит'},
 {k:'own',n:'Моя прибыль',p:23,c:'#2e7d4f',hint:'то, что можно тратить'}
];
/* Накоплено в фондах на 05.10 (ещё не выплачено) */
const FUNDS={vat:384000,staff:2260000,tax:690000,fix:1140000};

/* Обязательные платежи месяца — фазы как у вас: 1–12, окно, 18–30 */
const FIXED=[
 {d:'10-01',n:'Аренда офиса',s:450000,f:'fix'},
 {d:'10-02',n:'Коммунальные, связь, интернет',s:65000,f:'fix'},
 {d:'10-03',n:'Зарплата · группа 1 (куратор, лиды)',s:1200000,f:'staff',done:1},
 {d:'10-05',n:'Офис-менеджер · оклад',s:300000,f:'fix'},
 {d:'10-06',n:'Бухгалтер · оклад',s:600000,f:'fix'},
 {d:'10-07',n:'Зарплата · топ-логисты (Данияр, Тимур)',s:1530000,f:'staff'},
 {d:'10-10',n:'Зарплата · остальные (Мадина, Бекзат)',s:975000,f:'staff'},
 {d:'10-10',n:'Битрикс24 «Бизнес» и интегратор',s:176000,f:'fix',bx:1},
 {d:'10-18',n:'Садик и школа',s:180000,f:'own'},
 {d:'10-20',n:'Кредит рабочий · Kaspi',s:820000,f:'fix'},
 {d:'10-22',n:'Кредит личный',s:350000,f:'own'},
 {d:'10-25',n:'Налоги: ИПН, соцплатежи за сентябрь',s:640000,f:'tax'},
 {d:'10-28',n:'Личные расходы',s:600000,f:'own'}
].map(x=>({...x,d:D(x.d)}));

/* Задачи: due — срок; ok — отработана; res — что сделано */
const TASKS=[
 {id:'T1',who:'DN',t:'Позвонить Александру (ТОО «Север Металл») — где груз, скинуть геолокацию',due:'2026-10-04 18:00',ok:0,by:'AM',deal:'R-1008'},
 {id:'T2',who:'AS',t:'Акт сверки с ТОО «Нур-Строй Комплект» за сентябрь',due:'2026-10-03 17:00',ok:0,by:'AM'},
 {id:'T3',who:'ZH',t:'Подписанный договор-заявка с водителем Ким В. по R-1017 — фото в карточку',due:'2026-10-05 12:00',ok:0,by:'AM',deal:'R-1017'},
 {id:'T4',who:'GM',t:'Запросить ЭСФ у перевозчика Ахметов С. по R-1012',due:'2026-10-05 15:00',ok:0,by:'AS',deal:'R-1012'},
 {id:'T5',who:'TM',t:'Найти машину Астана → Актобе на 06.10 для «Каспий Агро»',due:'2026-10-05 17:00',ok:0,by:'KR',deal:'R-1019'},
 {id:'T6',who:'MD',t:'Отчёт о местоположении для «Qazaq Fresh» — утро и вечер',due:'2026-10-05 19:00',ok:0,by:'KR'},
 {id:'T7',who:'AS',t:'Выставить счёт «Евразия Пром» за 5 машин Москва → Астана',due:'2026-09-23 18:00',ok:1,by:'AM',res:'Счёт выставлен 23.09, оплачено 24.09 — 8 000 000 ₸'},
 {id:'T8',who:'TM',t:'Отправить водителю Галиеву договор-заявку на R-1009',due:'2026-09-29 10:00',ok:1,by:'ZH',res:'Подписан, фото в карточке'},
 {id:'T9',who:'BK',t:'Подтвердить загрузку R-1022 в Новосибирске — водитель с пометкой',due:'2026-10-05 14:00',ok:0,by:'AM',deal:'R-1022'}
];
const overdue=t=>!t.ok&&t.due<TODAY+' '+NOW;

/* KPI за сентябрь: машины, комиссия, которую принёс, сколько заработал сам */
const KPI=[
 {k:'DN',n:'Данияр',tr:52,com:2900000,pay:870000,plan:2100000},
 {k:'TM',n:'Тимур',tr:41,com:2200000,pay:660000,plan:2100000},
 {k:'BK',n:'Бекзат',tr:38,com:1750000,pay:525000,plan:2100000},
 {k:'MD',n:'Мадина',tr:15,com:900000,pay:450000,plan:2100000}
];
const MONTHS=[['Июнь',141,6800000],['Июль',152,7400000],['Август',166,8100000],['Сентябрь',179,9040000]];
const PLAN=15000000;

/* ===== Расчёты ===== */
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const com=d=>d.c-d.d;
const vat=d=>d.nds?Math.round(com(d)*12/112):0;
const net=d=>com(d)-vat(d);
const route=d=>`${esc(d.from)} → ${esc(d.to)}`;
const stg=k=>{const s=STN(k);return `<span class="stg" style="--sc:${s.c}">${s.n}</span>`};
const fl=f=>f==='bad'?'<span class="flag bad" title="Красная пометка">●</span>':f==='warn'?'<span class="flag warn" title="Пометка">●</span>':'';
const docsOk=d=>d.docs.every(Boolean);
const drvDocsOk=d=>d.docs[3]&&d.docs[4]&&d.docs[5];
const afterUnl=d=>STI(d.st)>=STI('unl');
/* деньги водителей, которые уже лежат на счёте: клиент оплатил, водителю ещё нет */
const held=()=>DEALS.filter(d=>d.paidC&&!d.paidD);
const heldDrv=()=>held().reduce((a,d)=>a+d.d,0);
const heldCom=()=>held().reduce((a,d)=>a+com(d),0);
/* заплатили водителю своими, клиент ещё не оплатил */
const frozen=()=>DEALS.filter(d=>d.paidD&&!d.paidC);
/* клиент должен после выгрузки */
const owing=()=>DEALS.filter(d=>!d.paidC&&afterUnl(d));
const OTHERDEBT={n:25,sum:6840000,drv:5960000,com:880000};
const fundsSum=()=>FUNDS.vat+FUNDS.staff+FUNDS.tax+FUNDS.fix;
const notMine=()=>heldDrv()+heldCom()+fundsSum();
const freeMine=()=>BANK.open-notMine();
const waitMine=()=>owing().reduce((a,d)=>a+net(d)*RULES.find(r=>r.k==='own').p/100,0)+OTHERDEBT.com*RULES.find(r=>r.k==='own').p/100;
const monthCom=()=>MONTHS[MONTHS.length-1][2];
/* когда платим водителю: на «Оплате водителю» — сегодня, иначе через 2 дня после выгрузки */
const drvPayDay=d=>{if(d.paidD)return null;if(d.st==='pay'||d.st==='docs')return TODAY;const x=addDays(d.unl,2);return x<TODAY?TODAY:x};
const clPayDay=d=>{if(d.paidC)return null;return addDays(d.unl,CL(d.cl).term)};
function dayEvents(day){const E=[];
 DEALS.forEach(d=>{const p=drvPayDay(d);if(p===day)E.push({k:'out',n:`Водителю ${DR(d.dr).n} · ${d.id} ${d.from} → ${d.to}`,s:d.d,deal:d.id,ok:d.st==='pay'?'документы на месте':d.st==='docs'?(drvDocsOk(d)?'документы на месте':'нет документов от водителя'):'после выгрузки и документов'});
  const c=clPayDay(d);if(c===day&&c>=TODAY)E.push({k:'in',n:`${CL(d.cl).n} · ${d.id}`,s:d.c,deal:d.id});
  if(c&&c<TODAY&&day===TODAY)E.push({k:'late',n:`${CL(d.cl).n} · ${d.id} — просрочено ${daysBetween(c,TODAY)} дн.`,s:d.c,deal:d.id})});
 FIXED.forEach(f=>{if(f.d===day)E.push({k:f.done?'paid':'fix',n:f.n,s:f.s,f:f.f,bx:f.bx})});
 return E}
function projection(){const R={};let b=BANK.open;for(let i=1;i<=31;i++){const day='2026-10-'+String(i).padStart(2,'0');const E=dayEvents(day);const inn=E.filter(e=>e.k==='in').reduce((a,e)=>a+e.s,0),out=E.filter(e=>e.k==='out'||e.k==='fix').reduce((a,e)=>a+e.s,0);if(day>=TODAY)b+=inn-out;R[day]={E,inn,out,bal:day>=TODAY?b:null}}return R}
const phaseOf=i=>i<=12?1:i<=17?2:3;
const PHASES=[[1,'1–12','ФОТ, аренда, оклады — самая большая нагрузка'],[2,'13–17','окно: почти ничего не платим'],[3,'18–31','кредиты, налоги, личные расходы']];

function splitBar(){const parts=[['drv','Деньги водителей',heldDrv(),'#7b8794'],['com','Комиссия в работе',heldCom(),'#b9a37a'],['vat','НДС',FUNDS.vat,'#a8534a'],['staff','Фонд сотрудников',FUNDS.staff,'#2a6fb0'],['tax','Налоги',FUNDS.tax,'#c23b3b'],['fix','Обязательные',FUNDS.fix,'#8a5cc2'],['own','Моё свободно',freeMine(),'#2e7d4f']];
 return `<div class="split"><div class="sbar">${parts.map(p=>`<i style="flex:${Math.max(p[2],0)};background:${p[3]}" title="${p[1]}: ${tg(p[2])}"></i>`).join('')}</div><div class="slg">${parts.map(p=>`<span><i style="background:${p[3]}"></i>${p[1]}<b>${mln(p[2])}</b></span>`).join('')}</div></div>`}

/* ===== Деньги ===== */
const SC={};
SC.today=()=>{const pay=DEALS.filter(d=>drvPayDay(d)===TODAY);const flags=redFlags();const P=projection();const next=[];for(let i=0;i<8;i++)next.push(addDays(TODAY,i));
 return `<div class="hd"><div><h2>Пульт собственника · ${dd(TODAY)}, ${dayOf(TODAY)}</h2><p>Одним экраном: сколько на счёте и сколько из этого ваше, кому платить сегодня, что горит. Открыли с телефона где угодно — и всё понятно.</p></div><div class="btns"><button class="bt" onclick="act('report')">Отчёт в WhatsApp в 19:00</button></div></div>
 <div class="wid">
  <div onclick="go('money')" class="clk"><small>На счетах</small><b>${mln(BANK.open)}</b><span>Kaspi + Halyk, на ${NOW}</span></div>
  <div onclick="go('money')" class="clk"><small>Не ваше</small><b class="r">${mln(notMine())}</b><span>водителям, НДС, фонды</span></div>
  <div onclick="go('money')" class="clk"><small>Ваше свободно</small><b class="g">${mln(freeMine())}</b><span>можно тратить</span></div>
  <div onclick="go('debts')" class="clk"><small>Ещё не пришло вашей прибыли</small><b class="w">${mln(waitMine())}</b><span>${owing().length+OTHERDEBT.n} ${plural(owing().length+OTHERDEBT.n,['клиент должен','клиента должны','клиентов должны'])}</span></div>
  <div onclick="go('analytics')" class="clk"><small>План месяца</small><b class="a">${pct(monthCom(),PLAN)} %</b><span>${mln(monthCom())} из ${mln(PLAN)} в сентябре</span></div>
 </div>
 ${splitBar()}
 <div class="g21">
  <div class="pan"><h3>Сегодня оплатить водителям · ${tg(pay.reduce((a,d)=>a+d.d,0))}</h3>
   <div class="tw"><table class="t"><thead><tr><th>Рейс</th><th>Водитель</th><th>Клиент оплатил</th><th>Документы</th><th class="r">Сумма</th></tr></thead><tbody>
   ${pay.map(d=>`<tr class="clk" onclick="openDeal('${d.id}')"><td><b>${d.id}</b><div class="sub">${route(d)}</div></td><td>${esc(DR(d.dr).n)} ${fl(DR(d.dr).f)}</td><td>${d.paidC?`<span class="tag g">${dd(d.paidC)} · ${daysBetween(d.paidC,TODAY)} дн. назад</span>`:'<span class="tag r">ещё нет — платим своими</span>'}</td><td>${drvDocsOk(d)?'<span class="tag g">3 из 3</span>':`<span class="tag r">${d.docs.slice(3).filter(Boolean).length} из 3 — оплату держим</span>`}</td><td class="r mono">${fmt(d.d)}</td></tr>`).join('')}</tbody></table></div>
   <div class="note" style="--tone:var(--warn)"><b>R-1004 · Екатеринбург → Караганда</b><p>Клиент оплатил 25.09 — за 7 дней до выгрузки. Машина выгрузилась только 02.10, водителю 950 000 ₸. Эти деньги всю неделю лежали на счёте как будто ваши — теперь система держит их отдельно, пока не оплатите.</p></div>
  </div>
  <div class="pan hot"><h3>Горит · ${flags.length}</h3>${flags.slice(0,7).map(f=>`<div class="rf ${f.lv}" onclick="${f.go}"><i></i><div><b>${f.t}</b><span>${f.s}</span></div></div>`).join('')}</div>
 </div>
 <div class="pan"><h3>Ближайшие дни · что придёт и что уйдёт</h3><div class="days">${next.map(day=>{const p=P[day];return `<div class="day ${p.bal<0?'bad':p.bal<2000000?'warn':''}" onclick="card('day','${day}')"><small>${dd(day)} · ${dayOf(day)}</small><span>+ ${mln(p.inn)}</span><span>− ${mln(p.out)}</span><b>${mln(p.bal)}</b></div>`}).join('')}</div><p class="mini" style="margin:8px 0 0">Остаток на счетах на конец дня — по тому, что уже есть в системе: выгрузки, сроки оплаты клиентов, зарплаты по вашим датам, кредиты.</p></div>
 <div class="pan"><h3>Перевозки сейчас</h3><div class="fleet">${ST.filter(s=>s.k!=='done').map(s=>{const n=DEALS.filter(d=>d.st===s.k).length;return `<div onclick="go('board')" style="--sc:${s.c}"><b>${n}</b><span>${s.n}</span></div>`}).join('')}<div style="--sc:#2e7d4f"><b>179</b><span>фур в сентябре</span></div></div></div>
 ${said('«Я завтра хочу где-то, условно, на Бали быть — открыл, и всё знаю сразу, вижу в моменте».')}`};

function redFlags(){const F=[];
 DEALS.filter(d=>['load','road'].includes(d.st)&&(!d.cc||!d.cd||!d.ok)).forEach(d=>F.push({lv:'bad',t:`${d.id} грузится без договора с ${!d.cd?'водителем':'клиентом'}`,s:`${route(d)} · ${DR(d.dr).n} · логист ${STAFF[d.lg]}`,go:`openDeal('${d.id}')`}));
 DEALS.filter(d=>d.st==='unl'&&!drvDocsOk(d)).forEach(d=>F.push({lv:'bad',t:`${DR(d.dr).n} на выгрузке и ждёт оплату`,s:`${d.id} · документов от водителя нет — без них бухгалтер не оплатит`,go:`openDeal('${d.id}')`}));
 TASKS.filter(overdue).forEach(t=>F.push({lv:'bad',t:`Просрочена задача · ${STAFF[t.who]}`,s:`${t.t} · срок ${t.due.slice(8,10)}.${t.due.slice(5,7)} ${t.due.slice(11)} — дашборд сотрудника закрыт`,go:`go('tasks')`}));
 DEALS.filter(d=>['load','road','dog'].includes(d.st)&&DR(d.dr).f==='bad').forEach(d=>F.push({lv:'warn',t:`${d.id}: водитель с красной пометкой`,s:`${DR(d.dr).n} — ${DR(d.dr).note}`,go:`openDeal('${d.id}')`}));
 owing().filter(d=>daysBetween(clPayDay(d),TODAY)>0).forEach(d=>F.push({lv:'warn',t:`${CL(d.cl).n} не оплатил ${tg(d.c)}`,s:`${d.id} · просрочено ${daysBetween(clPayDay(d),TODAY)} дн.${d.paidD?' · водителю уже заплатили своими':''}`,go:`go('debts')`}));
 DEALS.filter(d=>d.st==='docs'&&!drvDocsOk(d)).forEach(d=>F.push({lv:'warn',t:`${d.id}: нет документов от перевозчика`,s:`${DR(d.dr).n} · не хватает: ${DOCN.filter((x,i)=>i>2&&!d.docs[i]).join(', ')}`,go:`openDeal('${d.id}')`}));
 return F}

SC.money=()=>{const H=held(),Fz=frozen(),O=owing();
 return `<div class="hd"><div><h2>Мои и не мои деньги</h2><p>На счёте лежит одна сумма, а ваших в ней — меньшая часть. Система раскладывает каждый тенге: деньги водителей по оплаченным рейсам, комиссия в работе, НДС, фонды и только потом — ваше свободное.</p></div></div>
 <div class="g2">
  <div class="pan"><h3>На счетах · ${tg(BANK.open)}</h3>${BANK.acc.map(a=>`<div class="kv"><span>${a[0]}</span><b class="mono">${fmt(a[1])}</b></div>`).join('')}
   <div class="wf">
    <div><span>Деньги водителей · клиент оплатил, водителю ещё нет</span><b class="neg">− ${fmt(heldDrv())}</b></div>
    <div><span>Комиссия по этим рейсам · разложится в фонды при закрытии</span><b class="neg">− ${fmt(heldCom())}</b></div>
    <div><span>НДС к уплате</span><b class="neg">− ${fmt(FUNDS.vat)}</b></div>
    <div><span>Фонд сотрудников · зарплаты 07 и 10 октября</span><b class="neg">− ${fmt(FUNDS.staff)}</b></div>
    <div><span>Фонд налогов</span><b class="neg">− ${fmt(FUNDS.tax)}</b></div>
    <div><span>Фонд обязательных · аренда, оклады, кредит</span><b class="neg">− ${fmt(FUNDS.fix)}</b></div>
    <div class="tot"><span>Ваше свободно</span><b>${fmt(freeMine())}</b></div>
   </div></div>
  <div class="pan"><h3>Как это выглядело раньше</h3><p class="mini" style="font-size:12.4px;line-height:1.7">Пришло 8 000 000 ₸ за пять машин из Москвы. На счёте стало много, а ваших в этих деньгах — 400 000 ₸ комиссии, и из неё ещё половина — сотрудникам. Остальные 7 600 000 ₸ — водителям, но платить им через 5–10 дней, после выгрузки и документов. За эти дни деньги «растворяются»: аванс, солярка, зарплата — а потом не хватает водителю.</p>
   <div class="ex"><div><small>Пришло</small><b>8 000 000</b></div><div><small>Водителям</small><b>7 600 000</b></div><div><small>Ваша комиссия</small><b>400 000</b></div><div><small>Вам после сотрудников и фондов</small><b class="g">${fmt(Math.round(400000/1.12*RULES[3].p/100))}</b></div></div>
   ${said('«Я понимаю же, что там с пяти миллионов мой заработок — только максимум пятьсот тысяч» · «Деньги на счету лежат, и я их считаю как будто это мои».')}</div>
 </div>
 <div class="pan"><h3>Деньги водителей на счёте · ${tg(heldDrv())}</h3><div class="tw"><table class="t"><thead><tr><th>Рейс</th><th>Клиент</th><th>Оплатил</th><th>Лежит</th><th>Статус</th><th>Почему ещё не оплатили водителю</th><th class="r">Водителю</th></tr></thead><tbody>
 ${H.map(d=>`<tr class="clk" onclick="openDeal('${d.id}')"><td><b>${d.id}</b><div class="sub">${route(d)}</div></td><td>${esc(CL(d.cl).n)}</td><td class="mono">${dd(d.paidC)}</td><td><span class="tag ${daysBetween(d.paidC,TODAY)>7?'w':''}">${daysBetween(d.paidC,TODAY)} дн.</span></td><td>${stg(d.st)}</td><td class="mini">${d.st==='pay'?'документы на месте — можно платить сегодня':d.st==='docs'?(drvDocsOk(d)?'ждёт бухгалтера':'нет документов от водителя'):d.st==='unl'?'на выгрузке, документов ещё нет':'машина ещё в пути, выгрузка '+dd(d.unl)}</td><td class="r mono">${fmt(d.d)}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2">
  <div class="pan"><h3>Заплатили водителям своими · ${tg(Fz.reduce((a,d)=>a+d.d,0)+OTHERDEBT.drv)}</h3><p class="mini">Клиент ещё не оплатил, водителю уже отдали — это ваши оборотные, «замороженные» в чужих рейсах.</p>${Fz.map(d=>`<div class="kv clk" onclick="openDeal('${d.id}')"><span>${d.id} · ${esc(CL(d.cl).n)} ${fl(CL(d.cl).f)}</span><b class="mono">${fmt(d.d)}</b></div>`).join('')}<div class="kv"><span>ещё ${OTHERDEBT.n} клиентов, мелкие рейсы</span><b class="mono">${fmt(OTHERDEBT.drv)}</b></div></div>
  <div class="pan"><h3>Ещё не пришло вашей прибыли · ${tg(waitMine())}</h3><p class="mini">Ваша доля из комиссии по рейсам, за которые клиент ещё не заплатил.</p>${O.map(d=>`<div class="kv clk" onclick="openDeal('${d.id}')"><span>${d.id} · ${esc(CL(d.cl).n)}</span><b class="mono">${fmt(net(d)*RULES[3].p/100)}</b></div>`).join('')}<div class="kv"><span>ещё ${OTHERDEBT.n} клиентов</span><b class="mono">${fmt(OTHERDEBT.com*RULES[3].p/100)}</b></div></div>
 </div>
 ${said('«Мне нужно чётко понимать: мои деньги — не мои деньги».','Логисты и кураторы этого экрана не видят — только руководитель, бухгалтер видит календарь и долги.')}`};

SC.calendar=()=>{const P=projection();const first=new Date('2026-10-01T00:00:00Z').getUTCDay();const pad=(first+6)%7;const cells=[];for(let i=0;i<pad;i++)cells.push('<div class="cd emp"></div>');
 for(let i=1;i<=31;i++){const day='2026-10-'+String(i).padStart(2,'0');const p=P[day];const past=day<TODAY;const fx=p.E.filter(e=>e.k==='fix'||e.k==='paid');
  cells.push(`<div class="cd ph${phaseOf(i)} ${past?'past':''} ${day===TODAY?'now':''} ${!past&&p.bal<0?'bad':!past&&p.bal<2000000?'warn':''}" onclick="card('day','${day}')"><div class="ch"><b>${i}</b><small>${dayOf(day)}</small></div>${p.inn?`<span class="in">+ ${mln(p.inn)}</span>`:''}${p.out?`<span class="out">− ${mln(p.out)}</span>`:''}${fx.slice(0,2).map(e=>`<em class="${e.bx?'bxr':''}">${esc(e.n.split(' · ')[0])}</em>`).join('')}${p.bal!==null?`<strong>${mln(p.bal)}</strong>`:''}</div>`)}
 const low=Object.entries(P).filter(([k,v])=>v.bal!==null).sort((a,b)=>a[1].bal-b[1].bal)[0];
 return `<div class="hd"><div><h2>Календарь платежей · октябрь</h2><p>Каждый день: сколько придёт от клиентов, сколько уйдёт водителям и по обязательным платежам, и сколько останется на счёте. Красный день — денег не хватит: видно заранее, а не в шесть вечера.</p></div><div class="btns"><button class="bt" onclick="card('fixnew')">+ Платёж</button><button class="bt p" onclick="go('funds')">Неделя и фонды →</button></div></div>
 <div class="phs">${PHASES.map(p=>`<div class="ph ph${p[0]}"><b>${p[1]}</b><span>${p[2]}</span></div>`).join('')}</div>
 <div class="calg"><div class="cw">пн</div><div class="cw">вт</div><div class="cw">ср</div><div class="cw">чт</div><div class="cw">пт</div><div class="cw">сб</div><div class="cw">вс</div>${cells.join('')}</div>
 <div class="g2">
  <div class="note" style="--tone:var(--bad)"><b>Самый узкий день — ${dd(low[0])}: ${mln(low[1].bal)}</b><p>К этому дню выплаты водителям по выгрузкам и зарплата логистов обгоняют поступления. Варианты: напомнить должникам заранее (кнопка в «Кто должен»), сдвинуть часть зарплаты, как вы делаете, на 9–12 число, или не брать в эти дни рейсы с оплатой водителю до оплаты клиента.</p></div>
  <div class="note" style="--tone:var(--ok)"><b>Битрикс в календаре — последний раз</b><p>10.10: 176 000 ₸ — тариф «Бизнес» и интегратор. После переезда этот платёж уходит из календаря: около 2,1 млн ₸ в год.</p></div>
 </div>
 ${said('«Мне нужен какой-то календарь платежей: сколько я счетов выставил, сколько нужно за сегодня оплату произвести» · «Прибыль идёт кусками, а выход денег — сразу в первых числах, в миллионах».')}`};

SC.funds=()=>{const ex=DL('R-1016');const C=com(ex),V=vat(ex),N=C-V;const sum=RULES.reduce((a,r)=>a+r.p,0);
 const week=[];for(let i=0;i<7;i++)week.push(addDays(TODAY,i));const P=projection();
 const wIn=week.reduce((a,d)=>a+P[d].inn,0),wDrv=week.reduce((a,d)=>a+P[d].E.filter(e=>e.k==='out').reduce((x,e)=>x+e.s,0),0);
 const wFix=week.flatMap(d=>P[d].E.filter(e=>e.k==='fix'));
 const byF=k=>wFix.filter(e=>e.f===k).reduce((a,e)=>a+e.s,0);
 const TR=[['Halyk · ФОТ','staff',byF('staff')],['Kaspi · обязательные','fix',byF('fix')],['Halyk · налоги','tax',byF('tax')]].filter(x=>x[2]);
 return `<div class="hd"><div><h2>Фонды и неделя</h2><p>Каждая закрытая перевозка сама раскладывает комиссию по фондам — по вашим процентам. Раз в неделю, в понедельник, — план: что придёт, что уйдёт и сколько куда перевести.</p></div></div>
 <div class="g2">
  <div class="pan"><h3>Правила · как делится комиссия</h3><p class="mini">Сначала НДС — он не ваш и не считается в прибыль. Остальное — по процентам. Меняете здесь — пересчитывается всё.</p>
   ${RULES.map(r=>`<div class="rule"><i style="background:${r.c}"></i><div><b>${r.n}</b><span>${r.hint}</span></div><input type="number" value="${r.p}" min="0" max="100" onchange="setRule('${r.k}',this.value)"><em>%</em></div>`).join('')}
   <div class="kv"><span>Сумма</span><b class="${sum===100?'pos':'neg'}">${sum} %${sum===100?'':' — должно быть 100'}</b></div></div>
  <div class="pan"><h3>Пример: ${ex.id} · ${route(ex)}</h3>
   <div class="wf">
    <div><span>Клиент заплатил</span><b class="mono">${fmt(ex.c)}</b></div>
    <div><span>Водителю</span><b class="neg">− ${fmt(ex.d)}</b></div>
    <div class="sep"><span>Комиссия</span><b>${fmt(C)}</b></div>
    <div><span>НДС 12 % — в фонд НДС</span><b class="neg">− ${fmt(V)}</b></div>
    ${RULES.map(r=>`<div><span><i class="dot" style="background:${r.c}"></i>${r.n} · ${r.p} %</span><b class="mono">${fmt(N*r.p/100)}</b></div>`).join('')}
   </div>
   <p class="mini">Как в вашей таблице, только откладывается сразу, в момент закрытия перевозки: «сделка закрылась полностью — откинул».</p></div>
 </div>
 <div class="fgrid">${[['vat','НДС к уплате','#a8534a'],['staff','Фонд сотрудников','#2a6fb0'],['tax','Фонд налогов','#c23b3b'],['fix','Фонд обязательных','#8a5cc2']].map(([k,n,c])=>{const need=FIXED.filter(f=>f.f===k&&!f.done&&f.d>=TODAY).reduce((a,f)=>a+f.s,0);return `<div class="fund" style="--fc:${c}"><small>${n}</small><b>${tg(FUNDS[k])}</b><span>${need?`до конца месяца платить ${tg(need)}`:'платежи — в следующем месяце'}</span><div class="bar"><i style="width:${need?Math.min(100,pct(FUNDS[k],need)):100}%;background:${c}"></i></div><em class="${need&&FUNDS[k]<need?'neg':'pos'}">${need?(FUNDS[k]>=need?'хватает':'не хватает '+tg(need-FUNDS[k])+' — наберётся с закрытий'):'—'}</em></div>`}).join('')}</div>
 <div class="pan"><h3>Неделя ${dd(week[0])} – ${dd(week[6])} · понедельник, план</h3>
  <div class="ex"><div><small>Придёт от клиентов</small><b class="g">+ ${fmt(wIn)}</b></div><div><small>Уйдёт водителям</small><b class="neg">− ${fmt(wDrv)}</b></div><div><small>Обязательные</small><b class="neg">− ${fmt(wFix.reduce((a,e)=>a+e.s,0))}</b></div><div><small>Остаток на ${dd(week[6])}</small><b>${fmt(P[week[6]].bal)}</b></div></div>
  <div class="chk" style="margin-top:12px">${TR.map((t,i)=>`<div class="ci"><span class="bx" onclick="this.classList.toggle('on');this.textContent=this.classList.contains('on')?'✓':''"></span><span class="nm">Перевести <b>${tg(t[2])}</b> на счёт «${t[0]}» — платежи недели</span><span class="who">до ${dd(week[i+1]||week[1])}</span></div>`).join('')}
   <div class="ci"><span class="bx" onclick="this.classList.toggle('on');this.textContent=this.classList.contains('on')?'✓':''"></span><span class="nm">Напомнить ${owing().length} должникам до среды — иначе ${dd(Object.entries(P).filter(([k,v])=>v.bal!==null).sort((a,b)=>a[1].bal-b[1].bal)[0][0])} будет узко</span><span class="who">куратор</span></div></div></div>
 ${said('«Фонды сделай: допустим, водителям деньги, мои деньги, на налог откидывай» · «Бухгалтер в моменте с моего счёта два миллиона семьсот тысяч снимает — в налоги, а я планировал».','Платон: это недельное финансовое планирование; формулы фондов сядем и пропишем с вами.')}`};
function setRule(k,v){const r=RULES.find(x=>x.k===k);r.p=Math.max(0,Math.min(100,+v||0));render();toast('Правило изменено: '+r.n+' — '+r.p+' %. Пересчитаны пример и «моё свободно».')}

SC.debts=()=>{const O=owing().sort((a,b)=>b.c-a.c);const tot=O.reduce((a,d)=>a+d.c,0)+OTHERDEBT.sum;const drv=O.reduce((a,d)=>a+d.d,0)+OTHERDEBT.drv;
 return `<div class="hd"><div><h2>Кто должен</h2><p>Клиенты, которые ещё не оплатили выгруженные рейсы. По каждому: сколько из долга — деньги водителей, сколько — ваша комиссия, сколько дней просрочки и кто из кураторов ведёт.</p></div><div class="btns"><button class="bt" onclick="act('remindall')">Напомнить всем просроченным</button></div></div>
 <div class="wid">
  <div><small>Должны клиентов</small><b class="r">${O.length+OTHERDEBT.n}</b><span>за выгруженные рейсы</span></div>
  <div><small>Сумма долга</small><b>${mln(tot)}</b><span>с НДС</span></div>
  <div><small>Из неё — водителям</small><b>${mln(drv)}</b><span>часть уже заплатили своими</span></div>
  <div><small>Ваша комиссия в долгах</small><b class="w">${mln(tot-drv)}</b><span>до фондов</span></div>
  <div><small>Просрочено</small><b class="r">${O.filter(d=>clPayDay(d)<TODAY).length+9}</b><span>больше срока по договору</span></div>
 </div>
 <div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Рейс</th><th>Выгрузка</th><th>Срок оплаты</th><th>Просрочка</th><th class="r">Долг</th><th class="r">Водителю</th><th>Водителю оплачено?</th><th>Куратор</th><th></th></tr></thead><tbody>
 ${O.map(d=>{const late=daysBetween(clPayDay(d),TODAY);return `<tr><td><b class="lk" onclick="card('cl','${d.cl}')">${esc(CL(d.cl).n)}</b> ${fl(CL(d.cl).f)}</td><td class="lk" onclick="openDeal('${d.id}')">${d.id}</td><td class="mono">${dd(d.unl)}</td><td class="mono">${dd(clPayDay(d))}</td><td>${late>0?`<span class="tag r">${late} дн.</span>`:'<span class="tag">в срок</span>'}</td><td class="r mono">${fmt(d.c)}</td><td class="r mono">${fmt(d.d)}</td><td>${d.paidD?'<span class="tag w">да — своими</span>':'<span class="tag">ещё нет</span>'}</td><td>${STAFF[CL(d.cl).cur]}</td><td><button class="bt sm" onclick="act('remind','${d.cl}')">Напомнить</button></td></tr>`}).join('')}
 <tr class="total"><td>ещё ${OTHERDEBT.n} клиентов</td><td colspan="4" class="mini">мелкие рейсы по Казахстану, от 60 000 до 480 000 ₸</td><td class="r mono">${fmt(OTHERDEBT.sum)}</td><td class="r mono">${fmt(OTHERDEBT.drv)}</td><td colspan="3"></td></tr></tbody></table></div>
 <div class="g2"><div class="note"><b>Акт сверки — одной кнопкой</b><p>Откройте клиента → «Акт сверки»: все рейсы, оплаты и долг за период. Куратор отправляет его клиенту, бухгалтеру ничего собирать не нужно.</p></div>
 <div class="note" style="--tone:var(--bad)"><b>ИП Сагындыков — красная пометка</b><p>«Неплатёжеспособен, только предоплата». Если логист создаст ему заявку без предоплаты — карточка подсветится, а вам придёт уведомление.</p></div></div>
 ${said('«Мне должны тридцать два клиента… одни пятьсот тысяч, из которых водителям четыреста оплатить; другие полтора миллиона, из которых миллион триста семьдесят — водителям».')}`};

SC.analytics=()=>{const mx=Math.max(...MONTHS.map(m=>m[2]));const last=MONTHS[MONTHS.length-1];
 const byCl={};DEALS.forEach(d=>{byCl[d.cl]=byCl[d.cl]||{n:0,c:0};byCl[d.cl].n++;byCl[d.cl].c+=com(d)});const topCl=Object.entries(byCl).sort((a,b)=>b[1].c-a[1].c).slice(0,7);const tc=topCl[0][1].c;
 const ex=DL('R-1004');const C=com(ex),V=vat(ex),N=C-V;
 return `<div class="hd"><div><h2>Аналитика</h2><p>Ваша таблица с дашбордом — внутри системы. Цифры собираются из перевозок сами: сколько заработали в моменте, по клиентам, по логистам, международные и внутренние, налоги, проценты, план.</p></div><div class="btns"><button class="bt" onclick="act('xls')">Выгрузить в Excel</button></div></div>
 <div class="wid">
  <div><small>Фур в сентябре</small><b>${last[1]}</b><span>≈ ${Math.round(last[1]/26)} в рабочий день</span></div>
  <div><small>Комиссия</small><b class="a">${mln(last[2])}</b><span>+${pct(last[2]-MONTHS[2][2],MONTHS[2][2])} % к августу</span></div>
  <div><small>Сотрудникам · 50 %</small><b>${mln(last[2]/1.12*.5)}</b><span>логисты, кураторы, лиды</span></div>
  <div><small>Средняя комиссия</small><b>${fmt(last[2]/last[1])}</b><span>₸ с машины</span></div>
  <div><small>План компании</small><b class="w">${pct(last[2],PLAN)} %</b><span>${mln(last[2])} из ${mln(PLAN)}</span></div>
 </div>
 <div class="g2">
  <div class="pan"><h3>Комиссия по месяцам</h3><div class="bars">${MONTHS.map(m=>`<div><b>${mln(m[2])}</b><i style="height:${Math.round(m[2]/mx*120)}px"></i><span>${m[0]}<br><small>${m[1]} фур</small></span></div>`).join('')}<div class="pl"><b>${mln(PLAN)}</b><i style="height:${Math.min(150,Math.round(PLAN/mx*120))}px"></i><span>План<br><small>нужно</small></span></div></div></div>
  <div class="pan"><h3>Международные и внутренние · сентябрь</h3>
   <div class="mix"><div style="flex:64"><b>64 фуры · 36 %</b><span>международные</span></div><div style="flex:115"><b>115 фур · 64 %</b><span>по Казахстану</span></div></div>
   <div class="mix c"><div style="flex:62"><b>5,6 млн · 62 %</b><span>комиссии</span></div><div style="flex:38"><b>3,4 млн · 38 %</b><span>комиссии</span></div></div>
   <p class="mini">Международная машина приносит в среднем 87 500 ₸, внутренняя — 29 600 ₸. Но и риск выше: простой, штраф — и вся комиссия съедается.</p></div>
 </div>
 <div class="g2">
  <div class="pan"><h3>Клиенты · комиссия</h3>${topCl.map(([k,v])=>`<div class="hb clk" onclick="card('cl','${k}')"><span>${esc(CL(k).n)} ${fl(CL(k).f)}</span><i style="width:${Math.round(v.c/tc*100)}%"></i><b class="mono">${fmt(v.c)}</b></div>`).join('')}</div>
  <div class="pan"><h3>Логисты · принесли компании</h3>${KPI.map(k=>`<div class="hb clk" onclick="go('kpi')"><span>${k.n} · ${k.tr} фур</span><i style="width:${Math.round(k.com/KPI[0].com*100)}%;background:${k.com<k.plan?'var(--bad)':'var(--brand)'}"></i><b class="mono">${fmt(k.com)}</b></div>`).join('')}</div>
 </div>
 <div class="pan"><h3>Строка сделки — как в вашей таблице · ${ex.id}</h3><div class="tw"><table class="t"><thead><tr><th class="r">Клиент</th><th class="r">Водитель</th><th class="r">Комиссия</th><th class="r">НДС</th><th class="r">Логист 30 %</th><th class="r">Куратор 12 %</th><th class="r">Лиды 8 %</th><th class="r">Налоги</th><th class="r">Обязат.</th><th class="r">Вам</th><th class="r">Маржа</th></tr></thead><tbody><tr>
  <td class="r mono">${fmt(ex.c)}</td><td class="r mono">${fmt(ex.d)}</td><td class="r mono">${fmt(C)}</td><td class="r mono">${fmt(V)}</td><td class="r mono">${fmt(N*.3)}</td><td class="r mono">${fmt(N*.12)}</td><td class="r mono">${fmt(N*.08)}</td><td class="r mono">${fmt(N*RULES[1].p/100)}</td><td class="r mono">${fmt(N*RULES[2].p/100)}</td><td class="r mono"><b>${fmt(N*RULES[3].p/100)}</b></td><td class="r mono">${(N*RULES[3].p/100/ex.c*100).toFixed(1).replace('.',',')} %</td></tr></tbody></table></div>
  <p class="mini">Формулы переносим из вашей таблицы один в один — ваш программист уже всё собрал; мы подключим её к перевозкам, чтобы ничего не вбивать дважды.</p></div>
 ${said('«У меня есть программист, который все мои мысли собрал в одну таблицу: сколько я зарабатываю, какой процент на какую компанию заходит, сколько налогов, сколько лидов отработано».')}`};

SC.kpi=()=>{const me=role==='Логист'?'DN':null;const K=me?KPI.filter(k=>k.k===me):KPI;
 return `<div class="hd"><div><h2>План и KPI логистов</h2><p>Логист видит не только свой заработок, но и сколько он принёс компании и сколько должен по плану. Зарплата — 30 % от чистой комиссии, гарантия 450 000 ₸; план — 2,1 млн ₸ комиссии в месяц на логиста.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Логист</th><th class="r">Фур</th><th class="r">Принёс комиссии</th><th class="r">План</th><th>Выполнение</th><th class="r">Заработал сам</th><th class="r">Компании осталось</th><th>Вывод</th></tr></thead><tbody>
 ${K.map(k=>{const p=pct(k.com,k.plan);return `<tr><td><b>${k.n}</b></td><td class="r mono">${k.tr}</td><td class="r mono">${fmt(k.com)}</td><td class="r mono">${fmt(k.plan)}</td><td style="min-width:150px"><div class="bar"><i style="width:${Math.min(100,p)}%;background:${p<60?'var(--bad)':p<100?'var(--warn)':'var(--ok)'}"></i></div><span class="mini">${p} %</span></td><td class="r mono">${fmt(k.pay)}</td><td class="r mono">${fmt(k.com/1.12-k.pay)}</td><td>${p>=100?'<span class="tag g">выше плана</span>':p>=80?'<span class="tag w">почти</span>':`<span class="tag r">гарантия больше, чем принёс</span>`}</td></tr>`}).join('')}</tbody></table></div>
 ${me?'':`<div class="g2"><div class="note" style="--tone:var(--bad)"><b>Мадина: 15 фур, 900 000 ₸ комиссии, заработала 450 000 ₸</b><p>Компании от неё — около 350 000 ₸ до налогов и аренды. По плану должна приносить минимум 2,1 млн. Видно с первого дня месяца, а не в конце.</p></div>
 <div class="note"><b>Октябрь · идёт</b><p>Данияр — 11 фур за 5 дней, Тимур — 8, Бекзат — 7, Мадина — 2. Строка обновляется с каждой закрытой перевозкой; логист видит свою.</p></div></div>`}
 ${said('«Многие сидят, им триста тысяч хватает… пятнадцать фур отгрузил и сидит. Занёс девятьсот тысяч, а минимум два сто должен» · «Разрабатываю KPI для логистов».')}`};

/* ===== Перевозки ===== */
const myDeals=()=>role==='Логист'?DEALS.filter(d=>d.lg==='DN'):role==='Куратор'?DEALS.filter(d=>d.cur==='AS'):DEALS;
SC.board=()=>{const L=myDeals();
 return `<div class="hd"><div><h2>Доска перевозок${role==='Логист'?' · мои':role==='Куратор'?' · мои клиенты':''}</h2><p>Те же статусы, что сейчас в Битриксе: заявка → договоры → погрузка → в пути → выгрузка → документы → оплата водителю. Карточка не идёт на погрузку без галочки офис-менеджера и не идёт к оплате без документов водителя.</p></div><div class="btns"><button class="bt p" onclick="card('newdeal')">+ Перевозка</button></div></div>
 <div class="kb">${ST.map(s=>{const X=L.filter(d=>d.st===s.k);return `<div class="kc" style="--sc:${s.c}"><div class="kh"><b>${s.n}</b><span>${X.length}</span></div>${X.map(d=>`<div class="kd ${(['load','road'].includes(d.st)&&!d.ok)||(d.st==='unl'&&!drvDocsOk(d))?'alarm':''}" onclick="openDeal('${d.id}')"><div class="kt"><b>${d.id}</b>${d.intl?'<span class="tag a">МЕЖД</span>':''}${!d.ok&&STI(d.st)>=1?'<span class="lock" title="Нет галочки «согласовано»">⊘</span>':''}</div><div class="kr">${route(d)}</div><div class="km">${esc(CL(d.cl).n)} ${fl(CL(d.cl).f)}</div><div class="km">${esc(DR(d.dr).n)} ${fl(DR(d.dr).f)}</div><div class="kf"><span>${STAFF[d.lg]}</span><span>${d.paidC?'<i class="pc g">оплачено</i>':''}</span><b class="mono">${fmt(com(d))}</b></div></div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>
 ${said('«Карточка не передвигается, пока офис-менеджеру не сдадут подписанный договор с водителем и аналогично с клиентом» · «А если на выгрузку не перешла карточка — бухгалтер не оплачивает».')}`};

function openDeal(id){if(!allowed('deal')){toast('Карточка перевозки этой роли недоступна.');return}curDeal=id;go('deal')}
SC.deal=()=>{const d=DL(curDeal)||DEALS[0];const c=CL(d.cl),r=DR(d.dr);const si=STI(d.st);const C=com(d),V=vat(d);
 const blk=nextBlock(d);
 return `<div class="hd"><div><div class="crumb"><a onclick="go('board')">Доска</a> / ${d.id}</div><h2>${d.id} · ${route(d)}</h2><p>${d.intl?'Международная':'По Казахстану'} · погрузка ${dd(d.load)} · выгрузка ${dd(d.unl)} · логист ${STAFF[d.lg]} · куратор ${STAFF[d.cur]}</p></div>
  <div class="btns">${d.st==='pay'&&!d.paidD&&(role==='Руководитель'||role==='Бухгалтер')?`<button class="bt p" onclick="payDrv('${d.id}')">Оплачено водителю ${fmt(d.d)} ₸</button>`:''}${d.st!=='done'&&d.st!=='pay'?`<button class="bt ${blk?'':'p'}" onclick="nextSt('${d.id}')">→ ${STN(ST[si+1].k).n}</button>`:''}</div></div>
 <div class="stp">${ST.map((s,i)=>`<div class="${i<si?'ok':i===si?'on':''}" style="--sc:${s.c}"><i>${i<si?'✓':i+1}</i><span>${s.n}</span></div>`).join('')}</div>
 ${blk?`<div class="note" style="--tone:var(--bad)"><b>Дальше не двигается: ${blk}</b><p>Так задумано — как у вас в Битриксе, только проще: галочка в этой же карточке, без отдельного согласования.</p></div>`:''}
 <div class="g3">
  <div class="pan"><h3>Клиент</h3><div class="kv"><span>Компания</span><b class="lk" onclick="card('cl','${c.id}')">${esc(c.n)} ${fl(c.f)}</b></div><div class="kv"><span>Телефон</span><b class="mono">${c.ph}</b></div><div class="kv"><span>Оплата</span><b>${c.term?'через '+c.term+' дн. после выгрузки':'предоплата'}</b></div>${c.f!=='ok'?`<div class="pin ${c.f}">${esc(c.note)}</div>`:''}</div>
  <div class="pan"><h3>Водитель</h3><div class="kv"><span>Перевозчик</span><b class="lk" onclick="card('dr','${r.id}')">${esc(r.n)} ${fl(r.f)}</b></div><div class="kv"><span>Машина</span><b>${esc(r.truck)} · <span class="mono">${esc(r.plate)}</span></b></div><div class="kv"><span>Телефон</span><b class="mono">${r.ph}</b></div>${r.f!=='ok'||r.note.length>3?`<div class="pin ${r.f}">${esc(r.note)}</div>`:''}</div>
  <div class="pan"><h3>Деньги</h3><div class="kv"><span>Ставка клиента</span><b class="mono">${fmt(d.c)}</b></div><div class="kv"><span>Ставка водителю</span><b class="mono">${fmt(d.d)}</b></div><div class="kv"><span>Комиссия</span><b class="mono pos">${fmt(C)}</b></div>
   <div class="kv"><span>НДС</span><b><span class="seg"><a class="${d.nds?'on':''}" onclick="setNds('${d.id}',1)">с НДС</a><a class="${d.nds?'':'on'}" onclick="setNds('${d.id}',0)">без НДС</a></span></b></div>
   <div class="kv"><span>Клиент оплатил</span><b>${d.paidC?`<span class="tag g">${dd(d.paidC)}</span>`:`<button class="bt sm" onclick="paidC('${d.id}')">Отметить оплату</button>`}</b></div><div class="kv"><span>Водителю оплачено</span><b>${d.paidD?'<span class="tag g">да</span>':'<span class="tag">нет</span>'}</b></div></div>
 </div>
 <div class="g2">
  <div class="pan"><h3>Договоры-заявки · проверяет офис-менеджер</h3><div class="chk">
   <div class="ci"><span class="bx ${d.cc?'on':''}" onclick="togC('${d.id}','cc')">${d.cc?'✓':''}</span><span class="nm">Договор-заявка с клиентом подписан</span><span class="who">${d.cc?'фото / PDF в карточке':'нет'}</span></div>
   <div class="ci"><span class="bx ${d.cd?'on':''}" onclick="togC('${d.id}','cd')">${d.cd?'✓':''}</span><span class="nm">Договор-заявка с водителем подписан</span><span class="who">${d.cd?'фото бумажного договора':'нет'}</span></div>
   <div class="ci hi"><span class="bx ${d.ok?'on':''}" onclick="setOk('${d.id}')">${d.ok?'✓':''}</span><span class="nm"><b>Согласовано</b> — офис-менеджер проверил, карточку можно двигать</span><span class="who">${d.ok?'Жанна':''}</span></div></div>
   <p class="mini">Водителю электронная подпись не нужна: он подписывает бумагу, логист фотографирует — фото в карточке.</p></div>
  <div class="pan"><h3>Документы по рейсу · ${d.docs.filter(Boolean).length} из 6</h3><div class="chk">${DOCN.map((n,i)=>`<div class="ci"><span class="bx ${d.docs[i]?'on':''}" onclick="togDoc('${d.id}',${i})">${d.docs[i]?'✓':''}</span><span class="nm">${n}${i===0?` <a class="lk" onclick="card('inv','${d.id}')">открыть</a>`:''}</span><span class="who">${i<3?'мы → клиенту':'водитель → нам'}</span></div>`).join('')}</div></div>
 </div>
 <div class="pan"><h3>Ход перевозки</h3><div class="tl">${dealLog(d).map(x=>`<div class="tli ${x[2]||'ok'}"><span class="who">${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div></div>`};
function dealLog(d){const L=[[dd(addDays(d.load,-3))+' · '+STAFF[d.cur],'Заявка от клиента: '+route(d)],[dd(addDays(d.load,-2))+' · '+STAFF[d.lg],'Найдена машина: '+DR(d.dr).n+', '+DR(d.dr).truck]];
 if(d.cc)L.push([dd(addDays(d.load,-2))+' · Жанна','Договор-заявка с клиентом — подписан']);if(d.cd)L.push([dd(addDays(d.load,-1))+' · Жанна','Договор-заявка с водителем — фото бумажного договора']);else if(STI(d.st)>=1)L.push(['сейчас','Договора с водителем нет — карточка ждёт','bad']);
 if(d.paidC)L.push([dd(d.paidC)+' · банк','Клиент оплатил '+tg(d.c)+(d.paidD?'':' — '+tg(d.d)+' из них — деньги водителя')]);
 if(STI(d.st)>=2)L.push([dd(d.load),'Погрузка']);if(STI(d.st)>=3)L.push([dd(addDays(d.load,1)),'В пути — геолокация клиенту отправлена']);if(STI(d.st)>=4)L.push([dd(d.unl),'Выгрузка']);if(STI(d.st)>=5)L.push([dd(addDays(d.unl,1)),'Документы: '+d.docs.filter(Boolean).length+' из 6']);
 if(d.paidD)L.push(['закрыто','Водителю оплачено, комиссия разложена по фондам']);return L.concat(d.log)}
function nextBlock(d){const n=ST[STI(d.st)+1];if(!n)return '';if(n.k==='load'&&!d.ok)return !d.cd?'нет подписанного договора-заявки с водителем':!d.cc?'нет договора-заявки с клиентом':'офис-менеджер ещё не поставил галочку «согласовано»';
 if(n.k==='pay'&&!drvDocsOk(d))return 'нет документов от перевозчика: '+DOCN.filter((x,i)=>i>2&&!d.docs[i]).join(', ');if(STI(d.st)>=1&&STI(d.st)<4&&!d.ok&&n.k!=='load')return 'нет галочки «согласовано» — договоры не сданы';return ''}
function nextSt(id){const d=DL(id);const b=nextBlock(d);if(b){toast('Карточка не двигается: '+b+'.');beep();return}d.st=ST[STI(d.st)+1].k;d.log.push(['сейчас · '+ROLES[role].n,'Статус: '+STN(d.st).n]);render();toast(`${d.id} → «${STN(d.st).n}».`+(d.st==='unl'?' Водителю и бухгалтеру напомнили про документы.':''))}
function payDrv(id){const d=DL(id);d.paidD=true;d.st='done';if(d.paidC){const N=net(d);FUNDS.vat+=vat(d);FUNDS.staff+=N*RULES[0].p/100;FUNDS.tax+=N*RULES[1].p/100;FUNDS.fix+=N*RULES[2].p/100}BANK.open-=d.d;render();toast(`Водителю ${DR(d.dr).n} оплачено ${tg(d.d)}. Комиссия ${tg(com(d))} разложена по фондам.`)}
function paidC(id){const d=DL(id);d.paidC=TODAY;BANK.open+=d.c;render();toast(`Оплата от ${CL(d.cl).n}: ${tg(d.c)}. Из них ${tg(d.d)} — деньги водителя, система держит их отдельно.`)}
function togC(id,k){if(!['Руководитель','Офис-менеджер'].includes(role)){toast('Договоры отмечает офис-менеджер.');return}const d=DL(id);d[k]=!d[k];if(!d.cc||!d.cd)d.ok=false;render()}
function setOk(id){if(!['Руководитель','Офис-менеджер'].includes(role)){toast('Галочку «согласовано» ставит офис-менеджер.');return}const d=DL(id);if(!d.ok&&(!d.cc||!d.cd)){toast('Сначала оба договора-заявки: с клиентом и с водителем.');return}d.ok=!d.ok;render();toast(d.ok?`${d.id} согласовано — карточку можно двигать.`:'Галочка снята.')}
function togDoc(id,i){const d=DL(id);d.docs[i]=d.docs[i]?0:1;render()}
function setNds(id,v){const d=DL(id);d.nds=!!v;render();toast(v?'Счёт и ЭСФ — с НДС 12 %.':'Счёт без НДС.')}

SC.check=()=>{const Q=DEALS.filter(d=>!d.ok&&d.st!=='done');const okd=DEALS.filter(d=>d.ok&&['load','road'].includes(d.st));
 return `<div class="hd"><div><h2>Проверка договоров</h2><p>Очередь офис-менеджера: новые заявки и всё, где не хватает подписанного договора-заявки. Проверила — поставила галочку прямо здесь, без отдельного «согласовать».</p></div></div>
 <div class="wid"><div><small>Ждут проверки</small><b class="w">${Q.length}</b><span>карточек</span></div><div><small>Грузятся без договора</small><b class="r">${Q.filter(d=>['load','road'].includes(d.st)).length}</b><span>красный флаг</span></div><div><small>Согласовано в работе</small><b class="g">${okd.length}</b><span>погрузка и в пути</span></div><div><small>В сентябре</small><b>179</b><span>договоров с водителями</span></div><div><small>Без договора в сентябре</small><b class="g">0</b><span>правило работает</span></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Рейс</th><th>Статус</th><th>Клиент</th><th>Водитель</th><th>Логист</th><th>С клиентом</th><th>С водителем</th><th>Согласовано</th></tr></thead><tbody>
 ${Q.map(d=>`<tr class="${['load','road'].includes(d.st)?'rowbad':''}"><td><b class="lk" onclick="openDeal('${d.id}')">${d.id}</b><div class="sub">${route(d)} · ${dd(d.load)}</div></td><td>${stg(d.st)}</td><td>${esc(CL(d.cl).n)}</td><td>${esc(DR(d.dr).n)} ${fl(DR(d.dr).f)}</td><td>${STAFF[d.lg]}</td><td><span class="bx ${d.cc?'on':''}" onclick="togC('${d.id}','cc')">${d.cc?'✓':''}</span></td><td><span class="bx ${d.cd?'on':''}" onclick="togC('${d.id}','cd')">${d.cd?'✓':''}</span></td><td><span class="bx big ${d.ok?'on':''}" onclick="setOk('${d.id}')">${d.ok?'✓':''}</span></td></tr>`).join('')}</tbody></table></div>
 <div class="note"><b>Водители и электронная подпись</b><p>Не используем: водитель подписывает бумагу, логист фотографирует, фото прикрепляется к карточке. Клиенты, которым удобно, подписывают договор-заявку по ссылке.</p></div>
 ${said('«Не обязательно ей нажимать „согласовать“ — она просто эти карточки проверяет и в той же карточке ставит галочку „согласовала“» · «Водителю ссылку скидываешь — он: вы что, на меня кредит хотите оформить?»')}`};

SC.docs=()=>{const L=myDeals().filter(d=>STI(d.st)>=4);
 return `<div class="hd"><div><h2>Документы по рейсам</h2><p>На каждый рейс — шесть документов: три мы выставляем клиенту, три получаем от водителя. Пустая клетка — то, что надо сделать или запросить. Клик по клетке — отметить.</p></div><div class="btns"><button class="bt" onclick="act('esfall')">Выписать ЭСФ пачкой</button></div></div>
 <div class="tw"><table class="t dm"><thead><tr><th>Рейс</th><th>Статус</th>${DOCN.map((n,i)=>`<th class="c ${i===3?'bl':''}">${n.replace(' клиенту','').replace(' от перевозчика','')}<span>${i<3?'клиенту':'от водителя'}</span></th>`).join('')}<th>НДС</th></tr></thead><tbody>
 ${L.map(d=>`<tr><td><b class="lk" onclick="openDeal('${d.id}')">${d.id}</b><div class="sub">${esc(CL(d.cl).n)} · ${esc(DR(d.dr).n)}</div></td><td>${stg(d.st)}</td>${d.docs.map((x,i)=>`<td class="c ${i===3?'bl':''}"><span class="dc ${x?'on':''}" onclick="togDoc('${d.id}',${i})">${x?'✓':'—'}</span></td>`).join('')}<td>${d.nds?'<span class="tag">12 %</span>':'<span class="tag a">без</span>'}</td></tr>`).join('')}</tbody></table></div>
 <div class="g2"><div class="note"><b>С НДС или без — переключатель в карточке</b><p>Счёт, АВР и ЭСФ собираются из карточки: клиент, ставка, маршрут, машина. ИП и ТОО, с НДС и без — шаблон подставляется сам, вручную ничего не перебивается.</p></div>
 <div class="note" style="--tone:var(--warn)"><b>Акт сверки</b><p>Раз в месяц по клиенту — из «Кто должен» или из карточки клиента.</p></div></div>
 ${said('«На один маршрут выписываем шесть документов: счёт на оплату, акт сверки, акт выполненных работ и электронный счёт-фактуру для налоговой» · «То с НДС, то без НДС — очень много времени занимает».')}`};

SC.buh=()=>{const pay=DEALS.filter(d=>d.st==='pay'&&!d.paidD);const wait=DEALS.filter(d=>['unl','docs'].includes(d.st)&&!d.paidD);const inv=DEALS.filter(d=>afterUnl(d)&&(!d.docs[0]||!d.docs[1]||!d.docs[2]));
 return `<div class="hd"><div><h2>Кабинет бухгалтера</h2><p>Бухгалтер на аутсорсе открывает один экран вместо пятисот сообщений в WhatsApp: кому платить сегодня, что выставить клиентам, какие документы запросить у водителей. 1С не подключаем — она закрывает у себя, здесь только видит.</p></div></div>
 <div class="g2">
  <div class="pan"><h3>Оплатить водителям сегодня · ${tg(pay.reduce((a,d)=>a+d.d,0))}</h3>${pay.map(d=>`<div class="pr"><div><b class="lk" onclick="openDeal('${d.id}')">${d.id} · ${esc(DR(d.dr).ip)}</b><span>${route(d)} · документы 3 из 3 · ${d.paidC?'клиент оплатил '+dd(d.paidC):'клиент ещё не оплатил'}</span></div><b class="mono">${fmt(d.d)}</b><button class="bt sm p" onclick="payDrv('${d.id}')">Оплачено</button></div>`).join('')||'<p class="mini">Сегодня оплат нет.</p>'}</div>
  <div class="pan"><h3>Ждут документов от водителей</h3>${wait.map(d=>`<div class="pr"><div><b class="lk" onclick="openDeal('${d.id}')">${d.id} · ${esc(DR(d.dr).n)}</b><span>нет: ${DOCN.filter((x,i)=>i>2&&!d.docs[i]).map(x=>x.replace(' от перевозчика','')).join(', ')||'—'}</span></div><button class="bt sm" onclick="act('askdocs','${d.dr}')">Запросить</button></div>`).join('')}</div>
 </div>
 <div class="pan"><h3>Выставить клиентам</h3><div class="tw"><table class="t"><thead><tr><th>Рейс</th><th>Клиент</th><th>НДС</th><th>Счёт</th><th>АВР</th><th>ЭСФ</th><th class="r">Сумма</th></tr></thead><tbody>${inv.map(d=>`<tr><td class="lk" onclick="openDeal('${d.id}')">${d.id}</td><td>${esc(CL(d.cl).n)}</td><td>${d.nds?'с НДС':'без'}</td>${[0,1,2].map(i=>`<td><span class="dc ${d.docs[i]?'on':''}" onclick="togDoc('${d.id}',${i})">${d.docs[i]?'✓':'—'}</span></td>`).join('')}<td class="r mono">${fmt(d.c)}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('«Бухгалтер пусть сам сидит у себя, закрывает — не надо завязывать. Чтоб она этим дашбордом тоже… а то пятьсот переписок, с WhatsApp на WhatsApp».')}`};

/* ===== Команда ===== */
const tdue=t=>t.due.slice(8,10)+'.'+t.due.slice(5,7)+' '+t.due.slice(11);
const lateH=t=>Math.max(1,Math.round((new Date(TODAY+'T'+NOW+':00Z')-new Date(t.due.replace(' ','T')+':00Z'))/36e5));
SC.tasks=()=>{const T=role==='Руководитель'?TASKS:TASKS.filter(t=>t.who===ROLES[role].p);const who=[...new Set(T.map(t=>t.who))];
 return `<div class="hd"><div><h2>Задачи и красные флаги</h2><p>Каждая задача — со сроком. Не отработал вовремя — красный флаг, руководителю уведомление, а у сотрудника закрывается его дашборд: свой заработок и цифры он не увидит, пока не напишет, что сделал.</p></div><div class="btns">${role==='Руководитель'?`<button class="bt p" onclick="card('task')">+ Задача</button>`:''}</div></div>
 <div class="wid"><div><small>Открыто</small><b>${T.filter(t=>!t.ok).length}</b><span>задач</span></div><div><small>Просрочено</small><b class="r blink">${T.filter(overdue).length}</b><span>красный флаг</span></div><div><small>Дашборд закрыт</small><b class="r">${[...new Set(T.filter(overdue).map(t=>t.who))].map(k=>STAFF[k]).join(', ')||'—'}</b><span>до отработки</span></div><div><small>Отработано в срок</small><b class="g">87 %</b><span>за сентябрь</span></div><div><small>Утро и вечер</small><b>09:30 · 18:30</b><span>сбор по задачам</span></div></div>
 ${who.map(k=>`<div class="pan"><h3>${STAFF[k]}${T.some(t=>t.who===k&&overdue(t))?' <span class="tag r">дашборд закрыт</span>':''}</h3>${T.filter(t=>t.who===k).map(t=>`<div class="tk ${t.ok?'done':overdue(t)?'over':''}"><i></i><div><b>${esc(t.t)}</b><span>срок ${tdue(t)} · поставил ${STAFF[t.by]}${t.deal?` · <a class="lk" onclick="openDeal('${t.deal}')">${t.deal}</a>`:''}${overdue(t)?` · <em>просрочено ${lateH(t)} ч</em>`:''}${t.res?` · ${esc(t.res)}`:''}</span></div>${t.ok?'<span class="tag g">отработано</span>':`<button class="bt sm ${overdue(t)?'p':''}" onclick="card('done','${t.id}')">Отработал</button>`}</div>`).join('')}</div>`).join('')}
 ${said('«Если он по задаче не даст обратную связь, не отработает — у меня всё это должно ребром стоять, ред флаг» · «Заходит в приложение — дашборд не открывается, блок стоит: невыполненная задача. Отработал — доступ включается».','Привязку к начислению зарплаты продумаем вместе на шлифовке.')}`};
function doneTask(id){const t=TASKS.find(x=>x.id===id);const v=(document.getElementById('dn_r')||{}).value||'';if(v.trim().length<5){toast('Напишите коротко, что сделали — иначе задача не закроется.');return}t.ok=1;t.res=v.trim();closeM();render();toast(`Задача закрыта. Дашборд ${STAFF[t.who]} снова открыт.`)}

const ALERTS=[
 {lv:'bad',t:'Андрей Литвинов на выгрузке (R-1013) — ждёт оплату, документов нет',at:'10:12',go:"openDeal('R-1013')"},
 {lv:'bad',t:'R-1017 грузится без договора-заявки с водителем',at:'09:55',go:"openDeal('R-1017')"},
 {lv:'bad',t:'Задача Данияра просрочена — его дашборд закрыт',at:'09:00',go:"go('tasks')"},
 {lv:'warn',t:'Сегодня оплатить водителям 4 795 000 ₸ — по R-1012 и R-1006 не хватает документов',at:'09:00',go:"go('buh')"},
 {lv:'warn',t:'«Бәйтерек Мебель» не оплатил 2 600 000 ₸ — водителю заплатили своими 20.09',at:'09:00',go:"go('debts')"},
 {lv:'info',t:'Понедельник: план недели и переводы по фондам готовы',at:'08:00',go:"go('funds')"},
 {lv:'ok',t:'«Каспий Агро» оплатил 640 000 ₸ — комиссия разложена по фондам',at:'вчера',go:"go('money')"}
];
const ASET={snd:1,blink:1,push:1,night:1};
SC.alerts=()=>`<div class="hd"><div><h2>Уведомления</h2><p>Не колокольчик, который никто не открывает: важное мигает красным сверху, пищит и приходит пуш на телефон. Пока не отреагировал — горит.</p></div><div class="btns"><button class="bt p" onclick="beep();flash();toast('Так звучит и мигает красное уведомление.')">Проверить звук и мигание</button></div></div>
 <div class="g21"><div class="pan">${ALERTS.map(a=>`<div class="al ${a.lv}" onclick="${a.go}"><i></i><div><b>${esc(a.t)}</b><span>${a.at}</span></div></div>`).join('')}</div>
 <div class="pan"><h3>Как приходит</h3>${[['snd','Звук на компьютере и телефоне'],['blink','Мигает красным в шапке, пока не открыли'],['push','Пуш на телефон — даже если приложение закрыто'],['night','Ночью тоже — у вас звонят и в 2 часа']].map(([k,n])=>`<div class="srow"><span class="nm">${n}</span><span class="sw ${ASET[k]?'on':''}" onclick="ASET['${k}']=ASET['${k}']?0:1;render()"></span></div>`).join('')}
  <h3 style="margin-top:16px">Кому что</h3>${[['Руководителю','все красные, оплаты клиентов, кассовый разрыв'],['Логисту','его рейсы: выгрузка, документы, задачи'],['Куратору','оплаты и просрочки его клиентов'],['Офис-менеджеру','новые заявки без договоров'],['Бухгалтеру','к оплате водителям, документы']].map(x=>`<div class="kv"><span>${x[0]}</span><b class="mini">${x[1]}</b></div>`).join('')}</div></div>
 <div class="note" style="--tone:var(--muted)"><b>Чатов и чат-бота нет — специально</b><p>Клиенты звонят логисту напрямую, ночью — и это правильно для тендерных грузов. Переписку в систему не тянем; звонок фиксируется задачей или заметкой в карточке.</p></div>
 ${said('«Нужны уведомления, чтобы прямо моргали, пикали, горели» · «Чат-бот? Клиент пошлёт — товар на тендер на пятнадцать миллионов едет, а ему робот отвечает».')}`;

SC.my=()=>{const me=role==='Куратор'?'AS':'DN';const T=TASKS.filter(t=>t.who===me&&!t.ok);const od=T.filter(overdue);const k=KPI.find(x=>x.k===me);
 const L=DEALS.filter(d=>(me==='AS'?d.cur:d.lg)===me&&d.st!=='done');
 if(od.length)return `<div class="lockv"><div class="lk-ic">⊘</div><h2>Дашборд закрыт</h2><p>${STAFF[me]}, у вас просрочена задача. Свой заработок, план и цифры вы увидите, как только напишете, что сделали.</p>
  ${od.map(t=>`<div class="tk over"><i></i><div><b>${esc(t.t)}</b><span>срок ${tdue(t)} · просрочено ${lateH(t)} ч · поставил ${STAFF[t.by]}</span></div><button class="bt p" onclick="card('done','${t.id}')">Отработал — написать результат</button></div>`).join('')}
  <p class="mini">Перевозки и карточки при этом работают — закрыт только личный дашборд.</p>${role==='Руководитель'?'<p class="mini">Вы смотрите глазами логиста Данияра.</p>':''}</div>
 <div class="g3 locked">${[['Мой заработок за октябрь','30 % от чистой комиссии по моим рейсам, гарантия и бонус за план'],['План и выполнение','сколько фур и комиссии принёс компании и сколько осталось до 2,1 млн'],['Мои рейсы и задачи','список на сегодня: погрузки, выгрузки, документы, звонки клиентам']].map(x=>`<div class="pan"><h3>${x[0]}</h3><p class="mini">${x[1]}</p><div class="blur">●●● ●●● ₸</div></div>`).join('')}</div>`;
 return `<div class="hd"><div><h2>Мой день · ${STAFF[me]}</h2><p>Свои рейсы, задачи и заработок за месяц — без денег компании.</p></div></div>
 <div class="wid"><div><small>Мои рейсы в работе</small><b>${L.length}</b><span>${L.filter(d=>d.st==='road').length} в пути</span></div><div><small>Фур в октябре</small><b>11</b><span>за 5 дней</span></div><div><small>Принёс комиссии</small><b class="a">${fmt(640000)}</b><span>план ${mln(k?k.plan:2100000)}</span></div><div><small>Мой заработок</small><b class="g">${fmt(171400)}</b><span>30 % от чистой комиссии</span></div><div><small>Задачи</small><b>${T.length}</b><span>открыто</span></div></div>
 <div class="pan"><h3>Мои рейсы</h3>${L.map(d=>`<div class="pr clk" onclick="openDeal('${d.id}')"><div><b>${d.id} · ${route(d)}</b><span>${esc(CL(d.cl).n)} · ${esc(DR(d.dr).n)} · ${dd(d.load)} → ${dd(d.unl)}</span></div>${stg(d.st)}</div>`).join('')}</div>
 <div class="pan"><h3>Мои задачи</h3>${T.map(t=>`<div class="tk"><i></i><div><b>${esc(t.t)}</b><span>срок ${tdue(t)}</span></div><button class="bt sm" onclick="card('done','${t.id}')">Отработал</button></div>`).join('')||'<p class="mini">Всё отработано.</p>'}</div>`};

/* ===== Базы ===== */
let clF='all';
SC.clients=()=>{const L=CLIENTS.filter(c=>clF==='all'||c.f===clF);
 return `<div class="hd"><div><h2>Клиенты</h2><p>Карточка клиента с примечанием — чтобы любой логист понимал, на что готовиться: кто платит с задержкой, кто только по предоплате, кто ждёт геолокацию два раза в день.</p></div><div class="btns"><span class="seg"><a class="${clF==='all'?'on':''}" onclick="clF='all';render()">Все</a><a class="${clF==='warn'?'on':''}" onclick="clF='warn';render()">С пометкой</a><a class="${clF==='bad'?'on':''}" onclick="clF='bad';render()">Красные</a></span></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Город</th><th>Куратор</th><th>Оплата</th><th>Примечание</th><th class="r">Рейсов</th><th class="r">Долг</th></tr></thead><tbody>
 ${L.map(c=>{const ds=DEALS.filter(d=>d.cl===c.id);const debt=ds.filter(d=>!d.paidC&&afterUnl(d)).reduce((a,d)=>a+d.c,0);return `<tr class="clk" onclick="card('cl','${c.id}')"><td><b>${esc(c.n)}</b> ${fl(c.f)}</td><td>${esc(c.city)}</td><td>${STAFF[c.cur]}</td><td>${c.term?c.term+' дн.':'предоплата'}</td><td class="mini nt">${esc(c.note)}</td><td class="r mono">${ds.length}</td><td class="r mono ${debt?'neg':''}">${debt?fmt(debt):'—'}</td></tr>`}).join('')}</tbody></table></div>
 ${said('«Чтоб клиентов все данные были, какие-то примечания… неплатёжеспособен или клиент нервный — мы так и пишем прям, чтоб понимать, на что готовиться».')}`};
let drQ='';
SC.drivers=()=>{const L=DRIVERS.filter(d=>!drQ||(d.n+d.ip+d.plate+d.routes).toLowerCase().includes(drQ.toLowerCase()));
 return `<div class="hd"><div><h2>Перевозчики · 1 512</h2><p>Вся база из Битрикса: контакты, ИП и реквизиты, машины, маршруты, сколько рейсов с вами и пометки. Логист ищет машину по направлению — и сразу видит, кому можно доверять.</p></div><div class="btns"><div class="srch in"><i>⌕</i><input placeholder="имя, госномер, направление" value="${esc(drQ)}" onkeydown="if(event.key==='Enter'){drQ=this.value;render()}"></div><button class="bt p" onclick="card('newdr')">+ Перевозчик</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Перевозчик</th><th>ИП / компания</th><th>Машина</th><th>Направления</th><th class="r">Рейсов</th><th>Пометка</th></tr></thead><tbody>
 ${L.map(d=>`<tr class="clk" onclick="card('dr','${d.id}')"><td><b>${esc(d.n)}</b> ${fl(d.f)}<div class="sub mono">${d.ph}</div></td><td>${esc(d.ip)}</td><td>${esc(d.truck)}<div class="sub mono">${esc(d.plate)}</div></td><td>${esc(d.routes)}</td><td class="r mono">${d.trips}</td><td class="mini nt">${d.note==='—'?'':esc(d.note)}</td></tr>`).join('')}
 <tr class="total"><td colspan="6">… ещё 1 500 перевозчиков из Битрикса — поиск по имени, номеру, направлению</td></tr></tbody></table></div>`};

SC.move=()=>`<div class="hd"><div><h2>Переезд с Битрикса</h2><p>Выгружаем из Битрикса всё, что нужно — перевозчиков, клиентов, историю сделок — и загружаем сюда. Дубли склеиваем, телефоны приводим к одному виду. Один-два дня, работа не останавливается.</p></div></div>
 <div class="mvs">${[['1','Выгрузка из Битрикса','контакты, компании, сделки — в Excel','ok'],['2','Сопоставление полей','«Госномер», «ИП», «Направления», пометки','ok'],['3','Проверка дублей','один водитель — одна карточка','on'],['4','Загрузка и сверка','вы смотрите, что всё на месте',''],['5','Битрикс отключаем','после недели параллельной работы','']].map(s=>`<div class="mv ${s[3]}"><i>${s[3]==='ok'?'✓':s[0]}</i><b>${s[1]}</b><span>${s[2]}</span></div>`).join('')}</div>
 <div class="wid"><div><small>Перевозчиков</small><b>1 512</b><span>38 дублей склеено</span></div><div><small>Клиентов</small><b>214</b><span>с реквизитами</span></div><div><small>Сделок за год</small><b>1 890</b><span>история и суммы</span></div><div><small>Битрикс + интегратор</small><b class="r">176 000</b><span>₸ в месяц сейчас</span></div><div><small>Экономия в год</small><b class="g">2,1 млн</b><span>после переезда</span></div></div>
 <div class="pan"><h3>Поля перевозчика: Битрикс → здесь</h3><div class="tw"><table class="t"><thead><tr><th>В Битриксе</th><th>Здесь</th><th>Пример</th></tr></thead><tbody>${[['Имя, Фамилия','Перевозчик','Серик Ахметов'],['Компания','ИП / компания','ИП «Ахметов С.»'],['Телефон рабочий','Телефон','+7 701 *** 41 18'],['UF_GOSNOMER','Госномер','512 ARA 01'],['UF_TRUCK','Машина и кузов','Volvo FH · тент 20 т'],['Комментарий','Пометка','«Надёжный, документы сдаёт сразу»']].map(r=>`<tr><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('«Я хочу от Битрикса уйти: у меня около полутора тысяч перевозчиков — все их контакты туда перекинуть и все данные фирмы» · «Восемьдесят восемь тысяч Битриксу и ещё восемьдесят восемь — посредникам, а они через раз отвечают».')}`;

/* ===== Система ===== */
SC.roles=()=>{const areas=[['Деньги на счёте, «моё / не моё», фонды',['AM']],['Календарь платежей',['AM','GM']],['Кто должен, акты сверки',['AM','AS','GM']],['Аналитика компании',['AM']],['Доска перевозок, карточки',['AM','DN','AS','ZH','GM']],['Галочка «согласовано»',['AM','ZH']],['Оплата водителю',['AM','GM']],['Документы по рейсам',['AM','AS','ZH','GM']],['Свой заработок и план',['AM','DN','AS']],['Базы клиентов и перевозчиков',['AM','DN','AS','ZH']]];const R=Object.entries(ROLES);
 return `<div class="hd"><div><h2>Роли и права</h2><p>Логисты не видят оборот денег и фонды — только свои рейсы и свой заработок. Бухгалтер на аутсорсе видит, кому платить и какие документы нужны. Права меняет руководитель.</p></div></div>
 <div class="tw"><table class="t mx"><thead><tr><th>Что видно</th>${R.map(([k,v])=>`<th class="c">${esc(v.av)}<span>${esc(k)}</span></th>`).join('')}</tr></thead><tbody>
 ${areas.map(a=>`<tr><td>${a[0]}</td>${R.map(([k,v])=>`<td class="c">${a[1].includes(v.p)?'<b class="pos">●</b>':'<span class="mini">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
 <div class="g2">${R.map(([k,v])=>`<div class="pan"><h3>${esc(k)} · ${esc(v.n)}</h3><p class="mini">${esc(v.note)}</p><span class="mini">${v.s.length} ${plural(v.s.length,['экран','экрана','экранов'])}</span></div>`).join('')}</div>
 ${said('«Максимально всё в одном поместить, но доступ на определённые функции — чтобы логисты не видели мой оборот денег».')}`};
SC.mobile=()=>`<div class="hd"><div><h2>С телефона</h2><p>Ссылка сохраняется на экран телефона как приложение — из магазина ничего ставить не нужно. Пуш-уведомления приходят, даже когда приложение закрыто.</p></div></div>
 <div class="phones">
  <div class="phone"><div class="pht"><b>Амирбек</b><small>${dd(TODAY)} · ${NOW}</small></div><div class="pb"><div class="pi"><span>На счетах</span><b>${mln(BANK.open)}</b></div><div class="pi"><span>Не моё</span><b class="neg">${mln(notMine())}</b></div><div class="pi"><span>Моё свободно</span><b class="pos">${mln(freeMine())}</b></div><div class="pi"><span>Горит</span><b class="neg">${redFlags().length}</b></div><div class="pbtn" onclick="go('today')">Открыть пульт</div></div></div>
  <div class="phone"><div class="pht"><b>Данияр · логист</b><small>мои рейсы</small></div><div class="pb">${DEALS.filter(d=>d.lg==='DN'&&d.st!=='done').slice(0,4).map(d=>`<div class="pi"><span>${d.id} ${esc(d.from)} → ${esc(d.to)}<small>${STN(d.st).n}</small></span><b>${dd(d.unl)}</b></div>`).join('')}<div class="pbtn" onclick="act('photo')">Фото договора водителя</div></div></div>
  <div class="phone"><div class="pht"><b>Пуш-уведомление</b><small>экран блокировки</small></div><div class="pb"><div class="push"><b>ТРАССА · сейчас</b><span>Литвинов на выгрузке R-1013, ждёт оплату. Документов нет.</span></div><div class="push"><b>ТРАССА · 09:00</b><span>Сегодня водителям ${mln(DEALS.filter(d=>drvPayDay(d)===TODAY).reduce((a,d)=>a+d.d,0))} ₸.</span></div><div class="push"><b>ТРАССА · 08:00</b><span>План недели и переводы по фондам готовы.</span></div></div></div>
 </div>`;
SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Стандартный пакет разработки — 2 000 000 ₸ один раз, без абонентской платы. Ядро — за 2–3 недели, вся система — за 4–6 недель. В пакете заложено около 20 % на доработки, которые появятся, когда начнёте пользоваться.</p></div></div>
 <div class="pay3"><div><small>Старт · 10 %</small><b>200 000 ₸</b><span>собираем вашу первичку: таблицу, Битрикс, документы</span></div><div><small>Ядро · 45 %</small><b>900 000 ₸</b><span>после того, как вы приняли ядро — примерно через месяц</span></div><div><small>Шлифовка и сдача · 45 %</small><b>900 000 ₸</b><span>после приёмки всей системы</span></div></div>
 <div class="g2"><div class="pan"><h3>Ядро — первые 2–3 недели</h3>${['Перевозки вместо Битрикса: статусы, карточка, договоры-заявки, галочка офис-менеджера','Переезд базы: 1 500 перевозчиков, клиенты с пометками','«Мои и не мои деньги» и календарь платежей','Фонды по вашим процентам','Документы по рейсу: с НДС и без'].map(x=>`<div class="li"><i>✓</i><span>${x}</span></div>`).join('')}</div>
 <div class="pan"><h3>Шлифовка — до сдачи</h3>${['Аналитика из вашей таблицы, план компании','Задачи со сроками и блок дашборда','Громкие уведомления и пуш на телефон','KPI логистов, кабинет бухгалтера','Ваши доработки по ходу — в пределах пакета'].map(x=>`<div class="li n"><i>→</i><span>${x}</span></div>`).join('')}</div></div>
 <div class="g2"><div class="pan"><h3>Не делаем — как договорились</h3><div class="li no"><i>—</i><span>Интеграция с 1С — бухгалтер закрывает у себя</span></div><div class="li no"><i>—</i><span>Чат с клиентами и чат-бот — клиенты звонят</span></div><div class="li no"><i>—</i><span>Электронная подпись водителям — фото бумажного договора</span></div></div>
 <div class="pan"><h3>После сдачи</h3><p class="mini">3 месяца сопровождения входят в стоимость. Дальше — доработки по часам, около 20 $ в час. Код и данные — ваши. Битрикс и интегратор (176 000 ₸ в месяц) больше не нужны — за год это 2,1 млн ₸.</p></div></div>
 ${said('«Мне важно понимать, сколько это будет по деньгам, по времени — чтобы не получилось, что сейчас бум-бум, а в конце: и дорого».','Платон: стандартный пакет, 4–6 недель, в районе двух миллионов; 10 % в начале, остальное — по факту: после ядра и после шлифовки.')}`;

/* ===== Карточки ===== */
const CARD={};
CARD.day=day=>{const P=projection()[day];const lbl={in:'Придёт от клиента',out:'Водителю',fix:'Обязательный платёж',paid:'Оплачено',late:'Просрочено клиентом'};
 return [`${dd(day)} · ${dayOf(day)}`,P.bal!==null?`Остаток на конец дня: ${tg(P.bal)}`:'Прошедший день',P.E.length?`<div class="tw"><table class="t"><tbody>${P.E.map(e=>`<tr class="${e.deal?'clk':''}" ${e.deal?`onclick="closeM();openDeal('${e.deal}')"`:''}><td><span class="tag ${e.k==='in'?'g':e.k==='late'?'r':e.k==='paid'?'':'w'}">${lbl[e.k]}</span></td><td>${esc(e.n)}${e.ok?`<div class="sub">${e.ok}</div>`:''}${e.bx?'<div class="sub">уйдёт после переезда</div>':''}</td><td class="r mono">${e.k==='in'||e.k==='late'?'+':'−'} ${fmt(e.s)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="mini">В этот день платежей нет.</p>']};
CARD.fixnew=()=>['Новый платёж в календарь','Обязательный или личный',`<div class="form"><label>Что<input id="fx_n" value="Лизинг тягача"></label><label>Дата<input id="fx_d" type="date" value="2026-10-15" min="2026-10-01" max="2026-10-31"></label><label>Сумма, ₸<input id="fx_s" value="450000"></label><label>Из какого фонда<select id="fx_f"><option value="fix">Обязательные</option><option value="staff">Сотрудники</option><option value="tax">Налоги</option><option value="own">Моя прибыль</option></select></label></div><button class="bt p" onclick="const v=i=>document.getElementById(i).value;FIXED.push({d:v('fx_d'),n:v('fx_n'),s:+v('fx_s')||0,f:v('fx_f')});closeM();render();toast('Платёж добавлен — календарь пересчитан.')">Добавить</button>`];
CARD.cl=id=>{const c=CL(id);const ds=DEALS.filter(d=>d.cl===id);return [esc(c.n),`${esc(c.city)} · куратор ${STAFF[c.cur]} · ${c.term?'оплата через '+c.term+' дн.':'предоплата'}`,`<div class="pin ${c.f}" style="margin-top:0">${esc(c.note)}</div><div class="kv"><span>Телефон</span><b class="mono">${c.ph}</b></div><h4 class="mh4">Рейсы</h4>${ds.map(d=>`<div class="kv clk" onclick="closeM();openDeal('${d.id}')"><span>${d.id} · ${route(d)} · ${dd(d.load)}</span><b>${STN(d.st).n} · ${d.paidC?'оплачено':'<span class="neg">не оплачено</span>'}</b></div>`).join('')}<div class="btns l" style="margin-top:12px"><button class="bt" onclick="closeM();card('sverka','${id}')">Акт сверки</button><button class="bt" onclick="act('remind','${id}')">Напомнить об оплате</button></div>`]};
CARD.sverka=id=>{const c=CL(id);const ds=DEALS.filter(d=>d.cl===id&&afterUnl(d));let bal=0;return ['Акт сверки',`${esc(c.n)} · сентябрь – октябрь 2026`,`<div class="doc"><div class="dh"><div class="dlg">ТРАССА<small>ТРАНСПОРТНАЯ ЭКСПЕДИЦИЯ</small></div><div style="text-align:right;font-size:10px">${dl(TODAY)}</div></div><h4>Акт сверки взаимных расчётов</h4><div class="drow h"><span>Дата</span><span>Документ</span><span class="r">Начислено</span><span class="r">Оплачено</span></div>${ds.map(d=>{bal+=d.c-(d.paidC?d.c:0);return `<div class="drow"><span>${dd(d.unl)}</span><span>АВР · ${d.id} ${esc(d.from)} → ${esc(d.to)}</span><span class="r">${fmt(d.c)}</span><span class="r">${d.paidC?fmt(d.c):'—'}</span></div>`}).join('')}<div class="dsum"><span>Задолженность в пользу ТРАССА</span><span>${tg(bal)}</span></div></div><div class="btns l" style="margin-top:12px"><button class="bt p" onclick="closeM();toast('Акт сверки отправлен клиенту — PDF в WhatsApp куратора.')">Отправить клиенту</button></div>`]};
CARD.dr=id=>{const r=DR(id);const ds=DEALS.filter(d=>d.dr===id);return [esc(r.n),`${esc(r.ip)} · ${esc(r.truck)} · ${esc(r.plate)}`,`${r.note!=='—'?`<div class="pin ${r.f}" style="margin-top:0">${esc(r.note)}</div>`:''}${[['Телефон',r.ph],['Направления',esc(r.routes)],['Рейсов с вами',r.trips],['Реквизиты','ИИН / БИН, банк, счёт — из Битрикса']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}<h4 class="mh4">Рейсы</h4>${ds.map(d=>`<div class="kv clk" onclick="closeM();openDeal('${d.id}')"><span>${d.id} · ${route(d)}</span><b>${STN(d.st).n} · ${d.paidD?'оплачено':'не оплачено'}</b></div>`).join('')||'<p class="mini">Сейчас рейсов нет.</p>'}`]};
CARD.newdr=()=>['Новый перевозчик','Попадёт в базу, логисты найдут по направлению',`<div class="form"><label>Имя<input id="nd_n" value="Ерболат Сейткали"></label><label>ИП<input id="nd_ip" value="ИП «Сейткали Е.»"></label><label>Машина<input id="nd_t" value="Volvo FH · тент 20 т"></label><label>Госномер<input id="nd_p" value="771 ESK 01"></label><label>Направления<input id="nd_r" value="Россия ↔ Казахстан"></label><label>Пометка<select id="nd_f"><option value="ok">без пометки</option><option value="warn">с пометкой</option><option value="bad">красная</option></select></label></div><button class="bt p" onclick="const v=i=>document.getElementById(i).value;DRIVERS.unshift({id:'D'+(DRIVERS.length+1),n:v('nd_n'),ip:v('nd_ip'),ph:'+7 7** *** ** **',truck:v('nd_t'),plate:v('nd_p'),routes:v('nd_r'),trips:0,f:v('nd_f'),note:'—'});closeM();render();toast('Перевозчик добавлен.')">Добавить</button>`];
CARD.inv=id=>{const d=DL(id);const c=CL(d.cl);const V=d.nds?Math.round(d.c*12/112):0;return ['Счёт на оплату',`${d.id} · ${esc(c.n)} · ${d.nds?'с НДС':'без НДС'}`,`<div class="doc"><div class="dh"><div class="dlg">ТРАССА<small>ТРАНСПОРТНАЯ ЭКСПЕДИЦИЯ</small></div><div style="text-align:right;font-size:10px">Счёт № ${700+DEALS.indexOf(d)}<br>${dl(TODAY)}</div></div><h4>Счёт на оплату</h4><p style="font-size:11px">Покупатель: ${esc(c.n)}</p><div class="drow h"><span>№</span><span>Услуга</span><span class="r">Кол-во</span><span class="r">Сумма, ₸</span></div><div class="drow"><span>1</span><span>Транспортно-экспедиционные услуги: ${esc(d.from)} → ${esc(d.to)}, ${esc(DR(d.dr).truck)}, ${esc(DR(d.dr).plate)}</span><span class="r">1</span><span class="r">${fmt(d.c)}</span></div><div class="dsum"><span>Итого${d.nds?', в т. ч. НДС 12 %':''}</span><span>${tg(d.c)}${d.nds?' · НДС '+fmt(V):''}</span></div><div class="dfoot"><span>${c.term?'Оплата в течение '+c.term+' дней после выгрузки.':'Предоплата 100 %.'}</span></div></div><div class="btns l" style="margin-top:12px"><button class="bt p" onclick="closeM();DL('${id}').docs[0]=1;render();toast('Счёт отправлен клиенту, отметка в документах рейса.')">Отправить клиенту</button><button class="bt" onclick="setNds('${id}',${d.nds?0:1});card('inv','${id}')">${d.nds?'Без НДС':'С НДС'}</button></div>`]};
CARD.newdeal=()=>['Новая перевозка','Заявка клиента → поиск машины',`<div class="form"><label>Клиент<select id="nw_c">${CLIENTS.map(c=>`<option value="${c.id}">${esc(c.n)}${c.f==='bad'?' — только предоплата':''}</option>`).join('')}</select></label><label>Откуда<input id="nw_f" value="Астана"></label><label>Куда<input id="nw_t" value="Караганда"></label><label>Погрузка<input id="nw_d" type="date" value="2026-10-07"></label><label>Ставка клиента, ₸<input id="nw_cr" value="200000"></label><label>Ставка водителю, ₸<input id="nw_dr" value="165000"></label><label>Водитель<select id="nw_dv">${DRIVERS.map(d=>`<option value="${d.id}">${esc(d.n)}${d.f==='bad'?' — красная пометка':''}</option>`).join('')}</select></label><label>НДС<select id="nw_n"><option value="1">с НДС</option><option value="0">без НДС</option></select></label></div><button class="bt p" onclick="newDeal()">Создать</button>`];
function newDeal(){const v=i=>document.getElementById(i).value;const id='R-'+(1025+DEALS.length-24);const c=v('nw_c');DEALS.unshift({id,cl:c,dr:v('nw_dv'),from:v('nw_f'),to:v('nw_t'),intl:false,c:+v('nw_cr')||0,d:+v('nw_dr')||0,nds:v('nw_n')==='1',lg:role==='Логист'?'DN':'TM',cur:CL(c).cur,st:'new',load:v('nw_d'),unl:addDays(v('nw_d'),1),paidC:null,paidD:false,cc:false,cd:false,ok:false,docs:[0,0,0,0,0,0],log:[]});closeM();curDeal=id;go('deal');toast(`${id} создана. Офис-менеджер видит её в «Проверке договоров».`+(CL(c).f==='bad'?' Клиент с красной пометкой — руководителю ушло уведомление.':''))}
CARD.task=()=>['Новая задача','Со сроком — не отработал вовремя, дашборд закроется',`<div class="form"><label>Кому<select id="tk_w">${['DN','TM','MD','BK','AS','KR','ZH','GM'].map(k=>`<option value="${k}">${STAFF[k]}</option>`).join('')}</select></label><label>Что сделать<input id="tk_t" value="Перезвонить «Темір Снаб» по оплате R-1010"></label><label>Срок<input id="tk_d" value="2026-10-05 16:00"></label></div><button class="bt p" onclick="const v=i=>document.getElementById(i).value;TASKS.unshift({id:'T'+(TASKS.length+1),who:v('tk_w'),t:v('tk_t'),due:v('tk_d'),ok:0,by:'AM'});closeM();render();toast('Задача поставлена — сотруднику пришёл пуш.')">Поставить</button>`];
CARD.done=id=>{const t=TASKS.find(x=>x.id===id);return ['Отработал задачу',esc(t.t),`<div class="form"><label>Что сделано — коротко<input id="dn_r" placeholder="Позвонил, груз в Омске, геолокацию скинул"></label></div><button class="bt p" onclick="doneTask('${id}')">Закрыть задачу</button>`]};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(k,x){const M={report:'Каждый вечер в 19:00 в WhatsApp: на счёте, моё свободно, кому платили, кто должен, что горит.',remind:'Напоминание об оплате ушло клиенту, куратору — задача перезвонить завтра в 10:00.',remindall:'Напоминания ушли всем просроченным; кураторам — задачи по каждому.',xls:'Выгрузка в Excel — в том же виде, что ваша таблица.',esfall:'ЭСФ по всем рейсам с полными документами — пачкой в ИС ЭСФ.',askdocs:'Водителю позвонить: логисту поставлена задача «запросить документы» до 18:00.',photo:'Камера телефона: фото подписанного договора сразу в карточку рейса.'};toast(M[k]||'Готово.')}
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();const d=DEALS.find(x=>(x.id+' '+x.from+' '+x.to).toLowerCase().includes(q));if(d&&allowed('deal')){openDeal(d.id);return}
 const c=CLIENTS.find(x=>x.n.toLowerCase().includes(q));if(c){card('cl',c.id);return}const r=DRIVERS.find(x=>(x.n+x.plate).toLowerCase().includes(q));if(r){card('dr',r.id);return}toast('Не найдено: попробуйте «R-1013», «Москва», «Евразия», «Ким».')}

/* ===== Каркас ===== */
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}.`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
function buildRail(){const on=SECOF[cur];document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="ri ${s.k===on?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><i><svg viewBox="0 0 24 24">${s.ic}</svg></i><span>${s.n}</span>${s.k==='team'&&TASKS.some(overdue)?'<b class="cnt">!</b>':''}</a>`).join('')}
function buildSub(){const s=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')+(s.k==='own'?`<div class="shint">Логисты и кураторы этого раздела не видят.</div>`:'')}
function buildMbar(){const el=document.getElementById('mbar');if(!el)return;if(!allowed('money')){el.innerHTML='';el.style.display='none';return}el.style.display='';el.innerHTML=`<span class="lb">НА СЧЕТАХ</span><b>${tg(BANK.open)}</b><span class="sp"></span><span>водителям <b class="g1">${mln(heldDrv())}</b></span><span>фонды и НДС <b class="g2">${mln(fundsSum()+heldCom())}</b></span><span class="mine">моё свободно <b>${mln(freeMine())}</b></span>`}
function buildBell(){const b=document.getElementById('bell');if(!b)return;const n=ALERTS.filter(a=>a.lv==='bad').length;b.innerHTML=`<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z M10 20a2 2 0 0 0 4 0"/></svg><b>${n}</b>`;b.classList.toggle('hot',n>0&&ASET.blink)}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.today;document.body.dataset.sec=SECOF[cur];document.getElementById('ttl').textContent=SUBN[cur]||'Трасса';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();buildRail();buildMbar();buildBell();
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('board')&&role!=='Бухгалтер'?'':'none';try{history.replaceState(null,'','?s='+cur+(cur==='deal'?'&d='+curDeal:''))}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function beep(){if(!ASET.snd)return;try{const A=new(window.AudioContext||window.webkitAudioContext)();[0,.22].forEach(s=>{const o=A.createOscillator(),g=A.createGain();o.frequency.value=880;o.connect(g);g.connect(A.destination);g.gain.setValueAtTime(.15,A.currentTime+s);g.gain.exponentialRampToValueAtTime(.001,A.currentTime+s+.18);o.start(A.currentTime+s);o.stop(A.currentTime+s+.2)})}catch(e){}}
function flash(){document.body.classList.remove('flash');void document.body.offsetWidth;document.body.classList.add('flash')}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}

const TOUR=[
 ['today','1 · Пульт: сколько на счетах и сколько из этого ваше. Кому платить сегодня, что горит, ближайшие дни.'],
 ['money','2 · Мои и не мои деньги: деньги водителей по оплаченным рейсам, комиссия, НДС, фонды — и только потом ваше свободное.'],
 ['calendar','3 · Календарь платежей: что придёт, что уйдёт, остаток на каждый день. Красный день видно заранее.'],
 ['funds','4 · Фонды по вашим процентам и план недели: сколько и куда перевести в понедельник.'],
 ['debts','5 · Кто должен: по каждому долгу — сколько водителям, сколько ваша комиссия, просрочка, куратор.'],
 ['board','6 · Перевозки вместо Битрикса: те же статусы, карточка не двигается без договоров и документов.'],
 ['deal','7 · Карточка: клиент и водитель с пометками, ставки, с НДС или без, договоры, шесть документов.'],
 ['check','8 · Офис-менеджер: очередь договоров, галочка «согласовано» прямо в строке.'],
 ['docs','9 · Документы по рейсам: что выставить клиенту и что запросить у водителя.'],
 ['tasks','10 · Задачи со сроками: просрочил — красный флаг и закрытый дашборд.'],
 ['my','11 · Так видит логист: пока не отработал задачу — свой заработок не открывается.'],
 ['alerts','12 · Уведомления, которые мигают и пищат, — и пуш на телефон.'],
 ['kpi','13 · KPI логистов: сколько принёс компании и сколько заработал сам.'],
 ['analytics','14 · Аналитика из вашей таблицы: месяцы, клиенты, логисты, международные и внутренние.'],
 ['move','15 · Переезд с Битрикса: 1 500 перевозчиков и клиенты за один-два дня.'],
 ['launch','16 · Стоимость: 2 млн один раз, 10 / 45 / 45, ядро за 2–3 недели.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается: карточки, галочки, документы, задачи, фонды.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;if(k==='deal')curDeal='R-1017';build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='',d='';try{const u=new URLSearchParams(location.search);q=u.get('s')||'';d=u.get('d')||''}catch(e){}if(d&&DL(d))curDeal=d;
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
