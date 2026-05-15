// Pllato CRM — переиспользуемый typeahead (combobox с поиском и «+ Создать»).
//
// API:
//   renderTypeahead({ name, value, items, label, placeholder, createLabel, emptyText, secondaryText })
//     name           — name атрибут hidden input для submit (FormData)
//     value          — текущее выбранное id
//     items          — массив { id, name, sub? } — кандидаты для выбора
//     label          — текст лейбла поля
//     placeholder    — placeholder для input
//     createLabel    — если задан, в дропдаун добавляется пункт «+ {createLabel}»
//     emptyText      — текст когда ничего не выбрано
//     secondaryText  — функция (item) => string, для второй строки чипа
//
//   attachTypeahead(rootEl, { onCreate(query) })
//     навешивает обработчики поиска, открытия, выбора, создания.

export function renderTypeahead({ name, value, items, label, placeholder = "Поиск…", createLabel = null, emptyText = "— не выбран —", secondaryText = null }) {
  const selected = items.find(x => x.id === value);
  return `
    <div class="field typeahead-field" data-name="${name}">
      <label>${label}</label>
      <div class="typeahead" data-name="${name}">
        <input type="hidden" name="${name}" value="${value || ""}">
        <button type="button" class="typeahead-trigger" data-trigger>
          <span class="typeahead-value">
            ${selected ? `<strong>${escape(selected.name)}</strong>${selected.sub ? `<span class="typeahead-sub"> · ${escape(selected.sub)}</span>` : ""}` : `<span class="typeahead-placeholder">${emptyText}</span>`}
          </span>
          <span class="typeahead-caret">▾</span>
        </button>
        <div class="typeahead-dropdown" hidden>
          <input type="text" class="typeahead-search" placeholder="${placeholder}">
          <div class="typeahead-list" data-create-label="${createLabel || ""}">
            ${renderItems(items, value)}
            ${createLabel ? `<button type="button" class="typeahead-create-btn" data-create>+ ${escape(createLabel)}</button>` : ""}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderItems(items, selectedId) {
  if (items.length === 0) {
    return `<div class="typeahead-empty">Ничего не найдено</div>`;
  }
  return items.map(it => `
    <button type="button" class="typeahead-item ${it.id === selectedId ? "selected" : ""}" data-id="${it.id}">
      <span class="ta-item-name">${escape(it.name)}</span>
      ${it.sub ? `<span class="ta-item-sub">${escape(it.sub)}</span>` : ""}
    </button>
  `).join("");
}

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function closeAllTypeaheads(exceptTa = null) {
  document.querySelectorAll('.typeahead').forEach((otherTa) => {
    if (otherTa === exceptTa) return;
    const otherDropdown = otherTa.querySelector('.typeahead-dropdown');
    if (otherDropdown) {
      otherDropdown.hidden = true;
    }
    otherTa.classList.remove('open');
  });
}

export function attachTypeahead(rootEl, opts = {}) {
  const onCreate = opts.onCreate;
  rootEl.querySelectorAll(".typeahead").forEach(ta => {
    const trigger = ta.querySelector("[data-trigger]");
    const dropdown = ta.querySelector(".typeahead-dropdown");
    const search = ta.querySelector(".typeahead-search");
    const list = ta.querySelector(".typeahead-list");
    const hidden = ta.querySelector('input[type="hidden"]');

    function close() { dropdown.hidden = true; ta.classList.remove("open"); }
    function open() {
      closeAllTypeaheads(ta);
      dropdown.hidden = false;
      ta.classList.add("open");
      setTimeout(() => search.focus(), 10);
    }

    trigger.addEventListener("click", e => {
      e.stopPropagation();
      if (dropdown.hidden) open(); else close();
    });

    search.addEventListener("input", () => {
      const q = search.value.toLowerCase().trim();
      const items = (window.__taItems && window.__taItems[ta.dataset.name]) || [];
      const filtered = !q ? items : items.filter(it =>
        (it.name || "").toLowerCase().includes(q) ||
        (it.sub || "").toLowerCase().includes(q)
      );
      list.innerHTML = renderItems(filtered, hidden.value) +
        (list.dataset.createLabel ? `<button type="button" class="typeahead-create-btn" data-create>+ ${escape(list.dataset.createLabel)}${q ? ` «${escape(q)}»` : ""}</button>` : "");
      bindItemClicks();
    });

    function bindItemClicks() {
      list.querySelectorAll(".typeahead-item").forEach(item => {
        item.addEventListener("click", () => {
          hidden.value = item.dataset.id;
          // Обновить trigger
          const items = (window.__taItems && window.__taItems[ta.dataset.name]) || [];
          const sel = items.find(x => x.id === item.dataset.id);
          if (sel) {
            trigger.querySelector(".typeahead-value").innerHTML =
              `<strong>${escape(sel.name)}</strong>${sel.sub ? `<span class="typeahead-sub"> · ${escape(sel.sub)}</span>` : ""}`;
          }
          close();
          hidden.dispatchEvent(new Event("change", { bubbles: true }));
        });
      });
      list.querySelector("[data-create]")?.addEventListener("click", async () => {
        const query = search.value.trim();
        if (typeof onCreate !== "function") return;
        const created = await onCreate(ta.dataset.name, query);
        if (created && created.id) {
          hidden.value = created.id;
          trigger.querySelector(".typeahead-value").innerHTML =
            `<strong>${escape(created.name)}</strong>${created.sub ? `<span class="typeahead-sub"> · ${escape(created.sub)}</span>` : ""}`;
          close();
          hidden.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    }
    bindItemClicks();

    document.addEventListener("click", function clickOutside(e) {
      if (!ta.contains(e.target)) close();
    });
    search.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  });
}
