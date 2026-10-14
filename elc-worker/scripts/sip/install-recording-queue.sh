#!/usr/bin/env bash
set -euo pipefail
# Install BEFORE applying the new /api/sip/asterisk-config?file=extensions.
script_dir=$(cd -- "$(dirname -- "$0")" && pwd)
install -m 0755 "$script_dir/recording-queue.py" /usr/local/sbin/pllato-recording-queue
install -d -o asterisk -g asterisk -m 0750 /var/spool/asterisk/monitor
cat > /etc/systemd/system/pllato-recording-upload.service <<'UNIT'
[Unit]
Description=Upload queued Pllato call recordings
After=network-online.target
[Service]
Type=oneshot
User=asterisk
Group=asterisk
UMask=0077
ExecStart=/usr/local/sbin/pllato-recording-queue --flush
TimeoutStartSec=15min
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/spool/asterisk/monitor
UNIT
cat > /etc/systemd/system/pllato-recording-upload.timer <<'UNIT'
[Unit]
Description=Retry queued Pllato call recordings
[Timer]
OnBootSec=30s
OnUnitInactiveSec=15s
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now pllato-recording-upload.timer
