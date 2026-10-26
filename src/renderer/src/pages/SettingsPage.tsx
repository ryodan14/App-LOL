import { useState } from 'react'
import { Database, ExternalLink, Info, MonitorCog, MonitorUp, RefreshCw, Wifi } from 'lucide-react'
import { POLL_INTERVAL_OPTIONS } from '@shared/constants'
import { formatRelativeTime } from '@renderer/lib/format'
import { phaseLabel } from '@renderer/lib/phases'
import { useAppStore } from '@renderer/store/useAppStore'
import { Card, SectionHeading } from '@renderer/components/ui/Card'
import { Button } from '@renderer/components/ui/Button'
import { Toggle } from '@renderer/components/ui/Toggle'
import { Badge } from '@renderer/components/ui/Badge'
import { Spinner } from '@renderer/components/ui/EmptyState'

export function SettingsPage(): React.JSX.Element {
  const settings = useAppStore((state) => state.settings)
  const snapshot = useAppStore((state) => state.snapshot)
  const data = useAppStore((state) => state.data)
  const version = useAppStore((state) => state.version)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const refreshData = useAppStore((state) => state.refreshData)
  const reconnect = useAppStore((state) => state.reconnect)
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <SectionHeading
          eyebrow="Cliente"
          title="League of Legends"
          description="La app busca el cliente local automáticamente. Si usás una instalación personalizada, podés indicar la ruta."
          action={
            <Badge tone={snapshot.lcuConnected ? 'teal' : 'neutral'}>
              {snapshot.lcuConnected ? 'Conectado' : 'Sin conexión'}
            </Badge>
          }
        />
        <div className="mt-4 divide-y divide-line">
          <Toggle
            checked={settings.autoDetectClient}
            onChange={(value) => void updateSettings({ autoDetectClient: value })}
            label="Detectar el cliente automáticamente"
            description="Busca LeagueClientUx.exe y el archivo lockfile."
          />
          {!settings.autoDetectClient && (
            <div className="space-y-3 py-4">
              <label className="block">
                <span className="mb-1.5 block text-[0.78rem] font-semibold text-ink-200">
                  Ruta de instalación (opcional)
                </span>
                <input
                  className="input"
                  value={settings.customLcuPath}
                  onChange={(event) => void updateSettings({ customLcuPath: event.target.value })}
                  placeholder="C:\\Riot Games\\League of Legends"
                  spellCheck={false}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[0.78rem] font-semibold text-ink-200">Puerto LCU</span>
                  <input
                    className="input"
                    inputMode="numeric"
                    value={settings.manualLcuPort ?? ''}
                    onChange={(event) =>
                      void updateSettings({
                        manualLcuPort: event.target.value ? Number(event.target.value) : null
                      })
                    }
                    placeholder="Ej. 54321"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[0.78rem] font-semibold text-ink-200">
                    Token de conexión
                  </span>
                  <input
                    className="input"
                    type="password"
                    value={settings.manualLcuToken}
                    onChange={(event) => void updateSettings({ manualLcuToken: event.target.value })}
                    placeholder="Token local del cliente"
                    spellCheck={false}
                  />
                </label>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="text-[0.86rem] font-semibold text-ink-100">Estado actual</p>
              <p className="text-[0.76rem] text-ink-400">
                {phaseLabel(snapshot.phase)}
                {snapshot.lcuSource ? ` · fuente: ${snapshot.lcuSource}` : ''}
                {snapshot.lcuError ? ` · ${snapshot.lcuError}` : ''}
              </p>
            </div>
            <Button variant="ghost" icon={<RefreshCw className="h-4 w-4" />} onClick={() => void reconnect()}>
              Volver a detectar
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="text-[0.86rem] font-semibold text-ink-100">Frecuencia de actualización</p>
              <p className="text-[0.76rem] text-ink-400">En partida se recomienda 2 segundos.</p>
            </div>
            <select
              className="input select w-36"
              value={settings.pollIntervalMs}
              onChange={(event) => void updateSettings({ pollIntervalMs: Number(event.target.value) })}
            >
              {POLL_INTERVAL_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value / 1000} s
                </option>
              ))}
            </select>
          </div>
          <div className="py-3">
            <button
              type="button"
              className="text-[0.75rem] font-semibold text-ink-400 transition-colors hover:text-gold-300"
              onClick={() => setShowAdvanced((value) => !value)}
            >
              {showAdvanced ? 'Ocultar' : 'Mostrar'} información avanzada
            </button>
            {showAdvanced && (
              <p className="mt-2 rounded-lg border border-line bg-base-950/50 px-3 py-2 font-mono text-[0.68rem] leading-relaxed text-ink-500">
                La app usa la API local del cliente (LCU) y la Live Client Data API en
                127.0.0.1:2999. Nunca envía tu token a internet.
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <SectionHeading eyebrow="Interfaz" title="Ventana y apariencia" />
          <div className="mt-3 divide-y divide-line">
            <Toggle
              checked={settings.alwaysOnTop}
              onChange={(value) => void updateSettings({ alwaysOnTop: value })}
              label="Mantener la ventana arriba"
              description="Útil para un segundo monitor o para consultar rápido."
            />
            <Toggle
              checked={settings.overlayEnabled}
              onChange={(value) => void updateSettings({ overlayEnabled: value })}
              label="Overlay de partida"
              description="Muestra counters en champ select, diferencia de oro estimada por línea y timers sobre el juego. Se oculta fuera de partida."
            />
            <div className="flex items-center justify-between gap-3 py-3">
              <span className="inline-flex items-center gap-2 text-[0.72rem] text-ink-400">
                <MonitorUp className="h-3.5 w-3.5 text-gold-300/80" /> Atajo para mostrar/ocultar
              </span>
              <kbd className="rounded-md border border-line bg-base-950/50 px-2 py-1 font-mono text-[0.62rem] text-ink-300">
                Ctrl + Shift + O
              </kbd>
            </div>
            <p className="pb-3 text-[0.64rem] leading-relaxed text-ink-500">
              El overlay es click-through y no roba foco. En pantalla completa exclusiva puede no
              verse; usá el juego en ventana sin bordes.
            </p>
            <Toggle
              checked={settings.showSplashArt}
              onChange={(value) => void updateSettings({ showSplashArt: value })}
              label="Mostrar splash arts"
              description="Ilustraciones de fondo en inicio y campeones."
            />
            <Toggle
              checked={settings.reduceMotion}
              onChange={(value) => void updateSettings({ reduceMotion: value })}
              label="Reducir animaciones"
              description="Desactiva transiciones y efectos de movimiento."
            />
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="Datos" title="Parche y caché" />
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-line bg-base-950/40 px-3 py-2.5">
              <span className="inline-flex items-center gap-2 text-[0.78rem] text-ink-400">
                <Database className="h-4 w-4" /> Parche
              </span>
              <span className="font-display text-sm font-semibold text-ink-200">
                {data.data?.patch ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-line bg-base-950/40 px-3 py-2.5">
              <span className="inline-flex items-center gap-2 text-[0.78rem] text-ink-400">
                <Wifi className="h-4 w-4" /> Actualizado
              </span>
              <span className="text-[0.78rem] font-medium text-ink-300">
                {data.data ? formatRelativeTime(data.data.fetchedAt) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-line bg-base-950/40 px-3 py-2.5">
              <span className="inline-flex items-center gap-2 text-[0.78rem] text-ink-400">
                <MonitorCog className="h-4 w-4" /> Campeones / objetos
              </span>
              <span className="text-[0.78rem] font-medium text-ink-300">
                {data.data ? `${data.data.champions.length} / ${data.data.items.length}` : '—'}
              </span>
            </div>
            {data.error && <p className="text-[0.72rem] text-danger-400">{data.error}</p>}
            <Button
              variant="ghost"
              className="w-full"
              icon={
                data.status === 'loading' ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />
              }
              onClick={() => void refreshData()}
              disabled={data.status === 'loading'}
            >
              Actualizar datos ahora
            </Button>
            <p className="text-[0.68rem] leading-relaxed text-ink-500">
              Los datos se obtienen de Data Dragon y Community Dragon (Riot Games) y se guardan en
              tu equipo para que la app abra más rápido.
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <SectionHeading eyebrow="Acerca de" title="App-LOL" />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone="gold">v{version || '0.1.0'}</Badge>
          <Badge>Electron + React</Badge>
          <Badge>Sin publicidad</Badge>
        </div>
        <p className="mt-4 max-w-3xl text-[0.78rem] leading-relaxed text-ink-400">
          App-LOL es un proyecto personal para consultar builds, counters y el estado de la partida.
          No está afiliada ni respaldada por Riot Games. League of Legends y todos los activos
          relacionados son propiedad de Riot Games, Inc.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="quiet"
            size="sm"
            icon={<ExternalLink className="h-3.5 w-3.5" />}
            onClick={() => void window.api.external.open('https://github.com/ryodan14/App-LOL')}
          >
            Repositorio
          </Button>
          <Button
            variant="quiet"
            size="sm"
            icon={<ExternalLink className="h-3.5 w-3.5" />}
            onClick={() => void window.api.external.open('https://developer.riotgames.com/')}
          >
            Riot Developer
          </Button>
          <Button
            variant="quiet"
            size="sm"
            icon={<Info className="h-3.5 w-3.5" />}
            onClick={() =>
              void window.api.external.open('https://www.riotgames.com/es/terminos-de-servicio')
            }
          >
            Términos de Riot
          </Button>
        </div>
      </Card>
    </div>
  )
}
