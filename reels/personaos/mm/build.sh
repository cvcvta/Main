#!/usr/bin/env bash
# Builds "One hire": mm/final.mp4 (1080x1920, 30 fps, 180-degree shutter blur, light grain) with the paced voiceover and cues.
#   needs ffmpeg and Chrome/Chromium (CHROME_PATH, or a standard install); in a root sandbox point CHROME_PATH at a
#   wrapper that adds --no-sandbox.   DRAFT=1 ./build.sh   half size, no shutter blur
set -euo pipefail
cd "$(dirname "$0")"
DUR=32.3
mkdir -p out
node tools/render.mjs index.html --still 0.5 out/stills >/dev/null          # also writes out/stills/events.json (the cue list)
python3 audio.py out/stills/events.json "$DUR"
I=$(ffmpeg -hide_banner -nostats -i out/audio.wav -af ebur128 -f null - 2>&1 | awk '/Integrated loudness:/{f=1} f&&/ I:/{print $2; exit}')
GAIN=$(python3 -c "print(round(-13.6 - ($I), 2))")
ffmpeg -y -hide_banner -loglevel error -i out/audio.wav \
  -af "volume=${GAIN}dB,alimiter=limit=0.83:level=false:attack=2:release=80:asc=1" -c:a pcm_s24le out/master.wav
if [ "${DRAFT:-0}" = 1 ]; then
  node tools/render.mjs index.html out/draft.mp4 --scale 0.5 --audio out/master.wav
else
  node tools/render.mjs index.html final.mp4 --audio out/master.wav --shutter 180 --subframes 8 --grain 0.025 --grain-seed 7
fi
