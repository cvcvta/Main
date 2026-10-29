# Puzzle Piece explainer (9:16)

- `final_9x16.mp4`: 1080x1920, 30 fps, 76.4 s, with Linda's voiceover. The voiceover starts at 0.3 s and is normalized to about -16 LUFS.
- `index_9x16.html`: the editable source. Every on-screen word is placed from ElevenLabs Scribe word timings, about one frame before it's spoken.

## Scenes (VO seconds)
| Time | Scene | What happens |
|---|---|---|
| 0-4.2 | Fire drill | Kids walk out the door and Ryan stays: "Except mine." |
| 4.2-9.8 | Ryan | Ryan's portrait, then "Noise. Flashing. Everyone moving at once." with sound rings, strobe flashes and streaks |
| 9.8-14.3 | Emergency | "A fire drill isn't ~~practice~~. It's an emergency." with a ringing bell |
| 14.3-20.5 | Telling vs showing | Mom's speech bubbles, "Telling ≠ Showing" |
| 20.5-27.4 | Definition | **Social Stories**: "Short stories that walk a child through a moment before it happens." The credit line reads "Developed by Carol Gray, 1991". |
| 27.4-30.5 | Proof | Two research cards, highlighted and stamped (sources below) |
| 30.5-32.7 | Illustrator | "But I'm not an illustrator." A stick figure is drawn, then the paper is crumpled |
| 32.7-35.0 | Logo | The Puzzle Piece logo reveal |
| 35.0-39.7 | Family | Family photos, then into Ryan's story |
| 39.7-47.5 | Moment | Pick a moment (Asking for Help, then Being Wrong), then Story Buddy and "Doctor's visits for Ryan" |
| 47.5-51.9 | Choices | Who's in it, art style, a world he loves |
| 51.9-54.5 | Writes & illustrates | The book writes and paints itself, then pages turn |
| 54.5-57.0 | My voice | Read in my voice: waveform and the My voice chip |
| 57.0-63.4 | Reading | I read it first, we read it together, he reads it on his own, again and again |
| 63.4-68.3 | The words | "It gives him the words before he needs them." |
| 68.3-72.2 | Free account | The story unlocks before you pay anything |
| 72.2-76.4 | End card | Logo and "Try it free for 7 days" |

## Proof sources (verified by web search, Oct 2026)
- **National Clearinghouse on Autism Evidence & Practice** (NCAEP): Steinbrenner et al. (2020), *Evidence-Based Practices for Children, Youth, and Young Adults with Autism*. A systematic review of studies from 1990 to 2017 that lists Social Narratives among 28 evidence-based practices.
- **National Autism Center**: *National Standards Project, Phase 2* (2015). Rates story-based intervention as an "Established" intervention.
- **Carol Gray**: created Social Stories in 1991. The on-screen definition paraphrases the voiceover, not Gray's own wording.

The research cards are stylised citation cards, not reproductions of the reports. "Social Stories" is a trademark of Carol Gray.

## What is illustrative
- Mom's two speech bubbles ("There's a fire drill tomorrow." / "It will be loud.").
- The kid figures, the stick figure and the bell are drawn shapes.
- All other artwork is from the app captures.

## Checks
- **G0:** PASS. 76.40 s, audio present.
- **G2:** PASS.
- **G3:** PASS. End hold 0.77 s.
- **G5:** one C7 lead, the spoken line "It doesn't replace his therapist" sitting above the headline. I kept it because it's in the voiceover.
- **No music or sound effects.** Every cut and word is listed in `final_9x16.mp4.events.json` for placing them.

## Revision: blonde Ryan and the fire drill story
- Ryan now matches the character reference (blonde, camo hoodie) everywhere he appears: the opening kid figure, the portrait, the family row, Who's in it, and both story cards.
- The story is now "Ryan's Fire Drill Day". It uses the supplied hallway illustration in the family card, the book page, the "my voice" background, the reading hero and the free-account card.
- The book page text now reads: "When the alarm rings, I walk outside with my class." This line is illustrative.
- The page revealed by the second page-turn now shows the Cartoon style art in place of the train cover.
