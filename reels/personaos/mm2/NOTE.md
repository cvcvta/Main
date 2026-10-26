# NOTE: "Mo is the o" (motionmaxxing, from scratch)

`final.mp4`: 27.6 s, 1080x1920, 30 fps, H.264 + AAC, 180° shutter blur (8 sub-frames), 2.5 % grain.
Same voiceover (with the pauses from `../assets/vo-edit.json`), same Mo, same paper white, no music. Compare with
`../mm/final.mp4` ("One hire") and `../out/personaos-reel-vo.mp4`.

## The idea, and why
A typographic film with a character. The sentence is the picture, and Mo, who is round, plays the letter "o" in
whichever word is being said. Only this brand has a round mascot and a name ending in "os": cover the logo and it is
still Mo, while a competitor swapped in breaks the film. The earlier two versions are built from cards, panels and a
browser; this one has none.

## What each beat buys
| t (s) | VO | picture | the viewer… |
| --- | --- | --- | --- |
| 0-3.8 | "Stop wasting your money on overseas agencies." | "money" peels off letter by letter to the right until only its "o" is left | feels the money leave |
| 3.8-5.0 | "Meet Mo," | the o grows into Mo, a huge "M" slams in beside him | meets the replacement |
| 5.0-8.1 | "the AI growth agent for HVAC companies." | Mo hops in as the o of "growth" | learns what he is |
| 8.1-9.9 | "He writes your ads, runs them," | Mo rolls along a line and the ad copy appears behind him; three rows run on Google, Facebook, Instagram | watches an ad get written and run |
| 9.9-13.0 | "and fills your calendar with booked jobs." | a Mon-Fri grid of empty o's; Mo hops slot to slot, each landing fills lime; "16 jobs booked" | sees the result (hero moment) |
| 13.0-14.6 | "Works 24/7," | a ring of 24 o's lights up around him | believes 24/7 literally |
| 14.6-16.3 | "never asks for a raise," | "raise" rises; Mo sits on it and it sinks | gets the character |
| 16.3-19.0 | "never runs out of ideas." | idea pills stream out from behind him to both edges | sees abundance |
| 19.0-21.3 | "He's the best team member you'll ever find," | a row of seven o's; on "best" the others pale | sees he's the one |
| 21.3-23.5 | "the best hire you'll ever make." | "hire"; a lime disc (done) grows behind him | understands he's a hire |
| 23.5-25.7 | "Click the link below to get started today." | he hops below, then up into the o of "today." | knows what to do |
| 25.7-27.6 | — | the personaos wordmark crashes in as he lands, then recedes | knows the name |

## Real vs illustrative
- **Real:** the voiceover, Mo (the site's render, eyes redrawn in SVG), the sparkle mark and wordmark, the brand
  colours, and the Google/Facebook/Instagram marks.
- **Illustrative, invented:** the ad copy ("AC not keeping up? Same-day repair from local pros."), the booked slots and
  the "16 jobs booked" count, and the idea titles. No personaos prices or stats are claimed.

## Measured (scripts, not my judgement)
- **`look.py final.mp4 --expect 27.6 --expect-audio --events final.mp4.events.json`:**
  - **G0 PASS:** 27.60 s, audio present.
  - **G2 PASS:** no run of more than 3 flat frames.
  - **G3 PASS:** end hold 0.90 s; final shot 1.50 s, 5 % of the film.
  - **Audio:** −14.0 LUFS, LRA 3.7 LU, true peak −1.4 dBFS.
  - **Motion note:** mean luma change 1.3/255, below the human band (median 6.8). It is ink on one white ground (the
    user's choice), with large still areas around the words.
  - **Audio note:** the "dropouts" it flags (e.g. 7.18-8.36 s) are the intended pauses between lines; there is no
    music, at the user's request.
- **`lint.mjs` G5 PASS.** The first draft failed C7 (kicker above headline) twice: "the AI" above "growth" and "never
  runs out of" above "ideas.". Both small lines were deleted (the voiceover says them); not argued.
- **`Motion.selfTest`:** ok, 24 random jumps, 319 elements, 0 mismatches (the first draft failed at frame 0 because
  Mo's hidden pose depended on the previous frame; fixed).
- **Environment caveats:** no `ffprobe` and no `drawtext` in this ffmpeg; `look.py` ran with a small shim and without
  its timecode overlay. The gate maths is unchanged.
- **G1 and G4, by eye on the sheet:**
  - **G1:** the performed words are 230-560 px and the lines 64 px; the ad headline reads. The ad rows (about 30 px)
    and the day labels are texture, below 0.04 H.
  - **G4:** one performed word plus Mo per frame. The idea stream is a deliberate crowd behind one Mo.

## Frame by frame (sheet)
1. "Stop wasting your" arriving word by word.
2. The lone "o" left of "money", over "on overseas agencies."
3. "Mo": a huge M with Mo as the o.
4. Mo dropping into "growth".
5. "growth" with Mo smiling inside it, "agent for HVAC companies."
6. The ad copy behind Mo, the three platform rows running.
7. Mo mid-hop on the grid, 11 jobs booked.
8. The grid nearly full, 16 jobs booked.
9. The lime ring of 24 around Mo, "24/7,".
10. Mo sitting on "raise".
11. "ideas." with pills streaming out behind Mo.
12. The row of seven o's with Mo in the middle.
13. The team rolling away, "The" arriving above.
14. "hire" with Mo in the lime disc.
15. "t  day." with Mo rising into the gap (motion-blurred).
16. The wordmark.

None reads as a slide; frames 3 and 14 come closest to a centred lockup.

## Departures and risks, on purpose
- The voiceover says "Meet Mo" (a slogan pattern the skill avoids); it is the user's voiceover, kept as is.
- One flat paper-white ground and no music, as the user asked.

## What I would still improve
- The motion level is low; a slow paper drift or more camera on the holds would lift it.
- The pause after "growth" (6.9-8.1 s) is a near-still hold.
- The ad rows are small for G1.
