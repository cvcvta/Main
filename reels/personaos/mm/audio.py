#!/usr/bin/env python3
"""Soundtrack for "One hire" (mm/index.html): the paced voiceover plus the film's own sound cues, no music.

Reuses ../music-vo.py (the pauses from ../assets/vo-edit.json, line leveling, the cue synths); only the length and
the cue list differ. The cues are the film's `sfx` events (label "kind:gain:param") from a render's events.json.

    python3 audio.py out/events.json 32.3      -> out/audio.wav (48 kHz stereo, unmastered)
"""
import importlib.util
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REEL = os.path.dirname(HERE)
sys.path.insert(0, REEL)
spec = importlib.util.spec_from_file_location('music_vo', os.path.join(REEL, 'music-vo.py'))
mv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mv)

events, dur = sys.argv[1], float(sys.argv[2])
out = os.path.join(HERE, 'out')
os.makedirs(out, exist_ok=True)
mv.DUR, mv.N = dur, int(mv.SR * dur)
mv.M.DUR, mv.M.N, mv.OUT = dur, mv.N, out          # music-vo.py's helpers read these module globals

cues = []
for e in json.load(open(events)):
    if e.get('type') != 'sfx':
        continue
    kind, g, p = (e['label'].split(':') + ['', ''])[:3]
    cues.append({'t': e['t'], 'type': kind, 'g': float(g or 1), 'p': float(p) if p else 0})
json.dump(cues, open(os.path.join(out, 'sfx-reel-vo.json'), 'w'))   # the file name music-vo.py's cue reader expects

audio = mv.build()
mv.M.write_wav(os.path.join(out, 'audio.wav'), audio)
print('wrote', os.path.join(out, 'audio.wav'), '%.1fs' % dur, len(cues), 'cues')
