// Dumps the rows the "will it run" pages are built from, read-only, from Supabase.
//
// Source: the `game_compat_tiers` materialized view (the same per-game, per-device
// rollup the app's own compatibility badge uses) plus game id -> name.
//
// Usage (needs a key that can read the view, e.g. the worker's):
//   SUPABASE_URL=... SUPABASE_KEY=... node scripts/export-compat-tiers.mjs
//
// Output: .compat-raw/tiers.json and .compat-raw/games.json (gitignored).

import { mkdirSync, writeFileSync } from 'node:fs'

const URL_ = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_KEY
if (!URL_ || !KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_KEY')
  process.exit(1)
}

const PAGE = 1000
const MIN_SESSIONS = 5 // rows below this cannot produce a verdict at their own tier

async function fetchAll(path) {
  const rows = []
  for (let offset = 0; ; offset += PAGE) {
    const sep = path.includes('?') ? '&' : '?'
    const res = await fetch(`${URL_}/rest/v1/${path}${sep}limit=${PAGE}&offset=${offset}`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    })
    if (!res.ok) throw new Error(`${path} @${offset}: HTTP ${res.status} ${await res.text()}`)
    const page = await res.json()
    for (const r of page) rows.push(r)
    if (page.length < PAGE) return rows
    if (offset % 20000 === 0) console.log(`  ${path.split('?')[0]}: ${rows.length}…`)
  }
}

const enough = `or=(old_n.gte.${MIN_SESSIONS},strict_n.gte.${MIN_SESSIONS})`
const order = 'order=game_id,kind,key'

const tiers = []
for (const kind of ['model', 'gpu', 'family']) {
  const rows = await fetchAll(`game_compat_tiers?select=*&kind=eq.${kind}&${enough}&${order}`)
  console.log(`${kind}: ${rows.length} rows`)
  for (const r of rows) tiers.push(r)
}
// 'all' rows are needed unfiltered: they carry the per-game fallback and rating cap.
const all = await fetchAll(`game_compat_tiers?select=*&kind=eq.all&${order}`)
console.log(`all: ${all.length} rows`)
for (const r of all) tiers.push(r)

const gameIds = new Set(tiers.filter((r) => r.kind !== 'all').map((r) => r.game_id))
const games = (await fetchAll('games?select=id,name&order=id')).filter((g) => gameIds.has(g.id))
console.log(`games: ${games.length}`)

mkdirSync('.compat-raw', { recursive: true })
writeFileSync('.compat-raw/tiers.json', JSON.stringify(tiers))
writeFileSync('.compat-raw/games.json', JSON.stringify(games))
console.log('Wrote .compat-raw/tiers.json and .compat-raw/games.json')

// Device model -> GPU, and GPU -> family, so a device page can fall back to its GPU family.
const pairs = new Map()
for (const d of await fetchAll('devices?select=model,gpu&gpu=not.is.null&model=not.is.null&order=id')) {
  const k = `${d.model}\u0000${d.gpu}`
  pairs.set(k, (pairs.get(k) ?? 0) + 1)
}
const deviceGpus = [...pairs].map(([k, n]) => {
  const [model, gpu] = k.split('\u0000')
  return { model, gpu, n }
})
const families = await fetchAll('gpu_families?select=gpu_name,family&order=gpu_name')
writeFileSync('.compat-raw/device-gpus.json', JSON.stringify(deviceGpus))
writeFileSync('.compat-raw/gpu-families.json', JSON.stringify(families))
console.log(`device/gpu pairs: ${deviceGpus.length}, gpu families: ${families.length}`)
