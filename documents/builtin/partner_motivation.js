import { computeKpi, computePayout } from '../lib/motivation_calc.js';

const TABS = [
  { id: 'structure', title: 'Структура' },
  { id: 'kpi', title: 'KPI' },
  { id: 'threshold', title: 'Порог' },
  { id: 'self', title: 'Самостоятельность' },
  { id: 'apprentice', title: 'Ученичество' },
  { id: 'qualified', title: 'Квал. лид' },
  { id: 'refunds', title: 'Возвраты' },
  { id: 'long-deals', title: 'Длинные сделки' },
  { id: 'calculator', title: 'Калькулятор' },
  { id: 'scenarios', title: 'Сценарии' },
];

const DEFAULT_STATE = {
  tab: 'calculator',
  calc: {
    planZ: 10,
    planD: 2,
    planV: 3000000,
    rateBasePct: 4,
    rateBonusPct: 5,
    thresholdPct: 70,
    Z: 8,
    D: 2,
    V: 3000000,
    apprentice: false,
    selfClosed: true,
    showParams: false,
  },
};

const SCENARIOS = [
  { name: 'План выполнен ровно', Z: 10, D: 2, V: 3000000, apprentice: false, self: true },
  { name: 'Перевыполнение по объёму', Z: 10, D: 2, V: 6000000, apprentice: false, self: true },
  { name: 'Недобрал Zoom (8 из 10)', Z: 8, D: 2, V: 3000000, apprentice: false, self: true },
  { name: 'Слабая неделя (один KPI)', Z: 4, D: 1, V: 1500000, apprentice: false, self: true },
  { name: 'Только большая сделка, мало активности', Z: 3, D: 1, V: 5000000, apprentice: false, self: true },
  { name: 'Ниже порога 70%', Z: 5, D: 1, V: 1000000, apprentice: false, self: true },
  { name: 'Ученик с результатом', Z: 10, D: 2, V: 3000000, apprentice: true, self: true },
  { name: 'Идеальная неделя', Z: 12, D: 3, V: 4500000, apprentice: false, self: true },
];

function asNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clampPct(value) {
  return Math.max(0, Math.min(1, asNum(value, 0)));
}

function pct(value, digits = 1) {
  return `${(clampPct(value) * 100).toFixed(digits)}%`;
}

function money(value) {
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(asNum(value, 0)))} ₸`;
}

function text(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch]);
}

function ensureState(moduleState) {
  if (!moduleState.partnerMotivation) {
    moduleState.partnerMotivation = JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
  const state = moduleState.partnerMotivation;
  state.tab = TABS.some((tab) => tab.id === state.tab) ? state.tab : 'calculator';
  state.calc = { ...JSON.parse(JSON.stringify(DEFAULT_STATE.calc)), ...(state.calc || {}) };
  return state;
}

function renderStaticTab(tabId) {
  switch (tabId) {
    case 'structure':
      return `
        <h3>Структура вознаграждения</h3>
        <div class="motivation-formula">Доход за неделю = 4% × V + 5% × V × K_kpi</div>
        <ul>
          <li><b>V</b> — сумма самостоятельно закрытых партнёром сделок за неделю.</li>
          <li><b>4%</b> — базовая комиссия от V.</li>
          <li><b>5% × K_kpi</b> — KPI-бонус, где K_kpi находится в диапазоне от 0 до 1.</li>
        </ul>
        <p>Оклад не применяется: партнёр работает на чистую комиссию.</p>
      `;
    case 'kpi':
      return `
        <h3>KPI и коэффициент</h3>
        <div class="motivation-formula">
Z_score = min(Zoom-встречи / 10; 1)
D_score = min(сделки / 2; 1)
V_score = min(объём / 3 000 000 ₸; 1)
K_kpi   = (Z_score + D_score + V_score) / 3
        </div>
        <p>Функция min(...; 1) не даёт перевыполнением одного KPI компенсировать провал по другому. Нужно держать баланс по встречам, сделкам и объёму одновременно.</p>
      `;
    case 'threshold':
      return `
        <h3>Порог отсечения</h3>
        <p>Если K_kpi ниже 70%, KPI-бонус не начисляется.</p>
        <p>Базовая комиссия 4% сохраняется, потому что она привязана к факту самостоятельного закрытия сделки.</p>
      `;
    case 'self':
      return `
        <h3>Условие самостоятельности</h3>
        <p>Базовая и KPI-комиссия начисляются только если:</p>
        <ul>
          <li>сделка прошла все стадии воронки с партнёром как ответственным;</li>
          <li>руководитель или наставник не подключался на этапах «Переговоры» и «Договор» в роли закрывающего.</li>
        </ul>
        <p>Если хотя бы одно условие нарушено, комиссия за такую сделку не начисляется.</p>
      `;
    case 'apprentice':
      return `
        <h3>Период ученичества</h3>
        <p>В период ученичества партнёр получает только базовую комиссию 4%.</p>
        <p>KPI-бонус 5% не выплачивается до перехода в статус самостоятельного партнёра.</p>
      `;
    case 'qualified':
      return `
        <h3>Квалифицированный лид</h3>
        <p>Zoom-встреча учитывается в KPI только когда выполнены все условия:</p>
        <ol>
          <li>личный доход ЛПР или собственника от 5 000 долларов в месяц;</li>
          <li>постоянная команда от 5 сотрудников;</li>
          <li>подтверждена реальная потребность в разработке и понятен бюджет.</li>
        </ol>
        <p>Кратко: есть деньги и есть реальная боль.</p>
      `;
    case 'refunds':
      return `
        <h3>Возвраты и выплаты</h3>
        <ul>
          <li>комиссия выплачивается после полной сдачи проекта и подписанных актов;</li>
          <li>до актов комиссия отображается как начисленная, но не выплачивается;</li>
          <li>возвраты клиента удерживаются из ближайших начислений партнёра;</li>
          <li>при отмене проекта без актов комиссия не выплачивается.</li>
        </ul>
      `;
    case 'long-deals':
      return `
        <h3>Длинные сделки между неделями</h3>
        <p>Сделка относится к неделе, в которую получила статус «Выиграна».</p>
        <p>Опорное поле — updatedAt финальной стадии в CRM.</p>
      `;
    default:
      return '';
  }
}

function computeSnapshot(calc) {
  const planZ = Math.max(0, asNum(calc.planZ, 10));
  const planD = Math.max(0, asNum(calc.planD, 2));
  const planV = Math.max(0, asNum(calc.planV, 3000000));
  const rateBase = Math.max(0, asNum(calc.rateBasePct, 4)) / 100;
  const rateBonus = Math.max(0, asNum(calc.rateBonusPct, 5)) / 100;
  const threshold = Math.max(0, Math.min(100, asNum(calc.thresholdPct, 70))) / 100;

  const Z = Math.max(0, asNum(calc.Z, 8));
  const D = Math.max(0, asNum(calc.D, 2));
  const V = Math.max(0, asNum(calc.V, 3000000));
  const isApprentice = !!calc.apprentice;
  const isSelfClosed = !!calc.selfClosed;

  const kpi = computeKpi({ Z, D, V, planZ, planD, planV });
  const payout = computePayout({
    V,
    K_kpi_raw: kpi.K_kpi_raw,
    isApprentice,
    isSelfClosed,
    rateBase,
    rateBonus,
    threshold,
  });

  return {
    planZ,
    planD,
    planV,
    rateBase,
    rateBonus,
    threshold,
    Z,
    D,
    V,
    isApprentice,
    isSelfClosed,
    kpi,
    payout,
  };
}

function colorForScore(score) {
  if (score >= 1) return '#1D9E75';
  if (score >= 0.7) return '#BA7517';
  return '#888780';
}

function renderCalculator(tabEl, state) {
  const calc = state.calc;
  const data = computeSnapshot(calc);

  tabEl.innerHTML = `
    <div class="calc-top-row">
      <p class="calc-section-title">Факт за неделю</p>
      <button class="doc-btn" data-action="toggle-params">⚙ Параметры плана</button>
    </div>

    <div data-params style="display:${calc.showParams ? 'grid' : 'none'};gap:10px;margin-bottom:10px">
      <div class="calc-grid">
        <label class="calc-input"><span>План Zoom</span><input type="number" min="0" step="1" data-input="planZ" value="${text(data.planZ)}"></label>
        <label class="calc-input"><span>План сделок</span><input type="number" min="0" step="1" data-input="planD" value="${text(data.planD)}"></label>
        <label class="calc-input"><span>План объёма, ₸</span><input type="number" min="0" step="1000" data-input="planV" value="${text(data.planV)}"></label>
        <label class="calc-input"><span>Базовая ставка, %</span><input type="number" min="0" step="0.1" data-input="rateBasePct" value="${text(asNum(calc.rateBasePct, 4))}"></label>
        <label class="calc-input"><span>Ставка KPI-бонуса, %</span><input type="number" min="0" step="0.1" data-input="rateBonusPct" value="${text(asNum(calc.rateBonusPct, 5))}"></label>
        <label class="calc-input"><span>Порог K_kpi, %</span><input type="number" min="0" max="100" step="1" data-input="thresholdPct" value="${text(asNum(calc.thresholdPct, 70))}"></label>
      </div>
    </div>

    <div class="calc-grid">
      <label class="calc-input">
        <span>Zoom-встречи</span>
        <input type="number" min="0" step="1" data-input="Z" value="${text(data.Z)}">
        <small>план ${new Intl.NumberFormat('ru-RU').format(data.planZ)}</small>
      </label>
      <label class="calc-input">
        <span>Закрытые сделки</span>
        <input type="number" min="0" step="1" data-input="D" value="${text(data.D)}">
        <small>план ${new Intl.NumberFormat('ru-RU').format(data.planD)}</small>
      </label>
      <label class="calc-input">
        <span>Объём, ₸</span>
        <input type="number" min="0" step="1000" data-input="V" value="${text(data.V)}">
        <small>план ${money(data.planV)}</small>
      </label>
    </div>

    <div class="calc-toggle-row">
      <button class="calc-toggle" data-kind="apprentice" data-toggle="apprentice" aria-pressed="${data.isApprentice}">
        <span>Ученик: ${data.isApprentice ? 'да' : 'нет'}</span>
        <span class="calc-toggle-switch"><i></i></span>
      </button>
      <button class="calc-toggle" data-kind="self" data-toggle="selfClosed" aria-pressed="${data.isSelfClosed}">
        <span>Сделка закрыта самостоятельно: ${data.isSelfClosed ? 'да' : 'нет'}</span>
        <span class="calc-toggle-switch"><i></i></span>
      </button>
    </div>

    <div class="calc-divider"></div>

    <div class="calc-kpi-head">
      <h3 style="margin:0;font-size:18px;font-weight:500">Коэффициент KPI</h3>
      <div class="calc-kpi-value">${Math.round(data.kpi.K_kpi_raw * 100)}%</div>
    </div>

    <div class="calc-kpi-bars">
      ${[
        { label: 'Zoom', score: data.kpi.Z_score },
        { label: 'Сделки', score: data.kpi.D_score },
        { label: 'Объём', score: data.kpi.V_score },
      ].map((item) => `
        <div class="calc-kpi-item">
          <div class="calc-kpi-item-head"><span>${item.label}</span><span>${pct(item.score, 0)}</span></div>
          <div class="calc-kpi-bar"><span style="width:${Math.max(0, Math.min(100, item.score * 100))}%;background:${colorForScore(item.score)}"></span></div>
        </div>
      `).join('')}
    </div>

    <div class="calc-kpi-hint ${data.payout.belowThreshold ? 'bad' : 'ok'}">
      ${data.payout.belowThreshold
        ? `Ниже порога ${Math.round(data.threshold * 100)}% — KPI-бонус не начисляется`
        : `Выше порога ${Math.round(data.threshold * 100)}% — KPI-бонус начисляется`}
    </div>

    <div class="calc-divider"></div>

    <div class="calc-metrics">
      <div class="calc-metric"><b>База ${Math.round(data.rateBase * 100)}%</b><strong>${money(data.payout.base)}</strong></div>
      <div class="calc-metric"><b>KPI-бонус</b><strong>${money(data.payout.bonus)}</strong></div>
      <div class="calc-metric is-total"><b>Итого</b><strong>${money(data.payout.total)}</strong></div>
    </div>

    <div class="calc-month">
      <span>Прогноз на месяц (× 4,33)</span>
      <strong>${money(data.payout.monthly)}</strong>
    </div>
  `;

  tabEl.querySelector('[data-action="toggle-params"]')?.addEventListener('click', () => {
    state.calc.showParams = !state.calc.showParams;
    renderCalculator(tabEl, state);
  });

  tabEl.querySelectorAll('input[data-input]').forEach((input) => {
    input.addEventListener('input', () => {
      state.calc[input.dataset.input] = asNum(input.value, state.calc[input.dataset.input]);
      renderCalculator(tabEl, state);
    });
  });

  tabEl.querySelectorAll('[data-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.toggle;
      state.calc[key] = !state.calc[key];
      renderCalculator(tabEl, state);
    });
  });
}

function renderScenarios(tabEl, state) {
  const calc = state.calc;
  const planZ = Math.max(0, asNum(calc.planZ, 10));
  const planD = Math.max(0, asNum(calc.planD, 2));
  const planV = Math.max(0, asNum(calc.planV, 3000000));
  const rateBase = Math.max(0, asNum(calc.rateBasePct, 4)) / 100;
  const rateBonus = Math.max(0, asNum(calc.rateBonusPct, 5)) / 100;
  const threshold = Math.max(0, Math.min(100, asNum(calc.thresholdPct, 70))) / 100;

  tabEl.innerHTML = `
    <h3>Сценарии</h3>
    <p>Таблица считается от текущих параметров плана и ставок. Изменения в калькуляторе применяются сразу.</p>
    <div class="calc-scenarios-wrap">
      <table class="calc-scenarios">
        <thead>
          <tr>
            <th>Сценарий</th>
            <th>K_kpi</th>
            <th>База</th>
            <th>KPI-бонус</th>
            <th>Итого</th>
          </tr>
        </thead>
        <tbody>
          ${SCENARIOS.map((scenario) => {
            const kpi = computeKpi({
              Z: scenario.Z,
              D: scenario.D,
              V: scenario.V,
              planZ,
              planD,
              planV,
            });
            const payout = computePayout({
              V: scenario.V,
              K_kpi_raw: kpi.K_kpi_raw,
              isApprentice: scenario.apprentice,
              isSelfClosed: scenario.self,
              rateBase,
              rateBonus,
              threshold,
            });
            return `
              <tr>
                <td>${text(scenario.name)}</td>
                <td>${pct(payout.K_kpi, 1)}</td>
                <td>${money(payout.base)}</td>
                <td>${money(payout.bonus)}</td>
                <td class="is-total">${money(payout.total)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export function renderPartnerMotivation(container, context = {}) {
  const moduleState = context.moduleState || (context.moduleState = {});
  const state = ensureState(moduleState);

  container.innerHTML = `
    <div class="motivation-tabs">
      ${TABS.map((tab) => `<button data-tab="${tab.id}" class="${tab.id === state.tab ? 'is-active' : ''}">${tab.title}</button>`).join('')}
    </div>
    <div class="motivation-pane" data-pane></div>
  `;

  const pane = container.querySelector('[data-pane]');

  if (state.tab === 'calculator') {
    renderCalculator(pane, state);
  } else if (state.tab === 'scenarios') {
    renderScenarios(pane, state);
  } else {
    pane.innerHTML = renderStaticTab(state.tab);
  }

  container.querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      state.tab = button.dataset.tab;
      renderPartnerMotivation(container, context);
    });
  });
}
