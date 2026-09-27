// Reusable 2D effects: perspective flips, bloom, carving/embossing, textures.
import { canvas, font } from './gfx.js';
import { mulberry32, clamp } from './core.js';

// Draw img rotated about its vertical axis with perspective (vertical strips).
// Shows `back` (if given) when the card faces away.
export function drawFlipY(ctx, img, cx, cy, w, h, angle, o = {}) {
  const persp = o.persp ?? 0.0011;
  const strips = o.strips ?? 64;
  let a = angle;
  let src = img;
  const c0 = Math.cos(a);
  if (c0 < 0) { a = angle + Math.PI; if (o.back) src = o.back; }
  const cos = Math.cos(a), sin = Math.sin(a);
  if (Math.abs(cos) < 0.004) return;
  for (let i = 0; i < strips; i++) {
    const u0 = i / strips, u1 = (i + 1) / strips;
    const x0 = (u0 - 0.5) * w, x1 = (u1 - 0.5) * w;
    const s0 = 1 / (1 + x0 * sin * persp), s1 = 1 / (1 + x1 * sin * persp);
    const X0 = x0 * cos * s0, X1 = x1 * cos * s1;
    const hh = h * (s0 + s1) * 0.5;
    const L = Math.min(X0, X1), Wd = Math.abs(X1 - X0);
    ctx.drawImage(src, u0 * src.width, 0, src.width / strips, src.height, cx + L - 0.35, cy - hh / 2, Wd + 0.7, hh);
  }
}

// Same idea around the horizontal axis (for tilting cards / flipping down).
export function drawFlipX(ctx, img, cx, cy, w, h, angle, o = {}) {
  const persp = o.persp ?? 0.0011;
  const strips = o.strips ?? 64;
  let a = angle, src = img;
  if (Math.cos(a) < 0) { a = angle + Math.PI; if (o.back) src = o.back; }
  const cos = Math.cos(a), sin = Math.sin(a);
  if (Math.abs(cos) < 0.004) return;
  for (let i = 0; i < strips; i++) {
    const v0 = i / strips, v1 = (i + 1) / strips;
    const y0 = (v0 - 0.5) * h, y1 = (v1 - 0.5) * h;
    const s0 = 1 / (1 + y0 * sin * persp), s1 = 1 / (1 + y1 * sin * persp);
    const Y0 = y0 * cos * s0, Y1 = y1 * cos * s1;
    const ww = w * (s0 + s1) * 0.5;
    ctx.drawImage(src, 0, v0 * src.height, src.width, src.height / strips, cx - ww / 2, cy + Math.min(Y0, Y1) - 0.35, ww, Math.abs(Y1 - Y0) + 0.7);
  }
}

// Bloom: draw a layer blurred + additive, then sharp.
export function bloom(ctx, layer, amount = 0.7, radius = 10) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = amount;
  ctx.filter = `blur(${radius}px)`;
  ctx.drawImage(layer, 0, 0, 1920, 1080);
  ctx.filter = 'none';
  ctx.restore();
  ctx.drawImage(layer, 0, 0, 1920, 1080);
}

// Mask canvas from a draw callback (white shape on transparent).
export function maskFrom(w, h, draw) {
  const c = canvas(w, h), x = c.getContext('2d');
  x.fillStyle = '#fff';
  draw(x);
  return c;
}

// Carve a mask into a surface: paint fill + inner shadow + edge highlight.
export function carve(surface, mask, o = {}) {
  const w = surface.width, h = surface.height;
  const out = canvas(w, h), x = out.getContext('2d');
  x.drawImage(surface, 0, 0);
  // recessed fill (paint or darker stone)
  const fill = canvas(w, h), f = fill.getContext('2d');
  f.drawImage(mask, 0, 0);
  f.globalCompositeOperation = 'source-in';
  f.fillStyle = o.fill || 'rgba(0,0,0,0.25)';
  f.fillRect(0, 0, w, h);
  if (o.texture) { f.globalCompositeOperation = 'multiply'; f.globalAlpha = o.textureAlpha ?? 0.35; f.drawImage(o.texture, 0, 0, w, h); f.globalAlpha = 1; }
  // inner shadow: inverted mask with a drop shadow, kept only inside the mask
  const inv = canvas(w, h), iv = inv.getContext('2d');
  iv.fillStyle = '#000'; iv.fillRect(0, 0, w, h);
  iv.globalCompositeOperation = 'destination-out'; iv.drawImage(mask, 0, 0);
  const sh = canvas(w, h), s = sh.getContext('2d');
  s.shadowColor = o.shadow || 'rgba(0,0,0,0.75)';
  s.shadowBlur = o.blur ?? 6; s.shadowOffsetX = o.dx ?? 4; s.shadowOffsetY = o.dy ?? 6;
  s.drawImage(inv, 0, 0);
  s.shadowColor = o.light || 'rgba(255,255,255,0.55)';
  s.shadowOffsetX = -(o.dx ?? 4) * 0.6; s.shadowOffsetY = -(o.dy ?? 6) * 0.6; s.shadowBlur = (o.blur ?? 6) * 0.6;
  s.globalCompositeOperation = 'source-over';
  s.drawImage(inv, 0, 0);
  s.globalCompositeOperation = 'destination-in';
  s.drawImage(mask, 0, 0);
  // clear the solid inverse itself (keep only its cast shadows inside the mask)
  f.globalCompositeOperation = 'source-over';
  f.drawImage(sh, 0, 0);
  f.globalCompositeOperation = 'destination-in';
  f.drawImage(mask, 0, 0);
  x.drawImage(fill, 0, 0);
  // bevel highlight on the lower-right lip outside the cut
  if (o.lip !== false) {
    const lip = canvas(w, h), l = lip.getContext('2d');
    l.shadowColor = o.lipColor || 'rgba(255,255,255,0.5)';
    l.shadowOffsetX = 2; l.shadowOffsetY = 2.5; l.shadowBlur = 2;
    l.drawImage(mask, 0, 0);
    l.shadowColor = 'transparent';
    l.globalCompositeOperation = 'destination-out';
    l.drawImage(mask, 0, 0);
    x.globalAlpha = 0.8;
    x.drawImage(lip, 0, 0);
    x.globalAlpha = 1;
  }
  return out;
}

// Blind emboss: raised shape, same color as the surface, lit from the top-left.
export function emboss(surface, mask, o = {}) {
  const w = surface.width, h = surface.height;
  const out = canvas(w, h), x = out.getContext('2d');
  x.drawImage(surface, 0, 0);
  const d = o.depth ?? 3;
  const layer = (color, dx, dy, blur) => {
    const c = canvas(w, h), g = c.getContext('2d');
    g.shadowColor = color; g.shadowOffsetX = dx; g.shadowOffsetY = dy; g.shadowBlur = blur;
    g.drawImage(mask, 0, 0);
    g.shadowColor = 'transparent';
    g.globalCompositeOperation = 'destination-out';
    g.drawImage(mask, 0, 0);
    return c;
  };
  x.drawImage(layer(o.shadow || 'rgba(40,30,20,0.42)', d, d * 1.3, d * 1.6), 0, 0);
  x.drawImage(layer(o.light || 'rgba(255,255,255,0.9)', -d * 0.8, -d, d), 0, 0);
  // subtle top-face shading
  const face = canvas(w, h), fc = face.getContext('2d');
  fc.drawImage(mask, 0, 0);
  fc.globalCompositeOperation = 'source-in';
  const gr = fc.createLinearGradient(0, 0, w * 0.4, h);
  gr.addColorStop(0, 'rgba(255,255,255,0.18)');
  gr.addColorStop(1, 'rgba(0,0,0,0.05)');
  fc.fillStyle = gr; fc.fillRect(0, 0, w, h);
  x.drawImage(face, 0, 0);
  return out;
}

// Paper/fiber texture in a base color.
export function paper(w, h, base, seed = 7, o = {}) {
  const c = canvas(w, h), x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  const id = x.getImageData(0, 0, c.width, c.height);
  const r = mulberry32(seed);
  const amt = o.noise ?? 10;
  for (let i = 0; i < id.data.length; i += 4) {
    const n = (r() - 0.5) * amt;
    id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n;
  }
  x.putImageData(id, 0, 0);
  // fibers
  x.globalAlpha = o.fiberAlpha ?? 0.06;
  x.strokeStyle = o.fiber || '#000';
  x.lineWidth = 1;
  for (let i = 0; i < (o.fibers ?? 900); i++) {
    const px = r() * w, py = r() * h, a = r() * Math.PI, L = 4 + r() * 16;
    x.beginPath(); x.moveTo(px, py);
    x.quadraticCurveTo(px + Math.cos(a) * L * 0.5 + (r() - 0.5) * 4, py + Math.sin(a) * L * 0.5 + (r() - 0.5) * 4, px + Math.cos(a) * L, py + Math.sin(a) * L);
    x.stroke();
  }
  x.globalAlpha = 1;
  // soft blotches
  for (let i = 0; i < 40; i++) {
    const bx = r() * w, by = r() * h;
    const g = x.createRadialGradient(bx, by, 0, bx, by, 80 + r() * 220);
    g.addColorStop(0, `rgba(0,0,0,${0.012 + r() * 0.02})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  }
  return c;
}

// Film-style dust/scratches overlay for gritty frames.
export function speckle(w, h, seed, count = 300, color = '#fff') {
  const c = canvas(w, h), x = c.getContext('2d');
  const r = mulberry32(seed);
  x.fillStyle = color;
  for (let i = 0; i < count; i++) { const s = r() * 2.2 + 0.4; x.globalAlpha = 0.2 + r() * 0.6; x.fillRect(r() * w, r() * h, s, s); }
  return c;
}

// Text as a mask canvas (for carving etc.)
export function textMask(w, h, str, o) {
  return maskFrom(w, h, (x) => {
    font(x, o.family, o.size, o.weight || 400, o.style || 'normal', (o.tracking || 0) * o.size);
    x.textAlign = o.align || 'center';
    x.textBaseline = o.baseline || 'alphabetic';
    x.fillText(str, o.x, o.y);
  });
}

export const clamp01 = clamp;
