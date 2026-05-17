import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut as fbSignOut } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { getDatabase, ref, get, set, push, remove } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js';

import {
  isAdminUser,
  normalizeDocument,
  normalizeScope,
  normalizeShared,
  normalizeKind,
  normalizeMime,
  sanitizeFileName,
  detectEmbedProvider,
  isVisibleInPersonal,
  isVisibleInShared,
} from './registry.js';
import { renderDocumentsList } from './list.js';
import { renderDocumentPage } from './document.js';
import {
  openDocumentEditorDialog,
  openDocumentShareDialog,
} from './share_dialog.js';

const ROOT_SUPER_ADMIN = 'uurraa@gmail.com';
const DOCS_APP_ID = 'docs_portal';
const FETCH_TIMEOUT_MS = 12000;
const AUTH_TIMEOUT_MS = 12000;
const USERS_FETCH_TIMEOUT_MS = 4500;
const HARD_FALLBACK_MS = 14000;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 30000;
const USERS_CACHE_KEY = 'pllato_users_registry_cache';
const DOCS_CACHE_KEY = 'pllato_docs_cache_v1';
const DB_PROBE_TIMEOUT_MS = 3500;

const firebaseConfig = {
  apiKey: 'AIzaSyC3Cw3nX6b1zpE1-lqW1whwUsPPUQ7TIhc',
  authDomain: 'pllato-crm.firebaseapp.com',
  databaseURL: 'https://pllato-crm-default-rtdb.firebaseio.com',
  projectId: 'pllato-crm',
  storageBucket: 'pllato-crm.firebasestorage.app',
  messagingSenderId: '690738857241',
  appId: '1:690738857241:web:2356e97c435656890ab188',
};

const fb = initializeApp(firebaseConfig);
const auth = getAuth(fb);
const db = getDatabase(fb);
const storage = getStorage(fb);

const root = document.getElementById('docs-root');

const state = {
  mode: 'loading',
  me: null,
  usersById: {},
  docs: [],
  selectedId: null,
  activeTab: 'shared',
  query: '',
  showAllForAdmin: false,
  moduleStateByDoc: {},
  toastQueue: [],
  errorMessage: '',
  offlineMode: false,
  writesBlocked: false,
  backendNotice: '',
  backendDeactivated: false,
};

function now() {
  return Date.now();
}

function withTimeout(promise, label, timeoutMs = FETCH_TIMEOUT_MS) {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}: timeout`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function asId(value) {
  return String(value || '').trim();
}

function lower(value) {
  return String(value || '').trim().toLowerCase();
}

function isRootEmail(email) {
  return lower(email) === ROOT_SUPER_ADMIN;
}

function isDbDeactivatedText(raw) {
  const msg = lower(raw);
  return msg.includes('deactivated')
    || msg.includes('423')
    || msg.includes('locked')
    || msg.includes('database has been deactivated');
}

function isDbDeactivatedError(error) {
  return isDbDeactivatedText(error?.message || error || '')
    || isDbDeactivatedText(error?.code || '');
}

function readCachedUserAccess(email) {
  try {
    const raw = localStorage.getItem('pllato_user_cache');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || lower(parsed.email) !== lower(email)) return null;
    return {
      id: asId(parsed.crmUid || parsed.authUid || ''),
      email: lower(parsed.email || email),
      name: String(parsed.name || email).trim(),
      isAdmin: !!parsed.flags?.isAdmin,
      isSuperAdmin: !!parsed.flags?.isSuperAdmin,
      apps: parsed.apps || {},
    };
  } catch (error) {
    return null;
  }
}

function readCachedUsersRegistry() {
  try {
    const raw = localStorage.getItem(USERS_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const map = parsed?.usersById;
    if (!map || typeof map !== 'object') return {};
    return toUsersById(map);
  } catch (_) {
    return {};
  }
}

function writeCachedUsersRegistry(usersById) {
  try {
    if (!usersById || typeof usersById !== 'object') return;
    localStorage.setItem(USERS_CACHE_KEY, JSON.stringify({
      cachedAt: now(),
      usersById,
    }));
  } catch (_) {
    // ignore quota/cache errors
  }
}

function readCachedDocuments() {
  try {
    const raw = localStorage.getItem(DOCS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed?.docs) ? parsed.docs : [];
    return list
      .map((item) => normalizeDocument(item, item?.id))
      .filter((item) => !!item?.id)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (_) {
    return [];
  }
}

function writeCachedDocuments(docs) {
  try {
    if (!Array.isArray(docs)) return;
    localStorage.setItem(DOCS_CACHE_KEY, JSON.stringify({
      cachedAt: now(),
      docs,
    }));
  } catch (_) {
    // ignore quota/cache errors
  }
}

async function probeDatabaseHealth() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DB_PROBE_TIMEOUT_MS);
  try {
    const url = `${firebaseConfig.databaseURL}/.json?shallow=true`;
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (res.status === 423) {
      return { ok: false, deactivated: true, message: 'RTDB отключена (423 Locked).' };
    }
    if (!res.ok) {
      return { ok: false, deactivated: false, message: `RTDB недоступна (HTTP ${res.status}).` };
    }
    return { ok: true, deactivated: false, message: '' };
  } catch (error) {
    const aborted = String(error?.name || '') === 'AbortError';
    return {
      ok: false,
      deactivated: false,
      message: aborted ? 'RTDB отвечает слишком долго (timeout).' : `RTDB недоступна: ${error?.message || error}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

function findUserByEmail(usersById, email) {
  const target = lower(email);
  for (const [uid, u] of Object.entries(usersById || {})) {
    if (lower(u?.email) === target) return { id: uid, ...u };
  }
  return null;
}

function toUsersById(raw) {
  const out = {};
  for (const [uid, user] of Object.entries(raw || {})) {
    out[uid] = { ...(user || {}), id: uid };
  }
  return out;
}

function formatDate(ts) {
  const value = Number(ts);
  if (!Number.isFinite(value)) return '—';
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short' }).format(new Date(value));
}

function formatDateTime(ts) {
  const value = Number(ts);
  if (!Number.isFinite(value)) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function toast(message, kind = '') {
  if (!message) return;
  const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  state.toastQueue.push({ id, message, kind });
  renderToasts();
  setTimeout(() => {
    state.toastQueue = state.toastQueue.filter((item) => item.id !== id);
    renderToasts();
  }, 3600);
}

function renderToasts() {
  const wrap = document.getElementById('doc-toast-wrap');
  if (!wrap) return;
  wrap.innerHTML = state.toastQueue.map((item) => (
    `<div class="doc-toast ${item.kind}">${escapeHtml(item.message)}</div>`
  )).join('');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch]);
}

function normalizeDocKind(value, raw = {}) {
  const kind = normalizeKind(value, raw);
  if (['builtin', 'markdown', 'file', 'embed'].includes(kind)) return kind;
  return 'markdown';
}

function normalizeEmbedUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (!raw.startsWith('https://')) return '';
  return raw.slice(0, 2000);
}

async function uploadFileForDocument(docId, fileBlob, previousPath = '') {
  if (state.writesBlocked) {
    throw new Error('Сейчас режим только чтения: Firebase база недоступна, загрузка файлов временно отключена.');
  }
  if (!(fileBlob instanceof File)) return null;
  if (fileBlob.size > MAX_FILE_BYTES) {
    throw new Error('Файл больше 50 МБ. Загрузка отклонена.');
  }

  const fileName = sanitizeFileName(fileBlob.name || 'untitled');
  const mimeType = normalizeMime(fileBlob.type || 'application/octet-stream');
  const storagePath = `documents/${docId}/original/${Date.now()}_${fileName}`;
  const fileRef = storageRef(storage, storagePath);
  const uploadTask = uploadBytesResumable(fileRef, fileBlob, { contentType: mimeType });

  await new Promise((resolve, reject) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      try { uploadTask.cancel(); } catch (_) {}
      reject(new Error('Таймаут загрузки файла. Проверь интернет и повтори.'));
    }, UPLOAD_TIMEOUT_MS);
    uploadTask.on('state_changed', null, (err) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      const code = String(err?.code || '');
      if (code.includes('unauthorized')) {
        reject(new Error('Нет прав на загрузку в хранилище. Проверь Firebase Storage rules.'));
        return;
      }
      if (code.includes('bucket-not-found')) {
        reject(new Error('Firebase Storage bucket не найден для этого проекта.'));
        return;
      }
      if (code.includes('unknown')) {
        const msg = String(err?.message || '').toLowerCase();
        if (msg.includes('cors') || msg.includes('preflight') || msg.includes('xmlhttprequest')) {
          reject(new Error('Storage отклонил CORS/preflight. Файл не загружен. Проверь bucket/CORS в Firebase Storage.'));
          return;
        }
        if (msg.includes('not found') || msg.includes('404')) {
          reject(new Error('Storage bucket/объект недоступен (404). Проверь имя bucket и состояние Firebase Storage.'));
          return;
        }
      }
      if (code.includes('canceled')) {
        reject(new Error('Загрузка отменена.'));
        return;
      }
      reject(new Error(err?.message || 'Ошибка загрузки файла.'));
    }, () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve();
    });
  });

  const downloadURL = await getDownloadURL(fileRef);

  if (previousPath && previousPath !== storagePath) {
    try {
      await deleteObject(storageRef(storage, previousPath));
    } catch (_) {
      // silent best-effort cleanup
    }
  }

  return {
    storagePath,
    fileName,
    mimeType,
    sizeBytes: Number(fileBlob.size) || 0,
    uploadedAt: now(),
    uploadedBy: state.me?.id || '',
    downloadURL,
  };
}

function setRoute(id, replace = false) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set('id', id);
  else url.searchParams.delete('id');
  const next = `${url.pathname}${url.search}`;
  if (replace) history.replaceState({}, '', next);
  else history.pushState({}, '', next);
  state.selectedId = id || null;
}

function routeIdFromUrl() {
  const url = new URL(window.location.href);
  return asId(url.searchParams.get('id')) || null;
}

function canOpenDocument(doc, me) {
  if (!doc || !me) return false;
  if (isAdminUser(me)) return true;
  return isVisibleInPersonal(doc, me) || isVisibleInShared(doc, me, state.showAllForAdmin);
}

function currentUserLabel(me) {
  return me?.email || '—';
}

function renderFrame(innerHtml) {
  const backendBanner = state.backendNotice
    ? `<div class="doc-system-note ${state.writesBlocked ? 'is-warn' : ''}">${escapeHtml(state.backendNotice)}</div>`
    : '';
  root.innerHTML = `
    <div class="doc-shell">
      <div class="doc-wrap">
        <header class="doc-topbar">
          <div class="doc-topbar-left">
            <a class="doc-btn" href="app.html">← Назад в App</a>
            <div class="doc-user-mail">${escapeHtml(currentUserLabel(state.me))}</div>
          </div>
          <button class="doc-btn" data-action="logout">Выйти</button>
        </header>
        ${backendBanner}
        ${innerHtml}
        <div class="doc-toast-wrap" id="doc-toast-wrap"></div>
      </div>
    </div>
  `;

  root.querySelector('[data-action="logout"]')?.addEventListener('click', async () => {
    try {
      await fbSignOut(auth);
    } catch (error) {
      // ignore
    }
    window.location.href = 'login.html';
  });

  renderToasts();
}

function renderLoading() {
  root.innerHTML = `
    <div class="doc-shell">
      <div class="doc-wrap">
        <div class="doc-loading">Загружаем документы...</div>
      </div>
    </div>
  `;
}

function buildOfflineSeedDoc() {
  const id = 'builtin_partner_motivation';
  return normalizeDocument({
    id,
    kind: 'builtin',
    type: 'motivation',
    slug: 'partner-motivation',
    title: 'Система мотивации партнёра',
    description: 'Формула, KPI, правила выплат и калькулятор для партнёров.',
    builtin: true,
    contentModuleId: 'partner_motivation',
    authorId: 'system',
    scope: 'team',
    sharedWith: [],
    createdAt: now(),
    updatedAt: now(),
  }, id);
}

function enterOfflineMode(user, reasonText = '') {
  if (state.mode !== 'loading' && state.mode !== 'error') return;
  const email = lower(user?.email || '');
  const cached = readCachedUserAccess(email);
  const cachedUsers = readCachedUsersRegistry();
  const cachedDocs = readCachedDocuments();
  state.me = cached || {
    id: asId(user?.uid || 'offline'),
    email: email || 'offline@pllato.kz',
    name: String(user?.displayName || 'Сотрудник').trim(),
    isAdmin: false,
    isSuperAdmin: false,
    apps: { [DOCS_APP_ID]: true },
  };
  state.usersById = Object.keys(cachedUsers).length ? cachedUsers : (state.usersById || {});
  state.docs = state.docs?.length ? state.docs : (cachedDocs.length ? cachedDocs : [buildOfflineSeedDoc()]);
  state.offlineMode = true;
  state.writesBlocked = true;
  state.backendNotice = reasonText || 'Firebase временно недоступна. Открыт режим только чтения.';
  state.mode = 'ready';
  state.selectedId = routeIdFromUrl();
  refresh();
  toast(reasonText || 'Firebase временно недоступна. Открыт автономный режим документа.', 'err');
}

function renderForbidden() {
  renderFrame(`
    <section class="doc-forbidden">
      <h2>Нет доступа к разделу «Документы»</h2>
      <p>Попроси администратора открыть тебе право «Документы» в App.</p>
      <p style="margin-top:8px">Путь: App → Пользователи → у нужного сотрудника включить «Документы».</p>
    </section>
  `);
}

function getDocById(id) {
  return state.docs.find((doc) => doc.id === id) || null;
}

function assertWriteAvailable() {
  if (!state.writesBlocked) return;
  throw new Error('Сейчас режим только чтения: Firebase временно недоступна для изменений.');
}

function refresh() {
  if (state.mode === 'loading') {
    renderLoading();
    return;
  }

  if (state.mode === 'forbidden') {
    renderForbidden();
    return;
  }

  if (state.mode === 'error') {
    renderFrame(`
      <section class="doc-forbidden">
        <h2>Не удалось загрузить документы</h2>
        <p>${escapeHtml(state.errorMessage || 'Проверь Firebase-сессию и доступ к базе.')}</p>
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="doc-btn" data-action="reload">Обновить страницу</button>
          <a class="doc-btn" href="login.html">Войти заново</a>
        </div>
      </section>
    `);
    root.querySelector('[data-action="reload"]')?.addEventListener('click', () => window.location.reload());
    return;
  }

  renderFrame('<main id="doc-main"></main>');
  const mount = document.getElementById('doc-main');
  if (!mount) return;

  if (state.selectedId) {
    const doc = getDocById(state.selectedId);
    if (!doc || !canOpenDocument(doc, state.me)) {
      setRoute(null, true);
      toast('Документ недоступен для текущего пользователя.', 'err');
      refresh();
      return;
    }

    const moduleState = state.moduleStateByDoc[doc.id] || (state.moduleStateByDoc[doc.id] = {});
    renderDocumentPage(mount, {
      doc,
      me: state.me,
      usersById: state.usersById,
      formatDateTime,
      moduleState,
      readOnly: state.writesBlocked,
      onBack: () => {
        setRoute(null);
        refresh();
      },
      onShare: (id) => openShare(id),
      onEdit: (id) => openEditor(id),
      onDelete: (id) => deleteDoc(id),
    });
    return;
  }

  renderDocumentsList(mount, {
    me: state.me,
    docs: state.docs,
    usersById: state.usersById,
    activeTab: state.activeTab,
    query: state.query,
    showAllForAdmin: state.showAllForAdmin,
    canCreate: !state.writesBlocked,
    readOnly: state.writesBlocked,
    formatDate,
    onTabChange: (tab) => {
      state.activeTab = tab === 'personal' ? 'personal' : 'shared';
      refresh();
    },
    onSearch: (query) => {
      state.query = query;
      refresh();
    },
    onToggleShowAll: (next) => {
      state.showAllForAdmin = !!next;
      refresh();
    },
    onCreate: () => openEditor(null),
    onOpen: (id) => {
      setRoute(id);
      refresh();
    },
    onShare: (id) => openShare(id),
    onEdit: (id) => openEditor(id),
    onDelete: (id) => deleteDoc(id),
  });
}

async function saveDoc(doc) {
  assertWriteAvailable();
  const clean = normalizeDocument(doc, doc.id);
  await set(ref(db, `documents/${clean.id}`), clean);
  const idx = state.docs.findIndex((item) => item.id === clean.id);
  if (idx >= 0) state.docs[idx] = clean;
  else state.docs.unshift(clean);
  state.docs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  writeCachedDocuments(state.docs);
}

async function createDoc(payload) {
  const id = push(ref(db, 'documents')).key;
  if (!id) throw new Error('Не удалось создать ID документа');

  const timestamp = now();
  const isAdmin = isAdminUser(state.me);
  const scope = isAdmin ? normalizeScope(payload.scope) : 'personal';
  const kind = normalizeDocKind(payload.kind, payload);
  const embedUrl = normalizeEmbedUrl(payload.embed?.url);
  if (kind === 'embed' && !embedUrl) {
    throw new Error('Для ссылки укажи корректный URL, начиная с https://');
  }
  const embed = kind === 'embed' && embedUrl
    ? { url: embedUrl, provider: detectEmbedProvider(embedUrl) }
    : null;

  let file = null;
  if (kind === 'file') {
    file = await uploadFileForDocument(id, payload.fileBlob);
    if (!file) throw new Error('Выбери файл для загрузки.');
  }

  const doc = normalizeDocument({
    id,
    kind,
    type: payload.type || 'other',
    title: payload.title,
    description: payload.description || '',
    builtin: kind === 'builtin',
    body: kind === 'markdown' ? (payload.body || '') : '',
    file,
    embed,
    authorId: state.me.id,
    scope,
    sharedWith: scope === 'team' ? [] : normalizeShared(payload.sharedWith || []),
    createdAt: timestamp,
    updatedAt: timestamp,
  }, id);

  await saveDoc(doc);
  toast('Документ создан', 'ok');
  return doc;
}

async function editDoc(doc, payload) {
  const timestamp = now();
  const isAdmin = isAdminUser(state.me);

  const nextScope = isAdmin ? normalizeScope(payload.scope || doc.scope) : normalizeScope(doc.scope);
  const nextKind = doc.builtin === true
    ? 'builtin'
    : normalizeDocKind(payload.kind || doc.kind, { ...doc, ...payload });
  const embedUrl = normalizeEmbedUrl(payload.embed?.url || doc.embed?.url || '');
  if (nextKind === 'embed' && !embedUrl) {
    throw new Error('Для ссылки укажи корректный URL, начиная с https://');
  }
  const nextEmbed = nextKind === 'embed' && embedUrl
    ? { url: embedUrl, provider: detectEmbedProvider(embedUrl) }
    : null;

  let nextFile = doc.file || null;
  if (nextKind === 'file') {
    if (payload.fileBlob instanceof File) {
      nextFile = await uploadFileForDocument(doc.id, payload.fileBlob, doc.file?.storagePath || '');
    } else if (!nextFile) {
      throw new Error('Для формата «файл» нужно выбрать файл.');
    }
  }

  if (nextKind !== 'file' && doc.file?.storagePath) {
    try {
      await deleteObject(storageRef(storage, doc.file.storagePath));
    } catch (_) {
      // keep going: document edit should not fail because cleanup failed
    }
    nextFile = null;
  }

  const next = normalizeDocument({
    ...doc,
    kind: nextKind,
    title: payload.title,
    description: payload.description || '',
    type: payload.type || doc.type,
    body: nextKind === 'markdown' ? (payload.body || '') : '',
    file: nextKind === 'file' ? nextFile : null,
    embed: nextKind === 'embed' ? nextEmbed : null,
    scope: nextScope,
    sharedWith: nextScope === 'team' ? [] : normalizeShared(payload.sharedWith ?? doc.sharedWith ?? []),
    updatedAt: timestamp,
  }, doc.id);

  await saveDoc(next);
  toast('Документ обновлён', 'ok');
  return next;
}

async function openEditor(id) {
  if (state.writesBlocked) {
    toast('Изменения временно отключены: Firebase база недоступна.', 'err');
    return;
  }
  await warmUsersForDialog();

  if (id) {
    const doc = getDocById(id);
    if (!doc) return;

    openDocumentEditorDialog({
      mode: 'edit',
      initial: doc,
      isAdmin: isAdminUser(state.me),
      users: state.usersById,
      currentUser: state.me,
      onSave: async (payload) => {
        try {
          await editDoc(doc, payload);
          refresh();
        } catch (error) {
          toast(error?.message || 'Не удалось обновить документ.', 'err');
          throw error;
        }
      },
    });
    return;
  }

  openDocumentEditorDialog({
    mode: 'create',
    initial: { type: 'other', scope: 'personal', kind: 'markdown' },
    isAdmin: isAdminUser(state.me),
    users: state.usersById,
    currentUser: state.me,
    onSave: async (payload) => {
      try {
        const created = await createDoc(payload);
        setRoute(created.id);
        refresh();
      } catch (error) {
        toast(error?.message || 'Не удалось создать документ.', 'err');
        throw error;
      }
    },
  });
}

async function openShare(id) {
  if (state.writesBlocked) {
    toast('Изменения временно отключены: Firebase база недоступна.', 'err');
    return;
  }
  const doc = getDocById(id);
  if (!doc) return;
  await warmUsersForDialog();

  openDocumentShareDialog({
    doc,
    users: state.usersById,
    currentUser: state.me,
    isAdmin: isAdminUser(state.me),
    onSave: async ({ scope, sharedWith }) => {
      const nextScope = isAdminUser(state.me) ? normalizeScope(scope) : 'personal';
      const next = normalizeDocument({
        ...doc,
        scope: nextScope,
        sharedWith: nextScope === 'team' ? [] : normalizeShared(sharedWith),
        updatedAt: now(),
      }, doc.id);
      await saveDoc(next);

      if (doc.scope === 'team' && next.scope === 'personal') {
        toast('Документ больше не виден всей команде. Доступ только у вас и выбранных сотрудников.', 'ok');
      } else {
        toast('Доступ обновлён', 'ok');
      }
      refresh();
    },
  });
}

async function deleteDoc(id) {
  if (state.writesBlocked) {
    toast('Удаление временно отключено: Firebase база недоступна.', 'err');
    return;
  }
  const doc = getDocById(id);
  if (!doc) return;

  const ok = window.confirm(`Удалить документ «${doc.title || 'Без названия'}»?`);
  if (!ok) return;

  if (doc.file?.storagePath) {
    try {
      await deleteObject(storageRef(storage, doc.file.storagePath));
    } catch (_) {
      // delete from RTDB anyway
    }
  }

  await remove(ref(db, `documents/${doc.id}`));
  state.docs = state.docs.filter((item) => item.id !== doc.id);
  delete state.moduleStateByDoc[doc.id];
  if (state.selectedId === doc.id) setRoute(null, true);
  writeCachedDocuments(state.docs);
  toast('Документ удалён', 'ok');
  refresh();
}

async function migrateAndLoadDocuments(authorFallbackId) {
  const snap = await withTimeout(get(ref(db, 'documents')), 'documents read');
  const raw = snap.exists() ? snap.val() : {};
  const docs = [];
  const writes = [];

  for (const [id, value] of Object.entries(raw)) {
    const normalized = normalizeDocument({ ...(value || {}), authorId: value?.authorId || authorFallbackId }, id);
    docs.push(normalized);

    const needsMigration = !value?.scope
      || !Array.isArray(value?.sharedWith)
      || !value?.authorId
      || !value?.kind
      || !!value?.visibility
      || String(value?.id || '') !== normalized.id;

    if (needsMigration) {
      writes.push(set(ref(db, `documents/${id}`), normalized));
    }
  }

  if (!docs.some((doc) => doc.slug === 'partner-motivation')) {
    const id = push(ref(db, 'documents')).key;
    if (!id) throw new Error('Не удалось создать seed-документ');
    const seed = normalizeDocument({
      id,
      kind: 'builtin',
      type: 'motivation',
      slug: 'partner-motivation',
      title: 'Система мотивации партнёра',
      description: 'Формула, KPI, правила выплат и калькулятор для партнёров.',
      builtin: true,
      contentModuleId: 'partner_motivation',
      authorId: authorFallbackId,
      scope: 'team',
      sharedWith: [],
      createdAt: now(),
      updatedAt: now(),
    }, id);
    docs.unshift(seed);
    writes.push(set(ref(db, `documents/${id}`), seed));
  }

  if (writes.length) await withTimeout(Promise.all(writes), 'documents write');
  docs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return docs;
}

async function tryLoadUsersRegistry() {
  const cached = readCachedUsersRegistry();
  if (state.backendDeactivated) return cached;
  try {
    const usersSnap = await withTimeout(get(ref(db, 'users')), 'users read', USERS_FETCH_TIMEOUT_MS);
    const users = toUsersById(usersSnap.exists() ? usersSnap.val() : {});
    if (Object.keys(users).length) writeCachedUsersRegistry(users);
    return users;
  } catch (error) {
    if (isDbDeactivatedError(error)) {
      state.backendDeactivated = true;
      return cached;
    }
    console.warn('documents: users read timeout, retry with short timeout', error);
    try {
      const retrySnap = await withTimeout(get(ref(db, 'users')), 'users read retry', 3200);
      const users = toUsersById(retrySnap.exists() ? retrySnap.val() : {});
      if (Object.keys(users).length) writeCachedUsersRegistry(users);
      return users;
    } catch (retryError) {
      if (isDbDeactivatedError(retryError)) {
        state.backendDeactivated = true;
      }
      console.warn('documents: users registry unavailable, continue without it', retryError);
      return Object.keys(cached).length ? cached : {};
    }
  }
}

async function ensureUsersRegistryLoaded() {
  if (Object.keys(state.usersById || {}).length) return;
  const loaded = await tryLoadUsersRegistry();
  if (!Object.keys(loaded).length) return;
  state.usersById = loaded;
  const refreshed = findUserByEmail(loaded, state.me?.email || '');
  if (refreshed) state.me = { ...state.me, ...refreshed };
}

async function warmUsersForDialog(timeoutMs = 1800) {
  await Promise.race([
    ensureUsersRegistryLoaded(),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

async function bootstrapSession(user) {
  const email = lower(user?.email || '');
  if (!email) {
    state.mode = 'forbidden';
    refresh();
    return;
  }

  const dbHealth = await probeDatabaseHealth();
  state.backendDeactivated = !!dbHealth.deactivated;

  // docs не должен блокироваться из-за /users; используем кэш мгновенно и догружаем в фоне.
  const cachedUsers = readCachedUsersRegistry();
  const usersById = state.backendDeactivated
    ? cachedUsers
    : (Object.keys(cachedUsers).length ? cachedUsers : await tryLoadUsersRegistry());
  if (Object.keys(usersById).length) writeCachedUsersRegistry(usersById);
  const matched = findUserByEmail(usersById, email);
  const cached = readCachedUserAccess(email);
  const rootAccess = isRootEmail(email);

  const me = matched || cached || {
    id: rootAccess ? `root:${email}` : user.uid,
    email,
    name: user.displayName || email,
    isAdmin: rootAccess,
    isSuperAdmin: rootAccess,
    apps: { [DOCS_APP_ID]: rootAccess },
  };

  // v2: доступ к разделу документов у любого авторизованного сотрудника.
  const allowed = true;
  if (!allowed) {
    state.me = me;
    state.mode = 'forbidden';
    refresh();
    return;
  }

  state.me = me;
  state.usersById = usersById;
  const superAdmin = Object.values(usersById).find((item) => isRootEmail(item?.email) || item?.isSuperAdmin);
  const authorFallbackId = asId(superAdmin?.id || matched?.id || me.id || user.uid || 'system');
  let docs = [];
  let readOnlyReason = '';
  if (state.backendDeactivated) {
    docs = readCachedDocuments();
    readOnlyReason = 'Firebase RTDB проекта отключена (423). Раздел открыт в режиме только чтения.';
  } else {
    try {
      docs = await migrateAndLoadDocuments(authorFallbackId);
      writeCachedDocuments(docs);
    } catch (error) {
      const isTimeout = String(error?.message || '').toLowerCase().includes('timeout');
      if (!isDbDeactivatedError(error) && !isTimeout) throw error;
      state.backendDeactivated = state.backendDeactivated || isDbDeactivatedError(error);
      docs = readCachedDocuments();
      readOnlyReason = state.backendDeactivated
        ? 'Firebase RTDB проекта отключена (423). Раздел открыт в режиме только чтения.'
        : 'Firebase отвечает слишком долго. Открыта кэш-версия документов в режиме только чтения.';
    }
  }

  if (!docs.length) docs = [buildOfflineSeedDoc()];
  state.docs = docs;
  state.offlineMode = !!readOnlyReason;
  state.writesBlocked = !!readOnlyReason;
  state.backendNotice = readOnlyReason;
  state.selectedId = routeIdFromUrl();
  state.mode = 'ready';
  refresh();

  // Фоновая гидрация users (если в первый проход был пустой/таймаут).
  if (!state.backendDeactivated) {
    void (async () => {
      const hydrated = await tryLoadUsersRegistry();
      if (!Object.keys(hydrated).length) return;
      state.usersById = hydrated;
      writeCachedUsersRegistry(hydrated);
      const refreshed = findUserByEmail(hydrated, email);
      if (refreshed) state.me = { ...state.me, ...refreshed };
      refresh();
    })();
  }
}

window.addEventListener('popstate', () => {
  state.selectedId = routeIdFromUrl();
  refresh();
});

renderLoading();

const authWatchdog = setTimeout(() => {
  if (state.mode !== 'loading') return;
  enterOfflineMode(auth.currentUser, 'Firebase Auth долго не отвечает. Открыт автономный режим.');
}, AUTH_TIMEOUT_MS);

const hardFallbackWatchdog = setTimeout(() => {
  if (state.mode !== 'loading') return;
  enterOfflineMode(auth.currentUser, 'Сеть отвечает медленно. Открыт автономный режим документов.');
}, HARD_FALLBACK_MS);

onAuthStateChanged(auth, async (user) => {
  clearTimeout(authWatchdog);
  if (!user) {
    clearTimeout(hardFallbackWatchdog);
    window.location.href = 'login.html';
    return;
  }
  state.mode = 'loading';
  state.writesBlocked = false;
  state.backendNotice = '';
  state.backendDeactivated = false;
  refresh();

  const eventFallbackWatchdog = setTimeout(() => {
    if (state.mode !== 'loading') return;
    enterOfflineMode(user, 'Сеть отвечает медленно. Открыт автономный режим документов.');
  }, HARD_FALLBACK_MS);

  try {
    await withTimeout(bootstrapSession(user), 'bootstrap session');
    clearTimeout(eventFallbackWatchdog);
    clearTimeout(hardFallbackWatchdog);
  } catch (error) {
    clearTimeout(eventFallbackWatchdog);
    clearTimeout(hardFallbackWatchdog);
    console.error(error);
    enterOfflineMode(user, `Ошибка Firebase: ${error?.message || error}. Открыт автономный режим.`);
  }
});
