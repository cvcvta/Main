// SECTION C (13.2 - 18.0s): campaigns. Badge, cards, image grid, giant letters,
// and the process line: imagine, generate, launch.
import { C, MARK, drawMark, drawWordmark } from '../brand.js';
import { fillBg, canvas, text, font, cover, rrect, clipRect, camera, measure, layoutChars, strokePartial, arcStroke } from '../gfx.js';
import { paper } from '../fx2d.js';
import { A, arch, tone, tile } from '../assets.js';
import {
  win, snap, decel, soft, swift, outBack, inExpo, outCubic, lerp, clamp, TAU, track, inOutCubic, mulberry32, spring,
  hash2, outExpo,
} from '../core.js';

// ------------------------------------------------------------------ 19. badge
export function badge() {
  let card = null;
  const BW = 470, BH = 700;
  return {
    cues: [{ t: 0, s: 'hit', v: 1 }, { t: 0.02, s: 'swing' }],
    init() {
      const c = canvas(BW * 2, BH * 2), x = c.getContext('2d');
      x.scale(2, 2);
      x.beginPath(); x.roundRect(0, 0, BW, BH, 20); x.fillStyle = '#FFFFFF'; x.fill();
      x.save(); x.clip();
      x.fillStyle = C.red; x.fillRect(0, 0, 22, BH);
      // slot
      x.globalCompositeOperation = 'destination-out';
      x.beginPath(); x.roundRect(BW / 2 - 50, 22, 100, 16, 8); x.fill();
      x.globalCompositeOperation = 'source-over';
      // barcode
      const r = mulberry32(12);
      let bx = 60;
      while (bx < BW - 50) { const w = 1 + Math.floor(r() * 4); x.fillStyle = C.ink; x.fillRect(bx, 60, w, 70); bx += w + 1 + Math.floor(r() * 4); }
      const T = (s, px, py, o) => { font(x, o.family, o.size, o.weight || 400, 'normal', (o.tracking || 0) * o.size); x.fillStyle = o.color || C.ink; x.textAlign = o.align || 'left'; x.fillText(s, px, py); x.letterSpacing = '0px'; };
      T("I'M GOING TO", 58, 186, { family: 'JetBrains Mono', size: 24, weight: 700, tracking: 0.06 });
      font(x, 'Anton', 150, 400, 'normal', 2);
      x.strokeStyle = C.ink; x.lineWidth = 3; x.textAlign = 'left';
      x.strokeText('LAUNCH', 54, 350);
      x.letterSpacing = '0px';
      T('CREATIVE RESIDENCY', 58, 410, { family: 'JetBrains Mono', size: 18, weight: 500, tracking: 0.08 });
      T('COHORT 01', 58, 438, { family: 'JetBrains Mono', size: 18, weight: 500, tracking: 0.08 });
      T('VALID ON EVERY SCREEN / ALL ACCESS OK', 58, 488, { family: 'JetBrains Mono', size: 13, weight: 500, tracking: 0.06, color: '#555' });
      // arrow
      x.strokeStyle = C.ink; x.lineWidth = 6; x.lineCap = 'butt';
      x.beginPath(); x.moveTo(380, 380); x.lineTo(420, 420); x.stroke();
      x.beginPath(); x.moveTo(420, 392); x.lineTo(420, 420); x.lineTo(392, 420); x.stroke();
      // wordmark box
      x.fillStyle = C.ink; x.fillRect(BW - 300, BH - 120, 270, 88);
      drawWordmark(x, BW - 165, BH - 62, 34, { color: '#fff' });
      drawMark(x, 88, BH - 76, 30, { ring: C.ink, chev: C.red });
      x.restore();
      card = c;
    },
    draw(ctx, t) {
      fillBg(ctx, '#FFFFFF');
      const drop = outBack(win(t, 0, 0.16), 1.2);
      const swing = 0.16 * Math.exp(-4 * t) * Math.cos(t * 16) * (t > 0.05 ? 1 : 0) + (1 - drop) * 0.2;
      const px = 960, py = -330;
      ctx.save();
      ctx.translate(px, py + (1 - drop) * -900);
      ctx.scale(1.42, 1.42);
      ctx.rotate(swing);
      // lanyard
      const L = 320;
      ctx.fillStyle = C.red;
      ctx.fillRect(-26, -400, 52, L + 400 - 40);
      font(ctx, 'Unbounded', 18, 800, 'normal', 1);
      ctx.save(); ctx.translate(0, -380); ctx.rotate(Math.PI / 2); ctx.fillStyle = C.paper;
      for (let i = 0; i < 4; i++) ctx.fillText('CVCVTA.AI', i * 190, 7);
      ctx.restore();
      ctx.letterSpacing = '0px';
      ctx.fillStyle = '#B9B9B6'; ctx.beginPath(); ctx.roundRect(-34, L - 60, 68, 60, 10); ctx.fill();
      ctx.fillStyle = '#8f8f8b'; ctx.fillRect(-8, L - 10, 16, 40);
      ctx.shadowColor = 'rgba(0,0,0,0.22)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
      ctx.drawImage(card, -BW / 2, L, BW, BH);
      ctx.shadowColor = 'transparent';
      // red marker circle around LAUNCH, drawn on
      const cp = win(t, 0.08, 0.2, outCubic);
      if (cp > 0) {
        ctx.strokeStyle = 'rgba(230,40,20,0.9)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        const pts = [];
        for (let i = 0; i <= 80; i++) { const a = -0.4 + (i / 80) * (TAU + 0.5); const rr = 1 + 0.04 * Math.sin(i * 0.35); pts.push([-BW / 2 + 245 + Math.cos(a) * 205 * rr, L + 300 + Math.sin(a) * 95 * rr]); }
        strokePartial(ctx, pts, cp);
      }
      ctx.restore();
    },
    fx: () => ({ grain: 0.03, vignette: 0.08, ca: 0.7 }),
  };
}

// ------------------------------------------------------------------ 20. cardSlide
export function cardSlide() {
  let post = null;
  const H = 540;
  const cards = [
    { w: 560, bg: C.ink }, { w: 740, bg: C.blue }, { w: 560, bg: C.green }, { w: 620, bg: C.ink },
  ];
  return {
    cues: [{ t: 0, s: 'whip', v: 0.7 }, { t: 0.3, s: 'swish', v: 0.5 }],
    async init() { post = await tone('plinth', await arch('plinth'), { mode: 1, dark: '#3A2418', light: '#F6DCC4', contrast: 1.3, w: 700 }); },
    draw(ctx, t) {
      fillBg(ctx, '#F4F2EE');
      const p = decel(win(t, 0, 0.5));
      const off = lerp(820, -60, p) - t * 150;
      let x = 140 + off;
      const y = 540 - H / 2;
      cards.forEach((c, i) => {
        ctx.save();
        rrect(ctx, x, y, c.w, H, 30); ctx.fillStyle = c.bg; ctx.fill();
        ctx.clip();
        const cx = x + c.w / 2, cy = 540;
        if (i === 0) {
          // postcard stack
          ctx.save(); ctx.translate(cx - 10, cy + 10); ctx.rotate(-0.12);
          ctx.fillStyle = '#EFE6D8'; ctx.fillRect(-190, -130, 380, 260);
          cover(ctx, post, -176, -116, 190, 232, 1.1);
          ctx.strokeStyle = 'rgba(40,30,20,0.4)'; ctx.lineWidth = 2;
          for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(30, -60 + k * 34); ctx.lineTo(170, -60 + k * 34); ctx.stroke(); }
          ctx.fillStyle = C.red; ctx.fillRect(120, -112, 50, 60);
          drawMark(ctx, 145, -82, 16, { ring: C.paper, chev: C.ink });
          ctx.restore();
          ctx.save(); ctx.translate(cx - 150, cy + 150); ctx.rotate(0.2);
          ctx.fillStyle = C.red; ctx.beginPath(); ctx.roundRect(-70, -40, 140, 80, 10); ctx.fill();
          text(ctx, 'HELLO', 0, 12, { family: 'Anton', size: 40, color: C.paper, align: 'center' });
          ctx.restore();
        } else if (i === 1) {
          drawMark(ctx, cx - 10, cy, 120, { ring: C.paper, chev: C.paper });
        } else if (i === 2) {
          drawMark(ctx, cx - 8, cy, 100, { ring: C.gold, chev: C.gold });
        } else {
          drawWordmark(ctx, cx, cy + 22, 64, { color: C.paper });
        }
        ctx.restore();
        x += c.w + 36;
      });
    },
    shutter: 0.7,
    fx: () => ({ grain: 0.03, vignette: 0.08, ca: 0.8 }),
  };
}

// ------------------------------------------------------------------ 21. imageGrid
export function imageGrid() {
  let imgs = [];
  return {
    cues: [{ t: 0, s: 'thud' }, { t: 0.1, s: 'tick' }, { t: 0.2, s: 'tick' }],
    async init() {
      const T = async (n, dark, light, c = 1.3) => tone(n, await arch(n), { mode: 1, dark, light, contrast: c, w: 700 });
      imgs = [
        await T('arches', '#2E1C12', '#F3DDC2'), await T('colonnade', '#12302C', '#E8DCC0'), await T('plinth', '#2B2A1A', '#F1E9D2'),
        await tile('chrome', 0, '#FFE2D6', '#FF4A1C', '#FFFFFF', 1), await T('stairs', '#16203F', '#F9DCC8'), await tile('orb', 1, '#FFB199', '#1A1030', '#FFE9A8', 2),
        await T('monolith', '#3A1A0C', '#FFC9A0'), await tile('waves', 2, '#123F2E', '#D9B43A', '#fff', 3), await T('ring', '#101010', '#F2EEE5'),
      ];
    },
    draw(ctx, t) {
      fillBg(ctx, '#0D0D0D');
      const G = 10, TW = (1920 - G * 4) / 3, TH = (1080 - G * 4) / 3;
      imgs.forEach((im, k) => {
        const x = G + (k % 3) * (TW + G), y = G + Math.floor(k / 3) * (TH + G);
        ctx.save(); ctx.beginPath(); ctx.rect(x, y, TW, TH); ctx.clip();
        cover(ctx, im, x, y, TW, TH, lerp(1.18, 1.08, win(t, 0, 0.6, soft)) + (k % 2) * 0.03);
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x, y, TW, TH);
        ctx.restore();
      });
      const lines = ['ONE BRIEF.', 'INFINITE', 'DIRECTIONS.'];
      lines.forEach((ln, i) => {
        const p = win(t, i * 0.06, 0.3, decel);
        if (p <= 0) return;
        const s = lerp(0.72, 1, p) * lerp(1, 1.04, win(t, 0.3, 0.3, soft));
        ctx.save();
        ctx.translate(960, 420 + i * 132);
        ctx.scale(s, s);
        ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 30;
        text(ctx, ln, 0, 0, { family: 'Archivo', size: 136, weight: 900, color: '#FFFFFF', align: 'center', tracking: -0.02 });
        ctx.restore();
      });
    },
    fx: () => ({ grain: 0.045, vignette: 0.25, ca: 1.0 }),
  };
}

// ------------------------------------------------------------------ 22. giantAI
export function giantAI() {
  let panels = [];
  const H = 600, Wt = 158;           // cap height, stroke
  return {
    cues: [{ t: 0.0, s: 'swish' }, { t: 0.14, s: 'snap' }, { t: 0.3, s: 'thud' }, { t: 0.5, s: 'pop' }],
    async init() {
      panels = [
        await tone('stairs', await arch('stairs'), { mode: 1, dark: '#2A1810', light: '#F4D9C0', contrast: 1.4, w: 900 }),
        await tone('plinth', await arch('plinth'), { mode: 1, dark: '#1F2530', light: '#E9E4DA', contrast: 1.4, w: 900 }),
        await tone('monolith', await arch('monolith'), { mode: 1, dark: '#3B1407', light: '#FFD2B3', contrast: 1.5, w: 900 }),
      ];
    },
    draw(ctx, t) {
      fillBg(ctx, '#111');
      const pan = lerp(60, -140, win(t, 0, 1.5, soft));
      const PW = 1920 / 3;
      panels.forEach((im, k) => {
        ctx.save(); ctx.beginPath(); ctx.rect(k * PW, 0, PW + 1, 1080); ctx.clip();
        cover(ctx, im, k * PW + pan * (k % 2 ? -0.6 : 0.6), 0, PW, 1080, 1.4, 0.5, 0.5);
        ctx.restore();
      });
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, 0, 1920, 1080);
      const zs = lerp(1.0, 1.1, win(t, 0.3, 1.2, soft));
      ctx.save();
      camera(ctx, { zoom: zs });
      const base = 540 + H / 2;
      const top = base - H;
      ctx.fillStyle = '#FFFFFF';
      // A: apex centered at ax
      const ax = 980, half = 330;
      // crossbar sweeps in from the left
      const cb = snap(win(t, 0.0, 0.22));
      const cbY = base - H * 0.33;
      if (cb > 0) ctx.fillRect(lerp(-200, ax - half * 0.66, cb), cbY - Wt * 0.42, lerp(80, half * 1.32, cb), Wt * 0.84);
      // legs: quads hanging from a flat apex; the right one swings down from
      // horizontal about the apex, the left one rises from below
      const legPoly = (side) => side > 0
        ? [[-Wt * 0.5, 0], [Wt * 0.5, 0], [half, H], [half - Wt * 1.12, H]]
        : [[-Wt * 0.5, 0], [Wt * 0.5, 0], [-half + Wt * 1.12, H], [-half, H]];
      const drawLeg = (side, rot, dy) => {
        ctx.save();
        ctx.translate(ax, top + dy);
        ctx.rotate(rot);
        const q = legPoly(side);
        ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]);
        for (let i = 1; i < 4; i++) ctx.lineTo(q[i][0], q[i][1]);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      };
      const rl = snap(win(t, 0.08, 0.24));
      if (rl > 0) drawLeg(1, lerp(1.9, 0, rl), 0);
      const ll = decel(win(t, 0.12, 0.24));
      if (ll > 0) drawLeg(-1, 0, (1 - ll) * 900);
      // I drops from the top with a bounce
      const ip = win(t, 0.26, 0.3);
      if (ip > 0) {
        const y = lerp(-900, 0, outBack(ip, 1.1));
        ctx.fillRect(1400, top + y, Wt, H);
      }
      // dot: vermilion square pops, overlapping the A's foot
      const dp = win(t, 0.46, 0.2);
      if (dp > 0) {
        const s = outBack(dp, 2.4);
        ctx.fillStyle = C.red;
        ctx.save(); ctx.translate(540, base - Wt / 2); ctx.scale(s, s); ctx.fillRect(-Wt / 2, -Wt / 2, Wt, Wt); ctx.restore();
      }
      ctx.restore();
    },
    fx: () => ({ grain: 0.045, vignette: 0.2, ca: 0.9 }),
  };
}

// ------------------------------------------------------------------ 23. processLine
export function processLine() {
  const SZ = 66, FAM = { family: 'Inter Tight', size: SZ, weight: 700, tracking: 0.02 };
  // world layout (x along the line, y around 0 = baseline row)
  const G = 'GENERATE'.split('');
  const gx0 = 760, gdx = 118;
  const gOff = [0, -54, 0, 54, 0, -54, 0, 54];
  return {
    cues: [{ t: 0.0, s: 'draw', d: 0.3 }, { t: 0.4, s: 'trace', d: 0.6 }, { t: 1.0, s: 'tick' }, { t: 1.05, s: 'draw', d: 0.25 }, { t: 1.32, s: 'pop' }],
    draw(ctx, t) {
      fillBg(ctx, '#FFFFFF');
      const camX = track([[0, 0], [0.34, 0], [0.95, 1300, inOutCubic], [1.32, 2250, inOutCubic], [1.8, 2560, outCubic]], t);
      const zoom = track([[0, 1.6], [0.34, 1.52], [0.9, 1.06, inOutCubic], [1.8, 1.14, outCubic]], t);
      ctx.save();
      ctx.translate(960, 560);
      ctx.scale(zoom, zoom);
      ctx.translate(-camX, 0);
      ctx.fillStyle = C.ink; ctx.strokeStyle = C.ink;
      // IMAGINE + spark
      const sp = win(t, 0, 0.3, outCubic);
      ctx.save();
      ctx.translate(0, -118);
      ctx.rotate(lerp(-1.2, 0, decel(win(t, 0, 0.4))));
      ctx.lineWidth = 5; ctx.lineJoin = 'miter';
      const star = [];
      for (let i = 0; i <= 8; i++) { const a = (i / 8) * TAU - Math.PI / 2; const r = i % 2 === 0 ? 46 : 12; star.push([Math.cos(a) * r, Math.sin(a) * r]); }
      strokePartial(ctx, star, sp);
      ctx.restore();
      const im = 'IMAGINE';
      const L = layoutChars(ctx, im, FAM);
      font(ctx, FAM.family, SZ, FAM.weight, 'normal', 0);
      L.chars.forEach((c, i) => {
        const p = win(t, 0.04 + i * 0.03, 0.18, decel);
        if (p <= 0) return;
        ctx.save(); clipRect(ctx, -L.width / 2 + c.x - 4, -SZ, c.w + 8, SZ + 10);
        ctx.fillText(c.ch, -L.width / 2 + c.x, (1 - p) * SZ);
        ctx.restore();
      });
      // trace from IMAGINE through GENERATE with right-angle steps
      const pts = [[L.width / 2 + 24, -20]];
      G.forEach((ch, i) => {
        const x = gx0 + i * gdx, y = gOff[i];
        const prev = pts[pts.length - 1];
        pts.push([x - 36, prev[1]]);
        pts.push([x - 36, y - 20]);
        pts.push([x - 22, y - 20]);
        pts.push([x + 50, y - 20]);
      });
      pts.push([gx0 + G.length * gdx + 40, -20]);
      pts.push([2020, -20]);
      const tp = win(t, 0.38, 0.62, inOutCubic);
      ctx.lineWidth = 3;
      // draw the trace, but break it where letters sit
      strokePartial(ctx, pts, tp);
      // letters of GENERATE pop in when the trace reaches them (white knock-out behind)
      G.forEach((ch, i) => {
        const x = gx0 + i * gdx, y = gOff[i];
        const reach = (i + 1) / (G.length + 2);
        const p = win(tp, reach - 0.06, 0.08);
        if (p <= 0) return;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x - 24, y - SZ + 4, 72, SZ + 8);
        ctx.fillStyle = C.ink;
        font(ctx, FAM.family, SZ, FAM.weight, 'normal', 0);
        ctx.textAlign = 'center';
        ctx.fillText(ch, x + 14, y + (1 - outBack(p, 2)) * 20);
        ctx.textAlign = 'left';
      });
      // AND
      const ap = win(t, 0.98, 0.16, decel);
      if (ap > 0) {
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(2080, -SZ, 170, SZ + 14);
        ctx.save(); clipRect(ctx, 2080, -SZ - 6, 200, SZ + 16);
        text(ctx, 'AND', 2090, (1 - ap) * SZ, FAM);
        ctx.restore();
      }
      // check in circle
      const cc = win(t, 1.04, 0.22, outCubic);
      if (cc > 0) {
        ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.lineCap = 'round';
        arcStroke(ctx, 2420, -22, 52, -Math.PI * 0.35, TAU * cc);
        const ck = win(t, 1.14, 0.14, outCubic);
        if (ck > 0) strokePartial(ctx, [[2396, -22], [2414, -3], [2448, -44]], ck);
        ctx.lineCap = 'butt';
      }
      // LAUNCH rises from a mask
      const lp = win(t, 1.3, 0.2, decel);
      if (lp > 0) {
        ctx.save(); clipRect(ctx, 2540, -SZ - 4, 400, SZ + 12);
        text(ctx, 'LAUNCH', 2550, (1 - lp) * SZ * 1.1, { ...FAM, color: C.red });
        ctx.restore();
      }
      ctx.restore();
    },
    shutter: 0.28,
    fx: () => ({ grain: 0.025, vignette: 0.05, ca: 0.6 }),
  };
}

