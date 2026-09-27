// Renders reel.html frame by frame with headless Chromium.
//
//   node render.mjs --stills 0.5,2.3,8.4        PNG stills → out/stills/
//   node render.mjs --cues                      sound cue sheet only → out/sfx.json
//   node render.mjs                             full render → out/frames/ + out/sfx.json
//
// Options: --fps 30  --sub 4 (motion-blur samples per frame)  --shutter 0.5
//          --workers 3  --scale 1 (0.5 for a quick half-res preview)  --from/--to (seconds)
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : 'true']);
  return acc;
}, []));
const FPS = +(args.fps || 30), SUB = +(args.sub || 1), SHUTTER = +(args.shutter || .5);
const WORKERS = +(args.workers || 3), SCALE = +(args.scale || 1);
const OUT = path.join(ROOT, 'out');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const URL_ = `http://127.0.0.1:${server.address().port}/reel.html`;

const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: SCALE });
  page.on('pageerror', e => console.error('[page error]', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });
  await page.addInitScript(() => { window.__RENDER__ = true; });
  await page.goto(URL_);
  await page.waitForFunction(() => window.__READY === true, null, { timeout: 30000 });
  return page;
}
const shot = (page, t, type, file) => page.evaluate(t => window.__render(t), t)
  .then(() => page.screenshot(type === 'png' ? { type: 'png', path: file } : { type: 'jpeg', quality: 94, path: file }));

try {
  if (args.cues) {
    fs.mkdirSync(OUT, { recursive: true });
    const page = await openPage();
    fs.writeFileSync(path.join(OUT, 'sfx.json'), JSON.stringify(await page.evaluate(() => window.__SFX), null, 1));
    console.log('wrote out/sfx.json');
  } else if (args.stills) {
    const dir = path.join(OUT, 'stills');
    fs.mkdirSync(dir, { recursive: true });
    const page = await openPage();
    for (const t of args.stills.split(',').map(Number)) {
      const file = path.join(dir, `t${t.toFixed(2).padStart(6, '0')}.png`);
      await shot(page, t, 'png', file);
      console.log(file);
    }
  } else {
    const dir = path.join(OUT, 'frames');
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const first = await openPage();
    const dur = await first.evaluate(() => window.__DUR);
    fs.writeFileSync(path.join(OUT, 'sfx.json'), JSON.stringify(await first.evaluate(() => window.__SFX), null, 1));
    const from = +(args.from || 0), to = +(args.to || dur);
    const f0 = Math.round(from * FPS), f1 = Math.round(to * FPS);
    // every output frame f is the average of SUB samples spread across the shutter interval
    const jobs = [];
    for (let f = f0; f < f1; f++) for (let j = 0; j < SUB; j++) jobs.push({ n: (f - f0) * SUB + j, t: f / FPS + (SUB > 1 ? (j / SUB - .5) * SHUTTER / FPS : 0) });
    const pages = [first, ...await Promise.all(Array.from({ length: WORKERS - 1 }, openPage))];
    let done = 0; const t0 = Date.now();
    await Promise.all(pages.map(async (page, w) => {
      for (let k = w; k < jobs.length; k += pages.length) {
        const { n, t } = jobs[k];
        await shot(page, Math.max(0, t), 'jpeg', path.join(dir, `${String(n).padStart(6, '0')}.jpg`));
        if (++done % 200 === 0) console.log(`${done}/${jobs.length}  ${((Date.now() - t0) / done).toFixed(0)} ms/img`);
      }
    }));
    fs.writeFileSync(path.join(OUT, 'frames.json'), JSON.stringify({ fps: FPS, sub: SUB, frames: f1 - f0, from }));
    console.log(`rendered ${jobs.length} images in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
} finally {
  await browser.close();
  server.close();
}
