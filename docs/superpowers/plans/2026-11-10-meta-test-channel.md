# Meta test channel Implementation Plan

**Goal:** Send and receive test Meta WhatsApp messages in team CRM.
**Architecture:** Isolated test configuration, shared chat storage, admin-only routes and UI.
**Tech Stack:** Vanilla JS, Cloudflare Worker, D1; no new dependencies.
**Spec:** ../specs/2026-11-10-meta-test-channel-design.md

## Constraints
Fixed test phone ID and recipient; no production migration. Signed webhook before parsing. No secrets in responses/logs/source. Existing Green API unchanged.

## Tasks
- [ ] Add elc-worker/wa-meta-test.js and focused node tests: bounded Graph API requests, HMAC verification, webhook deduplication, status persistence, admin-only configuration/sending.
- [ ] Wire Worker routes and meta-prefixed chat dispatch; keep non-admin listings isolated. Add team settings panel and client module app/wa-meta-test.js for setup, test send, replies/status.
- [ ] Run node tests and syntax checks, inspect diff, PR, deploy the reviewed worker/frontend. Configure credentials via UI and verify signed webhook and real round trip.

## Review focus
Unauthorized send/config; wrong recipient; duplicated/reordered status; upstream token errors; existing Green API regression.

## Execution notes
User requested direct execution; repository says no TDD ceremony. Run meaningful tests after implementation. Worktree already isolated; branch based on current origin/main d9be8476. No source CRM sync required: target is separate team.html app.
