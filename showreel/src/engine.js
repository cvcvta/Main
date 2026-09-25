// Small deterministic animation toolkit: every value is a pure function of time.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const inv = (a, b, x) => clamp((x - a) / (b - a));
export const mix = (p, q, t) => p.map((v, i) => lerp(v, q[i], t));

export const E = {
  lin: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inOutQuart: (t) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  inOutQuint: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
  inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutExpo: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
  outBack: (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  inBack: (t, s = 1.7) => (s + 1) * t * t * t - s * t * t,
};

// Eased 0..1 progress of the window [t0, t0+dur].
export const seg = (t, t0, dur, ease = E.lin) => ease(inv(t0, t0 + dur, t));

// Critically-tunable damped spring, 0 -> 1 from t0 (overshoots when damp < 1).
export function spring(t, t0, freq = 3.2, damp = 0.42) {
  const x = t - t0;
  if (x <= 0) return 0;
  const w = 2 * Math.PI * freq;
  if (damp < 1) {
    const wd = w * Math.sqrt(1 - damp * damp);
    return 1 - Math.exp(-damp * w * x) * (Math.cos(wd * x) + ((damp * w) / wd) * Math.sin(wd * x));
  }
  return 1 - Math.exp(-w * x) * (1 + w * x);
}

// Hash-based value noise (deterministic).
export const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export function noise(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash(i + seed * 101.3), hash(i + 1 + seed * 101.3), u) * 2 - 1;
}

// Text "decode": characters resolve left to right out of random glyphs.
// Keeps string length stable so monospace layouts never jump.
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>';
export function decode(text, p, t, seed = 1, spread = 0.55) {
  if (p >= 1) return text;
  let out = '';
  const n = Math.max(1, text.length);
  const tick = Math.floor(t * 30);
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const start = (i / n) * spread;
    const local = (p - start) / (1 - spread);
    if (c === ' ') out += ' ';
    else if (local >= 1) out += c;
    else if (local <= 0) out += ' ';
    else out += GLYPHS[Math.floor(hash(tick * 7.13 + i * 3.7 + seed) * GLYPHS.length)];
  }
  return out;
}

// Timecode HH:MM:SS:FF
export const timecode = (t, fps = 30) => {
  const f = Math.floor(t * fps + 1e-6);
  const ff = f % fps, s = Math.floor(f / fps) % 60, m = Math.floor(f / fps / 60);
  const p = (v) => String(v).padStart(2, '0');
  return `00:${p(m)}:${p(s)}:${p(ff)}`;
};

// ---------- footage ----------
const bitmaps = new Map();
export function frameBitmap(clip, idx) {
  const key = clip + idx;
  let p = bitmaps.get(key);
  if (!p) {
    p = fetch(`build/frames/${clip}/${String(idx).padStart(5, '0')}.jpg`)
      .then((r) => r.blob())
      .then((blob) => createImageBitmap(blob));
    bitmaps.set(key, p);
    if (bitmaps.size > 360) {
      const oldest = bitmaps.keys().next().value;
      bitmaps.get(oldest).then((bm) => bm.close());
      bitmaps.delete(oldest);
    }
  }
  return p;
}

// ---------- tracking ----------
const tracks = {};
export async function loadTracks(ids) {
  await Promise.all(ids.map(async (id) => {
    tracks[id] = await (await fetch(`build/track/clip_${id}.json`)).json();
  }));
}

export const clipFrames = (clip) => (tracks[clip] ? tracks[clip].n : 0);

// Temporally smoothed face data at a source time (normalised coords), or null.
export function faceAt(clip, srcT, radius = 2) {
  const tr = tracks[clip];
  if (!tr) return null;
  const i0 = Math.round(srcT * tr.fps);
  const acc = {};
  let wsum = 0;
  for (let k = -radius; k <= radius; k++) {
    const f = tr.frames[i0 + k];
    if (!f || !f.f) continue;
    const w = 1 - Math.abs(k) / (radius + 1);
    for (const key of ['box', 'le', 're', 'nose', 'mouth', 'chin', 'brow', 'lcheek', 'rcheek']) {
      acc[key] = acc[key] || f[key].map(() => 0);
      f[key].forEach((v, j) => (acc[key][j] += v * w));
    }
    for (const [key, v] of Object.entries(f.bs || {})) acc['bs_' + key] = (acc['bs_' + key] || 0) + v * w;
    acc.mo = (acc.mo || 0) + f.mo * w;
    wsum += w;
  }
  if (!wsum) return null;
  const out = { bs: {} };
  for (const [k, v] of Object.entries(acc)) {
    if (k.startsWith('bs_')) out.bs[k.slice(3)] = v / wsum;
    else out[k] = Array.isArray(v) ? v.map((x) => x / wsum) : v / wsum;
  }
  const mid = tracks[clip].frames[i0];
  out.mesh = mid && mid.mesh ? mid.mesh : null;
  return out;
}
