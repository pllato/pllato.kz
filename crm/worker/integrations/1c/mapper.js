// Маппинг сущностей 1С (БП 3.0 для Казахстана, 1С-Рейтинг 3.0.71.1) ↔ Pllato CRM.
//
// Реальные имена объектов и реквизитов узнали из ответа OData service document
// в базе абонента TOO Dialish (Аминамед), URL:
//   https://1cfresh.kz/a/ea186/263825/odata/standard.odata/
//
// Стиль: чистые функции без побочных эффектов. Принимают сырой OData-объект,
// возвращают нормализованный CRM-объект (camelCase, ISO-даты в UTC, null вместо
// пустых GUID, описания обрезаны).

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

function nullIfEmptyGuid(guid) {
  if (!guid || guid === EMPTY_GUID) return null;
  return guid;
}

function nullIfEmptyString(s) {
  if (s == null) return null;
  const t = String(s).trim();
  return t.length === 0 ? null : t;
}

function isoOrNull(s) {
  if (!s) return null;
  // OData отдаёт '0001-01-01T00:00:00' для незаполненных дат — это плейсхолдер 1С.
  if (typeof s === "string" && s.startsWith("0001-01-01")) return null;
  return s;
}

function bool(v) {
  return v === true || v === "true";
}

/**
 * Catalog_Контрагенты → CRM contractor
 * Реальная структура (37 полей) из API. Берём только то, что нам нужно для CRM.
 */
export function contractorFromOData(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    ref_key: raw.Ref_Key,                                                          // GUID 1С — единый identity
    data_version: raw.DataVersion || null,                                          // для дельта-синхронизации
    code: nullIfEmptyString(raw.Code),                                              // код контрагента в 1С
    name: nullIfEmptyString(raw.Description),
    full_name: nullIfEmptyString(raw.НаименованиеПолное) || nullIfEmptyString(raw.Description),
    deletion_mark: bool(raw.DeletionMark),
    is_folder: bool(raw.IsFolder),
    parent_ref: nullIfEmptyGuid(raw.Parent_Key),
    head_contractor_ref: nullIfEmptyGuid(raw.ГоловнойКонтрагент_Key),
    // Казахстан-специфика
    iin: nullIfEmptyString(raw.ИдентификационныйКодЛичности),                       // ИИН (физлицо)
    bin: nullIfEmptyString(raw.НомерНалоговойРегистрацииВСтранеРезидентства),       // БИН/РНН резидентов
    rnn_legacy: nullIfEmptyString(raw.РНН),                                         // устаревший РНН
    kbe: nullIfEmptyString(raw.КБЕ),                                                // код бенефициара
    is_individual_entrepreneur: bool(raw.ИндивидуальныйПредпринимательАдвокатЧастныйНотариус),
    vat_certificate_date: isoOrNull(raw.ДатаСвидетельстваПоНДС),
    vat_certificate_number: nullIfEmptyString(raw.НомерСвидетельстваПоНДС),
    vat_certificate_series: nullIfEmptyString(raw.СерияСвидетельстваПоНДС),
    sic: nullIfEmptyString(raw.СИК),
    okpo: nullIfEmptyString(raw.КодПоОКПО),
    comment: nullIfEmptyString(raw.Комментарий),
    // Связи
    primary_contact_ref: nullIfEmptyGuid(raw.ОсновноеКонтактноеЛицо_Key),
    primary_bank_account_ref: nullIfEmptyGuid(raw.ОсновнойБанковскийСчет_Key),
    primary_contract_ref: nullIfEmptyGuid(raw.ОсновнойДоговорКонтрагента_Key),
    residence_country_ref: nullIfEmptyGuid(raw.СтранаРезидентства_Key),
  };
}

/**
 * Обратное направление: CRM customer → черновик объекта для POST в Catalog_Контрагенты.
 * Заполняем только обязательные/основные поля; 1С сама подставит дефолты остальным.
 */
export function contractorToOData(customer) {
  if (!customer || typeof customer !== "object") {
    throw new Error("contractorToOData: customer object required");
  }
  const name = String(customer.name || "").trim();
  if (!name) throw new Error("contractorToOData: customer.name required");
  const out = {
    Description: name,
    НаименованиеПолное: customer.full_name || name,
    Комментарий: customer.comment || "",
  };
  if (customer.iin) out.ИдентификационныйКодЛичности = customer.iin;
  if (customer.bin) out.НомерНалоговойРегистрацииВСтранеРезидентства = customer.bin;
  if (customer.rnn_legacy) out.РНН = customer.rnn_legacy;
  if (customer.is_individual_entrepreneur) out.ИндивидуальныйПредпринимательАдвокатЧастныйНотариус = true;
  return out;
}

/**
 * Catalog_Номенклатура → CRM product
 * Точная структура будет известна после первого fetch; пока минимальный набор.
 */
export function productFromOData(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    ref_key: raw.Ref_Key,
    data_version: raw.DataVersion || null,
    code: nullIfEmptyString(raw.Code),
    name: nullIfEmptyString(raw.Description),
    full_name: nullIfEmptyString(raw.НаименованиеПолное) || nullIfEmptyString(raw.Description),
    deletion_mark: bool(raw.DeletionMark),
    is_folder: bool(raw.IsFolder),
    parent_ref: nullIfEmptyGuid(raw.Parent_Key),
    article: nullIfEmptyString(raw.Артикул),
    unit_ref: nullIfEmptyGuid(raw.БазоваяЕдиницаИзмерения_Key) || nullIfEmptyGuid(raw.ЕдиницаИзмерения_Key),
    vat_rate_ref: nullIfEmptyGuid(raw.СтавкаНДС_Key),
    nomenclature_type_ref: nullIfEmptyGuid(raw.ВидНоменклатуры_Key),
    country_origin_ref: nullIfEmptyGuid(raw.СтранаПроисхождения_Key),
    comment: nullIfEmptyString(raw.Комментарий),
  };
}

/**
 * Catalog_ДоговорыКонтрагентов → CRM contract
 */
export function contractFromOData(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    ref_key: raw.Ref_Key,
    data_version: raw.DataVersion || null,
    code: nullIfEmptyString(raw.Code),
    name: nullIfEmptyString(raw.Description),
    deletion_mark: bool(raw.DeletionMark),
    contractor_ref: nullIfEmptyGuid(raw.Владелец_Key),
    organization_ref: nullIfEmptyGuid(raw.Организация_Key),
    contract_kind: nullIfEmptyString(raw.ВидДоговора),
    currency_ref: nullIfEmptyGuid(raw.ВалютаВзаиморасчетов_Key),
    start_date: isoOrNull(raw.ДатаНачала),
    end_date: isoOrNull(raw.ДатаОкончания),
    comment: nullIfEmptyString(raw.Комментарий),
  };
}

/**
 * Catalog_Организации → CRM organization
 */
export function organizationFromOData(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    ref_key: raw.Ref_Key,
    data_version: raw.DataVersion || null,
    code: nullIfEmptyString(raw.Code),
    name: nullIfEmptyString(raw.Description),
    full_name: nullIfEmptyString(raw.НаименованиеПолное) || nullIfEmptyString(raw.Description),
    deletion_mark: bool(raw.DeletionMark),
    bin: nullIfEmptyString(raw.НомерНалоговойРегистрации) || nullIfEmptyString(raw.БИН),
    is_legal_entity: !bool(raw.ЮрФизЛицо) || String(raw.ЮрФизЛицо).includes("Юр"),
    comment: nullIfEmptyString(raw.Комментарий),
  };
}
