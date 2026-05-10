/**
 * Pllato Backend — Cloudflare Worker (упрощённая версия)
 *
 * Auth теперь через Google OAuth на клиенте — Worker нужен только для опросов.
 *
 * Endpoints:
 *   POST /api/session/create   — создать сессию опроса
 *   POST /api/session/save     — обновить состояние сессии
 *   GET  /api/session/get      — получить состояние сессии
 *
 * KV NAMESPACE:
 *   SESSIONS — для опросов (привязан к PLLATO_SESSIONS)
 *
 * Если у вас остались USERS и TOKENS — можно их удалить или оставить, не повлияет.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

function generateId(length = 5) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

const SESSION_TTL_SECONDS = 86400;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === '/api/session/create' && request.method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch (e) {}

      const sessionId = generateId(5);
      const session = {
        id: sessionId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        clientName: body.clientName || '',
        clientPhone: body.clientPhone || '',
        currentStep: 1,
        answers: {},
        completed: false,
      };

      await env.SESSIONS.put(sessionId, JSON.stringify(session), {
        expirationTtl: SESSION_TTL_SECONDS,
      });

      return jsonResponse({ ok: true, sessionId });
    }

    if (url.pathname === '/api/session/save' && request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch (e) {
        return jsonResponse({ ok: false, error: 'Invalid JSON' }, 400);
      }

      const { sessionId, currentStep, answers, completed } = body;
      if (!sessionId || typeof sessionId !== 'string') {
        return jsonResponse({ ok: false, error: 'Missing sessionId' }, 400);
      }

      const existing = await env.SESSIONS.get(sessionId);
      if (!existing) {
        return jsonResponse({ ok: false, error: 'Session not found or expired' }, 404);
      }

      const session = JSON.parse(existing);
      if (typeof currentStep === 'number') session.currentStep = currentStep;
      if (answers && typeof answers === 'object') session.answers = answers;
      if (completed === true) session.completed = true;
      session.updatedAt = Date.now();

      await env.SESSIONS.put(sessionId, JSON.stringify(session), {
        expirationTtl: SESSION_TTL_SECONDS,
      });

      return jsonResponse({ ok: true });
    }

    if (url.pathname === '/api/session/get' && request.method === 'GET') {
      const sessionId = url.searchParams.get('id');
      if (!sessionId) {
        return jsonResponse({ ok: false, error: 'Missing id param' }, 400);
      }

      const existing = await env.SESSIONS.get(sessionId);
      if (!existing) {
        return jsonResponse({ ok: false, error: 'Session not found or expired' }, 404);
      }

      return jsonResponse({ ok: true, session: JSON.parse(existing) });
    }

    return jsonResponse({
      ok: true,
      service: 'pllato-research',
      version: '1.0',
      endpoints: [
        'POST /api/session/create',
        'POST /api/session/save',
        'GET /api/session/get?id=XXXX',
      ],
    });
  },
};
