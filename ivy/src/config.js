// Everything editorial: copy, palette, the cast, and the beat map.
// Plain ES module with no DOM access so tools/render.mjs and tools/cues.mjs can import it.

export const W = 1920;
export const H = 1080;
export const FPS = 30;
export const BPM = 120;
export const BEAT = 60 / BPM; // 0.5 s
export const BARS = 10;
export const DURATION = BARS * 4 * BEAT; // 20.0 s
export const S16 = BEAT / 4;
export const b = (n) => n * BEAT; // beat number -> seconds

// ---------------------------------------------------------------- brand
// Official palette: #012B24, #004225, #7F8C8D, #ECF0F1, #151515. `leaf` is the bright accent green
// sampled from the joinivy.ai homepage (headline highlight and primary buttons). Everything else is a
// tone derived from these. assets/brand/brand.json can override any key.
export const PALETTE = {
  deep: '#012B24', // official
  green: '#004225', // official
  grey: '#7F8C8D', // official
  mist: '#ECF0F1', // official
  ink: '#151515', // official
  leaf: '#45BF7C', // homepage accent
  // dark UI tones
  page: '#151515',
  surface: '#111716',
  surface2: '#0D1211',
  surface3: '#161E1C',
  panel: '#0C2823',
  edge: 'rgba(236, 240, 241, 0.08)',
  edge2: 'rgba(236, 240, 241, 0.14)',
  dim: '#5F6B6C',
  // end-card field, centre to edge (rebuilt from the app icon's own green)
  fieldHi: '#0B3D34',
  fieldMid: '#042B25',
  fieldLo: '#011C18',
  alert: '#FF6B57',
};

export const COPY = {
  brand: 'Ivy',
  oneLiner: 'The business platform with an AI that does the work.',
  oneLinerHi: 'does', // highlighted in leaf green, as on the homepage
  chip: 'ALL-IN-ONE, FOR SOLOPRENEURS',
  price: ['$8.99/week', 'or', '$374.99/year'],
  trial: '14 days free, $0 today.',
  url: 'joinivy.ai',
  stack: '$138', // the site's number
  admin: 'Plus hours of admin at night.',
  platform: ['One', 'platform.'],
  prompt: 'When a new client signs up, send them my welcome packet to sign and ask them to book a 15 minute intro call.',
  placeholder: 'Ask Ivy anything…',
  // [lines, highlighted word]
  captions: [
    [['Just ask', 'Ivy.'], 'Ivy.'],
    [['She already knows', 'your business.'], 'knows'],
    [['One tap', 'to approve.'], 'approve.'],
  ],
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
// 120 BPM, 10 bars of 4/4. Bar n starts at b(4 * (n - 1)).
export const T = {
  // A: 11:48 PM (bars 1-2)
  card: (i) => b(0.5 * i), // one app per eighth note
  taut: b(3.5),
  slam: b(4), // bar 2
  admin: b(5),
  clock: (i) => b(6) + i * S16, // time-lapse steps on sixteenths
  slice: b(7.5),
  split: b(8), // bar 3: the night falls away, the groove drops
  // B: one platform (bars 3-4)
  crane: b(8.75), // camera holds on the logo, then runs down the sidebar
  craneEnd: b(11.5),
  platform: b(9.5),
  pullOut: b(11.5),
  phone: b(12.25),
  // C: the hero moment (bars 4-8)
  pushIn: b(14),
  typeStart: b(15),
  typeEnd: b(19.5),
  send: b(20), // bar 6
  think: b(20.5),
  plan: b(21),
  rows: [b(21.5), b(22), b(22.5)],
  chips: b(23),
  finger: b(24.5),
  tap: b(26),
  fly: b(26.75),
  land: b(28), // bar 8
  toggle: b(28.5),
  // D: brand (bars 8-10)
  morph: b(30),
  lockup: b(31), // the icon lands
  zoom: b(31.5),
  chip: b(32.75),
  tagline: b(33),
  price: b(35),
  trial: b(36), // bar 10
  url: b(36.5),
  end: DURATION,
};

// Supers (screen-space captions) during the hero moment: [in, out, index].
export const CAPTIONS = [
  [b(14.5), b(20), 0],
  [b(20.5), b(24.5), 1],
  [b(24.5), b(27.5), 2],
];
