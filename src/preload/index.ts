import { contextBridge, ipcRenderer } from 'electron'
import type { AppApi, AppSettings, DataResult, Snapshot, UpdateState } from '@shared/types'

const api: AppApi = {
  app: {
    version: () => ipcRenderer.invoke('app:version'),
    platform: process.platform
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (patch: Partial<AppSettings>) => ipcRenderer.invoke('settings:update', patch),
    onUpdate: (callback: (settings: AppSettings) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, settings: AppSettings): void =>
        callback(settings)
      ipcRenderer.on('settings:updated', listener)
      return () => ipcRenderer.removeListener('settings:updated', listener)
    }
  },
  staticData: {
    get: () => ipcRenderer.invoke('static-data:get'),
    refresh: () => ipcRenderer.invoke('static-data:refresh'),
    onUpdate: (callback: (result: DataResult) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, result: DataResult): void =>
        callback(result)
      ipcRenderer.on('static-data:updated', listener)
      return () => ipcRenderer.removeListener('static-data:updated', listener)
    }
  },
  snapshot: {
    get: () => ipcRenderer.invoke('snapshot:get'),
    refresh: () => ipcRenderer.invoke('snapshot:refresh'),
    reconnect: () => ipcRenderer.invoke('snapshot:reconnect'),
    onUpdate: (callback: (snapshot: Snapshot) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, snapshot: Snapshot): void =>
        callback(snapshot)
      ipcRenderer.on('snapshot:updated', listener)
      return () => ipcRenderer.removeListener('snapshot:updated', listener)
    }
  },
  account: {
    get: () => ipcRenderer.invoke('account:get')
  },
  updates: {
    get: () => ipcRenderer.invoke('updates:get'),
    check: () => ipcRenderer.invoke('updates:check'),
    restart: () => ipcRenderer.invoke('updates:restart'),
    onUpdate: (callback: (state: UpdateState) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, state: UpdateState): void =>
        callback(state)
      ipcRenderer.on('updates:updated', listener)
      return () => ipcRenderer.removeListener('updates:updated', listener)
    }
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    toggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
    close: () => ipcRenderer.send('window:close'),
    setAlwaysOnTop: (value: boolean) => ipcRenderer.invoke('window:set-always-on-top', value),
    moveToSecondary: () => ipcRenderer.send('window:move-to-secondary')
  },
  overlay: {
    onGoldToggle: (callback: () => void) => {
      const listener = (): void => callback()
      ipcRenderer.on('overlay:gold-toggle', listener)
      return () => ipcRenderer.removeListener('overlay:gold-toggle', listener)
    }
  },
  external: {
    open: (url: string) => ipcRenderer.invoke('external:open', url)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error Fallback for non-isolated contexts.
  window.api = api
}
