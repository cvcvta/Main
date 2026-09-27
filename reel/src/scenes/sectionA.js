// SECTION A (3.6 - 8.4s): identity world. Editorial serif, dithered architecture,
// a website, and an AI prompt that generates four directions.
import { C, drawMark, drawWordmark } from '../brand.js';
import { fillBg, canvas, text, font, cover, rrect, clipRect, camera, measure, layoutChars, noiseCanvas, drawChars } from '../gfx.js';
import { paper } from '../fx2d.js';
import { A, arch, tone } from '../assets.js';
import {
  win, snap, decel, soft, swift, outBack, inExpo, outCubic, lerp, clamp, TAU, hash2, track, inOutCubic, scrambleText,
  mulberry32, outExpo,
} from '../core.js';

const SAGE_D = '#3E4A40', SAGE_L = '#DCE4DA';

// ------------------------------------------------------------------ 6. tagCard
export function tagCard() {
  return {
    cues: [{ t: 0, s: 'hit', v: 1 }],
    draw(ctx, t) {
      fillBg(ctx, C.charcoal);
      const lines = ['CVCVTA.AI', 'CREATIVE UNIT', 'Nº 001'];
      const size = 118, lh = 104;
      const y0 = 540 - lh + 22;
      lines.forEach((ln, i) => {
        const p = win(t, i * 0.035, 0.16, decel);
        ctx.save();
        clipRect(ctx, 0, y0 + i * lh - size * 0.86, 1920, size * 0.98);
        const str = i === 2 ? 'Nº ' + scrambleText('001', win(t, 0.05, 0.18), t, 40, '0123456789') : ln;
        text(ctx, str, 960, y0 + i * lh + (1 - p) * size, { family: 'Big Shoulders Display', size, weight: 800, color: C.mint, align: 'center', tracking: 0.01 });
        ctx.restore();
      });
    },
    fx: () => ({ grain: 0.05, vignette: 0.2, ca: 1.2 }),
  };
}

// ------------------------------------------------------------------ 7. kineticSerif
export function kineticSerif() {
  let bg = null, card = null;
  const words = [
    { w: 'Brands', line: 0 }, { w: 'that', line: 0 }, { w: 'move', line: 1 }, { w: 'people.', line: 1 },
  ];
  const offs = [[0, 0], [34, 30], [-8, 58], [48, 96]];
  const size = 172, X = 236, L0 = 352, LH = 158;
  return {
    cues: [{ t: 0.05, s: 'tick' }, { t: 0.14, s: 'tick' }, { t: 0.23, s: 'tick' }, { t: 0.32, s: 'tick' }, { t: 0.44, s: 'swish', v: 0.5 }],
    async init() {
      bg = await tone('arches', await arch('arches'), { mode: 0, dark: SAGE_D, light: '#E9EFE7', cell: 2, contrast: 1.5, bright: -0.04, w: 1920 });
      card = await tone('stairs', await arch('stairs'), { mode: 0, dark: '#2F3A31', light: '#D3DCD1', cell: 2, contrast: 1.55, w: 1000 });
    },
    draw(ctx, t) {
      fillBg(ctx, SAGE_L);
      const push = lerp(1.0, 1.035, win(t, 0.5, 0.7, soft));
      ctx.save();
      camera(ctx, { zoom: push, x: 700, y: 480 });
      cover(ctx, bg, -40, -40, 2000, 1160, 1.55, 0.42, 0.42);
      // page card
      const px = 118, pw = 1684;
      ctx.fillStyle = SAGE_L;
      ctx.fillRect(px, -20, pw, 1120);
      // nav
      const na = win(t, 0.0, 0.2);
      ctx.globalAlpha = na;
      drawWordmark(ctx, X, 96, 20, { color: SAGE_D, align: 'left' });
      ['Work', 'Studio', 'Brief us'].forEach((s, i) => text(ctx, s, 1420 + i * 118, 96, { family: 'Inter Tight', size: 19, weight: 500, color: SAGE_D }));
      ctx.globalAlpha = 1;
      // mark top-right (spins in like a loader, then settles)
      const mp = win(t, 0.06, 0.5, decel);
      drawMark(ctx, 1662, 224, 44, { ring: SAGE_D, chev: C.red, ringRot: lerp(-TAU * 1.25, 0, mp), chevS: outBack(win(t, 0.3, 0.3), 2), ringA: win(t, 0.06, 0.1) });
      // headline: words drop in on staggered baselines, then snap into the layout
      const settle = snap(win(t, 0.4, 0.34));
      font(ctx, 'Instrument Serif', size, 400);
      const sp = measure(ctx, ' ', { family: 'Instrument Serif', size, weight: 400 });
      let lineX = [X, X];
      words.forEach((wd, i) => {
        const wW = measure(ctx, wd.w, { family: 'Instrument Serif', size, weight: 400, tracking: -0.012 });
        const fx = lineX[wd.line];
        lineX[wd.line] += wW + sp * 0.9;
        const ti = 0.04 + i * 0.09;
        const a = win(t, ti, 0.08);
        if (a <= 0) return;
        const drop = (1 - outCubic(win(t, ti, 0.16))) * -26;
        const x = fx + offs[i][0] * (1 - settle);
        const y = L0 + wd.line * LH + offs[i][1] * (1 - settle) + drop;
        ctx.globalAlpha = a;
        text(ctx, wd.w, x, y, { family: 'Instrument Serif', size, weight: 400, color: SAGE_D, tracking: -0.012 });
        ctx.globalAlpha = 1;
      });
      // body copy, wiped in line by line
      const body = [
        'CVCVTA.AI is a creative studio where human taste meets',
        'machine speed. Identity, motion and campaigns for brands',
        'that refuse to stand still: designed by people,',
        'accelerated by AI.',
      ];
      body.forEach((ln, i) => {
        const p = win(t, 0.6 + i * 0.05, 0.3, decel);
        if (p <= 0) return;
        ctx.save();
        clipRect(ctx, X - 4, 0, 1100 * p, 1080);
        text(ctx, ln, X, 640 + i * 40, { family: 'Inter Tight', size: 26, weight: 400, color: 'rgba(62,74,64,0.82)' });
        ctx.restore();
      });
      // image card on the right, rising in with the settle
      const ip = decel(win(t, 0.3, 0.5));
      if (ip > 0) {
        ctx.save();
        const cxL = 1180, cyT = 330 + (1 - ip) * 700, cw = 520, chh = 640;
        ctx.beginPath(); ctx.rect(cxL, cyT, cw, chh); ctx.clip();
        cover(ctx, card, cxL, cyT, cw, chh, lerp(1.25, 1.12, ip), 0.5, 0.5);
        ctx.restore();
        text(ctx, 'FIG. 01 — THE WAY UP', cxL, cyT + chh + 30, { family: 'JetBrains Mono', size: 14, weight: 500, color: 'rgba(62,74,64,0.65)', tracking: 0.12 });
      }
      // small CTA + meta row
      const ca = win(t, 0.78, 0.2);
      ctx.globalAlpha = ca;
      rrect(ctx, X, 850, 250, 64, 32); ctx.fillStyle = SAGE_D; ctx.fill();
      text(ctx, 'Start a project  →', X + 125, 891, { family: 'Inter Tight', size: 21, weight: 600, color: SAGE_L, align: 'center' });
      text(ctx, 'EST. MMXXVI — WORLDWIDE', X + 300, 890, { family: 'JetBrains Mono', size: 15, weight: 500, color: 'rgba(62,74,64,0.6)', tracking: 0.12 });
      ctx.globalAlpha = 1;
      ctx.restore();
    },
    fx: (t) => ({ grain: 0.035, vignette: 0.12, ca: 0.8, glitch: win(t, 1.1, 0.1) * 0.08 }),
  };
}

// ------------------------------------------------------------------ 8. posters
export function posters() {
  let img1, img2, img3, grit;
  const PW = 430, PH = 660;
  const drawPoster = (ctx, k) => {
    ctx.save();
    ctx.beginPath(); ctx.rect(-PW / 2, -PH / 2, PW, PH); ctx.clip();
    if (k === 0) {
      ctx.fillStyle = '#D6DED4'; ctx.fillRect(-PW / 2, -PH / 2, PW, PH);
      cover(ctx, img1, -PW / 2, -PH / 2, PW, PH * 0.66, 1.1, 0.45, 0.5);
      text(ctx, 'Anything you', -PW / 2 + 26, PH / 2 - 128, { family: 'Instrument Serif', size: 50, color: SAGE_D });
      text(ctx, 'can imagine.', -PW / 2 + 26, PH / 2 - 80, { family: 'Instrument Serif', size: 50, color: SAGE_D });
      text(ctx, 'CVCVTA.AI — 01', -PW / 2 + 28, PH / 2 - 30, { family: 'JetBrains Mono', size: 13, weight: 500, color: 'rgba(62,74,64,0.7)', tracking: 0.1 });
    } else if (k === 1) {
      ctx.fillStyle = '#CBD6CC'; ctx.fillRect(-PW / 2, -PH / 2, PW, PH);
      cover(ctx, img2, -PW / 2, -PH / 2 + PH * 0.42, PW, PH * 0.58, 1.15, 0.5, 0.5);
      text(ctx, 'Made to', -PW / 2 + 26, -PH / 2 + 96, { family: 'Instrument Serif', size: 64, color: SAGE_D });
      text(ctx, 'move.', -PW / 2 + 26, -PH / 2 + 156, { family: 'Instrument Serif', size: 64, color: SAGE_D });
      drawMark(ctx, PW / 2 - 50, -PH / 2 + 56, 22, { ring: SAGE_D, chev: C.red });
    } else {
      cover(ctx, img3, -PW / 2, -PH / 2, PW, PH, 1.25, 0.52, 0.55);
      const g = ctx.createLinearGradient(0, PH * 0.1, 0, PH / 2);
      g.addColorStop(0, 'rgba(30,36,31,0)'); g.addColorStop(1, 'rgba(30,36,31,0.75)');
      ctx.fillStyle = g; ctx.fillRect(-PW / 2, -PH / 2, PW, PH);
      text(ctx, 'Human taste.', -PW / 2 + 26, PH / 2 - 92, { family: 'Instrument Serif', size: 52, color: '#EEF3EC' });
      text(ctx, 'Machine speed.', -PW / 2 + 26, PH / 2 - 42, { family: 'Instrument Serif', size: 52, color: '#EEF3EC' });
    }
    ctx.restore();
  };
  return {
    cues: [{ t: 0.0, s: 'swish' }, { t: 0.07, s: 'swish', v: 0.6 }, { t: 0.14, s: 'swish', v: 0.5 }],
    async init() {
      img1 = await tone('colonnade', await arch('colonnade'), { mode: 0, dark: '#2F3A31', light: '#D6DED4', cell: 2, contrast: 1.4, w: 900 });
      img2 = await tone('stairs', await arch('stairs'), { mode: 0, dark: '#2F3A31', light: '#CBD6CC', cell: 2, contrast: 1.5, w: 900 });
      img3 = await tone('ring', await arch('ring'), { mode: 0, dark: '#27302A', light: '#C9D3C8', cell: 2, contrast: 1.6, bright: -0.05, w: 900 });
      grit = paper(1920, 1080, '#161615', 21, { noise: 16, fibers: 0 });
    },
    draw(ctx, t) {
      ctx.drawImage(grit, 0, 0);
      const drift = lerp(0, -28, win(t, 0.2, 0.7, soft));
      [0, 1, 2].forEach((k) => {
        const p = win(t, k * 0.07, 0.42, decel);
        const x = 960 + (k - 1) * (PW + 44);
        const y = 560 + (1 - p) * 820 + drift * (1 + k * 0.25);
        ctx.save();
        ctx.translate(x, y);
        ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
        ctx.fillStyle = '#000'; ctx.fillRect(-PW / 2, -PH / 2, PW, PH);
        ctx.shadowColor = 'transparent';
        drawPoster(ctx, k);
        ctx.restore();
      });
    },
    fx: () => ({ grain: 0.05, vignette: 0.3, ca: 0.8 }),
  };
}

// ------------------------------------------------------------------ 9. webSplit
export function webSplit() {
  let img;
  return {
    cues: [{ t: 0.0, s: 'click' }, { t: 0.1, s: 'type', d: 0.4 }],
    async init() { img = await tone('arches', await arch('arches'), { mode: 0, dark: '#323C34', light: '#E4EAE2', cell: 2, contrast: 1.5, w: 1200 }); },
    draw(ctx, t) {
      fillBg(ctx, SAGE_L);
      const scroll = lerp(30, -40, win(t, 0, 0.6, soft));
      ctx.save();
      ctx.translate(0, scroll);
      // right image
      cover(ctx, img, 790, -60, 1130, 1220, 1.05, 0.5, 0.5);
      // left column
      drawMark(ctx, 150, 120, 26, { ring: SAGE_D, chev: C.red });
      text(ctx, 'Tell us what', 110, 330, { family: 'Instrument Serif', size: 96, color: SAGE_D, tracking: -0.01 });
      text(ctx, "you're building.", 110, 420, { family: 'Instrument Serif', size: 96, color: SAGE_D, tracking: -0.01 });
      text(ctx, 'One brief. We handle identity, motion and launch.', 112, 488, { family: 'Inter Tight', size: 22, weight: 400, color: 'rgba(62,74,64,0.75)' });
      const fields = [['NAME', 'Ada Moreau'], ['COMPANY', 'Northwind'], ['THE BRIEF', "A brand people can't scroll past."]];
      fields.forEach(([lab, val], i) => {
        const y = 560 + i * 118;
        text(ctx, lab, 112, y, { family: 'JetBrains Mono', size: 14, weight: 500, color: 'rgba(62,74,64,0.6)', tracking: 0.14 });
        rrect(ctx, 110, y + 14, 600, 64, 10);
        ctx.fillStyle = '#EEF3EC'; ctx.fill();
        ctx.strokeStyle = i === 2 ? SAGE_D : 'rgba(62,74,64,0.25)'; ctx.lineWidth = i === 2 ? 2 : 1.2; ctx.stroke();
        let v = val;
        if (i === 2) v = val.slice(0, Math.floor(win(t, 0.1, 0.42) * val.length));
        text(ctx, v, 132, y + 56, { family: 'Inter Tight', size: 23, weight: 500, color: SAGE_D });
        if (i === 2 && Math.floor(t * 8) % 2 === 0) {
          const cw = measure(ctx, v, { family: 'Inter Tight', size: 23, weight: 500 });
          ctx.fillStyle = SAGE_D; ctx.fillRect(134 + cw, y + 34, 2, 28);
        }
      });
      rrect(ctx, 110, 930, 280, 66, 33); ctx.fillStyle = C.red; ctx.fill();
      text(ctx, 'Send brief  →', 250, 972, { family: 'Inter Tight', size: 22, weight: 600, color: '#fff', align: 'center' });
      ctx.restore();
    },
    fx: () => ({ grain: 0.035, vignette: 0.1, ca: 0.6 }),
  };
}

// ------------------------------------------------------------------ 10. aiPrompt
export function aiPrompt() {
  let icon;
  const prompt = 'Make my brand impossible to ignore.';
  const lines = [
    'Four directions, one idea: a bold mark,',
    'a motion system that makes it move, and',
    'a launch campaign built for every screen.',
  ];
  return {
    cues: [{ t: 0.0, s: 'type', d: 0.34 }, { t: 0.38, s: 'send' }, { t: 0.42, s: 'shimmer', d: 0.3 }, { t: 0.72, s: 'stream', d: 0.45 }],
    init() {
      icon = canvas(112, 112);
      const x = icon.getContext('2d');
      x.beginPath(); x.roundRect(0, 0, 112, 112, 26); x.fillStyle = C.red; x.fill();
      drawMark(x, 53, 56, 32, { ring: C.paper, chev: C.ink });
    },
    draw(ctx, t) {
      fillBg(ctx, '#FFFFFF');
      const z = lerp(1.0, 1.06, win(t, 0.0, 1.2, soft));
      ctx.save();
      camera(ctx, { zoom: z, x: 900, y: 560, dy: lerp(10, -10, win(t, 0, 1.2, soft)) });
      const X = 230, FS = 62;
      // user prompt bubble (right aligned)
      const typed = prompt.slice(0, Math.floor(win(t, 0.0, 0.34) * prompt.length));
      const bw = measure(ctx, prompt, { family: 'Inter Tight', size: 44, weight: 500 }) + 80;
      const sendP = win(t, 0.36, 0.14, decel);
      const by = 300 - sendP * 34;
      rrect(ctx, 1720 - bw, by - 62, bw, 100, 50);
      ctx.fillStyle = '#F1F1EE'; ctx.fill();
      text(ctx, typed, 1720 - bw + 40, by + 3, { family: 'Inter Tight', size: 44, weight: 500, color: '#111' });
      if (t < 0.36 && Math.floor(t * 10) % 2 === 0) {
        const cw = measure(ctx, typed, { family: 'Inter Tight', size: 44, weight: 500 });
        ctx.fillStyle = C.red; ctx.fillRect(1720 - bw + 42 + cw, by - 32, 3, 46);
      }
      // assistant row
      const ra = win(t, 0.4, 0.1);
      if (ra > 0) {
        ctx.globalAlpha = ra;
        ctx.drawImage(icon, X, 438, 60, 60);
        const status = t < 0.68 ? 'Imagining' : 'Imagined 4 directions';
        const sw = measure(ctx, status, { family: 'Inter Tight', size: 36, weight: 500 });
        const gx = X + 84 + ((t * 1.6) % 1) * (sw + 300) - 150;
        const g = ctx.createLinearGradient(gx - 120, 0, gx + 120, 0);
        g.addColorStop(0, '#A7A7A2'); g.addColorStop(0.5, t < 0.68 ? '#1a1a1a' : '#A7A7A2'); g.addColorStop(1, '#A7A7A2');
        text(ctx, status, X + 84, 480, { family: 'Inter Tight', size: 36, weight: 500, color: g });
        if (t >= 0.68) {
          ctx.strokeStyle = '#A7A7A2'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(X + 96 + sw, 461); ctx.lineTo(X + 104 + sw, 469); ctx.lineTo(X + 96 + sw, 477); ctx.stroke();
          ctx.lineCap = 'butt';
        }
        ctx.globalAlpha = 1;
      }
      // streamed answer: per-line reveal with a soft gray leading edge
      lines.forEach((ln, i) => {
        const p = win(t, 0.72 + i * 0.12, 0.34, outCubic);
        if (p <= 0) return;
        const lw = measure(ctx, ln, { family: 'Inter Tight', size: FS, weight: 500, tracking: -0.01 });
        const edge = X + (lw + 200) * p;
        const g = ctx.createLinearGradient(edge - 220, 0, edge, 0);
        g.addColorStop(0, '#111'); g.addColorStop(0.6, '#9a9a96'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save();
        clipRect(ctx, 0, 0, edge, 1080);
        text(ctx, ln, X, 620 + i * 86, { family: 'Inter Tight', size: FS, weight: 500, color: g, tracking: -0.01 });
        ctx.restore();
      });
      ctx.restore();
      // device edge on the left (phone bezel)
      const bg = ctx.createLinearGradient(0, 0, 70, 0);
      bg.addColorStop(0, '#050505'); bg.addColorStop(0.55, '#1b1b1b'); bg.addColorStop(0.8, '#3a3a3a'); bg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, 70, 1080);
    },
    fx: () => ({ grain: 0.025, vignette: 0.06, ca: 0.5 }),
  };
}

// ------------------------------------------------------------------ 11. aiGenerate
export function aiGenerate() {
  let tiles = [], noise;
  const labels = ['01  MONUMENT', '02  SIGNAL', '03  ARCADE', '04  MOTION'];
  return {
    cues: [{ t: 0.0, s: 'gen', d: 0.3 }, { t: 0.28, s: 'ding' }],
    async init() {
      tiles = [
        await tone('ring', await arch('ring'), { mode: 1, dark: '#5A1305', light: '#FFD9C8', contrast: 1.3, w: 800 }),
        await tone('monolith', await arch('monolith'), { mode: 1, dark: '#0E1A66', light: '#FBE4D3', contrast: 1.4, w: 800 }),
        await tone('arches', await arch('arches'), { mode: 1, dark: '#0E2A1F', light: '#E9D48A', contrast: 1.35, w: 800 }),
        await tone('colonnade', await arch('colonnade'), { mode: 1, dark: '#111111', light: '#F2EEE5', contrast: 1.4, w: 800 }),
      ];
      noise = noiseCanvas(160, 90, 5, false);
    },
    draw(ctx, t) {
      fillBg(ctx, '#F4F3EF');
      const TW = 700, TH = 394, G = 26;
      const x0 = 960 - TW - G / 2, y0 = 540 - TH - G / 2 + 20;
      // header + progress
      const prog = clamp(win(t, 0, 0.32, outCubic));
      text(ctx, 'Generating directions', x0, y0 - 44, { family: 'Inter Tight', size: 26, weight: 600, color: '#111' });
      text(ctx, `${Math.round(prog * 100)}%`, x0 + TW * 2 + G, y0 - 44, { family: 'JetBrains Mono', size: 22, weight: 500, color: '#111', align: 'right' });
      ctx.fillStyle = '#DAD9D4'; ctx.fillRect(x0, y0 - 28, TW * 2 + G, 3);
      ctx.fillStyle = C.red; ctx.fillRect(x0, y0 - 28, (TW * 2 + G) * prog, 3);
      tiles.forEach((img, k) => {
        const x = x0 + (k % 2) * (TW + G), y = y0 + Math.floor(k / 2) * (TH + G + 36);
        const p = decel(win(t, 0.02 + k * 0.045, 0.3));
        ctx.save();
        rrect(ctx, x, y, TW, TH, 14); ctx.clip();
        const blur = 34 * (1 - p) * (1 - p);
        if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(1)}px)`;
        cover(ctx, img, x - 20, y - 20, TW + 40, TH + 40, lerp(1.25, 1.06, p));
        ctx.filter = 'none';
        const na = Math.pow(1 - p, 1.6);
        if (na > 0.01) {
          ctx.globalAlpha = na;
          ctx.imageSmoothingEnabled = p > 0.35;
          ctx.drawImage(noise, (k * 37) % 40, (k * 23) % 20, 100, 56, x, y, TW, TH);
          ctx.imageSmoothingEnabled = true;
          ctx.globalAlpha = 1;
        }
        ctx.restore();
        text(ctx, labels[k], x + 2, y + TH + 28, { family: 'JetBrains Mono', size: 15, weight: 500, color: '#555', tracking: 0.1 });
      });
    },
    fx: () => ({ grain: 0.03, vignette: 0.08, ca: 0.6 }),
  };
}

