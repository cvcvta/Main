// Original vector art for the PuzzlePiece explainer. All shapes drawn here.
const PIECE = "M0 0 H35 C35 -14 65 -14 65 0 H100 V35 C114 35 114 65 100 65 V100 H65 C65 86 35 86 35 100 H0 V65 C14 65 14 35 0 35 Z";

// Child figure in a 200x420 box. Right arm group `${id}arm` pivots at (156,184).
function kid(o = {}) {
  const s = o.skin || '#f3c29b', h = o.hair || '#d9a449', hd = o.hairDark || '#b98530';
  const g = o.top || '#6f8e4d', gd = o.topDark || '#4d6a35', gl = o.topLight || '#94ad6b';
  const sh = o.shorts || '#dcd5c6', sho = o.shoe || '#bdb5a5';
  const L = o.line ? `stroke="${o.line}" stroke-width="4" stroke-linejoin="round"` : '';
  const id = o.id || 'k' + Math.random().toString(36).slice(2, 7);
  const camo = o.camo === false ? '' : `
    <ellipse cx="78" cy="212" rx="17" ry="10" fill="${gd}" transform="rotate(-20 78 212)"/>
    <ellipse cx="124" cy="198" rx="14" ry="8" fill="${gl}" transform="rotate(15 124 198)"/>
    <ellipse cx="110" cy="244" rx="18" ry="9" fill="${gd}" transform="rotate(10 110 244)"/>
    <ellipse cx="70" cy="270" rx="12" ry="8" fill="${gl}"/>
    <ellipse cx="136" cy="280" rx="12" ry="7" fill="${gd}"/>`;
  const eyes = o.eyes === 'bulge'
    ? `<circle cx="80" cy="104" r="18" fill="#fff" ${L}/><circle cx="120" cy="104" r="18" fill="#fff" ${L}/><circle cx="84" cy="106" r="4.5" fill="#222"/><circle cx="116" cy="106" r="4.5" fill="#222"/>`
    : `<ellipse cx="80" cy="108" rx="9" ry="11" fill="#3b2a20"/><ellipse cx="120" cy="108" rx="9" ry="11" fill="#3b2a20"/><circle cx="83" cy="103" r="3.5" fill="#fff"/><circle cx="123" cy="103" r="3.5" fill="#fff"/>`;
  let hairBack = '', hairFront = '';
  if (o.hairStyle === 'long') {
    hairBack = `<path d="M40 110 Q36 40 100 40 Q164 40 160 110 L168 205 Q140 214 134 176 L66 176 Q60 214 32 205 Z" fill="${h}" ${L}/>`;
    hairFront = `<path d="M42 104 Q46 42 100 42 Q154 42 158 104 Q142 68 100 70 Q58 68 42 104 Z" fill="${h}" ${L}/>`;
  } else {
    const curls = [[58,72,22],[78,52,24],[104,44,26],[130,52,24],[148,72,21],[46,96,14],[154,96,13],[66,58,14],[140,60,14]];
    hairFront = curls.map(([x,y,r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${h}" ${L}/>`).join('') +
      curls.map(([x,y,r]) => `<path d="M${x-r*.5} ${y+r*.15} q${r*.5} ${-r*.6} ${r} 0" stroke="${hd}" stroke-width="4" fill="none" stroke-linecap="round"/>`).join('');
  }
  const pack = o.backpack ? `<rect x="36" y="182" width="128" height="112" rx="22" fill="#2f4f7f"/>` : '';
  const straps = o.backpack ? `<path d="M68 178 L72 292 M132 178 L128 292" stroke="#2f4f7f" stroke-width="11" stroke-linecap="round"/>` : '';
  const shade = o.shade ? `<circle cx="100" cy="106" r="58" fill="url(#gHead)"/><path d="M50 176 Q100 150 150 176 L154 300 Q100 314 46 300 Z" fill="url(#gBody)"/>` : '';
  return `<g>
    <ellipse cx="100" cy="412" rx="70" ry="9" fill="rgba(0,0,0,.10)"/>
    <rect x="74" y="326" width="22" height="74" rx="10" fill="${s}" ${L}/>
    <rect x="104" y="326" width="22" height="74" rx="10" fill="${s}" ${L}/>
    <ellipse cx="82" cy="404" rx="24" ry="12" fill="${sho}" ${L}/>
    <ellipse cx="118" cy="404" rx="24" ry="12" fill="${sho}" ${L}/>
    <path d="M58 288 H142 L146 344 H104 L100 322 L96 344 H54 Z" fill="${sh}" ${L}/>
    ${pack}
    <g><rect x="28" y="176" width="32" height="104" rx="16" fill="${g}" ${L}/><circle cx="44" cy="288" r="14" fill="${s}" ${L}/></g>
    <path d="M50 176 Q100 150 150 176 L154 300 Q100 314 46 300 Z" fill="${g}" ${L}/>
    ${camo}
    <path d="M72 262 Q100 272 128 262" stroke="${gd}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M66 172 Q100 200 134 172" stroke="${gd}" stroke-width="10" fill="none" stroke-linecap="round"/>
    ${straps}
    ${shade}
    <g id="${id}arm"><rect x="140" y="176" width="32" height="104" rx="16" fill="${g}" ${L}/><circle cx="156" cy="288" r="14" fill="${s}" ${L}/></g>
    ${hairBack}
    <circle cx="44" cy="112" r="12" fill="${s}" ${L}/><circle cx="156" cy="112" r="12" fill="${s}" ${L}/>
    <circle cx="100" cy="106" r="58" fill="${s}" ${L}/>
    ${o.shade ? '<circle cx="100" cy="106" r="58" fill="url(#gHead)"/>' : ''}
    ${hairFront}
    <circle cx="66" cy="130" r="9" fill="#f08c7a" opacity=".45"/><circle cx="134" cy="130" r="9" fill="#f08c7a" opacity=".45"/>
    ${eyes}
    <path d="M86 136 Q100 150 114 136" stroke="#8a4636" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>`;
}

// Blocky pixel version, same 200x420 box.
function pixelKid() {
  const map = ["..HHHHHH..",".HHHHHHHH.",".HHSSSSHH.",".HSSSSSSH.",".SSESSESS.",".SSSSSSSS.","..SSMMSS..","...SSSS...",
    ".GGGDGGGG.","GGDGGGGDGG","GDGGGDGGGG","GGGGDGGGDG","GG.GDGG.GG","SS.GGGG.SS","...GDGG...","..PPPPPP..",
    "..PP..PP..","..SS..SS..","..SS..SS..",".WWW..WWW."];
  const c = {H:'#d9a449',S:'#f0bd92',E:'#3b2a20',M:'#a0503e',G:'#6f8e4d',D:'#4d6a35',P:'#d6cfbf',W:'#9e978a'};
  let out = '<g>';
  map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return;
    out += `<rect x="${x*20}" y="${y*20+10}" width="20" height="20" fill="${c[ch]}"/><rect x="${x*20}" y="${y*20+10}" width="20" height="4" fill="rgba(255,255,255,.18)"/>`;
  }));
  return out + '</g>';
}

// Toy-brick version.
function brickKid() {
  const y = '#f5c518', g = '#6f8e4d', gd = '#4d6a35';
  return `<g>
    <ellipse cx="100" cy="412" rx="70" ry="9" fill="rgba(0,0,0,.10)"/>
    <rect x="58" y="300" width="40" height="104" rx="4" fill="#d6cfbf"/><rect x="102" y="300" width="40" height="104" rx="4" fill="#d6cfbf"/>
    <rect x="54" y="286" width="92" height="22" rx="3" fill="#c6bfaf"/>
    <path d="M28 182 L52 176 L60 262 L34 266 Z" fill="${g}"/><path d="M26 268 a16 16 0 1 0 32 0" stroke="${y}" stroke-width="11" fill="none"/>
    <path d="M172 182 L148 176 L140 262 L166 266 Z" fill="${g}"/><path d="M142 268 a16 16 0 1 0 32 0" stroke="${y}" stroke-width="11" fill="none"/>
    <path d="M64 172 H136 L150 290 H50 Z" fill="${g}"/>
    <rect x="72" y="200" width="22" height="12" fill="${gd}"/><rect x="108" y="236" width="26" height="12" fill="${gd}"/><rect x="70" y="256" width="18" height="10" fill="${gd}"/>
    <rect x="86" y="154" width="28" height="20" fill="${y}"/>
    <rect x="84" y="50" width="32" height="18" rx="4" fill="${y}"/>
    <rect x="58" y="64" width="84" height="96" rx="24" fill="${y}"/>
    <path d="M52 108 Q50 40 100 40 Q150 40 148 108 L140 94 Q124 68 100 72 Q76 68 60 94 Z" fill="#e0a93a"/>
    <circle cx="84" cy="112" r="6" fill="#222"/><circle cx="116" cy="112" r="6" fill="#222"/>
    <path d="M84 130 Q100 144 116 130" stroke="#222" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>`;
}

// Adult figure in a 240x520 box. Right arm `${id}arm` pivots at (188,196).
function adult(o = {}) {
  const s = o.skin || '#eab98f', t = o.top || '#d9c7a4', p = o.pants || '#5f6b45', h = o.hair || '#3a2a22';
  const id = o.id || 'a' + Math.random().toString(36).slice(2, 7);
  let hair = '';
  if (o.hairStyle === 'bun') hair = `<circle cx="120" cy="36" r="24" fill="${h}"/><path d="M70 112 Q60 38 120 38 Q180 38 170 112 Q166 70 120 64 Q76 68 70 112 Z" fill="${h}"/>`;
  else hair = `<path d="M72 98 Q70 42 120 40 Q170 42 168 98 Q158 62 120 60 Q86 62 72 98 Z" fill="${h}"/>` +
    [[84,56,17],[106,44,19],[132,44,19],[154,58,16]].map(([x,y,r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${h}"/>`).join('');
  const front = o.hairStyle === 'bun'
    ? `<path d="M104 176 L120 236 L136 176 Z" fill="#f4eee3"/>`
    : `<path d="M100 174 Q120 192 140 174" stroke="${o.topDark || '#3f5a3a'}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
  return `<g>
    <ellipse cx="120" cy="508" rx="80" ry="10" fill="rgba(0,0,0,.10)"/>
    <rect x="86" y="330" width="30" height="168" rx="14" fill="${p}"/><rect x="124" y="330" width="30" height="168" rx="14" fill="${p}"/>
    <ellipse cx="98" cy="500" rx="26" ry="12" fill="#5a4a3e"/><ellipse cx="142" cy="500" rx="26" ry="12" fill="#5a4a3e"/>
    <g><rect x="36" y="188" width="32" height="140" rx="16" fill="${t}"/><circle cx="52" cy="334" r="15" fill="${s}"/></g>
    <path d="M62 182 Q120 150 178 182 L186 345 H54 Z" fill="${t}"/>
    ${front}
    <g id="${id}arm"><rect x="172" y="188" width="32" height="140" rx="16" fill="${t}"/><circle cx="188" cy="334" r="15" fill="${s}"/></g>
    <rect x="106" y="136" width="28" height="42" fill="${s}"/>
    <ellipse cx="120" cy="100" rx="48" ry="54" fill="${s}"/>
    ${hair}
    <circle cx="94" cy="122" r="8" fill="#f08c7a" opacity=".35"/><circle cx="146" cy="122" r="8" fill="#f08c7a" opacity=".35"/>
    <ellipse cx="102" cy="104" rx="6.5" ry="8" fill="#3b2a20"/><ellipse cx="138" cy="104" rx="6.5" ry="8" fill="#3b2a20"/>
    <circle cx="104" cy="101" r="2.5" fill="#fff"/><circle cx="140" cy="101" r="2.5" fill="#fff"/>
    <path d="M106 128 Q120 140 134 128" stroke="#8a4636" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>`;
}

function schoolBg() {
  return `<rect width="700" height="700" fill="#f7e8cf"/><rect y="520" width="700" height="180" fill="#dcb98c"/>
  <rect x="190" y="580" width="330" height="60" rx="10" fill="#8fc1c9" opacity=".8"/>
  <rect x="60" y="170" width="200" height="360" fill="#b98555"/><rect x="74" y="184" width="172" height="340" fill="#bfe3a4"/>
  <rect x="74" y="184" width="172" height="150" fill="#dff1f7"/><circle cx="212" cy="228" r="22" fill="#ffd66b"/>
  <circle cx="130" cy="330" r="62" fill="#7fb35f"/><rect x="124" y="360" width="12" height="80" fill="#8a6440"/>
  <path d="M246 184 L304 204 L304 544 L246 524 Z" fill="#c9945f"/><circle cx="292" cy="370" r="6" fill="#7a5530"/>
  <g transform="rotate(-4 405 165)"><rect x="360" y="130" width="90" height="70" fill="#fff"/><path d="M372 180 q15 -40 30 -10 t30 -15" stroke="#e8894a" stroke-width="5" fill="none"/></g>
  <g transform="rotate(5 520 182)"><rect x="480" y="150" width="80" height="64" fill="#fff"/><circle cx="520" cy="182" r="18" stroke="#5b8fc7" stroke-width="5" fill="none"/></g>
  <rect x="470" y="340" width="200" height="180" fill="#caa072"/>
  ${[[480,350,'#7fb069'],[545,350,'#5b8fc7'],[610,350,'#e8894a'],[480,435,'#e8c24a'],[545,435,'#7fb069'],[610,435,'#5b8fc7']].map(([x,y,c])=>`<rect x="${x}" y="${y}" width="55" height="75" fill="#b48a5e"/><rect x="${x+5}" y="${y+35}" width="45" height="36" rx="4" fill="${c}"/>`).join('')}
  <rect x="470" y="250" width="200" height="8" fill="#9b7550"/><path d="M600 258 q-26 0 -26 34 v36 h52 v-36 q0 -34 -26 -34z" fill="#e8b93a"/>`;
}
function doctorBg() {
  return `<rect width="700" height="700" fill="#e6f1f2"/><rect y="540" width="700" height="160" fill="#cfe0e2"/>
  <rect x="50" y="140" width="190" height="210" fill="#fff"/><rect x="62" y="152" width="166" height="186" fill="#cdeaf6"/><circle cx="110" cy="230" r="40" fill="#9fd08a"/>
  <circle cx="330" cy="160" r="54" fill="#3f9b82"/><rect x="318" y="128" width="24" height="64" rx="4" fill="#fff"/><rect x="298" y="148" width="64" height="24" rx="4" fill="#fff"/>
  <rect x="450" y="110" width="160" height="200" rx="6" fill="#fff"/><rect x="462" y="122" width="136" height="176" fill="#fdf1d6"/>
  <rect x="520" y="170" width="18" height="110" fill="#f0b43c"/><ellipse cx="548" cy="166" rx="30" ry="18" fill="#f0b43c"/><circle cx="556" cy="162" r="4" fill="#333"/>
  <circle cx="528" cy="200" r="5" fill="#b87a2a"/><circle cx="530" cy="240" r="5" fill="#b87a2a"/>
  <rect x="400" y="440" width="290" height="44" rx="12" fill="#3f8f9f"/><rect x="410" y="430" width="270" height="16" rx="6" fill="#f5f5f0"/>
  <rect x="420" y="484" width="14" height="80" fill="#8aa"/><rect x="660" y="484" width="14" height="80" fill="#8aa"/>
  <path d="M250 400 q0 60 40 60 q40 0 40 -60" stroke="#445" stroke-width="7" fill="none"/><circle cx="290" cy="476" r="16" fill="#9aa4b0" stroke="#445" stroke-width="5"/>
  <rect x="580" y="360" width="50" height="60" rx="6" fill="#c97b4a"/><circle cx="605" cy="340" r="32" fill="#6fa85a"/>`;
}
function bedBg() {
  const stars = [[100,120],[200,80],[300,150],[640,70],[250,260],[60,300]];
  return `<rect width="700" height="700" fill="#26406e"/><rect y="560" width="700" height="140" fill="#1d3257"/>
  <circle cx="150" cy="330" r="160" fill="url(#gGlow)"/>
  <rect x="380" y="90" width="260" height="270" fill="#35558c"/><rect x="410" y="110" width="200" height="220" fill="#0f1f40"/>
  <circle cx="530" cy="190" r="38" fill="#fff3c4"/><circle cx="548" cy="178" r="34" fill="#0f1f40"/>
  ${stars.map(([x,y],i)=>`<circle class="twinkle" data-i="${i}" cx="${x}" cy="${y}" r="5" fill="#fff3c4"/>`).join('')}
  <rect x="40" y="400" width="60" height="200" rx="20" fill="#8a5a34"/>
  <rect x="40" y="480" width="620" height="90" rx="22" fill="#eef2fb"/><ellipse cx="160" cy="470" rx="70" ry="30" fill="#dfe6f6"/>
  <rect x="300" y="460" width="360" height="130" rx="34" fill="#4a6fb5"/>
  <path d="M120 300 L180 300 L196 360 L104 360 Z" fill="#ffe2a0"/><rect x="144" y="360" width="12" height="60" fill="#8a5a34"/>`;
}

function tabletSvg(inner) {
  const corner = (tf) => `<path transform="${tf}" d="M-6 150 V64 Q-6 -6 64 -6 H150" stroke="#1b1b1b" stroke-width="40" fill="none" stroke-linecap="round"/>`;
  return `<rect x="0" y="0" width="800" height="540" rx="60" fill="#2338d4"/>
  <rect x="10" y="10" width="780" height="520" rx="54" fill="none" stroke="#4459f0" stroke-width="6"/>
  ${corner('')}${corner('translate(800 0) scale(-1 1)')}${corner('translate(0 540) scale(1 -1)')}${corner('translate(800 540) scale(-1 -1)')}
  <rect x="46" y="46" width="708" height="448" rx="26" fill="#151515"/>
  <circle cx="400" cy="30" r="6" fill="#111"/>
  <svg x="68" y="68" width="664" height="404" viewBox="0 0 664 404">${inner}</svg>`;
}
