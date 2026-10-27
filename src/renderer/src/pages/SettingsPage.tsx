import { useEffect, useState } from 'react'
import { Database, ExternalLink, Info, MonitorCog, MonitorUp, RefreshCw, Wifi } from 'lucide-react'
import {
  OVERLAY_CORNER_OPTIONS,
  OVERLAY_SCALE_OPTIONS,
  POLL_INTERVAL_OPTIONS
} from '@shared/constants'
import { formatRelativeTime } from '@renderer/lib/format'
import { phaseLabel } from '@renderer/lib/phases'
import { useAppStore } from '@renderer/store/useAppStore'
import { Card, SectionHeading } from '@renderer/components/ui/Card'
import { Button } from '@renderer/components/ui/Button'
import { Toggle } from '@renderer/components/ui/Toggle'
import { Badge } from '@renderer/components/ui/Badge'
import { Spinner } from '@renderer/components/ui/EmptyState'
import { LOCALE_OPTIONS, t } from '@shared/i18n'
import type { UpdateState } from '@shared/types'

const OVERLAY_SCALE_LABELS: Record<number, string> = {
  0.6: 'Muy chico',
  0.7: 'Chico',
  0.8: 'Normal',
  0.9: 'Grande',
  1: 'Muy grande'
}

const OVERLAY_CORNER_LABELS: Record<string, string> = {
  'top-right': 'Arriba derecha',
  'top-left': 'Arriba izquierda',
  'bottom-right': 'Abajo derecha',
  'bottom-left': 'Abajo izquierda',
  'right-center': 'Derecha al centro',
  'left-center': 'Izquierda al centro'
}

function updateMessage(state: UpdateState | null): string {
  if (!state) return t('Comprueba si hay una versión nueva. La actualización se descarga en segundo plano y se instala al reiniciar.')
  switch (state.status) {
    case 'checking':
      return t('Buscando actualizaciones…')
    case 'available':
      return t('Hay una versión nueva disponible: {version}.', { version: state.version ?? '' })
    case 'downloading':
      return t('Descargando la actualización… {progress}%', { progress: state.progress ?? 0 })
    case 'downloaded':
      return t('Actualización lista. Reinicia para aplicarla.')
    case 'up-to-date':
      return t('Estás en la última versión.')
    case 'error':
      return t('No se pudo comprobar la actualización: {error}', { error: state.error ?? '' })
    case 'unsupported':
      if (state.reason === 'portable') {
        return t('La versión portátil no se actualiza sola. Descarga la última versión desde GitHub Releases.')
      }
      if (state.reason === 'platform') {
        return t('Las actualizaciones automáticas solo están disponibles en Windows.')
      }
      return t('Las actualizaciones automáticas solo están disponibles en la app instalada.')
    default:
      return t('Comprueba si hay una versión nueva. La actualización se descarga en segundo plano y se instala al reiniciar.')
  }
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
  const [updateState, setUpdateState] = useState<UpdateState | null>(null)
  const [checkingUpdates, setCheckingUpdates] = useState(false)

  useEffect(() => setCustomPath(settings.customLcuPath), [settings.customLcuPath])
  useEffect(
    () => setManualPort(settings.manualLcuPort?.toString() ?? ''),
    [settings.manualLcuPort]
  )
  useEffect(() => setManualToken(settings.manualLcuToken), [settings.manualLcuToken])

  useEffect(() => {
    let cancelled = false
    void window.api.updates
      .get()
      .then((state) => {
        if (!cancelled) setUpdateState(state)
      })
      .catch(() => undefined)
    const dispose = window.api.updates.onUpdate((state) => setUpdateState(state))
    return () => {
      cancelled = true
      dispose()
    }
  }, [])

  const checkUpdates = async (): Promise<void> => {
    setCheckingUpdates(true)
    try {
      setUpdateState(await window.api.updates.check())
    } catch {
      // The main process reports the error through the update state.
    } finally {
      setCheckingUpdates(false)
    }
  }

  const commitPath = (): void => {
    const value = customPath.trim()
    if (value !== settings.customLcuPath) void updateSettings({ customLcuPath: value })
  }

  const commitPort = (): void => {
    const raw = manualPort.trim()
    const value = raw === '' ? null : Number(raw)
    if (value !== null && (!Number.isInteger(value) || value < 1 || value > 65535)) {
      setPortError(t('El puerto debe ser un número entre 1 y 65535.'))
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
          eyebrow={t('Cliente')}
          title="League of Legends"
          description={t('La app busca el cliente local automáticamente. Si usas una instalación personalizada, puedes indicar la ruta.')}
          action={
            <Badge tone={snapshot.lcuConnected ? 'teal' : 'neutral'}>
              {snapshot.lcuConnected ? t('Conectado') : t('Sin conexión')}
            </Badge>
          }
        />
        <div className="mt-4 divide-y divide-line">
          <Toggle
            checked={settings.autoDetectClient}
            onChange={(value) => void updateSettings({ autoDetectClient: value })}
            label={t('Detectar el cliente automáticamente')}
            description={t('Busca LeagueClientUx.exe y el archivo lockfile. Desactívalo para usar solo la ruta o el puerto manual.')}
          />
          {!settings.autoDetectClient && (
            <div className="space-y-3 py-4">
              <label className="block">
                <span className="mb-1.5 block text-[0.78rem] font-semibold text-ink-200">
                  {t('Ruta de instalación (opcional)')}
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
                  <span className="mb-1.5 block text-[0.78rem] font-semibold text-ink-200">{t('Puerto LCU')}</span>
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
                    placeholder={t('Ej. 54321')}
                    aria-invalid={Boolean(portError)}
                  />
                  {portError && (
                    <span className="mt-1 block text-[0.66rem] text-danger-400">{portError}</span>
                  )}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[0.78rem] font-semibold text-ink-200">
                    {t('Token de conexión')}
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
                    placeholder={t('Token local del cliente')}
                    spellCheck={false}
                  />
                </label>
              </div>
              <p className="text-[0.66rem] leading-relaxed text-ink-500">
                {t('Los cambios de conexión se guardan al salir de cada campo.')}
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="text-[0.86rem] font-semibold text-ink-100">{t('Estado actual')}</p>
              <p className="text-[0.76rem] text-ink-400">
                {phaseLabel(snapshot.phase)}
                {snapshot.lcuSource ? ` · ${t('fuente: {source}', { source: snapshot.lcuSource })}` : ''}
                {snapshot.lcuError ? ` · ${snapshot.lcuError}` : ''}
              </p>
            </div>
            <Button variant="ghost" icon={<RefreshCw className="h-4 w-4" />} onClick={() => void reconnect()}>
              {t('Volver a detectar')}
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="text-[0.86rem] font-semibold text-ink-100">{t('Frecuencia de actualización')}</p>
              <p className="text-[0.76rem] text-ink-400">{t('En partida se recomienda 2 segundos.')}</p>
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
              {showAdvanced ? t('Ocultar') : t('Mostrar')} {t('información avanzada')}
            </button>
            {showAdvanced && (
              <p className="mt-2 rounded-lg border border-line bg-base-950/50 px-3 py-2 font-mono text-[0.68rem] leading-relaxed text-ink-500">
                {t('La app usa la API local del cliente (LCU) y la Live Client Data API en 127.0.0.1:2999. Nunca envía tu token a internet.')}
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <SectionHeading eyebrow={t('Interfaz')} title={t('Ventana y apariencia')} />
          <div className="mt-3 divide-y divide-line">
            <div className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="text-[0.86rem] font-semibold text-ink-100">{t('Idioma de la interfaz')}</p>
                <p className="text-[0.76rem] text-ink-400">
                  {t('Cambia el idioma de la app y de los datos de Riot.')}
                </p>
              </div>
              <select
                className="input select w-52"
                value={settings.language}
                onChange={(event) =>
                  void updateSettings({ language: event.target.value as typeof settings.language })
                }
                aria-label={t('Idioma')}
              >
                {LOCALE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.native}
                  </option>
                ))}
              </select>
            </div>
            <Toggle
              checked={settings.alwaysOnTop}
              onChange={(value) => void updateSettings({ alwaysOnTop: value })}
              label={t('Mantener la ventana arriba')}
              description={t('Útil para un segundo monitor o para consultar rápido.')}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="text-[0.86rem] font-semibold text-ink-100">{t('Segundo monitor')}</p>
                <p className="text-[0.76rem] text-ink-400">
                  {t('Mueve la ventana al otro monitor para dejar solo el overlay sobre el juego.')}
                </p>
              </div>
              <Button
                variant="ghost"
                icon={<MonitorCog className="h-4 w-4" />}
                onClick={() => window.api.window.moveToSecondary()}
              >
                {t('Mover al otro monitor')}
              </Button>
            </div>
            <Toggle
              checked={settings.showSplashArt}
              onChange={(value) => void updateSettings({ showSplashArt: value })}
              label={t('Mostrar splash arts')}
              description={t('Ilustraciones de fondo en inicio y campeones.')}
            />
            <Toggle
              checked={settings.reduceMotion}
              onChange={(value) => void updateSettings({ reduceMotion: value })}
              label={t('Reducir animaciones')}
              description={t('Desactiva transiciones y efectos de movimiento.')}
            />
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow={t('Datos')} title={t('Parche y caché')} />
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-line bg-base-950/40 px-3 py-2.5">
              <span className="inline-flex items-center gap-2 text-[0.78rem] text-ink-400">
                <Database className="h-4 w-4" /> {t('Parche')}
              </span>
              <span className="font-display text-sm font-semibold text-ink-200">
                {data.data?.patch ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-line bg-base-950/40 px-3 py-2.5">
              <span className="inline-flex items-center gap-2 text-[0.78rem] text-ink-400">
                <Wifi className="h-4 w-4" /> {t('Actualizado')}
              </span>
              <span className="text-[0.78rem] font-medium text-ink-300">
                {data.data ? formatRelativeTime(data.data.fetchedAt) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-line bg-base-950/40 px-3 py-2.5">
              <span className="inline-flex items-center gap-2 text-[0.78rem] text-ink-400">
                <MonitorCog className="h-4 w-4" /> {t('Campeones / objetos')}
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
              {t('Actualizar datos ahora')}
            </Button>
            <p className="text-[0.68rem] leading-relaxed text-ink-500">
              {t('Los datos se obtienen de Data Dragon y Community Dragon (Riot Games) y se guardan en tu equipo para que la app abra más rápido.')}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <SectionHeading
          eyebrow="Overlay"
          title={t('Panel de partida')}
          description={t('Ajusta tamaño, transparencia, posición y qué información quieres ver sobre el juego.')}
          action={
            <Badge tone={settings.overlayEnabled ? 'teal' : 'neutral'}>
              {settings.overlayEnabled ? t('Activo') : t('Oculto')}
            </Badge>
          }
        />
        <div className="mt-3 divide-y divide-line">
          <Toggle
            checked={settings.overlayEnabled}
            onChange={(value) => void updateSettings({ overlayEnabled: value })}
            label={t('Overlay de partida')}
            description={t('Muestra counters en champ select, diferencia de oro estimada por línea y timers sobre el juego. Se oculta fuera de partida.')}
          />
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[0.78rem] font-semibold text-ink-200">
                {t('Tamaño')}
              </span>
              <select
                className="input select w-full"
                value={settings.overlayScale}
                onChange={(event) =>
                  void updateSettings({ overlayScale: Number(event.target.value) })
                }
              >
                {OVERLAY_SCALE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(OVERLAY_SCALE_LABELS[value])} · {Math.round(value * 100)}%
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[0.78rem] font-semibold text-ink-200">
                {t('Posición')}
              </span>
              <select
                className="input select w-full"
                value={settings.overlayCorner}
                onChange={(event) =>
                  void updateSettings({ overlayCorner: event.target.value as typeof settings.overlayCorner })
                }
              >
                {OVERLAY_CORNER_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(OVERLAY_CORNER_LABELS[value])}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-[0.78rem] font-semibold text-ink-200">
                  {t('Transparencia del fondo')}
                </span>
                <span className="font-mono text-[0.72rem] text-ink-400">
                  {Math.round(settings.overlayOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={35}
                max={100}
                step={5}
                value={Math.round(settings.overlayOpacity * 100)}
                onChange={(event) =>
                  void updateSettings({ overlayOpacity: Number(event.target.value) / 100 })
                }
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-gold-400"
                aria-label={t('Transparencia del fondo del overlay')}
              />
              <p className="mt-1.5 text-[0.66rem] leading-relaxed text-ink-500">
                {t('35% deja ver casi todo el juego; 100% es un fondo sólido.')}
              </p>
            </div>
          </div>
          <Toggle
            checked={settings.overlayShowGold}
            onChange={(value) => void updateSettings({ overlayShowGold: value })}
            label={t('Mostrar diferencia de oro')}
            description={t('Incluye la estimación de oro por línea en la partida.')}
          />
          {settings.overlayShowGold && (
            <Toggle
              checked={settings.overlayGoldOnDemand}
              onChange={(value) => void updateSettings({ overlayGoldOnDemand: value })}
              label={t('Oro solo con Ctrl+Shift+G')}
              description={t('El panel de oro empieza oculto y lo muestras u ocultas con el atajo. No podemos leer la tecla Tab del juego.')}
            />
          )}
          <Toggle
            checked={settings.overlayShowObjectives}
            onChange={(value) => void updateSettings({ overlayShowObjectives: value })}
            label={t('Mostrar timers de objetivos')}
            description={t('Dragón, barón, heraldo e inhibidores estimados.')}
          />
          <Toggle
            checked={settings.overlayShowChampSelect}
            onChange={(value) => void updateSettings({ overlayShowChampSelect: value })}
            label={t('Mostrar en champ select')}
            description={t('Muestra los counters por kit mientras eliges campeón.')}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <span className="inline-flex items-center gap-2 text-[0.72rem] text-ink-400">
              <MonitorUp className="h-3.5 w-3.5 text-gold-300/80" /> {t('Atajos globales')}
            </span>
            <div className="flex flex-wrap gap-2">
              <kbd className="rounded-md border border-line bg-base-950/50 px-2 py-1 font-mono text-[0.62rem] text-ink-300">
                Ctrl + Shift + O
              </kbd>
              <kbd className="rounded-md border border-line bg-base-950/50 px-2 py-1 font-mono text-[0.62rem] text-ink-300">
                {t('Ctrl + Shift + G oro')}
              </kbd>
            </div>
          </div>
          <p className="py-3 text-[0.64rem] leading-relaxed text-ink-500">
            {t('El overlay es click-through y no roba foco. En pantalla completa exclusiva puede no verse; usa el juego en ventana sin bordes. La posición “al centro” sirve para acercar los timers al minimapa sin taparlo del todo.')}
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeading
          eyebrow={t('Sistema')}
          title={t('Inicio y bandeja')}
          description={t('Deja App-LOL lista antes de entrar al cliente. Funciona en la versión instalada y en la portátil.')}
        />
        <div className="mt-3 divide-y divide-line">
          <Toggle
            checked={settings.startWithWindows}
            onChange={(value) => void updateSettings({ startWithWindows: value })}
            label={t('Iniciar con Windows')}
            description={t('Abre la app en segundo plano al iniciar sesión y la deja en la bandeja.')}
          />
          <Toggle
            checked={settings.showWithLeague}
            onChange={(value) => void updateSettings({ showWithLeague: value })}
            label={t('Mostrar al abrir League')}
            description={t('Saca la ventana de la bandeja cuando se detecta el cliente de League of Legends.')}
          />
        </div>
        <p className="mt-3 rounded-lg border border-line bg-base-950/40 px-3 py-2 text-[0.68rem] leading-relaxed text-ink-500">
          {settings.startWithWindows
            ? t('Con el inicio automático activo, la X oculta la ventana en la bandeja. Para cerrar del todo, usa “Salir” en el icono de la bandeja.')
            : t('Si desactivas el inicio automático, cerrar la ventana cierra la app.')}
        </p>
      </Card>

      <Card className="p-6">
        <SectionHeading
          eyebrow={t('Actualizaciones')}
          title={t('Mantén App-LOL al día')}
          description={t('Comprueba si hay una versión nueva. La actualización se descarga en segundo plano y se instala al reiniciar.')}
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone="gold">v{updateState?.currentVersion || version}</Badge>
          {updateState?.version && updateState.status !== 'up-to-date' ? (
            <Badge tone="teal">v{updateState.version}</Badge>
          ) : null}
        </div>
        <p className="mt-3 text-[0.72rem] leading-relaxed text-ink-400">
          {updateMessage(updateState)}
        </p>
        {updateState?.status === 'downloading' ? (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-base-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300 transition-[width]"
              style={{ width: `${Math.max(2, updateState.progress ?? 0)}%` }}
            />
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="quiet"
            size="sm"
            icon={<RefreshCw className={checkingUpdates ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />}
            disabled={checkingUpdates || updateState?.status === 'checking' || updateState?.status === 'downloading'}
            onClick={() => void checkUpdates()}
          >
            {checkingUpdates || updateState?.status === 'checking'
              ? t('Buscando actualizaciones…')
              : t('Buscar actualizaciones')}
          </Button>
          {updateState?.status === 'downloaded' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => void window.api.updates.restart()}
            >
              {t('Reiniciar e instalar')}
            </Button>
          ) : null}
          {updateState?.status === 'unsupported' ? (
            <Button
              variant="quiet"
              size="sm"
              icon={<ExternalLink className="h-3.5 w-3.5" />}
              onClick={() =>
                void window.api.external.open('https://github.com/ryodan14/App-LOL/releases')
              }
            >
              {t('Ver releases')}
            </Button>
          ) : null}
        </div>
        <p className="mt-3 text-[0.64rem] leading-relaxed text-ink-500">
          {t('La comprobación automática se hace al abrir la app y cada 6 horas.')}
        </p>
      </Card>

      <Card className="p-6">
        <SectionHeading eyebrow={t('Acerca de')} title="App-LOL" />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone="gold">v{version}</Badge>
          <Badge>Electron + React</Badge>
          <Badge>{t('Sin publicidad')}</Badge>
        </div>
        <p className="mt-4 max-w-3xl text-[0.78rem] leading-relaxed text-ink-400">
          {t('App-LOL es un proyecto personal para consultar builds, counters y el estado de la partida. No está afiliada ni respaldada por Riot Games. League of Legends y todos los activos relacionados son propiedad de Riot Games, Inc.')}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="quiet"
            size="sm"
            icon={<ExternalLink className="h-3.5 w-3.5" />}
            onClick={() => void window.api.external.open('https://github.com/ryodan14/App-LOL')}
          >
            {t('Repositorio')}
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
            {t('Términos de Riot')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
