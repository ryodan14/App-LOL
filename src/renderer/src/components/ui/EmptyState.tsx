import type { ReactNode } from 'react'
import { cn } from '@renderer/lib/cn'

export function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-base-800/70 text-gold-300 shadow-[0_0_40px_-12px_rgba(212,184,122,0.35)]">
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold text-ink-100">{title}</h3>
      <p className="mt-1.5 max-w-md text-[0.84rem] leading-relaxed text-ink-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Spinner({ className }: { className?: string }): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-gold-400/25 border-t-gold-300',
        className
      )}
      aria-label="Cargando"
    />
  )
}
