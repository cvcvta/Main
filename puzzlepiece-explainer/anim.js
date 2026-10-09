const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const eo = x => 1 - Math.pow(1 - x, 3);
const eb = x => { const c = 0.9; x -= 1; return 1 + (c + 1) * x * x * x + c * x * x; };
const prog = (t, s, d) => clamp((t - s) / d);
const lerp = (a, b, m) => a + (b - a) * m;
const $ = id => document.getElementById(id);
const place = (id, x, y, k = 1) => $(id).setAttribute('transform', `translate(${x} ${y}) scale(${k})`);
const armTo = (id, a, cx = 156, cy = 184) => { const el = $(id + 'arm'); if (el) el.setAttribute('transform', `rotate(${a} ${cx} ${cy})`); };
const waveA = (t, s, speed = 5.5) => t > s ? -150 + 14 * Math.sin((t - s) * speed) : lerp(0, -150, eo(prog(t, s - .5, .5)));
const COLORS = ['#e2432b', '#3aa655', '#2a6fd6', '#f5b400'];
const logo = size => [0, 1, 2, 3].map(i => `<path transform="translate(${(i % 2) * size} ${(i >> 1) * size}) scale(${size / 100}) translate(2 2) scale(.96)" d="${PIECE}" fill="${COLORS[i]}"/>`).join('');
const MOM = id => adult({ id, hairStyle: 'bun', top: '#e4d3b5', pants: '#5f6b45', hair: '#2e211b' });
const star4 = r => `<path d="M0 ${-r} Q0 0 ${r} 0 Q0 0 0 ${r} Q0 0 ${-r} 0 Q0 0 0 ${-r}Z"/>`;

// ---------- build ----------
document.querySelectorAll('[data-words]').forEach(el => {
  const [s, st] = el.dataset.words.split(',').map(Number); let i = 0;
  el.innerHTML = el.textContent.split('|').map(line => line.split(' ').map(w => `<span class="w" data-a="${(s + st * i++).toFixed(2)},.5,up">${w}</span>`).join('')).join('<br>');
});
const decos = [];
document.querySelectorAll('[data-deco]').forEach((sc, si) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', 1080); svg.setAttribute('height', 1920); svg.setAttribute('class', 'abs'); svg.style.left = 0; svg.style.top = 0;
  const spots = [[920, 120], [100, 1250], [980, 1540], [160, 420], [900, 980], [520, 1840]];
  svg.innerHTML = spots.map(([x, y], i) => `<g class="dp" data-x="${x}" data-y="${y}" data-k="${1.1 + ((i * 7 + si) % 5) * .25}" data-d="${i % 2 ? 1 : -1}"><path d="${PIECE}" transform="translate(-50 -50)" fill="none" stroke="${sc.dataset.deco}" stroke-width="3" opacity=".09"/></g>`).join('');
  sc.prepend(svg); decos.push(...svg.querySelectorAll('.dp'));
});
document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));

// 1 park meltdown
$('park1').innerHTML = parkBg(1080, 1920, 1520);
$('mom1').innerHTML = MOM('m1');
$('kid1').innerHTML = kid({ id: 'k1' });
$('cloud1').innerHTML = stormCloud();
$('burst1').innerHTML = Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return `<path d="M${Math.cos(a) * 150} ${Math.sin(a) * 150} l${Math.cos(a + .5) * 22} ${Math.sin(a + .5) * 22} l${Math.cos(a) * 30} ${Math.sin(a) * 30}" stroke="#d2462c" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; }).join('');
$('bub1').innerHTML = `<rect x="0" y="0" width="360" height="110" rx="40" fill="#fff" stroke="#184e45" stroke-width="5"/><path d="M60 106 L48 150 L104 106" fill="#fff" stroke="#184e45" stroke-width="5" stroke-linejoin="round"/><rect x="56" y="98" width="46" height="12" fill="#fff"/>
  <circle cx="62" cy="55" r="28" fill="#f9d272" stroke="#184e45" stroke-width="5"/><path d="M62 55 V38 M62 55 L74 62" stroke="#184e45" stroke-width="5" stroke-linecap="round"/>
  <text x="110" y="70" font-family="DM Sans" font-weight="700" font-size="44" fill="#184e45">Time to go!</text>`;

// 2 scribbles over each transition card
const scribble = (x, y) => { let d = ''; for (let i = 0; i <= 60; i++) { const a = i * .55, r = 34 + 18 * Math.sin(i * 1.7); d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * r * 1.6 + i * 1.2).toFixed(1)} ${(y + Math.sin(a) * r).toFixed(1)} `; } return `<path class="scr" d="${d}" stroke="#d2462c" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; };
$('scrib2').innerHTML = [[260, 500], [740, 500], [260, 980], [740, 980]].map(([x, y]) => scribble(x, y)).join('');
const scrs = [...document.querySelectorAll('.scr')]; scrs.forEach(p => { const L = p.getTotalLength(); p.dataset.l = L; p.style.strokeDasharray = L; });

// 3 logo
$('logo3').innerHTML = [0, 1, 2, 3].map(i => `<g id="p3${i}"><path d="${PIECE}" fill="${COLORS[i]}" stroke="#e5efe9" stroke-width="4"/></g>`).join('');
$('rays3').innerHTML = Array.from({ length: 12 }, (_, i) => `<path d="M0 0 L${-40} -620 L40 -620 Z" fill="#f9d272" opacity=".35" transform="rotate(${i * 30})"/>`).join('');
$('word3').innerHTML = [...'PuzzlePiece'].map(c => `<span style="display:inline-block">${c}</span>`).join('');

// 4 story pages on a tablet
const page = (i, art, text) => `<g id="pg${i}"><rect width="664" height="404" fill="#fffdf8"/><rect x="0" y="0" width="300" height="404" fill="#e5efe9"/>${art}
  <text x="330" y="70" font-family="DM Sans" font-weight="700" font-size="22" letter-spacing="2" fill="#c98a1d">${['FIRST', 'THEN', 'NEXT'][i]}</text>
  <foreignObject x="330" y="90" width="310" height="200"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Lora;font-size:40px;line-height:1.15;color:#184e45">${text}</div></foreignObject>
  <rect x="330" y="320" width="260" height="10" rx="5" fill="#e3ebe6"/><rect x="330" y="345" width="200" height="10" rx="5" fill="#e3ebe6"/></g>`;
$('tab4').innerHTML = tabletSvg(`<g id="scr4">
  ${page(0, `<g transform="translate(20 70) scale(1.1)">${icon('park')}</g><g transform="translate(160 190) scale(.45)">${kid({ id: 'k4a' })}</g>`, 'We play at the park.')}
  ${page(1, `<g transform="translate(30 70) scale(1.0)">${icon('timer')}</g>`, 'The timer rings. Play is done.')}
  ${page(2, `<g transform="translate(140 110) scale(.6)">${icon('car')}</g><g transform="translate(30 190) scale(.45)">${kid({ id: 'k4c' })}</g>`, 'We wave goodbye and ride home.')}
</g>`);

// 5 photo -> character
$('photoLayer').innerHTML = `<g filter="url(#photoF)"><rect width="540" height="620" fill="#7d9a5c"/><rect width="540" height="160" fill="#b7c4c9"/>
  ${Array.from({ length: 40 }, (_, i) => `<path d="M${(i * 37) % 540} ${200 + (i * 53) % 420} l6 -24" stroke="#56703c" stroke-width="4"/>`).join('')}
  <g transform="translate(140 60) scale(1.3)">${kid({ id: 'kP' })}</g></g>`;
$('illLayer').innerHTML = `<rect width="540" height="620" fill="#e5efe9"/><circle cx="270" cy="330" r="230" fill="#cfe5da"/><g transform="translate(140 60) scale(1.3)">${kid({ id: 'kI' })}</g>`;
const sparks = [[230, 590, 30], [860, 640, 40], [200, 1020, 24], [890, 1100, 30], [300, 1370, 28], [800, 1380, 36], [540, 550, 22], [960, 880, 22]];
$('spark5').innerHTML = sparks.map(([x, y, r], i) => `<g class="spk" data-i="${i}" data-x="${x}" data-y="${y}" fill="${i % 2 ? '#fbb015' : '#184e45'}">${star4(r)}</g>`).join('');

// 7 practice stories
$('storyA').innerHTML = parkBg(920, 900, 640) + `<g transform="translate(300 418) scale(.85)">${MOM('m7')}</g><g transform="translate(470 470) scale(.93)">${kid({ id: 'k7a' })}</g>
  <g transform="translate(700 150) scale(.8)">${icon('timer').replace(/timer(Arc|Hand)/g, 't7$1')}</g>
  <g id="bye7" transform="translate(600 350)"><rect x="0" y="0" width="260" height="84" rx="34" fill="#fff" stroke="#184e45" stroke-width="4"/><path d="M40 80 L30 112 L76 80" fill="#fff" stroke="#184e45" stroke-width="4" stroke-linejoin="round"/><rect x="36" y="74" width="40" height="10" fill="#fff"/><text x="130" y="56" text-anchor="middle" font-family="DM Sans" font-weight="700" font-size="36" fill="#184e45">Bye, slide!</text></g>`;
$('storyB').innerHTML = homeBg(920, 900) + `<g transform="translate(130 400) scale(.9)">${adult({ id: 'm7b', hairStyle: 'bun', top: '#e4d3b5', hair: '#2e211b' })}</g><g transform="translate(420 450) scale(1.0)">${kid({ id: 'k7b', backpack: true })}</g>`;

// 8 together on the couch
$('room8').innerHTML = `<rect y="1700" width="1080" height="220" fill="#d9bf98"/>
  <rect x="700" y="420" width="290" height="330" rx="10" fill="#fff"/><rect x="714" y="434" width="262" height="302" fill="#f6b98a"/><rect x="714" y="600" width="262" height="136" fill="#e88f6a"/><circle cx="900" cy="520" r="30" fill="#ffe2a0"/>
  <circle cx="150" cy="900" r="260" fill="url(#gGlow)"/><path d="M90 820 L210 820 L236 920 L64 920 Z" fill="#ffe2a0"/><rect x="142" y="920" width="16" height="420" fill="#8a5a34"/>
  <g transform="translate(220 640) scale(1.5)">${MOM('m8')}</g>
  <g transform="translate(560 770) scale(1.5)">${kid({ id: 'k8' })}</g>
  <rect x="40" y="1250" width="1000" height="280" rx="70" fill="#5e7f4e"/>
  <rect x="40" y="1460" width="1000" height="230" rx="40" fill="#6f8e4d"/><path d="M540 1470 V1680" stroke="#5e7f4e" stroke-width="6"/>
  <rect x="0" y="1350" width="140" height="360" rx="60" fill="#557548"/><rect x="940" y="1350" width="140" height="360" rx="60" fill="#557548"/>
  <g transform="translate(400 1090) rotate(-4) scale(.36)">${tabletSvg(`<rect width="664" height="404" fill="#e5efe9"/><g transform="translate(60 40)">${logo(60)}</g><text x="200" y="110" font-family="Lora" font-size="60" fill="#184e45">Story time</text><rect x="200" y="160" width="360" height="22" rx="11" fill="#cfe5da"/><rect x="200" y="210" width="300" height="22" rx="11" fill="#cfe5da"/>`)}</g>`;
$('hearts8').innerHTML = [0, 1, 2, 3].map(i => `<path class="ht" data-i="${i}" d="M0 18 C-14 8 -9 -6 0 0 C9 -6 14 8 0 18Z" fill="${i % 2 ? '#f08c7a' : '#e2432b'}"/>`).join('');

// 9 CTA tablet
$('tab9').innerHTML = tabletSvg(`<rect width="664" height="404" fill="#e5efe9"/><circle cx="332" cy="260" r="200" fill="#cfe5da"/>
  <g transform="translate(40 36)">${logo(28)}</g><text x="112" y="80" font-family="Lora" font-size="34" fill="#184e45">PuzzlePiece</text>
  <g transform="translate(250 60) scale(.8)">${kid({ id: 'k9' })}</g>
  <rect id="off9" width="664" height="404" fill="#0c0c0c"/>`);
$('logo9').innerHTML = logo(100);

const anims = [...document.querySelectorAll('[data-a]')];
const scenes = [...document.querySelectorAll('.scene')];
const WIPES = [[4.6, '#faf8f3'], [7.2, '#e5efe9'], [9.4, '#faf8f3'], [14.4, '#e5efe9'], [17.2, '#184e45'], [19.6, '#faf8f3'], [25.4, '#f3e3cc'], [28.6, '#184e45']];
$('wipeP').setAttribute('d', PIECE);

// ---------- render ----------
// The timeline is authored on a 32 s grid and played back stretched to 50 s.
const STRETCH = 50 / 32;
function render(t) {
  t = t / STRETCH;
  scenes.forEach(sc => sc.style.display = (t >= +sc.dataset.s && t < +sc.dataset.e) ? 'block' : 'none');
  anims.forEach(el => {
    const [s, d, k] = el.dataset.a.split(','); const p = prog(t, +s, +d * 1.9), e = eo(p);
    const rot = el.dataset.rot ? ` rotate(${el.dataset.rot}deg)` : '';
    let tr = '';
    if (k === 'up') tr = `translateY(${(1 - e) * 50}px)`;
    if (k === 'pop') tr = `scale(${0.6 + 0.4 * eb(p)})`;
    if (k === 'flip') tr = `perspective(1400px) rotateY(${(1 - e) * -100}deg)`;
    if (k === 'spin') tr = `rotate(${(1 - e) * -200}deg) scale(${0.3 + 0.7 * eb(p)})`;
    el.style.opacity = k === 'flip' ? (p > 0 ? 1 : 0) : e;
    el.style.transform = tr + rot;
  });
  decos.forEach((g, i) => g.setAttribute('transform', `translate(${g.dataset.x} ${+g.dataset.y + Math.sin(t * .9 + i) * 24}) rotate(${t * 5 * g.dataset.d + i * 40}) scale(${g.dataset.k})`));
  const wp = $('wipeP'); wp.style.display = 'none';
  for (const [T, col] of WIPES) if (t >= T - .65 && t < T) {
    const p = prog(t, T - .65, .65);
    wp.style.display = 'block'; wp.setAttribute('fill', col); wp.setAttribute('stroke', '#f9d272');
    wp.setAttribute('transform', `translate(540 960) rotate(${90 * p}) scale(${.1 + 46 * p * p}) translate(-50 -50)`);
  }

  // 1 — happy play, "time to go", meltdown
  const melt = t >= 2.2;
  const bob = melt ? 0 : -Math.abs(Math.sin(t * 3.2)) * 22;
  place('kid1', 470, 1201 + bob, 1.45); place('mom1', 50, 1134, 1.3);
  armTo('k1', melt ? 16 * Math.sin(t * 7) : -120 + 30 * Math.sin(t * 3.5));
  armTo('m1', t > 1.0 ? lerp(0, -40, eo(prog(t, 1.0, .6))) : 0, 188, 196);
  $('k1happy').setAttribute('opacity', melt ? 0 : 1); $('k1sad').setAttribute('opacity', melt ? 1 : 0);
  ['k1tear1', 'k1tear2'].forEach((id, i) => { const p = ((t - 2.3 + i * .35) % .8) / .8; $(id).setAttribute('transform', `translate(0 ${t > 2.3 ? p * 40 : 0})`); $(id).style.opacity = t > 2.3 ? 1 - p : 0; });
  const bp = eb(prog(t, .9, .7)); $('bub1').setAttribute('transform', `translate(120 980) scale(${bp})`); $('bub1').style.opacity = 1 - prog(t, 2.5, .5);
  const cp = eb(prog(t, 2.25, .8)); $('cloud1').setAttribute('transform', `translate(${490 + Math.sin(t * 1.5) * 10} ${960 + (1 - cp) * 60}) scale(${1.1 * cp})`);
  $('cloud1').style.opacity = cp > 0 ? 1 : 0;
  const bu = prog(t, 2.4, .6); $('burst1').setAttribute('transform', `translate(615 1355) scale(${bu * (1 + .08 * Math.sin(t * 5))})`); $('burst1').style.opacity = bu;
  $('dim1').style.opacity = .22 * prog(t, 2.3, .4);
  const sh = t > 2.4 && t < 4.0 ? 5 : 0; $('shake1').style.transform = `translate(${Math.sin(t * 17) * sh}px, ${Math.cos(t * 13) * sh}px)`;

  // 2 — every transition gets tangled
  [0, 1, 2, 3].forEach(i => { const st = 5.95 + i * .1; $('tc' + i).style.rotate = t > st ? `${Math.sin((t - st) * 8) * 2.5 * (1 - prog(t, st + .8, .4))}deg` : '0deg'; });
  scrs.forEach((p, i) => { p.style.strokeDashoffset = p.dataset.l * (1 - eo(prog(t, 5.5 + i * .15, .9))); });

  // 3 — logo assembles, sun rays turn
  const starts = [[-320, -340, -200], [1300, -300, 220], [-340, 2100, 160], [1320, 2150, -240]];
  for (let i = 0; i < 4; i++) {
    const p = eb(prog(t, 7.25 + i * .08, .85)), [sx, sy, sr] = starts[i], fx = 390 + (i % 2) * 150, fy = 560 + (i >> 1) * 150;
    const snap = 1 + .08 * Math.sin(Math.PI * prog(t, 8.1, .4));
    $('p3' + i).setAttribute('transform', `translate(${lerp(sx, fx, p)} ${lerp(sy, fy, p)}) rotate(${lerp(sr, 0, clamp(p))} 75 75) scale(${1.5 * snap})`);
  }
  $('rays3').setAttribute('transform', `translate(540 710) rotate(${t * 7}) scale(${eo(prog(t, 7.9, .8))})`);
  [...$('word3').children].forEach((c, i) => { const p = eo(prog(t, 7.95 + i * .03, .5)); c.style.opacity = p; c.style.transform = `translateY(${(1 - p) * 40}px)`; });

  // 4 — pages flip First / Then / Next
  const flips = [11.2, 12.5]; let sx = 1;
  flips.forEach(T => { const d = prog(t, T - .3, .6); if (d > 0 && d < 1) sx = Math.abs(1 - 2 * d); });
  $('scr4').setAttribute('transform', `translate(332 0) scale(${Math.max(sx, .02)} 1) translate(-332 0)`);
  const pgi = t < 11.2 ? 0 : t < 12.5 ? 1 : 2;
  [0, 1, 2].forEach(i => { $('pg' + i).style.display = i === pgi ? 'inline' : 'none'; const st = $('st' + i); st.style.background = i === pgi && t > 9.9 ? '#fbb015' : '#fff'; st.style.transform = `scale(${i === pgi && t > 9.9 ? 1.08 : 1})`; });
  $('timerArc').style.strokeDasharray = 377; $('timerArc').style.strokeDashoffset = 377 * prog(t, 11.3, 1.1);
  $('timerHand').setAttribute('transform', `rotate(${prog(t, 11.3, 1.1) * 360} 120 110)`);
  armTo('k4c', waveA(t, 12.7));

  // 5 — scan photo into character
  const sp = prog(t, 14.85, 1.15);
  $('scanRect').setAttribute('height', sp * 620); $('scanLine').setAttribute('y', sp * 620 - 5); $('scanLine').setAttribute('opacity', sp > 0 && sp < 1 ? .95 : 0);
  $('capPhoto').style.opacity = 1 - prog(t, 15.8, .4); $('capChar').style.opacity = prog(t, 15.9, .45);
  armTo('kI', waveA(t, 16.0));
  document.querySelectorAll('.spk').forEach(g => { const p = prog(t, 15.9 + g.dataset.i * .08, 1.1); g.setAttribute('transform', `translate(${g.dataset.x} ${g.dataset.y}) rotate(${p * 90}) scale(${Math.sin(Math.PI * p)})`); });

  // 6 — the website's four styles settle in and float gently
  $('ring6').style.opacity = 0;
  [0, 1, 2, 3].forEach(i => { if (t > 18.3) $('ti' + i).style.transform = `translateY(${Math.sin((t - 18.3) * 2.2 + i * 1.3) * 8}px)`; });
  // 7 — two practice stories
  const sw = eo(prog(t, 21.95, .8));
  $('storyB').style.transform = `translateX(${(1 - sw) * 940}px)`;
  $('tA').style.display = sw < .5 ? 'inline' : 'none'; $('tB').style.display = sw >= .5 ? 'inline' : 'none';
  $('listA').style.opacity = 1 - prog(t, 21.9, .5); $('listB').style.display = t > 22.3 ? 'block' : 'none';
  armTo('k7a', waveA(t, 21.2)); armTo('k7b', waveA(t, 24.2));
  armTo('m7b', t > 23.0 ? -150 + 15 * Math.sin((t - 23) * 5) : 0, 188, 196);
  $('t7Arc').style.strokeDasharray = 377; $('t7Arc').style.strokeDashoffset = 377 * prog(t, 20.2, 1.4);
  $('t7Hand').setAttribute('transform', `rotate(${prog(t, 20.2, 1.4) * 360} 120 110)`);
  const by = eb(prog(t, 21.1, .6)); $('bye7').setAttribute('transform', `translate(600 350) scale(${by})`);

  // 8 — reading together, hearts rise
  armTo('k8', 0);
  document.querySelectorAll('.ht').forEach(h => {
    const i = +h.dataset.i, p = prog(t, 26.0 + i * .5, 2.4);
    h.setAttribute('transform', `translate(${530 + Math.sin(p * 6 + i) * 40 + (i - 1.5) * 50} ${1080 - p * 420}) scale(${2.2 * Math.sin(Math.PI * Math.min(p * 1.4, 1)) })`);
    h.style.opacity = p > 0 && p < 1 ? 1 - p * .6 : 0;
  });

  // 9 — tablet drops, screen wakes, tap the CTA
  const d = prog(t, 28.7, 1.1);
  $('tab9').style.transform = `translateY(${-1000 * (1 - eb(d))}px) rotate(${(1 - eo(d)) * -10}deg)`;
  $('off9').setAttribute('opacity', 1 - prog(t, 29.6, .6));
  armTo('k9', waveA(t, 29.6));
  const tp = eo(prog(t, 30.3, .6)), press = Math.sin(Math.PI * prog(t, 30.95, .4));
  const tap = $('tap9'); tap.style.opacity = tp * (1 - .4 * prog(t, 31.5, .4));
  tap.style.transform = `translate(${(1 - tp) * 140}px, ${(1 - tp) * 260}px) scale(${1 - .25 * press})`;
  $('cta9').style.transform = `scale(${1 - .04 * press + (t > 31.35 ? .015 * Math.sin((t - 31.35) * 4) : 0)})`;
  const rp = prog(t, 31.0, .9), rip = $('rip9'); rip.style.opacity = rp > 0 ? .55 * (1 - rp) : 0; rip.style.transform = `translate(-50%,-50%) scale(${rp * 180})`;
}
window.render = render; render(0);
