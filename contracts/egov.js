// SIGEX basic eGov API: https://sigex.kz/support/developers/api-egov-basic/
// CMS_SIGN_ONLY сохраняет исходный файл и отделённую подпись .p7s.
import { extractSubjectFromCms } from './ncalayer.js?v=20261003-1';

const KEY = 'pllato.egov.v1:';
let active = false;
export function pendingEgov(context) {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY + context));
    if (value && (value.cms ? value.savedAt > Date.now() - 86400000 : value.expireAt > Date.now())) return value;
    sessionStorage.removeItem(KEY + context);
  } catch { /* недоступное/повреждённое хранилище */ }
  return null;
}
export function clearEgov(context) { sessionStorage.removeItem(KEY + context); }
function save(context, value) { value.savedAt = Date.now(); sessionStorage.setItem(KEY + context, JSON.stringify(value)); }

export function providerUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.port || url.username || url.password ||
      !/^(?:egov[0-9]+\.)?sigex\.kz$/.test(url.hostname)) {
    throw new Error('SIGEX вернул неподдерживаемый адрес. Подписание остановлено.');
  }
  return url.href;
}
function launchUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'm.egov.kz' || url.port || url.username || url.password) throw new Error('Некорректная ссылка eGov');
  return url.href;
}
export function cmsFromResponse(value) {
  if (value?.status === 'CANCELED') throw new Error('Вы отменили подписание в eGov. Договор не подписан.');
  if (value?.signMethod !== 'CMS_SIGN_ONLY' || value.documentsToSign?.length !== 1 ||
      value.documentsToSign[0].id !== 1) throw new Error('eGov вернул неожиданный результат подписания');
  const cms = value.documentsToSign[0].document?.file?.data;
  if (typeof cms !== 'string' || cms.length < 100 || !/^[A-Za-z0-9+/=\s]+$/.test(cms) ||
      atob(cms)[0] !== '0') throw new Error('eGov не вернул CMS-подпись');
  return cms;
}
async function request(url, options, signal) {
  const response = await fetch(url, { ...options, signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!response.ok) throw new Error(`Сервис eGov / SIGEX недоступен (${response.status}). Попробуйте ещё раз.`);
  const data = await response.json();
  if (data.message) throw new Error('SIGEX не смог выполнить запрос. Попробуйте ещё раз.');
  return data;
}
async function fingerprint(base64) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
function dialog() {
  const el = document.createElement('dialog');
  el.className = 'egov-dialog';
  el.innerHTML = `<h2>Подписать через eGov</h2>
    <p>Документ будет передан через сервис SIGEX в приложение eGov для подписания вашей ЭЦП.</p>
    <p class="egov-status" role="status" aria-live="polite">Нажмите «Продолжить», чтобы получить ссылку и QR.</p>
    <div class="egov-links"></div><div class="egov-qr"></div>
    <p>На телефоне откройте приложение кнопкой ниже. На компьютере отсканируйте QR в eGov Mobile. После подписания вернитесь в эту вкладку и дождитесь сохранения.</p>
    <div class="egov-actions"><button class="btn bronze" data-start>Продолжить</button><button class="btn" data-restart>Начать заново</button><button class="btn" data-close>Закрыть</button></div>`;
  document.body.append(el);
  el.showModal();
  return el;
}

// Данные операции переживают возврат из приложения/перезагрузку в той же вкладке.
// Подпись удаляется из sessionStorage только после подтверждения сохранения нашим API.
export async function signWithEgov({ context, base64, title, mime, metadata = {} }) {
  if (active) throw new Error('Подписание через eGov уже открыто');
  active = true;
  let el;
  const controller = new AbortController();
  const signal = controller.signal;
  let timer;
  let status;
  try {
    el = dialog();
    status = el.querySelector('.egov-status');
    el.querySelector('[data-restart]').onclick = () => {
      clearEgov(context);
      status.textContent = 'Предыдущая операция сброшена. Нажмите «Продолжить».';
    };
    await new Promise((resolve, reject) => {
      el.querySelector('[data-start]').onclick = resolve;
      const cancel = () => { controller.abort(); reject(new Error('Подписание закрыто')); };
      el.querySelector('[data-close]').onclick = cancel;
      el.addEventListener('cancel', cancel, { once: true });
    });
    el.querySelector('[data-start]').hidden = true;
    el.querySelector('[data-restart]').hidden = true;
    const cancel = () => controller.abort();
    el.querySelector('[data-close]').onclick = cancel;
    el.addEventListener('cancel', cancel, { once: true });
    status.textContent = 'Подготавливаю подписание…';
    const hash = await fingerprint(base64);
    let session = pendingEgov(context);
    if (session && session.hash !== hash) { clearEgov(context); session = null; }
    if (!session) {
      const back = new URL(location.href);
      back.hash = 'egov-return';
      timer = setTimeout(() => controller.abort(), 20000);
      const operation = await request('https://sigex.kz/api/egovQr', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: title, whenDone: { backUrl: back.href } }),
      }, signal);
      clearTimeout(timer);
      session = { ...operation, hash, metadata, uploaded: false };
      providerUrl(session.dataURL); providerUrl(session.signURL);
      if (!Number.isFinite(session.expireAt) || session.expireAt <= Date.now()) throw new Error('Срок действия ссылки eGov истёк');
      save(context, session);
    }
    if (session.cms) return { cms: session.cms, signer: extractSubjectFromCms(session.cms), tsp: false, metadata: session.metadata };
    timer = setTimeout(() => controller.abort(), Math.min(session.expireAt - Date.now(), 600000));
    const links = el.querySelector('.egov-links');
    for (const [label, value] of [['Открыть eGov Mobile', session.eGovMobileLaunchLink], ['Открыть eGov Business', session.eGovBusinessLaunchLink]]) {
      if (!value) continue;
      const a = document.createElement('a');
      a.className = 'btn bronze'; a.textContent = label; a.href = launchUrl(value);
      a.rel = 'noreferrer noopener'; links.append(a);
    }
    if (typeof session.qrCode !== 'string' || !/^[A-Za-z0-9+/=\s]+$/.test(session.qrCode)) throw new Error('SIGEX не вернул QR-код');
    const qr = document.createElement('img'); qr.alt = 'QR для подписания в eGov';
    qr.src = 'data:image/png;base64,' + session.qrCode; el.querySelector('.egov-qr').append(qr);
    status.textContent = 'Откройте eGov на телефоне или отсканируйте QR';
    if (!session.uploaded) {
      const uploaded = await request(providerUrl(session.dataURL), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signMethod: 'CMS_SIGN_ONLY', documentsToSign: [{
          id: 1, nameRu: title, nameKz: title, nameEn: title, meta: [],
          document: { file: { mime: mime === 'application/pdf' ? '@file/pdf' : mime, data: base64 } },
        }] }),
      }, signal);
      session.signURL = providerUrl(uploaded.signURL || session.signURL);
      session.uploaded = true; save(context, session);
    }
    status.textContent = 'Ожидаю подтверждения в eGov…';
    const response = await request(providerUrl(session.signURL), {}, signal);
    if (response.status === 'CANCELED') clearEgov(context);
    session.cms = cmsFromResponse(response);
    save(context, session);
    return { cms: session.cms, signer: extractSubjectFromCms(session.cms), tsp: false, metadata: session.metadata };
  } catch (e) {
    if (signal.aborted) throw new Error('Подписание прервано или время ожидания истекло. Вернитесь на страницу договора и нажмите eGov повторно.');
    throw e;
  } finally {
    clearTimeout(timer); controller.abort(); el?.close(); el?.remove(); active = false;
  }
}
