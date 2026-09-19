// The keycap plate that the CSS used to fake: real caps, same layout as each deck photo.
//   node keys-jobs.mjs && node gen.mjs keys-jobs.json
import { writeFile } from 'node:fs/promises'

const CAPS = {
  nightforge: 'matte black keycaps with sharp square edges, each cap lit from underneath by per-key RGB backlighting — a smooth rainbow running across the rows, deep red on the left through amber, green and cyan to violet on the right — the glow spilling softly around every cap',
  aero:       'pale silver-grey chiclet keycaps with soft rounded corners and a clean matte finish, lit by gentle neutral-white backlighting',
  studio:     'dark graphite keycaps with a precise soft-touch finish, lit by warm amber backlighting',
  ledger:     'matte charcoal-black business keycaps, slightly dished, lit by discreet cool-white backlighting',
}

const jobs = Object.entries(CAPS).map(([id, caps]) => ({
  name: `${id}-keys`,
  edit: `${id}-deck`,
  prompt: `The attached photograph shows the top case of a laptop with every keycap removed, so only the bare key switch mechanisms are visible.

Produce the missing KEYCAPS ON THEIR OWN — the exact set of caps that were lifted off that top case.

Match the attached image exactly: the same flat orthographic top-down view with no perspective and no tilt, the same scale, the same framing, and the same key layout — every cap sitting precisely over the switch it belongs to, identical rows, identical column positions, identical individual key widths (wide space bar, wide shift and enter keys, the narrow function row, and the number pad if the attached case has one).

The caps are ${caps}. They float alone with a thin dark shadow gap between neighbours; each cap is a realistic three-dimensional moulded key with a slightly concave top and visible side walls, photographed as crisp product photography.

Show ONLY the keycaps. No chassis, no top case, no palm rest, no trackpad, no speaker grilles, no hinge, no screen, no hands. No readable letters or legends on the caps, no brand names, no watermark.

Place the floating keycaps on a completely flat, uniform, solid #FF00FF magenta background: one single colour with no gradient, no shading, no drop shadow onto the background, no reflection, no table, no text. Wide 16:9 image.`,
}))
await writeFile(new URL('./keys-jobs.json', import.meta.url), JSON.stringify(jobs, null, 2))
console.log(jobs.length, 'key jobs')
