/* ===== CRM — конфиг ролей/валют/этапов. Контентные данные приходят из API (1С/CRM). ===== */
const DB = {
  // курс для переключения валюты. Суммы хранятся в сомах (KGS=1), ×fx для отображения.
  fx: { KGS: 1, RUB: 1.08 },
  curSym: { KGS: 'с', RUB: '₽' },

  // встроенные роли (имена/цвета). Реальные права — из /api/admin/roles.
  roles: [
    { id:'owner', name:'Владелец', color:'#10b981' },
    { id:'rop',   name:'РОП',      color:'#7c3aed' },
    { id:'consultant', name:'Онлайн-консультант', color:'#2563eb' },
    { id:'seller', name:'Продавец магазина', color:'#0891b2' },
    { id:'marketer', name:'Маркетолог', color:'#db2777' },
    { id:'buh', name:'Бухгалтер', color:'#d97706' },
  ],

  // какие разделы видит роль (дефолт; реальные — из /api/admin/roles)
  access: {
    owner:      ['dash','funnels','clients','inbox','orders','sales','catalog','marketing','bloggers','doctors','loyalty','tasks','triggers','analytics','kpi','team','integrations','settings'],
    rop:        ['dash','funnels','clients','inbox','orders','sales','catalog','tasks','triggers','analytics','kpi','team','doctors','loyalty'],
    consultant: ['funnels','clients','inbox','orders','catalog','tasks','loyalty'],
    seller:     ['funnels','clients','orders','sales','catalog','tasks','kpi','loyalty'],
    marketer:   ['dash','marketing','bloggers','doctors','loyalty','triggers','analytics','clients','sales'],
    buh:        ['orders','catalog','clients','integrations'],
  },

  // названия этапов воронок по умолчанию (реальные — из /api/settings/stages)
  stagesB2C: ['Заявка','Квалификация','Консультация','Подтверждение','Доставка/Самовывоз','Закрыта'],
  stagesB2B: ['Заявка','Квалификация','КП','Согласование','Отгрузка','Оплата','Закрыта'],

  // Контентные данные приходят из API (1С/CRM). Пусто = «нет данных», без демо-заглушек.
  channels: [], products: [], clients: [], deals: [], threads: [],
  promos: [], bloggers: [], doctors: [], sellers: [], tasks: [], subs: [],
  triggers: [], aiLog: [],
};
