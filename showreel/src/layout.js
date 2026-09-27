// Per-format geometry. Timing lives in config.js; everything spatial lives here.
// Pick a format with ?format=9x16 (page) or --format 9x16 (tools/render.mjs).

export const FORMATS = { '16x9': [1920, 1080], '9x16': [1080, 1920] };

export function makeLayout(format = '16x9') {
  if (!FORMATS[format]) throw new Error(`unknown format ${format}`);
  const [W, H] = FORMATS[format];
  if (format === '16x9') {
    const CW = 240, CH = 427, GAP = 28, X0 = (W - (6 * CW + 5 * GAP)) / 2, CY = 392;
    return {
      format, W, H, v: false,
      slot: (i) => ({ x: X0 + i * (CW + GAP), y: CY, w: CW, h: CH, r: 16 }),
      panel: { x: 696, y: 72, w: 528, h: 936, r: 22 },
      chrome: { top: 38, side: 48, bottom: H - 54 },
      hook: { top: 176, size: 94, brk: -1 },
      subTop: 322,
      summaryTop: 336,
      cardLabels: 'below',
      scan: 'columns',
      slamTop: 430,
      // wordmark: letter rows for the faces-in-letters moment, then one final line
      wm: { rows: [[0, 1, 2, 3, 4, 5]], maxA: 268, centerA: 478, margin: 90, centerFinal: 478, rowGap: 0 },
      glowY: 478,
      washY: 600,
      loupe: (r) => [r.x + 172, r.y + r.h - 250],
      hairLabel: 'outside',
    };
  }
  const CW = 263, CH = 468, GX = 30, GY = 30, X0 = (W - (3 * CW + 2 * GX)) / 2, Y0 = 640;
  return {
    format, W, H, v: true,
    slot: (i) => ({ x: X0 + (i % 3) * (CW + GX), y: Y0 + Math.floor(i / 3) * (CH + GY), w: CW, h: CH, r: 18 }),
    panel: { x: 180, y: 300, w: 720, h: 1280, r: 24 },
    chrome: { top: 56, side: 48, bottom: H - 72 },
    hook: { top: 252, size: 128, brk: 2 },
    subTop: 572,
    summaryTop: 572,
    cardLabels: 'inside',
    scan: 'overlay',
    slamTop: 690,
    wm: { rows: [[0, 1, 2], [3, 4, 5]], maxA: 380, centerA: 980, margin: 64, centerFinal: 950, rowGap: 64 },
    glowY: 960,
    washY: 1100,
    loupe: (r) => [r.x + 190, r.y + r.h * 0.56],
    hairLabel: 'inside',
  };
}
