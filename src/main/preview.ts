import type { ChampSelectSlot, LcuAccount, LiveEvent, LivePlayer, Snapshot } from '@shared/types'

function player(
  team: 'ORDER' | 'CHAOS',
  position: LivePlayer['position'],
  championId: string,
  championName: string,
  riotId: string,
  kills: number,
  deaths: number,
  assists: number,
  cs: number,
  level: number,
  items: number[]
): LivePlayer {
  return {
    championId,
    championName,
    rawChampionName: `game_character_displayname_${championId}`,
    riotId,
    team,
    position,
    level,
    kills,
    deaths,
    assists,
    cs,
    wardScore: position === 'UTILITY' ? 32 : 8,
    items,
    summonerSpells: {
      one: position === 'UTILITY' ? 'Ignición' : 'Destello',
      two: 'Destello'
    },
    isDead: false,
    respawnTimer: 0
  }
}

function slot(
  cellId: number,
  team: 'ALLY' | 'ENEMY',
  position: ChampSelectSlot['assignedPosition'],
  championId: number
): ChampSelectSlot {
  return {
    cellId,
    team,
    championId,
    pickIntentId: championId,
    assignedPosition: position,
    summonerName: `${team === 'ALLY' ? 'Aliado' : 'Rival'} ${cellId}`
  }
}

export function createPreviewSnapshot(mode: 'live' | 'champ'): Snapshot {
  const now = Date.now()
  if (mode === 'champ') {
    return {
      phase: 'ChampSelect',
      lcuConnected: true,
      lcuSource: 'lockfile',
      summoner: { displayName: 'Tester#LAS', summonerLevel: 300, profileIconId: 29, puuid: 'preview' },
      champSelect: {
        localCellId: 0,
        localPlayerChampionId: 222,
        myTeam: [
          slot(0, 'ALLY', 'BOTTOM', 222),
          slot(1, 'ALLY', 'TOP', 122),
          slot(2, 'ALLY', 'JUNGLE', 234),
          slot(3, 'ALLY', 'MIDDLE', 103),
          slot(4, 'ALLY', 'UTILITY', 412)
        ],
        theirTeam: [
          slot(5, 'ENEMY', 'TOP', 54),
          slot(6, 'ENEMY', 'JUNGLE', 64),
          slot(7, 'ENEMY', 'MIDDLE', 134),
          slot(8, 'ENEMY', 'BOTTOM', 51),
          slot(9, 'ENEMY', 'UTILITY', 117)
        ],
        bans: [266, 24, 89, 157, 246, 58, 92, 68, 517, 429],
        timer: { phase: 'BAN_PICK', remainingMs: 24000, totalMs: 30000 }
      },
      updatedAt: now
    }
  }

  const events: LiveEvent[] = [
    { id: 1, name: 'DragonKill', time: 600, dragonType: 'Fire' },
    { id: 2, name: 'InhibKilled', time: 770, turret: 'Turret_T2_L_03_A' },
    { id: 3, name: 'BaronKill', time: 800 },
    { id: 4, name: 'ChampionKill', time: 860, killer: 'Aliado', victim: 'Rival' }
  ]

  return {
    phase: 'InProgress',
    lcuConnected: true,
    lcuSource: 'lockfile',
    summoner: { displayName: 'Tester#LAS', summonerLevel: 300, profileIconId: 29, puuid: 'preview' },
    live: {
      gameTime: 934,
      mapName: 'Map11',
      gameMode: 'CLASSIC',
      activePlayerRiotId: 'Tester#LAS',
      activeChampionName: 'Jinx',
      activeTeam: 'ORDER',
      players: [
        player('ORDER', 'TOP', 'Darius', 'Darius', 'Aliado Top#LAS', 2, 3, 1, 180, 13, [3078, 3047, 3053]),
        player('ORDER', 'JUNGLE', 'Viego', 'Viego', 'Aliado Jungla#LAS', 4, 2, 5, 140, 12, [6672, 3047, 3153]),
        player('ORDER', 'MIDDLE', 'Ahri', 'Ahri', 'Aliado Mid#LAS', 3, 1, 6, 200, 14, [6655, 3020, 4645]),
        player('ORDER', 'BOTTOM', 'Jinx', 'Jinx', 'Tester#LAS', 5, 2, 4, 220, 13, [3031, 3006, 3036]),
        player('ORDER', 'UTILITY', 'Thresh', 'Thresh', 'Aliado Supp#LAS', 1, 4, 8, 30, 10, [3865, 3047, 3190]),
        player('CHAOS', 'TOP', 'Malphite', 'Malphite', 'Rival Top#LAS', 3, 2, 4, 170, 12, [3068, 3047, 3075]),
        player('CHAOS', 'JUNGLE', 'LeeSin', 'Lee Sin', 'Rival Jungla#LAS', 4, 3, 5, 150, 12, [6692, 3047, 3153]),
        player('CHAOS', 'MIDDLE', 'Syndra', 'Syndra', 'Rival Mid#LAS', 6, 1, 4, 210, 14, [6655, 3020, 3089]),
        player('CHAOS', 'BOTTOM', 'Caitlyn', 'Caitlyn', 'Rival ADC#LAS', 4, 2, 3, 205, 13, [6672, 3006, 3036]),
        player('CHAOS', 'UTILITY', 'Lulu', 'Lulu', 'Rival Supp#LAS', 0, 4, 9, 25, 10, [3865, 3047, 3222])
      ],
      events
    },
    updatedAt: now
  }
}


export function createPreviewAccount(): LcuAccount {
  const now = Date.now()
  return {
    summoner: {
      displayName: 'Tester#LAS',
      summonerLevel: 387,
      profileIconId: 5887,
      puuid: 'preview-account'
    },
    ranks: [
      {
        queueType: 'RANKED_SOLO_5x5',
        tier: 'GOLD',
        division: 'II',
        leaguePoints: 74,
        wins: 128,
        losses: 119,
        hotStreak: true
      },
      {
        queueType: 'RANKED_FLEX_SR',
        tier: 'PLATINUM',
        division: 'IV',
        leaguePoints: 21,
        wins: 42,
        losses: 39
      }
    ],
    mastery: [
      { championId: 222, championLevel: 12, championPoints: 1284500, lastPlayTime: now - 2 * 60 * 60 * 1000 },
      { championId: 103, championLevel: 10, championPoints: 890300, lastPlayTime: now - 26 * 60 * 60 * 1000 },
      { championId: 64, championLevel: 9, championPoints: 645200, lastPlayTime: now - 3 * 24 * 60 * 60 * 1000 },
      { championId: 412, championLevel: 8, championPoints: 512700, lastPlayTime: now - 5 * 24 * 60 * 60 * 1000 },
      { championId: 122, championLevel: 7, championPoints: 388400, lastPlayTime: now - 8 * 24 * 60 * 60 * 1000 },
      { championId: 157, championLevel: 7, championPoints: 301900, lastPlayTime: now - 12 * 24 * 60 * 60 * 1000 },
      { championId: 238, championLevel: 6, championPoints: 210600, lastPlayTime: now - 16 * 24 * 60 * 60 * 1000 },
      { championId: 350, championLevel: 6, championPoints: 188400, lastPlayTime: now - 20 * 24 * 60 * 60 * 1000 }
    ],
    fetchedAt: now
  }
}
