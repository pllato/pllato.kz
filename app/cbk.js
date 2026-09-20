/* ЦБК — платформа управления Центром банкротства Казахстана. Демо-макет по списку из 11 пунктов к созвону. Данные вымышленные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const num=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const tg=n=>fmt(n)+' ₸';
const mln=n=>(Math.round(n/100000)/10).toString().replace('.',',')+' млн';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};

const SEC=[
 {k:'dash', ic:'▦', n:'Пульт',     sub:[['dash','Сводка по филиалам'],['today','Что требует решения']]},
 {k:'cl',   ic:'☺', n:'Клиенты',   sub:[['clients','Клиенты · поиск и сегменты'],['client','Единая карточка клиента'],['fields','Кастомные поля и сущности'],['changes','История изменений']]},
 {k:'sale', ic:'◎', n:'Продажи',   sub:[['funnel','Воронка · этапы'],['leads','Лиды и распределение'],['tasks','Задачи и напоминания'],['conv','Контроль конверсий']]},
 {k:'wa',   ic:'✆', n:'WhatsApp',  sub:[['wa','Диалоги из CRM'],['templates','Шаблоны сообщений'],['broadcast','Рассылки · массовые и авто']]},
 {k:'ai',   ic:'✦', n:'ИИ',        sub:[['aibot','ИИ-бот в WhatsApp'],['aiqual','Квалификация и автозаполнение'],['aihelper','Помощник сотрудника'],['aimanage','Управление через ИИ'],['aiown','Свой ИИ · подключение']]},
 {k:'fin',  ic:'₸', n:'Финансы',   sub:[['contracts','Договоры'],['invoices','Счета и платежи'],['schedule','Графики платежей'],['debts','Просрочки и дебиторка']]},
 {k:'pr',   ic:'§', n:'Процедуры', sub:[['procs','Процедуры банкротства'],['proc','Карточка процедуры'],['deadlines','Сроки и контрольные точки'],['docs','Документы']]},
 {k:'org',  ic:'▤', n:'Филиалы',   sub:[['branches','Алматы · Астана · Актобе'],['roles','Роли и права'],['staff','Сотрудники и эффективность']]},
 {k:'an',   ic:'▥', n:'Аналитика', sub:[['sources','Лиды · источники · CPL'],['revenue','Договоры · выручка · оплаты'],['dashboards','Собственные дашборды']]},
 {k:'pl',   ic:'⚙', n:'Платформа', sub:[['api','REST API и вебхуки'],['security','Безопасность и сервер'],['stack','Архитектура · стек · сроки · стоимость']]}
];
const SECOF={},SUBN={};
SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));

const ROLES={
 'Руководитель ЦБК':{av:'РК',n:'руководитель',r:'все филиалы',note:'Всё по трём филиалам: воронка, деньги, процедуры, люди, аналитика, ИИ, платформа. Плюс ответы на вопросы встречи в разделе «Платформа»',s:ALL},
 'РОП · Алматы':{av:'РА',n:'Айдар',r:'руководитель отдела продаж',note:'Воронка и лиды своего филиала, распределение между операторами и менеджерами, конверсии, задачи, WhatsApp, эффективность своих людей',
  s:['dash','today','clients','client','changes','funnel','leads','tasks','conv','wa','templates','broadcast','aiqual','aihelper','contracts','staff','sources','revenue','dashboards']},
 'Оператор':{av:'ОП',n:'Мадина',r:'колл-центр · Алматы',note:'Свои лиды: звонок, WhatsApp, квалификация, запись на встречу. Чужих лидов и денег не видит',
  s:['leads','client','tasks','wa','templates','aiqual','aihelper']},
 'Менеджер · Астана':{av:'МН',n:'Даулет',r:'менеджер по продажам',note:'Свои сделки: встречи, договор, оплата, передача юристу. Карточка клиента, задачи, WhatsApp',
  s:['today','clients','client','funnel','tasks','wa','templates','aihelper','contracts','invoices','schedule']},
 'Юрист':{av:'ЮР',n:'Сабина',r:'сопровождение процедур',note:'Процедуры, этапы, документы, сроки и контрольные точки, история действий. Карточка клиента без денег продаж',
  s:['today','client','tasks','wa','aihelper','procs','proc','deadlines','docs']},
 'Финансист':{av:'ФН',n:'Гульмира',r:'финансы · все филиалы',note:'Договоры, счета, платежи, графики, просрочки, дебиторка по филиалам, выручка. Связь платежа с клиентом и договором',
  s:['dash','client','contracts','invoices','schedule','debts','revenue','dashboards']},
 'Администратор платформы':{av:'АД',n:'Тимур',r:'IT · развитие платформы',note:'Поля и сущности, роли, филиалы, API и вебхуки, интеграции, безопасность, журнал, подключение своего ИИ, стек',
  s:['fields','changes','roles','branches','staff','api','security','stack','aiown','templates','broadcast']},
 'ИИ-агент':{av:'ИИ',n:'«Ару»',r:'роль с правами и журналом',note:'Отвечает лидам в WhatsApp, квалифицирует, заполняет карточку, отвечает сотрудникам по данным, готовит отчёты руководителю. Деньги и договоры не трогает',
  s:['aibot','aiqual','aihelper','aimanage','wa','leads']}
};
let role='Руководитель ЦБК',cur='dash',theme='light';

/* ====== СПРАВОЧНИКИ ====== */
const BR=['Алматы','Астана','Актобе'];
const ST=[['new','Новый лид','#6b7f8c'],['nocall','Недозвон','#cf8a22'],['qual','Квалифицирован','#2f6f9e'],['meet','Встреча назначена','#6b4ea8'],['met','Встреча проведена','#345c7d'],['contract','Договор','#1f7a5a'],['paid','Оплата','#0e7c69'],['proc','В процедуре','#20242b'],['done','Завершено','#3a8f3a'],['lost','Отказ','#c44536']];
const STN=k=>(ST.find(s=>s[0]===k)||ST[0])[1];const STC=k=>(ST.find(s=>s[0]===k)||ST[0])[2];
const KIND={out:'Внесудебное',court:'Судебное',rest:'Восстановление платёжеспособности'};
const SRC=['Instagram','TikTok','Google Ads','Сайт','2ГИС','Рекомендация','Яндекс'];

/* ====== КЛИЕНТЫ ====== */
const CL=[
 {id:'К-10412',n:'Айгерим Нурланова',ph:'+7 701 4•• •• 12',br:'Алматы',src:'Instagram',st:'proc',kind:'out',debt:4200000,cred:3,mgr:'Асель К.',op:'Мадина',law:'Сабина',created:'12.08',last:'сегодня 10:14',sum:280000,paid:210000,tags:['ипотеки нет','3 кредита','самозанятая']},
 {id:'К-10488',n:'Бауыржан Сейтказы',ph:'+7 777 2•• •• 88',br:'Астана',src:'TikTok',st:'contract',kind:'court',debt:9800000,cred:5,mgr:'Даулет',op:'Нурай',law:'Ерасыл',created:'02.09',last:'вчера 17:40',sum:600000,paid:150000,tags:['авто в залоге','5 кредитов']},
 {id:'К-10501',n:'Гульнара Абдрахманова',ph:'+7 705 6•• •• 01',br:'Алматы',src:'Google Ads',st:'meet',kind:'out',debt:2900000,cred:2,mgr:'Асель К.',op:'Мадина',law:'—',created:'15.09',last:'сегодня 09:02',sum:0,paid:0,tags:['пенсионерка']},
 {id:'К-10519',n:'Ерлан Мусин',ph:'+7 747 3•• •• 19',br:'Актобе',src:'Сайт',st:'qual',kind:'court',debt:14500000,cred:4,mgr:'Ботагоз',op:'Алина',law:'—',created:'17.09',last:'сегодня 11:30',sum:0,paid:0,tags:['ИП закрыт','долг по налогам']},
 {id:'К-10523',n:'Динара Оспанова',ph:'+7 708 9•• •• 23',br:'Астана',src:'Instagram',st:'paid',kind:'out',debt:3600000,cred:3,mgr:'Даулет',op:'Нурай',law:'Ерасыл',created:'28.08',last:'вчера 12:10',sum:280000,paid:280000,tags:['декрет']},
 {id:'К-10530',n:'Марат Жаксылыков',ph:'+7 771 5•• •• 30',br:'Алматы',src:'2ГИС',st:'nocall',kind:'out',debt:1900000,cred:2,mgr:'—',op:'Мадина',law:'—',created:'19.09',last:'вчера 16:05',sum:0,paid:0,tags:[]},
 {id:'К-10534',n:'Салтанат Бекова',ph:'+7 702 7•• •• 34',br:'Актобе',src:'Рекомендация',st:'met',kind:'rest',debt:7400000,cred:3,mgr:'Ботагоз',op:'Алина',law:'—',created:'11.09',last:'сегодня 08:45',sum:0,paid:0,tags:['ипотека','зарплата 420 000']},
 {id:'К-10541',n:'Руслан Ахметов',ph:'+7 776 1•• •• 41',br:'Алматы',src:'TikTok',st:'new',kind:'out',debt:0,cred:0,mgr:'—',op:'—',law:'—',created:'сегодня 11:52',last:'сегодня 11:52',sum:0,paid:0,tags:[]},
 {id:'К-10395',n:'Жанна Ким',ph:'+7 700 8•• •• 95',br:'Астана',src:'Google Ads',st:'proc',kind:'court',debt:11200000,cred:6,mgr:'Даулет',op:'Нурай',law:'Ерасыл',created:'30.07',last:'18.09',sum:600000,paid:300000,tags:['просрочка платежа']},
 {id:'К-10210',n:'Асхат Дюсенов',ph:'+7 707 2•• •• 10',br:'Актобе',src:'Instagram',st:'done',kind:'out',debt:2400000,cred:2,mgr:'Ботагоз',op:'Алина',law:'Мейрам',created:'14.02',last:'05.09',sum:250000,paid:250000,tags:['завершено · освобождён']},
 {id:'К-10538',n:'Алия Токтарова',ph:'+7 778 4•• •• 38',br:'Алматы',src:'Яндекс',st:'lost',kind:'out',debt:1200000,cred:1,mgr:'Асель К.',op:'Мадина',law:'—',created:'16.09',last:'18.09',sum:0,paid:0,tags:['долг меньше порога']},
 {id:'К-10545',n:'Нурлан Есимов',ph:'+7 701 3•• •• 45',br:'Астана',src:'Instagram',st:'qual',kind:'court',debt:8100000,cred:4,mgr:'Даулет',op:'Нурай',law:'—',created:'сегодня 09:20',last:'сегодня 10:05',sum:0,paid:0,tags:['ИИ: квалифицирован 87']}
];
const C=id=>CL.find(c=>c.id===id)||CL[0];
let curCl='К-10412',curBr='all';
const brCl=()=>curBr==='all'?CL:CL.filter(c=>c.br===curBr);

/* история взаимодействий клиента К-10412 */
const HIST=[
 ['сегодня 10:14','wa','Ару → клиент','«Айгерим, документы по кредиту Kaspi получены, юрист Сабина проверит до 16:00». Клиент: «Спасибо!»'],
 ['вчера 15:30','call','Сабина · 6 мин','Уточнили состав кредиторов: Kaspi, Halyk, Freedom. Справка о доходах — самозанятая, через eGov.'],
 ['18.09','task','Сабина','Собрать выписки по трём кредитам — выполнено, 3 файла в документах'],
 ['16.09','pay','Финансы','Платёж 70 000 ₸ по графику ДГ-2291 · 3 из 4 · Kaspi Pay'],
 ['10.09','wa','Ару → клиент','Напоминание о платеже за 2 дня. Клиент: «оплачу 16-го»'],
 ['02.09','stage','Асель К.','Договор → Оплата → В процедуре. Юрист назначен: Сабина'],
 ['28.08','meet','Асель К. · офис Алматы','Встреча 40 мин. Внесудебное: долг 4,2 млн, 3 кредита, имущества нет, просрочка 14 мес. Подходит. Договор ДГ-2291 на 280 000 ₸, 4 платежа'],
 ['26.08','call','Мадина · 9 мин','Квалификация по скрипту: долг, кредиторы, просрочка, имущество, доход. Записана на встречу 28.08 11:00'],
 ['25.08','ai','Ару · WhatsApp','Первый ответ через 40 секунд на лид из Instagram. 6 вопросов, оценка 82: подходит под внесудебное. Передано оператору Мадине'],
 ['25.08 20:12','lead','Instagram · лид-форма','Заявка «хочу списать долги», сумма 4 млн, Алматы']
];
const HK={wa:['WhatsApp','#25a05a'],call:['Звонок','#2f6f9e'],task:['Задача','#6b4ea8'],pay:['Платёж','#0e7c69'],stage:['Этап','#345c7d'],meet:['Встреча','#cf8a22'],ai:['ИИ','#8a5cf6'],lead:['Лид','#6b7f8c'],doc:['Документ','#1f7a5a'],edit:['Правка','#8b96a3']};

/* ====== ДОГОВОРЫ · СЧЕТА · ГРАФИКИ ====== */
const CT=[
 {id:'ДГ-2291',cl:'К-10412',sum:280000,n:4,paid:210000,st:'active',signed:'28.08',kind:'out',next:'16.10 · 70 000',late:0},
 {id:'ДГ-2340',cl:'К-10488',sum:600000,n:6,paid:150000,st:'active',signed:'12.09',kind:'court',next:'12.10 · 100 000',late:0},
 {id:'ДГ-2318',cl:'К-10523',sum:280000,n:1,paid:280000,st:'paid',signed:'05.09',kind:'out',next:'—',late:0},
 {id:'ДГ-2204',cl:'К-10395',sum:600000,n:6,paid:300000,st:'late',signed:'08.08',kind:'court',next:'08.09 · 100 000 · просрочка 12 дн',late:100000},
 {id:'ДГ-1987',cl:'К-10210',sum:250000,n:2,paid:250000,st:'closed',signed:'20.02',kind:'out',next:'—',late:0},
 {id:'ДГ-2352',cl:'К-10534',sum:450000,n:4,paid:0,st:'draft',signed:'—',kind:'rest',next:'после подписания',late:0}
];
const CTS={draft:['черновик','var(--muted)'],active:['действует','var(--acc)'],paid:['оплачен','var(--ok)'],late:['просрочка','var(--bad)'],closed:['закрыт','var(--muted2)']};
const INV=[
 {id:'СЧ-5120',cl:'К-10488',ct:'ДГ-2340',sum:100000,due:'12.10',st:'wait',way:'—'},
 {id:'СЧ-5119',cl:'К-10412',ct:'ДГ-2291',sum:70000,due:'16.10',st:'wait',way:'—'},
 {id:'СЧ-5101',cl:'К-10395',ct:'ДГ-2204',sum:100000,due:'08.09',st:'late',way:'—'},
 {id:'СЧ-5098',cl:'К-10412',ct:'ДГ-2291',sum:70000,due:'16.09',st:'paid',way:'Kaspi Pay · 16.09 14:02'},
 {id:'СЧ-5090',cl:'К-10523',ct:'ДГ-2318',sum:280000,due:'05.09',st:'paid',way:'Halyk · перевод · 05.09'},
 {id:'СЧ-5088',cl:'К-10488',ct:'ДГ-2340',sum:150000,due:'12.09',st:'paid',way:'касса Астана · 12.09'}
];
const IVS={wait:['ожидает','var(--acc)'],paid:['оплачен','var(--ok)'],late:['просрочен','var(--bad)']};
const SCHED=[['16.09',70000,'paid','Kaspi Pay'],['16.10',70000,'wait',''],['16.11',70000,'wait',''],['28.08',70000,'paid','касса Алматы']].sort((a,b)=>a[0].split('.').reverse().join('')>b[0].split('.').reverse().join('')?1:-1);

/* ====== ПРОЦЕДУРЫ ====== */
const PST_OUT=['Проверка условий','Сбор справок и выписок','Подача через eGov','Уведомление кредиторов','Процедура · 6 месяцев','Решение','Закрытие · освобождение'];
const PST_COURT=['Сбор документов','Заявление в суд','Принятие судом','Финансовый управляющий','Инвентаризация имущества','Реестр требований','Реализация имущества','Завершение','Освобождение от долгов'];
const PST_REST=['Анализ доходов','План восстановления','Согласование с кредиторами','Утверждение судом','Исполнение плана','Завершение'];
const PSTAGES=k=>k==='court'?PST_COURT:k==='rest'?PST_REST:PST_OUT;
const PR=[
 {id:'ПБ-0412',cl:'К-10412',kind:'out',stage:4,law:'Сабина',br:'Алматы',start:'02.09',next:'справка о доходах · 24.09',end:'≈ март 2027',docs:7,ok:true},
 {id:'ПБ-0395',cl:'К-10395',kind:'court',stage:5,law:'Ерасыл',br:'Астана',start:'15.08',next:'опись имущества в суд · 22.09',end:'≈ февраль 2027',docs:14,ok:false},
 {id:'ПБ-0488',cl:'К-10488',kind:'court',stage:1,law:'Ерасыл',br:'Астана',start:'14.09',next:'выписки по 5 кредитам · 26.09',end:'≈ апрель 2027',docs:4,ok:true},
 {id:'ПБ-0523',cl:'К-10523',kind:'out',stage:2,law:'Ерасыл',br:'Астана',start:'08.09',next:'подача через eGov · 23.09',end:'≈ апрель 2027',docs:5,ok:true},
 {id:'ПБ-0210',cl:'К-10210',kind:'out',stage:6,law:'Мейрам',br:'Актобе',start:'01.03',next:'—',end:'завершена 05.09',docs:9,ok:true},
 {id:'ПБ-0361',cl:'К-10395',kind:'court',stage:3,law:'Мейрам',br:'Актобе',start:'20.08',next:'заседание суда · 25.09 10:00',end:'≈ март 2027',docs:11,ok:true}
];
const DOCL=[['Удостоверение личности','скан','ok'],['Справка о доходах · eGov','pdf','ok'],['Выписка Kaspi · кредит 1','pdf','ok'],['Выписка Halyk · кредит 2','pdf','ok'],['Выписка Freedom · кредит 3','pdf','ok'],['Справка об отсутствии имущества','eGov','wait'],['Заявление о внесудебном банкротстве','сформировано из карточки','ok'],['Согласие на обработку ПДн','подписано в WhatsApp','ok']];

/* ====== СОТРУДНИКИ ====== */
const STAFF=[
 {n:'Айдар',role:'РОП',br:'Алматы',leads:0,meet:0,ctr:0,rev:0,note:'воронка филиала'},
 {n:'Мадина',role:'оператор',br:'Алматы',leads:186,meet:61,ctr:0,rev:0,note:'33% в встречу'},
 {n:'Жанель',role:'оператор',br:'Алматы',leads:171,meet:48,ctr:0,rev:0,note:'28% в встречу'},
 {n:'Асель К.',role:'менеджер',br:'Алматы',leads:0,meet:74,ctr:31,rev:8960000,note:'42% в договор'},
 {n:'Нурай',role:'оператор',br:'Астана',leads:142,meet:44,ctr:0,rev:0,note:'31% в встречу'},
 {n:'Даулет',role:'менеджер',br:'Астана',leads:0,meet:52,ctr:19,rev:7420000,note:'37% в договор'},
 {n:'Ерасыл',role:'юрист',br:'Астана',leads:0,meet:0,ctr:0,rev:0,note:'23 процедуры · 1 просрочка срока'},
 {n:'Алина',role:'оператор',br:'Актобе',leads:98,meet:27,ctr:0,rev:0,note:'28% в встречу'},
 {n:'Ботагоз',role:'менеджер · РОП',br:'Актобе',leads:0,meet:31,ctr:12,rev:3860000,note:'39% в договор'},
 {n:'Сабина',role:'юрист',br:'Алматы',leads:0,meet:0,ctr:0,rev:0,note:'31 процедура · сроки в норме'},
 {n:'Мейрам',role:'юрист',br:'Актобе',leads:0,meet:0,ctr:0,rev:0,note:'14 процедур'},
 {n:'Гульмира',role:'финансист',br:'все',leads:0,meet:0,ctr:0,rev:0,note:'дебиторка 4,1 млн'}
];
/* источники · сентябрь */
const SRCS=[
 {n:'Instagram',leads:412,cost:1650000,meet:118,ctr:41,rev:11900000},
 {n:'TikTok',leads:298,cost:890000,meet:71,ctr:22,rev:6300000},
 {n:'Google Ads',leads:176,cost:1240000,meet:64,ctr:27,rev:8100000},
 {n:'Сайт · SEO',leads:94,cost:180000,meet:33,ctr:14,rev:4200000},
 {n:'2ГИС',leads:61,cost:120000,meet:19,ctr:7,rev:1900000},
 {n:'Рекомендация',leads:57,cost:0,meet:31,ctr:18,rev:5100000},
 {n:'Яндекс',leads:48,cost:310000,meet:12,ctr:4,rev:1100000}
];
const SC={};
const seeMoney=()=>['Руководитель ЦБК','Финансист','РОП · Алматы','Менеджер · Астана','Администратор платформы'].indexOf(role)>=0;
const tag=(t,c)=>`<span class="tag" style="background:${c}22;color:${c}">${esc(t)}</span>`;
const stTag=k=>`<span class="tag" style="background:${STC(k)}1f;color:${STC(k)};border-left:3px solid ${STC(k)}">${esc(STN(k))}</span>`;
const barHtml=(p,c)=>`<div class="bar"><i style="display:block;height:100%;width:${Math.min(100,Math.max(0,p))}%;background:${c||'var(--brand)'}"></i></div>`;
const brSel=()=>`<select class="rsel" onchange="curBr=this.value;build()"><option value="all"${curBr==='all'?' selected':''}>Все филиалы</option>${BR.map(b=>`<option value="${b}"${b===curBr?' selected':''}>${b}</option>`).join('')}</select>`;
const clSel=()=>`<select class="rsel" onchange="curCl=this.value;build()">${CL.map(c=>`<option value="${c.id}"${c.id===curCl?' selected':''}>${esc(c.n)}</option>`).join('')}</select>`;
const th=(arr,r)=>`<thead><tr style="border-bottom:1.5px solid var(--line2)">${arr.map((h,i)=>`<th style="text-align:${(r||[]).indexOf(i)>=0||(r==='all'&&i)?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>`;
const td=(v,r,st)=>`<td class="${r?'mono':''}" style="text-align:${r?'right':'left'};padding:8px;${st||''}">${v}</td>`;
const money=v=>seeMoney()?v:'·';

/* ====== СВОДКА ====== */
SC.dash=()=>{const B=[['Алматы',486,142,41,8960000,1420000,31],['Астана',392,118,29,7420000,1950000,23],['Актобе',268,74,18,3860000,760000,14]];
 return `<div class="hd"><div><h2>Сводка по филиалам · сентябрь · ${curBr==='all'?'все филиалы':curBr}</h2>
 <p>Ваш пункт 11: «не просто CRM, а платформа управления ЦБК». Один экран для руководителя: лиды, встречи, договоры, выручка, дебиторка и процедуры по трём филиалам. Данные не собираются вручную — они появляются из действий операторов, менеджеров, юристов, финансов и ИИ.</p></div>
 <div class="btns">${brSel()}<button class="bt" onclick="go('today')">Что требует решения</button><button class="bt p" onclick="go('dashboards')">Свой дашборд</button></div></div>
<div class="wid">
 <div><small>Лидов за месяц</small><b class="a">1 146</b><span>CPL ${money('3 920 ₸')} · 7 источников</span></div>
 <div><small>Встреч проведено</small><b>334</b><span>29% от лидов · 61 назначено</span></div>
 <div><small>Договоров</small><b class="g">88</b><span>26% от встреч · средний ${money('322 000 ₸')}</span></div>
 <div><small>Выручка · оплачено</small><b>${money(mln(20240000))}</b><span>${money('план 24 млн · 84%')}</span></div>
 <div><small>Просрочки · дебиторка</small><b class="r">${money(mln(4130000))}</b><span>19 договоров · 6 старше 30 дней</span></div>
</div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 4px">Филиалы · сентябрь</h3><p class="mini" style="margin:0 0 10px">Клик по филиалу — его воронка, люди и деньги. Данные каждого филиала разграничены: РОП Астаны не видит Алматы.</p>
  <table class="t" style="font-size:11.4px">${th(['ФИЛИАЛ','ЛИДЫ','ВСТРЕЧИ','ДОГОВОРЫ','ВЫРУЧКА','ДЕБИТОРКА','ПРОЦЕДУР'],'all')}
  <tbody>${B.filter(b=>curBr==='all'||b[0]===curBr).map(b=>`<tr style="cursor:pointer" onclick="curBr='${b[0]}';go('branches')">${td('<b>'+b[0]+'</b>')}${td(b[1],1)}${td(b[2]+' · '+pct(b[2],b[1])+'%',1)}${td(b[3]+' · '+pct(b[3],b[2])+'%',1)}${td(money(mln(b[4])),1)}${td(money(mln(b[5])),1,'color:'+(b[5]>1500000?'var(--bad)':'inherit'))}${td(b[6],1)}</tr>`).join('')}</tbody></table>
  <h3 style="margin:12px 0 8px">Воронка месяца</h3>
  ${[['Лиды',1146],['Дозвонились',892],['Квалифицированы',611],['Встреча назначена',395],['Встреча проведена',334],['Договор',88],['Оплата',79],['В процедуре',71]].map(([n,v],i)=>`<div class="fr" style="grid-template-columns:150px 1fr 80px"><span style="font-size:11.3px">${n}</span>${barHtml(v/1146*100,i>=5?'var(--ok)':'var(--brand)')}<b class="mono" style="text-align:right">${fmt(v)}</b></div>`).join('')}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Сегодня</h3>
   <div class="kv"><span>Новых лидов с утра</span><b>47</b></div>
   <div class="kv"><span>Ответил ИИ за минуту</span><b style="color:var(--violet)">44 из 47</b></div>
   <div class="kv"><span>Встреч сегодня</span><b>18 · 3 онлайн</b></div>
   <div class="kv"><span>Платежей ожидается</span><b>${money('12 · 1 040 000 ₸')}</b></div>
   <div class="kv" style="border:0"><span>Контрольных точек по процедурам</span><b style="color:var(--warn)">6 · 1 просрочена</b></div>
   <button class="bt p" style="width:100%;margin-top:10px" onclick="go('today')">Открыть список</button>
  </div>
  <div class="pan" style="background:var(--rail);color:#dce3e8;border-color:var(--rail)"><h3 style="margin:0 0 7px;color:#fff">Спросить у платформы</h3>
   <p class="mini" style="color:#a9b4bd;margin:0 0 8px">«Какой источник дал лучшие договоры в Астане за август?» — ответ по данным, с таблицей. Раздел «Управление через ИИ».</p>
   <button class="bt" style="width:100%" onclick="go('aimanage')">Задать вопрос</button></div>
 </div>
</div>
<div class="said"><b>Ваш пункт 8, «собственные дашборды».</b> Этот экран — один из стандартных. Любой показатель отсюда можно вынести в свой дашборд: по филиалу, сотруднику, источнику, периоду. Без программиста.</div>`};

SC.today=()=>`<div class="hd"><div><h2>Что требует решения · суббота, 20 сентября</h2>
 <p>Список собирается из отклонений: просрочка платежа, лид без ответа дольше 15 минут, встреча без итога, контрольная точка процедуры, оператор без нагрузки. Если всё в порядке — пусто.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Нерешённое к 19:00 уходит руководителю и РОПам одним сообщением в WhatsApp.')">Разобрал</button></div></div>
<div class="g2">
 <div>
  <div class="tsk" style="--c:var(--bad)"><b>Жанна Ким · Астана · платёж 100 000 ₸ просрочен 12 дней</b>
   <p class="mini" style="margin:5px 0 8px">Договор ДГ-2204, 3 из 6 платежей. ИИ напомнил дважды, ответа нет. Процедура в суде — по правилу при просрочке 14 дней юрист приостанавливает работу. Решение: звонок менеджера или отсрочка.</p>
   <button class="bt p" onclick="curCl='К-10395';go('client')">Открыть карточку</button> <button class="bt" onclick="toast('Отсрочка до 30.09 согласована: график пересобран, клиенту ушло сообщение, юристу — «работу продолжать». Отметка в истории: кто и когда.')">Дать отсрочку</button></div>
  <div class="tsk" style="--c:var(--bad)"><b>ПБ-0395 · опись имущества в суд · срок 22.09</b>
   <p class="mini" style="margin:5px 0 8px">Юрист Ерасыл: нет ответа от клиента по автомобилю. Контрольная точка через два дня, суд не перенесёт. Система подняла за пять дней.</p>
   <button class="bt" onclick="go('deadlines')">Контрольные точки</button></div>
  <div class="tsk" style="--c:var(--warn)"><b>7 лидов без ответа оператора дольше 15 минут · Алматы</b>
   <p class="mini" style="margin:5px 0 8px">ИИ ответил всем, но 7 попросили «позвоните». Мадина на линии, Жанель на обеде. РОП может перераспределить.</p>
   <button class="bt" onclick="go('leads')">Распределить</button></div>
 </div>
 <div>
  <div class="tsk" style="--c:var(--warn)"><b>Салтанат Бекова · Актобе · встреча проведена, итога нет 2 дня</b>
   <p class="mini" style="margin:5px 0 8px">Ботагоз провела встречу 18.09, договор ДГ-2352 в черновике на 450 000. Без итога воронка врёт.</p>
   <button class="bt" onclick="toast('Итог встречи: «думает, перезвонить 23.09». Задача Ботагоз создана, клиенту — сообщение с расчётом восстановления платёжеспособности.')">Поставить итог</button></div>
  <div class="tsk" style="--c:var(--acc)"><b>ИИ передал человеку 5 диалогов</b>
   <p class="mini" style="margin:5px 0 8px">Три — вопрос о рассрочке, один — жалоба на юриста, один — «позовите живого человека». По правилам ИИ такое не решает.</p>
   <button class="bt" onclick="go('aibot')">Открыть диалоги</button></div>
  <div class="tsk" style="--c:var(--violet)"><b>Google Ads · CPL вырос до 7 050 ₸ за неделю</b>
   <p class="mini" style="margin:5px 0 8px">Лидов 176 при 1,24 млн расходов; конверсия во встречу 36% — лиды хорошие, но дорогие. Instagram даёт 4 000 ₸. Данные из рекламного кабинета по API.</p>
   <button class="bt" onclick="go('sources')">Источники и CPL</button></div>
 </div>
</div>`;

/* ====== КЛИЕНТЫ ====== */
SC.clients=()=>{const own=role==='Оператор'?CL.filter(c=>c.op==='Мадина'):role==='Менеджер · Астана'?CL.filter(c=>c.br==='Астана'):role==='РОП · Алматы'?CL.filter(c=>c.br==='Алматы'):brCl();return `<div class="hd"><div><h2>Клиенты · поиск, фильтры, сегментация</h2>
 <p>Ваш пункт 1: единая карточка, история, лиды и сделки, кастомные поля, поиск и фильтры, история изменений. Фильтр по любому полю — стандартному или вашему; сохранённый фильтр становится сегментом для рассылки и отчёта.</p></div>
 <div class="btns">${brSel()}<button class="bt" onclick="toast('Сегмент сохранён: «Внесудебное · в процедуре · платёж через 3 дня» — 41 клиент. Доступен в рассылках и дашбордах.')">Сохранить сегмент</button><button class="bt p" onclick="toast('Новый клиент: телефон проверяется на дубли по всем филиалам, источник и филиал подставляются, оператор назначается по правилу распределения.')">+ Клиент</button></div></div>
<div class="pan" style="padding:10px 14px"><div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center">
 <span class="mini" style="font-weight:700">Фильтры:</span>
 ${[['Этап','В процедуре'],['Вид','Внесудебное'],['Сумма долга','от 1,6 млн'],['Источник','любой'],['Менеджер','любой'],['Платёж','через 3 дня'],['Ваше поле: «Ипотека»','нет']].map(([k,v])=>`<span class="tag" style="background:var(--brandl);color:var(--brand);font-size:9.6px">${k}: ${v}</span>`).join('')}
 <span class="mini" style="margin-left:auto">Сегменты: <b>Платёж скоро · 41</b> · <b>Без ответа 3 дня · 12</b> · <b>Завершённые · 214</b></div></div>
<div class="pan mx"><table class="t" style="font-size:11.3px">${th(['КЛИЕНТ','ФИЛИАЛ','ИСТОЧНИК','ЭТАП','ВИД','ДОЛГ','КРЕДИТОРОВ','ДОГОВОР','ОПЛАЧЕНО','ПОСЛЕДНИЙ КОНТАКТ'],[5,6,7,8,9])}
 <tbody>${own.map(c=>`<tr style="cursor:pointer" onclick="curCl='${c.id}';go('client')">${td('<b>'+esc(c.n)+'</b><div class="mini">'+c.id+' · '+c.ph+'</div>')}${td(c.br)}${td(c.src)}${td(stTag(c.st))}${td(c.debt?KIND[c.kind]:'—')}${td(c.debt?mln(c.debt):'—',1)}${td(c.cred||'—',1)}${td(c.sum?money(tg(c.sum)):'—',1)}${td(c.sum?money(tg(c.paid)):'—',1,'color:'+(c.paid<c.sum&&c.st!=='contract'?'var(--warn)':'inherit'))}${td(c.last,1)}</tr>`).join('')}
 <tr><td colspan="10" style="padding:8px;color:var(--muted)">+ ещё ${own.length>8?'2 296':'412'} клиентов · поиск по имени, телефону, ИИН, номеру договора, любому полю</td></tr></tbody></table></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Дубли</h3><p class="mini" style="margin:0">Один телефон — один клиент по всем филиалам. Лид из Актобе с номером клиента Алматы склеивается, а не заводится второй раз.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Сегмент = действие</h3><p class="mini" style="margin:0">Сохранённый фильтр можно отправить в рассылку, вынести на дашборд, отдать ИИ для обзвона или выгрузить в Excel.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Кто видит</h3><p class="mini" style="margin:0">Оператор — своих лидов, менеджер — свои сделки, юрист — своих клиентов в процедуре, филиал — только свой. Руководитель — всех.</p></div>
</div>`};

SC.client=()=>{const c=C(curCl);const ct=CT.find(x=>x.cl===c.id),pr=PR.find(x=>x.cl===c.id);const stages=pr?PSTAGES(pr.kind):[];return `<div class="hd"><div><h2>${esc(c.n)} <span class="mini">· ${c.id} · ${c.ph}</span></h2>
 <p>Единая карточка: лид, сделка, договор, платежи, процедура, документы, WhatsApp, задачи и история изменений — всё здесь, не в пяти системах. Клик по любому блоку открывает раздел.</p></div>
 <div class="btns">${clSel()}<button class="bt" onclick="go('wa')">WhatsApp</button><button class="bt" onclick="toast('Задача создана: ${esc(c.mgr!=='—'?c.mgr:'оператор')} · перезвонить · завтра 10:00. Напоминание в WhatsApp и в списке задач.')">+ Задача</button><button class="bt p" onclick="go('changes')">История изменений</button></div></div>
<div class="wid" style="grid-template-columns:repeat(5,1fr)">
 <div><small>Этап</small><b class="a" style="font-size:15px">${esc(STN(c.st))}</b><span>${c.br} · ${c.src} · с ${c.created}</span></div>
 <div><small>Долг · кредиторы</small><b>${c.debt?mln(c.debt):'—'}</b><span>${c.cred?c.cred+' '+plural(c.cred,['кредитор','кредитора','кредиторов'])+' · '+KIND[c.kind]:'уточняется'}</span></div>
 <div><small>Договор</small><b>${ct?money(tg(ct.sum)):'—'}</b><span>${ct?ct.id+' · '+ct.n+' платежей · '+CTS[ct.st][0]:'нет'}</span></div>
 <div><small>Оплачено</small><b class="${ct&&ct.late?'r':'g'}">${ct?money(tg(ct.paid)):'—'}</b><span>${ct?(ct.late?'просрочка '+tg(ct.late):'следующий '+ct.next):''}</span></div>
 <div><small>Процедура</small><b>${pr?pr.id:'—'}</b><span>${pr?stages[pr.stage]+' · '+pr.law:'после оплаты'}</span></div>
</div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">История всех взаимодействий</h3>
  ${(c.id==='К-10412'?HIST:[[c.last,'wa','Ару → клиент','Последний диалог в WhatsApp'],[c.created,'lead',c.src,'Лид создан · '+c.br]]).map(([t,k,who,txt])=>`<div class="dl" style="--c:${HK[k][1]};padding:8px 12px"><b class="mono" style="width:86px;font-size:10.4px">${esc(t)}</b>${tag(HK[k][0],HK[k][1])}<div style="flex:1;min-width:0"><b style="font-size:11.4px">${esc(who)}</b><div class="mini">${esc(txt)}</div></div></div>`).join('')}
  <p class="mini" style="margin:6px 0 0">Звонки с записью через телефонию, WhatsApp целиком, встречи с итогом, платежи, этапы, задачи, действия ИИ с пометкой — одна лента.</p>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Данные клиента</h3>
   <div class="kv"><span>Телефон · WhatsApp</span><b>${c.ph}</b></div>
   <div class="kv"><span>Оператор · менеджер · юрист</span><b>${esc(c.op)} · ${esc(c.mgr)} · ${esc(c.law)}</b></div>
   <div class="kv"><span>Просрочка по кредитам</span><b>${c.debt?'14 мес':'—'}</b></div>
   <div class="kv"><span>Имущество</span><b>${c.tags.some(t=>/ипотек|авто/.test(t))?'есть · '+c.tags.find(t=>/ипотек|авто/.test(t)):'нет'}</b></div>
   <div class="kv"><span>Ваше поле: «Самозанятость»</span><b>${c.tags.indexOf('самозанятая')>=0?'да':'нет'}</b></div>
   <div class="kv" style="border:0"><span>Теги</span><b>${c.tags.length?c.tags.map(t=>tag(t,'var(--muted)')).join(' '):'—'}</b></div>
   <p class="mini" style="margin:8px 0 0">Поля «Самозанятость», «Ипотека», «Кредиторы» — ваши, добавлены в конструкторе полей. Раздел «Кастомные поля».</p>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Связано</h3>
   <div class="kv" style="cursor:pointer" onclick="go('contracts')"><span>Договор</span><b>${ct?ct.id+' · '+CTS[ct.st][0]:'—'}</b></div>
   <div class="kv" style="cursor:pointer" onclick="go('schedule')"><span>График платежей</span><b>${ct?ct.n+' платежей · оплачено '+Math.round(ct.paid/ct.sum*ct.n):'—'}</b></div>
   <div class="kv" style="cursor:pointer" onclick="go('proc')"><span>Процедура</span><b>${pr?pr.id+' · этап '+(pr.stage+1)+' из '+stages.length:'—'}</b></div>
   <div class="kv" style="cursor:pointer" onclick="go('docs')"><span>Документы</span><b>${pr?pr.docs+' файлов':'—'}</b></div>
   <div class="kv" style="border:0;cursor:pointer" onclick="go('tasks')"><span>Задачи</span><b>2 открытые</b></div>
  </div>
 </div>
</div>`};

SC.fields=()=>`<div class="hd"><div><h2>Кастомные поля и сущности</h2>
 <p>Ваш пункт 1: «кастомные поля и сущности». Администратор добавляет поле или целую сущность без программиста: тип, обязательность, кто видит, где показывать. Поле сразу доступно в фильтрах, API, дашбордах и ИИ.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Новая сущность «Кредитор»: название, БИН, контакт, сумма требования, связь с клиентом и процедурой. Появится в карточке клиента, в API и в отчётах.')">+ Сущность</button><button class="bt p" onclick="fieldAdd()">+ Поле</button></div></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Поля клиента · ваши</h3>
  <table class="t" style="font-size:11.3px">${th(['ПОЛЕ','ТИП','ОБЯЗАТЕЛЬНО','КТО ВИДИТ','ГДЕ'],[])}
  <tbody>${[['Сумма долга','деньги','да','все','карточка · воронка · API'],['Количество кредиторов','число','да','все','карточка'],['Вид процедуры','список: внесудебное · судебное · восстановление','да','все','карточка · воронка · процедура'],['Просрочка по кредитам','число · месяцев','нет','все','карточка · ИИ-квалификация'],['Имущество','список с уточнением','нет','менеджер · юрист','карточка · процедура'],['Самозанятость','да / нет','нет','все','фильтры · рассылки'],['ИИН','строка · проверка формата','при договоре','менеджер · юрист · финансы','договор · процедура'],['Согласие на ПДн','файл · дата','при договоре','все','карточка · журнал']].map(r=>`<tr>${td('<b>'+r[0]+'</b>')}${td(r[1],0,'color:var(--muted)')}${td(r[2])}${td(r[3])}${td(r[4],0,'color:var(--muted)')}</tr>`).join('')}</tbody></table>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Сущности платформы</h3>
   ${[['Клиент','стандартная · расширяемая'],['Лид · сделка','стандартная'],['Договор · счёт · платёж','стандартная'],['Процедура','ваша · этапы по виду'],['Кредитор','ваша · связь с процедурой'],['Встреча','стандартная'],['Филиал · сотрудник','стандартная'],['Документ','стандартная · MinIO']].map(([n,t])=>`<div class="kv"><span><b>${n}</b></span><span class="mini">${t}</span></div>`).join('')}
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Как устроено внутри</h3><p class="mini" style="margin:0">Схема полей хранится в базе (JSON Schema), а не в коде. Новое поле — запись в схеме: API отдаёт его сразу, фильтры и дашборды его видят, ИИ получает описание поля и умеет его заполнять. Это и есть «расширение без переделки ядра» из вашего пункта 9.</p></div>
 </div>
</div>`;

SC.changes=()=>{const c=C(curCl);return `<div class="hd"><div><h2>История изменений · ${esc(c.n)}</h2>
 <p>Ваш пункт 1: «история изменений». Каждое изменение любого поля — кто, когда, откуда (интерфейс, API, ИИ, импорт), было → стало. Откатить — кнопкой. Это же ложится в журнал действий из пункта 10.</p></div>
 <div class="btns">${clSel()}<button class="bt" onclick="toast('Выгрузка истории изменений по клиенту в PDF — для спора или проверки.')">В PDF</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.3px">${th(['КОГДА','КТО','ОТКУДА','ПОЛЕ','БЫЛО','СТАЛО',''],[])}
 <tbody>${[['сегодня 10:14','Ару · ИИ','WhatsApp','Документы','6 файлов','7 файлов · выписка Kaspi'],['вчера 15:31','Сабина','интерфейс','Кредиторы','Kaspi, Halyk','Kaspi, Halyk, Freedom'],['16.09 14:02','Kaspi Pay','вебхук платежа','Оплачено','140 000','210 000'],['02.09 12:40','Асель К.','интерфейс','Этап','Оплата','В процедуре'],['02.09 12:40','система','правило','Юрист','—','Сабина · по нагрузке'],['28.08 11:52','Асель К.','интерфейс','Договор','—','ДГ-2291 · 280 000 · 4 платежа'],['26.08 10:20','Мадина','интерфейс','Сумма долга','4 000 000','4 200 000'],['25.08 20:13','Ару · ИИ','WhatsApp · квалификация','Сумма долга · Кредиторов · Просрочка','—','4 000 000 · 3 · 14 мес'],['25.08 20:12','Instagram','лид-форма · API','Клиент','—','создан · Алматы · Instagram']].map(r=>`<tr>${td(r[0],1)}${td('<b>'+r[1]+'</b>')}${td(tag(r[2],r[2].indexOf('ИИ')>=0||r[2].indexOf('WhatsApp')>=0?'var(--violet)':r[2].indexOf('API')>=0||r[2].indexOf('вебхук')>=0?'var(--acc)':'var(--muted)'))}${td(r[3])}${td(r[4],0,'color:var(--muted)')}${td('<b>'+r[5]+'</b>')}${td('<button class="bt" style="padding:3px 8px;font-size:10px" onclick="toast(\'Откат изменения: поле вернётся к прежнему значению, в истории появится запись об откате с вашим именем.\')">откатить</button>')}</tr>`).join('')}</tbody></table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Что попадает</h3><p class="mini" style="margin:0">Поля клиента, этапы, суммы, назначения сотрудников, документы, права. Действия ИИ — с пометкой и с текстом, на основании которого он изменил поле.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Зачем</h3><p class="mini" style="margin:0">Спор «кто поменял сумму договора», проверка работы ИИ, аудит по персональным данным, восстановление после ошибки импорта. Хранится весь срок жизни клиента.</p></div>
</div>`};
/* ====== ВОРОНКА ====== */
SC.funnel=()=>{const list=role==='Менеджер · Астана'?CL.filter(c=>c.br==='Астана'):role==='РОП · Алматы'?CL.filter(c=>c.br==='Алматы'):brCl();const cols=ST.filter(s=>s[0]!=='done'&&s[0]!=='lost');return `<div class="hd"><div><h2>Воронка продаж · собственные этапы</h2>
 <p>Ваш пункт 2: свои этапы и статусы, распределение, задачи, конверсии. Этапы, цвета, автосообщения и правила перехода настраиваете сами. Карточки перетаскиваются; переход на «Оплата» — только по подтверждённому платежу.</p></div>
 <div class="btns">${brSel()}<button class="bt" onclick="toast('Этапы воронки: добавить, переименовать, поменять цвет и порядок, задать правило перехода и автосообщение. Без программиста.')">Настроить этапы</button><button class="bt p" onclick="go('conv')">Конверсии</button></div></div>
<div class="pipe" style="grid-auto-columns:minmax(168px,1fr)">${cols.map(s=>{const cs=list.filter(c=>c.st===s[0]);return `<div><div class="phead" style="background:${s[2]}">${esc(s[1])} <span style="opacity:.75">· ${cs.length||''}</span></div><div class="pbody">${cs.map(c=>`<div class="pc" onclick="curCl='${c.id}';go('client')"><b style="font-size:11.4px;display:block">${esc(c.n)}</b><div class="mini">${c.br} · ${c.src}${c.debt?' · '+mln(c.debt):''}</div><div class="prow" style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap">${c.op!=='—'?tag(c.op,'var(--muted)'):''}${c.tags.some(t=>t.indexOf('ИИ')>=0)?tag('✦ ИИ 87','var(--violet)'):''}${c.st==='nocall'?tag('повтор 14:00','var(--warn)'):''}</div></div>`).join('')||'<p class="mini" style="padding:8px;margin:0">—</p>'}</div></div>`}).join('')}</div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Правила переходов</h3><p class="mini" style="margin:0">«Квалифицирован» — только с заполненными долгом и кредиторами. «Договор» — только с подписанным файлом. «Оплата» — по вебхуку платежа или подтверждению финансиста. «В процедуре» — назначается юрист по нагрузке.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Автосообщение на этапе</h3><p class="mini" style="margin:0">Сдвинули карточку — клиенту ушёл шаблон этапа в WhatsApp с подстановками: имя, дата встречи, менеджер, ссылка на оплату. Раздел «Шаблоны».</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Недозвон</h3><p class="mini" style="margin:0">Три попытки по расписанию, между ними — сообщение от ИИ. После третьей — архив с напоминанием через месяц, лид не теряется.</p></div>
</div>`};

SC.leads=()=>{const own=role==='Оператор'?CL.filter(c=>c.op==='Мадина'||c.op==='—'):role==='РОП · Алматы'?CL.filter(c=>c.br==='Алматы'):brCl();return `<div class="hd"><div><h2>Лиды и распределение между операторами</h2>
 <p>Лид с рекламы попадает в систему через API за секунды, ИИ отвечает первым, затем лид распределяется по правилу: филиал по городу, оператор — по очереди и нагрузке, VIP — старшему. РОП видит очередь и перераспределяет.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Правила распределения: по филиалу (город из формы или кода номера), по очереди, по нагрузке (не больше 12 открытых на оператора), по источнику, по сумме долга. Резерв: если оператор не взял за 15 минут — следующему.')">Правила</button><button class="bt p" onclick="leadAdd()">+ Лид</button></div></div>
<div class="wid" style="grid-template-columns:repeat(5,1fr)">
 <div><small>Лидов сегодня</small><b class="a">47</b><span>Instagram 21 · TikTok 14 · Google 8</span></div>
 <div><small>Первый ответ</small><b class="g">40 сек</b><span>ИИ · 44 из 47</span></div>
 <div><small>Без оператора дольше 15 мин</small><b class="w">7</b><span>Алматы</span></div>
 <div><small>Нагрузка операторов</small><b>Мадина 12 · Жанель 9</b><span>лимит 12</span></div>
 <div><small>Квалифицировано ИИ</small><b style="color:var(--violet)">29</b><span>оценка ≥ 70 · 18 на встречу</span></div>
</div>
<div class="pan">${own.map(c=>`<div class="dl" style="--c:${STC(c.st)}" onclick="curCl='${c.id}';go('client')">
 <b class="mono" style="width:60px;font-size:10.6px">${c.id}</b>
 <div style="flex:1;min-width:0"><b>${esc(c.n)}</b> <span class="mini">· ${c.br} · ${c.src} · ${c.created}</span><div class="mini">${c.debt?'долг '+mln(c.debt)+' · '+c.cred+' кредиторов · '+KIND[c.kind]:'ИИ уточняет сумму долга и кредиторов'}${c.tags.some(t=>t.indexOf('ИИ')>=0)?' · <span style="color:var(--violet)">✦ квалифицирован 87</span>':''}</div></div>
 <span class="mini" style="width:110px;text-align:right">${c.op!=='—'?'оператор '+esc(c.op):'<span style="color:var(--warn)">не распределён</span>'}</span>
 ${stTag(c.st)}
 ${c.op==='—'?`<button class="bt p" onclick="event.stopPropagation();toast('Лид передан Жанель (нагрузка 9 из 12). Уведомление в WhatsApp, таймер ответа 15 минут.')">Назначить</button>`:''}</div>`).join('')}</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Откуда лиды</h3><p class="mini" style="margin:0">Лид-формы Instagram и TikTok, Google Ads, сайт, 2ГИС, звонки на номер с телефонии, входящие в WhatsApp, ручной ввод. Все — через один вход в API, поэтому новый источник подключается без переделки.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Что видит оператор</h3><p class="mini" style="margin:0">Своих лидов, что уже спросил ИИ, скрипт квалификации, кнопки «позвонить», «написать», «записать на встречу». Чужих лидов и денег — нет.</p></div>
</div>`};

SC.tasks=()=>`<div class="hd"><div><h2>Задачи и напоминания</h2>
 <p>Задачи ставят люди, правила и ИИ: «перезвонить», «итог встречи», «собрать выписки», «напомнить о платеже». Напоминание — в WhatsApp сотруднику и в списке. Просроченные поднимаются РОПу и в «что требует решения».</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Задача: кому, что, когда, к какому клиенту. Повторяющиеся — по расписанию.')">+ Задача</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Открытых</small><b class="a">64</b><span>по ${curBr==='all'?'трём филиалам':curBr}</span></div>
 <div><small>Просрочено</small><b class="r">5</b><span>у 3 сотрудников</span></div>
 <div><small>Создано правилами и ИИ</small><b style="color:var(--violet)">38</b><span>60%</span></div>
 <div><small>Закрыто сегодня</small><b class="g">41</b><span>к 12:00</span></div>
</div>
<div class="pan">${[['просрочено · 18.09','Ботагоз · менеджер','Итог встречи · Салтанат Бекова','правило: встреча без итога 24 ч','bad'],['сегодня 14:00','Мадина · оператор','Повторный звонок · Марат Жаксылыков · недозвон 2','правило: недозвон','warn'],['сегодня 16:00','Сабина · юрист','Проверить выписку Kaspi · Айгерим Нурланова','ИИ: документ получен','violet'],['22.09','Ерасыл · юрист','Опись имущества в суд · ПБ-0395','контрольная точка процедуры','bad'],['23.09 10:00','Ботагоз · менеджер','Перезвонить · Салтанат Бекова · «думает»','итог встречи','acc'],['24.09','Ару · ИИ','Напомнить о платеже 70 000 · Айгерим Нурланова · за 2 дня до 16.10 — отложено','график платежей','muted'],['26.09','Даулет · менеджер','Собрать выписки по 5 кредитам · Бауыржан Сейтказы','юрист Ерасыл','acc']].map(([t,who,what,src,c])=>`<div class="dl" style="--c:var(--${c})"><b class="mono" style="width:120px;font-size:10.6px;color:${c==='bad'?'var(--bad)':'inherit'}">${t}</b><div style="flex:1;min-width:0"><b>${esc(what)}</b><div class="mini">${esc(who)} · ${esc(src)}</div></div><button class="bt" onclick="toast('Задача закрыта с комментарием. В истории клиента — запись, у РОПа — минус одна просроченная.')">Закрыть</button></div>`).join('')}</div>`;

SC.conv=()=>`<div class="hd"><div><h2>Контроль конверсий · сентябрь</h2>
 <p>Конверсия каждого этапа по филиалу, источнику, оператору и менеджеру. Где падает — видно за неделю, а не по итогам месяца. Это же — основа для расчёта CPL до договора и оплаты.</p></div>
 <div class="btns">${brSel()}<button class="bt" onclick="toast('Сравнение периодов: сентябрь против августа по каждому этапу и сотруднику.')">Сравнить с августом</button></div></div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">По этапам · ${curBr==='all'?'все филиалы':curBr}</h3>
  <table class="t" style="font-size:11.3px">${th(['ЭТАП','ВОШЛО','ПРОШЛО ДАЛЬШЕ','КОНВЕРСИЯ','АВГУСТ','СРЕДНЕЕ ВРЕМЯ'],'all')}
  <tbody>${[['Лид → дозвон',1146,892,78,76,'1,4 ч'],['Дозвон → квалифицирован',892,611,68,64,'1 звонок'],['Квалифицирован → встреча назначена',611,395,65,66,'0,8 дня'],['Назначена → проведена',395,334,85,81,'2,1 дня'],['Проведена → договор',334,88,26,29,'3,4 дня'],['Договор → оплата',88,79,90,92,'1,9 дня'],['Оплата → в процедуре',79,71,90,88,'2,6 дня']].map(r=>`<tr>${td('<b>'+r[0]+'</b>')}${td(fmt(r[1]),1)}${td(fmt(r[2]),1)}${td(r[3]+'%',1,'font-weight:700;color:'+(r[3]<r[4]-2?'var(--bad)':'var(--ok)'))}${td(r[4]+'%',1,'color:var(--muted)')}${td(r[5],1)}</tr>`).join('')}</tbody></table>
  <div class="hint"><b>Встреча → договор упала с 29% до 26%.</b> По менеджерам: Асель 42%, Даулет 37%, Ботагоз 39%, новый менеджер Актобе — 14% на 21 встрече. Не воронка сломалась — один человек без наставника. Задача РОПу создана.</div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">По операторам · лид → встреча</h3>
   ${[['Мадина',33],['Нурай',31],['Жанель',28],['Алина',28],['Ару · ИИ',24]].map(([n,p])=>`<div class="fr" style="grid-template-columns:90px 1fr 50px"><span style="font-size:11px">${n}</span>${barHtml(p*2.6,n.indexOf('ИИ')>=0?'var(--violet)':'var(--brand)')}<b class="mono" style="text-align:right">${p}%</b></div>`).join('')}
   <p class="mini" style="margin:6px 0 0">ИИ записывает на встречу сам в 24% случаев — ночью и когда операторы заняты.</p>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">По источникам · лид → договор</h3>
   ${SRCS.slice(0,5).map(s=>`<div class="kv" style="font-size:11px"><span>${s.n}</span><b class="mono">${pct(s.ctr,s.leads)}% · ${s.ctr} дог.</b></div>`).join('')}
  </div>
 </div>
</div>`;

/* ====== WHATSAPP ====== */
SC.wa=()=>{const c=C(curCl);return `<div class="hd"><div><h2>WhatsApp · переписка из CRM</h2>
 <p>Ваш пункт 3: WhatsApp Business API, переписка из CRM, привязка диалогов к клиенту. Номера филиалов подключены через API; диалог привязан к карточке по телефону; оператор пишет из CRM, руководитель видит всё, ИИ отвечает первым.</p></div>
 <div class="btns">${clSel()}<button class="bt" onclick="toast('Передача диалога: оператору, менеджеру, юристу — с историей. Клиенту — «с вами продолжит Сабина».')">Передать</button><button class="bt p" onclick="go('templates')">Шаблоны</button></div></div>
<div class="g21">
 <div class="pan" style="border-top:3px solid #25a05a"><h3 style="margin:0 0 4px">${esc(c.n)} · ${c.ph} <span class="mini">· номер ${c.br} · WhatsApp Business API</span></h3>
  <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">
   ${[['in','25.08 20:12','Здравствуйте, хочу списать долги, увидела рекламу'],['ai','25.08 20:13','Здравствуйте, Айгерим! Я Ару, помощник ЦБК. Помогу понять, подходит ли вам процедура. Подскажите, общая сумма долгов примерно какая?'],['in','25.08 20:14','Около 4 миллионов, три кредита'],['ai','25.08 20:14','Спасибо. Просрочка есть? Сколько месяцев не платите? И есть ли имущество — квартира, авто?'],['in','25.08 20:16','Не плачу больше года. Имущества нет, снимаю'],['ai','25.08 20:16','По вашим ответам подходит внесудебное банкротство. Завтра с вами свяжется специалист Мадина — удобно с 10 до 12? Консультация бесплатная.'],['in','25.08 20:17','Да, удобно'],['out','26.08 10:04','Айгерим, добрый день! Это Мадина, ЦБК. Наберу вас через пять минут, как договаривались.'],['out','28.08 12:10','Договор подписан, спасибо за доверие. Ссылка на оплату первого платежа: pay.kaspi.kz/… Юрист Сабина напишет вам завтра.'],['ai','10.09 10:00','Айгерим, напоминаю: платёж 70 000 ₸ по графику — 16 сентября. Ссылка та же. Если нужна отсрочка — напишите, передам менеджеру.'],['in','сегодня 10:12','Отправила выписку Kaspi'],['ai','сегодня 10:14','Получила, спасибо! Файл в вашей папке, юрист Сабина проверит до 16:00.']].map(([k,t,m])=>`<div class="msg" style="${k==='in'?'background:var(--card2)':'background:'+(k==='ai'?'var(--violet-l)':'var(--brandl)')+';margin-left:auto'}"><div class="mini" style="font-size:9.6px;margin-bottom:2px">${k==='in'?'клиент':k==='ai'?'✦ Ару · ИИ':'Мадина'} · ${t}</div>${esc(m)}</div>`).join('')}
  </div>
  <div style="display:flex;gap:6px;margin-top:10px"><input placeholder="Написать от имени Мадины · Алматы" style="flex:1;padding:8px 10px;border:1px solid var(--line2);border-radius:6px;background:var(--card)"><button class="bt" onclick="toast('Шаблоны: приветствие, запись на встречу, ссылка на оплату, напоминание, запрос документа. С подстановками.')">Шаблон</button><button class="bt p" onclick="toast('Отправлено через WhatsApp Business API с номера филиала Алматы. Сообщение — в истории клиента.')">Отправить</button></div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Диалоги филиала · сейчас</h3>
   ${[['Руслан Ахметов','новый · ИИ отвечает','violet'],['Гульнара Абдрахманова','ждёт оператора 4 мин','warn'],['Марат Жаксылыков','напоминание отправлено','muted'],['Ерлан Мусин','Алина отвечает','acc'],['Нурлан Есимов','✦ квалифицирован 87','violet']].map(([n,s,c])=>`<div class="kv" style="cursor:pointer" onclick="toast('Открыт диалог: ${n}.')"><span><b>${n}</b></span><b style="color:var(--${c});font-weight:600;font-size:11px">${s}</b></div>`).join('')}
   <p class="mini" style="margin:8px 0 0">Очередь по филиалу: кто отвечает, кто ждёт, сколько минут. Дольше 15 минут — РОПу.</p>
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Как подключено</h3><p class="mini" style="margin:0">WhatsApp Business API напрямую (Meta Cloud API) или через казахстанского провайдера — по вашему выбору. Три номера, по одному на филиал, плюс номер для рекламы. Номер принадлежит компании: уволился сотрудник — переписка осталась.</p></div>
  <div class="pan"><h3 style="margin:0 0 6px">События через API</h3><p class="mini" style="margin:0">Входящее, исходящее, доставлено, прочитано, статус шаблона — вебхуки в ваши сервисы. Ваш пункт 3, последний подпункт: раздел «REST API и вебхуки».</p></div>
 </div>
</div>`};

SC.templates=()=>`<div class="hd"><div><h2>Шаблоны сообщений</h2>
 <p>Шаблоны с подстановками из карточки: имя, филиал, менеджер, дата встречи, сумма и ссылка платежа, этап процедуры. Шаблоны для первого касания проходят одобрение Meta — мы это делаем при запуске.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Новый шаблон: текст с подстановками {имя}, {сумма}, {дата}; категория; на каком этапе или событии отправлять; на каком языке — русский и казахский.')">+ Шаблон</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.3px">${th(['ШАБЛОН','КОГДА','ТЕКСТ','ЯЗЫК','СТАТУС META','ОТПРАВЛЕНО · МЕСЯЦ'],[5])}
 <tbody>${[['Первый ответ лиду','новый лид · до ответа оператора','Здравствуйте, {имя}! Я Ару, помощник ЦБК. Помогу понять, подходит ли вам процедура…','рус · каз','одобрен',1146],['Запись на встречу','этап «Встреча назначена»','{имя}, встреча {дата} в {время}, офис {филиал}, {адрес}. Менеджер {менеджер}. Возьмите удостоверение.','рус · каз','одобрен',395],['Напоминание о встрече','за 2 часа','{имя}, напоминаем о встрече сегодня в {время}. Если не успеваете — ответьте, перенесём.','рус · каз','одобрен',380],['Ссылка на оплату','этап «Договор»','Договор {номер} подписан. Первый платёж {сумма} ₸: {ссылка}.','рус','одобрен',88],['Напоминание о платеже','за 2 дня до даты графика','{имя}, платёж {сумма} ₸ по графику — {дата}. Ссылка: {ссылка}. Нужна отсрочка — напишите.','рус · каз','одобрен',212],['Просрочка','день после даты','{имя}, платёж {сумма} ₸ от {дата} не поступил. Чтобы работа по процедуре продолжилась — {ссылка}.','рус','одобрен',31],['Запрос документа','задача юриста','{имя}, для этапа «{этап}» нужен документ: {документ}. Пришлите фото сюда.','рус · каз','одобрен',264],['Этап процедуры','смена этапа','{имя}, по вашей процедуре: {этап}. Следующий шаг — {следующий}, ориентировочно {дата}.','рус · каз','одобрен',310]].map(r=>`<tr>${td('<b>'+r[0]+'</b>')}${td(r[1],0,'color:var(--muted)')}${td('<span style="font-size:10.6px">'+esc(r[2])+'</span>')}${td(r[3])}${td(tag(r[4],'var(--ok)'))}${td(fmt(r[5]),1)}</tr>`).join('')}</tbody></table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Первым писать без блокировок</h3><p class="mini" style="margin:0">Через Business API первое сообщение — только одобренным шаблоном, зато без блокировок номера. Свободный текст — в течение 24 часов после ответа клиента. Так работает Meta, и платформа это соблюдает сама.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Два языка</h3><p class="mini" style="margin:0">Клиент ответил на казахском — ИИ и шаблоны переключаются на казахский. Язык хранится в карточке.</p></div>
</div>`;

SC.broadcast=()=>`<div class="hd"><div><h2>Рассылки · массовые и автоматические</h2>
 <p>Массовая — по сегменту, вручную, с темпом отправки. Автоматическая — по событию: платёж через 2 дня, встреча завтра, документ не прислан 3 дня, лид «думает» 7 дней. Всё через Business API, с отчётом о доставке и ответах.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Автоправило: событие → задержка → шаблон → условие остановки (ответил, оплатил, сменил этап). Настраивает администратор.')">+ Автоправило</button><button class="bt p" onclick="bcast()">+ Рассылка</button></div></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Автоматические · работают</h3>
  ${[['Напоминание о платеже за 2 дня','график платежей','212 · ответили 64 · оплатили в срок 81%'],['Просрочка · день после','счета','31 · оплатили после 19'],['Встреча завтра · напоминание','встречи','380 · пришли 85%'],['Документ не прислан 3 дня','процедуры','118 · прислали 92'],['Лид «думает» · 7 дней','воронка','146 · вернулись 23'],['Завершение процедуры · отзыв','процедуры','38 · отзывов 21']].map(([n,s,r])=>`<div class="kv"><span><b>${n}</b><div class="mini">по: ${s}</div></span><b class="mono" style="font-size:10.6px;text-align:right">${r}</b></div>`).join('')}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 9px">Массовые · сентябрь</h3>
   ${[['12.09','Сегмент «Отказ · долг меньше порога» · 214','Изменения в законе с октября: порог для внесудебного банкротства…','доставлено 206 · ответили 31 · встреч 6'],['05.09','Сегмент «Завершённые» · 190','Поздравляем с завершением. Напоминаем об ограничениях 5 лет…','доставлено 184 · ответили 12'],['02.09','Все «в процедуре» · Астана · 118','Офис Астаны переехал: новый адрес…','доставлено 118']].map(([d,seg,t,r])=>`<div class="srow"><b class="mono" style="width:44px;font-size:10.6px">${d}</b><div style="flex:1"><b>${esc(seg)}</b><div class="mini">${esc(t)}</div><div class="mini" style="color:var(--ok)">${r}</div></div></div>`).join('')}
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Ограничения — соблюдаются сами</h3><p class="mini" style="margin:0">Темп отправки под лимиты номера, только одобренные шаблоны, отписка по слову «стоп», не позже 21:00 по времени клиента. Персональные данные в рассылку не подставляются сверх необходимого.</p></div>
 </div>
</div>`;
/* ====== ИИ ====== */
SC.aibot=()=>`<div class="hd"><div><h2>ИИ-бот в WhatsApp · «Ару» · сегодня</h2>
 <p>Ваш пункт 4: ИИ-бот для WhatsApp. Ару — роль с правами: отвечает лидам первой, задаёт вопросы квалификации, записывает на встречу, напоминает, принимает документы. Деньги, скидки, юридические обещания — не трогает, передаёт человеку.</p></div>
 <div class="btns"><button class="bt" onclick="go('aiown')">Какой ИИ внутри</button><button class="bt p" onclick="toast('Правила бота: сценарий по этапам, база знаний ЦБК, запреты, когда звать человека, часы работы. Редактирует администратор, без нас.')">Правила</button></div></div>
<div class="wid" style="grid-template-columns:repeat(5,1fr)">
 <div><small>Диалогов сегодня</small><b class="a">61</b><span>47 новых лидов · 14 клиентов</span></div>
 <div><small>Первый ответ</small><b class="g">40 сек</b><span>круглосуточно</span></div>
 <div><small>Записала на встречу</small><b>11</b><span>без оператора</span></div>
 <div><small>Передала человеку</small><b class="w">5</b><span>рассрочка · жалоба · «живого»</span></div>
 <div><small>Стоимость</small><b>${seeMoney()?'≈ 1 900 ₸':'—'}</b><span>за день · внешняя модель; свой ИИ — 0</span></div>
</div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Диалоги</h3>
  ${[['11:52','Руслан Ахметов','Instagram · новый','5 вопросов, долг 2,1 млн, 2 кредита, просрочка 8 мес → подходит, оценка 79. Предложила встречу, ждёт ответа','violet'],['11:30','Ерлан Мусин','Сайт · квалификация','Долг 14,5 млн, ИП закрыт, долг по налогам → судебное. Вопрос про налоговую задолженность — вне базы знаний, передала Алине','warn'],['10:40','Нурлан Есимов','Instagram','Оценка 87, встреча на 23.09 14:00 в Астане записана, шаблон отправлен','violet'],['10:14','Айгерим Нурланова','в процедуре','Приняла выписку Kaspi, положила в документы, задача Сабине','violet'],['09:48','клиент · Астана','просрочка','«Можно платить по 50 000 вместо 100 000?» — рассрочку не решаю, передала Даулету с контекстом','warn'],['09:02','Гульнара Абдрахманова','Google Ads','Пенсионерка, 2,9 млн, пенсия 98 000 → подходит. Попросила «позвоните, писать неудобно» — оператору','acc'],['08:15','клиент · Алматы','жалоба','«Юрист не отвечает три дня» — жалоба, передала РОПу Айдару и юристу, извинилась без обещаний','bad']].map(([t,n,s,txt,c])=>`<div class="dl" style="--c:var(--${c})"><b class="mono" style="width:40px;font-size:10.6px">${t}</b><div style="flex:1;min-width:0"><b>${esc(n)}</b> <span class="mini">· ${esc(s)}</span><div class="mini">${esc(txt)}</div></div><button class="bt" onclick="go('wa')">Открыть</button></div>`).join('')}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Что делает сама</h3>
   ${['Отвечает первой лидам с рекламы и в WhatsApp','Задаёт вопросы квалификации: долг, кредиторы, просрочка, имущество, доход','Предлагает слоты и записывает на встречу','Напоминает о встрече, платеже, документе','Принимает документы и кладёт в папку клиента','Отвечает на типовое из базы знаний: сроки, что входит, ограничения после банкротства','Переключается на казахский'].map(t=>`<div class="li"><b style="color:var(--violet)">✦</b><span style="font-size:11.3px">${t}</span></div>`).join('')}
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Чего не делает</h3>
   ${['Не называет цену и не даёт скидок','Не обещает результат процедуры и сроки суда','Не решает рассрочку и отсрочку','Не меняет договор и не подтверждает оплату','Не пишет после 21:00 и не обсуждает чужих клиентов'].map(t=>`<div class="li"><b style="color:var(--bad)">×</b><span style="font-size:11.3px">${t}</span></div>`).join('')}
   <p class="mini" style="margin:8px 0 0">Каждое действие — в истории клиента с пометкой ✦ и текстом, на основании которого сделано.</p>
  </div>
 </div>
</div>`;

SC.aiqual=()=>{const c=C('К-10545');return `<div class="hd"><div><h2>ИИ-квалификация лидов и автозаполнение карточки</h2>
 <p>Ваш пункт 4: «AI-квалификация лидов» и «автоматическое заполнение данных клиента». Из диалога, звонка с расшифровкой или фото документа ИИ достаёт поля карточки и ставит оценку. Человек видит, откуда каждое значение, и подтверждает одной кнопкой.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Критерии квалификации: сумма долга относительно порога, просрочка, имущество, доход, ИП, суды. Веса задаёте вы; порог для встречи — 70.')">Критерии</button><button class="bt p" onclick="toast('Подтверждено: 6 полей записаны в карточку, источник каждого — в истории изменений.')">Подтвердить поля</button></div></div>
<div class="g2">
 <div class="pan" style="border-top:3px solid var(--violet)"><h3 style="margin:0 0 9px">${esc(c.n)} · Instagram · сегодня 09:20 → 10:05</h3>
  <table class="t" style="font-size:11.3px">${th(['ПОЛЕ','ЗНАЧЕНИЕ','ОТКУДА','УВЕРЕННОСТЬ'],[3])}
  <tbody>${[['Сумма долга','8 100 000 ₸','«восемь сто примерно» · WhatsApp 09:41',96],['Кредиторов','4 · Kaspi, Halyk, Jusan, Freedom','перечислил · WhatsApp 09:43',98],['Просрочка','11 месяцев','«с октября прошлого года» · WhatsApp 09:44',88],['Имущество','авто Toyota 2014 · в залоге','WhatsApp 09:47',92],['Доход','оклад 380 000 · официально','WhatsApp 09:50',90],['Город · филиал','Астана','код номера + «я в Астане»',99],['Вид процедуры','судебное · долг выше порога внесудебного','правило ЦБК',100],['ИИН','—','попросит при договоре',0]].map(r=>`<tr>${td('<b>'+r[0]+'</b>')}${td(r[1])}${td('<span style="font-size:10.4px;color:var(--muted)">'+esc(r[2])+'</span>')}${td(r[3]?barHtml(r[3],r[3]>85?'var(--ok)':'var(--warn)')+'<div class="mini" style="text-align:right">'+r[3]+'%</div>':'—',1)}</tr>`).join('')}</tbody></table>
  <div class="kv" style="border:0;margin-top:6px"><span><b>Оценка квалификации</b></span><b style="color:var(--violet);font-size:14px">87 · на встречу</b></div>
  <p class="mini" style="margin:4px 0 0">Почему 87: долг выше порога и есть залоговое авто — судебное, сложнее; доход официальный — платёжеспособен по договору; просрочка 11 месяцев — мотивирован.</p>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Откуда ещё заполняется</h3>
   <div class="li"><b style="color:var(--violet)">✦</b><div><b style="font-size:11.6px">Звонок оператора</b><div class="mini">расшифровка через телефонию → поля и краткий итог в карточку, оператор не печатает</div></div></div>
   <div class="li"><b style="color:var(--violet)">✦</b><div><b style="font-size:11.6px">Фото документа</b><div class="mini">удостоверение → ФИО, ИИН, дата; выписка банка → кредитор, сумма, просрочка; справка о доходах → доход</div></div></div>
   <div class="li"><b style="color:var(--violet)">✦</b><div><b style="font-size:11.6px">Лид-форма</b><div class="mini">поля формы Instagram и TikTok — напрямую по API, без ИИ</div></div></div>
   <div class="li" style="border:0"><b style="color:var(--violet)">✦</b><div><b style="font-size:11.6px">Итог встречи</b><div class="mini">менеджер надиктовал 30 секунд → итог, следующий шаг, задача</div></div></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Сегодня</h3>
   <div class="kv"><span>Квалифицировано ИИ</span><b>29 из 47</b></div>
   <div class="kv"><span>Оценка ≥ 70 · на встречу</span><b>18</b></div>
   <div class="kv"><span>Ниже порога · не подходит</span><b>6 · долг меньше 1 600 МРП и нет просрочки</b></div>
   <div class="kv" style="border:0"><span>Полей заполнено автоматически</span><b>163 · подтверждено 151</b></div>
  </div>
 </div>
</div>`};

SC.aihelper=()=>`<div class="hd"><div><h2>ИИ-помощник для сотрудников</h2>
 <p>Ваш пункт 4: «AI-помощник для сотрудников». Оператор, менеджер, юрист спрашивают в своём интерфейсе — ответ по данным клиента, базе знаний ЦБК и регламентам. В пределах прав роли: юрист не увидит через ИИ чужие деньги.</p></div>
 <div class="btns"><button class="bt" onclick="toast('База знаний: регламенты ЦБК, скрипты, закон о восстановлении платёжеспособности и банкротстве граждан, типовые ответы, шаблоны документов. Пополняет администратор.')">База знаний</button></div></div>
<div class="g2">
 <div class="pan" style="border-top:3px solid var(--violet)"><h3 style="margin:0 0 9px">Юрист Сабина · сегодня</h3>
  <div class="msg" style="background:var(--card2);margin-bottom:6px">Что осталось собрать по Айгерим Нурлановой для подачи через eGov?</div>
  <div class="msg" style="background:var(--violet-l);margin:0 0 6px auto">По ПБ-0412 для этапа «Подача через eGov» не хватает одного документа: справка об отсутствии имущества (запрошена через eGov 18.09, обычно 1–3 рабочих дня). Остальные 7 есть. Согласие на ПДн подписано 28.08. Заявление сформировано из карточки, версия от 19.09. Контрольная точка «справка о доходах» — 24.09, справка уже в папке, точку можно закрыть.</div>
  <div class="msg" style="background:var(--card2);margin-bottom:6px">Подготовь клиенту сообщение, что подаём на этой неделе</div>
  <div class="msg" style="background:var(--violet-l);margin:0 0 6px auto">Черновик (шаблон «Этап процедуры», казахский язык по карточке — нет, русский): «Айгерим, документы собраны, заявление о внесудебном банкротстве подадим через eGov до пятницы. Дальше — уведомление кредиторов, вы получите СМС от eGov. Вопросы — пишите сюда». Отправить от вашего имени?</div>
  <div style="display:flex;gap:6px"><button class="bt p" onclick="toast('Отправлено от имени Сабины через WhatsApp Business API. Запись в истории клиента.')">Отправить</button><button class="bt" onclick="toast('Черновик открыт для правки.')">Править</button></div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Что спрашивают</h3>
   ${[['Оператор','«Что уже спросила Ару у этого лида?» — краткий итог диалога и что осталось уточнить'],['Оператор','«Скрипт для клиента с ИП и налоговым долгом» — из базы знаний'],['Менеджер','«Собери итог встречи из моей диктовки» — итог, следующий шаг, задача'],['Менеджер','«Кто из моих клиентов не платил дольше 5 дней?» — список с суммами'],['Юрист','«Какие сроки по ПБ-0395 на этой неделе?» — контрольные точки'],['Юрист','«Сформируй заявление в суд по карточке» — черновик по шаблону'],['РОП','«Почему у Актобе упала конверсия во встречу?» — разбор по операторам и источникам'],['Финансист','«Какие платежи ожидаем на неделе по Астане?» — таблица']].map(([r,q])=>`<div class="kv"><span><b>${r}</b></span><span class="mini" style="text-align:right;max-width:70%">${q}</span></div>`).join('')}
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Границы</h3><p class="mini" style="margin:0">Ответы — по данным платформы и базе знаний, с ссылкой на источник. Чего нет в данных — так и скажет. Не отправляет клиентам ничего без подтверждения сотрудника. Права роли применяются к ИИ так же, как к человеку.</p></div>
 </div>
</div>`;

SC.aimanage=()=>`<div class="hd"><div><h2>Управление бизнесом через ИИ</h2>
 <p>Ваш пункт 4: «управление бизнесом через AI». Руководитель спрашивает обычным языком — ИИ строит запрос к данным, показывает таблицу и вывод, может создать задачу, правило или рассылку. Каждое действие подтверждается и попадает в журнал.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Еженедельный отчёт: ИИ собирает сводку по филиалам с выводами и отправляет руководителю в WhatsApp в понедельник 09:00. Текст и разрезы — ваши.')">Отчёт по расписанию</button></div></div>
<div class="g21">
 <div class="pan" style="border-top:3px solid var(--violet)">
  <div class="msg" style="background:var(--card2);margin-bottom:6px">Какой источник дал лучшие договоры в Астане за август? Считай по оплаченным.</div>
  <div class="msg" style="background:var(--violet-l);margin:0 0 6px auto">Астана, август, оплаченные договоры:
   <table class="t" style="font-size:10.8px;margin-top:6px">${th(['ИСТОЧНИК','ЛИДЫ','ДОГОВОРЫ','ОПЛАЧЕНО','CPL ДО ОПЛАТЫ'],'all')}<tbody>${[['Instagram',148,15,'4 200 000','36 700'],['Google Ads',71,11,'3 300 000','41 800'],['Рекомендация',22,8,'2 240 000','0'],['TikTok',102,7,'1 960 000','38 900']].map(r=>`<tr>${td(r[0])}${td(r[1],1)}${td(r[2],1)}${td(seeMoney()?r[3]:'·',1)}${td(seeMoney()?r[4]:'·',1)}</tr>`).join('')}</tbody></table>
   <div style="margin-top:6px">Лучший по деньгам — Instagram, по стоимости договора — рекомендации, затем Instagram. Google дороже на 14%, но средний чек выше: судебные процедуры. Запрос: <span class="mono" style="font-size:10px">contracts · branch=Астана · paid_at in Aug · group by source</span></div></div>
  <div class="msg" style="background:var(--card2);margin-bottom:6px">Поставь РОПу Астаны задачу разобрать TikTok до пятницы и пришли мне такой отчёт каждый понедельник</div>
  <div class="msg" style="background:var(--violet-l);margin:0 0 6px auto">Готово к подтверждению: задача «Разобрать TikTok: 102 лида → 7 договоров» → РОП Астаны, срок пятница 26.09. Отчёт «Источники по филиалам, оплаченные договоры» — каждый понедельник 09:00 вам в WhatsApp. Подтвердить оба?</div>
  <div style="display:flex;gap:6px"><button class="bt p" onclick="toast('Подтверждено. Задача создана, отчёт по расписанию включён. Оба действия — в журнале с вашим именем.')">Подтвердить</button><button class="bt" onclick="toast('Отменено.')">Отмена</button></div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Что умеет</h3>
   ${['Ответить на вопрос по любым данным платформы: воронка, деньги, процедуры, люди, филиалы','Показать таблицу и график, выгрузить в Excel','Создать задачу, правило распределения, автосообщение, сегмент, рассылку — с подтверждением','Собрать отчёт по расписанию и прислать в WhatsApp','Объяснить отклонение: «почему упала конверсия» — по данным, не по догадке'].map(t=>`<div class="li"><b style="color:var(--violet)">✦</b><span style="font-size:11.3px">${t}</span></div>`).join('')}
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Как это безопасно</h3><p class="mini" style="margin:0">ИИ не пишет в базу напрямую: он вызывает те же функции API, что и интерфейс, с правами того, кто спрашивает. Любое изменение — через подтверждение и в журнал. Персональные данные клиентов во внешнюю модель не уходят, если модель ваша; для внешней — маскируются.</p></div>
 </div>
</div>`;

SC.aiown=()=>`<div class="hd"><div><h2>Свой ИИ · подключение вашей модели</h2>
 <p>Ваш пункт 4, первый подпункт: «возможность интеграции нашего собственного AI». Платформа говорит с ИИ через один адаптер в стандартном формате. Сегодня это может быть внешняя модель, завтра — ваша на вашем сервере. Сценарии, база знаний и правила не меняются.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Переключение модели: адрес вашего сервера, ключ, название модели — проверка на тестовом диалоге — включить. Пять минут, без остановки работы.')">Подключить свою модель</button></div></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Адаптер ИИ · как устроен</h3>
  <div class="num"><i>1</i><div><b>Один формат запросов</b><p>Совместимый с OpenAI API (chat completions, tools, embeddings). Его поддерживают ваши будущие модели через vLLM или Ollama, а также внешние: Claude, GPT, Gemini, российские и казахстанские. Смена — настройка, не код.</p></div></div>
  <div class="num"><i>2</i><div><b>Роли ИИ — отдельно от модели</b><p>Бот в WhatsApp, квалификация, помощник, управление — это сценарии, база знаний, инструменты и правила. Они в платформе. Модель только «думает».</p></div></div>
  <div class="num"><i>3</i><div><b>Несколько моделей одновременно</b><p>Дешёвая — для распознавания документов, сильная — для диалогов, ваша — для всего, где есть персональные данные. Маршрутизация по задаче.</p></div></div>
  <div class="num"><i>4</i><div><b>Оценка качества</b><p>Журнал диалогов и решений ИИ, разметка «правильно / нет» сотрудниками, сравнение моделей на одних и тех же диалогах перед переключением.</p></div></div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Сейчас подключено</h3>
   <div class="kv"><span>Диалоги и квалификация</span><b>внешняя модель · маскирование ПДн</b></div>
   <div class="kv"><span>Распознавание документов</span><b>внешняя модель · только фото документа</b></div>
   <div class="kv"><span>Помощник и управление</span><b>внешняя модель · данные по правам роли</b></div>
   <div class="kv" style="border:0"><span>Ваша модель</span><b style="color:var(--violet)">слот готов · адрес и ключ</b></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Что нужно вашей модели</h3>
   <div class="kv"><span>Сервер</span><b>GPU 24 ГБ · для модели 7–14 млрд параметров</b></div>
   <div class="kv"><span>Интерфейс</span><b>vLLM или Ollama · OpenAI-совместимый</b></div>
   <div class="kv"><span>Дообучение</span><b>на ваших диалогах · по желанию, отдельно</b></div>
   <div class="kv" style="border:0"><span>Стоимость</span><b>${seeMoney()?'0 за запросы · электричество и сервер':'—'}</b></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Честно</h3><p class="mini" style="margin:0">Своя модель на 7–14 млрд параметров отвечает хуже сильных внешних в сложных диалогах, но отлично справляется с квалификацией, документами и помощником, и данные не покидают сервер. Мы рекомендуем начать с внешней модели с маскированием, а свою подключить, когда она у вас будет, — платформа к этому готова с первого дня.</p></div>
 </div>
</div>`;
/* ====== ФИНАНСЫ ====== */
SC.contracts=()=>{const list=role==='Менеджер · Астана'?CT.filter(c=>C(c.cl).br==='Астана'):curBr==='all'?CT:CT.filter(c=>C(c.cl).br===curBr);return `<div class="hd"><div><h2>Договоры</h2>
 <p>Ваш пункт 5: договоры, счета, платежи, графики, просрочки, дебиторка, связь платежа с клиентом и договором. Договор формируется из карточки по шаблону, подписывается ЭЦП или сканом, из него — график и счета.</p></div>
 <div class="btns">${brSel()}<button class="bt" onclick="toast('Шаблоны договоров: внесудебное, судебное, восстановление платёжеспособности. Поля подставляются из карточки; правки шаблона — администратор.')">Шаблоны</button><button class="bt p" onclick="ctAdd()">+ Договор</button></div></div>
<div class="wid" style="grid-template-columns:repeat(5,1fr)">
 <div><small>Действующих</small><b class="a">247</b><span>${curBr==='all'?'три филиала':curBr}</span></div>
 <div><small>Подписано в сентябре</small><b>88</b><span>${money('28,3 млн')} · средний ${money('322 000')}</span></div>
 <div><small>ЭЦП · скан</small><b>71 · 17</b><span>ЭЦП с телефона</span></div>
 <div><small>С просрочкой</small><b class="r">19</b><span>${money('4,13 млн')}</span></div>
 <div><small>Закрыто · выполнено</small><b class="g">38</b><span>сентябрь</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11.3px">${th(['ДОГОВОР','КЛИЕНТ','ФИЛИАЛ','ВИД','ПОДПИСАН','СУММА','ПЛАТЕЖЕЙ','ОПЛАЧЕНО','СЛЕДУЮЩИЙ','СТАТУС'],[5,6,7])}
 <tbody>${list.map(c=>{const cl=C(c.cl);return `<tr style="cursor:pointer" onclick="curCl='${c.cl}';go('schedule')">${td('<b>'+c.id+'</b>')}${td(esc(cl.n))}${td(cl.br)}${td(KIND[c.kind])}${td(c.signed)}${td(money(tg(c.sum)),1,'font-weight:700')}${td(c.n,1)}${td(money(tg(c.paid)),1,'color:'+(c.late?'var(--bad)':'inherit'))}${td('<span style="font-size:10.6px">'+c.next+'</span>')}${td(tag(CTS[c.st][0],CTS[c.st][1]))}</tr>`}).join('')}
 <tr><td colspan="10" style="padding:8px;color:var(--muted)">+ ещё 241 договор</td></tr></tbody></table></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Из карточки — в договор</h3><p class="mini" style="margin:0">ФИО, ИИН, адрес, телефон, вид процедуры, сумма и график — из карточки. Менеджер выбирает шаблон и рассрочку, договор готов. Подпись — ЭЦП по ссылке в WhatsApp или скан.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Договор → график → счета</h3><p class="mini" style="margin:0">Рассрочка 4 платежа — четыре счёта с датами. Каждый платёж привязан к счёту, договору и клиенту: ничего не «висит» без адреса.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Правило для юристов</h3><p class="mini" style="margin:0">Просрочка 14 дней — работа по процедуре приостанавливается, юрист и клиент уведомлены. Отсрочку даёт менеджер или РОП — с записью в истории.</p></div>
</div>`};

SC.invoices=()=>`<div class="hd"><div><h2>Счета и платежи</h2>
 <p>Счёт выставляется из графика, оплата приходит по вебхуку (Kaspi, банк) или вносится финансистом с чеком. Платёж сам находит счёт, договор и клиента — по назначению или по ссылке.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Сверка с выпиской банка: файл или API → платежи сопоставлены с счетами, несовпадения — списком финансисту.')">Сверка с банком</button><button class="bt p" onclick="payAdd()">+ Платёж</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Ожидается на неделе</small><b class="a">${money('4 210 000 ₸')}</b><span>48 счетов</span></div>
 <div><small>Поступило сегодня</small><b class="g">${money('640 000 ₸')}</b><span>7 платежей · 5 автоматически</span></div>
 <div><small>Просрочено</small><b class="r">${money('4 130 000 ₸')}</b><span>19 счетов</span></div>
 <div><small>Способы</small><b>Kaspi 61% · перевод 27%</b><span>касса 12%</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11.3px">${th(['СЧЁТ','КЛИЕНТ','ДОГОВОР','СУММА','СРОК','СТАТУС','ОПЛАТА · СПОСОБ · ДАТА'],[3])}
 <tbody>${INV.map(i=>{const cl=C(i.cl);return `<tr style="cursor:pointer" onclick="curCl='${i.cl}';go('client')">${td('<b>'+i.id+'</b>')}${td(esc(cl.n)+' <span class="mini">· '+cl.br+'</span>')}${td(i.ct)}${td(money(tg(i.sum)),1,'font-weight:700')}${td(i.due,0,'color:'+(i.st==='late'?'var(--bad)':'inherit'))}${td(tag(IVS[i.st][0],IVS[i.st][1]))}${td(i.way==='—'?(i.st==='late'?'<button class="bt" style="padding:3px 8px;font-size:10px" onclick="event.stopPropagation();toast(\'Напоминание отправлено, менеджеру — задача «позвонить».\')">напомнить</button>':'—'):i.way)}</tr>`}).join('')}</tbody></table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Связь платежа с договором</h3><p class="mini" style="margin:0">Ссылка на оплату содержит номер счёта — платёж по ссылке привязывается сам. Перевод без назначения — финансист привязывает вручную из списка «непривязанные», их 0 на сегодня.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Что видит клиент</h3><p class="mini" style="margin:0">В WhatsApp: сколько оплачено, следующий платёж, ссылка. Спор «я платил» решается за минуту — по истории.</p></div>
</div>`;

SC.schedule=()=>{const c=C(curCl);const ct=CT.find(x=>x.cl===c.id)||CT[0];const rows=ct.id==='ДГ-2291'?SCHED:Array.from({length:ct.n},(_,i)=>[String(12+i*30>30?12:12).padStart(2,'0')+'.'+String(9+Math.floor(i)).padStart(2,'0'),Math.round(ct.sum/ct.n),i<Math.round(ct.paid/ct.sum*ct.n)?'paid':(ct.st==='late'&&i===Math.round(ct.paid/ct.sum*ct.n)?'late':'wait'),i<Math.round(ct.paid/ct.sum*ct.n)?'Kaspi Pay':'']);return `<div class="hd"><div><h2>График платежей · ${esc(c.n)} · ${ct.id}</h2>
 <p>График строится из договора: сумма, число платежей, даты. Напоминание уходит за два дня, просрочка отмечается на следующий день, отсрочка пересобирает график с записью в истории.</p></div>
 <div class="btns">${clSel()}<button class="bt" onclick="toast('Отсрочка: новая дата или разбивка платежа. График пересобран, клиенту — сообщение, в истории — кто и почему.')">Отсрочка</button><button class="bt p" onclick="toast('Ссылка на оплату следующего платежа отправлена клиенту в WhatsApp.')">Отправить ссылку</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Договор</small><b class="a">${money(tg(ct.sum))}</b><span>${ct.n} ${plural(ct.n,['платёж','платежа','платежей'])} · ${KIND[ct.kind]}</span></div>
 <div><small>Оплачено</small><b class="g">${money(tg(ct.paid))}</b><span>${pct(ct.paid,ct.sum)}%</span></div>
 <div><small>Осталось</small><b>${money(tg(ct.sum-ct.paid))}</b><span>${ct.next}</span></div>
 <div><small>Просрочка</small><b class="${ct.late?'r':'g'}">${ct.late?money(tg(ct.late)):'нет'}</b><span>${ct.late?'12 дней · напомнили 2 раза':'платит в срок'}</span></div>
</div>
<div class="g21">
 <div class="pan"><table class="t" style="font-size:11.4px">${th(['№','ДАТА','СУММА','СТАТУС','ОПЛАТА','НАПОМИНАНИЕ'],[2])}
  <tbody>${rows.map((r,i)=>`<tr>${td(i+1)}${td(r[0])}${td(money(tg(r[1])),1,'font-weight:700')}${td(tag(IVS[r[2]][0],IVS[r[2]][1]))}${td(r[3]||'—')}${td(r[2]==='paid'?'за 2 дня · ответил':r[2]==='late'?'2 раза · без ответа':'за 2 дня')}</tr>`).join('')}</tbody></table>
  ${ct.late?'<div class="note" style="--tone:var(--bad)"><p class="mini" style="margin:0"><b>Правило 14 дней.</b> Через 2 дня работа юриста по процедуре приостановится автоматически, клиент и юрист получат уведомление. Решение менеджера: звонок или отсрочка.</p></div>':''}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Варианты рассрочки</h3>
   <div class="kv"><span>Внесудебное · 280 000</span><b>1 · 2 · 4 платежа</b></div>
   <div class="kv"><span>Судебное · 600 000</span><b>2 · 4 · 6 платежей</b></div>
   <div class="kv" style="border:0"><span>Восстановление · 450 000</span><b>2 · 4 платежа</b></div>
   <p class="mini" style="margin:8px 0 0">Варианты — ваши, задаются в шаблоне договора. Менеджер выбирает при подписании.</p>
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Автоматика</h3><p class="mini" style="margin:0">Напоминание за 2 дня — ИИ; просрочка на следующий день — сообщение и задача менеджеру; 14 дней — пауза процедуры; оплата — снятие всех сигналов и следующий шаг юристу.</p></div>
 </div>
</div>`};

SC.debts=()=>`<div class="hd"><div><h2>Просрочки и дебиторская задолженность</h2>
 <p>Дебиторка по филиалам, менеджерам и срокам: до 7 дней, до 30, старше. Кто и что делал по каждой — видно. Ваш пункт 5: «задолженность и просрочки», «дебиторская задолженность».</p></div>
 <div class="btns">${brSel()}<button class="bt" onclick="toast('Напоминания отправлены по 19 просроченным счетам, менеджерам — задачи со сроком «сегодня».')">Напомнить всем</button><button class="bt p" onclick="toast('Отчёт по дебиторке в Excel: по филиалам, менеджерам, срокам, с историей напоминаний.')">В Excel</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Дебиторка всего</small><b class="r">${money('4 130 000 ₸')}</b><span>19 договоров</span></div>
 <div><small>До 7 дней</small><b class="w">${money('1 240 000 ₸')}</b><span>8 · обычно платят</span></div>
 <div><small>8–30 дней</small><b class="r">${money('1 890 000 ₸')}</b><span>7 · звонок менеджера</span></div>
 <div><small>Старше 30</small><b class="r">${money('1 000 000 ₸')}</b><span>4 · процедуры на паузе</span></div>
</div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">По филиалам и менеджерам</h3>
  <table class="t" style="font-size:11.3px">${th(['ФИЛИАЛ · МЕНЕДЖЕР','ДОГОВОРОВ','ДЕБИТОРКА','СТАРШЕ 30','ДОЛЯ ОТ ВЫРУЧКИ','ДИНАМИКА'],'all')}
  <tbody>${[['Астана · Даулет',9,1950000,600000,'26%','+8%'],['Алматы · Асель К.',5,920000,200000,'10%','−3%'],['Алматы · новый менеджер',2,500000,0,'—','—'],['Актобе · Ботагоз',3,760000,200000,'20%','+2%']].map(r=>`<tr>${td('<b>'+r[0]+'</b>')}${td(r[1],1)}${td(money(tg(r[2])),1,'font-weight:700')}${td(money(tg(r[3])),1,'color:'+(r[3]?'var(--bad)':'var(--muted2)'))}${td(r[4],1)}${td(r[5],1,'color:'+(r[5].startsWith('+')?'var(--bad)':'var(--ok)'))}</tr>`).join('')}</tbody></table>
  <div class="hint"><b>Астана: 26% от выручки в дебиторке.</b> Из девяти договоров шесть — судебные с рассрочкой на 6 платежей. Либо рассрочка длиннее, чем клиенты выдерживают, либо не хватает напоминаний голосом. Решение: короче рассрочка на судебные или звонок менеджера на третий день.</div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Просроченные · сейчас</h3>
   ${[['Жанна Ким · Астана',100000,12,'напомнили 2 · без ответа'],['клиент · Астана',100000,34,'процедура на паузе'],['клиент · Актобе',112500,9,'обещал 22.09'],['клиент · Алматы',70000,5,'напомнили 1']].map(([n,s,d,st])=>`<div class="kv"><span><b>${n}</b><div class="mini">${st}</div></span><b class="mono" style="text-align:right;color:${d>30?'var(--bad)':d>7?'var(--warn)':'inherit'}">${money(tg(s))}<div class="mini">${d} дн</div></b></div>`).join('')}
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Что делает платформа сама</h3><p class="mini" style="margin:0">Напоминание, задача менеджеру, пауза процедуры на 14-й день, эскалация РОПу на 30-й. Человек решает: звонить, дать отсрочку или расторгнуть.</p></div>
 </div>
</div>`;

/* ====== ПРОЦЕДУРЫ ====== */
SC.procs=()=>{const list=role==='Юрист'?PR.filter(p=>p.law==='Сабина'):curBr==='all'?PR:PR.filter(p=>p.br===curBr);return `<div class="hd"><div><h2>Процедуры банкротства</h2>
 <p>Ваш пункт 6: отдельная сущность «Процедура» — этапы, ответственные, документы, сроки и контрольные точки, история действий. Три вида: внесудебное, судебное, восстановление платёжеспособности — у каждого свои этапы и свои сроки.</p></div>
 <div class="btns">${brSel()}<button class="bt" onclick="toast('Этапы процедуры по видам, контрольные точки и сроки по умолчанию, документы на каждом этапе — настраивает администратор или старший юрист.')">Настроить этапы</button><button class="bt p" onclick="go('deadlines')">Контрольные точки</button></div></div>
<div class="wid" style="grid-template-columns:repeat(5,1fr)">
 <div><small>В работе</small><b class="a">184</b><span>внесудебных 121 · судебных 51 · восстановление 12</span></div>
 <div><small>На юриста</small><b>23 в среднем</b><span>лимит 30</span></div>
 <div><small>Контрольных точек на неделе</small><b class="w">31</b><span>1 просрочена</span></div>
 <div><small>Завершено в сентябре</small><b class="g">38</b><span>освобождено от долгов 36</span></div>
 <div><small>Средний срок</small><b>6,8 мес</b><span>внесудебное · 11,4 судебное</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11.3px">${th(['ПРОЦЕДУРА','КЛИЕНТ','ВИД','ЭТАП','ЮРИСТ','НАЧАТА','СЛЕДУЮЩАЯ ТОЧКА','ДОКУМЕНТЫ','ОКОНЧАНИЕ'],[7])}
 <tbody>${list.map(p=>{const cl=C(p.cl),s=PSTAGES(p.kind);return `<tr style="cursor:pointer" onclick="curCl='${p.cl}';go('proc')">${td('<b>'+p.id+'</b>')}${td(esc(cl.n)+' <span class="mini">· '+p.br+'</span>')}${td(KIND[p.kind])}${td('<div style="width:130px">'+barHtml((p.stage+1)/s.length*100,p.ok?'var(--brand)':'var(--bad)')+'<div class="mini">'+(p.stage+1)+' из '+s.length+' · '+esc(s[p.stage])+'</div></div>')}${td(esc(p.law))}${td(p.start)}${td('<span style="color:'+(p.ok?'inherit':'var(--bad)')+'">'+esc(p.next)+'</span>')}${td(p.docs,1)}${td(p.end)}</tr>`}).join('')}
 <tr><td colspan="9" style="padding:8px;color:var(--muted)">+ ещё 178 процедур</td></tr></tbody></table></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Этапы по видам</h3><p class="mini" style="margin:0"><b>Внесудебное:</b> ${PST_OUT.join(' → ')}. <b>Судебное:</b> ${PST_COURT.slice(0,5).join(' → ')} → … <b>Восстановление:</b> ${PST_REST.slice(0,3).join(' → ')} → …</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Назначение юриста</h3><p class="mini" style="margin:0">По филиалу, виду и нагрузке: не больше 30 процедур на юриста. Судебные — только юристам с допуском. Перевод между юристами — с историей.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Клиент видит</h3><p class="mini" style="margin:0">В WhatsApp — этап, следующий шаг, ориентировочная дата, какой документ нужен. Меньше звонков «а что там у меня?».</p></div>
</div>`};

SC.proc=()=>{const c=C(curCl);const p=PR.find(x=>x.cl===c.id)||PR[0];const s=PSTAGES(p.kind);return `<div class="hd"><div><h2>${p.id} · ${esc(C(p.cl).n)} · ${KIND[p.kind]}</h2>
 <p>Карточка процедуры: этапы с датами, ответственный юрист, документы по этапам, контрольные точки, история действий. Всё, что происходит, — с датой и именем.</p></div>
 <div class="btns">${clSel()}<button class="bt" onclick="go('docs')">Документы</button><button class="bt p" onclick="toast('Этап переведён: «${esc(s[Math.min(p.stage+1,s.length-1)])}». Клиенту ушло сообщение по шаблону, контрольные точки следующего этапа созданы, в истории — запись.')">Следующий этап</button></div></div>
<div class="wid" style="grid-template-columns:repeat(5,1fr)">
 <div><small>Этап</small><b class="a" style="font-size:15px">${p.stage+1} из ${s.length}</b><span>${esc(s[p.stage])}</span></div>
 <div><small>Юрист</small><b>${esc(p.law)}</b><span>${p.br} · с ${p.start}</span></div>
 <div><small>Следующая точка</small><b class="${p.ok?'':'r'}" style="font-size:13px">${esc(p.next.split(' · ')[1]||p.next)}</b><span>${esc(p.next.split(' · ')[0])}</span></div>
 <div><small>Документы</small><b>${p.docs}</b><span>${p.id==='ПБ-0412'?'1 ожидается':'по чек-листу'}</span></div>
 <div><small>Окончание</small><b>${p.end}</b><span>ориентировочно</span></div>
</div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Этапы</h3>
  <div class="tl">${s.map((n,i)=>{const done=i<p.stage,now=i===p.stage;return `<div class="tli ${done?'ok':now?'on':''}"><b style="font-size:11.6px">${i+1}. ${esc(n)}${now?' · сейчас':''}</b><p class="mini" style="margin:2px 0 0">${done?'завершён · '+['02.09','06.09','12.09','15.09','18.09','20.09'][i%6]+' · '+esc(p.law):now?'контрольные точки: '+esc(p.next)+(p.id==='ПБ-0412'?' · справка об отсутствии имущества ожидается':''):'срок по умолчанию: '+[7,10,5,14,30,180,10,5,10][i%9]+' дней'}</p></div>`}).join('')}</div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">История действий</h3>
   ${[['сегодня 10:14','Ару · ИИ','выписка Kaspi принята, задача юристу'],['вчера 15:31','Сабина','кредиторы: добавлен Freedom'],['19.09','Сабина','заявление сформировано из карточки, v2'],['18.09','Сабина','запрос справки об отсутствии имущества · eGov'],['15.09','система','этап → «Уведомление кредиторов», клиенту сообщение'],['02.09','система','юрист назначен: Сабина · нагрузка 30'],['02.09','Асель К.','процедура создана после оплаты']].map(([t,w,x])=>`<div class="kv" style="font-size:11px"><span><b>${w}</b><div class="mini">${esc(x)}</div></span><span class="mono mini" style="white-space:nowrap">${t}</span></div>`).join('')}
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Контрольные точки этапа</h3>
   <div class="kv"><span>Справка о доходах</span><b style="color:var(--ok)">получена · закрыть</b></div>
   <div class="kv"><span>Справка об отсутствии имущества</span><b style="color:var(--warn)">ожидается · 24.09</b></div>
   <div class="kv" style="border:0"><span>Подача через eGov</span><b>до 26.09</b></div>
  </div>
 </div>
</div>`};

SC.deadlines=()=>`<div class="hd"><div><h2>Сроки и контрольные точки · неделя 22–28 сентября</h2>
 <p>Все точки всех процедур одним списком: суды, подачи, справки, ответы кредиторов. Просроченная поднимается юристу, старшему юристу и в «что требует решения». Срок ставится системой по этапу, юрист может уточнить.</p></div>
 <div class="btns">${brSel()}<button class="bt" onclick="toast('Календарь юриста: точки, заседания, встречи с клиентами — экспорт в Google Calendar и Outlook.')">В календарь</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Точек на неделе</small><b class="a">31</b><span>по ${curBr==='all'?'трём филиалам':curBr}</span></div>
 <div><small>Судебных заседаний</small><b>6</b><span>Астана 3 · Актобе 2 · Алматы 1</span></div>
 <div><small>Просрочено</small><b class="r">1</b><span>ПБ-0395 · опись имущества</span></div>
 <div><small>Под угрозой</small><b class="w">3</b><span>ждут документов от клиента</span></div>
</div>
<div class="pan">${[['22.09','ПБ-0395','Жанна Ким','опись имущества в суд','Ерасыл','bad','нет ответа клиента по авто'],['23.09','ПБ-0523','Динара Оспанова','подача через eGov','Ерасыл','ok','документы готовы'],['24.09','ПБ-0412','Айгерим Нурланова','справка о доходах · закрыть','Сабина','ok','получена'],['25.09 10:00','ПБ-0361','клиент · Актобе','заседание суда · принятие заявления','Мейрам','acc','явка клиента подтверждена'],['26.09','ПБ-0488','Бауыржан Сейтказы','выписки по 5 кредитам','Ерасыл','warn','получено 3 из 5'],['26.09','ПБ-0412','Айгерим Нурланова','подача через eGov','Сабина','warn','ждёт справку об имуществе'],['27.09','ПБ-0402','клиент · Алматы','ответ кредиторов · 30 дней','Сабина','ok','—']].map(([d,id,n,what,law,c,st])=>`<div class="dl" style="--c:var(--${c})"><b class="mono" style="width:80px;font-size:10.6px">${d}</b><b class="mono" style="width:64px;font-size:10.6px">${id}</b><div style="flex:1;min-width:0"><b>${esc(what)}</b><div class="mini">${esc(n)} · юрист ${esc(law)} · ${esc(st)}</div></div>${c==='bad'?tag('просрочено','var(--bad)'):c==='warn'?tag('под угрозой','var(--warn)'):tag('в срок','var(--ok)')}<button class="bt" onclick="curCl='${id==='ПБ-0412'?'К-10412':id==='ПБ-0395'?'К-10395':id==='ПБ-0488'?'К-10488':'К-10523'}';go('proc')">Открыть</button></div>`).join('')}</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Откуда сроки</h3><p class="mini" style="margin:0">У каждого этапа — срок по умолчанию (например, ответ кредиторов 30 дней, процедура внесудебного — 6 месяцев). Судебные даты — из определения суда, вносит юрист. Всё считается от даты перехода на этап.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Эскалация</h3><p class="mini" style="margin:0">За 5 дней — юристу, за 2 — старшему юристу, в день — руководителю. Просрочка — в отчёт эффективности юриста, но с причиной: «ждали клиента» и «забыли» — разные вещи.</p></div>
</div>`;

SC.docs=()=>{const c=C(curCl);return `<div class="hd"><div><h2>Документы · ${esc(c.n)}</h2>
 <p>Чек-лист документов по этапу процедуры: что есть, что ожидается, кто прислал. Клиент присылает фото в WhatsApp — ИИ распознаёт вид документа и кладёт в нужную папку. Хранение на вашем сервере, доступ по правам.</p></div>
 <div class="btns">${clSel()}<button class="bt" onclick="toast('Запрос клиенту в WhatsApp по шаблону: «нужен документ: справка об отсутствии имущества».')">Запросить</button><button class="bt p" onclick="toast('Заявление о внесудебном банкротстве сформировано из карточки по шаблону, версия 3. PDF в папке, на подпись клиенту ЭЦП.')">Сформировать заявление</button></div></div>
<div class="g21">
 <div class="pan">${DOCL.map(([n,t,s])=>`<div class="dl" style="--c:${s==='ok'?'var(--ok)':'var(--warn)'};padding:9px 12px"><div style="flex:1"><b style="font-size:11.6px">${esc(n)}</b><div class="mini">${esc(t)}</div></div>${s==='ok'?tag('есть','var(--ok)'):tag('ожидается · 24.09','var(--warn)')}<button class="bt" style="padding:4px 9px;font-size:10.4px" onclick="toast('Файл открыт. Просмотр в браузере, скачивание — по правам роли, действие — в журнале.')">открыть</button></div>`).join('')}</div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Шаблоны документов</h3>
   ${['Договор · 3 вида','Заявление о внесудебном банкротстве','Заявление в суд о применении процедуры','Опись имущества','Список кредиторов','Согласие на обработку ПДн','Акт выполненных работ'].map(t=>`<div class="kv" style="font-size:11px"><span>${t}</span><b class="mini">из карточки</b></div>`).join('')}
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Хранение</h3><p class="mini" style="margin:0">Файлы — в хранилище на вашем сервере (MinIO, совместимо с S3), не в базе. Ссылки временные, скачивание — только по правам, каждое открытие — в журнале. Ваш пункт 10: защита персональных данных.</p></div>
 </div>
</div>`};
/* ====== ФИЛИАЛЫ ====== */
SC.branches=()=>`<div class="hd"><div><h2>Филиалы · Алматы · Астана · Актобе · и дальше</h2>
 <p>Ваш пункт 7. Филиал — это данные, люди, номера WhatsApp, воронка и деньги в одном контуре. Новый город добавляется кнопкой: филиал, РОП, номер, правило распределения лидов по городу — и он появляется в сводке и аналитике.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Новый филиал: город, адрес, РОП, номер WhatsApp, часы работы, кто из юристов ведёт. Лиды по коду номера и городу из формы пойдут в него сразу.')">+ Филиал</button></div></div>
<div class="g3">
 ${[['Алматы','ул. Байзакова, офис 402','Айдар · РОП',486,142,41,8960000,1420000,'+7 727 3•• •• ••',9,'ok'],['Астана','пр. Мангилик Ел, офис 12','Даулет · и. о. РОП',392,118,29,7420000,1950000,'+7 717 2•• •• ••',7,'warn'],['Актобе','пр. Абилкайыр хана, 85','Ботагоз · РОП',268,74,18,3860000,760000,'+7 713 2•• •• ••',5,'ok']].map(b=>`<div class="pan" style="border-top:3px solid var(--${b[10]==='ok'?'brand':'warn'});cursor:pointer" onclick="curBr='${b[0]}';go('dash')"><h3 style="margin:0 0 2px">${b[0]}</h3><p class="mini" style="margin:0 0 8px">${b[1]} · ${b[2]} · ${b[8]}</p>
  <div class="kv"><span>Лидов · сентябрь</span><b>${b[3]}</b></div>
  <div class="kv"><span>Встреч · договоров</span><b>${b[4]} · ${b[5]}</b></div>
  <div class="kv"><span>Выручка</span><b>${money(mln(b[6]))}</b></div>
  <div class="kv"><span>Дебиторка</span><b style="color:${b[7]>1500000?'var(--bad)':'inherit'}">${money(mln(b[7]))}</b></div>
  <div class="kv" style="border:0"><span>Сотрудников</span><b>${b[9]}</b></div></div>`).join('')}
</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 8px">Разграничение данных</h3>
  <div class="chk"><i>✓</i><span><b>Сотрудник филиала видит только свой филиал:</b> клиентов, лиды, диалоги, деньги. Это правило платформы, не настройка каждого экрана</span></div>
  <div class="chk"><i>✓</i><span><b>Юрист может вести процедуры двух филиалов</b> — доступ по списку филиалов у сотрудника</span></div>
  <div class="chk"><i>✓</i><span><b>Клиент переехал</b> — перевод в другой филиал с историей, старый филиал теряет доступ</span></div>
  <div class="chk"><i>✓</i><span><b>Руководитель и финансист</b> — все филиалы; РОП — свой; ИИ — по правам того, кому отвечает</span></div>
 </div>
 <div class="pan"><h3 style="margin:0 0 8px">Масштабирование</h3>
  <div class="chk"><i>✓</i><span><b>Шымкент, Караганда, Атырау</b> — тот же экран «+ Филиал», без разработки</span></div>
  <div class="chk"><i>✓</i><span><b>Франшиза или партнёр</b> — филиал с ограниченными правами: видит своё, платит по отчёту платформы</span></div>
  <div class="chk"><i>✓</i><span><b>Колл-центр на все города</b> — операторы без филиала, распределение по городу лида</span></div>
  <div class="chk"><i>✓</i><span><b>Нагрузка</b> — один сервер держит десятки филиалов и сотни сотрудников; рост — добавление ресурсов, не переделка</span></div>
 </div>
</div>`;

SC.roles=()=>`<div class="hd"><div><h2>Роли и права доступа</h2>
 <p>Ваш пункт 7: операторы, менеджеры, юристы, РОПы, руководители. Роль — набор прав на разделы, действия и данные; филиал — граница данных. Роли редактирует администратор; новая роль — кнопкой.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Новая роль: например «Старший юрист» — все процедуры филиала, настройка этапов, без денег продаж. Или «Партнёр» для франшизы.')">+ Роль</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)"><th style="text-align:left;padding:8px;font-size:10px;color:var(--muted)">ЧТО ВИДНО · ДЕЛАЕТ</th>${Object.keys(ROLES).map(r=>`<th style="text-align:center;padding:8px;font-size:9px;color:var(--muted)">${esc(r.toUpperCase())}</th>`).join('')}</tr></thead>
 <tbody>${[['Сводка по всем филиалам',[1,0,0,0,0,1,0,0]],['Свой филиал · воронка · люди',[1,1,0,0,0,0,0,0]],['Свои лиды · звонки · WhatsApp',[1,1,1,1,0,0,0,1]],['Свои сделки · договор · оплата',[1,1,0,1,0,0,0,0]],['Все клиенты филиала',[1,1,0,0,0,0,0,0]],['Процедуры · документы · сроки',[1,0,0,0,1,0,0,0]],['Договоры · счета · графики',[1,1,0,1,0,1,0,0]],['Дебиторка · выручка',[1,1,0,0,0,1,0,0]],['Аналитика · CPL · дашборды',[1,1,0,0,0,1,0,0]],['Поля · сущности · роли · филиалы',[1,0,0,0,0,0,1,0]],['API · вебхуки · интеграции · сервер',[1,0,0,0,0,0,1,0]],['Журнал действий · ПДн',[1,0,0,0,0,0,1,0]],['Правила ИИ · база знаний · модель',[1,0,0,0,0,0,1,0]],['Действует как ИИ: отвечает, квалифицирует, заполняет',[0,0,0,0,0,0,0,1]]]
  .map(([n,a])=>`<tr><td style="padding:7px 8px">${esc(n)}</td>${a.map(v=>`<td style="text-align:center;padding:7px 8px;color:${v?'var(--ok)':'var(--line2)'};font-weight:800">${v?'✓':'—'}</td>`).join('')}</tr>`).join('')}</tbody>
</table></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Три уровня прав</h3><p class="mini" style="margin:0">Раздел (видит ли экран), действие (может ли изменить, удалить, экспортировать), данные (свои · филиал · все). Пример: оператор видит карточку клиента, но не сумму договора и не чужие лиды.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Вход</h3><p class="mini" style="margin:0">Логин и пароль, двухфакторный для руководителей, финансиста и администратора; сотрудники — код в WhatsApp. Уволенному — доступ закрывается кнопкой, его данные остаются.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">ИИ — как сотрудник</h3><p class="mini" style="margin:0">У роли «ИИ-агент» свои права: пишет клиентам, заполняет поля, ставит задачи; не меняет договоры и оплаты. Помощнику и «управлению» — права того, кто спрашивает.</p></div>
</div>`;

SC.staff=()=>{const list=role==='РОП · Алматы'?STAFF.filter(s=>s.br==='Алматы'):curBr==='all'?STAFF:STAFF.filter(s=>s.br===curBr||s.br==='все');return `<div class="hd"><div><h2>Сотрудники и эффективность · сентябрь</h2>
 <p>Ваш пункт 8: «эффективность сотрудников и филиалов». Оператор — лиды и конверсия во встречу; менеджер — встречи, договоры, выручка, дебиторка; юрист — процедуры и сроки. Всё считается из действий, никто не заполняет отчёт о себе.</p></div>
 <div class="btns">${brSel()}<button class="bt" onclick="toast('Новый сотрудник: имя, телефон, роль, филиал. Приглашение в WhatsApp, вход по коду.')">+ Сотрудник</button><button class="bt p" onclick="toast('Мотивация: план и бонус по ролям — операторам за встречи, менеджерам за оплаченные договоры, юристам за сроки. Считается из тех же данных.')">План и бонусы</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.3px">${th(['СОТРУДНИК','РОЛЬ','ФИЛИАЛ','ЛИДОВ','ВСТРЕЧ','ДОГОВОРОВ','ВЫРУЧКА','ПОКАЗАТЕЛЬ'],[3,4,5,6])}
 <tbody>${list.map(s=>`<tr>${td('<b>'+esc(s.n)+'</b>')}${td(s.role,0,'color:var(--muted)')}${td(s.br)}${td(s.leads||'—',1)}${td(s.meet||'—',1)}${td(s.ctr||'—',1)}${td(s.rev?money(mln(s.rev)):'—',1)}${td('<span style="color:'+(s.note.indexOf('просрочка')>=0?'var(--warn)':'inherit')+'">'+esc(s.note)+'</span>')}</tr>`).join('')}</tbody></table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Что видит сам сотрудник</h3><p class="mini" style="margin:0">Свои цифры за месяц и место в филиале, план и бонус. Разговор о результатах — по цифрам, которые оба видели весь месяц.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Нагрузка</h3><p class="mini" style="margin:0">Открытых лидов на оператора, процедур на юриста, встреч на менеджера — с лимитами. Распределение учитывает нагрузку, РОП видит перекосы.</p></div>
</div>`};

/* ====== АНАЛИТИКА ====== */
SC.sources=()=>`<div class="hd"><div><h2>Лиды · источники · рекламные каналы · CPL</h2>
 <p>Ваш пункт 8: лиды и источники, рекламные каналы, CPL, встречи, конверсии. Расход подтягивается из рекламных кабинетов по API, лиды — с меткой источника и кампании. CPL считается до лида, до встречи, до договора и до оплаты.</p></div>
 <div class="btns">${brSel()}<button class="bt" onclick="go('conv')">Конверсии</button><button class="bt p" onclick="toast('Подключение рекламного кабинета: Meta, Google Ads, TikTok Ads, Яндекс — расход и кампании по API ежедневно. Ваш пункт 9.')">Подключить кабинет</button></div></div>
<div class="wid" style="grid-template-columns:repeat(5,1fr)">
 <div><small>Лидов</small><b class="a">1 146</b><span>сентябрь</span></div>
 <div><small>Расход на рекламу</small><b>${money(mln(4390000))}</b><span>5 платных каналов</span></div>
 <div><small>CPL · лид</small><b>${money('3 830 ₸')}</b><span>август ${money('4 100')}</span></div>
 <div><small>CPL · договор</small><b>${money('32 800 ₸')}</b><span>134 договора с рекламы</span></div>
 <div><small>Окупаемость рекламы</small><b class="g">${money('×8,7')}</b><span>выручка с рекламы / расход</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11.3px">${th(['ИСТОЧНИК','ЛИДЫ','РАСХОД','CPL','ВСТРЕЧИ','ДОГОВОРЫ','CPL · ДОГОВОР','ВЫРУЧКА','ОКУПАЕМОСТЬ'],'all')}
 <tbody>${SRCS.map(s=>`<tr>${td('<b>'+s.n+'</b>')}${td(fmt(s.leads),1)}${td(s.cost?money(fmt(s.cost)):'—',1)}${td(s.cost?money(fmt(Math.round(s.cost/s.leads))):'—',1,'color:'+(s.cost/s.leads>6000?'var(--bad)':'inherit'))}${td(s.meet+' · '+pct(s.meet,s.leads)+'%',1)}${td(s.ctr+' · '+pct(s.ctr,s.meet)+'%',1)}${td(s.cost?money(fmt(Math.round(s.cost/s.ctr))):'—',1)}${td(money(mln(s.rev)),1)}${td(s.cost?money('×'+num(s.rev/s.cost)):'—',1,'font-weight:700;color:'+(s.rev/s.cost<5&&s.cost?'var(--warn)':'var(--ok)'))}</tr>`).join('')}</tbody></table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Яндекс · ×3,5</h3><p class="mini" style="margin:0">48 лидов за 310 000, 4 договора. Самый дорогой договор — 77 500 ₸. Данные за три месяца такие же. Решение ваше, цифры теперь одни для маркетолога и руководителя.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">До кампании и креатива</h3><p class="mini" style="margin:0">Метка кампании приходит с лидом: видно, какой креатив даёт договоры, а какой — только лиды. Отчёт «кампания → оплаченные договоры» — в конструкторе дашбордов.</p></div>
</div>`;

SC.revenue=()=>`<div class="hd"><div><h2>Договоры · выручка · оплаты · сентябрь</h2>
 <p>Ваш пункт 8: договоры, выручка, оплаты, дебиторка. Выручка считается по оплатам, не по подписанным договорам, — с разбивкой по филиалам, видам процедур и менеджерам. План — ваш.</p></div>
 <div class="btns">${brSel()}<button class="bt" onclick="toast('Выгрузка в Excel: договоры, оплаты, дебиторка по филиалам за период — для бухгалтерии и 1С.')">В Excel</button></div></div>
<div class="wid" style="grid-template-columns:repeat(5,1fr)">
 <div><small>Подписано</small><b class="a">${money(mln(28300000))}</b><span>88 договоров</span></div>
 <div><small>Оплачено</small><b class="g">${money(mln(20240000))}</b><span>план 24 млн · 84%</span></div>
 <div><small>Дебиторка</small><b class="r">${money(mln(4130000))}</b><span>19 договоров</span></div>
 <div><small>Средний договор</small><b>${money('322 000 ₸')}</b><span>внесудебное 280 · судебное 600</span></div>
 <div><small>Прогноз октября</small><b>${money(mln(23800000))}</b><span>по графикам + воронке</span></div>
</div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">По неделям · оплаты</h3>
  ${[['1–7.09',4100000,5000000],['8–14.09',5300000,6000000],['15–21.09',6240000,6500000],['22–28.09 · прогноз',4600000,6500000]].map(([w,f,p])=>`<div class="fr" style="grid-template-columns:130px 1fr 150px"><b style="font-size:11.3px">${w}</b>${barHtml(f/p*100,f>=p*0.9?'var(--ok)':'var(--warn)')}<b class="mono" style="text-align:right">${money(mln(f)+' из '+mln(p))}</b></div>`).join('')}
  <h3 style="margin:12px 0 8px">По видам процедур</h3>
  <table class="t" style="font-size:11.2px">${th(['ВИД','ДОГОВОРОВ','СРЕДНИЙ','ПОДПИСАНО','ОПЛАЧЕНО','ДЕБИТОРКА'],'all')}
  <tbody>${[['Внесудебное',61,280000,17080000,13440000,1240000],['Судебное',21,600000,12600000,6300000,2690000],['Восстановление платёжеспособности',6,450000,2700000,500000,200000]].map(r=>`<tr>${td('<b>'+r[0]+'</b>')}${td(r[1],1)}${td(money(fmt(r[2])),1)}${td(money(mln(r[3])),1)}${td(money(mln(r[4])),1)}${td(money(mln(r[5])),1,'color:'+(r[5]>2000000?'var(--bad)':'inherit'))}</tr>`).join('')}</tbody></table>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">По менеджерам</h3>
   ${[['Асель К. · Алматы',8960000],['Даулет · Астана',7420000],['Ботагоз · Актобе',3860000],['новый менеджер · Алматы',1200000]].map(([n,v])=>`<div class="fr" style="grid-template-columns:150px 1fr 70px"><span style="font-size:11px">${n}</span>${barHtml(v/8960000*100,'var(--brand)')}<b class="mono" style="text-align:right">${money(mln(v))}</b></div>`).join('')}
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Почему по оплатам</h3><p class="mini" style="margin:0">Судебные договоры на 600 000 в рассрочку на 6 месяцев: подписано 12,6 млн, оплачено 6,3. Планировать зарплаты и рекламу по подписанным — ошибка, которую платформа не даёт совершить.</p></div>
 </div>
</div>`;

SC.dashboards=()=>`<div class="hd"><div><h2>Собственные дашборды · конструктор</h2>
 <p>Ваш пункт 8, последний подпункт. Любой показатель платформы — стандартный или из ваших полей — выносится на дашборд: число, график, таблица, воронка. Разрезы: филиал, сотрудник, источник, вид процедуры, период. Дашборд — свой или общий по роли.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Дашборд отправляется по расписанию в WhatsApp или на почту картинкой и ссылкой.')">По расписанию</button><button class="bt p" onclick="dashAdd()">+ Виджет</button></div></div>
<div class="g3">
 ${[['Оплаты по филиалам · неделя','число + график',[['Алматы','2,6 млн'],['Астана','2,1'],['Актобе','1,5']]],['CPL до договора · источники','таблица',[['Instagram','40 200'],['Google','45 900'],['TikTok','40 500']]],['Процедуры · просрочки сроков','число',[['на неделе','31'],['просрочено','1'],['под угрозой','3']]],['Конверсия встреча → договор · менеджеры','график',[['Асель','42%'],['Даулет','37%'],['новый','14%']]],['Дебиторка старше 30 дней','число · красное при > 1 млн',[['сумма','1,0 млн'],['договоров','4']]],['ИИ · доля первого ответа','число',[['сегодня','94%'],['неделя','91%']]]].map(([n,t,rows])=>`<div class="pan" style="cursor:move"><h3 style="margin:0 0 2px">${n}</h3><p class="mini" style="margin:0 0 8px">${t} · перетащить · настроить</p>${rows.map(([k,v])=>`<div class="kv" style="font-size:11px"><span>${k}</span><b class="mono">${money(v)}</b></div>`).join('')}</div>`).join('')}
</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Как устроено</h3><p class="mini" style="margin:0">Виджет — это запрос к API с разрезами и видом отображения. Тот же запрос доступен по API вашим сервисам и ИИ. Ничего не считается «руками» в Excel и не расходится с другими экранами.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Для кого</h3><p class="mini" style="margin:0">Руководитель — свой набор по филиалам; РОП — по операторам и источникам; финансист — по оплатам и дебиторке; маркетолог — по кампаниям и CPL. Каждый — в пределах прав.</p></div>
</div>`;
/* ====== ПЛАТФОРМА ====== */
SC.api=()=>`<div class="hd"><div><h2>REST API и вебхуки</h2>
 <p>Ваш пункт 9: полноценный API, вебхуки, подключение ваших сервисов, рекламные системы, расширение без переделки ядра. Интерфейс платформы сам работает через этот API — значит, всё, что видно на экранах, доступно вашим сервисам и ИИ.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Документация API в формате OpenAPI: все методы, поля, примеры. Открывается в браузере, есть «попробовать».')">Документация</button><button class="bt p" onclick="toast('Ключ API создан для сервиса «сайт ЦБК»: права — создавать лиды и читать статусы. Отзывается кнопкой. Все вызовы — в журнале.')">+ Ключ API</button></div></div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Методы · выдержка</h3>
  <table class="t" style="font-size:11px">${th(['МЕТОД','ЧТО ДЕЛАЕТ','ПРАВА'],[])}
  <tbody>${[['POST /api/leads','создать лид: телефон, источник, кампания, поля формы','ключ сервиса'],['GET /api/clients?filter=…','список клиентов с фильтром по любому полю, включая ваши','по роли'],['GET · PATCH /api/clients/{id}','карточка клиента · изменить поля','по роли'],['GET /api/clients/{id}/history','история взаимодействий и изменений','по роли'],['POST /api/deals/{id}/stage','перевести этап с проверкой правил','по роли'],['POST /api/wa/messages','отправить сообщение или шаблон','по роли'],['GET · POST /api/contracts · /invoices · /payments','договоры, счета, платежи','финансы'],['GET · POST /api/procedures','процедуры, этапы, точки, документы','юрист'],['POST /api/files','загрузить документ в хранилище','по роли'],['GET /api/reports/{name}?by=branch','любой отчёт платформы в JSON','по роли'],['POST /api/ai/ask','вопрос к данным от имени пользователя','по роли'],['GET · POST /api/schema/fields','ваши поля и сущности','администратор']].map(r=>`<tr>${td('<span class="mono" style="font-size:10.4px">'+r[0]+'</span>')}${td(r[1])}${td(tag(r[2],'var(--muted)'))}</tr>`).join('')}</tbody></table>
  <p class="mini" style="margin:8px 0 0">Ключи с ограниченными правами, лимиты запросов, версия в адресе (<span class="mono">/api/v1</span>) — старые интеграции не ломаются при развитии.</p>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Вебхуки · события</h3>
   ${['lead.created · lead.assigned','deal.stage_changed','wa.message.in · wa.message.out · wa.status','payment.received · invoice.overdue','contract.signed','procedure.stage_changed · checkpoint.due · checkpoint.overdue','client.updated · с полем и значением','ai.handoff · ИИ передал человеку'].map(t=>`<div class="kv" style="font-size:11px"><span class="mono" style="font-size:10.4px">${t}</span></div>`).join('')}
   <p class="mini" style="margin:8px 0 0">Подписка: адрес вашего сервиса, события, подпись запроса, повтор при ошибке. Ваш пункт 3: «входящие и исходящие события через API».</p>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Уже подключено в демо</h3>
   <div class="kv"><span>Meta · Instagram, Facebook</span><b>лид-формы · расход</b></div>
   <div class="kv"><span>TikTok Ads · Google Ads · Яндекс</span><b>лиды · расход · кампании</b></div>
   <div class="kv"><span>WhatsApp Business API</span><b>сообщения · статусы</b></div>
   <div class="kv"><span>Kaspi · банк</span><b>платежи по вебхуку</b></div>
   <div class="kv"><span>IP-телефония</span><b>звонки · записи · расшифровка</b></div>
   <div class="kv" style="border:0"><span>Ваш сайт · ваш ИИ · 1С</span><b>по API · слоты готовы</b></div>
  </div>
 </div>
</div>
<div class="said"><b>«Расширение без переделки ядра».</b> Ядро — это база, API, права, поля и события. Новый экран, новый сервис, новая интеграция, свой ИИ — снаружи ядра, через API и вебхуки. Ваши разработчики после передачи работают так же, как мы, — в той же документации.</div>`;

SC.security=()=>`<div class="hd"><div><h2>Безопасность и инфраструктура · на вашем сервере</h2>
 <p>Ваш пункт 10: установка на вашем сервере, исходный код, резервное копирование, разграничение доступа, журнал действий, защита персональных данных, обновления и поддержка.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Проверка восстановления: копия за вчера разворачивается на тестовом сервере за 20 минут. Делаем раз в месяц, отчёт вам.')">Проверить восстановление</button><button class="bt p" onclick="toast('Журнал действий за сегодня: 1 284 записи — входы, открытия карточек, изменения, выгрузки, вызовы API, действия ИИ. Фильтр по сотруднику, клиенту, типу.')">Журнал действий</button></div></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 8px">Сервер и код</h3>
  <div class="chk"><i>✓</i><span><b>Ваш сервер</b> — в Казахстане, ваш или арендованный от вашего имени. Docker Compose: платформа поднимается одной командой</span></div>
  <div class="chk"><i>✓</i><span><b>Исходный код — ваш,</b> репозиторий передаётся на каждом этапе, не в конце. Лицензия — без ограничений на изменение и использование</span></div>
  <div class="chk"><i>✓</i><span><b>Документация:</b> архитектура, API, схема базы, как развернуть, как обновить, как добавить поле и экран</span></div>
  <div class="chk"><i>✓</i><span><b>Нет привязки к подрядчику:</b> открытые компоненты, стандартный стек, любая команда продолжит</span></div>
 </div>
 <div class="pan"><h3 style="margin:0 0 8px">Данные</h3>
  <div class="chk"><i>✓</i><span><b>Копии</b> базы и файлов ежедневно, хранение 30 дней, вторая копия в другом месте; восстановление проверяется</span></div>
  <div class="chk"><i>✓</i><span><b>Шифрование</b> — HTTPS, база и копии на зашифрованных дисках, ИИН и документы — с ограниченным доступом</span></div>
  <div class="chk"><i>✓</i><span><b>Персональные данные:</b> согласие в карточке, доступ по ролям, журнал открытий, маскирование для внешнего ИИ, удаление по запросу с сохранением обязательного</span></div>
  <div class="chk"><i>✓</i><span><b>Экспорт всего</b> — база и файлы выгружаются в открытых форматах в любой момент</span></div>
 </div>
 <div class="pan"><h3 style="margin:0 0 8px">Доступ и журнал</h3>
  <div class="chk"><i>✓</i><span><b>Роли и филиалы</b> — на уровне API, не только экранов</span></div>
  <div class="chk"><i>✓</i><span><b>Двухфакторный вход</b> для руководителей, финансов и администратора; сессии, устройства, выход отовсюду</span></div>
  <div class="chk"><i>✓</i><span><b>Журнал действий:</b> кто, что, когда, откуда — интерфейс, API, ИИ. Открытие карточки — тоже запись</span></div>
  <div class="chk"><i>✓</i><span><b>Ключи API и вебхуки</b> — с правами и отзывом; интеграции не получают лишнего</span></div>
 </div>
</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 8px">Обновления и поддержка</h3>
  <div class="kv"><span>Гарантия на ошибки</span><b>6 месяцев после каждого этапа · бесплатно</b></div>
  <div class="kv"><span>Сопровождение · по желанию</span><b>${money('150 000 ₸ / мес')} · обновления, дежурство, до 10 часов доработок</b></div>
  <div class="kv"><span>Без сопровождения</span><b>платформа работает; доработки — ${money('20 $ / час')} или ваша команда</b></div>
  <div class="kv" style="border:0"><span>Обновление</span><b>одна команда, откат за минуту, копия перед обновлением</b></div>
 </div>
 <div class="pan"><h3 style="margin:0 0 8px">Расходы после разработки · в месяц</h3>
  <div class="kv"><span>Сервер</span><b>${money('0 на своём · 20–40 000 ₸ аренда')}</b></div>
  <div class="kv"><span>WhatsApp Business API</span><b>${money('≈ 5 000 ₸ за номер + плата Meta за диалоги')}</b></div>
  <div class="kv"><span>ИИ</span><b>${money('0 на своей модели · 30–80 000 ₸ внешняя')}</b></div>
  <div class="kv"><span>Телефония · копии · домен</span><b>${money('≈ 30 000 · 5 000 · 2 000 ₸')}</b></div>
  <div class="kv" style="border:0"><span>Лицензии и абонплата платформы</span><b class="g">нет</b></div>
 </div>
</div>`;

SC.stack=()=>`<div class="hd"><div><h2>Архитектура · стек · сроки · стоимость</h2>
 <p>Ответы на вопросы встречи: архитектура, сроки, стоимость MVP и полной версии, поддержка, права на код и данные, расходы после, стек и почему. Этот экран и КП — одно и то же.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Состав этапов выгружен в PDF вместе с КП — приложение № 1 к договору после демо.')">Выгрузить</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>MVP · этап 1</small><b class="a">3 500 000 ₸</b><span>6–7 недель · работает целиком</span></div>
 <div><small>Полная версия · 3 этапа</small><b>7 000 000 ₸</b><span>12–14 недель</span></div>
 <div><small>Оплата</small><b>10 / 45 / 45</b><span>по каждому этапу</span></div>
 <div><small>Абонплата · лицензии</small><b class="g">нет</b><span>код, данные, сервер ваши</span></div>
</div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Архитектура</h3>
  <div class="pipe" style="grid-auto-columns:minmax(150px,1fr);gap:6px">${[['Клиенты · каналы','WhatsApp Business API · лид-формы · сайт · телефония · ваш ИИ','#6b7f8c'],['Интерфейс','веб-приложение: браузер и телефон, значок на экране','#345c7d'],['API · события','REST /api/v1 · вебхуки · права · журнал','#1f7a5a'],['Ядро','сущности и поля (схема в базе) · правила · очереди · ИИ-адаптер','#20242b'],['Данные','PostgreSQL · Redis · MinIO для файлов · копии','#cf8a22']].map(([n,d,c])=>`<div><div class="phead" style="background:${c};font-size:10.4px">${n}</div><div class="pbody" style="min-height:0;padding:8px;border:1px solid var(--line);border-top:0;border-radius:0 0 6px 6px"><p class="mini" style="margin:0">${d}</p></div></div>`).join('')}</div>
  <table class="t" style="font-size:11.2px">${th(['СЛОЙ','ЧТО ПРЕДЛАГАЕМ','ПОЧЕМУ'],[])}
  <tbody>${[['База данных','PostgreSQL','самая распространённая открытая СУБД; JSON-поля для ваших сущностей; проверенные копии и репликация'],['Сервер приложения','Node.js · TypeScript','один язык с интерфейсом; быстро для WhatsApp и вебхуков; тысячи разработчиков в Казахстане'],['Интерфейс','TypeScript · React','стандарт для веб-приложений: легко нанять, много готовых компонентов, работает на телефоне без магазинов приложений'],['Очереди · кэш','Redis','рассылки, вебхуки, напоминания — надёжно и с повтором'],['Файлы','MinIO · совместимо с S3','документы на вашем сервере; при переезде в облако код не меняется'],['ИИ','адаптер в формате OpenAI API','подключается ваша модель через vLLM или Ollama и любая внешняя — без правки кода'],['Развёртывание','Docker Compose · nginx','одна команда на любом сервере; обновление и откат за минуту'],['Аналитика','встроенный конструктор + SQL-доступ','свои дашборды без нас; при желании подключается Metabase или Power BI']].map(r=>`<tr>${td('<b>'+r[0]+'</b>')}${td(r[1])}${td('<span class="mini">'+r[2]+'</span>')}</tr>`).join('')}</tbody></table>
  <p class="mini" style="margin:6px 0 0">Если у вас уже есть команда на другом стеке — обсудим: важен не язык, а открытость и документация. Не предлагаем: no-code-конструкторы и готовые CRM с подпиской — они и есть «зависимость от подрядчика».</p>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 9px">Этапы</h3>
   <div class="tl">
    <div class="tli"><b style="font-size:11.6px">Этап 1 · MVP · 6–7 недель · 3 500 000 ₸</b><p class="mini" style="margin:2px 0 0">Клиенты и единая карточка, история, поля и сущности, воронка с распределением, задачи, WhatsApp Business API из CRM, шаблоны и автосообщения, договоры, счета и платежи с графиками, процедуры с этапами и сроками, филиалы и роли, сводка и базовые отчёты, REST API и вебхуки, установка на ваш сервер, перенос данных, обучение. Работает целиком.</p></div>
    <div class="tli"><b style="font-size:11.6px">Этап 2 · 3–4 недели · 2 000 000 ₸</b><p class="mini" style="margin:2px 0 0">Просрочки и дебиторка с правилами, документы и чек-листы процедур, контрольные точки с эскалацией, конструктор дашбордов, интеграции с рекламными кабинетами и CPL, массовые рассылки, журнал действий и ПДн, телефония, эффективность сотрудников.</p></div>
    <div class="tli"><b style="font-size:11.6px">Этап 3 · ИИ · 3–4 недели · 1 500 000 ₸</b><p class="mini" style="margin:2px 0 0">Адаптер под ваш ИИ, бот в WhatsApp, квалификация и автозаполнение, помощник сотрудника, управление через ИИ, база знаний, журнал ИИ, две недели под присмотром.</p></div>
    <div class="tli"><b style="font-size:11.6px">Передача · после каждого этапа</b><p class="mini" style="margin:2px 0 0">Код в вашем репозитории, документация, обучение вашего разработчика. Гарантия 6 месяцев.</p></div>
   </div>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Права</h3>
   <div class="kv"><span>Исходный код</span><b>ваш · без ограничений</b></div>
   <div class="kv"><span>Данные</span><b>ваши · на вашем сервере</b></div>
   <div class="kv"><span>Дальнейшее развитие</span><b>вы, мы или любая команда</b></div>
   <div class="kv" style="border:0"><span>Наш доступ после передачи</span><b>только с вашего разрешения</b></div>
  </div>
 </div>
</div>`;

/* ====== ДЕЙСТВИЯ ====== */
const inp=(v,w)=>`<input value="${v}" style="width:${w||110}px;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card);text-align:right;font-weight:700">`;
function fieldAdd(){openM('Новое поле клиента','Конструктор полей · без программиста',
 `<div class="srow"><div style="flex:1"><b>Название</b></div><input value="Ипотека" style="width:180px;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card)"></div>
  <div class="srow"><div style="flex:1"><b>Тип</b></div><select class="rsel"><option>да / нет</option><option>число</option><option>деньги</option><option>список</option><option>дата</option><option>файл</option><option>ссылка на сущность</option></select></div>
  <div class="srow"><div style="flex:1"><b>Обязательно</b></div><select class="rsel"><option>нет</option><option>при договоре</option><option>всегда</option></select></div>
  <div class="srow"><div style="flex:1"><b>Кто видит</b></div><select class="rsel"><option>все</option><option>менеджер · юрист</option><option>финансы</option></select></div>
  <div class="srow"><div style="flex:1"><b>Где показывать</b></div><select class="rsel"><option>карточка · фильтры · API · ИИ</option><option>только карточка</option></select></div>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Поле «Ипотека» добавлено: в карточке, фильтрах, API (/api/clients · ipoteka), дашбордах. ИИ получил описание и будет уточнять его у лидов.')">Сохранить</button>`)}
function leadAdd(){openM('Новый лид · вручную','Обычно лиды приходят по API с рекламы, сайта и WhatsApp',
 `<div class="srow"><div style="flex:1"><b>Телефон</b><div class="mini">проверка дублей по всем филиалам</div></div><input value="+7 701 000 00 00" style="width:150px;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card)"></div>
  <div class="srow"><div style="flex:1"><b>Имя</b></div><input value="" placeholder="если известно" style="width:150px;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card)"></div>
  <div class="srow"><div style="flex:1"><b>Источник</b></div><select class="rsel">${SRC.map(s=>`<option>${s}</option>`).join('')}<option>Звонок</option></select></div>
  <div class="srow"><div style="flex:1"><b>Филиал</b></div><select class="rsel"><option>по коду номера</option>${BR.map(b=>`<option>${b}</option>`).join('')}</select></div>
  <div class="note" style="--tone:var(--violet)"><p class="mini" style="margin:0">После создания Ару напишет первой по шаблону «Первый ответ», задаст вопросы квалификации, а лид попадёт в очередь распределения.</p></div>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Лид создан: К-10546, Алматы, оператор Жанель по очереди. Ару написала первой. В истории — запись.')">Создать</button>`)}
function bcast(){openM('Массовая рассылка','WhatsApp Business API · только одобренные шаблоны',
 `<div class="srow"><div style="flex:1"><b>Сегмент</b></div><select class="rsel"><option>Отказ · долг меньше порога · 214</option><option>Платёж скоро · 41</option><option>Завершённые · 190</option><option>Без ответа 3 дня · 12</option></select></div>
  <div class="srow"><div style="flex:1"><b>Шаблон</b></div><select class="rsel"><option>Изменения в законе · октябрь</option><option>Напоминание о платеже</option><option>Отзыв после завершения</option></select></div>
  <div class="srow"><div style="flex:1"><b>Темп</b></div><select class="rsel"><option>60 в час · безопасно для номера</option><option>120 в час</option></select></div>
  <div class="srow"><div style="flex:1"><b>Когда</b></div><select class="rsel"><option>сейчас · до 21:00</option><option>завтра 10:00</option></select></div>
  <div class="note" style="--tone:var(--ok)"><p class="mini" style="margin:0">Проверено: 214 контактов, у 206 есть согласие и активный WhatsApp, 8 отписались словом «стоп» — исключены.</p></div>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Рассылка запущена: 206 сообщений, темп 60 в час. Отчёт о доставке и ответах — в этом разделе; ответы попадут операторам.')">Запустить</button>`)}
function ctAdd(){openM('Новый договор из карточки','Салтанат Бекова · Актобе · восстановление платёжеспособности',
 `${[['Заказчик','Салтанат Бекова · ИИН из карточки'],['Телефон','+7 702 7•• •• 34'],['Вид процедуры','Восстановление платёжеспособности'],['Шаблон','Договор · восстановление · v3'],['Сумма','450 000 ₸']].map(([k,v])=>`<div class="kv"><span>${k}</span><b>${v}</b></div>`).join('')}
  <div class="srow" style="margin-top:8px"><div style="flex:1"><b>Рассрочка</b></div><select class="rsel"><option>4 платежа по 112 500</option><option>2 платежа по 225 000</option><option>1 платёж</option></select></div>
  <div class="srow"><div style="flex:1"><b>Подпись</b></div><select class="rsel"><option>ЭЦП · ссылка в WhatsApp</option><option>скан · распечатать</option></select></div>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Договор ДГ-2352 сформирован, ссылка на подпись ЭЦП отправлена клиенту. После подписи — график из 4 платежей и первый счёт.')">Сформировать</button>`)}
function payAdd(){openM('Платёж · вручную','Обычно платежи приходят по вебхуку Kaspi и банка',
 `<div class="srow"><div style="flex:1"><b>Клиент · договор</b></div><select class="rsel"><option>Жанна Ким · ДГ-2204 · счёт СЧ-5101</option><option>Айгерим Нурланова · ДГ-2291</option></select></div>
  <div class="srow"><div style="flex:1"><b>Сумма</b></div>${inp('100 000')}<span class="mini">₸</span></div>
  <div class="srow"><div style="flex:1"><b>Способ</b></div><select class="rsel"><option>касса Астана</option><option>перевод</option><option>Kaspi</option></select></div>
  <div style="border:1px dashed var(--line2);border-radius:6px;padding:10px;text-align:center;color:var(--muted);font-size:11px;margin-top:8px">+ фото чека</div>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Платёж проведён: счёт СЧ-5101 оплачен, просрочка снята, процедура ПБ-0395 продолжается, юристу и клиенту — уведомление. В истории — кто внёс.')">Провести</button>`)}
function dashAdd(){openM('Новый виджет','Конструктор дашбордов',
 `<div class="srow"><div style="flex:1"><b>Показатель</b></div><select class="rsel"><option>Оплаты</option><option>Лиды</option><option>Договоры</option><option>Дебиторка</option><option>Процедуры · точки</option><option>Ваше поле: Ипотека</option></select></div>
  <div class="srow"><div style="flex:1"><b>Разрез</b></div><select class="rsel"><option>филиал</option><option>сотрудник</option><option>источник · кампания</option><option>вид процедуры</option></select></div>
  <div class="srow"><div style="flex:1"><b>Период</b></div><select class="rsel"><option>неделя</option><option>месяц</option><option>квартал</option></select></div>
  <div class="srow"><div style="flex:1"><b>Вид</b></div><select class="rsel"><option>число</option><option>график</option><option>таблица</option><option>воронка</option></select></div>
  <div class="srow"><div style="flex:1"><b>Сигнал</b></div><input value="красным, если > 1 млн" style="width:160px;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card)"></div>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Виджет добавлен на ваш дашборд. Тот же запрос доступен по API: /api/reports/payments?by=branch&period=week.')">Добавить</button>`)}
function searchDemo(v){if(!v)return;const q=v.toLowerCase();const c=CL.find(x=>x.n.toLowerCase().indexOf(q)>=0||x.id.toLowerCase()===q);if(c){curCl=c.id;go('client');toast(`Найдено: ${esc(c.n)}. Открыта карточка.`);return}toast(`Поиск «${esc(v)}»: по клиентам, телефонам, ИИН, договорам, процедурам, сотрудникам — в пределах прав роли. Попробуйте «Нурланова» или «К-10488».`)}

/* ====== ИНФРАСТРУКТУРА ====== */
function renderRoles(){const r=document.getElementById('roles');if(!r)return;
 r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель ЦБК';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');
 const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();
 toast(`Вы вошли как «${role}» · ${ROLES[role].n}. Показаны только разделы этой роли — так же будет у ваших сотрудников.`);}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${role}. Разделов доступно: ${ROLES[role].s.length}. ${ROLES[role].note}.`)}
const ownerOf=k=>SECOF[k];
function buildRail(){const on=ownerOf(cur);document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>{const n=s.sub.filter(x=>allowed(x[0])).length;return `<div class="ri ${s.k===on?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')" title="${esc(s.n)}"><i>${s.ic}</i><span>${esc(s.n)}</span>${n>1?`<b class="cnt">${n}</b>`:''}</div>`}).join('');}
function buildSub(){const on=ownerOf(cur),s=SEC.find(x=>x.k===on);if(!s)return;document.getElementById('sub').innerHTML=`<h4>${esc(s.n)}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')+`<div class="shint"><b>${esc(role)}</b><br>${esc(ROLES[role].note)}</div>`;}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Сводка';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;const a=document.getElementById('addBtn');if(a)a.style.display=allowed('leads')?'':'none';try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль в правом верхнем углу.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}

/* ====== СЦЕНАРИЙ ПОКАЗА · по вашим 11 пунктам ====== */
const TOUR=[
 ['dash','Пункт 11, главное: платформа управления ЦБК. Сводка по трём филиалам — лиды, встречи, договоры, выручка, дебиторка, процедуры.'],
 ['client','Пункт 1: единая карточка клиента — история всех взаимодействий, сделки, договор, платежи, процедура, документы, ваши поля.'],
 ['fields','Пункт 1: кастомные поля и сущности — добавляются без программиста и сразу видны в фильтрах, API, дашбордах и ИИ.'],
 ['changes','Пункт 1: история изменений — кто, когда, откуда, было → стало, откат кнопкой.'],
 ['funnel','Пункт 2: воронка с вашими этапами и правилами перехода, автосообщения на этапах.'],
 ['leads','Пункт 2: распределение лидов между операторами по филиалу, очереди и нагрузке; ИИ отвечает первым.'],
 ['conv','Пункт 2: контроль конверсий по этапам, сотрудникам и источникам — где падает, видно за неделю.'],
 ['wa','Пункт 3: WhatsApp Business API из CRM, диалог привязан к клиенту, руководитель видит всё.'],
 ['broadcast','Пункт 3: массовые и автоматические рассылки по сегментам и событиям, шаблоны с подстановками.'],
 ['aibot','Пункт 4: ИИ-бот в WhatsApp — роль с правами: отвечает первой, квалифицирует, записывает, передаёт человеку.'],
 ['aiqual','Пункт 4: квалификация лидов и автозаполнение карточки — каждое поле с источником и уверенностью.'],
 ['aimanage','Пункт 4: управление бизнесом через ИИ — вопрос обычным языком, ответ по данным, действия с подтверждением.'],
 ['aiown','Пункт 4: ваш собственный ИИ подключается через адаптер — сценарии и правила не меняются.'],
 ['contracts','Пункт 5: договоры из карточки, ЭЦП или скан, из договора — график и счета.'],
 ['schedule','Пункт 5: график платежей, напоминания, просрочка, правило 14 дней для процедуры.'],
 ['debts','Пункт 5: просрочки и дебиторка по филиалам и менеджерам, эскалация.'],
 ['procs','Пункт 6: процедура — отдельная сущность с этапами по трём видам, ответственными и сроками.'],
 ['proc','Пункт 6: карточка процедуры — этапы, документы, контрольные точки, история действий.'],
 ['deadlines','Пункт 6: сроки и контрольные точки всех процедур одним списком, эскалация за 5, 2 дня и в день.'],
 ['branches','Пункт 7: Алматы, Астана, Актобе — разграничение данных по филиалам, новый город кнопкой.'],
 ['roles','Пункт 7: роли и права — операторы, менеджеры, юристы, РОПы, руководители, ИИ. Три уровня: раздел, действие, данные.'],
 ['sources','Пункт 8: лиды, источники, рекламные кабинеты по API, CPL до лида, встречи, договора и оплаты.'],
 ['revenue','Пункт 8: договоры, выручка по оплатам, дебиторка, эффективность филиалов и менеджеров.'],
 ['dashboards','Пункт 8: собственные дашборды — любой показатель в любом разрезе, без нас.'],
 ['api','Пункт 9: REST API и вебхуки — интерфейс сам работает через API, ваши сервисы подключаются так же.'],
 ['security','Пункт 10: ваш сервер, исходный код, копии, доступ, журнал, ПДн, обновления и поддержка, расходы после.'],
 ['stack','Вопросы встречи: архитектура, стек и почему, MVP 3 500 000 ₸ за 6–7 недель, полная версия 7 000 000 ₸, права, поддержка.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий показа закончен. Всё кликается: карточка, воронка, WhatsApp, ИИ, договоры, процедуры, дашборды, API.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?5800:6900);}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
