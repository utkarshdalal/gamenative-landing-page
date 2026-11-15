import React from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { type Band, type StateCode, BAND_LABELS, STATE_LABELS } from '@/lib/compat-snapshot'
import type { QA } from '@/lib/will-it-run'
import { FILTER_SCRIPT } from '@/components/will-it-run/list-filter'

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-purple-900 via-black to-cyan-900">
      <div className="container mx-auto max-w-5xl px-4 py-10 sm:py-12">{children}</div>
      {/* data-keep: the only script scripts/prune-export.mjs leaves on these pages. */}
      <script data-keep="" dangerouslySetInnerHTML={{ __html: FILTER_SCRIPT }} />
    </div>
  )
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button asChild variant="ghost" className="mb-4 text-cyan-400 hover:text-cyan-300">
      <Link href={href}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {children}
      </Link>
    </Button>
  )
}

export function Section({
  id,
  title,
  children,
}: {
  id?: string
  title: string
  children: React.ReactNode
}) {
  return (
    <Card
      id={id}
      className="mb-6 scroll-mt-6 gap-0 border-gray-700 bg-gray-900/50 py-0 backdrop-blur-sm"
    >
      <CardContent className="p-4 sm:p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>
        <div className="text-gray-300">{children}</div>
      </CardContent>
    </Card>
  )
}

const BAND_STYLE: Record<Band, { cls: string; Icon: typeof CheckCircle2 }> = {
  runs: { cls: 'border-emerald-500/60 bg-emerald-950/60 text-emerald-200', Icon: CheckCircle2 },
  mixed: { cls: 'border-amber-500/60 bg-amber-950/60 text-amber-200', Icon: AlertTriangle },
  poor: { cls: 'border-red-500/60 bg-red-950/60 text-red-200', Icon: XCircle },
}

/** Summary band: icon + text, never colour alone. */
export function BandBadge({ band }: { band: Band }) {
  const { cls, Icon } = BAND_STYLE[band]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-semibold ${cls}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {BAND_LABELS[band]}
    </span>
  )
}

const STATE_STYLE: Record<StateCode | '-', { cls: string; glyph: string }> = {
  G: { cls: 'text-emerald-300', glyph: '\u2714' },
  W: { cls: 'text-cyan-300', glyph: '\u2713' },
  U: { cls: 'text-amber-300', glyph: '!' },
  B: { cls: 'text-red-300', glyph: '\u2715' },
  '-': { cls: 'text-gray-400', glyph: '?' },
}

/**
 * Per-game verdict: glyph + word, so it never relies on colour alone. A text glyph
 * instead of an SVG icon keeps 700+ static pages small. '-' is "Not enough data",
 * never shown as working or failing.
 */
export function StateLabel({ state }: { state: StateCode | '-' }) {
  const { cls, glyph } = STATE_STYLE[state]
  return (
    <span className={`whitespace-nowrap font-medium ${cls}`}>
      <span aria-hidden="true">{glyph} </span>
      {state === '-' ? 'Not enough data' : STATE_LABELS[state]}
    </span>
  )
}

/** Compact table styling applied from the table element, so rows carry no per-cell classes. */
export const tableCls =
  'min-w-full text-sm [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:font-semibold [&_th]:whitespace-nowrap [&_tbody_tr]:border-t [&_tbody_tr]:border-gray-800'

export function FaqList({ qas }: { qas: QA[] }) {
  return (
    <dl className="space-y-5">
      {qas.map(({ q, a }) => (
        <div key={q}>
          <dt className="font-semibold text-white">{q}</dt>
          <dd className="mt-1 leading-relaxed text-gray-300">{a}</dd>
        </div>
      ))}
    </dl>
  )
}

export const linkCls = 'text-cyan-400 underline underline-offset-2 hover:text-cyan-300'
export const thCls = 'px-3 py-2.5 text-left font-semibold whitespace-nowrap'
export const tdCls = 'px-3 py-2.5 align-top'

/** The three steps from the home page, with the game's name filled in. */
export function HowToPlay({ steps, note }: { steps: string[]; note?: string }) {
  return (
    <>
      <ol className="list-decimal space-y-2 pl-5 leading-relaxed">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      {note ? <p className="mt-3 leading-relaxed text-gray-200">{note}</p> : null}
      <p className="mt-3 text-sm">
        <a href="/" className={linkCls}>
          Download GameNative
        </a>
      </p>
    </>
  )
}
