import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { TextDecoder } from "util"

type MarketingMapRequest = {
  models: string[]
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim()
}

// Loose normalization: strip non-alphanumerics for fuzzy matching (e.g., SM-A035M vs SM-A035M/DS)
function normalizeLoose(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim()
}

// Very small CSV line parser that supports quoted fields and commas within quotes
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

// Decode CSV buffer handling UTF-16 (Excel) and UTF-8 with/without BOM
function decodeCsvBuffer(buf: Buffer): string {
  if (buf.length >= 2) {
    const b0 = buf[0]
    const b1 = buf[1]
    // UTF-16LE BOM
    if (b0 === 0xff && b1 === 0xfe) {
      const decoder = new TextDecoder("utf-16le")
      const text = decoder.decode(buf.subarray(2))
      return text.replace(/^\uFEFF/, "")
    }
    // UTF-16BE BOM → swap to LE and decode
    if (b0 === 0xfe && b1 === 0xff) {
      const le = Buffer.allocUnsafe(buf.length - 2)
      for (let i = 2; i + 1 < buf.length; i += 2) {
        le[i - 2] = buf[i + 1]
        le[i - 1] = buf[i]
      }
      const decoder = new TextDecoder("utf-16le")
      const text = decoder.decode(le)
      return text.replace(/^\uFEFF/, "")
    }
  }
  // Fallback: UTF-8 (strip BOM if present)
  let text = buf.toString("utf8")
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1)
  }
  // Extra safety: remove stray nulls if any
  return text.replace(/\u0000/g, "")
}

async function buildMapping(requestedModels: string[]) {
  const desiredNormSet = new Set(requestedModels.map((m) => normalize(m)))
  const desiredLooseSet = new Set(requestedModels.map((m) => normalizeLoose(m)))

  let csvText: string
  const rootPath = path.join(process.cwd(), "supported_devices.csv")
  try {
    const buf = await readFile(rootPath)
    csvText = decodeCsvBuffer(buf)
  } catch (e) {
    const publicPath = path.join(process.cwd(), "public", "supported_devices.csv")
    const buf = await readFile(publicPath)
    csvText = decodeCsvBuffer(buf)
  }
  const lines = csvText.split(/\r?\n/)

  // Header: Retail Branding,Marketing Name,Device,Model
  // mapping: "{Retail Branding} {Model}" -> "{Retail Branding} {Marketing Name}"
  // displays: "{Retail Branding} {Marketing Name}" -> "{Retail Branding} {Model}"
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

    const normalizedBrandModel = normalize(brandModel)
    const normalizedModelOnly = normalize(modelOnly)
    const looseBrandModel = normalizeLoose(brandModel)
    const looseModelOnly = normalizeLoose(modelOnly)

    // Keep rows that match requested models by exact, model-only, or loose variants
    const isRequested =
      desiredNormSet.has(normalizedBrandModel) ||
      desiredNormSet.has(normalizedModelOnly) ||
      desiredLooseSet.has(looseBrandModel) ||
      desiredLooseSet.has(looseModelOnly)

    if (!isRequested) continue

    // mapping: Brand Model -> Brand Marketing Name (raw keys/values)
    if (!(brandModel in mapping)) mapping[brandModel] = brandMarketing
    // displays: Brand Marketing Name -> Brand Model (raw keys/values)
    if (!(brandMarketing in displays)) displays[brandMarketing] = brandModel
  }

  return { mapping, displays }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as MarketingMapRequest
    const requestedModels = Array.isArray(body?.models) ? body.models : []
    if (!requestedModels.length) {
      return NextResponse.json({ mapping: {}, displays: {} }, { status: 200 })
    }
    const result = await buildMapping(requestedModels)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ mapping: {}, displays: {}, error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const modelsParam = url.searchParams.get("models")
    let requestedModels: string[] = []
    if (modelsParam) {
      // Accept either comma-separated or JSON array
      try {
        if (modelsParam.trim().startsWith("[")) {
          const parsed = JSON.parse(modelsParam)
          if (Array.isArray(parsed)) requestedModels = parsed.map(String)
        } else {
          requestedModels = modelsParam.split(",").map((s) => s.trim()).filter(Boolean)
        }
      } catch {
        requestedModels = []
      }
    }
    if (!requestedModels.length) {
      return NextResponse.json({ mapping: {}, displays: {} }, { status: 200 })
    }
    const result = await buildMapping(requestedModels)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ mapping: {}, displays: {}, error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}


