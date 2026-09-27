#!/usr/bin/env bash
# Builds out/personaos-reel.mp4 (1080x1920, 30 fps, H.264 + AAC, 34 s) and out/cover.jpg.
#   SUB=1 ./build.sh     quick build without motion blur
set -euo pipefail
cd "$(dirname "$0")"
FPS=${FPS:-30}
SUB=${SUB:-8}            # motion-blur samples averaged into each frame
WORKERS=${WORKERS:-3}

node render.mjs --fps "$FPS" --sub "$SUB" --workers "$WORKERS"
node render.mjs --stills 6.9 >/dev/null
python3 music.py

# Master: measure loudness, then gain + true-peak limiter to land near -14 LUFS (the Reels/TikTok playback level).
I=$(ffmpeg -hide_banner -nostats -i out/audio.wav -af ebur128 -f null - 2>&1 | awk '/Integrated loudness:/{f=1} f&&/ I:/{print $2; exit}')
GAIN=$(python3 -c "print(round(-13.6 - ($I), 2))")
ffmpeg -y -hide_banner -loglevel error -i out/audio.wav \
  -af "volume=${GAIN}dB,alimiter=limit=0.83:level=false:attack=2:release=80:asc=1" -c:a pcm_s24le out/audio_master.wav

if [ "$SUB" -gt 1 ]; then
  W=$(printf '1 %.0s' $(seq "$SUB"))
  VF="tmix=frames=$SUB:weights='${W% }',select='eq(mod(n\,$SUB)\,$((SUB - 1)))',setpts=N/($FPS*TB),"
else
  VF=""
fi
ffmpeg -y -hide_banner -loglevel error -stats \
  -framerate $((FPS * SUB)) -i out/frames/%06d.jpg -i out/audio_master.wav \
  -filter_complex "[0:v]${VF}scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[v]" \
  -map "[v]" -map 1:a -r "$FPS" \
  -c:v libx264 -preset slow -crf 20 -maxrate 10M -bufsize 20M -profile:v high -level 4.2 -g 60 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest out/personaos-reel.mp4
ffmpeg -y -hide_banner -loglevel error -i out/stills/t006.90.png -q:v 2 out/cover.jpg
ffmpeg -hide_banner -nostats -i out/personaos-reel.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | sed 's/^ */loudness /'
echo "done: out/personaos-reel.mp4"
