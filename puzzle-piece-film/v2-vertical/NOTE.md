# Puzzle Piece — "The missing piece" · v2 (9:16 showcase)

`final.mp4`: 1080x1920, 30 fps, 73.6 s, AAC stereo, 180° shutter motion blur (8 sub-frames per frame) and light film grain. `index.html` is the editable film. `score9.py` is the procedural score; every sound effect is placed from the film's own `sfx` markers.

## What changed from v1, per your notes
- **9:16 vertical** (1080x1920). Every scene was recomposed for the frame, not cropped from v1.
- **Your high-res style art** (2000x1644) drives the style beat at full size: a card deck flicks through Pixar → LEGO → Minecraft → Simpsons, then fans into the labelled 2x2 grid and a tap picks Pixar. The Pixar scene also opens out of the phone ("with the people they know beside them") and fills a page of the book.
- **No 30 s cap.** Each script paragraph gets about the time it takes to say aloud (≈ 2.7 words/s), so every scene breathes, and a voice-over of the full script can be laid on top without re-cutting. The scene table is one line in `index.html` (`const T = {...}`) if you want it retimed to a recorded VO.
- **Showcase, not explainer.** On-screen copy is cut to one large statement per scene; the picture does the rest:
  - a 3D phone carries the real flow: the screen scrolls between real screens, the camera pushes in on the answer field, and the guide's reply lifts out of the screen;
  - the story list floats as a tilted plane in space;
  - the picture book turns portrait pages, then turns back to the first page for "again at his pace";
  - the brand's four colours drift as soft pools of light behind the product act;
  - the ending builds the mark from its four overlapping circles.

## Scenes
| time | scene | on screen |
|---|---|---|
| 0.0-7.0 | hook | an ink park gate draws itself; "My son is autistic." / "Leaving the park can mean a meltdown." / "Daily transitions have always been tough."; the drawing shudders and the camera dives through the gate |
| 7.0-13.2 | warnings | a 5-4-3-2-1 countdown that speeds up as the tick ring empties; "But a warning only tells him *when*." |
| 13.2-19.4 | what happens next | three jigsaw story panels lock in down the frame (the gate, the car, the drive home), each drawing itself; an empty dashed slot is left at the bottom |
| 19.4-22.7 | name | the mark crashes into the slot, the panels fly off, and the mark rises into the lockup with the wordmark |
| 22.7-29.3 | social stories | the real "When It's Time to Switch" story card tilts up into frame; definition line; "On a university list of evidence-based practices for autistic kids." |
| 29.3-36.5 | tell it | 3D phone with the real story-guide question; the answer types itself; Send; the guide's real reply lifts out of the screen |
| 36.5-42.8 | put them in | the page scrolls to "Their face. A little storybook magic."; photo → arrow → storybook David; his frame opens into the Pixar scene with his mum |
| 42.8-49.7 | styles | the deck of your four styles, then the grid; Pixar picked |
| 49.7-54.7 | practice | the real story list (all ten titles) as a plane in space; "Leaving the Park" and "Getting Ready in the Morning" lift |
| 54.7-60.5 | read | a portrait picture book: "I read it first." / "Then we read it together," / "and again at his pace." (the title page turns back) |
| 60.5-65.7 | together | the four brand circles drift into overlap behind "It doesn't replace his therapist. But it finally gives us a way to prepare together." |
| 65.7-71.7 | free account | a second phone: "Meet storybook David.", "10 of 10 story previews ready" (count + bar), "$0.00 today", tap on "Start my 7-day free trial" |
| 71.7-73.6 | end | the circles close into the mark; wordmark; "Try it free for seven days." |

## What is real, rebuilt, or made for the film
- **Real:**
  - the logo and wordmark, rebuilt exactly from the brand PDF's vectors;
  - your four style images;
  - from the recordings: the "When It's Time to Switch" illustration, the story thumbnails and the photo → character example;
  - all UI copy, verbatim: the question, the typed answer, the guide's reply, "Their face. A little storybook magic.", the ten story titles, "Meet storybook David.", "10 of 10 story previews ready", "$0.00 today", "Start my 7-day free trial", and the domain in the address bar.
- **Rebuilt:** the phone screens are faithful HTML rebuilds of the captured pages (same copy, Lora + DM Sans, same colours), so they stay sharp under camera moves. The phone body is drawn for the film.
- **Made for the film:** the ink drawings, the countdown, the book (its title page uses the real story title and the app's "Made for David" label), the light pools, and the score/SFX.
- The "When It's Time to Switch" illustration only exists at ~865 px in the recordings, so it is a 2x sharpened upscale and slightly softer than your style images.

## Checks
- `Motion.selfTest` (40 random jumps): ok, 686 elements, 0 mismatches (seek-safe, so the chunked parallel render matches a straight render).
- `lint.mjs`: GATE G5 PASS (no page chrome, counters, kickers or deck layouts).
- `look.py` on the final: **G0 PASS** (73.67 s, audio present) · **G2 PASS** (no run > 3 flat frames) · **G3 PASS** (end hold 0.90 s, final shot 1.93 s = 3 % of the film). Audio −14.0 LUFS integrated, LRA 5.0 LU, true peak −1.7 dBTP, no silent tail.
- Rendering: four parallel chunks with 180° shutter blur (8 sub-frames). Frames 36.4–43.0 s were re-rendered after easing a camera push so a caption no longer overlaps the phone, then spliced (2210 frames total). `score9.py` reads `events.json` for its sound cues (`EVENTS=events.json FILM_DUR=73.6 python3 score9.py`).
- Motion level sits below the "human band" the tool prints. That's partly the light paper ground and partly the deliberate calm pace for this audience; it's a question, not a gate.

## What I'd still improve
- A recorded or ElevenLabs voice-over of the full script. The timing is already built for one.
- Higher-res sources for the "When It's Time to Switch" illustration and the story thumbnails (the recordings cap them).
