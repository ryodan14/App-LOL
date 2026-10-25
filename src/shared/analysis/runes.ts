import type { Champion, Role } from '../types'
import type { AnalysisIndex, RunePlan } from './types'

function chooseRecommendation(
  champion: Champion,
  role: Role,
  index: AnalysisIndex
): RunePlan['recommendation'] | null {
  const recommendations = index.recommendationsByChampion.get(champion.key) ?? []
  if (recommendations.length === 0) return null

  const forRole = recommendations.filter(
    (recommendation) => recommendation.mapId === 11 && recommendation.position === role
  )
  const forMap = recommendations.filter((recommendation) => recommendation.mapId === 11)
  const candidates = forRole.length > 0 ? forRole : forMap.length > 0 ? forMap : recommendations
  return candidates.find((recommendation) => recommendation.isDefaultPosition) ?? candidates[0] ?? null
}

export function generateRunePlan(
  champion: Champion,
  role: Role,
  index: AnalysisIndex
): RunePlan | null {
  const recommendation = chooseRecommendation(champion, role, index)
  if (!recommendation) return null

  const primaryTree = index.treeById.get(recommendation.primaryPerkStyleId)
  const secondaryTree = index.treeById.get(recommendation.secondaryPerkStyleId)
  if (!primaryTree || !secondaryTree) return null

  const primaryRunes = recommendation.perkIds
    .map((id) => index.runeById.get(id))
    .filter((value): value is NonNullable<typeof value> => Boolean(value))
    .filter((value) => value.tree.id === primaryTree.id)
    .map((value) => value.rune)

  const secondaryRunes = recommendation.perkIds
    .map((id) => index.runeById.get(id))
    .filter((value): value is NonNullable<typeof value> => Boolean(value))
    .filter((value) => value.tree.id === secondaryTree.id)
    .map((value) => value.rune)

  const shards = recommendation.perkIds
    .map((id) => index.shardById.get(id))
    .filter((value): value is NonNullable<typeof value> => Boolean(value))

  const summonerSpells = recommendation.summonerSpellIds
    .map((id) => index.spellById.get(id))
    .filter((value): value is NonNullable<typeof value> => Boolean(value))

  if (primaryRunes.length === 0) return null

  return {
    recommendation,
    primaryTree,
    secondaryTree,
    primaryRunes,
    secondaryRunes,
    shards,
    summonerSpells
  }
}
