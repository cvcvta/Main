#!/usr/bin/env python3
"""Audio for the voiceover cut (reel-vo.html): voiceover + music bed + sound cues.

The voiceover is assets/vo.mp3 with the pauses from assets/vo-edit.json cut in, so each line
has room to land. The music reuses the synth instruments from music.py: the drop lands on
"Meet Mo", every line starts on a beat, and the final chord lands on the bar after
"…get started today". The music ducks under the voice and comes part of the way back up in
the pauses. The cues from out/sfx-reel-vo.json are kept light.

    python3 music-vo.py         -> out/audio-vo.wav (48 kHz stereo, 24-bit, unmastered)
"""
import json
import math
import os
import subprocess

import numpy as np

import music as M

ASSETS = os.path.join(M.ROOT, 'assets')
EDIT = json.load(open(os.path.join(ASSETS, 'vo-edit.json')))
WORDS = json.load(open(os.path.join(ASSETS, 'vo-words.json')))['words']


def pause_before(i):
    return sum(p['add'] for p in EDIT['pauses'] if p['after'] < i)


# word timings in the edited voiceover (reel-vo.html shifts them the same way)
VO = [dict(w=w['w'], t0=w['t0'] + pause_before(i), t1=w['t1'] + pause_before(i)) for i, w in enumerate(WORDS)]

DUR = EDIT['dur']
M.DUR, M.N = DUR, int(M.SR * DUR)          # music.py's helpers read these module globals
SR, N = M.SR, M.N
OUT = M.OUT
VO_FILE = os.path.join(ASSETS, 'vo.mp3')

DROP = VO[7]['t0']                         # "Meet Mo"
BAR0 = DROP - 2.0                          # downbeat of bar 0; bars are 2 s at 120 BPM
FINALE = round((VO[57]['t0'] - BAR0) / 2)  # the bar "Click the link below" starts on
LAST = math.ceil((VO[-1]['t1'] + .3 - BAR0) / 2)    # the first bar line after "…today" gets the final chord
FINAL = BAR0 + LAST * 2.0
# bar -1 … LAST: into the drop, C–G–Am–F from the drop, then I–IV–V–I to finish
LOOP = ['C', 'G', 'Am', 'F']
PROG = ['F', 'G'] + [LOOP[b % 4] for b in range(LAST - 4)] + ['C', 'F', 'G', 'Cend']


def bar_start(b):
    return BAR0 + b * 2.0


def load_vo():
    """assets/vo.mp3 with the pauses cut in. Each cut sits in a (near-)silent gap between two
    words, and 12 ms fades either side keep it click-free."""
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', VO_FILE, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         check=True, capture_output=True).stdout
    src = np.frombuffer(raw, dtype='<f4').reshape(-1, 2).T.astype(float)
    fade = np.linspace(0, 1, int(.012 * SR))
    parts, start = [], 0
    for p in EDIT['pauses'] + [dict(cut=src.shape[1] / SR, add=0)]:
        end = int(round(p['cut'] * SR))
        seg = src[:, start:end].copy()
        if start:
            seg[:, :len(fade)] *= fade
        if p['add']:
            seg[:, -len(fade):] *= fade[::-1]
        parts += [seg, np.zeros((2, int(round(p['add'] * SR))))]
        start = end
    vo = np.concatenate(parts, axis=1)
    out = np.zeros((2, N))
    n = min(N, vo.shape[1])
    out[:, :n] = vo[:, :n]
    return out


def level_lines(vo, amount=.6, limit=2.0):
    """Evens out the loudness of the lines: each stretch between two pauses moves `amount` of the way
    toward the median line level, by at most `limit` dB. The gain changes sit inside the pauses."""
    before = np.cumsum([0] + [p['add'] for p in EDIT['pauses']])
    mids = [p['cut'] + s + p['add'] / 2 for p, s in zip(EDIT['pauses'], before)]
    edges = [0] + mids + [N / SR]
    m, blk = vo.mean(0), int(.05 * SR)

    def level(a, b):
        x = m[int(a * SR):int(b * SR)]
        ms = np.array([np.mean(x[i:i + blk] ** 2) for i in range(0, len(x) - blk, blk)])
        return 10 * np.log10(np.mean(ms[ms > 10 ** -4.5]))          # speech only (above -45 dBFS)

    lv = np.array([level(a, b) for a, b in zip(edges, edges[1:])])
    gains = np.clip(amount * (np.median(lv) - lv), -limit, limit)
    xs, ys = [0.0], [gains[0]]
    for j, t in enumerate(mids):
        xs += [t - .02, t + .02]
        ys += [gains[j], gains[j + 1]]
    return vo * 10 ** (np.interp(M.secs(N), xs + [N / SR], ys + [gains[-1]]) / 20)


def vo_duck(vo, depth=.66, floor=.6):
    """Gain curve that pulls the music down while the voice is talking. In the pauses between
    lines the music only comes part of the way back up (`floor`); after the last word it is released."""
    x = np.abs(vo.mean(0))
    win = int(.03 * SR)
    rms = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, 'same') + 1e-12)
    db = 20 * np.log10(rms)
    target = np.clip((db + 50) / 12, 0, 1)                # 0 below -50 dBFS, 1 above -38 dBFS (soft syllables too)
    # fast attack, slow release
    env = np.zeros(N)
    a, r = np.exp(-1 / (.015 * SR)), np.exp(-1 / (.28 * SR))
    e = 0.0
    for i in range(0, N, 16):                              # control rate: 3 kHz is plenty
        v = target[i]
        e = v + (e - v) * (a ** 16 if v > e else r ** 16)
        env[i:i + 16] = e
    env = np.where(M.secs(N) < VO[-1]['t1'], np.maximum(env, floor), env)
    return 1 - depth * env


def build():
    vo = level_lines(load_vo())
    vo *= 10 ** ((-16.5 - vo_loudness(vo)) / 20)          # voice alone ≈ -16.5 LUFS before mastering
    duck = vo_duck(vo)

    music = np.zeros((2, N))
    pads = np.zeros((2, N))
    pads_hi = np.zeros((2, N))
    lead = np.zeros((2, N))
    verb = np.zeros((2, N))
    fx = np.zeros((2, N))

    groove = lambda t: DROP <= t < FINAL
    kicks = [(bar_start(1) + k * .5, 1.0) for k in range(4 * LAST) if groove(bar_start(1) + k * .5)] + [(FINAL, 1.15)]
    side = M.sidechain(kicks, depth=.45)
    for t, g in kicks:
        M.mix(music, M.kick(g), t, .72)

    for b in range(-1, LAST + 1):
        name = PROG[b + 1]
        t0 = bar_start(b)
        for beat in range(4):
            t = t0 + beat * .5
            if t < 0 or t >= DUR:
                continue
            if beat in (1, 3) and groove(t):
                c = M.clap()
                M.mix(music, c, t, .7)
                M.mix(verb, c, t, .25)
            if groove(t + .25):
                M.mix(music, M.hat(True), t + .25, .17, .25)
            for s in range(4):
                ts = t + s * .125
                if ts < FINAL:
                    M.mix(music, M.shaker(), ts, (.15 if s % 2 else .08) * (1.1 if ts >= DROP else .8), (-.35, .35)[s % 2])
            # off-beat chord stabs (filtered in the intro)
            ts = t + .25
            if ts < FINAL and b < LAST:
                cut = 1200 + 1800 * min(1, max(0, ts) / DROP) if ts < DROP else 4500
                st = M.stab(M.CH[name]['pad'], 1.0, cut)
                M.mix(music, st, ts, .22, (-.2, .2)[beat % 2])
                M.mix(verb, st, ts, .1)
        # bass: root on the beat, octave on the off-beat, from the drop on
        if 0 < b < LAST:
            root = M.CH[name]['bass']
            for e in range(8):
                t = t0 + e * .25
                M.mix(music, M.bass_note(root + (12 if e % 2 else 0), .23, .85 if e % 2 else 1.0), t, .34)
        # pads
        dur = 2.0 if b < LAST else 1.8
        M.mix(pads, M.pad_chord(M.CH[name]['pad'], dur, 1100, b + 20), max(0, t0), 1.0)
        M.mix(pads_hi, M.pad_chord(M.CH[name]['pad'], dur, 4600, b + 20), max(0, t0), 1.0)
    M.mix(music, M.bass_note(36, 1.4, 1.1, tau=.8), FINAL, .45)
    M.mix(music, M.stab(M.CH['Cend']['pad'], 1.3, 6000, dur=1.3), FINAL, .45)

    bright = M.ramp([0, DROP - .2, DROP, DUR], [.2, .5, .85, 1])
    level = M.ramp([0, DROP, FINAL, DUR - .05, DUR], [.4, .55, .7, 0, 0])
    pad_bus = M.filt((pads * (1 - bright) + pads_hi * bright) * level, 'highpass', 200) * side
    music += pad_bus
    verb += pad_bus * .3

    # Mo's marimba: a three-note hello in the pause after "Meet Mo", and the motif to finish
    for k, m in enumerate((72, 76, 79)):
        M.mix(lead, M.marimba(m, .9), VO[8]['t1'] + .02 + k * .1, .3, (-.15, 0, .15)[k])
    for beat, m in M.MOTIF['C']:
        t = FINAL + beat * .5
        if t < DUR - .3:
            M.mix(lead, M.marimba(m, .9), t, .3, (-.15, .15)[int(beat * 2) % 2])
    music += lead + M.pingpong(lead) * .45
    verb += lead * .3

    # transitions: into the drop, into the finale, and the final chord
    M.mix(music, M.riser(1.4, .16), DROP - 1.4)
    M.mix(music, M.crash(.3), DROP, 1.0, .1)
    M.mix(music, M.boom(.45, 1.2), DROP)
    M.mix(music, M.riser(1.0, .08), bar_start(FINALE) - 1.0)
    M.mix(music, M.crash(.12), bar_start(FINALE), 1.0, -.1)          # light: "Click the link below" is spoken softly
    M.mix(music, M.crash(.34), FINAL, 1.0, .1)
    M.mix(verb, M.crash(.18), FINAL)

    # sound cues from the page
    for c in json.load(open(os.path.join(OUT, 'sfx-reel-vo.json'))):
        t, kind, g, p = c['t'], c['type'], c.get('g', 1.0), c.get('p', 0)
        if kind == 'bloop':
            M.mix(fx, M.bubble(.4 * g), t)
            M.mix(verb, M.bubble(.1), t)
        elif kind in ('swish', 'whoosh'):
            M.mix(fx, M.whoosh(c.get('dur', .3), .26 * g), t)
        elif kind == 'tick':
            M.mix(fx, M.tick(.35 * g), t, 1.0, .2)
        elif kind == 'cash':
            for k, m in enumerate((96, 100, 103)):
                M.mix(fx, M.bell(m, .06 * g, .5), t + k * .035, 1.0, (-.2, 0, .2)[k])
        elif kind == 'stamp':
            M.mix(fx, M.thunk(.55 * g), t)
            M.mix(fx, M.filt(M.noise(int(.06 * SR)), 'bandpass', [500, 2600]) * np.exp(-M.secs(int(.06 * SR)) / .02) * .45 * g, t)
            M.mix(verb, M.thunk(.2 * g), t)
        elif kind == 'pop':
            M.mix(fx, M.pop(p or 1.0, .3 * g), t, 1.0, float(np.sin(t * 7) * .3))
        elif kind == 'key':
            n = int(.035 * SR)
            k = M.filt(M.noise(n), 'bandpass', [1800, 6500]) * np.exp(-M.secs(n) / .004) + .4 * M.thunk(1)[:n]
            M.mix(fx, k * .3 * g, t, 1.0, .15)
        elif kind == 'toggle':
            M.mix(fx, M.pop(1.35 + .1 * p, .35 * g), t, 1.0, (-.4, 0, .4)[int(p) % 3])
        elif kind == 'chip':
            M.mix(fx, M.pop(1.0 + .04 * p, .22 * g), t, 1.0, -.35 + .05 * p)
        elif kind == 'ding':
            for k, m in enumerate((91, 96)):
                b_ = M.bell(m, .2 * g, 1.2)
                M.mix(fx, b_, t + k * .08)
                M.mix(verb, b_, t + k * .08, .5)
        elif kind == 'check':
            M.mix(fx, M.tick(.4 * g), t)
            M.mix(fx, M.bell((88, 91, 93)[int(p) % 3], .1 * g, .7), t + .02, 1.0, .15)
        elif kind == 'portal':
            M.mix(fx, M.whoosh(.6, .26 * g), t)
            M.mix(fx, M.boom(.2 * g, 1.0), t + .12)                    # kept low: it rings under "Click the…"
        elif kind == 'click':
            M.mix(fx, M.tick(.5 * g), t)
            M.mix(fx, M.tick(.35 * g), t + .07)
            M.mix(fx, M.thunk(.3 * g), t)
        elif kind == 'shimmer':
            for k, m in enumerate((84, 88, 91, 95, 100)):
                M.mix(fx, M.bell(m, .045 * g, .9), t + k * .045, 1.0, (-.4, -.2, 0, .2, .4)[k])
                M.mix(verb, M.bell(m, .045 * g, .9), t + k * .045)

    music = music + .25 * M.filt(music, 'highpass', 3000)
    end = VO[-1]['t1']
    lift = M.ramp([0, end - .04, end + .46, DUR], [.22, .22, .44, .44])    # the music comes up once the last word is out
    bed = (music + M.apply_reverb(verb, M.reverb_ir()) * .28) * lift * duck + fx * .5 * (.6 + .4 * duck)
    out = M.filt(vo + bed, 'highpass', 28)
    out *= np.clip((DUR - M.secs(N)) / .4, 0, 1)
    return out * .9 / np.max(np.abs(out))


def vo_loudness(x):
    """Rough integrated loudness (gated mean square of the 100 Hz high-passed voice), in LUFS-ish units."""
    k = M.filt(x, 'highpass', 100)
    blk = int(.4 * SR)
    ms = np.array([np.mean(k[:, i:i + blk] ** 2) * 2 for i in range(0, x.shape[1] - blk, blk // 4)])
    return -0.691 + 10 * np.log10(np.mean(ms[ms > 1e-7]))


if __name__ == '__main__':
    audio = build()
    M.write_wav(os.path.join(OUT, 'audio-vo.wav'), audio)
    print('wrote', os.path.join(OUT, 'audio-vo.wav'), f'{N / SR:.1f}s peak={np.max(np.abs(audio)):.3f}')
