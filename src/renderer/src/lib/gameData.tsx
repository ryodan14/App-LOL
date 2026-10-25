import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type {
  Champion,
  Item,
  Role,
  RuneDef,
  RuneRecommendation,
  RuneShard,
  RuneTree,
  StaticData,
  SummonerSpell
} from '@shared/types'
import { useAppStore } from '@renderer/store/useAppStore'

export interface GameDataIndex {
  data: StaticData
  champions: Champion[]
  championById: Map<string, Champion>
  championByKey: Map<number, Champion>
  itemById: Map<number, Item>
  runeById: Map<number, { rune: RuneDef; tree: RuneTree }>
  treeById: Map<number, RuneTree>
  spellById: Map<number, SummonerSpell>
  shardById: Map<number, RuneShard>
  recommendationsByChampion: Map<number, RuneRecommendation[]>
  rolesByChampion: Map<number, Role[]>
}

const GameDataContext = createContext<GameDataIndex | null>(null)

const POSITION_TO_ROLE: Record<string, Role> = {
  TOP: 'TOP',
  JUNGLE: 'JUNGLE',
  MIDDLE: 'MIDDLE',
  BOTTOM: 'BOTTOM',
  UTILITY: 'UTILITY'
}

export function buildGameDataIndex(data: StaticData): GameDataIndex {
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
    champions: [...data.champions].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    championById,
    championByKey,
    itemById,
    runeById,
    treeById,
    spellById,
    shardById,
    recommendationsByChampion,
    rolesByChampion
  }
}

export function GameDataProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const data = useAppStore((state) => state.data.data)
  const index = useMemo(() => (data ? buildGameDataIndex(data) : null), [data])

  if (!index) {
    return <>{children}</>
  }

  return <GameDataContext.Provider value={index}>{children}</GameDataContext.Provider>
}

export function useGameData(): GameDataIndex | null {
  return useContext(GameDataContext)
}

export function useGameDataRequired(): GameDataIndex {
  const value = useContext(GameDataContext)
  if (!value) {
    throw new Error('GameDataProvider no está disponible todavía')
  }
  return value
}
