// node render.js <timeline.json> <out_dir> [--stills t1,t2] [--sub 4] [--shard k/n]
// Full mode writes out_dir/s%06d.jpg at fps*sub; average with ffmpeg tmix for a 180°-ish shutter.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [tlPath, outDir] = process.argv.slice(2);
  const arg = n => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
  const stills = arg('--stills') ? arg('--stills').split(',').map(Number) : null;
  const sub = Number(arg('--sub') || 4);
  const [shard, shards] = (arg('--shard') || '0/1').split('/').map(Number);
  fs.mkdirSync(outDir, { recursive: true });
  const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('[pageerror]', e.message); process.exitCode = 1; });
  page.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  const info = await page.evaluate(t => window.init(t), tl);
  fs.writeFileSync(path.join(outDir, 'scenes.json'), JSON.stringify(info.B));
  fs.writeFileSync(path.join(outDir, 'events.json'), JSON.stringify(info.EVENTS));
  const shot = async (t, file) => {
    await page.evaluate(t => window.renderFrame(t), t);
    await page.screenshot({ path: file, type: 'jpeg', quality: 92 });
  };
  if (stills) { for (const t of stills) await shot(t, path.join(outDir, `still_${t.toFixed(2)}.jpg`)); }
  else {
    const n = Math.round(tl.duration * tl.fps * sub);
    // shutter: samples spread over half a frame, centred on the frame time
    for (let i = shard; i < n; i += shards) {
      const f = Math.floor(i / sub), s = i % sub;
      const t = f / tl.fps + (s / sub - 0.5 + 0.5 / sub) * 0.5 / tl.fps;
      await shot(Math.max(0, t), path.join(outDir, `s${String(i).padStart(6, '0')}.jpg`));
      if (i % 600 === 0) console.log('sample', i, '/', n);
    }
  }
  await browser.close();
})();
