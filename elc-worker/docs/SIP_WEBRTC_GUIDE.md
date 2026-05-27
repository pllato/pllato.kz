# Browser SIP/WebRTC + Binotel-trunk: полный гайд воспроизведения

> **Цель документа:** дать код-агенту (Claude / другому LLM) или новому
> разработчику всё, что нужно для подключения браузерной телефонии
> (click-to-call с двусторонним голосом) к любой CRM. Решение
> воспроизводимое: 1 VM + 1 Cloudflare Worker + 1 файл shared-frontend.
>
> Базируется на реальном production-опыте: ELC CRM (`pllato.kz/team.html`)
> и Aminamed CRM (`crm.aminamed.kz`). Оба используют один shared module.
>
> **Что получите на выходе:**
> - В карточке контакта/сделки кнопка 📞 → открывается dialer
> - Звонок идёт через ваш SIP-trunk (Binotel/Mango/UIS/Zadarma) в обычную PSTN
> - Двусторонний голос в браузере, DTMF, mute/hold, входящие звонки
> - Auto-reconnect при обрыве сети
> - Один shared JS-модуль, переиспользуемый между CRM

---

## 0. Архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│ BROWSER (Chrome/Safari/Firefox)                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ CRM HTML (ваш фронт)                                       │ │
│  │   import { createSipClient } from                          │ │
│  │     'https://YOUR-WORKER.workers.dev/sip-client.js'        │ │
│  │   sip = createSipClient({ tokenEndpoint, getAuthToken })   │ │
│  │   sip.call('77011239999')                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  WebSocket WSS:8089 + RTP/SRTP UDP (ICE)                        │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ CLOUDFLARE WORKER                                                │
│  • GET /sip-client.js — static asset (CORS *)                   │
│  • GET /api/sip/token — выдаёт SIP-креды после auth             │
│  • (опционально) /api/call/event, /api/call/log                 │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼ HTTPS (auth-gated)
┌─────────────────────────────────────────────────────────────────┐
│ VM с публичным IP (Hetzner CPX42 / Google Cloud e2-micro)        │
│  • Asterisk 22 LTS                                               │
│  • Let's Encrypt cert                                            │
│  • transport-wss:8089 (для браузера, DTLS-SRTP)                  │
│  • transport-udp:5060 (для SIP-trunk провайдера)                 │
│  • RTP 10000-20000 UDP                                           │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼ SIP UDP:5060 + RTP
┌─────────────────────────────────────────────────────────────────┐
│ SIP-TRUNK ПРОВАЙДЕР (Binotel / Mango / UIS / Zadarma)            │
│  → PSTN (обычная мобильная/стационарная связь)                  │
└─────────────────────────────────────────────────────────────────┘
```

**Ключевые принципы:**
1. **VM с прямым public IP** — NAT убивает WebRTC. Oracle Cloud Free Tier
   подходит только для эксперимента, в продакшене не работает из-за 1:1 NAT.
2. **Shared frontend module** — один JS-файл, хостится на Worker, импортируется
   всеми CRM. При обновлении достаточно одного `wrangler deploy`.
3. **Per-tenant secrets** — каждый CRM-worker хранит свои SIP-креды
   (endpoint, password, TURN). Frontend получает их через auth-gated endpoint.

---

## 1. Что нужно подготовить

| Компонент | Зачем | Стоимость |
|---|---|---|
| **SIP-trunk** (Binotel / Mango / UIS / Zadarma) | Связь с реальными телефонами | от $5/мес + минуты |
| **VM с public IP** (Hetzner CPX42 / Google Cloud e2-micro) | Хост Asterisk | €4-6/мес или $0 |
| **Домен или nip.io** | Для Let's Encrypt cert (нужен FQDN, не IP) | $0 (nip.io бесплатен) |
| **Cloudflare аккаунт** | Worker для frontend + token endpoint | $0 на free-tier |
| **Аккаунт metered.ca** (опционально) | External TURN если operators за NAT | $0 на 50GB/мес |
| **Auth-система в вашей CRM** | JWT/Firebase/etc — для защиты `/sip/token` | у вас уже есть |

---

## 2. SIP-trunk: подготовка у провайдера (на примере Binotel)

1. Купить SIP-номер и зайти в кабинет провайдера
2. Создать SIP-аккаунт (внутренний номер), получить:
   - `SIP_USERNAME` (типа `nea9d348`)
   - `SIP_PASSWORD` (генерируется в кабинете)
   - `SIP_SERVER` (типа `sip52.binotel.com`)
   - `SIP_PORT` (обычно `5060`)
3. **Whitelist IP вашей VM** — Binotel/большинство провайдеров требуют это
4. Сохранить креды локально в `~/.secrets/binotel-sip.txt`:
   ```
   SIP_USERNAME=nea9d348
   SIP_PASSWORD=<пароль>
   SIP_SERVER=sip52.binotel.com
   SIP_PORT=5060
   ```

---

## 3. VM: подготовка инфраструктуры

### 3.1. Создать VM
Рекомендую **Hetzner CPX42** (€4/мес, прямой IP во Франкфурте, низкий пинг СНГ).

Альтернатива: Google Cloud `e2-micro` Always Free — но +170ms пинг и 1GB RAM
впритык. Oracle Cloud Free **не работает** из-за 1:1 NAT.

Образ: **Ubuntu 22.04 LTS**.

### 3.2. Открыть порты в firewall провайдера + ufw

```bash
sudo ufw allow 22/tcp        # SSH
sudo ufw allow 80/tcp        # Let's Encrypt http-01
sudo ufw allow 443/tcp       # HTTPS (резерв)
sudo ufw allow 8089/tcp      # Asterisk WSS
sudo ufw allow 5060/udp      # SIP signaling к провайдеру
sudo ufw allow 10000:20000/udp  # RTP (медиа)
sudo ufw allow 3478/udp      # STUN/TURN (если ставим coturn локально)
sudo ufw enable
```

### 3.3. DNS

Asterisk требует FQDN для Let's Encrypt и WSS. Простейший способ — **nip.io**:

`<dotted-public-ip>.nip.io` автоматически резолвится в этот IP. Пример: IP `178.105.90.157` → домен `178-105-90-157.nip.io`.

Дефис вместо точек важен — для wildcard cert.

> **Не использовать `sslip.io`** — у них rate-limit на Let's Encrypt, упрётесь
> при первой же выдаче сертификата. `nip.io` без rate-limit.

---

## 4. Asterisk: установка и конфигурация

### 4.1. Установка Asterisk 22 LTS из исходников

Стандартный `apt install asterisk` ставит старую версию (18 на Ubuntu 22.04). Для WebRTC рекомендуется 22.

```bash
sudo apt update
sudo apt install -y build-essential wget libssl-dev libsrtp2-dev \
    libjansson-dev libxml2-dev libsqlite3-dev libedit-dev libncurses-dev \
    pkg-config uuid-dev libsystemd-dev

# Скачать Asterisk 22 LTS
cd /usr/src
sudo wget https://downloads.asterisk.org/pub/telephony/asterisk/asterisk-22-current.tar.gz
sudo tar xzf asterisk-22-current.tar.gz
cd asterisk-22.*

# Конфигурация и сборка (на 8 CPU занимает ~5 мин)
sudo ./configure --with-jansson-bundled --with-pjproject-bundled
sudo make menuselect.makeopts
sudo make -j$(nproc)
sudo make install
sudo make samples
sudo make config

# Создать asterisk user, права на конфиги
sudo useradd -r -d /var/lib/asterisk -g asterisk asterisk 2>/dev/null || true
sudo chown -R asterisk:asterisk /etc/asterisk /var/lib/asterisk /var/log/asterisk /var/spool/asterisk

sudo systemctl enable asterisk
sudo systemctl start asterisk
sudo asterisk -rx 'core show version'
```

### 4.2. Let's Encrypt сертификат

```bash
sudo apt install -y certbot
sudo systemctl stop asterisk    # порт 80 нужен certbot

SIP_DOMAIN="178-105-90-157.nip.io"  # ← ваш nip.io домен
LE_EMAIL="you@example.com"

sudo certbot certonly --standalone --non-interactive --agree-tos \
    -m "$LE_EMAIL" -d "$SIP_DOMAIN" --preferred-challenges http

# Asterisk не может читать LE privkey напрямую (root:root, 600).
# Копируем в /etc/asterisk/keys/ с правами asterisk:
sudo mkdir -p /etc/asterisk/keys
sudo cp /etc/letsencrypt/live/$SIP_DOMAIN/fullchain.pem /etc/asterisk/keys/wss-fullchain.pem
sudo cp /etc/letsencrypt/live/$SIP_DOMAIN/privkey.pem   /etc/asterisk/keys/wss-privkey.pem
sudo chown asterisk:asterisk /etc/asterisk/keys/wss-*
sudo chmod 600 /etc/asterisk/keys/wss-*

# Self-signed cert для DTLS-SRTP (Asterisk не умеет с LE privkey для DTLS)
sudo openssl req -new -x509 -days 3650 -nodes \
    -newkey rsa:2048 -keyout /etc/asterisk/keys/dtls.key \
    -out /etc/asterisk/keys/dtls.crt -subj "/CN=$SIP_DOMAIN"
sudo cat /etc/asterisk/keys/dtls.crt /etc/asterisk/keys/dtls.key | sudo tee /etc/asterisk/keys/dtls.pem >/dev/null
sudo chown asterisk:asterisk /etc/asterisk/keys/dtls.*
sudo chmod 600 /etc/asterisk/keys/dtls.*

# Renew hook — обновлять копии после автоматического renew LE
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-sip.sh > /dev/null << EOF
#!/bin/bash
cp /etc/letsencrypt/live/$SIP_DOMAIN/fullchain.pem /etc/asterisk/keys/wss-fullchain.pem
cp /etc/letsencrypt/live/$SIP_DOMAIN/privkey.pem   /etc/asterisk/keys/wss-privkey.pem
chown asterisk:asterisk /etc/asterisk/keys/wss-*
systemctl reload asterisk
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-sip.sh
```

### 4.3. `/etc/asterisk/modules.conf`

**КРИТИЧНО:** добавить `noload => chan_sip.so`. Иначе он перехватывает 5060 и REGISTER не доходит до chan_pjsip → 403 «Wrong password».

```ini
[modules]
autoload=yes
noload => chan_sip.so
```

### 4.4. `/etc/asterisk/http.conf`

```ini
[general]
enabled=yes
bindaddr=0.0.0.0
bindport=8088
tlsenable=yes
tlsbindaddr=0.0.0.0:8089
tlscertfile=/etc/asterisk/keys/wss-fullchain.pem
tlsprivatekey=/etc/asterisk/keys/wss-privkey.pem
```

### 4.5. `/etc/asterisk/rtp.conf`

```ini
[general]
rtpstart=10000
rtpend=20000
icesupport=yes
stunaddr=stun.l.google.com:19302
; turnaddr= НЕ задавать если VM имеет прямой public IP (Hetzner, GCP).
; Нужен только при NAT (Oracle), но там вообще ничего не работает.
```

### 4.6. `/etc/asterisk/pjsip.conf` — шаблон для одного клиента

Замените плейсхолдеры:
- `<SIP_DOMAIN>` — например `178-105-90-157.nip.io`
- `<ENDPOINT_PASSWORD>` — сгенерируйте `openssl rand -hex 16`
- `<BINOTEL_USERNAME>`, `<BINOTEL_PASSWORD>`, `<BINOTEL_SERVER>`, `<BINOTEL_PORT>` — из `~/.secrets/binotel-sip.txt`

```ini
[global]
type=global
endpoint_identifier_order=username,ip

;=== Транспорт для браузера (WSS) ===
[transport-wss]
type=transport
protocol=wss
bind=0.0.0.0:8089
cert_file=/etc/asterisk/keys/wss-fullchain.pem
priv_key_file=/etc/asterisk/keys/wss-privkey.pem

;=== Транспорт для SIP-trunk провайдера (UDP) ===
[transport-udp]
type=transport
protocol=udp
bind=0.0.0.0:5060

;========== BROWSER ENDPOINT (operator: 100) ==========
[100-auth]
type=auth
auth_type=userpass
username=100
password=<ENDPOINT_PASSWORD>

[100]
type=endpoint
transport=transport-wss
context=from-internal
disallow=all
; КРИТИЧНО: только alaw,ulaw (без opus). У Asterisk без коммерческого
; codec_opus.so от Digium НЕТ транскодинга opus↔alaw. Binotel отдаёт alaw.
; Если оставить opus — 603 Decline сразу после answer:
;   "No path to translate (alaw) -> (opus)"
allow=alaw,ulaw
auth=100-auth
aors=100
webrtc=yes
dtls_cert_file=/etc/asterisk/keys/dtls.pem
dtls_private_key=/etc/asterisk/keys/dtls.pem
dtls_setup=actpass
dtls_verify=fingerprint
ice_support=yes
media_use_received_transport=yes
rtcp_mux=yes

[100]
type=aor
max_contacts=5      ; до 5 одновременных регистраций (5 операторов на endpoint)
remove_existing=yes

;========== SIP-TRUNK К ПРОВАЙДЕРУ ==========
[binotel-auth]
type=auth
auth_type=userpass
username=<BINOTEL_USERNAME>
password=<BINOTEL_PASSWORD>

[binotel]
type=endpoint
transport=transport-udp
context=from-binotel
disallow=all
allow=alaw,ulaw     ; БЕЗ opus — см. комментарий выше
outbound_auth=binotel-auth
aors=binotel
from_user=<BINOTEL_USERNAME>
from_domain=<BINOTEL_SERVER>
direct_media=no

[binotel]
type=aor
contact=sip:<BINOTEL_SERVER>:<BINOTEL_PORT>

[binotel]
type=identify
endpoint=binotel
match=<BINOTEL_SERVER>

[binotel-reg]
type=registration
outbound_auth=binotel-auth
server_uri=sip:<BINOTEL_SERVER>:<BINOTEL_PORT>
client_uri=sip:<BINOTEL_USERNAME>@<BINOTEL_SERVER>
retry_interval=60
```

### 4.7. `/etc/asterisk/extensions.conf`

```ini
[general]
static=yes
writeprotect=no

;=== Браузер → SIP-trunk (исходящие) ===
[from-internal]
exten => _X.,1,NoOp(Outbound: ${EXTEN})
 same => n,Dial(PJSIP/${EXTEN}@binotel,60)
 same => n,Hangup()

;=== SIP-trunk → Браузер (входящие) ===
[from-binotel]
exten => _X.,1,NoOp(Inbound from Binotel)
 same => n,Dial(PJSIP/100,30)
 same => n,Hangup()
```

### 4.8. Запуск и проверка

```bash
sudo systemctl restart asterisk
sleep 2

# Должна быть Registered:
sudo asterisk -rx 'pjsip show registrations'

# Транспорты слушают:
sudo asterisk -rx 'pjsip show transports'
# Ожидаемо: transport-udp:5060 + transport-wss:8089

# Endpoint 100 готов (Unavailable пока браузер не подключится — это норма):
sudo asterisk -rx 'pjsip show endpoint 100'

# Live логи:
sudo journalctl -u asterisk -f
```

---

## 5. (Опционально) External TURN — metered.ca

Если оператор работает из-за корпоративного NAT (симметричный) — host/srflx candidates не сойдутся, нужен TURN-relay.

1. Зарегистрироваться на https://www.metered.ca (50 GB/мес бесплатно)
2. Получить TURN URL/username/credential
3. Сохранить в `~/.secrets/metered-turn.txt`:
   ```
   TURN_URL=turn:standard.relay.metered.ca:80
   TURN_USERNAME=<your-username>
   TURN_PASSWORD=<your-password>
   ```
4. Worker будет передавать эти креды в SDP iceServers (см. шаг 6)

> **Важно:** НЕ выставлять `iceTransportPolicy: 'relay'` в браузере если у
> вашего Asterisk прямой public IP. Иначе браузер форсит relay через TURN,
> Asterisk шлёт RTP на TURN-IP без auth → 603 Decline через ~7 сек.

---

## 6. Cloudflare Worker

### 6.1. Структура

```
your-worker/
├── wrangler.toml
├── worker.js
└── public/
    ├── _headers
    └── sip-client.js   ← shared frontend module (см. шаг 7)
```

### 6.2. `wrangler.toml`

```toml
name = "your-crm-worker"
main = "worker.js"
compatibility_date = "2025-01-01"
account_id = "<your-cf-account-id>"

# Static assets: всё в ./public/ автоматически отдаётся с правильным MIME
[assets]
directory = "./public"
binding = "ASSETS"

[vars]
# Public env vars
```

### 6.3. `worker.js` — token endpoint

Здесь критично — `/sip/token` должен быть **auth-gated** через вашу
authentication (Firebase JWT / pllato JWT / Auth0 / whatever). НЕЛЬЗЯ
отдавать SIP-пароль без проверки.

Пример с Firebase auth (jose library, JWKS):

```javascript
import { jwtVerify, createRemoteJWKSet } from "jose";

const ALLOWED_ORIGINS = new Set([
  "https://your-crm.com",
  "http://localhost:3000",
]);

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : "https://your-crm.com";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

function json(data, status, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(request) },
  });
}

// Замените на свою auth-логику
async function requireAuth(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return { error: "missing Bearer token", status: 401 };
  try {
    // Пример с Firebase:
    const JWKS = createRemoteJWKSet(new URL(
      "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
    ));
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      audience: env.FIREBASE_PROJECT_ID,
    });
    return { uid: payload.user_id, email: payload.email };
  } catch (e) {
    return { error: "invalid token", status: 401 };
  }
}

async function handleSipToken(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);

  const domain = env.SIP_DOMAIN;        // "178-105-90-157.nip.io"
  const user = env.SIP_USER || "100";   // обычно 100, для multi-tenant — 200, 300
  const password = env.SIP_PASSWORD;
  if (!password) {
    return json({ error: "SIP_PASSWORD not configured" }, 500, request);
  }

  // ICE servers: STUN + external TURN (если есть)
  const iceServers = [
    { urls: env.METERED_TURN_URL
        ? "stun:stun.relay.metered.ca:80"
        : `stun:${domain}:3478` },
  ];
  if (env.METERED_TURN_URL && env.METERED_TURN_USERNAME && env.METERED_TURN_PASSWORD) {
    const m = env.METERED_TURN_URL.match(/^turns?:([^:]+)(?::\d+)?/);
    const host = m ? m[1] : "standard.relay.metered.ca";
    iceServers.push({
      urls: [
        `turn:${host}:80`,
        `turn:${host}:80?transport=tcp`,
        `turn:${host}:443`,
        `turns:${host}:443?transport=tcp`,
      ],
      username: env.METERED_TURN_USERNAME,
      credential: env.METERED_TURN_PASSWORD,
    });
  }

  return json({
    user,
    password,
    domain,
    wss: `wss://${domain}:8089/ws`,
    stun: `stun:${domain}:3478`,
    iceServers,
  }, 200, request);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }
    if (url.pathname === "/api/sip/token" && request.method === "GET") {
      return handleSipToken(request, env);
    }
    // Static assets автоматически обслуживаются Cloudflare если path не пойман
    return env.ASSETS.fetch(request);
  },
};
```

### 6.4. `public/_headers` — CORS на static

```
/sip-client.js
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=300
  Content-Type: application/javascript; charset=utf-8
```

### 6.5. Установить secrets и задеплоить

```bash
cd your-worker

# SIP credentials (используя пароль из pjsip.conf endpoint 100)
echo "<ENDPOINT_PASSWORD>" | wrangler secret put SIP_PASSWORD
echo "178-105-90-157.nip.io" | wrangler secret put SIP_DOMAIN
echo "100" | wrangler secret put SIP_USER   # опционально, default 100

# TURN (опционально)
echo "$TURN_URL"   | wrangler secret put METERED_TURN_URL
echo "$TURN_USER"  | wrangler secret put METERED_TURN_USERNAME
echo "$TURN_PASS"  | wrangler secret put METERED_TURN_PASSWORD

# Deploy
wrangler deploy
```

Проверить: `curl https://your-worker.workers.dev/sip-client.js` → 200,
`Content-Type: application/javascript`.

---

## 7. Shared frontend module `public/sip-client.js`

**Это самый большой и важный файл (~830 строк).**

Возьмите готовую копию из репо `pllato/pllato.kz` по пути:
```
elc-worker/public/sip-client.js
```

URL для скачивания production-версии:
```
https://pllato-elc-worker.uurraa.workers.dev/sip-client.js
```

**Что внутри:**
- `createSipClient(config)` — фабрика, возвращает API-объект
- UI: floating bottom-bar, dialer overlay с DTMF/Mute/Hold, incoming popup,
  numpad для ручного набора, call history widget
- Auto-reconnect (`reconnectionAttempts: 100`, `reconnectionDelay: 4`)
- `ensureTransport()` перед каждым outgoing call
- Auto-minimize overlay при Established (через 700ms) — оператор работает
  с карточкой клиента, dialer свёрнут в bottom-bar с таймером
- DTMF через `RTCDTMFSender`
- Mute через `track.enabled`
- Hold (soft) — mute mic + mute speaker

**Не редактируйте этот файл специально для вашего CRM** — он shared. Если
нужен tenant-specific UI, обёртку делайте в своём фронте на стороне CRM.

---

## 8. Frontend интеграция в вашу CRM

### 8.1. Подключение в bootstrap

В точке входа вашей CRM (после успешного login):

```javascript
// app.js или main.js
import { createSipClient } from "https://your-worker.workers.dev/sip-client.js";

let _sipPromise = null;
async function getSipClient() {
  if (_sipPromise) return _sipPromise;
  _sipPromise = createSipClient({
    tokenEndpoint:     "https://your-worker.workers.dev/api/sip/token",
    callEventEndpoint: "https://your-worker.workers.dev/api/call/event",  // optional
    callLogEndpoint:   "https://your-worker.workers.dev/api/call/log",    // optional

    // Получение auth-токена. Должен возвращать "Bearer <token>" или просто token
    getAuthToken: async () => {
      // Пример Firebase:
      const idToken = await firebase.auth().currentUser.getIdToken();
      return `Bearer ${idToken}`;
      // Пример свой JWT:
      // return `Bearer ${localStorage.getItem('jwt')}`;
    },

    // Опционально — резолв контакта по номеру (для caller-id при входящих)
    resolveContact: async (phone) => {
      const r = await fetch(`/api/contacts?q=${phone}`, { ... });
      const data = await r.json();
      const c = data.items?.[0];
      return c ? { id: c.id, name: c.name } : null;
    },

    showBottomBar: true,   // default true
    autoConnect: true,     // pre-warm регистрации при init
    debug: false,
  });
  return _sipPromise;
}

// Pre-warm — UA регистрируется на Asterisk сразу после login,
// первый звонок открывается мгновенно
setTimeout(() => getSipClient().catch(console.warn), 1500);

// Global debug API
window.mySip = new Proxy({}, {
  get: (_, prop) => (...args) => getSipClient().then(c => {
    const v = c[prop];
    return typeof v === "function" ? v.apply(c, args) : v;
  }),
});

// Public placeCall — для inline onclick
async function placeCall(opts) {
  const { phone, contactId, dealId, contactName } = opts;
  const sip = await getSipClient();
  await sip.call(phone, { contactId, dealId, contactName });
}
window.placeCall = placeCall;
```

### 8.2. Кнопка 📞 в карточке контакта/сделки

**КРИТИЧЕСКАЯ ГРАБЛЯ:** не использовать `addEventListener` делегата на
document. Делегат теряет event из-за `stopPropagation` родительских
обработчиков (если кнопка внутри `<tr onclick="openCard()">` или подобной
структуры). Использовать inline `onclick`:

```html
<button onclick="event.stopPropagation();
                 window.placeCall({phone:this.dataset.callPhone,
                                   contactId:this.dataset.callContactid||null,
                                   contactName:this.dataset.callContactname||null});
                 return false;"
        data-call-phone="+77011234567"
        data-call-contactid="123"
        data-call-contactname="Иван Иванов">📞</button>
```

`event.stopPropagation()` блокирует родительский handler (например,
открытие карточки при клике на строку таблицы).
`window.placeCall(...)` запускает звонок сразу в onclick — без делегата.

### 8.3. История звонков в карточке (опционально)

```html
<div id="call-history-<CONTACT_ID>"></div>

<script>
async function loadHistory(contactId) {
  const sip = await getSipClient();
  const target = document.getElementById(`call-history-${contactId}`);
  await sip.renderCallHistory(target, { contactId, limit: 50 });
}
loadHistory(contactId);
</script>
```

(Требует чтобы worker имел `/api/call/log` endpoint с D1-таблицей call_log.
Если у вас уже есть своя схема логирования — используйте свой widget вместо
shared render.)

---

## 9. Все известные грабли (КРИТИЧНО прочитать)

### 9.1. `chan_sip` перехватывает 5060
Asterisk по умолчанию грузит и `chan_sip`, и `chan_pjsip`. Первый
перехватывает REGISTER → 403 «Wrong password» хотя пароль правильный.
**Фикс:** `noload => chan_sip.so` в `/etc/asterisk/modules.conf`.

### 9.2. Codec opus не работает с alaw
У Asterisk нет встроенного `codec_opus.so` (это коммерческий модуль Digium).
Если оставить `allow=opus,ulaw,alaw`, браузер выберет opus, Binotel отдаст
alaw, Asterisk попытается транскодить → **дропнет вызов с 603 Decline сразу
после answer**:
```
WARNING channel.c: Unable to find a codec translation path: (alaw) -> (opus)
WARNING app_dial.c: Had to drop call because I couldn't make
        PJSIP/100 compatible with PJSIP/binotel
```
**Фикс:** `allow=alaw,ulaw` на ОБОИХ endpoints (`100` и `binotel`).
Качество всё равно нормальное (G.711a — стандарт телефонии).

### 9.3. NAT (Oracle Cloud) убивает двусторонний голос
Oracle Cloud делает 1:1 NAT (private IP → public IP). WebRTC ICE не
находит работающий media path даже с external TURN (hairpin issue).
**Не используйте Oracle Cloud для Asterisk.** Hetzner/GCP/AWS с прямым
IP работают.

### 9.4. iceTransportPolicy: 'relay' на прямом IP — баг
Если у Asterisk прямой public IP, НЕ форсить TURN в браузере. Иначе
браузер шлёт candidates только с TURN-IP, Asterisk пытается достучаться
до TURN-IP **без TURN-auth** (у него её нет) → пакеты дропаются →
603 Decline через ~7 сек.
**Фикс:** убрать `iceTransportPolicy: 'relay'`, оставить TURN только
в `iceServers` как fallback (браузер сам выберет relay если host/srflx
не сходятся).

### 9.5. SIP.js не переподключается по умолчанию
`reconnectionAttempts: 0` — дефолт. WebSocket рвётся (sleep ноута,
смена Wi-Fi/4G, code=1006) → UA умирает навсегда до hard reload.
**Фикс:** в transportOptions `reconnectionAttempts: 100,
reconnectionDelay: 4`. После reconnect Registerer всё ещё Unregistered
— нужно вручную re-register в `transport.stateChange` listener (всё это
уже в shared `sip-client.js`).

### 9.6. `onclick="event.stopPropagation()"` ломает делегат
Документ-делегат `document.addEventListener('click', ...)` ловит на
bubble phase, после `onclick` на самой кнопке. `stopPropagation` в
onclick убивает event до делегата → placeCall никогда не вызывается.
**Фикс:** в onclick сразу `window.placeCall(...)`, без делегата
(см. шаг 8.2).

### 9.7. Asterisk не умеет читать LE privkey
Let's Encrypt создаёт `/etc/letsencrypt/live/.../privkey.pem` с правами
`root:root 600`. Asterisk запущен от `asterisk` user — не может прочитать
→ DTLS fingerprint пустой → WebRTC не работает.
**Фикс:** копия в `/etc/asterisk/keys/wss-*.pem` с `asterisk:asterisk
600`. Renew hook обновляет копию.

### 9.8. DTLS cert отдельный от WSS cert
Asterisk не может использовать LE privkey для DTLS-SRTP (разные API
внутри). Нужен self-signed `dtls.pem` отдельно (cat crt+key в один
файл). См. шаг 4.2.

### 9.9. Binotel IP whitelist
Большинство SIP-trunk провайдеров принимают трафик только с whitelisted
IP. Если REGISTER уходит, но Binotel молчит — забыли whitelist VM IP
в кабинете.

### 9.10. nip.io vs sslip.io
sslip.io имеет rate-limit на Let's Encrypt (запрос cert будет fail).
nip.io не имеет.

### 9.11. wrangler в `~/.local/bin/` не в PATH
Если `wrangler: command not found` — использовать
`~/.local/bin/wrangler` явно, либо добавить в PATH в `~/.zshrc`.

---

## 10. Тестирование

После всей настройки в этом порядке проверьте:

```bash
# 1. Asterisk запущен и transports listening
sudo asterisk -rx 'pjsip show transports'
# Ожидаемо: transport-udp:5060 + transport-wss:8089

# 2. SIP-trunk зарегистрирован у провайдера
sudo asterisk -rx 'pjsip show registrations'
# Ожидаемо: binotel-reg Registered (exp. ~500s)

# 3. Worker отдаёт shared module с CORS
curl -I -H "Origin: https://your-crm.com" \
    https://your-worker.workers.dev/sip-client.js
# Ожидаемо: HTTP 200, application/javascript, Access-Control-Allow-Origin: *

# 4. /api/sip/token защищён auth
curl https://your-worker.workers.dev/api/sip/token
# Ожидаемо: HTTP 401 "missing Bearer token"

# 5. Echo loopback (на VM добавьте в extensions.conf):
# exten => 9000,1,Answer()
#  same => n,Echo()
#  same => n,Hangup()
# После reload — позвоните на 9000 из браузера — должен слышать свой голос
```

### Frontend smoke-test (в DevTools Console):
```javascript
await mySip.init()         // → state становится Registered
await mySip.call('9000')   // echo extension — слышишь свой голос
await mySip.call('77011234567')  // настоящий звонок
await mySip.hangup()
```

### Полный flow от логина до завершения звонка:
1. Hard reload страницы
2. Login → консоль `[sipc] registered as 100 @ 178-105-90-157.nip.io`
3. Bottom-bar внизу справа → «Готов к звонкам»
4. Открыть карточку контакта → клик 📞 → dialer overlay → «Соединяемся…»
5. Через ~3 сек → «Идёт вызов…» (Binotel прислал 183 Session Progress)
6. Снять трубку на телефоне → «Разговор» → через 700ms overlay сворачивается
7. Bottom-bar показывает «Имя · 0:23» с таймером
8. Клик по bottom-bar → overlay разворачивается с Mute / Hold / DTMF
9. Завершить — кнопка 📵 в bottom-bar или ✕ в overlay
10. **Проверка устойчивости:** закрыть ноутбук на 5 мин → открыть → 
    bottom-bar пишет «Переподключение…» → через ~5 сек «Готов к звонкам» 
    → новый звонок работает без hard reload

---

## 11. Multi-tenant: добавление второй CRM / клиента

Если этот же Asterisk + worker используются другой CRM с другим
SIP-trunk провайдером:

### На Asterisk: новый endpoint + новый trunk

В `/etc/asterisk/pjsip.conf` добавить:
- `[200-auth]` + `[200]` endpoint+aor (всё как для 100, только номер 200,
  `context=from-tenant2`)
- `[trunk2-auth]` + `[trunk2]` endpoint+aor+identify+registration
  (как для binotel но с другими кредами)

В `/etc/asterisk/extensions.conf`:
```ini
[from-tenant2]
exten => _X.,1,Dial(PJSIP/${EXTEN}@trunk2,60)
```

Reload: `sudo asterisk -rx 'module reload res_pjsip.so'`

### На worker второй CRM:
```bash
echo "<endpoint-200-password>" | wrangler secret put SIP_PASSWORD
echo "200"                    | wrangler secret put SIP_USER
echo "178-105-90-157.nip.io"  | wrangler secret put SIP_DOMAIN
wrangler deploy
```

### Frontend: 0 изменений
Тот же `import { createSipClient } from "https://pllato-elc-worker.uurraa.workers.dev/sip-client.js"` — модуль shared, отличаются только endpoint и пароль из `/sip/token`.

---

## 12. Чеклист для код-агента

При воспроизведении в новом проекте — пройди по списку:

- [ ] Куплен SIP-trunk у провайдера, IP VM whitelist
- [ ] VM поднята с прямым public IP (НЕ Oracle Cloud!)
- [ ] UFW открыт: 22, 80, 443, 8089, 5060/udp, 10000-20000/udp
- [ ] Asterisk 22 LTS установлен (из исходников, не apt)
- [ ] DNS: nip.io домен или свой A-record
- [ ] Let's Encrypt cert получен, скопирован в /etc/asterisk/keys/
- [ ] Self-signed DTLS cert создан в /etc/asterisk/keys/dtls.pem
- [ ] /etc/asterisk/modules.conf: `noload => chan_sip.so`
- [ ] /etc/asterisk/http.conf: tlsenable + 8089
- [ ] /etc/asterisk/rtp.conf: icesupport=yes, без turnaddr
- [ ] /etc/asterisk/pjsip.conf: endpoint 100 + trunk, `allow=alaw,ulaw`
- [ ] /etc/asterisk/extensions.conf: from-internal + from-binotel
- [ ] `pjsip show registrations` → trunk Registered
- [ ] Cloudflare Worker: wrangler.toml с `[assets] directory="./public"`
- [ ] worker.js: handleSipToken (auth-gated) + CORS
- [ ] public/_headers: CORS на /sip-client.js
- [ ] public/sip-client.js: скопирован из pllato-elc-worker (~830 строк)
- [ ] wrangler secrets: SIP_PASSWORD, SIP_DOMAIN, опц. METERED_TURN_*
- [ ] wrangler deploy успешен
- [ ] curl /sip-client.js → 200 application/javascript
- [ ] curl /api/sip/token без auth → 401
- [ ] Frontend интеграция: import shared module + getAuthToken
- [ ] placeCall кнопки используют **inline onclick**, не делегат
- [ ] Тест: hard reload → bottom-bar → клик 📞 → разговор
- [ ] Тест устойчивости: sleep ноута 5 мин → auto-reconnect работает

---

## 13. Ссылки и кредитсы

**Production-реализация:**
- ELC CRM: https://pllato.kz/team.html
- Aminamed CRM: https://crm.aminamed.kz
- Worker (shared module + token): https://pllato-elc-worker.uurraa.workers.dev
- Asterisk: 178.105.90.157 (Hetzner CPX42, Frankfurt)
- Репо ELC + shared module: https://github.com/pllato/pllato.kz/tree/main/elc-worker
- Репо Aminamed: https://github.com/pllato/pllato-core-crm

**SIP-стек:**
- SIP.js 0.21.2 — https://sipjs.com
- Asterisk 22 LTS — https://www.asterisk.org

**Стоимость:**
- Hetzner CPX42: €4-6/мес
- Cloudflare Worker: $0 (free-tier хватает)
- metered.ca TURN: $0 (50 GB/мес бесплатно)
- Binotel: от $5/мес + минуты
- **Итого: €4-6/мес + минуты разговоров**

---

*Документ собран на основе production-опыта pllato (2026-05-24…27).
В работе участвовали несколько Claude-сессий. История фиксов и принятые
решения — в репо `pllato/pllato.kz` PRs #67, #81, #82, #83, #84, #86, #96
и `pllato/pllato-core-crm` PRs #42, #43.*
