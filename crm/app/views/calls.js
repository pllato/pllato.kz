// Pllato CRM — Calls (cold-call script and pipeline).

import { ICONS } from "../icons.js";
import { CallsApi } from "../calls_api.js";
import { listChannels } from "../channels.js";
import { currentEmployee, listEmployees, getEmployeeBinotelLine } from "../employees.js";

const QUEUE_CAMPAIGN_KEY = "pllato_calls_queue_campaign";

const state = {
  container: null,
  campaigns: [],
  scripts: [],
  loadingCampaigns: false,
  loadingScripts: false,
  campaignError: "",

  newCampaignOpen: false,
  creatingCampaign: false,

  campaignDetailId: "",
  campaignDetail: null,
  loadingCampaignDetail: false,
  campaignDetailError: "",
  campaignFilters: {},
  selectedCustomers: [],
  assignCallerId: "",

  queueCampaignId: localStorage.getItem(QUEUE_CAMPAIGN_KEY) || "",
  queueList: [],
  queueLoading: false,
  queueError: "",
  queueActiveId: "",
  queueActive: null,
  queueActiveLoading: false,

  stageCode: "",
  callLogId: "",
  callStartedAt: 0,
  notesDraft: "",
  finishOpen: false,
  finishOutcome: "",
  finishMeetingAt: "",
  finishCallbackAt: "",
  finishSaving: false,
  waRendered: "",
  waUrl: "",

  quickCallNumber: "",
  quickCallChannelId: "",
  quickCallInternalNumber: "",
  quickCallSubmitting: false,
  quickCallError: "",
  quickCallResult: "",

  historyList: [],
  historyRecordUrls: {},
  historyLoading: false,
  historyError: "",
  historyRecordLoadingId: "",
  historyLoadedOnce: false,

  renderOptions: {},
  embeddedRoute: { page: "dial" },
};

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function formatDateTime(ts) {
  const n = Number(ts) || 0;
  if (!n) return "";
  return new Date(n).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDateOnly(ts) {
  const n = Number(ts) || 0;
  if (!n) return "";
  return new Date(n).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatPct(v) {
  return `${Number(v || 0).toFixed(1)}%`;
}

function parseCallsRouteParts(parts) {
  if (parts[0] === "crm" && parts[1] === "calls") {
    parts = ["calls", ...parts.slice(2)];
  }
  if (parts[0] !== "calls") return { page: "dial" };
  if (parts[1] === "queue") return { page: "queue", campaignId: parts[2] ? decodeURIComponent(parts[2]) : "" };
  if (parts[1] === "dial") return { page: "dial" };
  if (parts[1] === "history") return { page: "history" };
  if (parts[1] === "campaigns" && parts[2]) return { page: "campaign", campaignId: decodeURIComponent(parts[2]) };
  return { page: "dial" };
}

function parseHashRoute(hash = location.hash || "#calls") {
  const parts = String(hash || "#calls").replace(/^#/, "").split("/").filter(Boolean);
  return parseCallsRouteParts(parts);
}

function normalizeRoute(route) {
  const page = String(route?.page || "dial");
  if (page === "queue") return { page: "queue", campaignId: String(route?.campaignId || "") };
  if (page === "campaign") return { page: "campaign", campaignId: String(route?.campaignId || "") };
  if (page === "history") return { page: "history" };
  if (page === "dial") return { page: "dial" };
  return { page: "dial" };
}

function rerender() {
  if (!state.container?.isConnected) return;
  if (state.renderOptions?.embedded) {
    renderCalls(state.container, { ...state.renderOptions, route: state.embeddedRoute });
    return;
  }
  renderCalls(state.container, state.renderOptions || {});
}

function hasCloudApi() {
  return Boolean(String(window.PLLATO_API_BASE || "").trim());
}

function currentCallerUid() {
  const me = currentEmployee();
  if (!me) return "";
  if (String(me.id || "").startsWith("fb_")) return String(me.id).slice(3);
  return String(me.authUid || me.id || "");
}

function employeesAsCallers() {
  return listEmployees().map((e) => {
    const callerId = String(e.id || "").startsWith("fb_") ? String(e.id).slice(3) : String(e.authUid || e.id || "");
    return { id: callerId, name: e.name || e.email || callerId };
  }).filter((x) => x.id);
}

function callerName(uid) {
  const callers = employeesAsCallers();
  return callers.find((c) => c.id === uid)?.name || uid;
}

function employeeBinotelLines() {
  const uniq = new Set();
  listEmployees().forEach((e) => {
    const line = normalizeInternalLine(e?.binotelLine || e?.binotel_line || getEmployeeBinotelLine(e?.id) || "");
    if (line) uniq.add(line);
  });
  return [...uniq];
}

function activeBinotelChannels() {
  return listChannels({ type: "binotel" }).filter((c) => c.active !== false);
}

function ensureQuickCallDefaults() {
  const channels = activeBinotelChannels();
  if (state.quickCallChannelId && !channels.some((c) => c.id === state.quickCallChannelId)) {
    state.quickCallChannelId = "";
  }
  if (!state.quickCallChannelId && channels[0]?.id) {
    state.quickCallChannelId = channels[0].id;
  }

  if (!state.quickCallInternalNumber) {
    const me = currentEmployee();
    const personalLine = normalizeInternalLine(me?.binotelLine || me?.binotel_line || getEmployeeBinotelLine(me?.id) || "");
    if (personalLine) {
      state.quickCallInternalNumber = personalLine;
    } else {
      const selected = channels.find((c) => c.id === state.quickCallChannelId) || channels[0];
      const defaultLine = normalizeInternalLine(selected?.public?.default_inner || "");
      if (defaultLine) state.quickCallInternalNumber = defaultLine;
    }
  }
}

function routeTabs(route) {
  return `
    <div class="calls-tabs">
      <a class="calls-tab ${route.page === "dial" ? "active" : ""}" href="#calls/dial">Быстрый звонок</a>
      <a class="calls-tab ${route.page === "history" ? "active" : ""}" href="#calls/history">История звонков</a>
    </div>
  `;
}

async function ensureCampaigns() {
  if (state.loadingCampaigns) return;
  if (state.campaigns.length > 0) return;
  state.loadingCampaigns = true;
  state.campaignError = "";
  rerender();
  try {
    const data = await CallsApi.listCampaigns();
    state.campaigns = Array.isArray(data.campaigns) ? data.campaigns : [];
    if (!state.queueCampaignId && state.campaigns[0]?.id) {
      state.queueCampaignId = state.campaigns[0].id;
      localStorage.setItem(QUEUE_CAMPAIGN_KEY, state.queueCampaignId);
    }
  } catch (e) {
    state.campaignError = e?.message || String(e);
  } finally {
    state.loadingCampaigns = false;
    rerender();
  }
}

async function ensureScripts() {
  if (state.loadingScripts) return;
  if (state.scripts.length > 0) return;
  state.loadingScripts = true;
  rerender();
  try {
    const data = await CallsApi.listScripts();
    state.scripts = Array.isArray(data.scripts) ? data.scripts : [];
  } catch {
    // ignore silently, main page still usable
  } finally {
    state.loadingScripts = false;
    rerender();
  }
}

function renderCampaignList() {
  return `
    <div class="calls-page">
      <div class="calls-head">
        <div>
          <h3>Кампании обзвона</h3>
          <p>Управление источниками, скриптами и конверсией по воронке.</p>
        </div>
        <div class="calls-head-actions">
          <a class="btn-ghost" href="#calls/queue">${ICONS.phone}<span>Открыть очередь</span></a>
          <button class="btn-primary" id="newCampaignBtn">${ICONS.plus}<span>Новая кампания</span></button>
        </div>
      </div>

      ${state.newCampaignOpen ? renderNewCampaignForm() : ""}
      ${state.campaignError ? `<div class="calls-error">${escape(state.campaignError)}</div>` : ""}

      <div class="calls-table-wrap">
        <table class="calls-table">
          <thead>
            <tr>
              <th>Кампания</th>
              <th>Скрипт</th>
              <th>Контакты</th>
              <th>Дозвон</th>
              <th>Квалиф.</th>
              <th>Встречи</th>
              <th>Конверсия</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${state.loadingCampaigns
              ? `<tr><td colspan="8" class="calls-empty">Загрузка кампаний...</td></tr>`
              : state.campaigns.length === 0
                ? `<tr><td colspan="8" class="calls-empty">Кампаний пока нет</td></tr>`
                : state.campaigns.map((c) => `
                  <tr data-campaign-row="${escape(c.id)}">
                    <td><strong>${escape(c.name)}</strong><div class="calls-sub">${escape(c.status || "active")}</div></td>
                    <td>${escape(c.script_name || c.script_id || "—")}</td>
                    <td>${Number(c.stats?.assigned || 0)}</td>
                    <td>${Number(c.stats?.dialed || 0)}</td>
                    <td>${Number(c.stats?.qualified || 0)}</td>
                    <td>${Number(c.stats?.meeting_booked || 0)}</td>
                    <td>${formatPct(c.stats?.conversion_percent || 0)}</td>
                    <td><a class="btn-ghost" href="#calls/campaigns/${encodeURIComponent(c.id)}">Открыть</a></td>
                  </tr>
                `).join("")
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderNewCampaignForm() {
  const options = state.scripts.map((s) => `<option value="${escape(s.id)}">${escape(s.name)}</option>`).join("");
  return `
    <form class="calls-form" id="newCampaignForm">
      <div class="field"><label>Название</label><input name="name" required placeholder="Например: Ukolova 2026"></div>
      <div class="field"><label>Скрипт</label><select name="script_id" required>${options}</select></div>
      <div class="field"><label>Source ID</label><input name="source_id" placeholder="source_..."></div>
      <div class="calls-form-actions">
        <button type="button" class="btn-ghost" id="cancelCampaignBtn">Отмена</button>
        <button type="submit" class="btn-primary" ${state.creatingCampaign ? "disabled" : ""}>Создать</button>
      </div>
    </form>
  `;
}

function getCampaignFilters(campaignId) {
  if (!state.campaignFilters[campaignId]) {
    state.campaignFilters[campaignId] = { caller_id: "all", outcome: "", date_from: "", date_to: "" };
  }
  return state.campaignFilters[campaignId];
}

async function loadCampaignDetail(campaignId) {
  if (!campaignId) return;
  if (state.loadingCampaignDetail && state.campaignDetailId === campaignId) return;
  state.loadingCampaignDetail = true;
  state.campaignDetailError = "";
  state.campaignDetailId = campaignId;
  rerender();
  try {
    const filters = getCampaignFilters(campaignId);
    const payload = {
      caller_id: filters.caller_id === "all" ? "" : filters.caller_id,
      outcome: filters.outcome || "",
      date_from: filters.date_from ? `${filters.date_from}T00:00:00` : "",
      date_to: filters.date_to ? `${filters.date_to}T23:59:59` : "",
    };
    const data = await CallsApi.getCampaign(campaignId, payload);
    state.campaignDetail = data;
    state.selectedCustomers = [];
    if (!state.assignCallerId) state.assignCallerId = currentCallerUid();
  } catch (e) {
    state.campaignDetailError = e?.message || String(e);
  } finally {
    state.loadingCampaignDetail = false;
    rerender();
  }
}

function renderFunnel(funnel) {
  const f = funnel || {};
  return `
    <div class="calls-funnel">
      <div class="funnel-card"><span>Assigned</span><strong>${Number(f.assigned || 0)}</strong></div>
      <div class="funnel-card"><span>Dialed</span><strong>${Number(f.dialed || 0)}</strong></div>
      <div class="funnel-card"><span>Qualified</span><strong>${Number(f.qualified || 0)}</strong></div>
      <div class="funnel-card"><span>Meeting booked</span><strong>${Number(f.meeting_booked || 0)}</strong></div>
      <div class="funnel-card"><span>Closed</span><strong>${Number(f.closed || 0)}</strong></div>
    </div>
  `;
}

function renderCampaignDetail(route) {
  const isLoading = state.loadingCampaignDetail && state.campaignDetailId === route.campaignId;
  const detail = state.campaignDetail;

  if (isLoading && !detail) return `<div class="calls-page"><div class="calls-empty">Загрузка кампании...</div></div>`;
  if (state.campaignDetailError) return `<div class="calls-page"><div class="calls-error">${escape(state.campaignDetailError)}</div></div>`;
  if (!detail?.campaign) return `<div class="calls-page"><div class="calls-empty">Кампания не найдена</div></div>`;

  const filters = getCampaignFilters(route.campaignId);
  const contacts = Array.isArray(detail.contacts) ? detail.contacts : [];
  const outcomes = Array.isArray(detail.outcomes) ? detail.outcomes : [];
  const callers = Array.isArray(detail.callers) ? detail.callers : [];

  return `
    <div class="calls-page">
      <div class="calls-head">
        <div>
          <a class="calls-breadcrumb" href="#calls">← Кампании</a>
          <h3>${escape(detail.campaign.name)}</h3>
          <p>${escape(detail.script?.name || detail.campaign.script_id || "")}</p>
        </div>
        <div class="calls-head-actions">
          <label class="btn-ghost" style="cursor:pointer;">
            ${ICONS.plus}<span>Импорт CSV</span>
            <input type="file" id="campaignImportFile" accept=".csv,text/csv" style="display:none">
          </label>
          <a class="btn-primary" href="#calls/queue/${encodeURIComponent(detail.campaign.id)}">В очередь</a>
        </div>
      </div>

      ${renderFunnel(detail.funnel)}

      <div class="calls-filters" id="campaignFilters">
        <label>Caller
          <select name="caller_id">
            <option value="all" ${filters.caller_id === "all" ? "selected" : ""}>Все</option>
            ${callers.map((c) => `<option value="${escape(c.id)}" ${filters.caller_id === c.id ? "selected" : ""}>${escape(callerName(c.id))}</option>`).join("")}
          </select>
        </label>
        <label>Outcome
          <select name="outcome">
            <option value="">Все</option>
            ${outcomes.map((o) => `<option value="${escape(o.code)}" ${filters.outcome === o.code ? "selected" : ""}>${escape(o.label)}</option>`).join("")}
          </select>
        </label>
        <label>С
          <input type="date" name="date_from" value="${escape(filters.date_from || "")}">
        </label>
        <label>По
          <input type="date" name="date_to" value="${escape(filters.date_to || "")}">
        </label>
        <button class="btn-ghost" id="applyCampaignFilters">Применить</button>
      </div>

      <div class="calls-assign-row">
        <label>Назначить выбранные контакты на:</label>
        <select id="assignCallerSelect">
          ${employeesAsCallers().map((e) => `<option value="${escape(e.id)}" ${state.assignCallerId === e.id ? "selected" : ""}>${escape(e.name)}</option>`).join("")}
        </select>
        <button class="btn-primary" id="assignCustomersBtn">Назначить</button>
      </div>

      <div class="calls-table-wrap">
        <table class="calls-table">
          <thead>
            <tr>
              <th><input type="checkbox" id="selectAllCampaignContacts"></th>
              <th>Имя</th>
              <th>Телефон</th>
              <th>Caller</th>
              <th>Статус</th>
              <th>Последний outcome</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            ${contacts.length === 0
              ? `<tr><td colspan="7" class="calls-empty">Контактов нет</td></tr>`
              : contacts.map((c) => {
                  const checked = state.selectedCustomers.includes(c.customer_id);
                  return `
                    <tr>
                      <td><input type="checkbox" data-customer-check="${escape(c.customer_id)}" ${checked ? "checked" : ""}></td>
                      <td>${escape(c.customer?.name || "—")}</td>
                      <td>${escape(c.customer?.phone || "—")}</td>
                      <td>${escape(callerName(c.caller_id || ""))}</td>
                      <td>${escape(c.status || "pending")}</td>
                      <td>${escape(c.last_call?.outcome || "—")}</td>
                      <td>${c.last_call?.at ? formatDateTime(c.last_call.at) : "—"}</td>
                    </tr>
                  `;
                }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function loadQueue() {
  if (state.queueLoading) return;
  state.queueLoading = true;
  state.queueError = "";
  rerender();
  try {
    const params = { caller_id: "me", status: "pending", limit: 10 };
    if (state.queueCampaignId) params.campaign_id = state.queueCampaignId;
    const data = await CallsApi.getQueue(params);
    state.queueList = Array.isArray(data.queue) ? data.queue : [];

    if (!state.queueActiveId && state.queueList[0]?.assignment_id) {
      state.queueActiveId = state.queueList[0].assignment_id;
    }
    if (state.queueActiveId && !state.queueList.find((x) => x.assignment_id === state.queueActiveId)) {
      state.queueActiveId = state.queueList[0]?.assignment_id || "";
    }
  } catch (e) {
    state.queueError = e?.message || String(e);
  } finally {
    state.queueLoading = false;
    rerender();
  }
}

function resetQueueSession() {
  state.queueActive = null;
  state.stageCode = "";
  state.callLogId = "";
  state.callStartedAt = 0;
  state.notesDraft = "";
  state.finishOpen = false;
  state.finishOutcome = "";
  state.finishMeetingAt = "";
  state.finishCallbackAt = "";
  state.finishSaving = false;
  state.waRendered = "";
  state.waUrl = "";
}

async function loadQueueItem(assignmentId) {
  if (!assignmentId) return;
  if (state.queueActiveLoading && state.queueActiveId === assignmentId) return;
  state.queueActiveLoading = true;
  state.queueError = "";
  rerender();
  try {
    const data = await CallsApi.getQueueItem(assignmentId);
    state.queueActive = data;
    const stages = [...(data.script?.stages || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    const first = stages.find((s) => !s.is_terminal) || stages[0] || null;
    state.stageCode = first?.code || "";
    state.notesDraft = "";
    state.finishOpen = false;
    state.finishOutcome = "";
    state.waRendered = "";
    state.waUrl = "";
  } catch (e) {
    state.queueError = e?.message || String(e);
  } finally {
    state.queueActiveLoading = false;
    rerender();
  }
}

function stageByCode(script, code) {
  return (script?.stages || []).find((s) => s.code === code) || null;
}

function fillScriptText(raw, assignment) {
  const customerName = assignment?.customer?.name || "клиент";
  const caller = currentEmployee();
  const callerName = caller?.name || caller?.email || "менеджер";
  return String(raw || "")
    .replaceAll("{customer_name}", customerName)
    .replaceAll("{caller_name}", callerName)
    .replaceAll("{meeting_date}", state.finishMeetingAt ? formatDateOnly(new Date(state.finishMeetingAt).getTime()) : "")
    .replaceAll("{meeting_time}", state.finishMeetingAt ? new Date(state.finishMeetingAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "");
}

async function ensureCallStarted() {
  if (state.callLogId) return state.callLogId;
  const assignment = state.queueActive?.assignment;
  if (!assignment) throw new Error("Сначала выбери контакт");
  const started = await CallsApi.startLog({ campaign_id: assignment.campaign_id, customer_id: assignment.customer_id });
  state.callLogId = started.log_id;
  state.callStartedAt = Number(started.started_at) || Date.now();
  return state.callLogId;
}

async function patchLiveLog(extra = {}) {
  if (!state.callLogId) return;
  await CallsApi.patchLog(state.callLogId, {
    final_stage_code: state.stageCode,
    notes: state.notesDraft,
    ...extra,
  });
}

function normalizePhone(value) {
  return String(value || "").replace(/[^\d+]/g, "");
}

function normalizeInternalLine(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function friendlyBinotelError(err) {
  const msg = String(err?.message || err || "").trim();
  const low = msg.toLowerCase();
  if (low.includes("\"code\":121") || (low.includes("binotel") && low.includes("key or secret"))) {
    return "Binotel: неверные API Key / API Secret в канале.";
  }
  if (low.includes("internalnumber") || low.includes("линия сотрудника")) {
    return "У сотрудника не задана внутренняя линия. Укажи её в Пользователях.";
  }
  if (low.includes("externalnumber")) {
    return "Некорректный номер клиента.";
  }
  return msg || "Ошибка Binotel";
}

async function startBinotelCallFromQueue() {
  const assignment = state.queueActive?.assignment;
  if (!assignment) throw new Error("Сначала выбери контакт");

  const channels = activeBinotelChannels();
  if (channels.length === 0) {
    throw new Error("Нет активного канала Binotel. Подключи телефонию в Контакт-центре.");
  }

  const externalNumber = normalizePhone(assignment.customer?.phone || assignment.customer?.phone_digits || "");
  if (!externalNumber) throw new Error("У контакта не заполнен номер телефона");

  const channel = channels[0];
  const me = currentEmployee();
  const personalLine = normalizeInternalLine(me?.binotelLine || me?.binotel_line || getEmployeeBinotelLine(me?.id) || "");
  const fallbackLine = normalizeInternalLine(channel.public?.default_inner || "");
  return CallsApi.binotelCall({
    channelId: channel.id,
    externalNumber,
    internalNumber: personalLine || fallbackLine || undefined,
  });
}

async function onTransitionClick(tr) {
  if (!state.queueActive?.script) return;
  await ensureCallStarted();

  const nextCode = tr.next_stage_code || state.stageCode;
  if (nextCode) state.stageCode = nextCode;
  await patchLiveLog({ final_stage_code: state.stageCode });

  const current = stageByCode(state.queueActive.script, state.stageCode);
  if (tr.outcome || current?.is_terminal || !tr.next_stage_code) {
    state.finishOpen = true;
    state.finishOutcome = tr.outcome || state.finishOutcome || "";
  }
  state.waRendered = "";
  state.waUrl = "";
  rerender();
}

function renderQueueRightPane() {
  if (state.queueActiveLoading) return `<div class="calls-empty">Загрузка карточки звонка...</div>`;
  if (!state.queueActive?.assignment || !state.queueActive?.script) {
    return `<div class="calls-empty">Выбери контакт слева, чтобы открыть скрипт звонка.</div>`;
  }

  const assignment = state.queueActive.assignment;
  const script = state.queueActive.script;
  const stages = [...(script.stages || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  const activeStage = stageByCode(script, state.stageCode) || stages[0] || null;
  const transitions = Array.isArray(activeStage?.transitions) ? activeStage.transitions : [];
  const outcomes = Array.isArray(state.queueActive.outcomes) ? state.queueActive.outcomes : [];

  const waPhone = String((assignment.customer?.phone_digits || assignment.customer?.phone || "").replace(/\D/g, ""));
  const telPhone = String(assignment.customer?.phone || assignment.customer?.phone_digits || "");

  return `
    <div class="queue-card">
      <div class="queue-card-head">
        <div>
          <h3>${escape(assignment.customer?.name || "Без имени")}</h3>
          <div class="queue-card-sub">
            ${escape(assignment.customer?.phone || "—")}
            ${assignment.customer?.business_type ? ` · ${escape(assignment.customer.business_type)}` : ""}
          </div>
        </div>
        <div class="queue-card-actions">
          <a class="btn-ghost" href="tel:${escape(telPhone)}">${ICONS.phone}<span>Позвонить</span></a>
          <a class="btn-ghost" target="_blank" rel="noopener noreferrer" href="https://wa.me/${escape(waPhone)}">${ICONS.chat}<span>WhatsApp</span></a>
          <button class="btn-primary" id="startCallBtn" ${state.callLogId ? "disabled" : ""}>Начать звонок (CRM)</button>
        </div>
      </div>

      <div class="call-stepper">
        ${stages.map((s) => `
          <button class="step-dot ${s.code === state.stageCode ? "active" : ""} ${s.is_terminal ? "terminal" : ""}" data-stage-code="${escape(s.code)}" title="${escape(s.name)}">
            <span>${s.order_index}</span>
          </button>
        `).join("")}
      </div>

      ${activeStage ? `
        <div class="stage-card">
          <div class="stage-top">
            <h4>${escape(activeStage.name)}</h4>
            ${activeStage.is_terminal ? `<span class="stage-terminal">terminal</span>` : ""}
          </div>
          ${activeStage.goal ? `<div class="stage-goal">Цель: ${escape(activeStage.goal)}</div>` : ""}
          <div class="stage-script">${escape(fillScriptText(activeStage.script_text, assignment)).replace(/\n/g, "<br>")}</div>
          ${activeStage.tip ? `<div class="stage-tip">Совет: ${escape(activeStage.tip)}</div>` : ""}

          ${(activeStage.objections || []).length > 0 ? `
            <div class="stage-objections">
              ${(activeStage.objections || []).map((o) => `
                <details>
                  <summary>${escape(o.question)}</summary>
                  <div>${escape(o.answer)}</div>
                </details>
              `).join("")}
            </div>
          ` : ""}

          <div class="stage-transitions">
            ${transitions.length === 0
              ? `<span class="calls-sub">Для этой стадии нет переходов.</span>`
              : transitions.map((t) => `
                <button class="btn-ghost" data-transition-id="${escape(t.id)}">${escape(t.trigger_label)}</button>
              `).join("")}
            <button class="btn-primary" id="finishCallBtn">Завершить звонок</button>
          </div>
        </div>
      ` : `<div class="calls-empty">Нет стадий в скрипте.</div>`}

      <div class="queue-notes">
        <label>Заметки по звонку</label>
        <textarea id="callNotes" placeholder="Что сказал клиент, что сделать дальше...">${escape(state.notesDraft || "")}</textarea>
      </div>

      ${state.finishOpen ? `
        <form class="finish-card" id="finishCallForm">
          <h4>Завершение звонка</h4>
          <div class="finish-grid">
            <label>Outcome
              <select name="outcome" required>
                <option value="">Выбери outcome</option>
                ${outcomes.map((o) => `<option value="${escape(o.code)}" ${state.finishOutcome === o.code ? "selected" : ""}>${escape(o.label)}</option>`).join("")}
              </select>
            </label>
            <label>Встреча (если назначена)
              <input type="datetime-local" name="meeting_at" value="${escape(state.finishMeetingAt)}">
            </label>
            <label>Перезвон (если callback)
              <input type="datetime-local" name="callback_at" value="${escape(state.finishCallbackAt)}">
            </label>
          </div>
          <div class="finish-actions">
            <button type="button" class="btn-ghost" id="cancelFinishBtn">Отмена</button>
            <button type="submit" class="btn-primary" ${state.finishSaving ? "disabled" : ""}>Сохранить outcome</button>
          </div>
        </form>
      ` : ""}

      ${state.waRendered ? `
        <div class="wa-preview">
          <h4>WhatsApp сообщение</h4>
          <textarea readonly>${escape(state.waRendered)}</textarea>
          <a class="btn-primary" target="_blank" rel="noopener noreferrer" href="${escape(state.waUrl || "#")}">Открыть WhatsApp</a>
        </div>
      ` : ""}
    </div>
  `;
}

function renderQuickDialCard({ compact = false } = {}) {
  ensureQuickCallDefaults();
  const channels = activeBinotelChannels();
  const hasChannels = channels.length > 0;
  const currentLine = normalizeInternalLine(state.quickCallInternalNumber || "");
  const waDigits = String(state.quickCallNumber || "").replace(/\D/g, "");

  return `
    <section class="quick-call-card ${compact ? "compact" : ""}">
      <div class="quick-call-head">
        <h4>Быстрый звонок</h4>
        <p>Введи номер и сразу запускай звонок через Binotel.</p>
      </div>

      ${state.quickCallError ? `<div class="calls-error">${escape(state.quickCallError)}</div>` : ""}
      ${state.quickCallResult ? `<div class="calls-ok">${escape(state.quickCallResult)}</div>` : ""}

      <form id="quickCallForm" class="quick-call-grid">
        <label>
          Номер клиента
          <input
            id="quickCallNumber"
            name="external_number"
            type="tel"
            placeholder="+77011234567"
            value="${escape(state.quickCallNumber)}"
            required
          >
        </label>

        <label>
          Канал Binotel
          <select id="quickCallChannel">
            ${hasChannels
              ? channels.map((ch) => `
                <option value="${escape(ch.id)}" ${state.quickCallChannelId === ch.id ? "selected" : ""}>
                  ${escape(ch.name || ch.id)}
                </option>
              `).join("")
              : `<option value="">Нет активного Binotel-канала</option>`}
          </select>
        </label>

        <label>
          Внутренняя линия сотрудника
          <input
            id="quickCallInternal"
            name="internal_number"
            type="text"
            inputmode="numeric"
            placeholder="Например, 1905"
            value="${escape(currentLine)}"
          >
        </label>

        <div class="quick-call-actions">
          <button class="btn-primary" type="submit" ${state.quickCallSubmitting || !hasChannels ? "disabled" : ""}>
            ${ICONS.phone}<span>Позвонить</span>
          </button>
          <a class="btn-ghost ${waDigits ? "" : "disabled"}" ${waDigits ? `target="_blank" rel="noopener noreferrer" href="https://wa.me/${escape(waDigits)}"` : ""}>
            ${ICONS.chat}<span>WhatsApp</span>
          </a>
        </div>
      </form>

      ${!hasChannels ? `<div class="calls-sub">Подключи Binotel в Контакт-центре, затем обнови страницу.</div>` : ""}
    </section>
  `;
}

function renderDialPage() {
  return `
    <div class="calls-page">
      <div class="calls-head">
        <div>
          <h3>Быстрый звонок</h3>
          <p>Режим без очереди: вручную вводишь номер и звонишь сразу из CRM.</p>
        </div>
      </div>

      ${renderQuickDialCard()}
    </div>
  `;
}

async function loadHistory() {
  if (state.historyLoading) return;
  state.historyLoading = true;
  state.historyError = "";
  rerender();
  try {
    const lines = employeeBinotelLines();
    const res = await CallsApi.binotelHistory({
      limit: 100,
      internal_numbers: lines.join(","),
    });
    const all = Array.isArray(res.calls) ? res.calls : [];
    state.historyList = lines.length > 0
      ? all.filter((row) => lines.includes(normalizeInternalLine(row.internalNumber || "")))
      : [];
  } catch (e) {
    state.historyError = e?.message || String(e);
  } finally {
    state.historyLoading = false;
    state.historyLoadedOnce = true;
    rerender();
  }
}

async function openHistoryRecording(callId) {
  const id = String(callId || "").trim();
  if (!id) return;
  // Если URL уже загружен — не делаем повторный запрос.
  // (Audio уже отрендерен в строке через row template.)
  state.historyRecordUrls = state.historyRecordUrls || {};
  if (state.historyRecordUrls[id]) return;

  const channelId = String(state.quickCallChannelId || activeBinotelChannels()[0]?.id || "").trim();
  if (!channelId) {
    alert("Сначала подключи и выбери Binotel-канал.");
    return;
  }
  state.historyRecordLoadingId = id;
  state.historyError = "";
  rerender();
  try {
    const rec = await CallsApi.binotelRecording({ channelId, callId: id });
    const url = String(rec.recordUrl || "").trim();
    if (!url) throw new Error("Запись не найдена");
    // Кешируем URL — row template отрисует <audio> при rerender'е
    state.historyRecordUrls[id] = url;
  } catch (e) {
    state.historyError = friendlyBinotelError(e);
  } finally {
    state.historyRecordLoadingId = "";
    rerender();
  }
}

function renderHistoryPage() {
  const lines = employeeBinotelLines();
  const linesHint = lines.length > 0 ? lines.join(", ") : "не заданы";
  return `
    <div class="calls-page">
      <div class="calls-head">
        <div>
          <h3>История звонков</h3>
          <p>Показываются только линии сотрудников из системы: ${escape(linesHint)}.</p>
        </div>
        <div class="calls-head-actions">
          <button class="btn-ghost" id="refreshHistoryBtn">Обновить</button>
        </div>
      </div>

      ${state.historyError ? `<div class="calls-error">${escape(state.historyError)}</div>` : ""}

      <div class="calls-table-wrap">
        <table class="calls-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Клиент</th>
              <th>Линия</th>
              <th>Статус</th>
              <th>Длит.</th>
              <th>Call ID</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${state.historyLoading
              ? `<tr><td colspan="7" class="calls-empty">Загрузка истории...</td></tr>`
              : state.historyList.length === 0
                ? `<tr><td colspan="7" class="calls-empty">${lines.length === 0 ? "У сотрудников не заполнены внутренние линии (1905/1914 и т.д.). Заполни их в Пользователях." : "По указанным линиям пока нет завершённых звонков в webhook Binotel."}</td></tr>`
                : state.historyList.map((row) => `
                  <tr>
                    <td>${formatDateTime(row.at)}</td>
                    <td>${escape(row.externalNumber || "—")}</td>
                    <td>${escape(row.internalNumber || "—")}</td>
                    <td>${escape(row.disposition || row.callType || "—")}</td>
                    <td>${Number(row.durationSeconds || 0)} c</td>
                    <td>${escape(row.callId || "—")}</td>
                    <td>
                      <div class="history-actions">
                        <button class="btn-ghost" data-history-redial="${escape(row.externalNumber || "")}" ${row.externalNumber ? "" : "disabled"}>Перезвонить</button>
                        ${(() => {
                          if (!row.callId) return `<button class="btn-ghost" disabled>Запись</button>`;
                          const recUrl = state.historyRecordUrls?.[row.callId];
                          if (recUrl) {
                            return `<audio controls autoplay src="${escape(recUrl)}" preload="auto" style="max-width:260px;height:32px;vertical-align:middle;"></audio>`;
                          }
                          if (state.historyRecordLoadingId === row.callId) {
                            return `<button class="btn-ghost" disabled>Загрузка...</button>`;
                          }
                          return `<button class="btn-ghost" data-history-record="${escape(row.callId)}">▶ Запись</button>`;
                        })()}
                      </div>
                    </td>
                  </tr>
                `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderQueuePage(route) {
  const campaignsOptions = state.campaigns.map((c) => `<option value="${escape(c.id)}" ${state.queueCampaignId === c.id ? "selected" : ""}>${escape(c.name)}</option>`).join("");

  return `
    <div class="calls-page queue-page">
      <div class="calls-head">
        <div>
          <h3>Очередь звонков</h3>
          <p>Скрипт и лог звонка в одном экране для ежедневной работы.</p>
        </div>
        <div class="calls-head-actions">
          <select id="queueCampaignSelect" ${route.campaignId ? "disabled" : ""}>${campaignsOptions}</select>
          <button class="btn-ghost" id="refreshQueueBtn">Обновить</button>
        </div>
      </div>

      ${state.queueError ? `<div class="calls-error">${escape(state.queueError)}</div>` : ""}

      ${renderQuickDialCard({ compact: true })}

      <div class="queue-layout">
        <aside class="queue-left">
          <div class="queue-left-head">Сегодня позвонить: <strong>${Number(state.queueList.length || 0)}</strong></div>
          <div class="queue-list">
            ${state.queueLoading
              ? `<div class="calls-empty">Загрузка очереди...</div>`
              : state.queueList.length === 0
                ? `<div class="calls-empty">Очередь пуста</div>`
                : state.queueList.map((q) => `
                  <button class="queue-row ${state.queueActiveId === q.assignment_id ? "active" : ""}" data-queue-id="${escape(q.assignment_id)}">
                    <div class="queue-row-name">${escape(q.customer?.name || "Без имени")}</div>
                    <div class="queue-row-sub">${escape(q.customer?.phone || "—")}</div>
                  </button>
                `).join("")}
          </div>
        </aside>

        <section class="queue-right">
          ${renderQueueRightPane()}
        </section>
      </div>
    </div>
  `;
}

function renderCloudMissing() {
  return `
    <div class="calls-page">
      <div class="calls-error">Для раздела «Звонки» нужен API Worker. Укажи <code>window.PLLATO_API_BASE</code> в <code>app.config.js</code>.</div>
    </div>
  `;
}

async function handleCreateCampaign(form) {
  const fd = new FormData(form);
  const payload = {
    name: String(fd.get("name") || "").trim(),
    script_id: String(fd.get("script_id") || "").trim(),
    source_id: String(fd.get("source_id") || "").trim(),
  };
  state.creatingCampaign = true;
  rerender();
  try {
    const res = await CallsApi.createCampaign(payload);
    state.newCampaignOpen = false;
    state.campaigns = [];
    await ensureCampaigns();
    if (res.campaign?.id) location.hash = `#calls/campaigns/${encodeURIComponent(res.campaign.id)}`;
  } catch (e) {
    state.campaignError = e?.message || String(e);
  } finally {
    state.creatingCampaign = false;
    rerender();
  }
}

async function handleCampaignImport(file, campaignId) {
  if (!file) return;
  try {
    const callerId = state.assignCallerId || currentCallerUid();
    await CallsApi.importCampaignCsv(campaignId, file, { caller_id: callerId });
    await loadCampaignDetail(campaignId);
    state.campaigns = [];
    ensureCampaigns();
  } catch (e) {
    alert(e?.message || String(e));
  }
}

async function handleAssignSelected(campaignId) {
  const callerId = state.assignCallerId || currentCallerUid();
  if (!callerId) { alert("Выбери caller"); return; }
  if (state.selectedCustomers.length === 0) { alert("Выбери контакты в таблице"); return; }
  try {
    await CallsApi.assignCampaignCustomers(campaignId, {
      customer_ids: state.selectedCustomers,
      caller_id: callerId,
    });
    await loadCampaignDetail(campaignId);
  } catch (e) {
    alert(e?.message || String(e));
  }
}

async function handleQuickCall(form) {
  const fd = new FormData(form);
  const externalNumber = normalizePhone(fd.get("external_number"));
  const internalNumber = normalizeInternalLine(fd.get("internal_number"));
  const channels = activeBinotelChannels();
  const channelId = String(state.quickCallChannelId || "");
  const selectedChannel = channels.find((c) => c.id === channelId);

  state.quickCallError = "";
  state.quickCallResult = "";
  if (!externalNumber) {
    state.quickCallError = "Введи номер клиента";
    rerender();
    return;
  }
  if (channels.length === 0) {
    state.quickCallError = "Нет активного Binotel-канала. Подключи его в Контакт-центре.";
    rerender();
    return;
  }
  if (!channelId) {
    state.quickCallError = "Выбери Binotel-канал";
    rerender();
    return;
  }
  if (!selectedChannel) {
    state.quickCallError = "Выбранный канал недоступен, обнови страницу.";
    rerender();
    return;
  }

  state.quickCallSubmitting = true;
  state.quickCallNumber = externalNumber;
  state.quickCallInternalNumber = internalNumber;
  rerender();

  try {
    await CallsApi.binotelCall({
      channelId,
      externalNumber,
      internalNumber: internalNumber || undefined,
    });
    state.quickCallResult = "Звонок отправлен в Binotel. Жди входящий на своей линии.";
  } catch (e) {
    state.quickCallError = friendlyBinotelError(e);
  } finally {
    state.quickCallSubmitting = false;
    rerender();
  }
}

async function handleFinishSubmit(form) {
  if (!state.callLogId) {
    await ensureCallStarted();
  }
  const fd = new FormData(form);
  const outcome = String(fd.get("outcome") || "").trim();
  if (!outcome) {
    alert("Выбери outcome");
    return;
  }

  const meetingRaw = String(fd.get("meeting_at") || "").trim();
  const callbackRaw = String(fd.get("callback_at") || "").trim();
  const meetingAt = meetingRaw ? new Date(meetingRaw).getTime() : null;
  const callbackAt = callbackRaw ? new Date(callbackRaw).getTime() : null;

  state.finishSaving = true;
  rerender();
  try {
    const duration = state.callStartedAt ? Math.max(0, Math.round((Date.now() - state.callStartedAt) / 1000)) : 0;
    await CallsApi.patchLog(state.callLogId, {
      final_stage_code: state.stageCode,
      outcome,
      meeting_at: meetingAt || (outcome === "callback" ? callbackAt : null),
      notes: state.notesDraft,
      duration_seconds: duration,
      ended_at: Date.now(),
    });

    const waRes = await CallsApi.renderWhatsapp(state.callLogId, {
      stage_code: state.stageCode,
      meeting_at: meetingAt || null,
    }).catch(() => null);

    state.finishOpen = false;
    state.finishOutcome = outcome;
    state.finishMeetingAt = meetingRaw;
    state.finishCallbackAt = callbackRaw;
    state.waRendered = waRes?.rendered_text || "";
    state.waUrl = waRes?.wa_url || "";

    await loadQueue();
  } catch (e) {
    alert(e?.message || String(e));
  } finally {
    state.finishSaving = false;
    rerender();
  }
}

function wireCallsEvents(route, options = {}) {
  if (options.embedded) {
    state.container?.querySelectorAll('a[href^="#calls"], a[href^="#crm/calls"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const nextRoute = parseHashRoute(a.getAttribute("href") || "#calls/dial");
        state.embeddedRoute = normalizeRoute(nextRoute);
        if (typeof options.onRouteChange === "function") options.onRouteChange(state.embeddedRoute);
        rerender();
      });
    });
  }

  document.getElementById("newCampaignBtn")?.addEventListener("click", async () => {
    state.newCampaignOpen = true;
    await ensureScripts();
    rerender();
  });

  document.getElementById("cancelCampaignBtn")?.addEventListener("click", () => {
    state.newCampaignOpen = false;
    rerender();
  });

  document.getElementById("newCampaignForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    handleCreateCampaign(e.currentTarget);
  });

  document.getElementById("quickCallForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    handleQuickCall(e.currentTarget);
  });

  document.getElementById("quickCallNumber")?.addEventListener("input", (e) => {
    state.quickCallNumber = e.target.value;
    state.quickCallError = "";
    state.quickCallResult = "";
  });

  document.getElementById("quickCallInternal")?.addEventListener("input", (e) => {
    state.quickCallInternalNumber = normalizeInternalLine(e.target.value || "");
    state.quickCallError = "";
    state.quickCallResult = "";
  });

  document.getElementById("quickCallChannel")?.addEventListener("change", (e) => {
    state.quickCallChannelId = e.target.value || "";
    state.quickCallError = "";
    state.quickCallResult = "";
    if (!state.quickCallInternalNumber) {
      const selected = activeBinotelChannels().find((c) => c.id === state.quickCallChannelId);
      const defaultLine = normalizeInternalLine(selected?.public?.default_inner || "");
      if (defaultLine) state.quickCallInternalNumber = defaultLine;
      rerender();
    }
  });

  if (route.page === "history") {
    document.getElementById("refreshHistoryBtn")?.addEventListener("click", () => {
      loadHistory();
    });

    document.querySelectorAll("[data-history-redial]").forEach((el) => {
      el.addEventListener("click", () => {
        const phone = String(el.dataset.historyRedial || "").trim();
        if (!phone) return;
        state.quickCallNumber = phone;
        state.quickCallError = "";
        state.quickCallResult = "";
        if (options.embedded) {
          state.embeddedRoute = { page: "dial" };
          if (typeof options.onRouteChange === "function") options.onRouteChange(state.embeddedRoute);
          rerender();
        } else {
          location.hash = "#calls/dial";
        }
      });
    });

    document.querySelectorAll("[data-history-record]").forEach((el) => {
      el.addEventListener("click", () => {
        const callId = String(el.dataset.historyRecord || "").trim();
        if (!callId) return;
        openHistoryRecording(callId);
      });
    });
  }

  if (route.page === "campaign" && route.campaignId) {
    document.getElementById("campaignImportFile")?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) handleCampaignImport(file, route.campaignId);
      e.target.value = "";
    });

    document.getElementById("applyCampaignFilters")?.addEventListener("click", () => {
      const wrap = document.getElementById("campaignFilters");
      const f = getCampaignFilters(route.campaignId);
      f.caller_id = wrap.querySelector("select[name='caller_id']")?.value || "all";
      f.outcome = wrap.querySelector("select[name='outcome']")?.value || "";
      f.date_from = wrap.querySelector("input[name='date_from']")?.value || "";
      f.date_to = wrap.querySelector("input[name='date_to']")?.value || "";
      loadCampaignDetail(route.campaignId);
    });

    document.getElementById("assignCallerSelect")?.addEventListener("change", (e) => {
      state.assignCallerId = e.target.value;
    });

    document.getElementById("assignCustomersBtn")?.addEventListener("click", () => {
      handleAssignSelected(route.campaignId);
    });

    document.getElementById("selectAllCampaignContacts")?.addEventListener("change", (e) => {
      const contacts = state.campaignDetail?.contacts || [];
      state.selectedCustomers = e.target.checked ? contacts.map((c) => c.customer_id) : [];
      rerender();
    });

    document.querySelectorAll("[data-customer-check]").forEach((el) => {
      el.addEventListener("change", () => {
        const id = el.dataset.customerCheck;
        if (!id) return;
        if (el.checked) {
          if (!state.selectedCustomers.includes(id)) state.selectedCustomers.push(id);
        } else {
          state.selectedCustomers = state.selectedCustomers.filter((x) => x !== id);
        }
      });
    });
  }

  if (route.page === "queue") {
    document.getElementById("queueCampaignSelect")?.addEventListener("change", (e) => {
      state.queueCampaignId = e.target.value;
      localStorage.setItem(QUEUE_CAMPAIGN_KEY, state.queueCampaignId || "");
      state.queueActiveId = "";
      resetQueueSession();
      loadQueue();
    });

    document.getElementById("refreshQueueBtn")?.addEventListener("click", () => {
      loadQueue();
      if (state.queueActiveId) loadQueueItem(state.queueActiveId);
    });

    document.querySelectorAll("[data-queue-id]").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.dataset.queueId;
        if (!id) return;
        state.queueActiveId = id;
        resetQueueSession();
        loadQueueItem(id);
      });
    });

    document.getElementById("startCallBtn")?.addEventListener("click", async () => {
      try {
        await ensureCallStarted();
        await startBinotelCallFromQueue();
        rerender();
      } catch (e) {
        alert(e?.message || String(e));
      }
    });

    document.getElementById("finishCallBtn")?.addEventListener("click", async () => {
      try {
        await ensureCallStarted();
        state.finishOpen = true;
        rerender();
      } catch (e) {
        alert(e?.message || String(e));
      }
    });

    document.querySelectorAll("[data-stage-code]").forEach((el) => {
      el.addEventListener("click", async () => {
        const code = el.dataset.stageCode;
        if (!code) return;
        state.stageCode = code;
        await patchLiveLog({ final_stage_code: code }).catch(() => null);
        rerender();
      });
    });

    document.querySelectorAll("[data-transition-id]").forEach((el) => {
      el.addEventListener("click", async () => {
        const id = el.dataset.transitionId;
        const stage = stageByCode(state.queueActive?.script, state.stageCode);
        const tr = (stage?.transitions || []).find((t) => t.id === id);
        if (!tr) return;
        try {
          await onTransitionClick(tr);
        } catch (e) {
          alert(e?.message || String(e));
        }
      });
    });

    const notes = document.getElementById("callNotes");
    notes?.addEventListener("input", () => {
      state.notesDraft = notes.value;
    });
    notes?.addEventListener("blur", () => {
      patchLiveLog({ notes: state.notesDraft }).catch(() => null);
    });

    document.getElementById("cancelFinishBtn")?.addEventListener("click", () => {
      state.finishOpen = false;
      rerender();
    });
    document.getElementById("finishCallForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      handleFinishSubmit(e.currentTarget);
    });
  }
}

export function renderCalls(container, options = {}) {
  state.container = container;
  state.renderOptions = options;

  const embedded = Boolean(options.embedded);
  const route = embedded
    ? normalizeRoute(options.route || state.embeddedRoute)
    : parseHashRoute();

  if (embedded) {
    state.embeddedRoute = route;
    if (typeof options.onRouteChange === "function") options.onRouteChange(route);
  }

  if (!hasCloudApi()) {
    container.innerHTML = routeTabs(route) + renderCloudMissing();
    return;
  }

  if (route.page === "campaign" && route.campaignId && state.campaignDetailId !== route.campaignId) {
    state.campaignDetail = null;
    state.campaignDetailId = route.campaignId;
    state.campaignDetailError = "";
    loadCampaignDetail(route.campaignId);
  }

  if (route.page === "queue") {
    if (route.campaignId && route.campaignId !== state.queueCampaignId) {
      state.queueCampaignId = route.campaignId;
      localStorage.setItem(QUEUE_CAMPAIGN_KEY, state.queueCampaignId || "");
      state.queueActiveId = "";
      resetQueueSession();
      loadQueue();
    }
    if (state.queueList.length === 0 && !state.queueLoading) loadQueue();
    if (state.queueActiveId && (!state.queueActive || state.queueActive?.assignment?.assignment_id !== state.queueActiveId) && !state.queueActiveLoading) {
      loadQueueItem(state.queueActiveId);
    }
  }

  if (route.page === "history" && !state.historyLoadedOnce && !state.historyLoading) {
    loadHistory();
  }

  if (["list", "queue", "campaign"].includes(route.page) && state.campaigns.length === 0 && !state.loadingCampaigns) {
    ensureCampaigns();
  }

  let pageHtml = "";
  if (route.page === "campaign") pageHtml = renderCampaignDetail(route);
  else if (route.page === "queue") pageHtml = renderQueuePage(route);
  else if (route.page === "dial") pageHtml = renderDialPage(route);
  else if (route.page === "history") pageHtml = renderHistoryPage(route);
  else pageHtml = renderCampaignList();

  container.innerHTML = routeTabs(route) + pageHtml;
  wireCallsEvents(route, options);
}
