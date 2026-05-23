// Pllato CRM — локальные сотрудники, защищённые от sync.
// Сохраняет backup в отдельной localStorage коллекции, при старте проверяет
// что они есть в Store.employees, если нет — восстанавливает.

import { Store } from "./store.js";

const BACKUP_KEY = "pllato_local_employees";
const EMPLOYEES_COLLECTION = "employees";

export function getLocalBackup() {
  try {
    return JSON.parse(localStorage.getItem(BACKUP_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveBackup(list) {
  localStorage.setItem(BACKUP_KEY, JSON.stringify(list));
}

export function saveLocalEmployee(emp) {
  if (!emp || !emp.id) return;
  const backup = getLocalBackup();
  const existing = backup.findIndex(b => b.id === emp.id);
  const entry = { ...emp, _localCreated: true, _backupAt: Date.now() };
  if (existing >= 0) backup[existing] = entry;
  else backup.push(entry);
  saveBackup(backup);
}

export function removeFromBackup(employeeId) {
  const backup = getLocalBackup().filter(b => b.id !== employeeId);
  saveBackup(backup);
}

/**
 * Проверяет что все локально созданные сотрудники присутствуют в Store.
 * Если sync их затёр — восстанавливает.
 */
export function restoreLocalEmployees() {
  const backup = getLocalBackup();
  if (backup.length === 0) return 0;

  const currentEmployees = Store.list(EMPLOYEES_COLLECTION);
  const currentIds = new Set(currentEmployees.map(e => e.id));
  const currentEmails = new Set(currentEmployees.map(e => String(e.email || "").toLowerCase()));

  let restored = 0;
  backup.forEach(emp => {
    // Проверка по id и email — на случай если sync создал того же сотрудника с другим id
    const emailMatch = emp.email && currentEmails.has(String(emp.email).toLowerCase());
    if (currentIds.has(emp.id) || emailMatch) return;

    // Восстанавливаем
    Store.create(EMPLOYEES_COLLECTION, {
      ...emp,
      _localCreated: true,
      _restoredAt: Date.now(),
    });
    restored++;
  });

  if (restored > 0) {
    console.log(`[local_employees] Восстановлено ${restored} локальных сотрудников после sync`);
  }
  return restored;
}

export function isLocalEmployee(employeeId) {
  return getLocalBackup().some(b => b.id === employeeId);
}
