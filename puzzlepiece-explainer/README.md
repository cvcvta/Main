# PuzzlePiece script ad (9:16)

`puzzlepiece-script-ad-9x16.mp4` — 1080×1920, 30 fps, 32 s, no audio.
Timed to a natural read of the script so a voiceover can be laid on top.

| Time | Script line (voiceover, not on screen) | On screen |
|---|---|---|
| 0–4.6 | My son is autistic, and leaving the park can mean a meltdown. | Park: "Time to go!" → kid melts down, storm cloud |
| 4.6–7.2 | Daily transitions have always been tough. | Park / school / bath / bedtime cards get tangled |
| 7.2–9.4 | That's why we use Puzzle Piece. | Logo assembles from puzzle pieces |
| 9.4–14.4 | It lets you create personalized stories… prepare for what's next. | Story on tablet flips First → Then → Next |
| 14.4–17.2 | You just put them right into the story, | Photo scanned into their character |
| 17.2–19.6 | pick their favorite art style, | Website's LEGO / Minecraft / Pixar / Simpsons-inspired styles, 10+ styles |
| 19.6–25.4 | and practice tricky moments… before they even happen. | Practice stories: leaving the park, getting ready for school |
| 25.4–28.6 | It finally gives us a way to prepare together. | Parent and child reading together on the couch |
| 28.6–32 | Sign up today and get your free Puzzle Piece tablet. | Tablet + "Get my free tablet" CTA |

All illustration is original vector art (`art.js`). The four art-style images in
`assets/` are the style examples shown on puzzlepiecefamily.com.

    FFMPEG=$(which ffmpeg) node render.js          # full video -> out.mp4
    FFMPEG=x node render.js 2.4,18.9               # stills at given seconds
