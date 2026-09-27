// SECTION E + END (22.8 - 30.0s): pixel frame, flash montage, the loader, and the
// final lockup on a living halftone field.
import { C, MARK, drawMark, drawWordmark, ringBand, WORD_FONT } from '../brand.js';
import { fillBg, canvas, text, font, cover, rrect, clipRect, camera, measure, layoutChars } from '../gfx.js';
import { A, archColor } from '../assets.js';
import { HALFTONE_FS } from '../shaders.js';
import { Gen } from '../gl.js';
import { hexToRgb, win, snap, decel, soft, swift, outBack, inExpo, outCubic, lerp, clamp, TAU, track, inOutCubic, mulberry32, spring, hash2 } from '../core.js';
import { asciiMark, marbleCarve } from './intro.js';
import { glassMark, layerMark } from './sectionB.js';
import { iconMorph, mintMark } from './sectionD.js';

// ------------------------------------------------------------------ 32. pixelFrame
export function pixelFrame() {
  let img = null;
  return {
    cues: [{ t: 0, s: 'hit', v: 0.9 }, { t: 0.05, s: 'bits', d: 0.3 }, { t: 0.36, s: 'zoom' }],
    async init() { img = await archColor('ring'); },
    draw(ctx, t) {
      fillBg(ctx, '#000');
      const z = track([[0, 1.0], [0.34, 1.02], [0.52, 2.05, snap], [0.9, 2.15]], t);
      const FW = 520, FH = 690;
      ctx.save();
      camera(ctx, { zoom: z, y: 560 });
      ctx.save(); ctx.beginPath(); ctx.rect(960 - FW / 2, 540 - FH / 2, FW, FH); ctx.clip();
      cover(ctx, img, 960 - FW / 2, 540 - FH / 2, FW, FH, 1.15, 0.58, 0.35);
      ctx.restore();
      ctx.strokeStyle = C.yellow; ctx.lineWidth = 5;
      ctx.strokeRect(960 - FW / 2 + 14, 540 - FH / 2 + 14, FW - 28, FH - 28);
      // pixel type, revealed by random blocks
      const reveal = win(t, 0.04, 0.3);
      const lines = ['CVCVTA', '.AI'];
      const P = 7;      // pixel block size
      const layer = canvas(FW, 260), lx = layer.getContext('2d');
      font(lx, 'Silkscreen', 92, 700, 'normal', 4);
      lx.textAlign = 'center'; lx.textBaseline = 'alphabetic';
      lx.lineJoin = 'miter';
      lines.forEach((ln, i) => {
        lx.strokeStyle = '#1a1405'; lx.lineWidth = 12; lx.strokeText(ln, FW / 2, 105 + i * 110);
        lx.fillStyle = C.yellow; lx.fillText(ln, FW / 2, 105 + i * 110);
      });
      lx.letterSpacing = '0px';
      // mask by pixel blocks
      lx.globalCompositeOperation = 'destination-in';
      lx.fillStyle = '#000';
      lx.beginPath();
      for (let by = 0; by < 260; by += P) for (let bx = 0; bx < FW; bx += P) if (hash2(bx * 0.11, by * 0.13) < reveal) lx.rect(bx, by, P, P);
      lx.fill();
      ctx.drawImage(layer, 960 - FW / 2, 540 - 80);
      ctx.restore();
    },
    fx: (t) => ({ grain: 0.05, vignette: 0.25, ca: 1.0 + win(t, 0.34, 0.2) * 2 }),
  };
}

// ------------------------------------------------------------------ flash montage
export function flash(kind) {
  const inner = {
    ascii: () => asciiMark({ flash: true }),
    glass: () => glassMark({ flash: true }),
    marble: () => marbleCarve({ flash: true }),
    layer: () => layerMark({ flash: true, bg: C.ink, color: C.red }),
    icon: () => iconMorph({ flash: true, bg: '#0E1A66', fg: C.peach }),
    mint: () => mintMark({ flash: true }),
  }[kind];
  if (inner) { const s = inner(); s.cues = []; return s; }
  return {
    mb: 1,
    draw(ctx, t, shot) {
      const d = shot.end - shot.start;
      const u = t / d;
      switch (kind) {
        case 'spinRed': {
          fillBg(ctx, C.red);
          drawMark(ctx, 960, 540, 330, { ring: C.paper, chevA: 0, ringRot: t * 14 });
          break;
        }
        case 'wordCrop': {
          fillBg(ctx, C.paper);
          drawWordmark(ctx, lerp(1250, 900, u), 740, 560, { color: C.ink });
          break;
        }
        case 'serif': {
          fillBg(ctx, '#DCE4DA');
          text(ctx, 'Human taste.', 960 + lerp(20, -20, u), 600, { family: 'Instrument Serif', size: 250, color: '#3E4A40', align: 'center', tracking: -0.02 });
          break;
        }
        case 'chevInk': {
          fillBg(ctx, C.ink);
          drawMark(ctx, 700 + lerp(-40, 40, u), 540, 560, { ringA: 0, chev: C.red });
          break;
        }
        case 'yellow': {
          fillBg(ctx, C.yellow);
          drawMark(ctx, 950, 540, 200, { ring: C.ink, chev: C.red });
          break;
        }
        case 'blueWord': {
          fillBg(ctx, C.blue);
          drawWordmark(ctx, 960, 590, 190, { color: C.peach, dotColor: C.peach });
          break;
        }
        case 'whiteRed': {
          fillBg(ctx, '#FFFFFF');
          drawMark(ctx, 950, 540, 250, { ring: C.red, chev: C.red });
          break;
        }
        case 'machine': {
          fillBg(ctx, C.ink);
          text(ctx, 'Machine speed.', 960, 600, { family: 'Instrument Serif', size: 230, color: C.paper, align: 'center', style: 'italic', tracking: -0.02 });
          break;
        }
      }
    },
    fx: () => ({ grain: 0.045, vignette: 0.1, ca: 1.2 }),
  };
}

// ------------------------------------------------------------------ 44. spinnerBlack
export function spinnerBlack() {
  return {
    cues: [{ t: 0, s: 'silence' }, { t: 0.0, s: 'ticks', d: 0.58 }],
    draw(ctx, t) {
      fillBg(ctx, '#000');
      const rot = t * 9 + t * t * 18;
      drawMark(ctx, 960, 540, 34, { ring: C.paper, chevA: 0, ringRot: rot });
      // tiny loader caption: the brand is "generating"
      const tf = Math.round(t * 30) / 30;   // per-frame, so motion-blur subframes agree
      const pct = Math.min(100, Math.floor(lerp(86, 101, win(tf, 0.02, 0.5, outCubic))));
      ctx.globalAlpha = 0.7;
      text(ctx, `GENERATING  ${String(pct).padStart(3, ' ')}%`, 960, 616, { family: 'JetBrains Mono', size: 15, weight: 500, color: C.paper, align: 'center', tracking: 0.22 });
      ctx.globalAlpha = 1;
    },
    fx: () => ({ grain: 0.03, vignette: 0.2, ca: 0.6 }),
  };
}

// ------------------------------------------------------------------ 45. endCard
export function endCard() {
  let gen = null;
  const F = 118;                       // wordmark size
  return {
    cues: [
      { t: 0.0, s: 'final' }, { t: 0.4, s: 'thock' }, { t: 0.7, s: 'swish', v: 0.6 }, { t: 0.74, s: 'type', d: 0.3 },
      { t: 1.15, s: 'shimmer', d: 0.4 }, { t: 1.62, s: 'tick' }, { t: 2.4, s: 'tick', v: 0.4 },
    ],
    init() { gen = A.halftoneGen || (A.halftoneGen = new Gen(960, 540)); },
    draw(ctx, t) {
      // halftone field
      const cnv = gen.run('halftone', HALFTONE_FS, {
        uT: t + 3, uBg: hexToRgb(C.red).map((v) => v / 255), uDot: hexToRgb('#DB3411').map((v) => v / 255), uCell: 9, uAmt: lerp(0.15, 1, decel(win(t, 0, 1.2))),
      }, 960, 540);
      ctx.drawImage(cnv, 0, 0, 1920, 1080);
      const cam = lerp(1.0, 1.025, win(t, 0.8, 2.8, soft));
      ctx.save();
      camera(ctx, { zoom: cam });
      // layout of the lockup
      const L = layoutChars(ctx, 'CVCVTA.AI', { ...WORD_FONT, size: F });
      const Rf = 96, gapX = 64;
      const total = Rf * 2 + gapX + L.width;
      const lx0 = 960 - total / 2;
      const markX = lx0 + Rf * 0.92, markY = 500;
      // phase: spinner grows and settles, then slides to the lockup slot
      const grow = decel(win(t, 0, 0.35));
      const R = lerp(34, 132, grow);
      const slide = snap(win(t, 0.66, 0.38));
      const mx = lerp(960 - 12, markX, slide), my = lerp(540, markY, slide);
      const Rm = lerp(R, Rf, slide);
      const settle = spring(Math.max(0, t - 0.05), 1.7, 0.42);
      const ringRot = (1 - settle) * -(TAU * 2.2);
      const chevIn = decel(win(t, 0.36, 0.3));
      const nudge = Math.sin(clamp((t - 2.4) / 0.22) * Math.PI) * 0.16 + Math.sin(clamp((t - 3.0) / 0.2) * Math.PI) * 0.08;
      drawMark(ctx, mx, my, Rm, {
        ring: C.ink, chev: C.paper, ringRot,
        chevX: lerp(-3.2, 0, chevIn) + nudge, chevA: chevIn > 0 ? 1 : 0, chevS: lerp(0.6, 1, chevIn),
      });
      // heartbeat nudge of the chevron on the downbeat
      // wordmark letters rise from a mask
      const baseY = markY + F * 0.36;
      const wx0 = lx0 + Rf * 2 + gapX;
      font(ctx, WORD_FONT.family, F, WORD_FONT.weight, 'normal', 0);
      L.chars.forEach((c, i) => {
        const p = win(t, 0.74 + i * 0.03, 0.3, decel);
        if (p <= 0) return;
        ctx.save();
        clipRect(ctx, 0, baseY - F * 0.8, 1920, F * 0.82);
        ctx.fillStyle = c.ch === '.' ? C.paper : C.ink;
        ctx.fillText(c.ch, wx0 + c.x, baseY + (1 - p) * F * 0.9);
        ctx.restore();
      });
      // tagline
      const tw = ['Human', 'taste.', 'Machine', 'speed.'];
      let tx = 0;
      const tSize = 66;
      const widths = tw.map((w, i) => measure(ctx, w, { family: 'Instrument Serif', size: tSize, style: i >= 2 ? 'italic' : 'normal' }) + tSize * (i === 1 ? 0.42 : 0.24));
      const tTot = widths.reduce((a, b) => a + b, 0);
      tw.forEach((w, i) => {
        const p = win(t, 1.12 + i * 0.07, 0.3, decel);
        if (p > 0) {
          ctx.globalAlpha = p;
          text(ctx, w, 960 - tTot / 2 + tx, 700 + (1 - p) * 22, { family: 'Instrument Serif', size: tSize, color: C.ink, style: i >= 2 ? 'italic' : 'normal' });
          ctx.globalAlpha = 1;
        }
        tx += widths[i];
      });
      // shine sweeping across the lockup on the downbeat (b48)
      const sh = win(t, 2.4, 0.5, inOutCubic);
      if (sh > 0 && sh < 1) {
        const sx = lerp(lx0 - 300, lx0 + total + 300, sh);
        const g = ctx.createLinearGradient(sx - 120, markY - 200, sx + 120, markY + 200);
        g.addColorStop(0, 'rgba(255,240,225,0)'); g.addColorStop(0.5, 'rgba(255,240,225,0.55)'); g.addColorStop(1, 'rgba(255,240,225,0)');
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        ctx.restore();
        ctx.save();
        ctx.beginPath(); ctx.rect(lx0 - 20, markY - Rf - 20, total + 40, Rf * 2 + 40); ctx.clip();
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = g; ctx.fillRect(lx0 - 20, markY - Rf - 20, total + 40, Rf * 2 + 40);
        ctx.restore();
      }
      // CTA pill
      const cp = win(t, 1.7, 0.3, decel);
      if (cp > 0) {
        const pulse = 1 + Math.sin(clamp((t - 3.0) / 0.24) * Math.PI) * 0.04;
        ctx.save();
        ctx.translate(960, 838); ctx.scale(lerp(0.9, 1, cp) * pulse, lerp(0.9, 1, cp) * pulse);
        ctx.globalAlpha = cp;
        rrect(ctx, -170, -34, 340, 68, 34); ctx.fillStyle = C.ink; ctx.fill();
        text(ctx, 'cvcvta.ai  →', 0, 9, { family: 'JetBrains Mono', size: 24, weight: 700, color: C.paper, align: 'center', tracking: 0.04 });
        ctx.restore();
      }
      ctx.restore();
      // frame details
      const fa = win(t, 1.55, 0.3);
      if (fa > 0) {
        ctx.globalAlpha = fa;
        const M = { family: 'JetBrains Mono', size: 17, weight: 500, color: C.ink, tracking: 0.16 };
        text(ctx, 'BRAND · MOTION · CAMPAIGNS', 80, 90, M);
        text(ctx, 'EST. MMXXVI', 1840, 90, { ...M, align: 'right' });
        text(ctx, 'LET’S BUILD SOMETHING THAT MOVES', 80, 1010, M);
        text(ctx, 'IDENTITY / MOTION / LAUNCH', 1840, 1010, { ...M, align: 'right' });
        ctx.globalAlpha = 1;
      }
    },
    fx: (t) => ({ grain: 0.04, vignette: 0.1, ca: 0.8, flash: Math.max(0, 1 - t / 0.12) * 0.35 }),
  };
}

