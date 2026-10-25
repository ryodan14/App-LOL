import { useState } from 'react'
import type { Item } from '@shared/types'
import { itemIconUrl } from '@renderer/lib/icons'
import { cn } from '@renderer/lib/cn'
import { useGameData } from '@renderer/lib/gameData'

export function ItemIcon({
  item,
  size = 'md',
  className
}: {
  item: Item | null | undefined
  size?: 'sm' | 'md' | 'lg'
  className?: string
}): React.JSX.Element {
  const index = useGameData()
  const [failed, setFailed] = useState(false)
  const patch = index?.data.patch ?? ''
  const src = item && patch && !failed ? itemIconUrl(item.image, patch) : ''
  const dimensions = {
    sm: 'h-8 w-8 rounded-lg',
    md: 'h-11 w-11 rounded-xl',
    lg: 'h-14 w-14 rounded-xl'
  }[size]

  return (
    <span
      title={item?.name ?? 'Objeto'}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden border border-line bg-base-800',
        dimensions,
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={item?.name ?? 'Objeto'}
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-[0.6rem] text-ink-500">?</span>
      )}
    </span>
  )
}
