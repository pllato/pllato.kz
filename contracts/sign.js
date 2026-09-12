// Публичная страница подписания договора по персональной ссылке (без логина).
import { signBase64, pingNcaLayer, NcaLayerError } from "./ncalayer.js?v=20260722-2";

const $ = (s) => document.querySelector(s);
const root = $("#root");
const toastEl = $("#toast");

function apiBase() {
  return String(window.PLLATO_API_BASE || "").trim().replace(/\/+$/, "");
}

const params = new URLSearchParams(location.search);
const token = params.get("t") || "";
const ctoken = params.get("c") || "";
const vtoken = params.get("v") || "";        // постоянная ссылка-просмотр (read-only)
const universal = !!ctoken;
const viewMode = !!vtoken;

// Базовый путь API: общая ссылка договора (?c=) или персональная (?t=).
function signApi(suffix = "") {
  return universal
    ? `${apiBase()}/api/sign/c/${encodeURIComponent(ctoken)}${suffix}`
    : `${apiBase()}/api/sign/${encodeURIComponent(token)}${suffix}`;
}
// Read-only просмотр статуса договора по постоянной ссылке (?v=).
function viewApi(suffix = "") {
  return `${apiBase()}/api/view/${encodeURIComponent(vtoken)}${suffix}`;
}
// Активный базовый путь: в режиме просмотра — /api/view, иначе — подписание.
function baseApi(suffix = "") {
  return viewMode ? viewApi(suffix) : signApi(suffix);
}

function toast(msg, isErr = false) {
  toastEl.textContent = msg;
  toastEl.className = "toast show" + (isErr ? " err" : "");
  setTimeout(() => { toastEl.className = "toast"; }, 3400);
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function fmtSize(n) {
  if (!n) return "";
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + " КБ";
  return (n / 1024 / 1024).toFixed(1) + " МБ";
}
function fmtDate(ms) {
  if (!ms) return "";
  return new Date(ms).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

async function apiGet() {
  const res = await fetch(baseApi());
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || `Ошибка ${res.status}`);
  return data;
}

// Блок «кто подписал» — общий для формы, экрана «подписано» и режима просмотра.
function partyChip(p) {
  if (p.status === "signed") return `<span class="s-status signed">✓ подписал${p.signerCn ? " · " + esc(p.signerCn) : ""}${p.signedAt ? " · " + fmtDate(p.signedAt) : ""}</span>`;
  if (p.status === "declined") return `<span class="s-status declined">✕ отклонил${p.declineReason ? " · " + esc(p.declineReason) : ""}</span>`;
  return `<span class="s-status pending">⏳ ожидает</span>`;
}
function partiesBlock(parties, title = "Кто подписал") {
  const list = Array.isArray(parties) ? parties : [];
  if (!list.length) return "";
  const signed = list.filter((p) => p.status === "signed").length;
  const rows = list.map((p) => `<div class="party">
      <div class="party-who">${esc(p.fullName || "—")} <span class="role-tag">${p.role === "owner" ? "компания" : "подписант"}</span></div>
      ${partyChip(p)}
    </div>`).join("");
  return `<div class="parties card">
      <div class="parties-h">${esc(title)} <span class="parties-count">${signed} из ${list.length}</span></div>
      ${rows}
    </div>`;
}

async function apiPost(body) {
  const res = await fetch(signApi(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || `Ошибка ${res.status}`);
  return data;
}

async function fileBlobUrl() {
  const res = await fetch(baseApi("/file"));
  if (!res.ok) throw new Error(`Не удалось загрузить файл (${res.status})`);
  const blob = await res.blob();
  return { url: URL.createObjectURL(blob), mime: blob.type, blob };
}

async function refreshNcaBadge() {
  const ok = await pingNcaLayer();
  $("#nca-badge").className = "nca-badge " + (ok ? "ok" : "bad");
  $("#nca-text").textContent = ok ? "NCALayer подключён" : "NCALayer не найден";
}

let currentBlob = null;
let currentFileInfo = null;

function renderDone(signer, contract, parties) {
  const fileInfo = currentFileInfo;
  if (signer.status === "signed") {
    const isPdf = contract && ((contract.fileMime || "").includes("pdf") || /\.pdf$/i.test(contract.fileName || ""));
    const preview = fileInfo && isPdf
      ? `<iframe class="doc-frame" src="${fileInfo.url}" style="margin-top:18px"></iframe>`
      : "";
    root.innerHTML = `<div class="result-box ok">
      <div style="font-size:40px">✓</div>
      <div>Договор подписан вашей ЭЦП${signer.signerCn ? "<br><b>" + esc(signer.signerCn) + "</b>" : ""}</div>
      <div class="muted" style="margin-top:8px">${fmtDate(signer.signedAt)}</div>
    </div>
    ${contract ? `<h2 style="font-size:20px;margin:24px 0 4px">${esc(contract.title)}</h2>` : ""}
    ${contract ? `<div class="summary"><div><span>Файл</span><b>${esc(contract.fileName)} · ${fmtSize(contract.fileSize)}</b></div></div>` : ""}
    ${partiesBlock(parties, "Кто подписал")}
    ${preview}
    <div class="sign-actions" style="margin-top:18px">
      <button class="btn bronze" id="btn-dl-done"${fileInfo ? "" : " disabled"}>Скачать договор</button>
    </div>`;
    const b = $("#btn-dl-done");
    if (b && fileInfo) {
      b.addEventListener("click", () => {
        const a = document.createElement("a");
        a.href = fileInfo.url;
        a.download = (contract && contract.fileName) || "contract";
        document.body.appendChild(a); a.click(); a.remove();
      });
    }
  } else {
    root.innerHTML = `<div class="result-box declined">
      <div style="font-size:40px">✕</div>
      <div>Вы отклонили подписание${signer.declineReason ? "<br><span class='muted'>" + esc(signer.declineReason) + "</span>" : ""}</div>
    </div>`;
  }
}

async function render(data) {
  const { contract, signer } = data;

  let fileInfo;
  try { fileInfo = await fileBlobUrl(); currentBlob = fileInfo.blob; currentFileInfo = fileInfo; }
  catch (e) { fileInfo = null; }

  if (!universal && (signer.status === "signed" || signer.status === "declined")) {
    renderDone(signer, contract, data.parties);
    return;
  }

  const isPdf = (contract.fileMime || "").includes("pdf") || /\.pdf$/i.test(contract.fileName);
  const preview = fileInfo && isPdf
    ? `<iframe class="doc-frame" src="${fileInfo.url}"></iframe>`
    : `<div class="card doc-fallback">
         <p>Предпросмотр недоступен для этого формата.</p>
         <button class="btn" id="dl">Скачать файл «${esc(contract.fileName)}»</button>
       </div>`;

  const r = signer.requisites?.data || {};
  const type = signer.signerType || signer.requisites?.type || "";
  const val = (k) => esc(r[k] || "");

  const partiesHtml = partiesBlock(data.parties, "Кто уже подписал");

  root.innerHTML = `
    <h1 style="font-size:24px;margin:6px 0 4px">${esc(contract.title)}</h1>
    <div class="summary">
      ${signer.fullName ? `<div><span>Подписант</span><b>${esc(signer.fullName)}</b></div>` : ""}
      ${signer.iin ? `<div><span>ИИН</span><b>${esc(signer.iin)}</b></div>` : ""}
      <div><span>Файл</span><b>${esc(contract.fileName)} · ${fmtSize(contract.fileSize)}</b></div>
    </div>
    ${partiesHtml}
    ${contract.note ? `<div class="hint" style="margin-bottom:16px">${esc(contract.note)}</div>` : ""}
    ${preview}

    <div class="req-form" id="req-form">
      <h2 class="req-title">Шаг 1. Ваши реквизиты</h2>
      <p class="req-sub">Заполните данные, как вы будете указаны в договоре, затем переходите к подписанию.</p>
      <div class="seg" id="type-seg">
        <button type="button" class="seg-btn ${type === "ip" ? "on" : ""}" data-type="ip">Индивидуальный предприниматель</button>
        <button type="button" class="seg-btn ${type === "individual" ? "on" : ""}" data-type="individual">Физическое лицо</button>
      </div>
      <div class="req-grid">
        <label class="fld"><span id="lbl-name">Наименование / ФИО</span><input data-f="name" value="${val("name")}"></label>
        <label class="fld"><span id="lbl-iin">ИИН / БИН</span><input data-f="iinBin" maxlength="12" value="${val("iinBin")}"></label>
        <label class="fld indiv-only"><span>Уд. личности №</span><input data-f="idNumber" value="${val("idNumber")}"></label>
        <label class="fld indiv-only"><span>Дата выдачи</span><input data-f="idDate" placeholder="дд.мм.гггг" value="${val("idDate")}"></label>
        <label class="fld"><span id="lbl-address">Адрес жительства (прописки)</span><input data-f="address" placeholder="город, улица, дом, кв." value="${val("address")}"></label>
        <label class="fld"><span>Контакт (тел./e-mail)</span><input data-f="contact" value="${val("contact")}"></label>
        <label class="fld"><span>Банк</span><input data-f="bank" value="${val("bank")}"></label>
        <label class="fld"><span>IBAN счёт</span><input data-f="iban" value="${val("iban")}"></label>
      </div>
    </div>

    <div class="hint" style="margin-top:18px">
      <b>Шаг 2.</b> Для подписания нужен <a href="https://pki.gov.kz/" target="_blank" rel="noopener">NCALayer</a> и ваш ключ ЭЦП.
      Запустите NCALayer, затем нажмите «Подписать ЭЦП» и выберите ключ.
    </div>
    <div class="sign-actions">
      <button class="btn bronze" id="btn-sign">Подписать ЭЦП</button>
      <button class="btn" id="btn-download">Скачать договор</button>
      ${universal ? "" : `<button class="btn danger" id="btn-decline">Отказаться</button>`}
    </div>`;

  const formEl = $("#req-form");
  function applyType(t) {
    formEl.dataset.type = t;
    [...$("#type-seg").querySelectorAll(".seg-btn")].forEach((b) => b.classList.toggle("on", b.dataset.type === t));
    $("#lbl-name").textContent = t === "ip" ? "Наименование ИП" : "ФИО";
    $("#lbl-iin").textContent = t === "ip" ? "БИН / ИИН" : "ИИН";
    const la = $("#lbl-address");
    if (la) la.textContent = t === "ip" ? "Юридический адрес" : "Адрес жительства (прописки)";
    formEl.classList.toggle("is-ip", t === "ip");
  }
  $("#type-seg").addEventListener("click", (e) => {
    const b = e.target.closest(".seg-btn");
    if (b) applyType(b.dataset.type);
  });
  if (type) applyType(type);

  const dl = $("#dl");
  if (dl) dl.addEventListener("click", downloadFile);
  $("#btn-download").addEventListener("click", downloadFile);
  const declineBtn = $("#btn-decline");
  if (declineBtn) declineBtn.addEventListener("click", () => onDecline());
  $("#btn-sign").addEventListener("click", () => onSign(contract));

  function downloadFile() {
    if (!fileInfo) return toast("Файл недоступен", true);
    const a = document.createElement("a");
    a.href = fileInfo.url; a.download = contract.fileName || "contract";
    document.body.appendChild(a); a.click(); a.remove();
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || "").replace(/^data:[^,]*,/, ""));
    r.onerror = () => reject(new Error("Не удалось прочитать файл"));
    r.readAsDataURL(blob);
  });
}

function collectRequisites() {
  const form = $("#req-form");
  if (!form) return { signerType: "", requisites: { data: {} } };
  const signerType = form.dataset.type || "";
  const data = {};
  form.querySelectorAll("[data-f]").forEach((el) => {
    const v = el.value.trim();
    if (v) data[el.dataset.f] = v;
  });
  if (!signerType) throw new Error("Выберите тип: ИП или физическое лицо");
  if (!data.name) throw new Error("Укажите наименование / ФИО");
  if (!data.iinBin) throw new Error("Укажите ИИН / БИН");
  if (!data.address) throw new Error(signerType === "ip" ? "Укажите юридический адрес" : "Укажите адрес жительства");
  return { signerType, requisites: { data } };
}

async function onSign(contract) {
  const btn = $("#btn-sign");
  let reqs;
  try { reqs = collectRequisites(); }
  catch (e) { return toast(e.message, true); }
  btn.disabled = true; btn.textContent = "Подключаюсь к NCALayer…";
  try {
    if (!currentBlob) {
      const f = await fileBlobUrl(); currentBlob = f.blob;
    }
    const base64 = await blobToBase64(currentBlob);
    toast("Выберите ключ ЭЦП в окне NCALayer…");
    const { cms, signer, tsp } = await signBase64(base64);
    btn.textContent = "Сохраняю подпись…";
    const res = await apiPost({ cmsBase64: cms, signer, tsp, signerType: reqs.signerType, requisites: reqs.requisites });
    let parties;
    try { parties = (await apiGet()).parties; } catch (_) { /* список подтянем позже */ }
    renderDone(res.signer, contract, parties);
  } catch (e) {
    const msg = e instanceof NcaLayerError ? e.message : (e.message || String(e));
    toast(msg, true);
    btn.disabled = false; btn.textContent = "Подписать ЭЦП";
  }
}

async function onDecline() {
  const reason = prompt("Причина отказа (необязательно):", "");
  if (reason === null) return;
  try {
    const res = await apiPost({ decline: true, reason });
    renderDone(res.signer);
  } catch (e) {
    toast(e.message || "Не удалось отправить отказ", true);
  }
}

// Read-only просмотр статуса по постоянной ссылке: документ + кто подписал. Подписать нельзя.
async function renderView(data) {
  const nca = $("#nca-badge");
  if (nca) nca.style.display = "none";
  const { contract } = data;

  let fileInfo;
  try { fileInfo = await fileBlobUrl(); currentFileInfo = fileInfo; }
  catch (e) { fileInfo = null; }

  const isPdf = (contract.fileMime || "").includes("pdf") || /\.pdf$/i.test(contract.fileName || "");
  const preview = fileInfo && isPdf
    ? `<iframe class="doc-frame" src="${fileInfo.url}" style="margin-top:14px"></iframe>`
    : "";

  root.innerHTML = `
    <div class="view-tag">👁 Просмотр статуса · только чтение</div>
    <h1 style="font-size:24px;margin:6px 0 4px">${esc(contract.title)}</h1>
    <div class="summary">
      <div><span>Файл</span><b>${esc(contract.fileName)} · ${fmtSize(contract.fileSize)}</b></div>
      <div><span>Подписей</span><b>${data.signedCount || 0} из ${data.total || 0}</b></div>
    </div>
    ${contract.note ? `<div class="hint" style="margin-bottom:14px">${esc(contract.note)}</div>` : ""}
    ${partiesBlock(data.parties, "Кто подписал")}
    ${preview}
    <div class="sign-actions" style="margin-top:16px">
      <button class="btn bronze" id="btn-view-dl"${fileInfo ? "" : " disabled"}>Скачать договор</button>
    </div>`;

  const b = $("#btn-view-dl");
  if (b && fileInfo) {
    b.addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = fileInfo.url;
      a.download = contract.fileName || "contract";
      document.body.appendChild(a); a.click(); a.remove();
    });
  }
}

async function init() {
  if (viewMode) {
    try {
      const data = await apiGet();
      await renderView(data);
    } catch (e) {
      const nca = $("#nca-badge");
      if (nca) nca.style.display = "none";
      root.innerHTML = `<div class="empty">${esc(e.message || "Ссылка недействительна или истекла")}</div>`;
    }
    return;
  }
  refreshNcaBadge();
  if (!token && !ctoken) {
    root.innerHTML = `<div class="empty">Ссылка недействительна — отсутствует токен.</div>`;
    return;
  }
  try {
    const data = await apiGet();
    await render(data);
  } catch (e) {
    root.innerHTML = `<div class="empty">${esc(e.message || "Ссылка недействительна или истекла")}</div>`;
  }
}

init();
