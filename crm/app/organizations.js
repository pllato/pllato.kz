// Pllato CRM — справочник организаций (юр.лиц компании).
// Используется в печатных формах накладных, актов, СФ.
// Хранится в обычной Store-коллекции (cloud-sync).

import { Store } from "./store.js";

const COLLECTION = "organizations";

/** Тип юр.лица: ТОО / ИП / ИЧП / ... */
export const ORG_TYPES = [
  { id: "TOO", label: "ТОО (Товарищество с ограниченной ответственностью)" },
  { id: "IP", label: "ИП (Индивидуальный предприниматель)" },
  { id: "AO", label: "АО (Акционерное общество)" },
  { id: "TDO", label: "ТДО (Товарищество с доп. ответственностью)" },
  { id: "other", label: "Другое" },
];

const SEED_FLAG = "pllato_organizations_seeded_v1";

function ensureSeed() {
  if (localStorage.getItem(SEED_FLAG) === "1") return;
  const existing = Store.list(COLLECTION);
  if (existing.length === 0) {
    // Дефолтная запись из примера накладной (можно отредактировать).
    Store.create(COLLECTION, {
      type: "TOO",
      shortName: 'ТОО "Аминамед"',
      fullName: 'Товарищество с ограниченной ответственностью "Аминамед"',
      bin: "060540006532",
      address: "",
      phone: "",
      iik: "",
      bik: "",
      bank: "",
      directorPosition: "Финансовый директор",
      directorName: "Баймуханова К.А.",
      accountantName: "НЕ П.",
      molName: "Селенков И.В.",
      molPosition: "Отпустил",
      stampUrl: "",
      signatureUrl: "",
      isDefault: true,
    });
  }
  localStorage.setItem(SEED_FLAG, "1");
}

export function listOrganizations() {
  ensureSeed();
  return Store.list(COLLECTION).filter((o) => !o.isDeleted);
}

export function getOrganization(id) {
  ensureSeed();
  return id ? Store.get(COLLECTION, id) : null;
}

export function getDefaultOrganization() {
  ensureSeed();
  const all = Store.list(COLLECTION).filter((o) => !o.isDeleted);
  return all.find((o) => o.isDefault) || all[0] || null;
}

/**
 * Найти организацию по короткому названию (для подстановки из p.entity = "ТОО"/"ИП").
 * Берёт первое совпадение по type или по shortName.
 */
export function findOrganizationByEntity(entityLabel) {
  if (!entityLabel) return getDefaultOrganization();
  const label = String(entityLabel).trim().toUpperCase();
  const all = listOrganizations();
  // Сначала по типу (TOO/IP)
  const byType = all.find((o) => String(o.type || "").toUpperCase() === label);
  if (byType) return byType;
  // Затем по shortName (содержит "ТОО" / "ИП")
  const byShort = all.find((o) => String(o.shortName || "").toUpperCase().includes(label));
  if (byShort) return byShort;
  return getDefaultOrganization();
}

export function saveOrganization(payload = {}) {
  const data = {
    type: String(payload.type || "TOO").trim(),
    shortName: String(payload.shortName || "").trim(),
    fullName: String(payload.fullName || "").trim(),
    bin: String(payload.bin || "").replace(/[^\d]/g, ""),
    address: String(payload.address || "").trim(),
    phone: String(payload.phone || "").trim(),
    iik: String(payload.iik || "").trim().replace(/\s+/g, ""),
    bik: String(payload.bik || "").trim().replace(/\s+/g, ""),
    bank: String(payload.bank || "").trim(),
    directorPosition: String(payload.directorPosition || "").trim(),
    directorName: String(payload.directorName || "").trim(),
    accountantName: String(payload.accountantName || "").trim(),
    molName: String(payload.molName || "").trim(),
    molPosition: String(payload.molPosition || "Отпустил").trim(),
    stampUrl: String(payload.stampUrl || "").trim(),
    signatureUrl: String(payload.signatureUrl || "").trim(),
    isDefault: Boolean(payload.isDefault),
  };
  if (!data.shortName) throw new Error("Укажи короткое название организации");
  if (!data.fullName) data.fullName = data.shortName;
  if (!data.bin) throw new Error("Укажи БИН/ИИН");

  // Если ставят isDefault — сбрасываем default у других.
  if (data.isDefault) {
    Store.list(COLLECTION).forEach((o) => {
      if (o.isDefault && o.id !== payload.id) {
        Store.update(COLLECTION, o.id, { isDefault: false });
      }
    });
  }

  if (payload.id) return Store.update(COLLECTION, payload.id, data);
  return Store.create(COLLECTION, data);
}

export function deleteOrganization(id) {
  if (!id) return false;
  // Soft delete — чтобы старые накладные с этой организацией не сломались.
  Store.update(COLLECTION, id, { isDeleted: true });
  return true;
}
