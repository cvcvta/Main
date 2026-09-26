// Ivy spot. Every frame is a pure function of time: window.seek(t).
import { COPY, T, CAPTIONS, S16, DURATION } from './config.js';
import { E, clamp, lerp, seg, el, css, words } from './engine.js';
import { loadBrand } from './brand.js';
import { buildNight } from './night.js';
import { buildWorld } from './world.js';
import { buildEnd } from './end.js';

const brand = await loadBrand();
const root = document.documentElement.style;
for (const [k, v] of Object.entries(brand.palette)) root.setProperty(`--${k}`, v);
if (brand.iconBg) root.setProperty('--iconBg', brand.iconBg);

const stage = el('div', '', document.body);
stage.id = 'stage';
const bg = el('div', '', stage);
bg.id = 'bg';
// the homepage's near-black with deep green light pooling in, as on joinivy.ai
css(bg, { background: 'radial-gradient(1100px 760px at 74% 26%, rgba(0, 66, 37, .55), rgba(0, 66, 37, 0) 70%), radial-gradient(1300px 900px at 24% 86%, rgba(1, 43, 36, .7), rgba(1, 43, 36, 0) 72%), #151515' });

const world = buildWorld(stage, brand);

// "One platform." rides the crane down the sidebar
const sup = el('div', 'super', stage);
const supLines = COPY.platform.map((w, i) => {
  const m = el('div', '', sup);
  css(m, { overflow: 'hidden', paddingBottom: '14px', marginBottom: '-14px' });
  return el('div', i === 1 ? 'w hi' : 'w', m, w);
});

// hero captions (screen space) over a soft fade to the page colour; one word lit in leaf green
const capBg = el('div', 'abs', stage);
css(capBg, { left: '0px', top: '0px', width: '1920px', height: '1080px', background: 'linear-gradient(90deg, rgba(21,21,21,.95) 0%, rgba(21,21,21,.88) 25%, rgba(21,21,21,0) 40%)' });
const caps = COPY.captions.map(([lines, hot]) => {
  const c = el('div', 'caption', stage);
  const ws = [];
  lines.forEach((line) => {
    const m = el('div', '', c);
    css(m, { overflow: 'hidden', paddingBottom: '10px', marginBottom: '-10px' });
    const inner = el('div', '', m);
    ws.push(...words(inner, line));
  });
  ws.forEach((w) => { if (w.textContent === hot) w.classList.add('hi'); });
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
end.layout();
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
    background: `linear-gradient(${(90 + TH * 180 / Math.PI).toFixed(2)}deg, rgba(255,255,255,0) ${(46 - 20 * fl).toFixed(1)}%, rgba(214,242,226,${(0.9 * fl).toFixed(3)}) 50%, rgba(255,255,255,0) ${(54 + 20 * fl).toFixed(1)}%)`,
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
    vignette: night ? 0.62 : endc ? 0.5 : 0.34,
    grain: night ? 0.05 : endc ? 0.035 : 0.03,
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
