#!/usr/bin/env python3
"""Soundtrack for the personaos "Meet Mo" reel.

An original, bright 120 BPM pop groove in C major: a marimba hook (Mo's motif),
piano-house chord stabs, bouncy octave bass, claps and shakers. The drops land when
Mo arrives (4 s), when the pricing sheet slides up (24 s) and on the closing card
(28 s). Sound effects are placed from out/sfx.json, which render.mjs exports from
reel.html, so every hop, check and ding lands on its visual.

    python3 music.py            -> out/audio.wav (48 kHz stereo, 24-bit, unmastered)
"""
import json
import os
import wave

import numpy as np
from scipy import signal

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'out')
SR = 48000
DUR = 34.0
N = int(SR * DUR)
BEAT = 0.5                       # 120 BPM
BAR = 4 * BEAT
rng = np.random.default_rng(20260927)


# ---------------------------------------------------------------- utilities
def secs(n):
    return np.arange(n) / SR


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def sos(kind, f, order=2):
    return signal.butter(order, f, btype=kind, fs=SR, output='sos')


def filt(x, kind, f, order=2):
    return signal.sosfilt(sos(kind, f, order), x, axis=-1)


def noise(n):
    return rng.standard_normal(n)


def stereo(x, pan=0.0):
    """Constant-power pan of a mono signal; pan -1 (left) … 1 (right)."""
    a = (pan + 1) * np.pi / 4
    return np.vstack([x * np.cos(a), x * np.sin(a)]) * np.sqrt(2)


def mix(dst, x, t, gain=1.0, pan=0.0):
    """Add x (mono or stereo) into the stereo bus dst starting at t seconds."""
    if x.ndim == 1:
        x = stereo(x, pan)
    i = int(round(t * SR))
    a, b = max(0, i), min(N, i + x.shape[1])
    if b > a:
        dst[:, a:b] += gain * x[:, a - i:b - i]


def env(n, a=0.005, tau=None, r=None):
    """Linear attack, then exponential decay (tau) and/or a linear release over the last r seconds."""
    t = secs(n)
    e = np.minimum(1.0, t / max(a, 1e-4))
    if tau is not None:
        e = e * np.exp(-np.maximum(0, t - a) / tau)
    if r is not None:
        e = e * np.clip((n / SR - t) / r, 0, 1)
    return e


def ramp(times, values):
    """Piecewise-linear automation curve over the whole track."""
    return np.interp(secs(N), times, values)


def active(t, spans):
    return any(a <= t < b for a, b in spans)


def saw_voice(freq, n, cutoff, phase=0.0):
    """Band-limited saw built from harmonics, with a smooth 4th-order low-pass roll-off."""
    t = secs(n)
    out = np.zeros(n)
    h = 1
    while h * freq < min(cutoff * 2.5, 16000):
        out += (1 / h) / np.sqrt(1 + (h * freq / cutoff) ** 8) * np.sin(2 * np.pi * h * freq * t + phase * h)
        h += 1
    return out


def sweep(f0, f1, dur, curve=3.0):
    """Sine whose pitch glides exponentially from f0 to f1."""
    n = int(dur * SR)
    u = secs(n) / dur
    f = f0 * (f1 / f0) ** (u ** (1 / curve) if f1 > f0 else u)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


# ------------------------------------------------------------ arrangement
PROG = ['C', 'G', 'Am', 'F'] * 4 + ['Cend']          # one chord per 2 s bar, 17 bars
CH = {
    'C':    dict(pad=[64, 67, 71, 74], bass=36),
    'G':    dict(pad=[62, 67, 69, 71], bass=31),
    'Am':   dict(pad=[60, 64, 67, 69], bass=33),
    'F':    dict(pad=[60, 64, 65, 69], bass=29),
    'Cend': dict(pad=[60, 64, 67, 72, 76], bass=36),
}
# Mo's motif: (beat within the bar, midi note)
MOTIF = {
    'C':  [(0, 79), (.5, 76), (1, 79), (1.5, 81), (2, 79), (2.75, 76), (3, 74), (3.5, 72)],
    'G':  [(0, 74), (.5, 71), (1, 74), (1.5, 76), (2, 74), (3, 79)],
    'Am': [(0, 72), (.5, 76), (1, 81), (1.5, 79), (2, 76), (2.75, 72), (3, 74), (3.5, 76)],
    'F':  [(0, 81), (.5, 79), (1, 76), (1.5, 72), (2, 74), (3, 72)],
}
MARIMBA_BARS = [0, 1, 2, 3, 6, 7, 12, 13, 14, 15]
KICK_SOFT = [(2.0, 4.0)]
KICK = [(4.0, 19.5), (20.0, 23.5), (24.0, 27.5), (28.0, 32.0)]
CLAP = [(2.0, 19.5), (20.0, 23.0), (24.0, 27.5), (28.0, 32.0)]
SHAKER = [(0.0, 23.5), (24.0, 32.0)]
OPENHAT = [(4.0, 19.5), (24.0, 27.5), (28.0, 32.0)]
BASS = [(4.0, 23.75), (24.0, 27.75), (28.0, 32.0)]
STABS = [(0.0, 19.5), (24.0, 32.0)]
ARP = [(8.0, 12.0), (19.5, 23.5)]
DROPS = [4.0, 24.0, 28.0]
FINAL = 32.0


def kick_times():
    ts = []
    for k in range(int(FINAL / BEAT)):
        t = k * BEAT
        if active(t, KICK):
            ts.append((t, 1.0))
        elif active(t, KICK_SOFT):
            ts.append((t, .35 + .35 * (t - 2.0) / 2.0))
    return ts + [(FINAL, 1.2)]


def sidechain(kicks, depth=.5, tau=.12):
    t = secs(N)
    dip = np.zeros(N)
    for k, g in kicks:
        i = int(k * SR)
        n = min(N - i, int(.5 * SR))
        dt = t[:n]
        dip[i:i + n] = np.maximum(dip[i:i + n], depth * min(g, 1) * np.exp(-dt / tau) * (1 - np.exp(-dt / .004)))
    return 1 - dip


# ------------------------------------------------------------ instruments
def kick(g=1.0):
    n = int(.42 * SR)
    t = secs(n)
    f = 46 + 125 * np.exp(-t / .026) + 28 * np.exp(-t / .1)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .002, tau=.2)
    knock = np.sin(2 * np.pi * 190 * t) * np.exp(-t / .022) * .45
    click = filt(noise(n), 'bandpass', [2500, 7500]) * np.exp(-t / .003) * .5
    return np.tanh(1.5 * (body + knock + click)) * g


def clap():
    n = int(.36 * SR)
    t = secs(n)
    x = filt(noise(n), 'bandpass', [1000, 4200])
    e = np.zeros(n)
    for k, off in enumerate([0, .008, .016]):
        e += (t >= off) * np.exp(-np.maximum(0, t - off) / (.005 if k < 2 else .11))
    return x * e * .75


def hat(open_=False):
    n = int((.3 if open_ else .05) * SR)
    x = filt(noise(n), 'highpass', 7000, 4)
    return x * env(n, .001, tau=.1 if open_ else .014)


def shaker():
    n = int(.07 * SR)
    x = filt(noise(n), 'bandpass', [5500, 11000])
    return x * env(n, .006, tau=.02)


def snare():
    n = int(.22 * SR)
    t = secs(n)
    tone = np.sin(2 * np.pi * 200 * t) * np.exp(-t / .045)
    return (filt(noise(n), 'bandpass', [1300, 7500]) * np.exp(-t / .06) + .6 * tone) * .6


def bass_note(m, dur, g=1.0, tau=.2):
    n = int(dur * SR)
    f = mtof(m)
    t = secs(n)
    x = np.sin(2 * np.pi * f * t) + .6 * saw_voice(f * 2, n, 800) + .25 * saw_voice(f * 2 * 1.004, n, 1300)
    return np.tanh(1.2 * x) * env(n, .004, tau=tau) * np.clip((dur - t) / .02, 0, 1) * g


def marimba(m, g=1.0):
    n = int(.9 * SR)
    t = secs(n)
    f = mtof(m)
    x = (np.sin(2 * np.pi * f * t) * np.exp(-t / .42)
         + .32 * np.sin(2 * np.pi * f * 3.99 * t) * np.exp(-t / .06)
         + .08 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t / .018))
    mallet = filt(noise(n), 'bandpass', [1500, 5000]) * np.exp(-t / .0025) * .25
    return (x + mallet) * env(n, .002) * g


def stab(notes, g=1.0, cutoff=5000, dur=.34):
    """Short piano-house chord: decaying harmonics per note."""
    n = int(dur * SR)
    t = secs(n)
    out = np.zeros(n)
    for m in notes:
        f = mtof(m)
        for h in range(1, 8):
            if h * f > cutoff * 1.5:
                break
            amp = (1 / h ** 1.25) / np.sqrt(1 + (h * f / cutoff) ** 4)
            out += amp * np.sin(2 * np.pi * h * f * (1 + .0015 * (h - 1)) * t) * np.exp(-t / (.32 / h ** .6))
    return out * env(n, .003, r=.05) / len(notes) * g


def pluck(m, g=1.0):
    n = int(.36 * SR)
    t = secs(n)
    f = mtof(m)
    x = np.zeros(n)
    for h in range(1, 12):
        if h * f > 14000:
            break
        x += (1 / h) * np.sin(2 * np.pi * h * f * t) * np.exp(-t * (8 + 3.4 * h))
    return x * env(n, .002) * g


def pad_chord(notes, dur, cutoff, seed):
    n = int((dur + .8) * SR)
    t = secs(n)
    out = np.zeros((2, n))
    phases = np.random.default_rng(seed).uniform(0, 2 * np.pi, (len(notes), 3))
    for j, m in enumerate(notes):
        f = mtof(m)
        for v, (det, pan) in enumerate(((-8, -.6), (0, 0), (8, .6))):
            out += stereo(saw_voice(f * 2 ** (det / 1200), n, cutoff, phase=phases[j, v]), pan) * .33
    e = np.minimum(1, t / .3) * np.clip((dur + .8 - t) / .8, 0, 1)
    return out * e / len(notes)


def riser(dur, g=1.0):
    n = int(dur * SR)
    t = secs(n) / dur
    x = noise(n)
    out = np.zeros(n)
    edges = np.linspace(0, n, 17).astype(int)
    zi = None
    for k in range(16):                                   # band-pass that climbs in 16 steps
        fc = 400 * 2 ** (k / 16 * 4.6)
        s = sos('bandpass', [fc * .7, min(fc * 1.5, 20000)])
        if zi is None:
            zi = signal.sosfilt_zi(s) * 0
        out[edges[k]:edges[k + 1]], zi = signal.sosfilt(s, x[edges[k]:edges[k + 1]], zi=zi)
    return (out * 1.4 + .12 * sweep(300, 1800, dur)) * t ** 2.2 * g


def crash(g=1.0):
    n = int(2.2 * SR)
    return filt(noise(n), 'highpass', 4500, 2) * env(n, .002, tau=.7) * g


def boom(g=1.0, dur=1.4):
    n = int(dur * SR)
    t = secs(n)
    f = 34 + 60 * np.exp(-t / .09)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .5)
    body = filt(noise(n), 'lowpass', 900) * np.exp(-t / .1) * .7
    return np.tanh(1.4 * (sub + body)) * g


def whoosh(dur=.45, g=1.0):
    n = int(dur * SR)
    t = secs(n) / dur
    x = noise(n)
    mono = (filt(x, 'bandpass', [300, 1400]) * (1 - t) + filt(x, 'bandpass', [1400, 7000]) * t) * np.sin(np.pi * t) ** 2
    return np.vstack([mono * (1 - .6 * t), mono * (.4 + .6 * t)]) * g


def bell(m, g=1.0, dur=1.2):
    n = int(dur * SR)
    t = secs(n)
    f = mtof(m)
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d) for r, a, d in ((1, 1, .5), (2.01, .35, .25), (3.98, .18, .12), (5.4, .08, .06)))
    return x * env(n, .002) * g


def pop(p=1.0, g=1.0):
    n = int(.12 * SR)
    t = secs(n)
    f = 520 * p * (1 + .9 * np.exp(-t / .012))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .0015, tau=.035) * g


def tick(g=1.0):
    n = int(.03 * SR)
    t = secs(n)
    return (filt(noise(n), 'bandpass', [2500, 6000]) * np.exp(-t / .003) + .4 * np.sin(2 * np.pi * 2300 * t) * np.exp(-t / .006)) * g


def boing(p=1.0, g=1.0):
    """Cartoon hop: quick upward glide with a little wobble."""
    n = int(.16 * SR)
    t = secs(n)
    f = (260 + 420 * (1 - np.exp(-t / .045))) * p * (1 + .04 * np.sin(2 * np.pi * 38 * t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .004, tau=.05) * g


def bubble(g=1.0):
    """Mo's arrival: a round bubbly 'bloop' plus a small splash of sparkle."""
    n = int(.5 * SR)
    t = secs(n)
    f = 170 * (7 ** (1 - np.exp(-t / .06)))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .006, tau=.09)
    sub = np.sin(2 * np.pi * np.cumsum(90 + 60 * np.exp(-t / .05)) / SR) * env(n, .004, tau=.12) * .6
    return (body + sub) * g


def thunk(g=1.0):
    n = int(.08 * SR)
    t = secs(n)
    return np.sin(2 * np.pi * 150 * t) * np.exp(-t / .02) * g


def scroll_zip(dur=.4, g=1.0):
    n = int(dur * SR)
    u = secs(n) / dur
    lo = filt(noise(n), 'bandpass', [800, 2500])
    hi = filt(noise(n), 'bandpass', [2500, 8000])
    return (lo * (1 - u) + hi * u) * np.sin(np.pi * u) ** 1.5 * g


# ------------------------------------------------------------ effects
def reverb_ir(rt60=1.8, n_sec=2.4, bright=6000):
    n = int(n_sec * SR)
    t = secs(n)
    ir = np.zeros((2, n))
    for c in range(2):
        tail = rng.standard_normal(n) * np.exp(-6.91 * t / rt60)
        mixw = np.exp(-t / .35)
        ir[c] = filt(tail, 'lowpass', bright) * mixw + filt(tail, 'lowpass', 1800) * (1 - mixw)
        ir[c, :int(.012 * SR)] = 0                                          # pre-delay
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def apply_reverb(bus, ir):
    return np.vstack([signal.fftconvolve(bus[c], ir[c])[:N] for c in range(2)])


def pingpong(bus, d=.375, fb=.36, n_echo=5):
    x = bus.mean(0)
    out = np.zeros_like(bus)
    for k in range(1, n_echo + 1):
        x = filt(x, 'lowpass', 5200) * fb
        s = int(k * d * SR)
        out[k % 2, s:] += x[:N - s]
    return out


# ------------------------------------------------------------ build
def build():
    music = np.zeros((2, N))
    pads = np.zeros((2, N))
    pads_hi = np.zeros((2, N))
    lead = np.zeros((2, N))
    verb = np.zeros((2, N))
    fx = np.zeros((2, N))

    kicks = kick_times()
    duck = sidechain(kicks)

    # drums
    for t, g in kicks:
        mix(music, kick(g), t, .8)
    for b in range(17):
        for beat in range(4):
            t = b * BAR + beat * BEAT
            if beat in (1, 3) and active(t, CLAP):
                c = clap()
                mix(music, c, t, .8 if t >= 4 else .55)
                mix(verb, c, t, .3)
            if active(t + .25, OPENHAT):
                mix(music, hat(True), t + .25, .2, .25)
            for s in range(4):
                ts = t + s * .125
                if active(ts, SHAKER):
                    mix(music, shaker(), ts, (.18 if s % 2 else .1) * (1.2 if ts >= 4 else .9), (-.35, .35)[s % 2])
    for k in range(24):                                   # snare roll into the pricing drop
        t = 23.0 + (k * .0625 if k < 8 else .5 + (k - 8) * .03125)
        mix(music, snare(), t, .08 + .3 * (k / 24) ** 2)
        mix(verb, snare(), t, .05)

    # bass: root on the beat, octave on the off-beat
    for b, name in enumerate(PROG[:16]):
        root = CH[name]['bass']
        for e in range(8):
            t = b * BAR + e * .25
            if active(t, BASS):
                mix(music, bass_note(root + (12 if e % 2 else 0), .23, .85 if e % 2 else 1.0), t, .36)
    mix(music, bass_note(36, 2.0, 1.1, tau=.9), FINAL, .5)

    # chord stabs on the off-beats (filtered in the intro)
    for b, name in enumerate(PROG[:16]):
        for beat in range(4):
            t = b * BAR + beat * BEAT + .25
            if active(t, STABS):
                cut = 1400 + 3600 * min(1, t / 4.0) if t < 4 else 5000
                st = stab(CH[name]['pad'], 1.0, cut)
                mix(music, st, t, .34, (-.2, .2)[beat % 2])
                mix(verb, st, t, .12)
    mix(music, stab(CH['Cend']['pad'], 1.3, 6000, dur=1.6), FINAL, .5)

    # pads: dark + bright layers crossfaded by automation
    for b, name in enumerate(PROG):
        dur = BAR if b < 16 else 1.9
        mix(pads, pad_chord(CH[name]['pad'], dur, 1100, b), b * BAR)
        mix(pads_hi, pad_chord(CH[name]['pad'], dur, 4800, b), b * BAR)
    bright = ramp([0, 4, 19.3, 19.8, 23.5, 24, 34], [.3, .8, .8, .15, .5, .9, 1])
    level = ramp([0, 4, 19.3, 19.8, 24, 32, 33.9, 34], [.35, .45, .45, .8, .45, .6, 0, 0])
    pad_bus = filt((pads * (1 - bright) + pads_hi * bright) * level, 'highpass', 200) * duck
    music += pad_bus
    verb += pad_bus * .3

    # Mo's marimba motif
    for b in MARIMBA_BARS:
        name = PROG[b]
        for beat, m in MOTIF[name]:
            t = b * BAR + beat * BEAT
            mix(lead, marimba(m, .9 if beat % 1 else 1.0), t, .34, (-.15, .15)[int(beat * 2) % 2])
    mix(lead, marimba(84, 1.1), FINAL, .34)
    music += lead + pingpong(lead) * .5
    verb += lead * .3

    # light arp for texture while Mo plans, and in the dark ads section
    pat = [0, 1, 2, 3, 2, 1, 0, 2]
    for b, name in enumerate(PROG[:16]):
        notes = [m + 12 for m in CH[name]['pad']]
        for s in range(16):
            t = b * BAR + s * .125
            if active(t, ARP):
                mix(music, pluck(notes[pat[s % 8]], 1.0 if s % 4 == 0 else .7), t, .2 * np.maximum(duck[int(t * SR)], .6), (-.3, .3)[s % 2])

    # transitions
    mix(music, riser(1.6, .18), DROPS[0] - 1.6)
    mix(music, riser(1.5, .2), DROPS[1] - 1.5)
    mix(music, riser(1.2, .16), DROPS[2] - 1.2)
    for d in DROPS + [FINAL]:
        mix(music, crash(.3 if d != FINAL else .38), d, 1.0, .1)
        mix(verb, crash(.18), d)
    mix(music, boom(.5, 1.2), DROPS[0])

    # sound effects from the reel's cue sheet
    cues = json.load(open(os.path.join(OUT, 'sfx.json')))
    checks = [88, 91, 93, 96]
    for c in cues:
        t, kind, g, p = c['t'], c['type'], c.get('g', 1.0), c.get('p', 0)
        if kind == 'hop':
            mix(fx, boing(1 + .06 * p, .22), t, 1.0, -.2 + .1 * p)
        elif kind == 'check':
            mix(fx, tick(.5), t)
            mix(fx, thunk(.35), t)
            b_ = bell(checks[int(p)], .16, .8)
            mix(fx, b_, t + .02, 1.0, .15)
            mix(verb, b_, t + .02, .5)
        elif kind == 'bloop':
            mix(fx, bubble(.45 * g), t)
            mix(verb, bubble(.12), t)
        elif kind == 'blink':
            mix(fx, tick(.12 * g), t + .04)
        elif kind == 'giggle':
            for k in range(3):
                mix(fx, boing(1.6 + .25 * k, .1 * g), t + k * .07, 1.0, (-.2, 0, .2)[k])
        elif kind == 'whoosh':
            mix(fx, whoosh(c.get('dur', .45), .34 * g), t)
        elif kind == 'swish':
            mix(fx, whoosh(.22, .3 * g), t)
        elif kind == 'chip':
            mix(fx, pop(1.0 + .045 * p, .3 * g), t, 1.0, -.4 + .05 * p)
        elif kind == 'chime':
            for k, m in enumerate((84, 88, 91, 96)):
                mix(fx, bell(m, .16 * g), t + k * .06, 1.0, (-.2, .2)[k % 2])
                mix(verb, bell(m, .1 * g), t + k * .06)
        elif kind == 'ping':
            m = (88, 91, 95)[int(p)]
            b_ = bell(m, .2 * g, 1.2)
            mix(fx, b_, t, 1.0, (-.5, 0, .5)[int(p)])
            mix(fx, b_ * .35, t + .19, 1.0, (.5, 0, -.5)[int(p)])
            mix(verb, b_, t, .6)
        elif kind == 'zip':
            mix(fx, scroll_zip(.45, .16 * g), t)
        elif kind == 'heart':
            mix(fx, pop(1.5, .35 * g), t)
            for k, m in enumerate((88, 93, 100)):
                mix(fx, bell(m, .07, .6), t + .05 + k * .05, 1.0, (-.3, 0, .3)[k])
        elif kind == 'portal':
            mix(fx, whoosh(.7, .3 * g), t)
            mix(fx, boom(.45 * g, 1.2), t + .15)
        elif kind == 'pop':
            mix(fx, pop(p or 1.0, .38 * g), t, 1.0, rng.uniform(-.2, .2))
        elif kind == 'ding':
            for k, m in enumerate((91, 96)):
                b_ = bell(m, .26 * g, 1.4)
                mix(fx, b_, t + k * .09)
                mix(verb, b_, t + k * .09, .6)
        elif kind == 'card':
            mix(fx, whoosh(.24, .26 * g), t - .08)
            mix(fx, thunk(.4 * g), t + .14)
        elif kind == 'rise':
            mix(fx, riser(.5, .25 * g), t)
        elif kind == 'impact':
            mix(fx, boom(.8 * g, 1.6), t)
            mix(verb, boom(.2 * g, 1.6), t)
        elif kind == 'click':
            mix(fx, tick(.6 * g), t)
            mix(fx, tick(.4 * g), t + .07)
            mix(fx, thunk(.3 * g), t)
        elif kind == 'shimmer':
            for k, m in enumerate((84, 88, 91, 95, 100)):
                mix(fx, bell(m, .05 * g, .9), t + k * .045, 1.0, (-.4, -.2, 0, .2, .4)[k])
                mix(verb, bell(m, .05 * g, .9), t + k * .045)

    music = music + .3 * filt(music, 'highpass', 3000)       # presence for phone speakers
    out = music + fx + apply_reverb(verb, reverb_ir()) * .3
    out = filt(out, 'highpass', 28)                       # clean sub-rumble / DC
    out *= np.clip((DUR - secs(N)) / .4, 0, 1)
    return out * .9 / np.max(np.abs(out))


def write_wav(path, x):
    pcm = np.ascontiguousarray((np.clip(x.T, -1, 1) * 8388607).astype('<i4'))
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(3)
        w.setframerate(SR)
        w.writeframes(pcm.view(np.uint8).reshape(-1, 4)[:, :3].tobytes())   # little-endian 24-bit


if __name__ == '__main__':
    audio = build()
    write_wav(os.path.join(OUT, 'audio.wav'), audio)
    print('wrote', os.path.join(OUT, 'audio.wav'), f'{N / SR:.1f}s peak={np.max(np.abs(audio)):.3f}')
