/* Pllato HR-Ассесмент — конфигурация семейств должностей.
   Веса и пороги — из доказательной спецификации (Sackett et al. 2022;
   Berry/Lievens/Zhang/Sackett; Ones et al. 1993). Всё редактируемо.
   ВАЖНО: код результата хранит только сырые ответы. Веса и интерпретация
   живут здесь и в панели анализа — их можно менять, не ломая старые коды. */
window.HR_POSITIONS = {
  /* Модули батареи: personality, cognitive, sjt, integrity, biodata, knowledge, attention.
     Порядок в `modules` = порядок прохождения кандидатом. */
  manager: {
    id: 'manager',
    label: 'Руководители / менеджеры',
    short: 'Руководитель',
    icon: '👔',
    time: '~50–55 мин',
    modules: ['personality', 'cognitive', 'sjt', 'integrity', 'biodata'],
    sjtBank: 'manager',
    knowledgeProfile: null,
    // Веса общего Fit Score по модулям (Σ = 1.00)
    moduleWeights: { cognitive: 0.25, sjt: 0.20, personality: 0.20, integrity: 0.15, biodata: 0.20 },
    // Веса личностных доменов внутри личностного Fit (Σ = 1.00)
    personalityWeights: { C: 0.30, ES: 0.25, E: 0.20, H: 0.15, A: 0.05, O: 0.05 },
    cognitive: { recommend: 65, min: 50, note: 'Вербальная и числовая секции не ниже 50 перц.' },
    redFlags: { integrityBelow: 50, personalityRisk: ['C', 'H'] },
  },
  itr: {
    id: 'itr',
    label: 'ИТР / офисные специалисты',
    short: 'ИТР / офис',
    icon: '📐',
    time: '~45–50 мин',
    modules: ['personality', 'cognitive', 'attention', 'knowledge', 'integrity', 'biodata'],
    sjtBank: 'itr',
    knowledgeProfile: 'pto', // выбирается при старте: pto | supply | accounting
    moduleWeights: { knowledge: 0.30, cognitive: 0.25, personality: 0.15, attention: 0.10, integrity: 0.10, biodata: 0.10 },
    personalityWeights: { C: 0.35, H: 0.20, ES: 0.15, O: 0.15, A: 0.10, E: 0.05 },
    cognitive: { recommend: 60, min: 45, note: 'Абстрактная ≥50; внимательность ≥60 для ПТО.' },
    redFlags: { integrityBelow: 50, knowledgeBelow: 50, personalityRisk: ['C', 'H'] },
  },
  sales: {
    id: 'sales',
    label: 'Продажи / работа с клиентами',
    short: 'Продажи',
    icon: '🤝',
    time: '~45–50 мин',
    modules: ['personality', 'sjt', 'biodata', 'integrity', 'cognitive', 'knowledge'],
    sjtBank: 'sales',
    knowledgeProfile: 'sales',
    moduleWeights: { sjt: 0.25, personality: 0.25, biodata: 0.20, integrity: 0.15, cognitive: 0.10, knowledge: 0.05 },
    personalityWeights: { E: 0.30, C: 0.25, ES: 0.20, H: 0.15, A: 0.10, O: 0.00 },
    cognitive: { recommend: 50, min: 35, note: 'Вербальная ≥50 (речь и понимание клиента).' },
    redFlags: { integrityBelow: 50, personalityRisk: ['H'] },
  },
  worker: {
    id: 'worker',
    label: 'Рабочие специальности',
    short: 'Рабочие',
    icon: '🔧',
    time: '~30–35 мин',
    modules: ['personality', 'integrity', 'sjt', 'cognitive', 'biodata'],
    sjtBank: 'worker',
    knowledgeProfile: null,
    cognitiveForm: 'C', // облегчённая форма
    moduleWeights: { integrity: 0.30, personality: 0.20, sjt: 0.20, cognitive: 0.15, biodata: 0.15 },
    personalityWeights: { C: 0.35, H: 0.20, ES: 0.25, A: 0.15, E: 0.00, O: 0.00 },
    cognitive: { recommend: 20, min: 15, note: 'Только отсев; вес ≤15%. Внимательность информативнее.' },
    redFlags: { integrityBelow: 50, personalityRisk: ['C', 'H'] },
    recommendWorkSample: true, // панель советует практическую пробу + проверку допусков
  },
};

/* Интерпретационные полосы (перцентили / 0–100) — общие. */
window.HR_BANDS = {
  percentile: [
    { max: 15, label: 'низкий', color: '#c0392b' },
    { max: 30, label: 'ниже среднего', color: '#d98324' },
    { max: 69, label: 'средний', color: '#b8895a' },
    { max: 84, label: 'выше среднего', color: '#2f7d4f' },
    { max: 100, label: 'высокий', color: '#16794a' },
  ],
  // Fit Score → вердикт (никогда не «не брать», только уровень риска)
  fit: [
    { min: 75, verdict: 'Рекомендован к интервью', tone: 'good', note: 'Зон риска по тесту нет.' },
    { min: 60, verdict: 'С осторожностью', tone: 'warn', note: 'Проверить отмеченные зоны на интервью.' },
    { min: 0, verdict: 'Высокий риск', tone: 'bad', note: 'См. красные флаги. Тест — не единственное основание отказа.' },
  ],
};

/* 10 шкал для OCA-режима отображения (только формат визуализации).
   Каждая — производная от наших валидных шкал. НИКАКОЙ связи с методикой OCA. */
window.HR_OCA_SCALES = [
  { key: 'C1', label: 'Трудолюбие', from: ['C1'] },
  { key: 'C2', label: 'Организованность', from: ['C2'] },
  { key: 'C3', label: 'Самодисциплина', from: ['C3'] },
  { key: 'C4', label: 'Целеустремлённость', from: ['C4'] },
  { key: 'ES1', label: 'Стрессоустойчивость', from: ['ES1'] },
  { key: 'ES2', label: 'Контроль эмоций', from: ['ES2'] },
  { key: 'H', label: 'Честность', from: ['H'] },
  { key: 'E', label: 'Активность / общение', from: ['E'] },
  { key: 'A', label: 'Доброжелательность', from: ['A'] },
  { key: 'O', label: 'Обучаемость', from: ['O'] },
];
