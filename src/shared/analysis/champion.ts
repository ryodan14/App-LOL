import type { Champion, Role } from '../types'
import { ARCHETYPE_LABELS } from './labels'
import { countMatches, stripHtml } from './text'
import type {
  Archetype,
  DamageType,
  KeySpell,
  Threat,
  ThreatProfile,
  ThreatTag
} from './types'

const HEAL =
  /cura(?:r|ción|do)?|se cura|restaura (?:vida|salud)|regenera (?:vida|salud)|robo de vida|omnivampirismo|absorbe (?:vida|salud)|heal|healing|restore health|life steal|omnivamp/gi
const SHIELD = /escudo|escudos|barrera|protege|protección|shield/gi
const HARD_CC =
  /aturd|inmoviliz|enraíz|enraiz|provoca a (?:los )?enemigos|provoca que (?:los )?enemigos|miedo|encanta(?:r|do)?|silencia|derrib|noque|supresión|suprime|dormir|duerme|adormec|somnol|hipnotiz|desarm|por los aires|lanza(?:r)? por los aires|arrastr|agarra(?:r|do)?|paraliz|taunt|stun|root|fear|charm|silence|knock|airborne|suppress|sleep|disarm|immobiliz/gi
const SLOW = /ralentiz|reduce (?:la )?velocidad de movimiento|slow/gi
const MOBILITY =
  /se lanza|se desliza|salta hacia|salto de|embestida|embiste|teletransport|parpadea|se desplaza|se abalanza|persigue|dash|blink|leap|charge|teleport/gi
const STEALTH = /invisib|oculta|sigilo|camuflaje|stealth|invisible/gi
const EXECUTE =
  /ejecuta|ejecutar|ejecución|muerte súbita|vida restante|vida faltante|porcentaje de vida faltante|execute|missing health/gi
const MAX_HP =
  /vida máxima|salud máxima|porcentaje de vida|% de vida|vida del objetivo|maximum health|max health|target's health/gi
const TRUE_DAMAGE = /daño verdadero|daño puro|true damage/gi
const AUTO_ATTACK =
  /ataque básico|ataques básicos|velocidad de ataque|basic attack|attack speed/gi
const PHYSICAL = /daño físico|physical damage/gi
const MAGIC = /daño mágico|magic damage/gi
const DAMAGE = /daño|damage/gi
const SUPPORT_HEAL = /cura|restaura|regenera|escudo|barrera|protege|proteger|protección|shield|heal/gi

const ENCHANTER_IDS = new Set([16, 26, 37, 40, 43, 117, 147, 267, 350, 497, 888, 902])

function championText(champion: Champion): string {
  return [
    champion.passive.name,
    stripHtml(champion.passive.description),
    ...champion.spells.flatMap((spell) => [spell.name, stripHtml(spell.description)])
  ].join(' ')
}

function getDamageType(champion: Champion, text: string): DamageType {
  const physical = countMatches(text, PHYSICAL)
  const magic = countMatches(text, MAGIC)
  const trueDamage = countMatches(text, TRUE_DAMAGE)
  const info = champion.info
  const tags = champion.tags

  if (physical + magic >= 2) {
    if (magic > physical * 1.25) return 'AP'
    if (physical > magic * 1.25) return 'AD'
    return 'MIXED'
  }

  if (tags.includes('Marksman')) return 'AD'
  if (tags.includes('Mage') && info.magic >= info.attack + 2) return 'AP'
  if (tags.includes('Assassin')) return info.magic >= info.attack + 2 ? 'AP' : 'AD'
  if (tags.includes('Mage')) return info.magic >= info.attack ? 'AP' : 'MIXED'
  if (tags.includes('Fighter')) return info.magic >= info.attack + 3 ? 'AP' : 'AD'
  if (tags.includes('Tank')) {
    if (physical === 0 && magic > 0) return 'AP'
    if (magic === 0 && physical > 0) return 'AD'
    const difference = info.magic - info.attack
    if (Math.abs(difference) <= 2) return 'MIXED'
    return difference > 0 ? 'AP' : 'AD'
  }
  if (tags.includes('Support')) return info.magic >= info.attack ? 'AP' : 'AD'
  if (trueDamage > 0) return 'TRUE'
  return 'MIXED'
}

export function classifyArchetype(champion: Champion, role?: Role): Archetype {
  const text = championText(champion)
  const damage = getDamageType(champion, text)
  const tags = champion.tags
  const info = champion.info
  const supportKit = countMatches(text, SUPPORT_HEAL) > 0

  if (role === 'UTILITY') {
    if (tags.includes('Tank') || info.defense >= 8) return 'support'
    if (tags.includes('Marksman')) return 'marksman'
    if (tags.includes('Assassin')) return damage === 'AP' ? 'ap-assassin' : 'ad-assassin'
    if (tags.includes('Support')) {
      if (ENCHANTER_IDS.has(champion.key)) return 'enchanter'
      if (tags.includes('Mage')) return 'mage'
      return 'support'
    }
    if (tags.includes('Mage')) return 'mage'
    if (tags.includes('Fighter')) return damage === 'AP' ? 'ap-bruiser' : 'bruiser'
    return supportKit && damage === 'AP' ? 'enchanter' : 'support'
  }

  if (tags.includes('Marksman')) return 'marksman'
  if (tags.includes('Assassin')) return damage === 'AP' ? 'ap-assassin' : 'ad-assassin'
  if (tags.includes('Fighter')) {
    if (damage === 'AP') return 'ap-bruiser'
    return info.defense >= 8 && !tags.includes('Mage') ? 'tank' : 'bruiser'
  }
  if (tags.includes('Tank')) return 'tank'
  if (tags.includes('Mage')) return 'mage'
  if (tags.includes('Support')) {
    if (ENCHANTER_IDS.has(champion.key)) return 'enchanter'
    return supportKit && damage === 'AP' ? 'enchanter' : 'support'
  }
  return damage === 'AP' ? 'mage' : 'bruiser'
}

function severity(value: number, fallback: 1 | 2 | 3 = 2): 1 | 2 | 3 {
  if (value >= 3) return 3
  if (value === 2) return 2
  return fallback
}

export function analyzeChampion(champion: Champion, role?: Role): ThreatProfile {
  const text = championText(champion)
  const tags = champion.tags
  const info = champion.info
  const damageType = getDamageType(champion, text)
  const archetype = classifyArchetype(champion, role)
  const threats: Threat[] = []
  const addThreat = (tag: ThreatTag, level: 1 | 2 | 3, reason: string): void => {
    threats.push({ tag, severity: level, reason })
  }

  const healCount = countMatches(text, HEAL)
  if (healCount > 0) {
    addThreat(
      'HEAL',
      severity(healCount),
      'Tiene curación, regeneración o robo de vida en su kit'
    )
  }

  if (countMatches(text, SHIELD) > 0) {
    addThreat('SHIELD', 2, 'Puede absorber daño con escudos')
  }

  const ccCount = countMatches(text, HARD_CC)
  if (ccCount > 0) {
    addThreat('HARD_CC', severity(ccCount), 'Su kit incluye control de masas fuerte')
  }

  if (countMatches(text, SLOW) > 0) {
    addThreat('SLOW', 1, 'Puede ralentizar para alcanzar o escapar')
  }

  const mobilityCount = countMatches(text, MOBILITY)
  if (mobilityCount > 0) {
    addThreat(
      'MOBILITY',
      tags.includes('Assassin') || mobilityCount >= 2 ? 3 : 2,
      'Tiene dash, salto o reposicionamiento rápido'
    )
  }

  if (countMatches(text, STEALTH) > 0) {
    addThreat('STEALTH', tags.includes('Assassin') ? 3 : 2, 'Puede volverse invisible')
  }

  const pokeSpells = champion.spells.filter(
    (spell) => (spell.range[0] ?? 0) >= 900 && countMatches(stripHtml(spell.description), DAMAGE) > 0
  )
  if (pokeSpells.length > 0) {
    addThreat(
      'POKE',
      pokeSpells.length >= 2 ? 3 : 2,
      'Puede hacer daño desde muy lejos'
    )
  }

  if (tags.includes('Assassin') || (tags.includes('Mage') && mobilityCount > 0)) {
    addThreat(
      'BURST',
      3,
      tags.includes('Assassin') ? 'Puede eliminar objetivos en una combo' : 'Tiene burst mágico alto'
    )
  } else if (tags.includes('Fighter') && info.attack >= 7) {
    addThreat('BURST', 2, 'Tiene picos de daño altos en peleas cortas')
  }

  if (tags.includes('Tank')) {
    addThreat('TANK', info.defense >= 8 ? 3 : 2, 'Aguanta mucho daño en peleas prolongadas')
  }

  if (countMatches(text, MAX_HP) > 0) {
    addThreat('MAX_HP', 2, 'Castiga objetivos con mucha vida')
  }

  if (countMatches(text, TRUE_DAMAGE) > 0) {
    addThreat('TRUE_DAMAGE', 2, 'Parte de su daño ignora resistencias')
  }

  if (countMatches(text, EXECUTE) > 0) {
    addThreat('EXECUTE', 2, 'Puede rematar objetivos con poca vida')
  }

  if (tags.includes('Marksman') || countMatches(text, AUTO_ATTACK) >= 2) {
    addThreat('AUTO_ATTACK', tags.includes('Marksman') ? 2 : 1, 'Depende de ataques básicos')
  }

  const keySpells: KeySpell[] = champion.spells
    .map((spell) => {
      const spellText = stripHtml(spell.description)
      const reasons: string[] = []
      if (countMatches(spellText, HARD_CC) > 0) reasons.push('CC')
      if (countMatches(spellText, MOBILITY) > 0) reasons.push('Movilidad')
      if (countMatches(spellText, HEAL) > 0 || countMatches(spellText, SHIELD) > 0) {
        reasons.push('Sostenibilidad')
      }
      if (countMatches(spellText, EXECUTE) > 0) reasons.push('Ejecución')
      if (countMatches(spellText, MAX_HP) > 0) reasons.push('Daño porcentual')
      if ((spell.range[0] ?? 0) >= 900 && countMatches(spellText, DAMAGE) > 0) {
        reasons.push('Poke')
      }
      return { name: spell.name, reasons }
    })
    .filter((spell) => spell.reasons.length > 0)
    .sort((a, b) => b.reasons.length - a.reasons.length)
    .slice(0, 3)

  const notes: string[] = []
  if (damageType === 'AP') notes.push('La mayor parte de su daño es mágico')
  if (damageType === 'AD') notes.push('La mayor parte de su daño es físico')
  if (damageType === 'MIXED') notes.push('Tiene daño mixto: necesitas ambas resistencias')
  if (damageType === 'TRUE') notes.push('Su daño principal ignora resistencias')
  if (threats.some((threat) => threat.tag === 'HARD_CC')) {
    notes.push('Su CC condiciona las peleas: guarda tenacidad o movilidad')
  }
  if (tags.includes('Tank')) notes.push('Evita peleas largas sin penetración de resistencias')
  if (tags.includes('Assassin')) notes.push('Respeta su rango de burst y wardea sus entradas')

  return {
    championId: champion.key,
    championName: champion.name,
    damageType,
    archetype,
    archetypeLabel: ARCHETYPE_LABELS[archetype],
    difficulty: info.difficulty,
    threats,
    keySpells,
    notes
  }
}
