// Pllato CRM — умный импорт контактов из CSV / TSV / TXT.
//
// Поддерживает:
//   - CSV/TSV с заголовками (распознаёт ru/en имена колонок)
//   - Плоский текст: ищет телефоны regex'ом и имена эвристикой
//   - Дедуп по email и телефону против существующей базы

const PHONE_RE = /\+?\d[\d\s\-\(\)]{6,}\d/g;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Известные алиасы заголовков (для CSV)
const HEADER_ALIASES = {
  name:     ["name", "имя", "фио", "контакт", "клиент", "full name", "fullname", "client"],
  email:    ["email", "e-mail", "почта", "mail"],
  phone:    ["phone", "телефон", "номер", "tel", "mobile", "моб", "сотовый", "phone number"],
  company:  ["company", "компания", "организация", "фирма", "org"],
  position: ["position", "должность", "title", "job", "роль"],
  notes:    ["notes", "заметки", "комментарий", "комент", "комментарии", "note"],
  tags:     ["tags", "теги", "tag", "метки"],
};

function normHeader(h) {
  return String(h || "").toLowerCase().trim().replace(/^[\s"]+|[\s"]+$/g, "");
}

function detectField(header) {
  const h = normHeader(header);
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(h)) return field;
  }
  return null;
}

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/)[0] || "";
  const counts = { ",": (firstLine.match(/,/g) || []).length, ";": (firstLine.match(/;/g) || []).length, "\t": (firstLine.match(/\t/g) || []).length };
  let best = ","; let max = counts[","];
  for (const [d, c] of Object.entries(counts)) if (c > max) { best = d; max = c; }
  return best;
}

function parseCSVLine(line, delim) {
  // Простой парсер с поддержкой кавычек
  const out = [];
  let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === delim && !inQ) {
      out.push(cur); cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}

export function parseImport(text) {
  if (!text || typeof text !== "string") return [];
  text = text.replace(/﻿/g, "");  // BOM
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return [];

  // Попытка 1: CSV/TSV с заголовками
  const delim = detectDelimiter(lines[0]);
  const headerCells = parseCSVLine(lines[0], delim);
  const fieldMap = headerCells.map(detectField);
  const hasHeader = fieldMap.some(f => f);

  if (hasHeader && lines.length > 1) {
    const contacts = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCSVLine(lines[i], delim);
      const c = { name: "", email: "", phone: "", company: "", position: "", notes: "", tags: [] };
      cells.forEach((val, idx) => {
        const f = fieldMap[idx];
        if (!f) return;
        val = (val || "").trim();
        if (f === "tags") c.tags = val.split(/[,;]/).map(t => t.trim()).filter(Boolean);
        else c[f] = val;
      });
      // Дополнительно: если name пустой — попробуем найти любую непустую non-field колонку
      if (!c.name) {
        const firstNonField = cells.find((_, idx) => !fieldMap[idx] && cells[idx].trim());
        if (firstNonField) c.name = firstNonField.trim();
      }
      if (c.name || c.email || c.phone) contacts.push(c);
    }
    if (contacts.length > 0) return contacts;
  }

  // Попытка 2: плоский текст — извлекаем телефоны+email+имена эвристически
  const contacts = [];
  for (const line of lines) {
    const phones = line.match(PHONE_RE) || [];
    const emails = line.match(EMAIL_RE) || [];
    // Имя = то что осталось после удаления телефонов, email и спецсимволов
    let nameRaw = line;
    phones.forEach(p => nameRaw = nameRaw.replace(p, ""));
    emails.forEach(e => nameRaw = nameRaw.replace(e, ""));
    nameRaw = nameRaw.replace(/[,;:|\t]+/g, " ").replace(/\s+/g, " ").trim();

    if (phones.length === 0 && emails.length === 0 && !nameRaw) continue;
    contacts.push({
      name: nameRaw || (emails[0] ? emails[0].split("@")[0] : ""),
      phone: phones[0] || "",
      email: emails[0] || "",
      company: "",
      position: "",
      notes: "",
      tags: [],
    });
  }
  return contacts;
}

// Поиск дубликатов в существующей базе
export function findDuplicate(contact, existing) {
  const email = (contact.email || "").toLowerCase().trim();
  const phone = (contact.phone || "").replace(/\D+/g, "");
  return existing.find(c => {
    if (email && (c.email || "").toLowerCase().trim() === email) return true;
    if (phone && (c.phone || "").replace(/\D+/g, "") === phone) return true;
    return false;
  });
}
