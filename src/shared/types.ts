import type { Locale } from './i18n'

export type Role = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY' | 'UNKNOWN'

export type ClientPhase =
  | 'Offline'
  | 'Online'
  | 'Lobby'
  | 'Matchmaking'
  | 'ReadyCheck'
  | 'ChampSelect'
  | 'InProgress'
  | 'Reconnect'
  | 'EndOfGame'
  | 'Unknown'

export interface ChampionInfo {
  attack: number
  defense: number
  magic: number
  difficulty: number
}

export interface ChampionPassive {
  name: string
  description: string
  image: string
}

export interface ChampionSpell {
  id: string
  name: string
  description: string
  cooldown: number[]
  cost: number[]
  range: number[]
  image: string
}

export interface Champion {
  id: string
  key: number
  name: string
  title: string
  tags: string[]
  partype: string
  info: ChampionInfo
  stats: Record<string, number>
  image: string
  lore: string
  passive: ChampionPassive
  spells: ChampionSpell[]
}

export interface Item {
  id: number
  name: string
  description: string
  plaintext: string
  gold: {
    base: number
    total: number
    sell: number
    purchasable: boolean
  }
  tags: string[]
  stats: Record<string, number>
  image: string
  maps: Record<string, boolean>
  from?: string[]
  into?: string[]
  depth?: number
  requiredChampion?: string
  inStore?: boolean
  consumed?: boolean
}

export interface RuneDef {
  id: number
  key: string
  name: string
  icon: string
  shortDesc: string
  longDesc?: string
}

export interface RuneTree {
  id: number
  key: string
  name: string
  icon: string
  slots: { runes: RuneDef[] }[]
}

export interface RuneRecommendation {
  championId: number
  position: string
  mapId: number
  isDefaultPosition: boolean
  perkIds: number[]
  primaryPerkStyleId: number
  secondaryPerkStyleId: number
  summonerSpellIds: number[]
  recommendationId: string
}

export interface SummonerSpell {
  id: number
  key: string
  name: string
  description: string
  image: string
  cooldown: number[]
}

export interface RuneShard {
  id: number
  name: string
  icon: string
}

export interface StaticData {
  patch: string
  language: string
  champions: Champion[]
  items: Item[]
  runeTrees: RuneTree[]
  runeRecs: RuneRecommendation[]
  summonerSpells: SummonerSpell[]
  shards: RuneShard[]
  fetchedAt: number
}

export interface DataResult {
  data: StaticData | null
  status: 'loading' | 'ready' | 'error'
  error?: string
}

export type OverlayCorner =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'right-center'
  | 'left-center'

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'up-to-date'
  | 'error'
  | 'unsupported'

export type UpdateReason = 'development' | 'portable' | 'platform'

export interface UpdateState {
  status: UpdateStatus
  currentVersion: string
  version?: string
  progress?: number
  error?: string
  reason?: UpdateReason
}

export interface AppSettings {
  language: Locale
  alwaysOnTop: boolean
  reduceMotion: boolean
  autoDetectClient: boolean
  pollIntervalMs: number
  customLcuPath: string
  manualLcuPort: number | null
  manualLcuToken: string
  showSplashArt: boolean
  overlayEnabled: boolean
  overlayScale: number
  overlayOpacity: number
  overlayCorner: OverlayCorner
  overlayShowGold: boolean
  overlayShowObjectives: boolean
  overlayShowChampSelect: boolean
  overlayGoldOnDemand: boolean
  startWithWindows: boolean
  showWithLeague: boolean
}

export interface LcuSummoner {
  displayName: string
  summonerLevel: number
  profileIconId: number
  puuid: string
  summonerId?: number
  accountId?: number
}

export interface LcuRank {
  queueType: string
  tier: string
  division: string
  leaguePoints: number
  wins: number
  losses: number
  hotStreak?: boolean
}

export interface LcuMastery {
  championId: number
  championLevel: number
  championPoints: number
  lastPlayTime: number
}

export interface LcuAccount {
  summoner: LcuSummoner
  ranks: LcuRank[]
  mastery: LcuMastery[]
  fetchedAt: number
}

export interface LcuItemSetExport {
  championId: number
  championName: string
  role: Role
  starting: number[]
  first: number[]
  boots: number[]
  core: number[]
  situational: number[]
}

export interface LcuRuneExport {
  championId: number
  championName: string
  role: Role
  primaryStyleId: number
  subStyleId: number
  selectedPerkIds: number[]
}

export interface LcuRunePagePayload {
  name: string
  primaryStyleId: number
  subStyleId: number
  selectedPerkIds: number[]
  current: boolean
}

export interface LcuExportResult {
  ok: boolean
  message?: string
  error?: string
}

export interface ChampSelectSlot {
  cellId: number
  team: 'ALLY' | 'ENEMY'
  championId: number
  pickIntentId: number
  assignedPosition: Role
  summonerName?: string
  spell1Id?: number
  spell2Id?: number
}

export interface ChampSelectState {
  localCellId: number
  localPlayerChampionId: number
  myTeam: ChampSelectSlot[]
  theirTeam: ChampSelectSlot[]
  bans: number[]
  timer: {
    phase: string
    remainingMs: number
    totalMs: number
  } | null
}

export interface LivePlayer {
  championId: string
  championName: string
  rawChampionName: string
  riotId: string
  team: 'ORDER' | 'CHAOS'
  position: Role
  level: number
  kills: number
  deaths: number
  assists: number
  cs: number
  wardScore: number
  items: number[]
  summonerSpells: {
    one: string
    two: string
  }
  isDead: boolean
  respawnTimer: number
}

export interface LiveEvent {
  id: number
  name: string
  time: number
  killer?: string
  victim?: string
  dragonType?: string
  stolen?: boolean
  turret?: string
}

export interface LiveGameState {
  gameTime: number
  mapName: string
  gameMode: string
  activePlayerRiotId: string
  activeChampionName: string
  activeTeam: 'ORDER' | 'CHAOS'
  players: LivePlayer[]
  events: LiveEvent[]
}

export interface Snapshot {
  phase: ClientPhase
  lcuConnected: boolean
  lcuSource?: 'lockfile' | 'process' | 'manual'
  lcuError?: string
  summoner?: LcuSummoner
  champSelect?: ChampSelectState
  live?: LiveGameState
  updatedAt: number
}

export interface AppApi {
  app: {
    version: () => Promise<string>
    platform: string
  }
  settings: {
    get: () => Promise<AppSettings>
    update: (patch: Partial<AppSettings>) => Promise<AppSettings>
    onUpdate: (callback: (settings: AppSettings) => void) => () => void
  }
  staticData: {
    get: () => Promise<DataResult>
    refresh: () => Promise<DataResult>
    onUpdate: (callback: (result: DataResult) => void) => () => void
  }
  snapshot: {
    get: () => Promise<Snapshot>
    refresh: () => Promise<Snapshot>
    reconnect: () => Promise<Snapshot>
    onUpdate: (callback: (snapshot: Snapshot) => void) => () => void
  }
  account: {
    get: () => Promise<LcuAccount | null>
  }
  lcu: {
    exportItemSet: (payload: LcuItemSetExport) => Promise<LcuExportResult>
    exportRunePage: (payload: LcuRuneExport) => Promise<LcuExportResult>
  }
  updates: {
    get: () => Promise<UpdateState>
    check: () => Promise<UpdateState>
    restart: () => Promise<void>
    onUpdate: (callback: (state: UpdateState) => void) => () => void
  }
  window: {
    minimize: () => void
    toggleMaximize: () => void
    close: () => void
    setAlwaysOnTop: (value: boolean) => Promise<void>
    moveToSecondary: () => void
  }
  overlay: {
    onGoldToggle: (callback: () => void) => () => void
  }
  external: {
    open: (url: string) => Promise<void>
  }
}
