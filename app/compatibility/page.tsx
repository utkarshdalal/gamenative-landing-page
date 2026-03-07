'use client'

import React, { useMemo, useState } from 'react'
import { exportConfigAsJson } from '@/lib/export-config'
import { normalize, deviceLabel, resolveDeviceId } from '@/lib/device-utils'
import { useDevicesWithMarketing } from '@/hooks/use-devices-with-marketing'
import { useGameSuggestions } from '@/hooks/use-game-suggestions'
import { useCompatibilityRuns } from '@/hooks/use-compatibility-runs'
import type { CompatibilityRun, JsonValue } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import { Combobox } from '@/components/ui/combobox'

const LIMIT = 200

export default function CompatibilityPage() {
  // ── UI state ──────────────────────────────────────────────────────
  const [query, setQuery] = useState('')
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
  const [deviceInput, setDeviceInput] = useState('')
  const [gpu, setGpu] = useState('')
  const [ratingMin, setRatingMin] = useState<number | null>(null)
  const [sortField, setSortField] = useState<'rating' | 'created_at'>('rating')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // ── Data hooks ────────────────────────────────────────────────────
  const {
    devices,
    gpus,
    modelToMarketing,
    marketingToModelNorm,
    coveredModelSet,
    marketingDisplays,
  } = useDevicesWithMarketing()

  const { suggestions, loading: suggestionsLoading } = useGameSuggestions(query)

  // Derive deviceId from user input + loaded device/marketing data
  const deviceId = useMemo(
    () => resolveDeviceId(deviceInput, devices, marketingToModelNorm),
    [deviceInput, devices, marketingToModelNorm],
  )

  const { runs, totalCount, page, setPage, loading, error, hasFilters } = useCompatibilityRuns({
    gameId: selectedGameId,
    deviceId,
    gpu,
    ratingMin,
    sort: sortField,
    dir: sortDir,
  })

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900 relative overflow-hidden">
      <div className="container max-w-6xl mx-auto px-4 py-12 relative z-10">
        <div className="mb-8">
          <Button asChild variant="ghost" className="text-cyan-400 hover:text-cyan-300 mb-4">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            Compatibility
          </h1>
          <p className="text-gray-300 text-lg">
            See if your game will work on your device using GameNative or Winlator
          </p>
        </div>

        {/* Filters */}
        <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Combobox
                label="Search by Game"
                placeholder="Elden Ring"
                inputValue={query}
                onInputChange={(val) => {
                  setQuery(val)
                  const match = suggestions.find((g) => g.name === val)
                  setSelectedGameId(match ? match.id : null)
                }}
                items={suggestions.map((g) => ({ value: String(g.id), label: g.name }))}
                emptyText={suggestionsLoading ? 'Loading...' : 'No results'}
                onSelect={(item) => {
                  setQuery(item.label)
                  setSelectedGameId(Number(item.value))
                }}
              />

              <Combobox
                label="Device"
                placeholder="Google Pixel 7"
                inputValue={deviceInput}
                onInputChange={setDeviceInput}
                items={[
                  ...Object.entries(marketingDisplays).map(([marketing, brandModel]) => ({
                    value: marketing,
                    label: marketing,
                    meta: brandModel,
                  })),
                  ...devices
                    .filter((d) => !coveredModelSet.has(normalize(d.model)))
                    .map((d) => ({ value: String(d.id), label: deviceLabel(d) })),
                ]}
                onSelect={(item) => setDeviceInput(item.label)}
              />

              <Combobox
                label="GPU"
                placeholder="Adreno 730"
                inputValue={gpu}
                onInputChange={setGpu}
                items={gpus.map((g) => ({ value: g, label: g }))}
                onSelect={(item) => setGpu(item.label)}
              />

              <Combobox
                label="Rating"
                placeholder={
                  ratingMin !== null ? (ratingMin === 5 ? '5' : `${ratingMin} & above`) : 'Any'
                }
                inputValue=""
                onInputChange={() => {}}
                items={[
                  { value: '', label: 'Any' },
                  { value: '5', label: '5' },
                  { value: '4', label: '4 & above' },
                  { value: '3', label: '3 & above' },
                  { value: '2', label: '2 & above' },
                  { value: '1', label: '1 & above' },
                ]}
                onSelect={(item) => {
                  setRatingMin(item.value ? Number(item.value) : null)
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <CompatibilityTable
                rows={runs}
                loading={loading}
                errorMessage={error}
                hasFilters={hasFilters}
                modelToMarketing={modelToMarketing}
                sortField={sortField}
                sortDir={sortDir}
                onSortChange={(field) => {
                  if (field === sortField) {
                    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
                  } else {
                    setSortField(field)
                    setSortDir('desc')
                  }
                }}
              />
            </div>
            {hasFilters && !loading && totalCount > 0 && (
              <div className="flex flex-col items-center justify-between gap-3 px-4 py-3 border-t border-gray-800">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setPage((p) => Math.max(0, p - 1))
                        }}
                        aria-disabled={page === 0}
                        className={page === 0 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" isActive size="default">
                        {page + 1}
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          const maxPage = Math.max(0, Math.ceil(totalCount / LIMIT) - 1)
                          setPage((p) => Math.min(maxPage, p + 1))
                        }}
                        aria-disabled={page >= Math.ceil(totalCount / LIMIT) - 1}
                        className={
                          page >= Math.ceil(totalCount / LIMIT) - 1
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <div className="text-gray-400 text-sm">
                  {(() => {
                    const start = page * LIMIT + 1
                    const end = Math.min((page + 1) * LIMIT, totalCount)
                    return `Showing ${start}–${end} of ${totalCount}`
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ── Presentation components ────────────────────────────────────────── */

type SortField = 'rating' | 'created_at'
type SortDir = 'asc' | 'desc'

function SortIcon({
  field,
  activeField,
  dir,
}: {
  field: SortField
  activeField: SortField
  dir: SortDir
}) {
  if (field !== activeField) return null
  return dir === 'asc' ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function CompatibilityTable({
  rows,
  loading,
  errorMessage,
  hasFilters,
  modelToMarketing,
  sortField,
  sortDir,
  onSortChange,
}: {
  rows: CompatibilityRun[]
  loading: boolean
  errorMessage?: string
  hasFilters: boolean
  modelToMarketing: Record<string, string>
  sortField: SortField
  sortDir: SortDir
  onSortChange: (field: SortField) => void
}) {
  if (loading) return <div className="p-6 text-gray-300">Loading…</div>
  if (errorMessage) return <div className="p-6 text-red-300">Error: {errorMessage}</div>
  if (!rows.length) {
    return (
      <div className="p-6 text-gray-300">
        {hasFilters ? 'No results found.' : 'Add a filter to get started'}
      </div>
    )
  }

  const resolveDeviceName = (model: string) =>
    modelToMarketing[model.toLowerCase()] ??
    modelToMarketing[model.split(' ').slice(1).join(' ').toLowerCase()] ??
    model

  return (
    <table className="min-w-full text-sm">
      <thead className="bg-black/40 text-gray-300">
        <tr>
          <Th>Game</Th>
          <Th>Device</Th>
          <Th>GPU</Th>
          <Th>Android</Th>
          <Th>App Ver</Th>
          <Th>
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-cyan-300"
              onClick={() => onSortChange('rating')}
            >
              <span>Rating</span>
              <SortIcon field="rating" activeField={sortField} dir={sortDir} />
            </button>
          </Th>
          <Th>Avg FPS</Th>
          <Th>Tags</Th>
          <Th>Notes</Th>
          <Th>Configs</Th>
          <Th>
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-cyan-300"
              onClick={() => onSortChange('created_at')}
            >
              <span>Created</span>
              <SortIcon field="created_at" activeField={sortField} dir={sortDir} />
            </button>
          </Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800 text-gray-100">
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-white/5">
            <Td>{r.game?.name ?? '-'}</Td>
            <Td>{r.device?.model ? resolveDeviceName(r.device.model) : '-'}</Td>
            <Td>{r.device?.gpu ?? '-'}</Td>
            <Td>{r.device?.androidVer ?? '-'}</Td>
            <Td>{r.appVersion ?? '-'}</Td>
            <Td>
              <span className="font-semibold text-cyan-300">{r.rating}</span>
            </Td>
            <Td>{typeof r.avgFps === 'number' ? r.avgFps.toFixed(0) : '-'}</Td>
            <Td>
              <div className="flex flex-wrap gap-1">
                {Array.isArray(r.tags)
                  ? r.tags.map((t) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="bg-cyan-900/30 text-cyan-200 border-cyan-700/40"
                      >
                        {humanizeTag(t)}
                      </Badge>
                    ))
                  : null}
              </div>
            </Td>
            <Td>
              <span
                className="max-w-[240px] inline-block align-top whitespace-pre-wrap break-words"
                title={r.notes ?? ''}
              >
                {r.notes ?? ''}
              </span>
            </Td>
            <Td>
              {r.configs ? (
                <div className="flex items-center gap-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 px-2">
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Configs</DialogTitle>
                      </DialogHeader>
                      <div className="mt-2 max-h-[70vh] overflow-auto">
                        <ConfigsList data={r.configs as JsonValue} />
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2"
                    aria-label="Export config as JSON"
                    onClick={() => exportConfigAsJson(r.configs, r.game?.name ?? null, r.id)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <span>-</span>
              )}
            </Td>
            <Td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left font-semibold">{children}</th>
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>
}

function ConfigsList({ data, level = 0 }: { data: JsonValue; level?: number }) {
  if (data == null) return <div className="text-gray-400">-</div>

  const isPrimitive = (v: JsonValue): v is string | number | boolean =>
    typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'

  if (isPrimitive(data)) {
    return <div className="text-gray-200 break-words whitespace-pre-wrap">{String(data)}</div>
  }

  if (Array.isArray(data)) {
    return (
      <div className="space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="pl-3 border-l border-gray-700">
            <ConfigsList data={item} level={level + 1} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {Object.entries(data).map(([k, v]) => (
        <div key={k} className="grid grid-cols-[180px_1fr] gap-3">
          <div className="text-xs uppercase tracking-wide text-cyan-300 font-semibold truncate">
            {k.replace(/_/g, ' ')}
          </div>
          <div className="min-w-0">
            <ConfigsList data={v} level={level + 1} />
          </div>
        </div>
      ))}
    </div>
  )
}

function humanizeTag(tag: string) {
  const spaced = tag.replace(/_/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
