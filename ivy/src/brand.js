// Brand files: assets/brand/{logo,app-icon}.{svg,png} and an optional brand.json {"palette": {...}}.
// The logo is used as an alpha mask, so one file can be drawn in any brand colour on any background,
// cropped tight to its glyphs. The app icon is measured so the window can collapse into an exact
// rebuild of it (flat field + the same wordmark), which then hands off to the end-card lockup.
import { PALETTE, COPY } from './config.js';
import { el, css } from './engine.js';

async function exists(url) {
  try { return (await fetch(url, { method: 'HEAD' })).ok; } catch { return false; }
}

async function pixels(url, maxW = 800) {
  const im = new Image();
  im.src = url;
  await im.decode();
  const s = Math.min(1, maxW / im.naturalWidth);
  const c = document.createElement('canvas');
  c.width = Math.round(im.naturalWidth * s);
  c.height = Math.round(im.naturalHeight * s);
  const g = c.getContext('2d');
  g.drawImage(im, 0, 0, c.width, c.height);
  return { d: g.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height, W: im.naturalWidth, H: im.naturalHeight };
}

// Normalised bounding box (0..1) of the pixels that pass `hit`.
function bbox({ d, w, h }, hit) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (hit(d[i], d[i + 1], d[i + 2], d[i + 3])) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  return x1 < 0 ? null : { x0: x0 / w, y0: y0 / h, x1: (x1 + 1) / w, y1: (y1 + 1) / h };
}

export async function loadBrand() {
  const brand = { palette: { ...PALETTE }, logo: null, icon: null };
  try {
    const r = await fetch('assets/brand/brand.json');
    if (r.ok) Object.assign(brand.palette, (await r.json()).palette || {});
  } catch { /* defaults */ }
  for (const [key, file] of [['logo', 'logo'], ['icon', 'app-icon']]) {
    for (const ext of ['svg', 'png']) {
      const url = `assets/brand/${file}.${ext}`;
      if (await exists(url)) { brand[key] = url; break; }
    }
  }
  if (brand.logo) {
    const p = await pixels(brand.logo, 1400);
    brand.logoBox = bbox(p, (r, g, b, a) => a > 24) || { x0: 0, y0: 0, x1: 1, y1: 1 };
    brand.logoRatio = p.W / p.H;
  }
  if (brand.icon) {
    const p = await pixels(brand.icon, 1024);
    const d = p.d;
    brand.iconBg = `rgb(${d[0]}, ${d[1]}, ${d[2]})`; // corner pixel
    brand.iconMark = bbox(p, (r, g, b, a) => a > 128 && Math.min(r, g, b) > 200);
  }
  return brand;
}

// The logo cropped to its glyphs, `h` px tall, filled with `color`.
export function logoEl(brand, parent, h, color, cls = '') {
  if (!brand.logo) {
    const s = el('span', `wordmark ${cls}`, parent, COPY.brand);
    css(s, { fontSize: `${(h / 0.72).toFixed(2)}px`, color });
    return s;
  }
  const b = brand.logoBox;
  const gh = b.y1 - b.y0, gw = (b.x1 - b.x0) * brand.logoRatio; // glyph box in units of image height
  const k = h / gh; // px per image-height unit
  const e = el('div', `logo ${cls}`, parent);
  const url = `url(${brand.logo})`;
  const size = `${(brand.logoRatio * k).toFixed(3)}px ${k.toFixed(3)}px`;
  const pos = `${(-b.x0 * brand.logoRatio * k).toFixed(3)}px ${(-b.y0 * k).toFixed(3)}px`;
  css(e, {
    width: `${(gw * k).toFixed(3)}px`, height: `${h.toFixed(3)}px`, background: color,
    WebkitMaskImage: url, maskImage: url, WebkitMaskSize: size, maskSize: size,
    WebkitMaskPosition: pos, maskPosition: pos, WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
  });
  return e;
}

// Where the wordmark sits inside the app icon, for an icon `size` px square: [left, top, height].
export function iconMarkBox(brand, size) {
  const m = brand.iconMark || { x0: 0.236, y0: 0.412, x1: 0.789, y1: 0.596 };
  return [m.x0 * size, m.y0 * size, (m.y1 - m.y0) * size];
}

// Small icon (avatars, composer): the real file when there is one.
export function iconImg(brand, parent, cls = '') {
  if (brand.icon) {
    const i = el('img', cls, parent);
    i.src = brand.icon;
    return i;
  }
  return el('div', cls, parent);
}
