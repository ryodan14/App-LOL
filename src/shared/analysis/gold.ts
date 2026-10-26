import type { LivePlayer } from '../types'
import type { AnalysisIndex, GoldEstimate } from './types'

const STARTING_GOLD = 500
const PASSIVE_GOLD_PER_SECOND = 2.4
const AVERAGE_CS_GOLD = 21
const KILL_GOLD = 300
const ASSIST_GOLD = 150

export function estimatePlayerGold(
  player: LivePlayer,
  gameTime: number,
  index: AnalysisIndex
): GoldEstimate {
  const itemValue = player.items.reduce(
    (total, itemId) => total + (index.itemById.get(itemId)?.gold.total ?? 0),
    0
  )
  const safeTime = Math.max(0, gameTime)
  const passiveGold = STARTING_GOLD + PASSIVE_GOLD_PER_SECOND * safeTime
  const csGold = player.cs * AVERAGE_CS_GOLD
  const killGold = player.kills * KILL_GOLD + player.assists * ASSIST_GOLD
  const income = passiveGold + csGold + killGold
  const total = Math.max(income, itemValue)

  return {
    total: Math.round(total),
    itemValue: Math.round(itemValue),
    csGold: Math.round(csGold),
    killGold: Math.round(killGold),
    passiveGold: Math.round(passiveGold)
  }
}

export interface LaneGoldComparison {
  allyGold: number
  enemyGold: number
  difference: number
  leader: 'ALLY' | 'ENEMY' | 'EVEN'
}

export function compareLaneGold(
  ally: LivePlayer | undefined,
  enemy: LivePlayer | undefined,
  gameTime: number,
  index: AnalysisIndex
): LaneGoldComparison {
  const allyGold = ally ? estimatePlayerGold(ally, gameTime, index).total : 0
  const enemyGold = enemy ? estimatePlayerGold(enemy, gameTime, index).total : 0
  const difference = allyGold - enemyGold
  return {
    allyGold,
    enemyGold,
    difference,
    leader: difference > 75 ? 'ALLY' : difference < -75 ? 'ENEMY' : 'EVEN'
  }
}
