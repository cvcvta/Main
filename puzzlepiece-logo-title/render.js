// Renders render(t) with real motion blur: 240 sub-frames/s, each output frame
// blends 3 neighbouring sub-frames (≈270° shutter), delivered at 60 fps.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const FFMPEG = process.env.FFMPEG, DUR = 5, SUB = 240, OUT = 60;
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
  const ff = spawn(FFMPEG, ['-y', '-f', 'image2pipe', '-framerate', String(SUB), '-i', '-',
    '-vf', `tmix=frames=3,select='not(mod(n\\,${SUB / OUT}))',setpts=N/${OUT}/TB`, '-r', String(OUT),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'slow', '-movflags', '+faststart', 'out.mp4'],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = 0; f < SUB * DUR; f++) {
    await p.evaluate(t => render(t), f / SUB);
    const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
})();
