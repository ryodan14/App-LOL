import { app, BrowserWindow, Notification } from 'electron'
import { autoUpdater } from 'electron-updater'
import { t } from '@shared/i18n'
import type { UpdateReason, UpdateState } from '@shared/types'

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000
const STARTUP_DELAY_MS = 12_000

let state: UpdateState = { status: 'idle', currentVersion: app.getVersion() }
let started = false
let inFlight: Promise<UpdateState> | null = null

function unsupportedReason(): UpdateReason | null {
  if (!app.isPackaged) return 'development'
  if (process.env['PORTABLE_EXECUTABLE_DIR']) return 'portable'
  if (process.platform !== 'win32') return 'platform'
  return null
}

function publish(patch: Partial<UpdateState>): UpdateState {
  state = { ...state, ...patch }
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('updates:updated', state)
  }
  return state
}

function notifyDownloaded(version: string): void {
  if (!Notification.isSupported()) return
  new Notification({
    title: t('Actualización lista'),
    body: t('App-LOL {version} se instalará al reiniciar.', { version })
  }).show()
}

export function getUpdateState(): UpdateState {
  return state
}

export function initUpdater(): void {
  if (started) return
  started = true

  const reason = unsupportedReason()
  if (reason) {
    state = { ...state, status: 'unsupported', reason }
    return
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowDowngrade = false

  autoUpdater.on('checking-for-update', () => {
    publish({ status: 'checking', error: undefined })
  })
  autoUpdater.on('update-available', (info) => {
    publish({ status: 'available', version: info.version, error: undefined })
  })
  autoUpdater.on('update-not-available', () => {
    publish({ status: 'up-to-date', version: undefined, progress: undefined, error: undefined })
  })
  autoUpdater.on('download-progress', (progress) => {
    publish({ status: 'downloading', progress: Math.round(progress.percent) })
  })
  autoUpdater.on('update-downloaded', (info) => {
    publish({ status: 'downloaded', version: info.version, progress: 100, error: undefined })
    notifyDownloaded(info.version)
  })
  autoUpdater.on('error', (error) => {
    publish({ status: 'error', error: error.message })
  })

  setTimeout(() => void checkForUpdates(), STARTUP_DELAY_MS)
  setInterval(() => void checkForUpdates(), CHECK_INTERVAL_MS)
}

export function checkForUpdates(): Promise<UpdateState> {
  if (state.status === 'unsupported') return Promise.resolve(state)
  if (inFlight) return inFlight

  publish({ status: 'checking', error: undefined })
  inFlight = (async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      if (state.status === 'checking') {
        const version = result?.updateInfo.version
        publish(
          version && version !== app.getVersion()
            ? { status: 'available', version }
            : { status: 'up-to-date', version: undefined }
        )
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      publish({ status: 'error', error: message })
    } finally {
      inFlight = null
    }
    return state
  })()
  return inFlight
}

export function restartAndInstall(): void {
  if (state.status === 'downloaded') autoUpdater.quitAndInstall(false, true)
}
