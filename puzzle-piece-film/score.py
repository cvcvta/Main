"""Procedural score + SFX for the Puzzle Piece film, cut to the picture's event frames (30 fps).
Deterministic (seeded). Writes audio/score_raw.wav (48 kHz stereo); loudness is mastered by ffmpeg afterwards."""
import numpy as np, wave, os, sys

SR = 48000
DUR = 30.0
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(11)
F = lambda f: f / 30.0                      # film frame -> seconds

def midi(n): return 440.0 * 2 ** ((n - 69) / 12)
NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def nm(s):                                   # 'C4', 'Bb2', 'F#3'
    k = NOTE[s[0]]; i = 1
    if s[i] in '#b': k += 1 if s[i] == '#' else -1; i += 1
    return 12 * (int(s[i:]) + 1) + k

def add(sig, t, gain=1.0, pan=0.0):
    i0 = int(t * SR)
    if i0 >= N: return
    sig = sig[: N - i0]
    gl = gain * np.cos((pan + 1) * np.pi / 4); gr = gain * np.sin((pan + 1) * np.pi / 4)
    if sig.ndim == 2:
        L[i0:i0 + len(sig)] += sig[:, 0] * gl * 1.414; R[i0:i0 + len(sig)] += sig[:, 1] * gr * 1.414
    else:
        L[i0:i0 + len(sig)] += sig * gl * 1.414; R[i0:i0 + len(sig)] += sig * gr * 1.414

def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
    return y

def fft_filter(x, lo, hi, slope=1.0):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    if lo: g *= 1 / (1 + (lo / np.maximum(f, 1)) ** (2 * slope))
    if hi: g *= 1 / (1 + (f / hi) ** (2 * slope))
    return np.fft.irfft(X * g, len(x))

# ---------------- instruments ----------------
def piano(note, dur, vel=0.5, bright=1.0):
    f0 = midi(nm(note) if isinstance(note, str) else note)
    n = int(SR * (dur + 1.8)); t = np.arange(n) / SR
    out = np.zeros(n)
    for h in range(1, 9):
        fh = f0 * h * np.sqrt(1 + 0.0004 * h * h)
        if fh > 9000: break
        amp = (1 / h ** 1.25) * (bright ** (h - 1)) * (0.6 if h == 1 else 1)
        dec = 1.2 + 3.2 * (h - 1) ** 0.8 + f0 / 900
        out += amp * np.sin(2 * np.pi * fh * t + h) * np.exp(-dec * t * (0.55 + 0.45 * vel))
    rel = np.clip((dur + 0.25 - t) / 0.25, 0, 1) ** 2      # damper
    att = np.clip(t / 0.004, 0, 1)
    ham = fft_filter(rng.standard_normal(n) * np.exp(-t / 0.012), 300, 2500) * 0.05
    return (out * att * (0.25 + 0.75 * rel) + ham) * vel * 0.35

def bell(note, vel=0.4):
    f0 = midi(nm(note)); n = int(SR * 2.6); t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f0 * t) * np.exp(-2.0 * t) + 0.35 * np.sin(2 * np.pi * f0 * 2.76 * t) * np.exp(-5 * t)
         + 0.18 * np.sin(2 * np.pi * f0 * 5.4 * t) * np.exp(-9 * t) + 0.25 * np.sin(2 * np.pi * f0 * 4.0 * t) * np.exp(-3.5 * t))
    return s * np.clip(t / 0.002, 0, 1) * vel * 0.3

def pad(notes, dur, vel=0.3, att=0.6, rel=1.0, cutoff=1800):
    n = int(SR * (dur + rel)); t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for k, nt in enumerate(notes):
        f0 = midi(nm(nt))
        for d, side in ((-0.09, 0), (0.0, None), (0.08, 1)):
            f = f0 * 2 ** (d / 12)
            w = sum(np.sin(2 * np.pi * f * h * t + k + h) / h ** 1.6 for h in range(1, 6))
            if side is None: out[:, 0] += w * .5; out[:, 1] += w * .5
            else: out[:, side] += w
    env = np.clip(t / att, 0, 1) * np.clip((dur + rel - t) / rel, 0, 1)
    out = np.stack([onepole_lp(out[:, 0], cutoff), onepole_lp(out[:, 1], cutoff)], 1)
    return out * env[:, None] * vel * 0.06

def sub(t0, f=52, vel=0.6, dur=0.5):
    n = int(SR * dur); t = np.arange(n) / SR
    ff = f * (1 + 0.6 * np.exp(-t / 0.03))
    s = np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-t / (dur * .35)) * np.clip(t / 0.003, 0, 1)
    add(s * vel, t0)

def tick(t0, vel=0.3, f=2600, pan=0.0):
    n = int(SR * 0.08); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.006) + fft_filter(rng.standard_normal(n), 1500, 8000) * np.exp(-t / 0.004) * .6
    add(s * vel, t0, pan=pan)

def click(t0, vel=0.4, pan=0.0):            # UI press: a soft plastic tock
    n = int(SR * 0.12); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 900 * t * (1 - .3 * t)) * np.exp(-t / 0.018) + fft_filter(rng.standard_normal(n), 800, 5000) * np.exp(-t / 0.003) * .5
    add(s * vel, t0, pan=pan)

def lock(t0, vel=0.5, pan=0.0):             # puzzle piece seats: wood-ish knock + small click
    n = int(SR * 0.3); t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.05) * .9 + np.sin(2 * np.pi * 410 * t) * np.exp(-t / 0.025) * .5
         + fft_filter(rng.standard_normal(n), 1200, 7000) * np.exp(-t / 0.005) * .7)
    add(s * vel, t0, pan=pan)

def noise_sweep(t0, dur, f0, f1, vel=0.3, pan=0.0, shape='rise'):
    n = int(SR * dur); t = np.arange(n) / SR; x = rng.standard_normal(n)
    out = np.zeros(n); blk = 2048
    for i in range(0, n, blk):
        p = (i + blk / 2) / n; fc = f0 * (f1 / f0) ** p
        seg = x[max(0, i - 256): i + blk + 256]
        y = fft_filter(seg, fc * .5, fc * 1.6)
        a = i - max(0, i - 256); out[i:i + blk] = y[a:a + min(blk, n - i)]
    env = (t / dur) ** 2 if shape == 'rise' else np.sin(np.pi * t / dur) ** 1.5 if shape == 'swell' else np.exp(-t / (dur * .3))
    add(out * env * vel, t0, pan=pan)

def flip(t0, vel=0.35, pan=0.0, dur=0.32):  # paper page turn
    n = int(SR * dur); t = np.arange(n) / SR
    x = fft_filter(rng.standard_normal(n), 900, 6500)
    flutter = 0.6 + 0.4 * np.sin(2 * np.pi * 38 * t) ** 2
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.2
    add(x * env * flutter * vel, t0, pan=pan)

def pencil(t0, dur, vel=0.08, pan=0.0):
    n = int(SR * dur); t = np.arange(n) / SR
    x = fft_filter(rng.standard_normal(n), 2500, 9000)
    grit = (rng.random(n) < 0.02) * rng.standard_normal(n) * 3
    am = 0.5 + 0.5 * np.sin(2 * np.pi * 7 * t + rng.random() * 6) ** 2
    env = np.clip(t / 0.03, 0, 1) * np.clip((dur - t) / 0.06, 0, 1)
    add((x + fft_filter(grit, 2000, 9000)) * am * env * vel, t0, pan=pan)

def type_ticks(t0, t1, seed=3):
    r = np.random.default_rng(seed); t = t0
    while t < t1:
        tick(t, vel=0.06 + 0.03 * r.random(), f=3200 + 800 * r.random(), pan=r.uniform(-.2, .2)); t += r.uniform(0.045, 0.11)

def arp(chords, t0, step, vel=0.22, octave_up=False, inst='piano', pattern=(0, 1, 2, 3, 2, 1)):
    """chords: list of (start_s, end_s, [notes])"""
    for (a, b, notes) in chords:
        t = a; k = 0
        while t < b - 0.02:
            nt = notes[pattern[k % len(pattern)] % len(notes)]
            if inst == 'bell': add(bell(nt, vel), t, pan=(-.25 if k % 2 else .25))
            else: add(piano(nt, step * 1.5, vel * (0.85 + 0.15 * ((k + 1) % 2))), t, pan=(-.2 if k % 2 else .2))
            t += step; k += 1

# ================= SCORE (times from the film's frames) =================
# ---- 1 hook 0-84f: felt piano, A minor, a pencil drawing the gate; "meltdown" (f64) darkens; dive whoosh into the cut (f84)
add(piano('A2', 2.6, .55), 0.02)
for t, nt, v in [(0.05, 'E4', .32), (0.5, 'B4', .26), (0.95, 'C5', .28), (1.4, 'E5', .22), (1.85, 'B4', .22)]:
    add(piano(nt, .9, v), t, pan=.15)
add(piano('F2', 1.2, .4), 1.82)
pencil(0.0, 1.35, .04, -.2)
add(pad(['A3', 'E4', 'C5'], 2.4, .5, att=.8, rel=.4), 0.0)
sub(F(64), 46, .45, 1.0)                                    # the word lands heavy
add(piano('Bb1', 1.0, .35, bright=.6), F(64)); add(piano('B1', 1.0, .3, bright=.6), F(65))
noise_sweep(F(70), F(84) - F(70), 300, 5000, .35, shape='rise')

# ---- 2 countdown 84-164f: a tick and a heartbeat per warning; it tightens; silence before the turn
for i, f in enumerate([84, 100, 112, 122, 131]):
    tick(F(f), .38, 2200, pan=0); tick(F(f) + .012, .18, 3400)
    sub(F(f), 50, .55 + i * .05, .45)
add(pad(['A3', 'E4'], F(150) - F(84), .45, att=.3, rel=.3, cutoff=1100), F(84))
add(piano('A1', 1.8, .45, bright=.5), F(148))                # "when."
noise_sweep(F(150), F(164) - F(150), 4000, 600, .10, shape='decay')

# ---- 3 pieces 164-260f: hope: music box over C - G/B - Am - F; each piece seats with a knock; pencils draw
arp([(F(164), F(196), ['C5', 'E5', 'G5', 'C6']), (F(196), F(216), ['B4', 'D5', 'G5', 'B5']), (F(216), F(236), ['A4', 'C5', 'E5', 'A5']), (F(236), F(262), ['F4', 'A4', 'C5', 'F5'])],
    0, 0.2, vel=.42, inst='bell')
add(pad(['C3', 'G3', 'E4'], F(260) - F(166), .55, att=.9, rel=.5), F(166))
for i, f in enumerate([180, 200, 220]):
    lock(F(f + 2), .55, pan=-.5 + i * .5)
    pencil(F(f), .7, .03, -.5 + i * .5)
add(piano('C3', 1.2, .35), F(180)); add(piano('B2', 1.2, .32), F(200)); add(piano('A2', 1.2, .32), F(220))

# ---- 4 the mark lands in the slot (f262): the first hit; whoosh as the strip leaves (f272)
noise_sweep(F(248), F(262) - F(248), 800, 6000, .12, shape='rise')
sub(F(262), 44, .8, 1.2)
for nt, v in [('C2', .6), ('C3', .5), ('G3', .45), ('E4', .45), ('C5', .4), ('D5', .3)]: add(piano(nt, 2.4, v), F(262))
add(bell('C6', .55), F(262), pan=.2); add(bell('G6', .35), F(263), pan=-.2)
noise_sweep(F(272), .5, 2500, 500, .16, pan=-.4, shape='swell')

# ---- 5..12 the product act: a warm piano bed, 92 bpm, chords move on the cuts
beat = 60 / 92
prog = [  # (start frame, end frame, arp notes, pad notes, bass)
    (306, 386, ['C4', 'E4', 'G4', 'C5'], ['C3', 'G3', 'E4'], 'C2'),
    (386, 476, ['A3', 'C4', 'E4', 'A4'], ['A2', 'E3', 'C4'], 'A1'),
    (476, 536, ['F3', 'A3', 'C4', 'F4'], ['F2', 'C3', 'A3'], 'F1'),
    (536, 614, ['G3', 'B3', 'D4', 'G4'], ['G2', 'D3', 'B3'], 'G1'),
    (614, 668, ['E3', 'G3', 'C4', 'E4'], ['C3', 'G3', 'E4'], 'E2'),
    (668, 724, ['F3', 'A3', 'C4', 'E4'], ['F2', 'C3', 'A3'], 'F1'),
    (724, 776, ['D4', 'F4', 'A4', 'C5'], ['D3', 'A3', 'F4', 'C5'], 'D2'),
    (776, 838, ['G3', 'B3', 'D4', 'F4'], ['G2', 'D3', 'B3', 'F4'], 'G1'),
]
for (a, b, an, pn, bs) in prog:
    sparse = a == 668                                        # the reading beat thins out
    arp([(F(a), F(b), an)], 0, beat / 2 if not sparse else beat, vel=.26 if not sparse else .3)
    add(pad(pn, F(b) - F(a), .75 if a != 724 else 1.1, att=.25 if a != 724 else 1.2, rel=.35), F(a))
    add(piano(bs, F(b) - F(a), .38), F(a))
# a gentle pulse under the sign-up beat
for k in range(int((F(838) - F(776)) / beat)): sub(F(776) + k * beat, 60, .14, .25)

# UI and picture SFX
noise_sweep(F(306), .35, 600, 2500, .10, shape='decay')       # story card slides up
type_ticks(F(400), F(440))
click(F(444), .5)
add(bell('E6', .18), F(452), pan=.3)                         # the guide replies
noise_sweep(F(462), F(478) - F(462), 1200, 4500, .14, shape='swell')   # scroll
flip(F(476), .22, -.3, .18)                                  # photo drops
add(bell('G5', .3), F(488), pan=.25); add(bell('D6', .22), F(490), pan=.35)    # storybook David appears
noise_sweep(F(516), .45, 900, 3000, .1, shape='swell')
for f in (542, 552, 562): noise_sweep(F(f), F(9), 1500, 6000, .12, pan=-.3 + (f - 542) / 40, shape='swell')
for i, f in enumerate((578, 580, 582)): tick(F(f), .08, 1800, pan=-.4 + i * .3)
click(F(602), .45, pan=.2); add(bell('C6', .2), F(603), pan=.2)
for i in range(4): tick(F(614 + i * 3), .1, 1500 + i * 200, pan=-.1 + i * .06)
flip(F(680), .15, .3); flip(F(694), .15, .3); flip(F(708), .13, .25, .7)   # the last turn is slow
for k, f in enumerate(range(788, 806, 2)): tick(F(f), .05 + .006 * k, 2600 + 90 * k)
add(bell('G5', .25), F(806), pan=.1)                         # 10 of 10 ready
click(F(838), .55)

# ---- 13: dip before the biggest move, then the circles close into the mark (complete at f866)
noise_sweep(F(846), F(866) - F(846), 700, 7000, .14, shape='rise')
sub(F(866), 42, .75, 1.6)
for nt, v in [('C2', .6), ('C3', .55), ('G3', .5), ('E4', .5), ('G4', .42), ('D5', .38), ('E5', .3)]: add(piano(nt, 1.6, v), F(866))
add(bell('C6', .5), F(866), pan=-.15); add(bell('E6', .32), F(869), pan=.15); add(bell('G6', .25), F(873), pan=.3)
add(pad(['C3', 'G3', 'E4', 'D5'], F(900) - F(866), .6, att=.2, rel=.2), F(866))

# ---------------- reverb (synthetic room/plate), then gentle bus compression ----------------
def reverb(x, secs=2.2, wet=.22, seed=5):
    r = np.random.default_rng(seed); n = int(SR * secs); t = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-t / (secs / 6.5)); ir = fft_filter(ir, 200, 6000); ir[:int(.012 * SR)] = 0
    ir /= np.sqrt((ir ** 2).sum())
    m = len(x) + n; size = 1 << int(np.ceil(np.log2(m)))
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[:len(x)]
    return x * (1 - wet) + y * wet * 1.6
L2 = reverb(L, seed=5); R2 = reverb(R, seed=6)
mix = np.stack([L2, R2], 1)
peak = np.abs(mix).max(); mix = mix / peak * 0.8
mix = np.tanh(mix * 1.3) / np.tanh(1.3)                        # soft saturation as a gentle limiter
os.makedirs('audio', exist_ok=True)
with wave.open('audio/score_raw.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
print('wrote audio/score_raw.wav', mix.shape)
