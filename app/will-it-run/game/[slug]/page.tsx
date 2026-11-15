import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  type EntityRow,
  STATE_LABELS,
  devicePathIfExists,
  fmt,
  formatDate,
  gamePath,
  getGamePage,
  getGamePages,
  getSnapshot,
  gpuPathIfExists,
  pairPathIfExists,
  pct,
} from '@/lib/compat-snapshot'
import {
  GAME_BIAS_NOTE,
  HUB_PATH,
  LOWERED_EXPLANATION,
  PLAYABLE_DEFINITION,
  breadcrumbJsonLd,
  faqJsonLd,
  gameFaq,
  gameHeadline,
  gameMetadata,
  gameSessionsSentence,
  gameStats,
  howToSteps,
} from '@/lib/will-it-run'
import {
  BackLink,
  FaqList,
  HowToPlay,
  JsonLd,
  PageShell,
  Section,
  linkCls,
  tableCls,
} from '@/components/will-it-run/parts'
import { ListFilter } from '@/components/will-it-run/list-filter'

export const dynamicParams = false

export function generateStaticParams() {
  return getGamePages().map((g) => ({ slug: g.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = getGamePage(params.slug)
  return page ? gameMetadata(page) : {}
}

/** Text colour per verdict, set once on the table: rows stay tiny because pages have up to ~800 of them. */
const rowsCls = `${tableCls} [&_a]:text-cyan-400 [&_a]:underline [&_a]:underline-offset-2 [&_td[data-s]]:font-medium [&_td[data-s]]:whitespace-nowrap [&_td[data-s=G]]:text-emerald-300 [&_td[data-s=W]]:text-cyan-300 [&_td[data-s=U]]:text-amber-300 [&_td[data-s=B]]:text-red-300`

/** Plain <a> and bare cells on purpose: every byte here is repeated for each device on ~1,400 pages. */
function Rows({
  rows,
  kind,
  game,
}: {
  rows: EntityRow[]
  kind: 'device' | 'gpu'
  game: number
}) {
  const snap = getSnapshot()
  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <table className={rowsCls}>
        <thead className="bg-black/40 text-gray-300">
          <tr>
            <th>{kind === 'device' ? 'Device' : 'GPU'}</th>
            <th>Verdict</th>
            <th>Sessions</th>
            <th>Playable</th>
            <th>Median FPS</th>
          </tr>
        </thead>
        <tbody className="tabular-nums text-gray-100">
          {rows.map(([i, state, n, ok, fps]) => {
            const e = kind === 'device' ? snap.devices[i] : snap.gpus[i]
            // A device with plenty of sessions links to the page for this game on that device.
            const href =
              kind === 'device'
                ? (pairPathIfExists(game, i) ?? devicePathIfExists(e.slug))
                : gpuPathIfExists(e.slug)
            const suffix = kind === 'device' && e.gpu ? ` · ${e.gpu}` : ''
            return (
              <tr key={e.slug} data-filter="">
                <td>{href ? <a href={href}>{e.name}</a> : e.name}{suffix}</td>
                <td data-s={state}>{STATE_LABELS[state]}</td>
                <td>{fmt(n)}</td>
                <td>{pct(n ? ok / n : 0)}</td>
                <td>{fps != null ? fmt(fps) : '-'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function GamePage({ params }: { params: { slug: string } }) {
  const page = getGamePage(params.slug)
  if (!page) notFound()
  const { snap, name, s } = gameStats(page)
  const faq = gameFaq(page)
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Will it run on my phone?', path: HUB_PATH },
    { name, path: gamePath(page.slug) },
  ]

  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={faqJsonLd(faq)} />

      <BackLink href={HUB_PATH}>All devices, GPUs and games</BackLink>

      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-gray-400">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-gray-200">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={HUB_PATH} className="hover:text-gray-200">
              Will it run on my phone?
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-200" aria-current="page">
            {name}
          </li>
        </ol>
      </nav>

      <h1 className="mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
        Will {name} run on my phone with GameNative?
      </h1>

      <Section title="Short answer">
        <p className="text-lg leading-relaxed text-gray-100">
          It depends on the device. {gameHeadline(page)}
        </p>
        <p className="mt-3 leading-relaxed text-gray-200">{GAME_BIAS_NOTE}</p>
        <p className="mt-3 text-sm text-gray-400">
          {gameSessionsSentence(page)} {PLAYABLE_DEFINITION}{' '}
          <Link href={`${HUB_PATH}#methodology`} className={linkCls}>
            How these numbers work
          </Link>
        </p>
      </Section>

      <Section id="devices" title={`${name} by device (${fmt(s.judged)})`}>
        <p className="mb-4 text-sm text-gray-400">
          Every device where {name} was run at least 5 times, most-played first. Verdicts are the
          app&apos;s own. {LOWERED_EXPLANATION}
        </p>
        <ListFilter
          label="Find your device"
          placeholder="Device or GPU name, e.g. Galaxy S25 Ultra"
          emptyText={
            <>
              No data for {name} on that device. Check the{' '}
              <a href="#gpus" className={linkCls}>
                results by GPU
              </a>{' '}
              instead.
            </>
          }
        >
          <Rows rows={page.d} kind="device" game={page.g} />
        </ListFilter>
      </Section>

      <Section id="gpus" title={`${name} by GPU (${fmt(page.p.length)})`}>
        <p className="mb-4 text-sm text-gray-400">
          If your device is not listed, find the GPU it uses. Results on one GPU still vary between
          devices.
        </p>
        <Rows rows={page.p} kind="gpu" game={page.g} />
      </Section>

      <Section id="how-to" title={`How to play ${name} on Android`}>
        <HowToPlay
          steps={howToSteps(name)}
          note="Whether it then runs well depends on your device: check it in the table above first."
        />
      </Section>

      <Section title="Questions">
        <FaqList qas={faq} />
      </Section>

      <div className="space-y-3 text-sm text-gray-400">
        <p>
          Play-session data for the {snap.meta.windowDays} days up to{' '}
          {formatDate(snap.meta.dataThrough)}.{' '}
          <Link href={`${HUB_PATH}#methodology`} className={linkCls}>
            Methodology
          </Link>
        </p>
        <p className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href={HUB_PATH} className={linkCls}>
            All devices, GPUs and games
          </Link>
          <Link href="/compatibility/" className={linkCls}>
            User-submitted reports by game
          </Link>
          <Link href="/" className={linkCls}>
            Download GameNative (home page)
          </Link>
        </p>
      </div>
    </PageShell>
  )
}
