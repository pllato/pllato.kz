/* Модуль «Продуктивность / Биодата». Верифицируемые факты (валидность .38–.44).
   Каждый пункт скорится 0–2 по рубрике → сумма нормируется в 0–100.
   Текстовые ответы (достижения, кто подтвердит) уходят в панель как
   «ЧТО ПРОВЕРИТЬ на интервью и по рекомендациям».
   kind: number | select | textlist | refs | text.
   bands (для number): массив {min, score} — берётся первый подходящий (по убыванию min).
   options (для select): {label, score}. */
window.HR_BIODATA = {
  core: [
    { id: 'BD-1', kind: 'number', label: 'Сколько месяцев вы проработали на последнем месте?', unit: 'мес.',
      bands: [{ min: 36, score: 2 }, { min: 12, score: 1 }, { min: 0, score: 0 }] },
    { id: 'BD-2', kind: 'number', label: 'Сколько работодателей у вас было за последние 5 лет?',
      bands: [{ min: 4, score: 0 }, { min: 3, score: 1 }, { min: 0, score: 2 }],
      workerBands: [{ min: 6, score: 0 }, { min: 4, score: 1 }, { min: 0, score: 2 }] },
    { id: 'BD-3', kind: 'textlist', label: 'Назовите до 3 конкретных результатов вашей работы (желательно с цифрами).', slots: 3,
      verify: true, help: 'Результаты с числами оцениваются выше. Работодатель подтверждает на интервью.' },
    { id: 'BD-4', kind: 'refs', label: 'Кто может подтвердить эти результаты? (должность и имя; контакт по желанию)', slots: 2,
      verify: true, redFlagIf: 'results_without_refs' },
    { id: 'BD-5', kind: 'select', label: 'Повышали ли вас (должность / разряд / категория)?',
      options: [{ label: 'Два и более раз', score: 2 }, { label: 'Один раз', score: 1 }, { label: 'Нет', score: 0 }] },
    { id: 'BD-6', kind: 'select', label: 'Основная причина ухода с последнего места:',
      options: [
        { label: 'Рост / зарплата / переезд / окончание проекта', score: 2 },
        { label: 'Сокращение / закрытие компании', score: 1 },
        { label: 'Конфликт / несправедливость / не сошлись характерами', score: 0, flag: 'Расспросить на интервью' }] },
  ],
  manager: [
    { id: 'BDm-1', kind: 'number', label: 'Максимальный размер команды в вашем подчинении (человек):',
      bands: [{ min: 20, score: 2 }, { min: 5, score: 1 }, { min: 0, score: 0 }] },
    { id: 'BDm-2', kind: 'text', label: 'Бюджет / объём объектов под вашим управлением (с цифрой):', verify: true,
      scoreIfFilled: 2 },
    { id: 'BDm-3', kind: 'text', label: 'Пример сотрудника, которого вы вырастили (имя, из кого в кого):', verify: true,
      scoreIfFilled: 2 },
    { id: 'BDm-4', kind: 'select', label: 'Сдавали ли вы объект/проект полностью под вашей ответственностью?',
      options: [{ label: 'Да, два и более', score: 2 }, { label: 'Один раз', score: 1 }, { label: 'Нет', score: 0 }] },
  ],
  itr: [
    { id: 'BDi-1', kind: 'number', label: 'Сколько объектов сдали / отчётных периодов закрыли?',
      bands: [{ min: 5, score: 2 }, { min: 1, score: 1 }, { min: 0, score: 0 }] },
    { id: 'BDi-2', kind: 'select', label: 'Владение профильными инструментами (сметные ПО / AutoCAD / 1С):',
      options: [{ label: 'Работал ежедневно', score: 2 }, { label: 'Знаком', score: 1 }, { label: 'Не работал', score: 0 }] },
    { id: 'BDi-3', kind: 'text', label: 'Пример сэкономленных денег или найденной ошибки (с суммой):', verify: true, scoreIfFilled: 2 },
    { id: 'BDi-4', kind: 'select', label: 'Повышение квалификации за 2 года (курс / аттестация с документом):',
      options: [{ label: 'Да, с документом', score: 2 }, { label: 'Без документа', score: 1 }, { label: 'Нет', score: 0 }] },
  ],
  sales: [
    { id: 'BDs-1', kind: 'select', label: 'Выполнение плана за последний год:',
      options: [{ label: '100% и выше', score: 2 }, { label: '80–99%', score: 1 }, { label: 'Ниже 80% или плана не было', score: 0 }] },
    { id: 'BDs-2', kind: 'text', label: 'Самая крупная сделка (сумма):', verify: true, scoreIfFilled: 2 },
    { id: 'BDs-3', kind: 'select', label: 'Длительность самых долгих отношений с клиентом:',
      options: [{ label: '2 года и более', score: 2 }, { label: '1–2 года', score: 1 }, { label: 'Меньше года', score: 0 }] },
    { id: 'BDs-4', kind: 'number', label: 'Сколько новых клиентов привлекли за последний год?',
      bands: [{ min: 5, score: 2 }, { min: 1, score: 1 }, { min: 0, score: 0 }] },
  ],
  worker: [
    { id: 'BDw-1', kind: 'select', label: 'Ваш разряд / категория по профессии:',
      options: [{ label: 'Высший для профессии', score: 2 }, { label: 'Средний', score: 1 }, { label: 'Начальный / нет', score: 0 }] },
    { id: 'BDw-2', kind: 'number', label: 'Сколько у вас действующих допусков / удостоверений (высота, стропальщик, НАКС, электробезопасность и т.п.)?',
      bands: [{ min: 2, score: 2 }, { min: 1, score: 1 }, { min: 0, score: 0 }] },
    { id: 'BDw-3', kind: 'number', label: 'Сколько раз за последний год вы отсутствовали на работе не по графику?',
      bands: [{ min: 6, score: 0 }, { min: 3, score: 1 }, { min: 0, score: 2 }], redFlagAbove: 5 },
    { id: 'BDw-4', kind: 'select', label: 'Есть ли у вас опыт наставничества новичков?',
      options: [{ label: 'Да, могу назвать кого', score: 2 }, { label: 'Немного', score: 1 }, { label: 'Нет', score: 0 }] },
  ],
};
