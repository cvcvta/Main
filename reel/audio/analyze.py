"""Spectrogram + loudness envelope of a wav (for reviewing the mix without ears)."""
import sys, wave
import numpy as np
from scipy import signal
from PIL import Image, ImageDraw, ImageFont
w = wave.open(sys.argv[1]); sr = w.getframerate(); n = w.getnframes()
x = np.frombuffer(w.readframes(n), dtype=np.int16).reshape(-1, 2).astype(float) / 32768
m = x.mean(axis=1)
f, t, Z = signal.stft(m, sr, nperseg=2048, noverlap=2048 - 480)
S = 20 * np.log10(np.abs(Z) + 1e-7)
# log-frequency axis 30 Hz .. 16 kHz
H, Wd = 360, len(t)
fl = np.geomspace(30, 16000, H)
idx = np.searchsorted(f, fl)
img = S[idx[::-1], :]
img = np.clip((img + 90) / 80, 0, 1)
cm = np.stack([np.clip(img * 3 - 1.2, 0, 1), np.clip(img * 2.2 - 0.6, 0, 1) ** 1.2, np.clip(1 - np.abs(img * 2 - 0.9) * 1.6, 0, 1) * 0.6 + img * 0.3], -1)
im = Image.fromarray((cm * 255).astype(np.uint8)).resize((1500, H))
# loudness strip
hop = int(0.05 * sr)
rms = np.array([np.sqrt(np.mean(m[i:i + hop] ** 2)) for i in range(0, len(m) - hop, hop)])
db = 20 * np.log10(rms + 1e-6)
strip = Image.new('RGB', (1500, 140), (15, 15, 15))
d = ImageDraw.Draw(strip)
pts = [(i / len(db) * 1500, 140 - np.clip((v + 40) / 40, 0, 1) * 130) for i, v in enumerate(db)]
d.line(pts, fill=(255, 200, 0), width=2)
for lv in (-6, -12, -20, -30):
    y = 140 - (lv + 40) / 40 * 130
    d.line([(0, y), (1500, y)], fill=(70, 70, 70)); d.text((2, y - 11), f'{lv}dB', fill=(150, 150, 150))
out = Image.new('RGB', (1500, H + 140 + 20), (0, 0, 0))
out.paste(im, (0, 0)); out.paste(strip, (0, H + 20))
d = ImageDraw.Draw(out)
dur = n / sr
for s in range(0, int(dur) + 1):
    X = s / dur * 1500
    d.line([(X, H), (X, H + 20)], fill=(200, 200, 200)); d.text((X + 2, H + 3), f'{s}', fill=(200, 200, 200))
for b in (6, 14, 22, 30, 38, 44):   # drops
    X = b * 0.6 / dur * 1500
    d.line([(X, 0), (X, H)], fill=(0, 255, 255))
out.save(sys.argv[2])
print('crest dB', 20 * np.log10(np.max(np.abs(m)) / np.sqrt(np.mean(m ** 2))))
