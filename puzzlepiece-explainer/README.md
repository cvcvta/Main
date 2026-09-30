# PuzzlePiece 20s explainer (9:16)

`puzzlepiece-explainer-9x16.mp4` — 1080×1920, 30 fps, 20 s, no audio.

All artwork is original vector illustration drawn in code (`art.js`): the child
character and its style variants, family members, scenes and the tablet. Website
screenshots were used only as a reference for palette, typography and messaging.

- `index.html` — layout of the seven scenes
- `anim.js` — frame-accurate `render(t)` timeline (puzzle-piece wipes between scenes)
- `render.js` — steps the timeline with Playwright and pipes frames to ffmpeg

    FFMPEG=$(which ffmpeg) node render.js          # full video -> out.mp4
    FFMPEG=x node render.js 2.4,9.6                # stills at given seconds

Scenes: logo + hero (0–3s) · photo → character (3–6.4) · custom story (6.4–10) ·
life moments (10–12.6) · art styles (12.6–15) · science (15–17.4) · free tablet CTA (17.4–20).
