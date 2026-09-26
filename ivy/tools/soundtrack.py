"""Original score and sound design for the Ivy spot, synthesized from scratch in numpy.

    node tools/cues.mjs > build/cues.json
    python3 tools/soundtrack.py            -> build/soundtrack.wav (48 kHz stereo, same length as the picture)

96 BPM, 12 bars. 11:48 PM sits in B minor over a clock and a drone; the cut opens into D major
with a laid-back groove (kick on 1, the and-of-2 and the and-of-3, clap on 2 and 4, lightly swung
sixteenths). Every UI hit is placed from the same cue sheet as the picture and panned to where it
happens on screen. Ivy's two-note motif (D -> A) sounds on the approval and again on the offer.
"""
import json

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal

SR = 48000
C = json.load(open("build/cues.json"))
T = C["T"]
DUR = C["duration"]
N = int(SR * DUR)
BEAT, S16 = C["beat"], C["s16"]
BAR = 4 * BEAT
b = lambda n: n * BEAT
rng = np.random.default_rng(11)


# ------------------------------------------------------------------ basics
def tt(d):
    return np.arange(int(d * SR)) / SR


def midi(m):
    return 440.0 * 2 ** ((np.asarray(m, dtype=float) - 69) / 12)


def fades(x, a=0.002, r=0.01):
    n = len(x)
    env = np.ones(n)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na:
        env[:na] = np.linspace(0, 1, na)
    if nr:
        env[-nr:] *= np.linspace(1, 0, nr)
    return x * env if x.ndim == 1 else x * env[:, None]


def butter(x, f, kind, order=2):
    if isinstance(f, (list, tuple)):
        wn = [min(0.99, v / (SR / 2)) for v in f]
    else:
        wn = min(0.99, f / (SR / 2))
    bb, a = signal.butter(order, wn, kind)
    return signal.lfilter(bb, a, x, axis=0)


def lp(x, f, o=2): return butter(x, f, "low", o)
def hp(x, f, o=2): return butter(x, f, "high", o)
def bp(x, f1, f2, o=2): return butter(x, [f1, f2], "band", o)


def biquad(kind, f, q):
    w = 2 * np.pi * min(f, SR * 0.45) / SR
    c, al = np.cos(w), np.sin(w) / (2 * q)
    if kind == "bp":
        bb = [al, 0, -al]
    elif kind == "hp":
        bb = [(1 + c) / 2, -(1 + c), (1 + c) / 2]
    else:
        bb = [(1 - c) / 2, 1 - c, (1 - c) / 2]
    a = [1 + al, -2 * c, 1 - al]
    return np.array(bb) / a[0], np.array(a) / a[0]


def sweep(x, f0, f1, q=1.2, kind="bp", block=128, curve=None):
    """Time-varying biquad, block-wise with carried state. curve(p) -> 0..1 maps progress."""
    n = len(x)
    y = np.zeros(n)
    zi = np.zeros(2)
    for s in range(0, n, block):
        p = s / max(1, n - 1)
        if curve:
            p = curve(p)
        f = f0 * (f1 / f0) ** p
        bb, a = biquad(kind, f, q)
        y[s:s + block], zi = signal.lfilter(bb, a, x[s:s + block], zi=zi)
    return y


def saw(freq, d, phase=0.0):
    n = int(d * SR)
    f = np.full(n, float(freq)) if np.ndim(freq) == 0 else np.asarray(freq, dtype=float)[:n]
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
    f = np.full(n, float(freq)) if np.ndim(freq) == 0 else np.asarray(freq, dtype=float)[:n]
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)


def over(*xs):
    """Sum signals of different lengths."""
    out = np.zeros(max(len(x) for x in xs))
    for x in xs:
        out[: len(x)] += x
    return out


def pan2(x, p):
    a = (np.clip(p, -1, 1) + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], 1) * np.sqrt(2)


def pan_move(x, p0, p1):
    p = np.linspace(p0, p1, len(x))
    a = (np.clip(p, -1, 1) + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], 1) * np.sqrt(2)


class Bus:
    def __init__(self):
        self.x = np.zeros((N + 5 * SR, 2))

    def add(self, t, sig, gain=1.0, pan=0.0):
        st = pan2(sig, pan) if sig.ndim == 1 else sig
        i = int(round(t * SR))
        if i < 0:
            st, i = st[-i:], 0
        n = min(len(st), len(self.x) - i)
        if n > 0:
            self.x[i:i + n] += st[:n] * gain


drums, bass_bus, keys_bus, sfx, verb = Bus(), Bus(), Bus(), Bus(), Bus()


# ------------------------------------------------------------------ instruments
def kick(punch=1.0, d=0.42, tone=52):
    t = tt(d)
    f = tone + 95 * np.exp(-t * 30) + 70 * np.exp(-t * 240)
    body = sine(f, d) * np.exp(-t * 9)
    click = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 600) * 0.12
    return fades(np.tanh((body + click) * 1.4 * punch) * 0.9, 0.0005, 0.02)


def clap(d=0.35, bright=1.0):
    t = tt(d)
    env = np.zeros_like(t)
    for k, o in enumerate((0, 0.009, 0.018, 0.028)):
        env += (t >= o) * np.exp(-np.maximum(t - o, 0) * 160) * (0.75 if k < 3 else 1)
    env += (t >= 0.028) * np.exp(-np.maximum(t - 0.028, 0) * 18) * 0.3
    return fades(bp(rng.standard_normal(len(t)), 900, 2600 * bright) * env * 0.85, 0.0005)


def hat(open_=False, amp=0.5):
    d = 0.28 if open_ else 0.05
    t = tt(d)
    x = hp(rng.standard_normal(len(t)), 7500, 4) * np.exp(-t * (14 if open_ else 90))
    return fades(x * amp, 0.0003)


def shaker(d=0.07):
    t = tt(d)
    env = np.minimum(1, t / 0.012) * np.exp(-t * 55)
    return fades(bp(rng.standard_normal(len(t)), 5000, 11000) * env * 0.4, 0.001)


def crash(d=2.6, amp=0.28):
    t = tt(d)
    n = rng.standard_normal((len(t), 2))
    x = hp(n, 4500, 2) * np.exp(-t * 1.5)[:, None] + bp(n, 6500, 12000) * np.exp(-t * 3)[:, None] * 0.5
    return fades(x * amp, 0.001, 0.3)


def bass(m, d, vel=1.0):
    t = tt(d)
    f = float(midi(m))
    x = np.sin(2 * np.pi * f * t) * 0.7 + lp(saw(f, d), 520, 2) * 0.35
    env = np.minimum(1, t / 0.006) * (0.45 + 0.55 * np.exp(-t * 5))
    return fades(np.tanh(x * 1.3) * env * vel, 0.002, 0.03)


def epiano(m, d=0.9, vel=1.0):
    """FM electric piano: body + tine."""
    t = tt(d)
    f = float(midi(m))
    mod = np.sin(2 * np.pi * f * t) * (1.6 * np.exp(-t * 4) + 0.25)
    body = np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 2.6)
    tine = np.sin(2 * np.pi * f * 14 * t) * np.exp(-t * 40) * 0.12
    return fades((body + tine) * 0.3 * vel, 0.002, 0.08)


def pluck(m, d=0.5, bright=3000, decay=8.0):
    """Marimba-ish: sine + soft triangle partial + short mallet transient."""
    t = tt(d)
    f = float(midi(m))
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30) + 0.2 * np.sin(2 * np.pi * f * 2 * t)
    x = x * np.exp(-t * decay)
    x += lp(rng.standard_normal(len(t)), bright) * np.exp(-t * 300) * 0.15
    return fades(x * 0.35, 0.001, 0.03)


def pad(notes, d, cutoff=1800, detune=0.12, voices=5, attack=0.4, release=0.5, seed=0):
    r = np.random.default_rng(seed)
    out = np.zeros((int(d * SR), 2))
    for m in notes:
        for v in range(voices):
            off = (v - (voices - 1) / 2) / ((voices - 1) / 2) * detune
            s = saw(float(midi(m + off)), d, r.random())
            out += pan2(s, ((v / (voices - 1)) * 2 - 1) * 0.8) / (voices * len(notes) ** 0.5)
    out = lp(out, cutoff, 2)
    t = tt(d)
    env = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, (d - t) / release))
    return out * env[:, None]


def bell(m, d=1.6, index=2.2, ratio=3.5, decay=3.0, amp=0.3):
    t = tt(d)
    f = float(midi(m))
    mod = np.sin(2 * np.pi * f * ratio * t) * index * np.exp(-t * 6)
    x = np.sin(2 * np.pi * f * t + mod) * np.exp(-t * decay)
    return fades(x * amp, 0.001, 0.05)


def blip(f, d=0.08, decay=55, fm=0.0):
    t = tt(d)
    x = np.sin(2 * np.pi * f * t + fm * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 40))
    return fades(x * np.exp(-t * decay) * 0.5, 0.0005, 0.006)


def tick(f=4200, d=0.025, amp=0.8):
    t = tt(d)
    return fades(bp(rng.standard_normal(len(t)), f * 0.7, min(f * 1.4, 20000)) * np.exp(-t * 280) * amp, 0.0002, 0.003)


def thock(f0=190, d=0.14):
    t = tt(d)
    body = sine(f0 * (1 + 0.8 * np.exp(-t * 60)), d) * np.exp(-t * 32)
    click = bp(rng.standard_normal(len(t)), 1500, 5000) * np.exp(-t * 400) * 0.35
    return fades((body + click) * 0.7, 0.0003, 0.01)


def whoosh(d, f0, f1, q=1.0, shape="bell", gain=1.0):
    t = tt(d)
    x = sweep(rng.standard_normal(len(t)), f0, f1, q)
    p = t / d
    env = {"bell": np.sin(np.pi * p) ** 2, "rise": p ** 2.4, "fall": (1 - p) ** 1.8, "late": np.sin(np.pi * p ** 0.6) ** 2}[shape]
    return fades(x * env * gain * 0.55, 0.002, 0.02)


def zipper(d, f0=2400, f1=4200, rate=55):
    t = tt(d)
    n = sweep(rng.standard_normal(len(t)), f0, f1, 2.2)
    am = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * rate * t * (1 + 0.6 * t / d)))
    env = np.sin(np.pi * t / d) ** 0.8
    return fades(n * am * env * 0.5, 0.002, 0.01)


def ks_pluck(f, d=1.2, damp=0.996):
    """Karplus-Strong string with a downward bend (the thread pulled taut)."""
    n = int(d * SR)
    period = int(SR / f)
    buf = rng.uniform(-1, 1, period)
    out = np.zeros(n)
    for i in range(n):
        j = i % period
        out[i] = buf[j]
        buf[j] = damp * 0.5 * (buf[j] + buf[(j + 1) % period])
    return fades(lp(out, 2400) * 0.6, 0.001, 0.2)


def impact(d=2.6, root=35):
    t = tt(d)
    f = 30 + 60 * np.exp(-t * 7)
    boom = sine(f, d) * np.exp(-t * 1.6)
    crack = lp(rng.standard_normal(len(t)), 3200) * np.exp(-t * 26) * 0.75
    body = lp(saw(float(midi(root)), d) + saw(float(midi(root + 7)), d, 0.3) + saw(float(midi(root + 13)), d, 0.6), 650) * np.exp(-t * 2.4) * 0.32
    return fades(np.tanh((boom * 1.3 + crack + body) * 1.2) * 0.95, 0.0005, 0.3)


def shimmer(d=1.0, notes=(86, 90, 93, 97, 98, 102), seed=3, amp=0.12):
    r = np.random.default_rng(seed)
    out = np.zeros(int(d * SR))
    for k, m in enumerate(notes):
        o = int(r.uniform(0, 0.12) * SR)
        x = bell(m, d - o / SR, 1.4, 2.0, 5.0 + r.uniform(0, 3), 1.0)
        out[o:o + len(x)] += x
    return out * amp


def make_ir(rt60=1.9, d=2.6, seed=5):
    r = np.random.default_rng(seed)
    t = tt(d)
    ir = r.standard_normal((len(t), 2)) * np.exp(-6.91 * t / rt60)[:, None]
    ir = lp(ir, 6000, 2)
    ir[: int(0.01 * SR)] = 0
    for dly, g in ((0.011, 0.5), (0.019, 0.42), (0.027, 0.35), (0.041, 0.28), (0.058, 0.2)):
        ir[int(dly * SR)] += g * r.choice([-1, 1], 2)
    return ir / np.sqrt((ir ** 2).sum() / 2)


# ================================================================== A: 11:48 PM (B minor)
split = T["split"]
# drone: B minor bed that opens up, then is cut by the light
dd = split + 0.05
tdr = tt(dd)
dr = np.sin(2 * np.pi * float(midi(35)) * tdr) * 0.3
dr += sweep(saw(float(midi(47)), dd) + saw(float(midi(47.08)), dd, 0.4) + 0.6 * saw(float(midi(54)), dd, 0.2), 280, 1400, 0.7, 'lp', curve=lambda p: p ** 2) * 0.28
dr *= np.minimum(1, tdr / 0.6)[:] * (0.6 + 0.4 * (tdr / dd))
t_c0 = C["cards"][0]["t"]
whine = np.sin(2 * np.pi * float(midi(84)) * tdr) * (0.5 + 0.5 * np.sin(2 * np.pi * 6.5 * tdr)) * np.clip((tdr - t_c0) / (T["slam"] - t_c0), 0, 1) ** 2 * 0.05
keys_bus.add(0.0, fades(np.stack([dr + whine, dr * 0.96 + whine], 1), 0.01, 0.04), 0.55)

# clock: tick / tock on quarters, dry and a little right (where the clock sits); ratchets into a time-lapse
for q in range(0, int(round((C["clock"][0] - S16) / BEAT))):  # up to the time-lapse
    sfx.add(b(q), tick(4300 if q % 2 == 0 else 2900, 0.03, 0.6), 0.14, pan=0.55 if b(q) >= T["intro"] else 0.1)

# the opening title: a low, soft chord as the time rises in, then air as it settles into the corners
for j, m in enumerate([47, 59, 62, 66, 73]):
    keys_bus.add(0.14 + 0.03 * j, epiano(m, 2.6, 0.55 if j else 0.4), 0.3, pan=-0.2 + 0.1 * j)
    verb.add(0.14 + 0.03 * j, epiano(m, 2.6, 0.55), 0.18)
sfx.add(0.4, shimmer(1.2, (86, 90, 93, 97), seed=7, amp=0.05), 0.4, pan=0.0)
for side in (-0.6, 0.6):
    sfx.add(T["intro"], pan_move(whoosh(0.75, 900, 2600, 1.2, "bell"), 0.0, side), 0.09)
sfx.add(T["intro"] + 0.66, over(thock(240, 0.08) * 0.6, tick(5200, 0.015, 0.5)), 0.12, pan=0.75)
for i, tc in enumerate(C["clock"]):
    sfx.add(tc, tick(3200 + 260 * i, 0.03, 0.9), 0.24, pan=0.7)
    sfx.add(tc + S16 / 2, tick(2600 + 200 * i, 0.02, 0.6), 0.1, pan=0.7)

# the seven apps land, each with its own ping, rising and souring
pings = [(83, 90), (85, 88), (86, 93), (88, 91), (90, 95), (91, 96), (93, 97)]
for i, c in enumerate(C["cards"]):
    sfx.add(c["t"], thock(170 + 12 * i), 0.5, pan=c["pan"] * 0.8)
    m1, m2 = pings[i]
    ping = np.zeros(int(0.2 * SR))
    p1 = blip(float(midi(m1)), 0.09, 38, fm=0.6)
    p2 = blip(float(midi(m2)), 0.12, 30, fm=0.6)
    ping[: len(p1)] += p1
    o = int(0.055 * SR)
    ping[o:o + len(p2)] += p2
    sfx.add(c["t"] + 0.02, ping, 0.3, pan=c["pan"])
    verb.add(c["t"] + 0.02, ping, 0.18, pan=c["pan"])
    # the thread zips from the previous card to this one
    if i > 0:
        t0 = C["cards"][i - 1]["t"]
        z = zipper(c["t"] - t0 + 0.02, 2200 + 150 * i, 3800 + 200 * i)
        sfx.add(t0, pan_move(z, C["cards"][i - 1]["pan"], c["pan"]), 0.16)
    else:
        z = zipper(0.2, 2000, 3400)
        sfx.add(max(0, c["t"] - 0.2), pan_move(z, -1, c["pan"]), 0.12)

# odometer: a soft ratchet as the tens roll over
t_c0, t_c6 = C["cards"][0]["t"] - 0.02, C["cards"][6]["t"] - 0.02
for k in range(1, 14):
    target = 10 * k / 138
    u = np.sqrt(target / 2) if target < 0.5 else 1 - np.sqrt((1 - target) / 2)  # inverse of inOutQuad
    tk = t_c0 + 0.05 + u * (t_c6 + 0.3 - t_c0)
    sfx.add(tk, tick(6000, 0.012, 0.5), 0.07, pan=0.0)

# thread pulled taut
sfx.add(T["taut"], ks_pluck(float(midi(40)), 1.0), 0.28, pan=-0.1)
sfx.add(T["taut"], whoosh(0.18, 900, 300, 1.4, "fall"), 0.2)

# into the slam: reverse swell, then the hit
rs = 0.9
tr_ = tt(rs)
rev = sweep(rng.standard_normal(len(tr_)), 1200, 8200, 0.7, 'lp', curve=lambda p: p ** 3) * (tr_ / rs) ** 3.2
tone = sine(float(midi(59)) * 2 ** ((tr_ / rs) ** 2), rs) * (tr_ / rs) ** 2.5 * 0.25
sfx.add(T["slam"] - rs, fades(np.stack([rev + tone, rev * 0.9 + tone], 1), 0.01, 0.004), 0.4)
sfx.add(T["slam"], impact(2.8, 35), 0.85)
verb.add(T["slam"], impact(0.7, 35), 0.3)
# heartbeat after the hit, fading under the time-lapse
for k, tb in enumerate(T["slam"] + BEAT * np.arange(1, 4)):
    for o, g in ((0, 1.0), (0.17, 0.6)):
        sfx.add(tb + o, kick(0.8, 0.3, 44), 0.35 * g * (1, 0.8, 0.55)[k])

# admin words: quiet type ticks
for i, tw in enumerate(C["admin"]):
    sfx.add(tw, tick(3000 + 90 * i, 0.02, 0.7), 0.1, pan=-0.05 + 0.02 * i)

# the light: a laser shing drawn left to right
sd = T["split"] - T["slice"] + 0.06
ts_ = tt(sd)
shn = sweep(rng.standard_normal(len(ts_)), 1800, 11000, 3.0) * (ts_ / sd) ** 1.5
las = sine(900 * 4 ** (ts_ / sd), sd) * (ts_ / sd) ** 2 * 0.25
sfx.add(T["slice"], fades(pan_move(shn + las, -0.9, 0.9), 0.01, 0.005), 0.5)

# the cut: crack, glass shimmer, a soft boom; the night drops away
sfx.add(split, whoosh(0.5, 6000, 500, 0.9, "fall"), 0.55)
sfx.add(split, fades(lp(rng.standard_normal(int(0.08 * SR)), 5000) * np.exp(-tt(0.08) * 60), 0.0005, 0.01), 0.4)
sfx.add(split, kick(0.8, 0.5, 40), 0.35)
glass = shimmer(1.4, (98, 102, 105, 107, 110, 114), seed=9, amp=0.16)
sfx.add(split + 0.02, glass, 0.6, pan=0.1)
verb.add(split + 0.02, glass, 0.5)
# reverse-swell of the D major world arriving on the downbeat
sw = pad([62, 66, 69, 73, 76], b(1) + 0.05, cutoff=3200, attack=b(1), release=0.01, seed=4)
swt = tt(len(sw) / SR)
sw *= ((swt / swt[-1]) ** 2.2)[:, None]
keys_bus.add(split - BEAT, sw, 0.55)

# ================================================================== B + C: Ivy (D major groove)
# Harmony follows the picture: home on the reveal, a lift under the typing, tension as the finger
# comes in, home again on the tap, and an A11 pulling into the brand.
Dmaj9, Bm9, Gmaj9, DF, Em9, A11 = [62, 66, 69, 73, 76], [59, 62, 66, 69, 73], [55, 59, 62, 66, 69], [54, 57, 62, 66, 69], [52, 55, 59, 62, 66], [57, 62, 64, 67, 71]
s0 = T["split"]
CHORDS = [  # (start, end, notes, bass root): a bar each from the cut, then the picture's cue windows
    (s0, s0 + BAR, Dmaj9, 38),
    (s0 + BAR, s0 + 2 * BAR, Bm9, 35),
    (s0 + 2 * BAR, s0 + 3 * BAR, Gmaj9, 31),
    (s0 + 3 * BAR, s0 + 4 * BAR, DF, 30),
    (s0 + 4 * BAR, T["tap"], Em9, 28),
    (T["tap"], T["land"], Dmaj9, 38),
    (T["land"], T["morph"], Gmaj9, 31),
    (T["morph"], T["lockup"], A11, 33),
]
GROOVE_END = T["lockup"]  # the groove runs into the morph, where a low-pass closes on it
HELD = (T["finger"] + BEAT * 0.25, T["tap"] - 0.01)  # the breath before the tap


def chord_at(t):
    for a, e, notes, root in CHORDS:
        if a - 1e-6 <= t < e:
            return notes, root
    return Dmaj9, 38


for a, e, notes, _ in CHORDS:
    keys_bus.add(a, pad(notes, e - a + 0.25, cutoff=2200, attack=0.04, release=0.25, seed=int(a * 10)), 0.34)

# one bar of sixteenths: kick on 1, the and-of-2 and the and-of-3; clap on 2 and 4
KICK = {0: 1.0, 6: 0.72, 10: 0.85}
CLAP = (4, 12)
BASS = {0: (0, 5.5, 1.0, 0.5), 6: (0, 3.0, 0.8, 0.42), 10: (7, 3.0, 0.75, 0.36), 14: (12, 1.6, 0.6, 0.3)}  # step: (interval, 16ths, vel, gain)
SWING = S16 * 0.12
kick_times = []
nbar = 0
for bar_t in np.arange(s0, GROOVE_END - 1e-6, BAR):
    for step in range(16):
        ts = bar_t + step * S16
        if ts >= GROOVE_END - 1e-6:
            break
        if HELD[0] <= ts < HELD[1]:
            continue
        sw_ = SWING if step % 2 else 0.0
        if step in KICK:
            drums.add(ts, kick(KICK[step]), 0.75)
            kick_times.append(ts)
        if step in CLAP:
            drums.add(ts, clap(), 0.3)
            verb.add(ts, clap(), 0.12)
        # hats: eighths, accented off the beat; ghost sixteenths swung; an open hat closing every other bar
        if step % 2 == 0:
            open_ = step == 14 and nbar % 2 == 1
            drums.add(ts, hat(open_, 0.5), (0.26 if step % 4 == 2 else 0.15), pan=0.2)
        elif step in (3, 7, 11, 15):
            drums.add(ts + sw_, shaker(), 0.15, pan=-0.3)
        elif step in (5, 13):
            drums.add(ts + sw_, hat(False, 0.3), 0.08, pan=0.25)
        _, root = chord_at(ts)
        if step in BASS:
            iv, n16, vel, g = BASS[step]
            bass_bus.add(ts, bass(root + iv, S16 * n16, vel), g)
        # e-piano stabs on the and-of-one and the and-of-three
        if step in (2, 10):
            notes, _ = chord_at(ts)
            for j, m in enumerate(notes[1:4]):
                keys_bus.add(ts + 0.004 * j, epiano(m + 12, 0.5, 0.8), 0.22, pan=-0.25 + 0.25 * j)
    nbar += 1

# marimba arp on eighths, out of the way of the typing and the held breath
arp_pat = [0, 2, 4, 1, 3, 2, 4, 3]
for k, te in enumerate(np.arange(T["split"], GROOVE_END - 1e-6, BEAT / 2)):
    if T["typeStart"] - 0.1 <= te < T["send"] or HELD[0] - BEAT <= te < HELD[1]:
        continue
    notes, _ = chord_at(te)
    keys_bus.add(te, pluck(notes[arp_pat[k % 8]] + 12, 0.4, 3000, 9), 0.16, pan=0.35 if k % 2 else -0.35)

# ------------------------------------------------------------------ B/C sound design
# the crane: one tick per menu item, up the scale
scale = [74, 76, 78, 79, 81, 83, 85, 86]
for k, tn in C["nav"]:
    sfx.add(tn, over(blip(float(midi(scale[k] + 12)), 0.05, 70) * 0.7, tick(7000, 0.02, 0.4)), 0.2, pan=-0.35)
    verb.add(tn, blip(float(midi(scale[k] + 12)), 0.05, 70), 0.07, pan=-0.35)
sfx.add(T["crane"], whoosh(T["craneEnd"] - T["crane"], 500, 3000, 1.1, "late"), 0.18, pan=-0.2)
# "One platform."
t_pf = T["platform"] + 0.1
for j, m in enumerate([74, 81, 86]):
    sfx.add(t_pf + j * 0.012, bell(m + 12, 1.6, 1.6, 3.0, 2.8, 0.22), 0.4, pan=0.45)
verb.add(t_pf, bell(86, 1.6, 1.6, 3.0, 2.8, 0.22), 0.3)
drums.add(t_pf, crash(2.2, 0.2), 0.5)
# pull-out and the phone
sfx.add(T["pullOut"], whoosh(0.95, 5000, 450, 0.9, "bell"), 0.4)
sfx.add(T["phone"] - 0.1, pan_move(whoosh(0.4, 900, 4200, 1.2, "late"), 1.0, 0.5), 0.32)
sfx.add(T["phone"] + 0.25, thock(260, 0.1), 0.18, pan=0.5)
# push-in
sfx.add(T["pushIn"], whoosh(BEAT * 1.4, 350, 3800, 1.0, "late"), 0.38)
# typing: soft laptop keys, heavier on the space bar
for i, k in enumerate(C["typing"]):
    ch = k["ch"]
    if ch == " ":
        sfx.add(k["t"], over(thock(120, 0.05) * 0.8, tick(1800, 0.03, 0.5)), 0.12, pan=0.05)
    else:
        f = 3000 + 900 * rng.random()
        sfx.add(k["t"], tick(f, 0.018, 0.6 + 0.4 * rng.random()), 0.12, pan=0.05 + 0.08 * (rng.random() - 0.5))
# send
sfx.add(T["send"], whoosh(0.35, 700, 5200, 1.2, "late"), 0.3, pan=0.2)
sfx.add(T["send"] + 0.1, blip(float(midi(86)), 0.1, 30, fm=0.4), 0.22, pan=0.2)
# Ivy thinks: a small sparkle
for j, m in enumerate([93, 97, 100]):
    sfx.add(T["think"] + j * S16 / 2, bell(m, 0.6, 1.2, 2.0, 7.0, 0.2), 0.3, pan=-0.2 + 0.1 * j)
    verb.add(T["think"] + j * S16 / 2, bell(m, 0.6, 1.2, 2.0, 7.0, 0.2), 0.25)
# the plan builds, row by row
for j, (tr0, m) in enumerate(zip([T["plan"]] + T["rows"], [74, 78, 81, 86])):
    sfx.add(tr0, pluck(m + 12, 0.5, 4000, 10), 0.3, pan=0.15)
    sfx.add(tr0 - 0.2, whoosh(0.22, 1200, 3200, 1.6, "bell"), 0.06, pan=0.15)
for j in range(2):
    sfx.add(T["chips"] + j * S16, tick(5200, 0.015, 0.7), 0.16, pan=0.1)
# finger approaches, riser into the tap
sfx.add(T["finger"], whoosh(0.4, 600, 1600, 1.4, "bell"), 0.1, pan=0.4)
rd = T["tap"] - HELD[0]
trr = tt(rd)
riser = sweep(rng.standard_normal(len(trr)), 400, 6000, 1.0) * (trr / rd) ** 2.2
sfx.add(HELD[0], fades(riser, 0.05, 0.003), 0.28)

# THE TAP: press, success, Ivy's motif (D -> A)
tap = T["tap"]
sfx.add(tap - 0.01, over(thock(220, 0.1), tick(2400, 0.02, 0.8)), 0.6, pan=0.35)
for j, m in enumerate([86, 93]):
    sfx.add(tap + 0.03 + j * 0.13, bell(m, 1.6, 1.8, 3.5, 2.6, 0.3), 0.55, pan=0.3)
    verb.add(tap + 0.03 + j * 0.13, bell(m, 1.6, 1.8, 3.5, 2.6, 0.3), 0.45)
sp = shimmer(1.0, (98, 102, 105, 109, 110), seed=21, amp=0.14)
sfx.add(tap + 0.03, sp, 0.5, pan=0.35)
drums.add(tap, crash(2.4, 0.22), 0.55)
# the automation flies to Marketing, lands, switches on
fly_d = T["land"] - T["fly"]
sfx.add(T["fly"], pan_move(whoosh(fly_d + 0.1, 800, 3600, 1.1, "bell"), 0.4, -0.5), 0.36)
sfx.add(T["land"], thock(300, 0.08), 0.3, pan=-0.5)
sfx.add(T["land"] + 0.02, tick(4600, 0.02, 0.8), 0.18, pan=-0.5)
sfx.add(T["toggle"], tick(3800, 0.012, 1.0), 0.28, pan=-0.45)
sfx.add(T["toggle"] + 0.045, tick(5200, 0.012, 1.0), 0.22, pan=-0.45)
sfx.add(T["toggle"] + 0.05, blip(float(midi(98)), 0.08, 40), 0.18, pan=-0.45)
verb.add(T["toggle"] + 0.05, blip(float(midi(98)), 0.08, 40), 0.2)

# ================================================================== D: brand (G -> D)
morph, lock, zoom = T["morph"], T["lockup"], T["zoom"]
sfx.add(morph, whoosh(lock - morph + 0.02, 600, 5000, 1.0, "rise"), 0.4)
# icon lands: a round bloop, then the camera flies through it
bl_t = tt(0.3)
bloop = sine(260 + 700 * np.exp(-bl_t * 18), 0.3) * np.exp(-bl_t * 14)
sfx.add(lock, fades(bloop, 0.001, 0.02), 0.45)
verb.add(lock, fades(bloop, 0.001, 0.02), 0.25)
sfx.add(zoom - 0.05, whoosh(0.85, 350, 7000, 0.8, "late"), 0.5)
# through the icon on the chip's beat: impact and the bloom
sfx.add(T["chip"], impact(2.2, 31), 0.55)
drums.add(T["chip"], crash(2.8, 0.2), 0.6)
# the bloom: Gmaj9 under the one line, then home to Dmaj9 on the offer
g_t = T["chip"] - 0.02
keys_bus.add(g_t, pad([55, 59, 62, 66, 69, 74], T["trial"] - g_t + 0.25, cutoff=2600, attack=0.25, release=0.25, seed=31), 0.42)
bass_bus.add(g_t, fades(bass(31, T["trial"] - g_t, 0.9), 0.003, 0.15), 0.45)
for j, tw in enumerate(C["tagline"]):
    m = [67, 69, 71, 74, 76, 78, 79, 81, 83, 86][j % 10]
    keys_bus.add(tw, pluck(m + 12, 0.6, 3500, 7), 0.12, pan=-0.4 + 0.08 * j)
    verb.add(tw, pluck(m + 12, 0.6, 3500, 7), 0.08)
for tb in np.arange(T["chip"], T["trial"] - 1e-6, BEAT):
    drums.add(tb, kick(0.7), 0.45)
    drums.add(tb + BEAT / 2, hat(False, 0.4), 0.14, pan=0.2)
sfx.add(T["price"], tick(3600, 0.02, 0.8), 0.14)
for j, m in enumerate([74, 78, 81]):
    keys_bus.add(T["price"] + j * 0.02, epiano(m + 12, 0.8, 0.7), 0.18, pan=-0.2 + 0.2 * j)

# the offer: Dmaj9 home, the motif again, and a long tail
tr_t = T["trial"]
end_len = DUR - tr_t + 0.5
keys_bus.add(tr_t, pad([62, 66, 69, 73, 76, 81], end_len, cutoff=2800, attack=0.08, release=1.2, seed=41), 0.45)
bass_bus.add(tr_t, fades(bass(38, end_len - 0.3, 0.9), 0.003, 0.9), 0.45)
drums.add(tr_t, kick(0.9, 0.6), 0.6)
drums.add(tr_t, crash(2.6, 0.18), 0.5)
for j, m in enumerate([86, 93]):
    sfx.add(tr_t + 0.02 + j * 0.13, bell(m, 2.0, 1.8, 3.5, 2.0, 0.3), 0.6, pan=0.0)
    verb.add(tr_t + 0.02 + j * 0.13, bell(m, 2.0, 1.8, 3.5, 2.0, 0.3), 0.55)
sfx.add(T["url"], tick(4200, 0.02, 0.6), 0.1, pan=0.25)

# ================================================================== mix
L = len(drums.x)
tv = np.arange(L) / SR
# sidechain: pads, keys and bass duck from the kick
duck = np.ones(L)
for tk in kick_times:
    i = int(tk * SR)
    seg_t = tv[i:i + int(0.3 * SR)] - tk
    duck[i:i + len(seg_t)] = np.minimum(duck[i:i + len(seg_t)], 1 - 0.45 * np.exp(-seg_t / 0.06))
keys = keys_bus.x * duck[:, None]
bs = bass_bus.x * (0.4 + 0.6 * duck)[:, None]

# the morph closes a low-pass on the groove, then a beat of air as the icon lands
music = drums.x + keys + bs
i0, i1 = int(morph * SR), int(lock * SR)
closing = music[i0:i1]
cl = np.zeros_like(closing)
zi = np.zeros((2, 2))
blk = 256
for s in range(0, len(closing), blk):
    p = s / max(1, len(closing) - 1)
    bb, a = biquad("lp", 9000 * (350 / 9000) ** p, 0.9)
    for ch in range(2):
        cl[s:s + blk, ch], zi[:, ch] = signal.lfilter(bb, a, closing[s:s + blk, ch], zi=zi[:, ch])
music[i0:i1] = cl
gap0, gap1 = int(lock * SR), int(g_t * SR)
tail = music[gap0:gap1]
music[gap0:gap1] = tail * np.linspace(1, 0, len(tail))[:, None] ** 3

ir = make_ir()
wet = np.stack([signal.fftconvolve(verb.x[:, c], ir[:, c])[: L] for c in range(2)], 1)
mix = music * 0.9 + sfx.x * 1.0 + wet * 0.32
mix = mix[:N]
mix = hp(mix, 30, 2)

# glue: gentle RMS compression
env = np.sqrt(lp(np.mean(mix ** 2, axis=1), 10, 1).clip(1e-12))
thr = 10 ** (-17 / 20)
g = np.where(env > thr, (env / thr) ** (1 / 2.0 - 1), 1.0)
mix *= g[:, None]

# end fade in step with the picture
mix *= np.clip((DUR - np.arange(N) / SR) / 0.45, 0, 1)[:, None]

# loudness to -14 LUFS through a soft-knee ceiling at -1.2 dBFS (two passes so the limiter's loss is made up)
meter = pyln.Meter(SR)
lufs0 = meter.integrated_loudness(mix)
ceil = 10 ** (-1.2 / 20)
pre = pyln.normalize.loudness(mix, lufs0, -14.0)
gain = 1.0
for _ in range(4):
    mix = np.tanh(pre * gain / ceil * 0.97) * ceil
    gain *= 10 ** ((-14.0 - meter.integrated_loudness(mix)) / 20)
print(f"loudness {lufs0:.1f} LUFS -> {meter.integrated_loudness(mix):.2f} LUFS, peak {20 * np.log10(np.abs(mix).max()):.2f} dBFS")
sf.write("build/soundtrack.wav", mix.astype(np.float32), SR, subtype="PCM_24")
print("wrote build/soundtrack.wav", mix.shape[0] / SR, "s")
