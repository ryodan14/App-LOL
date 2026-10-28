import type {
  Champion,
  Role,
  RuneDef,
  RuneRecommendation,
  RuneTree,
  StaticData
} from '../types'
import type { AnalysisIndex } from './types'
import { CHAMPION_KEYS_BY_ITEM_ID } from './championItemGuides'

const ROLE_BY_TAG: Record<string, Role[]> = {
  Marksman: ['BOTTOM'],
  Support: ['UTILITY'],
  Tank: ['TOP', 'JUNGLE'],
  Fighter: ['TOP', 'JUNGLE'],
  Assassin: ['MIDDLE', 'JUNGLE'],
  Mage: ['MIDDLE', 'UTILITY']
}

const ENCHANTER_KEYS = new Set([16, 26, 37, 40, 43, 117, 147, 267, 350, 497, 888, 902])

export function inferRolesFromTags(champion: Champion): Role[] {
  if (ENCHANTER_KEYS.has(champion.key)) return ['UTILITY']
  if (champion.tags.includes('Support')) {
    return champion.tags.includes('Mage') ? ['UTILITY', 'MIDDLE'] : ['UTILITY']
  }

  const roles: Role[] = []
  for (const tag of champion.tags) {
    for (const role of ROLE_BY_TAG[tag] ?? []) {
      if (!roles.includes(role)) roles.push(role)
    }
  }
  if (roles.length === 0) roles.push('MIDDLE')
  return roles
}

export const POSITION_TO_ROLE: Record<string, Role> = {
  TOP: 'TOP',
  JUNGLE: 'JUNGLE',
  MIDDLE: 'MIDDLE',
  BOTTOM: 'BOTTOM',
  UTILITY: 'UTILITY'
}

export function createAnalysisIndex(data: StaticData): AnalysisIndex {
  const championById = new Map(data.champions.map((champion) => [champion.id, champion]))
  const championByKey = new Map(data.champions.map((champion) => [champion.key, champion]))
  const itemById = new Map(data.items.map((item) => [item.id, item]))
  const treeById = new Map(data.runeTrees.map((tree) => [tree.id, tree]))
  const runeById = new Map<number, { rune: RuneDef; tree: RuneTree }>()
  for (const tree of data.runeTrees) {
    for (const slot of tree.slots) {
      for (const rune of slot.runes) {
        runeById.set(rune.id, { rune, tree })
      }
    }
  }
  const spellById = new Map(data.summonerSpells.map((spell) => [spell.id, spell]))
  const shardById = new Map(data.shards.map((shard) => [shard.id, shard]))
  const recommendationsByChampion = new Map<number, RuneRecommendation[]>()
  const rolesByChampion = new Map<number, Role[]>()

  for (const recommendation of data.runeRecs) {
    const list = recommendationsByChampion.get(recommendation.championId) ?? []
    list.push(recommendation)
    recommendationsByChampion.set(recommendation.championId, list)

    if (recommendation.mapId === 11) {
      const role = POSITION_TO_ROLE[recommendation.position]
      if (role) {
        const roles = rolesByChampion.get(recommendation.championId) ?? []
        if (!roles.includes(role)) roles.push(role)
        rolesByChampion.set(recommendation.championId, roles)
      }
    }
  }

  for (const champion of data.champions) {
    if ((rolesByChampion.get(champion.key) ?? []).length === 0) {
      rolesByChampion.set(champion.key, inferRolesFromTags(champion))
    }
  }

  return {
    data,
    championById,
    championByKey,
    itemById,
    runeById,
    treeById,
    spellById,
    shardById,
    recommendationsByChampion,
    rolesByChampion,
    championKeysByItemId: CHAMPION_KEYS_BY_ITEM_ID
  }
}
