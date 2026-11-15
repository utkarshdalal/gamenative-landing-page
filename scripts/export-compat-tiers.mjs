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

async function get(path) {
  // Retry transient failures (statement timeouts, 5xx) a few times before giving up.
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${URL_}/rest/v1/${path}`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    })
    if (res.ok) return res.json()
    const body = await res.text()
    if (attempt >= 4 || res.status < 500) throw new Error(`${path}: HTTP ${res.status} ${body}`)
    await new Promise((r) => setTimeout(r, attempt * 3000))
  }
}

/** Small tables: plain limit/offset paging. */
async function fetchAll(path) {
  const rows = []
  for (let offset = 0; ; offset += PAGE) {
    const sep = path.includes('?') ? '&' : '?'
    const page = await get(`${path}${sep}limit=${PAGE}&offset=${offset}`)
    for (const r of page) rows.push(r)
    if (page.length < PAGE) return rows
  }
}

/**
 * game_compat_tiers is large, and deep OFFSETs time out. Page by position instead: each
 * request asks for the rows after the last (game_id, key) seen, which the index answers directly.
 */
async function fetchTiers(kind, filter) {
  const rows = []
  let after = ''
  for (;;) {
    const page = await get(
      `game_compat_tiers?select=*&kind=eq.${kind}${filter}${after}&order=game_id,key&limit=${PAGE}`,
    )
    for (const r of page) rows.push(r)
    if (page.length < PAGE) return rows
    const last = page[page.length - 1]
    const key = `"${String(last.key).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
    after = `&and=(or(game_id.gt.${last.game_id},and(game_id.eq.${last.game_id},key.gt.${encodeURIComponent(key)})))`
    if (rows.length % 20000 === 0) console.log(`  ${kind}: ${rows.length}…`)
  }
}

const enough = `&or=(old_n.gte.${MIN_SESSIONS},strict_n.gte.${MIN_SESSIONS})`

const tiers = []
for (const kind of ['model', 'gpu', 'family']) {
  const rows = await fetchTiers(kind, enough)
  console.log(`${kind}: ${rows.length} rows`)
  for (const r of rows) tiers.push(r)
}
// 'all' rows are needed unfiltered: they carry the per-game fallback and rating cap.
const all = await fetchTiers('all', '')
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
