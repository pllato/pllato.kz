# Mobile video efficiency — 2026-10-27

Phone and touch-iPad profile: camera ideal 960×540, maximum 24 fps, camera sender 1.2 Mbps; background inference at most 15 fps; recording 960×540 at 15 fps. Desktop keeps 1280×720 camera / 30 fps and recording 25 fps, with background inference limited to 20 fps. Each new entry defaults to a role-specific office background; users can change the background during the meeting.

Person-alpha refinement reads 256×144 pixels for a 16:9 frame instead of 1280×720 (25× fewer pixels). The source person image remains at camera resolution. The existing smoothstep boundary is retained, and the small mask is smoothly upscaled. This changes edge sampling and still needs visual validation with real hair/motion on phones.

Hidden prejoin video is detached when entering; stopped background initializers cannot resurrect a model; background capture tracks and recording tracks are stopped when no longer used. Speaker meters run every 150 ms instead of every display frame. Recording prefers VP8 over VP9 where supported, with MP4 fallback for compatible browsers.

Validation: `node meet-worker/mobile-efficiency.test.cjs` checks phone/iPad/desktop profiles, inference scheduling, mask/output dimensions, stopping during model load, and capture-track cleanup. Chrome canvas test: 30 alpha passes took ~127 ms at HD versus ~3.6 ms on compact masks (microbenchmark, not whole-app savings). Actual MediaRecorder test produced a playable 960×540 VP8/Opus recording at a 15 fps capture limit and released its tracks after stop. No real-phone battery/temperature measurements have been performed.

The room still uses WebRTC mesh: each participant sends separately to every other participant. These changes reduce per-device work but do not replace that scaling model. Backgrounded mobile browsers may throttle recording and media tasks.

## Office defaults and camera entry

Host: `assets/meet/office-reception.jpg`; client: `assets/meet/office-neutral.jpg`. User-supplied originals are resized to 1280px-wide JPEGs (~189/178 KiB), decoded once, and composited from a canvas cached by mode and dimensions. Office logos are not mirrored in local preview or recording. MediaPipe script loading is shared between preview/outgoing initialization.

Entry requires a live enabled camera, except when a default-camera retry fails with NotFound/DevicesNotFound and device enumeration confirms no video inputs. Permission denial, busy hardware, constraint failures, and ended tracks do not qualify. Saved missing devices fall back to the default camera. Camera is enabled on prejoin/retry; users can still switch it off during the meeting.

Validation: `node meet-worker/camera-entry.test.cjs`; browser checks with synthetic camera verified host/client role assets, enabled entry, office canvas pixels, and 31 processing frames in two seconds on desktop (cap 40). Physical device battery/thermal behavior remains unmeasured.

## Stricter foreground cleanup

After chair/ear-side leakage in a real call, alpha now uses a 0.60–0.90 confidence transition instead of 0.35–0.75. Eight-connected foreground islands smaller than 12 mask pixels are removed; attached fine edges are retained. Scratch arrays are allocated only when the mask dimensions change. The model and FPS caps are unchanged.

`node meet-worker/person-mask.test.cjs` covers uncertain attached chair pixels, detached fragments, diagonal fine edges, unchanged RGB, and soft alpha transitions. Chrome microbenchmark on a 256×144 synthetic mask: 60 passes ~111 ms (~1.85 ms/pass). This is mask cleanup only, not a full-call performance measurement. A composited screenshot does not expose the original camera frame or raw confidence mask: removal of the specific chair, hair preservation in motion, and mobile thermal impact still need live-device validation. A large chair region confidently classified as a person can survive this cleanup.

### Floating participants during screen sharing

`meet-floating.js` uses Document Picture-in-Picture after the user presses
«Поверх». The existing camera grid is adopted into the native window: no extra
streams, video elements, canvas rendering loops, or encoding are created.
Recording reads the stable grid reference across documents. Closing PiP,
stopping screen sharing, or leaving restores the same nodes and keeps camera
tracks intact. A generation token cancels a pending open when the call ends.
Unsupported browsers retain the existing in-tab participant strip and explain
that desktop Chrome/Edge is needed for the external window. Sharing an entire
screen may capture this window too; share a specific application window/tab
when that is undesirable.

Validated in Chromium with a synthetic live video: native PiP opens, the same
video and stream keep playing, added peers appear, the recording canvas can
draw the adopted video, and closing restores the grid without stopping tracks.
Real-device battery use and sustained multi-party calls remain manual checks.

### Skin-edge aliasing correction

Mask refinement now uses 384 px width on mobile and 512 px on desktop instead
of 256 px. This avoids expanding the sharpened coarse mask into visible blocks.
A separable [1,6,1]/8 alpha-only filter provides narrow subpixel coverage; video
RGB is never filtered. Scratch storage is reused and the existing 15/20 fps
background limits are unchanged. Detached-island area scales with resolution.
This increases mask processing work (up to 147,456 pixels at 16:9 desktop), not
camera resolution or model inference rate.

Chromium synthetic circular confidence-mask comparison at 1280x720: boundary
RMSE 27.10 before, 17.36 after (~36% lower). This is an antialiasing regression
check, not a claim of perfect segmentation or measured mobile battery savings.
Actual hair, hands, chair discrimination and thermals still require live-camera
checks. The current model can still misclassify background objects.
