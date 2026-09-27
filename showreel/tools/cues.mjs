// Exports the edit's timing grid for the soundtrack script:
//   node tools/cues.mjs [16x9|9x16] > build/cues-<format>.json
import * as C from '../src/config.js';
import { makeLayout } from '../src/layout.js';

const format = process.argv[2] || '16x9';
const LY = makeLayout(format);
const { T } = C;
// stereo position of each card, from its centre on screen
const cardPan = [0, 1, 2, 3, 4, 5].map((i) => {
  const r = LY.slot(i);
  return (r.x + r.w / 2 - LY.W / 2) / (LY.W / 2);
});
console.log(JSON.stringify({
  format, bpm: C.BPM, beat: C.BEAT, duration: C.DURATION,
  hookWords: C.HOOK.map((_, i) => T.hookWord(i)),
  cardEnter: [0, 1, 2, 3, 4, 5].map((i) => 0.05 + i * 0.055),
  cardPan,
  hopStart: T.hopStart, s16: C.S16, hops: T.hops,
  dive: T.dive, subj: T.subj, pull: T.pull, reveal: T.reveal,
  flips: [0, 1, 2, 3, 4, 5].map((i) => T.flip(i)),
  correction: T.correction, slam: T.slam, brand: T.brand, solid: T.solid,
  tagline: LY.v ? T.taglineV : T.tagline,
  reflow: LY.v ? T.reflow : null,
  dot: T.dot, land: T.land, ai: T.ai,
}, null, 1));
