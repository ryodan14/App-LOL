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
} from '../types'

export type ThreatTag =
  | 'HEAL'
  | 'SHIELD'
  | 'HARD_CC'
  | 'SLOW'
  | 'MOBILITY'
  | 'STEALTH'
  | 'BURST'
  | 'TANK'
  | 'POKE'
  | 'MAX_HP'
  | 'TRUE_DAMAGE'
  | 'EXECUTE'
  | 'AUTO_ATTACK'

export type DamageType = 'AD' | 'AP' | 'MIXED' | 'TRUE'

export type Priority = 'ALTA' | 'MEDIA' | 'BAJA'

export type Archetype =
  | 'marksman'
  | 'mage'
  | 'ap-assassin'
  | 'ad-assassin'
  | 'bruiser'
  | 'ap-bruiser'
  | 'tank'
  | 'enchanter'
  | 'support'

export interface Threat {
  tag: ThreatTag
  severity: 1 | 2 | 3
  reason: string
}

export interface KeySpell {
  name: string
  reasons: string[]
}

export interface ThreatProfile {
  championId: number
  championName: string
  damageType: DamageType
  archetype: Archetype
  archetypeLabel: string
  difficulty: number
  threats: Threat[]
  keySpells: KeySpell[]
  notes: string[]
}

export interface CounterNeed {
  id: string
  label: string
  description: string
  priority: Priority
  itemIds: number[]
}

export interface TeamAnalysis {
  profiles: ThreatProfile[]
  damage: { AD: number; AP: number; MIXED: number; TRUE: number }
  primaryDamage: DamageType
  threatCounts: Partial<Record<ThreatTag, number>>
  needs: CounterNeed[]
  tanks: number
  assassins: number
  ccScore: number
  sustainScore: number
  engageScore: number
  pokeScore: number
  summary: string
}

export interface BuildItem {
  item: Item
  reason: string
}

export type SkillKey = 'Q' | 'W' | 'E' | 'R'

export interface SkillOrderEntry {
  key: SkillKey
  name: string
  image: string
  maxOrder: number | null
}

export interface SkillOrder {
  priority: SkillKey[]
  entries: SkillOrderEntry[]
  ultimateLevels: number[]
  note: string
}

export interface BuildPlan {
  championId: number
  role: Role
  archetype: Archetype
  archetypeLabel: string
  starting: BuildItem[]
  firstItem: BuildItem | null
  purchaseOrder: BuildItem[]
  boots: BuildItem | null
  core: BuildItem[]
  situational: BuildItem[]
  skillOrder: SkillOrder
  needs: CounterNeed[]
  notes: string[]
  totalGold: number
}

export interface RunePlan {
  recommendation: RuneRecommendation
  primaryTree: RuneTree
  secondaryTree: RuneTree
  primaryRunes: RuneDef[]
  secondaryRunes: RuneDef[]
  shards: RuneShard[]
  summonerSpells: SummonerSpell[]
}

export interface CounterTip {
  id: string
  title: string
  description: string
  priority: Priority
  items: Item[]
  tags: ThreatTag[]
}

export interface AnalysisIndex {
  data: StaticData
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


export interface GoldEstimate {
  total: number
  itemValue: number
  csGold: number
  killGold: number
  passiveGold: number
}

export type ObjectiveKind = 'DRAGON' | 'BARON' | 'INHIBITOR'
export type ObjectiveStatus = 'countdown' | 'active' | 'ready'

export interface ObjectiveTimer {
  id: string
  kind: ObjectiveKind
  label: string
  shortLabel: string
  respawnAt: number
  remaining: number
  status: ObjectiveStatus
  team?: 'ORDER' | 'CHAOS'
  lane?: 'TOP' | 'MIDDLE' | 'BOTTOM'
  dragonType?: string
}

export interface CounterSuggestion {
  champion: Champion
  score: number
  reasons: string[]
  curated: boolean
}

export interface LaneCounterReport {
  enemy: Champion
  role: Role
  suggestions: CounterSuggestion[]
  note: string
}

export interface RoleEntry<T> {
  role: Role
  champion: Champion | null
  data: T
}
