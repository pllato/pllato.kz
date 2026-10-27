import {initOtp,readSigningIdentity} from './otp.js?v=20261027-1';
import { visibleParticipants, participantTypeLabel, signatureCountLabel } from './participants.js?v=20261003-4';
import { signWithEgov, pendingEgov, clearEgov } from './egov.js?v=20261027-recovery';
// Публичная страница договора (без логина).
// ЕДИНАЯ ссылка на договор: по ней видно документ и кто уже подписал,
// и по ней же подписывают. Старые ссылки-просмотры (?v=) ведут сюда же.
import { signBase64, pingNcaLayer, NcaLayerError } from "./ncalayer.js?v=20261003-1";

const $ = (s) => document.querySelector(s);
const root = $("#root");
const toastEl = $("#toast");

function apiBase() {
  return String(window.PLLATO_API_BASE || "").trim().replace(/\/+$/, "");
}

const params = new URLSearchParams(location.search);
const token = params.get("t") || "";
// ?c= — единая ссылка договора. ?v= — то же самое: старые разосланные
// ссылки-просмотры продолжают работать и теперь тоже дают подписать.
const ctoken = params.get("c") || params.get("v") || "";
const universal = !!ctoken;
// Включается, только если сервер не разрешает подписание по этой ссылке
// (например, договор уже подписан всеми или отменён) — тогда показываем статус.
let readOnly = false;

// Базовый путь API: единая ссылка договора (?c=) или персональная (?t=).
function signApi(suffix = "") {
  return universal
    ? `${apiBase()}/api/sign/c/${encodeURIComponent(ctoken)}${suffix}`
    : `${apiBase()}/api/sign/${encodeURIComponent(token)}${suffix}`;
}
// Резервный путь — только чтение статуса договора по тому же токену.
function viewApi(suffix = "") {
  return `${apiBase()}/api/view/${encodeURIComponent(ctoken)}${suffix}`;
}
// Активный базовый путь.
function baseApi(suffix = "") {
  return readOnly ? viewApi(suffix) : signApi(suffix);
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

// Загрузка по единой ссылке: сначала пробуем режим подписания и, только если
// сервер его не даёт (договор закрыт/отменён), показываем статус без подписи.
async function loadContract() {
  try {
    return await apiGet();
  } catch (e) {
    if (!universal) throw e;
    readOnly = true;
    try {
      return await apiGet();
    } catch (_) {
      readOnly = false;
      throw e;
    }
  }
}

// Блок «кто подписал» — общий для формы, экрана «подписано» и режима просмотра.
// Показываем не только факт подписи, но и чьей именно ЭЦП она поставлена:
// ФИО или организация из сертификата, ИИН/БИН, время и метка времени НУЦ.
// Рядом — кнопка скачивания самой подписи: статус можно проверить, а не верить.
function partyChip(p) {
  if (p.status === "signed") return `<span class="s-status signed">✓ подписал${p.signedAt ? " · " + fmtDate(p.signedAt) : ""}</span>`;
  if (p.status === "declined") return `<span class="s-status declined">✕ отклонил${p.declineReason ? " · " + esc(p.declineReason) : ""}</span>`;
  return `<span class="s-status pending">⏳ ожидает</span>`;
}

function partyCert(p) {
  if (p.status !== "signed") return "";
  if (p.signatureMethod === 'whatsapp_otp') return `<div class="party-cert"><div><span>Способ подтверждения</span><b>Код WhatsApp</b></div><div><span>Телефон</span><b>${esc(p.phoneMasked || 'подтверждён')}</b></div></div>`;
  const rows = [
    ["Подписано ЭЦП", p.signerCn || "—"],
    ["ИИН / БИН в сертификате", p.signerIinMasked || "—"],
    ["Время подписания", p.signedAt ? fmtDate(p.signedAt) : "—"],
    ["Метка времени НУЦ РК", p.tsp ? "есть (CAdES-T)" : "нет (CAdES-BES)"],
  ];
  const dl = p.hasSignature && p.id
    ? `<button class="btn sm" data-act="dl-sig" data-sid="${esc(p.id)}" data-who="${esc(p.signerCn || p.fullName || "signer")}">Скачать подпись (.p7s)</button>`
    : "";
  return `<div class="party-cert">
      ${rows.map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("")}
      ${dl ? `<div class="party-cert-act">${dl}</div>` : ""}
    </div>`;
}
function partiesBlock(parties, title = "Кто подписал") {
  const list = visibleParticipants(parties, universal);
  if (!list.length) return "";
  const rows = list.map((p) => `<div class="party${p.status === "signed" ? " is-signed" : ""}">
      <div class="party-row">
        <div class="party-who">${esc(p.fullName || p.signerCn || (p.role === "owner" ? "Компания" : "Вторая сторона"))} <span class="role-tag">${esc(participantTypeLabel(p))}</span></div>
        ${partyChip(p)}
      </div>
      ${partyCert(p)}
    </div>`).join("");
  const anySig = list.some((p) => p.status === "signed" && p.hasSignature);
  return `<div class="parties card">
      <div class="parties-h">${esc(title)} <span class="parties-count">${signatureCountLabel(parties, universal)}</span></div>
      ${rows}
      ${anySig ? `<div class="parties-note">Подпись — отдельный файл <b>.p7s</b> к этому же документу. Скачайте договор и подпись и проверьте их в любом сервисе проверки ЭЦП или в NCALayer: там будут видны сертификат подписанта, издатель (НУЦ РК) и точное время.</div>` : ""}
    </div>`;
}

// Скачивание подписи по той же публичной ссылке, что и сам договор.
async function downloadSignature(signerId, who) {
  try {
    const res = await fetch(baseApi(`/signature/${encodeURIComponent(signerId)}`));
    if (!res.ok) throw new Error(`Не удалось загрузить подпись (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `podpis_${String(who || "signer").replace(/[^a-zA-Zа-яА-Я0-9._-]+/g, "_").slice(0, 40)}.p7s`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast("Подпись скачана");
  } catch (e) {
    toast(e.message || "Не удалось скачать подпись", true);
  }
}
root.addEventListener("click", (e) => {
  const b = e.target.closest('[data-act="dl-sig"]');
  if (!b) return;
  e.preventDefault();
  downloadSignature(b.dataset.sid, b.dataset.who);
});

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
  if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
    $("#nca-text").textContent = "Подписание через eGov"; return;
  }
  const ok = await pingNcaLayer();
  $("#nca-badge").className = "nca-badge " + (ok ? "ok" : "bad");
  $("#nca-text").textContent = ok ? "NCALayer подключён" : "Для телефона — eGov Mobile";
}

let currentBlob = null;
let currentFileInfo = null;
let savedSignerDetails = { signerType: "", requisites: { data: {} } };

function renderDone(signer, contract, parties) {
  const fileInfo = currentFileInfo;
  if (signer.status === "signed") {
    const isPdf = contract && ((contract.fileMime || "").includes("pdf") || /\.pdf$/i.test(contract.fileName || ""));
    const preview = fileInfo && isPdf
      ? `<iframe class="doc-frame" src="${fileInfo.url}" style="margin-top:18px"></iframe>`
      : "";
    root.innerHTML = `<div class="result-box ok">
      <div style="font-size:40px">✓</div>
      <div>${signer.signatureMethod === "whatsapp_otp" ? "Согласие с договором подтверждено кодом WhatsApp" : "Договор подписан вашей ЭЦП"}${signer.signerCn ? "<br><b>" + esc(signer.signerCn) + "</b>" : ""}</div>
      <div class="muted" style="margin-top:8px">${fmtDate(signer.signedAt)}</div>
    </div>
    ${contract ? `<h2 style="font-size:20px;margin:24px 0 4px">${esc(contract.title)}</h2>` : ""}
    ${contract ? `<div class="summary"><div><span>Файл</span><b>${esc(contract.fileName)} · ${fmtSize(contract.fileSize)}</b></div>
      ${contract.fileHash ? `<div><span>SHA-256 документа</span><b class="hash">${esc(contract.fileHash)}</b></div>` : ""}</div>` : ""}
    ${partiesBlock(parties, "Кто подписал")}
    ${universal ? `<div class="hint one-link">🔗 Ссылка та же — сохраните её: по ней в любой момент видно статус договора. Если с этого устройства должен подписать ещё один участник — нажмите «Другой подписант».</div>` : ""}
    ${preview}
    <div class="sign-actions" style="margin-top:18px">
      <button class="btn bronze" id="btn-dl-done"${fileInfo ? "" : " disabled"}>Скачать договор</button>
      ${universal ? `<button class="btn" id="btn-again">Другой подписант</button>` : ""}
    </div>`;
    const again = $("#btn-again");
    if (again) again.addEventListener("click", () => location.reload());
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

  // Старые реквизиты сохраняем, но не просим клиента вводить их повторно.
  savedSignerDetails = {
    signerType: signer.signerType || signer.requisites?.type || "",
    requisites: { ...(signer.requisites || {}), data: { ...(signer.requisites?.data || {}) } },
  };
  const name = signer.fullName || signer.requisites?.data?.name || "";

  const partiesHtml = partiesBlock(data.parties, "Кто уже подписал");

  root.innerHTML = `
    <h1 style="font-size:24px;margin:6px 0 4px">${esc(contract.title)}</h1>
    <div class="summary">
      ${signer.fullName ? `<div><span>Подписант</span><b>${esc(signer.fullName)}</b></div>` : ""}
      ${signer.iin ? `<div><span>ИИН</span><b>${esc(signer.iin)}</b></div>` : ""}
      <div><span>Файл</span><b>${esc(contract.fileName)} · ${fmtSize(contract.fileSize)}</b></div>
      ${contract.fileHash ? `<div><span>SHA-256 документа</span><b class="hash">${esc(contract.fileHash)}</b></div>` : ""}
    </div>
    ${partiesHtml}
    ${universal ? `<div class="hint one-link">По этой ссылке доступны договор, способы подписания и подтверждения участников.</div>` : ""}
    ${contract.note ? `<div class="hint" style="margin-bottom:16px">${esc(contract.note)}</div>` : ""}
    ${preview}

    <div class="req-form" id="req-form">
      <h2 class="req-title">Подписание договора</h2>
      <p class="req-sub">Реквизиты уже указаны в договоре. Введите имя и телефон, затем выберите способ подписания.</p>
      <label class="fld"><span>Имя подписанта</span><input data-f="name" autocomplete="name" maxlength="200" placeholder="Ваше имя и фамилия" value="${esc(name)}" required></label>
      <label class="fld"><span>Телефон</span><input data-f="phone" type="tel" autocomplete="tel" maxlength="24" placeholder="+7 777 123 45 67" required></label>
      <div class="sign-actions"><button class="btn bronze" id="btn-next">Далее</button><button class="btn" id="btn-edit-identity" hidden>Изменить имя или телефон</button></div>
      <div id="sign-methods" hidden><div class="sign-actions">
        <button class="btn bronze" id="btn-sign">Подписать ЭЦП</button>
        <button class="btn" id="btn-egov">eGov Mobile</button>
        <button class="btn" id="btn-otp">СМС · WhatsApp</button>
      </div>
      <p class="req-sub" style="margin:12px 0 0">ЭЦП — через NCALayer на компьютере. eGov Mobile — в приложении или по QR-коду. СМС · WhatsApp — подтверждение кодом в WhatsApp.</p></div>
      <div id="otp-panel" class="otp-panel" hidden>
        <h3>Код в WhatsApp</h3><p>Отправим пояснение и код на <b id="otp-recipient"></b>.</p>
        <button class="btn" id="btn-otp-send">Получить код</button>
        <div id="otp-entry" hidden>
          <label class="fld"><span>Код из WhatsApp</span><input id="otp-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000"></label>
          <label class="otp-consent"><input type="checkbox" id="otp-consent"><span>Я ознакомился с договором и согласен с его условиями. Подтверждаю согласие одноразовым кодом, отправленным на мой номер WhatsApp.</span></label>
          <button class="btn bronze" id="btn-otp-verify">Подтвердить договор</button>
        </div>
      </div>
      <p id="sign-form-status" role="status" aria-live="polite"></p>
    </div>
    <div class="sign-actions">
      <button class="btn" id="btn-download">Скачать договор</button>
      ${universal ? "" : `<button class="btn danger" id="btn-decline">Отказаться</button>`}
    </div>`;

  const dl = $("#dl");
  if (dl) dl.addEventListener("click", downloadFile);
  $("#btn-download").addEventListener("click", downloadFile);
  const declineBtn = $("#btn-decline");
  if (declineBtn) declineBtn.addEventListener("click", () => onDecline());
  $("#btn-sign").addEventListener("click", () => onSign(contract));
  $("#btn-egov").addEventListener("click", () => onSign(contract, true));
  initOtp({contract,signApi,onDone:async signer=>{
    let parties;try{parties=(await apiGet()).parties}catch{}
    renderDone(signer,contract,parties);
  }});
  if (pendingEgov(signApi())) {
    const saved=pendingEgov(signApi())?.metadata?.requisites?.data;
    if(saved?.name) $('[data-f="name"]').value=saved.name;
    if(saved?.contact) $('[data-f="phone"]').value=saved.contact;
    $("#btn-egov").textContent = "Продолжить в eGov Mobile";
    $("#btn-next").click();
    toast("Вернулись из eGov? Нажмите «Продолжить в eGov Mobile».");
  }

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
  const {name,phone} = readSigningIdentity();
  return {
    signerType: savedSignerDetails.signerType === "company" ? "ip" : savedSignerDetails.signerType,
    requisites: { ...savedSignerDetails.requisites, data: { ...savedSignerDetails.requisites.data, name, contact: phone } },
  };
}

async function onSign(contract, egov = false) {
  const btn = $(egov ? "#btn-egov" : "#btn-sign");
  let reqs;
  try { reqs = (egov && pendingEgov(signApi())?.metadata) || collectRequisites(); }
  catch (e) { return toast(e.message, true); }
  $("#btn-sign").disabled = true; $("#btn-egov").disabled = true; $("#btn-otp").disabled = true; $("#btn-edit-identity").disabled = true; $("#otp-panel").hidden = true;
  if ($("#btn-decline")) $("#btn-decline").disabled = true;
  btn.textContent = egov ? "Подписание через eGov…" : "Подключаюсь к NCALayer…";
  try {
    if (!currentBlob) {
      const f = await fileBlobUrl(); currentBlob = f.blob;
    }
    const base64 = await blobToBase64(currentBlob);
    if (!egov) toast("Выберите ключ ЭЦП в окне NCALayer…");
    const { cms, signer, tsp } = egov
      ? await signWithEgov({ context: signApi(), base64, title: contract.title, mime: currentBlob.type, metadata: reqs })
      : await signBase64(base64);
    btn.textContent = "Сохраняю подпись…";
    const res = await apiPost({ cmsBase64: cms, signer, tsp, signerType: reqs.signerType, requisites: reqs.requisites });
    if (egov) clearEgov(signApi());
    let parties;
    try { parties = (await apiGet()).parties; } catch (_) { /* список подтянем позже */ }
    renderDone(res.signer, contract, parties);
  } catch (e) {
    const msg = e instanceof NcaLayerError ? e.message : (e.message || String(e));
    toast(msg, true);
    $("#btn-sign").disabled = false; $("#btn-egov").disabled = false; $("#btn-otp").disabled = false; $("#btn-edit-identity").disabled = false;
    if ($("#btn-decline")) $("#btn-decline").disabled = false;
    btn.textContent = egov ? "Продолжить в eGov Mobile" : "Подписать ЭЦП";
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

// Резервный экран: договор закрыт для подписания — показываем документ и кто подписал.
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
    <div class="view-tag">👁 Договор закрыт для подписания · доступен просмотр и скачивание</div>
    <h1 style="font-size:24px;margin:6px 0 4px">${esc(contract.title)}</h1>
    <div class="summary">
      <div><span>Файл</span><b>${esc(contract.fileName)} · ${fmtSize(contract.fileSize)}</b></div>
      <div><span>Подписей</span><b>${signatureCountLabel(data.parties, universal)}</b></div>
      ${contract.fileHash ? `<div><span>SHA-256 документа</span><b class="hash">${esc(contract.fileHash)}</b></div>` : ""}
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
  if (!token && !ctoken) {
    root.innerHTML = `<div class="empty">Ссылка недействительна — отсутствует токен.</div>`;
    return;
  }
  let data;
  try {
    data = await loadContract();
  } catch (e) {
    const nca = $("#nca-badge");
    if (nca) nca.style.display = "none";
    root.innerHTML = `<div class="empty">${esc(e.message || "Ссылка недействительна или истекла")}</div>`;
    return;
  }
  if (readOnly) {
    await renderView(data);
    return;
  }
  refreshNcaBadge();
  await render(data);
}

init();
