# Mobile video efficiency — 2026-10-27

Phone and touch-iPad profile: camera ideal 960×540, maximum 24 fps, camera sender 1.2 Mbps; background inference at most 15 fps; recording 960×540 at 15 fps. Desktop keeps 1280×720 camera / 30 fps and recording 25 fps, with background inference limited to 24 fps. Stored background preference is preserved.

Person-alpha refinement reads 256×144 pixels for a 16:9 frame instead of 1280×720 (25× fewer pixels). The source person image remains at camera resolution. The existing smoothstep boundary is retained, and the small mask is smoothly upscaled. This changes edge sampling and still needs visual validation with real hair/motion on phones.

Hidden prejoin video is detached when entering; stopped background initializers cannot resurrect a model; background capture tracks and recording tracks are stopped when no longer used. Speaker meters run every 150 ms instead of every display frame. Recording prefers VP8 over VP9 where supported, with MP4 fallback for compatible browsers.

Validation: `node meet-worker/mobile-efficiency.test.cjs` checks phone/iPad/desktop profiles, inference scheduling, mask/output dimensions, stopping during model load, and capture-track cleanup. Chrome canvas test: 30 alpha passes took ~127 ms at HD versus ~3.6 ms on compact masks (microbenchmark, not whole-app savings). Actual MediaRecorder test produced a playable 960×540 VP8/Opus recording at a 15 fps capture limit and released its tracks after stop. No real-phone battery/temperature measurements have been performed.

The room still uses WebRTC mesh: each participant sends separately to every other participant. These changes reduce per-device work but do not replace that scaling model. Backgrounded mobile browsers may throttle recording and media tasks.
