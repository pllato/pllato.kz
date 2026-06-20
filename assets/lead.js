/* ============================================================
   Pllato — общий обработчик лид-форм для посадочных страниц.
   Подключение:
     <script src="/assets/lead.js" defer></script>
   Разметка формы:
     <form class="js-lead-form" data-source="Лендинг: Разработка под ключ" novalidate>
       <input type="tel" name="phone" required autocomplete="tel" inputmode="tel">
       <button type="submit">Заказать разработку</button>
     </form>
     <div class="form-success" data-lead-success>...</div>   (опционально)
     <div class="form-error-state" data-lead-error>...</div>  (опционально)

   Что делает: захват gclid/utm (сквозная аналитика), анти-бот (honeypot +
   time-trap + анти-дабл), отправка в Telegram, события lead_submitted в
   GA4/GTM/Метрику/Meta, бэкап в localStorage. Логика идентична главной.
============================================================ */
(function () {
  'use strict';

  // Те же реквизиты, что на главной (и так публичны в клиенте).
  var TELEGRAM_BOT_TOKEN = '8719630290:AAHA0SwlavUEU_i3bWYLVMv5xwAQO3g1gos';
  var TELEGRAM_CHAT_ID   = '-5297917142'; // группа «Заявки с сайта pllato.kz»

  /* ===== Attribution: захват gclid/utm для closed-loop ===== */
  (function captureAdAttribution() {
    try {
      var p = new URLSearchParams(location.search);
      var fields = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term'];
      var found = {};
      fields.forEach(function (k) { var v = p.get(k); if (v) found[k] = v; });
      if (Object.keys(found).length) {
        found._ts = new Date().toISOString();
        var exists = /(?:^|;\s*)pllato_attr=/.test(document.cookie);
        if (!exists || found.gclid || found.gbraid || found.wbraid) {
          document.cookie = 'pllato_attr=' + encodeURIComponent(JSON.stringify(found)) +
            ';path=/;max-age=' + (90 * 24 * 3600) + ';SameSite=Lax';
        }
      }
    } catch (e) { /* no-op */ }
  })();

  function getAdAttribution() {
    try {
      var m = document.cookie.match(/(?:^|;\s*)pllato_attr=([^;]+)/);
      if (!m) return [];
      var a = JSON.parse(decodeURIComponent(m[1]));
      var lines = [];
      if (a.gclid)  lines.push('gclid: ' + a.gclid);
      if (a.gbraid) lines.push('gbraid: ' + a.gbraid);
      if (a.wbraid) lines.push('wbraid: ' + a.wbraid);
      var utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term']
        .map(function (k) { return a[k]; }).filter(Boolean);
      if (utm.length) lines.push('UTM: ' + utm.join(' / '));
      return lines.length ? ['', '— Источник рекламы —'].concat(lines) : [];
    } catch (e) { return []; }
  }

  /* ===== Телефон: чистка ввода ===== */
  function cleanPhone(value) {
    var cleaned = value.replace(/[^\d+\s()\-]/g, '');
    if (cleaned.charAt(0) === '+') cleaned = '+' + cleaned.slice(1).replace(/\+/g, '');
    else cleaned = cleaned.replace(/\+/g, '');
    return cleaned.slice(0, 24);
  }

  /* ===== Текст заявки ===== */
  function buildLeadText(phone, source) {
    var digits = (phone || '').replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) return null;
    var time = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' });
    var ref = document.referrer || 'Прямой заход';
    var device = navigator.userAgent.indexOf('Mobile') !== -1 ? 'Мобайл' : 'Десктоп';
    return [
      '🆕 Новая заявка с pllato.kz',
      '',
      'Телефон: ' + phone,
      'Страница: ' + source,
      'URL: ' + location.pathname,
      'Время: ' + time + ' (Алматы)',
      'Источник: ' + ref,
      'Устройство: ' + device
    ].join('\n');
  }

  function sendToTelegram(text) {
    if (!text || !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return Promise.resolve();
    return fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text })
    });
  }

  function saveLeadBackup(phone, source) {
    try {
      var stored = JSON.parse(localStorage.getItem('pllato_leads_backup') || '[]');
      stored.push({ phone: phone, source: source, time: new Date().toISOString() });
      if (stored.length > 50) stored.splice(0, stored.length - 50);
      localStorage.setItem('pllato_leads_backup', JSON.stringify(stored));
    } catch (e) { /* no-op */ }
  }

  function fireLeadEvents(source) {
    if (window.dataLayer) window.dataLayer.push({ event: 'lead_submitted', lead_source: source });
    if (typeof window.gtag === 'function') window.gtag('event', 'lead_submitted', { source: source });
    if (typeof window.ym === 'function' && window.YANDEX_METRIKA_ID) window.ym(window.YANDEX_METRIKA_ID, 'reachGoal', 'lead_submitted');
    if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { source: source });
  }

  /* ===== Инициализация формы (honeypot + time-trap) ===== */
  function initLeadForm(form) {
    form.dataset.loadedAt = Date.now().toString();
    if (!form.querySelector('input[name="website"]')) {
      var trap = document.createElement('input');
      trap.type = 'text'; trap.name = 'website'; trap.tabIndex = -1;
      trap.autocomplete = 'off'; trap.setAttribute('aria-hidden', 'true');
      trap.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
      form.insertBefore(trap, form.firstChild);
    }
    var phone = form.querySelector('input[name="phone"]');
    if (phone) {
      phone.addEventListener('input', function () {
        var nv = cleanPhone(phone.value);
        if (nv !== phone.value) phone.value = nv;
        form.classList.remove('error');
      });
    }
  }

  function siblingFlag(form, selector) {
    var scope = form.parentElement || document;
    return scope.querySelector(selector) || document.querySelector(selector);
  }

  function handleFormSubmit(form) {
    var source = form.dataset.source || ('Лендинг: ' + document.title);

    // Honeypot
    var honeypot = form.querySelector('input[name="website"]');
    if (honeypot && honeypot.value.trim() !== '') return;

    // Time-trap
    var loaded = parseInt(form.dataset.loadedAt || '0', 10);
    if (loaded > 0 && (Date.now() - loaded) / 1000 < 3) return;

    // Анти-дабл
    if (form.dataset.submitting === '1') return;
    form.dataset.submitting = '1';
    setTimeout(function () { form.dataset.submitting = '0'; }, 5000);

    var phoneInput = form.querySelector('input[name="phone"]');
    var phone = phoneInput ? phoneInput.value.trim() : '';
    var digits = phone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) {
      form.classList.add('error');
      if (phoneInput) phoneInput.focus();
      setTimeout(function () { form.classList.remove('error'); }, 500);
      return;
    }

    var success = siblingFlag(form, '[data-lead-success]');
    var error = siblingFlag(form, '[data-lead-error]');

    // Номер владельца — показываем успех, но не шлём
    var ownerNumbers = ['77011239999', '7011239999'];
    if (ownerNumbers.indexOf(digits) !== -1) {
      form.style.display = 'none';
      if (success) success.classList.add('show');
      return;
    }

    // Optimistic UI
    form.style.display = 'none';
    var note = form.nextElementSibling;
    if (note && (note.classList.contains('form-note') || note.classList.contains('form-note-light'))) note.style.display = 'none';
    if (error) error.classList.remove('show');
    if (success) success.classList.add('show');

    saveLeadBackup(phone, source);
    fireLeadEvents(source);

    var text = buildLeadText(phone, source);
    if (!text) return;
    var attr = getAdAttribution();
    if (attr.length) text = text + '\n' + attr.join('\n');

    sendToTelegram(text).catch(function (e) { console.error('[Pllato] Telegram:', e); });
  }

  /* ===== Привязка + клики WhatsApp/тел как контакт-конверсии ===== */
  function sendContact(eventName, label) {
    if (window.dataLayer) window.dataLayer.push({ event: eventName, lead_source: label });
    if (typeof window.gtag === 'function') window.gtag('event', eventName, { source: label });
    if (typeof window.ym === 'function' && window.YANDEX_METRIKA_ID) window.ym(window.YANDEX_METRIKA_ID, 'reachGoal', eventName);
    if (typeof window.fbq === 'function') window.fbq('track', 'Contact', { source: label });
  }

  function init() {
    document.querySelectorAll('form.js-lead-form').forEach(function (form) {
      initLeadForm(form);
      form.addEventListener('submit', function (e) { e.preventDefault(); handleFormSubmit(form); });
    });
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (/(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)/i.test(href)) sendContact('contact_whatsapp', 'whatsapp_link');
      else if (/^tel:/i.test(href)) sendContact('contact_phone', 'phone_link');
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
