import { Crown, Flame, Shield } from 'lucide-react'
import type { LiveGameState } from '@shared/types'
import { computeObjectiveTimers, type ObjectiveTimer } from '@shared/analysis'
import { formatDuration } from '@renderer/lib/format'
import { cn } from '@renderer/lib/cn'

function TimerIcon({ timer }: { timer: ObjectiveTimer }): React.JSX.Element {
  if (timer.kind === 'DRAGON') return <Flame className="h-3.5 w-3.5 text-orange-300" />
  if (timer.kind === 'BARON') return <Crown className="h-3.5 w-3.5 text-purple-300" />
  return <Shield className="h-3.5 w-3.5 text-teal-300" />
}

function timerValue(timer: ObjectiveTimer): string {
  if (timer.status === 'countdown') return formatDuration(timer.remaining)
  if (timer.status === 'active') return 'En juego'
  return 'Listo'
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
        'flex items-center justify-between gap-2 rounded-lg border border-line/70 bg-base-950/25 px-2 py-1.5',
        urgent && 'border-gold-400/25 bg-gold-400/[0.05]'
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <TimerIcon timer={timer} />
        <span className="truncate text-[0.63rem] font-medium text-ink-300">
          {compact ? timer.shortLabel : timer.label}
        </span>
      </span>
      <span
        className={cn(
          'shrink-0 font-mono text-[0.68rem] font-bold tabular-nums',
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
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        {primary.map((timer) => (
          <TimerRow key={timer.id} timer={timer} compact={compact} />
        ))}
      </div>
      {inhibitors.length > 0 && (
        <div className="space-y-1.5">
          {inhibitors.slice(0, 3).map((timer) => (
            <TimerRow key={timer.id} timer={timer} compact={compact} />
          ))}
        </div>
      )}
    </div>
  )
}
