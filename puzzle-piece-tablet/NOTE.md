# NOTE: Puzzle Piece tablet insert

## Deliverables
- `final.mp4`: 1920x1080, 30 fps, 60.0 s, H.264, silent. It shows iOS-style touch dots on every tap and drag.
- `final_notouch.mp4`: the same film without the touch dots. Use it if a real finger is in the plate.
- `index.html`: the editable source, where every frame is a pure function of time. `index_notouch.html` is an identical copy; its file name turns the dots off.
- `STORYBOARD.md`: the beat table with timecodes, so the actor's taps can be matched to the screen.

## The idea, and why
This is a recording of one person going through the whole guide in order. The phone screens are rebuilt as iPad landscape layouts at about 2x the phone sizes, so the UI still reads once the tablet is scaled down in the plate. The pacing is about 2.5 s per screen. The reader (7.3 s, with the narration highlight moving word by word) is the one long hold, because that is the moment the ad is selling.

## What is real and what is adapted
- **Real (cropped from the guide's own 1206x2622 stills):** story covers, family portraits, topic, style and theme illustrations, the Story Buddy, the preparation book, the creating-card puzzle, the reader illustration, the story-focus banner, and the PuzzlePiece logo. All copy is verbatim from the screens, including the conversation and story-focus text.
- **Adapted:** the landscape layouts themselves (the guide only shows portrait phone screens). Other adaptations:
  - The iPad status bar shows only the time, wifi and 33%; the phone's recording dot is left out.
  - The iPad keyboard is rebuilt.
  - In the Account & settings and Your voice sheet, the section order follows the guide but the sheet is centred, iPad style.
- **Retouched:** the yellow create button was baked into the bottom-right of the Space cover. I covered it with a mirrored patch of the corridor floor. On the train and space covers and on the 3D Storybook and Real World cards, rebuilt "NEW" badges and selection checks sit exactly over the baked-in ones.
- **Illustrative interactions:**
  - Tapping + on Dad in the Cast step is an available control; the guide does not show it being tapped.
  - The keyboard suggestion words ("Magic", "sport", "sporty", and so on) are added. Only "world / worlds / worldwide" are in the capture.
  - Evan's row on the Cast list is inferred from the Home family row.
  - The guide's next Story-guide message is cut off, so it is shown as typing dots instead of invented text.
- **Not shown as finished**, matching the guide's own disclaimer: story generation completing, audio playback, and a voice being recorded or cloned.

## Gates (numbers from `look.py` and `lint.mjs` on final.mp4)
- **G0 render exists:** PASS. 60.00 s matches the expected 60.00 s, 1800 frames, no audio (none planned).
- **G2 no empty frame:** PASS. No run of more than 3 flat frames.
- **G3 end card:** PASS. End hold 1.23 s; the final shot is 1.87 s, 3% of the film.
- **G1 proof readable (by eye):** body text is 24-31 px (0.022-0.029 H) and headlines are 52-80 px. That is below the 0.04 H rule for small UI copy, which I chose deliberately so the screen looks like a real tablet UI and not inflated type. The tablet will be smaller than full frame in the plate anyway, so the 34-80 px titles and buttons carry the reading.
- **G4 one hero per frame (by eye):** PASS. Each screen has one action target, and the two-column layouts have a clear primary column.
- **G5 no page chrome:** FAIL as computed, on three leads:
  - C1/C6: the iPad status bar (clock "3:32" to "3:35" and "33%").
  - V1: the app's real Story-guide line "Hey there! What little moment would you like this story to help with?", which is verbatim from the guide.
  - V3 (warn): the "Story" stage radio dot, also real UI.

  These are device and app UI that a screen recording must contain, not film chrome, so I left them in. If you want the status bar gone (some editors prefer a clean screen for a tablet comp), say so; it's a one-line change.
- **Motion:** mean frame-to-frame luma change is 3.1/255, below the human band for promo films (IQR 4.4-9.8). That fits the brief (a screen recording that doesn't feel like it's speeding by). Every hold still has something moving: the progress shimmer, the puzzle rock, the buddy sway, the narration highlight, the typing.

## Frame descriptions (look/sheet.jpg, 20 frames)
1-2. Home: two story covers and the family row, then the touch on Add family. 3. The topic grid with the Social filter on. 4. Mid-push into the Style step. 5. The Theme step with Real World selected. 6. Preparation: the book illustration and progress. 7. Story details with Listen selected. 8-9. Reader: Ryan jumping beside the conductor, with "so" and then "train" highlighted. 10. Story Buddy with Tap to tell me. 11. Conversation with the guide bubble. 12. The story-focus summary cascading in. 13. Mid-push into the custom-world editor. 14. "Magical sports" typed, with the keyboard up. 15. Parent space, with the touch on Account & settings. 16. The sheet scrolled to Story reading voice, with the touch on Manage my voice.

## What I would still improve
- Sound: the film is silent (no ElevenLabs key in this session). Soft tap clicks and keyboard ticks would sell the recording, and every press and type event is listed in `final.mp4.events.json`.
- The Cast list's third row (Evan) and the keyboard suggestions are inferred. Swap them if the real app differs.
- If the plate's tablet is 4:3 rather than 16:9, the layouts would need re-flowing rather than cropping.

---

## 9:16 version (added after the 16:9 version)
- `final_9x16.mp4` / `final_9x16_notouch.mp4`: 1080x1920, 30 fps, 60.0 s, silent, with and without touch dots. Source: `index_9x16.html` (`index_9x16_notouch.html` is an identical copy whose file name turns the dots off).
- It is the same journey with the same timing as the 16:9 film, beat for beat, so `STORYBOARD.md` applies. The only change is that Home now scrolls down to the train story before tapping it (about 22.1-23.2 s).
- The layouts follow the original portrait phone screens closely, at about 2.5x the phone sizes. The reader uses the art full-width at the top with the narration text and controls below, the way the phone reader does. The Account & settings sheet rises from the bottom, phone style.
- "Delete story" on the story details screen is cut by the bottom edge (it sat below "You can pause anytime.").
- **G0:** PASS. 60.00 s.
- **G2:** PASS.
- **G3:** PASS. End hold 1.17 s; the final shot is 3% of the film.
- **G5:** FAIL on the same leads as the 16:9 version (the status bar and the app's real "Hey there!" line), kept for the same reason.
- **Motion:** mean luma change 3.4/255.
