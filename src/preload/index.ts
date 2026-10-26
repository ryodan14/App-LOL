import { contextBridge, ipcRenderer } from 'electron'
import type { AppApi, AppSettings, DataResult, Snapshot } from '@shared/types'

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
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    toggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
    close: () => ipcRenderer.send('window:close'),
    setAlwaysOnTop: (value: boolean) => ipcRenderer.invoke('window:set-always-on-top', value)
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
