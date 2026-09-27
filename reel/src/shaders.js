// Procedural imagery: a small raymarcher for "architectural photography", marble,
// abstract tiles, and dithering/duotone passes. All output is baked once.
import { GLSL_COMMON } from './gl.js';

const HEAD = `#version 300 es
${GLSL_COMMON}
out vec4 o;
uniform vec2 uRes;
`;

// ------------------------------------------------------------------ raymarcher
export const ARCH_FS = HEAD + `
uniform int uScene;
uniform float uSS;      // supersampling grid size (1 or 2)
uniform vec3 uSun;      // sun direction (normalized)
uniform float uColor;   // 1 = full-color 'summer' grade

float sdBox(vec3 p, vec3 b){ vec3 q=abs(p)-b; return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.); }
float sdCylY(vec3 p, float r, float h){ vec2 d=abs(vec2(length(p.xz),p.y))-vec2(r,h); return min(max(d.x,d.y),0.)+length(max(d,0.)); }
float sdCylZ(vec3 p, float r, float h){ vec2 d=abs(vec2(length(p.xy),p.z))-vec2(r,h); return min(max(d.x,d.y),0.)+length(max(d,0.)); }
float opEx(float d2, float z, float h){ vec2 w=vec2(d2, abs(z)-h); return min(max(w.x,w.y),0.)+length(max(w,0.)); }
// 2D arc with flat caps (iq). aperture centered on +y, n = (sin, cos) of half-aperture.
float sdArc2(vec2 p, vec2 n, float r, float th){
  p.x = abs(p.x);
  p = mat2(n.x,n.y,-n.y,n.x)*p;
  return max(abs(length(p)-r)-th*.5, length(vec2(p.x, max(0., abs(r-p.y)-th*.5)))*sign(p.x));
}
float sdTri2(vec2 p, vec2 a, vec2 b, vec2 c){
  vec2 e0=b-a, e1=c-b, e2=a-c, v0=p-a, v1=p-b, v2=p-c;
  vec2 pq0=v0-e0*clamp(dot(v0,e0)/dot(e0,e0),0.,1.);
  vec2 pq1=v1-e1*clamp(dot(v1,e1)/dot(e1,e1),0.,1.);
  vec2 pq2=v2-e2*clamp(dot(v2,e2)/dot(e2,e2),0.,1.);
  float s=sign(e0.x*e2.y-e0.y*e2.x);
  vec2 d=min(min(vec2(dot(pq0,pq0), s*(v0.x*e0.y-v0.y*e0.x)), vec2(dot(pq1,pq1), s*(v1.x*e1.y-v1.y*e1.x))), vec2(dot(pq2,pq2), s*(v2.x*e2.y-v2.y*e2.x)));
  return -sqrt(d.x)*sign(d.y);
}
// chevron = union of two triangles (tip, back-top, notch) + (tip, notch, back-bottom)
float sdChev2(vec2 p){
  vec2 T=vec2(.84,0.), B1=vec2(.1,.52), N=vec2(.42,0.), B2=vec2(.1,-.52);
  return min(sdTri2(p,T,B1,N), sdTri2(p,T,N,B2));
}

// material id in .y
vec2 mapArches(vec3 p){
  float ground = p.y;
  vec3 q = p - vec3(0., 0., 0.);
  float bld = sdBox(q - vec3(0., 4.6, 0.), vec3(7.2, 4.6, 3.));
  // loggia openings on the front face (z = +3)
  float sx = 1.55, sy = 2.1;
  float cx = clamp(floor(q.x/sx + .5), -4., 4.);
  float qx = q.x - cx*sx;
  float row = clamp(floor((q.y - 1.35)/sy + .5), 0., 3.);
  float qy = q.y - (1.35 + row*sy);
  float qz = q.z - 3.;
  float open = min(sdBox(vec3(qx, qy+.05, qz), vec3(.5, .62, .9)), sdCylZ(vec3(qx, qy-.57, qz), .5, .9));
  bld = max(bld, -open);
  // cornice lines
  float corn = sdBox(q - vec3(0., 9.25, 0.), vec3(7.35, .08, 3.12));
  bld = min(bld, corn);
  float plinth = sdBox(q - vec3(0., .12, 0.), vec3(7.5, .12, 3.3));
  float d = min(bld, plinth);
  return d < ground ? vec2(d, 1.) : vec2(ground, 0.);
}
vec2 mapColonnade(vec3 p){
  float ground = p.y;
  vec3 q = p;
  float cz = floor(q.z/2.2 + .5);
  vec3 r = vec3(abs(q.x) - 2.4, q.y, q.z - cz*2.2);
  float col = sdCylY(r - vec3(0., 1.9, 0.), .32 - .02*r.y, 1.9);
  col = min(col, sdBox(r - vec3(0., .12, 0.), vec3(.46, .12, .46)));
  col = min(col, sdBox(r - vec3(0., 3.86, 0.), vec3(.46, .1, .46)));
  float beam = sdBox(vec3(abs(q.x) - 2.4, q.y - 4.25, q.z), vec3(.55, .3, 60.));
  float roof = sdBox(vec3(q.x, q.y - 4.7, q.z), vec3(3.2, .16, 60.));
  // slatted roof: cut slots
  float slot = sdBox(vec3(q.x, q.y - 4.7, mod(q.z, 1.1) - .55), vec3(2.3, .3, .32));
  roof = max(roof, -slot);
  float d = min(min(col, beam), roof);
  return d < ground ? vec2(d, 1.) : vec2(ground, 0.);
}
vec2 mapPlinth(vec3 p){
  float ground = p.y;
  float wall = p.z + 3.;               // back wall: solid for z < -3
  // arched niche in the wall
  float niche = min(sdBox(p - vec3(0., 2.2, -3.), vec3(1.6, 2.2, .8)), sdCylZ(p - vec3(0., 4.4, -3.), 1.6, .8));
  wall = max(wall, -niche);
  float st = sdBox(p - vec3(0., .2, -.6), vec3(1.8, .2, 1.2));
  st = min(st, sdBox(p - vec3(0., .6, -.8), vec3(1.3, .2, .9)));
  st = min(st, sdBox(p - vec3(0., 1., -1.), vec3(.8, .2, .6)));
  float sph = length(p - vec3(0., 1.95, -1.)) - .75;
  float d = min(min(wall, st), sph);
  float m = sph < min(wall, st) ? 2. : 1.;
  return d < ground ? vec2(d, m) : vec2(ground, 0.);
}
vec2 mapStairs(vec3 p){
  float ground = p.y;
  // staircase rising in -z
  float stepH = .22, stepD = .42;
  float k = clamp(floor(-p.z/stepD), 0., 11.);
  float stairs = 1e9;
  for (int i=0;i<2;i++){ float kk = clamp(k + float(i), 0., 11.);
    stairs = min(stairs, sdBox(p - vec3(0., stepH*(kk+1.)*.5, -stepD*(kk+.5)), vec3(2.6, stepH*(kk+1.)*.5, stepD*.5))); }
  float top = sdBox(p - vec3(0., stepH*6., -stepD*12. - 3.), vec3(6., stepH*6., 3.));
  // wall with a tall arch at the top
  float wall = sdBox(p - vec3(0., stepH*12. + 3.5, -stepD*12. - 1.2), vec3(8., 3.5, .5));
  float arch = min(sdBox(p - vec3(0., stepH*12. + 1.6, -stepD*12. - 1.2), vec3(1.3, 1.6, .8)), sdCylZ(p - vec3(0., stepH*12. + 3.2, -stepD*12. - 1.2), 1.3, .8));
  wall = max(wall, -arch);
  float side = sdBox(vec3(abs(p.x) - 3.1, p.y - 1.4, p.z + 2.5), vec3(.5, 1.4, 3.));
  float d = min(min(min(stairs, top), wall), side);
  return d < ground ? vec2(d, 1.) : vec2(ground, 0.);
}
vec2 mapMonolith(vec3 p){
  float ground = p.y - .08*fbm(p.xz*.35);
  // upright chevron slab, scaled
  vec3 q = p - vec3(0., 0., 0.);
  // chevron standing on its two back corners, tip up: a monumental Lambda
  float s = 4.;
  float c2 = sdChev2(vec2(q.y/s + .1, q.x/s))*s;
  float chev = opEx(c2, q.z, .35);
  return chev < ground ? vec2(chev, 1.) : vec2(ground, 0.);
}
vec2 mapRing(vec3 p){
  float ground = p.y;
  vec3 q = p - vec3(0., 2.35, 0.);
  // ring with gap facing +x: rotate so aperture (+y in sdArc2) points to +x
  // sdArc2's arc is centered on +y with the gap on -y; map our +x (gap) onto -y
  float th = radians(180. - 52.);
  float ring = sdArc2(vec2(q.y, -q.x), vec2(cos(th), sin(th)), 1.64, .72);
  float r3 = opEx(ring, q.z, .32);
  float ch = opEx(sdChev2(q.xy/2.0)*2.0, q.z, .32);
  float base = sdBox(p - vec3(0., .09, 0.), vec3(3.2, .09, 1.4));
  float d = min(min(r3, ch), base);
  float m = ch < min(r3, base) ? 2. : 1.;
  return d < ground ? vec2(d, m) : vec2(ground, 0.);
}
vec2 map(vec3 p){
  if (uScene == 0) return mapArches(p);
  if (uScene == 1) return mapColonnade(p);
  if (uScene == 2) return mapPlinth(p);
  if (uScene == 3) return mapStairs(p);
  if (uScene == 4) return mapMonolith(p);
  return mapRing(p);
}
vec3 nrm(vec3 p){ vec2 e=vec2(.0015,0.); return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x, map(p+e.yxy).x-map(p-e.yxy).x, map(p+e.yyx).x-map(p-e.yyx).x)); }
float shadow(vec3 ro, vec3 rd){
  float res=1., t=.02;
  for(int i=0;i<64;i++){ float h=map(ro+rd*t).x; res=min(res, 10.*h/t); t+=clamp(h,.02,.5); if(res<.001||t>40.) break; }
  return clamp(res,0.,1.);
}
float ao(vec3 p, vec3 n){ float s=0., w=1.; for(int i=1;i<=5;i++){ float h=.06*float(i); s+=(h-map(p+n*h).x)*w; w*=.7; } return clamp(1.-2.2*s,0.,1.); }

void camFor(int sc, out vec3 ro, out vec3 ta, out float fl){
  if (sc==0){ ro=vec3(-9.5, 1.4, 13.5); ta=vec3(-.5, 4.6, 0.); fl=1.9; }
  else if (sc==1){ ro=vec3(.4, 1.55, 6.); ta=vec3(-.2, 2.1, -10.); fl=1.35; }
  else if (sc==2){ ro=vec3(2.2, 1.9, 5.2); ta=vec3(0., 1.9, -1.2); fl=1.8; }
  else if (sc==3){ ro=vec3(1.6, .9, 6.5); ta=vec3(0., 2.2, -4.5); fl=1.45; }
  else if (sc==4){ ro=vec3(-3.6, .55, 6.2); ta=vec3(.25, 1.55, 0.); fl=1.55; }
  else { ro=vec3(-2.3, 1.25, 8.2); ta=vec3(.25, 2.25, 0.); fl=1.85; }
}

vec3 render(vec2 fc){
  vec2 uv = (2.*fc - uRes)/uRes.y;
  vec3 ro, ta; float fl;
  camFor(uScene, ro, ta, fl);
  vec3 ww = normalize(ta-ro), uu = normalize(cross(ww, vec3(0,1,0))), vv = cross(uu, ww);
  vec3 rd = normalize(uv.x*uu + uv.y*vv + fl*ww);
  vec3 sun = normalize(uSun);
  vec3 skyTop = vec3(.42,.47,.55), skyHor = vec3(.86,.85,.82);
  if (uColor > .5) { skyTop = vec3(.05,.28,.78); skyHor = vec3(.55,.78,.97); }
  vec3 sky = mix(skyHor, skyTop, pow(clamp(rd.y*1.4,0.,1.), .7));
  float t = 0.; vec2 h = vec2(0.);
  bool hit = false;
  for (int i=0;i<180;i++){
    h = map(ro+rd*t);
    if (h.x < .0006*t) { hit = true; break; }
    t += h.x*.9;
    if (t > 80.) break;
  }
  if (!hit) return sky;
  vec3 p = ro+rd*t, n = nrm(p);
  float sh = shadow(p+n*.004, sun);
  float dif = clamp(dot(n, sun), 0., 1.);
  float occ = ao(p, n);
  float sk = .5+.5*n.y;
  vec3 alb = vec3(.78,.76,.72);
  if (h.y < .5) { alb = vec3(.74,.72,.68) * (.9 + .1*vnoise(p.xz*3.)); }
  if (h.y > 1.5) { alb = vec3(.42,.41,.40); }
  if (uColor > .5) { alb = h.y < .5 ? vec3(.86,.62,.42) : (h.y > 1.5 ? vec3(.95,.3,.12) : vec3(.95,.9,.82)); }
  alb *= .94 + .06*vnoise(p.xy*7. + p.z*3.);
  float bounce = clamp(.5 - .5*n.y, 0., 1.)*occ;
  vec3 col = alb*(2.3*dif*sh*vec3(1.,.95,.86) + .13*sk*occ*vec3(.75,.82,.95) + .07*bounce*vec3(1.,.95,.85) + .015*occ);
  if (h.y > 1.5) { vec3 rf = reflect(rd, n); col += .35*pow(clamp(dot(rf, sun),0.,1.), 30.)*sh + .15*mix(skyHor, skyTop, clamp(rf.y,0.,1.)); }
  float fog = 1. - exp(-.0005*t*t);
  col = mix(col, skyHor*.9, fog*.85);
  return col;
}
void main(){
  vec3 acc = vec3(0.);
  int ss = int(uSS);
  for (int y=0;y<2;y++) for (int x=0;x<2;x++){
    if (x>=ss || y>=ss) continue;
    vec2 off = (vec2(float(x),float(y)) + .5)/float(ss) - .5;
    acc += render(gl_FragCoord.xy + off);
  }
  vec3 col = acc/float(ss*ss);
  col *= 1.05;
  col = clamp((col*(2.51*col+.03))/(col*(2.43*col+.59)+.14), 0., 1.);   // ACES-ish filmic
  col = pow(col, vec3(1./2.2));
  float l = dot(col, vec3(.299,.587,.114));
  o = uColor > .5 ? vec4(col, 1.) : vec4(vec3(l), 1.);
}`;

// ------------------------------------------------------------------ duotone / dither
// uMode 0: ordered-dither duotone, 1: smooth duotone, 2: halftone dots duotone
export const TONE_FS = HEAD + `
uniform sampler2D uTex; uniform vec3 uDark, uLight; uniform float uMode, uCell, uContrast, uBright, uNoise;
void main(){
  vec2 uv = gl_FragCoord.xy/uRes;
  float l = texture(uTex, uv).r;
  l = clamp((l-.5)*uContrast+.5+uBright, 0., 1.);
  l += (hash12(floor(gl_FragCoord.xy/max(uCell,1.))) - .5)*uNoise;
  vec3 col;
  if (uMode < .5) {
    vec2 cp = floor(gl_FragCoord.xy/uCell);
    float cl = texture(uTex, (cp*uCell + uCell*.5)/uRes).r;
    cl = clamp((cl-.5)*uContrast+.5+uBright, 0., 1.);
    float th = bayer8(cp);
    col = cl > th ? uLight : uDark;
  } else if (uMode < 1.5) {
    col = mix(uDark, uLight, smoothstep(0., 1., l));
  } else {
    vec2 g = gl_FragCoord.xy/uCell;
    vec2 cc = (floor(g)+.5)*uCell/uRes;
    float cl = texture(uTex, cc).r;
    cl = clamp((cl-.5)*uContrast+.5+uBright, 0., 1.);
    float r = sqrt(1.-cl)*.72;
    float d = length(fract(g)-.5);
    col = mix(uLight, uDark, smoothstep(r+.06, r-.06, d));
  }
  o = vec4(col, 1.);
}`;

// ------------------------------------------------------------------ marble
export const MARBLE_FS = HEAD + `
void main(){
  vec2 p = gl_FragCoord.xy/uRes.y*2.2;
  vec2 q = vec2(fbm(p*.8 + vec2(0.,0.)), fbm(p*.8 + vec2(5.2,1.3)));
  vec2 r = vec2(fbm(p + 2.6*q + vec2(1.7,9.2)), fbm(p + 2.6*q + vec2(8.3,2.8)));
  float f = fbm(p + 2.2*r);
  float broad = pow(1. - abs(sin((p.x*.55 + p.y*.30 + 4.2*f)*2.0)), 5.);
  float mid = pow(1. - abs(sin((p.x*.9 - p.y*.45 + 5.5*r.y)*2.6)), 16.);
  float thin = pow(1. - abs(sin((p.x*1.3 + p.y*.9 + 7.*r.x)*3.3)), 70.);
  vec3 base = mix(vec3(.925,.915,.895), vec3(.975,.968,.952), smoothstep(.3,.8,f));
  vec3 col = base;
  col = mix(col, vec3(.80,.79,.77), broad*.45);
  col = mix(col, vec3(.58,.57,.56), mid*.55);
  col = mix(col, vec3(.38,.37,.37), thin*.7);
  col += .012*(vnoise(gl_FragCoord.xy*.7) - .5);
  o = vec4(col, 1.);
}`;

// ------------------------------------------------------------------ abstract tiles
// uKind 0: chrome metaballs, 1: gradient orb, 2: contour waves, 3: glass bands
export const TILE_FS = HEAD + `
uniform int uKind; uniform vec3 uA, uB, uC; uniform float uSeed;
float smin(float a, float b, float k){ float h=clamp(.5+.5*(b-a)/k,0.,1.); return mix(b,a,h)-k*h*(1.-h); }
float blob(vec3 p){
  float d = length(p - vec3(-.35, .1, 0.)) - .55;
  d = smin(d, length(p - vec3(.45, -.15, .2)) - .42, .45);
  d = smin(d, length(p - vec3(.05, .55, -.1)) - .3, .4);
  return d;
}
vec3 env(vec3 d){ float t = .5+.5*d.y; vec3 c = mix(uB, uA, smoothstep(.2,.9,t)); c += uC*pow(max(0., dot(d, normalize(vec3(-.4,.6,.7)))), 24.)*1.5; c *= .6+.4*smoothstep(-.2,.3,sin(d.x*6.+d.y*3.)); return c; }
void main(){
  vec2 uv = (2.*gl_FragCoord.xy - uRes)/uRes.y;
  vec3 col;
  if (uKind == 0) {
    vec3 ro = vec3(0.,0.,3.2), rd = normalize(vec3(uv, -2.2));
    float t=0.; bool hit=false;
    for(int i=0;i<96;i++){ float d=blob(ro+rd*t); if(d<.001){hit=true;break;} t+=d; if(t>8.)break; }
    col = mix(uB*.35, uB*.15, length(uv)*.6);
    if(hit){ vec3 p=ro+rd*t; vec2 e=vec2(.001,0.);
      vec3 n=normalize(vec3(blob(p+e.xyy)-blob(p-e.xyy), blob(p+e.yxy)-blob(p-e.yxy), blob(p+e.yyx)-blob(p-e.yyx)));
      vec3 r = reflect(rd, n); float fr = pow(1.-max(0.,dot(-rd,n)), 3.);
      col = env(r)*(.75+.25*fr) + .08; }
  } else if (uKind == 1) {
    vec2 c = vec2(.15, .05);
    float d = length(uv - c);
    col = mix(uA, uB, smoothstep(.0, 1.1, d));
    col = mix(col, uC, smoothstep(.55, .0, length(uv - c - vec2(-.25,.3)))*.8);
    col *= 1. - .25*smoothstep(.7, 1.6, length(uv));
  } else if (uKind == 2) {
    float f = fbm(uv*1.4 + uSeed) + .35*uv.y;
    float d = abs(fract(f*14.) - .5);
    float w = fwidth(f*14.);
    float l = smoothstep(.5 - 2.5*w, .5 - w, d);
    col = mix(uA, uB, l);
  } else {
    float band = floor((uv.x + .2*sin(uv.y*2. + uSeed))*6.);
    vec2 q = uv + vec2(0., .15*sin(band*1.7 + uSeed));
    float g = smoothstep(-1., 1., q.y + .3*sin(q.x*3. + band));
    col = mix(uA, uB, g);
    col = mix(col, uC, .35*smoothstep(.7, 1., sin(band*2.1 + q.y*4.)));
  }
  o = vec4(col, 1.);
}`;

// ------------------------------------------------------------------ glass mark (per frame)
export const GLASS_FS = HEAD + `
uniform float uT, uYaw, uPitch, uRoll, uZoom, uSweep;
float sdTri2(vec2 p, vec2 a, vec2 b, vec2 c){
  vec2 e0=b-a, e1=c-b, e2=a-c, v0=p-a, v1=p-b, v2=p-c;
  vec2 pq0=v0-e0*clamp(dot(v0,e0)/dot(e0,e0),0.,1.);
  vec2 pq1=v1-e1*clamp(dot(v1,e1)/dot(e1,e1),0.,1.);
  vec2 pq2=v2-e2*clamp(dot(v2,e2)/dot(e2,e2),0.,1.);
  float s=sign(e0.x*e2.y-e0.y*e2.x);
  vec2 d=min(min(vec2(dot(pq0,pq0), s*(v0.x*e0.y-v0.y*e0.x)), vec2(dot(pq1,pq1), s*(v1.x*e1.y-v1.y*e1.x))), vec2(dot(pq2,pq2), s*(v2.x*e2.y-v2.y*e2.x)));
  return -sqrt(d.x)*sign(d.y);
}
float sdArc2(vec2 p, vec2 n, float r, float th){
  p.x = abs(p.x); p = mat2(n.x,n.y,-n.y,n.x)*p;
  return max(abs(length(p)-r)-th*.5, length(vec2(p.x, max(0., abs(r-p.y)-th*.5)))*sign(p.x));
}
float opExR(float d2, float z, float h, float r){ vec2 w=vec2(d2+r, abs(z)-h+r); return min(max(w.x,w.y),0.)+length(max(w,0.)) - r; }
mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0,-s, 0,1,0, s,0,c); }
mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1,0,0, 0,c,s, 0,-s,c); }
mat3 rotZ(float a){ float c=cos(a), s=sin(a); return mat3(c,s,0, -s,c,0, 0,0,1); }
mat3 R;
vec2 map(vec3 p){
  p = R*p;
  float th = radians(180. - 52.);
  float ring = opExR(sdArc2(vec2(p.y, -p.x), vec2(cos(th), sin(th)), .82, .36), p.z, .2, .045);
  vec2 T=vec2(.84,0.), B1=vec2(.1,.52), N=vec2(.42,0.), B2=vec2(.1,-.52);
  float c2 = min(sdTri2(p.xy,T,B1,N), sdTri2(p.xy,T,N,B2));
  float ch = opExR(c2, p.z, .2, .035);
  return ring < ch ? vec2(ring, 1.) : vec2(ch, 2.);
}
vec3 nrm(vec3 p){ vec2 e=vec2(.0012,0.); return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x, map(p+e.yxy).x-map(p-e.yxy).x, map(p+e.yyx).x-map(p-e.yyx).x)); }
vec3 env(vec3 d){
  vec3 c = vec3(0.);
  float az = atan(d.x, -d.z);
  c += vec3(1.) * smoothstep(.45, .8, d.y) * 1.6;                                   // overhead softbox
  c += vec3(1.,.96,.9) * smoothstep(.10, .0, abs(az - (1.1 + uSweep))) * smoothstep(-.5, .1, d.y) * 3.5;  // moving strip
  c += vec3(1.,.96,.9) * smoothstep(.05, .0, abs(az + 2.2)) * 2.2;                  // back strip
  c += vec3(1.,.29,.11) * smoothstep(.16, .0, abs(az + .95)) * smoothstep(.3, -.4, d.y) * 3.0;  // vermilion kicker
  c += vec3(.35,.4,.55) * smoothstep(.0, -.8, d.y) * .25;
  c += vec3(.95,.97,1.) * smoothstep(.75, .0, abs(az)) * smoothstep(-.35, .45, d.y) * .9;    // soft backlight panel
  c += vec3(1.) * smoothstep(.02, .0, abs(d.y - .08)) * smoothstep(1.2, .2, abs(az)) * 1.5;  // horizon line
  return c;
}
float march(vec3 ro, vec3 rd, float sgn, out vec2 hit){
  float t = 0.; hit = vec2(0.);
  for (int i=0;i<110;i++){
    vec2 h = map(ro+rd*t); h.x *= sgn;
    if (h.x < .0007) { hit = vec2(1., h.y); return t; }
    t += max(h.x, .002);
    if (t > 12.) break;
  }
  return -1.;
}
void main(){
  vec2 uv = (2.*gl_FragCoord.xy - uRes)/uRes.y;
  R = rotZ(uRoll)*rotX(uPitch)*rotY(uYaw);
  vec3 ro = vec3(0., 0., 4.6/uZoom), rd = normalize(vec3(uv, -2.1));
  // bounding sphere early out
  float b = dot(ro, rd), c = dot(ro, ro) - 1.35*1.35;
  if (b*b - c < 0.) { o = vec4(0.,0.,0.,1.); return; }
  vec2 h; float t = march(ro, rd, 1., h);
  vec3 col = vec3(0.);
  if (t > 0.) {
    vec3 p = ro + rd*t, n = nrm(p);
    float cosi = clamp(dot(-rd, n), 0., 1.);
    float F = .04 + .96*pow(1. - cosi, 5.);
    vec3 refl = env(reflect(rd, n));
    vec3 tint = h.y > 1.5 ? vec3(1., .36, .16) : vec3(.95, .98, 1.);
    vec3 rd2 = refract(rd, n, 1./1.5);
    vec2 h2; float t2 = march(p - n*.004, rd2, -1., h2);
    vec3 tr = vec3(0.);
    if (t2 > 0.) {
      vec3 p2 = p - n*.004 + rd2*t2, n2 = nrm(p2);
      float absorb = h.y > 1.5 ? .9 : .25;
      vec3 att = exp(-(1. - tint)*absorb*t2*3.);
      for (int k=0;k<3;k++){
        float ior = 1.5 + (float(k) - 1.)*.035;
        vec3 rd3 = refract(rd2, -n2, ior);
        if (dot(rd3, rd3) < .01) rd3 = reflect(rd2, -n2);
        tr[k] = env(rd3)[k];
      }
      tr *= att;
      if (h.y > 1.5) tr *= vec3(1.15, .36, .16);
    }
    col = mix(tr, refl, F) + tint*.02;
    if (h.y > 1.5) col += vec3(1.,.29,.11)*(.22 + .25*pow(cosi, 2.));   // chevron inner glow
  }
  col = col/(1.+col*.25);
  o = vec4(pow(col, vec3(1./2.2)), 1.);
}`;

// ------------------------------------------------------------------ gold wax seal (baked, with alpha)
export const WAX_FS = HEAD + `
uniform sampler2D uMark;
float edgeR(float a){ vec2 c = vec2(cos(a), sin(a)); return .84 + .12*(fbm(c*1.6 + 3.1) - .5) + .025*(vnoise(c*7. + 1.3) - .5) + .006*sin(a*29.); }
float hgt(vec2 uv){
  float r = length(uv), a = atan(uv.y, uv.x);
  float e = edgeR(a);
  float h = smoothstep(e, e - .16, r) * .55;
  float stamp = smoothstep(.645, .615, r);
  h -= .17*stamp;
  h += .09*exp(-pow((r - .655)/.028, 2.));
  float m = texture(uMark, uv*.5 + .5).r;
  h += .15*m*stamp;
  h += .015*(vnoise(uv*18.) - .5);
  return h;
}
void main(){
  vec2 uv = (gl_FragCoord.xy/uRes)*2. - 1.;
  float r = length(uv), a = atan(uv.y, uv.x);
  float e = edgeR(a);
  float alpha = smoothstep(e + .012, e - .004, r);
  if (alpha <= 0.) { o = vec4(0.); return; }
  vec2 d = vec2(1.5/uRes.x*2., 0.);
  float hx = hgt(uv + d.xy) - hgt(uv - d.xy), hy = hgt(uv + d.yx) - hgt(uv - d.yx);
  vec3 n = normalize(vec3(-hx, -hy, 2.*d.x*1.4));
  vec3 L = normalize(vec3(-.55, .6, .6)), V = vec3(0.,0.,1.), Hh = normalize(L + V);
  float dif = clamp(dot(n, L), 0., 1.);
  float spec = pow(clamp(dot(n, Hh), 0., 1.), 60.);
  float h0 = hgt(uv);
  vec3 gold = mix(vec3(.42,.28,.07), vec3(.86,.66,.24), .35 + .65*dif);
  vec3 col = gold*(.35 + .85*dif) + spec*vec3(1.,.93,.72)*1.1;
  col += .25*vec3(1.,.85,.5)*pow(1. - n.z, 2.)*dif;
  col *= .75 + .25*smoothstep(-.2, .4, h0);
  o = vec4(col*alpha, alpha);
}`;

// ------------------------------------------------------------------ halftone field (end card)
export const HALFTONE_FS = HEAD + `
uniform float uT; uniform vec3 uBg, uDot; uniform float uCell, uAmt;
void main(){
  vec2 fc = gl_FragCoord.xy;
  vec2 g = fc/uCell;
  vec2 c = (floor(g) + .5)*uCell;
  vec2 q = c/uRes.y;
  float horizon = mix(.35, 1., smoothstep(.75, .1, c.y/uRes.y));          // bigger dots toward the bottom
  float wave = .5 + .5*sin(q.x*5. + uT*1.3 + 2.*fbm(q*2.5 + uT*.12));
  float n = fbm(q*3. + vec2(uT*.15, -uT*.08));
  float v = clamp(horizon*.85 + .25*wave*horizon + .35*(n - .5), 0., 1.)*uAmt;
  vec2 cz = (c - vec2(uRes.x*.5, uRes.y*.54))/vec2(uRes.x*.36, uRes.y*.2);
  v *= mix(.18, 1., smoothstep(.7, 1.25, length(cz)));             // keep the lockup area calm
  float rad = .5*sqrt(v)*1.08;
  float dd = length(fract(g) - .5);
  float m = smoothstep(rad + .06, rad - .06, dd);
  o = vec4(mix(uBg, uDot, m), 1.);
}`;
