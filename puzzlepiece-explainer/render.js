const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const FFMPEG = process.env.FFMPEG, FPS = 30, DUR = 20;
const stills = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.resolve('index.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);
  if (stills) {
    for (const t of stills) { await p.evaluate(t => render(t), t); await p.screenshot({ path: `still_${t}.png` }); }
    return b.close();
  }
  const ff = spawn(FFMPEG, ['-y','-f','image2pipe','-framerate',String(FPS),'-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-preset','medium','-movflags','+faststart','out.mp4'], { stdio: ['pipe','inherit','inherit'] });
  for (let f = 0; f < FPS * DUR; f++) {
    await p.evaluate(t => render(t), f / FPS);
    const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
})();
