// API-обёртки реестра договоров (авторизованная часть портала).
import { apiFetch, getSession } from "../pllato-kz-shared/pllato-api.js";

function apiBase() {
  return String(window.PLLATO_API_BASE || "").trim().replace(/\/+$/, "");
}

export function listContracts() {
  return apiFetch("/api/contracts");
}

export function getContract(id) {
  return apiFetch(`/api/contracts/${encodeURIComponent(id)}`);
}

export function createContract(payload) {
  return apiFetch("/api/contracts", { method: "POST", body: payload });
}

export function addSigners(id, signers) {
  return apiFetch(`/api/contracts/${encodeURIComponent(id)}/signers`, { method: "POST", body: { signers } });
}

export function signOwner(id, { cmsBase64, signer }) {
  return apiFetch(`/api/contracts/${encodeURIComponent(id)}/sign`, { method: "POST", body: { cmsBase64, signer } });
}

export function sendContract(id) {
  return apiFetch(`/api/contracts/${encodeURIComponent(id)}/send`, { method: "POST", body: {} });
}

export function deleteContract(id) {
  return apiFetch(`/api/contracts/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// Скачать оригинал договора (нужен Authorization-заголовок → через fetch + blob).
export async function fetchContractFileBlob(id) {
  const session = getSession();
  if (!session?.token) throw new Error("Сессия не найдена");
  const res = await fetch(`${apiBase()}/api/contracts/${encodeURIComponent(id)}/file`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  if (!res.ok) throw new Error(`Не удалось загрузить файл (HTTP ${res.status})`);
  return await res.blob();
}

// Прочитать файл как base64 (для загрузки нового договора).
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.replace(/^data:[^,]*,/, ""));
    };
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });
}

export function signLinkForToken(token) {
  return `${location.origin}/sign.html?t=${encodeURIComponent(token)}`;
}
