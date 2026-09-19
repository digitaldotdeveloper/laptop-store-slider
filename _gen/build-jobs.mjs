// Builds jobs.json: one set of exploded-view layers per laptop.  node build-jobs.mjs && node gen.mjs jobs.json name,name
import { writeFile } from 'node:fs/promises'

const MODELS = {
  nightforge: { look: 'a matte black aluminium gaming laptop with sharp angular edges and thin red accent details', accent: 'red', bg: 'a dark cinematic studio: a black glossy reflective floor, deep red haze, red volumetric light glowing from far behind the centre, a few faint floating embers, near-black edges',
    screen: 'an epic dark cinematic sci-fi game landscape: a lone armoured figure on a cliff facing a colossal glowing red portal in a stormy night sky, embers and red volumetric light, deep blacks' },
  aero:       { look: 'an ultra-thin silver aluminium ultrabook with soft rounded edges and a clean minimalist finish', accent: 'blue', bg: 'a bright airy minimalist studio: a seamless white-to-pale-blue infinity cove, a soft glossy white floor, gentle electric-blue light glowing from far behind the centre, very clean',
    screen: 'a calm abstract wallpaper of flowing translucent glass ribbons in electric blue and pale sky blue on a soft white background, airy and bright' },
  studio:     { look: 'a dark graphite space-grey aluminium creator laptop with a precise premium finish and subtle amber details', accent: 'amber', bg: 'a moody dark violet studio: a dark glossy floor, soft drifting smoke, warm amber rim light glowing from far behind the centre, deep purple shadows at the edges',
    screen: 'a rich abstract wallpaper of swirling liquid paint in warm amber, gold and deep violet, like ink in water, high detail' },
  ledger:     { look: 'a dark charcoal business laptop with a soft-touch matte finish and a rugged, professional design', accent: 'green', bg: 'a calm light sage-green architectural space: a smooth pale concrete floor, soft daylight, long gentle geometric shadows on the back wall, a faint green glow behind the centre',
    screen: 'a clean abstract wallpaper of layered deep green and navy geometric waves with soft light, professional and calm' },
}

const MAGENTA = 'Place it on a completely flat, uniform, solid #FF00FF magenta background: one single colour with no gradient, no shading, no shadow, no reflection, no table, no text, no watermark.'
const TOPDOWN = 'Shot from directly above as a flat orthographic top-down view with no perspective and no tilt, the object perfectly straight and centred, filling about 85% of the frame width. Wide 16:9 image. Crisp realistic studio product photography, soft even lighting.'

const jobs = []
for (const [id, m] of Object.entries(MODELS)) {
  jobs.push(
    { name: `${id}-bg-wide`, prompt: `A wide 16:9 background photograph of ${m.bg}. The centre of the image is an EMPTY stage where a product will be placed later; the floor horizon sits at about 65% of the image height. Photorealistic, soft depth of field. No objects, no products, no people, no furniture, no text, no logos.` },
    { name: `${id}-bg-tall`, prompt: `A tall vertical 9:16 background photograph of ${m.bg}. The centre of the image is an EMPTY stage where a product will be placed later; the floor horizon sits at about 65% of the image height. Photorealistic, soft depth of field. No objects, no products, no people, no furniture, no text, no logos.` },
    { name: `${id}-screen`, prompt: `A wide 16:10 desktop wallpaper artwork filling the entire image edge to edge: ${m.screen}. No text, no letters, no logos, no user interface, no device frame, no border.` },
    { name: `${id}-lid`, prompt: `The closed outer lid (top cover) of ${m.look}, seen alone from the outside. ${TOPDOWN} The lid is a plain rectangle with rounded corners and a small simple geometric emblem in the centre, no brand name, no text. ${MAGENTA}` },
    { name: `${id}-deck`, prompt: `The top case of ${m.look} with ALL the keycaps removed: the empty keyboard area shows neat rows of small bare key switch mechanisms, plus a large glass trackpad below and speaker grilles on both sides. The screen is detached and not shown. ${TOPDOWN} No text, no logos. ${MAGENTA}` },
    { name: `${id}-board`, prompt: `The internal motherboard assembly of ${m.look}, removed from its case and seen alone: a dark circuit board with two round cooling fans at the back corners, copper heat pipes running across the processor and graphics chips, memory modules and an M.2 SSD, with tiny ${m.accent} LED details. ${TOPDOWN} No text, no logos. ${MAGENTA}` },
    { name: `${id}-battery`, prompt: `A single flat laptop battery pack for ${m.look}, seen alone: a wide slim black rectangular lithium-ion pack made of four cells side by side, with a small connector cable. ${TOPDOWN} No readable text, no logos. ${MAGENTA}` },
    { name: `${id}-bottom`, prompt: `The bottom cover (underside panel) of ${m.look}, seen alone from below: large ventilation grille cut-outs, four rubber feet, small screws around the edge. ${TOPDOWN} No text, no logos, no stickers. ${MAGENTA}` },
  )
}
await writeFile(new URL('./jobs.json', import.meta.url), JSON.stringify(jobs, null, 2))
console.log(jobs.length, 'jobs')
