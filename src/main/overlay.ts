import { BrowserWindow, screen, shell } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import type { AppSettings, Snapshot } from '@shared/types'

const OVERLAY_WIDTH = 416
const OVERLAY_HEIGHT = 632
const OVERLAY_MARGIN = 16

let overlayWindow: BrowserWindow | null = null

export function getOverlayWindow(): BrowserWindow | null {
  return overlayWindow
}

function overlayBounds(): { x: number; y: number; width: number; height: number } {
  const { workArea } = screen.getPrimaryDisplay()
  return {
    width: OVERLAY_WIDTH,
    height: Math.min(OVERLAY_HEIGHT, workArea.height - OVERLAY_MARGIN * 2),
    x: workArea.x + workArea.width - OVERLAY_WIDTH - OVERLAY_MARGIN,
    y: workArea.y + OVERLAY_MARGIN
  }
}

export function createOverlayWindow(): BrowserWindow {
  if (overlayWindow && !overlayWindow.isDestroyed()) return overlayWindow

  const bounds = overlayBounds()
  const window = new BrowserWindow({
    ...bounds,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    show: false,
    focusable: false,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    hasShadow: false,
    alwaysOnTop: true,
    roundedCorners: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  })

  overlayWindow = window
  window.setIgnoreMouseEvents(true, { forward: true })
  window.setAlwaysOnTop(true, 'screen-saver')
  try {
    window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  } catch {
    // Not supported on every platform.
  }

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })
  window.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })

  window.on('closed', () => {
    overlayWindow = null
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const url = new URL(process.env['ELECTRON_RENDERER_URL'])
    url.searchParams.set('overlay', '1')
    void window.loadURL(url.toString())
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'), { query: { overlay: '1' } })
  }

  return window
}

export function closeOverlay(): void {
  if (!overlayWindow || overlayWindow.isDestroyed()) return
  overlayWindow.destroy()
  overlayWindow = null
}

export function hideOverlay(): void {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.hide()
  }
}

export function showOverlay(): void {
  if (!overlayWindow || overlayWindow.isDestroyed()) return
  overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  if (!overlayWindow.isVisible()) overlayWindow.showInactive()
}

export function syncOverlay(snapshot: Snapshot, settings: AppSettings): void {
  const visible =
    settings.overlayEnabled &&
    (snapshot.phase === 'ChampSelect' ||
      snapshot.phase === 'InProgress' ||
      snapshot.phase === 'Reconnect')

  if (visible) showOverlay()
  else hideOverlay()
}
