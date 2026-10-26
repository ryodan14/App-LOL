import { useEffect, useState } from 'react'
import { Clock3, Radio, Swords, TimerReset } from 'lucide-react'
import type { ChampSelectState, LiveGameState } from '@shared/types'
import { useAppStore } from '@renderer/store/useAppStore'
import { GameDataProvider, useGameData } from '@renderer/lib/gameData'
import { formatDuration, formatTimer } from '@renderer/lib/format'
import { Badge } from '@renderer/components/ui/Badge'
import { LaneGoldBoard } from '@renderer/components/live/LaneGoldBoard'
import { ObjectiveTimerList } from '@renderer/components/live/ObjectiveTimerList'
import { ChampSelectBoard } from '@renderer/components/live/ChampSelectBoard'

function useNow(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

function Shell({
  mode,
  timer,
  children
}: {
  mode: 'live' | 'champ-select' | 'idle'
  timer: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="w-full p-2">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#060a12]/95 shadow-[0_24px_80px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-gold-400/30 bg-gold-400/10">
              <Swords className="h-3.5 w-3.5 text-gold-300" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-[0.72rem] font-semibold tracking-[0.14em] text-ink-100">
                APP-LOL
              </p>
              <p className="text-[0.5rem] uppercase tracking-[0.16em] text-ink-500">
                {mode === 'live' ? 'Partida en vivo' : mode === 'champ-select' ? 'Champ select' : 'En espera'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'live' && (
              <Badge tone="teal">
                <Radio className="h-2.5 w-2.5" /> LIVE
              </Badge>
            )}
            <span className="flex items-center gap-1 font-mono text-[0.72rem] font-bold tabular-nums text-ink-200">
              <Clock3 className="h-3 w-3 text-ink-500" />
              {timer}
            </span>
          </div>
        </div>
        <div className="space-y-2.5 p-3">{children}</div>
        <div className="flex items-center justify-between border-t border-white/[0.06] px-3 py-1.5 text-[0.5rem] text-ink-600">
          <span>
            {mode === 'champ-select'
              ? 'Counters por kit · no son winrates'
              : 'Oro estimado · no lee memoria del juego'}
          </span>
          <span className="font-mono">Ctrl+Shift+O</span>
        </div>
      </div>
    </div>
  )
}

function LiveOverlay({ live, now }: { live: LiveGameState; now: number }): React.JSX.Element {
  const snapshot = useAppStore((state) => state.snapshot)
  const data = useAppStore((state) => state.data)
  const index = useGameData()
  const gameTime = live.gameTime + Math.max(0, (now - snapshot.updatedAt) / 1000)
  const mine = live.activeTeam === 'ORDER' ? 'azul' : 'rojo'

  if (!index) {
    return (
      <Shell mode="live" timer={formatDuration(gameTime)}>
        <p className="py-10 text-center text-[0.72rem] leading-relaxed text-ink-400">
          {data.status === 'error'
            ? 'Datos no disponibles. Abrí App-LOL y reintentá la carga.'
            : 'Cargando datos oficiales…'}
        </p>
      </Shell>
    )
  }

  return (
    <Shell mode="live" timer={formatDuration(gameTime)}>
      <div className="flex items-center justify-between px-0.5">
        <p className="text-[0.52rem] font-bold uppercase tracking-[0.16em] text-gold-300">
          Diferencia por línea
        </p>
        <span className="text-[0.55rem] text-ink-500">Equipo {mine}</span>
      </div>
      <LaneGoldBoard live={live} gameTime={gameTime} compact />
      <div className="flex items-center gap-1.5 px-0.5 pt-1">
        <TimerReset className="h-3 w-3 text-teal-300" />
        <p className="text-[0.52rem] font-bold uppercase tracking-[0.16em] text-teal-300">
          Objetivos
        </p>
      </div>
      <ObjectiveTimerList live={live} gameTime={gameTime} compact />
    </Shell>
  )
}

function ChampSelectOverlay({
  champSelect,
  now
}: {
  champSelect: ChampSelectState
  now: number
}): React.JSX.Element {
  const snapshot = useAppStore((state) => state.snapshot)
  const remaining = champSelect.timer
    ? Math.max(0, champSelect.timer.remainingMs - (now - snapshot.updatedAt))
    : 0
  return (
    <Shell mode="champ-select" timer={champSelect.timer ? formatTimer(remaining) : '—'}>
      <ChampSelectBoard champSelect={champSelect} compact />
    </Shell>
  )
}

function OverlayContent(): React.JSX.Element {
  const snapshot = useAppStore((state) => state.snapshot)
  const data = useAppStore((state) => state.data)
  const now = useNow()

  if (snapshot.live) return <LiveOverlay live={snapshot.live} now={now} />
  if (snapshot.champSelect) return <ChampSelectOverlay champSelect={snapshot.champSelect} now={now} />
  if (data.status === 'loading') {
    return (
      <Shell mode="idle" timer="—">
        <p className="py-10 text-center text-[0.72rem] text-ink-400">Cargando App-LOL…</p>
      </Shell>
    )
  }
  if (data.status === 'error') {
    return (
      <Shell mode="idle" timer="—">
        <p className="py-10 text-center text-[0.72rem] leading-relaxed text-ink-400">
          No pudimos cargar los datos de Riot. Abrí App-LOL y reintentá desde Ajustes.
        </p>
      </Shell>
    )
  }
  return (
    <Shell mode="idle" timer="—">
      <p className="py-10 text-center text-[0.72rem] leading-relaxed text-ink-400">
        Abrí League of Legends y entrá a champ select o a una partida.
      </p>
    </Shell>
  )
}

export function OverlayRoot(): React.JSX.Element {
  const initialize = useAppStore((state) => state.initialize)
  const initialized = useAppStore((state) => state.initialized)

  useEffect(() => {
    document.documentElement.classList.add('overlay-mode')
    void initialize()
    return () => {
      document.documentElement.classList.remove('overlay-mode')
    }
  }, [initialize])

  if (!initialized) {
    return (
      <div className="p-2">
        <div className="rounded-2xl border border-white/10 bg-[#060a12]/95 p-6 text-center text-[0.7rem] text-ink-400">
          Cargando overlay…
        </div>
      </div>
    )
  }

  return (
    <GameDataProvider>
      <OverlayContent />
    </GameDataProvider>
  )
}
