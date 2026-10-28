import { lazy, useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Swords } from 'lucide-react'
import { useAppStore } from '@renderer/store/useAppStore'
import { GameDataProvider } from '@renderer/lib/gameData'
import { AppShell } from '@renderer/components/layout/AppShell'
import { Button } from '@renderer/components/ui/Button'
import { t } from '@shared/i18n'

const HomePage = lazy(() =>
  import('@renderer/pages/HomePage').then((module) => ({ default: module.HomePage }))
)
const LivePage = lazy(() =>
  import('@renderer/pages/LivePage').then((module) => ({ default: module.LivePage }))
)
const ChampionsPage = lazy(() =>
  import('@renderer/pages/ChampionsPage').then((module) => ({ default: module.ChampionsPage }))
)
const ItemsPage = lazy(() =>
  import('@renderer/pages/ItemsPage').then((module) => ({ default: module.ItemsPage }))
)
const ChampionDetailPage = lazy(() =>
  import('@renderer/pages/ChampionDetailPage').then((module) => ({
    default: module.ChampionDetailPage
  }))
)
const AccountPage = lazy(() =>
  import('@renderer/pages/AccountPage').then((module) => ({ default: module.AccountPage }))
)
const SettingsPage = lazy(() =>
  import('@renderer/pages/SettingsPage').then((module) => ({ default: module.SettingsPage }))
)
const NotFoundPage = lazy(() =>
  import('@renderer/pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage }))
)

function BootScreen({ error }: { error?: string | null }): React.JSX.Element {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="animate-fade-up flex max-w-md flex-col items-center text-center">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-gold-400/30 bg-gradient-to-br from-gold-400/20 via-base-800 to-teal-500/10 shadow-[0_0_50px_-10px_rgba(212,184,122,0.55)]">
          <Swords className="h-7 w-7 text-gold-300" strokeWidth={1.6} />
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse-soft rounded-full bg-teal-400" />
        </div>
        <h1 className="font-display mt-5 text-2xl font-semibold tracking-wide text-ink-100">APP-LOL</h1>
        {error ? (
          <>
            <p className="mt-2 text-sm text-danger-400">{error}</p>
            <Button
              variant="primary"
              className="mt-5"
              onClick={() => window.location.reload()}
            >
              {t('Reintentar')}
            </Button>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink-400">{t('Cargando datos oficiales de Riot…')}</p>
            <div className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-base-700">
              <div className="h-full w-1/2 animate-[shimmer_1.2s_infinite] rounded-full bg-gradient-to-r from-gold-600 to-gold-300" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function App(): React.JSX.Element {
  const initialize = useAppStore((state) => state.initialize)
  const initialized = useAppStore((state) => state.initialized)
  const initError = useAppStore((state) => state.initError)
  const language = useAppStore((state) => state.settings.language)

  useEffect(() => {
    void initialize()
  }, [initialize])

  if (!initialized) return <BootScreen />
  if (initError) return <BootScreen error={initError} />

  return (
    <GameDataProvider key={language}>
      <HashRouter key={language}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="partida" element={<LivePage />} />
            <Route path="campeones" element={<ChampionsPage />} />
            <Route path="campeones/:id" element={<ChampionDetailPage />} />
            <Route path="objetos" element={<ItemsPage />} />
            <Route path="cuenta" element={<AccountPage />} />
            <Route path="ajustes" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </GameDataProvider>
  )
}
