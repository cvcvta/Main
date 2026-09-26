// Scene D: the window lands as the app icon, the camera flies through it into the icon's green, and the
// icon's own wordmark rides out to become the lockup. Then the homepage's chip, the line, and the offer.
import { T, COPY } from './config.js';
import { E, clamp, lerp, seg, spring, el, css, words } from './engine.js';
import { logoEl, iconMarkBox } from './brand.js';
import { taglineAt } from './timing.js';

const ZOOM = 0.75; // the fly-through, seconds

const ICON = { x: 860, y: 440, s: 200, r: 46 };
const LOGO_H = 130; // final glyph height of the lockup
const LOGO_Y = 340; // final centre of the lockup

export function buildEnd(parent, brand) {
  const root = el('div', '', parent);
  root.id = 'end';
  const sq = el('div', 'sq', root);
  const bgEnd = el('div', 'ebg', sq);
  const sheen = el('div', 'sheen', sq);
  const gloss = el('div', 'gloss', sq);

  const content = el('div', 'abs', root);
  css(content, { left: '0px', top: '0px', width: '1920px', height: '1080px', transformOrigin: '960px 530px' });
  const box = el('div', 'wordbox', content);
  const word = logoEl(brand, box, LOGO_H, '#FFFFFF', 'lock-word');

  // where the wordmark sits inside the 200 px icon, relative to the icon centre
  const [mx, my, mh] = iconMarkBox(brand, ICON.s);
  const s0 = mh / LOGO_H;

  const chip = el('div', 'echip', content, `<span>${COPY.chip}</span>`);
  const one = el('div', 'oneliner', content);
  const ws = words(one, COPY.oneLiner);
  ws.forEach((w) => { if (w.textContent === COPY.oneLinerHi) w.classList.add('hi'); });

  const price = el('div', 'priceline', content, `<b>${COPY.price[0]}</b> ${COPY.price[1]} <b>${COPY.price[2]}</b>`);
  const row = el('div', 'trialrow', content);
  const trial = el('div', 'trial', row, COPY.trial);
  const url = el('div', 'url', row, COPY.url);

  let mwPx = mh * 3; // wordmark width inside the icon, measured once laid out
  function layout() { mwPx = s0 * word.offsetWidth; }

  function update(t) {
    const vis = t >= T.lockup;
    css(root, { display: vis ? 'block' : 'none' });
    if (!vis) return;

    // the icon settles, then the camera flies through it
    const land = spring(t, T.lockup, 3.4, 0.4);
    const pulse = 1 + 0.07 * (1 - clamp(land)) * Math.sin(Math.PI * clamp((t - T.lockup) / 0.35));
    const z = seg(t, T.zoom, ZOOM, E.inOutCubic);
    // anticipation: the icon draws in slightly on the beat of air, then releases into the zoom
    const pre = t < T.zoom ? 1 - 0.035 * seg(t, T.zoom - 0.32, 0.32, E.inOutQuad) : lerp(0.965, 1, E.outQuad(clamp(z * 3)));
    const f = pulse * pre;
    const x = lerp(ICON.x, -30, z), y = lerp(ICON.y, -30, z), w = lerp(ICON.s, 1980, z), h = lerp(ICON.s, 1140, z);
    css(sq, {
      left: `${x.toFixed(2)}px`, top: `${y.toFixed(2)}px`, width: `${w.toFixed(2)}px`, height: `${h.toFixed(2)}px`,
      borderRadius: `${lerp(ICON.r, 0, E.inQuad(z)).toFixed(2)}px`, transform: `scale(${f.toFixed(4)})`,
      boxShadow: `0 30px 60px -20px rgba(0,0,0,${(0.55 * (1 - z)).toFixed(3)})`,
    });
    css(bgEnd, { opacity: String(seg(t, T.zoom + 0.15, 0.55)) });
    const gp = seg(t, T.lockup - 0.05, 0.5, E.inOutQuad);
    css(gloss, { transform: `translateX(${lerp(-120, 120, gp).toFixed(2)}%)`, opacity: String(1 - z) });
    css(sheen, { '--sx': `${lerp(18, 82, seg(t, T.zoom, T.end - T.zoom, E.inOutQuad)).toFixed(2)}%` });

    // the icon's wordmark rides out to the lockup
    const wz = seg(t, T.zoom + 0.05, ZOOM + 0.03, E.inOutCubic);
    const dx0 = mx + mwPx / 2 - ICON.s / 2, dy0 = my + mh / 2 - ICON.s / 2;
    const sc = lerp(s0 * f, 1, wz);
    css(word, { transform: `translate3d(${(lerp(dx0 * f, 0, wz)).toFixed(2)}px, ${(lerp(dy0 * f, LOGO_Y - 540, wz)).toFixed(2)}px, 0) scale(${sc.toFixed(4)})` });

    // a slow push keeps the held end card alive
    const push = 1 + 0.03 * seg(t, T.zoom + 0.35, T.end - T.zoom - 0.35, E.outQuad);
    css(content, { transform: `scale(${push.toFixed(5)})` });

    // the homepage's chip, then the line with "does" lit
    const cp = spring(t, T.chip, 3, 0.6);
    css(chip, { top: '452px', opacity: String(clamp(cp * 2)), transform: `translate3d(0, ${(18 * (1 - clamp(cp))).toFixed(2)}px, 0)` });
    css(one, { top: '516px' });
    ws.forEach((wd, i) => {
      const p = seg(t, taglineAt(i), 0.6, E.snap);
      css(wd, { opacity: String(clamp(p * 1.6)), transform: `translate3d(0, ${(34 * (1 - p)).toFixed(2)}px, 0)`, filter: `blur(${(8 * (1 - p)).toFixed(2)}px)` });
    });

    // the offer
    const pp = seg(t, T.price, 0.6, E.snap);
    css(price, { top: '628px', opacity: String(pp), transform: `translate3d(0, ${(26 * (1 - pp)).toFixed(2)}px, 0)` });
    const tp = spring(t, T.trial, 3, 0.55);
    css(row, { top: '712px' });
    css(trial, { opacity: String(clamp(tp * 2)), transform: `scale(${lerp(0.8, 1, clamp(tp)).toFixed(4)})` });
    const up = seg(t, T.url, 0.6, E.snap);
    css(url, { opacity: String(up), transform: `translate3d(${(-16 * (1 - up)).toFixed(2)}px, 0, 0)` });
  }

  return { root, update, layout };
}
