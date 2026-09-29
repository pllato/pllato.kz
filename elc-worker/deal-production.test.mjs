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

// Model-supplied icon names must never leak into the navigation.
const iconDemo = renderDemoHtml({ ...blueprint, demo: { ...blueprint.demo, screens: [{ ...screen, icon: 'layout-dashboard' }] } });
assert.doesNotMatch(iconDemo, />layout-dashboard</);
assert.match(iconDemo, /<svg aria-hidden="true"/);
assert.match(iconDemo, /class="nav-scroll"/);
assert.doesNotMatch(iconDemo, /toast\('Готово: '/);
assert.match(iconDemo, /<form id="action-form"/);
// Labels must remain escaped even in the drawer/form workflow.
const hostileDemo = renderDemoHtml({ ...blueprint, demo: { ...blueprint.demo, screens: [{ ...screen, actions: ['"><script>alert(1)</script>'] }] } });
assert.doesNotMatch(hostileDemo, /<script>alert\(1\)<\/script>/);
const { pdfFromHtml } = await import('./deal-production.js');
await assert.rejects(() => pdfFromHtml({ BROWSER: { quickAction: async () => new Response('x'.repeat(2000)) } }, '<h1>KP</h1>'), /некорректный/);
await assert.rejects(() => pdfFromHtml({ BROWSER: { quickAction: async () => new Response('error', {status:503}) } }, '<h1>KP</h1>'), /503/);
const pdfBytes = new TextEncoder().encode('%PDF-1.7\n'+'x'.repeat(1200));
const result = await pdfFromHtml({ BROWSER: { quickAction: async (name, options) => {
  assert.equal(name, 'pdf'); assert.equal(options.gotoOptions.waitUntil, 'domcontentloaded');
  return new Response(pdfBytes, { headers: {'Content-Type':'application/pdf'} });
} } }, '<h1>KP</h1>');
assert.equal(result.byteLength, pdfBytes.byteLength);
const draft = {...blueprint, commercial: {...blueprint.commercial,complete:false,issues:['Уточнить состав интеграции']}};
assert.throws(()=>validateBlueprint(draft),/коммерческие условия/);
assert.equal(validateBlueprint(draft,{allowDraft:true}),true);
assert.match(renderKpHtml(draft,'https://example.test/demo'),/ЧЕРНОВИК/);
assert.match(renderKpHtml(draft,'https://example.test/demo'),/Уточнить состав интеграции/);
