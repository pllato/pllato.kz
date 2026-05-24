// app/views/warehouse/import_xlsx.js
// Реальный импорт xlsx-книг складского учёта через SheetJS.
// SheetJS подключается лениво (один раз, из CDN), парсинг идёт целиком в браузере.
//
// Контракт:
//   renderWarehouseImportView()     — возвращает HTML экрана.
//   initWarehouseImportView(root)   — вешает события на DOM после рендера.
//                                      Idempotent: повторный вызов не дублирует слушателей.
//
// Жизненный цикл:
//   1) пользователь перетаскивает .xlsx → парсим в Workbook
//   2) показываем список листов с чекбоксами + summary
//   3) кнопка «Импортировать» → собираем payload → importWarehouseBatch
//   4) отчёт: что создано, конфликты

import { ICONS } from "../../icons.js";
import {
  WH,
  WAREHOUSE_ENTITIES,
  parseExpiryValue,
  importWarehouseBatch,
} from "../../warehouse.js";
import { Store } from "../../store.js";

const SHEETJS_CDN = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";

// ---------- ленивая загрузка SheetJS ----------
let sheetjsPromise = null;
function ensureSheetJs() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (sheetjsPromise) return sheetjsPromise;
  sheetjsPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SHEETJS_CDN;
    s.async = true;
    s.onload = () => {
      if (window.XLSX) resolve(window.XLSX);
      else reject(new Error("SheetJS загрузился, но XLSX не определён"));
    };
    s.onerror = () => reject(new Error("Не удалось загрузить SheetJS из CDN"));
    document.head.appendChild(s);
  });
  return sheetjsPromise;
}

// ---------- состояние модуля (живёт между рендерами) ----------
const importState = {
  fileName: "",
  entity: "ТОО",           // авто-детект по имени файла, можно поменять
  workbook: null,           // последний загруженный XLSX workbook
  parsed: null,             // результат парсинга (см. parseWorkbook)
  selectedSheets: new Set(),// какие листы импортировать
  busy: false,
  progress: null,           // { stage, percent, message } во время импорта
  lastResult: null,         // результат последнего импорта
  error: "",
  // Куда писать историю движений:
  //   'indexeddb'    — IndexedDB (~50+ МБ лимит, рекомендуется по умолчанию).
  //   'localStorage' — старое поведение (упирается в ~10 МБ для всего сайта).
  //   'skip'         — не сохранять историю, только остатки/партии.
  movementsTarget: "indexeddb",
  // То же для документов: книги учёта дают 10k+ накладных, в localStorage
  // (~6 МБ) не помещаются.
  documentsTarget: "indexeddb",
};

// ---------- HTML ----------
export function renderWarehouseImportView() {
  const wb = importState.workbook;
  const parsed = importState.parsed;

  const fileInfoHtml = wb
    ? `<div class="muted" style="margin-top:6px">
         Загружен: <strong>${escapeHtml(importState.fileName)}</strong>
         · листов: ${wb.SheetNames.length}
         · юр.лицо: <strong>${escapeHtml(importState.entity)}</strong>
       </div>`
    : "";

  return `
    <section class="whm-section" data-wh-import-root>
      <div class="import-frame whm-card">
        <div class="import-header">
          <h3>Импорт xlsx</h3>
          <div class="muted">Книги учёта ИП и ТОО — формат «Наименование, LOT, срок годности, дата, № документа, приход, расход, остаток, куда»</div>
        </div>
        <div class="import-body">

          <div class="import-drop" data-wh-drop>
            <div class="icon">📥</div>
            <div><strong>Перетащи .xlsx сюда</strong> или нажми «Выбрать файл»</div>
            <div style="margin-top:10px">
              <input type="file" accept=".xlsx,.xls" data-wh-file style="display:none">
              <button type="button" class="btn-ghost btn-sm" data-wh-file-btn>Выбрать файл</button>
            </div>
            ${fileInfoHtml}
            ${importState.error ? `<div style="color:var(--danger);margin-top:8px">${escapeHtml(importState.error)}</div>` : ""}
          </div>

          ${parsed ? renderPreview(parsed) : ""}

          ${importState.lastResult ? renderResult(importState.lastResult) : ""}

          ${!parsed && !importState.lastResult ? `
            <div class="notes-box" style="margin-top:14px">
              <strong>Правила импорта:</strong><br>
              ・ Каждый лист = один товар. Лист «РЕЗЕРВ» пропускается автоматически.<br>
              ・ Юр.лицо определяется по имени файла (ИП / ТОО), можно поменять перед импортом.<br>
              ・ Партии (LOT) создаются по уникальному значению в колонке B.<br>
              ・ Документы группируются по паре «номер + дата» (даёт FIFO-сплит между партиями).<br>
              ・ Срок «май 2016г.» интерпретируется как последний день мая 2016.<br>
              ・ Строки без даты — корректировки/инвентаризация (тип «adjustment»).<br>
            </div>
          ` : ""}

        </div>
      </div>
    </section>
  `;
}

function renderPreview(parsed) {
  const totalProducts = parsed.products.length;
  const totalLots = parsed.lots.length;
  const totalDocs = parsed.documents.length;
  const totalMov = parsed.movements.length;
  const totalConflicts = parsed.conflicts.length;

  // Грубая оценка размера в localStorage (для UX-предупреждения).
  // Эмпирически ~220 байт на движение, ~250 на товар/партию/документ.
  const estimatedBytes = totalMov * 220 + (totalProducts + totalLots + totalDocs) * 250;
  const estimatedMb = estimatedBytes / 1024 / 1024;
  const sizeWarning = estimatedMb > 4
    ? `<div style="margin-bottom:14px;padding:10px 14px;background:#fff8e1;border:1px solid #f0c14b;border-radius:6px;color:#5d4037;font-size:13px">
        <strong>⚠ Большой объём:</strong> ожидается ~${estimatedMb.toFixed(1)} МБ в localStorage браузера.
        Лимит Chrome ~10 МБ. Если уже есть другие данные CRM (контакты, сделки), импорт может не влезть.
        Если файл «ТОО» — рекомендуется импортировать его <strong>отдельно</strong> от «ИП», не оба сразу.
       </div>`
    : "";

  return `
    <div class="whm-card" style="margin-top:14px;padding:14px 18px">
      ${sizeWarning}
      <div class="row" style="align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap">
        <div>
          <label style="font-size:11px;color:var(--text-dim);text-transform:uppercase">Юр.лицо</label>
          <select data-wh-entity class="select" style="margin-left:6px">
            ${WAREHOUSE_ENTITIES.map(e => `<option value="${e}" ${e === importState.entity ? "selected" : ""}>${e}</option>`).join("")}
          </select>
        </div>
        <div>
          <label style="font-size:11px;color:var(--text-dim);text-transform:uppercase">Документы</label>
          <select data-wh-documents-target class="select" style="margin-left:6px">
            <option value="indexeddb" ${importState.documentsTarget === "indexeddb" ? "selected" : ""}>IndexedDB (рекомендуется)</option>
            <option value="localStorage" ${importState.documentsTarget === "localStorage" ? "selected" : ""}>localStorage</option>
            <option value="skip" ${importState.documentsTarget === "skip" ? "selected" : ""}>Не сохранять</option>
          </select>
        </div>
        <div>
          <label style="font-size:11px;color:var(--text-dim);text-transform:uppercase">Движения</label>
          <select data-wh-movements-target class="select" style="margin-left:6px">
            <option value="indexeddb" ${importState.movementsTarget === "indexeddb" ? "selected" : ""}>IndexedDB (рекомендуется)</option>
            <option value="localStorage" ${importState.movementsTarget === "localStorage" ? "selected" : ""}>localStorage</option>
            <option value="skip" ${importState.movementsTarget === "skip" ? "selected" : ""}>Не сохранять</option>
          </select>
        </div>
        <div class="spacer"></div>
        <button type="button" class="btn-ghost btn-sm" data-wh-reset ${importState.busy ? "disabled" : ""}>Сбросить файл</button>
        <button type="button" class="btn-primary" data-wh-import ${importState.busy ? "disabled" : ""}>
          ${importState.busy ? "Импортирую…" : "Импортировать выбранное"}
        </button>
      </div>

      ${importState.busy || importState.progress ? `
        <div class="whm-progress" style="margin-bottom:14px;padding:10px 14px;background:var(--surface-2);border:1px solid var(--border-soft);border-radius:6px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:12px">
            <span data-wh-progress-label>${escapeHtml(importState.progress?.message || "Подготовка…")}</span>
            <span class="muted">Не закрывайте вкладку</span>
          </div>
          <div style="height:6px;background:var(--border-soft);border-radius:3px;overflow:hidden">
            <div data-wh-progress-bar style="height:100%;width:${importState.progress?.percent || 0}%;background:var(--accent);transition:width 200ms ease"></div>
          </div>
        </div>
      ` : ""}

      <div class="import-summary" style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px">
        ${statTile("Товаров", totalProducts)}
        ${statTile("Партий", totalLots)}
        ${statTile("Документов", totalDocs)}
        ${statTile("Движений", totalMov)}
        ${statTile("Конфликтов", totalConflicts, totalConflicts > 0 ? "warning" : "")}
      </div>

      <div class="muted" style="font-size:12px;margin-bottom:6px">Листы файла (снять галочку = пропустить):</div>
      <div class="whm-sheet-list" style="max-height:280px;overflow:auto;border:1px solid var(--border-soft);border-radius:6px;padding:6px;background:var(--surface-2)">
        ${parsed.sheetSummaries.map((s, i) => `
          <label class="row" style="gap:8px;padding:5px 8px;border-radius:4px;font-size:13px;${s.skipped ? "opacity:.55" : ""}">
            <input type="checkbox" data-wh-sheet="${i}" ${importState.selectedSheets.has(s.sheetName) ? "checked" : ""} ${s.skipped ? "disabled" : ""}>
            <span style="flex:1">${escapeHtml(s.sheetName)} ${s.skipped ? "<em class=muted>(пропуск)</em>" : ""}</span>
            <span class="muted" style="font-size:11.5px">${s.products} тов · ${s.lots} парт · ${s.movements} движ</span>
          </label>
        `).join("")}
      </div>

      ${parsed.conflicts.length > 0 ? `
        <details style="margin-top:12px">
          <summary class="muted" style="cursor:pointer">Конфликты (${parsed.conflicts.length})</summary>
          <ul style="font-size:12px;color:var(--text-muted);margin:8px 0 0;padding-left:20px;max-height:200px;overflow:auto">
            ${parsed.conflicts.slice(0, 50).map(c => `<li>${escapeHtml(c.sheet || "")}: ${escapeHtml(c.message)}</li>`).join("")}
            ${parsed.conflicts.length > 50 ? `<li>… ещё ${parsed.conflicts.length - 50}</li>` : ""}
          </ul>
        </details>
      ` : ""}
    </div>
  `;
}

function renderResult(r) {
  return `
    <div class="whm-card" style="margin-top:14px;padding:14px 18px;border-left:3px solid var(--success)">
      <strong style="color:var(--success)">Импорт завершён</strong>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px">
        ${statTile("Товаров создано", r.productsCreated, "success")}
        ${statTile("Партий создано", r.lotsCreated)}
        ${statTile("Документов", r.documentsCreated)}
        ${statTile("Движений", r.movementsCreated)}
      </div>
      ${r.productsReused ? `<div class="muted" style="margin-top:8px;font-size:12px">Уже было в базе (переиспользовано): ${r.productsReused} товар(ов)</div>` : ""}
      ${r.conflicts && r.conflicts.length ? `
        <div class="muted" style="margin-top:8px;font-size:12px">
          Конфликтов при загрузке: ${r.conflicts.length}. Они пропущены, остальное — на складе.
        </div>
      ` : ""}
      <div style="margin-top:10px;padding:8px 10px;background:var(--surface-2);border-radius:4px;font-size:12px;color:var(--text-muted)">
        ⚠ Импортированные данные сохранены <strong>только в этом браузере</strong> (localStorage). Если хотите синхронизировать в Cloudflare — это отдельный шаг, делается осознанно после проверки.
      </div>
      <div style="margin-top:10px">
        <button type="button" class="btn-ghost btn-sm" data-wh-reset>Загрузить ещё файл</button>
        <a href="#warehouse/products" class="btn-primary btn-sm" style="margin-left:6px">Перейти в каталог</a>
      </div>
    </div>
  `;
}

function statTile(label, value, modifier = "") {
  const color = modifier === "success" ? "var(--success)" : modifier === "warning" ? "var(--warning)" : "var(--text)";
  return `
    <div style="background:var(--surface-2);border:1px solid var(--border-soft);border-radius:6px;padding:8px 12px">
      <div style="font-size:10.5px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.06em">${escapeHtml(label)}</div>
      <div style="font-size:20px;font-weight:700;margin-top:2px;color:${color}">${value}</div>
    </div>
  `;
}

// ---------- инициализация событий ----------
export function initWarehouseImportView(root) {
  const scope = root || document;
  const host = scope.querySelector("[data-wh-import-root]");
  if (!host) return;
  if (host.dataset.whImportBound === "1") return;
  host.dataset.whImportBound = "1";

  // Открыть файлпикер
  host.addEventListener("click", (e) => {
    const target = e.target.closest("[data-wh-file-btn], [data-wh-import], [data-wh-reset]");
    if (!target) return;
    if (target.matches("[data-wh-file-btn]")) {
      host.querySelector("[data-wh-file]")?.click();
    } else if (target.matches("[data-wh-import]")) {
      runImport(host);
    } else if (target.matches("[data-wh-reset]")) {
      resetState();
      rerender(host);
    }
  });

  // Выбор файла
  host.addEventListener("change", async (e) => {
    if (e.target.matches("[data-wh-file]")) {
      const file = e.target.files?.[0];
      if (!file) return;
      await handleFile(host, file);
    } else if (e.target.matches("[data-wh-entity]")) {
      importState.entity = e.target.value;
    } else if (e.target.matches("[data-wh-movements-target]")) {
      importState.movementsTarget = e.target.value;
    } else if (e.target.matches("[data-wh-documents-target]")) {
      importState.documentsTarget = e.target.value;
    } else if (e.target.matches("[data-wh-sheet]")) {
      const idx = Number(e.target.dataset.whSheet);
      const sheetName = importState.parsed?.sheetSummaries[idx]?.sheetName;
      if (!sheetName) return;
      if (e.target.checked) importState.selectedSheets.add(sheetName);
      else importState.selectedSheets.delete(sheetName);
    }
  });

  // Drag&drop
  const dropZone = host.querySelector("[data-wh-drop]");
  if (dropZone) {
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "var(--accent)";
    });
    dropZone.addEventListener("dragleave", () => {
      dropZone.style.borderColor = "";
    });
    dropZone.addEventListener("drop", async (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "";
      const file = e.dataTransfer.files?.[0];
      if (file) await handleFile(host, file);
    });
  }
}

function resetState() {
  importState.workbook = null;
  importState.parsed = null;
  importState.fileName = "";
  importState.selectedSheets = new Set();
  importState.error = "";
  importState.lastResult = null;
  importState.busy = false;
}

function rerender(host) {
  const parent = host.parentElement;
  if (!parent) return;
  const fresh = document.createElement("div");
  fresh.innerHTML = renderWarehouseImportView();
  const newRoot = fresh.firstElementChild;
  host.replaceWith(newRoot);
  initWarehouseImportView(newRoot.parentElement);
}

async function handleFile(host, file) {
  importState.error = "";
  importState.fileName = file.name;
  if (/ип/i.test(file.name)) importState.entity = "ИП";
  else if (/тоо/i.test(file.name)) importState.entity = "ТОО";

  try {
    const XLSX = await ensureSheetJs();
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    importState.workbook = workbook;
    importState.parsed = parseWorkbook(workbook, importState.entity);
    importState.selectedSheets = new Set(
      importState.parsed.sheetSummaries.filter(s => !s.skipped).map(s => s.sheetName)
    );
  } catch (err) {
    console.error("[warehouse-import] handleFile", err);
    importState.error = err.message || String(err);
    importState.workbook = null;
    importState.parsed = null;
  }
  rerender(host);
}

// ---------- парсинг workbook ----------
const COUNTERPARTY_NORMALIZERS = [
  { pattern: /^(склад|на склад|остаток на старт|остаток)$/i, type: "internal", text: "Склад" },
  { pattern: /^(в офис|офис)/i, type: "internal", text: "В офис" },
  { pattern: /^(на маркетинг|маркетинг)/i, type: "internal", text: "Маркетинг" },
  { pattern: /^(врачам|апробация|выставка)/i, type: "internal", text: null },
  { pattern: /^(чл|фл|частное лицо)/i, type: "person", text: null },
];

function parseWorkbook(wb, entity) {
  const result = {
    products: [],
    lots: [],
    documents: [],
    movements: [],
    conflicts: [],
    sheetSummaries: [],
  };

  // подгружаем контакты для матчинга counterpartyText
  const contacts = Store.list("contacts") || [];
  const contactByName = new Map();
  contacts.forEach((c) => {
    const keys = [c.name, c.company].filter(Boolean).map(s => s.toLowerCase().trim());
    keys.forEach(k => contactByName.set(k, c.id));
  });

  // карта документов по (number, date) → id для дедупликации
  const docKeyToId = new Map();

  for (const sheetName of wb.SheetNames) {
    if (sheetName.toUpperCase() === "РЕЗЕРВ") {
      result.sheetSummaries.push({ sheetName, products: 0, lots: 0, movements: 0, skipped: true });
      continue;
    }

    const ws = wb.Sheets[sheetName];
    const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });

    const sheetResult = parseSheet(sheetName, rows, entity, contactByName, docKeyToId);

    result.products.push(...sheetResult.products);
    result.lots.push(...sheetResult.lots);
    result.documents.push(...sheetResult.documents);
    result.movements.push(...sheetResult.movements);
    sheetResult.conflicts.forEach(c => result.conflicts.push({ ...c, sheet: sheetName }));

    result.sheetSummaries.push({
      sheetName,
      products: sheetResult.products.length,
      lots: sheetResult.lots.length,
      movements: sheetResult.movements.length,
      skipped: sheetResult.products.length === 0 && sheetResult.lots.length === 0,
    });
  }

  return result;
}

function parseSheet(sheetName, rows, entity, contactByName, docKeyToId) {
  const out = {
    products: [],
    lots: [],
    documents: [],
    movements: [],
    conflicts: [],
  };

  // найти первую строку с непустым именем товара
  let productNameRaw = null;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i] && rows[i][0]) {
      productNameRaw = String(rows[i][0]);
      break;
    }
  }
  if (!productNameRaw) {
    out.conflicts.push({ row: 0, message: "не нашёл имя товара" });
    return out;
  }

  const { name, sku } = extractNameAndSku(productNameRaw, sheetName);
  const productImportedId = `imp_p_${stableHash(sku + "|" + entity)}`;
  out.products.push({
    importedId: productImportedId,
    sku,
    name,
    category: "",
    entity,
    unit: "шт",
    pack: extractPack(name),
    description: "",
    minStock: 0,
    isArchived: false,
  });

  // карта LOT → importedId
  const lotMap = new Map();
  // карта LOT → состояние (текущее значение currentQty)
  const lotState = new Map();
  // ссылка на текущую активную партию для строк, где LOT не указан (наследуется)
  let currentLotCode = null;

  for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
    const r = rows[rowIdx];
    if (!r || r.every(c => c == null || c === "")) continue;

    const lotRaw = r[1];
    const expiryRaw = r[2];
    const dateRaw = r[3];
    const docNum = r[4];
    const qtyIn = toNumOrNull(r[5]);
    const qtyOut = toNumOrNull(r[6]);
    const balance = toNumOrNull(r[7]);
    const destRaw = r[8];

    // обновляем активный LOT
    if (lotRaw) currentLotCode = String(lotRaw).trim();
    if (!currentLotCode) continue;

    // создать партию если новый код
    if (!lotMap.has(currentLotCode)) {
      const expiryParsed = parseExpiryValue(expiryRaw);
      const inIso = isoFromExcel(dateRaw);
      const lotImportedId = `imp_l_${stableHash(productImportedId + "|" + currentLotCode)}`;
      lotMap.set(currentLotCode, lotImportedId);
      lotState.set(currentLotCode, 0);
      out.lots.push({
        importedId: lotImportedId,
        productImportedId,
        lotCode: currentLotCode,
        expiryDate: expiryParsed.expiryDate,
        expiryRaw: expiryParsed.expiryRaw,
        inDate: inIso || "",
        initialQty: 0,    // обновим суммой приходов ниже
        currentQty: 0,    // обновим балансом ниже
        note: "",
      });
    }

    const lotImportedId = lotMap.get(currentLotCode);

    // классификация движения
    const direction = qtyIn ? "in" : (qtyOut ? "out" : null);
    const qty = direction === "in" ? qtyIn : qtyOut;
    if (!direction && balance == null) continue;

    const dateIso = isoFromExcel(dateRaw);
    const docNumStr = docNum ? String(docNum).trim() : "";
    const destStr = destRaw ? String(destRaw).trim() : "";

    // строка без даты — корректировка
    if (!dateIso) {
      if (balance != null) {
        const prev = lotState.get(currentLotCode) || 0;
        const delta = balance - prev;
        if (delta !== 0) {
          out.movements.push({
            productImportedId,
            lotImportedId,
            docImportedId: null,
            date: "",
            qty: Math.abs(delta),
            direction: delta > 0 ? "in" : "out",
            type: "adjustment",
            counterpartyText: destStr || docNumStr || "корректировка из xlsx",
            note: "Корректировка (строка без даты)",
            balanceAfter: balance,
          });
          lotState.set(currentLotCode, balance);
        }
      }
      continue;
    }

    if (!direction) continue;

    // тип документа
    const docType = classifyDocType(docNumStr, destStr, direction);

    // привязка контрагента
    const { counterpartyContactId, counterpartyText } = resolveCounterparty(destStr, contactByName);

    // дедупликация документа по (number, date, type)
    let docImportedId = null;
    if (docNumStr) {
      const key = `${docNumStr}|${dateIso}|${docType}`;
      if (!docKeyToId.has(key)) {
        docImportedId = `imp_d_${stableHash(key)}`;
        docKeyToId.set(key, docImportedId);
        out.documents.push({
          importedId: docImportedId,
          type: docType,
          number: docNumStr,
          date: dateIso,
          counterpartyContactId,
          counterpartyText,
          dealId: null,
          items: [],   // заполняем ниже
          totalAmount: 0,
          currency: "KZT",
          status: "posted",
          note: "",
        });
      } else {
        docImportedId = docKeyToId.get(key);
      }
    }

    // вычислить balanceAfter
    const prev = lotState.get(currentLotCode) || 0;
    const newBalance = direction === "in" ? prev + qty : prev - qty;
    lotState.set(currentLotCode, newBalance);

    out.movements.push({
      productImportedId,
      lotImportedId,
      docImportedId,
      date: dateIso,
      qty,
      direction,
      type: classifyMovementType(docType, direction),
      counterpartyContactId,
      counterpartyText,
      note: "",
      balanceAfter: newBalance,
    });

    // добавить позицию в документ
    if (docImportedId) {
      const doc = out.documents.find(d => d.importedId === docImportedId);
      if (doc) {
        doc.items.push({
          productImportedId,
          lotImportedId,
          qty,
          unitPrice: 0,
          lineAmount: 0,
        });
      }
    }

    // если приход — увеличиваем initialQty партии
    if (direction === "in") {
      const lot = out.lots.find(l => l.importedId === lotImportedId);
      if (lot) lot.initialQty += qty;
    }

    // контроль баланса с xlsx
    if (balance != null && Math.abs(balance - newBalance) > Math.max(5, Math.abs(balance) * 0.01)) {
      out.conflicts.push({ row: rowIdx + 1, message: `LOT ${currentLotCode}: расчётный остаток ${newBalance}, в xlsx ${balance}` });
    }
  }

  // окончательно проставить currentQty партиям
  for (const [lotCode, qty] of lotState.entries()) {
    const lotImportedId = lotMap.get(lotCode);
    const lot = out.lots.find(l => l.importedId === lotImportedId);
    if (lot) lot.currentQty = Math.max(0, qty);
  }

  return out;
}

// ---------- хелперы парсинга ----------
function extractNameAndSku(raw, fallbackName) {
  const s = String(raw).trim();
  const match = s.match(/(Т\d{8,})\s*$/i);
  if (match) {
    return {
      sku: match[1],
      name: s.replace(/\s*Т\d{8,}\s*$/i, "").trim() || fallbackName,
    };
  }
  return {
    sku: `AUTO_${stableHash(fallbackName)}`,
    name: s || fallbackName,
  };
}

function extractPack(name) {
  const m = name.match(/(\d+\s*(шт\/кор|шт\.\/кор|фл\.?|мл|л|кг|г|шт))/i);
  return m ? m[1] : "";
}

function classifyDocType(number, dest, direction) {
  const n = (number || "").toLowerCase();
  if (n.includes("возврат")) return direction === "in" ? "return_in" : "return_out";
  if (n.includes("спис") || n.includes("акт/сп") || n.includes("акт сп")) return "writeoff_act";
  if (n.includes("поврежд")) return "damage_act";
  if (n.includes("инв") || n.startsWith("инвойс")) return direction === "in" ? "receipt" : "sale_invoice";
  if (n.includes("тов.накл") || n.includes("тов накл") || n.includes("товарн")) {
    return direction === "in" ? "receipt" : "sale_invoice";
  }
  if (n.includes("сч.ф") || n.includes("сч/ф") || n.includes("счёт-факт") || n.includes("счет-факт") || n.includes("счф")) return "sale_invoice";
  if (n.includes("акт")) return "sale_act";
  if (n.includes("накл")) return direction === "in" ? "receipt" : "sale_invoice";
  return direction === "in" ? "receipt" : "sale_invoice";
}

function classifyMovementType(docType, direction) {
  const map = {
    receipt: "receipt",
    sale_invoice: "sale",
    sale_act: "sale",
    writeoff_act: "writeoff",
    damage_act: "damage",
    return_in: "return_in",
    return_out: "return_out",
    transfer: "transfer",
  };
  return map[docType] || (direction === "in" ? "receipt" : "sale");
}

function resolveCounterparty(text, contactByName) {
  const t = (text || "").trim();
  if (!t) return { counterpartyContactId: null, counterpartyText: "" };
  const key = t.toLowerCase();
  if (contactByName.has(key)) {
    return { counterpartyContactId: contactByName.get(key), counterpartyText: t };
  }
  // попытаться вырезать пометку «(имя продавца)»
  const cleaned = t.replace(/\s*\([^)]+\)\s*$/, "").trim().toLowerCase();
  if (cleaned !== key && contactByName.has(cleaned)) {
    return { counterpartyContactId: contactByName.get(cleaned), counterpartyText: t };
  }
  return { counterpartyContactId: null, counterpartyText: t };
}

function isoFromExcel(v) {
  if (v == null || v === "") return "";
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return "";
    return v.toISOString().slice(0, 10);
  }
  if (typeof v === "number" && v > 40000 && v < 80000) {
    const d = new Date((v - 25569) * 86400 * 1000);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  if (typeof v === "string") {
    const s = v.trim().replace("г.", "").replace(/г$/, "");
    const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
    if (m) {
      let [_, dd, mm, yyyy] = m;
      if (yyyy.length === 2) yyyy = "20" + yyyy;
      return `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
    }
  }
  return "";
}

function toNumOrNull(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function stableHash(input) {
  // короткий детерминированный хеш для importedId
  let h = 0;
  const s = String(input);
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

// ---------- запуск импорта ----------
async function runImport(host) {
  if (importState.busy) return;
  if (!importState.parsed) return;
  importState.busy = true;
  importState.error = "";
  importState.progress = { percent: 0, message: "Подготовка…" };
  rerender(host);
  // ВНИМАНИЕ: host теперь указывает на detached узел (rerender его заменил).
  // Все последующие обновления прогресса делаем через document.querySelector
  // — ищем актуальный узел [data-wh-import-root] в живом DOM.

  try {
    // отфильтровать по выбранным листам
    const selectedNames = importState.selectedSheets;

    // выделить только данные выбранных листов
    const allowedProductIds = new Set();
    const products = [];
    for (const p of importState.parsed.products) {
      products.push({ ...p, entity: importState.entity });
      allowedProductIds.add(p.importedId);
    }
    const lots = importState.parsed.lots.filter(l => allowedProductIds.has(l.productImportedId));
    const documents = [];
    for (const d of importState.parsed.documents) {
      const hasOurItems = (d.items || []).some(it => allowedProductIds.has(it.productImportedId));
      if (hasOurItems) documents.push(d);
    }
    const movements = importState.parsed.movements.filter(m => allowedProductIds.has(m.productImportedId));

    const payload = {
      products, lots, documents, movements,
      movementsTarget: importState.movementsTarget,
      documentsTarget: importState.documentsTarget,
    };

    // onProgress всегда ищет актуальный узел в DOM — не использует устаревший host
    const onProgress = (p) => {
      importState.progress = p;
      updateProgressBarInLiveDom(p);
    };

    const result = await importWarehouseBatch(payload, onProgress);
    importState.lastResult = result;
    importState.parsed = null;
    importState.workbook = null;
    importState.selectedSheets = new Set();
    importState.progress = null;
  } catch (err) {
    console.error("[warehouse-import] runImport", err);
    importState.error = (err && err.message) ? err.message : String(err);
    importState.progress = null;
  }
  importState.busy = false;
  // финальный rerender — находим живой узел в документе
  const liveHost = document.querySelector("[data-wh-import-root]");
  if (liveHost) {
    rerender(liveHost);
  }
}

// Обновляет прогресс-бар в живом DOM, минуя устаревшие ссылки на узел.
function updateProgressBarInLiveDom(progress) {
  const bar = document.querySelector("[data-wh-progress-bar]");
  const label = document.querySelector("[data-wh-progress-label]");
  if (bar) bar.style.width = `${Math.min(100, Math.max(0, progress.percent || 0))}%`;
  if (label) label.textContent = progress.message || "";
}
