"""Synthesise the music bed + SFX and mix them under the VO.

Usage: python audio.py <timeline.json> <scenes.json> <vo_tight.wav> <out.wav> [events.json]
Everything here is generated from scratch with numpy (no samples).
"""
import json, subprocess, sys, wave
import numpy as np

SR = 48000
BPM = 118
BEAT = 60 / BPM
RNG = np.random.default_rng(7)


def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):  # small buffers only
        acc = (1 - a) * v + a * acc; y[i] = acc
    return y


def lp_fast(x, cutoff):
    # one-pole lowpass via scipy-free IIR using cumulative trick (vectorised in blocks)
    from math import exp
    a = exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x); acc = np.zeros(x.shape[1:]) if x.ndim > 1 else 0.0
    blk = 4096
    for s in range(0, len(x), blk):
        seg = x[s:s + blk]
        for i in range(len(seg)):
            acc = (1 - a) * seg[i] + a * acc; y[s + i] = acc
    return y


def kick():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 45 + 95 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * env(n, 0.001, 0.16) * 0.95


def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR)
    x = RNG.standard_normal(n)
    x = x - np.concatenate([[0], x[:-1]])  # crude highpass
    return x * env(n, 0.0005, 0.06 if open_ else 0.012) * 0.16


def clap():
    n = int(0.25 * SR)
    x = RNG.standard_normal(n) * 0.3
    e = np.zeros(n)
    for off in (0, 0.011, 0.022):
        k = int(off * SR); e[k:] += env(n - k, 0.0005, 0.03 if off < 0.02 else 0.09)
    return lowpass(x * e, 2500) * 0.9


def tone(freq, dur, kind='sine', det=0.0):
    n = int(dur * SR); t = np.arange(n) / SR
    if kind == 'sine':
        return np.sin(2 * np.pi * freq * t)
    out = np.zeros(n)
    for d in (-det, 0, det):
        ph = (freq * (1 + d) * t) % 1.0
        out += 2 * ph - 1
    return out / 3


def place(buf, x, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf) or i + len(x) <= 0:
        return
    j = min(len(buf), i + len(x))
    buf[i:j] += x[: j - i] * gain


def whoosh(dur=0.45, up=True):
    n = int(dur * SR); t = np.arange(n) / SR
    x = RNG.standard_normal(n)
    # sweep a resonant-ish band with a moving one-pole lowpass
    cut = np.linspace(300, 6000, n) if up else np.linspace(6000, 300, n)
    y = np.empty(n); acc = 0.0
    for i in range(n):
        a = np.exp(-2 * np.pi * cut[i] / SR); acc = (1 - a) * x[i] + a * acc; y[i] = acc
    shape = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return y * shape * 0.6


def boom():
    n = int(1.4 * SR); t = np.arange(n) / SR
    f = 32 + 60 * np.exp(-t / 0.09)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.5) * 0.9


def tick():
    n = int(0.03 * SR)
    return tone(2400, 0.03) * env(n, 0.0003, 0.006) * 0.12


def pop():
    n = int(0.12 * SR); t = np.arange(n) / SR
    f = 500 + 900 * np.exp(-t / 0.02)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.04) * 0.25


def riser(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 200 * (2 ** (3 * t / dur))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.15 + RNG.standard_normal(n) * 0.05
    return s * (t / dur) ** 2


EVENTS_PATH = None


def main(tl_path, sc_path, vo_path, out_path):
    tl = json.load(open(tl_path)); sc = json.load(open(sc_path))
    P = tl['phrases']; dur = tl['duration']
    N = int((dur + 0.5) * SR)
    drums = np.zeros(N); bass = np.zeros(N); pad = np.zeros(N); sfx = np.zeros(N)

    # sections: (start, end, kick, hats, clap, bass)
    sections = [
        (0, sc['brand'], False, True, False, True),
        (sc['brand'], sc['match'], True, True, True, True),
        (sc['match'], sc['plans'], False, False, False, False),
        (sc['plans'], sc['spot'], True, True, True, True),
        (sc['spot'], sc['cta'], False, True, False, False),
        (sc['cta'], dur, True, True, False, True),
    ]
    K, Hh, Ho, Cl = kick(), hat(), hat(True), clap()
    prog = [55.0, 43.65, 65.41, 49.0]  # A1 F1 C2 G1
    chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [261.6, 329.6, 392], [196, 246.9, 293.7]]
    nbeats = int(dur / BEAT) + 2
    for b in range(nbeats):
        t0 = b * BEAT
        sec = next((s for s in sections if s[0] <= t0 < s[1]), None)
        if sec is None:
            continue
        _, _, k_on, h_on, c_on, b_on = sec
        if k_on:
            place(drums, K, t0)
        if c_on and b % 2 == 1:
            place(drums, Cl, t0, 0.5)
        if h_on:
            place(drums, Hh, t0 + BEAT / 2)
            if b % 4 == 3:
                place(drums, Ho, t0 + BEAT / 2, 0.6)
        if b_on:
            f = prog[(b // 4) % 4]
            note = tone(f, BEAT * 0.9, 'saw', 0.004) * 0.5 + tone(f, BEAT * 0.9) * 0.6
            note *= env(len(note), 0.004, 0.35)
            place(bass, note, t0)
    # pad: one chord per bar, slow attack
    bar = BEAT * 4
    for i in range(int(dur / bar) + 1):
        ch = chords[i % 4]
        x = sum(tone(f, bar + 0.3, 'saw', 0.006) for f in ch) / 3
        n = len(x); tt = np.arange(n) / SR
        x *= np.minimum(1, tt / 0.6) * np.minimum(1, (n / SR - tt) / 0.4)
        place(pad, x, i * bar)
    pad = lp_fast(pad, 900) * 0.35
    bass = lp_fast(bass, 400)

    # sidechain bass/pad to kick grid in sections with a kick
    duck = np.ones(N)
    kd = 1 - 0.6 * np.exp(-np.arange(int(BEAT * SR)) / (0.09 * SR))
    for b in range(nbeats):
        t0 = b * BEAT
        sec = next((s for s in sections if s[0] <= t0 < s[1]), None)
        if sec and sec[2]:
            i = int(t0 * SR); j = min(N, i + len(kd)); duck[i:j] = np.minimum(duck[i:j], kd[: j - i])
    music = drums * 0.9 + bass * 0.55 * duck + pad * duck

    # SFX: placed on picture events exported by the renderer (events.json), else the v1 defaults
    if EVENTS_PATH:
        def thud():
            n = int(0.35 * SR); t = np.arange(n) / SR
            return np.sin(2 * np.pi * np.cumsum(70 + 80 * np.exp(-t / 0.03)) / SR) * env(n, 0.001, 0.12) * 0.8
        def ding():
            n = int(0.9 * SR)
            return (tone(1318.5, 0.9) * 0.6 + tone(1975.5, 0.9) * 0.3) * env(n, 0.002, 0.25) * 0.22
        def bubble():
            n = int(0.09 * SR); t = np.arange(n) / SR
            return np.sin(2 * np.pi * np.cumsum(900 + 700 * (t / 0.09)) / SR) * env(n, 0.001, 0.03) * 0.3
        def cut():
            n = int(0.12 * SR)
            return RNG.standard_normal(n) * env(n, 0.0005, 0.02) * 0.35 + thud()[:n] * 0.6
        make = {
            'whoosh': lambda e: whoosh(0.4), 'whooshUp': lambda e: whoosh(0.45), 'whooshDown': lambda e: whoosh(0.4, up=False),
            'swish': lambda e: whoosh(0.28), 'thud': lambda e: thud(), 'cut': lambda e: cut(), 'fall': lambda e: whoosh(0.34, up=False),
            'boom': lambda e: boom(), 'riser': lambda e: riser(e.get('dur', 1.0)), 'tick': lambda e: tick() * 2.5,
            'pop': lambda e: pop(), 'ding': lambda e: ding(), 'bubble': lambda e: bubble(),
        }
        lead = {'whoosh': 0.2, 'whooshUp': 0.2, 'whooshDown': 0.2, 'swish': 0.14, 'fall': 0.0, 'riser': 0.0}
        for e in json.load(open(EVENTS_PATH)):
            place(sfx, make[e['kind']](e), e['t'] - lead.get(e['kind'], 0.0), e.get('gain', 0.6))
    else:
        for name in ['costs', 'quit', 'roles', 'cal', 'match', 'plans', 'always', 'nos', 'spot']:
            place(sfx, whoosh(0.4), sc[name] - 0.28, 0.55)
        place(sfx, boom(), sc['brand'], 0.8)
        place(sfx, riser(1.6), sc['plans'] - 1.6, 0.6)
        place(sfx, boom(), sc['cta'], 0.6)

    # VO + ducking
    with wave.open(vo_path) as w:
        vo = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, w.getnchannels()).mean(1) / 32768
    vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
    win = int(0.05 * SR)
    rms = np.sqrt(np.convolve(vo ** 2, np.ones(win) / win, mode='same'))
    voice_on = np.clip(rms / 0.02, 0, 1)
    sm = np.convolve(voice_on, np.ones(int(0.2 * SR)) / int(0.2 * SR), mode='same')
    music_gain = 1 - 0.45 * sm
    bed = music * music_gain * 0.32 + sfx * 0.55
    mix = np.stack([vo + bed * 0.97, vo + bed * 1.03], 1)
    mix /= max(1e-9, np.abs(mix).max()) / 0.95
    tmp = out_path + '.raw.wav'
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', tmp, '-af',
                    f'loudnorm=I=-14:TP=-1.5:LRA=9,atrim=0:{dur:.3f}', '-ar', str(SR), out_path], check=True)
    print('wrote', out_path)


if __name__ == '__main__':
    if len(sys.argv) > 5:
        EVENTS_PATH = sys.argv[5]
    main(*sys.argv[1:5])
