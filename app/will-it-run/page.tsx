import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BAND_LABELS,
  BAND_MIXED_MIN_SHARE,
  BAND_MOSTLY_RUNS_MIN_SHARE,
  MIN_GAMES_FOR_PAGE,
  entityPath,
  fmt,
  formatDate,
  gamePath,
  getGamePages,
  hasPage,
  pct,
  summarize,
} from '@/lib/compat-snapshot'
import {
  HUB_BIAS_NOTE,
  HUB_PATH,
  LOWERED_EXPLANATION,
  PLAYABLE_DEFINITION,
  breadcrumbJsonLd,
  faqJsonLd,
  hubAnswer,
  hubFaq,
  hubStats,
} from '@/lib/will-it-run'
import {
  BackLink,
  FaqList,
  JsonLd,
  PageShell,
  Section,
  linkCls,
  tdCls,
  thCls,
  tableCls,
} from '@/components/will-it-run/parts'
import { ListFilter } from '@/components/will-it-run/list-filter'

export function generateMetadata(): Metadata {
  const { meta, overall } = hubStats()
  const title = `Will GameNative run on my phone? Results for ${fmt(meta.totals.devices)} devices`
  const description = `GameNative results by phone and GPU from ${fmt(meta.totals.sessions)} play sessions in the last ${meta.windowDays} days. ${pct(overall.okShare)} of ${fmt(overall.judged)} game-and-device combinations with enough data are rated Great or Works. Look up your device or GPU.`
  return {
    title,
    description,
    alternates: { canonical: HUB_PATH },
    openGraph: { title, description, url: HUB_PATH, type: 'website' },
  }
}

export default function WillItRunHub() {
  const { snap, meta, vendors } = hubStats()
  const faq = hubFaq()
  const exampleModel =
    snap.devices
      .flatMap((d) => d.rawNames.map((r) => ({ r, d })))
      .find(({ r, d }) => !r.toLowerCase().includes(d.name.toLowerCase()))?.r ??
    snap.devices[0]?.rawNames[0]
  const exampleGpu = snap.gpus[0]?.name

  return (
    <PageShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Will it run on my phone?', path: HUB_PATH },
        ])}
      />
      <JsonLd data={faqJsonLd(faq)} />

      <BackLink href="/">Back to Home</BackLink>
      <h1 className="mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
        Will GameNative run on my phone?
      </h1>

      <Section title="Short answer">
        <p className="text-lg leading-relaxed text-gray-100">{hubAnswer()}</p>
        <p className="mt-3 leading-relaxed text-gray-200">{HUB_BIAS_NOTE}</p>
        <p className="mt-3 text-sm text-gray-400">
          {PLAYABLE_DEFINITION} Find your device or GPU below for its own numbers, including the
          popular games that don&apos;t run reliably on it.{' '}
          <a href="#methodology" className={linkCls}>
            How these numbers work
          </a>
        </p>
      </Section>

      <Section id="vendors" title="By GPU family">
        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <table className="min-w-full text-sm">
            <thead className="bg-black/40 text-gray-300">
              <tr>
                <th className={thCls}>GPU family</th>
                <th className={thCls}>Devices</th>
                <th className={thCls}>Game/device combinations</th>
                <th className={thCls}>Great or Works</th>
                <th className={thCls}>Sessions</th>
                <th className={thCls}>Playable sessions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-100">
              {vendors.map((v) => (
                <tr key={v.vendor}>
                  <td className={`${tdCls} whitespace-nowrap`}>{v.vendor}</td>
                  <td className={`${tdCls} tabular-nums`}>{fmt(v.devices)}</td>
                  <td className={`${tdCls} tabular-nums`}>{fmt(v.s.judged)}</td>
                  <td className={`${tdCls} tabular-nums`}>{pct(v.s.okShare)}</td>
                  <td className={`${tdCls} tabular-nums`}>{fmt(v.sessions)}</td>
                  <td className={`${tdCls} tabular-nums`}>{pct(v.playableShare)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-gray-400">
          A combination is one game on one device with at least 5 sessions. Families with few
          devices have small samples.
        </p>
      </Section>

      <Section id="find" title="Finding your phone">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>
            Search the device list by name or model number
            {exampleModel ? <> (for example &quot;{exampleModel}&quot;)</> : null}. Model variants
            are merged into one entry.
          </li>
          <li>
            Don&apos;t see your device? Devices with fewer than 5 games with enough data are not
            listed. Look up which GPU your phone has (it is part of the chipset named in your
            phone&apos;s specifications) and check the{' '}
            <a href="#gpus" className={linkCls}>
              GPU table
            </a>
            .
          </li>
          <li>
            Some phone models are sold in variants with different GPUs. Device pages say so when
            units of one model reported different GPUs.
          </li>
          <li>
            For user-submitted reports on a specific game, with notes and settings, search the{' '}
            <Link href="/compatibility/" className={linkCls}>
              Compatibility page
            </Link>
            . Those are separate from the play-session data used here.
          </li>
        </ul>
      </Section>

      <Section id="devices" title={`Devices (${fmt(snap.devices.length)})`}>
        <p className="mb-4 text-sm text-gray-400">
          Share of games with enough data rated Great or Works, with the number of games. Devices
          with fewer than {MIN_GAMES_FOR_PAGE} games are marked as limited data and have no page.
        </p>
        <ListFilter
          label="Filter devices"
          placeholder={exampleModel ? `Name or model number, e.g. ${exampleModel}` : 'Device name'}
          emptyText={
            <>
              No matching device. Try the{' '}
              <a href="#gpus" className={linkCls}>
                GPU table
              </a>
              .
            </>
          }
        >
          <ul className="divide-y divide-gray-800 text-sm [&>li]:py-2">
            {snap.devices.map((d) => {
              const s = summarize(d.states)
              const paged = hasPage(d)
              return (
                <li key={d.slug} data-filter={[d.name, d.gpu ?? '', ...d.rawNames].join(' ')}>
                  {paged ? (
                    <a href={entityPath(d)} className={linkCls}>
                      {d.name}
                    </a>
                  ) : (
                    <span className="text-gray-100">{d.name}</span>
                  )}{' '}
                  <span className="text-gray-400">
                    · {d.gpu ?? 'Unknown GPU'} · {pct(s.okShare)} of {fmt(s.judged)} games
                    {paged ? '' : ' · limited data'}
                  </span>
                </li>
              )
            })}
          </ul>
        </ListFilter>
      </Section>

      <Section id="gpus" title={`GPUs (${fmt(snap.gpus.length)})`}>
        <ListFilter
          label="Filter GPUs"
          placeholder={exampleGpu ? `GPU name, e.g. ${exampleGpu}` : 'GPU name'}
          emptyText="No matching GPU."
        >
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="min-w-full text-sm">
              <thead className="bg-black/40 text-gray-300">
                <tr>
                  <th className={thCls}>GPU</th>
                  <th className={thCls}>Family</th>
                  <th className={thCls}>Devices</th>
                  <th className={thCls}>Games</th>
                  <th className={thCls}>Great or Works</th>
                  <th className={thCls}>Playable sessions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-100">
                {snap.gpus.map((g) => {
                  const s = summarize(g.states)
                  const paged = hasPage(g)
                  return (
                    <tr key={g.slug} data-filter={[g.name, g.vendor].join(' ')}>
                      <td className={`${tdCls} whitespace-nowrap`}>
                        {paged ? (
                          <a href={entityPath(g)} className={linkCls}>
                            {g.name}
                          </a>
                        ) : (
                          <>
                            {g.name} <span className="text-gray-400">(limited data)</span>
                          </>
                        )}
                      </td>
                      <td className={`${tdCls} whitespace-nowrap text-gray-300`}>{g.vendor}</td>
                      <td className={`${tdCls} tabular-nums`}>
                        {g.deviceCount != null ? fmt(g.deviceCount) : '-'}
                      </td>
                      <td className={`${tdCls} tabular-nums`}>{fmt(s.judged)}</td>
                      <td className={`${tdCls} tabular-nums`}>{pct(s.okShare)}</td>
                      <td className={`${tdCls} whitespace-nowrap tabular-nums`}>
                        {pct(g.sessions ? g.playable / g.sessions : 0)} of {fmt(g.sessions)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </ListFilter>
      </Section>

      <Section id="games" title={`Games (${fmt(getGamePages().length)})`}>
        <p className="mb-4 text-sm text-gray-400">
          Games with results on at least 20 devices, most-played first. Each page lists the verdict
          for that game on every device and GPU with enough data.
        </p>
        <ListFilter
          label="Filter games"
          placeholder="Game name, e.g. Hollow Knight"
          emptyText={
            <>
              No page for that game yet. Search the{' '}
              <Link href="/compatibility/" className={linkCls}>
                Compatibility page
              </Link>{' '}
              for user-submitted reports.
            </>
          }
        >
          <ul className="grid gap-x-6 gap-y-1.5 text-sm text-gray-400 sm:grid-cols-2 [&_a]:text-cyan-400 [&_a]:underline [&_a]:underline-offset-2">
            {getGamePages().map((g) => {
              const name = snap.games[g.g].name
              return (
                <li key={g.slug} data-filter="">
                  <a href={gamePath(g.slug)}>{name}</a> · {fmt(g.d.length)} devices
                </li>
              )
            })}
          </ul>
        </ListFilter>
      </Section>

      <Section id="methodology" title="How these numbers work">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>
            The data is play-session telemetry from the GameNative app: the same rollup behind the
            compatibility badge shown in the app. It covers {fmt(meta.totals.sessions)} sessions in
            the {meta.windowDays} days up to {formatDate(meta.dataThrough)}, on{' '}
            {fmt(meta.totals.devices)} devices and {fmt(meta.totals.gpus)} GPUs, across{' '}
            {fmt(meta.totals.gamesWithData)} games.
          </li>
          <li>{PLAYABLE_DEFINITION}</li>
          <li>
            Each game on each device or GPU gets the app&apos;s verdict once it has at least 5
            sessions there: Broken when under 10% of sessions were playable, Unreliable when under
            50%, Great when at least 70% were playable and the median FPS is 25 or more, otherwise
            Works. Recent sessions, which use a stricter check, count double.
          </li>
          <li>{LOWERED_EXPLANATION}</li>
          <li>
            Each device or GPU gets a summary from the share of its games rated Great or Works:{' '}
            {BAND_LABELS.runs} at {pct(BAND_MOSTLY_RUNS_MIN_SHARE)} or more, {BAND_LABELS.mixed}{' '}
            from {pct(BAND_MIXED_MIN_SHARE)}, and {BAND_LABELS.poor} below that.
          </li>
          <li>{HUB_BIAS_NOTE}</li>
          <li>
            Model variants are merged into one device entry; each device page lists the model
            numbers it covers. Devices and GPUs need at least {MIN_GAMES_FOR_PAGE} games with a
            verdict for their own page, and at least 5 to be listed here.
          </li>
          <li>
            The{' '}
            <Link href="/compatibility/" className={linkCls}>
              Compatibility page
            </Link>{' '}
            lists user-submitted reports instead, with notes and settings. It is a separate source.
          </li>
          <li>Snapshot generated {formatDate(meta.generatedAt)}.</li>
        </ul>
      </Section>

      <Section id="faq" title="Frequently asked questions">
        <FaqList qas={faq} />
      </Section>

      <p className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Link href="/compatibility/" className={linkCls}>
          User-submitted reports by game
        </Link>
        <Link href="/" className={linkCls}>
          Download GameNative (home page)
        </Link>
      </p>
    </PageShell>
  )
}
