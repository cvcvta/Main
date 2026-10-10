# PuzzlePiece end card (5 s, 9:16)

`puzzlepiece-end-card-5s.mp4` — 1080×1920, 30 fps, 5 s, no audio. Standalone.

Minimal cream end card: tablet rises in and its screen wakes to the waving
child, then specs line, PuzzlePiece logo, one line of copy, "Get my free tablet"
button (one gentle press, then a soft pulse), puzzlepiecefamily.com and fine print.

| Time | Beat |
|---|---|
| 0.1–1.0 | Tablet rises in |
| 0.7–1.3 | Screen lights up; child starts waving at 1.2 |
| 1.1–2.4 | Specs, logo, underline, copy |
| 2.2–3.4 | Button, URL, fine print |
| 3.5–5.0 | Button press, then hold with a soft pulse |

    FFMPEG=$(which ffmpeg) node render.js     # -> out.mp4

## Free-trial version (`puzzlepiece-end-card-trial-5s.mp4`)

Same 5 s card and timing, CTA swapped for the trial offer: "7-DAY FREE TRIAL"
tag, "Sign up today." headline, "Start my free trial" button, URL and
fine print ("7-day free trial, then $39.99/month base plan. Terms apply." —
confirm against the actual trial terms). Source: `index-trial.html`
(render it by pointing `render.js` at that file or copying it over `index.html`).

## Free-trial version, 8 s (`puzzlepiece-end-card-trial-8s.mp4`)

Same trial card with the slower 8 s pacing: tablet 0.3–1.5, screen on 1.3–2.1,
trial tag/logo/headline/line 1.9–3.8, button/URL/fine print 3.5–5.2, button press
at 5.4, then a soft pulse to 8.0. Source: `index-trial-8s.html` (DUR = 8).
