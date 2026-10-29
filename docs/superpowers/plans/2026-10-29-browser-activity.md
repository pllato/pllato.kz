# Browser Activity Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline.

**Goal:** Deliver a private installable ZIP whose browser counters feed named people in the existing graph.
**Architecture:** MV3 event-driven extension, local hourly snapshots, current registration/ingest API, named chart aggregation.
**Tech Stack:** Vanilla JS, Chrome extension APIs, existing Cloudflare Worker, Node tests. No new dependencies.
**Spec:** docs/superpowers/specs/2026-10-29-browser-activity.md

## Global Constraints
No passwords. Names self-declared. No chat text/headers/body capture. Private ZIP enrollment secret never committed. Existing collectors preserved. Registration expiry does not disable enrolled devices. Only Chrome/Edge desktop.

## Review Focus
Duplicate event deliveries, concurrent tabs and restart retain one count; unrelated POSTs/history not counted; rejected registration never drops local counts; expired enrollment blocks only new registration; names escaped and unknown data distinguished from zero.

### Task 1: Registration metadata
- [ ] Extend source worker registration with optional enrollment expiry, browser person metadata derived from validated name; retain old registrations.
- [ ] Tests: expired enrollment, existing installation retry, browser metadata, legacy registration and isolated ingestion.
- [ ] Mirror only affected module to production (automatic CRM sync is disabled).

### Task 2: Extension
- [ ] Create tools/browser-activity/{manifest.json,model.mjs,background.js,content.js,popup.html,popup.js,style.css,README.md,package.py}.
- [ ] Content sends trusted submission intent only; background matches accepted request metadata and serializes mutations. Store no content. Stable device identity, offline snapshots, independent service retries, visible status/pause.
- [ ] Tests: matching, stale intents, duplicate callbacks, queue serialization, failed sync and later success, package excludes secrets from source.
- [ ] Build private ZIP with separate registration token; validate archive structure and extension resources.

### Task 3: People graph
- [ ] app/production-activity.js: people grouping/series and selected-period summary; keep device drill-down. app.html asset cache version.
- [ ] Tests: two services/person, multiple people/devices, time bounds, no unknown→zero, HTML escaping and consistent colors.
- [ ] Run tests, PRs/deploy, verify live registration/ingest using disposable test device without counting real production events; deliver ZIP and instructions.
