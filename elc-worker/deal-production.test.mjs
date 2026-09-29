import assert from 'node:assert/strict';
import {
  isTranscriptRecord,
  validateBlueprint,
  renderDemoHtml,
  renderKpHtml,
  renderInvoiceHtml,
} from './deal-production.js';

assert.equal(isTranscriptRecord({ extension: 'VTT', kind: 'closed_caption' }), true);
assert.equal(isTranscriptRecord({ extension: 'MP4', kind: 'transcript' }), true);
assert.equal(isTranscriptRecord({ extension: 'MP4', kind: 'shared_screen' }), false);
assert.equal(isTranscriptRecord({ name: 'meeting.txt', content_type: 'text/plain' }), true);

const screen = {
  id: 'sales', label: 'Продажи', icon: '📈', headline: 'Продажи', subheadline: 'Все сделки', layout: 'kanban',
  kpis: [{ label: 'Выручка', value: '4,2 млн ₸', trend: '+12%' }],
  lanes: [{ title: 'Новые', cards: [{ title: 'Клиент', meta: 'Сегодня', status: 'Новая', value: '500 000 ₸' }] }],
  table_columns: ['Клиент', 'Статус'], table_rows: [['ТОО Тест', 'В работе']],
  insights: ['Нужно перезвонить'], actions: ['Добавить сделку'],
};
const blueprint = {
  meeting_summary: 'Клиенту нужна единая система продаж и контроля.',
  client: { name: 'Тест <Компания>', industry: 'Услуги', cities: 'Алматы', team: '10', decision_maker: 'Директор' },
  demo: { product_name: 'Test <Control>', tagline: 'Единый кабинет', primary_color: '#2563eb', accent_color: '#16a34a', roles: ['Менеджер'], screens: Array.from({ length: 8 }, (_, i) => ({ ...screen, id: `s${i}`, label: `Раздел ${i + 1}` })), wow_scenarios: ['Сделка от заявки до оплаты'] },
  kp: { title: 'Внедрение системы', executive_summary: 'Единая система.', goals: ['Ускорить продажи'], pain_points: ['Нет контроля'], solution_modules: [{ name: 'CRM', outcome: 'Контроль', features: ['Воронка'] }], integrations: ['Сайт'], deliverables: ['Портал'], phases: [{ name: 'MVP', duration: '4 недели', result: 'Рабочая система', acceptance: 'Сценарий пройден' }], acceptance: ['Функции работают'], warranty: '30 дней', assumptions: ['Доступы предоставляет заказчик'], exclusions: ['Платные лицензии'] },
  commercial: { complete: true, total_amount: 1500000, currency: 'KZT', timeline: '4–6 недель', issues: [], payment_plan: [{ label: 'Предоплата', percent: 10, amount: 150000, currency: 'KZT', trigger: 'Старт' }, { label: 'Ядро', percent: 45, amount: 675000, currency: 'KZT', trigger: 'Согласование ядра' }, { label: 'MVP', percent: 45, amount: 675000, currency: 'KZT', trigger: 'Сдача MVP' }] },
};

assert.equal(validateBlueprint(blueprint), true);
assert.throws(() => validateBlueprint({ ...blueprint, commercial: { ...blueprint.commercial, total_amount: 1400000 } }), /не сходится/);

const demo = renderDemoHtml(blueprint);
assert.match(demo, /Test &lt;Control&gt;/);
assert.match(demo, /data-view="s0"/);
assert.doesNotMatch(demo, /<Control>/);

const kp = renderKpHtml(blueprint, 'https://example.test/demo');
assert.match(kp, /1[\s\u00a0]500[\s\u00a0]000 ₸/);
assert.match(kp, /4–6 недель/);

const invoice = renderInvoiceHtml({ dealTitle: 'Тест', requisites: 'ТОО Заказчик\nБИН 123', payment: blueprint.commercial.payment_plan[0], sequence: 1, total: 3 });
assert.match(invoice.number, /^PL-/);
assert.match(invoice.html, /150[\s\u00a0]000 ₸/);
assert.match(invoice.html, /ТОО Заказчик/);

console.log('deal-production tests passed');
