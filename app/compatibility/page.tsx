"use client"

import React, { useEffect, useMemo, useState } from "react"
import { createBrowserClient } from "@/utils/supabase/browser"    // ← browser client
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Combobox } from "@/components/ui/combobox"

type Device = { id: number; model: string; gpu: string | null; android_ver: string | null }
type RunRow = {
  id: number
  game?: { name: string } | null
  device_id: number
  device?: Device | null
  app_version_id: number
  app_version?: { semver: string } | null
  configs: any
  rating: number
  avg_fps: number | null
  tags: string[] | null
  notes: string | null
  created_at: string | null
}

const supabase = createBrowserClient()
const LIMIT = 200                                    // page size for rows returned

function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

export default function CompatibilityPage() {
  const [query, setQuery] = useState("")
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
  const [deviceId, setDeviceId] = useState("")
  const [deviceInput, setDeviceInput] = useState("")
  const [gpu, setGpu] = useState("")
  const [ratingMin, setRatingMin] = useState<number | null>(null)
  const [sortField, setSortField] = useState<"rating" | "created_at">("rating")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")


  const [devices, setDevices] = useState<Device[]>([])
  const [rows, setRows] = useState<RunRow[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | undefined>()
  const [marketingMap, setMarketingMap] = useState<Record<string, string>>({}) // normalized marketing -> brand+model
  const [marketingDisplays, setMarketingDisplays] = useState<Record<string, string>>({}) // normalized marketing -> display text
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState<number>(0)

  const dQuery = useDebounced(query, 300)

  // Typeahead game suggestions
  const [gameSuggestions, setGameSuggestions] = useState<{ id: number; name: string }[]>([])
  const [gameSuggestionsLoading, setGameSuggestionsLoading] = useState(false)

  // Distinct GPU list derived from devices
  const gpus = useMemo(
    () => Array.from(new Set(devices.map((d) => d.gpu).filter(Boolean))) as string[],
    [devices],
  )

  /* ---------- marketing map logic moved from API route ---------- */
  function normalizeStrict(value: string | null | undefined) {
    return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim()
  }

  function normalizeLooseText(value: string | null | undefined) {
    return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim()
  }

  function parseCsvLine(line: string): string[] {
    const result: string[] = []
    let current = ""
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === "," && !inQuotes) {
        result.push(current)
        current = ""
      } else {
        current += ch
      }
    }
    result.push(current)
    return result.map((v) => v.replace(/^"|"$/g, ""))
  }

  function decodeCsvBuffer(u8: Uint8Array): string {
    if (u8.length >= 2) {
      const b0 = u8[0]
      const b1 = u8[1]
      // UTF-16LE BOM
      if (b0 === 0xff && b1 === 0xfe) {
        const decoder = new TextDecoder("utf-16le")
        const text = decoder.decode(u8.subarray(2))
        return text.replace(/^\uFEFF/, "")
      }
      // UTF-16BE BOM → swap to LE and decode
      if (b0 === 0xfe && b1 === 0xff) {
        const le = new Uint8Array(u8.length - 2)
        for (let i = 2; i + 1 < u8.length; i += 2) {
          le[i - 2] = u8[i + 1]
          le[i - 1] = u8[i]
        }
        const decoder = new TextDecoder("utf-16le")
        const text = decoder.decode(le)
        return text.replace(/^\uFEFF/, "")
      }
    }
    // Fallback: UTF-8 (strip BOM if present)
    let text = new TextDecoder("utf-8").decode(u8)
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1)
    }
    return text.replace(/\u0000/g, "")
  }

  function getAssetPrefix(): string {
    if (typeof window === "undefined") return ""
    const anyWin: any = window as any
    const fromNext = anyWin?.__NEXT_DATA__?.assetPrefix
    if (typeof fromNext === "string" && fromNext.length > 0) {
      return fromNext.replace(/\/$/, "")
    }
    const script = document.querySelector('script[src*="_buildManifest"]') as HTMLScriptElement | null
    if (script?.src) {
      const m = script.src.match(/^(.*)\/_next\//)
      if (m) return m[1]
    }
    return ""
  }

  async function buildMarketingMap(requestedModels: string[]) {
    const desiredNormSet = new Set(requestedModels.map((m) => normalizeStrict(m)))
    const desiredLooseSet = new Set(requestedModels.map((m) => normalizeLooseText(m)))

    const prefix = getAssetPrefix()
    const csvUrl = `${prefix}/supported_devices.csv`

    const ab = await fetch(csvUrl).then((r) => r.arrayBuffer())
    const csvText = decodeCsvBuffer(new Uint8Array(ab))
    const lines = csvText.split(/\r?\n/)

    const mapping: Record<string, string> = {}
    const displays: Record<string, string> = {}

    for (let idx = 1; idx < lines.length; idx++) {
      const line = lines[idx]
      if (!line) continue
      const fields = parseCsvLine(line)
      if (fields.length < 4) continue
      const retailBranding = fields[0]?.replace(/^"|"$/g, "").trim()
      const marketingName = fields[1]?.replace(/^"|"$/g, "").trim()
      const model = fields[3]?.replace(/^"|"$/g, "").trim()

      const modelOnly = model ?? ""
      const brandModel = `${retailBranding ?? ""} ${modelOnly}`.trim()
      const brandMarketing = `${retailBranding ?? ""} ${marketingName ?? ""}`.trim()

      if (!brandModel || !brandMarketing) continue

      const normalizedBrandModel = normalizeStrict(brandModel)
      const normalizedModelOnly = normalizeStrict(modelOnly)
      const looseBrandModel = normalizeLooseText(brandModel)
      const looseModelOnly = normalizeLooseText(modelOnly)

      const isRequested =
        desiredNormSet.has(normalizedBrandModel) ||
        desiredNormSet.has(normalizedModelOnly) ||
        desiredLooseSet.has(looseBrandModel) ||
        desiredLooseSet.has(looseModelOnly)

      if (!isRequested) continue

      if (!(brandModel in mapping)) mapping[brandModel] = brandMarketing
      if (!(brandMarketing in displays)) displays[brandMarketing] = brandModel
    }

    return { mapping, displays }
  }

  /** Fetch devices once on mount */
  useEffect(() => {
    (async () => {
      let all: Device[] = [], from = 0, batch
      do {
        const { data } = await supabase.from("devices").select("*").range(from, from + 999)
        batch = data || []
        all.push(...batch)
        from += 1000
      } while (batch.length === 1000)
      setDevices(all.sort((a, b) => a.model.localeCompare(b.model)))
    })()
  }, [])

  /** After devices load, fetch marketing name mapping for those models */
  useEffect(() => {
    const fetchMarketingMap = async () => {
      if (!devices.length) {
        setMarketingMap({})
        return
      }
      try {
        const models = devices.map((d) => d.model)
        const { mapping, displays } = await buildMarketingMap(models)
        setMarketingMap(mapping ?? {})
        setMarketingDisplays(displays ?? {})
        console.log(`Marketing map is ${JSON.stringify(mapping)}`)
        console.log(`Marketing displays is ${JSON.stringify(displays)}`)
      } catch (err: any) {
        // Non-fatal: just leave mapping empty
        console.error("marketing-map error", err)
        setMarketingMap({})
      }
    }
    fetchMarketingMap()
  }, [devices])

  /** Reset page when filters change */
  useEffect(() => {
    setPage(0)
  }, [selectedGameId, deviceId, gpu, ratingMin, sortField, sortDir])

  /** Fetch runs whenever concrete filters or page change */
  useEffect(() => {
    const loadRuns = async () => {
      const hasFilters = Boolean(selectedGameId || deviceId || gpu || ratingMin !== null)
      if (!hasFilters) {
        // Nothing selected yet; don't query. Show empty rows and not loading.
        setRows([])
        setLoading(false)
        setTotalCount(0)
        return
      }
      setLoading(true)
      try {
        let qb = supabase
          .from("game_runs")
          .select(
            `id,
             device_id,
             rating,
             avg_fps,
             tags,
             notes,
             configs,
             created_at,
             app_version_id,
             app_version:app_versions(semver),
             game:games(name),
             device:devices(id,model,gpu,android_ver)` // join devices
          , { count: "exact" })
          .order(sortField, { ascending: sortDir === "asc" })
          .range(page * LIMIT, page * LIMIT + LIMIT - 1)

        if (selectedGameId) qb = qb.eq("game_id", Number(selectedGameId))
        if (deviceId) qb = qb.eq("device_id", Number(deviceId))
        if (gpu) qb = qb.ilike("device.gpu", `%${gpu}%`)
        if (ratingMin !== null) qb = qb.gte("rating", ratingMin)

        const { data, error, count } = await qb
        if (error) throw error
        // Coerce joins to single objects
        const normalized = (data ?? []).map((d: any) => ({
          ...d,
          game: Array.isArray(d.game) ? d.game[0] ?? null : d.game ?? null,
          device: Array.isArray(d.device) ? d.device[0] ?? null : d.device ?? null,
          app_version: Array.isArray(d.app_version) ? d.app_version[0] ?? null : d.app_version ?? null,
        })) as RunRow[]
        setRows(normalized)
        setTotalCount(count ?? 0)
        setErrorMsg(undefined)
      } catch (err: any) {
        setErrorMsg(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadRuns()
  }, [selectedGameId, deviceId, gpu, ratingMin, page, sortField, sortDir])

  /** Fetch game suggestions while typing */
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!dQuery) {
        setGameSuggestions([])
        setGameSuggestionsLoading(false)
        return
      }
      setGameSuggestionsLoading(true)
      const { data, error } = await supabase
        .from("games")
        .select("id,name")
        .ilike("name", `%${dQuery}%`)
        .order("name")
        .limit(10)
      if (!error) setGameSuggestions(data ?? [])
      setGameSuggestionsLoading(false)
    }
    fetchSuggestions()
  }, [dQuery])

  /** Convenience: map typed device label → id for manual input */
  const deviceLabel = (d: Device) =>
    `${d.model}${d.android_ver ? ` (Android ${d.android_ver})` : ""}`

  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim()

  // Build normalized marketing name -> brand model map from displays
  const marketingToModelNorm = useMemo(() => {
    const out: Record<string, string> = {}
    Object.entries(marketingDisplays).forEach(([marketing, brandModel]) => {
      out[normalize(marketing)] = brandModel
    })
    return out
  }, [marketingDisplays])

  // Build model (brand+model or model-only) -> marketing label map for display
  const modelToMarketing = useMemo(() => {
    const out: Record<string, string> = {}
    // Primary: API mapping Brand Model -> Brand Marketing Name
    Object.entries(marketingMap).forEach(([brandModel, marketing]) => {
      out[normalize(brandModel)] = marketing
      const modelOnly = brandModel.split(" ").slice(1).join(" ") || brandModel
      out[normalize(modelOnly)] = marketing
    })
    // Fallback: invert displays Marketing -> Brand Model
    Object.entries(marketingDisplays).forEach(([marketing, brandModel]) => {
      const bmNorm = normalize(brandModel)
      if (!out[bmNorm]) out[bmNorm] = marketing
      const modelOnly = brandModel.split(" ").slice(1).join(" ") || brandModel
      const moNorm = normalize(modelOnly)
      if (!out[moNorm]) out[moNorm] = marketing
    })
    return out
  }, [marketingMap, marketingDisplays])

  // Which device models are covered by a marketing name? (normalized model string)
  const coveredModelSet = useMemo(() => {
    const s = new Set<string>()
    // displays: marketing -> brandModel (we want model coverage)
    Object.values(marketingDisplays).forEach((brandModel) => {
      // brandModel is "Brand Model"; mark coverage for model-only as well
      const modelOnly = brandModel.split(" ").slice(1).join(" ") || brandModel
      s.add(normalize(brandModel))
      s.add(normalize(modelOnly))
    })
    return s
  }, [marketingDisplays])

  console.log(`Covered model set is ${coveredModelSet}`)

  const resolveDeviceId = (val: string) => {
    const numeric = Number(val)
    if (Number.isFinite(numeric) && val.trim() !== "") return val

    const n = normalize(val)

    // Match marketing name → model mapping via normalized marketing key
    const mappedBrandModel = marketingToModelNorm[n]

    if (mappedBrandModel) {
      // Try brand+model first, then model-only
      const modelOnly = mappedBrandModel.split(" ").slice(1).join(" ") || mappedBrandModel
      const byBrandModel = devices.find((d) => normalize(d.model) === normalize(mappedBrandModel) || normalize(d.model) === normalize(modelOnly))
      if (byBrandModel) return String(byBrandModel.id)
    }

    // Fallbacks: match against various model label forms, case-insensitive
    const found = devices.find((d) => {
      const label = deviceLabel(d)
      const modelOnly = d.model
      const modelWithAndroid = `${d.model} (${d.android_ver ?? "Android"})`
      return normalize(label) === n || normalize(modelOnly) === n || normalize(modelWithAndroid) === n
    })
    return found ? String(found.id) : ""
  }

  const supabaseNotConfigured = errorMsg?.includes("Supabase is not configured")
  const hasFilters = Boolean(selectedGameId || deviceId || gpu || ratingMin !== null)

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
              {/* Search by game */}
              <Combobox
                label="Search by Game"
                placeholder="Elden Ring"
                inputValue={query}
                onInputChange={(val) => {
                  setQuery(val)
                  const match = gameSuggestions.find((g) => g.name === val)
                  setSelectedGameId(match ? match.id : null)
                }}
                items={gameSuggestions.map((g) => ({ value: String(g.id), label: g.name }))}
                emptyText={gameSuggestionsLoading ? "Loading..." : "No results"}
                onSelect={(item) => {
                  setQuery(item.label)
                  setSelectedGameId(Number(item.value))
                }}
              />

              {/* Device typeable dropdown */}
              <Combobox
                label="Device"
                placeholder="Google Pixel 7"
                inputValue={deviceInput}
                onInputChange={(val) => {
                  setDeviceInput(val)
                  setDeviceId(resolveDeviceId(val))
                }}
                items={[
                  // Marketing names first
                  ...Object.entries(marketingDisplays).map(([marketing, brandModel]) => ({
                    value: marketing,
                    label: marketing,
                    meta: brandModel,
                  })),
                  // Fallback to raw model labels ONLY if not covered
                  ...devices
                    .filter((d) => !coveredModelSet.has(normalize(d.model)))
                    .map((d) => ({ value: String(d.id), label: deviceLabel(d) })),
                ]
                .filter(i => i.label.toLowerCase().includes(deviceInput.toLowerCase()))
                .slice(0, 50)
                }
                onSelect={(item) => {
                  setDeviceInput(item.label)
                  setDeviceId(resolveDeviceId(item.label))
                }}
              />

              {/* GPU dropdown */}
              <Combobox
                label="GPU"
                placeholder="Adreno 730"
                inputValue={gpu}
                onInputChange={(val) => setGpu(val)}
                items={gpus.map((g) => ({ value: g, label: g }))}
                onSelect={(item) => setGpu(item.label)}
              />

              {/* Rating filter - Combobox */}
              <Combobox
                label="Rating"
                placeholder={ratingMin !== null ? (ratingMin === 5 ? "5" : `${ratingMin} & above`) : "Any"}
                inputValue=""
                onInputChange={() => {}}
                items={[
                  { value: "", label: "Any" },
                  { value: "5", label: "5" },
                  { value: "4", label: "4 & above" },
                  { value: "3", label: "3 & above" },
                  { value: "2", label: "2 & above" },
                  { value: "1", label: "1 & above" },
                ]}
                onSelect={(item) => {
                  setRatingMin(item.value ? Number(item.value) : null)
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Supabase not configured note */}
        {supabaseNotConfigured && (
          <div className="mb-6 rounded-md border border-yellow-600/40 bg-yellow-900/20 p-4 text-yellow-200">
            Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to enable live data.
          </div>
        )}

        {/* Table */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <CompatibilityTable
                rows={rows}
                loading={loading}
                errorMessage={errorMsg}
                hasFilters={hasFilters}
                modelToMarketing={modelToMarketing}
                sortField={sortField}
                sortDir={sortDir}
                onSortChange={(field) => {
                  if (field === sortField) {
                    setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                  } else {
                    setSortField(field)
                    setSortDir("desc")
                  }
                }}
              />
            </div>
            {/* Pagination footer */}
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
                        className={page === 0 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {/* Current page indicator */}
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
                        className={page >= Math.ceil(totalCount / LIMIT) - 1 ? "pointer-events-none opacity-50" : ""}
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

/* ---------- presentation helpers ---------- */

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
  rows: RunRow[]
  loading: boolean
  errorMessage?: string
  hasFilters: boolean
  modelToMarketing: Record<string, string>
  sortField: "rating" | "created_at"
  sortDir: "asc" | "desc"
  onSortChange: (field: "rating" | "created_at") => void
}) {
  if (loading) return <div className="p-6 text-gray-300">Loading…</div>
  if (errorMessage) return <div className="p-6 text-red-300">Error: {errorMessage}</div>
  if (!rows.length) {
    return (
      <div className="p-6 text-gray-300">
        {hasFilters ? "No results found." : "Add a filter to get started"}
      </div>
    )
  }

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
              onClick={() => onSortChange("rating")}
            >
              <span>Rating</span>
              {sortField === "rating" ? (
                sortDir === "asc" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                )
              ) : null}
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
              onClick={() => onSortChange("created_at")}
            >
              <span>Created</span>
              {sortField === "created_at" ? (
                sortDir === "asc" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                )
              ) : null}
            </button>
          </Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800 text-gray-100">
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-white/5">
            <Td>{r.game?.name ?? "-"}</Td>
            <Td>{r.device?.model ? (modelToMarketing[r.device.model.toLowerCase()] ?? modelToMarketing[r.device.model.split(" ").slice(1).join(" ").toLowerCase()] ?? r.device.model) : "-"}</Td>
            <Td>{r.device?.gpu ?? "-"}</Td>
            <Td>{r.device?.android_ver ?? "-"}</Td>
            <Td>{r.app_version?.semver ?? "-"}</Td>
            <Td>
              <span className="font-semibold text-cyan-300">{r.rating}</span>
            </Td>
            <Td>{typeof r.avg_fps === "number" ? r.avg_fps.toFixed(0) : "-"}</Td>
            <Td>
              <div className="flex flex-wrap gap-1">
                {Array.isArray(r.tags)
                  ? r.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="bg-cyan-900/30 text-cyan-200 border-cyan-700/40">
                        {humanizeTag(t)}
                      </Badge>
                    ))
                  : null}
              </div>
            </Td>
            <Td>
              <span className="max-w-[240px] inline-block align-top whitespace-pre-wrap break-words" title={r.notes ?? ""}>
                {r.notes ?? ""}
              </span>
            </Td>
            <Td>
              {r.configs ? (
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
                      <ConfigsList data={r.configs} />
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <span>-</span>
              )}
            </Td>
            <Td>{r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</Td>
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

/** Pretty key-value renderer for JSON-like objects */
function ConfigsList({ data, level = 0 }: { data: any; level?: number }) {
  if (data == null) return <div className="text-gray-400">-</div>

  // Primitive values
  const isPrimitive = (v: any) =>
    typeof v === "string" || typeof v === "number" || typeof v === "boolean"

  if (isPrimitive(data)) {
    return (
      <div className="text-gray-200 break-words whitespace-pre-wrap">
        {String(data)}
      </div>
    )
  }

  // Arrays
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

  // Objects
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([k, v]) => (
        <div key={k} className="grid grid-cols-[180px_1fr] gap-3">
          <div className="text-xs uppercase tracking-wide text-cyan-300 font-semibold truncate">
            {k.replace(/_/g, " ")}
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
  const spaced = tag.replace(/_/g, " ")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
