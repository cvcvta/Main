// Exports the edit's timing grid for the soundtrack script: node tools/cues.mjs > build/cues.json
import * as C from '../src/config.js';
const { T } = C;
const cardX = (i) => (C.W - (6 * 240 + 5 * 28)) / 2 + i * 268 + 120;
console.log(JSON.stringify({
  bpm: C.BPM, beat: C.BEAT, duration: C.DURATION,
  hookWords: C.HOOK.map((_, i) => T.hookWord(i)),
  cardEnter: [0, 1, 2, 3, 4, 5].map((i) => 0.05 + i * 0.055),
  cardPan: [0, 1, 2, 3, 4, 5].map((i) => (cardX(i) - 960) / 960),
  hopStart: T.hopStart, s16: C.S16, hops: T.hops,
  dive: T.dive, subj: T.subj, pull: T.pull, reveal: T.reveal,
  flips: [0, 1, 2, 3, 4, 5].map((i) => T.flip(i)),
  correction: T.correction, slam: T.slam, brand: T.brand, solid: T.solid, tagline: T.tagline, dot: T.dot,
}, null, 1));
