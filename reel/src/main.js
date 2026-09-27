// Entry point. Loads fonts, bakes procedural assets, then renders frames on request.
import { FONTS } from './fontlist.js';
import { Compositor } from './gl.js';
import { SHOTS, DURATION, FPS, shotAt, cueList } from './timeline.js';
import { initAssets } from './assets.js';
import { connect, send } from './net.js';

const Q = new URLSearchParams(location.search);
const W = +(Q.get('w') || 1920), H = +(Q.get('h') || 1080);
const MB = +(Q.get('mb') || 1);
const SX = W / 1920;

const sceneCanvas = document.createElement('canvas');
sceneCanvas.width = W; sceneCanvas.height = H;
const ctx = sceneCanvas.getContext('2d', { willReadFrequently: false });
const outCanvas = document.createElement('canvas');
document.body.appendChild(outCanvas);
const comp = new Compositor(outCanvas, W, H);

async function loadFonts() {
  await Promise.all(FONTS.map(([fam, w, st]) => document.fonts.load(`${st} ${w} 40px "${fam}"`)));
  await document.fonts.ready;
}

function drawShot(shot, t) {
  ctx.save();
  ctx.setTransform(SX, 0, 0, SX, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 1920, 1080);
  shot.scene.draw(ctx, t - shot.start, shot);
  ctx.restore();
}

export function renderFrame(frame, mb = MB) {
  const t = frame / FPS;
  const shot = shotAt(t);
  const n = Math.max(1, shot.scene.mb === 1 ? 1 : mb);
  const shutter = (shot.scene.shutter ?? 0.5) / FPS;
  comp.begin();
  for (let i = 0; i < n; i++) {
    let ts = n === 1 ? t : t + ((i + 0.5) / n - 0.5) * shutter;
    ts = Math.min(Math.max(ts, shot.start), shot.end - 1e-4);
    drawShot(shot, ts);
    comp.add(sceneCanvas, 1 / n);
  }
  const lt = t - shot.start;
  const fx = shot.scene.fx ? shot.scene.fx(lt, shot) : {};
  comp.finish(frame, fx);
  return shot;
}

window.runRange = async (from, to, worker) => {
  await connect();
  const t0 = performance.now();
  for (let f = from; f < to; f++) {
    const shot = renderFrame(f);
    const px = comp.read();
    await send(`frame:${worker}:${f}`, px);
    if ((f - from) % 30 === 0) console.log(`w${worker} frame ${f} (${shot.id}) ${((performance.now() - t0) / (f - from + 1)).toFixed(0)}ms/f`);
  }
  return (performance.now() - t0) / 1000;
};

window.runStills = async (times, tag) => {
  await connect();
  for (const t of times) {
    const f = Math.round(t * FPS);
    const shot = renderFrame(f);
    await send(`still:${tag}_${String(f).padStart(4, '0')}_${shot.id}`, comp.read());
  }
};

window.exportCues = () => ({ duration: DURATION, fps: FPS, shots: SHOTS.map((s) => ({ id: s.id, start: s.start, end: s.end })), cues: cueList() });

(async () => {
  try {
    await loadFonts();
    await initAssets({ W, H, SX });
    for (const s of SHOTS) if (s.scene.init) await s.scene.init(s);
    window.__meta = { W, H, FPS, frames: Math.round(DURATION * FPS) };
    window.__ready = true;
  } catch (e) {
    console.error('INIT FAILED', e.stack || e);
    window.__error = String(e.stack || e);
  }
})();
