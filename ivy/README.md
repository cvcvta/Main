# Ivy · 15-second spot

A 15-second, 16:9 motion piece for [Ivy](http://joinivy.ai), the business platform with an AI that does the work.

**Watch:** [`out/ivy-spot.mp4`](out/ivy-spot.mp4) (master, 1920×1080, 30 fps, H.264 + AAC, 15.0 s, −14 LUFS) ·
[`out/ivy-spot-web.mp4`](out/ivy-spot-web.mp4) (about 10 MB, for sharing) ·
poster [`out/poster.jpg`](out/poster.jpg) · end card [`out/endcard.jpg`](out/endcard.jpg)

## The idea

One night in a one-person business, fixed in 15 seconds.

It's 11:48 PM for Maya Reyes, a portrait photographer who works alone. Seven apps land one per
eighth note, and a single stitched thread laces them together while the monthly bill rolls up.
The thread pulls taut, **$138/mo** slams in, and the clock time-lapses past 1 AM. Then a line of
Ivy green cuts the night in two, and the halves fall away onto Ivy.

The camera cranes down the sidebar one module per tick, then pulls back to show the whole
platform on desktop and iPhone. The hero moment plays like a product close-up:

1. Maya types her ask.
2. Ivy highlights the three things it heard and turns them into a plan built from her own
   Contracts and Bookings.
3. One tap approves it.
4. The automation flies into the sidebar under Marketing and switches on.

To close, the window collapses into the app icon, the camera flies through the icon into brand
green, and the wordmark rides out ahead of the line and the offer.

## Cue sheet (128 BPM, 8 bars = exactly 15.0 s)

| Time | Beat | Picture | Sound |
| --- | --- | --- | --- |
| 0.00 | 0 | Seven apps land, one per eighth; one thread stitches them; the monthly total rolls | Clock tick-tock, a different ping per app, the thread zips card to card |
| 1.64 | 3.5 | The thread pulls taut | String twang |
| 1.88 | 4 | **$138/mo** slams to centre, apps pushed back out of focus | Reverse swell, impact |
| 2.11 | 4.5 | "Plus hours of admin at night." | Type ticks, a heartbeat |
| 2.58 | 5.5 | The clock time-lapses to 1:12 AM | Ratcheting ticks |
| 3.05 | 6.5 | Ivy-green light draws across the frame | Laser shing, panned left to right |
| 3.28 | 7 | The night splits along the light and falls away | Crack, glass shimmer, D major swells in |
| 3.40 | 7.25 | Camera on the Ivy logo, then cranes down the sidebar | One tick per menu item, up the scale |
| 3.75 | 8 | "One platform." | The groove drops, bell chord |
| 4.57 | 9.75 | Pull back: the whole workspace, the iPhone slides in | Whoosh, phone swoosh |
| 5.63 | 12 | Push into the Ivy composer | Whoosh |
| 6.09 | 13 | Maya types the ask. Caption: "Just ask Ivy." | Laptop keys |
| 8.09 | 17.25 | Sent. Ivy highlights three phrases | Send pop, sparkle |
| 8.32 | 17.75 | The plan builds row by row as the phrases fly in; chips show her Contracts and Bookings. "It already knows your business." | Rising plucks |
| 9.38 | 20 | One tap: **Approved**. "One tap to approve." | Button tock, Ivy's two-note motif (D to A), crash |
| 9.61 | 20.5 | The automation flies to the sidebar | Whoosh, right to left |
| 9.96 | 21.25 | It lands under **Marketing** | Thunk |
| 10.20 | 21.75 | It switches on | Toggle click |
| 10.78 | 23 | The window collapses into the app icon | Riser, low-pass closes on the groove |
| 11.25 | 24 | The icon lands | Bloop, half a beat of air |
| 11.48 | 24.5 | The camera flies through the icon into brand green; the wordmark rides out | Whoosh, impact, Gmaj9 bloom |
| 11.95 | 25.5 | "The business platform with an AI that does the work." | A note per word |
| 12.66 | 27 | $8.99/week or $374.99/year | Keys |
| 13.13 | 28 | 14 days free, $0 today. | Home to Dmaj9, the motif again |
| 13.36 | 28.5 | joinivy.ai, held to the end | Tail to 15.0 |

## Against the brief

- **Platform:** the word is "platform" throughout, never "OS".
- **Cast:** one solo, Maya Reyes, portrait photographer. There's one avatar and no team or seat UI anywhere.
- **Problem:** HoneyBook, Calendly, Acuity, QuickBooks, Mailchimp, Squarespace and DocuSign, at **$138/mo** (the site's figure), plus hours of admin at night. Apps appear by name and category only, with no third-party logos.
- **Solution:** one workspace with Clients, Bookings, Invoices, Contracts, Messages, Marketing and Website, plus the iPhone app.
- **Ivy:** lives inside the workspace, already knows the business (it pulls the Welcome Packet from Contracts and the 15-minute intro call from Bookings), and does the task when asked.
- **One-tap approval:** shown on the plan ("Nothing goes out without your OK.") and in the tap itself.
- **Hero moment:** the exact prompt, Ivy's summary, Approve, and the automation appearing under Marketing.
- **Never list:**
  - No AI vendor is named.
  - No zero-fee claim. "$0 today" appears only as the trial line, and the stack counter never visibly reads $0.
  - No teams or seats.
  - The stack is cut away and replaced, never connected, so no DocuSign or QuickBooks integration is implied.
  - No social proof.
  - No em dashes on screen. Every text node in the DOM is checked.
- **Price:** $8.99/week or $374.99/year. 14 days free, $0 today.

## Brand files and type

The official logo, app icon and colours weren't in this workspace, so the render uses stand-ins:

- The wordmark is set in type.
- The app icon is a green squircle carrying that wordmark.
- The palette comes from `PALETTE` in [`src/config.js`](src/config.js).

To use the real files, drop them into [`assets/brand/`](assets/brand/) (see its README) and rebuild. No code changes are needed.

The brief asks for Neue Haas Grotesk, or Helvetica Neue if unlicensed. Neither ships with this
machine, so the spot is set in **Aileron** (CC0), a Helvetica-lineage grotesk with a full weight
range. To switch, put licensed NHG Display files in [`assets/fonts/`](assets/fonts/) and point the
five `@font-face` rules at the top of [`src/style.css`](src/style.css) at them.

## How it's made

- **Picture:** [`index.html`](index.html) and [`src/`](src/). Every frame is a pure function of time (`window.seek(t)`), built in DOM, SVG and CSS.
  - The Ivy workspace is a real laid-out UI in a 2.5D camera. It gets a 3D tilt only on the wide shot; close-ups stay 2D so the type rasterizes crisp.
  - The night is built twice and clipped along the cut, so the split slices through the type.
  - The layout tree is rebuilt every frame, so each frame is independent of render order. This avoids a Chromium paint-cache issue with positioned children inside animated clips.
- **Render:** [`tools/render.mjs`](tools/render.mjs) steps headless Chromium frame by frame across parallel pages.
  - Motion blur is real: 6 to 16 sub-frames per frame, averaged with a 180° shutter.
  - Grain, vignette and a touch of lateral chromatic aberration on the hits are applied in the same pass.
  - Frames pipe straight into x264.
- **Sound:** [`tools/soundtrack.py`](tools/soundtrack.py) synthesizes the score and every effect in numpy. There are no samples.
  - The night is a B minor drone and clock. The groove is D major, with a round kick, clap, e-piano stabs, a marimba arp and a sub bass.
  - Every UI hit is placed from the same cue sheet as the picture ([`tools/cues.mjs`](tools/cues.mjs) exports it) and panned to where it happens on screen.
  - Mastered to −14 LUFS with a −1.2 dBFS ceiling.

## Rebuild

Requires Node 22+, Python 3.10+, ffmpeg, and Chromium via Playwright.

```bash
cd ivy
npm install
pip install numpy scipy soundfile pyloudnorm
tools/build.sh            # cues, soundtrack, render, mux, stills -> out/ivy-spot.mp4 + ivy-spot-web.mp4
```

Useful while iterating:

```bash
node tools/render.mjs --stills 3.4,9.4              # PNG stills to build/stills/
node tools/render.mjs --sheet 0.5                   # contact sheet of the whole spot
node tools/render.mjs --noblur --fast --out out/preview.mp4   # quick preview, no motion blur
```

## Changing things

Everything editorial lives in [`src/config.js`](src/config.js):

- **Copy and price:** `COPY`.
- **Cast:** `OWNER`.
- **The stack:** `STACK`, with names, categories and positions.
- **Timing:** `T`, the beat map. Change `BPM` and everything follows, the soundtrack included.
