# PuzzlePiece — logo title (5 s, 9:16 + 16:9, 60 fps)

## PAGE
- Problem: the logo intro so far read as "AI animation" (spiral, spin, circle wipe, generic springs).
- Audience: parents of autistic kids watching PuzzlePiece ads on social; the title opens or closes those ads.
- Goal: the PuzzlePiece mark arrives with a physical cause, smooth and calm, and is unmistakably theirs.
- Emotion: warm, calm, crafted — a picture book, not a tech launch.
- One true thing: the PuzzlePiece mark is literally built from overlapping translucent colour bands
  (green, amber, red, maroon, deep green/teal). That construction is the brand's own material.

## Inventory
| logo shape | one puzzle piece made of 5 overlapping translucent colour bands |
| core control | a story page; a piece that fits |
| material | translucent colour overlapping on warm paper (a printed picture book) |
| key verb | fit / come together / "made personal" |
| success moment | the piece clicks into place; the child's story is ready |
| voice | warm, plain, reassuring ("Calmer days. More confident kids.") |
| colour logic | warm cream paper, deep green ink (#184e45), butter warmth as light |
| type | wordmark is their own slab-serif lockup (raster from their end card) |
| never | neon, glitch, spinning 3D chrome, frantic energy |

## Ideas (three kinds)
1. **Print registration** (chosen): the five colour plates of the icon float a few mm above warm paper,
   off-register like a picture book on the press; they drift down and slide into register, shadows tightening
   until they touch paper with one small press — then the wordmark is printed beside it, its ink ghosts
   (butter, teal) converging into register.
2. Held shot: a single paper page; the icon's socket is pressed into it and the piece drops in from above.
3. Typographic: "PuzzlePiece" set in pieces, one letter missing, the icon fills the gap.
Why 1: it is made of the actual logo (cover-the-logo fails because the plates ARE the logo), it shows the
brand's own idea — many parts becoming one fitted whole — and it is a picture-book/printing world, not tech.
Rejected from the previous version: spiral + spin (category default), circle iris wipe (Never-ship 7),
bouncing letters on springs everywhere.

## World
- Ground: warm cream paper (their own end-card gradient: butter warmth top-left) + paper tooth (static noise, multiply).
- Light: one warm key from top-left; shadows fall down-right; translucent plates cast tinted shadows.
- Depth: plates at height h above the paper (shadow offset/blur ∝ h); camera starts macro (2.0x) slightly
  defocused and racks into focus as the plates land (depth of field spent once).
- Texture: paper tooth + light render grain. Blur grammar: shutter blur only (180°, 8 sub-frames).
- Sound: none (no ElevenLabs key in this environment; the user also asked for no generated VO earlier). Silent draft.

## Hero frame (screenshot)
~1.2 s: five translucent colour gels, large in frame, overlapping into mixed colours just off register,
each casting a soft coloured shadow on warm paper, focus just arriving.

## Beats (one continuous shot)
| t (s) | role | buys | what moves | entry / exit |
|---|---|---|---|---|
| 0.0–1.0 | hook | the viewer sees coloured gels over paper and wants them to line up | plates mid-drift (already moving at f0), camera 2.0x defocused → focus | ease-out drift, rack focus 0→1 s |
| 1.0–2.15 | turn | the pieces belong together | plates slide into register on staggered soft landings, lower to the paper, shadows tighten; camera pulls back | softLand tails, last plate lands 2.15 s; one 2-f press at contact |
| 2.15–3.1 | proof | it is PuzzlePiece | wordmark printed letter by letter, ink ghosts converge (1–3 f uneven gaps) | ghosts converge 0.35 s each |
| 3.1–5.0 | cta | the mark registers | one light sweep across the icon (3.35–4.0), slow camera contraction accelerating into the last frame | ends mid-contraction |
Importance: hero = the register moment (≤25% of beats are "the point": 1 of 4).
Gates pre-check: G1 n/a (no UI), G3 resolved hold ~1.9 s with a sweep and contraction alive (see NOTE), G4 one hero.
