import { execFile } from 'node:child_process'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { ROLE_FROM_LCU } from '@shared/constants'
import type {
  AppSettings,
  ChampSelectSlot,
  ChampSelectState,
  LcuAccount,
  LcuExportResult,
  LcuItemSetExport,
  LcuMastery,
  LcuRank,
  LcuRuneExport,
  LcuSummoner,
  Role
} from '@shared/types'
import { t } from '@shared/i18n'
import { MAP_SUMMONERS_RIFT, mapIdFromGameMode } from '@shared/analysis/gameModes'
import { HttpError, fetchJson } from './http'
import {
  buildItemSetDocument,
  buildRunePagePayload,
  type LcuItemSetsDocument
} from './lcuExport'

interface LcuCredentials {
  port: number
  password: string
  protocol: string
  source: 'lockfile' | 'process' | 'manual'
}

interface RawSlot {
  cellId?: number
  championId?: number
  championPickIntent?: number
  assignedPosition?: string
  summonerName?: string
  spell1Id?: number
  spell2Id?: number
}

interface RawChampSelect {
  localPlayerCellId?: number
  myTeam?: RawSlot[]
  theirTeam?: RawSlot[]
  bans?: {
    myTeamBans?: number[]
    theirTeamBans?: number[]
  }
  timer?: {
    phase?: string
    adjustedTimeLeftInPhase?: number
    totalTimeInPhase?: number
  }
  actions?: { type?: string; championId?: number; completed?: boolean }[][]
}

interface RawSummoner {
  displayName?: string
  gameName?: string
  tagLine?: string
  summonerLevel?: number
  profileIconId?: number
  puuid?: string
  summonerId?: number
  accountId?: number
}

interface RawGameflowSession {
  gameData?: {
    gameMode?: string
    mapId?: number
    queue?: { mapId?: number }
  }
}

interface RawRunePage {
  id?: number
  name?: string
  current?: boolean
  isDeletable?: boolean
}

interface RawRank {
  queueType?: string
  tier?: string
  division?: string
  leaguePoints?: number
  wins?: number
  losses?: number
  hotStreak?: boolean
}

interface RawMastery {
  championId?: number
  championLevel?: number
  championPoints?: number
  lastPlayTime?: number
}

const DEFAULT_INSTALLS = [
  'C:\\Riot Games\\League of Legends',
  'C:\\Program Files\\Riot Games\\League of Legends',
  'C:\\Program Files (x86)\\Riot Games\\League of Legends',
  'D:\\Riot Games\\League of Legends',
  'E:\\Riot Games\\League of Legends'
]

function parseLockfile(text: string, source: LcuCredentials['source']): LcuCredentials | null {
  const parts = text.trim().split(':')
  if (parts.length < 5) return null
  const port = Number(parts[2])
  const password = parts[3]
  const protocol = parts[4] || 'https'
  if (!Number.isFinite(port) || port <= 0 || !password) return null
  return { port, password, protocol, source }
}

async function readLockfile(
  path: string,
  source: LcuCredentials['source'] = 'lockfile'
): Promise<LcuCredentials | null> {
  try {
    const text = await fs.readFile(path, 'utf8')
    return parseLockfile(text, source)
  } catch {
    return null
  }
}

function execFileAsync(
  file: string,
  args: string[],
  timeout: number
): Promise<{ stdout: string }> {
  return new Promise((resolve, reject) => {
    execFile(file, args, { timeout, windowsHide: true }, (error, stdout) => {
      if (error) reject(error)
      else resolve({ stdout })
    })
  })
}

async function discoverFromProcess(): Promise<LcuCredentials | null> {
  if (process.platform !== 'win32') return null
  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        "(Get-CimInstance Win32_Process -Filter \"Name='LeagueClientUx.exe'\").CommandLine"
      ],
      5_000
    )
    for (const line of stdout.split(/\r?\n/)) {
      const portMatch = line.match(/--app-port=(\d+)/)
      const tokenMatch = line.match(/--remoting-auth-token=([^\s"]+)/)
      const installMatch = line.match(/--install-directory=("[^"]+"|\S+)/)
      if (portMatch && tokenMatch) {
        const install = installMatch?.[1]?.replace(/^"|"$/g, '')
        if (install) {
          const lock = await readLockfile(join(install, 'lockfile'), 'process')
          if (lock) return lock
        }
        return {
          port: Number(portMatch[1]),
          password: tokenMatch[1],
          protocol: 'https',
          source: 'process'
        }
      }
    }
  } catch {
    return null
  }
  return null
}

function mapSlot(slot: RawSlot, team: 'ALLY' | 'ENEMY'): ChampSelectSlot {
  const position = (slot.assignedPosition ?? '').toLowerCase()
  const role: Role = ROLE_FROM_LCU[position] ?? 'UNKNOWN'
  return {
    cellId: slot.cellId ?? 0,
    team,
    championId: slot.championId ?? 0,
    pickIntentId: slot.championPickIntent ?? 0,
    assignedPosition: role,
    summonerName: slot.summonerName || undefined,
    spell1Id: slot.spell1Id || undefined,
    spell2Id: slot.spell2Id || undefined
  }
}

function sanitizeLcuError(error: unknown): string {
  if (error instanceof Error) {
    if (/ECONNREFUSED|ECONNRESET|socket hang up/i.test(error.message)) {
      return 'El cliente no está disponible'
    }
    if (/401|403/.test(error.message)) return 'Credenciales del cliente inválidas'
    if (/timeout|tiempo de espera/i.test(error.message)) return 'El cliente no respondió'
    return error.message
  }
  return 'No se pudo conectar con el cliente'
}

export class LcuClient {
  private credentials: LcuCredentials | null = null
  private lastDiscovery = 0
  private summonerCache: { value: LcuSummoner; at: number } | null = null

  connected = false
  source: LcuCredentials['source'] | undefined
  lastError: string | undefined

  async ensureConnected(settings: AppSettings, force = false): Promise<boolean> {
    if (this.connected && this.credentials && !force) return true

    const now = Date.now()
    if (!force && !this.credentials && now - this.lastDiscovery < 8_000) return false
    this.lastDiscovery = now

    const credentials = await this.discover(settings)
    if (!credentials) {
      this.connected = false
      this.credentials = null
      this.source = undefined
      this.lastError = undefined
      return false
    }

    this.credentials = credentials
    try {
      await this.getPhase()
      this.connected = true
      this.source = credentials.source
      this.lastError = undefined
      return true
    } catch (error) {
      this.connected = false
      this.credentials = null
      this.source = undefined
      this.lastError = sanitizeLcuError(error)
      return false
    }
  }

  private async discover(settings: AppSettings): Promise<LcuCredentials | null> {
    if (settings.manualLcuPort && settings.manualLcuToken) {
      return {
        port: settings.manualLcuPort,
        password: settings.manualLcuToken,
        protocol: 'https',
        source: 'manual'
      }
    }

    if (!settings.autoDetectClient) {
      if (settings.customLcuPath) {
        const custom = settings.customLcuPath.trim()
        const lock = custom.toLowerCase().endsWith('lockfile')
          ? await readLockfile(custom)
          : await readLockfile(join(custom, 'lockfile'))
        if (lock) return lock
      }
      return null
    }

    for (const install of DEFAULT_INSTALLS) {
      const lock = await readLockfile(join(install, 'lockfile'))
      if (lock) return lock
    }

    return discoverFromProcess()
  }

  private async request<T>(
    path: string,
    init: { method?: string; body?: unknown } = {}
  ): Promise<T> {
    if (!this.credentials) {
      throw new Error('Sin credenciales del cliente')
    }
    try {
      return await fetchJson<T>(
        `https://127.0.0.1:${this.credentials.port}${path}`,
        {
          auth: `riot:${this.credentials.password}`,
          rejectUnauthorized: false,
          timeoutMs: 3_500,
          retries: 0,
          ...init
        }
      )
    } catch (error) {
      if (/401|403|ECONNREFUSED|ECONNRESET|socket hang up/i.test((error as Error).message)) {
        this.connected = false
        this.credentials = null
        this.source = undefined
        this.summonerCache = null
      }
      throw error
    }
  }

  async getPhase(): Promise<string> {
    return this.request<string>('/lol-gameflow/v1/gameflow-phase')
  }

  private async getGameflowInfo(): Promise<{ mapId: number; gameMode: string } | null> {
    try {
      const raw = await this.request<RawGameflowSession>('/lol-gameflow/v1/session')
      const gameMode = raw.gameData?.gameMode ?? ''
      const mapId =
        raw.gameData?.queue?.mapId ??
        raw.gameData?.mapId ??
        mapIdFromGameMode(gameMode, MAP_SUMMONERS_RIFT)
      return { mapId, gameMode }
    } catch {
      return null
    }
  }

  async getChampSelect(): Promise<ChampSelectState | null> {
    try {
      const raw = await this.request<RawChampSelect>('/lol-champ-select/v1/session')
      const gameflow = await this.getGameflowInfo()
      const myTeam = (raw.myTeam ?? []).map((slot) => mapSlot(slot, 'ALLY'))
      const theirTeam = (raw.theirTeam ?? []).map((slot) => mapSlot(slot, 'ENEMY'))
      const localCellId = raw.localPlayerCellId ?? 0
      const me = myTeam.find((slot) => slot.cellId === localCellId)
      const bans = new Set<number>()
      for (const id of raw.bans?.myTeamBans ?? []) if (id > 0) bans.add(id)
      for (const id of raw.bans?.theirTeamBans ?? []) if (id > 0) bans.add(id)
      for (const group of raw.actions ?? []) {
        for (const action of group) {
          if (action.type === 'ban' && action.completed && action.championId && action.championId > 0) {
            bans.add(action.championId)
          }
        }
      }
      return {
        localCellId,
        localPlayerChampionId: me?.championId || me?.pickIntentId || 0,
        mapId: gameflow?.mapId ?? MAP_SUMMONERS_RIFT,
        gameMode: gameflow?.gameMode,
        myTeam,
        theirTeam,
        bans: [...bans],
        timer: raw.timer
          ? {
              phase: raw.timer.phase ?? '',
              remainingMs: raw.timer.adjustedTimeLeftInPhase ?? 0,
              totalMs: raw.timer.totalTimeInPhase ?? 0
            }
          : null
      }
    } catch (error) {
      if ((error as Error).message.includes('HTTP 404')) return null
      throw error
    }
  }

  async getSummoner(force = false): Promise<LcuSummoner | null> {
    if (!force && this.summonerCache && Date.now() - this.summonerCache.at < 60_000) {
      return this.summonerCache.value
    }
    try {
      const raw = await this.request<RawSummoner>('/lol-summoner/v1/current-summoner')
      const displayName =
        raw.displayName || (raw.gameName ? `${raw.gameName}#${raw.tagLine ?? ''}` : 'Invocador')
      const summoner: LcuSummoner = {
        displayName,
        summonerLevel: raw.summonerLevel ?? 0,
        profileIconId: raw.profileIconId ?? 29,
        puuid: raw.puuid ?? '',
        summonerId: raw.summonerId,
        accountId: raw.accountId
      }
      this.summonerCache = { value: summoner, at: Date.now() }
      return summoner
    } catch {
      return null
    }
  }

  async getAccount(): Promise<LcuAccount | null> {
    if (!this.connected) return null
    const summoner = await this.getSummoner(true)
    if (!summoner) return null

    const ranks = await this.getRanks()
    const mastery = await this.getMastery(summoner)
    return {
      summoner,
      ranks,
      mastery,
      fetchedAt: Date.now()
    }
  }

  private async getRanks(): Promise<LcuRank[]> {
    try {
      const raw = await this.request<{
        queues?: RawRank[]
        queueMap?: Record<string, RawRank>
      }>('/lol-ranked/v1/current-ranked-stats')
      const queues = raw.queues ?? Object.values(raw.queueMap ?? {})
      return queues
        .filter((queue) => queue.queueType && queue.tier)
        .map((queue) => ({
          queueType: queue.queueType ?? '',
          tier: queue.tier ?? '',
          division: queue.division ?? '',
          leaguePoints: queue.leaguePoints ?? 0,
          wins: queue.wins ?? 0,
          losses: queue.losses ?? 0,
          hotStreak: queue.hotStreak
        }))
    } catch {
      return []
    }
  }

  private async getMastery(summoner: LcuSummoner): Promise<LcuMastery[]> {
    const candidates = [
      '/lol-champion-mastery/v1/local-player/champion-mastery',
      summoner.summonerId
        ? `/lol-champion-mastery/v1/${summoner.summonerId}/champion-mastery`
        : null,
      summoner.puuid ? `/lol-champion-mastery/v1/${summoner.puuid}/champion-mastery` : null
    ].filter((value): value is string => Boolean(value))

    for (const path of candidates) {
      try {
        const raw = await this.request<RawMastery[] | { masteries?: RawMastery[] }>(path)
        const list = Array.isArray(raw) ? raw : (raw.masteries ?? [])
        return list
          .filter((entry) => typeof entry.championId === 'number')
          .map((entry) => ({
            championId: entry.championId ?? 0,
            championLevel: entry.championLevel ?? 0,
            championPoints: entry.championPoints ?? 0,
            lastPlayTime: entry.lastPlayTime ?? 0
          }))
          .sort((a, b) => b.championPoints - a.championPoints)
          .slice(0, 8)
      } catch {
        // Try the next endpoint shape.
      }
    }
    return []
  }

  async exportItemSet(payload: LcuItemSetExport): Promise<LcuExportResult> {
    try {
      const summoner = await this.getSummoner(true)
      if (!summoner?.summonerId) {
        return { ok: false, error: t('No se pudo identificar tu invocador.') }
      }
      const path = `/lol-item-sets/v1/item-sets/${summoner.summonerId}/sets`
      let existing: LcuItemSetsDocument = { itemSets: [] }
      try {
        existing = await this.request<LcuItemSetsDocument>(path)
      } catch (error) {
        if (!(error instanceof HttpError) || error.status !== 404) throw error
      }
      const document = buildItemSetDocument(
        payload,
        summoner.summonerId,
        { ...existing, accountId: existing.accountId ?? summoner.accountId }
      )
      await this.request(path, { method: 'PUT', body: document })
      return { ok: true, message: t('Conjunto de objetos exportado al cliente.') }
    } catch (error) {
      return { ok: false, error: sanitizeLcuError(error) }
    }
  }

  async exportRunePage(payload: LcuRuneExport): Promise<LcuExportResult> {
    try {
      const page = buildRunePagePayload(payload)
      const pages = await this.request<RawRunePage[]>('/lol-perks/v1/pages')
      const existing = (Array.isArray(pages) ? pages : []).find(
        (entry) => entry.name === page.name && typeof entry.id === 'number'
      )
      if (existing?.id) {
        await this.request(`/lol-perks/v1/pages/${existing.id}`, {
          method: 'PUT',
          body: page
        })
      } else {
        await this.request('/lol-perks/v1/pages', { method: 'POST', body: page })
      }
      return { ok: true, message: t('Página de runas exportada al cliente.') }
    } catch (error) {
      if (error instanceof HttpError && (error.status === 400 || error.status === 409)) {
        return {
          ok: false,
          error: t('El cliente rechazó la página. Cierra una página de runas e inténtalo de nuevo.')
        }
      }
      return { ok: false, error: sanitizeLcuError(error) }
    }
  }

  disconnect(): void {
    this.connected = false
    this.credentials = null
    this.source = undefined
    this.summonerCache = null
  }

  getError(): string | undefined {
    return this.lastError
  }
}
