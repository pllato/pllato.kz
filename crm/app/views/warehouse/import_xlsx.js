import { ICONS } from "../../icons.js";

export function renderWarehouseImportView() {
  return `
    <section class="whm-section">
      <div class="import-frame whm-card">
        <div class="import-header">
          <h3>Импорт xlsx</h3>
        </div>
        <div class="import-body">
          <div class="import-drop">
            <div class="icon">${ICONS.package}</div>
            <div><strong>Импорт в MVP готов структурно, но чтение .xlsx отключено до согласования SheetJS.</strong></div>
            <div class="dim" style="margin-top:6px;">После подтверждения подключим SheetJS через CDN и активируем поток импорта по правилам spec.</div>
          </div>
          <div class="notes-box">
            <strong>Сейчас доступно:</strong> схема коллекций склада, документы с FIFO, карточка товара и отчёт остатков.<br>
            <strong>Далее:</strong> drag-and-drop xlsx, предпросмотр листов, конфликты баланса и связывание контрагентов.
          </div>
        </div>
      </div>
    </section>
  `;
}
