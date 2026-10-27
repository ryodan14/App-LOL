import { threatLabel, type Threat, type ThreatTag } from '@shared/analysis'
import { cn } from '@renderer/lib/cn'

export function ThreatChip({
  tag,
  severity = 2,
  reason,
  className
}: {
  tag: ThreatTag
  severity?: 1 | 2 | 3
  reason?: string
  className?: string
}): React.JSX.Element {
  const tone =
    severity >= 3
      ? 'border-danger-500/30 bg-danger-500/10 text-danger-400'
      : severity === 2
        ? 'border-gold-400/25 bg-gold-400/8 text-gold-300'
        : 'border-line bg-base-800/70 text-ink-400'

  return (
    <span
      title={reason}
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold',
        tone,
        className
      )}
    >
      {threatLabel(tag)}
    </span>
  )
}

export function ThreatList({
  threats,
  limit
}: {
  threats: Threat[]
  limit?: number
}): React.JSX.Element {
  const visible = typeof limit === 'number' ? threats.slice(0, limit) : threats
  const hidden = threats.length - visible.length

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((threat) => (
        <ThreatChip
          key={threat.tag}
          tag={threat.tag}
          severity={threat.severity}
          reason={threat.reason}
        />
      ))}
      {hidden > 0 && (
        <span className="inline-flex items-center rounded-full border border-line px-2 py-0.5 text-[0.65rem] text-ink-500">
          +{hidden}
        </span>
      )}
    </div>
  )
}
