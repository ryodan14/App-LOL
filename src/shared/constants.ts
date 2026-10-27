import { t } from './i18n'
import type { AppSettings, OverlayCorner, Role } from './types'

export const OVERLAY_SCALE_OPTIONS = [0.6, 0.7, 0.8, 0.9, 1] as const
export const DEFAULT_OVERLAY_SCALE = 0.8
export const DEFAULT_OVERLAY_OPACITY = 0.75
export const OVERLAY_CORNER_OPTIONS: OverlayCorner[] = [
  'top-right',
  'top-left',
  'bottom-right',
  'bottom-left',
  'right-center',
  'left-center'
]

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'es',
  alwaysOnTop: false,
  reduceMotion: false,
  autoDetectClient: true,
  pollIntervalMs: 2000,
  customLcuPath: '',
  manualLcuPort: null,
  manualLcuToken: '',
  showSplashArt: true,
  overlayEnabled: true,
  overlayScale: DEFAULT_OVERLAY_SCALE,
  overlayOpacity: DEFAULT_OVERLAY_OPACITY,
  overlayCorner: 'top-right',
  overlayShowGold: true,
  overlayShowObjectives: true,
  overlayShowChampSelect: true,
  overlayGoldOnDemand: true,
  startWithWindows: true,
  showWithLeague: true
}

export const POLL_INTERVAL_OPTIONS = [1000, 2000, 3000, 5000] as const

const ROLE_SOURCE: Record<Role, string> = {
  TOP: 'Top',
  JUNGLE: 'Jungla',
  MIDDLE: 'Mid',
  BOTTOM: 'ADC',
  UTILITY: 'Support',
  UNKNOWN: 'Sin rol'
}

export function roleLabel(role: Role): string {
  return t(ROLE_SOURCE[role])
}

export const ROLE_ORDER: Role[] = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY', 'UNKNOWN']

export const ROLE_FROM_LCU: Record<string, Role> = {
  top: 'TOP',
  jungle: 'JUNGLE',
  middle: 'MIDDLE',
  bottom: 'BOTTOM',
  utility: 'UTILITY'
}

export const ROLE_TO_LCU: Record<Role, string> = {
  TOP: 'top',
  JUNGLE: 'jungle',
  MIDDLE: 'middle',
  BOTTOM: 'bottom',
  UTILITY: 'utility',
  UNKNOWN: 'none'
}

const QUEUE_SOURCE: Record<string, string> = {
  RANKED_SOLO_5x5: 'Solo/Dúo',
  RANKED_FLEX_SR: 'Flex 5v5',
  RANKED_TFT: 'TFT',
  RANKED_TFT_DOUBLE_UP: 'TFT Dúo'
}

export function queueLabel(queue: string): string {
  return QUEUE_SOURCE[queue] ? t(QUEUE_SOURCE[queue]) : queue
}

const TIER_SOURCE: Record<string, string> = {
  IRON: 'Hierro',
  BRONZE: 'Bronce',
  SILVER: 'Plata',
  GOLD: 'Oro',
  PLATINUM: 'Platino',
  EMERALD: 'Esmeralda',
  DIAMOND: 'Diamante',
  MASTER: 'Maestro',
  GRANDMASTER: 'Gran Maestro',
  CHALLENGER: 'Retador',
  UNRANKED: 'Sin rango'
}

export function tierLabel(tier: string): string {
  return TIER_SOURCE[tier.toUpperCase()] ? t(TIER_SOURCE[tier.toUpperCase()]) : tier
}
