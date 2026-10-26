import type { AppSettings, Role } from './types'

export const DEFAULT_SETTINGS: AppSettings = {
  alwaysOnTop: false,
  reduceMotion: false,
  autoDetectClient: true,
  pollIntervalMs: 2000,
  customLcuPath: '',
  manualLcuPort: null,
  manualLcuToken: '',
  showSplashArt: true,
  overlayEnabled: true
}

export const DATA_LANGUAGE = 'es_ES'

export const POLL_INTERVAL_OPTIONS = [1000, 2000, 3000, 5000] as const

export const ROLE_LABELS: Record<Role, string> = {
  TOP: 'Top',
  JUNGLE: 'Jungla',
  MIDDLE: 'Mid',
  BOTTOM: 'ADC',
  UTILITY: 'Support',
  UNKNOWN: 'Sin rol'
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

export const QUEUE_LABELS: Record<string, string> = {
  RANKED_SOLO_5x5: 'Solo/Dúo',
  RANKED_FLEX_SR: 'Flex 5v5',
  RANKED_TFT: 'TFT',
  RANKED_TFT_DOUBLE_UP: 'TFT Dúo'
}

export const TIER_LABELS: Record<string, string> = {
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
