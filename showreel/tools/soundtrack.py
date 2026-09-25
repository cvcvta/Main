"""Original score + sound design for the CVCVTA showreel, synthesized from scratch.

    node tools/cues.mjs > build/cues.json
    python3 tools/soundtrack.py            -> build/soundtrack.wav (48 kHz stereo, exactly 15.0 s)

128 BPM, F minor -> Ab major. Every hit is placed from the same cue sheet the visuals use,
and one-shots are panned to the on-screen position of whatever made the sound.
"""
import json

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal

SR = 48000
C = json.load(open("build/cues.json"))
DUR = C["duration"]
N = int(SR * DUR)
BEAT, S16 = C["beat"], C["s16"]
BAR = 4 * BEAT
rng = np.random.default_rng(7)


def tt(d):
    return np.arange(int(d * SR)) / SR


def midi(m):
    return 440.0 * 2 ** ((np.asarray(m, dtype=float) - 69) / 12)


def fades(x, a=0.002, r=0.01):
    n = len(x)
    env = np.ones(n)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na: env[:na] = np.linspace(0, 1, na)
    if nr: env[-nr:] *= np.linspace(1, 0, nr)
    return x * env if x.ndim == 1 else x * env[:, None]


# ------------------------------------------------------------------ filters
def butter(x, f, kind, order=2):
    if isinstance(f, (list, tuple)):
        wn = [min(0.99, v / (SR / 2)) for v in f]
    else:
        wn = min(0.99, f / (SR / 2))
    b, a = signal.butter(order, wn, kind)
    return signal.lfilter(b, a, x, axis=0)


def lp(x, f, o=2): return butter(x, f, "low", o)
def hp(x, f, o=2): return butter(x, f, "high", o)
def bp(x, f1, f2, o=2): return butter(x, [f1, f2], "band", o)


def biquad(kind, f, q):
    w = 2 * np.pi * min(f, SR * 0.45) / SR
    c, al = np.cos(w), np.sin(w) / (2 * q)
    if kind == "bp":
        b = [al, 0, -al]
    else:  # lp
        b = [(1 - c) / 2, 1 - c, (1 - c) / 2]
    a = [1 + al, -2 * c, 1 - al]
    return np.array(b) / a[0], np.array(a) / a[0]


def sweep(x, f0, f1, q=1.4, kind="bp", curve="exp", block=128):
    """Time-varying biquad (block-wise, state carried across blocks)."""
    n = len(x)
    y = np.zeros(n)
    zi = np.zeros(2)
    for s in range(0, n, block):
        p = s / max(1, n - 1)
        f = f0 * (f1 / f0) ** p if curve == "exp" else f0 + (f1 - f0) * p
        b, a = biquad(kind, f, q)
        y[s:s + block], zi = signal.lfilter(b, a, x[s:s + block], zi=zi)
    return y


# ------------------------------------------------------------------ oscillators
def saw(freq, d, phase=0.0):
    n = int(d * SR)
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,)) if np.ndim(freq) == 0 else np.asarray(freq)[:n]
    dt = f / SR
    ph = (phase + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    t1 = ph[m] / dt[m]
    y[m] -= t1 + t1 - t1 * t1 - 1
    m = ph > 1 - dt
    t2 = (ph[m] - 1) / dt[m]
    y[m] -= t2 * t2 + t2 + t2 + 1
    return y


def sine(freq, d, phase=0.0):
    n = int(d * SR)
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,)) if np.ndim(freq) == 0 else np.asarray(freq)[:n]
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)


def pan2(x, p):
    a = (np.clip(p, -1, 1) + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], 1) * np.sqrt(2)


# ------------------------------------------------------------------ bus
class Bus:
    def __init__(self):
        self.x = np.zeros((N + 4 * SR, 2))

    def add(self, t, sig, gain=1.0, pan=0.0):
        st = pan2(sig, pan) if sig.ndim == 1 else sig
        i = int(round(t * SR))
        if i < 0:
            st, i = st[-i:], 0
        n = min(len(st), len(self.x) - i)
        if n > 0:
            self.x[i:i + n] += st[:n] * gain


music, sfx, verb_send = Bus(), Bus(), Bus()

# ------------------------------------------------------------------ instruments
def kick(punch=1.0, d=0.55):
    t = tt(d)
    f = 43 + 125 * np.exp(-t * 32) + 60 * np.exp(-t * 260)
    body = sine(f, d) * np.exp(-t * 7.5)
    click = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 500) * 0.22
    return fades(np.tanh((body + click) * 1.7 * punch) * 0.85, 0.0005, 0.02)


def clap(d=0.4):
    t = tt(d)
    env = np.zeros_like(t)
    for k, o in enumerate((0, 0.008, 0.017, 0.026)):
        env += (t >= o) * np.exp(-np.maximum(t - o, 0) * 150) * (0.8 if k < 3 else 1)
    env += (t >= 0.026) * np.exp(-np.maximum(t - 0.026, 0) * 16) * 0.35
    return fades(bp(rng.standard_normal(len(t)), 850, 2800) * env * 0.9, 0.0005)


def hat(open_=False):
    d = 0.32 if open_ else 0.07
    t = tt(d)
    x = hp(rng.standard_normal(len(t)), 8000, 4) * np.exp(-t * (13 if open_ else 75))
    return fades(x * 0.5, 0.0003)


def crash(d=3.2):
    t = tt(d)
    n = rng.standard_normal((len(t), 2))
    x = hp(n, 4200, 2) * np.exp(-t * 1.25)[:, None] + bp(n, 6000, 11000) * np.exp(-t * 2.4)[:, None] * 0.5
    return fades(x * 0.3, 0.001, 0.2)


def bass(m, d, vel=1.0):
    t = tt(d)
    f = float(midi(m))
    x = np.sin(2 * np.pi * f * t) * 0.55 + lp(saw(f, d) * 0.65, 700, 2)
    env = np.minimum(1, t / 0.005) * (0.35 + 0.65 * np.exp(-t * 7))
    return fades(np.tanh(x * 1.5) * env * vel, 0.002, 0.02)


def supersaw(notes, d, voices=7, detune=0.16, cutoff=2400, seed=0, attack=0.02, release=0.3):
    r = np.random.default_rng(seed)
    out = np.zeros((int(d * SR), 2))
    for m in notes:
        for v in range(voices):
            off = (v - (voices - 1) / 2) / ((voices - 1) / 2) * detune
            s = saw(float(midi(m + off)), d, r.random())
            out += pan2(s, ((v / (voices - 1)) * 2 - 1) * 0.85) / (voices * len(notes) ** 0.5)
    out = lp(out, cutoff, 2)
    t = tt(d)
    env = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, (d - t) / release))
    return out * env[:, None]


def bell(m, d=1.4, index=2.4, ratio=3.5, decay=3.2):
    t = tt(d)
    f = float(midi(m))
    mod = np.sin(2 * np.pi * f * ratio * t) * index * np.exp(-t * 7)
    x = np.sin(2 * np.pi * f * t + mod) * np.exp(-t * decay)
    return fades(x * 0.35, 0.001, 0.05)


def pluck(m, d=0.45, bright=3200):
    t = tt(d)
    x = saw(float(midi(m)), d) * 0.6 + np.sin(2 * np.pi * float(midi(m)) * t) * 0.4
    return fades(lp(x, bright, 2) * np.exp(-t * 9) * 0.5, 0.001, 0.03)


def blip(f, d=0.06, decay=70):
    t = tt(d)
    return fades(np.sin(2 * np.pi * f * t) * np.exp(-t * decay) * 0.5, 0.0005, 0.005)


def tick(d=0.03, f=5200):
    t = tt(d)
    return fades(bp(rng.standard_normal(len(t)), f * 0.7, f * 1.3) * np.exp(-t * 260) * 0.8, 0.0002, 0.003)


def whoosh(d, f0, f1, q=1.1, shape="bell", gain=1.0):
    t = tt(d)
    x = sweep(rng.standard_normal(len(t)), f0, f1, q)
    p = t / d
    env = {"bell": np.sin(np.pi * p) ** 2, "rise": p ** 2.2, "fall": (1 - p) ** 1.6}[shape]
    return fades(x * env * gain * 0.6, 0.002, 0.02)


def impact(d=3.4):
    t = tt(d)
    f = 29 + 58 * np.exp(-t * 7)
    boom = sine(f, d) * np.exp(-t * 1.5)
    crack = lp(rng.standard_normal(len(t)), 2600) * np.exp(-t * 22) * 0.7
    body = lp(saw(float(midi(29)), d) + saw(float(midi(36)), d, 0.3) + saw(float(midi(41)), d, 0.6), 700) * np.exp(-t * 2.2) * 0.35
    return fades(np.tanh((boom * 1.3 + crack + body) * 1.25) * 0.95, 0.0005, 0.3)


def glitch(seed, d=0.085):
    r = np.random.default_rng(seed)
    t = tt(d)
    f = r.choice([98, 131, 147, 196, 262]) * r.choice([1, 2])
    x = np.sign(np.sin(2 * np.pi * f * t)) * 0.55 + r.standard_normal(len(t)) * 0.45
    k = int(r.choice([6, 10, 16]))
    x = np.repeat(x[::k], k)[:len(t)]
    x = np.round(x * 5) / 5
    return fades(lp(x, 7000) * 0.45, 0.0005, 0.006)


def shutter():
    d = 0.16
    t = tt(d)
    out = np.zeros(len(t))
    for o, g in ((0.0, 1.0), (0.034, 0.7)):
        i = int(o * SR)
        seg = t[: len(t) - i]
        c = hp(rng.standard_normal(len(seg)), 1800) * np.exp(-seg * 320) + np.sin(2 * np.pi * 2900 * seg) * np.exp(-seg * 180) * 0.4
        out[i:] += c * g
    thump = np.sin(2 * np.pi * 70 * t) * np.exp(-t * 30) * 0.8
    return fades((out * 0.55 + thump) * 0.7, 0.0003, 0.01)


def make_ir(rt60=2.1, d=2.8, seed=11):
    r = np.random.default_rng(seed)
    t = tt(d)
    ir = r.standard_normal((len(t), 2)) * np.exp(-6.91 * t / rt60)[:, None]
    ir = lp(ir, 5200, 2)
    ir[: int(0.012 * SR)] = 0
    for dly, g in ((0.013, 0.5), (0.021, 0.42), (0.029, 0.35), (0.043, 0.28), (0.061, 0.2)):
        ir[int(dly * SR)] += g * r.choice([-1, 1], 2)
    return ir / np.sqrt((ir ** 2).sum() / 2)


# ------------------------------------------------------------------ score
CH = {
    "Fm9": [56, 60, 63, 67], "Db9": [53, 56, 60, 63], "Ab9": [60, 63, 67, 70], "Eb9": [55, 58, 63, 65],
}
ROOT = {"Fm9": 41, "Db9": 37, "Ab9": 44, "Eb9": 39}
bars = ["Fm9", "Fm9", "Db9", "Ab9", "Eb9"]  # bars 0..4 (bar 5 = break, 6-7 = brand)
bar_t = lambda k: k * BAR

# intro pad: Fm9 opening up under the hook
pad = supersaw(CH["Fm9"], 2 * BAR + 0.4, cutoff=1400, attack=0.9, release=0.25, seed=1)
open_lp = np.clip(np.linspace(0.25, 1, len(pad)), 0, 1)
music.add(0.0, pad * (0.35 + 0.65 * open_lp[:, None]), 0.5)
music.add(0.0, fades(np.sin(2 * np.pi * float(midi(29)) * tt(BAR)) * np.minimum(1, tt(BAR) / 1.2) * 0.35, 0.01, 0.2), 0.22)

# groove pads (bars 2-4), sidechained below
for k in (2, 3, 4):
    music.add(bar_t(k), supersaw(CH[bars[k]], BAR + 0.25, cutoff=3400, attack=0.03, release=0.2, seed=k), 0.55)

# drums + bass: bar 1 .. end of bar 4 (tape-stopped at the reveal)
kicks = []
for bt in range(4, 21):
    tb = bt * BEAT
    if bt < 20:
        music.add(tb, kick(), 0.8)
        kicks.append(tb)
    if bt % 2 == 1 and bt < 20:
        music.add(tb, clap(), 0.55)
        verb_send.add(tb, clap(), 0.18)
    for s in range(4):
        ts = tb + s * S16
        if ts >= C["reveal"] + 0.4:
            continue
        if s == 2:
            music.add(ts, hat(True), 0.28, pan=0.15)
        else:
            music.add(ts, hat(), [0.55, 0.27, 0, 0.34][s], pan=-0.15 + 0.1 * (s % 2))
    k = int(tb // BAR)
    if k < 5:
        root = ROOT[bars[k]]
        music.add(tb + 2 * S16, bass(root, 2 * S16 * 0.95), 0.62)
        if bt % 4 == 3:
            music.add(tb + 3 * S16, bass(root + 12, S16 * 0.9, 0.7), 0.5)
# clap roll into the reveal
for j in range(4):
    ts = C["reveal"] - BEAT + j * S16
    music.add(ts, clap(0.2), 0.25 + 0.1 * j)

# arp sparkle across the scan
arp = {2: [65, 68, 72, 75], 3: [67, 72, 75, 79], 4: [67, 70, 75, 77]}
for k in (2, 3, 4):
    for s in range(16):
        m = arp[k][[0, 1, 2, 3, 2, 1, 3, 2][s % 8]]
        music.add(bar_t(k) + s * S16, pluck(m, 0.3, 2600), 0.13 * (1.0 if s % 4 == 0 else 0.7), pan=-0.35 if s % 2 else 0.35)

# sidechain pump on music bus (pads/bass duck from kicks)
tvec = np.arange(len(music.x)) / SR
gain = np.ones(len(tvec))
for tk in kicks:
    i = int(tk * SR)
    seg = tvec[i:i + int(0.35 * SR)] - tk
    gain[i:i + len(seg)] = np.minimum(gain[i:i + len(seg)], 1 - 0.55 * np.exp(-seg / 0.07))
# (applied to pads/bass by re-summing: simplest is to duck the whole music bus lightly except kick transients)
music.x *= (0.45 + 0.55 * gain)[:, None]

# tape stop on the groove at the reveal
t0 = C["reveal"]
i0 = int(t0 * SR)
L = int(0.5 * SR)
p = np.arange(L) / L
speed = (1 - p) ** 1.7
pos = i0 + np.cumsum(speed)
seg = np.stack([np.interp(pos, np.arange(len(music.x)), music.x[:, c]) for c in range(2)], 1) * ((1 - p) ** 0.4)[:, None]
music.x[i0:i0 + L] = lp(seg, 5000)
music.x[i0 + L:int((C["brand"] - 0.02) * SR)] = 0

# ------------------------------------------------------------------ sound design
pans = C["cardPan"]
for i, te in enumerate(C["cardEnter"]):
    sfx.add(te, whoosh(0.34, 700, 3600, 1.3, "bell"), 0.22, pan=pans[i] * 0.9)
    sfx.add(te + 0.28, tick(0.025, 4200), 0.2, pan=pans[i] * 0.9)

hook_notes = [72, 75, 77, 79, 82]
for i, tw in enumerate(C["hookWords"][:-1]):
    sfx.add(tw, tick(0.03, 3600), 0.35, pan=-0.2 + i * 0.08)
    sfx.add(tw, blip(float(midi(hook_notes[i])), 0.09, 40), 0.16, pan=-0.2 + i * 0.08)
ai = C["hookWords"][-1]
sfx.add(ai, glitch(3, 0.14), 0.55, pan=0.25)
sfx.add(ai, fades(np.sin(2 * np.pi * 55 * tt(0.5)) * np.exp(-tt(0.5) * 7), 0.001, 0.05), 0.5)
verb_send.add(ai, glitch(3, 0.14), 0.25)
sfx.add(C["hopStart"] - 0.9, whoosh(0.9, 400, 7000, 0.9, "rise"), 0.22)

hop_notes = [65, 68, 70, 72, 75, 77, 70, 65]
for j, c in enumerate(C["hops"]):
    th = C["hopStart"] + j * S16
    sfx.add(th, blip(float(midi(hop_notes[j] + 12)), 0.07, 45) + tick(0.07, 6000)[: int(0.07 * SR)] * 0.3, 0.28, pan=pans[c])
    verb_send.add(th, blip(float(midi(hop_notes[j] + 12)), 0.07, 45), 0.12)

sfx.add(C["dive"] - 0.05, whoosh(0.46, 300, 5200, 1.0, "bell"), 0.55, pan=-0.3)
sfx.add(C["dive"] + 0.3, fades(sine(90 * np.exp(-tt(0.4) * 5) + 40, 0.4) * np.exp(-tt(0.4) * 6), 0.001, 0.05), 0.5)

verdict_notes = [80, 77, 80, 84, 87]
for k, tc in enumerate(C["subj"]):
    sfx.add(tc, shutter(), 0.6)
    sweep_d = 0.46
    f = 700 * (3.2 ** (tt(sweep_d) / sweep_d)) * (1 + 0.01 * np.sin(2 * np.pi * 30 * tt(sweep_d)))
    sfx.add(tc + 0.02, fades(sine(f, sweep_d) * np.sin(np.pi * tt(sweep_d) / sweep_d) * 0.3, 0.005, 0.02), 0.12)
    for j in range(8):
        sfx.add(tc + 0.1 + j * S16 / 2, blip(float(midi(84 + rng.choice([0, 3, 5, 7, 10]))), 0.03, 120), 0.07, pan=0.45)
    sfx.add(tc + 0.42, bell(verdict_notes[k], 1.3), 0.34, pan=0.35)
    verb_send.add(tc + 0.42, bell(verdict_notes[k], 1.3), 0.2)

sfx.add(C["pull"] - 0.1, whoosh(0.52, 5200, 380, 1.0, "bell"), 0.5, pan=0.3)
for j, i in enumerate([4, 3, 2, 1, 0]):
    sfx.add(C["pull"] + 0.1 + j * 0.05 + 0.18, tick(0.03, 2800), 0.3, pan=pans[i])
done = C["pull"] + 0.62
for j, m in enumerate([80, 84, 87, 92]):
    sfx.add(done + j * S16 / 2, bell(m, 0.6, 1.2, 2.0, 6), 0.22, pan=-0.1 + j * 0.07)

# the twist
sfx.add(C["reveal"], fades(sweep(rng.standard_normal(int(0.45 * SR)), 2400, 180, 1.4, "bp") * np.linspace(1, 0, int(0.45 * SR)), 0.001, 0.02), 0.35)
for i, tf in enumerate(C["flips"]):
    sfx.add(tf, glitch(20 + i), 0.75, pan=pans[i])
    sfx.add(tf, fades(np.sin(2 * np.pi * 62 * tt(0.18)) * np.exp(-tt(0.18) * 22), 0.0005, 0.02), 0.4)
    verb_send.add(tf, glitch(20 + i), 0.2)
sfx.add(C["flips"][5] + 0.05, whoosh(0.13, 4200, 900, 1.8, "fall"), 0.45)
for j in range(11):
    sfx.add(C["correction"] + j * 0.018, tick(0.02, 3000 + 200 * (j % 3)), 0.22, pan=-0.2 + j * 0.04)

slam = C["slam"]
pre = whoosh(0.3, 900, 9000, 0.8, "rise")
sfx.add(slam - 0.3, pre, 0.5)
sfx.add(slam, impact(), 1.0)
verb_send.add(slam, impact()[: int(0.6 * SR)], 0.35)

# riser + snare roll into the drop, with a breath of silence
brand = C["brand"]
rd = brand - (slam + 0.2) - 0.04
t_r = tt(rd)
noise_riser = sweep(rng.standard_normal(len(t_r)), 300, 7500, 0.9, "bp") * (t_r / rd) ** 2.4
tone = saw(float(midi(41)) * 2 ** (2 * (t_r / rd) ** 1.3), rd) * (t_r / rd) ** 2 * 0.25
sfx.add(slam + 0.2, fades(lp(tone, 3000) + noise_riser * 0.9, 0.05, 0.005), 0.55)
roll_t = slam + 0.47
while roll_t < brand - 0.04:
    prog = (roll_t - slam) / (brand - slam)
    sfx.add(roll_t, clap(0.12), 0.08 + 0.35 * prog ** 2)
    roll_t += S16 if prog < 0.55 else S16 / 2

# drop / brand
music.add(brand, kick(1.25, 0.8), 1.0)
music.add(brand, crash(), 0.55)
music.add(brand, impact(2.2)[: int(2.2 * SR)], 0.55)
drop = supersaw([49, 53, 56, 60, 63, 68], 2 * BAR + 0.1, voices=9, detune=0.2, cutoff=3200, attack=0.005, release=0.25, seed=21)
env = np.ones(len(drop))
dp_t = tt(len(drop) / SR)
env *= 0.55 + 0.45 * np.exp(-dp_t * 1.2)
pump = 1 - 0.35 * np.exp(-((dp_t % (BEAT / 2)) / 0.06))
music.add(brand, drop * (env * pump)[:, None], 0.55)
verb_send.add(brand, drop[: int(0.4 * SR)], 0.25)
music.add(brand, fades(bass(37, 2 * BAR - 0.05, 1.0), 0.002, 0.2), 0.4)
music.add(brand + 2 * BEAT, kick(0.8), 0.55)
for s in range(1, 8):
    music.add(brand + s * BEAT / 2, hat(s % 2 == 1), 0.12, pan=0.2 * (-1) ** s)
sfx.add(brand, whoosh(0.62, 6000, 500, 1.0, "fall"), 0.45)

# render sweep, left to right
sd = 0.5
sw = whoosh(sd, 900, 6500, 1.6, "bell")
sw_st = np.stack([sw * np.cos((np.linspace(-0.8, 0.8, len(sw)) + 1) * np.pi / 4), sw * np.sin((np.linspace(-0.8, 0.8, len(sw)) + 1) * np.pi / 4)], 1) * np.sqrt(2)
sfx.add(C["solid"], sw_st, 0.4)
for j, m in enumerate([68, 72, 75]):
    sfx.add(C["tagline"] + j * BEAT / 2, pluck(m + 12, 0.6, 4200), 0.3, pan=-0.15 + 0.15 * j)
    verb_send.add(C["tagline"] + j * BEAT / 2, pluck(m + 12, 0.6, 4200), 0.2)

# final chord + the red dot
dot = C["dot"]
final = supersaw([56, 60, 63, 67, 70, 75], DUR - dot + 0.5, voices=9, detune=0.18, cutoff=2800, attack=0.35, release=1.2, seed=33)
music.add(dot, final, 0.5)
music.add(dot, fades(bass(32, DUR - dot, 0.9), 0.002, 0.8), 0.32)
verb_send.add(dot, final, 0.12)
sfx.add(dot - 0.12, tick(0.03, 5000), 0.3, pan=0.75)
fl = 0.52
fly = sine(420 * 2 ** (1.4 * tt(fl) / fl), fl) * np.sin(np.pi * tt(fl) / fl) ** 2 * 0.25
fw = whoosh(fl, 2500, 700, 1.2, "bell")
fly_mix = fly + fw
pan_curve = np.linspace(0.8, 0.55, len(fly_mix))
fly_st = np.stack([fly_mix * np.cos((pan_curve + 1) * np.pi / 4), fly_mix * np.sin((pan_curve + 1) * np.pi / 4)], 1) * np.sqrt(2)
sfx.add(dot, fly_st, 0.55)
land = dot + fl
sfx.add(land, fades(np.sin(2 * np.pi * 150 * tt(0.2) * np.exp(-tt(0.2) * 3)) * np.exp(-tt(0.2) * 26), 0.0005, 0.02), 0.7, pan=0.55)
sfx.add(land, bell(80, 2.2, 1.6, 2.0, 1.6), 0.4, pan=0.55)
verb_send.add(land, bell(80, 2.2, 1.6, 2.0, 1.6), 0.35)

# ------------------------------------------------------------------ mix + master
ir = make_ir()
wet = np.stack([signal.fftconvolve(verb_send.x[:, c], ir[:, c])[: len(verb_send.x)] for c in range(2)], 1)
mix = music.x * 0.95 + sfx.x * 1.0 + wet * 0.28
mix = mix[:N]
mix = hp(mix, 28, 2)

# gentle glue compression (RMS follower)
env = np.sqrt(lp(np.mean(mix ** 2, axis=1), 12, 1).clip(1e-12))
thr = 10 ** (-18 / 20)
g = np.where(env > thr, (env / thr) ** (1 / 2.2 - 1), 1.0)
mix *= g[:, None]

# end fade in step with the picture
fade = np.clip((DUR - np.arange(N) / SR) / 0.3, 0, 1)
mix *= fade[:, None]

meter = pyln.Meter(SR)
lufs = meter.integrated_loudness(mix)
mix = pyln.normalize.loudness(mix, lufs, -14.0)
# soft-knee limiter to -1 dBFS
ceil = 10 ** (-1.0 / 20)
mix = np.tanh(mix / ceil * 0.98) * ceil
print(f"loudness in {lufs:.1f} LUFS -> {meter.integrated_loudness(mix):.1f} LUFS, peak {20 * np.log10(np.abs(mix).max()):.2f} dBFS")
sf.write("build/soundtrack.wav", mix.astype(np.float32), SR, subtype="PCM_24")
print("wrote build/soundtrack.wav", mix.shape[0] / SR, "s")
