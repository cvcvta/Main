# PuzzlePiece 20s explainer (9:16)

`puzzlepiece-explainer-9x16.mp4` — 1080×1920, 30 fps, 20 s, no audio.

Built from website screenshots: `index.html` is a frame-accurate animation
(`render(t)`), and `render.js` steps it with Playwright and pipes frames to ffmpeg.

    FFMPEG=$(which ffmpeg) node render.js          # full video -> out.mp4
    FFMPEG=x node render.js 2.9,12.3               # stills at given seconds

Scenes: hero (0–3.3s) · photo → character (3.3–6.4) · custom story (6.4–9.9) ·
life moments (9.9–12.6) · art styles (12.6–14.9) · science (14.9–17.1) · free tablet CTA (17.1–20).
