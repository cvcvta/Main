# personaos reel: "Meet Mo"

A 34-second vertical promo reel for [personaos.com](https://personaos.com/), built as code: an
HTML/CSS/JS motion-graphics timeline rendered frame by frame in headless Chromium, with an
original soundtrack and sound design synthesized in Python. No Higgsfield or other AI video,
image or audio generators are involved.

- `out/personaos-reel.mp4` is 1080×1920, 30 fps, H.264 High with AAC 256 kbps (48 kHz), mastered to about −14 LUFS.
- `out/cover.jpg` is the cover frame ("Meet Mo. The best employee you'll ever hire.").

Copy, colors, type and the Mo mascot come from the site. See [BRAND.md](BRAND.md).

## Storyboard

| Time | Scene | On-screen copy |
| --- | --- | --- |
| 0–3.5 s | Mo hops down a to-do list, stamping each item DONE | YOU HAVE A BUSINESS TO RUN. / Your to-do list just got shorter. / Update the website · Figure out what to post · Make the next campaign · Follow up with new leads |
| 3.5–7.5 s | Mo flips to center stage and grows (music drop), looks around, smiles | Meet Mo. Your AI CMO. / The best employee *you'll ever hire.* / Your website, social, and growth. Handled by one remarkable AI. |
| 7.5–11.5 s | The dark "mo / SOCIAL" calendar fills with statics, videos and memes | 01 / MO PLANS YOUR MONTH / Your business. Everywhere it matters. / ✓ Plan ready / Month planned. Content made. Posts scheduled. |
| 11.5–15.5 s | US map: Washington, Texas and New York light up, dotted lines run into Mo | 02 / MO MONITORS YOUR COMPETITORS / Your industry. Coast to coast. / Mo connects the dots. |
| 15.5–19.5 s | Reel, carousel and meme examples fan in | 03 / MO CREATES YOUR CONTENT / Your work. Worth a second look. / Ready for Instagram, Facebook, and TikTok. |
| 19.5–24 s | Dark scene opens out of Mo: campaigns → Mo → Friday 10:00 BOOKED | RESEARCH. CREATE. LAUNCH. / Every click. Closer to booked. / From first click to a confirmed consultation. |
| 24–28 s | Pricing sheet slides up, and the three plans snap in | ONE AGENT. FOUR WAYS TO GROW. / Big capability. At every stage. / Website $49 · Social $99 · Growth $499 |
| 28–34 s | The black Growth card expands into the finale, with Mo glowing and smiling | BIG PLANS. MEET YOUR NEW RIGHT HAND. / Your next great hire is right here. / Put Mo to work — $49/mo / personaos.com |

## Voiceover cut

`out/personaos-reel-vo.mp4` (27.5 s, cover `out/cover-vo.jpg`) is cut to the voiceover in
`assets/vo.mp3`. Every headline word appears as it is spoken. Word timings come from an
offline forced alignment (pocketsphinx), stored in `assets/vo-words.json`.

A pause after each line gives every animation time to land before the next one: about 1–1.4 s
between sections and 0.5–0.8 s between clauses. The pauses are listed in `assets/vo-edit.json`.
They are cut into the silence between words, and sized so each line starts on a beat of the
music. Each scene holds its finished animation through the pause, then changes just before the
next line.

| Time | Voiceover | On screen |
| --- | --- | --- |
| 0.1–2.5 s | "Stop wasting your money on overseas agencies." | An overseas-agency invoice totals up to $4,850/mo while money flies off, then it's stamped CANCELLED |
| 3.9–7.1 s | "Meet Mo, the AI growth agent for HVAC companies." | Mo drops in, and HVAC icons (snowflake, flame, thermostat, fan, wrench, vent) pop around him on "HVAC" |
| 8.4–9.7 s | "He writes your ads, runs them," | An ad for "Your HVAC Co." types itself out, then Google, Facebook and Instagram flip to RUNNING |
| 10.2–12.0 s | "and fills your calendar with booked jobs." | A week calendar fills with booked HVAC jobs, and the counter ticks up |
| 13.3–17.9 s | "Works 24/7, never asks for a raise, never runs out of ideas." | Three lime-check rows: a sun and moon orbit Mo, "Raise? Nah." with a head shake, then a burst of content ideas |
| 19.3–22.9 s | "He's the best team member you'll ever find, the best hire you'll ever make." | Mo's Top Performer profile card, stamped HIRED on "hire" |
| 23.8–25.4 s | "Click the link below to get started today." | A dark finale: a cursor taps "Get started today" on "click", and arrows point down to the link |

Build it with `./build-vo.sh` (same options as `build.sh`). `music-vo.py` cuts the pauses
into the voiceover, evens out the line levels, and reuses the instruments in `music.py`. The
drop lands on "Meet Mo" and the final chord on the bar after "today". The music sits 10–14 dB
under the voice and comes part of the way back up in the pauses.

To change the pacing, edit the `add` values in `assets/vo-edit.json`, and `dur` if the ending
moves. The page and the soundtrack both follow. To use a new voiceover, replace `assets/vo.mp3`,
regenerate `assets/vo-words.json` and `assets/vo-edit.json`, and adjust the word indices in
`reel-vo.html`.

## Assets

All assets come from personaos.com screenshots. The stone & oak remodeler content is the
site's own illustrative example.

| File | What it is |
| --- | --- |
| `assets/mo.png` | Mo cut out as a clean circle with an alpha edge (~1050 px) |
| `assets/mo-body.png` + `mo.json` | Mo with the eyes painted out, plus the eye geometry. The reel redraws the eyes in SVG so Mo can look around, blink and smile. |
| `assets/sparkle.svg` | The logo mark, an exact astroid |
| `assets/reel-mock.png`, `carousel-mock.png` | The site's reel and carousel mockups, with rounded alpha masks |
| `assets/photo-bath-wide.jpg` | Clean bathroom photo crop, used in the meme card |
| `assets/us-states.json` | State outlines from `us-atlas`, generated by `tools-us-states.mjs` |
| `assets/vo.mp3`, `vo-words.json`, `vo-edit.json` | The voiceover, its word timings, and the pauses added after each line (voiceover cut) |

## Build

```bash
npm install                                  # fonts (Fontsource), Playwright, map data
pip install numpy scipy                      # soundtrack synthesis
./build.sh                                   # full render, ~12 min (8 motion-blur samples per frame)
SUB=1 ./build.sh                             # quick render without motion blur
```

`build.sh` needs `ffmpeg` with libx264 on the PATH and a Chromium that Playwright can launch.
It runs these steps:

1. `render.mjs` serves this folder locally, drives `reel.html` through every frame
   (`window.__render(t)`), and saves JPEG frames. It also writes the sound cue sheet
   (`out/sfx.json`) that the page exports.
2. `music.py` synthesizes the 120 BPM track and places the sound effects from the cue sheet
   (hops, checks, the bubble "bloop", pings, the booking ding), so each lands on its visual.
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

- **Colors** are the `:root` custom properties at the top of `reel.html`. They were sampled
  from the site.
- **Copy** lives in the `<h1 class="hl">` elements. Wrap words in `<span class="g">` for the
  purple headline gradient; lines that are too wide shrink automatically to fit.
- **Mo** is one actor driven by `moAt(t)`. `KEYS` holds his position, size, gaze and glow
  per scene, and `BLINKS` and `HAPPY` hold the blink and smile moments.
- **Timing**: each scene has a `renderS*` function with its start and exit times in seconds.
  The music drops at 4 s, 24 s and 28 s (`DROPS` in `music.py`), with the final hit at 32 s.
  Move them together.
- **Music**: the chord progression (`PROG`), Mo's marimba motif (`MOTIF`), instrument spans
  and mix levels are all in `music.py`.

Headlines stay between y ≈ 290 and 1100 px, and CTAs sit above the bottom caption area of
the Reels/TikTok UI.
