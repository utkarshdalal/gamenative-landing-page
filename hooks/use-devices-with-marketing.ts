import { useEffect, useState } from 'react'
import { getDevices, ApiError } from '@/utils/api'
import { buildMarketingMap } from '@/lib/marketing-map'
import { normalize } from '@/lib/device-utils'
import type { Device } from '@/types/api'

interface DevicesState {
  devices: Device[]
  gpus: string[]
  /** normalized brand+model → marketing name */
  modelToMarketing: Record<string, string>
  /** normalized marketing name → brand+model string */
  marketingToModelNorm: Record<string, string>
  /** set of normalized model strings covered by marketing names */
  coveredModelSet: Set<string>
  /** marketing name → brand+model (original casing, for dropdown display) */
  marketingDisplays: Record<string, string>
  loading: boolean
  error: string | undefined
}

const INITIAL: DevicesState = {
  devices: [],
  gpus: [],
  modelToMarketing: {},
  marketingToModelNorm: {},
  coveredModelSet: new Set(),
  marketingDisplays: {},
  loading: true,
  error: undefined,
}

/**
 * Fetches device list and marketing CSV in a single pipeline,
 * then computes all derived lookup maps once.
 */
export function useDevicesWithMarketing(): DevicesState {
  const [state, setState] = useState<DevicesState>(INITIAL)

  useEffect(() => {
    const ac = new AbortController()

    async function load() {
      try {
        const { devices } = await getDevices(ac.signal)

        // Build marketing map from CSV (sequential — needs device models)
        const models = devices.map((d) => d.model)
        let mapping: Record<string, string> = {}
        let displays: Record<string, string> = {}

        try {
          const result = await buildMarketingMap(models, ac.signal)
          mapping = result.mapping
          displays = result.displays
        } catch {
          // Marketing map is non-critical — devices still work without it
        }

        if (ac.signal.aborted) return

        // Compute all derived maps in one pass
        const gpus = Array.from(new Set(devices.map((d) => d.gpu).filter(Boolean))) as string[]

        const modelToMarketing: Record<string, string> = {}
        for (const [brandModel, marketing] of Object.entries(mapping)) {
          modelToMarketing[normalize(brandModel)] = marketing
          const modelOnly = brandModel.split(' ').slice(1).join(' ') || brandModel
          modelToMarketing[normalize(modelOnly)] = marketing
        }
        for (const [marketing, brandModel] of Object.entries(displays)) {
          const bmNorm = normalize(brandModel)
          if (!modelToMarketing[bmNorm]) modelToMarketing[bmNorm] = marketing
          const modelOnly = brandModel.split(' ').slice(1).join(' ') || brandModel
          const moNorm = normalize(modelOnly)
          if (!modelToMarketing[moNorm]) modelToMarketing[moNorm] = marketing
        }

        const marketingToModelNorm: Record<string, string> = {}
        for (const [marketing, brandModel] of Object.entries(displays)) {
          marketingToModelNorm[normalize(marketing)] = brandModel
        }

        const coveredModelSet = new Set<string>()
        for (const brandModel of Object.values(displays)) {
          const modelOnly = brandModel.split(' ').slice(1).join(' ') || brandModel
          coveredModelSet.add(normalize(brandModel))
          coveredModelSet.add(normalize(modelOnly))
        }

        setState({
          devices,
          gpus,
          modelToMarketing,
          marketingToModelNorm,
          coveredModelSet,
          marketingDisplays: displays,
          loading: false,
          error: undefined,
        })
      } catch (err) {
        if (ac.signal.aborted) return
        const message =
          err instanceof ApiError || err instanceof Error ? err.message : 'Failed to load devices'
        setState((prev) => ({ ...prev, loading: false, error: message }))
      }
    }

    load()
    return () => ac.abort()
  }, [])

  return state
}
