// WebGL2 plumbing: a compositor that accumulates motion-blur subframes and runs
// the finishing pass, and a small generator that renders fragment shaders into
// canvases the 2D scenes can draw.

const VS = `#version 300 es
in vec2 p; out vec2 v;
void main(){ v = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    const lines = src.split('\n').map((l, i) => `${i + 1}: ${l}`).join('\n');
    throw new Error('Shader compile error: ' + log + '\n' + lines.slice(0, 4000));
  }
  return s;
}
export function program(gl, fs, vs = VS) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, 'p');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Link error: ' + gl.getProgramInfoLog(p));
  const uniforms = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i);
    uniforms[info.name.replace(/\[0\]$/, '')] = { loc: gl.getUniformLocation(p, info.name), type: info.type, size: info.size };
  }
  return { p, uniforms };
}
function fsTriangle(gl) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  return vao;
}
function setUniforms(gl, prog, u) {
  let unit = 0;
  for (const k in u) {
    const info = prog.uniforms[k];
    if (!info) continue;
    const v = u[k];
    const L = info.loc;
    switch (info.type) {
      case gl.FLOAT: info.size > 1 ? gl.uniform1fv(L, v) : gl.uniform1f(L, v); break;
      case gl.FLOAT_VEC2: gl.uniform2fv(L, v); break;
      case gl.FLOAT_VEC3: gl.uniform3fv(L, v); break;
      case gl.FLOAT_VEC4: gl.uniform4fv(L, v); break;
      case gl.INT: case gl.BOOL: gl.uniform1i(L, v); break;
      case gl.FLOAT_MAT3: gl.uniformMatrix3fv(L, false, v); break;
      case gl.SAMPLER_2D:
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, v);
        gl.uniform1i(L, unit++);
        break;
    }
  }
}

// Shared GLSL snippets for generators.
export const GLSL_COMMON = `
precision highp float;
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3 += dot(p3, p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash12(i),hash12(i+vec2(1,0)),u.x), mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float s=0., a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<6;i++){ s+=a*vnoise(p); p=m*p; a*=.5; } return s; }
float bayer8(vec2 p){ ivec2 q = ivec2(mod(p, 8.));
  const int M[64] = int[64](0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,
    3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21);
  return (float(M[q.y*8+q.x])+.5)/64.; }
vec3 srgb2lin(vec3 c){ return pow(c, vec3(2.2)); }
vec3 lin2srgb(vec3 c){ return pow(max(c,0.), vec3(1./2.2)); }
`;

const ACCUM_FS = `#version 300 es
precision highp float;
in vec2 v; out vec4 o;
uniform sampler2D uTex; uniform float uW;
void main(){ vec4 c = texture(uTex, vec2(v.x, v.y)); o = vec4(pow(c.rgb, vec3(2.2))*uW, uW); }`;

const POST_FS = `#version 300 es
precision highp float;
in vec2 v; out vec4 o;
uniform sampler2D uTex; uniform vec2 uRes; uniform float uFrame;
uniform float uGrain, uCA, uVig, uGlitch, uGSeed, uScan, uFade, uBarrel, uExposure, uFlash, uBleed;
uniform vec3 uFadeCol;
float h1(float n){ return fract(sin(n*127.1)*43758.5453); }
float h2(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
vec3 samp(vec2 uv){ return texture(uTex, clamp(uv, 0., 1.)).rgb; }
void main(){
  vec2 uv = v;                     // image space: y = 0 is the top row
  vec2 px = 1./uRes;
  // gentle CRT barrel (used by the ASCII shot)
  if (uBarrel > 0.) { vec2 c = uv-.5; float r2 = dot(c,c); uv = .5 + c*(1. + uBarrel*r2); }
  float g = uGlitch;
  vec2 gd = vec2(0.);
  float stripe = 0.;
  if (g > 0.001) {
    float s = floor(uGSeed);
    float rows = mix(6., 42., h1(s*1.3));
    float band = floor(uv.y*rows);
    float r = h2(vec2(band, s));
    if (r > 1. - g*.85) gd.x += (h2(vec2(band, s+7.)) - .5) * .32 * g;
    float fine = floor(uv.y*uRes.y/3.);
    if (h2(vec2(fine, s+3.)) > 1. - g*.35) gd.x += (h2(vec2(fine, s+9.)) - .5) * .06 * g;
    vec2 blk = floor(uv*vec2(12., 18.));
    if (h2(blk + s) > 1. - g*.12) { gd += (hash2d(blk, s)-.5)*.08*g; stripe = 1.; }
  }
  uv += gd;
  vec2 dir = (uv - .5);
  float ca = uCA*px.x + g*0.012;
  vec3 col;
  col.r = samp(uv + dir*ca*2.0 + vec2(g*.004, 0.)).r;
  col.g = samp(uv).g;
  col.b = samp(uv - dir*ca*2.0 - vec2(g*.004, 0.)).b;
  col = pow(max(col, 0.), vec3(1./2.2));  // accumulation buffer is linear
  if (stripe > .5) { float sl = step(.5, fract(uv.y*uRes.y/4.)); float lm = step(.06, dot(col, vec3(.3,.59,.11))); col = mix(col, vec3(1., .92, .2)*sl + col*(1.-sl), .55*lm); }
  if (uScan > 0.) { float sl = .5 + .5*sin(uv.y*uRes.y*3.14159*0.5); col *= 1. - uScan*(1.-sl); }
  col *= uExposure;
  // vignette
  vec2 q = v - .5; col *= 1. - uVig*smoothstep(.35, 1.1, dot(q,q)*2.2);
  // film grain: luminance weighted, per-frame seed
  float n = (h2(gl_FragCoord.xy + uFrame*17.13) + h2(gl_FragCoord.xy*1.37 + uFrame*9.71) - 1.);
  float lum = dot(col, vec3(.299,.587,.114));
  col += n * uGrain * (1.15 - lum*.6);
  col = mix(col, vec3(1.), uFlash);
  col = mix(col, uFadeCol, uFade);
  // ordered dither to kill 8-bit banding
  col += (h2(gl_FragCoord.xy + 3.7) - .5)/255.;
  o = vec4(clamp(col, 0., 1.), 1.);
}`.replace('hash2d(blk, s)', 'vec2(h2(blk+s*1.7), h2(blk.yx+s*2.3))');

export class Compositor {
  constructor(canvas, W, H) {
    this.W = W; this.H = H;
    canvas.width = W; canvas.height = H;
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL2 unavailable');
    gl.getExtension('EXT_color_buffer_float');
    gl.getExtension('EXT_float_blend');
    this.gl = gl;
    this.vao = fsTriangle(gl);
    this.accumProg = program(gl, ACCUM_FS);
    this.postProg = program(gl, POST_FS);
    this.src = this.makeTex(W, H, false);
    this.acc = this.makeTex(W, H, true);
    this.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.acc, 0);
    const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (st !== gl.FRAMEBUFFER_COMPLETE) throw new Error('accum FBO incomplete ' + st);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.pixels = new Uint8Array(W * H * 4);
  }
  makeTex(W, H, float) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    if (float) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, W, H, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  begin() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, this.W, this.H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  add(canvas, weight) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.src);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, this.W, this.H);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(this.accumProg.p);
    setUniforms(gl, this.accumProg, { uTex: this.src, uW: weight });
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.BLEND);
  }
  finish(frame, fx) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.W, this.H);
    gl.useProgram(this.postProg.p);
    setUniforms(gl, this.postProg, {
      uTex: this.acc, uRes: [this.W, this.H], uFrame: frame,
      uGrain: (fx.grain ?? 0.035) * 0.75, uCA: fx.ca ?? 0.6, uVig: fx.vignette ?? 0.1,
      uGlitch: fx.glitch ?? 0, uGSeed: fx.glitchSeed ?? frame, uScan: fx.scan ?? 0,
      uFade: fx.fade ?? 0, uFadeCol: fx.fadeCol ?? [0, 0, 0], uBarrel: fx.barrel ?? 0,
      uExposure: fx.exposure ?? 1, uFlash: fx.flash ?? 0,
    });
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  read() {
    const gl = this.gl;
    gl.readPixels(0, 0, this.W, this.H, gl.RGBA, gl.UNSIGNED_BYTE, this.pixels);
    return this.pixels;
  }
}

// Renders a fragment shader to its own canvas; draw that canvas with ctx.drawImage.
export class Gen {
  constructor(W, H) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = W; this.canvas.height = H;
    const gl = this.canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: true, alpha: true });
    this.gl = gl;
    gl.getExtension('EXT_color_buffer_float');
    this.vao = fsTriangle(gl);
    this.progs = new Map();
    this.textures = new Map();
  }
  resize(W, H) { if (this.canvas.width !== W || this.canvas.height !== H) { this.canvas.width = W; this.canvas.height = H; } }
  prog(key, fs) {
    if (!this.progs.has(key)) this.progs.set(key, program(this.gl, fs));
    return this.progs.get(key);
  }
  texture(key, source) {
    // Upload (once per key) an image/canvas to sample from a shader.
    const gl = this.gl;
    let t = this.textures.get(key);
    if (!t) {
      t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.textures.set(key, t);
    }
    return t;
  }
  run(key, fs, uniforms = {}, W, H) {
    if (W && H) this.resize(W, H);
    const gl = this.gl;
    const pr = this.prog(key, fs);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(pr.p);
    setUniforms(gl, pr, { uRes: [this.canvas.width, this.canvas.height], ...uniforms });
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return this.canvas;
  }
  // Render and copy into a fresh 2D canvas (for caching static imagery).
  bake(key, fs, uniforms, W, H) {
    this.run(key, fs, uniforms, W, H);
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    c.getContext('2d').drawImage(this.canvas, 0, 0);
    return c;
  }
}
