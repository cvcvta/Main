# Puzzle Piece — "Four circles" · v3 (from scratch, 9:16)

`final.mp4`: 1080x1920, 30 fps, 62.1 s, with the voice-over, score and SFX; 180° shutter motion blur and light grain. `index.html` is the editable film, `STORYBOARD.md` the plan, `score10.py` the score and mix.

## The one idea, and why
The logo is four overlapping colour circles inside a puzzle piece. In this film those circles are the cast:

- **Green is David.** His camo hoodie is already the brand green, in every art style.
- **Orange is his mum.**
- **Teal and red are the world** (the park, the gate, the car).

Act 1 tells the problem as a tiny geometric social story. On "That's why we use Puzzle Piece", the four come home together and the puzzle piece closes around them: the actual logo. In Act 2 the circles become windows onto the real product. The green circle fills with storybook David, the orange with his mum, and four circles hold the four art styles. At the end, a tap on "Start my 7-day free trial" bursts into the four circles, which close into the mark again. Cover the logo and the film still says Puzzle Piece, because the cast *is* the mark.

## The voice
- **What:** your script, read verbatim by the ElevenLabs voice "Juliet - Natural Conversations" (eleven_v4) through your ElevenLabs connector. It cost 2 takes (2,192 credits) plus one transcription.
- **Take:** take A. It breathes at the paragraph breaks and pauses before "Puzzle Piece."
- **Timing:** word timings come from ElevenLabs transcription (scribe). Every caption lands 2 frames before its word, and the scene cuts sit on the sentences.
- **Captions:** they are short verbatim fragments of what she says, not full subtitles. The voice carries the sentence; the screen carries the words that matter.
- **Mix:** the music bed ducks about 10 dB under her voice.

## Beats
| time | buys | picture |
|---|---|---|
| 0-7.9 | whose problem, and that it hurts | green bounces into a paper park; orange arrives, the park slides away; red slams over green (multiplied dark) and he shudders on "meltdown"; doorways pass over him for "daily transitions" |
| 7.9-12.3 | warnings exist and don't work | orange sends warning rings; a five-part countdown ring around green empties; "But a warning only tells him *when*."; the camera dives into him |
| 12.3-17.4 | the missing thing is what happens next | a dotted path draws down the frame; green walks past a teal gate, a red car and an orange house as each is named |
| 17.4-19.7 | the name | the four circles gather and the piece closes around them = the mark (exact geometry from the brand PDF) |
| 19.7-28.9 | social stories, and they're credible | the green circle opens onto storybook David; the circle relaxes into the real "When It's Time to Switch" card; the evidence line |
| 28.9-33.9 | you just say the hard part | the real story-guide question, the answer typing itself, Send, the guide's real reply |
| 33.9-37.4 | he's in it, beside his people | a green circle fills with David, an orange circle beside it with his mum, and both open into the whole scene |
| 37.4-40.5 | the style is theirs | your four style images as four circles in the logo's own layout; they part into a 2x2 with labels; Pixar is tapped |
| 40.5-44.5 | built for tricky moments | the real story list; "Leaving the Park" and "Getting Ready in the Morning" lift as she says them |
| 44.5-48.8 | how it's used | a story page; orange reads first, green joins, then green turns the page slowly |
| 48.8-53.8 | honest: preparing together | green and orange overlap, teal and red join |
| 53.8-58.7 | free before you pay | real "Meet storybook David", "10 of 10 story previews ready" (count + bar), "$0.00 today", tap on the trial button |
| 58.7-62.1 | name and offer | the tap bursts into the four circles, they close into the mark; "Try it free for seven days." |

## What is real, rebuilt, or made for the film
- **Real:**
  - the logo and wordmark (vectors from your brand PDF);
  - your four style images;
  - from your recordings: the story illustration, thumbnails and character;
  - all UI copy, verbatim (question, typed answer, guide reply, story titles, "Meet storybook David.", "10 of 10 story previews ready", "$0.00 today", "Start my 7-day free trial");
  - the script, word for word.
- **Rebuilt:** the UI cards are HTML rebuilds of the captured screens (same copy, Lora + DM Sans, same colours), shown as magnified fragments.
- **Made for the film:**
  - the voice: ElevenLabs synthetic, not a real parent; tell viewers if your ad platform or policy requires it;
  - the geometric park, doorways, path pictograms and countdown;
  - the score and SFX: procedural, made in code.

## Checks
- `lint.mjs`: **GATE G5 PASS**, no warnings.
- `Motion.selfTest` (40 random jumps): **ok, 416 elements, 0 mismatches**.
- `look.py` on the final: **G0 PASS** (62.17 s, audio present) · **G2 PASS** (no run > 3 flat frames) · **G3 PASS** (end hold 1.30 s, final shot 3.50 s = 6 % of the film). Audio −14.0 LUFS integrated, LRA 2.1 LU, true peak −1.9 dBTP, no silent tail, no flags; 16 of 22 cuts within ±80 ms of a sound onset.
- Iterations the gates forced:
  - G2 failed on 5 flat green frames at the end of the dive into David; the dive was shortened.
  - G3 failed twice: the end hold ran 3.4 s, then 1.47 s. The end settle was made visible and the film trimmed to 62.1 s, after her last word (61.46 s).
  - A 4.1 s static card during the evidence line got a slow 3D tilt, a deeper push and a second light sweep.
- By eye:
  - **G1:** UI text is shown as magnified fragments: question 46 px Lora, answer 38 px, list titles 46 px, "10 of 10" 54 px.
  - **G4:** one hero per frame. The four style circles are one composed object, then a parted 2x2.

## Taste record
- v1 (16:9, 30 s, captions only), user: "needs to be 9x16 … don't be confined to the 30 sec … less like an explainer and more of an expensive motion graphics showcase."
- v2 (9:16, 74 s, 3D phone showcase): no reaction recorded yet. The user asked for a from-scratch take with /motionmaxxing (this v3).

## What I'd still improve
- A real parent's voice, if you have one; the picture is cut to the timings, so a re-record means re-syncing about a dozen cut points.
- Higher-res exports of the "When It's Time to Switch" illustration and the story thumbnails.
- The mid-film motion level sits below the tool's "human band". That's deliberate calm for this audience, but the park and path beats could take a little more secondary motion.
