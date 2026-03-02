import type {
  ApiErrorBody,
  CompatibilityParams,
  CompatibilityResponse,
  DevicesResponse,
  GamesSearchResponse,
} from '@/types/api'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.gamenative.app'

export class ApiError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) {
    const body: ApiErrorBody = await res.json().catch(() => ({
      error: { code: 'NETWORK_ERROR', message: `HTTP ${res.status}` },
    }))
    throw new ApiError(body.error.code, body.error.message)
  }
  return res.json() as Promise<T>
}

export async function searchGames(q: string, signal?: AbortSignal): Promise<GamesSearchResponse> {
  return request<GamesSearchResponse>(`/api/games/search?q=${encodeURIComponent(q)}`, { signal })
}

export async function getDevices(signal?: AbortSignal): Promise<DevicesResponse> {
  return request<DevicesResponse>('/api/devices', { signal })
}

export async function getCompatibility(
  params: CompatibilityParams,
  signal?: AbortSignal,
): Promise<CompatibilityResponse> {
  const qs = new URLSearchParams()
  if (params.gameId != null) qs.set('gameId', String(params.gameId))
  if (params.deviceId != null) qs.set('deviceId', String(params.deviceId))
  if (params.gpu) qs.set('gpu', params.gpu)
  if (params.ratingMin != null) qs.set('ratingMin', String(params.ratingMin))
  if (params.sort) qs.set('sort', params.sort)
  if (params.dir) qs.set('dir', params.dir)
  if (params.page != null) qs.set('page', String(params.page))
  if (params.limit != null) qs.set('limit', String(params.limit))
  return request<CompatibilityResponse>(`/api/compatibility?${qs.toString()}`, { signal })
}
