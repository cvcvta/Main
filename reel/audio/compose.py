"""Original soundtrack + sound design for the CVCVTA.AI reel.

Everything is synthesized from scratch with numpy/scipy: no samples, no loops.
The music follows the edit (100 BPM, 50 beats = 30 s) and the sound design is
driven by the cue list exported from the timeline (out/timeline.json).

    python3 audio/compose.py out/timeline.json out/mix.wav
"""
import json
import sys
import wave

import numpy as np
from scipy import signal

SR = 48000
BPM = 100.0
BEAT = 60.0 / BPM
DUR = 30.0
N = int(DUR * SR)
RNG = np.random.default_rng(7)


def b2t(b):
    return b * BEAT


def S(t):
    return int(round(t * SR))


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def noise(n):
    return RNG.standard_normal(n)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
        'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def n2m(name):
    """'D4' -> midi number"""
    if name[1] in '#b':
        p, o = name[:2], int(name[2:])
    else:
        p, o = name[0], int(name[1:])
    return 12 * (o + 1) + NOTE[p]


# ----------------------------------------------------------------- filters
def sos_filter(x, kind, f, order=2, q=None):
    nyq = SR / 2
    if kind == 'bp':
        lo, hi = f
        sos = signal.butter(order, [max(lo, 10) / nyq, min(hi, nyq * 0.98) / nyq], btype='band', output='sos')
    else:
        sos = signal.butter(order, min(f, nyq * 0.98) / nyq, btype='low' if kind == 'lp' else 'high', output='sos')
    return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    return sos_filter(x, 'lp', f, order)


def hp(x, f, order=2):
    return sos_filter(x, 'hp', f, order)


def bp(x, lo, hi, order=2):
    return sos_filter(x, 'bp', (lo, hi), order)


def sweep_filter(x, kind, f_start, f_end, block=256, curve='exp', q_bw=0.6):
    """Time-varying filter by block processing with carried state."""
    out = np.zeros_like(x)
    nb = int(np.ceil(len(x) / block))
    zi = None
    for i in range(nb):
        u = i / max(1, nb - 1)
        f = f_start * (f_end / f_start) ** u if curve == 'exp' else f_start + (f_end - f_start) * u
        f = float(np.clip(f, 20, SR * 0.45))
        if kind == 'bp':
            sos = signal.butter(2, [max(20, f * (1 - q_bw / 2)) / (SR / 2), min(SR * 0.45, f * (1 + q_bw / 2)) / (SR / 2)], btype='band', output='sos')
        else:
            sos = signal.butter(2, f / (SR / 2), btype='low' if kind == 'lp' else 'high', output='sos')
        if zi is None or zi.shape[0] != sos.shape[0]:
            zi = signal.sosfilt_zi(sos) * 0
        seg = x[i * block:(i + 1) * block]
        y, zi = signal.sosfilt(sos, seg, zi=zi)
        out[i * block:(i + 1) * block] = y
    return out


def env_exp(n, rate):
    return np.exp(-np.arange(n) / SR * rate)


def adsr(n, a=0.005, d=0.1, s=0.7, r=0.2, hold=None):
    """Attack/decay/sustain then release over the last r seconds."""
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na, endpoint=False)
    nd = min(nd, n - na)
    e[na:na + nd] = np.linspace(1, s, nd, endpoint=False)
    if nr > 0 and n > nr:
        e[n - nr:] *= np.linspace(1, 0, nr)
    return e


def saw(freq, n, phase=0.0):
    """Band-limited-ish saw via additive synthesis (freq may be array)."""
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,)) if np.ndim(freq) else np.full(n, float(freq))
    ph = 2 * np.pi * np.cumsum(f) / SR + phase
    out = np.zeros(n)
    fmax = float(np.max(f))
    k_max = int(min(60, (SR / 2.2) / max(fmax, 1)))
    for k in range(1, k_max + 1):
        out += np.sin(k * ph) / k
    return out * (2 / np.pi)


def square(freq, n, duty=0.5):
    ph = (np.cumsum(np.full(n, float(freq))) / SR) % 1.0
    return np.where(ph < duty, 1.0, -1.0)


def sine(freq, n, phase=0.0):
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,)) if np.ndim(freq) else np.full(n, float(freq))
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)


def make_ir(dur=2.2, decay=3.2, lowpass=6500, seed=3, predelay=0.012):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    irs = []
    for ch in range(2):
        x = r.standard_normal(n) * np.exp(-t * decay)
        x = lp(x, lowpass)
        x[:int(predelay * SR)] = 0
        # a few early reflections
        for d, g in ((0.017, 0.5), (0.029, 0.35), (0.041, 0.25)):
            i = int((d + ch * 0.003) * SR)
            x[i] += g
        irs.append(x / np.sqrt(np.sum(x ** 2)))
    return irs


IR_BIG = make_ir(2.4, 2.6, 6000, 3)
IR_ROOM = make_ir(0.9, 6.0, 8000, 4)


def reverb(stereo, ir, mix=0.25):
    L = signal.fftconvolve(stereo[0], ir[0])[:stereo.shape[1]]
    R = signal.fftconvolve(stereo[1], ir[1])[:stereo.shape[1]]
    return np.stack([L, R]) * mix


# ----------------------------------------------------------------- mixing buses
class Bus:
    def __init__(self, n=N):
        self.x = np.zeros((2, n))

    def add(self, sig, t, gain=1.0, pan=0.0):
        """sig: mono (n,) or stereo (2, n); t in seconds; pan -1..1"""
        i0 = S(t)
        if i0 >= self.x.shape[1]:
            return
        if sig.ndim == 1:
            nf = min(len(sig) // 4, int(0.004 * SR))
            if nf > 1:
                sig = sig.copy()
                sig[-nf:] *= np.linspace(1, 0, nf)       # anti-click tail fade
            l = np.cos((pan + 1) * np.pi / 4)
            r = np.sin((pan + 1) * np.pi / 4)
            st = np.stack([sig * l, sig * r]) * np.sqrt(2)
        else:
            st = sig
        if i0 < 0:
            st = st[:, -i0:]
            i0 = 0
        n = min(st.shape[1], self.x.shape[1] - i0)
        self.x[:, i0:i0 + n] += st[:, :n] * gain


# ----------------------------------------------------------------- drum voices
def kick(punch=1.0, dur=0.55):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 46 + 118 * np.exp(-t * 32) + 40 * np.exp(-t * 180)
    body = sine(f, n) * np.exp(-t * 5.2)
    click = hp(noise(n) * np.exp(-t * 400), 1800) * 0.35
    x = np.tanh((body * 1.3 + click * punch) * 1.8)
    return x * 0.9


def snare(dur=0.35):
    n = int(dur * SR)
    t = np.arange(n) / SR
    tone = sine(185 * (1 + 0.3 * np.exp(-t * 60)), n) * np.exp(-t * 28) * 0.55
    tone += sine(330, n) * np.exp(-t * 40) * 0.25
    nz = bp(noise(n), 1500, 9000) * np.exp(-t * 16)
    return np.tanh((tone + nz * 0.9) * 1.4) * 0.8


def clap(dur=0.4):
    n = int(dur * SR)
    t = np.arange(n) / SR
    base = bp(noise(n), 900, 4200)
    e = np.zeros(n)
    for k, d in enumerate((0.0, 0.009, 0.019, 0.031)):
        i = int(d * SR)
        e[i:] += np.exp(-(t[:n - i]) * (230 if k < 3 else 20)) * (0.9 if k < 3 else 1.0)
    return base * e * 0.8


def hat(open_=False, dur=None):
    dur = dur or (0.45 if open_ else 0.07)
    n = int(dur * SR)
    t = np.arange(n) / SR
    # metallic: noise + detuned square cluster, high passed
    metal = sum(square(f, n) for f in (3120, 4780, 5930, 7310, 8440)) * 0.15
    x = hp(noise(n) * 0.8 + metal, 7200, 3)
    return x * np.exp(-t * (8 if open_ else 70)) * (0.5 if open_ else 0.55) * 0.35


def crash(dur=2.4):
    n = int(dur * SR)
    t = np.arange(n) / SR
    metal = sum(square(f, n) for f in (2310, 3650, 5120, 6790, 8120, 9600)) * 0.12
    x = hp(noise(n) + metal, 3800, 2)
    x = x * (np.exp(-t * 2.0) * 0.8 + np.exp(-t * 12) * 0.6)
    return x * 0.16


def sub_drop(dur=1.6, f0=95, f1=30):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 3.2)
    return np.tanh(sine(f, n) * np.exp(-t * 1.6) * 1.6) * 0.9


def reverse_swell(dur=0.8):
    c = crash(dur + 0.4)[:int(dur * SR)]
    c = c[::-1] * np.linspace(0, 1, len(c)) ** 2
    return c * 1.4


# ----------------------------------------------------------------- tonal voices
def bass808(freq, dur, glide_from=None, drive=1.7):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = np.full(n, freq)
    if glide_from:
        f = freq + (glide_from - freq) * np.exp(-t * 28)
    x = sine(f, n) * (np.exp(-t * 2.6) * 0.9 + 0.1 * np.exp(-t * 0.8))
    x = np.tanh(x * drive) / np.tanh(drive)
    x = lp(x, 900)
    rel = min(n, int(0.03 * SR))
    x[-rel:] *= np.linspace(1, 0, rel)
    return x * 0.8


def stab(notes, dur=0.5, bright=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for m in notes:
        f = midi(m)
        for det in (-0.12, 0.0, 0.11):
            x += saw(f * 2 ** (det / 12), n, phase=RNG.random() * 6)
    x /= len(notes) * 3
    cut = 700 + 5200 * bright * np.exp(-t * 9)
    y = np.zeros(n)
    # block-wise lowpass following the envelope
    blk = 256
    zi = None
    for i in range(0, n, blk):
        fc = float(np.clip(cut[i], 60, 20000))
        sos = signal.butter(2, fc / (SR / 2), output='sos')
        if zi is None:
            zi = signal.sosfilt_zi(sos) * 0
        y[i:i + blk], zi = signal.sosfilt(sos, x[i:i + blk], zi=zi)
    y = y * np.exp(-t * 4.5)
    return y / (np.max(np.abs(y)) + 1e-9) * 0.8


def pluck(m, dur=0.35):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = midi(m)
    x = saw(f, n) * 0.6 + square(f * 2, n, 0.3) * 0.12 + sine(f * 0.5, n) * 0.25
    y = sweep_filter(x, 'lp', 5200, 700, block=128) * np.exp(-t * 9)
    return y / (np.max(np.abs(y)) + 1e-9) * 0.8


def pad(notes, dur, attack=0.8, release=0.8, cutoff=1400):
    n = int(dur * SR)
    x = np.zeros(n)
    for m in notes:
        f = midi(m)
        for det in (-0.09, -0.03, 0.04, 0.1):
            x += saw(f * 2 ** (det / 12), n, phase=RNG.random() * 6)
    x = lp(x / (len(notes) * 4), cutoff, 2)
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.6
    return x * adsr(n, a=attack, d=0.3, s=0.85, r=release)


def delay_pingpong(mono, t_delay, fb=0.42, taps=5):
    n = len(mono) + int(t_delay * SR * (taps + 1))
    L = np.zeros(n)
    R = np.zeros(n)
    L[:len(mono)] += mono
    R[:len(mono)] += mono
    g = 1.0
    for k in range(1, taps + 1):
        g *= fb
        i = int(t_delay * SR * k)
        seg = lp(mono, 4000 - 500 * k) * g
        (L if k % 2 else R)[i:i + len(mono)] += seg
    return np.stack([L, R])


# ----------------------------------------------------------------- sound design
def sfx_whoosh(dur=0.45, f0=300, f1=5000, rev=False):
    n = int(dur * SR)
    x = sweep_filter(noise(n), 'bp', f0, f1, block=128, q_bw=0.9)
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.6
    x = x * e
    return (x[::-1] if rev else x) * 0.9


def sfx_tick(freq=3200, dur=0.03, g=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = bp(noise(n), freq * 0.7, freq * 1.4) * np.exp(-t * 320) + sine(freq * 0.5, n) * np.exp(-t * 500) * 0.4
    return x * 0.8 * g


def sfx_thock():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    return (sine(780 * (1 + 0.2 * np.exp(-t * 90)), n) * np.exp(-t * 55) * 0.8 + bp(noise(n), 800, 3000) * np.exp(-t * 200) * 0.4)


def sfx_thud():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    return np.tanh(sine(62 + 60 * np.exp(-t * 40), n) * np.exp(-t * 14) * 2) * 0.9


def sfx_pop():
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    return sine(300 + 1100 * np.exp(-t * 60), n) * np.exp(-t * 40) * 0.6


def sfx_snap():
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    return bp(noise(n), 1800, 6000) * np.exp(-t * 180) * 1.1


def sfx_click():
    out = np.zeros(int(0.04 * SR))
    a = sfx_tick(4200, 0.02)
    b = sfx_tick(2600, 0.02, 0.6)
    out[:len(a)] += a
    i = int(0.012 * SR)
    out[i:i + len(b)] += b
    return out


def sfx_type(dur):
    out = np.zeros(int(dur * SR) + int(0.05 * SR))
    t = 0.0
    while t < dur:
        k = sfx_tick(2200 + RNG.random() * 2200, 0.025, 0.35 + RNG.random() * 0.35)
        i = S(t)
        out[i:i + len(k)] += k
        t += 0.028 + RNG.random() * 0.03
    return out


def sfx_data(dur):
    out = np.zeros(int(dur * SR))
    t = 0.0
    while t < dur - 0.05:
        L = 0.015 + RNG.random() * 0.035
        n = int(L * SR)
        f = RNG.choice([880, 1320, 1760, 2640, 3520, 1175, 1568])
        x = square(f, n, 0.5) * np.exp(-np.arange(n) / SR * 30) * 0.12
        i = S(t)
        out[i:i + n] += x[:len(out) - i]
        t += L + RNG.random() * 0.02
    # bitcrush, then tame the aliasing edges so it reads digital, not harsh
    q = 12
    return lp(np.round(out * q) / q, 6000)


def sfx_glitch(dur=0.3):
    n = int(dur * SR)
    out = np.zeros(n)
    seg = bp(noise(int(0.02 * SR)), 600, 7000) * 0.5
    t = 0
    while t < n:
        rep = int(RNG.integers(2, 6))
        L = int(SR * (0.008 + RNG.random() * 0.03))
        chunk = (square(RNG.choice([180, 360, 720, 1440]), L, 0.4) * 0.3 + bp(noise(L), 300, 8000) * 0.4)
        for r in range(rep):
            j = t + r * L
            if j + L < n:
                out[j:j + L] += chunk * (0.9 ** r)
        t += rep * L + int(RNG.random() * 0.01 * SR)
    del seg
    return lp(np.round(out * 10) / 10, 8000) * 0.7


def sfx_riser(dur, f0=200, f1=9000, gain=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    nz = sweep_filter(noise(n), 'bp', f0, f1, block=256, q_bw=0.7)
    pitch = 110 * 2 ** (t / dur * 3)
    tone = saw(pitch, n) * 0.25
    tone = lp(tone, 3000)
    e = (t / dur) ** 2.2
    return (nz * 0.9 + tone) * e * gain * 0.45


def sfx_shimmer(dur):
    n = int(dur * SR)
    out = np.zeros(n + int(0.3 * SR))
    for k in range(int(dur * 40)):
        f = RNG.choice([2093, 2349, 2637, 3136, 3520, 4186])
        L = int(0.12 * SR)
        g = sine(f, L) * np.exp(-np.arange(L) / SR * 30) * 0.08
        i = int(RNG.random() * n)
        out[i:i + L] += g
    return out


def sfx_bell(f=1318.5, dur=1.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sum(sine(f * r, n) * np.exp(-t * d) * a for r, d, a in ((1, 3, 0.6), (2.76, 5, 0.25), (5.4, 8, 0.12), (8.93, 12, 0.05)))
    return x * 0.6


def sfx_glass(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for f, ph in ((1567.98, 0), (2093.0, 1), (2637.0, 2), (3136.0, 3)):
        mod = 1 + 0.004 * np.sin(2 * np.pi * (0.7 + ph * 0.3) * t)
        x += sine(f * mod, n) * (0.5 + 0.5 * np.sin(2 * np.pi * (0.5 + ph * 0.2) * t + ph)) * 0.08
    return x * np.minimum(1, t / 0.2) * np.minimum(1, (dur - t) / 0.3).clip(0)


def sfx_paper(dur=0.35):
    n = int(dur * SR)
    am = np.abs(lp(noise(n), 40)) * 3
    x = bp(noise(n), 1500, 9000) * am * np.sin(np.linspace(0, np.pi, n))
    return x * 0.5


def sfx_stone():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    return (sfx_thud()[:n] if len(sfx_thud()) >= n else np.pad(sfx_thud(), (0, n - len(sfx_thud())))) * 0.8 + lp(noise(n), 1200) * np.exp(-t * 9) * 0.25


def sfx_slap():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    return (lp(noise(n), 3500) * np.exp(-t * 90) * 1.0 + sine(140, n) * np.exp(-t * 40) * 0.5)


def sfx_shutter():
    a = sfx_tick(2500, 0.03) + 0
    out = np.zeros(int(0.15 * SR))
    out[:len(a)] += a
    out[int(0.06 * SR):int(0.06 * SR) + len(a)] += sfx_tick(1800, 0.03, 0.8)
    out += bp(noise(len(out)), 400, 3000) * np.exp(-np.arange(len(out)) / SR * 40) * 0.2
    return out


def sfx_draw(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = bp(noise(n), 2500, 7000) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * t) ** 2) * 0.25
    return x * np.sin(np.linspace(0, np.pi, n)) ** 0.5


def sfx_trace(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    steps = 440 * 2 ** (np.floor(t / dur * 8) / 12 * 2)
    x = square(1, n) * 0
    x = sine(steps, n) * 0.08 + square(steps.mean(), n, 0.2) * 0.02
    return x * np.minimum(1, t / 0.02) * np.minimum(1, (dur - t) / 0.05).clip(0)


def sfx_bits(dur):
    out = np.zeros(int(dur * SR))
    arp = [n2m(x) for x in ('D5', 'F5', 'A5', 'D6', 'A5', 'F5')]
    step = 0.05
    for k in range(int(dur / step)):
        L = int(step * SR)
        f = midi(arp[k % len(arp)])
        x = square(f, L, 0.25) * np.exp(-np.arange(L) / SR * 25) * 0.08
        i = S(k * step)
        out[i:i + L] += x[:len(out) - i]
    return out


def sfx_stamp():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    return np.tanh(sine(55 + 80 * np.exp(-t * 30), n) * np.exp(-t * 9) * 2.5) * 0.9 + lp(noise(n), 900) * np.exp(-t * 25) * 0.4


def sfx_ticks(dur):
    out = np.zeros(int(dur * SR) + 4000)
    t, gap = 0.0, 0.1
    while t < dur:
        k = sfx_tick(2800, 0.02, 0.7) + 0
        i = S(t)
        out[i:i + len(k)] += k
        t += gap
        gap = max(0.028, gap * 0.86)
    return out


def sfx_gen(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 300 * 2 ** (t / dur * 2.5)
    x = sine(f + 40 * np.sin(2 * np.pi * 18 * t), n) * 0.12 + sine(f * 1.5, n) * 0.05
    return x * np.minimum(1, t / 0.03)


# ----------------------------------------------------------------- composition
def compose(cues):
    music = Bus()
    drums = Bus()
    bass = Bus()
    sfx = Bus()
    kicks = []   # for sidechain

    # harmony: D minor. 2 beats per chord across 8-beat phrases.
    prog = [
        ('D', [n2m('D3'), n2m('F3'), n2m('A3'), n2m('E4')], n2m('D2')),
        ('Bb', [n2m('D3'), n2m('F3'), n2m('Bb3'), n2m('C4')], n2m('Bb1')),
        ('Gm', [n2m('D3'), n2m('G3'), n2m('Bb3'), n2m('F4')], n2m('G1')),
        ('A', [n2m('C#3'), n2m('E3'), n2m('A3'), n2m('E4')], n2m('A1')),
    ]

    def chord_at(beat):
        return prog[int((beat % 8) // 2)]

    # ---------- intro (b0 - b6): pad, heartbeat, filtered motif, riser
    pd = pad(prog[0][1], b2t(6.2), attack=1.2, release=0.4, cutoff=900)
    music.add(pd, 0, 0.1)
    for bb in (0, 2, 4):
        k = lp(kick(0.4), 400)
        drums.add(k, b2t(bb), 0.4)
    motif = [('A4', 0), ('D5', 0.5), ('F5', 1.0), ('E5', 1.5), ('D5', 2.0), ('A4', 3.0), ('C5', 3.5), ('D5', 4.0)]
    for nm, bb in motif:
        pl = lp(pluck(n2m(nm), 0.4), 1600)
        music.add(delay_pingpong(pl, BEAT * 0.75, 0.35, 4), b2t(bb), 0.09)
    sfx.add(sfx_riser(b2t(2.2), 150, 7000, 0.55), b2t(3.8), 1.0)
    sfx.add(reverse_swell(0.9), b2t(6) - 0.9, 0.7)
    # snare roll into the drop
    t_roll = b2t(5)
    for i in range(8):
        tr = t_roll + i * BEAT / 8
        drums.add(snare(0.12), tr, 0.18 + 0.06 * i, pan=(-0.2 if i % 2 else 0.2))

    # ---------- main grooves
    K1 = [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0]
    K2 = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0]
    K3 = [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0]

    def groove(b0, b1, variant=0, stop_last_half=True, bass_pat=None):
        """Drums + 808 + stabs + lead from beat b0 to b1 (8-beat phrases)."""
        st = BEAT / 4
        end_b = b1 - (0.5 if stop_last_half else 0)
        nbars = int(round((b1 - b0) / 4))
        for bar in range(nbars):
            pat = [K1, K2, K3][(bar + variant) % 3] if variant else (K1 if bar % 2 == 0 else K2)
            for s in range(16):
                beat = b0 + bar * 4 + s / 4
                if beat >= end_b:
                    continue
                t0 = b2t(beat)
                if pat[s]:
                    drums.add(kick(), t0, 1.0)
                    kicks.append(t0)
                    ch = chord_at(beat - b0)
                    nxt = [x for x in range(s + 1, 16) if pat[x]]
                    L = ((nxt[0] - s) if nxt else (16 - s)) * st
                    L = min(L, b2t(end_b) - t0)
                    root = ch[2] + (12 if (variant == 2 and s == 10) else 0)
                    bass.add(bass808(midi(root), max(0.1, L), glide_from=midi(root + 7) if s in (10, 11) else None), t0, 0.95)
                if s in (4, 12):
                    drums.add(clap(), t0, 0.8, pan=0.0)
                    drums.add(snare(), t0, 0.45)
                # hats: 16ths with accents, rolls at phrase ends
                vel = 0.55 if s % 4 == 0 else (0.38 if s % 2 == 0 else 0.26)
                pan = 0.25 if s % 2 else -0.15
                drums.add(hat(), t0, vel, pan=pan)
                if variant and bar % 2 == 1 and s in (13, 14, 15):
                    for r in range(1, 3):
                        tr = t0 + r * st / 3
                        if tr < b2t(end_b):
                            drums.add(hat(), tr, 0.22, pan=pan)
                if s == 14 and bar % 2 == 1:
                    drums.add(hat(True, 0.3), t0, 0.35, pan=0.3)
        # chord stabs on each chord change (every 2 beats) with an offbeat answer
        bb = b0
        while bb < end_b:
            ch = chord_at(bb - b0)
            s1 = stab([m + 12 for m in ch[1]], 0.45, 1.0)
            music.add(s1, b2t(bb), 0.30, pan=-0.1)
            if bb + 1.5 < end_b and variant:
                music.add(stab([m + 12 for m in ch[1][1:]], 0.25, 0.6), b2t(bb + 1.5), 0.16, pan=0.2)
            bb += 2
        # lead hook
        hook = [('A4', 0.0), ('D5', 0.5), ('F5', 1.0), ('A5', 1.5), ('G5', 2.25), ('F5', 2.75), ('D5', 3.5),
                ('E5', 4.0), ('F5', 4.5), ('G5', 5.0), ('A5', 5.5), ('C#6', 6.0), ('A5', 6.5), ('E5', 7.0)]
        for nm, off in hook:
            beat = b0 + off
            if beat >= end_b - 0.05:
                continue
            pl = pluck(n2m(nm) + (12 if variant == 3 else 0), 0.32)
            music.add(delay_pingpong(pl, BEAT * 0.75, 0.38, 4), b2t(beat), 0.2)

    def drop(b):
        t0 = b2t(b)
        drums.add(crash(), t0, 0.55, pan=0.15)
        drums.add(sub_drop(1.2, 110, 38), t0, 0.5)
        sfx.add(sfx_whoosh(0.35, 6000, 400), t0, 0.25)

    drop(6)
    groove(6, 14, variant=0)
    drop(14)
    groove(14, 22, variant=1)
    drop(22)
    groove(22, 30, variant=2)
    drop(30)
    groove(30, 38, variant=3)
    # stop-down swells (reverse swell into each drop)
    for bdrop in (14, 22, 30, 38):
        sfx.add(reverse_swell(0.3), b2t(bdrop) - 0.3, 0.55)

    # ---------- breakdown + build (b38 - b43)
    drums.add(crash(1.6), b2t(38), 0.45)
    drums.add(kick(), b2t(38), 1.0); kicks.append(b2t(38))
    bass.add(bass808(midi(n2m('D2')), b2t(1.5)), b2t(38), 0.9)
    music.add(pad(prog[1][1], b2t(1.5), attack=0.05, release=0.3, cutoff=2500), b2t(38), 0.25)
    for s in range(6):
        drums.add(hat(), b2t(38 + s * 0.25), 0.3)
    # build: kick 4-on-floor, accelerating snare, riser, rising pad
    b_build0, b_build1 = 39.5, 43
    for bb in np.arange(b_build0, b_build1, 1.0):
        drums.add(kick(0.8), b2t(bb), 0.85); kicks.append(b2t(bb))
    roll = []
    bb = b_build0
    while bb < b_build1 - 0.01:
        prog_u = (bb - b_build0) / (b_build1 - b_build0)
        roll.append((bb, prog_u))
        bb += 0.5 if prog_u < 0.34 else (0.25 if prog_u < 0.6 else (0.125 if prog_u < 0.85 else 0.0625))
    for bb, u in roll:
        drums.add(snare(0.14), b2t(bb), 0.2 + 0.5 * u, pan=(0.15 if int(bb * 16) % 2 else -0.15))
    sfx.add(sfx_riser(b2t(b_build1 - b_build0), 200, 11000, 0.9), b2t(b_build0), 0.9)
    pitch_rise = pad([n2m('A3'), n2m('E4'), n2m('A4')], b2t(b_build1 - b_build0), attack=1.6, release=0.05, cutoff=3000)
    music.add(pitch_rise, b2t(b_build0), 0.22)
    bass.add(bass808(midi(n2m('A1')), b2t(b_build1 - b_build0), drive=3.0), b2t(b_build0), 0.55)

    # ---------- silence with ticking (b43 - b44), reverse swell into the final hit
    sfx.add(reverse_swell(0.55), b2t(44) - 0.55, 0.9)

    # ---------- FINAL (b44): impact + outro under the end card
    t44 = b2t(44)
    drums.add(kick(1.2), t44, 1.1); kicks.append(t44)
    drums.add(crash(3.0), t44, 0.75)
    drums.add(sub_drop(2.4, 120, 30), t44, 0.9)
    drums.add(clap(), t44, 0.7)
    final_chord = [n2m('D3'), n2m('A3'), n2m('D4'), n2m('F4'), n2m('A4'), n2m('E5')]
    music.add(pad(final_chord, 3.4, attack=0.02, release=1.4, cutoff=3200), t44, 0.3)
    music.add(stab([m + 12 for m in final_chord[:4]], 0.8, 1.2), t44, 0.35)
    bass.add(bass808(midi(n2m('D2')), 2.0), t44, 0.9)
    # logo sting: rising pluck arp as the lockup forms (end card local 0.4 - 1.2)
    for k, nm in enumerate(('D5', 'F5', 'A5', 'D6', 'E6', 'A6')):
        pl = pluck(n2m(nm), 0.5)
        music.add(delay_pingpong(pl, BEAT * 0.5, 0.35, 5), t44 + 0.42 + k * BEAT / 4, 0.18)
    # light groove under the end card: kick + hats for 4 beats, then sign-off
    for bb in (45, 46, 47):
        drums.add(lp(kick(0.6), 1200), b2t(bb), 0.55); kicks.append(b2t(bb))
        for s in range(4):
            drums.add(hat(), b2t(bb + s * 0.25), 0.22 if s % 2 else 0.32, pan=0.2 if s % 2 else -0.1)
    t48 = b2t(48)
    drums.add(kick(1.0), t48, 0.9); kicks.append(t48)
    drums.add(crash(1.8), t48, 0.35)
    music.add(sfx_bell(1174.66, 1.6), t48, 0.25)
    music.add(sfx_bell(1760.0, 1.4), t48 + 0.02, 0.12)
    drums.add(lp(kick(0.5), 900), b2t(49), 0.6); kicks.append(b2t(49))
    music.add(pluck(n2m('D6'), 0.6), b2t(49), 0.15)

    # ---------- sound design from the cue list
    for c in cues:
        s, t0, v, d = c['s'], c['t'], c.get('v', 1.0), c.get('d', 0.3)
        pan = float(RNG.uniform(-0.35, 0.35))
        if s == 'whoosh':
            sfx.add(sfx_whoosh(0.5, 250, 6000), t0, 0.35 * v, pan)
        elif s == 'swish':
            sfx.add(sfx_whoosh(0.22, 800, 9000), t0, 0.22 * v, pan)
        elif s == 'whip':
            sfx.add(sfx_whoosh(0.3, 400, 10000), t0 - 0.05, 0.4 * v, pan)
        elif s == 'swing':
            sfx.add(sfx_whoosh(0.35, 300, 2500), t0, 0.2 * v, pan)
        elif s == 'tick':
            sfx.add(sfx_tick(3000 + RNG.random() * 1500), t0, 0.35 * v, pan)
        elif s == 'click':
            sfx.add(sfx_click(), t0, 0.4 * v, pan)
        elif s == 'thock':
            sfx.add(sfx_thock(), t0, 0.35 * v, pan)
        elif s == 'thud':
            sfx.add(sfx_thud(), t0, 0.5 * v)
        elif s == 'pop':
            sfx.add(sfx_pop(), t0, 0.35 * v, pan)
        elif s == 'snap':
            sfx.add(sfx_snap(), t0, 0.35 * v, pan)
        elif s == 'zoom':
            sfx.add(sfx_whoosh(0.22, 600, 12000), t0, 0.35 * v)
        elif s == 'type':
            sfx.add(sfx_type(d), t0, 0.5 * v, 0.1)
        elif s == 'data':
            sfx.add(sfx_data(d), t0, 0.5 * v, -0.1)
        elif s == 'glitch':
            sfx.add(sfx_glitch(max(0.2, d)), t0, 0.45 * v)
        elif s == 'flip':
            sfx.add(sfx_whoosh(0.3, 1200, 7000), t0, 0.3 * v)
            sfx.add(sfx_tick(2400), t0 + 0.26, 0.3)
        elif s == 'stone':
            sfx.add(sfx_stone(), t0, 0.45 * v)
        elif s == 'paper':
            sfx.add(sfx_paper(), t0, 0.35 * v, pan)
        elif s == 'send':
            sfx.add(sfx_pop(), t0, 0.35 * v)
        elif s == 'shimmer':
            sfx.add(sfx_shimmer(d), t0, 0.35 * v, pan)
        elif s == 'stream':
            ty = sfx_type(d)
            sh = sfx_shimmer(d)
            m = np.zeros(max(len(ty), len(sh)))
            m[:len(ty)] += ty * 0.4
            m[:len(sh)] += sh
            sfx.add(m, t0, 0.35 * v)
        elif s == 'gen':
            sfx.add(sfx_gen(d), t0, 0.35 * v)
        elif s == 'ding':
            sfx.add(sfx_bell(1568, 1.0), t0, 0.25 * v)
        elif s == 'glass':
            sfx.add(sfx_glass(d), t0, 0.5 * v)
        elif s == 'slap':
            sfx.add(sfx_slap(), t0, 0.5 * v, pan)
        elif s == 'sweep':
            sfx.add(sfx_whoosh(d + 0.1, 500, 8000), t0, 0.25 * v)
        elif s == 'shutter':
            sfx.add(sfx_shutter(), t0, 0.45 * v)
        elif s == 'draw':
            sfx.add(sfx_draw(d), t0, 0.35 * v, pan)
        elif s == 'trace':
            sfx.add(sfx_trace(d), t0, 0.45 * v)
        elif s == 'stamp':
            sfx.add(sfx_stamp(), t0, 0.6 * v)
        elif s == 'bits':
            sfx.add(sfx_bits(d), t0, 0.45 * v)
        elif s == 'ticks':
            sfx.add(sfx_ticks(d), t0, 0.35 * v)
        elif s in ('hit', 'final', 'silence'):
            pass  # handled by the music (drops / final impact / stops)

    return music, drums, bass, sfx, kicks


def sidechain_env(kicks, depth=0.55, rel=7.0):
    e = np.ones(N)
    t = np.arange(N) / SR
    for tk in kicks:
        i0 = S(tk)
        L = min(N - i0, int(0.5 * SR))
        if L <= 0:
            continue
        seg = 1 - depth * np.exp(-t[:L] * rel)
        e[i0:i0 + L] = np.minimum(e[i0:i0 + L], seg)
    return e


def gate_stops(x, stops, fade=0.006):
    """Hard mute windows [(t0, t1)] with short fades (stop-downs)."""
    g = np.ones(x.shape[1])
    nf = int(fade * SR)
    for t0, t1 in stops:
        a, b = S(t0), S(t1)
        g[a:b] = 0
        g[max(0, a - nf):a] = np.minimum(g[max(0, a - nf):a], np.linspace(1, 0, a - max(0, a - nf)))
        g[b:b + nf] = np.minimum(g[b:b + nf], np.linspace(0, 1, len(g[b:b + nf])))
    return x * g


def limiter(x, ceiling=0.89, look=0.004, release=0.08):
    peak = np.max(np.abs(x), axis=0)
    w = int(look * SR)
    # running max over the lookahead window
    from scipy.ndimage import maximum_filter1d
    pk = maximum_filter1d(peak, size=2 * w + 1)
    gain = np.minimum(1.0, ceiling / np.maximum(pk, 1e-9))
    # smooth release (one-pole on the gain, attack instant)
    a = np.exp(-1.0 / (release * SR))
    g = gain.copy()
    for i in range(1, len(g)):
        g[i] = min(gain[i], a * g[i - 1] + (1 - a) * gain[i])
    return x * g


def main():
    tl = json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'out/timeline.json'))
    out = sys.argv[2] if len(sys.argv) > 2 else 'out/mix.wav'
    music, drums, bass, sfx, kicks = compose(tl['cues'])
    sc = sidechain_env(kicks)
    music.x *= sc
    bass.x *= sidechain_env(kicks, 0.35, 10)
    # reverbs
    music_wet = reverb(music.x, IR_BIG, 0.22)
    drums_wet = reverb(drums.x * np.array([[1], [1]]), IR_ROOM, 0.12)
    sfx_wet = reverb(sfx.x, IR_BIG, 0.18)
    mus = music.x + music_wet
    drm = drums.x + drums_wet
    # stop-downs: silence the music (not the SFX) for the half beat before each drop
    stops = [(b2t(13.5), b2t(14)), (b2t(21.5), b2t(22)), (b2t(29.5), b2t(30)), (b2t(37.5), b2t(38)), (b2t(43), b2t(44))]
    mus = gate_stops(mus, stops)
    drm = gate_stops(drm, stops)
    bs = gate_stops(bass.x, stops)
    # gain staging: bring each bus to a target RMS measured over a groove window
    def rms_db(x, a=4.0, b=8.0):
        seg = x[:, int(a * SR):int(b * SR)]
        return 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9)
    targets = {'drm': -13.0, 'bs': -17.5, 'mus': -18.0}
    g_drm = 10 ** ((targets['drm'] - rms_db(drm)) / 20)
    g_bs = 10 ** ((targets['bs'] - rms_db(bs)) / 20)
    g_mus = 10 ** ((targets['mus'] - rms_db(mus)) / 20)
    print(f'bus gains: drums {20*np.log10(g_drm):+.1f} dB, bass {20*np.log10(g_bs):+.1f} dB, music {20*np.log10(g_mus):+.1f} dB')
    fx = sfx.x + sfx_wet
    mix = mus * g_mus + drm * g_drm + bs * g_bs + fx * 0.8
    # master: low cut, drive into a soft clipper, then a peak limiter at -1 dBFS
    mix = np.stack([hp(mix[0], 28), hp(mix[1], 28)])
    mix = mix / (np.percentile(np.abs(mix), 99.95) + 1e-9) * 1.05
    mix = np.tanh(mix * 1.35) / np.tanh(1.35)
    mix = limiter(mix, 0.89)
    # final fade on the last 0.25 s
    nf = int(0.25 * SR)
    mix[:, -nf:] *= np.linspace(1, 0, nf) ** 1.5
    peak = np.max(np.abs(mix))
    rms = np.sqrt(np.mean(mix ** 2))
    print(f'peak {20 * np.log10(peak):.2f} dBFS, rms {20 * np.log10(rms):.2f} dBFS, kicks {len(kicks)}')
    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16).T.copy()
    with wave.open(out, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print('wrote', out, f'{pcm.shape[0] / SR:.2f}s')


if __name__ == '__main__':
    main()
