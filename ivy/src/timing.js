// Pure timing helpers shared by the picture (world.js) and the soundtrack cue export (tools/cues.mjs).
import { T, COPY, S16 } from './config.js';
import { lerp, inv, hash } from './engine.js';

// Word-by-word reveals: when word i of "Plus hours of admin at night." and of the end line starts.
export const adminAt = (i) => T.admin + i * S16 * 0.8;
export const taglineAt = (i) => T.tagline + i * S16 * 0.62;

// Typing: word bursts with human-ish gaps, normalised to the typing window. Returns one time per character.
export function typeSchedule() {
  const gaps = [...COPY.prompt].map((ch, i) => {
    let g = 0.75 + 0.5 * hash(i * 1.7 + 3);
    if (ch === ' ') g += 1.1 + 0.9 * hash(i + 11);
    if (ch === ',') g += 2.8;
    return g;
  });
  const total = gaps.reduce((a, v) => a + v, 0);
  let acc = 0;
  return gaps.map((g) => { acc += g; return T.typeStart + (acc / total) * (T.typeEnd - T.typeStart); });
}

// Trapezoidal velocity profile: accelerate, cruise, decelerate (a = fraction of time spent on each ramp).
function trapezoid(u, a = 0.28) {
  const v = 1 / (1 - a);
  if (u <= a) return (v * u * u) / (2 * a);
  if (u >= 1 - a) return 1 - (v * (1 - u) * (1 - u)) / (2 * a);
  return v * (a / 2) + v * (u - a);
}

// Crane down the sidebar: continuous nav index, -1.72 = the logo, 7 = Website. Cruises at an even pace
// so the highlight ticks through the menu like a run of sixteenths.
export const kfCrane = (t) => lerp(-1.72, 7, trapezoid(inv(T.crane + 0.05, T.craneEnd, t)));

// Times the sidebar highlight hops to nav item k (k = 0..7) during the crane.
export function navHops() {
  const out = [];
  let prev = -1;
  for (let t = T.crane; t <= T.craneEnd + 0.01; t += 0.001) {
    const k = Math.max(0, Math.min(7, Math.round(kfCrane(t))));
    if (kfCrane(t) >= -0.5 && k !== prev) { out.push([k, +t.toFixed(3)]); prev = k; }
  }
  return out;
}
