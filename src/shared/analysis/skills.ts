import type { Champion, Role } from '../types'
import { t } from '../i18n'
import { stripHtml } from './text'
import type { Archetype, SkillKey, SkillOrder, SkillOrderEntry } from './types'

const BASIC_KEYS: SkillKey[] = ['Q', 'W', 'E']
const ALL_KEYS: SkillKey[] = ['Q', 'W', 'E', 'R']

const BASE_PRIORITY: Record<Archetype, SkillKey[]> = {
  marksman: ['Q', 'W', 'E'],
  mage: ['Q', 'E', 'W'],
  'ap-assassin': ['Q', 'E', 'W'],
  'ad-assassin': ['Q', 'E', 'W'],
  bruiser: ['Q', 'E', 'W'],
  'ap-bruiser': ['Q', 'E', 'W'],
  tank: ['Q', 'E', 'W'],
  enchanter: ['W', 'E', 'Q'],
  support: ['E', 'W', 'Q']
}

const ROLE_BONUS: Partial<Record<Role, Partial<Record<SkillKey, number>>>> = {
  TOP: { Q: 0.2, W: 0.1 },
  JUNGLE: { Q: 0.2, E: 0.2 },
  MIDDLE: { Q: 0.25 },
  BOTTOM: { Q: 0.25, W: 0.15 },
  UTILITY: { W: 0.55, E: 0.45, Q: -0.25 }
}

interface SkillWeights {
  damage: number
  crowdControl: number
  sustain: number
  autoAttack: number
  mobility: number
  poke: number
  waveClear: number
}

const WEIGHTS: Record<Archetype, SkillWeights> = {
  marksman: {
    damage: 2,
    crowdControl: 0.7,
    sustain: 0.3,
    autoAttack: 2.4,
    mobility: 0.8,
    poke: 0.7,
    waveClear: 0.5
  },
  mage: {
    damage: 2.6,
    crowdControl: 1,
    sustain: 0.2,
    autoAttack: 0.1,
    mobility: 0.4,
    poke: 0.9,
    waveClear: 1.4
  },
  'ap-assassin': {
    damage: 2.8,
    crowdControl: 0.5,
    sustain: 0.2,
    autoAttack: 0.2,
    mobility: 0.8,
    poke: 0.4,
    waveClear: 0.5
  },
  'ad-assassin': {
    damage: 2.8,
    crowdControl: 0.5,
    sustain: 0.2,
    autoAttack: 0.4,
    mobility: 0.8,
    poke: 0.3,
    waveClear: 0.5
  },
  bruiser: {
    damage: 2.6,
    crowdControl: 0.8,
    sustain: 0.6,
    autoAttack: 0.8,
    mobility: 0.35,
    poke: 0.2,
    waveClear: 0.7
  },
  'ap-bruiser': {
    damage: 2.4,
    crowdControl: 0.8,
    sustain: 0.8,
    autoAttack: 0.5,
    mobility: 0.35,
    poke: 0.4,
    waveClear: 0.7
  },
  tank: {
    damage: 1.5,
    crowdControl: 1.8,
    sustain: 1,
    autoAttack: 0.3,
    mobility: 0.3,
    poke: 0.2,
    waveClear: 0.6
  },
  enchanter: {
    damage: 0.5,
    crowdControl: 1,
    sustain: 3,
    autoAttack: 0.3,
    mobility: 0.3,
    poke: 0.2,
    waveClear: 0.2
  },
  support: {
    damage: 1.2,
    crowdControl: 1.7,
    sustain: 1.2,
    autoAttack: 0.4,
    mobility: 0.3,
    poke: 0.3,
    waveClear: 0.3
  }
}

const DAMAGE_TEXT = /daño|damage/i
const DAMAGE_ACTION = /inflige|causa|hace|daña|damages?|deals?|golpe|impacto|strike|hit/i
const DEFENSIVE = /bloquea el daño|reduce el daño|absorbe|mitiga|daño recibido|damage taken|escudo|barrera|shield/i
const AREA = /área|area|enemigos cercanos|nearby|todos los enemigos|all enemies/i
const HARD_CC =
  /aturd|inmoviliz|enraíz|enraiz|miedo|encanta(?:r|do)?|silencia|derrib|noque|supresión|suprime|dormir|duerme|adormec|somnol|hipnotiz|desarm|por los aires|arrastr|agarra(?:r|do)?|paraliz|taunt|stun|root|fear|charm|silence|knock|airborne|suppress|sleep|disarm|immobiliz/i
const SLOW = /ralentiz|reduce (?:la )?velocidad de movimiento|slow/i
const SUSTAIN = /cura|restaura|regenera|robo de vida|omnivamp|escudo|barrera|protege|protección|heal|restore|life steal|omnivamp|shield/i
const AUTO_ATTACK = /ataque básico|ataques básicos|velocidad de ataque|basic attack|attack speed|on-hit|on hit/i
const MOBILITY =
  /se lanza|se desliza|salta hacia|salto de|embestida|embiste|teletransport|parpadea|se desplaza|se abalanza|dash|blink|leap|charge|teleport/i
const EXECUTE = /ejecut|ejecutar|ejecución|vida restante|vida faltante|execute|missing health/i
const PERCENT_HEALTH = /vida máxima|salud máxima|porcentaje de vida|% de vida|maximum health|max health|target's health/i
const PENETRATION = /penetración|penetration|reduce (?:la )?armadura|reducción de armadura|armor shred|reduce (?:la )?resistencia mágica/i

function scoreSpell(
  spell: Champion['spells'][number],
  weights: SkillWeights
): number {
  const text = stripHtml(spell.description)
  let score = 1

  const directDamage = DAMAGE_ACTION.test(text)
  const damage = directDamage || (!DEFENSIVE.test(text) && DAMAGE_TEXT.test(text))
  if (damage) score += weights.damage
  if (AREA.test(text)) score += weights.waveClear
  if (HARD_CC.test(text)) score += weights.crowdControl
  if (SLOW.test(text)) score += weights.crowdControl * 0.6
  if (SUSTAIN.test(text)) score += weights.sustain
  if (AUTO_ATTACK.test(text)) score += weights.autoAttack
  if (MOBILITY.test(text)) score += weights.mobility
  if ((spell.range[0] ?? 0) >= 900 && damage) score += weights.poke
  if (EXECUTE.test(text) || PERCENT_HEALTH.test(text) || PENETRATION.test(text)) score += 0.45

  const cooldown = spell.cooldown[0] ?? 0
  if (cooldown > 0 && cooldown <= 6) score += 0.3
  if (cooldown >= 15) score -= 0.2

  return score
}

function buildNote(
  priority: SkillKey[],
  entries: SkillOrderEntry[]
): string {
  const names = priority
    .map((key) => entries.find((entry) => entry.key === key)?.name)
    .filter((name): name is string => Boolean(name))

  if (names.length === 0) return t('Sin datos de habilidades para este campeón.')
  if (names.length === 1) {
    return t('Maxea {first} y adapta el resto a tu línea.', { first: names[0] })
  }
  return t('Maxea {first} y después {second}; sube la definitiva en 6, 11 y 16.', {
    first: names[0],
    second: names[1]
  })
}

export function generateSkillOrder(
  champion: Champion,
  role: Role,
  archetype: Archetype
): SkillOrder {
  const weights = WEIGHTS[archetype]
  const base = BASE_PRIORITY[archetype]
  const roleBonus = ROLE_BONUS[role] ?? {}

  const available = BASIC_KEYS.map((key, index) => {
    const spell = champion.spells[index]
    return spell ? { key, index, spell } : null
  }).filter((entry): entry is { key: SkillKey; index: number; spell: Champion['spells'][number] } =>
    Boolean(entry)
  )

  const scored = available
    .map((entry) => ({
      ...entry,
      score:
        scoreSpell(entry.spell, weights) +
        (base.length - base.indexOf(entry.key)) * 0.65 +
        (roleBonus[entry.key] ?? 0)
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)

  const priority = scored.map((entry) => entry.key)
  const maxOrders = new Map(priority.map((key, index) => [key, index + 1]))

  const entries: SkillOrderEntry[] = champion.spells
    .slice(0, 4)
    .map((spell, index) => {
      const key = ALL_KEYS[index]
      if (!key) return null
      return {
        key,
        name: spell.name,
        image: spell.image,
        maxOrder: key === 'R' ? null : (maxOrders.get(key) ?? null)
      }
    })
    .filter((entry): entry is SkillOrderEntry => Boolean(entry))

  return {
    priority,
    entries,
    ultimateLevels: [6, 11, 16],
    note: buildNote(priority, entries)
  }
}
