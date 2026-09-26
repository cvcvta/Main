// Exports the edit's timing grid for the soundtrack: node tools/cues.mjs > build/cues.json
import * as C from '../src/config.js';
import { typeSchedule, navHops } from '../src/timing.js';

const { T, S16, STACK, COPY } = C;
const pan = (x) => Math.max(-1, Math.min(1, x / 960));
const typeAt = typeSchedule();
console.log(JSON.stringify({
  bpm: C.BPM, beat: C.BEAT, s16: S16, duration: C.DURATION,
  T: Object.fromEntries(Object.entries(T).filter(([, v]) => typeof v === 'number' || Array.isArray(v))),
  cards: STACK.map((s, i) => ({ t: T.card(i) + 0.02, pan: pan(s.p[0]), y: s.p[1] })),
  clock: [1, 2, 3, 4, 5, 6, 7].map((i) => T.clock(i)),
  admin: COPY.admin.split(' ').map((_, i) => T.admin + i * S16 * 0.6),
  typing: [...COPY.prompt].map((ch, i) => ({ t: typeAt[i], ch })),
  nav: navHops(),
  tagline: COPY.oneLiner.split(' ').map((_, i) => T.tagline + i * S16 * 0.62),
}, null, 1));
