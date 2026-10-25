import { app, BrowserWindow, ipcMain, session, shell } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { getSettings, updateSettings } from './services/settings'
import { createMainWindow, getMainWindow } from './window'
import type { AppSettings, DataResult, Snapshot } from '@shared/types'

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

function registerIpc(): void {
  ipcMain.handle('app:version', () => app.getVersion())

  ipcMain.handle('settings:get', () => getSettings())
  ipcMain.handle('settings:update', async (_event, patch: Partial<AppSettings>) => {
    const settings = await updateSettings(patch)
    if (typeof patch.alwaysOnTop === 'boolean') {
      getMainWindow()?.setAlwaysOnTop(settings.alwaysOnTop)
    }
    return settings
  })

  ipcMain.handle('static-data:get', (): DataResult => ({ data: null, status: 'loading' }))
  ipcMain.handle('static-data:refresh', (): DataResult => ({ data: null, status: 'loading' }))
  ipcMain.handle('snapshot:get', (): Snapshot => emptySnapshot())
  ipcMain.handle('snapshot:refresh', (): Snapshot => emptySnapshot())
  ipcMain.handle('snapshot:reconnect', (): Snapshot => emptySnapshot())
  ipcMain.handle('account:get', () => null)

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

  registerIpc()
  createMainWindow(settings.alwaysOnTop)
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
