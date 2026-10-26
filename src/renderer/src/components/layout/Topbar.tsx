import { useLocation } from 'react-router-dom'
import { MonitorOff, MonitorUp, Pin, RefreshCw } from 'lucide-react'
import { useAppStore } from '@renderer/store/useAppStore'
import { useGameData } from '@renderer/lib/gameData'
import { phaseLabel, phaseTone } from '@renderer/lib/phases'
import { StatusDot } from '@renderer/components/ui/Badge'
import { Button } from '@renderer/components/ui/Button'
import { Spinner } from '@renderer/components/ui/EmptyState'
import { cn } from '@renderer/lib/cn'

const subtitles: Record<string, string> = {
  '/': 'Resumen y estado de tu cliente',
  '/partida': 'Champ select y partida en vivo',
  '/campeones': 'Builds, runas y counters',
  '/cuenta': 'Rango, maestría y progreso',
  '/ajustes': 'Personalizá tu experiencia'
}

export function Topbar(): React.JSX.Element {
  const location = useLocation()
  const index = useGameData()
  const snapshot = useAppStore((state) => state.snapshot)
  const settings = useAppStore((state) => state.settings)
  const data = useAppStore((state) => state.data)
  const refreshSnapshot = useAppStore((state) => state.refreshSnapshot)
  const refreshData = useAppStore((state) => state.refreshData)
  const updateSettings = useAppStore((state) => state.updateSettings)

  const championDetail = location.pathname.match(/^\/campeones\/([^/]+)/)
  const champion = championDetail ? index?.championById.get(championDetail[1]) : null

  const title = champion
    ? champion.name
    : location.pathname === '/'
      ? 'Inicio'
      : location.pathname.startsWith('/partida')
        ? 'Partida en vivo'
        : location.pathname.startsWith('/campeones')
          ? 'Campeones'
          : location.pathname.startsWith('/cuenta')
            ? 'Mi cuenta'
            : location.pathname.startsWith('/ajustes')
              ? 'Ajustes'
              : 'App-LOL'

  const subtitle = champion
    ? `${champion.title} · ${champion.tags.join(' / ')}`
    : (subtitles[location.pathname] ?? 'League of Legends, más claro')

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-base-950/70 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4 lg:px-8">
      <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display truncate text-[1.15rem] font-semibold tracking-tight text-ink-100">
            {title}
          </h1>
          <p className="mt-0.5 truncate text-[0.72rem] text-ink-500">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-9 items-center gap-2 rounded-xl border border-line bg-base-900/65 px-3">
            <StatusDot tone={phaseTone(snapshot.phase)} pulse={snapshot.phase !== 'Offline'} />
            <span className="text-[0.72rem] font-semibold text-ink-200">
              {phaseLabel(snapshot.phase)}
            </span>
          </div>

          {data.status === 'ready' && (
            <span className="chip chip-gold max-sm:hidden">{data.data?.patch}</span>
          )}
          {data.status === 'loading' && (
            <span className="chip max-sm:hidden">
              <Spinner className="h-3 w-3" /> Cargando datos
            </span>
          )}
          {data.status === 'error' && (
            <button
              type="button"
              onClick={() => void refreshData()}
              className="chip chip-danger max-sm:hidden"
              title={data.error}
            >
              Datos no disponibles
            </button>
          )}

          <Button
            variant="quiet"
            size="icon"
            onClick={() => void refreshSnapshot()}
            title="Actualizar estado"
            aria-label="Actualizar estado"
          >
            <RefreshCw
              className={cn('h-4 w-4', snapshot.phase === 'InProgress' && 'text-teal-300')}
            />
          </Button>
          <Button
            variant={settings.overlayEnabled ? 'ghost' : 'quiet'}
            size="icon"
            onClick={() => void updateSettings({ overlayEnabled: !settings.overlayEnabled })}
            title={settings.overlayEnabled ? 'Ocultar overlay' : 'Mostrar overlay'}
            aria-label={settings.overlayEnabled ? 'Ocultar overlay' : 'Mostrar overlay'}
            aria-pressed={settings.overlayEnabled}
            className={settings.overlayEnabled ? 'border-teal-400/30 text-teal-300' : ''}
          >
            {settings.overlayEnabled ? (
              <MonitorUp className="h-4 w-4" />
            ) : (
              <MonitorOff className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant={settings.alwaysOnTop ? 'ghost' : 'quiet'}
            size="icon"
            onClick={() => void updateSettings({ alwaysOnTop: !settings.alwaysOnTop })}
            title={settings.alwaysOnTop ? 'Desanclar ventana' : 'Mantener ventana arriba'}
            aria-label={settings.alwaysOnTop ? 'Desanclar ventana' : 'Mantener ventana arriba'}
            className={settings.alwaysOnTop ? 'border-gold-400/30 text-gold-300' : ''}
          >
            <Pin className={cn('h-4 w-4', settings.alwaysOnTop && 'fill-gold-300/20')} />
          </Button>
        </div>
      </div>
    </header>
  )
}
