// Pllato CRM — кастомные поля сделок.
// Конфиг полей хранится в localStorage; значения — в каждой сделке в .customFields.

const KEY = "pllato_deal_fields";

export const FIELD_TYPES = [
  { id: "text",   label: "Текст" },
  { id: "number", label: "Число" },
  { id: "date",   label: "Дата" },
  { id: "select", label: "Выпадающий список" },
];

export function getDealFields() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    if (Array.isArray(v)) return v;
  } catch {}
  return [];
}
export function saveDealFields(fields) {
  localStorage.setItem(KEY, JSON.stringify(fields));
}

let _seq = 0;
export function newFieldId() {
  _seq++;
  return "f_" + Date.now().toString(36) + "_" + _seq;
}
