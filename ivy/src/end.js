// Scene D: the window lands as the app icon, the camera flies through it into brand green,
// the wordmark rides out of the icon, then one line and the offer.
import { T, S16, COPY } from './config.js';
import { E, clamp, lerp, seg, spring, el, css, words } from './engine.js';

const ICON = { x: 860, y: 440, s: 200, r: 46 };

export function buildEnd(parent, brand) {
  const root = el('div', '', parent);
  root.id = 'end';
  const sq = el('div', 'sq', root);
  const bgEnd = el('div', 'ebg', sq);
  const sheen = el('div', 'sheen', sq);
  const img = brand.icon ? el('img', '', sq) : null;
  if (img) img.src = brand.icon;
  const gloss = el('div', 'gloss', sq);

  const content = el('div', 'abs', root);
  css(content, { left: '0px', top: '0px', width: '1920px', height: '1080px', transformOrigin: '960px 520px' });
  const box = el('div', 'wordbox', content);
  const word = el('div', 'lock-word', box, brand.logo ? `<img src="${brand.logo}">` : COPY.brand);
  if (brand.logo && brand.logoDark) css(word.firstChild, { filter: 'brightness(0) invert(1)' });

  const one = el('div', 'oneliner', content);
  const ws = words(one, COPY.oneLiner);
  ws.slice(-3).forEach((w) => w.classList.add('em')); // "does the work."

  const price = el('div', 'priceline', content, `<b>${COPY.price[0]}</b> ${COPY.price[1]} <b>${COPY.price[2]}</b>`);
  const row = el('div', 'trialrow', content);
  const trial = el('div', 'trial', row, COPY.trial);
  const url = el('div', 'url', row, COPY.url);

  function update(t) {
    const vis = t >= T.lockup;
    css(root, { display: vis ? 'block' : 'none' });
    if (!vis) return;

    // the icon settles, then the camera flies through it
    const land = spring(t, T.lockup, 3.4, 0.4);
    const pulse = 1 + 0.07 * (1 - clamp(land)) * Math.sin(Math.PI * clamp((t - T.lockup) / 0.35));
    const z = seg(t, T.zoom, 0.6, E.inOutCubic);
    const x = lerp(ICON.x, -30, z), y = lerp(ICON.y, -30, z), w = lerp(ICON.s, 1980, z), h = lerp(ICON.s, 1140, z);
    css(sq, {
      left: `${x.toFixed(2)}px`, top: `${y.toFixed(2)}px`, width: `${w.toFixed(2)}px`, height: `${h.toFixed(2)}px`,
      borderRadius: `${lerp(ICON.r, 0, E.inQuad(z)).toFixed(2)}px`, transform: `scale(${(z > 0 ? 1 : pulse).toFixed(4)})`,
    });
    css(bgEnd, { opacity: String(seg(t, T.zoom + 0.12, 0.45)) });
    if (img) css(img, { opacity: String(1 - seg(t, T.zoom, 0.25)) });
    const gp = seg(t, T.lockup - 0.05, 0.4, E.inOutQuad);
    css(gloss, { transform: `translateX(${lerp(-120, 120, gp).toFixed(2)}%)`, opacity: String(1 - z) });
    css(sheen, { '--sx': `${lerp(18, 82, seg(t, T.zoom, T.end - T.zoom, E.inOutQuad)).toFixed(2)}%` });

    // wordmark: from inside the icon to the lockup position
    const wz = seg(t, T.zoom + 0.04, 0.62, E.inOutCubic);
    const ws0 = brand.logo ? 0.4 : 76 / 190;
    css(word, {
      transform: `translate3d(0, ${lerp(brand.logo ? 0 : -3, -178, wz).toFixed(2)}px, 0) scale(${lerp(ws0, 1, wz).toFixed(4)}) scale(${pulse.toFixed(4)})`,
    });

    // a slow push keeps the held end card alive
    const push = 1 + 0.035 * seg(t, T.zoom + 0.3, T.end - T.zoom - 0.3, E.outQuad);
    css(content, { transform: `scale(${push.toFixed(5)})` });

    // one line
    css(one, { top: '508px' });
    ws.forEach((wd, i) => {
      const p = seg(t, T.tagline + i * S16 * 0.62, 0.55, E.snap);
      css(wd, { opacity: String(clamp(p * 1.6)), transform: `translate3d(0, ${(34 * (1 - p)).toFixed(2)}px, 0)`, filter: `blur(${(8 * (1 - p)).toFixed(2)}px)` });
    });

    // the offer
    const pp = seg(t, T.price, 0.55, E.snap);
    css(price, { top: '618px', opacity: String(pp), transform: `translate3d(0, ${(26 * (1 - pp)).toFixed(2)}px, 0)` });
    const tp = spring(t, T.trial, 3, 0.55);
    css(row, { top: '716px' });
    css(trial, { opacity: String(clamp(tp * 2)), transform: `scale(${lerp(0.8, 1, clamp(tp)).toFixed(4)})` });
    const up = seg(t, T.url, 0.5, E.snap);
    css(url, { opacity: String(up), transform: `translate3d(${(-16 * (1 - up)).toFixed(2)}px, 0, 0)` });
  }

  return { root, update };
}
