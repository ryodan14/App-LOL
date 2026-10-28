import type { Role } from '../types'

export type ChampionItemGuideSource = 'riot' | 'curated' | 'heuristic'

export interface ChampionItemGuideEntry {
  starting: number[][]
  ranges: number[][]
}

export interface ChampionItemGuideData extends Partial<ChampionItemGuideEntry> {
  source: ChampionItemGuideSource
  roles?: Partial<Record<Role, ChampionItemGuideEntry>>
}

export interface NormalizedChampionItemGuide extends ChampionItemGuideEntry {
  source: ChampionItemGuideSource
  first: number[]
  boots: number[]
  core: number[][]
  situational: number[][]
  itemIds: number[]
}
