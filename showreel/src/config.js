// Everything that defines the edit: copy, timing grid, and which footage goes where.
// Plain ES module with no DOM access, so tools/render.mjs can import it too.

export const W = 1920;
export const H = 1080;
export const FPS = 30;
export const DURATION = 15;
export const BPM = 128;
export const BEAT = 60 / BPM; // 0.46875s; 8 bars of 4/4 = exactly 15.0s
export const S16 = BEAT / 4;
export const b = (n) => n * BEAT; // beat number -> seconds

export const BRAND = 'CVCVTA';
export const TAG_TOP = 'AI UGC STUDIO';
export const TAGLINE = 'Every face in this reel was generated.';

export const HOOK = ['One', 'of', 'these', 'creators', 'is', 'AI.'];
export const SUBHOOK = 'CAN YOU TELL WHICH?';

// Source clips: footage/clip_<id>.mp4 (9:16, 24 fps). Frames go to build/frames/<id>/%05d.jpg.
export const CLIPS = {
  a: 'skincare, freckles, golden hour',
  b: 'truck, peptide vial',
  c: 'fragrance, golden hour',
  d: 'haircare GRWM',
  e: 'serum review',
};
export const SRC_FPS = 24;

// Six lineup cards -> later the six letters of CVCVTA.
// lin: source time the card starts at when the reel starts.
// ret: source time when the cards come back after the scan (plays, freezes at the reveal, resumes in the letters).
export const CARDS = [
  { clip: 'a', lin: 0.30, ret: 14.60, tag: 'Skincare', focus: [0.50, 0.34] },
  { clip: 'b', lin: 3.55, ret: 5.00, tag: 'Wellness', focus: [0.54, 0.45] },
  { clip: 'e', lin: 16.05, ret: 16.10, tag: 'Beauty', focus: [0.46, 0.33] },
  { clip: 'c', lin: 6.00, ret: 6.00, tag: 'Fragrance', focus: [0.46, 0.30] },
  { clip: 'd', lin: 20.55, ret: 21.00, tag: 'Haircare', focus: [0.48, 0.40] },
  { clip: 'e', lin: 0.40, ret: 9.20 + 3 * (60 / 128), tag: 'Serums', focus: [0.54, 0.34] }, // continues the last scan shot
];

// Beat map (see README for the full cue sheet).
export const T = {
  hookWord: (i) => b(1) + i * (BEAT / 2),
  hopStart: b(4),
  hops: [0, 1, 2, 3, 4, 5, 2, 0],
  dive: b(6),
  subj: [b(7), b(9), b(11), b(13), b(15)],
  pull: b(18),
  reveal: b(20),
  flip: (i) => b(20) + i * S16,
  correction: b(21) + S16 * 2.5,
  slam: b(22),
  brand: b(24),
  solid: b(26.5),
  tagline: b(27),
  dot: b(28),
  end: DURATION,
};

// The forensic scan. fx = extra callout drawn for that subject.
export const SUBJECTS = [
  {
    slot: 0, clip: 'a', t: 16.05, cat: 'Skincare', zoom: 1.0, focus: [0.5, 0.5], fx: 'loupe',
    loupe: [0.44, 0.31], checks: [['PORE DETAIL', 'PASS'], ['FRECKLE MAP', 'PASS'], ['SUBSURFACE SCATTER', 'PASS']],
    conf: 99.2, meta: ['00:20:02', 'HANDHELD', 'GOLDEN HOUR'],
  },
  {
    slot: 1, clip: 'b', t: 0.10, cat: 'Wellness', zoom: 1.0, focus: [0.5, 0.5], fx: 'hands',
    boxes: [{ r: [0.0, 0.23, 0.50, 0.86], label: 'FINGERS  5/5' }, { r: [0.32, 0.50, 0.53, 0.68], label: 'LABEL  LEGIBLE' }],
    checks: [['FINGER COUNT', '5 / 5'], ['KNUCKLE CREASES', 'PASS'], ['LABEL TEXT', 'LEGIBLE']],
    conf: 98.7, meta: ['00:15:04', 'DASH MOUNT', 'OVERCAST'],
  },
  {
    slot: 3, clip: 'c', t: 3.05, cat: 'Fragrance', zoom: 1.0, focus: [0.5, 0.5], fx: 'light',
    point: [0.47, 0.15], label: 'SPECULAR  SUN', checks: [['SUN FALLOFF', 'PASS'], ['SPECULAR SKIN', 'PASS'], ['HAIR TRANSLUCENCY', 'PASS']],
    conf: 99.4, meta: ['00:09:02', 'SELFIE CAM', 'HARD SUN'],
  },
  {
    slot: 4, clip: 'd', t: 20.65, cat: 'Haircare', zoom: 1.0, focus: [0.5, 0.5], fx: 'hair',
    point: [0.18, 0.47], label: 'STRANDS  RESOLVED', checks: [['STRAND DETAIL', 'PASS'], ['FLYAWAYS', 'PASS'], ['CATCHLIGHTS', 'PASS']],
    conf: 98.9, meta: ['00:24:01', 'SELFIE CAM', 'WINDOW LIGHT'],
  },
  {
    slot: 5, clip: 'e', t: 9.20, cat: 'Serums', zoom: 1.5, focus: [0.52, 0.36], fx: 'expr',
    checks: [['MICRO-EXPRESSION', 'PASS'], ['BLINK RATE', '17 / MIN'], ['ASYMMETRY', 'NATURAL']],
    conf: 99.6, meta: ['00:20:03', 'TRIPOD', 'LAMP + WINDOW'],
  },
];

export const SECTIONS = [
  [0, '01 — THE LINEUP'],
  [b(6), '02 — FORENSICS'],
  [b(20), '03 — THE VERDICT'],
  [b(24), '04 — CVCVTA'],
];
