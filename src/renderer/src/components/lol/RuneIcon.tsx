import { useState } from 'react'
import { runeIconUrl } from '@renderer/lib/icons'
import { cn } from '@renderer/lib/cn'

export function RuneIcon({
  icon,
  name,
  size = 'md',
  className
}: {
  icon: string | null | undefined
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}): React.JSX.Element {
  const [failed, setFailed] = useState(false)
  const src = icon && !failed ? runeIconUrl(icon) : ''
  const dimensions = {
    xs: 'h-5 w-5',
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-12 w-12'
  }[size]
  return (
    <span
      title={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-line bg-base-800',
        dimensions,
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full rounded-full object-cover"
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
