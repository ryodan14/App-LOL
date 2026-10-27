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
    <div className="w-full p-2.5">
      <div
        className="relative overflow-hidden rounded-[1.15rem] border border-white/[0.13] shadow-[0_28px_90px_rgba(0,0,0,0.85)] ring-1 ring-inset ring-white/[0.035] backdrop-blur-2xl"
        style={{ backgroundColor: `rgba(6, 10, 18, ${alpha})` }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-300/60 to-transparent" />
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-3.5 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-gold-400/35 bg-gradient-to-br from-gold-400/20 to-gold-400/5 shadow-[0_0_24px_rgba(199,168,90,0.12)]">
              <Swords className="h-4 w-4 text-gold-200" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-[0.82rem] font-semibold tracking-[0.16em] text-ink-100">
                APP-LOL
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[0.54rem] uppercase tracking-[0.18em] text-ink-500">
                {mode === 'live' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-300" />}
                {mode === 'live' ? t('Partida en vivo') : mode === 'champ-select' ? t('Champ select') : t('En espera')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {mode === 'live' && (
              <Badge tone="teal">
                <Radio className="h-2.5 w-2.5" /> LIVE
              </Badge>
            )}
            <span className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-black/20 px-2 py-1 font-mono text-[0.76rem] font-bold tabular-nums text-ink-100">
              <Clock3 className="h-3.5 w-3.5 text-ink-500" />
              {timer}
            </span>
          </div>
        </div>
        <div className="space-y-3 p-3.5">{children}</div>
        <div className="flex items-center justify-between gap-2 border-t border-white/[0.07] px-3.5 py-2 text-[0.54rem] text-ink-600">
          <span className="truncate">{footerLeft}</span>
          <span className="shrink-0 rounded border border-white/[0.06] px-1.5 py-0.5 font-mono text-[0.5rem]">
            Ctrl+Shift+O
          </span>
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
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-gold-300">
              {t('Diferencia por línea')}
            </p>
            <span className="rounded-full border border-white/[0.07] bg-black/20 px-2 py-0.5 text-[0.58rem] text-ink-400">
              {t('Equipo {team}', { team: t(mine) })}
            </span>
          </div>
          <LaneGoldBoard live={live} gameTime={gameTime} compact />
        </>
      )}
      {showObjectives && (
        <>
          <div className="flex items-center gap-1.5 px-0.5 pt-1">
            <TimerReset className="h-3.5 w-3.5 text-teal-300" />
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-teal-300">
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
