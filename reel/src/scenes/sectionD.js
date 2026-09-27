// SECTION D (18.0 - 22.8s): heritage + system. Luxury frame, wax seal, a morphing
// media-control icon system, editorial print, and a rapid run of brand frames.
import { C, MARK, drawMark, drawWordmark, ringBand } from '../brand.js';
import { fillBg, canvas, text, font, cover, rrect, clipRect, camera, measure } from '../gfx.js';
import { paper, drawFlipY } from '../fx2d.js';
import { A, arch, tone, waxSeal } from '../assets.js';
import {
  win, snap, decel, soft, swift, outBack, inExpo, outCubic, lerp, clamp, TAU, track, inOutCubic, mulberry32, spring,
} from '../core.js';

// ------------------------------------------------------------------ 24. luxury
export function luxury() {
  let curtains = null;
  return {
    cues: [{ t: 0, s: 'hit', v: 1 }, { t: 0.02, s: 'shimmer', d: 0.4 }],
    init() {
      // engraved line-art drapes (ivory on transparent), both sides + valance
      const c = canvas(1920, 1080), x = c.getContext('2d');
      x.strokeStyle = C.ivory; x.lineWidth = 1.6; x.globalAlpha = 0.9;
      // hourglass drapes: parallel fold lines gathered at a tie-back, flaring below
      for (const side of [-1, 1]) {
        const cx = side < 0 ? 0 : 1920;
        const widthAt = (y) => {
          if (y < 640) return lerp(360, 150, Math.pow((y - 110) / 530, 1.6));
          return lerp(150, 430, Math.pow((y - 640) / 450, 0.8));
        };
        for (let i = 0; i < 30; i++) {
          const u = i / 29;
          x.globalAlpha = 0.55 + 0.4 * Math.abs(Math.sin(u * 9.4));
          x.beginPath();
          for (let y = 110; y <= 1090; y += 6) {
            const wv = widthAt(y);
            const fold = Math.sin(u * Math.PI * 9 + y * 0.0045) * 5 * (y < 640 ? 0.6 : 1.3);
            const xx = cx - side * (u * wv + fold);
            if (y === 110) x.moveTo(xx, y); else x.lineTo(xx, y);
          }
          x.stroke();
        }
        x.globalAlpha = 0.9;
        // tie-back sash + tassel
        x.lineWidth = 3;
        x.beginPath(); x.ellipse(cx - side * 150, 640, 110, 20, side * 0.25, 0, TAU); x.stroke();
        x.beginPath(); x.moveTo(cx - side * 230, 650); x.lineTo(cx - side * 236, 730); x.stroke();
        for (let k = 0; k < 7; k++) { x.beginPath(); x.moveTo(cx - side * (226 + k * 3), 730); x.lineTo(cx - side * (222 + k * 4), 780); x.stroke(); }
        x.lineWidth = 1.6;
      }
      // valance with scallops + fringe
      x.beginPath(); x.moveTo(0, 30); x.lineTo(1920, 30); x.stroke();
      for (let i = 0; i < 16; i++) {
        const x0 = i * 120;
        x.beginPath(); x.arc(x0 + 60, 70, 60, Math.PI, 0, true); x.stroke();
        x.beginPath(); x.arc(x0 + 60, 70, 48, Math.PI, 0, true); x.stroke();
        for (let k = 0; k < 11; k++) { const fx = x0 + 10 + k * 10; const fy = 70 + Math.sqrt(Math.max(0, 3600 - (fx - x0 - 60) ** 2)); x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx, fy + 18); x.stroke(); }
      }
      curtains = c;
    },
    draw(ctx, t) {
      fillBg(ctx, C.wine);
      const g = ctx.createRadialGradient(960, 520, 50, 960, 540, 900);
      g.addColorStop(0, 'rgba(255,120,90,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0.25)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
      const part = decel(win(t, 0, 0.6));
      ctx.save(); clipRect(ctx, 0, 0, 960, 1080); ctx.drawImage(curtains, -part * 50, 0); ctx.restore();
      ctx.save(); clipRect(ctx, 960, 0, 960, 1080); ctx.drawImage(curtains, part * 50, 0); ctx.restore();
      const p = win(t, 0, 0.35, decel);
      const blur = (1 - p) * 14;
      ctx.save();
      if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(1)}px)`;
      ctx.globalAlpha = p;
      const s = lerp(1.06, 1, p);
      ctx.translate(960, 540); ctx.scale(s, s);
      text(ctx, 'Cvcvta', 0, 40, { family: 'Bodoni Moda', size: 230, weight: 500, style: 'italic', color: C.ivory, align: 'center', tracking: -0.02 });
      ctx.filter = 'none';
      text(ctx, 'HOUSE OF IDEAS  ·  EST. MMXXVI', 0, 130, { family: 'Cinzel', size: 26, weight: 600, color: C.ivory, align: 'center', tracking: 0.3 });
      ctx.restore();
    },
    fx: () => ({ grain: 0.05, vignette: 0.3, ca: 0.8 }),
  };
}

// ------------------------------------------------------------------ 25. waxSeal
export function waxSealShot() {
  let seal = null, env = null;
  return {
    cues: [{ t: 0.0, s: 'whoosh', v: 0.5 }, { t: 0.13, s: 'stamp' }],
    async init() {
      seal = await waxSeal(900);
      env = paper(1920, 1080, '#F1D6D2', 5, { noise: 8, fibers: 600, fiberAlpha: 0.04 });
    },
    draw(ctx, t) {
      // impact shake
      const hit = Math.max(0, t - 0.13);
      const shake = t > 0.13 ? Math.exp(-hit * 22) * 14 : 0;
      ctx.save();
      camera(ctx, { zoom: 1.04 + (t > 0.13 ? Math.exp(-hit * 16) * 0.03 : 0), dx: Math.sin(hit * 90) * shake, dy: Math.cos(hit * 70) * shake * 0.6 });
      ctx.drawImage(env, 0, 0);
      // envelope flap (triangle) with shadow
      ctx.save();
      ctx.shadowColor = 'rgba(90,30,30,0.35)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 12;
      ctx.beginPath(); ctx.moveTo(-40, -40); ctx.lineTo(1960, -40); ctx.lineTo(960, 640); ctx.closePath();
      ctx.fillStyle = '#E4B2AD'; ctx.fill();
      ctx.restore();
      const fl = ctx.createLinearGradient(0, 0, 0, 640);
      fl.addColorStop(0, 'rgba(255,255,255,0.08)'); fl.addColorStop(1, 'rgba(120,40,40,0.10)');
      ctx.beginPath(); ctx.moveTo(-40, -40); ctx.lineTo(1960, -40); ctx.lineTo(960, 640); ctx.closePath(); ctx.fillStyle = fl; ctx.fill();
      // seal drops in and stamps
      const p = win(t, 0, 0.13, inExpo);
      const squash = t > 0.13 ? 1 + Math.exp(-hit * 18) * Math.sin(hit * 40) * 0.05 : 1;
      const s = lerp(1.9, 1, p) * squash;
      const S = 440 * s;
      ctx.save();
      ctx.translate(960, 600);
      ctx.rotate(lerp(0.5, -0.08, p));
      ctx.shadowColor = 'rgba(70,30,10,0.5)'; ctx.shadowBlur = lerp(80, 18, p); ctx.shadowOffsetY = lerp(70, 10, p);
      ctx.globalAlpha = clamp(p * 4);
      ctx.drawImage(seal, -S / 2, -S / 2, S, S);
      ctx.restore();
      ctx.restore();
    },
    fx: () => ({ grain: 0.04, vignette: 0.22, ca: 0.7 }),
  };
}

// ------------------------------------------------------------------ 26. iconMorph
// Glyphs are pairs of polygons resampled to N points so any state can morph into any other.
const N = 48;
function resample(poly, n = N) {
  const pts = [...poly, poly[0]];
  const seg = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); total += d; }
  const out = [];
  for (let k = 0; k < n; k++) {
    let d = (k / n) * total, i = 0;
    while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
    const u = seg[i] ? d / seg[i] : 0;
    out.push([lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u)]);
  }
  return out;
}
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const halfDisc = (cx, cy, r, left) => { const p = []; for (let i = 0; i <= 24; i++) { const a = (left ? Math.PI / 2 : -Math.PI / 2) + (i / 24) * Math.PI; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; };
const [T, B1, NN] = [MARK.tip, MARK.back, MARK.notch];
const GLYPHS = {
  play: [resample([[T[0], 0], [B1[0], -B1[1]], [NN[0], 0]]), resample([[T[0], 0], [NN[0], 0], [B1[0], B1[1]]])],
  pause: [resample(rect(-0.26, -0.3, -0.08, 0.3)), resample(rect(0.08, -0.3, 0.26, 0.3))],
  record: [resample(halfDisc(0, 0, 0.3, true)), resample(halfDisc(0, 0, 0.3, false))],
  stop: [resample(rect(-0.25, -0.25, 0, 0.25)), resample(rect(0, -0.25, 0.25, 0.25))],
};
function lerpGlyph(a, b, u) { return a.map((poly, j) => poly.map((p, k) => [lerp(p[0], b[j][k][0], u), lerp(p[1], b[j][k][1], u)])); }

export function iconMorph(opts = {}) {
  const bg = opts.bg || C.green, fg = opts.fg || C.gold;
  const seq = [['play', 0], ['pause', 0.6], ['record', 0.9], ['stop', 1.2], ['play', 1.5]];
  return {
    cues: opts.flash ? [] : [{ t: 0.0, s: 'draw', d: 0.25 }, { t: 0.6, s: 'click' }, { t: 0.9, s: 'click' }, { t: 1.2, s: 'click' }, { t: 1.5, s: 'swish', v: 0.6 }],
    draw(ctx, t) {
      fillBg(ctx, bg);
      const tt = opts.flash ? 0.45 : t;
      const R = 175, cx = 960, cy = 540;
      // current glyph
      let g = GLYPHS.play, gap = MARK.gap;
      for (let i = 1; i < seq.length; i++) {
        const [name, at] = seq[i];
        const u = snap(win(tt, at, 0.14));
        const prev = GLYPHS[seq[i - 1][0]];
        if (tt >= at) g = lerpGlyph(prev, GLYPHS[name], u);
        const gA = seq[i - 1][0] === 'play' ? MARK.gap : 0.0001, gB = name === 'play' ? MARK.gap : 0.0001;
        if (tt >= at) gap = lerp(gA, gB, u);
      }
      // build-in: a line grows, then the ring sweeps open from it
      const line = decel(win(tt, 0, 0.14));
      const sweep = decel(win(tt, 0.1, 0.22));
      const rot = (spring(Math.max(0, tt - 1.5), 2.6, 0.32) - (tt > 1.5 ? 1 : 0)) * -0.6 + (tt > 1.5 ? 0 : 0);
      const wob = tt > 1.5 ? Math.sin((tt - 1.5) * 14) * Math.exp(-(tt - 1.5) * 5) * 0.35 : 0;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(wob + rot * 0);
      ctx.fillStyle = fg;
      if (sweep < 1) {
        ctx.fillRect(-R * line, R * 0.82 - 6, 2 * R * line, 12);
      }
      if (sweep > 0) {
        const a0 = gap, a1 = TAU - gap;
        const mid = Math.PI / 2;
        ringBand(ctx, 0, 0, R, lerp(mid, a0, sweep), lerp(mid, a1, sweep));
        ctx.fill();
        const gp = outBack(win(tt, 0.2, 0.2), 2);
        if (gp > 0) {
          ctx.save();
          ctx.scale(gp, gp);
          for (const poly of g) {
            ctx.beginPath(); ctx.moveTo(poly[0][0] * R, poly[0][1] * R);
            for (let k = 1; k < poly.length; k++) ctx.lineTo(poly[k][0] * R, poly[k][1] * R);
            ctx.closePath(); ctx.fill();
          }
          ctx.restore();
        }
      }
      ctx.restore();
    },
    fx: () => ({ grain: 0.04, vignette: 0.12, ca: 0.8 }),
  };
}

// ------------------------------------------------------------------ 27. editorial
export function editorial() {
  let kraft = null, page = null, pic = null;
  return {
    cues: [{ t: 0, s: 'paper' }],
    async init() {
      kraft = paper(760, 980, '#B89A73', 17, { noise: 22, fibers: 2400, fiberAlpha: 0.12, fiber: '#5a4028' });
      page = paper(820, 1000, '#F1EBDD', 18, { noise: 8, fibers: 500 });
      pic = await tone('plinth', await arch('plinth'), { mode: 1, dark: '#3b2b1d', light: '#e9dcc6', contrast: 1.4, w: 400 });
    },
    draw(ctx, t) {
      fillBg(ctx, '#1a1917');
      const z = lerp(1.06, 1.0, win(t, 0, 0.3, decel));
      ctx.save();
      camera(ctx, { zoom: z, dx: lerp(30, 0, win(t, 0, 0.3, decel)) });
      // left page
      ctx.save(); ctx.translate(120, 40);
      ctx.drawImage(page, 0, 0);
      const T = (s, x, y, o) => text(ctx, s, x, y, { color: '#2a241d', ...o });
      T('TASTE', 60, 190, { family: 'Instrument Serif', size: 150 });
      T('is the', 90, 300, { family: 'Instrument Serif', size: 120, style: 'italic' });
      T('LAST UNFAIR', 60, 420, { family: 'Instrument Serif', size: 120 });
      T('advantage.', 60, 530, { family: 'Instrument Serif', size: 120, style: 'italic' });
      cover(ctx, pic, 520, 600, 240, 300, 1.2);
      T('CVCVTA.AI — FIELD NOTES, VOL. 01', 60, 950, { family: 'JetBrains Mono', size: 14, weight: 500, tracking: 0.1 });
      ctx.restore();
      // kraft folder
      ctx.save(); ctx.translate(1010, 60);
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetX = -10;
      ctx.drawImage(kraft, 0, 0);
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#A88B66'; ctx.fillRect(730, 120, 40, 220);
      text(ctx, 'THE', 380, 380, { family: 'Anton', size: 150, color: '#1d1812', align: 'center' });
      text(ctx, 'CVCVTA', 380, 530, { family: 'Anton', size: 150, color: '#1d1812', align: 'center' });
      text(ctx, 'ISSUE', 380, 680, { family: 'Anton', size: 150, color: '#1d1812', align: 'center' });
      text(ctx, 'Nº 01 — HUMAN TASTE / MACHINE SPEED', 380, 880, { family: 'JetBrains Mono', size: 16, weight: 500, color: '#2a2016', align: 'center', tracking: 0.08 });
      ctx.restore();
      ctx.restore();
    },
    fx: () => ({ grain: 0.05, vignette: 0.3, ca: 0.8 }),
  };
}

// ------------------------------------------------------------------ 28-30. rapid brand frames
export function mintMark(opts = {}) {
  return {
    cues: opts.flash ? [] : [{ t: 0, s: 'tick' }],
    draw(ctx, t) {
      fillBg(ctx, opts.bg || C.mint);
      const s = lerp(0.9, 1, outBack(win(t, 0, 0.2), 1.6));
      drawMark(ctx, 950, 540, 170 * s, { ring: opts.fg || C.ink, chev: opts.fg || C.ink, outline: 10 });
    },
    fx: () => ({ grain: 0.035, vignette: 0.08, ca: 0.7 }),
  };
}
export function blackWord() {
  return {
    cues: [{ t: 0, s: 'tick' }],
    draw(ctx, t) {
      fillBg(ctx, '#050505');
      const p = win(t, 0, 0.2, decel);
      drawMark(ctx, 610, 520, 62, { ring: C.mint, chev: C.mint, outline: 5 });
      ctx.save(); clipRect(ctx, 700, 380, 1100, 240);
      drawWordmark(ctx, 718 + (1 - p) * -60, 562, 112, { color: C.mint, align: 'left', dotColor: C.mint });
      ctx.restore();
    },
    fx: () => ({ grain: 0.04, vignette: 0.2, ca: 0.8 }),
  };
}
export function markGrid() {
  return {
    cues: [{ t: 0, s: 'tick' }, { t: 0.1, s: 'tick', v: 0.5 }, { t: 0.2, s: 'tick', v: 0.4 }],
    draw(ctx, t) {
      fillBg(ctx, '#050505');
      for (let i = 0; i < 8; i++) {
        const cx = 960 + ((i % 4) - 1.5) * 250, cy = 540 + (Math.floor(i / 4) - 0.5) * 250;
        const p = snap(win(t, i * 0.025, 0.16));
        const dir = [0, 1, 2, 3, 3, 2, 1, 0][i];
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(dir * Math.PI / 2 * p);
        drawMark(ctx, 0, 0, 82, { ring: C.paper, chev: i === 5 ? C.red : C.paper, outline: i === 5 ? 0 : 4.5 });
        ctx.restore();
      }
    },
    fx: () => ({ grain: 0.04, vignette: 0.2, ca: 0.8 }),
  };
}

// ------------------------------------------------------------------ 31. uiCards
export function uiCards() {
  let c1 = null, c2 = null;
  const mk = (w, h, bg, draw) => { const c = canvas(w * 2, h * 2), x = c.getContext('2d'); x.scale(2, 2); x.beginPath(); x.roundRect(0, 0, w, h, 26); x.fillStyle = bg; x.fill(); draw(x, w, h); return c; };
  return {
    cues: [{ t: 0, s: 'swish', v: 0.6 }, { t: 0.08, s: 'swish', v: 0.5 }],
    init() {
      c1 = mk(640, 430, '#E3F1E6', (x, w, h) => {
        x.beginPath(); x.roundRect(28, 28, 56, 56, 14); x.fillStyle = C.red; x.fill();
        drawMark(x, 54, 56, 17, { ring: C.paper, chev: C.ink });
        text(x, 'CVCVTA', 100, 52, { family: 'Inter Tight', size: 20, weight: 700, color: '#111' });
        text(x, 'Creative Director · now', 100, 78, { family: 'Inter Tight', size: 16, weight: 500, color: '#667' });
        ['Three directions are ready.', 'Want me to animate the winner', 'and cut the launch spots?'].forEach((s, i) => text(x, s, 30, 150 + i * 44, { family: 'Instrument Serif', size: 36, color: '#1c2a20' }));
        x.beginPath(); x.roundRect(30, 330, 250, 60, 30); x.fillStyle = '#1c2a20'; x.fill();
        text(x, 'Make it move  →', 155, 368, { family: 'Inter Tight', size: 19, weight: 600, color: '#E3F1E6', align: 'center' });
        x.beginPath(); x.roundRect(296, 330, 150, 60, 30); x.strokeStyle = '#1c2a20'; x.lineWidth = 1.5; x.stroke();
        text(x, 'Not yet', 371, 368, { family: 'Inter Tight', size: 19, weight: 600, color: '#1c2a20', align: 'center' });
      });
      c2 = mk(600, 520, '#F2F1EC', (x, w, h) => {
        text(x, 'PROJECT BRIEF', 30, 58, { family: 'JetBrains Mono', size: 16, weight: 700, color: '#111', tracking: 0.14 });
        x.fillStyle = '#ddd'; x.fillRect(30, 76, w - 60, 1.5);
        [['BRAND', 'Northwind'], ['DELIVERABLES', 'Identity · Motion · Launch'], ['TIMELINE', 'This month'], ['TONE', 'Bold, warm, fearless']].forEach(([k, v], i) => {
          text(x, k, 30, 124 + i * 86, { family: 'JetBrains Mono', size: 13, weight: 500, color: '#888', tracking: 0.12 });
          text(x, v, 30, 158 + i * 86, { family: 'Inter Tight', size: 26, weight: 600, color: '#111' });
        });
        x.beginPath(); x.roundRect(30, h - 84, w - 60, 58, 29); x.fillStyle = C.red; x.fill();
        text(x, 'Submit brief', w / 2, h - 46, { family: 'Inter Tight', size: 20, weight: 700, color: '#fff', align: 'center' });
      });
    },
    draw(ctx, t) {
      fillBg(ctx, '#060606');
      const p1 = decel(win(t, 0, 0.3)), p2 = decel(win(t, 0.07, 0.3));
      const f = lerp(1, 1.02, win(t, 0.3, 0.3, soft));
      ctx.save(); camera(ctx, { zoom: f });
      const card = (img, x, y, w, h, a) => {
        ctx.save(); ctx.filter = 'blur(28px)'; ctx.fillStyle = 'rgba(0,0,0,0.65)';
        const cw = w * Math.abs(Math.cos(a));
        ctx.fillRect(x - cw / 2 + 10, y - h / 2 + 30, cw, h); ctx.restore();
        drawFlipY(ctx, img, x, y, w, h, a, { persp: 0.0009 });
      };
      card(c2, lerp(1900, 1250, p2), 560, 600, 520, lerp(0.8, 0.22, p2));
      card(c1, lerp(1700, 720, p1), 520, 640, 430, lerp(0.7, -0.18, p1));
      ctx.restore();
    },
    fx: () => ({ grain: 0.04, vignette: 0.25, ca: 0.8 }),
  };
}

