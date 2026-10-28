import type {
  Role,
  RuneDef,
  RuneRecommendation,
  RuneTree,
  StaticData
} from '../types'
import type { AnalysisIndex } from './types'
import { CHAMPION_KEYS_BY_ITEM_ID } from './championItemGuides'

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
