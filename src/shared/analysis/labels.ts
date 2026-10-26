import type { Archetype, DamageType, ThreatTag } from './types'

export const THREAT_LABELS: Record<ThreatTag, string> = {
  HEAL: 'Curación',
  SHIELD: 'Escudos',
  HARD_CC: 'CC fuerte',
  SLOW: 'Ralentización',
  MOBILITY: 'Movilidad',
  STEALTH: 'Invisibilidad',
  BURST: 'Burst',
  TANK: 'Tanque',
  POKE: 'Poke',
  MAX_HP: 'Daño porcentual',
  TRUE_DAMAGE: 'Daño verdadero',
  EXECUTE: 'Ejecución',
  AUTO_ATTACK: 'Ataques básicos'
}

export const DAMAGE_LABELS: Record<DamageType, string> = {
  AD: 'Físico',
  AP: 'Mágico',
  MIXED: 'Mixto',
  TRUE: 'Verdadero'
}

export const ARCHETYPE_LABELS: Record<Archetype, string> = {
  marksman: 'Tirador',
  mage: 'Mago',
  'ap-assassin': 'Asesino AP',
  'ad-assassin': 'Asesino AD',
  bruiser: 'Bruiser AD',
  'ap-bruiser': 'Bruiser AP',
  tank: 'Tanque',
  enchanter: 'Enchanter',
  support: 'Soporte'
}
