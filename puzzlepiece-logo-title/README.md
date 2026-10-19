# PuzzlePiece logo title — "Registration"

- `puzzlepiece-logo-title-9x16.mp4` — 1080×1920
- `puzzlepiece-logo-title-16x9.mp4` — 1920×1080

Both: 5 s, 60 fps, shutter blur (180°, 8 sub-frames), light grain, no audio. Made with the motionmaxxing method.

The PuzzlePiece mark is five overlapping translucent colour bands. The film splits the real logo into those
bands, floats them just off-register above warm picture-book paper, lets them drift down into register and
print, then prints the wordmark beside them with its ink ghosts converging. See `registration/STORYBOARD.md`
(idea, world, beats) and `registration/NOTE.md` (what is real, gate numbers, what to improve).

Re-render (needs the motionmaxxing toolbox's `scripts/render.mjs`, Chrome and ffmpeg):

    node render.mjs "file://$PWD/registration/index.html?w=1080&h=1920" title_9x16.mp4 --width 1080 --height 1920 --fps 60 --shutter 180 --subframes 8 --grain 0.03
    node render.mjs "file://$PWD/registration/index.html?w=1920&h=1080" title_16x9.mp4 --width 1920 --height 1080 --fps 60 --shutter 180 --subframes 8 --grain 0.03
