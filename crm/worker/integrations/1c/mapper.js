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
    is_folder: bool(raw.IsFolder),
    parent_ref: nullIfEmptyGuid(raw.Parent_Key),
    // Владелец договора = контрагент. В БП поле называется Owner_Key
    // (НЕ Владелец_Key — из-за этого contractor_ref был пустой у всех).
    contractor_ref: nullIfEmptyGuid(raw.Owner_Key),
    organization_ref: nullIfEmptyGuid(raw.Организация_Key),
    contract_kind: nullIfEmptyString(raw.ВидДоговора),
    currency_ref: nullIfEmptyGuid(raw.ВалютаВзаиморасчетов_Key),
    start_date: isoOrNull(raw.ДатаНачалаДействияДоговора),
    end_date: isoOrNull(raw.ДатаОкончанияДействияДоговора),
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

// ─── Документы: push CRM → 1С ─────────────────────────────────────────────
//
// Document_СчетНаОплатуПокупателю (БП 3.0 для Казахстана, 1С-Рейтинг 3.0.71.1).
// Структура подтверждена образцом реального документа из базы Аминамед (2026-05):
//   Шапка: Date, Организация_Key, Контрагент_Key, ДоговорКонтрагента_Key,
//          ВалютаДокумента_Key, Склад_Key, СуммаДокумента, СуммаВключаетНДС,
//          УчитыватьНДС, КурсВзаиморасчетов, КратностьВзаиморасчетов, ТипЦен_Key,
//          Комментарий, Ответственный_Key, Автор_Key
//   Товары[]: LineNumber, Номенклатура_Key, ЕдиницаИзмерения_Key, Количество,
//             Цена, Сумма, СтавкаНДС_Key, СуммаНДС, Коэффициент

const ONE_C_DATE_PLACEHOLDER = "0001-01-01T00:00:00";

/**
 * Формат даты для OData 1С: 'YYYY-MM-DDTHH:mm:ss' (без таймзоны и миллисекунд).
 * 1С интерпретирует это как локальное время сервера БД.
 */
export function toODataDate(value) {
  let d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * CRM-счёт → тело OData POST для Document_СчетНаОплатуПокупателю.
 * Чистая функция: на вход — уже разрезолвленные GUID-ы 1С, на выход — готовый payload.
 *
 * inv = {
 *   organizationRef*  — Организация_Key (наше юр.лицо-отправитель)
 *   contractorRef*    — Контрагент_Key (клиент)
 *   currencyRef*      — ВалютаДокумента_Key
 *   contractRef       — ДоговорКонтрагента_Key
 *   warehouseRef      — Склад_Key
 *   priceTypeRef      — ТипЦен_Key
 *   responsibleRef    — Ответственный_Key / Автор_Key
 *   date              — дата документа (ISO/Date), по умолчанию now
 *   vatIncluded       — СуммаВключаетНДС (default true)
 *   accountForVat     — УчитыватьНДС (default true)
 *   externalId        — id сделки/заказа Pllato (вшивается в Комментарий — идемпотентность)
 *   comment           — доп. комментарий
 *   total             — СуммаДокумента (если не задан — сумма строк)
 *   lines[]*          — { productRef*, unitRef, qty*, price*, sum, vatRateRef, vatSum }
 * }
 */
export function invoiceToOData(inv) {
  if (!inv || typeof inv !== "object") throw new Error("invoiceToOData: object required");
  const lines = Array.isArray(inv.lines) ? inv.lines : [];
  if (lines.length === 0) throw new Error("invoiceToOData: at least one line required");

  const tovary = lines.map((ln, i) => {
    const qty = Number(ln.qty) || 0;
    const price = Number(ln.price) || 0;
    const sum = ln.sum != null ? round2(ln.sum) : round2(qty * price);
    const row = {
      LineNumber: i + 1,
      Номенклатура_Key: ln.productRef,
      Количество: qty,
      Цена: price,
      Сумма: sum,
      Коэффициент: 1,
      СуммаНДС: ln.vatSum != null ? round2(ln.vatSum) : 0,
    };
    if (ln.unitRef) row.ЕдиницаИзмерения_Key = ln.unitRef;
    if (ln.vatRateRef) row.СтавкаНДС_Key = ln.vatRateRef;
    return row;
  });

  const total = inv.total != null
    ? round2(inv.total)
    : round2(tovary.reduce((s, r) => s + (Number(r.Сумма) || 0), 0));

  const commentParts = [];
  const idPrefix = inv.externalIdPrefix || "PLLATO-INV";
  if (inv.externalId) commentParts.push(`${idPrefix}:${inv.externalId}`);
  if (inv.comment) commentParts.push(String(inv.comment));

  const out = {
    Date: toODataDate(inv.date),
    Организация_Key: inv.organizationRef,
    Контрагент_Key: inv.contractorRef,
    ВалютаДокумента_Key: inv.currencyRef,
    СуммаДокумента: total,
    СуммаВключаетНДС: inv.vatIncluded !== false,
    УчитыватьНДС: inv.accountForVat !== false,
    КурсВзаиморасчетов: 1,
    КратностьВзаиморасчетов: 1,
    Комментарий: commentParts.join(" "),
    Товары: tovary,
  };
  // Код назначения платежа — только для счёта (в реализации поля нет → 400).
  // По указанию Асем: 710. Передаётся через inv.paymentPurposeCode.
  if (inv.paymentPurposeCode) out.КодНазначенияПлатежа = String(inv.paymentPurposeCode);
  if (inv.contractRef) out.ДоговорКонтрагента_Key = inv.contractRef;
  if (inv.deliveryAddress) out.АдресДоставки = String(inv.deliveryAddress);
  if (inv.warehouseRef) out.Склад_Key = inv.warehouseRef;
  if (inv.priceTypeRef) out.ТипЦен_Key = inv.priceTypeRef;
  if (inv.responsibleRef) {
    out.Ответственный_Key = inv.responsibleRef;
    out.Автор_Key = inv.responsibleRef;
  }
  return out;
}

/**
 * Обратное направление: созданный/прочитанный счёт из 1С → краткая нормализация
 * для ответа CRM и записи в карточку сделки.
 */
export function invoiceFromOData(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    ref_key: raw.Ref_Key,
    number: nullIfEmptyString(raw.Number),
    date: isoOrNull(raw.Date),
    posted: bool(raw.Posted),
    deletion_mark: bool(raw.DeletionMark),
    total: raw.СуммаДокумента != null ? Number(raw.СуммаДокумента) : null,
    contractor_ref: nullIfEmptyGuid(raw.Контрагент_Key),
    organization_ref: nullIfEmptyGuid(raw.Организация_Key),
    contract_ref: nullIfEmptyGuid(raw.ДоговорКонтрагента_Key),
    comment: nullIfEmptyString(raw.Комментарий),
  };
}
