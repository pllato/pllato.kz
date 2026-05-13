// Pllato CRM — стадии воронки.
// Хранятся в localStorage, редактируются пользователем (порядок + название + цвет).

const KEY = "pllato_core_stages";

const DEFAULT_STAGES = [
  { id: "new",       title: "Новые",           color: "#8896b3" },
  { id: "qualified", title: "Квалифицированы", color: "#3b82f6" },
  { id: "proposal",  title: "Предложение",     color: "#a855f7" },
  { id: "won",       title: "Выигрыш",         color: "#22c55e" },
  { id: "lost",      title: "Проигрыш",        color: "#5d6b85" },
];

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    if (Array.isArray(v) && v.length) return v;
  } catch {}
  return DEFAULT_STAGES.slice();
}
function write(stages) {
  localStorage.setItem(KEY, JSON.stringify(stages));
}

export function getStages() {
  return read();
}
export function saveStages(stages) {
  write(stages);
}

let _idSeq = 0;
export function newStageId() {
  _idSeq++;
  return "s_" + Date.now().toString(36) + "_" + _idSeq;
}

export function findStage(id) {
  return getStages().find(s => s.id === id) || null;
}

export const STAGE_COLORS = [
  "#8896b3", "#3b82f6", "#a855f7", "#22c55e", "#5d6b85",
  "#b8895a", "#ef4444", "#f59e0b", "#06b6d4", "#ec4899",
];
