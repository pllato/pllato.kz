/* pllato-hr-worker — воронка найма.
   • Кандидат (публично, без входа): POST /api/hr/submit — присылает заявку с результатом.
   • Ответственный/команда (по паролю HR_TEAM_PASSWORD в заголовке X-HR-Team):
     GET /api/hr/submissions, PATCH/DELETE /api/hr/submission/:id, GET/PUT /api/hr/settings.
   Хранилище — Cloudflare D1 (pllato-hr-d1). Никакого Firebase. */

const nowISO = () => new Date().toISOString();

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-HR-Team",
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
function sanId(s) { return String(s || "").replace(/[^0-9a-zA-Zа-яА-Я_+-]/g, "").slice(0, 60); }
function teamOK(request, env) {
  const pw = request.headers.get("X-HR-Team") || "";
  return !!env.HR_TEAM_PASSWORD && pw === env.HR_TEAM_PASSWORD;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(request) });
    if (path === "/api/hr/health") return json({ ok: true, ts: nowISO() }, 200, request);

    try {
      // ---------- ПУБЛИЧНО: приём заявки кандидата ----------
      if (path === "/api/hr/submit" && request.method === "POST") {
        const b = await request.json();
        if (!b.phone || !b.fam || !b.code) return json({ error: "Нужны phone, fam, code" }, 400, request);
        // одна запись на телефон+должность+этап: повторное прохождение этапа обновляет результат,
        // но решение/заметки/интервью ответственного НЕ затираются.
        const stage = ["personality", "iq", "full"].includes(b.stage) ? b.stage : "full";
        const id = sanId(b.phone) + "_" + sanId(b.fam) + "_" + stage;
        const status = ["review", "passed", "failed"].includes(b.status) ? b.status : "failed";
        await env.DB.prepare(
          "INSERT INTO submissions (id,name,phone,email,fam,stage,kp,status,fit,code,submitted_at,updated_at) " +
          "VALUES (?,?,?,?,?,?,?,?,?,?,?,?) " +
          "ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email,kp=excluded.kp,status=excluded.status," +
          "fit=excluded.fit,code=excluded.code,submitted_at=excluded.submitted_at,updated_at=excluded.updated_at"
        ).bind(
          id, (b.name || "").slice(0, 120), sanId(b.phone), String(b.email || "").slice(0, 160), sanId(b.fam), stage, b.kp || null,
          status, b.fit == null ? null : (b.fit | 0), String(b.code).slice(0, 20000), nowISO(), nowISO()
        ).run();
        return json({ ok: true, id, status }, 200, request);
      }

      // ---------- Проверка пароля команды ----------
      if (path === "/api/hr/login" && request.method === "POST") {
        const b = await request.json().catch(() => ({}));
        if (b.password && env.HR_TEAM_PASSWORD && b.password === env.HR_TEAM_PASSWORD) return json({ ok: true }, 200, request);
        return json({ error: "Неверный пароль" }, 401, request);
      }

      // ---------- Дальше — только с паролем ----------
      if (!teamOK(request, env)) return json({ error: "Нужен пароль команды" }, 401, request);

      if (path === "/api/hr/submissions" && request.method === "GET") {
        const rows = await env.DB.prepare(
          "SELECT id,name,phone,email,fam,stage,kp,status,fit,decision,notes,interview,submitted_at,updated_at,updated_by FROM submissions ORDER BY submitted_at DESC"
        ).all();
        return json({ items: rows.results || [] }, 200, request);
      }

      // одна заявка целиком (с кодом — для полного разбора в панели)
      const gm = path.match(/^\/api\/hr\/submission\/([^/]+)$/);
      if (gm && request.method === "GET") {
        const row = await env.DB.prepare("SELECT * FROM submissions WHERE id = ?").bind(decodeURIComponent(gm[1])).first();
        return json({ item: row || null }, 200, request);
      }
      if (gm && request.method === "PATCH") {
        const id = decodeURIComponent(gm[1]);
        const b = await request.json();
        const fields = [], vals = [];
        if (b.decision !== undefined) { fields.push("decision=?"); vals.push(b.decision || null); }
        if (b.notes !== undefined) { fields.push("notes=?"); vals.push((b.notes || "").slice(0, 8000)); }
        if (b.interview !== undefined) { fields.push("interview=?"); vals.push(JSON.stringify(b.interview)); }
        if (b.name !== undefined) { fields.push("name=?"); vals.push((b.name || "").slice(0, 120)); }
        if (!fields.length) return json({ error: "Нечего обновлять" }, 400, request);
        fields.push("updated_at=?"); vals.push(nowISO());
        fields.push("updated_by=?"); vals.push((b.by || "команда").slice(0, 60));
        vals.push(id);
        await env.DB.prepare("UPDATE submissions SET " + fields.join(",") + " WHERE id = ?").bind(...vals).run();
        return json({ ok: true }, 200, request);
      }
      if (gm && request.method === "DELETE") {
        await env.DB.prepare("DELETE FROM submissions WHERE id = ?").bind(decodeURIComponent(gm[1])).run();
        return json({ ok: true }, 200, request);
      }

      if (path === "/api/hr/settings" && request.method === "GET") {
        const row = await env.DB.prepare("SELECT data FROM settings WHERE id='global'").first();
        return json({ settings: row ? JSON.parse(row.data) : {} }, 200, request);
      }
      if (path === "/api/hr/settings" && request.method === "PUT") {
        const s = await request.json();
        await env.DB.prepare(
          "INSERT INTO settings (id,data,updated_at) VALUES ('global',?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at"
        ).bind(JSON.stringify(s), nowISO()).run();
        return json({ ok: true }, 200, request);
      }

      return json({ error: "Не найдено: " + path }, 404, request);
    } catch (e) {
      return json({ error: "Ошибка сервера: " + e.message }, 500, request);
    }
  },
};
