import { create } from 'zustand'
import { DEFAULT_SETTINGS } from '@shared/constants'
import type { AppSettings, DataResult, Snapshot } from '@shared/types'

interface AppState {
  initialized: boolean
  initError: string | null
  version: string
  settings: AppSettings
  data: DataResult
  snapshot: Snapshot
  initialize: () => Promise<void>
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>
  refreshData: () => Promise<void>
  refreshSnapshot: () => Promise<void>
  reconnect: () => Promise<void>
}

const offlineSnapshot: Snapshot = {
  phase: 'Offline',
  lcuConnected: false,
  updatedAt: Date.now()
}

function applyVisualSettings(settings: AppSettings): void {
  document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion)
}

let initPromise: Promise<void> | null = null
let disposeListeners: (() => void) | null = null

export const useAppStore = create<AppState>((set, get) => ({
  initialized: false,
  initError: null,
  version: '',
  settings: { ...DEFAULT_SETTINGS },
  data: { data: null, status: 'loading' },
  snapshot: offlineSnapshot,

  initialize: () => {
    if (initPromise) return initPromise
    initPromise = (async () => {
      try {
        if (!window.api) {
          throw new Error('El puente con Electron no está disponible.')
        }
        const [settings, data, snapshot, version] = await Promise.all([
          window.api.settings.get(),
          window.api.staticData.get(),
          window.api.snapshot.get(),
          window.api.app.version()
        ])
        applyVisualSettings(settings)
        set({ settings, data, snapshot, version, initialized: true, initError: null })

        const disposeData = window.api.staticData.onUpdate((result) => {
          set({ data: result })
        })
        const disposeSnapshot = window.api.snapshot.onUpdate((next) => {
          set({ snapshot: next })
        })
        disposeListeners = () => {
          disposeData()
          disposeSnapshot()
        }

        if (data.status !== 'ready') {
          void get().refreshData()
        }
      } catch (error) {
        set({
          initialized: true,
          initError: error instanceof Error ? error.message : 'Error desconocido al iniciar'
        })
      }
    })()
    return initPromise
  },

  updateSettings: async (patch) => {
    const previous = get().settings
    set({ settings: { ...previous, ...patch } })
    try {
      const settings = await window.api.settings.update(patch)
      applyVisualSettings(settings)
      set({ settings })
    } catch (error) {
      set({ settings: previous })
      throw error
    }
  },

  refreshData: async () => {
    set((state) => ({ data: { ...state.data, status: 'loading' } }))
    try {
      const data = await window.api.staticData.refresh()
      set({ data })
    } catch (error) {
      set({
        data: {
          data: get().data.data,
          status: 'error',
          error: error instanceof Error ? error.message : 'No se pudieron cargar los datos'
        }
      })
    }
  },

  refreshSnapshot: async () => {
    try {
      const snapshot = await window.api.snapshot.refresh()
      set({ snapshot })
    } catch (error) {
      console.error('[snapshot] Error al actualizar', error)
    }
  },

  reconnect: async () => {
    try {
      const snapshot = await window.api.snapshot.reconnect()
      set({ snapshot })
    } catch (error) {
      console.error('[snapshot] Error al reconectar', error)
    }
  }
}))

export function disposeAppListeners(): void {
  disposeListeners?.()
  disposeListeners = null
}
