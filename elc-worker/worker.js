// ── ELC CRM Worker ───────────────────────────────────────
// Phase 0 scaffold: CORS + Firebase Auth verification + /health + /me
// Real API endpoints (contacts/deals/tasks/...) добавим в Phase 2.

import { jwtVerify, createRemoteJWKSet } from "jose";

// Allowed origins for CORS
const ALLOWED_ORIGINS = new Set([
  "https://pllato.kz",
  "https://www.pllato.kz",
  "http://localhost:8080",
  "http://localhost:3000",
]);

// Firebase public keys (JWKS), кэшируются автоматически
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

// ── Helpers ──────────────────────────────────────────────
function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : "https://pllato.kz";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(data, status = 200, request = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(request ? corsHeaders(request) : {}),
    },
  });
}

async function verifyFirebaseIdToken(token, projectId) {
  const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  return payload; // { user_id, email, ... }
}

async function requireAuth(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return { error: "missing Bearer token", status: 401 };
  try {
    const claims = await verifyFirebaseIdToken(token, env.FIREBASE_PROJECT_ID);
    return { uid: claims.user_id || claims.sub, email: claims.email, claims };
  } catch (e) {
    return { error: `invalid token: ${e.message}`, status: 401 };
  }
}

// ── Routes ──────────────────────────────────────────────
async function handleHealth(request, env) {
  // Простой ping — без auth. Проверяет что worker жив и D1 отвечает.
  try {
    const { results } = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM contacts"
    ).all();
    return json({
      ok: true,
      worker: "pllato-elc-worker",
      d1: { binding: "DB", contacts: results[0]?.n ?? null },
      time: new Date().toISOString(),
    }, 200, request);
  } catch (e) {
    return json({ ok: false, error: e.message }, 500, request);
  }
}

async function handleMe(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ ok: false, error: auth.error }, auth.status, request);
  // Подтянем профиль из D1 по uid
  const { results } = await env.DB.prepare(
    "SELECT uid, email, name, last_name, position, active, photo FROM users WHERE uid = ?"
  ).bind(auth.uid).all();
  return json({
    ok: true,
    uid: auth.uid,
    email: auth.email,
    profile: results[0] ?? null,
  }, 200, request);
}

// ── Main dispatcher ─────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Public
    if (path === "/health" && request.method === "GET") {
      return handleHealth(request, env);
    }

    // Auth-required
    if (path === "/api/me" && request.method === "GET") {
      return handleMe(request, env);
    }

    // TODO Phase 2: /api/contacts, /api/deals, /api/tasks, ...
    return json({ ok: false, error: "not found", path }, 404, request);
  },
};
