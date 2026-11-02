# Meet Client Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Show linked client information inside Meet to authorized hosts.
**Architecture:** Add an authenticated CRM context endpoint using the existing meeting/deal access rules. Fetch it independently of media and render in the existing sidebar.
**Tech Stack:** Vanilla JavaScript, Cloudflare Workers, D1; no new dependencies.
**Spec:** docs/superpowers/specs/2026-11-02-meet-client-card-design.md

## Global Constraints
- Client data is available only to authenticated employees with deal and host access.
- No context in public room responses, signaling broadcasts or persistent browser storage.
- Card loading cannot delay media, admission or recording.
- Empty fields are omitted; CRM remains the editing interface.

## Review Focus
- Direct endpoint access by a guest or unauthorized employee must fail.
- Switching room during a request must never display the previous client's data.
- Expired authorization clears the card instead of retaining stale information.
- Missing contacts, meeting times or linked deals must not break joining.
- Narrow screens and long deal titles must remain usable.

### Task 1: Authorized context endpoint
Files: elc-worker/zoom.js, elc-worker/meet-crm.js, tests/meet-client-context.mjs.
Interface: GET /api/zoom/meetings/:room/client-context returns {client:null|{dealId,title,contactName,phone,pipeline,stage,responsible,startTime,endTime}} with private,no-store caching.
- [x] Add failing tests for unauthenticated, forbidden deal, forbidden host role, valid host, absent linked deal, absent optional fields and allowlisted response fields.
- [x] Run node tests/meet-client-context.mjs and confirm expected failure.
- [x] Resolve meeting only after authentication; reuse host-access rules; query only linked deal/contact/stage/pipeline/responsible/task values. Never return host keys or raw records.
- [x] Run tests and existing meeting access tests; commit backend change.

### Task 2: Host-only client panel
Files: meet.html, new meet-client-card.js, tests/meet-client-card.mjs.
Interface: client card controller receives room, staff token, verified host status and fetch dependency; exposes load and clear. Server response is rendered using textContent.
- [x] Add tests for host gate, room changes during requests, expired authorization, missing fields, timeout/retry and safe rendering of user text.
- [x] Run tests to confirm failure before implementation.
- [x] Add topbar Client button and sidebar pane, available only to verified hosts. Launch context load without awaiting it from onAdmitted. Open by default once on desktop; use button on mobile. Add close/retry and a validated CRM deal link. Clear on room change/leave/access failure.
- [x] Run tests, JavaScript syntax checks and existing Meet tests; visually check desktop/mobile layout using fixture data, without joining or recording a real meeting.
- [x] Commit frontend change.

### Task 3: Publish and verify
- [x] Review final diff for public data leaks and unrelated changes.
- [x] Create and attach PR; run required checks; merge following repository workflow.
- [x] Deploy Worker from the merged revision and verify Pages asset publication.
- [x] Verify guest context refusal and host panel behavior. Report separately anything that cannot be verified without an authenticated session.
