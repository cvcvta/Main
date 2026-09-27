// Core math, easing, randomness. Everything here is pure: the whole reel is a
// deterministic function of time, so frames can be rendered in any order.

export const TAU = Math.PI * 2;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, x) => clamp((x - a) / (b - a));
export const remap = (x, a0, a1, b0, b1, ease = linear) => lerp(b0, b1, ease(invLerp(a0, a1, x)));
export const smoothstep = (a, b, x) => { const t = invLerp(a, b, x); return t * t * (3 - 2 * t); };
export const fract = (x) => x - Math.floor(x);
export const mixColor = (c1, c2, t) => {
  const a = hexToRgb(c1), b = hexToRgb(c2);
  return rgbToHex(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
};
export function hexToRgb(h) {
  if (Array.isArray(h)) return h;
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const rgbToHex = (r, g, b) =>
  '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
export const rgba = (hex, a) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };

// ---------------------------------------------------------------- easing
export const linear = (t) => t;
export const inQuad = (t) => t * t;
export const outQuad = (t) => 1 - (1 - t) * (1 - t);
export const inOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const inCubic = (t) => t * t * t;
export const outCubic = (t) => 1 - Math.pow(1 - t, 3);
export const inOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const inQuart = (t) => t * t * t * t;
export const outQuart = (t) => 1 - Math.pow(1 - t, 4);
export const inOutQuart = (t) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2);
export const outQuint = (t) => 1 - Math.pow(1 - t, 5);
export const inOutQuint = (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2);
export const inExpo = (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10));
export const outExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const inOutExpo = (t) =>
  t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
export const outCirc = (t) => Math.sqrt(1 - Math.pow(t - 1, 2));
export const inOutCirc = (t) =>
  t < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
export const outBack = (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
export const inBack = (t, s = 1.70158) => (s + 1) * t * t * t - s * t * t;
export const outElastic = (t) =>
  t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1;

// CSS / After Effects style cubic-bezier easing.
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-6) break;
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0, hi = 1;
    for (let i = 0; i < 20 && Math.abs(sx(t) - x) > 1e-6; i++) {
      if (sx(t) < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}
// House curves: a snappy "motion designer" in-out, and a hard decel.
export const snap = bezier(0.7, 0, 0.12, 1);
export const swift = bezier(0.55, 0, 0.1, 1);
export const decel = bezier(0.16, 1, 0.3, 1);
export const accel = bezier(0.7, 0, 0.84, 0);
export const soft = bezier(0.45, 0, 0.2, 1);

// Damped spring from 0 -> 1. freq in Hz, damping ratio zeta (<1 overshoots).
export function spring(t, freq = 2.2, zeta = 0.45) {
  if (t <= 0) return 0;
  const w = TAU * freq;
  if (zeta < 1) {
    const wd = w * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + ((zeta * w) / wd) * Math.sin(wd * t));
  }
  return 1 - Math.exp(-w * t) * (1 + w * t);
}

// Keyframe track: keys = [[time, value, easeIntoThisKey?], ...]
export function track(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    const [t0, v0] = keys[i - 1];
    if (t <= t1) {
      const u = (t - t0) / (t1 - t0 || 1);
      const k = (e || inOutCubic)(u);
      if (Array.isArray(v0)) return v0.map((a, j) => lerp(a, v1[j], k));
      return lerp(v0, v1, k);
    }
  }
  return keys[keys.length - 1][1];
}

// Progress of a window [a, a+d] with easing.
export const win = (t, a, d, e = linear) => e(clamp((t - a) / d));

// ---------------------------------------------------------------- randomness
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hash1 = (n) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453123);
export const hash2 = (x, y) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);
export function vnoise(x) {
  const i = Math.floor(x), f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash1(i), hash1(i + 1), u) * 2 - 1;
}
export function vnoise2(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy) * 2 - 1;
}
export const fbm1 = (x, oct = 3) => {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * vnoise(x * f); f *= 2.03; a *= 0.5; }
  return s;
};
// Smooth hand-held style camera drift.
export const wobble = (t, amp = 1, speed = 1, seed = 0) => fbm1(t * speed + seed * 13.37, 3) * amp;

// Quantized scramble: returns a stable random char per (i, step).
export const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>?';
export const scrambleChar = (i, step, set = GLYPHS) => set[Math.floor(hash2(i * 1.7, step * 3.1) * set.length)];
export function scrambleText(str, prog, t, rate = 30, set = GLYPHS) {
  // prog 0..1: fraction of characters resolved (left to right)
  const n = str.length, step = Math.floor(t * rate);
  let out = '';
  for (let i = 0; i < n; i++) {
    const c = str[i];
    if (c === ' ' || i < Math.floor(prog * n)) out += c;
    else if (i < prog * n + 4) out += scrambleChar(i, step, set);
    else out += ' ';
  }
  return out;
}
