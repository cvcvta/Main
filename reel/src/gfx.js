// 2D drawing helpers shared by every scene.
import { clamp, mulberry32, TAU } from './core.js';

export const W = 1920, H = 1080;

export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

export function font(ctx, family, size, weight = 400, style = 'normal', tracking = 0) {
  ctx.font = `${style} ${weight} ${size}px "${family}"`;
  ctx.letterSpacing = `${tracking}px`;
  ctx.fontKerning = 'normal';
  ctx.textRendering = 'geometricPrecision';
}

export function text(ctx, str, x, y, o = {}) {
  font(ctx, o.family || 'Inter Tight', o.size || 40, o.weight || 500, o.style || 'normal', (o.tracking || 0) * (o.size || 40));
  ctx.fillStyle = o.color || '#000';
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.baseline || 'alphabetic';
  if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lineWidth || 2; ctx.strokeText(str, x, y); }
  else ctx.fillText(str, x, y);
  ctx.letterSpacing = '0px';
}

export function measure(ctx, str, o = {}) {
  font(ctx, o.family || 'Inter Tight', o.size || 40, o.weight || 500, o.style || 'normal', (o.tracking || 0) * (o.size || 40));
  const w = ctx.measureText(str).width;
  ctx.letterSpacing = '0px';
  return w;
}

// Per-character layout that keeps kerning: x of glyph i = advance of str[0..i).
export function layoutChars(ctx, str, o = {}) {
  font(ctx, o.family || 'Inter Tight', o.size || 40, o.weight || 500, o.style || 'normal', (o.tracking || 0) * (o.size || 40));
  const out = [];
  for (let i = 0; i < str.length; i++) {
    const x0 = ctx.measureText(str.slice(0, i)).width;
    const x1 = ctx.measureText(str.slice(0, i + 1)).width;
    const wi = ctx.measureText(str[i]).width;
    out.push({ ch: str[i], x: x0, w: wi, adv: x1 - x0 });
  }
  const total = ctx.measureText(str).width;
  ctx.letterSpacing = '0px';
  return { chars: out, width: total };
}

// Draw characters individually. fn(i, ch) -> { dx, dy, s, r, a, color } or null to skip.
export function drawChars(ctx, str, x, y, o = {}, fn = null) {
  const L = layoutChars(ctx, str, o);
  const align = o.align || 'left';
  const ox = align === 'center' ? -L.width / 2 : align === 'right' ? -L.width : 0;
  font(ctx, o.family || 'Inter Tight', o.size || 40, o.weight || 500, o.style || 'normal', 0);
  ctx.textAlign = 'left';
  ctx.textBaseline = o.baseline || 'alphabetic';
  L.chars.forEach((c, i) => {
    if (c.ch === ' ') return;
    const m = fn ? fn(i, c.ch, c) : {};
    if (m === null) return;
    const s = m.s ?? 1;
    ctx.save();
    ctx.globalAlpha *= m.a ?? 1;
    ctx.translate(x + ox + c.x + c.w / 2 + (m.dx || 0), y + (m.dy || 0));
    if (m.r) ctx.rotate(m.r);
    if (s !== 1 || m.sx || m.sy) ctx.scale(m.sx ?? s, m.sy ?? s);
    ctx.fillStyle = m.color || o.color || '#000';
    if (m.stroke || o.stroke) { ctx.strokeStyle = m.stroke || o.stroke; ctx.lineWidth = o.lineWidth || 2; ctx.strokeText(c.ch, -c.w / 2, 0); }
    else ctx.fillText(c.ch, -c.w / 2, 0);
    ctx.restore();
  });
  return L;
}

export function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function fillBg(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(-10, -10, W + 20, H + 20);
}

// Draw an image covering a rect (like CSS object-fit: cover), optional zoom/pan.
export function cover(ctx, img, x, y, w, h, zoom = 1, px = 0.5, py = 0.5) {
  const iw = img.width, ih = img.height;
  const s = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * s, dh = ih * s;
  ctx.drawImage(img, x + (w - dw) * px, y + (h - dh) * py, dw, dh);
}

// Clip helpers
export function clipRect(ctx, x, y, w, h) { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); }

// Camera: scale about a point + offset.
export function camera(ctx, { x = W / 2, y = H / 2, zoom = 1, rot = 0, dx = 0, dy = 0 } = {}) {
  ctx.translate(x + dx, y + dy);
  ctx.rotate(rot);
  ctx.scale(zoom, zoom);
  ctx.translate(-x, -y);
}

// Soft drop shadow wrapper.
export function shadow(ctx, blur, oy = 0, color = 'rgba(0,0,0,0.35)', ox = 0) {
  ctx.shadowBlur = blur; ctx.shadowOffsetY = oy; ctx.shadowOffsetX = ox; ctx.shadowColor = color;
}
export function noShadow(ctx) { ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.shadowColor = 'transparent'; }

// Static noise canvas (value per pixel), useful for paper grain / denoise effect.
export function noiseCanvas(w, h, seed = 1, mono = true, alpha = 255) {
  const c = canvas(w, h), x = c.getContext('2d');
  const id = x.createImageData(c.width, c.height);
  const r = mulberry32(seed);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = r() * 255;
    id.data[i] = v; id.data[i + 1] = mono ? v : r() * 255; id.data[i + 2] = mono ? v : r() * 255; id.data[i + 3] = alpha;
  }
  x.putImageData(id, 0, 0);
  return c;
}

// Polyline stroke reveal: draws the first `p` (0..1) of a path given as points.
export function strokePartial(ctx, pts, p) {
  if (p <= 0) return;
  let total = 0;
  const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); total += d; }
  let left = total * clamp(p);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const d = seg[i - 1];
    if (left >= d) { ctx.lineTo(pts[i][0], pts[i][1]); left -= d; }
    else { const k = left / d; ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k); break; }
  }
  ctx.stroke();
}

// Arc stroke from a0 sweeping by `sweep` radians.
export function arcStroke(ctx, x, y, r, a0, sweep) {
  if (Math.abs(sweep) < 1e-4) return;
  ctx.beginPath();
  ctx.arc(x, y, r, a0, a0 + sweep, sweep < 0);
  ctx.stroke();
}

export function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); }

// Text wrapped into lines of a max width, returns array of strings.
export function wrap(ctx, str, maxW, o) {
  font(ctx, o.family, o.size, o.weight, o.style || 'normal', (o.tracking || 0) * o.size);
  const words = str.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  ctx.letterSpacing = '0px';
  return lines;
}
