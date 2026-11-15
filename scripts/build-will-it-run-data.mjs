// Builds data/compat-snapshot.json for the /will-it-run pages from the raw export
// written by scripts/export-compat-tiers.mjs (.compat-raw/, gitignored).
//
// Verdicts are NOT invented here: decideCompat() below is a straight port of
// gamenative-update-worker/src/api/compat-state.ts, the rules behind the
// compatibility badge inside the app. Keep the two in sync.
//
// Refresh:  SUPABASE_URL=... SUPABASE_KEY=... node scripts/export-compat-tiers.mjs
//           node scripts/build-will-it-run-data.mjs

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const RAW = join(ROOT, '.compat-raw')
const CSV_FILE = join(ROOT, 'public', 'supported_devices.csv')
const OUT_FILE = join(ROOT, 'data', 'compat-snapshot.json')
const GAMES_FILE = join(ROOT, 'data', 'compat-games.json')

const MIN_GAMES_LISTED = 5 // entities with fewer judged games are left out entirely
const GAMES_PER_ENTITY = 60 // most-played games kept per entity
const FAILING_PER_ENTITY = 20
const POPULAR_GAMES = 40 // most-played games overall, looked up on every entity
const MIN_DEVICES_FOR_GAME_PAGE = 20 // a game gets its own page when this many devices have a verdict for it
const MIX_SHARE = 0.2 // a second GPU on at least this share of a model's units is called out
const MIN_DEVICES_FOR_MIX = 20 // ...but only when enough units reported, so one odd record cannot trigger it

const read = (f) => JSON.parse(readFileSync(join(RAW, f), 'utf8'))

// ── Port of compat-state.ts ─────────────────────────────────────────────────
const tierSessions = (t) => t.oldN + t.strictN
const tierPlayable = (t) => t.oldOk + t.strictOk
const blendedRate = (t) => {
  const d = t.oldN + 2 * t.strictN
  return d > 0 ? (t.oldOk + 2 * t.strictOk) / d : null
}
function rateState(t) {
  const r = blendedRate(t)
  if (r === null) return 'Works'
  if (r < 0.1) return 'Broken'
  if (r < 0.5) return 'Unreliable'
  if (r >= 0.7 && t.fpsP50 !== null && t.fpsP50 >= 25) return 'Great'
  return 'Works'
}
const MIN_RATED_DEVICES = 15
const MIN_STRICT_SESSIONS = 20
const strictRate = (t) => (t.strictN >= MIN_STRICT_SESSIONS ? t.strictOk / t.strictN : null)
const okDeviceShare = (t) => (t.ratedDevices > 0 ? t.okDevices / t.ratedDevices : null)
function deviceCap(tiers, decided) {
  for (const kind of [decided, 'family', 'all']) {
    const t = tiers[kind]
    if (!t || t.ratedDevices < MIN_RATED_DEVICES) continue
    const share = okDeviceShare(t)
    if (share === null) return null
    if (share < 0.05) return 'Broken'
    if (share < 0.15) return 'Unreliable'
    return null
  }
  return null
}
const RANK = { Broken: 0, Unreliable: 1, Works: 2, Great: 3, 'May Work': 4, Untested: 5 }
function applyStrict(tiers, decision) {
  if (decision.tier === null || decision.state === 'May Work' || decision.state === 'Untested') return decision
  const t = tiers[decision.tier]
  if (!t) return decision
  const r = strictRate(t)
  if (r !== null) {
    const lowered = r < 0.1 ? 'Broken' : r < 0.5 ? 'Unreliable' : null
    if (lowered === null || RANK[lowered] >= RANK[decision.state]) return decision
    return { state: lowered, tier: decision.tier }
  }
  for (const kind of ['family', 'all']) {
    const broad = tiers[kind]
    const broadRate = broad ? strictRate(broad) : null
    if (broadRate === null) continue
    if (broadRate < 0.1 && RANK.Broken < RANK[decision.state]) return { state: 'Broken', tier: decision.tier }
    return decision
  }
  return decision
}
function applyCap(tiers, decision) {
  if (decision.tier === null || (decision.state !== 'Great' && decision.state !== 'Works')) return decision
  const cap = deviceCap(tiers, decision.tier)
  if (cap === null || RANK[cap] >= RANK[decision.state]) return decision
  return { state: cap, tier: decision.tier }
}
function decideByRate(tiers) {
  const { model, gpu, family, all } = tiers
  if (family && tierSessions(family) >= 10) {
    const r = blendedRate(family)
    if (r !== null && r < 0.1) return { state: 'Broken', tier: 'family' }
  }
  if (model && tierSessions(model) >= 5) return { state: rateState(model), tier: 'model' }
  if (gpu && tierSessions(gpu) >= 5) return { state: rateState(gpu), tier: 'gpu' }
  if (family && tierSessions(family) >= 10) return { state: rateState(family), tier: 'family' }
  if (family && tierPlayable(family) >= 3) return { state: 'Works', tier: 'family' }
  if (all && all.alltimeOk >= 1) return { state: 'May Work', tier: 'all' }
  return { state: 'Untested', tier: null }
}
const decideCompat = (tiers) => applyCap(tiers, applyStrict(tiers, decideByRate(tiers)))
// ────────────────────────────────────────────────────────────────────────────

const num = (v) => (v === null || v === undefined ? 0 : Number(v))
const toStats = (r) => ({
  oldOk: num(r.old_ok), oldN: num(r.old_n), strictOk: num(r.strict_ok), strictN: num(r.strict_n),
  fpsP50: r.fps_p50 === null ? null : Number(r.fps_p50),
  alltimeOk: num(r.alltime_ok), ratedDevices: num(r.rated_devices), okDevices: num(r.ok_devices),
  lastSeen: r.last_seen,
})
/** Sum two variants of the same device/GPU. FPS comes from the variant with more playable strict sessions. */
function mergeStats(a, b) {
  if (!a) return { ...b }
  const fpsFrom = b.fpsP50 !== null && (a.fpsP50 === null || b.strictOk > a._fpsWeight) ? b : a
  return {
    oldOk: a.oldOk + b.oldOk, oldN: a.oldN + b.oldN, strictOk: a.strictOk + b.strictOk, strictN: a.strictN + b.strictN,
    fpsP50: fpsFrom.fpsP50, _fpsWeight: Math.max(a._fpsWeight ?? a.strictOk, b.strictOk),
    alltimeOk: a.alltimeOk + b.alltimeOk, ratedDevices: a.ratedDevices + b.ratedDevices, okDevices: a.okDevices + b.okDevices,
    lastSeen: a.lastSeen > b.lastSeen ? a.lastSeen : b.lastSeen,
  }
}

// ── Names ───────────────────────────────────────────────────────────────────
function normalizeGpu(raw) {
  const s = (raw ?? '').replace(/\s+/g, ' ').trim()
  let m
  if ((m = s.match(/Adreno\s*(?:\(TM\)\s*)?([A-Za-z]?\d[\w-]*)/i))) return { name: `Adreno ${m[1].toUpperCase()}`, vendor: 'Qualcomm Adreno' }
  if ((m = s.match(/Mali[-\s]*([GT]\d+)/i))) return { name: `Mali-${m[1].toUpperCase()}${/Immortalis/i.test(s) ? ' Immortalis' : ''}`, vendor: 'ARM Mali' }
  if ((m = s.match(/Immortalis[-\s]*([GT]\d+)/i))) return { name: `Mali-${m[1].toUpperCase()} Immortalis`, vendor: 'ARM Mali' }
  if ((m = s.match(/Xclipse\s*(\d+)/i))) return { name: `Xclipse ${m[1]}`, vendor: 'Samsung Xclipse' }
  if ((m = s.match(/PowerVR\s*([^,()]*)/i))) return { name: `PowerVR ${m[1].trim()}`.trim(), vendor: 'Imagination PowerVR' }
  return { name: s || 'Unknown GPU', vendor: 'Other' }
}
const loose = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')
const BRAND_ALIASES = {
  xiaomi: ['xiaomi', 'redmi', 'poco', 'mi'], redmi: ['redmi', 'xiaomi'], poco: ['poco', 'xiaomi'],
  vivo: ['vivo', 'iqoo'], iqoo: ['iqoo', 'vivo'], nubia: ['nubia', 'redmagic', 'zte'], zte: ['zte', 'nubia'],
  lenovo: ['lenovo', 'legion'],
}
const BRAND_DISPLAY = {
  samsung: 'Samsung', ayn: 'AYN', oneplus: 'OnePlus', xiaomi: 'Xiaomi', google: 'Google', motorola: 'Motorola',
  nubia: 'nubia', zte: 'ZTE', asus: 'ASUS', lenovo: 'Lenovo', oppo: 'OPPO', realme: 'realme', vivo: 'vivo',
  iqoo: 'iQOO', honor: 'HONOR', huawei: 'HUAWEI', sony: 'Sony', nothing: 'Nothing', ayaneo: 'AYANEO',
  anbernic: 'Anbernic', tcl: 'TCL', lge: 'LG', poco: 'POCO', redmi: 'Redmi', infinix: 'Infinix', tecno: 'TECNO',
}
const OEM_BRANDS = new Set(['moorechip', 'alps', 'unknown', 'generic'])
function parseCsvLine(line) {
  const out = []; let cur = ''; let q = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++ } else q = !q }
    else if (ch === ',' && !q) { out.push(cur); cur = '' } else cur += ch
  }
  out.push(cur); return out
}
function loadCsvIndex() {
  const u8 = readFileSync(CSV_FILE)
  const text = u8[0] === 0xff && u8[1] === 0xfe ? new TextDecoder('utf-16le').decode(u8.subarray(2)) : new TextDecoder().decode(u8)
  const index = new Map()
  for (const line of text.split(/\r?\n/).slice(1)) {
    if (!line) continue
    const f = parseCsvLine(line)
    if (f.length < 4 || !f[0].trim() || !f[1].trim() || !f[3].trim()) continue
    const key = loose(f[3]); const list = index.get(key) ?? []
    list.push({ brand: f[0].trim(), marketing: f[1].trim() }); index.set(key, list)
  }
  return index
}
const joinBrand = (brand, product) => (!brand || loose(product).startsWith(loose(brand)) ? product : `${brand} ${product}`)
const csvIndex = loadCsvIndex()
const deviceCache = new Map()
/** Brand AND model must both agree with Google's device list; an ambiguous or missing match keeps the raw name. */
function resolveDevice(rawModel) {
  const raw = (rawModel ?? '').replace(/\s+/g, ' ').trim()
  if (deviceCache.has(raw)) return deviceCache.get(raw)
  const sp = raw.indexOf(' ')
  const brand = sp > 0 ? raw.slice(0, sp) : ''
  const model = sp > 0 ? raw.slice(sp + 1) : raw
  const bl = loose(brand)
  const okBrands = new Set(BRAND_ALIASES[bl] ?? [bl])
  const matches = ((bl && model ? csvIndex.get(loose(model)) : null) ?? []).filter((c) => okBrands.has(loose(c.brand)))
  const names = [...new Set(matches.map((c) => joinBrand(c.brand, c.marketing)))]
  let result
  if (names.length === 1) result = { key: `csv:${names[0].toLowerCase()}`, name: names[0] }
  else {
    const display = !brand ? model || 'Unknown device' : OEM_BRANDS.has(bl) ? model : joinBrand(BRAND_DISPLAY[bl] ?? brand, model)
    result = { key: `raw:${raw.toLowerCase()}`, name: display }
  }
  deviceCache.set(raw, result)
  return result
}
const slugify = (s) => s.normalize('NFKD').toLowerCase().replace(/\+/g, ' plus ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x'
function slugger(reserved = []) {
  const used = new Set(reserved)
  return (name) => { const base = slugify(name); let s = base; for (let n = 2; used.has(s); n++) s = `${base}-${n}`; used.add(s); return s }
}

// ── Load ────────────────────────────────────────────────────────────────────
const tiers = read('tiers.json')
const gameName = new Map(read('games.json').map((g) => [g.id, g.name.trim()]))
const familyOf = new Map(read('gpu-families.json').map((f) => [f.gpu_name, f.family]))
const gpusByModel = new Map()
for (const { model, gpu, n } of read('device-gpus.json')) {
  const m = gpusByModel.get(model) ?? new Map(); m.set(gpu, (m.get(gpu) ?? 0) + n); gpusByModel.set(model, m)
}

const allRow = new Map() // gameId -> stats
const familyRow = new Map() // `${gameId}|${family}` -> stats
for (const r of tiers) {
  if (r.kind === 'all') allRow.set(r.game_id, toStats(r))
  else if (r.kind === 'family') familyRow.set(`${r.game_id}|${r.key}`, toStats(r))
}

// group -> { name, rawNames:Set, games: Map<gameId, stats> }
function collect(kind, groupOf) {
  const groups = new Map()
  for (const r of tiers) {
    if (r.kind !== kind) continue
    const { key, name, vendor } = groupOf(r.key)
    let g = groups.get(key)
    if (!g) groups.set(key, (g = { name, vendor, rawNames: new Set(), games: new Map() }))
    g.rawNames.add(r.key)
    g.games.set(r.game_id, mergeStats(g.games.get(r.game_id), toStats(r)))
  }
  return groups
}
const deviceGroups = collect('model', (raw) => resolveDevice(raw))
const gpuGroups = collect('gpu', (raw) => { const g = normalizeGpu(raw); return { key: g.name.toLowerCase(), name: g.name, vendor: g.vendor } })
gpuGroups.delete('unknown gpu')

// Most-played games overall (by sessions in the window), used as a fixed list on every page.
const popularIds = [...allRow].filter(([id]) => gameName.has(id))
  .sort((a, b) => tierSessions(b[1]) - tierSessions(a[1])).slice(0, POPULAR_GAMES).map(([id]) => id)

const gameIndex = new Map(); const games = []
const gameSlug = slugger()
function gi(id) {
  if (!gameIndex.has(id)) { gameIndex.set(id, games.length); const name = gameName.get(id) ?? `Game ${id}`; games.push({ id, name, slug: gameSlug(name) }) }
  return gameIndex.get(id)
}
popularIds.forEach(gi)

const STATE_CODE = { Great: 'G', Works: 'W', Unreliable: 'U', Broken: 'B' }

const allRows = new Map() // entity -> every judged [gameId, state, sessions, playable, fps] row

function buildEntity(kind, g, extra) {
  const rawGpuCounts = new Map()
  if (kind === 'device') for (const raw of g.rawNames) for (const [gpu, n] of gpusByModel.get(raw) ?? []) rawGpuCounts.set(gpu, (rawGpuCounts.get(gpu) ?? 0) + n)
  const mainRawGpu = kind === 'device' ? [...rawGpuCounts].sort((a, b) => b[1] - a[1])[0]?.[0] : [...g.rawNames][0]
  const family = mainRawGpu ? familyOf.get(mainRawGpu) ?? null : null

  const states = { great: 0, works: 0, unreliable: 0, broken: 0 }
  let sessions = 0, playable = 0, lastSeen = ''
  const rows = []
  const stateByGame = new Map()
  for (const [gameId, stats] of g.games) {
    if (!gameName.has(gameId)) continue
    const t = { [kind === 'device' ? 'model' : 'gpu']: stats, family: family ? familyRow.get(`${gameId}|${family}`) : undefined, all: allRow.get(gameId) }
    const { state } = decideCompat(t)
    if (!STATE_CODE[state]) continue // fewer than 5 sessions after merging: no verdict at this tier
    states[state.toLowerCase()]++
    const n = tierSessions(stats), ok = tierPlayable(stats)
    sessions += n; playable += ok
    if (stats.lastSeen > lastSeen) lastSeen = stats.lastSeen
    stateByGame.set(gameId, STATE_CODE[state])
    rows.push([gameId, STATE_CODE[state], n, ok, stats.fpsP50 === null || stats.strictOk < 3 ? null : Math.round(stats.fpsP50)])
  }
  const gamesJudged = rows.length
  if (gamesJudged < MIN_GAMES_LISTED) return null
  rows.sort((a, b) => b[2] - a[2])
  const entity = {
    slug: '', name: g.name, kind, vendor: g.vendor, ...extra,
    rawNames: [...g.rawNames].sort(),
    sessions, playable, gamesJudged, states, lastSeen,
    games: rows.slice(0, GAMES_PER_ENTITY).map(([id, ...rest]) => [gi(id), ...rest]),
    // Most-played games that are Unreliable or Broken here, so failures are not buried under popular hits.
    failing: rows.filter((r) => r[1] === 'U' || r[1] === 'B').slice(0, FAILING_PER_ENTITY).map(([id, ...rest]) => [gi(id), ...rest]),
    popular: popularIds.map((id) => stateByGame.get(id) ?? '-').join(''),
  }
  allRows.set(entity, rows)
  if (kind === 'device') {
    const byName = new Map()
    for (const [raw, n] of rawGpuCounts) { const nm = normalizeGpu(raw).name; byName.set(nm, (byName.get(nm) ?? 0) + n) }
    const sorted = [...byName].sort((a, b) => b[1] - a[1]); const total = sorted.reduce((s, [, n]) => s + n, 0)
    if (sorted[0]) { entity.gpu = sorted[0][0]; entity.vendor = normalizeGpu(mainRawGpu).vendor }
    else entity.vendor = 'Unknown'
    if (total >= MIN_DEVICES_FOR_MIX && sorted[1] && sorted[1][1] / total >= MIX_SHARE) entity.gpuMix = sorted.filter(([, n]) => n / total >= 0.05).map(([gpu, n]) => ({ gpu, share: Math.round((n / total) * 100) }))
  }
  return entity
}

const bySize = (a, b) => b.sessions - a.sessions
const gpus = [...gpuGroups.values()].map((g) => buildEntity('gpu', g)).filter(Boolean).sort(bySize)
const gpuSlug = slugger(); for (const g of gpus) g.slug = gpuSlug(g.name)
const gpuSlugByName = new Map(gpus.map((g) => [g.name, g.slug]))
const devices = [...deviceGroups.values()].map((g) => buildEntity('device', g)).filter(Boolean).sort(bySize)
const devSlug = slugger(['gpu']); for (const d of devices) { d.slug = devSlug(d.name); if (d.gpu && gpuSlugByName.has(d.gpu)) d.gpuSlug = gpuSlugByName.get(d.gpu) }
for (const g of gpus) {
  const mine = devices.filter((d) => d.gpu === g.name)
  g.deviceCount = mine.length
  g.topDevices = mine.slice(0, 12).map((d) => ({ slug: d.slug, name: d.name, sessions: d.sessions }))
}

// Per-game view of the same verdicts: one row per device / GPU, for the game pages.
const perGame = new Map() // gameId -> { d: rows, p: rows }
const addRows = (list, field) => list.forEach((e, idx) => {
  for (const [id, ...rest] of allRows.get(e)) {
    let g = perGame.get(id)
    if (!g) perGame.set(id, (g = { d: [], p: [] }))
    g[field].push([idx, ...rest])
  }
})
addRows(devices, 'd'); addRows(gpus, 'p')
const pageSlugs = new Set()
const gamePages = [...perGame]
  .filter(([, g]) => g.d.length >= MIN_DEVICES_FOR_GAME_PAGE)
  .map(([id, g]) => ({ id, sessions: g.d.reduce((s, r) => s + r[2], 0), ...g }))
  .sort((a, b) => b.sessions - a.sessions || a.id - b.id)
  .map(({ id, d, p }) => {
    // Stable URLs: the most-played game keeps the plain slug, a same-named one gets its id appended.
    let slug = slugify(gameName.get(id)); if (pageSlugs.has(slug)) slug = `${slug}-${id}`; pageSlugs.add(slug)
    const bySessions = (a, b) => b[2] - a[2]
    return { g: gi(id), slug, d: d.sort(bySessions), p: p.sort(bySessions) }
  })

const vendors = new Map()
for (const d of devices) {
  const v = vendors.get(d.vendor) ?? { vendor: d.vendor, devices: 0, sessions: 0, playable: 0, states: { great: 0, works: 0, unreliable: 0, broken: 0 } }
  v.devices++; v.sessions += d.sessions; v.playable += d.playable
  for (const k of Object.keys(v.states)) v.states[k] += d.states[k]
  vendors.set(d.vendor, v)
}

const snapshot = {
  generatedAt: new Date().toISOString(),
  dataThrough: tiers.reduce((m, r) => (r.last_seen > m ? r.last_seen : m), ''),
  windowDays: 180,
  popular: popularIds.map(gi),
  totals: { devices: devices.length, gpus: gpus.length, sessions: devices.reduce((s, d) => s + d.sessions, 0), gamesWithData: allRow.size },
  vendors: [...vendors.values()].sort(bySize),
  games, devices, gpus,
}
// A short or broken export must not replace good data: refuse to shrink the snapshot by more than half.
if (existsSync(OUT_FILE)) {
  const prev = JSON.parse(readFileSync(OUT_FILE, 'utf8'))
  for (const [what, now, before] of [['devices', devices.length, prev.devices.length], ['gpus', gpus.length, prev.gpus.length], ['sessions', snapshot.totals.sessions, prev.meta.totals.sessions]]) {
    if (now < before / 2) { console.error(`Refusing to write: ${what} fell from ${before} to ${now}`); process.exit(1) }
  }
}
const lines = (arr) => '[\n' + arr.map((x) => JSON.stringify(x)).join(',\n') + '\n]'
const { games: _g, devices: _d, gpus: _p, ...head } = snapshot
writeFileSync(OUT_FILE, `{\n"meta":${JSON.stringify(head)},\n"games":${lines(games)},\n"devices":${lines(devices)},\n"gpus":${lines(gpus)}\n}\n`)
writeFileSync(GAMES_FILE, `{"games":${lines(gamePages)}}\n`)
console.log(`game pages ${gamePages.length}`)
console.log(`devices ${devices.length}, gpus ${gpus.length}, games ${games.length}`)
