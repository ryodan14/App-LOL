import { ROLE_FROM_LCU } from '@shared/constants'
import type { LiveEvent, LiveGameState, LivePlayer, Role } from '@shared/types'
import { fetchJson } from './http'

const LIVE_URL = 'https://127.0.0.1:2999/liveclientdata/allgamedata'

interface RawPlayer {
  championName?: string
  rawChampionName?: string
  riotId?: string
  riotIdGameName?: string
  riotIdTagLine?: string
  summonerName?: string
  team?: string
  position?: string
  level?: number
  isDead?: boolean
  respawnTimer?: number
  items?: { itemID?: number }[]
  scores?: {
    kills?: number
    deaths?: number
    assists?: number
    creeps?: number
    wardScore?: number
  }
  summonerSpells?: {
    summonerSpellOne?: { displayName?: string }
    summonerSpellTwo?: { displayName?: string }
  }
}

interface RawEvent {
  EventID?: number
  EventName?: string
  EventTime?: number
  KillerName?: string
  VictimName?: string
  DragonType?: string
  Stolen?: string | boolean
  TurretKilled?: string
}

interface RawLiveGame {
  activePlayer?: {
    riotId?: string
    riotIdGameName?: string
    riotIdTagLine?: string
    summonerName?: string
  }
  allPlayers?: RawPlayer[]
  gameData?: {
    gameTime?: number
    mapName?: string
    gameMode?: string
  }
  events?: {
    Events?: RawEvent[]
  }
}

const RELEVANT_EVENTS = new Set([
  'GameStart',
  'MinionsSpawning',
  'FirstBlood',
  'ChampionKill',
  'Ace',
  'DragonKill',
  'BaronKill',
  'HeraldKill',
  'RiftHeraldKill',
  'TurretKilled',
  'InhibKilled',
  'FirstBrick'
])

function championIdFromRaw(rawChampionName: string, championName: string): string {
  const match = rawChampionName.match(/game_character_displayname_(.+)$/)
  return match?.[1] ?? championName.replace(/[^A-Za-z0-9]/g, '')
}

function rawPositionToRole(value?: string): Role {
  const normalized = (value ?? '').trim().toLowerCase()
  return (
    ROLE_FROM_LCU[normalized] ??
    ({
      mid: 'MIDDLE',
      adc: 'BOTTOM',
      bot: 'BOTTOM',
      support: 'UTILITY',
      sup: 'UTILITY',
      top: 'TOP',
      jungle: 'JUNGLE'
    }[normalized] as Role | undefined) ??
    'UNKNOWN'
  )
}

function normalizePlayer(player: RawPlayer): LivePlayer {
  const championName = player.championName ?? ''
  const rawChampionName = player.rawChampionName ?? ''
  const riotId =
    player.riotId ||
    (player.riotIdGameName
      ? `${player.riotIdGameName}#${player.riotIdTagLine ?? ''}`
      : player.summonerName ?? 'Invocador')
  return {
    championId: championIdFromRaw(rawChampionName, championName),
    championName,
    rawChampionName,
    riotId,
    team: player.team === 'CHAOS' ? 'CHAOS' : 'ORDER',
    position: rawPositionToRole(player.position),
    level: player.level ?? 0,
    kills: player.scores?.kills ?? 0,
    deaths: player.scores?.deaths ?? 0,
    assists: player.scores?.assists ?? 0,
    cs: player.scores?.creeps ?? 0,
    wardScore: player.scores?.wardScore ?? 0,
    items: (player.items ?? [])
      .map((item) => item.itemID)
      .filter((id): id is number => typeof id === 'number' && id > 0),
    summonerSpells: {
      one: player.summonerSpells?.summonerSpellOne?.displayName ?? '',
      two: player.summonerSpells?.summonerSpellTwo?.displayName ?? ''
    },
    isDead: Boolean(player.isDead),
    respawnTimer: player.respawnTimer ?? 0
  }
}

function normalizeEvent(event: RawEvent): LiveEvent {
  const stolen = event.Stolen === true || event.Stolen === 'true' || event.Stolen === '1'
  return {
    id: event.EventID ?? 0,
    name: event.EventName ?? 'Evento',
    time: event.EventTime ?? 0,
    killer: event.KillerName,
    victim: event.VictimName,
    dragonType: event.DragonType,
    stolen,
    turret: event.TurretKilled
  }
}

export async function fetchLiveGame(): Promise<LiveGameState | null> {
  try {
    const raw = await fetchJson<RawLiveGame>(LIVE_URL, {
      rejectUnauthorized: false,
      timeoutMs: 1_800,
      retries: 0
    })
    const players = (raw.allPlayers ?? []).map(normalizePlayer)
    const activeRiotId = raw.activePlayer?.riotId ?? ''
    const activeName = raw.activePlayer?.summonerName ?? ''
    const activeGameName = raw.activePlayer?.riotIdGameName ?? ''
    const me =
      players.find((player) => activeRiotId && player.riotId === activeRiotId) ??
      players.find(
        (player) => activeGameName && player.riotId.split('#')[0] === activeGameName
      ) ??
      players.find((player) => activeName && player.riotId === activeName)

    const events = (raw.events?.Events ?? [])
      .filter((event) => event.EventName && RELEVANT_EVENTS.has(event.EventName))
      .map(normalizeEvent)
      .sort((a, b) => a.time - b.time)
      .slice(-150)

    return {
      gameTime: Math.max(0, raw.gameData?.gameTime ?? 0),
      mapName: raw.gameData?.mapName ?? '',
      gameMode: raw.gameData?.gameMode ?? '',
      activePlayerRiotId: activeRiotId || activeName,
      activeChampionName: me?.championName ?? '',
      activeTeam: me?.team ?? 'ORDER',
      players,
      events
    }
  } catch {
    return null
  }
}
