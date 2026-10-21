# Puzzle Piece — "The missing piece" · 30 s hero explainer

Files: `final.mp4` (1920x1080, 30 fps, 30.00 s, AAC stereo), `index.html` (the editable film: open it through a local server or render it with the motionmaxxing `render.mjs`), `STORYBOARD.md` (PAGE, brand inventory, ideas, beat table), `score.py` (the procedural score and SFX, cut to the film's frames).

## The one idea, and why
A warning only tells a child *when*. The film shows *what*: the brand's own shape, a jigsaw piece, becomes three interlocking story panels (the gate, the car, the drive home). A dashed empty slot is left at the end of the strip, and the Puzzle Piece mark lands in it as the missing piece. From there the film documents the real sign-up flow from the screen recordings. It ends by building the logo exactly the way the brand PDF builds it: four overlapping colour circles clipped to the piece. The circles slide together, which echoes "prepare together".
Why: the logo's tab/blank geometry is literally how moments connect, which is what a social story does. A competitor can't run this film with its own logo swapped in.

## Script length vs 30 s (decision)
The script is 188 words. Spoken, that runs about 65-75 s, and as on-screen text it would need about 6 words/s, which can't be read. I kept your 30 s and gave every paragraph its own beat, in script order. The on-screen words are your script's own words, trimmed to the phrase that carries each paragraph. There is no voice-over in this cut (no ElevenLabs key was available to the toolkit, and the full script doesn't fit 30 s anyway). If you want the full script read aloud, the beat table is data, so the film can be retimed to a ~70 s VO.

## Beats (what each one buys)
| # | time | buys | on screen |
|---|---|---|---|
| 1 | 0.0-2.8 | whose problem, and that it hurts | an ink park gate draws itself; "My son is autistic." / "Leaving the park can mean a meltdown." The drawing trembles, then the camera dives through the gate |
| 2 | 2.8-5.5 | warnings exist and fail | a 5-4-3-2-1 "more minutes" countdown with the tick ring emptying; "But a warning only tells him *when*." |
| 3 | 5.5-8.7 | the gap is *what happens next* | three jigsaw story panels lock in with a knock, each drawing itself: the gate, the car, the drive home; a dashed empty slot remains |
| 4 | 8.7-10.2 | Puzzle Piece is the answer | the mark crashes into the slot; the strip whips away; mark + wordmark lockup; "That's why we use" |
| 5 | 10.2-12.9 | what a social story is, and that it's credible | the real "When It's Time to Switch" story card; definition line; "On a university list of evidence-based practices for autistic kids." |
| 6 | 12.9-15.9 | you just tell it like a friend | the real story-guide question; the real answer types itself; Send is pressed; the real guide reply arrives |
| 7 | 15.9-17.9 | the child is in the story, with their people | the real "Their face" card: the photo → arrow → character reveal, which then opens onto David and his mum |
| 8 | 17.9-20.5 | pick the style they love | one scene wipes LEGO → Minecraft → Simpsons, then shrinks into the four labelled tiles from your image; the cursor picks Pixar |
| 9 | 20.5-22.3 | built for the hard moments | the real story list: Leaving the Park, Leaving a Favorite Place, Saying Goodbye, Getting Ready in the Morning |
| 10 | 22.3-24.1 | how it's used | a picture book: "I read it first." / "Then we read it together," / "and again at his pace." (the last page turn is slow) |
| 11 | 24.1-25.9 | honest positioning | the four brand circles drift together behind "It doesn't replace his therapist. But it finally gives us a way to prepare together." |
| 12 | 25.9-28.2 | free to see before paying | real "Meet storybook David.", "10 of 10 story previews ready" (bar fills), "$0.00 today"; the trial button is pressed |
| 13 | 28.2-30.0 | the name and the offer | the circles close into the mark, the wordmark arrives, "Try it free for seven days."; ~1.0 s resolved hold |

## What is real, what is rebuilt, what is illustrative
- **Real (from your files):** logo mark and wordmark, extracted as vectors from `pp-brand.pdf` and rebuilt exactly (piece path + four multiplied circles). The four art-style images and their labels come from your style image. "When It's Time to Switch" illustration, story thumbnails and the photo → character example are cropped from the screen recordings. All UI copy is verbatim from the recordings: the story-guide question, the typed answer, the guide's reply, "Their face. A little storybook magic.", the story titles, "Meet storybook David.", "10 of 10 story previews ready", "$0.00 today", "Start my 7-day free trial".
- **Rebuilt:** the UI cards are faithful HTML rebuilds of the captured screens (same copy, Lora + DM Sans, the app's cream/mint/yellow), so they stay crisp under camera moves. The book's title page uses the real story title.
- **Illustrative (made for the film):** the ink drawings (park gate, car, drive home), the countdown, the paper texture, the book page-turn staging, and the full score/SFX.
- Upscaling: the style tiles are 394 px wide in the source, so the big single-scene wipe uses 2x Lanczos upscales and is slightly soft. The tiny story thumbnails are shown at ~1.7x.

## Checks (numbers from the scripts)
- `look.py final.mp4 --expect 30 --expect-audio`: **G0 PASS** (30.00 s, audio present) · **G2 PASS** (no run > 3 flat frames) · **G3 PASS** (end hold 1.00 s, final shot 1.80 s = 6 % of the film). 18 cuts, mean shot 1.58 s, no frozen stretch ≥ 0.6 s.
- Audio: integrated **-14.3 LUFS**, LRA 4.7 LU, true peak **-1.1 dBTP**, no silent tail, 7 of 18 cuts within ±80 ms of a sound onset (39 %). The one near-miss (28.20 s) is the trial-button click, which is synced to the on-screen press, not to the cut.
- `lint.mjs index.html`: **GATE G5 PASS** (no corner labels, counters, kickers, deck layouts, progress bars or generic UI cards).
- `Motion.selfTest` (40 random jumps): **ok, 615 elements, 0 mismatches**, so every frame is seek-safe.
- G1 (by eye): the primary UI text is ≥ 0.04 H (story-guide question 46 px, typed answer 36 px, story titles 44 px, "10 of 10" 54 px). Some secondary UI lines (story card description, tile labels, "Your answer") are smaller than 0.04 H; they're supporting text, not the proof.
- G4 (by eye): one hero per frame; the four style tiles appear only as the wide shot after the single-scene wipe.
- Motion note: mean luma change 2.3/255 is below the human band (median 6.8). That's partly the light paper ground, and it's a deliberate calm pace for this audience; it's a question, not a fail.

## One-sentence frame descriptions (final contact sheet)
1. 0.9 s: an ink park gate half-drawn on warm paper, "My son is autistic." in italics below; hero = the drawing.
2. 2.8 s: a huge serif "5" inside a ring of clock ticks; hero = the numeral.
3. 4.7 s: the "1" small in an emptied tick ring as "But a warning only tells him when." builds; hero = the line.
4. 6.5 s: the gate panel locked, the car panel arriving; "what happens next" underlined in yellow marker.
5. 8.4 s: three interlocking panels (gate, car, drive home) and a dashed empty slot; hero = the strip.
6. 10.3 s: the real "When It's Time to Switch" card rising into frame.
7. 12.2 s: the story card with the definition and evidence lines above it.
8. 14.0 s: the mint story-guide card with the answer typing into the field.
9. 15.9 s: the "Their face" card scrolling in, photo first.
10. 17.8 s: David and his mum, Pixar style, under "with the people they know beside them."
11. 19.7 s: the four style tiles, Pixar selected with a yellow ring.
12. 21.5 s: the real story list, four rows.
13. 23.4 s: a picture-book page mid-turn; "Then we read it together,".
14. 25.3 s: four translucent brand circles overlapping behind the "together" line.
15. 27.2 s: "Meet storybook David" and "10 of 10 story previews ready" with the green bar full.
16. 29.0 s: the full-colour Puzzle Piece mark + wordmark, "Try it free for seven days." building.

## What I'd still improve
- A voice-over. A 70 s cut with the full script read would let the picture breathe more. A 30 s VO would need a shortened script, which is your call.
- Higher-resolution source art for the styles (the 394 px tiles limit how big the style wipe can go).
- A licensed or composed music track; the score here is procedural (felt piano, music box, pads) and cut to the picture.
