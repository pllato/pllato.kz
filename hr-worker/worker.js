// ── Pllato HR Worker ─────────────────────────────────────
// Хранилище оценок кандидатов для HR-панели (app/hr/admin.html).
// Auth: Firebase ID token (Google Sign-In), тот же проект pllato-crm, что и CRM.
// Доступ: только e-mail из HR_ALLOWED_EMAILS (+ uurraa@gmail.com).
// Данные: D1 (pllato-hr-d1). Кандидатский тест (app/hr/index.html) сюда НЕ ходит —
// он публичный и отдаёт код, который работодатель вставляет в панель.

import { jwtVerify, createRemoteJWKSet } from "jose";

const ALLOWED_ORIGINS = new Set([
  "https://pllato.kz",
  "https://www.pllato.kz",
  "http://localhost:8779",
  "http://localhost:8765",
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
]);

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

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
function json(data, status, request) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(request) },
  });
}

async function verifyFirebaseIdToken(token, projectId) {
  const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  return payload;
}

// Проверяет токен И что e-mail входит в команду (таблица team или владелец).
async function requireTeam(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return { error: "Нужен вход (нет токена)", status: 401 };
  let claims;
  try { claims = await verifyFirebaseIdToken(token, env.FIREBASE_PROJECT_ID); }
  catch (e) { return { error: "Недействительный токен: " + e.message, status: 401 }; }
  const email = (claims.email || "").toLowerCase().trim();
  if (!email) return { error: "В аккаунте нет e-mail", status: 403 };
  const owner = (env.HR_OWNER_EMAIL || "").toLowerCase().trim();
  const isOwner = email === owner;
  let member = null;
  if (!isOwner) member = await env.DB.prepare("SELECT email, role FROM team WHERE email = ?").bind(email).first();
  if (!isOwner && !member) {
    return { error: "Нет доступа к HR-панели для " + email + ". Попросите администратора добавить вас.", status: 403 };
  }
  return { email, uid: claims.user_id || claims.sub, isAdmin: isOwner || (member && member.role === "admin"), isOwner };
}

const nowISO = () => new Date().toISOString();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "");
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
    if (path === "/api/hr/health") return json({ ok: true, service: "pllato-hr-worker" }, 200, request);

    const me = await requireTeam(request, env);
    if (me.error) return json({ error: me.error }, me.status, request);

    try {
      // /api/hr/me — кто я и админ ли
      if (path === "/api/hr/me" && request.method === "GET") {
        return json({ email: me.email, isAdmin: me.isAdmin, isOwner: me.isOwner }, 200, request);
      }
      // /api/hr/team — управление командой (список — все, изменения — только админ)
      if (path === "/api/hr/team") {
        if (request.method === "GET") {
          const rows = await env.DB.prepare("SELECT email, name, role, added_by, added_at FROM team ORDER BY added_at").all();
          const owner = (env.HR_OWNER_EMAIL || "").toLowerCase().trim();
          const items = (rows.results || []).slice();
          if (owner && !items.some(r => r.email === owner)) items.unshift({ email: owner, name: "Владелец", role: "admin", added_by: "—", added_at: "" });
          return json({ items, isAdmin: me.isAdmin }, 200, request);
        }
        if (request.method === "POST") {
          if (!me.isAdmin) return json({ error: "Добавлять сотрудников может только админ" }, 403, request);
          const b = await request.json();
          const email = (b.email || "").toLowerCase().trim();
          if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Неверный e-mail" }, 400, request);
          const role = b.role === "admin" ? "admin" : "member";
          await env.DB.prepare(
            "INSERT INTO team (email,name,role,added_by,added_at) VALUES (?,?,?,?,?) " +
            "ON CONFLICT(email) DO UPDATE SET name=excluded.name, role=excluded.role"
          ).bind(email, b.name || null, role, me.email, nowISO()).run();
          return json({ ok: true }, 200, request);
        }
      }
      const tm = path.match(/^\/api\/hr\/team\/(.+)$/);
      if (tm && request.method === "DELETE") {
        if (!me.isAdmin) return json({ error: "Удалять может только админ" }, 403, request);
        const email = decodeURIComponent(tm[1]).toLowerCase().trim();
        if (email === (env.HR_OWNER_EMAIL || "").toLowerCase().trim()) return json({ error: "Владельца нельзя удалить" }, 400, request);
        await env.DB.prepare("DELETE FROM team WHERE email = ?").bind(email).run();
        return json({ ok: true }, 200, request);
      }
      // /api/hr/candidates  (список)
      if (path === "/api/hr/candidates" && request.method === "GET") {
        const rows = await env.DB.prepare("SELECT data FROM candidates ORDER BY updated_at DESC").all();
        const items = (rows.results || []).map(r => { try { return JSON.parse(r.data); } catch (e) { return null; } }).filter(Boolean);
        return json({ items }, 200, request);
      }
      // /api/hr/candidate/{id}
      const cm = path.match(/^\/api\/hr\/candidate\/([A-Za-z0-9_-]+)$/);
      if (cm) {
        const id = cm[1];
        if (request.method === "GET") {
          const row = await env.DB.prepare("SELECT data FROM candidates WHERE id = ?").bind(id).first();
          return json({ item: row ? JSON.parse(row.data) : null }, 200, request);
        }
        if (request.method === "PUT") {
          const rec = await request.json();
          rec.id = id; rec.updatedAt = nowISO(); rec.updatedBy = me.email;
          await env.DB.prepare(
            "INSERT INTO candidates (id,fam,name,fit,decision,data,updated_at,updated_by) VALUES (?,?,?,?,?,?,?,?) " +
            "ON CONFLICT(id) DO UPDATE SET fam=excluded.fam,name=excluded.name,fit=excluded.fit,decision=excluded.decision,data=excluded.data,updated_at=excluded.updated_at,updated_by=excluded.updated_by"
          ).bind(id, rec.fam || null, rec.name || null, rec.fit == null ? null : rec.fit, rec.decision || null, JSON.stringify(rec), rec.updatedAt, me.email).run();
          return json({ item: rec }, 200, request);
        }
        if (request.method === "DELETE") {
          await env.DB.prepare("DELETE FROM candidates WHERE id = ?").bind(id).run();
          return json({ ok: true }, 200, request);
        }
      }
      // /api/hr/settings
      if (path === "/api/hr/settings") {
        if (request.method === "GET") {
          const row = await env.DB.prepare("SELECT data FROM settings WHERE id = 'global'").first();
          return json({ settings: row ? JSON.parse(row.data) : {} }, 200, request);
        }
        if (request.method === "PUT") {
          const s = await request.json();
          await env.DB.prepare(
            "INSERT INTO settings (id,data,updated_at,updated_by) VALUES ('global',?,?,?) " +
            "ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at,updated_by=excluded.updated_by"
          ).bind(JSON.stringify(s), nowISO(), me.email).run();
          return json({ ok: true }, 200, request);
        }
      }
      return json({ error: "not found" }, 404, request);
    } catch (e) {
      return json({ error: "server: " + e.message }, 500, request);
    }
  },
};
