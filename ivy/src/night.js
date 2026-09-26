// Scene A: 11:48 PM. Seven apps stitched together with one thread, the monthly bill, the hours.
import { STACK, OWNER, T, S16, COPY } from './config.js';
import { E, clamp, lerp, seg, spring, el, css, tr, words, noise, shake } from './engine.js';
import { icon, moonSvg } from './icons.js';

const CX = 960, CY = 540;
const CLOCK = ['11:48 PM', '11:57 PM', '12:09 AM', '12:22 AM', '12:36 AM', '12:51 AM', '1:04 AM', '1:12 AM'];
const NS = 'http://www.w3.org/2000/svg';

function qpt(a, c, b, u) {
  const x = (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0];
  const y = (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1];
  return [x, y];
}

export function buildNight(parent) {
  const root = el('div', 'night', parent);
  const cam = el('div', 'abs', root);
  css(cam, { left: '0px', top: '0px', width: '1920px', height: '1080px', transformOrigin: '960px 540px' });
  el('div', 'nbg', cam);
  el('div', 'grid-lines', cam);

  // thread (behind the cards)
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'thread');
  svg.setAttribute('width', '1920');
  svg.setAttribute('height', '1080');
  cam.appendChild(svg);
  const mk = (attrs) => {
    const p = document.createElementNS(NS, 'path');
    for (const k in attrs) p.setAttribute(k, attrs[k]);
    svg.appendChild(p);
    return p;
  };
  const halo = mk({ fill: 'none', stroke: 'rgba(238,240,231,0.07)', 'stroke-width': '9', 'stroke-linecap': 'round' });
  const shadow = mk({ fill: 'none', stroke: 'rgba(0,0,0,0.45)', 'stroke-width': '3.2', 'stroke-dasharray': '13 9', 'stroke-linecap': 'round' });
  const thread = mk({ fill: 'none', stroke: 'rgba(238,240,231,0.78)', 'stroke-width': '3', 'stroke-dasharray': '13 9', 'stroke-linecap': 'round' });
  const needle = mk({ fill: 'none', stroke: '#F4F6F0', 'stroke-width': '3', 'stroke-linecap': 'round' });

  const cards = STACK.map((s, i) => {
    const c = el('div', 'app', cam);
    c.innerHTML = `<div class="ai">${icon(s.icon)}<div class="badge">${s.badge}</div></div><div><div class="nm">${s.name}</div><div class="ct">${s.cat}</div></div>`;
    return { el: c, badge: c.querySelector('.badge'), s, i };
  });

  // monthly total: odometer digits, positioned with transforms only (no layout changes per frame)
  const counter = el('div', 'counter', cam);
  const lbl = el('div', 'lbl', counter, 'YOUR APP STACK');
  const inner = el('div', 'inner', counter);
  const num = el('div', 'num', inner);
  css(num, { fontSize: '250px' });
  const dollar = el('span', 'piece', num, '$');
  const cols = [0, 1, 2].map(() => {
    const o = el('span', 'odo piece', num);
    const strip = el('span', 'strip', o);
    for (let d = 0; d <= 10; d++) el('span', '', strip, String(d % 10));
    return { o, strip };
  });
  const per = el('span', 'piece per', num, '<span>/mo</span>');
  const M = { cw: 0.58, dw: 0.55, pw: 0.8 };
  function layout() {
    const fs = 250;
    const probe = el('span', '', num);
    css(probe, { position: 'absolute', visibility: 'hidden', whiteSpace: 'nowrap' });
    let cw = 0;
    for (let d = 0; d <= 9; d++) { probe.textContent = String(d); cw = Math.max(cw, probe.offsetWidth); }
    probe.textContent = '$';
    M.dw = probe.offsetWidth / fs;
    M.cw = cw / fs;
    M.pw = per.firstChild.offsetWidth / fs;
    probe.remove();
    cols.forEach((c) => css(c.o, { width: `${M.cw}em` }));
  }

  const admin = el('div', 'admin', cam);
  const adminWords = words(admin, COPY.admin);

  const chy = el('div', 'chyron', cam, `${OWNER.name.toUpperCase()}<br><span class="r">${OWNER.role.toUpperCase()}</span>`);
  const clock = el('div', 'clock', cam, moonSvg);
  const ctx = el('div', 'tx', clock);
  const cA = el('span', '', ctx), cB = el('span', '', ctx);

  function anchor(k, pos) {
    const s = STACK[k];
    const [x, y, rot] = pos[k];
    let off = s.p[0] < -100 ? [165, 0] : s.p[0] > 100 ? [-165, 0] : [0, -54];
    const r = (rot * Math.PI) / 180;
    return [x + off[0] * Math.cos(r) - off[1] * Math.sin(r), y + off[0] * Math.sin(r) + off[1] * Math.cos(r)];
  }

  function update(t) {
    // slow unease: creeping push-in and roll, jolts on the taut and the slam
    const sh1 = shake(t, T.taut, 5, 12, 26, 3), sh2 = shake(t, T.slam, 16, 7.5, 20, 5);
    const push = 1 + 0.045 * seg(t, 0, T.split, E.inOutQuad);
    css(cam, { transform: `translate3d(${(sh1[0] + sh2[0]).toFixed(2)}px, ${(sh1[1] + sh2[1]).toFixed(2)}px, 0) scale(${push.toFixed(4)}) rotate(${(-0.9 * seg(t, 0, T.split) + sh2[2]).toFixed(3)}deg)` });

    // cards
    const slamK = spring(t, T.slam, 2.4, 0.55);
    const pos = [];
    for (const c of cards) {
      const t0 = T.card(c.i) + 0.02;
      const inP = spring(t, t0 - 0.1, 3.4, 0.5);
      const vis = clamp((t - (t0 - 0.12)) / 0.08);
      const [px0, py0] = c.s.p;
      const dir = Math.hypot(px0, py0) || 1;
      const out = 90 * slamK;
      const fx = noise(t * 0.9, c.i * 3) * 5, fy = noise(t * 0.8, c.i * 3 + 1) * 5;
      const x = CX + px0 + (px0 / dir) * out + fx;
      const y = CY + py0 + (py0 / dir) * out + fy - 34 * (1 - inP);
      const rot = c.s.r * (1 + 2.6 * (1 - inP)) + slamK * c.s.r * 0.6;
      const sc = lerp(1.32, 1, inP) * lerp(1, 0.93, slamK);
      pos[c.i] = [x, y, rot];
      css(c.el, {
        transform: tr(x, y, sc, rot),
        opacity: (vis * lerp(1, 0.5, slamK)).toFixed(3),
        filter: `blur(${(Math.max(0, 9 * (1 - inP * 1.4)) + 2.2 * slamK).toFixed(2)}px)`,
      });
      const bp = spring(t, t0 + 0.12, 4, 0.45);
      css(c.badge, { transform: `scale(${bp.toFixed(3)})`, opacity: String(clamp(bp * 3)) });
    }

    // thread: stitched card to card, slack until it pulls taut
    const tautK = spring(t, T.taut, 3.2, 0.32);
    const sag = 0.16 * (1 - tautK);
    const start = [-120, 160];
    const pts = [start, ...cards.map((c) => anchor(c.i, pos))];
    let d = `M ${start[0].toFixed(1)} ${start[1].toFixed(1)}`;
    let head = null, tan = null;
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1], bb = pts[k];
      const len = Math.hypot(bb[0] - a[0], bb[1] - a[1]);
      const c = [(a[0] + bb[0]) / 2, (a[1] + bb[1]) / 2 + sag * len];
      const tA = k === 1 ? T.card(0) - 0.22 : T.card(k - 2) + 0.02;
      const tB = T.card(k - 1) + 0.02;
      const u = seg(t, tA, tB - tA, E.outCubic);
      if (u <= 0) break;
      if (u >= 1) {
        d += ` Q ${c[0].toFixed(1)} ${c[1].toFixed(1)} ${bb[0].toFixed(1)} ${bb[1].toFixed(1)}`;
      } else {
        const c1 = [lerp(a[0], c[0], u), lerp(a[1], c[1], u)];
        const p = qpt(a, c, bb, u);
        d += ` Q ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
        head = p;
        const dx = 2 * (1 - u) * (c[0] - a[0]) + 2 * u * (bb[0] - c[0]);
        const dy = 2 * (1 - u) * (c[1] - a[1]) + 2 * u * (bb[1] - c[1]);
        const m = Math.hypot(dx, dy) || 1;
        tan = [dx / m, dy / m];
        break;
      }
    }
    const crawl = (-Math.min(t, T.taut + 0.2) * 190).toFixed(1);
    for (const p of [thread, shadow, halo]) p.setAttribute('d', d);
    thread.setAttribute('stroke-dashoffset', crawl);
    shadow.setAttribute('stroke-dashoffset', crawl);
    shadow.setAttribute('transform', 'translate(0 3)');
    if (head) {
      needle.setAttribute('d', `M ${(head[0] - tan[0] * 34).toFixed(1)} ${(head[1] - tan[1] * 34).toFixed(1)} L ${(head[0] + tan[0] * 4).toFixed(1)} ${(head[1] + tan[1] * 4).toFixed(1)}`);
      needle.setAttribute('opacity', '1');
    } else needle.setAttribute('opacity', '0');
    const flick = t > T.slam && t < T.slam + 0.25 ? 0.55 + 0.45 * Math.abs(noise(t * 60, 9)) : 1;
    thread.setAttribute('stroke', `rgba(238,240,231,${(0.78 * flick * lerp(1, 0.42, slamK)).toFixed(3)})`);
    shadow.setAttribute('opacity', String(lerp(1, 0.5, slamK)));

    // odometer: the stack's monthly total rolls up as apps land, then slams to centre stage
    const v = 138 * seg(t, T.card(0) + 0.05, T.card(6) + 0.3 - T.card(0), E.inOutQuad);
    const posd = [
      Math.floor(v / 100) % 10 + Math.max(0, (v % 100) - 99),
      Math.floor(v / 10) % 10 + Math.max(0, (v % 10) - 9),
      v % 10,
    ];
    const vis = [clamp(v - 99), clamp(v - 9), 1];
    const hidden = 2 - vis[0] - vis[1];
    cols.forEach((c, k) => {
      css(c.strip, { transform: `translateY(${(-posd[k] * 1.3).toFixed(4)}em)` });
      css(c.o, { transform: `translateX(${(k * M.cw).toFixed(4)}em)`, opacity: String(vis[k].toFixed(3)) });
    });
    const left = hidden * M.cw - M.dw - 0.01;
    const right = 3 * M.cw + 0.03 + M.pw;
    css(dollar, { transform: `translateX(${left.toFixed(4)}em)` });
    css(per, { transform: `translateX(${(3 * M.cw + 0.03).toFixed(4)}em)` });
    css(num, { transform: `translate(${(-(left + right) / 2).toFixed(4)}em, -0.5em)` });
    const big = spring(t, T.slam - 0.03, 2.6, 0.5);
    const sc = lerp(0.3, 1, big) * (1 + 0.025 * seg(t, T.slam + 0.3, 1.2, E.outQuad));
    const cy = lerp(CY + 4, CY - 64, clamp(big));
    css(counter, { transform: `translate3d(0, ${(cy - CY).toFixed(2)}px, 0)`, opacity: String(clamp((t - 0.12) / 0.12)) });
    css(inner, { transform: `scale(${sc.toFixed(4)})` });
    css(lbl, { opacity: String((1 - clamp((t - T.slam + 0.12) / 0.1)) * clamp((t - 0.05) / 0.2)) });
    css(num, { color: big > 0.02 ? '#F7F8F2' : '#E9ECE3' });

    // the hours
    css(admin, { top: '650px' });
    adminWords.forEach((w, i) => {
      const p = seg(t, T.admin + i * S16 * 0.6, 0.5, E.snap);
      css(w, { opacity: String(clamp(p * 2)), transform: `translate3d(0, ${(28 * (1 - p)).toFixed(2)}px, 0)`, filter: `blur(${(6 * (1 - p)).toFixed(2)}px)` });
    });

    // chyron + clock, time-lapsing past midnight
    const cp = seg(t, 0, 0.45, E.snap);
    css(chy, { opacity: String(cp), transform: `translate3d(${(-16 * (1 - cp)).toFixed(2)}px, 0, 0)`, clipPath: `inset(0 ${(100 - cp * 100).toFixed(1)}% 0 0)` });
    css(clock, { opacity: String(cp), transform: `translate3d(${(16 * (1 - cp)).toFixed(2)}px, 0, 0)` });
    let k = 0;
    for (let i = 1; i < CLOCK.length; i++) if (t >= T.clock(i)) k = i;
    const kp = k === 0 ? 1 : seg(t, T.clock(k), 0.1, E.outCubic);
    cA.textContent = CLOCK[k];
    cB.textContent = CLOCK[Math.max(0, k - 1)];
    css(cA, { transform: `translateY(${(32 * (1 - kp)).toFixed(2)}px)`, opacity: String(kp) });
    css(cB, { transform: `translateY(${(-32 * kp).toFixed(2)}px)`, opacity: String(k === 0 ? 0 : 1 - kp) });
    const glowK = k > 0 ? 1 - seg(t, T.clock(k), 0.2) : 0;
    css(clock, { borderColor: `rgba(238,240,231,${(0.1 + 0.25 * glowK).toFixed(3)})` });
  }

  return { root, update, layout };
}
