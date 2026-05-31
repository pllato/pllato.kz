/* ===== Pllato CRM — демо-данные для Оксаны (сеть средств гигиены) ===== */
const DB = {
  // курс для переключения валюты (справочно из КП: 1 USD ≈ 525 ₸; сом ≈ 0.95 KZT для демо)
  fx: { KGS: 1, KZT: 1.06 },        // суммы хранятся в сомах, ×fx для отображения
  curSym: { KGS: 'с', KZT: '₸' },

  roles: [
    { id:'owner', name:'Владелец', who:'Оксана', color:'#10b981' },
    { id:'rop',   name:'РОП',      who:'Анатолий', color:'#7c3aed' },
    { id:'consultant', name:'Онлайн-консультант', who:'Айгуль', color:'#2563eb' },
    { id:'seller', name:'Продавец магазина', who:'Нурлан', color:'#0891b2' },
    { id:'marketer', name:'Маркетолог', who:'Лена', color:'#db2777' },
    { id:'buh', name:'Бухгалтер', who:'Гульнара', color:'#d97706' },
  ],

  // какие разделы видит роль (разграничение доступа из ТЗ 3.5 / 9.3)
  access: {
    owner:      ['dash','funnels','clients','inbox','orders','catalog','marketing','bloggers','tasks','subs','triggers','ai','analytics','kpi','team','integrations','settings'],
    rop:        ['dash','funnels','clients','inbox','orders','catalog','tasks','triggers','analytics','kpi','team'],
    consultant: ['funnels','clients','inbox','orders','catalog','tasks','subs'],
    seller:     ['funnels','clients','orders','catalog','tasks','kpi'],
    marketer:   ['dash','marketing','bloggers','triggers','analytics','clients'],
    buh:        ['orders','catalog','clients','integrations'],
  },

  channels: [
    { id:'wa1', type:'wa', name:'Розница · Центр',   phone:'+996 555 10-20-01', owner:'Айгуль', unread:3 },
    { id:'wa2', type:'wa', name:'Розница · Восток',  phone:'+996 555 10-20-02', owner:'Айгуль', unread:1 },
    { id:'wa3', type:'wa', name:'Розница · Юг',      phone:'+996 555 10-20-03', owner:'Айгуль', unread:0 },
    { id:'wa4', type:'wa', name:'Розница · Ала-Тоо', phone:'+996 555 10-20-04', owner:'Айгуль', unread:2 },
    { id:'wa5', type:'wa', name:'Опт',               phone:'+996 555 10-20-05', owner:'Бекзат', unread:1 },
    { id:'ig1', type:'ig', name:'@gigiena.plus',     phone:'Instagram Direct',  owner:'Айгуль', unread:2 },
    { id:'ig2', type:'ig', name:'@dental.pharmacy.kg',phone:'Instagram Direct', owner:'Айгуль', unread:0 },
    { id:'wp1', type:'wp', name:'Reliney.kg',        phone:'форма заявки',      owner:'—', unread:1 },
    { id:'wp2', type:'wp', name:'Dental Pharmacy KG',phone:'форма заявки',      owner:'—', unread:0 },
  ],

  // каталог зеркалится из 1С Listki EG (остатки 4 000 SKU — показываем срез)
  products: [
    { id:'p1', sku:'GIG-1001', name:'Зубная щётка Curaprox CS 5460', cat:'Полость рта', color:'мятный', price:480, stock:142, entity:'ТОО' },
    { id:'p2', sku:'GIG-1002', name:'Зубная щётка Curaprox CS 5460', cat:'Полость рта', color:'розовый', price:480, stock:88, entity:'ТОО' },
    { id:'p3', sku:'GIG-1010', name:'Зубная паста R.O.C.S. 74г',     cat:'Полость рта', color:'—', price:620, stock:240, entity:'ТОО' },
    { id:'p4', sku:'GIG-1011', name:'Ирригатор Waterpik WP-100',     cat:'Полость рта', color:'белый', price:14900, stock:11, entity:'ТОО' },
    { id:'p5', sku:'GIG-2001', name:'Прокладки Always Ultra (×10)',  cat:'Женская гигиена', color:'—', price:340, stock:520, entity:'ИП' },
    { id:'p6', sku:'GIG-2010', name:'Тампоны o.b. ProComfort (×16)', cat:'Женская гигиена', color:'—', price:560, stock:6, entity:'ИП' },
    { id:'p7', sku:'GIG-3001', name:'Подгузники Pampers Premium 3',  cat:'Детская гигиена', color:'—', price:5200, stock:74, entity:'ТОО' },
    { id:'p8', sku:'GIG-3010', name:'Влажные салфетки Huggies (×64)',cat:'Детская гигиена', color:'—', price:410, stock:310, entity:'ТОО' },
    { id:'p9', sku:'GIG-4001', name:'Антисептик для рук Sanitelle 100мл', cat:'Антисептика', color:'—', price:290, stock:0, entity:'ИП' },
    { id:'p10', sku:'GIG-4002',name:'Маска медицинская (×50)',       cat:'Антисептика', color:'голубой', price:380, stock:430, entity:'ИП' },
    { id:'p11', sku:'GIG-5001',name:'Шампунь Head&Shoulders 400мл',  cat:'Уход за волосами', color:'—', price:890, stock:120, entity:'ТОО' },
    { id:'p12', sku:'GIG-5010',name:'Мыло Dove Beauty Cream Bar',    cat:'Уход за телом', color:'—', price:210, stock:680, entity:'ТОО' },
    { id:'p13', sku:'GIG-6001',name:'Зубная нить Oral-B Satin 25м',  cat:'Полость рта', color:'—', price:330, stock:54, entity:'ТОО' },
    { id:'p14', sku:'GIG-6010',name:'Ополаскиватель Listerine 250мл',cat:'Полость рта', color:'—', price:540, stock:97, entity:'ТОО' },
  ],

  clients: [
    { id:'c1', name:'Айбек Сатаров', phone:'+996 700 11-22-33', type:['розница','постоянный'], dob:'1990-06-12', card:'DC-0451', source:'WhatsApp · Центр', mgr:'Айгуль', loyalty:['постоянный'], ltv:18400, deals:5, sub:true,
      history:[ {d:'12.05.2026',t:'Заказ #1042 · 2 320 с'},{d:'02.04.2026',t:'Заказ #0981 · 1 180 с'},{d:'15.03.2026',t:'Заказ #0903 · 3 600 с'} ] },
    { id:'c2', name:'Гульнара Осмонова', phone:'+996 555 44-55-66', type:['дисконт','врач'], dob:'1985-11-30', card:'DC-0388', source:'1С · дисконтная карта', mgr:'Айгуль', loyalty:['постоянный','заинтересован в подписке'], ltv:42100, deals:11, sub:false,
      history:[ {d:'28.05.2026',t:'Заказ #1071 · 6 200 с'},{d:'10.05.2026',t:'Заказ #1033 · 4 100 с'} ] },
    { id:'c3', name:'Аптека «Шифо» (опт)', phone:'+996 770 99-88-77', type:['опт','партнёр'], dob:'—', card:'—', source:'WhatsApp · Опт', mgr:'Бекзат', loyalty:['постоянный'], ltv:386000, deals:24, sub:false, entity:'ТОО',
      history:[ {d:'27.05.2026',t:'Отгрузка #B-204 · 142 000 с'},{d:'13.05.2026',t:'Отгрузка #B-198 · 98 500 с'} ] },
    { id:'c4', name:'Динара Жумабекова', phone:'+996 707 22-33-44', type:['розница','новый'], dob:'1996-02-08', card:'—', source:'Instagram · @gigiena.plus', mgr:'Айгуль', loyalty:['новый'], ltv:1180, deals:1, sub:false,
      history:[ {d:'29.05.2026',t:'Заказ #1078 · 1 180 с'} ] },
    { id:'c5', name:'Эркин Текебаев', phone:'+996 555 77-88-99', type:['розница'], dob:'1978-09-21', card:'DC-0210', source:'Reliney.kg · форма', mgr:'Нурлан', loyalty:['не хочет рассылок'], ltv:9300, deals:4, sub:false,
      history:[ {d:'20.05.2026',t:'Заказ #1055 · 2 900 с'} ] },
    { id:'c6', name:'Салтанат Орозова', phone:'+996 700 55-66-77', type:['подписчик','дисконт'], dob:'1992-06-01', card:'DC-0502', source:'WhatsApp · Восток', mgr:'Айгуль', loyalty:['постоянный'], ltv:23800, deals:8, sub:true,
      history:[ {d:'25.05.2026',t:'Подписка · набор «Семья» · 4 200 с'} ] },
  ],

  // воронки: deals со stage; type b2c/b2b
  stagesB2C: ['Заявка','Квалификация','Консультация','Подтверждение','Доставка/Самовывоз','Закрыта'],
  stagesB2B: ['Заявка','Квалификация','КП','Согласование','Отгрузка','Оплата','Закрыта'],
  deals: [
    { id:'d1', type:'b2c', client:'Айбек Сатаров', product:'Curaprox ×2, R.O.C.S.', sum:2320, stage:'Консультация', mgr:'Айгуль', src:'wa', promo:'VESNA10', days:1, hot:true },
    { id:'d2', type:'b2c', client:'Динара Жумабекова', product:'Pampers Premium 3', sum:5200, stage:'Заявка', mgr:'Айгуль', src:'ig', promo:'', days:0, hot:false },
    { id:'d3', type:'b2c', client:'Эркин Текебаев', product:'Шампунь, мыло ×4', sum:1730, stage:'Подтверждение', mgr:'Нурлан', src:'wp', promo:'', days:2, hot:false },
    { id:'d4', type:'b2c', client:'Салтанат Орозова', product:'Набор «Семья»', sum:4200, stage:'Доставка/Самовывоз', mgr:'Айгуль', src:'wa', promo:'BLOG_NUR', days:0, hot:false },
    { id:'d5', type:'b2c', client:'Жанара К.', product:'Always Ultra ×3', sum:1020, stage:'Квалификация', mgr:'Айгуль', src:'ig', promo:'', days:3, hot:false },
    { id:'d6', type:'b2c', client:'Мирлан Б.', product:'Listerine, нить', sum:870, stage:'Закрыта', mgr:'Нурлан', src:'wp', promo:'VESNA10', days:5, hot:false },
    { id:'d7', type:'b2b', client:'Аптека «Шифо»', product:'Опт: гигиена микс', sum:142000, stage:'Согласование', mgr:'Бекзат', src:'wa', promo:'', days:2, hot:true },
    { id:'d8', type:'b2b', client:'Сеть «Денсаулык»', product:'Опт: подгузники, салфетки', sum:218000, stage:'КП', mgr:'Бекзат', src:'wa', promo:'', days:1, hot:true },
    { id:'d9', type:'b2b', client:'ИП Касымов', product:'Опт: антисептика', sum:64000, stage:'Квалификация', mgr:'Бекзат', src:'wa', promo:'', days:4, hot:false },
    { id:'d10', type:'b2b', client:'Клиника «Авиценна»', product:'Опт: маски, антисептик', sum:96500, stage:'Оплата', mgr:'Бекзат', src:'wa', promo:'', days:0, hot:false },
  ],

  // омни-инбокс: переписки
  threads: [
    { id:'t1', ch:'wa1', name:'Айбек Сатаров', av:'#10b981', last:'Беру обе щётки, когда заберу?', time:'10:42', unread:2, online:true,
      msgs:[
        {dir:'in', t:'Здравствуйте! Есть в наличии щётки Curaprox?', tm:'10:30'},
        {dir:'out', t:'Здравствуйте, Айбек! Да, в наличии мятная и розовая — по 480 с. На обе по промокоду VESNA10 скидка 10%.', tm:'10:34'},
        {dir:'in', t:'Беру обе щётки, когда заберу?', tm:'10:42'},
      ]},
    { id:'t2', ch:'ig1', name:'Динара Жумабекова', av:'#e1306c', last:'А подгузники 3 размер есть?', time:'10:15', unread:1, online:false,
      msgs:[
        {dir:'in', t:'Добрый день! А подгузники 3 размер есть?', tm:'10:15'},
        {dir:'out', t:'Здравствуйте! Pampers Premium 3 — 74 уп. в наличии, 5 200 с.', tm:'10:18'},
      ]},
    { id:'t3', ch:'wa5', name:'Аптека «Шифо» (опт)', av:'#7c3aed', last:'Пришлите КП на 142 000', time:'09:50', unread:1, online:true,
      msgs:[
        {dir:'in', t:'Доброе утро! Нужен опт по гигиене на ~140к. Пришлите КП.', tm:'09:40'},
        {dir:'out', t:'Доброе утро! Готовлю заказ покупателя в 1С, КП пришлю в течение часа.', tm:'09:50'},
      ]},
    { id:'t4', ch:'wa1', name:'Гульнара Осмонова', av:'#2563eb', last:'Спасибо, доктор рекомендует!', time:'Вчера', unread:0, online:false,
      msgs:[ {dir:'in', t:'Спасибо, доктор рекомендует!', tm:'Вчера 18:20'} ]},
    { id:'t5', ch:'ig1', name:'Аноним · ночь', av:'#0891b2', last:'[AI] Подобрал 3 варианта пасты', time:'03:12', unread:0, online:false, ai:true,
      msgs:[
        {dir:'in', t:'Здравствуйте, нужна паста от чувствительности', tm:'03:10'},
        {dir:'ai', t:'Здравствуйте! Для чувствительных зубов подойдёт R.O.C.S. Sensitive (620 с) или Sensodyne. Подсказать наличие в ближайшем магазине?', tm:'03:11'},
        {dir:'in', t:'да, в центре', tm:'03:12'},
        {dir:'ai', t:'В магазине «Центр» есть в наличии. Утром консультант Айгуль свяжется и оформит. Оставить заявку?', tm:'03:12'},
      ]},
    { id:'t6', ch:'wp1', name:'Заявка с Reliney.kg', av:'#d97706', last:'Форма: заказ обратного звонка', time:'08:30', unread:1, online:false,
      msgs:[ {dir:'in', t:'Заявка с формы: имя Эркин, тел +996 555 77-88-99, интересует уход за полостью рта. UTM: ig/spring_promo', tm:'08:30'} ]},
  ],

  promos: [
    { id:'pr1', code:'VESNA10', type:'сезонная', disc:10, used:142, until:'31.05.2026', revenue:312000, status:'активна' },
    { id:'pr2', code:'BLOG_NUR', type:'блогерский код', disc:15, used:88, until:'15.06.2026', revenue:198000, status:'активна', blogger:'@nuriza.beauty' },
    { id:'pr3', code:'8MARTA', type:'общая акция', disc:20, used:410, until:'09.03.2026', revenue:540000, status:'завершена' },
    { id:'pr4', code:'BD-PERS', type:'персональный', disc:12, used:36, until:'—', revenue:48000, status:'активна' },
    { id:'pr5', code:'DENTAL5', type:'блогерский код', disc:10, used:21, until:'30.06.2026', revenue:31000, status:'активна', blogger:'@dr.smile.kg' },
  ],

  bloggers: [
    { id:'b1', nick:'@nuriza.beauty', name:'Нуриза А.', topic:'Бьюти / уход', reach:'82k', code:'BLOG_NUR', clicks:1240, sales:88, avg:2250, roi:'340%', paid:18000 },
    { id:'b2', nick:'@dr.smile.kg', name:'Др. Эльмира', topic:'Стоматология', reach:'45k', code:'DENTAL5', clicks:520, sales:21, avg:1480, roi:'180%', paid:9000 },
    { id:'b3', nick:'@mama.bishkek', name:'Аида М.', topic:'Мамы / дети', reach:'120k', code:'MAMA15', clicks:2100, sales:140, avg:3100, roi:'410%', paid:25000 },
  ],

  sellers: [
    { id:'s1', name:'Айгуль Т.', role:'Онлайн-консультант', plan:600000, fact:512000, bonus:41000, incoming:148, won:96, conv:65, tasks:4 },
    { id:'s2', name:'Нурлан Б.', role:'Продавец · Центр', plan:400000, fact:318000, bonus:22000, incoming:74, won:41, conv:55, tasks:2 },
    { id:'s3', name:'Бекзат О.', role:'Опт-менеджер', plan:2000000, fact:1860000, bonus:96000, incoming:38, won:24, conv:63, tasks:5 },
    { id:'s4', name:'Жанна С.', role:'Продавец · Восток', plan:350000, fact:402000, bonus:31000, incoming:81, won:52, conv:64, tasks:1 },
  ],

  tasks: [
    { id:'tk1', title:'Перезвонить опту «Шифо» по КП', deal:'#B-205', who:'Бекзат', due:'Сегодня 14:00', type:'звонок', done:false, prio:'high' },
    { id:'tk2', title:'Отгрузка клинике «Авиценна»', deal:'#B-201', who:'Бекзат', due:'Сегодня 16:00', type:'отгрузка', done:false, prio:'high' },
    { id:'tk3', title:'Замер витрины · магазин Юг', deal:'—', who:'Нурлан', due:'Завтра 10:00', type:'дело', done:false, prio:'mid' },
    { id:'tk4', title:'Подтвердить доставку Салтанат О.', deal:'#1075', who:'Айгуль', due:'Сегодня 12:00', type:'звонок', done:true, prio:'mid' },
    { id:'tk5', title:'Проверить остаток антисептика (0 шт)', deal:'—', who:'Гульнара', due:'Сегодня', type:'дело', done:false, prio:'high' },
    { id:'tk6', title:'Собрать отзывы для блогерского отчёта', deal:'—', who:'Лена', due:'Пятница', type:'дело', done:false, prio:'low' },
  ],

  subs: [
    { id:'sb1', client:'Айбек Сатаров', set:'Полость рта · базовый', period:'3 мес', price:1900, next:'12.08.2026', status:'активна' },
    { id:'sb2', client:'Салтанат Орозова', set:'Набор «Семья»', period:'1 мес', price:4200, next:'25.06.2026', status:'активна' },
    { id:'sb3', client:'Гульнара Осмонова', set:'Женская гигиена', period:'2 мес', price:1680, next:'—', status:'пауза' },
  ],

  triggers: [
    { id:'tr1', name:'Поздравление с днём рождения', on:true, type:'ДР', desc:'Скан карточек с ДР сегодня → WhatsApp с персональным промокодом BD-PERS (−12%)', sent:36, risk:'низкий' },
    { id:'tr2', name:'Замена щётки через 3 мес', on:true, type:'рекуррент', desc:'Через 90 дней после покупки щётки → напоминание о замене', sent:142, risk:'низкий' },
    { id:'tr3', name:'Статус заказа: собран → отправлен', on:true, type:'статус', desc:'Уведомления по этапам доставки', sent:520, risk:'низкий' },
    { id:'tr4', name:'Подписка: напоминание за 7 дней', on:true, type:'подписка', desc:'За неделю до отгрузки набора → можно приостановить', sent:24, risk:'низкий' },
    { id:'tr5', name:'Массовая рассылка по базе', on:false, type:'масс', desc:'⚠ Через GreenAPI запрещено (риск бана). Рекомендуем bulk-провайдера или ретаргет', sent:0, risk:'высокий' },
  ],

  aiLog: [
    { time:'03:12', client:'Аноним · IG', q:'нужна паста от чувствительности', a:'Подобрал R.O.C.S. Sensitive + Sensodyne, предложил наличие', esc:true },
    { time:'02:41', client:'+996 700 …', q:'во сколько работает магазин в центре', a:'Ответил по FAQ: 09:00–21:00, без выходных', esc:false },
    { time:'01:18', client:'@user_kg', q:'есть подгузники 4 размер', a:'Проверил каталог 1С: в наличии, передал заявку', esc:true },
    { time:'00:52', client:'+996 555 …', q:'доставка по Бишкеку сколько', a:'FAQ: 150–250 с по городу, бесплатно от 3 000 с', esc:false },
  ],
};
