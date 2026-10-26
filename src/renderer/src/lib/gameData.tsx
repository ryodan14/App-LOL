import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { Champion, StaticData } from '@shared/types'
import { createAnalysisIndex, type AnalysisIndex } from '@shared/analysis'
import { useAppStore } from '@renderer/store/useAppStore'

export interface GameDataIndex extends AnalysisIndex {
  champions: Champion[]
}

const GameDataContext = createContext<GameDataIndex | null>(null)

export function buildGameDataIndex(data: StaticData): GameDataIndex {
  const index = createAnalysisIndex(data)
  return {
    ...index,
    champions: [...data.champions].sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }
}

export function GameDataProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const data = useAppStore((state) => state.data.data)
  const index = useMemo(() => (data ? buildGameDataIndex(data) : null), [data])

  if (!index) {
    return <>{children}</>
  }

  return <GameDataContext.Provider value={index}>{children}</GameDataContext.Provider>
}

export function useGameData(): GameDataIndex | null {
  return useContext(GameDataContext)
}

export function useGameDataRequired(): GameDataIndex {
  const value = useContext(GameDataContext)
  if (!value) {
    throw new Error('GameDataProvider no está disponible todavía')
  }
  return value
}
