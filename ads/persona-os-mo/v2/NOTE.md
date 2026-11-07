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
