// Everything editorial: copy, palette, the cast, and the beat map.
// Plain ES module with no DOM access so tools/render.mjs and tools/cues.mjs can import it.

export const W = 1920;
export const H = 1080;
export const FPS = 30;
export const BPM = 96;
export const BEAT = 60 / BPM; // 0.625 s
export const BARS = 12;
export const DURATION = BARS * 4 * BEAT; // 30.0 s
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
// 96 BPM, 12 bars of 4/4 (bar = 2.5 s). Paced so every line can be read and every move breathes.
export const T = {
  // A: 11:48 PM (bars 1-3)
  intro: b(2), // the opening title (time, name) settles into the corners
  card: (i) => b(3 + 0.5 * i), // one app per eighth note
  taut: b(6.5),
  slam: b(7),
  admin: b(8), // bar 3
  clock: (i) => b(9) + i * S16, // time-lapse steps on sixteenths
  slice: b(11),
  split: b(12), // bar 4: the night falls away, the groove drops
  // B: one platform (bars 4-5)
  crane: b(13), // camera holds on the logo, then runs down the sidebar
  craneEnd: b(15.5),
  platform: b(13),
  pullOut: b(15.5),
  phone: b(16.25),
  // C: the hero moment (bars 5-10)
  pushIn: b(19),
  typeStart: b(20.5),
  typeEnd: b(25.25),
  send: b(25.75),
  think: b(26.25),
  plan: b(26.75),
  rows: [b(27.25), b(27.75), b(28.25)],
  chips: b(28.75),
  finger: b(30.5),
  tap: b(32), // bar 9
  fly: b(33),
  land: b(34.5),
  toggle: b(35),
  // D: brand (bars 10-12)
  morph: b(37.5),
  lockup: b(39), // the icon lands, a beat of air
  zoom: b(40), // bar 11: through the icon
  chip: b(41),
  tagline: b(41.25),
  price: b(43),
  trial: b(44), // bar 12
  url: b(44.5),
  end: DURATION,
};

// Supers (screen-space captions) during the hero moment: [in, out, index].
export const CAPTIONS = [
  [b(19.5), b(25.75), 0],
  [b(26.25), b(30.5), 1],
  [b(30.5), b(34), 2],
];
