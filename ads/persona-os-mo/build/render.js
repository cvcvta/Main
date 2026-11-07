// Usage: node render.js <timeline.json> <frames_dir> [--stills t1,t2,...]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [tlPath, outDir] = process.argv.slice(2);
  const stillsArg = process.argv.indexOf('--stills');
  const stills = stillsArg > 0 ? process.argv[stillsArg + 1].split(',').map(Number) : null;
  fs.mkdirSync(outDir, { recursive: true });
  const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
  const here = __dirname;
  const imgs = {};
  for (const k of ['desk', 'spot', 'cta'])
    imgs[k] = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(here, 'plates', k + '.jpg')).toString('base64');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => { console.error('[pageerror]', e.message); process.exitCode = 1; });
  await page.goto('file://' + path.join(here, 'render.html'));
  const bounds = await page.evaluate(([t, i]) => window.init(t, i), [tl, imgs]);
  console.log('scene starts', JSON.stringify(bounds));
  fs.writeFileSync(path.join(outDir, 'scenes.json'), JSON.stringify(bounds));
  const times = stills || Array.from({ length: Math.round(tl.duration * tl.fps) }, (_, f) => f / tl.fps);
  for (let n = 0; n < times.length; n++) {
    const data = await page.evaluate(t => { window.renderFrame(t); return document.getElementById('c').toDataURL('image/jpeg', 0.93); }, times[n]);
    const name = stills ? `still_${times[n].toFixed(2)}.jpg` : `f${String(n).padStart(5, '0')}.jpg`;
    fs.writeFileSync(path.join(outDir, name), Buffer.from(data.split(',')[1], 'base64'));
    if (!stills && n % 150 === 0) console.log('frame', n, '/', times.length);
  }
  await browser.close();
})();
