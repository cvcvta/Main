// Everything editorial: copy, palette, the cast, and the beat map.
// Plain ES module with no DOM access so tools/render.mjs and tools/cues.mjs can import it.

export const W = 1920;
export const H = 1080;
export const FPS = 30;
export const DURATION = 15;
export const BPM = 128;
export const BEAT = 60 / BPM; // 0.46875 s. 8 bars of 4/4 = exactly 15.0 s
export const S16 = BEAT / 4;
export const b = (n) => n * BEAT; // beat number -> seconds

// ---------------------------------------------------------------- brand
// Swap these for the official values (or drop assets/brand/brand.json next to the logo files).
export const PALETTE = {
  ivy900: '#07170F', // night / end card base
  ivy800: '#0B2A1F',
  ivy700: '#0F3D2C', // primary dark green
  ivy400: '#2A8A61', // icon highlight
  ivy600: '#17573F',
  ivy500: '#1F7352',
  ivy300: '#8ED3AE',
  ivy100: '#E3F1E8',
  glow: '#52D69A', // light, used sparingly for glows
  fieldHi: '#185A3E', // end-card field, centre to edge
  fieldMid: '#0E3A28',
  fieldLo: '#071A10',
  paper: '#F3F1EA',
  card: '#FFFFFF',
  ink: '#0F1A15',
  ink2: '#5B6660',
  line: '#E4E1D8',
  alert: '#FF7A59',
  cream: '#EEF0E7',
};

export const COPY = {
  brand: 'Ivy',
  oneLiner: 'The business platform with an AI that does the work.',
  price: ['$8.99/week', 'or', '$374.99/year'],
  trial: '14 days free, $0 today.',
  url: 'joinivy.ai',
  stack: '$138', // the site's number
  admin: 'Plus hours of admin at night.',
  platform: 'One platform.',
  prompt: 'When a new client signs up, send them my welcome packet to sign and ask them to book a 15 minute intro call.',
  captions: ['Just ask Ivy.', 'It already knows your business.', 'One tap to approve.'],
};

// The cast: one real solo, never a team.
export const OWNER = {
  first: 'Maya',
  name: 'Maya Reyes',
  initials: 'MR',
  role: 'Portrait photographer',
  business: 'Maya Reyes Photo',
};

// The stack she stitches together. Categories are generic descriptions, no logos.
export const STACK = [
  { name: 'HoneyBook', cat: 'Client CRM', icon: 'tray', badge: 3, p: [-610, -300], r: -4 },
  { name: 'Calendly', cat: 'Scheduling', icon: 'calendar', badge: 2, p: [560, -318], r: 3.5 },
  { name: 'Acuity', cat: 'Appointments', icon: 'clock', badge: 1, p: [-700, -18], r: 2.5 },
  { name: 'QuickBooks', cat: 'Accounting', icon: 'receipt', badge: 4, p: [690, -40], r: -3 },
  { name: 'Mailchimp', cat: 'Email marketing', icon: 'mail', badge: 1, p: [-560, 262], r: -2.5 },
  { name: 'Squarespace', cat: 'Website', icon: 'globe', badge: 2, p: [600, 258], r: 4 },
  { name: 'DocuSign', cat: 'E-signatures', icon: 'pen', badge: 5, p: [30, 372], r: -1.5 },
];

export const NAV = ['Home', 'Clients', 'Bookings', 'Invoices', 'Contracts', 'Messages', 'Marketing', 'Website'];

// ---------------------------------------------------------------- beat map (see README cue sheet)
export const T = {
  // A: 11:48 PM
  card: (i) => b(0.5 * i), // one app per eighth note
  taut: b(3.5),
  slam: b(4), // bar 2 downbeat
  admin: b(4.5),
  clock: (i) => b(5.5) + i * S16, // time-lapse steps on sixteenths
  slice: b(6.5),
  split: b(7),
  // B: one platform
  crane: b(7.25), // camera on the logo, then down the sidebar
  craneEnd: b(9.75),
  platform: b(8), // bar 3 downbeat
  pullOut: b(9.75),
  phone: b(10.5),
  // C: the hero moment
  pushIn: b(12), // bar 4
  typeStart: b(13),
  typeEnd: b(17),
  send: b(17.25),
  think: b(17.5),
  plan: b(17.75),
  rows: [b(18), b(18.25), b(18.5)],
  chips: b(18.75),
  finger: b(19.25),
  tap: b(20), // bar 6 downbeat
  fly: b(20.5),
  land: b(21.25),
  toggle: b(21.75),
  // D: brand
  morph: b(23),
  lockup: b(24), // bar 7 downbeat: the icon lands
  zoom: b(24.5),
  tagline: b(25.5),
  price: b(27),
  trial: b(28), // bar 8 downbeat
  url: b(28.5),
  end: DURATION,
};

// Supers (screen-space captions) during the hero moment.
export const CAPTIONS = [
  [b(12.5), b(17.25), 0],
  [b(17.5), b(19.25), 1],
  [b(19.25), b(21), 2],
];
