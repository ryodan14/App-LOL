import type { Champion, Item, Role } from '../types'
import { classifyArchetype } from './champion'
import { ARCHETYPE_LABELS } from './labels'
import { analyzeTeam } from './team'
import { stripHtml } from './text'
import type { AnalysisIndex, Archetype, BuildItem, BuildPlan, CounterNeed } from './types'

const NEED_ITEM_IDS: Record<string, Partial<Record<Archetype, number[]>>> = {
  antiheal: {
    marksman: [3033],
    'ad-assassin': [6609],
    bruiser: [6609],
    'ap-assassin': [3165],
    mage: [3165],
    'ap-bruiser': [3165],
    tank: [3075],
    enchanter: [3011],
    support: [3011]
  },
  antishield: {
    marksman: [6695],
    'ad-assassin': [6695],
    bruiser: [6695],
    'ap-assassin': [4645],
    mage: [4645],
    'ap-bruiser': [4645]
  },
  armor: {
    tank: [3075, 3143, 3110, 3742],
    bruiser: [3143, 3742, 3053],
    'ap-bruiser': [3143, 3053, 3110],
    support: [3190, 3109],
    marksman: [3026]
  },
  mr: {
    tank: [3065, 2504, 4401],
    bruiser: [3065, 4401, 3156],
    'ap-bruiser': [3065, 4401, 3102],
    marksman: [3156, 3091],
    mage: [3102],
    'ap-assassin': [3102],
    support: [3190]
  },
  antitank: {
    marksman: [3036],
    'ad-assassin': [6694],
    bruiser: [3153],
    mage: [3135],
    'ap-assassin': [3135],
    'ap-bruiser': [3135],
    tank: [6653]
  },
  tenacity: {
    marksman: [3140, 6035],
    'ad-assassin': [3140, 6035],
    bruiser: [3140, 6035, 3091],
    'ap-bruiser': [3140, 6035, 3091],
    mage: [3140, 6035],
    'ap-assassin': [3140, 6035],
    tank: [3140, 6035, 3091],
    enchanter: [3140],
    support: [3140]
  },
  antiauto: {
    tank: [3143, 3110],
    bruiser: [3143],
    support: [3110]
  },
  antistealth: {
    'ad-assassin': [3179],
    support: [3179]
  },
  antipoke: {
    marksman: [3072],
    tank: [3065],
    bruiser: [3065],
    'ap-bruiser': [3065],
    enchanter: [3222, 3107],
    support: [3107]
  },
  antiburts: {
    marksman: [3026, 3156],
    mage: [3157, 3102],
    'ap-assassin': [3157, 3102],
    'ad-assassin': [3814],
    bruiser: [3053, 6333],
    'ap-bruiser': [3053, 6333],
    enchanter: [3190],
    support: [3190]
  },
  antiexecute: {
    marksman: [3026],
    mage: [3157],
    'ap-assassin': [3157],
    bruiser: [3053],
    'ap-bruiser': [3053]
  }
}

const ENCHANTER_ITEM_BONUS: Record<number, number> = {
  6617: 45,
  3504: 40,
  6616: 40,
  3107: 35,
  3222: 35,
  6620: 35
}

const STARTING_IDS = {
  doranBlade: 1055,
  doranRing: 1056,
  doranShield: 1054,
  potion: 2003,
  worldAtlas: 3865,
  gustwalker: 1102,
  mosstomper: 1103,
  scorchclaw: 1101
} as const

function isPurchasable(item: Item): boolean {
  return (
    item.maps['11'] === true &&
    item.gold.purchasable &&
    item.gold.total > 0 &&
    item.inStore !== false &&
    !item.requiredChampion
  )
}

function isBoots(item: Item): boolean {
  return item.tags.includes('Boots')
}

function legendaryPool(index: AnalysisIndex): Item[] {
  return index.data.items.filter(
    (item) =>
      isPurchasable(item) &&
      !isBoots(item) &&
      !item.tags.includes('Jungle') &&
      !item.tags.includes('Lane') &&
      !item.tags.includes('GoldPer') &&
      !item.tags.includes('Consumable') &&
      !item.tags.includes('Trinket') &&
      item.gold.total >= 2200 &&
      (!item.into || item.into.length === 0)
  )
}

function parseNumber(text: string, pattern: RegExp): number {
  const match = pattern.exec(text)
  return match?.[1] ? Number(match[1]) : 0
}

function itemText(item: Item): string {
  return `${stripHtml(item.description)} ${stripHtml(item.plaintext)}`
}

function itemStats(item: Item): {
  ad: number
  ap: number
  hp: number
  armor: number
  mr: number
  as: number
  crit: number
  lifesteal: number
  mana: number
  mpRegen: number
  ms: number
  haste: number
  lethality: number
  armorPen: number
  magicPen: number
  healShield: number
} {
  const stats = item.stats
  const text = itemText(item)
  const tags = item.tags
  const parsedHaste = parseNumber(
    text,
    /(\d+)\s*(?:de\s+)?(?:velocidad de habilidades|aceleración de habilidades|ability haste)/i
  )
  const haste =
    parsedHaste ||
    (tags.includes('AbilityHaste') ? 15 : tags.includes('CooldownReduction') ? 10 : 0)

  return {
    ad: stats.FlatPhysicalDamageMod ?? 0,
    ap: stats.FlatMagicDamageMod ?? 0,
    hp: stats.FlatHPPoolMod ?? 0,
    armor: stats.FlatArmorMod ?? 0,
    mr: stats.FlatSpellBlockMod ?? 0,
    as: (stats.PercentAttackSpeedMod ?? 0) * 100,
    crit: (stats.FlatCritChanceMod ?? 0) * 100,
    lifesteal: (stats.PercentLifeStealMod ?? 0) * 100,
    mana: stats.FlatMPPoolMod ?? 0,
    mpRegen: (stats.FlatMPRegenMod ?? 0) + (stats.PercentMPRegenMod ?? 0) * 100,
    ms: (stats.PercentMovementSpeedMod ?? 0) * 100,
    haste,
    lethality: parseNumber(text, /(\d+)\s*(?:de\s+)?(?:letalidad|lethality)/i),
    armorPen:
      parseNumber(
        text,
        /(\d+)%\s*(?:de\s+)?(?:penetración de armadura|armor penetration)/i
      ) + (tags.includes('ArmorPenetration') ? 8 : 0),
    magicPen:
      parseNumber(text, /(\d+)\s*(?:de\s+)?(?:penetración mágica|magic penetration)/i) +
      (tags.includes('MagicPenetration') ? 8 : 0),
    healShield: parseNumber(
      text,
      /(\d+)%\s*(?:de\s+)?(?:poder de curación y escudos|heal and shield power)/i
    )
  }
}

function scoreItem(item: Item, archetype: Archetype): number {
  const s = itemStats(item)
  const tags = item.tags
  let score = item.gold.total * 0.04

  switch (archetype) {
    case 'marksman':
      score += s.ad * 2.1 + s.crit * 5.5 + s.as * 1.5 + s.lifesteal * 3 + s.haste * 0.7
      score += s.armorPen * 1.8 + s.ms * 1.2
      if (tags.includes('OnHit')) score += 10
      break
    case 'mage':
      score += s.ap * 2.0 + s.magicPen * 4.5 + s.haste * 1.5 + s.hp * 0.1 + s.mana * 0.015
      score += s.ms * 0.8
      break
    case 'ap-assassin':
      score += s.ap * 2.1 + s.magicPen * 5.5 + s.haste * 1.3 + s.hp * 0.07 + s.ms * 1.4
      break
    case 'ad-assassin':
      score += s.ad * 2.5 + s.lethality * 4 + s.armorPen * 2.5 + s.haste * 1.1
      score += s.hp * 0.07 + s.ms * 1.5
      break
    case 'bruiser':
      score += s.ad * 2.2 + s.hp * 0.15 + s.armor * 0.8 + s.mr * 0.8 + s.haste * 1.0
      score += s.as * 0.8 + s.lifesteal * 2 + s.ms * 0.5
      break
    case 'ap-bruiser':
      score += s.ap * 1.9 + s.hp * 0.15 + s.armor * 0.8 + s.mr * 0.8 + s.haste * 1.1
      score += s.as * 0.6 + s.ms * 0.5
      break
    case 'tank':
      score += s.hp * 0.55 + s.armor * 1.4 + s.mr * 1.4 + s.haste * 0.9 + s.ms * 0.3
      break
    case 'enchanter':
      score += s.ap * 0.6 + s.hp * 0.08 + s.haste * 2.0 + s.healShield * 8
      score += s.mpRegen * 12 + s.mana * 0.03 + s.ms * 1.2
      if (tags.includes('ManaRegen')) score += 10
      if (/curación|curar|escudos|heal|shield/i.test(itemText(item))) score += 80
      score += ENCHANTER_ITEM_BONUS[item.id] ?? 0
      if (
        !tags.includes('ManaRegen') &&
        !tags.includes('AbilityHaste') &&
        !tags.includes('SpellDamage')
      ) {
        score -= 120
      }
      break
    case 'support':
      score += s.hp * 0.22 + s.armor * 1.5 + s.mr * 1.5 + s.haste * 2.2 + s.ap * 0.5
      score += s.healShield * 3 + s.ms * 0.8
      if (
        !tags.includes('Armor') &&
        !tags.includes('SpellBlock') &&
        !tags.includes('AbilityHaste') &&
        !tags.includes('ManaRegen')
      ) {
        score -= 100
      }
      break
  }

  if (archetype === 'marksman' && tags.includes('CriticalStrike')) score += 8
  if (archetype === 'marksman' && tags.includes('AttackSpeed')) score += 6
  if (
    (archetype === 'mage' || archetype === 'ap-assassin' || archetype === 'ap-bruiser') &&
    tags.includes('SpellDamage')
  ) {
    score += 8
  }
  if (archetype === 'tank' && (tags.includes('Armor') || tags.includes('SpellBlock'))) score += 8
  if (archetype === 'enchanter' && tags.includes('ManaRegen')) score += 6

  return score
}

function statSummary(item: Item): string {
  const s = itemStats(item)
  const parts: string[] = []
  if (s.ap > 0) parts.push(`${s.ap} de poder de habilidad`)
  if (s.ad > 0) parts.push(`${s.ad} de daño de ataque`)
  if (s.hp > 0) parts.push(`${s.hp} de vida`)
  if (s.armor > 0) parts.push(`${s.armor} de armadura`)
  if (s.mr > 0) parts.push(`${s.mr} de resistencia mágica`)
  if (s.crit > 0) parts.push(`${s.crit}% de crítico`)
  if (s.as > 0) parts.push(`${s.as}% de velocidad de ataque`)
  if (s.haste > 0) parts.push(`${s.haste} de aceleración de habilidades`)
  if (s.healShield > 0) parts.push(`${s.healShield}% de poder de curación y escudos`)
  return parts.slice(0, 3).join(' y ') || 'Estadísticas defensivas'
}

function toBuildItem(item: Item, reason: string): BuildItem {
  return { item, reason }
}

function findItem(index: AnalysisIndex, id: number): Item | null {
  return index.itemById.get(id) ?? null
}

function findNeedItem(
  need: CounterNeed,
  archetype: Archetype,
  index: AnalysisIndex,
  used: Set<number>
): BuildItem | null {
  const ids = NEED_ITEM_IDS[need.id]?.[archetype] ?? []
  for (const id of ids) {
    if (used.has(id)) continue
    const item = findItem(index, id)
    if (!item || !isPurchasable(item) || isBoots(item)) continue
    return toBuildItem(item, `${need.label}: ${need.description}`)
  }
  return null
}

function chooseBoots(
  archetype: Archetype,
  team: ReturnType<typeof analyzeTeam>,
  index: AnalysisIndex
): BuildItem | null {
  const hardCc = team.threatCounts.HARD_CC ?? 0
  const ad = team.damage.AD + team.damage.MIXED * 0.5
  const ap = team.damage.AP + team.damage.MIXED * 0.5
  let preferredId = 3158
  let reason = 'Botas de aceleración para esquivar y rotar'

  if (hardCc >= 2 || ap >= 2) {
    preferredId = 3111
    reason = hardCc >= 2 ? 'Botas de RM y tenacidad contra el CC enemigo' : 'Botas de RM contra daño mágico'
  } else if (ad >= 2) {
    preferredId = 3047
    reason = 'Botas de armadura contra daño físico'
  } else if (archetype === 'marksman') {
    preferredId = 3006
    reason = 'Botas de velocidad de ataque para tu daño sostenido'
  } else if (
    archetype === 'mage' ||
    archetype === 'ap-assassin' ||
    archetype === 'ap-bruiser'
  ) {
    preferredId = 3020
    reason = 'Botas de penetración mágica para aumentar tu daño'
  } else if (archetype === 'enchanter' || archetype === 'support') {
    preferredId = 3158
    reason = 'Botas de aceleración para más utilidad'
  } else if (archetype === 'tank') {
    preferredId = ad >= ap ? 3047 : 3111
    reason = ad >= ap ? 'Botas de armadura contra daño físico' : 'Botas de RM contra daño mágico'
  } else if (archetype === 'ad-assassin' || archetype === 'bruiser') {
    preferredId = ad >= 2 ? 3047 : 3158
    reason = ad >= 2 ? 'Botas de armadura para sobrevivir el intercambio' : 'Botas de aceleración'
  }

  const preferred = findItem(index, preferredId)
  if (preferred && isPurchasable(preferred) && isBoots(preferred)) {
    return toBuildItem(preferred, reason)
  }

  const fallback = index.data.items.find((item) => isPurchasable(item) && isBoots(item))
  return fallback ? toBuildItem(fallback, 'Botas situacionales') : null
}

function chooseStarting(
  archetype: Archetype,
  role: Role,
  team: ReturnType<typeof analyzeTeam>,
  index: AnalysisIndex
): BuildItem[] {
  const items: BuildItem[] = []
  const add = (id: number, reason: string): void => {
    const item = findItem(index, id)
    if (item && isPurchasable(item)) items.push(toBuildItem(item, reason))
  }

  if (role === 'JUNGLE') {
    if (
      archetype === 'tank' ||
      archetype === 'bruiser' ||
      archetype === 'ap-bruiser' ||
      archetype === 'support'
    ) {
      add(STARTING_IDS.mosstomper, 'Mascota de jungla para resistir y limpiar campamentos')
    } else if (archetype === 'marksman' || archetype === 'ad-assassin') {
      add(STARTING_IDS.gustwalker, 'Mascota de jungla para movilidad y ganks')
    } else {
      add(STARTING_IDS.scorchclaw, 'Mascota de jungla para daño y limpieza')
    }
    add(STARTING_IDS.potion, 'Sustain para la primera limpieza')
    return items
  }

  if (role === 'UTILITY') {
    add(STARTING_IDS.worldAtlas, 'Objeto de soporte para generar oro y visión')
    add(STARTING_IDS.potion, 'Poción para el carril')
    add(STARTING_IDS.potion, 'Segunda poción para aguantar el carril')
    return items
  }

  if (team.pokeScore >= 40 && (archetype === 'tank' || archetype === 'bruiser')) {
    add(STARTING_IDS.doranShield, 'Doran Shield para sobrevivir el poke en carril')
  } else if (
    archetype === 'marksman' ||
    archetype === 'ad-assassin' ||
    archetype === 'bruiser'
  ) {
    add(STARTING_IDS.doranBlade, 'Doran Blade para daño y sustain en carril')
  } else if (
    archetype === 'mage' ||
    archetype === 'ap-assassin' ||
    archetype === 'ap-bruiser' ||
    archetype === 'enchanter'
  ) {
    add(STARTING_IDS.doranRing, 'Doran Ring para poder de habilidad y maná')
  } else {
    add(STARTING_IDS.doranShield, 'Doran Shield para aguantar el carril')
  }
  add(STARTING_IDS.potion, 'Poción para el carril')
  return items
}

export function generateBuild(
  champion: Champion,
  role: Role,
  enemies: Champion[],
  index: AnalysisIndex
): BuildPlan {
  const archetype = classifyArchetype(champion, role)
  const team = analyzeTeam(enemies)
  const pool = legendaryPool(index)
  const used = new Set<number>()

  const takeAdaptive = (priority: 'ALTA' | 'MEDIA', limit: number): BuildItem[] => {
    const picked: BuildItem[] = []
    for (const need of team.needs) {
      if (picked.length >= limit) break
      if (need.priority !== priority) continue
      const item = findNeedItem(need, archetype, index, used)
      if (!item) continue
      picked.push(item)
      used.add(item.item.id)
    }
    return picked
  }

  const highAdaptive = takeAdaptive('ALTA', 3)
  const coreAdaptive = highAdaptive.slice(0, 1)
  const situationalAdaptive = highAdaptive.slice(1)
  const natural = pool
    .filter((item) => !used.has(item.id))
    .map((item) => ({ item, score: scoreItem(item, archetype) }))
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)

  const core: BuildItem[] = [...coreAdaptive]
  for (const item of natural) {
    if (core.length >= 3) break
    if (used.has(item.id)) continue
    core.push(toBuildItem(item, `Núcleo de ${ARCHETYPE_LABELS[archetype].toLowerCase()}: ${statSummary(item)}`))
    used.add(item.id)
  }

  const mediumAdaptive = takeAdaptive('MEDIA', Math.max(0, 2 - situationalAdaptive.length))
  const situational: BuildItem[] = [...situationalAdaptive, ...mediumAdaptive]
  for (const item of natural) {
    if (situational.length >= 2) break
    if (used.has(item.id)) continue
    situational.push(toBuildItem(item, `Situacional: ${statSummary(item)}`))
    used.add(item.id)
  }

  const boots = chooseBoots(archetype, team, index)
  const starting = chooseStarting(archetype, role, team, index)
  const totalGold =
    (boots?.item.gold.total ?? 0) +
    core.reduce((total, item) => total + item.item.gold.total, 0) +
    situational.reduce((total, item) => total + item.item.gold.total, 0)

  const notes: string[] = []
  if (enemies.length > 0) {
    notes.push(
      `Build ajustada contra ${enemies.map((enemy) => enemy.name).join(', ')}.`
    )
    if (highAdaptive.length + mediumAdaptive.length > 0) {
      notes.push(
        `Compras adaptativas: ${[...highAdaptive, ...mediumAdaptive]
          .map((item) => item.item.name)
          .join(', ')}.`
      )
    }
  } else {
    notes.push('Sin composición enemiga: build base por arquetipo.')
  }
  notes.push('Los objetos situacionales son una guía; adapta el orden según cómo vaya la partida.')

  return {
    championId: champion.key,
    role,
    archetype,
    archetypeLabel: ARCHETYPE_LABELS[archetype],
    starting,
    boots,
    core,
    situational,
    needs: team.needs,
    notes,
    totalGold
  }
}

export { NEED_ITEM_IDS }
