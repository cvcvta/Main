# NOTE — PuzzlePiece logo title, "Registration" (made with /motionmaxxing)

## The one idea, and why it is this brand's
The PuzzlePiece mark is literally five overlapping translucent colour bands. The film splits the real logo into those
bands (its own plates), floats them just off-register above warm picture-book paper, and lets them drift down into
register and *print* — then the wordmark prints beside them, its butter and teal ink ghosts converging into register.
It is a printing / picture-book world (the product makes personalised stories), and the logo arrives by cause:
the pieces fit. Cover-the-logo test: the plates *are* the logo, so another brand cannot use this film.

Rejected from the previous version (and why): pieces spiralling and spinning in (the category's first reach),
a circle iris wipe into cream (on the method's never-ship list), a springy bounce on everything.

## Beats (one continuous 5.0 s shot, 60 fps)
| t (s) | buys | what happens |
|---|---|---|
| 0.0–1.0 | the viewer sees colour gels over paper and wants them to line up | macro (5.2x), plates already drifting at frame 0, soft focus racks sharp by 1.0 s |
| 1.0–3.1 | the pieces belong together | plates slide into register on long soft landings (2.60–3.10 s), descend, shadows tighten and vanish as each prints; camera pulls back; a 2 % press when the last plate lands |
| 2.92–3.5 | it is PuzzlePiece | wordmark prints letter by letter (uneven 2–6 f @60 gaps), ink ghosts converge |
| 3.7–5.0 | the mark registers | one warm light sweep across the icon (3.7–4.35), slow camera creep, contraction accelerating into the last frame (ends mid-motion) |

## What is real and what is illustrative
- Real: the PuzzlePiece logo (icon + wordmark) cut from the user's own end-card screenshot; the five plates are
  that icon split by colour band (recomposed they match the original logo pixel for pixel); brand colours and the
  warm cream end-card gradient.
- Built in code: the paper tooth (static noise), the key light / warm falloff, the light sweep, the tinted shadows
  (pre-blurred from each plate's own silhouette).
- No generated images, no invented copy, no UI.
- Source resolution: the logo is a raster from a screenshot (icon 139 px, upscaled 4x for the plates), so the macro
  opening is slightly soft; the rack focus covers it. An SVG/large PNG of the logo would make it fully sharp.

## Gates (draft render 540x960, 60 fps; scripts' own output)
- G0 render exists: PASS — duration 5.00 s matches --expect 5.00 s; audio none (not required).
- G2 no empty frame: PASS — no run of > 3 flat frames.
- G3 end card hold: PASS — end hold 0.00 s: ends mid-motion; one continuous shot (no cuts).
- G5 no page chrome: PASS (lint.mjs).
- G1 proof readable: n/a (no UI or text proof; the wordmark is 0.80 W in 9:16, 0.41 W in 16:9).
- G4 one hero per frame: by eye on the sheet — one subject in every frame (the plates, then the lockup).
- MOTION note: mean frame-to-frame luma change 0.7/255, below the human band (median 6.8, IQR 4.4–9.8).
  Partly structural (60 fps halves per-frame change vs the 30 fps reference; pastel plates on cream), partly real:
  this is a calm sting, by choice for the brand.
(Final-render numbers are appended below.)

## Sheet, one sentence per frame (draft)
1–4 (0–1.2 s): large translucent green, deep-green/teal, red, maroon and amber gels over warm paper, overlapping into
darker mixes with soft tinted shadows; the hero, not a slide.
5–8 (1.2–2.6 s): the gels close in and shrink as the camera pulls back and left; one subject.
9 (≈2.9 s): the registered icon alone for a beat as the first letter starts printing.
10–12 (3.0–3.5 s): the wordmark prints with butter/teal ghosts converging.
13–16 (3.6–5.0 s): the centred lockup on warm paper, light sweep, slow then accelerating contraction.

## Tooling notes
- No ElevenLabs key in this environment (and the user earlier asked for no generated voice): silent.
- This machine has no ffprobe and an ffmpeg without drawtext: a small ffprobe stand-in (parses `ffmpeg -i`) answers
  the two queries the scripts make, and look.py was run unmodified with only its timecode font hidden (no gate math touched).
- The light-sweep event is marked `sweep`, not `show`, so look.py does not count it as a cut (it is one continuous shot).
- Motion.selfTest: PASS, 24 samples, 0 mismatches.

## What I would still improve
- A vector logo (sharper macro opening and a crisper wordmark at large sizes).
- Sound: a paper slide, a soft press on the last plate, a light print "thump" per letter group.
- The motion number is below the human band; if the user wants more energy, start the plates further apart
  and land them faster (the calm version was chosen because the user found earlier versions rushed).

## Final renders (60 fps, shutter 180° x 8 sub-frames, grain 0.03, CRF 14)
| file | size | G0 | G2 | G3 | motion |
|---|---|---|---|---|---|
| final_9x16.mp4 | 1080x1920 | PASS 5.00 s | PASS | PASS (ends mid-motion, one shot) | 0.7/255 |
| final_16x9.mp4 | 1920x1080 | PASS 5.00 s | PASS | PASS (ends mid-motion, one shot) | 0.6/255 |
G5 (lint.mjs on index.html): PASS. Motion.selfTest: PASS (24 samples, 0 mismatches).
The final 9:16 sheet matches the draft frame descriptions above.
