import { app, BrowserWindow, globalShortcut, ipcMain, screen, session, shell } from 'electron'
import { promises as fs } from 'node:fs'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { getSettings, updateSettings } from './services/settings'
import { SnapshotService } from './services/snapshot'
import { StaticDataService } from './services/staticData'
import { createMainWindow, getMainWindow } from './window'
import {
  closeOverlay,
  createOverlayWindow,
  getOverlayWindow,
  setOverlayLayout,
  syncOverlay
} from './overlay'
import { createPreviewAccount, createPreviewSnapshot } from './preview'
import { createAppTray, destroyAppTray, updateAppTray } from './tray'
import type { AppSettings, DataResult, Snapshot } from '@shared/types'

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

let dataService: StaticDataService | null = null
let snapshotService: SnapshotService | null = null
let activeSettings: AppSettings | null = null
let overlayPreviewSnapshot: Snapshot | null = null
let lastLcuConnected = false
let isQuitting = false

function broadcastSettings(settings: AppSettings): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('settings:updated', settings)
  }
}

function loginItemPath(): string {
  return process.env['PORTABLE_EXECUTABLE_FILE'] ?? process.execPath
}

function applyLoginItemSettings(settings: AppSettings): void {
  if (!app.isPackaged || process.env['APP_LOL_DISABLE_AUTOSTART'] === '1') return
  try {
    app.setLoginItemSettings({
      openAtLogin: settings.startWithWindows,
      name: 'App-LOL',
      path: loginItemPath(),
      args: ['--hidden']
    })
  } catch (error) {
    console.error('[startup] No se pudo configurar el inicio con Windows', error)
  }
}

function applySettingsRuntime(settings: AppSettings): void {
  activeSettings = settings
  broadcastSettings(settings)
  applyLoginItemSettings(settings)
  updateAppTray(settings)
}

function showMainWindow(focus = true): void {
  const window = getMainWindow()
  if (!window || window.isDestroyed()) return
  if (window.isMinimized()) window.restore()
  if (focus) {
    window.show()
    window.focus()
  } else {
    window.showInactive()
  }
}

async function toggleSetting(key: 'startWithWindows' | 'showWithLeague'): Promise<void> {
  const current = await getSettings()
  const patch =
    key === 'startWithWindows'
      ? { startWithWindows: !current.startWithWindows }
      : { showWithLeague: !current.showWithLeague }
  const next = await updateSettings(patch)
  applySettingsRuntime(next)
}

function syncOverlayFromSnapshot(snapshot: Snapshot): void {
  if (!activeSettings) return
  if (overlayPreviewSnapshot) {
    syncOverlay(overlayPreviewSnapshot, activeSettings)
    return
  }
  syncOverlay(snapshot, activeSettings)
}

async function toggleOverlay(): Promise<void> {
  const current = await getSettings()
  const next = await updateSettings({ overlayEnabled: !current.overlayEnabled })
  applySettingsRuntime(next)
  syncOverlayFromSnapshot(snapshotService?.get() ?? emptySnapshot())
}

function registerIpc(): void {
  ipcMain.handle('app:version', () => app.getVersion())

  ipcMain.handle('settings:get', () => getSettings())
  ipcMain.handle('settings:update', async (_event, patch: Partial<AppSettings>) => {
    const settings = await updateSettings(patch)
    applySettingsRuntime(settings)
    if ('overlayScale' in patch || 'overlayCorner' in patch) {
      setOverlayLayout(settings.overlayScale, settings.overlayCorner)
    }
    if (typeof patch.alwaysOnTop === 'boolean') {
      getMainWindow()?.setAlwaysOnTop(settings.alwaysOnTop)
    }
    if (
      'pollIntervalMs' in patch ||
      'autoDetectClient' in patch ||
      'customLcuPath' in patch ||
      'manualLcuPort' in patch ||
      'manualLcuToken' in patch
    ) {
      snapshotService?.restart()
    }
    syncOverlayFromSnapshot(snapshotService?.get() ?? emptySnapshot())
    return settings
  })

  ipcMain.handle(
    'static-data:get',
    (): DataResult => dataService?.get() ?? { data: null, status: 'loading' }
  )
  ipcMain.handle(
    'static-data:refresh',
    async (): Promise<DataResult> =>
      dataService?.refresh(true) ?? { data: null, status: 'error', error: 'Servicio no disponible' }
  )
  ipcMain.handle('snapshot:get', (): Snapshot => snapshotService?.get() ?? emptySnapshot())
  ipcMain.handle(
    'snapshot:refresh',
    async (): Promise<Snapshot> => snapshotService?.refresh() ?? emptySnapshot()
  )
  ipcMain.handle(
    'snapshot:reconnect',
    async (): Promise<Snapshot> => snapshotService?.reconnect() ?? emptySnapshot()
  )
  ipcMain.handle('account:get', async () => {
    if (process.argv.includes('--app-lol-account-preview')) return createPreviewAccount()
    return snapshotService?.getAccount() ?? null
  })

  ipcMain.on('window:minimize', () => getMainWindow()?.minimize())
  ipcMain.on('window:toggle-maximize', () => {
    const window = getMainWindow()
    if (!window) return
    if (window.isMaximized()) window.unmaximize()
    else window.maximize()
  })
  ipcMain.on('window:close', () => getMainWindow()?.close())
  ipcMain.handle('window:set-always-on-top', (_event, value: boolean) => {
    getMainWindow()?.setAlwaysOnTop(Boolean(value))
  })
  ipcMain.on('window:move-to-secondary', () => {
    const window = getMainWindow()
    if (!window) return
    const current = screen.getDisplayMatching(window.getBounds())
    const target = screen.getAllDisplays().find((display) => display.id !== current.id)
    if (!target) return
    const bounds = window.getBounds()
    window.setPosition(
      target.workArea.x + Math.round((target.workArea.width - bounds.width) / 2),
      target.workArea.y + Math.round((target.workArea.height - bounds.height) / 2)
    )
    window.show()
  })

  ipcMain.handle('external:open', async (_event, url: string) => {
    try {
      const parsed = new URL(url)
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        await shell.openExternal(parsed.toString())
      }
    } catch {
      // Ignore malformed URLs.
    }
  })
}

function emptySnapshot(): Snapshot {
  return {
    phase: 'Offline',
    lcuConnected: false,
    updatedAt: Date.now()
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.ryodan14.applol')

  const settings = await getSettings()
  activeSettings = settings
  applyLoginItemSettings(settings)

  if (!process.env['ELECTRON_RENDERER_URL']) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; img-src 'self' https://ddragon.leagueoflegends.com https://raw.communitydragon.org https://cdn.communitydragon.org data:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; script-src 'self'; connect-src 'self'"
          ]
        }
      })
    })
  }

  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false)
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  dataService = new StaticDataService()
  dataService.subscribe((result) => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send('static-data:updated', result)
    }
  })

  snapshotService = new SnapshotService()
  snapshotService.subscribe((snapshot) => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send('snapshot:updated', snapshot)
    }
    syncOverlayFromSnapshot(snapshot)

    const shouldShow = Boolean(
      snapshot.lcuConnected &&
        !lastLcuConnected &&
        activeSettings?.showWithLeague &&
        !overlayPreviewSnapshot
    )
    lastLcuConnected = snapshot.lcuConnected
    if (shouldShow) showMainWindow(false)
  })

  registerIpc()
  const startHidden =
    process.argv.includes('--hidden') &&
    !process.argv.some((arg) => arg.startsWith('--app-lol-screenshot='))
  const window = createMainWindow(settings.alwaysOnTop, startHidden)
  const windowSizeArg = process.argv.find((arg) => arg.startsWith('--app-lol-window='))
  if (windowSizeArg) {
    const match = windowSizeArg.slice('--app-lol-window='.length).match(/^(\d+)x(\d+)$/)
    if (match) window.setSize(Number(match[1]), Number(match[2]))
  }
  createOverlayWindow(settings.overlayScale, settings.overlayCorner)
  syncOverlayFromSnapshot(emptySnapshot())
  window.on('close', (event) => {
    if (!isQuitting && activeSettings?.startWithWindows) {
      event.preventDefault()
      window.hide()
    }
  })
  window.on('closed', () => closeOverlay())
  try {
    createAppTray(settings, {
      show: () => showMainWindow(),
      toggleOverlay: () => void toggleOverlay(),
      toggleStartWithWindows: () => void toggleSetting('startWithWindows'),
      toggleShowWithLeague: () => void toggleSetting('showWithLeague'),
      quit: () => {
        isQuitting = true
        app.quit()
      }
    })
  } catch (error) {
    console.error('[tray] No se pudo crear el icono de la bandeja', error)
    if (startHidden) showMainWindow()
  }
  snapshotService.start()

  const mainPreviewArg = process.argv.find((arg) => arg.startsWith('--app-lol-main-preview='))
  if (mainPreviewArg) {
    const mode = mainPreviewArg.endsWith('champ') ? 'champ' : 'live'
    const main = getMainWindow()
    const send = (): void => {
      setTimeout(() => {
        main?.webContents.send('snapshot:updated', createPreviewSnapshot(mode))
      }, 2200)
    }
    if (main?.webContents.isLoading()) main.webContents.once('did-finish-load', send)
    else send()
  }

  const overlayPreviewArg = process.argv.find((arg) => arg.startsWith('--app-lol-overlay-preview='))
  const overlayScreenshotArg = process.argv.find((arg) =>
    arg.startsWith('--app-lol-overlay-screenshot=')
  )
  const overlayDumpArg = process.argv.find((arg) => arg.startsWith('--app-lol-overlay-dump='))
  if (overlayPreviewArg) {
    const mode = overlayPreviewArg.endsWith('champ') ? 'champ' : 'live'
    overlayPreviewSnapshot = createPreviewSnapshot(mode)
    const overlay = getOverlayWindow()
    const activate = (): void => {
      setTimeout(async () => {
        const preview = overlayPreviewSnapshot as Snapshot
        overlay?.webContents.send('snapshot:updated', preview)
        syncOverlayFromSnapshot(preview)
        if (overlayDumpArg && overlay) {
          const dumpPath = overlayDumpArg.slice('--app-lol-overlay-dump='.length)
          const text = await overlay.webContents.executeJavaScript('document.body.innerText')
          await fs.writeFile(dumpPath, text)
        }
        if (!overlayScreenshotArg) return
        setTimeout(async () => {
          try {
            const image = await overlay?.webContents.capturePage()
            if (image) {
              const path = overlayScreenshotArg.slice('--app-lol-overlay-screenshot='.length)
              await fs.writeFile(path, image.toPNG())
              console.log(`[overlay] Captura guardada en ${path}`)
            }
          } catch (error) {
            console.error('[overlay] Error de captura', error)
          } finally {
            app.quit()
          }
        }, 4000)
      }, 3500)
    }
    if (overlay?.webContents.isLoading()) {
      overlay.webContents.once('did-finish-load', activate)
    } else {
      activate()
    }
  }

  const hotkey = globalShortcut.register('CommandOrControl+Shift+O', () => {
    void toggleOverlay()
  })
  if (!hotkey) console.warn('[overlay] No se pudo registrar Ctrl+Shift+O')

  const goldHotkey = globalShortcut.register('CommandOrControl+Shift+G', () => {
    getOverlayWindow()?.webContents.send('overlay:gold-toggle')
  })
  if (!goldHotkey) console.warn('[overlay] No se pudo registrar Ctrl+Shift+G')

  void dataService.init()

  const screenshotArg = process.argv.find((arg) => arg.startsWith('--app-lol-screenshot='))
  const screenshotPath =
    screenshotArg?.slice('--app-lol-screenshot='.length) ?? process.env['APP_LOL_SCREENSHOT']
  const routeArg = process.argv.find((arg) => arg.startsWith('--app-lol-route='))
  const screenshotRoute = routeArg?.slice('--app-lol-route='.length)
  const dumpArg = process.argv.find((arg) => arg.startsWith('--app-lol-dump='))
  const dumpPath = dumpArg?.slice('--app-lol-dump='.length)
  if (screenshotPath) {
    window.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        try {
          if (screenshotRoute) {
            await window.webContents.executeJavaScript(
              `window.location.hash = ${JSON.stringify(screenshotRoute)}`
            )
            await new Promise((resolve) => setTimeout(resolve, 900))
          }
          const hash = await window.webContents.executeJavaScript('window.location.hash')
          console.log(`[screenshot] URL: ${window.webContents.getURL()} hash: ${hash}`)
          if (dumpPath) {
            const bodyText = await window.webContents.executeJavaScript('document.body.innerText')
            await fs.writeFile(dumpPath, bodyText)
            console.log(`[screenshot] DOM guardado en ${dumpPath}`)
          }
          const image = await window.webContents.capturePage()
          await fs.writeFile(screenshotPath, image.toPNG())
          console.log(`[screenshot] Guardado en ${screenshotPath}`)
        } catch (error) {
          console.error('[screenshot] Error', error)
        } finally {
          app.quit()
        }
      }, 7000)
    })
  }
})

app.on('second-instance', () => {
  showMainWindow()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void getSettings().then((settings) => createMainWindow(settings.alwaysOnTop))
  }
})

app.on('before-quit', () => {
  isQuitting = true
  snapshotService?.stop()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  destroyAppTray()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
