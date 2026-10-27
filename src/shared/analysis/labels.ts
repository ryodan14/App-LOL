import { t } from '../i18n'
import type { Archetype, DamageType, Priority, ThreatTag } from './types'

const THREAT_SOURCE: Record<ThreatTag, string> = {
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

const DAMAGE_SOURCE: Record<DamageType, string> = {
  AD: 'Físico',
  AP: 'Mágico',
  MIXED: 'Mixto',
  TRUE: 'Verdadero'
}

const ARCHETYPE_SOURCE: Record<Archetype, string> = {
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

const PRIORITY_SOURCE: Record<Priority, string> = {
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja'
}

export function threatLabel(tag: ThreatTag): string {
  return t(THREAT_SOURCE[tag])
}

export function damageLabel(type: DamageType): string {
  return t(DAMAGE_SOURCE[type])
}

export function archetypeLabel(archetype: Archetype): string {
  return t(ARCHETYPE_SOURCE[archetype])
}

export function priorityLabel(priority: Priority): string {
  return t(PRIORITY_SOURCE[priority])
}
