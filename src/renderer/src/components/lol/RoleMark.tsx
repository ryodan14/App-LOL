import { Crosshair, HeartHandshake, Sparkles, Swords, Trees, CircleHelp } from 'lucide-react'
import type { Role } from '@shared/types'
import { roleLabel } from '@shared/constants'
import { cn } from '@renderer/lib/cn'

const roleIcon: Record<Role, typeof Swords> = {
  TOP: Swords,
  JUNGLE: Trees,
  MIDDLE: Sparkles,
  BOTTOM: Crosshair,
  UTILITY: HeartHandshake,
  UNKNOWN: CircleHelp
}

export function RoleMark({
  role,
  showLabel = false,
  className
}: {
  role: Role
  showLabel?: boolean
  className?: string
}): React.JSX.Element {
  const Icon = roleIcon[role]
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-ink-400', className)}
      title={roleLabel(role)}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
      {showLabel && <span className="text-[0.72rem] font-medium">{roleLabel(role)}</span>}
    </span>
  )
}

