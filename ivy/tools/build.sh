#!/usr/bin/env bash
# Whole pipeline: cue sheet -> soundtrack -> picture (motion-blurred) -> mux -> stills.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p build out

node tools/cues.mjs > build/cues.json
python3 tools/soundtrack.py
node tools/render.mjs "$@"
ffmpeg -hide_banner -loglevel error -y -i out/ivy-spot-video.mp4 -i build/soundtrack.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -movflags +faststart out/ivy-spot.mp4
# a light copy for sharing and previews
ffmpeg -hide_banner -loglevel error -y -i out/ivy-spot.mp4 -c:v libx264 -preset slow -crf 23 -maxrate 7M -bufsize 14M \
  -x264-params aq-mode=3 -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 192k -movflags +faststart out/ivy-spot-web.mp4
rm -f out/ivy-spot-video.mp4

# poster (the approval) and the end card, pulled from the finished file
ffmpeg -hide_banner -loglevel error -y -ss 20.47 -i out/ivy-spot.mp4 -frames:v 1 -q:v 2 out/poster.jpg
ffmpeg -hide_banner -loglevel error -y -ss 29.9 -i out/ivy-spot.mp4 -frames:v 1 -q:v 2 out/endcard.jpg
echo "done: out/ivy-spot.mp4"
