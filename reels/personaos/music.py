#!/usr/bin/env python3
"""Soundtrack for the Persona OS reel.

Synthesizes an original 120 BPM track (drums, bass, pad, arp, risers) whose
drops land on the reel's scene changes, then places the UI sound effects listed
in out/sfx.json (exported from reel.html by render.mjs).

    python3 music.py            -> out/audio.wav (48 kHz stereo, unmastered)
"""
import json
import os
import wave

import numpy as np
from scipy import signal

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'out')
SR = 48000
DUR = 32.0
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


def env(n, a=0.005, r=None, tau=None):
    """Linear attack, then exponential decay (tau) or linear release (r)."""
    t = secs(n)
    e = np.minimum(1.0, t / max(a, 1e-4))
    if tau is not None:
        e *= np.exp(-np.maximum(0, t - a) / tau)
    if r is not None:
        e *= np.clip((n / SR - t) / r, 0, 1)
    return e


def ramp(times, values):
    """Piecewise-linear automation curve over the whole track."""
    return np.interp(secs(N), times, values)


def saw_voice(freq, n, cutoff, phase=0.0):
    """Band-limited saw built from harmonics, with a smooth 4th-order low-pass roll-off."""
    t = secs(n)
    out = np.zeros(n)
    h = 1
    while h * freq < min(cutoff * 2.5, 16000):
        amp = (1 / h) / np.sqrt(1 + (h * freq / cutoff) ** 8)
        out += amp * np.sin(2 * np.pi * h * freq * t + phase * h)
        h += 1
    return out


# ------------------------------------------------------------ arrangement
CH = {
    'Am': dict(pad=[57, 60, 64, 67, 71], bass=33, arp=[69, 72, 76, 79]),
    'F':  dict(pad=[53, 57, 60, 64, 67], bass=29, arp=[65, 69, 72, 76]),
    'C':  dict(pad=[55, 60, 62, 64, 67], bass=36, arp=[67, 72, 74, 76]),
    'G':  dict(pad=[55, 59, 62, 64, 69], bass=31, arp=[67, 71, 74, 79]),
    'Cf': dict(pad=[48, 55, 60, 64, 67, 74], bass=36, arp=[72, 76, 79, 84]),
}
PROG = ['Am', 'F', 'C', 'G'] * 3 + ['Am', 'F', 'G', 'Cf']       # one chord per 2 s bar


def active(t, spans):
    return any(a <= t < b for a, b in spans)


KICK_HALF = [(2.0, 4.0)]
KICK = [(4.0, 7.75), (8.0, 27.5), (28.0, 30.0)]
CLAP = [(4.0, 7.0), (8.0, 27.0), (28.0, 30.0)]
HATS = [(2.0, 27.5), (28.0, 30.0)]
BASS = [(2.0, 7.75), (8.0, 27.5), (28.0, 30.0)]
ARP = [(8.0, 27.5), (28.0, 30.0)]
ROLLS = [7.0, 27.0]
DROPS = [8.0, 28.0]


def kick_times():
    ts = []
    for k in range(int(DUR / BEAT)):
        t = k * BEAT
        if active(t, KICK) or (active(t, KICK_HALF) and k % 2 == 0):
            ts.append(t)
    return ts + [30.0]


def sidechain(kicks, depth=.55, tau=.12):
    t = secs(N)
    dip = np.zeros(N)
    for k in kicks:
        i = int(k * SR)
        n = min(N - i, int(.5 * SR))
        dt = t[:n]
        dip[i:i + n] = np.maximum(dip[i:i + n], depth * np.exp(-dt / tau) * (1 - np.exp(-dt / .004)))
    return 1 - dip


# ------------------------------------------------------------ instruments
def kick(g=1.0):
    n = int(.45 * SR)
    t = secs(n)
    f = 44 + 120 * np.exp(-t / .028) + 30 * np.exp(-t / .12)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .002, tau=.22)
    knock = np.sin(2 * np.pi * 185 * t) * np.exp(-t / .025) * .45
    click = filt(noise(n), 'bandpass', [2500, 7000]) * np.exp(-t / .003) * .5
    return np.tanh(1.5 * (body + knock + click)) * g


def clap():
    n = int(.4 * SR)
    t = secs(n)
    x = filt(noise(n), 'bandpass', [900, 3200])
    e = np.zeros(n)
    for k, off in enumerate([0, .009, .018]):
        e += (t >= off) * np.exp(-np.maximum(0, t - off) / (.006 if k < 2 else .13))
    return x * e * .7


def hat(open_=False):
    n = int((.32 if open_ else .07) * SR)
    x = filt(noise(n), 'highpass', 7000, 4)
    return x * env(n, .001, tau=.11 if open_ else .018)


def snare():
    n = int(.25 * SR)
    t = secs(n)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / .05)
    return (filt(noise(n), 'bandpass', [1200, 7000]) * np.exp(-t / .07) + .6 * tone) * .6


def bass_note(m, dur, g=1.0, tau=.24):
    n = int(dur * SR)
    f = mtof(m)
    t = secs(n)
    x = np.sin(2 * np.pi * f * t) + .65 * saw_voice(f * 2, n, 700) + .3 * saw_voice(f * 2 * 1.004, n, 1100)
    x = np.tanh(1.2 * x) * env(n, .004, tau=tau) * np.clip((dur - t) / .02, 0, 1)
    return x * g


def pluck(m, g=1.0):
    n = int(.42 * SR)
    t = secs(n)
    f = mtof(m)
    x = np.zeros(n)
    for h in range(1, 14):
        if h * f > 14000:
            break
        x += (1 / h) * np.sin(2 * np.pi * h * f * t) * np.exp(-t * (7 + 3.2 * h))
    return x * env(n, .002) * g


def pad_chord(notes, dur, cutoff, seed):
    n = int((dur + .9) * SR)
    t = secs(n)
    out = np.zeros((2, n))
    phases = np.random.default_rng(seed).uniform(0, 2 * np.pi, (len(notes), 3))   # shared by dark/bright layers
    for j, m in enumerate(notes):
        f = mtof(m)
        for v_, (det, pan) in enumerate(((-9, -.65), (0, 0), (9, .65))):
            v = saw_voice(f * 2 ** (det / 1200), n, cutoff, phase=phases[j, v_])
            out += stereo(v, pan) * .33
    e = np.minimum(1, t / .35) * np.clip((dur + .9 - t) / .9, 0, 1)
    return out * e / len(notes)


def riser(dur, g=1.0):
    n = int(dur * SR)
    t = secs(n) / dur
    x = noise(n)
    out = np.zeros(n)
    edges = np.linspace(0, n, 17).astype(int)
    zi = None
    for k in range(16):                                  # band-pass that climbs in 16 steps
        fc = 400 * 2 ** (k / 16 * 4.6)
        s = sos('bandpass', [fc * .7, min(fc * 1.5, 20000)])
        if zi is None:
            zi = signal.sosfilt_zi(s) * 0
        out[edges[k]:edges[k + 1]], zi = signal.sosfilt(s, x[edges[k]:edges[k + 1]], zi=zi)
    sweep = np.sin(2 * np.pi * np.cumsum(300 * 2 ** (t * 2.6)) / SR) * .12
    return (out * 1.4 + sweep) * t ** 2.2 * g


def crash(g=1.0):
    n = int(2.2 * SR)
    x = filt(noise(n), 'highpass', 4500, 2)
    return x * env(n, .002, tau=.7) * g


def boom(g=1.0, dur=1.6):
    n = int(dur * SR)
    t = secs(n)
    f = 32 + 60 * np.exp(-t / .09)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .55)
    body = filt(noise(n), 'lowpass', 900) * np.exp(-t / .12) * .8
    return np.tanh(1.4 * (sub + body)) * g


def whoosh(dur=.45, g=1.0):
    n = int(dur * SR)
    t = secs(n) / dur
    x = noise(n)
    lo = filt(x, 'bandpass', [300, 1400])
    hi = filt(x, 'bandpass', [1400, 7000])
    shape = np.sin(np.pi * t) ** 2
    mono = (lo * (1 - t) + hi * t) * shape
    return np.vstack([mono * (1 - .6 * t), mono * (.4 + .6 * t)]) * g


def blip(freq, dur=.09, g=1.0, tri=True):
    n = int(dur * SR)
    t = secs(n)
    ph = 2 * np.pi * freq * t
    x = (2 / np.pi) * np.arcsin(np.sin(ph)) if tri else np.sin(ph)
    return x * env(n, .002, tau=dur / 3) * g


def pop(p=1.0, g=1.0):
    n = int(.12 * SR)
    t = secs(n)
    f = 520 * p * (1 + .9 * np.exp(-t / .012))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .0015, tau=.035)
    return x * g


def key(seed, g=1.0):
    n = int(.05 * SR)
    t = secs(n)
    r = np.random.default_rng(int(seed * 7919) + 1)
    x = filt(r.standard_normal(n), 'bandpass', [1800 + r.uniform(0, 1200), 6500]) * np.exp(-t / .004)
    thock = np.sin(2 * np.pi * (170 + r.uniform(0, 40)) * t) * np.exp(-t / .012) * .5
    return (x + thock) * g


def tick(g=1.0):
    n = int(.03 * SR)
    t = secs(n)
    return (filt(noise(n), 'bandpass', [2500, 6000]) * np.exp(-t / .003) + .4 * np.sin(2 * np.pi * 2300 * t) * np.exp(-t / .006)) * g


def bell(m, g=1.0, dur=1.2):
    n = int(dur * SR)
    t = secs(n)
    f = mtof(m)
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d) for r, a, d in ((1, 1, .5), (2.01, .35, .25), (3.98, .18, .12), (5.4, .08, .06)))
    return x * env(n, .002) * g


def stamp(g=1.0):
    n = int(.35 * SR)
    t = secs(n)
    thump = np.sin(2 * np.pi * np.cumsum(60 + 90 * np.exp(-t / .02)) / SR) * np.exp(-t / .09)
    slap = filt(noise(n), 'bandpass', [500, 2600]) * np.exp(-t / .025)
    return np.tanh(1.5 * (thump + .8 * slap)) * g


def scroll_air(dur, g=1.0):
    n = int(dur * SR)
    t = secs(n)
    x = filt(noise(n), 'bandpass', [600, 3500])
    e = np.minimum(1, t / .15) * np.clip((dur - t) / .35, 0, 1) ** 1.5
    wob = 1 + .25 * np.sin(2 * np.pi * 5 * t)
    return np.vstack([x * e * wob, np.roll(x, 240) * e * wob]) * g


# ------------------------------------------------------------ effects
def reverb_ir(rt60=2.0, n_sec=2.6, bright=5500):
    n = int(n_sec * SR)
    t = secs(n)
    ir = np.zeros((2, n))
    for c in range(2):
        tail = rng.standard_normal(n) * np.exp(-6.91 * t / rt60)
        dark = filt(tail, 'lowpass', 1800)
        mixw = np.exp(-t / .35)
        ir[c] = filt(tail, 'lowpass', bright) * mixw + dark * (1 - mixw)
        ir[c, :int(.012 * SR)] = 0                                         # pre-delay
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def apply_reverb(bus, ir):
    out = np.zeros_like(bus)
    for c in range(2):
        out[c] = signal.fftconvolve(bus[c], ir[c])[:N]
    return out


def pingpong(bus, d=.375, fb=.38, n_echo=6):
    mono = bus.mean(0)
    out = np.zeros_like(bus)
    x = mono
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
    arp = np.zeros((2, N))
    verb_send = np.zeros((2, N))
    fx = np.zeros((2, N))

    kicks = kick_times()
    duck = sidechain(kicks)

    # drums
    for t in kicks:
        mix(music, kick(1.25 if t == 30.0 else 1.0), t, .8)
    for b in range(16):
        for beat in range(4):
            t = b * BAR + beat * BEAT
            if beat in (1, 3) and active(t, CLAP):
                c = clap()
                mix(music, c, t, .85)
                mix(verb_send, c, t, .35)
            if active(t, HATS):
                mix(music, hat(open_=t >= 8.0), t + .25, .26 if t >= 8 else .2, .25)
                if t >= 4.0:
                    for s in (0, .125, .375):
                        mix(music, hat(), t + s, .09 + .05 * (s == .375), -.3)
    for k in range(32):                                   # hook: ticking 16ths that swell into the stop
        t = k * .0625
        mix(music, hat(), t, .08 + .16 * (k / 32) ** 1.5, (-.4, .4)[k % 2])
    for r0 in ROLLS:                                      # snare roll into each drop: 16ths, then 32nds
        for k in range(24):
            t = r0 + (k * .0625 if k < 8 else .5 + (k - 8) * .03125)
            mix(music, snare(), t, .08 + .3 * (k / 24) ** 2)
            mix(verb_send, snare(), t, .05)

    # bass (off-beat 8ths, pumping)
    for b, name in enumerate(PROG):
        root = CH[name]['bass']
        for e in range(8):
            t = b * BAR + e * .25
            if not active(t, BASS):
                continue
            m = root + (12 if e == 7 else 0)
            mix(music, bass_note(m, .24, 1.0 if e % 2 else .7), t, .36)
    mix(music, bass_note(36, 2.0, tau=.9), 30.0, .5)

    # pads: dark + bright layers crossfaded by automation
    for b, name in enumerate(PROG):
        dur = BAR if b < 15 else 1.9
        mix(pads, pad_chord(CH[name]['pad'], dur, 1300, b), b * BAR)
        mix(pads_hi, pad_chord(CH[name]['pad'], dur, 5200, b), b * BAR)
    bright = ramp([0, 2, 6.8, 8, 27, 28, 32], [.05, .35, .45, .85, .75, 1, 1])
    level = ramp([0, 2, 8, 27.5, 28, 30, 31.9, 32], [.8, .85, .75, .75, .9, 1, .0, 0])
    pad_bus = (pads * (1 - bright) + pads_hi * bright) * level
    pad_bus = filt(pad_bus, 'highpass', 200) * np.where(secs(N) < 2.0, 1.0, duck)   # leave the low end to kick + bass
    music += pad_bus
    verb_send += pad_bus * .25

    # arp
    pat = [0, 2, 1, 3, 2, 0, 3, 1, 0, 2, 1, 3, 2, 3, 1, 2]
    for b, name in enumerate(PROG):
        notes = CH[name]['arp']
        for s in range(16):
            t = b * BAR + s * .125
            if active(t, ARP):
                vel = (1.0 if s % 4 == 0 else .7) * (.75 if 16 <= t < 20 else 1)
                mix(arp, pluck(notes[pat[s]], vel), t, .42, (-.25, .25)[s % 2])
    arp_all = arp + pingpong(arp)
    music += arp_all * np.maximum(duck, .6)
    verb_send += arp * .35

    # transitions: risers, reverse swells, drops
    mix(music, riser(2.0, .16), 0.0)
    for d in DROPS:
        mix(music, riser(1.5, .22), d - 1.5)
        swell = crash(1)[::-1][-int(.6 * SR):]           # reversed cymbal sucking into the drop
        mix(music, swell * .5, d - .6)
        mix(music, crash(.35), d, 1.0, .1)
        mix(verb_send, crash(.2), d)
    mix(music, crash(.3), 30.0, 1.0, -.1)
    mix(verb_send, crash(.25), 30.0)

    # sound effects from the reel's cue sheet
    cues = json.load(open(os.path.join(OUT, 'sfx.json')))
    penta = [81, 84, 86, 88, 91, 93, 96, 98, 100, 103]
    for c in cues:
        t, kind, g, p = c['t'], c['type'], c.get('g', 1.0), c.get('p', 1.0)
        if kind == 'scroll':
            mix(fx, scroll_air(c['dur'], .22), t)
        elif kind == 'tick':
            mix(fx, tick(g * .8), t, 1.0, rng.uniform(-.3, .3))
        elif kind == 'stop':
            mix(fx, boom(.75, 1.0), t)
            mix(fx, tick(.8), t)
            mix(verb_send, boom(.2, 1.0), t)
        elif kind == 'heart':
            mix(fx, pop(1.5, .35), t)
            for k, m in enumerate((88, 93, 100)):
                mix(fx, bell(m, .07, .6), t + .05 + k * .05, 1.0, (-.3, 0, .3)[k])
        elif kind == 'whoosh':
            mix(fx, whoosh(c.get('dur', .45), .38 * g), t)
        elif kind == 'swish':
            mix(fx, whoosh(.22, .3 * g), t)
        elif kind == 'pop':
            mix(fx, pop(p, .45 * g), t, 1.0, rng.uniform(-.2, .2))
        elif kind == 'key':
            mix(fx, key(p, .32 * g), t, 1.0, .1)
        elif kind == 'click':
            mix(fx, key(99, .35 * g), t)
            mix(fx, key(98, .25 * g), t + .07)
        elif kind == 'blip':
            b = blip(mtof(penta[int(p)]), .1, .16 * g)
            mix(fx, b, t, 1.0, -.4 + .08 * p)
            mix(verb_send, b, t, .5)
        elif kind == 'chime':
            seq = (84, 88, 91, 96) if c.get('up') else (88, 95)
            for k, m in enumerate(seq):
                mix(fx, bell(m, .2 * g), t + k * .07, 1.0, (-.2, .2)[k % 2])
                mix(verb_send, bell(m, .08 * g), t + k * .07)
        elif kind == 'stamp':
            mix(fx, stamp(.6 * g), t)
            mix(verb_send, stamp(.2 * g), t)
        elif kind == 'shimmer':
            for k, m in enumerate((84, 88, 91, 95, 100)):
                mix(fx, bell(m, .05 * g, .9), t + k * .045, 1.0, (-.4, -.2, 0, .2, .4)[k])
                mix(verb_send, bell(m, .05 * g, .9), t + k * .045)
        elif kind == 'impact':
            mix(fx, boom(1.0 * g, 1.8), t + .02)
            mix(verb_send, boom(.25 * g, 1.8), t + .02)

    wet = apply_reverb(verb_send, reverb_ir())
    out = music + fx + wet * .32
    out = filt(out, 'highpass', 28)                      # clean sub-rumble / DC
    fade = np.clip((DUR - secs(N)) / .35, 0, 1)
    out *= fade
    out *= .9 / np.max(np.abs(out))
    return out


def write_wav(path, x):
    pcm = np.ascontiguousarray((np.clip(x.T, -1, 1) * 8388607).astype('<i4'))
    b24 = pcm.view(np.uint8).reshape(-1, 4)[:, :3].tobytes()     # little-endian 24-bit
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(3)
        w.setframerate(SR)
        w.writeframes(b24)


if __name__ == '__main__':
    audio = build()
    write_wav(os.path.join(OUT, 'audio.wav'), audio)
    print('wrote', os.path.join(OUT, 'audio.wav'), f'{N / SR:.1f}s peak={np.max(np.abs(audio)):.3f}')
