import type { GameRunConfigs } from '@/types/api'

/** Trigger a browser download of configs as a JSON file. */
export function exportConfigAsJson(
  configs: GameRunConfigs | null,
  gameName: string | null | undefined,
  runId: number,
) {
  const json = JSON.stringify(configs, null, 2)
  const sanitized =
    gameName && gameName.trim()
      ? gameName
          .trim()
          .replace(/[^a-zA-Z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      : ''
  const filename = sanitized ? `${sanitized}-config.json` : `config-${runId}.json`
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
