import { useState } from 'react'
import { passiveIconUrl, spellIconUrl } from '@renderer/lib/icons'
import { cn } from '@renderer/lib/cn'
import { useGameData } from '@renderer/lib/gameData'

export function SpellIcon({
  image,
  name,
  size = 'md',
  className
}: {
  image: string
  name: string
  size?: 'sm' | 'md'
  className?: string
}): React.JSX.Element {
  const index = useGameData()
  const [failed, setFailed] = useState(false)
  const patch = index?.data.patch ?? ''
  const src = patch && !failed ? spellIconUrl(image, patch) : ''
  const dimensions = size === 'sm' ? 'h-7 w-7 rounded-md' : 'h-9 w-9 rounded-lg'
  return (
    <span
      title={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden border border-line bg-base-800',
        dimensions,
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-[0.5rem] text-ink-500">?</span>
      )}
    </span>
  )
}


export function PassiveIcon({
  image,
  name,
  className
}: {
  image: string
  name: string
  className?: string
}): React.JSX.Element {
  const index = useGameData()
  const [failed, setFailed] = useState(false)
  const patch = index?.data.patch ?? ''
  const src = patch && !failed ? passiveIconUrl(image, patch) : ''
  return (
    <span
      title={name}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-base-800',
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-[0.5rem] text-ink-500">?</span>
      )}
    </span>
  )
}
