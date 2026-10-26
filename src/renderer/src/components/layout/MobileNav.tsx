import { NavLink } from 'react-router-dom'
import { cn } from '@renderer/lib/cn'
import { navigation } from './navigation'

export function MobileNav(): React.JSX.Element {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-base-950/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label="Navegación principal"
    >
      {navigation.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[0.56rem] font-semibold transition-colors',
              isActive ? 'text-gold-200' : 'text-ink-500 hover:text-ink-200'
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'flex h-7 w-9 items-center justify-center rounded-lg transition-colors',
                  isActive && 'bg-gold-400/12 text-gold-300'
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <span className="w-full truncate text-center">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
