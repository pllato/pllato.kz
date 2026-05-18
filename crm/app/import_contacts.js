// Pllato CRM — умный импорт контактов из CSV / TSV / TXT.
//
// parseImport всегда возвращает структуру для мастера:
// { headers: string[], rows: string[][], autoMap: Record<index, fieldId> }
// где fieldId — базовые поля контакта/сделки для автосопоставления.

const PHONE_RE = /\+?\d[\d\s\-\(\)]{6,}\d/g;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Известные алиасы заголовков (для CSV)
const HEADER_ALIASES = {
  name: ["name", "имя", "фио", "контакт", "клиент", "full name", "fullname", "client"],
  email: ["email", "e-mail", "почта", "mail"],
  phone: ["phone", "телефон", "номер", "tel", "mobile", "моб", "сотовый", "phone number"],
  company: ["company", "компания", "организация", "фирма", "org"],
  position: ["position", "должность", "title", "job", "роль"],
  source: ["source", "источник", "канал", "lead source"],
  note: ["notes", "note", "заметки", "комментарий", "комент", "комментарии"],
  tags: ["tags", "теги", "tag", "метки"],
  deal_title: ["deal", "deal name", "deal title", "название сделки", "сделка"],
  deal_amount: ["amount", "sum", "сумма", "бюджет", "budget"],
};

function normHeader(h) {
  return String(h || "").toLowerCase().trim().replace(/^[\s"]+|[\s"]+$/g, "");
}

export function detectField(header) {
  const h = normHeader(header);
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(h)) return field;
  }
  return null;
}

function detectDelimiter(text) {
  const firstLine = String(text || "").split(/\r?\n/)[0] || "";
  const counts = {
    ",": (firstLine.match(/,/g) || []).length,
    ";": (firstLine.match(/;/g) || []).length,
    "\t": (firstLine.match(/\t/g) || []).length,
  };
  let best = ",";
  let max = counts[","];
  for (const [d, c] of Object.entries(counts)) {
    if (c > max) {
      best = d;
      max = c;
    }
  }
  return best;
}

function parseCSVLine(line, delim) {
  // Простой парсер с поддержкой кавычек
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQ = !inQ;
      }
    } else if (ch === delim && !inQ) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => String(s || "").trim());
}

function parseFreeText(lines) {
  const contacts = [];
  for (const line of lines) {
    const phones = line.match(PHONE_RE) || [];
    const emails = line.match(EMAIL_RE) || [];
    let nameRaw = line;
    phones.forEach((p) => {
      nameRaw = nameRaw.replace(p, "");
    });
    emails.forEach((e) => {
      nameRaw = nameRaw.replace(e, "");
    });
    nameRaw = nameRaw.replace(/[,;:|\t]+/g, " ").replace(/\s+/g, " ").trim();

    if (phones.length === 0 && emails.length === 0 && !nameRaw) continue;
    contacts.push({
      name: nameRaw || (emails[0] ? emails[0].split("@")[0] : ""),
      phone: phones[0] || "",
      email: emails[0] || "",
      company: "",
      position: "",
      note: "",
    });
  }
  return contacts;
}

function normalizeRows(rows, width) {
  return rows.map((row) => {
    const cells = Array.isArray(row) ? row.slice(0, width) : [];
    while (cells.length < width) cells.push("");
    return cells.map((v) => String(v || "").trim());
  });
}

export function parseImport(text) {
  const empty = { headers: [], rows: [], autoMap: {} };
  if (!text || typeof text !== "string") return empty;

  const src = text.replace(/﻿/g, ""); // BOM
  const lines = src.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return empty;

  const delim = detectDelimiter(src);
  const parsedLines = lines.map((line) => parseCSVLine(line, delim));
  const hasMultiColumn = parsedLines.some((row) => row.length > 1);

  if (!hasMultiColumn) {
    // Плоский текст: превращаем в синтетическую таблицу, чтобы wizard оставался единым.
    const contacts = parseFreeText(lines);
    const headers = ["Имя", "Телефон", "Email", "Компания", "Должность", "Заметка"];
    const rows = contacts.map((c) => [c.name, c.phone, c.email, c.company, c.position, c.note]);
    return {
      headers,
      rows,
      autoMap: { 0: "name", 1: "phone", 2: "email", 3: "company", 4: "position", 5: "note" },
    };
  }

  const firstRow = parsedLines[0] || [];
  const detected = firstRow.map(detectField);
  const hasHeader = detected.some(Boolean);

  let headers = [];
  let rows = [];

  if (hasHeader) {
    headers = firstRow.map((h, i) => String(h || "").trim() || `Колонка ${i + 1}`);
    rows = parsedLines.slice(1);
  } else {
    const width = Math.max(...parsedLines.map((r) => r.length), 1);
    headers = Array.from({ length: width }, (_, i) => `Колонка ${i + 1}`);
    rows = parsedLines;
  }

  rows = normalizeRows(rows, headers.length).filter((row) => row.some((cell) => String(cell || "").trim()));

  const autoMap = {};
  headers.forEach((h, i) => {
    const f = detectField(h);
    if (f) autoMap[i] = f;
  });

  return { headers, rows, autoMap };
}

// Поиск дубликатов в существующей базе
export function findDuplicate(contact, existing) {
  const email = (contact.email || "").toLowerCase().trim();
  const phone = (contact.phone || "").replace(/\D+/g, "");
  return existing.find((c) => {
    if (email && (c.email || "").toLowerCase().trim() === email) return true;
    if (phone && (c.phone || "").replace(/\D+/g, "") === phone) return true;
    return false;
  });
}
