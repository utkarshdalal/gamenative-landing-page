import React from 'react'
import Link from 'next/link'
import {
  type Entity,
  type StateCode,
  count,
  devicePathIfExists,
  entityPath,
  fmt,
  formatDate,
  gameName,
  gamePathIfExists,
  getSnapshot,
  gpuPathIfExists,
  pairPathIfExists,
  pct,
  summarize,
} from '@/lib/compat-snapshot'
import {
  HUB_PATH,
  LOWERED_EXPLANATION,
  PLAYABLE_DEFINITION,
  biasNote,
  breadcrumbJsonLd,
  entityFaq,
  faqJsonLd,
  headline,
  sessionsSentence,
  subjectOf,
} from '@/lib/will-it-run'
import {
  BackLink,
  BandBadge,
  FaqList,
  JsonLd,
  PageShell,
  Section,
  StateLabel,
  linkCls,
  tableCls,
} from '@/components/will-it-run/parts'

export function EntityPage({ entity: e }: { entity: Entity }) {
  const { meta } = getSnapshot()
  const s = summarize(e.states)
  const faq = entityFaq(e)
  const subject = subjectOf(e)
  const deviceIndex = e.kind === 'device' ? getSnapshot().devices.indexOf(e) : -1
  const here = e.kind === 'gpu' ? 'on this GPU' : 'on this device'
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Will it run on my phone?', path: HUB_PATH },
    { name: e.name, path: entityPath(e) },
  ]
  const gpuHref = e.kind === 'device' ? gpuPathIfExists(e.gpuSlug) : null
  const popular = meta.popular.map((gi, i) => ({
    gi,
    state: (e.popular[i] ?? '-') as StateCode | '-',
  }))
  const popOk = popular.filter((p) => p.state === 'G' || p.state === 'W').length
  const popBad = popular.filter((p) => p.state === 'U' || p.state === 'B').length
  const popNone = popular.length - popOk - popBad

  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={faqJsonLd(faq)} />

      <BackLink href={HUB_PATH}>All devices and GPUs</BackLink>

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
            {e.name}
          </li>
        </ol>
      </nav>

      <h1 className="mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
        Will GameNative run on the {e.name}?
      </h1>

      <Section title="Short answer">
        <div className="mb-3">
          <BandBadge band={s.band} />
        </div>
        <p className="text-lg leading-relaxed text-gray-100">{headline(e, s)}</p>
        <p className="mt-3 leading-relaxed text-gray-200">
          {biasNote(e)}{' '}
          <a href="#failing" className={linkCls}>
            See the popular games that don&apos;t run reliably
          </a>
          .
        </p>
        <p className="mt-3 text-sm text-gray-400">
          {sessionsSentence(e)} {PLAYABLE_DEFINITION}{' '}
          <Link href={`${HUB_PATH}#methodology`} className={linkCls}>
            How these numbers work
          </Link>
        </p>
      </Section>

      <Section id="failing" title={`Popular games that don't run reliably ${here}`}>
        {e.failing.length ? (
          <>
            <p className="mb-4 text-sm text-gray-400">
              The {count(e.failing.length, 'most-played game', 'most-played games')} rated
              Unreliable or Broken on {subject}, out of {fmt(s.unreliable + s.broken)} in total.
            </p>
            <ul className="divide-y divide-gray-800 [&>li]:py-2">
              {e.failing.map(([gi, state, n, ok]) => (
                <li key={gi}>
                  <GameName gi={gi} device={deviceIndex} />{' '}
                  <span className="text-sm">
                    <StateLabel state={state} />{' '}
                    <span className="tabular-nums text-gray-300">
                      · {fmt(ok)} of {count(n, 'session')} playable ({pct(n ? ok / n : 0)})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-gray-400">{LOWERED_EXPLANATION}</p>
          </>
        ) : (
          <p>
            None of the {fmt(s.judged)} games with enough data are rated Unreliable or Broken on{' '}
            {subject}.
          </p>
        )}
      </Section>

      <Section title={`The ${popular.length} most-played games overall`}>
        <p className="mb-4 text-sm text-gray-400">
          The same {popular.length} games appear on every page, so you can compare devices. On{' '}
          {subject}: {fmt(popOk)} Great or Works, {fmt(popBad)} Unreliable or Broken, {fmt(popNone)}{' '}
          without enough data.
        </p>
        <ul className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {popular.map(({ gi, state }) => (
            <li key={gi}>
              <GameName gi={gi} device={deviceIndex} /> <StateLabel state={state} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title={`Most-played games ${here}`}>
        <p className="mb-4 text-sm text-gray-400">
          Showing the {fmt(e.games.length)} most-played of {count(s.judged, 'game')} with at least 5
          sessions {here}. Verdicts are the app&apos;s own.{' '}
          {e.failing.length
            ? 'They can be lower than the playable share suggests (explained above).'
            : LOWERED_EXPLANATION}{' '}
          For user-submitted reports with notes and settings, use the{' '}
          <Link href="/compatibility/" className={linkCls}>
            Compatibility page
          </Link>
          .
        </p>
        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <table className={tableCls}>
            <thead className="bg-black/40 text-gray-300">
              <tr>
                <th>Game</th>
                <th>Verdict</th>
                <th>Sessions</th>
                <th>Playable</th>
                <th>Median FPS</th>
              </tr>
            </thead>
            <tbody className="tabular-nums text-gray-100">
              {e.games.map(([gi, state, n, ok, fps]) => (
                <tr key={gi}>
                  <td>
                    <GameName gi={gi} device={deviceIndex} />
                  </td>
                  <td>
                    <StateLabel state={state} />
                  </td>
                  <td>{fmt(n)}</td>
                  <td>{pct(n ? ok / n : 0)}</td>
                  <td>{fps != null ? fmt(fps) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {e.kind === 'device' ? (
        <Section title="About this device">
          <dl className="space-y-4 text-sm">
            <Detail label="GPU">
              {gpuHref ? (
                <a href={gpuHref} className={linkCls}>
                  {e.gpu}
                </a>
              ) : (
                (e.gpu ?? 'Unknown')
              )}{' '}
              <span className="text-gray-400">({e.vendor})</span>
            </Detail>
            {e.gpuMix && e.gpuMix.length > 1 && (
              <Detail label="More than one GPU">
                Units of this model reported different GPUs:{' '}
                {e.gpuMix.map((m) => m.gpu).join(', ')}. The numbers on
                this page mix those variants, so your result depends on which one you have.
              </Detail>
            )}
            <Detail label="Model numbers merged into this entry">
              <span className="break-words">{e.rawNames.join(', ')}</span>
            </Detail>
            <Detail label="Last session seen">{formatDate(e.lastSeen)}</Detail>
          </dl>
        </Section>
      ) : (
        <Section title="Devices with this GPU">
          {e.deviceCount != null && (
            <p className="mb-4 text-sm">
              {count(e.deviceCount, 'device')} in this data have the {e.name} as their main GPU.
              {e.topDevices && e.topDevices.length > 0 && ' The most-played:'}
            </p>
          )}
          <ul className="space-y-2 text-sm">
            {(e.topDevices ?? []).map((d) => {
              const href = devicePathIfExists(d.slug)
              return (
                <li key={d.slug} className="flex flex-wrap items-baseline justify-between gap-x-4">
                  {href ? (
                    <a href={href} className={linkCls}>
                      {d.name}
                    </a>
                  ) : (
                    <span className="text-gray-100">{d.name} (limited data)</span>
                  )}
                  <span className="tabular-nums text-gray-300">{count(d.sessions, 'session')}</span>
                </li>
              )
            })}
          </ul>
          {e.rawNames.length > 0 && (
            <details className="mt-4 text-sm text-gray-400">
              <summary className="cursor-pointer">GPU names as reported by devices</summary>
              <ul className="mt-2 space-y-1 break-all">
                {e.rawNames.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </details>
          )}
        </Section>
      )}

      <Section title="Questions">
        <FaqList qas={faq} />
      </Section>

      <div className="space-y-3 text-sm text-gray-400">
        <p>
          Play-session data for the {meta.windowDays} days up to {formatDate(meta.dataThrough)}.{' '}
          <Link href={`${HUB_PATH}#methodology`} className={linkCls}>
            Methodology
          </Link>
        </p>
        <p className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href={HUB_PATH} className={linkCls}>
            All devices and GPUs
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

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-medium text-gray-200">{label}</dt>
      <dd className="mt-0.5 text-gray-300">{children}</dd>
    </div>
  )
}

/** Game name, linked to the game's own page when it has one. */
function GameName({ gi, device }: { gi: number; device: number }) {
  // On a device page, prefer the page for this game on this device.
  const href = (device >= 0 ? pairPathIfExists(gi, device) : null) ?? gamePathIfExists(gi)
  return href ? (
    <a href={href} className={linkCls}>
      {gameName(gi)}
    </a>
  ) : (
    <span className="text-gray-100">{gameName(gi)}</span>
  )
}
