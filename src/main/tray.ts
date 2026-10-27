import { app, Menu, nativeImage, Tray } from 'electron'
import { join } from 'node:path'
import { t } from '@shared/i18n'
import type { AppSettings } from '@shared/types'

interface TrayActions {
  show: () => void
  toggleOverlay: () => void
  toggleStartWithWindows: () => void
  toggleShowWithLeague: () => void
  quit: () => void
}

let appTray: Tray | null = null
let trayActions: TrayActions | null = null

function iconPath(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'icon.png')
    : join(app.getAppPath(), 'build/icon.png')
}

export function createAppTray(settings: AppSettings, actions: TrayActions): void {
  if (appTray && !appTray.isDestroyed()) return

  const image = nativeImage.createFromPath(iconPath()).resize({ width: 16, height: 16 })
  appTray = new Tray(image)
  trayActions = actions
  appTray.setToolTip('App-LOL')
  appTray.on('click', () => actions.show())
  appTray.on('double-click', () => actions.show())
  updateAppTray(settings)
}

export function updateAppTray(settings: AppSettings): void {
  if (!appTray || !trayActions) return
  const actions = trayActions
  const menu = Menu.buildFromTemplate([
    { label: t('Abrir App-LOL'), click: actions.show },
    { type: 'separator' },
    {
      label: t('Overlay de partida'),
      type: 'checkbox',
      checked: settings.overlayEnabled,
      click: actions.toggleOverlay
    },
    {
      label: t('Iniciar con Windows'),
      type: 'checkbox',
      checked: settings.startWithWindows,
      click: actions.toggleStartWithWindows
    },
    {
      label: t('Mostrar al abrir League'),
      type: 'checkbox',
      checked: settings.showWithLeague,
      click: actions.toggleShowWithLeague
    },
    { type: 'separator' },
    { label: t('Salir'), click: actions.quit }
  ])
  appTray.setContextMenu(menu)
}

export function destroyAppTray(): void {
  if (appTray && !appTray.isDestroyed()) appTray.destroy()
  appTray = null
  trayActions = null
}
