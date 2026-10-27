# Permanent meeting rooms for deals

Each deal has one public guest URL. The first room creation adopts the earliest ready Pllato room already linked to that deal; otherwise it creates a room. `zoom_private[pmeet-deal:<dealId>]` is the immutable pointer. A D1 batch uses the winning pointer for concurrent creation. Existing historical rooms, invitations and files are retained.

Calendar events resolve to the deal room. Cancelling an event does not cancel that room. Standalone events retain their own room. No schema migration or bulk reassignment of customer records is required.

Authenticated CRM staff (admin, manager, agent) with deal visibility may request host access. Public invitations omit the host capability. CRM and app buttons request host access on click and never downgrade silently to guest on authorization failure. Guest admission remains enforced by MeetRoom.

The archive continues to index recordings, chat metadata and available transcripts to the deal. `meeting_uuid` identifies each recorded session; the public room ID is shared. Both CRM views and linked app project cards render the same private files API, grouped by session. Missing transcripts are shown explicitly. Browser speech recognition is still the transcription source; this change does not introduce server transcription.

App project cards use existing explicit CRM links and demo-task project associations. Visible cards load the room with at most two concurrent requests; files load when history opens and videos use preload=none. Returning to CRM/app refreshes visible history. Unlinked cards are not guessed or matched by customer name.

Validation: 29 backend/permissions/archive tests; actual browser adapter checks for public link separation, staff host entry, denied access without guest fallback, separate history groups and lazy video. App card browser check confirms zero offscreen requests and history loading only on expansion. Worker dry-run build and all inline scripts pass.

## Unified short entry (2026-10-27)
The same `/m/d…` public alias opens each deal room for staff and clients. Aliases are immutable `pmeet-link:` pointers; collisions extend the code. Existing full room URLs remain valid. The public resolver returns only the room ID. Meet requests authenticated CRM host-access using the existing session; the server checks the canonical staff role and deal visibility. Host credentials are returned privately in the response body, never in the invitation URL. Cached room keys and old URL fragments do not grant organizer UI access on CRM room entry. A client supplies a name and grants browser media permissions, then joins in one action; normal room admission rules remain.
