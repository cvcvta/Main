// Deterministic renderer: serves the reel page, drives headless Chromium workers,
// and streams raw RGBA frames straight into ffmpeg.
//
//   node render.mjs video  --w 1920 --h 1080 --mb 6 --workers 4 --out out/reel.mp4 [--audio out/mix.wav]
//   node render.mjs stills --w 960 --h 540 --times 0.5,1.2,3.4 --tag s
//   node render.mjs cues   --out out/timeline.json
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { chromium } from 'playwright';
import { WebSocketServer } from 'ws';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const [, , mode = 'video', ...rest] = process.argv;
const A = {};
for (let i = 0; i < rest.length; i += 2) A[rest[i].replace(/^--/, '')] = rest[i + 1];
const W = +(A.w || 1920), H = +(A.h || 1080), MB = +(A.mb || 1);
const WORKERS = +(A.workers || 4);
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const OUTDIR = path.join(ROOT, 'out');
fs.mkdirSync(OUTDIR, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const sinks = new Map(); // worker -> { proc, next, pending: Map }

function ffmpegSink(file, fps) {
  const proc = spawn(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`,
    '-r', String(fps), '-i', '-', '-c:v', 'libx264rgb', '-qp', '0', '-preset', 'ultrafast', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  return proc;
}
function writeAsync(stream, buf) {
  return new Promise((res, rej) => { stream.write(buf, (e) => (e ? rej(e) : res())); });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let p = path.join(ROOT, decodeURIComponent(url.pathname));
  if (!p.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  if (url.pathname === '/') p = path.join(ROOT, 'index.html');
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});
const wss = new WebSocketServer({ server, maxPayload: 1 << 30 });
wss.on('connection', (ws, req) => {
  let target = null;
  ws.on('message', async (data, isBinary) => {
    if (!isBinary) { target = data.toString(); return; }
    try {
      if (target && target.startsWith('asset:')) {
        const [, name, aw, ah] = target.split(':');
        if (data.length !== aw * ah * 4) throw new Error('bad asset size');
        const dir = path.join(ROOT, 'assets', 'baked');
        fs.mkdirSync(dir, { recursive: true });
        const p = spawn(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${aw}x${ah}`, '-i', '-', '-frames:v', '1', path.join(dir, name + '.png')]);
        p.stdin.end(data);
        await new Promise((r) => p.on('close', r));
        ws.send('ok');
        return;
      }
      if (data.length !== W * H * 4) throw new Error('bad frame size ' + data.length);
      if (target && target.startsWith('still:')) {
        const dir = path.join(OUTDIR, 'stills');
        fs.mkdirSync(dir, { recursive: true });
        const p = spawn(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-i', '-', '-frames:v', '1', path.join(dir, target.slice(6) + '.png')]);
        p.stdin.end(data);
        await new Promise((r) => p.on('close', r));
      } else {
        await writeAsync(sinks.get(+target.split(':')[1]).proc.stdin, data);
      }
      ws.send('ok');
    } catch (e) { console.error('ws error', e.message); ws.send('err:' + e.message); }
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

async function openPage() {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-accelerated-2d-canvas', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  page.on('console', (m) => { const t = m.text(); if (!/^\[HMR\]/.test(t)) console.log('  [page]', t); });
  page.on('pageerror', (e) => console.log('  [pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${PORT}/index.html?w=${W}&h=${H}&mb=${MB}&port=${PORT}`);
  await page.waitForFunction(() => window.__ready === true || window.__error, null, { timeout: 0 });
  const err = await page.evaluate(() => window.__error);
  if (err) throw new Error(err);
  return { browser, page };
}

const t0 = Date.now();
try {
  if (mode === 'cues') {
    const { browser, page } = await openPage();
    const cues = await page.evaluate(() => window.exportCues());
    fs.writeFileSync(A.out || path.join(OUTDIR, 'timeline.json'), JSON.stringify(cues, null, 1));
    console.log('cues:', cues.cues.length, 'shots:', cues.shots.length, 'duration', cues.duration);
    await browser.close();
  } else if (mode === 'stills') {
    const times = A.times.split(',').map(Number);
    const n = Math.min(WORKERS, times.length);
    const chunks = Array.from({ length: n }, (_, k) => times.filter((_, i) => i % n === k));
    const firstPage = await openPage();
    await Promise.all(chunks.map(async (ts, k) => {
      const { browser, page } = k === 0 ? firstPage : await openPage();
      await page.evaluate(([ts, tag]) => window.runStills(ts, tag), [ts, A.tag || 's']);
      await browser.close();
    }));
    console.log(`stills done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } else {
    const first = await openPage();
    const meta = await first.page.evaluate(() => window.__meta);
    const from = +(A.from ?? 0), to = +(A.to ?? meta.frames);
    const n = Math.min(WORKERS, to - from);
    const per = Math.ceil((to - from) / n);
    const segs = [];
    const jobs = [];
    for (let k = 0; k < n; k++) {
      const a = from + k * per, b = Math.min(to, a + per);
      if (a >= b) break;
      const seg = path.join(OUTDIR, `seg_${k}.mkv`);
      segs.push(seg);
      const proc = ffmpegSink(seg, meta.FPS);
      sinks.set(k, { proc });
      jobs.push((async () => {
        const { browser, page } = k === 0 ? first : await openPage();
        const secs = await page.evaluate(([a, b, k]) => window.runRange(a, b, k), [a, b, k]);
        console.log(`worker ${k}: frames ${a}-${b} in ${secs.toFixed(1)}s`);
        await browser.close();
        proc.stdin.end();
        await new Promise((r) => proc.on('close', r));
      })());
    }
    await Promise.all(jobs);
    const list = path.join(OUTDIR, 'segs.txt');
    fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
    const out = A.out ? path.resolve(A.out) : path.join(OUTDIR, 'reel.mp4');
    const args = ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list];
    if (A.audio) args.push('-i', path.resolve(A.audio));
    args.push('-map', '0:v');
    if (A.audio) args.push('-map', '1:a', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000');
    // HD players decode BT.709: convert explicitly (swscale defaults to BT.601) and tag it
    args.push('-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv');
    args.push('-c:v', 'libx264', '-preset', A.preset || 'slow', '-profile:v', 'high', '-movflags', '+faststart', '-r', String(meta.FPS));
    if (A.bitrate) args.push('-b:v', A.bitrate, '-maxrate', A.maxrate || A.bitrate, '-bufsize', A.bufsize || A.bitrate);
    else args.push('-crf', A.crf || '14', '-tune', 'grain');
    if (A.audio) args.push('-shortest');
    args.push(out);
    await new Promise((res, rej) => { const p = spawn(FFMPEG, args, { stdio: 'inherit' }); p.on('close', (c) => (c ? rej(new Error('ffmpeg ' + c)) : res())); });
    if (!A.keep) for (const s of segs) fs.unlinkSync(s);
    console.log(`video -> ${out} (${to - from} frames) in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
} catch (e) {
  console.error('RENDER FAILED:', e.message);
  process.exitCode = 1;
} finally {
  server.close();
}
