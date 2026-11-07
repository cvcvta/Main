# NOTE — Persona OS "Hire Mo" v2

## The one idea
**Mo takes the empty chair.** The hire's costs pile onto the owner, he vanishes on "quit" (match cut to
the same desk, empty), Mo drops into his seat, and the camera dives through Mo's glass into the work
Mo does. Mo is the object carried across every seam: streaks in on "Mo starts today", leaves up-frame
when the costs start, falls into the chair, becomes the world we dive into, re-forms from that world
collapsing back into a circle, becomes the avatar on the 2 AM notification, and finally lands between
the owner's hands on "hire Mo".

## What changed from v1 (why v1 looked bad)
| v1 | v2 |
|---|---|
| Every word popped in with a blur + grey-to-colour flash, all-caps, centred stacks | Words unmask upward from a line mask (expo-out, ~12 f, landing ~2 f before they're heard), sentence case in the site's type style, purple only for Mo's part |
| Static scenes joined by hard cuts and flashes | One continuous push through the office; cuts land mid-move; dive into Mo / collapse back into Mo as the two big transitions |
| Generic icon cards, pills and a clock | Real work from personaos.com shown large: the Stone & Oak website, the floor guide, the "SEO updated" result, the before/after post, the sponsored ad, the October calendar, the flagged comment, the Sarah thread and the confirmed design visit |
| No motion blur | 4-sample shutter on every frame |
| SFX on a fixed list | SFX placed on events the renderer exports (landings, cuts, ticks, bubbles) |

## Beats (what each buys)
See `STORYBOARD.md`. Points (≤25%): Mo filling the chair (beat 4) and "Design visit confirmed" (beat 10).

## What is real and what is illustrative
- **Copy on the UI fragments** (Stone & Oak, the floor guide, October calendar post titles, the Austin
  comment, the Sarah thread, "Design visit confirmed · 10:00 AM") is the example content from
  personaos.com, which the site itself labels illustrative. "2:14 AM" and the search query are mine.
- **People and offices are AI-generated** (Higgsfield, GPT Image 2.6): desk, empty desk, spotlight, CTA.
  The empty desk was made by editing the desk plate; alignment is close, not pixel-exact.
- **VO**: ElevenLabs v4, "Erik – Deep, Bold Commercial", tightened and sped up 1.15×.
- **Music and SFX**: synthesised in `../build/audio.py`.
- Mo and the sparkle wordmark are redrawn in CSS from the personaos.com hero.

## Process note
The motionmaxxing toolbox (look.py, lint.mjs, render.mjs) could not be fetched in this sandbox
(cloning external code was blocked), so the craft rules were applied by hand and the gates below are
measured with ffmpeg instead of look.py. G1 and G4 are judged by eye on `sheet.jpg`.

## Gates (measured on `persona-os-mo-ad-v2.mp4` with ffmpeg)
| Gate | Result | Number |
|---|---|---|
| G0 render | pass | 1080×1920 H.264, 1059 frames, 35.32 s (planned 35.36 s); AAC audio at −14.5 LUFS integrated, −0.6 dBFS peak; 0 black segments |
| G1 proof readable | pass, by eye | UI fragments fill 0.75–0.85 W in Mo's world; the calendar is cropped by the frame edge; the thread and confirmation card fill 0.83 W |
| G2 no empty frame | pass | `freezedetect` (n=0.0015, d=0.1 s): only two 3-frame holds, at 19.33 s and 19.73 s, both inside the designed breath before "no hire can match" |
| G3 end card short | note | No frozen end hold: Mo blinks and the push continues to the last frame, so the film ends in motion (under the 0.6 s resolved-hold guide). Final shot 31.20–35.32 s = 4.1 s = 11.7% of the film |
| G4 one hero per frame | pass, by eye | One lit hero per frame; in the plan orbit the satellites are a quarter of Mo's size or smaller, blurred when behind him |
| G5 no page chrome | pass, by eye | No corner labels, counters, timecodes, progress bars or kicker-over-headline. Tracked caps appear only inside real UI (calendar weekdays, "DESIGN VISIT CONFIRMED") |
Scene cuts detected (scene > 0.3): 18.80, 24.33, 28.80, 29.03, 31.20 s; every other transition is a continuous camera move.

## One sentence per sheet frame (2 fps, `sheet.jpg`)
- 0–2.5 s: the owner types at his desk under a slow push; the question lands word by word over the white wall; Mo streaks in and parks by his hand.
- 2.5–7 s: same shot, Mo leaves up-frame; "Add up what one hire really costs you" over the wall, the three costs stack on his sweater as the image greys a step per cost.
- 7–9.5 s: the question sits on the wall, and on "quit" the man is gone; an empty chair under the same push, "Back to square one."
- 9.5–12.7 s: Mo drops into the chair, squashes and settles; the sparkle wordmark lands from oversize; "A whole marketing team in one AI."; the camera dives into Mo.
- 12.7–16.5 s: inside Mo's violet glass the camera tracks down past the Stone & Oak site, the floor guide, the SEO result, the before/after post and the ad, each landing as its role is named.
- 16.5–18.8 s: the October calendar, cropped by the frame, fills with posts, flips to Plan ready and ticks each post.
- 18.8–20.6 s: the world collapses back into Mo on a dark stage; a breath while "And here's what no hire can match" lands.
- 20.6–24.5 s: Mo grows a step per plan while the work he handles orbits in; the price sits under each line.
- 24.5–26.2 s: night; Mo shrinks into the avatar of a 2:14 AM comment that's flagged as a customer; "On the job, 24/7."
- 26.2–29 s: Mo texts Sarah, she accepts, "Design visit confirmed · 10:00 AM"; "No raises / No complaints / No agency to chase" swap underneath.
- 29–31.2 s: the owner from above in a purple spotlight, push-in, the qualifier over the dark.
- 31.2–35.3 s: the owner relaxed at the table, the wordmark above his head, "Tap below to hire Mo. From $49 a month." across his chest; Mo lands between his hands and blinks.

## What I'd still improve
- The four plates are stills with camera moves; a few seconds of real (or Seedance-generated) motion on the desk and CTA plates would add life.
- The music is synthesised; a licensed or ElevenLabs-generated track would sound more finished.
- The empty-desk plate drifts a few pixels from the original at the window edge; at speed the cut hides it, but a frame-by-frame look shows it.
