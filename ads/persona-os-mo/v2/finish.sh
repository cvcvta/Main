#!/usr/bin/env bash
# finish.sh <samples_dir> <out_dir> : audio mix, shutter-blur encode, gate checks
set -euo pipefail
SM="$1"; OUT="$2"; HERE="$(cd "$(dirname "$0")" && pwd)"; B="$HERE/../build"
mkdir -p "$OUT"
python3 "$B/timeline.py" "$B/vo_take_a.mp3" "$OUT/vo" > /dev/null
python3 "$B/audio.py" "$HERE/timeline.json" "$SM/scenes.json" "$OUT/vo/vo_tight.wav" "$OUT/mix.wav" "$SM/events.json"
# 4 samples/frame averaged = shutter blur; then keep one frame per 4 samples
ffmpeg -y -v error -framerate 120 -i "$SM/s%06d.jpg" -i "$OUT/mix.wav" \
  -vf "tmix=frames=4:weights='1 1 1 1',select='not(mod(n+1\,4))',setpts=N/30/TB" -r 30 \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 192k -shortest "$OUT/final.mp4"
echo "== G0 render";   ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,nb_frames -of compact "$OUT/final.mp4"
echo "== G0 audio";    ffmpeg -hide_banner -i "$OUT/final.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tr -s ' '
echo "== G0 black";    ffmpeg -hide_banner -i "$OUT/final.mp4" -vf blackdetect=d=0.1:pix_th=0.08 -an -f null - 2>&1 | grep -c black_start || true
echo "== G2/G3 freezes (>=0.1s, any frozen run)"; ffmpeg -hide_banner -i "$OUT/final.mp4" -vf freezedetect=n=0.0015:d=0.1 -an -f null - 2>&1 | grep -oE "freeze_(start|duration|end): [0-9.]+" | paste - - - || true
echo "== cuts";        ffmpeg -hide_banner -i "$OUT/final.mp4" -vf "select='gt(scene,0.3)',showinfo" -an -f null - 2>&1 | grep -oE "pts_time:[0-9.]+" | tr '\n' ' '; echo
ffmpeg -v error -y -i "$OUT/final.mp4" -vf "fps=2,scale=180:-1,tile=12x6" -frames:v 1 "$OUT/sheet.jpg"
