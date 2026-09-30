const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const eo = x => 1 - Math.pow(1 - x, 3);
const eb = x => { const c = 1.6; x -= 1; return 1 + (c + 1) * x * x * x + c * x * x; };
const prog = (t, s, d) => clamp((t - s) / d);
const lerp = (a, b, m) => a + (b - a) * m;
const $ = id => document.getElementById(id);
const place = (id, x, y, k = 1) => $(id).setAttribute('transform', `translate(${x} ${y}) scale(${k})`);
const wave = (id, a, cx, cy) => { const el = $(id + 'arm'); if (el) el.setAttribute('transform', `rotate(${a} ${cx} ${cy})`); };
const kidWave = (id, a) => wave(id, a, 156, 184);
const COLORS = ['#e2432b', '#3aa655', '#2a6fd6', '#f5b400'];
const logo = (size) => [0, 1, 2, 3].map(i => `<path transform="translate(${(i % 2) * size} ${(i >> 1) * size}) scale(${size / 100}) translate(2 2) scale(.96)" d="${PIECE}" fill="${COLORS[i]}"/>`).join('');

// ---------- build ----------
document.querySelectorAll('[data-words]').forEach(el => {
  const [s, st] = el.dataset.words.split(',').map(Number);
  let i = 0;
  el.innerHTML = el.textContent.split('|').map(line =>
    line.split(' ').map(w => `<span class="w" data-a="${(s + st * i++).toFixed(2)},.5,up">${w}</span>`).join('')).join('<br>');
});

// floating outline pieces behind each scene
const decos = [];
document.querySelectorAll('[data-deco]').forEach((sc, si) => {
  const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', 1080); svg.setAttribute('height', 1920); svg.setAttribute('class', 'abs'); svg.style.left = 0; svg.style.top = 0;
  const spots = [[900, 260], [120, 1180], [960, 1500], [180, 380], [860, 900], [520, 1800]];
  svg.innerHTML = spots.map(([x, y], i) => `<g class="dp" data-x="${x}" data-y="${y}" data-k="${1.1 + ((i * 7 + si) % 5) * .25}" data-d="${i % 2 ? 1 : -1}"><path d="${PIECE}" transform="translate(-50 -50)" fill="none" stroke="${sc.dataset.deco}" stroke-width="3" opacity=".09"/></g>`).join('');
  sc.prepend(svg); decos.push(...svg.querySelectorAll('.dp'));
});

// A
$('logoA').innerHTML = [0, 1, 2, 3].map(i => `<g id="pA${i}"><path d="${PIECE}" fill="${COLORS[i]}" stroke="#faf8f3" stroke-width="4"/></g>`).join('');
$('wordA').innerHTML = [...'PuzzlePiece'].map(c => `<span>${c}</span>`).join('');
$('momA').innerHTML = adult({ id: 'mA', hairStyle: 'bun', top: '#e4d3b5', pants: '#5f6b45', hair: '#2e211b' });
$('dadA').innerHTML = adult({ id: 'dA', top: '#5e7f4e', topDark: '#3f5a3a', pants: '#3e4a5e', hair: '#5a3824', skin: '#e8b48a' });
$('kidA').innerHTML = kid({ id: 'kA' }) + `<g id="hiA"><rect x="0" y="0" width="120" height="76" rx="30" fill="#fff" stroke="#184e45" stroke-width="4"/><path d="M20 72 L10 100 L44 74" fill="#fff" stroke="#184e45" stroke-width="4" stroke-linejoin="round"/><rect x="18" y="66" width="30" height="10" fill="#fff"/><text x="60" y="52" text-anchor="middle" font-family="DM Sans" font-weight="700" font-size="36" fill="#184e45">Hi!</text></g>`;

// B
$('photoLayer').innerHTML = `<g filter="url(#photoF)"><rect width="540" height="620" fill="#7d9a5c"/><rect width="540" height="160" fill="#b7c4c9"/>
  ${Array.from({ length: 40 }, (_, i) => `<path d="M${(i * 37) % 540} ${200 + (i * 53) % 420} l6 -24" stroke="#56703c" stroke-width="4"/>`).join('')}
  <g transform="translate(140 60) scale(1.3)">${kid({ id: 'kP' })}</g></g>
  <rect width="540" height="620" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="60" style="filter:blur(30px)"/>`;
$('illLayer').innerHTML = `<rect width="540" height="620" fill="#e5efe9"/><circle cx="270" cy="330" r="230" fill="#cfe5da"/>
  <g transform="translate(140 60) scale(1.3)">${kid({ id: 'kI' })}</g>`;
const star4 = (x, y, r) => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z"/>`;
const sparks = [[230, 470, 30], [860, 520, 40], [200, 900, 24], [890, 980, 30], [300, 1250, 28], [800, 1260, 36], [540, 430, 22], [960, 760, 22]];
$('sparkB').innerHTML = sparks.map(([x, y, r], i) => `<g class="spk" data-i="${i}" data-x="${x}" data-y="${y}" fill="${i % 2 ? '#fbb015' : '#184e45'}">${star4(0, 0, r)}</g>`).join('');

const headBox = { kid: '10 18 180 180', adult: '32 22 176 176' };
const avatar = (x, y, svg, box, name, a, extra = '') => `<div class="avatar" style="left:${x}px;top:${y}px" data-a="${a},.35,pop"><svg width="170" height="170" viewBox="${box}">${svg}</svg></div>${extra}<div class="avname" style="left:${x}px;top:${y + 180}px" data-a="${a},.35,fade">${name}</div>`;
const MOM = () => adult({ hairStyle: 'bun', top: '#e4d3b5', hair: '#2e211b' });
const DAD = () => adult({ top: '#5e7f4e', hair: '#5a3824', skin: '#e8b48a' });
const SIB = () => kid({ hairStyle: 'long', hair: '#7a4a2a', hairDark: '#5e3820', top: '#e6b43c', camo: false, topDark: '#c9952a', shorts: '#6d8fb8' });
$('famB').innerHTML = avatar(0, 0, MOM(), headBox.adult, 'Mom', 5.55) + avatar(200, 0, DAD(), headBox.adult, 'Dad', 5.65) + avatar(400, 0, SIB(), headBox.kid, 'Sibling', 5.75) +
  `<div class="abs serif" style="left:610px;top:40px;width:320px;font-size:40px;line-height:1.2;color:#184e45" data-a="5.85,.4,up">+ the people they love</div>`;

// C
const check = (x, y, a) => `<div class="abs" style="left:${x}px;top:${y}px;width:52px;height:52px;border-radius:50%;background:#184e45;color:#fff;font-size:30px;display:flex;align-items:center;justify-content:center;font-weight:700" data-a="${a},.3,pop">✓</div>`;
$('castC').innerHTML = avatar(0, 0, kid({}), headBox.kid, 'Your child', 8.2, `<div class="abs" style="left:-6px;top:-6px;width:182px;height:182px;border-radius:50%;border:6px solid #fbb015" data-a="8.2,.35,pop"></div>`) +
  avatar(250, 0, MOM(), headBox.adult, 'Mom', 8.3, check(378, -6, 8.65)) + avatar(500, 0, DAD(), headBox.adult, 'Dad', 8.4) + avatar(750, 0, SIB(), headBox.kid, 'Sibling', 8.5);
$('pageArt').innerHTML = `<rect width="450" height="580" fill="#f7e8cf"/><rect y="440" width="450" height="140" fill="#dcb98c"/>
  <rect x="250" y="120" width="160" height="330" fill="#6f9a5a"/><rect x="262" y="132" width="136" height="318" fill="#bfe3a4"/><circle cx="330" cy="250" r="44" fill="#7fb35f"/><rect x="262" y="132" width="136" height="80" fill="#dff1f7"/>
  <g transform="translate(40 170) scale(.72)">${adult({ id: 'mC', hairStyle: 'bun', top: '#e4d3b5', hair: '#2e211b' })}</g>
  <g transform="translate(190 250) scale(.62)">${kid({ id: 'kC', backpack: true })}</g>
  <g id="heartC"><path d="M0 18 C-14 8 -9 -6 0 0 C9 -6 14 8 0 18Z" fill="#f08c7a" transform="translate(200 150) scale(1.6)"/></g>`;
$('coverLogo').innerHTML = logo(100);

// D
$('bg0').innerHTML = schoolBg(); $('bg1').innerHTML = doctorBg(); $('bg2').innerHTML = bedBg();
$('kidD1').innerHTML = kid({ id: 'kD1', backpack: true }); $('kidD2').innerHTML = kid({ id: 'kD2' });

// E
$('stA').innerHTML = kid({ id: 'kE1', shade: true });
$('stB').innerHTML = pixelKid();
$('stBbg').innerHTML = Array.from({ length: 22 }, (_, i) => `<rect x="${i * 20}" y="${440 + (i % 3) * 0}" width="20" height="70" fill="${i % 2 ? '#6aa84f' : '#5a9a42'}"/><rect x="${i * 20}" y="470" width="20" height="40" fill="#8a6440"/>`).join('') +
  `<rect x="40" y="60" width="60" height="60" fill="#fff" opacity=".7"/><rect x="340" y="100" width="40" height="40" fill="#fff" opacity=".7"/>`;
$('stC').innerHTML = brickKid();
$('stCbg').innerHTML = Array.from({ length: 36 }, (_, i) => `<circle cx="${30 + (i % 9) * 48}" cy="${444 + Math.floor(i / 9) * 22}" r="12" fill="#f0c65a"/>`).join('');
$('stD').innerHTML = kid({ id: 'kE4', skin: '#f7d117', line: '#2b2b2b', eyes: 'bulge', hair: '#f2c522', hairDark: '#c99a10' });

// F
let dots = '';
for (let i = 0; i < 249; i++) {
  const c = i % 18, r = Math.floor(i / 18), x = c * 46 + 23, y = r * 44 + 22;
  dots += `<g class="dot" data-d="${(c + r) * 0.022}" data-x="${x}" data-y="${y}"><circle cx="0" cy="-9" r="8" fill="${i % 7 === 3 ? '#fbb015' : '#184e45'}"/><rect x="-10" y="1" width="20" height="15" rx="7" fill="${i % 7 === 3 ? '#fbb015' : '#184e45'}"/></g>`;
}
$('dotsF').innerHTML = dots;
const chk = $('checkF'), chkL = chk.getTotalLength(); chk.style.strokeDasharray = chkL;

// G
$('tabG').innerHTML = tabletSvg(`<rect width="664" height="404" fill="#e5efe9"/><circle cx="332" cy="260" r="200" fill="#cfe5da"/>
  <g transform="translate(40 36)">${logo(28)}</g><text x="112" y="80" font-family="Lora" font-size="34" fill="#184e45">PuzzlePiece</text>
  <g transform="translate(250 60) scale(.8)">${kid({ id: 'kG' })}</g>
  <g transform="translate(470 120) scale(.55)">${bookIcon()}</g>
  <rect id="screenOff" width="664" height="404" fill="#0c0c0c"/>`);
function bookIcon() { return `<rect x="0" y="0" width="140" height="180" rx="10" fill="#184e45"/><rect x="140" y="0" width="140" height="180" rx="10" fill="#2a6b5f"/><rect x="20" y="30" width="100" height="10" rx="5" fill="#f9d272"/><rect x="160" y="30" width="100" height="10" rx="5" fill="#f9d272"/><rect x="20" y="56" width="80" height="10" rx="5" fill="#cfe5da"/><rect x="160" y="56" width="80" height="10" rx="5" fill="#cfe5da"/>`; }

const anims = [...document.querySelectorAll('[data-a]')];
const scenes = [...document.querySelectorAll('.scene')];
const WIPES = [[3, '#e5efe9'], [6.4, '#faf8f3'], [10, '#e5efe9'], [12.6, '#184e45'], [15, '#faf8f3'], [17.4, '#184e45']];
const quote = '“My child feels anxious when I leave at school. Can we practice saying goodbye?”';

// ---------- render ----------
function render(t) {
  scenes.forEach(sc => sc.style.display = (t >= +sc.dataset.s && t < +sc.dataset.e) ? 'block' : 'none');

  anims.forEach(el => {
    const [s, d, k] = el.dataset.a.split(','); const p = prog(t, +s, +d), e = eo(p);
    const rot = el.dataset.rot ? ` rotate(${el.dataset.rot}deg)` : '';
    let tr = '';
    if (k === 'up') tr = `translateY(${(1 - e) * 50}px)`;
    if (k === 'pop') tr = `scale(${0.6 + 0.4 * eb(p)})`;
    if (k === 'flip') tr = `perspective(1400px) rotateY(${(1 - e) * -100}deg)`;
    if (k === 'spin') tr = `rotate(${(1 - e) * -200}deg) scale(${0.3 + 0.7 * eb(p)})`;
    el.style.opacity = k === 'flip' ? (p > 0 ? 1 : 0) : e;
    el.style.transform = tr + rot;
  });

  decos.forEach((g, i) => {
    const x = +g.dataset.x, y = +g.dataset.y + Math.sin(t * .9 + i) * 24, k = +g.dataset.k;
    g.setAttribute('transform', `translate(${x} ${y}) rotate(${t * 14 * g.dataset.d + i * 40}) scale(${k})`);
  });

  // wipe
  const wp = $('wipeP'); wp.style.display = 'none';
  for (const [T, col] of WIPES) {
    if (t >= T - .5 && t < T) {
      const p = prog(t, T - .5, .5), s = .1 + 46 * p * p;
      wp.style.display = 'block'; wp.setAttribute('fill', col); wp.setAttribute('stroke', '#f9d272');
      wp.setAttribute('transform', `translate(540 960) rotate(${140 * p}) scale(${s}) translate(-50 -50)`);
    }
  }

  // A — pieces assemble into the logo, then dock in the header
  const m = eo(prog(t, 1.25, .45));
  const size = lerp(150, 40, m), ox = lerp(390, 80, m), oy = lerp(520, 70, m);
  const starts = [[-320, -340, -200], [1300, -300, 220], [-340, 2100, 160], [1320, 2150, -240]];
  for (let i = 0; i < 4; i++) {
    const p = eb(prog(t, .05 + i * .12, .6)), [sx, sy, sr] = starts[i];
    const fx = ox + (i % 2) * size, fy = oy + (i >> 1) * size;
    const snap = 1 + .08 * Math.sin(Math.PI * prog(t, .85, .25));
    const k = size / 100 * snap;
    $('pA' + i).setAttribute('transform', `translate(${lerp(sx, fx, p)} ${lerp(sy, fy, p)}) rotate(${lerp(sr, 0, clamp(p))} ${size / 2} ${size / 2}) scale(${k})`);
  }
  const wA = $('wordA'); wA.style.fontSize = lerp(124, 58, m) + 'px';
  wA.style.left = lerp(540 - wA.offsetWidth / 2, 180, m) + 'px'; wA.style.top = lerp(860, 72, m) + 'px';
  [...wA.children].forEach((c, i) => { const p = eo(prog(t, .75 + i * .035, .3)); c.style.opacity = p; c.style.display = 'inline-block'; c.style.transform = `translateY(${(1 - p) * 30}px)`; });
  const rise = (s) => (1 - eb(prog(t, s, .6))) * 800;
  place('momA', 40, 1216 + rise(1.85), 1.2);
  place('dadA', 740, 1190 + rise(1.95), 1.25);
  place('kidA', 405, 1273 + rise(1.7), 1.35);
  kidWave('kA', t > 2.1 ? -150 + 18 * Math.sin((t - 2.1) * 14) : lerp(0, -150, eo(prog(t, 1.9, .2))));
  wave('dA', t > 2.3 ? -8 * Math.sin((t - 2.3) * 6) : 0, 188, 196);
  const hi = eb(prog(t, 2.35, .35)); $('hiA').setAttribute('transform', `translate(${150 + 40 * (1 - hi)} ${-70 + 40 * (1 - hi)}) scale(${hi})`);

  // B — scan turns the photo into the character
  const sp = prog(t, 4.0, .85);
  $('scanRect').setAttribute('height', sp * 620);
  $('scanLine').setAttribute('y', sp * 620 - 5); $('scanLine').setAttribute('opacity', sp > 0 && sp < 1 ? .95 : 0);
  $('capPhoto').style.opacity = 1 - prog(t, 4.75, .2); $('capChar').style.opacity = prog(t, 4.8, .25);
  kidWave('kI', t > 4.9 ? -150 + 18 * Math.sin((t - 4.9) * 14) : lerp(0, -150, eo(prog(t, 4.75, .15))));
  document.querySelectorAll('.spk').forEach(g => {
    const i = +g.dataset.i, p = prog(t, 4.85 + i * .06, .7), k = Math.sin(Math.PI * p);
    g.setAttribute('transform', `translate(${g.dataset.x} ${g.dataset.y}) rotate(${p * 90}) scale(${k})`);
  });

  // C — typing, cover flip
  const n = Math.round(quote.length * prog(t, 6.95, 1.0));
  $('typed').textContent = quote.slice(0, n);
  $('caret').style.opacity = (n < quote.length || Math.floor(t * 2.5) % 2) ? 1 : 0;
  const f = eo(prog(t, 9.0, .55));
  $('coverC').style.transform = `rotateY(${-180 * f}deg)`;
  $('coverC').style.visibility = f < .5 ? 'visible' : 'hidden';
  $('pageL').style.opacity = f >= .5 ? 1 : 0;
  kidWave('kC', t > 9.3 ? -150 + 18 * Math.sin((t - 9.3) * 14) : -150);
  const hp = prog(t, 9.35, .6); $('heartC').setAttribute('transform', `translate(0 ${-60 * hp})`); $('heartC').style.opacity = hp > 0 ? Math.sin(Math.PI * hp) : 0;

  // D — circle reveals cycle the moments
  [10.15, 10.95, 11.7].forEach((s, i) => $('cr' + i).setAttribute('r', 360 * eo(prog(t, s, .5))));
  const bob = -Math.abs(Math.sin(t * 5)) * 14, kp = eb(prog(t, 10.3, .45));
  const swap = t >= 11.2;
  $('kidD1').style.display = swap ? 'none' : 'block'; $('kidD2').style.display = swap ? 'block' : 'none';
  $('kidD1').setAttribute('transform', `translate(235 ${190 + bob + (1 - kp) * 500}) scale(1.15)`);
  $('kidD2').setAttribute('transform', `translate(235 ${190 + bob}) scale(1.15)`);
  kidWave('kD2', t > 11.8 ? -150 + 15 * Math.sin(t * 12) : 0);
  const win = (a, b) => Math.min(eo(prog(t, a, .25)), 1 - prog(t, b, .2));
  [[10.4, 10.95], [11.15, 11.7], [11.9, 99]].forEach(([a, b], i) => { const o = win(a, b); $('lbl' + i).style.opacity = o; $('lbl' + i).style.transform = `translateY(${(1 - o) * 24}px)`; });
  document.querySelectorAll('.twinkle').forEach(s => s.style.opacity = .35 + .65 * Math.abs(Math.sin(t * 4 + +s.dataset.i)));
  $('marq1').style.transform = `translateX(${-(t - 10) * 120}px)`;
  $('marq2').style.transform = `translateX(${-800 + (t - 10) * 120}px)`;

  // E — each style bounces
  ['stA', 'stB', 'stC', 'stD'].forEach((id, i) => { $(id).style.transform = `translateY(${-Math.abs(Math.sin((t - 13) * 5 + i * .8)) * 18}px)`; });
  kidWave('kE4', -150 + 18 * Math.sin(t * 12)); kidWave('kE1', -150 + 18 * Math.sin(t * 12 + 1));

  // F — children fill in, counters, check
  document.querySelectorAll('.dot').forEach(g => {
    const p = eb(prog(t, 15.3 + +g.dataset.d, .3));
    g.setAttribute('transform', `translate(${g.dataset.x} ${g.dataset.y}) scale(${Math.max(p, 0)})`);
  });
  $('c249').textContent = Math.round(249 * eo(prog(t, 15.35, 1.0)));
  $('c87').textContent = Math.round(87 * eo(prog(t, 15.45, 1.0)));
  chk.style.strokeDashoffset = chkL * (1 - eo(prog(t, 16.4, .35)));

  // G — tablet drops, screen wakes, CTA gets tapped
  const d = prog(t, 17.6, .65);
  $('tabG').style.transform = `translateY(${-1000 * (1 - eb(d))}px) rotate(${(1 - eo(d)) * -10}deg)`;
  $('screenOff').setAttribute('opacity', 1 - prog(t, 18.15, .3));
  kidWave('kG', t > 18.3 ? -150 + 18 * Math.sin((t - 18.3) * 14) : 0);
  const tp = eo(prog(t, 18.95, .35)), press = Math.sin(Math.PI * prog(t, 19.3, .25));
  const tap = $('tapG'); tap.style.opacity = tp * (1 - .4 * prog(t, 19.7, .3));
  tap.style.transform = `translate(${(1 - tp) * 140}px, ${(1 - tp) * 260}px) scale(${1 - .25 * press})`;
  $('ctaG').style.transform = `scale(${1 - .04 * press + (t > 19.6 ? .02 * Math.sin((t - 19.6) * 10) : 0)})`;
  const rp = prog(t, 19.35, .5); const rip = $('rippleG');
  rip.style.opacity = rp > 0 ? .55 * (1 - rp) : 0; rip.style.transform = `translate(-50%,-50%) scale(${rp * 180})`;
}
window.render = render; render(0);
