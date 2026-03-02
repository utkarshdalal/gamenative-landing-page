/**
 * Resolves device model numbers (e.g. "SM-S928B") to human-readable
 * marketing names (e.g. "Samsung Galaxy S24 Ultra") using Google's
 * supported_devices.csv that ships in /public.
 */

function normalizeStrict(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function normalizeLooseText(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim()
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
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
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result.map((v) => v.replace(/^"|"$/g, ''))
}

function decodeCsvBuffer(u8: Uint8Array): string {
  if (u8.length >= 2) {
    const b0 = u8[0]
    const b1 = u8[1]
    // UTF-16LE BOM
    if (b0 === 0xff && b1 === 0xfe) {
      const decoder = new TextDecoder('utf-16le')
      const text = decoder.decode(u8.subarray(2))
      return text.replace(/^\uFEFF/, '')
    }
    // UTF-16BE BOM → swap to LE and decode
    if (b0 === 0xfe && b1 === 0xff) {
      const le = new Uint8Array(u8.length - 2)
      for (let i = 2; i + 1 < u8.length; i += 2) {
        le[i - 2] = u8[i + 1]
        le[i - 1] = u8[i]
      }
      const decoder = new TextDecoder('utf-16le')
      const text = decoder.decode(le)
      return text.replace(/^\uFEFF/, '')
    }
  }
  // Fallback: UTF-8 (strip BOM if present)
  let text = new TextDecoder('utf-8').decode(u8)
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1)
  }
  return text.replace(/\u0000/g, '')
}

function getAssetPrefix(): string {
  if (typeof window === 'undefined') return ''
  const nextData = (window as Window & { __NEXT_DATA__?: { assetPrefix?: string } }).__NEXT_DATA__
  const fromNext = nextData?.assetPrefix
  if (typeof fromNext === 'string' && fromNext.length > 0) {
    return fromNext.replace(/\/$/, '')
  }
  const script = document.querySelector('script[src*="_buildManifest"]') as HTMLScriptElement | null
  if (script?.src) {
    const m = script.src.match(/^(.*)\/_next\//)
    if (m) return m[1]
  }
  return ''
}

export interface MarketingMapResult {
  /** brandModel → brandMarketing  (e.g. "samsung SM-S928B" → "Samsung Galaxy S24 Ultra") */
  mapping: Record<string, string>
  /** brandMarketing → brandModel  (inverse of mapping) */
  displays: Record<string, string>
}

/**
 * Fetches `supported_devices.csv` and builds a bidirectional mapping
 * between device model strings and their marketing names, filtered to
 * only the models present in `requestedModels`.
 */
export async function buildMarketingMap(
  requestedModels: string[],
  signal?: AbortSignal,
): Promise<MarketingMapResult> {
  const desiredNormSet = new Set(requestedModels.map((m) => normalizeStrict(m)))
  const desiredLooseSet = new Set(requestedModels.map((m) => normalizeLooseText(m)))

  const prefix = getAssetPrefix()
  const csvUrl = `${prefix}/supported_devices.csv`

  const res = await fetch(csvUrl, { signal })
  if (!res.ok) throw new Error(`Failed to fetch device CSV (${res.status})`)
  const ab = await res.arrayBuffer()
  const csvText = decodeCsvBuffer(new Uint8Array(ab))
  const lines = csvText.split(/\r?\n/)

  const mapping: Record<string, string> = {}
  const displays: Record<string, string> = {}

  for (let idx = 1; idx < lines.length; idx++) {
    const line = lines[idx]
    if (!line) continue
    const fields = parseCsvLine(line)
    if (fields.length < 4) continue
    const retailBranding = fields[0]?.replace(/^"|"$/g, '').trim()
    const marketingName = fields[1]?.replace(/^"|"$/g, '').trim()
    const model = fields[3]?.replace(/^"|"$/g, '').trim()

    const modelOnly = model ?? ''
    const brandModel = `${retailBranding ?? ''} ${modelOnly}`.trim()
    const brandMarketing = `${retailBranding ?? ''} ${marketingName ?? ''}`.trim()

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
