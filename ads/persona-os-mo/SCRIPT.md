# Persona OS — "Hire Mo" (9:16, 35 s)

The reference ad's beat structure, rewritten for Persona OS / Mo, the AI CMO. The copy is new and
uses claims from personaos.com only ($49 / $99 / $499 plans; designer, writer and SEO specialist in one;
statics, memes and video; 24/7, no annual raise; "Hire Mo — from $49").

Brand system: off-white `#FAFAF7`, ink `#111116`, Persona purple `#6938F5`, lilac `#B9A3FF`,
lavender `#EAE6F0`. Inter Display Black for kinetic type, Inter for UI. Mo is the glassy violet orb
with two eyes from the site hero. The "personaos" wordmark uses the four-point sparkle.

| # | Time | Beat (reference) | Persona OS visual | VO |
|---|------|------------------|-------------------|----|
| 1 | 0.0–2.6 | Hook question | Owner at his desk, typing, worn out. Big question on the white wall, purple "MARKETER?". Mo pops in by his shoulder. | Still trying to hire a marketer? Mo starts today. |
| 2 | 2.6–7.1 | Hidden costs | Plate shrinks into a card on a lavender grid room. Cost tags stack with purple "+" chips. | Add up what one hire really costs you. Salary. Benefits. Months of ramp-up. |
| 3 | 7.1–9.5 | Hire leaves | Card shakes, greys out and falls away, leaving a dashed "OPEN ROLE" slot. Inverted flash into the dark world. | And when they quit mid-campaign? Back to square one. |
| 4 | 9.5–12.7 | Brand reveal | Dark violet stage, Mo inside a glowing ring, "personaos" wordmark. | Persona OS puts a whole marketing team into one AI. |
| 5 | 12.7–16.5 | Team roles | Purple role cards fly in around Mo: Designer, Writer, SEO, Social, Ads. | A designer. A writer. An SEO specialist. Social and ads. |
| 6 | 16.5–18.8 | Year-round coverage | Mo's content calendar: the month flips JAN→DEC while STATIC / VIDEO / MEME chips fill the grid. Planned ✓ Made ✓ Posted ✓. | Every month: planned, made, and posted. |
| 7 | 18.8–20.6 | "What no employee can offer" | A glowing clock ring with hands spinning: time passing. | And here's what no hire can match. |
| 8 | 20.6–24.5 | Flexibility | Mo grows from a point of light, one step per line. Plan pills stack up: Website + SEO $49, + Social $99, Full AI CMO $499. | Start with your website. Add social when you're ready. Go full CMO when you grow. |
| 9 | 24.5–26.1 | Always on | Huge glowing "24/7" with Mo in front, blinking. "No days off." | On the job, twenty-four seven. |
| 10 | 26.1–29.0 | Three "No" lines | Off-white paper: NO RAISES. NO COMPLAINTS. NO AGENCY TO CHASE. Wordmark. | No raises. No complaints. No agency to chase. |
| 11 | 29.0–31.2 | Qualifier | Owner from above in a purple spotlight, slow push-in. Purple light-leak burn out. | If your marketing keeps getting pushed to next week… |
| 12 | 31.2–35.3 | CTA | Owner at the table, relaxed half-smile. TAP BELOW / HIRE MO / FROM $49/MO, plus the site's "Hire Mo — from $49 →" button with a tap ripple. | Tap below, and hire Mo from forty-nine dollars a month. |

## Assets

- Plates (Higgsfield, GPT Image 2.6, one identity across all three): `build/plates/desk.jpg`, `spot.jpg`, `cta.jpg`.
- VO: ElevenLabs v4, voice "Erik – Deep, Bold Commercial", take A (`build/vo_take_a.mp3`). Pauses are
  tightened and the take is sped up 1.15× in `timeline.py`.
- Music + SFX: synthesised in `build/audio.py` (118 BPM). Kick drops in at the brand reveal and
  breaks down at "what no hire can match". Whooshes on cuts, booms on the reveal and CTA, ticks on
  calendar chips. Mixed to −14 LUFS.

## Rebuild

```bash
cd ads/persona-os-mo/build
python3 timeline.py vo_take_a.mp3 out          # out/vo_tight.wav + out/timeline.json
node render.js out/timeline.json frames        # frames/f00000.jpg … + frames/scenes.json
python3 audio.py out/timeline.json frames/scenes.json out/vo_tight.wav out/mix.wav
ffmpeg -framerate 30 -i frames/f%05d.jpg -i out/mix.wav -c:v libx264 -crf 20 -pix_fmt yuv420p \
  -movflags +faststart -c:a aac -b:a 192k -shortest ../persona-os-mo-ad.mp4
```

The renderer needs Playwright + Chromium and the Inter / Inter Display fonts installed on the system.
