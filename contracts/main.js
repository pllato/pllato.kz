import { requireSession } from "../pllato-kz-shared/pllato-api.js";
import {
  listContracts, createContract, signOwner, sendContract, deleteContract, addSigners, setContractMode,
  fetchContractFileBlob, fetchSignatureBlob, fileToBase64, signLinkForToken, signLinkForContract,
} from "./api.js";
import { signBase64, pingNcaLayer, NcaLayerError } from "./ncalayer.js?v=20260722-2";

const session = requireSession({ redirectTo: "login.html" });

// ---- Доступ к реестру — только владельцу лично ----
// Реестр договоров содержит персональные данные подписантов и ЭЦП-материал,
// поэтому открыт только владельцу студии. Проверка по e-mail Google-сессии
// (вход в этот аккаунт уже защищён паролем и 2FA Google — это и есть
// «подтверждение через вашу почту»). Дополнительно — код на почту (см. ниже).
const OWNER_EMAILS = ["uurraa@gmail.com"];
function isOwner(s) {
  const email = String(s?.user?.email || "").trim().toLowerCase();
  return OWNER_EMAILS.includes(email);
}
function denyAccess(reason) {
  document.body.innerHTML =
    '<div style="max-width:520px;margin:14vh auto;padding:0 22px;font-family:Inter,system-ui,sans-serif;text-align:center;color:#1c2433">' +
      '<div style="font-size:44px;line-height:1;margin-bottom:18px">🔒</div>' +
      '<h1 style="font-size:22px;font-weight:800;margin:0 0 10px">Доступ только владельцу</h1>' +
      '<p style="font-size:14px;color:#5a6472;line-height:1.6;margin:0 0 22px">Реестр договоров с ЭЦП доступен только владельцу студии. ' +
      (reason ? reason + ' ' : '') +
      'Если это ваш реестр — войдите под своим аккаунтом-владельцем.</p>' +
      '<a href="app.html" style="display:inline-block;background:#1c2433;color:#fff;text-decoration:none;padding:11px 22px;border-radius:10px;font-weight:700;font-size:14px">← В портал</a>' +
    '</div>';
  throw new Error("forbidden: " + (reason || "not owner"));
}
if (!session) { throw new Error("no session"); }
if (!isOwner(session)) { denyAccess("Ваш аккаунт (" + (session.user?.email || "—") + ") не является владельцем."); }

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

function renderRequisites(s) {
  const r = s.requisites?.data;
  if (!r || !Object.keys(r).length) return "";
  const typeLabel = (s.signerType || s.requisites?.type) === "ip" ? "ИП" : (s.signerType || s.requisites?.type) === "individual" ? "Физлицо" : "";
  const rows = [
    ["Тип", typeLabel],
    ["Наименование/ФИО", r.name],
    ["ИИН/БИН", r.iinBin],
    ["Уд. №", r.idNumber && (r.idNumber + (r.idDate ? " от " + r.idDate : ""))],
    ["Адрес", r.address],
    ["Контакт", r.contact],
    ["Банк", r.bank],
    ["IBAN", r.iban],
  ].filter(([, v]) => v);
  return `<div class="requisites">${rows.map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join("")}</div>`;
}

function renderSigner(contract, s) {
  const isOwner = s.role === "owner";
  let actions = "";
  if (s.status === "signed") {
    actions = `<button class="btn sm" data-act="dl-sig" data-id="${contract.id}" data-sid="${s.id}">Скачать подпись</button>`;
  } else if (s.status === "pending") {
    if (isOwner) {
      actions = `<button class="btn bronze sm" data-act="sign-owner" data-id="${contract.id}">Подписать ЭЦП (компания)</button>`;
    } else {
      const link = s.token ? signLinkForToken(s.token) : "";
      actions = `<div class="link-box"><input readonly value="${esc(link)}"><button class="btn sm" data-act="copy" data-link="${esc(link)}">Копировать</button></div>`;
    }
  }
  return `<div class="signer">
    <div class="signer-main">
      <div class="who">${esc(s.fullName)} <span class="role-tag">${isOwner ? "компания" : "подписант"}</span></div>
      <div class="sub">${s.iin ? "ИИН " + esc(s.iin) + " · " : ""}${signerStatusText(s)}${s.signedAt ? " · " + fmtDate(s.signedAt) : ""}</div>
      ${renderRequisites(s)}
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
  const mode = c.linkMode === "named" ? "named" : "universal";
  const linkBtn = mode === "named"
    ? `<button class="btn sm bronze" data-act="add-named" data-id="${c.id}">+ Подписант</button>`
    : (c.publicToken ? `<button class="btn sm bronze" data-act="copy" data-link="${esc(signLinkForContract(c.publicToken))}">Ссылка для подписантов</button>` : "");
  return `<div class="card contract-row" data-id="${c.id}">
    <div class="contract-top">
      <div>
        <p class="contract-title">${esc(c.title)}</p>
        <div class="contract-meta">${esc(c.fileName)} · ${fmtSize(c.fileSize)} · создан ${fmtDate(c.createdAt)}</div>
      </div>
      <span class="badge ${c.status}">${STATUS_LABEL[c.status] || c.status}</span>
    </div>
    <div class="mode-row">
      <span class="mode-label">Режим:</span>
      <button class="mode-btn ${mode === "universal" ? "on" : ""}" data-act="set-mode" data-id="${c.id}" data-mode="universal">Общая ссылка</button>
      <button class="mode-btn ${mode === "named" ? "on" : ""}" data-act="set-mode" data-id="${c.id}" data-mode="named">Именные ссылки</button>
      <span class="mode-hint">${mode === "named" ? "по ссылке на каждого подписанта отдельно" : "одна ссылка на всех — каждый заводит себя сам"}</span>
    </div>
    <div class="progress">
      <div class="bar"><i style="width:${pct}%"></i></div>
      <span>${signed} из ${total} подписали</span>
      <span style="flex:1"></span>
      <button class="btn sm" data-act="download" data-id="${c.id}">Скачать оригинал</button>
      ${linkBtn}
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

function openCreate() {
  $("#c-title").value = "";
  $("#c-note").value = "";
  $("#dz-name").textContent = "";
  pendingFile = null;
  overlay.classList.add("open");
}
function closeCreate() { overlay.classList.remove("open"); }

async function submitCreate() {
  const title = $("#c-title").value.trim();
  const note = $("#c-note").value.trim();
  if (!title) return toast("Укажите название", true);
  if (!pendingFile) return toast("Выберите файл договора", true);

  const btn = $("#create-save");
  btn.disabled = true; btn.textContent = "Загрузка…";
  try {
    const fileBase64 = await fileToBase64(pendingFile);
    await createContract({
      title, note,
      fileName: pendingFile.name,
      fileMime: pendingFile.type || "application/octet-stream",
      fileBase64,
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
  const { cms, signer, tsp } = await signBase64(base64);
  await signOwner(id, { cmsBase64: cms, signer, tsp });
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

async function doDownloadSignature(contractId, signerId) {
  const blob = await fetchSignatureBlob(contractId, signerId);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `signature_${signerId}.p7s`;
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
    } else if (act === "dl-sig") {
      await doDownloadSignature(id, btn.dataset.sid);
    } else if (act === "set-mode") {
      await setContractMode(id, btn.dataset.mode);
      await loadList();
    } else if (act === "add-named") {
      const name = prompt("ФИО подписанта (для подписи именной ссылкой):", "");
      if (!name || !name.trim()) return;
      await addSigners(id, [{ fullName: name.trim() }]);
      toast("Именная ссылка создана — скопируйте её у подписанта ниже");
      await loadList();
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
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeCreate(); });

refreshNcaBadge();
loadList();
