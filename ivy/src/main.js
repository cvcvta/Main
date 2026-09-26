// Ivy, 15 s. Every frame is a pure function of time: window.seek(t).
import { PALETTE, COPY, T, CAPTIONS, S16, DURATION } from './config.js';
import { E, clamp, lerp, seg, el, css, words } from './engine.js';
import { buildNight } from './night.js';
import { buildWorld } from './world.js';
import { buildEnd } from './end.js';

// Optional official assets: assets/brand/{logo,app-icon}.{svg,png} and brand.json {"palette": {...}}
async function loadBrand() {
  const brand = { palette: { ...PALETTE }, logo: null, icon: null };
  try {
    const r = await fetch('assets/brand/brand.json');
    if (r.ok) Object.assign(brand.palette, (await r.json()).palette || {});
  } catch { /* defaults */ }
  for (const [key, file] of [['logo', 'logo'], ['icon', 'app-icon']]) {
    for (const ext of ['svg', 'png']) {
      const url = `assets/brand/${file}.${ext}`;
      try {
        const r = await fetch(url, { method: 'HEAD' });
        if (r.ok) { brand[key] = url; break; }
      } catch { /* not provided */ }
    }
  }
  // A dark logo gets reversed on the dark end card (drop logo-light.* to control this yourself).
  if (brand.logo) brand.logoDark = await darkness(brand.logo);
  return brand;
}

async function darkness(url) {
  const im = new Image();
  im.src = url;
  await im.decode();
  const c = document.createElement('canvas');
  c.width = 64; c.height = Math.max(1, Math.round((64 * im.naturalHeight) / im.naturalWidth));
  const g = c.getContext('2d');
  g.drawImage(im, 0, 0, c.width, c.height);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let lum = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) { lum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++; }
  return n ? lum / n / 255 < 0.5 : true;
}

const brand = await loadBrand();
for (const [k, v] of Object.entries(brand.palette)) document.documentElement.style.setProperty(`--${k}`, v);

const stage = el('div', '', document.body);
stage.id = 'stage';
const bg = el('div', '', stage);
bg.id = 'bg';
css(bg, { background: 'radial-gradient(1500px 1000px at 50% 38%, #F8F7F2 0%, #F1EEE6 60%, #E7E3D8 100%)' });

const world = buildWorld(stage, brand);

// "One platform." rides the crane down the sidebar
const sup = el('div', 'super', stage);
const supLines = ['One', 'platform.'].map((w) => {
  const m = el('div', '', sup);
  css(m, { overflow: 'hidden', paddingBottom: '14px', marginBottom: '-14px' });
  const s = el('div', 'w', m, w);
  return s;
});

// hero captions (screen space) over a soft paper fade
const capBg = el('div', 'abs', stage);
css(capBg, { left: '0px', top: '0px', width: '1920px', height: '1080px', background: 'linear-gradient(90deg, rgba(244,242,236,.97) 0%, rgba(244,242,236,.93) 25%, rgba(244,242,236,0) 40%)' });
const caps = COPY.captions.map((txt) => {
  const c = el('div', 'caption', stage);
  const parts = txt === 'It already knows your business.' ? ['It already knows', 'your business.'] : txt === 'One tap to approve.' ? ['One tap', 'to approve.'] : ['Just ask', 'Ivy.'];
  const ws = [];
  parts.forEach((line) => {
    const m = el('div', '', c);
    css(m, { overflow: 'hidden', paddingBottom: '10px', marginBottom: '-10px' });
    const inner = el('div', '', m);
    ws.push(...words(inner, line));
  });
  return { c, ws };
});

const flash = el('div', '', stage);
flash.id = 'flash';
const nightA = buildNight(stage);
const nightB = buildNight(stage);
const slice = el('div', '', stage);
slice.id = 'slice';
const sliceCore = el('div', 'core', slice);
const sliceSpark = el('div', 'spark', slice);
const end = buildEnd(stage, brand);

await document.fonts.ready;
await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
world.layout();
nightA.layout();
nightB.layout();

// ---------------------------------------------------------------- the cut
const TH = (-7 * Math.PI) / 180;
const P0 = [960, 575];
const yAt = (x) => P0[1] + (x - P0[0]) * Math.tan(TH);
const clipTop = `polygon(-300px -300px, 2220px -300px, 2220px ${yAt(2220).toFixed(1)}px, -300px ${yAt(-300).toFixed(1)}px)`;
const clipBot = `polygon(-300px ${yAt(-300).toFixed(1)}px, 2220px ${yAt(2220).toFixed(1)}px, 2220px 1380px, -300px 1380px)`;
const N = [Math.sin(TH), -Math.cos(TH)];
const s0 = (-120 - P0[0]) / Math.cos(TH), s1 = (2040 - P0[0]) / Math.cos(TH);

function seek(t) {
  // night scene, split in two along the light
  const splitP = seg(t, T.split, 0.62, E.lin);
  const nightOn = t < T.split + 0.66;
  const d = 1500 * E.inCubic(splitP) + 46 * E.outCubic(clamp(splitP * 7));
  const rot = 3.2 * E.inQuad(splitP);
  css(nightA.root, { display: nightOn ? 'block' : 'none' });
  css(nightB.root, { display: nightOn && t >= T.split ? 'block' : 'none' });
  if (nightOn) {
    nightA.update(t);
    if (t >= T.split) {
      nightB.update(t);
      css(nightA.root, { clipPath: clipTop, transformOrigin: `${P0[0]}px ${P0[1]}px`, transform: `translate3d(${(N[0] * d).toFixed(2)}px, ${(N[1] * d).toFixed(2)}px, 0) rotate(${(-rot).toFixed(3)}deg)` });
      css(nightB.root, { clipPath: clipBot, transformOrigin: `${P0[0]}px ${P0[1]}px`, transform: `translate3d(${(-N[0] * d).toFixed(2)}px, ${(-N[1] * d).toFixed(2)}px, 0) rotate(${rot.toFixed(3)}deg)` });
    } else css(nightA.root, { clipPath: 'none', transform: 'none' });
  }

  // the light line
  const lp = seg(t, T.slice, T.split - T.slice, E.inOutCubic);
  const lineOn = t >= T.slice && t < T.split + 0.4;
  const len = (s1 - s0) * lp;
  const fade = 1 - seg(t, T.split + 0.05, 0.3, E.outQuad);
  css(slice, { display: lineOn ? 'block' : 'none', left: `${(P0[0] + s0 * Math.cos(TH)).toFixed(2)}px`, top: `${(P0[1] + s0 * Math.sin(TH)).toFixed(2)}px`, transform: `rotate(${(TH * 180 / Math.PI).toFixed(3)}deg)`, opacity: String(fade) });
  const tail = t < T.split ? Math.max(0, len - 1100 * (1 - 0.6 * lp)) : 0;
  css(sliceCore, { left: `${tail.toFixed(1)}px`, width: `${(len - tail).toFixed(1)}px`, height: `${(4 + 8 * seg(t, T.split, 0.1) * fade).toFixed(2)}px`, top: `${(-2 - 4 * seg(t, T.split, 0.1) * fade).toFixed(2)}px` });
  css(sliceSpark, { left: `${len.toFixed(1)}px`, opacity: String(t < T.split + 0.02 ? 1 : 0), transform: `scale(${(1 + 0.3 * Math.sin(t * 90)).toFixed(3)})` });
  const fl = seg(t, T.split, 0.04) * (1 - seg(t, T.split + 0.04, 0.45, E.outQuad));
  css(flash, {
    display: fl > 0.001 ? 'block' : 'none',
    background: `linear-gradient(${(90 + TH * 180 / Math.PI).toFixed(2)}deg, rgba(255,255,255,0) ${(46 - 20 * fl).toFixed(1)}%, rgba(255,255,255,${(0.95 * fl).toFixed(3)}) 50%, rgba(255,255,255,0) ${(54 + 20 * fl).toFixed(1)}%)`,
  });

  world.update(t);

  // "One platform."
  const supIn = (i) => seg(t, T.platform + i * S16 * 1.3, 0.5, E.snap);
  const supOut = seg(t, T.pullOut + 0.04, 0.3, E.inCubic);
  css(sup, { display: t > T.platform - 0.05 && t < T.pullOut + 0.4 ? 'block' : 'none', left: '1200px', top: '330px', opacity: String(1 - supOut), transform: `translate3d(${(-120 * supOut).toFixed(2)}px, ${(-40 * supOut).toFixed(2)}px, 0) scale(${lerp(1, 0.9, supOut).toFixed(4)})` });
  supLines.forEach((s, i) => css(s, { transform: `translate3d(0, ${(115 * (1 - supIn(i))).toFixed(2)}px, 0)` }));

  // captions
  const capVis = seg(t, CAPTIONS[0][0] - 0.1, 0.4) * (1 - seg(t, CAPTIONS[2][1] - 0.1, 0.35));
  css(capBg, { opacity: String(capVis.toFixed(3)), display: capVis > 0 ? 'block' : 'none' });
  CAPTIONS.forEach(([a, b], i) => {
    const { c, ws } = caps[i];
    const on = t > a && t < b + 0.02;
    css(c, { display: on ? 'block' : 'none', top: i === 0 ? '470px' : '400px' });
    if (!on) return;
    const out = seg(t, b - 0.2, 0.2, E.inCubic);
    ws.forEach((w, j) => {
      const p = seg(t, a + 0.04 + j * S16 * 0.55, 0.5, E.snap);
      css(w, { transform: `translate3d(0, ${(80 * (1 - p) - 80 * out).toFixed(2)}px, 0)`, opacity: String(1 - out) });
    });
  });

  end.update(t);
}

// Per-frame post settings for tools/render.mjs.
function post(t) {
  const night = t < T.split + 0.3;
  const endc = t > T.zoom + 0.25;
  const hit = (t0, a, k) => (t >= t0 ? a * Math.exp(-(t - t0) * k) : 0);
  return {
    vignette: night ? 0.62 : endc ? 0.5 : 0.16,
    grain: night ? 0.05 : endc ? 0.035 : 0.022,
    ca: hit(T.slam, 3.2, 7) + hit(T.split, 4.5, 6) + hit(T.tap, 1.6, 9) + hit(T.zoom + 0.3, 2.2, 6),
  };
}

// Motion-blur subframes: more where things move fast.
function subframes(t) {
  const within = (a, b) => t >= a && t <= b;
  if (within(T.slam - 0.08, T.slam + 0.3) || within(T.split - 0.2, T.split + 0.66) || within(T.zoom, T.zoom + 0.7)) return 16;
  if (within(T.fly - 0.05, T.land + 0.15) || within(T.morph, T.lockup + 0.1) || within(T.pullOut, T.pullOut + 0.8)) return 14;
  if (within(T.crane, T.pullOut) || within(T.pushIn, T.pushIn + 0.6) || within(T.send, T.plan + 0.5) || within(T.tap - 0.1, T.tap + 0.4)) return 10;
  if (t < T.split) return 8;
  return 6;
}

// Chromium caches paint per layer; a positioned child inside a growing overflow clip can stay stale.
// Rebuilding the layout tree every frame makes each frame independent of the frames before it.
window.seek = (t) => {
  stage.style.display = 'none';
  void stage.offsetHeight;
  stage.style.display = '';
  seek(t);
};
window.post = post;
window.subframes = subframes;
window.DURATION = DURATION;
seek(0);
window.ready = true;
