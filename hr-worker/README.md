# Pllato HR

Frontend: `/app/hr/`, dashboard: `/app/hr/admin.html`. Storage: Cloudflare D1 `pllato-hr-d1`; backend `pllato-hr-worker`. There is no Firebase dependency in this flow.

Candidate links:
- `/app/hr/?stage=personality&tests=personality`
- `/app/hr/?stage=iq&tests=cognitive`

Candidates answer one question per screen; local drafts survive refresh. IQ deadlines survive refresh as well. Completion is confirmed only after server acknowledgement; failed uploads can be retried. Personality results require human review. The IQ exercise threshold is not an employment decision or standardized IQ measurement.

## Dashboard and notifications

The existing `HR_TEAM_PASSWORD` secret protects the dashboard API (`X-HR-Team`). The browser remembers it locally after login. App cards use the same login to fetch `/api/hr/summary` every 30 seconds and on focus. New means a submitted result without `reviewed_at` or a recruiter decision; opening its report marks it reviewed. One person can have separate test results.

Click **Включить push** in the dashboard on each device and allow browser notifications. On iOS, open the dashboard from the home screen. Push subscriptions belong to the shared HR team, not individual roles. Each distinct saved result generates a generic notification with its test name and a link to the report; no personal details are placed on the lock screen. Identical retries do not re-notify. Delivery depends on browser/OS permission and push-service availability.

Configure a paired P-256 `VAPID_PUBLIC_KEY` variable and `VAPID_PRIVATE_JWK` secret. Never commit private keys. `app/hr/sw.js` handles push under `/app/hr/` without intercepting or caching requests.

## Database and verification

Existing deployments: apply `migrations/0003_test_attempts.sql` once before deploying the updated Worker. New installations: use `schema.sql`.

`node tests/hr-assessment.test.mjs` checks server IQ scoring, auth, attempts, summary/read state and duplicate submissions using an in-memory SQLite database (modern Node required). Frontend browser checks cover complete personality/IQ flows, draft recovery, preserved deadline, dashboard search and new-result filter. Production checks must not insert artificial candidates.

## Personality interaction safeguards

New clients require at least 1.5 seconds of visible, focused reading per question; time in a background tab does not count. Three premature clicks on one question require explicit acknowledgement and rereading. Existing attention-instruction items are distributed through the questionnaire; failed instructions are not accepted. Three instruction failures stop the attempt with `needs_retry` and an immediate repeat action. This is an incomplete/invalid assessment outcome, never an automatic employment rejection. Repeated identical personality answers are allowed.

Versioned `telemetry.personalityQuality` records accepted reading time, premature clicks and instruction retries. The server checks completeness, attention answers and reading metadata for new clients. Legacy complete records without timing remain supported. Client telemetry is an interaction safeguard, not tamper-proof evidence of attention or a detector of dishonesty. Recruiters see concrete attempt counts without personality-based rejection. Results requiring repetition do not display a personality interpretation.

## Practical meeting analysis

Candidate URL: `/app/hr/practical/`. Five tasks and the transcript/reference from the provided candidate PDF; 40 minutes including reading. Required name, age, phone and consent. Task answers are plain text, limited to 2,000 characters per field.

Apply `migrations/0004_practical.sql` before deploying. `hr_practical_sessions` stores random session bearer tokens, server deadlines and optimistic revisions; candidate data and drafts use existing `submissions` with stage `practical`. Partial work is `in_progress` and excluded from the new-result badge. Finalization is immutable for the candidate, including retries. Expired work is finalized on candidate requests or registry/summary reads, using the last server-saved answers. The timer is not paused by closing the page. Offline edits stay local but cannot replace the server snapshot after the deadline.

Set `HR_PRACTICAL_KEY_GZIP` via Wrangler secret input to the gzip-compressed, base64-encoded UTF-8 reviewer key (keeps the value below the per-secret size limit). The application fetches it only through the team-authenticated `/api/hr/practical/key` endpoint; do not put the key in candidate assets. The original externally supplied PDF key is public and remains discoverable; this application does not revoke that URL.

Manual grading is authenticated at `/api/hr/practical/grade`: maxima 4/3/4/3/3/3 (20 total), notes and a separate recruiter decision. The shared registry loads practical reports through `/app/hr/practical/review.js`. No automatic rejection or AI detector is used. Away counts/duration, pasted character counts and transcript-quote paste counts are self-reported browser signals, not tamper-proof evidence of cheating. No camera, microphone or external-tab content is captured. Oral explanation remains necessary when independent work is important.

Validation: `node tests/hr-practical.test.mjs` and existing `node tests/hr-assessment.test.mjs`. The practical test covers deadline enforcement, revision conflicts, token checks, final submission immutability, authenticated manual grading, and expired/abandoned sessions.
