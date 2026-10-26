# Puzzle Piece: tablet screen-recording insert

**Format:** 1920x1080, 30 fps, 60.0 s, silent. Built to be corner-pinned into the green screen of a tablet in landscape.
**Source:** *Puzzle Piece Family App Feature Guide* (19 pages). All 18 screens are covered, in the guide's order.

## PAGE
- **Problem:** the ad needs footage of the app in use on a tablet, but the only captures are portrait phone stills.
- **Audience:** parents watching the ad. The tablet takes up part of the frame, so the UI has to read at small size.
- **Goal:** a believable recording of one person going through the whole journey: discover, prepare and read, make your own story, Parent Space.
- **Emotion:** calm and unhurried. Nothing should feel sped up.

## The idea
This is a UI documentary of one session, not a promo film. The app is rebuilt as an iPad landscape layout: each phone screen is laid out across two columns at about 2x the phone sizes, so the text survives being scaled down into the plate. The artwork and copy come from the guide. The only motion is what a real recording would contain: native push and pop transitions, a modal sheet, a full-screen reader, scrolling, typing on the keyboard, and the touch dots from the iOS "show touches" setting. There is no camera move, no caption and no overlay, because the tablet bezel in the plate is the frame.

## System
- **Ground:** the app's own cream (#fefcf7) and the Home beige (#f7f6e9). The dark green is #21433c and the accent is yellow (#e8d37a / #eec86b).
- **Type:** Source Serif 4 for headlines (the closest match to the app's serif), DM Serif Display for the Account & settings sheet, and Inter for the UI.
- **Clock:** smooth 30 fps. Pushes take 18 frames on a `softLand` ease and the outgoing screen parallaxes 560 px left. Each touch dot lands in 3 frames, holds 6 and fades over 6, and the pressed button dips to 96.5% one frame after the touch.
- **Chapter joins:** each chapter starts with a hard cut, the way an editor would trim a long recording. The status-bar clock steps 3:32 → 3:33 → 3:34 → 3:35, matching the recording's timestamps.

## Beat table (frames at 30 fps)
| # | Time | Screen (guide page) | Action | Buys |
|---|---|---|---|---|
| 1 | 0.0-2.5 | Home (p2) | Hold, then tap **Add family** | The family library: real covers, real portraits |
| 2 | 2.5-5.2 | Add a family member (p3) | Read the form, tap back | Family members can be added to stories |
| 3 | 5.2-6.9 | Home | Tap the yellow wand | Creation starts from Home |
| 4 | 6.9-9.8 | What's the adventure? (p4) | Social filter on, tap **Asking for Help** | Topics are real, everyday moments |
| 5 | 9.8-12.8 | Cast (p5) | Tap + on **Dad** (it becomes a check), then Next | Familiar people join the story |
| 6 | 12.8-15.3 | Style (p6) | 3D Storybook selected, Next | Choice of art style |
| 7 | 15.3-18.1 | Theme (p7) | Real World selected, Next | The world is chosen separately |
| 8 | 18.1-20.9 | Preparation (p8) | Progress shimmer, stage dot pulse, **Back to Home** | The story is being made |
| 9 | 20.9-23.9 | Home with "Creating your story..." (p9) | Puzzle rocks, dots cycle, tap the train story | Making a story doesn't block you |
| 10 | 23.9-26.6 | Story details (p10) | Listen selected, **Start story** | Listen or read yourself |
| 11 | 26.6-33.9 | Reader (p11) **hero** | Page 1 narrated word by word with the highlight, then X | The payoff: Ryan inside his own illustrated story |
| 12 | 33.9-35.0 | What's the adventure? | Tap **Make your own story** | The second path |
| 13 | 35.0-37.6 | Story Buddy (p12) | The buddy sways, tap **Tap to tell me** | A friendly guide |
| 14 | 37.6-41.9 | Conversation (p13) | Question shown, guide bubble, "Doctor's visits for Ryan", typing dots | A parent's real worry becomes a story |
| 15 | 41.9-45.1 | Story focus (p14) | The summary cascades in, Next | The app understood |
| 16 | 45.1-46.6 | Theme | Tap **Start with your idea** | A custom world |
| 17 | 46.6-52.5 | Custom world (p15) | Keyboard rises, "Magical sports world" typed key by key | Anything they imagine |
| 18 | 52.5-53.9 | Home | Tap the gear | Parent Space |
| 19 | 53.9-55.5 | Parent space (p16) | Tap **Account & settings** | Parent controls |
| 20 | 55.5-57.6 | Account & settings sheet (p17) | Flick-scroll to Story reading voice | Male / Female / My voice |
| 21 | 57.6-60.0 | Your voice (p18-19) | Push in, hold 1.2 s | A parent's own voice option |
