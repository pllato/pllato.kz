// Pllato CRM — менеджер плавающих коммуникационных окон.
// Хранит только состояние окон; рендер и обработчики реализуются в view-модулях.

const dialogs = [];
let seq = 0;

function cloneDialog(dialog) {
  return {
    ...dialog,
    payload: { ...(dialog.payload || {}) },
  };
}

export function getCommDialogs() {
  return dialogs.map(cloneDialog);
}

export function resetCommDialogs() {
  dialogs.splice(0, dialogs.length);
}

export function openCommDialog({ type, contactId = null, dealId = null, payload = {} }) {
  const normalizedType = String(type || "note");
  const existing = dialogs.find((d) => d.type === normalizedType && d.contactId === contactId && d.dealId === dealId);
  if (existing) {
    existing.minimized = false;
    existing.payload = { ...existing.payload, ...payload };
    bumpCommDialog(existing.id);
    return cloneDialog(existing);
  }

  seq += 1;
  const dialog = {
    id: `comm_${Date.now().toString(36)}_${seq}`,
    type: normalizedType,
    contactId,
    dealId,
    payload: { ...payload },
    minimized: false,
    openedAt: Date.now(),
  };
  dialogs.push(dialog);
  return cloneDialog(dialog);
}

export function closeCommDialog(id) {
  const index = dialogs.findIndex((d) => d.id === id);
  if (index >= 0) dialogs.splice(index, 1);
}

export function minimizeCommDialog(id, minimized = true) {
  const dialog = dialogs.find((d) => d.id === id);
  if (!dialog) return;
  dialog.minimized = Boolean(minimized);
}

export function updateCommDialog(id, patch = {}) {
  const dialog = dialogs.find((d) => d.id === id);
  if (!dialog) return null;
  if (Object.prototype.hasOwnProperty.call(patch, "payload")) {
    dialog.payload = { ...(dialog.payload || {}), ...(patch.payload || {}) };
  }
  if (Object.prototype.hasOwnProperty.call(patch, "minimized")) {
    dialog.minimized = Boolean(patch.minimized);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "contactId")) {
    dialog.contactId = patch.contactId || null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "dealId")) {
    dialog.dealId = patch.dealId || null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "type")) {
    dialog.type = String(patch.type || dialog.type);
  }
  return cloneDialog(dialog);
}

export function bumpCommDialog(id) {
  const index = dialogs.findIndex((d) => d.id === id);
  if (index < 0) return;
  const [dialog] = dialogs.splice(index, 1);
  dialogs.push(dialog);
}
