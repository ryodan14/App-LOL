import { app } from 'electron'
import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { DEFAULT_SETTINGS, POLL_INTERVAL_OPTIONS } from '@shared/constants'
import type { AppSettings } from '@shared/types'

let cache: AppSettings | null = null
let writeQueue = Promise.resolve()

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function sanitize(value: Partial<AppSettings>): AppSettings {
  const merged = { ...DEFAULT_SETTINGS, ...value }
  const allowedInterval = POLL_INTERVAL_OPTIONS.includes(
    merged.pollIntervalMs as (typeof POLL_INTERVAL_OPTIONS)[number]
  )
  return {
    ...merged,
    pollIntervalMs: allowedInterval ? merged.pollIntervalMs : DEFAULT_SETTINGS.pollIntervalMs,
    manualLcuPort:
      typeof merged.manualLcuPort === 'number' && merged.manualLcuPort > 0
        ? Math.floor(merged.manualLcuPort)
        : null,
    manualLcuToken: typeof merged.manualLcuToken === 'string' ? merged.manualLcuToken.trim() : ''
  }
}

export async function getSettings(): Promise<AppSettings> {
  if (cache) return cache
  try {
    const raw = await fs.readFile(settingsPath(), 'utf8')
    cache = sanitize(JSON.parse(raw) as Partial<AppSettings>)
  } catch {
    cache = { ...DEFAULT_SETTINGS }
  }
  return cache
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings()
  const next = sanitize({ ...current, ...patch })
  cache = next
  writeQueue = writeQueue
    .then(async () => {
      const file = settingsPath()
      await fs.mkdir(dirname(file), { recursive: true })
      const tmp = `${file}.tmp`
      await fs.writeFile(tmp, JSON.stringify(next, null, 2), 'utf8')
      await fs.rename(tmp, file)
    })
    .catch((error) => {
      console.error('[settings] No se pudo guardar la configuración', error)
    })
  await writeQueue
  return next
}
