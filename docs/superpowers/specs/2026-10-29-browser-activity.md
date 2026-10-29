# Browser activity — agreed design

One private ZIP for Chrome and Edge on Windows/macOS. Unpack, load extension, enter name once; no passwords or account login (user clarification Oct 29). Visible opt-in, pause, last sync and per-service counts. Names are self-declared, not verified identities.

Only newly submitted web requests count; history/navigation/background requests do not. Count accepted provider requests following a trusted user submission. Never read request bodies, response bodies, authentication headers or chat text. A versioned provider adapter may need updating if the websites change. No promise of work quality from counts.

Reuse central production-activity registration/ingest. A dedicated private enrollment capability permits only new browser registration for 30 days; each installation generates separate write-only device secrets, persisted before registration for retries. ZIP is private, source repository has only token hash. Existing local collectors remain compatible. Hourly snapshots are idempotent; queues survive offline periods, service-worker suspension and restart. Keep 180 days; sync every 10 minutes and manually.

Graph defaults to total plus named people, with deterministic colors; below it show person totals for the latest displayed period and Codex/Claude breakdown, last sync. Allow selecting a graph point for that period's breakdown; retain device drill-down. Same normalized self-declared name groups installations, noted in UI.

Approaches: local script cannot see browser requests; generic HTML cannot observe other tabs; browser extension selected by user. Prior Oct23 unfinished draft preserved in git stash with authorization to finish. Implement inline per repository's no-ceremony workflow.
