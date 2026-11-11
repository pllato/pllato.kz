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
