// Pllato CRM — кастомные поля сделок.
// Конфиг полей хранится в localStorage; значения — в каждой сделке в .customFields.

const KEY = "pllato_deal_fields";

export const FIELD_TYPES = [
  { id: "text", label: "Текст", icon: "ti-text-size" },
  { id: "textarea", label: "Текст длинный", icon: "ti-align-left" },
  { id: "number", label: "Число", icon: "ti-123" },
  { id: "money", label: "Деньги", icon: "ti-currency-tenge" },
  { id: "date", label: "Дата", icon: "ti-calendar" },
  { id: "datetime", label: "Дата и время", icon: "ti-calendar-time" },
  { id: "select", label: "Выбор одного", icon: "ti-list" },
  { id: "multi", label: "Выбор нескольких", icon: "ti-checks" },
  { id: "boolean", label: "Да / Нет", icon: "ti-toggle-right" },
  { id: "phone", label: "Телефон", icon: "ti-phone" },
  { id: "email", label: "Email", icon: "ti-mail" },
  { id: "url", label: "Ссылка", icon: "ti-link" },
  { id: "employee", label: "Сотрудник", icon: "ti-user" },
];

export const DEAL_SYSTEM_FIELDS = [
  { id: "title", type: "text", label: "Название", required: true, systemField: true, order: 0, hidden: false },
  { id: "amount", type: "money", label: "Сумма", required: false, systemField: true, order: 1, hidden: false },
  { id: "contactId", type: "employee", label: "Контакт", required: false, systemField: true, order: 2, hidden: false },
  { id: "assigneeId", type: "employee", label: "Ответственный", required: false, systemField: true, order: 3, hidden: false },
  { id: "stage", type: "select", label: "Стадия", required: false, systemField: true, order: 4, hidden: false },
];

function normalizeOption(option, index = 0) {
  if (typeof option === "string") {
    return { id: `opt_${index + 1}`, label: option, color: "" };
  }
  const label = String(option?.label || option?.name || option?.value || "").trim();
  if (!label) return null;
  return {
    id: String(option?.id || `opt_${index + 1}`),
    label,
    color: String(option?.color || ""),
  };
}

function normalizeField(field, index = 0) {
  const type = FIELD_TYPES.some((x) => x.id === field?.type) ? field.type : "text";
  const options = ["select", "multi"].includes(type)
    ? (Array.isArray(field?.options) ? field.options : [])
        .map((opt, i) => normalizeOption(opt, i))
        .filter(Boolean)
    : [];
  return {
    id: String(field?.id || ""),
    type,
    label: String(field?.label || "Поле").trim() || "Поле",
    options,
    required: Boolean(field?.required),
    showInKanban: Boolean(field?.showInKanban),
    systemField: Boolean(field?.systemField),
    hidden: Boolean(field?.hidden),
    order: Number.isFinite(Number(field?.order)) ? Number(field.order) : index,
  };
}

export function getDealFields() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    if (Array.isArray(v)) {
      return v
        .map((f, i) => normalizeField(f, i))
        .filter((f) => f.id && !f.systemField)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
  } catch {}
  return [];
}
export function saveDealFields(fields) {
  const normalized = (Array.isArray(fields) ? fields : [])
    .map((f, i) => normalizeField(f, i))
    .filter((f) => f.id);
  localStorage.setItem(KEY, JSON.stringify(normalized));
}

export function getDealFieldType(typeId) {
  return FIELD_TYPES.find((t) => t.id === typeId) || FIELD_TYPES[0];
}

export function mergeDealFieldsWithSystem(customFields) {
  const custom = (Array.isArray(customFields) ? customFields : getDealFields())
    .map((f, i) => normalizeField(f, i))
    .filter((f) => f.id && !f.systemField);
  const merged = [
    ...DEAL_SYSTEM_FIELDS.map((f) => ({ ...f })),
    ...custom,
  ];
  return merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

let _seq = 0;
export function newFieldId() {
  _seq++;
  return "f_" + Date.now().toString(36) + "_" + _seq;
}

let _oseq = 0;
export function newOptionId() {
  _oseq++;
  return "opt_" + Date.now().toString(36) + "_" + _oseq;
}
