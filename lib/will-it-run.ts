/**
 * Copy builders for the "Will it run?" pages. Every sentence is assembled from
 * snapshot numbers or states the app's own compatibility rules; keep it that way
 * (no hardware claims from outside the data). Server-only.
 */
import type { Metadata } from 'next'
import {
  type Entity,
  type EntityRow,
  type GamePage,
  type GameRow,
  type StateCode,
  type Summary,
  BAND_LABELS,
  MIN_GAMES_FOR_PAGE,
  STATE_LABELS,
  entityPath,
  fmt,
  formatDate,
  gameName,
  gamePath,
  getPagedGpus,
  getSnapshot,
  pairPath,
  pct,
  statesOf,
  sumStates,
  summarize,
} from '@/lib/compat-snapshot'

export const SITE_URL = 'https://gamenative.app'
export const HUB_PATH = '/will-it-run/'

export interface QA {
  q: string
  a: string
}

/* ── Fixed explanatory copy (the app's rules, not our own claims) ────────── */

export const PLAYABLE_DEFINITION =
  'A session counts as playable when the game ran for more than 60 seconds at 15 FPS or better. That is a low bar: playable does not mean smooth.'

export const LOWERED_EXPLANATION =
  'A verdict can be worse than the playable share suggests: the app lowers it (never raises it) when stricter recent sessions, data from the same GPU family, or user ratings disagree, for example when fewer than 15% of the devices that rated a game ever gave it 4 or 5 stars or played it for 15+ minutes.'

/* ── Per-entity ─────────────────────────────────────────────────────────── */

/** "the Samsung Galaxy S25 Ultra" or "devices with the Adreno 740 GPU". */
export function subjectOf(e: Entity): string {
  if (e.kind === 'device') return `the ${e.name}`
  return /gpu$/i.test(e.name) ? `devices with the ${e.name}` : `devices with the ${e.name} GPU`
}

export function headline(e: Entity, s: Summary = summarize(e.states)): string {
  const subject = subjectOf(e)
  return `On ${subject}, ${fmt(s.ok)} of ${fmt(s.judged)} games with enough data (${pct(s.okShare)}) are rated Great or Works; ${fmt(s.unreliable)} are Unreliable and ${fmt(s.broken)} are Broken.`
}

export function biasNote(e: Entity): string {
  return `These are games people chose to try on ${subjectOf(e)}, and the most-played ones are mostly lighter or older games, so this percentage overstates what to expect from demanding new releases.`
}

export function sessionsSentence(e: Entity): string {
  const { meta } = getSnapshot()
  return `Based on ${fmt(e.sessions)} play sessions in the ${meta.windowDays} days up to ${formatDate(meta.dataThrough)}, of which ${fmt(e.playable)} (${pct(e.sessions ? e.playable / e.sessions : 0)}) were playable.`
}

export function gameAnswer(e: Entity, row: GameRow): string {
  const [gi, state, n, ok, fps] = row
  const share = n ? ok / n : 0
  let a = `${gameName(gi)} is rated ${STATE_LABELS[state]} on ${subjectOf(e)}: ${fmt(ok)} of ${fmt(n)} sessions (${pct(share)}) were playable${fps != null ? `, with a median of ${fmt(fps)} FPS` : ''}.`
  if ((state === 'U' && share >= 0.5) || (state === 'B' && share >= 0.1))
    a += ` ${LOWERED_EXPLANATION}`
  return a
}

export function entityFaq(e: Entity): QA[] {
  const qas: QA[] = [
    {
      q: `Will GameNative run on the ${e.name}?`,
      a: `${headline(e)} ${biasNote(e)}`,
    },
  ]
  const top = e.games[0]
  if (top)
    qas.push({
      q: `Can the ${e.name} run ${gameName(top[0])} with GameNative?`,
      a: gameAnswer(e, top),
    })
  const fail = e.failing.find((r) => r[0] !== top?.[0])
  if (fail)
    qas.push({
      q: `Does ${gameName(fail[0])} work on the ${e.name} with GameNative?`,
      a: gameAnswer(e, fail),
    })
  return qas
}

export function entityMetadata(e: Entity): Metadata {
  const s = summarize(e.states)
  const title = `Will GameNative run on the ${e.name}? ${fmt(s.judged)} games tested`
  const description = `${BAND_LABELS[s.band]}. ${headline(e, s)} From ${fmt(e.sessions)} play sessions in the last ${getSnapshot().meta.windowDays} days.`
  const canonical = entityPath(e)
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  }
}

export function faqJsonLd(qas: QA[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qas.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

/* ── Hub ────────────────────────────────────────────────────────────────── */

/** Vendors need at least this many judged game/device combinations to appear in the summary sentence. */
const MIN_COMBOS_FOR_VENDOR_SENTENCE = 100

export function hubStats() {
  const snap = getSnapshot()
  const { meta } = snap
  const overall = summarize(sumStates(meta.vendors.map((v) => v.states)))
  const sessions = meta.vendors.reduce((a, v) => a + v.sessions, 0)
  const playable = meta.vendors.reduce((a, v) => a + v.playable, 0)
  const vendors = meta.vendors.map((v) => ({
    ...v,
    s: summarize(v.states),
    playableShare: v.sessions ? v.playable / v.sessions : 0,
  }))
  return { snap, meta, overall, sessions, playable, vendors }
}

export function hubAnswer(): string {
  const { meta, overall, sessions, playable, vendors } = hubStats()
  const lines = vendors
    .filter((v) => v.s.judged >= MIN_COMBOS_FOR_VENDOR_SENTENCE)
    .map((v) => `${v.vendor} ${pct(v.s.okShare)} of ${fmt(v.s.judged)}`)
  return [
    'It depends on the game and on your device.',
    `Across ${fmt(meta.totals.devices)} devices, ${fmt(overall.ok)} of ${fmt(overall.judged)} game-and-device combinations with enough data (${pct(overall.okShare)}) are rated Great or Works by the app; ${fmt(overall.unreliable)} are Unreliable and ${fmt(overall.broken)} are Broken.`,
    lines.length
      ? `By GPU family, the share of combinations rated Great or Works is ${lines.join('; ')}.`
      : '',
    `Of ${fmt(sessions)} play sessions in the ${meta.windowDays} days up to ${formatDate(meta.dataThrough)}, ${fmt(playable)} (${pct(sessions ? playable / sessions : 0)}) were playable.`,
  ]
    .filter(Boolean)
    .join(' ')
}

export const HUB_BIAS_NOTE =
  'These are games people chose to try, and the most-played ones are mostly lighter or older games, so these percentages overstate what to expect from demanding new releases.'

export function rankedGpus() {
  return getPagedGpus()
    .map((g) => ({ g, s: summarize(g.states) }))
    .sort((a, b) => b.s.okShare - a.s.okShare)
}

export function hubFaq(): QA[] {
  const { vendors } = hubStats()
  const qas: QA[] = [
    { q: 'Will GameNative run on my phone?', a: `${hubAnswer()} ${HUB_BIAS_NOTE}` },
  ]
  const shown = vendors.filter((v) => v.s.judged >= MIN_COMBOS_FOR_VENDOR_SENTENCE)
  if (shown.length > 1) {
    qas.push({
      q: 'Does it matter which GPU my phone has?',
      a:
        'The numbers differ by GPU family. ' +
        shown
          .map(
            (v) =>
              `${v.vendor} (${fmt(v.devices)} devices): ${fmt(v.s.ok)} of ${fmt(v.s.judged)} game-and-device combinations (${pct(v.s.okShare)}) rated Great or Works, and ${pct(v.playableShare)} of ${fmt(v.sessions)} sessions playable.`,
          )
          .join(' ') +
        ' Your own result also depends on the specific game.',
    })
  }
  const ranked = rankedGpus()
  if (ranked.length >= 6) {
    const line = (x: (typeof ranked)[number]) =>
      `${x.g.name} (${fmt(x.s.ok)} of ${fmt(x.s.judged)} games, ${pct(x.s.okShare)})`
    qas.push({
      q: 'Which GPUs have the highest share of games rated Great or Works?',
      a: `Among GPUs with at least ${MIN_GAMES_FOR_PAGE} games with enough data, the highest shares are ${ranked.slice(0, 3).map(line).join(', ')}. The lowest are ${ranked.slice(-3).reverse().map(line).join(', ')}. A higher share can also reflect which games people tend to try on those devices.`,
    })
  }
  qas.push({ q: 'What does "playable" mean here?', a: PLAYABLE_DEFINITION })
  return qas
}

/* ── Per-game pages ─────────────────────────────────────────────────────── */

export const GAME_BIAS_NOTE =
  'Each device counts once, however many people use it, and only devices where the game was run at least 5 times are counted. People tend to try a game on hardware they expect to cope, so weaker phones are under-represented here.'

export function gameStats(page: GamePage) {
  const snap = getSnapshot()
  const name = snap.games[page.g]?.name ?? `Game ${page.g}`
  const s = summarize(statesOf(page.d))
  const sessions = page.d.reduce((a, r) => a + r[2], 0)
  const playable = page.d.reduce((a, r) => a + r[3], 0)
  return { snap, name, s, sessions, playable }
}

export function gameHeadline(page: GamePage): string {
  const { name, s } = gameStats(page)
  return `${name} is rated Great or Works on ${fmt(s.ok)} of ${fmt(s.judged)} devices with enough data (${pct(s.okShare)}); it is Unreliable on ${fmt(s.unreliable)} and Broken on ${fmt(s.broken)}.`
}

export function gameSessionsSentence(page: GamePage): string {
  const { snap, sessions, playable } = gameStats(page)
  return `Based on ${fmt(sessions)} play sessions in the ${snap.meta.windowDays} days up to ${formatDate(snap.meta.dataThrough)}, of which ${fmt(playable)} (${pct(sessions ? playable / sessions : 0)}) were playable.`
}

/** One sentence answering "will <game> run on <device>?" from a single row. */
export function deviceAnswer(game: string, row: EntityRow): string {
  const [di, state, n, ok, fps] = row
  const device = getSnapshot().devices[di]
  const share = n ? ok / n : 0
  let a = `${game} is rated ${STATE_LABELS[state]} on the ${device.name}: ${fmt(ok)} of ${fmt(n)} sessions (${pct(share)}) were playable${fps != null ? `, with a median of ${fmt(fps)} FPS` : ''}.`
  if ((state === 'U' && share >= 0.5) || (state === 'B' && share >= 0.1))
    a += ` ${LOWERED_EXPLANATION}`
  return a
}

/** Devices named in the FAQ: the most-played ones, plus the most-played failing one. */
const FAQ_DEVICES = 5

export function gameFaq(page: GamePage): QA[] {
  const { name } = gameStats(page)
  const devices = getSnapshot().devices
  const qas: QA[] = [
    {
      q: `Will ${name} run on my phone with GameNative?`,
      a: `It depends on the device. ${gameHeadline(page)} ${GAME_BIAS_NOTE}`,
    },
  ]
  const picked = page.d.slice(0, FAQ_DEVICES)
  const fail = page.d.find((r) => (r[1] === 'U' || r[1] === 'B') && !picked.includes(r))
  if (fail) picked.push(fail)
  for (const row of picked)
    qas.push({
      q: `Will ${name} run on the ${devices[row[0]].name}?`,
      a: deviceAnswer(name, row),
    })
  qas.push({
    q: `How do I play ${name} on Android?`,
    a: howToSteps(name)
      .map((st, i) => `${i + 1}. ${st}`)
      .join(' '),
  })
  qas.push({ q: 'What does "playable" mean here?', a: PLAYABLE_DEFINITION })
  return qas
}

export function gameMetadata(page: GamePage): Metadata {
  const { name, s, sessions, snap } = gameStats(page)
  const title = `Will ${name} run on my phone with GameNative? Results on ${fmt(s.judged)} devices`
  const description = `${gameHeadline(page)} GameNative results by phone and GPU from ${fmt(sessions)} play sessions in the last ${snap.meta.windowDays} days.`
  const canonical = gamePath(page.slug)
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
  }
}

/* ── How to play (the app's own three steps, from the home page) ────────── */

export function howToSteps(game: string): string[] {
  return [
    'Install GameNative on your Android device. It is free, from Google Play or as an APK from gamenative.app.',
    `Sign in to Steam, Epic or GOG, whichever store you own ${game} on, and download it inside the app. You need to own the game.`,
    'Start it from your library. The game runs on the device itself; nothing is streamed.',
  ]
}

/* ── Game-on-device pages ───────────────────────────────────────────────── */

/** One sentence on what to expect, added to the how-to answer. Never more optimistic than the verdict. */
export function expectation(state: StateCode): string {
  if (state === 'G') return 'It is rated Great here, the best of the four verdicts.'
  if (state === 'W') return 'It is rated Works here: playable, but not necessarily smooth.'
  if (state === 'U')
    return 'It is rated Unreliable here, so expect crashes, low frame rates or sessions that do not start.'
  return 'It is rated Broken here: most attempts did not produce a playable session, so it will probably not work.'
}

export function pairFaq(game: string, device: Entity, row: EntityRow): QA[] {
  return [
    { q: `Will ${game} run on the ${device.name}?`, a: `With GameNative, ${deviceAnswer(game, row)}` },
    {
      q: `How do I play ${game} on the ${device.name}?`,
      a: `${howToSteps(game)
        .map((s, i) => `${i + 1}. ${s}`)
        .join(' ')} ${expectation(row[1])}`,
    },
    { q: 'What does "playable" mean here?', a: PLAYABLE_DEFINITION },
  ]
}

export function pairMetadata(page: GamePage, device: Entity, row: EntityRow): Metadata {
  const { name } = gameStats(page)
  const title = `Will ${name} run on the ${device.name}? Rated ${STATE_LABELS[row[1]]} with GameNative`
  const description = `${deviceAnswer(name, row)} How to play ${name} on the ${device.name} with GameNative.`
  const canonical = pairPath(page.slug, device.slug)
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
  }
}
