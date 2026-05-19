// Pllato CRM — API helper for cold-call module.
import { apiFetch } from "./auth.js";

function cloudBase() {
  return String(window.PLLATO_API_BASE || "").trim().replace(/\/+$/, "");
}

function assertCloudBase() {
  const base = cloudBase();
  if (!base) throw new Error("Не задан PLLATO_API_BASE");
  return base;
}

async function request(path, { method = "GET", query = null, body = null, formData = null } = {}) {
  const base = assertCloudBase();

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

  const headers = {};
  const init = { method, headers };

  if (formData) {
    init.body = formData;
  } else if (body !== null) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const pathOnly = url.replace(base, "");
  return apiFetch(pathOnly, init);
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
};
