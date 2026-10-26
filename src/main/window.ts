import { app, BrowserWindow, screen, shell, type Rectangle } from 'electron'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'

const DEFAULT_WIDTH = 1080
const DEFAULT_HEIGHT = 760
const MIN_WIDTH = 480
const MIN_HEIGHT = 540
const SAVE_DELAY_MS = 250

interface WindowState extends Rectangle {
  maximized?: boolean
}

let mainWindow: BrowserWindow | null = null

function statePath(): string {
  return join(app.getPath('userData'), 'window-state.json')
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isVisibleOnScreen(state: WindowState): boolean {
  return screen.getAllDisplays().some(({ workArea }) => {
    const horizontal =
      state.x + state.width > workArea.x + 64 &&
      state.x < workArea.x + workArea.width - 64
    const vertical =
      state.y + state.height > workArea.y + 48 &&
      state.y < workArea.y + workArea.height - 48
    return horizontal && vertical
  })
}

function loadWindowState(): WindowState {
  const fallback: WindowState = {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    x: 0,
    y: 0
  }

  try {
    const raw = JSON.parse(readFileSync(statePath(), 'utf8')) as Partial<WindowState>
    if (
      !isFiniteNumber(raw.width) ||
      !isFiniteNumber(raw.height) ||
      !isFiniteNumber(raw.x) ||
      !isFiniteNumber(raw.y)
    ) {
      return fallback
    }

    const state: WindowState = {
      width: raw.width,
      height: raw.height,
      x: raw.x,
      y: raw.y,
      maximized: Boolean(raw.maximized)
    }

    if (!isVisibleOnScreen(state)) {
      state.x = 0
      state.y = 0
    }

    const display = screen.getDisplayMatching(state)
    state.width = Math.max(MIN_WIDTH, Math.min(state.width, display.workArea.width))
    state.height = Math.max(MIN_HEIGHT, Math.min(state.height, display.workArea.height))
    return state
  } catch {
    return fallback
  }
}

function saveWindowState(window: BrowserWindow): void {
  if (window.isDestroyed()) return
  try {
    const bounds = window.getNormalBounds()
    const state: WindowState = {
      ...bounds,
      maximized: window.isMaximized()
    }
    writeFileSync(statePath(), JSON.stringify(state, null, 2), 'utf8')
  } catch (error) {
    console.error('[window] No se pudo guardar el tamaño de la ventana', error)
  }
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function createMainWindow(alwaysOnTop: boolean, startHidden = false): BrowserWindow {
  const state = loadWindowState()
  const hasSavedPosition = state.x !== 0 || state.y !== 0

  const window = new BrowserWindow({
    width: state.width,
    height: state.height,
    ...(hasSavedPosition ? { x: state.x, y: state.y } : { center: true }),
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#070b14',
    title: 'App-LOL',
    alwaysOnTop,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  })

  mainWindow = window

  if (state.maximized) window.maximize()

  let saveTimer: NodeJS.Timeout | null = null
  const scheduleSave = (): void => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveTimer = null
      saveWindowState(window)
    }, SAVE_DELAY_MS)
  }

  window.on('resize', scheduleSave)
  window.on('move', scheduleSave)
  window.on('close', () => {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    saveWindowState(window)
  })

  window.on('ready-to-show', () => {
    if (!startHidden) window.show()
  })

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  window.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}
