import { cn } from '@renderer/lib/cn'

export function StatBar({
  label,
  value,
  max = 10,
  tone = 'gold'
}: {
  label: string
  value: number
  max?: number
  tone?: 'gold' | 'teal' | 'danger'
}): React.JSX.Element {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))
  const barTone = {
    gold: 'from-gold-600 to-gold-300',
    teal: 'from-teal-500 to-teal-300',
    danger: 'from-danger-500 to-danger-400'
  }[tone]
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[0.72rem]">
        <span className="font-medium text-ink-300">{label}</span>
        <span className="tabular-nums text-ink-400">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-base-700/80">
        <div
          className={cn('h-full rounded-full bg-gradient-to-r', barTone)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
