import { computeKpi, computePayout } from "./motivation_calc.js";

const DEFAULTS = {
  planZ: 10,
  planD: 2,
  planV: 3000000,
  rateBase: 4,
  rateBonus: 5,
  threshold: 70,
  factZ: 8,
  factD: 2,
  factV: 3000000,
  salary: 200000,
  apprentice: "no",
  selfClosed: "yes",
};

const SCENARIOS = [
  { title: "План выполнен ровно", Z: 10, D: 2, V: 3000000, apprentice: false, selfClosed: true },
  { title: "Перевыполнение по объёму", Z: 10, D: 2, V: 6000000, apprentice: false, selfClosed: true },
  { title: "Недобрал Zoom (8 из 10)", Z: 8, D: 2, V: 3000000, apprentice: false, selfClosed: true },
  { title: "Слабая неделя (один KPI)", Z: 4, D: 1, V: 1500000, apprentice: false, selfClosed: true },
  { title: "Только большая сделка, мало активности", Z: 3, D: 1, V: 5000000, apprentice: false, selfClosed: true },
  { title: "Ниже порога 70%", Z: 5, D: 1, V: 1000000, apprentice: false, selfClosed: true },
  { title: "Ученик с результатом", Z: 10, D: 2, V: 3000000, apprentice: true, selfClosed: true },
  { title: "Идеальная неделя", Z: 12, D: 3, V: 4500000, apprentice: false, selfClosed: true },
];

function fmtMoney(value) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(value || 0));
}

function fmtPct(value, digits = 1) {
  return `${(Number(value || 0) * 100).toFixed(digits)}%`;
}

function toNum(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function calculationHint({ isSelfClosed, isApprentice, belowThreshold }) {
  if (!isSelfClosed) return "Сделка не самостоятельная: базовая комиссия и KPI-бонус не начисляются.";
  if (isApprentice) return "Период ученичества: базовая комиссия начисляется, KPI-бонус отключён.";
  if (belowThreshold) return "K_kpi ниже порога: KPI-бонус обнулён, базовая комиссия сохраняется.";
  return "Полный режим: начисляются и базовая комиссия, и KPI-бонус.";
}

export function renderPartnerMotivation(container) {
  container.innerHTML = `
    <div class="doc-page-content">
      <nav class="doc-toc">
        <a href="#pm-structure">Структура вознаграждения</a>
        <a href="#pm-kpi">KPI и коэффициент</a>
        <a href="#pm-threshold">Порог отсечения</a>
        <a href="#pm-self">Самостоятельность</a>
        <a href="#pm-apprentice">Ученичество</a>
        <a href="#pm-qualified-lead">Квалифицированный лид</a>
        <a href="#pm-payout">Возвраты и выплаты</a>
        <a href="#pm-long-deals">Длинные сделки</a>
        <a href="#pm-calculator">Калькулятор</a>
        <a href="#pm-scenarios">Сценарии</a>
      </nav>

      <section id="pm-structure" class="doc-section">
        <h3>1. Структура вознаграждения</h3>
        <div class="doc-formula">Доход за неделю = Оклад + 4% × V + 5% × V × K_kpi</div>
        <ul class="doc-list">
          <li><b>V</b> — сумма самостоятельно закрытых партнёром сделок за неделю.</li>
          <li><b>4%</b> — базовая комиссия от V.</li>
          <li><b>5% × K_kpi</b> — KPI-бонус, где <code>K_kpi ∈ [0; 1]</code>.</li>
        </ul>
      </section>

      <section id="pm-kpi" class="doc-section">
        <h3>2. Расчёт K_kpi (три равных веса по 1/3)</h3>
        <div class="doc-formula">
          Z_score = min(Zoom-встречи / 10; 1)<br>
          D_score = min(сделки / 2; 1)<br>
          V_score = min(объём / 3 000 000 ₸; 1)<br>
          K_kpi = (Z_score + D_score + V_score) / 3
        </div>
        <p class="doc-note">Ограничение <code>min(...; 1)</code> не позволяет перевыполнить один KPI и компенсировать провал по другим.</p>
      </section>

      <section id="pm-threshold" class="doc-section">
        <h3>3. Порог отсечения</h3>
        <p>Если <code>K_kpi &lt; 70%</code> — бонусная часть = 0 полностью. Базовая комиссия 4% сохраняется.</p>
      </section>

      <section id="pm-self" class="doc-section">
        <h3>4. Условие «самостоятельности»</h3>
        <p>Базовая 4% и KPI-бонус 5% начисляются только если:</p>
        <ul class="doc-list">
          <li>Сделка прошла все стадии воронки с партнёром как ответственным.</li>
          <li>Руководитель/наставник не подключался на этапах «Переговоры» и «Договор» как закрывающий.</li>
        </ul>
        <p class="doc-note">При нарушении условий начисляется только оклад.</p>
      </section>

      <section id="pm-apprentice" class="doc-section">
        <h3>5. Период ученичества</h3>
        <p>В период ученичества партнёру выплачивается базовая комиссия 4%. KPI-бонус 5% не начисляется.</p>
      </section>

      <section id="pm-qualified-lead" class="doc-section">
        <h3>6. Что считать «квалифицированным лидом»</h3>
        <p>Zoom-встреча идёт в KPI только если выполнены все условия:</p>
        <ol class="doc-list ordered">
          <li>Личный доход ЛПР/собственника от $5 000 в месяц.</li>
          <li>Постоянная команда от 5 сотрудников.</li>
          <li>Подтверждена реальная потребность в разработке с пониманием бюджета.</li>
        </ol>
        <p class="doc-note">Кратко: «есть деньги + есть боль».</p>
      </section>

      <section id="pm-payout" class="doc-section">
        <h3>7. Возвраты и выплаты</h3>
        <ul class="doc-list">
          <li>Комиссия выплачивается после полной сдачи проекта и подписания актов.</li>
          <li>До актов комиссия начисляется, но не выплачивается.</li>
          <li>При возврате оплаты комиссия удерживается из ближайших начислений.</li>
          <li>При полной отмене проекта без актов комиссия не выплачивается.</li>
        </ul>
      </section>

      <section id="pm-long-deals" class="doc-section">
        <h3>8. Длинные сделки между неделями</h3>
        <p>Сделка относится к неделе, в которую она получила статус «Выиграна» (по <code>updatedAt</code> финальной стадии).</p>
      </section>

      <section id="pm-calculator" class="doc-section">
        <h3>9. Калькулятор</h3>
        <div class="calc-wrap">
          <details class="calc-params">
            <summary>Параметры</summary>
            <div class="calc-grid">
              <label class="calc-row">План Zoom<input class="calc-input" type="number" min="0" step="1" name="planZ" value="${DEFAULTS.planZ}"></label>
              <label class="calc-row">План сделок<input class="calc-input" type="number" min="0" step="1" name="planD" value="${DEFAULTS.planD}"></label>
              <label class="calc-row">План объёма, ₸<input class="calc-input" type="number" min="0" step="1000" name="planV" value="${DEFAULTS.planV}"></label>
              <label class="calc-row">Базовая ставка, %<input class="calc-input" type="number" min="0" step="0.1" name="rateBase" value="${DEFAULTS.rateBase}"></label>
              <label class="calc-row">Ставка KPI-бонуса, %<input class="calc-input" type="number" min="0" step="0.1" name="rateBonus" value="${DEFAULTS.rateBonus}"></label>
              <label class="calc-row">Порог K_kpi, %<input class="calc-input" type="number" min="0" max="100" step="0.1" name="threshold" value="${DEFAULTS.threshold}"></label>
            </div>
          </details>

          <div class="calc-grid calc-grid-main">
            <label class="calc-row">Z — Zoom-встречи<input class="calc-input" type="number" min="0" step="1" name="factZ" value="${DEFAULTS.factZ}"></label>
            <label class="calc-row">D — закрытые сделки<input class="calc-input" type="number" min="0" step="1" name="factD" value="${DEFAULTS.factD}"></label>
            <label class="calc-row">V — объём, ₸<input class="calc-input" type="number" min="0" step="1000" name="factV" value="${DEFAULTS.factV}"></label>
            <label class="calc-row">Оклад, ₸<input class="calc-input" type="number" min="0" step="1000" name="salary" value="${DEFAULTS.salary}"></label>
            <label class="calc-row">Партнёр в периоде ученичества?
              <select class="calc-input" name="apprentice">
                <option value="no" selected>Нет</option>
                <option value="yes">Да</option>
              </select>
            </label>
            <label class="calc-row">Сделка закрыта самостоятельно?
              <select class="calc-input" name="selfClosed">
                <option value="yes" selected>Да</option>
                <option value="no">Нет</option>
              </select>
            </label>
          </div>

          <div class="calc-output">
            <div class="calc-output-grid">
              <div><span>Z_score</span><strong data-out="zScore">0%</strong></div>
              <div><span>D_score</span><strong data-out="dScore">0%</strong></div>
              <div><span>V_score</span><strong data-out="vScore">0%</strong></div>
              <div><span>K_kpi</span><strong data-out="kpi">0%</strong></div>
              <div><span>Базовая комиссия</span><strong data-out="base">0 ₸</strong></div>
              <div><span>KPI-бонус</span><strong data-out="bonus">0 ₸</strong></div>
              <div><span>Эффективная ставка от V</span><strong data-out="effRate">0%</strong></div>
              <div><span>Прогноз на месяц</span><strong data-out="month">0 ₸</strong></div>
            </div>
            <div class="calc-kpi-bar" data-out="kpiBar">
              <span style="width:0%"></span>
            </div>
            <div class="calc-kpi-label" data-out="kpiLabel">ниже порога</div>
            <div class="calc-note" data-out="note"></div>
            <div class="calc-total">Итого за неделю: <b data-out="total">0 ₸</b></div>
          </div>
        </div>
      </section>

      <section id="pm-scenarios" class="doc-section">
        <h3>10. Сценарии</h3>
        <div class="calc-scenarios-wrap">
          <table class="calc-scenarios">
            <thead>
              <tr>
                <th>Сценарий</th>
                <th>K_kpi</th>
                <th>База</th>
                <th>Бонус</th>
                <th>Итого комиссия</th>
              </tr>
            </thead>
            <tbody data-out="scenariosRows"></tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  const formScope = container.querySelector(".doc-page-content");
  if (!formScope) return;

  function readValues() {
    return {
      planZ: toNum(formScope.querySelector('[name="planZ"]')?.value, DEFAULTS.planZ),
      planD: toNum(formScope.querySelector('[name="planD"]')?.value, DEFAULTS.planD),
      planV: toNum(formScope.querySelector('[name="planV"]')?.value, DEFAULTS.planV),
      rateBase: toNum(formScope.querySelector('[name="rateBase"]')?.value, DEFAULTS.rateBase),
      rateBonus: toNum(formScope.querySelector('[name="rateBonus"]')?.value, DEFAULTS.rateBonus),
      threshold: toNum(formScope.querySelector('[name="threshold"]')?.value, DEFAULTS.threshold),
      factZ: toNum(formScope.querySelector('[name="factZ"]')?.value, DEFAULTS.factZ),
      factD: toNum(formScope.querySelector('[name="factD"]')?.value, DEFAULTS.factD),
      factV: toNum(formScope.querySelector('[name="factV"]')?.value, DEFAULTS.factV),
      salary: toNum(formScope.querySelector('[name="salary"]')?.value, DEFAULTS.salary),
      apprentice: String(formScope.querySelector('[name="apprentice"]')?.value || DEFAULTS.apprentice),
      selfClosed: String(formScope.querySelector('[name="selfClosed"]')?.value || DEFAULTS.selfClosed),
    };
  }

  function renderScenarios(baseValues) {
    const tbody = formScope.querySelector('[data-out="scenariosRows"]');
    if (!tbody) return;

    tbody.innerHTML = SCENARIOS.map((sc) => {
      const kpi = computeKpi({
        Z: sc.Z,
        D: sc.D,
        V: sc.V,
        planZ: baseValues.planZ,
        planD: baseValues.planD,
        planV: baseValues.planV,
      });
      const payout = computePayout({
        V: sc.V,
        K_kpi_raw: kpi.K_kpi_raw,
        isApprentice: sc.apprentice,
        isSelfClosed: sc.selfClosed,
        rateBase: baseValues.rateBase,
        rateBonus: baseValues.rateBonus,
        threshold: baseValues.threshold,
        salary: 0,
      });
      const totalCommission = payout.base + payout.bonus;
      return `
        <tr>
          <td>${escapeHtml(sc.title)}</td>
          <td>${fmtPct(payout.K_kpi_eff)}</td>
          <td>${fmtMoney(payout.base)} ₸</td>
          <td>${fmtMoney(payout.bonus)} ₸</td>
          <td class="is-total">${fmtMoney(totalCommission)} ₸</td>
        </tr>
      `;
    }).join("");
  }

  function recalc() {
    const v = readValues();
    const kpi = computeKpi({
      Z: v.factZ,
      D: v.factD,
      V: v.factV,
      planZ: v.planZ,
      planD: v.planD,
      planV: v.planV,
    });
    const payout = computePayout({
      V: v.factV,
      K_kpi_raw: kpi.K_kpi_raw,
      isApprentice: v.apprentice === "yes",
      isSelfClosed: v.selfClosed === "yes",
      rateBase: v.rateBase,
      rateBonus: v.rateBonus,
      threshold: v.threshold,
      salary: v.salary,
    });

    const out = {
      zScore: fmtPct(kpi.Z_score),
      dScore: fmtPct(kpi.D_score),
      vScore: fmtPct(kpi.V_score),
      kpi: fmtPct(payout.K_kpi_eff),
      base: `${fmtMoney(payout.base)} ₸`,
      bonus: `${fmtMoney(payout.bonus)} ₸`,
      effRate: v.factV > 0 ? `${(((payout.base + payout.bonus) / v.factV) * 100).toFixed(2)}%` : "0%",
      total: `${fmtMoney(payout.total)} ₸`,
      month: `${fmtMoney(payout.total * 4.33)} ₸`,
      note: calculationHint({
        isSelfClosed: v.selfClosed === "yes",
        isApprentice: v.apprentice === "yes",
        belowThreshold: payout.belowThreshold,
      }),
    };

    Object.entries(out).forEach(([key, value]) => {
      const el = formScope.querySelector(`[data-out="${key}"]`);
      if (el) el.textContent = value;
    });

    const thresholdPct = Math.max(0, Math.min(100, toNum(v.threshold, 70)));
    const progressPct = Math.max(0, Math.min(100, payout.K_kpi_eff * 100));
    const rawPct = Math.max(0, Math.min(100, kpi.K_kpi_raw * 100));
    const bar = formScope.querySelector('[data-out="kpiBar"]');
    const label = formScope.querySelector('[data-out="kpiLabel"]');
    if (bar) {
      bar.classList.toggle("is-below-threshold", payout.belowThreshold);
      const span = bar.querySelector("span");
      if (span) span.style.width = `${payout.belowThreshold ? rawPct : progressPct}%`;
    }
    if (label) {
      label.textContent = payout.belowThreshold
        ? `ниже порога ${thresholdPct.toFixed(0)}%`
        : `порог выполнен (${thresholdPct.toFixed(0)}%)`;
      label.classList.toggle("is-danger", payout.belowThreshold);
    }

    renderScenarios(v);
  }

  formScope.addEventListener("input", recalc);
  formScope.addEventListener("change", recalc);
  recalc();
}
