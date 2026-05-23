-- 004_seed_ukolova_campaign.sql
-- Campaign + script seed. Data-only; no hardcoded logic in application code.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS customer_sources (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

INSERT OR IGNORE INTO customer_sources (id, name) VALUES
  ('source_ukolova_2026', 'ukolova-2026');

INSERT OR REPLACE INTO call_scripts (id, name, description, created_by, created_at, is_active) VALUES
  ('script_ukolova_v1', 'Холодный звонок · база Уколовой v1', 'Cold-call script for intensive lead campaign', NULL, strftime('%s','now'), 1);

DELETE FROM call_script_stages WHERE script_id = 'script_ukolova_v1';

INSERT INTO call_script_stages (
  id, script_id, order_index, code, name, goal, script_text, tip, whatsapp_template, is_terminal
) VALUES
  (
    'stage_opening', 'script_ukolova_v1', 1, 'opening', 'Тёплый вход',
    'За 15 секунд снять статус холодного звонка — собеседник должен понять, что я свой',
    'Здравствуйте, {customer_name}! Меня зовут {caller_name}. Я взял ваш телефон из чата интенсива Екатерины Уколовой — я тоже там был. Удобно сейчас минуту поговорить?',
    'Никаких "вам удобно говорить", "отнимет 5 минут". Конкретно: "минуту поговорить" — низкий порог входа.',
    NULL,
    0
  ),
  (
    'stage_symmetry', 'script_ukolova_v1', 2, 'symmetry', 'Симметрия',
    'Уравнять позиции — я не продавец, я такой же предприниматель',
    'Я звоню просто познакомиться. Я тоже веду бизнес — у меня сеть школ английского языка в Алматы и Астане. А у вас какой бизнес?',
    'Ключевая фраза — "познакомиться". Собеседник почти всегда расскажет про свой бизнес.',
    NULL,
    0
  ),
  (
    'stage_qualification', 'script_ukolova_v1', 3, 'qualification', 'Квалификация',
    'В формате дружеского разговора понять масштаб, команду, CRM, боли',
    'Интересно! А давно занимаетесь? Сколько у вас сейчас человек в команде? Как клиентов ведёте — в Excel, в Bitrix, в блокноте? А что в работе самое затратное по времени?',
    'Не задавай списком. Реагируй на ответы. Цель — услышать болевую точку, на которую потом ляжет оффер.',
    NULL,
    0
  ),
  (
    'stage_bridge', 'script_ukolova_v1', 4, 'bridge', 'Мостик к офферу',
    'Аккуратно представить второе направление — кастомные CRM',
    'Слушайте, у нас помимо школ есть ещё одно направление — разрабатываем кастомные CRM под бизнес-процессы. Сейчас активно этим занимаемся. Не коробка типа Bitrix, а ровно под ваши процессы. У вас сейчас как с CRM?',
    '"У нас ещё одно направление" — звучит как делюсь, а не продаю.',
    NULL,
    0
  ),
  (
    'stage_invitation', 'script_ukolova_v1', 5, 'invitation', 'Приглашение',
    'Перевести в конкретное действие — встреча 30 минут с партнёром',
    'Я вас хочу позвать — наш главный партнёр Платон проведёт разбор и покажет, какие точки роста могут быть у вас. Бесплатно, 30 минут. Без презентаций — пройдёмся по вашим процессам и скажем, есть смысл или нет. Когда вам удобнее — на этой неделе или на следующей?',
    'Не "вам интересно?" — это закрытый вопрос с лёгким "нет". А "на этой или следующей" — выбор без выбора.',
    'Здравствуйте, {customer_name}! Это {caller_name}, мы только что говорили. Подтверждаю встречу-разбор {meeting_date} в {meeting_time}. Перед встречей подумайте над 3 вопросами: 1) какие 2-3 процесса в бизнесе самые проблемные, 2) что используете сейчас (Bitrix/Excel/блокнот), 3) сколько человек в команде. Ссылка на Zoom придёт за час. До связи!',
    0
  ),
  (
    'stage_closing_booked', 'script_ukolova_v1', 6, 'closing_booked', 'Договорённость',
    'Закрепить встречу или мягко выйти с открытой дверью',
    'Отлично! Тогда {meeting_date}, {meeting_time}. Сейчас скину в WhatsApp подтверждение и короткий бриф — чтобы вы понимали, к чему мы пришли. До связи!',
    'WhatsApp в течение 5 минут после звонка. Иначе через час забудут.',
    NULL,
    1
  ),
  (
    'stage_closing_polite', 'script_ukolova_v1', 7, 'closing_polite', 'Вежливое завершение',
    'Корректно завершить разговор без давления',
    'Понял вас, спасибо за открытый ответ. Если ситуация изменится — буду рад вернуться к разговору. Хорошего дня!',
    'Сохраняем контакт тёплым, не давим.',
    NULL,
    1
  ),
  (
    'stage_closing_followup', 'script_ukolova_v1', 8, 'closing_followup', 'Follow-up',
    'Отправить кейсы и согласовать мягкий возврат',
    'Хорошо, давайте так: я отправлю короткие кейсы в WhatsApp и вернусь к вам через 2-3 дня. Ок?',
    'Фиксируем следующий шаг и дедлайн.',
    NULL,
    1
  ),
  (
    'stage_callback_scheduled', 'script_ukolova_v1', 9, 'callback_scheduled', 'Перезвон по времени',
    'Зафиксировать согласованное время повторного звонка',
    'Договорились, тогда перезвоню в согласованное время. Спасибо!',
    'Обязательно занеси время перезвона в заметки.',
    NULL,
    1
  );

INSERT INTO call_script_transitions (id, stage_id, trigger_label, next_stage_code, outcome, order_index) VALUES
  ('tr_opening_1', 'stage_opening', 'Да, удобно', 'symmetry', NULL, 1),
  ('tr_opening_2', 'stage_opening', 'Не сейчас', 'callback_scheduled', 'callback', 2),
  ('tr_opening_3', 'stage_opening', 'Откуда у вас номер', 'symmetry', NULL, 3),

  ('tr_symmetry_1', 'stage_symmetry', 'Рассказывает про бизнес', 'qualification', NULL, 1),

  ('tr_qualification_1', 'stage_qualification', 'Команда 5+ или есть боли с процессами', 'bridge', 'qualified_pending', 1),
  ('tr_qualification_2', 'stage_qualification', 'Один без команды / совсем мелкий', 'closing_polite', 'rejected', 2),

  ('tr_bridge_1', 'stage_bridge', 'Используем CRM / не используем', 'invitation', NULL, 1),
  ('tr_bridge_2', 'stage_bridge', 'Не интересно', 'closing_polite', 'rejected', 2),

  ('tr_invitation_1', 'stage_invitation', 'Конкретное время', 'closing_booked', 'meeting_booked', 1),
  ('tr_invitation_2', 'stage_invitation', 'Подумаю', 'closing_followup', 'callback', 2),
  ('tr_invitation_3', 'stage_invitation', 'Не интересно', 'closing_polite', 'rejected', 3);

INSERT INTO call_script_objections (id, stage_id, question, answer, order_index) VALUES
  ('obj_symmetry_1', 'stage_symmetry', 'А что вы продаёте?', 'Сейчас ничего не продаю — просто звоню по чату, знакомлюсь с участниками. У нас в группе много интересных людей. У вас какой бизнес?', 1),

  ('obj_qualification_1', 'stage_qualification', 'А зачем вам это знать?', 'Да я просто интересуюсь — сам разные форматы пробовал, смотрю что у других работает. Поделитесь?', 1),

  ('obj_bridge_1', 'stage_bridge', 'У нас уже есть Bitrix/amoCRM', 'Это нормально. Мы как раз часто помогаем когда коробка не садится — что-то дорабатываем. На разборе можно посмотреть.', 1),
  ('obj_bridge_2', 'stage_bridge', 'Сколько стоит?', 'Зависит от объёма — ядро от 890 тысяч тенге, дальше модулями. Но я не для этого звоню — давайте сначала посмотрим, есть ли смысл. Бесплатный разбор 30 минут.', 2),

  ('obj_invitation_1', 'stage_invitation', 'Что мне это даст?', 'Минимум — взгляд со стороны. Партнёр видит десятки бизнесов, обычно подсказывает 2-3 точки не видные изнутри. Максимум — если что-то ляжет, обсудим формат.', 1),
  ('obj_invitation_2', 'stage_invitation', 'У меня нет времени', 'Понимаю. Тогда я просто пришлю короткое видео — 5 минут, посмотрите когда удобно. Если зацепит — спишемся.', 2);

INSERT OR REPLACE INTO call_campaigns (id, name, script_id, source_id, created_by, created_at, status) VALUES
  ('cmp_ukolova_2026', 'Ukolova 2026', 'script_ukolova_v1', 'source_ukolova_2026', NULL, strftime('%s','now'), 'active');
