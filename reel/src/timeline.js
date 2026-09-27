// Edit decision list. 100 BPM -> one beat = 0.6s = 18 frames at 30 fps.
import * as I from './scenes/intro.js';
import * as SA from './scenes/sectionA.js';
import * as SB from './scenes/sectionB.js';
import * as SC from './scenes/sectionC.js';
import * as SD from './scenes/sectionD.js';
import * as SE from './scenes/sectionE.js';

export const BPM = 100;
export const BEAT = 60 / BPM;
export const FPS = 30;
export const b = (n) => n * BEAT;

const defs = [
  // INTRO
  ['markBuild', 0, 2, I.markBuild()],
  ['asciiMark', 2, 4, I.asciiMark()],
  ['appIcon', 4, 5, I.appIcon()],
  ['marbleCarve', 5, 5.5, I.marbleCarve()],
  ['embossCard', 5.5, 6, I.embossCard()],
  // SECTION A
  ['tagCard', 6, 6.5, SA.tagCard()],
  ['kineticSerif', 6.5, 8.5, SA.kineticSerif()],
  ['posters', 8.5, 10, SA.posters()],
  ['webSplit', 10, 11, SA.webSplit()],
  ['aiPrompt', 11, 13, SA.aiPrompt()],
  ['aiGenerate', 13, 14, SA.aiGenerate()],
  // SECTION B
  ['glassMark', 14, 16.5, SB.glassMark()],
  ['wordStack', 16.5, 17, SB.wordStack()],
  ['posterWall', 17, 17.5, SB.posterWall()],
  ['stickers', 17.5, 18, SB.stickers()],
  ['wordBuild', 18, 20, SB.wordBuild()],
  ['layerMark', 20, 21, SB.layerMark()],
  ['photoLogo', 21, 22, SB.photoLogo()],
  // SECTION C
  ['badge', 22, 22.5, SC.badge()],
  ['cardSlide', 22.5, 23.5, SC.cardSlide()],
  ['imageGrid', 23.5, 24.5, SC.imageGrid()],
  ['giantAI', 24.5, 27, SC.giantAI()],
  ['processLine', 27, 30, SC.processLine()],
  // SECTION D
  ['luxury', 30, 31, SD.luxury()],
  ['waxSeal', 31, 32, SD.waxSealShot()],
  ['iconMorph', 32, 35, SD.iconMorph()],
  ['editorial', 35, 35.5, SD.editorial()],
  ['mintMark', 35.5, 36, SD.mintMark()],
  ['blackWord', 36, 36.5, SD.blackWord()],
  ['markGrid', 36.5, 37, SD.markGrid()],
  ['uiCards', 37, 38, SD.uiCards()],
  // SECTION E: pixel frame, accelerating flash montage, the loader
  ['pixelFrame', 38, 39.5, SE.pixelFrame()],
  ['f01', 39.5, 40, SE.flash('spinRed')],
  ['f02', 40, 40.5, SE.flash('wordCrop')],
  ['f03', 40.5, 41, SE.flash('ascii')],
  ['f04', 41, 41.5, SE.flash('icon')],
  ['f05', 41.5, 41.75, SE.flash('glass')],
  ['f06', 41.75, 42, SE.flash('serif')],
  ['f07', 42, 42.25, SE.flash('marble')],
  ['f08', 42.25, 42.5, SE.flash('chevInk')],
  ['f09', 42.5, 42.625, SE.flash('yellow')],
  ['f10', 42.625, 42.75, SE.flash('blueWord')],
  ['f11', 42.75, 42.875, SE.flash('machine')],
  ['f12', 42.875, 43, SE.flash('whiteRed')],
  ['spinner', 43, 44, SE.spinnerBlack()],
  // END CARD
  ['endCard', 44, 50, SE.endCard()],
];

export const SHOTS = defs.map(([id, b0, b1, scene]) => ({ id, start: b(b0), end: b(b1), scene }));
export const DURATION = SHOTS[SHOTS.length - 1].end;
export function shotAt(t) {
  for (const s of SHOTS) if (t >= s.start && t < s.end) return s;
  return SHOTS[SHOTS.length - 1];
}
export function cueList() {
  const out = [];
  for (const s of SHOTS) for (const c of s.scene.cues || []) out.push({ ...c, t: +(s.start + c.t).toFixed(4), shot: s.id });
  return out.sort((a, b) => a.t - b.t);
}
