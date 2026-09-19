# Laptop Store Slider

A four-slide product reel that runs in the browser. Each laptop flies in, opens, boots,
comes apart into an exploded view with callouts, snaps back, and then the camera dives
through its own screen into the next one. It loops forever.

**Live:** _(GitHub Pages)_ · **9:16 frame:** add `?reel` · **Start on a slide:** `#s3`

## Controls

| | |
|---|---|
| swipe / tap | next, or back on the left third |
| ← → | skip |
| Space | pause |
| `S` | slow motion |
| `R` | 9:16 reel frame |
| `L` | layer map |

## Built for a phone

The slider is meant to be screen-recorded on a phone and posted. Phones are taller than
9:16, so Instagram centre-crops the recording — the chrome, the price and the button are
all held inside the band that survives that crop (`--crop` in the stylesheet).

The opening slide's images load from markup; the other three drip in one at a time once
the first laptop has landed, so nothing decodes during the animation. Backgrounds are
picked per orientation by `<picture>`, so a phone never downloads the desktop one.
Measured on a 4×-throttled phone profile: 60 fps median, ~290 KB for the first slide.

## Where the pictures come from

Every part is a photograph generated through the local **Gemini Studio** dashboard and
keyed out of a flat background:

| layer | prompt lives in | keyed on |
|---|---|---|
| lid, deck, board, battery, bottom, screen, room | `_gen/build-jobs.mjs` | magenta |
| keycaps (matched to each deck's bare switches) | `_gen/keys-jobs.mjs` | magenta |
| bezel frame with camera and chin | `_gen/bezel-jobs.mjs` | green outside, magenta in the screen hole |

```sh
cd _gen
node build-jobs.mjs && node gen.mjs jobs.json        # renders into ../_src
python cutout.py nightforge aero studio ledger       # ../_src -> ../img/*.webp
python cut-keys.py  nightforge aero studio ledger
python cut-bezel.py nightforge aero studio ledger    # also prints the screen-hole rect
python bg.py
```

`_gen/kb-rect.py` and the switch-area detector print the `kb:` and `bez:` rectangles that
`SLIDES` in `index.html` uses to sit the keycaps on the deck and the screen in the bezel.

## Checking a change

```sh
node tools/shot.js _shots/x 390 844 1 2,5     # CDP screenshots at a real device size
node tools/fps.js  390 844 16 4               # frame times under a 4x CPU throttle
```
