# IP call recordings

CRM shows uploaded recordings in **Телефония → Записи разговоров** (paged) and
above the conversation in a deal card. Existing orphan call-log rows are read by
exact normalized contact phone; an explicit link to another deal is never overridden.
New uploads match phone, direction and start time (unique candidate within two minutes).
Ambiguous matches create a separate call entry rather than overwriting another call.
An Asterisk call key produces a stable HMAC-derived object URL, so upload retries are idempotent.

## Server rollout (required, separate from Worker deployment)

1. Copy `scripts/sip/recording-queue.py` and `install-recording-queue.sh` to the Asterisk server.
2. Run `sudo bash install-recording-queue.sh`. Verify the systemd timer
   `pllato-recording-upload.timer` is active and runs as the same `asterisk` user.
3. Back up `/etc/asterisk/extensions.conf`. Fetch the current generated
   `/api/sip/asterisk-config?file=extensions` with the existing SIP route secret
   (request header `x-sip-route-secret`). Keep configuration files private.
4. Review/apply the generated extensions, then `sudo asterisk -rx 'dialplan reload'`.
   Do not restart Asterisk or replace SIP registration configuration.
5. With an internal test number, verify incoming/outgoing calls ending from both
   sides. Confirm the completed WAV + `.upload.json` job appear, then disappear
   only after a successful Worker acknowledgement. Verify a single call entry
   and playback in the deal and central recordings tab.
6. Simulate an upload network failure; the WAV and job must stay for the next timer tick.

The hangup handler only closes MixMonitor and writes a local queue job. Network
requests happen in the timer, never on the SIP hangup path. Failed requests retain
both audio and metadata. Never remove old WAVs before validating their CRM copies.
Existing WAVs without job metadata require CDR reconciliation (full number, direction,
start, duration). Never guess a phone from the filename or attach all files to one client.
Calls handled entirely by a separate Binotel handset need the provider recording
integration; this Asterisk path cannot capture audio that never traverses Asterisk.

## Verification

- `node --test elc-worker/call-recordings.test.mjs`
- `python3 elc-worker/scripts/sip/test_recording_queue.py`
- Worker dry-run build; inline `team.html` JavaScript syntax check.

As of this change, server rollout and old WAV inventory could not be performed:
89.168.122.186 rejected the existing local Oracle SSH keys. Worker/UI publication
alone does not activate this new dialplan on the PBX.
