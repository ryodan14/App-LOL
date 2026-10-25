import type { ReactNode } from 'react'
import { cn } from '@renderer/lib/cn'

type Tone = 'neutral' | 'gold' | 'teal' | 'danger' | 'ok'

const toneClass: Record<Tone, string> = {
  neutral: '',
  gold: 'chip-gold',
  teal: 'chip-teal',
  danger: 'chip-danger',
  ok: 'border-ok-400/25 bg-ok-400/10 text-ok-400'
}

export function Badge({
  tone = 'neutral',
  className,
  children
}: {
  tone?: Tone
  className?: string
  children: ReactNode
}): React.JSX.Element {
  return <span className={cn('chip', toneClass[tone], className)}>{children}</span>
}

export function StatusDot({
  tone = 'idle',
  pulse = false
}: {
  tone?: 'online' | 'idle' | 'busy' | 'error'
  pulse?: boolean
}): React.JSX.Element {
  const colors: Record<typeof tone, string> = {
    online: 'bg-ok-400',
    idle: 'bg-ink-500',
    busy: 'bg-gold-400',
    error: 'bg-danger-400'
  }
  return (
    <span className="relative flex h-2 w-2">
      {pulse && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-50',
            colors[tone]
          )}
        />
      )}
      <span className={cn('relative inline-flex h-2 w-2 rounded-full', colors[tone])} />
    </span>
  )
}
