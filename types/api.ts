/** Shared types for the GameNative worker API (api.gamenative.app). */

// ── Response wrapper ────────────────────────────────────────────────

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

// ── GET /api/devices ────────────────────────────────────────────────

export interface Device {
  id: number
  model: string
  gpu: string | null
  androidVer: string | null
}

export interface DevicesResponse {
  devices: Device[]
}

// ── GET /api/games/search?q=... ─────────────────────────────────────

export interface GameSuggestion {
  id: number
  name: string
}

export interface GamesSearchResponse {
  games: GameSuggestion[]
}

// ── GET /api/compatibility?... ──────────────────────────────────────

export interface GameRunConfigExtraData {
  box64Version?: string
  fexcoreVersion?: string
  dxwrapper?: string
  graphicsDriver?: string
  audioDriver?: string
  appVersion?: string
  imgVersion?: string
  wincomponents?: string
  desktopTheme?: string
  config_changed?: string
  startupSelection?: string
  fexcorePreset?: string
  sharpnessEffect?: string
  sharpnessLevel?: string
  sharpnessDenoise?: string
  [key: string]: string | undefined
}

export interface GameRunConfigs {
  containerVariant?: string
  wineVersion?: string
  emulator?: string
  dxwrapper?: string
  dxwrapperConfig?: string
  graphicsDriver?: string
  graphicsDriverConfig?: string
  gpu?: string
  extraData?: GameRunConfigExtraData
  [key: string]: JsonValue | GameRunConfigExtraData | undefined
}

export interface CompatibilityRun {
  id: number
  game: { name: string } | null
  device: Device | null
  appVersion: string | null
  configs: GameRunConfigs | null
  rating: number
  avgFps: number | null
  tags: string[] | null
  notes: string | null
  createdAt: string | null
}

export interface CompatibilityResponse {
  runs: CompatibilityRun[]
  total: number
}

export interface CompatibilityParams {
  gameId?: number
  deviceId?: number
  gpu?: string
  ratingMin?: number
  sort?: 'rating' | 'created_at'
  dir?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// ── Utility ─────────────────────────────────────────────────────────

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }
