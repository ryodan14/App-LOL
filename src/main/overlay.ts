import { BrowserWindow, screen, shell } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import { DEFAULT_OVERLAY_SCALE } from '@shared/constants'
import type { AppSettings, Snapshot } from '@shared/types'

const OVERLAY_WIDTH = 416
const OVERLAY_HEIGHT = 632
const OVERLAY_MARGIN = 16

let overlayWindow: BrowserWindow | null = null

export function getOverlayWindow(): BrowserWindow | null {
  return overlayWindow
}

function overlayBounds(scale: number): { x: number; y: number; width: number; height: number } {
  const { workArea } = screen.getPrimaryDisplay()
  const margin = Math.round(OVERLAY_MARGIN * scale)
  const width = Math.round(OVERLAY_WIDTH * scale)
  const height = Math.round(OVERLAY_HEIGHT * scale)
  return {
    width,
    height: Math.min(height, workArea.height - margin * 2),
    x: workArea.x + workArea.width - width - margin,
    y: workArea.y + margin
  }
}

export function setOverlayScale(scale: number): void {
  if (!overlayWindow || overlayWindow.isDestroyed()) return
  const safeScale = Number.isFinite(scale) ? Math.min(1, Math.max(0.6, scale)) : DEFAULT_OVERLAY_SCALE
  overlayWindow.webContents.setZoomFactor(safeScale)
  overlayWindow.setBounds(overlayBounds(safeScale))
}

export function createOverlayWindow(scale = DEFAULT_OVERLAY_SCALE): BrowserWindow {
  if (overlayWindow && !overlayWindow.isDestroyed()) return overlayWindow

  const safeScale = Number.isFinite(scale) ? Math.min(1, Math.max(0.6, scale)) : DEFAULT_OVERLAY_SCALE
  const bounds = overlayBounds(safeScale)
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
      spellcheck: false,
      zoomFactor: safeScale
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
