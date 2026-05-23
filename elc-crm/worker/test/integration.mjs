#!/usr/bin/env node

import crypto from "node:crypto";

const API_BASE = String(process.env.API_BASE || "https://pllato-comm.uurraa.workers.dev").replace(/\/+$/, "");
const JWT_SECRET = String(process.env.JWT_SECRET || "").trim();
const TEST_EMAIL = String(process.env.TEST_EMAIL || "uurraa@gmail.com").toLowerCase().trim();

if (!JWT_SECRET) {
  console.error("ERR: set JWT_SECRET env before run");
  process.exit(1);
}

function b64url(value) {
  const input = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");
  return input.toString("base64url");
}

function signHs256(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = b64url(JSON.stringify(header));
  const encodedPayload = b64url(JSON.stringify(payload));
  const signedPart = `${encodedHeader}.${encodedPayload}`;
  const sig = crypto.createHmac("sha256", secret).update(signedPart).digest("base64url");
  return `${signedPart}.${sig}`;
}

function makeToken() {
  const now = Math.floor(Date.now() / 1000);
  return signHs256(
    {
      iss: "pllato-crm",
      sub: "u_root",
      email: TEST_EMAIL,
      name: "pllato",
      isAdmin: true,
      isSuperAdmin: true,
      apps: { pllato_crm: true, team_crm: true },
      iat: now - 10,
      exp: now + 3600,
    },
    JWT_SECRET,
  );
}

const token = makeToken();

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let parsed;
  try {
    parsed = await res.json();
  } catch {
    const text = await res.text();
    throw new Error(`${method} ${path} -> ${res.status} (non-json): ${text.slice(0, 400)}`);
  }

  if (!res.ok || parsed?.ok === false) {
    throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(parsed)}`);
  }
  return parsed;
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

async function run() {
  let passed = 0;
  const testCollection = "__migration_test__";
  const id = `migration02_${Date.now()}`;
  const ts = Date.now();
  const item = { id, title: "MIGRATION-02", status: "ok", createdAt: ts, updatedAt: ts };

  const pushUpsert = await api("/store/push", {
    method: "POST",
    body: {
      ops: [{ type: "upsert", collection: testCollection, item }],
    },
  });
  assert(pushUpsert.applied === 1, "store/push upsert: applied !== 1");
  passed += 1;

  const pullWithRow = await api("/store/pull", {
    method: "POST",
    body: { collections: [testCollection], limitPerCollection: 20 },
  });
  const afterUpsert = Array.isArray(pullWithRow?.collections?.[testCollection])
    ? pullWithRow.collections[testCollection]
    : [];
  assert(afterUpsert.some((x) => x && x.id === id), "store/pull: upserted item not found");
  passed += 1;

  const pushDelete = await api("/store/push", {
    method: "POST",
    body: {
      ops: [{ type: "delete", collection: testCollection, id }],
    },
  });
  assert(pushDelete.applied === 1, "store/push delete: applied !== 1");
  passed += 1;

  const pullAfterDelete = await api("/store/pull", {
    method: "POST",
    body: { collections: [testCollection], limitPerCollection: 20 },
  });
  const afterDelete = Array.isArray(pullAfterDelete?.collections?.[testCollection])
    ? pullAfterDelete.collections[testCollection]
    : [];
  assert(!afterDelete.some((x) => x && x.id === id), "store/pull: deleted item still exists");
  passed += 1;

  const me = await api("/me");
  assert(String(me?.user?.email || "").toLowerCase() === TEST_EMAIL, "/me: wrong email");
  assert(Boolean(me?.user?.isSuperAdmin), "/me: expected isSuperAdmin=true");
  passed += 1;

  const users = await api("/users/list");
  assert(Array.isArray(users?.users), "/users/list: users is not array");
  assert(users.users.some((u) => String(u?.email || "").toLowerCase() === TEST_EMAIL), "/users/list: uurraa user not found");
  passed += 1;

  const channels = await api("/channels/list");
  assert(Array.isArray(channels?.channels), "/channels/list: channels is not array");
  passed += 1;

  console.log(`OK: ${passed}/7 passed`);
}

run().catch((err) => {
  console.error(`FAIL: ${err.message}`);
  process.exit(1);
});
