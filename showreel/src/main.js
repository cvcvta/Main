// CVCVTA showreel: one deterministic scene, rendered frame by frame via window.seek(t).
import * as C from './config.js';
import { clamp, lerp, E, spring, noise, hash, decode, timecode, frameBitmap, loadTracks, faceAt, clipFrames } from './engine.js';

const { W, H, BEAT, S16, T, CARDS, SUBJECTS, CLIPS, SRC_FPS } = C;
const BG = '#0b0b0c';
const ink = (a) => `rgba(243,240,232,${a})`;
const red = (a) => `rgba(255,59,47,${a})`;
const MONO = '"JetBrains Mono"';

const cv = document.getElementById('fx');
const ctx = cv.getContext('2d');
const camEl = document.getElementById('cam');
const fg = document.getElementById('fg');
const ui = document.getElementById('ui');
const layer = document.createElement('canvas');
const mask = document.createElement('canvas');

function el(tag, cls, parent = fg, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  parent.appendChild(e);
  return e;
}
const css = (e, o) => Object.assign(e.style, o);
function vis(e, a) {
  e.style.opacity = a.toFixed(4);
  e.style.visibility = a <= 0.002 ? 'hidden' : 'visible';
}
const setText = (e, s) => { if (e.textContent !== s) e.textContent = s; };

// ---------------------------------------------------------------- geometry
const CW = 240, CH = 427, GAP = 28, X0 = (W - (6 * CW + 5 * GAP)) / 2, CY = 392;
const slot = (i) => ({ x: X0 + i * (CW + GAP), y: CY, w: CW, h: CH, r: 16 });
const PANEL = { x: 696, y: 72, w: 528, h: 936, r: 22 };
const lerpRect = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p), r: lerp(a.r, b.r, p) });
const inflate = (r, d) => ({ x: r.x - d, y: r.y - d, w: r.w + 2 * d, h: r.h + 2 * d, r: (r.r || 0) + d });
const subjEnd = (k) => (k < 4 ? T.subj[k + 1] : T.pull);
const srcIdx = (clip, s) => clamp(Math.floor(s * SRC_FPS + 1e-4), 0, clipFrames(clip) - 1);
function subjIndex(t) {
  let k = -1;
  for (let i = 0; i < T.subj.length; i++) if (t >= T.subj[i]) k = i;
  return k;
}
function rr(c, r) {
  c.beginPath();
  c.roundRect(r.x, r.y, r.w, r.h, Math.max(0, r.r || 0));
}

// Where a card's footage is in its source clip at reel time t.
function cardSrc(i, t) {
  const c = CARDS[i];
  if (t < T.pull) return c.lin + t;
  const held = T.reveal - T.pull;
  if (t < T.reveal) return c.ret + (t - T.pull);
  if (t < T.brand) return c.ret + held; // freeze-frame: "caught"
  return c.ret + held + (t - T.brand);
}

// cover-fit a bitmap into rect r around a focus point; returns the mapping for HUD work
function cover(c, bmp, r, focus = [0.5, 0.5], zoom = 1, glitch = 0, seed = 0, t = 0) {
  const sw = bmp.width, sh = bmp.height;
  const s = Math.max(r.w / sw, r.h / sh) * Math.max(1, zoom);
  const vw = r.w / s, vh = r.h / s;
  const sx = clamp(focus[0] * sw - vw / 2, 0, sw - vw);
  const sy = clamp(focus[1] * sh - vh / 2, 0, sh - vh);
  if (glitch > 0.02) {
    const n = 11;
    for (let j = 0; j < n; j++) {
      const off = (hash(seed * 13 + j * 7.7 + Math.floor(t * 30)) - 0.5) * 70 * glitch;
      const y0 = (j / n) * r.h, hh = r.h / n + 1;
      c.drawImage(bmp, sx, sy + (y0 / r.h) * vh, vw, (hh / r.h) * vh, r.x + off, r.y + y0, r.w, hh);
    }
  } else {
    c.drawImage(bmp, sx, sy, vw, vh, r.x, r.y, r.w, r.h);
  }
  return { sx, sy, s, r, sw, sh };
}
const mapPt = (m, u, v) => [m.r.x + (u * m.sw - m.sx) * m.s, m.r.y + (v * m.sh - m.sy) * m.s];

// ---------------------------------------------------------------- wordmark
const WM = { size: 268, track: 0.02, letters: [], dot: null };
function brandFont(c) {
  c.font = `900 ${WM.size}px Archivo`;
  c.fontStretch = 'expanded';
  c.textBaseline = 'alphabetic';
}
function layoutWordmark() {
  ctx.save();
  brandFont(ctx);
  const word = C.BRAND, S = WM.size, tr = S * WM.track;
  const xs = [];
  for (let i = 0; i < word.length; i++) {
    xs.push(ctx.measureText(word.slice(0, i + 1)).width - ctx.measureText(word[i]).width + i * tr);
  }
  const total = ctx.measureText(word).width + (word.length - 1) * tr;
  const capH = ctx.measureText('H').actualBoundingBoxAscent;
  const dotD = S * 0.16, dotGap = S * 0.05;
  const x0 = (W - (total + dotGap + dotD)) / 2;
  const baseline = Math.round(478 + capH / 2);
  WM.letters = [...word].map((ch, i) => {
    const m = ctx.measureText(ch);
    const x = x0 + xs[i];
    return {
      ch, x, baseline,
      bb: { x: x - m.actualBoundingBoxLeft, y: baseline - m.actualBoundingBoxAscent, w: m.actualBoundingBoxLeft + m.actualBoundingBoxRight, h: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent },
    };
  });
  WM.dot = { x: x0 + total + dotGap + dotD / 2, y: baseline - dotD / 2, d: dotD };
  WM.left = x0; WM.right = x0 + total + dotGap + dotD; WM.top = baseline - capH; WM.bottom = baseline;
  ctx.restore();
}

// ---------------------------------------------------------------- DOM
const D = {};
function buildDOM() {
  // chrome
  D.tl = el('div', 'mono chrome', ui, `<b>${C.BRAND}</b><span class="sep">/</span>SHOWREEL ’26`);
  css(D.tl, { left: '48px', top: '38px' });
  D.tr = el('div', 'mono chrome', ui);
  css(D.tr, { left: '1706px', top: '38px', color: 'var(--ink)' });
  D.bl = el('div', 'mono chrome', ui);
  css(D.bl, { left: '48px', top: '1026px' });
  D.bars = el('div', 'bars', ui);
  css(D.bars, { left: `${1920 - 48 - 8 * 16 - 7 * 5}px`, top: '1032px' });
  D.barEls = [...Array(8)].map(() => el('i', '', D.bars));
  const cs = [[24, 24, 'Top', 'Left'], [1920 - 46, 24, 'Top', 'Right'], [24, 1080 - 46, 'Bottom', 'Left'], [1920 - 46, 1080 - 46, 'Bottom', 'Right']];
  for (const [x, y, a, b2] of cs) {
    const c = el('div', 'corner', ui);
    css(c, { left: `${x}px`, top: `${y}px`, [`border${a}Width`]: '1.5px', [`border${b2}Width`]: '1.5px' });
  }

  // hook
  D.hook = el('div', 'hook');
  D.words = C.HOOK.map((w, i) => el('span', 'hwi' + (i === C.HOOK.length - 1 ? ' ai' : ''), el('span', 'hw', D.hook), w));
  D.sub = el('div', 'mono center');
  css(D.sub, { top: '322px', fontSize: '13px', letterSpacing: '0.3em' });

  // card labels + verdict tags
  D.clabels = CARDS.map((c, i) => el('div', 'mono clabel', fg, `<span>0${i + 1}</span>${c.tag}`));
  D.vtags = CARDS.map(() => el('div', 'mono vtag'));
  D.summary = el('div', 'mono center summary');
  css(D.summary, { top: '336px' });
  D.strike = el('div', '');
  css(D.strike, { left: '770px', top: '343px', width: '380px', height: '3px', background: 'var(--red)', transformOrigin: '0 50%' });

  // montage: left column
  D.left = el('div', 'col');
  css(D.left, { left: '150px' });
  D.sLbl = el('div', 'mono', D.left, 'SUBJECT');
  css(D.sLbl, { position: 'absolute', left: '4px', top: '150px', fontSize: '13px' });
  D.big = el('div', 'big', D.left);
  css(D.big, { position: 'absolute', left: '-10px', top: '172px' });
  el('span', '', D.big, '0');
  D.odo = el('div', '', el('span', 'odo', D.big));
  for (let d = 0; d <= 9; d++) el('span', '', D.odo, String(d));
  D.of = el('div', 'mono', D.left, '/ 06');
  css(D.of, { position: 'absolute', left: '316px', top: '198px', fontSize: '15px' });
  D.cat = el('div', 'cat', D.left);
  css(D.cat, { position: 'absolute', left: '0px', top: '440px', whiteSpace: 'nowrap' });
  D.meta = [...Array(5)].map((_, j) => {
    const m = el('div', 'mono', D.left);
    css(m, { position: 'absolute', left: '4px', top: `${560 + j * 30}px` });
    return m;
  });
  D.redact = el('div', '', D.left);
  css(D.redact, { position: 'absolute', left: '123px', top: `${560 + 4 * 30 + 2}px`, width: '150px', height: '12px', background: 'var(--ink)', transformOrigin: '0 0' });

  // montage: right column
  D.right = el('div', 'col');
  css(D.right, { left: '1290px' });
  D.hdr = el('div', 'mono', D.right, 'FORENSIC CHECK');
  css(D.hdr, { position: 'absolute', left: '0px', top: '150px', fontSize: '13px' });
  D.hdrSq = el('div', '', D.right);
  css(D.hdrSq, { position: 'absolute', left: '466px', top: '152px', width: '10px', height: '10px', background: 'var(--red)' });
  D.rows = [0, 1, 2].map((j) => {
    const r = el('div', 'mono row', D.right);
    css(r, { position: 'absolute', left: '0px', top: `${200 + j * 48}px` });
    const lab = el('span', '', r), lead = el('span', 'lead', r), val = el('span', 'val', r);
    const trk = el('div', 'track', D.right);
    css(trk, { position: 'absolute', left: '0px', top: `${230 + j * 48}px`, width: '480px' });
    const fill = el('div', 'fill', trk);
    return { r, lab, lead, val, fill };
  });
  D.teleT = el('div', 'mono', D.right, 'EXPRESSION TELEMETRY · LIVE');
  css(D.teleT, { position: 'absolute', left: '0px', top: '372px' });
  D.tele = el('div', 'tele', D.right);
  css(D.tele, { position: 'absolute', left: '0px', top: '404px' });
  D.teleRows = ['jaw', 'smile', 'brow', 'blink', 'squint', 'pucker'].map((k) => {
    const r = el('div', 'tr mono', D.tele);
    const l = el('div', 'tl', r, k.toUpperCase());
    const tt = el('div', 'tt', r);
    const f = el('div', 'tf', tt);
    const v = el('div', 'tv', r);
    return { k, f, v, l };
  });
  D.vLbl = el('div', 'mono', D.right, 'VERDICT');
  css(D.vLbl, { position: 'absolute', left: '0px', top: '646px', fontSize: '13px' });
  D.verdict = el('div', 'verdict', D.right, 'HUMAN');
  css(D.verdict, { position: 'absolute', left: '-6px', top: '676px', transformOrigin: '0 100%' });
  D.conf = el('div', 'mono row', D.right);
  css(D.conf, { position: 'absolute', left: '0px', top: '822px' });
  D.confL = el('span', '', D.conf, 'CONFIDENCE');
  el('span', 'lead', D.conf);
  D.confV = el('span', 'val', D.conf);
  const ct = el('div', 'track', D.right);
  css(ct, { position: 'absolute', left: '0px', top: '852px', width: '480px' });
  D.confFill = el('div', 'fill', ct);

  D.panTop = el('div', 'mono');
  css(D.panTop, { left: `${PANEL.x}px`, top: '46px', width: `${PANEL.w}px`, display: 'flex', justifyContent: 'space-between', fontSize: '11px' });
  D.panTopL = el('span', '', D.panTop);
  D.panTopR = el('span', '', D.panTop);
  D.panBot = el('div', 'mono');
  css(D.panBot, { left: `${PANEL.x}px`, top: '1020px', width: `${PANEL.w}px`, display: 'flex', justifyContent: 'space-between', fontSize: '11px' });
  D.panBotL = el('span', '', D.panBot);
  D.panBotR = el('span', '', D.panBot);

  // verdict reveal + slam
  D.corr = el('div', 'mono center');
  css(D.corr, { top: '334px', color: 'var(--red)', fontSize: '15px', letterSpacing: '0.34em' });
  D.slam = el('div', 'slam');
  D.slamParts = [el('span', 'g', D.slam, 'ALL'), el('span', 's', D.slam, 'of'), el('span', 'g', D.slam, 'THEM<span class="dot">.</span>')];

  // brand
  D.tag1 = el('div', 'mono center tag1');
  css(D.tag1, { top: '664px' });
  D.tag2w = el('div', 'center');
  css(D.tag2w, { top: '706px', overflow: 'hidden', paddingBottom: '12px' });
  D.tag2 = el('div', 'mono tag2', D.tag2w, C.TAGLINE);
  D.ring = el('div', '', ui);
  css(D.ring, { borderRadius: '50%', border: '2px solid var(--red)', left: '0px', top: '0px' });

  D.dot = el('div', 'recdot', ui);
}

// ---------------------------------------------------------------- scene state
function cardState(i, t) {
  const st = { rect: slot(i), alpha: 1, dim: 0, blur: 0, scale: 1, rot: 0, dx: 0, dy: 0, outline: 0, glitch: 0, zoom: 1 };
  if (t < T.dive) {
    const te = 0.05 + i * 0.055;
    const pe = clamp((t - te) / 0.9);
    const e = E.outExpo(pe);
    st.dy = (1 - e) * 170;
    st.alpha = clamp(pe * 4);
    st.blur = (1 - E.outCubic(pe)) * 16;
    st.scale = lerp(0.84, 1, e);
    st.rot = (1 - e) * (i - 2.5) * -2.4;
    st.zoom = lerp(1.22, 1.0, E.outCubic(clamp((t - te) / 1.7)));
    if (t >= T.hopStart) {
      const h = Math.min(T.hops.length - 1, Math.floor((t - T.hopStart) / S16));
      const since = t - (T.hopStart + h * S16);
      if (i === T.hops[h]) {
        const k = E.outExpo(clamp(since / 0.08));
        st.scale *= lerp(1.0, 1.05, k);
        st.dy -= 12 * k;
      } else st.dim = 0.55 * E.outCubic(clamp((t - T.hopStart) / 0.1));
    }
    return st;
  }
  if (t < T.dive + 0.45) {
    if (i === 0) return null;
    const q = E.outCubic(clamp((t - T.dive + 0.02) / 0.3));
    st.dx = q * (260 + 90 * i);
    st.dy = q * 40;
    st.alpha = 1 - E.inQuad(q);
    st.blur = q * 22;
    st.scale = 1 - 0.14 * q;
    st.dim = 0.55 + 0.3 * q;
    return st.alpha > 0.004 ? st : null;
  }
  if (t < T.pull) return null;
  if (i === 5 && t < T.pull + 0.42) return null; // the scan panel is landing in this slot
  if (i !== 5) {
    const te = T.pull + 0.1 + [4, 3, 2, 1, 0].indexOf(i) * 0.05;
    const pe = clamp((t - te) / 0.6);
    const e = E.outExpo(pe);
    st.dx = (1 - e) * 60;
    st.dy = (1 - e) * 130;
    st.alpha = clamp(pe * 4);
    st.blur = (1 - E.outCubic(pe)) * 14;
    st.scale = lerp(0.86, 1, e);
  }
  if (t >= T.reveal) {
    const tf = T.flip(i);
    if (t >= tf) {
      st.outline = E.outExpo(clamp((t - tf) / 0.1));
      st.glitch = 1 - clamp((t - tf) / 0.1);
    }
    const ds = E.outCubic(clamp((t - (T.slam - 0.04)) / 0.22));
    st.outline *= 1 - 0.6 * ds;
    st.dim = 0.74 * ds;
    st.blur = Math.max(st.blur, 7 * ds);
  }
  return st;
}

function panelState(t) {
  if (t < T.dive || t >= T.pull + 0.42) return null;
  let rect = PANEL;
  if (t < T.dive + 0.4) rect = lerpRect(slot(0), PANEL, E.inOutQuart(clamp((t - T.dive) / 0.4)));
  const pp = t >= T.pull ? E.inOutQuart(clamp((t - T.pull) / 0.42)) : 0;
  if (t >= T.pull) rect = lerpRect(PANEL, slot(5), pp);
  const k = subjIndex(t);
  let clip, src, zoom = 1, focus;
  if (k < 0) {
    clip = CARDS[0].clip; src = cardSrc(0, t); focus = CARDS[0].focus;
  } else {
    const s = SUBJECTS[k], u = t - T.subj[k], Dk = subjEnd(k) - T.subj[k];
    clip = s.clip; src = s.t + u; focus = s.focus;
    zoom = s.zoom * (1 + 0.035 * clamp(u / Dk)) * (1 + 0.09 * (1 - E.outExpo(clamp(u / 0.45))));
    if (pp > 0) {
      zoom = lerp(zoom, 1, pp);
      focus = [lerp(focus[0], CARDS[5].focus[0], pp), lerp(focus[1], CARDS[5].focus[1], pp)];
    }
  }
  const flash = k >= 0 ? 0.32 * (1 - clamp((t - T.subj[k]) / 0.1)) : 0;
  return { rect, clip, src, zoom, focus, flash, k };
}

function letterState(i, t) {
  const L = WM.letters[i];
  const d = i * 0.03;
  const pr = E.inOutCubic(clamp((t - T.brand - d) / 0.4));
  const pw = E.inOutCubic(clamp((t - T.brand - 0.02 - d) / 0.56));
  const from = slot(i);
  const to = { x: L.bb.x - 18, y: L.bb.y - 18, w: L.bb.w + 36, h: L.bb.h + 36, r: 6 };
  const rect = lerpRect(from, to, pr);
  const bcx = L.bb.x + L.bb.w / 2, bcy = L.bb.y + L.bb.h / 2;
  const off = [(from.x + from.w / 2 - bcx) * (1 - pr), (from.y + from.h / 2 - bcy) * (1 - pr)];
  const fade = 1 - E.outCubic(clamp((t - T.brand) / 0.3));
  return { rect, stroke: lerp(340, 0, pw), off, dim: 0.74 * fade, blur: 7 * fade, L };
}

// ---------------------------------------------------------------- drawing
function drawBackground(t) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  // dot grid
  let ga = 1;
  if (t >= T.dive) ga = 0.55;
  if (t >= T.reveal) ga = 0.35;
  ga *= 1 - E.inOutQuad(clamp((t - T.brand) / 0.6));
  ga *= clamp(t / 0.4);
  if (ga > 0.01) {
    ctx.fillStyle = ink(0.07 * ga);
    for (let y = 36; y < H; y += 48) for (let x = 24; x < W; x += 48) ctx.fillRect(x, y, 1.6, 1.6);
  }
  // warm key light behind the wordmark
  const gl = E.outCubic(clamp((t - T.brand) / 1.2));
  if (gl > 0) {
    const g = ctx.createRadialGradient(960, 480, 0, 960, 480, 980);
    g.addColorStop(0, `rgba(255,236,214,${0.075 * gl})`);
    g.addColorStop(1, 'rgba(255,236,214,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  // red wash on every flip
  let rw = 0;
  for (let i = 0; i < 6; i++) { const x = t - T.flip(i); if (x >= 0) rw += Math.exp(-x * 9) * 0.05; }
  const x = t - T.slam;
  if (x >= 0 && t < T.brand) rw += Math.exp(-x * 5) * 0.08;
  if (rw > 0.002) {
    const g = ctx.createRadialGradient(960, 600, 0, 960, 600, 1100);
    g.addColorStop(0, red(rw));
    g.addColorStop(1, red(0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawCard(bmp, st, i, t) {
  const r = st.rect;
  ctx.save();
  ctx.globalAlpha = st.alpha;
  ctx.translate(r.x + r.w / 2 + st.dx, r.y + r.h / 2 + st.dy);
  ctx.rotate((st.rot * Math.PI) / 180);
  ctx.scale(st.scale, st.scale);
  const lr = { x: -r.w / 2, y: -r.h / 2, w: r.w, h: r.h, r: r.r };
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 44;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = '#050505';
  rr(ctx, lr);
  ctx.fill();
  ctx.restore();
  ctx.save();
  rr(ctx, lr);
  ctx.clip();
  if (st.blur > 0.3) ctx.filter = `blur(${st.blur.toFixed(2)}px)`;
  cover(ctx, bmp, lr, CARDS[i].focus, st.zoom, st.glitch, i + 1, t);
  ctx.filter = 'none';
  if (st.glitch > 0.02) {
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = red(0.35 * st.glitch);
    ctx.fillRect(lr.x, lr.y, lr.w, lr.h);
    ctx.globalCompositeOperation = 'source-over';
  }
  if (st.dim > 0) {
    ctx.fillStyle = `rgba(8,8,9,${st.dim})`;
    ctx.fillRect(lr.x, lr.y, lr.w, lr.h);
  }
  ctx.restore();
  ctx.strokeStyle = ink(0.1);
  ctx.lineWidth = 1;
  rr(ctx, lr);
  ctx.stroke();
  if (st.outline > 0) {
    ctx.strokeStyle = red(0.95 * st.outline);
    ctx.lineWidth = 3;
    rr(ctx, inflate(lr, 6));
    ctx.stroke();
  }
  ctx.restore();
}

function corners(c, r, arm, lw, color) {
  const { x, y, w, h } = r;
  c.strokeStyle = color;
  c.lineWidth = lw;
  c.lineCap = 'square';
  c.beginPath();
  c.moveTo(x, y + arm); c.lineTo(x, y); c.lineTo(x + arm, y);
  c.moveTo(x + w - arm, y); c.lineTo(x + w, y); c.lineTo(x + w, y + arm);
  c.moveTo(x + w, y + h - arm); c.lineTo(x + w, y + h); c.lineTo(x + w - arm, y + h);
  c.moveTo(x + arm, y + h); c.lineTo(x, y + h); c.lineTo(x, y + h - arm);
  c.stroke();
}

function label(c, text, x, y, { color = ink(0.95), size = 11, align = 'left', bg = null, fgc = '#0b0b0c' } = {}) {
  c.font = `600 ${size}px ${MONO}`;
  c.letterSpacing = `${(size * 0.14).toFixed(2)}px`;
  c.textAlign = align;
  c.textBaseline = 'middle';
  if (bg) {
    const w = c.measureText(text).width + 14;
    const bx = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
    c.fillStyle = bg;
    c.fillRect(bx, y - size, w, size * 2);
    c.fillStyle = fgc;
    c.textAlign = 'left';
    c.fillText(text, bx + 7, y + 0.5);
  } else {
    c.fillStyle = color;
    c.fillText(text, x, y + 0.5);
  }
  c.letterSpacing = '0px';
  c.textAlign = 'left';
}

function reticle(c, x, y, a, rad = 7) {
  c.strokeStyle = ink(0.95 * a);
  c.lineWidth = 1.5;
  c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.stroke();
  c.beginPath();
  c.moveTo(x - rad - 6, y); c.lineTo(x - rad + 2, y);
  c.moveTo(x + rad - 2, y); c.lineTo(x + rad + 6, y);
  c.moveTo(x, y - rad - 6); c.lineTo(x, y - rad + 2);
  c.moveTo(x, y + rad - 2); c.lineTo(x, y + rad + 6);
  c.stroke();
  c.fillStyle = ink(a);
  c.fillRect(x - 1, y - 1, 2, 2);
}

// Polyline that draws on from p=0..1.
function leader(c, pts, p, a) {
  if (p <= 0) return;
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let left = total * p;
  c.strokeStyle = ink(0.9 * a);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const L = Math.hypot(x1 - x0, y1 - y0);
    const f = Math.min(1, left / L);
    c.lineTo(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f);
    left -= L;
  }
  c.stroke();
}

const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

function drawScanHUD(t, ps, m, bmp) {
  const k = ps.k;
  if (k < 0) return;
  const s = SUBJECTS[k];
  const u = t - T.subj[k];
  const Dk = subjEnd(k) - T.subj[k];
  const gone = t >= T.pull ? E.outCubic(clamp((t - T.pull) / 0.12)) : 0;
  const A = 1 - gone;
  if (A <= 0) return;
  const f = faceAt(s.clip, ps.src);
  const r = ps.rect;

  // scan beam + landmark mesh (inside the panel)
  ctx.save();
  rr(ctx, r);
  ctx.clip();
  const sp = E.inOutCubic(clamp((u - 0.02) / 0.46));
  const ys = r.y + r.h * sp;
  if (sp > 0 && sp < 1) {
    const g = ctx.createLinearGradient(0, ys - 150, 0, ys);
    g.addColorStop(0, ink(0));
    g.addColorStop(1, ink(0.16 * A));
    ctx.fillStyle = g;
    ctx.fillRect(r.x, ys - 150, r.w, 150);
    ctx.fillStyle = ink(0.95 * A);
    ctx.fillRect(r.x, ys - 1, r.w, 2);
  }
  if (f && f.mesh) {
    const fade = A * (1 - E.inQuad(clamp((u - 0.5) / 0.3)));
    if (fade > 0.01) {
      const M = f.mesh;
      for (let j = 0; j < 468; j++) {
        const [x, y] = mapPt(m, M[2 * j], M[2 * j + 1]);
        const a = clamp((ys - y) / 70) * fade;
        if (a <= 0.01) continue;
        ctx.fillStyle = ink(0.75 * a);
        ctx.fillRect(x - 0.9, y - 0.9, 1.8, 1.8);
      }
      const oa = f.box[2] - f.box[0] < 0.9 ? fade * clamp((sp - 0.6) / 0.4) * 0.55 : 0;
      if (oa > 0.01) {
        ctx.strokeStyle = ink(oa);
        ctx.lineWidth = 1;
        ctx.beginPath();
        FACE_OVAL.forEach((idx, j) => {
          const [x, y] = mapPt(m, M[2 * idx], M[2 * idx + 1]);
          j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        });
        ctx.closePath();
        ctx.stroke();
      }
    }
  }
  ctx.restore();

  // face brackets
  const faceOk = f && f.box && f.box[2] - f.box[0] < 0.9 && s.fx !== 'hands';
  if (faceOk) {
    const [x0, y0] = mapPt(m, f.box[0], f.box[1]);
    const [x1, y1] = mapPt(m, f.box[2], f.box[3]);
    const pad = (x1 - x0) * 0.12;
    const bx = { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
    const spg = spring(t, T.subj[k] + 0.06, 3.4, 0.48);
    const sc = lerp(1.4, 1, spg);
    const cx = bx.x + bx.w / 2, cy = bx.y + bx.h / 2;
    const b2 = { x: cx - (bx.w * sc) / 2, y: cy - (bx.h * sc) / 2, w: bx.w * sc, h: bx.h * sc };
    const a = A * clamp((u - 0.06) / 0.05);
    if (a > 0) {
      corners(ctx, b2, Math.min(b2.w, b2.h) * 0.16, 2, ink(0.95 * a));
      label(ctx, `FACE · ${(0.991 + hash(k * 3.1) * 0.008).toFixed(3)}`, b2.x, b2.y - 14, { color: ink(a) });
      ctx.fillStyle = red(a * (Math.floor(t * 4) % 2 ? 1 : 0.35));
      ctx.fillRect(b2.x + b2.w - 7, b2.y - 17, 7, 7);
    }
    // eyes
    const ea = A * clamp((u - 0.14) / 0.06) * (s.fx === 'light' ? 0.0 : 1);
    if (ea > 0 && f.le && f.re) {
      const [lx, ly] = mapPt(m, f.le[0], f.le[1]);
      const [rx, ry] = mapPt(m, f.re[0], f.re[1]);
      const er = Math.max(6, Math.hypot(rx - lx, ry - ly) * 0.16);
      reticle(ctx, lx, ly, ea, er);
      reticle(ctx, rx, ry, ea, er);
    }
  }

  // subject-specific callouts
  const cA = (d) => A * clamp((u - d) / 0.06);
  if (s.fx === 'loupe') {
    const [tx, ty] = mapPt(m, s.loupe[0], s.loupe[1]);
    const R = 124;
    const lc = [r.x + 172, r.y + r.h - 250];
    const pa = spring(t, T.subj[k] + 0.2, 3.0, 0.55);
    const a = cA(0.12);
    reticle(ctx, tx, ty, a, 10);
    const ang = Math.atan2(lc[1] - ty, lc[0] - tx);
    leader(ctx, [[tx + Math.cos(ang) * 14, ty + Math.sin(ang) * 14], [lc[0] - Math.cos(ang) * R, lc[1] - Math.sin(ang) * R]], clamp((u - 0.12) / 0.14), a);
    if (pa > 0.001) {
      const Rr = R * pa;
      ctx.save();
      ctx.beginPath(); ctx.arc(lc[0], lc[1], Rr, 0, Math.PI * 2); ctx.clip();
      const Mg = 2.2;
      const half = R / (m.s * Mg);
      const cxs = s.loupe[0] * m.sw, cys = s.loupe[1] * m.sh;
      ctx.drawImage(bmp, cxs - half, cys - half, half * 2, half * 2, lc[0] - R, lc[1] - R, R * 2, R * 2);
      ctx.restore();
      ctx.strokeStyle = ink(0.95 * A);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(lc[0], lc[1], Rr, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1;
      for (let j = 0; j < 48; j++) {
        const an = (j / 48) * Math.PI * 2 + t * 0.6;
        const l0 = Rr + 6, l1 = Rr + (j % 4 ? 10 : 16);
        ctx.strokeStyle = ink(0.5 * A * pa);
        ctx.beginPath();
        ctx.moveTo(lc[0] + Math.cos(an) * l0, lc[1] + Math.sin(an) * l0);
        ctx.lineTo(lc[0] + Math.cos(an) * l1, lc[1] + Math.sin(an) * l1);
        ctx.stroke();
      }
      const la = cA(0.3);
      label(ctx, 'SKIN · 2.2×', lc[0], lc[1] + R + 34, { align: 'center', bg: ink(0.95 * la) });
      label(ctx, 'PORES RESOLVED', lc[0], lc[1] + R + 60, { align: 'center', color: ink(0.75 * la) });
    }
  } else if (s.fx === 'hands') {
    s.boxes.forEach((bx, j) => {
      const a = cA(0.12 + j * 0.1);
      if (a <= 0) return;
      const [x0, y0] = mapPt(m, bx.r[0], bx.r[1]);
      const [x1, y1] = mapPt(m, bx.r[2], bx.r[3]);
      const spg = spring(t, T.subj[k] + 0.12 + j * 0.1, 3.4, 0.5);
      const sc = lerp(1.25, 1, spg);
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = (x1 - x0) * sc, h = (y1 - y0) * sc;
      const b2 = { x: Math.max(r.x + 6, cx - w / 2), y: cy - h / 2, w, h };
      corners(ctx, b2, 22, 2, ink(0.95 * a));
      label(ctx, decode(bx.label, clamp((u - 0.14 - j * 0.1) / 0.18), t, j + 3), b2.x + 2, b2.y - 16, { bg: ink(0.95 * a) });
    });
  } else if (s.fx === 'light') {
    const [px, py] = mapPt(m, s.point[0], s.point[1]);
    const a = cA(0.12);
    reticle(ctx, px, py, a, 11);
    const ex = px + 150, ey = py + 118;
    leader(ctx, [[px + 12, py + 9], [px + 70, ey], [ex, ey]], clamp((u - 0.12) / 0.16), a);
    const la = cA(0.26);
    label(ctx, decode(s.label, clamp((u - 0.26) / 0.16), t, 7), ex + 6, ey, { bg: ink(0.95 * la) });
    label(ctx, 'LUX 98,400 · 5600K', ex + 6, ey + 28, { color: ink(0.8 * la) });
    // sun direction gizmo
    const g = [r.x + r.w - 62, r.y + 118];
    const ga = cA(0.2);
    ctx.strokeStyle = ink(0.8 * ga);
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(g[0], g[1], 30, 0, Math.PI * 2); ctx.stroke();
    const an = -Math.PI * 0.25 + Math.sin(t * 2) * 0.03;
    const len = 30 * E.outExpo(clamp((u - 0.2) / 0.25));
    ctx.beginPath(); ctx.moveTo(g[0] + Math.cos(an) * len, g[1] + Math.sin(an) * len); ctx.lineTo(g[0], g[1]); ctx.stroke();
    ctx.fillStyle = ink(ga);
    ctx.beginPath(); ctx.arc(g[0] + Math.cos(an) * len, g[1] + Math.sin(an) * len, 4, 0, Math.PI * 2); ctx.fill();
    label(ctx, 'KEY 34°', g[0], g[1] + 48, { align: 'center', color: ink(0.8 * ga) });
  } else if (s.fx === 'hair') {
    const [px, py] = mapPt(m, s.point[0], s.point[1]);
    const a = cA(0.12);
    reticle(ctx, px, py, a, 11);
    const ex = r.x - 36;
    leader(ctx, [[px - 16, py], [px - 50, py + 44], [ex, py + 44]], clamp((u - 0.12) / 0.16), a);
    const la = cA(0.26);
    label(ctx, decode(s.label, clamp((u - 0.26) / 0.16), t, 9), ex - 8, py + 44, { align: 'right', bg: ink(0.95 * la) });
    label(ctx, '~110K STRANDS', ex - 8, py + 72, { align: 'right', color: ink(0.7 * la) });
  } else if (s.fx === 'expr' && f && f.mouth && faceOk) {
    const [mx, my] = mapPt(m, f.mouth[0], f.mouth[1]);
    const [x0] = mapPt(m, f.box[0], 0);
    const [x1] = mapPt(m, f.box[2], 0);
    const fw = x1 - x0;
    const a = cA(0.16);
    const jaw = f.bs.jaw || 0;
    const b2 = { x: mx - fw * 0.26, y: my - fw * 0.12 - jaw * fw * 0.08, w: fw * 0.52, h: fw * 0.24 + jaw * fw * 0.16 };
    corners(ctx, b2, 10, 1.6, red(0.95 * a));
    label(ctx, `JAW ${jaw.toFixed(2)}  SYNC ±0F`, b2.x + b2.w + 12, b2.y + b2.h / 2, { color: ink(a) });
  }

  // cut flash on the panel
  if (ps.flash > 0.01) {
    ctx.save();
    rr(ctx, r);
    ctx.fillStyle = ink(ps.flash);
    ctx.fill();
    ctx.restore();
  }
}

function drawSelector(t) {
  if (t < T.hopStart || t > T.dive + 0.12) return;
  const h = Math.min(T.hops.length - 1, Math.floor((t - T.hopStart) / S16));
  const cur = T.hops[h], prev = T.hops[Math.max(0, h - 1)];
  const since = t - (T.hopStart + h * S16);
  const p = h === 0 ? 1 : E.outExpo(clamp(since / 0.07));
  const a = clamp((t - T.hopStart) / 0.04) * (1 - clamp((t - T.dive) / 0.1));
  const rc = (i) => {
    const st = cardState(i, Math.min(t, T.dive - 1e-3));
    const r = st.rect, sc = st.scale;
    return inflate({ x: r.x + r.w / 2 + st.dx - (r.w * sc) / 2, y: r.y + r.h / 2 + st.dy - (r.h * sc) / 2, w: r.w * sc, h: r.h * sc }, 12);
  };
  const r = lerpRect({ ...rc(prev), r: 0 }, { ...rc(cur), r: 0 }, p);
  corners(ctx, r, 30, 3, red(0.95 * a));
  label(ctx, `0${cur + 1}`, r.x, r.y - 16, { color: red(a) });
}

function drawLetters(t, bmps) {
  const solidP = clamp((t - T.solid) / 0.5);
  const sweepX = lerp(WM.left - 80, WM.right + 80, E.inOutCubic(solidP));
  for (let i = 0; i < 6; i++) {
    const st = letterState(i, t);
    const L = st.L;
    const gx = L.x + st.off[0], gy = L.baseline + st.off[1];
    if (solidP < 1 && sweepX < L.bb.x + L.bb.w + 4) {
      const R = st.rect;
      const pad = 4;
      const bx = Math.floor(Math.min(R.x, L.bb.x + st.off[0] - 40)) - pad, by = Math.floor(Math.min(R.y, L.bb.y + st.off[1] - 40)) - pad;
      const bw = Math.ceil(Math.max(R.x + R.w, L.bb.x + L.bb.w + st.off[0] + 40)) + pad - bx;
      const bh = Math.ceil(Math.max(R.y + R.h, L.bb.y + L.bb.h + st.off[1] + 40)) + pad - by;
      layer.width = bw; layer.height = bh;
      mask.width = bw; mask.height = bh;
      const lc = layer.getContext('2d'), mc = mask.getContext('2d');
      lc.translate(-bx, -by);
      mc.translate(-bx, -by);
      lc.save();
      rr(lc, R);
      lc.clip();
      if (st.blur > 0.3) lc.filter = `blur(${st.blur.toFixed(2)}px)`;
      cover(lc, bmps[i], R, CARDS[i].focus, 1);
      lc.filter = 'none';
      if (st.dim > 0.002) { lc.fillStyle = `rgba(8,8,9,${st.dim})`; lc.fillRect(R.x, R.y, R.w, R.h); }
      lc.restore();
      brandFont(mc);
      mc.fillStyle = '#fff';
      mc.fillText(L.ch, gx, gy);
      const Rd = st.stroke / 2;
      if (Rd > 0.5) {
        // morphological dilation of the glyph by stamping it around concentric rings
        [[1, 40], [0.74, 30], [0.48, 22], [0.24, 12]].forEach(([f, n], ri) => {
          for (let j = 0; j < n; j++) {
            const a = (j / n) * Math.PI * 2 + ri * 0.37;
            mc.fillText(L.ch, gx + Math.cos(a) * Rd * f, gy + Math.sin(a) * Rd * f);
          }
        });
      }
      lc.setTransform(1, 0, 0, 1, 0, 0);
      lc.globalCompositeOperation = 'destination-in';
      lc.drawImage(mask, 0, 0);
      lc.globalCompositeOperation = 'source-over';
      ctx.drawImage(layer, bx, by);
    }
    if (solidP > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, sweepX, H);
      ctx.clip();
      brandFont(ctx);
      ctx.fillStyle = '#f3f0e8';
      ctx.fillText(L.ch, gx, gy);
      ctx.restore();
    }
  }
  if (solidP > 0 && solidP < 1) {
    const g = ctx.createLinearGradient(sweepX - 120, 0, sweepX, 0);
    g.addColorStop(0, ink(0));
    g.addColorStop(1, ink(0.22));
    ctx.fillStyle = g;
    ctx.fillRect(sweepX - 120, WM.top - 70, 120, WM.bottom - WM.top + 140);
    ctx.fillStyle = ink(0.95);
    ctx.fillRect(sweepX - 1, WM.top - 70, 2, WM.bottom - WM.top + 140);
  }
}

// ---------------------------------------------------------------- DOM per frame
let recX = 0;
function domUpdate(t) {
  // chrome
  const stopped = t >= T.dot;
  setText(D.tr, `${stopped ? 'STOP' : 'REC '}  ${timecode(Math.min(t, T.dot))}`);
  const secs = C.SECTIONS.filter(([s]) => t >= s);
  const [s0, txt] = secs[secs.length - 1];
  setText(D.bl, decode(txt, clamp((t - s0) / 0.35), t, 2));
  const bar = Math.floor(t / (BEAT * 4));
  D.barEls.forEach((e, j) => {
    e.className = j < bar ? 'on' : '';
    e.style.opacity = j === bar ? (0.45 + 0.55 * Math.exp(-((t / BEAT) % 1) * 5)).toFixed(3) : '1';
    if (j === bar) e.style.background = 'var(--ink)';
    else e.style.background = '';
  });

  // hook
  const hookOut = E.outCubic(clamp((t - T.dive + 0.04) / 0.2));
  D.words.forEach((w, i) => {
    const p = E.outExpo(clamp((t - T.hookWord(i)) / 0.55));
    const out = E.outCubic(clamp((t - T.dive + 0.04 - i * 0.015) / 0.2));
    const y = (1 - p) * 112 - out * 112;
    let extra = '';
    if (i === C.HOOK.length - 1) {
      const g = t - T.hookWord(i);
      if (g > 0 && g < 0.12) extra = ` translateX(${((hash(Math.floor(t * 30)) - 0.5) * 18).toFixed(1)}px)`;
    }
    w.style.transform = `translateY(${y.toFixed(2)}%)${extra}`;
  });
  vis(D.hook, t < T.dive + 0.4 ? 1 : 0);
  setText(D.sub, decode(C.SUBHOOK, clamp((t - T.hopStart) / 0.3), t, 5));
  vis(D.sub, clamp((t - T.hopStart) / 0.05) * (1 - hookOut));

  // card labels + verdict tags
  for (let i = 0; i < 6; i++) {
    const L = D.clabels[i], V = D.vtags[i];
    const r = slot(i);
    let a = 0, dx = 0, dy = 0;
    const st = t < T.brand ? cardState(i, t) : null;
    if (st) { a = st.alpha * (1 - clamp(st.blur / 8)); dx = st.dx; dy = st.dy; }
    if (t < T.dive) a *= clamp((t - (0.3 + i * 0.055)) / 0.25);
    if (t >= T.pull && t < T.brand) a *= clamp((t - (T.pull + 0.35)) / 0.2);
    if (t >= T.slam - 0.04 && t < T.brand) a *= 1 - 0.7 * E.outCubic(clamp((t - T.slam) / 0.2));
    if (i === 5 && t >= T.pull && t < T.pull + 0.42) a = 0;
    css(L, { transform: `translate(${(r.x + 2 + dx).toFixed(1)}px, ${(r.y + r.h + 20 + dy).toFixed(1)}px)` });
    vis(L, a);

    // verdict tag: HUMAN during the pull-back, flips to AI on the reveal
    const tin = T.pull + 0.42 + i * 0.05;
    let va = t >= T.pull && t < T.brand ? clamp((t - tin) / 0.08) : 0;
    const flipped = t >= T.flip(i);
    const txt = flipped ? decode('✕ AI-GENERATED', clamp((t - T.flip(i)) / 0.1), t, i + 11) : decode('✓ HUMAN', clamp((t - tin) / 0.18), t, i + 21);
    setText(V, txt);
    V.className = 'mono vtag' + (flipped ? ' ai' : '');
    const pop = flipped ? 1 + 0.18 * (1 - E.outExpo(clamp((t - T.flip(i)) / 0.2))) : 1 + 0.12 * (1 - E.outBack(clamp((t - tin) / 0.25)));
    if (t >= T.slam - 0.04 && t < T.brand) va *= 1 - 0.55 * E.outCubic(clamp((t - T.slam) / 0.2));
    css(V, { transform: `translate(${(r.x + 12 + dx).toFixed(1)}px, ${(r.y + r.h - 44 + dy).toFixed(1)}px) scale(${pop.toFixed(4)})`, transformOrigin: '0 50%' });
    vis(V, va);
  }
  // summary line
  const sumIn = T.pull + 0.62;
  setText(D.summary, decode('VERIFICATION COMPLETE  ·  6/6 HUMAN', clamp((t - sumIn) / 0.3), t, 31));
  vis(D.summary, t >= sumIn ? clamp((t - sumIn) / 0.05) * (1 - clamp((t - T.correction) / 0.06)) : 0);
  const sk = E.outExpo(clamp((t - (T.flip(5) + 0.05)) / 0.12));
  D.strike.style.transform = `scaleX(${sk.toFixed(4)})`;
  vis(D.strike, t < T.correction + 0.06 ? sk : 0);

  // montage columns
  const colIn = E.outExpo(clamp((t - T.dive - 0.26) / 0.5));
  const colOut = E.inCubic(clamp((t - T.pull) / 0.3));
  const colA = t >= T.dive ? colIn * (1 - colOut) : 0;
  css(D.left, { transform: `translateX(${((1 - colIn) * -60 - colOut * 60).toFixed(1)}px)` });
  css(D.right, { transform: `translateX(${((1 - colIn) * 60 + colOut * 60).toFixed(1)}px)` });
  vis(D.left, colA);
  vis(D.right, colA);
  vis(D.panTop, colA);
  vis(D.panBot, colA);
  if (colA > 0) {
    const k = Math.max(0, subjIndex(t));
    const s = SUBJECTS[k];
    const t0 = subjIndex(t) < 0 ? T.dive : T.subj[k];
    const u = t - t0;
    // odometer
    const digit = k + 1;
    const prevDigit = k;
    const roll = subjIndex(t) <= 0 ? 1 : E.outExpo(clamp(u / 0.3));
    const dpos = lerp(prevDigit, digit, roll);
    D.odo.style.transform = `translateY(${(-dpos * 232).toFixed(2)}px)`;
    const cp = E.outExpo(clamp(u / 0.35));
    setText(D.cat, s.cat + '.');
    css(D.cat, { transform: `translateY(${((1 - cp) * 36).toFixed(1)}px)`, opacity: cp.toFixed(3) });
    const metaTxt = [
      ['FORMAT', '9:16 UGC'],
      ['LENGTH', s.meta[0]],
      ['CAPTURE', s.meta[1]],
      ['LIGHT', s.meta[2]],
      ['SOURCE', ''],
    ];
    D.meta.forEach((e, j) => {
      const [a, b2] = metaTxt[j];
      setText(e, decode((a + ' ').padEnd(12, '.') + ' ' + b2, clamp((u - j * 0.03) / 0.25), t, j + 40));
    });
    D.redact.style.transform = `scaleX(${E.outExpo(clamp((u - 0.12) / 0.3)).toFixed(3)})`;

    // right column
    D.hdrSq.style.opacity = Math.floor(t * 4) % 2 ? '1' : '0.25';
    D.rows.forEach((row, j) => {
      const [lab, val] = s.checks[j];
      const t1 = 0.1 + j * 0.08;
      setText(row.lab, decode(lab, clamp((u - t1) / 0.18), t, j + 50));
      const bp = E.outCubic(clamp((u - t1) / 0.2));
      row.fill.style.transform = `scaleX(${bp.toFixed(3)})`;
      setText(row.val, bp >= 1 ? decode(val, clamp((u - t1 - 0.2) / 0.1), t, j + 60) : '');
      vis(row.r, clamp((u - t1) / 0.04));
    });
    const f = faceAt(s.clip, s.t + Math.max(0, u));
    const emph = k === 4 ? 1 : 0.55;
    D.teleT.style.color = k === 4 ? 'var(--ink)' : '';
    D.teleRows.forEach((row, j) => {
      let v = f && f.bs ? clamp(f.bs[row.k] || 0) : 0;
      if (row.k === 'blink') v = clamp(v * 1.4);
      v = Math.max(0.02, v) * E.outExpo(clamp((u - 0.1 - j * 0.03) / 0.3));
      row.f.style.transform = `scaleX(${v.toFixed(3)})`;
      row.f.style.background = k === 4 && v > 0.35 ? 'var(--red)' : 'var(--ink)';
      setText(row.v, v.toFixed(2));
      row.l.style.color = k === 4 ? 'var(--ink)' : '';
    });
    D.tele.style.opacity = emph.toFixed(2);
    const vt = 0.42;
    const vp = clamp((u - vt) / 0.22);
    const vs = 1 + 0.3 * (1 - E.outExpo(vp));
    css(D.verdict, { transform: `scale(${vs.toFixed(4)})`, filter: vp < 1 ? `blur(${((1 - E.outExpo(vp)) * 10).toFixed(2)}px)` : 'none' });
    vis(D.verdict, clamp((u - vt) / 0.04));
    const cpv = E.outCubic(clamp((u - vt) / 0.3));
    setText(D.confV, u > vt ? (s.conf * cpv).toFixed(1) + '%' : '');
    D.confFill.style.transform = `scaleX(${((s.conf / 100) * cpv).toFixed(3)})`;
    vis(D.conf, clamp((u - vt) / 0.05));
    vis(D.vLbl, clamp((u - vt + 0.1) / 0.05));
    // panel labels
    setText(D.panTopL, `CAM A · 24P · ISO ${[320, 800, 100, 250, 400][k]} · 1/48`);
    setText(D.panTopR, `SUBJ 0${k + 1}`);
    setText(D.panBotL, `SRC ${timecode(s.t + Math.max(0, u), 24).slice(3)}`);
    setText(D.panBotR, `${(2.4 + hash(k) * 0.6).toFixed(1)} MP · H.264`);
  }

  // reveal copy
  const corrA = t >= T.correction && t < T.brand ? clamp((t - T.correction) / 0.04) * (1 - E.inCubic(clamp((t - T.brand + 0.04) / 0.12))) : 0;
  setText(D.corr, decode('CORRECTION:', clamp((t - T.correction) / 0.2), t, 70));
  vis(D.corr, corrA);
  const sl = t - T.slam;
  if (sl >= 0 && t < T.brand + 0.3) {
    const p = E.outExpo(clamp(sl / 0.38));
    const out = E.inCubic(clamp((t - T.brand) / 0.2));
    const sc = lerp(1.28, 1, p) * (1 + out * 0.2) * (1 + 0.012 * clamp(sl / 0.9));
    css(D.slam, { transform: `scale(${sc.toFixed(4)})`, filter: `blur(${((1 - p) * 14 + out * 18).toFixed(2)}px)` });
    D.slamParts.forEach((e, j) => {
      if (e.className === 'g') e.style.fontStretch = `${lerp(70, 125, E.outExpo(clamp((sl - j * 0.03) / 0.42))).toFixed(1)}%`;
    });
    vis(D.slam, clamp(sl / 0.03) * (1 - out));
  } else vis(D.slam, 0);

  // brand tagline
  const t1 = t - T.tagline;
  setText(D.tag1, decode(C.TAG_TOP, clamp(t1 / 0.35), t, 90));
  vis(D.tag1, t1 >= 0 ? clamp(t1 / 0.05) : 0);
  const t2 = E.outExpo(clamp((t1 - 0.12) / 0.7));
  D.tag2.style.transform = `translateY(${((1 - t2) * 110).toFixed(2)}%)`;
  vis(D.tag2w, t1 > 0.12 ? 1 : 0);

  // hero dot: REC light -> full stop of the wordmark
  const recPos = [recX - 22, 44];
  const dp = clamp((t - T.dot) / 0.52);
  let x = recPos[0], y = recPos[1], size = 12, rot = 0, sx = 1, sy = 1, da = 1;
  if (t < T.dot - 0.12) {
    da = Math.floor(t / 0.5) % 2 === 0 ? 1 : 0.15;
  } else if (t < T.dot) {
    const a = E.outCubic(clamp((t - (T.dot - 0.12)) / 0.12));
    sx = sy = 1 - 0.25 * a;
    y -= 5 * a;
  } else {
    const e = E.inOutCubic(dp);
    const cp = camParams(t);
    const P0 = recPos, P2 = toScreen(cp, WM.dot.x, WM.dot.y), P1 = [P2[0] + 190, P0[1] + 120];
    const q = (a, b2, c2, s2) => (1 - s2) * (1 - s2) * a + 2 * (1 - s2) * s2 * b2 + s2 * s2 * c2;
    x = q(P0[0], P1[0], P2[0], e);
    y = q(P0[1], P1[1], P2[1], e);
    const e2 = Math.min(1, e + 0.01);
    const vx = q(P0[0], P1[0], P2[0], e2) - x, vy = q(P0[1], P1[1], P2[1], e2) - y;
    rot = Math.atan2(vy, vx);
    size = lerp(12, WM.dot.d * cp.s, E.inOutQuad(dp));
    const stretch = 1 + 0.9 * Math.sin(Math.PI * dp) * (dp < 1 ? 1 : 0);
    sx = stretch; sy = 1 / stretch;
    if (dp >= 1) {
      const sp2 = spring(t, T.dot + 0.52, 4.2, 0.3);
      rot = 0;
      sx = 1 + 0.35 * (1 - sp2);
      sy = 1 - 0.35 * (1 - sp2);
      y = P2[1] + (size / 2) * (1 - sy);
    }
  }
  css(D.dot, {
    width: `${size.toFixed(2)}px`, height: `${size.toFixed(2)}px`,
    transform: `translate(${(x - size / 2).toFixed(2)}px, ${(y - size / 2).toFixed(2)}px) rotate(${rot.toFixed(4)}rad) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`,
  });
  vis(D.dot, da);
  // landing ripple
  const rp = clamp((t - T.dot - 0.52) / 0.7);
  if (rp > 0 && rp < 1) {
    const cp = camParams(t);
    const [rx, ry] = toScreen(cp, WM.dot.x, WM.dot.y);
    const rs = WM.dot.d * cp.s * (1 + 2.8 * E.outCubic(rp));
    css(D.ring, { width: `${rs}px`, height: `${rs}px`, transform: `translate(${rx - rs / 2 - 2}px, ${ry - rs / 2 - 2}px)` });
    vis(D.ring, 0.9 * (1 - rp));
  } else vis(D.ring, 0);
}

// ---------------------------------------------------------------- camera + post
const IMPULSES = [
  [T.hookWord(5), 3, 16], ...[0, 1, 2, 3, 4, 5].map((i) => [T.flip(i), 3, 18]),
  [T.slam, 16, 7], [T.brand, 7, 9], [T.dot + 0.52, 4, 12],
];
function camParams(t) {
  let s = 1 + 0.028 * E.inOutQuad(clamp(t / T.dive)) * (1 - E.inOutQuart(clamp((t - T.dive) / 0.4)));
  s *= 1 + 0.02 * E.inOutQuad(clamp((t - T.pull) / (T.reveal - T.pull))) * (t < T.brand ? 1 : 0);
  s *= 1 + 0.025 * E.inOutQuad(clamp((t - T.slam) / (T.brand - T.slam))) * (t < T.brand ? 1 : 0);
  s *= 1 + 0.024 * E.inOutQuad(clamp((t - T.brand) / (C.DURATION - T.brand)));
  let x = 0, y = 0;
  for (const [ti, amp, dec] of IMPULSES) {
    const d = t - ti;
    if (d < 0 || d > 1.2) continue;
    const k = amp * Math.exp(-d * dec);
    x += k * noise(t * 34, ti);
    y += k * noise(t * 34, ti + 9);
  }
  x += noise(t * 0.6, 3) * 2.2;
  y += noise(t * 0.6, 7) * 2.2;
  return { x, y, s };
}
function camera(t) {
  const { x, y, s } = camParams(t);
  camEl.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${s.toFixed(5)})`;
}
const toScreen = (cp, px, py) => [960 + (px - 960) * cp.s + cp.x, 540 + (py - 540) * cp.s + cp.y];

const HI = [[T.dive - 0.05, 0.5], [T.pull - 0.05, 0.55], [T.brand - 0.02, 0.8], [T.dot - 0.15, 0.95], [T.slam - 0.02, 0.42], [T.solid, 0.5]];
const MID = [[0, 1.1], [T.hopStart, T.dive - T.hopStart], ...T.subj.map((s) => [s, 0.45]), [T.reveal, 0.7], [T.tagline, 0.6], [T.hookWord(5), 0.2]];
window.subframes = (t) => {
  const inside = (w) => w.some(([a, d]) => t >= a && t <= a + d);
  return inside(HI) ? 20 : inside(MID) ? 10 : 4;
};
window.post = (t) => {
  let ca = 0.6;
  const spikes = [[T.hookWord(5), 5, 12], ...[0, 1, 2, 3, 4, 5].map((i) => [T.flip(i), 7, 16]), [T.slam, 9, 6], [T.brand, 6, 8], [T.dot + 0.52, 3, 10]];
  for (const [ti, amp, dec] of spikes) { const d = t - ti; if (d >= 0) ca += amp * Math.exp(-d * dec); }
  const fade = clamp((C.DURATION - t) / 0.3) * clamp(t / 0.12);
  return { ca, fade, grain: 0.028, vignette: 0.32 };
};

// ---------------------------------------------------------------- frame
async function seek(t) {
  const jobs = [];
  const need = (clip, src) => {
    const p = frameBitmap(clip, srcIdx(clip, src));
    jobs.push(p);
    return p;
  };
  const cardJobs = [];
  if (t < T.brand) {
    for (let i = 0; i < 6; i++) {
      const st = cardState(i, t);
      if (st) cardJobs.push([i, st, need(CARDS[i].clip, cardSrc(i, t))]);
    }
  }
  const ps = panelState(t);
  const panelJob = ps ? need(ps.clip, ps.src) : null;
  const letterJobs = t >= T.brand && t < T.solid + 0.5 ? CARDS.map((c, i) => need(c.clip, cardSrc(i, t))) : null;
  await Promise.all(jobs);

  drawBackground(t);
  for (const [i, st, p] of cardJobs) drawCard(await p, st, i, t);
  drawSelector(t);
  if (ps) {
    const bmp = await panelJob;
    const r = ps.rect;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 24;
    ctx.fillStyle = '#050505';
    rr(ctx, r);
    ctx.fill();
    ctx.restore();
    ctx.save();
    rr(ctx, r);
    ctx.clip();
    const m = cover(ctx, bmp, r, ps.focus, ps.zoom);
    ctx.restore();
    ctx.strokeStyle = ink(0.12);
    ctx.lineWidth = 1;
    rr(ctx, r);
    ctx.stroke();
    if (t >= T.dive + 0.3) {
      corners(ctx, inflate(r, 14), 18, 1.5, ink(0.5 * (1 - clamp((t - T.pull) / 0.15))));
    }
    drawScanHUD(t, ps, m, bmp);
  }
  if (t >= T.brand) drawLetters(t, letterJobs ? await Promise.all(letterJobs) : []);
  domUpdate(t);
  camera(t);
}

async function init() {
  buildDOM();
  await Promise.all([
    document.fonts.load('900 100px Archivo'),
    document.fonts.load('400 100px "Instrument Serif"'),
    document.fonts.load('italic 400 100px "Instrument Serif"'),
    document.fonts.load(`500 12px ${MONO}`),
    document.fonts.load(`600 12px ${MONO}`),
    loadTracks(Object.keys(CLIPS)),
  ]);
  await document.fonts.ready;
  layoutWordmark();
  ctx.font = `500 12px ${MONO}`;
  ctx.letterSpacing = '1.92px';
  recX = 1706;
  ctx.letterSpacing = '0px';
}

window.ready = init();
window.seek = async (t) => {
  await window.ready;
  await seek(t);
};
window.CFG = C;
