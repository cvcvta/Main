// Procedural imagery baked once and cached to assets/baked/<name>_<hash>.png.
import { Gen } from './gl.js';
import { ARCH_FS, TONE_FS, MARBLE_FS, TILE_FS, WAX_FS } from './shaders.js';
import { drawMark } from './brand.js';
import { connect, send } from './net.js';
import { hexToRgb } from './core.js';

export const A = { img: {} };
let gen = null;

function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(36);
}
function loadImage(url) {
  return new Promise((res) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = url;
  });
}
function toCanvas(src) {
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  c.getContext('2d').drawImage(src, 0, 0);
  return c;
}
const rgb = (hex) => hexToRgb(hex).map((v) => v / 255);

// Bake-or-load. render() must return a canvas of size w x h.
async function cached(name, w, h, key, render) {
  const file = `${name}_${hashStr(key + w + 'x' + h)}`;
  const im = await loadImage(`assets/baked/${file}.png`);
  if (im) return toCanvas(im);
  const t0 = performance.now();
  const c = render();
  const px = c.getContext('2d').getImageData(0, 0, w, h).data;
  await connect();
  await send(`asset:${file}:${w}:${h}`, px);
  console.log(`baked ${name} ${w}x${h} in ${(performance.now() - t0).toFixed(0)}ms`);
  return c;
}

export const ARCH = { arches: 0, colonnade: 1, plinth: 2, stairs: 3, monolith: 4, ring: 5 };
const SUNS = {
  0: [-0.55, 0.62, 0.56], 1: [0.75, 0.55, -0.3], 2: [-0.5, 0.75, 0.45],
  3: [0.25, 0.5, -0.83], 4: [0.7, 0.28, -0.5], 5: [-0.42, 0.5, -0.76],
};
export async function arch(name, w = 1280, h = 960) {
  const k = `arch_${name}`;
  if (A.img[k]) return A.img[k];
  const sc = ARCH[name];
  A.img[k] = await cached(k, w, h, ARCH_FS + sc + SUNS[sc], () =>
    gen.bake('arch', ARCH_FS, { uScene: sc, uSS: 2, uSun: SUNS[sc], uColor: 0 }, w, h));
  return A.img[k];
}
export async function archColor(name, w = 1280, h = 960) {
  const k = `archc_${name}`;
  if (A.img[k]) return A.img[k];
  const sc = ARCH[name];
  const sun = [-0.55, 0.55, 0.63];
  A.img[k] = await cached(k, w, h, ARCH_FS + 'color' + sc + sun, () =>
    gen.bake('arch', ARCH_FS, { uScene: sc, uSS: 2, uSun: sun, uColor: 1 }, w, h));
  return A.img[k];
}

// Gold wax seal with the mark pressed into it (premultiplied alpha canvas).
export async function waxSeal(size = 900) {
  if (A.img.wax) return A.img.wax;
  const mk = document.createElement('canvas');
  mk.width = mk.height = 512;
  const x = mk.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, 512, 512);
  x.filter = 'blur(4px)';
  // texture v is flipped relative to canvas y; the mark is symmetric so only x matters
  drawMark(x, 256 - 18, 256, 118, { ring: '#fff', chev: '#fff' });
  x.filter = 'none';
  A.img.wax = await cached('wax', size, size, WAX_FS + 'v3', () =>
    gen.bake('wax', WAX_FS, { uMark: gen.texture('waxmark', mk) }, size, size));
  return A.img.wax;
}

// Duotone treatments of a grayscale source. mode: 0 dither, 1 smooth, 2 halftone.
export async function tone(srcName, src, o) {
  const k = `tone_${srcName}_${o.mode}_${o.dark}_${o.light}_${o.cell || 2}_${o.contrast || 1}_${o.bright || 0}_${o.w || src.width}`;
  if (A.img[k]) return A.img[k];
  const w = o.w || src.width, h = o.h || Math.round(src.height * (w / src.width));
  A.img[k] = await cached(k.replace(/[#.]/g, ''), w, h, TONE_FS + k, () =>
    gen.bake('tone', TONE_FS, {
      uTex: gen.texture(srcName, src), uDark: rgb(o.dark), uLight: rgb(o.light), uMode: o.mode,
      uCell: o.cell || 2, uContrast: o.contrast || 1, uBright: o.bright || 0, uNoise: o.noise || 0,
    }, w, h));
  return A.img[k];
}

export async function tile(name, kind, cA, cB, cC, seed = 0, w = 800, h = 800) {
  const k = `tile_${name}`;
  if (A.img[k]) return A.img[k];
  A.img[k] = await cached(k, w, h, TILE_FS + kind + cA + cB + cC + seed, () =>
    gen.bake('tile', TILE_FS, { uKind: kind, uA: rgb(cA), uB: rgb(cB), uC: rgb(cC), uSeed: seed }, w, h));
  return A.img[k];
}

export async function initAssets(env) {
  A.env = env;
  gen = new Gen(64, 64);
  A.gen = gen;
  A.marble = await cached('marble', 1920, 1080, MARBLE_FS, () => gen.bake('marble', MARBLE_FS, {}, 1920, 1080));
  for (const n of Object.keys(ARCH)) await arch(n);
}
