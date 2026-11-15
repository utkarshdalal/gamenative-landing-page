import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  STATE_LABELS,
  entityPath,
  fmt,
  formatDate,
  gamePath,
  getPair,
  getPairParams,
  getSnapshot,
  gpuPathIfExists,
  pairPath,
  pct,
  summarize,
} from '@/lib/compat-snapshot'
import {
  HUB_PATH,
  LOWERED_EXPLANATION,
  PLAYABLE_DEFINITION,
  breadcrumbJsonLd,
  deviceAnswer,
  expectation,
  faqJsonLd,
  gameHeadline,
  gameStats,
  headline,
  howToSteps,
  pairFaq,
  pairMetadata,
} from '@/lib/will-it-run'
import {
  BackLink,
  FaqList,
  HowToPlay,
  JsonLd,
  PageShell,
  Section,
  StateLabel,
  linkCls,
} from '@/components/will-it-run/parts'

export const dynamicParams = false

type Params = { slug: string; device: string }

export function generateStaticParams(): Params[] {
  return getPairParams()
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const pair = getPair(params.slug, params.device)
  return pair ? pairMetadata(pair.page, pair.device, pair.row) : {}
}

export default function PairPage({ params }: { params: Params }) {
  const pair = getPair(params.slug, params.device)
  if (!pair) notFound()
  const { page, row, device } = pair
  const { meta, gpus } = getSnapshot()
  const { name } = gameStats(page)
  const [, state, n, ok, fps] = row
  const faq = pairFaq(name, device, row)
  const gamePagePath = gamePath(page.slug)
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Will it run on my phone?', path: HUB_PATH },
    { name, path: gamePagePath },
    { name: device.name, path: pairPath(page.slug, device.slug) },
  ]
  // The same game across every device that shares this device's GPU.
  const gpuRow = page.p.find((r) => gpus[r[0]].slug === device.gpuSlug)
  const gpuHref = gpuPathIfExists(device.gpuSlug)
  const lowered = (state === 'U' && ok / n >= 0.5) || (state === 'B' && ok / n >= 0.1)

  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={faqJsonLd(faq)} />

      <BackLink href={gamePagePath}>{name} on all devices</BackLink>

      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-gray-400">
        <a href="/">Home</a> / <a href={HUB_PATH}>Will it run on my phone?</a> /{' '}
        <a href={gamePagePath}>{name}</a> / <span className="text-gray-200">{device.name}</span>
      </nav>

      <h1 className="mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
        Will {name} run on the {device.name}?
      </h1>

      <Section title="Short answer">
        <p className="mb-3 text-lg">
          <StateLabel state={state} />
        </p>
        <p className="text-lg leading-relaxed text-gray-100">
          With GameNative, {name} is rated {STATE_LABELS[state]} on the {device.name}: {fmt(ok)} of{' '}
          {fmt(n)} play sessions ({pct(ok / n)}) were playable
          {fps != null ? `, with a median of ${fmt(fps)} FPS` : ''}.
        </p>
        <p className="mt-3 leading-relaxed text-gray-200">{expectation(state)}</p>
        {lowered ? <p className="mt-3 text-sm text-gray-400">{LOWERED_EXPLANATION}</p> : null}
        <p className="mt-3 text-sm text-gray-400">
          From sessions in the {meta.windowDays} days up to {formatDate(meta.dataThrough)}.{' '}
          {PLAYABLE_DEFINITION} Results also depend on your settings.{' '}
          <a href={`${HUB_PATH}#methodology`} className={linkCls}>
            How these numbers work
          </a>
        </p>
      </Section>

      <Section title="For comparison">
        <ul className="list-disc space-y-2 pl-5 leading-relaxed">
          {gpuRow && device.gpu ? (
            <li>
              Across all devices with the same GPU (
              {gpuHref ? (
                <a href={gpuHref} className={linkCls}>
                  {device.gpu}
                </a>
              ) : (
                device.gpu
              )}
              ), {name} is rated {STATE_LABELS[gpuRow[1]]}: {fmt(gpuRow[3])} of {fmt(gpuRow[2])}{' '}
              sessions ({pct(gpuRow[2] ? gpuRow[3] / gpuRow[2] : 0)}) were playable.
            </li>
          ) : null}
          <li>
            {gameHeadline(page)}{' '}
            <a href={gamePagePath} className={linkCls}>
              {name} on every device
            </a>
          </li>
          <li>
            {headline(device, summarize(device.states))}{' '}
            <a href={entityPath(device)} className={linkCls}>
              All games on the {device.name}
            </a>
          </li>
        </ul>
      </Section>

      <Section id="how-to" title={`How to play ${name} on the ${device.name}`}>
        <HowToPlay steps={howToSteps(name)} note={expectation(state)} />
      </Section>

      <Section title="Questions">
        <FaqList qas={faq} />
      </Section>
    </PageShell>
  )
}
