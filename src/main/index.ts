import { app, BrowserWindow, globalShortcut, ipcMain, session, shell } from 'electron'
import { promises as fs } from 'node:fs'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { getSettings, updateSettings } from './services/settings'
import { SnapshotService } from './services/snapshot'
import { StaticDataService } from './services/staticData'
import { createMainWindow, getMainWindow } from './window'
import { closeOverlay, createOverlayWindow, getOverlayWindow, syncOverlay } from './overlay'
import { createPreviewSnapshot } from './preview'
import type { AppSettings, DataResult, Snapshot } from '@shared/types'

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

let dataService: StaticDataService | null = null
let snapshotService: SnapshotService | null = null
let activeSettings: AppSettings | null = null
let overlayPreviewSnapshot: Snapshot | null = null

function broadcastSettings(settings: AppSettings): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('settings:updated', settings)
  }
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
  activeSettings = next
  broadcastSettings(next)
  syncOverlayFromSnapshot(snapshotService?.get() ?? emptySnapshot())
}

function registerIpc(): void {
  ipcMain.handle('app:version', () => app.getVersion())

  ipcMain.handle('settings:get', () => getSettings())
  ipcMain.handle('settings:update', async (_event, patch: Partial<AppSettings>) => {
    const settings = await updateSettings(patch)
    activeSettings = settings
    broadcastSettings(settings)
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
  ipcMain.handle('account:get', async () => snapshotService?.getAccount() ?? null)

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
  })
  snapshotService.start()

  registerIpc()
  const window = createMainWindow(settings.alwaysOnTop)
  createOverlayWindow()
  syncOverlayFromSnapshot(emptySnapshot())
  window.on('closed', () => closeOverlay())

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
  const window = getMainWindow()
  if (!window) return
  if (window.isMinimized()) window.restore()
  window.focus()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void getSettings().then((settings) => createMainWindow(settings.alwaysOnTop))
  }
})

app.on('before-quit', () => {
  snapshotService?.stop()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
