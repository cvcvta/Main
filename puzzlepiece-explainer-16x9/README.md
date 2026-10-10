# PuzzlePiece explainer (16:9)

`puzzlepiece-explainer-16x9.mp4` — 1920×1080, 30 fps, 50 s, no audio. (Authored on a 32 s grid and played back stretched ×1.5625 via `STRETCH` in `anim.js`.)

On brand: cream / mint / deep-green palette, Lora + DM Sans, puzzle-piece wipes,
PuzzlePiece logo lockup, original illustrated family. The art-style tiles use the
style examples from puzzlepiecefamily.com.

| Time | Scene |
|---|---|
| 0–6.2 | Calmer days. More confident kids. · For kids with autism · family waves |
| 6.2–12.5 | Everyday transitions can feel big (park, school, bath, bedtime) |
| 12.5–19.5 | Photo → character; add Mom, Dad, sibling |
| 19.5–26.6 | Tell us the hard part → story on the tablet, First / Then / Next |
| 26.6–32 | Same kid. New worlds. · LEGO / Minecraft / Pixar / Simpsons-inspired · 10+ styles |
| 32–37.5 | Science-backed: 249 children, 87 schools, ASSSIST-2 (University of York, 2024) |
| 37.5–42.2 | Read together. Revisit anytime. |
| 42.2–50 | End card: tablet + "Get my free tablet" + puzzlepiecefamily.com |

    FFMPEG=$(which ffmpeg) node render.js           # -> out.mp4
    FFMPEG=x node render.js 3.2,19.8                # stills
