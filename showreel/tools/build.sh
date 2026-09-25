#!/usr/bin/env bash
# Whole pipeline: footage -> frames + tracking -> cue sheet -> soundtrack -> picture -> mux.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p build/frames build/track build/models out

for f in footage/clip_*.mp4; do
  id=$(basename "$f" .mp4); id=${id#clip_}
  mkdir -p "build/frames/$id"
  if [ -z "$(ls -A "build/frames/$id")" ]; then
    ffmpeg -hide_banner -loglevel error -i "$f" -q:v 3 -start_number 0 "build/frames/$id/%05d.jpg"
  fi
done

MP=https://storage.googleapis.com/mediapipe-models
[ -f build/models/face_landmarker.task ] || curl -sSfL -o build/models/face_landmarker.task "$MP/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"
[ -f build/models/hand_landmarker.task ] || curl -sSfL -o build/models/hand_landmarker.task "$MP/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
MESH=$(node --input-type=module -e "import * as C from './src/config.js'; console.log(C.SUBJECTS.map((s) => '--mesh=' + s.clip + ':' + Math.max(0, s.t - 0.1).toFixed(2) + ':' + (s.t + 2.2).toFixed(2)).join(' '))")
IDS=$(node --input-type=module -e "import * as C from './src/config.js'; console.log(Object.keys(C.CLIPS).join(' '))")
# shellcheck disable=SC2086
python3 tools/track.py $MESH $IDS

node tools/cues.mjs > build/cues.json
python3 tools/soundtrack.py
node tools/render.mjs "$@"
ffmpeg -hide_banner -loglevel error -y -i out/cvcvta-showreel-video.mp4 -i build/soundtrack.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -movflags +faststart out/cvcvta-showreel.mp4
rm -f out/cvcvta-showreel-video.mp4
echo "done: out/cvcvta-showreel.mp4"
