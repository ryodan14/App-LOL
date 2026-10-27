import { useState } from 'react'
import type { Champion } from '@shared/types'
import { championIconUrl } from '@renderer/lib/icons'
import { cn } from '@renderer/lib/cn'
import { useGameData } from '@renderer/lib/gameData'
import { t } from '@shared/i18n'

const sizeMap = {
  xs: 'h-7 w-7 rounded-md',
  sm: 'h-9 w-9 rounded-lg',
  md: 'h-12 w-12 rounded-xl',
  lg: 'h-16 w-16 rounded-2xl',
  xl: 'h-20 w-20 rounded-2xl'
} as const

export function ChampionIcon({
  champion,
  size = 'md',
  className,
  ring = true
}: {
  champion: Champion | null | undefined
  size?: keyof typeof sizeMap
  className?: string
  ring?: boolean
}): React.JSX.Element {
  const index = useGameData()
  const [failed, setFailed] = useState(false)
  const patch = index?.data.patch ?? ''
  const src = champion && patch && !failed ? championIconUrl(champion.image, patch) : ''

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden border bg-base-800',
        ring ? 'border-line-strong' : 'border-transparent',
        sizeMap[size],
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={champion?.name ?? t('Campeón')}
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="font-display text-xs font-bold text-gold-300/70">
          {champion?.name?.slice(0, 1) ?? '?'}
        </span>
      )}
    </span>
  )
}
