import { NavLink } from 'react-router-dom'
import { Home, Settings, Swords, UserRound, UsersRound } from 'lucide-react'
import { cn } from '@renderer/lib/cn'
import { useGameData } from '@renderer/lib/gameData'
import { useAppStore } from '@renderer/store/useAppStore'

const navigation = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/partida', label: 'Partida', icon: Swords, end: false },
  { to: '/campeones', label: 'Campeones', icon: UsersRound, end: false },
  { to: '/cuenta', label: 'Mi cuenta', icon: UserRound, end: false },
  { to: '/ajustes', label: 'Ajustes', icon: Settings, end: false }
]

export function Sidebar(): React.JSX.Element {
  const index = useGameData()
  const data = useAppStore((state) => state.data)

  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-r border-line bg-base-950/55 px-4 py-5 backdrop-blur-xl max-[1180px]:w-[84px] max-[1180px]:px-3">
      <NavLink to="/" className="mb-7 flex items-center gap-3 px-2 max-[1180px]:justify-center max-[1180px]:px-0">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold-400/30 bg-gradient-to-br from-gold-400/20 via-base-800 to-teal-500/10 shadow-[0_0_30px_-8px_rgba(212,184,122,0.45)]">
          <Swords className="h-5 w-5 text-gold-300" strokeWidth={1.7} />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(67,224,192,0.8)]" />
        </span>
        <span className="min-w-0 max-[1180px]:hidden">
          <span className="font-display block text-[1.02rem] font-bold tracking-[0.08em] text-ink-100">
            APP-LOL
          </span>
          <span className="block text-[0.65rem] font-medium tracking-wide text-ink-500">
            Compañero de partida
          </span>
        </span>
      </NavLink>

      <nav className="flex flex-col gap-1" aria-label="Navegación principal">
        {navigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn('nav-item max-[1180px]:justify-center max-[1180px]:px-0', isActive && 'nav-item-active')
            }
            title={label}
          >
            <Icon className="h-[1.15rem] w-[1.15rem] shrink-0" strokeWidth={1.8} />
            <span className="max-[1180px]:hidden">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-xl border border-line bg-base-900/60 p-3 max-[1180px]:hidden">
          <div className="flex items-center justify-between">
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-500">
              Parche
            </span>
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                data.status === 'ready' ? 'bg-ok-400' : data.status === 'error' ? 'bg-danger-400' : 'bg-gold-400'
              )}
            />
          </div>
          <p className="font-display mt-1 text-sm font-semibold text-ink-200">
            {index?.data.patch ?? 'Cargando…'}
          </p>
          <p className="mt-0.5 text-[0.65rem] leading-relaxed text-ink-500">
            Datos oficiales de Riot
          </p>
        </div>
        <p className="px-2 text-[0.6rem] leading-relaxed text-ink-600 max-[1180px]:hidden">
          Proyecto no oficial. No está afiliado ni respaldado por Riot Games.
        </p>
      </div>
    </aside>
  )
}
