// SECTION B (8.4 - 13.2s): craft. Glass, wordmarks, posters, stickers, and the
// mark unfolding into the wordmark.
import { C, MARK, drawMark, drawWordmark, ringBand, chevronPath, WORD_FONT } from '../brand.js';
import { fillBg, canvas, text, font, cover, rrect, clipRect, camera, measure, layoutChars } from '../gfx.js';
import { paper } from '../fx2d.js';
import { A, arch, tone } from '../assets.js';
import { GLASS_FS } from '../shaders.js';
import { Gen } from '../gl.js';
import {
  win, snap, decel, soft, swift, outBack, inExpo, outCubic, lerp, clamp, TAU, track, inOutCubic, mulberry32,
  spring, wobble, outExpo, accel,
} from '../core.js';

// ------------------------------------------------------------------ 12. glassMark
export function glassMark(opts = {}) {
  let gen = null;
  const RW = opts.w || 1920, RH = opts.h || 1080;
  return {
    mb: 1,
    cues: opts.flash ? [] : [{ t: 0.0, s: 'hit', v: 1 }, { t: 0.05, s: 'glass', d: 1.2 }, { t: 1.02, s: 'glitch', d: 0.45 }],
    init() { gen = A.glassGen || (A.glassGen = new Gen(RW, RH)); },
    draw(ctx, t, shot) {
      fillBg(ctx, '#000');
      const tt = opts.flash ? 0.5 : t;
      const intro = decel(win(tt, 0, 0.5));
      const yaw = lerp(-1.6, 0, intro) + 0.42 * Math.sin(tt * 1.7) - 0.1;
      const pitch = 0.18 * Math.sin(tt * 1.1 + 0.4) - 0.08;
      const zoom = lerp(0.85, 1.28, intro) * lerp(1, 1.08, win(tt, 0.5, 1.0, soft));
      const cnv = gen.run('glass', GLASS_FS, { uT: tt, uYaw: yaw, uPitch: pitch, uRoll: 0.04 * Math.sin(tt * 0.9), uZoom: zoom, uSweep: lerp(-1.4, 1.2, win(tt, 0.1, 1.3, inOutCubic)) }, RW, RH);
      ctx.drawImage(cnv, 0, 0, 1920, 1080);
      if (!opts.flash) {
        // glitch breakup: slices of the frame shifted with colored scan bars
        const g = win(t, 1.02, 0.46);
        if (g > 0) {
          const r = mulberry32(Math.floor(t * 30) * 7 + 3);
          const snap2 = ctx.getImageData ? null : null;
          void snap2;
          for (let i = 0; i < 9; i++) {
            const y = r() * 1080, h = 6 + r() * 70 * g;
            const dx = (r() - 0.5) * 420 * g;
            ctx.drawImage(ctx.canvas, 0, y * A.env.SX, 1920 * A.env.SX, h * A.env.SX, dx, y, 1920, h);
            if (r() < 0.45 * g) {
              ctx.fillStyle = ['#FFE14D', '#FF4A1C', '#EAF0FF'][Math.floor(r() * 3)];
              ctx.globalAlpha = 0.85;
              for (let k = 0; k < h; k += 4) ctx.fillRect(dx + 700 + r() * 400, y + k, 200 + r() * 500, 2);
              ctx.globalAlpha = 1;
            }
          }
        }
      }
    },
    fx: (t) => ({ grain: 0.045, vignette: 0.25, ca: 1.6, glitch: opts.flash ? 0 : win(t, 1.1, 0.4) * 0.55 }),
  };
}

// ------------------------------------------------------------------ 13. wordStack
export function wordStack(opts = {}) {
  return {
    cues: opts.flash ? [] : [{ t: 0, s: 'thud' }],
    draw(ctx, t) {
      fillBg(ctx, opts.bg || '#F4F0E6');
      const p = win(t, 0, 0.3, decel);
      const s = lerp(1.1, 1.0, p);
      ctx.save();
      camera(ctx, { zoom: s });
      const size = 250;
      const tr = lerp(0.03, -0.015, p);
      drawWordmark(ctx, 960, 505, size, { text: 'CVCV', color: opts.color || C.ink }, null);
      void tr;
      drawWordmark(ctx, 960, 505 + size * 0.92, size, { text: 'TA.AI', color: opts.color || C.ink });
      ctx.restore();
    },
    fx: () => ({ grain: 0.035, vignette: 0.1, ca: 0.8 }),
  };
}

// ------------------------------------------------------------------ 14. posterWall
export function posterWall() {
  let wall = null;
  const WW = 3000, WH = 1250;
  return {
    cues: [{ t: 0, s: 'whip' }],
    init() {
      const c = paper(WW, WH, '#8F8C86', 33, { noise: 26, fibers: 0 });
      const x = c.getContext('2d');
      const r = mulberry32(99);
      const poster = (px, py, pw, ph, rot, bg, draw) => {
        x.save();
        x.translate(px + pw / 2, py + ph / 2); x.rotate(rot);
        x.shadowColor = 'rgba(0,0,0,0.35)'; x.shadowBlur = 14; x.shadowOffsetY = 6;
        x.fillStyle = bg; x.fillRect(-pw / 2, -ph / 2, pw, ph);
        x.shadowColor = 'transparent';
        x.save(); x.beginPath(); x.rect(-pw / 2, -ph / 2, pw, ph); x.clip();
        draw(x, pw, ph);
        // wheat-paste wrinkles
        x.globalAlpha = 0.12;
        for (let i = 0; i < 14; i++) {
          x.strokeStyle = r() < 0.5 ? '#fff' : '#000'; x.lineWidth = 1 + r() * 2;
          x.beginPath(); const y0 = -ph / 2 + r() * ph; x.moveTo(-pw / 2, y0);
          x.bezierCurveTo(-pw / 6, y0 + (r() - 0.5) * 40, pw / 6, y0 + (r() - 0.5) * 40, pw / 2, y0 + (r() - 0.5) * 30); x.stroke();
        }
        x.globalAlpha = 1;
        x.restore();
        x.restore();
      };
      const T = (s, px, py, o) => { font(x, o.family, o.size, o.weight || 400, 'normal', (o.tracking || 0) * o.size); x.fillStyle = o.color; x.textAlign = o.align || 'left'; x.fillText(s, px, py); x.letterSpacing = '0px'; };
      // repeated small mark posters in a row (like a campaign run)
      for (let i = 0; i < 9; i++) {
        poster(40 + i * 330, 40 + (i % 2) * 18, 300, 420, (r() - 0.5) * 0.04, i % 2 ? C.ink : C.paper, (g, w, h) => {
          drawMark(g, 0, -30, 88, { ring: i % 2 ? C.paper : C.ink, chev: C.red });
          T('CVCVTA.AI', 0, h / 2 - 40, { family: 'Unbounded', size: 26, weight: 800, color: i % 2 ? C.paper : C.ink, align: 'center' });
        });
      }
      // big hero poster
      poster(980, 360, 820, 860, -0.02, C.red, (g, w, h) => {
        ['TASTE', 'IS THE', 'LAST', 'UNFAIR', 'ADVANTAGE.'].forEach((s, i) => T(s, -w / 2 + 44, -h / 2 + 170 + i * 142, { family: 'Anton', size: 160, color: C.paper }));
        drawMark(g, w / 2 - 90, -h / 2 + 90, 44, { ring: C.ink, chev: C.paper });
      });
      poster(260, 520, 640, 680, 0.025, C.ink, (g, w, h) => {
        T('CVCV', 0, -40, { family: 'Unbounded', size: 190, weight: 800, color: C.paper, align: 'center' });
        T('TA.AI', 0, 150, { family: 'Unbounded', size: 190, weight: 800, color: C.paper, align: 'center' });
      });
      poster(1880, 470, 560, 720, 0.03, '#2230FF', (g, w, h) => {
        ['MAKE', 'IT', 'MOVE.'].forEach((s, i) => T(s, -w / 2 + 36, -h / 2 + 200 + i * 190, { family: 'Anton', size: 210, color: '#FBE4D3' }));
      });
      poster(2480, 430, 480, 640, -0.03, C.mint, (g, w, h) => {
        T('HUMAN', 0, -80, { family: 'Instrument Serif', size: 120, color: C.ink, align: 'center' });
        T('×', 0, 30, { family: 'Instrument Serif', size: 120, color: C.red, align: 'center' });
        T('MACHINE', 0, 140, { family: 'Instrument Serif', size: 110, color: C.ink, align: 'center' });
      });
      poster(1860, 1010, 700, 300, 0.01, C.yellow, (g, w, h) => {
        T('BRIEF → BRAND', 0, 40, { family: 'Anton', size: 120, color: C.ink, align: 'center' });
      });
      wall = c;
    },
    draw(ctx, t) {
      const p = win(t, 0, 0.3, swift);
      const x = lerp(-60, -(WW - 1920) + 60, p);
      ctx.drawImage(wall, x, lerp(-40, -120, p));
    },
    shutter: 0.8,
    fx: () => ({ grain: 0.05, vignette: 0.3, ca: 1.0 }),
  };
}

// ------------------------------------------------------------------ 15. stickers
export function stickers() {
  let surf = null;
  const items = [
    { x: 700, y: 470, r: -0.18, s: 1, draw: (g) => { g.beginPath(); g.arc(0, 0, 150, 0, TAU); g.fillStyle = C.red; g.fill(); drawMark(g, -6, 0, 88, { ring: C.paper, chev: C.ink }); }, shape: (g) => { g.beginPath(); g.arc(0, 0, 150, 0, TAU); } },
    { x: 1230, y: 390, r: 0.12, s: 1, draw: (g) => { g.beginPath(); g.roundRect(-260, -70, 520, 140, 70); g.fillStyle = C.paper; g.fill(); drawWordmark(g, 0, 26, 64, { color: C.ink }); }, shape: (g) => { g.beginPath(); g.roundRect(-260, -70, 520, 140, 70); } },
    { x: 1180, y: 730, r: -0.08, s: 1, draw: (g) => { g.beginPath(); g.roundRect(-120, -120, 240, 240, 36); g.fillStyle = C.ink; g.fill(); drawMark(g, -8, 0, 70, { ringA: 0, chev: C.red, chevS: 1.6, chevX: -0.25 }); }, shape: (g) => { g.beginPath(); g.roundRect(-120, -120, 240, 240, 36); } },
    { x: 560, y: 820, r: 0.2, s: 1, draw: (g) => {
      g.beginPath(); g.arc(0, 0, 118, 0, TAU); g.fillStyle = C.yellow; g.fill();
      font(g, 'Inter Tight', 22, 800, 'normal', 3); g.fillStyle = C.ink; g.textAlign = 'center';
      const s = 'HUMAN TASTE • MACHINE SPEED • ';
      for (let i = 0; i < s.length; i++) { g.save(); g.rotate((i / s.length) * TAU); g.fillText(s[i], 0, -86); g.restore(); }
      g.letterSpacing = '0px';
      drawMark(g, -4, 0, 44, { ring: C.ink, chev: C.red });
    }, shape: (g) => { g.beginPath(); g.arc(0, 0, 118, 0, TAU); } },
  ];
  return {
    cues: [{ t: 0.0, s: 'slap' }, { t: 0.07, s: 'slap' }, { t: 0.14, s: 'slap' }, { t: 0.21, s: 'slap' }],
    init() { surf = paper(1920, 1080, '#161617', 41, { noise: 12, fibers: 0 }); },
    draw(ctx, t) {
      ctx.drawImage(surf, 0, 0);
      // laptop lid highlight
      const g = ctx.createLinearGradient(0, 0, 1920, 1080);
      g.addColorStop(0, 'rgba(255,255,255,0.06)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.03)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
      items.forEach((it, i) => {
        const p = win(t, i * 0.07, 0.12);
        if (p <= 0) return;
        const land = outBack(p, 1.3);
        const sc = lerp(1.5, 1, land);
        const lift = 1 - p;
        ctx.save();
        ctx.translate(it.x, it.y);
        ctx.rotate(it.r + (1 - p) * 0.25);
        ctx.scale(sc, sc);
        ctx.globalAlpha = Math.min(1, p * 3);
        ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 8 + lift * 50; ctx.shadowOffsetY = 4 + lift * 40;
        it.shape(ctx);
        ctx.lineJoin = 'round'; ctx.strokeStyle = '#FAFAF7'; ctx.lineWidth = 22; ctx.stroke();
        ctx.fillStyle = '#FAFAF7'; ctx.fill();
        ctx.shadowColor = 'transparent';
        it.draw(ctx);
        ctx.restore();
      });
    },
    fx: () => ({ grain: 0.045, vignette: 0.3, ca: 0.8 }),
  };
}

// ------------------------------------------------------------------ 16. wordBuild
export function wordBuild() {
  const F = 150;
  return {
    cues: [{ t: 0.0, s: 'pop' }, { t: 0.3, s: 'tick' }, { t: 0.5, s: 'swish', v: 0.7 }, { t: 0.64, s: 'type', d: 0.3 }, { t: 0.95, s: 'thock', v: 0.6 }],
    draw(ctx, t) {
      fillBg(ctx, C.red);
      // final layout = the real wordmark, with glyphs 0 ('C') and 1 ('V') replaced by
      // the ring and the chevron sized to those glyphs' ink boxes
      const word = 'CVCVTA.AI';
      const L = layoutChars(ctx, word, { ...WORD_FONT, size: F });
      font(ctx, WORD_FONT.family, F, WORD_FONT.weight, 'normal', 0);
      const mC = ctx.measureText('C'), mV = ctx.measureText('V');
      const capH = mV.actualBoundingBoxAscent;
      const x0 = 960 - L.width / 2;
      const base = 540 + capH / 2;
      const cBox = { l: x0 + L.chars[0].x - mC.actualBoundingBoxLeft, r: x0 + L.chars[0].x + mC.actualBoundingBoxRight, h: mC.actualBoundingBoxAscent + mC.actualBoundingBoxDescent };
      const vBox = { l: x0 + L.chars[1].x - mV.actualBoundingBoxLeft, r: x0 + L.chars[1].x + mV.actualBoundingBoxRight };
      const Rw = Math.max(cBox.h, cBox.r - cBox.l) / 2 * 1.0;
      const ringC = { x: (cBox.l + cBox.r) / 2 + Rw * 0.06, y: base - capH / 2 };
      const vW = vBox.r - vBox.l;
      const chevS = Math.min(vW / 1.04, capH / 0.74);
      const chevC = { x: (vBox.l + vBox.r) / 2, y: base - capH / 2 };
      // phase 1: big mark at center
      const m = decel(win(t, 0.5, 0.26));
      const Rbig = 150;
      const pop = outBack(win(t, 0, 0.2), 1.8);
      const nudge = Math.sin(clamp((t - 0.28) / 0.16) * Math.PI) * 0.12;
      const rc = { x: lerp(960 - 20, ringC.x, m), y: lerp(540, ringC.y, m) };
      const R = lerp(Rbig, Rw, m);
      drawMark(ctx, rc.x, rc.y, R * pop, {
        ring: C.paper, chevA: 0, inner: lerp(0.64, 0.5, m), gap: lerp(MARK.gap, 0.62, m),
        ringRot: lerp(-TAU, 0, decel(win(t, 0, 0.3))),
      });
      // chevron: from the mark's mouth to the V slot, rotating to point down
      const sBig = Rbig * pop;
      const s = lerp(sBig, chevS, m);
      const rot = lerp(0, Math.PI / 2, snap(win(t, 0.48, 0.26)));
      const cx0 = 960 - 20 + 0.47 * sBig + nudge * sBig;
      ctx.save();
      ctx.translate(lerp(cx0, chevC.x, m), lerp(540, chevC.y, m));
      ctx.rotate(rot);
      ctx.translate(-0.47 * s, 0);
      chevronPath(ctx, 0, 0, s, { chevS: m < 0.01 ? outBack(win(t, 0.08, 0.2), 2) : 1 });
      ctx.fillStyle = C.ink; ctx.fill();
      ctx.restore();
      // remaining letters rise from a mask line
      L.chars.forEach((c, i) => {
        if (i < 2) return;
        const p = win(t, 0.62 + (i - 2) * 0.035, 0.28, decel);
        if (p <= 0) return;
        ctx.save();
        clipRect(ctx, 0, base - capH - 40, 1920, capH + 40 + F * 0.03);
        ctx.fillStyle = c.ch === '.' ? C.ink : C.paper;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(c.ch, x0 + c.x, base + (1 - p) * capH * 1.3);
        ctx.restore();
      });
    },
    fx: () => ({ grain: 0.045, vignette: 0.06, ca: 0.9 }),
  };
}

// ------------------------------------------------------------------ 17. layerMark
export function layerMark(opts = {}) {
  const bg = opts.bg || C.peach, col = opts.color || C.blue;
  return {
    cues: opts.flash ? [] : [{ t: 0.0, s: 'swish', v: 0.6 }, { t: 0.08, s: 'swish', v: 0.5 }, { t: 0.16, s: 'swish', v: 0.4 }, { t: 0.3, s: 'snap' }, { t: 0.36, s: 'sweep', d: 0.2 }],
    draw(ctx, t) {
      fillBg(ctx, bg);
      const R = 170, cx = 960, cy = 540;
      const tt = opts.flash ? 0.6 : t;
      const collapse = snap(win(tt, 0.26, 0.14));
      for (let k = 2; k >= 0; k--) {
        const p = win(tt, k * 0.08, 0.2, decel);
        if (p <= 0) continue;
        const spread = (k - 1) * R * 0.62 * (1 - collapse);
        const x = lerp(-700, cx + spread, p);
        ctx.save();
        ctx.globalAlpha = k === 1 ? 1 : lerp(0.85, 1, collapse);
        drawMark(ctx, x, cy, R, { ringA: 0, chev: col });
        ctx.restore();
      }
      const sw = decel(win(tt, 0.34, 0.24));
      if (sw > 0) drawMark(ctx, cx, cy, R, { ring: col, chevA: 0, ringFrom: MARK.gap, ringTo: MARK.gap + (TAU - 2 * MARK.gap) * sw });
      const rot = spring(Math.max(0, tt - 0.5), 3, 0.35) * 0.0;
      void rot;
    },
    fx: () => ({ grain: 0.035, vignette: 0.06, ca: 0.7 }),
  };
}

// ------------------------------------------------------------------ 18. photoLogo
export function photoLogo() {
  let img = null;
  return {
    cues: [{ t: 0.0, s: 'shutter' }],
    async init() { img = await tone('ring', await arch('ring'), { mode: 1, dark: '#1E130D', light: '#F8E9D6', contrast: 1.35, bright: -0.02, w: 1920 }); },
    draw(ctx, t) {
      const z = lerp(1.1, 1.16, win(t, 0, 0.6, soft));
      cover(ctx, img, 0, 0, 1920, 1080, z, 0.55, 0.5);
      const g = ctx.createLinearGradient(0, 600, 0, 1080);
      g.addColorStop(0, 'rgba(20,12,8,0)'); g.addColorStop(1, 'rgba(20,12,8,0.55)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
      const p = win(t, 0, 0.22, decel);
      ctx.save();
      clipRect(ctx, 0, 0, 1920, 1080);
      drawWordmark(ctx, 96, 1000 + (1 - p) * 40, 150, { color: C.paper, align: 'left', dotColor: C.red });
      ctx.restore();
      text(ctx, 'MONUMENT SERIES', 100, 110, { family: 'JetBrains Mono', size: 18, weight: 500, color: 'rgba(248,233,214,0.85)', tracking: 0.2 });
      text(ctx, '001 / 004', 1820, 110, { family: 'JetBrains Mono', size: 18, weight: 500, color: 'rgba(248,233,214,0.85)', align: 'right', tracking: 0.2 });
    },
    fx: () => ({ grain: 0.05, vignette: 0.28, ca: 0.8 }),
  };
}

