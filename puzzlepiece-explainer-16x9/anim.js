const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const eo = x => 1 - Math.pow(1 - x, 3);
const eb = x => { const c = 0.9; x -= 1; return 1 + (c + 1) * x * x * x + c * x * x; };
const prog = (t, s, d) => clamp((t - s) / d);
const lerp = (a, b, m) => a + (b - a) * m;
const $ = id => document.getElementById(id);
const place = (id, x, y, k = 1) => $(id).setAttribute('transform', `translate(${x} ${y}) scale(${k})`);
const armTo = (id, a, cx = 156, cy = 184) => { const el = $(id + 'arm'); if (el) el.setAttribute('transform', `rotate(${a} ${cx} ${cy})`); };
const waveA = (t, s) => t > s ? -150 + 14 * Math.sin((t - s) * 5) : lerp(0, -150, eo(prog(t, s - .5, .5)));
const MOM = id => adult({ id, hairStyle: 'bun', top: '#e4d3b5', pants: '#5f6b45', hair: '#2e211b' });
const DAD = id => adult({ id, top: '#5e7f4e', pants: '#3e4a5e', hair: '#5a3824', skin: '#e8b48a' });
const SIB = () => kid({ hairStyle: 'long', hair: '#7a4a2a', hairDark: '#5e3820', top: '#e6b43c', camo: false, topDark: '#c9952a', shorts: '#6d8fb8' });
const star4 = r => `<path d="M0 ${-r} Q0 0 ${r} 0 Q0 0 0 ${r} Q0 0 ${-r} 0 Q0 0 0 ${-r}Z"/>`;
const COLORS = ['#e2432b', '#3aa655', '#2a6fd6', '#f5b400'];

// ---------- build ----------
document.querySelectorAll('[data-words]').forEach(el => {
  const [s, st] = el.dataset.words.split(',').map(Number); let i = 0;
  el.innerHTML = el.textContent.split('|').map(line => line.split(' ').map(w => `<span class="w" data-a="${(s + st * i++).toFixed(2)},.7,up">${w}</span>`).join('')).join('<br>');
});
const decos = [];
document.querySelectorAll('[data-deco]').forEach((sc, si) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', 1920); svg.setAttribute('height', 1080); svg.setAttribute('class', 'abs'); svg.style.left = 0; svg.style.top = 0;
  svg.innerHTML = [[1820, 120], [90, 980], [1780, 1000]].map(([x, y], i) => `<g class="dp" data-x="${x}" data-y="${y}" data-k="${1.3 + i * .3}" data-d="${i % 2 ? 1 : -1}"><path d="${PIECE}" transform="translate(-50 -50)" fill="none" stroke="${sc.dataset.deco}" stroke-width="3" opacity=".07"/></g>`).join('');
  sc.prepend(svg); decos.push(...svg.querySelectorAll('.dp'));
});
document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));

// 1 family
$('mom1').innerHTML = MOM('m1'); $('dad1').innerHTML = DAD('d1'); $('kid1').innerHTML = kid({ id: 'k1' });

// 2 scribbles over each card
const scribble = (x, y) => { let d = ''; for (let i = 0; i <= 60; i++) { const a = i * .55, r = 30 + 16 * Math.sin(i * 1.7); d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * r * 1.6 + i * 1.1).toFixed(1)} ${(y + Math.sin(a) * r).toFixed(1)} `; } return `<path class="scr" d="${d}" stroke="#d2462c" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>`; };
$('scrib2').innerHTML = [260, 680, 1100, 1520].map(x => scribble(x, 330)).join('');
const scrs = [...document.querySelectorAll('.scr')]; scrs.forEach(p => { const L = p.getTotalLength(); p.dataset.l = L; p.style.strokeDasharray = L; });

// 3 photo -> character, cast
$('photoLayer').innerHTML = `<g filter="url(#photoF)"><rect width="540" height="620" fill="#7d9a5c"/><rect width="540" height="160" fill="#b7c4c9"/>
  ${Array.from({ length: 40 }, (_, i) => `<path d="M${(i * 37) % 540} ${200 + (i * 53) % 420} l6 -24" stroke="#56703c" stroke-width="4"/>`).join('')}
  <g transform="translate(140 60) scale(1.3)">${kid({ id: 'kP' })}</g></g>`;
$('illLayer').innerHTML = `<rect width="540" height="620" fill="#e5efe9"/><circle cx="270" cy="330" r="230" fill="#cfe5da"/><g transform="translate(140 60) scale(1.3)">${kid({ id: 'kI' })}</g>`;
const sparks = [[230, 170, 26], [700, 200, 34], [200, 620, 22], [720, 700, 28], [470, 130, 20]];
$('spark3').innerHTML = sparks.map(([x, y, r], i) => `<g class="spk" data-i="${i}" data-x="${x}" data-y="${y}" fill="${i % 2 ? '#fbb015' : '#184e45'}">${star4(r)}</g>`).join('');
const headBox = { kid: '10 18 180 180', adult: '32 22 176 176' };
const avatar = (x, svg, box, name, a) => `<div class="avatar" style="left:${x}px;top:0" data-a="${a},.6,up"><svg width="140" height="140" viewBox="${box}">${svg}</svg></div><div class="avname" style="left:${x}px;top:150px" data-a="${a},.6,fade">${name}</div>`;
$('cast3').innerHTML = avatar(0, MOM('mx'), headBox.adult, 'Mom', 10.9) + avatar(180, DAD('dx'), headBox.adult, 'Dad', 11.1) + avatar(360, SIB(), headBox.kid, 'Sibling', 11.3);

// 4 story pages on the tablet
const page = (i, art, text) => `<g id="pg${i}"><rect width="664" height="404" fill="#fffdf8"/><rect width="300" height="404" fill="#e5efe9"/>${art}
  <text x="330" y="70" font-family="DM Sans" font-weight="700" font-size="22" letter-spacing="2" fill="#c98a1d">${['FIRST', 'THEN', 'NEXT'][i]}</text>
  <foreignObject x="330" y="90" width="310" height="200"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Lora;font-size:40px;line-height:1.15;color:#184e45">${text}</div></foreignObject>
  <rect x="330" y="320" width="260" height="10" rx="5" fill="#e3ebe6"/><rect x="330" y="345" width="200" height="10" rx="5" fill="#e3ebe6"/></g>`;
$('tab4').innerHTML = tabletSvg(`<defs><clipPath id="scr4c"><rect width="664" height="404"/></clipPath></defs><g clip-path="url(#scr4c)"><g id="scr4">
  ${page(0, `<g transform="translate(20 70) scale(1.1)">${icon('park')}</g><g transform="translate(160 190) scale(.45)">${kid({ id: 'k4a' })}</g>`, 'We play at the park.')}
  ${page(1, `<g transform="translate(30 70)">${icon('timer')}</g>`, 'The timer rings. Play is done.')}
  ${page(2, `<g transform="translate(140 110) scale(.6)">${icon('car')}</g><g transform="translate(30 190) scale(.45)">${kid({ id: 'k4c' })}</g>`, 'We wave goodbye and ride home.')}
</g></g>`);
const quote = '“Leaving the park is hard for him.”';

// 7 couch
$('room7').innerHTML = `<rect y="960" width="1920" height="120" fill="#d9bf98"/>
  <rect x="1460" y="250" width="300" height="340" rx="10" fill="#fff"/><rect x="1474" y="264" width="272" height="312" fill="#f6b98a"/><rect x="1474" y="440" width="272" height="136" fill="#e88f6a"/><circle cx="1680" cy="350" r="30" fill="#ffe2a0"/>
  <circle cx="440" cy="560" r="300" fill="url(#gGlow)"/><path d="M380 480 L500 480 L526 580 L354 580 Z" fill="#ffe2a0"/><rect x="432" y="580" width="16" height="380" fill="#8a5a34"/>
  <g transform="translate(720 300) scale(1.15)">${MOM('m7')}</g>
  <g transform="translate(990 418) scale(1.15)">${kid({ id: 'k7' })}</g>
  <rect x="600" y="690" width="840" height="200" rx="60" fill="#5e7f4e"/>
  <rect x="600" y="830" width="840" height="140" rx="36" fill="#6f8e4d"/><path d="M1020 840 V960" stroke="#5e7f4e" stroke-width="6"/>
  <rect x="540" y="760" width="120" height="220" rx="50" fill="#557548"/><rect x="1380" y="760" width="120" height="220" rx="50" fill="#557548"/>
  <g transform="translate(905 575) rotate(-4) scale(.3)">${tabletSvg(`<rect width="664" height="404" fill="#e5efe9"/><text x="60" y="110" font-family="Lora" font-size="60" fill="#184e45">Story time</text><rect x="60" y="160" width="420" height="22" rx="11" fill="#cfe5da"/><rect x="60" y="210" width="340" height="22" rx="11" fill="#cfe5da"/><g transform="translate(470 150) scale(.5)">${kid({ id: 'k7s' })}</g>`)}</g>`;
$('hearts7').innerHTML = [0, 1, 2, 3].map(i => `<path class="ht" data-i="${i}" d="M0 18 C-14 8 -9 -6 0 0 C9 -6 14 8 0 18Z" fill="${i % 2 ? '#f08c7a' : '#e2432b'}"/>`).join('');

// 8 end card
const P8 = [[120, 120, '#5cb85c', .6, -25], [1820, 130, '#6ccfd0', .55, 18], [1830, 960, '#f0b24a', .6, -12]];
$('pieces8').innerHTML = P8.map(([x, y, c], i) => `<g class="pc" data-i="${i}"><path d="${PIECE}" transform="translate(-50 -50)" fill="${c}" opacity=".85"/></g>`).join('');
$('tab8').innerHTML = tabletSvg(`<defs><clipPath id="scr8"><rect width="664" height="404" rx="6"/></clipPath></defs>
  <g clip-path="url(#scr8)"><rect width="664" height="404" fill="#e8f1ec"/><circle cx="332" cy="250" r="170" fill="#d3e7dc"/>
  <g transform="translate(252 34) scale(.82)">${kid({ id: 'k8' })}</g><rect id="off8" width="664" height="404" fill="#101010"/></g>`);

const anims = [...document.querySelectorAll('[data-a]')];
const scenes = [...document.querySelectorAll('.scene')];
const WIPES = [[4, '#e5efe9'], [8, '#faf8f3'], [12.5, '#e5efe9'], [17, '#184e45'], [20.5, '#faf8f3'], [24, '#f3e3cc'], [27, '#f5f1df']];
$('wipeP').setAttribute('d', PIECE);
const chk = $('check6'), chkL = chk.getTotalLength(); chk.style.strokeDasharray = chkL;

// ---------- render ----------
// Authored on a 32 s grid, played back stretched to 50 s.
const STRETCH = 50 / 32;
function render(t) {
  t = t / STRETCH;
  scenes.forEach(sc => sc.style.display = (t >= +sc.dataset.s && t < +sc.dataset.e) ? 'block' : 'none');
  anims.forEach(el => {
    const [s, d, k] = el.dataset.a.split(','); const e = eo(prog(t, +s, +d));
    const rot = el.dataset.rot ? ` rotate(${el.dataset.rot}deg)` : '';
    el.style.opacity = e;
    let tr = '';
    if (k === 'up') tr = `translateY(${(1 - e) * 36}px)`;
    if (k === 'rise') tr = `translateY(${(1 - e) * 70}px) scale(${.96 + .04 * e})`;
    if (k === 'grow') tr = `scaleX(${e})`;
    el.style.transform = tr + rot;
  });
  decos.forEach((g, i) => g.setAttribute('transform', `translate(${g.dataset.x} ${+g.dataset.y + Math.sin(t * .8 + i) * 16}) rotate(${t * 4 * g.dataset.d + i * 40}) scale(${g.dataset.k})`));
  const wp = $('wipeP'); wp.style.display = 'none';
  for (const [T, col] of WIPES) if (t >= T - .7 && t < T) {
    const p = prog(t, T - .7, .7);
    wp.style.display = 'block'; wp.setAttribute('fill', col); wp.setAttribute('stroke', '#f9d272');
    wp.setAttribute('transform', `translate(960 540) rotate(${80 * p}) scale(${.1 + 48 * p * p}) translate(-50 -50)`);
  }

  // 1 — family rises in, child waves
  const rise = s => (1 - eo(prog(t, s, 1.0))) * 500;
  place('mom1', 1180, 454 + rise(.7), 1.05); place('dad1', 1610, 440 + rise(.9), 1.08); place('kid1', 1400, 517 + rise(.5), 1.15);
  $('halo1').setAttribute('r', 340 * eo(prog(t, .3, 1.0)));
  armTo('k1', waveA(t, 1.6)); armTo('d1', t > 2 ? -6 * Math.sin((t - 2) * 3) : 0, 188, 196);

  // 2 — transitions get tangled
  scrs.forEach((p, i) => { p.style.strokeDashoffset = p.dataset.l * (1 - eo(prog(t, 5.4 + i * .18, .9))); });
  [0, 1, 2, 3].forEach(i => { const st = 5.8 + i * .18; $('tc' + i).style.rotate = t > st && t < 8 ? `${Math.sin((t - st) * 7) * 2 * (1 - prog(t, st + 1, .6))}deg` : '0deg'; });

  // 3 — scan
  const sp = prog(t, 9.2, 1.2);
  $('scanRect').setAttribute('height', sp * 620); $('scanLine').setAttribute('y', sp * 620 - 5); $('scanLine').setAttribute('opacity', sp > 0 && sp < 1 ? .95 : 0);
  $('capPhoto').style.opacity = 1 - prog(t, 10.2, .4); $('capChar').style.opacity = prog(t, 10.3, .5);
  armTo('kI', waveA(t, 10.6));
  document.querySelectorAll('.spk').forEach(g => { const p = prog(t, 10.3 + g.dataset.i * .1, 1.2); g.setAttribute('transform', `translate(${g.dataset.x} ${g.dataset.y}) rotate(${p * 90}) scale(${Math.sin(Math.PI * p)})`); });

  // 4 — typing, then pages flip First / Then / Next
  const n = Math.round(quote.length * prog(t, 13.7, 1.0));
  $('typed').textContent = quote.slice(0, n); $('caret').style.opacity = (n < quote.length || Math.floor(t * 2) % 2) ? 1 : 0;
  let sx = 1; [15.0, 16.0].forEach(T => { const d = prog(t, T - .25, .5); if (d > 0 && d < 1) sx = Math.abs(1 - 2 * d); });
  $('scr4').setAttribute('transform', `translate(332 0) scale(${Math.max(sx, .02)} 1) translate(-332 0)`);
  const pgi = t < 15.0 ? 0 : t < 16.0 ? 1 : 2;
  [0, 1, 2].forEach(i => { $('pg' + i).style.display = i === pgi ? 'inline' : 'none'; const st = $('st' + i); const on = i === pgi && t > 13.6; st.style.background = on ? '#fbb015' : '#fff'; st.style.transform = `scale(${on ? 1.06 : 1})`; });
  $('timerArc').style.strokeDasharray = 377; $('timerArc').style.strokeDashoffset = 377 * prog(t, 15.1, .8);
  $('timerHand').setAttribute('transform', `rotate(${prog(t, 15.1, .8) * 360} 120 110)`);
  armTo('k4c', waveA(t, 16.2));

  // 6 — counters + check
  $('c249').textContent = Math.round(249 * eo(prog(t, 21.2, 1.4)));
  $('c87').textContent = Math.round(87 * eo(prog(t, 21.3, 1.4)));
  chk.style.strokeDashoffset = chkL * (1 - eo(prog(t, 22.6, .6)));

  // 7 — hearts rise from the tablet
  document.querySelectorAll('.ht').forEach(h => {
    const i = +h.dataset.i, p = prog(t, 24.6 + i * .5, 2.0);
    h.setAttribute('transform', `translate(${960 + Math.sin(p * 6 + i) * 30 + (i - 1.5) * 40} ${600 - p * 320}) scale(${2 * Math.sin(Math.PI * Math.min(p * 1.4, 1))})`);
    h.style.opacity = p > 0 && p < 1 ? 1 - p * .6 : 0;
  });
  armTo('k7s', waveA(t, 25));

  // 8 — end card
  document.querySelectorAll('.pc').forEach(g => {
    const i = +g.dataset.i, [x, y, , k, r] = P8[i], e = eo(prog(t, 27.2 + i * .15, 1.1));
    g.setAttribute('transform', `translate(${x} ${y + Math.sin(t * .9 + i * 2) * 10}) rotate(${r + Math.sin(t * .6 + i) * 6}) scale(${k * e})`);
  });
  $('off8').setAttribute('opacity', 1 - eo(prog(t, 28.2, .8)));
  armTo('k8', waveA(t, 28.9));
  const press = Math.sin(Math.PI * prog(t, 30.8, .45));
  $('cta8').style.transform = `scale(${1 - .03 * press + (t > 31.3 ? .01 * Math.sin((t - 31.3) * 3) : 0)})`;
}
window.render = render; render(0);
