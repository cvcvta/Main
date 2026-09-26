// Frame-accurate renderer for index.html.
//
//   node tools/render.mjs                      full render -> out/ivy-spot-video.mp4 (no audio)
//   node tools/render.mjs --stills 1.2,3.5     PNG stills -> build/stills/
//   node tools/render.mjs --sheet 0.5          contact sheet every 0.5 s -> build/stills/sheet.png
//   options: --workers 3  --sub 1 (force motion-blur subframes)  --from 0 --to 15  --crf 17  --blur (stills with blur)
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { W, H, FPS, DURATION } from '../src/config.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return acc;
}, []));
const WORKERS = +(args.workers || 3);
const SUB_OVERRIDE = args.sub ? +args.sub : 0; // default: adaptive per frame (window.subframes)
const SHUTTER = 0.5; // 180 degrees

// ---------------------------------------------------------------- static server
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.otf': 'font/otf', '.jpg': 'image/jpeg', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
};
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  });
}).listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const URL = `http://127.0.0.1:${server.address().port}/index.html`;

const browser = await chromium.launch({
  args: ['--font-render-hinting=none', '--force-color-profile=srgb', '--disable-lcd-text', '--hide-scrollbars'],
});

async function openPage() {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('[page]', e.message));
  page.on('console', (m) => {
    // optional brand files are probed with HEAD requests; their 404s are expected
    if ((m.type() === 'error' || m.type() === 'warning') && !m.text().startsWith('Failed to load resource')) console.error('[console]', m.text());
  });
  await page.goto(URL);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  const cdp = await page.context().newCDPSession(page);
  return {
    async shot(t) {
      await page.evaluate((tt) => window.seek(tt), t);
      const r = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
      return Buffer.from(r.data, 'base64');
    },
    post: (t) => page.evaluate((tt) => window.post(tt), t),
    subframes: (t) => page.evaluate((tt) => window.subframes(tt), t),
  };
}

// ---------------------------------------------------------------- post: chromatic aberration, vignette, grain
const VIG = new Float32Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2);
  const d = Math.sqrt(dx * dx * 0.8 + dy * dy);
  VIG[y * W + x] = Math.max(0, d - 0.4) / 0.85;
}
function xorshift(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
}
const GW = W / 2 + 2, GH = H / 2 + 2;
const G = new Float32Array(GW * GH);
function finish(acc, n, fx, frameNo) {
  const out = Buffer.allocUnsafe(W * H * 3);
  const invn = 1 / n;
  const rnd = xorshift(0x9e3779b9 ^ (frameNo * 2654435761));
  for (let i = 0; i < G.length; i++) G[i] = rnd() + rnd() + rnd() - 1.5;
  const ca = fx.ca;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let r, g, b;
      if (ca > 0.01) {
        const lat = ((x - W / 2) / (W / 2)) * ca * 0.5;
        const xr = Math.min(W - 1, Math.max(0, Math.round(x - lat)));
        const xb = Math.min(W - 1, Math.max(0, Math.round(x + lat)));
        r = acc[(y * W + xr) * 3] * invn;
        g = acc[i * 3 + 1] * invn;
        b = acc[(y * W + xb) * 3 + 2] * invn;
      } else {
        r = acc[i * 3] * invn; g = acc[i * 3 + 1] * invn; b = acc[i * 3 + 2] * invn;
      }
      const v = 1 - fx.vignette * VIG[i] * VIG[i];
      const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      const gx = x * 0.5, gy = y * 0.5, ix = gx | 0, iy = gy | 0, fx0 = gx - ix, fy0 = gy - iy, gi = iy * GW + ix;
      const gn = (G[gi] * (1 - fx0) + G[gi + 1] * fx0) * (1 - fy0) + (G[gi + GW] * (1 - fx0) + G[gi + GW + 1] * fx0) * fy0;
      const gr = gn * fx.grain * 255 * (0.35 + 0.9 * l * (1 - l) * 2.6);
      r = r * v + gr; g = g * v + gr; b = b * v + gr;
      const o = i * 3;
      out[o] = r < 0 ? 0 : r > 255 ? 255 : r;
      out[o + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
      out[o + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
    }
  }
  return out;
}

async function renderFrame(page, f, blur) {
  const sub = !blur ? 1 : SUB_OVERRIDE || (await page.subframes(f / FPS));
  const acc = new Float32Array(W * H * 3);
  for (let s = 0; s < sub; s++) {
    const off = sub === 1 ? 0 : SHUTTER * ((s + 0.5) / sub - 0.5);
    const t = Math.max(0, Math.min(DURATION - 1e-4, (f + off) / FPS));
    const png = await page.shot(t);
    const raw = await sharp(png).removeAlpha().raw().toBuffer();
    for (let i = 0; i < raw.length; i++) acc[i] += raw[i];
  }
  const fx = await page.post(f / FPS);
  return finish(acc, sub, fx, f);
}

// ---------------------------------------------------------------- modes
fs.mkdirSync(path.join(ROOT, 'build/stills'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });

if (args.stills || args.sheet) {
  const times = args.stills ? String(args.stills).split(',').map(Number) : [];
  if (args.sheet) for (let t = +(args.from || 0); t < +(args.to || DURATION); t += +args.sheet) times.push(+t.toFixed(3));
  const pages = await Promise.all([...Array(Math.min(WORKERS, times.length))].map(openPage));
  const files = new Array(times.length);
  let next = 0;
  await Promise.all(pages.map(async (pg) => {
    while (next < times.length) {
      const j = next++;
      const f = Math.round(times[j] * FPS);
      const rgb = await renderFrame(pg, f, !!args.blur);
      const file = path.join(ROOT, `build/stills/t${times[j].toFixed(3)}.png`);
      await sharp(rgb, { raw: { width: W, height: H, channels: 3 } }).png().toFile(file);
      files[j] = file;
    }
  }));
  if (args.sheet) {
    const cols = +(args.cols || 4), tw = 480, th = 270;
    const tiles = await Promise.all(files.map(async (f, i) => {
      const label = Buffer.from(`<svg width="${tw}" height="${th}"><rect x="0" y="0" width="64" height="22" fill="#000a"/><text x="6" y="16" font-family="monospace" font-size="14" fill="#fff">${times[i].toFixed(2)}</text></svg>`);
      return sharp(f).resize(tw, th).composite([{ input: label, left: 0, top: 0 }]).toBuffer();
    }));
    const rows = Math.ceil(tiles.length / cols);
    const name = args.name || 'sheet';
    await sharp({ create: { width: cols * tw, height: rows * th, channels: 3, background: '#000' } })
      .composite(tiles.map((bb, i) => ({ input: bb, left: (i % cols) * tw, top: Math.floor(i / cols) * th })))
      .png().toFile(path.join(ROOT, `build/stills/${name}.png`));
  }
  console.log(files.join('\n'));
} else {
  const f0 = Math.round(+(args.from || 0) * FPS), f1 = Math.round(+(args.to || DURATION) * FPS);
  const outFile = path.join(ROOT, args.out || 'out/ivy-spot-video.mp4');
  const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int',
    '-c:v', 'libx264', '-preset', args.fast ? 'veryfast' : 'slow', '-crf', String(args.crf || 17), '-x264-params', 'aq-mode=3:psy-rd=1.0,0.0',
    '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-movflags', '+faststart', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  const pages = await Promise.all([...Array(WORKERS)].map(openPage));
  const done = new Map();
  let next = f0, write = f0;
  const t0 = Date.now();
  const flush = async () => {
    while (done.has(write)) {
      const buf = done.get(write);
      done.delete(write);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      write++;
      if (write % 15 === 0) {
        const el = (Date.now() - t0) / 1000;
        process.stdout.write(`\rframe ${write}/${f1}  ${el.toFixed(0)}s  eta ${((el / (write - f0)) * (f1 - write)).toFixed(0)}s   `);
      }
    }
  };
  await Promise.all(pages.map(async (pg) => {
    while (next < f1) {
      const f = next++;
      while (f - write > WORKERS * 3) await new Promise((r) => setTimeout(r, 20));
      done.set(f, await renderFrame(pg, f, !args.noblur));
      await flush();
    }
  }));
  await flush();
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log(`\nwrote ${outFile} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();
server.close();
