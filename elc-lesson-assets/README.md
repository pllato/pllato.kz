# Student lesson page

`lesson.html` is the student-facing static asset served at
`https://elc-lesson-worker.uurraa.workers.dev/lesson`.
The baseline was retrieved from the live asset on 2026-10-07.

Placement scores, level names and score breakdowns are intentionally absent
from student screens and the downloadable certificate. Staff result payloads
and Team displays are unchanged.

This worker is separate from `elc-worker/`. Updating this file requires an
asset deployment to **elc-lesson-worker**; the ELC Worker workflow does not
publish it. Preserve the currently deployed backend, other assets, bindings,
compatibility settings and variables when deploying this asset.
