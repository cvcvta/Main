# CVCVTA.AI showreel

A 15-second motion-graphics showreel for CVCVTA.AI, in two formats cut from one timeline.
Every face in it comes from CVCVTA.AI's AI UGC footage.

**Watch:**
- 16:9: [`out/cvcvta-showreel-16x9.mp4`](out/cvcvta-showreel-16x9.mp4) (1920×1080, for portfolios and YouTube)
- 9:16: [`out/cvcvta-showreel-9x16.mp4`](out/cvcvta-showreel-9x16.mp4) (1080×1920, for TikTok, Reels and Shorts)

Both are 30 fps, H.264 + AAC.

## The idea

The reel is a trick question. It opens with *"One of these creators is AI."* above six creator cards.
Each creator then goes through a forensic scan: face-mesh tracking, skin loupe, finger count,
light analysis and live expression telemetry. Every scan returns **HUMAN**. Then every tag flips
to **AI-GENERATED**, a correction reads **ALL of THEM.**, and the six cards collapse into the six
letters of **CVCVTA**. The REC light from the frame's corner lands as the dot in **.AI**, and a red
**AI** rises after it, the same red as the *AI.* in the opening line.

The 9:16 cut uses the same beats, re-staged for a vertical frame:
- **Lineup:** a 3×2 grid of cards under a two-line hook.
- **Scan:** a 720×1280 panel mapped 1:1 to the footage, with the read-outs over a scrim and in
  rotated side rails.
- **Slam:** ALL / of / THEM. stacked on three lines.
- **Logo:** the grid turns into giant CVC / VTA letters, which then reflow into one line.

## Cue sheet (128 BPM, 8 bars = exactly 15.0 s)

| Time | Beat | Picture | Sound |
| --- | --- | --- | --- |
| 0.00 | 0 | Six cards rise in, staggered | Filtered Fm9 pad; a whoosh per card, panned to the card |
| 0.47 | 1 | Hook types on in eighth notes | A tick and pentatonic blip per word; glitch on "AI." |
| 1.88 | 4 | "Can you tell which?" Red selector hops between cards | Groove drops in; one blip per hop, panned to the card |
| 2.81 | 6 | Card 01 dives into the scan panel | Whoosh plus sub drop |
| 3.28 | 7 | SUBJECT 01: skin macro, pore loupe | Shutter on the clap, scan sweep, HUD chatter |
| 4.22 | 9 | SUBJECT 02: fingers 5/5, legible label | Same grammar; the verdict chime climbs each time |
| 5.16 | 11 | SUBJECT 03: face mesh, sun gizmo, specular callout | |
| 6.09 | 13 | SUBJECT 04: strands, catchlights | |
| 7.03 | 15 | SUBJECT 05: live expression telemetry, mouth tracking | |
| 8.44 | 18 | Panel shrinks back into the lineup: "6/6 HUMAN" | Reverse whoosh, "verified" arpeggio |
| 9.38 | 20 | Tags flip to AI-GENERATED, one per sixteenth; footage freezes | Tape stop, glitch per card |
| 10.02 | | "6/6 HUMAN" struck through, "CORRECTION:" | Scratch, typing |
| 10.31 | 22 | **ALL of THEM.** | Impact; riser and snare roll |
| 11.25 | 24 | Cards shrink-wrap into the letters CVCVTA, faces inside (9:16: CVC / VTA) | Drop: Dbmaj9 supersaw, crash |
| 12.42 | | Scan line renders the wordmark solid, left to right | Noise sweep, panned left to right |
| 12.66 | 27 | 16:9: "AI UGC STUDIO / Every face in this reel was generated." | Three-note pluck |
| 12.92 | | 9:16: the two rows reflow into one line | Whoosh, tick |
| 13.13 | 28 | REC dot flies in | Whoosh; Abmaj9 rings out |
| 13.65 | | The dot lands as the "." and the red AI rises; the lockup re-centres (9:16 tagline follows) | Landing pop, bell, two plucks |

## How it's made

- **Picture**: [`index.html`](index.html) and [`src/`](src/). Every frame is a pure function of time
  (`window.seek(t)`). Footage, masks and HUD are drawn on canvas; type and UI are DOM.
  - Timing lives in [`src/config.js`](src/config.js); per-format geometry lives in
    [`src/layout.js`](src/layout.js). Open `index.html?format=9x16` for the vertical cut.
  - The HUD follows real tracking data: MediaPipe face mesh (468 points), eye, mouth and
    blendshape telemetry, computed per frame by [`tools/track.py`](tools/track.py).
  - The card-to-letter morph dilates each glyph around concentric rings, then shrinks it back down.
  - Type: Archivo (variable width animation on the slam), Instrument Serif, JetBrains Mono.
- **Render**: [`tools/render.mjs`](tools/render.mjs) steps headless Chromium frame by frame
  across 4 parallel pages.
  - Motion blur is real: 4–20 sub-frames per frame, averaged with a 180° shutter. Fast moves
    get more sub-frames.
  - Post, in the same pass: lateral chromatic aberration on the hits, vignette, soft film grain.
  - Frames pipe straight into x264.
- **Sound**: [`tools/soundtrack.py`](tools/soundtrack.py) synthesizes the score and sound design
  from scratch in numpy. There are no samples and no creator audio.
  - Instruments: polyBLEP supersaws, FM bells, synthesized drums, tape stop, convolution reverb.
  - Every hit is placed from the same cue sheet as the picture: [`tools/cues.mjs`](tools/cues.mjs)
    exports it from [`src/config.js`](src/config.js).
  - Mastered to about −14 LUFS.

## Rebuild

Requires Node 22+, Python 3.10+, ffmpeg, and Chromium via Playwright.

```bash
cd showreel
npm install
pip install numpy scipy soundfile pyloudnorm opencv-python-headless mediapipe
# put the source clips in footage/ as clip_a.mp4 … clip_e.mp4 (9:16, 24 fps)
tools/build.sh            # both formats -> out/cvcvta-showreel-16x9.mp4, out/cvcvta-showreel-9x16.mp4
tools/build.sh 9x16       # just one
```

Useful while iterating:

```bash
node tools/render.mjs --format 9x16 --stills 3.4,10.4   # PNG stills to build/stills/
node tools/render.mjs --format 9x16 --sheet 0.625       # contact sheet of the whole reel
node tools/render.mjs --sub 1                            # fast preview render without motion blur
```

## Changing things

Everything editorial lives in [`src/config.js`](src/config.js):

- **Copy**: `BRAND` (one letter per card), `TLD`, `TAG_TOP`, `TAGLINE`, `HOOK`, `SUBHOOK`.
- **Lineup**: `CARDS` sets which clip each card shows and the in-points for the lineup and
  the return.
- **Scan**: `SUBJECTS` sets each creator's shot, crop, checks, confidence and callout type.
- **Timing**: `T` is the beat map. Change `BPM` and everything, sound included, follows.
- **Layout**: [`src/layout.js`](src/layout.js) holds card positions, the scan panel, type sizes
  and wordmark rows for each format.

`footage/` and `build/` are git-ignored; the source clips are not committed.

Fonts are under the SIL Open Font License; the license texts are in [`assets/fonts/`](assets/fonts/).
