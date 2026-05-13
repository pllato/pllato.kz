// Pllato CORE CRM — Store API.
// Тонкая обёртка над хранилищем. Сейчас под капотом localStorage; позже,
// когда подключим Firebase RTDB, поменяем реализацию здесь — интерфейс
// останется тем же, и UI-модули ничего не заметят.

const NS = "pllato_core_";

function read(collection) {
  try { return JSON.parse(localStorage.getItem(NS + collection) || "[]"); }
  catch { return []; }
}
function write(collection, items) {
  localStorage.setItem(NS + collection, JSON.stringify(items));
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const Store = {
  list(collection) {
    return read(collection).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  },
  get(collection, id) {
    return read(collection).find(x => x.id === id) || null;
  },
  create(collection, data) {
    const items = read(collection);
    const now = Date.now();
    const item = { ...data, id: uid(), createdAt: now, updatedAt: now };
    items.unshift(item);
    write(collection, items);
    return item;
  },
  update(collection, id, patch) {
    const items = read(collection);
    const i = items.findIndex(x => x.id === id);
    if (i < 0) return null;
    items[i] = { ...items[i], ...patch, updatedAt: Date.now() };
    write(collection, items);
    return items[i];
  },
  remove(collection, id) {
    const items = read(collection).filter(x => x.id !== id);
    write(collection, items);
    return true;
  },
  seed(collection, items) {
    // Заполнить только если коллекция пустая (демо-данные).
    if (read(collection).length === 0) {
      const now = Date.now();
      const seeded = items.map((x, i) => ({
        ...x,
        id: uid(),
        createdAt: now - i * 60000,
        updatedAt: now - i * 60000,
      }));
      write(collection, seeded);
    }
  }
};
