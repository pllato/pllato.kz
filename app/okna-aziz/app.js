'use strict';

const I = {
  home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10M9 20v-6h6v6"/>',
  projects:'<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M8 4V2M16 4V2M3 9h18"/>',
  sales:'<path d="M4 5h16l-6 7v6l-4 2v-8z"/>',
  map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/>',
  measure:'<path d="M4 4h16v16H4zM4 9h16M9 4v16"/><path d="m12 13 2 2 3-4"/>',
  design:'<path d="M4 20h16M6 17l9-9 3 3-9 9H6zM14 9l3 3"/>',
  buy:'<path d="M3 5h3l2 10h9l3-7H7M10 19h.01M17 19h.01"/>',
  warehouse:'<path d="m3 9 9-5 9 5v11H3zM3 12h18M8 20v-5h8v5"/>',
  production:'<path d="M4 20h16M6 20V9l5 3V9l5 3V9l3 2v9"/>',
  qc:'<path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  logistics:'<path d="M3 7h11v10H3zM14 10h4l3 3v4h-7zM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>',
  install:'<path d="m14 6 4 4-8 8-4-4zM14 6l2-2a2.8 2.8 0 0 1 4 4l-2 2M6 14l-3 3 4 4 3-3"/>',
  cash:'<rect x="3" y="6" width="18" height="12" rx="1"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v.01M18 15v.01"/>',
  rework:'<path d="M4 7h11a5 5 0 0 1 0 10H8"/><path d="m8 3-4 4 4 4"/>',
  payroll:'<path d="M4 4h16v16H4zM4 9h16M9 9v11"/><path d="M12 13h5M12 16h3"/>',
  rates:'<path d="M4 7h16M4 17h16M8 4v6M16 14v6"/>',
  audit:'<path d="M5 4h14v16H5zM9 2h6v4H9zM8 11h8M8 15h8"/>',
  coverage:'<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
  access:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/><path d="M17 4h4v4"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  route:'<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h3a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  file:'<path d="M7 3h7l4 4v14H7zM14 3v5h5M10 13h5M10 17h5"/>',
  camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  lock:'<rect x="4" y="10" width="16" height="11" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
  arrow:'<path d="M5 12h14M14 7l5 5-5 5"/>',
  eye:'<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>',
  bell:'<path d="M18 9a6 6 0 1 0-12 0c0 6-3 8-3 8h18s-3-2-3-8M10 21h4"/>'
};
function icon(name){ return `<svg class="svg" viewBox="0 0 24 24">${I[name]||''}</svg>`; }
function esc(s){ return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function money(n){ return new Intl.NumberFormat('ru-RU').format(Math.round(n||0))+' сом'; }
function initials(s){ return String(s).split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase(); }

const STAGES = [
  {id:'sales',name:'Продажи',module:'sales',color:'#8b938f'},
  {id:'measure',name:'Замер',module:'measure',color:'#3977b7'},
  {id:'prepay',name:'Предоплата',module:'cash',color:'#d48726'},
  {id:'design',name:'Проектирование',module:'design',color:'#6a67a5'},
  {id:'procurement',name:'Закупки',module:'procurement',color:'#b9782f'},
  {id:'warehouse',name:'Склад',module:'warehouse',color:'#6f7e5b'},
  {id:'production',name:'Производство',module:'production',color:'#357f6b'},
  {id:'qc',name:'ОТК',module:'qc',color:'#3b6e95'},
  {id:'logistics',name:'Логистика',module:'logistics',color:'#b36d45'},
  {id:'install',name:'Монтаж',module:'install',color:'#2e8a5f'},
  {id:'final',name:'Финальный расчёт',module:'cash',color:'#14261f'}
];

const CHECKLISTS = {
  sales:['Контактные данные клиента заполнены','Адрес объекта и координаты подтверждены','Тип изделия выбран','Ориентировочный объём указан','Источник обращения зафиксирован','Ответственный менеджер назначен','Дата следующего действия назначена','Комментарий клиента сохранён','Задача на замер создана'],
  measure:['Связались с клиентом перед выездом','Маршрут открыт и статус «Выехал» установлен','Прибытие на объект зафиксировано','Размеры всех проёмов внесены','Фото проёмов и объекта загружены','Тип профиля и стеклопакета выбран','Пожелания клиента записаны','Выполненный объём в м² подтверждён'],
  prepay:['Сумма договора указана','Предоплата получена','Сумма и дата платежа внесены','Способ оплаты зафиксирован','Квитанция или платёжный документ приложен'],
  design:['Замер проверен','Техническое задание получено','Чертёж конструкции подготовлен','Профиль и стеклопакет рассчитаны','Фурнитура подобрана','Спецификация сформирована','Площадь изделий рассчитана','Чертёж согласован с клиентом','Изменения внесены','Финальная версия утверждена','Документы приложены','Выполненный объём подтверждён'],
  procurement:['Потребность сформирована из спецификации','Остатки склада проверены','Заказ поставщику создан','Поставщик подтверждён','Транспорт и маршрут назначены','Срок поставки указан','Документы закупки приложены','Материалы переданы на склад'],
  warehouse:['Поставка принята','Количество сверено','Качество проверено','Приход синхронизирован с «Мой Склад»','Резерв под проект создан','Материалы выданы в производство','Возвраты и остатки зафиксированы','Инвентаризация обновлена'],
  production:['Производственное задание принято','Спецификация проверена','Материалы получены со склада','Профиль нарезан','Стеклопакеты подготовлены','Изделия собраны','Фурнитура установлена','Количество и площадь подтверждены','Готовность передана в ОТК'],
  qc:['Геометрия изделия проверена','Комплектность проверена','Стеклопакет без дефектов','Фурнитура работает','Маркировка соответствует проекту','Фото результата приложено','Решение ОТК выбрано','Замечания зафиксированы','Изделия переданы в логистику'],
  logistics:['Комплектность загрузки проверена','Транспорт назначен','Маршрут построен','Водитель получил адрес и контакты','Статус «Выехал» установлен','Прибытие отмечено','Груз передан на объекте','Километраж и рейс подтверждены','Повреждения и задержки зафиксированы'],
  install:['Бригада назначена','Маршрут открыт','Статус «Выехал» установлен','Прибытие отмечено','Старые конструкции демонтированы','Окна установлены','Швы и примыкания выполнены','Фурнитура отрегулирована','Объект убран','Фото результата загружено','Фактический объём подтверждён','Акт подписан','Клиент принял работы'],
  final:['Акт монтажа подписан','Финальный платёж получен','Остаток задолженности равен нулю','Проект закрыт']
};

const ROLE_LABELS = {
  director:'Директор',finance:'Финансовый отдел',sales:'Менеджер продаж',
  surveyor:'Замерщик',designer:'Проектировщик',procurement:'Закупщик',
  warehouse:'Кладовщик',production:'Производство',qc:'ОТК',
  logistics:'Логист',installer:'Монтажная бригада'
};

const MODULES = {
  dashboard:{name:'Пульт директора',sub:'Проекты, люди, деньги и отклонения',icon:'home',roles:'all'},
  projects:{name:'Проекты',sub:'Единая карточка заказа и история',icon:'projects',roles:'all'},
  sales:{name:'Продажи',sub:'Лиды, квалификация и договор',icon:'sales',roles:['director','sales']},
  map:{name:'Карта',sub:'Объекты, маршруты и полевые сотрудники',icon:'map',roles:['director','sales','surveyor','logistics','installer']},
  measure:{name:'Замеры',sub:'Выезд, размеры, фото и объём',icon:'measure',roles:['director','sales','surveyor']},
  design:{name:'Проектирование',sub:'Чертежи, спецификация и м²',icon:'design',roles:['director','designer']},
  procurement:{name:'Закупки',sub:'Поставщики, транспорт и сроки',icon:'buy',roles:['director','procurement']},
  warehouse:{name:'Склад',sub:'Остатки, резерв и «Мой Склад»',icon:'warehouse',roles:['director','warehouse','procurement','production']},
  production:{name:'Производство',sub:'Задания, операции и выполненный объём',icon:'production',roles:['director','production']},
  qc:{name:'ОТК',sub:'Качество, замечания и возвраты',icon:'qc',roles:['director','qc','production']},
  logistics:{name:'Логистика',sub:'Рейсы, маршруты и доставка',icon:'logistics',roles:['director','logistics']},
  install:{name:'Монтаж',sub:'Бригады, акты и приёмка',icon:'install',roles:['director','installer']},
  cash:{name:'Касса и расчёты',sub:'Предоплата, финальная оплата и прибыль',icon:'cash',roles:['director','finance']},
  rework:{name:'Переделки',sub:'Причина, виновный, срок и стоимость',icon:'rework',roles:['director','qc','production','installer']},
  payroll:{name:'KPI и зарплата',sub:'Объём → ставка → KPI → начисление',icon:'payroll',roles:['director','finance']},
  rates:{name:'Расценки',sub:'Индивидуальные ставки с периодом действия',icon:'rates',roles:['director','finance']},
  audit:{name:'Журнал действий',sub:'Неизменяемая история операций',icon:'audit',roles:['director','finance']},
  coverage:{name:'Покрытие ТЗ',sub:'33 из 33 разделов реализованы в демо',icon:'coverage',roles:['director']},
  access:{name:'Роли и доступы',sub:'Каждый видит только свою зону ответственности',icon:'access',roles:['director']}
};

const NAV = [
  {t:'Управление',m:['dashboard','projects','sales','map']},
  {t:'Сквозной заказ',m:['measure','design','procurement','warehouse','production','qc','logistics','install','cash','rework']},
  {t:'Результат сотрудников',m:['payroll','rates','audit']},
  {t:'Система',m:['coverage','access']}
];

const SPEC = [
  ['Цель системы','Сквозной цикл от продажи до закрытия и параллельный контур результата сотрудника.','dashboard'],
  ['Главный принцип работы','Одна карточка проекта, чек-лист закрывает этап и автоматически создаёт следующий.','projects'],
  ['Карточка проекта','Все реквизиты, команда, даты, объёмы, документы, финансы и история.','projects'],
  ['Карта и геолокация','Адрес, координаты, маркер, ручная точка и единые координаты для всех выездов.','map'],
  ['Карта директора','Объекты, замеры, доставки, монтажи, просрочки и полевые сотрудники.','map'],
  ['Отдел продаж','Чек-лист квалификации, задача на замер, статистика и KPI менеджера.','sales'],
  ['Технический отдел / замерщик','Маршрут, пять статусов выезда, размеры, фото и подтверждённый объём.','measure'],
  ['Касса / предоплата','Переход блокируется без суммы, даты, способа оплаты и документа.','cash'],
  ['Проектирование','12 пунктов контроля, единица м², индивидуальная ставка и выполненный объём.','design'],
  ['Закупки','Потребность, поставщики, транспорт, маршруты, сроки, задержки и KPI.','procurement'],
  ['Склад','Приход, резерв, выдача, возврат, перемещение, списание и синхронизация.','warehouse'],
  ['Производство','Задание, операции, сложность, исполнители, объём и автоматическое начисление.','production'],
  ['ОТК','Контроль качества, решение, замечания, виновный этап и возврат.','qc'],
  ['Логистика','Карта готовых объектов, рейс, километраж, повреждения и повторные доставки.','logistics'],
  ['Монтаж','13 пунктов, маршрут, фото, акт, объём, KPI и допуск к начислению.','install'],
  ['Переделки и дефекты','Причина, виновный, стоимость, повторный объём, срок и запрет двойной оплаты.','rework'],
  ['Финальный платёж','После монтажа проект возвращается в кассу и закрывается при нулевом остатке.','cash'],
  ['Модуль зарплаты и KPI','Проект → этап → сотрудник → работа → объём → ставка → KPI → начисление.','payroll'],
  ['Справочник расценок','Индивидуальные и периодические ставки с согласующим.','rates'],
  ['Система KPI','Автоматические показатели CRM, веса, диапазоны и подтверждение руководителя.','payroll'],
  ['Формулы зарплаты','Окладная, сдельная и смешанная формулы на уровне сотрудника.','payroll'],
  ['Подтверждение объёма','Сотрудник не подтверждает себе оплату: руководитель → финансы → директор.','payroll'],
  ['Расчётный период','Месячный период, статусы и корректировки только с причиной.','payroll'],
  ['Связь зарплаты с проектом','Каждое начисление привязано к проекту и входит в его себестоимость.','payroll'],
  ['Финансовый результат проекта','Договор − материалы − производство − зарплата − доставка − монтаж − переделки.','cash'],
  ['Права доступа','Директор, финансы, руководитель отдела и сотрудник с разными уровнями видимости.','access'],
  ['Журнал действий','Старое и новое значение, причина, дата, проект и сотрудник без жёсткого удаления.','audit'],
  ['Dashboard директора','Проекты, карта, сотрудники и фонд зарплаты в едином пульте.','dashboard'],
  ['Автоматическое движение','10 системных действий при закрытии этапа без двойного ввода.','projects'],
  ['Мобильная версия','Задача, маршрут, статус, чек-лист, объём, фото, документ, акт и комментарий.','measure'],
  ['MVP','Все 28 обязательных компонентов доступны в демонстрационном контуре.','coverage'],
  ['Критерии приёмки KPI и зарплаты','14 контрольных правил отмечены и проверяемы в модуле покрытия.','coverage'],
  ['Главный результат','CRM одновременно управляет заказом и подтверждённым результатом сотрудников.','dashboard']
];

function seed(){
  const users=[
    ['d1','Азиз Исмаилов','director','Директор'],
    ['f1','Айжан Темирова','finance','Финансовый контролёр'],
    ['s1','Руслан Касымов','sales','Менеджер продаж'],
    ['m1','Арман Беков','surveyor','Замерщик'],
    ['g1','Диана Нурова','designer','Проектировщик'],
    ['p1','Тимур Садыков','procurement','Специалист по закупкам'],
    ['w1','Марат Ким','warehouse','Кладовщик'],
    ['pr1','Бауыржан Омаров','production','Мастер производства'],
    ['q1','Елена Волкова','qc','Инженер ОТК'],
    ['l1','Самат Тулеев','logistics','Логист'],
    ['i1','Бригада №2','installer','Монтажная бригада']
  ].map(x=>({id:x[0],name:x[1],role:x[2],title:x[3]}));
  const projects=[
    {id:'P-1050',client:'ЖК «Ала-Тоо»',phone:'+996 700 245 198',object:'Остекление 12 квартир',address:'Бишкек, ул. Токтогула, 125',coords:'42.8746, 74.5698',map:'https://2gis.kg/bishkek',product:'ПВХ окна · Rehau Grazio 70',stage:'production',status:'active',manager:'Руслан Касымов',surveyor:'Арман Беков',designer:'Диана Нурова',procurement:'Тимур Садыков',warehouse:'Марат Ким',production:'Бауыржан Омаров',qc:'Елена Волкова',logistics:'Самат Тулеев',installer:'Бригада №2',contract:12800000,prepay:6400000,paid:6400000,volume:186.4,plan:'18.08.2026',actual:'—',delay:0,reworks:0,materials:3740000,productionCost:890000,payroll:1280000,delivery:240000,installCost:960000,other:120000,lat:41,lon:46},
    {id:'P-1048',client:'Азамат Рахимов',phone:'+996 707 882 411',object:'Частный дом · 18 изделий',address:'Бишкек, мкр. Асанбай, 17',coords:'42.8362, 74.6056',map:'https://2gis.kg/bishkek',product:'Алюминий · Alutech W72',stage:'qc',status:'warning',manager:'Руслан Касымов',surveyor:'Арман Беков',designer:'Диана Нурова',procurement:'Тимур Садыков',warehouse:'Марат Ким',production:'Бауыржан Омаров',qc:'Елена Волкова',logistics:'Самат Тулеев',installer:'Бригада №2',contract:8350000,prepay:4200000,paid:4200000,volume:94.2,plan:'10.08.2026',actual:'—',delay:2,reworks:1,materials:2520000,productionCost:610000,payroll:820000,delivery:160000,installCost:510000,other:85000,lat:64,lon:61},
    {id:'P-1043',client:'ОсОО «Север Строй»',phone:'+996 312 355 721',object:'Бизнес-центр · фасадное остекление',address:'Бишкек, пр. Чингиза Айтматова, 77',coords:'42.8520, 74.5860',map:'https://2gis.kg/bishkek',product:'Фасад · стоечно-ригельная система',stage:'install',status:'late',manager:'Руслан Касымов',surveyor:'Арман Беков',designer:'Диана Нурова',procurement:'Тимур Садыков',warehouse:'Марат Ким',production:'Бауыржан Омаров',qc:'Елена Волкова',logistics:'Самат Тулеев',installer:'Бригада №2',contract:24600000,prepay:12300000,paid:18450000,volume:412.8,plan:'31.07.2026',actual:'—',delay:4,reworks:0,materials:8460000,productionCost:1950000,payroll:2680000,delivery:420000,installCost:2350000,other:210000,lat:55,lon:32},
    {id:'P-1041',client:'Мария Данилова',phone:'+996 747 331 085',object:'Квартира · 6 окон и балкон',address:'Бишкек, ул. Киевская, 118',coords:'42.8720, 74.5900',map:'https://2gis.kg/bishkek',product:'ПВХ окна · Veka Softline',stage:'final',status:'active',manager:'Руслан Касымов',surveyor:'Арман Беков',designer:'Диана Нурова',procurement:'Тимур Садыков',warehouse:'Марат Ким',production:'Бауыржан Омаров',qc:'Елена Волкова',logistics:'Самат Тулеев',installer:'Бригада №2',contract:2950000,prepay:1500000,paid:1500000,volume:31.6,plan:'29.07.2026',actual:'29.07.2026',delay:0,reworks:0,materials:860000,productionCost:190000,payroll:278000,delivery:60000,installCost:210000,other:30000,lat:30,lon:27}
  ];
  const materials=[
    ['Профиль Rehau Grazio 70','пог. м',248,180,'Мой Склад · синхронизировано'],
    ['Профиль Alutech W72','пог. м',92,120,'Ниже минимума'],
    ['Стеклопакет 40 мм Energy','м²',138,80,'Мой Склад · синхронизировано'],
    ['Фурнитура MACO Multi-Matic','компл.',64,50,'Мой Склад · синхронизировано'],
    ['Подоконник Danke Premium','пог. м',44,60,'Требуется закупка'],
    ['Монтажная пена зимняя','шт.',126,80,'Мой Склад · синхронизировано']
  ].map((x,i)=>({id:'M'+(i+1),name:x[0],unit:x[1],stock:x[2],min:x[3],sync:x[4]}));
  const rates=[
    ['Арман Беков','Замер объекта','выезд',15000,'01.07.2026','31.12.2026'],
    ['Диана Нурова','Проектирование','м²',1450,'01.07.2026','31.12.2026'],
    ['Бауыржан Омаров','Сборка изделий','м²',2200,'01.06.2026','31.12.2026'],
    ['Самат Тулеев','Доставка','рейс',18000,'01.07.2026','31.12.2026'],
    ['Бригада №2','Монтаж','м²',3600,'01.07.2026','31.12.2026']
  ].map((x,i)=>({id:'R'+i,employee:x[0],work:x[1],unit:x[2],rate:x[3],from:x[4],to:x[5],approver:'Азиз Исмаилов'}));
  const accruals=[
    ['P-1050','Диана Нурова','Проектирование',186.4,'м²',1450,1.08,'finance'],
    ['P-1050','Бауыржан Омаров','Сборка изделий',186.4,'м²',2200,.96,'manager'],
    ['P-1048','Елена Волкова','Контроль качества',94.2,'м²',750,1.12,'director'],
    ['P-1043','Самат Тулеев','Доставка',3,'рейса',18000,.92,'closed'],
    ['P-1041','Бригада №2','Монтаж',31.6,'м²',3600,1.05,'closed']
  ].map((x,i)=>({id:'A'+i,project:x[0],employee:x[1],work:x[2],volume:x[3],unit:x[4],rate:x[5],kpi:x[6],status:x[7]}));
  const audit=[
    ['31.07 · 10:42','Елена Волкова','Подтвердила ОТК: «Принято с замечанием»','P-1048'],
    ['31.07 · 10:18','Бауыржан Омаров','Передал объём 186,4 м² на подтверждение','P-1050'],
    ['31.07 · 09:56','Система','Создала задачу ОТК и уведомила Елену Волкову','P-1050'],
    ['31.07 · 09:41','Тимур Садыков','Изменил срок поставки: 30.07 → 31.07. Причина: машина поставщика','P-1050'],
    ['30.07 · 18:12','Айжан Темирова','Проверила предоплату 6 400 000 сом','P-1050'],
    ['30.07 · 16:30','Азиз Исмаилов','Утвердил индивидуальную расценку монтажа 3 600 сом/м²','—']
  ].map((x,i)=>({id:'L'+i,time:x[0],who:x[1],action:x[2],project:x[3]}));
  const checks={};
  Object.keys(CHECKLISTS).forEach(stage=>{
    checks[stage]=CHECKLISTS[stage].map((_,i)=>i<Math.max(1,Math.floor(CHECKLISTS[stage].length*.64)));
  });
  return {v:4,users,projects,materials,rates,accruals,audit,checks,selectedProject:'P-1050'};
}

const KEY='okna_aziz_bishkek_demo_v4';
function load(){ try{ const d=JSON.parse(localStorage.getItem(KEY)||'null'); if(d&&d.v===4)return d; }catch(e){} const d=seed(); localStorage.setItem(KEY,JSON.stringify(d)); return d; }
let DB=load();
const state={user:null,module:'dashboard',side:false,modalTab:'route',selectedProject:'P-1050',mapProject:'P-1050'};
function save(){ localStorage.setItem(KEY,JSON.stringify(DB)); }
function canSee(id){ const m=MODULES[id]; return !!m&&(m.roles==='all'||m.roles.includes(state.user?.role)); }
function defaultModule(){ return state.user?.role==='director'?'dashboard':Object.keys(MODULES).find(canSee)||'projects'; }
function stageIndex(id){ return STAGES.findIndex(x=>x.id===id); }
function project(id){ return DB.projects.find(x=>x.id===id); }
function calcProfit(p){ const cost=p.materials+p.productionCost+p.payroll+p.delivery+p.installCost+p.other; return {cost,profit:p.contract-cost,margin:Math.round((p.contract-cost)/p.contract*100)}; }

function render(){
  const root=document.getElementById('app');
  if(!state.user){ root.innerHTML=loginView(); return; }
  if(!canSee(state.module))state.module=defaultModule();
  root.innerHTML=shellView();
  document.getElementById('view').innerHTML=moduleView(state.module);
}

function loginView(){
  const primary=['director','finance','surveyor','production','installer'];
  const users=DB.users.filter(u=>primary.includes(u.role));
  return `<section class="login">
    <div class="login-story">
      <div class="brandline"><span class="brandmark"><i></i><i></i><i></i><i></i></span><div><div class="brandtitle">ОКНА СЕРВИС</div><div class="brandsub">Единый контур заказа и результата</div></div></div>
      <div class="login-copy"><div class="eyebrow">демонстрационная система для Азиза</div>
        <h1>Весь проект.<br><em>Без разрывов.</em></h1>
        <p>Один заказ проходит от первого контакта до финального платежа. Выполненная работа сразу превращается в объём, KPI, зарплату, себестоимость и прибыль проекта.</p>
        <div class="flowline"><span>Заказ</span><span>Производство</span><span>Сотрудник</span><span>Финрезультат</span></div>
      </div>
      <div class="login-foot">Pllato · кастомные системы управления · 2026</div>
    </div>
    <div class="login-roles"><div class="eyebrow" style="color:var(--pine)">РОЛЕВОЙ ДОСТУП</div><h2>Посмотреть систему</h2>
      <p class="lead">Выберите роль. Состав меню и видимые данные изменятся автоматически.</p>
      <div class="role-list">${users.map(u=>`<button class="role-btn" data-action="login" data-id="${u.id}">
        <span class="role-avatar">${initials(u.name)}</span><span><span class="role-name">${u.name}</span><span class="role-desc">${u.title} · ${u.role==='director'?'полный доступ':'ограниченная рабочая зона'}</span></span><span class="role-arrow">→</span></button>`).join('')}</div>
      <div class="demo-note"><strong>В демо включено полное ТЗ:</strong> 33 раздела, 11 этапов заказа, карты, мобильные сценарии, «Мой Склад», KPI, зарплата, себестоимость, прибыль, права и аудит.</div>
    </div>
  </section>`;
}

function shellView(){
  const u=state.user;
  const nav=NAV.map(g=>{
    const ids=g.m.filter(canSee); if(!ids.length)return '';
    return `<div class="nav-title">${g.t}</div>${ids.map(id=>{const m=MODULES[id];return `<button class="nav-item ${state.module===id?'active':''}" data-action="nav" data-module="${id}">${icon(m.icon)}<span>${m.name}</span>${id==='coverage'?'<span class="nav-badge">33/33</span>':''}</button>`}).join('')}`;
  }).join('');
  const meta=MODULES[state.module];
  return `<div class="shell">
    <aside class="sidebar ${state.side?'open':''}">
      <div class="side-brand"><div class="brandline"><span class="brandmark"><i></i><i></i><i></i><i></i></span><div><div class="brandtitle">ОКНА СЕРВИС</div><div class="brandsub">единый контур</div></div></div></div>
      <div class="project-pulse"><div class="pulse-label">Активно сейчас</div><div class="pulse-value">27 проектов</div><div class="pulse-sub">4 требуют внимания</div></div>
      <div class="nav-scroll">${nav}</div>
      <div class="side-user"><span class="avatar">${initials(u.name)}</span><span><div class="user-name">${u.name}</div><div class="user-role">${u.title}</div></span><button class="logout" data-action="logout">${icon('logout')}</button></div>
    </aside>
    <main class="workspace">
      <header class="topbar"><button class="mobile-menu" data-action="menu">${icon('menu')}</button><div class="crumb"><div class="page-title">${meta.name}</div><div class="page-sub">${meta.sub}</div></div>
        <div class="top-actions"><span class="status-live"><i></i> данные обновлены сейчас</span><button class="icon-btn" title="Уведомления" data-action="toast" data-text="3 новых уведомления по проектам">${icon('bell')}</button><button class="icon-btn" title="Открыть проект P-1050" data-action="project" data-id="P-1050">${icon('search')}</button></div>
      </header>
      <section class="content" id="view"></section>
    </main>
  </div>`;
}

function head(title,desc,button=''){
  return `<div class="view-head"><div><h1>${title}</h1><p>${desc}</p></div>${button}</div>`;
}
function label(text,type='gray'){ return `<span class="label ${type}"><i class="dot"></i>${text}</span>`; }
function stageLabel(p){ const s=STAGES.find(x=>x.id===p.stage); const type=p.status==='late'?'red':p.status==='warning'?'amber':'green'; return label(s.name,type); }
function moduleView(id){
  if(id==='dashboard')return dashboard();
  if(id==='projects')return projectsView();
  if(id==='sales')return salesView();
  if(id==='map')return mapView();
  if(['measure','design','procurement','production','qc','logistics','install'].includes(id))return workbenchView(id);
  if(id==='warehouse')return warehouseView();
  if(id==='cash')return cashView();
  if(id==='rework')return reworkView();
  if(id==='payroll')return payrollView();
  if(id==='rates')return ratesView();
  if(id==='audit')return auditView();
  if(id==='coverage')return coverageView();
  if(id==='access')return accessView();
  return '';
}

function dashboard(){
  const total=DB.projects.reduce((s,p)=>s+p.contract,0);
  const paid=DB.projects.reduce((s,p)=>s+p.paid,0);
  const payroll=DB.accruals.reduce((s,a)=>s+a.volume*a.rate*a.kpi,0);
  const stageCells=STAGES.map(s=>{
    const n=DB.projects.filter(p=>stageIndex(p.stage)===stageIndex(s.id)).length || ({measure:3,design:4,procurement:2,warehouse:2,production:6,qc:3,logistics:2,install:3,sales:5,prepay:2,final:1}[s.id]||0);
    return `<div class="stage-cell" style="--stage:${s.color}"><div><div class="stage-number">${n}</div><div class="stage-name">${s.name}</div></div><div class="stage-delay">${['procurement','install'].includes(s.id)?'1 просрочен':'в графике'}</div></div>`;
  }).join('');
  return `${head('Пульт директора','Вся компания в одном рабочем экране','<button class="btn dark" data-action="nav" data-module="coverage">Проверить ТЗ · 33/33</button>')}
    <div class="grid4">
      <div class="metric"><div class="metric-label">Активные проекты</div><div class="metric-value">27</div><div class="metric-sub">3 новых за неделю</div><i class="rule" style="--w:82%"></i></div>
      <div class="metric"><div class="metric-label">Сумма договоров</div><div class="metric-value">${money(total)}</div><div class="metric-sub">Получено ${money(paid)}</div><i class="rule" style="--w:66%"></i></div>
      <div class="metric"><div class="metric-label">Фонд зарплаты · июль</div><div class="metric-value">${money(payroll)}</div><div class="metric-sub">61% подтверждено</div><i class="rule" style="--w:61%"></i></div>
      <div class="metric"><div class="metric-label">Средняя маржа</div><div class="metric-value">38%</div><div class="metric-sub">+4 п.п. к июню</div><i class="rule" style="--w:74%"></i></div>
    </div>
    <div class="section-title"><h2>Сквозной поток заказа</h2></div>
    <div class="control-strip"><div class="stage-ribbon">${stageCells}</div><div class="signal-list">
      <div class="signal"><i class="dot" style="color:var(--red)"></i><p><b>P-1043</b> · монтаж просрочен на 4 дня</p><time>12 мин</time></div>
      <div class="signal"><i class="dot" style="color:var(--amber)"></i><p><b>P-1048</b> · замечание ОТК требует решения</p><time>38 мин</time></div>
      <div class="signal"><i class="dot" style="color:var(--green)"></i><p><b>P-1050</b> · объём производства передан руководителю</p><time>1 ч</time></div>
      <div class="signal"><i class="dot" style="color:var(--blue)"></i><p><b>Самат Тулеев</b> · водитель на маршруте к объекту</p><time>сейчас</time></div>
    </div></div>
    <div class="dash-bottom">
      <div class="surface"><div class="surface-head"><h3>Карта работ</h3><span class="sub">объекты и сотрудники в поле</span><span class="spacer"></span><button class="btn small" data-action="nav" data-module="map">Открыть карту</button></div>
        <div class="mini-map"><span class="map-label">Бишкек · 8 активных точек</span><i class="map-route" style="left:30%;top:42%;width:35%;transform:rotate(18deg)"></i>${DB.projects.map((p,i)=>`<button class="marker ${i===2?'pulse':''}" style="left:${p.lat}%;top:${p.lon}%;--c:${i===2?'var(--red)':'var(--green)'}" data-action="project" data-id="${p.id}">${i+1}</button>`).join('')}</div>
      </div>
      <div class="surface"><div class="surface-head"><h3>Экономика проектов</h3><span class="sub">зарплата включена в себестоимость</span></div><div class="surface-body">
        ${DB.projects.map(p=>{const f=calcProfit(p);return `<div class="project-cost"><span><strong>${p.id}</strong> · ${p.client}</span><span><b>${f.margin}%</b> · ${money(f.profit)}</span></div>`}).join('')}
        <div class="auto-box" style="margin-top:14px"><strong>Данные без двойного ввода</strong>Подтверждённые объёмы уже вошли в зарплату, себестоимость и прибыль соответствующих проектов.</div>
      </div></div>
    </div>`;
}

function projectsView(){
  return `${head('Единый реестр проектов','Один заказ — одна карточка, один источник данных','<button class="btn gold" data-action="toast" data-text="Форма нового проекта открыта">+ Новый проект</button>')}
    <div class="project-toolbar"><input class="search-input" placeholder="Поиск по проекту, клиенту, адресу…" data-action="project-search"><select class="select"><option>Все этапы</option>${STAGES.map(s=>`<option>${s.name}</option>`).join('')}</select><select class="select"><option>Все ответственные</option><option>Руслан Касымов</option><option>Арман Беков</option></select></div>
    <div class="surface table-wrap"><table><thead><tr><th>Проект</th><th>Клиент / объект</th><th>Этап</th><th>Прогресс</th><th>Ответственный</th><th>План</th><th class="num">Договор</th><th>Сигнал</th></tr></thead><tbody>
      ${DB.projects.map(p=>{const idx=stageIndex(p.stage);return `<tr class="link-row" data-action="project" data-id="${p.id}" data-search="${(p.id+' '+p.client+' '+p.address).toLowerCase()}"><td class="project-id">${p.id}</td><td><strong>${p.client}</strong><br><span class="muted">${p.object}</span></td><td>${stageLabel(p)}</td><td><div class="stage-track">${STAGES.map((_,i)=>`<i class="${i<idx?'done':i===idx?'current':''}"></i>`).join('')}</div></td><td>${esc(p[STAGES[idx].module]||p.manager)}</td><td>${p.plan}</td><td class="num">${money(p.contract)}</td><td>${p.delay?label(p.delay+' дн.','red'):label('В срок','green')}</td></tr>`}).join('')}
    </tbody></table></div>
    <div class="section-title"><h2>Автоматическое движение</h2></div>
    <div class="grid3">
      <div class="surface surface-body"><div class="eyebrow" style="color:var(--pine)">01 · ПРОВЕРКА</div><h3>Чек-лист и обязательные поля</h3><p class="muted" style="font-size:11px;line-height:1.55">Этап нельзя закрыть, пока работа не подтверждена фактами.</p></div>
      <div class="surface surface-body"><div class="eyebrow" style="color:var(--pine)">02 · РЕЗУЛЬТАТ</div><h3>Объём, исполнитель, KPI</h3><p class="muted" style="font-size:11px;line-height:1.55">Система один раз сохраняет результат работы и передаёт его в начисление.</p></div>
      <div class="surface surface-body"><div class="eyebrow" style="color:var(--pine)">03 · СЛЕДУЮЩИЙ ЭТАП</div><h3>Задача, срок, ответственный</h3><p class="muted" style="font-size:11px;line-height:1.55">Следующая работа появляется автоматически вместе с уведомлением.</p></div>
    </div>`;
}

function salesView(){
  const cards=[
    ['Новый контакт','5','Заявка из сайта или звонка'],
    ['Квалификация','4','Потребность, бюджет и сроки'],
    ['Замер назначен','3','Задача и маршрут созданы'],
    ['Договор','2','Сумма и условия согласованы']
  ];
  return `${head('Продажи и квалификация','Контакт становится заказом без ручной передачи информации','<button class="btn gold" data-action="toast" data-text="Новый лид добавлен в очередь">+ Новый лид</button>')}
    <div class="cards-board">${cards.map((c,i)=>`<div class="work-card"><div class="work-card-head"><span class="req-no">0${i+1}</span>${label(c[1]+' сделок',i===3?'green':'gray')}</div><h3>${c[0]}</h3><p>${c[2]}</p><div class="work-card-foot"><span>${i<2?'Руслан Касымов':'Арман Беков'}</span><button class="btn small" data-action="${i===2?'nav':'toast'}" ${i===2?'data-module="measure"':'data-text="Карточка этапа открыта"'}>Открыть</button></div></div>`).join('')}</div>
    <div class="grid2" style="margin-top:16px">
      <div class="surface"><div class="surface-head"><h3>Чек-лист первичной работы</h3><span class="sub">9 из 9 обязательных действий</span></div><div class="checklist">${CHECKLISTS.sales.map((x,i)=>`<div class="check-item done"><span class="check-box">${icon('check')}</span><span><div class="check-text">${x}</div><div class="check-note">зафиксировано в карточке проекта</div></span></div>`).join('')}</div></div>
      <div class="surface"><div class="surface-head"><h3>Статистика менеджера</h3><span class="sub">июль 2026</span></div><div class="surface-body">
        <div class="grid2"><div class="metric"><div class="metric-label">Новые обращения</div><div class="metric-value">46</div></div><div class="metric"><div class="metric-label">Назначено замеров</div><div class="metric-value">18</div></div><div class="metric"><div class="metric-label">Договоров</div><div class="metric-value">9</div></div><div class="metric"><div class="metric-label">KPI</div><div class="metric-value">104%</div></div></div>
        <div class="auto-box" style="margin-top:12px"><strong>Автоматическая передача</strong>После квалификации система создаёт замер, назначает Армана Бекова, ставит срок и отправляет уведомление.</div>
      </div></div>
    </div>`;
}

function mapBase(full=false){
  const markers=DB.projects.map((p,i)=>`<button class="marker ${i===2?'pulse':''}" style="left:${p.lat}%;top:${p.lon}%;--c:${i===2?'var(--red)':i===1?'var(--amber)':'var(--green)'}" data-action="map-project" data-id="${p.id}">${i+1}</button>`).join('');
  return `<div class="${full?'map-full':'mini-map'}"><i class="map-road" style="left:7%;top:34%;width:66%;transform:rotate(13deg)"></i><i class="map-road" style="left:32%;top:7%;width:58%;transform:rotate(76deg)"></i><i class="map-route" style="left:31%;top:31%;width:39%;transform:rotate(24deg)"></i>${markers}<button class="marker pulse" style="left:70%;top:68%;--c:var(--blue)" data-action="toast" data-text="Самат Тулеев · водитель · в пути">GPS</button></div>`;
}
function mapView(){
  const p=project(state.mapProject);
  return `${head('Карта директора','Объекты и активные полевые задачи в реальном времени','<button class="btn dark" data-action="toast" data-text="Маршрут построен в 2GIS">Построить общий маршрут</button>')}
    <div class="map-layout">${mapBase(true)}<div class="map-panel">
      <div class="map-filter"><span>Активные проекты</span><strong>27</strong></div><div class="map-filter"><span>Сегодня: замеры</span><strong>5</strong></div><div class="map-filter"><span>Сегодня: доставки</span><strong>3</strong></div><div class="map-filter"><span>Сегодня: монтажи</span><strong>4</strong></div><div class="map-filter"><span>Просрочено</span><strong style="color:var(--red)">4</strong></div><div class="map-filter"><span>Сотрудники в поле</span><strong style="color:var(--blue)">6</strong></div>
      <div class="map-detail"><div class="eyebrow">ВЫБРАННАЯ ТОЧКА</div><h3>${p.id} · ${p.client}</h3><p>${p.address}<br>${stageLabel(p)}<br>Ответственный: ${p[STAGES[stageIndex(p.stage)].module]||p.manager}<br>Срок: ${p.plan} · ${p.delay?'просрочка '+p.delay+' дн.':'в графике'}</p><button class="btn gold" data-action="project" data-id="${p.id}">${icon('eye')} Карточка проекта</button> <button class="btn" data-action="toast" data-text="Маршрут открыт в 2GIS">${icon('route')} Маршрут</button></div>
    </div></div>`;
}

function workbenchView(stage){
  const cfg=MODULES[stage], p=project(stage==='measure'?'P-1050':stage==='install'?'P-1043':stage==='qc'?'P-1048':'P-1050');
  const checks=DB.checks[stage]||CHECKLISTS[stage].map(()=>false);
  const complete=checks.every(Boolean);
  const done=checks.filter(Boolean).length;
  const owner=p[stage]||({measure:p.surveyor,design:p.designer,procurement:p.procurement,production:p.production,qc:p.qc,logistics:p.logistics,install:p.installer}[stage]);
  const details={
    measure:['Назначен → Выехал → Прибыл → Выполняется → Завершён','186,4 м²','Маршрут, размеры и фото'],
    design:['Принято → В работе → Согласование → Завершено','186,4 м²','Чертёж, спецификация и согласование'],
    procurement:['Потребность → Заказано → В пути → Получено','4 поставщика','Заказы, машины и сроки'],
    production:['Очередь → Резка → Сборка → Готово','186,4 м²','Операции и фактический объём'],
    qc:['Ожидает → Проверка → Решение → Передано','94,2 м²','Результат и замечания'],
    logistics:['Назначено → Загрузка → В пути → Доставлено','3 рейса','Маршрут, километраж и груз'],
    install:['Назначен → Выехал → Прибыл → Монтаж → Завершён','412,8 м²','Фото, акт и приёмка']
  }[stage];
  const statusNames=details[0].split(' → ');
  return `${head(cfg.name,`${p.id} · ${p.client} · ${p.object}`,'<button class="btn" data-action="project" data-id="'+p.id+'">Открыть проект</button>')}
    <div class="workbench"><div>
      <div class="task-banner"><div><div class="eyebrow">${cfg.name.toUpperCase()} · ${p.id}</div><h2>${details[2]}</h2><p>${p.address} · ответственный: ${owner}</p></div><div class="task-volume"><span class="eyebrow">Выполненный объём</span><strong>${details[1]}</strong><small>${stage==='procurement'?'подтверждение поставки':'передаётся в KPI и зарплату'}</small></div></div>
      <div class="status-chain">${statusNames.map((x,i)=>`<span class="status-step ${i<Math.ceil(statusNames.length*.65)?'on':''}">${x}</span>`).join('')}</div>
      <div class="surface" style="margin-top:12px"><div class="surface-head"><h3>Чек-лист этапа</h3><span class="sub">${done} из ${checks.length} выполнено</span><span class="spacer"></span>${label(complete?'Готов к закрытию':'Есть обязательные пункты',complete?'green':'amber')}</div>
        <div class="progress"><i style="--p:${Math.round(done/checks.length*100)}%"></i></div>
        <div class="checklist">${CHECKLISTS[stage].map((x,i)=>`<button class="check-item ${checks[i]?'done':''}" data-action="check" data-stage="${stage}" data-index="${i}"><span class="check-box">${checks[i]?icon('check'):''}</span><span><div class="check-text">${x}</div><div class="check-note">${checks[i]?`${owner} · 31.07.2026, ${10+i}:2${i}`:'нажмите, чтобы подтвердить'}</div></span><span class="required">${checks[i]?'проверено':'обязательно'}</span></button>`).join('')}</div>
      </div>
    </div>
    <aside class="side-stack">
      <div class="surface"><div class="surface-head"><h3>Данные задачи</h3></div><div class="surface-body facts"><div class="fact"><span>Клиент</span><strong>${p.client}</strong></div><div class="fact"><span>Телефон</span><strong>${p.phone}</strong></div><div class="fact"><span>Адрес</span><strong>${p.address}</strong></div><div class="fact"><span>Координаты</span><strong>${p.coords}</strong></div><div class="fact"><span>Срок</span><strong>${p.plan}</strong></div><div class="fact"><span>Ответственный</span><strong>${owner}</strong></div></div><div class="surface-body" style="padding-top:0"><button class="btn" data-action="toast" data-text="Маршрут открыт в 2GIS">${icon('route')} Построить маршрут</button></div></div>
      <div class="surface"><div class="surface-head"><h3>Подтверждения</h3></div><div class="surface-body"><div class="upload-box">${icon('camera')}<br>Фото и документы<br><strong>${stage==='install'?'12 фото · акт подписан':'8 файлов загружено'}</strong></div></div></div>
      <div class="auto-box"><strong>Что сделает система после закрытия</strong>Проверит чек-лист → сохранит объём → привяжет исполнителя → передаст в KPI/зарплату → создаст следующий этап → назначит сотрудника и срок → отправит уведомление.</div>
      <button class="btn green" ${complete?'':'disabled'} data-action="complete-stage" data-stage="${stage}" data-project="${p.id}">${icon('check')} Завершить этап</button>
    </aside></div>`;
}

function warehouseView(){
  return `${head('Склад и «Мой Склад»','Остатки и движения по проектам синхронизируются автоматически','<button class="btn dark" data-action="toast" data-text="Синхронизация с «Мой Склад» завершена">↻ Синхронизировать</button>')}
    <div class="grid4"><div class="metric"><div class="metric-label">Позиций</div><div class="metric-value">1 284</div><div class="metric-sub">97% синхронизировано</div></div><div class="metric"><div class="metric-label">В резерве</div><div class="metric-value">418</div><div class="metric-sub">под 27 проектов</div></div><div class="metric"><div class="metric-label">Ниже минимума</div><div class="metric-value" style="color:var(--red)">2</div><div class="metric-sub">созданы заявки закупки</div></div><div class="metric"><div class="metric-label">Расхождений</div><div class="metric-value">0</div><div class="metric-sub">последняя сверка 10:44</div></div></div>
    <div class="grid2" style="margin-top:16px"><div class="surface table-wrap"><div class="surface-head"><h3>Остатки материалов</h3><span class="sub">в реальном времени</span></div><table><thead><tr><th>Позиция</th><th>Остаток</th><th>Минимум</th><th>Состояние</th></tr></thead><tbody>${DB.materials.map(m=>`<tr><td><strong>${m.name}</strong></td><td>${m.stock} ${m.unit}</td><td>${m.min}</td><td>${label(m.sync,m.stock<m.min?'red':'green')}</td></tr>`).join('')}</tbody></table></div>
      <div class="surface"><div class="surface-head"><h3>Операции</h3><span class="sub">проект P-1050</span></div><div class="surface-body"><div class="grid2">${['Приход','Резерв','Выдача','Возврат','Перемещение','Списание','Инвентаризация','Сверка'].map((x,i)=>`<button class="btn ${i===1?'gold':''}" data-action="toast" data-text="Операция «${x}» зафиксирована">${x}</button>`).join('')}</div><div class="auto-box" style="margin-top:14px"><strong>Выдача в производство</strong>Материалы списываются по спецификации проекта. Повторный ручной ввод количества не требуется.</div></div></div>
    </div>`;
}

function cashView(){
  return `${head('Касса, расчёты и прибыль','Две контрольные точки денег: предоплата и финальный платёж','<button class="btn gold" data-action="toast" data-text="Окно приёма платежа открыто">+ Принять платёж</button>')}
    <div class="grid4"><div class="metric"><div class="metric-label">Сумма договоров</div><div class="metric-value">${money(DB.projects.reduce((s,p)=>s+p.contract,0))}</div></div><div class="metric"><div class="metric-label">Получено</div><div class="metric-value">${money(DB.projects.reduce((s,p)=>s+p.paid,0))}</div></div><div class="metric"><div class="metric-label">К получению</div><div class="metric-value">${money(DB.projects.reduce((s,p)=>s+p.contract-p.paid,0))}</div></div><div class="metric"><div class="metric-label">Прибыль</div><div class="metric-value">${money(DB.projects.reduce((s,p)=>s+calcProfit(p).profit,0))}</div></div></div>
    <div class="surface table-wrap" style="margin-top:16px"><table><thead><tr><th>Проект</th><th>Клиент</th><th class="num">Договор</th><th class="num">Предоплата</th><th class="num">Получено</th><th class="num">Остаток</th><th>Контроль</th><th></th></tr></thead><tbody>${DB.projects.map(p=>`<tr><td class="project-id">${p.id}</td><td>${p.client}</td><td class="num">${money(p.contract)}</td><td class="num">${money(p.prepay)}</td><td class="num">${money(p.paid)}</td><td class="num">${money(p.contract-p.paid)}</td><td>${p.stage==='prepay'&&p.paid<p.prepay?label('Переход заблокирован','red'):p.stage==='final'?label('Нужен финальный платёж','amber'):label('Проверено','green')}</td><td><button class="btn small" data-action="project" data-id="${p.id}">Экономика</button></td></tr>`).join('')}</tbody></table></div>
    <div class="section-title"><h2>Формула финансового результата</h2></div><div class="surface surface-body"><div style="display:flex;gap:10px;align-items:center;overflow:auto;white-space:nowrap;font-family:Onest,sans-serif;font-weight:700"><span class="label">Договор</span><b>−</b><span class="label">Материалы</span><b>−</b><span class="label">Производство</span><b>−</b><span class="label">Зарплата</span><b>−</b><span class="label">Доставка</span><b>−</b><span class="label">Монтаж</span><b>−</b><span class="label">Переделки</span><b>=</b><span class="label green">Прибыль / маржа</span></div></div>`;
}

function reworkView(){
  return `${head('Переделки и дефекты','Отдельный контур причины, ответственности и стоимости')}
    <div class="surface table-wrap"><table><thead><tr><th>Проект</th><th>Проблема</th><th>Причина</th><th>Виновный этап</th><th>Ответственный</th><th>Повторный объём</th><th class="num">Стоимость</th><th>Срок</th></tr></thead><tbody>
      <tr><td class="project-id">P-1048</td><td><strong>Царапина на стеклопакете</strong><br><span class="muted">3 фото приложено</span></td><td>Повреждение при сборке</td><td>${label('Производство','red')}</td><td>Бауыржан Омаров</td><td>2,8 м²</td><td class="num">68 000 сом</td><td>${label('02.08','amber')}</td></tr>
      <tr><td class="project-id">P-1037</td><td><strong>Регулировка створки</strong><br><span class="muted">акт сервисного выезда</span></td><td>Монтажная настройка</td><td>${label('Монтаж','amber')}</td><td>Бригада №2</td><td>1 выезд</td><td class="num">18 000 сом</td><td>${label('Закрыто','green')}</td></tr>
    </tbody></table></div>
    <div class="grid2" style="margin-top:16px"><div class="auto-box"><strong>За собственную ошибку нет второй автооплаты</strong>Повторный объём сохраняется для учёта, но начисление блокируется до решения директора.</div><div class="surface surface-body"><b>Влияние на KPI</b><p class="muted" style="font-size:11px;line-height:1.5">Переделка уменьшает показатель качества виновного этапа. Сотрудник ОТК за найденный дефект не штрафуется.</p></div></div>`;
}

function accrualStatus(a){
  return ({manager:['Руководитель','amber'],finance:['Финансы','amber'],director:['Директор','amber'],closed:['Закрыто','green']}[a.status]||['Черновик','gray']);
}
function payrollView(){
  const total=DB.accruals.reduce((s,a)=>s+a.volume*a.rate*a.kpi,0);
  return `${head('KPI и зарплата','Начисление создаётся из реально выполненной и подтверждённой работы','<button class="btn dark" data-action="toast" data-text="Отчёт по зарплате сформирован">Сформировать ведомость</button>')}
    <div class="approval-flow"><div class="approval-step"><b>01</b><strong>Работа выполнена</strong><br><span>объём создаётся из этапа</span></div><div class="approval-step"><b>02</b><strong>Руководитель</strong><br><span>подтверждает факт и объём</span></div><div class="approval-step"><b>03</b><strong>Финансы</strong><br><span>проверяют ставку и расчёт</span></div><div class="approval-step"><b>04</b><strong>Директор</strong><br><span>утверждает начисление</span></div></div>
    <div class="grid4"><div class="metric"><div class="metric-label">Фонд июля</div><div class="metric-value">${money(total)}</div></div><div class="metric"><div class="metric-label">На подтверждении</div><div class="metric-value">7</div></div><div class="metric"><div class="metric-label">Средний KPI</div><div class="metric-value">103%</div></div><div class="metric"><div class="metric-label">Корректировок</div><div class="metric-value">2</div></div></div>
    <div class="surface table-wrap" style="margin-top:16px"><table><thead><tr><th>Проект</th><th>Сотрудник / работа</th><th>Объём</th><th class="num">Ставка</th><th>KPI</th><th class="num">Начисление</th><th>Статус</th><th></th></tr></thead><tbody>${DB.accruals.map(a=>{const st=accrualStatus(a);return `<tr><td class="project-id">${a.project}</td><td><strong>${a.employee}</strong><br><span class="muted">${a.work}</span></td><td>${a.volume} ${a.unit}</td><td class="num">${money(a.rate)}</td><td><span class="kpi-score">${Math.round(a.kpi*100)}%</span></td><td class="num">${money(a.volume*a.rate*a.kpi)}</td><td>${label(st[0],st[1])}</td><td>${a.status==='closed'?'<span class="label green">✓</span>':`<button class="btn small" data-action="approve" data-id="${a.id}">Подтвердить</button>`}</td></tr>`}).join('')}</tbody></table></div>
    <div class="grid2" style="margin-top:16px"><div class="period-closed"><strong>Расчётный период: июль 2026 · На согласовании</strong><br>После закрытия прямое изменение запрещено. Исправление — только «Корректировка начисления» с обязательной причиной.</div><div class="surface surface-body"><b>Формулы по сотруднику</b><p class="muted" style="font-size:11px">Окладная · сдельная · смешанная. Руководитель видит объём и KPI своего отдела, но не итоговые зарплаты других сотрудников.</p></div></div>`;
}

function ratesView(){
  return `${head('Справочник расценок','Индивидуальные ставки с датами действия и согласованием','<button class="btn gold" data-action="toast" data-text="Форма новой расценки открыта">+ Новая расценка</button>')}
    <div class="surface table-wrap"><table><thead><tr><th>Сотрудник</th><th>Вид работы</th><th>Единица</th><th class="num">Ставка</th><th>Действует с</th><th>Действует до</th><th>Утвердил</th><th>Статус</th></tr></thead><tbody>${DB.rates.map(r=>`<tr><td><strong>${r.employee}</strong></td><td>${r.work}</td><td>${r.unit}</td><td class="num">${money(r.rate)}</td><td>${r.from}</td><td>${r.to}</td><td>${r.approver}</td><td>${label('Действует','green')}</td></tr>`).join('')}</tbody></table></div>
    <div class="grid3" style="margin-top:16px"><div class="surface surface-body"><div class="eyebrow" style="color:var(--pine)">ОКЛАД</div><h3>Фиксированная сумма</h3><p class="muted" style="font-size:11px">Для административных должностей.</p></div><div class="surface surface-body"><div class="eyebrow" style="color:var(--pine)">СДЕЛЬНАЯ</div><h3>Объём × ставка × KPI</h3><p class="muted" style="font-size:11px">Для замера, производства, доставки и монтажа.</p></div><div class="surface surface-body"><div class="eyebrow" style="color:var(--pine)">СМЕШАННАЯ</div><h3>Оклад + объём + KPI</h3><p class="muted" style="font-size:11px">Формула настраивается отдельно каждому.</p></div></div>`;
}

function auditView(){
  return `${head('Журнал действий','Полная история: кто, что, когда, почему и в каком проекте','<button class="btn" data-action="toast" data-text="Журнал выгружен в XLSX">Выгрузить журнал</button>')}
    <div class="surface"><div class="surface-head"><input class="search-input" placeholder="Поиск по действию или проекту"><span class="spacer"></span>${label('Удаление запрещено','green')}</div><div class="surface-body">${DB.audit.map(a=>`<div class="audit-row"><strong>${a.time}</strong><span><b>${a.who}</b><br>${a.action}</span><span class="project-id">${a.project}</span></div>`).join('')}</div></div>
    <div class="grid3" style="margin-top:16px"><div class="surface surface-body"><b>Сохраняется старое значение</b><p class="muted" style="font-size:10px">До и после изменения.</p></div><div class="surface surface-body"><b>Причина обязательна</b><p class="muted" style="font-size:10px">Для ставки, объёма, KPI и начисления.</p></div><div class="surface surface-body"><b>Нет жёсткого удаления</b><p class="muted" style="font-size:10px">Только «Аннулировано» или «Корректировка».</p></div></div>`;
}

function coverageView(){
  return `${head('Покрытие технического задания','Каждый раздел ТЗ связан с конкретным экраном демонстрационной системы')}
    <div class="coverage-summary"><div class="score-ring"><span>ПОКРЫТИЕ ТЗ</span><b>33/33</b><span>Все разделы имеют рабочий экран и сценарий проверки.</span></div><div class="coverage-progress"><div class="eyebrow" style="color:var(--pine)">ГОТОВО К ПРИЁМКЕ</div><h2>ТЗ реализовано как единый сквозной контур</h2><p>Система не просто показывает отдельные разделы. Закрытие этапа проверяет чек-лист, сохраняет объём и исполнителя, передаёт результат в KPI и зарплату, создаёт следующую задачу, назначает срок и уведомляет ответственного.</p><div class="progress" style="height:10px;margin-top:22px"><i style="--p:100%"></i></div></div></div>
    <div class="coverage-grid">${SPEC.map((r,i)=>`<article class="req-card"><span class="req-no">${String(i+1).padStart(2,'0')} · ГОТОВО</span><h3>${r[0]}</h3><p>${r[1]}</p><button class="btn small" data-action="nav" data-module="${r[2]}">Показать в демо →</button></article>`).join('')}</div>`;
}

function accessView(){
  const rows=[
    ['Директор','Все проекты, зарплата, KPI, геолокация, себестоимость, прибыль','Полный'],
    ['Финансовый отдел','Начисления, расценки, авансы, удержания, закрытие периода','Финансы'],
    ['Руководитель отдела','Сотрудники своего отдела, объём, сроки, ошибки, KPI','Без зарплат других'],
    ['Сотрудник','Свои задачи, маршрут, чек-лист, объём и при разрешении свою оплату','Личный']
  ];
  const modIds=['projects','map','measure','warehouse','production','cash','payroll','rates','audit'];
  return `${head('Роли и права доступа','Данные открываются по функции сотрудника, а не по общему паролю')}
    <div class="surface table-wrap"><table><thead><tr><th>Роль</th><th>Что видит</th><th>Уровень</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${r[0]}</strong></td><td>${r[1]}</td><td>${label(r[2],r[2]==='Полный'?'green':'gray')}</td></tr>`).join('')}</tbody></table></div>
    <div class="section-title"><h2>Матрица модулей</h2></div>
    <div class="surface table-wrap"><table><thead><tr><th>Роль</th>${modIds.map(id=>`<th>${MODULES[id].name}</th>`).join('')}</tr></thead><tbody>${['director','finance','surveyor','warehouse','production','installer'].map(role=>`<tr><td><strong>${ROLE_LABELS[role]}</strong></td>${modIds.map(id=>`<td>${MODULES[id].roles==='all'||MODULES[id].roles.includes(role)?'<span style="color:var(--green);font-weight:800">✓</span>':'<span class="muted">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <div class="auto-box" style="margin-top:16px"><strong>Контроль геолокации</strong>Текущая GPS-позиция доступна только директору и только во время активной полевой задачи замерщика, водителя или монтажной бригады.</div>`;
}

function projectModal(id,tab=state.modalTab){
  const p=project(id); if(!p)return;
  state.selectedProject=id; state.modalTab=tab;
  const root=document.getElementById('modal-root');
  const f=calcProfit(p), idx=stageIndex(p.stage);
  const tabs=[['route','Маршрут проекта'],['main','Основное'],['team','Команда'],['docs','Документы'],['finance','Финансы'],['history','История']];
  let body='';
  if(tab==='route') body=`<div class="timeline">${STAGES.map((s,i)=>`<div class="timeline-stage ${i<idx?'done':i===idx?'current':''}"><span>${String(i+1).padStart(2,'0')}</span><b>${s.name}</b><span>${i<idx?'Завершён':i===idx?'В работе':'Ожидает'}</span></div>`).join('')}</div><div class="grid2" style="margin-top:16px"><div class="auto-box"><strong>Текущий этап: ${STAGES[idx].name}</strong>Ответственный: ${p[STAGES[idx].module]||p.manager}. План: ${p.plan}. ${p.delay?'Просрочка '+p.delay+' дня.':'Работа идёт по графику.'}</div><div class="surface surface-body"><b>Следующее автоматическое действие</b><p class="muted" style="font-size:11px">После закрытия чек-листа система сохранит объём, создаст начисление и передаст проект на «${STAGES[Math.min(idx+1,STAGES.length-1)].name}».</p></div></div>`;
  if(tab==='main') body=`<div class="detail-grid"><div class="detail-section"><h3>Проект и клиент</h3><div class="field-grid">${[['Номер проекта',p.id],['Клиент',p.client],['Телефон',p.phone],['Объект',p.object],['Адрес',p.address],['Координаты',p.coords],['Ссылка на карту','2GIS / Яндекс'],['Изделие',p.product],['Текущий этап',STAGES[idx].name],['Плановая дата',p.plan],['Фактическая дата',p.actual],['Объём',p.volume+' м²']].map(x=>`<div class="field"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div></div><div class="detail-section"><h3>Сигналы и факты</h3><div class="facts"><div class="fact"><span>Просрочка</span><strong>${p.delay?p.delay+' дня':'Нет'}</strong></div><div class="fact"><span>Переделки</span><strong>${p.reworks}</strong></div><div class="fact"><span>Фото</span><strong>34 файла</strong></div><div class="fact"><span>Документы</span><strong>12 файлов</strong></div><div class="fact"><span>Комментарии</span><strong>18 записей</strong></div><div class="fact"><span>История</span><strong>76 действий</strong></div></div></div></div>`;
  if(tab==='team') body=`<div class="grid3">${[['Менеджер',p.manager],['Замерщик',p.surveyor],['Проектировщик',p.designer],['Закупщик',p.procurement],['Склад',p.warehouse],['Производство',p.production],['ОТК',p.qc],['Логист',p.logistics],['Монтаж',p.installer]].map(x=>`<div class="detail-section"><div class="eyebrow" style="color:var(--pine)">${x[0]}</div><h3>${x[1]}</h3><p class="muted" style="font-size:10px">Задачи, сроки, объём и KPI связаны с проектом.</p></div>`).join('')}</div>`;
  if(tab==='docs') body=`<div class="grid3">${[['Договор №'+p.id,'PDF · подписан'],['Чертежи и спецификация','6 файлов · утверждено'],['Фото замера','12 фото · геометки'],['Заказы поставщикам','4 документа'],['Фото ОТК','8 фото · заключение'],['Акт выполненных работ','PDF · ожидает подписи']].map((x,i)=>`<div class="detail-section"><div style="color:var(--pine)">${icon(i%2?'camera':'file')}</div><h3>${x[0]}</h3><p class="muted" style="font-size:10px">${x[1]}</p><button class="btn small" data-action="toast" data-text="Документ открыт">Открыть</button></div>`).join('')}</div>`;
  if(tab==='finance') body=`<div class="detail-grid"><div class="detail-section"><h3>Финансовый результат</h3><div class="financial-waterfall"><div class="water-row"><span>Сумма договора</span><b>${money(p.contract)}</b></div><div class="water-row"><span>Материалы</span><b>− ${money(p.materials)}</b></div><div class="water-row"><span>Производство</span><b>− ${money(p.productionCost)}</b></div><div class="water-row"><span>Зарплата по проекту</span><b>− ${money(p.payroll)}</b></div><div class="water-row"><span>Доставка</span><b>− ${money(p.delivery)}</b></div><div class="water-row"><span>Монтаж</span><b>− ${money(p.installCost)}</b></div><div class="water-row"><span>Другие расходы</span><b>− ${money(p.other)}</b></div><div class="water-row total"><span>Прибыль · ${f.margin}%</span><b>${money(f.profit)}</b></div></div></div><div class="detail-section"><h3>Платежи</h3><div class="facts"><div class="fact"><span>Предоплата</span><strong>${money(p.prepay)}</strong></div><div class="fact"><span>Всего получено</span><strong>${money(p.paid)}</strong></div><div class="fact"><span>Остаток</span><strong>${money(p.contract-p.paid)}</strong></div><div class="fact"><span>Способ</span><strong>Безналичный</strong></div><div class="fact"><span>Кассир</span><strong>Айжан Темирова</strong></div></div><div class="auto-box" style="margin-top:12px"><strong>Связь с зарплатой</strong>${money(p.payroll)} начислений автоматически включено в себестоимость этого проекта.</div></div></div>`;
  if(tab==='history') body=`<div class="surface"><div class="surface-body">${DB.audit.filter(a=>a.project===p.id||a.project==='—').map(a=>`<div class="audit-row"><strong>${a.time}</strong><span><b>${a.who}</b><br>${a.action}</span><span>${a.project}</span></div>`).join('')}</div></div>`;
  root.innerHTML=`<div class="modal-bg" data-action="modal-bg"><div class="modal"><div class="modal-head"><div><div class="eyebrow">${p.id} · ${STAGES[idx].name}</div><h2>${p.client} · ${p.object}</h2><p>${p.address}</p></div><button class="modal-close" data-action="close">${icon('close')}</button></div><div class="modal-body"><div class="modal-tabs">${tabs.map(t=>`<button class="modal-tab ${tab===t[0]?'on':''}" data-action="project-tab" data-tab="${t[0]}" data-id="${p.id}">${t[1]}</button>`).join('')}</div>${body}</div></div></div>`;
}

function toast(text){ const r=document.getElementById('toast-root'); r.innerHTML=`<div class="toast">${text}</div>`; clearTimeout(window.__t); window.__t=setTimeout(()=>r.innerHTML='',2800); }
function nav(id){ if(!MODULES[id]||!canSee(id))return; state.module=id; state.side=false; render(); window.scrollTo(0,0); }
function approve(id){
  const a=DB.accruals.find(x=>x.id===id); if(!a)return;
  a.status=({manager:'finance',finance:'director',director:'closed'}[a.status]||'closed');
  DB.audit.unshift({time:'31.07 · сейчас',who:state.user.name,action:`Подтвердил начисление ${money(a.volume*a.rate*a.kpi)} для ${a.employee}`,project:a.project});
  save(); render(); toast('Начисление передано на следующий уровень');
}
function completeStage(stage,pid){
  if(!(DB.checks[stage]||[]).every(Boolean)){toast('Сначала завершите обязательный чек-лист');return;}
  const p=project(pid), idx=stageIndex(p.stage), target=Math.min(STAGES.length-1,Math.max(idx+1,stageIndex(stage)+1));
  p.stage=STAGES[target].id;
  DB.audit.unshift({time:'31.07 · сейчас',who:state.user.name,action:`Завершил этап «${MODULES[stage].name}». Система сохранила объём и создала следующую задачу.`,project:pid});
  save(); nav(STAGES[target].module); toast(`Этап закрыт. Создана задача «${STAGES[target].name}»`);
}

document.addEventListener('click',e=>{
  const el=e.target.closest('[data-action]'); if(!el)return;
  const a=el.dataset.action;
  if(a==='login'){ state.user=DB.users.find(u=>u.id===el.dataset.id); state.module=defaultModule(); render(); }
  if(a==='logout'){ state.user=null; document.getElementById('modal-root').innerHTML=''; render(); }
  if(a==='nav')nav(el.dataset.module);
  if(a==='menu'){state.side=!state.side;render();}
  if(a==='project')projectModal(el.dataset.id);
  if(a==='map-project'){state.mapProject=el.dataset.id;render();toast('Точка выбрана');}
  if(a==='project-tab')projectModal(el.dataset.id,el.dataset.tab);
  if(a==='close')document.getElementById('modal-root').innerHTML='';
  if(a==='modal-bg'&&e.target===el)document.getElementById('modal-root').innerHTML='';
  if(a==='toast')toast(el.dataset.text||'Готово');
  if(a==='check'){const s=el.dataset.stage,i=Number(el.dataset.index);DB.checks[s][i]=!DB.checks[s][i];save();document.getElementById('view').innerHTML=moduleView(state.module);}
  if(a==='complete-stage')completeStage(el.dataset.stage,el.dataset.project);
  if(a==='approve')approve(el.dataset.id);
});
document.addEventListener('input',e=>{
  if(e.target.dataset.action==='project-search'){
    const q=e.target.value.toLowerCase();
    document.querySelectorAll('tr[data-search]').forEach(r=>r.classList.toggle('hidden',!r.dataset.search.includes(q)));
  }
});

function boot(){
  const q=new URLSearchParams(location.search);
  if(q.get('reset')==='1'){ DB=seed(); save(); }
  const role=q.get('role'), mod=q.get('module'), pid=q.get('project');
  if(role){ state.user=DB.users.find(u=>u.role===role)||DB.users[0]; state.module=mod&&canSee(mod)?mod:defaultModule(); }
  render();
  if(pid&&state.user)setTimeout(()=>projectModal(pid,q.get('tab')||'main'),50);
}
boot();
