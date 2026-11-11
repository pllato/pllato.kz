import { sendWebPush } from '../elc-worker/webpush.js';
import { assessSubmission } from './assessment.js';
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
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-HR-Team",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Cache-Control":"no-store",
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
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(request) });
    if (path === "/api/hr/health") return json({ ok: true, ts: nowISO() }, 200, request);

    try {
      if(path==='/api/hr/attempt' && request.method==='POST'){
        const b=await request.json();
        if(b.id){
          if(!/^[a-f0-9-]{36}$/.test(b.id)||typeof b.token!=='string')return json({error:'Неверная сессия'},400,request);
          const result=await env.DB.prepare("UPDATE hr_attempts SET progress=?,updated_at=? WHERE id=? AND token=? AND status='in_progress'").bind(Math.max(0,Math.min(99,Number(b.progress)||0)),nowISO(),b.id,b.token).run();
          return json({ok:true},200,request);
        }
        const phone=String(b.phone||'').replace(/[^0-9]/g,'');
        if(!['personality','iq','full'].includes(b.stage)||!['manager','sales','itr','worker'].includes(b.fam)||phone.length<10||phone.length>15||!String(b.name||'').trim())return json({error:'Укажите имя и телефон'},400,request);
        const id=crypto.randomUUID(),token=crypto.randomUUID();
        await env.DB.prepare("INSERT INTO hr_attempts(id,token,name,phone,fam,stage,status,progress,started_at,updated_at) VALUES(?,?,?,?,?,?,'in_progress',0,?,?)").bind(id,token,String(b.name).slice(0,120),phone,b.fam,b.stage,nowISO(),nowISO()).run();
        return json({ok:true,id,token},200,request);
      }
      // ---------- ПУБЛИЧНО: приём заявки кандидата ----------
      if (path === "/api/hr/submit" && request.method === "POST") {
        const b = await request.json();
        if (!b.phone || !b.fam || !b.code) return json({ error: "Нужны phone, fam, code" }, 400, request);
        // одна запись на телефон+должность+этап: повторное прохождение этапа обновляет результат,
        // но решение/заметки/интервью ответственного НЕ затираются.
        let assessment;
        try{assessment=assessSubmission(b)}catch(e){return json({error:e.message},400,request)}
        const stage=assessment.stage;
        const id = sanId(b.phone) + "_" + sanId(b.fam) + "_" + stage;
        const status=assessment.status;
        const previous=await env.DB.prepare('SELECT code FROM submissions WHERE id=?').bind(id).first();
        if(previous?.code===b.code){
          if(b.attempt?.id && b.attempt?.token)await env.DB.prepare("UPDATE hr_attempts SET status='completed',progress=100,updated_at=? WHERE id=? AND token=?").bind(nowISO(),b.attempt.id,b.attempt.token).run();
          return json({ok:true,id,status,fit:assessment.fit},200,request);
        }
        await env.DB.prepare(
          "INSERT INTO submissions (id,name,phone,email,fam,stage,kp,status,fit,code,submitted_at,updated_at) " +
          "VALUES (?,?,?,?,?,?,?,?,?,?,?,?) " +
          "ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email,kp=excluded.kp,status=excluded.status," +
          "fit=excluded.fit,code=excluded.code,submitted_at=excluded.submitted_at,updated_at=excluded.updated_at,reviewed_at=NULL"
        ).bind(
          id, (b.name || "").slice(0, 120), sanId(b.phone), String(b.email || "").slice(0, 160), sanId(b.fam), stage, b.kp || null,
          status, assessment.fit, String(b.code).slice(0, 20000), nowISO(), nowISO()
        ).run();
        if(b.attempt?.id && b.attempt?.token)await env.DB.prepare("UPDATE hr_attempts SET status='completed',progress=100,updated_at=? WHERE id=? AND token=?").bind(nowISO(),b.attempt.id,b.attempt.token).run();
        if(ctx)ctx.waitUntil(notifyCompletion(env,id,stage).catch(()=>{}));
        return json({ ok: true, id, status, fit:assessment.fit }, 200, request);
      }

      // ---------- Проверка пароля команды ----------
      if (path === "/api/hr/login" && request.method === "POST") {
        const b = await request.json().catch(() => ({}));
        if (b.password && env.HR_TEAM_PASSWORD && b.password === env.HR_TEAM_PASSWORD) return json({ ok: true }, 200, request);
        return json({ error: "Неверный пароль" }, 401, request);
      }

      // ---------- Дальше — только с паролем ----------
      if (!teamOK(request, env)) return json({ error: "Нужен пароль команды" }, 401, request);

      if(path==='/api/hr/summary'&&request.method==='GET'){
        const row=await env.DB.prepare("SELECT COUNT(*) AS total,SUM(CASE WHEN reviewed_at IS NULL AND decision IS NULL THEN 1 ELSE 0 END) AS pending,SUM(CASE WHEN reviewed_at IS NULL AND decision IS NULL AND stage='personality' THEN 1 ELSE 0 END) AS personality FROM submissions").first();
        return json({ok:true,...row},200,request);
      }
      if(path==='/api/hr/push/key'&&request.method==='GET')return json({key:env.VAPID_PUBLIC_KEY||null},200,request);
      if(path==='/api/hr/push/subscribe'&&request.method==='POST'){
        const b=await request.json();let u;try{u=new URL(b.endpoint)}catch{return json({error:'Некорректная подписка'},400,request)}
        if(u.protocol!=='https:'||!/(^|\.)(push\.services\.mozilla\.com|fcm\.googleapis\.com|web\.push\.apple\.com|notify\.windows\.com)$/.test(u.hostname)||u.port||u.username||u.password||!/^[-_A-Za-z0-9]{80,100}$/.test(b.keys?.p256dh||'')||!/^[-_A-Za-z0-9]{20,30}$/.test(b.keys?.auth||''))return json({error:'Неподдерживаемая подписка'},400,request);
        await env.DB.prepare('INSERT INTO hr_push_subscriptions(endpoint,p256dh,auth,created_at) VALUES(?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET p256dh=excluded.p256dh,auth=excluded.auth').bind(b.endpoint,b.keys.p256dh,b.keys.auth,nowISO()).run();return json({ok:true},200,request);
      }
      if (path === "/api/hr/submissions" && request.method === "GET") {
        const rows = await env.DB.prepare(
          "SELECT id,name,phone,email,fam,stage,kp,status,fit,reviewed_at,decision,notes,interview,submitted_at,updated_at,updated_by FROM submissions ORDER BY submitted_at DESC"
        ).all();
        const attempts=await env.DB.prepare("SELECT id,name,phone,fam,stage,status,progress,started_at AS submitted_at,updated_at FROM hr_attempts WHERE status='in_progress' AND julianday(updated_at) > julianday('now','-7 days') ORDER BY updated_at DESC").all();
        return json({ items: [...(rows.results||[]),...(attempts.results||[])] },200,request);
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
        if(b.reviewed===true){fields.push("reviewed_at=?");vals.push(nowISO());}
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

async function notifyCompletion(env,id,stage){
 if(!env.VAPID_PRIVATE_JWK)return;
 const result=await env.DB.prepare('SELECT endpoint,p256dh,auth FROM hr_push_subscriptions LIMIT 100').all();
 const title=stage==='personality'?'Завершён личностный тест':stage==='iq'?'Завершён тест IQ':'Завершена анкета';
 await Promise.allSettled((result.results||[]).map(async sub=>{const sent=await sendWebPush(env,sub,{title:'Pllato · '+title,body:'Новый результат кандидата ожидает проверки.',url:'/app/hr/admin.html?candidate='+encodeURIComponent(id),tag:'hr-'+id});if(sent.status===404||sent.status===410)await env.DB.prepare('DELETE FROM hr_push_subscriptions WHERE endpoint=?').bind(sub.endpoint).run()}));
}
