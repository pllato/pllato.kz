import { requireSession } from "../pllato-kz-shared/pllato-api.js";
import {
  listContracts, createContract, signOwner, sendContract, deleteContract,
  fetchContractFileBlob, fileToBase64, signLinkForToken,
} from "./api.js";
import { signBase64, pingNcaLayer, NcaLayerError } from "./ncalayer.js";

const session = requireSession({ redirectTo: "login.html" });

const $ = (sel) => document.querySelector(sel);
const listEl = $("#list");
const toastEl = $("#toast");

const STATUS_LABEL = {
  draft: "Черновик",
  in_progress: "На подписании",
  completed: "Подписан всеми",
  declined: "Отклонён",
  cancelled: "Отменён",
};

let pendingFile = null;
let contractsCache = [];

function toast(msg, isErr = false) {
  toastEl.textContent = msg;
  toastEl.className = "toast show" + (isErr ? " err" : "");
  setTimeout(() => { toastEl.className = "toast"; }, 3200);
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function fmtSize(n) {
  if (!n) return "";
  if (n < 1024) return n + " Б";
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + " КБ";
  return (n / 1024 / 1024).toFixed(1) + " МБ";
}

function fmtDate(ms) {
  if (!ms) return "";
  return new Date(ms).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ---- NCALayer indicator ----
async function refreshNcaBadge() {
  const badge = $("#nca-badge");
  const text = $("#nca-text");
  const ok = await pingNcaLayer();
  badge.className = "nca-badge " + (ok ? "ok" : "bad");
  text.textContent = ok ? "NCALayer подключён" : "NCALayer не найден";
}

// ---- Render ----
function signerStatusText(s) {
  if (s.status === "signed") return `<span class="s-status signed">✓ подписал${s.signerCn ? " · " + esc(s.signerCn) : ""}</span>`;
  if (s.status === "declined") return `<span class="s-status declined">✕ отклонил${s.declineReason ? " · " + esc(s.declineReason) : ""}</span>`;
  return `<span class="s-status pending">⏳ ожидает</span>`;
}

function renderSigner(contract, s) {
  const isOwner = s.role === "owner";
  let actions = "";
  if (s.status === "pending") {
    if (isOwner) {
      actions = `<button class="btn bronze sm" data-act="sign-owner" data-id="${contract.id}">Подписать ЭЦП</button>`;
    } else {
      const link = s.token ? signLinkForToken(s.token) : "";
      actions = `<div class="link-box"><input readonly value="${esc(link)}"><button class="btn sm" data-act="copy" data-link="${esc(link)}">Копировать</button></div>`;
    }
  }
  return `<div class="signer">
    <div>
      <div class="who">${esc(s.fullName)} <span class="role-tag">${isOwner ? "владелец" : "сотрудник"}</span></div>
      <div class="sub">${s.iin ? "ИИН " + esc(s.iin) + " · " : ""}${signerStatusText(s)}${s.signedAt ? " · " + fmtDate(s.signedAt) : ""}</div>
    </div>
    <div class="actions">${actions}</div>
  </div>`;
}

function renderContract(c) {
  const total = c.signersTotal || (c.signers ? c.signers.length : 0);
  const signed = c.signersSigned ?? (c.signers ? c.signers.filter((s) => s.status === "signed").length : 0);
  const pct = total ? Math.round((signed / total) * 100) : 0;
  const signers = (c.signers || []).map((s) => renderSigner(c, s)).join("");
  const canSend = c.status === "draft";
  return `<div class="card contract-row" data-id="${c.id}">
    <div class="contract-top">
      <div>
        <p class="contract-title">${esc(c.title)}</p>
        <div class="contract-meta">${esc(c.fileName)} · ${fmtSize(c.fileSize)} · создан ${fmtDate(c.createdAt)}</div>
      </div>
      <span class="badge ${c.status}">${STATUS_LABEL[c.status] || c.status}</span>
    </div>
    <div class="progress">
      <div class="bar"><i style="width:${pct}%"></i></div>
      <span>${signed} из ${total} подписали</span>
      <span style="flex:1"></span>
      <button class="btn sm" data-act="download" data-id="${c.id}">Скачать оригинал</button>
      ${canSend ? `<button class="btn sm" data-act="send" data-id="${c.id}">Отправить</button>` : ""}
      <button class="btn sm danger" data-act="delete" data-id="${c.id}">Удалить</button>
    </div>
    <div class="signers">${signers}</div>
  </div>`;
}

async function loadList() {
  try {
    const res = await listContracts();
    contractsCache = res.contracts || [];
    if (!contractsCache.length) {
      listEl.innerHTML = `<div class="empty">Пока нет договоров. Нажмите «Новый договор», чтобы загрузить первый.</div>`;
      return;
    }
    listEl.innerHTML = contractsCache.map(renderContract).join("");
  } catch (e) {
    listEl.innerHTML = `<div class="empty">Ошибка загрузки: ${esc(e.message || e)}</div>`;
  }
}

// ---- Create modal ----
const overlay = $("#create-overlay");
const signersInputs = $("#signers-inputs");

function addSignerInput(value = {}) {
  const row = document.createElement("div");
  row.className = "signer-input-row";
  row.innerHTML = `
    <input placeholder="ФИО сотрудника" data-f="fullName" value="${esc(value.fullName || "")}">
    <input placeholder="ИИН (12 цифр)" data-f="iin" maxlength="12" value="${esc(value.iin || "")}">
    <input placeholder="WhatsApp / e-mail" data-f="contact" value="${esc(value.contact || "")}">
    <button class="rm" type="button" title="Убрать">×</button>`;
  row.querySelector(".rm").addEventListener("click", () => row.remove());
  signersInputs.appendChild(row);
}

function openCreate() {
  $("#c-title").value = "";
  $("#c-note").value = "";
  $("#dz-name").textContent = "";
  pendingFile = null;
  signersInputs.innerHTML = "";
  addSignerInput();
  overlay.classList.add("open");
}
function closeCreate() { overlay.classList.remove("open"); }

function collectSigners() {
  return [...signersInputs.querySelectorAll(".signer-input-row")].map((row) => {
    const get = (f) => row.querySelector(`[data-f="${f}"]`).value.trim();
    return { fullName: get("fullName"), iin: get("iin"), contact: get("contact") };
  }).filter((s) => s.fullName);
}

async function submitCreate() {
  const title = $("#c-title").value.trim();
  const note = $("#c-note").value.trim();
  const signers = collectSigners();
  if (!title) return toast("Укажите название", true);
  if (!pendingFile) return toast("Выберите файл договора", true);
  if (!signers.length) return toast("Добавьте хотя бы одного сотрудника", true);

  const btn = $("#create-save");
  btn.disabled = true; btn.textContent = "Загрузка…";
  try {
    const fileBase64 = await fileToBase64(pendingFile);
    await createContract({
      title, note,
      fileName: pendingFile.name,
      fileMime: pendingFile.type || "application/octet-stream",
      fileBase64,
      signers,
    });
    closeCreate();
    toast("Договор создан");
    await loadList();
  } catch (e) {
    toast(e.message || "Не удалось создать", true);
  } finally {
    btn.disabled = false; btn.textContent = "Создать договор";
  }
}

// ---- Actions ----
async function doSignOwner(id) {
  const blob = await fetchContractFileBlob(id);
  const base64 = await blobToBase64(blob);
  toast("Откройте NCALayer и выберите ключ ЭЦП…");
  const { cms, signer } = await signBase64(base64);
  await signOwner(id, { cmsBase64: cms, signer });
  toast("Вы подписали договор");
  await loadList();
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || "").replace(/^data:[^,]*,/, ""));
    r.onerror = () => reject(new Error("Не удалось прочитать файл"));
    r.readAsDataURL(blob);
  });
}

async function doDownload(id) {
  const c = contractsCache.find((x) => x.id === id);
  const blob = await fetchContractFileBlob(id);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = c?.fileName || "contract";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

listEl.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const act = btn.dataset.act;
  const id = btn.dataset.id;
  try {
    if (act === "copy") {
      await navigator.clipboard.writeText(btn.dataset.link);
      toast("Ссылка скопирована");
    } else if (act === "download") {
      await doDownload(id);
    } else if (act === "send") {
      await sendContract(id);
      toast("Договор переведён в статус «На подписании»");
      await loadList();
    } else if (act === "delete") {
      if (!confirm("Удалить договор и все подписи безвозвратно?")) return;
      await deleteContract(id);
      toast("Договор удалён");
      await loadList();
    } else if (act === "sign-owner") {
      btn.disabled = true;
      await doSignOwner(id);
    }
  } catch (err) {
    const msg = err instanceof NcaLayerError ? err.message : (err.message || String(err));
    toast(msg, true);
    btn.disabled = false;
  }
});

// ---- Dropzone wiring ----
const dz = $("#dropzone");
const fileInput = $("#c-file");
function setFile(f) {
  if (!f) return;
  pendingFile = f;
  $("#dz-name").textContent = `${f.name} · ${fmtSize(f.size)}`;
  if (!$("#c-title").value.trim()) $("#c-title").value = f.name.replace(/\.[^.]+$/, "");
}
dz.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => setFile(fileInput.files[0]));
["dragover", "dragenter"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("drag"); }));
["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, () => dz.classList.remove("drag")));
dz.addEventListener("drop", (e) => { e.preventDefault(); setFile(e.dataTransfer.files[0]); });

$("#btn-new").addEventListener("click", openCreate);
$("#create-cancel").addEventListener("click", closeCreate);
$("#create-save").addEventListener("click", submitCreate);
$("#add-signer-input").addEventListener("click", () => addSignerInput());
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeCreate(); });

refreshNcaBadge();
loadList();
