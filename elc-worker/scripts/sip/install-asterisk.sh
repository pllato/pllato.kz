#!/bin/bash
# Asterisk 20 + coturn + Let's Encrypt install for pllato-asterisk VM
# Run as: bash install-asterisk.sh sip.pllato.kz platontsay@gmail.com
set -euo pipefail

SIP_DOMAIN="${1:-sip.pllato.kz}"
LE_EMAIL="${2:-platontsay@gmail.com}"

echo "==> [1/8] apt update + install packages"
sudo apt update
sudo DEBIAN_FRONTEND=noninteractive apt install -y \
  asterisk asterisk-modules asterisk-config \
  coturn certbot \
  jq curl

echo "==> [2/8] Stop services for cert + config"
sudo systemctl stop asterisk || true
sudo systemctl stop coturn || true

echo "==> [3/8] Let's Encrypt cert (standalone on :80)"
sudo certbot certonly --standalone --non-interactive --agree-tos \
  -m "$LE_EMAIL" -d "$SIP_DOMAIN" \
  --preferred-challenges http

CERT_DIR="/etc/letsencrypt/live/$SIP_DOMAIN"
sudo chmod 750 /etc/letsencrypt/{live,archive}
sudo chgrp asterisk /etc/letsencrypt/{live,archive}
sudo chmod 640 "$CERT_DIR"/privkey.pem
sudo chgrp asterisk "$CERT_DIR"/privkey.pem

echo "==> [4/8] pjsip.conf (WebRTC endpoint + Binotel trunk)"
if [ ! -f ~/.secrets/binotel-sip.txt ]; then
  echo "ERROR: ~/.secrets/binotel-sip.txt not found on VM"
  echo "Create it with: SIP_USERNAME=, SIP_PASSWORD=, SIP_SERVER=, SIP_PORT="
  exit 1
fi
# Read keys safely (values may contain &, $, etc. that break `source`)
SIP_USERNAME=$(grep '^SIP_USERNAME=' ~/.secrets/binotel-sip.txt | cut -d= -f2-)
SIP_PASSWORD=$(grep '^SIP_PASSWORD=' ~/.secrets/binotel-sip.txt | cut -d= -f2-)
SIP_SERVER=$(grep '^SIP_SERVER=' ~/.secrets/binotel-sip.txt | cut -d= -f2-)
SIP_PORT=$(grep '^SIP_PORT=' ~/.secrets/binotel-sip.txt | cut -d= -f2-)
SIP_PORT="${SIP_PORT:-5060}"
if [ -z "$SIP_USERNAME" ] || [ -z "$SIP_PASSWORD" ] || [ -z "$SIP_SERVER" ]; then
  echo "ERROR: SIP_USERNAME/SIP_PASSWORD/SIP_SERVER missing in ~/.secrets/binotel-sip.txt"
  exit 1
fi

sudo tee /etc/asterisk/pjsip.conf > /dev/null << PJSIP_EOF
[global]
type=global
endpoint_identifier_order=username,ip

;=== WebRTC transport (WSS for browser) ===
[transport-wss]
type=transport
protocol=wss
bind=0.0.0.0:8089
cert_file=$CERT_DIR/fullchain.pem
priv_key_file=$CERT_DIR/privkey.pem

;=== Plain UDP transport (Binotel trunk) ===
[transport-udp]
type=transport
protocol=udp
bind=0.0.0.0:5060

;=== Binotel SIP trunk (outbound + inbound) ===
[binotel-auth]
type=auth
auth_type=userpass
username=$SIP_USERNAME
password=$SIP_PASSWORD

[binotel]
type=endpoint
transport=transport-udp
context=from-binotel
disallow=all
; ВАЖНО: только alaw,ulaw (без opus) — у Asterisk нет codec_opus.so
; (коммерческий модуль Digium), а Binotel отдаёт alaw. Если оставить
; opus в одном из endpoints — Asterisk не сможет транслировать
; opus↔alaw и дропнет вызов с 603 Decline сразу после answer.
allow=alaw,ulaw
outbound_auth=binotel-auth
aors=binotel
from_user=$SIP_USERNAME
from_domain=$SIP_SERVER
direct_media=no

[binotel]
type=aor
contact=sip:$SIP_SERVER:${SIP_PORT:-5060}

[binotel]
type=identify
endpoint=binotel
match=$SIP_SERVER

[binotel-reg]
type=registration
outbound_auth=binotel-auth
server_uri=sip:$SIP_SERVER:${SIP_PORT:-5060}
client_uri=sip:$SIP_USERNAME@$SIP_SERVER
retry_interval=60

;=== Browser WebRTC endpoint (operator: 100) ===
[100-auth]
type=auth
auth_type=userpass
username=100
password=changeme_set_strong_password

[100]
type=endpoint
transport=transport-wss
context=from-internal
disallow=all
; См. комментарий выше про opus — оставляем только alaw,ulaw.
; Браузер (Chrome/Safari) умеет alaw из коробки.
allow=alaw,ulaw
auth=100-auth
aors=100
webrtc=yes
dtls_cert_file=$CERT_DIR/fullchain.pem
dtls_private_key=$CERT_DIR/privkey.pem
dtls_setup=actpass
dtls_verify=fingerprint
ice_support=yes
media_use_received_transport=yes
rtcp_mux=yes

[100]
type=aor
max_contacts=5
remove_existing=yes
PJSIP_EOF

echo "==> [5/8] extensions.conf (dial plan)"
sudo tee /etc/asterisk/extensions.conf > /dev/null << EXT_EOF
[general]
static=yes
writeprotect=no

;=== Browser → Binotel (outbound calls) ===
[from-internal]
exten => _X.,1,NoOp(Outbound: \${EXTEN})
 same => n,Dial(PJSIP/\${EXTEN}@binotel,60)
 same => n,Hangup()

;=== Binotel → Browser (inbound calls, ring 100) ===
[from-binotel]
exten => _X.,1,NoOp(Inbound from Binotel to \${EXTEN})
 same => n,Dial(PJSIP/100,30)
 same => n,Hangup()
EXT_EOF

echo "==> [6/8] http.conf (enable HTTPS for WSS)"
sudo tee /etc/asterisk/http.conf > /dev/null << HTTP_EOF
[general]
enabled=yes
bindaddr=0.0.0.0
bindport=8088
tlsenable=yes
tlsbindaddr=0.0.0.0:8089
tlscertfile=$CERT_DIR/fullchain.pem
tlsprivatekey=$CERT_DIR/privkey.pem
HTTP_EOF

echo "==> [7/8] coturn (NAT traversal for browsers behind firewalls)"
sudo tee /etc/turnserver.conf > /dev/null << TURN_EOF
listening-port=3478
fingerprint
lt-cred-mech
realm=$SIP_DOMAIN
user=webrtc:changeme_turn_password
cert=$CERT_DIR/fullchain.pem
pkey=$CERT_DIR/privkey.pem
no-stdout-log
log-file=/var/log/turnserver.log
TURN_EOF
sudo sed -i 's/#TURNSERVER_ENABLED=1/TURNSERVER_ENABLED=1/' /etc/default/coturn

echo "==> [8/8] Start services + certbot renew hook"
sudo systemctl enable --now coturn
sudo systemctl enable --now asterisk

# Renew hook: reload asterisk after cert renewal
sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-sip.sh > /dev/null << HOOK_EOF
#!/bin/bash
chgrp asterisk /etc/letsencrypt/{live,archive}/$SIP_DOMAIN/privkey.pem 2>/dev/null
systemctl reload asterisk
systemctl restart coturn
HOOK_EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-sip.sh

echo ""
echo "=========================================="
echo " ✅ Asterisk + coturn + Let's Encrypt up"
echo "=========================================="
echo " SIP domain:    $SIP_DOMAIN"
echo " WSS endpoint:  wss://$SIP_DOMAIN:8089/ws"
echo " Browser user:  100"
echo " Browser pass:  changeme_set_strong_password  ← CHANGE in pjsip.conf!"
echo " TURN user:     webrtc:changeme_turn_password ← CHANGE in turnserver.conf!"
echo ""
echo " Verify Binotel registration:"
echo "   sudo asterisk -rx 'pjsip show registrations'"
echo ""
echo " Live logs:"
echo "   sudo journalctl -u asterisk -f"
