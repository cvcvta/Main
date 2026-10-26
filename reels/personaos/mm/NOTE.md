# NOTE: "One hire" (motionmaxxing rebuild of the voiceover cut)

`final.mp4`: 32.3 s, 1080x1920, 30 fps, H.264 + AAC, 180° shutter blur (8 sub-frames), 2.5 % grain.
The comparison is `../out/personaos-reel-vo.mp4` (34 s), made from `../reel-vo.html`.

## The idea, and why
Follow one object through the whole film instead of cutting between seven separate scenes. Each scene's object
becomes the next:
1. The agency invoice is struck out, and Mo lands where it was as the face of a thermostat.
2. The thermostat becomes the picture in the ad Mo writes.
3. A customer taps "Book now", and the button flies into the calendar as the first booked job.
4. The calendar dives into a 2:14 AM booking (24/7).
5. Mo jokes "Raise? Nah.", and ideas spill out of him.
6. He shrinks into the photo on his own staff badge.
7. The badge's "Hire Mo" button (the site's own CTA) is clicked and stretches into the browser's address bar.
8. www.personaos.com types out and becomes the logo.

Every joint is caused by the product's own gesture (write, run, book, hire, click).

## What each beat buys
| beat | the viewer… |
| --- | --- |
| invoice, struck | feels money leaving |
| Mo in the thermostat | meets the replacement, and sees it is for HVAC |
| the ad typing, going Live | watches an ad get written and run |
| "Book now" → calendar fills to 16 | sees the result (the hero moment) |
| 2:14 AM booking | believes 24/7 literally |
| "Raise? Nah." / ideas | gets the character, and the abundance |
| staff badge, "Hire Mo" | understands Mo is a hire |
| click → address bar → logo | knows where to go |

## Real vs illustrative
- **Real:** the voiceover (yours, with the pauses from `../assets/vo-edit.json`), Mo (the site's render), the
  sparkle mark, the brand colours, the "Hire Mo" CTA wording, and the Google/Facebook/Instagram marks.
- **Illustrative, invented:** the overseas invoice and its amounts, "Your HVAC Co." and its ad, the calendar jobs,
  the 2:14 AM booking, the idea titles, and the staff badge. No prices or stats from personaos are claimed.

## Measured (scripts, not my judgement)
- **`look.py --expect 32.3 --expect-audio --events`:**
  - **G0 PASS:** 32.30 s, audio present.
  - **G2 PASS:** no run of more than 3 flat frames.
  - **G3 PASS:** end hold 1.13 s; final shot 1.80 s, 6 % of the film.
  - **Audio:** −14.0 LUFS, LRA 5.5 LU, true peak −1.5 dBFS.
  - **Motion note:** mean luma change 0.9/255, below the human band (median 6.8). That is mostly ink on a constant
    white ground (the user asked for one white throughout) and the 4-second typing the user asked for.
  - **Audio note:** it flags "dropouts" at the voiceover's pauses (for example 7.18-8.08 s and 17.94-19.16 s). They are
    the intended silent pauses: there is no music, at the user's request.
- **`lint.mjs` G5 PASS.** One earlier fail was fixed by deleting the copy, not by arguing it: the idea chip
  "5-star review reel" read as a counter (C3) and is now "Review reel".
- **`Motion.selfTest`:** ok, 24 random jumps, 398 elements, 0 mismatches.
- **Environment caveats:** this machine's ffmpeg has no `ffprobe` and no `drawtext`. `look.py` ran with a small
  ffprobe shim and without its timecode overlay; the gate maths is unchanged. The final render did not write its
  events file, so `--events` used the identical events from the stills run of the same page.
- **G1 and G4 by eye on the sheet.**
  - **G1 (proof readable):** the invoice total (168 px), the ad headline (56 px), the counter (44 px in a pill),
    the 2:14 AM tile (66 px), the badge name (150 px) and the URL (50 px, pushed in to about 58 px) read.
  - **G1 shortfall:** the calendar job titles (25 px) are texture, below 0.04 H.
  - **G4:** one hero per frame. The caption always sits above the hero, never beside it.

## Frame by frame (sheet)
1. Invoice counting up under "Stop wasting your money"; a bill slips out.
2. The total struck through: $4,850/mo.
3. "Mo." large; Mo inside a thermostat dial at 62°.
4. The dial at 72°; Mo smiling.
5. The ad being typed; Mo beside the copy.
6. The calendar filling (11 booked).
7. Mid-dive into the hour column (shutter blur).
8. Mo alone with "never asks".
9. Ideas flying out of Mo.
10. The badge swinging in.
11. The badge with Mo in the photo.
12. "Hire Mo" under "The best hire you'll ever make."
13. The address bar under "Click the link below".
14. "www.per" typing.
15. "www.personaos.c" typing.
16. The logo.

None reads as a slide. The badge frame comes closest to a centred card.

## Departures from the skill, on the user's instructions
- One flat paper-white ground for the whole film, no music, and the letter-by-letter address typing. The skill allows
  typing in the product's own input.
- The 4-second typing pace and the search-bar-to-logo transformation are the user's requested outro.

## What I would still improve
- The motion level is low. A slow camera drift across more of the holds, or a real paper-texture plate, would lift it
  without breaking the one-colour rule.
- The lanyard now fades out above the badge, which reads a little like a stub.
- The calendar titles are small for G1.
