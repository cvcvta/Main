// Scenes B + C: the Ivy workspace in a 2.5D camera. One platform, then the hero moment:
// type the ask, Ivy summarizes, one tap to approve, the automation lands under Marketing.
import { NAV, OWNER, T, S16, BEAT, COPY } from './config.js';
import { E, clamp, lerp, seg, spring, keys, el, css, tr, chars, hash, shake, bezier } from './engine.js';
import { icon } from './icons.js';
import { logoEl, iconImg, iconMarkBox } from './brand.js';
import { typeSchedule, kfCrane } from './timing.js';

const WIN = { x: -780, y: -450, w: 1560, h: 900 };
const NAV_TOP = 118, ROW = 50;
const itemY = (k) => WIN.y + NAV_TOP + ROW / 2 + ROW * k; // world y of nav item centre
const PHRASES = ['a new client signs up', 'welcome packet to sign', 'book a 15 minute intro call'];
const PULL = bezier(0.72, 0, 0.18, 1);
const LEAD = bezier(0.33, 0, 0.12, 1);

function worldPos(e, stop) {
  let x = 0, y = 0;
  while (e && e !== stop) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
  return [x + WIN.x, y + WIN.y];
}

// camera target that puts world point (wx, wy) at screen point (sx, sy) at scale s
const frame = (wx, wy, s, sx, sy) => [wx - (sx - 960) / s, wy - (sy - 540) / s];

const statusBar = `<svg viewBox="0 0 70 14" width="70" height="14"><g fill="#ECF0F1"><rect x="0" y="9" width="3" height="5" rx="1"/><rect x="5" y="6.5" width="3" height="7.5" rx="1"/><rect x="10" y="4" width="3" height="10" rx="1"/><rect x="15" y="1.5" width="3" height="12.5" rx="1"/>
  <path d="M31 13.2a1.6 1.6 0 1 0 0.01 0zM26.6 9.4a6.2 6.2 0 0 1 8.8 0l-1.3 1.3a4.4 4.4 0 0 0-6.2 0zM23.8 6.6a10.2 10.2 0 0 1 14.4 0l-1.3 1.3a8.4 8.4 0 0 0-11.8 0z"/>
  <rect x="44" y="1.5" width="22" height="11" rx="3.2" fill="none" stroke="#ECF0F1" stroke-opacity=".45" stroke-width="1.2"/><rect x="46" y="3.5" width="16" height="7" rx="1.8"/><rect x="67.2" y="5" width="1.8" height="4" rx=".8" fill-opacity=".45"/></g></svg>`;

export function buildWorld(parent, brand) {
  const world = el('div', '', parent);
  world.id = 'world';
  const cam = el('div', '', world);
  cam.id = 'cam';

  // ------------------------------------------------------------ window
  const win = el('div', 'win', cam);
  const winIn = el('div', 'abs', win);
  css(winIn, { left: '0px', top: '0px', width: `${WIN.w}px`, height: `${WIN.h}px` });
  const side = el('div', 'side', winIn);
  const logoSlot = el('div', 'logo-slot', side);
  const sideLogo = logoEl(brand, logoSlot, 30, 'var(--mist)');
  const hl = el('div', 'nav-hl', side);
  const nav = el('div', 'nav', side);
  const items = [];
  let sub, subRow, knob, sw;
  NAV.forEach((n) => {
    const it = el('div', 'nav-item', nav, `${icon(n.toLowerCase())}<span>${n}</span>`);
    items.push(it);
    if (n === 'Marketing') {
      sub = el('div', 'sub', nav);
      subRow = el('div', 'sub-row', sub, `<span class="dot"></span><span class="nm">New client welcome</span>`);
      sw = el('span', 'switch', subRow);
      knob = el('span', 'knob', sw);
    }
  });
  const me = el('div', 'me', side, `<div class="avatar">${OWNER.initials}</div><div><div class="n">${OWNER.name}</div><div class="b">${OWNER.business}</div></div>`);

  const main = el('div', 'main', winIn);
  const dash = el('div', 'dash', main);
  const hello = el('div', 'hello', dash, `Good evening, ${OWNER.first}`);
  const helloSub = el('div', 'hello-sub', dash, 'Here’s your week at a glance.');
  const stats = el('div', 'stats', dash);
  const statEls = [
    ['bookings', 'Bookings this week', '6', 'sessions'],
    ['invoices', 'Open invoices', '3', '$1,240'],
    ['messages', 'Unread messages', '4', 'clients'],
  ].map(([ic, k, v, s]) => el('div', 'stat', stats, `<div class="k">${icon(ic)}${k}</div><div class="v">${v}<small>${s}</small></div>`));
  const today = el('div', 'today', dash, `<div class="h">Today</div>
    <div class="row"><span class="tm">4:00 PM</span><span class="tt">Family session</span><span class="who">The Parkers</span></div>
    <div class="row"><span class="tm">6:30 PM</span><span class="tt">Headshots</span><span class="who">Dana Lee</span></div>`);
  const veil = el('div', 'focus-veil', main);

  const chat = el('div', 'chat', main);
  // the owner's message, with the three phrases Ivy will pick out
  const bubble = el('div', 'bubble', chat);
  let rest = COPY.prompt;
  const hls = [];
  PHRASES.forEach((p) => {
    const i = rest.indexOf(p);
    bubble.appendChild(document.createTextNode(rest.slice(0, i)));
    const s = el('span', 'hl', bubble);
    s.textContent = p;
    hls.push(s);
    rest = rest.slice(i + p.length);
  });
  bubble.appendChild(document.createTextNode(rest));

  // Ivy's summary card
  const msg = el('div', 'ivy-msg', chat);
  const head = el('div', 'ivy-head', msg);
  iconImg(brand, el('div', 'ivy-av', head));
  el('span', 'nm', head, 'Ivy');
  el('span', 'on', head, '<i></i>online');
  el('span', '', head, 'Here’s the plan. Approve to turn it on.');
  const pwrap = el('div', 'plan-wrap', msg);
  const pbg = el('div', 'plan-bg', pwrap);
  const plan = el('div', 'plan', pwrap);
  const ptop = el('div', 'top', plan, `<span class="ttl">New client welcome</span><span class="tag">MARKETING · AUTOMATION</span>`);
  const stepDefs = [
    ['userplus', 'WHEN', 'A new client signs up', ''],
    ['sign', 'THEN', 'Send your welcome packet to sign', `${icon('contracts')}<span class="mod">Contracts</span> › Welcome Packet`],
    ['call', 'AND', 'Ask them to book an intro call', `${icon('bookings')}<span class="mod">Bookings</span> › Intro call · 15 min`],
  ];
  const steps = stepDefs.map(([ic, lab, txt, chip]) => {
    const s = el('div', 'step', plan, `<div class="ic">${icon(ic)}</div><div><div class="lab">${lab}</div><div class="txt">${txt}</div>${chip ? `<div class="chip">${chip}</div>` : ''}</div>`);
    return { s, ic: s.querySelector('.ic'), lab: s.querySelector('.lab'), txt: s.querySelector('.txt'), chip: s.querySelector('.chip') };
  });
  const foot = el('div', 'foot', plan, `<span class="note">${icon('shield')}Nothing goes out without your OK.</span>`);
  el('div', 'btn ghost', foot, 'Edit');
  const go = el('div', 'btn go', foot);
  const goL1 = el('span', '', go, 'Approve');
  const goL2 = el('span', 'lbl2', go, `${icon('check')}Approved`);

  const composer = el('div', 'composer', chat);
  iconImg(brand, el('div', 'spark', composer));
  const ph = el('div', 'ph', composer, COPY.placeholder);
  const typed = el('div', 'typed', composer);
  const cs = chars(typed, COPY.prompt);
  const caret = el('div', 'caret', composer);
  el('div', 'send', composer, icon('send'));
  const ring = el('div', 'ring', composer);

  // the app icon the window collapses into, rebuilt from the icon's own field colour and the wordmark
  // so it hands off exactly to the end card (see end.js)
  const skin = el('div', 'skin', win);
  const [mx, my, mh] = iconMarkBox(brand, 200);
  const skinMark = logoEl(brand, skin, mh, '#FFFFFF');
  css(skinMark, { left: `calc(50% + ${(mx - 100).toFixed(2)}px)`, top: `calc(50% + ${(my - 100).toFixed(2)}px)`, transformOrigin: '50% 50%' });

  // ------------------------------------------------------------ phone
  const phone = el('div', 'phone', cam);
  phone.innerHTML = `<div class="scr"><div class="island"></div><div class="sb"><span>7:42</span>${statusBar}</div>
    <div class="ph-body"><div class="ph-logo"></div>
    <div class="ph-hello">Good evening, ${OWNER.first}</div>
    <div class="grid">${NAV.slice(1).map((n, i) => `<div class="tile" ${i === 6 ? 'style="grid-column: span 2"' : ''}>${icon(n.toLowerCase())}<span>${n}</span></div>`).join('')}</div></div>
    <div class="ph-comp"><span class="sp"></span>${COPY.placeholder}</div></div>`;
  logoEl(brand, phone.querySelector('.ph-logo'), 22, 'var(--mist)');
  iconImg(brand, phone.querySelector('.sp'));
  const tiles = [...phone.querySelectorAll('.tile')];

  // ------------------------------------------------------------ flyer, ghosts, finger, burst
  const ghosts = PHRASES.map((p) => el('div', 'ghost-phrase', cam, p));
  const flyer = el('div', 'flyer', cam, `<span class="dot"></span><span class="nm">New client welcome</span><span class="switch"><span class="knob"></span></span>`);
  const ripple = el('div', 'ripple', cam);
  const finger = el('div', 'finger', cam);
  const sparks = [...Array(10)].map(() => el('div', 'spk', cam));

  // ------------------------------------------------------------ layout measurements (after fonts load)
  const L = {};
  function layout() {
    css(bubble, { top: '48px' });
    const bh = bubble.offsetHeight;
    css(msg, { top: `${48 + bh + 24}px` });
    L.bubble = worldPos(bubble, win);
    L.plan = worldPos(plan, win);
    L.planW = plan.offsetWidth;
    L.planH = plan.offsetHeight;
    L.rowsH = [ptop, ...steps.map((s) => s.s)].map((e) => e.offsetTop + e.offsetHeight + 20);
    L.hl = hls.map((h) => worldPos(h, win));
    L.txt = steps.map((s) => worldPos(s.txt, win));
    L.go = worldPos(go, win);
    L.goC = [L.go[0] + go.offsetWidth / 2, L.go[1] + go.offsetHeight / 2];
    const lines = [];
    L.caret = cs.map((c) => {
      const top = c.offsetTop;
      if (!lines.includes(top)) lines.push(top);
      return [c.offsetLeft + c.offsetWidth, top, lines.indexOf(top)];
    });
    L.lines = lines.length;
    L.composerBottom = WIN.y + WIN.h - 38;
    L.chatX = worldPos(chat, win)[0];
    const lp = worldPos(sideLogo, win);
    L.logoC = [lp[0] + sideLogo.offsetWidth / 2, lp[1] + sideLogo.offsetHeight / 2];
    L.chatW = chat.offsetWidth;
    css(sub, { height: '58px' });
    L.subRow = worldPos(subRow, win);
    L.subW = subRow.offsetWidth;
    L.subH = subRow.offsetHeight;
    css(sub, { height: '0px' });
    css(flyer, { width: `${L.subW}px` });
  }

  const typeAt = typeSchedule();

  // ------------------------------------------------------------ camera
  function camera(t) {
    const cx0 = L.chatX + L.chatW / 2;
    const typing = frame(cx0, L.composerBottom - 55, 1.66, 1215, 548);
    const planBottom = L.plan[1] + L.planH;
    const conv = frame(cx0, (L.bubble[1] + planBottom) / 2, 1.38, 1235, 548);
    const appr = frame(cx0 + 40, (L.bubble[1] + planBottom) / 2 + 60, 1.48, 1235, 548);
    const land = frame(L.subRow[0] + L.subW / 2, L.subRow[1] + L.subH / 2, 1.85, 820, 560);
    let c;
    if (t < T.pullOut) {
      const kf = kfCrane(t);
      const k = E.inOutQuad(clamp((kf + 1.72) / 2.4));
      c = [lerp(L.logoC[0], -552, k), lerp(L.logoC[1], itemY(0) + ROW * kf, clamp((kf + 1.72) / 1.72)), lerp(4.4, 3.35, k), 0, 0, lerp(-2.2, 0, clamp((kf + 1.72) / 8.7))];
    } else {
      c = keys(t, [
        [T.pullOut, [-552, itemY(7), 3.35, 0, 0, 0]],
        [T.pullOut + 0.95, [60, 30, 0.9, 7, -10, 0], PULL],
        [T.pushIn, [45, 22, 0.93, 6.2, -8.8, 0], E.lin],
        [T.pushIn + BEAT * 1.4, [typing[0], typing[1], 1.66, 0, 0, 0], E.glide],
        [T.send, [typing[0] + 8, typing[1] - 6, 1.72, 0, 0, 0], E.inOutQuad],
        [T.plan + BEAT * 0.5, [conv[0], conv[1], 1.38, 0, 0, 0], LEAD],
        [T.tap - BEAT * 0.5, [appr[0], appr[1], 1.48, 0, 0, 0], E.inOutQuad],
        [T.fly, [appr[0] + 6, appr[1] + 4, 1.5, 0, 0, 0], E.lin],
        [T.land - 0.03, [land[0], land[1], 1.85, 0, 0, 0], E.whip],
        [T.morph, [land[0] + 10, land[1] + 3, 1.92, 0, 0, 0], E.lin],
        [T.lockup - 0.02, [0, 0, 1, 0, 0, 0], E.inOutQuart],
      ]);
    }
    const sh = shake(t, T.tap, 3.2, 10, 26, 7);
    const roll = -2.6 * Math.sin(Math.PI * seg(t, T.fly, T.land - T.fly, E.inOutQuad)) + 1.2 * Math.sin(Math.PI * seg(t, T.morph, T.lockup - T.morph, E.inOutQuad));
    return [c[0] + sh[0] / c[2], c[1] + sh[1] / c[2], c[2], c[3], c[4], c[5] + sh[2] + roll];
  }

  // ------------------------------------------------------------ update
  function update(t) {
    const vis = t >= T.split - 0.02 && t < T.lockup + 0.04;
    css(world, { display: vis ? 'block' : 'none' });
    if (!vis) return;
    const [cx, cy, s, rx, ry, rz] = camera(t);
    // 3D tilt only where the frame is wide; close-ups stay 2D so text rasterizes crisp
    const flat = Math.abs(rx) < 0.02 && Math.abs(ry) < 0.02;
    css(world, { perspective: flat ? 'none' : '2600px' });
    css(cam, { transformStyle: flat ? 'flat' : 'preserve-3d' });
    css(cam, { transform: `rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale(${s.toFixed(4)}) translate(${(-cx).toFixed(2)}px, ${(-cy).toFixed(2)}px)` });

    // --- sidebar highlight: rides the crane, returns Home once wide, later lands on Marketing
    let hlK;
    if (t < T.pullOut) hlK = clamp(Math.round(kfCrane(t)), 0, 7);
    else if (t < T.land - 0.12) hlK = 7 - 7 * seg(t, T.pullOut + 0.7, 0.5, E.snap);
    else hlK = 6 * seg(t, T.land - 0.12, 0.28, E.snap);
    const hlVis = t < T.pullOut ? clamp((kfCrane(t) + 0.9) * 3) : 1;
    css(hl, { top: `${(NAV_TOP + ROW * hlK).toFixed(2)}px`, opacity: String(hlVis) });
    items.forEach((it, k) => {
      const on = clamp(1 - Math.abs(hlK - k) * 1.6) * hlVis;
      css(it, { color: `rgb(${Math.round(lerp(169, 236, on))},${Math.round(lerp(179, 240, on))},${Math.round(lerp(180, 241, on))})` });
    });
    const subP = seg(t, T.land - 0.06, 0.4, E.snap);
    css(sub, { height: `${(58 * subP).toFixed(2)}px` });
    const tg = seg(t, T.toggle, 0.22, E.snap);
    css(knob, { transform: `translateX(${(14 * tg).toFixed(2)}px)` });
    css(sw, { background: `rgb(${Math.round(lerp(58, 69, tg))},${Math.round(lerp(69, 191, tg))},${Math.round(lerp(70, 124, tg))})` });
    const shine = seg(t, T.toggle, 0.7, E.inOutQuad);
    css(subRow, { boxShadow: `inset 0 0 0 1px rgba(69,191,124,.35), 0 0 0 ${(7 * Math.sin(Math.PI * shine)).toFixed(2)}px rgba(69,191,124,${(0.22 * Math.sin(Math.PI * shine)).toFixed(3)})` });

    // --- dashboard assembles on the pull-out
    const dIn = (d) => seg(t, T.pullOut + 0.15 + d, 0.65, E.snap);
    [hello, helloSub, ...statEls, today].forEach((e, i) => {
      const p = dIn(i * 0.06);
      css(e, { opacity: String(clamp(p * 1.4)), transform: `translate3d(0, ${(40 * (1 - p)).toFixed(2)}px, 0)` });
    });
    css(me, { opacity: String(dIn(0.1)) });

    // --- focus mode for the hero
    const focus = seg(t, T.pushIn, 0.5, E.inOutQuad) * (1 - seg(t, T.land + 0.2, 0.5));
    css(veil, { background: `rgba(13,18,17,${(0.82 * focus).toFixed(3)})` });
    css(dash, { filter: `blur(${(5 * focus).toFixed(2)}px)` });

    // --- composer: glow on arrival, typing, send
    css(composer, { opacity: String(clamp(dIn(0.3) * 1.3)) });
    const ringP = seg(t, T.pushIn + 0.2, 0.5, E.outQuad) * (1 - seg(t, T.send, 0.2));
    css(ring, { opacity: String((0.9 * ringP).toFixed(3)) });
    let n = 0;
    for (let i = 0; i < cs.length; i++) if (t >= typeAt[i]) n = i + 1;
    const sent = t >= T.send;
    cs.forEach((c, i) => css(c, { opacity: sent ? '0' : String(clamp((t - typeAt[i]) / 0.05)) }));
    const line = n ? L.caret[n - 1][2] : 0;
    const lineT = n ? typeAt[L.caret.findIndex((q) => q[2] === line)] : 0;
    const h = sent ? 76 : lerp(76 + 34 * Math.max(0, line - 1), 76 + 34 * line, seg(t, lineT, 0.12, E.outCubic));
    css(composer, { height: `${h.toFixed(2)}px` });
    css(ph, { opacity: String(n > 0 && !sent ? 0 : sent ? seg(t, T.send + 0.25, 0.3) : 1) });
    const blink = (t < T.typeStart ? Math.floor(t / 0.28) % 2 === 0 : true) && !sent && t > T.pushIn + 0.25;
    const cp = n ? L.caret[n - 1] : [0, 0];
    css(caret, { left: `${(70 + cp[0] + 2).toFixed(1)}px`, top: `${(22 + cp[1] + 2).toFixed(1)}px`, opacity: blink ? '1' : '0' });

    // --- send: the message lifts off the composer into a bubble
    const up = spring(t, T.send, 2.6, 0.62);
    const fromY = L.composerBottom - 76 - L.bubble[1] - 40;
    css(bubble, {
      opacity: String(sent ? clamp((t - T.send) / 0.08) : 0),
      transform: `translate3d(0, ${(fromY * (1 - up)).toFixed(2)}px, 0) scale(${lerp(0.94, 1, clamp(up)).toFixed(4)})`,
    });

    // --- Ivy reads the ask: a highlighter sweeps each phrase, which then flies into the plan
    hls.forEach((hh, i) => {
      const p = seg(t, T.think + i * S16 * 1.1, 0.26, E.outCubic);
      css(hh, { backgroundSize: `${(p * 100).toFixed(2)}% 78%` });
    });
    const planIn = spring(t, T.plan, 2.8, 0.7);
    css(msg, { transform: `translate3d(0, ${(24 * (1 - clamp(planIn))).toFixed(2)}px, 0)` });
    css(head, { opacity: String(clamp((t - T.think) / 0.12)) });
    // card grows row by row
    const grow = [T.plan, ...T.rows].map((t0, i) => (L.rowsH[i] - (i ? L.rowsH[i - 1] : 0)) * clamp(spring(t, t0 - 0.02, 3, 0.8)));
    let H = grow.reduce((a, v) => a + v, 0) + (L.planH - L.rowsH[3]) * clamp(spring(t, T.chips + 0.1, 3, 0.8));
    H = Math.max(0, Math.min(L.planH, H));
    const planOp = clamp((t - T.plan + 0.02) / 0.1);
    css(pbg, { height: `${H.toFixed(2)}px`, opacity: String(planOp) });
    css(plan, { clipPath: `inset(0 0 ${(L.planH - H).toFixed(2)}px 0)`, opacity: String(planOp) });
    css(ptop, { opacity: String(seg(t, T.plan + 0.04, 0.2)) });
    steps.forEach((st, i) => {
      const t0 = T.rows[i];
      const p = seg(t, t0, 0.35, E.snap);
      css(st.ic, { opacity: String(p), transform: `scale(${lerp(0.6, 1, spring(t, t0, 3.5, 0.5)).toFixed(4)})` });
      css(st.lab, { opacity: String(p) });
      css(st.txt, { opacity: String(seg(t, t0 + 0.02, 0.18)) });
      if (st.chip) {
        const c2 = spring(t, T.chips + (i - 1) * S16, 3.6, 0.55);
        css(st.chip, { opacity: String(clamp(c2 * 2)), transform: `scale(${lerp(0.7, 1, clamp(c2)).toFixed(4)})`, transformOrigin: '0 50%' });
      }
      const g = ghosts[i];
      const f0 = t0 - 0.2;
      const fp = seg(t, f0, 0.25, E.inOutCubic);
      if (t > f0 && t < t0 + 0.12) {
        const a = [L.hl[i][0] - 6, L.hl[i][1]], bb = [L.txt[i][0] - 6, L.txt[i][1] - 1];
        const x = lerp(a[0], bb[0], fp), y = lerp(a[1], bb[1], fp) - Math.sin(Math.PI * fp) * 40;
        css(g, { display: 'block', transform: tr(x, y, lerp(1, 0.96, fp)), opacity: String((1 - seg(t, t0 + 0.02, 0.1)) * clamp((t - f0) / 0.05)) });
      } else css(g, { display: 'none' });
    });
    const footP = seg(t, T.chips + 0.1, 0.3, E.snap);
    css(foot, { opacity: String(footP), transform: `translate3d(0, ${(12 * (1 - footP)).toFixed(2)}px, 0)` });

    // --- the tap
    const fIn = seg(t, T.finger, T.tap - T.finger - 0.06, E.inOutCubic);
    const press = seg(t, T.tap - 0.06, 0.06, E.outQuad) * (1 - seg(t, T.tap + 0.03, 0.12, E.outQuad));
    const fOut = seg(t, T.tap + 0.25, 0.3, E.inCubic);
    const fx = lerp(L.goC[0] + 300, L.goC[0] + 8, fIn) + 260 * fOut;
    const fy = lerp(L.goC[1] + 330, L.goC[1] + 6, fIn) + 200 * fOut;
    css(finger, { display: t > T.finger && t < T.tap + 0.6 ? 'block' : 'none', transform: `translate3d(${fx.toFixed(2)}px, ${fy.toFixed(2)}px, 0) scale(${(1 - 0.22 * press).toFixed(4)})`, opacity: String(clamp(fIn * 3) * (1 - fOut)) });
    const approved = t >= T.tap + 0.03;
    css(go, { transform: `scale(${(1 - 0.05 * press + 0.05 * Math.sin(Math.PI * seg(t, T.tap + 0.03, 0.24))).toFixed(4)})`, filter: `brightness(${(1 + 0.12 * fIn * (1 - seg(t, T.tap, 0.1))).toFixed(3)})` });
    css(goL1, { opacity: approved ? '0' : '1' });
    css(goL2, { opacity: approved ? '1' : '0', transform: `translate3d(0, ${(10 * (1 - seg(t, T.tap + 0.03, 0.2, E.snap))).toFixed(2)}px, 0)` });
    const rp = seg(t, T.tap + 0.02, 0.55, E.outCubic);
    const rs = 60 + 360 * rp;
    css(ripple, {
      display: t > T.tap && t < T.tap + 0.6 ? 'block' : 'none',
      width: `${rs}px`, height: `${rs}px`, transform: `translate3d(${(L.goC[0] - rs / 2).toFixed(2)}px, ${(L.goC[1] - rs / 2).toFixed(2)}px, 0)`,
      opacity: String((1 - rp) * 0.9), borderWidth: `${(4 * (1 - rp) + 1).toFixed(2)}px`,
    });
    sparks.forEach((sp, i) => {
      const a = (i / sparks.length) * Math.PI * 2 + 0.3;
      const p = seg(t, T.tap + 0.03, 0.45, E.outCubic);
      const r0 = 70 + 10 * hash(i), r1 = r0 + 70 + 40 * hash(i + 5);
      const r = lerp(r0, r1, p);
      const len = 16 * (1 - p) + 2;
      css(sp, {
        display: p > 0 && p < 1 ? 'block' : 'none', width: `${len.toFixed(2)}px`,
        transform: `translate3d(${(L.goC[0] + Math.cos(a) * r).toFixed(2)}px, ${(L.goC[1] + Math.sin(a) * r * 0.62).toFixed(2)}px, 0) rotate(${(a * 180 / Math.PI).toFixed(2)}deg)`,
        opacity: String(1 - p),
      });
    });
    css(pbg, { borderColor: approved ? `rgba(69,191,124,${(0.7 * (1 - seg(t, T.fly, 0.2))).toFixed(3)})` : 'rgba(236,240,241,0.14)' });

    // --- the automation flies into Marketing
    const flyP = seg(t, T.fly, T.land - T.fly, E.inOutCubic);
    const gone = seg(t, T.fly, 0.22, E.inCubic);
    if (t >= T.fly) {
      css(msg, { opacity: String(1 - 0.75 * gone) });
      css(bubble, { opacity: String(1 - 0.75 * gone) });
    } else css(msg, { opacity: '1' });
    css(msg, { filter: `blur(${(4 * gone).toFixed(2)}px)` });
    css(bubble, { filter: `blur(${(4 * gone).toFixed(2)}px)` });
    const startP = [L.plan[0] + 28, L.plan[1] + 20];
    const endP = [L.subRow[0], L.subRow[1]];
    const fxp = lerp(startP[0], endP[0], flyP);
    const fyp = lerp(startP[1], endP[1], flyP) - Math.sin(Math.PI * flyP) * 130;
    css(flyer, {
      display: t >= T.fly && t < T.land + 0.03 ? 'flex' : 'none',
      transform: `translate3d(${fxp.toFixed(2)}px, ${fyp.toFixed(2)}px, 0) scale(${lerp(1.2, 1, flyP).toFixed(4)}) rotate(${(-5 * Math.sin(Math.PI * flyP)).toFixed(3)}deg)`,
      opacity: String(clamp((t - T.fly) / 0.08)),
    });

    // --- phone joins on the wide shot, leaves on the push-in
    const pIn = spring(t, T.phone, 2.2, 0.62);
    const pOut = seg(t, T.pushIn - 0.05, 0.45, E.inCubic);
    css(phone, {
      display: t > T.phone - 0.05 && t < T.pushIn + 0.5 ? 'block' : 'none',
      transform: `translate3d(${(470 + 520 * (1 - pIn) + 900 * pOut).toFixed(2)}px, ${(-300 + 120 * (1 - clamp(pIn))).toFixed(2)}px, 150px) rotateY(${(-14 * (1 - clamp(pIn)) - 4).toFixed(3)}deg) rotateZ(${(3 * (1 - clamp(pIn))).toFixed(3)}deg)`,
    });
    tiles.forEach((tl, i) => {
      const p = seg(t, T.phone + 0.15 + i * 0.035, 0.4, E.snap);
      css(tl, { opacity: String(p), transform: `translate3d(0, ${(18 * (1 - p)).toFixed(2)}px, 0)` });
    });

    // --- morph into the app icon (sub-steps scale with the morph's length)
    const md = T.lockup - T.morph;
    const m = seg(t, T.morph, md - 0.02, E.inOutQuart);
    const sz = [lerp(WIN.w, 200, m), lerp(WIN.h, 200, m)];
    css(win, {
      left: `${(-sz[0] / 2).toFixed(2)}px`, top: `${(-sz[1] / 2).toFixed(2)}px`, width: `${sz[0].toFixed(2)}px`, height: `${sz[1].toFixed(2)}px`,
      borderRadius: `${lerp(30, 46, m).toFixed(2)}px`,
      boxShadow: `0 0 0 1px rgba(236,240,241,${(0.09 * (1 - m)).toFixed(3)}), 0 60px 120px -30px rgba(0,0,0,${(0.85 * (1 - m)).toFixed(3)}), 0 30px 60px -20px rgba(0,0,0,${(0.55 * m).toFixed(3)})`,
    });
    css(winIn, { opacity: String(1 - seg(t, T.morph, 0.3 * md, E.outQuad)), transform: `translate(${((sz[0] - WIN.w) / 2).toFixed(2)}px, ${((sz[1] - WIN.h) / 2).toFixed(2)}px) scale(${lerp(1, 0.4, m).toFixed(4)})`, transformOrigin: '50% 50%' });
    const wipe = seg(t, T.morph + 0.08 * md, 0.6 * md, E.inOutCubic);
    css(skin, { display: wipe > 0 ? 'grid' : 'none', clipPath: `circle(${(wipe * 75).toFixed(2)}% at 50% 50%)` });
    css(skinMark, { transform: `scale(${lerp(0.55, 1, seg(t, T.morph + 0.24 * md, 0.68 * md, E.snap)).toFixed(4)})`, opacity: String(seg(t, T.morph + 0.24 * md, 0.3 * md)) });
  }

  return { root: world, update, layout, L, camera };
}
