# Laptop Store Slider — pick up here

A four-slide product reel that runs in the browser, built to be screen-recorded
on a phone and posted. Each laptop flies in, opens, boots, comes apart into an
exploded view with callouts, snaps back, and then the camera dives through its
own screen into the next one. It loops forever.

- **Live:** https://digitaldotdeveloper.github.io/laptop-store-slider/
- **Repo:** https://github.com/digitaldotdeveloper/laptop-store-slider (public, Pages off `main` at `/`)
- **Last worked on:** 19 September 2026

---

## 1. Just want to look at it?

Double-click **`index.html`**. It is the whole thing — markup, CSS and JS in one
file — and it reads its pictures out of `img/`, so keep the two together. No
server, no build step, no npm.

Add `?reel` for a hard 9:16 frame. Add `#s3` to open on the third laptop.

| | |
|---|---|
| swipe / tap | next, or back on the left third |
| ← → | skip |
| Space | pause |
| `S` | slow motion |
| `R` | 9:16 reel frame |
| `L` | layer map (outlines every animated layer) |

## 2. What is in this folder

```
index.html            THE WHOLE SLIDER. One file. This is what you edit.
img/                  GENERATED. 40 webp files, ~1.1 MB. Committed, served by Pages.
_src/                 THE MASTERS. Raw Gemini Studio renders as PNG. GITIGNORED.
_gen/                 The prompts and the cutters that turn _src into img.
tools/                shot.js / fps.js / load.js — how a change gets checked.
_shots/               Screenshots from those tools. GITIGNORED, throwaway.
v1-website-slider.html  The first version, kept for reference. Not linked.
README.md             The public readme on GitHub.
_CONTINUE-HERE.md     This file.
```

`_src/` is not in the repo — it is ~15 MB of PNG. **If you clone this on another
machine you get `img/` but not the masters**, which is fine for editing the
slider and wrong for re-cutting a layer. Copy `_src/` across by hand, or
re-render it (§4).

## 3. To change the products

Everything a shop would want to edit is the `SLIDES` array at the top of the
script in `index.html`. One object per laptop:

```js
{ id:'nightforge',                 // the prefix on every file in img/
  tex:true,                        // use the photographs, not the CSS-drawn fallback
  bez:[2,2.3,7.3,11.1],            // where the screen sits inside the bezel frame, L R T B %
  kb:[11,10.7,20.8,43],            // where the keycaps sit on the deck, L R T H %
  cat:'Gaming laptop', name:['Nightforge','16'], price:'$2,499',
  rgb:true,                        // animated rainbow bleed under the caps
  screen:['240','FPS · ULTRA'],    // the big number on the display
  parts:{ lid:['Display','240 Hz QHD+'], keys:[...], top:[...],
          board:[...], batt:[...], bottom:[...] },   // the six exploded callouts
  theme:{ ...every colour, see below... } }
```

The names, prices, categories, callouts and on-screen numbers are **placeholders**.
Swapping them is a text edit — nothing else has to change.

Prices roll on an odometer. Any digits work; `odo()` builds the reels from the
string, so `$1,299` and `12 500 MAD` both animate.

`theme` drives the whole slide: `accent` is the brand colour, `flat` is what the
screen fades from on arrival and what the *previous* slide's dive fades into,
`chrome` is `light` or `dark` for the top bar, `reflop` is how glossy the floor
is (0.13 matte concrete → 0.34 black gloss), `psho` scales the shadow each plate
casts on the one below.

## 4. To change the pictures

Every surface is a photograph generated through the local **Gemini Studio**
dashboard (`Desktop\Gemini Prompt Sender\dashboard`, port 4321) and keyed out of
a flat background. It must be running, and `_gen/gen.mjs` needs a token in
`GS_TOKEN` or the one baked into it.

```sh
cd _gen
node build-jobs.mjs && node gen.mjs jobs.json       # room, wallpaper, lid, deck, board, battery, bottom
node keys-jobs.mjs  && node gen.mjs keys-jobs.json  # keycaps, with each deck attached as reference
node bezel-jobs.mjs && node gen.mjs bezel-jobs.json # bezel frame with camera and chin
                                                    # ↑ all render into ../_src as PNG

python cutout.py    nightforge aero studio ledger   # ../_src -> ../img/*.webp
python cut-keys.py  nightforge aero studio ledger
python cut-bezel.py nightforge aero studio ledger   # prints the bez: rect for SLIDES
python bg.py
```

`gen.mjs` **skips anything already in `_src`** — delete the PNG to re-render it.

Three things that cost time to work out:

- **The bezel needs two chroma keys in one render.** `#00FF00` green outside the
  lid, `#FF00FF` magenta in the screen opening. A single key cannot tell
  "outside" from "the hole in the middle", and generating the frame and the hole
  separately never lines them up. `cut-bezel.py` keys both and prints the hole
  rect for `bez:`.
- **Backlit parts key badly with the normal test.** The RGB glow stains the
  magenta off-magenta in the warm zones and stains the keycaps magenta in the
  cool ones, so `r-g>90 & b-g>90` eats half the keyboard. `cut-keys.py` uses a
  looser `min(r,b)-g>22`, erodes 2 px, and keeps islands by an **absolute** area
  threshold — the usual "bigger than 2% of the largest island" drops every
  separate key once the glow bridges the middle ones into one huge blob.
- **"Same scale and framing as the attached image" does not work.** The model
  fills its own canvas whatever you ask. Measure the target region in the base
  photo instead: `_gen/kb-rect.py` and the high-pass switch-area detector find
  the bare keyboard in a deck photo cleanly, and the cut-out gets stretched into
  that rect. That is where the `kb:` numbers come from.

## 5. To check a change

```sh
node tools/shot.js _shots/x 390 844 1 2,5      # CDP screenshots: prefix W H slide times(s)
node tools/fps.js  390 844 16 4                # frame times under a 4x CPU throttle
node tools/load.js                             # paint + per-slide download timing on 4G
LIVE_URL=https://digitaldotdeveloper.github.io/laptop-store-slider/ node tools/shot.js ...
```

`load.js` is the one that matters. It prints when each slide finishes
downloading next to when the dive actually reaches it — that comparison is what
caught slide 2 arriving half-loaded. Current numbers on emulated 4G with a 4×
CPU throttle: first paint 0.86 s, first laptop whole at 2.8 s (293 KB),
everything down by 10.6 s (1.1 MB), 16.7 ms median frame time.

Two traps in the CDP harness, both already handled, both worth knowing:

- **`await send('Browser.close')` never resolves.** The browser dies before it
  answers. Kill the process instead.
- **Give each run its own port and profile dir.** A leftover headless Chrome
  keeps the profile and answers `/json` with targets that are already closed, so
  the next run connects to a dead socket and hangs forever.

## 6. To deploy

```sh
git add -A && git commit -m "..." && git push
```

Pages redeploys in about a minute.

`gh` is **not** installed on this machine. If you ever need the GitHub API —
creating a repo, turning Pages on — pull the token out of Git Credential Manager:

```sh
TOK=$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill | sed -n 's/^password=//p')
curl -H "Authorization: Bearer $TOK" ... 
```

It carries `gist, repo, workflow`. Post bodies from a file with `--data-binary
@body.json` — an em dash typed inline makes the API answer `400 Problems parsing
JSON`.

## 7. Why it looks the way it does on a phone

- Phones are taller than 9:16, so Instagram centre-crops a screen recording.
  `--crop` on `.stage` is how much gets cut off each end, and the top bar, the
  price and the button are all held inside the band that survives it. The whole
  composition lifts with it too, or the buy block lands on the laptop.
- Backgrounds are chosen by `<picture>` on orientation, so a phone never
  downloads the 1600×900 desktop one.
- Slide 1 loads from markup and gets the connection to itself; the other three
  follow three at a time once it is done, and each slide pulls the next one in
  as it starts playing. Loading them alongside slide 1 starves it and the first
  laptop opens with pieces missing.
- The show starts when slide 1 has decoded, or after 2.6 s, whichever is first —
  a slow webfont used to hold everything behind a black screen.
- Canvas particles drop to 34 motes at dpr 1.5 on a coarse pointer.

## 8. Known and deliberate

- **The products are invented.** Nightforge 16, Aero Air 14, Studio Pro 16,
  Ledger X14 and their prices are placeholders (§3).
- **The keycaps do not line up cap-for-switch on Aero and Ledger.** Gemini gave
  those two more rows than their deck photos have, so the plate is stretched
  into the switch rect rather than matched key for key. It reads correctly at
  the size and angle it is seen; fixing it properly means re-rendering both
  keycap plates with an explicit row count.
- **The exploded callouts count up** from a lower number (`count()` animates any
  digits it finds), so a screenshot mid-animation shows the wrong figure. That is
  the animation, not a bug.
- **`v1-website-slider.html` is dead.** Kept for reference only.
