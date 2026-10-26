import { useEffect, useState } from 'react'
import { Database, ExternalLink, Info, MonitorCog, MonitorUp, RefreshCw, Wifi } from 'lucide-react'
import { OVERLAY_SCALE_OPTIONS, POLL_INTERVAL_OPTIONS } from '@shared/constants'
import { formatRelativeTime } from '@renderer/lib/format'
import { phaseLabel } from '@renderer/lib/phases'
import { useAppStore } from '@renderer/store/useAppStore'
import { Card, SectionHeading } from '@renderer/components/ui/Card'
import { Button } from '@renderer/components/ui/Button'
import { Toggle } from '@renderer/components/ui/Toggle'
import { Badge } from '@renderer/components/ui/Badge'
import { Spinner } from '@renderer/components/ui/EmptyState'

const OVERLAY_SCALE_LABELS: Record<number, string> = {
  0.7: 'Chico',
  0.8: 'Normal',
  1: 'Grande'
}

export function SettingsPage(): React.JSX.Element {
  const settings = useAppStore((state) => state.settings)
  const snapshot = useAppStore((state) => state.snapshot)
  const data = useAppStore((state) => state.data)
  const version = useAppStore((state) => state.version)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const refreshData = useAppStore((state) => state.refreshData)
  const reconnect = useAppStore((state) => state.reconnect)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customPath, setCustomPath] = useState(settings.customLcuPath)
  const [manualPort, setManualPort] = useState(settings.manualLcuPort?.toString() ?? '')
  const [manualToken, setManualToken] = useState(settings.manualLcuToken)
  const [portError, setPortError] = useState<string | null>(null)

  useEffect(() => setCustomPath(settings.customLcuPath), [settings.customLcuPath])
  useEffect(
    () => setManualPort(settings.manualLcuPort?.toString() ?? ''),
    [settings.manualLcuPort]
  )
  useEffect(() => setManualToken(settings.manualLcuToken), [settings.manualLcuToken])

  const commitPath = (): void => {
    const value = customPath.trim()
    if (value !== settings.customLcuPath) void updateSettings({ customLcuPath: value })
  }

  const commitPort = (): void => {
    const raw = manualPort.trim()
    const value = raw === '' ? null : Number(raw)
    if (value !== null && (!Number.isInteger(value) || value < 1 || value > 65535)) {
      setPortError('El puerto tiene que ser un número entre 1 y 65535.')
      return
    }
    setPortError(null)
    if (value !== settings.manualLcuPort) void updateSettings({ manualLcuPort: value })
  }

  const commitToken = (): void => {
    const value = manualToken.trim()
    if (value !== settings.manualLcuToken) void updateSettings({ manualLcuToken: value })
  }

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
            description="Busca LeagueClientUx.exe y el archivo lockfile. Apagalo para usar solo la ruta o el puerto manual."
          />
          {!settings.autoDetectClient && (
            <div className="space-y-3 py-4">
              <label className="block">
                <span className="mb-1.5 block text-[0.78rem] font-semibold text-ink-200">
                  Ruta de instalación (opcional)
                </span>
                <input
                  className="input"
                  value={customPath}
                  onChange={(event) => setCustomPath(event.target.value)}
                  onBlur={commitPath}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.currentTarget.blur()
                  }}
                  placeholder="C:\Riot Games\League of Legends"
                  spellCheck={false}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[0.78rem] font-semibold text-ink-200">Puerto LCU</span>
                  <input
                    className={portError ? 'input border-danger-500/60' : 'input'}
                    inputMode="numeric"
                    value={manualPort}
                    onChange={(event) => {
                      setManualPort(event.target.value)
                      setPortError(null)
                    }}
                    onBlur={commitPort}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.currentTarget.blur()
                    }}
                    placeholder="Ej. 54321"
                    aria-invalid={Boolean(portError)}
                  />
                  {portError && (
                    <span className="mt-1 block text-[0.66rem] text-danger-400">{portError}</span>
                  )}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[0.78rem] font-semibold text-ink-200">
                    Token de conexión
                  </span>
                  <input
                    className="input"
                    type="password"
                    value={manualToken}
                    onChange={(event) => setManualToken(event.target.value)}
                    onBlur={commitToken}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.currentTarget.blur()
                    }}
                    placeholder="Token local del cliente"
                    spellCheck={false}
                  />
                </label>
              </div>
              <p className="text-[0.66rem] leading-relaxed text-ink-500">
                Los cambios de conexión se guardan al salir de cada campo.
              </p>
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
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="text-[0.86rem] font-semibold text-ink-100">Tamaño del overlay</p>
                <p className="text-[0.76rem] text-ink-400">Achicá el panel para que tape menos la partida.</p>
              </div>
              <select
                className="input select w-32"
                value={settings.overlayScale}
                onChange={(event) =>
                  void updateSettings({ overlayScale: Number(event.target.value) })
                }
              >
                {OVERLAY_SCALE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {OVERLAY_SCALE_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
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
        <SectionHeading
          eyebrow="Sistema"
          title="Inicio y bandeja"
          description="Dejá App-LOL lista antes de entrar al cliente. Funciona en la versión instalada y en la portable."
        />
        <div className="mt-3 divide-y divide-line">
          <Toggle
            checked={settings.startWithWindows}
            onChange={(value) => void updateSettings({ startWithWindows: value })}
            label="Iniciar con Windows"
            description="Abre la app en segundo plano al iniciar sesión y la deja en la bandeja."
          />
          <Toggle
            checked={settings.showWithLeague}
            onChange={(value) => void updateSettings({ showWithLeague: value })}
            label="Mostrar al abrir League"
            description="Saca la ventana de la bandeja cuando se detecta el cliente de League of Legends."
          />
        </div>
        <p className="mt-3 rounded-lg border border-line bg-base-950/40 px-3 py-2 text-[0.68rem] leading-relaxed text-ink-500">
          {settings.startWithWindows
            ? 'Con el inicio automático activo, la X oculta la ventana en la bandeja. Para cerrar del todo, usá “Salir” en el icono de la bandeja.'
            : 'Si desactivás el inicio automático, cerrar la ventana cierra la app.'}
        </p>
      </Card>

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
