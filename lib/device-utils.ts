import type { Device } from '@/types/api'

/** Lowercase, collapse whitespace, trim. */
export function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Display string: "SM-S928B (Android 14)" */
export function deviceLabel(d: Device): string {
  return `${d.model}${d.androidVer ? ` (Android ${d.androidVer})` : ''}`
}

/**
 * Resolve user input (marketing name, model string, or raw numeric ID)
 * to a device ID. Returns null when no match is found.
 */
export function resolveDeviceId(
  value: string,
  devices: Device[],
  marketingToModelNorm: Record<string, string>,
): number | null {
  if (!value.trim()) return null

  const numeric = Number(value)
  if (Number.isFinite(numeric) && value.trim() !== '') return numeric

  const n = normalize(value)
  const mappedBrandModel = marketingToModelNorm[n]

  if (mappedBrandModel) {
    const modelOnly = mappedBrandModel.split(' ').slice(1).join(' ') || mappedBrandModel
    const match = devices.find(
      (d) =>
        normalize(d.model) === normalize(mappedBrandModel) ||
        normalize(d.model) === normalize(modelOnly),
    )
    if (match) return match.id
  }

  const found = devices.find((d) => {
    const label = deviceLabel(d)
    const modelWithAndroid = `${d.model} (${d.androidVer ?? 'Android'})`
    return normalize(label) === n || normalize(d.model) === n || normalize(modelWithAndroid) === n
  })
  return found ? found.id : null
}
