# Persona OS reel

A 32-second vertical promo reel for [personaos.com](https://personaos.com/), built as code: an
HTML/CSS/JS motion-graphics timeline rendered frame by frame in headless Chromium, with an
original soundtrack and sound design synthesized in Python. No AI video, image or audio
generators are involved.

- `out/personaos-reel.mp4` is 1080×1920, 30 fps, H.264 High with AAC 256 kbps (48 kHz), mastered to about −14 LUFS.
- `out/cover.jpg` is the cover frame, taken from the end card.

## Storyboard

| Time | Scene | On-screen copy |
| --- | --- | --- |
| 0–4 s | A social feed scrolls fast, then snaps to one post that lands | "Most content gets scrolled past." / "Unless it's made for *them.*" |
| 4–8 s | Audience radar sweep | "Better content starts with knowing your audience *deeply.*" |
| 8–10 s | Brand reveal (music drop) | Persona OS · "The *Creative Intelligence* Platform" |
| 10–16 s | Domain → lead AI strategist → specialist agents → 10-phase pipeline | "Start with your domain." / "A lead AI strategist runs the research." / "A 10-phase research pipeline." · Specialist agents · Digital focus groups · Behavioral scoring |
| 16–20 s | Persona cards are dealt in | "Deeply researched personas." "Ready to drive content." |
| 20–25 s | Angle / hook / script / brief cards and channel chips | "Angles. Hooks. Scripts. Briefs." · Ready for Paid · Organic · Email · Creators |
| 25–28 s | Performance loop: the winning hook spawns variants, a loser is stamped RETIRED | "What works *compounds.*" / "What doesn't gets *retired.*" |
| 28–32 s | End card over a wall of content (final drop) | "Scroll-stopping content. *Every single week.*" · Persona OS · personaos.com |

The product claims come from Persona OS's own copy: the 10-phase AI research pipeline with
specialist agents, digital focus groups and behavioral scoring; the lead AI strategist built
from your brand's domain; angles, hooks, scripts and full briefs; performance data flowing
back into personas; "scroll-stopping content for paid and organic — every single week".
Persona names, the sample hook, CTR numbers and `yourbrand.com` inside the UI mockups are
illustrative placeholders. The build environment couldn't load personaos.com itself, so the
wordmark is typographic and the palette is original. To match the real brand, swap in the
logo and colors as described below.

## Build

```bash
npm install                                  # fonts (Fontsource) + Playwright
pip install numpy scipy                      # soundtrack synthesis
./build.sh                                   # full render, ~10 min (8 motion-blur samples per frame)
SUB=1 ./build.sh                             # quick render without motion blur
```

`build.sh` needs `ffmpeg` with libx264 on the PATH and a Chromium that Playwright can launch.
It runs these steps:

1. `render.mjs` serves this folder locally, drives `reel.html` through every frame
   (`window.__render(t)`), and saves JPEG frames. It also writes the sound cue sheet
   (`out/sfx.json`) that the page exports.
2. `music.py` synthesizes the 120 BPM track and places the sound effects from the cue sheet,
   so every whoosh, pop and keystroke lands on its visual.
3. ffmpeg normalizes loudness, averages the motion-blur samples (`tmix`), and encodes the MP4
   and the cover.

Other useful commands:

```bash
node render.mjs --stills 2.1,8.4,31.5        # PNG stills for review → out/stills/
node render.mjs --cues                       # cue sheet only
npx serve .                                  # then open /reel.html to watch it play live
                                             # (/reel.html?t=12&still freezes on 12 s)
```

## Editing

- **Colors** are the `:root` custom properties at the top of `reel.html`. `--grad` is the
  accent gradient used on the serif words, the logo chip and the progress bars.
- **Copy** lives in the `<h1 class="hl">` elements. Wrap a word in `<em>` for the serif accent;
  lines that are too wide shrink automatically to fit the safe area.
- **Logo**: replace the two `.logo` blocks (brand reveal and end card) with an `<img>` or
  inline SVG.
- **Timing**: each scene has a `renderS*` function with its start and exit times in seconds.
  The music's drops are at 8 s and 28 s (`DROPS` in `music.py`), with the stop hit at 2 s.
  Move them together.
- **Music**: the chord progression (`PROG`), instrument spans (`KICK`, `ARP`, …) and mix levels
  are all in `music.py`.

Headlines stay between y ≈ 300 and 1100 px, which keeps them clear of the Reels/TikTok UI
at the top and bottom.
