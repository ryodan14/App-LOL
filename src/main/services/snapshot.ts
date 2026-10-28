import type {
  ChampSelectState,
  ClientPhase,
  LcuAccount,
  LcuExportResult,
  LcuItemSetExport,
  LcuRuneExport,
  LiveGameState,
  LcuSummoner,
  Snapshot
} from '@shared/types'
import { t } from '@shared/i18n'
import { LcuClient } from './lcu'
import { fetchLiveGame } from './liveClient'
import { getSettings } from './settings'
import { liveProbeDelay, resolvePollDelay } from './polling'

const PHASE_MAP: Record<string, ClientPhase> = {
  None: 'Online',
  Lobby: 'Lobby',
  Matchmaking: 'Matchmaking',
  ReadyCheck: 'ReadyCheck',
  ChampSelect: 'ChampSelect',
  GameStart: 'InProgress',
  InProgress: 'InProgress',
  Reconnect: 'Reconnect',
  WaitingForStats: 'EndOfGame',
  PreEndOfGame: 'EndOfGame',
  EndOfGame: 'EndOfGame',
  TerminatedInError: 'Online'
}

function emptySnapshot(): Snapshot {
  return {
    phase: 'Offline',
    lcuConnected: false,
    updatedAt: Date.now()
  }
}

function sanitizeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Error de conexión con el cliente'
}

export class SnapshotService {
  private snapshot: Snapshot = emptySnapshot()
  private timer: NodeJS.Timeout | null = null
  private current: Promise<Snapshot> | null = null
  private stopped = false
  private lcu = new LcuClient()
  private listeners = new Set<(snapshot: Snapshot) => void>()
  private liveFailures = 0
  private liveNextProbeAt = 0
  private lastRawPhase = ''

  get(): Snapshot {
    return this.snapshot
  }

  subscribe(listener: (snapshot: Snapshot) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  start(): void {
    this.stopped = false
    this.schedule(0)
  }

  stop(): void {
    this.stopped = true
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    this.lcu.disconnect()
  }

  restart(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    if (!this.stopped) this.schedule(0)
  }

  refresh(): Promise<Snapshot> {
    return this.cycle(true)
  }

  reconnect(): Promise<Snapshot> {
    this.lcu.disconnect()
    return this.cycle(true)
  }

  async getAccount(): Promise<LcuAccount | null> {
    const settings = await getSettings()
    const connected = await this.lcu.ensureConnected(settings, true)
    if (!connected) return null
    return this.lcu.getAccount()
  }

  async exportItemSet(payload: LcuItemSetExport): Promise<LcuExportResult> {
    const settings = await getSettings()
    if (!(await this.lcu.ensureConnected(settings))) {
      return { ok: false, error: this.lcu.getError() ?? t('El cliente de League no está disponible.') }
    }
    return this.lcu.exportItemSet(payload)
  }

  async exportRunePage(payload: LcuRuneExport): Promise<LcuExportResult> {
    const settings = await getSettings()
    if (!(await this.lcu.ensureConnected(settings))) {
      return { ok: false, error: this.lcu.getError() ?? t('El cliente de League no está disponible.') }
    }
    return this.lcu.exportRunePage(payload)
  }

  private schedule(delayMs: number): void {
    if (this.stopped) return
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      void this.cycle(false).finally(() => {
        void this.reschedule()
      })
    }, delayMs)
  }

  private async reschedule(): Promise<void> {
    if (this.stopped) return
    const settings = await getSettings()
    this.schedule(resolvePollDelay(this.snapshot.phase, settings.pollIntervalMs))
  }

  private async probeLive(force: boolean): Promise<LiveGameState | undefined> {
    if (!force && Date.now() < this.liveNextProbeAt) return undefined
    const live = await fetchLiveGame()
    if (live) {
      this.liveFailures = 0
      this.liveNextProbeAt = 0
      return live
    }
    this.liveFailures += 1
    this.liveNextProbeAt = Date.now() + liveProbeDelay(this.liveFailures)
    return undefined
  }

  private cycle(force: boolean): Promise<Snapshot> {
    if (this.current) return this.current
    this.current = this.runCycle(force).finally(() => {
      this.current = null
    })
    return this.current
  }

  private async runCycle(force: boolean): Promise<Snapshot> {
    const settings = await getSettings()
    let lcuConnected = await this.lcu.ensureConnected(settings, force)
    let lcuError = this.lcu.getError()
    let phase: ClientPhase = lcuConnected ? 'Online' : 'Offline'
    let summoner: LcuSummoner | undefined
    let champSelect: ChampSelectState | undefined
    let live: LiveGameState | undefined
    let rawPhase = ''

    if (lcuConnected) {
      summoner = (await this.lcu.getSummoner()) ?? undefined
      try {
        rawPhase = await this.lcu.getPhase()
        phase = PHASE_MAP[rawPhase] ?? 'Online'

        if (rawPhase === 'ChampSelect') {
          champSelect = (await this.lcu.getChampSelect()) ?? undefined
          if (champSelect) phase = 'ChampSelect'
        }
      } catch (error) {
        lcuConnected = false
        lcuError = sanitizeError(error)
        this.lcu.disconnect()
        phase = 'Offline'
      }
    }

    const inGamePhase =
      rawPhase === 'InProgress' || rawPhase === 'GameStart' || rawPhase === 'Reconnect'
    if (inGamePhase && this.lastRawPhase !== rawPhase) this.liveNextProbeAt = 0
    this.lastRawPhase = rawPhase

    if (!live) {
      live = await this.probeLive(force || inGamePhase)
      if (live && !lcuConnected) lcuError = undefined
    }

    if (live) {
      phase = 'InProgress'
      champSelect = undefined
    }

    const next: Snapshot = {
      phase,
      lcuConnected,
      lcuSource: this.lcu.source,
      lcuError,
      summoner,
      champSelect,
      live,
      updatedAt: Date.now()
    }

    const previousComparable = JSON.stringify({ ...this.snapshot, updatedAt: 0 })
    const nextComparable = JSON.stringify({ ...next, updatedAt: 0 })
    this.snapshot = next
    if (previousComparable !== nextComparable) {
      for (const listener of this.listeners) {
        try {
          listener(next)
        } catch (error) {
          console.error('[snapshot] Error en listener', error)
        }
      }
    }
    return next
  }
}
