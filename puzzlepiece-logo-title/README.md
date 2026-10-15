# PuzzlePiece logo title (9:16)

- `puzzlepiece-logo-title-9x16.mp4` — 1080×1920 (vertical 1080p)
- `puzzlepiece-logo-title-16x9.mp4` — 1920×1080 (landscape 1080p)

Both: 60 fps with motion blur, 5 s, no audio, rendered at 2× and downsampled
(lanczos) for crisp edges, H.264 High, CRF 12.

Uses the real PuzzlePiece lockup (multicolour puzzle-piece icon + wordmark),
split into `assets/icon.png` and `assets/word.png`; the wordmark is further split
into its 11 letters so each one animates on its own spring.

| Time | Beat |
|---|---|
| 0.0–1.2 | Five pieces in the logo's own colours (green, teal, amber, red, maroon) spiral in on deep green, each spinning a different way |
| 1.2 | They lock together and the real icon "clicks" in — spring pulse + double ripple ring |
| 1.3–2.1 | Iris opens from the icon into the warm cream background |
| 1.9–2.6 | Icon springs left into the lockup position |
| 2.35–3.2 | Wordmark letters pop up one at a time, each with its own bounce |
| 2.6–3.8 | Corner accent pieces spring in and drift at different depths (parallax) |
| 3.2–3.8 | Yellow brand underline draws |
| 1.6–5.0 | Slow camera push-in throughout; icon settles with a soft tilt |

Motion blur: `render.js` renders 240 sub-frames per second, blends 3 neighbours per
output frame (≈270° shutter) and writes 60 fps.

    FFMPEG=$(which ffmpeg) W=1080 H=1920 OUT=title_9x16.mp4  node render.js
    FFMPEG=$(which ffmpeg) W=1920 H=1080 OUT=title_16x9.mp4  node render.js
    # SS=2 (default) sets the supersampling factor
