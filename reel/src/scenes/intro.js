// INTRO (0.0 - 3.6s): the mark assembles, dissolves into code, lands on a
// home screen, is carved in marble and pressed into paper. Then the drop.
import { C, MARK, drawMark, ringBand, chevronPath, drawWordmark } from '../brand.js';
import { fillBg, canvas, text, font, arcStroke, camera } from '../gfx.js';
import { drawFlipY, bloom, carve, emboss, paper, textMask, maskFrom } from '../fx2d.js';
import { A } from '../assets.js';
import {
  win, snap, decel, soft, accel, outBack, inExpo, outExpo, lerp, clamp, TAU, hash2, track,
  inOutCubic, outCubic, spring, wobble, swift,
} from '../core.js';

// ------------------------------------------------------------------ 1. markBuild
export function markBuild() {
  const R = 150;
  return {
    cues: [
      { t: 0.0, s: 'whoosh', v: 0.8 }, { t: 0.42, s: 'tick' }, { t: 0.48, s: 'tick' }, { t: 0.54, s: 'tick' },
      { t: 0.66, s: 'thock' }, { t: 0.98, s: 'zoom' },
    ],
    draw(ctx, t) {
      fillBg(ctx, C.red);
      const cx = 960, cy = 540;
      const g = win(t, 0, 0.62, decel);
      const breathe = lerp(1, 1.045, win(t, 0.6, 0.4, soft));
      const punch = win(t, 1.02, 0.18, inExpo);
      const pull = lerp(2.6, 1, decel(win(t, 0, 0.55)));      // camera pull-back reveal
      const S = breathe * lerp(1, 1.6, punch) * pull;
      // construction guides
      const gA = clamp(win(t, 0.08, 0.2) - win(t, 0.55, 0.2)) * 0.5;
      if (gA > 0) {
        ctx.save();
        ctx.translate(cx, cy); ctx.scale(S, S);
        ctx.strokeStyle = `rgba(242,238,229,${gA})`;
        ctx.lineWidth = 1.4;
        const d = win(t, 0.08, 0.35, outCubic);
        arcStroke(ctx, 0, 0, R, -Math.PI / 2, TAU * d);
        arcStroke(ctx, 0, 0, R * MARK.inner, Math.PI / 2, -TAU * d);
        ctx.beginPath(); ctx.moveTo(-R * 2.4 * d, 0); ctx.lineTo(R * 2.4 * d, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -R * 1.6 * d); ctx.lineTo(0, R * 1.6 * d); ctx.stroke();
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(s * MARK.gap) * R * 1.5 * d, Math.sin(s * MARK.gap) * R * 1.5 * d); ctx.stroke();
        }
        ctx.fillStyle = `rgba(242,238,229,${gA * 1.3})`;
        font(ctx, 'JetBrains Mono', 13, 500);
        ctx.fillText('R 1.00', R * 1.05, -R * 0.98);
        ctx.fillText('r 0.64', -R * 1.62, R * 0.2);
        ctx.fillText('52°', R * 0.62, -R * 0.36);
        ctx.restore();
      }
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(S, S);
      ctx.rotate(lerp(-2.3, 0, g));
      const a0 = MARK.gap, a1 = TAU - MARK.gap, seg = (a1 - a0) / 3;
      for (let k = 0; k < 3; k++) {
        const p = win(t, 0.0 + k * 0.06, 0.42, snap);
        const from = a0 + k * seg, to = from + seg;
        const mid = (from + to) / 2;
        const off = (1 - p) * R * 0.9;
        const trim = (1 - p) * 0.14;
        ctx.save();
        ctx.translate(Math.cos(mid) * off, Math.sin(mid) * off);
        ctx.rotate((1 - p) * [-2.2, 1.7, -1.3][k]);
        ringBand(ctx, 0, 0, R * lerp(0.6, 1, p), from + trim, to - trim);
        ctx.fillStyle = C.paper;
        ctx.fill();
        ctx.restore();
      }
      const pc = win(t, 0.34, 0.34, decel);
      if (pc > 0) {
        const sc = outBack(win(t, 0.34, 0.3), 2.2);
        drawMark(ctx, 0, 0, R, { ringA: 0, chev: C.ink, chevX: lerp(-2.6, 0, pc), chevR: lerp(-Math.PI, 0, pc), chevS: sc });
      }
      ctx.restore();
    },
    fx: (t) => ({ grain: 0.045, vignette: 0.05, ca: 0.8 + win(t, 1.0, 0.2) * 3 }),
  };
}

// ------------------------------------------------------------------ 2. asciiMark
export function asciiMark(opts = {}) {
  const cw = 13, ch = 21;
  const cols = Math.ceil(1920 / cw) + 2, rows = Math.ceil(1080 / ch) + 2;
  let maskR = null, maskC = null, atlas = null;
  const GL = '01010011010+01*10#01/10';
  const glyphSet = ['0', '1', '+', '*', '#', '/', '%', '='];
  const layer = canvas(1920, 1080);
  const R = 330;
  return {
    mb: 1,
    cues: opts.flash ? [] : [{ t: 0.0, s: 'data', d: 1.0 }, { t: 0.95, s: 'zoom' }, { t: 1.12, s: 'glitch' }],
    init() {
      // coverage masks at grid resolution
      const m = canvas(cols, rows), x = m.getContext('2d');
      x.save();
      x.scale(1 / cw, 1 / ch);
      x.translate(cw, ch);
      ringBand(x, 960, 540, R, MARK.gap, TAU - MARK.gap);
      x.fillStyle = '#f00'; x.fill();
      chevronPath(x, 960, 540, R, {});
      x.fillStyle = '#0f0'; x.fill();
      x.restore();
      const d = x.getImageData(0, 0, cols, rows).data;
      maskR = new Float32Array(cols * rows); maskC = new Float32Array(cols * rows);
      for (let i = 0; i < cols * rows; i++) { maskR[i] = d[i * 4] / 255; maskC[i] = d[i * 4 + 1] / 255; }
      // glyph atlas: 8 glyphs x 3 colors at 4x resolution
      atlas = canvas(glyphSet.length * 64, 3 * 96);
      const a = atlas.getContext('2d');
      const cols3 = ['#EAF0FF', C.red, '#6C7CFF'];
      font(a, 'JetBrains Mono', 84, 700);
      a.textAlign = 'center'; a.textBaseline = 'middle';
      cols3.forEach((c, j) => glyphSet.forEach((g, i) => { a.fillStyle = c; a.fillText(g, i * 64 + 32, j * 96 + 50); }));
      void GL;
    },
    draw(ctx, t, shot) {
      fillBg(ctx, '#030304');
      const dur = shot.end - shot.start;
      const flash = !!opts.flash;
      // zoom: slow push, then dive into a glyph
      const tz = flash ? 0.3 : t;
      const z0 = track([[0, 0.94], [0.85, 1.18, soft], [1.2, 9.5, inExpo]], tz);
      const target = { x: 960 - R * 0.62, y: 540 - R * 0.72 };
      const fx = lerp(960, target.x, win(tz, 0.75, 0.45, inOutCubic));
      const fy = lerp(540, target.y, win(tz, 0.75, 0.45, inOutCubic));
      const lx = layer.getContext('2d');
      lx.setTransform(1, 0, 0, 1, 0, 0);
      lx.clearRect(0, 0, 1920, 1080);
      lx.save();
      lx.translate(960, 540); lx.scale(z0, z0); lx.translate(-fx, -fy);
      const step = Math.floor(t * 18);
      const scanY = ((t * 0.9) % 1) * rows;
      const reveal = flash ? 1 : win(t, 0, 0.3, outCubic);
      // visible cell range under zoom
      const vx0 = fx - 960 / z0, vx1 = fx + 960 / z0, vy0 = fy - 540 / z0, vy1 = fy + 540 / z0;
      const c0 = Math.max(0, Math.floor(vx0 / cw)), c1 = Math.min(cols - 1, Math.ceil(vx1 / cw));
      const r0 = Math.max(0, Math.floor(vy0 / ch)), r1 = Math.min(rows - 1, Math.ceil(vy1 / ch));
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const i = r * cols + c;
          const mr = maskR[i], mc = maskC[i];
          const hsh = hash2(c * 0.37, r * 1.13);
          let row = -1, alpha = 0;
          if (mc > 0.35) { row = 1; alpha = 0.55 + 0.45 * mc; }
          else if (mr > 0.35) { row = 0; alpha = 0.5 + 0.5 * mr; }
          else if (hsh > 0.985 - 0.01 * Math.sin(t * 3 + r)) { row = 2; alpha = 0.25; }
          if (row < 0) continue;
          // radial reveal from center
          const dist = Math.hypot((c * cw - 960) / 1920, (r * ch - 540) / 1080);
          if (dist > reveal * 0.9 + 0.02 && !flash) continue;
          const bright = 0.65 + 0.35 * hash2(c + step * 0.13, r);
          const scan = Math.max(0, 1 - Math.abs(r - scanY) / 3) * 0.6;
          const gi = Math.floor(hash2(c * 3.1 + Math.floor(t * (6 + hsh * 20)), r * 7.7) * (row === 2 ? glyphSet.length : 2.2));
          const gidx = Math.min(glyphSet.length - 1, gi);
          lx.globalAlpha = Math.min(1, alpha * bright + scan);
          lx.drawImage(atlas, gidx * 64, row * 96, 64, 96, c * cw - cw, r * ch - ch, cw, ch * 1.05);
        }
      }
      lx.restore();
      lx.globalAlpha = 1;
      bloom(ctx, layer, 0.85, 9);
      // white-out into the next shot (a glyph fills the screen)
      if (!flash) {
        const wo = inExpo(win(t, dur - 0.13, 0.13));
        if (wo > 0) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = `rgba(246,245,241,${wo})`; ctx.fillRect(0, 0, 1920, 1080);
          ctx.globalCompositeOperation = 'source-over';
        }
      }
    },
    fx: (t) => ({ grain: 0.06, ca: 3.2 + win(t, 0.9, 0.3) * 6, scan: 0.14, barrel: 0.07, vignette: 0.35, glitch: opts.flash ? 0 : win(t, 1.08, 0.08) * 0.4 }),
  };
}

// ------------------------------------------------------------------ 3. appIcon
export function appIcon() {
  let front = null, back = null;
  const S = 300;
  const makeIcon = (bg, ring, chev) => {
    const c = canvas(S * 2, S * 2), x = c.getContext('2d');
    x.scale(2, 2);
    x.beginPath(); x.roundRect(0, 0, S, S, S * 0.225);
    x.fillStyle = bg; x.fill();
    const g = x.createLinearGradient(0, 0, 0, S);
    g.addColorStop(0, 'rgba(255,255,255,0.16)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.10)');
    x.fillStyle = g; x.fill();
    drawMark(x, S * 0.47, S / 2, S * 0.3, { ring, chev });
    return c;
  };
  return {
    cues: [{ t: 0.0, s: 'flip' }, { t: 0.44, s: 'tick' }],
    init() { front = makeIcon(C.red, C.paper, C.ink); back = makeIcon(C.ink, C.red, C.paper); },
    draw(ctx, t) {
      fillBg(ctx, '#F6F5F1');
      const p = win(t, 0, 0.52, decel);
      const ang = lerp(-3 * Math.PI, 0, p);
      const pop = lerp(0.82, 1, outBack(win(t, 0, 0.3), 1.4)) * lerp(1, 1.06, win(t, 0.4, 0.2, soft));
      const cx = 960, cy = 505;
      // shadow
      const sw = Math.abs(Math.cos(ang)) * 0.8 + 0.2;
      ctx.save();
      ctx.filter = 'blur(18px)';
      ctx.fillStyle = 'rgba(40,30,20,0.22)';
      ctx.beginPath(); ctx.ellipse(cx, cy + S * 0.62 * pop, S * 0.42 * sw * pop, 16, 0, 0, TAU); ctx.fill();
      ctx.restore();
      drawFlipY(ctx, front, cx, cy, S * pop, S * pop, ang, { back, persp: 0.0014 });
      const la = win(t, 0.3, 0.2);
      if (la > 0) {
        ctx.globalAlpha = la;
        text(ctx, 'CVCVTA', cx, cy + S * 0.5 * pop + 62, { family: 'Inter', size: 30, weight: 500, color: '#3a3a38', align: 'center', tracking: 0.01 });
        ctx.globalAlpha = 1;
      }
    },
    fx: () => ({ grain: 0.03, vignette: 0.08, ca: 0.5 }),
  };
}

// ------------------------------------------------------------------ 4. marbleCarve
export function marbleCarve(opts = {}) {
  let img = null;
  return {
    cues: opts.flash ? [] : [{ t: 0.0, s: 'stone' }],
    init() {
      const w = 1920, h = 1080;
      const marble = A.marble;
      const m1 = textMask(w, h, 'CVCVTA', { family: 'Cinzel', size: 268, weight: 700, tracking: 0.06, x: 960, y: 610 });
      let out = carve(marble, m1, { fill: '#C73A1C', texture: marble, textureAlpha: 0.45, dx: 5, dy: 7, blur: 7 });
      const m2 = textMask(w, h, 'EST · MMXXVI', { family: 'Cinzel', size: 44, weight: 600, tracking: 0.42, x: 960, y: 745 });
      out = carve(out, m2, { fill: 'rgba(60,50,45,0.35)', dx: 2, dy: 3, blur: 3 });
      const m3 = maskFrom(w, h, (x) => { x.fillRect(760, 668, 400, 5); });
      out = carve(out, m3, { fill: 'rgba(60,50,45,0.3)', dx: 1.5, dy: 2, blur: 2, lip: false });
      img = out;
    },
    draw(ctx, t) {
      const z = lerp(1.14, 1.0, win(t, 0, 0.42, decel));
      ctx.save();
      camera(ctx, { zoom: z, rot: lerp(-0.015, 0, win(t, 0, 0.4, decel)), dx: lerp(40, 0, win(t, 0, 0.4, decel)) });
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      // raking light sweep
      const lx = lerp(-400, 2300, win(t, 0, 0.3, soft));
      const g = ctx.createLinearGradient(lx - 500, 0, lx + 500, 300);
      g.addColorStop(0, 'rgba(255,248,235,0)'); g.addColorStop(0.5, 'rgba(255,248,235,0.22)'); g.addColorStop(1, 'rgba(255,248,235,0)');
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
      ctx.globalCompositeOperation = 'source-over';
    },
    fx: () => ({ grain: 0.04, vignette: 0.3, ca: 0.6 }),
  };
}

// ------------------------------------------------------------------ 5. embossCard
export function embossCard() {
  let card = null;
  const CW = 1500, CH = 900;
  return {
    cues: [{ t: 0.0, s: 'paper' }],
    init() {
      const base = paper(CW, CH, '#EEE9DF', 11, { noise: 9, fibers: 1400, fiberAlpha: 0.05 });
      const mask = maskFrom(CW, CH, (x) => {
        drawMark(x, 470, 400, 118, { ring: '#fff', chev: '#fff' });
        drawWordmark(x, 1010, 440, 96, { color: '#fff', dotColor: '#fff' });
        font(x, 'Inter Tight', 30, 500, 'normal', 0.2 * 30);
        x.textAlign = 'center';
        x.fillText('HUMAN TASTE — MACHINE SPEED', 750, 700);
      });
      card = emboss(base, mask, { depth: 2.6 });
    },
    draw(ctx, t) {
      fillBg(ctx, '#23211E');
      const p = win(t, 0, 0.3, decel);
      ctx.save();
      ctx.translate(960, 560);
      ctx.rotate(lerp(-0.1, -0.07, p));
      const s = lerp(1.22, 1.14, p);
      ctx.scale(s, s);
      ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 30;
      ctx.drawImage(card, -CW / 2, -CH / 2);
      ctx.shadowColor = 'transparent';
      // moving light across the paper
      const lx = lerp(-900, 900, win(t, 0, 0.3, soft));
      const g = ctx.createLinearGradient(lx - 400, -450, lx + 400, 450);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,250,240,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = g; ctx.fillRect(-CW / 2, -CH / 2, CW, CH);
      ctx.restore();
    },
    fx: () => ({ grain: 0.04, vignette: 0.35, ca: 0.6 }),
  };
}

