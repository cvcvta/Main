"""Procedural score + SFX for the Puzzle Piece film, cut to the picture's event frames (30 fps).
Deterministic (seeded). Writes audio/score_raw.wav (48 kHz stereo); loudness is mastered by ffmpeg afterwards."""
import numpy as np, wave, os, sys

SR = 48000
DUR = float(__import__("os").environ.get("FILM_DUR", "30"))
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

# ================= SCORE v3 "Four circles": a quiet bed under the voice; SFX from the film's own 'sfx' marks
import json, subprocess
EV = json.load(open(os.environ.get('EVENTS', 'draft.mp4.events.json')))
SC = {'s1': 0, 's2': 236, 's3': 369, 's4': 521, 's5': 590, 's6': 866, 's7': 1017, 's8': 1123, 's9': 1215, 's10': 1336, 's11': 1464, 's12': 1614, 's13': 1760, 'end': 1880}
S = {k: v / 30.0 for k, v in SC.items()}

# ---- act 1: a light, playful pluck for the park; a low knot at the meltdown; a tight pulse at the countdown; a music-box walk on the path
for t, nt, v in [(0.25, 'G4', .26), (0.55, 'C5', .22), (0.8, 'E5', .22), (1.35, 'D5', .2), (1.6, 'G4', .2), (2.1, 'C5', .2), (2.45, 'A4', .18)]:
    add(piano(nt, .35, v, bright=1.1), t, pan=.2)
add(pad(['C3', 'G3', 'E4'], 3.9, .45, att=.8, rel=.3), 0.0)
add(pad(['A2', 'E3', 'C4'], S['s2'] - 4.6, .5, att=.6, rel=.5, cutoff=1100), 4.6)
add(pad(['A3', 'E4'], S['s3'] - S['s2'], .45, att=.3, rel=.3, cutoff=1000), S['s2'])
add(piano('A1', 2.2, .4, bright=.5), F(351))
add(pad(['C3', 'G3', 'E4'], S['s4'] - S['s3'], .55, att=1.0, rel=.5), S['s3'])
arp([(S['s3'] + .2, S['s4'], ['C5', 'E5', 'G5', 'C6'])], 0, 0.36, vel=.2, inst='bell')

# ---- act 2: warm piano bed, 76 bpm, chords move on the cuts
beat = 60 / 76
prog = [('s4', 's5', None, ['C3', 'G3', 'E4'], 'C2'),
        ('s5', 's6', ['C4', 'E4', 'G4', 'C5'], ['C3', 'G3', 'E4'], 'C2'),
        ('s6', 's7', ['A3', 'C4', 'E4', 'A4'], ['A2', 'E3', 'C4'], 'A1'),
        ('s7', 's8', ['F3', 'A3', 'C4', 'F4'], ['F2', 'C3', 'A3'], 'F1'),
        ('s8', 's9', ['G3', 'B3', 'D4', 'G4'], ['G2', 'D3', 'B3'], 'G1'),
        ('s9', 's10', ['E3', 'G3', 'C4', 'E4'], ['C3', 'G3', 'E4'], 'E2'),
        ('s10', 's11', ['F3', 'A3', 'C4', 'E4'], ['F2', 'C3', 'A3'], 'F1'),
        ('s11', 's12', ['D4', 'F4', 'A4', 'C5'], ['D3', 'A3', 'F4', 'C5'], 'D2'),
        ('s12', 's13', ['G3', 'B3', 'D4', 'F4'], ['G2', 'D3', 'B3', 'F4'], 'G1')]
for (a, b, an, pn, bs) in prog:
    A, B = S[a], S[b] - (0.3 if b == 's13' else 0)
    if an: arp([(A, B, an)], 0, beat / 2 if a not in ('s10', 's11') else beat, vel=.2)
    add(pad(pn, B - A, .7 if a != 's11' else 1.0, att=.3 if a != 's11' else 1.3, rel=.4), A)
    add(piano(bs, B - A, .34), A)
    if a == 's8': arp([(A + .1, B, ['G5', 'B5', 'D6', 'G6'])], 0, beat / 2, vel=.12, inst='bell')

# ---- SFX
R_ = np.random.default_rng(5); station_notes = iter(['C6', 'E6', 'G6'])
def boop(t, f0=330, vel=.3):
    n = int(SR * .22); tt = np.arange(n) / SR; ff = f0 * (1 + .9 * np.exp(-tt / .02))
    add(np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-tt / .06) * vel, t, pan=R_.uniform(-.2, .2))
for e in EV:
    if e.get('type') != 'sfx': continue
    t, n = e['t'], e['label']
    if n == 'bounce': boop(t, 300 + R_.uniform(-30, 30), .28)
    elif n == 'meltdown':
        sub(t, 42, .7, 1.4); noise_sweep(t, .5, 2000, 300, .12, shape='decay')
        for nt in ('Bb1', 'B1', 'F2'): add(piano(nt, 1.4, .3, bright=.6), t)
    elif n == 'door': boop(t, 160, .22); flip(t, .04, 0, .12)
    elif n == 'ring': add(bell('E5', .14), t, pan=.35)
    elif n == 'tick': tick(t, .32, 2200); sub(t, 52, .4, .35)
    elif n == 'station': add(bell(next(station_notes, 'C6'), .32), t, pan=R_.uniform(-.3, .3)); lock(t, .25)
    elif n == 'hit':
        sub(t, 44, .75, 1.4)
        for nt, v in [('C2', .55), ('C3', .5), ('G3', .45), ('E4', .45), ('C5', .4), ('D5', .3)]: add(piano(nt, 3.0, v), t)
        add(bell('C6', .45), t, pan=.2); add(bell('G6', .3), t + .03, pan=-.2)
    elif n in ('open', 'swish'): noise_sweep(t, .5, 700, 3000, .09, shape='swell')
    elif n == 'typing': type_ticks(t, t + 1.5)
    elif n == 'click': click(t, .45)
    elif n == 'reply': add(bell('E6', .16), t, pan=.3)
    elif n == 'magic': add(bell('G5', .26), t, pan=-.2); add(bell('D6', .18), t + .07, pan=-.3)
    elif n == 'magic2': add(bell('B5', .24), t, pan=.25); add(bell('E6', .16), t + .07, pan=.35)
    elif n == 'pop': boop(t, 520, .18)
    elif n == 'whoosh': noise_sweep(t, .5, 2500, 500, .12, shape='swell')
    elif n == 'select': click(t, .3, pan=.2); add(bell('C6', .15), t + .02, pan=.2)
    elif n == 'pageSlow': flip(t, .12, .25, 1.1)
    elif n == 'warm': add(bell('A5', .2), t, pan=0)
    elif n == 'ready': add(bell('G5', .22), t, pan=.1)
    elif n == 'converge': noise_sweep(t - .2, .5, 900, 6000, .1, shape='rise')
    elif n == 'final':
        sub(t, 42, .7, 1.8)
        for nt, v in [('C2', .55), ('C3', .5), ('G3', .45), ('E4', .45), ('G4', .4), ('D5', .35), ('E5', .28)]: add(piano(nt, 3.0, v), t)
        add(bell('C6', .42), t, pan=-.15); add(bell('E6', .28), t + .1, pan=.15); add(bell('G6', .2), t + .23, pan=.3)
        add(pad(['C3', 'G3', 'E4', 'D5'], S['end'] - t, .55, att=.2, rel=.3), t)

# ---------------- reverb on the music/SFX bus ----------------
def reverb(x, secs=2.2, wet=.22, seed=5):
    r = np.random.default_rng(seed); n = int(SR * secs); t = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-t / (secs / 6.5)); ir = fft_filter(ir, 200, 6000); ir[:int(.012 * SR)] = 0
    ir /= np.sqrt((ir ** 2).sum())
    m = len(x) + n; size = 1 << int(np.ceil(np.log2(m)))
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[:len(x)]
    return x * (1 - wet) + y * wet * 1.6
mus = np.stack([reverb(L, seed=5), reverb(R, seed=6)], 1)
mus = mus / (np.abs(mus).max() + 1e-9) * 0.5

# ---------------- the voice, placed at 0.5 s; the bed ducks ~10 dB under it ----------------
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'audio/takeA.mp3', '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
vo = np.frombuffer(raw, '<i2').astype(np.float64) / 32768
VO = np.zeros(N); i0 = int(0.5 * SR); VO[i0:i0 + len(vo)] = vo[:N - i0]
VO = VO / (np.sqrt((VO[VO != 0] ** 2).mean()) + 1e-9) * 0.11          # speech RMS ~ -19 dBFS before the master
env = np.convolve(np.abs(VO), np.ones(int(.05 * SR)) / int(.05 * SR), 'same')
env = np.clip(env / (np.percentile(env[env > 1e-4], 70) + 1e-9), 0, 1)
g = np.empty_like(env); a_att, a_rel, s_ = np.exp(-1 / (.03 * SR)), np.exp(-1 / (.35 * SR)), 0.0
for i in range(N):
    x = env[i]; s_ = (a_att if x > s_ else a_rel) * s_ + (1 - (a_att if x > s_ else a_rel)) * x; g[i] = s_
duck = 1 - 0.68 * g                                                     # about -10 dB while she speaks
mix = mus * duck[:, None] + np.stack([VO, VO], 1)
mix = mix / (np.abs(mix).max() + 1e-9) * 0.85
os.makedirs('audio', exist_ok=True)
with wave.open('audio/mix_raw.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
print('wrote audio/mix_raw.wav', mix.shape)
