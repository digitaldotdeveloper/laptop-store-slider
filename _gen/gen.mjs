// Queues image jobs on the local Gemini Studio dashboard and saves results to ../_src/<name>.png
//   node gen.mjs jobs.json [name,name]
import { readFile, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HOST = 'http://127.0.0.1:4321'
const TOKEN = process.env.GS_TOKEN || 'eb3f37d205c384c852e2b3ada137b6b2df0b80fa76147720'
const H = { 'content-type': 'application/json', authorization: 'Bearer ' + TOKEN }
const here = path.dirname(fileURLToPath(import.meta.url))
const out = path.join(here, '..', '_src')

const post = async (route, body) => {
  const r = await fetch(HOST + route, { method: 'POST', headers: H, body: JSON.stringify(body) })
  if (!r.ok) throw new Error(`${route} -> ${r.status}`)
  return r.json()
}
const state = async () => (await fetch(HOST + '/api/state', { headers: H })).json()
const exists = (f) => access(f).then(() => true, () => false)

const [jobsFile, only] = process.argv.slice(2)
let jobs = JSON.parse(await readFile(path.join(here, jobsFile), 'utf8'))
if (only) jobs = jobs.filter((j) => only.split(',').includes(j.name))

const queued = []
for (const j of jobs) {
  const dest = path.join(out, j.name + '.png')
  if (await exists(dest)) { console.log('skip', j.name); continue }
  const attach = []
  if (j.edit) {
    const data = await readFile(path.join(out, j.edit + '.png'))
    const up = await post('/api/upload', { name: j.edit, dataUrl: 'data:image/png;base64,' + data.toString('base64') })
    attach.push({ kind: 'up', file: up.file })
  }
  const { queued: ids } = await post('/api/generate', { prompt: j.prompt, mode: 'image', model: 'auto', runs: 1, threadId: null, attach })
  queued.push({ ...j, id: ids[0], dest })
  console.log('queued', j.name, ids[0])
}

const pending = new Set(queued.map((q) => q.id))
const deadline = Date.now() + 30 * 60e3
while (pending.size && Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 4000))
  const s = await state()
  for (const q of queued) {
    if (!pending.has(q.id)) continue
    const job = s.jobs.find((x) => x.id === q.id)
    if (!job || !['done', 'failed', 'cancelled'].includes(job.status)) continue
    pending.delete(q.id)
    const entry = s.library.find((i) => i.jobId === q.id && (i.kind || 'image') === 'image')
    if (job.status !== 'done' || !entry) { console.log('FAILED', q.name, job.status, job.error || '', (job.log || []).slice(-3).join(' | ')); continue }
    const r = await fetch(`${HOST}/images/${entry.file}`, { headers: H })
    await writeFile(q.dest, Buffer.from(await r.arrayBuffer()))
    console.log('saved', q.name)
  }
}
if (pending.size) console.log('timed out:', [...pending].join(','))
