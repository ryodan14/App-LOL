import { app } from 'electron'
import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  DEFAULT_OVERLAY_OPACITY,
  DEFAULT_OVERLAY_SCALE,
  DEFAULT_SETTINGS,
  OVERLAY_CORNER_OPTIONS,
  OVERLAY_SCALE_OPTIONS,
  POLL_INTERVAL_OPTIONS
} from '@shared/constants'
import { DEFAULT_LOCALE, isLocale } from '@shared/i18n'
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
  const allowedOverlayScale = OVERLAY_SCALE_OPTIONS.includes(
    merged.overlayScale as (typeof OVERLAY_SCALE_OPTIONS)[number]
  )
  const allowedOverlayCorner = OVERLAY_CORNER_OPTIONS.includes(merged.overlayCorner)
  const overlayOpacity = Number(merged.overlayOpacity)
  return {
    ...merged,
    language: isLocale(merged.language) ? merged.language : DEFAULT_LOCALE,
    overlayEnabled: Boolean(merged.overlayEnabled),
    overlayScale: allowedOverlayScale ? merged.overlayScale : DEFAULT_OVERLAY_SCALE,
    overlayOpacity: Number.isFinite(overlayOpacity)
      ? Math.round(Math.min(1, Math.max(0.35, overlayOpacity)) * 100) / 100
      : DEFAULT_OVERLAY_OPACITY,
    overlayCorner: allowedOverlayCorner ? merged.overlayCorner : 'top-right',
    overlayShowGold: Boolean(merged.overlayShowGold),
    overlayShowObjectives: Boolean(merged.overlayShowObjectives),
    overlayShowChampSelect: Boolean(merged.overlayShowChampSelect),
    overlayGoldOnDemand: Boolean(merged.overlayGoldOnDemand),
    startWithWindows: Boolean(merged.startWithWindows),
    showWithLeague: Boolean(merged.showWithLeague),
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
