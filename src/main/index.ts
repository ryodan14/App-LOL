import { app, BrowserWindow, ipcMain, session, shell } from 'electron'
import { promises as fs } from 'node:fs'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { getSettings, updateSettings } from './services/settings'
import { SnapshotService } from './services/snapshot'
import { StaticDataService } from './services/staticData'
import { createMainWindow, getMainWindow } from './window'
import type { AppSettings, DataResult, Snapshot } from '@shared/types'

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

let dataService: StaticDataService | null = null
let snapshotService: SnapshotService | null = null

function registerIpc(): void {
  ipcMain.handle('app:version', () => app.getVersion())

  ipcMain.handle('settings:get', () => getSettings())
  ipcMain.handle('settings:update', async (_event, patch: Partial<AppSettings>) => {
    const settings = await updateSettings(patch)
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
  })
  snapshotService.start()

  registerIpc()
  const window = createMainWindow(settings.alwaysOnTop)
  void dataService.init()

  const screenshotArg = process.argv.find((arg) => arg.startsWith('--app-lol-screenshot='))
  const screenshotPath =
    screenshotArg?.slice('--app-lol-screenshot='.length) ?? process.env['APP_LOL_SCREENSHOT']
  if (screenshotPath) {
    window.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        try {
          const hash = await window.webContents.executeJavaScript('window.location.hash')
          console.log(`[screenshot] URL: ${window.webContents.getURL()} hash: ${hash}`)
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
