// Deterministic animation toolkit: every value is a pure function of time.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const inv = (a, b, x) => clamp((x - a) / (b - a));

export const E = {
  lin: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inQuart: (t) => t ** 4,
  inOutQuart: (t) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  inOutQuint: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
  inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutExpo: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
  outBack: (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  inBack: (t, s = 1.7) => (s + 1) * t * t * t - s * t * t,
};

// CSS-style cubic-bezier easing (x1, y1, x2, y2), solved with Newton + bisection.
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u;
  const sy = (u) => ((ay * u + by) * u + cy) * u;
  const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(u) - x;
      if (Math.abs(e) < 1e-6) return sy(u);
      const d = dx(u);
      if (Math.abs(d) < 1e-6) break;
      u -= e / d;
    }
    let lo = 0, hi = 1;
    u = x;
    for (let i = 0; i < 30; i++) {
      const v = sx(u);
      if (Math.abs(v - x) < 1e-6) break;
      if (x > v) lo = u; else hi = u;
      u = (lo + hi) / 2;
    }
    return sy(u);
  };
}

// House curves. "snap" is a fast-out, long-settle UI curve; "glide" for camera moves.
E.snap = bezier(0.16, 1, 0.3, 1);
E.glide = bezier(0.65, 0, 0.25, 1);
E.whip = bezier(0.8, 0, 0.1, 1);
E.soft = bezier(0.4, 0, 0.2, 1);

// Eased 0..1 progress of the window [t0, t0 + dur].
export const seg = (t, t0, dur, ease = E.lin) => ease(inv(t0, t0 + dur, t));

// Damped spring 0 -> 1 from t0 (overshoots when damp < 1).
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

// Piecewise keyframes: [[t, value, easeIntoThisKey], ...]. Values may be numbers or arrays.
export function keys(t, list) {
  if (t <= list[0][0]) return list[0][1];
  for (let i = 1; i < list.length; i++) {
    const [t1, v1, ease = E.inOutCubic] = list[i];
    const [t0, v0] = list[i - 1];
    if (t <= t1) {
      const p = ease(inv(t0, t1, t));
      return Array.isArray(v0) ? v0.map((a, j) => lerp(a, v1[j], p)) : lerp(v0, v1, p);
    }
  }
  return list[list.length - 1][1];
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

// Decaying camera shake from t0: returns [dx, dy, rot].
export function shake(t, t0, amp = 14, decay = 9, freq = 22, seed = 1) {
  const x = t - t0;
  if (x < 0 || x > 1.2) return [0, 0, 0];
  const k = amp * Math.exp(-x * decay);
  return [noise(x * freq, seed) * k, noise(x * freq, seed + 7) * k, noise(x * freq * 0.7, seed + 13) * k * 0.04];
}

// ---------------------------------------------------------------- DOM helpers
export function el(tag, cls, parent, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}

// Only touches style properties whose value changed since the last frame.
const cache = new WeakMap();
export function css(e, props) {
  let c = cache.get(e);
  if (!c) cache.set(e, (c = {}));
  for (const k in props) {
    const v = props[k];
    if (c[k] !== v) {
      c[k] = v;
      if (k.startsWith('--')) e.style.setProperty(k, v);
      else e.style[k] = v;
    }
  }
}

export const px = (v) => `${v.toFixed(2)}px`;
export const tr = (x, y, s = 1, r = 0) => `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${s.toFixed(4)}) rotate(${r.toFixed(3)}deg)`;

// Split text into word spans (keeps spaces as real text nodes so wrapping is natural).
export function words(parent, text, cls = 'w') {
  const out = [];
  text.split(' ').forEach((w, i, all) => {
    const s = el('span', cls, parent);
    s.textContent = w;
    out.push(s);
    if (i < all.length - 1) parent.appendChild(document.createTextNode(' '));
  });
  return out;
}

// Split text into per-character spans (spaces included) for typing effects.
export function chars(parent, text, cls = 'c') {
  return [...text].map((ch) => {
    const s = el('span', cls, parent);
    s.textContent = ch;
    return s;
  });
}
