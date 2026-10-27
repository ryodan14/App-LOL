import { Crown, Flame, Shield } from 'lucide-react'
import type { LiveGameState } from '@shared/types'
import { computeObjectiveTimers, type ObjectiveTimer } from '@shared/analysis'
import { formatDuration } from '@renderer/lib/format'
import { cn } from '@renderer/lib/cn'
import { t } from '@shared/i18n'

function TimerIcon({ timer }: { timer: ObjectiveTimer }): React.JSX.Element {
  if (timer.kind === 'DRAGON') return <Flame className="h-3.5 w-3.5 text-orange-300" />
  if (timer.kind === 'BARON') return <Crown className="h-3.5 w-3.5 text-purple-300" />
  return <Shield className="h-3.5 w-3.5 text-teal-300" />
}

function timerValue(timer: ObjectiveTimer): string {
  if (timer.status === 'countdown') return formatDuration(timer.remaining)
  if (timer.status === 'active') return t('En juego')
  return t('Listo')
}

function TimerRow({
  timer,
  compact
}: {
  timer: ObjectiveTimer
  compact?: boolean
}): React.JSX.Element {
  const urgent = timer.status === 'countdown' && timer.remaining <= 60
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2',
        urgent
          ? 'border-gold-400/35 bg-gradient-to-r from-gold-400/[0.12] to-gold-400/[0.03] shadow-[0_0_18px_rgba(199,168,90,0.08)]'
          : timer.status === 'active'
            ? 'border-teal-400/20 bg-teal-400/[0.05]'
            : 'border-white/[0.055] bg-base-950/25'
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <TimerIcon timer={timer} />
        <span className={cn('truncate text-[0.68rem] font-medium', urgent ? 'text-ink-100' : 'text-ink-300')}>
          {compact ? timer.shortLabel : timer.label}
        </span>
      </span>
      <span
        className={cn(
          'shrink-0 font-mono text-[0.72rem] font-bold tabular-nums',
          timer.status === 'countdown'
            ? urgent
              ? 'text-gold-200'
              : 'text-ink-100'
            : timer.status === 'active'
              ? 'text-teal-300'
              : 'text-ink-500'
        )}
      >
        {timerValue(timer)}
      </span>
    </div>
  )
}

export function ObjectiveTimerList({
  live,
  gameTime = live.gameTime,
  compact = false
}: {
  live: LiveGameState
  gameTime?: number
  compact?: boolean
}): React.JSX.Element {
  const timers = computeObjectiveTimers(live, gameTime)
  const primary = timers.filter((timer) => timer.kind !== 'INHIBITOR')
  const inhibitors = timers.filter((timer) => timer.kind === 'INHIBITOR')

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {primary.map((timer) => (
          <TimerRow key={timer.id} timer={timer} compact={compact} />
        ))}
      </div>
      {inhibitors.length > 0 && (
        <div className="space-y-2">
          {inhibitors.slice(0, 3).map((timer) => (
            <TimerRow key={timer.id} timer={timer} compact={compact} />
          ))}
        </div>
      )}
    </div>
  )
}
