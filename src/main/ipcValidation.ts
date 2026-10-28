import {
  OVERLAY_CORNER_OPTIONS,
  OVERLAY_SCALE_OPTIONS,
  POLL_INTERVAL_OPTIONS
} from '@shared/constants'
import { isLocale } from '@shared/i18n'
import type { AppSettings, LcuItemSetExport, LcuRuneExport, Role } from '@shared/types'
import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron'

const SETTINGS_KEYS = new Set([
  'language',
  'alwaysOnTop',
  'reduceMotion',
  'autoDetectClient',
  'pollIntervalMs',
  'customLcuPath',
  'manualLcuPort',
  'manualLcuToken',
  'showSplashArt',
  'overlayEnabled',
  'overlayScale',
  'overlayOpacity',
  'overlayCorner',
  'overlayShowGold',
  'overlayShowObjectives',
  'overlayShowChampSelect',
  'overlayGoldOnDemand',
  'startWithWindows',
  'showWithLeague'
])

const BOOLEAN_SETTINGS = new Set([
  'alwaysOnTop',
  'reduceMotion',
  'autoDetectClient',
  'showSplashArt',
  'overlayEnabled',
  'overlayShowGold',
  'overlayShowObjectives',
  'overlayShowChampSelect',
  'overlayGoldOnDemand',
  'startWithWindows',
  'showWithLeague'
])

const ROLES = new Set<Role>(['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY', 'UNKNOWN'])
const MAP_IDS = new Set([11, 12, 30])
const MAX_ITEMS = 100
const MAX_NAME = 80
const MAX_PATH = 4096
const MAX_ID = 10_000_000

function invalid(label: string): Error {
  return new Error(`Datos no válidos: ${label}.`)
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(label)
  return value as Record<string, unknown>
}

function asInteger(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw invalid(label)
  }
  return value
}

function asNumber(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw invalid(label)
  }
  return value
}

function asString(value: unknown, label: string, max: number, allowEmpty = false): string {
  if (typeof value !== 'string' || value.length > max || (!allowEmpty && value.trim() === '')) {
    throw invalid(label)
  }
  return value
}

function asIdArray(value: unknown, label: string): number[] {
  if (!Array.isArray(value) || value.length > MAX_ITEMS) throw invalid(label)
  return value.map((entry, index) => asInteger(entry, `${label}[${index}]`, 1, MAX_ID))
}

function asRole(value: unknown): Role {
  if (typeof value !== 'string' || !ROLES.has(value as Role)) throw invalid('rol')
  return value as Role
}

function asMapId(value: unknown): number | undefined {
  if (value === undefined) return undefined
  const mapId = asInteger(value, 'mapa', 1, MAX_ID)
  if (!MAP_IDS.has(mapId)) throw invalid('mapa')
  return mapId
}

export function parseSettingsPatch(value: unknown): Partial<AppSettings> {
  const input = asRecord(value, 'configuración')
  const patch: Partial<AppSettings> = {}
  const writable = patch as Record<string, unknown>

  for (const [key, raw] of Object.entries(input)) {
    if (!SETTINGS_KEYS.has(key)) throw invalid(`configuración.${key}`)

    if (BOOLEAN_SETTINGS.has(key)) {
      if (typeof raw !== 'boolean') throw invalid(`configuración.${key}`)
      writable[key] = raw
      continue
    }

    switch (key) {
      case 'language':
        if (!isLocale(raw)) throw invalid('idioma')
        patch.language = raw
        break
      case 'pollIntervalMs':
        if (
          typeof raw !== 'number' ||
          !POLL_INTERVAL_OPTIONS.includes(raw as (typeof POLL_INTERVAL_OPTIONS)[number])
        ) {
          throw invalid('frecuencia de actualización')
        }
        patch.pollIntervalMs = raw
        break
      case 'customLcuPath':
        patch.customLcuPath = asString(raw, 'ruta del cliente', MAX_PATH, true)
        break
      case 'manualLcuPort':
        patch.manualLcuPort =
          raw === null ? null : asInteger(raw, 'puerto del cliente', 1, 65535)
        break
      case 'manualLcuToken':
        patch.manualLcuToken = asString(raw, 'token del cliente', MAX_PATH, true)
        break
      case 'overlayScale':
        if (
          typeof raw !== 'number' ||
          !OVERLAY_SCALE_OPTIONS.includes(raw as (typeof OVERLAY_SCALE_OPTIONS)[number])
        ) {
          throw invalid('escala del overlay')
        }
        patch.overlayScale = raw
        break
      case 'overlayOpacity':
        patch.overlayOpacity = asNumber(raw, 'opacidad del overlay', 0.35, 1)
        break
      case 'overlayCorner':
        if (
          typeof raw !== 'string' ||
          !OVERLAY_CORNER_OPTIONS.includes(raw as (typeof OVERLAY_CORNER_OPTIONS)[number])
        ) {
          throw invalid('posición del overlay')
        }
        patch.overlayCorner = raw as AppSettings['overlayCorner']
        break
      default:
        throw invalid(`configuración.${key}`)
    }
  }

  return patch
}

export function parseItemSetExport(value: unknown): LcuItemSetExport {
  const input = asRecord(value, 'conjunto de objetos')
  const payload: LcuItemSetExport = {
    championId: asInteger(input.championId, 'campeón', 1, MAX_ID),
    championName: asString(input.championName, 'nombre del campeón', MAX_NAME),
    role: asRole(input.role),
    mapId: asMapId(input.mapId),
    starting: asIdArray(input.starting, 'objetos de salida'),
    first: asIdArray(input.first, 'primer objeto'),
    boots: asIdArray(input.boots, 'botas'),
    core: asIdArray(input.core, 'núcleo'),
    situational: asIdArray(input.situational, 'situacionales')
  }
  const total = [
    payload.starting,
    payload.first,
    payload.boots,
    payload.core,
    payload.situational
  ]
    .flat()
    .filter((id) => Number.isInteger(id) && id > 0).length
  if (total === 0) throw invalid('la build no tiene objetos')
  return payload
}

export function parseRuneExport(value: unknown): LcuRuneExport {
  const input = asRecord(value, 'página de runas')
  const selectedPerkIds = asIdArray(input.selectedPerkIds, 'runas')
  if (selectedPerkIds.length < 6 || selectedPerkIds.length > 20) {
    throw invalid('runas seleccionadas')
  }
  return {
    championId: asInteger(input.championId, 'campeón', 1, MAX_ID),
    championName: asString(input.championName, 'nombre del campeón', MAX_NAME),
    role: asRole(input.role),
    primaryStyleId: asInteger(input.primaryStyleId, 'estilo principal', 1, MAX_ID),
    subStyleId: asInteger(input.subStyleId, 'estilo secundario', 1, MAX_ID),
    selectedPerkIds
  }
}

export function parseExternalUrl(value: unknown): string {
  const raw = asString(value, 'URL', 2048)
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw invalid('URL')
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw invalid('URL')
  if (url.username || url.password) throw invalid('URL')
  return url.toString()
}

export function parseBoolean(value: unknown): boolean {
  if (typeof value !== 'boolean') throw invalid('valor booleano')
  return value
}

export function assertTrustedSender(event: IpcMainInvokeEvent | IpcMainEvent): void {
  const frame = event.senderFrame
  if (!frame || frame !== event.sender.mainFrame) throw invalid('remitente')
  const devUrl = process.env['ELECTRON_RENDERER_URL']
  const trusted = frame.url.startsWith('file://') || Boolean(devUrl && frame.url.startsWith(devUrl))
  if (!trusted) throw invalid('origen')
}
