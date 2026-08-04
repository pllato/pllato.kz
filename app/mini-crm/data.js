window.MINI_CRM_DATA={
  company:{name:'Alem Service',industry:'Услуги',city:'Алматы',owner:'Алексей Романов',goal:8000000},
  stages:[
    {id:'new',name:'Новая заявка',color:'#42a5f5'},
    {id:'contact',name:'Связались',color:'#2962ff'},
    {id:'offer',name:'Предложение',color:'#7b61ff'},
    {id:'payment',name:'Ждём оплату',color:'#f59e0b'},
    {id:'won',name:'Оплачено',color:'#16a36a'},
    {id:'lost',name:'Отказ',color:'#ef5350'}
  ],
  deals:[
    {id:'D-1042',client:'Айдана Серикова',company:'',phone:'+7 701 445-21-18',service:'Генеральная уборка офиса',amount:185000,stage:'new',source:'Instagram',manager:'Алексей',created:'Сегодня, 10:42',next:'Позвонить до 12:00',due:'today',note:'Офис 240 м², нужна уборка в выходные.',activity:['10:42 · Заявка из Instagram','10:43 · Назначен Алексей']},
    {id:'D-1041',client:'Марат Омаров',company:'OMAR Trade',phone:'+7 777 608-04-55',service:'Ежедневное обслуживание',amount:420000,stage:'new',source:'Сайт',manager:'Диана',created:'Сегодня, 09:18',next:'Уточнить площадь',due:'today',note:'Оставил заявку на сайте, просит коммерческое предложение.',activity:['09:18 · Форма на сайте','09:19 · Назначена Диана']},
    {id:'D-1038',client:'Асель Нуртаева',company:'Beauty Point',phone:'+7 702 901-37-40',service:'Уборка после ремонта',amount:260000,stage:'contact',source:'WhatsApp',manager:'Алексей',created:'Вчера, 18:20',next:'Получить фотографии помещения',due:'today',note:'Салон красоты, открытие через 5 дней.',activity:['Вчера · Диалог WhatsApp','09:05 · Проведён звонок']},
    {id:'D-1036',client:'Ерлан Баймуханов',company:'Qaz Logistic',phone:'+7 705 101-92-33',service:'Обслуживание склада',amount:680000,stage:'contact',source:'Рекомендация',manager:'Диана',created:'02 августа',next:'Выезд на замер в 15:00',due:'today',note:'Склад 1 100 м². Контакт от действующего клиента.',activity:['02 авг · Рекомендация от TOO Vector','03 авг · Замер согласован']},
    {id:'D-1033',client:'Жанна Ахметова',company:'Mama Mia',phone:'+7 708 334-87-11',service:'Клининг ресторана',amount:540000,stage:'offer',source:'Instagram',manager:'Алексей',created:'31 июля',next:'Обсудить КП',due:'overdue',note:'Отправлено два тарифа. Нужен дожим по годовому договору.',activity:['31 июл · Заявка','01 авг · Встреча','02 авг · КП на 540 000 ₸']},
    {id:'D-1029',client:'Тимур Алиев',company:'IT Rooms',phone:'+7 701 880-16-74',service:'Уборка двух офисов',amount:390000,stage:'offer',source:'Google',manager:'Диана',created:'29 июля',next:'Перезвонить после совещания',due:'today',note:'Сравнивает с двумя конкурентами.',activity:['29 июл · Звонок из Google','30 июл · Расчёт отправлен']},
    {id:'D-1024',client:'Раушан Ким',company:'R.K. Studio',phone:'+7 777 420-11-06',service:'Абонемент на 3 месяца',amount:315000,stage:'payment',source:'Повторный клиент',manager:'Алексей',created:'27 июля',next:'Напомнить об оплате',due:'overdue',note:'Счёт отправлен, обещала оплатить до понедельника.',activity:['27 июл · Повторная заявка','28 июл · Счёт отправлен','03 авг · Оплата не поступила']},
    {id:'D-1021',client:'Санжар Иманов',company:'MedLine',phone:'+7 705 655-20-90',service:'Ежедневный клининг',amount:920000,stage:'payment',source:'Партнёр',manager:'Диана',created:'25 июля',next:'Получить подписанный договор',due:'today',note:'Договор согласован юристами.',activity:['25 июл · Входящая рекомендация','28 июл · Встреча','01 авг · Договор согласован']},
    {id:'D-1015',client:'Дамир Тулеев',company:'Dala Market',phone:'+7 701 244-30-80',service:'Уборка магазина',amount:280000,stage:'won',source:'Google',manager:'Алексей',created:'21 июля',next:'Передать в исполнение',due:'done',note:'Оплата получена полностью.',activity:['21 июл · Заявка','22 июл · Замер','24 июл · Оплачено 280 000 ₸']},
    {id:'D-1012',client:'Алия Садыкова',company:'A-School',phone:'+7 707 552-98-10',service:'Клининг учебного центра',amount:460000,stage:'won',source:'Сайт',manager:'Диана',created:'18 июля',next:'Контроль качества через 7 дней',due:'done',note:'Договор на 6 месяцев.',activity:['18 июл · Заявка с сайта','20 июл · КП','23 июл · Оплачено 460 000 ₸']},
    {id:'D-1008',client:'Арман Касымов',company:'AK Group',phone:'+7 701 133-45-60',service:'Обслуживание офиса',amount:350000,stage:'lost',source:'Instagram',manager:'Алексей',created:'15 июля',next:'',due:'done',note:'Выбрали более дешёвое предложение.',activity:['15 июл · Заявка','17 июл · Отказ: цена']}
  ],
  clients:[
    {id:'C-401',name:'Айдана Серикова',company:'Частный клиент',phone:'+7 701 445-21-18',email:'aidana.s@mail.kz',deals:1,revenue:0,last:'Сегодня'},
    {id:'C-400',name:'Марат Омаров',company:'OMAR Trade',phone:'+7 777 608-04-55',email:'m.omar@omar.kz',deals:1,revenue:0,last:'Сегодня'},
    {id:'C-397',name:'Асель Нуртаева',company:'Beauty Point',phone:'+7 702 901-37-40',email:'asel@beautypoint.kz',deals:2,revenue:180000,last:'Вчера'},
    {id:'C-392',name:'Ерлан Баймуханов',company:'Qaz Logistic',phone:'+7 705 101-92-33',email:'erlan@qazlog.kz',deals:1,revenue:0,last:'02 августа'},
    {id:'C-386',name:'Жанна Ахметова',company:'Mama Mia',phone:'+7 708 334-87-11',email:'zhanna@mamamia.kz',deals:1,revenue:0,last:'31 июля'},
    {id:'C-374',name:'Раушан Ким',company:'R.K. Studio',phone:'+7 777 420-11-06',email:'raushan@rkstudio.kz',deals:4,revenue:720000,last:'27 июля'},
    {id:'C-369',name:'Санжар Иманов',company:'MedLine',phone:'+7 705 655-20-90',email:'s.imanov@medline.kz',deals:1,revenue:0,last:'25 июля'},
    {id:'C-351',name:'Дамир Тулеев',company:'Dala Market',phone:'+7 701 244-30-80',email:'damir@dalamarket.kz',deals:2,revenue:540000,last:'24 июля'},
    {id:'C-346',name:'Алия Садыкова',company:'A-School',phone:'+7 707 552-98-10',email:'aliya@aschool.kz',deals:3,revenue:910000,last:'23 июля'}
  ],
  tasks:[
    {id:'T-92',title:'Перезвонить Жанне по коммерческому предложению',deal:'D-1033',client:'Жанна Ахметова',time:'Просрочено вчера',priority:'high',assignee:'Алексей',status:'todo'},
    {id:'T-91',title:'Напомнить Раушан об оплате счёта',deal:'D-1024',client:'Раушан Ким',time:'Сегодня, 10:00',priority:'high',assignee:'Алексей',status:'todo'},
    {id:'T-90',title:'Выезд на замер склада Qaz Logistic',deal:'D-1036',client:'Ерлан Баймуханов',time:'Сегодня, 15:00',priority:'normal',assignee:'Диана',status:'todo'},
    {id:'T-89',title:'Получить подписанный договор MedLine',deal:'D-1021',client:'Санжар Иманов',time:'Сегодня, 17:00',priority:'normal',assignee:'Диана',status:'todo'},
    {id:'T-88',title:'Отправить расчёт для OMAR Trade',deal:'D-1041',client:'Марат Омаров',time:'Завтра, 11:00',priority:'normal',assignee:'Диана',status:'todo'},
    {id:'T-87',title:'Передать заказ Dala Market бригадиру',deal:'D-1015',client:'Дамир Тулеев',time:'Выполнено сегодня',priority:'normal',assignee:'Алексей',status:'done'},
    {id:'T-86',title:'Проверить качество первого выезда A-School',deal:'D-1012',client:'Алия Садыкова',time:'08 августа',priority:'normal',assignee:'Диана',status:'todo'}
  ]
};
