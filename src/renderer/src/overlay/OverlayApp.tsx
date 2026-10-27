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
import { t } from '@shared/i18n'

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
  opacity,
  footerLeft,
  children
}: {
  mode: 'live' | 'champ-select' | 'idle'
  timer: string
  opacity: number
  footerLeft: string
  children: React.ReactNode
}): React.JSX.Element {
  const alpha = Math.min(1, Math.max(0.35, opacity)).toFixed(2)
  return (
    <div className="w-full p-2">
      <div
        className="overflow-hidden rounded-2xl border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        style={{ backgroundColor: `rgba(6, 10, 18, ${alpha})` }}
      >
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
                {mode === 'live' ? t('Partida en vivo') : mode === 'champ-select' ? t('Champ select') : t('En espera')}
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
        <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] px-3 py-1.5 text-[0.5rem] text-ink-600">
          <span>{footerLeft}</span>
          <span className="shrink-0 font-mono">Ctrl+Shift+O</span>
        </div>
      </div>
    </div>
  )
}

function LiveOverlay({ live, now }: { live: LiveGameState; now: number }): React.JSX.Element {
  const snapshot = useAppStore((state) => state.snapshot)
  const data = useAppStore((state) => state.data)
  const settings = useAppStore((state) => state.settings)
  const index = useGameData()
  const [goldVisible, setGoldVisible] = useState(() => !settings.overlayGoldOnDemand)
  const gameTime = live.gameTime + Math.max(0, (now - snapshot.updatedAt) / 1000)
  const mine = live.activeTeam === 'ORDER' ? 'azul' : 'rojo'
  const showGold = settings.overlayShowGold && goldVisible
  const showObjectives = settings.overlayShowObjectives
  const footerLeft = !settings.overlayShowGold
    ? t('Oro desactivado en Ajustes')
    : showGold
      ? t('Oro estimado · no lee memoria del juego')
      : t('Oro oculto · Ctrl+Shift+G')

  useEffect(() => {
    setGoldVisible(!settings.overlayGoldOnDemand)
  }, [settings.overlayGoldOnDemand])

  useEffect(
    () => window.api.overlay.onGoldToggle(() => setGoldVisible((current) => !current)),
    []
  )

  if (!index) {
    return (
      <Shell
        mode="live"
        timer={formatDuration(gameTime)}
        opacity={settings.overlayOpacity}
        footerLeft={t('Cargando datos oficiales')}
      >
        <p className="py-10 text-center text-[0.72rem] leading-relaxed text-ink-400">
          {data.status === 'error'
            ? t('Datos no disponibles. Abre App-LOL y vuelve a intentar la carga.')
            : t('Cargando datos oficiales…')}
        </p>
      </Shell>
    )
  }

  return (
    <Shell
      mode="live"
      timer={formatDuration(gameTime)}
      opacity={settings.overlayOpacity}
      footerLeft={footerLeft}
    >
      {showGold && (
        <>
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[0.52rem] font-bold uppercase tracking-[0.16em] text-gold-300">
              {t('Diferencia por línea')}
            </p>
            <span className="text-[0.55rem] text-ink-500">{t('Equipo {team}', { team: t(mine) })}</span>
          </div>
          <LaneGoldBoard live={live} gameTime={gameTime} compact />
        </>
      )}
      {showObjectives && (
        <>
          <div className="flex items-center gap-1.5 px-0.5 pt-1">
            <TimerReset className="h-3 w-3 text-teal-300" />
            <p className="text-[0.52rem] font-bold uppercase tracking-[0.16em] text-teal-300">
              {t('Objetivos')}
            </p>
          </div>
          <ObjectiveTimerList live={live} gameTime={gameTime} compact />
        </>
      )}
      {!showGold && !showObjectives && (
        <p className="py-10 text-center text-[0.72rem] leading-relaxed text-ink-400">
          {t('No hay secciones activas. Configúralas en Ajustes.')}
        </p>
      )}
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
  const settings = useAppStore((state) => state.settings)
  const remaining = champSelect.timer
    ? Math.max(0, champSelect.timer.remainingMs - (now - snapshot.updatedAt))
    : 0
  return (
    <Shell
      mode="champ-select"
      timer={champSelect.timer ? formatTimer(remaining) : '—'}
      opacity={settings.overlayOpacity}
      footerLeft={t('Counters por kit · no son winrates')}
    >
      <ChampSelectBoard champSelect={champSelect} compact />
    </Shell>
  )
}

function OverlayContent(): React.JSX.Element {
  const snapshot = useAppStore((state) => state.snapshot)
  const data = useAppStore((state) => state.data)
  const settings = useAppStore((state) => state.settings)
  const now = useNow()

  if (snapshot.live) return <LiveOverlay live={snapshot.live} now={now} />
  if (snapshot.champSelect) return <ChampSelectOverlay champSelect={snapshot.champSelect} now={now} />
  if (data.status === 'loading') {
    return (
      <Shell
        mode="idle"
        timer="—"
        opacity={settings.overlayOpacity}
        footerLeft={t('Cargando App-LOL')}
      >
        <p className="py-10 text-center text-[0.72rem] text-ink-400">{t('Cargando App-LOL…')}</p>
      </Shell>
    )
  }
  if (data.status === 'error') {
    return (
      <Shell
        mode="idle"
        timer="—"
        opacity={settings.overlayOpacity}
        footerLeft={t('Datos no disponibles')}
      >
        <p className="py-10 text-center text-[0.72rem] leading-relaxed text-ink-400">
          {t('No pudimos cargar los datos de Riot. Abre App-LOL y vuelve a intentarlo desde Ajustes.')}
        </p>
      </Shell>
    )
  }
  return (
    <Shell
      mode="idle"
      timer="—"
      opacity={settings.overlayOpacity}
      footerLeft={t('Sin partida activa')}
    >
      <p className="py-10 text-center text-[0.72rem] leading-relaxed text-ink-400">
        {t('Abre League of Legends y entra en champ select o en una partida.')}
      </p>
    </Shell>
  )
}

export function OverlayRoot(): React.JSX.Element {
  const initialize = useAppStore((state) => state.initialize)
  const initialized = useAppStore((state) => state.initialized)
  const language = useAppStore((state) => state.settings.language)

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
        <div
          className="rounded-2xl border border-white/10 p-6 text-center text-[0.7rem] text-ink-400 backdrop-blur-xl"
          style={{ backgroundColor: 'rgba(6, 10, 18, 0.75)' }}
        >
          {t('Cargando overlay…')}
        </div>
      </div>
    )
  }

  return (
    <GameDataProvider key={language}>
      <OverlayContent />
    </GameDataProvider>
  )
}
