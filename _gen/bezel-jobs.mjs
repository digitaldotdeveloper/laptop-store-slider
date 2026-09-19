// A real bezel frame to sit over the screen art: camera, chin, inner rim — the CSS box could not
// do any of it. Two keys, because the frame needs a hole in the middle as well as an outside.
//   node bezel-jobs.mjs && node gen.mjs bezel-jobs.json
import { writeFile } from 'node:fs/promises'
const MODELS = {
  nightforge: 'a matte black aluminium gaming laptop with sharp angular edges and thin red accent details',
  aero:       'an ultra-thin silver aluminium ultrabook with soft rounded edges and a clean minimalist finish',
  studio:     'a dark graphite space-grey aluminium creator laptop with a precise premium finish',
  ledger:     'a dark charcoal business laptop with a soft-touch matte finish and a rugged professional design',
}
const jobs = Object.entries(MODELS).map(([id, look]) => ({
  name: `${id}-bezel`,
  edit: `${id}-lid`,
  prompt: `The attached photograph is the closed outer lid of ${look}.

Produce the FRONT of that same display lid, opened and seen face on: the bezel frame around the screen, and nothing else.

Flat orthographic front view, no perspective and no tilt, the lid perfectly straight and centred, filling about 92% of the frame width. Wide 16:9 image. Crisp realistic product photography.

The bezel is a narrow frame in the same material and finish as the attached lid, with a slightly deeper chin along the bottom edge, a small round camera and a tiny indicator dot centred in the top bezel, and a fine inner rim catching a highlight where the frame meets the glass.

The area INSIDE the bezel — the display surface itself — is filled with completely flat, uniform, solid #FF00FF magenta: one single colour, no gradient, no reflection, no picture, no user interface, no glow.

Everything OUTSIDE the lid is completely flat, uniform, solid #00FF00 green: one single colour, no gradient, no shadow, no reflection, no table, no background scene.

No text, no brand name, no logo, no watermark.`,
}))
await writeFile(new URL('./bezel-jobs.json', import.meta.url), JSON.stringify(jobs, null, 2))
console.log(jobs.length, 'bezel jobs')
