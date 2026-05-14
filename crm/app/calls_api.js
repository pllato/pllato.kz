// Pllato CRM — API helper for cold-call module.

function cloudBase() {
  return String(window.PLLATO_API_BASE || "").trim().replace(/\/+$/, "");
}

function assertCloudBase() {
  const base = cloudBase();
  if (!base) throw new Error("Не задан PLLATO_API_BASE");
  return base;
}

async function firebaseIdToken() {
  const cfg = window.PLLATO_FIREBASE_CONFIG || {};
  if (!cfg.apiKey || !cfg.authDomain) return null;

  const appMod = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js");
  const authMod = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js");
  const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(cfg);
  const auth = authMod.getAuth(app);
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

async function request(path, { method = "GET", query = null, body = null, formData = null } = {}) {
  const base = assertCloudBase();
  const token = await firebaseIdToken();
  if (!token) throw new Error("Нет активной Firebase-сессии");

  let url = base + path;
  if (query && typeof query === "object") {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      params.set(k, String(v));
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = { Authorization: `Bearer ${token}` };
  const init = { method, headers };

  if (formData) {
    init.body = formData;
  } else if (body !== null) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);
  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok || !data?.ok) {
    const details = data?.details
      ? (typeof data.details === "string" ? data.details : JSON.stringify(data.details))
      : "";
    throw new Error((data?.error || `HTTP ${res.status}`) + (details ? `: ${details}` : ""));
  }
  return data;
}

export const CallsApi = {
  listScripts() {
    return request("/api/crm/calls/scripts", { method: "GET" });
  },

  getScript(id) {
    return request(`/api/crm/calls/scripts/${encodeURIComponent(id)}`, { method: "GET" });
  },

  createScript(payload) {
    return request("/api/crm/calls/scripts", { method: "POST", body: payload || {} });
  },

  updateScript(id, payload) {
    return request(`/api/crm/calls/scripts/${encodeURIComponent(id)}`, { method: "PUT", body: payload || {} });
  },

  listCampaigns() {
    return request("/api/crm/calls/campaigns", { method: "GET" });
  },

  getCampaign(id, filters = null) {
    return request(`/api/crm/calls/campaigns/${encodeURIComponent(id)}`, { method: "GET", query: filters || undefined });
  },

  getCampaignFunnel(id) {
    return request(`/api/crm/calls/campaigns/${encodeURIComponent(id)}/funnel`, { method: "GET" });
  },

  createCampaign(payload) {
    return request("/api/crm/calls/campaigns", { method: "POST", body: payload || {} });
  },

  importCampaignCsv(id, file, extra = {}) {
    const form = new FormData();
    form.append("file", file);
    Object.entries(extra || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      form.append(k, String(v));
    });
    return request(`/api/crm/calls/campaigns/${encodeURIComponent(id)}/import`, { method: "POST", formData: form });
  },

  assignCampaignCustomers(id, payload) {
    return request(`/api/crm/calls/campaigns/${encodeURIComponent(id)}/assign`, { method: "POST", body: payload || {} });
  },

  getQueue(params = null) {
    return request("/api/crm/calls/queue", { method: "GET", query: params || undefined });
  },

  getQueueItem(assignmentId) {
    return request(`/api/crm/calls/queue/${encodeURIComponent(assignmentId)}`, { method: "GET" });
  },

  startLog(payload) {
    return request("/api/crm/calls/logs", { method: "POST", body: payload || {} });
  },

  patchLog(id, payload) {
    return request(`/api/crm/calls/logs/${encodeURIComponent(id)}`, { method: "PATCH", body: payload || {} });
  },

  renderWhatsapp(id, payload = {}) {
    return request(`/api/crm/calls/logs/${encodeURIComponent(id)}/whatsapp`, { method: "POST", body: payload });
  },

  binotelCall(payload) {
    return request("/binotel/call", { method: "POST", body: payload || {} });
  },

  binotelHistory(params = null) {
    return request("/binotel/history", { method: "GET", query: params || undefined });
  },

  binotelRecording(payload) {
    return request("/binotel/recording", { method: "POST", body: payload || {} });
  },
};
