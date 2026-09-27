# personaos: brand notes for the reel

Taken from screenshots of personaos.com (September 2026). This supersedes the earlier
"Creative Intelligence Platform" copy, which came from stale search results.

## Positioning

**Meet Mo. Your AI CMO.** One AI agent that runs a small business's website, SEO, social
and growth. It costs from $49/month with the website and SEO included. The examples are
aimed at local and home-service businesses: "You handle the homes." "Handled while you're
out handling the job."

## Copy inventory

| Where | Copy |
| --- | --- |
| Announcement bar | YOUR AI CMO. FROM $49 / MONTH. |
| Hero eyebrow | Meet Mo. Your AI CMO. |
| Hero headline | The best employee / *you'll ever hire.* (second line in the purple gradient) |
| Hero sub | Your website, social, and growth. Handled by one remarkable AI. |
| CTAs | Hire Mo › · HIRE MO · Hire Mo for $49/month → |
| Price line | From $49/month. Website + SEO included. |
| Mascot section | Always on. Already on it. · More time for the part only you can do. · 24/7. No complaints. No annual raise. |
| Purple band | ONE AGENT. A WHOLE LOT OFF YOUR PLATE. |
| To-do section | YOU HAVE A BUSINESS TO RUN. · Your to-do list just got shorter. · Update the website / Figure out what to post / Make the next campaign / Follow up with new leads, each struck through with DONE |
| Website + SEO | MO / WEBSITE + SEO · Your next job starts here. · $49 /month · YOUR WHOLE WEB TEAM · You handle the homes. Mo handles your site, your SEO, and every update that comes next. · Website: Your look. Your brand. · SEO: Built to be found. · Upkeep: Always current. · Web design. Fresh content. SEO. All included. |
| 01 | YOUR INSPIRATION. YOUR WEBSITE. · Any inspiration. Your kind of website. · Send Mo a site you love. He makes it yours. Your services. Your photos. Your name. · Style picker: Minimal (FORM STUDIO, "Room to breathe."), Editorial (THE SLOW HOME, "A little everyday beautiful."), Bold (GOOD ENERGY, "MAKE SOME NOISE.") · Drop in a website you love · MADE FOR YOUR BUSINESS |
| Preview | stone & oak, BATHROOMS & FLOORS / AUSTIN, TX · Better spaces. Better mornings. · Thoughtfully remodeled. Beautifully yours. · Plan your bathroom remodel → · "Illustrative inspiration and website preview." |
| 02 | STILL WORKING AFTER LAUNCH · Your website is live. Mo stays on the job. · Fresh content. Local SEO. Your latest work. Handled while you're out handling the job. |
| Web-team card | MO / YOUR WEB TEAM · ON · Fresh content. Written. "What does a bathroom remodel cost?" ✓ New guide published · Local search. Handled. Service pages, titles, links + local keywords. ✓ SEO updated · Latest work… (cut off in the screenshot) |

## Palette (sampled)

| Token | Hex | Use |
| --- | --- | --- |
| Purple | `#623AEC` | logo sparkle, primary buttons, purple band, section labels, DONE |
| Ink | `#111115` | headlines, announcement bar, black pill buttons |
| Paper | `#FAFAF7` | page background (warm off-white) |
| Stone | `#EFEEE9` | alternate section background |
| White | `#FFFFFF` | cards |
| Lime | `#EBFDA0` | check circles; the "Bold" style card |
| Headline gradient | `#3B2669` → `#6141B3` → `#8A74D0` | "you'll ever hire." |
| Greys | `#656569` body · `#75757A` fine print | secondary text |
| Olive / clay (preview only) | `#545C4E` / `#4F4439` on `#F1EEE8` | stone & oak mock site |

## Type

- Headlines use a display grotesk, SF Pro / Inter Display style, semibold, with tight but
  not cramped tracking. The reel uses Inter with `opsz 32`, weight about 620, tracking −0.025em.
- The wordmark is lowercase `personaos`, bold, tracking about −0.03em, next to the sparkle.
- Labels are uppercase, semibold, widely tracked (about 0.18em), in purple or grey.
- The preview mock uses a book serif ("Better spaces. Better mornings.").

## Marks and components

- **Sparkle**: a four-cusp astroid in `#623AEC`, rebuilt as `assets/sparkle.svg`.
- **Mo**: a glass bubble with a purple swirl on the left, cream on the right, and two glossy
  charcoal oval eyes with a white highlight. It floats over a soft violet floor shadow.
  `assets/mo.png` is cut from the site screenshot (≈1050 px). `assets/mo-body.png` is the same
  image with the eyes painted out, so the reel can redraw the eyes to blink and look around
  (geometry in `assets/mo.json`).
- Pill buttons in purple or black, rounded white cards with hairline borders, lime check
  circles with black ticks, strike-through to-dos with purple DONE, a purple band with white
  tracked caps, and Mo orbited by small app icons (Google, browser, doc) under "YOUR WHOLE WEB TEAM".
