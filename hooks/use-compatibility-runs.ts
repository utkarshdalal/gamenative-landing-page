import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { getCompatibility, ApiError } from '@/utils/api'
import type { CompatibilityRun } from '@/types/api'

const LIMIT = 200

export interface CompatibilityFilters {
  gameId: number | null
  deviceId: number | null
  gpu: string
  ratingMin: number | null
  sort: 'rating' | 'created_at'
  dir: 'asc' | 'desc'
}

interface UseCompatibilityRunsReturn {
  runs: CompatibilityRun[]
  totalCount: number
  page: number
  setPage: Dispatch<SetStateAction<number>>
  loading: boolean
  error: string | undefined
  hasFilters: boolean
}

/** Serialize filters (excluding page) to detect when they change. */
function filtersKey(f: CompatibilityFilters): string {
  return `${f.gameId}|${f.deviceId}|${f.gpu}|${f.ratingMin}|${f.sort}|${f.dir}`
}

/**
 * Fetches paginated compatibility runs with abort support.
 * Resets the page to 0 automatically when filters change.
 */
export function useCompatibilityRuns(filters: CompatibilityFilters): UseCompatibilityRunsReturn {
  const [runs, setRuns] = useState<CompatibilityRun[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const hasFilters = Boolean(
    filters.gameId || filters.deviceId || filters.gpu || filters.ratingMin !== null,
  )

  // Reset page to 0 when filters change (not on page change itself)
  const prevKeyRef = useRef(filtersKey(filters))
  const currentKey = filtersKey(filters)
  if (currentKey !== prevKeyRef.current) {
    prevKeyRef.current = currentKey
    setPage(0)
  }

  useEffect(() => {
    if (!hasFilters) {
      setRuns([])
      setTotalCount(0)
      setLoading(false)
      setError(undefined)
      return
    }

    const ac = new AbortController()
    setLoading(true)

    getCompatibility(
      {
        gameId: filters.gameId ?? undefined,
        deviceId: filters.deviceId ?? undefined,
        gpu: filters.gpu || undefined,
        ratingMin: filters.ratingMin ?? undefined,
        sort: filters.sort,
        dir: filters.dir,
        page,
        limit: LIMIT,
      },
      ac.signal,
    )
      .then(({ runs, total }) => {
        if (!ac.signal.aborted) {
          setRuns(runs)
          setTotalCount(total)
          setError(undefined)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (ac.signal.aborted) return
        const message =
          err instanceof ApiError || err instanceof Error ? err.message : 'Failed to load runs'
        setError(message)
        setLoading(false)
      })

    return () => ac.abort()
  }, [
    hasFilters,
    filters.gameId,
    filters.deviceId,
    filters.gpu,
    filters.ratingMin,
    filters.sort,
    filters.dir,
    page,
  ])

  return { runs, totalCount, page, setPage, loading, error, hasFilters }
}
