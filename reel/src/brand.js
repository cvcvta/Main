// CVCVTA.AI identity: a C-ring whose mouth holds a "play" chevron (the V turned
// forward). The ring doubles as a loading spinner, which the edit uses as a motif.
import { drawChars, layoutChars } from './gfx.js';
import { TAU } from './core.js';

export const C = {
  ink: '#0B0B0C',
  paper: '#F2EEE5',
  red: '#FF4A1C',      // vermilion: the red minium painted into Roman inscriptions
  redDeep: '#D8340F',
  white: '#FFFFFF',
  sage: '#DCE4DA',
  sageInk: '#3E4A40',
  mint: '#D9F2DF',
  charcoal: '#1C1C1B',
  peach: '#FBE4D3',
  blue: '#2230FF',
  green: '#123F2E',
  gold: '#D9B43A',
  wine: '#7A1418',
  ivory: '#F4E9D8',
  yellow: '#FFE14D',
};

export const MARK = {
  inner: 0.64,
  gap: (52 * Math.PI) / 180,
  tip: [0.84, 0], back: [0.1, 0.52], notch: [0.42, 0],
};

export function ringBand(ctx, cx, cy, R, a0, a1, inner = MARK.inner) {
  ctx.beginPath();
  ctx.arc(cx, cy, R, a0, a1, false);
  ctx.arc(cx, cy, R * inner, a1, a0, true);
  ctx.closePath();
}

export function chevronPath(ctx, cx, cy, R, o = {}) {
  const s = (o.chevS ?? 1) * R;
  const [tx, ty] = MARK.tip, [bx, by] = MARK.back, [nx] = MARK.notch;
  const ox = (o.chevX ?? 0) * R, oy = (o.chevY ?? 0) * R;
  const rot = o.chevR ?? 0;
  const pts = [[tx, ty], [bx, -by], [nx, 0], [bx, by]].map(([x, y]) => {
    // scale about the chevron's own centroid-ish point so it grows in place
    const px = 0.44 + (x - 0.44) * (o.chevS ?? 1), py = y * (o.chevS ?? 1);
    const c = Math.cos(rot), sn = Math.sin(rot);
    const qx = (px - 0.44) * c - py * sn + 0.44, qy = (px - 0.44) * sn + py * c;
    return [cx + qx * R + ox, cy + qy * R + oy];
  });
  void s;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

// o: ring/chev colors, ringFrom/ringTo (radians), ringRot, ringA, chevA, chevX/Y/S/R, outline (px)
export function drawMark(ctx, cx, cy, R, o = {}) {
  const gap = o.gap ?? MARK.gap;
  const a0 = (o.ringFrom ?? gap) + (o.ringRot ?? 0);
  const a1 = (o.ringTo ?? TAU - gap) + (o.ringRot ?? 0);
  ctx.save();
  if ((o.ringA ?? 1) > 0 && a1 - a0 > 1e-3) {
    ctx.globalAlpha *= o.ringA ?? 1;
    ringBand(ctx, cx, cy, R, a0, a1, o.inner ?? MARK.inner);
    if (o.outline) { ctx.strokeStyle = o.ring ?? C.ink; ctx.lineWidth = o.outline; ctx.lineJoin = 'miter'; ctx.stroke(); }
    else { ctx.fillStyle = o.ring ?? C.ink; ctx.fill(); }
  }
  ctx.restore();
  ctx.save();
  if ((o.chevA ?? 1) > 0 && (o.chevS ?? 1) > 0.001) {
    ctx.globalAlpha *= o.chevA ?? 1;
    chevronPath(ctx, cx, cy, R, o);
    if (o.outline) { ctx.strokeStyle = o.chev ?? C.red; ctx.lineWidth = o.outline; ctx.lineJoin = 'miter'; ctx.stroke(); }
    else { ctx.fillStyle = o.chev ?? C.red; ctx.fill(); }
  }
  ctx.restore();
}

export const WORD = 'CVCVTA.AI';
export const WORD_FONT = { family: 'Unbounded', weight: 800, tracking: -0.015 };

// Wordmark with per-letter control. fn(i, ch) may return transform overrides.
export function drawWordmark(ctx, x, y, size, o = {}, fn = null) {
  const dot = o.dotColor ?? C.red;
  return drawChars(ctx, o.text || WORD, x, y, { ...WORD_FONT, size, color: o.color ?? C.ink, align: o.align ?? 'center', baseline: o.baseline ?? 'alphabetic' }, (i, ch, c) => {
    const m = fn ? fn(i, ch, c) : {};
    if (m === null) return null;
    if (ch === '.' && !m.color) m.color = dot;
    return m;
  });
}
export function wordmarkWidth(ctx, size, text = WORD) {
  return layoutChars(ctx, text, { ...WORD_FONT, size }).width;
}

// Full lockup: mark + wordmark, centered at (cx, cy). Returns geometry.
export function lockupGeom(ctx, size) {
  const R = size * 0.56;
  const ww = wordmarkWidth(ctx, size);
  const gapX = size * 0.55;
  const total = R * 2 + gapX + ww;
  return { R, ww, gapX, total };
}
