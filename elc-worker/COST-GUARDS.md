# Cloudflare cost controls

Updated 2026-10-27 after WhatsApp reconnection replayed historical chats.

- The minute cron no longer calls `syncWaChatShells`. A provider chat-list entry is not proof of a new inbound message. Authenticated live webhooks continue to create leads; historical chat shells are no longer automatically turned into deals.
- Automatic message recovery claims an atomic D1 lease before scanning. At most one scan every 15 minutes across isolates, up to 8 connected instances per scan and one chat per instance. A failed scan retains the cooldown. Interactive history loading remains available.
- Provider history errors wait one hour before retrying the same chat. Existing per-instance request throttling, 10-second network timeout, and message-ID deduplication remain active. A response imports at most the requested 100 messages.
- Worker CPU is limited to 10,000 ms per invocation. This limits a runaway invocation, not the monthly account bill or total incoming traffic. Network waiting does not count as CPU time.
- Worker logs retain 10% of invocations rather than 100%; sampling can omit individual errors. Increase temporarily for incident investigation, then restore.
- `migrate-suppress-wa-history-push.sql` remains deployed to prevent historical shell new-lead push fan-out.

The Cloudflare dashboard budget alert was updated to $20 with its existing email recipient. This native alert measures account-wide usage-based spend per billing cycle, excludes fixed subscription charges, and does not stop usage. No account-wide hard dollar cap is configured. See https://developers.cloudflare.com/billing/manage/budget-alerts/.

Validation: `node --test wa-cost-guards.test.mjs cost-optimization.test.mjs`, `node test-wa-history.mjs`, `python3 test-wa-history-push.py`, and Wrangler deployment dry run.

For rollback, revert this PR and redeploy the Worker. Keep the notification suppression migration in place. Do not re-enable historical shell discovery without bounded batches, retry limits, and a reliable signal distinguishing a new conversation from reconnection history.
